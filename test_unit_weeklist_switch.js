// 📅 UNITWEEKSW — a per-unit switch for the "This week we will…" list (PLAN_unit_sheet_2026-11-19.md §8.2 slice 1b, pick 7; a beta
// mom's answer 2026-11-20 "Only for some units"; her go 2026-11-22 "go with her answers and build"). Runs the REAL index.html blocks
// (FAMBLOCK, FAMTOGETHER, FAMBLOCKOUT, FAMLESSONS, FAMDAYSTART, UNITFT, LESSONRES, UNITTRACK, CRAFT, UNITDAY_EXTRAS, UNITDAY_GAME,
// UNITWEEK, UNITWEEKSW) and the REAL notebooks.js on a made-up family (two kids, a Builder-shaped unit: 6 days, two activities on one
// day, a craft, a snack, a game, a PDF, 10 cards; a deckless one-kid unit). No real names.
//  · SWITCH ABSENT OR ON = TODAY: uwAttach (and so every notebook) is the same as this tree with the switch taken out;
//  · SWITCH OFF = BEFORE THE WEEK LIST: the unit's insert carries no list and a deckless unit gets no bare insert, so every notebook
//    is byte for byte the one notebooks.js prints with its UNITWEEK block stripped (the tree minus the week list);
//  · the write: Mom only, ONE targeted set at unitStudies/<id>/weekList (false when off, removed when on), none in a dry run;
//  · the row on the unit page: Mom only, a unit with days, under 📓 Include in notebooks.
//   run: node test_unit_weeklist_switch.js
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
const s0 = src.indexOf("// UNITWEEKSW_START"), s1 = src.indexOf("// UNITWEEKSW_END");
ok("index.html: one UNITWEEKSW block, right after UNITWEEK_END", s0 > 0 && s1 > s0 && src.indexOf("// UNITWEEKSW_START", s0 + 1) < 0 && src.indexOf("// UNITWEEK_END\n// UNITWEEKSW_START") >= 0);
const HOOK = 'const wk=(typeof uwListOn!=="function"||uwListOn(u))?uwWeekOf(kid,u,tasks,dates):null;';
ok("one guarded hook inside uwAttach (the week list is asked only when the switch is on)", src.split(HOOK).length === 2 && fnIn(src, "uwAttach").indexOf(HOOK) > 0);
const rud = fnIn(src, "renderUnitDetail"), hk = 'if(typeof uwSwHtml==="function") h+=uwSwHtml(u);';
ok("one hook line on the unit page, right under the 📓 Include in notebooks row, inside Mom's box", src.split(hk).length === 2 && rud.indexOf(hk) > rud.indexOf("unitToggleNbInsert(") &&
  rud.indexOf(hk) > rud.indexOf("if(isMom){") && rud.indexOf(hk) < rud.indexOf("unitMixPicsHtml(u)"));
ok("notebooks.js has no part in it (the switch acts before the notebook is built)", !/weekList|uwListOn|UNITWEEKSW/.test(nbSrc));
const blk = src.slice(s0, s1);
const NAMES = /\b(adrienne|andrew|julian|lincoln|ellis|lucy|sara|sarah|caleb|taylor|makenzie|kenzie|dewalt|burris|melanie|howe)\b/i;
ok("no kid or family name in the new code", !NAMES.test(blk), (blk.match(NAMES) || [])[0]);
ok("no 🔀 emoji", blk.indexOf("\u{1F500}") < 0);
ok("the block's only database call: one set of unitStudies/<id>/weekList, behind db && !_dryRun()", (blk.match(/db\.ref\(/g) || []).length === 1 &&
  /db\.ref\("unitStudies\/"\+unitId\+"\/weekList"\)\.set\(next\?null:false\)/.test(blk) && /const live=\(typeof db!=="undefined"&&!!db&&!_dryRun\(\)\);\n\s*if\(live\) db\.ref/.test(blk) && !/\.update\(|\.remove\(|\.transaction\(|\.once\(|\.on\(/.test(blk));
const testTxt = fs.readFileSync(__filename, "utf8").split("\n").filter(l => !/^const NAMES =/.test(l)).join("\n");
ok("this test file names no real kid or family", !NAMES.test(testTxt), (testTxt.match(NAMES) || [])[0]);

// ── the world: the real family-time + unit blocks, a faked clock ──
const KIDS = ["kida", "kidb"];
const LINES = ["Bugs up close", "Insect bodies", "Caterpillars", "Ant snack day", "Bug games", "Bug parade"];
const SCHOOL = (() => { const out = []; const d = new Date(2026, 10, 2); while (d <= new Date(2027, 0, 29)) { const s = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); if (d.getDay() >= 1 && d.getDay() <= 5) out.push(s); d.setDate(d.getDate() + 1); } return out; })();
const DN = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const WEEKDAYS = ["monday", "tuesday", "wednesday", "thursday", "friday"];
const BUGS = () => ({ id: "bugs", title: "Backyard Bugs", emoji: "🐞", enrolled: { kida: true, kidb: true },
  decks: [{ key: "Bugs", groupBy: "kind", cards: Array.from({ length: 10 }, (_, i) => ({ name: "Bug " + (i + 1), kind: "insect", order: i + 1 })) }],
  activities: [{ key: "draw", title: "Draw a bug", emoji: "🖍", points: 5 }, { key: "label", title: "Label the parts", day: 2 }],
  track: { mode: "seq", perWeek: 5, days: [
    { id: "d1", n: 1, t: LINES[0], res: { books: [{ title: "The Big Bug Book" }], links: [{ url: "https://www.youtube.com/watch?v=bugvid", label: "Bug video", kind: "video" }], docs: [{ url: "https://files.example.org/bug-sheet.pdf", title: "bug sheet", kind: "pdf" }] } },
    { id: "d2", n: 2, t: LINES[1], nb: { activity: "draw" } },
    { id: "d3", n: 3, t: LINES[2], craft: { title: "Egg-carton caterpillar", supplies: [{ name: "egg carton" }] } },
    { id: "d4", n: 4, t: LINES[3], snack: { title: "Ants on a log" } },
    { id: "d5", n: 5, t: LINES[4], game: { title: "Bug bingo" } },
    { id: "d6", n: 6, t: LINES[5] }] } });
const ROCKS = () => ({ id: "rocks", title: "Rock Hunt", emoji: "🪨", enrolled: { kidb: true }, decks: [],
  track: { mode: "seq", days: Array.from({ length: 7 }, (_, i) => ({ id: "r" + (i + 1), n: i + 1, t: "Rock day " + (i + 1) })) } });
const BLOCK = () => ({ name: "Together", kids: KIDS.slice(), days: ["Mon", "Tue", "Wed", "Thu", "Fri"], at: "1:00 PM",
  items: [{ key: "un", name: "Backyard Bugs", minutes: 30, track: { mode: "seq", startDate: "2026-11-16", list: LINES.map((t, i) => ({ t: "Day " + (i + 1) + " — " + t, n: 1, u: { id: "bugs", d: "d" + (i + 1) } })) } }] });
// The tree minus the switch: the UNITWEEK block with its one guarded hook put back as it was, and no UNITWEEKSW.
const UW = cut(src, "// UNITWEEK_START", "// UNITWEEK_END"), UW0 = UW.replace(HOOK, "const wk=uwWeekOf(kid,u,tasks,dates);");
ok("the baseline (switch taken out) differs from this tree only by that hook", UW0 !== UW && UW0.indexOf("uwListOn") < 0);
function world(o) {
  o = o || {};
  const RealDate = Date; const NOW = new RealDate(o.now || "2026-11-16T07:00:00");
  class FakeDate extends RealDate { constructor(...a) { if (a.length) super(...a); else super(NOW.getTime()); } static now() { return NOW.getTime(); } }
  const iso = d => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  const today = iso(NOW), todayDay = DN[NOW.getDay()];
  const mon = (() => { const d = new RealDate(NOW.getTime()); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d; })();
  const BOARD = {}; WEEKDAYS.forEach((dn, i) => { const d = new RealDate(mon.getTime()); d.setDate(d.getDate() + i); BOARD[dn] = iso(d); });
  const lessons = { kida: {} }; SCHOOL.forEach((d, i) => lessons.kida[i] = { date: d, week: "Wk" });
  const units = { bugs: Object.assign(BUGS(), o.bugs || {}), rocks: Object.assign(ROCKS(), o.rocks || {}) };
  const writes = [], toasts = [];
  const flags = { mom: o.mom !== false, dry: !!o.dry };
  const ctx = { console, JSON, Object, Array, String, Number, Math, Set, Map, RegExp, WeakMap, Date: FakeDate, parseInt, parseFloat, isNaN, isFinite, setTimeout: () => 0, clearTimeout: () => {},
    window: { HA_FAMILY: { familyId: "testfam" } }, ROSTER: KIDS.slice(), KID_COLOR: {}, unitStudies: units, notebookSettings: {},
    rulesData: { schoolDay: { defaultStart: "9:00 AM", defaultEnd: "4:00 PM", lunchStart: "12:00 PM", lunchEnd: "1:00 PM" }, familyBlocks: { ft: BLOCK() } },
    currData: { subjects: { kidb: { geo: { display: "Rocks", unit: { id: "rocks" }, lessonSeq: ["Rock 1", "Rock 2", "Rock 3", "Rock 4", "Rock 5", "Rock 6", "Rock 7"], lessonIds: ["k1", "k2", "k3", "k4", "k5", "k6", "k7"] } } }, lessons, resources: {} },
    masteryData: {}, weekData: { tasks: [] }, checked: {}, claimed: {}, histState: {}, archive: {}, blockouts: {},
    WK: "week12", _todayDay: todayDay, lastTasksWrite: 0, rulesOpen: {}, gvShowPast: false,
    momHere: () => flags.mom, _dryRun: () => flags.dry, renderAll: () => {}, renderAllSoon: () => {}, dbg: () => {}, gwShowToast: m => toasts.push(m), sv: () => {},
    db: o.noDb ? null : { ref: p => ({ set: v => writes.push(["set", p, v]), update: v => writes.push(["update", p]), remove: () => writes.push(["remove", p]), transaction: () => writes.push(["tx", p]), once: () => writes.push(["read", p]), on: () => writes.push(["on", p]) }) },
    fbArr: v => v, cap: s => s ? s[0].toUpperCase() + s.slice(1) : s,
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
    fnIn(src, "lidsFor"), fnIn(src, "haKidUnits"), fnIn(src, "_unitActs"), fnIn(src, "nbUnitDays"), o.base ? UW0 : UW, o.base ? "" : cut(src, "// UNITWEEKSW_START", "// UNITWEEKSW_END"),
    "Object.defineProperty(this,'famProgress',{get:()=>famProgress,set:v=>{famProgress=v;}});"].join("\n"), ctx);
  ctx.famProgress = o.prog || {};
  return { ctx, writes, toasts, flags };
}
const famCards = (kid, pre) => WEEKDAYS.map(dn => ({ id: pre + "_" + kid + "_" + dn, who: kid, day: dn, time: "1:00 PM", title: "👪 Backyard Bugs", famBlock: "ft", famItem: "un" }));
const kidCards = (pre, map) => Object.keys(map).map(dn => ({ id: pre + "_geo_" + dn, who: "kidb", day: dn, time: "10:00 AM", title: "🪨 Rocks", subjectKey: "geo", lid: map[dn] }));
const DATES = { monday: "November 16", tuesday: "November 17", wednesday: "November 18", thursday: "November 19", friday: "November 20" };
const INS = () => [{ unitId: "bugs", title: "Backyard Bugs", emoji: "🐞", learning: [{ name: "Bug 1", group: "insect", bio: "Six legs." }], learned: [{ name: "Bug 9" }], next: [{ name: "Bug 10" }], extras: [], activities: [] }];
const TASKS = { kida: famCards("kida", "w"), kidb: famCards("kidb", "w").concat(kidCards("w", { monday: "k1", wednesday: "k2", friday: "k3" })) };
// what haNbContext hands the notebook: the built inserts, then uwAttach
const attach = (w, kid) => w.ctx.uwAttach(kid, INS(), TASKS[kid], DATES);

console.log("── uwListOn ──");
{
  const { ctx } = world();
  ok("absent → on; true → on; only a stored false is off", ctx.uwListOn({}) === true && ctx.uwListOn({ weekList: true }) === true && ctx.uwListOn({ weekList: false }) === false &&
    ctx.uwListOn({ weekList: "false" }) === true && ctx.uwListOn({ weekList: null }) === true && ctx.uwListOn(null) === true);
}

console.log("── switch absent or on = today ──");
{
  const base = world({ base: true });
  [["absent", {}], ["on (true stored)", { weekList: true }]].forEach(([lbl, f]) => {
    const w = world({ bugs: f, rocks: f });
    KIDS.forEach(kid => {
      const a = attach(w, kid), b = attach(base, kid);
      ok(lbl + ", " + kid + ": uwAttach hands the notebook the same inserts as the tree without the switch", J(a) === J(b) && a.some(x => x.week), a.map(x => x.unitId));
    });
  });
  // the parked next week, too
  const next = { monday: "November 23", tuesday: "November 24", wednesday: "November 25", thursday: "November 26", friday: "November 27" };
  const o = { now: "2026-11-21T10:00:00", prog: { ft: { un: { done: 2 } } } };
  const a = world(o).ctx.uwAttach("kida", INS(), famCards("kida", "n"), next), b = world(Object.assign({ base: true }, o)).ctx.uwAttach("kida", INS(), famCards("kida", "n"), next);
  ok("a parked next week: the same list as without the switch", J(a) === J(b) && a[0].week && a[0].week.rows.length === 4, a[0].week);
}

console.log("── switch off = before the week list ──");
{
  const w = world({ bugs: { weekList: false }, rocks: { weekList: false } });
  const insA = INS(), insAJ = J(insA);
  const ra = w.ctx.uwAttach("kida", insA, TASKS.kida, DATES);
  ok("off, kida: the very same inserts, untouched (no week list)", ra === insA && J(ra) === insAJ);
  const insB = INS();
  const rb = w.ctx.uwAttach("kidb", insB, TASKS.kidb, DATES);
  ok("off, kidb: no list on the card unit, and the deckless unit gets no bare insert (it prints nothing, as before)", rb === insB && rb.length === 1 && !rb[0].week, rb.map(x => x.unitId));
  const w1 = world({ rocks: { weekList: false } });
  const r1 = w1.ctx.uwAttach("kidb", INS(), TASKS.kidb, DATES);
  ok("off on ONE unit: the other unit still gets its list", r1.length === 1 && r1[0].unitId === "bugs" && r1[0].week && r1[0].week.rows.length === 5, r1.map(x => x.unitId));
  const w2 = world({ bugs: { weekList: false } });
  const r2 = w2.ctx.uwAttach("kidb", INS(), TASKS.kidb, DATES);
  ok("…and the other way round: the deckless unit keeps its page, the card unit loses only its list", r2.length === 2 && !r2[0].week && r2[1].unitId === "rocks" && r2[1].week.rows.length === 3, r2.map(x => [x.unitId, !!x.week]));
  ok("nothing written or read while building", w.writes.length === 0 && w1.writes.length === 0 && w2.writes.length === 0);
}

console.log("── the notebooks ──");
const load = s => { const w = {}; (new Function("window", "document", s))(w, {}); return w.HoweNotebooks; };
const strip = s => { const a = s.indexOf("  // UNITWEEK_START"), b = s.indexOf("  // UNITWEEK_END\n"); s = s.slice(0, a) + s.slice(b + "  // UNITWEEK_END\n".length); return s.split("\n").filter(l => !/   \/\/ UNITWEEK$/.test(l)).join("\n"); };
const NB = load(nbSrc), NB0 = load(strip(nbSrc));
ok("the stripped notebooks.js has no trace of the week list", !/uwRowsOf|uwHasCards|uwHeight|uwBlockHTML|uwInto|uwOnlyPage|UNITWEEK/.test(strip(nbSrc)));
const genKeys = (cut(nbSrc, "  var GENERATORS = {", "\n  };").match(/^    ([a-z]+): \{ label:/gm) || []).map(l => l.trim().split(":")[0]);
const pkThemes = ["dino", "shark", "construction"].filter(k => cut(nbSrc, "  var NB_THEMES = {", "\n  };").indexOf("    " + k + ":") >= 0);
const GENS = genKeys.map(k => [k]).concat(pkThemes.map(t => ["kidp" + t, { notebookTheme: t, nbGrade: "Pre-K" }]), [["kidz"]]);
ok("found the custom generators and Pre-K looks to run", genKeys.length >= 4 && pkThemes.length >= 1, { genKeys, pkThemes });
const ntasks = kid => WEEKDAYS.map((d, i) => ({ id: kid + i, who: kid, day: d, title: "📖 Reading " + i, time: "10:00 AM", mom: "none" }));
const mk = (kid, units, extra) => Object.assign({ weekData: { dates: DATES, tasks: ntasks(kid) }, weekNum: 12, extraPages: {}, prevSummary: {}, pace: [], units, nbKidName: "Student" }, extra || {});
{
  const off = world({ bugs: { weekList: false }, rocks: { weekList: false } }), on = world(), base = world({ base: true });
  GENS.forEach(([g, ex]) => {
    const uOff = off.ctx.uwAttach("kidb", INS(), TASKS.kidb, DATES);
    const a = NB.generate(g, mk(g, uOff, ex)), b = NB0.generate(g, mk(g, INS(), ex));
    ok(g + ": switch off → student and parent notebooks byte for byte the week-list-stripped tree's", a.student === b.student && a.parent === b.parent && a.student.indexOf("Backyard Bugs") > 0 && a.student.indexOf("Rock Hunt") < 0);
    const c = NB.generate(g, mk(g, on.ctx.uwAttach("kidb", INS(), TASKS.kidb, DATES), ex)), d = NB.generate(g, mk(g, base.ctx.uwAttach("kidb", INS(), TASKS.kidb, DATES), ex));
    ok(g + ": switch absent → byte for byte today's (the list and the deckless unit's page both print)", c.student === d.student && c.parent === d.parent && c.student.indexOf("This week we will") > 0 && c.student.indexOf("Rock Hunt") > 0);
  });
}

console.log("── the toggle (the one write) ──");
{
  const w = world();
  w.flags.mom = false;
  ok("not Mom: the toggle refuses, nothing changes, nothing written", w.ctx.unitToggleWeekList("bugs") === false && w.writes.length === 0 && w.ctx.unitStudies.bugs.weekList === undefined);
  w.flags.mom = true;
  ok("Mom, live: off → ONE set unitStudies/bugs/weekList = false", w.ctx.unitToggleWeekList("bugs") === true && J(w.writes) === J([["set", "unitStudies/bugs/weekList", false]]) && w.ctx.unitStudies.bugs.weekList === false, w.writes);
  w.writes.length = 0;
  ok("Mom, live: back on → ONE set of null (the field removed; absent = on)", w.ctx.unitToggleWeekList("bugs") === true && J(w.writes) === J([["set", "unitStudies/bugs/weekList", null]]) && !("weekList" in w.ctx.unitStudies.bugs), w.writes);
  w.writes.length = 0; w.flags.dry = true;
  ok("dry run: the screen flips, nothing is written, a toast says so", w.ctx.unitToggleWeekList("bugs") === true && w.writes.length === 0 && w.ctx.unitStudies.bugs.weekList === false && /dry run/.test(w.toasts.join("|")));
  const nd = world({ noDb: true });
  ok("no database (a test page): flips on screen, no throw", nd.ctx.unitToggleWeekList("rocks") === true && nd.ctx.unitStudies.rocks.weekList === false);
  ok("an unknown unit: nothing", w.ctx.unitToggleWeekList("nope") === false);
}

console.log("── the row on the unit page ──");
{
  const w = world({ rocks: { weekList: false } });
  const hOn = w.ctx.uwSwHtml(w.ctx.unitStudies.bugs), hOff = w.ctx.uwSwHtml(w.ctx.unitStudies.rocks);
  ok("on: \"📅 This week list\" and ✓ On", hOn.indexOf("📅 This week list") >= 0 && hOn.indexOf("✓ On") > 0 && hOn.indexOf("· off") < 0 && hOn.indexOf("unitToggleWeekList('bugs')") > 0);
  ok("off: ○ Off and · off", hOff.indexOf("○ Off") > 0 && hOff.indexOf("· off") > 0);
  ok("phone width: the row wraps (flex-wrap, a 150px text minimum, the button never wraps its words)", /flex-wrap:wrap/.test(hOn) && /min-width:150px/.test(hOn) && /white-space:nowrap/.test(hOn) && !/width:\d{3,}px/.test(hOn.replace(/min-width:150px/, "")));
  w.flags.mom = false;
  ok("not Mom: no row", w.ctx.uwSwHtml(w.ctx.unitStudies.bugs) === "");
  w.flags.mom = true;
  ok("a unit with no days: no row (it never gets a list)", w.ctx.uwSwHtml({ id: "x", title: "No days" }) === "");
  ok("a unit id with a quote is escaped in the button", w.ctx.uwSwHtml(Object.assign(BUGS(), { id: "a'b\"c" })).indexOf("unitToggleWeekList('a\\'b&quot;c')") > 0);
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
