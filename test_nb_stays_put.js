/*
 * #66 — notebooks stay put (her answers 2026-10-08, Option A).
 *
 *   · the Morning Notebook holds the slot it was laid at — assumed done first thing, never the card in hand that slides
 *     to "now" and drags the day; Mom's "↩ Not done" (nbRedo) brings it back as the card in hand
 *   · the Closing Notebook never runs past school end — its minutes are reserved before the end; what would run into
 *     them falls to "didn't fit today" (living-day lay) / the closing takes the last minutes (cascade)
 *   · notebooks, dailies and Reflex never move to another day (subjNoCarry), whatever the subject's carry setting
 *
 *   run:  node test_nb_stays_put.js
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log("  ok  - " + name); }
  else { fail++; console.log("  FAIL- " + name + (extra !== undefined ? "  (" + JSON.stringify(extra) + ")" : "")); }
}
function sliceBraces(name) {
  const i = src.indexOf("function " + name + "(");
  if (i < 0) throw new Error("function not found: " + name);
  let d = 0, j = src.indexOf("{", i);
  for (let k = j; k < src.length; k++) {
    if (src[k] === "{") d++;
    else if (src[k] === "}") { d--; if (d === 0) return src.slice(i, k + 1); }
  }
}
const toMin = s => { const m = String(s).match(/(\d+):(\d+)\s*(AM|PM)/i); let h = +m[1] % 12; if (/pm/i.test(m[3])) h += 12; return h * 60 + +m[2]; };

// ── living-day lay harness (MOMLOOP block) ──
const a = src.indexOf("// MOMLOOP_START"), b = src.indexOf("// MOMLOOP_END");
const BLOCK = src.slice(a, b);
const HELPERS = sliceBraces("toMin") + "\n" + sliceBraces("fromMin");
let ID = 0;
function card(who, time, dur, mom, title, extra) {
  return Object.assign({ id: who + "_" + (ID++), who, day: "thursday", mom: mom || "none", time, dur: dur || 20, title: title || (who + " card") }, extra || {});
}
function lay(o) {
  const tasks = o.tasks;
  const ctx = {
    console, ROSTER: ["julian", "lucy", "lincoln", "ellis"], db: null,
    checked: o.checked || {}, claimed: {}, momMoves: {},
    getActiveTasks: () => tasks, morningComplete: () => true, bbActive: () => null,
    momHere: () => true, adminPinUnlocked: true, renderAll: () => {},
    cap: s => String(s || "").charAt(0).toUpperCase() + String(s || "").slice(1),
    esc: s => String(s == null ? "" : s),
    rulesData: { schoolDay: { defaultStart: "10:00 AM", defaultEnd: "4:15 PM" } },
    Object, Array, String, Number, parseInt, isNaN, Math, JSON, Date, RegExp,
  };
  ctx._mlNowOverride = o.nowMin;
  ctx._mlLunchOverride = [13 * 60, 14 * 60];
  Object.defineProperty(ctx, "_todayDay", { get: () => "thursday" });
  vm.createContext(ctx);
  vm.runInContext(HELPERS, ctx); vm.runInContext(BLOCK, ctx);
  vm.runInContext("momLoop={cursor:0};", ctx);
  const laid = vm.runInContext("mlQueueLay(" + JSON.stringify(tasks) + ")", ctx);
  return { at: id => laid.find(t => t.id === id).time, off: id => !!laid.find(t => t.id === id)._offDay, call: e => vm.runInContext(e, ctx) };
}
const H = (h, m) => h * 60 + m;

console.log("📓 Morning Notebook holds its slot");
{
  const mn = card("ellis", "10:00 AM", 15, "none", "📓 Morning Notebook", { subjectKey: "morning_nb" });
  const w1 = card("ellis", "10:15 AM", 30, "none", "Writing"), w2 = card("ellis", "10:45 AM", 30, "none", "Spelling");
  const L = lay({ tasks: [mn, w1, w2], nowMin: H(10, 50) });
  ok("unchecked at 10:50 it stays at 10:00 AM (not slid to end at now)", L.at(mn.id) === "10:00 AM", L.at(mn.id));
  ok("Writing is the card in hand from the notebook's end (10:15), ending at now → 10:20 AM", L.at(w1.id) === "10:20 AM", L.at(w1.id));
  ok("Spelling follows right behind (10:50 AM) — the day didn't drag behind the notebook", L.at(w2.id) === "10:50 AM", L.at(w2.id));
  const L2 = lay({ tasks: [mn, w1, w2], nowMin: H(9, 30) });
  ok("before school the plan's times hold exactly", L2.at(mn.id) === "10:00 AM" && L2.at(w1.id) === "10:15 AM" && L2.at(w2.id) === "10:45 AM");
}
{
  const mn = card("ellis", "10:00 AM", 15, "none", "📓 Morning Notebook", { subjectKey: "morning_nb", nbRedo: true });
  const w1 = card("ellis", "10:15 AM", 30, "none", "Writing");
  const L = lay({ tasks: [mn, w1], nowMin: H(10, 50) });
  ok("Mom marked it ↩ Not done → it is the card in hand again (ends at now: 10:35 AM)", L.at(mn.id) === "10:35 AM", L.at(mn.id));
  ok("…and Writing lays after it (10:50 AM)", L.at(w1.id) === "10:50 AM", L.at(w1.id));
}
{
  const mn = card("julian", "10:00 AM", 15, "required", "📓 Morning Notebook", { subjectKey: "morning_nb" });
  const L = lay({ tasks: [mn], nowMin: H(10, 50) });
  ok("a Mom-required Morning Notebook (Julian's, done WITH Mom) stays Mom's work in her loop", L.call("mlRemaining('julian').length") === 1);
}

console.log("\n📓 Closing Notebook never runs past school end (4:15 PM)");
{
  const w1 = card("lincoln", "3:00 PM", 60, "none", "Big project");
  const cn = card("lincoln", "4:00 PM", 20, "none", "📓 Closing Notebook", { subjectKey: "closing_nb" });
  const L = lay({ tasks: [w1, cn], nowMin: H(15, 30), checked: {} });
  ok("the closing takes the last 20 minutes: 3:55 PM", L.at(cn.id) === "3:55 PM", L.at(cn.id));
  ok("the closing itself never falls off the day", L.off(cn.id) === false);
  ok("the project that would run into its minutes falls to didn't-fit", L.off(w1.id) === true);
}
{
  const w1 = card("lincoln", "2:00 PM", 30, "none", "Reading");
  const cn = card("lincoln", "2:30 PM", 20, "none", "📓 Closing Notebook", { subjectKey: "closing_nb" });
  const L = lay({ tasks: [w1, cn], nowMin: H(14, 10) });
  ok("a closing that fits keeps following the day (2:30 PM)", L.at(cn.id) === "2:30 PM", L.at(cn.id));
  ok("…and Reading is untouched", L.off(w1.id) === false);
}

console.log("\n📓 notebooks / dailies / Reflex never move days");
{
  const ctx = { currData: { subjects: { ellis: { morning_nb: {}, closing_nb: {}, math: {} } } } };
  vm.createContext(ctx); vm.runInContext(sliceBraces("subjNoCarry"), ctx);
  const nc = t => vm.runInContext("subjNoCarry(" + JSON.stringify(t) + ")", ctx);
  ok("Morning Notebook (no carry flag on its subject) is day-bound", nc({ who: "ellis", subjectKey: "morning_nb", title: "📓 Morning Notebook" }) === true);
  ok("Closing Notebook is day-bound", nc({ who: "ellis", subjectKey: "closing_nb", title: "📓 Closing Notebook" }) === true);
  ok("a title-only notebook card too", nc({ who: "ellis", title: "Closing Notebook" }) === true);
  ok("Reflex is day-bound", nc({ who: "ellis", subjectKey: "reflex", title: "Reflex" }) === true);
  ok("an ordinary lesson still carries", nc({ who: "ellis", subjectKey: "math", title: "Math — L4" }) === false);
}
{
  // the real cascade: Tuesday's missed notebooks stay on Tuesday on a Thursday pass; Thursday's closing is capped
  const FNS = ["toMin", "fromMin", "_parseCheckTs", "_dismissed", "_normOrderArr", "taskDevice", "taskSubject", "taskTier", "capFor",
    "capForDisplay", "catchupDayCap", "isCatchupCapped", "subjNoCarry", "applyStickyOrder", "packDay", "packAround", "momClosingSlot",
    "cascadeIntraWeek"].map(sliceBraces).join("\n");
  const RealDate = Date;
  class Frozen extends RealDate { constructor(...x) { if (!x.length) super("2026-10-08T09:00:00"); else super(...x); } static now() { return new RealDate("2026-10-08T09:00:00").getTime(); } }
  const tasks = [
    { id: "tm", who: "ellis", day: "tuesday", time: "10:00 AM", dur: 15, title: "📓 Morning Notebook", subjectKey: "morning_nb", mom: "none", device: "paper" },
    { id: "tc", who: "ellis", day: "tuesday", time: "3:55 PM", dur: 20, title: "📓 Closing Notebook", subjectKey: "closing_nb", mom: "none", device: "paper" },
    { id: "tl", who: "ellis", day: "tuesday", time: "11:00 AM", dur: 30, title: "📐 Math — L5", subjectKey: "math", mom: "none", device: "paper" },
    { id: "fw", who: "ellis", day: "friday", time: "3:30 PM", dur: 60, title: "🧪 Science — L2", subjectKey: "sci", mom: "none", device: "paper" },
    { id: "fc", who: "ellis", day: "friday", time: "4:30 PM", dur: 20, title: "📓 Closing Notebook", subjectKey: "closing_nb", mom: "none", device: "paper" },
  ];
  const env = {
    DAY_DT: { monday: "October 5", tuesday: "October 6", wednesday: "October 7", thursday: "October 8", friday: "October 9" },
    WK: "week26", ROSTER: ["lincoln", "ellis", "lucy", "julian"], weekData: { tasks, babysitter: {} }, checked: {}, claimed: {},
    histState: {}, momMoves: {}, currData: { subjects: { ellis: { morning_nb: {}, closing_nb: {}, math: {}, sci: {} } } },
    rulesData: { schoolDay: { defaultStart: "10:00 AM", defaultEnd: "4:15 PM", lunchStart: "1:00 PM", lunchEnd: "2:00 PM" } },
    fbCurrLoaded: true, _cascNowMin: 9 * 60, DEFAULT_DAY_CAP: 2,
    smapIsKidOff: () => null, schedOv: () => null, schedOvKidOff: () => null, satCutoffMin: () => null, satApplyCutoff: () => {},
    sv: () => {}, dbg: () => {}, renderAll: () => {}, safeWriteTasks: () => {}, lockHeldByOther: () => false, _dryRun: () => true,
    db: { ref: () => ({ update: () => Promise.resolve(), set: () => Promise.resolve() }) }, Date: Frozen,
    console, JSON, Math, Object, Array, Set, Map, String, Number, parseInt, isNaN, Promise,
  };
  const keys = Object.keys(env);
  new Function(...keys, "\"use strict\";" + FNS + "; cascadeIntraWeek(); return null;")(...keys.map(k => env[k]));
  const t = id => tasks.find(x => x.id === id);
  ok("Tuesday's missed lesson swept forward (the cascade ran)", t("tl").day !== "tuesday", t("tl").day);
  ok("Tuesday's Morning Notebook stays on Tuesday", t("tm").day === "tuesday", t("tm"));
  ok("Tuesday's Closing Notebook stays on Tuesday", t("tc").day === "tuesday", t("tc"));
  const fc = t("fc");
  ok("Friday's closing never runs past 4:15 PM", fc.day !== "friday" || toMin(fc.time) + 20 <= toMin("4:15 PM"), fc);
}

console.log("\n📓 Mom's ↩ Not done button (source)");
ok("the card carries a Mom-mode ↩ Not done / ✓ Assume done toggle on today's unchecked Morning Notebook", /const nbRedoRow=\(!readOnly&&!done&&momHereCards\(\)&&t\.mom!=="required"&&\/Morning Notebook\/i/.test(src) && /\+nbAnsRow\+nbRedoRow\+/.test(src));
ok("it writes one targeted field (tasks/<id>/nbRedo), never in dry-run", /if\(db&&!_dryRun\(\)\)\{ lastTasksWrite=Date\.now\(\); db\.ref\(WK\+"\/tasks\/"\+id\+"\/nbRedo"\)\.set\(on\?true:null\); \}/.test(src));
ok("Mom-only", /function nbMornNotDone\(id,on\)\{\n  if\(!momHereCards\(\)\) return;/.test(src));

console.log("\n📓 a notebook laid AFTER an earlier card isn't assumed done before its slot (main-session review 2026-10-09)");
{
  // Lincoln's real Friday: a 10:00 class first, his Morning Notebook laid at 10:30.
  const cls = card("lincoln", "10:00 AM", 30, "none", "💻 Outschool Voice Lessons"), mn = card("lincoln", "10:30 AM", 5, "none", "📖 Morning Notebook", { subjectKey: "morning_nb" });
  const nx = card("lincoln", "10:35 AM", 25, "none", "📖 Science");
  const L = lay({ tasks: [cls, mn, nx], nowMin: H(10, 15) });
  ok("at 10:15 the 10:00 class stays at 10:00 (the 10:30 notebook isn't 'done' yet)", L.at(cls.id) === "10:00 AM", L.at(cls.id));
  const L2 = lay({ tasks: [cls, mn, nx], nowMin: H(10, 50) });
  ok("once 10:30 has come, the notebook holds its 10:30 slot", L2.at(mn.id) === "10:30 AM", L2.at(mn.id));
}
console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
