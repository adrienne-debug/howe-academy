// 👪 KID_EDITOR (2026-11-08): Settings ▸ Family — the roster editor end to end, as the browser runs it.
// Renders the real Kids card, runs its own oninput/onchange/onclick handlers, then Save Family. Checks: an edit reaches
// familyEdit, + Add Kid adds a row, Save writes settings/family with every field it doesn't know about (notebookTheme,
// notebookName, anything a later feature adds) carried through untouched. The 10/3 bug was a second top-level
// `function famSet` that won (see test_famset_collision.js) — so this also scans EVERY top-level function declaration in
// the app's inline scripts: the editor's functions must be declared once and never reassigned, and any duplicate name
// elsewhere fails unless it is in the grandfathered list below (shrink it when one is fixed; never grow it).
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c)=>{ c?pass++:fail++; console.log((c?"  ok  - ":"  FAIL- ")+n); };

// Top-level function declarations of one script: [{name,start,end}]. Tracks brace depth, skipping strings, comments,
// template literals (with ${} nesting) and regex literals, so braces inside them don't count.
function topFns(code){
  const out=[], n=code.length, tstack=[], idc=/[A-Za-z0-9_$]/, kw=/^(return|typeof|case|in|of|delete|void|throw|new|instanceof|else|do|yield|await)$/;
  let i=0, depth=0, prev="", lastId="", cur=null, paren=0;
  const tpl=()=>{ while(i<n){ const ch=code[i]; if(ch==="\\"){ i+=2; continue; } if(ch==="`"){ i++; prev="id"; return; }
    if(ch==="$"&&code[i+1]==="{"){ i+=2; tstack.push(depth); prev="{"; return; } i++; } };
  while(i<n){ const c=code[i], d=code[i+1];
    if(c==="/"&&d==="/"){ while(i<n&&code[i]!=="\n") i++; continue; }
    if(c==="/"&&d==="*"){ const e=code.indexOf("*/",i+2); i=e<0?n:e+2; continue; }
    if(c==="'"||c==='"'){ i++; while(i<n&&code[i]!==c){ if(code[i]==="\\") i++; i++; } i++; prev="id"; lastId=""; continue; }
    if(c==="`"){ i++; tpl(); continue; }
    if(c==="/"&&(!(prev==="id"||prev==="num"||prev===")"||prev==="]")||(prev==="id"&&kw.test(lastId)))){
      i++; let cls=false; while(i<n){ const ch=code[i]; if(ch==="\\"){ i+=2; continue; } if(ch==="[") cls=true; else if(ch==="]") cls=false;
        else if((ch==="/"&&!cls)||ch==="\n") break; i++; }
      i++; while(i<n&&/[a-z]/.test(code[i])) i++; prev="id"; lastId=""; continue; }
    if(idc.test(c)){ let j=i; while(j<n&&idc.test(code[j])) j++; const w=code.slice(i,j);
      if(w==="function"&&depth===0&&!cur&&(prev===""||prev===";"||prev==="}"||prev==="{"||(prev==="id"&&lastId==="async"))){
        let k=j; while(/\s/.test(code[k])) k++; if(code[k]==="*"){ k++; while(/\s/.test(code[k])) k++; }
        let m=k; while(m<n&&idc.test(code[m])) m++; if(m>k){ cur={name:code.slice(k,m),start:i,open:false}; paren=0; }
      }
      prev=/^[0-9]/.test(w)?"num":"id"; lastId=w; i=j; continue; }
    if(/\s/.test(c)){ i++; continue; }
    if(cur&&depth===0){ if(c==="(") paren++; else if(c===")") paren--; }
    if(c==="{"){ if(cur&&depth===0&&paren===0) cur.open=true; depth++; }
    else if(c==="}"){ if(tstack.length&&tstack[tstack.length-1]===depth){ tstack.pop(); i++; tpl(); continue; }
      depth--; if(cur&&cur.open&&depth===0){ out.push({name:cur.name,start:cur.start,end:i+1}); cur=null; } }
    prev=c; lastId=""; i++;
  }
  return {fns:out, depth};
}

// Every inline <script> shares one global scope — scan them all, in page order.
const scripts=[...src.matchAll(/<script(\s[^>]*)?>([\s\S]*?)<\/script>/g)].filter(m=>!(m[1]&&/src=/.test(m[1]))).map(m=>m[2]);
const decl={};   // name → [source text, …] in page order (the browser keeps the LAST)
let balanced=true;
scripts.forEach(s=>{ const r=topFns(s); if(r.depth!==0) balanced=false; r.fns.forEach(f=>(decl[f.name]=decl[f.name]||[]).push(s.slice(f.start,f.end))); });
const names=Object.keys(decl);
ok("scanner reads every inline script to the end ("+names.length+" top-level functions)", balanced&&names.length>5000);
ok("scanner finds the editor's own functions", ["famSet","famAdd","famSave","renderFamilyCard"].every(n=>decl[n]));

// Grandfathered duplicates (2026-11-08) — each one is a live bug somewhere: the LATER declaration replaces the earlier.
//   spRecord: 🔎 Spot check's record list (SPOTCHECK, 10/16) vs the study-session subject record (SESSPUT, 11/2).
const GRANDFATHERED=["spRecord"];
const dups=names.filter(n=>decl[n].length>1).sort();
const fresh=dups.filter(n=>GRANDFATHERED.indexOf(n)<0);
ok("no NEW duplicate top-level function names"+(fresh.length?" — "+fresh.join(", "):""), !fresh.length);
GRANDFATHERED.filter(n=>dups.indexOf(n)<0).forEach(n=>console.log("  note - "+n+" is no longer duplicated: take it off GRANDFATHERED"));

// The editor's call graph: what its markup calls, and what those call.
const EDITOR=["familyEditInit","famTint","famSlug","famSet","famAdd","famRemove","famSave","renderFamilyCard","esc","renderSettings","rulesToggleCard","renderAll"];
ok("each editor function is declared exactly once", EDITOR.every(n=>decl[n]&&decl[n].length===1));
// …and nothing reassigns one — a top-level `famSet=…` or a `window.famSet=…` anywhere, here or in a lazy-loaded file.
// (A function's own parameter or local of the same name, like `esc` in laIrrHtml(u,esc), is not a reassignment.)
const side=["family-config.js","eic.js","library.js","play.js","esa.js","notebooks.js","envirothon.js"].filter(f=>fs.existsSync(path.join(__dirname,f)))
  .map(f=>fs.readFileSync(path.join(__dirname,f),"utf8"));
const reassigned=EDITOR.filter(n=>{ const re=new RegExp("^"+n+"\\s*=(?![=>])|window\\."+n+"\\s*=(?![=>])|window\\[[\"']"+n+"[\"']\\]\\s*=(?!=)","m");
  return [src].concat(side).some(t=>re.test(t)); });
ok("no editor function is reassigned anywhere"+(reassigned.length?" — "+reassigned.join(", "):""), !reassigned.length);

// ── The harness: the editor's real code (the declaration the browser keeps), a stubbed page around it. ──
const letLine=(src.match(/^let familyEdit=null;.*$/m)||[""])[0];
ok("the working copy is a top-level `let familyEdit=null`", !!letLine);
const code=[letLine].concat(["familyEditInit","famTint","famSlug","famSet","famAdd","famRemove","famSave","renderFamilyCard","esc"].map(n=>decl[n][decl[n].length-1]))
  .concat(["this.__fe=()=>familyEdit||[];"]).join("\n");
const ROSTER0=[
  {id:"kida",name:"Kid A",color:"#1e3a5f",badge:"#dbeafe",schoolAge:true,grade:"6",emoji:"🦊"},
  {id:"kidb",name:"Kid B",color:"#c45e1a",badge:"#ffedd5",schoolAge:false,notebookTheme:"shark",notebookName:"Bee",
   futureField:{nested:[1,2,{deep:"x"}],flag:true}},
];
const writes=[], ls={}, alerts=[]; let reloads=0, renders=0;
const ctx={ ROSTER_DEF:JSON.parse(JSON.stringify(ROSTER0)), MAST_KID_EMOJI:{}, rulesOpen:{family:true},
  HA_LS:{setItem:(k,v)=>{ ls[k]=v; }, getItem:k=>ls[k]||null},
  db:{ref:p=>({set:v=>{ writes.push([p,JSON.parse(JSON.stringify(v))]); return {then:f=>{ f(); return {catch:()=>{}}; }}; }})},
  document:{getElementById:()=>({textContent:"",style:{}})}, sessionStorage:{setItem:()=>{}}, location:{reload:()=>{ reloads++; }},
  alert:m=>alerts.push(m), confirm:()=>true, renderAll:()=>{ renders++; } };
vm.createContext(ctx); vm.runInContext(code,ctx);

// Handlers straight from the rendered markup, run with `this` = the control, like a browser does.
const decode=s=>s.replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&amp;/g,"&");
const controls=()=>[...ctx.renderFamilyCard().matchAll(/<(input|select|button)\b([^>]*)>/g)].map(m=>{ const a=m[2];
  const h=a.match(/\bon(input|change|click)="([^"]*)"/); return {tag:m[1],type:(a.match(/\btype="([^"]*)"/)||[])[1]||"",
  ev:h&&h[1], js:h&&decode(h[2]), text:(a.match(/\btitle="([^"]*)"/)||[])[1]||""}; }).filter(c=>c.js);
const fire=(c,el)=>{ if(!c){ ok("control is on the card",false); return; }
  try{ vm.runInContext("(function(){"+c.js+"})",ctx).call(el||{}); }catch(e){ ok(c.js+" runs ("+e.message+")",false); } };
const rowsOf=cs=>cs.filter(c=>/famSet\(\d+,'name'/.test(c.js));
const find=(cs,i,field)=>cs.find(c=>c.js.indexOf("famSet("+i+",'"+field+"'")===0);

let cs=controls();
ok("the Kids card renders one name box per kid", rowsOf(cs).length===2);
ok("every row has color, emoji, name, grade and School-age controls", ["color","emoji","name","grade","schoolAge"].every(f=>find(cs,0,f)&&find(cs,1,f)));
fire(find(cs,0,"name"),{value:"Kid Ay"});
ok("typing a name reaches familyEdit", (ctx.__fe()[0]||{}).name==="Kid Ay");
fire(find(cs,0,"color"),{value:"#ff0000"});
ok("changing a color reaches familyEdit (and its tint)", (ctx.__fe()[0]||{}).color==="#ff0000"&&(ctx.__fe()[0]||{}).badge===ctx.famTint("#ff0000"));
fire(find(cs,0,"emoji"),{value:"🐙"}); fire(find(cs,0,"grade"),{value:"7"}); fire(find(cs,0,"schoolAge"),{checked:false});
ok("emoji, grade and School-age reach familyEdit", (ctx.__fe()[0]||{}).emoji==="🐙"&&(ctx.__fe()[0]||{}).grade==="7"&&(ctx.__fe()[0]||{}).schoolAge===false);
ok("an edit doesn't touch the other kid", JSON.stringify(ctx.__fe()[1])===JSON.stringify(ROSTER0[1]));
ok("the card now says there are unsaved changes", /Unsaved changes/.test(ctx.renderFamilyCard()));

const addBtn=cs.find(c=>c.js==="famAdd()"), saveBtn=cs.find(c=>c.js==="famSave()");
ok("+ Add Kid and Save Family buttons are wired", !!addBtn&&!!saveBtn);
const r0=renders; fire(addBtn);
cs=controls();
ok("+ Add Kid adds a row and repaints", ctx.__fe().length===3&&rowsOf(cs).length===3&&renders===r0+1);
fire(saveBtn);
ok("Save with the new kid still unnamed asks for a name and writes nothing", alerts.some(m=>/Every kid needs a name/.test(m))&&!writes.length&&!reloads);
fire(find(cs,2,"name"),{value:"Kid C"}); fire(find(cs,2,"color"),{value:"#22aa44"});
fire(saveBtn);
const sv=writes.filter(w=>w[0]==="settings/family");
ok("Save Family writes settings/family once", sv.length===1&&writes.length===1);
const out=sv.length?sv[0][1]:[];
ok("the saved roster has all three kids, in order", out.length===3&&out.map(k=>k.id).join()==="kida,kidb,kidc");
ok("the edited kid is saved with the edits", out[0]&&out[0].name==="Kid Ay"&&out[0].color==="#ff0000"&&out[0].emoji==="🐙"&&out[0].grade==="7"&&out[0].schoolAge===false);
ok("the untouched kid is saved exactly as before — notebookTheme, notebookName, a nested future field and all",
  out[1]&&JSON.stringify(out[1])===JSON.stringify(ROSTER0[1]));
ok("the new kid gets an id from the name, the color and its tint", out[2]&&out[2].id==="kidc"&&out[2].name==="Kid C"&&out[2].color==="#22aa44"&&out[2].badge===ctx.famTint("#22aa44")&&!("emoji" in out[2]));
ok("this device's copy matches what was saved, then the app reloads", ls.ha_family===JSON.stringify(out)&&reloads===1);

// Removing a kid saves the rest untouched (saved work stays under the kid's id).
fire(controls().find(c=>c.js==="famRemove(0)")); fire(saveBtn);
const out2=(writes[writes.length-1]||[])[1]||[];
ok("✕ then Save keeps the other kids exactly", out2.length===2&&JSON.stringify(out2[0])===JSON.stringify(ROSTER0[1])&&out2[1].id==="kidc");

console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
