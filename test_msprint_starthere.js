/*
 * 🔢 Math Sprints — ✎ Start here (MSSTART; her ask 2026-10-15: "an adjust button to adjust each time, so I can say no,
 * I'm starting here, I'm starting on this"). On any run, Mom on or off, pick the sprint + the sheet THIS run is: logged
 * as a move (moves/<i>, why "start here", the sheet), remembered on the sprint's log as from={sheet,at}; the next run is
 * that sheet, the ones after follow on, after B2 the sprint wraps to A1 as ever; undo past the mark drops it; a passed
 * sprint picked here reopens. Targeted writes to mathSprints/<kid>; dry-run inert.
 *   run:  node test_msprint_starthere.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const a = src.indexOf("// MSPRINT_START"), b = src.indexOf("// MSPRINT_END");
if (a < 0 || b < 0 || src.indexOf("// MSSTART_START") < a || src.indexOf("// MSSTART_END") > b) { console.error("MSPRINT / MSSTART markers not found"); process.exit(1); }
let pass = 0, fail = 0;
function ok(n, c, x) { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x) + ")" : "")); } }

function world(o) {
  o = o || {};
  let now = 1000; const timers = []; let tid = 0; let mom = o.mom !== false;
  function Ctx() { this.state = "running"; this.destination = {}; }
  Object.defineProperty(Ctx.prototype, "currentTime", { get() { return now / 1000; } });
  Ctx.prototype.resume = () => Promise.resolve();
  Ctx.prototype.createOscillator = () => ({ type: "", frequency: {}, connect() {}, disconnect() {}, start() {}, stop() {} });
  Ctx.prototype.createGain = () => ({ connect() {}, disconnect() {}, gain: { set value(v) {}, setValueAtTime() {}, linearRampToValueAtTime() {} } });
  const els = {}; let html = ""; const writes = [];
  const ctx = {
    console, masteryKid: "lincoln", mastView: "sprint", sprintSource: "book", tab: "mastery",
    SL_KLBL: { lincoln: "Lincoln" }, _todayDay: "thursday", weekData: { tasks: [] }, checked: {}, claimed: {},
    momHere: () => mom, nowTs: () => "12:20 PM Oct 15", cbTodayISO: () => "2026-10-15",
    effectiveDay: t => t.day, toMin: () => 0, tsToMin: () => 0, finalizeDone: () => true, showPaceToast: () => {},
    dbg: () => {}, gwShowToast: () => {}, renderAll: () => {}, showTab: () => {}, bbChime: () => {},
    _dryRun: () => !!o.dry, db: { ref: p => ({ update: v => writes.push([p, v]), set: v => writes.push([p, v]) }) },
    document: { getElementById: id => els[id] || null },
    performance: { now: () => now }, window: { AudioContext: Ctx },
    setInterval: (fn, ms) => { const t = { id: ++tid, fn, at: now + ms, every: ms, live: true }; timers.push(t); return t.id; },
    clearInterval: id => timers.forEach(t => { if (t.id === id) t.live = false; }),
    setTimeout: (fn, ms) => { const t = { id: ++tid, fn, at: now + ms, once: true, live: true }; timers.push(t); return t.id; },
    clearTimeout: id => timers.forEach(t => { if (t.id === id) t.live = false; }),
    Object, Array, String, Number, Math, Date, JSON, RegExp, parseInt, Promise,
  };
  ctx._mastRe = () => {
    html = vm.runInContext("buildSprintBookHtml('#4f46e5')", ctx);
    ["ms-timer", "ms-timer-bar", "ms-start", "ms-pencils", "ms-mark"].forEach(id => { const m = new RegExp('id="' + id + '"[^>]*style="([^"]*)"').exec(html); els[id] = { id, textContent: "", disabled: false, style: { display: (m && /display:(\w+)/.exec(m[1]) || [])[1] } }; });
    // the two pickers, with whatever is marked selected (a Start tap reads them)
    ["ms-sh-cur", "ms-sh-sheet"].forEach(id => { const m = new RegExp('id="' + id + '"[\\s\\S]*?</select>').exec(html); const sel = m && /<option value="([^"]*)" selected/.exec(m[0]); els[id] = m ? { id, value: sel ? sel[1] : "" } : null; if (!m) delete els[id]; });
  };
  vm.createContext(ctx);
  vm.runInContext("let bbAlarmCtx=null;function bbAudioUnlock(){}\n" + src.slice(a, b), ctx);
  vm.runInContext("lbScansMS=" + JSON.stringify({ "sm-sprints-4": { lessons: ["Sprint 406 · Hundred", "Sprint 407 · Place value", "Sprint 408 · Subtract", "Sprint 409 · Add"] } }) + "; mathSprints=" + JSON.stringify(o.state || { lincoln: { book: "sm-sprints-4", cur: 407, log: { 406: { passed: "x", runs: [{ d: "2026-10-07", ts: "t", at: 1, sheet: "a1", met: true }] }, 407: { runs: [{ d: "2026-10-07", ts: "t", at: 2, sheet: "a1", met: false }, { d: "2026-10-07", ts: "t", at: 3, sheet: "b1", met: false }] } } } }) + ";", ctx);
  function advanceTo(T) { for (;;) { const d = timers.filter(t => t.live && t.at <= T).sort((x, y) => x.at - y.at)[0]; if (!d) break; now = d.at; if (d.once) d.live = false; else d.at += d.every; d.fn(); } now = T; }
  ctx._mastRe();
  const w = { ctx, els, writes, call: e => vm.runInContext(e, ctx), advanceTo, now: () => now, html: () => html, re: ctx._mastRe, setMom: v => { mom = v; } };
  w.run = met => { w.re(); w.call("msTimerStart()"); w.advanceTo(w.now() + 61500); return w.call("msRecordRun('lincoln'," + met + ")"); };
  w.next = () => w.call("(msNextSheet('lincoln',msState('lincoln').cur)||{}).k||null");
  return w;
}
const parses = h => [...h.matchAll(/onclick="([^"]*)"/g)].every(m => { try { new Function(m[1]); return true; } catch (e) { return false; } });

console.log("🔢 the panel: ✎ Start here under 'Run N of 4', Mom off");
{
  const w = world({ mom: false });
  ok("the link sits under the run line; no pickers yet", /Run 1 of 4 today<\/div>\s*<div[^>]*><span onclick="msStartToggle\(\)"[^>]*>✎ Start here/.test(w.html()) && !/id="ms-sh-cur"/.test(w.html()));
  w.call("msStartToggle()"); w.re();
  ok("open: sprint picker (passed ones ✓), sheet picker preset to the sheet that was next (A · 2nd half), Start, Cancel; onclicks parse",
    /id="ms-sh-cur"/.test(w.html()) && /<option value="406"[^>]*>406 · Hundred ✓</.test(w.html()) && /<option value="407" selected/.test(w.html()) && w.els["ms-sh-sheet"].value === "a2" && /msStartFromForm\('lincoln'\)/.test(w.html()) && />Cancel</.test(w.html()) && parses(w.html()), w.els["ms-sh-sheet"]);
  w.call("msStartToggle()"); w.re();
  ok("Cancel closes it", !/id="ms-sh-cur"/.test(w.html()) && /✎ Start here/.test(w.html()));
  w.call("msTimerStart()"); w.re();
  ok("mid-run: no link, and the toggle does nothing", !/Start here/.test(w.html()) && (w.call("msStartToggle()"), w.call("msStartOpen")) === false);
  w.advanceTo(w.now() + 60000); w.re();
  ok("at 0:00 (marking time): no link either", !/Start here/.test(w.html()));
  ok("…and msStartHere refuses until the run is marked", w.call("msStartHere('lincoln',408,'a1')") === null && w.writes.length === 0);
}
console.log("\n── 'I'm starting here': 407 · B · 2nd half, then the runs follow on and wrap ──");
{
  const w = world({ mom: false });
  w.call("msStartToggle()"); w.re(); w.els["ms-sh-cur"].value = "407"; w.els["ms-sh-sheet"].value = "b2";
  w.call("msStartFromForm('lincoln')");
  ok("the picker closes and the next run is B · 2nd half", w.call("msStartOpen") === false && w.next() === "b2" && /Sheet B · 2nd half/.test((w.re(), w.html())));
  const wr = w.writes[0];
  ok("ONE targeted update on mathSprints/lincoln: cur, log/407/from, moves/0", w.writes.length === 1 && wr[0] === "mathSprints/lincoln" && Object.keys(wr[1]).sort().join() === "cur,log/407/from,moves/0", wr && Object.keys(wr[1]));
  ok("the move: why 'start here', from 407 → to 407 + sheet b2", wr[1]["moves/0"].why === "start here" && wr[1]["moves/0"].from.cur === 407 && wr[1]["moves/0"].to.cur === 407 && wr[1]["moves/0"].to.sheet === "b2" && wr[1]["log/407/from"].sheet === "b2" && wr[1]["log/407/from"].at === 2, wr[1]["moves/0"]);
  ok("the Moves line shows it", /Moves:/.test((w.setMom(true), w.call("msPosEditToggle()"), w.re(), w.html())) && /#407/.test(w.html()));
  w.setMom(false); w.call("msPosEditToggle()");
  const r1 = w.run(false);
  ok("run 1 records B2 miss on 407, run log continues (A1 B1 from Oct 7 kept)", r1.sheet === "b2" && w.call("msRuns('lincoln',407).map(r=>r.sheet).join()") === "a1,b1,b2", r1);
  ok("after B2 the sprint wraps to A · 1st (four misses start over)", w.next() === "a1");
  w.run(false); ok("…then B1", w.next() === "b1");
  const r3 = w.run(true);
  ok("a Met passes 407 and moves on to 408 · A1 as ever", r3.met && r3.advanced === 408 && w.next() === "a1", r3);
}
console.log("\n── mid-sprint 'I'm starting on this': 408 · A · 2nd half, follow on, then undo back past the mark ──");
{
  const w = world({ mom: false });
  w.call("msStartHere('lincoln',408,'a2')");
  ok("on 408, next A2; 407 untouched (A1 B1 still there, not passed)", w.call("msState('lincoln').cur") === 408 && w.next() === "a2" && w.call("msRuns('lincoln',407).length") === 2 && !w.call("msPassed('lincoln',407)"));
  w.run(false); ok("miss → B2", w.next() === "b2");
  w.run(false); ok("miss → wraps to A1", w.next() === "a1");
  w.call("msUndoRun('lincoln')"); ok("undo one → B2 again", w.next() === "b2");
  w.call("msUndoRun('lincoln')"); ok("undo to the mark → A2 (the mark holds)", w.next() === "a2" && w.call("msRuns('lincoln',408).length") === 0);
  ok("every write targeted under mathSprints/lincoln", w.writes.every(x => x[0] === "mathSprints/lincoln"), w.writes.map(x => Object.keys(x[1])));
  const v = world({ mom: false, state: { lincoln: { book: "sm-sprints-4", cur: 408, log: { 408: { runs: [{ d: "2026-10-14", ts: "t", at: 1, sheet: "a1", met: false }, { d: "2026-10-14", ts: "t", at: 2, sheet: "b1", met: false }] } } } } });
  v.call("msStartHere('lincoln',408,'b2')"); v.call("msUndoRun('lincoln')");   // yesterday's runs can't be undone (today only) — the mark holds
  ok("a mark set after older runs: at=2, next B2", v.next() === "b2" && v.call("msState('lincoln').log[408].from.at") === 2);
  const u = world({ mom: false, state: { lincoln: { book: "sm-sprints-4", cur: 408, log: { 408: { runs: [{ d: "2026-10-15", ts: "t", at: 1, sheet: "a1", met: false }, { d: "2026-10-15", ts: "t", at: 2, sheet: "b1", met: false }] } } } } });
  u.call("msStartHere('lincoln',408,'b2')"); u.call("msUndoRun('lincoln')");
  ok("undo PAST the mark (today's run before it): the plain cycle returns — 1 run → B1", u.next() === "b1");
}
console.log("\n── a passed sprint picked here reopens; book end; guards; dry-run; Mom on ──");
{
  const w = world({ mom: false });
  const r = w.call("msStartHere('lincoln',406,'a1')");
  ok("406 was passed: now open again, its old run kept, next A1; passed cleared in the same write", r && !w.call("msPassed('lincoln',406)") && w.call("msRuns('lincoln',406).length") === 1 && w.next() === "a1" && w.writes[0][1]["log/406/passed"] === null, w.writes[0] && Object.keys(w.writes[0][1]));
  const d = world({ mom: false, state: { lincoln: { book: "sm-sprints-4", cur: 409, done: true, log: { 409: { passed: "x", runs: [{ d: "2026-10-14", ts: "t", at: 1, sheet: "a1", met: true }] } } } } });
  ok("book finished: no Start here link", !/Start here/.test(d.html()));
  d.call("msStartHere('lincoln',409,'b1')"); d.re();
  ok("…but a direct start here on the last sprint reopens the book (done cleared) and the run shows", d.call("msState('lincoln').done") === undefined && d.writes[0][1].done === null && /Sheet B · 1st half/.test(d.html()));
  const g = world({ mom: false });
  ok("a sprint not in the book or a bad sheet is refused, nothing written", g.call("msStartHere('lincoln',999,'a1')") === null && g.call("msStartHere('lincoln',408,'zz')") === null && g.writes.length === 0);
  const dr = world({ mom: false, dry: true }); dr.call("msStartHere('lincoln',408,'b1')");
  ok("dry-run: local state moves, nothing written", dr.call("msState('lincoln').cur") === 408 && dr.next() === "b1" && dr.writes.length === 0);
  const m = world({ mom: true }); m.call("msStartHere('lincoln',408,'a2')");
  ok("Mom on: same thing", m.next() === "a2" && m.writes.length === 1 && /✎ Edit</.test((m.re(), m.html())));
}
console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
