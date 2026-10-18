/*
 * 🧺 LAUNDRYLINE step 1 — the laundry line (her ask 2026-10-16: "work like the school schedule … we keep the order … I really
 * like the cap feature"). Order, per-weekday cap, up next, the two-week lay, breaks pause it, Mom-only targeted writes.
 * run: node test_laundry_line.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,300)+")":"")); } };
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("missing "+a); return src.slice(i,j); };
const BLOCK=cut("// LAUNDRYLINE_START","// LAUNDRYLINE_END");
const iso=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
function mk(o){
  o=o||{}; const writes=[], ls={};
  const ctx={LL_DEFAULT_MODE:"rotate",   // these replay the plain rotation; 📅 home days: test_laundry_home.js
    console,Object,Array,String,Number,parseInt,Math,JSON,Date,
    HA_LS:{getItem:k=>ls[k]||null,setItem:(k,v)=>{ ls[k]=v; }},
    db:{ref:p=>({update:v=>writes.push(["update",p,JSON.parse(JSON.stringify(v))]),set:v=>writes.push(["set",p,v])})},
    _lbWrite:()=>!o.dry, isMom:!o.noMom, momHere:()=>ctx.isMom, kitPinGate:()=>{ ctx.gated=true; }, gated:false,
    calendarData:o.cal||{holidays:{},vacations:{}}, calNormDate:s=>s,
    KID_NAME:{lincoln:"Lincoln",ellis:"Ellis",lucy:"Lucy",julian:"Julian"}, cap:s=>s.charAt(0).toUpperCase()+s.slice(1),
    _hhIsoLocal:ms=>iso(new Date(ms)), esc:s=>String(s==null?"":s), hhRender:()=>{}, writes};
  vm.createContext(ctx); vm.runInContext(BLOCK+"\nthis.__w=()=>llWeek;",ctx); Object.defineProperty(ctx,"llWeek",{get:()=>ctx.__w()}); if(o.line) ctx.laundryLineOnValue(o.line); return ctx;
}
const MON="2026-10-19";   // a Monday
const lbl=(c,r)=>r.loads.join(",");

console.log("1. The defaults");
{ const c=mk(); ok("order: Lincoln, Ellis, Lucy, Julian, Mom & Dad, Towels", c.llOrder().join()==="lincoln,ellis,lucy,julian,momdad,towels", c.llOrder());
  ok("caps: one a day Mon–Sat, Sunday off", [0,1,2,3,4,5].every(d=>c.llCap(d)===1)&&c.llCap(6)===0);
  ok("up next defaults to the first in line", c.llNext()==="lincoln");
  const p=c.llProject(MON,8); ok("a Monday start: Mon Lincoln … Sat Towels, Sun none, next Mon Lincoln again", p.map(r=>lbl(c,r)).join("|")==="lincoln|ellis|lucy|julian|momdad|towels||lincoln", p.map(r=>r.loads));
  ok("weekday index: Mon=0, Sun=6", c.llDow(MON)===0&&c.llDow("2026-10-25")===6);
}
console.log("2. The cap and up next");
{ const c=mk({line:{caps:{"0":2,"6":0},next:"ellis"}}); const p=c.llProject(MON,3);
  ok("cap 2 on Monday with Ellis up next: Mon Ellis + Lucy, Tue Julian, Wed Mom & Dad", p.map(r=>lbl(c,r)).join("|")==="ellis,lucy|julian|momdad", p.map(r=>r.loads));
  const z=mk({line:{caps:{"0":0,"1":0,"2":0,"3":0,"4":0,"5":0,"6":0}}}); ok("all caps 0: no laundry, nothing loops forever", z.llProject(MON,14).every(r=>!r.loads.length));
  const bad=mk({line:{caps:{"0":9},next:"gone"}}); ok("a cap over 4 falls back to the default; an unknown next falls back to the first", bad.llCap(0)===1&&bad.llNext()==="lincoln");
}
console.log("3. Breaks");
{ const c=mk({cal:{holidays:{h1:{name:"Fall break",start:"2026-10-20",end:"2026-10-21",pause:"all"}},vacations:{v1:{name:"Field trip",start:"2026-10-22",end:"2026-10-22"}}}});
  const p=c.llProject(MON,5);
  ok("an everything-break pauses the line and the order waits: Mon Lincoln, Tue/Wed paused, Thu Ellis", p[0].loads.join()==="lincoln"&&p[1].brk==="Fall break"&&!p[1].loads.length&&!p[2].loads.length&&p[3].loads.join()==="ellis", p.map(r=>[r.brk,r.loads]));
  ok("a school-only break (the default) doesn't pause laundry", p[3].brk==="");
  const k=mk({cal:{holidays:{},vacations:{v:{name:"Beach",start:"2026-10-19",end:"2026-10-19",pause:"chores"}}}}); ok("a chores break pauses it too", k.llProject(MON,1)[0].brk==="Beach");
}
console.log("4. Mom's edits — targeted writes");
{ const c=mk(); c.llCapStep(0,1); const w0=c.writes[0]&&c.writes[0][2];
  ok("first edit (cap + on Monday): one write — the six items one path each, asOf today, caps/0 = 2", c.writes.length===1&&c.writes[0][1]==="laundryLine"&&Object.keys(w0).filter(k=>/^items\/[a-z]+$/.test(k)).length===6&&w0["caps/0"]===2&&/^\d{4}-\d\d-\d\d$/.test(w0.asOf)&&c.llCap(0)===2, c.writes);
  c.writes.length=0; c.llCapStep(1,1); ok("the next cap edit writes caps/1 only", c.writes.length===1&&JSON.stringify(c.writes[0][2])==='{"caps/1":2}', c.writes);
  c.writes.length=0; c.llMove("lucy",-1);
  const w=c.writes[0]&&c.writes[0][2]; ok("reorder writes only the orders that changed, Lucy before Ellis", JSON.stringify(Object.keys(w).sort())==='["items/ellis/order","items/lucy/order"]'&&c.llOrder().join()==="lincoln,lucy,ellis,julian,momdad,towels", [w,c.llOrder()]);
  c.writes.length=0; c.llMove("towels",-1);
  ok("the next reorder writes only the two orders that changed", c.writes.length===1&&JSON.stringify(Object.keys(c.writes[0][2]).sort())==='["items/momdad/order","items/towels/order"]', c.writes);
  c.writes.length=0; c.llMove("lincoln",-1); ok("↑ on the first: nothing", c.writes.length===0);
  c.llSetNext("julian"); ok("Up next → Julian: writes next + asOf (the line starts here today)", c.writes.length===1&&c.writes[0][2].next==="julian"&&Object.keys(c.writes[0][2]).sort().join()==="asOf,next"&&c.llNext()==="julian", c.writes);
  c.writes.length=0; c.llCapStep(6,-1); ok("− at 0: nothing", c.writes.length===0);
  ok("no write anywhere is a whole-node set", c.writes.every(w=>w[0]!=="set"));
}
console.log("5. Not Mom / dry run");
{ const k=mk({noMom:true}); k.llCapStep(0,1); k.llMove("lucy",-1); k.llSetNext("ellis");
  ok("a kid's device: PIN asked, nothing written, nothing changed", k.gated&&k.writes.length===0&&k.llCap(0)===1&&k.llNext()==="lincoln");
  const h=k.llCardHTML(); ok("the card still shows the line, no buttons", /🧺 The laundry line/.test(h)&&/Lincoln's clothes/.test(h)&&!/llMove\(/.test(h)&&!/llCapStep\(/.test(h));
  const d=mk({dry:true}); d.llCapStep(0,1); ok("dry run: changes this screen, writes nothing", d.writes.length===0&&d.llCap(0)===2);
}
console.log("6. The card");
{ const c=mk({line:{next:"ellis"}}); const h=c.llCardHTML();
  ok("Mom: ↑ ↓, Up next, − + per weekday", /llMove\('lucy',-1\)/.test(h)&&/llSetNext\('lincoln'\)/.test(h)&&/llCapStep\(0,1\)/.test(h));
  ok("Ellis marked up next; today is the first row of the two weeks", /Ellis's clothes <span[^>]*>▶ up next/.test(h)&&/>Today</.test(h));
  { const H=cut("function hhLaundryHTML(","// HH_LAUNDRY_END"), at=k=>H.indexOf(k);   // her order 2026-10-18
    ok("the laundry tab: machines now (Home Base's own card) → 📅 schedule → the line → ⚡ quick buttons → the chore grid", at("mc=mdCardLaundry(true)")>0&&at("mc=mdCardLaundry(true)")<at("h+=llWeekCardHTML()")&&at("h+=llWeekCardHTML()")<at("h+=llCardHTML(true)")&&at("h+=llCardHTML(true)")<at("h+=qlCardHTML()")&&at("h+=qlCardHTML()")<at("// the week grid\n")); }
  ok("the line card can leave its grid off (noGrid)", !/This week/.test(c.llCardHTML(true))&&/This week/.test(c.llCardHTML())&&/📅 The laundry schedule/.test(c.llWeekCardHTML()));
  ok("the listener reads laundryLine", /db\.ref\("laundryLine"\)\.on\("value"/.test(src));
}
console.log("7. The week grid");
{ const c=mk({cal:{holidays:{h:{name:"Fall break",start:"2026-10-23",end:"2026-10-23",pause:"all"}},vacations:{}}});
  const WED="2026-10-21"; const g=c.llWeekGridHTML(WED), cells=g.split('border-radius:8px;padding:4px 1px').slice(1);
  ok("seven day cells, Mon–Sun of this week", cells.length===7&&/This week/.test(g)&&/10\/19–10\/25/.test(g), cells.length);
  ok("Mon + Tue are past (—), Wed is Today with Lincoln", /—/.test(cells[0])&&/—/.test(cells[1])&&/Today/.test(cells[2])&&/>Lincoln</.test(cells[2]));
  ok("Thu Ellis, Fri paused for Fall break, Sat Lucy, Sun no laundry", />Ellis</.test(cells[3])&&/⏸<br>Fall break/.test(cells[4])&&/>Lucy</.test(cells[5])&&/no laundry/.test(cells[6]));
  c.llWeekNav(1); const n=c.llWeekGridHTML(WED).split('border-radius:8px;padding:4px 1px').slice(1);
  ok("› next week: Mon Julian, Tue Mom & Dad, Wed Towels, Thu Lincoln again", /Next week/.test(c.llWeekGridHTML(WED))&&/>Julian</.test(n[0])&&/>Mom &amp; Dad<|>Mom & Dad</.test(n[1])&&/>Towels</.test(n[2])&&/>Lincoln</.test(n[3]));
  c.llWeekNav(-5); ok("‹ stops at this week", c.llWeek===0);
  ok("the grid writes nothing", c.writes.length===0);
}
ok("no 🔀", src.indexOf("🔀")<0);
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
