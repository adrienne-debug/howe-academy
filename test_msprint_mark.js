/*
 * 🔢 Math Sprints — marking needs no Mom mode (MSMARK; her rule 2026-10-15: "maybe to open the sprint but once open no
 * mom mode needed"). Replay of the live failure 2026-10-08 → 10-15: Mom opens the sprint from Mom's Day's ▶ link, the
 * Mom's Day gate turns Mom mode off on the way, the timer runs to 0:00 … and the panel showed only "Mom marks met / not"
 * — no Met / Not, nothing recorded, for a week. Now: Met / Not, ✎ Change and ↶ Undo work with Mom off, runs 1–4 chain
 * on, writes are the same targeted paths as ever; the position (✎ Edit) and the book list stay Mom-only.
 *   run:  node test_msprint_mark.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const a = src.indexOf("// MSPRINT_START"), b = src.indexOf("// MSPRINT_END");
if (a < 0 || b < 0 || src.indexOf("// MSMARK", a) < 0 || src.indexOf("// MSMARK", a) > b) { console.error("MSPRINT / MSMARK markers not found"); process.exit(1); }
let pass = 0, fail = 0;
function ok(n, c, x) { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x) + ")" : "")); } }

// the same fake world as test_sprint_buzz.js, plus a re-render that rebuilds the panel's nodes from the HTML (as
// _mastRe does), so every run starts from what the screen really shows
function world(o) {
  o = o || {};
  let now = 1000; const timers = []; let tid = 0; let mom = o.mom !== false;
  function Ctx() { this.state = "running"; this.destination = {}; }
  Object.defineProperty(Ctx.prototype, "currentTime", { get() { return now / 1000; } });
  Ctx.prototype.resume = () => Promise.resolve();
  Ctx.prototype.createOscillator = () => ({ type: "", frequency: {}, connect() {}, disconnect() {}, start() {}, stop() {} });
  Ctx.prototype.createGain = () => ({ connect() {}, disconnect() {}, gain: { set value(v) {}, setValueAtTime() {}, linearRampToValueAtTime() {} } });
  const els = {}; let html = "";
  const writes = [], toasts = [];
  const ctx = {
    console, masteryKid: "lincoln", mastView: "sprint", sprintSource: "book", tab: "mastery",
    SL_KLBL: { lincoln: "Lincoln" }, _todayDay: "thursday", weekData: { tasks: o.tasks || [] }, checked: {}, claimed: {},
    momHere: () => mom, nowTs: () => "12:20 PM Oct 15", cbTodayISO: () => "2026-10-15",
    effectiveDay: t => t.day, toMin: () => 0, tsToMin: () => 0, finalizeDone: (id) => { ctx.checked[id] = "12:20 PM"; return true; }, showPaceToast: () => {},
    dbg: () => {}, gwShowToast: m => toasts.push(m), renderAll: () => {}, showTab: () => {}, bbChime: () => {},
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
    ["ms-timer", "ms-timer-bar", "ms-start", "ms-pencils", "ms-mark"].forEach(id => {
      const m = new RegExp('id="' + id + '"[^>]*style="([^"]*)"').exec(html);
      els[id] = { id, textContent: "", disabled: id === "ms-start" && /id="ms-start"[^>]*disabled/.test(html), style: { display: (m && /display:(\w+)/.exec(m[1]) || [])[1] } };
    });
  };
  vm.createContext(ctx);
  vm.runInContext("let bbAlarmCtx=null;function bbAudioUnlock(){}\n" + src.slice(a, b), ctx);
  vm.runInContext("lbScansMS=" + JSON.stringify({ "sm-sprints-4": { lessons: ["Sprint 407 · Place value", "Sprint 408 · Subtract", "Sprint 409 · Add"] } }) + "; mathSprints=" + JSON.stringify(o.state || { lincoln: { book: "sm-sprints-4", cur: 407, log: { 407: { runs: [{ d: "2026-10-07", ts: "12:23 PM Oct 7", at: 1, sheet: "a1", met: false }, { d: "2026-10-07", ts: "12:27 PM Oct 7", at: 2, sheet: "b1", met: false }] } } } }) + ";", ctx);
  function advanceTo(T) { for (;;) { const d = timers.filter(t => t.live && t.at <= T).sort((x, y) => x.at - y.at)[0]; if (!d) break; now = d.at; if (d.once) d.live = false; else d.at += d.every; d.fn(); } now = T; }
  ctx._mastRe();
  return { ctx, els, writes, toasts, call: e => vm.runInContext(e, ctx), advanceTo, now: () => now, html: () => html, re: ctx._mastRe, setMom: v => { mom = v; } };
}
const metBtn = h => /onclick="msRecordRun\('lincoln',true\)"/.test(h), notBtn = h => /onclick="msRecordRun\('lincoln',false\)"/.test(h);

console.log("🔢 the live failure: Mom's Day ▸ ▶ turned Mom off; at 0:00 there were no buttons");
{
  const w = world({ mom: false, tasks: [{ id: "ms_thu", who: "lincoln", day: "thursday", subjectKey: "math_sprints", title: "📄 Math Sprints" }] });
  ok("Mom off: the panel still carries Met ✓ and Not ✗", metBtn(w.html()) && notBtn(w.html()));
  ok("…and the old 'Mom marks met / not' text is gone", !/Mom marks met \/ not/.test(w.html()));
  ok("Lincoln picks up where Oct 7 left off: Sprint 407, sheet A · 2nd half, run 1 of 4", /Sprint 407/.test(w.html()) && /Sheet A · 2nd half/.test(w.html()) && /Run 1 of 4 today/.test(w.html()));
  // run 1
  w.call("msTimerStart()"); w.advanceTo(w.now() + 60000);
  ok("run 1 at 0:00: Met / Not row shows", w.els["ms-mark"].style.display === "flex" && w.els["ms-timer"].textContent === "0:00");
  w.re();   // a live-data repaint lands here (the mathSprints listener) — buttons must survive it
  ok("…and survives a repaint", w.els["ms-mark"].style.display === "flex" && metBtn(w.html()));
  w.advanceTo(w.now() + 1500);
  const r1 = w.call("msRecordRun('lincoln',false)");
  ok("Not ✗ records with Mom off: 407 A2 miss", r1 && r1.n === 407 && r1.sheet === "a2" && r1.met === false, r1);
  ok("write: mathSprints/lincoln · log/407/runs/2 only", w.writes.length === 1 && w.writes[0][0] === "mathSprints/lincoln" && Object.keys(w.writes[0][1]).join() === "log/407/runs/2", w.writes);
  // runs 2–4
  const seq = [];
  [true, false, true].forEach(met => { w.re(); w.call("msTimerStart()"); w.advanceTo(w.now() + 60000); seq.push(w.els["ms-mark"].style.display); w.advanceTo(w.now() + 1500); w.call("msRecordRun('lincoln'," + met + ")"); });
  ok("runs 2, 3, 4 each end with the Met / Not row showing", seq.every(d => d === "flex"), seq);
  ok("the session chains: 407 B2 ✓ → 408 A1 ✗ → 408 B1 ✓ → on 409", w.call("msState('lincoln').cur") === 409 && w.call("msPassed('lincoln',407)") && w.call("msPassed('lincoln',408)") && w.call("msRuns('lincoln',408).map(r=>r.sheet+(r.met?'+':'-')).join()") === "a1-,b1+");
  ok("run 4 checks today's Math Sprints card and toasts once", w.ctx.checked["ms_thu"] && w.toasts.filter(t => /session done/.test(t)).length === 1, w.toasts);
  ok("every write is a targeted update on mathSprints/lincoln (runs, passed, cur)", w.writes.length === 4 && w.writes.every(x => x[0] === "mathSprints/lincoln" && Object.keys(x[1]).every(k => /^(log\/\d+\/(runs\/\d+|passed)|cur|done)$/.test(k))), w.writes.map(x => Object.keys(x[1])));
}
console.log("\n── Mom off: Change / Undo of the last run; position + book list stay Mom-only ──");
{
  const w = world({ mom: false });
  w.call("msTimerStart()"); w.advanceTo(w.now() + 61500); w.call("msRecordRun('lincoln',false)"); w.re();
  ok("Last run row shows ✎ Change and ↶ Undo", /Last run: Sprint 407 · A2/.test(w.html()) && /msEditRun\('lincoln',true\)/.test(w.html()) && /msUndoRun\('lincoln'\)/.test(w.html()));
  const e = w.call("msEditRun('lincoln',true)");
  ok("✎ Change to Met works with Mom off and moves him on to 408", e && e.changed === true && w.call("msState('lincoln').cur") === 408, e);
  const u = w.call("msUndoRun('lincoln')");
  ok("↶ Undo works with Mom off and puts him back on 407, A2 next", u && u.n === 407 && w.call("msState('lincoln').cur") === 407 && w.call("msNextSheet('lincoln',407).k") === "a2", u);
  ok("no ✎ Edit (position) button, no pickers, list rows not tappable", !/msPosEditToggle/.test(w.html()) && !/id="ms-pos-cur"/.test(w.html()) && !/onclick="msSetPosition\(/.test(w.html()));
  w.call("msPosEditToggle()"); w.call("msSetPosition('lincoln','sm-sprints-4',409,'tapped in list')"); w.call("msBookSave('sm-sprints-4',3,'a\\nb\\nc')");
  ok("position / book-list changes are still refused without Mom", w.call("msPosEdit") === false && w.call("msState('lincoln').cur") === 407 && w.writes.every(x => x[0] === "mathSprints/lincoln" && !("cur" in x[1] && x[1].cur === 409)) && !w.writes.some(x => /library/.test(x[0])), w.writes.map(x => x[0]));
  ok("the 0:00 lock still holds with Mom off (a tap in the first moment can't mark)", (() => { const k = world({ mom: false }); k.call("msTimerStart()"); k.advanceTo(k.now() + 60000); return k.call("msRecordRun('lincoln',true)") === null && k.writes.length === 0; })());
  const d = world({ mom: false, dry: true }); d.call("msTimerStart()"); d.advanceTo(d.now() + 61500); d.call("msRecordRun('lincoln',true)");
  ok("dry-run writes nothing", d.writes.length === 0 && d.call("msState('lincoln').cur") === 408);
}
console.log("\n── Mom on: unchanged ──");
{
  const w = world({ mom: true });
  ok("Met / Not, ✎ Edit and the book editor all there", metBtn(w.html()) && /msPosEditToggle/.test(w.html()));
  w.call("msTimerStart()"); w.advanceTo(w.now() + 61500);
  ok("a run records as before", w.call("msRecordRun('lincoln',true)").met === true && w.writes.length === 1);
}
console.log("\n── no sprint state: the recorder returns null, never throws (hub review 2026-10-15: the guard had been swallowed into a comment) ──");
{
  const w = world({ mom: false });
  let r = "threw", threw = null; try { r = w.call("msRecordRun('ellis',true)"); } catch (e) { threw = e.message; }
  ok("a kid with no sprint state → null, no throw", r === null && !threw, threw);
  ok("… and nothing written", w.writes.length === 0);
  w.call("mathSprints.lincoln.cur=null");
  let r2 = "threw", threw2 = null; try { r2 = w.call("msRecordRun('lincoln',true)"); } catch (e) { threw2 = e.message; }
  ok("a kid whose state has no cur → null, no throw", r2 === null && !threw2, threw2);
}
console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
