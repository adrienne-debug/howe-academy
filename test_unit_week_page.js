// 🧾 UNITWEEK — "This week we will…" on the kids' weekly unit notebook page (PLAN_unit_sheet_2026-11-19.md §4.1, §5 row 1; her
// "Yes, build it" 2026-11-19). Runs the REAL index.html blocks (FAMBLOCK, FAMTOGETHER, FAMBLOCKOUT, FAMLESSONS, FAMDAYSTART, UNITFT,
// LESSONRES, UNITTRACK, CRAFT, UNITDAY_EXTRAS, UNITDAY_GAME, UNITWEEK) and the REAL notebooks.js. A made-up family of two kids and a
// Builder-shaped unit (6 days, two activities on one day, a craft, a snack, a game, a PDF, 10 cards); no real names anywhere.
//  · NO WEEK LIST = BYTE FOR BYTE: notebooks.js with its UNITWEEK block and "// UNITWEEK" lines stripped prints the same notebook
//    from every generator (each custom one, a themed Pre-K, the starter one) when no insert carries a week list;
//  · index.html: a unit not on the schedule, or a week with none of its days → uwAttach hands back the very same inserts, untouched;
//  · a FAMILY-TIME unit (in order, on a Family Time block) and a ONE-KID unit (a kid's subject) both resolve their days from a
//    week's tasks — this week, and a PARKED next week (plan §7: never checked before). For the parked week the old question
//    (utDayForTask) answers with THIS week's day; the list asks the family lesson map for the card's own date;
//  · rows cap at 5 (+ N more); two activities on one day both show; no web address, no supply (Mom's or the kids'), no document,
//    no rung, no words text, no card definition reaches the list; the blocks make no database call;
//  · a unit with days this week but no card prints one page (the list + "My page"); with no days this week it prints nothing.
// Page overflow (8.5×11in, clipped silently) is measured in headless Chrome — see the hand-over note; this file checks content.
//   run: node test_unit_week_page.js
process.env.TZ = "America/New_York";
const fs = require("fs"), path = require("path"), vm = require("vm");
const rd = f => fs.readFileSync(path.join(__dirname, f), "utf8");
const src = rd("index.html"), nbSrc = rd("notebooks.js");
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x).slice(0, 600) : "")); } };
const J = x => JSON.stringify(x);
const cut = (s, a, b) => { const i = s.indexOf(a), j = s.indexOf(b, i); if (i < 0 || j < 0) throw new Error("markers " + a); return s.slice(i, j); };
const fnIn = (s, name) => { const i = s.indexOf("function " + name + "("); if (i < 0) throw new Error("no " + name); let d = 0, j = i, seen = false; for (; j < s.length; j++) { const c = s[j]; if (c === "{") { d++; seen = true; } else if (c === "}") { d--; if (seen && d === 0) break; } } return s.slice(i, j + 1); };

console.log("── wiring ──");
const i0 = src.indexOf("// UNITWEEK_START"), i1 = src.indexOf("// UNITWEEK_END");
ok("index.html: one UNITWEEK block, right after haBuildUnitInsight", i0 > 0 && i1 > i0 && src.indexOf("// UNITWEEK_START", i0 + 1) < 0 &&
  src.lastIndexOf("function haBuildUnitInsight(", i0) > src.lastIndexOf("function _unitPortrait(", i0) && src.indexOf("function haBuildUnitInsight(", i0) < 0);
ok("index.html: one guarded hook line in haNbContext, right after usNbAttach", (src.match(/units=uwAttach\(/g) || []).length === 1 && fnIn(src, "haNbContext").indexOf("units=uwAttach(kid,units,tasks,dates)") > 0 &&
  /  try\{ if\(typeof usNbAttach==="function"\) usNbAttach\(kid,units\); \}catch\(e\)\{\}[^\n]*\n  try\{ if\(typeof uwAttach==="function"\) units=uwAttach\(kid,units,tasks,dates\); \}catch\(e\)\{\}/.test(src));
const n0 = nbSrc.indexOf("  // UNITWEEK_START"), n1 = nbSrc.indexOf("  // UNITWEEK_END\n");
ok("notebooks.js: one UNITWEEK block, between unitInsertPages and USNB", n0 > 0 && n1 > n0 && nbSrc.indexOf("  // UNITWEEK_START", n0 + 1) < 0 &&
  nbSrc.lastIndexOf("function unitInsertPages(", n0) > 0 && nbSrc.indexOf("  // USNB_START") > n1);
const hooks = nbSrc.split("\n").filter(l => /   \/\/ UNITWEEK$/.test(l));
ok("notebooks.js: exactly five one-line hooks, all inside unitInsertPages (no-cards page, height, two-page p1 / p2, one-page top)", hooks.length === 5 &&
  hooks.every(l => fnIn(nbSrc, "unitInsertPages").indexOf(l) >= 0) && /return uwOnlyPage\(/.test(hooks[0]) && /estH \+= uwHeight\(ins\)/.test(hooks[1]) && /page === 1\) p1 = uwInto\(p1,/.test(hooks[2]) && /page === 2\) p2 = uwInto\(p2,/.test(hooks[3]) && /p12 = uwInto\(p12,/.test(hooks[4]), hooks);
const blockTxt = src.slice(i0, i1) + nbSrc.slice(n0, n1);
const NAMES = /\b(adrienne|andrew|julian|lincoln|ellis|lucy|sara|sarah|caleb|taylor|makenzie|kenzie|dewalt|burris|melanie|howe)\b/i;
ok("no kid or family name in the new code", !NAMES.test(blockTxt.replace(/UNIT_INSERT_THEMES\.[a-z]+/g, "")), (blockTxt.match(NAMES) || [])[0]);
ok("no database call in either block (read-only)", !/\bdb\b|\.ref\(|\.set\(|\.update\(|\.remove\(|\.transaction\(|firebase/i.test(blockTxt));
ok("no new stored field: the index.html block never writes to a unit, day or task", !/\b(u|d|t|day|it)\.[a-zA-Z_]+\s*=[^=]/.test(src.slice(i0, i1).replace(/ins\.week=wk/g, "")));
ok("no 🔀 emoji", blockTxt.indexOf("\u{1F500}") < 0);
const testTxt = fs.readFileSync(__filename, "utf8").split("\n").filter(l => !/^const NAMES =/.test(l)).join("\n");
ok("this test file names no real kid or family", !NAMES.test(testTxt.replace(/UNIT_INSERT_THEMES\.[a-z]+/g, "")), (testTxt.match(NAMES) || [])[0]);

// ── the world: the real family-time + unit blocks, a faked clock ──
const KIDS = ["kida", "kidb"];
const LINES = ["Bugs up close", "Insect bodies", "Caterpillars", "Ant snack day", "Bug games", "Bug parade"];
const SCHOOL = (() => { const out = []; const d = new Date(2026, 10, 2); while (d <= new Date(2027, 0, 29)) { const s = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); if (d.getDay() >= 1 && d.getDay() <= 5) out.push(s); d.setDate(d.getDate() + 1); } return out; })();
const DN = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const WEEKDAYS = ["monday", "tuesday", "wednesday", "thursday", "friday"];
// A Builder-shaped unit: 6 days · two activities on Day 2 (the day's notebook one + one set to day 2) · a craft (3) · a snack (4) · a
// game (5) · a PDF and a video (1) · a supply only Mom handles · rungs and words (never printed) · 10 cards.
const BUGS = () => ({ id: "bugs", title: "Backyard Bugs", emoji: "🐞", enrolled: { kida: true, kidb: true },
  decks: [{ key: "Bugs", groupBy: "kind", cards: Array.from({ length: 10 }, (_, i) => ({ name: "Bug " + (i + 1), kind: "insect", def: "DEFSECRET" + (i + 1), order: i + 1 })) }],
  activities: [{ key: "draw", title: "Draw a bug", emoji: "🖍", points: 5 }, { key: "label", title: "Label the parts", day: 2 }, { key: "later", title: "Not this week", day: 9 }],
  track: { mode: "seq", perWeek: 5, days: [
    { id: "d1", n: 1, t: LINES[0], res: { books: [{ title: "The Big Bug Book", by: "A. Writer" }], links: [{ url: "https://www.youtube.com/watch?v=bugvid", label: "Bug video", kind: "video" }, { url: "https://bugsite.example.org/look", label: "BUGSITELABEL", kind: "site" }],
      docs: [{ url: "https://files.example.org/bug-sheet.pdf", title: "PDFTITLE bug sheet", kind: "pdf" }], supplies: [{ name: "magnifying glass" }, { name: "MOMONLY hot glue gun", kids: false }], orders: [{ name: "ORDERNAME bug kit" }], notes: "NOTESECRET" } },
    { id: "d2", n: 2, t: LINES[1], nb: { activity: "draw" }, rungs: { little: "RUNGSECRET little", upper: "RUNGSECRET upper" } },
    { id: "d3", n: 3, t: LINES[2], craft: { title: "Egg-carton caterpillar", steps: ["Cut the carton"], supplies: [{ name: "CRAFTSUPPLY egg carton" }] } },
    { id: "d4", n: 4, t: LINES[3], snack: { title: "Ants on a log", supplies: [{ name: "SNACKSUPPLY celery" }] } },
    { id: "d5", n: 5, t: LINES[4], game: { title: "Bug bingo", supplies: [{ name: "GAMESUPPLY bingo chips" }], how: ["Call a bug"] } },
    { id: "d6", n: 6, t: LINES[5], words: { title: "A bug poem", text: "WORDSSECRET the words" }, note: "DAYNOTESECRET" }] } });
// A one-kid unit with no deck (a books-and-projects unit), on kidb's own subject.
const ROCKS = () => ({ id: "rocks", title: "Rock Hunt", emoji: "🪨", enrolled: { kidb: true }, decks: [],
  track: { mode: "seq", days: Array.from({ length: 7 }, (_, i) => ({ id: "r" + (i + 1), n: i + 1, t: "Rock day " + (i + 1), res: { books: [{ title: "Rock book " + (i + 1) }] } })) } });
// A unit enrolled but laid nowhere.
const SHELF = () => ({ id: "shelf", title: "On the Shelf", emoji: "📦", enrolled: { kida: true, kidb: true }, decks: [{ key: "Shelf", cards: [{ name: "Box" }] }],
  track: { mode: "seq", days: [{ id: "s1", n: 1, t: "Shelf day" }] } });
const BLOCK = () => ({ name: "Together", kids: KIDS.slice(), days: ["Mon", "Tue", "Wed", "Thu", "Fri"], at: "1:00 PM",
  items: [{ key: "ra", name: "Read Aloud", minutes: 20 },
    { key: "un", name: "Backyard Bugs", minutes: 30, track: { mode: "seq", startDate: "2026-11-16", list: LINES.map((t, i) => ({ t: "Day " + (i + 1) + " — " + t, n: 1, u: { id: "bugs", d: "d" + (i + 1) } })) } }] });

function world(o) {
  o = o || {};
  const RealDate = Date; const NOW = new RealDate(o.now);
  class FakeDate extends RealDate { constructor(...a) { if (a.length) super(...a); else super(NOW.getTime()); } static now() { return NOW.getTime(); } }
  const iso = d => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  const today = iso(NOW), todayDay = DN[NOW.getDay()];
  const mon = (() => { const d = new RealDate(NOW.getTime()); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d; })();
  const BOARD = {}; WEEKDAYS.forEach((dn, i) => { const d = new RealDate(mon.getTime()); d.setDate(d.getDate() + i); BOARD[dn] = iso(d); });
  const lessons = { kida: {} }; SCHOOL.forEach((d, i) => lessons.kida[i] = { date: d, week: "Wk" });
  const units = { bugs: BUGS(), rocks: ROCKS(), shelf: SHELF() };
  const writes = [];
  const ctx = { console, JSON, Object, Array, String, Number, Math, Set, Map, RegExp, WeakMap, Date: FakeDate, parseInt, parseFloat, isNaN, isFinite, setTimeout: () => 0, clearTimeout: () => {},
    window: { HA_FAMILY: { familyId: "testfam" } }, ROSTER: KIDS.slice(), KID_COLOR: {}, unitStudies: units, notebookSettings: {},
    rulesData: { schoolDay: { defaultStart: "9:00 AM", defaultEnd: "4:00 PM", lunchStart: "12:00 PM", lunchEnd: "1:00 PM" }, familyBlocks: { ft: BLOCK() } },
    currData: { subjects: { kidb: { geo: { display: "Rocks", unit: { id: "rocks" }, lessonSeq: ["Rock 1", "Rock 2", "Rock 3", "Rock 4", "Rock 5", "Rock 6", "Rock 7"], lessonIds: ["k1", "k2", "k3", "k4", "k5", "k6", "k7"] } } }, lessons, resources: {} },
    masteryData: {}, weekData: { tasks: o.active || [] }, checked: o.checked || {}, claimed: {}, histState: o.hist || {}, archive: {}, blockouts: {},
    WK: "week12", _todayDay: todayDay, lastTasksWrite: 0, rulesOpen: {}, gvShowPast: false,
    momHere: () => true, _dryRun: () => false, renderAll: () => {}, renderAllSoon: () => {}, dbg: () => {}, gwShowToast: () => {}, sv: () => {},
    db: { ref: p => ({ set: v => writes.push(["set", p]), update: v => writes.push(["update", p]), remove: () => writes.push(["remove", p]), transaction: () => writes.push(["tx", p]), once: () => writes.push(["read", p]), on: () => writes.push(["on", p]) }) },
    fbArr: v => v, cap: s => s ? s[0].toUpperCase() + s.slice(1) : s, esc: s => String(s == null ? "" : s).replace(/</g, "&lt;"),
    toMin: t => { const m = String(t || "").trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i); if (!m) return NaN; let h = +m[1]; const ap = (m[3] || "").toUpperCase(); if (ap === "PM" && h !== 12) h += 12; if (ap === "AM" && h === 12) h = 0; return h * 60 + (+m[2]); },
    gwParseDate: s => { const p = s.split("-"); return new FakeDate(+p[0], +p[1] - 1, +p[2]); },
    cbTodayISO: () => today, routineDateISO: dn => dn === todayDay ? today : (BOARD[dn] || null),
    llLessonKey: t => (t && t.lid) ? String(t.lid) : "", taskLessonRef: t => "", lrKeyForText: () => null,
    smapIsKidOff: () => false, coopTimedEndMin: () => 0, FX_DOW: { monday: "Mon", tuesday: "Tue", wednesday: "Wed", thursday: "Thu", friday: "Fri", saturday: "Sat", sunday: "Sun" },
    confirm: () => true, document: { getElementById: () => null, createElement: () => ({ style: {} }), body: { appendChild: () => {} } } };
  ctx.fromMin = v => { let h = Math.floor(v / 60), m = v % 60; const ap = h >= 12 ? "PM" : "AM"; let hh = h % 12; if (hh === 0) hh = 12; return hh + ":" + String(m).padStart(2, "0") + " " + ap; };
  ctx.relayWeek = () => {};
  vm.createContext(ctx);
  vm.runInContext([cut(src, "// FAMBLOCK_START", "// FAMBLOCK_END"), cut(src, "// FAMTOGETHER_START", "// FAMTOGETHER_END"), cut(src, "// FAMBLOCKOUT_START", "// FAMBLOCKOUT_END"),
    cut(src, "// FAMLESSONS_START", "// FAMLESSONS_END"), cut(src, "// FAMDAYSTART_START", "// FAMDAYSTART_END"), cut(src, "// UNITFT_START", "// UNITFT_END"),
    cut(src, "// LESSONRES_START", "// LESSONRES_END"), cut(src, "// UNITTRACK_START", "// UNITTRACK_END"), cut(src, "// CRAFT_START", "// CRAFT_END"),
    cut(src, "// UNITDAY_EXTRAS_START", "// UNITDAY_EXTRAS_END"), cut(src, "// UNITDAY_GAME_START", "// UNITDAY_GAME_END"),
    fnIn(src, "lidsFor"), fnIn(src, "haKidUnits"), fnIn(src, "_unitActs"), fnIn(src, "nbUnitDays"), cut(src, "// UNITWEEK_START", "// UNITWEEK_END"),
    "Object.defineProperty(this,'famProgress',{get:()=>famProgress,set:v=>{famProgress=v;}});"].join("\n"), ctx);
  ctx.famProgress = o.prog || {};
  return { ctx, writes, BOARD, today };
}
// A week's cards for one kid: the family copies Mon–Fri (+ Read Aloud, which points at no unit) and the kid's own lessons.
const famCards = (kid, pre, days) => (days || WEEKDAYS).map(dn => ({ id: pre + "_" + kid + "_" + dn, who: kid, day: dn, time: "1:00 PM", title: "👪 Backyard Bugs", famBlock: "ft", famItem: "un" }))
  .concat((days || WEEKDAYS).map(dn => ({ id: pre + "_ra_" + kid + "_" + dn, who: kid, day: dn, time: "12:30 PM", title: "👪 Read Aloud", famBlock: "ft", famItem: "ra" })));
const kidCards = (pre, map) => Object.keys(map).map(dn => ({ id: pre + "_geo_" + dn, who: "kidb", day: dn, time: "10:00 AM", title: "🪨 Rocks", subjectKey: "geo", lid: map[dn] }));
const rowsOf = w => (w && w.rows) ? w.rows.map(r => r.dn + " " + r.label) : null;

console.log("── this week: a family-time unit and a one-kid unit resolve their days ──");
{
  const { ctx, writes, BOARD } = world({ now: "2026-11-16T07:00:00" });   // Monday morning, the week just started
  const dates = { monday: "November 16", tuesday: "November 17", wednesday: "November 18", thursday: "November 19", friday: "November 20" };
  ok("the made-up week is the active week (dates match the board)", Object.keys(dates).every(dn => ctx.uwISO(dates[dn]) === BOARD[dn]), BOARD);
  const ta = famCards("kida", "w");
  const wa = ctx.uwWeekOf("kida", ctx.unitStudies.bugs, ta, dates);
  ok("family-time unit, kida: Mon–Fri = Day 1–5 in weekday order", J(rowsOf(wa)) === J(WEEKDAYS.map((dn, i) => dn[0].toUpperCase() + dn.slice(1, 3) + " Day " + (i + 1) + " — " + LINES[i])), rowsOf(wa));
  ok("…each the same day the Today's-card question (utDayForTask) names", ta.filter(t => t.famItem === "un").every((t, i) => { const r = ctx.utDayForTask(t); return r && r.id === "d" + (i + 1); }));
  const tb = famCards("kidb", "w").concat(kidCards("w", { monday: "k1", wednesday: "k2", friday: "k3" }));
  ok("family-time unit, kidb (the other kid's own copies): the same five days", J(rowsOf(ctx.uwWeekOf("kidb", ctx.unitStudies.bugs, tb, dates))) === J(rowsOf(wa)));
  const wr = ctx.uwWeekOf("kidb", ctx.unitStudies.rocks, tb, dates);
  ok("one-kid unit (kidb's subject): Mon Day 1 · Wed Day 2 · Fri Day 3", J(rowsOf(wr)) === J(["Mon Day 1 — Rock day 1", "Wed Day 2 — Rock day 2", "Fri Day 3 — Rock day 3"]), rowsOf(wr));
  ok("…and nothing for kida, who doesn't take it", ctx.uwWeekOf("kida", ctx.unitStudies.rocks, ta.concat(tb), dates) === null);
  ok("a unit laid nowhere → no list", ctx.uwWeekOf("kida", ctx.unitStudies.shelf, ta, dates) === null);
  ok("the chips: the book · ▶ video on Day 1; both activities on Day 2; ✂️ craft 3; 🍎 snack 4; 🎲 game 5", J(wa.rows.map(r => r.chips)) === J([["📚 The Big Bug Book", "▶ video"], ["🖍 Draw a bug", "🎨 Label the parts"], ["✂️ Egg-carton caterpillar"], ["🍎 Ants on a log"], ["🎲 Bug bingo"]]), wa.rows.map(r => r.chips));
  ok("an activity set to a day not this week (day 9) is not on the list", !J(wa).includes("Not this week"));
  ok("resolving wrote nothing and read nothing from the database", writes.length === 0, writes);
}

console.log("── a parked next week ──");
{
  // Saturday: this week's five Bugs days are done and recorded; the notebook is printed for next week, parked (nbWeekOverride).
  const active = [].concat(famCards("kida", "w"), famCards("kidb", "w"));
  const checked = {}, hist = {};
  active.forEach(t => { if (t.famItem !== "un") return; checked[t.id] = true; const i = WEEKDAYS.indexOf(t.day); hist[t.id] = { famLabel: "Day " + (i + 1) + " — " + LINES[i] }; });
  const { ctx, writes } = world({ now: "2026-11-21T10:00:00", active, checked, hist, prog: { ft: { un: { done: 5 } } } });
  const next = { monday: "November 23", tuesday: "November 24", wednesday: "November 25", thursday: "November 26", friday: "November 27" };
  const pa = famCards("kida", "n");
  const wa = ctx.uwWeekOf("kida", ctx.unitStudies.bugs, pa, next);
  ok("family-time unit, parked week: Monday = Day 6 (the unit's last day), then nothing", J(rowsOf(wa)) === J(["Mon Day 6 — Bug parade"]), rowsOf(wa));
  const old = ctx.utDayForTask(pa[0]);
  ok("…where the active-week question alone would have named THIS Monday's Day 1 (why the list asks with the card's own date)", old && old.id === "d1", old && old.id);
  ok("…and the active week, asked as the active week, still reads Day 1–5 (unchanged path)", J(active.filter(t => t.who === "kida" && t.famItem === "un").map(t => (ctx.uwDayFor(t, null) || {}).id)) === J(["d1", "d2", "d3", "d4", "d5"]));
  const pb = famCards("kidb", "n").concat(kidCards("n", { monday: "k4", tuesday: "k5", thursday: "k6" }));
  ok("one-kid unit, parked week: Mon Day 4 · Tue Day 5 · Thu Day 6 (its lesson ids say the day)", J(rowsOf(ctx.uwWeekOf("kidb", ctx.unitStudies.rocks, pb, next))) === J(["Mon Day 4 — Rock day 4", "Tue Day 5 — Rock day 5", "Thu Day 6 — Rock day 6"]), rowsOf(ctx.uwWeekOf("kidb", ctx.unitStudies.rocks, pb, next)));
  // A parked week whose family lessons go on: progress 2, so next week is Day 3–6.
  const w2 = world({ now: "2026-11-21T10:00:00", active, checked: {}, hist: {}, prog: { ft: { un: { done: 2 } } } });
  ok("family-time unit, parked week with lessons left: Mon–Thu = Day 3–6, Fri = all done (left off)", J(rowsOf(w2.ctx.uwWeekOf("kida", w2.ctx.unitStudies.bugs, pa, next))) === J(["Mon Day 3 — Caterpillars", "Tue Day 4 — Ant snack day", "Wed Day 5 — Bug games", "Thu Day 6 — Bug parade"]), rowsOf(w2.ctx.uwWeekOf("kida", w2.ctx.unitStudies.bugs, pa, next)));
  ok("a parked week's date in January reads next year (a week parked over New Year)", world({ now: "2026-12-30T10:00:00" }).ctx.uwISO("January 4") === "2027-01-04");
  ok("nothing written", writes.length === 0 && w2.writes.length === 0, writes);
}

console.log("── rows cap at 5; uwAttach ──");
{
  const { ctx } = world({ now: "2026-11-16T07:00:00" });
  const dates = { monday: "November 16", tuesday: "November 17", wednesday: "November 18", thursday: "November 19", friday: "November 20", saturday: "November 21" };
  const tb = kidCards("w", { monday: "k1", tuesday: "k2", wednesday: "k3", thursday: "k4", friday: "k5", saturday: "k6" });
  const w = ctx.uwWeekOf("kidb", ctx.unitStudies.rocks, tb, dates);
  ok("six unit days in one week → 5 rows + 1 more", w.rows.length === 5 && w.more === 1 && w.rows[4].dn === "Fri", w);
  ok("two cards on one day for the same unit day → one row", ctx.uwWeekOf("kidb", ctx.unitStudies.rocks, kidCards("x", { monday: "k1" }).concat(kidCards("y", { monday: "k1" })), dates).rows.length === 1);
  const insB = { unitId: "bugs", title: "Backyard Bugs", emoji: "🐞", learning: [{ name: "Bug 1", bio: "x" }], learned: [], next: [], extras: [], activities: [] };
  const insS = { unitId: "shelf", title: "On the Shelf", learning: [], learned: [], next: [{ name: "Box" }], extras: [], activities: [] };
  const none = [insB, insS], noneJ = J(none);
  const back = ctx.uwAttach("kida", none, [], dates);
  ok("no unit day this week → the very same array, nothing added to an insert", back === none && J(back) === noneJ);
  const ta = famCards("kida", "w");
  const got = ctx.uwAttach("kida", [insB, insS], ta, dates);
  ok("Bugs laid this week → its insert carries the list; the shelf unit's doesn't", got.length === 2 && got[0].week && got[0].week.rows.length === 5 && !got[1].week);
  const tb2 = famCards("kidb", "w").concat(kidCards("w", { monday: "k1", wednesday: "k2" }));
  const gotB = ctx.uwAttach("kidb", [Object.assign({}, insB)], tb2, dates);
  ok("a deckless unit with days this week gets a bare insert (no cards, the list), in the kid's unit order", gotB.length === 2 && gotB[1].unitId === "rocks" && gotB[1].week.rows.length === 2 && !gotB[1].learning.length && !gotB[1].next.length && !gotB[1].activities.length, gotB.map(x => x.unitId));
  ok("a unit switched out of the notebook (nbInsert:false) gets nothing", (() => { ctx.unitStudies.rocks.nbInsert = false; const r = ctx.uwAttach("kidb", [Object.assign({}, insB)], tb2, dates); delete ctx.unitStudies.rocks.nbInsert; return r.length === 1; })());
}

console.log("── the notebooks: byte for byte with no list ──");
const load = s => { const w = {}; (new Function("window", "document", s))(w, {}); return w.HoweNotebooks; };
const strip = s => { const a = s.indexOf("  // UNITWEEK_START"), b = s.indexOf("  // UNITWEEK_END\n"); s = s.slice(0, a) + s.slice(b + "  // UNITWEEK_END\n".length); return s.split("\n").filter(l => !/   \/\/ UNITWEEK$/.test(l)).join("\n"); };
const NB = load(nbSrc), NB0 = load(strip(nbSrc));
ok("the stripped file has no trace of UNITWEEK", !/uwRowsOf|uwHasCards|uwHeight|uwBlockHTML|uwInto|uwOnlyPage|UNITWEEK/.test(strip(nbSrc)));
// every custom generator (keys read from the file, so no names are written here), a themed Pre-K, the starter notebook
const genKeys = (cut(nbSrc, "  var GENERATORS = {", "\n  };").match(/^    ([a-z]+): \{ label:/gm) || []).map(l => l.trim().split(":")[0]);
const pkThemes = ["dino", "shark", "construction"].filter(k => cut(nbSrc, "  var NB_THEMES = {", "\n  };").indexOf("    " + k + ":") >= 0);
const GENS = genKeys.map(k => [k]).concat(pkThemes.map(t => ["kidp" + t, { notebookTheme: t, nbGrade: "Pre-K" }]), [["kidz"]]);
ok("found the custom generators and Pre-K looks to run", genKeys.length >= 4 && pkThemes.length >= 1, { genKeys, pkThemes });
const ndates = { monday: "November 16", tuesday: "November 17", wednesday: "November 18", thursday: "November 19", friday: "November 20" };
const ntasks = kid => WEEKDAYS.map((d, i) => ({ id: kid + i, who: kid, day: d, title: "📖 Reading " + i, time: "10:00 AM", mom: "none" }));
const mk = (kid, units, extra) => Object.assign({ weekData: { dates: ndates, tasks: ntasks(kid) }, weekNum: 12, extraPages: {}, prevSummary: {}, pace: [], units, nbKidName: "Student" }, extra || {});
const BIO = "Bugs have six legs and three body parts, and many of them can fly.";
const CARDINS = n => ({ unitId: "bugs", title: "Backyard Bugs", emoji: "🐞", learning: Array.from({ length: n }, (_, i) => ({ name: "Bug " + (i + 1), group: "insect", bio: BIO, portrait: { emoji: "🐞" } })), learned: [{ name: "Bug 9" }], next: [{ name: "Bug 10" }], extras: [], activities: [] });
const NOCARD = { unitId: "rocks", title: "Rock Hunt", emoji: "🪨", learning: [], learned: [], next: [], extras: [], activities: [] };
GENS.forEach(([kid, ex]) => {
  [["no units", []], ["a unit with cards", [CARDINS(3)]], ["a unit with no cards", [NOCARD, CARDINS(5)]], ["an activity queued", [Object.assign(CARDINS(2), { activities: [{ key: "draw", title: "Draw a bug", kind: "sheet", steps: ["Draw"], points: 5 }] })]]].forEach(([lbl, units]) => {
    const a = NB.generate(kid, mk(kid, units, ex)), b = NB0.generate(kid, mk(kid, units, ex));
    ok(kid + ", " + lbl + ": student and parent notebooks identical to main's", a.student === b.student && a.parent === b.parent && a.student.length > 1000);
  });
});

console.log("── the notebooks: with the list ──");
{
  const { ctx } = world({ now: "2026-11-16T07:00:00" });
  const week = ctx.uwWeekOf("kida", ctx.unitStudies.bugs, famCards("kida", "w"), ndates);
  const insW = Object.assign(CARDINS(2), { week });
  GENS.forEach(([kid, ex]) => {
    const h = NB.generate(kid, mk(kid, [insW], ex)).student, h0 = NB0.generate(kid, mk(kid, [CARDINS(2)], ex)).student;
    const i = h.indexOf("This week we will"), j = h.indexOf("What you’re learning right now");
    ok(kid + ": the list prints once, under the header and above the cards", i > 0 && j > i && h.indexOf("This week we will", i + 1) < 0 && h.lastIndexOf("Unit Study — Backyard Bugs", i) > 0);
    ok(kid + ": five rows, a ☐ each, Mon … Fri, the day titles", (h.match(/border-radius:3px;flex-shrink:0;margin-top:1px/g) || []).length === 5 && WEEKDAYS.every((d, k) => h.indexOf("Day " + (k + 1) + " — " + LINES[k]) > i));
    ok(kid + ": the same number of unit pages as without the list", (h.match(/<div class="page-label">Unit Study — /g) || []).length === (h0.match(/<div class="page-label">Unit Study — /g) || []).length);
  });
  const h = NB.generate("kidz", mk("kidz", [insW])).student;
  const blk = h.slice(h.indexOf('data-uw="1"'), h.indexOf("What you’re learning right now"));
  ok("both of Day 2's activities show", blk.indexOf("Draw a bug") > 0 && blk.indexOf("Label the parts") > 0);
  ok("book, video, craft, snack, game all show", ["The Big Bug Book", "▶ video", "Egg-carton caterpillar", "Ants on a log", "Bug bingo"].every(s => blk.indexOf(s) > 0));
  const h0 = NB.generate("kidz", mk("kidz", [CARDINS(2)])).student, cnt = (x, k) => x.split(k).length - 1;
  const leak = ["http", "www.", "youtube", "example.org", ".pdf", "PDFTITLE", "BUGSITELABEL", "magnifying", "MOMONLY", "CRAFTSUPPLY", "SNACKSUPPLY", "GAMESUPPLY", "ORDERNAME", "NOTESECRET", "RUNGSECRET", "WORDSSECRET", "DAYNOTESECRET", "DEFSECRET", "A. Writer"].filter(k => cnt(h, k) !== cnt(h0, k) || blk.indexOf(k) >= 0);
  ok("no web address, document, supply (Mom's or the kids'), order, note, rung, words or card definition comes with the list (the notebook's own font links aside)", !leak.length, leak);
  const capW = { rows: Array.from({ length: 7 }, (_, k) => ({ dn: "Mon", label: "Day " + (k + 1) + " — x", chips: [] })), more: 2 };
  const hc = NB.generate("kidz", mk("kidz", [Object.assign(CARDINS(1), { week: capW })])).student;
  ok("notebooks.js caps at 5 rows even if handed more, and says + N more", (hc.match(/border-radius:3px;flex-shrink:0;margin-top:1px/g) || []).length === 5 && hc.indexOf("+ 2 more this week") > 0);
  const esc = NB.generate("kidz", mk("kidz", [Object.assign(CARDINS(1), { week: { rows: [{ dn: "Mon", label: 'Day 1 — <b>"x"</b> & y', chips: ["📚 <i>z</i>"] }], more: 0 } })])).student;
  ok("titles and chips are escaped", esc.indexOf("<b>\"x\"") < 0 && esc.indexOf("<i>z") < 0 && esc.indexOf("&lt;b>&quot;x&quot;&lt;/b> &amp; y") > 0 && esc.indexOf("📚 &lt;i>z") > 0);
  // a deckless / no-card unit with days this week → one page: header, list, My page
  const tb = famCards("kidb", "w").concat(kidCards("w", { monday: "k1", wednesday: "k2" }));
  const ins = ctx.uwAttach("kidb", [], tb, ndates);
  const hn = NB.generate("kidz", mk("kidz", ins)).student;
  const rockPages = (hn.match(/<div class="page-label">Unit Study — Rock Hunt/g) || []).length;
  ok("a unit with days this week and no card prints one page: the list, then My page", rockPages === 1 && hn.indexOf("Unit Study — Rock Hunt (1/1)") > 0 && hn.indexOf("Rock day 1") > 0 && hn.lastIndexOf("✏️ My page") > hn.indexOf("Rock day 2"), rockPages);
  ok("…its page has no Your Journey, no cards line, no Challenge", (() => { const p = hn.slice(hn.indexOf("Unit Study — Rock Hunt (1/1)")); const e = p.indexOf('<div class="page-label">', 10); const pg = e > 0 ? p.slice(0, e) : p; return pg.indexOf("Your Journey") < 0 && pg.indexOf("Challenge") < 0 && pg.indexOf("learning right now") < 0; })());
  const hq = NB.generate("kidz", mk("kidz", [Object.assign({}, NOCARD, { week: ins[ins.length - 1].week, activities: [{ key: "a", title: "Queued thing", kind: "sheet" }] })])).student;
  ok("…a queued activity on a no-card unit keeps today's rule (no activity page)", hq.indexOf("Queued thing") < 0 && (hq.match(/Unit Study — Rock Hunt/g) || []).length === 1);
  ok("a no-card unit with no days this week still prints nothing", NB.generate("kidz", mk("kidz", [NOCARD])).student.indexOf("Rock Hunt") < 0);
  // the estimate: a full card list that fit on one page without the list may need two with it, never the other way
  const pagesOf = (units) => (NB.generate("kidz", mk("kidz", units)).student.match(/<div class="page-label">Unit Study — /g) || []).length;
  const long = n => Object.assign(CARDINS(n), { learning: CARDINS(n).learning.map(m => Object.assign({}, m, { bio: Array(9).join(BIO + " ").trim() })) });
  const flips = [1, 2, 3, 4, 5].map(n => [pagesOf([long(n)]), pagesOf([Object.assign(long(n), { week })])]);
  ok("with the list the page count only stays or grows to two (the block joins the estimate)", flips.every(([a, b]) => b >= a && b <= 2) && flips.some(([a, b]) => b === 2), flips);
  // two pages: the list sits on page 1 when it fits there, else on page 2, else as many rows as fit with "+ N more"
  const pageWith = (html, k) => { const i = html.indexOf('data-uw="1"'); if (i < 0) return 0; const lab = html.lastIndexOf('<div class="page-label">Unit Study — ', i); return +(/\((\d)\/\d\)/.exec(html.slice(lab, lab + 200)) || [])[1]; };
  const story = k => Object.assign(CARDINS(5), { learning: CARDINS(5).learning.map(m => Object.assign({}, m, { bio: Array(k + 1).join(BIO + " ").trim() })) });
  const many = n => Array.from({ length: n }, (_, i) => ({ name: "Learned card " + i }));
  const g = u => NB.generate("kidz", mk("kidz", [u])).student;
  const two1 = g(Object.assign(story(4), { learned: many(14), next: many(6), week }));
  ok("two pages, short stories: the list is on page 1, all five rows", /\(1\/2\)/.test(two1) && pageWith(two1) === 1 && (two1.match(/border-radius:3px;flex-shrink:0;margin-top:1px/g) || []).length === 5);
  const two2 = g(Object.assign(story(14), { learned: many(14), next: many(6), week }));
  ok("two pages, page 1 full of long stories: the list moves to the top of page 2, all five rows", pageWith(two2) === 2 && two2.indexOf('data-uw="1"') < two2.indexOf("Learned so far") && (two2.match(/border-radius:3px;flex-shrink:0;margin-top:1px/g) || []).length === 5);
  const two3 = g(Object.assign(story(8), { learned: many(40), next: many(6), extras: Array.from({ length: 8 }, (_, i) => ({ name: "Extra " + i, text: "W".repeat(90) })), week }));
  const n3 = (two3.match(/border-radius:3px;flex-shrink:0;margin-top:1px/g) || []).length;
  ok("both pages full: fewer rows (at least one), and + N more says how many are left", n3 >= 1 && n3 < 5 && two3.indexOf("+ " + (5 - n3) + " more this week") > 0, n3);
  const two4 = g(Object.assign(story(14), { learned: many(48), next: many(6), extras: Array.from({ length: 8 }, (_, i) => ({ name: "Extra " + i, text: "W".repeat(90) })), week }));
  ok("not even one row fits on either page: no list on that insert (never a clipped page), the rest as main prints it", two4.indexOf('data-uw="1"') < 0 &&
    two4 === g(Object.assign(story(14), { learned: many(48), next: many(6), extras: Array.from({ length: 8 }, (_, i) => ({ name: "Extra " + i, text: "W".repeat(90) })) })));
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
