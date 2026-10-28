/*
 * ⏱ TIMEDSTART (her spec 2026-10-28; Sara saw the same on DeWalt): "the timer on a card is only used if the kid wants it."
 * Replays the real MINMINUTES block. Before: with no ▶ Start tap every open timed card counted down at once from the same
 * last check-off, so the card after the one just checked looked already started. Now:
 *   - an unstarted timed card shows only ▶ Start and its minutes — no countdown, no "since your last check-off";
 *   - after ▶ Start the countdown is as before;
 *   - at the check, no Start → spent = the previous check-off today (or the day start) → this check (the existing fallback,
 *     with its long-lunch cap and the Not yet / Let it through rule);
 *   - and Mom gets ONE line per card per day: "<kid> didn't start the timer on Piano. 18 minutes from the card before to
 *     this one." Mom's and Dad's taps never send it; Family Time stays as it is.
 *
 *   run: node test_timed_start_only.js
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
ok("TIMEDSTART sits inside MINMINUTES with her words and date", /TIMEDSTART \(her spec 2026-10-28/.test(BLOCK) && /only used if the kid wants it/.test(BLOCK));
ok("the kid-facing fallback notes are gone (only Family Time's 'since family time's start' remains)", /const MM_FROM_KID=\{time:"since family time's start"\};/.test(BLOCK));
ok("the note is built from data (mmKidName), never a kid's name", /mmAlertSend\("nostart",t,mmKidName\(t\.who\)\+" didn't start the timer on "\+mmSubjName\(t\)/.test(BLOCK));
{ let before = null; try { before = require("child_process").execSync("git show main:index.html", { cwd: __dirname, maxBuffer: 1 << 28 }).toString("utf8"); } catch (e) {}
  const refsIn = t => { const x = t.indexOf("// MINMINUTES_START"), y = t.indexOf("// MINMINUTES_END"); return (t.slice(x, y).match(/db\.ref\(/g) || []).length; };
  ok("no new kind of write: the same db.ref( calls as main (started / minAlerts only)", before == null || refsIn(before) === refsIn(src), before && [refsIn(before), refsIn(src)]); }

// ── a fake day: Wednesday Oct 28 2026, 10:00 AM; the kid is "taylor" ──
const BASE = new Date(2026, 9, 28, 10, 0, 0).getTime();
function world(opts) {
  opts = opts || {};
  let NOW = BASE;
  class FDate extends Date { constructor(...x) { if (!x.length) super(NOW); else super(...x); } static now() { return NOW; } }
  const writes = [];
  const ref = p => ({ set: v => { writes.push({ op: "set", path: p, val: v }); return Promise.resolve(); }, remove: () => { writes.push({ op: "remove", path: p }); return Promise.resolve(); }, update: v => { writes.push({ op: "update", path: p, val: v }); return Promise.resolve(); } });
  const subjects = { taylor: {
    piano: { display: "Piano", minutes: 15 },       // practice by name → 15
    reading: { display: "Reading", minutes: 20 },   // practice by name → 20
    math: { display: "Math", minutes: 30 },         // lesson work → untimed
  } };
  const toasts = [];
  const ctx = {
    console, Date: FDate, Object, String, Number, Array, Math, JSON, parseInt, isNaN, Promise,
    weekData: { tasks: opts.tasks || [] }, checked: {}, claimed: {}, histState: {},
    rulesData: opts.rules === undefined ? {} : opts.rules,
    currData: { subjects }, gwGetSubjects: k => subjects[k] || {},
    KID_NAME: { taylor: "Taylor" }, cap: s => s.charAt(0).toUpperCase() + s.slice(1), esc: s => String(s),
    effectiveDay: t => t.day, _todayDay: "wednesday", _todayStr: () => "2026-10-28",
    WK: "week9", db: { ref }, _dryRun: () => false, fbWeekRefs: [], isUploading: false,
    _ls: {}, momHereCards: () => !!opts.mom, momHere: () => !!opts.mom, kitPinGate: fn => fn(),
    gwShowToast: m => toasts.push(m), renderAll: () => {}, ceRenderEditSheet: () => {}, taskSubject: t => t.title,
    dayStarts: { wednesday: { taylor: opts.dayStart || "9:00 AM" } },
  };
  ctx.sv = (k, v) => { ctx._ls[k] = JSON.stringify(v); }; ctx.ld = k => ctx._ls[k] ? JSON.parse(ctx._ls[k]) : null;
  if (opts.dad) ctx.dadTapCtx = { by: "dad" };
  vm.createContext(ctx); vm.runInContext(BLOCK, ctx);
  const run = code => vm.runInContext(code, ctx);
  return { ctx, run, writes, toasts, setNow: ms => { NOW = ms; },
    startAgo: (id, min) => run("started[" + JSON.stringify(id) + "]=" + (NOW - min * 60000)) };
}
const card = (id, sk, extra) => Object.assign({ id, who: "taylor", subjectKey: sk, day: "wednesday", time: "10:00 AM", title: "🎹 " + sk }, extra || {});
const AGO = m => { const d = new Date(BASE - m * 60000); let h = d.getHours(), ap = h >= 12 ? "PM" : "AM"; h = h % 12 || 12; return String(h).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0") + " " + ap + " Oct 28"; };
const NOWTS = AGO(0);
const tasks = () => [card("p1", "piano"), card("r1", "reading"), card("m1", "math")];
const notes = w => w.writes.filter(x => /\/minAlerts\/nostart_/.test(x.path));

console.log("\n── 1. no countdown before ▶ Start (the report: the next card looked already started) ──");
{
  const w = world({ tasks: tasks() });
  w.run("checked.m1=" + JSON.stringify(AGO(5)));   // Math just checked
  const rowP = w.run("mmCardRow(weekData.tasks[0],false,false,false)"), rowR = w.run("mmCardRow(weekData.tasks[1],false,false,false)");
  ok("Piano: only ▶ Start and its 15 min — no countdown, no 'since your …'", /mmStart\('p1'\)/.test(rowP) && /▶ Start/.test(rowP) && /15 min/.test(rowP) && !/min left|ready|since your/.test(rowP), rowP);
  ok("Reading: the same — two open timed cards no longer count down at once", /mmStart\('r1'\)/.test(rowR) && /20 min/.test(rowR) && !/min left|ready|since your/.test(rowR), rowR);
  ok("mmCountdownText is '' for an unstarted card", w.run("mmCountdownText(weekData.tasks[0])") === "" && w.run("mmCountdownText(weekData.tasks[1])") === "");
  ok("first card of the day (nothing checked, day start only): still just ▶ Start", (() => { const w2 = world({ tasks: tasks() }); const r = w2.run("mmCardRow(weekData.tasks[0],false,false,false)"); return /mmStart\('p1'\)/.test(r) && !/min left|ready|since your/.test(r); })());
  ok("no minute re-render for an unstarted card (nothing on screen moves)", w.run("mmTick()") === "");
  ok("the check rule is unchanged: 5 min since Math, Piano says 'Not yet — 8 min to go'", w.run("mmTapGate(weekData.tasks[0])") === true && w.toasts[0] === "⏱ Not yet — 8 min to go", w.toasts);
  ok("nothing was written", w.writes.length === 0, w.writes);
}

console.log("\n── 2. after ▶ Start the countdown works as before ──");
{
  const w = world({ tasks: tasks() });
  w.run("checked.m1=" + JSON.stringify(AGO(30)));
  w.startAgo("p1", 4);
  const row = w.run("mmCardRow(weekData.tasks[0],false,false,false)");
  ok("Started 4 min ago: '⏱ 11 min left', no ▶ Start, no fallback note", /⏱ 11 min left/.test(row) && !/mmStart/.test(row) && !/since your/.test(row), row);
  ok("the minute tick re-renders a started countdown", /\|p1@/.test(w.run("mmTick()")));
  w.setNow(BASE + 9 * 60000);
  ok("13 min after Start: 'ready ✓'", w.run("mmCountdownText(weekData.tasks[0])") === "ready ✓");
  ok("Reading (not started) still shows no countdown beside it", !/min left|ready/.test(w.run("mmCardRow(weekData.tasks[1],false,false,false)")));
}

console.log("\n── 3. no Start: spent = the previous check-off → this check ──");
{
  const w = world({ tasks: tasks() });
  w.run("checked.m1=" + JSON.stringify(AGO(19)) + "; checked.r1=" + JSON.stringify(NOWTS));   // finalizeDone stamps r1 before mmOnDone
  ok("Reading (20 min), Math checked 19 min ago: the tap goes through (grace 2)", w.run("delete checked.r1; mmTapGate(weekData.tasks[1])") === false);
  w.run("checked.r1=" + JSON.stringify(NOWTS));
  const spent = w.run("mmOnDone('r1'," + JSON.stringify(NOWTS) + ")");
  ok("spent = 19, spentFrom = 'check' (on the history entry)", spent === 19 && w.run("mmSpentFrom('r1')") === "check", [spent, w.run("mmSpentFrom('r1')")]);
  const n = notes(w);
  ok("Mom gets ONE line at week9/minAlerts/nostart_r1_2026-10-28", n.length === 1 && n[0].op === "set" && n[0].path === "week9/minAlerts/nostart_r1_2026-10-28", w.writes);
  ok("…'Taylor didn't start the timer on Reading. 19 minutes from the card before to this one.'", n[0] && n[0].val.text === "Taylor didn't start the timer on Reading. 19 minutes from the card before to this one.", n[0] && n[0].val.text);
  ok("the record names kid, card, kind and day", n[0] && n[0].val.kid === "taylor" && n[0].val.id === "r1" && n[0].val.kind === "nostart" && n[0].val.day === "2026-10-28");
  ok("only that one write", w.writes.length === 1, w.writes);
  // a long gap: spent keeps the long-lunch cap, Mom's line tells the real gap
  const w2 = world({ tasks: tasks() });
  w2.run("checked.m1=" + JSON.stringify(AGO(18)) + "; checked.p1=" + JSON.stringify(NOWTS));
  const s2 = w2.run("mmOnDone('p1'," + JSON.stringify(NOWTS) + ")");
  ok("Piano (15 min), 18 min since Math: spent = 15 (the cap, as before)", s2 === 15, s2);
  ok("…and Mom's line says the real 18 minutes", notes(w2)[0] && notes(w2)[0].val.text === "Taylor didn't start the timer on Piano. 18 minutes from the card before to this one.", notes(w2)[0] && notes(w2)[0].val.text);
}

console.log("\n── 4. first card of the day: from the day start ──");
{
  const w = world({ tasks: tasks(), dayStart: "9:40 AM" });
  w.run("checked.r1=" + JSON.stringify(NOWTS));
  const spent = w.run("mmOnDone('r1'," + JSON.stringify(NOWTS) + ")");
  ok("nothing checked before: spent = 20 from the 9:40 day start, spentFrom = 'day'", spent === 20 && w.run("mmSpentFrom('r1')") === "day", [spent, w.run("mmSpentFrom('r1')")]);
  ok("Mom's line: 'Taylor didn't start the timer on Reading. 20 minutes from the day start to this one.'", notes(w).length === 1 && notes(w)[0].val.text === "Taylor didn't start the timer on Reading. 20 minutes from the day start to this one.", notes(w));
}

console.log("\n── 5. once per card per day; Mom's Day 🔴 Now and ✓ Got it ──");
{
  const w = world({ tasks: tasks() });
  w.run("checked.m1=" + JSON.stringify(AGO(16)) + "; checked.p1=" + JSON.stringify(NOWTS));
  w.run("mmOnDone('p1'," + JSON.stringify(NOWTS) + ")");
  w.run("mmOnDone('p1'," + JSON.stringify(NOWTS) + ")");   // an uncheck and re-check, or a second device
  ok("a second check the same day adds nothing", notes(w).length === 1, w.writes);
  const now = w.run("mmAlertsNowHTML()");
  ok("it sits in 🔴 Now under ⏱ Timed cards and counts once", now.n === 1 && /⏱ Timed cards/.test(now.html) && /didn't start the timer on Piano/.test(now.html), now);
  w.ctx.momHere = () => true;
  w.run("mmAlertDismiss('nostart_p1_2026-10-28')");
  ok("✓ Got it is one targeted remove", w.writes.filter(x => x.op === "remove").length === 1 && w.writes.filter(x => x.op === "remove")[0].path === "week9/minAlerts/nostart_p1_2026-10-28" && w.run("mmAlertsNowHTML()").n === 0);
  // a kid's "send to Mom" sends it; Mom's approve later does not send it again
  const c = world({ tasks: tasks() });
  c.run("checked.m1=" + JSON.stringify(AGO(16)) + "; claimed.p1=" + JSON.stringify(NOWTS));
  c.run("mmOnDone('p1'," + JSON.stringify(NOWTS) + ")");
  ok("a kid's 'send to Mom' with no Start sends the line", notes(c).length === 1 && /16 minutes from the card before/.test(notes(c)[0].val.text), notes(c));
  c.ctx.momHereCards = () => true;
  c.run("checked.p1=claimed.p1; mmOnDone('p1'," + JSON.stringify(NOWTS) + ")");
  ok("…Mom's approve later sends nothing more", notes(c).length === 1 && c.writes.length === 1, c.writes);
}

console.log("\n── 6. no line when Start was tapped; none for Mom's or Dad's tap; Family Time as before ──");
{
  const w = world({ tasks: tasks() });
  w.run("checked.m1=" + JSON.stringify(AGO(30)) + "; checked.p1=" + JSON.stringify(NOWTS));
  w.startAgo("p1", 16);
  ok("Started: spent from Start (16), no spentFrom, no line", w.run("mmOnDone('p1'," + JSON.stringify(NOWTS) + ")") === 16 && w.run("mmSpentFrom('p1')") === "" && w.writes.length === 0, w.writes);
  const m = world({ tasks: tasks(), mom: true });
  m.run("checked.m1=" + JSON.stringify(AGO(16)) + "; checked.p1=" + JSON.stringify(NOWTS));
  ok("Mom's own tap: spent recorded, no line", m.run("mmOnDone('p1'," + JSON.stringify(NOWTS) + ")") === 15 && m.writes.length === 0, m.writes);
  const d = world({ tasks: tasks(), dad: true });
  d.run("checked.m1=" + JSON.stringify(AGO(16)) + "; checked.p1=" + JSON.stringify(NOWTS));
  ok("Dad's tap: no line", d.run("mmOnDone('p1'," + JSON.stringify(NOWTS) + ")") === 15 && d.writes.length === 0, d.writes);
  const u = world({ tasks: tasks() });
  u.run("checked.p1=" + JSON.stringify(AGO(10)) + "; checked.m1=" + JSON.stringify(NOWTS));
  u.run("mmOnDone('m1'," + JSON.stringify(NOWTS) + ")");
  ok("an untimed card (Math): no line", u.writes.length === 0, u.writes);
  const f = world({ tasks: tasks().concat([card("f1", "piano", { famBlock: "fb1" })]) });
  f.run("checked.m1=" + JSON.stringify(AGO(16)) + "; checked.f1=" + JSON.stringify(NOWTS));
  f.run("mmOnDone('f1'," + JSON.stringify(NOWTS) + ")");
  ok("a Family Time card: no line", f.writes.length === 0, f.writes);
  const y = world({ tasks: tasks().map(t => Object.assign(t, { day: "tuesday" })) });
  y.run("checked.p1=" + JSON.stringify(NOWTS));
  y.run("mmOnDone('p1'," + JSON.stringify(NOWTS) + ")");
  ok("a late check of another day's card: no line", y.writes.length === 0, y.writes);
}

console.log("\n── 7. Let it through: an early no-Start check sends one line, not two ──");
{
  const w = world({ tasks: tasks(), rules: { minMinutes: { early: "tell" } } });
  w.run("checked.m1=" + JSON.stringify(AGO(6)) + "; checked.p1=" + JSON.stringify(NOWTS));
  ok("6 of 15: the tap lands", w.run("delete checked.p1; mmTapGate(weekData.tasks[0])") === false);
  w.run("checked.p1=" + JSON.stringify(NOWTS));
  w.run("mmOnDone('p1'," + JSON.stringify(NOWTS) + ")");
  const al = w.writes.filter(x => /minAlerts/.test(x.path));
  ok("one line — the early one, which already says 'no Start tap'", al.length === 1 && al[0].path === "week9/minAlerts/early_p1_2026-10-28" && /no Start tap/.test(al[0].val.text), al);
  const w2 = world({ tasks: tasks(), rules: { minMinutes: { early: "tell" } } });
  w2.run("checked.m1=" + JSON.stringify(AGO(17)) + "; checked.p1=" + JSON.stringify(NOWTS));
  w2.run("mmOnDone('p1'," + JSON.stringify(NOWTS) + ")");
  ok("not early (17 of 15): the no-Start line, no early line", w2.writes.length === 1 && notes(w2).length === 1, w2.writes);
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
