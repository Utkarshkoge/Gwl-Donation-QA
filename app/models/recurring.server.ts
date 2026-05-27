import db from "../db.server";

export async function setupSellingPlans(admin: any, shop: string, productId: string, retryCount = 0): Promise<any> {
    const PRODUCT_GID = productId.startsWith("gid://") ? productId : `gid://shopify/Product/${productId}`;

    // 1. Fetch current config to check for existing selling plan group
    const existingConfig = await db.recurringDonationConfig.findUnique({
        where: { shop },
    });

    let sellingPlanGroupId = existingConfig?.sellingPlanGroupId;
    let monthlyPlanId = existingConfig?.monthlyPlanId;
    let weeklyPlanId = existingConfig?.weeklyPlanId;

    // 2. Fetch all variants for the donation product
    const productResponse = await admin.graphql(
        `#graphql
        query getProductVariants($id: ID!) {
            product(id: $id) {
                id
                title
                variants(first: 50) {
                    edges {
                        node {
                            id
                        }
                    }
                }
            }
        }`,
        { variables: { id: PRODUCT_GID } }
    );
    const productData = await productResponse.json();
    const product = productData.data?.product;

    if (!product) {
        throw new Error(`Donation product not found for ID: ${PRODUCT_GID}`);
    }

    const variantIds: string[] = product.variants.edges.map((e: any) => e.node.id);

    // Fetch if daily donation is active
    const oneDayConfig = await db.oneDayDonationConfig.findUnique({
        where: { shop },
    });
    const isDailyActive = oneDayConfig?.isActive ?? false;

    if (!sellingPlanGroupId) {
        console.log(`[Recurring] No selling plan group found for ${shop}, creating one...`);

        // Build plans list
        const plansToCreate: any[] = [
            {
                name: "Monthly Donation",
                options: ["Monthly"],
                position: 1,
                category: "SUBSCRIPTION",
                billingPolicy: {
                    recurring: {
                        interval: "MONTH",
                        intervalCount: 1,
                    },
                },
                deliveryPolicy: {
                    recurring: {
                        interval: "MONTH",
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
            {
                name: "Weekly Donation",
                options: ["Weekly"],
                position: 2,
                category: "SUBSCRIPTION",
                billingPolicy: {
                    recurring: {
                        interval: "WEEK",
                        intervalCount: 1,
                    },
                },
                deliveryPolicy: {
                    recurring: {
                        interval: "WEEK",
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
        ];

        if (isDailyActive) {
            plansToCreate.push({
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
            });
        }

        // 3. Create the Selling Plan Group
        const createGroupResponse = await admin.graphql(
            `#graphql
            mutation sellingPlanGroupCreate($input: SellingPlanGroupInput!) {
                sellingPlanGroupCreate(input: $input) {
                    sellingPlanGroup {
                        id
                        name
                        sellingPlans(first: 10) {
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
                    input: {
                        name: "Recurring Donations",
                        merchantCode: "recurring-donations",
                        options: ["Frequency"],
                        position: 1,
                        sellingPlansToCreate: plansToCreate,
                    },
                },
            }
        );
        const createGroupData = await createGroupResponse.json();
        const userErrors = createGroupData.data?.sellingPlanGroupCreate?.userErrors || [];

        if (userErrors.length > 0) {
            throw new Error(userErrors.map((e: any) => e.message).join(", "));
        }

        const group = createGroupData.data?.sellingPlanGroupCreate?.sellingPlanGroup;
        sellingPlanGroupId = group.id;
        const plans: Array<{ id: string; name: string }> = group.sellingPlans.edges.map((e: any) => e.node);

        monthlyPlanId = plans.find(p => p.name.toLowerCase().includes("monthly"))?.id || null;
        weeklyPlanId = plans.find(p => p.name.toLowerCase().includes("weekly"))?.id || null;
        dailyPlanId = plans.find(p => p.name.toLowerCase().includes("daily"))?.id || null;
    }


    // 4. Attach selling plan group to the product
    const attachResponse = await admin.graphql(
        `#graphql
        mutation sellingPlanGroupAddProducts($id: ID!, $productIds: [ID!]!) {
            sellingPlanGroupAddProducts(id: $id, productIds: $productIds) {
                sellingPlanGroup { id }
                userErrors { field message }
            }
        }`,
        {
            variables: {
                id: sellingPlanGroupId,
                productIds: [PRODUCT_GID],
            },
        }
    );
    const attachData = await attachResponse.json();
    const attachErrors = attachData.data?.sellingPlanGroupAddProducts?.userErrors || [];

    // CHECK FOR "STALE" GROUP ID
    if (attachErrors.some((e: any) => e.message.includes("does not exist")) && retryCount < 1) {
        console.warn(`[Recurring] Group ${sellingPlanGroupId} does not exist in Shopify. Clearing from DB and retrying...`);
        await db.recurringDonationConfig.update({
            where: { shop },
            data: { sellingPlanGroupId: null, monthlyPlanId: null, weeklyPlanId: null, dailyPlanId: null }
        });
        return setupSellingPlans(admin, shop, productId, retryCount + 1);
    }

    if (attachErrors.length > 0) {
        console.warn("sellingPlanGroupAddProducts warnings:", attachErrors);
    }

    // 5. Attach to variants too
    if (variantIds.length > 0 && sellingPlanGroupId) {
        const attachVariantsResponse = await admin.graphql(
            `#graphql
            mutation sellingPlanGroupAddProductVariants($id: ID!, $productVariantIds: [ID!]!) {
                sellingPlanGroupAddProductVariants(id: $id, productVariantIds: $productVariantIds) {
                    sellingPlanGroup { id }
                    userErrors { field message }
                }
            }`,
            {
                variables: {
                    id: sellingPlanGroupId!,
                    productVariantIds: variantIds,
                },
            }
        );
        const attachVariantsData = await attachVariantsResponse.json();
        const variantErrors = attachVariantsData.data?.sellingPlanGroupAddProductVariants?.userErrors || [];
        if (variantErrors.length > 0) {
            console.warn("sellingPlanGroupAddProductVariants warnings:", variantErrors);
        }
    }

    // 6. Update DB config
    await db.recurringDonationConfig.upsert({
        where: { shop },
        update: {
            sellingPlanGroupId,
            monthlyPlanId,
            weeklyPlanId,
            dailyPlanId,
            isActive: true,
            productGid: PRODUCT_GID,
            productId: PRODUCT_GID.split("/").pop(),
        },
        create: {
            shop,
            productId: PRODUCT_GID.split("/").pop()!,
            productGid: PRODUCT_GID,
            sellingPlanGroupId: sellingPlanGroupId!,
            monthlyPlanId,
            weeklyPlanId,
            dailyPlanId,
            isActive: true,
        },
    });

    // If Daily Donation plan exists, update the oneDayDonationConfig table to match
    if (dailyPlanId) {
        await db.oneDayDonationConfig.upsert({
            where: { shop },
            update: {
                dailyPlanId,
                sellingPlanGroupId,
            },
            create: {
                shop,
                dailyPlanId,
                sellingPlanGroupId,
                isActive: true,
            },
        });
    }

    console.log(`[Recurring] Setup complete for ${shop}. Group: ${sellingPlanGroupId}`);

    return {
        sellingPlanGroupId,
        monthlyPlanId,
        weeklyPlanId,
        dailyPlanId,
        variantCount: variantIds.length
    };
}

