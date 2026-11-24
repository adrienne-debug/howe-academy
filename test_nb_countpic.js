// 🔢 What the Pre-K number card counts — a per-kid setting for ANY look (NB_COUNTPIC, looks study §4 row 4 / §17 q3; her answer
// 2026-11-24: "Make it a setting"). Run: node test_nb_countpic.js          (add --measure to measure the pages in Google Chrome)
//   • nothing saved → every Pre-K look, every kid's own Pre-K look and every school-age notebook prints byte for byte what it
//     printed before; the plan card, the trouble card's decks, the dinosaur planner and the look card's options are unchanged
//     (baseline = THIS tree with the NB_COUNTPIC block and its call sites taken out, built here — no git, no pinned commit)
//   • each choice on each look, with and without a Mastery counting picture: the daily number card counts the right thing, the
//     guide's Number of the Day row names it, and the week's plan rows + the trouble card's decks agree with the page
//   • the app (index.html NB_COUNTPIC): Mom only, ONE targeted field (set, or remove at the look's own rule), dry-run inert,
//     mirrored to ha_nb_settings; one control, in the look card, only for a notebook with a number card
//   • page fit (--measure): the daily pages and the guide for both choices on every look, in Google Chrome headless
const fs = require("fs"), path = require("path"), os = require("os");
const file = path.join(__dirname, "notebooks.js");
const src = fs.readFileSync(file, "utf8");
const html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
let pass = 0, fail = 0;
function ok(c, name, d) { if (c) { pass++; console.log("  ✓ " + name); } else { fail++; console.log("  ✗ " + name + (d ? "  → " + d : "")); } }
const load = (code) => { const w = {}; new Function("window", code)(w); return w.HoweNotebooks; };
const J = (v) => JSON.stringify(v);

// ── the baseline: this tree with the setting cut out ────────────────────────────────────────────────────────────────────
const S = "  // NB_COUNTPIC_START", E = "  // NB_COUNTPIC_END\n";
const UNDO = [
  ['(ctx.countPic === "animal" || ctx.countPic === "picture") ? pkPlanSubs(pkCountPicLook(ctx), ctx) : ["letters", "numbers", "shapes", "colors", "animals"]', '["letters", "numbers", "shapes", "colors", "animals"]'],
  ['    // NB_COUNTPIC: generatePreK passes {pic} — the one answer (pkCountPic) to "what does the number card count"; "" = the animal.\n' +
   '    var countVis = juCountVisual(n, (countEmoji && typeof countEmoji === "object") ? (countEmoji.pic || aemoji)\n      : T.countEmoji ?',
   '    var countVis = juCountVisual(n, T.countEmoji ?'],
  ['    var countPic = pkCountPic(T, ctx);   // NB_COUNTPIC: what the number card counts — the page, the guide and the plan all ask this\n', ''],
  ['days.length, pkPlanSubs(T, ctx)); _pl.days', 'days.length, pkPlanSubs(T)); _pl.days'],
  ['T, lv, countPic), days[i], "Daily page"', 'T, lv, ctx.countEmoji), days[i], "Daily page"'],
  ['pkCountPicGuide(T, countPic), picks, lv)', 'T, picks, lv)'],
  ['function pkPlanSubs(T, ctx) { return pkCountPic(T, ctx).counts === "picture" ? PK_PLAN_SUBS', 'function pkPlanSubs(T) { return (T && T.countEmoji) ? PK_PLAN_SUBS'],
  ['pkPlanSubs(T, opt).map(', 'pkPlanSubs(T).map('],
  ['    countPicFor: nbCountPicFor,         // NB_COUNTPIC: what this kid\'s number card counts (Notebook tab look card)\n', '']
];
let base = src.slice(0, src.indexOf(S)) + src.slice(src.indexOf(E) + E.length);
ok(src.split(S).length === 2 && src.split(E).length === 2, "notebooks.js has one NB_COUNTPIC block");
UNDO.forEach(([n, o], i) => { const c = base.split(n).length - 1; ok(c === 1, "call site " + (i + 1) + " found once", c + "×"); base = base.split(n).join(o); });
base = base.replace(/   \/\/ NB_COUNTPIC\n/g, "\n");
ok(!/countPic|NB_COUNTPIC/i.test(base), "the baseline has no trace of the setting left");
const NB = load(src), OLD = load(base), I = NB._internal;

// ── fixtures (no family or child names: kids come from the notebook catalog, a made-up id for a picked look) ───────────
const GEN = NB.GENERATORS, ALL = Object.keys(GEN);
const NATIVE = ALL.filter(k => GEN[k].prek), OLDER = ALL.filter(k => !GEN[k].prek);
const LOOKS = Object.keys(NB.themes), KID = "kid9";
const dates = { monday: "November 9, 2026", tuesday: "November 10, 2026", wednesday: "November 11, 2026", thursday: "November 12, 2026", friday: "November 13, 2026" };
const mi = (subject, prompts, extra) => prompts.map((p, i) => Object.assign({ subject, prompt: String(p), tier: "daily" }, (extra || {})[i] || {}));
const AZ = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const items = [].concat(mi("Letters", AZ, { 2: { recentMiss: 2 } }), mi("Lowercase", AZ.map(l => l.toLowerCase())),
  mi("Numbers", [11, 12, 13, 14, 15, 16, 17, 18, 19, 20], { 9: { status: "introduction" } }), mi("Shapes", ["Circle", "Square", "Triangle", "Rectangle"]),
  mi("Colors", ["Red", "Blue", "Yellow", "Green", "Orange"]), mi("Animals", ["Lion", "Giraffe", "Zebra", "Elephant", "Penguin"], { 1: { recentMiss: 2 } }));
const base0 = (extra) => Object.assign({ weekNum: "week30", weekDates: "Nov 9–13, 2026", weekData: { dates, tasks: [] }, masteryItems: [], extraPages: {}, reviewCap: 2 }, extra || {});
const LV = [["no switches", {}], ["little letters + find it + teens", { nbLowercase: true, nbFindIt: true, nbTeens: true }], ["find it + teens", { nbFindIt: true, nbTeens: true }]];
const EX = [["empty decks", {}], ["full decks", { masteryItems: items, teachNotes: "Short day." }], ["full decks · 41–45", { masteryItems: items, weekNum: "week36", numberCursor: { week: 35, from: 40, adv: 5 } }],
  ["full decks · own picture 🚒", { masteryItems: items, countEmoji: "🚒" }], ["empty decks · own picture 🦈", { countEmoji: "🦈" }]];
// every Pre-K build: a made-up kid on each look; each catalog Pre-K kid on its own look and on each look
const SPECS = [];
LOOKS.forEach(l => SPECS.push({ kid: KID, look: l, name: KID + " on " + l }));
NATIVE.forEach(k => { SPECS.push({ kid: k, look: "", name: k + " (own look)" }); LOOKS.forEach(l => SPECS.push({ kid: k, look: l, name: k + " on " + l })); });
const ctxOf = (sp, lv, ex, more) => base0(Object.assign({ kidName: "Sam", notebookTheme: sp.look || null, nbLevel: lv }, ex, more || {}));

// ── 1. nothing saved = byte for byte ────────────────────────────────────────────────────────────────────────────────────
let same = 0, diffs = [];
SPECS.forEach(sp => LV.forEach(lv => EX.forEach(ex => [undefined, null, "", "bogus"].forEach(cp => {
  const c = ctxOf(sp, lv[1], ex[1]); const c2 = Object.assign({}, c); if (cp !== undefined) c2.countPic = cp;
  const a = J(NB.generate(sp.kid, c2)), b = J(OLD.generate(sp.kid, c));
  const pa = J(NB.planFor(sp.kid, c2)), pb = J(OLD.planFor(sp.kid, c));
  const ra = J(NB.reviewDecks(sp.kid, c2)), rb = J(OLD.reviewDecks(sp.kid, c));
  const ja = J(NB.juPlanPreview(c2)), jb = J(OLD.juPlanPreview(c));
  if (a === b && pa === pb && ra === rb && ja === jb) same++; else diffs.push(sp.name + " · " + lv[0] + " · " + ex[0] + " · countPic=" + cp);
}))));
ok(!diffs.length && same === SPECS.length * LV.length * EX.length * 4, "nothing saved (no field, null, blank, unknown): " + same + " Pre-K builds — notebook, guide, cursors, plan card, trouble decks and dinosaur planner byte for byte", diffs.slice(0, 3).join(" | "));
let older = 0;
OLDER.concat([KID]).forEach(k => ["animal", "picture", undefined].forEach(cp => [{}, { countEmoji: "🚒" }].forEach(ex => {
  const c = base0(Object.assign({ nbKidName: k }, ex)), c2 = Object.assign({}, c, cp ? { countPic: cp } : {});
  let a, b; try { a = J(NB.generate(k, c2)); } catch (e) { a = "threw " + e.message; } try { b = J(OLD.generate(k, c)); } catch (e) { b = "threw " + e.message; }
  if (a === b && J(NB.reviewDecks(k, c2)) === J(OLD.reviewDecks(k, c)) && J(NB.notebookOptions(k, c2)) === J(OLD.notebookOptions(k, c))) older++;
})));
ok(older === (OLDER.length + 1) * 6, "every school-age notebook and the starter notebook: byte for byte whatever is saved (" + older + " builds)");
ok(LOOKS.every(l => J(NB.notebookOptions(KID, { notebookTheme: l, countPic: "picture" })) === J(OLD.notebookOptions(KID, { notebookTheme: l }))), "the look card's options (looks, level switches, extra pages) are unchanged");

// ── 2. each choice on each look ─────────────────────────────────────────────────────────────────────────────────────────
const dailyPages = (student) => student.split('<div class="page-label">').filter(p => /class="ten-frame"/.test(p) && /Number of the Day|Practice Again 🔁 ·/.test(p));
const counted = (pg) => { const s = new Set(); const re = /class="tf-cell on"[^>]*>([^<]*)<\/div>/g; let m; while ((m = re.exec(pg))) s.add(m[1]); return [...s]; };
const lookT = (sp, c) => { const s = I.pkSpec(sp.kid, c); return s.T || NB.themes[s.key].theme(c, s.L); };
let cases = 0, bad = [];
SPECS.forEach(sp => LV.forEach(lv => [["animal"], ["picture"]].forEach(([choice]) => [null, "🚒"].forEach(own => {
  const c = ctxOf(sp, lv[1], { masteryItems: items }, { countPic: choice, countEmoji: own });
  const T = lookT(sp, c), lookPic = T.countEmoji || "";
  const wantPic = choice === "picture" ? (own || lookPic) : "";   // "" = the animal of the day
  const out = NB.generate(sp.kid, c), pages = dailyPages(out.student);
  // the animal of each day, from the same week built on "animal" (the plan that lists it)
  const animalPlan = (NB.planFor(sp.kid, Object.assign({}, c, { countPic: "animal" })) || NB.juPlanPreview(Object.assign({}, c, { countPic: "animal" })));
  // the dinosaur notebook's own planner (no planFor) draws each animal with its own pictures, so on another look it can show 🦕
  // for a 🐧 (same animal, by name) — there the day's animal is read by name from the planner and by picture from the page
  const ownPlanOnOtherLook = !NB.planFor(sp.kid, c) && !!sp.look;
  const animalPages = dailyPages(NB.generate(sp.kid, Object.assign({}, c, { countPic: "animal" })).student).map(p => counted(p)[0]);
  const aSlots = ownPlanOnOtherLook ? animalPages : ((animalPlan.subjects.animals || {}).slots || []).map(s => s.swatch);
  if (ownPlanOnOtherLook && ((animalPlan.subjects.animals || {}).slots || []).length !== animalPages.length) bad.push(sp.name + ": planner animal days ≠ page days");
  const plan = NB.planFor(sp.kid, c) || NB.juPlanPreview(c);
  const decks = NB.reviewDecks(sp.kid, c).decks.map(d => d.deck);
  const cp = NB.countPicFor(sp.kid, c);
  const why = sp.name + " · " + lv[0] + " · " + choice + " · own " + (own || "none");
  const errs = [];
  if (!pages.length) errs.push("no daily page");
  pages.forEach((pg, i) => { const got = counted(pg); const want = wantPic || aSlots[i]; if (!(got.length === 1 && got[0] === want)) errs.push("day " + (i + 1) + " counts " + got.join("") + ", wanted " + want); });
  const animalsOnPaper = !wantPic;
  if (!!plan.subjects.animals !== animalsOnPaper) errs.push("plan Animals row " + !!plan.subjects.animals);
  if (decks.includes("Animals") !== animalsOnPaper) errs.push("trouble decks " + decks.join(","));
  if (!cp || cp.counts !== (wantPic ? "picture" : "animal") || cp.pic !== wantPic || cp.choice !== choice || cp.fallback !== (choice === "picture" && !wantPic)) errs.push("countPicFor " + J(cp));
  // the guide's Number of the Day row (a kid's own legacy guide says "picture", true of both)
  const m = /Touch and count each (.+?)(?: out loud|\.)/.exec(out.parent), word = m && m[1];
  const lookWord = (T.guide || {}).countWord || "picture", lookCounts = lookPic ? "picture" : "animal";
  const wantWord = (T.parent && /Number of the Day<\/span> — Touch and count each picture\./.test(out.parent)) ? "picture"
    : (wantPic ? "picture" : "animal") === lookCounts ? lookWord : (wantPic ? "picture" : "animal");
  if (word !== wantWord) errs.push("guide says “" + word + "”, wanted “" + wantWord + "”");
  cases++; if (errs.length) bad.push(why + ": " + errs.join("; "));
}))));
ok(!bad.length, "each choice × each look × with/without a counting picture × 3 levels (" + cases + " builds): the number card, the guide row, the plan rows and the trouble decks all agree", bad.slice(0, 4).join(" | "));
// spot checks, in words
const dino = (x) => ctxOf({ kid: KID, look: LOOKS.find(l => !lookT({ kid: KID, look: l }, ctxOf({ kid: KID, look: l }, {}, {})).countEmoji) }, {}, { masteryItems: items }, x);
const cons = (x) => ctxOf({ kid: KID, look: LOOKS.find(l => lookT({ kid: KID, look: l }, ctxOf({ kid: KID, look: l }, {}, {})).countEmoji) }, {}, { masteryItems: items }, x);
ok(dailyPages(NB.generate(KID, dino({ countPic: "picture", countEmoji: "🚒" })).student).every(p => J(counted(p)) === J(["🚒"])), "a look that counts animals, on “picture”: every number card counts the kid's own picture");
ok(dailyPages(NB.generate(KID, cons({ countPic: "animal", countEmoji: "🚒" })).student).every(p => counted(p).length === 1 && counted(p)[0] !== "🚒" && counted(p)[0] !== "🚜"), "the look with its own picture, on “animal”: every number card counts the animal of the day");
ok(NB.countPicFor(KID, dino({ countPic: "picture" })).fallback === true && dailyPages(NB.generate(KID, dino({ countPic: "picture" })).student).every(p => counted(p).length === 1 && counted(p)[0] !== ""), "“picture” with no counting picture: the animal is counted (never an empty frame) and the app is told (fallback)");
ok(NB.countPicFor(KID, cons({ countPic: "picture" })).pic === "🚜" && NB.countPicFor(KID, cons({})).choice === "picture" && NB.countPicFor(KID, dino({})).choice === "animal", "the look's own rule is the default (construction: its own 🚜 when the kid has none)");
ok(OLDER.every(k => NB.countPicFor(k, { countPic: "picture" }) === null) && NB.countPicFor(KID, {}) === null, "no number card (school-age or starter notebook) = no answer, so no control");

// ── 3. the app: one control, one targeted write ─────────────────────────────────────────────────────────────────────────
const HS = "// NB_COUNTPIC_START", HE = "// NB_COUNTPIC_END";
ok(html.split(HS).length === 2 && html.split(HE).length === 2, "index.html has one NB_COUNTPIC block");
const hblock = html.slice(html.indexOf(HS), html.indexOf(HE));
const outside = html.slice(0, html.indexOf(HS)) + html.slice(html.indexOf(HE));
ok(!/countPic"\)\.(set|remove)|\/countPic/.test(outside) && (hblock.match(/"\/countPic"/g) || []).length === 1, "the only write of countPic is in the block (one path)");
ok((outside.match(/nbSetCountPic\(/g) || []).length === 0 && (outside.match(/nbCountPicCardHtml\(/g) || []).length === 1, "one control: the card is drawn from one place, and nothing outside the block saves the choice");
const lookCard = html.slice(html.indexOf('lookHtml=\'<div id="nblook-card"'), html.indexOf("// Week switcher — only when a next week"));
ok(/nbNameCardHtml\(sel,lookOpts\)\+[^\n]*\n\s*\(\(typeof nbCountPicCardHtml==="function"\)\?nbCountPicCardHtml\(sel\):""\)\+/.test(lookCard), "the control sits in the Notebook tab's 🎨 look card, right after the name (its own line)");
ok(/return \{ nbKidName:cap\(kid\),[^\n]*reviewCap:nbReviewCap\(kid\), countPic:\(\(typeof nbCountPicOf==="function"\)\?nbCountPicOf\(kid\):null\), personal:/.test(html), "haNbContext passes ctx.countPic (the same reader the card uses)");
ok(/N\.reviewDecks\(kid,\{[\s\S]{0,200}?countPic:\(\(typeof nbCountPicOf==="function"\)\?nbCountPicOf\(kid\):null\), countEmoji:\(\(typeof nbCountPicOwn==="function"\)\?nbCountPicOwn\(kid\):null\) \}\)/.test(html), "the trouble card asks with the same setting and picture");
ok(/mastSetCountEmoji/.test(html) && !/count_emoji"\)\.set|count_emoji=/.test(hblock), "the counting picture itself is not set here (its home stays the unit row's “Counts”)");
ok(!html.includes("\u{1F500}"), "no 🔀 in index.html");

function sandbox(o) {
  o = o || {};
  const ops = [], ls = {};
  const env = {
    window: { HoweNotebooks: NB }, ops, ls,
    momHere: () => o.mom !== false, _dryRun: () => !!o.dry, tab: "notebook", renders: 0,
    notebookSettings: JSON.parse(J(o.ns || {})), masteryData: o.md || {}, unitStudies: o.units || {},
    HA_LS: { setItem: (k, v) => { ls[k] = v; } },
    db: o.noDb ? null : { ref: (p) => ({ set: (v) => ops.push(["set", p, v]), remove: () => ops.push(["remove", p]), update: (v) => ops.push(["update", p, v]) }) },
    document: { getElementById: () => ({}) },
    esc: (v) => String(v == null ? "" : v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;"),
    cap: (k) => String(k).charAt(0).toUpperCase() + String(k).slice(1),
    nbThemeOf: (k) => (o.look != null ? o.look : null), nbLevelOf: () => ({})
  };
  env.renderNotebook = () => { env.renders++; };
  const names = Object.keys(env).filter(k => k !== "ops" && k !== "ls" && k !== "renders");
  const fns = new Function(names.join(","), hblock + "\nreturn {nbCountPicOf,nbCountPicOwn,nbCountPicInfo,nbCountPicCardHtml,nbSetCountPic,nbCountPicWhere,get ns(){return notebookSettings;}};");
  return Object.assign(env, fns.apply(null, names.map(k => env[k])));
}
const animalLook = LOOKS.find(l => !NB.themes[l].theme({}, {}).countEmoji), picLook = LOOKS.find(l => NB.themes[l].theme({}, {}).countEmoji);
let sb = sandbox({ look: animalLook, md: { [KID + "_settings"]: { count_emoji: "🚒" } } });
sb.nbSetCountPic(KID, "picture");
ok(J(sb.ops) === J([["set", "notebookSettings/" + KID + "/countPic", "picture"]]) && sb.ns[KID].countPic === "picture" && JSON.parse(sb.ls.ha_nb_settings)[KID].countPic === "picture", "Mom picks “picture” on a look that counts animals → ONE targeted set, mirrored to ha_nb_settings");
sb.ops.length = 0; sb.nbSetCountPic(KID, "animal");
ok(J(sb.ops) === J([["remove", "notebookSettings/" + KID + "/countPic"]]) && !("countPic" in sb.ns[KID]) && !("countPic" in JSON.parse(sb.ls.ha_nb_settings)[KID]), "back to the look's own rule → the field is removed (nothing saved again)");
sb = sandbox({ look: picLook });
sb.nbSetCountPic(KID, "animal"); sb.nbSetCountPic(KID, "picture");
ok(J(sb.ops) === J([["set", "notebookSettings/" + KID + "/countPic", "animal"], ["remove", "notebookSettings/" + KID + "/countPic"]]), "on the look with its own picture: “animal” is set, “picture” is its default → removed");
sb = sandbox({ look: animalLook, mom: false });
sb.nbSetCountPic(KID, "picture");
ok(!sb.ops.length && !sb.ns[KID] && !sb.ls.ha_nb_settings && sb.nbCountPicCardHtml(KID) === "", "not Mom: no write, nothing saved locally, no control");
sb = sandbox({ look: animalLook, dry: true });
sb.nbSetCountPic(KID, "picture");
ok(!sb.ops.length && sb.ns[KID].countPic === "picture", "?dryrun=1: no database write (the screen still follows)");
sb = sandbox({ look: animalLook, noDb: true });
let threw = false; try { sb.nbSetCountPic(KID, "picture"); } catch (e) { threw = true; }
ok(!threw && sb.ns[KID].countPic === "picture", "no database: saves locally, no throw");
sb = sandbox({ look: animalLook });
sb.nbSetCountPic(KID, "tractor"); sb.nbSetCountPic(OLDER[0], "picture");
const sb0 = sandbox({}); sb0.nbSetCountPic("kid8", "picture");   // no look, not Pre-K = the starter notebook
ok(!sb0.ops.length && !sb0.ns.kid8, "the starter notebook (no number card) → nothing written");
ok(!sb.ops.length && !sb.ns[KID] && !sb.ns[OLDER[0]], "an unknown value, or a kid with no number card → nothing written");
ok(OLDER.every(k => sandbox({}).nbCountPicCardHtml(k) === "") && sandbox({}).nbCountPicCardHtml("kid8") === "", "no control for a notebook with no number card (school-age, starter)");
// what the card shows
const units = { u1: { id: "u1", title: "Math Fluency Path", decks: [{ key: "Counting" }], kidStage: { [KID]: { stage: 1 } } } };
let card = sandbox({ look: animalLook, md: { [KID + "_settings"]: { count_emoji: "🚒" } }, units }).nbCountPicCardHtml(KID);
ok(/🔢 Number card counts/.test(card) && /◉ the animal of the day/.test(card) && /○ Kid9’s counting picture 🚒/.test(card) && !/no counting picture yet/.test(card), "card: the roster name, the kid's actual picture, the look's rule ticked");
ok(/chosen on Units ▸ Math Fluency Path ▸ Kid9’s row ▸ “Counts”/.test(card), "card: names where the counting picture is chosen (the unit row's “Counts”)");
card = sandbox({ look: animalLook, ns: { [KID]: { countPic: "picture" } } }).nbCountPicCardHtml(KID);
ok(/◉ Kid9’s counting picture</.test(card) && /Kid9 has no counting picture yet, so the number card counts the animal of the day/.test(card) && /once Kid9 is on a stage there/.test(card), "card: “picture” with none chosen says the animal is counted until one is");
card = sandbox({ look: picLook }).nbCountPicCardHtml(KID);
ok(/○ the animal of the day/.test(card) && /◉ Kid9’s counting picture 🚜/.test(card), "card on the look with its own picture: shows what prints (🚜) and ticks it");
ok((card.match(/onclick="nbSetCountPic\(/g) || []).length === 2, "card: two choices, each one tap");

// ── 4. page fit ─────────────────────────────────────────────────────────────────────────────────────────────────────────
// Measured 2026-11-24 with `node test_nb_countpic.js --measure` (Google Chrome headless, notebooks built IN the browser so the
// emoji-to-image swap and the print fit are in): every look + each catalog Pre-K kid's own look × both choices × 3 level
// settings × 3 weeks (11–20, 41–45 with a 10-letter name, empty decks); the own looks beside the baseline — see MEASURED below.
const MEASURED = "6 looks × 36 documents (both choices, student + guide) = 1,080 pages: largest overflow 0 px, 0 clipped; the two catalog kids' own looks " +
  "(360 pages) measure exactly as the baseline, which already flags some daily pages (own dinosaur look 10–28 px too wide on one level, own construction look " +
  "a card 12 px under the warm-up strip) — not this change";
const MLV = LV, MEX = [["", { masteryItems: items, countEmoji: "🚒" }], [" · 41–45, long name", { masteryItems: items, countEmoji: "🦈", kidName: "Maximilian", weekNum: "week36", numberCursor: { week: 35, from: 40, adv: 5 } }], [" · empty decks", {}]];
const MEASURE_FN = "function(doc){var b=[],pages=0,max=0;doc.querySelectorAll('.page').forEach(function(pg,i){pages++;" +
  "var oh=pg.scrollHeight-pg.clientHeight,ow=pg.scrollWidth-pg.clientWidth;max=Math.max(max,oh,ow);if(oh>1||ow>1)b.push(i+': page +'+oh+'h +'+ow+'w');" +
  "pg.querySelectorAll('.body,.card,.col,.grid2,.path-wrap,.cover-learn,.p-sec,.header,.todo,.cover-body,.ten-frame').forEach(function(el){var h=el.scrollHeight-el.clientHeight,w=el.scrollWidth-el.clientWidth;max=Math.max(max,h,w);if(h>2||w>2)b.push(i+': .'+el.className.split(' ')[0]+' +'+h+'h +'+w+'w');});" +
  "var ft=pg.querySelector('.footer');if(ft&&ft.getBoundingClientRect().bottom>pg.getBoundingClientRect().bottom+1)b.push(i+': footer below the page');" +
  "var pw=pg.querySelector('.path-wrap');if(pw){var top=pw.getBoundingClientRect().top;pg.querySelectorAll('.grid2 .col .card').forEach(function(c){var r=c.getBoundingClientRect();if(r.top<top&&r.bottom>top+1)b.push(i+': a card runs under the warm-up strip');});}" +
  "});return{bad:b,pages:pages,max:max};}";
function chromeMeasure() {
  const chrome = process.env.CHROME_BIN || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
  if (!fs.existsSync(chrome)) { console.log("Chrome page measurement — SKIPPED (no Google Chrome at " + chrome + "; set CHROME_BIN)"); return; }
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "nb-countpic-"));
  // a catalog kid's own look prints its own name (a rename is NBNAME's business), and is measured beside the baseline (nothing saved)
  const specs = LOOKS.map(l => ({ kid: KID, look: l, name: l })).concat(NATIVE.map(k => ({ kid: k, look: "", name: k + " own look", own: true })));
  const cfg = [];
  specs.forEach(sp => (sp.own ? ["animal", "picture", "baseline"] : ["animal", "picture"]).forEach(ch => MLV.forEach(l => MEX.forEach(x => cfg.push({ name: sp.name + " · " + ch + " · " + l[0] + x[0],
    look: sp.name + (ch === "baseline" ? " (baseline)" : ""), key: l[0] + x[0], f: ch === "baseline" ? "old" : "new", kid: sp.kid,
    ctx: ctxOf(sp, l[1], x[1], Object.assign(ch === "baseline" ? {} : { countPic: ch }, sp.own ? { kidName: undefined } : {})) })))));
  fs.writeFileSync(path.join(dir, "base.js"), base);
  fs.writeFileSync(path.join(dir, "m.html"), '<!doctype html><meta charset="utf-8"><pre id="out">PENDING</pre><script src="file://' + path.join(dir, "base.js") + '"></script><script>var NBS={old:window.HoweNotebooks};</script>' +
    '<script src="file://' + file + '"></script><script>NBS["new"]=window.HoweNotebooks;\n' +
    "var CFG=" + JSON.stringify(cfg).replace(/</g, "\\u003c") + ",M=" + MEASURE_FN + ";\n" +
    "(async function(){var res=[];for(var c of CFG){var o=NBS[c.f].generate(c.kid,c.ctx);for(var part of ['student','parent']){" +
    "var f=document.createElement('iframe');f.style.cssText='position:absolute;left:0;top:0;width:1000px;height:1200px;border:0';document.body.appendChild(f);" +
    "await new Promise(function(r){f.onload=r;f.srcdoc=o[part];});var d=f.contentDocument;try{await Promise.race([d.fonts.ready,new Promise(function(r){setTimeout(r,6000);})]);}catch(e){}" +
    "await new Promise(function(r){setTimeout(r,60);});var m=M(d);m.name=c.name+' ('+part+')';m.look=c.look;m.key=c.key+' ('+part+')';m.emj=d.querySelectorAll('img.ha-emj').length;" +
    "m.fonts=Array.from(d.fonts).filter(function(x){return x.status==='loaded';}).length;res.push(m);f.remove();}}" +
    "document.getElementById('out').textContent='RESULT'+JSON.stringify(res)+'ENDRESULT';})().catch(function(e){document.getElementById('out').textContent='RESULT'+JSON.stringify({error:String(e&&e.stack||e)})+'ENDRESULT';});\n</script>");
  let dom = "";
  try {
    dom = require("child_process").execFileSync(chrome, ["--headless=new", "--disable-gpu", "--no-first-run", "--user-data-dir=" + path.join(dir, "profile"), "--allow-file-access-from-files",
      "--virtual-time-budget=1800000", "--dump-dom", "file://" + path.join(dir, "m.html")], { stdio: ["ignore", "pipe", "ignore"], maxBuffer: 64 * 1024 * 1024, timeout: 900000 }).toString();
  } catch (e) {
    dom = String((e && e.stdout) || "");   // Chrome can finish the page and still exit non-zero while shutting down
    if (!/RESULT[\s\S]*ENDRESULT/.test(dom)) { console.log("Chrome page measurement — SKIPPED: " + String(e.message).split("\n")[0].slice(0, 160)); return; }
  }
  const m = /RESULT([\s\S]*?)ENDRESULT/.exec(dom);
  let res = null; try { res = JSON.parse(m[1].replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&")); } catch (e) {}
  try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {}
  if (!res || res.error) { ok(false, "Chrome page measurement ran", res ? res.error : "no result in the page"); return; }
  console.log("Chrome page measurement (Google Chrome headless; built in the browser; " + res[0].fonts + " font faces loaded, " + res[0].emj + " emoji as images on the first notebook)");
  let tp = 0, tmax = 0;
  specs.forEach(sp => {
    const r = res.filter(x => x.look === sp.name), pages = r.reduce((a, x) => a + x.pages, 0), max = Math.max.apply(null, r.map(x => x.max)), bad = r.filter(x => x.bad.length);
    tp += pages; tmax = Math.max(tmax, max);
    if (!sp.own) { ok(r.length === 36 && !bad.length && max <= 0, sp.name + ": " + r.length + " documents, " + pages + " pages measured (daily pages + guide, both choices) — largest overflow " + max + " px, " + bad.length + " clipped", bad.slice(0, 3).map(x => x.name + " → " + x.bad.slice(0, 2).join("; ")).join(" | ")); return; }
    const old = res.filter(x => x.look === sp.name + " (baseline)"), oldOf = (x) => old.find(o => o.key === x.key);
    const worse = r.filter(x => { const o = oldOf(x); return !o || x.max > o.max || J(x.bad) !== J(o.bad); });
    ok(r.length === 36 && old.length === 18 && !worse.length, sp.name + ": " + r.length + " documents, " + pages + " pages — both choices measure exactly as the baseline (largest overflow " + max + " px, baseline " +
      Math.max.apply(null, old.map(x => x.max)) + " px, " + bad.length + " documents with a flag, baseline " + old.filter(x => x.bad.length).length + ")", worse.slice(0, 3).map(x => x.name + " → " + x.bad.slice(0, 2).join("; ")).join(" | "));
  });
  console.log("  measured: " + res.length + " documents (" + tp + " pages with a choice), largest overflow on a picked look " + Math.max.apply(null, res.filter(x => LOOKS.includes(x.look)).map(x => x.max)) + " px");
}
if (process.argv.includes("--measure")) chromeMeasure();
else console.log("Chrome page measurement — SKIPPED (run `node test_nb_countpic.js --measure`; measured 2026-11-24: " + MEASURED + ")");
console.log(pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
