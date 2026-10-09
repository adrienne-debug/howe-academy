/*
 * #23 slice 2 — 👩 MOMPART2: the per-subject "Mom's part" setting (her answers 2026-10-08: Q3 (b) Mom at the start OR the
 * end + minutes, chosen ONCE in the subject's settings, default = Mom at the END, a "Mom at the beginning" box switches it;
 * Q4 (a) the Grid/Builder Mom load counts only the Mom part).
 *
 *   Mom loop lay: a Mom-required card with the setting holds Mom only for its Mom minutes.
 *     · at the START: Mom block = first N min, then Mom moves on to the next kid; the kid finishes alone.
 *     · at the END:   the kid starts alone (before Mom is free), Mom joins for the last N min.
 *   No setting anywhere → every laid time is exactly what it was.
 *   The on-the-day "✓ Mom part done" tap still works and overrides.
 *
 *   run:  node test_mom_part_setting.js
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const a = src.indexOf("// MOMLOOP_START"), b = src.indexOf("// MOMLOOP_END");
function slice(name) {
  const i = src.indexOf("function " + name + "(");
  return src.slice(i, src.indexOf("\n}", i) + 2);
}
const BLOCK = src.slice(a, b) + "\n" + slice("mlMomPartDone");
const HELPERS = slice("toMin") + "\n" + slice("fromMin");
let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log("  ok  - " + name); }
  else { fail++; console.log("  FAIL- " + name + (extra !== undefined ? "  (" + JSON.stringify(extra) + ")" : "")); }
}
let ID = 0;
function card(who, sk, time, dur, mom, extra) {
  return Object.assign({ id: who + "_" + (ID++), who, subjectKey: sk, day: "thursday", mom: mom || "none", time, dur: dur || 20, title: who + " " + sk }, extra || {});
}
function world(o) {
  const tasks = o.tasks;
  const ctx = {
    console, ROSTER: ["julian", "lucy", "lincoln", "ellis"],
    db: { ref: p => ({ set: () => {}, remove: () => {} }) },
    _dryRun: () => false, WK: "week26", weekData: { tasks }, lastTasksWrite: 0, sv: () => {}, dbg: () => {},
    nowTs: () => "10:40 AM Oct 8",
    checked: o.checked || {}, claimed: {}, momMoves: {},
    getActiveTasks: () => tasks, morningComplete: () => true, bbActive: () => null,
    momHere: () => true, momHereCards: () => true, adminPinUnlocked: false, renderAll: () => {},
    cap: s => String(s || "").charAt(0).toUpperCase() + String(s || "").slice(1),
    esc: s => String(s == null ? "" : s),
    Object, Array, String, Number, parseInt, isNaN, Math, JSON, Date, RegExp,
  };
  if (o.subjects !== undefined) ctx.currData = { subjects: o.subjects };
  ctx._mlNowOverride = o.nowMin;
  ctx._mlLunchOverride = [13 * 60, 14 * 60];
  Object.defineProperty(ctx, "_todayDay", { get: () => "thursday" });
  vm.createContext(ctx);
  vm.runInContext(HELPERS, ctx); vm.runInContext(BLOCK, ctx);
  vm.runInContext("momLoop={cursor:0,order:" + JSON.stringify(o.order || ["lucy", "ellis"]) + "};", ctx);
  return { ctx, call: e => vm.runInContext(e, ctx),
    lay: () => { const laid = vm.runInContext("mlQueueLay(weekData.tasks)", ctx); return id => laid.find(t => t.id === id); } };
}
const H = (h, m) => h * 60 + m;
const T = x => x && x.time;
const subs = extra => {
  const s = { lucy: { math: { mom: "required", minutes: 40 }, eggs: { mom: "none", minutes: 20 } },
              ellis: { grammar: { mom: "required", minutes: 30 }, writing: { mom: "none", minutes: 20 }, mr: { mom: "none", minutes: 20 } } };
  Object.keys(extra || {}).forEach(k => { const [kid, sk] = k.split("."); Object.assign(s[kid][sk], extra[k]); });
  return s;
};
function day() {
  ID = 0;
  return [
    card("lucy", "math", "10:00 AM", 40, "required"), card("lucy", "eggs", "10:40 AM", 20, "none"),
    card("ellis", "writing", "10:00 AM", 20, "none"), card("ellis", "grammar", "10:40 AM", 30, "required"), card("ellis", "mr", "11:10 AM", 20, "none"),
  ];
}
const snap = w => { const at = w.lay(); return w.ctx.weekData.tasks.map(t => t.id + "@" + T(at(t.id)) + (at(t.id)._momWait ? "w" : "")); };

console.log("── no setting: times unchanged (before school) ──");
{
  const base = snap(world({ tasks: day(), nowMin: H(8, 0) }));                         // no currData at all
  const same = snap(world({ tasks: day(), nowMin: H(8, 0), subjects: subs() }));     // subjects, no Mom-part setting
  const other = snap(world({ tasks: day(), nowMin: H(8, 0), subjects: subs({ "ellis.writing": { momPartMins: 10 } }) }));   // a setting on a NON-Mom subject does nothing
  ok("before school, no setting: identical to the lay without subjects", JSON.stringify(base) === JSON.stringify(same), [base, same]);
  ok("…the plan's times hold (Lucy Math 10:00, Ellis Grammar 10:40)", base[0] === "lucy_0@10:00 AM" && base[3] === "ellis_3@10:40 AM", base);
  ok("a setting on a non-Mom subject changes nothing", JSON.stringify(base) === JSON.stringify(other), other);
  const big = snap(world({ tasks: day(), nowMin: H(8, 0), subjects: subs({ "lucy.math": { momPartMins: 40 } }) }));
  ok("a Mom part as long as the card = whole lesson (nothing changes)", JSON.stringify(base) === JSON.stringify(big), big);
  const mid = snap(world({ tasks: day(), nowMin: H(10, 50), subjects: subs() })), mid0 = snap(world({ tasks: day(), nowMin: H(10, 50) }));
  ok("mid-morning, no setting: identical too", JSON.stringify(mid) === JSON.stringify(mid0), [mid, mid0]);
}

console.log("\n── Mom at the START: Lucy Math 40 min, first 10 with Mom ──");
{
  const w = world({ tasks: day(), nowMin: H(8, 0), subjects: subs({ "lucy.math": { momPartMins: 10, momPartStart: true } }) });
  const at = w.lay(), tk = w.ctx.weekData.tasks;
  ok("Lucy Math stays at 10:00", T(at(tk[0].id)) === "10:00 AM", T(at(tk[0].id)));
  ok("Mom moves on at 10:10 — Ellis Grammar is laid at 10:20 (after his own Writing 10:00–10:20)", T(at(tk[3].id)) === "10:20 AM", T(at(tk[3].id)));
  ok("Lucy finishes Math on her own; Reading Eggs still after the whole card (10:40)", T(at(tk[1].id)) === "10:40 AM", T(at(tk[1].id)));
  ok("Ellis MR keeps its printed 11:10 (after Grammar ends 10:50; before school the plan's gaps hold)", T(at(tk[4].id)) === "11:10 AM", T(at(tk[4].id)));
}
{
  // Ellis has no buffer card: Mom goes straight from Lucy's first 10 min to Ellis at 10:10.
  ID = 0;
  const tasks = [card("lucy", "math", "10:00 AM", 40, "required"), card("ellis", "grammar", "10:40 AM", 30, "required")];
  const w = world({ tasks, nowMin: H(8, 0), subjects: subs({ "lucy.math": { momPartMins: 10, momPartStart: true } }) });
  const at = w.lay();
  ok("no buffer: Ellis's Mom block starts the minute Lucy's Mom part ends (10:10)", T(at(tasks[1].id)) === "10:10 AM", T(at(tasks[1].id)));
  const w0 = world({ tasks: tasks.map(t => Object.assign({}, t)), nowMin: H(8, 0), subjects: subs() });
  ok("…versus 10:40 with no setting", T(w0.lay()(tasks[1].id)) === "10:40 AM");
}

console.log("\n── Mom at the END (the default): Ellis Grammar 30 min, last 10 with Mom ──");
{
  const w = world({ tasks: day(), nowMin: H(8, 0), subjects: subs({ "ellis.grammar": { momPartMins: 10 } }) });
  const at = w.lay(), tk = w.ctx.weekData.tasks;
  ok("Lucy Math (whole lesson) 10:00–10:40", T(at(tk[0].id)) === "10:00 AM");
  ok("Ellis starts Grammar alone at 10:20, right after his Writing — Mom joins at 10:40 for the last 10", T(at(tk[3].id)) === "10:20 AM", T(at(tk[3].id)));
  ok("Ellis's MR keeps its printed 11:10 (after the whole card, 10:50)", T(at(tk[4].id)) === "11:10 AM", T(at(tk[4].id)));

  ok("Ellis's Writing (his card before) keeps 10:00", T(at(tk[2].id)) === "10:00 AM", T(at(tk[2].id)));
}
{
  // Mid-morning (day started): the alone part never sits on the card in hand.
  const tasks = day();
  const w = world({ tasks, nowMin: H(10, 21), checked: { [tasks[2].id]: "10:20 AM Oct 8" }, subjects: subs({ "ellis.grammar": { momPartMins: 10 } }) });
  const at = w.lay();
  // 10:21: Lucy's Math (whole lesson) lays from now 10:21–11:01; Ellis's MR is his card in hand 10:20–10:40.
  ok("started day: Ellis's MR (in hand) 10:20, Grammar alone from 10:41 so Mom joins at 11:01 when Lucy's Math ends", T(at(tasks[4].id)) === "10:20 AM" && T(at(tasks[3].id)) === "10:41 AM" && T(at(tasks[0].id)) === "10:21 AM", [T(at(tasks[0].id)), T(at(tasks[3].id)), T(at(tasks[4].id))]);
}
{
  // The kid can't start before the school floor / their own buffer: no buffer, Mom free at 10:40 → card 10:20 (floor 10:00 ok).
  ID = 0;
  const tasks = [card("lucy", "math", "10:00 AM", 20, "required"), card("ellis", "grammar", "10:20 AM", 30, "required")];
  const w = world({ tasks, nowMin: H(8, 0), subjects: subs({ "ellis.grammar": { momPartMins: 10 } }) });
  const at = w.lay();
  ok("never before the school start: Ellis's alone part starts at 10:00, Mom joins 10:20", T(at(tasks[1].id)) === "10:00 AM", T(at(tasks[1].id)));
}

console.log("\n── order inside one kid's Mom block, and Mom's own minutes ──");
{
  ID = 0;
  const tasks = [card("lucy", "math", "10:00 AM", 40, "required"), card("lucy", "aas", "10:40 AM", 20, "required"), card("lucy", "fll", "11:00 AM", 30, "required"),
                 card("ellis", "grammar", "11:30 AM", 30, "required")];
  const S = subs(); S.lucy.aas = { mom: "required", minutes: 20 }; S.lucy.fll = { mom: "required", minutes: 30, momPartMins: 10 };
  S.lucy.math.momPartMins = 15; S.lucy.math.momPartStart = true;
  const w = world({ tasks, nowMin: H(8, 0), subjects: S });
  const at = w.lay();
  const ts = id => { const x = at(id); return x && (parseInt(x.time) % 12) * 60 + parseInt(x.time.split(":")[1]) + (/PM/.test(x.time) ? 720 : 0); };
  ok("Mom-at-the-END card leads Lucy's block (FLL 10:00, Mom joins 10:20)", T(at(tasks[2].id)) === "10:00 AM", T(at(tasks[2].id)));
  ok("whole-lesson card next (AAS 10:30)", T(at(tasks[1].id)) === "10:30 AM", T(at(tasks[1].id)));
  ok("Mom-at-the-START card closes it (Math 10:50, Mom 10:50–11:05)", T(at(tasks[0].id)) === "10:50 AM", T(at(tasks[0].id)));
  ok("Ellis's Mom block starts when Lucy's Mom part ends (11:05)", T(at(tasks[3].id)) === "11:05 AM", T(at(tasks[3].id)));
  // Mom's minutes never overlap across kids
  const momIv = [[ts(tasks[2].id) + 20, ts(tasks[2].id) + 30], [ts(tasks[1].id), ts(tasks[1].id) + 20], [ts(tasks[0].id), ts(tasks[0].id) + 15], [ts(tasks[3].id), ts(tasks[3].id) + 30]].sort((p, q) => p[0] - q[0]);
  ok("Mom's own minutes never overlap", momIv.every((iv, i) => !i || iv[0] >= momIv[i - 1][1]), momIv);
  ok("Lucy's own cards never overlap each other", [[ts(tasks[2].id), 30], [ts(tasks[1].id), 20], [ts(tasks[0].id), 40]].sort((p, q) => p[0] - q[0]).every((x, i, A) => !i || x[0] >= A[i - 1][0] + A[i - 1][1]));
}

console.log("\n── the on-the-day tap still overrides ──");
{
  const tasks = day(); tasks[0].momPartDone = "10:05 AM Oct 8";
  const w = world({ tasks, nowMin: H(10, 5), subjects: subs({ "lucy.math": { momPartMins: 10, momPartStart: true } }) });
  ok("a tapped card is not Mom work (setting ignored)", w.call("mlMomPartOf(weekData.tasks[0])") === null && w.call("mlRemaining('lucy').length") === 0);
  const w2 = world({ tasks: day(), nowMin: H(8, 0), subjects: subs({ "lucy.math": { momPartMins: 10 } }) });
  ok("an un-tapped card with the setting is still Mom work for the loop (mlRemaining)", w2.call("mlRemaining('lucy').length") === 1);
  ok("mlMomPartOf reads the setting (end by default)", JSON.stringify(w2.call("mlMomPartOf(weekData.tasks[0])")) === '{"n":10,"start":false}');
}

console.log("\n── Grid/Builder Mom load counts only the Mom part ──");
{
  const WF = slice("wfSubjFreq") + "\n" + slice("wfTierOf") + "\n" + slice("wfKidTierTimes");
  const mk = sub => { const c = { Object, parseInt, currData: { subjects: { lucy: sub } } }; vm.createContext(c); vm.runInContext(WF, c); return vm.runInContext("wfKidTierTimes('lucy')", c); };
  const t0 = mk({ math: { mom: "required", minutes: 40, timesPerWeek: 5 } });
  const t1 = mk({ math: { mom: "required", minutes: 40, timesPerWeek: 5, momPartMins: 10 } });
  const t2 = mk({ math: { mom: "required", minutes: 40, timesPerWeek: 5, momPartMins: 10, momPartStart: true } });
  ok("no setting: 200 Mom min/wk", t0.required.wk === 200 && t0.independent.wk === 0, t0);
  ok("10 of 40 with Mom: 50 Mom min/wk, 150 on their own", t1.required.wk === 50 && t1.independent.wk === 150, t1);
  ok("start or end: same load", t2.required.wk === 50);
  const t3 = mk({ math: { mom: "required", minutes: 40, timesPerWeek: 5, momPartMins: 40 } });
  ok("a Mom part ≥ the minutes = whole lesson", t3.required.wk === 200, t3);
  ok("printed week's 'min with Mom' uses the Mom part", /reduce\(\(a,t\)=>\{ const _mp=\(typeof mlMomPartOf==="function"\)\?mlMomPartOf\(t\):null; return a\+\(_mp\?_mp\.n:\(t\.dur\|\|20\)\); \},0\)/.test(src));
}

console.log("\n── the setting in the subject's edit sheet: targeted single-field writes ──");
{
  const FN = slice("ceMomPartSet") + "\n" + slice("ceMomPartSectionHTML");
  const writes = [];
  const c = { Object, parseInt, isNaN, Math, Date, String, momHere: () => true, _dryRun: () => false, ceEditKid: "lucy", ceEditKey: "math",
    currData: { subjects: { lucy: { math: { mom: "required", minutes: 40 } } } },
    db: { ref: p => ({ update: u => writes.push([p, u]) }) }, ceRenderEditSheet: () => {}, renderAll: () => {},
    esc: s => String(s), cap: s => String(s) };
  vm.createContext(c); vm.runInContext(FN, c);
  const html0 = vm.runInContext("ceMomPartSectionHTML('lucy','math',currData.subjects.lucy.math)", c);
  ok("shows on a Mom-required subject: Whole lesson selected", /Whole lesson/.test(html0) && /ce-chip sel"[^>]*>Whole lesson/.test(html0));
  vm.runInContext("ceMomPartSet('momPartMins',10)", c);
  ok("writes ONLY curriculum/subjects/lucy/math/momPartMins (+ lastEdit)", writes.length === 1 && writes[0][0] === "curriculum" && JSON.stringify(Object.keys(writes[0][1]).sort()) === '["lastEdit","subjects/lucy/math/momPartMins"]' && writes[0][1]["subjects/lucy/math/momPartMins"] === 10, writes);
  const html1 = vm.runInContext("ceMomPartSectionHTML('lucy','math',currData.subjects.lucy.math)", c);
  ok("default is Mom at the END (box unticked)", /Mom at the beginning/.test(html1) && !/checkbox" checked/.test(html1) && /joins for the last 10 min/.test(html1));
  vm.runInContext("ceMomPartSet('momPartStart',true)", c);
  ok("ticking 'Mom at the beginning' writes …/momPartStart = true", writes[1][1]["subjects/lucy/math/momPartStart"] === true);
  vm.runInContext("ceMomPartSet('momPartStart',false)", c);
  ok("unticking removes it (null)", writes[2][1]["subjects/lucy/math/momPartStart"] === null && c.currData.subjects.lucy.math.momPartStart === undefined);
  vm.runInContext("ceMomPartSet('momPartMins',40)", c);
  ok("a part as long as the lesson clears it (null)", writes[3][1]["subjects/lucy/math/momPartMins"] === null);
  vm.runInContext("ceMomPartSet('minutes',5)", c);
  ok("no other field can be written", writes.length === 4);
  c.currData.subjects.lucy.eggs = { mom: "none", minutes: 20 };
  ok("hidden on a subject that isn't Mom-required", vm.runInContext("ceMomPartSectionHTML('lucy','eggs',currData.subjects.lucy.eggs)", c) === "");
  ok("hooked into the subject edit sheet", /ceMomPartSectionHTML\(ceEditKid,ceEditKey,s\);   \/\/ 👩 MOMPART2/.test(src));
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
