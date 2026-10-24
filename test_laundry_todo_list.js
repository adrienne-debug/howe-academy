/*
 * 📝 LLTODO_LIST (her ask 2026-10-23: "I think it would feel right if they were a checklist in that laundry section instead of in that
 * laundry schedule. It looks messy there. … Maybe it could still have the little thing of when it was put on the list, like it said from
 * Tuesday … But it doesn't actually have to move."). The laundry to-dos are a checklist in the 🧺 Laundry card (mdCardLaundry) — Household ▸
 * Laundry above the schedule, and 🏡 My day (Home Base, Dad's Day) — with "· from Tue"; none in the schedule's day cells.
 * run: node test_laundry_todo_list.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,400)+")":"")); } };
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("missing "+a); return src.slice(i,j); };
const fn=name=>{ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); let d=0; for(let k=src.indexOf("{",i);k<src.length;k++){ if(src[k]==="{") d++; else if(src[k]==="}"&&--d===0) return src.slice(i,k+1); } throw new Error("unbalanced "+name); };
const LL=cut("// LAUNDRYLINE_START","// LAUNDRYLINE_END"), LIST=cut("// LLTODO_LIST_START","// LLTODO_LIST_END");
const iso=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
const TUE="2026-10-20", WED="2026-10-21", FRI="2026-10-23";
const caps=n=>({"0":n,"1":n,"2":n,"3":n,"4":n,"5":0,"6":0});
// her four live to-dos (read 2026-10-23): all "both", none ticked, no "after"
const TODO={t_mvhdliau40q:{at:1792542626022,day:TUE,emoji:"📝",text:"put up blankets on kitchen table",who:"both"},
  t_mvhdmqlq2vp:{at:1792542683438,day:TUE,emoji:"📝",text:"put up items in laundry basket in livingroom",who:"both"},
  t_mvhdnck3xjv:{at:1792542711891,day:TUE,emoji:"📝",text:"set up a basket for the cleaning towels to grab under sink",who:"both"},
  t_mvixgexl0z1:{at:1792636446873,day:WED,emoji:"📝",text:"get car blankets in bags and in cars",who:"both"}};
const LINE={caps:caps(2),asOf:TUE,homeFrom:TUE,todo:TODO};
const LOADS={l1:{label:"Towels",stage:"dryer",ts:1}};
function mk(o){
  o=o||{}; const writes=[], ls={}, els={};
  const ctx={LL_DEFAULT_MODE:"rotate", console,Object,Array,String,Number,parseInt,Math,JSON,Date,
    HA_LS:{getItem:k=>ls[k]||null,setItem:(k,v)=>{ ls[k]=v; }},
    db:{ref:p=>({update:v=>writes.push(["update",p,JSON.parse(JSON.stringify(v))]),set:v=>writes.push(["set",p,JSON.parse(JSON.stringify(v))])})},
    _lbWrite:()=>true, isMom:!o.noMom, momHere:()=>ctx.isMom, _kioskD:()=>!!o.dad, kitPinGate:()=>{ ctx.gated=true; }, gated:false, confirm:()=>true,
    document:{getElementById:id=>els[id]||null}, els, laundryData:JSON.parse(JSON.stringify(o.loads||{})), calDateForWeekDay:()=>null, tab:"moms-plan", renderAll:()=>{},
    calendarData:{holidays:{},vacations:{},kidOverrides:{}}, calNormDate:s=>s,
    ROSTER:["lincoln","ellis","lucy","julian"], KID_NAME:{lincoln:"Lincoln",ellis:"Ellis",lucy:"Lucy",julian:"Julian"}, cap:s=>s.charAt(0).toUpperCase()+s.slice(1),
    _hhIsoLocal:ms=>iso(new Date(ms)), esc:s=>String(s==null?"":s), hhRender:()=>{}, mwToast:()=>{},
    laundrySince:()=>"9:00", laundryDoneTxt:()=>"", laundryTimesEditorHTML:()=>"", momTipLaundryHTML:()=>"", laundryAdvanceLabel:()=>"Move it", laundryMeta:()=>["🌀","In the dryer"],
    hhJobs:()=>({}), hhLaundryRows:()=>[], HH_WHO:["lincoln","ellis","lucy","julian","mom","dad","grab"], writes};
  vm.createContext(ctx);
  vm.runInContext(src.slice(src.indexOf("const LAUNDRY_STAGES"), src.indexOf("\n", src.indexOf("const LAUNDRY_STAGE_META")))+"\nconst LAUNDRY_WET_STAGES=LAUNDRY_STAGES;\n"+LL+"\n"+fn("mdCardLaundry")+"\n"+fn("hhLaundryHTML"),ctx);
  vm.runInContext("llToday=function(){ return '"+(o.day||FRI)+"'; }; llNowMin=function(){ return 600; }; llCardHTML=function(){ return '<LINECARD>'; };",ctx);
  vm.runInContext("laundryLine="+JSON.stringify(o.line||LINE)+";",ctx);
  ctx.get=e=>vm.runInContext(e,ctx); return ctx;
}
const rows=h=>(h.match(/onclick="llTdToggle\('[^']+'\)"/g)||[]).length;

console.log("1. Her four to-dos, Friday 10/23, in the 🧺 Laundry card");
{ const c=mk({loads:LOADS}), h=c.mdCardLaundry(true,false);
  ok("the card has a 📝 Laundry to-do list with all four, each with a tick box", /📝 Laundry to-do/.test(h)&&rows(h)===4, rows(h));
  ok("in the order they were added (kitchen table, living-room basket, under the sink, car blankets)", h.indexOf("kitchen table")<h.indexOf("livingroom")&&h.indexOf("livingroom")<h.indexOf("under sink")&&h.indexOf("under sink")<h.indexOf("car blankets"));
  ok("three say 'from Tue', the car blankets 'from Wed'", (h.match(/from Tue</g)||[]).length===3&&(h.match(/from Wed</g)||[]).length===1);
  ok("the list sits after the running load, inside the card", h.indexOf("Towels")>0&&h.indexOf("Towels")<h.indexOf("📝 Laundry to-do"));
  ok("no 👤 tag on a 'both' to-do; no 'after' note", !/👤/.test(h.slice(h.indexOf("📝 Laundry to-do")))&&!/ · after /.test(h));
  ok("Mom: ＋ To-do and ✕ on each", /llTdOpenToggle\(\)/.test(h)&&(h.match(/llTdDel\(/g)||[]).length===4);
}
console.log("2. Nothing in the machines");
{ const c=mk(), hh=c.mdCardLaundry(true,false), b=c.mdCardLaundry(true,true);
  ok("Household ▸ Laundry: the card still shows (Nothing running) with the list", /Nothing running\. Start a load from 🏡 My day\./.test(hh)&&rows(hh)===4);
  ok("🏡 My day (bare): just the list, no empty 'Machines now'", rows(b)===4&&!/Machines now/.test(b));
  const e=mk({noMom:true,line:{caps:caps(2),asOf:TUE}}); ok("a kid's device, empty list, nothing running: no card", e.mdCardLaundry(true,false)===""&&e.mdCardLaundry(true,true)==="");
  const m=mk({line:{caps:caps(2),asOf:TUE}}); const mh=m.mdCardLaundry(true,true); ok("Mom, empty list: the list header with ＋ To-do, so she can add", /📝 Laundry to-do/.test(mh)&&/llTdOpenToggle\(\)/.test(mh)&&/Nothing on the list/.test(mh));
}
console.log("3. Household ▸ Laundry: the card above the schedule");
{ const c=mk({loads:LOADS}), h=c.hhLaundryHTML();
  ok("the 📝 list comes before 📅 The laundry schedule", h.indexOf("📝 Laundry to-do")>0&&h.indexOf("📝 Laundry to-do")<h.indexOf("📅 The laundry schedule"));
  ok("the schedule card has no ＋ To-do and no to-do text", (function(){ const s=h.slice(h.indexOf("📅 The laundry schedule"),h.indexOf("<LINECARD>")); return !/llTdOpenToggle|llTdToggle|kitchen table|car blankets/.test(s); })());
  const n=mk(); ok("nothing running: still the card with the list (not the old 'nothing in the machines' box)", rows(n.hhLaundryHTML())===4);
}
console.log("4. The schedule's day cells carry no chips");
{ const c=mk(); const g=c.llWeekGridHTML(FRI,false,true);
  ok("no ☐/☑ chips, no to-do text, no ticks in the week grid", !/☐|☑/.test(g)&&!/kitchen table|car blankets/.test(g)&&!/llTdToggle/.test(g));
  const t=mk({line:Object.assign({},LINE,{todo:{a:{text:"Socks",day:FRI,after:"x",who:"both",at:1}}})});
  ok("an old to-do with an 'after' stays in the data but isn't placed in the grid", !/Socks/.test(t.llWeekGridHTML(FRI,false,true))&&/Socks/.test(t.mdCardLaundry(true,true)));
}
console.log("5. Ticking: only todo/<id>/done");
{ const c=mk(); c.llTdToggle("t_mvhdliau40q");
  ok("tick writes one path: todo/<id>/done = today", c.writes.length===1&&JSON.stringify(c.writes[0][2])==='{"todo/t_mvhdliau40q/done":"2026-10-23"}', c.writes);
  const h=c.mdCardLaundry(true,true);
  ok("ticked today: still on the list, checked and struck through", rows(h)===4&&/✓<\/button><span>📝<\/span><span style="flex:1;font-weight:700;text-decoration:line-through">put up blankets/.test(h), h);
  ok("ticked: no 'from Tue' on it", !/kitchen table<span[^>]*>[^<]*<span[^>]*>from/.test(h));
  c.writes.length=0; c.llTdToggle("t_mvhdliau40q"); ok("untick: done = null, back to open", c.writes[0][2]["todo/t_mvhdliau40q/done"]===null&&!/line-through/.test(c.mdCardLaundry(true,true)));
  const y=mk({line:Object.assign({},LINE,{todo:Object.assign({},TODO,{old:{text:"Old socks",day:TUE,who:"both",at:1,done:"2026-10-22"}})})});
  ok("ticked yesterday: off the list", !/Old socks/.test(y.mdCardLaundry(true,true)));
  const dry=src.slice(src.indexOf("function llWrite("), src.indexOf("\n", src.indexOf("function llWrite(")));
  ok("llWrite goes through _lbWrite (dry-run inert)", /_lbWrite\(\)/.test(dry), dry);
}
console.log("6. Adding: Mom or Dad's link only");
{ const k=mk({noMom:true}); const kh=k.mdCardLaundry(true,true);
  ok("a kid's device sees the list and can tick, but no ＋ To-do and no ✕", rows(kh)===4&&!/llTdOpenToggle|llTdDel/.test(kh));
  k.llTdOpenToggle(); ok("＋ To-do on a kid's device asks for the PIN", k.gated&&!/id="lltd-text"/.test(k.mdCardLaundry(true,true)));
  const d=mk({noMom:true,dad:true}); d.llTdOpenToggle(); const dh=d.mdCardLaundry(true,true);
  ok("Dad's link: the add form opens inside the list (what / when / who — no 'after' picker)", !d.gated&&/id="lltd-text"/.test(dh)&&/id="lltd-when"/.test(dh)&&/id="lltd-who"/.test(dh)&&!/lltd-after/.test(dh));
  Object.assign(d.els,{"lltd-text":{value:"Match the socks"},"lltd-when":{value:"today"},"lltd-who":{value:"both"}}); d.llTdAdd();
  const w=d.writes[0]&&d.writes[0][2], k2=w&&Object.keys(w).find(x=>/^todo\//.test(x));
  ok("added: todo/t_… {text, day today, who, no after} — the same shape", k2&&w[k2].text==="Match the socks"&&w[k2].day===FRI&&!("after" in w[k2]), w);
  ok("and it's on the list", /Match the socks/.test(d.mdCardLaundry(true,true)));
}
console.log("7. 🏡 My day: the list once, not twice");
{ const c=mk({loads:LOADS}); const h=c.get("llMyDayLaundryHTML('mom')");
  ok("Mom's My day shows each to-do once (the 🧺 card's list), not again under The laundry line", (h.match(/kitchen table/g)||[]).length===1&&(h.match(/llTdOpenToggle\(\)/g)||[]).length===1, (h.match(/kitchen table/g)||[]).length);
  const d=mk({noMom:true,dad:true}); const dh=d.get("llMyDayLaundryHTML('dad')"); ok("Dad's Day the same", (dh.match(/car blankets/g)||[]).length===1);
}
console.log("8. A kid's 🧺 Your laundry is unchanged");
{ ok("llKidCardHTML still lists the kid's own to-dos with llTdRow", /tdk\.forEach\(function\(id\)\{ h\+=llTdRow\(id,t,isT,false\); \}\);/.test(LL));
  ok("the LLTODO_LIST block is inside LAUNDRYLINE", LL.indexOf("// LLTODO_LIST_START")>0);
}
ok("no 🔀", src.indexOf("🔀")<0);
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
