import { useState, useCallback } from "react";
import {
    Icon,
    Select,
} from "@shopify/polaris";
import {
    EditIcon,
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

    const THEME_COLOR = "#51395c";

    return (
        <s-page heading="Failed Payment Recovery Settings">
            <s-button
                slot="primary-action"
                variant="primary"
                onClick={handleSave}
                className="main-save-btn"
            >
                Save Settings
            </s-button>

            <div className="recovery-settings-layout">
                {/* Section 1: Activation */}
                <div className="settings-row">
                    <div className="settings-info">
                        <h2 className="section-title">Enable Recovery</h2>
                        <p className="section-desc">
                            When enabled, our intelligent system will monitor and automatically retry failed recurring transactions to maximize your revenue.
                        </p>
                        <div style={{ marginTop: '12px' }}>
                            <s-badge tone={enabled ? "success" : "caution"}>
                                {enabled ? "Currently Active" : "Currently Disabled"}
                            </s-badge>
                        </div>
                    </div>
                    <div className="settings-card">
                        <div className="card-content">
                            <div className="toggle-box">
                                <div className="toggle-text">
                                    <strong>Smart Recovery System</strong>
                                    <span>Automate the retry flow for failed billing attempts.</span>
                                </div>
                                <label className="custom-switch">
                                    <input 
                                        type="checkbox" 
                                        checked={enabled} 
                                        onChange={(e) => setEnabled(e.target.checked)} 
                                    />
                                    <span className="custom-slider"></span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                <div className={`recovery-logic-container ${enabled ? 'active' : 'disabled'}`}>
                    {/* Section 2: Strategy */}
                    <div className="settings-row">
                        <div className="settings-info">
                            <h2 className="section-title">Retry Strategy</h2>
                            <p className="section-desc">
                                Configure the intensity and timing of recovery attempts. 
                                <br/><br/>
                                <strong style={{ color: THEME_COLOR }}>Tip:</strong> Most successful stores use 3 attempts with 3-day intervals.
                            </p>
                        </div>
                        <div className="settings-card">
                            <div className="card-content">
                                <div className="input-group">
                                    <Select
                                        label="Number of Recovery Attempts"
                                        options={retryAttemptsOptions}
                                        value={retryAttempts}
                                        onChange={handleRetryAttemptsChange}
                                        disabled={!enabled}
                                    />
                                </div>
                                <div className="input-group" style={{ marginTop: '20px' }}>
                                    <Select
                                        label="Interval Between Retries"
                                        options={retryIntervalOptions}
                                        value={retryInterval}
                                        onChange={handleRetryIntervalChange}
                                        disabled={!enabled}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Fallback */}
                    <div className="settings-row">
                        <div className="settings-info">
                            <h2 className="section-title">Fallback Action</h2>
                            <p className="section-desc">
                                Define what should happen automatically if all recovery attempts are exhausted and the payment is still not successful.
                            </p>
                        </div>
                        <div className="settings-card">
                            <div className="card-content">
                                <Select
                                    label="Final Resolution Action"
                                    options={fallbackActionOptions}
                                    value={fallbackAction}
                                    onChange={handleFallbackActionChange}
                                    disabled={!enabled}
                                />
                                <div className="action-hint">
                                    {fallbackAction === 'skip' && "The failed order will be skipped, but the subscription will remain active for the next billing cycle."}
                                    {fallbackAction === 'pause' && "The entire subscription will be placed on hold until the customer updates their payment info."}
                                    {fallbackAction === 'cancel' && "The subscription will be permanently cancelled. Use with caution."}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 4: Notifications */}
                    <div className="settings-row">
                        <div className="settings-info">
                            <h2 className="section-title">Communication</h2>
                            <p className="section-desc">
                                Keep your customers informed. Send automated emails when a payment fails to prompt them to update their billing details.
                            </p>
                        </div>
                        <div className="settings-card">
                            <div className="card-content">
                                <div className="notification-toggle">
                                    <s-checkbox
                                        checked={sendNotifications}
                                        onChange={(e: any) => setSendNotifications(e.target.checked)}
                                        label="Send automated payment failure emails"
                                        disabled={!enabled}
                                    />
                                </div>
                                
                                {sendNotifications && (
                                    <Link to="/app/email-settings" className="email-config-btn">
                                        <div className="btn-inner">
                                            <div className="icon-wrap">
                                                <Icon source={EditIcon} tone="base" />
                                            </div>
                                            <span>Customize Email Template</span>
                                        </div>
                                        <svg width="16" height="16" viewBox="0 0 20 20"><path fill="currentColor" d="M12.72 10l-4.22 4.22a.75.75 0 101.06 1.06l4.75-4.75a.75.75 0 000-1.06l-4.75-4.75a.75.75 0 00-1.06 1.06L12.72 10z"/></svg>
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="footer-area">
                    <p>Feature part of your <strong>Pro Plan</strong> subscription. <Link to="/app/help">Learn more about payment recovery</Link></p>
                </div>
            </div>

            <style>{`
                .recovery-settings-layout {
                    max-width: 1000px;
                    margin: 32px auto 60px;
                    padding: 0 20px;
                }

                .settings-row {
                    display: grid;
                    grid-template-columns: 1fr 1.5fr;
                    gap: 40px;
                    margin-bottom: 40px;
                    align-items: flex-start;
                }

                .settings-info {
                    padding-top: 8px;
                }

                .section-title {
                    font-size: 18px;
                    font-weight: 700;
                    color: #1a1c1d;
                    margin-bottom: 8px;
                }

                .section-desc {
                    font-size: 14px;
                    color: #6d7175;
                    line-height: 1.6;
                }

                .settings-card {
                    background: white;
                    border: 1px solid #e1e3e5;
                    border-radius: 12px;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
                    overflow: hidden;
                }

                .card-content {
                    padding: 24px;
                }

                .toggle-box {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 20px;
                }

                .toggle-text {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }

                .toggle-text strong {
                    font-size: 15px;
                    color: #1a1c1d;
                }

                .toggle-text span {
                    font-size: 13px;
                    color: #6d7175;
                }

                .recovery-logic-container.disabled {
                    opacity: 0.5;
                    pointer-events: none;
                }

                .action-hint {
                    margin-top: 12px;
                    font-size: 13px;
                    color: ${THEME_COLOR};
                    font-style: italic;
                    padding: 10px 14px;
                    background: ${THEME_COLOR}08;
                    border-radius: 6px;
                    border-left: 3px solid ${THEME_COLOR};
                }

                .email-config-btn {
                    margin-top: 20px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 16px;
                    background: #fcfaff;
                    border: 1px solid ${THEME_COLOR}15;
                    border-radius: 10px;
                    text-decoration: none;
                    color: ${THEME_COLOR};
                    font-weight: 600;
                    transition: all 0.2s;
                }

                .email-config-btn:hover {
                    background: ${THEME_COLOR}08;
                    border-color: ${THEME_COLOR}30;
                }

                .btn-inner {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .icon-wrap {
                    width: 32px;
                    height: 32px;
                    background: white;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                }

                .footer-area {
                    text-align: center;
                    padding-top: 40px;
                    border-top: 1px solid #e1e3e5;
                    color: #6d7175;
                    font-size: 14px;
                }

                .footer-area a {
                    color: ${THEME_COLOR};
                    text-decoration: none;
                    font-weight: 600;
                }

                /* Custom Theme Styling */
                .main-save-btn {
                    background: ${THEME_COLOR} !important;
                    border-color: ${THEME_COLOR} !important;
                }

                /* Custom Switch */
                .custom-switch {
                    position: relative;
                    display: inline-block;
                    width: 44px;
                    height: 24px;
                    flex-shrink: 0;
                }

                .custom-switch input { opacity: 0; width: 0; height: 0; }

                .custom-slider {
                    position: absolute;
                    cursor: pointer;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background-color: #cbd5e0;
                    transition: .4s;
                    border-radius: 34px;
                }

                .custom-slider:before {
                    position: absolute;
                    content: "";
                    height: 18px; width: 18px;
                    left: 3px; bottom: 3px;
                    background-color: white;
                    transition: .4s;
                    border-radius: 50%;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
                }

                input:checked + .custom-slider { background-color: ${THEME_COLOR}; }
                input:checked + .custom-slider:before { transform: translateX(20px); }

                @media (max-width: 768px) {
                    .settings-row {
                        grid-template-columns: 1fr;
                        gap: 16px;
                    }
                }
            `}</style>
        </s-page>
    );
}
