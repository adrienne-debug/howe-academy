/* 🕰 School-day drill clock + return-day softener (her yes 2026-10-05).  run: node test_school_day_clock.js
   The drill number is now THIS kid's count of school days (pace-plan days of the week, minus family holidays,
   vacations and the kid's own day-off overrides) — no longer the family-wide print counter that ticked whenever
   ANY kid logged a drill. Fixture calendar only; touches no live data. */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":"")); } };
const fn=name=>{ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); return src.slice(i,src.indexOf("\n}",i)+2); };
const blk=(a,z)=>{ const i=src.indexOf(a); if(i<0) throw new Error("missing "+a); return src.slice(i,src.indexOf(z,i)); };
const ctx={}; vm.createContext(ctx);
vm.runInContext(`
  var MAST_TIER_ORDER=["daily","every_other_day","every_third_day","weekly","bi_weekly","monthly","learned","graduated"];
  var MAST_TIER_INT={daily:1,every_other_day:2,every_third_day:3,weekly:7,bi_weekly:14,monthly:28,learned:60,graduated:null};
  var calendarData={holidays:{lab:{start:"2026-09-07"},xmas:{start:"2026-12-21",end:"2027-01-02"}},
                    vacations:{dis:{start:"2026-12-17",end:"2026-12-25"}},
                    kidOverrides:{ellis:{"2026-09-01":{school:false}},lincoln:{"2026-10-10":{school:true}}}};
  var paceData={plans:{s:{start:"2026-04-20",end:"2026-09-01",kids:["lucy"],schoolDays:["Mon","Tue","Wed","Thu"]}}};
  var masteryKid="ellis", masteryData={}, SETTINGS={max_per_cat:5,cat_caps:{},max_learn_per_drill:0,max_overdue_per_drill:0};
  function mastDrillSettings(){ return SETTINGS; } function mastIsNeverDrill(){ return false; } function mastIsParked(i){ return i.status==="parked"; }
  `+fn("calToday")+"\n"+fn("getSchoolDays")+"\n"+blk("const MAST_CLOCK_EPOCH","\n// ── Ladder slot scheduling")+"\n"+fn("mastIsDue")+"\n"+blk("function mastDueItems","\nlet mastLogMode"),ctx);
const run=e=>vm.runInContext(e,ctx);
const n=(k,d)=>run(`mastSchoolDayNum(${JSON.stringify(k)},${JSON.stringify(d)})`);
ok("a normal Mon→Mon week ticks 5", n("lucy","2026-10-12")-n("lucy","2026-10-05")===5, n("lucy","2026-10-12")-n("lucy","2026-10-05"));
ok("weekend reads the same as Friday", n("lucy","2026-10-10")===n("lucy","2026-10-09")&&n("lucy","2026-10-11")===n("lucy","2026-10-09"));
ok("a holiday doesn't tick (Labor Day)", n("ellis","2026-09-07")===n("ellis","2026-09-04"));
ok("a vacation freezes the clock (Disney + Christmas break)", n("lucy","2027-01-04")-n("lucy","2026-12-16")===1, n("lucy","2027-01-04")-n("lucy","2026-12-16"));
ok("a kid's own day off doesn't tick for THAT kid only", n("ellis","2026-09-01")-n("ellis","2026-08-31")===0 && n("lincoln","2026-09-01")-n("lincoln","2026-08-31")===1);
// Known limit, inherited from getSchoolDays (shared with the Pace page): a per-kid "school" override on a
// weekend is ignored — weekends never tick even for a Saturday make-up day.
ok("weekend school-override doesn't tick (same rule as the Pace page's school-day count)", n("lincoln","2026-10-10")===n("lincoln","2026-10-09"));
ok("pace-plan school days are honoured (Lucy's Mon–Thu summer: Friday doesn't tick)", n("lucy","2026-08-21")===n("lucy","2026-08-20") && n("ellis","2026-08-21")-n("ellis","2026-08-20")===1);
ok("each kid's clock is their own — no shared counter", run(`mastGetPrintNum("ellis")`)!==undefined && n("ellis","2026-09-02")!==n("lincoln","2026-09-02"));
ok("mastGetPrintNum(kid) is that kid's school-day number today", run(`mastGetPrintNum("lucy")===mastSchoolDayNum("lucy",calToday())`));
ok("before the epoch reads 0", n("ellis","2025-12-31")===0);
// softener
run(`var mk=(id,nd)=>({id:id,subject:"S",status:"active",tier:"weekly",next_due:nd});
  masteryData.ellis=[mk("a",90),mk("b",95),mk("c",97),mk("d",100),mk("e",100),mk("f",101),{id:"i1",subject:"S",status:"introduction",tier:"daily"}];`);
const ids=()=>run(`mastDueItems("ellis",100).map(i=>i.id).join(",")`);
run("SETTINGS.max_overdue_per_drill=0"); ok("softener OFF (default) → every overdue review rides", ids()==="a,b,c,d,e", ids());
run("SETTINGS.max_overdue_per_drill=2"); ok("softener 2 → two oldest overdue + today's + learning; the rest wait", ids()==="a,b,d,e,i1", ids());
run("SETTINGS.max_overdue_per_drill=0");
ok("softener defaults to OFF for every kid", /max_overdue_per_drill:s\.max_overdue_per_drill\?\?0/.test(src));
ok("Drill Rules has the stepper (0 = off)", /key:"max_overdue_per_drill",label:"Max Overdue Reviews \/ Drill"[^\n]*min:0/.test(src));
ok("retrieval re-check gates read the same per-kid clock", /function retrPnForDate\(dateStr,kid\)\{ return mastSchoolDayNum\(kid\|\|masteryKid,dateStr\); \}/.test(src)&&/const todayPn=retrTodayPn\(kid\);/.test(src));
ok("unit enroll books 'already known' cards relative to today, not on absolute slots", /next_due:\(\(typeof mastGetPrintNum==="function"\)\?mastGetPrintNum\(kid\):1\)\+1\+\(wk\?/.test(src)&&!/next_due:2\+\(wk\?/.test(src));
ok("no call site reads a sibling's number (dashboard card passes the card's kid)", /mstPile\(t\.who,_dlSub\.study,mastGetPrintNum\(t\.who\),/.test(src));
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
