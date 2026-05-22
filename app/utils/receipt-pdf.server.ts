import PDFDocument from "pdfkit";

export interface ReceiptPDFArgs {
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

export async function generateReceiptPDF(args: ReceiptPDFArgs): Promise<Buffer> {
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

        const pageWidth = doc.page.width - 100;
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
        doc.rect(0, 0, doc.page.width, 120).fill(brandColor);

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

        const addInfoRow = (label: string, value: string) => {
            doc.fontSize(10).font("Helvetica-Bold").fillColor(grayColor).text(label, 50, y, { width: 140 });
            doc.fontSize(10).font("Helvetica").fillColor(darkColor).text(value || "N/A", 200, y, { width: pageWidth - 150 });
            y += 20;
        };

        addInfoRow("Name:", args.customerName);
        if (args.customerEmail) {
            addInfoRow("Email:", args.customerEmail);
        }

        y += 10;

        // ─── Donation Details Section ───
        doc.fontSize(12).font("Helvetica-Bold").fillColor(brandColor).text("DONATION DETAILS", 50, y);
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

        doc.fontSize(11).font("Helvetica").fillColor(grayColor).text("DONATION AMOUNT", 70, y + 12);
        doc.fontSize(26).font("Helvetica-Bold").fillColor(brandColor).text(`${args.currencySymbol}${args.donationAmount}`, 70, y + 30);

        y += 80;

        // ─── Addresses ───
        if (args.billingAddress || args.shippingAddress) {
            doc.fontSize(12).font("Helvetica-Bold").fillColor(brandColor).text("ADDRESS DETAILS", 50, y);
            y += 20;
            doc.moveTo(50, y).lineTo(50 + pageWidth, y).strokeColor("#E0E0E0").lineWidth(1).stroke();
            y += 12;

            const colWidth = (pageWidth - 20) / 2;

            if (args.billingAddress) {
                doc.fontSize(9).font("Helvetica-Bold").fillColor(grayColor).text("BILLING ADDRESS", 50, y);
                doc.fontSize(10).font("Helvetica").fillColor(darkColor).text(args.billingAddress, 50, y + 14, { width: colWidth });
            }

            if (args.shippingAddress) {
                doc.fontSize(9).font("Helvetica-Bold").fillColor(grayColor).text("SHIPPING ADDRESS", 50 + colWidth + 20, y);
                doc.fontSize(10).font("Helvetica").fillColor(darkColor).text(args.shippingAddress, 50 + colWidth + 20, y + 14, { width: colWidth });
            }

            y += 80;
        }

        // ─── Thank You Footer ───
        y = Math.max(y, 620);
        doc.moveTo(50, y).lineTo(50 + pageWidth, y).strokeColor("#E0E0E0").lineWidth(1).stroke();
        y += 20;

        doc.fontSize(14).font("Helvetica-Bold").fillColor(brandColor)
            .text("Thank you for your generous donation!", 50, y, { width: pageWidth, align: "center" });
        y += 24;

        doc.fontSize(9).font("Helvetica").fillColor(grayColor)
            .text("This receipt is for your records. Please retain it for tax purposes. If you have any questions about your donation, please contact us.", 50, y, { width: pageWidth, align: "center" });
        y += 30;

        doc.fontSize(8).font("Helvetica").fillColor("#AAAAAA")
            .text(`Generated on ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, 50, y, { width: pageWidth, align: "center" });

        doc.end();
    });
}
