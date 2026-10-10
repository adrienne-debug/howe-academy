/*
 * 💦 WASHTODAY — "Wet or soiled" (her laundry system 2026-10-09, PR 1 of the Household plan; her yes 2026-10-09).
 * Mom-and-Dad-only row under Start a load: Towels · Sheets (king) · queen · Dog stuff → (a) a "Wash today" line on the 🧺 Laundry
 * card (stage bin, no clock) that goes 🫧 Start prewash → 🫧 Second wash → Dryer → Fold (wet things are washed twice),
 * (b) Sheets → "spare sheets on the king/queen" on Mom's (or Dad's) to-do. Nothing on any kid's page, list or log.
 * Every write targeted; config/routines never touched.                                            run: node test_wash_today.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":"")); } };
const fn=name=>{ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); return src.slice(i,src.indexOf("\n}",i)+2); };
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("missing "+a); return src.slice(i,j); };
const BLOCK=cut("// WASHTODAY_START","// WASHTODAY_END");
const LCORE=cut("const LAUNDRY_STAGES=","function laundryEditToggle(");   // stages, meta, times, doneAt
const MS=cut("// MOMSCHED_LAUNDRY_START","// MOMSCHED_LAUNDRY_END");
const ISO="2026-10-09";
function mk(o){
  o=o||{}; const ls={}, writes=[], renders=[];
  const ctx={console,Object,Array,String,Number,parseInt,isNaN,Math,JSON,Date,RegExp,Error,
    HA_LS:{getItem:k=>ls[k]||null,setItem:(k,v)=>{ ls[k]=v; }},
    db:o.nodb?null:{ref:p=>({set:v=>writes.push(["set",p,JSON.parse(JSON.stringify(v))]),update:v=>writes.push(["update",p,v]),remove:()=>writes.push(["rm",p])})},
    _dryRun:o.dry?()=>true:undefined,
    laundryData:o.laundry||{}, momdayData:{}, daddayData:{}, momBlocks:{}, laundryBlockMins:{},
    _todayStr:()=>ISO, mwTodayIso:()=>ISO, mwToast:()=>{}, momHere:()=>true, toMin:s=>0, cap:s=>s, esc:s=>String(s==null?"":s),
    checked:{}, _todayDay:"friday", day:"friday", tab:"moms-plan", kid:"mom", KID_NAME:{},
    document:{getElementById:()=>({})}, renderMomsPlan:()=>renders.push(1), renderAll:()=>renders.push(2),
    writes, renders, ls};
  vm.createContext(ctx);
  vm.runInContext(LCORE+"\n"+MS+"\n"+BLOCK+"\n"+fn("laundryAdvance")+"\n"+fn("laundryAdvanceLabel")+"\n"+fn("laundrySince")+"\nfunction laundryBlockDone(){}\n", ctx);
  return ctx;
}
const paths=w=>w.map(x=>x[1]);

console.log("Mom taps Sheets (king): a Wash-today line + a to-do");
{ const c=mk(); c.wtReport("mom","sheets","king");
  const w=c.writes; ok("two targeted writes", w.length===2, paths(w));
  const l=w.find(x=>x[1].startsWith("laundry/")); ok("laundry/<id> set, stage bin, wet", !!l&&l[0]==="set"&&l[2].stage==="bin"&&l[2].wet===true, l);
  ok("line reads '💦 Sheets (king) · <time>'", !!l&&/^💦 Sheets \(king\) · \d/.test(l[2].label), l&&l[2].label);
  ok("by mom, bed king", !!l&&l[2].by==="mom"&&l[2].bed==="king");
  const td=w.find(x=>x[1].startsWith("momday/"+ISO+"/todos/")); ok("momday/<iso>/todos/<id>: spare sheets on the king", !!td&&td[2].text==="🛏 Put the spare sheets on the king"&&td[2].done===false, td);
  ok("no dadday, no kid list, no log, no config", !w.some(x=>/^(dadday|oneoff|routineLog|config|week)/.test(x[1])));
  ok("Mom's Day re-rendered", c.renders.length===1);
  ok("local card has the line", Object.values(c.laundryData).some(x=>x.stage==="bin"));
}
console.log("queen; Dad's Day; towels and dog stuff");
{ const c=mk(); c.wtReport("mom","sheets","queen"); const td=c.writes.find(x=>/^momday/.test(x[1]));
  ok("queen → 'on the queen'", !!td&&/on the queen$/.test(td[2].text)&&c.writes[0][2].label.indexOf("(queen)")>0, td);
  const d=mk(); d.wtReport("dad","sheets"); const dt=d.writes.find(x=>/^dadday\//.test(x[1]));
  ok("from Dad's Day: dadday to-do, king by default, by dad", !!dt&&/on the king$/.test(dt[2].text)&&d.writes[0][2].by==="dad"&&!d.writes.some(x=>/^momday/.test(x[1])), paths(d.writes));
  ok("Dad's line says 'started by Dad'; Mom's does not", / · started by Dad$/.test(d.writes[0][2].label)&&!/started by/.test(c.writes[0][2].label), d.writes[0][2].label);
  const t=mk(); t.wtReport("mom","towels"); t.wtReport("dad","dog");
  ok("towels/dog: one laundry write each, no to-do, no bed", t.writes.length===2&&t.writes.every(x=>/^laundry\//.test(x[1])&&!x[2].bed)&&/^💦 Towels · /.test(t.writes[0][2].label)&&/^💦 Dog stuff · .* · started by Dad$/.test(t.writes[1][2].label), paths(t.writes));
  const u=mk(); u.wtReport("mom","nope"); ok("unknown kind: nothing", u.writes.length===0);
  const k=mk(); k.wtReport("lucy","towels"); ok("a kid id is treated as Mom (there is no kid button)", k.writes[0][2].by==="mom");
}
console.log("Prewash: bin → prewash → washer → dryer → fold; normal loads unchanged");
{ const c=mk({laundry:{a:{label:"💦 Sheets (king) · 7:40 AM",stage:"bin",ts:1000,wet:true},b:{label:"Towels",stage:"washer",ts:1000},f:{label:"Darks",stage:"fold",ts:1000}}});
  ok("labels", c.laundryAdvanceLabel("bin")==="🫧 Start prewash"&&c.laundryAdvanceLabel("prewash")==="🫧 Second wash"&&c.laundryAdvanceLabel("washer")==="→ Dryer");
  c.laundryAdvance("a"); let w=c.writes.filter(x=>x[1]==="laundry/a");
  ok("bin → prewash, set, fresh clock", w.length===1&&w[0][0]==="set"&&w[0][2].stage==="prewash"&&w[0][2].ts>1000, w);
  c.laundryAdvance("a"); w=c.writes.filter(x=>x[1]==="laundry/a");
  ok("prewash → washer (second wash), fresh clock", w.length===2&&w[1][2].stage==="washer"&&w[1][2].ts>1000, w);
  c.laundryAdvance("a"); w=c.writes.filter(x=>x[1]==="laundry/a"); ok("washer → dryer", w.length===3&&w[2][2].stage==="dryer");
  c.laundryAdvance("b"); ok("a normal washer load still goes to the dryer", c.writes.some(x=>x[1]==="laundry/b"&&x[2].stage==="dryer"));
  c.laundryAdvance("f"); ok("fold → put away still removes", c.writes.some(x=>x[1]==="laundry/f"&&x[0]==="rm"));
  ok("prewash has the washer clock; bin has none", c.laundryDoneAt({stage:"prewash",ts:0})===60*60000&&c.laundryDoneAt({stage:"bin",ts:0})===0);
  ok("wet trail is prewash → washer → dryer → fold", /const LAUNDRY_WET_STAGES=\["prewash","washer","dryer","fold"\]/.test(src));
}
console.log("Mom-schedule rows know a prewash");
{ const MID=(()=>{ const d=new Date(); d.setHours(0,0,0,0); return d.getTime(); })();
  const c=mk({laundry:{p:{label:"💦 Sheets (king)",stage:"prewash",ts:MID+8*3600e3,wet:true}}}); c._mlNowMin=()=>10*60;
  const rows=c.momSchedLaundry("friday",[]); const html=rows.map(r=>r.html).join("\n");
  ok("started marker says prewash", /in the washer \(prewash\)/.test(html), html.slice(0,200));
  ok("done marker asks to start the second wash", /prewash done/.test(html)&&/start the second wash/.test(html));
}
console.log("Same schedule as every load: once in the washer a wet load is a normal load");
{ const MID=(()=>{ const d=new Date(); d.setHours(0,0,0,0); return d.getTime(); })();
  const c=mk({laundry:{w:{label:"💦 Towels",stage:"washer",ts:MID+8*3600e3,wet:true},n:{label:"Darks",stage:"washer",ts:MID+8*3600e3}}}); c._mlNowMin=()=>10*60;
  const rows=c.momSchedLaundry("friday",[]); const wet=rows.filter(r=>/Towels/.test(r.html)), nrm=rows.filter(r=>/Darks/.test(r.html));
  ok("a wet load in the washer gets the same started + done rows as a normal load", wet.length===nrm.length&&wet.length===2, rows.map(r=>r.m));
  ok("same minute marks", JSON.stringify(wet.map(r=>r.m))===JSON.stringify(nrm.map(r=>r.m)));
  ok("same question: block out time to move it to the dryer?", /move it to the dryer/.test(wet[1].html)&&/move it to the dryer/.test(nrm[1].html));
  const b=mk({laundry:{w:{label:"💦 Towels",stage:"bin",ts:MID+8*3600e3,wet:true}}}); b._mlNowMin=()=>10*60;
  ok("still in the bin → not on the schedule yet (nothing is running)", b.momSchedLaundry("friday",[]).length===0);
}
console.log("Dry run / no db / wiring");
{ const c=mk({dry:true}); c.wtReport("mom","sheets"); ok("?dryrun=1 writes nothing", c.writes.length===0); ok("…but the line is on the local card", Object.values(c.laundryData).length===1);
  const c2=mk({nodb:true}); c2.wtReport("dad","towels"); ok("db null → no throw, no writes", c2.writes.length===0);
  const c3=mk(); const row=c3.wtRowHTML("mom");
  ok("row has Towels · Sheets (king) · queen · Dog stuff", /Towels/.test(row)&&/Sheets \(king\)/.test(row)&&/'sheets','queen'/.test(row)&&/Dog stuff/.test(row));
  ok("Dad's row reports as dad", /wtReport\('dad','sheets','king'\)/.test(c3.wtRowHTML("dad")));
  ok("strip shows the row under Start a load", /wtRowHTML\(who\)/.test(fn("momDayStripHTML")));
  ok("no kid pieces: Kids' Corner, step lists, routine log untouched", !/wtBoxHTML/.test(src)&&!/wtOneoffSteps/.test(src)&&!/oneoff/.test(src)&&!/routineLog/.test(BLOCK));
  ok("Laundry card draws the bin chip and the wet trail", /wash today/.test(fn("mdCardLaundry"))&&/LAUNDRY_WET_STAGES/.test(fn("mdCardLaundry")));
  ok("the schedule rows know a prewash; the NOW-card nudges are untouched (renderMomsDay byte-guarded elsewhere)", (src.match(/l\.stage!=="washer"&&l\.stage!=="dryer"&&l\.stage!=="prewash"/g)||[]).length===1&&(src.match(/if\(!l\|\|\(l\.stage!=="washer"&&l\.stage!=="dryer"\)\) return;/g)||[]).length===2);
  ok("no 🔀 in index.html", src.indexOf("🔀")<0);
}
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
