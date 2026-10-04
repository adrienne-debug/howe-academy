/*
 * Node tests — 📌 LESSON DAY STAYS PUT (her ask 2026-10-04, DeWalt All About Spelling: "this one
 * absolutely 100% can only be on Wednesday").
 *
 * A subject can name the weekday its NEW lesson happens on (subject.lessonDay). The slot fill then keeps
 * every new lesson on that day, drops the last lesson's leftover practice days when the lesson day comes,
 * nothing pulls the lesson earlier, and a missed lesson day either moves to the next school day ("next")
 * or waits a week ("wait"). Shapes from the real DeWalt grids: Andrew (AAS 1 as 5-day lessons, Wednesday
 * lesson + 4 writing days), Taylor (one sitting a week, Wednesday). No lessonDay = the old behavior.
 *
 * Runs the REAL code sliced from index.html: the LESSONDAY helpers, seqFillSlots, subjNoCarry,
 * lidDoneSet, the Get-ahead / early-finish eligibility checks, and the real cascadeIntraWeek.
 *   run:  node test_lesson_day_pin.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const cut = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b); if (i < 0 || j < 0) { console.error("markers missing: " + a); process.exit(1); } return src.slice(i, j); };
function slice(name) {
  const sig = "function " + name + "("; const i = src.indexOf(sig);
  if (i < 0) throw new Error("function not found: " + name);
  let d = 0; for (let k = src.indexOf("{", i); k < src.length; k++) { if (src[k] === "{") d++; else if (src[k] === "}") { d--; if (d === 0) return src.slice(i, k + 1); } }
  throw new Error("unbalanced: " + name);
}
const LD = cut("// LESSONDAY_START", "// LESSONDAY_END");
const SEQ = cut("// SEQFILL_START", "// SEQFILL_END");

let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x) : "")); } };

const env = { console, JSON, Object, Array, String, Number, Math, Set, RegExp, Date, parseInt, isNaN };
vm.createContext(env); vm.runInContext(LD + "\n" + SEQ, env);
const E = env;

// Andrew's AAS 1 as 5-day lessons: Wednesday lesson + test, then writing Thu Fri Mon Tue.
const IDS = [], TXT = [];
for (let L = 18; L <= 21; L++) for (let k = 1; k <= 5; k++) { IDS.push("L" + L + "d" + k); TXT.push("Lesson " + L + " · day " + k + " of 5"); }
const DATES = { monday: "2026-10-05", tuesday: "2026-10-06", wednesday: "2026-10-07", thursday: "2026-10-08", friday: "2026-10-09" };
const isoOf = t => DATES[t.day] || "";
const pinFor = (mode, since) => ({ day: "wednesday", mode, since, isoOf, prevLD: iso => E.ldPrevDate(iso, "wednesday") });
const card = (id, day, lid, x) => Object.assign({ id, day, time: "10:00 AM", lid: lid || null, title: "📄 AAS 1 — x" }, x || {});
const fill = (o) => E.seqFillSlots(Object.assign({ kid: "andrew", sk: "all_about_spelling_1", planId: "andrew__all_about_spelling_1",
  lessonIds: IDS, lessonSeq: TXT, done: new Set(), isLocked: () => false, cards: [] }, o));
const lessonOf = (r, day) => (r.assign.find(a => a.day === day) || {}).lid || null;

console.log("── helpers ──");
ok("day 1 of 5 is a new lesson", E.ldIsDayOne("Lesson 3 · day 1 of 5"));
ok("day 3 of 5 is practice", !E.ldIsDayOne("Lesson 3 · day 3 of 5"));
ok("a one-day lesson (no day suffix) is always a new lesson", E.ldIsDayOne("Lesson 9"));
ok("works on a full card title", !E.ldIsDayOne("📄 AAS 1 — Lesson 3 · day 2 of 5"));
ok("ldPin reads Mon…Fri only", E.ldPin({ lessonDay: "Wed" }) === "Wed" && E.ldPin({ lessonDay: "Sat" }) === null && E.ldPin({}) === null);
ok("missed mode defaults to next school day", E.ldMissMode({}) === "next" && E.ldMissMode({ lessonDayMissed: "wait" }) === "wait");
ok("Wednesday before Thu Oct 8 is Oct 7", E.ldPrevDate("2026-10-08", "wednesday") === "2026-10-07");
ok("Wednesday before Wed Oct 7 is Sep 30 (strictly before)", E.ldPrevDate("2026-10-07", "wednesday") === "2026-09-30");
{
  const done = new Set(["L18d1", "L18d2", "L18d3", "L19d1"]);   // d4, d5 of lesson 18 never happened; lesson 19 started
  ok("practice passed over by a newer lesson day is dropped (L18 d4, d5)", JSON.stringify(E.ldDroppedLids(IDS, TXT, done)) === JSON.stringify(["L18d4", "L18d5"]));
  ok("nothing dropped while the current lesson is still running", E.ldDroppedLids(IDS, TXT, new Set(["L18d1", "L18d2"])).length === 0);
  const recs = { L18d1: { day: "2026-09-30" }, L18d2: { day: "2026-10-01" }, L19d1: { day: "2026-10-07" } };
  ok("since = the day the current lesson started", E.ldSince({}, IDS, TXT, recs) === "2026-10-07");
  ok("no lesson started yet → the plan's start date", E.ldSince({ pacing: { startDate: "2026-10-05" } }, IDS, TXT, {}) === "2026-10-05");
  ok("nothing known → never treated as missed", E.ldSince({}, IDS, TXT, {}) === "9999");
}

console.log("\n── a normal week: Mon/Tue practice, Wednesday new lesson, Thu/Fri practice ──");
{
  const done = new Set(["L18d1", "L18d2", "L18d3"]);
  const r = fill({ done, pin: pinFor("next", "2026-09-30"),
    cards: ["monday", "tuesday", "wednesday", "thursday", "friday"].map((d, i) => card("c" + i, d)) });
  ok("Monday = Lesson 18 day 4", lessonOf(r, "monday") === "L18d4");
  ok("Tuesday = Lesson 18 day 5", lessonOf(r, "tuesday") === "L18d5");
  ok("Wednesday = Lesson 19 day 1 (new lesson)", lessonOf(r, "wednesday") === "L19d1");
  ok("Thursday / Friday = Lesson 19 days 2, 3", lessonOf(r, "thursday") === "L19d2" && lessonOf(r, "friday") === "L19d3");
  ok("nothing dropped, reads in order", r.drop.length === 0 && r.ascending);
}

console.log("\n── the bug: a missed writing day is still owed, so NEXT week re-serves it and the lesson day slides ──");
{
  // Last week Lesson 19 began Wednesday; Monday's Lesson 18 day 4 was missed. Everything else got done.
  const done = new Set(["L18d1", "L18d2", "L18d3", "L18d5", "L19d1", "L19d2", "L19d3"]);
  const cards = ["monday", "tuesday", "wednesday", "thursday"].map((d, i) => card("c" + i, d));
  const old = fill({ done, cards });
  ok("(old behavior) next Monday re-serves the OLD Lesson 18 day 4", lessonOf(old, "monday") === "L18d4", old.assign);
  ok("(old behavior) …so Wednesday holds practice and the new lesson slides to Thursday", lessonOf(old, "wednesday") === "L19d5" && lessonOf(old, "thursday") === "L20d1", old.assign);
  const doneSet = new Set([...done, ...E.ldDroppedLids(IDS, TXT, done)]);   // what lidDoneSet hands the fill for a pinned subject
  const r = fill({ done: doneSet, cards, pin: pinFor("next", "2026-09-30") });
  ok("pinned: Monday = Lesson 19 day 4 (the missed Lesson 18 day is behind us)", lessonOf(r, "monday") === "L19d4", r.assign);
  ok("pinned: Wednesday = Lesson 20 day 1 — the lesson day held", lessonOf(r, "wednesday") === "L20d1");
  ok("pinned: Thursday continues the new lesson", lessonOf(r, "thursday") === "L20d2");
}
{
  const done = new Set(["L18d1", "L18d2", "L18d3"]);
  const cards = [card("mon", "monday", "L18d4"), card("tue", "tuesday"), card("wed", "wednesday"), card("thu", "thursday")];
  const r = fill({ done, isLocked: t => t.id === "mon", cards, pin: pinFor("next", "2026-09-30") });
  ok("same week: Monday missed → Tuesday day 5, Wednesday still the new lesson", lessonOf(r, "tuesday") === "L18d5" && lessonOf(r, "wednesday") === "L19d1");
}

console.log("\n── co-op Thursday: one writing day short — the leftover drops on Wednesday ──");
{
  // Lesson 19 began last Wednesday; co-op took Thursday, so only Fri (d2) got done. This week: Mon d3, Tue d4, Wed → new lesson.
  const done = new Set(["L18d1", "L18d2", "L18d3", "L18d4", "L18d5", "L19d1", "L19d2"]);
  const r = fill({ done, pin: pinFor("next", "2026-09-30"), cards: [card("m", "monday"), card("t", "tuesday"), card("w", "wednesday")] });
  ok("Mon d3, Tue d4", lessonOf(r, "monday") === "L19d3" && lessonOf(r, "tuesday") === "L19d4");
  ok("Wednesday skips Lesson 19 day 5 and starts Lesson 20", lessonOf(r, "wednesday") === "L20d1", r.assign);
  const after = new Set([...done, "L19d3", "L19d4", "L20d1"]);
  ok("once Lesson 20 starts, Lesson 19 day 5 counts as passed (dropped, not owed)", E.ldDroppedLids(IDS, TXT, after).indexOf("L19d5") >= 0);
}

console.log("\n── practice runs out before the lesson day: the empty slot comes off, the lesson waits for Wednesday ──");
{
  const done = new Set(["L18d1", "L18d2", "L18d3", "L18d4"]);
  const r = fill({ done, pin: pinFor("next", "2026-09-30"), cards: [card("m", "monday"), card("t", "tuesday"), card("w", "wednesday")] });
  ok("Monday = the last practice day", lessonOf(r, "monday") === "L18d5");
  ok("Tuesday may not take the new lesson early → dropped", !lessonOf(r, "tuesday") && r.drop.some(d => d.id === "t"), r);
  ok("Wednesday = the new lesson", lessonOf(r, "wednesday") === "L19d1");
}

console.log("\n── Wednesday missed ──");
{
  const done = new Set(["L18d1", "L18d2", "L18d3", "L18d4", "L18d5"]);
  // the cascade carries the missed Wednesday card to Thursday (mode "next" lets it); slots Thu, Fri
  const cards = [card("wedcard", "thursday", "L19d1"), card("fri", "friday")];
  const n = fill({ done, cards, pin: pinFor("next", "2026-09-30") });
  ok("\"next school day\": Thursday takes Lesson 19 day 1", lessonOf(n, "thursday") === "L19d1", n.assign);
  ok("…and Friday carries on with day 2", lessonOf(n, "friday") === "L19d2");
  const w = fill({ done, cards, pin: pinFor("wait", "2026-09-30") });
  ok("\"wait\": nothing lands Thursday or Friday — the lesson waits for next Wednesday", !lessonOf(w, "thursday") && !lessonOf(w, "friday"), w.assign);
}

console.log("\n── a fresh start on a Monday is not a 'missed' lesson day ──");
{
  const done = new Set(["L18d1", "L18d2", "L18d3", "L18d4", "L18d5"]);
  const r = fill({ done, pin: pinFor("next", "2026-10-05"), cards: [card("m", "monday"), card("w", "wednesday")] });
  ok("Monday stays empty (plan starts today — last Wednesday wasn't missed)", !lessonOf(r, "monday"));
  ok("Wednesday gets the lesson", lessonOf(r, "wednesday") === "L19d1");
}

console.log("\n── Taylor: one sitting a week ──");
{
  const ids = ["T9", "T10", "T11"], txt = ["Lesson 9", "Lesson 10", "Lesson 11"];
  const r = E.seqFillSlots({ kid: "taylor", sk: "aas4", planId: "p", lessonIds: ids, lessonSeq: txt, done: new Set(["T9"]), isLocked: () => false,
    pin: pinFor("next", "2026-09-30"), cards: [card("w", "wednesday"), card("x", "thursday")] });
  ok("Wednesday = Lesson 10", lessonOf(r, "wednesday") === "T10");
  ok("a stray Thursday slot does not take Lesson 11 (it isn't overdue)", !lessonOf(r, "thursday"), r.assign);
}

console.log("\n── no lesson day set = exactly the old fill ──");
{
  const done = new Set(["L18d1"]);
  const cards = ["monday", "tuesday", "wednesday"].map((d, i) => card("c" + i, d));
  const a = fill({ done, cards }), b = fill({ done, cards, pin: null });
  ok("same result with and without the (empty) pin", JSON.stringify(a) === JSON.stringify(b));
  ok("and it is the plain in-order fill", lessonOf(a, "monday") === "L18d2" && lessonOf(a, "wednesday") === "L18d4");
}

console.log("\n── practice: \"push the lesson up to 2 days\" (Sarah, DeWalt) ──");
{
  const P = (since, onTime, missedIds) => Object.assign(pinFor("next", since), { push: true, sinceOnTime: onTime, isMissed: t => (missedIds || []).indexOf(t.id) >= 0 });
  // Lesson 19 started on time (Wed Sep 30). Monday's day 4 was missed; today is Tuesday.
  {
    const done = new Set(["L18d1","L18d2","L18d3","L18d4","L18d5","L19d1","L19d2","L19d3"]);
    const cards = [card("mon","monday","L19d4"), card("tue","tuesday"), card("wed","wednesday"), card("thu","thursday"), card("fri","friday")];
    const r = fill({ done, isLocked: t => t.id === "mon", cards, pin: P("2026-09-30", true, ["mon"]) });
    ok("the missed day 4 comes back Tuesday", lessonOf(r, "tuesday") === "L19d4", r.assign);
    ok("Wednesday finishes practice (day 5) instead of the test", lessonOf(r, "wednesday") === "L19d5");
    ok("the test + new lesson move to Thursday (1 day late)", lessonOf(r, "thursday") === "L20d1");
    ok("Friday carries on with the new lesson", lessonOf(r, "friday") === "L20d2");
  }
  // Started on time but Thu–Tue all missed: Wednesday d2, Thursday d3, Friday (2nd day late) = test anyway.
  {
    const done = new Set(["L18d1","L18d2","L18d3","L18d4","L18d5","L19d1"]);
    const cards = [card("wed","wednesday"), card("thu","thursday"), card("fri","friday")];
    const r = fill({ done, cards, pin: P("2026-09-30", true, []) });
    ok("pushing: Wednesday = day 2, Thursday = day 3", lessonOf(r, "wednesday") === "L19d2" && lessonOf(r, "thursday") === "L19d3", r.assign);
    ok("capped: on the 2nd day late the test + new lesson happen anyway", lessonOf(r, "friday") === "L20d1");
  }
  // No chain: Lesson 20 started LATE (pushed to Friday). Its short week never pushes — next lesson back on Wednesday.
  {
    const done = new Set(["L18d1","L18d2","L18d3","L18d4","L18d5","L19d1","L19d2","L19d3","L19d4","L19d5","L20d1"]);
    const cards = [card("mon","monday"), card("tue","tuesday"), card("wed","wednesday")];
    const r = fill({ done, cards, pin: P("2026-10-02", false, []) });
    ok("Mon/Tue practice", lessonOf(r, "monday") === "L20d2" && lessonOf(r, "tuesday") === "L20d3");
    ok("Wednesday = the next lesson (no second push)", lessonOf(r, "wednesday") === "L21d1", r.assign);
  }
  // Practice all done → push mode changes nothing.
  {
    const done = new Set(["L18d1","L18d2","L18d3"]);
    const cards = ["monday","tuesday","wednesday"].map((d,i) => card("c"+i, d));
    const a = fill({ done, cards, pin: P("2026-09-30", true, []) }), b = fill({ done, cards, pin: pinFor("next", "2026-09-30") });
    ok("a normal week is identical in push and drop modes", JSON.stringify(a.assign) === JSON.stringify(b.assign));
  }
}
{
  const ctx = { console, JSON, Object, Array, String, Number, Math, Set, RegExp, Date }; vm.createContext(ctx); vm.runInContext(LD, ctx);
  ok("practice mode defaults to drop", ctx.ldPracticeMode({}) === "drop" && ctx.ldPracticeMode({ lessonDayPractice: "push" }) === "push");
}

console.log("\n── the movers: carry / pull rules ──");
{
  const subj = { andrew: { aas: { lessonDay: "Wed", lessonSeq: TXT, lessonIds: IDS }, math: {}, aasw: { lessonDay: "Wed", lessonDayMissed: "wait" } } };
  const ctx = { console, JSON, Object, Array, String, Number, Math, Set, RegExp, Date, currData: { subjects: subj, done: {} },
    checked: {}, claimed: {}, momMoves: {}, bwIs: () => true };
  vm.createContext(ctx);
  vm.runInContext(LD + "\n" + slice("subjNoCarry") + "\n" + slice("_efIsClose") + "\n" + slice("_efEligible") + "\n" + slice("_bwEligible"), ctx);
  const T = (sk, lid, title) => ({ id: "x", who: "andrew", subjectKey: sk, lid, title: "📄 AAS — " + title });
  ok("a practice card is day-bound (never swept forward)", ctx.subjNoCarry(T("aas", "L18d3", "Lesson 18 · day 3 of 5")) === true);
  ok("a new-lesson card may move on when missed (\"next school day\")", ctx.subjNoCarry(T("aas", "L19d1", "Lesson 19 · day 1 of 5")) === false);
  ok("…but not when the subject says \"wait\"", ctx.subjNoCarry(T("aasw", "L19d1", "Lesson 19 · day 1 of 5")) === true);
  ok("a subject probe (Catch up first / Master pull) is day-bound → no extra sittings added", ctx.subjNoCarry({ who: "andrew", subjectKey: "aas", title: "AAS" }) === true);
  ok("an unpinned subject is unchanged", ctx.subjNoCarry({ who: "andrew", subjectKey: "math", lid: "M1", title: "Math — L1" }) === false);
  ok("early-finish pull never takes a pinned card (even a new lesson)", ctx._efEligible(T("aas", "L19d1", "Lesson 19 · day 1 of 5"), "andrew") === false);
  ok("Get ahead never takes a pinned card", ctx._bwEligible(T("aas", "L19d1", "Lesson 19 · day 1 of 5"), "andrew") === false);
  ok("Get ahead still takes ordinary work", ctx._bwEligible({ id: "m", who: "andrew", subjectKey: "math", lid: "M1", title: "Math — L1" }, "andrew") === true);
}

console.log("\n── lidDoneSet: passed-over practice counts as behind us ──");
{
  const s = { lessonDay: "Wed", lessonSeq: TXT, lessonIds: IDS };
  const ctx = { console, JSON, Object, Array, String, Number, Math, Set, RegExp, Date,
    currData: { subjects: { andrew: { aas: s, plain: { lessonSeq: TXT, lessonIds: IDS } } },
      done: { andrew: { aas: { L18d1: {}, L18d2: {}, L19d1: {} }, plain: { L18d1: {}, L18d2: {}, L19d1: {} } } } },
    lidStamped: () => true };
  vm.createContext(ctx);
  vm.runInContext(LD + "\n" + slice("lidsFor") + "\n" + slice("lidDoneSet"), ctx);
  const d = ctx.lidDoneSet("andrew", "aas");
  ok("L18 days 3–5 count as passed", d.has("L18d3") && d.has("L18d4") && d.has("L18d5"));
  ok("no done RECORD is invented (the database node is untouched)", Object.keys(ctx.currData.done.andrew.aas).length === 3);
  ok("an unpinned subject keeps them owed", !ctx.lidDoneSet("andrew", "plain").has("L18d3"));
}

console.log("\n── the REAL intra-week shuffle (cascadeIntraWeek) ──");
{
  const FNS = ["toMin", "fromMin", "_parseCheckTs", "_dismissed", "_normOrderArr", "taskDevice", "taskSubject", "taskTier", "capFor", "capForDisplay",
    "catchupDayCap", "isCatchupCapped", "subjNoCarry", "applyStickyOrder", "packDay", "packAround", "cascadeIntraWeek"].map(slice).join("\n");
  const RealDate = Date;
  const frozen = iso => class F extends RealDate { constructor(...a) { if (!a.length) super(iso + "T09:00:00"); else super(...a); } static now() { return new RealDate(iso + "T09:00:00").getTime(); } };
  const WEEK = { monday: "October 5", tuesday: "October 6", wednesday: "October 7", thursday: "October 8", friday: "October 9" };
  function run(today, tasks, subjects) {
    const env = { DAY_DT: WEEK, WK: "week1", ROSTER: ["andrew"], weekData: { tasks }, checked: {}, claimed: {}, histState: {}, momMoves: {},
      currData: { subjects: { andrew: subjects } }, rulesData: {}, fbCurrLoaded: true, _cascNowMin: 9 * 60, DEFAULT_DAY_CAP: 2,
      smapIsKidOff: () => null, schedOv: () => null, schedOvKidOff: () => null, satCutoffMin: () => null, satApplyCutoff: () => {},
      sv: () => {}, dbg: () => {}, renderAll: () => {}, safeWriteTasks: () => {}, lockHeldByOther: () => false, _dryRun: () => true,
      db: { ref: () => ({ update: () => Promise.resolve(), set: () => Promise.resolve() }) }, Date: frozen(today),
      console, JSON, Math, Object, Array, Set, Map, String, Number, parseInt, isNaN, Promise };
    const keys = Object.keys(env);
    new Function(...keys, "\"use strict\";" + LD + "\n" + FNS + "; cascadeIntraWeek(); return null;")(...keys.map(k => env[k]));
    return tasks;
  }
  const mk = (id, day, sk, lid, title) => ({ id, who: "andrew", day, time: "10:00 AM", dur: 15, device: "paper", mom: "none", subjectKey: sk, lid, title: "📄 AAS 1 — " + title });
  const S = (x) => ({ aas: Object.assign({ display: "AAS 1", lessonDay: "Wed" }, x || {}), other: { display: "Other" } });
  {
    const t = [mk("p", "monday", "aas", "L18d4", "Lesson 18 · day 4 of 5"), mk("o", "monday", "other", "O1", "Other 1")];
    run("2026-10-06", t, S());
    ok("a missed Monday writing day stays on Monday (not swept onto Tuesday)", t.find(x => x.id === "p").day === "monday");
    ok("(control) an ordinary missed Monday card IS swept forward", t.find(x => x.id === "o").day !== "monday", t.find(x => x.id === "o").day);
  }
  {
    const t = [mk("n", "wednesday", "aas", "L19d1", "Lesson 19 · day 1 of 5")];
    run("2026-10-08", t, S());
    ok("\"next school day\": a missed Wednesday lesson moves on to Thursday or later", ["thursday", "friday"].indexOf(t[0].day) >= 0, t[0].day);
  }
  {
    const t = [mk("n", "wednesday", "aas", "L19d1", "Lesson 19 · day 1 of 5")];
    run("2026-10-08", t, S({ lessonDayMissed: "wait" }));
    ok("\"wait\": a missed Wednesday lesson stays where it was", t[0].day === "wednesday", t[0].day);
  }
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
