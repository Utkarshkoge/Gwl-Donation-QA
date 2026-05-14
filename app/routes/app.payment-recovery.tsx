import { useState, useCallback } from "react";
import {
    Page,
    Layout,
    Card,
    Text,
    Banner,
    Badge,
    BlockStack,
    InlineStack,
    Checkbox,
    Select,
    Button,
    Box,
    Icon,
    Link,
    Grid,
    Divider,
} from "@shopify/polaris";
import {
    AlertBubbleIcon,
    CheckIcon,
    EditIcon,
    PlayIcon,
    XIcon,
} from "@shopify/polaris-icons";

export default function PaymentRecoveryPage() {
    const [enabled, setEnabled] = useState(true);
    const [retryAttempts, setRetryAttempts] = useState("8");
    const [retryInterval, setRetryInterval] = useState("1");
    const [fallbackAction, setFallbackAction] = useState("skip");
    const [sendNotifications, setSendNotifications] = useState(true);
    const [showTutorials, setShowTutorials] = useState(true);

    const handleEnabledChange = useCallback((value: boolean) => setEnabled(value), []);
    const handleRetryAttemptsChange = useCallback((value: string) => setRetryAttempts(value), []);
    const handleRetryIntervalChange = useCallback((value: string) => setRetryInterval(value), []);
    const handleFallbackActionChange = useCallback((value: string) => setFallbackAction(value), []);
    const handleSendNotificationsChange = useCallback((value: boolean) => setSendNotifications(value), []);

    const retryAttemptsOptions = Array.from({ length: 10 }, (_, i) => ({
        label: `${i + 1} attempts`,
        value: `${i + 1}`,
    }));

    const retryIntervalOptions = Array.from({ length: 10 }, (_, i) => ({
        label: `${i + 1} Day${i === 0 ? "" : "s"}`,
        value: `${i + 1}`,
    }));

    const fallbackActionOptions = [
        { label: "Pause Subscription", value: "pause" },
        { label: "Cancel Subscription", value: "cancel" },
        { label: "Skip Failed Order - Continue subscription, skip this order only", value: "skip" },
    ];

    return (
        <Page
            title="Failed Payment Recovery Settings"
            backAction={{ content: "Subscription Management", url: "/app/recurring-subscriptions" }}
            primaryAction={{ content: "Save Settings", onAction: () => { } }}
        >
            <BlockStack gap="500">
                <Banner tone="info" icon={AlertBubbleIcon}>
                    <BlockStack gap="200">
                        <Text variant="headingMd" as="h2">Maximize revenue recovery with intelligent payment retry automation</Text>
                        <Text as="p">
                            Industry studies show that automated payment recovery can recover up to 30% of failed transactions.
                            Configure your strategy below to reduce involuntary churn and increase customer lifetime value.
                        </Text>
                    </BlockStack>
                </Banner>

                <Layout>
                    <Layout.AnnotatedSection
                        title="Recovery Settings"
                        description={
                            <BlockStack gap="200">
                                <InlineStack gap="200" align="start">
                                    <Badge tone="info">Pro Plan</Badge>
                                </InlineStack>
                                <Text as="p" tone="subdued">
                                    Configure your intelligent payment recovery system to automatically handle failed transactions and maximize subscription revenue.
                                </Text>
                            </BlockStack>
                        }
                    >
                        <BlockStack gap="400">
                            <Card padding="400">
                                <Box background="bg-surface-secondary" padding="400" borderRadius="200">
                                    <InlineStack gap="300" align="start" wrap={false}>
                                        <div style={{ backgroundColor: '#008060', borderRadius: '50%', padding: '4px' }}>
                                            <Icon source={CheckIcon} tone="info" />
                                        </div>
                                        <BlockStack gap="100">
                                            <Text variant="headingSm" as="h3">
                                                Pro Tip: <Text as="span" fontWeight="regular">The optimal configuration is 3 retry attempts with 3-day intervals. This balances high recovery rates with customer experience, giving them adequate time to update payment methods while maintaining engagement.</Text>
                                            </Text>
                                        </BlockStack>
                                    </InlineStack>
                                </Box>
                                
                                <Box paddingBlockStart="400">
                                    <BlockStack gap="400">
                                        <Checkbox
                                            label="Enable Smart Payment Recovery"
                                            checked={enabled}
                                            onChange={handleEnabledChange}
                                        />

                                        <Grid>
                                            <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 6, xl: 6 }}>
                                                <Select
                                                    label="Smart Recovery Attempts"
                                                    options={retryAttemptsOptions}
                                                    value={retryAttempts}
                                                    onChange={handleRetryAttemptsChange}
                                                    disabled={!enabled}
                                                />
                                            </Grid.Cell>
                                            <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 6, xl: 6 }}>
                                                <Select
                                                    label="Retry Interval"
                                                    options={retryIntervalOptions}
                                                    value={retryInterval}
                                                    onChange={handleRetryIntervalChange}
                                                    disabled={!enabled}
                                                />
                                            </Grid.Cell>
                                        </Grid>

                                        <Select
                                            label="Fallback Action"
                                            options={fallbackActionOptions}
                                            value={fallbackAction}
                                            onChange={handleFallbackActionChange}
                                            disabled={!enabled}
                                        />

                                        <Divider />

                                        <BlockStack gap="200">
                                            <Text variant="headingSm" as="h3">Customer Communication</Text>
                                            <InlineStack gap="400" align="start" blockAlign="center">
                                                <Checkbox
                                                    label="Send payment failure notifications"
                                                    checked={sendNotifications}
                                                    onChange={handleSendNotificationsChange}
                                                    disabled={!enabled}
                                                />
                                                <Button variant="tertiary" icon={EditIcon} onClick={() => { }}>
                                                    Customize Email
                                                </Button>
                                            </InlineStack>
                                        </BlockStack>
                                    </BlockStack>
                                </Box>
                            </Card>
                        </BlockStack>
                    </Layout.AnnotatedSection>

                    {showTutorials && (
                        <Layout.Section>
                            <Card padding="400">
                                <BlockStack gap="400">
                                    <InlineStack align="space-between">
                                        <Text variant="headingMd" as="h2">Tutorials</Text>
                                        <Button
                                            variant="tertiary"
                                            icon={XIcon}
                                            onClick={() => setShowTutorials(false)}
                                            accessibilityLabel="Close tutorials"
                                        />
                                    </InlineStack>

                                    <Grid>
                                        <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 6, xl: 6 }}>
                                            <Box
                                                background="bg-surface-secondary"
                                                borderRadius="200"
                                                padding="0"
                                                overflowX="hidden"
                                                overflowY="hidden"
                                                minHeight="140px"
                                                borderStyle="solid"
                                                borderWidth="025"
                                                borderColor="border"
                                            >
                                                <InlineStack wrap={false}>
                                                    <Box padding="400" width="100px" background="bg-surface-tertiary">
                                                        <Text variant="headingLg" as="p" alignment="center">Appstle articles</Text>
                                                    </Box>
                                                    <Box padding="400">
                                                        <BlockStack gap="300">
                                                            <Text variant="headingSm" as="h3">Failed Payment Recovery in Appstle Subscriptions</Text>
                                                            <Button variant="secondary" onClick={() => { }}>Read article</Button>
                                                        </BlockStack>
                                                    </Box>
                                                </InlineStack>
                                            </Box>
                                        </Grid.Cell>
                                        <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 6, xl: 6 }}>
                                            <Box
                                                background="bg-surface-secondary"
                                                borderRadius="200"
                                                padding="0"
                                                overflowX="hidden"
                                                overflowY="hidden"
                                                minHeight="140px"
                                                borderStyle="solid"
                                                borderWidth="025"
                                                borderColor="border"
                                            >
                                                <InlineStack wrap={false}>
                                                    <Box width="150px" background="bg-surface-tertiary" minHeight="140px" position="relative">
                                                        <div style={{
                                                            width: '100%',
                                                            height: '100%',
                                                            backgroundColor: '#808080',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            position: 'relative'
                                                        }}>
                                                            <Icon source={PlayIcon} tone="base" />
                                                            <div style={{
                                                                position: 'absolute',
                                                                bottom: '8px',
                                                                left: '8px',
                                                                backgroundColor: 'rgba(0,0,0,0.6)',
                                                                color: 'white',
                                                                padding: '2px 6px',
                                                                borderRadius: '4px',
                                                                fontSize: '12px'
                                                            }}>
                                                                2:06
                                                            </div>
                                                        </div>
                                                    </Box>
                                                    <Box padding="400">
                                                        <BlockStack gap="300">
                                                            <Text variant="headingSm" as="h3">Failed Payment Recovery</Text>
                                                            <Button variant="secondary" onClick={() => { }}>Watch Video</Button>
                                                        </BlockStack>
                                                    </Box>
                                                </InlineStack>
                                            </Box>
                                        </Grid.Cell>
                                    </Grid>
                                </BlockStack>
                            </Card>
                        </Layout.Section>
                    )}
                </Layout>

                <Box paddingBlockEnd="800">
                    <InlineStack align="center" gap="100">
                        <Text as="p" tone="subdued">If you need support, we are</Text>
                        <Link url="/app/help">here</Link>
                        <Text as="p" tone="subdued">for you ❤️</Text>
                    </InlineStack>
                </Box>
            </BlockStack>
        </Page>
    );
}
