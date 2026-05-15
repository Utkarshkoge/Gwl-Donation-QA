import { useState, useCallback, useEffect, useRef } from "react";
import {
    Icon,
    Select,
} from "@shopify/polaris";
import {
    EditIcon,
} from "@shopify/polaris-icons";
import { useAppBridge } from "@shopify/app-bridge-react";
import { Link, useLoaderData, useFetcher } from "react-router";
import type { LoaderFunctionArgs, ActionFunctionArgs, HeadersFunction } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import prisma from "../db.server";

// ─── Defaults ───────────────────────────────────────────────
const DEFAULT_SETTINGS = {
    enabled: true,
    retryAttempts: 3,
    retryInterval: 3,
    fallbackAction: "skip",
    sendNotifications: true,
};

const VALID_FALLBACK_ACTIONS = ["pause", "cancel", "skip"];

// ─── Loader ─────────────────────────────────────────────────
export const loader = async ({ request }: LoaderFunctionArgs) => {
    const { session } = await authenticate.admin(request);
    const shop = session.shop;

    try {
        const settings = await prisma.paymentRecoverySettings.findUnique({
            where: { shop },
        });

        return {
            settings: settings ?? { ...DEFAULT_SETTINGS },
        };
    } catch (error) {
        console.error("[PaymentRecovery] Loader error:", error);
        return {
            settings: { ...DEFAULT_SETTINGS },
        };
    }
};

// ─── Action ─────────────────────────────────────────────────
export const action = async ({ request }: ActionFunctionArgs) => {
    const { session } = await authenticate.admin(request);
    const shop = session.shop;
    const formData = await request.formData();

    // Parse and validate
    const retryAttempts = parseInt(formData.get("retryAttempts") as string);
    const retryInterval = parseInt(formData.get("retryInterval") as string);
    const fallbackAction = (formData.get("fallbackAction") as string) || "skip";

    // Server-side validation
    if (isNaN(retryAttempts) || retryAttempts < 1 || retryAttempts > 10) {
        return { status: "error", message: "Retry attempts must be between 1 and 10" };
    }
    if (isNaN(retryInterval) || retryInterval < 1 || retryInterval > 10) {
        return { status: "error", message: "Retry interval must be between 1 and 10 days" };
    }
    if (!VALID_FALLBACK_ACTIONS.includes(fallbackAction)) {
        return { status: "error", message: "Invalid fallback action selected" };
    }

    const data = {
        enabled: formData.get("enabled") === "true",
        retryAttempts,
        retryInterval,
        fallbackAction,
        sendNotifications: formData.get("sendNotifications") === "true",
    };

    try {
        await prisma.paymentRecoverySettings.upsert({
            where: { shop },
            update: data,
            create: { shop, ...data },
        });

        return { status: "success", message: "Recovery settings saved successfully" };
    } catch (error) {
        console.error("[PaymentRecovery] Action error:", error);
        return { status: "error", message: "Failed to save settings. Please try again." };
    }
};

// ─── Component ──────────────────────────────────────────────
export default function PaymentRecoveryPage() {
    const { settings: savedSettings } = useLoaderData<typeof loader>();
    const fetcher = useFetcher<typeof action>();
    const shopify = useAppBridge();

    const [enabled, setEnabled] = useState(savedSettings.enabled);
    const [retryAttempts, setRetryAttempts] = useState(savedSettings.retryAttempts.toString());
    const [retryInterval, setRetryInterval] = useState(savedSettings.retryInterval.toString());
    const [fallbackAction, setFallbackAction] = useState(savedSettings.fallbackAction);
    const [sendNotifications, setSendNotifications] = useState(savedSettings.sendNotifications);

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

    const isSaving = fetcher.state === "submitting";

    // Toast handling for success and error states
    const lastHandledRef = useRef<string | null>(null);
    useEffect(() => {
        if (fetcher.state === "idle" && fetcher.data) {
            if (lastHandledRef.current !== "handled") {
                lastHandledRef.current = "handled";
                if (fetcher.data.status === "success") {
                    shopify.toast.show(fetcher.data.message || "Recovery settings saved successfully");
                } else if (fetcher.data.status === "error") {
                    shopify.toast.show(fetcher.data.message || "Failed to save settings", { isError: true } as any);
                }
            }
        } else if (fetcher.state === "submitting") {
            lastHandledRef.current = "submitting";
        }
    }, [fetcher.state, fetcher.data, shopify]);

    const handleSave = () => {
        const formData = new FormData();
        formData.append("enabled", enabled.toString());
        formData.append("retryAttempts", retryAttempts);
        formData.append("retryInterval", retryInterval);
        formData.append("fallbackAction", fallbackAction);
        formData.append("sendNotifications", sendNotifications.toString());
        fetcher.submit(formData, { method: "POST" });
    };

    const THEME_COLOR = "#51395c";

    return (
        <s-page heading="Failed Payment Recovery Settings">
            <s-button
                slot="primary-action"
                variant="primary"
                onClick={handleSave}
                className="main-save-btn"
                {...(isSaving ? { loading: true } : {})}
                disabled={isSaving}
            >
                {isSaving ? "Saving..." : "Save Settings"}
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

export const headers: HeadersFunction = (headersArgs) => {
    return boundary.headers(headersArgs);
};
