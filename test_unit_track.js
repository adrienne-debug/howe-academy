// 📅 UNITTRACK — a unit may carry a track of days ("One shape" §2, §5; BRIEF_units_build_2026-10-27.md T1; her go 2026-10-27).
//   Runs the REAL UNITTRACK + LESSONRES + FAMRES blocks (and HEAD's LESSONRES + FAMRES for the byte-identity checks).
//   · utClean drops unknown parts and keeps LESSONRES's shapes; rungs only little/early/middle/upper; a craft's supplies
//   · utDayForTask for all three pointers (family in order · family week by week · a kid's subject) and for none
//   · lrFor: lesson's own → unit day → subject default, with _from; a craft's supplies join tagged craft:true
//   · with no track anywhere, lrFor and lrBuildList are JSON-identical to HEAD on a DeWalt-shaped fixture
//   · haBuildUnitInsight is JSON-identical before and after a track is added
//   · utWrite writes exactly one path (plus ch on a named card); utDayAdd appends; dry run writes nothing; Mom-only
//   · every pre-existing index of a mastery/<kid> fixture is untouched; the block never writes under mastery/
//   · nudges skip a unit with a track; the 📅 Days section renders empty / with days / for a kid
//   run: node test_unit_track.js
const fs = require("fs"), path = require("path"), vm = require("vm"), cp = require("child_process");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
let head = ""; try { head = cp.execSync("git show HEAD:index.html", { cwd: __dirname, encoding: "utf8", maxBuffer: 1 << 28 }); } catch (e) { head = ""; }
const cutIn = (s, a, b) => { const i = s.indexOf(a), j = s.indexOf(b, i); if (i < 0 || j < 0) throw new Error("markers " + a); return s.slice(i, j); };
const fnIn = (s, name) => { const i = s.indexOf("function " + name + "("); if (i < 0) throw new Error("no " + name); let d = 0, j = i, seen = false; for (; j < s.length; j++) { const c = s[j]; if (c === "{") { d++; seen = true; } else if (c === "}") { d--; if (seen && d === 0) break; } } return s.slice(i, j + 1); };
const UT = cutIn(src, "// UNITTRACK_START", "// UNITTRACK_END");
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x) : "")); } };
const J = x => JSON.stringify(x);

// ── fixtures: DeWalt-shaped ──
const ROSTER = ["taylor", "makenzie", "andrew", "caleb"];
const DATES = ["2026-10-19", "2026-10-20", "2026-10-21", "2026-10-22", "2026-10-23", "2026-10-26", "2026-10-27", "2026-10-28", "2026-10-29", "2026-10-30"];
const TODAY = "2026-10-21";
const UNITS = withTrack => ({
  thanksgiving: Object.assign({ id: "thanksgiving", title: "Thanksgiving", emoji: "🦃", enrolled: { caleb: true, andrew: true },
    decks: [{ key: "Thanksgiving", groupBy: "kind", cards: [{ name: "Wampanoag", def: "the people who lived here", kind: "people", order: 1 }, { name: "Mayflower", def: "the ship", kind: "things", order: 2 }, { name: "Plymouth", def: "where they landed", kind: "places", order: 3 }] }],
    activities: [{ key: "turkey", title: "Hand turkey", points: 5 }] },
    withTrack ? { track: { mode: "seq", perWeek: 4, rungLog: "kid", days: [
      { id: "d1", n: 1, t: "Who were the Wampanoag?", res: { links: [{ url: "https://youtu.be/wamp", label: "Video", kind: "video" }, { url: "http://not-https", label: "bad" }], supplies: [{ name: "construction paper", qty: "2" }], books: [{ title: "Squanto", by: "J. Bulla" }], notes: "Say Wampanoag slowly." }, cards: [{ deck: "Thanksgiving", names: ["Wampanoag"] }], rungs: { little: "Point to the ocean.", upper: "Why did they leave?", bogus: "no" }, bogus: 1, read: { mode: "mom", what: "Squanto ch 1" } },
      { id: "d2", n: 2, t: "The Mayflower", craft: { title: "Hand turkey", steps: ["Trace your hand", { text: "Color it", img: "https://x/y.png" }], supplies: [{ name: "glue" }, { name: "" }] }, cards: [{ deck: "Thanksgiving", names: ["Mayflower", "Plymouth"] }], words: { title: "Over the River", text: "Over the river and through the wood…", parts: { little: "Over the river", middle: "…" } } },
      { id: "d3", n: 3, t: "Off day", off: true, res: { supplies: [{ name: "nothing" }] } }] } } : {}),
  ancients_01: Object.assign({ id: "ancients_01", title: "The Ancients · 1", decks: [{ key: "Ancients", cards: [{ name: "Lascaux" }] }] },
    withTrack ? { track: { mode: "week", roles: { Mon: "The object", Tue: "Nature" }, days: { 0: { id: "w1mon", wk: 1, role: "The object", t: "Hall of the Bulls", res: { links: [{ url: "https://sotw/1", label: "SOTW 1" }] } }, 1: { id: "w1tue", wk: 1, role: "Nature", t: "IQ Weather 1", res: { supplies: [{ name: "thermometer" }] } }, 2: { id: "w2mon", wk: 2, role: "The object", t: "Week two" } } } } : {})
});
const BLOCKS = withTrack => ({ ft: { name: "Family Time", kids: ROSTER.slice(), days: ["Mon", "Tue", "Wed", "Thu"], at: "lunch", items: [
  { key: "th", name: "Thanksgiving", minutes: 30, track: { mode: "seq", list: withTrack ? [{ t: "Day 1 — Who were the Wampanoag?", n: 1, u: { id: "thanksgiving", d: "d1" } }, { t: "Day 2 — The Mayflower", n: 1, u: { id: "thanksgiving", d: "d2" } }] : [{ t: "Day 1 — Who were the Wampanoag?", n: 1 }, { t: "Day 2 — The Mayflower", n: 1 }] } },
  { key: "r", name: "Read Aloud", minutes: 20 },
  { key: "g", name: "The Gathering", minutes: 30, track: Object.assign({ mode: "week", startDate: "2026-10-19", startWeek: 1, total: 36, days: { Mon: "The object", Tue: "Nature", Wed: "Where", Thu: "Hands-on", Fri: "Words" } }, withTrack ? { unit: { id: "ancients_01", fromWeek: 1 } } : {}) }] } });
const SUBJECTS = withTrack => ({
  andrew: { hist: { name: "History", lessonSeq: ["L1", "L2", "L3"], lessonIds: ["a1", "a2", "a3"] } },
  caleb: { tg: Object.assign({ name: "Thanksgiving", lessonSeq: ["Day 1 — Who were the Wampanoag?", "Day 2 — The Mayflower"], lessonIds: ["t1", "t2"] }, withTrack ? { unit: { id: "thanksgiving" } } : {}) }
});
// the family labels per date (famLessonMap's byDate), stubbed: the in-order track by position, the week track by the calendar
const LABELS = { th: { "2026-10-19": "Day 1 — Who were the Wampanoag?", "2026-10-20": "Day 2 — The Mayflower", "2026-10-21": "✓ all done" },
  g: { "2026-10-19": "Wk 1 · The object", "2026-10-20": "Wk 1 · Nature", "2026-10-21": "Wk 1 · Where", "2026-10-22": "Wk 1 · Hands-on", "2026-10-26": "Wk 2 · The object", "2026-10-27": "Wk 2 · Nature" } };

function world(o) {
  o = o || {}; const S = o.head ? head : src; const withTrack = !!o.track;
  const writes = [];
  const ctx = { console, JSON, Object, Array, String, Number, Math, Set, Map, RegExp, Date, parseInt, parseFloat, isFinite, isNaN, URL, WeakMap, setTimeout: () => {},
    unitStudies: o.units || UNITS(withTrack), currData: { subjects: SUBJECTS(withTrack), resources: o.resources || {}, lessons: {} }, ROSTER: ROSTER.slice(),
    rulesData: { familyBlocks: BLOCKS(withTrack) }, masteryData: o.mastery || { caleb: [{ id: "cal_a", subject: "Thanksgiving", prompt: "Wampanoag", status: "active", tier: "weekly" }] },
    momHere: () => o.mom !== false, _dryRun: () => !!o.dry, db: o.nodb ? null : { ref: p => ({ set: v => { writes.push([p, JSON.parse(JSON.stringify(v === undefined ? null : v))]); }, update: v => { writes.push(["update " + p, v]); }, on: () => {}, remove: () => { writes.push([p, "REMOVE"]); } }) },
    renderAll: () => { ctx.repaints = (ctx.repaints || 0) + 1; }, repaints: 0, tab: "units", supplies: {}, WK: "week12", activeWk: () => "week12", sv: () => {}, ld: () => null,
    esc: s => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;"), cap: s => s ? s[0].toUpperCase() + s.slice(1) : s,
    cbTodayISO: () => TODAY, gwParseDate: s => { const p = s.split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); }, FAM_ABBR: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    routineDateISO: d => ({ monday: "2026-10-19", tuesday: "2026-10-20", wednesday: "2026-10-21", thursday: "2026-10-22", friday: "2026-10-23" })[d] || "",
    famDefs: () => ctx.rulesData.familyBlocks, famList: x => Array.isArray(x) ? x.filter(v => v != null) : (x && typeof x === "object" ? Object.keys(x).sort().map(k => x[k]).filter(v => v != null) : []),
    famTrack: it => (it && it.track && (it.track.mode === "week" || it.track.mode === "seq")) ? it.track : null,
    famItemOf: t => { const b = ctx.famDefs()[t && t.famBlock]; return b ? ctx.famList(b.items).find(it => it && it.key === t.famItem) || null : null; },
    famLessonMap: (b, id, it) => ({ byDate: LABELS[it.key] || {}, short: LABELS[it.key] || {} }),
    famLessonFor: t => { const ds = ctx.routineDateISO(t.day); return (LABELS[t.famItem] || {})[ds] || ""; },
    famGridDates: () => DATES.map(d => ({ date: d })), famCellState: (b, it, ds) => ({ runs: ["2026-10-19", "2026-10-20", "2026-10-21", "2026-10-22", "2026-10-26", "2026-10-27", "2026-10-28", "2026-10-29"].indexOf(ds) >= 0, kids: ROSTER.slice() }),
    lidsFor: (kid, sk) => { const s = ((ctx.currData.subjects || {})[kid] || {})[sk]; return (s && Array.isArray(s.lessonIds)) ? s.lessonIds : null; },
    llLessonKey: t => t && t.lid ? String(t.lid) : "", taskLessonRef: t => (t && t.ref) || "", lrLidForText: () => null, llKeyForRef: r => String(r || "").toLowerCase().replace(/\s+/g, "_"),
    momHereCards: () => o.mom !== false, document: { getElementById: id => (o.dom && (id in o.dom)) ? { value: o.dom[id] } : null, createElement: () => ({ style: {} }), body: { appendChild: () => {} } },
    _famLmMemo: {}, famProgress: {}, checked: {}, histState: {} };
  vm.createContext(ctx);
  vm.runInContext(cutIn(S, "// LESSONRES_START", "// LESSONRES_END") + "\n" + cutIn(S, "// FAMRES_START", "// FAMRES_END") + (o.head ? "" : "\n" + UT), ctx);
  // the Sunday list's laid lessons, stubbed: Caleb's unit subject on Mon + Tue of this week, Andrew's history Wed
  ctx.lrLaidLessonsCached = (kid, from, to) => {
    const L = [];
    if (kid === "caleb") { if ("2026-10-19" >= from && "2026-10-19" <= to) L.push({ sk: "tg", key: "t1", text: "Day 1 — Who were the Wampanoag?", date: "2026-10-19" }); if ("2026-10-20" >= from && "2026-10-20" <= to) L.push({ sk: "tg", key: "t2", text: "Day 2 — The Mayflower", date: "2026-10-20" }); }
    if (kid === "andrew" && "2026-10-21" >= from && "2026-10-21" <= to) L.push({ sk: "hist", key: "a1", text: "L1", date: "2026-10-21" });
    return L;
  };
  return { ctx, writes };
}

console.log("── utClean: the shape, nothing else ──");
{
  const c = world({ track: true }).ctx; const u = c.unitStudies.thanksgiving;
  const d1 = c.utDay(u, "d1");
  ok("unknown parts are dropped (bogus on the day, bogus on the rungs)", d1.bogus === undefined && d1.rungs.bogus === undefined && Object.keys(d1).sort().join() === "cards,id,n,read,res,rungs,t");
  ok("res is LESSONRES's own shape: a non-https link is dropped, kids:true is filled in, a video link keeps its kind", J(d1.res.links) === J([{ url: "https://youtu.be/wamp", label: "Video", kind: "video" }]) && J(d1.res.supplies) === J([{ name: "construction paper", kids: true, qty: "2" }]) && d1.res.books[0].by === "J. Bulla" && d1.res.notes === "Say Wampanoag slowly.");
  ok("rungs keep only the four levels; the read strand keeps a known mode", d1.rungs.little === "Point to the ocean." && d1.rungs.upper === "Why did they leave?" && d1.read.mode === "mom" && d1.read.what === "Squanto ch 1");
  const d2 = c.utDay(u, "d2");
  ok("a craft: a bare string step becomes {text}, an empty supply is dropped, supplies are lrClean'd", d2.craft.title === "Hand turkey" && J(d2.craft.steps) === J([{ text: "Trace your hand" }, { text: "Color it", img: "https://x/y.png" }]) && J(d2.craft.supplies) === J([{ name: "glue", kids: true }]));
  ok("words: title, text and the parts by level", d2.words.title === "Over the River" && d2.words.parts.little === "Over the river" && d2.words.parts.middle === "…" && d2.words.by === undefined);
  ok("utClean(null) → null; an object with nothing → a day with nothing", c.utClean(null) === null && J(c.utClean({ zzz: 1 })) === "{}");
  ok("utDays keeps stored order and includes the off day; utDaysOn leaves it out; utDayN finds by n", c.utDays(u).map(d => d.id).join() === "d1,d2,d3" && c.utDaysOn(u).length === 2 && c.utDayN(u, 2).id === "d2");
  ok("an object-keyed days map (Firebase) reads in numeric order", c.utDays(c.unitStudies.ancients_01).map(d => d.id).join() === "w1mon,w1tue,w2mon");
  ok("rungLog reads 'kid' when set, 'none' otherwise; utTrack null for a unit without one", c.utRungLog(u) === "kid" && c.utRungLog(c.unitStudies.ancients_01) === "none" && c.utTrack({ id: "x" }) === null && c.utDays({ id: "x" }).length === 0);
  ok("utDays is memoised on the track object and refreshed after a write", (() => { const a = c.utDays(u), b = c.utDays(u); c.utWrite("thanksgiving", "d2", "note", "hi"); return a === b && c.utDays(u) !== a && c.utDay(u, "d2").note === "hi"; })());
}
console.log("\n── utDayForTask: the three pointers, and none ──");
{
  const c = world({ track: true }).ctx;
  const fam = c.utDayForTask({ id: "c1", who: "andrew", famBlock: "ft", famItem: "th", day: "monday", title: "🏡 Thanksgiving" });
  ok("a family card on an in-order line with u → that unit day (uid + the day)", fam && fam.uid === "thanksgiving" && fam.id === "d1" && fam.t === "Who were the Wampanoag?", fam);
  const fam2 = c.utDayForTask({ id: "c2", who: "andrew", famBlock: "ft", famItem: "th", day: "tuesday" });
  ok("…Tuesday's line → d2", fam2 && fam2.id === "d2");
  ok("a '✓ all done' day → null", c.utDayForTask({ id: "c3", who: "andrew", famBlock: "ft", famItem: "th", day: "wednesday" }) === null);
  const wk = c.utDayForTask({ id: "g1", who: "caleb", famBlock: "ft", famItem: "g", day: "tuesday" });
  ok("a week-by-week item with track.unit → the day whose wk and role match the date (Tue → Nature)", wk && wk.uid === "ancients_01" && wk.id === "w1tue", wk);
  ok("…Wednesday (role Where) has no unit day → null; a kid's lesson with .unit → day n = i+1", c.utDayForTask({ id: "g2", who: "caleb", famBlock: "ft", famItem: "g", day: "wednesday" }) === null && c.utDayForTask({ id: "k1", who: "caleb", subjectKey: "tg", lid: "t2" }).id === "d2");
  ok("a kid's lesson found by its text when no lesson id is stamped", c.utDayForTask({ id: "k2", who: "caleb", subjectKey: "tg", ref: "Day 1 — Who were the Wampanoag?" }).id === "d1");
  ok("no pointer anywhere → null (a plain subject, Read Aloud, nothing)", c.utDayForTask({ id: "a", who: "andrew", subjectKey: "hist", lid: "a1" }) === null && c.utDayForTask({ id: "r", who: "andrew", famBlock: "ft", famItem: "r", day: "monday" }) === null && c.utDayForTask(null) === null && c.utDayForTask({ id: "z" }) === null);
  ok("utDayForFam by date and label: fromWeek shifts the week (fromWeek 2 → Wk 2 is the unit's week 1)", (() => { const it = { key: "g", track: { mode: "week", days: { Mon: "The object" }, unit: { id: "ancients_01", fromWeek: 2 } } }; const d = c.utDayForFam("ft", it, "2026-10-26", "Wk 2 · The object"); return d && d.id === "w1mon"; })());
}
console.log("\n── lrFor: lesson's own → unit day → subject default ──");
{
  const w = world({ track: true, resources: { caleb: { tg: { t1: { supplies: [{ name: "scissors", kids: true }] }, _subject: { books: [{ title: "Default book" }], orders: [{ name: "Default order" }] } } } } }), c = w.ctx;
  const r = c.lrFor("caleb", "tg", "t1");
  ok("the lesson's own supplies win; links and books come from the unit day; orders from the subject default; _from says which", r.supplies[0].name === "scissors" && r._from.supplies === "lesson" && r.links[0].url === "https://youtu.be/wamp" && r._from.links === "unit" && r.books[0].title === "Squanto" && r._from.books === "unit" && r.orders[0].name === "Default order" && r._from.orders === "subject", r._from);
  ok("the unit day's notes show as the lesson's (nothing of Mom's own)", r.notes === "Say Wampanoag slowly." && r._from.notes === "unit");
  const r2 = c.lrFor("caleb", "tg", "t2");
  ok("day 2: the craft's supplies join the day's supplies tagged craft:true", J(r2.supplies) === J([{ name: "glue", kids: true, craft: true }]) && r2._from.supplies === "unit" && r2.books[0].title === "Default book" && r2._from.books === "subject", r2.supplies);
  ok("the subject default row itself never reads the unit layer", c.lrFor("caleb", "tg", "_subject")._from.links === "none");
  ok("a subject without .unit is untouched", c.lrFor("andrew", "hist", "a1")._from.links === "none");
  const sk = c.frSk("ft", "th");
  const f1 = c.lrFor("_family", sk, "l_" + c.lrSlug("Day 1 — Who were the Wampanoag?"));
  ok("the family in-order key l_<slug> → the line's unit day", f1.links.length === 1 && f1._from.links === "unit" && f1.supplies[0].name === "construction paper");
  const g = c.lrFor("_family", c.frSk("ft", "g"), "wk1");
  ok("the family week key wk1 → every day of that week, parts together", g.links[0].label === "SOTW 1" && g.supplies[0].name === "thermometer" && g._from.supplies === "unit");
  const pinned = c.frRecFor(c.frSk("ft", "g"), ["wk1"], c.utDayForFam("ft", c.famItemOf({ famBlock: "ft", famItem: "g" }), "2026-10-20", "Wk 1 · Nature"));
  ok("frRecFor with the date's day pins it: Tuesday's card carries only Tuesday's supplies, not Monday's link", pinned.supplies[0].name === "thermometer" && pinned.links.length === 0);
  const cardRec = c.frCardRec({ id: "g1", who: "caleb", famBlock: "ft", famItem: "g", day: "monday", time: "1:00 PM" });
  ok("frCardRec (the family card) uses the card's own day: Monday → the SOTW link only", cardRec.links[0].label === "SOTW 1" && cardRec.supplies.length === 0);
}
console.log("\n── no track anywhere: byte-identical to HEAD ──");
if (!head) ok("HEAD readable", false); else {
  const RES = { caleb: { tg: { t1: { supplies: [{ name: "scissors", kids: true }] }, _subject: { books: [{ title: "Default book" }] } } }, _family: {} };
  const A = world({ head: true, resources: JSON.parse(J(RES)) }), B = world({ resources: JSON.parse(J(RES)) });
  const keys = [["caleb", "tg", "t1"], ["caleb", "tg", "t2"], ["caleb", "tg", "_subject"], ["andrew", "hist", "a1"], ["_family", "fam_ft_th", "l_day_1_who_were_the_wampanoag"], ["_family", "fam_ft_g", "wk1"], ["_family", "fam_ft_r", "__none__"]];
  ok("lrFor answers identically for every key tried", keys.every(k => J(A.ctx.lrFor(...k)) === J(B.ctx.lrFor(...k))));
  const la = A.ctx.lrBuildList({ today: TODAY }), lb = B.ctx.lrBuildList({ today: TODAY });
  ok("lrBuildList (the Sunday list, kids + the 🏡 Family group) is JSON-identical", J(la) === J(lb) && la.n === 2, J(la) === J(lb) ? [la.n, lb.n] : [J(la).slice(0, 300), J(lb).slice(0, 300)]);
  const t = { id: "c1", who: "andrew", famBlock: "ft", famItem: "th", day: "monday", time: "1:00 PM" };
  ok("frCardRec on a family card is identical", J(A.ctx.frCardRec(t)) === J(B.ctx.frCardRec(t)));
  ok("utDayForTask on the no-track data is null for every card", B.ctx.utDayForTask(t) === null && B.ctx.utDayForTask({ id: "k", who: "caleb", subjectKey: "tg", lid: "t1" }) === null);
}
console.log("\n── with a track: the Sunday list carries the unit's items under today's ids ──");
{
  const c = world({ track: true }).ctx; const L = c.lrBuildList({ today: TODAY });
  const cal = L.kids.find(k => k.kid === "caleb"), fam = L.kids.find(k => k.kid === "_family");
  const ids = L.items.map(i => i.id);
  ok("Caleb's unit lessons bring the day's paper, book and the craft's glue, keyed kid + subject + kind + item", ids.indexOf("lr_caleb_tg_supplies_construction_paper") >= 0 && ids.indexOf("lr_caleb_tg_books_squanto") >= 0 && ids.indexOf("lr_caleb_tg_supplies_glue") >= 0, ids);
  ok("the 🏡 Family group carries the same days for the whole family (its own ids), the Gathering's thermometer too", !!fam && ids.indexOf("lr__family_fam_ft_th_supplies_construction_paper") >= 0 && ids.indexOf("lr__family_fam_ft_g_supplies_thermometer") >= 0, fam && fam.kinds.map(k => k.items.map(i => i.id)));
  ok("the craft supply is tagged on the record the list read", c.lrFor("caleb", "tg", "t2").supplies[0].craft === true);
  ok("the off day's supplies never reach the list", ids.every(i => i.indexOf("nothing") < 0));
}
console.log("\n── haBuildUnitInsight: identical before and after a track ──");
{
  const mk = () => { const ctx = { console, JSON, Object, Array, String, Math, masteryData: { caleb: [{ id: "cal_a", subject: "Thanksgiving", prompt: "Wampanoag", status: "active", tier: "monthly" }] }, MAST_MASTERY_TIER_DEFAULT: "monthly", mastTierAtLeast: (a, b) => a === "monthly" || a === "graduated", _unitPortrait: () => "", _nbActKeys: () => ["turkey"], unitActPoints: a => a.points || 0, nbUnitDays: () => [] }; vm.createContext(ctx);
    vm.runInContext(fnIn(src, "haBuildUnitInsight") + "\n" + fnIn(src, "_unitCharDeck") + "\n" + fnIn(src, "_unitActs"), ctx); return ctx; };
  const c = mk(); const before = J(c.haBuildUnitInsight("caleb", UNITS(false).thanksgiving)), after = J(c.haBuildUnitInsight("caleb", UNITS(true).thanksgiving));
  ok("the insight (learning · learned · next · extras · activities) does not change when a track is added", before === after && before.indexOf("Wampanoag") > 0);
}
console.log("\n── utWrite / utDayAdd / utTrackSet: one path each, Mom-only, dry-run inert ──");
{
  const w = world({ track: true }), c = w.ctx;
  ok("utWrite title → exactly one set of unitStudies/<id>/track/days/<i>/t, cleaned", c.utWrite("thanksgiving", "d2", "t", "  The Mayflower sails  ") === true && J(w.writes) === J([["unitStudies/thanksgiving/track/days/1/t", "The Mayflower sails"]]) && c.utDay(c.unitStudies.thanksgiving, "d2").t === "The Mayflower sails", w.writes);
  w.writes.length = 0;
  ok("an empty title clears the part (set null)", c.utWrite("thanksgiving", "d2", "t", "") && J(w.writes) === J([["unitStudies/thanksgiving/track/days/1/t", null]]) && c.utDay(c.unitStudies.thanksgiving, "d2").t === undefined);
  w.writes.length = 0;
  ok("res is cleaned on the way in; one path", c.utWrite("thanksgiving", "d2", "res", { links: [{ url: "https://a.b/c", label: "A" }, { url: "ftp://no" }], supplies: [{ name: "tape" }], bogus: 1 }) && w.writes.length === 1 && w.writes[0][0] === "unitStudies/thanksgiving/track/days/1/res" && J(w.writes[0][1]) === J({ links: [{ url: "https://a.b/c", label: "A" }], supplies: [{ name: "tape", kids: true }] }), w.writes);
  w.writes.length = 0;
  const n = c.utWrite("thanksgiving", "d1", "cards", [{ deck: "Thanksgiving", names: ["Wampanoag", "Plymouth"] }, { deck: "Nope", names: ["x"] }]);
  ok("cards: the part, plus ch = the day's n on each named unit card that differs (one set each); an unknown deck is kept out", n && w.writes.length === 3 && w.writes[0][0] === "unitStudies/thanksgiving/track/days/0/cards" && w.writes[1][0] === "unitStudies/thanksgiving/decks/0/cards/0/ch" && w.writes[1][1] === 1 && w.writes[2][0] === "unitStudies/thanksgiving/decks/0/cards/2/ch" && c.unitStudies.thanksgiving.decks[0].cards[2].ch === 1, w.writes);
  w.writes.length = 0;
  ok("writing the same cards again stamps nothing twice", c.utWrite("thanksgiving", "d1", "cards", [{ deck: "Thanksgiving", names: ["Wampanoag"] }]) && w.writes.length === 1);
  w.writes.length = 0;
  ok("a part outside the list (place, nb, n, id) is refused; an unknown day is refused", c.utWrite("thanksgiving", "d1", "place", { name: "x" }) === false && c.utWrite("thanksgiving", "d1", "n", 9) === false && c.utWrite("thanksgiving", "nope", "t", "x") === false && w.writes.length === 0);
  ok("off: marks the day off and back", c.utWrite("thanksgiving", "d1", "off", true) && c.utDay(c.unitStudies.thanksgiving, "d1").off === true && c.utWrite("thanksgiving", "d1", "off", false) && c.utDay(c.unitStudies.thanksgiving, "d1").off === undefined && w.writes[1][1] === null);
  w.writes.length = 0;
  const d = c.utDayAdd("thanksgiving", "Harvest feast");
  ok("utDayAdd appends d4 (n 4) with ONE set of …/track/days/3; nothing re-ordered", d.id === "d4" && d.n === 4 && J(w.writes) === J([["unitStudies/thanksgiving/track/days/3", { id: "d4", n: 4, t: "Harvest feast" }]]) && c.utDays(c.unitStudies.thanksgiving).map(x => x.id).join() === "d1,d2,d3,d4");
  w.writes.length = 0;
  const d2 = c.utDayAdd("ancients_01", "Week two Tue");
  ok("…on an object-keyed days map the next numeric key is used", w.writes[0][0] === "unitStudies/ancients_01/track/days/3" && d2.n === 1);
  w.writes.length = 0;
  c.unitStudies.plain = { id: "plain", title: "Plain" };
  const d3 = c.utDayAdd("plain", "First");
  ok("a unit with no track gets one with its first day in ONE set of unitStudies/<id>/track", d3.id === "d1" && J(w.writes) === J([["unitStudies/plain/track", { mode: "seq", perWeek: 4, days: [{ id: "d1", n: 1, t: "First" }] }]]) && c.utTrack(c.unitStudies.plain).mode === "seq");
  w.writes.length = 0;
  w.writes.length = 0;
  ok("a week-by-week unit stamps ch = the day's wk (example B: week 1's cards open at week 1)", c.utWrite("ancients_01", "w2mon", "cards", [{ deck: "Ancients", names: ["Lascaux"] }]) && w.writes.length === 2 && w.writes[1][0] === "unitStudies/ancients_01/decks/0/cards/0/ch" && w.writes[1][1] === 2, w.writes);
  w.writes.length = 0;
  ok("utTrackSet rungLog kid / none, perWeek, mode — one path each; a bad field is refused", c.utTrackSet("thanksgiving", "rungLog", "none") && w.writes[0][0] === "unitStudies/thanksgiving/track/rungLog" && w.writes[0][1] === null && c.utTrackSet("thanksgiving", "perWeek", "3") && w.writes[1][1] === 3 && c.utTrackSet("thanksgiving", "mode", "week") && w.writes[2][1] === "week" && c.utTrackSet("thanksgiving", "days", []) === false && w.writes.length === 3, w.writes);
  ok("every write is under unitStudies/<id>/track or a unit card's ch — never mastery, never notebookSettings", w.writes.every(x => /^unitStudies\/[a-z0-9_]+\/(track|decks\/\d+\/cards\/\d+\/ch)/.test(x[0])) && !/db\.ref\("mastery|notebookSettings|famProgress|config\//.test(UT));
}
{
  const w = world({ track: true, dry: true }), c = w.ctx;
  c.utWrite("thanksgiving", "d1", "t", "Dry"); c.utDayAdd("thanksgiving", "Dry day"); c.utTrackSet("thanksgiving", "perWeek", 2);
  ok("dry run: the screen changes, nothing is written", w.writes.length === 0 && c.utDay(c.unitStudies.thanksgiving, "d1").t === "Dry" && c.utDays(c.unitStudies.thanksgiving).length === 4);
  const m = world({ track: true, mom: false }), mc = m.ctx;
  ok("not Mom: refused, nothing written, nothing changed", mc.utWrite("thanksgiving", "d1", "t", "x") === false && mc.utDayAdd("thanksgiving", "x") === null && mc.utTrackSet("thanksgiving", "mode", "week") === false && m.writes.length === 0 && mc.utDay(mc.unitStudies.thanksgiving, "d1").t === "Who were the Wampanoag?");
}
console.log("\n── the mastery array is never touched ──");
{
  const mastery = { caleb: [{ id: "cal_a", subject: "Thanksgiving", prompt: "Wampanoag", status: "active", tier: "weekly" }, { id: "cal_b", subject: "Letters", prompt: "A", status: "introduction" }], caleb_custom_items: [{ cat: "Thanksgiving", name: "Mayflower", ch: 2 }] };
  const before = J(mastery); const w = world({ track: true, mastery }), c = w.ctx;
  c.utWrite("thanksgiving", "d1", "cards", [{ deck: "Thanksgiving", names: ["Mayflower"] }]); c.utDayAdd("thanksgiving", "x"); c.lrBuildList({ today: TODAY }); c.utDayForTask({ id: "k1", who: "caleb", subjectKey: "tg", lid: "t1" });
  ok("every pre-existing index of mastery/<kid> and the bank is byte-identical after every read and write", J(c.masteryData) === before && w.writes.every(x => x[0].indexOf("mastery") < 0));
}
console.log("\n── nudges skip a unit with a track ──");
{
  const ctx = { console, JSON, Object, Array, String, _unitActs: u => u.activities || [], _nbActKeys: () => [], _unitSafeKey: k => k, _unitPlanFired: () => true, _unitSprintRollup: () => [], haKidUnits: kid => Object.values(ctx.unitStudies).filter(u => u.enrolled && u.enrolled[kid]), unitStudies: UNITS(true) };
  ctx.unitStudies.thanksgiving.plan = [{ key: "p1", activity: "turkey", when: { kind: "now" } }];
  vm.createContext(ctx); vm.runInContext(fnIn(src, "unitPlanNudges") + "\n" + fnIn(src, "unitAllNudges") + "\n" + UT, ctx);
  ok("a unit with a track gives no nudges; the same unit without one still does", ctx.unitAllNudges("caleb").length === 0 && (delete ctx.unitStudies.thanksgiving.track, ctx.unitAllNudges("caleb").length === 1));
}
console.log("\n── the 📅 Days section ──");
{
  const c = world({ track: true }).ctx;
  const empty = c.utDaysSectionHTML({ id: "x", title: "X" }, true);
  ok("no track: the empty line and, for Mom, '+ Add a day'", empty.indexOf("Give this unit days and it can go on the schedule.") > 0 && empty.indexOf("+ Add a day") > 0 && (empty.match(/class="ut-row"/g) || []).length === 0);
  ok("…a kid sees the line and no button", (() => { const k = c.utDaysSectionHTML({ id: "x" }, false); return k.indexOf("Give this unit days") > 0 && k.indexOf("Add a day") < 0; })());
  const h = c.utDaysSectionHTML(c.unitStudies.thanksgiving, true);
  ok("with days: one row per day (the off one faded), title · links · books · supplies · cards · craft, the lays/rungs pills", (h.match(/class="ut-row"/g) || []).length === 3 && h.indexOf("Day 1 — Who were the Wampanoag?") > 0 && h.indexOf("Squanto") > 0 && h.indexOf("2 construction paper") > 0 && h.indexOf("Thanksgiving: 1") > 0 && h.indexOf("Hand turkey") > 0 && h.indexOf("✂️ glue") > 0 && h.indexOf("Graded per kid") > 0 && h.indexOf("opacity:.5") > 0);
  const k = c.utDaysSectionHTML(c.unitStudies.thanksgiving, false);
  ok("a kid's view: the same rows, no onclick, no pills, no add box, no editor", (k.match(/class="ut-row"/g) || []).length === 3 && k.indexOf("utEditOpen") < 0 && k.indexOf("utTrackSet") < 0 && k.indexOf("ut-new-title") < 0);
  c.utEditOpen("thanksgiving", "d1");
  const e = c.utDaysSectionHTML(c.unitStudies.thanksgiving, true);
  ok("Mom taps a row → its editor opens under it with every box", e.indexOf("ut-editor") > 0 && e.indexOf('id="ut-e-t"') > 0 && e.indexOf('id="ut-e-rung-upper"') > 0 && e.indexOf('id="ut-e-wtext"') > 0 && e.indexOf('id="ut-e-cards"') > 0 && e.indexOf("Save this day") > 0 && e.indexOf("Mark this day off") > 0);
  ok("the section draws without a kid's name and without the shuffle emoji", !/lincoln|ellis|lucy|julian/i.test(e) && e.indexOf("🔀") < 0);
  ok("renderUnitDetail draws it above the decks (guarded), unitPlanNudges skips a tracked unit (guarded)", /if\(typeof utDaysSectionHTML==="function"\) h\+=utDaysSectionHTML\(u,isMom\);[^\n]*\n  \(u\.decks\|\|\[\]\)\.forEach/.test(src) && /if\(typeof utTrack==="function"&&utTrack\(u\)\) return out;/.test(fnIn(src, "unitPlanNudges")));
}
console.log("\n── the editor's Save: each changed part is one write ──");
{
  const dom = { "ut-e-t": "Who were the Wampanoag?", "ut-e-links": "https://youtu.be/wamp | Video\nhttps://site/x | Site", "ut-e-books": "Squanto | J. Bulla", "ut-e-supplies": "2 construction paper\nglue | mom", "ut-e-orders": "", "ut-e-cards": "Thanksgiving: Wampanoag, Mayflower", "ut-e-rung-little": "Point to the ocean.", "ut-e-rung-early": "", "ut-e-rung-middle": "", "ut-e-rung-upper": "Why did they leave?", "ut-e-wtitle": "", "ut-e-wby": "", "ut-e-wtext": "", "ut-e-wpart-little": "", "ut-e-wpart-early": "", "ut-e-wpart-middle": "", "ut-e-wpart-upper": "", "ut-e-rmode": "mom", "ut-e-rwhat": "Squanto ch 1", "ut-e-rurl": "", "ut-e-note": "Go slow." };
  const w = world({ track: true, dom }), c = w.ctx;
  const n = c.utEditSave("thanksgiving", "d1");
  ok("only the parts that changed are written: res (a second link, a Mom-only glue), cards (Mayflower added; ch on both named cards, which had none), note", n === 3 && w.writes.map(x => x[0]).join("|") === "unitStudies/thanksgiving/track/days/0/res|unitStudies/thanksgiving/track/days/0/cards|unitStudies/thanksgiving/decks/0/cards/0/ch|unitStudies/thanksgiving/decks/0/cards/1/ch|unitStudies/thanksgiving/track/days/0/note", w.writes.map(x => x[0]));
  const res = w.writes[0][1];
  ok("the parsed res: 'glue | mom' is a supply off the kids' line; the notes the editor does not show are kept", res.links.length === 2 && res.supplies[1].name === "glue" && res.supplies[1].kids === false && res.notes === "Say Wampanoag slowly." && res.books[0].by === "J. Bulla", res);
  ok("Save with nothing changed writes nothing", (w.writes.length = 0, c.utEditSave("thanksgiving", "d1") === 0 && w.writes.length === 0));
}
console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
