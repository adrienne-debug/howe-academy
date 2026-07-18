/*
 * Node tests for the DIGEST block (W0 of the weekly report / noticing layer).
 *
 * Extracts the REAL pure functions out of index.html via the DIGEST_START /
 * DIGEST_END markers and asserts: each of the five detectors fires exactly on
 * its threshold crossing (and stays quiet below it), triage suppression/mute/
 * ranking, the W2 hallucination guard, and the report aggregator's headline
 * deltas, consistency, carries, PBs, and reading math.
 *
 *   run:  node test_report.js
 */
const fs = require("fs");
const path = require("path");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");

const a = src.indexOf("// DIGEST_START");
const b = src.indexOf("// DIGEST_END");
if (a < 0 || b < 0) { console.error("DIGEST markers not found"); process.exit(1); }
const block = src.slice(a, b);
const D = new Function(block + `; return {digestDetect,digestTriage,digestFilterModelIds,digestBuildWeekReport,
  dgDetectBrainBreakCluster,dgDetectSprintSlide,dgDetectSubjectSlippage,dgDetectCarryStacking,dgDetectGateStall,
  dgIn,dgRange,dgKeyMinusDays,digestRecordHtml,dgSafeKeys};`)();

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log("  ok  - " + name); }
  else { fail++; console.log("  FAIL- " + name + (extra !== undefined ? "  (" + JSON.stringify(extra) + ")" : "")); }
}

// ── fixtures ─────────────────────────────────────────────────────────────────
// Report week: week13 = Mon 2026-09-14 .. Sat 2026-09-19.
const WKD = { monday: "2026-09-14", tuesday: "2026-09-15", wednesday: "2026-09-16",
  thursday: "2026-09-17", friday: "2026-09-18", saturday: "2026-09-19" };
const KIDS = ["lincoln", "ellis"];
const base = () => ({ wkKey: "week13", weekDates: WKD, kids: KIDS.slice() });
const epoch = iso => new Date(iso + "T12:00:00").getTime();
const bb = (subject, dateKey, feeling) => ({ ts: epoch(dateKey), dateKey, wk: "week13", day: "monday", by: "kid", subject, feeling: feeling || null });

// ── helpers under test ───────────────────────────────────────────────────────
(() => {
  const r = D.dgRange(WKD);
  ok("dgRange spans mon..sat", r.from === "20260914" && r.to === "20260919", r);
  ok("dgIn accepts iso inside", D.dgIn("2026-09-16", r) === true);
  ok("dgIn rejects iso outside", D.dgIn("2026-09-21", r) === false);
  ok("dgIn accepts epoch ts inside", D.dgIn(epoch("2026-09-16"), r) === true);
  ok("dgKeyMinusDays crosses month boundary", D.dgKeyMinusDays("20260914", 21) === "20260824");
})();

// ── 1) brain_break_cluster ───────────────────────────────────────────────────
(() => {
  const d = base();
  d.brainBreaks = { ellis: { log: {
    a: bb("Math", "2026-09-14", "frustrated"), b: bb("Math", "2026-09-15", "frustrated"),
    c: bb("Math", "2026-09-17", "tired"), x: bb("Reading", "2026-09-15", null) } } };
  const c = D.dgDetectBrainBreakCluster(d);
  ok("bb: 3 same-subject breaks fire", c.length === 1 && c[0].kind === "brain_break_cluster", c);
  ok("bb: facts carry count/days/topFeeling", c[0].facts.count === 3 && c[0].facts.days === 3 && c[0].facts.topFeeling === "frustrated", c[0].facts);
  ok("bb: severity 2 at exactly 3", c[0].severity === 2);
  ok("bb: stable id", c[0].id === "bb_cluster:ellis:math:wk13", c[0].id);
  d.brainBreaks.ellis.log.d = bb("Math", "2026-09-18", "frustrated");
  ok("bb: severity 3 at 4+", D.dgDetectBrainBreakCluster(d)[0].severity === 3);
})();
(() => {
  const d = base();
  d.brainBreaks = { ellis: { log: { a: bb("Math", "2026-09-14"), b: bb("Math", "2026-09-15") } } };
  ok("bb: only 2 breaks stays quiet", D.dgDetectBrainBreakCluster(d).length === 0);
  const d2 = base();
  d2.brainBreaks = { ellis: { log: { a: bb(null, "2026-09-14"), b: bb(null, "2026-09-15"), c: bb(null, "2026-09-16") } } };
  ok("bb: subject-less breaks never cluster", D.dgDetectBrainBreakCluster(d2).length === 0);
  const d3 = base();
  const old = bb("Math", "2026-08-01"); old.wk = "week10";
  d3.brainBreaks = { ellis: { log: { a: old, b: bb("Math", "2026-09-15"), c: bb("Math", "2026-09-16") } } };
  ok("bb: prior-week breaks don't count", D.dgDetectBrainBreakCluster(d3).length === 0);
})();

// ── 2) sprint_accuracy_slide ─────────────────────────────────────────────────
const sp = (deck, date, acc, best) => ({ deck, date, ts: epoch(date), accA: acc, best: best || 30 });
(() => {
  const d = base();
  d.sprintLog = { lincoln: [sp("CVC words", "2026-09-01", 90), sp("CVC words", "2026-09-08", 80), sp("CVC words", "2026-09-15", 65)] };
  const c = D.dgDetectSprintSlide(d);
  ok("sprint: 90→80→65 slide fires", c.length === 1 && c[0].kind === "sprint_accuracy_slide", c);
  ok("sprint: severity 2 at 65", c[0].severity === 2);
  ok("sprint: facts carry accs", JSON.stringify(c[0].facts.accs) === "[90,80,65]", c[0].facts);
  d.sprintLog.lincoln[2].accA = 55;
  ok("sprint: severity 3 under 60", D.dgDetectSprintSlide(d)[0].severity === 3);
})();
(() => {
  const flat = base();
  flat.sprintLog = { lincoln: [sp("d", "2026-09-01", 90), sp("d", "2026-09-08", 85), sp("d", "2026-09-15", 84)] };
  ok("sprint: 6pt drop stays quiet", D.dgDetectSprintSlide(flat).length === 0);
  const never80 = base();
  never80.sprintLog = { lincoln: [sp("d", "2026-09-01", 70), sp("d", "2026-09-08", 65), sp("d", "2026-09-15", 55)] };
  ok("sprint: never cleared 80 stays quiet", D.dgDetectSprintSlide(never80).length === 0);
  const stale = base();
  stale.sprintLog = { lincoln: [sp("d", "2026-08-01", 90), sp("d", "2026-08-08", 80), sp("d", "2026-08-15", 65)] };
  ok("sprint: slide ending before this week stays quiet", D.dgDetectSprintSlide(stale).length === 0);
  const up = base();
  up.sprintLog = { lincoln: [sp("d", "2026-09-01", 65), sp("d", "2026-09-08", 80), sp("d", "2026-09-15", 90)] };
  ok("sprint: improving stays quiet", D.dgDetectSprintSlide(up).length === 0);
})();

// ── 3) subject_slippage ──────────────────────────────────────────────────────
const comp = (kid, subj, planned, done, confidence) => ({
  byKid: { [kid]: { planned, done, subs: { [subj]: { planned, done } } } },
  planned, done, confidence: confidence == null ? 100 : confidence });
(() => {
  const d = base();
  d.archive = { week11: { completion: comp("ellis", "Math", 10, 9) },
                week12: { completion: comp("ellis", "Math", 10, 7) } };
  d.completion = comp("ellis", "Math", 10, 5);
  const c = D.dgDetectSubjectSlippage(d);
  ok("slip: 90→70→50 fires", c.length === 1 && c[0].kind === "subject_slippage", c);
  ok("slip: severity 2 at exactly 50", c[0].severity === 2);
  ok("slip: week series in facts", c[0].facts.weeks.length === 3 && c[0].facts.weeks[2].pct === 50, c[0].facts);
})();
(() => {
  const lowConf = base();
  lowConf.archive = { week11: { completion: comp("ellis", "Math", 10, 9) },
                      week12: { completion: comp("ellis", "Math", 10, 7, 40) } };  // unreliable
  lowConf.completion = comp("ellis", "Math", 10, 5);
  // week12 excluded -> series is 90 -> 50: 2-week decline landing under 60 still fires
  const c = D.dgDetectSubjectSlippage(lowConf);
  ok("slip: low-confidence week excluded but 2wk <60 fires", c.length === 1 && c[0].facts.weeks.length === 2, c);
  const small = base();
  small.archive = { week12: { completion: comp("ellis", "Math", 2, 2) } };
  small.completion = comp("ellis", "Math", 2, 0);
  ok("slip: planned<3 subjects ignored", D.dgDetectSubjectSlippage(small).length === 0);
  const mild = base();
  mild.archive = { week11: { completion: comp("ellis", "Math", 20, 18) }, week12: { completion: comp("ellis", "Math", 20, 17) } };
  mild.completion = comp("ellis", "Math", 20, 15);
  ok("slip: 90→85→75 (drop<20, cur>=60) stays quiet", D.dgDetectSubjectSlippage(mild).length === 0);
  const edge = base();
  edge.archive = { week11: { completion: comp("ellis", "Math", 10, 9) }, week12: { completion: comp("ellis", "Math", 10, 8) } };
  edge.completion = comp("ellis", "Math", 10, 7);
  ok("slip: exactly 20pt 3-week drop fires", D.dgDetectSubjectSlippage(edge).length === 1);
  const up = base();
  up.archive = { week11: { completion: comp("ellis", "Math", 10, 5) }, week12: { completion: comp("ellis", "Math", 10, 7) } };
  up.completion = comp("ellis", "Math", 10, 9);
  ok("slip: improving stays quiet", D.dgDetectSubjectSlippage(up).length === 0);
  const midweek = base();
  midweek.archive = { week11: { completion: comp("ellis", "Math", 10, 9) }, week12: { completion: comp("ellis", "Math", 10, 7) } };
  midweek.completion = comp("ellis", "Math", 10, 2);   // half-finished week looks terrible
  midweek.weekClosed = false;
  ok("slip: in-progress week's partial completion ignored", D.dgDetectSubjectSlippage(midweek).length === 0);
  midweek.weekClosed = true;
  ok("slip: same data fires once the week is over", D.dgDetectSubjectSlippage(midweek).length === 1);
})();

// ── 4) carry_stacking ────────────────────────────────────────────────────────
const ct = (id, who, title) => ({ id, who, title, day: "monday" });
(() => {
  const d = base();
  d.tasks = { m1_c: ct("m1_c", "lincoln", "Math — Lesson 40"), r1: ct("r1", "lincoln", "Reading — Ch 3") };
  d.archive = { week12: { tasks: [ct("m0_c", "lincoln", "Math — Lesson 39")] } };
  const c = D.dgDetectCarryStacking(d);
  ok("carry: 2 weeks running fires", c.length === 1 && c[0].facts.weeks === 2, c);
  ok("carry: severity 2 at 2 weeks", c[0].severity === 2);
  d.archive.week11 = { tasks: [ct("mx_c", "lincoln", "Math — Lesson 38")] };
  const c3 = D.dgDetectCarryStacking(d);
  ok("carry: 3 weeks running severity 3", c3.length === 1 && c3[0].severity === 3 && c3[0].facts.weeks === 3, c3);
})();
(() => {
  const solo = base();
  solo.tasks = { m1_c: ct("m1_c", "lincoln", "Math — Lesson 40") };
  solo.archive = { week12: { tasks: [ct("r0_c", "lincoln", "Reading — Ch 2")] } };
  ok("carry: different prior subject stays quiet", D.dgDetectCarryStacking(solo).length === 0);
  const gap = base();
  gap.tasks = { m1_c: ct("m1_c", "lincoln", "Math — Lesson 40") };
  gap.archive = { week11: { tasks: [ct("m0_c", "lincoln", "Math — Lesson 39")] }, week12: { tasks: [] } };
  ok("carry: a clean week breaks the streak", D.dgDetectCarryStacking(gap).length === 0);
})();

// ── 5) gate_stall ────────────────────────────────────────────────────────────
const sess = (date, items) => ({ date, pct: 50, items });
const it = (id, result) => ({ id, prompt: id, result });
(() => {
  const d = base();
  d.masteryHistory = { ellis: {
    "20260910": sess("2026-09-10", [it("sight_said", "m")]),
    "20260914": sess("2026-09-14", [it("sight_said", "c")]),
    "20260917": sess("2026-09-17", [it("sight_said", "m")]) } };
  const c = D.dgDetectGateStall(d);
  ok("stall: m,c,m over 3 checks fires", c.length === 1 && c[0].kind === "gate_stall", c);
  ok("stall: facts count tries/misses", c[0].facts.tries === 3 && c[0].facts.misses === 2, c[0].facts);
})();
(() => {
  const passed = base();
  passed.masteryHistory = { ellis: {
    "20260910": sess("2026-09-10", [it("w", "c")]), "20260914": sess("2026-09-14", [it("w", "c")]),
    "20260917": sess("2026-09-17", [it("w", "m")]) } };
  ok("stall: back-to-back passes stays quiet", D.dgDetectGateStall(passed).length === 0);
  const ends = base();
  ends.masteryHistory = { ellis: {
    "20260910": sess("2026-09-10", [it("w", "m")]), "20260914": sess("2026-09-14", [it("w", "m")]),
    "20260917": sess("2026-09-17", [it("w", "c")]) } };
  ok("stall: latest check a pass stays quiet", D.dgDetectGateStall(ends).length === 0);
  const two = base();
  two.masteryHistory = { ellis: { "20260914": sess("2026-09-14", [it("w", "m")]), "20260917": sess("2026-09-17", [it("w", "m")]) } };
  ok("stall: only 2 checks stays quiet", D.dgDetectGateStall(two).length === 0);
  const old = base();
  old.masteryHistory = { ellis: {
    "20260801": sess("2026-08-01", [it("w", "m")]), "20260805": sess("2026-08-05", [it("w", "m")]),
    "20260917": sess("2026-09-17", [it("w", "m")]) } };
  ok("stall: checks outside 21-day window ignored", D.dgDetectGateStall(old).length === 0);
})();

// ── triage: mute, suppression, ranking, cap ─────────────────────────────────
(() => {
  const mk = (id, kind, sev) => ({ id, kind, severity: sev, kid: "ellis", facts: {}, evidence: id });
  const cands = [mk("a", "carry_stacking", 2), mk("b", "brain_break_cluster", 2),
    mk("c", "gate_stall", 3), mk("d", "subject_slippage", 2), mk("e", "sprint_accuracy_slide", 2)];
  const t = D.digestTriage(cands, { todayKey: "20260919" });
  ok("triage: caps at 3", t.length === 3);
  ok("triage: severity first, then kind priority", t[0].id === "c" && t[1].id === "b" && t[2].id === "e", t.map(x => x.id));
  ok("triage: mute drops", D.digestTriage(cands, { todayKey: "20260919", mute: { c: true } })[0].id === "b");
  const seenRecent = D.digestTriage(cands, { todayKey: "20260919", seen: { c: "20260910" } });
  ok("triage: seen 9 days ago suppressed", !seenRecent.some(x => x.id === "c"));
  const seenOld = D.digestTriage(cands, { todayKey: "20260919", seen: { c: "20260830" } });
  ok("triage: seen 20 days ago resurfaces", seenOld[0].id === "c");
})();

// ── W2 hallucination guard ───────────────────────────────────────────────────
(() => {
  const cands = [{ id: "real1" }, { id: "real2" }];
  const out = D.digestFilterModelIds(["real2", "made_up", "real1"], cands);
  ok("guard: unknown ids dropped, known kept", JSON.stringify(out) === '["real2","real1"]', out);
})();

// ── aggregator ───────────────────────────────────────────────────────────────
(() => {
  const d = base();
  d.completion = comp("lincoln", "Math", 10, 8);
  d.archive = {
    week12: { completion: comp("lincoln", "Math", 10, 6) },
    week11: { completion: comp("lincoln", "Math", 10, 9) },
    week10: { completion: comp("lincoln", "Math", 10, 2, 30) } };  // unreliable, ignored
  d.tasks = { m1: ct("m1", "lincoln", "Math — L40"), m2_c: ct("m2_c", "lincoln", "Math — L39") };
  d.history = {
    m1: { id: "m1", who: "lincoln", ts: "10:00 AM Sep 14", day: "monday", checkedOnDay: "monday" },
    z: { id: "z", who: "lincoln", ts: "11:00 AM Sep 15", day: "monday", checkedOnDay: "tuesday" },
    gone: { id: "gone", who: "lincoln", ts: "Week Closed", missed: true, day: "friday" } };
  d.momMoves = { m1: { mode: "push", toDay: "wednesday", ts: 1 } };
  d.sprintLog = { lincoln: [sp("CVC", "2026-09-08", 90, 30), sp("CVC", "2026-09-15", 92, 34), sp("CVC", "2026-09-16", 91, 32)] };
  d.masteryHistory = { lincoln: { "20260915": sess("2026-09-15", []), "20260801": sess("2026-08-01", []) } };
  d.readingLog = { lincoln: { entries: {
    e1: { bookId: "b1", ts: epoch("2026-09-15"), fromPage: 10, toPage: 19 },
    e2: { bookId: "b1", ts: epoch("2026-08-15"), fromPage: 1, toPage: 9 } } } };
  d.brainBreaks = { lincoln: { log: { a: bb("Math", "2026-09-15", "tired") } } };
  d.finishLines = [{ kid: "lincoln", sk: "math", status: "amber" }, { kid: "ellis", sk: "las", status: "red" }];

  const r = D.digestBuildWeekReport(d);
  const L = r.kids.lincoln;
  ok("report: headline pct + delta vs last reliable week", L.headline.pct === 80 && L.headline.prevPct === 60 && L.headline.delta === 20, L.headline);
  ok("report: consistency uses checkedOnDay, skips missed", L.consistency.monday === 1 && L.consistency.tuesday === 1 && !L.consistency.friday, L.consistency);
  ok("report: carries list the _c task", L.carries.length === 1 && L.carries[0].subject === "Math", L.carries);
  ok("report: pushes map momMoves through the task's kid", L.pushes.length === 1 && L.pushes[0].toDay === "wednesday", L.pushes);
  ok("report: PB only when beating an earlier best, in-week", L.mastery.pbs.length === 1 && L.mastery.pbs[0].best === 34, L.mastery.pbs);
  ok("report: sprint count is in-week only", L.mastery.sprints === 2, L.mastery.sprints);
  ok("report: drill sessions in-week only", L.mastery.sessions === 1, L.mastery);
  ok("report: reading pages inclusive, in-week only", L.reading.pages === 10 && L.reading.sessions === 1, L.reading);
  ok("report: wellbeing counts + feelings", L.wellbeing.count === 1 && L.wellbeing.feelings.tired === 1, L.wellbeing);
  ok("report: finishLines pass through per kid", L.paceMovers.length === 1 && r.kids.ellis.paceMovers.length === 1);
  ok("report: candidates included", Array.isArray(r.candidates));
  const r2 = D.digestBuildWeekReport(d);
  ok("report: deterministic (same input, same ids)", JSON.stringify(r2.candidates.map(c => c.id)) === JSON.stringify(r.candidates.map(c => c.id)));
})();

// ── W1.5 record document ─────────────────────────────────────────────────────
(() => {
  const d = base();
  d.kids = ["lincoln"];
  d.tasks = {
    m1: { id: "m1", who: "lincoln", title: "Math — Lesson 40", day: "monday" },
    r1: { id: "r1", who: "lincoln", title: "Ind. Reading — Ch 3", day: "tuesday" },
    x1: { id: "x1", who: "lincoln", title: "Wordsmith — Session 9", day: "wednesday" },   // never done
    l1: { id: "l1", who: "lincoln", title: "Lunch", day: "monday" },
    c1: { id: "old7_c", who: "lincoln", title: "Math — Lesson 39", day: "monday" } };
  d.checked = { m1: "x", r1: "x", old7_c: "x" };
  d.history = { m1: { id: "m1", who: "lincoln", ts: "t", score: { pct: 95 } } };
  d.readingLog = { lincoln: {
    books: { b1: { title: "Charlotte's Web", totalPages: 100, status: "done" } },
    entries: { e1: { bookId: "b1", ts: epoch("2026-09-15"), fromPage: 80, toPage: 100 } } } };
  d.masteryHistory = { lincoln: { "20260915": sess("2026-09-15", []), "20260917": sess("2026-09-17", []) } };
  d.sprintLog = { lincoln: [sp("CVC words", "2026-09-16", 90, 31)] };
  const units = { brit: { name: "British Monarchy", enrolled: { lincoln: true },
    activities: [{ key: "crown", name: "Crown Jewels model" }, { key: "castle", name: "Castle diorama" }],
    activityLog: { lincoln: { crown: { ts: epoch("2026-09-17"), points: 20 },
                              castle: { ts: epoch("2026-08-01"), points: 20 } } } } };
  const doc = D.digestRecordHtml(d, { units, attOverrides: { thursday: { lincoln: true } }, generatedOn: "September 19, 2026" });

  ok("record: header with school, week, span", doc.includes("HOWE ACADEMY") && doc.includes("Week 13") && doc.includes("Sep 14, 2026") && doc.includes("6 scheduled days"), null);
  ok("record: completed work in subject table with score", doc.includes("<td>Math</td>") && doc.includes("Lesson 40") && doc.includes("95%"));
  ok("record: carried-in completion counts as work", doc.includes("Lesson 39"));
  ok("record: missed work is simply absent", !doc.includes("Session 9") && !doc.toLowerCase().includes("missed") && !doc.toLowerCase().includes("behind"));
  ok("record: lunch excluded", !doc.includes("Lunch"));
  // mon+tue worked, wed scheduled-but-unfinished, thu present by override = 3 of 4
  ok("record: attendance counts worked days + override day", doc.includes("3 of 4 scheduled days"), (doc.match(/Attendance:<\/b>[^<]*/) || [])[0]);
  ok("record: reading with pages and completion", doc.includes("Charlotte&#039;s Web") || doc.includes("Charlotte's Web"), null);
  ok("record: reading marks book completed", /completed/.test(doc) && doc.includes("pp. 80&ndash;100"));
  ok("record: review sessions with dates", doc.includes("2 spaced-review sessions") && doc.includes("Sep 15, Sep 17"));
  ok("record: fluency sprint with deck", doc.includes("1 timed fluency sprint") && doc.includes("CVC words"));
  ok("record: in-week unit activity listed, out-of-week absent", doc.includes("Crown Jewels model (British Monarchy)") && !doc.includes("Castle diorama"));
  ok("record: notes line + signature footer", doc.includes("Notes:") && doc.includes("Prepared by:") && doc.includes("generated September 19, 2026"));
  ok("record: no emoji or app chrome", !/[\u{1F000}-\u{1FAFF}☀-➿]/u.test(doc));

  // repeated daily items collapse; dash ranges survive the ASCII cleaner
  const d2 = base(); d2.kids = ["lucy"];
  d2.tasks = {
    a: { id: "a", who: "lucy", title: "Drills", day: "monday" },
    b: { id: "b", who: "lucy", title: "Drills", day: "tuesday" },
    c: { id: "c", who: "lucy", title: "Drills", day: "thursday" },
    p: { id: "p", who: "lucy", title: "Math Reasoning — Pg 86–87", day: "monday" } };
  d2.checked = { a: "x", b: "x", c: "x", p: "x" };
  const doc2 = D.digestRecordHtml(d2, {});
  ok("record: repeated daily items collapse to a day count", doc2.includes("Drills (3 days)") && !doc2.includes("Drills; Drills"), null);
  ok("record: en-dash page ranges become hyphens, not deleted", doc2.includes("Pg 86-87"), (doc2.match(/Pg[^<]*/) || [])[0]);
})();

// ── dgSafeKeys — Firebase-illegal map keys sanitized before a freeze write ───
(() => {
  const dirty = { "Ind. Reading": { planned: 5 }, "Eggspress Map/Lesson": { planned: 4 },
    "a#b$c[d]": 1, nested: { "S. 5A/5B": [{ "x.y": 2 }] }, clean: "left alone" };
  const s = D.dgSafeKeys(dirty);
  ok("safeKeys: dots removed", "Ind Reading" in s && !("Ind. Reading" in s), Object.keys(s));
  ok("safeKeys: slash becomes hyphen", "Eggspress Map-Lesson" in s);
  ok("safeKeys: # $ [ ] stripped", "abcd" in s);
  ok("safeKeys: recurses through objects and arrays", "S 5A-5B" in s.nested && s.nested["S 5A-5B"][0]["xy"] === 2, s.nested);
  ok("safeKeys: values and clean keys untouched", s.clean === "left alone" && s["Ind Reading"].planned === 5);
  const wk9 = D.dgSafeKeys(D.digestBuildWeekReport((() => { const d = base();
    d.completion = comp("lincoln", "Ind. Reading", 5, 4); return d; })()));
  const flat = JSON.stringify(wk9);
  ok("safeKeys: full report payload carries no illegal key chars",
    !/"[^"]*[.#$/\[\]][^"]*"\s*:/.test(flat.replace(/"(evidence|prompt|subject|title|deck|id|kind|wkKey)":"[^"]*"/g, '"":""')), null);
  const coll = D.dgSafeKeys({ "a.b": 1, "ab": 2 });
  ok("safeKeys: collisions keep both entries", coll["ab"] !== undefined && coll["ab_"] !== undefined, coll);
})();

// ── empty-world safety ───────────────────────────────────────────────────────
(() => {
  const r = D.digestBuildWeekReport(base());
  ok("empty: no data yields empty-but-shaped report", r.kids.lincoln.headline.pct === null && r.candidates.length === 0, r.kids.lincoln);
  ok("empty: detectors handle missing everything", D.digestDetect({}).length === 0);
})();

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
