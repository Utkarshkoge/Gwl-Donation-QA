import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { sendDonationReceipt } from "../utils/sendgrid.server";
import { checkFeatureAccess } from "../utils/features";

export const action = async ({ request }: ActionFunctionArgs) => {
    const { shop, admin, payload, topic } = await authenticate.webhook(request);

    if (topic !== "ORDERS_CANCELLED") {
        return new Response(null, { status: 400 });
    }

    const order = payload as any;
    const orderIdStr = order.admin_graphql_api_id || `gid://shopify/Order/${order.id}`;

    const subscription = await db.planSubscription.findUnique({
        where: { shop },
    });
    const plan = subscription?.plan || "basic";

    try {
        // ── Check all possible donation tables ──
        let donationFound = false;
        let cancelAmount = 0;
        let cancelFreq = "Donation";
        let cancelOrderNumber = order.name || "";

        // 1. POS Logs
        const posLog = await db.posDonationLog.findFirst({ where: { orderId: orderIdStr } });
        if (posLog) {
            await db.posDonationLog.update({ where: { orderId: orderIdStr }, data: { status: "cancelled" } });
            donationFound = true;
            cancelAmount = posLog.donationAmount;
            cancelFreq = "POS";
            cancelOrderNumber = posLog.orderNumber || cancelOrderNumber;
        }

        // 2. Recurring Logs (Subscriptions only now)
        const recLog = await db.recurringDonationLog.findFirst({ where: { orderId: orderIdStr } });
        if (recLog) {
            await db.recurringDonationLog.update({ where: { orderId: orderIdStr }, data: { status: "cancelled" } });
            donationFound = true;
            cancelAmount = recLog.donationAmount;
            cancelFreq = recLog.frequency === "weekly" ? "Weekly" : "Monthly";
            cancelOrderNumber = recLog.orderNumber || cancelOrderNumber;
        }

        // 3. Round-Up Logs
        const roundLog = await db.roundUpDonationLog.findFirst({ where: { orderId: orderIdStr } });
        if (roundLog) {
            await db.roundUpDonationLog.update({ where: { orderId: orderIdStr }, data: { status: "cancelled" } });
            donationFound = true;
            cancelAmount = roundLog.donationAmount;
            cancelFreq = "Round-Up";
            cancelOrderNumber = roundLog.orderNumber || cancelOrderNumber;
        }

        // 4. Preset / One-Time Global (Unified)
        const presetLogs = await db.donation.findMany({ where: { orderId: order.id.toString() } });
        if (presetLogs.length > 0) {
            await db.donation.updateMany({ where: { orderId: order.id.toString() }, data: { status: "cancelled" } });
            donationFound = true;
            cancelAmount = presetLogs.reduce((sum, d) => sum + d.amount, 0);
            cancelFreq = "Preset";
            cancelOrderNumber = presetLogs[0].orderNumber || cancelOrderNumber;
        }

        if (donationFound) {
            // Trigger Cancellation Email
            try {
                const customerEmail = order.email || order.contact_email || order.customer?.email;
                const customerName = order.customer ? `${order.customer.first_name || ""} ${order.customer.last_name || ""}`.trim() : (order.billing_address?.name || "");

                if (customerEmail) {
                    if (checkFeatureAccess(plan, "canSendCancelEmail")) {
                        await sendDonationReceipt({
                            email: customerEmail,
                            name: customerName,
                            amount: cancelAmount.toFixed(2),
                            orderNumber: cancelOrderNumber,
                            type: "cancellation",
                            shop,
                            frequency: cancelFreq
                        });
                    } else {
                        console.log(`[Webhook] Cancellation email skipped for ${shop} - Plan restriction: ${plan}`);
                    }
                }
            } catch (emailErr) {
                console.error("Failed to send cancellation email:", emailErr);
            }

            if (admin) {
                const existingTags = order.tags ? order.tags.split(',').map((t: string) => t.trim()) : [];
                if (!existingTags.includes("donation_refunded")) {
                    existingTags.push("donation_refunded");
                }
                if (!existingTags.includes("Refunded")) {
                    existingTags.push("Refunded");
                }

                const input = {
                    id: orderIdStr,
                    tags: existingTags.join(","),
                };

                const updateResponse = await admin.graphql(
                    `#graphql
          mutation orderUpdate($input: OrderInput!) {
            orderUpdate(input: $input) {
              order {
                id
                tags
              }
              userErrors {
                field
                message
              }
            }
          }`,
                    { variables: { input } }
                );

                const updateData = await updateResponse.json();
                if (updateData.data?.orderUpdate?.userErrors?.length > 0) {
                    console.error("Order cancel tags update errors:", updateData.data.orderUpdate.userErrors);
                }
            }
        }
    } catch (err) {
        console.error("Error processing orders/cancelled webhook:", err);
    }

    return new Response("OK", { status: 200 });
};
