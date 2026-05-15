import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const action = async ({ request }: ActionFunctionArgs) => {
    const { shop, topic, payload } = await authenticate.webhook(request);

    console.log(`[SubscriptionContract] ⚡ Webhook received — topic: ${topic}, shop: ${shop}`);

    // Wait 2 seconds to allow ORDERS_CREATE webhook to finish saving the order
    await new Promise(resolve => setTimeout(resolve, 2000));

    if (topic !== "SUBSCRIPTION_CONTRACTS_CREATE") {
        console.warn(`[SubscriptionContract] Unexpected topic: ${topic}`);
        return new Response(null, { status: 400 });
    }

    try {
        const contract = payload as any;
        const contractId: string = contract.admin_graphql_api_id || `gid://shopify/SubscriptionContract/${contract.id}`;

        console.log(`[SubscriptionContract] Processing contract: ${contractId}`);
        console.log(`[SubscriptionContract] Status: ${contract.status}, Currency: ${contract.currencyCode}`);
        console.log(`[SubscriptionContract] Next billing: ${contract.nextBillingDate}`);
        console.log(`[SubscriptionContract] Customer ID: ${contract.customer?.admin_graphql_api_id || contract.customer_id || "N/A"}`);

        // Try to find the donation log associated with the first order
        // The contract payload includes origin_order info
        const originOrderId = contract.origin_order_id ? `gid://shopify/Order/${contract.origin_order_id}` : null;
        const originOrderName = contract.origin_order?.name || null;

        console.log(`[SubscriptionContract] Attempting link — GID: ${originOrderId}, Name: ${originOrderName}`);

        let linked = false;

        // 1. Try matching by Global ID
        if (originOrderId) {
            const updateResult = await db.recurringDonationLog.updateMany({
                where: { shop, orderId: originOrderId },
                data: { subscriptionContractId: contractId },
            });
            if (updateResult.count > 0) {
                console.log(`[SubscriptionContract] ✅ Linked by GID: ${originOrderId}`);
                linked = true;
            }
        }

        // 2. Try matching by Order Number (e.g. #1005) if still not linked
        if (!linked && originOrderName) {
            const updateResult = await db.recurringDonationLog.updateMany({
                where: { shop, orderNumber: originOrderName },
                data: { subscriptionContractId: contractId },
            });
            if (updateResult.count > 0) {
                console.log(`[SubscriptionContract] ✅ Linked by Name: ${originOrderName}`);
                linked = true;
            }
        }

        if (linked) {
            // Also create/update the subscription record for reminders
            try {
                // ... (rest of the logic remains same but improved)
                const lines = contract.lines || [];
                const frequency = lines[0]?.selling_plan_name?.toLowerCase().includes("week") ? "weekly" : "monthly";
                const amount = parseFloat(contract.next_billing_cycle_details?.billing_attempt_expected_amount || "0");

                await db.subscription.upsert({
                    where: { orderId: originOrderName || originOrderId || contractId },
                    create: {
                        shop,
                        customerId: contract.customer_id ? `gid://shopify/Customer/${contract.customer_id}` : "",
                        orderId: originOrderName || originOrderId || contractId,
                        status: "active",
                        frequency: frequency,
                        amount: amount,
                        currency: contract.currency_code || "USD",
                        nextBillingDate: new Date(contract.next_billing_date),
                    },
                    update: {
                        status: "active",
                        nextBillingDate: new Date(contract.next_billing_date),
                    }
                });
            } catch (subErr) {
                console.error("[SubscriptionContract] Error updating reminders table:", subErr);
            }
        } else {
            console.warn(`[SubscriptionContract] ⚠️ Could not link contract ${contractId} to any existing donation log.`);
        }
    } catch (err) {
        console.error("[SubscriptionContract] Create webhook error:", err);
    }

    return new Response("OK", { status: 200 });
};
