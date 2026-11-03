/*
 * ⏱ MMDAYFLOOR (Sara DeWalt's Monday 2026-11-02; Adrienne's yes 11/2: "build both"). The timed-card fallback clock's "day start"
 * was the kid's routine-finish stamp (dayStarts) with no school-start floor, while the schedule itself floors the day at the
 * Settings school start (dsRetime, her rule 2026-09-23). Live: Caleb's chores ended 8:21, his Morning Notebook ran 9:00→9:12,
 * and Mom's done row read "⏱ 15 min (no Start tap — counted from the day start)" — 8:21→9:12 = 51, capped — where the real
 * 12 minutes was what Sara counted. Now mmDayStartMs takes the same floor: today's own start, else the default, else 10:00 AM.
 * Replays the real MINMINUTES block against that morning. Nothing new is written.
 *
 *   run: node test_mm_day_floor.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const a = src.indexOf("// MINMINUTES_START"), b = src.indexOf("// MINMINUTES_END");
if (a < 0 || b < 0) { console.error("MINMINUTES markers not found"); process.exit(1); }
const pa = src.indexOf("function _parseCheckTs(ts){"), pb = src.indexOf("\n}", pa) + 2;
const BLOCK = src.slice(a, b) + "\n" + src.slice(pa, pb);
let pass = 0, fail = 0;
const ok = (n, c, x) => c ? (pass++, console.log("  ok  - " + n)) : (fail++, console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x) : "")));

console.log("\n── the change itself ──");
ok("MMDAYFLOOR sits inside mmDayStartMs, after the dayStarts read, before the 'not yet' return", (() => { const f = BLOCK.indexOf("function mmDayStartMs("); const m = BLOCK.indexOf("// MMDAYFLOOR", f); const r = BLOCK.indexOf("return d.getTime()<=nowMs?d.getTime():null;", f); return f >= 0 && m > f && r > m; })());
ok("it reads the same setting dsRetime does: today's override start, else defaultStart, else 10:00 AM, through dtS", /_sd\.overrides\|\|\{\}\)\[_todayDay\]\)\|\|\{\}\)\.start\|\|_sd\.defaultStart\|\|"10:00 AM"/.test(BLOCK) && /dtS\(_todayDay,_v\)/.test(BLOCK));
{ let before = null; try { before = require("child_process").execSync("git show HEAD:index.html", { cwd: __dirname, maxBuffer: 1 << 28 }).toString("utf8"); } catch (e) {}
  const refsIn = t => { const x = t.indexOf("// MINMINUTES_START"), y = t.indexOf("// MINMINUTES_END"); return (t.slice(x, y).match(/db\.ref\(/g) || []).length; };
  ok("no new write in the block: the same number of db.ref( calls as the committed block", before == null || refsIn(before) === refsIn(src), before && [refsIn(before), refsIn(src)]); }

// ── Monday Nov 2 2026, the DeWalt morning: school 9:00 AM, Caleb's chores done 8:21, notebook checked 9:12 ──
const BASE = new Date(2026, 10, 2, 9, 12, 0).getTime();
function world(opts) {
  opts = opts || {};
  let NOW = BASE;
  class FDate extends Date { constructor(...x) { if (!x.length) super(NOW); else super(...x); } static now() { return NOW; } }
  const writes = [];
  const ref = p => ({ set: v => { writes.push({ op: "set", path: p, val: v }); return Promise.resolve(); }, remove: () => { writes.push({ op: "remove", path: p }); return Promise.resolve(); }, update: v => { writes.push({ op: "update", path: p, val: v }); return Promise.resolve(); }, on: () => {}, off: () => {} });
  const subjects = { caleb: { morning_notebook: { display: "Morning Notebook", minutes: 10 } } };
  const toMin = s => { const m = /(\d{1,2}):(\d{2})\s*([AP]M)/i.exec(String(s || "")); if (!m) return null; let h = +m[1] % 12; if (m[3].toUpperCase() === "PM") h += 12; return h * 60 + +m[2]; };
  const ctx = {
    console, Date: FDate, Object, String, Number, Array, Math, JSON, parseInt, isNaN, Promise, toMin,
    weekData: { tasks: opts.tasks || [] }, checked: {}, claimed: {}, histState: {},
    rulesData: opts.rules === undefined ? { schoolDay: { defaultStart: "9:00 AM", defaultEnd: "4:00 PM" } } : opts.rules,
    currData: { subjects }, gwGetSubjects: k => subjects[k] || {},
    KID_NAME: { caleb: "Caleb" }, cap: s => s.charAt(0).toUpperCase() + s.slice(1), esc: s => String(s),
    effectiveDay: t => t.day, _todayDay: "monday", _todayStr: () => "2026-11-02",
    WK: "week5", db: { ref }, _dryRun: () => false, fbWeekRefs: [], isUploading: false,
    _ls: {}, momHereCards: () => true, momHere: () => true, kitPinGate: fn => fn(),
    gwShowToast: () => {}, renderAll: () => {}, ceRenderEditSheet: () => {}, taskSubject: t => t.title,
    dayStarts: { monday: { caleb: opts.dayStart !== undefined ? opts.dayStart : "8:21 AM" } },
  };
  if (opts.dtS) ctx.dtS = opts.dtS;
  ctx.sv = (k, v) => { ctx._ls[k] = JSON.stringify(v); }; ctx.ld = k => ctx._ls[k] ? JSON.parse(ctx._ls[k]) : null;
  vm.createContext(ctx); vm.runInContext(BLOCK, ctx);
  const run = code => vm.runInContext(code, ctx);
  return { run, writes, setNow: ms => { NOW = ms; } };
}
const nb = () => [{ id: "nb", who: "caleb", subjectKey: "morning_notebook", day: "monday", time: "9:00 AM", dur: 10, mom: "required", title: "📖 Morning Notebook — Morning Notebook" }];
const at = (h, m) => new Date(2026, 10, 2, h, m, 0).getTime();

console.log("\n── Caleb's notebook, Mom's tap at 9:12, no ▶ Start (the report) ──");
{
  const w = world({ tasks: nb() });
  ok("the day-start clock is 9:00 (the Settings school start), not 8:21", w.run("mmDayStartMs('caleb',Date.now())") === at(9, 0), new Date(w.run("mmDayStartMs('caleb',Date.now())")).toTimeString());
  ok("mmClock reads from the day start at 9:00", JSON.stringify(w.run("mmClock('nb')")) === JSON.stringify({ ms: at(9, 0), from: "day" }), w.run("mmClock('nb')"));
  w.run("checked.nb='09:12 AM Nov 2'");
  ok("spent = 12 (it used to read 15: 8:21→9:12 capped)", w.run("mmOnDone('nb','09:12 AM Nov 2')") === 12 && w.run("mmSpentFrom('nb')") === "day");
  ok("Mom's done row says ⏱ 12 min, counted from the day start", (() => { w.run("histState.nb={spent:12,spentFrom:'day'}"); const h = w.run("mmSpentChip('nb')"); return /⏱ 12 min/.test(h) && /counted from the day start/.test(h); })());
  ok("nothing was written", w.writes.length === 0);
}

console.log("\n── the floor follows Settings ──");
{
  const w = world({ tasks: nb(), rules: { schoolDay: { defaultStart: "9:00 AM", overrides: { monday: { start: "8:30 AM" } } } } });
  ok("today's own start (8:30) wins over the default (9:00): 8:30 beats 8:21 → 8:30", w.run("mmDayStartMs('caleb',Date.now())") === at(8, 30));
  const w2 = world({ tasks: nb(), rules: { schoolDay: { defaultStart: "8:00 AM" } } });
  ok("a routine finished AFTER the school start keeps its own stamp (8:21 > 8:00)", w2.run("mmDayStartMs('caleb',Date.now())") === at(8, 21));
  const w3 = world({ tasks: nb(), rules: {} });
  ok("no school-day setting at all → the same 10:00 AM default dsRetime uses (10:00 > now 9:12 → no clock yet)", w3.run("mmDayStartMs('caleb',Date.now())") === null);
  w3.setNow(at(10, 7));
  ok("…and at 10:07 that family's clock reads from 10:00", w3.run("mmDayStartMs('caleb',Date.now())") === at(10, 0));
  const w4 = world({ tasks: nb(), rules: { schoolDay: { defaultStart: "9:00 AM", byDate: { "2026-11-02": { start: "9:30 AM" } } } }, dtS: (d, v) => "9:30 AM" });
  ok("a one-date time (DAYTIMES dtS) is honoured: at 9:12 the 9:30 start hasn't come → no clock yet", w4.run("mmDayStartMs('caleb',Date.now())") === null);
  w4.setNow(at(9, 45));
  ok("…and at 9:45 the clock reads from 9:30", w4.run("mmDayStartMs('caleb',Date.now())") === at(9, 30));
  const w5 = world({ tasks: nb(), dayStart: "" });
  ok("no day start recorded → still no clock (the floor never invents one)", w5.run("mmDayStartMs('caleb',Date.now())") === null);
}

console.log("\n── everything above the floor is as before ──");
{
  const w = world({ tasks: nb(), dayStart: "9:05 AM" });
  ok("a 9:05 routine finish with a 9:00 start: 9:05, untouched", w.run("mmDayStartMs('caleb',Date.now())") === at(9, 5));
  w.run("started.nb=" + at(9, 3));
  ok("▶ Start still wins over the day start", w.run("mmClock('nb').from") === "start");
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
