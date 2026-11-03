/* 🎓 SCHOOLPAGES — the School row grows (her plan-2 yes 2026-11-02): Notebooks · Mastery · Units · Curriculum · Settings · 💰 Purchases ·
 * 📜 History · 🌟 Wins, Mastery with its own second row (Mastery · Settings = Mastery HQ). Curriculum, Settings, Purchases, History,
 * Wins and Mastery settings are Mom's Day pages of their own — the Admin hub's page functions under her banner + menu, none of the
 * Schedule's bars. Curriculum shows no "Grid" bar.   run: node test_school_pages.js */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":"")); } };
const fn=name=>{ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); return src.slice(i,src.indexOf("\n}",i)+2); };
const a=src.indexOf("// SCHOOLTAB_START"), b=src.indexOf("// SCHOOLTAB_END"); const block=src.slice(a,b);
ok("SCHOOLPAGES lives inside the SCHOOLTAB block, marked once", a>0&&b>a&&block.indexOf("// SCHOOLPAGES (her plan-2 yes 2026-11-02")>0&&src.split("// SCHOOLPAGES (her plan-2 yes").length===2);
ok("every inline <script> still compiles", (()=>{ const re=/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g; let m,n=0; while((m=re.exec(src))){ n++; try{ new vm.Script(m[1]); }catch(e){ console.log("    script #"+n+": "+e.message); return false; } } return n>0; })());
ok("no family or kid name in the block", !/lincoln|ellis|lucy|julian|howe|dewalt|burris/i.test(block));
const KIT=src.slice(src.indexOf("// KITCHENTAB_START"),src.indexOf("// KITCHENTAB_END"));

function world(o){
  o=o||{}; const ls={}; const log=[]; const drawn={};
  const st={tab:o.tab||"moms-plan", mdFrameTab:null, momSchedView:!!o.msv, schedShowAdmin:false, adminSubTab:"hq", currInnerTab:o.inner||"builder", mpSubView:o.view||null, kid:o.kid||"all"};
  const page=(name)=>(el,top)=>{ drawn[name]=top; el.innerHTML=(top||"")+"<"+name+">"; };
  const env={ SHOP_LIST_NAME:"Shopping List", HA_LS:{getItem:k=>ls[k]||null,setItem:(k,v)=>{ ls[k]=v; }}, ROSTER:["ava","ben"], cap:s=>s.charAt(0).toUpperCase()+s.slice(1),
    pageOn:k=>!(o.off||[]).includes(k), mwBanner:s=>'<div class="md-banner">'+s+'</div>',
    mdFrameOn:()=>false, mdFrameOpen:t=>{ log.push("frame:"+t); st.tab=t; }, msvOpenAdmin:()=>log.push("msvOpenAdmin"),
    mdSmoothCalNow:()=>false, msvEnter:()=>log.push("msvEnter"), showTab:t=>{ log.push("showTab:"+t); st.tab=t; },
    renderCurriculumView:page("curriculum"), renderSettings:page("settings"), renderPurchasesView:page("purchases"), renderMasteryHQ:page("mhq"),
    renderHistory:el=>{ drawn.history=el; el.innerHTML="<history>"; }, renderPace:el=>{ drawn.wins=el; el.innerHTML="<wins>"; },
    window:{scrollTo:()=>{}} };
  const body={innerHTML:""}; const content={innerHTML:""};
  env.document={getElementById:id=>id==="content"?content:(id==="mp-school-body"?body:null)};
  env.renderMomsPlan=el=>{ log.push("renderMomsPlan"); api.renderMPSchool(el); };
  const keys=Object.keys(env);
  const pre="let tab=st.tab, mdFrameTab=st.mdFrameTab, momSchedView=st.momSchedView, schedShowAdmin=st.schedShowAdmin, adminSubTab=st.adminSubTab, currInnerTab=st.currInnerTab, mpSubView=st.mpSubView, kid=st.kid;\n"
    +"const _sync=()=>{ st.currInnerTab=currInnerTab; st.mpSubView=mpSubView; st.tab=tab; };\n";
  const api=new Function("st",...keys,pre+fn("mpSubnav")+"\n"+KIT+"\n"+block+"\n"+fn("mpGoto")
    +"\nreturn {mpSubnav,mpSchoolRow,mpSchoolLast,mpSchoolSub,mpCurrBare,mpAdminRoute:s=>{ const r=mpAdminRoute(s); _sync(); return r; },mpSchoolKidRow,renderMPSchool,mpSchoolOpen:t=>{ mpSchoolOpen(t); _sync(); },mpGoto:v=>{ mpGoto(v); _sync(); }};")(st,...keys.map(k=>env[k]));
  return {api,ls,log,st,drawn,content,body};
}

console.log("── the School row ──");
{ const h=world().api.mpSchoolRow("notebook");
  ok("eight chips in her order: Notebooks · Mastery · Units · Curriculum · Settings · 💰 Purchases · 📜 History · 🌟 Wins", /mpSchoolOpen\('notebook'\)[^>]*>📓 Notebooks<\/button><button onclick="mpSchoolOpen\('mastery'\)[^>]*>🧠 Mastery<\/button><button onclick="mpSchoolOpen\('units'\)[^>]*>📚 Units<\/button><button onclick="mpSchoolOpen\('curriculum'\)[^>]*>📖 Curriculum<\/button><button onclick="mpSchoolOpen\('settings'\)[^>]*>⚙️ Settings<\/button><button onclick="mpSchoolOpen\('purchases'\)[^>]*>💰 Purchases<\/button><button onclick="mpSchoolOpen\('history'\)[^>]*>📜 History<\/button><button onclick="mpSchoolOpen\('wins'\)[^>]*>🌟 Wins<\/button><\/div>$/.test(h));
  ok("no Mastery second row unless Mastery is the page", h.indexOf("mp-mastery-row")<0); }
ok("a family with the Purchases page off has no 💰 chip", world({off:["purchases"]}).api.mpSchoolRow("notebook").indexOf("💰")<0);
["mastery","mhq"].forEach(t=>{ const h=world().api.mpSchoolRow(t);
  ok("on '"+t+"': the Mastery chip is outlined and a second row follows: 🧠 Mastery · ⚙️ Settings", /mpSchoolOpen\('mastery'\)" style="[^"]*border:1.5px solid #2B7A78[^"]*">🧠 Mastery<\/button><button onclick="mpSchoolOpen\('units'\)/.test(h)&&/<\/div><div id="mp-mastery-row" class="mp-sub mp-sub2"><button onclick="mpSchoolOpen\('mastery'\)[^>]*>🧠 Mastery<\/button><button onclick="mpSchoolOpen\('mhq'\)[^>]*>⚙️ Settings<\/button><\/div>$/.test(h));
  ok("…with '"+t+"' the outlined one on that row", new RegExp('id="mp-mastery-row"[\\s\\S]*mpSchoolOpen\\(\''+t+'\'\\)" style="[^"]*border:1.5px solid #2B7A78').test(h)); });
ok("a family with Mastery HQ off: the second row has Mastery alone", !/mpSchoolOpen\('mhq'\)/.test(world({off:["mastery"]}).api.mpSchoolRow("mastery")));
ok("both rows sit inside the sticky menu element (School lit)", (()=>{ const h=world().api.mpSubnav("mhq"); return /color:#fff;background:#2B7A78[^>]*>🎓 School/.test(h)&&/<div id="mp-school-row" class="mp-sub">[\s\S]*<div id="mp-mastery-row" class="mp-sub mp-sub2">[\s\S]*<\/div><\/div>$/.test(h); })());
ok("CSS: the second row is a dashed-topped strip inside #mp-subnav", /#mp-subnav \.mp-sub2\{border-top:1px dashed var\(--border\);padding-top:7px\}/.test(src));

console.log("── opening each page ──");
{ const w=world();
  ok("chip → sub-view: curriculum→curr, settings→sset, purchases→purch, history→hist, wins→wins, mhq→mhq; the framed tabs → none", ["curriculum","settings","purchases","history","wins","mhq"].map(w.api.mpSchoolSub).join()==="curr,sset,purch,hist,wins,mhq"&&w.api.mpSchoolSub("notebook")===null&&w.api.mpSchoolSub("mastery")===null&&w.api.mpSchoolSub("units")===null);
  w.api.mpSchoolOpen("curriculum");
  ok("Curriculum: a Mom's Day page (mpGoto('curr')), landing on the grid, remembered", w.st.mpSubView==="curr"&&w.st.currInnerTab==="grid"&&w.log.indexOf("msvOpenAdmin")<0&&w.ls.ha_mp_school==="curriculum");
  ok("…drawn as banner + menu (School lit, Curriculum outlined) handed to renderCurriculumView as its header — no wrapper, no bars", /^<div class="md-banner">The whole curriculum — grid, subject cards, pacing, rules<\/div><div id="mp-subnav"/.test(w.drawn.curriculum)&&/mpSchoolOpen\('curriculum'\)" style="[^"]*border:1.5px solid #2B7A78/.test(w.drawn.curriculum)&&w.content.innerHTML.endsWith("<curriculum>"));
  ok("…and the grid reports itself bare there", w.api.mpCurrBare()===true);
  w.api.mpSchoolOpen("settings"); ok("Settings → renderSettings under the banner", w.st.mpSubView==="sset"&&/Kids, codes, page switches, family rules/.test(w.drawn.settings));
  w.api.mpSchoolOpen("purchases"); ok("Purchases → renderPurchasesView", w.st.mpSubView==="purch"&&/ESA grant/.test(w.drawn.purchases));
  w.api.mpSchoolOpen("mhq"); ok("Mastery ▸ Settings → renderMasteryHQ", w.st.mpSubView==="mhq"&&/Mastery settings/.test(w.drawn.mhq)&&w.api.mpCurrBare()===false);
  w.api.mpSchoolOpen("history");
  ok("History → an All · each kid row, then renderHistory into its own box under the menu", w.st.mpSubView==="hist"&&w.drawn.history===w.body&&/selKid\('all'\)[^>]*>All<\/button><button onclick="selKid\('ava'\)[^>]*>Ava<\/button><button onclick="selKid\('ben'\)[^>]*>Ben<\/button>/.test(w.content.innerHTML)&&/<div id="mp-school-body"><\/div>$/.test(w.content.innerHTML));
  w.api.mpSchoolOpen("wins"); ok("Wins → renderPace into the box (it draws its own kid chips)", w.st.mpSubView==="wins"&&w.drawn.wins===w.body&&!/selKid\('all'\)/.test(w.content.innerHTML));
  w.api.mpSchoolOpen("mastery"); ok("Mastery / Notebooks / Units still open the tab inside the frame", w.log[w.log.length-1]==="frame:mastery");
  ok("routes: every School sub-view is in SS_OTHER_VIEWS and renderMomsPlanView hands it to renderMPSchool first", (()=>{ const m=src.match(/const SS_OTHER_VIEWS=(\[[^\]]*\])/); const l=m?JSON.parse(m[1]):[]; return ["curr","sset","purch","hist","wins","mhq"].every(v=>l.indexOf(v)>=0)&&/MOMGATE\n  if\(typeof MP_SCHOOL_VIEWS!=="undefined"&&MP_SCHOOL_VIEWS\[mpSubView\]\)\{ return renderMPSchool\(el\); \}/.test(fn("renderMomsPlanView")); })());
}
console.log("── the History kid row ──");
{ const w=world({kid:"mom"}); ok("Mom's pick counts as All (History shows every kid)", /selKid\('all'\)" style="[^"]*background:#2B7A78/.test(w.api.mpSchoolKidRow()));
  const w2=world({kid:"ben"}); ok("a kid's pick is lit", /selKid\('ben'\)" style="[^"]*background:#2B7A78/.test(w2.api.mpSchoolKidRow())&&!/selKid\('all'\)" style="[^"]*background:#2B7A78/.test(w2.api.mpSchoolKidRow())); }

console.log("── the Admin hub's links follow her to the School pages ──");
{ const w=world({view:"sset"});
  ok("on a Mom's Day page: setAdminSub('curriculum') lands on School ▸ Curriculum (mpAdminRoute)", w.api.mpAdminRoute("curriculum")===true&&w.st.mpSubView==="curr");
  ok("…settings / rules / purchases / mastery too (chores / hq / generate since MPGROUPS)", ["settings","rules","purchases","mastery"].every(s=>w.api.mpAdminRoute(s)===true)&&w.api.mpAdminRoute("chores")===true&&w.st.mpSubView==="chores"&&w.api.mpAdminRoute("hq")===true&&w.st.mpSubView==="hq"&&w.api.mpAdminRoute("generate")===true&&w.st.mpSubView==="gen"&&w.api.mpAdminRoute("nope")===false);
  ok("on the Schedule (or inside ▸ Schedule, MSV) it stays out of the way", world({tab:"schedule"}).api.mpAdminRoute("curriculum")===false&&world({msv:true,tab:"schedule"}).api.mpAdminRoute("curriculum")===false);
  ok("setAdminSub asks it first (after the calendar redirect)", /function setAdminSub\(s\)\{ if\(s==="calendar"[^\n]*\n  if\(typeof mpAdminRoute==="function"&&mpAdminRoute\(s\)\) return;/.test(src)); }

console.log("── Curriculum with no Grid bar ──");
{ const cv=fn("renderCurriculumView");
  ok("bare on Mom's Day: the one-chip bar is skipped on the grid, kept as the way back from the Builder", /const _cvBare=\(typeof mpCurrBare==="function"\)&&mpCurrBare\(\);/.test(cv)&&/const _cvBar=!\(_cvBare&&currInnerTab==="grid"\);/.test(cv)&&/if\(_cvBar\)\{\n  h\+='<div style="position:sticky;top:calc\('\+_cvTop\+'\);z-index:89;/.test(cv)&&/  h\+='<\/div>';\n  \}   \/\/ SCHOOLPAGES: _cvBar/.test(cv));
  ok("its stickies sit right under the menu there (no Admin-bar pixels), under the Admin tab row as before on the Schedule", /const _cvTop='var\(--hdr-h\) \+ var\(--nav-h\) \+ var\(--mp-h\)'\+\(_cvBare\?'':' \+ var\(--sub-h\) \+ 38px'\);/.test(cv)&&/top:calc\('\+_cvTop\+\(_cvBar\?' \+ 38px':''\)\+'\);z-index:88/.test(cv));
  ok("the Admin hub still draws it with the bar (nothing changes on the Schedule until slice C)", /else if\(adminSubTab==="curriculum"\)\{ renderCurriculumView\(el,ah\); \}/.test(src)); }

console.log("── the pages' live hooks follow them ──");
ok("History: Trends live update, tab / log view / trend-kid taps repaint the Mom's Day page", /else if\(tab==="moms-plan"&&mpSubView==="hist"&&histTab==="trends"\)\{const el=document\.getElementById\("content"\);if\(el\)renderMomsPlan\(el\);\}/.test(src)&&["setHistTab","setHistLogView","setTrendKid"].every(n=>/if\(el&&tab==="moms-plan"&&mpSubView==="hist"\)\{ renderMomsPlan\(el\); return; \}/.test(fn(n))));
ok("Purchases: the ESA feed and the script's load repaint School ▸ Purchases too", /if\(adminSubTab==="purchases"\|\|\(tab==="moms-plan"&&mpSubView==="purch"\)\) renderAllSoon\(\);/.test(src)&&/s\.onload=\(\)=>\{ if\(adminSubTab==="purchases"\|\|\(typeof mpSubView!=="undefined"&&tab==="moms-plan"&&mpSubView==="purch"\)\) renderAll\(\); \};/.test(src));
ok("Curriculum: the grid's done-cell repaint fires on School ▸ Curriculum", /\(typeof mpCurrBare==="function"&&mpCurrBare\(\)\)\)&&typeof currInnerTab!=="undefined"&&currInnerTab==="grid"\)\{/.test(src));
ok("Settings: the school card's default fold applies on School ▸ Settings", /\(typeof tab!=="undefined"&&tab==="moms-plan"&&typeof mpSubView!=="undefined"&&mpSubView==="sset"\)\)\) rulesOpen\[id\]=false;/.test(src));
ok("Mastery HQ: the update-reload guard knows School ▸ Mastery ▸ Settings", /mpSubView==="mhq"\) return "in Mastery HQ";/.test(src));
ok("no Firebase writes in the block", !/db\.|\.ref\(/.test(block));
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
