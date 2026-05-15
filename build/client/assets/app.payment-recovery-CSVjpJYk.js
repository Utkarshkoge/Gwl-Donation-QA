import{R as l,r as c,w as V,u as W,d as X,e as L}from"./chunk-UVKPFVEO-CEw7IaX3.js";import{j as e}from"./jsx-runtime-lA1hjGOj.js";import{u as J}from"./useAppBridge-Bj34gXAL.js";import{c as Q,v as Y,T as G}from"./Text-B4HYdKXE.js";import{u as ee,I as F,S as te,L as se,B as ae,h as ne}from"./Labelled-Bc4BOGrI.js";import"./use-is-after-initial-mount-B4v-yg52.js";var H=function(a){return l.createElement("svg",Object.assign({viewBox:"0 0 20 20"},a),l.createElement("path",{fillRule:"evenodd",d:"M15.655 4.344a2.695 2.695 0 0 0-3.81 0l-.599.599-.009-.009-1.06 1.06.008.01-5.88 5.88a2.75 2.75 0 0 0-.805 1.944v1.922a.75.75 0 0 0 .75.75h1.922a2.75 2.75 0 0 0 1.944-.806l7.54-7.539a2.695 2.695 0 0 0 0-3.81Zm-4.409 2.72-5.88 5.88a1.25 1.25 0 0 0-.366.884v1.172h1.172c.331 0 .65-.132.883-.366l5.88-5.88-1.689-1.69Zm2.75.629.599-.599a1.195 1.195 0 1 0-1.69-1.689l-.598.599 1.69 1.689Z"}))};H.displayName="EditIcon";var d={Select:"Polaris-Select",disabled:"Polaris-Select--disabled",error:"Polaris-Select--error",Backdrop:"Polaris-Select__Backdrop",Input:"Polaris-Select__Input",Content:"Polaris-Select__Content",InlineLabel:"Polaris-Select__InlineLabel",Icon:"Polaris-Select__Icon",SelectedOption:"Polaris-Select__SelectedOption",Prefix:"Polaris-Select__Prefix",hover:"Polaris-Select--hover",toneMagic:"Polaris-Select--toneMagic"};const z="";function $({options:t,label:a,labelAction:s,labelHidden:r,labelInline:i,disabled:m,helpText:j,placeholder:w,id:k,name:P,value:u=z,error:g,onChange:x,onFocus:f,onBlur:b,requiredIndicator:E,tone:v}){const{value:A,toggle:y}=ee(!1),R=c.useId(),p=k??R,N=i?!0:r,O=Q(d.Select,g&&d.error,v&&d[Y("tone",v)],m&&d.disabled),o=c.useCallback(S=>{y(),f==null||f(S)},[f,y]),n=c.useCallback(S=>{y(),b==null||b(S)},[b,y]),h=x?S=>x(S.currentTarget.value,p):void 0,C=[];j&&C.push(ne(p)),g&&C.push(`${p}Error`);let I=(t||[]).map(ie);w&&(I=[{label:w,value:z,disabled:!0},...I]);const Z=i&&l.createElement(ae,{paddingInlineEnd:"100"},l.createElement(G,{as:"span",variant:"bodyMd",tone:v&&v==="magic"&&!A?"magic-subdued":"subdued",truncate:!0},a)),_=le(I,u),q=_.prefix&&l.createElement("div",{className:d.Prefix},_.prefix),U=l.createElement("div",{className:d.Content,"aria-hidden":!0,"aria-disabled":m},Z,q,l.createElement("span",{className:d.SelectedOption},_.label),l.createElement("span",{className:d.Icon},l.createElement(F,{source:te}))),K=I.map(oe);return l.createElement(se,{id:p,label:a,error:g,action:s,labelHidden:N,helpText:j,requiredIndicator:E,disabled:m},l.createElement("div",{className:O},l.createElement("select",{id:p,name:P,value:u,className:d.Input,disabled:m,onFocus:o,onBlur:n,onChange:h,"aria-invalid":!!g,"aria-describedby":C.length?C.join(" "):void 0,"aria-required":E},K),U,l.createElement("div",{className:d.Backdrop})))}function M(t){return typeof t=="string"}function T(t){return typeof t=="object"&&"options"in t&&t.options!=null}function B(t){return{label:t,value:t}}function ie(t){if(M(t))return B(t);if(T(t)){const{title:a,options:s}=t;return{title:a,options:s.map(r=>M(r)?B(r):r)}}return t}function le(t,a){const s=re(t);let r=s.find(i=>a===i.value);return r===void 0&&(r=s.find(i=>!i.hidden)),r||{value:"",label:""}}function re(t){let a=[];return t.forEach(s=>{T(s)?a=a.concat(s.options):a.push(s)}),a}function D(t){const{value:a,label:s,prefix:r,key:i,...m}=t;return l.createElement("option",Object.assign({key:i??a,value:a},m),s)}function oe(t){if(T(t)){const{title:a,options:s}=t;return l.createElement("optgroup",{label:a,key:a},s.map(D))}return D(t)}const xe=V(function(){const{settings:a}=W(),s=X(),r=J(),[i,m]=c.useState(a.enabled),[j,w]=c.useState(a.retryAttempts.toString()),[k,P]=c.useState(a.retryInterval.toString()),[u,g]=c.useState(a.fallbackAction),[x,f]=c.useState(a.sendNotifications),b=c.useCallback(n=>w(n),[]),E=c.useCallback(n=>P(n),[]),v=c.useCallback(n=>g(n),[]),A=Array.from({length:10},(n,h)=>({label:`${h+1} attempts`,value:`${h+1}`})),y=Array.from({length:10},(n,h)=>({label:`${h+1} Day${h===0?"":"s"}`,value:`${h+1}`})),R=[{label:"Pause Subscription",value:"pause"},{label:"Cancel Subscription",value:"cancel"},{label:"Skip Failed Order",value:"skip"}],p=s.state==="submitting",N=c.useRef(null);c.useEffect(()=>{s.state==="idle"&&s.data?N.current!=="handled"&&(N.current="handled",s.data.status==="success"?r.toast.show(s.data.message||"Recovery settings saved successfully"):s.data.status==="error"&&r.toast.show(s.data.message||"Failed to save settings",{isError:!0})):s.state==="submitting"&&(N.current="submitting")},[s.state,s.data,r]);const O=()=>{const n=new FormData;n.append("enabled",i.toString()),n.append("retryAttempts",j),n.append("retryInterval",k),n.append("fallbackAction",u),n.append("sendNotifications",x.toString()),s.submit(n,{method:"POST"})},o="#51395c";return e.jsxs("s-page",{heading:"Failed Payment Recovery Settings",children:[e.jsx("s-button",{slot:"primary-action",variant:"primary",onClick:O,className:"main-save-btn",...p?{loading:!0}:{},disabled:p,children:p?"Saving...":"Save Settings"}),e.jsxs("div",{className:"recovery-settings-layout",children:[e.jsxs("div",{className:"settings-row",children:[e.jsxs("div",{className:"settings-info",children:[e.jsx("h2",{className:"section-title",children:"Enable Recovery"}),e.jsx("p",{className:"section-desc",children:"When enabled, our intelligent system will monitor and automatically retry failed recurring transactions to maximize your revenue."}),e.jsx("div",{style:{marginTop:"12px"},children:e.jsx("s-badge",{tone:i?"success":"caution",children:i?"Currently Active":"Currently Disabled"})})]}),e.jsx("div",{className:"settings-card",children:e.jsx("div",{className:"card-content",children:e.jsxs("div",{className:"toggle-box",children:[e.jsxs("div",{className:"toggle-text",children:[e.jsx("strong",{children:"Smart Recovery System"}),e.jsx("span",{children:"Automate the retry flow for failed billing attempts."})]}),e.jsxs("label",{className:"custom-switch",children:[e.jsx("input",{type:"checkbox",checked:i,onChange:n=>m(n.target.checked)}),e.jsx("span",{className:"custom-slider"})]})]})})})]}),e.jsxs("div",{className:`recovery-logic-container ${i?"active":"disabled"}`,children:[e.jsxs("div",{className:"settings-row",children:[e.jsxs("div",{className:"settings-info",children:[e.jsx("h2",{className:"section-title",children:"Retry Strategy"}),e.jsxs("p",{className:"section-desc",children:["Configure the intensity and timing of recovery attempts.",e.jsx("br",{}),e.jsx("br",{}),e.jsx("strong",{style:{color:o},children:"Tip:"})," Most successful stores use 3 attempts with 3-day intervals."]})]}),e.jsx("div",{className:"settings-card",children:e.jsxs("div",{className:"card-content",children:[e.jsx("div",{className:"input-group",children:e.jsx($,{label:"Number of Recovery Attempts",options:A,value:j,onChange:b,disabled:!i})}),e.jsx("div",{className:"input-group",style:{marginTop:"20px"},children:e.jsx($,{label:"Interval Between Retries",options:y,value:k,onChange:E,disabled:!i})})]})})]}),e.jsxs("div",{className:"settings-row",children:[e.jsxs("div",{className:"settings-info",children:[e.jsx("h2",{className:"section-title",children:"Fallback Action"}),e.jsx("p",{className:"section-desc",children:"Define what should happen automatically if all recovery attempts are exhausted and the payment is still not successful."})]}),e.jsx("div",{className:"settings-card",children:e.jsxs("div",{className:"card-content",children:[e.jsx($,{label:"Final Resolution Action",options:R,value:u,onChange:v,disabled:!i}),e.jsxs("div",{className:"action-hint",children:[u==="skip"&&"The failed order will be skipped, but the subscription will remain active for the next billing cycle.",u==="pause"&&"The entire subscription will be placed on hold until the customer updates their payment info.",u==="cancel"&&"The subscription will be permanently cancelled. Use with caution."]})]})})]}),e.jsxs("div",{className:"settings-row",children:[e.jsxs("div",{className:"settings-info",children:[e.jsx("h2",{className:"section-title",children:"Communication"}),e.jsx("p",{className:"section-desc",children:"Keep your customers informed. Send automated emails when a payment fails to prompt them to update their billing details."})]}),e.jsx("div",{className:"settings-card",children:e.jsxs("div",{className:"card-content",children:[e.jsx("div",{className:"notification-toggle",children:e.jsx("s-checkbox",{checked:x,onChange:n=>f(n.target.checked),label:"Send automated payment failure emails",disabled:!i})}),x&&e.jsxs(L,{to:"/app/email-settings",className:"email-config-btn",children:[e.jsxs("div",{className:"btn-inner",children:[e.jsx("div",{className:"icon-wrap",children:e.jsx(F,{source:H,tone:"base"})}),e.jsx("span",{children:"Customize Email Template"})]}),e.jsx("svg",{width:"16",height:"16",viewBox:"0 0 20 20",children:e.jsx("path",{fill:"currentColor",d:"M12.72 10l-4.22 4.22a.75.75 0 101.06 1.06l4.75-4.75a.75.75 0 000-1.06l-4.75-4.75a.75.75 0 00-1.06 1.06L12.72 10z"})})]})]})})]})]}),e.jsx("div",{className:"footer-area",children:e.jsxs("p",{children:["Feature part of your ",e.jsx("strong",{children:"Pro Plan"})," subscription. ",e.jsx(L,{to:"/app/help",children:"Learn more about payment recovery"})]})})]}),e.jsx("style",{children:`
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
                    color: ${o};
                    font-style: italic;
                    padding: 10px 14px;
                    background: ${o}08;
                    border-radius: 6px;
                    border-left: 3px solid ${o};
                }

                .email-config-btn {
                    margin-top: 20px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 16px;
                    background: #fcfaff;
                    border: 1px solid ${o}15;
                    border-radius: 10px;
                    text-decoration: none;
                    color: ${o};
                    font-weight: 600;
                    transition: all 0.2s;
                }

                .email-config-btn:hover {
                    background: ${o}08;
                    border-color: ${o}30;
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
                    color: ${o};
                    text-decoration: none;
                    font-weight: 600;
                }

                /* Custom Theme Styling */
                .main-save-btn {
                    background: ${o} !important;
                    border-color: ${o} !important;
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

                input:checked + .custom-slider { background-color: ${o}; }
                input:checked + .custom-slider:before { transform: translateX(20px); }

                @media (max-width: 768px) {
                    .settings-row {
                        grid-template-columns: 1fr;
                        gap: 16px;
                    }
                }
            `})]})});export{xe as default};
