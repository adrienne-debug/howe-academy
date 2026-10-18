/*
 * 🧺 LAUNDRYLINE step 3 — ⏫ bump and 💦 jump-ins (her "go to step 3" 2026-10-16). Bump: "Lucy really has to have her laundry day
 * today … just this rotation" — on today ahead of the line, out of the line where she stood, takes a slot, back in her place next
 * round. Jump-ins (her pick: "yes, they use a slot"): each holds a slot the day it was reported; the toast says what slid.
 * run: node test_laundry_bump.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,400)+")":"")); } };
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("missing "+a); return src.slice(i,j); };
const BLOCK=cut("// LAUNDRYLINE_START","// LAUNDRYLINE_END");
const iso=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
const MON="2026-10-19", TUE="2026-10-20";
function mk(o){
  o=o||{}; const writes=[], toasts=[], ls={};
  const ctx={LL_DEFAULT_MODE:"rotate",   // these replay the plain rotation; 📅 home days: test_laundry_home.js
    console,Object,Array,String,Number,parseInt,Math,JSON,Date,
    HA_LS:{getItem:k=>ls[k]||null,setItem:(k,v)=>{ ls[k]=v; }},
    db:{ref:p=>({update:v=>writes.push(["update",p,JSON.parse(JSON.stringify(v))]),set:v=>writes.push(["set",p,JSON.parse(JSON.stringify(v))])})},
    _lbWrite:()=>!o.dry, isMom:!o.noMom, momHere:()=>ctx.isMom, kitPinGate:()=>{ ctx.gated=true; }, gated:false,
    calendarData:{holidays:{},vacations:{}}, calNormDate:s=>s, laundryData:{},
    KID_NAME:{lincoln:"Lincoln",ellis:"Ellis",lucy:"Lucy",julian:"Julian"}, cap:s=>s.charAt(0).toUpperCase()+s.slice(1),
    _hhIsoLocal:ms=>iso(new Date(ms)), esc:s=>String(s==null?"":s), hhRender:()=>{}, mwToast:t=>toasts.push(t), writes, toasts};
  vm.createContext(ctx); vm.runInContext(BLOCK,ctx);
  vm.runInContext("llToday=function(){ return '"+(o.day||MON)+"'; }; llNowMin=function(){ return "+(o.min==null?600:o.min)+"; };",ctx);
  if(o.line) vm.runInContext("laundryLine="+JSON.stringify(o.line)+";",ctx);
  ctx.get=e=>vm.runInContext(e,ctx); return ctx;
}
const caps=n=>({"0":n,"1":n,"2":n,"3":n,"4":n,"5":n,"6":0});
const L=(c,day,n,close)=>c.llProject(day,n||1,!!close).map(r=>r.loads.join(","));

console.log("1. ⏫ Bump Lucy onto Monday (cap 2: Lincoln, Ellis)");
{ const c=mk({line:{caps:caps(2),asOf:MON}}); c.llBump("lucy");
  ok("one write: bump/<today>/lucy", c.writes.length===1&&typeof c.writes[0][2]["bump/"+MON+"/lucy"]==="number", c.writes);
  ok("Monday: Lucy (first) + Lincoln — full at 2; Ellis slides", L(c,MON)[0]==="lucy,lincoln", L(c,MON));
  ok("the toast: Lucy today · Ellis's clothes moves to tomorrow", /⏫ Lucy's clothes — today · Ellis's clothes moves to tomorrow/.test(c.toasts[0]||""), c.toasts);
  ok("the week: Tue Ellis, Julian · Wed Mom & Dad, Towels · Thu Lincoln, Ellis · Fri Lucy (back in her place), Julian", L(c,MON,5).join("|")==="lucy,lincoln|ellis,julian|momdad,towels|lincoln,ellis|lucy,julian", L(c,MON,5));
  c.writes.length=0; c.llBump("lucy"); ok("tap again: ↩ unbump — one null, Monday back to Lincoln, Ellis", c.writes.length===1&&c.writes[0][2]["bump/"+MON+"/lucy"]===null&&L(c,MON)[0]==="lincoln,ellis", [c.writes,L(c,MON)]);
  c.writes.length=0; c.llBump("ellis"); ok("bump a load already on today: nothing", c.writes.length===0);
}
console.log("2. A bump that went in stays; one that didn't by 8 PM stays at the front");
{ const c=mk({line:{caps:caps(2),asOf:MON,bump:{[MON]:{lucy:5}},log:{[MON]:{lucy:{at:9,load:"x"}}}}});
  c.llBump("lucy"); ok("Lucy went in: unbump refused", c.writes.length===0&&L(c,MON)[0]==="lucy,lincoln");
  const n=mk({line:{caps:caps(2),asOf:MON,bump:{[MON]:{lucy:5}}}});
  ok("not started by 8 PM: Lucy → moved, Tuesday starts with Lucy, Lincoln", L(n,MON,2,true).join("|")==="lucy,lincoln|lucy,lincoln"&&n.llProject(MON,1,true)[0].moved.join()==="lucy,lincoln", L(n,MON,2,true));
}
console.log("3. Not Mom");
{ const k=mk({noMom:true,line:{caps:caps(2),asOf:MON}}); k.llBump("lucy"); ok("a kid's device: PIN asked, nothing written", k.gated&&k.writes.length===0); }
console.log("4. 💦 Jump-ins hold a slot");
{ const c=mk({line:{caps:caps(3),asOf:MON}}); const tail=c.llJumpAdd("wt1","Towels");
  ok("one write: jump/<today>/wt1 {label,at}", c.writes.length===1&&c.writes[0][2]["jump/"+MON+"/wt1"].label==="Towels", c.writes);
  ok("Monday: Lincoln, Ellis + the towels — Lucy slides; the toast tail says so", L(c,MON)[0]==="lincoln,ellis"&&tail===" · Lucy's clothes moves to tomorrow", [L(c,MON),tail]);
  ok("Tuesday: Lucy first, then Julian, Mom & Dad", L(c,MON,2)[1]==="lucy,julian,momdad", L(c,MON,2));
  c.llJumpAdd("wt2","Sheets (king)"); c.llJumpAdd("wt3","Dog stuff"); ok("three jump-ins on a cap-3 day: no line loads today", L(c,MON)[0]===""&&c.llProject(MON,1)[0].jumps.length===3);
  const e=mk(); ok("line never set up: the bin works as always, nothing written", e.llJumpAdd("wt1","Towels")===""&&e.writes.length===0);
  const s=mk({line:{caps:caps(3),asOf:MON,log:{[MON]:{lincoln:{at:1},ellis:{at:2},lucy:{at:3}}}}}); ok("today already done: a jump-in moves nothing", s.llJumpAdd("wt1","Towels")==="");
}
console.log("5. ✕ a jump-in before it's washed gives the slot back");
{ const c=mk({line:{caps:caps(3),asOf:MON,jump:{[MON]:{wt1:{label:"Towels",at:1}}}}});
  c.llUnlog("wt1",{wet:true,jumpDay:MON,stage:"bin"}); ok("in the bin: one null, Monday back to three", c.writes.length===1&&c.writes[0][2]["jump/"+MON+"/wt1"]===null&&L(c,MON)[0]==="lincoln,ellis,lucy", [c.writes,L(c,MON)]);
  const d=mk({line:{caps:caps(3),asOf:MON,jump:{[MON]:{wt1:{label:"Towels",at:1}}}}}); d.llUnlog("wt1",{wet:true,jumpDay:MON,stage:"dryer"}); ok("past the wash: the slot stays used", d.writes.length===0&&L(d,MON)[0]==="lincoln,ellis");
}
console.log("6. The card + grid");
{ const c=mk({day:TUE,line:{caps:caps(2),asOf:MON,jump:{[MON]:{wt0:{label:"Dog stuff",at:1}},[TUE]:{wt1:{label:"Towels",at:1}}},bump:{[TUE]:{lucy:3}},log:{[MON]:{lincoln:{at:1}}}}});
  const h=c.llCardHTML(), cells=c.llWeekGridHTML(TUE,false,true).split('border-radius:8px;padding:4px 1px').slice(1);
  ok("Lucy bumped and not in yet: ↩ Unbump; Ellis (the towels + Lucy filled cap 2) and Julian: ⏫ Today", /llBump\('lucy'\)"[^>]*>↩ Unbump/.test(h)&&/llBump\('julian'\)"[^>]*>⏫ Today/.test(h)&&/llBump\('ellis'\)"[^>]*>⏫ Today/.test(h)&&!/llBump\('lucy'\)"[^>]*>⏫/.test(h), h.match(/llBump\('\w+'\)"[^>]*>[^<]+/g));
  ok("Tuesday cell: 💦 Towels, ⏫ Lucy (with 🫧 Start) — cap 2 is full, Ellis waits", /💦<br>Towels/.test(cells[1])&&/⏫ Lucy/.test(cells[1])&&/llStart\('lucy'\)/.test(cells[1])&&!/Ellis/.test(cells[1]), cells[1]);
  ok("Monday (past): 💦 Dog stuff and ✓ Lincoln — a record of the day", /💦<br>Dog stuff/.test(cells[0])&&/✓<\/span> Lincoln/.test(cells[0]));
  const m=mk({line:{caps:caps(2),asOf:MON}}).llCardHTML(); ok("a load already on today (Lincoln, Ellis on a plain Monday): no bump button", !/llBump\('lincoln'\)/.test(m)&&!/llBump\('ellis'\)/.test(m)&&/llBump\('lucy'\)/.test(m));
  const k=mk({noMom:true,day:TUE,line:{caps:caps(2),asOf:MON}}); ok("kid's device: no bump buttons", !/llBump\(/.test(k.llCardHTML()));
}
console.log("7. Wiring");
{ const w=cut("function wtReport(","\n}");
  ok("wtReport stamps jumpDay and holds a slot (llJumpAdd), the toast carries what slid", /rec\.jumpDay=iso/.test(w)&&/llJumpAdd\(id,/.test(w)&&/in the wash-today bin'\+_slid/.test(w));
}
ok("no 🔀", src.indexOf("🔀")<0);
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
