// 📋 NBT_TODAY (study PLAN_notebooks_study_2026-11-23 §16 / step 3; her words 2026-11-23: "they have all the pages that they need
// to do that day, maybe with like little buttons off to the side so it switches to the right things that they should be doing that
// day so they're not just doing the one school day thing"). Two parts:
//   A. notebooks.js — on a tablet send (ctx.nbPageTags) every page carries data-nb-day + data-nb-name; nothing visible changes,
//      paper (no flag) is byte for byte the same, and stripping the two attributes gives the same HTML.
//   B. index.html — the tablet viewer lists the day's pages (+ any-time pages), one tap to each, ✓ when written on, "All done for
//      today"; reads only, never ticks the card; never over the page, never changes the geometry NBT_AUTOCHK uses.
// Run: node test_nbt_today.js
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const nbSrc = fs.readFileSync(path.join(__dirname, "notebooks.js"), "utf8");
let pass = 0, fail = 0;
function ok(c, name, extra) { if (c) { pass++; console.log("  ✓ " + name); } else { fail++; console.log("  ✗ " + name + (extra ? " — " + extra : "")); } }
const DAYS5 = ["monday", "tuesday", "wednesday", "thursday", "friday"];
const KIDNAMES = /\b(lincoln|ellis|lucy|julian|caleb|taylor|makenzie|andrew)\b/i;

// ───────────────────────── A. notebooks.js ─────────────────────────
console.log("A) notebooks.js — every page says its day and name (tablet copy only)");
const nbs = nbSrc.indexOf("  // NBT_TODAY_START"), nbe = nbSrc.indexOf("  // NBT_TODAY_END");
const nbBlk = nbSrc.slice(nbs, nbe);
ok(nbs > 0 && nbe > nbs && nbSrc.split("// NBT_TODAY_START").length === 2 && nbSrc.split("// NBT_TODAY_END").length === 2, "notebooks.js: one NBT_TODAY block");
ok(!KIDNAMES.test(nbBlk) && nbBlk.indexOf("\u{1F500}") < 0, "notebooks.js block: no kid names, no 🔀");
ok(/function nbTag\(ctx, html, day, name\) \{\s*if \(!ctx \|\| !ctx\.nbPageTags \|\|/.test(nbBlk), "nbTag does nothing unless the app asks (ctx.nbPageTags)");
ok(nbBlk.indexOf('/<div class="page"(?! data-nb-day=)/g') > 0, "only a page's own opening tag, once (never page-label / page-body, never twice)");

// load the real library, and a baseline = THIS tree with the NBT_TODAY block swapped for do-nothing stubs (= the call sites removed)
function loadNb(code) { const g = { window: {}, console, setTimeout, Promise }; g.self = g.window; vm.createContext(g); vm.runInContext(code, g); return g.window.HoweNotebooks; }
const STUBS = "  function nbTag(ctx, html) { return html; }\n  function nbTagXp(ctx, html) { return html; }\n  function nbTagUnit(ctx, ins, pages) { return pages; }\n";
const NB = loadNb(nbSrc), NB0 = loadNb(nbSrc.slice(0, nbs) + STUBS + nbSrc.slice(nbe + "  // NBT_TODAY_END".length));
ok(!!NB && !!NB0, "library loads, with and without the block");

// fixtures: every generator, every page kind — units (a card unit ticked Friday with an activity, the US Path ticked Mon + Wed,
// a cover unit with no day), Spelling, Daily Grams, every extra page (some ticked), Lucy's My Words + paper dolls
const dates = { monday: "November 16", tuesday: "November 17", wednesday: "November 18", thursday: "November 19", friday: "November 20" };
const tasks = kid => DAYS5.map((d, i) => ({ id: kid + i, who: kid, day: d, title: "📖 Reading " + i, time: "10:00 AM", mom: "none" }));
const SNAKES = () => ({ unitId: "snakes", title: "Snakes", emoji: "🐍", learning: [{ name: "Corn snake", group: "Colubrid", bio: "A gentle snake.", portrait: { emoji: "🐍" } }], learned: [], next: [{ name: "Boa" }], extras: [],
  activities: [{ key: "draw", title: "Draw a snake", emoji: "🖍", desc: "Draw one.", kind: "sheet", lines: 0, points: 5, steps: ["Pick one", "Draw it"], entries: [], band: "middle" }], days: { friday: true } });
const USP = () => ({ unitId: "us_path", title: "United States Path", emoji: "🇺🇸", learning: [], learned: [], next: [{ name: "American flag" }], extras: [], activities: [],
  us: { stage: 1, label: "Symbols", grade: "4th Grade", cards: [] }, days: { monday: true, wednesday: true } });
const BUGS = () => ({ unitId: "bugs", title: "Backyard Bugs", emoji: "🐞", learning: [{ name: "Bug 1", group: "insect", bio: "Six legs.", portrait: { emoji: "🐞" } }], learned: [], next: [], extras: [], activities: [],
  cover: { title: "Backyard Bugs", emoji: "🐞", days: [{ dn: "Day 1", t: "Look under a log" }], nDays: 1, counts: {} } });
function dgBook() {
  const pages = { day: {}, ans: {} }, dayAns = {};
  for (let d = 1; d <= 12; d++) { pages.day[d] = "data:image/png;base64,DAY" + d; dayAns[d] = [197]; }
  pages.ans[197] = "data:image/png;base64,ANS197";
  return { book: "dgTest", title: "Daily Grams Grade 4", total: 12, cursor: { week: 12, day: 1, adv: 5 }, ansMeta: { 197: { first: 1, last: 12, cont: false } }, dayAns, pages };
}
const XP = { allAboutMe: { on: true, days: { wednesday: true } }, moneyLife: { on: true }, wilderness: { on: true, days: { tuesday: true, thursday: true } }, memoryCivics: { on: true }, notes: { on: true },
  months: { on: true }, thisMonth: { on: true, days: { monday: true } }, myWords: { on: true, days: { thursday: true } }, abc: { on: true, days: { tuesday: true } }, daysSeasons: { on: true }, brainBreaks: { on: true } };
const SPELL = { title: "Spelling", sections: [{ label: "Mon–Tue", lesson: 3, words: ["cat", "hat"] }], practice: ["dog"] };
function mk(kid, extra) {
  return Object.assign({ weekData: { dates, tasks: tasks(kid) }, weekNum: "week12", weekDates: "Nov 16–20, 2026", extraPages: JSON.parse(JSON.stringify(XP)), prevSummary: {}, pace: [],
    units: [SNAKES(), USP(), BUGS()], spelling: JSON.parse(JSON.stringify(SPELL)), nbKidName: "Student", masteryItems: [], reviewCap: 2, bindingMargin: false }, extra || {});
}
const FIX = [
  ["lincoln", { dailyGrams: dgBook() }], ["ellis", { dailyGrams: dgBook() }],
  ["lucy", { dolls: { doll: "data:image/png;base64,D", outfit: "data:image/png;base64,O" } }],
  ["lucy#nospell", { spelling: null, dolls: null }],   // no real Spelling page → her My Words page prints
  ["julian", {}], ["caleb", {}], ["kidp#shark", { notebookTheme: "shark" }], ["kidd#dino", { notebookTheme: "dino" }],
  ["kidz", {}], ["kidz#empty", { units: [], spelling: null }]   // the generic starter notebook, with pages and with none
];
const strip = h => h.replace(/ data-nb-day="[^"]*" data-nb-name="[^"]*"/g, "");
const clone = o => JSON.parse(JSON.stringify(o));
const pageTags = h => { const out = [], re = /<div class="page[" ][^>]*>/g; let m; while ((m = re.exec(h))) { const d = /data-nb-day="([^"]*)"/.exec(m[0]), n = /data-nb-name="([^"]*)"/.exec(m[0]); out.push({ at: m.index, day: d ? d[1] : null, name: n ? n[1].replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&") : null }); } return out; };
const DAYRE = /^(week|last|(monday|tuesday|wednesday|thursday|friday|saturday|sunday)( (monday|tuesday|wednesday|thursday|friday|saturday|sunday))*)$/;
const built = {};
FIX.forEach(([key, extra]) => {
  const kid = key.split("#")[0];
  const on = NB.generate(kid, mk(kid, Object.assign(clone(extra), { nbPageTags: true }))), off = NB.generate(kid, mk(kid, clone(extra))), base = NB0.generate(kid, mk(kid, clone(extra)));
  const baseOn = NB0.generate(kid, mk(kid, Object.assign(clone(extra), { nbPageTags: true })));
  built[key] = on.student;
  const tags = pageTags(on.student);
  ok(tags.length > 0 && tags.every(t => t.day && t.name), key + ": every page (" + tags.length + ") carries data-nb-day and data-nb-name");
  ok(tags.every(t => DAYRE.test(t.day)), key + ": every day value is weekday(s) / week / last", tags.filter(t => !DAYRE.test(t.day)).map(t => t.day).join(","));
  ok(tags.every(t => t.name !== "Page"), key + ": every page is named by its builder (none fell to the catch-all)", tags.filter(t => t.name === "Page").length + " unnamed");
  ok(strip(on.student) === base.student, key + ": attributes stripped → byte-identical to the tree without the block");
  ok(JSON.stringify(off) === JSON.stringify(base) && JSON.stringify(Object.assign({}, on, { student: strip(on.student) })) === JSON.stringify(baseOn), key + ": paper (no flag) unchanged, and the flag changes nothing else (parent, cursors)");
  ok(off.student.indexOf("data-nb-") < 0 && on.parent.indexOf("data-nb-") < 0, key + ": no attribute on paper or in the parent guide");
  const dp = tags.filter(t => t.name === "Daily page");
  if (key !== "kidz" && key !== "kidz#empty") ok(dp.map(t => t.day).join(",") === DAYS5.join(","), key + ": one Daily page per school day, each on its own day", dp.map(t => t.day).join(","));
});
// page kinds and their days
const T = k => pageTags(built[k]);
const has = (k, name, day) => T(k).some(t => t.name === name && (day == null || t.day === day));
["lincoln", "ellis", "lucy", "julian", "caleb", "kidp#shark", "kidz"].forEach(k => {
  ok(has(k, "🐍 Snakes", "friday") && T(k).filter(t => t.name === "🐍 Snakes").every(t => t.day === "friday") && T(k).filter(t => t.name === "🐍 Snakes").length >= 2,
    k + ": the unit ticked Friday → all its pages (this week + the activity) say friday", T(k).filter(t => t.name === "🐍 Snakes").map(t => t.day).join(","));
  ok(has(k, "🇺🇸 United States Path", "monday wednesday") && T(k).filter(t => t.name === "🇺🇸 United States Path").every(t => t.day === "monday wednesday"),
    k + ": the US Path (its stage page too) ticked Mon + Wed lists both days");
  ok(has(k, "🐞 Backyard Bugs", "week"), k + ": a unit with no day ticked → week (its cover page)");
  ok(has(k, "Spelling", "week"), k + ": the Spelling page → week");
});
ok(has("lincoln", "Week overview", "monday") && has("lincoln", "Brain break", "monday") && has("lincoln", "Brain break", "thursday") && !has("lincoln", "Brain break", "friday") && has("lincoln", "Creative page", "friday") && has("lincoln", "End of week", "last"),
  "lincoln: overview + first brain break with Monday, each brain break with the day before it, Creative with Friday, End of week = last");
ok(DAYS5.every(d => has("lincoln", "Daily Grams Grade 4", d)) && DAYS5.every(d => has("ellis", "Daily Grams Grade 4", d)), "lincoln + ellis: each Daily Grams page with its day, named by its book");
ok(has("lincoln", "All About Me", "wednesday") && has("lincoln", "Money & Life Skills", "week") && has("lincoln", "Wilderness Skills", "tuesday thursday") && has("lincoln", "Memory & Civics", "week"),
  "lincoln: extra pages take Mom's day ticks (none → week, two → both)");
ok(has("ellis", "Week overview", "monday") && has("ellis", "Notes", "week") && has("ellis", "Creative page", "friday") && has("ellis", "Brain break", "monday"), "ellis: overview, Notes, brain breaks, Creative page");
ok(has("lucy", "Brain break", "monday") && has("lucy", "Brain break", "thursday") && has("lucy", "Creative page", "friday") && has("lucy", "End of week", "last") && has("lucy", "Week overview", "monday"),
  "lucy: brain breaks on their days, Creative Friday, End of week = last");
ok(has("lucy", "This Month", "monday") && has("lucy", "Months of the Year", "week") && has("lucy", "All About Me", "wednesday") && has("lucy", "Paper doll", "week") && has("lucy", "Blank page", "week"),
  "lucy: extra pages, paper dolls and their blank backs");
ok(has("lucy#nospell", "My Words", "thursday"), "lucy: My Words takes its own day tick");
ok(has("julian", "Cover", "week") && has("julian", "ABC", "tuesday") && has("julian", "Days & Seasons", "week") && has("julian", "This Month", "monday") && has("caleb", "Cover", "week") && has("kidd#dino", "Cover", "week"),
  "Pre-K (Julian, Caleb, themed looks): cover, ABC, Days & Seasons, This Month");
ok(has("kidz#empty", "My notebook", "week"), "generic starter with nothing on: its one page → week");
ok(!/data-nb-name="[^"]*\b(Lincoln|Ellis|Lucy|Julian|Caleb)\b/.test(Object.values(built).join("")), "no kid name in any page name (other families see these)");
// a builder's attribute never lands in visible text, a style, or a label
ok(Object.values(built).every(h => !/>[^<]*data-nb-day/.test(h) && h.split("data-nb-day=").length === h.split("data-nb-name=").length), "attributes only inside page tags, always as a pair");
// binding margin still finds every page (it matches '<div class="page"')
{ const o = NB.generate("lincoln", mk("lincoln", { nbPageTags: true, bindingMargin: true })); const n = pageTags(o.student).length;
  ok((o.student.match(/class="page pg-(front|back)" data-nb-day=/g) || []).length === n, "the prong margin (print only) still marks every page; the attributes ride along"); }

// ───────────────────────── B. index.html ─────────────────────────
console.log("B) index.html — the Today list in the tablet viewer");
const tb = src.indexOf("// NBTABLET_START"), te = src.indexOf("// NBTABLET_END");
const bs = src.indexOf("// NBT_TODAY_START"), be = src.indexOf("// NBT_TODAY_END");
const blk = src.slice(bs, be), code = blk.replace(/\/\/[^\n]*/g, "");   // code = the block without its comments
ok(bs > src.indexOf("// NBT_AUTOCHK_END") && be > bs && be < te && src.split("// NBT_TODAY_START").length === 2 && src.split("// NBT_TODAY_END").length === 2, "one NBT_TODAY block, inside NBTABLET, after NBT_AUTOCHK");
try { new Function(src.slice(tb, te)); ok(true, "NBTABLET parses"); } catch (e) { ok(false, "NBTABLET parses: " + e.message); }
ok(!KIDNAMES.test(blk) && blk.indexOf("\u{1F500}") < 0, "no kid names, no 🔀");
ok(src.split("nbPageTags").length === 2 && /ctx\.bindingMargin=false;   \/\/ no prongs on a tablet\n    ctx\.nbPageTags=true;/.test(src), "only the tablet send asks for the attributes (Print / Look / PDF don't)");
// reads only — no write, no card tick
ok(!/\.(set|update|remove|transaction)\(/.test(code) && !/db\.ref\([^;]*\.push\(/.test(code), "the block writes nothing to the database");
ok((blk.match(/db\.ref\(/g) || []).length === 1 && blk.indexOf('db.ref(nbtInkPath(v.kid,v.wk,p)+"/s/0").once("value")') > 0, "one read: the first stroke of a listed page (not the whole page)");
ok(!/checked|toggleCheck|markDone|completeTask|bankDirect|renderAll/.test(blk), "never ticks or touches the Notebook card (Mom's default)");
ok(/try\{ HA_LS\.setItem\("ha_nbt_today"/.test(blk), "the fold choice is this device's only (local)");
// call sites
ok(src.indexOf("v.meta=nbtTodayMeta(fr.contentDocument,v.days);   // NBT_TODAY") > 0 && src.indexOf("nbtLoadInk(); nbtAcPrep(v); }") > 0, "the viewer reads the pages' days once the document is up (auto-check still armed after)");
ok(src.indexOf("const first=(v.days.indexOf(day)+1)||nbtTodayFirst(v,day); if(!first) return;") > 0, "the day strip still works; a day only a ticked page names is reachable");
ok(src.indexOf('have=NBT_DAYS.filter(d=>v.days.indexOf(d)>=0||nbtTodayHas(v,d))') > 0, "…and shows in the strip");
ok(src.indexOf('btn(nbtTodayOpen(v)?"📋 Today ▾":"📋 Today ▸","nbtTodayToggle()",nbtTodayOpen(v),true)+') > 0, "one button folds the list");
ok(src.indexOf("  nbtTodayRender();   // NBT_TODAY: the list follows every bar repaint") > 0, "the list repaints with the bar (page, day, ink)");
ok(src.indexOf("nbtTodayInked(v,pg,v.strokes.length>0); } }catch(e){}") > 0 && src.indexOf("nbtTodayInked(v,tdPg,tdHas);") > 0, "✓ follows the page's own ink read and each save (the page the save was for)");
ok(src.indexOf("db.ref(nbtInkPath(v.kid,v.wk,v.page)).set({v:1,s:v.strokes,ts:Date.now()})") > 0 && src.indexOf('function nbtInkPath(kid,wk,page){ return "notebookWork/"+kid+"/"+wk+"/"+page; }') > 0, "ink storage unchanged (by page number)");
// layout: never over the page, never inside the page holder
const sh = src.slice(src.indexOf("function nbtShow("), src.indexOf("function nbtPrepDoc("));
const iBody = sh.indexOf('id="nbt-body"'), iToday = sh.indexOf('id="nbt-today"'), iStage = sh.indexOf('id="nbt-stage"'), iHold = sh.indexOf('id="nbt-hold"'), iInk = sh.indexOf('<canvas id="nbt-ink"');
ok(iBody > 0 && iBody < iToday && iToday < iStage && iStage < iHold && iHold < iInk, "markup: the list is a sibling of the stage, before it — not inside the page holder");
ok(sh.indexOf('<canvas id="nbt-ink" style="position:absolute;inset:0;width:100%;height:100%;') > 0, "the ink canvas still covers exactly the page holder");
ok(!/nbt-hold|nbt-ink|nbt-doc|nbt-stage|position:\s*(absolute|fixed)|z-index|(?<!text-)transform/.test(code), "the block never touches the page holder, canvas, frame or stage, and never floats over anything");
ok(/function nbtFitAll\(\)\{[\s\S]*?const w=Math\.max\(200,st\.clientWidth-20\);/.test(src), "the page scale still comes from the stage's own width only");

// run the viewer pieces in a sandbox
const fnOf = (s, name) => { const i = s.indexOf("function " + name + "("); if (i < 0) return ""; const a = s.lastIndexOf("\n", i) + 1; let d = 0; for (let k = s.indexOf("{", i); k < s.length; k++) { if (s[k] === "{") d++; else if (s[k] === "}" && --d === 0) return s.slice(a, k + 1); } return ""; };
const tab = src.slice(tb, te);
const constOf = c => { const i = tab.indexOf("const " + c + "="); return tab.slice(i, tab.indexOf("\n", i)); };
const pieces = [constOf("NBT_DAYS"), constOf("NBT_DAY3"), ["nbtDayOf", "nbtResolveLast", "nbtPageLabel", "nbtPageDays", "nbtPages", "nbtTodayDay", "nbtInkPath", "nbtPt", "nbtAcHit", "nbtAcCanTap", "nbtAcRec"].map(n => fnOf(tab, n)).join("\n"), blk].join("\n");
// a tiny document: the builder's HTML → pages with attributes, their labels and text (what the viewer's DOM calls return)
function fakeDoc(html) {
  const re = /<div class="page-label">([^<]*)<\/div>|<div class="page[" ][^>]*>/g, pages = []; let m, lastLabel = null, lastEnd = -1;
  while ((m = re.exec(html))) {
    if (m[1] !== undefined) { lastLabel = m[1]; lastEnd = re.lastIndex; continue; }
    const attrs = {}; m[0].replace(/([a-z-]+)="([^"]*)"/g, (_, k, v) => { attrs[k] = v.replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&"); });
    const prev = (lastLabel !== null && /^\s*$/.test(html.slice(lastEnd, m.index))) ? { classList: { contains: c => c === "page-label" }, textContent: lastLabel } : { classList: { contains: () => false }, textContent: "" };
    pages.push({ at: m.index, attrs, previousElementSibling: prev, getAttribute: k => (k in attrs ? attrs[k] : null) });
  }
  pages.forEach((p, i) => { p.textContent = html.slice(p.at, i + 1 < pages.length ? pages[i + 1].at : undefined).replace(/<style[\s\S]*?<\/style>/g, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(); });
  return { querySelectorAll: () => pages };
}
function elem() { return { style: { cssText: "" }, innerHTML: "" }; }
const els = { "nbt-today": elem(), "nbt-body": elem() };
const store = {}, reads = [];
const G = { console, window: { innerWidth: 1200 }, document: { getElementById: id => els[id] || null }, HA_LS: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); } },
  cap: s => String(s || "").charAt(0).toUpperCase() + String(s || "").slice(1), wbMomEyes: () => false, notebookSettings: {}, nbtView: null, nbtGo: async () => {}, nbtBarRender: () => {},
  db: { ref: p => ({ once: () => { reads.push(p); return Promise.resolve({ val: () => (/\/(3|5)\/s\/0$/.test(p) ? { c: "#00f" } : null) }); } }) } };
vm.createContext(G); vm.runInContext(pieces.replace(/\bconst (NBT_DAYS|NBT_DAY3|NBT_TODAY_WIDE)=/g, "var $1=").replace("let nbtView", "var nbtView") + "\nthis.R={nbtTodayMeta,nbtTodayList,nbtTodayDone,nbtTodayIsInked,nbtTodayInked,nbtPageDays,nbtTodayRender,nbtTodayToggle,nbtTodayOpen,nbtTodayFirst,nbtTodayHas,nbtTodayLabelName,nbtPt,nbtAcHit};", G);
const R = G.R;
const metaOf = html => { const doc = fakeDoc(html); return R.nbtTodayMeta(doc, R.nbtPageDays(doc)); };
const names = (meta, list) => list.map(p => meta[p - 1].name);

// the unit ticked Friday
{ const meta = metaOf(built.lincoln), fri = R.nbtTodayList(meta, "friday"), mon = R.nbtTodayList(meta, "monday");
  ok(names(meta, fri.mine).indexOf("🐍 Snakes") >= 0 && names(meta, mon.mine).indexOf("🐍 Snakes") < 0 && names(meta, mon.week).indexOf("🐍 Snakes") < 0, "the unit ticked for Friday is in Friday's list, not Monday's (nor in any-time)");
  ok(["Daily page", "Daily Grams Grade 4", "Creative page", "End of week"].every(n => names(meta, fri.mine).indexOf(n) >= 0), "Friday's list: its daily page, Daily Grams, Creative page, End of week", names(meta, fri.mine).join(" | "));
  ok(fri.mine.every((p, i) => !i || p > fri.mine[i - 1]), "in book order");
  ok(names(meta, mon.mine).indexOf("🇺🇸 United States Path") >= 0 && names(meta, R.nbtTodayList(meta, "wednesday").mine).indexOf("🇺🇸 United States Path") >= 0 && names(meta, R.nbtTodayList(meta, "tuesday").mine).indexOf("🇺🇸 United States Path") < 0, "a unit ticked Mon + Wed is in both lists, not Tuesday's");
  ok(names(meta, mon.week).indexOf("🐞 Backyard Bugs") >= 0 && names(meta, mon.week).indexOf("Spelling") >= 0 && names(meta, mon.week).indexOf("Money & Life Skills") >= 0, "any-time group: the unticked unit, Spelling, unticked extra pages");
  ok(fri.mine.concat(fri.week).every(p => meta[p - 1].tagged), "a tagged week reads its tags (no guessing)");
  ok(meta.filter(m => m.days.indexOf("friday") >= 0).some(m => m.name === "End of week"), "\"last\" resolves to the last school day"); }

// weeks sent before NBT_TODAY (no attributes): today's label guess, no errors
FIX.forEach(([key, extra]) => {
  const kid = key.split("#")[0], old = NB0.generate(kid, mk(kid, clone(extra))).student, doc = fakeDoc(old);
  let meta, err = null; try { meta = R.nbtTodayMeta(doc, R.nbtPageDays(doc)); } catch (e) { err = e; }
  const guess = R.nbtPageDays(doc);
  ok(!err && meta.length === guess.length && meta.every((m, i) => !m.tagged && m.days.length === 1 && m.days[0] === (guess[i] === "any" ? "week" : guess[i]) && m.name), key + ": an old copy falls back to the label guess, cleanly");
});
{ const meta = metaOf(NB0.generate("lincoln", mk("lincoln")).student);
  ok(names(meta, R.nbtTodayList(meta, "friday").mine).indexOf("Snakes") < 0 && names(meta, R.nbtTodayList(meta, "friday").week).indexOf("Snakes") >= 0, "old copy: the unit is under any time, named from its label (as before this change)"); }
ok(JSON.stringify(R.nbtTodayMeta(null, null)) === "[]" && JSON.stringify(R.nbtTodayMeta({ querySelectorAll: () => { throw new Error("x"); } }, [])) === "[]", "a broken document gives an empty list, never an error");
ok(R.nbtTodayLabelName("Unit Study — Snakes (1/2)") === "Snakes" && R.nbtTodayLabelName("Daily Page — Monday") === "Daily Page" && R.nbtTodayLabelName("") === "", "label → short name for old copies");

// ✓ and "All done for today"
{ const meta = [{ days: ["friday"], name: "Daily page" }, { days: ["week"], name: "Spelling" }, { days: ["friday"], name: "🐍 Snakes" }];
  const L = R.nbtTodayList(meta, "friday");
  const v = { page: 2, strokes: [], inked: {} };
  ok(L.mine.join() === "1,3" && L.week.join() === "2", "list: Friday's own + ticked pages, then any-time");
  ok(!R.nbtTodayDone(v, L), "nothing written → not done");
  R.nbtTodayInked(v, 1, true); ok(R.nbtTodayIsInked(v, 1) && !R.nbtTodayDone(v, L), "one page written → ✓ on it, not done yet");
  v.page = 3; v.strokes = [{ p: [[0.1, 0.1]] }]; ok(R.nbtTodayIsInked(v, 3) && R.nbtTodayDone(v, L), "writing on the page on screen counts (before the save lands) → All done");
  v.strokes = []; R.nbtTodayInked(v, 3, false); ok(!R.nbtTodayDone(v, L), "cleared and saved → not done again");
  ok(!R.nbtTodayDone(v, R.nbtTodayList(meta, "saturday")), "a day with no pages is never 'done'");
  R.nbtTodayInked(v, 3, true); ok(!R.nbtTodayIsInked(v, 2) && R.nbtTodayDone(v, L), "any-time pages don't hold up today's done"); }

// the rendered list (wide: beside the page; narrow: a strip above it)
(async () => {
  const meta = metaOf(built.lincoln), fri = R.nbtTodayList(meta, "friday");
  const v = { kid: "kid1", wk: "week12", page: fri.mine[0], day: "friday", ready: true, meta, strokes: [], inked: {}, n: meta.length };
  G.nbtView = v; vm.runInContext("nbtView=this.nbtView", G);
  R.nbtTodayRender(); await new Promise(r => setTimeout(r, 5)); R.nbtTodayRender();
  const h = els["nbt-today"].innerHTML;
  ok(els["nbt-body"].style.flexDirection === "row" && /width:214px/.test(els["nbt-today"].style.cssText), "wide screen: the list sits beside the page");
  ok(/Today · Friday|Friday/.test(h) && h.indexOf("Any time this week") > 0 && h.indexOf("🐍 Snakes") > 0, "the list shows the day's header, the unit, and the any-time group");
  ok(fri.mine.every(p => h.indexOf("nbtTodayGo(" + p + ")") > 0), "one tap per row goes to that page");
  ok(reads.length > 0 && reads.every(p => /^notebookWork\/kid1\/week12\/\d+\/s\/0$/.test(p)) && new Set(reads).size === reads.length, "✓ comes from one-stroke reads, each page asked once");
  const inkedRows = Object.keys(v.inked).filter(p => v.inked[p]).map(Number);
  ok(inkedRows.join() === [3, 5].filter(p => fri.mine.concat(fri.week).indexOf(p) >= 0).join(), "pages with saved writing are ✓", inkedRows.join());
  ok(h.indexOf("All done") < 0, "not every Friday page written → no 'All done'");
  fri.mine.forEach(p => R.nbtTodayInked(v, p, true)); R.nbtTodayRender();
  ok(els["nbt-today"].innerHTML.indexOf("🎉 All done for") > 0, "every Friday page written → 'All done'");
  G.window.innerWidth = 800; R.nbtTodayRender();
  ok(els["nbt-body"].style.flexDirection === "column" && /max-height:24vh/.test(els["nbt-today"].style.cssText) && !/width:/.test(els["nbt-today"].style.cssText.replace(/max-height/, "")), "narrow screen: a strip above the page (the stage keeps its full width → the page scale doesn't move)");
  ok(R.nbtTodayOpen(v) && !("ha_nbt_today" in store), "open by default, on any screen, until this device folds it");
  R.nbtTodayToggle(); R.nbtTodayRender();
  ok(store.ha_nbt_today === "0" && els["nbt-today"].style.display === "none" && els["nbt-today"].innerHTML === "", "one button folds it away (remembered on this device)");
  R.nbtTodayToggle(); ok(store.ha_nbt_today === "1" && R.nbtTodayOpen(v), "…and back");
  v.day = "saturday"; R.nbtTodayRender(); ok(els["nbt-today"].innerHTML.indexOf("No pages for Saturday") > 0 && els["nbt-today"].innerHTML.indexOf("Any time this week") > 0, "another day with no pages says so, any-time pages still listed");
  v.day = "any"; R.nbtTodayRender(); ok(els["nbt-today"].innerHTML.indexOf("Any time this week") >= 0 && els["nbt-today"].innerHTML.indexOf("All done") < 0, "the strip's Any button shows the any-time group");
  ok(R.nbtTodayFirst(v, "friday") === fri.mine[0] && R.nbtTodayHas(v, "friday") && !R.nbtTodayHas(v, "saturday"), "the strip's day buttons jump to that day's first listed page");
  v.ready = false; R.nbtTodayRender(); ok(els["nbt-today"].style.display === "none", "nothing shows before the pages are ready");

  // NBT_AUTOCHK geometry: the same printed letter circle is hit whether the list is open (smaller page) or folded (bigger page)
  const arm = { slot: "q1", day: "monday", item: {}, block: {}, t: "", rects: [{ l: "A", x: 100, y: 600, w: 18, h: 18 }, { l: "B", x: 100, y: 630, w: 18, h: 18 }] };
  const av = { ready: true, page: 2, kid: "kid1", wk: "week12", ac: { 2: [arm] } };
  const hitAt = (k, left, top, px, py) => { const cv = { getBoundingClientRect: () => ({ left, top, width: 816 * k, height: 1056 * k }) }; const p = R.nbtPt({ clientX: left + px * k, clientY: top + py * k }, cv); const h2 = R.nbtAcHit(av, p); return h2 ? h2.l : null; };
  const kOpen = (1200 - 214 - 20) / 816, kShut = (1200 - 20) / 816;
  ok(hitAt(kOpen, 224, 60, 109, 639) === "B" && hitAt(kShut, 10, 60, 109, 639) === "B" && hitAt(kOpen, 224, 60, 109, 609) === "A" && hitAt(kShut, 10, 60, 109, 609) === "A" && hitAt(kOpen, 224, 60, 300, 300) === null,
    "auto-check: a tap on a letter circle hits the same letter with the list open or folded (page units, not screen pixels)");
  // the strip leaves the stage width alone, so nbtFitAll's scale is the same open or folded on a narrow screen
  const fit = fnOf(tab, "nbtFitAll"); const kFor = cw => { const st = { clientWidth: cw }, hold = { style: {} }, fr = { style: {} }; const g2 = { document: { getElementById: id => ({ "nbt-stage": st, "nbt-hold": hold, "nbt-doc": fr })[id] || null }, nbtFitCanvas: () => false, nbtPaint: () => {}, nbtTodayFitCheck: () => {} }; vm.createContext(g2); vm.runInContext(fit + "\nnbtFitAll();", g2); return hold.style.width; };
  ok(fit.indexOf("clientHeight") < 0 && fit.indexOf("innerHeight") < 0 && kFor(800) === Math.round(816 * Math.min(780 / 816, 1.6)) + "px",
    "narrow screen: the page size reads only the stage's width, which a strip above it doesn't change — same holder open or folded (" + kFor(800) + ")");

  console.log("\n" + pass + " passed, " + fail + " failed");
  process.exit(fail ? 1 : 0);
})().catch(e => { console.log("  ✗ crashed: " + (e && e.stack || e)); process.exit(1); });
