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
// simple packer stub: place each new task right after the last fixed task (or day start)
const packAround = (fixed, news, ctx) => { let cur = ctx.start; fixed.forEach(t => { cur = Math.max(cur, toMin(t.time) + (t.dur || 20)); }); news.forEach(t => { t.time = fromMin(cur); cur += (t.dur || 20); }); return []; };
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
    T("lincoln_lincoln__ws_L0003", "friday", "9:00 AM", "WS — c"),       // moved to friday
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
  ok("moved L0003 packed on friday after MR (10:20 — nothing freed there) and L0005 stays 10:00", r.upd["lincoln_lincoln__ws_L0003/time"] === "10:20 AM");
  ok("other subjects never named", !Object.keys(r.upd).some(k => /aas|mr_L|2026d/.test(k)));
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
  const r2 = e._reprojectPlan("lincoln", "ws", [T("2026d1_1", "thursday", "3:00 PM", "x", { subjectKey: "aas", dur: 60 })], [T("lincoln_lincoln__ws_L0006", "thursday", "9:00 AM", "WS — f")], OPTS({ packAround: over }));
  ok("overflow → still added, timed after the last fixed card (4:00 PM)", r2.upd["lincoln_lincoln__ws_L0006"] && r2.upd["lincoln_lincoln__ws_L0006"].time === "4:00 PM", r2.upd);
  // same-day slot inheritance: finished 12:20 lesson leaves → next lesson moved onto that day takes 12:20
  const r4 = e._reprojectPlan("lincoln", "ws", [T("lincoln_lincoln__ws_L0014", "thursday", "12:20 PM", "WS — a"), T("lincoln_lincoln__ws_L0016", "friday", "11:50 AM", "WS — b")], [T("lincoln_lincoln__ws_L0016", "thursday", "9:00 AM", "WS — b")], OPTS());
  ok("moved-in card inherits the freed same-day slot (12:20 PM), not end of day", r4.upd["lincoln_lincoln__ws_L0016/time"] === "12:20 PM" && r4.upd["lincoln_lincoln__ws_L0016/day"] === "thursday", r4.upd);
  // freed slot already in the past today → not inherited
  const r5 = e._reprojectPlan("lincoln", "ws", [T("lincoln_lincoln__ws_L0014", "wednesday", "1:00 PM", "WS — a"), T("lincoln_lincoln__ws_L0016", "friday", "11:50 AM", "WS — b")], [T("lincoln_lincoln__ws_L0016", "wednesday", "9:00 AM", "WS — b")], OPTS({ nowMin: 14 * 60, dayCtx: () => ({ start: 14 * 60, end: 975, lunchStart: 780, lunchEnd: 840 }) }));   // real dayCtx floors today at now
  ok("a freed slot already past now is not inherited (card packs after now instead)", r5.upd["lincoln_lincoln__ws_L0016/day"] === undefined || toMin(r5.upd["lincoln_lincoln__ws_L0016/time"]) >= 14 * 60, r5.upd);
  // legacy date-id cards of the same subject are never touched (not plan cards)
  const r3 = e._reprojectPlan("lincoln", "ws", [T("2026d230_5", "thursday", "10:00 AM", "WS — old")], [], OPTS());
  ok("date-id card of the subject untouched", eq(r3.upd, {}));
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

console.log("hooks (source assertions)");
{
  ok("cbApply calls reprojectSubjectWeek(kid,sk,'relay') after the cells write", /reprojectSubjectWeek\(kid,sk,"relay"\)/.test(src));
  ok("cbUndo re-syncs after restoring cells", /reprojectSubjectWeek\(_uk2,_us2,"undo"\)/.test(src));
  ok("never writes via gwCommit / whole-map set", !/reprojectSubjectWeek[\s\S]{0,4000}gwCommit\(\)/.test(block) && !/\.set\(/.test(block));
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
