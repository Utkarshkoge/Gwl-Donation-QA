import type { LoaderFunctionArgs } from "react-router";
import { unauthenticated } from "../shopify.server";
import db from "../db.server";

/**
 * ─── Automatic Subscription Billing Cron Job ────────────────────────────────
 *
 * This endpoint should be called on a schedule (e.g., every hour or every 30 mins)
 * by an external cron service (Railway Cron, cron-job.org, EasyCron, etc.).
 *
 * It queries all active Shopify Subscription Contracts whose nextBillingDate
 * has passed and triggers a billing attempt for each one via the
 * subscriptionBillingAttemptCreate GraphQL mutation.
 *
 * URL: GET /api/cron/billing?secret=YOUR_CRON_SECRET
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const loader = async ({ request }: LoaderFunctionArgs) => {
    const url = new URL(request.url);
    const secret = url.searchParams.get("secret");
    const cronSecret = process.env.CRON_SECRET || "galaxy_reminder_secret_123";

    if (secret !== cronSecret) {
        return new Response("Unauthorized", { status: 401 });
    }

    const startTime = new Date();
    console.log(`[CronBilling] ─── Starting automatic billing check at ${startTime.toISOString()} ───`);

    const results = {
        shopsProcessed: 0,
        contractsFound: 0,
        billingTriggered: 0,
        billingSucceeded: 0,
        billingPending: 0,
        billingFailed: 0,
        skipped: 0,
        errors: [] as string[],
    };

    try {
        // 1. Get all shops with active sessions
        const shops = await db.session.findMany({
            distinct: ["shop"],
            select: { shop: true },
        });

        console.log(`[CronBilling] Found ${shops.length} shops to process.`);

        for (const { shop } of shops) {
            try {
                // 2. Get unauthenticated admin client for this shop
                const { admin } = await unauthenticated.admin(shop);
                results.shopsProcessed++;

                // 3. Query active subscription contracts with nextBillingDate in the past
                const now = new Date();

                const response = await admin.graphql(
                    `#graphql
                    query getDueSubscriptionContracts($first: Int!, $query: String!) {
                        subscriptionContracts(first: $first, query: $query) {
                            edges {
                                node {
                                    id
                                    status
                                    nextBillingDate
                                    currencyCode
                                    customer {
                                        email
                                        firstName
                                        lastName
                                    }
                                    lines(first: 1) {
                                        edges {
                                            node {
                                                title
                                                sellingPlanName
                                                currentPrice {
                                                    amount
                                                }
                                            }
                                        }
                                    }
                                    originOrder {
                                        id
                                        name
                                    }
                                }
                            }
                        }
                    }`,
                    {
                        variables: {
                            first: 50,
                            query: "status:active",
                        },
                    }
                );

                const json: any = await response.json();

                if (json.errors && json.errors.length > 0) {
                    const errMsg = json.errors.map((e: any) => e.message).join("; ");
                    console.error(`[CronBilling] GraphQL errors for ${shop}: ${errMsg}`);
                    results.errors.push(`${shop}: ${errMsg}`);
                    continue;
                }

                const contracts = json.data?.subscriptionContracts?.edges || [];

                // 4. Filter contracts whose nextBillingDate <= now
                const dueContracts = contracts.filter((edge: any) => {
                    const nextBilling = edge.node.nextBillingDate;
                    if (!nextBilling) return false;
                    return new Date(nextBilling) <= now;
                });

                if (dueContracts.length === 0) {
                    console.log(`[CronBilling] ${shop}: No due contracts found.`);
                    continue;
                }

                console.log(`[CronBilling] ${shop}: Found ${dueContracts.length} due contract(s) out of ${contracts.length} active.`);
                results.contractsFound += dueContracts.length;

                // 5. Process each due contract
                for (const edge of dueContracts) {
                    const contract = edge.node;
                    const contractId = contract.id;
                    const numericId = contractId.split("/").pop();

                    try {
                        // Check if we already triggered a billing attempt for this contract recently
                        // (within last 30 minutes) to avoid duplicate charges
                        const recentAttempt = await db.billingAttemptLog.findFirst({
                            where: {
                                shop,
                                subscriptionContractId: contractId,
                                source: "cron_billing",
                                createdAt: {
                                    gte: new Date(now.getTime() - 30 * 60 * 1000), // 30 mins ago
                                },
                            },
                        });

                        if (recentAttempt) {
                            console.log(`[CronBilling] ${shop}: Skipping contract #${numericId} — already attempted within 30 mins (${recentAttempt.id}).`);
                            results.skipped++;
                            continue;
                        }

                        // Also check if there is an active payment recovery in progress
                        const activeRecovery = await db.paymentRecoveryLog.findUnique({
                            where: {
                                shop_subscriptionContractId: {
                                    shop,
                                    subscriptionContractId: contractId,
                                },
                            },
                        });

                        if (activeRecovery && (activeRecovery.status === "pending" || activeRecovery.status === "retrying")) {
                            console.log(`[CronBilling] ${shop}: Skipping contract #${numericId} — active recovery in progress (status: ${activeRecovery.status}).`);
                            results.skipped++;
                            continue;
                        }

                        // Extract contract details for logging
                        const customer = contract.customer;
                        const line = contract.lines?.edges?.[0]?.node;
                        const amount = parseFloat(line?.currentPrice?.amount || "0");
                        const currency = contract.currencyCode || "USD";
                        const donationName = line?.title || "Recurring Donation";
                        const frequency = line?.sellingPlanName || "Subscription";
                        const customerEmail = customer?.email || "";
                        const customerName = `${customer?.firstName || ""} ${customer?.lastName || ""}`.trim() || "Customer";
                        const originOrder = contract.originOrder;

                        // 6. Trigger billing attempt
                        const idempotencyKey = `cron_billing_${numericId}_${now.getTime()}`;

                        console.log(`[CronBilling] ${shop}: Triggering billing for contract #${numericId} (${donationName}, ${currency} ${amount})`);

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
                                        errorCode
                                        errorMessage
                                        order {
                                            id
                                            name
                                        }
                                    }
                                    userErrors {
                                        field
                                        message
                                    }
                                }
                            }`,
                            {
                                variables: {
                                    contractId,
                                    input: {
                                        idempotencyKey,
                                        originTime: now.toISOString(),
                                    },
                                },
                            }
                        );

                        const billingJson: any = await billingResponse.json();
                        const billingResult = billingJson.data?.subscriptionBillingAttemptCreate;

                        // Handle userErrors
                        if (billingResult?.userErrors?.length > 0) {
                            const errMsg = billingResult.userErrors.map((e: any) => e.message).join("; ");
                            console.error(`[CronBilling] ${shop}: UserError for contract #${numericId}: ${errMsg}`);

                            // Log the failed attempt
                            await db.billingAttemptLog.create({
                                data: {
                                    shop,
                                    subscriptionContractId: contractId,
                                    billingAttemptId: null,
                                    source: "cron_billing",
                                    status: "failed",
                                    errorMessage: errMsg,
                                    customerEmail,
                                    customerName,
                                    amount,
                                    currency,
                                    donationName,
                                    frequency,
                                    idempotencyKey,
                                    rawPayload: JSON.stringify(billingJson).substring(0, 4000),
                                },
                            });

                            results.billingFailed++;
                            results.billingTriggered++;
                            continue;
                        }

                        const billingAttempt = billingResult?.subscriptionBillingAttempt;
                        const billingAttemptId = billingAttempt?.id || null;

                        results.billingTriggered++;

                        if (billingAttempt?.order) {
                            // Immediate success (rare — most are async)
                            console.log(`[CronBilling] ${shop}: ✅ Immediate success for #${numericId} → Order ${billingAttempt.order.name}`);

                            await db.billingAttemptLog.create({
                                data: {
                                    shop,
                                    subscriptionContractId: contractId,
                                    billingAttemptId,
                                    source: "cron_billing",
                                    status: "success",
                                    orderId: billingAttempt.order.id,
                                    orderNumber: billingAttempt.order.name,
                                    customerEmail,
                                    customerName,
                                    amount,
                                    currency,
                                    donationName,
                                    frequency,
                                    idempotencyKey,
                                },
                            });

                            results.billingSucceeded++;
                        } else if (billingAttempt?.errorCode || billingAttempt?.errorMessage) {
                            // Immediate failure
                            console.log(`[CronBilling] ${shop}: ❌ Immediate failure for #${numericId}: ${billingAttempt.errorMessage}`);

                            await db.billingAttemptLog.create({
                                data: {
                                    shop,
                                    subscriptionContractId: contractId,
                                    billingAttemptId,
                                    source: "cron_billing",
                                    status: "failed",
                                    errorCode: billingAttempt.errorCode || null,
                                    errorMessage: billingAttempt.errorMessage || null,
                                    customerEmail,
                                    customerName,
                                    amount,
                                    currency,
                                    donationName,
                                    frequency,
                                    idempotencyKey,
                                    rawPayload: JSON.stringify(billingJson).substring(0, 4000),
                                },
                            });

                            results.billingFailed++;
                        } else {
                            // Billing attempt created, processing asynchronously
                            // Result will arrive via SUBSCRIPTION_BILLING_ATTEMPTS_SUCCESS or _FAILURE webhook
                            console.log(`[CronBilling] ${shop}: ⏳ Billing attempt created for #${numericId}, awaiting async result.`);

                            await db.billingAttemptLog.create({
                                data: {
                                    shop,
                                    subscriptionContractId: contractId,
                                    billingAttemptId,
                                    source: "cron_billing",
                                    status: "pending",
                                    customerEmail,
                                    customerName,
                                    amount,
                                    currency,
                                    donationName,
                                    frequency,
                                    idempotencyKey,
                                },
                            });

                            results.billingPending++;
                        }
                    } catch (contractErr: any) {
                        const errMsg = `Contract #${numericId} error: ${contractErr.message || contractErr}`;
                        console.error(`[CronBilling] ${shop}: ${errMsg}`);
                        results.errors.push(`${shop}: ${errMsg}`);
                    }
                }
            } catch (shopErr: any) {
                // Skip shops where we can't get admin access (e.g., uninstalled)
                if (shopErr.message?.includes("Could not find a shop")) {
                    // Silently skip uninstalled shops
                    continue;
                }
                const errMsg = `Shop ${shop} error: ${shopErr.message || shopErr}`;
                console.error(`[CronBilling] ${errMsg}`);
                results.errors.push(errMsg);
            }
        }
    } catch (err: any) {
        console.error("[CronBilling] Fatal error:", err);
        results.errors.push(`Fatal: ${err.message || err}`);
    }

    const elapsed = Date.now() - startTime.getTime();
    console.log(
        `[CronBilling] ─── Complete in ${elapsed}ms. ` +
        `Shops: ${results.shopsProcessed}, ` +
        `Due: ${results.contractsFound}, ` +
        `Triggered: ${results.billingTriggered}, ` +
        `Success: ${results.billingSucceeded}, ` +
        `Pending: ${results.billingPending}, ` +
        `Failed: ${results.billingFailed}, ` +
        `Skipped: ${results.skipped} ───`
    );

    return new Response(
        JSON.stringify({
            success: true,
            ...results,
            elapsedMs: elapsed,
            timestamp: new Date().toISOString(),
        }),
        {
            headers: { "Content-Type": "application/json" },
        }
    );
};
