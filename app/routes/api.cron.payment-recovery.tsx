import type { LoaderFunctionArgs } from "react-router";
import { unauthenticated } from "../shopify.server";
import db from "../db.server";
import { sendDonationReceipt } from "../utils/sendgrid.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
    const url = new URL(request.url);
    const secret = url.searchParams.get("secret");
    const cronSecret = process.env.CRON_SECRET || "galaxy_reminder_secret_123";

    if (secret !== cronSecret) {
        return new Response("Unauthorized", { status: 401 });
    }

    console.log(`[CronRecovery] Starting payment recovery check at ${new Date().toISOString()}`);

    const results = {
        processed: 0,
        recovered: 0,
        retrying: 0,
        exhausted: 0,
        fallbacksExecuted: 0,
        errors: [] as string[],
    };

    try {
        // 1. Find all recovery logs that are due for retry
        const now = new Date();
        const dueRecoveries = await db.paymentRecoveryLog.findMany({
            where: {
                status: { in: ["pending", "retrying"] },
                nextRetryDate: { lte: now },
            },
            orderBy: { nextRetryDate: "asc" },
            take: 50, // Process in batches to avoid timeouts
        });

        console.log(`[CronRecovery] Found ${dueRecoveries.length} due recovery attempts.`);

        for (const recovery of dueRecoveries) {
            results.processed++;

            try {
                // 2. Check if recovery is still enabled for this shop
                const recoverySettings = await db.paymentRecoverySettings.findUnique({
                    where: { shop: recovery.shop },
                });

                if (!recoverySettings?.enabled) {
                    console.log(`[CronRecovery] Recovery disabled for ${recovery.shop}, skipping ${recovery.id}.`);
                    await db.paymentRecoveryLog.update({
                        where: { id: recovery.id },
                        data: { status: "fallback_executed" },
                    });
                    continue;
                }

                // 3. Get admin client for the shop
                const { admin } = await unauthenticated.admin(recovery.shop);

                const fullGid = recovery.subscriptionContractId.startsWith("gid://")
                    ? recovery.subscriptionContractId
                    : `gid://shopify/SubscriptionContract/${recovery.subscriptionContractId}`;

                // 4. Attempt to create a billing attempt via Shopify GraphQL
                console.log(`[CronRecovery] Retrying payment for contract ${fullGid} (attempt ${recovery.retryCount + 1}/${recovery.maxRetries})`);

                const idempotencyKey = `recovery_${recovery.id}_${recovery.retryCount + 1}_${Date.now()}`;

                const billingResponse = await admin.graphql(
                    `#graphql
                    mutation subscriptionBillingAttemptCreate($contractId: ID!, $input: SubscriptionBillingAttemptInput!) {
                        subscriptionBillingAttemptCreate(
                            subscriptionContractId: $contractId
                            subscriptionBillingAttemptInput: $input
                        ) {
                            subscriptionBillingAttempt {
                                id
                                ready
                                errorMessage
                                order { id name }
                            }
                            userErrors {
                                field
                                message
                            }
                        }
                    }`,
                    {
                        variables: {
                            contractId: fullGid,
                            input: {
                                idempotencyKey,
                            },
                        },
                    }
                );

                const billingJson = await billingResponse.json();
                const billingResult = billingJson.data?.subscriptionBillingAttemptCreate;

                if (billingResult?.userErrors?.length > 0) {
                    const errMsg = billingResult.userErrors[0].message;
                    console.error(`[CronRecovery] Billing attempt userError: ${errMsg}`);

                    // Treat as a failed retry
                    await handleRetryFailure(recovery, recoverySettings, errMsg);
                    if (recovery.retryCount + 1 >= recovery.maxRetries) {
                        results.exhausted++;
                        results.fallbacksExecuted++;
                    } else {
                        results.retrying++;
                    }
                    continue;
                }

                const billingAttempt = billingResult?.subscriptionBillingAttempt;

                if (billingAttempt?.order) {
                    // Payment succeeded!
                    console.log(`[CronRecovery] ✅ Payment recovered! Order: ${billingAttempt.order.name}`);

                    await db.paymentRecoveryLog.update({
                        where: { id: recovery.id },
                        data: {
                            status: "recovered",
                            retryCount: recovery.retryCount + 1,
                        },
                    });

                    // Send success notification if enabled
                    if (recoverySettings.sendNotifications && recovery.customerEmail) {
                        try {
                            await sendDonationReceipt({
                                email: recovery.customerEmail,
                                name: recovery.customerName || "Customer",
                                amount: recovery.amount.toFixed(2),
                                orderNumber: billingAttempt.order.name || recovery.orderNumber || "N/A",
                                type: "receipt",
                                shop: recovery.shop,
                                frequency: recovery.frequency?.toLowerCase().includes("month") ? "Monthly" : "Weekly",
                                donationName: recovery.donationName || "Recurring Donation",
                            });
                        } catch (emailErr) {
                            console.error(`[CronRecovery] Failed to send recovery success email:`, emailErr);
                        }
                    }

                    results.recovered++;
                } else if (billingAttempt?.errorMessage) {
                    // Payment failed again
                    console.log(`[CronRecovery] ❌ Retry failed: ${billingAttempt.errorMessage}`);
                    await handleRetryFailure(recovery, recoverySettings, billingAttempt.errorMessage);

                    if (recovery.retryCount + 1 >= recovery.maxRetries) {
                        results.exhausted++;
                        results.fallbacksExecuted++;
                    } else {
                        results.retrying++;
                    }
                } else {
                    // Billing attempt created but not yet ready (async processing)
                    // The result will come via the webhook — just increment retry count
                    console.log(`[CronRecovery] ⏳ Billing attempt created, awaiting result for ${fullGid}`);
                    await db.paymentRecoveryLog.update({
                        where: { id: recovery.id },
                        data: {
                            retryCount: recovery.retryCount + 1,
                            status: "retrying",
                        },
                    });
                    results.retrying++;
                }

            } catch (shopErr: any) {
                const errMsg = `Error processing recovery ${recovery.id} for ${recovery.shop}: ${shopErr.message || shopErr}`;
                console.error(`[CronRecovery] ${errMsg}`);
                results.errors.push(errMsg);
            }
        }

    } catch (err: any) {
        console.error("[CronRecovery] Fatal error:", err);
        results.errors.push(`Fatal: ${err.message || err}`);
    }

    console.log(`[CronRecovery] Complete. Processed: ${results.processed}, Recovered: ${results.recovered}, Retrying: ${results.retrying}, Exhausted: ${results.exhausted}`);

    return new Response(JSON.stringify({
        success: true,
        ...results,
        timestamp: new Date().toISOString(),
    }), {
        headers: { "Content-Type": "application/json" },
    });
};

// ── Handle a failed retry: increment count, schedule next or execute fallback ──
async function handleRetryFailure(
    recovery: any,
    recoverySettings: any,
    errorMessage: string,
) {
    const newRetryCount = recovery.retryCount + 1;

    if (newRetryCount >= recovery.maxRetries) {
        // Retries exhausted — execute fallback action
        console.log(`[CronRecovery] Retries exhausted for ${recovery.subscriptionContractId}. Executing fallback: ${recovery.fallbackAction}`);

        await db.paymentRecoveryLog.update({
            where: { id: recovery.id },
            data: {
                retryCount: newRetryCount,
                errorMessage,
                status: "exhausted",
            },
        });

        await executeFallbackAction(
            recovery.shop,
            recovery.subscriptionContractId,
            recovery.fallbackAction,
            recovery.id,
        );

        // Send exhaustion notification
        if (recoverySettings.sendNotifications && recovery.customerEmail) {
            try {
                await sendDonationReceipt({
                    email: recovery.customerEmail,
                    name: recovery.customerName || "Customer",
                    amount: recovery.amount.toFixed(2),
                    orderNumber: recovery.orderNumber || "N/A",
                    type: "recovery",
                    shop: recovery.shop,
                    frequency: recovery.frequency?.toLowerCase().includes("month") ? "Monthly" : "Weekly",
                    donationName: recovery.donationName || "Recurring Donation",
                    manageUrl: `https://${recovery.shop}/account/subscriptions`,
                });
            } catch (emailErr) {
                console.error(`[CronRecovery] Failed to send exhaustion email:`, emailErr);
            }
        }
    } else {
        // Schedule next retry
        const nextRetryDate = new Date();
        nextRetryDate.setDate(nextRetryDate.getDate() + recovery.retryInterval);

        await db.paymentRecoveryLog.update({
            where: { id: recovery.id },
            data: {
                retryCount: newRetryCount,
                errorMessage,
                nextRetryDate,
                status: "retrying",
            },
        });

        console.log(`[CronRecovery] Scheduled next retry for ${recovery.subscriptionContractId} on ${nextRetryDate.toISOString()}`);
    }
}

// ── Fallback Action Executor ────────────────────────────────────────────────
async function executeFallbackAction(
    shop: string,
    contractId: string,
    fallbackAction: string,
    logId: string,
) {
    if (fallbackAction === "skip") {
        await db.paymentRecoveryLog.update({
            where: { id: logId },
            data: { status: "fallback_executed" },
        });
        console.log(`[CronRecovery] Fallback: skip — subscription stays active for next cycle.`);
        return;
    }

    try {
        const { admin } = await unauthenticated.admin(shop);
        const fullGid = contractId.startsWith("gid://")
            ? contractId
            : `gid://shopify/SubscriptionContract/${contractId}`;

        let mutation = "";
        let mutationName = "";

        if (fallbackAction === "pause") {
            mutation = `mutation { subscriptionContractPause(subscriptionContractId: "${fullGid}") { contract { id status } userErrors { field message } } }`;
            mutationName = "subscriptionContractPause";
        } else if (fallbackAction === "cancel") {
            mutation = `mutation { subscriptionContractCancel(subscriptionContractId: "${fullGid}") { contract { id status } userErrors { field message } } }`;
            mutationName = "subscriptionContractCancel";
        }

        if (mutation) {
            const response = await admin.graphql(mutation);
            const json = await response.json();
            const result = json.data?.[mutationName];

            if (result?.userErrors?.length > 0) {
                console.error(`[CronRecovery] Fallback ${fallbackAction} error:`, result.userErrors[0].message);
            } else {
                console.log(`[CronRecovery] Fallback ${fallbackAction} executed for ${fullGid}`);
            }
        }

        await db.paymentRecoveryLog.update({
            where: { id: logId },
            data: { status: "fallback_executed" },
        });

    } catch (err) {
        console.error(`[CronRecovery] Fallback execution error:`, err);
    }
}
