/*
 * Node test for the fixed-time-class DAY BUILD — the partition block inside
 * gwBuildDayTasks, sliced out of index.html verbatim and run against the REAL packAround
 * + packDay (also sliced). gwBuildDayTasks itself has ~60 collaborators, so the block is
 * exercised directly rather than stubbing the whole generator.
 *
 * What must hold:
 *   - the class card is PINNED at its clock time, never packed
 *   - every other card packs AROUND the window — the morning before a midday class survives
 *   - with no class defined, the result is identical to the old code path
 *
 *   run:  node test_fixed_class_day.js
 */
const fs = require("fs");
const path = require("path");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");

function extractFn(name) {
  const i = src.indexOf("function " + name + "(");
  if (i < 0) throw new Error("not found: " + name);
  let depth = 0, started = false;
  for (let k = src.indexOf("{", i); k < src.length; k++) {
    const c = src[k];
    if (c === "{") { depth++; started = true; }
    else if (c === "}") { depth--; if (started && depth === 0) return src.slice(i, k + 1); }
  }
  throw new Error("unbalanced: " + name);
}
function slice(startMark, endMark) {
  const a = src.indexOf(startMark);
  if (a < 0) throw new Error("slice start not found: " + startMark);
  const b = src.indexOf(endMark, a);
  if (b < 0) throw new Error("slice end not found: " + endMark);
  return src.slice(a, b);
}

// The real partition block, verbatim from gwBuildDayTasks.
const PARTITION = slice("  const fxBusy={}, fxMomBusy=[], fxLaneBusy={}, toPack=[];", "  // Place everything through the shared packer");
if (!/fxWindow\(s,dayConfig\.dateStr,dayName\)/.test(PARTITION)) throw new Error("partition block shape changed — update this test");
if (/packAround\(\s*items/.test(PARTITION)) throw new Error("partition must not feed raw items to the packer");

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log("  ok  - " + name); }
  else { fail++; console.log("  FAIL- " + name + (extra ? "  (" + extra + ")" : "")); }
}

// ── Minimal environment the block and the packer need ──
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
const fromMin = (v) => {
  let h = Math.floor(v / 60), m = v % 60;
  const ap = h >= 12 ? "PM" : "AM";
  let hh = h % 12; if (hh === 0) hh = 12;
  return hh + ":" + String(m).padStart(2, "0") + " " + ap;
};
const taskDevice = (t) => t.device || "paper";
const gwDeviceCaps = () => ({ screen: 2, computer: 1, ipadLucy: 1 });

// Build a runner that owns the real block + real packer.
function makeRunner() {
  return new Function("toMin", "fromMin", "taskDevice", "gwDeviceCaps", "ARG", `
    ${extractFn("packDay")}
    ${extractFn("packAround")}
    ${extractFn("fxIsClass")}
    ${extractFn("fxDateList")}
    ${extractFn("fxRunsOn")}
    ${extractFn("fxWindow")}
    ${extractFn("fxLaneOf")}
    const FX_DOW={monday:"Mon",tuesday:"Tue",wednesday:"Wed",thursday:"Thu",friday:"Fri",saturday:"Sat",sunday:"Sun"};

    const items=ARG.items, meta=ARG.meta, dayConfig=ARG.dayConfig, dayName=ARG.dayName;
    const kidStart=ARG.kidStart||{}, isSitter=false, sitterEnd=0;
    const schoolStart=ARG.schoolStart, cutoff=ARG.cutoff;
    const r={lunchStart:ARG.lunchStart,lunchEnd:ARG.lunchEnd};

${PARTITION}

    const overflow=packAround([],toPack,{start:schoolStart,end:cutoff,lunchStart:r.lunchStart,lunchEnd:r.lunchEnd,
      kidStart:kidStart,momStart:(isSitter?sitterEnd:0),busy:fxBusy,momBusy:fxMomBusy,laneBusy:fxLaneBusy,lanes:["computer","screen","ipadLucy"],laneCap:gwDeviceCaps()});

    const out={}; items.forEach(function(it){ out[it.id]=it.time||null; });
    return {times:out,busy:fxBusy,momBusy:fxMomBusy,laneBusy:fxLaneBusy,packedCount:toPack.length,overflow:overflow.map(function(x){return x.id;})};
  `);
}
const runner = makeRunner();

const GERMAN_DATES = ["2026-09-16","2026-09-23","2026-09-30"];
const german = { display:"German (Outschool)", fixedTime:"10:00 AM", minutes:45,
  allowedDays:["Wed"], fixedDates:GERMAN_DATES, device:"computer", mom:"none" };
const midday = { display:"Piano lesson", fixedTime:"1:00 PM", minutes:45,
  allowedDays:["Wed"], device:"paper", mom:"none" };
const plain = (min) => ({ display:"Work", minutes:min, device:"paper", mom:"none" });

function build(defs, opts) {
  opts = opts || {};
  const items = [], meta = {};
  defs.forEach((d, i) => {
    const id = "t" + i;
    items.push({ id, who: d.kid, device: d.s.device || "paper", dur: d.s.minutes || 20, mom: d.s.mom || "none" });
    meta[id] = { kid: d.kid, key: d.key || ("k" + i), excelVal: 1, s: d.s };
  });
  return runner(toMin, fromMin, taskDevice, gwDeviceCaps, {
    items, meta,
    dayConfig: { dateStr: opts.dateStr === undefined ? "2026-09-16" : opts.dateStr },
    dayName: opts.dayName || "wednesday",
    schoolStart: 600, cutoff: 975,
    lunchStart: opts.lunchStart === undefined ? 780 : opts.lunchStart,
    lunchEnd: opts.lunchEnd === undefined ? 840 : opts.lunchEnd,
    kidStart: opts.kidStart || {},
  });
}

console.log("\nA) The class card is pinned, not packed\n");

(() => {
  const r = build([{ kid:"lincoln", key:"german", s:german }]);
  ok("German is pinned at 10:00 AM", r.times.t0 === "10:00 AM", JSON.stringify(r.times));
  ok("German never entered the packer", r.packedCount === 0, r.packedCount + "");
  ok("its window is published as busy 600-645",
    JSON.stringify(r.busy.lincoln) === JSON.stringify([{ s:600, e:645 }]), JSON.stringify(r.busy));
})();

(() => {
  // On a non-class Wednesday there is no window and no pin — the card (if any slipped
  // through) is packed like ordinary work.
  const r = build([{ kid:"lincoln", key:"german", s:german }], { dateStr:"2026-11-25" });
  ok("no class on a non-class date: nothing pinned, card packed",
    r.packedCount === 1 && Object.keys(r.busy).length === 0, JSON.stringify(r));
})();

console.log("\nB) The rest of the day packs AROUND the class\n");

(() => {
  // German 10:00-10:45 sits at the start of Lincoln's day: work begins after it.
  const r = build([
    { kid:"lincoln", key:"german", s:german },
    { kid:"lincoln", key:"a", s:plain(30) },
    { kid:"lincoln", key:"b", s:plain(30) },
  ]);
  ok("German 10:00, then work at 10:45 and 11:15",
    r.times.t0 === "10:00 AM" && r.times.t1 === "10:45 AM" && r.times.t2 === "11:15 AM",
    JSON.stringify(r.times));
})();

(() => {
  // THE case a co-op cannot express: a 1:00 PM class must NOT wipe the morning.
  const r = build([
    { kid:"lincoln", key:"piano", s:midday },
    { kid:"lincoln", key:"a", s:plain(30) },
    { kid:"lincoln", key:"b", s:plain(30) },
  ], { lunchStart:0, lunchEnd:0 });
  ok("a 1 PM class keeps the morning (work at 10:00 / 10:30)",
    r.times.t0 === "1:00 PM" && r.times.t1 === "10:00 AM" && r.times.t2 === "10:30 AM",
    JSON.stringify(r.times));
})();

(() => {
  // Work that would straddle a midday class steps over it.
  const r = build([
    { kid:"lincoln", key:"piano", s:midday },
    { kid:"lincoln", key:"a", s:plain(60) },
    { kid:"lincoln", key:"b", s:plain(60) },
    { kid:"lincoln", key:"c", s:plain(60) },
    { kid:"lincoln", key:"d", s:plain(60) },
  ], { lunchStart:0, lunchEnd:0 });
  // 600-660, 660-720, 720-780 (fits exactly up to the class — abutting is not
  // overlapping), then the fourth would straddle 780-825 and jumps to 825 = 1:45 PM.
  ok("work fills up to the class, then the next card jumps it (1:45 PM)",
    r.times.t1 === "10:00 AM" && r.times.t2 === "11:00 AM" &&
    r.times.t3 === "12:00 PM" && r.times.t4 === "1:45 PM",
    JSON.stringify(r.times));
  const win = { s:780, e:825 };
  const overlaps = ["t1","t2","t3","t4"].filter(k => {
    const st = toMin(r.times[k]); return st < win.e && st + 60 > win.s;
  });
  ok("no packed card overlaps the class window", overlaps.length === 0, overlaps.join(","));
})();

(() => {
  // One kid's class must not disturb a sibling.
  const r = build([
    { kid:"lincoln", key:"german", s:german },
    { kid:"ellis", key:"a", s:plain(30) },
  ]);
  ok("Ellis still starts at 10:00 while Lincoln is in German", r.times.t1 === "10:00 AM", JSON.stringify(r.times));
})();

(() => {
  // A Mom-required class blocks Mom for its window, not just the kid.
  const momClass = Object.assign({}, midday, { mom:"required" });
  const r = build([
    { kid:"lincoln", key:"lesson", s:momClass },
    { kid:"ellis", key:"a", s:{ display:"Mom work", minutes:30, device:"paper", mom:"required" } },
  ], { lunchStart:0, lunchEnd:0, kidStart:{ ellis:780 } });
  ok("Mom-required class defers another kid's Mom work past it",
    r.times.t1 === "1:45 PM", JSON.stringify(r.times) + " momBusy=" + JSON.stringify(r.momBusy));
})();

console.log("\nB2) The class holds the machine it runs on\n");

(() => {
  // German is device:"computer". Ellis's computer work must not run on that machine
  // during the class — the real hole: blocking only the kid left the computer bookable.
  const r = build([
    { kid:"lincoln", key:"german", s:german },
    { kid:"ellis", key:"a", s:{ display:"Typing", minutes:30, device:"computer", mom:"none" } },
  ]);
  ok("Ellis's computer work waits for German to end (10:45)",
    r.times.t1 === "10:45 AM", JSON.stringify(r.times) + " laneBusy=" + JSON.stringify(r.laneBusy));
  ok("the class's window is published on the computer lane",
    JSON.stringify((r.laneBusy || {}).computer) === JSON.stringify([{ s:600, e:645 }]),
    JSON.stringify(r.laneBusy));
})();

(() => {
  // A paper class holds no machine, so computer work is untouched.
  const paperClass = Object.assign({}, german, { device:"paper" });
  const r = build([
    { kid:"lincoln", key:"tutor", s:paperClass },
    { kid:"ellis", key:"a", s:{ display:"Typing", minutes:30, device:"computer", mom:"none" } },
  ]);
  ok("a paper class leaves the computer free (10:00)",
    r.times.t1 === "10:00 AM", JSON.stringify(r.times));
  ok("no lane window published for a paper class",
    Object.keys(r.laneBusy || {}).length === 0, JSON.stringify(r.laneBusy));
})();

(() => {
  // Ellis's own non-computer work is unaffected by German holding the computer.
  const r = build([
    { kid:"lincoln", key:"german", s:german },
    { kid:"ellis", key:"a", s:plain(30) },
  ]);
  ok("a sibling's paper work still starts at 10:00", r.times.t1 === "10:00 AM", JSON.stringify(r.times));
})();

console.log("\nC) With no class defined, nothing changes\n");

(() => {
  const r = build([
    { kid:"lincoln", key:"a", s:plain(30) },
    { kid:"lincoln", key:"b", s:plain(30) },
    { kid:"ellis", key:"c", s:plain(45) },
  ]);
  ok("no class: every card packed normally, no windows",
    r.packedCount === 3 && Object.keys(r.busy).length === 0 && r.momBusy.length === 0 &&
    r.times.t0 === "10:00 AM" && r.times.t1 === "10:30 AM" && r.times.t2 === "10:00 AM",
    JSON.stringify(r));
})();

console.log("\nD) Nothing is lost\n");

(() => {
  // A class late in a full day can push work past cutoff — it must overflow, not vanish.
  const late = { display:"Evening class", fixedTime:"3:00 PM", minutes:60, allowedDays:["Wed"], device:"paper", mom:"none" };
  const defs = [{ kid:"lincoln", key:"late", s:late }];
  for (let i = 0; i < 10; i++) defs.push({ kid:"lincoln", key:"w" + i, s:plain(45) });
  const r = build(defs, { lunchStart:0, lunchEnd:0 });
  const placed = Object.keys(r.times).filter(k => r.times[k]).length;
  ok("every card is either placed or reported as overflow",
    placed + r.overflow.length === defs.length,
    placed + "+" + r.overflow.length + " of " + defs.length);
  ok("the class itself is never the thing that overflows",
    r.overflow.indexOf("t0") < 0 && r.times.t0 === "3:00 PM", JSON.stringify(r.overflow));
})();

console.log("\n" + pass + " passed, " + fail + " failed\n");
process.exit(fail ? 1 : 0);
