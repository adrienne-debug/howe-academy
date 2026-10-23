/*
 * Node tests — STICKYSTACK (her fix list 2026-10-22, #6): Mom's Day & Dad's Day — sticky stack, jump row, reorderable sections.
 *   N1 the Mom's Day sub-menu (#mp-subnav) sticks under the navy bars, in the NAVSTACK stack with its own --mp-h;
 *   N2 inside Mom's Day ▸ Schedule the Schedule's rows stick under it (every top a calc of the variables, no pixel numbers);
 *   N4 Mom's Day ▸ Today draws a jump row — one pill per section that is on the page, in the saved order, ↑ Top;
 *   N5 the sections drag into a saved order at settings/momDayOrder (targeted set / remove), default = today's order;
 *   N6 the row is on Mom's Day ▸ Today and Dad's Day ▸ Today only — navBarsApply's one rule, replayed for the other pages;
 *   N7 Dad's Day does all of it the same way (settings/dadDayOrder).
 *   run:  node test_sticky_stack.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,400)+")":"")); } };
const fn=name=>{ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); let d=0; for(let k=src.indexOf("{",i);k<src.length;k++){ if(src[k]==="{") d++; else if(src[k]==="}"&&--d===0) return src.slice(i,k+1); } throw new Error("unbalanced "+name); };
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("missing "+a); return src.slice(i,j); };
const BLOCK=cut("// STICKYSTACK_START","// STICKYSTACK_END"), CSS=cut("/* STICKYSTACK_CSS_START","/* STICKYSTACK_CSS_END */");
const NAVBARS=cut("// NAVBARS_START","// NAVBARS_END"), NAVSTACK=cut("// NAVSTACK_START","// NAVSTACK_END");
const rule=sel=>{ const m=src.match(new RegExp("\\n"+sel.replace(/[#.]/g,"\\$&")+"\\{([^}]*)\\}")); return m?m[1]:""; };

console.log("1. The stack: measured variables, never a pixel number");
{
  ok("the new bars are in NAV_STACK_IDS with their own variables", /"mp-subnav":"--mp-h"/.test(NAVSTACK)&&/"mp-jump":"--jump-h"/.test(NAVSTACK));
  ok("…with fallbacks of 0 (absent = no height)", /:root\{--mp-h:0px;--jump-h:0px\}/.test(CSS));
  ok("the sub-menu sticks under header + nav", /position:sticky;top:calc\(var\(--hdr-h\) \+ var\(--nav-h\)\);z-index:98/.test(rule("#mp-subnav")));
  ok("the jump row sticks under header + nav + sub-menu", /position:sticky;top:calc\(var\(--hdr-h\) \+ var\(--nav-h\) \+ var\(--mp-h\)\);/.test(rule("#mp-jump")));
  ok("the Schedule's rows sit one sub-menu lower: sub-tabs, day row, kid row, Admin tabs all carry var(--mp-h)",
    /var\(--nav-h\) \+ var\(--mp-h\)\);z-index:98/.test(rule("#sched-subtabs"))&&/var\(--nav-h\) \+ var\(--mp-h\) \+ var\(--sub-h\)\);z-index:97/.test(rule("#day-tabs"))
    &&/var\(--mp-h\) \+ var\(--sub-h\) \+ var\(--day-h\)\);z-index:96/.test(rule("#kid-filter"))&&/var\(--nav-h\) \+ var\(--mp-h\) \+ var\(--sub-h\)\);z-index:90/.test(src));
  const tops=(CSS.match(/position:sticky;top:[^;}]*/g)||[]).map(t=>t.slice(16));
  ok("every sticky top in the block is a calc of the variables — no typed pixel top", tops.length>=2&&tops.every(t=>/^top:(calc\(var\(--[a-z-]+\)( \+ var\(--[a-z-]+\))*\)|var\(--[a-z-]+\))$/.test(t)), tops);
  ok("…and no pixel top anywhere in STICKYSTACK's JS either", !/top:\d+px/.test(BLOCK));
  ok("the phone rule: with the Schedule's rows pinned under it (#msv-bar), the sub-menu collapses to one thin scrollable strip", /@media \(max-width:480px\)\{[\s\S]*#msv-bar #mp-subnav\{flex-wrap:nowrap!important;overflow-x:auto/.test(CSS)&&/#msv-bar #mp-subnav button\{flex:0 0 auto!important;padding:4px 7px!important;font-size:11px!important\}/.test(CSS));
  ok("#msv-bar is display:contents when shown, so the sub-menu inside sticks against the page (not that short box)", /mb\.style\.display=on\?"contents":"none"/.test(fn("renderSchedSubtabs")));
  ok("mpSubnav carries the id; Dad's Day, his Calendar and ▸ All top rows carry it too", /<div id="mp-subnav" style="display:flex;flex-wrap:wrap/.test(fn("mpSubnav"))&&/id="mp-subnav"/.test(fn("renderDadsDay"))&&/id="mp-subnav"/.test(fn("renderDadCalendar"))&&/id="mp-subnav"/.test(fn("renderDadAll")));
  ok("navStackSync stays the one measurer: it also (re)observes a bar the page just drew (navStackWatch), and the paint re-measures after the page body", /navStackWatch\(id,el\)/.test(NAVSTACK)&&/function navStackWatch/.test(BLOCK)&&/_navStackRO=ro/.test(NAVSTACK)&&/requestAnimationFrame\(navStackSync\); \}catch\(e\)\{\}   \/\/ STICKYSTACK/.test(fn("_renderAllInner")));
  // navStackSync with the new ids: the sub-menu measured, the jump row absent = 0
  const set={}, seen=[]; const hs={"app-header":63,"nav-tabs":34,"mp-subnav":46,"sched-subtabs":28,"day-tabs":58};
  const env={document:{documentElement:{style:{setProperty:(k,v)=>{ set[k]=v; }}},getElementById:id=>(id in hs?{offsetHeight:hs[id],id}:null)},navStackWatch:(id,el)=>seen.push(id+":"+(el?el.offsetHeight:0))};
  new Function(...Object.keys(env),NAVSTACK.replace(/\(function navStackWire\(\)\{[\s\S]*?\}\)\(\);/,"")+"\nreturn navStackSync;")(...Object.values(env))();
  ok("navStackSync measures the sub-menu into --mp-h and an absent jump row as 0px", set["--mp-h"]==="46px"&&set["--jump-h"]==="0px"&&set["--hdr-h"]==="63px", set);
  ok("…and hands every bar to navStackWatch", seen.indexOf("mp-subnav:46")>=0&&seen.indexOf("mp-jump:0")>=0, seen);
}

// a world: the STICKYSTACK block + the NAVBARS rule, a fake page
function mk(o){
  o=o||{}; const writes=[], ls={}, listeners={}, renders=[], scrolls=[];
  const ctx={console,Object,Array,String,Number,parseInt,parseFloat,Math,JSON,Date,RegExp,setInterval:()=>1,clearInterval:()=>{},requestAnimationFrame:f=>{},
    HA_LS:{getItem:k=>ls[k]||null,setItem:(k,v)=>{ ls[k]=v; }}, _mdwCan:who=>who==="dad"?!!(o.mom||o.dadLink||o.dadOpen):!!o.mom, _mdwWrite:()=>!o.dry,
    db:{ref:p=>({set:v=>writes.push(["set",p,JSON.parse(JSON.stringify(v))]),remove:()=>writes.push(["rm",p])})},
    renderMomsPlan:()=>renders.push(1), getComputedStyle:()=>({getPropertyValue:v=>({"--hdr-h":"63px","--nav-h":"34px","--mp-h":"46px","--jump-h":"30px"})[v]||"0px"}),
    window:{pageYOffset:o.scrollY||0,innerHeight:600,scrollTo:(a,b)=>scrolls.push(typeof a==="object"?a.top:b),scrollBy:()=>{}},
    document:{documentElement:{style:{scrollBehavior:""}},getElementById:id=>o.els&&o.els[id]||(id==='content'?{}:null),createElement:()=>({style:{},parentNode:null,line:true,className:""}),addEventListener:(t,f)=>{ listeners[t]=f; },removeEventListener:t=>{ delete listeners[t]; }},
    tab:o.tab||"moms-plan", momSchedView:!!o.msv, mpSubView:"mpSubView" in o?o.mpSubView:"plan", schedShowHistory:false, schedShowPace:false, schedShowAdmin:false, schedShowBoard:false,
    writes, ls, listeners, renders, scrolls};
  vm.createContext(ctx); vm.runInContext(NAVBARS+"\n"+BLOCK,ctx);
  ctx.get=e=>vm.runInContext(e,ctx);
  if(o.saved) Object.keys(o.saved).forEach(w=>vm.runInContext("ssOrderOnValue("+JSON.stringify(w)+","+JSON.stringify(o.saved[w])+")",ctx));
  return ctx;
}
// a Mom's Day-shaped page: the markers the page writes, some sections empty today
const PAGE=who=>'<div>banner<sub/>'+"<!--ss:jump:-->"+'<div class="col">'
  +"<!--ss:now:🔴 Now-->NOW<!--ss:clean:🧽 Cleaning--><!--ss:myday:🏡 My day-->MYDAY<!--ss:check:📝 To check-->   \n<!--ss:kids:🧒 Kids-->KIDS<!--ss:myday:-->POP<!--ss:bills:💳 Bills-->BILLS"
  +"<!--ss:end:-->"+'</div></div>';
const pills=h=>(h.match(/ssJumpTo\('([a-z]+)'\)/g)||[]).map(s=>s.match(/'([a-z]+)'/)[1]);
const boxes=h=>(h.match(/data-ss="([a-z]+)"/g)||[]).map(s=>s.match(/"([a-z]+)"/)[1]);

console.log("\n2. The jump row: one pill per section that is on the page, in the page's own order by default");
{
  const c=mk({mom:true}); const h=c.get("ssLayout('mom',"+JSON.stringify(PAGE("mom"))+")");
  ok("the jump row lands where the page put its jump marker — right after the sub-menu, before the column", /<sub\/><div id="mp-jump" class="ss-jump" style="display:flex">[\s\S]*<\/div><div class="col">/.test(h));
  ok("pills for the sections that drew something — Now, My day, Kids, Bills — in today's order; Cleaning and To check (empty) have none", JSON.stringify(pills(h))==='["now","myday","kids","bills"]', pills(h));
  ok("the same sections get their boxes, in the same order; nothing drawn is lost (the ✎ pop-up rides with My day)", JSON.stringify(boxes(h))==='["now","myday","kids","bills"]'&&/data-ss="myday" id="ss-myday">[^<]*<span class="ss-grip"[^>]*>⋮⋮<\/span>MYDAYPOP<\/div>/.test(h), boxes(h));
  ok("each pill scrolls to its section; ↑ Top is last; no markers survive into the page", /<button class="ss-jb" onclick="ssJumpTo\('now'\)">🔴 Now<\/button>/.test(h)&&/<button class="ss-jb ss-top" onclick="ssTop\(\)"[^>]*>↑ Top<\/button><\/div>/.test(h)&&h.indexOf("<!--ss:")<0);
  ok("default order = today's — no ↺ Reset pill, ssIsDefault true", h.indexOf("ssReset(")<0&&c.get("ssIsDefault('mom')")===true&&JSON.stringify(c.get("_ssIds.mom"))==='["now","clean","myday","check","kids","bills"]');
  ok("Mom's page: a ⋮⋮ grip on every box for her (momHere); none for a visitor", (h.match(/class="ss-grip"/g)||[]).length===4&&(mk({}).get("ssLayout('mom',"+JSON.stringify(PAGE("mom"))+")").match(/class="ss-grip"/g)||[]).length===0);
  ok("a page without the markers comes back untouched", c.get("ssLayout('mom','<div>plain</div>')")==="<div>plain</div>");
  // the scroll: lands under the pinned bars
  const d=mk({mom:true,els:{"ss-kids":{getBoundingClientRect:()=>({top:900,height:100})}},scrollY:200}); d.get("ssJumpTo('kids')"); d.get("ssTop()");
  ok("tap a pill: smooth-scroll so the section sits just under header + nav + sub-menu + jump row; ↑ Top goes to 0", JSON.stringify(d.scrolls)==="[921,0]", d.scrolls);
}

console.log("\n3. The saved order (settings/momDayOrder): pills and boxes follow it; a section it doesn't know comes after");
{
  const c=mk({mom:true,saved:{mom:["bills","kids","bogus","now"]}}); const h=c.get("ssLayout('mom',"+JSON.stringify(PAGE("mom"))+")");
  ok("pills in the saved order, the unknown id ignored, the ones the saved order forgot (My day) after", JSON.stringify(pills(h))==='["bills","kids","now","myday"]'&&JSON.stringify(boxes(h))==='["bills","kids","now","myday"]', pills(h));
  ok("…and a ↺ Reset pill shows, for the person who may reorder", /ssReset\('mom'\)/.test(h)&&!/ssReset/.test(mk({saved:{mom:["bills","now"]}}).get("ssLayout('mom',"+JSON.stringify(PAGE("mom"))+")")));
  const f=mk({mom:true,saved:{mom:{"0":"kids","2":"now"}}}); f.get("ssLayout('mom',"+JSON.stringify(PAGE("mom"))+")");
  ok("Firebase's object-shaped array is normalized", JSON.stringify(f.get("ssOrder('mom',_ssIds.mom)"))==='["kids","now","clean","myday","check","bills"]');
  ok("a value that didn't change reports no change (no repaint from the listener echo)", f.get("ssOrderOnValue('mom',['kids','now'])")===false&&f.get("ssOrderOnValue('mom',['now','kids'])")===true);
  ok("the listener: settings/momDayOrder and settings/dadDayOrder, repaint Mom's Day only when the value changed", /\["mom","dad"\]\.forEach\(w=>db\.ref\("settings\/"\+w\+"DayOrder"\)\.on\("value",s=>\{ if\(typeof ssOrderOnValue==="function"&&ssOrderOnValue\(w,s\.val\(\)\)&&tab==="moms-plan"\)/.test(src));
}

console.log("\n4. A drag = one targeted write for that person; ↺ Reset removes it; dry-run inert; whose hands");
{
  const c=mk({mom:true}); c.get("ssLayout('mom',"+JSON.stringify(PAGE("mom"))+")");
  const r=c.get("ssMove('mom','bills','myday')");
  ok("Mom drops Bills above My day → the whole order (hidden sections keep their places), one set at settings/momDayOrder", JSON.stringify(r)==='["now","clean","bills","myday","check","kids"]'&&c.writes.length===1&&c.writes[0][0]==="set"&&c.writes[0][1]==="settings/momDayOrder"&&JSON.stringify(c.writes[0][2])===JSON.stringify(r), c.writes);
  ok("…kept on this device too (ha_day_order)", JSON.parse(c.ls.ha_day_order).mom[2]==="bills");
  ok("dropped at the bottom → last", JSON.stringify(c.get("ssMove('mom','now',null)"))==='["clean","bills","myday","check","kids","now"]');
  c.writes.length=0; c.get("ssReset('mom')");
  ok("↺ Reset: her entry removed, back to today's order, the page repaints", c.writes.length===1&&c.writes[0][0]==="rm"&&c.writes[0][1]==="settings/momDayOrder"&&c.get("ssIsDefault('mom')")===true&&c.renders.length===1);
  const d=mk({mom:true,dry:true}); d.get("ssLayout('mom',"+JSON.stringify(PAGE("mom"))+")"); d.get("ssMove('mom','bills','now')");
  ok("?dryrun=1: the order changes on screen, nothing is written", d.writes.length===0&&!d.get("ssIsDefault('mom')"));
  const v=mk({}); v.get("ssLayout('mom',"+JSON.stringify(PAGE("mom"))+")");
  ok("not Mom: no move, no reset, no write", v.get("ssMove('mom','bills','now')")===null&&v.get("ssReset('mom')")===false&&v.writes.length===0);
  ok("Dad's order: from his link, his unlocked Day, or by Mom — not a visitor", mk({dadLink:true}).get("_ssCan('dad')")&&mk({dadOpen:true}).get("_ssCan('dad')")&&mk({mom:true}).get("_ssCan('dad')")&&!mk({}).get("_ssCan('dad')")&&!mk({dadLink:true}).get("_ssCan('mom')"));
  // the pointer drag itself, on a fake column
  const col={kids:[]}; const mkBox=(id,i)=>({id,style:{},getAttribute:()=>id,getBoundingClientRect:()=>({top:i*200,height:180})});
  col.kids=["now","myday","kids","bills"].map(mkBox); col.kids.forEach(k=>k.parentNode=col);
  col.querySelectorAll=sel=>sel==='[data-ss]'?col.kids.filter(k=>!k.line):[]; col.insertBefore=(n,b)=>{ n.parentNode=col; col.kids.splice(col.kids.indexOf(b),0,n); }; col.appendChild=n=>{ n.parentNode=col; col.kids.push(n); }; col.removeChild=n=>{ n.parentNode=null; col.kids=col.kids.filter(x=>x!==n); };
  const g=mk({mom:true}); g.get("ssLayout('mom',"+JSON.stringify(PAGE("mom"))+")"); g.box=col.kids[3];
  g.get("ssDown({target:{closest:()=>box,setPointerCapture(){}},clientY:650,preventDefault(){}},'bills','mom')".replace("box","this.box"));
  ok("hold the grip: the box fades, the page listens for the finger", g.box.style.opacity===".45"&&typeof g.listeners.pointermove==="function"&&typeof g.listeners.pointerup==="function");
  g.listeners.pointermove({clientY:450});
  const line=col.kids.find(k=>k.line);
  ok("drag up: a landing line shows above Kids (the finger is above Kids' middle)", line&&col.kids.indexOf(line)===2, col.kids.map(k=>k.id||"line"));
  g.listeners.pointermove({clientY:250}); ok("…and moves above My day as the finger goes on up", col.kids.indexOf(line)===1, col.kids.map(k=>k.id||"line"));
  g.listeners.pointermove({clientY:450});
  g.listeners.pointerup({clientY:450});
  ok("let go: Bills goes above Kids, one write, the box un-fades, the line is gone, the page repaints", g.writes.length===1&&JSON.stringify(g.writes[0][2])==='["now","clean","myday","check","bills","kids"]'&&g.box.style.opacity===""&&!col.kids.some(k=>k.line)&&g.renders.length===1, g.writes);
}

console.log("\n5. Only on Mom's Day ▸ Today and Dad's Day ▸ Today — navBarsApply's one rule, replayed");
{
  const show=o=>{ const els={"mp-jump":{style:{display:"flex"}},"day-tabs":{style:{}},"kid-filter":{style:{}},"sched-subtabs":{style:{}}}; const c=mk(Object.assign({els},o)); c.get("navBarsApply()"); return els["mp-jump"].style.display; };
  ok("Mom's Day ▸ Today (Home Base): shown", show({mpSubView:"plan"})==="flex"&&show({mpSubView:null})==="flex");
  ok("Dad's Day ▸ Today: shown", show({mpSubView:"dad"})==="flex");
  ok("Mom's Day ▸ Schedule (the Schedule page in the Mom view): gone", show({tab:"schedule",msv:true,mpSubView:"cal"})==="none"&&show({mpSubView:"cal"})==="none");
  ok("Mom's Day ▸ Household, Meals, Grocery, Prep, Weigh-In, Dad's Calendar, ▸ All: gone", ["house","meals","grocery","prep","weigh","dadcal","dadall"].every(v=>show({mpSubView:v})==="none"));
  ok("Kids' Corner, the Schedule, every other tab: gone", ["kids","schedule","notebook","mastery","units","play","babysitter"].every(t=>show({tab:t})==="none"));
  ok("the rule lives in navBarsShow (one line) and names no page itself", /"mp-jump": typeof ssJumpOn==="function"&&ssJumpOn\(\)/.test(NAVBARS)&&!/mpSubView/.test(NAVBARS));
  ok("the row's own render asks the same rule, so a paint that lands elsewhere never shows it", /navBarsShow\(\)\["mp-jump"\]/.test(fn("ssJumpHTML")));
  // the update reload's come-back: haCvReturnRestore sets tab= and the paint decides — landing on Mom's Day shows it, landing on the Schedule hides it
  const land=t=>{ const store={ha_cv_return:JSON.stringify({at:Date.now(),tab:t,kid:"all"})}; const els={"mp-jump":{style:{display:t==="schedule"?"flex":"none"}},"day-tabs":{style:{}},"kid-filter":{style:{}},"sched-subtabs":{style:{}}};
    const vars={tab:"kids",kid:"all",masteryKid:null,mastView:null,mastSlideIdx:0,schedShowAdmin:false,adminSubTab:"hq",mhqKid:null,mhqView:null,mhqDeck:null,schedShowHistory:false,schedShowPace:false,schedShowBoard:false,momSchedView:false,mpSubView:"plan"};
    const env={sessionStorage:{getItem:k=>store[k]||null,removeItem:k=>{ delete store[k]; }},_kiosk:()=>false,_kioskR:()=>false,_kioskD:()=>false,_kioskK:()=>false,document:{getElementById:id=>els[id]||null}};
    new Function(...Object.keys(env),...Object.keys(vars),fn("haCvReturnRestore")+"\n"+NAVBARS+"\n"+fn("ssJumpOn")+"\nconst SS_OTHER_VIEWS="+JSON.stringify(["prep","house","weigh","grocery","meals","cal","dadcal","dadall"])+";\nhaCvReturnRestore(); navBarsApply();")(...Object.values(env),...Object.values(vars));
    return els["mp-jump"].style.display; };
  ok("update-reload landing on Mom's Day ▸ Today: back; landing on the Schedule: gone", land("moms-plan")==="flex"&&land("schedule")==="none");
  ok("SS_OTHER_VIEWS names every non-Today route of renderMomsPlanView", (()=>{ const v=fn("renderMomsPlanView"), routes=(v.match(/mpSubView==='([a-z]+)'\)\{ return render/g)||[]).map(s=>s.match(/'([a-z]+)'/)[1]).filter(r=>r!=="dad"); return routes.length>=7&&routes.every(r=>BLOCK.indexOf('"'+r+'"')>=0)&&BLOCK.indexOf('"cal"')>=0; })());
}

console.log("\n6. Mom's Day ▸ Today writes the markers; Dad's Day mirrors");
{
  const md=fn("renderMomsDay"), dd=fn("renderDadsDay");
  const ids=f=>(f.match(/_ss\('([a-z]+)'(?:,'[^']*')?\)/g)||[]).map(s=>s.match(/'([a-z]+)'/)[1]);
  ok("Mom: jump right after the sub-menu, then the column, then the sections, end before the close, ssLayout('mom') before innerHTML", /h\+=mpSubnav\('plan'\);\n  h\+=_ss\('jump'\);[^\n]*\n  h\+='<div style="padding:12px 12px 0;display:flex;flex-direction:column;gap:11px">';\n  h\+=_ss\('headsup'/.test(md)&&/h\+=_ss\('end'\);[^\n]*\n  h\+='<\/div><\/div>';\n  h=\(typeof ssLayout==="function"\)\?ssLayout\("mom",h\):h;/.test(md));
  ok("Mom's sections, in today's order", JSON.stringify(ids(md))===JSON.stringify(["jump","headsup","now","clean","myday","roadmap","order","kids","checklog","together","weigh","win","dinner","banks","bills","next","end"]), ids(md));
  ok("Dad: jump under his row, one column, his sections, end, ssLayout('dad')", /h\+=_ss\('jump'\);[^\n]*\n  h\+='<div class="ss-col ss-col-dad" style="padding-bottom:28px">';/.test(dd)&&/h\+=_ss\('end'\);[^\n]*\n  h\+='<\/div>';\n  h=\(typeof ssLayout==="function"\)\?ssLayout\("dad",h\):h;/.test(dd));
  ok("Dad's sections, in today's order", JSON.stringify(ids(dd))===JSON.stringify(["jump","kitchen","laundry","helper","sched","clean","myday","bp","kids","checklog","dinner","bills","ask","end"]), ids(dd));
  ok("🙋 I need Mom + 🔴 Now are one section (hbSecEl finds the Now card right after the 🙋 marker, as before); the 📋/📝/🔁 lines and the ✎ pop-up ride in 🏡 My day", /h\+=_ss\('now'[^\n]*\n  try\{ h\+=hrMomCardHTML\(null,"md"\); \}catch\(e\)\{\}/.test(md)&&!/_ss\('needmom'|_ss\('check'/.test(md)&&/h\+=_ss\('myday'[^\n]*\n  try\{ h\+=momDayStripHTML\(iso,today\); \}catch\(e\)\{\}\n  try\{ h\+=wsTaskHTML\(\); \}/.test(md));
  ok("a section lands under the pinned stack when scrolled to (scroll-margin-top from the variables)", /\.ss-sec,\.ss-sec>\*\{scroll-margin-top:calc\(var\(--hdr-h\) \+ var\(--nav-h\) \+ var\(--mp-h\) \+ var\(--jump-h\)\)\}/.test(CSS));
  ok("a bare world (no ssSec) still gets a plain page — the markers fall back to ''", /const _ss=\(typeof ssSec==="function"\)\?ssSec:function\(\)\{ return ""; \};/.test(md)&&/const _ss=\(typeof ssSec==="function"\)\?ssSec:function\(\)\{ return ""; \};/.test(dd));
  // Dad's real page through ssLayout, with stub cards: pills only for what drew, his saved order, his write path
  const dadPage=o=>{ o=o||{}; const c=mk(Object.assign({mom:true},o));
    const env={_todayStr:()=>"2026-10-22",mdTodayName:()=>"thursday",mpGoto:()=>{},_kioskD:()=>false,ddManage:false,kitDuePrepHTML:()=>({n:o.kit?1:0,html:"KIT"}),laundryBinNowHTML:()=>"",helperDadCardHTML:()=>"",dadSchedHTML:()=>"<div>SCHED</div>",hhCleanOn:()=>false,momDayStripHTML:()=>"<div>MYDAY</div>",momHere:()=>!o.lock,dadAwardOk:()=>false,DAD_PIN:"1234",mdCardBPDad:()=>"<div>BP</div>",mdCardKidsToday:()=>"<div>KIDS</div>",mdCardStarBank:()=>"",mdCardCheckLog:()=>"<div>LOG</div>",mdCardDinner:()=>"<div>DINNER</div>",mdCardBills:()=>"<div>BILLS</div>",ktAskHTML:()=>"",esc:s=>s,
      ssSec:c.get("ssSec"),ssLayout:c.get("ssLayout")};
    const el=new Function(...Object.keys(env),fn("renderDadsDay")+"\nconst el={innerHTML:''}; renderDadsDay(el); return el;")(...Object.values(env)); return {h:el.innerHTML,c}; };
  const fix=(()=>{ try{ return dadPage(); }catch(e){ return {err:String(e)}; } })();
  if(fix.err){ ok("Dad's Day renders through ssLayout",false,fix.err); }
  else {
    const p=pills(fix.h);
    ok("Dad's Day ▸ Today: pills for exactly what drew — Schedule, My day, BP, Kids, Check-offs, Dinner, Bills — Kitchen/Laundry/Helping/Cleaning/This week (empty) have none", JSON.stringify(p)==='["sched","myday","bp","kids","checklog","dinner","bills"]', p);
    ok("his top row is the sub-menu slot, the jump row right under it, the column after", /<div id="mp-subnav" [^>]*>[\s\S]*?<\/div><div id="mp-jump" class="ss-jump" style="display:flex">[\s\S]*?<\/div><div class="ss-col ss-col-dad"/.test(fix.h));
    const lk=dadPage({lock:true}).h; ok("locked: the 🔒 Star controls row rides in the Kids section, just above the kid rows", /data-ss="kids"[^>]*>(?:(?!data-ss=)[\s\S])*?dad-pin-input(?:(?!data-ss=)[\s\S])*?KIDS<\/div>/.test(lk)&&fix.h.indexOf("dad-pin-input")<0);
    const k=dadPage({kit:true}); ok("a kitchen step due → the 🔴 Kitchen pill appears, first", pills(k.h)[0]==="kitchen"&&pills(k.h).length===8);
    const s=dadPage({saved:{dad:["bills","sched"]}}); ok("his saved order (settings/dadDayOrder) leads; Mom's order is not his", JSON.stringify(pills(s.h).slice(0,3))==='["bills","sched","myday"]'&&JSON.stringify(pills(dadPage({saved:{mom:["bills","sched"]}}).h).slice(0,2))==='["sched","myday"]');
    s.c.get("ssMove('dad','bp','sched')"); ok("his drop writes settings/dadDayOrder only", s.c.writes.length===1&&s.c.writes[0][1]==="settings/dadDayOrder"&&JSON.stringify(s.c.writes[0][2].slice(0,3))==='["bills","bp","sched"]', s.c.writes);
  }
}
ok("no 🔀 anywhere", src.indexOf("🔀")<0);
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
