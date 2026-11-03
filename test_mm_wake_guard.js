/*
 * ⏱ MMWAKEGUARD (Sara DeWalt's Monday 2026-11-02; Adrienne's yes 11/2: "build both"). A page that slept wakes with the check
 * list it fell asleep with: live, a device whose `checked` was 40 minutes old ran its first minute tick at 11:02:15 and wrote
 * "Andrew's Piano has been open 59 minutes (20 planned)" and "Taylor's Reading has been open 82 minutes (30 planned)" for two
 * cards the kids had checked at 10:40 and 10:55 — its checked listener caught up two seconds later, and the two rows sat in
 * 🔴 Now until ✓ Got it. Now mmTick remembers when it last ran: the first tick after a gap longer than MM_WAKE_MS (2.5 min)
 * sends no overrun line; the next minute's tick judges as before. The countdown signature is untouched; nothing new is written.
 * Replays the real MINMINUTES block against that morning.
 *
 *   run: node test_mm_wake_guard.js
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
ok("MM_WAKE_MS is 2.5 minutes and _mmTickAt lives beside mmTick", /const MM_WAKE_MS=150000;/.test(BLOCK) && /let _mmTickAt=0;/.test(BLOCK));
ok("the overrun send is gated on !_woke and still on ▶ Start only", /if\(r\.over&&!_woke&&c\.from==="start"&&!t\.famBlock&&el>=target\*2\) mmAlertSend\("over"/.test(BLOCK));
ok("the countdown signature line is untouched", /if\(el<target\+1&&\(c\.from==="start"\|\|c\.from==="time"\)\) sig\+="\|"\+t\.id\+"@"\+Math\.floor\(nowMs\/60000\);/.test(BLOCK));
{ let before = null; try { before = require("child_process").execSync("git show HEAD:index.html", { cwd: __dirname, maxBuffer: 1 << 28 }).toString("utf8"); } catch (e) {}
  const refsIn = t => { const x = t.indexOf("// MINMINUTES_START"), y = t.indexOf("// MINMINUTES_END"); return (t.slice(x, y).match(/db\.ref\(/g) || []).length; };
  ok("no new write in the block: the same number of db.ref( calls as the committed block", before == null || refsIn(before) === refsIn(src), before && [refsIn(before), refsIn(src)]); }

// ── Monday Nov 2 2026: Andrew's Piano ▶ Start 10:03, Taylor's Reading ▶ Start 9:39 ──
const T = (h, m, s) => new Date(2026, 10, 2, h, m, s || 0).getTime();
function world(opts) {
  opts = opts || {};
  let NOW = opts.now || T(10, 20);
  class FDate extends Date { constructor(...x) { if (!x.length) super(NOW); else super(...x); } static now() { return NOW; } }
  const writes = [];
  const ref = p => ({ set: v => { writes.push({ op: "set", path: p, val: v }); return Promise.resolve(); }, remove: () => { writes.push({ op: "remove", path: p }); return Promise.resolve(); }, update: v => { writes.push({ op: "update", path: p, val: v }); return Promise.resolve(); }, on: () => {}, off: () => {} });
  const subjects = { andrew: { piano: { display: "Piano", minutes: 20 } }, taylor: { reading: { display: "Reading", minutes: 30 } } };
  const ctx = {
    console, Date: FDate, Object, String, Number, Array, Math, JSON, parseInt, isNaN, Promise,
    weekData: { tasks: [
      { id: "pi", who: "andrew", subjectKey: "piano", day: "monday", time: "10:35 AM", dur: 20, mom: "none", title: "🎹 Piano — Piano" },
      { id: "rd", who: "taylor", subjectKey: "reading", day: "monday", time: "10:00 AM", dur: 30, mom: "none", title: "📖 Reading — Reading" },
    ] }, checked: {}, claimed: {}, histState: {},
    rulesData: { schoolDay: { defaultStart: "9:00 AM" }, minMinutes: { over: true } },
    currData: { subjects }, gwGetSubjects: k => subjects[k] || {},
    KID_NAME: { andrew: "Andrew", taylor: "Taylor" }, cap: s => s.charAt(0).toUpperCase() + s.slice(1), esc: s => String(s),
    effectiveDay: t => t.day, _todayDay: "monday", _todayStr: () => "2026-11-02",
    WK: "week5", db: { ref }, _dryRun: () => false, fbWeekRefs: [], isUploading: false,
    _ls: {}, momHereCards: () => true, momHere: () => true, kitPinGate: fn => fn(),
    gwShowToast: () => {}, renderAll: () => {}, ceRenderEditSheet: () => {}, taskSubject: t => t.title,
    dayStarts: { monday: { andrew: "8:16 AM", taylor: "8:17 AM" } },
  };
  ctx.sv = (k, v) => { ctx._ls[k] = JSON.stringify(v); }; ctx.ld = k => ctx._ls[k] ? JSON.parse(ctx._ls[k]) : null;
  vm.createContext(ctx); vm.runInContext(BLOCK, ctx);
  const run = code => vm.runInContext(code, ctx);
  run("started.pi=" + T(10, 3, 3) + "; started.rd=" + T(9, 39, 43));
  return { run, writes, setNow: ms => { NOW = ms; } };
}
const overs = w => w.writes.filter(x => /\/minAlerts\/over_/.test(x.path)).map(x => x.path.replace(/^week5\/minAlerts\//, ""));

console.log("\n── the live morning: a device asleep since 10:21 wakes at 11:02:15 with both cards still 'open' in its copy ──");
{
  const w = world({ now: T(10, 21) });
  w.run("mmTick()");                                   // its last tick before sleeping: Reading at 41 min (not yet 60), Piano at 18
  ok("10:21, last tick before sleep: nothing to send yet", overs(w).length === 0, w.writes);
  w.setNow(T(11, 2, 15));
  const sig = w.run("mmTick()");                       // first tick after waking, checked still stale (the kids checked at 10:40 / 10:55)
  ok("11:02:15, first tick after a 41-minute gap: NO overrun line for Piano (59 min) or Reading (82 min)", overs(w).length === 0, w.writes);
  ok("…and the tick itself still runs (no throw, a signature comes back)", typeof sig === "string");
  w.run("checked.pi='10:55 AM Nov 2'; checked.rd='10:40 AM Nov 2'");   // the listener catches up two seconds later
  w.setNow(T(11, 3, 15));
  w.run("mmTick()");
  ok("11:03, the next tick with the check-offs in: still nothing — the cards are done", overs(w).length === 0 && w.writes.length === 0, w.writes);
}

console.log("\n── a card really left open: the next tick after waking still tells Mom ──");
{
  const w = world({ now: T(10, 21) });
  w.run("mmTick()");
  w.setNow(T(11, 2, 15)); w.run("mmTick()");
  ok("the woken tick is silent", overs(w).length === 0);
  w.setNow(T(11, 3, 15)); w.run("mmTick()");
  ok("one minute later, both lines go out as before (Piano 60 min, Reading 83 min), one record each", JSON.stringify(overs(w)) === JSON.stringify(["over_pi_2026-11-02", "over_rd_2026-11-02"]) && /has been open 60 minutes \(20 planned\)/.test(w.writes[0].val.text), w.writes.map(x => x.val && x.val.text));
  w.setNow(T(11, 4, 15)); w.run("mmTick()");
  ok("once per card per day, as before", overs(w).length === 2);
}

console.log("\n── an awake device is exactly as before ──");
{
  const w = world({ now: T(10, 39) });
  w.run("mmTick()");
  ok("10:39, Reading at 59 min: not yet", overs(w).length === 0);
  w.setNow(T(10, 40)); w.run("mmTick()");
  ok("10:40, one minute later (a normal gap): Reading at 60 → the line goes out", JSON.stringify(overs(w)) === JSON.stringify(["over_rd_2026-11-02"]));
  w.setNow(T(10, 43)); w.run("mmTick()");
  ok("10:43, a 3-minute gap counts as asleep: Piano (40 min) waits one tick", overs(w).length === 1);
  w.setNow(T(10, 44)); w.run("mmTick()");
  ok("10:44: Piano's line goes out", JSON.stringify(overs(w)) === JSON.stringify(["over_rd_2026-11-02", "over_pi_2026-11-02"]));
}

console.log("\n── the very first tick of a page load is not 'woken' (there was no earlier tick) ──");
{
  const w = world({ now: T(11, 2, 15) });
  w.run("mmTick()");
  ok("a fresh page's first tick judges as before (its lists came in with the load)", overs(w).length === 2);
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
