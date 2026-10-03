/*
 * Node tests — 👨‍👩‍👧 FAMILY TIME (FAMBLOCK, step 1). Her ask 2026-10-03, DeWalt first:
 * History, Science and Read Aloud together right after lunch, all four kids, Mom checks it off once.
 *
 * Checks, against code sliced verbatim out of index.html:
 *   1. the layout — back to back from lunch END (per-day override honoured), days / item days / off / set time
 *   2. who gets cards — members only, has school, not marked off, home from a timed co-op by the start
 *   3. the DAY BUILD — the real class partition + the real family block + the real packer: family cards at
 *      the block's time, and no kid's other card (nor any Mom-required card) inside the family window
 *   4. no blocks defined → the day build is byte-identical to the code before this change (randomized)
 *   5. a RE-PACK (packAround with fxDate) re-pins a family card to its block and packs around it
 *   6. day-bound (subjNoCarry), siblings for the one-tap check-off
 *
 *   run:  node test_family_block.js          (reads ./index.html; set FAM_BASE=<old index.html> for check 4)
 */
const fs = require("fs");
const path = require("path");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const base = process.env.FAM_BASE ? fs.readFileSync(process.env.FAM_BASE, "utf8") : null;

function extractFn(name, from) {
  from = from || src;
  const i = from.indexOf("function " + name + "(");
  if (i < 0) throw new Error("not found: " + name);
  let depth = 0, started = false;
  for (let k = from.indexOf("{", i); k < from.length; k++) {
    const c = from[k];
    if (c === "{") { depth++; started = true; }
    else if (c === "}") { depth--; if (started && depth === 0) return from.slice(i, k + 1); }
  }
  throw new Error("unbalanced: " + name);
}
function slice(a, b, from) {
  from = from || src;
  const i = from.indexOf(a); if (i < 0) throw new Error("slice start not found: " + a);
  const j = from.indexOf(b, i); if (j < 0) throw new Error("slice end not found: " + b);
  return from.slice(i, j);
}
let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log("  ok  - " + name); }
  else { fail++; console.log("  FAIL- " + name + (extra !== undefined ? "  (" + JSON.stringify(extra) + ")" : "")); }
}

const toMin = (t) => {
  if (t == null) return NaN;
  const m = String(t).trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!m) return NaN;
  let h = parseInt(m[1], 10); const mi = parseInt(m[2], 10);
  const ap = (m[3] || "").toUpperCase();
  if (ap === "PM" && h !== 12) h += 12;
  if (ap === "AM" && h === 12) h = 0;
  return h * 60 + mi;
};
const fromMin = (v) => { let h = Math.floor(v / 60), m = v % 60; const ap = h >= 12 ? "PM" : "AM"; let hh = h % 12; if (hh === 0) hh = 12; return hh + ":" + String(m).padStart(2, "0") + " " + ap; };
const fbArr = (v) => { if (!v) return v; if (Array.isArray(v)) return v; if (typeof v === "object") { const k = Object.keys(v); if (k.length && k.every(x => /^\d+$/.test(x))) return k.sort((a, b) => a - b).map(x => v[x]); } return v; };
const cap = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
const taskDevice = (t) => t.device || "paper";
const gwDeviceCaps = () => ({ screen: 2, computer: 1, ipadLucy: 1 });
const ROSTER = ["taylor", "makenzie", "andrew", "caleb"];

const FAM = slice("// FAMBLOCK_START", "// FAMBLOCK_END");
const FX_DOW_SRC = 'const FX_DOW={monday:"Mon",tuesday:"Tue",wednesday:"Wed",thursday:"Thu",friday:"Fri",saturday:"Sat",sunday:"Sun"};';
if (src.indexOf(FX_DOW_SRC) < 0) throw new Error("FX_DOW changed — update this test");

// An environment holding the REAL family helpers + class helpers + packer; ENV fields are the app globals.
function makeEnv(ENV) {
  const f = new Function("toMin", "fromMin", "fbArr", "cap", "taskDevice", "gwDeviceCaps", "ROSTER", "ENV", `
    var rulesData=ENV.rulesData, weekData=ENV.weekData||{tasks:[]}, currData=ENV.currData||{subjects:{}};
    function smapIsKidOff(k,ds){ return !!(ENV.off&&ENV.off[k+"|"+ds]); }
    function coopTimedEndMin(k,ds){ return (ENV.coop&&ENV.coop[k+"|"+ds])||0; }
    function gwGetSubjects(k){ return (currData.subjects||{})[k]||{}; }
    ${FX_DOW_SRC}
    ${extractFn("fxIsClass")} ${extractFn("fxDateList")} ${extractFn("fxRunsOn")} ${extractFn("fxWindow")}
    ${extractFn("fxLaneOf")} ${extractFn("fxSplitDay")} ${extractFn("fxCtxWithClasses")}
    ${extractFn("packDay")} ${extractFn("packAround")} ${extractFn("subjNoCarry")}
    ${FAM}
    return {famLayout,famDayCards,famWindowOf,famSiblings,famIsCard,famStartMin,famKidIn,packAround,subjNoCarry,fxSplitDay};
  `);
  return f(toMin, fromMin, fbArr, cap, taskDevice, gwDeviceCaps, ROSTER, ENV);
}

// DeWalt as it is: lunch 12:00–1:00, school 9:00–4:00. The block she described.
const SD = { defaultStart: "9:00 AM", defaultEnd: "4:00 PM", lunchStart: "12:00 PM", lunchEnd: "1:00 PM" };
const BLOCK = { name: "Family Time", kids: ROSTER.slice(), days: ["Mon", "Tue", "Wed", "Thu", "Fri"], at: "lunch",
  items: [{ key: "hist", name: "History", minutes: 30 }, { key: "sci", name: "Science", minutes: 30 }, { key: "ra", name: "Read Aloud", minutes: 20 }] };
const rules = (blocks, sd) => ({ schoolDay: Object.assign({}, SD, sd || {}), familyBlocks: blocks });

console.log("1. layout");
{
  const E = makeEnv({ rulesData: rules({ fb1: BLOCK }) });
  const L = E.famLayout(BLOCK, "monday").map(x => [x.it.name, fromMin(x.s), fromMin(x.e)]);
  ok("Mon: History 1:00, Science 1:30, Read Aloud 2:00–2:20", JSON.stringify(L) === JSON.stringify([["History", "1:00 PM", "1:30 PM"], ["Science", "1:30 PM", "2:00 PM"], ["Read Aloud", "2:00 PM", "2:20 PM"]]), L);
  const E2 = makeEnv({ rulesData: rules({ fb1: BLOCK }, { overrides: { wednesday: { lunchEnd: "1:30 PM" } } }) });
  ok("per-day lunch override moves the block (Wed lunch ends 1:30 → starts 1:30)", fromMin(E2.famLayout(BLOCK, "wednesday")[0].s) === "1:30 PM");
  ok("…and only that day (Tue still 1:00)", fromMin(E2.famLayout(BLOCK, "tuesday")[0].s) === "1:00 PM");
  ok("not on a day the block skips (Sat)", E.famLayout(BLOCK, "saturday").length === 0);
  const rot = Object.assign({}, BLOCK, { items: [{ key: "hist", name: "History", minutes: 30, days: ["Mon", "Wed", "Fri"] }, { key: "sci", name: "Science", minutes: 30, days: ["Tue", "Thu"] }, { key: "ra", name: "Read Aloud", minutes: 20 }] });
  const tue = E.famLayout(rot, "tuesday").map(x => x.it.name + "@" + fromMin(x.s));
  ok("item days: Tue = Science 1:00 then Read Aloud 1:30 (no gap where History would be)", JSON.stringify(tue) === JSON.stringify(["Science@1:00 PM", "Read Aloud@1:30 PM"]), tue);
  ok("set time instead of lunch", fromMin(E.famLayout(Object.assign({}, BLOCK, { at: "10:30 AM" }), "monday")[0].s) === "10:30 AM");
  ok("a block turned off lays nothing", E.famLayout(Object.assign({}, BLOCK, { off: true }), "monday").length === 0);
  const fbItems = Object.assign({}, BLOCK, { items: { 0: BLOCK.items[0], 1: BLOCK.items[1] } });
  ok("items stored as a Firebase numeric-key object still read in order", E.famLayout(fbItems, "monday").map(x => x.it.key).join() === "hist,sci");
}

console.log("2. who gets cards");
{
  const all = () => true;
  let E = makeEnv({ rulesData: rules({ fb1: BLOCK }) });
  let C = E.famDayCards("monday", "2026-10-05", all);
  ok("Mon: 4 kids × 3 subjects = 12 cards", C.length === 12, C.length);
  ok("every copy of History is at 1:00", C.filter(c => c.k === "hist").every(c => fromMin(c.s) === "1:00 PM"));
  ok("card title + who's in it", C[0].title.indexOf("History") > 0 && /together: Taylor, Makenzie, Andrew, Caleb/.test(C[0].detail), C[0]);
  const coop = {}; ROSTER.forEach(k => coop[k + "|2026-10-08"] = toMin("2:00 PM"));
  E = makeEnv({ rulesData: rules({ fb1: BLOCK }), coop });
  ok("co-op Thursday (out until 2:00) → no 1:00 family time", E.famDayCards("thursday", "2026-10-08", all).length === 0);
  E = makeEnv({ rulesData: rules({ fb1: BLOCK }), off: { "andrew|2026-10-06": 1 } });
  C = E.famDayCards("tuesday", "2026-10-06", all);
  ok("Andrew marked off → 3 kids, 9 cards, his name not on them", C.length === 9 && !C.some(c => c.who === "andrew") && !/Andrew/.test(C[0].detail), C.length);
  C = E.famDayCards("monday", "2026-10-05", k => k !== "caleb");
  ok("a kid with no school that day gets none", C.length === 9 && !C.some(c => c.who === "caleb"));
  const pair = Object.assign({}, BLOCK, { name: "Girls", kids: ["taylor", "makenzie"], at: "10:00 AM", items: [{ key: "x", name: "Latin", minutes: 20 }] });
  E = makeEnv({ rulesData: rules({ fb1: BLOCK, fb2: pair }) });
  C = E.famDayCards("monday", "2026-10-05", all);
  ok("a second block for just two kids adds only their cards", C.filter(c => c.b === "fb2").map(c => c.who).join() === "taylor,makenzie" && C.length === 14);
  ok("not a roster kid → ignored", makeEnv({ rulesData: rules({ fb1: Object.assign({}, BLOCK, { kids: ["taylor", "lincoln"] }) }) }).famDayCards("monday", "2026-10-05", all).every(c => c.who === "taylor"));
  ok("no blocks → nothing", makeEnv({ rulesData: { schoolDay: SD } }).famDayCards("monday", "2026-10-05", all).length === 0);
  ok("rules not loaded → nothing (no crash)", makeEnv({ rulesData: null }).famDayCards("monday", "2026-10-05", all).length === 0);
}

console.log("3. the day build (real partition + family block + packer)");
const PARTITION = slice("  const fxBusy={}, fxMomBusy=[], fxLaneBusy={}, toPack=[];", "  // Place everything through the shared packer");
if (PARTITION.indexOf("famDayCards") < 0) throw new Error("family block not inside the partition slice — update this test");
const EMIT = slice("  famCards.forEach(function(fc){\n    tasks.push(", "  tasks.sort((a,b)=>toMin(a.time)-toMin(b.time));");
function makeDayRunner(from, withFam) {
  const part = slice("  const fxBusy={}, fxMomBusy=[], fxLaneBusy={}, toPack=[];", "  // Place everything through the shared packer", from);
  return new Function("toMin", "fromMin", "fbArr", "cap", "taskDevice", "gwDeviceCaps", "ROSTER", "ENV", "ARG", `
    var rulesData=ENV.rulesData, weekData={tasks:[]};
    function smapIsKidOff(k,ds){ return !!(ENV.off&&ENV.off[k+"|"+ds]); }
    function coopTimedEndMin(k,ds){ return (ENV.coop&&ENV.coop[k+"|"+ds])||0; }
    ${FX_DOW_SRC}
    ${extractFn("packDay", from)} ${extractFn("packAround", from)}
    ${extractFn("fxIsClass", from)} ${extractFn("fxDateList", from)} ${extractFn("fxRunsOn", from)} ${extractFn("fxWindow", from)} ${extractFn("fxLaneOf", from)}
    ${withFam ? FAM : ""}
    const items=ARG.items, meta=ARG.meta, dayConfig=ARG.dayConfig, dayName=ARG.dayName, kidAssignments=ARG.kidAssignments;
    const kidStart={}, isSitter=false, sitterEnd=0, schoolStart=ARG.schoolStart, cutoff=ARG.cutoff;
    const r={lunchStart:ARG.lunchStart,lunchEnd:ARG.lunchEnd};
    let counter=1000; const prefix="d_"; const tasks=[]; function dbg(){}
    for(const k in (ARG.kidStart||{})) kidStart[k]=ARG.kidStart[k];
${part}
    const overflow=packAround([],toPack,{start:schoolStart,end:cutoff,lunchStart:r.lunchStart,lunchEnd:r.lunchEnd,
      kidStart:kidStart,momStart:0,busy:fxBusy,momBusy:fxMomBusy,laneBusy:fxLaneBusy,lanes:["computer","screen","ipadLucy","keyboard"],laneCap:gwDeviceCaps()});
    const overflowSet=new Set(overflow);
    items.forEach(function(it){ tasks.push({id:it.id,who:it.who,time:it.time,dur:it.dur,mom:it.mom,device:it.device}); });
    ${withFam ? EMIT : ""}
    return {tasks:tasks,overflow:overflow.map(function(x){return x.id;})};
  `);
}
const runFam = makeDayRunner(src, true);
function buildDay(defs, ENV, opts) {
  opts = opts || {};
  const items = [], meta = {}, kidAssignments = {};
  defs.forEach((d, i) => {
    const id = "t" + i, s = { minutes: d.min, mom: d.mom || "none", device: d.device || "paper", rules: d.rules || "" };
    items.push({ id, who: d.kid, device: s.device, dur: d.min, mom: s.mom });
    meta[id] = { kid: d.kid, key: "k" + i, excelVal: 1, s };
    (kidAssignments[d.kid] = kidAssignments[d.kid] || {})["k" + i] = 1;
  });
  return (opts.runner || runFam)(toMin, fromMin, fbArr, cap, taskDevice, gwDeviceCaps, ROSTER, ENV, {
    items, meta, kidAssignments, dayConfig: { dateStr: opts.ds || "2026-10-05" }, dayName: opts.dayName || "monday",
    schoolStart: toMin("9:00 AM"), cutoff: toMin("5:00 PM"), lunchStart: toMin("12:00 PM"), lunchEnd: toMin("1:00 PM"), kidStart: opts.kidStart });
}
const overlap = (a, b) => toMin(a.time) < toMin(b.time) + b.dur && toMin(b.time) < toMin(a.time) + a.dur;
{
  // A realistic DeWalt Monday: each kid ~5 h of work incl. Mom-required lessons (enough to run past 1:00).
  const defs = [];
  [["taylor", [30, 20, 20, 30, 20, 30, 20, 30, 30]], ["makenzie", [10, 30, 30, 20, 20, 10, 20, 20, 30]], ["andrew", [10, 30, 20, 10, 20, 20, 20, 30]], ["caleb", [20, 15, 15, 20, 20, 15, 15]]]
    .forEach(([k, ms]) => ms.forEach((m, i) => defs.push({ kid: k, min: m, mom: i % 3 === 1 ? "required" : "none" })));
  const R = buildDay(defs, { rulesData: rules({ fb1: BLOCK }) });
  const fam = R.tasks.filter(t => t.famBlock), rest = R.tasks.filter(t => !t.famBlock);
  ok("12 family cards emitted", fam.length === 12, fam.length);
  ok("each kid: History 1:00 · Science 1:30 · Read Aloud 2:00", ROSTER.every(k => fam.filter(t => t.who === k).map(t => t.title.replace(/^\S+ /, "") + "@" + t.time).join() === "History@1:00 PM,Science@1:30 PM,Read Aloud@2:00 PM"));
  ok("family cards: famBlock/famItem stamped, no subjectKey, mom none, unique ids", fam.every(t => t.famBlock === "fb1" && t.famItem && !t.subjectKey && t.mom === "none") && new Set(R.tasks.map(t => t.id)).size === R.tasks.length);
  const clash = rest.filter(t => t.time && fam.some(f => f.who === t.who && overlap(t, f)));
  ok("no kid has other work inside family time", clash.length === 0, clash.map(t => t.who + " " + t.time));
  const momClash = rest.filter(t => t.mom === "required" && t.time && toMin(t.time) < toMin("2:20 PM") && toMin(t.time) + t.dur > toMin("1:00 PM"));
  ok("no Mom-required lesson (any kid) inside family time — Mom is leading it", momClash.length === 0, momClash.map(t => t.who + " " + t.time));
  ok("work still continues after family time (2:20 on)", rest.some(t => t.time && toMin(t.time) >= toMin("2:20 PM")));
  const lunch = rest.filter(t => t.time && toMin(t.time) < toMin("1:00 PM") && toMin(t.time) + t.dur > toMin("12:00 PM"));
  ok("lunch still clear", lunch.length === 0, lunch.map(t => t.who + " " + t.time));
  // CONTROL: without a block the same day DOES put work in 1:00–2:20 — so the checks above prove something
  const R0 = buildDay(defs, { rulesData: rules({}) });
  ok("control: with no block, work lands inside 1:00–2:20", R0.tasks.some(t => t.time && toMin(t.time) < toMin("2:20 PM") && toMin(t.time) + t.dur > toMin("1:00 PM")));
  // co-op Thursday: nobody gets family time, the day packs as before
  const coop = {}; ROSTER.forEach(k => coop[k + "|2026-10-08"] = toMin("2:00 PM"));
  const RT = buildDay(defs, { rulesData: rules({ fb1: BLOCK }), coop }, { ds: "2026-10-08", dayName: "thursday" });
  ok("co-op Thursday: no family cards", RT.tasks.filter(t => t.famBlock).length === 0);
}

console.log("4. no blocks → identical to the code before this change");
if (base) {
  const runBase = makeDayRunner(base, false);
  let diffs = 0, n = 0, seed = 7;
  const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  for (let trial = 0; trial < 3000; trial++) {
    const defs = []; ROSTER.forEach(k => { const c = 3 + Math.floor(rnd() * 9); for (let i = 0; i < c; i++) defs.push({ kid: k, min: [10, 15, 20, 30, 45][Math.floor(rnd() * 5)], mom: rnd() < 0.3 ? "required" : (rnd() < 0.2 ? "maybe" : "none"), device: rnd() < 0.2 ? "computer" : "paper" }); });
    const env = { rulesData: rnd() < 0.5 ? { schoolDay: SD } : null };
    const a = buildDay(defs, env), b = buildDay(defs, env, { runner: runBase });
    n++; if (JSON.stringify(a) !== JSON.stringify(b)) diffs++;
  }
  ok("3000 randomized days: 0 differences vs the old day build", diffs === 0, diffs);
} else console.log("  (skipped — set FAM_BASE to the pre-change index.html)");

console.log("5. a re-pack re-pins family time");
{
  const E = makeEnv({ rulesData: rules({ fb1: BLOCK }) });
  const famT = { id: "f1", who: "andrew", day: "monday", time: "11:00 AM", dur: 30, title: "x History", mom: "none", device: "paper", famBlock: "fb1", famItem: "hist" };
  const work = [1, 2, 3, 4, 5, 6, 7, 8].map(i => ({ id: "w" + i, who: "andrew", day: "monday", time: "9:00 AM", dur: 30, mom: "none", device: "paper" }));
  const momOther = [1, 2, 3, 4, 5, 6, 7, 8].map(i => ({ id: "m" + i, who: "taylor", day: "monday", time: "9:00 AM", dur: 30, mom: "required", device: "paper" }));
  const all = [famT].concat(work, momOther);
  E.packAround([], all, { start: toMin("9:00 AM"), end: toMin("5:00 PM"), lunchStart: toMin("12:00 PM"), lunchEnd: toMin("1:00 PM"), fxDate: "2026-10-05", fxDay: "monday", lanes: ["computer"] });
  ok("family card back at its block time (1:00), not where it was (11:00)", famT.time === "1:00 PM", famT.time);
  ok("Andrew's other work steps over it", work.every(t => !overlap(t, famT)), work.map(t => t.time));
  ok("Taylor's Mom-required work steps over Mom's family window", momOther.every(t => !overlap(t, { time: "1:00 PM", dur: 30 })), momOther.map(t => t.time));
  const noDate = Object.assign({}, famT, { time: "11:00 AM" });
  E.packAround([], [noDate], { start: toMin("9:00 AM"), end: toMin("5:00 PM"), lunchStart: toMin("12:00 PM"), lunchEnd: toMin("1:00 PM"), lanes: [] });
  ok("a ctx without fxDate is untouched (old behaviour)", noDate.time === "9:00 AM", noDate.time);
  const gone = { id: "g", who: "taylor", day: "monday", time: "10:15 AM", dur: 25, famBlock: "deleted", famItem: "z" };
  ok("a card whose block was deleted keeps its own time", JSON.stringify(E.famWindowOf(gone, "monday")) === JSON.stringify({ s: toMin("10:15 AM"), e: toMin("10:40 AM") }));
}

console.log("6. day-bound + siblings");
{
  const tasks = ROSTER.map((k, i) => ({ id: "h" + i, who: k, day: "monday", famBlock: "fb1", famItem: "hist" }))
    .concat([{ id: "s0", who: "taylor", day: "monday", famBlock: "fb1", famItem: "sci" }, { id: "h9", who: "andrew", day: "tuesday", famBlock: "fb1", famItem: "hist" }, { id: "x", who: "taylor", day: "monday", subjectKey: "math" }]);
  const E = makeEnv({ rulesData: rules({ fb1: BLOCK }), weekData: { tasks } });
  ok("subjNoCarry: a family card is day-bound", E.subjNoCarry(tasks[0]) === true);
  ok("subjNoCarry: a normal card is unchanged", E.subjNoCarry(tasks[tasks.length - 1]) === false);
  const sib = E.famSiblings(tasks[0]).map(t => t.id).join();
  ok("siblings = the other 3 kids' Monday History (not Science, not Tuesday, not itself)", sib === "h1,h2,h3", sib);
  ok("a normal card has no siblings", E.famSiblings(tasks[tasks.length - 1]).length === 0);
}

console.log("7. a subject for just some of the block (her ask 10/3)");
{
  const B2 = JSON.parse(JSON.stringify(BLOCK)); B2.items[1].kids = ["taylor", "makenzie"];
  const E = makeEnv({ rulesData: rules({ fb1: B2 }) });
  const C = E.famDayCards("monday", "2026-10-05", null);
  ok("History 4 · Science 2 (Taylor + Kenzie) · Read Aloud 4 = 10 cards", C.length === 10, C.length);
  ok("Science only Taylor + Kenzie, still at 1:30", C.filter(c => c.k === "sci").map(c => c.who + "@" + fromMin(c.s)).join() === "taylor@1:30 PM,makenzie@1:30 PM");
  ok("Science's card names just the two of them", /together: Taylor, Makenzie$/.test(C.find(c => c.k === "sci").detail));
  ok("Read Aloud keeps its 2:00 slot (block order unchanged)", C.filter(c => c.k === "ra").every(c => fromMin(c.s) === "2:00 PM"));
  const B3 = JSON.parse(JSON.stringify(BLOCK)); B3.items[1].kids = ["lincoln"];
  ok("a subject whose kids aren't in the block falls back to everyone", makeEnv({ rulesData: rules({ fb1: B3 }) }).famDayCards("monday", "2026-10-05", null).filter(c => c.k === "sci").length === 4);
  const off = { "makenzie|2026-10-05": 1 };
  ok("Kenzie off → Science is just Taylor", makeEnv({ rulesData: rules({ fb1: B2 }), off }).famDayCards("monday", "2026-10-05", null).filter(c => c.k === "sci").map(c => c.who).join() === "taylor");
  // the day build: Andrew & Caleb are FREE at 1:30 — their own work can land there
  const defs = [];
  [["taylor", [30, 20, 20, 30, 20, 30, 20, 30, 30]], ["makenzie", [10, 30, 30, 20, 20, 10, 20, 20, 30]], ["andrew", [10, 30, 20, 10, 20, 20, 20, 30, 30, 30]], ["caleb", [20, 15, 15, 20, 20, 15, 15, 30, 30]]]
    .forEach(([k, ms]) => ms.forEach((m, i) => defs.push({ kid: k, min: m, mom: "none" })));
  const R = buildDay(defs, { rulesData: rules({ fb1: B2 }) });
  const fam = R.tasks.filter(t => t.famBlock), rest = R.tasks.filter(t => !t.famBlock);
  ok("no member has other work inside their own family cards", !rest.some(t => t.time && fam.some(f => f.who === t.who && overlap(t, f))));
  ok("Andrew or Caleb has own work in 1:30–2:00 (free while Taylor + Kenzie do Science)", rest.some(t => (t.who === "andrew" || t.who === "caleb") && t.time && overlap(t, { time: "1:30 PM", dur: 30 })), rest.filter(t => t.who === "andrew").map(t => t.time));
}

console.log("8. the scheduler picks the time (Andrew + Kenzie's fact review)");
const FR = { name: "Fact Review", kids: ["andrew", "makenzie"], days: ["Mon", "Tue", "Wed", "Thu", "Fri"], at: "auto", momLeads: false,
  items: [{ key: "fr", name: "Fact Review", minutes: 10 }] };
{
  const defs = [];
  [["taylor", [30, 20, 20, 30]], ["makenzie", [10, 30, 30, 20, 20, 10]], ["andrew", [10, 30, 20, 10, 20, 20]], ["caleb", [20, 15, 15]]]
    .forEach(([k, ms]) => ms.forEach((m, i) => defs.push({ kid: k, min: m, mom: i % 3 === 1 ? "required" : "none", rules: i === 0 && k === "andrew" ? "first" : "" })));
  const R = buildDay(defs, { rulesData: rules({ fr: FR, fb1: BLOCK }) });
  const fr = R.tasks.filter(t => t.famBlock === "fr"), rest = R.tasks.filter(t => !t.famBlock);
  ok("one card each for Andrew and Kenzie, same time", fr.length === 2 && fr[0].time === fr[1].time && fr.map(t => t.who).sort().join() === "andrew,makenzie", fr.map(t => t.who + "@" + t.time));
  ok("stamped famAuto (held from now on)", fr.every(t => t.famAuto === true));
  ok("before lunch", toMin(fr[0].time) + 10 <= toMin("12:00 PM"), fr[0].time);
  ok("after Andrew's first-of-day work (it went into the queue after it)", toMin(fr[0].time) >= toMin("9:10 AM"), fr[0].time);
  ok("neither kid has other work on top of it", !rest.some(t => (t.who === "andrew" || t.who === "makenzie") && t.time && overlap(t, fr[0])));
  ok("the after-lunch family time is still there too", R.tasks.filter(t => t.famBlock === "fb1").length === 12);
  // a kid who starts later (co-op until 10:00) → it waits for both
  const R2 = buildDay(defs, { rulesData: rules({ fr: FR }) }, { kidStart: { makenzie: toMin("10:00 AM") } });
  const fr2 = R2.tasks.filter(t => t.famBlock === "fr");
  ok("Kenzie home at 10:00 → fact review at 10:00 or later, still together", fr2.length === 2 && fr2[0].time === fr2[1].time && toMin(fr2[0].time) >= toMin("10:00 AM"), fr2.map(t => t.time));
  const E = makeEnv({ rulesData: rules({ fr: FR }) });
  ok("a scheduler-picks block lays nothing on its own clock (famLayout empty)", E.famLayout(FR, "monday").length === 0);
  ok("its card holds its OWN time in a re-pack", JSON.stringify(E.famWindowOf({ famBlock: "fr", famItem: "fr", time: "9:40 AM", dur: 10, day: "monday" }, "monday")) === JSON.stringify({ s: toMin("9:40 AM"), e: toMin("9:50 AM") }));
}

console.log("9. a late start moves scheduler-picked family time TOGETHER (dsRetime)");
{
  const run = new Function("toMin", "fromMin", "ENV", `
    var rulesData=ENV.rulesData, currData={subjects:{}}, checked=ENV.checked||{}, dayStarts=ENV.dayStarts, _todayDay="monday";
    function fxIsClass(){ return false; }
    ${extractFn("dsRetime")}
    return dsRetime(ENV.tasks);
  `);
  const tasks = [
    { id: "a1", who: "andrew", day: "monday", time: "9:00 AM", dur: 10 },
    { id: "fa", who: "andrew", day: "monday", time: "9:10 AM", dur: 10, famBlock: "fr", famItem: "fr", famAuto: true },
    { id: "a2", who: "andrew", day: "monday", time: "9:20 AM", dur: 30 },
    { id: "m1", who: "makenzie", day: "monday", time: "9:00 AM", dur: 10 },
    { id: "fm", who: "makenzie", day: "monday", time: "9:10 AM", dur: 10, famBlock: "fr", famItem: "fr", famAuto: true },
    { id: "m2", who: "makenzie", day: "monday", time: "9:20 AM", dur: 30 },
    { id: "p", who: "taylor", day: "monday", time: "1:00 PM", dur: 30, famBlock: "fb1", famItem: "hist" },
  ];
  const out = run(toMin, fromMin, { rulesData: rules({}), tasks, dayStarts: { monday: { andrew: "9:30 AM", makenzie: "9:45 AM", taylor: "9:00 AM" } } });
  const T = id => out.find(t => t.id === id).time;
  ok("both copies moved by the LATER kid's delay (Kenzie, 45 min) → 9:55, together", T("fa") === "9:55 AM" && T("fm") === "9:55 AM", [T("fa"), T("fm")]);
  ok("Kenzie's own day shifts 45 min", T("m1") === "9:45 AM", T("m1"));
  ok("an after-lunch family card (not scheduler-picked) never moves", T("p") === "1:00 PM");
  const on = run(toMin, fromMin, { rulesData: rules({}), tasks, dayStarts: { monday: { andrew: "9:00 AM", makenzie: "9:00 AM" } } });
  ok("on-time start → nothing moves", on.every((t, i) => t.time === tasks[i].time));
}

console.log("10. points (step C): Mom decides / each other");
{
  const mk = (ENV) => new Function("toMin", "fromMin", "fbArr", "cap", "ROSTER", "ENV", `
    var rulesData=ENV.rulesData, weekData={tasks:ENV.tasks}, checked={}, histState={}, WK="week1", db=null, bankLog=[], rl=[];
    function _dryRun(){ return true; } function nowTs(){ return "1:30 PM Mon"; } function dbg(){} function sv(){} var lastTasksWrite=0;
    function momHere(){ return !!ENV.mom; } function renderAll(){} function gwShowToast(m){ ENV.toasts.push(m); }
    function esc(s){ return String(s); }
    function bankDirect(k,p,n){ const id="b"+bankLog.length; bankLog.push({k:k,p:p,n:n,id:id}); return id; }
    function bankDirectRemove(k,id){ bankLog=bankLog.filter(function(x){ return x.id!==id; }); }
    function rlogAppend(k,s,l,a,p){ rl.push({k:k,p:p,a:a}); }
    function finalizeDone(id,ts,score){ checked[id]=ts; histState[id]={id:id,score:score}; return true; }
    const FX_DOW={monday:"Mon",tuesday:"Tue",wednesday:"Wed",thursday:"Thu",friday:"Fri",saturday:"Sat",sunday:"Sun"};
    ${FAM}
    return {famPtsFor,famPtsMax,famRateMode,famKidsRate,famAllRated,famTryFinish,famPayCard,famBeforeUncheck,famRowHTML,famScore,
      bank:function(){ return bankLog; }, rl:function(){ return rl; }, checked:checked, hist:histState};
  `)(toMin, fromMin, fbArr, cap, ROSTER, ENV);
  const BL = { name: "Family Time", kids: ROSTER.slice(), days: ["Mon"], at: "lunch",
    items: [{ key: "hist", name: "History", minutes: 30, pts: 20 }, { key: "ra", name: "Read Aloud", minutes: 20 }] };
  const FRP = { name: "Fact Review", kids: ["andrew", "makenzie"], days: ["Mon"], at: "auto", momLeads: false,
    items: [{ key: "fr", name: "Fact Review", minutes: 10, pts: 35, rate: "each" }] };
  const tasks = ROSTER.map((k, i) => ({ id: "h" + i, who: k, day: "monday", famBlock: "fb1", famItem: "hist" }))
    .concat([{ id: "ra0", who: "taylor", day: "monday", famBlock: "fb1", famItem: "ra" }, { id: "fa", who: "andrew", day: "monday", famBlock: "fr", famItem: "fr", famAuto: true }, { id: "fm", who: "makenzie", day: "monday", famBlock: "fr", famItem: "fr", famAuto: true }]);
  const toasts = [];
  const E = mk({ rulesData: rules({ fb1: BL, fr: FRP }), tasks, toasts, mom: true });
  ok("pay = round(max × stars / 5): 20 at ★★★ = 12, ★★★★★ = 20, 35 at ★★★★ = 28", E.famPtsFor(20, 3) === 12 && E.famPtsFor(20, 5) === 20 && E.famPtsFor(35, 4) === 28);
  ok("History pays up to 20, Mom decides; Read Aloud pays nothing", E.famPtsMax(tasks[0]) === 20 && E.famRateMode(tasks[0]) === "mom" && E.famPtsMax(tasks[4]) === 0);
  ok("Fact Review: kids rate each other", E.famKidsRate(tasks[5]) === true && E.famKidsRate(tasks[0]) === false);
  // Mom pays Andrew 3 stars, everyone else full
  ROSTER.forEach((k, i) => E.famPayCard(tasks[i], k === "andrew" ? 3 : 5, "1:30 PM Mon", "Mom"));
  const bank = E.bank();
  ok("Mom's screen: Andrew 12, the rest 20 — banked", bank.map(b => b.k + ":" + b.p).join() === "taylor:20,makenzie:20,andrew:12,caleb:20", bank.map(b => b.k + ":" + b.p));
  ok("every copy checked, score carries stars + pts + bank id", ["h0", "h1", "h2", "h3"].every(id => E.checked[id]) && E.hist.h2.score.rating === 3 && E.hist.h2.score.pts === 12 && E.hist.h2.score.max === 20 && !!E.hist.h2.score.bid);
  ok("the card tells the kid: You earned 12 of 20", /You earned 12 of 20/.test(E.famRowHTML(tasks[2], true, "andrew")), E.famRowHTML(tasks[2], true, "andrew"));
  ok("…and on Mom's view: Andrew earned 12 of 20", /Andrew earned 12 of 20/.test(E.famRowHTML(tasks[2], true, "all")));
  E.famBeforeUncheck("h2");
  ok("Mom's Unmark takes every copy's points back off", E.bank().length === 0, E.bank());
  // each other
  ok("not settled until BOTH have rated", E.famAllRated(tasks[5]) === false);
  tasks[5].famGave = { makenzie: 4 };
  ok("one rating in → still waiting", E.famTryFinish(tasks[5]) === false && !E.checked.fa);
  ok("Andrew's card says it's waiting for Makenzie", /waiting for Makenzie/.test(E.famRowHTML(tasks[5], false, "andrew")), E.famRowHTML(tasks[5], false, "andrew"));
  tasks[6].famGave = { andrew: 2 };
  ok("both in → settled", E.famTryFinish(tasks[6]) === true && E.checked.fa && E.checked.fm);
  const fb = E.bank();
  ok("each kid is paid the stars they RECEIVED: Kenzie ★★★★ = 28, Andrew ★★ = 14", fb.map(b => b.k + ":" + b.p).sort().join() === "andrew:14,makenzie:28", fb.map(b => b.k + ":" + b.p));
  ok("score says who gave it", E.hist.fm.score.by === "Andrew" && E.hist.fa.score.by === "Makenzie");
  ok("a second settle does nothing (no double pay)", E.famTryFinish(tasks[5]) === false && E.bank().length === 2);
  E.famBeforeUncheck("fa");
  ok("Unmark clears the ratings and the points", !tasks[5].famGave && !tasks[6].famGave && E.bank().length === 0);
}

console.log("11. Mom's views: one row per family subject (step B)");
{
  const FRB = { name: "Fact Review", kids: ["andrew", "makenzie"], at: "auto", momLeads: false, items: [{ key: "fr", name: "Fact Review", minutes: 10 }] };
  const tasks = ROSTER.map((k, i) => ({ id: "h" + i, who: k, day: "monday", famBlock: "fb1", famItem: "hist" }))
    .concat(ROSTER.map((k, i) => ({ id: "t" + i, who: k, day: "tuesday", famBlock: "fb1", famItem: "hist" })))
    .concat([{ id: "fa", who: "andrew", day: "monday", famBlock: "fr", famItem: "fr" }, { id: "x", who: "taylor", day: "monday", mom: "required" }]);
  const E = makeEnv({ rulesData: rules({ fb1: BLOCK, fr: FRB }), weekData: { tasks } });
  const src2 = new Function("ENV", "fbArr", "cap", "toMin", "fromMin", "ROSTER", `var rulesData=ENV.rulesData, weekData={tasks:ENV.tasks}; const FX_DOW={}; ${FAM} return {famMomView,famIsMomCard};`)({ rulesData: rules({ fb1: BLOCK, fr: FRB }), tasks }, fbArr, cap, toMin, fromMin, ROSTER);
  const v = src2.famMomView(tasks).map(t => t.id).join();
  ok("4 kids' Monday History → 1 row; Tuesday → 1 row; other cards untouched", v === "h0,t0,fa,x", v);
  ok("family time Mom leads counts as Mom-required", src2.famIsMomCard(tasks[0]) === true);
  ok("kids-on-their-own family time (Fact Review) is not on Mom's list", src2.famIsMomCard(tasks[8]) === false);
  ok("a normal card is not a family card", src2.famIsMomCard(tasks[9]) === false);
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
