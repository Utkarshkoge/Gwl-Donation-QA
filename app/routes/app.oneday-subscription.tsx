/**
 * ── ONE-DAY SUBSCRIPTION ADMIN PAGE (removable) ──
 *
 * Provides a toggle for merchants to enable/disable the Daily Donation selling plan.
 * To remove: delete this file and the nav link in app.tsx.
 */

import { useState, useEffect } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useFetcher } from "react-router";
import {
    Page,
    Layout,
    Card,
    Text,
    BlockStack,
    InlineStack,
    Badge,
    Banner,
    Button,
    Divider,
} from "@shopify/polaris";
import { useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import {
    setupOneDaySellingPlan,
    removeOneDaySellingPlan,
    getOneDayConfig,
} from "../utils/oneday-subscription.server";

// ─── Loader ─────────────────────────────────────────────────

export const loader = async ({ request }: LoaderFunctionArgs) => {
    const { session } = await authenticate.admin(request);
    const shop = session.shop;

    const { default: db } = await import("../db.server");

    const oneDayConfig = await getOneDayConfig(shop);
    const recurringConfig = await db.recurringDonationConfig.findUnique({
        where: { shop },
    });

    return {
        isActive: oneDayConfig?.isActive ?? false,
        dailyPlanId: oneDayConfig?.dailyPlanId ?? recurringConfig?.dailyPlanId ?? null,
        hasRecurringSetup: !!recurringConfig?.sellingPlanGroupId,
        sellingPlanGroupId: recurringConfig?.sellingPlanGroupId ?? null,
    };
};

// ─── Action ─────────────────────────────────────────────────

export const action = async ({ request }: ActionFunctionArgs) => {
    const { admin, session } = await authenticate.admin(request);
    const formData = await request.formData();
    const actionType = formData.get("_action") as string;

    try {
        if (actionType === "enable") {
            const result = await setupOneDaySellingPlan(admin, session.shop);
            return {
                success: true,
                message: "Daily Donation enabled successfully! The option will now appear in the storefront frequency dropdown.",
                dailyPlanId: result.dailyPlanId,
            };
        }

        if (actionType === "disable") {
            await removeOneDaySellingPlan(admin, session.shop);
            return {
                success: true,
                message: "Daily Donation disabled. The option has been removed from the storefront.",
            };
        }

        return { success: false, message: "Unknown action" };
    } catch (err) {
        console.error("[OneDaySubscription] Action error:", err);
        return {
            success: false,
            message: err instanceof Error ? err.message : "An unexpected error occurred",
        };
    }
};

// ─── Component ──────────────────────────────────────────────

export default function OneDaySubscriptionPage() {
    const { isActive, dailyPlanId, hasRecurringSetup, sellingPlanGroupId } =
        useLoaderData<typeof loader>();
    const fetcher = useFetcher<any>();
    const shopify = useAppBridge();

    useEffect(() => {
        if (fetcher.data?.message) {
            shopify.toast.show(fetcher.data.message, {
                isError: !fetcher.data.success,
            });
        }
    }, [fetcher.data, shopify]);

    const isSubmitting = fetcher.state === "submitting";
    const currentlyActive =
        fetcher.data?.success && fetcher.data?.dailyPlanId
            ? true
            : fetcher.data?.success && !fetcher.data?.dailyPlanId
                ? false
                : isActive;

    return (
        <Page
            title="Daily Donation"
            subtitle="Allow customers to donate every day with a daily recurring subscription"
            backAction={{ content: "Home", url: "/app" }}
        >
            <Layout>

                {fetcher.data && !isSubmitting && (
                    <Layout.Section>
                        <Banner
                            tone={fetcher.data.success ? "success" : "critical"}
                            title={fetcher.data.success ? "Success" : "Error"}
                        >
                            <p>{fetcher.data.message}</p>
                        </Banner>
                    </Layout.Section>
                )}

                <Layout.Section>
                    <Card>
                        <BlockStack gap="400">
                            <InlineStack align="space-between" blockAlign="center">
                                <BlockStack gap="100">
                                    <InlineStack gap="200" blockAlign="center">
                                        <Text variant="headingMd" as="h2">
                                            Daily Donation Subscription
                                        </Text>
                                        {currentlyActive ? (
                                            <Badge tone="success">Active</Badge>
                                        ) : (
                                            <Badge tone="enabled">Inactive</Badge>
                                        )}
                                    </InlineStack>
                                    <Text variant="bodySm" tone="subdued" as="p">
                                        When enabled, a "Daily Donation" option appears alongside Weekly
                                        and Monthly in the recurring donation frequency dropdown on your
                                        storefront. Customers who select this plan will be billed every day.
                                    </Text>
                                </BlockStack>
                            </InlineStack>

                            <Divider />

                            <BlockStack gap="300">
                                <InlineStack gap="200" blockAlign="center">
                                    <Text variant="bodyMd" fontWeight="semibold" as="span">
                                        Billing Frequency:
                                    </Text>
                                    <Text variant="bodyMd" as="span">
                                        Every day (DAY interval, count 1)
                                    </Text>
                                </InlineStack>

                                <InlineStack gap="200" blockAlign="center">
                                    <Text variant="bodyMd" fontWeight="semibold" as="span">
                                        Customer Label:
                                    </Text>
                                    <Text variant="bodyMd" as="span">
                                        "Daily Donation"
                                    </Text>
                                </InlineStack>

                                <InlineStack gap="200" blockAlign="center">
                                    <Text variant="bodyMd" fontWeight="semibold" as="span">
                                        Selling Plan Group:
                                    </Text>
                                    <Text variant="bodyMd" as="span">
                                        {sellingPlanGroupId
                                            ? `Recurring Donations (${sellingPlanGroupId.split("/").pop()})`
                                            : "Not configured"}
                                    </Text>
                                </InlineStack>

                                {dailyPlanId && currentlyActive && (
                                    <InlineStack gap="200" blockAlign="center">
                                        <Text variant="bodyMd" fontWeight="semibold" as="span">
                                            Plan ID:
                                        </Text>
                                        <Text variant="bodySm" tone="subdued" as="span">
                                            {dailyPlanId}
                                        </Text>
                                    </InlineStack>
                                )}
                            </BlockStack>

                            <Divider />

                            <InlineStack align="end" gap="200">
                                {currentlyActive ? (
                                    <Button
                                        tone="critical"
                                        loading={isSubmitting}
                                        disabled={isSubmitting}
                                        onClick={() => {
                                            if (
                                                confirm(
                                                    "Are you sure you want to disable Daily Donation? The plan will be removed from Shopify and will no longer appear on the storefront."
                                                )
                                            ) {
                                                fetcher.submit(
                                                    { _action: "disable" },
                                                    { method: "POST" }
                                                );
                                            }
                                        }}
                                    >
                                        Disable Daily Donation
                                    </Button>
                                ) : (
                                    <Button
                                        variant="primary"
                                        loading={isSubmitting}
                                        disabled={isSubmitting}
                                        onClick={() =>
                                            fetcher.submit(
                                                { _action: "enable" },
                                                { method: "POST" }
                                            )
                                        }
                                    >
                                        Enable Daily Donation
                                    </Button>
                                )}
                            </InlineStack>
                        </BlockStack>
                    </Card>
                </Layout.Section>

                <Layout.Section>
                    <Card>
                        <BlockStack gap="300">
                            <Text variant="headingMd" as="h2">
                                How It Works
                            </Text>
                            <BlockStack gap="200">
                                <Text variant="bodyMd" as="p">
                                    <strong>1.</strong> Enable the Daily Donation plan above. This adds
                                    a "Daily Donation" selling plan to your existing Recurring Donations
                                    group in Shopify.
                                </Text>
                                <Text variant="bodyMd" as="p">
                                    <strong>2.</strong> On your storefront, the "Daily Donation" option
                                    will automatically appear in the frequency dropdown alongside Weekly
                                    and Monthly.
                                </Text>
                                <Text variant="bodyMd" as="p">
                                    <strong>3.</strong> When a customer selects "Daily Donation" and completes
                                    checkout, Shopify creates a subscription contract that bills every day.
                                </Text>
                                <Text variant="bodyMd" as="p">
                                    <strong>4.</strong> All existing subscription management features
                                    (pause, resume, cancel, payment recovery) work automatically with
                                    daily subscriptions.
                                </Text>
                            </BlockStack>
                        </BlockStack>
                    </Card>
                </Layout.Section>
            </Layout>
        </Page>
    );
}
