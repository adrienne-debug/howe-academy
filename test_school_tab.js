/* 🎓 SCHOOLTAB — one School tab on Mom's Day's menu row with its own sub-row 📓 Notebooks · 🧠 Mastery · 📚 Units · 📖 Curriculum
 * (her ask 2026-11-02: "then a School tab (notebooks, mastery, units, curriculum combined)"; her go "3 go"). The sub-row (Kitchen's
 * too, MPSUBROW) is drawn inside the one sticky menu element so everything below sits under it.   run: node test_school_tab.js */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":"")); } };
const fn=name=>{ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); return src.slice(i,src.indexOf("\n}",i)+2); };
const a=src.indexOf("// SCHOOLTAB_START"), b=src.indexOf("// SCHOOLTAB_END");
ok("SCHOOLTAB block is marked once", a>0&&b>a&&src.split("// SCHOOLTAB_START").length===2);
const block=src.slice(a,b);
ok("the shared sub-row CSS block is marked", src.indexOf("/* MPSUBROW_CSS_START")>0&&src.indexOf("/* MPSUBROW_CSS_END */")>0);
ok("every inline <script> still compiles", (()=>{ const re=/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g; let m,n=0; while((m=re.exec(src))){ n++; try{ new vm.Script(m[1]); }catch(e){ console.log("    script #"+n+": "+e.message); return false; } } return n>0; })());
ok("no family or kid name in the block", !/lincoln|ellis|lucy|julian|howe|dewalt|burris/i.test(block));
const KIT=src.slice(src.indexOf("// KITCHENTAB_START"),src.indexOf("// KITCHENTAB_END"));

// a sliced world: mpSubnav + both sub-row blocks + mpGoto, with a per-device memory, Mom's Day state and spies
function world(o){
  o=o||{}; const ls={}; const log=[];
  const st={tab:o.tab||"moms-plan", mdFrameTab:o.frame||null, momSchedView:!!o.msv, schedShowAdmin:!!o.admin, adminSubTab:o.adminSub||"hq", currInnerTab:"grid", mpSubView:null, mpSchMode:null, _msvWantAdmin:false};
  const env={ SHOP_LIST_NAME:"Shopping List", HA_LS:{getItem:k=>ls[k]||null,setItem:(k,v)=>{ ls[k]=v; }},
    momHere:()=>o.mom!==false,
    mwBanner:s=>'<div class="md-banner">'+s+'</div>',
    mdFrameOn:t=>!!t&&st.tab===t&&st.mdFrameTab===t&&o.mom!==false,
    mdFrameOpen:t=>{ log.push("frame:"+t); st.tab=t; st.mdFrameTab=t; st.momSchedView=false; },
    msvOpenAdmin:()=>{ log.push("msvOpenAdmin"); st._msvWantAdmin=true; st.mpSubView="cal"; st.mpSchMode="today"; st.tab="moms-plan"; },
    mdSmoothCalNow:v=>false, msvEnter:()=>log.push("msvEnter"), showTab:t=>{ log.push("showTab:"+t); st.tab=t; st.mdFrameTab=null; }, renderMomsPlan:()=>log.push("renderMomsPlan"),
    document:{getElementById:()=>({})}, window:{scrollTo:()=>{}} };
  if(o.broken) env.HA_LS={getItem:()=>{ throw new Error("quota"); },setItem:()=>{ throw new Error("quota"); }};
  const keys=Object.keys(env);
  const pre="let tab=st.tab, mdFrameTab=st.mdFrameTab, momSchedView=st.momSchedView, schedShowAdmin=st.schedShowAdmin, adminSubTab=st.adminSubTab, currInnerTab=st.currInnerTab, mpSubView=st.mpSubView;\n"
    +"const _sync=()=>{ st.adminSubTab=adminSubTab; st.currInnerTab=currInnerTab; st.mpSubView=mpSubView; };\n";
  const api=new Function("st",...keys,pre+fn("mpSubnav")+"\n"+KIT+"\n"+block+"\n"+fn("mpGoto")
    +"\nreturn {mpSubnav,mpSchoolRow,mpSchoolLast,mpSchoolOpen:t=>{ mpSchoolOpen(t); _sync(); },mpSchoolFrame,mpGoto:v=>{ mpGoto(v); _sync(); }};")(st,...keys.map(k=>env[k]));
  return {api,ls,log,st};
}

console.log("── the menu row ──");
{ const w=world(); const h=w.api.mpSubnav('plan');
  ok("🎓 School sits between Kitchen and Weigh-In and reopens the last School page", /🍳 Kitchen<\/button><button onclick="mpSchoolOpen\(mpSchoolLast\(\)\)"[^>]*>🎓 School<\/button><button onclick="mpGoto\('weigh'\)/.test(h));
  ok("grey on Home Base, no School sub-row there", /color:#9ca3af;background:transparent[^>]*>🎓 School/.test(h)&&h.indexOf("mp-school-row")<0);
  ok("the sticky element holds the button row (.mp-row) and nothing else when no sub-row is wanted", /^<div id="mp-subnav" style="background:#fff;border-bottom:2px solid #DEF2F1"><div class="mp-row" style="display:flex;flex-wrap:wrap;gap:4px;padding:8px 10px">[\s\S]*<\/button><\/div><\/div>$/.test(h));
}
console.log("── School's own row ──");
["notebook","mastery","units","curriculum"].forEach(t=>{
  const h=world().api.mpSubnav(t);
  ok("on '"+t+"': 🎓 School is lit and the sub-row sits inside the sticky element, after the button row", /color:#fff;background:#2B7A78[^>]*>🎓 School/.test(h)&&/<\/button><\/div><div id="mp-school-row" class="mp-sub">[\s\S]*<\/div><\/div>$/.test(h));
  ok("…📓 Notebooks · 🧠 Mastery · 📚 Units · 📖 Curriculum, '"+t+"' outlined", /mpSchoolOpen\('notebook'\)[^>]*>📓 Notebooks<\/button><button onclick="mpSchoolOpen\('mastery'\)[^>]*>🧠 Mastery<\/button><button onclick="mpSchoolOpen\('units'\)[^>]*>📚 Units<\/button><button onclick="mpSchoolOpen\('curriculum'\)[^>]*>📖 Curriculum<\/button>/.test(h)
    &&new RegExp("mpSchoolOpen\\('"+t+"'\\)\" style=\"[^\"]*border:1.5px solid #2B7A78[^\"]*background:#DEF2F1").test(h)
    &&["notebook","mastery","units","curriculum"].filter(x=>x!==t).every(x=>new RegExp("mpSchoolOpen\\('"+x+"'\\)\" style=\"[^\"]*border:1.5px solid transparent").test(h)));
});
ok("Kitchen's row is inside the sticky element the same way", /<\/button><\/div><div id="mp-kitchen-row" class="mp-sub">[\s\S]*<\/div><\/div>$/.test(world().api.mpSubnav('meals')));
ok("never both rows", (()=>{ const w=world(); return ["plan","cal","house","weigh","meals","grocery","prep","notebook","mastery","units","curriculum"].every(v=>{ const h=w.api.mpSubnav(v); return !(h.indexOf("mp-kitchen-row")>=0&&h.indexOf("mp-school-row")>=0); }); })());
ok("CSS: the sub-row is one thin scrollable strip, not sticky on its own (the menu element is the one sticky, measured bar)", /#mp-subnav \.mp-sub\{display:flex;gap:6px;padding:0 10px 7px;overflow-x:auto;[^}]*scrollbar-width:none\}/.test(src)&&/#mp-subnav \.mp-sub::-webkit-scrollbar\{display:none\}/.test(src)&&!/mp-sub\{[^}]*sticky/.test(src)&&!/#mp-school-row\{|#mp-kitchen-row\{/.test(src));
ok("#mp-subnav stays the sticky, measured element (--mp-h now covers both rows), so every bar below sits under the sub-row", /#mp-subnav\{position:sticky;top:calc\(var\(--hdr-h\) \+ var\(--nav-h\)\);z-index:98\}/.test(src)&&/"mp-subnav":"--mp-h"/.test(src)&&/body\.md-frame \.mast-sticky\{top:calc\(var\(--hdr-h\) \+ var\(--nav-h\) \+ var\(--mp-h\)\)!important\}/.test(src));
ok("the phone strip rules target the button row (.mp-row) on ▸ Schedule and on every section", /#msv-bar #mp-subnav \.mp-row\{flex-wrap:nowrap!important;overflow-x:auto/.test(src)&&/\.md-banner~#mp-subnav \.mp-row\{flex-wrap:nowrap!important;overflow-x:auto/.test(src)&&/#msv-bar #mp-subnav \.mp-row button\{flex:0 0 auto!important/.test(src)&&/\.md-banner~#mp-subnav \.mp-row button\{flex:0 0 auto!important/.test(src)&&!/#mp-subnav\{flex-wrap:nowrap|#mp-subnav button\{/.test(src));

console.log("── opening each School page ──");
{ const w=world();
  ok("first time the School tab opens Notebooks", w.api.mpSchoolLast()==="notebook");
  w.api.mpSchoolOpen("units");
  ok("Units: the Units tab opens inside Mom's Day's frame (mdFrameOpen), remembered on this device", w.log.join()==="frame:units"&&w.ls.ha_mp_school==="units"&&w.api.mpSchoolLast()==="units");
  w.api.mpSchoolOpen("mastery"); ok("Mastery: the same door Kids' Corner's links use", w.log[w.log.length-1]==="frame:mastery"&&w.api.mpSchoolLast()==="mastery");
  w.api.mpSchoolOpen("notebook"); ok("Notebooks: framed too", w.log[w.log.length-1]==="frame:notebook");
  w.api.mpSchoolOpen("curriculum");
  ok("Curriculum: Mom's Day ▸ Schedule ▸ Admin ▸ Curriculum (the grid) through msvOpenAdmin — no frame, no new page", w.log[w.log.length-1]==="msvOpenAdmin"&&w.st.adminSubTab==="curriculum"&&w.st.currInnerTab==="grid"&&w.api.mpSchoolLast()==="curriculum");
  w.api.mpSchoolOpen("dad"); ok("a stray name opens Notebooks", w.log[w.log.length-1]==="frame:notebook"&&w.api.mpSchoolLast()==="notebook");
  w.ls.ha_mp_school="cal"; ok("a stray remembered value falls back to Notebooks", w.api.mpSchoolLast()==="notebook");
  const w2=world({broken:true}); w2.api.mpSchoolOpen("units");
  ok("a full / blocked localStorage never breaks the tap", w2.log.join()==="frame:units"&&w2.api.mpSchoolLast()==="notebook");
  const w3=world(); w3.api.mpGoto("grocery"); w3.api.mpGoto("house");
  ok("mpGoto (Home Base, Kitchen, …) never touches the School memory", w3.ls.ha_mp_school===undefined);
}
console.log("── ▸ Schedule ▸ Admin ▸ Curriculum shows as School ▸ Curriculum ──");
{ const h=world({msv:true,tab:"schedule",admin:true,adminSub:"curriculum"}).api.mpSubnav('cal');
  ok("the bar's mpSubnav('cal') lights School + the School row while the Admin is on Curriculum", /color:#fff;background:#2B7A78[^>]*>🎓 School/.test(h)&&h.indexOf("mp-school-row")>0&&/color:#9ca3af;background:transparent[^>]*>🗓 Schedule/.test(h));
  const h2=world({msv:true,tab:"schedule",admin:true,adminSub:"hq"}).api.mpSubnav('cal');
  ok("…any other Admin page: Schedule lit as before, no School row", /color:#fff;background:#2B7A78[^>]*>🗓 Schedule/.test(h2)&&h2.indexOf("mp-school-row")<0);
  ok("msvBarHTML itself is unchanged (banner, mpSubnav('cal'), Today · Week · Month)", /return ban\+mpSubnav\('cal'\)\+'<div style="display:flex;gap:8px;padding:8px 12px;max-width:520px;margin:0 auto">'\+tb\('today'/.test(fn("msvBarHTML")));
}
console.log("── the framed pages ──");
{ const w=world({tab:"notebook",frame:"notebook"});
  ok("mpSchoolFrame('notebook') = Mom's banner with a summary + the menu row with School lit and the School row", /^<div class="md-banner">Weekly notebooks \u2014 build, print and check<\/div><div id="mp-subnav"/.test(w.api.mpSchoolFrame("notebook"))&&/mp-school-row/.test(w.api.mpSchoolFrame("notebook")));
  ok("…and Units", /^<div class="md-banner">Unit studies \u2014 topic packs for any kid<\/div><div id="mp-subnav"/.test(world({tab:"units",frame:"units"}).api.mpSchoolFrame("units")));
  ok("nothing on the plain tab (not framed) or with the Mom switch off", world({tab:"notebook"}).api.mpSchoolFrame("notebook")===""&&world({tab:"notebook",frame:"notebook",mom:false}).api.mpSchoolFrame("notebook")==="");
  const rn=fn("renderNotebook"), ru=fn("renderUnits");
  ok("renderNotebook draws the frame first on both of its pages (typeof-guarded)", /const _fr=\(typeof mpSchoolFrame==="function"\)\?mpSchoolFrame\("notebook"\):'';/.test(rn)&&/if\(!meta\)\{ con\.innerHTML=_fr\+'/.test(rn)&&/con\.innerHTML=_fr\+\n/.test(rn));
  ok("renderUnits draws it on every one of its pages (detail, Builder, tabs, list)", /const _fr=\(typeof mpSchoolFrame==="function"\)\?mpSchoolFrame\("units"\):'';/.test(ru)&&/con\.innerHTML=_fr\+renderUnitDetail\(/.test(ru)&&/con\.innerHTML=_fr\+_ub;/.test(ru)&&/con\.innerHTML=_fr\+utsPageHTML\(\);/.test(ru)&&/con\.innerHTML=_fr\+h;/.test(ru));
  ok("Mastery keeps its own frame line (KC_PLAY) — it passes 'mastery', which lights School now", /mdFrameOn\("mastery"\)\)\?\(mwBanner\([^)]*\)\+mpSubnav\('mastery'\)\):''/.test(fn("_renderMasteryInner")));
}
console.log("── nothing else moved ──");
ok("mpGoto still starts the same way", /^function mpGoto\(v\)\{ mpSubView=v; if\(typeof mpKitchenNote==="function"\) mpKitchenNote\(v\);/.test(fn("mpGoto")));
ok("no new Mom's Day sub-view was invented (SS_OTHER_VIEWS unchanged in meaning)", !/mpSubView==='school'|mpSubView="school"|mpSubView==='notebook'/.test(src));
ok("the top nav's own Notebook / Mastery / Units tabs are untouched", /<button class="nav-tab" onclick="showTab\('notebook'\)" data-tab="notebook">Notebook<\/button>/.test(src)&&/<button class="nav-tab" onclick="showTab\('units'\)" data-tab="units">Units<\/button>/.test(src));
ok("the blocks write nothing to Firebase", !/db\.|\.ref\(/.test(block)&&!/db\.|\.ref\(/.test(fn("mpSubnav")));
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
