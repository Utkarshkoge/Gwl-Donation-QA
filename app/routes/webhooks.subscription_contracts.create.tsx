import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const action = async ({ request }: ActionFunctionArgs) => {
    const { shop, topic, payload } = await authenticate.webhook(request);

    if (topic !== "SUBSCRIPTION_CONTRACTS_CREATE") {
        return new Response(null, { status: 400 });
    }

    try {
        const contract = payload as any;
        const contractId: string = contract.admin_graphql_api_id || `gid://shopify/SubscriptionContract/${contract.id}`;

        // Try to find the donation log associated with the first order
        // The contract payload includes origin_order info
        const originOrderId = contract.origin_order?.admin_graphql_api_id
            || (contract.origin_order_id ? `gid://shopify/Order/${contract.origin_order_id}` : null);

        if (originOrderId) {
            await db.recurringDonationLog.updateMany({
                where: { shop, orderId: originOrderId },
                data: {
                    subscriptionContractId: contractId,
                },
            });
            console.log(`[SubscriptionContract] Linked contract ${contractId} to order ${originOrderId}`);

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
            } catch (subErr) {
                console.error("[SubscriptionContract] Error creating subscription record:", subErr);
            }
        } else {
            console.log(`[SubscriptionContract] Created contract ${contractId} — no origin order to link`);
        }
    } catch (err) {
        console.error("[SubscriptionContract] Create webhook error:", err);
    }

    return new Response("OK", { status: 200 });
};
