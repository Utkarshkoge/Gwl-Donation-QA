import{c as m,d as j,w as f,f as C,r as u,u as y}from"./chunk-UVKPFVEO-A-eF8wi6.js";import{j as t}from"./jsx-runtime-vZpP4iHm.js";import{C as k,P as v,a as P}from"./ConfigurationTab-fjKav9-g.js";import{u as S}from"./useAppBridge-Bj34gXAL.js";function A({campaigns:l,pagination:r,onPageChange:a}){const c=m(),h=j();if(!l||l.length===0)return t.jsxs("s-stack",{gap:"base",children:[t.jsx("s-heading",{children:"No Campaigns Added Yet"}),t.jsx("s-paragraph",{children:"Add a campaign from the 'Add Campaign' button above."})]});const e=(r==null?void 0:r.page)||1,o=(r==null?void 0:r.totalPages)||1,p=(r==null?void 0:r.totalCount)||l.length,x=(r==null?void 0:r.itemsPerPage)||10,d=(e-1)*x+1,b=Math.min(e*x,p);return t.jsxs("div",{children:[t.jsx("div",{style:{overflowX:"auto"},children:t.jsxs("table",{style:{width:"100%",borderCollapse:"collapse",textAlign:"left"},children:[t.jsx("thead",{children:t.jsxs("tr",{style:{borderBottom:"1px solid #dfe3e8"},children:[t.jsx("th",{style:{padding:"12px 8px"},children:"Sr. No."}),t.jsx("th",{style:{padding:"12px 8px"},children:"Campaign Title"}),t.jsx("th",{style:{padding:"12px 8px"},children:"Description"}),t.jsx("th",{style:{padding:"12px 8px"},children:"Status"}),t.jsx("th",{style:{padding:"12px 8px"},children:"Action"})]})}),t.jsx("tbody",{children:l.map((s,n)=>t.jsxs("tr",{style:{borderBottom:"1px solid #dfe3e8"},children:[t.jsx("td",{style:{padding:"12px 8px"},children:d+n}),t.jsx("td",{style:{padding:"12px 8px"},children:t.jsxs("s-stack",{direction:"inline",gap:"base",children:[s.imageUrl&&t.jsx("img",{src:s.imageUrl,alt:s.name,style:{width:"40px",height:"40px",objectFit:"cover",borderRadius:"4px"}}),t.jsx("span",{children:s.name})]})}),t.jsx("td",{style:{padding:"12px 8px",maxWidth:"300px"},children:s.description}),t.jsx("td",{style:{padding:"12px 8px"},children:t.jsx("s-badge",{tone:s.enabled?"success":"caution",children:s.enabled?"Active":"Disabled"})}),t.jsx("td",{style:{padding:"12px 8px"},children:t.jsxs("s-stack",{direction:"inline",gap:"base",children:[t.jsx("s-button",{onClick:()=>c(`/app/preset-donation/edit/${s.id}`),children:"Edit"}),t.jsx("s-button",{onClick:()=>{confirm("Are you sure you want to delete this campaign?")&&h.submit(null,{method:"post",action:`/app/preset-donation/delete/${s.id}`})},children:"Delete"})]})})]},s.id))})]})}),t.jsxs("div",{style:{marginTop:"20px",padding:"16px",backgroundColor:"#f6f6f7",borderRadius:"8px",display:"flex",justifyContent:"space-between",alignItems:"center"},children:[t.jsxs("s-paragraph",{children:["Showing ",t.jsx("strong",{children:d})," to ",t.jsx("strong",{children:b})," of"," ",t.jsx("strong",{children:p})," campaigns"]}),t.jsxs("s-stack",{direction:"inline",gap:"base",children:[t.jsx("s-button",{disabled:e===1,onClick:()=>a(e-1),children:"Previous"}),o<=5?Array.from({length:o},(s,n)=>n+1).map(s=>t.jsx("s-button",{variant:s===e?"primary":"tertiary",onClick:()=>a(s),children:s},s)):t.jsxs(t.Fragment,{children:[e>2&&t.jsx("s-button",{variant:"tertiary",onClick:()=>a(1),children:"1"}),e>3&&t.jsx("s-paragraph",{children:"..."}),e>1&&t.jsx("s-button",{variant:"tertiary",onClick:()=>a(e-1),children:e-1}),t.jsx("s-button",{variant:"primary",children:e}),e<o&&t.jsx("s-button",{variant:"tertiary",onClick:()=>a(e+1),children:e+1}),e<o-1&&t.jsx("s-paragraph",{children:"..."}),e<o-2&&t.jsx("s-button",{variant:"tertiary",onClick:()=>a(o),children:o})]}),t.jsx("s-button",{disabled:e===o,onClick:()=>a(e+1),children:"Next"})]})]})]})}const w=[{id:"campaign",label:"Donation Campaigns"},{id:"config",label:"Configuration"}],N=f(function(){const r=m();j(),S();const[a,c]=C(),h=a.get("tab"),[e,o]=u.useState(h==="configuration"?"config":"campaign");u.useEffect(()=>{const i=a.get("tab");i==="configuration"?o("config"):i==="campaign"&&o("campaign")},[a]);const p=i=>{o(i),c({tab:i==="config"?"configuration":i})},{campaigns:x,error:d,pagination:b,blockConfig:s,shop:n,appSettings:T}=y(),g=i=>{c({page:String(i)})};return t.jsxs("s-page",{heading:"Donation Preferences",children:[e==="campaign"&&t.jsx("s-button",{slot:"primary-action",variant:"primary",onClick:()=>r("/app/preset-donation/add"),children:"Add Campaign"}),t.jsx("div",{className:"polaris-tabs",children:t.jsx("div",{className:"polaris-tabs-list",role:"tablist",children:w.map(i=>t.jsx("button",{role:"tab","aria-selected":e===i.id,className:`polaris-tab ${e===i.id?"active":""}`,onClick:()=>p(i.id),children:i.label},i.id))})}),t.jsxs("div",{className:"polaris-tab-panel",children:[e==="campaign"&&t.jsx("s-section",{children:d?t.jsx("s-banner",{tone:"critical",children:t.jsx("s-paragraph",{children:d})}):t.jsx(A,{campaigns:x,pagination:b,onPageChange:g})}),e==="config"&&t.jsx("s-section",{children:t.jsx(k,{blocks:[{id:"product",title:"Product Page Setup",description:"To add the donation section to your product page, click the button below to insert the app block.",themeEditorUrl:`https://${n}/admin/themes/current/editor?template=product&context=apps`,buttonLabel:"Donation App Block on Product Page",previewSvg:v,instructions:["Go to ","Online Store → Themes"," → Click on ","Customize"," → Select Product Page Template ","Click Add Block"," → Select ","Donation Product Page"," → Click ","Save"]},{id:"cart",title:"Cart Page Setup",description:"To add the donation section to your cart page, click the button below to insert the app block.",themeEditorUrl:`https://${n}/admin/themes/current/editor?template=cart&context=apps`,buttonLabel:"Donation App Block on Cart Page",previewSvg:P,instructions:["Go to ","Online Store → Themes"," → Click on ","Customize"," → Select Cart Page Template ","Click Add Block"," → Select ","Donation Cart Widget"," → Click ","Save"]}]})})]}),t.jsx("style",{children:`
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
        .polaris-tab-panel {
          padding-top: 8px;
        }
      `})]})});export{N as default};
