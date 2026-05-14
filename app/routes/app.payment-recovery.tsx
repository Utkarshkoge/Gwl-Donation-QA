import { useState, useCallback, useRef, useEffect } from "react";
import {
    InlineStack,
    Box,
    Text,
    Icon,
    Divider,
    Select,
} from "@shopify/polaris";
import {
    EditIcon,
    AlertBubbleIcon,
} from "@shopify/polaris-icons";
import { useAppBridge } from "@shopify/app-bridge-react";
import { Link } from "react-router";

export default function PaymentRecoveryPage() {
    const shopify = useAppBridge();

    const [enabled, setEnabled] = useState(true);
    const [retryAttempts, setRetryAttempts] = useState("3");
    const [retryInterval, setRetryInterval] = useState("3");
    const [fallbackAction, setFallbackAction] = useState("skip");
    const [sendNotifications, setSendNotifications] = useState(true);

    const handleRetryAttemptsChange = useCallback((value: string) => setRetryAttempts(value), []);
    const handleRetryIntervalChange = useCallback((value: string) => setRetryInterval(value), []);
    const handleFallbackActionChange = useCallback((value: string) => setFallbackAction(value), []);

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
        { label: "Skip Failed Order", value: "skip" },
    ];

    const handleSave = () => {
        shopify.toast.show("Recovery settings saved successfully");
    };

    return (
        <s-page heading="Failed Payment Recovery Settings">
            <s-button
                slot="primary-action"
                variant="primary"
                onClick={handleSave}
            >
                Save Settings
            </s-button>

            <div style={{ marginTop: '16px' }}>
                <s-grid gridTemplateColumns="repeat(12, 1fr)" gap="base">
                    
                    {/* Left Side: Configuration */}
                    <s-grid-item gridColumn="span 8">
                        <s-stack gap="base">
                            
                            {/* Recovery Status Section */}
                            <s-section>
                                <s-heading>Recovery Status</s-heading>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                    <s-badge tone={enabled ? "success" : "caution"}>
                                        {enabled ? "Active" : "Disabled"}
                                    </s-badge>
                                    <s-badge tone="info">Pro Plan</s-badge>
                                </div>
                                <s-paragraph>
                                    Enable or disable the intelligent payment recovery system. When active, the system will automatically retry failed recurring charges.
                                </s-paragraph>
                                <div style={{ marginTop: '12px' }}>
                                    <s-button
                                        onClick={() => setEnabled(!enabled)}
                                        variant={enabled ? "secondary" : "primary"}
                                    >
                                        {enabled ? "Disable Recovery" : "Enable Recovery"}
                                    </s-button>
                                </div>
                            </s-section>

                            {/* Retry Logic Section */}
                            <s-section>
                                <s-heading>Retry Logic</s-heading>
                                <s-paragraph>
                                    Configure how many times and how often the system should attempt to recover a failed payment before taking fallback action.
                                </s-paragraph>
                                
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '16px' }}>
                                    <Select
                                        label="Number of Retry Attempts"
                                        options={retryAttemptsOptions}
                                        value={retryAttempts}
                                        onChange={handleRetryAttemptsChange}
                                        disabled={!enabled}
                                    />
                                    <Select
                                        label="Retry Interval (Days)"
                                        options={retryIntervalOptions}
                                        value={retryInterval}
                                        onChange={handleRetryIntervalChange}
                                        disabled={!enabled}
                                    />
                                </div>
                                
                                <div style={{ marginTop: '16px' }}>
                                    <Select
                                        label="Final Fallback Action"
                                        options={fallbackActionOptions}
                                        value={fallbackAction}
                                        onChange={handleFallbackActionChange}
                                        helpText="The action to be taken automatically if all retry attempts fail."
                                        disabled={!enabled}
                                    />
                                </div>
                            </s-section>

                            {/* Communication Section */}
                            <s-section>
                                <s-heading>Customer Communication</s-heading>
                                <s-paragraph>
                                    Stay transparent with your customers by sending automated notifications when their payment fails.
                                </s-paragraph>
                                
                                <div style={{ marginTop: '16px' }}>
                                    <s-checkbox
                                        checked={sendNotifications}
                                        onChange={(e: any) => setSendNotifications(e.target.checked)}
                                        label="Send payment failure notifications to customers"
                                        disabled={!enabled}
                                    />
                                </div>

                                {sendNotifications && (
                                    <div style={{ marginTop: '12px', padding: '12px', background: '#f6f6f7', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <s-text color="subdued">
                                            Notification template can be customized in Email Settings.
                                        </s-text>
                                        <Link to="/app/email-settings" style={{ textDecoration: 'none' }}>
                                            <s-button icon={EditIcon} variant="tertiary">
                                                Edit Template
                                            </s-button>
                                        </Link>
                                    </div>
                                )}
                            </s-section>
                        </s-stack>
                    </s-grid-item>

                    {/* Right Side: Live Preview */}
                    <s-grid-item gridColumn="span 4">
                        <div style={{ position: 'sticky', top: '20px' }}>
                            <s-box padding="base" borderWidth="base" borderRadius="base" background="subdued">
                                <s-paragraph>
                                    <strong>Recovery Timeline Preview</strong>
                                </s-paragraph>
                                <s-divider />
                                
                                <div style={{ marginTop: '16px' }}>
                                    <s-stack gap="base">
                                        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#ff4d4f', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>!</div>
                                            <div>
                                                <s-text type="strong">Initial Failure</s-text>
                                                <s-paragraph size="small">Day 0: Payment fails</s-paragraph>
                                            </div>
                                        </div>

                                        {[...Array(Math.min(Number(retryAttempts), 3))].map((_, i) => (
                                            <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', paddingLeft: '4px', borderLeft: '2px dashed #d9d9d9', marginLeft: '11px', paddingBottom: '16px' }}>
                                                <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#1890ff', marginTop: '4px' }}></div>
                                                <div>
                                                    <s-text type="strong">Retry #{i + 1}</s-text>
                                                    <s-paragraph size="small">Day {(i + 1) * Number(retryInterval)}</s-paragraph>
                                                </div>
                                            </div>
                                        ))}

                                        {Number(retryAttempts) > 3 && (
                                            <div style={{ paddingLeft: '28px', marginBottom: '16px' }}>
                                                <s-text color="subdued">... {Number(retryAttempts) - 3} more retries</s-text>
                                            </div>
                                        )}

                                        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', borderLeft: '2px solid #ff4d4f', marginLeft: '11px', paddingLeft: '4px' }}>
                                            <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#ff4d4f', marginTop: '4px' }}></div>
                                            <div>
                                                <s-text type="strong">Final Action</s-text>
                                                <s-paragraph size="small">
                                                    {fallbackAction === 'skip' ? 'Skip Failed Order' : fallbackAction === 'pause' ? 'Pause Subscription' : 'Cancel Subscription'}
                                                </s-paragraph>
                                            </div>
                                        </div>
                                    </s-stack>
                                </div>

                                <div style={{ marginTop: '24px', padding: '12px', background: '#e6f7ff', borderRadius: '8px', display: 'flex', gap: '10px' }}>
                                    <Icon source={AlertBubbleIcon} tone="info" />
                                    <s-text size="small">
                                        <strong>Pro Tip:</strong> Most merchants see the best recovery results with 3 retries over 9 days.
                                    </s-text>
                                </div>
                            </s-box>

                            <div style={{ marginTop: '24px', textAlign: 'center' }}>
                                <s-text color="subdued">
                                    Need help? <Link to="/app/help">Contact Support</Link>
                                </s-text>
                            </div>
                        </div>
                    </s-grid-item>

                </s-grid>
            </div>
        </s-page>
    );
}
