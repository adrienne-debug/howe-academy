// 📕 UNITCOVER — the unit's cover page in the kids' notebook (PLAN_unit_sheet_2026-11-19.md §4.2, §5 row 3; her words 2026-11-22:
// "go with her answers and build" — pick 3: the cover prints by itself in the notebook of the week that holds the unit's first day).
// Runs the REAL index.html blocks (FAMBLOCK … UNITWEEK, as test_unit_week_page.js does, + UNITCOVER) and the REAL notebooks.js on a
// made-up family of two kids and a Builder-shaped unit (6 days, two activities on one day, a craft, a snack, a game, a PDF, 10 cards);
// no real names anywhere.
//  · the cover goes in the notebook of the week holding the unit's first day — this week, a parked next week, a first day switched
//    off; not the week after; not for a unit switched out of the notebooks; a deckless unit gets a bare insert;
//  · NO COVER = BYTE FOR BYTE: notebooks.js with its UNITCOVER block and "// UNITCOVER" lines stripped prints the same notebook from
//    every generator; with a cover, taking the cover page out gives that notebook back;
//  · the same week twice gives the same pages; 20 days at most (+ N more); no web address / supply / card text on it;
//  · 🖨 Print the cover (Mom only) prints the very same page, in the kid's own notebook colours; no database call anywhere.
// Page overflow (8.5×11in, clipped silently) is measured in headless Chrome — see the hand-over note; this file checks content.
//   run: node test_unit_cover.js
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
const i0 = src.indexOf("// UNITCOVER_START"), i1 = src.indexOf("// UNITCOVER_END");
ok("index.html: one UNITCOVER block, after USNB", i0 > 0 && i1 > i0 && src.indexOf("// UNITCOVER_START", i0 + 1) < 0 && src.indexOf("// USNB_END") < i0);
ok("index.html: one guarded hook in haNbContext, right after the week list (UNITWEEK)", (src.match(/units=ucAttach\(/g) || []).length === 1 &&
  /  try\{ if\(typeof uwAttach==="function"\) units=uwAttach\(kid,units,tasks,dates\); \}catch\(e\)\{\}[^\n]*\n  try\{ if\(typeof ucAttach==="function"\) units=ucAttach\(kid,units,tasks,dates\); \}catch\(e\)\{\}/.test(src));
ok("index.html: one button hook on the unit page (Mom's section)", (src.match(/h\+=ucCoverBtnHtml\(u,esc\)/g) || []).length === 1 && fnIn(src, "renderUnitDetail").indexOf("ucCoverBtnHtml(u,esc)") > 0);
const n0 = nbSrc.indexOf("  // UNITCOVER_START"), n1 = nbSrc.indexOf("  // UNITCOVER_END\n");
ok("notebooks.js: one UNITCOVER block, before unitInsertPages", n0 > 0 && n1 > n0 && nbSrc.indexOf("  // UNITCOVER_START", n0 + 1) < 0 && nbSrc.indexOf("function unitInsertPages(") > n1);
const hooks = nbSrc.split("\n").filter(l => /   \/\/ UNITCOVER$/.test(l));
ok("notebooks.js: two one-line hooks — the first line of unitInsertPages, and the export", hooks.length === 2 && /^    if \(ins && ins\.cover\) return ucCoverPages\(ins, weekNum, theme\);/.test(hooks[0]) &&
  fnIn(nbSrc, "unitInsertPages").split("\n")[1] === hooks[0] && /unitCoverPage: ucCoverPage, unitPageTheme: ucThemeOf, unitPrintDoc: ucPrintDoc,/.test(hooks[1]), hooks);
const blockTxt = src.slice(i0, i1) + nbSrc.slice(n0, n1);
const NAMES = /\b(adrienne|andrew|julian|lincoln|ellis|lucy|sara|sarah|caleb|taylor|makenzie|kenzie|dewalt|burris|melanie|howe)\b/i;
ok("no kid or family name in the new code", !NAMES.test(blockTxt.replace(/UNIT_INSERT_THEMES\.[a-z]+/g, "")), (blockTxt.match(NAMES) || [])[0]);
ok("no database call in either block (read-only)", !/\bdb\b|\.ref\(|\.set\(|\.update\(|\.remove\(|\.transaction\(|firebase/i.test(blockTxt));
ok("no new stored field: the index.html block writes only ins.cover", !/\b(u|d|t|day|it|unit)\.[a-zA-Z_]+\s*=[^=>]/.test(src.slice(i0, i1).replace(/ins\.cover=cv/g, "")));
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
    fnIn(src, "lidsFor"), fnIn(src, "haKidUnits"), fnIn(src, "_unitActs"), fnIn(src, "nbUnitDays"), cut(src, "// UNITWEEK_START", "// UNITWEEK_END"), fnIn(src, "_unitCharDeck"), fnIn(src, "_unitPortrait"), fnIn(src, "renderUnitDetail"), cut(src, "// UNITCOVER_START", "// UNITCOVER_END"),
    "Object.defineProperty(this,'famProgress',{get:()=>famProgress,set:v=>{famProgress=v;}});"].join("\n"), ctx);
  ctx.famProgress = o.prog || {};
  return { ctx, writes, BOARD, today };
}
// A week's cards for one kid: the family copies Mon–Fri (+ Read Aloud, which points at no unit) and the kid's own lessons.
const famCards = (kid, pre, days) => (days || WEEKDAYS).map(dn => ({ id: pre + "_" + kid + "_" + dn, who: kid, day: dn, time: "1:00 PM", title: "👪 Backyard Bugs", famBlock: "ft", famItem: "un" }))
  .concat((days || WEEKDAYS).map(dn => ({ id: pre + "_ra_" + kid + "_" + dn, who: kid, day: dn, time: "12:30 PM", title: "👪 Read Aloud", famBlock: "ft", famItem: "ra" })));
const kidCards = (pre, map) => Object.keys(map).map(dn => ({ id: pre + "_geo_" + dn, who: "kidb", day: dn, time: "10:00 AM", title: "🪨 Rocks", subjectKey: "geo", lid: map[dn] }));
const rowsOf = w => (w && w.rows) ? w.rows.map(r => r.dn + " " + r.label) : null;
// the made-up family's unit days as Today's card resolves them
const ndates = { monday: "November 16", tuesday: "November 17", wednesday: "November 18", thursday: "November 19", friday: "November 20" };
const nextDates = { monday: "November 23", tuesday: "November 24", wednesday: "November 25", thursday: "November 26", friday: "November 27" };
const insOf = (arr, id) => (arr || []).find(x => x && x.unitId === id);

console.log("── which week gets the cover ──");
{
  const { ctx, writes } = world({ now: "2026-11-16T07:00:00" });   // Monday: Bugs Day 1 is today (family time), Rocks Day 1 on kidb's Monday
  const ta = famCards("kida", "w");
  const insA = [{ unitId: "bugs", title: "Backyard Bugs", emoji: "🐞", learning: [{ name: "Bug 1", bio: "x" }], learned: [], next: [], extras: [], activities: [] }];
  const outA = ctx.ucAttach("kida", insA, ta, ndates);
  ok("family-time unit, the week holding Day 1: its insert carries the cover", outA === insA && !!insA[0].cover && insA[0].cover.title === "Backyard Bugs");
  ok("…and the shelf unit (laid nowhere) gets none, and nothing is added", outA.length === 1);
  const tb = famCards("kidb", "w").concat(kidCards("w", { monday: "k1", wednesday: "k2" }));
  const outB = ctx.ucAttach("kidb", [], tb, ndates);
  ok("a one-kid deckless unit (kidb's subject) with Day 1 this week: a bare insert carrying the cover", !!insOf(outB, "rocks") && !!insOf(outB, "rocks").cover && insOf(outB, "rocks").learning.length === 0 && !insOf(outB, "rocks").activities.length);
  ok("…and kidb's family-time unit too (no insert handed in → a bare one)", !!insOf(outB, "bugs") && !!insOf(outB, "bugs").cover);
  const tb2 = kidCards("w", { monday: "k2", tuesday: "k3" });
  ok("a week that holds Day 2 and 3 but not Day 1 → no cover", ctx.ucAttach("kidb", [], tb2, ndates).length === 0);
  ok("a week with no unit card → the very same array, untouched", (() => { const a = [{ unitId: "bugs", learning: [] }]; const j = J(a); const r = ctx.ucAttach("kida", a, WEEKDAYS.map((d, i) => ({ id: "r" + i, who: "kida", day: d, title: "Reading", time: "10:00 AM" })), ndates); return r === a && J(r) === j; })());
  ok("another kid's Day-1 card doesn't give this kid a cover", ctx.ucAttach("kida", [], kidCards("w", { monday: "k1" }), ndates).length === 0);
  // the first day switched off → the unit starts on Day 2
  const offRocks = ROCKS(); offRocks.track.days[0].off = true; const keepRocks = ctx.unitStudies.rocks; ctx.unitStudies.rocks = offRocks;   // a fresh track (utDays keeps a memo per track)
  ok("Day 1 switched off: the week holding Day 2 gets the cover", !!insOf(ctx.ucAttach("kidb", [], kidCards("x", { monday: "k2" }), ndates), "rocks"));
  ok("…and the off Day 1's card gives none", !insOf(ctx.ucAttach("kidb", [], kidCards("x", { monday: "k1" }), ndates), "rocks"));
  ok("…the off day is not on the cover's list", ctx.ucCoverOf("kidb", ctx.unitStudies.rocks).days[0].dn === "Day 2" && ctx.ucCoverOf("kidb", ctx.unitStudies.rocks).nDays === 6);
  ctx.unitStudies.rocks = keepRocks;
  // 📓 Include in notebooks off → no cover
  ctx.unitStudies.rocks.nbInsert = false;
  ok("a unit switched out of the notebooks (📓 off) gets no cover", !insOf(ctx.ucAttach("kidb", [], tb, ndates), "rocks"));
  delete ctx.unitStudies.rocks.nbInsert;
  // the same week twice → the same record
  const c1 = J(ctx.ucAttach("kidb", [], tb, ndates)), c2 = J(ctx.ucAttach("kidb", [], tb, ndates));
  ok("the same week twice → the same covers", c1 === c2);
  // haNbContext's order: the week list first (it may add a bare insert), then the cover — which finds that insert as its own
  const both = ctx.ucAttach("kidb", ctx.uwAttach("kidb", [], tb, ndates), tb, ndates);
  ok("after the week list: the cover goes on the week list's bare insert — one Rocks insert, list + cover", both.filter(x => x.unitId === "rocks").length === 1 && !!insOf(both, "rocks").cover && insOf(both, "rocks").week.rows.length === 2);
  ok("a deckless unit whose week list is off (no bare insert from it): the cover brings its own", (() => { const r = ctx.ucAttach("kidb", [], tb, ndates); return r.filter(x => x.unitId === "rocks").length === 1 && !insOf(r, "rocks").week; })());
  ok("nothing written, nothing read from the database", writes.length === 0, writes);
}

console.log("── a parked next week ──");
{
  const active = [].concat(famCards("kida", "w"), famCards("kidb", "w"));
  const checked = {}, hist = {};
  active.forEach(t => { if (t.famItem !== "un") return; checked[t.id] = true; const i = WEEKDAYS.indexOf(t.day); hist[t.id] = { famLabel: "Day " + (i + 1) + " — " + LINES[i] }; });
  const w1 = world({ now: "2026-11-21T10:00:00", active, checked, hist, prog: { ft: { un: { done: 5 } } } });
  const pa = famCards("kida", "n");
  ok("printed Saturday for next week (Day 6 there): no cover — Day 1 was this week", !insOf(w1.ctx.ucAttach("kida", [], pa, nextDates), "bugs"));
  ok("…where the active-week question alone would have named Day 1 (the reason the cover asks with the card's own date)", (w1.ctx.utDayForTask(pa[0]) || {}).id === "d1");
  const w0 = world({ now: "2026-11-14T10:00:00", prog: {} });   // the Saturday before the unit starts: next week holds Day 1
  const start = { monday: "November 16", tuesday: "November 17", wednesday: "November 18", thursday: "November 19", friday: "November 20" };
  ok("printed the Saturday before the unit starts, for its first week: the cover is there", !!insOf(w0.ctx.ucAttach("kida", [], famCards("kida", "n"), start), "bugs"));
  ok("one-kid unit, parked week holding Day 4–6: no cover", !insOf(w1.ctx.ucAttach("kidb", [], kidCards("n", { monday: "k4", tuesday: "k5" }), nextDates), "rocks"));
  ok("nothing written", w1.writes.length === 0 && w0.writes.length === 0);
}

console.log("── what the cover holds ──");
{
  const { ctx } = world({ now: "2026-11-16T07:00:00" });
  const cv = ctx.ucCoverOf("kida", ctx.unitStudies.bugs);
  ok("Bugs: 6 days in order, Day N + title", cv.nDays === 6 && J(cv.days) === J(LINES.map((t, i) => ({ dn: "Day " + (i + 1), t }))) && cv.more === 0);
  ok("Bugs counts: 1 book · 10 cards · 3 projects · 1 craft", J(cv.counts) === J({ books: 1, cards: 10, acts: 3, crafts: 1 }), cv.counts);
  ok("no photo on the first card → no picture (the emoji prints)", cv.pic === null && cv.emoji === "🐞");
  ctx.unitStudies.bugs.visuals = { "Bugs_Bug 1": { imageUrl: "https://img.example.org/bug1.jpg" } };
  ok("the first card's photo when it has one", J(ctx.ucCoverOf("kida", ctx.unitStudies.bugs).pic) === J({ img: "https://img.example.org/bug1.jpg" }));
  ctx.unitStudies.bugs.visuals = { "Bugs_Bug 1": "🐛" };
  ok("an emoji picture on the card → the unit's emoji (a photo or nothing)", ctx.ucCoverOf("kida", ctx.unitStudies.bugs).pic === null);
  delete ctx.unitStudies.bugs.visuals;
  const rk = ctx.ucCoverOf("kidb", ctx.unitStudies.rocks);
  ok("Rocks (no deck): 7 days, 7 books (each title once), 0 cards", rk.nDays === 7 && rk.counts.books === 7 && rk.counts.cards === 0);
  const twice = ROCKS(); twice.track.days[1].res = { books: [{ title: "ROCK BOOK 1" }] };
  ok("…the same book on two days counts once", ctx.ucCoverOf("kidb", twice).counts.books === 6);
  ctx.unitStudies.long = { id: "long", title: "A Very Long Unit", enrolled: { kida: true }, decks: [{ key: "L", cards: { a: { name: "One" }, b: { name: "Two" } } }],
    track: { mode: "seq", days: Array.from({ length: 25 }, (_, i) => ({ id: "l" + i, n: i + 1, t: "Long day " + (i + 1) + " " + "W".repeat(i === 3 ? 200 : 0) })) } };
  const lg = ctx.ucCoverOf("kida", ctx.unitStudies.long);
  ok("25 days → 20 on the cover, + 5 more, 25 in the count", lg.days.length === 20 && lg.more === 5 && lg.nDays === 25 && lg.days[19].dn === "Day 20");
  ok("cards stored as an object still count", lg.counts.cards === 2);
  ok("the record holds no web address, supply, order, note, rung, words, document or card text", (() => { const s = J(ctx.ucCoverOf("kida", ctx.unitStudies.bugs));
    return !["http", "PDFTITLE", "BUGSITELABEL", "magnifying", "MOMONLY", "CRAFTSUPPLY", "SNACKSUPPLY", "GAMESUPPLY", "ORDERNAME", "NOTESECRET", "RUNGSECRET", "WORDSSECRET", "DAYNOTESECRET", "DEFSECRET", "The Big Bug Book"].some(k => s.indexOf(k) >= 0); })());
}

console.log("── the notebooks: byte for byte with no cover ──");
const load = s => { const w = {}; (new Function("window", "document", s))(w, {}); return w.HoweNotebooks; };
const strip = s => { const a = s.indexOf("  // UNITCOVER_START"), b = s.indexOf("  // UNITCOVER_END\n"); s = s.slice(0, a) + s.slice(b + "  // UNITCOVER_END\n".length); return s.split("\n").filter(l => !/   \/\/ UNITCOVER$/.test(l)).join("\n"); };
const NB = load(nbSrc), NB0 = load(strip(nbSrc));
ok("the stripped file has no trace of UNITCOVER", !/ucCover|ucThemeOf|ucPrintDoc|UNITCOVER|unitCoverPage/.test(strip(nbSrc)));
const genKeys = (cut(nbSrc, "  var GENERATORS = {", "\n  };").match(/^    ([a-z]+): \{ label:/gm) || []).map(l => l.trim().split(":")[0]);
const pkThemes = ["dino", "shark", "construction"].filter(k => cut(nbSrc, "  var NB_THEMES = {", "\n  };").indexOf("    " + k + ":") >= 0);
const GENS = genKeys.map(k => [k, {}]).concat(pkThemes.map(t => ["kidp" + t, { notebookTheme: t, nbGrade: "Pre-K" }]), [["kidz", {}]]);
ok("found the custom generators and Pre-K looks to run", genKeys.length >= 4 && pkThemes.length >= 1, { genKeys, pkThemes });
const ntasks2 = kid => WEEKDAYS.map((d, i) => ({ id: kid + i, who: kid, day: d, title: "📖 Reading " + i, time: "10:00 AM", mom: "none" }));
const mk = (kid, units, extra) => Object.assign({ weekData: { dates: ndates, tasks: ntasks2(kid) }, weekNum: 12, extraPages: {}, prevSummary: {}, pace: [], units, nbKidName: "Student" }, extra || {});
const CARDINS = n => ({ unitId: "bugs", title: "Backyard Bugs", emoji: "🐞", learning: Array.from({ length: n }, (_, i) => ({ name: "Bug " + (i + 1), group: "insect", bio: "Bugs have six legs.", portrait: { emoji: "🐞" } })), learned: [{ name: "Bug 9" }], next: [{ name: "Bug 10" }], extras: [], activities: [] });
const NOCARD = { unitId: "rocks", title: "Rock Hunt", emoji: "🪨", learning: [], learned: [], next: [], extras: [], activities: [] };
GENS.forEach(([kid, ex]) => {
  [["no units", []], ["a unit with cards", [CARDINS(3)]], ["a unit with no cards", [NOCARD, CARDINS(5)]], ["an activity queued", [Object.assign(CARDINS(2), { activities: [{ key: "draw", title: "Draw a bug", kind: "sheet", steps: ["Draw"], points: 5 }] })]]].forEach(([lbl, units]) => {
    const a = NB.generate(kid, mk(kid, units, ex)), b = NB0.generate(kid, mk(kid, units, ex));
    ok(kid + ", " + lbl + ": student and parent notebooks identical to this tree without UNITCOVER", a.student === b.student && a.parent === b.parent && a.student.length > 1000);
  });
});

console.log("── the notebooks: with the cover ──");
{
  const { ctx } = world({ now: "2026-11-16T07:00:00" });
  const cv = ctx.ucCoverOf("kida", ctx.unitStudies.bugs);
  const COVER_LBL = '<div class="page-label">Unit Study — Backyard Bugs (cover)</div>';
  const sep = h => h.replace(/\s+(?=<div class="page-label">)/g, "\n");   // the generators join pages with different gaps
  const pageOf = (h, lbl) => { const i = h.indexOf(lbl); if (i < 0) return ""; const j = h.indexOf('<div class="page-label">', i + 10); return h.slice(i, j > 0 ? j : h.indexOf("</body>")).replace(/\s+$/, ""); };
  GENS.forEach(([kid, ex]) => {
    const withC = NB.generate(kid, mk(kid, [Object.assign(CARDINS(2), { cover: cv })], ex)).student, without = NB0.generate(kid, mk(kid, [CARDINS(2)], ex)).student;
    const pg = pageOf(withC, COVER_LBL);
    ok(kid + ": one cover page, right before the unit's first page", pg && withC.indexOf(COVER_LBL, withC.indexOf(COVER_LBL) + 1) < 0 && withC.indexOf("Unit Study — Backyard Bugs (1/") > withC.indexOf(COVER_LBL));
    ok(kid + ": take the cover page out and the notebook is the one without it, byte for byte", sep(withC.replace(pg, "")) === sep(without));
    ok(kid + ": the same week twice → the same notebook", withC === NB.generate(kid, mk(kid, [Object.assign(CARDINS(2), { cover: cv })], ex)).student);
    // the Units-tab print: the very same page, in this kid's colours
    const look = { notebookTheme: ex.notebookTheme || null, nbLevel: {} };
    ok(kid + ": 🖨 Print the cover draws the same page the notebook prints (same colours)", NB.unitCoverPage(cv, NB.unitPageTheme(kid, look)).replace(/\s+$/, "") === pg);
  });
  const h = NB.unitCoverPage(cv, NB.unitPageTheme("kidz"));
  ok("the cover: title, A unit study · 6 days, belongs-to, started / finished, In this unit, counts, the what-I-know box",
    ["Backyard Bugs", "A unit study · 6 days", "This book belongs to", "Started", "Finished", "In this unit", "📚 1 book · 🃏 10 cards · 🎨 3 projects · ✂️ 1 craft", "Before we start — draw or write what you already know"].every(s => h.indexOf(s) > 0));
  ok("six ☐ rows, Day 1 … Day 6 with their titles", (h.match(/border-radius:3px;flex-shrink:0;box-sizing:border-box/g) || []).length === 6 && LINES.every((t, i) => h.indexOf(">Day " + (i + 1) + "<") > 0 && h.indexOf(">" + t + "<") > 0));
  ok("no picture → the unit's emoji, big", h.indexOf(">🐞</div>") > 0 && h.indexOf("<img") < 0);
  const hp = NB.unitCoverPage(Object.assign({}, cv, { pic: { img: "https://img.example.org/bug1.jpg" } }), NB.unitPageTheme("kidz"));
  ok("a photo → one picture, under 2.5in (240px wide, 190px tall at most)", (hp.match(/<img /g) || []).length === 1 && /max-width:240px;max-height:190px/.test(hp));
  ok("outline style: no solid dark band (no dark background anywhere on the page)", !/background:#(1e293b|1a3a2a|142038|2d1b69|7c2d12|27272a|0c4a6e)/.test(h));
  ok("nothing the child must write is printed — the blanks are empty lines", !/answer|definition/i.test(h));
  const lg = ctx.ucCoverOf("kida", Object.assign({}, ctx.unitStudies.bugs, { track: { mode: "seq", days: Array.from({ length: 25 }, (_, i) => ({ id: "l" + i, n: i + 1, t: "Long day " + (i + 1) })) } }));
  const hl = NB.unitCoverPage(lg, NB.unitPageTheme("kidz"));
  ok("25 days: 20 rows, + 5 more days, 25 days in the subtitle", (hl.match(/border-radius:3px;flex-shrink:0;box-sizing:border-box/g) || []).length === 20 && hl.indexOf("+ 5 more days") > 0 && hl.indexOf("A unit study · 25 days") > 0);
  ok("notebooks.js caps at 20 even if handed more", (NB.unitCoverPage(Object.assign({}, lg, { days: lg.days.concat(lg.days), more: 0 }), null).match(/border-radius:3px;flex-shrink:0;box-sizing:border-box/g) || []).length === 20);
  const nod = NB.unitCoverPage(Object.assign({}, cv, { days: [], nDays: 0, counts: {} }), null);
  ok("a unit with no days: no In this unit box, no counts line, 'A unit study'", nod.indexOf("In this unit") < 0 && nod.indexOf("📚") < 0 && nod.indexOf("A unit study<") > 0);
  const he = NB.unitCoverPage({ title: '<b>"x"</b> & y', days: [{ dn: "Day 1", t: "<i>z</i>" }], counts: {} }, null);
  ok("titles are escaped", he.indexOf("<b>") < 0 && he.indexOf("<i>z") < 0 && he.indexOf("&lt;b>&quot;x&quot;&lt;/b> &amp; y") > 0);
  ok("every day row is one line (nowrap + ellipsis)", /flex:1;min-width:0;font-size:1[12]px;color:#1c1c1e;white-space:nowrap;overflow:hidden;text-overflow:ellipsis/.test(h));
}

console.log("── the theme a print uses = the kid's notebook theme ──");
{
  const COVER = { title: "T", emoji: "🐞", days: [{ dn: "Day 1", t: "a" }], nDays: 1, counts: {} };
  GENS.concat([["kidq", { notebookTheme: "shark", nbGrade: "K" }]]).forEach(([kid, ex]) => {
    const h = NB.generate(kid, mk(kid, [Object.assign(CARDINS(1), { cover: COVER })], ex)).student;
    const i = h.indexOf("(cover)</div>"), pg = h.slice(h.lastIndexOf('<div class="page-label">', i), h.indexOf('<div class="page-label">', i + 5));
    ok(kid + (ex.notebookTheme ? " (" + ex.notebookTheme + ")" : "") + ": unitPageTheme gives the notebook's own unit colours", pg.replace(/\s+$/, "") === NB.unitCoverPage(COVER, NB.unitPageTheme(kid, { notebookTheme: ex.notebookTheme || null, nbLevel: {} })).replace(/\s+$/, ""));
  });
}

console.log("── Mom's 🖨 Print the cover (Units tab) ──");
{
  const { ctx, writes } = world({ now: "2026-11-16T07:00:00" });
  ctx.window.HoweNotebooks = NB; ctx.utsRoster = () => KIDS.slice(); ctx.nbThemeOf = () => null; ctx.nbLevelOf = () => ({});
  const doc = ctx.ucCoverDoc(ctx.unitStudies.bugs);
  ok("one cover page per enrolled kid, in a printable document", (doc.match(/\(cover\)<\/div>/g) || []).length === 2 && /^<!DOCTYPE html>/.test(doc) && doc.indexOf("ha-safari-print") > 0);
  ok("…each the page the notebook would print", doc.indexOf(NB.unitCoverPage(ctx.ucCoverOf("kida", ctx.unitStudies.bugs), NB.unitPageTheme("kida", {}))) > 0);
  ctx.unitStudies.shelf.enrolled = {};
  ok("nobody enrolled → one cover in the starter colours", (ctx.ucCoverDoc(ctx.unitStudies.shelf).match(/\(cover\)<\/div>/g) || []).length === 1 && ctx.ucCoverDoc(ctx.unitStudies.shelf).indexOf("#0f766e") > 0);
  ok("a unit with no days still prints its cover (the button is how)", ctx.ucCoverDoc(Object.assign({}, ctx.unitStudies.shelf, { track: null })).indexOf("(cover)") > 0);
  ok("the button shows for Mom", ctx.ucCoverBtnHtml(ctx.unitStudies.bugs, ctx.esc).indexOf("ucPrintCover(") > 0 && ctx.ucCoverBtnHtml(ctx.unitStudies.bugs, ctx.esc).indexOf("🖨 Print the cover") > 0);
  ctx.momHere = () => false;
  ok("…and not for a kid", ctx.ucCoverBtnHtml(ctx.unitStudies.bugs, ctx.esc) === "");
  let opened = 0; ctx.window.open = () => { opened++; return null; }; ctx.alert = () => {};
  ctx.ucPrintCover("bugs");
  ok("…a kid's tap prints nothing", opened === 0);
  globalThis.__app = { ctx, writes };
}

console.log("── 🖨 Print the cover when notebooks.js isn't loaded yet (it loads lazily) ──");
const fakeWin = () => { const w = { opens: 0, closed: false, buf: "", docs: [], document: { open() { w.opens++; w.buf = ""; }, write(s) { w.buf += s; }, close() { w.docs.push(w.buf); } }, close() { w.closed = true; } }; return w; };
const tick = () => new Promise(r => setImmediate(r));
(async () => {
  const { ctx, writes } = globalThis.__app;
  ctx.momHere = () => true;
  let opened = 0, alerts = [], w = null;
  ctx.window.open = () => { opened++; w = fakeWin(); return w; };
  vm.runInContext("window.open=this.window.open; var open=window.open;", ctx); ctx.alert = m => alerts.push(m);
  ctx.window.HoweNotebooks = NB;
  ctx.ucPrintCover("bugs");
  const loadedDoc = w.docs[w.docs.length - 1];
  ok("library loaded: Mom's tap opens the print window with the covers and a print call", opened === 1 && w.docs.length === 1 && loadedDoc.indexOf("(cover)") > 0 && loadedDoc.indexOf("window.print()") > 0 && !alerts.length);
  ctx.window.HoweNotebooks = null; let calls = 0, release = null;
  ctx.haLoadNotebooksLib = () => { calls++; return new Promise(r => { release = () => { ctx.window.HoweNotebooks = NB; r(NB); }; }); };
  ctx.ucPrintCover("bugs");
  const w2 = w;
  ok("not loaded: the window opens in the tap, before the load finishes, saying it's getting ready", opened === 2 && w2.docs.length === 0 && w2.buf.indexOf("Getting the page ready") > 0);
  ok("…the loader is asked exactly once", calls === 1);
  release(); await tick(); await tick();
  ok("…once it loads, the same document as with the library already there", w2.docs.length === 1 && w2.docs[0] === loadedDoc && !w2.closed && !alerts.length);
  ctx.window.HoweNotebooks = null; ctx.haLoadNotebooksLib = () => Promise.reject(new Error("offline"));
  let threw = false; try { ctx.ucPrintCover("bugs"); } catch (e) { threw = true; }
  const w3 = w; await tick(); await tick();
  ok("a failed load: the window is closed, one plain message, nothing thrown", !threw && w3.closed && w3.docs.length === 0 && alerts.length === 1 && /Couldn’t load the notebook pages/.test(alerts[0]), alerts);
  ctx.momHere = () => false; const before = opened; let c2 = 0; ctx.haLoadNotebooksLib = () => { c2++; return Promise.resolve(NB); };
  ctx.ucPrintCover("bugs");
  ok("a kid's tap: no window, no load", opened === before && c2 === 0);
  ok("no database write anywhere in the print path", writes.length === 0, writes);
  console.log("\n" + pass + " passed, " + fail + " failed");
  process.exit(fail ? 1 : 0);
})();
