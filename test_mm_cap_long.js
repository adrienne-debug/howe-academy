/*
 * ⏱ MMCAPLONG (her report 2026-10-27, both families: "ellis said he couldn't check off and the timer kept going"; her yes:
 * "fix the timed-card fallback clock so a 20-minute subject can open its check without ▶ Start … Keep the practice-words
 * list as it is"). Replays the real MINMINUTES block against Ellis's day: Eggspress (20 min, practice by its "reading"
 * tag), no ▶ Start tap, last check-off long ago. Before: the fallback credited a flat 15, target − grace = 18 was never
 * reached, the card stuck at "3 min left" and "Not yet — 3 min to go" every tap. Now the fallback credits up to the card's
 * own minimum when that is longer than 15; a 15-minute card is byte-for-byte as before; ▶ Start still wins; the practice
 * list (MM_PRACTICE_RE) is untouched; nothing new is written.
 *
 *   run: node test_mm_cap_long.js
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
ok("MMCAPLONG sits inside MINMINUTES: mmFallbackCap = max(15, the card's own minimum)", /function mmFallbackCap\(t\)\{ return Math\.max\(MM_FALLBACK_CAP,mmTarget\(t\)\|\|0\); \}/.test(BLOCK) && /MMCAPLONG \(her report 2026-10-27/.test(BLOCK));
ok("MM_FALLBACK_CAP is still 15; mmClock reads the per-card cap, nothing else reads the flat one (TIMEDSTART took the fallback out of mmTick's re-render)", /const MM_FALLBACK_CAP=15;/.test(BLOCK) && /const cap=nowMs-mmFallbackCap\(t\)\*60000;/.test(BLOCK) && (BLOCK.match(/MM_FALLBACK_CAP\b/g) || []).length === 4);
ok("the practice-words list is as it was (her words: keep it)", /const MM_PRACTICE_RE=\/\(practice\|piano\|instrument\|\\bread\(ing\)\?\\b\)\/i;/.test(BLOCK));
{ let before = null; try { before = require("child_process").execSync("git show HEAD:index.html", { cwd: __dirname, maxBuffer: 1 << 28 }).toString("utf8"); } catch (e) {}
  const refsIn = t => { const x = t.indexOf("// MINMINUTES_START"), y = t.indexOf("// MINMINUTES_END"); return (t.slice(x, y).match(/db\.ref\(/g) || []).length; };
  ok("no new write in the block: the same number of db.ref( calls as the committed block (started / minAlerts only)", before == null || refsIn(before) === refsIn(src), before && [refsIn(before), refsIn(src)]); }

// ── Ellis's day: Tuesday Oct 27 2026, 2:30 PM ──
const BASE = new Date(2026, 9, 27, 14, 30, 0).getTime();
function world(opts) {
  opts = opts || {};
  let NOW = BASE;
  class FDate extends Date { constructor(...x) { if (!x.length) super(NOW); else super(...x); } static now() { return NOW; } }
  const writes = [];
  const ref = p => ({ set: v => { writes.push({ op: "set", path: p, val: v }); return Promise.resolve(); }, remove: () => { writes.push({ op: "remove", path: p }); return Promise.resolve(); }, update: v => { writes.push({ op: "update", path: p, val: v }); return Promise.resolve(); } });
  const subjects = { ellis: {
    eggspress_e: { display: "Eggspress", minutes: 20, tag: "reading" },     // practice by tag → default on at 20 (live: 20)
    independent_reading: { display: "Independent Reading", minutes: 15 }, // practice by name → 15
    read_detect: { display: "Reading Detective", minutes: 15 },
    piano_long: { display: "Piano", minutes: 45 },                          // a 45-minute practice
    math: { display: "Dimensions Math", minutes: 30 },                     // lesson work → off
  } };
  const toasts = [];
  const ctx = {
    console, Date: FDate, Object, String, Number, Array, Math, JSON, parseInt, isNaN, Promise,
    weekData: { tasks: opts.tasks || [] }, checked: {}, claimed: {}, histState: {},
    rulesData: opts.rules === undefined ? {} : opts.rules,
    currData: { subjects }, gwGetSubjects: k => subjects[k] || {},
    KID_NAME: { ellis: "Ellis" }, cap: s => s.charAt(0).toUpperCase() + s.slice(1), esc: s => String(s),
    effectiveDay: t => t.day, _todayDay: "tuesday", _todayStr: () => "2026-10-27",
    WK: "week29", db: { ref }, _dryRun: () => false, fbWeekRefs: [], isUploading: false,
    _ls: {}, momHereCards: () => !!opts.mom, momHere: () => !!opts.mom, kitPinGate: fn => fn(),
    gwShowToast: m => toasts.push(m), renderAll: () => {}, ceRenderEditSheet: () => {}, taskSubject: t => t.title,
    dayStarts: { tuesday: { ellis: "9:05 AM" } },
  };
  ctx.sv = (k, v) => { ctx._ls[k] = JSON.stringify(v); }; ctx.ld = k => ctx._ls[k] ? JSON.parse(ctx._ls[k]) : null;
  vm.createContext(ctx); vm.runInContext(BLOCK, ctx);
  const run = code => vm.runInContext(code, ctx);
  return { run, writes, toasts, setNow: ms => { NOW = ms; } };
}
const card = (id, sk, extra) => Object.assign({ id, who: "ellis", subjectKey: sk, day: "tuesday", time: "2:00 PM", title: "📖 " + sk }, extra || {});
const AGO = m => { const d = new Date(BASE - m * 60000); let h = d.getHours(), ap = h >= 12 ? "PM" : "AM"; h = h % 12 || 12; return String(h).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0") + " " + ap + " Oct 27"; };
const tasks = () => [card("egg", "eggspress_e"), card("ir", "independent_reading"), card("rd", "read_detect"), card("pl", "piano_long"), card("m", "math")];

console.log("\n── Ellis, no ▶ Start, Reading Detective checked 40 minutes ago (the report) ──");
{
  const w = world({ tasks: tasks() });
  w.run("checked.rd=" + JSON.stringify(AGO(40)));
  ok("Eggspress (20 min) is credited its own 20 → can be checked (it used to stick at 3 min left)", w.run("mmToGo(weekData.tasks[0])") === 0 && (w.run("mmElapsed('egg')") | 0) === 20, [w.run("mmToGo(weekData.tasks[0])"), w.run("mmElapsed('egg')")]);
  ok("the clock is the fallback (last check-off), capped at 20 back", JSON.stringify(w.run("mmClock('egg')")) === JSON.stringify({ ms: BASE - 20 * 60000, from: "check" }), w.run("mmClock('egg')"));
  ok("his tap goes through under Not yet — no toast", w.run("mmTapGate(weekData.tasks[0])") === false && w.toasts.length === 0, w.toasts);
  ok("Independent Reading (15 min) is exactly as before: credited 15, can be checked", (w.run("mmElapsed('ir')") | 0) === 15 && w.run("mmToGo(weekData.tasks[1])") === 0);
  ok("a 45-minute practice is credited up to 40 (the real gap), check waits", (w.run("mmElapsed('pl')") | 0) === 40 && w.run("mmTapGate(weekData.tasks[3])") === true && w.toasts[0] === "⏱ Not yet — 3 min to go");
  ok("lesson work (Math) is untimed as before", w.run("mmTarget(weekData.tasks[4])") === 0 && w.run("mmCountdownText(weekData.tasks[4])") === "");
  ok("nothing was written", w.writes.length === 0);
}

console.log("\n── the gap is shorter than the card: the real gap counts, the countdown moves ──");
{
  const w = world({ tasks: tasks() });
  w.run("checked.rd=" + JSON.stringify(AGO(10)));
  ok("10 min since the last check-off: Eggspress shows no countdown (TIMEDSTART), tap says 'Not yet — 8 min to go' (grace 2)", w.run("mmCountdownText(weekData.tasks[0])") === "" && w.run("mmTapGate(weekData.tasks[0])") === true && w.toasts[0] === "⏱ Not yet — 8 min to go", [w.run("mmCountdownText(weekData.tasks[0])"), w.toasts]);
  w.setNow(BASE + 8 * 60000);
  ok("8 minutes later (18 since): the tap goes through — the clock was never stuck", w.run("mmToGo(weekData.tasks[0])") === 0 && w.run("mmTapGate(weekData.tasks[0])") === false);
  ok("mmTick does not re-render for a fallback clock — it is never on screen (TIMEDSTART)", !/\|egg@/.test(w.run("mmTick()")));
  w.setNow(BASE + 20 * 60000);
  ok("…and goes quiet once it has credited the full 20 (a capped fallback clock stops moving)", !/\|egg@/.test(w.run("mmTick()")));
}

console.log("\n── first card of the day: the day start, capped at the card's own minimum ──");
{
  const w = world({ tasks: tasks() });   // day start 9:05 AM, now 2:30 PM, nothing checked
  ok("Eggspress from the day start: credited 20 → can be checked; the card shows only ▶ Start (TIMEDSTART)", w.run("mmToGo(weekData.tasks[0])") === 0 && w.run("mmClock('egg').from") === "day" && !/since your|min left|ready/.test(w.run("mmCardRow(weekData.tasks[0],false,false,false)")) && /mmStart\('egg'\)/.test(w.run("mmCardRow(weekData.tasks[0],false,false,false)")));
  ok("the 15-minute card from the day start: credited 15, as before", (w.run("mmElapsed('ir')") | 0) === 15);
}

console.log("\n── ▶ Start still wins; the overrun line still keys off Start only ──");
{
  const w = world({ tasks: tasks() });
  w.run("checked.rd=" + JSON.stringify(AGO(40)));
  w.run("started.egg=" + (BASE - 3 * 60000));
  ok("Start 3 min ago beats a 40-min gap: '17 min left', from:'start'", w.run("mmCountdownText(weekData.tasks[0])") === "17 min left" && w.run("mmClock('egg').from") === "start");
  const w2 = world({ tasks: tasks() });
  w2.run("checked.rd=" + JSON.stringify(AGO(90)));
  w2.run("mmTick()");
  ok("a 90-min gap on a never-started 20-min card: no overrun alert (fallback never overruns), no write", w2.writes.length === 0);
}

console.log("\n── Let it through and tell me: Mom's line names the fallback, spent is the credited 20 ──");
{
  const w = world({ tasks: tasks(), rules: { minMinutes: { early: "tell" } } });
  w.run("checked.rd=" + JSON.stringify(AGO(12)));
  ok("12 min since: the tap lands (tell), Mom's line says 12 of 20 (no Start tap — counted from the last check-off)", w.run("mmTapGate(weekData.tasks[0])") === false && w.run("mmOnDone('egg','2:30 PM Oct 27')") === 12 && w.writes.length === 1 && /^week29\/minAlerts\/early_egg_2026-10-27$/.test(w.writes[0].path) && w.writes[0].val.text === "Ellis finished Eggspress at 12 of 20 minutes (no Start tap — counted from the last check-off)", w.writes);
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
