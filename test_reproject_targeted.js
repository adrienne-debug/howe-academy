/*
 * Node tests for Stage 3.4: her grid edit re-projects THIS WEEK's cards for one plan-backed
 * subject — add / move / remove / retitle by deterministic id, one targeted update, never
 * touching checked/claimed/started/past cards or anyone else. Runs the real REPROJ block.
 *
 *   run:  node test_reproject_targeted.js
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");

const a = src.indexOf("// REPROJ_START"), b = src.indexOf("// REPROJ_END");
if (a < 0 || b < 0) { console.error("REPROJ markers not found"); process.exit(1); }
const block = src.slice(a, b);

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log("  ok  - " + name); }
  else { fail++; console.log("  FAIL- " + name + (extra !== undefined ? "  (" + JSON.stringify(extra) + ")" : "")); }
}
const eq = (x, y) => JSON.stringify(x) === JSON.stringify(y);

const toMin = s => { if (!s) return 0; const m = String(s).match(/(\d+):(\d+)\s*(AM|PM)/i); if (!m) return 0; let h = +m[1] % 12; if (/PM/i.test(m[3])) h += 12; return h * 60 + +m[2]; };
const fromMin = m => { const h = Math.floor(m / 60), mm = m % 60; const ap = h >= 12 ? "PM" : "AM"; const hh = ((h + 11) % 12) + 1; return hh + ":" + String(mm).padStart(2, "0") + " " + ap; };
// packer stub: per-kid cursor seeded past that kid's fixed cards (and past ctx.start), places news in order
const packAround = (fixed, news, ctx) => { const cur = {}; fixed.forEach(t => { cur[t.who] = Math.max(cur[t.who] || ctx.start, toMin(t.time) + (t.dur || 20)); }); news.forEach(t => { const c = Math.max(cur[t.who] || ctx.start, ctx.start); t.time = fromMin(c); cur[t.who] = c + (t.dur || 20); }); return []; };
const dayCtx = () => ({ start: 600, end: 975, lunchStart: 780, lunchEnd: 840 });

function mkEnv() {
  const env = { console, JSON, Object, Array, String, Number, Math, parseInt, Date, RegExp };
  vm.createContext(env); new vm.Script(block).runInContext(env); return env;
}
const T = (id, day, time, title, extra) => Object.assign({ id, who: "lincoln", subjectKey: "ws", day, time, dur: 20, title, lid: id.split("_").pop() }, extra || {});
const OPTS = o => Object.assign({ todayDay: "wednesday", nowMin: 660, checked: {}, claimed: {}, dayCtx, packAround, toMin, fromMin }, o || {});

console.log("_reprojectPlan — pure diff by id");
{
  const e = mkEnv();
  const live = [
    T("lincoln_lincoln__ws_L0001", "monday", "10:00 AM", "WS — a"),      // past, unchecked → untouched even if not desired
    T("lincoln_lincoln__ws_L0002", "wednesday", "10:00 AM", "WS — b"),   // today, started (10:00 ≤ 11:00) → untouched
    T("lincoln_lincoln__ws_L0003", "wednesday", "1:00 PM", "WS — c"),    // today, later → may move
    T("lincoln_lincoln__ws_L0004", "thursday", "10:00 AM", "WS — d"),    // desired gone → remove
    T("lincoln_lincoln__ws_L0005", "friday", "10:00 AM", "WS — e"),      // stays, renamed
    { id: "2026d230_7", who: "lincoln", subjectKey: "aas", day: "thursday", time: "10:00 AM", dur: 30, title: "AAS x" }, // other subject, date-id
    { id: "lincoln_lincoln__mr_L0009", who: "lincoln", subjectKey: "mr", day: "friday", time: "10:00 AM", dur: 20, title: "MR z" }, // other subject, plan id
  ];
  const desired = [
    T("lincoln_lincoln__ws_L0003", "friday", "10:20 AM", "WS — c"),      // moved to friday — generator slot 10:20 (after MR + L0005 at 10:00)
    T("lincoln_lincoln__ws_L0005", "friday", "9:30 AM", "WS — e2"),      // renamed
    T("lincoln_lincoln__ws_L0006", "thursday", "9:00 AM", "WS — f"),     // new
    T("lincoln_lincoln__ws_L0002", "monday", "9:00 AM", "WS — b"),       // generator "wants" it Monday (past) → ignored (started/past)
    { id: "lincoln_lincoln__aas_L0001", who: "lincoln", subjectKey: "aas", day: "friday", time: "9:00 AM", dur: 30, title: "AAS y" }, // other subject → ignored
  ];
  const r = e._reprojectPlan("lincoln", "ws", live, desired, OPTS());
  ok("removed: only the not-desired, not-started card (L0004)", eq(r.summary.removed, ["lincoln_lincoln__ws_L0004"]) && r.upd["lincoln_lincoln__ws_L0004"] === null, r.summary);
  ok("past L0001 untouched though not desired", !("lincoln_lincoln__ws_L0001" in r.upd) && r.tasksAfter.some(t => t.id === "lincoln_lincoln__ws_L0001"));
  ok("today's started L0002 untouched (not moved to Monday)", !Object.keys(r.upd).some(k => k.indexOf("L0002") >= 0) && r.tasksAfter.find(t => t.id.endsWith("L0002")).day === "wednesday");
  ok("moved: L0003 → friday, day+time paths only", eq(r.summary.moved, ["lincoln_lincoln__ws_L0003"]) && r.upd["lincoln_lincoln__ws_L0003/day"] === "friday" && typeof r.upd["lincoln_lincoln__ws_L0003/time"] === "string" && !("lincoln_lincoln__ws_L0003" in r.upd), r.upd);
  ok("added: L0006 on thursday, full task written, INHERITS the slot L0004 freed there (10:00 AM)", eq(r.summary.added, ["lincoln_lincoln__ws_L0006"]) && r.upd["lincoln_lincoln__ws_L0006"] && r.upd["lincoln_lincoln__ws_L0006"].day === "thursday" && r.upd["lincoln_lincoln__ws_L0006"].time === "10:00 AM", r.upd["lincoln_lincoln__ws_L0006"]);
  ok("retitled: L0005 title path only", eq(r.summary.retitled, ["lincoln_lincoln__ws_L0005"]) && r.upd["lincoln_lincoln__ws_L0005/title"] === "WS — e2");
  ok("moved L0003 → friday RE-LAID by rules: L0005 10:00 (gen 9:30) · MR 10:20 (live 10:00) · L0003 10:40 (gen 10:20)", r.upd["lincoln_lincoln__ws_L0003/time"] === "10:40 AM" && r.tasksAfter.find(t => t.id.endsWith("ws_L0005")).time === "10:00 AM" && r.upd["lincoln_lincoln__mr_L0009/time"] === "10:20 AM" && eq(r.summary.relaid, ["friday"]));
  ok("other subjects only ever get a /time (never added/removed/moved-day/retitled)", Object.keys(r.upd).filter(k => /aas|mr_L|2026d/.test(k)).every(k => /\/time$/.test(k)));
  ok("checked / history paths never named", !Object.keys(r.upd).some(k => /checked|history/.test(k)));
  ok("tasksAfter keeps every non-subject card", r.tasksAfter.some(t => t.id === "2026d230_7") && r.tasksAfter.some(t => t.id === "lincoln_lincoln__mr_L0009"));
  // idempotent
  const r2 = e._reprojectPlan("lincoln", "ws", r.tasksAfter, desired, OPTS());
  ok("running again → no changes", eq(r2.upd, {}), r2.upd);
}
{
  const e = mkEnv();
  const live = [T("lincoln_lincoln__ws_L0003", "thursday", "10:00 AM", "WS — c"), T("lincoln_lincoln__ws_L0004", "friday", "10:00 AM", "WS — d")];
  // checked / claimed cards are never removed or moved, but a retitle of a claimed one is fine (checked one is not)
  const r = e._reprojectPlan("lincoln", "ws", live, [T("lincoln_lincoln__ws_L0004", "thursday", "9:00 AM", "WS — d2")], OPTS({ checked: { "lincoln_lincoln__ws_L0003": 1 }, claimed: { "lincoln_lincoln__ws_L0004": 1 } }));
  ok("checked card not removed", !("lincoln_lincoln__ws_L0003" in r.upd));
  ok("claimed card not moved, but retitled", !("lincoln_lincoln__ws_L0004/day" in r.upd) && r.upd["lincoln_lincoln__ws_L0004/title"] === "WS — d2");
}
{
  const e = mkEnv();
  // desired only on past days → nothing added
  const r = e._reprojectPlan("lincoln", "ws", [], [T("lincoln_lincoln__ws_L0001", "monday", "9:00 AM", "WS — a")], OPTS());
  ok("desired card on a past day is not added", eq(r.upd, {}));
  // no time room: packer overflows → card lands at end of day, never dropped
  const over = (fixed, news) => news.slice();
  const r2 = e._reprojectPlan("lincoln", "ws", [T("2026d1_1", "thursday", "3:00 PM", "x", { subjectKey: "aas", dur: 60 })], [T("lincoln_lincoln__ws_L0006", "thursday", null, "WS — f")], OPTS({ packAround: over }));
  ok("no generator slot + packer overflow → still added, timed after the last fixed card (4:00 PM)", r2.upd["lincoln_lincoln__ws_L0006"] && r2.upd["lincoln_lincoln__ws_L0006"].time === "4:00 PM", r2.upd);
  // same-day slot inheritance: finished 12:20 lesson leaves → next lesson moved onto that day takes 12:20
  const r4 = e._reprojectPlan("lincoln", "ws", [T("lincoln_lincoln__ws_L0014", "thursday", "12:20 PM", "WS — a"), T("lincoln_lincoln__ws_L0016", "friday", "11:50 AM", "WS — b")], [T("lincoln_lincoln__ws_L0016", "thursday", "9:00 AM", "WS — b")], OPTS());
  ok("moved-in card inherits the freed same-day slot (12:20 PM), not end of day", r4.upd["lincoln_lincoln__ws_L0016/time"] === "12:20 PM" && r4.upd["lincoln_lincoln__ws_L0016/day"] === "thursday", r4.upd);
  // freed slot already in the past today → not inherited
  const r5 = e._reprojectPlan("lincoln", "ws", [T("lincoln_lincoln__ws_L0014", "wednesday", "1:00 PM", "WS — a"), T("lincoln_lincoln__ws_L0016", "friday", "11:50 AM", "WS — b")], [T("lincoln_lincoln__ws_L0016", "wednesday", "9:00 AM", "WS — b")], OPTS({ nowMin: 14 * 60, dayCtx: () => ({ start: 14 * 60, end: 975, lunchStart: 780, lunchEnd: 840 }) }));   // real dayCtx floors today at now
  ok("a freed slot already past now is not inherited (card packs after now instead)", r5.upd["lincoln_lincoln__ws_L0016/day"] === undefined || toMin(r5.upd["lincoln_lincoln__ws_L0016/time"]) >= 14 * 60, r5.upd);
  // date-id card of a PLAN-BACKED subject = phantom: removed when unlocked, kept when checked/started
  const r3 = e._reprojectPlan("lincoln", "ws", [T("2026d230_5", "thursday", "10:00 AM", "WS — old"), T("2026d230_6", "friday", "10:00 AM", "WS — old2")], [T("lincoln_lincoln__ws_L0009", "thursday", "9:00 AM", "WS — new")], OPTS({ checked: { "2026d230_6": 1 } }));
  ok("unchecked phantom removed, checked phantom kept, new card inherits the phantom's slot", r3.upd["2026d230_5"] === null && !("2026d230_6" in r3.upd) && r3.upd["lincoln_lincoln__ws_L0009"] && r3.upd["lincoln_lincoln__ws_L0009"].time === "10:00 AM", r3.upd);
  const r3b = e._reprojectPlan("lincoln", "ws", [T("2026d230_7", "wednesday", "10:00 AM", "WS — started")], [], OPTS());
  ok("started phantom (today, time passed) kept", eq(r3b.upd, {}));
}

console.log("reprojectSubjectWeek — gating + write");
{
  function mkFull(o) {
    o = o || {};
    const env = {
      console, JSON, Object, Array, String, Number, Math, parseInt, Date, RegExp,
      planBacked: () => o.pb !== false, weekData: { tasks: o.live || [] }, WK: "week18", fbTasksLoaded: true,
      currWeekNum: () => 18, gwWeekDateRange: () => ({ start: "2026-08-17", end: "2026-08-23" }), _schoolWeekDateFor: d => d, _todayStr: () => o.today || "2026-08-19",
      gwSatPlanned: () => false, generateWeek: () => ({ result: { tasks: o.desired || [] } }), gwRules: () => ({ schoolStart: 600, schoolEnd: 975, lunchStart: 780, lunchEnd: 840 }),
      checked: o.checked || {}, claimed: {}, packAround, toMin, fromMin, sv: () => {}, _dryRun: () => false, dbg: () => {}, toast: null,
      gwShowToast: t => { env.toast = t; }, updates: [],
      haClaimSchedLock: (kind, cb) => { if (o.lockHeld) cb(null); else cb(() => {}); },
    };
    env.db = { ref: p => ({ update: u => { env.updates.push({ p, u: JSON.parse(JSON.stringify(u)) }); } }) };
    vm.createContext(env); new vm.Script(block).runInContext(env); return env;
  }
  const live = [T("lincoln_lincoln__ws_L0004", "thursday", "10:00 AM", "WS — d")];
  const desired = [T("lincoln_lincoln__ws_L0006", "thursday", "9:00 AM", "WS — f")];
  const e = mkFull({ live, desired });
  const r = e.reprojectSubjectWeek("lincoln", "ws", "test");
  ok("happy path: one targeted update on week18/tasks (remove L0004, add L0006)", e.updates.length === 1 && e.updates[0].p === "week18/tasks" && e.updates[0].u["lincoln_lincoln__ws_L0004"] === null && e.updates[0].u["lincoln_lincoln__ws_L0006"], e.updates);
  ok("summary returned", r && r.added.length === 1 && r.removed.length === 1);
  ok("in-memory weekData updated", e.weekData.tasks.some(t => t.id.endsWith("L0006")) && !e.weekData.tasks.some(t => t.id.endsWith("L0004")));
  ok("not plan-backed → null, no write", mkFull({ pb: false, live, desired }).reprojectSubjectWeek("lincoln", "ws") === null);
  const eL = mkFull({ live, desired, lockHeld: true });
  ok("lock held elsewhere → no write + toast", eL.reprojectSubjectWeek("lincoln", "ws") === null && eL.updates.length === 0 && /next regenerate/.test(eL.toast || ""));
  const eP = mkFull({ live, desired, today: "2026-08-15" });
  ok("today outside the active plan week (parked/past) → null, no write", eP.reprojectSubjectWeek("lincoln", "ws") === null && eP.updates.length === 0);
  const eN = mkFull({ live: desired, desired });
  ok("nothing to change → no write", eN.reprojectSubjectWeek("lincoln", "ws") && eN.updates.length === 0);
}

console.log("closing-last: Closing Notebook stays the day's final card");
{
  const e = mkEnv();
  const C = (day, time) => ({ id: "c_" + day, who: "lincoln", subjectKey: "closing_nb", day, time, dur: 5, title: "📖 Closing Notebook — Closing Notebook" });
  // Thursday: work ends 2:20, Closing at 3:00; the re-lay ADDS a 20-min lesson → packer stub
  // puts it at 3:05 (after Closing) → the pass moves Closing to 3:25 (one targeted /time).
  const mkLive = () => [T("lincoln_lincoln__ws_L0004", "thursday", "2:00 PM", "WS — d"), C("thursday", "3:00 PM")];
  const desired = [T("lincoln_lincoln__ws_L0004", "thursday", "2:00 PM", "WS — d"), T("lincoln_lincoln__ws_L0005", "thursday", "2:20 PM", "WS — e")];
  const r = e._reprojectPlan("lincoln", "ws", mkLive(), desired, OPTS());
  const cl = r.tasksAfter.find(t => t.id === "c_thursday"), ad = r.tasksAfter.find(t => t.id.endsWith("L0005"));
  ok("closing re-timed to after the last card", cl && ad && toMin(cl.time) === toMin(ad.time) + 20, { closing: cl && cl.time, added: ad && ad.time });
  ok("closing move is a targeted /time write + reported", r.upd["c_thursday/time"] === cl.time && eq(r.summary.closing, ["c_thursday"]));
  // Nothing added on a day → its Closing is left alone even if oddly early
  const live2 = [T("lincoln_lincoln__ws_L0004", "friday", "2:00 PM", "WS — d"), C("friday", "1:00 PM")];
  const r2 = e._reprojectPlan("lincoln", "ws", live2, live2.slice(0, 1), OPTS());
  ok("still touched (subject has a card that day) → closing after work anyway", r2.tasksAfter.find(t => t.id === "c_friday").time === "2:20 PM");
  // Checked closing is locked
  const r3 = e._reprojectPlan("lincoln", "ws", mkLive(), desired, OPTS({ checked: { c_thursday: true } }));
  ok("checked closing never moves", r3.tasksAfter.find(t => t.id === "c_thursday").time === "3:00 PM" && !r3.upd["c_thursday/time"]);
  // Past day closing is locked (started)
  const live4 = [T("lincoln_lincoln__ws_L0004", "monday", "2:00 PM", "WS — d"), C("monday", "1:00 PM")];
  const r4 = e._reprojectPlan("lincoln", "ws", live4, live4.slice(0, 1), OPTS());
  ok("past-day closing never moves", r4.tasksAfter.find(t => t.id === "c_monday").time === "1:00 PM");
}

console.log("extras: swap stays · extra on today → next school day · receiving day re-laid by the rules");
{
  const e = mkEnv();
  const O = (id, who, day, time, dur, extra) => Object.assign({ id, who, subjectKey: "aas", day, time, dur, title: "other " + id }, extra || {});
  const C = (who, day, time) => ({ id: "c_" + who + "_" + day, who, subjectKey: "closing_nb", day, time, dur: 5, title: "📖 Closing Notebook — Closing Notebook" });
  // today = wednesday, now 11:00. Thursday has cards for lincoln (10:00 A, 10:20 B) and lucy (10:00 X). Friday: lincoln 10:00 F1.
  const mk = () => [
    O("wa", "lincoln", "wednesday", "10:00 AM", 20), O("wb", "lincoln", "wednesday", "12:00 PM", 25), C("lincoln", "wednesday", "12:25 PM"),
    O("a", "lincoln", "thursday", "10:00 AM", 20), O("b", "lincoln", "thursday", "10:20 AM", 25), C("lincoln", "thursday", "10:45 AM"),
    O("x", "lucy", "thursday", "10:00 AM", 30),
    O("f1", "lincoln", "friday", "10:00 AM", 20)];
  // 1) EXTRA wanted on TODAY (nothing freed today) → pushed to thursday; thursday re-laid in generator order (WS at 10:20 → between A and B)
  const r = e._reprojectPlan("lincoln", "ws", mk(), [T("lincoln_lincoln__ws_L0007", "wednesday", "11:30 AM", "WS — g"), T("lincoln_lincoln__ws_L0007", "thursday", "10:20 AM", "WS — g")].slice(0, 1).concat([]), OPTS());
  const at = id => (r.tasksAfter.find(t => t.id === id) || {}).time;
  const dayOf = id => (r.tasksAfter.find(t => t.id === id) || {}).day;
  ok("extra on today is NOT placed today — pushed to the next school day (thursday)", dayOf("lincoln_lincoln__ws_L0007") === "thursday" && eq(r.summary.pushed, ["lincoln_lincoln__ws_L0007"]));
  ok("today's cards untouched", at("wa") === "10:00 AM" && at("wb") === "12:00 PM" && !("wb/time" in r.upd));
  ok("thursday re-laid: no generator time for the pushed card → goes last in order (10:45), A/B keep 10:00/10:20", at("a") === "10:00 AM" && at("b") === "10:20 AM" && at("lincoln_lincoln__ws_L0007") === "10:45 AM" && eq(r.summary.relaid, ["thursday"]));
  ok("lucy's thursday card never moves", at("x") === "10:00 AM" && !Object.keys(r.upd).some(k => k.indexOf("x") === 0));
  ok("thursday closing follows", at("c_lincoln_thursday") === "11:05 AM");
  // 2) EXTRA wanted on THURSDAY with generator slot 10:20 → thursday re-laid in that order: A · WS · B
  const r2 = e._reprojectPlan("lincoln", "ws", mk(), [T("lincoln_lincoln__ws_L0007", "thursday", "10:20 AM", "WS — g")], OPTS());
  const at2 = id => (r2.tasksAfter.find(t => t.id === id) || {}).time;
  ok("future-day extra: kid's day re-laid in workflow order — A 10:00 · WS 10:20 · B 10:40", at2("a") === "10:00 AM" && at2("lincoln_lincoln__ws_L0007") === "10:20 AM" && at2("b") === "10:40 AM");
  ok("B's move is a targeted /time write, reported as shifted", r2.upd["b/time"] === "10:40 AM" && eq(r2.summary.shifted, ["b"]));
  ok("closing follows to 11:05", at2("c_lincoln_thursday") === "11:05 AM" && r2.upd["c_lincoln_thursday/time"] === "11:05 AM");
  ok("nothing pushed/deferred", eq(r2.summary.pushed, []) && eq(r2.summary.deferred, []));
  // 3) SWAP on today: L0006 leaves today (unstarted, 12:30), generator wants L0007 today → takes 12:30, nothing else moves
  const live3 = mk().concat([T("lincoln_lincoln__ws_L0006", "wednesday", "12:30 PM", "WS — f")]);
  const r3 = e._reprojectPlan("lincoln", "ws", live3, [T("lincoln_lincoln__ws_L0007", "wednesday", "10:00 AM", "WS — g")], OPTS());
  const at3 = id => (r3.tasksAfter.find(t => t.id === id) || {}).time;
  ok("swap on today: new card takes the freed 12:30 slot, stays today", (r3.tasksAfter.find(t => t.id.endsWith("L0007")) || {}).day === "wednesday" && at3("lincoln_lincoln__ws_L0007") === "12:30 PM" && eq(r3.summary.pushed, []));
  ok("swap: no other card on the day moves", at3("wa") === "10:00 AM" && at3("wb") === "12:00 PM" && eq(r3.summary.shifted, []) && eq(r3.summary.relaid, []));
  // 4) EXTRA on today with NO later school day this week (today = friday) → not added, deferred
  const r4 = e._reprojectPlan("lincoln", "ws", [O("f1", "lincoln", "friday", "10:00 AM", 20)], [T("lincoln_lincoln__ws_L0007", "friday", "10:20 AM", "WS — g")], OPTS({ todayDay: "friday" }));
  ok("no next school day → not added this week, reported deferred", !r4.tasksAfter.some(t => t.id.endsWith("L0007")) && eq(r4.summary.deferred, ["lincoln_lincoln__ws_L0007"]) && eq(r4.upd, {}));
  // 5) checked card on the receiving day never moves; the re-lay packs around it
  const live5 = [O("a", "lincoln", "thursday", "10:00 AM", 20), O("b", "lincoln", "thursday", "10:20 AM", 25)];
  const r5 = e._reprojectPlan("lincoln", "ws", live5, [T("lincoln_lincoln__ws_L0007", "thursday", "10:00 AM", "WS — g")], OPTS({ checked: { b: 1 } }));
  const at5 = id => (r5.tasksAfter.find(t => t.id === id) || {}).time;
  ok("checked B stays 10:20; A and WS pack after it (kid cursor seeded past the locked card)", at5("b") === "10:20 AM" && !("b/time" in r5.upd) && toMin(at5("lincoln_lincoln__ws_L0007")) >= toMin("10:45 AM") && toMin(at5("a")) >= toMin("10:45 AM"));
  // idempotent
  const r6 = e._reprojectPlan("lincoln", "ws", r2.tasksAfter, [T("lincoln_lincoln__ws_L0007", "thursday", "10:20 AM", "WS — g")], OPTS());
  ok("running again → no changes", eq(r6.upd, {}), r6.upd);
}

console.log("hooks (source assertions)");
{
  ok("cbApply calls reprojectSubjectWeek(kid,sk,'relay') after the cells write", /reprojectSubjectWeek\(kid,sk,"relay"\)/.test(src));
  ok("cbUndo re-syncs after restoring cells", /reprojectSubjectWeek\(_uk2,_us2,"undo"\)/.test(src));
  ok("never writes via gwCommit / whole-map set", !/reprojectSubjectWeek[\s\S]{0,4000}gwCommit\(\)/.test(block) && !/\.set\(/.test(block));
}

console.log("closing-last: a Mom-required Closing (Julian) never lands on another kid's Mom card");
{
  const e = mkEnv();
  const J = (id, day, time, extra) => Object.assign({ id, who: "julian", subjectKey: "ws", day, time, dur: 10, title: "J", lid: id.split("_").pop() }, extra || {});
  const CJ = (day, time) => ({ id: "cj_" + day, who: "julian", subjectKey: "closing_nb", day, time, dur: 5, mom: "required", title: "📖 Closing Notebook — Closing Notebook" });
  const CL = (day, time) => ({ id: "cl_" + day, who: "lincoln", subjectKey: "closing_nb", day, time, dur: 5, mom: "none", title: "📖 Closing Notebook — Closing Notebook" });
  // Thursday: the re-lay re-packs Julian's day from 10:00 (stub) → L0001 10:00, L0002 10:10, work ends 10:20;
  // Lucy has a Mom-required HWT 10:20–10:30 and Read-Aloud 10:30–10:50 → Julian's closing must land at 10:50, not 10:20.
  const lucyHWT = { id: "lucy_lucy__hwt_L0026", who: "lucy", subjectKey: "hwt", day: "thursday", time: "10:20 AM", dur: 10, mom: "required", title: "HWT" };
  const lucyRA = { id: "ra_lucy", who: "lucy", subjectKey: "read_aloud", day: "thursday", time: "10:30 AM", dur: 20, mom: "required", title: "Read-Aloud" };
  const lucyIndep = { id: "ind_lucy", who: "lucy", subjectKey: "x", day: "thursday", time: "10:50 AM", dur: 20, mom: "none", title: "independent" };
  const live = [J("julian_julian__ws_L0001", "thursday", "11:00 AM"), CJ("thursday", "11:10 AM"), lucyHWT, lucyRA, lucyIndep];
  const desired = [J("julian_julian__ws_L0001", "thursday", "11:00 AM"), J("julian_julian__ws_L0002", "thursday", "11:10 AM")];
  const r = e._reprojectPlan("julian", "ws", live, desired, OPTS());
  const cj = r.tasksAfter.find(t => t.id === "cj_thursday"), ad = r.tasksAfter.find(t => t.id.endsWith("L0002"));
  ok("added lesson packed after his last card", ad && ad.time === "10:10 AM", ad && ad.time);
  ok("Mom-required closing slides past Lucy's Mom cards (10:20→10:50)", cj && cj.time === "10:50 AM", cj && cj.time);
  ok("write is the slid time", r.upd["cj_thursday/time"] === "10:50 AM" && eq(r.summary.closing, ["cj_thursday"]));
  // A closing that doesn't need Mom still sits right after the kid's last card, Mom cards or not.
  const live2 = [T("lincoln_lincoln__ws_L0004", "thursday", "11:00 AM", "WS — d"), CL("thursday", "11:05 AM"), Object.assign({}, lucyHWT, { time: "10:40 AM" })];
  const desired2 = [T("lincoln_lincoln__ws_L0004", "thursday", "11:00 AM", "WS — d"), T("lincoln_lincoln__ws_L0005", "thursday", "11:20 AM", "WS — e")];
  const r2 = e._reprojectPlan("lincoln", "ws", live2, desired2, OPTS());
  ok("non-Mom closing = kid's last end (10:40), ignores Lucy's Mom card", r2.tasksAfter.find(t => t.id === "cl_thursday").time === "10:40 AM", r2.tasksAfter.find(t => t.id === "cl_thursday").time);
  // Pure helper: nested/overlapping busy intervals
  const tm = toMin;
  const slot = e.momClosingSlot({ id: "c", who: "julian", mom: "required", dur: 5 }, [
    { id: "a", who: "lucy", mom: "required", time: "11:00 AM", dur: 60 },
    { id: "b", who: "ellis", mom: "required", time: "11:30 AM", dur: 10 },
    { id: "c2", who: "lincoln", mom: "required", time: "12:00 PM", dur: 10 },
    { id: "d", who: "lucy", mom: "maybe", time: "12:10 PM", dur: 30 },
  ], tm("11:20 AM"), tm);
  ok("helper: 11:20 → 12:10 (past nested Lucy/Ellis block and Lincoln's 12:00; 'maybe' ignored)", slot === tm("12:10 PM"), slot);
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
