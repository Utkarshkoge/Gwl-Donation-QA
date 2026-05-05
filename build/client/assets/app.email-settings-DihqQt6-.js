import{w,u as R,d as P,r as l,e as A}from"./chunk-UVKPFVEO-CEw7IaX3.js";import{j as e}from"./jsx-runtime-lA1hjGOj.js";import{c as u}from"./features-D7zFNnvn.js";import{R as N}from"./RichTextEditor-euPN7XAi.js";import{u as O}from"./useAppBridge-Bj34gXAL.js";const x={pauseSubject:"Subscription Paused",pauseBody:`<h2 style="color:#92400e;">Subscription Paused</h2>

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

<p>Thank you for your continued support ❤️</p>`},q=w(function(){const{settings:a,plan:c}=R(),o=P(),p=O(),[s,y]=l.useState({contactEmail:a.contactEmail,ccEmail:a.ccEmail||"",logoUrl:a.logoUrl||"",receiptSubject:a.receiptSubject,receiptBody:a.receiptBody,refundSubject:a.refundSubject,refundBody:a.refundBody,cancelSubject:a.cancelSubject,cancelBody:a.cancelBody,pauseSubject:a.pauseSubject||x.pauseSubject,pauseBody:a.pauseBody||x.pauseBody,resumeSubject:a.resumeSubject||x.resumeSubject,resumeBody:a.resumeBody||x.resumeBody}),[v,S]=l.useState(()=>({...s})),b=o.state==="submitting"&&o.formMethod==="POST",h=l.useRef(null);l.useEffect(()=>{var t;if(o.state==="idle"&&((t=o.data)==null?void 0:t.status)==="success"){const n=JSON.stringify(s);n!==h.current&&(h.current=n,p.toast.show("Email settings saved successfully"),S({...s}))}},[o.state,o.data,p,s]);const f=Object.keys(s).some(t=>s[t]!==v[t]),[m,j]=l.useState({}),E=()=>{const t={},n=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;return s.contactEmail?n.test(s.contactEmail)||(t.contactEmail="Invalid email format"):t.contactEmail="Contact email is required",s.ccEmail&&!n.test(s.ccEmail)&&(t.ccEmail="Invalid CC email format"),j(t),Object.keys(t).length===0},d=l.useCallback((t,n)=>{y(i=>({...i,[t]:n})),m[t]&&j(i=>{const g={...i};return delete g[t],g})},[m]),B=l.useCallback(()=>{if(!E()){p.toast.show("Please fix the errors before saving",{isError:!0});return}const t=new FormData;Object.entries(s).forEach(([n,i])=>{t.append(n,i)}),o.submit(t,{method:"POST"})},[s,o,p]),k=Object.keys(m).length>0,[r,C]=l.useState("receipt");return e.jsxs("s-page",{heading:"Email Configuration Settings",children:[e.jsx("s-button",{slot:"primary-action",variant:"primary",onClick:B,disabled:b||!f||k,...b?{loading:!0}:{},children:b?"Saving...":f?"Save":"No Changes"}),e.jsxs("div",{style:{display:"flex",gap:"24px",marginTop:"16px"},children:[e.jsx("div",{style:{flex:"0 0 250px"},children:e.jsx("s-text",{color:"subdued",children:"Configure the email settings for the donation section. Ensure all fields are filled out correctly for proper functioning."})}),e.jsx("div",{style:{flex:1},children:e.jsx("s-box",{padding:"large-200",borderWidth:"base",borderRadius:"large-100",background:"subdued",children:e.jsxs("s-stack",{direction:"block",gap:"large-200",children:[e.jsxs("s-box",{children:[e.jsxs("div",{style:{marginBottom:"16px"},children:[e.jsx("s-text-field",{label:"Your Contact Email",value:s.contactEmail,error:m.contactEmail,onChange:t=>d("contactEmail",t.target.value)}),e.jsx("div",{style:{marginTop:"4px"},children:e.jsx("s-text",{color:"subdued",children:"Customers who reply to the email will reach you at this address."})})]}),e.jsx("div",{style:{marginBottom:"16px"},children:e.jsx("s-text-field",{label:"Additional/CC Email ID (Optional)",value:s.ccEmail,error:m.ccEmail,onChange:t=>d("ccEmail",t.target.value)})}),e.jsxs("div",{style:{marginBottom:"16px"},children:[e.jsx("div",{style:{marginBottom:"8px"},children:e.jsx("strong",{children:"Email Logo (Optional)"})}),e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"12px"},children:[e.jsx("s-button",{onClick:()=>{var t;return(t=document.getElementById("logo-upload"))==null?void 0:t.click()},children:"Upload Logo"}),e.jsx("input",{id:"logo-upload",type:"file",accept:"image/*",style:{display:"none"},onChange:t=>{var i;const n=(i=t.target.files)==null?void 0:i[0];if(n){if(n.size>1024*1024){p.toast.show("File too large. Please use an image under 1MB.");return}const g=new FileReader;g.onload=T=>{d("logoUrl",T.target.result)},g.readAsDataURL(n)}}}),s.logoUrl&&e.jsx("s-button",{variant:"tertiary",tone:"critical",onClick:()=>d("logoUrl",""),children:"Remove"})]}),s.logoUrl&&e.jsx("div",{style:{marginTop:"12px",padding:"12px",background:"#fff",borderRadius:"4px",border:"1px solid #eee",display:"inline-block"},children:e.jsx("img",{src:s.logoUrl,alt:"Logo Preview",style:{maxHeight:"60px",display:"block"}})})]})]}),e.jsxs("s-box",{children:[e.jsx("div",{className:"polaris-tabs",children:e.jsx("div",{className:"polaris-tabs-list",role:"tablist",children:[{id:"receipt",label:"Receipt Template"},{id:"refund",label:"Refund Template"},{id:"cancel",label:"Cancellation Template"}].map(t=>e.jsx("button",{role:"tab","aria-selected":r===t.id,className:`polaris-tab ${r===t.id?"active":""}`,onClick:()=>C(t.id),children:t.label},t.id))})}),e.jsx("s-stack",{direction:"block",gap:"base",children:r==="refund"&&!u(c,"canSendRefundEmail")||r==="cancel"&&!u(c,"canSendCancelEmail")?e.jsx("s-box",{padding:"large-200",background:"subdued",borderRadius:"base",borderWidth:"base",children:e.jsx("s-stack",{direction:"block",gap:"base",children:e.jsxs("div",{style:{textAlign:"center",width:"100%"},children:[e.jsx("s-text",{type:"strong",children:"Plan Upgrade Required"}),e.jsx("s-box",{"padding-block-start":"base",children:e.jsxs("s-text",{color:"subdued",children:["The ",r," email feature is available on the",e.jsxs("strong",{children:[" ",r==="refund"?"Advanced":"Pro"]})," plan and above."]})}),e.jsx("s-box",{"padding-block-start":"base",children:e.jsx(A,{to:"/app/pricing",style:{textDecoration:"none"},children:e.jsx("s-button",{variant:"primary",children:"View Pricing Plans"})})})]})})}):e.jsxs(e.Fragment,{children:[e.jsx("s-text-field",{label:"Email Subject Line",disabled:!u(c,"canEditTemplates"),value:r==="receipt"?s.receiptSubject:r==="refund"?s.refundSubject:s.cancelSubject,onInput:t=>d(r==="receipt"?"receiptSubject":r==="refund"?"refundSubject":"cancelSubject",t.target.value)}),e.jsxs("div",{children:[e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",marginBottom:"8px"},children:[e.jsx("span",{style:{fontWeight:500},children:"Email Template"}),!u(c,"canEditTemplates")&&e.jsx("s-badge",{tone:"caution",children:"View Only"})]}),e.jsxs("div",{style:{padding:"12px",background:"#f4f6f8",borderRadius:"4px",fontSize:"13px",marginBottom:"12px",color:"#5c5f62"},children:[e.jsx("strong",{children:"Available Variables:"})," ",e.jsx("code",{children:"{{first_name}}"}),", ",e.jsx("code",{children:"{{last_name}}"}),", ",e.jsx("code",{children:"{{email}}"}),", ",e.jsx("code",{children:"{{currency}}"}),", ",e.jsx("code",{children:"{{amount}}"}),", ",e.jsx("code",{children:"{{orderNumber}}"}),", ",e.jsx("code",{children:"{{date}}"}),", ",e.jsx("code",{children:"{{donation_name}}"}),", ",e.jsx("code",{children:"{{frequency}}"}),", ",e.jsx("code",{children:"{{nextBillingDate}}"})]}),!u(c,"canEditTemplates")&&e.jsx("div",{style:{marginBottom:"12px"},children:e.jsxs("s-banner",{tone:"info",children:[e.jsx("div",{slot:"title",children:"Custom Templates Locked"}),e.jsxs("p",{children:["Upgrade to the ",e.jsx("strong",{children:"Pro"})," plan to customize your email templates with dynamic variables."]})]})}),e.jsx(N,{disabled:!u(c,"canEditTemplates"),value:r==="receipt"?s.receiptBody:r==="refund"?s.refundBody:s.cancelBody,onChange:t=>d(r==="receipt"?"receiptBody":r==="refund"?"refundBody":"cancelBody",t)})]})]})})]})]})})})]}),e.jsx("style",{children:`
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
