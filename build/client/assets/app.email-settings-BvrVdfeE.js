import{H as T,y as R,w as A,s as c,L as O}from"./chunk-4N6VE7H7-BqC2kd6o.js";import{j as e}from"./jsx-runtime-B5AtTLU8.js";import{c as p}from"./features-CUSwT18e.js";import{R as P}from"./RichTextEditor-CIgsf6hK.js";import{u as D}from"./useAppBridge-Bj34gXAL.js";const l={pauseSubject:"Subscription Paused",pauseBody:`<h2 style="color:#92400e;">Subscription Paused</h2>

<p>Hello <strong>{{first_name}}</strong>,</p>

<p>Your subscription for <strong>{{donation_name}}</strong> has been paused.</p>

<hr />

<p><strong>Order Number:</strong> {{orderNumber}}</p>
<p><strong>Amount:</strong> {{currency}}{{amount}}</p>
<p><strong>Frequency:</strong> {{frequency}}</p>

<hr />

<p>You can resume your subscription at any time from your account management page.</p>

<p>Thank you for your support ❤️</p>`,resumeSubject:"Subscription Resumed",resumeBody:`<h2 style="color:#008060;">Subscription Resumed</h2>

<p>Hello <strong>{{first_name}}</strong>,</p>

<p>Your subscription for <strong>{{donation_name}}</strong> has been successfully resumed.</p>

<hr />

<p><strong>Order Number:</strong> {{orderNumber}}</p>
<p><strong>Amount:</strong> {{currency}}{{amount}}</p>
<p><strong>Frequency:</strong> {{frequency}}</p>
<p><strong>Next Billing Date:</strong> {{nextBillingDate}}</p>

<hr />

<p>We are glad to have you back!</p>

<p>Thank you for your continued support ❤️</p>`,reminderBody:`<h2 style="color:#6c4a79;">Donation Reminder ❤️</h2>
<p>Hello <strong>{{first_name}}</strong>,</p>
<p>This is a friendly reminder that your next donation of <strong>{{currency}}{{amount}}</strong> for <strong>{{donation_name}}</strong> is scheduled for {{nextBillingDate}}.</p>
<hr />
<p><strong>Frequency:</strong> {{frequency}}</p>
<p><strong>Amount:</strong> {{currency}}{{amount}}</p>
<hr />
<p>Thank you for your continued support! You can manage your subscription at any time using the link below.</p>`,recoverySubject:"Action Required: Your donation payment failed",recoveryBody:`<h2 style="color:#d82c0d;">Payment Failed ⚠️</h2>

<p>Hello <strong>{{first_name}}</strong>,</p>

<p>We're writing to let you know that we were unable to process your recurring donation of <strong>{{currency}}{{amount}}</strong> for <strong>{{donation_name}}</strong>.</p>

<p>Don't worry! We will automatically retry the payment in a few days. However, to ensure your donation continues without interruption, please verify your payment details in your account.</p>

<hr />

<p><strong>Reason:</strong> Payment method declined</p>
<p><strong>Amount:</strong> {{currency}}{{amount}}</p>
<p><strong>Next Retry:</strong> {{nextBillingDate}}</p>

<hr />

<p>You can update your payment information by clicking the button below:</p>

<p><a href="{{account_url}}" style="display:inline-block;padding:12px 24px;background:#51395c;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;">Update Payment Info</a></p>

<p>Thank you for your ongoing support!</p>`},q=T(function(){const{settings:o,plan:d}=R(),s=A(),m=D(),[r,j]=c.useState({contactEmail:o.contactEmail,ccEmail:o.ccEmail||"",logoUrl:o.logoUrl||"",receiptSubject:o.receiptSubject,receiptBody:o.receiptBody,refundSubject:o.refundSubject,refundBody:o.refundBody,cancelSubject:o.cancelSubject,cancelBody:o.cancelBody,pauseSubject:o.pauseSubject||l.pauseSubject,pauseBody:o.pauseBody||l.pauseBody,resumeSubject:o.resumeSubject||l.resumeSubject,resumeBody:o.resumeBody||l.resumeBody,reminderSubject:o.reminderSubject||l.reminderSubject,reminderBody:o.reminderBody||l.reminderBody,recoverySubject:o.recoverySubject||l.recoverySubject,recoveryBody:o.recoveryBody||l.recoveryBody,notifyMerchantOnSubscriptionChange:o.notifyMerchantOnSubscriptionChange??!1}),[v,S]=c.useState(()=>({...r})),y=s.state==="submitting"&&s.formMethod==="POST",b=c.useRef(null);c.useEffect(()=>{var t;s.state==="idle"&&((t=s.data)==null?void 0:t.status)==="success"?(s.data.status+new Date().getTime(),b.current!=="handled"&&(b.current="handled",m.toast.show("Email settings saved successfully"),S({...r}))):s.state==="submitting"&&(b.current="submitting")},[s.state,s.data,m,r]);const x=Object.keys(r).some(t=>r[t]!==v[t]),[g,f]=c.useState({}),B=()=>{const t={},i=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;return r.contactEmail?i.test(r.contactEmail)||(t.contactEmail="Invalid email format"):t.contactEmail="Contact email is required",r.ccEmail&&!i.test(r.ccEmail)&&(t.ccEmail="Invalid CC email format"),f(t),Object.keys(t).length===0},u=c.useCallback((t,i)=>{j(a=>({...a,[t]:i})),g[t]&&f(a=>{const h={...a};return delete h[t],h})},[g]),E=c.useCallback(()=>{if(!B()){m.toast.show("Please fix the errors before saving",{isError:!0});return}const t=new FormData;Object.entries(r).forEach(([i,a])=>{t.append(i,a)}),s.submit(t,{method:"POST"})},[r,s,m]),k=Object.keys(g).length>0,[n,C]=c.useState("receipt");return e.jsxs("s-page",{heading:"Email Configuration Settings",children:[e.jsx("s-button",{slot:"primary-action",variant:"primary",onClick:E,disabled:y||!x||k,...y?{loading:!0}:{},children:y?"Saving...":x?"Save":"No Changes"}),e.jsxs("div",{style:{display:"flex",gap:"24px",marginTop:"16px"},children:[e.jsx("div",{style:{flex:"0 0 250px"},children:e.jsx("s-text",{color:"subdued",children:"Configure the email settings for the donation section. Ensure all fields are filled out correctly for proper functioning."})}),e.jsx("div",{style:{flex:1},children:e.jsx("s-box",{padding:"large-200",borderWidth:"base",borderRadius:"large-100",background:"subdued",children:e.jsxs("s-stack",{direction:"block",gap:"large-200",children:[e.jsxs("s-box",{children:[e.jsxs("div",{style:{marginBottom:"16px"},children:[e.jsx("s-text-field",{label:"Your Contact Email",value:r.contactEmail,error:g.contactEmail,onChange:t=>u("contactEmail",t.target.value)}),e.jsx("div",{style:{marginTop:"4px"},children:e.jsx("s-text",{color:"subdued",children:"Customers who reply to the email will reach you at this address."})})]}),e.jsx("div",{style:{marginBottom:"16px"},children:e.jsx("s-text-field",{label:"Additional/CC Email ID (Optional)",value:r.ccEmail,error:g.ccEmail,onChange:t=>u("ccEmail",t.target.value)})}),e.jsxs("div",{style:{marginBottom:"16px",padding:"12px",background:"#f8f9fa",borderRadius:"8px",border:"1px solid #e1e3e5"},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"10px"},children:[e.jsx("input",{type:"checkbox",id:"notifyMerchantOnSubscriptionChange",checked:r.notifyMerchantOnSubscriptionChange,onChange:t=>u("notifyMerchantOnSubscriptionChange",t.target.checked),style:{width:"18px",height:"18px",cursor:"pointer"}}),e.jsx("label",{htmlFor:"notifyMerchantOnSubscriptionChange",style:{fontSize:"14px",fontWeight:"600",cursor:"pointer"},children:"Receive subscription status change notifications"})]}),e.jsx("div",{style:{marginTop:"4px",marginLeft:"28px"},children:e.jsx("s-text",{color:"subdued",size:"small",children:"Get an email whenever a customer pauses, resumes, or cancels their recurring donation."})})]}),e.jsxs("div",{style:{marginBottom:"16px"},children:[e.jsx("div",{style:{marginBottom:"8px"},children:e.jsx("strong",{children:"Email Logo (Optional)"})}),e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"12px"},children:[e.jsx("s-button",{onClick:()=>{var t;return(t=document.getElementById("logo-upload"))==null?void 0:t.click()},children:"Upload Logo"}),e.jsx("input",{id:"logo-upload",type:"file",accept:"image/*",style:{display:"none"},onChange:t=>{var a;const i=(a=t.target.files)==null?void 0:a[0];if(i){if(i.size>1024*1024){m.toast.show("File too large. Please use an image under 1MB.");return}const h=new FileReader;h.onload=w=>{u("logoUrl",w.target.result)},h.readAsDataURL(i)}}}),r.logoUrl&&e.jsx("s-button",{variant:"tertiary",tone:"critical",onClick:()=>u("logoUrl",""),children:"Remove"})]}),r.logoUrl&&e.jsx("div",{style:{marginTop:"12px",padding:"12px",background:"#fff",borderRadius:"4px",border:"1px solid #eee",display:"inline-block"},children:e.jsx("img",{src:r.logoUrl,alt:"Logo Preview",style:{maxHeight:"60px",display:"block"}})})]})]}),e.jsxs("s-box",{children:[e.jsx("div",{className:"polaris-tabs",children:e.jsx("div",{className:"polaris-tabs-list",role:"tablist",children:[{id:"receipt",label:"Receipt Template"},{id:"refund",label:"Refund Template"},{id:"cancel",label:"Cancellation Template"},{id:"reminder",label:"Reminder Template"},{id:"recovery",label:"Recovery Template"}].map(t=>e.jsx("button",{role:"tab","aria-selected":n===t.id,className:`polaris-tab ${n===t.id?"active":""}`,onClick:()=>C(t.id),children:t.label},t.id))})}),e.jsx("s-stack",{direction:"block",gap:"base",children:n==="refund"&&!p(d,"canSendRefundEmail")||n==="cancel"&&!p(d,"canSendCancelEmail")||n==="reminder"&&!p(d,"canSendReminders")?e.jsx("s-box",{padding:"large-200",background:"subdued",borderRadius:"base",borderWidth:"base",children:e.jsx("s-stack",{direction:"block",gap:"base",children:e.jsxs("div",{style:{textAlign:"center",width:"100%"},children:[e.jsx("s-text",{type:"strong",children:"Plan Upgrade Required"}),e.jsx("s-box",{"padding-block-start":"base",children:e.jsxs("s-text",{color:"subdued",children:["The ",n," email feature is available on the",e.jsxs("strong",{children:[" ",n==="refund"||n==="reminder"?"Advanced":"Pro"]})," plan and above."]})}),e.jsx("s-box",{"padding-block-start":"base",children:e.jsx(O,{to:"/app/pricing",style:{textDecoration:"none"},children:e.jsx("s-button",{variant:"primary",children:"View Pricing Plans"})})})]})})}):e.jsxs(e.Fragment,{children:[e.jsx("s-text-field",{label:"Email Subject Line",disabled:!p(d,"canEditTemplates"),value:n==="receipt"?r.receiptSubject:n==="refund"?r.refundSubject:n==="cancel"?r.cancelSubject:n==="reminder"?r.reminderSubject:r.recoverySubject,onInput:t=>u(n==="receipt"?"receiptSubject":n==="refund"?"refundSubject":n==="cancel"?"cancelSubject":n==="reminder"?"reminderSubject":"recoverySubject",t.target.value)}),e.jsxs("div",{children:[e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",marginBottom:"8px"},children:[e.jsx("span",{style:{fontWeight:500},children:"Email Template"}),!p(d,"canEditTemplates")&&e.jsx("s-badge",{tone:"caution",children:"View Only"})]}),e.jsxs("div",{style:{padding:"12px",background:"#f4f6f8",borderRadius:"4px",fontSize:"13px",marginBottom:"12px",color:"#5c5f62"},children:[e.jsx("strong",{children:"Available Variables:"})," ",e.jsx("code",{children:"{{first_name}}"}),", ",e.jsx("code",{children:"{{last_name}}"}),", ",e.jsx("code",{children:"{{email}}"}),", ",e.jsx("code",{children:"{{currency}}"}),", ",e.jsx("code",{children:"{{amount}}"}),", ",e.jsx("code",{children:"{{orderNumber}}"}),", ",e.jsx("code",{children:"{{date}}"}),", ",e.jsx("code",{children:"{{donation_name}}"}),", ",e.jsx("code",{children:"{{frequency}}"}),", ",e.jsx("code",{children:"{{nextBillingDate}}"})]}),!p(d,"canEditTemplates")&&e.jsx("div",{style:{marginBottom:"12px"},children:e.jsxs("s-banner",{tone:"info",children:[e.jsx("div",{slot:"title",children:"Custom Templates Locked"}),e.jsxs("p",{children:["Upgrade to the ",e.jsx("strong",{children:"Pro"})," plan to customize your email templates with dynamic variables."]})]})}),e.jsx(P,{disabled:!p(d,"canEditTemplates"),value:n==="receipt"?r.receiptBody:n==="refund"?r.refundBody:n==="cancel"?r.cancelBody:n==="reminder"?r.reminderBody:r.recoveryBody,onChange:t=>u(n==="receipt"?"receiptBody":n==="refund"?"refundBody":n==="cancel"?"cancelBody":n==="reminder"?"reminderBody":"recoveryBody",t)})]})]})})]})]})})})]}),e.jsx("style",{children:`
                .polaris-tabs {
                  border-bottom: 1px solid #dfe3e8;
                  margin-bottom: 20px;
                }
                .polaris-tabs-list {
                  display: flex;
                  gap: 0;
                  overflow-x: auto;
                }
                .polaris-tab {
                  padding: 12px 16px;
                  background: none;
                  border: none;
                  border-bottom: 3px solid transparent;
                  color: #000000;
                  font-size: 14px;
                  font-weight: 500;
                  cursor: pointer;
                  transition: all 0.2s ease;
                  white-space: nowrap;
                }
                .polaris-tab:hover {
                  color: #6C4A79;
                }
                .polaris-tab.active {
                  color: #6C4A79;
                  border-bottom-color: #6C4A79;
                }
            `})]})});export{q as default};
