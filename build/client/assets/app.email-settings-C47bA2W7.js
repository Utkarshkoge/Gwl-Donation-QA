import{w as R,u as w,d as O,r as c,e as A}from"./chunk-UVKPFVEO-CEw7IaX3.js";import{j as e}from"./jsx-runtime-lA1hjGOj.js";import{c as u}from"./features-BmBjzq3F.js";import{R as D}from"./RichTextEditor-euPN7XAi.js";import{u as P}from"./useAppBridge-Bj34gXAL.js";const p={pauseSubject:"Subscription Paused",pauseBody:`<h2 style="color:#92400e;">Subscription Paused</h2>

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

<p>Thank you for your continued support ❤️</p>`,reminderSubject:"Upcoming Donation Reminder: {{amount}}",reminderBody:`<h2 style="color:#6c4a79;">Donation Reminder ❤️</h2>
<p>Hello <strong>{{first_name}}</strong>,</p>
<p>This is a friendly reminder that your next donation of <strong>{{currency}}{{amount}}</strong> for <strong>{{donation_name}}</strong> is scheduled for {{nextBillingDate}}.</p>
<hr />
<p><strong>Frequency:</strong> {{frequency}}</p>
<p><strong>Amount:</strong> {{currency}}{{amount}}</p>
<hr />
<p>Thank you for your continued support! You can manage your subscription at any time using the link below.</p>`,notifyMerchantOnSubscriptionChange:!1},L=R(function(){const{settings:s,plan:l}=w(),i=O(),m=P(),[n,j]=c.useState({contactEmail:s.contactEmail,ccEmail:s.ccEmail||"",logoUrl:s.logoUrl||"",receiptSubject:s.receiptSubject,receiptBody:s.receiptBody,refundSubject:s.refundSubject,refundBody:s.refundBody,cancelSubject:s.cancelSubject,cancelBody:s.cancelBody,pauseSubject:s.pauseSubject||p.pauseSubject,pauseBody:s.pauseBody||p.pauseBody,resumeSubject:s.resumeSubject||p.resumeSubject,resumeBody:s.resumeBody||p.resumeBody,reminderSubject:s.reminderSubject||p.reminderSubject,reminderBody:s.reminderBody||p.reminderBody,notifyMerchantOnSubscriptionChange:s.notifyMerchantOnSubscriptionChange??p.notifyMerchantOnSubscriptionChange}),[S,v]=c.useState(()=>({...n})),b=i.state==="submitting"&&i.formMethod==="POST",x=c.useRef(null);c.useEffect(()=>{var t;i.state==="idle"&&((t=i.data)==null?void 0:t.status)==="success"?(i.data.status+new Date().getTime(),x.current!=="handled"&&(x.current="handled",m.toast.show("Email settings saved successfully"),v({...n}))):i.state==="submitting"&&(x.current="submitting")},[i.state,i.data,m,n]);const f=Object.keys(n).some(t=>n[t]!==S[t]),[g,y]=c.useState({}),E=()=>{const t={},o=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;return n.contactEmail?o.test(n.contactEmail)||(t.contactEmail="Invalid email format"):t.contactEmail="Contact email is required",n.ccEmail&&!o.test(n.ccEmail)&&(t.ccEmail="Invalid CC email format"),y(t),Object.keys(t).length===0},d=c.useCallback((t,o)=>{j(a=>({...a,[t]:o})),g[t]&&y(a=>{const h={...a};return delete h[t],h})},[g]),B=c.useCallback(()=>{if(!E()){m.toast.show("Please fix the errors before saving",{isError:!0});return}const t=new FormData;Object.entries(n).forEach(([o,a])=>{t.append(o,a)}),i.submit(t,{method:"POST"})},[n,i,m]),C=Object.keys(g).length>0,[r,k]=c.useState("receipt");return e.jsxs("s-page",{heading:"Email Configuration Settings",children:[e.jsx("s-button",{slot:"primary-action",variant:"primary",onClick:B,disabled:b||!f||C,...b?{loading:!0}:{},children:b?"Saving...":f?"Save":"No Changes"}),e.jsxs("div",{style:{display:"flex",gap:"24px",marginTop:"16px"},children:[e.jsx("div",{style:{flex:"0 0 250px"},children:e.jsx("s-text",{color:"subdued",children:"Configure the email settings for the donation section. Ensure all fields are filled out correctly for proper functioning."})}),e.jsx("div",{style:{flex:1},children:e.jsx("s-box",{padding:"large-200",borderWidth:"base",borderRadius:"large-100",background:"subdued",children:e.jsxs("s-stack",{direction:"block",gap:"large-200",children:[e.jsxs("s-box",{children:[e.jsxs("div",{style:{marginBottom:"16px"},children:[e.jsx("s-text-field",{label:"Your Contact Email",value:n.contactEmail,error:g.contactEmail,onChange:t=>d("contactEmail",t.target.value)}),e.jsx("div",{style:{marginTop:"4px"},children:e.jsx("s-text",{color:"subdued",children:"Customers who reply to the email will reach you at this address."})})]}),e.jsxs("div",{style:{marginBottom:"16px"},children:[e.jsxs("s-stack",{direction:"inline",align:"center",gap:"medium-100",children:[e.jsx("s-switch",{checked:n.notifyMerchantOnSubscriptionChange,onChange:t=>d("notifyMerchantOnSubscriptionChange",t.target.checked)}),e.jsx("s-text",{children:"Receive subscription status change notifications"})]}),e.jsx("div",{style:{marginTop:"4px"},children:e.jsx("s-text",{color:"subdued",children:"Receive an email notification whenever a customer pauses, resumes, or cancels their subscription."})})]}),e.jsx("div",{style:{marginBottom:"16px"},children:e.jsx("s-text-field",{label:"Additional/CC Email ID (Optional)",value:n.ccEmail,error:g.ccEmail,onChange:t=>d("ccEmail",t.target.value)})}),e.jsxs("div",{style:{marginBottom:"16px"},children:[e.jsx("div",{style:{marginBottom:"8px"},children:e.jsx("strong",{children:"Email Logo (Optional)"})}),e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"12px"},children:[e.jsx("s-button",{onClick:()=>{var t;return(t=document.getElementById("logo-upload"))==null?void 0:t.click()},children:"Upload Logo"}),e.jsx("input",{id:"logo-upload",type:"file",accept:"image/*",style:{display:"none"},onChange:t=>{var a;const o=(a=t.target.files)==null?void 0:a[0];if(o){if(o.size>1024*1024){m.toast.show("File too large. Please use an image under 1MB.");return}const h=new FileReader;h.onload=T=>{d("logoUrl",T.target.result)},h.readAsDataURL(o)}}}),n.logoUrl&&e.jsx("s-button",{variant:"tertiary",tone:"critical",onClick:()=>d("logoUrl",""),children:"Remove"})]}),n.logoUrl&&e.jsx("div",{style:{marginTop:"12px",padding:"12px",background:"#fff",borderRadius:"4px",border:"1px solid #eee",display:"inline-block"},children:e.jsx("img",{src:n.logoUrl,alt:"Logo Preview",style:{maxHeight:"60px",display:"block"}})})]})]}),e.jsxs("s-box",{children:[e.jsx("div",{className:"polaris-tabs",children:e.jsx("div",{className:"polaris-tabs-list",role:"tablist",children:[{id:"receipt",label:"Receipt Template"},{id:"refund",label:"Refund Template"},{id:"cancel",label:"Cancellation Template"},{id:"reminder",label:"Reminder Template"}].map(t=>e.jsx("button",{role:"tab","aria-selected":r===t.id,className:`polaris-tab ${r===t.id?"active":""}`,onClick:()=>k(t.id),children:t.label},t.id))})}),e.jsx("s-stack",{direction:"block",gap:"base",children:r==="refund"&&!u(l,"canSendRefundEmail")||r==="cancel"&&!u(l,"canSendCancelEmail")||r==="reminder"&&!u(l,"canSendReminders")?e.jsx("s-box",{padding:"large-200",background:"subdued",borderRadius:"base",borderWidth:"base",children:e.jsx("s-stack",{direction:"block",gap:"base",children:e.jsxs("div",{style:{textAlign:"center",width:"100%"},children:[e.jsx("s-text",{type:"strong",children:"Plan Upgrade Required"}),e.jsx("s-box",{"padding-block-start":"base",children:e.jsxs("s-text",{color:"subdued",children:["The ",r," email feature is available on the",e.jsxs("strong",{children:[" ",r==="refund"||r==="reminder"?"Advanced":"Pro"]})," plan and above."]})}),e.jsx("s-box",{"padding-block-start":"base",children:e.jsx(A,{to:"/app/pricing",style:{textDecoration:"none"},children:e.jsx("s-button",{variant:"primary",children:"View Pricing Plans"})})})]})})}):e.jsxs(e.Fragment,{children:[e.jsx("s-text-field",{label:"Email Subject Line",disabled:!u(l,"canEditTemplates"),value:r==="receipt"?n.receiptSubject:r==="refund"?n.refundSubject:r==="cancel"?n.cancelSubject:n.reminderSubject,onInput:t=>d(r==="receipt"?"receiptSubject":r==="refund"?"refundSubject":r==="cancel"?"cancelSubject":"reminderSubject",t.target.value)}),e.jsxs("div",{children:[e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",marginBottom:"8px"},children:[e.jsx("span",{style:{fontWeight:500},children:"Email Template"}),!u(l,"canEditTemplates")&&e.jsx("s-badge",{tone:"caution",children:"View Only"})]}),e.jsxs("div",{style:{padding:"12px",background:"#f4f6f8",borderRadius:"4px",fontSize:"13px",marginBottom:"12px",color:"#5c5f62"},children:[e.jsx("strong",{children:"Available Variables:"})," ",e.jsx("code",{children:"{{first_name}}"}),", ",e.jsx("code",{children:"{{last_name}}"}),", ",e.jsx("code",{children:"{{email}}"}),", ",e.jsx("code",{children:"{{currency}}"}),", ",e.jsx("code",{children:"{{amount}}"}),", ",e.jsx("code",{children:"{{orderNumber}}"}),", ",e.jsx("code",{children:"{{date}}"}),", ",e.jsx("code",{children:"{{donation_name}}"}),", ",e.jsx("code",{children:"{{frequency}}"}),", ",e.jsx("code",{children:"{{nextBillingDate}}"})]}),!u(l,"canEditTemplates")&&e.jsx("div",{style:{marginBottom:"12px"},children:e.jsxs("s-banner",{tone:"info",children:[e.jsx("div",{slot:"title",children:"Custom Templates Locked"}),e.jsxs("p",{children:["Upgrade to the ",e.jsx("strong",{children:"Pro"})," plan to customize your email templates with dynamic variables."]})]})}),e.jsx(D,{disabled:!u(l,"canEditTemplates"),value:r==="receipt"?n.receiptBody:r==="refund"?n.refundBody:n.cancelBody,onChange:t=>d(r==="receipt"?"receiptBody":r==="refund"?"refundBody":r==="cancel"?"cancelBody":"reminderBody",t)})]})]})})]})]})})})]}),e.jsx("style",{children:`
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
            `})]})});export{L as default};
