import type { LoaderFunctionArgs } from "react-router";
import { unauthenticated } from "../shopify.server";
import db from "../db.server";
import { sendDonationReceipt } from "../utils/sendgrid.server";

// Standard messages for testing error codes
const ERROR_MESSAGES: Record<string, string> = {
    CARD_DECLINED: "The credit card was declined by the issuing bank.",
    INSUFFICIENT_FUNDS: "The transaction failed due to insufficient funds in the account.",
    EXPIRED_CARD: "The card has expired. Please update payment details.",
    FRAUD_SUSPECTED: "The transaction was blocked because fraud was suspected.",
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
    const url = new URL(request.url);
    const shop = url.searchParams.get("shop");
    const contractId = url.searchParams.get("contractId");
    const errorCode = url.searchParams.get("errorCode") || "CARD_DECLINED";
    const errorMessage = url.searchParams.get("errorMessage") || ERROR_MESSAGES[errorCode] || "Payment failed";
    const secret = url.searchParams.get("secret");

    const cronSecret = process.env.CRON_SECRET || "galaxy_reminder_secret_123";
    if (secret !== cronSecret) {
        return new Response("Unauthorized - Invalid secret", { status: 401 });
    }

    if (!shop || !contractId) {
        return new Response("Missing required parameters: shop, contractId", { status: 400 });
    }

    const normalizedContractId = contractId.startsWith("gid://")
        ? contractId
        : `gid://shopify/SubscriptionContract/${contractId}`;

    console.log(`[TestFailure] Initiating test payment failure. Shop: ${shop}, Contract: ${normalizedContractId}, ErrorCode: ${errorCode}`);

    try {
        // 1. Fetch merchant's recovery settings
        const recoverySettings = await db.paymentRecoverySettings.findUnique({
            where: { shop },
        });

        // 2. Fetch subscription contract details from Shopify for customer info
        const { admin } = await unauthenticated.admin(shop);
        const response = await admin.graphql(
            `#graphql
            query getContractForRecovery($id: ID!) {
                subscriptionContract(id: $id) {
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
                                currentPrice { amount }
                            }
                        }
                    }
                    originOrder {
                        id
                        name
                    }
                }
            }`,
            { variables: { id: normalizedContractId } }
        );

        const json = await response.json();
        const contractDetails = json.data?.subscriptionContract;

        if (!contractDetails) {
            return new Response(`Subscription contract ${normalizedContractId} not found on Shopify for shop ${shop}`, { status: 404 });
        }

        const customer = contractDetails.customer;
        const line = contractDetails.lines?.edges?.[0]?.node;
        const originOrder = contractDetails.originOrder;
        const amount = parseFloat(line?.currentPrice?.amount || "0");
        const currency = contractDetails.currencyCode || "USD";
        const donationName = line?.title || "Recurring Donation";
        const frequency = line?.sellingPlanName || "Subscription";
        const customerEmail = customer?.email || "";
        const customerName = `${customer?.firstName || ""} ${customer?.lastName || ""}`.trim() || "Customer";

        // Determine current retry number based on existing logs
        const existingLogForRetryNum = await db.paymentRecoveryLog.findUnique({
            where: {
                shop_subscriptionContractId: {
                    shop,
                    subscriptionContractId: normalizedContractId,
                },
            },
        });
        const currentRetryCount = existingLogForRetryNum && (existingLogForRetryNum.status === "pending" || existingLogForRetryNum.status === "retrying")
            ? existingLogForRetryNum.retryCount + 1
            : 0;

        const billingAttemptId = `gid://shopify/SubscriptionBillingAttempt/mock_fail_${Date.now()}`;
        const idempotencyKey = `mock_fail_attempt_${Date.now()}`;

        // 3. Log to BillingAttemptLog
        await db.billingAttemptLog.create({
            data: {
                shop,
                subscriptionContractId: normalizedContractId,
                billingAttemptId,
                source: "webhook",
                status: "failed",
                errorCode,
                errorMessage,
                orderId: originOrder?.id || null,
                orderNumber: originOrder?.name || null,
                customerEmail,
                customerName,
                amount,
                currency,
                donationName,
                frequency,
                retryNumber: currentRetryCount,
                rawPayload: JSON.stringify({ errorCode, errorMessage, testRoute: true }),
            },
        });

        if (!recoverySettings?.enabled) {
            return new Response(JSON.stringify({
                success: true,
                message: "BillingAttemptLog logged. Recovery settings are disabled for this shop, so no recovery log or emails generated.",
                recoveryEnabled: false
            }), { headers: { "Content-Type": "application/json" } });
        }

        // 4. Calculate next retry date
        const nextRetryDate = new Date();
        nextRetryDate.setDate(nextRetryDate.getDate() + recoverySettings.retryInterval);

        // 5. Create or update recovery log
        let recoveryLog;
        if (existingLogForRetryNum && (existingLogForRetryNum.status === "pending" || existingLogForRetryNum.status === "retrying")) {
            // Already tracking this contract — increment retry count
            recoveryLog = await db.paymentRecoveryLog.update({
                where: { id: existingLogForRetryNum.id },
                data: {
                    retryCount: existingLogForRetryNum.retryCount + 1,
                    errorCode,
                    errorMessage,
                    nextRetryDate,
                    status: existingLogForRetryNum.retryCount + 1 >= existingLogForRetryNum.maxRetries ? "exhausted" : "retrying",
                },
            });
        } else {
            // First failure for this contract
            recoveryLog = await db.paymentRecoveryLog.upsert({
                where: {
                    shop_subscriptionContractId: {
                        shop,
                        subscriptionContractId: normalizedContractId,
                    },
                },
                create: {
                    shop,
                    subscriptionContractId: normalizedContractId,
                    orderId: originOrder?.id || null,
                    orderNumber: originOrder?.name || null,
                    customerEmail,
                    customerName,
                    amount,
                    currency,
                    errorCode,
                    errorMessage,
                    retryCount: 0,
                    maxRetries: recoverySettings.retryAttempts,
                    retryInterval: recoverySettings.retryInterval,
                    nextRetryDate,
                    fallbackAction: recoverySettings.fallbackAction,
                    status: "pending",
                    donationName,
                    frequency,
                },
                update: {
                    retryCount: 0,
                    errorCode,
                    errorMessage,
                    nextRetryDate,
                    maxRetries: recoverySettings.retryAttempts,
                    retryInterval: recoverySettings.retryInterval,
                    fallbackAction: recoverySettings.fallbackAction,
                    status: "pending",
                },
            });
        }

        // 6. Send failure notification email
        let emailSent = false;
        let emailError = null;
        if (recoverySettings.sendNotifications && customerEmail) {
            let emailType = "recovery";
            if (recoveryLog.status === "exhausted") {
                if (recoverySettings.fallbackAction === "cancel") emailType = "cancellation";
                else if (recoverySettings.fallbackAction === "pause") emailType = "pause";
            }

            try {
                const emailResult = await sendDonationReceipt({
                    email: customerEmail,
                    name: customerName,
                    amount: amount.toFixed(2),
                    orderNumber: originOrder?.name || "N/A",
                    type: emailType as any,
                    shop,
                    frequency: frequency.toLowerCase().includes("month") ? "Monthly" : frequency.toLowerCase().includes("week") ? "Weekly" : "Subscription",
                    nextBillingDate: nextRetryDate.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                    }),
                    donationName,
                    manageUrl: `https://${shop}/account/subscriptions`,
                });
                emailSent = emailResult.success;
                if (!emailResult.success) {
                    emailError = emailResult.error;
                }
            } catch (emailErr: any) {
                emailError = emailErr.message || emailErr;
            }
        }

        // 7. If retries are already exhausted on this test attempt, execute fallback immediately
        let fallbackExecuted = false;
        if (recoveryLog.status === "exhausted") {
            const fallbackAction = recoverySettings.fallbackAction;
            if (fallbackAction === "pause" || fallbackAction === "cancel") {
                try {
                    let mutation = "";
                    let mutationName = "";
                    if (fallbackAction === "pause") {
                        mutation = `mutation { subscriptionContractPause(subscriptionContractId: "${normalizedContractId}") { contract { id status } userErrors { field message } } }`;
                        mutationName = "subscriptionContractPause";
                    } else if (fallbackAction === "cancel") {
                        mutation = `mutation { subscriptionContractCancel(subscriptionContractId: "${normalizedContractId}") { contract { id status } userErrors { field message } } }`;
                        mutationName = "subscriptionContractCancel";
                    }

                    const fallbackResponse = await admin.graphql(mutation);
                    const fallbackJson = await fallbackResponse.json();
                    const result = fallbackJson.data?.[mutationName];

                    if (result?.userErrors?.length > 0) {
                        console.error(`[TestFailure] Fallback execution error:`, result.userErrors[0].message);
                    } else {
                        fallbackExecuted = true;
                    }

                    await db.paymentRecoveryLog.update({
                        where: { id: recoveryLog.id },
                        data: { status: "fallback_executed" },
                    });
                } catch (fallbackErr) {
                    console.error(`[TestFailure] Fallback execution threw error:`, fallbackErr);
                }
            } else if (fallbackAction === "skip") {
                await db.paymentRecoveryLog.update({
                    where: { id: recoveryLog.id },
                    data: { status: "fallback_executed" },
                });
                fallbackExecuted = true;
            }
        }

        return new Response(JSON.stringify({
            success: true,
            billingAttemptLogged: true,
            recoveryLogStatus: recoveryLog.status,
            retryCount: recoveryLog.retryCount,
            maxRetries: recoveryLog.maxRetries,
            nextRetryDate: nextRetryDate.toISOString(),
            emailSent,
            emailError,
            fallbackExecuted,
            recoverySettings
        }, null, 2), { headers: { "Content-Type": "application/json" } });

    } catch (err: any) {
        return new Response(`TestFailure Error: ${err.message || err}`, { status: 500 });
    }
};
