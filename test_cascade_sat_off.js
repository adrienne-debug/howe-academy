/*
 * 🅢 Saturday overflow switch honoured by the cascade (built from the off-days harness).
 *
 * Slices the REAL cascadeIntraWeek (+ its real helpers: packers, sticky order,
 * task metadata, catch-up caps) out of index.html, pins the clock, and asserts:
 *
 *   - overflow NEVER lands on a weekday absent from the week's date map
 *     (the bug that parked 13 tasks on beach-trip Thu/Fri of week14)
 *   - work stranded on a date-less day is swept back onto real school days
 *   - Saturday (date derived from Friday+1) still behaves: not swept as
 *     "nonexistent", still a legal overflow target in a full week
 *   - with NO date map loaded (pre-meta boot) the old behavior is preserved
 *   - a day that IS in the map but calendar-off for the kid stays skipped
 *
 *   run:  node test_cascade_offdays.js
 */
const fs = require("fs");
const path = require("path");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");

function slice(name) {
  const sig = "function " + name + "(";
  const i = src.indexOf(sig);
  if (i < 0) throw new Error("function not found: " + name);
  let d = 0, j = src.indexOf("{", i);
  for (let k = j; k < src.length; k++) {
    if (src[k] === "{") d++;
    else if (src[k] === "}") { d--; if (d === 0) return src.slice(i, k + 1); }
  }
  throw new Error("unbalanced braces: " + name);
}
const FNS = [
  "toMin", "fromMin", "_parseCheckTs", "_dismissed", "_normOrderArr",
  "taskDevice", "taskSubject", "taskTier", "capFor", "capForDisplay", "catchupDayCap", "isCatchupCapped",
  "subjNoCarry", "applyStickyOrder", "packDay", "packAround",
  "cascadeIntraWeek"
].map(slice).join("\n");

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log("  ok  - " + name); }
  else { fail++; console.log("  FAIL- " + name + (extra !== undefined ? "  (" + JSON.stringify(extra) + ")" : "")); }
}

// Frozen clock helper — cascadeIntraWeek derives "today" from new Date()
const RealDate = Date;
function frozenDate(iso) {
  return class Frozen extends RealDate {
    constructor(...a) { if (a.length === 0) super(iso + "T09:00:00"); else super(...a); }
    static now() { return new RealDate(iso + "T09:00:00").getTime(); }
  };
}

function mkTask(id, day, time, opts) {
  return Object.assign({ id, who: "lincoln", day, time, dur: 25, device: "paper", mom: "none",
    title: "\u{1F4C4} Subject " + id + " — L" + id, subjectKey: "subj_" + id.replace(/[^a-z0-9]/gi, "") }, opts || {});
}

function runCascade(cfg) {
  const writes = [];
  const env = {
    DAY_DT: cfg.dates, WK: "week14", ROSTER: ["lincoln", "ellis", "lucy", "julian"],
    weekData: { tasks: cfg.tasks }, checked: cfg.checked || {}, claimed: cfg.claimed || {},
    histState: {}, momMoves: {}, currData: { subjects: { lincoln: {}, ellis: {}, lucy: {}, julian: {} } },
    rulesData: cfg.rules || {}, fbCurrLoaded: true,
    _cascNowMin: cfg.nowMin || 9 * 60, DEFAULT_DAY_CAP: 2,
    smapIsKidOff: cfg.kidOff || (() => null),
    schedOv: () => null, schedOvKidOff: () => null,
    satCutoffMin: () => null, satApplyCutoff: () => {},
    sv: () => {}, dbg: () => {}, renderAll: () => {}, safeWriteTasks: () => {},
    lockHeldByOther: cfg.lockHeld ? (() => true) : (() => false),
    _dryRun: () => true,
    db: { ref: p => ({ update: o => { writes.push({ p, o }); return Promise.resolve(); }, set: () => Promise.resolve() }) },
    Date: frozenDate(cfg.today),
    console, JSON, Math, Object, Array, Set, Map, String, Number, parseInt, isNaN, Promise,
  };
  const keys = Object.keys(env);
  const fn = new Function(...keys, "\"use strict\";" + FNS + "; cascadeIntraWeek(" + (cfg.sweepToday ? "true" : "") + "); return null;");
  fn(...keys.map(k => env[k]));
  return { tasks: cfg.tasks, writes };
}

const daysOf = tasks => { const m = {}; tasks.forEach(t => { m[t.day] = (m[t.day] || 0) + 1; }); return m; };
const mins = x => { const m = /(\d+):(\d+)\s*(AM|PM)/.exec(x || ""); if (!m) return 0; return (parseInt(m[1]) % 12 + (m[3] === "PM" ? 12 : 0)) * 60 + parseInt(m[2]); };

const WEEK5 = { monday: "September 28", tuesday: "September 29", wednesday: "September 30", thursday: "October 1", friday: "October 2" };
const END=16*60+15;
function heavyWeek(){ const tasks=[]; for(let i=0;i<22;i++) tasks.push(mkTask("m"+i,"monday","10:00 AM")); ["tuesday","wednesday","thursday","friday"].forEach(d=>{ for(let i=0;i<10;i++) tasks.push(mkTask(d.slice(0,2)+i,d,"10:00 AM")); }); return tasks; }

console.log("🅢 switch ON (default, unset) — unchanged: Saturday still takes overflow");
{ const r=runCascade({dates:WEEK5,today:"2026-09-29",tasks:heavyWeek()}); const d=daysOf(r.tasks);
  ok("Saturday receives swept work when the switch is on",(d.saturday||0)>0,d); }

console.log("🅢 switch OFF — Saturday is never a receiving day; nothing runs past the end; the rest carries to next week");
{ const r=runCascade({dates:WEEK5,today:"2026-09-29",tasks:heavyWeek(),rules:{saturdayOverflow:false}}); const d=daysOf(r.tasks);
  ok("no card on Saturday",!d.saturday,d);
  const placed=r.tasks.filter(t=>!t._eowOverflow);
  ok("no placed card ends after 4:15 PM (no overtime valve)",placed.every(t=>mins(t.time)+(t.dur||20)<=END),placed.filter(t=>mins(t.time)+(t.dur||20)>END).map(t=>t.day+" "+t.time).slice(0,5));
  ok("what did not fit is flagged for next week (Mom's box), not dropped",r.tasks.some(t=>t._eowOverflow)&&r.tasks.length===heavyWeek().length,[r.tasks.filter(t=>t._eowOverflow).length,r.tasks.length]);
  ok("Thursday/Friday still fill first",(d.thursday||0)>10&&(d.friday||0)>10,d); }

console.log("🅢 switch OFF heals cards the cascade already swept onto Saturday (the 13 live cards, 10/1)");
{ const mk=()=>[mkTask("t1","tuesday","10:00 AM"),mkTask("w1","wednesday","10:00 AM"),
    mkTask("s1","saturday","10:00 AM",{cascadedFrom:"monday"}),mkTask("s2","saturday","10:25 AM",{cascadedFrom:"friday"}),
    mkTask("own","saturday","10:00 AM")];   // laid on Saturday on purpose (no cascadedFrom) — left alone
  const tasks=mk();
  const r=runCascade({dates:WEEK5,today:"2026-09-29",tasks,rules:{saturdayOverflow:false}});
  const s1=r.tasks.find(t=>t.id==="s1"), s2=r.tasks.find(t=>t.id==="s2"), own=r.tasks.find(t=>t.id==="own");
  ok("swept Saturday cards come back onto weekdays",s1.day!=="saturday"&&s2.day!=="saturday"&&["tuesday","wednesday","thursday","friday"].includes(s1.day),[s1.day,s2.day]);
  ok("a Saturday card laid on purpose stays",own.day==="saturday",own.day);
  const r2=runCascade({dates:WEEK5,today:"2026-09-29",tasks:mk(),rules:{}});
  ok("…but with the switch on they are left where they are",r2.tasks.find(t=>t.id==="s1").day==="saturday"); }

console.log("wiring");
ok("the cascade reads the same switch as the generator",/const _satOk=\(typeof rulesData==="undefined"\|\|!rulesData\|\|rulesData\.saturdayOverflow!==false\);/.test(src));
ok("sweep loop skips Saturday when off",/if\(dn==="saturday"&&!_satOk\) continue; \/\/ 🅢 Saturday overflow off — not a receiving day/.test(src));
ok("no overtime valve when off",/allowOvertime:isLast&&_satOk,overtimeMax:240/.test(src));
ok("safety net carries instead of stacking when off",/if\(_cut!=null\|\|!_satOk\)\{ t\._eowOverflow=true; break; \}/.test(src));
ok("notebook pass skips Saturday when off",/if\(ds&&smapIsKidOff\(nb\.who,ds\)\) continue;\n\s*if\(dn==="saturday"&&!_satOk\) continue;/.test(src));
ok("swept Saturday cards re-enter the pool when off",/if\(!_satOk&&t\.day==="saturday"&&t\.cascadedFrom&&t\.cascadedFrom!=="saturday"\)\{/.test(src));
console.log("\n" + pass + " passed, " + fail + " failed"); process.exit(fail ? 1 : 0);
