import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { sendDonationReceipt } from "../utils/sendgrid.server";
import { checkFeatureAccess } from "../utils/features";

export const action = async ({ request }: ActionFunctionArgs) => {
    console.log(`\n\n[!!! WEBHOOK HIT !!!] Incoming request to /webhooks/orders/create at ${new Date().toISOString()}`);

    let shop = "unknown";
    let topic = "unknown";
    let payload: any;
    let admin: any;
    let session: any;

    try {
        const auth = await authenticate.webhook(request);
        payload = auth.payload;
        admin = auth.admin;
        session = auth.session;
        shop = auth.shop;
        topic = auth.topic;
        console.log(`[Webhook] Auth SUCCESS. Topic: ${topic}, Shop: ${shop}`);
        console.log(`[Webhook] Payload ID: ${payload.id}, Name: ${payload.name}`);

        if (topic !== "ORDERS_CREATE") {
            console.warn(`[Webhook] Unexpected topic: ${topic}`);
            return new Response(null, { status: 400 });
        }

        if (!admin) {
            console.error("Admin context is not available for this webhook request.");
            return new Response();
        }

        const order = payload as any;
        const orderId = payload.id?.toString();
        const orderIdStr = order.admin_graphql_api_id || `gid://shopify/Order/${order.id}`;

        const customerName = payload.customer
            ? `${payload.customer.first_name || ""} ${payload.customer.last_name || ""}`.trim()
            : (order.billing_address?.name || "Anonymous");
        const customerEmail = payload.email || payload.contact_email || payload.customer?.email || "No Email provided";
        const currency = payload.currency || "USD";
        const createdAt = payload.created_at ? new Date(payload.created_at) : new Date();

        let hasCampaignDonation = false;
        let hasCampaignRecurring = false;  // campaign product ordered WITH a selling plan
        let campaignRecurringNames: string[] = [];    // carry campaign names from HEAD LOGIC to STAGING (supports multi-product)
        let donationAmtCents = 0;

        // ── Moved here from STAGING LOGIC to prevent TDZ (Temporal Dead Zone) errors ──
        // These are referenced in HEAD LOGIC but were previously declared after it.
        let hasDirectDonationProduct = false;
        let directDonationName = "Charity Donation";
        let directDonationAmountCents = 0;
        let hasRoundUpDonation = false;
        let roundUpAmountCents = 0;
        let directOneTimeDonationAmtCents = 0;
        let recurringDonationAmtCents = 0;

        // Collect all donation line items for multi-product email support
        let donationLineItems: Array<{ title: string; amount: string; image?: string; sellingPlan?: string }> = [];

        // -------------------------
        // HEAD LOGIC: Campaign Donations 
        // -------------------------
        if (payload.line_items && Array.isArray(payload.line_items)) {
            for (const item of payload.line_items) {
                if (!item.product_id) continue;

                // Skip global recurring donation product here — it's handled in STAGING LOGIC
                const config = await (db as any).recurringDonationConfig.findUnique({ where: { shop } });
                if (config && String(item.product_id) === String(config.productId)) {
                    console.log(`[Webhook] Skipping campaign logic for global donation product: ${item.product_id}`);
                    continue;
                }

                try {
                    const productIdStr = item.product_id.toString();
                    const variantIdStr = item.variant_id?.toString() || null;

                    const response = await admin.graphql(
                        `#graphql
                        query getProductDetails($id: ID!) {
                            product(id: $id) {
                                productType
                                tags
                            }
                        }`,
                        { variables: { id: `gid://shopify/Product/${productIdStr}` } }
                    );

                    const { data } = await response.json();
                    let isDonation = false;

                    if (data?.product) {
                        const productType = data.product.productType?.toLowerCase();
                        const tags = data.product.tags || [];

                        if (
                            productType === "donation" ||
                            tags.some((t: string) => t.toLowerCase() === "donation")
                        ) {
                            isDonation = true;
                        }
                    }

                    const matchingCampaign = await db.campaign.findFirst({
                        where: {
                            shop: shop,
                            shopifyProductId: { endsWith: productIdStr },
                        },
                    });

                    if (isDonation && matchingCampaign) {
                        // ── Fix: Skip recurring items here — they are handled by
                        //    the STAGING LOGIC below and written to RecurringDonationLog.
                        const hasSellingPlan = !!(item.selling_plan_allocation);
                        const hasSellingPlanProp = (item.properties || []).some(
                            (p: any) => ["selling_plan", "_selling_plan_id"].includes(p.name)
                        );
                        if (hasSellingPlan || hasSellingPlanProp) {
                            // Campaign product with a selling plan → accumulate amount and flag so
                            // STAGING LOGIC can write to RecurringDonationLog with the correct data.
                            const basePrice = parseFloat(item.price || "0") * (item.quantity || 1);
                            const lineDiscount = parseFloat(item.total_discount || "0");
                            const recurringAmt = Math.max(0, basePrice - lineDiscount);
                            donationAmtCents += Math.round(recurringAmt * 100);
                            recurringDonationAmtCents += Math.round(recurringAmt * 100);
                            hasCampaignDonation = true;
                            hasCampaignRecurring = true;
                            campaignRecurringNames.push(matchingCampaign.name || "Campaign Donation");
                            // Collect for multi-product email
                            donationLineItems.push({
                                title: item.title || matchingCampaign.name || "Campaign Donation",
                                amount: recurringAmt.toFixed(2),
                                sellingPlan: "Recurring Donation",
                            });
                            console.log(`[Webhook] Campaign recurring item detected (variant ${variantIdStr}), amount ${recurringAmt} accumulated. Will write to RecurringDonationLog in STAGING.`);
                            continue;
                        }

                        const basePrice = parseFloat(item.price || "0") * (item.quantity || 1);
                        const lineDiscount = parseFloat(item.total_discount || "0");
                        const donationAmount = Math.max(0, basePrice - lineDiscount);
                        donationAmtCents += Math.round(donationAmount * 100);
                        const donationAmtFormatted = donationAmount.toFixed(2);

                        try {
                            await db.donation.upsert({
                                where: {
                                    orderId_shopifyVariantId: {
                                        orderId: orderId,
                                        shopifyVariantId: variantIdStr || "unknown",
                                    },
                                },
                                create: {
                                    campaignId: matchingCampaign.id,
                                    orderId: orderId,
                                    orderNumber: order.name,
                                    amount: donationAmount,
                                    currency: currency,
                                    donorName: customerName,
                                    donorEmail: customerEmail,
                                    shopifyProductId: productIdStr,
                                    shopifyVariantId: variantIdStr || "unknown",
                                    createdAt: createdAt,
                                },
                                update: {
                                    amount: donationAmount,
                                    orderNumber: order.name,
                                },
                            });
                            console.log(`[Webhook] Inserted/Updated donation mapping for Campaign ${matchingCampaign.id}`);
                            hasCampaignDonation = true;
                            // Set a descriptive name for consolidated email
                            if (!hasDirectDonationProduct && !hasRoundUpDonation) {
                                directDonationName = matchingCampaign.name || "Preset Donation";
                            }
                            // Collect for multi-product email
                            donationLineItems.push({
                                title: item.title || matchingCampaign.name || "Preset Donation",
                                amount: donationAmount.toFixed(2),
                            });
                        } catch (dbError) {
                            console.error("Error inserting donation record:", dbError);
                        }

                        // ── Consolidation Fix: Tagging moved to STAGING LOGIC block ──
                        // This prevents multiple order updates and ensures all tags are applied together.
                        // ── Consolidation Fix: Email sending moved to STAGING LOGIC block ──
                        // This prevents multiple emails when both campaign and other donations exist.
                    }
                } catch (error) {
                    console.error("Error processing line item:", error);
                }
            }
        }

        // -------------------------
        // STAGING LOGIC: POS / Recurring / Round-up
        // -------------------------
        const settings = await (db as any).posDonationSettings.findUnique({ where: { shop } });
        const roundupSettings = await (db as any).roundUpDonationSettings.findUnique({ where: { shop } });

        const defaultSettings = {
            enabled: true, // Default to true for POS discovery if settings missing
            donationType: "fixed",
            donationBasis: "order",
            donationValue: 5,
            minimumValue: 0,
            orderTag: "galaxy_pos_donation"
        };

        const effectiveSettings = settings || defaultSettings;
        const isSettingsEnabled = effectiveSettings.enabled;
        console.log(`[Webhook] Settings for ${shop}: ${settings ? "Found" : "NOT found (using defaults)"}. Enabled state: ${isSettingsEnabled}`);

        const subscription = await (db as any).planSubscription.findUnique({ where: { shop } });
        const plan = subscription?.plan || "basic";

        const config = await (db as any).recurringDonationConfig.findUnique({ where: { shop } });
        const DONATION_PRODUCT_ID = config?.productId || "9946640679159";

        let isRecurring = false;
        let recurringSellingPlanId: string | null = null;
        let subscriptionContractId: string | null = null;
        // hasDirectDonationProduct, directDonationName, directDonationAmountCents,
        // hasRoundUpDonation, roundUpAmountCents are now declared before HEAD LOGIC (line ~52)

        // Detection Loop
        for (const lineItem of (order.line_items || [])) {
            // Check for explicit donation product (Preset/Recurring)
            if (String(lineItem.product_id) === String(DONATION_PRODUCT_ID)) {
                hasDirectDonationProduct = true;
                directDonationName = lineItem.title || "Charity Donation";
                const itemPriceCents = Math.round(parseFloat(lineItem.price || 0) * 100) * (lineItem.quantity || 1);
                directDonationAmountCents += itemPriceCents;
                
                const isItemRecurring = !!(lineItem.selling_plan_allocation) || (lineItem.properties || []).some(
                    (p: any) => ["selling_plan", "_selling_plan_id"].includes(p.name)
                );
                if (isItemRecurring) {
                    recurringDonationAmtCents += itemPriceCents;
                } else {
                    directOneTimeDonationAmtCents += itemPriceCents;
                }

                // Collect for multi-product email
                const itemAmt = (parseFloat(lineItem.price || 0) * (lineItem.quantity || 1)).toFixed(2);
                donationLineItems.push({
                    title: lineItem.title || "Charity Donation",
                    amount: itemAmt,
                    sellingPlan: isItemRecurring ? "Recurring Donation" : undefined,
                });
            }

            // Check for Round-Up properties (Standard 'roundup' or Custom 'extra')
            const typeProp = (lineItem.properties || []).find((p: any) => {
                const nameLower = String(p.name).toLowerCase();
                return nameLower === "type" || nameLower === "_type";
            });

            if (typeProp) {
                const valLower = String(typeProp.value).toLowerCase();
                if (valLower === "roundup" || valLower === "extra") {
                    hasRoundUpDonation = true;
                    const basePrice = parseFloat(lineItem.price || 0) * (lineItem.quantity || 1);
                    const lineDiscount = parseFloat(lineItem.total_discount || 0);
                    roundUpAmountCents += Math.round(Math.max(0, basePrice - lineDiscount) * 100);
                }
            }

            if (lineItem.selling_plan_allocation) {
                isRecurring = true;
                recurringSellingPlanId = lineItem.selling_plan_allocation.selling_plan_id
                    ? `gid://shopify/SellingPlan/${lineItem.selling_plan_allocation.selling_plan_id}`
                    : null;

                if (lineItem.selling_plan_allocation.subscription_contract_id) {
                    subscriptionContractId = lineItem.selling_plan_allocation.subscription_contract_id.includes("gid://")
                        ? lineItem.selling_plan_allocation.subscription_contract_id
                        : `gid://shopify/SubscriptionContract/${lineItem.selling_plan_allocation.subscription_contract_id}`;
                }
            } else {
                const spProp = (lineItem.properties || []).find((p: any) => p.name === "selling_plan" || p.name === "_selling_plan_id");
                if (spProp) {
                    isRecurring = true;
                    recurringSellingPlanId = String(spProp.value).includes("gid://") ? String(spProp.value) : `gid://shopify/SellingPlan/${spProp.value}`;
                }

                const subProp = (lineItem.properties || []).find((p: any) => p.name === "subscription_id" || p.name === "_subscription_id");
                if (subProp) {
                    isRecurring = true;
                    subscriptionContractId = String(subProp.value).includes("gid://") ? String(subProp.value) : `gid://shopify/SubscriptionContract/${subProp.value}`;
                }
            }
        }

        // Apply Tagging and Logic (Consolidated Section)
        let isApplicable = false;
        let isPosDonationSource = false;
        let frequency: "one_time" | "monthly" | "weekly" | "daily" = "one_time";
        let samplePriceCents = 0;

        if (isRecurring && recurringSellingPlanId) {
            isApplicable = true; // Subscriptions are always donations
            if (config) {
                const spId = recurringSellingPlanId.split('/').pop() || "";
                if (config.monthlyPlanId?.includes(spId)) frequency = "monthly";
                else if (config.weeklyPlanId?.includes(spId)) frequency = "weekly";
                // ── ONE-DAY SUBSCRIPTION HOOK (removable) ──
                else if (config.dailyPlanId?.includes(spId)) frequency = "daily";
                // ── END ONE-DAY SUBSCRIPTION HOOK ──
            }
        }

        // Detect properties-based subscriptions
        for (const lineItem of (order.line_items || [])) {
            const spProp = (lineItem.properties || []).find((p: any) => p.name === "selling_plan" || p.name === "_selling_plan_id");
            if (spProp) {
                isRecurring = true;
                isApplicable = true;
            }
            const subProp = (lineItem.properties || []).find((p: any) => p.name === "subscription_id" || p.name === "_subscription_id");
            if (subProp) {
                isRecurring = true;
                isApplicable = true;
            }
        }
        // donationAmtCents already initialized at top
        const totalCents = parseFloat(order.total_price || 0) * 100;
        const minValCents = (effectiveSettings.minimumValue || 0) * 100;

        // Flow A: Explicit Product (Preset/Recurring)
        if (hasDirectDonationProduct) {
            isApplicable = true;
            donationAmtCents += directDonationAmountCents;
            samplePriceCents = totalCents;
            console.log(`[Webhook] Flow A: Direct Donation detected. Amount: ${directDonationAmountCents}c`);
        }

        // Flow B: Round-Up Donation
        if (hasRoundUpDonation) {
            isApplicable = true;
            donationAmtCents += roundUpAmountCents;
            if (!hasDirectDonationProduct) {
                directDonationName = roundupSettings?.campaignTitle || "Round-Up Donation";
            }
            console.log(`[Webhook] Flow B: Round-Up Donation detected. Amount: ${roundUpAmountCents}c`);
        }

        // Flow C: POS / Portion-of-Sale logic (if nothing else detected yet)
        if (!isApplicable && isSettingsEnabled) {
            console.log(`[Webhook] Flow C: Checking POS/Portion-of-Sale logic...`);

            if (effectiveSettings.donationType === "percentage" && !checkFeatureAccess(plan, "canUsePercentageDonation")) {
                console.log(`[Webhook] Skipping POS check - Percentage donation restricted for plan: ${plan}`);
            } else {
                const widgetActive = (order.note_attributes || []).some((attr: any) => attr.name === "_donation_widget_active" && attr.value === "true");
                const isWeb = order.source_name === "web";
                const isPos = order.source_name === "pos";

                if (isWeb && !widgetActive) {
                    console.log(`[Webhook] Skipping POS check - Web source without active donation widget.`);
                } else if (isPos || widgetActive) {
                    if (effectiveSettings.donationBasis === 'product') {
                        for (const lineItem of (order.line_items || [])) {
                            const itemPriceCents = parseFloat(lineItem.price || 0) * 100;
                            const quantity = lineItem.quantity || 1;
                            const lineTotalCents = itemPriceCents * quantity;

                            if (lineTotalCents >= minValCents) {
                                isApplicable = true;
                                isPosDonationSource = true;
                                donationAmtCents += effectiveSettings.donationType === "percentage"
                                    ? (effectiveSettings.donationValue / 100) * lineTotalCents
                                    : effectiveSettings.donationValue * 100 * quantity;
                            }
                        }
                    } else if (totalCents >= minValCents) {
                        isApplicable = true;
                        isPosDonationSource = true;
                        samplePriceCents = totalCents;
                        const calculatedDonation = effectiveSettings.donationType === "percentage" ? (effectiveSettings.donationValue / 100) * samplePriceCents : effectiveSettings.donationValue * 100;
                        donationAmtCents += calculatedDonation;
                    }
                } else {
                    console.log(`[Webhook] Skipping POS check - Widget not active and source is not POS. Source: ${order.source_name}`);
                }
            }
        }

        console.log(`[Webhook] Applicable check: isApplicable=${isApplicable}, hasCampaignDonation=${hasCampaignDonation}`);
        if (isApplicable || hasCampaignDonation) {
            // ── Deduplication Fix: Check if an email was already sent for this order ──
            const [posSent, recSent, roundSent, presetSent] = await Promise.all([
                (db as any).posDonationLog.findFirst({ where: { orderId: orderIdStr, receiptStatus: "sent" } }),
                (db as any).recurringDonationLog.findFirst({ where: { orderId: orderIdStr, receiptStatus: "sent" } }),
                (db as any).roundUpDonationLog.findFirst({ where: { orderId: orderIdStr, receiptStatus: "sent" } }),
                (db as any).donation.findFirst({ where: { orderId: orderId, receiptStatus: "sent" } }),
            ]);

            if (posSent || recSent || roundSent || presetSent) {
                console.log(`[Webhook] Email deduplication: Receipt already sent for Order ${order.name}. Skipping email logic.`);
                return new Response("OK", { status: 200 });
            }

            const donationAmtFormatted = (donationAmtCents / 100).toFixed(2);
            let emailStatus = "pending";
            let sentDate = null;
            let currentCustomerEmail = customerEmail;
            let currentCustomerName = customerName;

            if (admin) {
                try {
                    const resp = await admin.graphql(`#graphql
                        query getOrder($id: ID!) { 
                          order(id: $id) { 
                            email 
                            customer { id } 
                            billingAddress { firstName lastName } 
                            lineItems(first: 20) {
                              edges {
                                node {
                                  variant {
                                    product {
                                      id
                                      featuredImage {
                                        url
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          } 
                        }`,
                        { variables: { id: orderIdStr } }
                    );
                    const data = await resp.json();
                    const fresh = data.data?.order;
                    if (fresh) {
                        if (fresh.customer?.id) (order as any).customer_gql_id = fresh.customer.id;
                        if (fresh.email) currentCustomerEmail = fresh.email;
                        if (fresh.billingAddress) currentCustomerName = `${fresh.billingAddress.firstName || ""} ${fresh.billingAddress.lastName || ""}`.trim();

                        const gqlLineItems = fresh.lineItems?.edges?.map((e: any) => e.node) || [];
                        const gqlDonationItem = gqlLineItems.find((li: any) => li.variant?.product?.id?.includes(DONATION_PRODUCT_ID));
                        if (gqlDonationItem?.variant?.product?.featuredImage?.url) {
                            (order as any).donation_product_image = gqlDonationItem.variant.product.featuredImage.url;
                        }
                    }
                } catch (e) {
                    console.error("GQL Refresh Error:", e);
                }
            }

            if (currentCustomerEmail !== "No Email provided" && checkFeatureAccess(plan, "canSendReceiptEmail")) {
                const freqLabel = frequency === "daily" ? "Daily" : frequency === "weekly" ? "Weekly" : frequency === "monthly" ? "Monthly" : "One-time";

                const shippingAddr = order.shipping_address
                    ? `${order.shipping_address.name}\n${order.shipping_address.address1}${order.shipping_address.address2 ? ` ${order.shipping_address.address2}` : ""}\n${order.shipping_address.city}, ${order.shipping_address.province_code || ""} ${order.shipping_address.zip}\n${order.shipping_address.country}`
                    : "";
                const billingAddr = order.billing_address
                    ? `${order.billing_address.name}\n${order.billing_address.address1}${order.billing_address.address2 ? ` ${order.billing_address.address2}` : ""}\n${order.billing_address.city}, ${order.billing_address.province_code || ""} ${order.billing_address.zip}\n${order.billing_address.country}`
                    : "";

                // Look for the global donation product first, then fall back to any campaign product
                let donationItem = (order.line_items || []).find((li: any) => String(li.product_id) === String(DONATION_PRODUCT_ID));
                if (!donationItem && hasCampaignDonation) {
                    // For campaign products: find the first line item that matched a campaign
                    donationItem = (order.line_items || []).find((li: any) => {
                        return li.properties && li.properties.some?.((p: any) => p.name === "Donation Campaign");
                    }) || (order.line_items || []).find((li: any) => {
                        // Fallback: check if any line item's product matches a known campaign product
                        return donationLineItems.some(dl => dl.title === li.title);
                    });
                }

                let nextBillingDate = "";
                const today = new Date();
                // ── ONE-DAY SUBSCRIPTION HOOK (removable) ──
                if (frequency === "daily") {
                    today.setDate(today.getDate() + 1);
                    nextBillingDate = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                // ── END ONE-DAY SUBSCRIPTION HOOK ──
                } else if (frequency === "weekly") {
                    today.setDate(today.getDate() + 7);
                    nextBillingDate = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                } else if (frequency === "monthly") {
                    today.setMonth(today.getMonth() + 1);
                    nextBillingDate = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                }

                let paymentMethod = "Ending in card";
                if (order.payment_details?.credit_card_number) {
                    const last4 = order.payment_details.credit_card_number.slice(-4);
                    paymentMethod = `Ending in ${last4}`;
                } else if (order.payment_gateway_names?.length > 0) {
                    paymentMethod = order.payment_gateway_names[0];
                }

                // Resolve product title: prefer actual line item title, then campaign name
                const resolvedProductTitle = donationItem?.title || campaignRecurringNames[0] || directDonationName;
                const resolvedDonationName = campaignRecurringNames.join(", ") || directDonationName;

                console.log(`[Webhook] Calling sendDonationReceipt for ${currentCustomerEmail}...`);
                const res = await sendDonationReceipt({
                    email: currentCustomerEmail,
                    name: currentCustomerName,
                    amount: donationAmtFormatted,
                    orderNumber: order.name,
                    shop,
                    donationName: resolvedDonationName,
                    frequency: freqLabel,
                    shippingAddress: shippingAddr,
                    billingAddress: billingAddr,
                    productTitle: resolvedProductTitle,
                    manageUrl: frequency !== "one_time" ? `https://${shop}/apps/pos-donation/subscriptions` : undefined,
                    nextBillingDate: nextBillingDate,
                    paymentMethod: paymentMethod,
                    productImage: (order as any).donation_product_image,
                    // Pass all donation line items for multi-product email
                    lineItems: donationLineItems.length > 1 ? donationLineItems : undefined,
                });
                console.log(`[Webhook] sendDonationReceipt result: ${JSON.stringify(res)}`);
                if (res.success) {
                    emailStatus = "sent";
                    sentDate = new Date();
                } else {
                    emailStatus = "failed";
                }
            } else {
                emailStatus = currentCustomerEmail !== "No Email provided" ? "skipped" : "failed";
            }

            // ── Guard: Identify subscription renewal orders (from cron billing or Shopify) ──
            const isSubscriptionRenewal = order.source_name === "subscription_contract" || isRecurring;

            try {
                let loggedAny = false;

                // 1. Recurring Donation (Global subscription product or Campaign product with a selling plan)
                if ((hasDirectDonationProduct && frequency !== "one_time") || (hasCampaignRecurring && frequency !== "one_time")) {
                    await db.recurringDonationLog.upsert({
                        where: { orderId: orderIdStr },
                        update: {
                            subscriptionContractId: subscriptionContractId,
                            type: "recurring",
                        },
                        create: {
                            shop,
                            orderId: orderIdStr,
                            orderNumber: order.name,
                            donationAmount: recurringDonationAmtCents / 100,
                            orderTotal: parseFloat(order.total_price || 0),
                            currency: order.currency || "USD",
                            receiptStatus: emailStatus,
                            receiptSentAt: sentDate,
                            sellingPlanId: recurringSellingPlanId,
                            frequency: frequency,
                            subscriptionContractId: subscriptionContractId,
                            type: "recurring",
                        },
                    });
                    loggedAny = true;
                    console.log(`[Webhook] Wrote recurring donation to RecurringDonationLog for Order ${order.name}.`);
                }

                // 2. One-time Global Preset Donation
                // ── Guard: Skip this block for subscription renewal orders ──
                // Subscription renewals (triggered by cron billing or Shopify) use the same
                // donation product but should NOT be treated as one-time preset donations.
                if (hasDirectDonationProduct && frequency === "one_time" && !isSubscriptionRenewal) {
                    try {
                        let campaign = await db.campaign.findFirst({
                            where: {
                                shop: shop,
                                OR: [
                                    { name: { contains: "General", mode: "insensitive" } },
                                    { name: { contains: "One-time", mode: "insensitive" } },
                                    { name: { contains: "Donation", mode: "insensitive" } }
                                ]
                            }
                        });

                        if (!campaign) {
                            campaign = await db.campaign.findFirst({ where: { shop } });
                        }

                        if (campaign) {
                            const donationItem = (order.line_items || []).find((li: any) => String(li.product_id) === String(DONATION_PRODUCT_ID));
                            const variantIdStr = donationItem?.variant_id?.toString() || "unknown";

                            await db.donation.upsert({
                                where: {
                                    orderId_shopifyVariantId: {
                                        orderId: orderId,
                                        shopifyVariantId: variantIdStr,
                                    },
                                },
                                create: {
                                    campaignId: campaign.id,
                                    orderId: orderId,
                                    orderNumber: order.name,
                                    amount: directOneTimeDonationAmtCents / 100,
                                    currency: currency,
                                    donorName: currentCustomerName,
                                    donorEmail: currentCustomerEmail,
                                    shopifyProductId: String(DONATION_PRODUCT_ID),
                                    shopifyVariantId: variantIdStr,
                                    createdAt: createdAt,
                                    receiptStatus: emailStatus,
                                },
                                update: {
                                    amount: directOneTimeDonationAmtCents / 100,
                                    orderNumber: order.name,
                                    receiptStatus: emailStatus,
                                },
                            });
                            hasCampaignDonation = true;
                            loggedAny = true;
                            console.log(`[Webhook] Recorded One-time global donation as Preset under campaign: ${campaign.name}`);
                        } else {
                            console.warn(`[Webhook] No campaign found to link one-time donation for shop ${shop}`);
                        }
                    } catch (dbErr) {
                        console.error("[Webhook] Error recording one-time donation:", dbErr);
                    }
                }

                // 3. Round-up Donation
                if (hasRoundUpDonation) {
                    await db.roundUpDonationLog.upsert({
                        where: { orderId: orderIdStr },
                        update: {
                            type: "roundup",
                        },
                        create: {
                            shop,
                            orderId: orderIdStr,
                            orderNumber: order.name,
                            donationAmount: roundUpAmountCents / 100,
                            orderTotal: parseFloat(order.total_price || 0),
                            currency: order.currency || "USD",
                            status: "active",
                            receiptStatus: emailStatus,
                            receiptSentAt: sentDate,
                            isResent: false,
                            type: "roundup",
                        },
                    });
                    loggedAny = true;
                    console.log(`[Webhook] Wrote roundup donation to roundUpDonationLog for Order ${order.name}.`);
                }

                // 4. One-time Campaign Preset Donation (updating its status if written during line-items loop)
                if (hasCampaignDonation) {
                    try {
                        await db.donation.updateMany({
                            where: { orderId: orderId, receiptStatus: { not: "sent" } },
                            data: { receiptStatus: emailStatus },
                        });
                        loggedAny = true;
                        console.log(`[Webhook] Updated Donation table receiptStatus to "${emailStatus}" for Order ${order.name}.`);
                    } catch (updateErr) {
                        console.warn("[Webhook] Could not update donation receipt status (non-fatal):", updateErr);
                    }
                }

                // 5. Fallback POS Donation (only if no other donation types logged)
                if (!loggedAny) {
                    await db.posDonationLog.upsert({
                        where: { orderId: orderIdStr },
                        update: {
                            type: "pos",
                        },
                        create: {
                            shop,
                            orderId: orderIdStr,
                            orderNumber: order.name,
                            donationAmount: parseFloat(donationAmtFormatted),
                            orderTotal: parseFloat(order.total_price || 0),
                            currency: order.currency || "USD",
                            status: "active",
                            receiptStatus: emailStatus,
                            receiptSentAt: sentDate,
                            isResent: false,
                            type: "pos",
                        },
                    });
                    console.log(`[Webhook] Wrote POS donation to posDonationLog for Order ${order.name}.`);
                }
            } catch (e) {
                console.error("DB Log Error:", e);
            }

            if (admin) {
                try {
                    const existingTags = order.tags ? order.tags.split(',').map((t: any) => t.trim()) : [];

                    if (hasDirectDonationProduct || hasCampaignRecurring) {
                        // For global widget items AND campaign products ordered with a selling plan
                        const isSub = frequency !== "one_time";
                        // ── ONE-DAY SUBSCRIPTION HOOK (removable): added "daily" tag ──
                        const orderTag = isSub ? (frequency === "monthly" ? "recurring_donation_monthly" : frequency === "daily" ? "recurring_donation_daily" : "recurring_donation_weekly") : "preset_donation";
                        const customerTag = isSub ? (frequency === "monthly" ? "recurring_donor_monthly" : frequency === "daily" ? "recurring_donor_daily" : "recurring_donor_weekly") : "preset_donor";
                        // ── END ONE-DAY SUBSCRIPTION HOOK ──

                        if (!existingTags.includes(orderTag)) existingTags.push(orderTag);

                        const customerId = (order as any).customer_gql_id || (order.customer?.id ? `gid://shopify/Customer/${order.customer.id}` : null);
                        if (customerId) {
                            await admin.graphql(`#graphql
                                mutation tagsAdd($id: ID!, $tags: [String!]!) { tagsAdd(id: $id, tags: $tags) { node { id } } }`,
                                { variables: { id: customerId, tags: [customerTag] } }
                            );
                        }
                    }

                    if (hasRoundUpDonation) {
                        const roundupTag = roundupSettings?.donationOrderTag || "roundup_donation";
                        if (!existingTags.includes(roundupTag)) existingTags.push(roundupTag);
                    }

                    if (isPosDonationSource) {
                        const baseTag = effectiveSettings.orderTag || "galaxy_pos_donation";
                        if (!existingTags.includes(baseTag)) existingTags.push(baseTag);
                    }

                    // ── Guard: Only add preset_donation tag for actual one-time preset donations,
                    //    NOT for subscription renewal orders ──
                    if (hasCampaignDonation && !isSubscriptionRenewal) {
                        if (!existingTags.includes("preset_donation")) existingTags.push("preset_donation");

                        const customerId = (order as any).customer_gql_id || (order.customer?.id ? `gid://shopify/Customer/${order.customer.id}` : null);
                        if (customerId) {
                            await admin.graphql(`#graphql
                                mutation tagsAdd($id: ID!, $tags: [String!]!) { tagsAdd(id: $id, tags: $tags) { node { id } } }`,
                                { variables: { id: customerId, tags: ["preset_donor"] } }
                            );
                        }
                    }

                    const currentAttrs = (order.note_attributes || [])
                        .filter((a: any) => a.name !== "POS Donation Amount")
                        .map((a: any) => ({ key: a.name, value: a.value }));

                    let donationLabel = "Donation Amount";
                    let donationTypeLabel = "Donation Type";
                    
                    const activeTypes: string[] = [];
                    if (hasCampaignRecurring && frequency !== "one_time") {
                        // ── ONE-DAY SUBSCRIPTION HOOK (removable): added "Daily" ──
                        activeTypes.push(frequency === "monthly" ? "Monthly" : frequency === "daily" ? "Daily" : "Weekly");
                        // ── END ONE-DAY SUBSCRIPTION HOOK ──
                    }
                    if ((hasCampaignDonation || (hasDirectDonationProduct && frequency === "one_time")) && !isSubscriptionRenewal) {
                        activeTypes.push("Preset");
                    }
                    if (hasDirectDonationProduct && frequency !== "one_time") {
                        // ── ONE-DAY SUBSCRIPTION HOOK (removable): added "Daily" ──
                        activeTypes.push(frequency === "monthly" ? "Monthly" : frequency === "daily" ? "Daily" : "Weekly");
                        // ── END ONE-DAY SUBSCRIPTION HOOK ──
                    }
                    if (hasRoundUpDonation) {
                        activeTypes.push("Round-Up");
                    }

                    if (activeTypes.length === 0) {
                        activeTypes.push("POS");
                    }

                    // Deduplicate and join with comma
                    const uniqueTypes = Array.from(new Set(activeTypes));
                    const typeValue = uniqueTypes.join(", ");

                    // Remove existing if any to ensure fresh values
                    const finalAttrs = currentAttrs.filter(a => a.key !== donationLabel && a.key !== donationTypeLabel);

                    finalAttrs.push({ key: donationLabel, value: `${order.currency || "$"}${donationAmtFormatted}` });
                    finalAttrs.push({ key: donationTypeLabel, value: typeValue });

                    await admin.graphql(`#graphql
                        mutation orderUpdate($input: OrderInput!) { orderUpdate(input: $input) { order { id } } }`,
                        { variables: { input: { id: orderIdStr, tags: existingTags, customAttributes: finalAttrs } } }
                    );
                    console.log(`[Webhook] Success: Handled Order ${order.name} (${donationAmtFormatted}) Type: ${typeValue}`);
                } catch (e) {
                    console.error("Tagging Error:", e);
                }
            }
        }
    } catch (err) {
        console.error("Fatal Webhook Error:", err);
    }

    return new Response("OK", { status: 200 });
};
