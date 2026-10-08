/*
 * ✎ Book Sprints — fix a wrong tap, done-for-today banner, ✎ Edit toggle (her ask 2026-10-07):
 *  (1) after today's 4th run the panel says "✅ Today's 4 are done — run more?" and extra runs still work;
 *  (2) Mom can change (Met ↔ Not) or undo the LATEST run recorded today — sheet, passed state, position and the
 *      mathSprints/<kid> record all go back to what the corrected tap would have left; undo again steps further back;
 *  (3) the book/sprint pickers and the tappable list sit behind "✎ Edit" so they can't be bumped.
 * Run 2 still starts where yesterday left off.
 *   run:  node test_msprint_edit.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const a = src.indexOf("// MSPRINT_START"), b = src.indexOf("// MSPRINT_END");
if (a < 0 || b < 0 || src.indexOf("// MSEDIT_START") < 0) { console.error("markers not found"); process.exit(1); }
let pass = 0, fail = 0;
function ok(n, c, x) { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x) + ")" : "")); } }
const BOOK4 = ["Sprint 401 · Identify the Value of Digits", "Sprint 402 · Count On or Back", "Sprint 403 · Compare Numbers", "Sprint 404 · Round to the Nearest Ten Thousand"];
function world(o) {
  o = o || {};
  const writes = [], checks = [], toasts = [];
  let clock = 1000;
  const ctx = {
    console, masteryKid: "lincoln", SL_KLBL: { lincoln: "Lincoln" }, _todayDay: "wednesday",
    weekData: { tasks: o.tasks || [] }, checked: {}, claimed: {},
    momHere: () => o.who !== "kid", nowTs: () => "10:00 AM Oct 7", cbTodayISO: () => o.today || "2026-10-07",
    effectiveDay: t => t.day, toMin: () => 0, tsToMin: () => 0, finalizeDone: id => { checks.push(id); return true; }, showPaceToast: () => {},
    dbg: () => {}, gwShowToast: m => toasts.push(m), renderAll: () => {}, _mastRe: () => {}, showTab: () => {}, bbAudioUnlock: () => {},
    _dryRun: () => !!o.dry, db: { ref: p => ({ update: v => writes.push([p, JSON.parse(JSON.stringify(v))]), set: v => writes.push([p, v]) }) },
    document: { getElementById: () => null }, setInterval: () => 1, clearInterval: () => {}, setTimeout: () => 1, clearTimeout: () => {},
    Object, Array, String, Number, Math, JSON, RegExp, parseInt,
    Date: { now: () => (clock += 1000) },
  };
  vm.createContext(ctx); vm.runInContext(src.slice(a, b), ctx);
  vm.runInContext("lbScansMS=" + JSON.stringify({ "sm-sprints-4": { lessons: BOOK4 } }) + "; mathSprints=" + JSON.stringify(o.state || {}) + ";", ctx);
  return { ctx, writes, checks, toasts, call: e => vm.runInContext(e, ctx), st: () => JSON.parse(JSON.stringify(vm.runInContext("msState('lincoln')", ctx))) };
}
const fresh = () => ({ lincoln: { book: "sm-sprints-4", cur: 401 } });

console.log("── (1) after today's 4th run ──");
{
  const w = world({ state: fresh(), tasks: [{ id: "ms1", who: "lincoln", day: "wednesday", subjectKey: "math_sprints", title: "📄 Math Sprints" }] });
  ["", "", ""].forEach(() => w.call("msRecordRun('lincoln',false)"));
  let h = w.call("buildSprintBookHtml('#4f46e5')");
  ok("before the 4th: 'Run 4 of 4 today', no done banner", /Run 4 of 4 today/.test(h) && !/Today\\'s 4 are done|Today's 4 are done/.test(h));
  w.call("msRecordRun('lincoln',false)");
  h = w.call("buildSprintBookHtml('#4f46e5')");
  ok("after the 4th: '✅ Today's 4 are done — run more?'", /✅ Today's 4 are done — run more\?/.test(h) && !/session done/.test(h) && !/Run 4 of 4/.test(h));
  ok("the timer is still there for more runs", /msTimerStart\(\)/.test(h) && /Extra run 1/.test(h));
  ok("the 4th run checks the card and toasts once", w.checks.length === 1 && w.toasts.length === 1);
  const r = w.call("msRecordRun('lincoln',true)");
  ok("an extra (5th) run still records and still passes the sprint", r && r.met && r.advanced === 402 && w.call("msTodayRuns('lincoln')") === 5);
  ok("the extra run doesn't re-announce 'session done'", w.toasts.length === 1, w.toasts);
  ok("header counts extra runs", /Extra run 2/.test(w.call("buildSprintBookHtml('#4f46e5')")));
}

console.log("\n── (2) change the last run: Met → Not ──");
{
  const w = world({ state: fresh() });
  w.call("msRecordRun('lincoln',false)");          // 401 A1 ✗
  w.call("msRecordRun('lincoln',true)");           // 401 B1 ✓ (wrong tap) → 402
  ok("setup: 401 passed, on 402", w.st().cur === 402 && w.call("msPassed('lincoln',401)"));
  w.writes.length = 0;
  const r = w.call("msEditRun('lincoln',false)");
  const st = w.st();
  ok("the run now reads Not ✗ (and is stamped as edited)", r.changed && st.log[401].runs[1].met === false && st.log[401].runs[1].editedTs);
  ok("401 is no longer passed and the kid is back on 401", !w.call("msPassed('lincoln',401)") && st.cur === 401);
  ok("next sheet follows on: A2", w.call("msNextSheet('lincoln',401)").k === "a2");
  const u = w.writes[0] && w.writes[0][1];
  ok("one targeted write to mathSprints/lincoln: met, passed=null, cur", w.writes.length === 1 && w.writes[0][0] === "mathSprints/lincoln" && u["log/401/runs/1/met"] === false && u["log/401/passed"] === null && u.cur === 401, u);
  ok("today's count is unchanged by an edit", w.call("msTodayRuns('lincoln')") === 2);
}
console.log("\n── change the last run: Not → Met ──");
{
  const w = world({ state: fresh() });
  w.call("msRecordRun('lincoln',false)");          // 401 A1 ✗ (wrong tap)
  w.writes.length = 0;
  w.call("msEditRun('lincoln',true)");
  const st = w.st(), u = w.writes[0][1];
  ok("401 passed, kid moved on to 402, 402 starts at A1", w.call("msPassed('lincoln',401)") && st.cur === 402 && w.call("msNextSheet('lincoln',402)").k === "a1");
  ok("write: met=true, passed=ts, cur=402", u["log/401/runs/0/met"] === true && u["log/401/passed"] && u.cur === 402, u);
  ok("changing to the same result is a no-op", w.call("msEditRun('lincoln',true)").changed === false && w.writes.length === 1);
}
console.log("\n── change the book's last sprint ──");
{
  const w = world({ state: { lincoln: { book: "sm-sprints-4", cur: 404 } } });
  w.call("msRecordRun('lincoln',true)");
  ok("setup: book finished", w.st().done === true);
  w.call("msEditRun('lincoln',false)");
  ok("Met → Not on the last sprint clears 'book finished' and stays on 404", !w.st().done && w.st().cur === 404 && w.writes[w.writes.length - 1][1].done === null);
}

console.log("\n── (2) undo ──");
{
  const w = world({ state: fresh() });
  w.call("msRecordRun('lincoln',false)");          // 401 A1 ✗
  w.call("msRecordRun('lincoln',true)");           // 401 B1 ✓ → 402
  w.call("msRecordRun('lincoln',false)");          // 402 A1 ✗
  ok("the last run today is 402 A1", (() => { const L = w.call("msLastTodayRun('lincoln')"); return L.n === 402 && L.run.sheet === "a1"; })());
  w.writes.length = 0;
  w.call("msUndoRun('lincoln')");
  ok("undo a miss: 402 has no runs, still on 402 at A1", w.call("msRuns('lincoln',402)").length === 0 && w.st().cur === 402 && w.call("msNextSheet('lincoln',402)").k === "a1");
  ok("undo write removes exactly that run", w.writes.length === 1 && w.writes[0][1]["log/402/runs/0"] === null && !("cur" in w.writes[0][1]), w.writes);
  w.call("msUndoRun('lincoln')");
  const st = w.st();
  ok("undo again (the pass): 401 not passed, back on 401, next sheet B1", !w.call("msPassed('lincoln',401)") && st.cur === 401 && w.call("msNextSheet('lincoln',401)").k === "b1");
  ok("…written as runs/1=null, passed=null, cur=401", (u => u["log/401/runs/1"] === null && u["log/401/passed"] === null && u.cur === 401)(w.writes[1][1]), w.writes[1]);
  ok("today's count goes down with each undo", w.call("msTodayRuns('lincoln')") === 1);
  w.call("msRecordRun('lincoln',true)");
  ok("re-recording after undo lands on the same sheet (B1) and the same index", (u => u["log/401/runs/1"] && u["log/401/runs/1"].sheet === "b1")(w.writes[2][1]));
}
console.log("\n── run 2 starts where yesterday left off; yesterday can't be undone ──");
{
  const st = fresh(); st.lincoln.log = { 401: { runs: [{ d: "2026-10-06", ts: "x", sheet: "a1", met: false }] } };
  const w = world({ state: st });
  ok("today's first run is B1 (yesterday ended on A1)", w.call("msNextSheet('lincoln',401)").k === "b1");
  ok("nothing to change or undo before today's first run", w.call("msLastTodayRun('lincoln')") === null && w.call("msUndoRun('lincoln')") === null && w.call("msEditRun('lincoln',true)") === null);
  w.call("msRecordRun('lincoln',false)");
  w.call("msUndoRun('lincoln')");
  ok("undoing today's only run keeps yesterday's A1 and the next sheet is B1 again", w.call("msRuns('lincoln',401)").length === 1 && w.call("msNextSheet('lincoln',401)").k === "b1");
  ok("a second undo can't reach yesterday", w.call("msUndoRun('lincoln')") === null && w.call("msRuns('lincoln',401)").length === 1);
}
console.log("\n── legacy runs (no `at` stamp) ──");
{
  const st = fresh(); st.lincoln.cur = 402; st.lincoln.log = { 401: { runs: [{ d: "2026-10-07", ts: "x", sheet: "a1", met: true }], passed: "x" }, 402: { runs: [{ d: "2026-10-07", ts: "y", sheet: "a1", met: false }] } };
  const w = world({ state: st });
  ok("without stamps the latest is the higher sprint", w.call("msLastTodayRun('lincoln')").n === 402);
}
console.log("\n── guards ──");
{
  const w = world({ state: fresh() }); w.call("msRecordRun('lincoln',true)");
  const k = world({ state: w.st() ? { lincoln: w.st() } : {}, who: "kid" });
  ok("a kid can't change or undo", k.call("msEditRun('lincoln',false)") === null && k.call("msUndoRun('lincoln')") === null && k.writes.length === 0);
  const d = world({ state: { lincoln: w.st() }, dry: true });
  d.call("msEditRun('lincoln',false)"); d.call("msUndoRun('lincoln')");
  ok("dry-run writes nothing (but local state still corrects)", d.writes.length === 0 && d.st().cur === 401 && d.call("msRuns('lincoln',401)").length === 0);
}

console.log("\n── the panel: Change / Undo + ✎ Edit toggle ──");
{
  const w = world({ state: fresh() });
  w.call("msRecordRun('lincoln',false)");
  let h = w.call("buildSprintBookHtml('#4f46e5')");
  ok("Mom sees 'Last run' with ✎ Change to Met and ↶ Undo (confirmed); every onclick parses", /Last run: Sprint 401 · A1/.test(h) && /msEditRun\('lincoln',true\)/.test(h) && /if\(confirm\('Undo the last run \(Sprint 401 · A1\)\?'\)\)msUndoRun\('lincoln'\)/.test(h)
    && [...h.matchAll(/onclick="([^"]*)"/g)].every(m => { try { new Function(m[1]); return true; } catch (e) { return false; } }));
  ok("pickers hidden until ✎ Edit", !/id="ms-pos-book"/.test(h) && !/id="ms-pos-cur"/.test(h) && /msPosEditToggle\(\)/.test(h) && />✎ Edit</.test(h));
  ok("list rows are not tappable to move", !/onclick="msSetPosition\(/.test(h));
  ok("📊 details still open from the list", /msStatsOpen\('lincoln',401\)/.test(h));
  w.call("msPosEditToggle()");
  h = w.call("buildSprintBookHtml('#4f46e5')");
  ok("✎ Edit on: pickers + tappable list + Done", /id="ms-pos-book"/.test(h) && /id="ms-pos-cur"/.test(h) && /onclick="msSetPosition\('lincoln','sm-sprints-4',403/.test(h) && />Done</.test(h));
  w.call("msSetPosition('lincoln','sm-sprints-4',403,'tapped in list')");
  ok("a move closes ✎ Edit again", w.call("msPosEdit") === false && !/id="ms-pos-cur"/.test(w.call("buildSprintBookHtml('#4f46e5')")));
  const s = world({});
  ok("not set up yet: pickers show without the toggle", /id="ms-pos-book"/.test(s.call("buildSprintBookHtml('#4f46e5')")));
  const k = world({ state: fresh(), who: "kid" }); k.ctx.momHere = () => true; k.call("msRecordRun('lincoln',false)"); k.ctx.momHere = () => false;
  const kh = k.call("buildSprintBookHtml('#4f46e5')");
  ok("a kid sees no Change / Undo / Edit", !/msEditRun|msUndoRun|msPosEditToggle/.test(kh));
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
