/**
 * ── ONE-DAY SUBSCRIPTION MODULE (removable) ──
 *
 * Self-contained utility for managing the "Daily Donation" selling plan.
 * To remove this feature:
 *   1. Delete this file
 *   2. Delete app/routes/app.oneday-subscription.tsx
 *   3. Remove the OneDayDonationConfig model from schema.prisma
 *   4. Remove the dailyPlanId field from RecurringDonationConfig in schema.prisma
 *   5. Remove the ~6-line hook in webhooks.orders.create.tsx (search "ONE-DAY SUBSCRIPTION HOOK")
 *   6. Remove "daily" from mapFrequencyLabel in donation-helpers.server.ts
 *   7. Remove "Recurring (Daily)" from badgeStyle in receipts.tsx
 *   8. Remove the nav link in app.tsx
 */

import db from "../db.server";

// ─── Types ──────────────────────────────────────────────────

export interface OneDaySetupResult {
    dailyPlanId: string;
    sellingPlanGroupId: string;
}

// ─── Setup: Add Daily Selling Plan ──────────────────────────

export async function setupOneDaySellingPlan(
    admin: any,
    shop: string
): Promise<OneDaySetupResult> {
    // 1. Get the existing recurring config (must already exist)
    const recurringConfig = await db.recurringDonationConfig.findUnique({
        where: { shop },
    });

    if (!recurringConfig || !recurringConfig.sellingPlanGroupId) {
        console.log(`[OneDaySubscription] Recurring setup not complete. Activating Daily configuration in database only.`);
        // Upsert OneDayDonationConfig
        await db.oneDayDonationConfig.upsert({
            where: { shop },
            update: {
                isActive: true,
            },
            create: {
                shop,
                isActive: true,
            },
        });
        return {
            dailyPlanId: "",
            sellingPlanGroupId: "",
        };
    }

    // 2. Check if daily plan already exists in the group
    if (recurringConfig.dailyPlanId) {
        console.log(`[OneDaySubscription] Daily plan already exists: ${recurringConfig.dailyPlanId}`);

        // Verify it still exists in Shopify
        try {
            const verifyResponse = await admin.graphql(
                `#graphql
                query getSellingPlanGroup($id: ID!) {
                    sellingPlanGroup(id: $id) {
                        id
                        sellingPlans(first: 20) {
                            edges {
                                node {
                                    id
                                    name
                                }
                            }
                        }
                    }
                }`,
                { variables: { id: recurringConfig.sellingPlanGroupId } }
            );

            const verifyJson = await verifyResponse.json();
            const plans = verifyJson.data?.sellingPlanGroup?.sellingPlans?.edges?.map((e: any) => e.node) ?? [];
            const existingDaily = plans.find((p: any) =>
                p.id === recurringConfig.dailyPlanId ||
                p.name.toLowerCase().includes("daily")
            );

            if (existingDaily) {
                // Already exists — just ensure configs are in sync
                await syncOneDayConfig(shop, existingDaily.id, recurringConfig.sellingPlanGroupId);
                return {
                    dailyPlanId: existingDaily.id,
                    sellingPlanGroupId: recurringConfig.sellingPlanGroupId,
                };
            }
        } catch (err) {
            console.warn("[OneDaySubscription] Could not verify existing daily plan, will recreate:", err);
        }
    }

    // 3. Add the Daily Donation selling plan to the existing group
    console.log(`[OneDaySubscription] Adding Daily Donation plan to group ${recurringConfig.sellingPlanGroupId}...`);

    const updateResponse = await admin.graphql(
        `#graphql
        mutation sellingPlanGroupUpdate($id: ID!, $input: SellingPlanGroupInput!) {
            sellingPlanGroupUpdate(id: $id, input: $input) {
                sellingPlanGroup {
                    id
                    sellingPlans(first: 20) {
                        edges {
                            node {
                                id
                                name
                            }
                        }
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
                id: recurringConfig.sellingPlanGroupId,
                input: {
                    sellingPlansToCreate: [
                        {
                            name: "Daily Donation",
                            options: ["Daily"],
                            position: 0,
                            category: "SUBSCRIPTION",
                            billingPolicy: {
                                recurring: {
                                    interval: "DAY",
                                    intervalCount: 1,
                                },
                            },
                            deliveryPolicy: {
                                recurring: {
                                    interval: "DAY",
                                    intervalCount: 1,
                                },
                            },
                            pricingPolicies: [
                                {
                                    fixed: {
                                        adjustmentType: "PERCENTAGE",
                                        adjustmentValue: { percentage: 0 },
                                    },
                                },
                            ],
                        },
                    ],
                },
            },
        }
    );

    const updateJson = await updateResponse.json();
    const userErrors = updateJson.data?.sellingPlanGroupUpdate?.userErrors || [];

    if (userErrors.length > 0) {
        throw new Error(
            `Failed to create Daily Donation plan: ${userErrors.map((e: any) => e.message).join(", ")}`
        );
    }

    const updatedPlans =
        updateJson.data?.sellingPlanGroupUpdate?.sellingPlanGroup?.sellingPlans?.edges?.map(
            (e: any) => e.node
        ) ?? [];

    const dailyPlan = updatedPlans.find((p: any) =>
        p.name.toLowerCase().includes("daily")
    );

    if (!dailyPlan) {
        throw new Error("Daily Donation plan was created but could not be found in the response.");
    }

    console.log(`[OneDaySubscription] Daily plan created: ${dailyPlan.id}`);

    // 4. Save to both configs
    await syncOneDayConfig(shop, dailyPlan.id, recurringConfig.sellingPlanGroupId);

    return {
        dailyPlanId: dailyPlan.id,
        sellingPlanGroupId: recurringConfig.sellingPlanGroupId,
    };
}

// ─── Teardown: Remove Daily Selling Plan ────────────────────

export async function removeOneDaySellingPlan(
    admin: any,
    shop: string
): Promise<void> {
    const recurringConfig = await db.recurringDonationConfig.findUnique({
        where: { shop },
    });

    if (!recurringConfig?.sellingPlanGroupId || !recurringConfig?.dailyPlanId) {
        console.log("[OneDaySubscription] No daily plan to remove.");
        await clearOneDayConfig(shop);
        return;
    }

    console.log(`[OneDaySubscription] Removing daily plan ${recurringConfig.dailyPlanId} from group ${recurringConfig.sellingPlanGroupId}...`);

    try {
        const response = await admin.graphql(
            `#graphql
            mutation sellingPlanGroupUpdate($id: ID!, $input: SellingPlanGroupInput!) {
                sellingPlanGroupUpdate(id: $id, input: $input) {
                    sellingPlanGroup {
                        id
                    }
                    userErrors {
                        field
                        message
                    }
                }
            }`,
            {
                variables: {
                    id: recurringConfig.sellingPlanGroupId,
                    input: {
                        sellingPlansToDelete: [recurringConfig.dailyPlanId],
                    },
                },
            }
        );

        const json = await response.json();
        const errors = json.data?.sellingPlanGroupUpdate?.userErrors || [];

        if (errors.length > 0) {
            console.error("[OneDaySubscription] Error removing daily plan:", errors);
        } else {
            console.log("[OneDaySubscription] Daily plan removed from Shopify successfully.");
        }
    } catch (err) {
        console.error("[OneDaySubscription] Failed to remove daily plan from Shopify:", err);
    }

    await clearOneDayConfig(shop);
}

// ─── Config Helpers ─────────────────────────────────────────

export async function getOneDayConfig(shop: string) {
    return db.oneDayDonationConfig.findUnique({ where: { shop } });
}

async function syncOneDayConfig(shop: string, dailyPlanId: string, sellingPlanGroupId: string) {
    // Update RecurringDonationConfig with dailyPlanId
    await db.recurringDonationConfig.update({
        where: { shop },
        data: { dailyPlanId },
    });

    // Upsert OneDayDonationConfig
    await db.oneDayDonationConfig.upsert({
        where: { shop },
        update: {
            isActive: true,
            dailyPlanId,
        },
        create: {
            shop,
            isActive: true,
            dailyPlanId,
        },
    });

    console.log(`[OneDaySubscription] Config saved for ${shop}. Daily Plan: ${dailyPlanId}`);
}

async function clearOneDayConfig(shop: string) {
    // Clear dailyPlanId from RecurringDonationConfig
    try {
        await db.recurringDonationConfig.update({
            where: { shop },
            data: { dailyPlanId: null },
        });
    } catch {
        // Config might not exist
    }

    // Update OneDayDonationConfig
    try {
        await db.oneDayDonationConfig.upsert({
            where: { shop },
            update: { isActive: false, dailyPlanId: null },
            create: { shop, isActive: false, dailyPlanId: null },
        });
    } catch {
        // Table might not exist yet
    }

    console.log(`[OneDaySubscription] Config cleared for ${shop}.`);
}
