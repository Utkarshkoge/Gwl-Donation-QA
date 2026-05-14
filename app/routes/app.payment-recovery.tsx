import { useState, useCallback, useRef, useEffect } from "react";
import {
    InlineStack,
    Box,
    Text,
    Badge,
    Icon,
    Divider,
    Select,
} from "@shopify/polaris";
import {
    CheckIcon,
    EditIcon,
    AlertBubbleIcon,
} from "@shopify/polaris-icons";
import { useAppBridge } from "@shopify/app-bridge-react";
import { Link } from "react-router";

export default function PaymentRecoveryPage() {
    const shopify = useAppBridge();

    const [enabled, setEnabled] = useState(true);
    const [retryAttempts, setRetryAttempts] = useState("8");
    const [retryInterval, setRetryInterval] = useState("1");
    const [fallbackAction, setFallbackAction] = useState("skip");
    const [sendNotifications, setSendNotifications] = useState(true);

    const handleEnabledChange = useCallback((e: any) => setEnabled(e.target.checked), []);
    const handleRetryAttemptsChange = useCallback((value: string) => setRetryAttempts(value), []);
    const handleRetryIntervalChange = useCallback((value: string) => setRetryInterval(value), []);
    const handleFallbackActionChange = useCallback((value: string) => setFallbackAction(value), []);
    const handleSendNotificationsChange = useCallback((e: any) => setSendNotifications(e.target.checked), []);

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

            <div style={{ display: "flex", flexDirection: "column", gap: "24px", marginTop: "16px" }}>
                
                {/* Info Banner */}
                <div style={{ background: "#e1f5fe", padding: "20px", borderRadius: "12px", border: "1px solid #b3e5fc", display: "flex", gap: "16px", alignItems: "flex-start" }}>
                    <div style={{ background: "#0288d1", borderRadius: "50%", padding: "4px", flexShrink: 0 }}>
                        <Icon source={AlertBubbleIcon} tone="info" />
                    </div>
                    <div>
                        <div style={{ fontWeight: "700", fontSize: "16px", marginBottom: "4px", color: "#01579b" }}>
                            Maximize revenue recovery with intelligent payment retry automation
                        </div>
                        <div style={{ fontSize: "14px", color: "#0277bd", lineHeight: "1.5" }}>
                            Industry studies show that automated payment recovery can recover up to 30% of failed transactions. 
                            Configure your strategy below to reduce involuntary churn and increase customer lifetime value.
                        </div>
                    </div>
                </div>

                <div style={{ display: "flex", gap: "24px" }}>
                    {/* Left Column: Description */}
                    <div style={{ flex: "0 0 300px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                            <div style={{ fontSize: "18px", fontWeight: "700" }}>Recovery Settings</div>
                            <Badge tone="info">Pro Plan</Badge>
                        </div>
                        <div style={{ fontSize: "14px", color: "#6D7175", lineHeight: "1.6" }}>
                            Configure your intelligent payment recovery system to automatically handle failed transactions and maximize subscription revenue.
                        </div>
                    </div>

                    {/* Right Column: Settings Card */}
                    <div style={{ flex: 1 }}>
                        <div style={{ background: "white", border: "1px solid #EBEBEB", borderRadius: "12px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                            
                            {/* Pro Tip Card */}
                            <div style={{ background: "#f0fdf4", padding: "16px", borderRadius: "8px", border: "1px solid #dcfce7", marginBottom: "24px", display: "flex", gap: "12px", alignItems: "flex-start" }}>
                                <div style={{ background: "#16a34a", borderRadius: "50%", padding: "4px", flexShrink: 0 }}>
                                    <Icon source={CheckIcon} tone="info" />
                                </div>
                                <div>
                                    <span style={{ fontWeight: "700", color: "#166534" }}>Pro Tip:</span>
                                    <span style={{ fontSize: "14px", color: "#166534", marginLeft: "6px" }}>
                                        The optimal configuration is 3 retry attempts with 3-day intervals. This balances high recovery rates with customer experience.
                                    </span>
                                </div>
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                                
                                {/* Enable Toggle */}
                                <div style={{ display: "flex", alignItems: "center", gap: "12px", background: enabled ? "#f8f9fa" : "transparent", padding: "12px", borderRadius: "8px", border: "1px solid #e1e3e5" }}>
                                    <input 
                                        type="checkbox" 
                                        id="enableRecovery"
                                        checked={enabled}
                                        onChange={handleEnabledChange}
                                        style={{ width: "20px", height: "20px", cursor: "pointer", accentColor: "#6C4A79" }}
                                    />
                                    <label htmlFor="enableRecovery" style={{ fontSize: "15px", fontWeight: "600", cursor: "pointer" }}>
                                        Enable Smart Payment Recovery
                                    </label>
                                </div>

                                <div style={{ opacity: enabled ? 1 : 0.5, pointerEvents: enabled ? "auto" : "none", display: "flex", flexDirection: "column", gap: "24px" }}>
                                    
                                    {/* Grid for Selects */}
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                                        <Select
                                            label="Smart Recovery Attempts"
                                            options={retryAttemptsOptions}
                                            value={retryAttempts}
                                            onChange={handleRetryAttemptsChange}
                                        />
                                        <Select
                                            label="Retry Interval"
                                            options={retryIntervalOptions}
                                            value={retryInterval}
                                            onChange={handleRetryIntervalChange}
                                        />
                                    </div>

                                    <Select
                                        label="Fallback Action"
                                        options={fallbackActionOptions}
                                        value={fallbackAction}
                                        onChange={handleFallbackActionChange}
                                        helpText="What happens if all retry attempts fail."
                                    />

                                    <Divider />

                                    {/* Communication Section */}
                                    <div>
                                        <div style={{ fontSize: "16px", fontWeight: "700", marginBottom: "16px" }}>Customer Communication</div>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8f9fa", padding: "16px", borderRadius: "8px", border: "1px solid #e1e3e5" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                                <input 
                                                    type="checkbox" 
                                                    id="sendNotifications"
                                                    checked={sendNotifications}
                                                    onChange={handleSendNotificationsChange}
                                                    style={{ width: "18px", height: "18px", cursor: "pointer", accentColor: "#6C4A79" }}
                                                />
                                                <label htmlFor="sendNotifications" style={{ fontSize: "14px", fontWeight: "600", cursor: "pointer" }}>
                                                    Send payment failure notifications
                                                </label>
                                            </div>
                                            <Link to="/app/email-settings" style={{ textDecoration: "none" }}>
                                                <s-button icon={EditIcon} variant="tertiary">
                                                    Customize Email
                                                </s-button>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Support */}
                <div style={{ textAlign: "center", padding: "40px 0", borderTop: "1px solid #EBEBEB", marginTop: "20px" }}>
                    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "6px" }}>
                        <span style={{ color: "#6D7175" }}>If you need support, we are</span>
                        <Link to="/app/help" style={{ color: "#6C4A79", fontWeight: "600", textDecoration: "none" }}>here</Link>
                        <span style={{ color: "#6D7175" }}>for you ❤️</span>
                    </div>
                </div>
            </div>

            <style>{`
                s-page::part(header) {
                    border-bottom: 1px solid #dfe3e8;
                    margin-bottom: 20px;
                }
            `}</style>
        </s-page>
    );
}
