/*
 * Node tests for RETRFAM — drill/match cards for every family (her yes 2026-11-03).
 * Live 10/30: Sara saved Andrew's rhythm (drill Mon/Tue/Thu/Fri, match every day) and regenerated —
 * no drill or match card, because gwInjectRetrieval skipped every kid without a sprint ladder
 * (retrTracks), and only the Howe kids have ladders. Runs the real RETRWEEK block (incl. RETRFAM),
 * the real GWRETR generator block and the real retrTracks against:
 *   A. Andrew's real saved plan + the shape of his live DeWalt week 5 (GET copy, 2026-11-03)
 *   B. kids with no plan / an all-off plan / sprint days and no ladder
 *   C. Howe: the four kids' real ladders + default weeks → byte-identical to the old gate
 *   D. the other three gates (grid load, Day-page strip, fall-behind check) read retrOn
 *
 *   run:  node test_retr_families.js
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");

function slice(a, b, label) {
  const i = src.indexOf(a), j = src.indexOf(b, i);
  if (i < 0 || j < 0 || j <= i) { console.error("marker not found: " + label); process.exit(1); }
  return src.slice(i, j + b.length);
}
const retrweek = slice("// RETRWEEK_START", "// RETRWEEK_END", "RETRWEEK");
const gwretr = slice("// GWRETR_START", "// GWRETR_END", "GWRETR");
const defaults = slice("const RETR_DEFAULTS=", "// P5.3 editor", "RETR_DEFAULTS");
const tracksSrc = slice("function retrMathfactStages(", "function retrEntries(", "retrTracks").replace(/function retrEntries\($/, "");

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log("  ok  - " + name); }
  else { fail++; console.log("  FAIL- " + name + (extra !== undefined ? "  (" + JSON.stringify(extra) + ")" : "")); }
}
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

const toMin = s => { if (!s) return 0; const m = String(s).match(/(\d+):(\d+)\s*(AM|PM)/i); if (!m) return 0;
  let h = +m[1] % 12; if (/pm/i.test(m[3])) h += 12; return h * 60 + +m[2]; };
const fromMin = mn => { let h = Math.floor(mn / 60), m = mn % 60, ap = h >= 12 ? "PM" : "AM";
  h = h % 12; if (h === 0) h = 12; return h + ":" + String(m).padStart(2, "0") + " " + ap; };

// realTracks: true = the real retrTracks (Howe ladders hard-wired, everyone else []); else a stub fn.
function mkEnv(retrievalPlan, roster, opts) {
  opts = opts || {};
  const env = {
    masteryData: { retrievalPlan: retrievalPlan || {}, history: {} },
    ROSTER: roster,
    SPRINT_LOE_B: [{ pg: "a" }, { pg: "c" }], retrEditorStages: () => [],
    gwParseDate: s => new Date(s + "T12:00:00"),
    gwRules: () => ({ schoolStart: toMin("9:00 AM"), schoolEnd: toMin("4:00 PM"), lunchStart: toMin("12:00 PM"), lunchEnd: toMin("1:00 PM") }),
    mlMomPartOf: () => null, mlMomSpan: (t, s, d) => [s, s + (d == null ? (t.dur || 20) : d)],
    toMin, fromMin,
    Date, Math, Object, JSON, String, Number, Array, parseInt, parseFloat, console, Set, RegExp, isNaN,
  };
  vm.createContext(env);
  let code = defaults + "\n" + retrweek + "\n" + gwretr;
  if (opts.oldGate) {
    // the gate exactly as it was before RETRFAM (main a9ffa84)
    code = code.replace(/if\(!\(\(typeof retrOn==="function"\)\?retrOn\(kid\):retrTracks\(kid\)\.length\)\) continue;/, "if(!retrTracks(kid).length) continue;");
    code = code.replace("const out=[], lad=retrHasLadder(kid);", "const out=[], lad=true;");
  }
  if (opts.realTracks) code = tracksSrc + "\n" + code;
  else env.retrTracks = opts.tracks || (() => []);
  new vm.Script(code).runInContext(env);
  return env;
}
const WDAY_MAP = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const DATES = { monday: "November 2", tuesday: "November 3", wednesday: "November 4", thursday: "November 5", friday: "November 6" };
const SORTED = ["2026-11-02", "2026-11-03", "2026-11-04", "2026-11-05", "2026-11-06"];
const dayOfYear = d => Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 86400000);
const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday"];
function inject(env, tasks) { env.gwInjectRetrieval(tasks, SORTED, WDAY_MAP, new Set(), DATES, dayOfYear); return tasks; }
const slots = (tasks, kid) => tasks.filter(t => t.subjectKey === "retrieval" && (!kid || t.who === kid));

// Andrew's live week-5 shape (DeWalt, GET 2026-11-03): first and last cards per day, Mom-required marked.
function andrewWeek(kids) {
  const T = [];
  const day = (d, rows) => kids.forEach(k => rows.forEach((r, i) => T.push({ id: k + d + i, who: k, day: d, time: r[0], dur: r[1], title: r[2], subjectKey: "s" + i, mom: r[3] ? "required" : "none" })));
  day("monday", [["9:00 AM", 15, "Fact Review"], ["9:25 AM", 20, "Arithmetic 2", 1], ["1:00 PM", 30, "Speech"], ["2:10 PM", 20, "Read Aloud"]]);
  day("tuesday", [["9:00 AM", 10, "All About Spelling"], ["9:25 AM", 20, "Arithmetic 2", 1], ["2:00 PM", 20, "Read Aloud"]]);
  day("wednesday", [["9:00 AM", 10, "All About Spelling"], ["9:30 AM", 30, "Language Arts 2", 1], ["2:00 PM", 20, "Read Aloud"]]);
  day("thursday", [["3:00 PM", 10, "Fact Review"], ["3:40 PM", 20, "Piano"]]);
  day("friday", [["9:00 AM", 10, "Spelling Practice"], ["9:55 AM", 20, "Arithmetic 2", 1], ["2:00 PM", 20, "Read Aloud"]]);
  return T;
}
// Sara's saved plan for Andrew, exactly as read from mastery/retrievalPlan/andrew
const ANDREW_PLAN = { week: { fri: "drill", mon: "drill", thu: "drill", tue: "drill", wed: "off" },
                      week2: { fri: "match", mon: "match", thu: "match", tue: "match", wed: "match" } };

console.log("A. a kid with no ladder and a saved rhythm (Andrew, DeWalt):");
{
  const env = mkEnv({ andrew: ANDREW_PLAN }, ["taylor", "makenzie", "andrew", "caleb"], { realTracks: true });
  ok("real retrTracks gives Andrew no ladder", env.retrTracks("andrew").length === 0);
  ok("retrOn(andrew) — saved rhythm", env.retrOn("andrew") === true);
  ok("retrOn(makenzie) — no plan", env.retrOn("makenzie") === false);
  const tasks = inject(env, andrewWeek(["andrew", "makenzie"]));
  const a = slots(tasks, "andrew");
  ok("9 cards for Andrew (4 drill + 5 match)", a.length === 9, a.length);
  ok("drill on Mon/Tue/Thu/Fri only", eq(a.filter(t => t.retrieval === "drill").map(t => t.day), ["monday", "tuesday", "thursday", "friday"]));
  ok("match every day", eq(a.filter(t => t.retrieval === "match").map(t => t.day), DAYS));
  ok("Daily Drill is Mom's, Match & Play is his own", a.every(t => t.mom === (t.retrieval === "drill" ? "required" : "none")));
  ok("titles are the usual slot titles", a.every(t => t.title === vm.runInContext("RETR_SLOT_TITLE", env)[t.retrieval]));
  ok("each card sits after his last card that day", a.every(t => {
    const mine = tasks.filter(x => x.who === "andrew" && x.day === t.day && x.subjectKey !== "retrieval");
    return mine.every(x => toMin(x.time) + x.dur <= toMin(t.time));
  }));
  ok("ids are day + kind + kid (stable across regenerations)", a.every(t => new RegExp("^2026d\\d+_retr_" + t.retrieval + "_andrew$").test(t.id)));
  ok("Makenzie (no plan) gets nothing", slots(tasks, "makenzie").length === 0);
  // before the fix: the same data gave zero cards
  const old = mkEnv({ andrew: ANDREW_PLAN }, ["andrew"], { realTracks: true, oldGate: true });
  ok("old gate on the same data: 0 cards (the bug)", slots(inject(old, andrewWeek(["andrew"]))).length === 0);
}

console.log("B. edges for a kid without a ladder:");
{
  const allOff = { week: { mon: "off", tue: "off", wed: "off", thu: "off", fri: "off" } };
  const sprinty = { week: { mon: "sprint", tue: "recheck", wed: "drill", thu: "off", fri: "match" }, week2: { mon: "match" } };
  const env = mkEnv({ k1: allOff, k2: sprinty, k3: {}, k4: { settings: { gate_pct: 90 } } }, ["k1", "k2", "k3", "k4"]);
  ok("all-off plan → not in the rhythm", env.retrOn("k1") === false);
  ok("empty plan → not in the rhythm", env.retrOn("k3") === false);
  ok("settings only → not in the rhythm", env.retrOn("k4") === false);
  ok("unknown kid → not in the rhythm", env.retrOn("nobody") === false);
  ok("sprint/recheck days on a no-ladder kid → in the rhythm", env.retrOn("k2") === true);
  ok("no ladder: Monday sprint dropped, Row-2 match kept", eq(env.retrDayKinds("k2", "mon"), ["match"]));
  ok("no ladder: recheck dropped", eq(env.retrDayKinds("k2", "tue"), []));
  ok("no ladder: drill kept", eq(env.retrDayKinds("k2", "wed"), ["drill"]));
  const tasks = inject(env, andrewWeek(["k1", "k2", "k3", "k4"]));
  ok("only k2 gets cards", eq([...new Set(slots(tasks).map(t => t.who))], ["k2"]));
  ok("k2: match Mon, drill Wed, match Fri — no sprint or re-check card", eq(slots(tasks, "k2").map(t => t.day.slice(0, 3) + ":" + t.retrieval), ["mon:match", "wed:drill", "fri:match"]));
  const lad = mkEnv({ k2: sprinty }, ["k2"], { tracks: () => [{ key: "x" }] });
  ok("same plan WITH a ladder keeps sprint + recheck", eq(lad.retrDayKinds("k2", "mon"), ["sprint", "match"]) && eq(lad.retrDayKinds("k2", "tue"), ["recheck"]));
}

console.log("C. Howe — the four kids' real ladders, output identical to the old gate:");
{
  const kids = ["lucy", "julian", "ellis", "lincoln"];
  const plans = [{}, { lincoln: { week: { mon: "drill", tue: "match" }, week2: { wed: "sprint" } }, julian: { week: { fri: "off" } } }];
  plans.forEach((rp, pi) => {
    const now = mkEnv(JSON.parse(JSON.stringify(rp)), kids, { realTracks: true });
    const was = mkEnv(JSON.parse(JSON.stringify(rp)), kids, { realTracks: true, oldGate: true });
    ok("plan set " + pi + ": every Howe kid has a ladder", kids.every(k => now.retrTracks(k).length > 0 && now.retrOn(k)));
    ok("plan set " + pi + ": retrDayKinds unchanged for every kid/day", kids.every(k => ["mon", "tue", "wed", "thu", "fri"].every(d => eq(now.retrDayKinds(k, d), was.retrDayKinds(k, d)))));
    const a = inject(now, andrewWeek(kids)), b = inject(was, andrewWeek(kids));
    ok("plan set " + pi + ": generated week byte-identical (" + slots(a).length + " slots)", JSON.stringify(a) === JSON.stringify(b) && slots(a).length > 0);
  });
}

console.log("D. the other gates read retrOn:");
{
  ok("grid load counts retrieval minutes for retrOn kids", /RETRFAM[^\n]*\n?/.test(src) && src.indexOf('((typeof retrOn==="function")?retrOn(gvKid):(typeof retrTracks==="function"&&retrTracks(gvKid).length))&&typeof retrDayKinds==="function"){ const _rks=') > 0);
  ok("Day-page brain-work strip uses retrOn", src.indexOf('!masteryData||!retrOn(kid)) return "";') > 0);
  ok("fall-behind 'no mastery rows' check uses retrOn", src.indexOf('tracks=(typeof retrOn==="function")?(retrOn(kid)?1:0)') > 0);
  ok("no kid names inside the RETRFAM block", !/lucy|julian|ellis|lincoln|andrew|makenzie|taylor|caleb/i.test(slice("// RETRFAM_START", "// RETRFAM_END", "RETRFAM").replace(/Andrew's|Sara/g, "").split("\n").filter(l => !/^\s*\/\//.test(l)).join("\n")));
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
