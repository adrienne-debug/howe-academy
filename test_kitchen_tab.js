/* 🍳 KITCHENTAB — one Kitchen tab on Mom's Day's menu row in place of Meals · Shopping List · Prep; those three become its own
 * sub-row pinned under the menu row (her ask 2026-11-02: "Menu, Shopping list and Prep need a central title tab with those three
 * as sub-tabs stuck to the top under it"). The pages and their mpSubView names are untouched.   run: node test_kitchen_tab.js */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":"")); } };
const fn=name=>{ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); return src.slice(i,src.indexOf("\n}",i)+2); };
const a=src.indexOf("// KITCHENTAB_START"), b=src.indexOf("// KITCHENTAB_END");
ok("KITCHENTAB block is marked once", a>0&&b>a&&src.split("// KITCHENTAB_START").length===2);
const block=src.slice(a,b);
ok("…and the sub-row CSS block (MPSUBROW, shared with School since 2026-11-02)", src.indexOf("/* MPSUBROW_CSS_START")>0&&src.indexOf("/* MPSUBROW_CSS_END */")>0);
ok("every inline <script> still compiles", (()=>{ const re=/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g; let m,n=0; while((m=re.exec(src))){ n++; try{ new vm.Script(m[1]); }catch(e){ console.log("    script #"+n+": "+e.message); return false; } } return n>0; })());
ok("no family or kid name in the block", !/lincoln|ellis|lucy|julian|howe|dewalt|burris/i.test(block));

// a sliced world: mpSubnav + the KITCHENTAB block + mpGoto, with a per-device memory and spies
function world(o){
  o=o||{}; const ls={}; const log=[];
  const env={ SHOP_LIST_NAME:"Shopping List", HA_LS:{getItem:k=>ls[k]||null,setItem:(k,v)=>{ ls[k]=v; }},
    mdSmoothCalNow:v=>false, msvEnter:()=>log.push("msvEnter"), showTab:t=>log.push("showTab:"+t), renderMomsPlan:()=>log.push("renderMomsPlan"),
    document:{getElementById:()=>({})}, window:{scrollTo:()=>{}} };
  if(o.broken) env.HA_LS={getItem:()=>{ throw new Error("quota"); },setItem:()=>{ throw new Error("quota"); }};
  const keys=Object.keys(env);
  const api=new Function(...keys,"let mpSubView=null, momSchedView=false, tab='moms-plan';\n"+fn("mpSubnav")+"\n"+block+"\n"+fn("mpGoto")+"\nreturn {mpSubnav,mpKitchenRow,mpKitchenLast,mpGoto,sub:()=>mpSubView};")(...keys.map(k=>env[k]));
  return {api,ls,log};
}

console.log("── the menu row ──");
{ const w=world(); const h=w.api.mpSubnav('plan');
  ok("six tabs: Home Base · Schedule · Household · 🍳 Kitchen · 🎓 School · ❤️ Health", /mpGoto\('plan'\)[^>]*>🏡 Home Base<\/button><button onclick="mpGoto\('cal'\)[^>]*>🗓 Schedule<\/button><button onclick="mpGoto\('house'\)[^>]*>🧹 Household<\/button><button onclick="mpGoto\(mpKitchenLast\(\)\)"[^>]*>🍳 Kitchen<\/button><button onclick="mpSchoolOpen\(mpSchoolLast\(\)\)"[^>]*>🎓 School<\/button><button onclick="mpGoto\('weigh'\)[^>]*>❤️ Health<\/button>/.test(h));
  ok("Meals / Shopping List / Prep are no longer on the menu row", !/mpGoto\('meals'\)|mpGoto\('grocery'\)|mpGoto\('prep'\)/.test(h));
  ok("no Kitchen sub-row on Home Base", h.indexOf("mp-kitchen-row")<0);
  ok("Kitchen is grey there (not the lit tab)", /🍳 Kitchen/.test(h)&&/color:#9ca3af;background:transparent[^>]*>🍳 Kitchen/.test(h));
  ok("the row keeps its id and wrap rule (STICKYSTACK / PHONEWIDTH; MPSUBROW: the buttons in .mp-row inside it)", /<div id="mp-subnav" style="background:#fff;border-bottom:2px solid #DEF2F1"><div class="mp-row" style="display:flex;flex-wrap:wrap;gap:4px;padding:8px 10px">/.test(h));
}
ok("▸ Schedule's bar (active 'cal') draws no Kitchen row either", world().api.mpSubnav('cal').indexOf("mp-kitchen-row")<0);

console.log("── Kitchen's own row ──");
["meals","grocery","prep"].forEach(v=>{
  const h=world().api.mpSubnav(v);
  ok("on '"+v+"': 🍳 Kitchen is lit and the sub-row follows the menu row inside the sticky element", /color:#fff;background:#2B7A78[^>]*>🍳 Kitchen/.test(h)&&/<\/div><div id="mp-kitchen-row" class="mp-sub">[\s\S]*<\/div><\/div>$/.test(h));
  ok("…with 🍽 Menu · 🛒 Shopping List · 🧃 Prep, '"+v+"' outlined", new RegExp('mpGoto\\(\'meals\'\\)[^>]*>🍽 Menu</button><button onclick="mpGoto\\(\'grocery\'\\)[^>]*>🛒 Shopping List</button><button onclick="mpGoto\\(\'prep\'\\)[^>]*>🧃 Prep</button>').test(h)
    && new RegExp('mpGoto\\(\''+v+'\'\\)" style="[^"]*border:1.5px solid #2B7A78[^"]*background:#DEF2F1').test(h)
    && ["meals","grocery","prep"].filter(x=>x!==v).every(x=>new RegExp('mpGoto\\(\''+x+'\'\\)" style="[^"]*border:1.5px solid transparent').test(h)));
});
ok("the sub-row sticks with the menu row: it is drawn inside #mp-subnav (the one sticky, measured element), no pixel number anywhere", /#mp-subnav\{position:sticky;top:calc\(var\(--hdr-h\) \+ var\(--nav-h\)\);z-index:98\}/.test(src)&&!/#mp-kitchen-row\{/.test(src));
ok("…one thin scrollable strip on a phone (no wrap)", /#mp-subnav \.mp-sub\{[^}]*overflow-x:auto;[^}]*scrollbar-width:none\}/.test(src)&&/#mp-subnav \.mp-sub::-webkit-scrollbar\{display:none\}/.test(src));
ok("under the menu row in the stack (z 98 → 97)", /#mp-subnav\{position:sticky;top:calc\(var\(--hdr-h\) \+ var\(--nav-h\)\);z-index:98\}/.test(src));

console.log("── which page the Kitchen tab opens ──");
{ const w=world();
  ok("first time: the Menu", w.api.mpKitchenLast()==="meals");
  w.api.mpGoto("grocery");
  ok("opening the Shopping List is remembered on this device (HA_LS, family-prefixed)", w.ls.ha_mp_kitchen==="grocery"&&w.api.mpKitchenLast()==="grocery"&&w.api.sub()==="grocery");
  w.api.mpGoto("prep"); ok("…then Prep", w.api.mpKitchenLast()==="prep");
  w.api.mpGoto("house"); ok("Household / Home Base / Schedule don't touch it", w.api.mpKitchenLast()==="prep"&&w.api.sub()==="house");
  w.api.mpGoto(w.api.mpKitchenLast()); ok("the 🍳 Kitchen tab (mpGoto(mpKitchenLast())) reopens the last one", w.api.sub()==="prep"&&w.log[w.log.length-1]==="renderMomsPlan");
  w.ls.ha_mp_kitchen="dad"; ok("a stray value falls back to the Menu", w.api.mpKitchenLast()==="meals");
  const w2=world({broken:true}); w2.api.mpGoto("grocery");
  ok("a full / blocked localStorage never breaks the tap (Menu by default)", w2.api.sub()==="grocery"&&w2.api.mpKitchenLast()==="meals");
}
ok("mpGoto still starts the same way (the chores pointer and MDSMOOTH tests read it) and notes the page under a typeof guard", /^function mpGoto\(v\)\{ mpSubView=v; if\(typeof mpKitchenNote==="function"\) mpKitchenNote\(v\);/.test(fn("mpGoto"))&&/if\(mdSmoothCalNow\(v\)\)\{ msvEnter\(\);/.test(fn("mpGoto")));

console.log("── nothing else moved ──");
ok("the three pages still route on their old names (renderMomsPlanView unchanged)", /if\(mpSubView==='prep'\)\{ return renderMPPrep\(el\); \}/.test(fn("renderMomsPlanView"))&&/if\(mpSubView==='grocery'\)\{ return renderGrocery\(el\); \}/.test(fn("renderMomsPlanView"))&&/if\(mpSubView==='meals'\)\{ return renderKitchen\(el\); \}/.test(fn("renderMomsPlanView")));
ok("…and each page still draws the shared menu row with its own name", /mpSubnav\('meals'\)/.test(fn("renderKitchen"))&&/mpSubnav\('grocery'\)/.test(fn("renderGrocery"))&&/mpSubnav\('prep'\)/.test(fn("renderMPPrep")));
ok("SS_OTHER_VIEWS still lists the three (no new sub-view name was invented)", (()=>{ const m=src.match(/const SS_OTHER_VIEWS=(\[[^\]]*\])/); const l=m?JSON.parse(m[1]):[]; return ["prep","grocery","meals"].every(v=>l.indexOf(v)>=0)&&l.indexOf("kitchen")<0; })()&&!/mpSubView==='kitchen'|mpSubView="kitchen"/.test(src));
ok("Dad's Day rows and his way to the list are untouched", /mpSubView=\\'dadall\\'/.test(src)&&/if\(grFromDad&&\(mpSubView==='grocery'\|\|mpSubView==='meals'\)\) return true;/.test(fn("momGateOpen")));
ok("the block writes nothing to Firebase", !/db\.|\.ref\(/.test(block)&&!/db\.|\.ref\(/.test(fn("mpSubnav")));

console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
