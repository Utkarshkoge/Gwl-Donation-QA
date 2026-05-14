import { useState, useCallback } from "react";
import {
    Box,
    Text,
    Badge,
    Icon,
    Divider,
    Select,
    InlineStack,
    BlockStack,
    Card,
} from "@shopify/polaris";
import {
    CheckIcon,
    EditIcon,
    AlertBubbleIcon,
    ClockIcon,
    ChartVerticalIcon,
    CreditCardIcon,
    ArrowRightIcon,
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

    const handleEnabledChange = useCallback((value: boolean) => setEnabled(value), []);
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
        { label: "Skip Failed Order", value: "skip" },
    ];

    const handleSave = () => {
        shopify.toast.show("Settings optimized successfully");
    };

    return (
        <s-page>
            <div className="recovery-container">
                {/* Header Section */}
                <header className="premium-header">
                    <div className="header-content">
                        <BlockStack gap="100">
                            <InlineStack gap="300" align="start" blockAlign="center">
                                <h1 className="main-title">Payment Recovery</h1>
                                <div className="pro-badge-glow">PRO PLAN</div>
                            </InlineStack>
                            <p className="subtitle">Optimize your revenue stream with intelligent retry logic and automated recovery workflows.</p>
                        </BlockStack>
                        <button className="glow-save-button" onClick={handleSave}>
                            Save Changes
                        </button>
                    </div>
                </header>

                <div className="dashboard-grid">
                    {/* Stats Section */}
                    <div className="stats-row">
                        <div className="stat-card">
                            <div className="stat-icon-box purple">
                                <Icon source={ChartVerticalIcon} tone="base" />
                            </div>
                            <div className="stat-info">
                                <span className="stat-label">Recovery Rate</span>
                                <span className="stat-value">24.8%</span>
                                <span className="stat-trend positive">+3.2% vs last month</span>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon-box blue">
                                <Icon source={CreditCardIcon} tone="base" />
                            </div>
                            <div className="stat-info">
                                <span className="stat-label">Revenue Recovered</span>
                                <span className="stat-value">$1,240.00</span>
                                <span className="stat-trend positive">12 transactions saved</span>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon-box orange">
                                <Icon source={ClockIcon} tone="base" />
                            </div>
                            <div className="stat-info">
                                <span className="stat-label">Avg. Recovery Time</span>
                                <span className="stat-value">4.2 Days</span>
                                <span className="stat-trend subdued">Based on 3 retries</span>
                            </div>
                        </div>
                    </div>

                    <div className="main-content-split">
                        {/* Settings Card */}
                        <div className="settings-panel">
                            <div className="panel-header">
                                <div className="panel-title-group">
                                    <h2 className="panel-title">Recovery Strategy</h2>
                                    <p className="panel-desc">Configure how the system handles failed billing attempts.</p>
                                </div>
                                <div className="toggle-wrapper">
                                    <span className="toggle-status">{enabled ? "ACTIVE" : "INACTIVE"}</span>
                                    <label className="switch">
                                        <input 
                                            type="checkbox" 
                                            checked={enabled} 
                                            onChange={(e) => handleEnabledChange(e.target.checked)} 
                                        />
                                        <span className="slider round"></span>
                                    </label>
                                </div>
                            </div>

                            <div className={`settings-form ${enabled ? "" : "disabled"}`}>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label className="custom-label">Smart Recovery Attempts</label>
                                        <Select
                                            label=""
                                            labelHidden
                                            options={retryAttemptsOptions}
                                            value={retryAttempts}
                                            onChange={handleRetryAttemptsChange}
                                        />
                                        <p className="field-hint">Maximum number of times we'll retry a failed charge.</p>
                                    </div>
                                    <div className="form-group">
                                        <label className="custom-label">Retry Interval</label>
                                        <Select
                                            label=""
                                            labelHidden
                                            options={retryIntervalOptions}
                                            value={retryInterval}
                                            onChange={handleRetryIntervalChange}
                                        />
                                        <p className="field-hint">Days to wait between each retry attempt.</p>
                                    </div>
                                </div>

                                <div className="form-group full-width">
                                    <label className="custom-label">Fallback Action</label>
                                    <Select
                                        label=""
                                        labelHidden
                                        options={fallbackActionOptions}
                                        value={fallbackAction}
                                        onChange={handleFallbackActionChange}
                                    />
                                    <p className="field-hint">Action to take if all recovery attempts are exhausted.</p>
                                </div>

                                <Divider />

                                <div className="notification-box">
                                    <div className="notification-content">
                                        <div className="check-label-group">
                                            <input 
                                                type="checkbox" 
                                                id="notif-check" 
                                                checked={sendNotifications}
                                                onChange={handleSendNotificationsChange}
                                            />
                                            <label htmlFor="notif-check">
                                                <strong>Customer Notifications</strong>
                                                <span>Send email alerts when a payment fails.</span>
                                            </label>
                                        </div>
                                    </div>
                                    <Link to="/app/email-settings" className="action-link">
                                        Customize Template <Icon source={ArrowRightIcon} tone="base" />
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* Visual Timeline Section */}
                        <div className="timeline-panel">
                            <h3 className="panel-subtitle">Recovery Workflow Preview</h3>
                            <div className="timeline-visual">
                                {[...Array(Math.min(Number(retryAttempts), 4))].map((_, i) => (
                                    <div key={i} className="timeline-step">
                                        <div className="step-dot"></div>
                                        <div className="step-content">
                                            <span className="step-title">Retry #{i + 1}</span>
                                            <span className="step-desc">Day {i * Number(retryInterval)}</span>
                                        </div>
                                    </div>
                                ))}
                                <div className="timeline-step fallback">
                                    <div className="step-dot red"></div>
                                    <div className="step-content">
                                        <span className="step-title">Fallback</span>
                                        <span className="step-desc">{fallbackAction === 'skip' ? 'Skip Order' : fallbackAction === 'pause' ? 'Pause Sub' : 'Cancel Sub'}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="pro-tip-floating">
                                <Icon source={AlertBubbleIcon} tone="info" />
                                <p><strong>Optimal Setup:</strong> 3 attempts every 3 days yields the highest recovery rate.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <footer className="footer-support">
                    <p>Need help optimizing your recovery strategy? <Link to="/app/help">Contact our experts</Link></p>
                </footer>
            </div>

            <style>{`
                .recovery-container {
                    padding: 24px;
                    max-width: 1200px;
                    margin: 0 auto;
                    font-family: 'Inter', -apple-system, sans-serif;
                }

                .premium-header {
                    margin-bottom: 32px;
                    padding: 32px;
                    background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%);
                    border-radius: 20px;
                    color: white;
                    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
                }

                .header-content {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .main-title {
                    font-size: 32px;
                    font-weight: 800;
                    letter-spacing: -0.025em;
                    margin: 0;
                }

                .subtitle {
                    font-size: 16px;
                    color: #c7d2fe;
                    max-width: 600px;
                }

                .pro-badge-glow {
                    background: linear-gradient(to right, #f59e0b, #fbbf24);
                    color: #78350f;
                    padding: 4px 12px;
                    border-radius: 9999px;
                    font-size: 12px;
                    font-weight: 700;
                    box-shadow: 0 0 15px rgba(245, 158, 11, 0.4);
                }

                .glow-save-button {
                    background: #6366f1;
                    color: white;
                    border: none;
                    padding: 12px 28px;
                    border-radius: 12px;
                    font-weight: 600;
                    font-size: 15px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    box-shadow: 0 4px 14px 0 rgba(99, 102, 241, 0.39);
                }

                .glow-save-button:hover {
                    background: #4f46e5;
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(99, 102, 241, 0.45);
                }

                .dashboard-grid {
                    display: flex;
                    flex-direction: column;
                    gap: 24px;
                }

                .stats-row {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 20px;
                }

                .stat-card {
                    background: white;
                    padding: 24px;
                    border-radius: 16px;
                    display: flex;
                    gap: 16px;
                    border: 1px solid #e2e8f0;
                    transition: transform 0.2s ease;
                }

                .stat-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 12px 20px -10px rgba(0, 0, 0, 0.1);
                }

                .stat-icon-box {
                    width: 48px;
                    height: 48px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .stat-icon-box.purple { background: #f5f3ff; color: #7c3aed; }
                .stat-icon-box.blue { background: #eff6ff; color: #2563eb; }
                .stat-icon-box.orange { background: #fff7ed; color: #ea580c; }

                .stat-label { font-size: 14px; color: #64748b; font-weight: 500; display: block; }
                .stat-value { font-size: 24px; font-weight: 700; color: #1e293b; display: block; margin: 4px 0; }
                .stat-trend { font-size: 12px; font-weight: 600; }
                .stat-trend.positive { color: #10b981; }
                .stat-trend.subdued { color: #94a3b8; }

                .main-content-split {
                    display: grid;
                    grid-template-columns: 1.5fr 1fr;
                    gap: 24px;
                }

                .settings-panel {
                    background: white;
                    border-radius: 20px;
                    border: 1px solid #e2e8f0;
                    padding: 32px;
                }

                .panel-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 32px;
                }

                .panel-title { font-size: 20px; font-weight: 700; color: #1e293b; margin: 0; }
                .panel-desc { font-size: 14px; color: #64748b; margin-top: 4px; }

                .toggle-wrapper { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; }
                .toggle-status { font-size: 10px; font-weight: 800; letter-spacing: 0.05em; color: #64748b; }

                .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }
                .form-group { display: flex; flex-direction: column; gap: 8px; }
                .form-group.full-width { grid-column: span 2; margin-bottom: 24px; }

                .custom-label { font-size: 14px; font-weight: 600; color: #334155; }
                .field-hint { font-size: 12px; color: #94a3b8; }

                .notification-box {
                    margin-top: 24px;
                    padding: 20px;
                    background: #f8fafc;
                    border-radius: 12px;
                    border: 1px solid #e2e8f0;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .check-label-group { display: flex; gap: 12px; align-items: flex-start; }
                .check-label-group input { width: 18px; height: 18px; margin-top: 2px; accent-color: #6366f1; }
                .check-label-group label { display: flex; flex-direction: column; gap: 2px; cursor: pointer; }
                .check-label-group strong { font-size: 14px; color: #1e293b; }
                .check-label-group span { font-size: 13px; color: #64748b; }

                .action-link {
                    font-size: 14px;
                    font-weight: 600;
                    color: #6366f1;
                    text-decoration: none;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }

                .timeline-panel {
                    background: #f1f5f9;
                    border-radius: 20px;
                    padding: 32px;
                    display: flex;
                    flex-direction: column;
                }

                .panel-subtitle { font-size: 16px; font-weight: 700; color: #1e293b; margin-bottom: 24px; }

                .timeline-visual {
                    display: flex;
                    flex-direction: column;
                    gap: 0;
                    padding-left: 20px;
                }

                .timeline-step {
                    display: flex;
                    gap: 20px;
                    position: relative;
                    padding-bottom: 30px;
                }

                .timeline-step::before {
                    content: '';
                    position: absolute;
                    left: 5px;
                    top: 10px;
                    bottom: 0;
                    width: 2px;
                    background: #cbd5e1;
                }

                .timeline-step:last-child::before { display: none; }

                .step-dot {
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                    background: #6366f1;
                    position: relative;
                    z-index: 2;
                    margin-top: 6px;
                }

                .step-dot.red { background: #ef4444; }

                .step-content { display: flex; flex-direction: column; gap: 2px; }
                .step-title { font-size: 14px; font-weight: 700; color: #1e293b; }
                .step-desc { font-size: 12px; color: #64748b; }

                .pro-tip-floating {
                    margin-top: auto;
                    background: white;
                    padding: 16px;
                    border-radius: 12px;
                    display: flex;
                    gap: 12px;
                    align-items: center;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                }

                .pro-tip-floating p { font-size: 13px; color: #334155; margin: 0; }

                .footer-support {
                    text-align: center;
                    margin-top: 48px;
                    color: #94a3b8;
                    font-size: 14px;
                }

                .footer-support a { color: #6366f1; font-weight: 600; text-decoration: none; }

                /* Switch toggle styles */
                .switch { position: relative; display: inline-block; width: 44px; height: 24px; }
                .switch input { opacity: 0; width: 0; height: 0; }
                .slider {
                    position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0;
                    background-color: #cbd5e1; transition: .4s; border-radius: 34px;
                }
                .slider:before {
                    position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px;
                    background-color: white; transition: .4s; border-radius: 50%;
                }
                input:checked + .slider { background-color: #6366f1; }
                input:checked + .slider:before { transform: translateX(20px); }

                .settings-form.disabled { opacity: 0.6; pointer-events: none; }

                @media (max-width: 900px) {
                    .main-content-split { grid-template-columns: 1fr; }
                    .premium-header { padding: 24px; }
                    .main-title { font-size: 24px; }
                }
            `}</style>
        </s-page>
    );
}
