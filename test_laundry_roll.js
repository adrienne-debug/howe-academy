/*
 * 🧺 LAUNDRYLINE step 2 — the roll and the re-lay (her "yes go" 2026-10-16). A replay of her own example: cap 3, a bad Monday, a
 * worse Tuesday, nothing Wednesday, all three Thursday — the loads stay at the front in order, every day fills to its cap before
 * anything slides ("caps should be met before slide"), from 8 PM today folds, a mid-day change asks today-too / keep-today, 🫧 Start
 * makes the same laundry/<id> load + the log entry, ✕ in the washer takes it back, the roll is saved once a day.
 * run: node test_laundry_roll.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,400)+")":"")); } };
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("missing "+a); return src.slice(i,j); };
const BLOCK=cut("// LAUNDRYLINE_START","// LAUNDRYLINE_END");
const iso=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
const MON="2026-10-19", TUE="2026-10-20", WED="2026-10-21", THU="2026-10-22", FRI="2026-10-23";
function mk(o){
  o=o||{}; const writes=[], ls={};
  const ctx={console,Object,Array,String,Number,parseInt,Math,JSON,Date,
    HA_LS:{getItem:k=>ls[k]||null,setItem:(k,v)=>{ ls[k]=v; }},
    db:{ref:p=>({update:v=>writes.push(["update",p,JSON.parse(JSON.stringify(v))]),set:v=>writes.push(["set",p,JSON.parse(JSON.stringify(v))])})},
    _lbWrite:()=>!o.dry, isMom:!o.noMom, momHere:()=>ctx.isMom, kitPinGate:()=>{ ctx.gated=true; }, gated:false,
    calendarData:o.cal||{holidays:{},vacations:{}}, calNormDate:s=>s, laundryData:{},
    KID_NAME:{lincoln:"Lincoln",ellis:"Ellis",lucy:"Lucy",julian:"Julian"}, cap:s=>s.charAt(0).toUpperCase()+s.slice(1),
    _hhIsoLocal:ms=>iso(new Date(ms)), esc:s=>String(s==null?"":s), hhRender:()=>{}, mwToast:()=>{}, writes};
  vm.createContext(ctx); vm.runInContext(BLOCK+"\nthis.__ask=()=>llAsk;",ctx);
  ctx.setNow=(day,min)=>vm.runInContext("llToday=function(){ return '"+day+"'; }; llNowMin=function(){ return "+min+"; };",ctx);
  ctx.setNow(o.day||MON,o.min==null?600:o.min);
  if(o.line){ vm.runInContext("laundryLine="+JSON.stringify(o.line)+";",ctx); }
  ctx.get=e=>vm.runInContext(e,ctx); return ctx;
}
const caps3={"0":3,"1":3,"2":3,"3":3,"4":3,"5":3,"6":0};
const L=(c,day,n,close)=>c.llProject(day,n||1,!!close).map(r=>r.loads.join(","));
const logOf=(m)=>{ const o={}; Object.keys(m).forEach(d=>{ o[d]={}; m[d].forEach((id,i)=>{ o[d][id]={at:1000+i,load:"x"+id}; }); }); return o; };

console.log("1. Her example — cap 3: Mon only Lincoln, Tue only Ellis, Wed nothing, Thu all three");
{ const base={caps:caps3,asOf:MON};
  let c=mk({line:base}); ok("Monday morning: Lincoln, Ellis, Lucy", L(c,MON)[0]==="lincoln,ellis,lucy", L(c,MON));
  c=mk({line:Object.assign({},base,{log:logOf({[MON]:["lincoln"]})})});
  ok("Tuesday: Ellis, Lucy (still first, in order) + Julian — full at 3", L(c,TUE)[0]==="ellis,lucy,julian", L(c,TUE));
  ok("…and Monday really shows Lincoln ✓ with Ellis, Lucy moved", (r=>r.started.join()==="lincoln"&&r.moved.join()==="ellis,lucy")(c.llProject(MON,1,true)[0]));
  c=mk({line:Object.assign({},base,{log:logOf({[MON]:["lincoln"],[TUE]:["ellis"]})})});
  ok("Wednesday: Lucy, Julian, Mom & Dad", L(c,WED)[0]==="lucy,julian,momdad", L(c,WED));
  c=mk({line:Object.assign({},base,{log:logOf({[MON]:["lincoln"],[TUE]:["ellis"]})})});
  ok("Wed nothing → Thursday: the same three again, nothing stacks (never 6)", L(c,THU)[0]==="lucy,julian,momdad", L(c,THU));
  c=mk({line:Object.assign({},base,{log:logOf({[MON]:["lincoln"],[TUE]:["ellis"],[THU]:["lucy","julian","momdad"]})})});
  ok("Thu all three ✓ → Friday: Towels, Lincoln, Ellis (round two)", L(c,FRI)[0]==="towels,lincoln,ellis", L(c,FRI));
  ok("(a perfect week would have had Friday at Lincoln, Ellis, Lucy — the bad days slid it, nothing was lost)", L(mk({line:base}),MON,5)[4]==="lincoln,ellis,lucy", L(mk({line:base}),MON,5));
}
console.log("2. Fill to the cap before anything slides");
{ const c=mk({line:{caps:caps3,asOf:MON,log:logOf({[MON]:["lincoln","ellis"]})}});
  ok("two of three done: Tuesday is Lucy + the next two (3), not just Lucy", L(c,TUE)[0]==="lucy,julian,momdad", L(c,TUE));
  const k=mk({line:{caps:Object.assign({},caps3,{"1":4}),asOf:MON,log:logOf({[MON]:["lincoln"]})}});
  ok("a catch-up day (cap 4 on Tue) takes 4, Wednesday goes back to 3", L(k,TUE,2).join("|")==="ellis,lucy,julian,momdad|towels,lincoln,ellis", L(k,TUE,2));
}
console.log("3. 8 PM — today folds");
{ const c=mk({line:{caps:caps3,asOf:MON,log:logOf({[MON]:["lincoln"]})}});
  const before=c.llProject(MON,2,false), after=c.llProject(MON,2,true);
  ok("before 8 PM: tomorrow assumes today gets done (Julian, Mom & Dad, Towels)", before[1].loads.join()==="julian,momdad,towels", before[1].loads);
  ok("from 8 PM: Ellis + Lucy marked moved, tomorrow starts with them", after[0].moved.join()==="ellis,lucy"&&after[1].loads.join()==="ellis,lucy,julian", after.map(r=>[r.moved,r.loads]));
}
console.log("4. Started out of turn / a break / one pile is one load");
{ const c=mk({line:{caps:{"0":1,"1":1,"2":1,"3":1,"4":1,"5":1,"6":0},asOf:MON,log:logOf({[MON]:["julian"]})}});
  ok("cap 1, Julian started Monday instead: he fills Monday, Lincoln slides to Tue, Julian skipped this round", L(c,MON,6).join("|")==="julian|lincoln|ellis|lucy|momdad|towels", L(c,MON,6));
  const b=mk({line:{caps:caps3,asOf:MON},cal:{holidays:{h:{name:"Fall break",start:TUE,end:TUE,pause:"all"}},vacations:{}}});
  ok("a paused day takes nothing and the order waits", L(b,MON,3).join("|")==="lincoln,ellis,lucy||julian,momdad,towels", L(b,MON,3));
  const two=mk({line:{items:{a:{label:"A",order:0},b:{label:"B",order:1}},caps:{"0":4},asOf:MON}});
  ok("two loads, cap 4: the day has A and B once each — never the same load twice", L(two,MON)[0]==="a,b", L(two,MON));
  const w=mk({line:{caps:caps3,asOf:MON,carry:{0:"lucy",1:"lincoln"},next:"julian"}});
  ok("a carry Firebase handed back as {0:…,1:…} still reads in order", L(w,MON)[0]==="lucy,lincoln,julian", L(w,MON));
}
console.log("5. The roll, saved once a day");
{ const c=mk({day:THU,line:{caps:caps3,asOf:MON,log:logOf({[MON]:["lincoln"],[TUE]:["ellis"]})}});
  c.llRoll(); const w=c.writes[0]&&c.writes[0][2];
  ok("Thursday: one write — carry Lucy, Julian, Mom & Dad; next Towels; asOf Thursday", c.writes.length===1&&JSON.stringify(w.carry)==='["lucy","julian","momdad"]'&&w.next==="towels"&&w.asOf===THU, c.writes);
  ok("and the lay reads the same after it as before it", L(c,THU)[0]==="lucy,julian,momdad", L(c,THU));
  c.writes.length=0; c.llRoll(); ok("a second roll the same day writes nothing", c.writes.length===0);
  c.get('laundryLine={caps:'+JSON.stringify(caps3)+',asOf:"'+THU+'"}'); c.laundryLineOnValue(c.get("laundryLine")); ok("the listener rolls only when a day has passed", c.writes.length===0);
  const e=mk({day:THU}); e.laundryLineOnValue(null); ok("never set up: nothing written", e.writes.length===0);
  const s=mk({day:THU,line:{next:"ellis"}}); s.llRoll(); ok("Step-1 data with no asOf: the roll stamps asOf today, nothing else moves", s.writes.length===1&&s.writes[0][2].asOf===THU&&s.writes[0][2].next==="ellis"&&s.writes[0][2].carry===null, s.writes);
  const d=mk({day:THU,dry:true,line:{caps:caps3,asOf:MON}}); d.llRoll(); ok("dry run: rolls on this screen, writes nothing", d.writes.length===0&&d.get("laundryLine.asOf")===THU);
}
console.log("6. 🫧 Start");
{ const c=mk({line:{caps:caps3,asOf:MON}}); c.get("Date.now=function(){ return new Date(2026,9,19,9,5).getTime(); }"); c.llStart("lincoln");
  const set=c.writes.find(w=>w[0]==="set"), up=c.writes.find(w=>w[0]==="update");
  ok("the same laundry/<id> load Start a load makes: washer now, plus line + lineDay", set&&/^laundry\/l/.test(set[1])&&set[2].stage==="washer"&&set[2].label==="Lincoln's clothes"&&set[2].line==="lincoln"&&set[2].lineDay===MON, set);
  ok("and one laundryLine update: log/<today>/lincoln", up&&up[1]==="laundryLine"&&up[2]["log/"+MON+"/lincoln"]&&up[2]["log/"+MON+"/lincoln"].load===set[1].slice(8), up);
  ok("today now: Lincoln ✓, Ellis, Lucy", (r=>r.started.join()==="lincoln"&&r.loads.join()==="lincoln,ellis,lucy")(c.llProject(MON,1,false)[0]));
  c.writes.length=0; c.llStart("lincoln"); ok("Start again on the same load: nothing", c.writes.length===0);
  const lid=set[1].slice(8), l=c.get("laundryData")[lid]; c.llUnlog(lid,l);
  ok("✕ while it's in the washer: the log entry comes back out (one null)", c.writes.length===1&&c.writes[0][2]["log/"+MON+"/lincoln"]===null&&c.llProject(MON,1,false)[0].started.length===0, c.writes);
  c.writes.length=0; c.llUnlog(lid,Object.assign({},l,{stage:"dryer"})); ok("✕ on a load past the washer: the line keeps it", c.writes.length===0);
  const d=mk({dry:true,line:{caps:caps3,asOf:MON}}); d.llStart("ellis"); ok("dry run: nothing written", d.writes.length===0);
  const dd=mk({line:{caps:caps3,asOf:MON}}); dd.llStart("ellis","dad"); const ds=dd.writes.find(w=>w[0]==="set"); ok("from Dad's Day: the load is his (by:dad)", ds&&ds[2].by==="dad");
}
console.log("7. Mid-day change: re-lay today too / keep today");
{ const c=mk({line:{caps:caps3,asOf:MON}}); c.llCapStep(0,-1);
  ok("cap 3→2 on Monday morning: asks, today was Lincoln, Ellis, Lucy", c.__ask()&&c.__ask().before.join()==="lincoln,ellis,lucy", c.__ask());
  ok("the question is on the card", /That changes today's laundry/.test(c.llCardHTML())&&/llAskPick\(true\)/.test(c.llCardHTML()));
  c.writes.length=0; c.llAskPick(true);
  ok("Keep today: plan/<today> = the three, one write", c.writes.length===1&&JSON.stringify(c.writes[0][2])==='{"plan/'+MON+'":["lincoln","ellis","lucy"]}', c.writes);
  ok("today stays 3; the next Monday gets the new cap 2", L(c,MON)[0]==="lincoln,ellis,lucy"&&c.llProject(MON,8,false)[7].loads.length===2, L(c,MON,8));
  const r=mk({line:{caps:caps3,asOf:MON}}); r.llCapStep(0,-1); r.writes.length=0; r.llAskPick(false);
  ok("Re-lay today too: nothing more written, today is Lincoln, Ellis; Lucy slides", r.writes.length===0&&L(r,MON)[0]==="lincoln,ellis", L(r,MON));
  const t=mk({line:{caps:caps3,asOf:MON}}); t.llCapStep(1,1); ok("a change that doesn't touch today: no question", !t.__ask());
  const n=mk({min:20*60+5,line:{caps:caps3,asOf:MON}}); n.llCapStep(0,-1); ok("after 8 PM: no question (today is folded)", !n.__ask());
}
console.log("8. The grid + the chips");
{ const c=mk({day:TUE,line:{caps:caps3,asOf:MON,log:logOf({[MON]:["lincoln"],[TUE]:["ellis"]})}});
  const g=c.llWeekGridHTML(TUE,false,true), cells=g.split('border-radius:8px;padding:4px 1px').slice(1);
  ok("Monday (past) shows what really went in: ✓ Lincoln", /✓<\/span> Lincoln/.test(cells[0])&&!/Ellis/.test(cells[0]), cells[0]);
  ok("Today: ✓ Ellis, Lucy + Julian with 🫧 Start", /✓<\/span> Ellis/.test(cells[1])&&/llStart\('lucy'\)/.test(cells[1])&&/llStart\('julian'\)/.test(cells[1])&&!/llStart\('ellis'\)/.test(cells[1]));
  ok("a kid's device: no Start buttons", !/llStart\(/.test(c.llWeekGridHTML(TUE,false,false)));
  const e=c.llWeekGridHTML(TUE,true,true).split('border-radius:8px;padding:4px 1px').slice(1);
  ok("after 8 PM: Lucy, Julian shown → moved, Wednesday starts with them", /→ Lucy/.test(e[1])&&/→ Julian/.test(e[1])&&/>Lucy</.test(e[2])&&!/llStart\(/.test(e[1]));
  const s=c.llStripHTML("dad"); ok("chips under Start a load: Lucy + Julian, Dad's taps are his", /llStart\('lucy','dad'\)/.test(s)&&/llStart\('julian','dad'\)/.test(s)&&!/llStart\('ellis'/.test(s));
  ok("no chips until the line is set up", mk({day:TUE}).llStripHTML("")==="");
}
console.log("9. ▶ up next follows the live line");
{ const c=mk({day:TUE,line:{caps:caps3,asOf:MON,log:logOf({[MON]:["lincoln"],[TUE]:["ellis"]})}});
  ok("Tuesday, Lincoln + Ellis in: up next is Lucy (not the saved Lincoln)", c.llFront()==="lucy"&&/Lucy's clothes <span[^>]*>▶ up next/.test(c.llCardHTML()), c.llFront());
  const z=mk({line:{caps:{"0":0,"1":0,"2":0,"3":0,"4":0,"5":0,"6":0},next:"ellis"}}); ok("no laundry days at all: falls back to the saved next", z.llFront()==="ellis");
}
console.log("10. Wiring");
ok("laundryDel takes a washer line load back out of the log", /llUnlog\(id,l\)/.test(cut("function laundryDel(","\n}")));
ok("the Start a load box shows the line chips", /llStripHTML\(P\.dad\?'dad':''\)/.test(src));
ok("no 🔀", src.indexOf("🔀")<0);
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
