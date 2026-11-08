// 📏 One Pre-K notebook — a LOOK and a LEVEL chosen apart (PREKLEVEL, her ask 2026-11-08: "for Julian, Caleb, and 3D, how we
// have basically the same notebook, but maybe at different levels, but we control that through different controls … a setting
// where they could change between which theme, construction, dinosaurs, or sharks"; then "for every kid, there will be a quick
// theme changer for the notebooks"). Run: node test_prek_notebook_levels.js
//   • the fold: Caleb's kindergarten generator is generatePreK with five level switches on; each switch does one thing
//   • Julian's, Caleb's, the shark kid's and every older kid's notebooks are byte-for-byte what main e5cbab4 printed
//   • looks: dinosaurs / construction / sharks for any Pre-K notebook, the kid's own look word for word
//   • the Notebook tab: the look row for every kid, level switches + extra pages for any Pre-K notebook (not by kid id),
//     saved with targeted writes at notebookSettings/<kid>, Mom only, ?dryrun=1 inert
//   • page fit: real-Chromium measurement when Playwright is installed (as test_notebook_shark.js), else SKIPPED
//   • no kid or family names in the new code
// If a notebook is changed ON PURPOSE later, refresh the snapshots: node test_prek_notebook_levels.js --hashes
const fs = require("fs"), path = require("path"), crypto = require("crypto");
const src = fs.readFileSync(path.join(__dirname, "notebooks.js"), "utf8");
const html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
global.window = {};
eval(src);
const NB = window.HoweNotebooks, I = NB._internal;
let pass = 0, fail = 0;
function ok(c, name, d) { if (c) { pass++; console.log("  ✓ " + name); } else { fail++; console.log("  ✗ " + name + (d ? "  → " + d : "")); } }
const noStyle = (h) => String(h).replace(/<style[\s\S]*?<\/style>/g, "");
const clone = (o) => JSON.parse(JSON.stringify(o));

// ── fixtures ────────────────────────────────────────────────────────────────────────────────
const dates = { monday: "November 9, 2026", tuesday: "November 10, 2026", wednesday: "November 11, 2026", thursday: "November 12, 2026", friday: "November 13, 2026" };
const base = (extra) => Object.assign({ weekNum: "week30", weekDates: "Nov 9–13, 2026", weekData: { dates, tasks: [] }, masteryItems: [], extraPages: {} }, extra || {});
const mi = (subject, prompts, extra) => prompts.map((p, i) => Object.assign({ subject, prompt: String(p), tier: "daily" }, (extra || {})[i] || {}));
const AZ = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const juItems = [].concat(mi("Letters", ["A", "B", "C", "D", "E", "F", "G"], { 2: { recentMiss: 2 } }), mi("Numbers", [1, 2, 3, 4, 5, 6, 7, 8], { 7: { status: "introduction" } }),
  mi("Shapes", ["Circle", "Square", "Triangle", "Star"], { 1: { drop_count: 1 } }), mi("Colors", ["Red", "Blue", "Green", "Yellow"]), mi("Animals", ["Lion", "Giraffe", "Shark", "Dog"]));
const cbItems = [].concat(mi("Lowercase", ["c", "o", "s", "v", "w"]), mi("Letter Sounds", ["c"]), mi("Numbers", [11, 12, 13], { 2: { status: "introduction" } }), mi("Shapes", ["Circle", "Oval"], { 1: { status: "introduction" } }));
const juBig = [].concat(mi("Letters", AZ, { 3: { recentMiss: 1 } }), mi("Numbers", [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13], { 12: { status: "introduction" } }),
  mi("Shapes", ["Circle", "Square", "Triangle", "Rectangle", "Hexagon", "Oval", "Diamond", "Star", "Heart"]), mi("Colors", ["Red", "Blue", "Yellow", "Green", "Orange", "Purple", "Brown", "Black"]),
  mi("Animals", ["Lion", "Giraffe", "Shark", "Dog", "Cat"]));
const cbBig = [].concat(mi("Lowercase", AZ.map(l => l.toLowerCase()), { 4: { recentMiss: 2 } }), mi("Letters", AZ), mi("Letter Sounds", ["a", "b", "c", "d"]),
  mi("Numbers", [11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22], { 11: { status: "introduction" } }), mi("Shapes", ["Circle", "Square", "Triangle", "Rectangle", "Hexagon", "Oval"], { 5: { status: "introduction" } }),
  mi("Colors", ["Red", "Blue", "Yellow", "Green", "Orange", "Purple", "Brown", "Black"]));
const unit = { emoji: "🐢", title: "Sea Turtles", learning: [{ name: "Shell", emoji: "🐚" }, { name: "Flipper" }], learned: [{ name: "Egg" }], next: [{ name: "Beach" }], days: { tuesday: true } };
const spelling = { title: "Spelling", sections: [{ label: "Mon–Tue", lesson: 3, words: ["cat", "hat", "sat"] }], practice: ["mat"] };
const tasksFor = (who) => ["monday", "tuesday", "wednesday", "friday"].map((d) => ({ who, day: d, title: "📖 Reading" })).concat([{ who: "someoneelse", day: "thursday", title: "x" }]);
const FIXTURES = (kid, items, big) => ({
  empty: base(),
  mastery: base({ masteryItems: items }),
  cursors: base({ weekNum: "week31", masteryItems: items, letterCursor: { week: 30, idx: 2, adv: 5, from: 28 }, numberCursor: { week: 30, from: 4, adv: 5 } }),
  extras: base({ masteryItems: items, extraPages: { abc: { on: false }, daysSeasons: { on: true, days: { monday: true } }, thisMonth: { on: true, days: { wednesday: true, friday: true } } }, units: [unit] }),
  spelling: base({ spelling, teachNotes: "Grandma visits Wednesday — keep it short.", reviewCap: 0 }),
  fourDay: base({ weekData: { dates: { tuesday: "November 10, 2026", wednesday: "November 11, 2026", thursday: "November 12, 2026", friday: "November 13, 2026" }, tasks: [] }, countEmoji: "🐟" }),
  picks: base({ masteryItems: items, juPicks: { letters: { 0: "D" }, numbers: { 1: "6" } } }),
  big: base({ masteryItems: big, countEmoji: "🚒", letterSounds: { a: "/a/ — apple 🍎" }, extraPages: { abc: { days: { tuesday: true } } } }),
  bigLater: base({ weekNum: "week36", masteryItems: big, letterCursor: { week: 35, idx: 20, adv: 5, from: 30 }, numberCursor: { week: 35, from: 40, adv: 5 }, reviewCap: 4 }),
  skipDays: base({ masteryItems: items, weekData: { dates, tasks: tasksFor(kid) } }),
  noSchoolAtAll: base({ masteryItems: items, weekData: { dates, tasks: tasksFor("nobody") } }),
  bindingMargin: base({ masteryItems: items, bindingMargin: true })
});
function allCases() {
  const out = {};
  for (const [kid, items, big] of [["julian", juItems, juBig], ["caleb", cbItems, cbBig]]) { const F = FIXTURES(kid, items, big); for (const n in F) out[kid + "/" + n] = [kid, F[n]]; }
  const S = FIXTURES("kid9", juItems, juBig); for (const n in S) out["shark/" + n] = ["kid9", Object.assign(S[n], { notebookTheme: "shark", kidName: "Finn" })];
  for (const kid of ["lincoln", "ellis", "lucy", "kid9"]) { out[kid + "/empty"] = [kid, base()]; out[kid + "/binding"] = [kid, base({ bindingMargin: true })]; }
  return out;
}
// sha256 (first 16 hex) of JSON.stringify(generate(kid, ctx)) — taken from origin/main e5cbab4, BEFORE the fold.
const BEFORE = {"julian/empty":"8a86b1e0d153f181","julian/mastery":"fe558aa8ce3804e1","julian/cursors":"5455af6aaaf562f7","julian/extras":"e7a73a6c292926de","julian/spelling":"cf9da3a6129a42ad","julian/fourDay":"64f1989e078eaa38","julian/picks":"a89cffbae1f753d5","julian/big":"32c99d5b1b3f0671","julian/bigLater":"4342c2cb429e3f28","julian/skipDays":"fe558aa8ce3804e1","julian/noSchoolAtAll":"fe558aa8ce3804e1","julian/bindingMargin":"250df84ec62edb58",
  "caleb/empty":"8b37fe802fbd9ed6","caleb/mastery":"844d75732e5723d3","caleb/cursors":"46cc24e6432e0fe9","caleb/extras":"29ca960f1a13df95","caleb/spelling":"a84698ec494f2eaa","caleb/fourDay":"785246ec8aeb0380","caleb/picks":"844d75732e5723d3","caleb/big":"c113f02366dea850","caleb/bigLater":"545ea4c736194e8b","caleb/skipDays":"18f84c03fa238b1d","caleb/noSchoolAtAll":"844d75732e5723d3","caleb/bindingMargin":"2fbaf876bf406cd7",
  "shark/empty":"23d7e0c0f1c87e99","shark/mastery":"c44529dc6d788321","shark/cursors":"7e74537b001bb706","shark/extras":"3682921ecb4befb0","shark/spelling":"7f7dd90aca9c03dd","shark/fourDay":"938786f7dc5b109b","shark/picks":"4fe95310ca003270","shark/big":"2639375c58f77a39","shark/bigLater":"8e4750b3d26b2eba","shark/skipDays":"c44529dc6d788321","shark/noSchoolAtAll":"c44529dc6d788321","shark/bindingMargin":"81c411704ab19628",
  "lincoln/empty":"40a3ec8aaba2b516","lincoln/binding":"a54db60c88dcfd27","ellis/empty":"c3a87b363fbdcf7e","ellis/binding":"8f3e5a2439f215df","lucy/empty":"6396d3822f2d341e","lucy/binding":"4ac7107eb66120ae","kid9/empty":"98cd36b5413f5b91","kid9/binding":"5221db6582d80428"};
const C = allCases(), snap = {};
for (const k in C) snap[k] = crypto.createHash("sha256").update(JSON.stringify(NB.generate(C[k][0], clone(C[k][1])))).digest("hex").slice(0, 16);
if (process.argv.includes("--hashes")) { console.log(JSON.stringify(snap)); process.exit(0); }

console.log("byte-identical to main (Julian, Caleb, the shark kid, every older kid, a starter kid)");
Object.keys(BEFORE).forEach(k => ok(snap[k] === BEFORE[k], k, "now " + snap[k]));
ok(Object.keys(BEFORE).length === 44, "44 snapshot cases");

console.log("the fold: Caleb's notebook = generatePreK + his level switches");
const cbCtx = base({ masteryItems: cbBig, weekData: { dates, tasks: tasksFor("caleb") } });
ok(JSON.stringify(I.generateCaleb(clone(cbCtx))) === JSON.stringify(I.generatePreK(clone(cbCtx), I.CB_THEME, I.CB_LEVEL, "caleb")) &&
   JSON.stringify(I.generateJulian(clone(cbCtx))) === JSON.stringify(I.generatePreK(clone(cbCtx), I.JU_THEME, I.JU_LEVEL, "julian")), "generateCaleb / generateJulian = generatePreK(look, levels)");
ok(/function generateCaleb\(ctx\) \{ return generatePreK\(ctx, CB_THEME, CB_LEVEL, "caleb"\); \}/.test(src) && /function generateJulian\(ctx\) \{ return generatePreK\(ctx, JU_THEME, JU_LEVEL, "julian"\); \}/.test(src), "both legacy generators are one line: generatePreK(ctx, look, levels, kid)");
ok(!/function cbPageDaily|function cbPageCover/.test(src), "no separate kindergarten daily page or cover any more");
ok(JSON.stringify(I.cbCurriculum(cbBig, {})) === JSON.stringify(I.pkCurriculum(cbBig, I.CB_LEVEL, null, {})), "his curriculum = the shared one with his switches");
ok(/if \(!pkCurricLevel\(lv\)\) return juCurriculumFromMastery\(items, opt\);/.test(src), "all curriculum switches off = the Pre-K curriculum, untouched");
const lvKeys = NB.prekLevels.map(d => d.key);
ok(JSON.stringify(lvKeys) === JSON.stringify(["nbLowercase", "nbFindIt", "nbTeens", "nbShapesAhead", "nbSkipNoSchoolDays"]), "five level switches", lvKeys.join(","));
ok(lvKeys.every(k => I.CB_LEVEL[k] === true) && lvKeys.every(k => I.JU_LEVEL[k] === false), "Caleb's defaults all on, Julian's all off");
ok(I.CB_LEVEL.ownWeeks === true && I.CB_LEVEL.numPicks === false && I.JU_LEVEL.ownWeeks === false && I.JU_LEVEL.numPicks === true && I.PK_LEVEL_DEFAULT.ownWeeks === true,
   "not switches: his rotation from his own first week (as the shark kid's), no planner number picks; Julian's on the school week");
const L = (o) => I.pkLevel({ nbLevel: o }, I.JU_LEVEL);
ok(L({ nbLowercase: true }).nbLowercase === true && L({ nbLowercase: "yes" }).nbLowercase === false && L({ nbLowercase: 1 }).nbLowercase === false && L(null).nbFindIt === false && I.pkLevel({ nbLevel: { nbFindIt: false } }, I.CB_LEVEL).nbFindIt === false,
   "levels read defensively: only a real true/false counts, else the kid's default");

// one switch at a time, on Julian's notebook (Julian's look, everything else his)
const ju = (lv, extra) => NB.generate("julian", base(Object.assign({ weekNum: "week1", masteryItems: juBig, nbLevel: lv }, extra || {})));   // week 1: his rotation opens on A
const days = (h) => (h.match(/<div class="page-label">Daily Page/g) || []).length;
const plain = ju({});
let o = ju({ nbLowercase: true });
ok(/learn-lab">Little letters/.test(o.student) && /I know my BIG letters!/.test(o.student) && !/My Animal Friends/.test(o.student) && /This is little c · big C/.test(o.student) && /recap-chip">🔤 c</.test(o.student) &&
   /Little letters/.test(plain.student) === false, "nbLowercase: the little letter of the day in handwriting order (c first; name only until a sound card), cover lists little letters + a BIG-letters card");
ok(/Trace the little c ➜/.test(o.student) && !/find-row/.test(noStyle(o.student)), "…traced the kindergarten way, no find-it rows unless that switch is on");
o = ju({ nbLowercase: true }, { masteryItems: [].concat(mi("Lowercase", ["a", "b"]), mi("Letter Sounds", ["a"])) });
ok(/a says \/a\/ · apple 🍎/.test(o.student) && /Sounds are on for: <strong>a<\/strong>/.test(o.parent), "…a Letter Sounds card turns the sound on (and the guide says which)");
o = ju({ nbFindIt: true });
ok(/class="find-row fit"/.test(o.student) && /Circle every A/.test(o.student) && /Circle little A/.test(o.student) && /Find<br>it/.test(o.student), "nbFindIt with capitals: circle every A, find its little letter; a Find-it to-do chip");
ok(/\.find-row \{/.test(o.student) && /\.find-row\.fit \.find-cell/.test(o.student), "…the find-it CSS rides along on a look that never had it");
o = ju({ nbTeens: true }, { masteryItems: [] });
ok(/Number of the Day · 11 <span[^>]*>= 10 and 1</.test(o.student) && !/= 10 and/.test(ju({}, { masteryItems: [] }).student), "nbTeens: no Numbers deck → 11–20, said as \"10 and some more\"");
o = ju({ nbShapesAhead: true }, { masteryItems: [].concat(mi("Shapes", ["Circle", "Oval"], { 1: { status: "introduction" } })) });
ok(/Shape &amp; Color[^]*?Oval · color it/.test(o.student.split("Daily Page")[1]) && /Hexagon|Diamond|Star/.test(o.parent + o.student), "nbShapesAhead: the shape being learned opens the week; the rest of its Shapes Path stage runs ahead");
o = ju({ nbSkipNoSchoolDays: true }, { weekData: { dates, tasks: tasksFor("julian") } });
ok(days(o.student) === 4 && days(ju({}, { weekData: { dates, tasks: tasksFor("julian") } }).student) === 5 && days(ju({ nbSkipNoSchoolDays: true }, { weekData: { dates, tasks: tasksFor("nobody") } }).student) === 5,
   "nbSkipNoSchoolDays: no page on the kid's no-card day (only when the week has the kid's cards)");

console.log("looks: dinosaurs / construction / sharks for any Pre-K notebook");
ok(JSON.stringify(Object.keys(NB.themes)) === '["dino","construction","shark"]' && NB.themes.dino.chip === "🦕 Dinosaurs" && NB.themes.construction.chip === "🚜 Construction" && NB.themes.shark.chip === "🦈 Sharks", "three looks, picker order");
ok(NB.generate("julian", base({ masteryItems: juItems, notebookTheme: "dino" })).student === NB.generate("julian", base({ masteryItems: juItems })).student &&
   NB.generate("caleb", base({ masteryItems: cbItems, notebookTheme: "construction" })).student === NB.generate("caleb", base({ masteryItems: cbItems })).student, "a kid's own look picked on purpose = the original, word for word");
o = NB.generate("julian", base({ masteryItems: juItems, notebookTheme: "construction", kidName: "Julian" }));
ok(o.prekTheme === "construction" && /Drive to the job site!/.test(o.student) && /Bungee/.test(o.student) && /Hi, Julian! 🚜/.test(o.student) && /Letter of the Day[\s\S]{0,400}A is for/.test(o.student) && !/Caleb|DeWalt|Kindergarten/.test(noStyle(o.student) + noStyle(o.parent)),
   "Julian in construction: the machines, block lettering, his name, still his capitals — no other kid's words");
ok(!("from" in o.letterCursor), "…his letter rotation stays on the school week (the look doesn't move his place)");
o = NB.generate("caleb", base({ masteryItems: cbItems, notebookTheme: "shark", kidName: "Caleb", nbGrade: "Kindergarten" }));
ok(o.prekTheme === "shark" && /Swim the waves!/.test(o.student) && /c says \/c\/ · cat/.test(o.student) && /Kindergarten/.test(o.student) && /class="find-row fit"/.test(o.student) && "from" in o.letterCursor,
   "Caleb in sharks: the ocean look, still his little letters, find-it, grade and own-week rotation");
o = NB.generate("kid9", base({ masteryItems: juItems, notebookTheme: "dino", kidName: "Finn" }));
const banned = /Julian|JULIAN|Caleb|Howe|DeWalt|Burris|I am 4!|his big brothers/;
ok(o.prekTheme === "dino" && /Hi, Finn! 🦕/.test(o.student) && /Trace the path!/.test(o.student) && !banned.test(noStyle(o.student) + noStyle(o.parent)), "dinosaurs for any kid: the dinosaur pictures with that kid's name, none of the original family's words",
   (noStyle(o.student) + noStyle(o.parent)).match(banned));
ok(/J is for Jet ✈️/.test(NB.generate("kid9", base({ masteryItems: mi("Letters", ["J"]), notebookTheme: "dino", kidName: "Finn" })).student), "…J is for Jet (not a name)");
o = NB.generate("kid9", base({ masteryItems: cbItems, notebookTheme: "construction", kidName: "Finn", nbLevel: { nbLowercase: true } }));
ok(/Hi, Finn! 🚜/.test(o.student) && /write your name here: Finn/.test(o.student) && !banned.test(noStyle(o.student) + noStyle(o.parent)), "construction for any kid: same look, that kid's name");
ok(!/\b(he|him|his|she|her)\b/i.test(noStyle(o.parent).replace(/<[^>]+>/g, " ")) && !/\b(he|him|his|she|her)\b/i.test(noStyle(NB.generate("kid9", base({ notebookTheme: "dino", kidName: "Finn", nbLevel: { nbTeens: true, nbFindIt: true } })).parent).replace(/<[^>]+>/g, " ")),
   "the level-built guide never guesses the child's pronouns");
o = NB.generate("kid9", base({ notebookTheme: "construction", kidName: "Finn", nbLevel: { nbLowercase: true, nbFindIt: true, nbTeens: true } }));
ok(/Little letters come in handwriting order/.test(o.parent) && /ten and some more/.test(o.parent) && /find its BIG letter/.test(o.parent) && /🦺 Big letters/.test(o.parent), "the guide follows the levels (little letters, find it, teens)");
ok(NB.generate("lincoln", base({ notebookTheme: "shark" })).student === NB.generate("lincoln", base()).student, "an older kid's notebook never wears a Pre-K look");
ok(I.pkSpec("kid9", { notebookTheme: "shark" }).L.ownWeeks === true && I.pkSpec("julian", { notebookTheme: "shark" }).L.ownWeeks === false, "a look never changes where a kid's rotation counts from");

console.log("the picker's options (HoweNotebooks.notebookOptions)");
let op = NB.notebookOptions("julian", { isPreK: true });
ok(op.looks.map(l => l.key).join() === "dino,construction,shark" && op.current === "dino" && op.prek && op.levels.length === 5 && op.levels.every(d => d.on === false) && op.extraPages.length === 3, "Julian: three looks, his own on, five switches off, his three extra pages");
op = NB.notebookOptions("caleb", { isPreK: false, notebookTheme: "shark", nbLevel: { nbTeens: false } });
ok(op.current === "shark" && op.levels.find(d => d.key === "nbTeens").on === false && op.levels.find(d => d.key === "nbLowercase").on === true, "Caleb (school-age on his roster): still a Pre-K notebook — looks + switches, saved choices shown");
op = NB.notebookOptions("d3", { isPreK: true });
ok(op.looks.map(l => l.key).join() === ",dino,construction,shark" && op.current === "" && !op.prek && op.levels === null && op.extraPages.length === 0, "a Pre-K kid on the starter notebook: Starter + the three looks; no switches until a look is picked");
op = NB.notebookOptions("d3", { isPreK: true, notebookTheme: "shark" });
ok(op.prek && op.current === "shark" && op.levels.length === 5 && op.extraPages.map(p => p.key).join() === "abc,daysSeasons,thisMonth", "…with a look: the level switches AND the ABC / Days & Seasons / This Month pages show — no kid id involved");
op = NB.notebookOptions("lincoln", {});
ok(op.looks.length === 1 && op.looks[0].label === "🐍 Snakes" && op.levels === null && !op.prek, "an older kid: the look row shows the notebook's one look; no Pre-K looks, no switches");
op = NB.notebookOptions("zz", { isPreK: false });
ok(op.looks.length === 1 && op.looks[0].key === "" && op.levels === null, "a school-age kid on the starter notebook: Starter only");

console.log("the Notebook tab (index.html PREKLEVEL_WIRE)");
const wire = html.slice(html.indexOf("// PREKLEVEL_WIRE_START"), html.indexOf("// PREKLEVEL_WIRE_END"));
const writes = [];
function sandbox(opts) {
  const env = { ROSTER_DEF: opts.roster, notebookSettings: opts.ns, HA_LS: { setItem() {} }, db: { ref: (p) => ({ set: (v) => writes.push([p, v]) }) }, momHere: () => opts.mom !== false, _dryRun: () => !!opts.dry,
    isPreK: (k) => k === "d3" || k === "julian", tab: "x", renderNotebook() {}, window: { HoweNotebooks: NB }, document: {} };
  const fn = new Function(...Object.keys(env), wire + "\nreturn {nbThemeOf,nbLevelOf,nbGradeOf,nbLookOpts,nbSetLook,nbSetLevel};");
  return fn(...Object.values(env));
}
const roster = [{ id: "julian", name: "Julian" }, { id: "d3", name: "3D", notebookTheme: "shark", nbFindIt: true }, { id: "caleb", name: "Caleb", notebook: { gradeLabel: "K" } }];
let ns = {}, W = sandbox({ roster, ns });
ok(W.nbThemeOf("julian") === null && W.nbThemeOf("d3") === "shark", "the look: none saved = the Family record's (or none)");
ns.d3 = { notebookTheme: "" }; ok(W.nbThemeOf("d3") === "", "…Mom's pick wins, even \"Starter\" over the record's shark");
ok(JSON.stringify(W.nbLevelOf("d3")) === '{"nbFindIt":true}' && W.nbGradeOf("caleb") === "Kindergarten" && W.nbGradeOf("d3") === "Pre-K" && W.nbGradeOf("zz") === null, "levels from the record, grade from the record's notebook.gradeLabel or Pre-K");
writes.length = 0; W.nbSetLook("julian", "shark");
ok(ns.julian.notebookTheme === "shark" && JSON.stringify(writes) === '[["notebookSettings/julian/notebookTheme","shark"]]', "picking a look: one targeted write, notebookSettings/<kid>/notebookTheme");
writes.length = 0; W.nbSetLevel("julian", "nbLowercase");
ok(ns.julian.nbLevel.nbLowercase === true && JSON.stringify(writes) === '[["notebookSettings/julian/nbLevel/nbLowercase",true]]', "a switch: one targeted write, notebookSettings/<kid>/nbLevel/<switch>");
writes.length = 0; W.nbSetLevel("julian", "nbLowercase"); ok(ns.julian.nbLevel.nbLowercase === false && writes[0][1] === false, "…tap again turns it off");
writes.length = 0; W.nbSetLevel("lincoln", "nbLowercase"); ok(writes.length === 0, "no switch for a notebook that has none");
const W2 = sandbox({ roster, ns: {}, mom: false }); writes.length = 0; W2.nbSetLook("julian", "shark"); W2.nbSetLevel("julian", "nbTeens"); ok(writes.length === 0, "Mom only");
const ns3 = {}, W3 = sandbox({ roster, ns: ns3, dry: true }); writes.length = 0; W3.nbSetLook("julian", "dino"); ok(writes.length === 0 && ns3.julian.notebookTheme === "dino", "?dryrun=1: nothing written to the database");
ok(!/settings\/family/.test(wire.replace(/^\/\/.*$/gm, "")), "never writes settings/family (every device reloads on that)");
ok(/notebookTheme:nbThemeOf\(kid\), nbLevel:nbLevelOf\(kid\), nbGrade:nbGradeOf\(kid\)/.test(html), "the notebook build reads the look, levels and grade the picker saved");
const rn = html.slice(html.indexOf("function renderNotebook(el){"), html.indexOf("function renderActivities(el){"));
ok(/const lookOpts=nbLookOpts\(sel\);/.test(rn) && /const xpList=\(lookOpts&&lookOpts\.extraPages\)\|\|\(xpCatalog&&xpCatalog\[sel\]\)\|\|\[\];/.test(rn) && /if\(momHere\(\) && xpList\.length\)/.test(rn), "extra-page switches + day chips come from the notebook the kid gets (any Pre-K kid), not the kid id");
ok(/if\(momHere\(\) && lookOpts && lookOpts\.looks\.length\)/.test(rn) && /nbSetLook\('"\+sel\+"','"\+l\.key\+"'\)/.test(rn) && /nbSetLevel\(\\''\+sel\+'\\',\\''\+d\.key\+'\\'\)/.test(rn) && /formHtml\+\s*lookHtml\+\s*xpHtml\+/.test(rn),
   "the 🎨 look row (every kid) + 📏 level switches (Pre-K notebook) — Mom only, above the extra pages");

console.log("page fit (find-it pages: the fitted card for every look but the original construction one)");
o = NB.generate("kid9", base({ masteryItems: cbBig, notebookTheme: "shark", kidName: "Finn", nbLevel: { nbLowercase: true, nbFindIt: true } }));
ok(/class="grid2" style="flex:1\.9;"/.test(o.student) && /<div style="flex:1;min-width:0;font-size:8\.5px;[^"]*">🖍 a — magic c/.test(o.student) && /nt-trace" style="font-size:46px/.test(o.student), "the fitted card: stroke words beside the letter, 46px tracing, a little more page for the top cards");
o = NB.generate("caleb", base({ masteryItems: cbBig }));
ok(!/find-row fit/.test(o.student) && !/flex:1\.9/.test(o.student), "Caleb's own card stays as printed (T.legacyFindLayout) until Mom okays the fitted one");
const tr = (n, lv) => +((NB.generate("kid9", base({ notebookTheme: "shark", kidName: n, nbLevel: lv })).student.match(/Trace My Name<\/div>\s*<div class="nt-trace" style="font-size:(\d+)px/) || [])[1]);
ok(tr("Finn") === 52 && tr("David") === 52 && tr("Robert") === 43 && tr("Maximilian") === 26 && tr("Finn", { nbFindIt: true }) === 44, "a name longer than 5 letters is traced smaller (measured: ~0.93em a dotted capital)", [tr("Finn"), tr("David"), tr("Robert"), tr("Maximilian")].join("/"));

console.log("no kid or family names in the new code");
const names = ["Julian", "Lincoln", "Ellis", "Lucy", "Caleb", "Kenzie", "Howe", "DeWalt", "Burris", "3D", "David"];
const blk = src.slice(src.indexOf("// PREKLEVEL_START"), src.indexOf("// PREKLEVEL_END"));
ok(blk.length > 5000 && !names.some(n => new RegExp("\\b" + n + "\\b").test(blk.replace(/Mrs\. DeWalt/g, ""))), "the PREKLEVEL block names no child or family", names.filter(n => new RegExp("\\b" + n + "\\b").test(blk)).join(","));
ok(!names.some(n => new RegExp("\\b" + n + "\\b").test(wire)), "the app wiring names no child either");
ok(!/"julian"|"caleb"/.test(src.slice(src.indexOf("  function generatePreK("), src.indexOf("  function generateJulian("))), "generatePreK names no kid (the kid id is passed in)");

// ── Real Chromium page measurement (optional, as test_notebook_shark.js) ─────────────────────
(async () => {
  let pw = null;
  try { pw = require("playwright"); } catch (e) { try { pw = require(path.join(require("child_process").execSync("npm root -g", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim(), "playwright")); } catch (e2) {} }
  let browser = null;
  if (!pw) console.log("Chromium page measurement — SKIPPED (Playwright not installed; measured 2026-11-08 in the app's browser: 112 renders, every look × level set fits)");
  else { try { browser = await pw.chromium.launch(); } catch (e) { console.log("Chromium page measurement — SKIPPED: " + e.message.split("\n")[0]); } }
  if (browser) {
    console.log("Chromium page measurement");
    const page = await browser.newPage();
    const items = [].concat(mi("Letters", AZ), mi("Lowercase", AZ.map(l => l.toLowerCase())), mi("Letter Sounds", ["a", "b", "c", "d", "e", "m", "s", "t"]),
      mi("Numbers", [11, 12, 13, 14, 15, 16, 17, 18, 19, 20], { 9: { status: "introduction" } }), mi("Shapes", ["Circle", "Square", "Triangle", "Rectangle", "Hexagon", "Oval"], { 5: { status: "introduction" } }),
      mi("Colors", ["Red", "Blue", "Yellow", "Green", "Orange", "Purple", "Brown", "Black"]), mi("Animals", ["Lion", "Giraffe", "Shark", "Dog"]));
    const all = { abc: { days: dates }, daysSeasons: { days: dates }, thisMonth: { days: dates } };
    const OFF = {}, ON = { nbLowercase: true, nbFindIt: true, nbTeens: true, nbShapesAhead: true, nbSkipNoSchoolDays: true };
    for (const look of ["dino", "construction", "shark"]) for (const [lvName, lv] of [["Pre-K", OFF], ["K", ON], ["capitals + find it", { nbFindIt: true, nbTeens: true }]]) for (const extra of [{}, { kidName: "Maximilian", weekNum: "week36", numberCursor: { week: 35, from: 40, adv: 5 } }]) {
      const out = NB.generate("kid9", base(Object.assign({ masteryItems: items, extraPages: all, units: [unit], spelling, teachNotes: "Short day.", kidName: "Finn", notebookTheme: look, nbLevel: lv }, extra)));
      for (const part of ["student", "parent"]) {
        await page.setContent(out[part].replace(/<link[^>]*fonts\.googleapis[^>]*>/g, ""));
        const bad = await page.evaluate(() => { const b = []; document.querySelectorAll(".page").forEach((pg, i) => {
          if (pg.scrollHeight > pg.clientHeight + 1 || pg.scrollWidth > pg.clientWidth + 1) b.push(i + ": page");
          pg.querySelectorAll(".body,.card,.col,.grid2,.path-wrap,.cover-learn,.p-sec").forEach(el => { if (el.scrollHeight > el.clientHeight + 2 || el.scrollWidth > el.clientWidth + 2) b.push(i + ": ." + el.className.split(" ")[0] + " " + el.scrollHeight + ">" + el.clientHeight + " w" + el.scrollWidth + ">" + el.clientWidth); });
        }); return b; });
        ok(!bad.length, look + " · " + lvName + (extra.kidName ? " · 10-letter name, 41–45" : "") + " (" + part + "): no page clips", bad.slice(0, 4).join("; "));
      }
    }
    await browser.close();
  }
  console.log(pass + " passed, " + fail + " failed");
  process.exit(fail ? 1 : 0);
})().catch(e => { console.log("  FAIL - threw: " + (e && e.stack || e)); process.exit(1); });
