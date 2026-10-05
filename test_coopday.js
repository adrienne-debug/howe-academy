/*
 * 🏫 COOPDAY (her "yes" 2026-10-04, from Sarah's co-op Thursday worksheet) — per subject "On co-op days:
 * keep · shorten to __ min · skip". Replay on DeWalt's real subjects + China-Grove co-op (timed, every other
 * Thursday): co-op Thu 10/8 drops the skipped subjects, a NON-co-op Thursday (10/15) is unchanged, ×/wk spreads
 * over the days that are left, shorten trims only that day's card, and the "No Mom-required" flip doesn't undo a skip.
 *   run:  node test_coopday.js
 */
const fs = require("fs"), path = require("path");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
let pass = 0, fail = 0;
function ok(name, cond, extra) { if (cond) { pass++; console.log("  ok  - " + name); } else { fail++; console.log("  FAIL- " + name + (extra !== undefined ? "  (" + JSON.stringify(extra) + ")" : "")); } }
const sl = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error("slice " + a); return src.slice(i, j); };

const helpers = sl("function coopsMap(){", "\nfunction coopTimedEndMin(") + "\n" + sl("function coopMomDay(ds){", "\n// The timed co-ops on a date") + "\n"
  + sl("function coopBlocksBase(kid,ds,sk){", "// COOPDAY_END") + "\n" + sl("function _ovRmX(kid,dateStr,sk,ignoreAuto){", "\n// SO_START");
const inject = sl("    // Inject in-app subjects (lessonSeq, no Excel data) onto matching days", "    // Manual Lesson Map additions");

const ALL = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const daily = (display, minutes, allowedDays, tpw, extra) => Object.assign({ display, minutes, allowedDays, timesPerWeek: tpw, tracking: "daily", mom: "none" }, extra || {});
function dewalt(rules) {   // DeWalt's live subjects 10/4 (the co-op-relevant daily ones)
  const subs = {
    andrew: { handwriting: daily("Handwriting", 10, ALL, 5), piano: daily("Piano", 20, ALL, 5), independent_reading: daily("Independent Reading", 20, ALL, 5) },
    makenzie: { penmanship: daily("Penmanship", 10, ALL, 5), we_remember: daily("We Remember", 20, ALL, 5), reading: daily("Reading", 30, ALL, 5), piano: daily("Piano", 20, ALL, 5) },
    taylor: { fix_it_practice: daily("Fix-It Practice", 20, ["Tue", "Wed", "Thu", "Fri"], 3), typing_1_lesson: daily("Typing (1 lesson)", 15, ALL, 3), reading: daily("Reading", 30, ALL, 5),
      saxon_math_8_7: { display: "Saxon Math 8/7", minutes: 20, allowedDays: ALL, mom: "required", lessonSeq: ["L1"], timesPerWeek: 5 } },
  };
  for (const k in rules) for (const sk in rules[k]) subs[k][sk].coopDay = rules[k][sk];
  return subs;
}
const SARAH = { andrew: { handwriting: "skip" }, makenzie: { penmanship: "skip", we_remember: "skip", reading: 20 }, taylor: { fix_it_practice: "skip", typing_1_lesson: "skip" } };
const COOP = { coop_1790955225959: { name: "China-Grove Co-Op", mode: "timed", start: "9:00 AM", end: "3:00 PM", noMomBase: true, kids: ["taylor", "makenzie", "andrew", "caleb"],
  dates: ["2026-09-10", "2026-09-24", "2026-10-08", "2026-10-22", "2026-11-05"] } };

function world(rules, opts) {
  opts = opts || {};
  const G = { currData: { subjects: dewalt(rules) }, calendarData: { coops: JSON.parse(JSON.stringify(COOP)), coopMomDays: opts.momDays || {} } };
  const api = new Function("G", `
    const currData=G.currData, calendarData=G.calendarData; const scheduleOverrides={};
    function schedOv(){ return null; } function toMin(){ return 0; }
    ${helpers}
    function gwParseDate(d){ const [y,m,dd]=d.split("-").map(Number); return new Date(y,m-1,dd); }
    const WDAY_ABBR={0:"Sun",1:"Mon",2:"Tue",3:"Wed",4:"Thu",5:"Fri",6:"Sat"};
    function smapIsKidOff(){ return false; } function _ovOffX(){ return false; }
    function week(kid,sortedDates){
      const dayData={}; sortedDates.forEach(d=>dayData[d]={}); const subjects=currData.subjects[kid]; const subjectSlots={}; const ignoreAuto=false;
      ${inject}
      return {dayData,subjectSlots};
    }
    return { week, coopBlocksBase, coopDayMinutes, coopBlockName };`)(G);
  api.G = G; return api;
}
const WK1 = ["2026-10-05", "2026-10-06", "2026-10-07", "2026-10-08", "2026-10-09"];   // co-op Thu 10/8
const WK2 = ["2026-10-12", "2026-10-13", "2026-10-14", "2026-10-15", "2026-10-16"];   // no co-op
const days = (w, kid, dates, sk) => dates.filter(d => (w.week(kid, dates).dayData[d][kid] || {})[sk] !== undefined).map(d => d.slice(5));

console.log("before (nothing set): co-op Thursday carries everything — the stack Sarah saw");
{ const w = world({});
  ok("Andrew Handwriting runs Thu 10/8", days(w, "andrew", WK1, "handwriting").includes("10-08"));
  ok("Makenzie Penmanship + We Remember run Thu 10/8", days(w, "makenzie", WK1, "penmanship").includes("10-08") && days(w, "makenzie", WK1, "we_remember").includes("10-08"));
  ok("Taylor Fix-It Practice ×3 on Tue/Wed/Thu/Fri spreads Tue · Wed(ish) · Fri", days(w, "taylor", WK1, "fix_it_practice").length === 3, days(w, "taylor", WK1, "fix_it_practice")); }

console.log("\nSarah's answers set (skip / shorten)");
{ const w = world(SARAH);
  ok("Andrew: Handwriting skips 10/8, keeps Mon/Tue/Wed/Fri", JSON.stringify(days(w, "andrew", WK1, "handwriting")) === JSON.stringify(["10-05", "10-06", "10-07", "10-09"]), days(w, "andrew", WK1, "handwriting"));
  ok("…Piano + Independent Reading stay on 10/8 (keep)", days(w, "andrew", WK1, "piano").includes("10-08") && days(w, "andrew", WK1, "independent_reading").includes("10-08"));
  ok("Makenzie: Penmanship + We Remember skip 10/8", !days(w, "makenzie", WK1, "penmanship").includes("10-08") && !days(w, "makenzie", WK1, "we_remember").includes("10-08"));
  ok("…Reading still runs 10/8 (shortened, not skipped)", days(w, "makenzie", WK1, "reading").includes("10-08"));
  ok("Taylor: Fix-It Practice ×3 → Tue · Wed · Fri (last one Friday, as Sarah said)", JSON.stringify(days(w, "taylor", WK1, "fix_it_practice")) === JSON.stringify(["10-06", "10-07", "10-09"]), days(w, "taylor", WK1, "fix_it_practice"));
  ok("Taylor: Typing ×3 → Mon · Tue/Wed · Fri, never Thu 10/8", days(w, "taylor", WK1, "typing_1_lesson").length === 3 && !days(w, "taylor", WK1, "typing_1_lesson").includes("10-08"), days(w, "taylor", WK1, "typing_1_lesson"));
  ok("NON-co-op Thursday 10/15: Handwriting / Penmanship / We Remember all run", days(w, "andrew", WK2, "handwriting").includes("10-15") && days(w, "makenzie", WK2, "penmanship").includes("10-15") && days(w, "makenzie", WK2, "we_remember").includes("10-15"));
  ok("…and week 2 matches 'nothing set' exactly (Taylor too)", ["fix_it_practice", "typing_1_lesson"].every(sk => JSON.stringify(days(w, "taylor", WK2, sk)) === JSON.stringify(days(world({}), "taylor", WK2, sk))));
  const mk = w.G.currData.subjects.makenzie;
  ok("shorten: Makenzie Reading 30 → 20 min on 10/8", w.coopDayMinutes("makenzie", "2026-10-08", mk.reading, 30) === 20);
  ok("…full 30 on 10/15 (no co-op)", w.coopDayMinutes("makenzie", "2026-10-15", mk.reading, 30) === 30);
  ok("…never lengthens a card (shorten 45 on a 30-min card → 30)", w.coopDayMinutes("makenzie", "2026-10-08", Object.assign({}, mk.reading, { coopDay: 45 }), 30) === 30);
  ok("…keep / skip leave minutes alone", w.coopDayMinutes("makenzie", "2026-10-08", mk.piano, 20) === 20);
  ok("a kid NOT in the co-op is untouched", w.coopBlocksBase("lincoln", "2026-10-08", "handwriting") === false);
  ok("grid label names the co-op for a skipped slot", w.coopBlockName("andrew", "2026-10-08", "handwriting") === "China-Grove Co-Op");
  ok("Mom-required on the no-Mom day still blocked (unchanged)", w.coopBlocksBase("taylor", "2026-10-08", "saxon_math_8_7") === true); }

console.log("\nMom's one-date flip ('Mom's available') doesn't undo a skip — that rule is about time, not Mom");
{ const w = world(SARAH, { momDays: { "2026-10-08": true } });
  ok("Saxon (Mom-required) comes back on 10/8", w.coopBlocksBase("taylor", "2026-10-08", "saxon_math_8_7") === false);
  ok("Handwriting still skips 10/8", w.coopBlocksBase("andrew", "2026-10-08", "handwriting") === true);
  w.G.calendarData.coops.coop_1790955225959.noMomBase = false;
  ok("…and with the co-op's 'No Mom-required' box off", w.coopBlocksBase("andrew", "2026-10-08", "handwriting") === true); }

console.log("\nwiring");
ok("both card builders trim minutes through _coopMin", (src.match(/dur:_coopMin\((kid|mm\.kid),s,_lsd\?_lsd\.dur:\(s\.minutes\|\|20\)\)/g) || []).length === 2);
ok("⚙ Rules shows a 'Co-op day' column only for a kid in a timed co-op", /\.concat\(_coopCol\?\["Co-op day"\]:\[\]\)/.test(src) && /const _coopCol=\(function\(\)\{/.test(src));
ok("the cell cycles keep → shorten → skip and writes subject.coopDay via rlSet (re-lay on)", /\\'coopDay\\','\+\(_nx==null\?'null'/.test(src) && /'keep':\(_cr==="skip"\?'skip':'shorten'\)/.test(src));
ok("grid views label through coopBlockName", (src.match(/\?coopBlockName\(/g) || []).length === 3);

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
