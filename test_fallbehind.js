/*
 * Node tests for the ⚖ EVENING OUT panel (read-only).
 *
 * Her two questions: "what's even with attention comparing kids" and "what's even across
 * subjects in each individual kid's subjects", plus three standing checks — every kid-day
 * starts and ends with a notebook, every kid has mastery rows, every kid generates at all.
 *
 * ⚠ The instrument is the whole point. Measured on live data 2026-08-30, counting a
 * subject's completions from week*/ /*checked under-reports by ~30% (lincoln reads 9.0
 * sittings/wk that way, 13.2 from curriculum/done) because cards are re-dealt and carried,
 * and 49 of 469 done records are src:"manual" with no card check at all. And a bulk
 * hand-mark is not a productive week: lucy's handwriting showed 135% of plan off 23 manual
 * marks entered on one day against 4 real check-offs. Both traps are tested here.
 *
 *   run:  node test_fallbehind.js
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");

const a = src.indexOf("// FALLBEHIND_START"), b = src.indexOf("// FALLBEHIND_END");
if (a < 0 || b < 0) { console.error("FALLBEHIND markers not found"); process.exit(1); }
const BLOCK = src.slice(a, b);

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log("  ok  - " + name); }
  else { fail++; console.log("  FAIL- " + name + (extra !== undefined ? "  (" + JSON.stringify(extra) + ")" : "")); }
}
const nb = (who, day, kind) => ({ id: who + "_" + day + "_" + kind, who, day, mom: "required", dur: 5,
  subjectKey: kind === "open" ? "morning_nb" : "closing_nb",
  title: kind === "open" ? "📖 Morning Notebook — x" : "📖 Closing Notebook — x" });

function run(opts) {
  opts = opts || {};
  const ctx = {
    console,
    ROSTER: opts.roster || ["lincoln", "lucy"],
    currData: { subjects: opts.subjects || {}, done: opts.done || {} },
    weekData: { tasks: opts.tasks || [] },
    checked: opts.checked || {},
    planBacked: (k, sk) => !!(((opts.subjects || {})[k] || {})[sk] || {}).planId,
    retrTracks: opts.retrTracks || (() => [1]),
    cap: s => String(s || "").charAt(0).toUpperCase() + String(s || "").slice(1),
    gvGrabScroll: () => {}, renderAll: () => {}, Date: Date,
  };
  vm.createContext(ctx); vm.runInContext(BLOCK, ctx);
  return { ctx, call: expr => vm.runInContext(expr, ctx) };
}

console.log("── mom load across kids ──");
{
  const r = run({
    roster: ["lincoln", "julian"],
    tasks: [
      { id: "a", who: "lincoln", day: "monday", mom: "required", dur: 20 },
      { id: "b", who: "lincoln", day: "monday", mom: "maybe", dur: 25 },
      { id: "c", who: "julian", day: "monday", mom: "required", dur: 5 },
      { id: "d_retr", who: "julian", day: "monday", mom: "required", dur: 10 },   // retrieval slot
      { id: "e_c", who: "lincoln", day: "monday", mom: "required", dur: 99 },     // carry twin
    ],
  });
  const m = r.call("fbMomLoad()");
  ok("counts only mom-required", m.lincoln.min === 20, m.lincoln);
  ok("a retrieval slot counts toward mom load", m.julian.min === 15, m.julian);
  ok("Julian is a first-class row, never invisible", m.julian.cards === 2, m.julian);
  ok("carry twins (_c) are not a second sitting", m.lincoln.cards === 1, m.lincoln);
}

console.log("\n── delivery: which record gets counted ──");
{
  // A plan-backed subject MUST be counted from curriculum/done, not from checked — the
  // checked route under-reports by ~30% on live data.
  const subjects = { lincoln: { aas: { planId: "lincoln__aas", display: "AAS", timesPerWeek: 3 },
                                drills: { display: "Drills", timesPerWeek: 0 } } };
  const done = { lincoln: { aas: {
    L1: { day: "2026-08-03", src: "check" }, L2: { day: "2026-08-10", src: "check" },
    L3: { day: "2026-08-17", src: "manual" }, L4: { day: "2020-01-01", src: "check" } } } };
  const r = run({ roster: ["lincoln"], subjects, done,
    tasks: [{ id: "t1", who: "lincoln", day: "monday", subjectKey: "drills", mom: "required", dur: 10 },
            { id: "t2", who: "lincoln", day: "tuesday", subjectKey: "drills", mom: "required", dur: 10 }],
    checked: { t1: true } });
  const wks = r.call("fbActiveWeeks(5)");
  ok("active weeks come from the done records", wks.length === 4, wks);
  const aas = r.call('fbDone("lincoln","aas",["2026-08-03","2026-08-10","2026-08-17"])');
  ok("plan-backed counted from done, incl. manual marks", Math.abs(aas.per - 1) < 1e-9, aas);
  ok("a record outside the window is excluded", aas.per === 1, aas);
  const dr = r.call('fbDone("lincoln","drills",["2026-08-03"])');
  ok("a subject with no done records falls back to checked cards", dr.per === 1, dr);
  ok("and says so, so it is not read as a weekly average", dr.thisWeekOnly === true, dr);
}

console.log("\n── the bulk hand-mark trap ──");
{
  const done = { lucy: { hwt: {} } };
  for (let i = 0; i < 23; i++) done.lucy.hwt["m" + i] = { day: "2026-08-10", src: "manual" };
  for (let i = 0; i < 4; i++) done.lucy.hwt["c" + i] = { day: "2026-08-17", src: "check" };
  const r = run({ roster: ["lucy"], subjects: { lucy: { hwt: { planId: "lucy__hwt", display: "HWT" } } }, done });
  const h = r.call('fbDone("lucy","hwt",["2026-08-10","2026-08-17"])');
  ok("a week that is mostly hand-marks is flagged", h.manualBulk === true, h);
  ok("the manual count is reported, not hidden", h.manual === 23, h);
  const done2 = { lucy: { hwt: { a: { day: "2026-08-10", src: "check" }, b: { day: "2026-08-17", src: "manual" } } } };
  const r2 = run({ roster: ["lucy"], subjects: { lucy: { hwt: { planId: "lucy__hwt" } } }, done: done2 });
  ok("an ordinary week with one hand-mark is NOT flagged",
    r2.call('fbDone("lucy","hwt",["2026-08-10","2026-08-17"])').manualBulk === false);
}

console.log("\n── asked-per-week ──");
{
  const r = run({ roster: ["lincoln"],
    subjects: { lincoln: { aas: { pacing: { tpw: 3 } }, drills: {} } },
    tasks: [{ id: "x1", who: "lincoln", subjectKey: "drills", day: "monday" },
            { id: "x2", who: "lincoln", subjectKey: "drills", day: "tuesday" },
            { id: "x3_c", who: "lincoln", subjectKey: "drills", day: "tuesday" }] });
  ok("a sequenced subject asks its tpw", r.call('fbAsked("lincoln","aas")') === 3);
  ok("a daily subject asks what it actually gets", r.call('fbAsked("lincoln","drills")') === 2,
    r.call('fbAsked("lincoln","drills")'));
}

console.log("\n── her three standing checks ──");
{
  const good = ["monday", "tuesday"].flatMap(d => [nb("lincoln", d, "open"), nb("lincoln", d, "close")]);
  ok("a clean week reports nothing", run({ roster: ["lincoln"], tasks: good }).call("fbStandingChecks()").length === 0);

  // 3 — a kid who generates nothing at all. This is the one that would have caught Julian
  // in week 19, on the Monday rather than the Saturday.
  const none = run({ roster: ["lincoln", "julian"], tasks: good }).call("fbStandingChecks()");
  ok("a kid with NO cards is reported", none.some(x => x.kind === "nocards" && /Julian/.test(x.msg)), none);

  // 1 — bookends
  const noClose = run({ roster: ["lincoln"], tasks: good.filter(t => !/closing/i.test(t.title)) }).call("fbStandingChecks()");
  ok("a missing closing notebook is reported", noClose.some(x => x.kind === "nb" && /CLOSING/.test(x.msg)), noClose);
  const noOpen = run({ roster: ["lincoln"], tasks: good.filter(t => !/morning/i.test(t.title)) }).call("fbStandingChecks()");
  ok("a missing morning notebook is reported", noOpen.some(x => x.kind === "nb" && /MORNING/.test(x.msg)), noOpen);
  ok("it names the day", noOpen.some(x => /monday/.test(x.msg)), noOpen);

  // 2 — mastery rows
  const noMast = run({ roster: ["lincoln"], tasks: good, retrTracks: () => [] }).call("fbStandingChecks()");
  ok("a kid with no mastery rows is reported", noMast.some(x => x.kind === "mastery"), noMast);
}

console.log("\n── cold load ──");
{
  // Before the week's cards arrive every number is zero, which the panel would report as
  // "0 min of you asked this week (fits)" alongside four "no cards at all" alarms — a
  // reassurance and four false alarms, both wrong. Seen while auditing what had shipped.
  const R = src.indexOf("// FBRENDER_START"), R2 = src.indexOf("// FBRENDER_END");
  const REND = R >= 0 ? src.slice(R, R2) : "";
  ok("the panel says nothing until the week's cards are loaded",
    /!Array\.isArray\(weekData\.tasks\)\|\|!weekData\.tasks\.length\) return ""/.test(REND),
    "a cold load would report 0 min asked and four false alarms");
}

console.log("\n── ranking ──");
{
  // Daily work can only be counted from this week's check-offs, so on a Monday it reads
  // zero. Ranked against five-week averages it sorts to the top and the panel opens by
  // reporting the notebooks as the worst thing in the app. Own group, below.
  const R = src.indexOf("// FBRENDER_START"), R2 = src.indexOf("// FBRENDER_END");
  const REND = R >= 0 ? src.slice(R, R2) : "";
  ok("this-week-only rows are separated from tracked ones",
    /const tracked=rows\.filter\(r=>!r\.thisWeekOnly\)/.test(REND) && /const weekly=rows\.filter\(r=>r\.thisWeekOnly\)/.test(REND),
    "a Monday would rank the notebooks worst");
  ok("both groups are still sorted worst-first", (REND.match(/sort\(\(a,b\)=>a\.rate-b\.rate\)/g) || []).length === 2);
  ok("the this-week group is drawn after the tracked one",
    REND.indexOf("tracked.forEach(drawRow)") < REND.indexOf("weekly.forEach(drawRow)"));
  ok("and says why its numbers start at zero", /expect zeros early in the week/.test(REND));
}

console.log("\n── read-only ──");
{
  ok("the block never writes to the database", !/db\.ref\(/.test(BLOCK), "a reporting panel must not write");
  ok("it does not set anything on currData", !/currData\.[a-z]+\s*=/i.test(BLOCK));
  const R = src.indexOf("// FBRENDER_START"), R2 = src.indexOf("// FBRENDER_END");
  const REND = R >= 0 ? src.slice(R, R2) : "";
  ok("the renderer exists", R >= 0 && R2 > R);
  ok("the renderer never writes either", !/db\.ref\(/.test(REND));
  ok("its only control is the show/hide toggle", (REND.match(/onclick=/g) || []).length === 1,
    (REND.match(/onclick=/g) || []).length);
  ok("it is wired into the grid render", /h\+=fbRender\(\);/.test(src));
  ok("it is behind the Mom gate", /momModeActive\|\|adminPinUnlocked\)\{ try\{ h\+=fbRender/.test(src));
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
