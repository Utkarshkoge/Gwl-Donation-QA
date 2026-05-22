import type { LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import PDFDocument from "pdfkit";

export const loader = async ({ request }: LoaderFunctionArgs) => {
    const url = new URL(request.url);
    const logId = url.searchParams.get("logId");
    const donationId = url.searchParams.get("donationId");

    if (!logId && !donationId) {
        return new Response("Missing logId or donationId parameter", { status: 400 });
    }

    let admin, session;
    try {
        const auth = await authenticate.admin(request);
        admin = auth.admin;
        session = auth.session;
    } catch (authError) {
        console.warn("[DownloadReceipt] Standard auth failed, trying HTTPS wrapper...", authError);
        const secureUrl = new URL(request.url);
        secureUrl.protocol = "https:";
        const secureRequest = new Request(secureUrl.toString(), {
            headers: request.headers,
            method: request.method,
        });
        const auth = await authenticate.admin(secureRequest);
        admin = auth.admin;
        session = auth.session;
    }

    const shop = session.shop;

    try {
        let customerName = "";
        let customerEmail = "";
        let orderNumber = "";
        let donationAmount = "0.00";
        let donationType = "Donation";
        let frequency = "One-time";
        let createdDate = new Date();
        let campaignName = "";
        let shippingAddress = "";
        let billingAddress = "";
        let currencySymbol = "$";

        if (donationId) {
            // Legacy donation record
            const donation = await prisma.donation.findUnique({
                where: { id: donationId },
                include: { campaign: true },
            });

            if (!donation) {
                return new Response("Donation not found", { status: 404 });
            }

            customerName = donation.donorName || "Generous Donor";
            customerEmail = donation.donorEmail || "";
            orderNumber = donation.orderId || "N/A";
            donationAmount = (donation.amount || 0).toFixed(2);
            donationType = "Preset";
            campaignName = donation.campaign?.name || "Donation";
            createdDate = donation.createdAt;
        } else if (logId) {
            // Check all log tables
            let log: any = null;
            let logType: 'pos' | 'recurring' | 'roundup' | 'preset' = 'pos';

            log = await prisma.posDonationLog.findUnique({ where: { id: logId } });

            if (!log) {
                log = await (prisma as any).recurringDonationLog.findUnique({ where: { id: logId } });
                if (log) logType = 'recurring';
            }

            if (!log) {
                log = await (prisma as any).roundUpDonationLog.findUnique({ where: { id: logId } });
                if (log) logType = 'roundup';
            }

            // Check preset Donation table
            let presetDonation: any = null;
            if (!log) {
                presetDonation = await prisma.donation.findUnique({
                    where: { id: logId },
                    include: { campaign: true },
                });
                if (presetDonation) logType = 'preset';
            }

            if (!log && !presetDonation) {
                return new Response("Record not found", { status: 404 });
            }

            // Get order details from Shopify
            let orderIdForQuery = presetDonation
                ? presetDonation.orderId
                : log?.orderId;

            if (orderIdForQuery && !orderIdForQuery.startsWith("gid://")) {
                orderIdForQuery = `gid://shopify/Order/${orderIdForQuery}`;
            }

            if (orderIdForQuery) {
                try {
                    const orderResponse = await admin.graphql(
                        `#graphql
                        query getOrder($id: ID!) {
                            order(id: $id) {
                                name
                                email
                                billingAddress {
                                    firstName
                                    lastName
                                    name
                                    address1
                                    address2
                                    city
                                    provinceCode
                                    zip
                                    country
                                }
                                shippingAddress {
                                    name
                                    address1
                                    address2
                                    city
                                    provinceCode
                                    zip
                                    country
                                }
                            }
                        }`,
                        { variables: { id: orderIdForQuery } }
                    );
                    const orderData = await orderResponse.json();
                    const order = orderData.data?.order;

                    if (order) {
                        orderNumber = order.name || orderNumber;
                        customerEmail = order.email || "";
                        customerName = order.billingAddress
                            ? `${order.billingAddress.firstName || ""} ${order.billingAddress.lastName || ""}`.trim()
                            : "";

                        if (order.shippingAddress) {
                            const sa = order.shippingAddress;
                            shippingAddress = [
                                sa.name,
                                sa.address1,
                                sa.address2,
                                `${sa.city}, ${sa.provinceCode || ""} ${sa.zip}`,
                                sa.country
                            ].filter(Boolean).join("\n");
                        }

                        if (order.billingAddress) {
                            const ba = order.billingAddress;
                            billingAddress = [
                                ba.name,
                                ba.address1,
                                ba.address2,
                                `${ba.city}, ${ba.provinceCode || ""} ${ba.zip}`,
                                ba.country
                            ].filter(Boolean).join("\n");
                        }
                    }
                } catch (orderError) {
                    console.warn("[DownloadReceipt] Could not fetch order details:", orderError);
                }
            }

            if (presetDonation) {
                donationAmount = (presetDonation.amount || 0).toFixed(2);
                donationType = "Preset";
                campaignName = presetDonation.campaign?.name || "Preset Donation";
                createdDate = presetDonation.createdAt;
                orderNumber = presetDonation.orderNumber || orderNumber || "N/A";
            } else if (log) {
                donationAmount = (log.donationAmount || 0).toFixed(2);
                createdDate = log.createdAt;
                orderNumber = log.orderNumber || orderNumber || "N/A";

                if (logType === 'recurring') {
                    frequency = log.frequency === "weekly" ? "Weekly" : log.frequency === "monthly" ? "Monthly" : "One-time";
                    donationType = frequency !== "One-time" ? `Recurring (${frequency})` : "One-time";
                } else if (logType === 'roundup') {
                    donationType = "Round Up";
                } else {
                    donationType = "POS";
                }
            }
        }

        // Generate PDF
        const pdfBuffer = await generateReceiptPDF({
            shopName: shop.replace(".myshopify.com", ""),
            customerName: customerName || "Valued Donor",
            customerEmail,
            orderNumber,
            donationAmount,
            donationType,
            frequency,
            campaignName,
            createdDate,
            shippingAddress,
            billingAddress,
            currencySymbol,
        });

        const filename = `receipt-${orderNumber.replace(/[^a-zA-Z0-9]/g, "")}-${new Date(createdDate).toISOString().split("T")[0]}.pdf`;

        return new Response(pdfBuffer, {
            status: 200,
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="${filename}"`,
                "Content-Length": String(pdfBuffer.length),
            },
        });

    } catch (error: any) {
        console.error("[DownloadReceipt] Fatal error:", error);
        return new Response("Failed to generate receipt: " + error.message, { status: 500 });
    }
};

interface ReceiptPDFArgs {
    shopName: string;
    customerName: string;
    customerEmail: string;
    orderNumber: string;
    donationAmount: string;
    donationType: string;
    frequency: string;
    campaignName: string;
    createdDate: Date;
    shippingAddress: string;
    billingAddress: string;
    currencySymbol: string;
}

async function generateReceiptPDF(args: ReceiptPDFArgs): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({
            size: "A4",
            margin: 50,
            info: {
                Title: `Donation Receipt - ${args.orderNumber}`,
                Author: args.shopName,
                Subject: "Donation Receipt",
            },
        });

        const buffers: Buffer[] = [];
        doc.on("data", (chunk: Buffer) => buffers.push(chunk));
        doc.on("end", () => resolve(Buffer.concat(buffers)));
        doc.on("error", reject);

        const pageWidth = doc.page.width - 100; // 50px margin each side
        const brandColor = "#6C4A79";
        const darkColor = "#202223";
        const grayColor = "#6D7175";
        const lightGray = "#F4F4F4";
        const formattedDate = new Date(args.createdDate).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });

        // ─── Header ───
        doc
            .rect(0, 0, doc.page.width, 120)
            .fill(brandColor);

        doc
            .fontSize(28)
            .font("Helvetica-Bold")
            .fillColor("#FFFFFF")
            .text("DONATION RECEIPT", 50, 40, { width: pageWidth });

        doc
            .fontSize(11)
            .font("Helvetica")
            .fillColor("#E8D5EF")
            .text(args.shopName.charAt(0).toUpperCase() + args.shopName.slice(1), 50, 78, { width: pageWidth });

        doc
            .fontSize(10)
            .fillColor("#E8D5EF")
            .text(`Date: ${formattedDate}`, 50, 94, { width: pageWidth, align: "right" });

        // ─── Receipt Info Bar ───
        let y = 140;

        doc.rect(50, y, pageWidth, 36).fill(lightGray);
        doc
            .fontSize(10)
            .font("Helvetica-Bold")
            .fillColor(darkColor)
            .text(`Order: ${args.orderNumber}`, 62, y + 11)
            .text(`Type: ${args.donationType}`, 300, y + 11);

        y += 56;

        // ─── Donor Details Section ───
        doc
            .fontSize(12)
            .font("Helvetica-Bold")
            .fillColor(brandColor)
            .text("DONOR INFORMATION", 50, y);

        y += 20;

        doc.moveTo(50, y).lineTo(50 + pageWidth, y).strokeColor("#E0E0E0").lineWidth(1).stroke();
        y += 12;

        // Donor rows
        const addInfoRow = (label: string, value: string) => {
            doc
                .fontSize(10)
                .font("Helvetica-Bold")
                .fillColor(grayColor)
                .text(label, 50, y, { width: 140 });
            doc
                .fontSize(10)
                .font("Helvetica")
                .fillColor(darkColor)
                .text(value || "N/A", 200, y, { width: pageWidth - 150 });
            y += 20;
        };

        addInfoRow("Name:", args.customerName);
        if (args.customerEmail) {
            addInfoRow("Email:", args.customerEmail);
        }

        y += 10;

        // ─── Donation Details Section ───
        doc
            .fontSize(12)
            .font("Helvetica-Bold")
            .fillColor(brandColor)
            .text("DONATION DETAILS", 50, y);

        y += 20;

        doc.moveTo(50, y).lineTo(50 + pageWidth, y).strokeColor("#E0E0E0").lineWidth(1).stroke();
        y += 12;

        if (args.campaignName) {
            addInfoRow("Campaign:", args.campaignName);
        }
        addInfoRow("Donation Type:", args.donationType);
        if (args.frequency && args.frequency !== "One-time") {
            addInfoRow("Frequency:", args.frequency);
        }
        addInfoRow("Date:", formattedDate);

        y += 6;

        // ─── Amount Box ───
        doc.rect(50, y, pageWidth, 60).fill("#F8F0FC");
        doc.rect(50, y, 4, 60).fill(brandColor);

        doc
            .fontSize(11)
            .font("Helvetica")
            .fillColor(grayColor)
            .text("DONATION AMOUNT", 70, y + 12);

        doc
            .fontSize(26)
            .font("Helvetica-Bold")
            .fillColor(brandColor)
            .text(`${args.currencySymbol}${args.donationAmount}`, 70, y + 30);

        y += 80;

        // ─── Addresses ───
        if (args.billingAddress || args.shippingAddress) {
            doc
                .fontSize(12)
                .font("Helvetica-Bold")
                .fillColor(brandColor)
                .text("ADDRESS DETAILS", 50, y);

            y += 20;
            doc.moveTo(50, y).lineTo(50 + pageWidth, y).strokeColor("#E0E0E0").lineWidth(1).stroke();
            y += 12;

            const colWidth = (pageWidth - 20) / 2;

            if (args.billingAddress) {
                doc
                    .fontSize(9)
                    .font("Helvetica-Bold")
                    .fillColor(grayColor)
                    .text("BILLING ADDRESS", 50, y);

                doc
                    .fontSize(10)
                    .font("Helvetica")
                    .fillColor(darkColor)
                    .text(args.billingAddress, 50, y + 14, { width: colWidth });
            }

            if (args.shippingAddress) {
                doc
                    .fontSize(9)
                    .font("Helvetica-Bold")
                    .fillColor(grayColor)
                    .text("SHIPPING ADDRESS", 50 + colWidth + 20, y);

                doc
                    .fontSize(10)
                    .font("Helvetica")
                    .fillColor(darkColor)
                    .text(args.shippingAddress, 50 + colWidth + 20, y + 14, { width: colWidth });
            }

            y += 80;
        }

        // ─── Thank You Footer ───
        y = Math.max(y, 620);
        doc.moveTo(50, y).lineTo(50 + pageWidth, y).strokeColor("#E0E0E0").lineWidth(1).stroke();
        y += 20;

        doc
            .fontSize(14)
            .font("Helvetica-Bold")
            .fillColor(brandColor)
            .text("Thank you for your generous donation!", 50, y, { width: pageWidth, align: "center" });

        y += 24;

        doc
            .fontSize(9)
            .font("Helvetica")
            .fillColor(grayColor)
            .text(
                "This receipt is for your records. Please retain it for tax purposes. If you have any questions about your donation, please contact us.",
                50,
                y,
                { width: pageWidth, align: "center" }
            );

        y += 30;

        doc
            .fontSize(8)
            .font("Helvetica")
            .fillColor("#AAAAAA")
            .text(`Generated on ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, 50, y, {
                width: pageWidth,
                align: "center",
            });

        doc.end();
    });
}
