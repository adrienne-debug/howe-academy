/*
 * Node tests — 🃏🎯 DMSLOT: Daily Drill / Match & Play take a free slot INSIDE the school day (her yes 2026-11-08).
 * Live (a family copy's week 5, Regenerate Thu 11/5 11:47 AM — co-op until 3:00, school end 4:00): gwInjectRetrieval only
 * looked AFTER the kid's last card (Piano 3:40–4:00) and walked up to school end + 4 h, so Drill landed 4:00 and Match 4:05;
 * the free 3:30–3:40 was never tried, and the running day's guard could only log "daily-only overflow".
 * Runs the REAL generator block (GWRETR + RETRWEEK), the REAL school-end guard block (SCHOOLEND, incl. DMSLOT + seGuardCtx),
 * the REAL ⏰ day-times readers and the REAL re-lay log helpers, against:
 *   A. the family copy's shapes (names replaced by k1–k4): a co-op Thursday with room earlier → both cards inside the day;
 *      the real 11/5 Thursday (genuinely full) → Drill 3:30, Match in the day's box; a Monday with room after the last card
 *      → exactly the old end-of-block slot
 *   B. a full day → both in the box, never past the end; the re-lay door's own overflow (DAYDROP) is named on the what-moved line
 *   C. a fixed-time class in the way → never displaced, by the generator or the guard
 *   D. the re-lay door (seGuardWeek through seGuardCtx): a late Drill takes a free slot and nothing else moves; a running day
 *      never lays it before now
 *   E. ⏰ this date's own end and a running day's "now" in the generator
 *   G. Howe's own week 31 shape (GET 2026-11-08, names / subjects replaced): every card the old rule laid inside the day is
 *      laid exactly where it was
 *   H. dry run / purity: nothing touches the database
 *   run:  node test_drill_match_slot.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
function slice(a, b) { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error("marker not found: " + a); return src.slice(i, j + b.length); }
function fn(name) { const i = src.indexOf("function " + name + "("); if (i < 0) throw new Error("missing " + name);
  let d = 0, s = false; for (let k = src.indexOf("{", i); k < src.length; k++) { if (src[k] === "{") { d++; s = true; } else if (src[k] === "}") { d--; if (s && !d) return src.slice(i, k + 1); } } }
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x) : "")); } };

const toMin = s => { const m = String(s || "").match(/(\d+):(\d+)\s*(AM|PM)/i); if (!m) return null; let h = +m[1] % 12; if (/pm/i.test(m[3])) h += 12; return h * 60 + +m[2]; };
const fromMin = mn => { let h = Math.floor(mn / 60), m = mn % 60, ap = h >= 12 ? "PM" : "AM"; h = h % 12; if (h === 0) h = 12; return h + ":" + String(m).padStart(2, "0") + " " + ap; };

const DMSLOT = slice("// DMSLOT_START", "// DMSLOT_END");
const GWRETR = slice("// GWRETR_START", "// GWRETR_END");
const CODE = [slice("const RETR_DEFAULTS=", "// P5.3 editor"), slice("// RETRWEEK_START", "// RETRWEEK_END"), GWRETR,
  slice("// SCHOOLEND_START", "// SCHOOLEND_END"), slice("function dtSd(", "// ── what the day is"),
  fn("_rlwSnapOf"), fn("_rlwDiff"), fn("_rlwWords"), fn("_rlwUndoUpd")].join("\n");

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday"];
const WDAY_MAP = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const doy = d => Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 864e5);
// a fresh app-shaped sandbox. o = {schoolDay, dates:{monday:"2026-11-02",…}, now:"2026-11-05T11:47:00", plan, minutes(kind)}
function mkEnv(o) {
  o = o || {};
  const writes = [];
  const NOW = o.now ? new Date(o.now).getTime() : new Date("2026-11-08T20:00:00").getTime();   // default: a Sunday evening, no school day running
  class FD extends Date { constructor(...a) { if (!a.length) super(NOW); else super(...a); } static now() { return NOW; } }
  const sd = o.schoolDay || { defaultStart: "9:00 AM", defaultEnd: "4:00 PM", lunchStart: "12:00 PM", lunchEnd: "1:00 PM" };
  const iso = o.dates || {};
  const dbProxy = new Proxy({}, { get: (t, k) => (...a) => { writes.push([k, a]); return dbProxy; } });
  const env = {
    rulesData: { schoolDay: sd }, masteryData: { retrievalPlan: o.plan || {}, history: {} }, ROSTER: ["k1", "k2", "k3", "k4"],
    retrTracks: () => [], SPRINT_LOE_B: [], retrEditorStages: () => [],
    retrSlotMinutes: (k, kind) => (o.minutes ? o.minutes(kind) : 15),
    gwParseDate: s => new FD(s + "T12:00:00"),
    gwRules: () => ({ schoolStart: toMin(sd.defaultStart), schoolEnd: toMin(sd.defaultEnd), lunchStart: toMin(sd.lunchStart), lunchEnd: toMin(sd.lunchEnd) }),
    mlMomSpan: (t, s, d) => [s, s + (d == null ? (t.dur || 20) : d)],
    stIsoOk: s => /^\d{4}-\d{2}-\d{2}$/.test(String(s || "")), stDsOf: dn => iso[dn] || null,
    stTodayIso: () => { const d = new FD(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); },
    _todayDay: o.todayDay || null, DAY_DT: o.dayDt || {}, currData: { subjects: {} }, checked: {}, claimed: {},
    cap: s => String(s).charAt(0).toUpperCase() + String(s).slice(1),
    db: dbProxy, _dryRun: () => true, dbgLines: [],
    toMin, fromMin, Date: FD, Math, Object, JSON, String, Number, Array, parseInt, parseFloat, isNaN, Set, Map, RegExp, console,
  };
  env.dbg = s => env.dbgLines.push(String(s));
  vm.createContext(env);
  new vm.Script(CODE).runInContext(env);
  env._writes = writes;
  return env;
}
// cards: [who, day3, time, dur, mom(1/0), subjectKey, title?]
const D3 = { mon: "monday", tue: "tuesday", wed: "wednesday", thu: "thursday", fri: "friday" };
let _n = 0;
const mk = rows => rows.map(r => ({ id: "c" + (++_n), who: r[0], day: D3[r[1]], time: r[2], dur: r[3], mom: r[4] ? "required" : "none", subjectKey: r[5], title: r[6] || r[5], cascade: true }));
function inject(env, tasks, isoDays) {
  const dates = {}; const sorted = isoDays.map(s => { const dn = WDAY_MAP[new Date(s + "T12:00:00").getDay()]; dates[dn] = "x"; return s; });
  env.gwInjectRetrieval(tasks, sorted, WDAY_MAP, new Set(), dates, doy); return tasks;
}
const retr = (T, kid, day) => T.filter(t => t.subjectKey === "retrieval" && (!kid || t.who === kid) && (!day || t.day === day));
const byKind = (T, kid, day, kind) => retr(T, kid, day).filter(t => t.retrieval === kind)[0];
const endOf = t => toMin(t.time) + (t.dur || 20);
const snap = T => JSON.stringify(T.filter(t => t.subjectKey !== "retrieval").map(t => [t.id, t.day, t.time]).sort((a, b) => (a[0] < b[0] ? -1 : 1)));
// the family copy's saved rhythm: drill Mon/Tue/Thu/Fri (Wed off), match every day; Drill 5 min (Mom), Match 10 min (the kid's own)
const PLAN = { k1: { week: { mon: "drill", tue: "drill", wed: "off", thu: "drill", fri: "drill" }, week2: { mon: "match", tue: "match", wed: "match", thu: "match", fri: "match" } } };
const MINUTES = k => (k === "drill" ? 5 : 10);
const DW = { plan: PLAN, minutes: MINUTES, dates: { monday: "2026-11-02", tuesday: "2026-11-03", wednesday: "2026-11-04", thursday: "2026-11-05", friday: "2026-11-06" } };
// the co-op Thursday's other kids (their cards, no Mom parts) — from the live week
const THU_OTHERS = [["k2", "thu", "3:00 PM", 10, 0, "fact_review"], ["k2", "thu", "3:10 PM", 20, 0, "piano"], ["k2", "thu", "3:30 PM", 20, 0, "reading"],
  ["k3", "thu", "3:00 PM", 20, 0, "piano"], ["k3", "thu", "3:20 PM", 30, 0, "reading"], ["k3", "thu", "3:50 PM", 10, 0, "spelling_study"]];

console.log("A. the family copy's shapes");
{
  // A1 — co-op Thursday (school 9–4, co-op until 3:00) laid with room before the last card: the old rule gave 4:00 / 4:05
  const env = mkEnv(DW);
  const T = mk([["k1", "thu", "3:00 PM", 10, 0, "fact_review"], ["k1", "thu", "3:25 PM", 20, 0, "piano"], ["k1", "thu", "3:45 PM", 15, 0, "reading"]].concat(THU_OTHERS));
  const before = snap(T);
  inject(env, T, ["2026-11-05"]);
  const dr = byKind(T, "k1", "thursday", "drill"), ma = byKind(T, "k1", "thursday", "match");
  ok("A1 Drill + Match both laid inside the day (3:10 / 3:15), neither in the box", dr && ma && dr.time === "3:10 PM" && ma.time === "3:15 PM" && !dr._dayDrop && !ma._dayDrop, [dr && dr.time, ma && ma.time]);
  ok("A1 both end by 4:00 and sit after co-op (3:00)", endOf(dr) <= toMin("4:00 PM") && endOf(ma) <= toMin("4:00 PM") && toMin(dr.time) >= toMin("3:00 PM"));
  ok("A1 no other card moved", snap(T) === before);
}
{
  // A2 — the real 11/5 Thursday: Fact Review 3:00, Reading 3:10–3:30, Piano 3:40–4:00 → 50 of 60 minutes used, 15 asked
  const env = mkEnv(DW);
  const T = mk([["k1", "thu", "3:00 PM", 10, 0, "fact_review"], ["k1", "thu", "3:10 PM", 20, 0, "independent_reading"], ["k1", "thu", "3:40 PM", 20, 0, "piano"]].concat(THU_OTHERS));
  const before = snap(T);
  inject(env, T, ["2026-11-05"]);
  const dr = byKind(T, "k1", "thursday", "drill"), ma = byKind(T, "k1", "thursday", "match");
  ok("A2 Drill takes the free 3:30–3:35 (was 4:00)", dr && dr.time === "3:30 PM" && !dr._dayDrop, dr && dr.time);
  ok("A2 Match has no 10 free minutes → in Thursday's \"Didn't fit today\" box (was 4:05 on the timeline)", ma && ma._dayDrop === true && ma.day === "thursday", ma);
  ok("A2 nothing on the timeline runs past 4:00", T.filter(t => t.who === "k1" && !t._dayDrop).every(t => endOf(t) <= toMin("4:00 PM")));
  ok("A2 the debug line names the boxed card", env.dbgLines.some(l => /didn't fit the school day/.test(l) && /Match/.test(l)), env.dbgLines);
  ok("A2 no other card moved", snap(T) === before);
  // the commit's school-end guard (seGuardWeek + the app's seGuardCtx) leaves the day alone now — no "daily-only overflow"
  const se = env.seGuardWeek(T, env.seGuardCtx({ todayDay: "thursday", nowMin: toMin("11:47 AM") }));
  ok("A2 the commit's guard finds the day fine (nothing re-laid, nothing stuck)", !se.retimed.length && !se.stuck.length && !se.dropped.length, se);
}
{
  // A3 — a Monday with room after the last card (live: Drill 3:20 / Match 3:25) → exactly the end-of-block slot, as before
  const env = mkEnv(DW);
  const T = mk([["k1", "mon", "9:00 AM", 15, 0, "fact_review"], ["k1", "mon", "9:25 AM", 20, 1, "arithmetic"], ["k1", "mon", "1:00 PM", 30, 0, "speech"], ["k1", "mon", "2:10 PM", 20, 0, "read_aloud"]]);
  inject(env, T, ["2026-11-02"]);
  const dr = byKind(T, "k1", "monday", "drill"), ma = byKind(T, "k1", "monday", "match");
  ok("A3 Drill 2:30, Match 2:35 — right after the last card, as the old rule laid them", dr.time === "2:30 PM" && ma.time === "2:35 PM", [dr.time, ma.time]);
  ok("A3 Wednesday (drill off) gets only Match", (() => { const env2 = mkEnv(DW); const T2 = mk([["k1", "wed", "9:00 AM", 30, 0, "x"]]); inject(env2, T2, ["2026-11-04"]); return retr(T2).length === 1 && retr(T2)[0].retrieval === "match"; })());
}

console.log("B. a full day → the overflow rule, never past the end");
{
  const env = mkEnv(DW);
  const T = mk([["k1", "thu", "3:00 PM", 30, 0, "a"], ["k1", "thu", "3:30 PM", 30, 0, "b"]].concat(THU_OTHERS));
  const before = snap(T);
  inject(env, T, ["2026-11-05"]);
  const R = retr(T, "k1");
  ok("B1 a packed 3:00–4:00 → Drill and Match both in the day's box", R.length === 2 && R.every(t => t._dayDrop === true && t.day === "thursday"), R.map(t => [t.retrieval, t.time, t._dayDrop]));
  ok("B1 the rest of the day untouched", snap(T) === before);
  const se = env.seGuardWeek(T, env.seGuardCtx({ todayDay: "monday", nowMin: toMin("8:00 AM") }));
  ok("B1 the guard skips boxed cards — no lesson rolls to make room for them", !se.rolled.length && !se.deferred.length && !se.retimed.length, se);
}
{
  // B2 — the re-lay door's own overflow: a ⏰ date end moved to 3:10 on a day not yet started; no free slot → DAYDROP's box,
  // and the what-moved line says so (and Undo takes it back out of the box)
  const env = mkEnv(Object.assign({}, DW, { todayDay: "monday" }));
  env.rulesData.schoolDay.byDate = { "2026-11-05": { end: "3:10 PM" } };
  const T = mk([["k1", "thu", "1:00 PM", 60, 0, "a"], ["k1", "thu", "2:00 PM", 60, 0, "b"], ["k1", "thu", "3:00 PM", 5, 1, "retrieval", "🃏 Daily Drill"], ["k1", "thu", "3:05 PM", 10, 0, "retrieval", "🎯 Match & Play"]]);
  T[2].retrieval = "drill"; T[3].retrieval = "match";
  const before = env._rlwSnapOf(T, {});
  const se = env.seGuardWeek(T, env.seGuardCtx({ todayDay: "monday", nowMin: toMin("8:00 AM") }));
  const d = env._rlwDiff(before, T);
  const words = env._rlwWords({ label: "⏰ Thu 3:10 PM", moves: d.moves, removed: d.removed, added: d.added, boxed: d.boxed });
  ok("B2 the late card with no room goes to the day's box (DAYDROP), nothing past 3:10 on the timeline", T.filter(t => !t._dayDrop).every(t => endOf(t) <= toMin("3:10 PM")) && se.dropped.length >= 1, { dropped: se.dropped, T: T.map(t => [t.title, t.time, !!t._dayDrop]) });
  ok("B2 the what-moved line says it didn't fit", /didn't fit \(in the day's box\)/.test(words) && d.boxed.length === se.dropped.length, words);
  const u = env._rlwUndoUpd({ at: 1, moves: d.moves, boxed: d.boxed }, T, { wk: "week5" });
  ok("B2 Undo takes it back out of the box (one targeted _dayDrop: null each)", d.boxed.every(b => u.upd["week5/tasks/" + b.id + "/_dayDrop"] === null), u.upd);
}

console.log("C. a fixed-time class in the way is never displaced");
{
  const env = mkEnv(DW);
  // morning packed, lunch 12–1, a 1:00 class, a 15-minute gap 1:30–1:45, the afternoon packed to 4:00
  const T = mk([["k1", "mon", "9:00 AM", 180, 0, "a"], ["k1", "mon", "1:00 PM", 30, 0, "speech_class"], ["k1", "mon", "1:45 PM", 135, 0, "b"]]);
  const cls = T[1];
  inject(env, T, ["2026-11-02"]);
  const dr = byKind(T, "k1", "monday", "drill"), ma = byKind(T, "k1", "monday", "match");
  ok("C1 the generator lays both in the gap after the class (1:30 / 1:35)", dr.time === "1:30 PM" && ma.time === "1:35 PM", [dr.time, ma.time]);
  ok("C1 the class keeps 1:00 PM", cls.time === "1:00 PM");
  // the guard: Drill late at 4:00 with the class right before the only gap — Drill moves, the class (held) does not
  const env2 = mkEnv(DW);
  const T2 = mk([["k1", "mon", "9:00 AM", 180, 0, "a"], ["k1", "mon", "1:00 PM", 30, 0, "speech_class"], ["k1", "mon", "1:45 PM", 135, 0, "b"], ["k1", "mon", "4:00 PM", 5, 1, "retrieval", "🃏 Daily Drill"]]);
  T2[3].retrieval = "drill";
  const before = snap(T2);
  const se = env2.seGuardWeek(T2, env2.seGuardCtx({ todayDay: null, nowMin: null, isClass: t => t.subjectKey === "speech_class", classAt: t => t.subjectKey === "speech_class" ? toMin("1:00 PM") : null }));
  ok("C2 the guard moves only the late Drill, into 1:30", T2[3].time === "1:30 PM" && se.retimed.length === 1 && se.retimed[0] === T2[3].id, se);
  ok("C2 the class and every other card stay put", snap(T2) === before);
}

console.log("D. the re-lay door keeps them in the day");
{
  // D1 — a mid-week ⏰ re-lay: Wednesday (not started) now ends 3:30; Match sat at 3:30 after the last card; a free 10:00–10:30 earlier
  const env = mkEnv(Object.assign({}, DW, { todayDay: "monday" }));
  env.rulesData.schoolDay.byDate = { "2026-11-04": { end: "3:30 PM" } };
  const T = mk([["k1", "wed", "9:00 AM", 60, 0, "a"], ["k1", "wed", "10:30 AM", 90, 1, "b"], ["k1", "wed", "1:00 PM", 150, 0, "c"], ["k1", "wed", "3:30 PM", 10, 0, "retrieval", "🎯 Match & Play"]]);
  T[3].retrieval = "match";
  const before = snap(T), b0 = env._rlwSnapOf(T, {});
  const se = env.seGuardWeek(T, env.seGuardCtx({ todayDay: "monday", nowMin: toMin("8:00 AM") }));
  ok("D1 Match takes the first free slot inside the day (10:00), nothing else moves", T[3].time === "10:00 AM" && se.retimed.length === 1 && snap(T) === before, { t: T[3].time, se });
  const d = env._rlwDiff(b0, T);
  ok("D1 the what-moved line lists it", d.moves.length === 1 && d.moves[0].id === T[3].id && /1 card moved/.test(env._rlwWords({ label: "⏰", moves: d.moves })), d);
  // D2 — the same on a running day at 11:47: a free 10:00 is in the past; the next free slot after now is used
  const env2 = mkEnv(Object.assign({}, DW, { todayDay: "wednesday", now: "2026-11-04T11:47:00" }));
  env2.rulesData.schoolDay.byDate = { "2026-11-04": { end: "3:30 PM" } };
  const T2 = mk([["k1", "wed", "9:00 AM", 60, 0, "a"], ["k1", "wed", "11:00 AM", 60, 0, "b"], ["k1", "wed", "1:00 PM", 120, 0, "c"], ["k1", "wed", "3:30 PM", 10, 0, "retrieval", "🎯 Match & Play"]]);
  T2[3].retrieval = "match";
  env2.seGuardWeek(T2, env2.seGuardCtx({ todayDay: "wednesday", nowMin: toMin("11:47 AM") }));
  ok("D2 a running day: never before now — 3:00 (the gap left before the end), not 10:00", T2[3].time === "3:00 PM", T2[3].time);
}

console.log("E. ⏰ this date's own times and a running day in the generator");
{
  const env = mkEnv(DW);
  env.rulesData.schoolDay.byDate = { "2026-11-03": { end: "3:00 PM" } };
  const T = mk([["k1", "tue", "9:00 AM", 60, 0, "a"], ["k1", "tue", "10:05 AM", 115, 1, "b"], ["k1", "tue", "1:00 PM", 120, 0, "c"]]);
  inject(env, T, ["2026-11-03"]);
  const dr = byKind(T, "k1", "tuesday", "drill"), ma = byKind(T, "k1", "tuesday", "match");
  ok("E1 a date ending 3:00 (Settings 4:00): the old 3:00 / 3:05 would run past it → Drill 10:00 inside, Match in the box", dr.time === "10:00 AM" && !dr._dayDrop && ma._dayDrop === true, [dr.time, ma.time, ma._dayDrop]);
  const env2 = mkEnv(Object.assign({}, DW, { now: "2026-11-05T11:47:00", todayDay: "thursday" }));
  const T2 = mk([["k1", "thu", "9:00 AM", 30, 0, "a"], ["k1", "thu", "10:00 AM", 120, 0, "b"], ["k1", "thu", "1:00 PM", 180, 0, "c"]]);
  inject(env2, T2, ["2026-11-05"]);
  const R2 = retr(T2, "k1");
  ok("E2 a Regenerate at 11:47 on the day: no free slot after now → both in the box, none laid in the morning's past gaps", R2.length === 2 && R2.every(t => t._dayDrop === true), R2.map(t => [t.time, t._dayDrop]));
  const env3 = mkEnv(Object.assign({}, DW, { now: "2026-11-05T09:12:00", todayDay: "thursday" }));
  const T3 = mk([["k1", "thu", "9:00 AM", 30, 0, "a"], ["k1", "thu", "10:00 AM", 120, 0, "b"], ["k1", "thu", "1:00 PM", 180, 0, "c"]]);
  inject(env3, T3, ["2026-11-05"]);
  ok("E3 at 9:12 the 9:30 gap is still ahead → Drill 9:30, Match 9:35", byKind(T3, "k1", "thursday", "drill").time === "9:30 AM" && byKind(T3, "k1", "thursday", "match").time === "9:35 AM", retr(T3).map(t => t.time));
}
const HOWE_CARDS=[["k1","mon","9:00 AM",5,0,"s1","M"],["k1","mon","9:30 AM",5,0,"s2",""],["k1","mon","9:35 AM",15,0,"s3",""],["k1","mon","3:23 PM",5,0,"s4","C"],["k1","mon","12:30 PM",25,1,"s5",""],["k1","mon","10:05 AM",25,0,"s6",""],["k1","mon","10:55 AM",20,0,"s7",""],["k1","mon","11:15 AM",25,1,"s8",""],["k1","mon","10:30 AM",25,0,"s9",""],["k1","mon","2:00 PM",25,1,"s10",""],["k1","mon","9:50 AM",15,0,"s11",""],["k1","mon","11:50 AM",15,1,"s12",""],["k2","mon","9:00 AM",5,1,"s1","M"],["k2","mon","10:18 AM",5,1,"s4","C"],["k3","mon","9:00 AM",5,0,"s1","M"],["k3","mon","9:05 AM",25,0,"s13",""],["k3","mon","9:30 AM",5,1,"s14",""],["k3","mon","9:35 AM",5,0,"s2",""],["k3","mon","9:40 AM",5,0,"s15",""],["k3","mon","10:20 AM",5,0,"s16",""],["k3","mon","10:25 AM",20,0,"s17",""],["k3","mon","3:10 PM",10,0,"s18",""],["k3","mon","3:38 PM",5,0,"s4","C"],["k3","mon","2:50 PM",20,1,"s19",""],["k3","mon","12:30 PM",25,0,"s20",""],["k3","mon","11:40 AM",10,1,"s21",""],["k3","mon","10:45 AM",25,0,"s22",""],["k3","mon","12:05 PM",25,1,"s23",""],["k3","mon","3:20 PM",15,0,"s24",""],["k3","mon","2:25 PM",25,1,"s25",""],["k4","mon","9:00 AM",5,0,"s1","M"],["k4","mon","9:05 AM",20,1,"s26",""],["k4","mon","10:00 AM",40,0,"s27",""],["k4","mon","10:52 AM",5,0,"s4","C"],["k4","mon","9:35 AM",25,1,"s28",""],["k4","mon","9:25 AM",10,0,"s29",""],["k1","tue","2:00 PM",5,0,"s1","M"],["k1","tue","2:10 PM",5,0,"s2",""],["k1","tue","2:15 PM",15,0,"s3",""],["k1","tue","4:25 PM",5,0,"s4","C"],["k1","tue","3:15 PM",15,0,"s30",""],["k1","tue","2:50 PM",25,0,"s6",""],["k1","tue","2:30 PM",20,0,"s31",""],["k1","tue","3:55 PM",10,0,"s29",""],["k1","tue","3:30 PM",25,0,"s9",""],["k2","tue","2:00 PM",5,1,"s1","M"],["k2","tue","2:13 PM",5,1,"s4","C"],["k3","tue","2:00 PM",5,0,"s1","M"],["k3","tue","2:05 PM",5,0,"s2",""],["k3","tue","2:10 PM",5,0,"s15",""],["k3","tue","2:15 PM",5,0,"s16",""],["k3","tue","2:20 PM",20,0,"s17",""],["k3","tue","3:30 PM",10,0,"s18",""],["k3","tue","4:06 PM",5,0,"s4","C"],["k3","tue","3:05 PM",25,0,"s20",""],["k3","tue","2:40 PM",25,0,"s22",""],["k3","tue","3:40 PM",25,0,"s32",""],["k4","tue","2:00 PM",5,0,"s1","M"],["k4","tue","2:27 PM",5,0,"s4","C"],["k4","tue","2:05 PM",10,0,"s29",""],["k1","wed","9:00 AM",5,0,"s1","M"],["k1","wed","9:30 AM",5,0,"s2",""],["k1","wed","9:35 AM",15,0,"s3",""],["k1","wed","2:33 PM",5,0,"s4","C"],["k1","wed","10:25 AM",25,0,"s6",""],["k1","wed","10:05 AM",20,0,"s31",""],["k1","wed","10:50 AM",20,0,"s7",""],["k1","wed","11:10 AM",25,1,"s8",""],["k1","wed","12:25 PM",25,1,"s10",""],["k1","wed","9:50 AM",15,0,"s11",""],["k1","wed","11:45 AM",15,1,"s12",""],["k2","wed","9:00 AM",5,1,"s1","M"],["k2","wed","10:18 AM",5,1,"s4","C"],["k3","wed","9:00 AM",5,0,"s1","M"],["k3","wed","9:05 AM",25,0,"s13",""],["k3","wed","9:30 AM",5,1,"s14",""],["k3","wed","9:35 AM",5,0,"s2",""],["k3","wed","9:40 AM",5,0,"s15",""],["k3","wed","10:45 AM",5,0,"s16",""],["k3","wed","10:50 AM",20,0,"s17",""],["k3","wed","2:20 PM",10,0,"s18",""],["k3","wed","2:58 PM",5,0,"s4","C"],["k3","wed","2:00 PM",20,1,"s19",""],["k3","wed","11:35 AM",10,1,"s21",""],["k3","wed","11:10 AM",25,0,"s22",""],["k3","wed","10:00 AM",45,0,"s33",""],["k3","wed","2:30 PM",25,0,"s32",""],["k3","wed","12:00 PM",25,1,"s23",""],["k4","wed","9:00 AM",5,0,"s1","M"],["k4","wed","9:05 AM",20,1,"s26",""],["k4","wed","10:00 AM",40,0,"s27",""],["k4","wed","10:52 AM",5,0,"s4","C"],["k4","wed","9:35 AM",25,1,"s28",""],["k4","wed","9:25 AM",10,0,"s29",""],["k1","thu","9:00 AM",5,0,"s1","M"],["k1","thu","9:30 AM",5,0,"s2",""],["k1","thu","9:35 AM",15,0,"s3",""],["k1","thu","3:20 PM",5,0,"s4","C"],["k1","thu","12:05 PM",25,1,"s5",""],["k1","thu","10:35 AM",15,0,"s30",""],["k1","thu","10:10 AM",25,0,"s6",""],["k1","thu","9:50 AM",20,0,"s31",""],["k1","thu","11:00 AM",25,1,"s8",""],["k1","thu","10:50 AM",10,0,"s29",""],["k1","thu","11:50 AM",15,1,"s12",""],["k2","thu","9:00 AM",5,1,"s1","M"],["k2","thu","10:43 AM",5,1,"s4","C"],["k3","thu","9:00 AM",5,0,"s1","M"],["k3","thu","9:05 AM",25,0,"s13",""],["k3","thu","9:30 AM",5,1,"s14",""],["k3","thu","9:35 AM",5,0,"s2",""],["k3","thu","9:40 AM",5,0,"s15",""],["k3","thu","9:45 AM",5,0,"s16",""],["k3","thu","9:50 AM",20,0,"s17",""],["k3","thu","2:20 PM",10,0,"s18",""],["k3","thu","3:06 PM",5,0,"s4","C"],["k3","thu","2:00 PM",20,1,"s19",""],["k3","thu","2:30 PM",25,1,"s34",""],["k3","thu","11:50 AM",25,0,"s20",""],["k3","thu","10:10 AM",25,0,"s22",""],["k3","thu","11:25 AM",25,1,"s23",""],["k3","thu","12:30 PM",25,1,"s25",""],["k4","thu","9:00 AM",5,0,"s1","M"],["k4","thu","9:05 AM",20,1,"s26",""],["k4","thu","10:32 AM",5,0,"s4","C"],["k4","thu","9:55 AM",25,1,"s28",""],["k4","thu","9:25 AM",10,0,"s29",""],["k4","thu","9:35 AM",20,1,"s35",""],["k1","fri","9:00 AM",5,0,"s1","M"],["k1","fri","9:30 AM",5,0,"s2",""],["k1","fri","9:35 AM",15,0,"s3",""],["k1","fri","2:51 PM",5,0,"s4","C"],["k1","fri","10:05 AM",25,0,"s6",""],["k1","fri","10:55 AM",20,0,"s7",""],["k1","fri","11:15 AM",25,1,"s8",""],["k1","fri","10:30 AM",25,0,"s9",""],["k1","fri","12:05 PM",25,1,"s10",""],["k1","fri","9:50 AM",15,0,"s11",""],["k2","fri","9:00 AM",5,1,"s1","M"],["k2","fri","9:53 AM",5,1,"s4","C"],["k3","fri","9:00 AM",5,0,"s1","M"],["k3","fri","9:05 AM",25,0,"s13",""],["k3","fri","9:30 AM",5,1,"s14",""],["k3","fri","9:35 AM",5,0,"s2",""],["k3","fri","9:45 AM",5,0,"s15",""],["k3","fri","9:50 AM",5,0,"s16",""],["k3","fri","10:30 AM",20,0,"s17",""],["k3","fri","2:20 PM",10,0,"s18",""],["k3","fri","2:34 PM",5,0,"s4","C"],["k3","fri","2:00 PM",20,1,"s19",""],["k3","fri","12:05 PM",25,0,"s20",""],["k3","fri","10:50 AM",25,0,"s22",""],["k3","fri","10:00 AM",30,0,"s36",""],["k3","fri","11:40 AM",25,1,"s23",""],["k3","fri","12:30 PM",25,1,"s25",""],["k4","fri","9:00 AM",5,0,"s1","M"],["k4","fri","9:05 AM",20,1,"s26",""],["k4","fri","10:25 AM",20,0,"s27",""],["k4","fri","10:57 AM",5,0,"s4","C"],["k4","fri","10:05 AM",20,0,"s37",""],["k4","fri","9:25 AM",20,0,"s38",""],["k4","fri","9:45 AM",20,0,"s39",""]];
const HOWE_RETR=[["k1","mon","drill",13,1],["k2","mon","drill",8,1],["k2","mon","match",10,0],["k3","mon","drill",1,1],["k3","mon","sprint",2,1],["k4","mon","drill",10,1],["k4","mon","sprint",2,1],["k1","tue","drill",13,1],["k1","tue","sprint",2,1],["k2","tue","drill",8,1],["k3","tue","drill",1,1],["k4","tue","drill",10,1],["k4","tue","sprint",2,1],["k1","wed","drill",13,1],["k1","wed","match",10,0],["k2","wed","drill",8,1],["k2","wed","match",10,0],["k3","wed","drill",1,1],["k3","wed","sprint",2,1],["k4","wed","drill",10,1],["k4","wed","sprint",2,1],["k1","thu","drill",13,1],["k1","thu","sprint",2,1],["k2","thu","drill",8,1],["k3","thu","drill",1,1],["k3","thu","match",10,0],["k4","thu","drill",10,1],["k4","thu","sprint",2,1],["k1","fri","drill",13,1],["k1","fri","recheck",3,1],["k2","fri","drill",8,1],["k2","fri","match",10,0],["k3","fri","drill",1,1],["k3","fri","recheck",3,1],["k4","fri","drill",10,1],["k4","fri","sprint",2,1]];

console.log("G. Howe's own week (week 31 shape) — every card the old rule laid inside the day is laid exactly where it was");
{
  // the rule as it was (main e5cbab4): the first free window at/after the kid's last card, not lunch, not on the kid's cards,
  // a Mom card not on another kid's Mom card, walking to school end + 4 h, on Settings' one school day for every date
  function oldPlace(all, slot, R) {
    const isC = t => (t.title || "").indexOf("Closing Notebook") >= 0 || t.subjectKey === "closing_nb";
    const dayAll = all.filter(t => t.day === slot.day && !String(t.id || "").endsWith("_c")), ov = (a1, a2, b1, b2) => a1 < b2 && b1 < a2;
    const kc = dayAll.filter(t => t.who === slot.who && !isC(t)), mc = dayAll.filter(t => t.mom === "required" && !(t.who === slot.who && isC(t)));
    let last = 0; kc.forEach(t => { const e = toMin(t.time) + (t.dur || 20); if (e > last) last = e; });
    for (let t0 = Math.max(last, R.schoolStart); t0 + slot.dur <= R.schoolEnd + 240; t0 += 5) { const t1 = t0 + slot.dur;
      if (ov(t0, t1, R.lunchStart, R.lunchEnd)) continue; if (kc.some(x => ov(t0, t1, toMin(x.time), toMin(x.time) + (x.dur || 20)))) continue;
      if (slot.mom === "required" && mc.some(x => ov(t0, t1, toMin(x.time), toMin(x.time) + (x.dur || 20)))) continue; return t0; }
    return null;
  }
  const SD = { defaultStart: "9:00 AM", defaultEnd: "4:15 PM", lunchStart: "1:00 PM", lunchEnd: "2:00 PM", byDate: { "2026-11-13": { end: "3:00 PM" } } };
  const ISO = { monday: "2026-11-09", tuesday: "2026-11-10", wednesday: "2026-11-11", thursday: "2026-11-12", friday: "2026-11-13" };
  const cards = () => HOWE_CARDS.map((r, i) => ({ id: "h" + i, who: r[0], day: D3[r[1]], time: r[2], dur: r[3], mom: r[4] ? "required" : "none", subjectKey: r[5],
    title: r[6] === "M" ? "📖 Morning Notebook" : r[6] === "C" ? "📖 Closing Notebook" : r[6] === "L" ? "Lunch" : r[5], cascade: true }));
  const kindsOf = {}, minsOf = {}; HOWE_RETR.forEach(r => { const k = r[0] + "|" + r[1]; (kindsOf[k] = kindsOf[k] || []).push(r[2]); minsOf[r[0] + "|" + r[2]] = r[3]; });
  const env = mkEnv({ schoolDay: SD, dates: ISO });
  env.retrOn = () => true; env.retrDayKinds = (kid, dk) => (kindsOf[kid + "|" + dk] || []).slice(); env.retrSlotMinutes = (kid, kind) => minsOf[kid + "|" + kind] || 15;
  const T = cards(); const isoDays = DAYS.map(d => ISO[d]);
  // the old rule, replayed on its own copy in the generator's order (day → kid → kinds), then the new one on the real code
  const O = cards(), R = { schoolStart: toMin("9:00 AM"), schoolEnd: toMin("4:15 PM"), lunchStart: toMin("1:00 PM"), lunchEnd: toMin("2:00 PM") };
  const oldAt = {};
  DAYS.forEach(dn => env.ROSTER.forEach(kid => (kindsOf[kid + "|" + dn.slice(0, 3)] || []).forEach(kind => {
    if (!O.some(t => t.who === kid && t.day === dn)) return;
    const s = { id: kid + dn + kind, who: kid, day: dn, dur: minsOf[kid + "|" + kind] || 15, mom: kind === "match" ? "none" : "required", subjectKey: "retrieval", title: kind };
    const m = oldPlace(O, s, R); s.time = fromMin(m); O.push(s); oldAt[kid + "|" + dn + "|" + kind] = m;
    const isC = t => (t.title || "").indexOf("Closing Notebook") >= 0; O.filter(t => t.who === kid && t.day === dn && isC(t)).forEach(c => { if (toMin(c.time) < m + s.dur) c.time = fromMin(m + s.dur); });
  })));
  inject(env, T, isoDays);
  const endFor = dn => toMin((SD.byDate[ISO[dn]] || {}).end || SD.defaultEnd);
  let same = 0, inside = 0, fixedLate = 0, badLate = 0, diff = [];
  retr(T).forEach(t => {
    const m0 = oldAt[t.who + "|" + t.day + "|" + t.retrieval]; const oldIn = m0 != null && m0 + t.dur <= endFor(t.day);
    if (oldIn) { inside++; if (toMin(t.time) === m0 && !t._dayDrop) same++; else diff.push([t.who, t.day, t.retrieval, fromMin(m0), t.time]); }
    else { if (t._dayDrop || endOf(t) <= endFor(t.day)) fixedLate++; else badLate++; }
  });
  ok("G1 all 36 retrieval cards laid", retr(T).length === 36, retr(T).length);
  ok("G1 every card the old rule laid inside the day: same time, not boxed (" + same + "/" + inside + ")", inside > 25 && same === inside, diff);
  ok("G1 the ones the old rule ran past the day's end (" + fixedLate + ") are now inside it or in the box", badLate === 0 && fixedLate === 36 - inside, { fixedLate, badLate });
  ok("G1 the Closing Notebook is still each kid's last card", DAYS.every(dn => env.ROSTER.every(kid => { const mine = T.filter(t => t.who === kid && t.day === dn && !t._dayDrop); const c = mine.find(t => /Closing Notebook/.test(t.title)); return !c || mine.every(t => t === c || toMin(t.time) <= toMin(c.time)); })));
}

console.log("H. dry run / purity / wiring");
{
  const env = mkEnv(DW);
  const T = mk([["k1", "thu", "3:00 PM", 10, 0, "fact_review"], ["k1", "thu", "3:10 PM", 20, 0, "independent_reading"], ["k1", "thu", "3:40 PM", 20, 0, "piano"]]);
  inject(env, T, ["2026-11-05"]); env.seGuardWeek(T, env.seGuardCtx({ todayDay: "thursday", nowMin: toMin("11:47 AM") }));
  ok("H1 ?dryrun=1 (and always): the generator pass and the guard write nothing", env._writes.length === 0, env._writes);
  ok("H1 the DMSLOT finder and the generator pass never name the database", !/\bdb\b|\.ref\(|\bsv\(/.test(DMSLOT) && !/\bdb\.|\.ref\(|\bsv\(/.test(fn("gwInjectRetrieval")));
  ok("H2 the generator no longer walks past the end (no schoolEnd+240)", !/schoolEnd\+240/.test(fn("gwInjectRetrieval")) && /seRetrSlot\(allTasks,slot,W,/.test(fn("gwInjectRetrieval")));
  ok("H2 the generator reads the guard's own window for the date it lays", /_dmCtx\.win\(dn,dk\)/.test(fn("gwInjectRetrieval")));
  ok("H2 the guard's context hands seGuardWeek the same finder", /retrSlot:\(tasks,card,W,x\)=>seRetrSlot\(/.test(fn("seGuardCtx")) && /o\.retrSlot\(/.test(fn("seGuardWeek")));
  ok("H3 no 🔀, no family or kid name as a code literal in the new code", (DMSLOT + fn("gwInjectRetrieval")).indexOf("\u{1F500}") < 0 && !/["'`](lincoln|ellis|lucy|julian|andrew|makenzie|kenzie|taylor|caleb)["'`]/i.test(DMSLOT + fn("gwInjectRetrieval")));
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
