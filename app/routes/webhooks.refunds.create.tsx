import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { sendDonationReceipt } from "../utils/sendgrid.server";
import { checkFeatureAccess } from "../utils/features";

export const action = async ({ request }: ActionFunctionArgs) => {
    const { shop, admin, payload, topic } = await authenticate.webhook(request);

    if (topic !== "REFUNDS_CREATE") {
        return new Response(null, { status: 400 });
    }

    const refund = payload as any;
    // refund.order_id exists. We need GID for order update
    if (!refund.order_id) return new Response(null, { status: 200 });

    const subscription = await db.planSubscription.findUnique({
        where: { shop },
    });
    const plan = subscription?.plan || "basic";

    const orderIdStr = `gid://shopify/Order/${refund.order_id}`;

    try {
        // ── Check all possible donation tables ──
        let donationFound = false;
        let refundAmount = 0;
        let refundFreq = "Donation";

        // 1. POS Logs
        const posLog = await db.posDonationLog.findFirst({ where: { orderId: orderIdStr } });
        if (posLog) {
            await db.posDonationLog.update({ where: { orderId: orderIdStr }, data: { status: "refunded" } });
            donationFound = true;
            refundAmount = posLog.donationAmount;
            refundFreq = "POS";
        }

        // 2. Recurring Logs (Subscriptions only now)
        const recLog = await db.recurringDonationLog.findFirst({ where: { orderId: orderIdStr } });
        if (recLog) {
            await db.recurringDonationLog.update({ where: { orderId: orderIdStr }, data: { status: "refunded" } });
            donationFound = true;
            refundAmount = recLog.donationAmount;
            refundFreq = recLog.frequency === "weekly" ? "Weekly" : "Monthly";
        }

        // 3. Round-Up Logs
        const roundLog = await db.roundUpDonationLog.findFirst({ where: { orderId: orderIdStr } });
        if (roundLog) {
            await db.roundUpDonationLog.update({ where: { orderId: orderIdStr }, data: { status: "refunded" } });
            donationFound = true;
            refundAmount = roundLog.donationAmount;
            refundFreq = "Round-Up";
        }

        // 4. Preset / One-Time Global (Unified)
        const presetLogs = await db.donation.findMany({ where: { orderId: refund.order_id.toString() } });
        if (presetLogs.length > 0) {
            await db.donation.updateMany({ where: { orderId: refund.order_id.toString() }, data: { status: "refunded" } });
            donationFound = true;
            refundAmount = presetLogs.reduce((sum, d) => sum + d.amount, 0);
            refundFreq = "Preset";
        }

        if (donationFound) {
            if (admin) {
                // We need to fetch the order details first to get email/name
                const orderResponse = await admin.graphql(
                    `#graphql
          query getOrder($id: ID!) {
            order(id: $id) {
              id
              name
              email
              tags
              billingAddress {
                firstName
                lastName
              }
            }
          }`,
                    { variables: { id: orderIdStr } }
                );

                const orderData = await orderResponse.json();
                const order = orderData.data?.order;

                if (order && order.email) {
                    const customerName = order.billingAddress ? `${order.billingAddress.firstName || ""} ${order.billingAddress.lastName || ""}`.trim() : "";
                    try {
                        if (checkFeatureAccess(plan, "canSendRefundEmail")) {
                            await sendDonationReceipt({
                                email: order.email,
                                name: customerName,
                                amount: refundAmount.toFixed(2),
                                orderNumber: order.name,
                                type: "refund",
                                shop,
                                frequency: refundFreq
                            });
                        } else {
                            console.log(`[Webhook] Refund email skipped for ${shop} - Plan restriction: ${plan}`);
                        }
                    } catch (emailErr) {
                        console.error("Failed to send refund email:", emailErr);
                    }
                }

                const existingTags = order?.tags || [];

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
                        console.error("Order refund tags update errors:", updateData.data.orderUpdate.userErrors);
                    }
                }
            }
        } catch (err) {
        console.error("Error processing refunds/create webhook:", err);
    }

    return new Response("OK", { status: 200 });
};
