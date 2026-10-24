/*
 * 📝 LAUNDRY TO-DO (her ask 2026-10-18: "like i let pillows air dry and i need to remember to put those up tomorrow or to fold the random
 * mismatched socks etc just like a laundry todo added but can pick where in the line up"). Not a load (no slot, no cap); on its day after
 * the load she picked or at the end; carries until ticked; Today's line, Dad's card, a kid's card.  run: node test_laundry_todo.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,400)+")":"")); } };
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("missing "+a); return src.slice(i,j); };
const LL=cut("// LAUNDRYLINE_START","// LAUNDRYLINE_END");
const iso=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
const MON="2026-10-19", TUE="2026-10-20", WED="2026-10-21";
const DAYS={monday:MON,tuesday:TUE,wednesday:WED};
function mk(o){
  o=o||{}; const writes=[], ls={}, els={};
  const ctx={console,Object,Array,String,Number,parseInt,Math,JSON,Date,
    HA_LS:{getItem:k=>ls[k]||null,setItem:(k,v)=>{ ls[k]=v; }},
    db:{ref:p=>({update:v=>writes.push(["update",p,JSON.parse(JSON.stringify(v))]),set:v=>writes.push(["set",p,JSON.parse(JSON.stringify(v))])})},
    _lbWrite:()=>true, isMom:!o.noMom, momHere:()=>ctx.isMom, _kioskD:()=>!!o.dad, kitPinGate:()=>{ ctx.gated=true; }, gated:false, confirm:()=>true,
    document:{getElementById:id=>els[id]||null}, els, laundryData:{}, calDateForWeekDay:d=>DAYS[d]||null, tab:"moms-plan", renderAll:()=>{},
    calendarData:{holidays:{},vacations:{},kidOverrides:{}}, calNormDate:s=>s,
    ROSTER:["lincoln","ellis","lucy","julian"], KID_NAME:{lincoln:"Lincoln",ellis:"Ellis",lucy:"Lucy",julian:"Julian"}, cap:s=>s.charAt(0).toUpperCase()+s.slice(1),
    _hhIsoLocal:ms=>iso(new Date(ms)), esc:s=>String(s==null?"":s), hhRender:()=>{}, mwToast:()=>{}, writes};
  vm.createContext(ctx); vm.runInContext(LL,ctx);
  vm.runInContext("llToday=function(){ return '"+(o.day||MON)+"'; }; llNowMin=function(){ return 600; };",ctx);
  if(o.line) vm.runInContext("laundryLine="+JSON.stringify(o.line)+";",ctx);
  ctx.get=e=>vm.runInContext(e,ctx); return ctx;
}
const caps=a=>({"0":a[0],"1":a[1],"2":a[2],"3":a[3],"4":a[4],"5":a[5],"6":a[6]});
const BASE={caps:caps([2,1,2,1,3,0,0]),asOf:MON,homeFrom:MON};
const cells=c=>c.llWeekGridHTML(c.llToday(),false,true).split('border-radius:8px;padding:4px 1px').slice(1);

console.log("1. ＋ To-do");
{ const c=mk({line:BASE}); c.llTdOpenToggle(); const h=c.llTdListHTML();
  ok("LLTODO_LIST (2026-10-23): ＋ To-do is in the 🧺 card's 📝 list and opens what / when (Today · Tomorrow · a date) / 👤 — no 'after' picker, none on 📅 The laundry schedule", /llTdOpenToggle\(\)/.test(h)&&/id="lltd-text"/.test(h)&&/value="tomorrow">Tomorrow/.test(h)&&!/id="lltd-after"/.test(h)&&/id="lltd-who"/.test(h)&&!/llTdOpenToggle|lltd-text/.test(c.llWeekCardHTML()));
  Object.assign(c.els,{"lltd-text":{value:"Put the pillows up"},"lltd-emoji":{value:"🛏️"},"lltd-when":{value:"tomorrow"},"lltd-who":{value:"both"}}); c.llTdAdd();
  const w=c.writes[0][2], k=Object.keys(w).find(x=>/^todo\//.test(x));
  ok("written: todo/t_… {Put the pillows up, Tue, Mom or Dad}", k&&w[k].text==="Put the pillows up"&&w[k].day===TUE&&w[k].who==="both", w);
  ok("not a load: Tuesday's laundry is unchanged (Ellis)", c.llProject(MON,2,false)[1].loads.join()==="ellis");
  ok("LLTODO_LIST: not on the grid; on the 📝 list now, '· for Tue'", !/Put the pillows up/.test(cells(c).join(""))&&/Put the pillows up<span[^>]*> · for Tue 10\/20/.test(c.llTdListHTML()));
  c.writes.length=0; c.els["lltd-text"].value=" "; c.llTdOpenToggle(); c.llTdAdd(); ok("no text: nothing written", c.writes.length===0);
}
console.log("2. Where in the lineup");
{ const c=mk({line:Object.assign({},BASE,{todo:{t1:{text:"Fold the mismatched socks",emoji:"🧦",day:MON,after:"lincoln",who:"lincoln",at:1}}})});
  const m=cells(c)[0]; ok("LLTODO_LIST: an old 'after Lincoln' to-do keeps its data but isn't placed in the grid — it's on the 📝 list", c.get("laundryLine.todo.t1.after")==="lincoln"&&m.indexOf(">Lincoln<")>0&&m.indexOf("Fold the mismatched socks")<0&&/Fold the mismatched socks/.test(c.llTdListHTML()), m);
}
console.log("3. Ticking it, and carrying it");
{ const c=mk({line:Object.assign({},BASE,{todo:{t1:{text:"Put the pillows up",emoji:"🛏️",day:MON,who:"both",at:1}}})});
  ok("Today's line on Mom's My day lists it with a box; Dad's too (Mom or Dad)", /📝 Laundry to-do/.test(c.llStripHTML(""))&&/llTdToggle\('t1'\)/.test(c.llStripHTML(""))&&/llTdToggle\('t1'\)/.test(c.llStripHTML("dad")));
  c.llTdToggle("t1"); ok("tick: todo/t1/done = today", JSON.stringify(c.writes[0][2])==='{"todo/t1/done":"2026-10-19"}');
  ok("ticked: still shows today on the 📝 list, struck through", /Put the pillows up/.test(c.llTdListHTML())&&/line-through/.test(c.llTdListHTML()));
  c.writes.length=0; c.llTdToggle("t1"); ok("untick: done = null", c.writes[0][2]["todo/t1/done"]===null);
  const late=mk({day:WED,line:Object.assign({},BASE,{todo:{t1:{text:"Put the pillows up",emoji:"🛏️",day:MON,who:"both",at:1}}})});
  ok("not ticked Monday → Wednesday it's still there, 'from Mon'", late.llTodosOn(WED,WED).join()==="t1"&&/from Mon/.test(late.llTdTodayHTML("mom")));
  const done=mk({day:TUE,line:Object.assign({},BASE,{todo:{t1:{text:"Socks",day:MON,who:"both",at:1,done:MON}}})});
  ok("ticked Monday: gone Tuesday; the Monday cell keeps it as done", done.llTodosOn(TUE,TUE).length===0&&done.llTodosOn(MON,TUE).join()==="t1");
  done.llRoll(); ok("the next day's roll clears it (todo/t1 = null)", done.writes[0][2]["todo/t1"]===null, done.writes[0][2]);
}
console.log("4. Who sees it");
{ const c=mk({line:Object.assign({},BASE,{todo:{a:{text:"Fold socks",day:MON,who:"lincoln",at:1},b:{text:"Pillows up",day:MON,who:"mom",at:2},d:{text:"Hang the rug",day:MON,who:"dad",at:3}}})});
  ok("Lincoln's 🧺 Your laundry card has his to-do with a box he can tick", /Fold socks/.test(c.llKidCardHTML("lincoln","monday"))&&/llTdToggle\('a'\)/.test(c.llKidCardHTML("lincoln","monday")));
  ok("Ellis has none of them (his card shows only his load)", !/Fold socks|Pillows/.test(c.llKidCardHTML("ellis","tuesday")));
  ok("Mom's My day: hers, not Dad's; Dad's: his, not hers", /Pillows up/.test(c.llTdTodayHTML("mom"))&&!/Hang the rug/.test(c.llTdTodayHTML("mom"))&&/Hang the rug/.test(c.llTdTodayHTML("dad"))&&!/Pillows up/.test(c.llTdTodayHTML("dad")));
  const kid=mk({tab:"kids",line:Object.assign({},BASE,{todo:{a:{text:"Fold socks",day:TUE,who:"lucy",at:1}}})}); ok("a kid with only a to-do still gets the card (Lucy, Tuesday)", /Fold socks/.test(kid.llKidCardHTML("lucy","tuesday")));
}
console.log("5. Who can add / delete");
{ const d=mk({noMom:true,dad:true,line:BASE}); ok("Dad's card has ＋ To-do", /llTdOpenToggle\(\)/.test(d.llDadCardHTML()));
  d.llTdOpenToggle(); Object.assign(d.els,{"lltd-text":{value:"Rug on the line"},"lltd-when":{value:"today"},"lltd-who":{value:"dad"}}); d.llTdAdd(); ok("Dad adds from his link (no PIN)", !d.gated&&d.writes.length===1);
  const k=mk({noMom:true,line:Object.assign({},BASE,{todo:{a:{text:"Fold socks",day:MON,who:"lincoln",at:1}}})}); k.llTdOpenToggle(); k.llTdDel("a");
  ok("a kid's device: can't add or delete (PIN), but can tick", k.gated&&k.writes.length===0&&(k.llTdToggle("a"),k.writes.length===1));
}
ok("no 🔀", src.indexOf("🔀")<0);
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
