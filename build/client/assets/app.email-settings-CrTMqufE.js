import{w as T,u as w,d as R,r as i,e as P}from"./chunk-UVKPFVEO-CEw7IaX3.js";import{j as e}from"./jsx-runtime-lA1hjGOj.js";import{c as u}from"./features-D7zFNnvn.js";import{R as A}from"./RichTextEditor-euPN7XAi.js";import{u as U}from"./useAppBridge-Bj34gXAL.js";const b={pauseSubject:"Subscription Paused",pauseBody:`<h2 style="color:#92400e;">Subscription Paused</h2>

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

<p>Thank you for your continued support ❤️</p>`},_=T(function(){const{settings:a,plan:l}=w(),c=R(),p=U(),[s,f]=i.useState({contactEmail:a.contactEmail,ccEmail:a.ccEmail||"",logoUrl:a.logoUrl||"",receiptSubject:a.receiptSubject,receiptBody:a.receiptBody,refundSubject:a.refundSubject,refundBody:a.refundBody,cancelSubject:a.cancelSubject,cancelBody:a.cancelBody,pauseSubject:a.pauseSubject||b.pauseSubject,pauseBody:a.pauseBody||b.pauseBody,resumeSubject:a.resumeSubject||b.resumeSubject,resumeBody:a.resumeBody||b.resumeBody}),[y,v]=i.useState(()=>({...s})),m=c.state==="submitting"&&c.formMethod==="POST";i.useEffect(()=>{var t;((t=c.data)==null?void 0:t.status)==="success"&&!m&&(p.toast.show("Email settings saved successfully"),v({...s}))},[c.data,p,m,s]);const h=Object.keys(s).some(t=>s[t]!==y[t]),[g,j]=i.useState({}),S=()=>{const t={},o=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;return s.contactEmail?o.test(s.contactEmail)||(t.contactEmail="Invalid email format"):t.contactEmail="Contact email is required",s.ccEmail&&!o.test(s.ccEmail)&&(t.ccEmail="Invalid CC email format"),j(t),Object.keys(t).length===0},d=i.useCallback((t,o)=>{f(n=>({...n,[t]:o})),g[t]&&j(n=>{const x={...n};return delete x[t],x})},[g]),E=i.useCallback(()=>{if(!S()){p.toast.show("Please fix the errors before saving",{isError:!0});return}const t=new FormData;Object.entries(s).forEach(([o,n])=>{t.append(o,n)}),c.submit(t,{method:"POST"})},[s,c,p]),B=Object.keys(g).length>0,[r,k]=i.useState("receipt");return e.jsxs("s-page",{heading:"Email Configuration Settings",children:[e.jsx("s-button",{slot:"primary-action",variant:"primary",onClick:E,disabled:m||!h||B,...m?{loading:!0}:{},children:m?"Saving...":h?"Save":"No Changes"}),e.jsxs("div",{style:{display:"flex",gap:"24px",marginTop:"16px"},children:[e.jsx("div",{style:{flex:"0 0 250px"},children:e.jsx("s-text",{color:"subdued",children:"Configure the email settings for the donation section. Ensure all fields are filled out correctly for proper functioning."})}),e.jsx("div",{style:{flex:1},children:e.jsx("s-box",{padding:"large-200",borderWidth:"base",borderRadius:"large-100",background:"subdued",children:e.jsxs("s-stack",{direction:"block",gap:"large-200",children:[e.jsxs("s-box",{children:[e.jsxs("div",{style:{marginBottom:"16px"},children:[e.jsx("s-text-field",{label:"Your Contact Email",value:s.contactEmail,error:g.contactEmail,onChange:t=>d("contactEmail",t.target.value)}),e.jsx("div",{style:{marginTop:"4px"},children:e.jsx("s-text",{color:"subdued",children:"Customers who reply to the email will reach you at this address."})})]}),e.jsx("div",{style:{marginBottom:"16px"},children:e.jsx("s-text-field",{label:"Additional/CC Email ID (Optional)",value:s.ccEmail,error:g.ccEmail,onChange:t=>d("ccEmail",t.target.value)})}),e.jsxs("div",{style:{marginBottom:"16px"},children:[e.jsx("div",{style:{marginBottom:"8px"},children:e.jsx("strong",{children:"Email Logo (Optional)"})}),e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"12px"},children:[e.jsx("s-button",{onClick:()=>{var t;return(t=document.getElementById("logo-upload"))==null?void 0:t.click()},children:"Upload Logo"}),e.jsx("input",{id:"logo-upload",type:"file",accept:"image/*",style:{display:"none"},onChange:t=>{var n;const o=(n=t.target.files)==null?void 0:n[0];if(o){if(o.size>1024*1024){p.toast.show("File too large. Please use an image under 1MB.");return}const x=new FileReader;x.onload=C=>{d("logoUrl",C.target.result)},x.readAsDataURL(o)}}}),s.logoUrl&&e.jsx("s-button",{variant:"tertiary",tone:"critical",onClick:()=>d("logoUrl",""),children:"Remove"})]}),s.logoUrl&&e.jsx("div",{style:{marginTop:"12px",padding:"12px",background:"#fff",borderRadius:"4px",border:"1px solid #eee",display:"inline-block"},children:e.jsx("img",{src:s.logoUrl,alt:"Logo Preview",style:{maxHeight:"60px",display:"block"}})})]})]}),e.jsxs("s-box",{children:[e.jsx("div",{className:"polaris-tabs",children:e.jsx("div",{className:"polaris-tabs-list",role:"tablist",children:[{id:"receipt",label:"Receipt Template"},{id:"refund",label:"Refund Template"},{id:"cancel",label:"Cancellation Template"}].map(t=>e.jsx("button",{role:"tab","aria-selected":r===t.id,className:`polaris-tab ${r===t.id?"active":""}`,onClick:()=>k(t.id),children:t.label},t.id))})}),e.jsx("s-stack",{direction:"block",gap:"base",children:r==="refund"&&!u(l,"canSendRefundEmail")||r==="cancel"&&!u(l,"canSendCancelEmail")?e.jsx("s-box",{padding:"large-200",background:"subdued",borderRadius:"base",borderWidth:"base",children:e.jsx("s-stack",{direction:"block",gap:"base",children:e.jsxs("div",{style:{textAlign:"center",width:"100%"},children:[e.jsx("s-text",{type:"strong",children:"Plan Upgrade Required"}),e.jsx("s-box",{"padding-block-start":"base",children:e.jsxs("s-text",{color:"subdued",children:["The ",r," email feature is available on the",e.jsxs("strong",{children:[" ",r==="refund"?"Advanced":"Pro"]})," plan and above."]})}),e.jsx("s-box",{"padding-block-start":"base",children:e.jsx(P,{to:"/app/pricing",style:{textDecoration:"none"},children:e.jsx("s-button",{variant:"primary",children:"View Pricing Plans"})})})]})})}):e.jsxs(e.Fragment,{children:[e.jsx("s-text-field",{label:"Email Subject Line",disabled:!u(l,"canEditTemplates"),value:r==="receipt"?s.receiptSubject:r==="refund"?s.refundSubject:s.cancelSubject,onInput:t=>d(r==="receipt"?"receiptSubject":r==="refund"?"refundSubject":"cancelSubject",t.target.value)}),e.jsxs("div",{children:[e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",marginBottom:"8px"},children:[e.jsx("span",{style:{fontWeight:500},children:"Email Template"}),!u(l,"canEditTemplates")&&e.jsx("s-badge",{tone:"caution",children:"View Only"})]}),e.jsxs("div",{style:{padding:"12px",background:"#f4f6f8",borderRadius:"4px",fontSize:"13px",marginBottom:"12px",color:"#5c5f62"},children:[e.jsx("strong",{children:"Available Variables:"})," ",e.jsx("code",{children:"{{first_name}}"}),", ",e.jsx("code",{children:"{{last_name}}"}),", ",e.jsx("code",{children:"{{email}}"}),", ",e.jsx("code",{children:"{{currency}}"}),", ",e.jsx("code",{children:"{{amount}}"}),", ",e.jsx("code",{children:"{{orderNumber}}"}),", ",e.jsx("code",{children:"{{date}}"}),", ",e.jsx("code",{children:"{{donation_name}}"}),", ",e.jsx("code",{children:"{{frequency}}"}),", ",e.jsx("code",{children:"{{nextBillingDate}}"})]}),!u(l,"canEditTemplates")&&e.jsx("div",{style:{marginBottom:"12px"},children:e.jsxs("s-banner",{tone:"info",children:[e.jsx("div",{slot:"title",children:"Custom Templates Locked"}),e.jsxs("p",{children:["Upgrade to the ",e.jsx("strong",{children:"Pro"})," plan to customize your email templates with dynamic variables."]})]})}),e.jsx(A,{disabled:!u(l,"canEditTemplates"),value:r==="receipt"?s.receiptBody:r==="refund"?s.refundBody:s.cancelBody,onChange:t=>d(r==="receipt"?"receiptBody":r==="refund"?"refundBody":"cancelBody",t)})]})]})})]})]})})})]}),e.jsx("style",{children:`
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
            `})]})});export{_ as default};
