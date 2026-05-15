import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const action = async ({ request }: ActionFunctionArgs) => {
    const { shop, topic, payload } = await authenticate.webhook(request);

    console.log(`[SubscriptionContract] ⚡ Webhook received — topic: ${topic}, shop: ${shop}`);

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
        const originOrderId = contract.origin_order?.admin_graphql_api_id
            || (contract.origin_order_id ? `gid://shopify/Order/${contract.origin_order_id}` : null);

        console.log(`[SubscriptionContract] Origin order: ${originOrderId || "NONE"}`);

        if (originOrderId) {
            const updateResult = await db.recurringDonationLog.updateMany({
                where: { shop, orderId: originOrderId },
                data: {
                    subscriptionContractId: contractId,
                },
            });
            console.log(`[SubscriptionContract] Linked contract ${contractId} to order ${originOrderId} (${updateResult.count} records updated)`);

            // Also create/update the subscription record for reminders
            try {
                const lines = contract.lines?.edges?.map((e: any) => e.node) || [];
                const totalAmount = lines.reduce((sum: number, line: any) => {
                    return sum + (parseFloat(line.currentPrice?.amount ?? "0") * (line.quantity ?? 1));
                }, 0);
                const currency = contract.currencyCode || lines[0]?.currentPrice?.currencyCode || "USD";
                const frequency = lines[0]?.sellingPlanName?.toLowerCase().includes("month") ? "monthly" : "weekly";

                await db.subscription.upsert({
                    where: { orderId: contract.origin_order?.name || originOrderId },
                    create: {
                        shop,
                        customerId: contract.customer?.admin_graphql_api_id || "",
                        orderId: contract.origin_order?.name || originOrderId,
                        status: "active",
                        frequency: frequency,
                        amount: totalAmount,
                        currency: currency,
                        nextBillingDate: new Date(contract.nextBillingDate),
                    },
                    update: {
                        status: "active",
                        nextBillingDate: new Date(contract.nextBillingDate),
                    }
                });
                console.log(`[SubscriptionContract] ✅ Subscription record upserted for order ${contract.origin_order?.name || originOrderId}`);
            } catch (subErr) {
                console.error("[SubscriptionContract] Error creating subscription record:", subErr);
            }

            // Also update CustomerSubscription if it exists
            try {
                await db.customerSubscription.updateMany({
                    where: { shop, orderId: originOrderId },
                    data: { subscriptionId: contractId, status: "active" },
                });
            } catch (csErr) {
                // Non-fatal: CustomerSubscription may not exist for all orders
                console.warn("[SubscriptionContract] CustomerSubscription update skipped:", (csErr as any).message);
            }
        } else {
            console.log(`[SubscriptionContract] Created contract ${contractId} — no origin order to link`);
        }
    } catch (err) {
        console.error("[SubscriptionContract] Create webhook error:", err);
    }

    return new Response("OK", { status: 200 });
};
