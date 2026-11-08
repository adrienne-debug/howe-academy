/* 🏡🧹❤️ MPGROUPS — Home Base ▸ Today · HQ, Household ▸ Household · ⭐ Chores & Stars, ❤️ Health ▸ ⚖️ Weigh-In (her plan-2 yes
 * 2026-11-02). Chores & Stars, HQ and Generate Week are Mom's Day pages; HQ on Mom's Day is trimmed to what has no chip.
 * run: node test_mp_groups.js */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":"")); } };
const fn=name=>{ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); return src.slice(i,src.indexOf("\n}",i)+2); };
const a=src.indexOf("// MPGROUPS_START"), b=src.indexOf("// MPGROUPS_END"); const block=src.slice(a,b);
ok("MPGROUPS block is marked once", a>0&&b>a&&src.split("// MPGROUPS_START").length===2);
ok("every inline <script> still compiles", (()=>{ const re=/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g; let m,n=0; while((m=re.exec(src))){ n++; try{ new vm.Script(m[1]); }catch(e){ console.log("    script #"+n+": "+e.message); return false; } } return n>0; })());
ok("no family or kid name in the block", !/lincoln|ellis|lucy|julian|howe|dewalt|burris/i.test(block));
const KIT=src.slice(src.indexOf("// KITCHENTAB_START"),src.indexOf("// KITCHENTAB_END")), SCH=src.slice(src.indexOf("// SCHOOLTAB_START"),src.indexOf("// SCHOOLTAB_END"));

function world(o){
  o=o||{}; const log=[]; const drawn={};
  const st={tab:o.tab||"moms-plan", mpSubView:o.view||null, momSchedView:false, schedShowAdmin:false, adminSubTab:"hq"};
  const page=name=>(el,top)=>{ drawn[name]=top; el.innerHTML=(top||"")+"<"+name+">"; };
  const env={ SHOP_LIST_NAME:"Shopping List", HA_LS:{getItem:()=>null,setItem:()=>{}}, pageOn:()=>true, mwBanner:s=>'<div class="md-banner">'+s+'</div>',
    mdFrameOn:()=>false, mdFrameOpen:t=>log.push("frame:"+t), mdSmoothCalNow:()=>false, msvEnter:()=>log.push("msvEnter"), showTab:t=>{ log.push("showTab:"+t); st.tab=t; },
    renderChorePlan:page("chores"), renderAdminGenerate:page("gen"), renderMomHQ:page("hq"), document:{getElementById:()=>({})}, window:{scrollTo:()=>{}} };
  const content={innerHTML:""};
  env.renderMomsPlan=el=>{ log.push("renderMomsPlan"); };
  const keys=Object.keys(env);
  const pre="let tab=st.tab, mpSubView=st.mpSubView, momSchedView=st.momSchedView, schedShowAdmin=st.schedShowAdmin, adminSubTab=st.adminSubTab, currInnerTab='grid', mdFrameTab=null, kid='all';\nconst _sync=()=>{ st.mpSubView=mpSubView; st.tab=tab; };\n";
  const api=new Function("st",...keys,pre+fn("mpSubnav")+"\n"+KIT+"\n"+SCH+"\n"+block+"\n"+fn("mpGoto")
    +"\nreturn {mpSubnav,mpGroupRow,mpHQBare,renderMPGroupPage:el=>{ mpSubView=st.mpSubView; renderMPGroupPage(el); },mpAdminRoute:s=>{ const r=mpAdminRoute(s); _sync(); return r; },mpGoto:v=>{ mpGoto(v); _sync(); }};")(st,...keys.map(k=>env[k]));
  return {api,log,st,drawn,content};
}

console.log("── the top row ──");
{ const h=world().api.mpSubnav("plan");
  ok("Home Base · Schedule · Household · 🍳 Kitchen · 🎓 School · ❤️ Health (Weigh-In is Health now)", /mpGoto\('plan'\)"[^>]*>🏡 Home Base<\/button><button onclick="mpGoto\('cal'\)"[^>]*>🗓 Schedule<\/button><button onclick="mpGoto\('house'\)"[^>]*>🧹 Household<\/button><button onclick="mpGoto\(mpKitchenLast\(\)\)"[^>]*>🍳 Kitchen<\/button><button onclick="mpSchoolOpen\(mpSchoolLast\(\)\)"[^>]*>🎓 School<\/button><button onclick="mpGoto\('weigh'\)"[^>]*>❤️ Health<\/button><\/div>/.test(h)&&h.indexOf("Weigh-In")<0||/mp-home-row/.test(h));
  ok("Home Base lit with its row: 🏡 Today (outlined) · 🗺 HQ", /color:#fff;background:#2B7A78[^>]*>🏡 Home Base/.test(h)&&/<div id="mp-home-row" class="mp-sub"><button onclick="mpGoto\('plan'\)" style="[^"]*border:1.5px solid #2B7A78[^"]*">🏡 Today<\/button><button onclick="mpGoto\('hq'\)" style="[^"]*border:1.5px solid transparent[^"]*">🗺 HQ<\/button><\/div><\/div>$/.test(h)); }
["hq","gen"].forEach(v=>{ const h=world().api.mpSubnav(v); ok("on '"+v+"': Home Base lit, HQ outlined on the row", /color:#fff;background:#2B7A78[^>]*>🏡 Home Base/.test(h)&&/mpGoto\('hq'\)" style="[^"]*border:1.5px solid #2B7A78/.test(h)&&/mpGoto\('plan'\)" style="[^"]*border:1.5px solid transparent[^"]*">🏡 Today/.test(h)); });
{ const h=world().api.mpSubnav("house"); ok("Household lit with its row: 🧹 Household (outlined) · ⭐ Chores & Stars", /color:#fff;background:#2B7A78[^>]*>🧹 Household/.test(h)&&/<div id="mp-house-row" class="mp-sub"><button onclick="mpGoto\('house'\)" style="[^"]*border:1.5px solid #2B7A78[^"]*">🧹 Household<\/button><button onclick="mpGoto\('chores'\)" style="[^"]*border:1.5px solid transparent[^"]*">⭐ Chores &amp; Stars|⭐ Chores & Stars<\/button><\/div><\/div>$/.test(h)); }
{ const h=world().api.mpSubnav("chores"); ok("on Chores & Stars: Household lit, Chores outlined", /color:#fff;background:#2B7A78[^>]*>🧹 Household/.test(h)&&/mpGoto\('chores'\)" style="[^"]*border:1.5px solid #2B7A78/.test(h)); }
{ const h=world().api.mpSubnav("weigh"); ok("Health lit with its row: ⚖️ Weigh-In (outlined, the only one for now)", /color:#fff;background:#2B7A78[^>]*>❤️ Health/.test(h)&&/<div id="mp-health-row" class="mp-sub"><button onclick="mpGoto\('weigh'\)" style="[^"]*border:1.5px solid #2B7A78[^"]*">⚖️ Weigh-In<\/button><\/div><\/div>$/.test(h)); }
ok("the Schedule, Kitchen and School rows are as before (no group row there)", (()=>{ const w=world(); return w.api.mpSubnav("cal").indexOf("mp-home-row")<0&&/mp-kitchen-row/.test(w.api.mpSubnav("meals"))&&!/mp-house-row|mp-home-row/.test(w.api.mpSubnav("meals"))&&/mp-school-row/.test(w.api.mpSubnav("units")); })());
ok("every row sits inside the sticky #mp-subnav (so the stack measures it)", ["plan","hq","house","chores","weigh"].every(v=>/<div id="mp-subnav" [^>]*><div class="mp-row"[\s\S]*<\/div><div id="mp-(home|house|health)-row" class="mp-sub">[\s\S]*<\/div><\/div>$/.test(world().api.mpSubnav(v))));

console.log("── the pages ──");
{ const w=world({view:"chores"}); w.api.renderMPGroupPage(w.content);
  ok("Chores & Stars = renderChorePlan under the banner + menu (Household lit)", /^<div class="md-banner">Lists, Up for Grabs, the store, the log<\/div><div id="mp-subnav"/.test(w.drawn.chores)&&/mp-house-row/.test(w.drawn.chores)&&w.content.innerHTML.endsWith("<chores>"));
  const w2=world({view:"hq"}); w2.api.renderMPGroupPage(w2.content);
  ok("HQ = renderMomHQ under the banner + menu (Home Base lit, HQ outlined), and it knows it is bare there", /^<div class="md-banner">Alerts, Generate Week, links and doors<\/div><div id="mp-subnav"/.test(w2.drawn.hq)&&/mpGoto\('hq'\)" style="[^"]*border:1.5px solid #2B7A78/.test(w2.drawn.hq)&&w2.api.mpHQBare()===true);
  const w3=world({view:"gen"}); w3.api.renderMPGroupPage(w3.content);
  ok("Generate Week = renderAdminGenerate the same way", /The week builds itself on Sunday/.test(w3.drawn.gen)&&w3.api.mpHQBare()===false);
  ok("routes: chores / hq / gen are in SS_OTHER_VIEWS and renderMomsPlanView hands them to renderMPGroupPage after the School pages", (()=>{ const m=src.match(/const SS_OTHER_VIEWS=(\[[^\]]*\])/); const l=m?JSON.parse(m[1]):[]; return ["chores","hq","gen"].every(v=>l.indexOf(v)>=0)&&/return renderMPSchool\(el\); \}[^\n]*\n  if\(typeof MP_GROUP_VIEWS!=="undefined"&&MP_GROUP_VIEWS\[mpSubView\]\)\{ return renderMPGroupPage\(el\); \}/.test(fn("renderMomsPlanView")); })());
  const w4=world({view:"house"}); ok("the Admin hub's chores / hq / generate links land here from a Mom's Day page", w4.api.mpAdminRoute("chores")===true&&w4.st.mpSubView==="chores"&&w4.api.mpAdminRoute("generate")===true&&w4.st.mpSubView==="gen"&&w4.api.mpAdminRoute("hq")===true&&w4.st.mpSubView==="hq"); }

console.log("── HQ trimmed on Mom's Day ──");
{ const hq=fn("renderMomHQ");
  ok("bare: Curriculum, Drills & Mastery, Units, Notebooks rows gone (School has them); Generate Week stays", /_hqB\?"":_hqRow\("grid"/.test(hq)&&/\(!_hqB&&pageOn\("mastery"\)\)\?_hqRowFn/.test(hq)&&/\(!_hqB&&pageOn\("units"\)\)\?_hqRow\("units"/.test(hq)&&/\(!_hqB&&pageOn\("notebook"\)\)\?_hqRow\("notebook"/.test(hq)&&/\n    _hqRow\("generate","🪄","Generate Week"/.test(hq));
  ok("bare: Chores & Stars, Up for Grabs, Click-off Log rows gone (Household has them); Dad's Day and School Room stay", /_hqB\?"":_hqRow\("chorePlan"/.test(hq)&&/_hqB\?"":_hqRow\("grabs"/.test(hq)&&/_hqB\?"":_hqRow\("chores"/.test(hq)&&/\n    _hqRow\("dadsday"/.test(hq)&&/pageOn\("play"\)\?_hqRow\("play"/.test(hq));
  ok("bare: the Stars & Rewards, Family & App and Reports groups gone (School ▸ Wins / Settings / Purchases / History)", /h\+=_hqB\?'':_hqGroup\("⭐","Stars & Rewards"/.test(hq)&&/h\+=_hqB\?'':_hqGroup\("👪","Family & App"/.test(hq)&&/h\+=_hqB\?'':_hqGroup\("📊","Reports"/.test(hq));
  ok("…the alerts on top, Workbooks, Editor in Chief and Screens & Links stay either way", /h\+=wsBannerHTML\(\);/.test(hq)&&/mstAlertsHQHTML\(\)/.test(hq)&&/stPendingHTML/.test(hq)&&/pdPendingHTML/.test(hq)&&/pageOn\("workbooks"\)\?_hqRowFn\("wbPanelOpen\(\)"/.test(hq)&&/pageOn\("eic"\)\?_hqRowFn\("eicPanelOpen\(\)"/.test(hq)&&/h\+=hqLinksCard\(\);/.test(hq));
  ok("on the Schedule's Admin hub (until slice C) the full map still draws", /const _hqB=\(typeof mpHQBare==="function"\)&&mpHQBare\(\);/.test(hq)&&/Every Mom tool, one map\./.test(hq)); }

console.log("── the ← HQ pill ──");
ok("a jump from Mom's Day ▸ HQ remembers where it left from", /function momHQGo\(t\)\{\n  try\{ _hqFromMP=\(typeof mpHQBare==="function"\)&&mpHQBare\(\); \}catch\(e\)\{\}/.test(src));
ok("…and ← HQ comes back to Mom's Day ▸ HQ, not the Schedule's Admin", /function momHQBack\(\)\{\n  if\(typeof _hqFromMP!=="undefined"&&_hqFromMP\)\{ mpSubView="hq"; showTab\("moms-plan"\); return; \}/.test(src));
ok("…and the pill hides while she is on Mom's Day ▸ HQ (home)", /const onHub=\(tab==="schedule"&&schedShowAdmin&&adminSubTab==="hq"\)\|\|\(tab==="moms-plan"&&mpSubView==="hq"\);/.test(src));
ok("no Firebase writes in the block", !/db\.|\.ref\(/.test(block));
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
