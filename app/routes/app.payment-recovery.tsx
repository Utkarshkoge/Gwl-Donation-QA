import { useState, useCallback } from "react";
import {
    Icon,
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
        shopify.toast.show("Recovery settings updated");
    };

    const THEME_COLOR = "#51395c";

    return (
        <s-page heading="Failed Payment Recovery Settings">
            <s-button
                slot="primary-action"
                variant="primary"
                onClick={handleSave}
                style={{ backgroundColor: THEME_COLOR, borderColor: THEME_COLOR }}
            >
                Save Settings
            </s-button>

            <div className="payment-recovery-wrapper">
                <s-grid gridTemplateColumns="repeat(12, 1fr)" gap="large">
                    
                    {/* Left Column: Form Settings */}
                    <s-grid-item gridColumn="span 8">
                        <s-stack gap="large">
                            
                            {/* Recovery Status */}
                            <s-section className="theme-card">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                    <s-heading>Recovery Status</s-heading>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <s-badge tone={enabled ? "success" : "caution"}>
                                            {enabled ? "ACTIVE" : "DISABLED"}
                                        </s-badge>
                                        <s-badge tone="info" className="pro-badge">PRO PLAN</s-badge>
                                    </div>
                                </div>
                                <s-paragraph color="subdued">
                                    Intelligent recovery automatically retries failed recurring payments using smart intervals to maximize success rates and reduce churn.
                                </s-paragraph>
                                <div style={{ marginTop: '20px' }}>
                                    <s-button
                                        onClick={() => setEnabled(!enabled)}
                                        variant={enabled ? "secondary" : "primary"}
                                        className={!enabled ? "primary-theme-btn" : ""}
                                    >
                                        {enabled ? "Disable Recovery System" : "Enable Recovery System"}
                                    </s-button>
                                </div>
                            </s-section>

                            {/* Configuration Logic */}
                            <s-section className="theme-card">
                                <s-heading>Retry Strategy</s-heading>
                                <s-paragraph color="subdued">
                                    Configure the automated retry flow. We recommend at least 3 attempts for optimal recovery results.
                                </s-paragraph>
                                
                                <div className="settings-grid">
                                    <div className="setting-item">
                                        <Select
                                            label="Maximum Retry Attempts"
                                            options={retryAttemptsOptions}
                                            value={retryAttempts}
                                            onChange={handleRetryAttemptsChange}
                                            disabled={!enabled}
                                        />
                                    </div>
                                    <div className="setting-item">
                                        <Select
                                            label="Wait Interval (Days)"
                                            options={retryIntervalOptions}
                                            value={retryInterval}
                                            onChange={handleRetryIntervalChange}
                                            disabled={!enabled}
                                        />
                                    </div>
                                </div>
                                
                                <div style={{ marginTop: '24px' }}>
                                    <Select
                                        label="Final Fallback Action"
                                        options={fallbackActionOptions}
                                        value={fallbackAction}
                                        onChange={handleFallbackActionChange}
                                        helpText="What should happen to the subscription if all recovery attempts fail?"
                                        disabled={!enabled}
                                    />
                                </div>
                            </s-section>

                            {/* Notifications */}
                            <s-section className="theme-card">
                                <s-heading>Communication</s-heading>
                                <div className="notification-row">
                                    <s-checkbox
                                        checked={sendNotifications}
                                        onChange={(e: any) => setSendNotifications(e.target.checked)}
                                        label="Notify customers about payment failures"
                                        disabled={!enabled}
                                    />
                                    
                                    {sendNotifications && (
                                        <div className="template-box">
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div className="icon-circle">
                                                    <Icon source={EditIcon} tone="base" />
                                                </div>
                                                <div>
                                                    <s-text type="strong">Email Template</s-text>
                                                    <s-text color="subdued" size="small">Customize the failure notice email</s-text>
                                                </div>
                                            </div>
                                            <Link to="/app/email-settings" className="theme-link">
                                                Edit Design
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            </s-section>
                        </s-stack>
                    </s-grid-item>

                    {/* Right Column: Visual Journey */}
                    <s-grid-item gridColumn="span 4">
                        <div className="sticky-preview">
                            <s-box padding="large" borderWidth="base" borderRadius="large" background="white" className="preview-card">
                                <div className="preview-header">
                                    <s-text type="strong">Recovery Journey</s-text>
                                    <div className="live-indicator">
                                        <span className="dot"></span> LIVE PREVIEW
                                    </div>
                                </div>
                                
                                <div className="timeline">
                                    <div className="timeline-item start">
                                        <div className="timeline-marker failure">!</div>
                                        <div className="timeline-content">
                                            <s-text type="strong">Payment Failed</s-text>
                                            <s-text color="subdued" size="small">Day 0</s-text>
                                        </div>
                                    </div>

                                    {[...Array(Math.min(Number(retryAttempts), 3))].map((_, i) => (
                                        <div key={i} className="timeline-item retry">
                                            <div className="timeline-line"></div>
                                            <div className="timeline-marker theme"></div>
                                            <div className="timeline-content">
                                                <s-text type="strong">Retry #{i + 1}</s-text>
                                                <s-text color="subdued" size="small">Day {(i + 1) * Number(retryInterval)}</s-text>
                                            </div>
                                        </div>
                                    ))}

                                    {Number(retryAttempts) > 3 && (
                                        <div className="timeline-more">
                                            <div className="timeline-line"></div>
                                            <span>+ {Number(retryAttempts) - 3} more attempts</span>
                                        </div>
                                    )}

                                    <div className="timeline-item end">
                                        <div className="timeline-line"></div>
                                        <div className="timeline-marker fallback"></div>
                                        <div className="timeline-content">
                                            <s-text type="strong">Resolution</s-text>
                                            <s-text color="subdued" size="small">
                                                {fallbackAction === 'skip' ? 'Skip Order' : fallbackAction === 'pause' ? 'Pause Sub' : 'Cancel Sub'}
                                            </s-text>
                                        </div>
                                    </div>
                                </div>

                                <div className="pro-tip-box">
                                    <Icon source={AlertBubbleIcon} tone="info" />
                                    <s-text size="small">
                                        <strong>Expert Tip:</strong> Retrying every 3 days is optimal for credit card updates.
                                    </s-text>
                                </div>
                            </s-box>

                            <div className="support-footer">
                                <s-text color="subdued">Need assistance? <Link to="/app/help" className="theme-link">Contact Support</Link></s-text>
                            </div>
                        </div>
                    </s-grid-item>
                </s-grid>
            </div>

            <style>{`
                .payment-recovery-wrapper {
                    margin-top: 24px;
                    padding-bottom: 60px;
                }

                .theme-card {
                    background: white;
                    border-radius: 12px !important;
                    border: 1px solid #ebebeb !important;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.02) !important;
                    padding: 24px !important;
                    transition: all 0.2s ease;
                }

                .theme-card:hover {
                    border-color: ${THEME_COLOR}40 !important;
                    box-shadow: 0 4px 12px rgba(81, 57, 92, 0.05) !important;
                }

                .pro-badge {
                    background: ${THEME_COLOR}15 !important;
                    color: ${THEME_COLOR} !important;
                    font-weight: 700 !important;
                    letter-spacing: 0.05em;
                }

                .primary-theme-btn {
                    background: ${THEME_COLOR} !important;
                    border-color: ${THEME_COLOR} !important;
                    color: white !important;
                }

                .settings-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 24px;
                    margin-top: 20px;
                }

                .notification-row {
                    margin-top: 16px;
                }

                .template-box {
                    margin-top: 20px;
                    padding: 16px;
                    background: #fcfaff;
                    border: 1px solid ${THEME_COLOR}20;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }

                .icon-circle {
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    background: ${THEME_COLOR}10;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: ${THEME_COLOR};
                }

                .theme-link {
                    color: ${THEME_COLOR} !important;
                    font-weight: 600;
                    text-decoration: none;
                }

                .theme-link:hover {
                    text-decoration: underline;
                }

                .sticky-preview {
                    position: sticky;
                    top: 24px;
                }

                .preview-card {
                    border: 1px solid #ebebeb !important;
                    box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05) !important;
                }

                .preview-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 24px;
                    padding-bottom: 12px;
                    border-bottom: 1px solid #f0f0f0;
                }

                .live-indicator {
                    font-size: 10px;
                    font-weight: 800;
                    color: #10b981;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }

                .live-indicator .dot {
                    width: 6px;
                    height: 6px;
                    background: #10b981;
                    border-radius: 50%;
                    animation: pulse 2s infinite;
                }

                @keyframes pulse {
                    0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
                    70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
                    100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
                }

                .timeline {
                    padding-left: 12px;
                    margin-bottom: 24px;
                }

                .timeline-item {
                    display: flex;
                    gap: 20px;
                    position: relative;
                }

                .timeline-line {
                    position: absolute;
                    left: 9px;
                    top: -24px;
                    bottom: 16px;
                    width: 2px;
                    background: #f0f0f0;
                    z-index: 1;
                }

                .timeline-marker {
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 10px;
                    font-weight: bold;
                    z-index: 2;
                    margin-top: 4px;
                    background: white;
                    border: 2px solid #ddd;
                }

                .timeline-marker.failure { background: #fee2e2; color: #ef4444; border-color: #fca5a5; }
                .timeline-marker.theme { background: ${THEME_COLOR}; border-color: ${THEME_COLOR}; }
                .timeline-marker.fallback { background: #374151; border-color: #374151; }

                .timeline-content {
                    padding-bottom: 24px;
                    display: flex;
                    flex-direction: column;
                }

                .timeline-more {
                    position: relative;
                    padding-left: 40px;
                    padding-bottom: 24px;
                    font-size: 12px;
                    color: #999;
                    font-style: italic;
                }

                .pro-tip-box {
                    background: #f0f7ff;
                    padding: 16px;
                    border-radius: 12px;
                    display: flex;
                    gap: 12px;
                    border: 1px solid #e0efff;
                }

                .support-footer {
                    margin-top: 24px;
                    text-align: center;
                }

                /* Polaris Select overrides */
                .Polaris-Select__Backdrop {
                    border-radius: 8px !important;
                }
                
                .Polaris-Select:focus-within .Polaris-Select__Backdrop {
                    border-color: ${THEME_COLOR} !important;
                    box-shadow: 0 0 0 1px ${THEME_COLOR} !important;
                }
            `}</style>
        </s-page>
    );
}
