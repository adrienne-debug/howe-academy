// 📗 UNITKEEP — the unit book's two closing pages + Mom's "🖨 Print <kid>'s unit book" (PLAN_unit_sheet_2026-11-19.md §4.4 re-shaped by
// §8.2 "Closing pages (slice 5)", §5 row 5; her words 2026-11-22: "build as many in as many sessions you need to get done. go with her
// answers and build"). Runs the REAL index.html blocks (the cover test's world + UNITGATHER + UNITKEEP) and the REAL notebooks.js on a
// made-up family of two kids and a Builder-shaped unit (6 days, two activities on one day, a craft, a snack, a game, a PDF, 10 cards);
// no real names anywhere.
//  · the closing pages go in the notebook of the week holding the unit's LAST day that is on — a parked next week, a one-kid unit, a
//    last day switched off; not an earlier week; not a unit switched out of the notebooks; a unit with no insert gets a bare one;
//  · what they hold: books and activities as unitGather reads them, done dates from activityLog, caps 10 books · 12 activities ·
//    12 cards (cards only when Mom's "Words and facts I know" tick is on), and never a card's definition;
//  · NO CLOSING PAGES = BYTE FOR BYTE: notebooks.js with its UNITKEEP block and "// UNITKEEP" lines stripped prints the same notebook
//    from every generator; with them, taking the two pages out gives that notebook back;
//  · 🖨 Print <kid>'s unit book (Mom only): cover + the same two pages, the kid's colours, through ucPrintWin (loads notebooks.js);
//    a unit with no days prints from the button; the words tick is ONE targeted write, Mom only, live only.
// Page overflow (8.5×11in, clipped silently) is measured in headless Chrome — see the hand-over note; this file checks content.
//   run: node test_unit_keepsake.js
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
const i0 = src.indexOf("// UNITKEEP_START"), i1 = src.indexOf("// UNITKEEP_END");
ok("index.html: one UNITKEEP block, right after UNITCOVER", i0 > 0 && i1 > i0 && src.indexOf("// UNITKEEP_START", i0 + 1) < 0 && src.indexOf("// UNITCOVER_END\n") === i0 - "// UNITCOVER_END\n".length);
ok("index.html: one guarded hook in haNbContext, right after the cover's (UNITCOVER)", (src.match(/units=ukAttach\(/g) || []).length === 1 &&
  /  try\{ if\(typeof ucAttach==="function"\) units=ucAttach\(kid,units,tasks,dates\); \}catch\(e\)\{\}[^\n]*\n  try\{ if\(typeof ukAttach==="function"\) units=ukAttach\(kid,units,tasks,dates\); \}catch\(e\)\{\}/.test(src));
ok("index.html: one button hook on the unit page, right after the cover's button", (src.match(/h\+=ukBookHtml\(u,esc\)/g) || []).length === 1 &&
  /h\+=ucCoverBtnHtml\(u,esc\);[^\n]*\n    if\(typeof ukBookHtml==="function"\) h\+=ukBookHtml\(u,esc\);/.test(fnIn(src, "renderUnitDetail")));
const n0 = nbSrc.indexOf("  // UNITKEEP_START"), n1 = nbSrc.indexOf("  // UNITKEEP_END\n");
ok("notebooks.js: one UNITKEEP block, before unitInsertPages", n0 > 0 && n1 > n0 && nbSrc.indexOf("  // UNITKEEP_START", n0 + 1) < 0 && nbSrc.indexOf("function unitInsertPages(") > n1);
const hooks = nbSrc.split("\n").filter(l => /   \/\/ UNITKEEP$/.test(l));
ok("notebooks.js: two one-line hooks — the line after the cover's in unitInsertPages, and the export", hooks.length === 2 &&
  /^    if \(ins && ins\.keep\) return ukKeepPages\(ins, weekNum, theme\);/.test(hooks[0]) && fnIn(nbSrc, "unitInsertPages").split("\n")[2] === hooks[0] &&
  /^    unitClosingPages: ukClosingPages,/.test(hooks[1]), hooks);
const blockTxt = src.slice(i0, i1) + nbSrc.slice(n0, n1);
const NAMES = /\b(adrienne|andrew|julian|lincoln|ellis|lucy|sara|sarah|caleb|taylor|makenzie|kenzie|dewalt|burris|melanie|howe)\b/i;
ok("no kid or family name in the new code", !NAMES.test(blockTxt.replace(/UNIT_INSERT_THEMES\.[a-z]+/g, "")), (blockTxt.match(NAMES) || [])[0]);
ok("notebooks.js block: no database call", !/\bdb\b|\.ref\(|\.set\(|\.update\(|\.remove\(|\.transaction\(|firebase/i.test(nbSrc.slice(n0, n1)));
const ixDb = src.slice(i0, i1).split("\n").filter(l => !/^\/\//.test(l) && /\bdb\b|\.ref\(|\.set\(|\.update\(|\.remove\(|\.transaction\(|firebase/i.test(l));
ok("index.html block: the only database call is the one targeted set of unitStudies/<id>/keepWords, behind db && !_dryRun()",
  ixDb.length === 2 && /const live=\(typeof db!=="undefined"&&!!db&&!_dryRun\(\)\);/.test(ixDb[0]) && /^  if\(live\) db\.ref\("unitStudies\/"\+unitId\+"\/keepWords"\)\.set\(next\?true:null\);/.test(ixDb[1]), ixDb);
ok("the only field the block stores on a unit is keepWords (and only inside ukToggleWords)", (() => { const b = src.slice(i0, i1).replace(fnIn(src, "ukToggleWords"), "");
  return !/\b(u|d|t|day|it|unit)\.[a-zA-Z_]+\s*=[^=>]/.test(b.replace(/ins\.keep=kp/g, "")) && /if\(next\) u\.keepWords=true; else delete u\.keepWords;/.test(fnIn(src, "ukToggleWords")); })());
ok("no 🔀 emoji", blockTxt.indexOf("\u{1F500}") < 0);
const testTxt = fs.readFileSync(__filename, "utf8").split("\n").filter(l => !/^const NAMES =/.test(l)).join("\n");
ok("this test file names no real kid or family", !NAMES.test(testTxt.replace(/UNIT_INSERT_THEMES\.[a-z]+/g, "")), (testTxt.match(NAMES) || [])[0]);

// ── the world: the cover test's made-up family (the real family-time + unit blocks, a faked clock) + UNITGATHER + UNITKEEP ──
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
    masteryData: JSON.parse(JSON.stringify(o.mastery || {})), ROSTER_DEF: [{ id: "kida", grade: "K" }, { id: "kidb", grade: "4" }], mastTierAtLeast: () => false, weekData: { tasks: o.active || [] }, checked: o.checked || {}, claimed: {}, histState: o.hist || {}, archive: {}, blockouts: {},
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
    cut(src, "// UNITGATHER_START", "// UNITGATHER_END"), fnIn(src, "haBuildUnitInsight"), fnIn(src, "_nbActKeys"), fnIn(src, "unitActPoints"), fnIn(src, "uapSpec"), fnIn(src, "dcLevel"), cut(src, "// UNITKEEP_START", "// UNITKEEP_END"),
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

const NOV17 = new Date(2026, 10, 17, 10, 30).getTime(), NOV19 = new Date(2026, 10, 19, 15, 0).getTime();
const learnedItems = (deck, names) => names.map(n => ({ subject: deck, prompt: n, status: "review", tier: "weekly" }));

console.log("── which week gets the closing pages ──");
{
  const { ctx, writes } = world({ now: "2026-11-16T07:00:00" });   // Monday of the week holding Bugs Day 1–5
  ok("the week holding Day 1–5 (not Day 6): no closing pages", ctx.ukAttach("kida", [], famCards("kida", "w"), ndates).length === 0);
  const tb = kidCards("w", { monday: "k6", tuesday: "k7" });
  const outB = ctx.ukAttach("kidb", [], tb, ndates);
  ok("a one-kid deckless unit (kidb's subject) whose last day is this week: a bare insert carrying the closing pages", !!insOf(outB, "rocks") && !!insOf(outB, "rocks").keep && insOf(outB, "rocks").learning.length === 0 && !insOf(outB, "rocks").activities.length);
  ok("…a week holding Day 5–6 but not Day 7 → none", !insOf(ctx.ukAttach("kidb", [], kidCards("w", { monday: "k5", tuesday: "k6" }), ndates), "rocks"));
  ok("…another kid's last-day card gives this kid none", ctx.ukAttach("kida", [], tb, ndates).length === 0);
  const insB = [{ unitId: "rocks", title: "Rock Hunt", emoji: "🪨", learning: [], learned: [], next: [], extras: [], activities: [] }];
  const r = ctx.ukAttach("kidb", insB, tb, ndates);
  ok("an insert handed in carries it (no second insert)", r === insB && !!insB[0].keep && insB[0].keep.title === "Rock Hunt");
  ok("a week with no unit card → the very same array, untouched", (() => { const a = [{ unitId: "bugs", learning: [] }]; const j = J(a); const x = ctx.ukAttach("kida", a, WEEKDAYS.map((d, i) => ({ id: "r" + i, who: "kida", day: d, title: "Reading", time: "10:00 AM" })), ndates); return x === a && J(x) === j; })());
  // the last day switched off → the unit ends on Day 6
  const offRocks = ROCKS(); offRocks.track.days[6].off = true; const keepRocks = ctx.unitStudies.rocks; ctx.unitStudies.rocks = offRocks;
  ok("Day 7 switched off: the week holding Day 6 gets the closing pages", !!insOf(ctx.ukAttach("kidb", [], kidCards("x", { monday: "k6" }), ndates), "rocks"));
  ok("…and the off Day 7's card gives none", !insOf(ctx.ukAttach("kidb", [], kidCards("x", { monday: "k7" }), ndates), "rocks"));
  ctx.unitStudies.rocks = keepRocks;
  ctx.unitStudies.rocks.nbInsert = false;
  ok("a unit switched out of the notebooks (📓 off) gets none", !insOf(ctx.ukAttach("kidb", [], tb, ndates), "rocks"));
  delete ctx.unitStudies.rocks.nbInsert;
  ok("the same week twice → the same record", J(ctx.ukAttach("kidb", [], tb, ndates)) === J(ctx.ukAttach("kidb", [], tb, ndates)));
  // haNbContext's order: the week list, the cover, then the closing pages — one insert for the unit
  const all = ctx.ukAttach("kidb", ctx.ucAttach("kidb", ctx.uwAttach("kidb", [], tb, ndates), tb, ndates), tb, ndates);
  ok("after the week list and the cover: one Rocks insert, list + closing pages, no cover (Day 1 was weeks ago)", all.filter(x => x.unitId === "rocks").length === 1 && !!insOf(all, "rocks").keep && !insOf(all, "rocks").cover && !!insOf(all, "rocks").week);
  // a one-day unit: its first day is its last — cover and closing pages in the same week, on the same insert
  ctx.unitStudies.rocks = Object.assign(ROCKS(), { track: { mode: "seq", days: [{ id: "r1", n: 1, t: "Rock day 1", res: { books: [{ title: "Rock book 1" }] } }] } });
  const t1 = kidCards("y", { monday: "k1" }), one = ctx.ukAttach("kidb", ctx.ucAttach("kidb", [], t1, ndates), t1, ndates);
  ok("a one-day unit: cover and closing pages on one insert", one.filter(x => x.unitId === "rocks").length === 1 && !!insOf(one, "rocks").cover && !!insOf(one, "rocks").keep);
  ctx.unitStudies.rocks = keepRocks;
  ok("nothing written, nothing read from the database", writes.length === 0, writes);
}

console.log("── a parked next week ──");
{
  const active = [].concat(famCards("kida", "w"), famCards("kidb", "w"));
  const checked = {}, hist = {};
  active.forEach(t => { if (t.famItem !== "un") return; checked[t.id] = true; const i = WEEKDAYS.indexOf(t.day); hist[t.id] = { famLabel: "Day " + (i + 1) + " — " + LINES[i] }; });
  const w1 = world({ now: "2026-11-21T10:00:00", active, checked, hist, prog: { ft: { un: { done: 5 } } } });
  const pa = famCards("kida", "n");
  ok("printed Saturday for next week (Day 6 there): the family-time unit's closing pages are there", !!insOf(w1.ctx.ukAttach("kida", [], pa, nextDates), "bugs"));
  ok("…for the other kid too, in a bare insert of their own", !!insOf(w1.ctx.ukAttach("kidb", [], famCards("kidb", "n"), nextDates), "bugs"));
  const w0 = world({ now: "2026-11-14T10:00:00", prog: {} });
  ok("printed the Saturday before the unit starts (Day 1–5 next week): none", !insOf(w0.ctx.ukAttach("kida", [], famCards("kida", "n"), ndates), "bugs"));
  ok("nothing written", w1.writes.length === 0 && w0.writes.length === 0);
}

console.log("── what the closing pages hold ──");
{
  const { ctx } = world({ now: "2026-11-16T07:00:00", mastery: { kida: learnedItems("Bugs", ["Bug 2", "Bug 5"]) } });
  ctx.unitStudies.bugs.activityLog = { kida: { draw: { ts: NOV17, points: 5 }, later: { ts: NOV19, points: 0 } } };
  const ka = ctx.ukKeepOf("kida", ctx.unitStudies.bugs), kb = ctx.ukKeepOf("kidb", ctx.unitStudies.bugs);
  ok("Bugs: title, emoji, the one book (title + by)", ka.title === "Backyard Bugs" && ka.emoji === "🐞" && J(ka.books) === J([{ t: "The Big Bug Book", by: "A. Writer" }]) && ka.booksMore === 0);
  ok("the three activities in day order, the one no day names last", J(ka.acts.map(a => a.t)) === J(["Draw a bug", "Label the parts", "Not this week"]), ka.acts);
  ok("done dates from activityLog: ✓ Nov 17, ☐, ✓ Nov 19", J(ka.acts.map(a => [a.done, a.date])) === J([[true, "Nov 17"], [false, ""], [true, "Nov 19"]]), ka.acts);
  ok("the other kid's log is their own: nothing done", kb.acts.every(a => !a.done && !a.date));
  ok("a log entry with no time → ✓ with no date", (() => { ctx.unitStudies.bugs.activityLog.kida.label = { points: 0 }; const x = ctx.ukKeepOf("kida", ctx.unitStudies.bugs).acts[1]; delete ctx.unitStudies.bugs.activityLog.kida.label; return x.done === true && x.date === ""; })());
  ok("the grade band: K → little, grade 4 → middle", ka.band === "little" && kb.band === "middle");
  ok("words and facts OFF by default (the field absent): no words, even with cards learned", ka.words.length === 0 && !("keepWords" in ctx.unitStudies.bugs));
  ctx.unitStudies.bugs.keepWords = true;
  const kw = ctx.ukKeepOf("kida", ctx.unitStudies.bugs);
  ok("words ON: the kid's learned cards, picture + name only", J(kw.words.map(w => w.name)) === J(["Bug 2", "Bug 5"]) && kw.words.every(w => J(Object.keys(w)) === J(["name", "portrait"])));
  ok("…a kid who has learned none gets no words (both photo boxes stay)", ctx.ukKeepOf("kidb", ctx.unitStudies.bugs).words.length === 0);
  ok("…a word's picture is the card's photo when it has one", (() => { ctx.unitStudies.bugs.visuals = { "Bugs_Bug 2": { imageUrl: "https://img.example.org/b2.jpg" } }; const w = ctx.ukKeepOf("kida", ctx.unitStudies.bugs).words[0]; delete ctx.unitStudies.bugs.visuals; return J(w.portrait) === J({ img: "https://img.example.org/b2.jpg" }); })());
  ok("no card definition, bio or info text anywhere in the record (words on)", J(kw).indexOf("DEFSECRET") < 0);
  ok("the record holds no web address, supply, order, note, rung, words text or document", (() => { const s = J(kw).replace("https://img.example.org", "");
    return !["http", "PDFTITLE", "BUGSITELABEL", "magnifying", "MOMONLY", "CRAFTSUPPLY", "SNACKSUPPLY", "GAMESUPPLY", "ORDERNAME", "NOTESECRET", "RUNGSECRET", "WORDSSECRET", "DAYNOTESECRET"].some(k => s.indexOf(k) >= 0); })());
  ctx.unitStudies.bugs.keepWords = "yes";
  ok("only keepWords === true turns the words on", ctx.ukKeepOf("kida", ctx.unitStudies.bugs).words.length === 0);
  delete ctx.unitStudies.bugs.keepWords;
  // caps: 14 books, 15 activities, 15 learned cards
  const BIG = { id: "big", title: "Big Unit", emoji: "🧺", enrolled: { kidb: true },
    decks: [{ key: "Big", cards: Array.from({ length: 15 }, (_, i) => ({ name: "Card " + (i + 1), def: "DEFSECRET" + i, order: i + 1 })) }],
    activities: Array.from({ length: 15 }, (_, i) => ({ key: "a" + i, title: "Project " + (i + 1), day: (i % 5) + 1 })),
    track: { mode: "seq", days: Array.from({ length: 14 }, (_, i) => ({ id: "g" + i, n: i + 1, t: "Big day " + (i + 1), res: { books: [{ title: "Book " + (i + 1) }, { title: "BOOK 1" }] } })) }, keepWords: true };
  ctx.masteryData.kidb = learnedItems("Big", Array.from({ length: 15 }, (_, i) => "Card " + (i + 1)));
  const kg = ctx.ukKeepOf("kidb", BIG);
  ok("caps: 10 books (+ 4 more), each title once", kg.books.length === 10 && kg.booksMore === 4);
  ok("caps: 12 activities (+ 3 more)", kg.acts.length === 12 && kg.actsMore === 3);
  ok("caps: 12 cards (+ 3 more), with the words on", kg.words.length === 12 && kg.wordsMore === 3);
  // an off day's book and activity stay out
  const OFF = Object.assign(BUGS(), { id: "off" }); OFF.track.days[1].off = true;
  ok("an off day's activities are left out (the day-2 pair)", J(ctx.ukKeepOf("kida", OFF).acts.map(a => a.t)) === J(["Not this week"]));
  // a unit with no days: still a record (its activities, no books)
  const ND = Object.assign(BUGS(), { id: "nd", track: null });
  const kn = ctx.ukKeepOf("kida", ND);
  ok("a unit with no days: a record with every activity, no books", !!kn && kn.books.length === 0 && kn.acts.length === 3);
  ok("no kid (nobody enrolled): no marks, no words, the middle band", (() => { const x = ctx.ukKeepOf(null, Object.assign({}, ctx.unitStudies.bugs, { keepWords: true })); return x.acts.every(a => !a.done) && x.words.length === 0 && x.band === "middle"; })());
}

console.log("── the notebooks: byte for byte with no closing pages ──");
const load = s => { const w = {}; (new Function("window", "document", s))(w, {}); return w.HoweNotebooks; };
const strip = s => { const a = s.indexOf("  // UNITKEEP_START"), b = s.indexOf("  // UNITKEEP_END\n"); s = s.slice(0, a) + s.slice(b + "  // UNITKEEP_END\n".length); return s.split("\n").filter(l => !/   \/\/ UNITKEEP$/.test(l)).join("\n"); };
const NB = load(nbSrc), NB0 = load(strip(nbSrc));
ok("the stripped file has no trace of UNITKEEP", !/ukKeep|ukClosing|UNITKEEP|unitClosingPages|UK_BOOKS/.test(strip(nbSrc)));
const genKeys = (cut(nbSrc, "  var GENERATORS = {", "\n  };").match(/^    ([a-z]+): \{ label:/gm) || []).map(l => l.trim().split(":")[0]);
const pkThemes = ["dino", "shark", "construction"].filter(k => cut(nbSrc, "  var NB_THEMES = {", "\n  };").indexOf("    " + k + ":") >= 0);
const GENS = genKeys.map(k => [k, {}]).concat(pkThemes.map(t => ["kidp" + t, { notebookTheme: t, nbGrade: "Pre-K" }]), [["kidz", {}]]);
ok("found the custom generators and Pre-K looks to run", genKeys.length >= 4 && pkThemes.length >= 1, { genKeys, pkThemes });
const ntasks2 = kid => WEEKDAYS.map((d, i) => ({ id: kid + i, who: kid, day: d, title: "📖 Reading " + i, time: "10:00 AM", mom: "none" }));
const mk = (kid, units, extra) => Object.assign({ weekData: { dates: ndates, tasks: ntasks2(kid) }, weekNum: 12, extraPages: {}, prevSummary: {}, pace: [], units, nbKidName: "Student" }, extra || {});
const CARDINS = n => ({ unitId: "bugs", title: "Backyard Bugs", emoji: "🐞", learning: Array.from({ length: n }, (_, i) => ({ name: "Bug " + (i + 1), group: "insect", bio: "Bugs have six legs.", portrait: { emoji: "🐞" } })), learned: [{ name: "Bug 9" }], next: [{ name: "Bug 10" }], extras: [], activities: [] });
const NOCARD = { unitId: "rocks", title: "Rock Hunt", emoji: "🪨", learning: [], learned: [], next: [], extras: [], activities: [] };
GENS.forEach(([kid, ex]) => {
  [["no units", []], ["a unit with cards", [CARDINS(3)]], ["a unit with no cards", [NOCARD, CARDINS(5)]], ["an activity queued", [Object.assign(CARDINS(2), { activities: [{ key: "draw", title: "Draw a bug", kind: "sheet", steps: ["Draw"], points: 5 }] })]],
    ["a cover", [Object.assign(CARDINS(2), { cover: { title: "Backyard Bugs", emoji: "🐞", days: [{ dn: "Day 1", t: "a" }], nDays: 1, counts: {} } })]]].forEach(([lbl, units]) => {
    const a = NB.generate(kid, mk(kid, units, ex)), b = NB0.generate(kid, mk(kid, units, ex));
    ok(kid + ", " + lbl + ": student and parent notebooks identical to this tree without UNITKEEP", a.student === b.student && a.parent === b.parent && a.student.length > 1000);
  });
});

console.log("── the notebooks: with the closing pages ──");
const KP = { title: "Backyard Bugs", emoji: "🐞", band: "middle", books: [{ t: "The Big Bug Book", by: "A. Writer" }], booksMore: 0,
  acts: [{ e: "🖍", t: "Draw a bug", done: true, date: "Nov 17" }, { e: "", t: "Label the parts", done: false, date: "" }], actsMore: 0, words: [], wordsMore: 0 };
const sep = h => h.replace(/>\s+</g, ">\n<");   // the generators join pages with different gaps (whitespace between tags only)
// a page = its label + its <div class="page"> up to the matching </div> (some generators' next page has no label)
const pageOf = (h, lbl) => { const i = h.indexOf(lbl); if (i < 0) return ""; const k = h.indexOf('<div class="page">', i); let d = 0, j = k;
  const re = /<div\b|<\/div>/g; re.lastIndex = k; let m; while ((m = re.exec(h))) { d += m[0] === "</div>" ? -1 : 1; if (!d) { j = m.index + 6; break; } } return h.slice(i, j); };
const L1 = '<div class="page-label">Unit Study — Backyard Bugs (closing 1/2)</div>', L2 = '<div class="page-label">Unit Study — Backyard Bugs (closing 2/2)</div>';
GENS.forEach(([kid, ex]) => {
  const units = () => [Object.assign(CARDINS(2), { activities: [{ key: "draw", title: "Draw a bug", kind: "sheet", steps: ["Draw"], points: 5 }], keep: KP })];
  const withK = NB.generate(kid, mk(kid, units(), ex)).student, without = NB0.generate(kid, mk(kid, [Object.assign(CARDINS(2), { activities: [{ key: "draw", title: "Draw a bug", kind: "sheet", steps: ["Draw"], points: 5 }] })], ex)).student;
  const p1 = pageOf(withK, L1), p2 = pageOf(withK, L2);
  ok(kid + ": two closing pages, once each, after the unit's own pages (its activity page too)", p1 && p2 && withK.indexOf(L1, withK.indexOf(L1) + 1) < 0 && withK.indexOf(L2) > withK.indexOf(L1) &&
    withK.indexOf(L1) > withK.indexOf("Unit Study — Backyard Bugs (2/2)") && withK.indexOf(L1) > withK.indexOf("Unit Study — Backyard Bugs (1/"));
  ok(kid + ": take the two pages out and the notebook is the one without them, byte for byte", sep(withK.replace(p1, "").replace(p2, "")) === sep(without));
  ok(kid + ": the same week twice → the same notebook", withK === NB.generate(kid, mk(kid, units(), ex)).student);
  const look = { notebookTheme: ex.notebookTheme || null, nbLevel: {} };
  ok(kid + ": the Units-tab book draws the same two pages, in the notebook's own colours", J(NB.unitClosingPages(KP, NB.unitPageTheme(kid, look)).map(p => p.replace(/\s+$/, ""))) === J([p1, p2]));
});
{
  // a cover and closing pages in one week (a one-day unit): cover → the unit's pages → closing pages
  const h = NB.generate("kidz", mk("kidz", [Object.assign(CARDINS(2), { cover: { title: "Backyard Bugs", emoji: "🐞", days: [{ dn: "Day 1", t: "a" }], nDays: 1, counts: {} }, keep: KP })])).student;
  const ic = h.indexOf("Backyard Bugs (cover)"), iu = h.indexOf("Backyard Bugs (1/"), i1 = h.indexOf("(closing 1/2)"), i2 = h.indexOf("(closing 2/2)");
  ok("cover and closing pages in the same week: cover, the unit's pages, then the two closing pages", ic > 0 && iu > ic && i1 > iu && i2 > i1);
  const bare = NB.generate("kidz", mk("kidz", [Object.assign({}, NOCARD, { keep: Object.assign({}, KP, { title: "Rock Hunt" }) })])).student;
  ok("a bare insert (no cards, no week list) prints just the two closing pages", (bare.match(/Rock Hunt \(/g) || []).length === 2 && bare.indexOf("Rock Hunt (closing 1/2)") > 0);
}

console.log("── the pages ──");
{
  const th = NB.unitPageTheme("kidz");
  const [p1, p2] = NB.unitClosingPages(KP, th);
  ok("page 1: What we did — 📚 Books we read, 🎨 Things I made and did, two small photo boxes", ["What we did", "📚 Books we read", "Colour the stars", "🎨 Things I made and did", "The Big Bug Book", "A. Writer", "Draw a bug", "Label the parts"].every(s => p1.indexOf(s) > 0) && (p1.match(/data-ukphoto="1"/g) || []).length === 2);
  ok("a book gets five outline stars to colour (no fill)", (p1.match(/<svg /g) || []).length === 5 && /fill="none"/.test(p1) && !/fill="#/.test(p1));
  ok("✓ Nov 17 for the one done, an empty box for the other", (p1.match(/>✓<\/span>/g) || []).length === 1 && p1.indexOf(">Nov 17<") > 0 && (p1.match(/box-sizing:border-box;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;line-height:1;color:#[0-9a-fA-F]+"><\/span>/g) || []).length === 1);
  ok("page 2: My favorite part — a drawing box and TWO glue-in photo boxes, no words", ["My favorite part", "⭐ My favorite part", "Draw it"].every(s => p2.indexOf(s) > 0) && (p2.match(/data-ukphoto="1"/g) || []).length === 2 && (p2.match(/Something we made, ate or did/g) || []).length === 2 && p2.indexOf("Words and facts") < 0);
  const W = Array.from({ length: 15 }, (_, i) => ({ name: "Word " + (i + 1), bio: "DEFSECRET bio", def: "DEFSECRET def", portrait: i === 0 ? { img: "https://img.example.org/w1.jpg" } : { emoji: "🐜" } }));
  const [, q2] = NB.unitClosingPages(Object.assign({}, KP, { words: W }), th);
  ok("words on: 🃏 Words and facts I know takes one photo box's place (one left)", q2.indexOf("🃏 Words and facts I know") > 0 && q2.indexOf("Write what you know") > 0 && (q2.match(/data-ukphoto="1"/g) || []).length === 1);
  ok("…12 cards at most even when handed 15, + 3 more", ["Word 1<", "Word 12<"].every(s => q2.indexOf(s) > 0) && q2.indexOf("Word 13<") < 0 && q2.indexOf("+ 3 more") > 0);
  ok("…never a definition, even when one is handed in", q2.indexOf("DEFSECRET") < 0);
  ok("…the card's photo, else its emoji", q2.indexOf('src="https://img.example.org/w1.jpg"') > 0 && q2.indexOf(">🐜</div>") > 0);
  const [, l2] = NB.unitClosingPages(Object.assign({}, KP, { band: "little", words: W.slice(0, 4) }), th);
  ok("little kids: pictures to circle, no write-lines in the words part", l2.indexOf("Circle the ones you know") > 0 && l2.indexOf("Write what you know") < 0);
  const big = NB.unitClosingPages(Object.assign({}, KP, { books: Array.from({ length: 14 }, (_, i) => ({ t: "Book " + (i + 1), by: "" })), acts: Array.from({ length: 15 }, (_, i) => ({ e: "", t: "Project " + (i + 1), done: false, date: "" })) }), th)[0];
  ok("notebooks.js caps at 10 books (+ 4 more books) and 12 activities (+ 3 more) even when handed more", (big.match(/<svg /g) || []).length === 50 && big.indexOf("+ 4 more books") > 0 && big.indexOf("Project 12<") > 0 && big.indexOf("Project 13<") < 0 && big.indexOf("+ 3 more") > 0);
  const kept = NB.unitClosingPages(Object.assign({}, KP, { books: KP.books.concat([{ t: "B2" }]), booksMore: 6 }), th)[0];
  ok("…and adds the count index.html already capped off", kept.indexOf("+ 6 more books") > 0);
  const empty = NB.unitClosingPages({ title: "Empty", emoji: "📦" }, th)[0];
  ok("no books, no activities → three blank book lines (with stars) and four blank ☐ lines to write in", (empty.match(/<svg /g) || []).length === 15 && empty.indexOf("Write them in") > 0 &&
    (empty.match(/height:18px;border-bottom:1\.5px solid/g) || []).length === 7);
  ok("every writing space is blank: no answer / definition words on either page", !/answer|definition|DEFSECRET/i.test(p1 + p2 + q2));
  ok("outline style: no solid dark band", !/background:#(1e293b|1a3a2a|142038|2d1b69|7c2d12|27272a|0c4a6e|0f766e)/.test(p1 + p2 + q2));
  const he = NB.unitClosingPages({ title: '<b>"x"</b> & y', books: [{ t: "<i>b</i>", by: "<u>c</u>" }], acts: [{ t: "<s>d</s>", e: "<x>", date: "<y>", done: true }], words: [{ name: "<q>w</q>" }] }, th).join("");
  ok("everything is escaped", ["<b>\"", "<i>b", "<u>c", "<s>d", "<x>", "<y>", "<q>w"].every(s => he.indexOf(s) < 0) && he.indexOf("&lt;b>&quot;x&quot;&lt;/b> &amp; y") > 0);
  ok("each book / activity row is one line (nowrap + ellipsis)", /flex:1;min-width:0;font-size:13px;color:#1c1c1e;white-space:nowrap;overflow:hidden;text-overflow:ellipsis/.test(p1));
  ok("nothing at all handed in → still two pages", NB.unitClosingPages(null, null).length === 2);
}

console.log("── Mom's 🖨 Print <kid>'s unit book + the 🃏 words tick (Units tab) ──");
{
  const { ctx, writes } = world({ now: "2026-11-16T07:00:00", mastery: { kida: learnedItems("Bugs", ["Bug 3"]) } });
  ctx.window.HoweNotebooks = NB; ctx.utsRoster = () => KIDS.slice(); ctx.nbThemeOf = () => null; ctx.nbLevelOf = () => ({});
  const u = ctx.unitStudies.bugs;
  const doc = ctx.ukBookDoc(u, "kida");
  ok("one kid's book: the cover + the two closing pages, in a printable document", /^<!DOCTYPE html>/.test(doc) && doc.indexOf("ha-safari-print") > 0 &&
    (doc.match(/\(cover\)<\/div>/g) || []).length === 1 && (doc.match(/\(closing [12]\/2\)<\/div>/g) || []).length === 2 && doc.indexOf("(cover)") < doc.indexOf("(closing 1/2)"));
  const th = NB.unitPageTheme("kida", { notebookTheme: null, nbLevel: {} });
  ok("…the very cover and closing pages the notebook draws for that kid", doc.indexOf(NB.unitCoverPage(ctx.ucCoverOf("kida", u), th)) > 0 && NB.unitClosingPages(ctx.ukKeepOf("kida", u), th).every(p => doc.indexOf(p) > 0));
  ok("…no definition anywhere in the book", doc.indexOf("DEFSECRET") < 0);
  ok("a unit with no days still prints from the button", (() => { const d = ctx.ukBookDoc(Object.assign({}, u, { id: "nd2", track: null }), "kida"); return d.indexOf("(cover)") > 0 && d.indexOf("(closing 2/2)") > 0; })());
  ok("no kid (nobody enrolled): a book in the starter colours", (() => { const d = ctx.ukBookDoc(Object.assign({}, ctx.unitStudies.shelf, { enrolled: {} }), null); return d.indexOf("(closing 1/2)") > 0 && d.indexOf("#0f766e") > 0; })());
  ok("notebooks.js not there → an empty document (the print window says so)", (() => { ctx.window.HoweNotebooks = null; const d = ctx.ukBookDoc(u, "kida"); ctx.window.HoweNotebooks = NB; return d === ""; })());
  const html = ctx.ukBookHtml(u, ctx.esc);
  ok("the unit page (Mom): 📗 The unit book with one 🖨 button per enrolled kid", html.indexOf("📗 The unit book") > 0 && (html.match(/ukPrintBook\(/g) || []).length === 2 && html.indexOf("🖨 Print Kida’s unit book") > 0 && html.indexOf("🖨 Print Kidb’s unit book") > 0);
  ok("…and the 🃏 Words and facts I know tick, OFF", html.indexOf("🃏 Words and facts I know") > 0 && html.indexOf("· off") > 0 && html.indexOf("ukToggleWords(") > 0);
  ok("nobody enrolled: one 🖨 Print the unit book", (() => { const h = ctx.ukBookHtml(Object.assign({}, u, { enrolled: {} }), ctx.esc); return (h.match(/ukPrintBook\(/g) || []).length === 1 && h.indexOf("🖨 Print the unit book") > 0; })());
  ok("a unit with no cards: no words tick", ctx.ukBookHtml(ctx.unitStudies.rocks, ctx.esc).indexOf("ukToggleWords") < 0 && ctx.ukBookHtml(ctx.unitStudies.rocks, ctx.esc).indexOf("ukPrintBook(") > 0);
  // the tick: ONE targeted write, Mom only, live only
  ok("Mom ticks it on: keepWords = true, ONE set of unitStudies/bugs/keepWords", ctx.ukToggleWords("bugs") === true && u.keepWords === true && J(writes) === J([["set", "unitStudies/bugs/keepWords"]]), writes);
  ok("…the page shows it ✓ On, and kida's book now lists the card learned (name only)", ctx.ukBookHtml(u, ctx.esc).indexOf("✓ On") > 0 && ctx.ukBookDoc(u, "kida").indexOf("🃏 Words and facts I know") > 0 && ctx.ukBookDoc(u, "kida").indexOf(">Bug 3<") > 0);
  ok("…one photo box left on kida's last page; kidb (none learned) keeps two", (() => { const a = ctx.ukBookDoc(u, "kida"), b = ctx.ukBookDoc(u, "kidb"); const p2 = s => s.slice(s.indexOf("(closing 2/2)")); return (p2(a).match(/data-ukphoto="1"/g) || []).length === 1 && (p2(b).match(/data-ukphoto="1"/g) || []).length === 2; })());
  ok("Mom ticks it off: the field removed (set null), one more write", ctx.ukToggleWords("bugs") === true && !("keepWords" in u) && writes.length === 2 && writes[1][1] === "unitStudies/bugs/keepWords");
  ctx._dryRun = () => true;
  ok("?dryrun=1: the tick flips on screen, nothing written", ctx.ukToggleWords("bugs") === true && u.keepWords === true && writes.length === 2);
  ctx._dryRun = () => false; delete u.keepWords;
  ctx.momHere = () => false;
  ok("a kid: no button, no tick, and a tap changes and writes nothing", ctx.ukBookHtml(u, ctx.esc) === "" && ctx.ukToggleWords("bugs") === false && !("keepWords" in u) && writes.length === 2);
  let opened = 0; ctx.window.open = () => { opened++; return null; }; vm.runInContext("window.open=this.window.open;", ctx); ctx.alert = () => {};
  ctx.ukPrintBook("bugs", "kida");
  ok("…a kid's print tap opens nothing", opened === 0);
  ctx.momHere = () => true;
  ctx.ukPrintBook("bugs", "nobody");
  ok("a kid not in the unit: nothing opens", opened === 0);
  globalThis.__app = { ctx, writes };
}

console.log("── 🖨 Print the unit book when notebooks.js isn't loaded yet (it loads lazily) ──");
const fakeWin = () => { const w = { opens: 0, closed: false, buf: "", docs: [], document: { open() { w.opens++; w.buf = ""; }, write(s) { w.buf += s; }, close() { w.docs.push(w.buf); } }, close() { w.closed = true; } }; return w; };
const tick = () => new Promise(r => setImmediate(r));
(async () => {
  const { ctx, writes } = globalThis.__app;
  let opened = 0, alerts = [], w = null;
  ctx.window.open = () => { opened++; w = fakeWin(); return w; };
  vm.runInContext("window.open=this.window.open; var open=window.open;", ctx); ctx.alert = m => alerts.push(m);
  ctx.window.HoweNotebooks = NB;
  ctx.ukPrintBook("bugs", "kida");
  const loadedDoc = w.docs[w.docs.length - 1];
  ok("library loaded: Mom's tap opens the print window with the book and a print call", opened === 1 && w.docs.length === 1 && loadedDoc.indexOf("(closing 2/2)") > 0 && loadedDoc.indexOf("(cover)") > 0 && loadedDoc.indexOf("window.print()") > 0 && !alerts.length);
  ctx.window.HoweNotebooks = null; let calls = 0, release = null;
  ctx.haLoadNotebooksLib = () => { calls++; return new Promise(r => { release = () => { ctx.window.HoweNotebooks = NB; r(NB); }; }); };
  ctx.ukPrintBook("bugs", "kida");
  const w2 = w;
  ok("not loaded: the window opens in the tap, saying it's getting ready, and the loader is asked once", opened === 2 && w2.docs.length === 0 && w2.buf.indexOf("Getting the page ready") > 0 && calls === 1);
  release(); await tick(); await tick();
  ok("…once it loads, the same document as with the library already there", w2.docs.length === 1 && w2.docs[0] === loadedDoc && !w2.closed && !alerts.length);
  ctx.window.HoweNotebooks = null; ctx.haLoadNotebooksLib = () => Promise.reject(new Error("offline"));
  ctx.ukPrintBook("bugs", "kida");
  const w3 = w; await tick(); await tick();
  ok("a failed load: the window is closed, one plain message", w3.closed && w3.docs.length === 0 && alerts.length === 1);
  ok("no database write anywhere in the print path (only the two tick writes from before)", writes.length === 2, writes);
  console.log("\n" + pass + " passed, " + fail + " failed");
  process.exit(fail ? 1 : 0);
})();
