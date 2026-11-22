// 🧾 UNITPREP — Mom's get-ready sheet (PLAN_unit_sheet_2026-11-19.md §4.5 re-shaped by §8.2 "Slice 2, lean"; a beta mom's answers
// 2026-11-20; go 2026-11-22 "go with her answers and build"). Runs the REAL index.html blocks (FAMBLOCK, FAMTOGETHER, FAMBLOCKOUT,
// FAMLESSONS, FAMDAYSTART, UNITFT, LESSONRES, UNITTRACK, PUTSCHED, CRAFT, UNITDAY_EXTRAS, UNITDAY_GAME, UNITGATHER, UNITPREP) on a
// made-up family: two kids, a Builder-shaped unit on Family Time (6 days, two activities on one day, a craft, a snack, a game, a PDF,
// 10 cards), a one-kid unit on a kid's own subject, a unit on no schedule. No real names.
//  · Mom only; opens on Next week (on a Sunday the coming week); This week · Next week · Whole unit; a unit not on the schedule
//    shows only Whole unit; every section (🎒 Gather with 🛒 Order, 📚 Books, 🖨 Print), a ☐ on each line with its day;
//  · which unit days are in a week = the Sunday list's question (family time and a kid's subject), this week and next;
//  · print counts: a family-time day ×1, a kid's-subject day × the kids who have it; the whole unit likewise;
//  · https links only; the 🖨 Print window is black on white with no buttons and no links; NO write anywhere.
//   run: node test_unit_prep.js
process.env.TZ = "America/New_York";
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x).slice(0, 700) : "")); } };
const J = x => JSON.stringify(x);
const cut = (s, a, b) => { const i = s.indexOf(a), j = s.indexOf(b, i); if (i < 0 || j < 0) throw new Error("markers " + a); return s.slice(i, j); };
const fnIn = (s, name) => { const i = s.indexOf("function " + name + "("); if (i < 0) throw new Error("no " + name); let d = 0, j = i, seen = false; for (; j < s.length; j++) { const c = s[j]; if (c === "{") { d++; seen = true; } else if (c === "}") { d--; if (seen && d === 0) break; } } return s.slice(i, j + 1); };

console.log("── wiring ──");
const p0 = src.indexOf("// UNITPREP_START"), p1 = src.indexOf("// UNITPREP_END");
ok("one UNITPREP block, right after UNITGATHER", p0 > 0 && p1 > p0 && src.indexOf("// UNITPREP_START", p0 + 1) < 0 && src.indexOf("// UNITGATHER_END\n// UNITPREP_START") >= 0);
const blk = src.slice(p0, p1);
ok("writes nothing: no database call, no storage in the block", !/\bdb\b|\.ref\(|\.set\(|\.update\(|\.remove\(|\.transaction\(|firebase|localStorage|HA_LS|sv\(/.test(blk));
const rud = fnIn(src, "renderUnitDetail"), hk = 'if(typeof upSectionHTML==="function") h+=upSectionHTML(u,isMom);';
ok("one hook line on the unit page, the line right above 📅 Days (the Days line keeps the decks right under it)", src.split(hk).length === 2 && /h\+=upSectionHTML\(u,isMom\);[^\n]*\n  if\(typeof utDaysSectionHTML==="function"\) h\+=utDaysSectionHTML\(u,isMom\);/.test(rud));
const code = blk.split("\n").filter(l => !/^\s*\/\//.test(l)).join("\n");
ok("Links, Cards and Day by day are left out of this build (no such section in the code)", !/Links to open|\u{1F0CF}|Day by day|LINKS|res\.links|\.cards/i.test(code));
const NAMES = /\b(adrienne|andrew|julian|lincoln|ellis|lucy|sara|sarah|caleb|taylor|makenzie|kenzie|dewalt|burris|melanie|howe)\b/i;
ok("no kid or family name in the block", !NAMES.test(blk), (blk.match(NAMES) || [])[0]);
ok("no 🔀 emoji", blk.indexOf("\u{1F500}") < 0);
const testTxt = fs.readFileSync(__filename, "utf8").split("\n").filter(l => !/^const NAMES =/.test(l)).join("\n");
ok("this test file names no real kid or family", !NAMES.test(testTxt), (testTxt.match(NAMES) || [])[0]);

// ── the world ──
const KIDS = ["kida", "kidb"];
const LINES = ["Bugs up close", "Insect bodies", "Caterpillars", "Ant snack day", "Bug games", "Bug parade"];
const SCHOOL = (() => { const out = []; const d = new Date(2026, 10, 2); while (d <= new Date(2027, 0, 29)) { const s = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); if (d.getDay() >= 1 && d.getDay() <= 5) out.push(s); d.setDate(d.getDate() + 1); } return out; })();
const DN = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const WEEKDAYS = ["monday", "tuesday", "wednesday", "thursday", "friday"];
const BUGS = () => ({ id: "bugs", title: "Backyard Bugs", emoji: "🐞", enrolled: { kida: true, kidb: true },
  decks: [{ key: "Bugs", cards: Array.from({ length: 10 }, (_, i) => ({ name: "Bug " + (i + 1), def: "DEFSECRET" + i })) }],
  activities: [{ key: "draw", title: "Draw a bug", emoji: "🖍", points: 5 }, { key: "label", title: "Label the parts", day: 2 },
    { key: "hunt", title: "Bug hunt sheet", day: 6, type: "print", pdf: { url: "https://files.example.org/hunt.pdf" } }],
  track: { mode: "seq", perWeek: 5, days: [
    { id: "d1", n: 1, t: LINES[0], res: { books: [{ title: "The Big Bug Book", by: "A. Writer" }], links: [{ url: "https://www.youtube.com/watch?v=bugvid", label: "LINKLABEL", kind: "video" }],
      docs: [{ url: "https://files.example.org/bug-sheet.pdf", title: "Bug sheet", kind: "pdf" }], supplies: [{ name: "magnifying glass", qty: "2" }, { name: "hot glue gun", kids: false }],
      orders: [{ name: "Bug kit", url: "https://shop.example.org/kit" }, { name: "Net", url: "http://shop.example.org/net" }], notes: "NOTESECRET" } },
    { id: "d2", n: 2, t: LINES[1], nb: { activity: "draw" } },
    { id: "d3", n: 3, t: LINES[2], craft: { title: "Egg-carton caterpillar", supplies: [{ name: "egg carton" }] } },
    { id: "d4", n: 4, t: LINES[3], snack: { title: "Ants on a log", supplies: [{ name: "celery" }] } },
    { id: "d5", n: 5, t: LINES[4], game: { title: "Bug bingo", supplies: [{ name: "bingo chips" }] } },
    { id: "d6", n: 6, t: LINES[5], res: { books: [{ title: "Parade of Bugs" }] } }] } });
const ROCKS = () => ({ id: "rocks", title: "Rock Hunt", emoji: "🪨", enrolled: { kidb: true }, decks: [], activities: [{ key: "chart", title: "Rock chart", day: 2 }],
  track: { mode: "seq", days: Array.from({ length: 7 }, (_, i) => ({ id: "r" + (i + 1), n: i + 1, t: "Rock day " + (i + 1), res: { books: [{ title: "Rock book " + (i + 1) }], supplies: [{ name: "rock " + (i + 1) }] } })) } });
const SHELF = () => ({ id: "shelf", title: "On the Shelf", emoji: "📦", enrolled: { kida: true, kidb: true }, activities: [{ key: "box", title: "Box poster" }],
  track: { mode: "seq", days: [{ id: "s1", n: 1, t: "Shelf day", res: { supplies: [{ name: "a box" }] } }] } });
const BARE = () => ({ id: "bare", title: "Nothing yet", enrolled: {} });
const BLOCK = () => ({ name: "Together", kids: KIDS.slice(), days: ["Mon", "Tue", "Wed", "Thu", "Fri"], at: "1:00 PM",
  items: [{ key: "un", name: "Backyard Bugs", minutes: 30, track: { mode: "seq", startDate: "2026-11-16", list: LINES.map((t, i) => ({ t: "Day " + (i + 1) + " — " + t, n: 1, u: { id: "bugs", d: "d" + (i + 1) } })) } }] });
// the one-kid unit's lessons on the Grid: this week Mon/Wed/Fri = Rock 1–3, next week Mon/Tue/Thu = Rock 4–6
const GEO = { "2026-11-16": "Rock 1", "2026-11-18": "Rock 2", "2026-11-20": "Rock 3", "2026-11-23": "Rock 4", "2026-11-24": "Rock 5", "2026-11-26": "Rock 6" };
const GEOSUB = () => ({ display: "Rocks", unit: { id: "rocks" }, lessonSeq: ["Rock 1", "Rock 2", "Rock 3", "Rock 4", "Rock 5", "Rock 6", "Rock 7"], lessonIds: ["k1", "k2", "k3", "k4", "k5", "k6", "k7"] });
function world(o) {
  o = o || {};
  const RealDate = Date; const NOW = new RealDate(o.now || "2026-11-16T07:00:00");   // a Monday morning, nothing done yet (the family lesson map labels dates from today on)
  class FakeDate extends RealDate { constructor(...a) { if (a.length) super(...a); else super(NOW.getTime()); } static now() { return NOW.getTime(); } }
  const iso = d => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  const today = iso(NOW), todayDay = DN[NOW.getDay()];
  const mon = (() => { const d = new RealDate(NOW.getTime()); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d; })();
  const BOARD = {}; WEEKDAYS.forEach((dn, i) => { const d = new RealDate(mon.getTime()); d.setDate(d.getDate() + i); BOARD[dn] = iso(d); });
  const lessons = { kida: {}, kidb: {} };
  SCHOOL.forEach((d, i) => { lessons.kida[i] = { date: d, week: "Wk" }; lessons.kidb[i] = { date: d, week: "Wk" }; if (GEO[d]) { lessons.kidb[i].geo = GEO[d]; if (o.bothGeo) lessons.kida[i].geo = GEO[d]; } });
  const subjects = { kidb: { geo: GEOSUB() } }; if (o.bothGeo) subjects.kida = { geo: GEOSUB() };
  const units = { bugs: BUGS(), rocks: ROCKS(), shelf: SHELF(), bare: BARE() };
  const writes = [], opened = [];
  const flags = { mom: o.mom !== false };
  const ctx = { console, JSON, Object, Array, String, Number, Math, Set, Map, RegExp, WeakMap, Date: FakeDate, parseInt, parseFloat, isNaN, isFinite, setTimeout: () => 0, clearTimeout: () => {},
    ROSTER: KIDS.slice(), KID_COLOR: {}, unitStudies: units, notebookSettings: {},
    rulesData: { schoolDay: { defaultStart: "9:00 AM", defaultEnd: "4:00 PM", lunchStart: "12:00 PM", lunchEnd: "1:00 PM" }, familyBlocks: o.noFam ? {} : { ft: BLOCK() } },
    currData: { subjects, lessons, resources: {} },
    masteryData: {}, weekData: { tasks: [] }, checked: {}, claimed: {}, histState: {}, archive: {}, blockouts: {},
    WK: "week12", _todayDay: todayDay, lastTasksWrite: 0, rulesOpen: {}, gvShowPast: false,
    momHere: () => flags.mom, _dryRun: () => false, renderAll: () => {}, renderAllSoon: () => {}, dbg: () => {}, gwShowToast: () => {}, sv: () => {},
    db: { ref: p => ({ set: v => writes.push(["set", p]), update: v => writes.push(["update", p]), remove: () => writes.push(["remove", p]), transaction: () => writes.push(["tx", p]), once: () => writes.push(["read", p]), on: () => writes.push(["on", p]) }) },
    fbArr: v => v, cap: s => s ? s[0].toUpperCase() + s.slice(1) : s,
    toMin: t => { const m = String(t || "").trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i); if (!m) return NaN; let h = +m[1]; const ap = (m[3] || "").toUpperCase(); if (ap === "PM" && h !== 12) h += 12; if (ap === "AM" && h === 12) h = 0; return h * 60 + (+m[2]); },
    gwParseDate: s => { const p = s.split("-"); return new FakeDate(+p[0], +p[1] - 1, +p[2]); },
    cbTodayISO: () => today, routineDateISO: dn => dn === todayDay ? today : (BOARD[dn] || null),
    llLessonKey: t => (t && t.lid) ? String(t.lid) : "", taskLessonRef: t => "",
    smapIsKidOff: () => false, coopTimedEndMin: () => 0, FX_DOW: { monday: "Mon", tuesday: "Tue", wednesday: "Wed", thursday: "Thu", friday: "Fri", saturday: "Sat", sunday: "Sun" },
    confirm: () => true, alert: () => {}, document: { getElementById: () => null, createElement: () => ({ style: {} }), body: { appendChild: () => {} } },
    window: { HA_FAMILY: { familyId: "testfam" }, open: () => { const w = { html: "", document: { write: h => { w.html += h; }, close: () => {} } }; opened.push(w); return w; } } };
  ctx.fromMin = v => { let h = Math.floor(v / 60), m = v % 60; const ap = h >= 12 ? "PM" : "AM"; let hh = h % 12; if (hh === 0) hh = 12; return hh + ":" + String(m).padStart(2, "0") + " " + ap; };
  ctx.relayWeek = () => {};
  vm.createContext(ctx);
  vm.runInContext([cut(src, "// FAMBLOCK_START", "// FAMBLOCK_END"), cut(src, "// FAMTOGETHER_START", "// FAMTOGETHER_END"), cut(src, "// FAMBLOCKOUT_START", "// FAMBLOCKOUT_END"),
    cut(src, "// FAMLESSONS_START", "// FAMLESSONS_END"), cut(src, "// FAMDAYSTART_START", "// FAMDAYSTART_END"), cut(src, "// UNITFT_START", "// UNITFT_END"),
    cut(src, "// LESSONRES_START", "// LESSONRES_END"), cut(src, "// UNITTRACK_START", "// UNITTRACK_END"), cut(src, "// PUTSCHED_START", "// PUTSCHED_END"), cut(src, "// CRAFT_START", "// CRAFT_END"),
    cut(src, "// UNITDAY_EXTRAS_START", "// UNITDAY_EXTRAS_END"), cut(src, "// UNITDAY_GAME_START", "// UNITDAY_GAME_END"),
    fnIn(src, "lidsFor"), fnIn(src, "_unitActs"), cut(src, "// UNITGATHER_START", "// UNITGATHER_END"), cut(src, "// UNITPREP_START", "// UNITPREP_END"),
    "Object.defineProperty(this,'famProgress',{get:()=>famProgress,set:v=>{famProgress=v;}});",
    "Object.defineProperty(this,'upOpenId',{get:()=>upOpenId,set:v=>{upOpenId=v;}});Object.defineProperty(this,'upView',{get:()=>upView,set:v=>{upView=v;}});"].join("\n"), ctx);
  ctx.famProgress = o.prog || {};
  return { ctx, writes, opened, flags };
}
const daysOf = (w, uid, off) => { const x = w.ctx.upWeek(w.ctx.unitStudies[uid], off); return x.ids.map(id => x.when[id] + " " + id + " ×" + x.copies[id]); };
const hrefs = h => (h.match(/href="([^"]*)"/g) || []).map(s => s.slice(6, -1));

console.log("── which unit days are in a week (the Sunday list's question) ──");
{
  const w = world();
  ok("the made-up Monday: this week = Nov 16–22, next = Nov 23–29", J(w.ctx.lrWeekRange(0)) === J({ from: "2026-11-16", to: "2026-11-22" }) && J(w.ctx.lrWeekRange(1)) === J({ from: "2026-11-23", to: "2026-11-29" }));
  ok("family-time unit, this week: Mon–Fri = Day 1–5, each ×1 (one sheet for everyone)", J(daysOf(w, "bugs", 0)) === J(["Mon d1 ×1", "Tue d2 ×1", "Wed d3 ×1", "Thu d4 ×1", "Fri d5 ×1"]), daysOf(w, "bugs", 0));
  ok("family-time unit, next week: Mon = Day 6, then the unit is done", J(daysOf(w, "bugs", 1)) === J(["Mon d6 ×1"]), daysOf(w, "bugs", 1));
  ok("one-kid unit (a kid's subject), this week: Mon Day 1 · Wed Day 2 · Fri Day 3, ×1 (one kid)", J(daysOf(w, "rocks", 0)) === J(["Mon r1 ×1", "Wed r2 ×1", "Fri r3 ×1"]), daysOf(w, "rocks", 0));
  ok("one-kid unit, next week: Mon Day 4 · Tue Day 5 · Thu Day 6", J(daysOf(w, "rocks", 1)) === J(["Mon r4 ×1", "Tue r5 ×1", "Thu r6 ×1"]), daysOf(w, "rocks", 1));
  const w2 = world({ bothGeo: true });
  ok("both kids have the subject: each day ×2 (a page each)", J(daysOf(w2, "rocks", 1)) === J(["Mon r4 ×2", "Tue r5 ×2", "Thu r6 ×2"]), daysOf(w2, "rocks", 1));
  ok("a unit on no schedule: no days in any week", w.ctx.upWeek(w.ctx.unitStudies.shelf, 0).ids.length === 0 && w.ctx.upPointers(w.ctx.unitStudies.shelf).length === 0);
  ok("working it out wrote nothing and read nothing from the database", w.writes.length === 0 && w2.writes.length === 0, w.writes);
}

console.log("── the sheet (Mom) ──");
{
  const w = world(), u = w.ctx.unitStudies.bugs;
  ok("closed: only the 🧾 Get ready button", (() => { const h = w.ctx.upSectionHTML(u, true); return h.indexOf("🧾 Get ready") > 0 && h.indexOf("Gather") < 0 && h.indexOf("upToggle('bugs')") > 0; })());
  w.ctx.upToggle("bugs");
  ok("tapped on a weekday: it opens on Next week", w.ctx.upOpenId === "bugs" && w.ctx.upView === "next");
  const h = w.ctx.upSectionHTML(u, true);
  ok("the three buttons and 🖨 Print; Next week is the one picked", ["This week", "Next week", "Whole unit", "🖨 Print"].every(s => h.indexOf(s) > 0) && /background:#1f2937;color:#fff;[^>]*>Next week</.test(h));
  ok("the title and the week's dates: \"Next week · Nov 23 – Nov 29 · 6 days\"", h.indexOf("🐞 Backyard Bugs — get ready") > 0 && h.indexOf("Next week · Nov 23 – Nov 29 · 6 days") > 0);
  ok("every section: 🎒 Gather · 📚 Books · 🖨 Print", ["🎒 Gather", "📚 Books", "🖨 Print"].every(s => h.indexOf(s) > 0));
  ok("next week (Day 6): its book and the printable activity ×1 with its day", h.indexOf("Parade of Bugs") > 0 && /Bug hunt sheet<\/b> <span[^>]*>\(PDF\)<\/span> <b>×1<\/b>/.test(h) && h.indexOf("Mon · Day 6") > 0);
  ok("…and not this week's things", h.indexOf("magnifying glass") < 0 && h.indexOf("The Big Bug Book") < 0);
  ok("nothing to gather next week says so", h.indexOf("Nothing to gather.") > 0);
  w.ctx.upSetView("this");
  const t = w.ctx.upSectionHTML(u, true);
  ok("This week: supplies with amount, ✂️ 🍎 🎲, Mom's flagged, each with its day", /magnifying glass<\/b> <span[^>]*>\(2\)<\/span>/.test(t) && /hot glue gun<\/b>[^☐]*Mom’s/.test(t) && /egg carton<\/b> ✂️/.test(t) && /celery<\/b> 🍎/.test(t) && /bingo chips<\/b> 🎲/.test(t) && t.indexOf("Mon · Day 1") > 0 && t.indexOf("Wed · Day 3") > 0);
  ok("🛒 Order sits under Gather, with an https link to open; the http one has none", (() => { const i = t.indexOf("🛒 Order"), g = t.indexOf("🎒 Gather"), b = t.indexOf("📚 Books"); return i > g && i < b && t.indexOf("Bug kit") > i && t.indexOf('href="https://shop.example.org/kit"') > 0 && t.indexOf("shop.example.org/net") < 0; })());
  ok("📚 Books: title, author, day", /The Big Bug Book<\/b> <span[^>]*>by A\. Writer<\/span><span[^>]*> · Mon · Day 1/.test(t));
  ok("🖨 Print: the day's PDF ×1, both activities of Day 2 as notebook pages ×1", /Bug sheet<\/b> <span[^>]*>\(PDF\)<\/span> <b>×1<\/b>/.test(t) && /Draw a bug <span[^>]*>— notebook page, prints with the notebook<\/span> <b>×1<\/b>/.test(t) && /Label the parts <span[^>]*>— notebook page/.test(t));
  ok("a ☐ on every line", (() => { const rows = (t.match(/break-inside:avoid"><span style="display:inline-block;width:12px;height:12px;border:1.5px solid #374151/g) || []).length; return rows >= 10; })());
  ok("every link is https (and opens in a new tab)", hrefs(t).length >= 2 && hrefs(t).every(x => /^https:\/\//.test(x)) && (t.match(/target="_blank" rel="noopener"/g) || []).length === hrefs(t).length, hrefs(t));
  ok("never on the sheet: a video or site link, a note, a card's definition", ["LINKLABEL", "youtube", "NOTESECRET", "DEFSECRET"].every(s => t.indexOf(s) < 0));
  ok("the Sunday-list pointer line", t.indexOf("🧺 Sunday list") > 0);
  w.ctx.upSetView("whole");
  const a = w.ctx.upSectionHTML(u, true);
  ok("Whole unit: all six days' books and the printable; on Family Time so every page ×1", a.indexOf("The Big Bug Book") > 0 && a.indexOf("Parade of Bugs") > 0 && a.indexOf("×2") < 0 && /Bug hunt sheet<\/b>[^☐]*×1/.test(a) && a.indexOf("Whole unit · 6 days") > 0);
  w.ctx.upSetView("bogus");
  ok("an unknown view is ignored", w.ctx.upView === "whole");
  w.ctx.upToggle("bugs");
  ok("tap again: closed", w.ctx.upOpenId === "" && w.ctx.upSectionHTML(u, true).indexOf("Gather") < 0);
  ok("nothing written by opening, switching or closing", w.writes.length === 0, w.writes);
}

console.log("── a kid's-subject unit, and the counts ──");
{
  const w = world({ bothGeo: true }), u = w.ctx.unitStudies.rocks;
  w.ctx.upToggle("rocks");
  const h = w.ctx.upSectionHTML(u, true);
  ok("next week: Day 4–6's books and supplies, each with its weekday", ["Rock book 4", "Rock book 5", "Rock book 6", "rock 4"].every(s => h.indexOf(s) > 0) && h.indexOf("Tue · Day 5") > 0 && h.indexOf("Rock book 1") < 0);
  w.ctx.upSetView("this");
  ok("this week: Day 2's notebook page ×2 (both kids have the subject)", /Rock chart <span[^>]*>— notebook page, prints with the notebook<\/span> <b>×2<\/b>/.test(w.ctx.upSectionHTML(u, true)));
  w.ctx.upSetView("whole");
  ok("whole unit: × the kids whose subject is on it (2)", /Rock chart[^☐]*×2/.test(w.ctx.upSectionHTML(u, true)));
  const w1 = world();
  w1.ctx.upToggle("rocks"); w1.ctx.upSetView("this");
  ok("one kid: ×1", /Rock chart[^☐]*×1/.test(w1.ctx.upSectionHTML(w1.ctx.unitStudies.rocks, true)));
}

console.log("── a unit not on the schedule ──");
{
  const w = world(), u = w.ctx.unitStudies.shelf;
  w.ctx.upToggle("shelf");
  const h = w.ctx.upSectionHTML(u, true);
  ok("only Whole unit (no This week / Next week), and it says why", h.indexOf("Whole unit") > 0 && h.indexOf(">This week<") < 0 && h.indexOf(">Next week<") < 0 && h.indexOf("isn’t on the schedule yet") > 0);
  ok("its things for the whole unit, × the enrolled kids (2); the any-day activity shows", h.indexOf("a box") > 0 && /Box poster[^☐]*×2/.test(h) && h.indexOf("any day") > 0);
  ok("a unit with no days and no activities: no button at all", w.ctx.upSectionHTML(w.ctx.unitStudies.bare, true) === "");
}

console.log("── Mom only ──");
{
  const w = world();
  ok("isMom false: nothing", w.ctx.upSectionHTML(w.ctx.unitStudies.bugs, false) === "");
  w.flags.mom = false;
  ok("Mom mode off: nothing, even when asked as Mom's page", w.ctx.upSectionHTML(w.ctx.unitStudies.bugs, true) === "");
  w.ctx.upToggle("bugs"); w.ctx.upPrint("bugs");
  ok("not Mom: the button and Print do nothing", w.ctx.upOpenId === "" && w.opened.length === 0);
  w.flags.mom = true; w.ctx.upToggle("bugs"); w.flags.mom = false;
  ok("Mom leaves while it is open: the sheet goes", w.ctx.upSectionHTML(w.ctx.unitStudies.bugs, true) === "");
}

console.log("── 🖨 Print ──");
{
  const w = world();
  w.ctx.upToggle("bugs"); w.ctx.upSetView("this"); w.ctx.upPrint("bugs");
  const p = w.opened.length === 1 ? w.opened[0].html : "";
  ok("one print window with the sheet for the picked week", p.indexOf("Backyard Bugs — get ready") > 0 && p.indexOf("This week · Nov 16 – Nov 22") > 0 && ["🎒 Gather", "🛒 Order", "📚 Books", "🖨 Print"].every(s => p.indexOf(s) > 0));
  ok("black on white: no buttons, no links (an address can't be tapped on paper), a ☐ per line", p.indexOf("<button") < 0 && p.indexOf("<a ") < 0 && p.indexOf("background:#fff;color:#111") > 0 && (p.match(/border:1.5px solid #374151/g) || []).length >= 10);
  ok("it prints itself once loaded", /window\.print\(\)/.test(p));
  ok("nothing written", w.writes.length === 0);
}

console.log("── on a Sunday ──");
{
  const w = world({ now: "2026-11-22T15:00:00", prog: { ft: { un: { done: 5 } } } });
  w.ctx.upToggle("bugs");
  const h = w.ctx.upSectionHTML(w.ctx.unitStudies.bugs, true);
  ok("Sunday: it opens on the coming week (the app's \"this week\" on a Sunday: Nov 23 – Nov 29, Day 6)", w.ctx.upView === "this" && h.indexOf("This week · Nov 23 – Nov 29") > 0 && h.indexOf("Parade of Bugs") > 0, w.ctx.upView);
}

console.log("── phone width ──");
{
  const w = world(); w.ctx.upToggle("bugs"); w.ctx.upSetView("this");
  const h = w.ctx.upSectionHTML(w.ctx.unitStudies.bugs, true);
  ok("one column on a phone, two when there is room (grid auto-fit, min(100%,240px)); the buttons wrap", /grid-template-columns:repeat\(auto-fit,minmax\(min\(100%,240px\),1fr\)\)/.test(h) && /display:flex;gap:6px;flex-wrap:wrap/.test(h));
  ok("no fixed width wider than a phone", !/(?:^|[;"])width:\s*(\d{3,})px/.test(h) && !/min-width:\s*([3-9]\d{2}|\d{4,})px/.test(h));
  ok("long names wrap inside their line (min-width:0)", /flex:1;min-width:0/.test(h));
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
