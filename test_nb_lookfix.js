// NB_LOOKFIX — each of the first three Pre-K looks carries its own words (her words 2026-11-24: "Yes, fix them").
// Run: node test_nb_lookfix.js            (add --measure to measure every page in Google Chrome, headless)
//   • the dinosaur and shark looks print their OWN sound-picture words once letter sounds are on (no dig ⛏️ / hammer / truck)
//   • the construction look lists its OWN animal friends (no T-Rex), and its counting picture works exactly as before
//   • the J rule: a child whose name starts with J sees "J is for <name>! ⭐"; anyone else the look's own J word;
//     no child's name is typed into notebooks.js for it
//   • nothing else on any page changes (baseline = THIS file with the block and its five marked call sites taken out),
//     and the newer looks and every school-age notebook are byte for byte the same
//   • page fit, measured in Google Chrome (--measure): every Pre-K page of the three fixed looks, letter sounds on and off
// Names in here are made up; the real roster names are read from the code itself, never typed.
const fs = require("fs"), path = require("path"), os = require("os");
const file = path.join(__dirname, "notebooks.js");
const src = fs.readFileSync(file, "utf8");
const load = (code) => { const w = {}; new Function("window", code)(w); return w.HoweNotebooks; };
const NB = load(src), I = NB._internal;
let pass = 0, fail = 0;
function ok(c, name, d) { if (c) { pass++; console.log("  ✓ " + name); } else { fail++; console.log("  ✗ " + name + (d ? "  → " + d : "")); } }
const noStyle = (h) => String(h).replace(/<style[\s\S]*?<\/style>/g, "");
const text = (h) => noStyle(h).replace(/<[^>]+>/g, " ");

// ── the baseline: this file with the block and its call sites out ────────────────────────────────────────────────────
const A = src.indexOf("  // NB_LOOKFIX_START"), endMark = "  // NB_LOOKFIX_END\n", B = src.indexOf(endMark);
const block = src.slice(A, B + endMark.length);
const OWN = I.JU_THEME.traceNameMixed;   // the name the first kid's own look prints (read from the code, not typed here)
const SITES = [   // [the line as it is now, the line as it was]
  ['    J: ["Jet", "✈️"], K: ["Kite", "🪁"], L: ["Lion", "🦁"],   // NB_LOOKFIX: J is no child\'s name (lfLook gives a J-named child theirs)\n',
   '    J: ["' + OWN + '!", "⭐"], K: ["Kite", "🪁"], L: ["Lion", "🦁"],\n'],
  ["    T = lfLook(T, ctx, kidId);   // NB_LOOKFIX: the look's own words, and the J line for a J-named child\n", ""],
  ['animalFallback: "🐟" }, soundWords: SH_SOUND_WORDS   // NB_LOOKFIX: its own sound words\n', 'animalFallback: "🐟" }\n'],
  ['unitTheme: "dino", curOpt: null, soundWords: DN_SOUND_WORDS   // NB_LOOKFIX: its own sound words\n', 'unitTheme: "dino", curOpt: null\n'],
  ['unitTheme: "construction", curOpt: CN_CUR_OPT   // NB_LOOKFIX: its own animal friends\n', 'unitTheme: "construction", curOpt: null\n']
];
let oldSrc = src.slice(0, A) + src.slice(B + endMark.length);
SITES.forEach(([now, was]) => { oldSrc = oldSrc.split(now).join(was); });
const OLD = load(oldSrc);

console.log("the block and its call sites");
ok(A > 0 && B > A && src.indexOf("// NB_LOOKFIX_START", A + 10) < 0, "one NB_LOOKFIX block, marked start and end");
ok(SITES.every(([now]) => src.split(now).length === 2), "five call sites, each exactly once");
ok((src.slice(0, A) + src.slice(B + endMark.length)).split("NB_LOOKFIX").length - 1 === SITES.length && oldSrc.indexOf("NB_LOOKFIX") < 0 && !/lfLook|DN_SOUND_WORDS|SH_SOUND_WORDS|CN_CUR_OPT/.test(oldSrc),
  "outside the block NB_LOOKFIX marks only those five; with them out, no trace is left");
ok(OWN && /^J/.test(OWN) && OLD._internal.JU_THEME.letterWords.J[0] === OWN + "!", "the baseline's shared J is the old one (rebuilt from the code's own name, so it is not typed here)");

// roster names, read from the code (labels like "Name (grade 🦕)") — none may sit in the block or in any letter or sound word
const ROSTER = Object.keys(NB.GENERATORS).map(k => String(NB.GENERATORS[k].label || "").split(" ")[0]).filter(n => /^[A-Z][a-z]+$/.test(n));
console.log("no child's name in the code for this");
ok(ROSTER.length >= 5 && ROSTER.indexOf(OWN) >= 0, "roster names read from the code (" + ROSTER.length + ")");
ok(!ROSTER.some(n => new RegExp("\\b" + n + "\\b", "i").test(block)) && !/\b(he|his|him|she|her)\b/i.test(block.replace(/\/\/ .*her words[^\n]*/g, "")), "the block names no child and guesses no pronoun");
ok(src.indexOf('"' + OWN + '!"') < 0 && oldSrc.indexOf('"' + OWN + '!"') > 0, "the old J entry (a child's name) is gone from notebooks.js");
const lookObj = (N, k, ctx) => N.themes[k].theme(Object.assign({ kidName: "Finn" }, ctx || {}), {});
const KEYS = Object.keys(NB.themes);
ok(KEYS.every(k => { const T = lookObj(NB, k); return Object.keys(T.letterWords).concat(Object.keys(T.soundWords || {})).every(L => {
  const w = (T.letterWords[L] || T.soundWords[L] || [""])[0]; return !ROSTER.some(n => new RegExp("\\b" + n + "\\b", "i").test(w)); }); }) &&
   ROSTER.every(n => !Object.values(I.JU_THEME.letterWords).some(w => new RegExp("\\b" + n + "\\b", "i").test(w[0]))),
  "no look's letter or sound word, and no word in the shared list, is a roster name");

// ── fixtures ───────────────────────────────────────────────────────────────────────────────────────────────────────────
const FIRST = ["dino", "construction", "shark"], NEWER = ["space", "farm", "forest"];
const dates = { monday: "November 9, 2026", tuesday: "November 10, 2026", wednesday: "November 11, 2026", thursday: "November 12, 2026", friday: "November 13, 2026" };
const base = (extra) => Object.assign({ weekNum: "week30", weekDates: "Nov 9–13, 2026", weekData: { dates, tasks: [] }, masteryItems: [], extraPages: {} }, extra || {});
const mi = (subject, prompts, extra) => prompts.map((p, i) => Object.assign({ subject, prompt: String(p), tier: "daily" }, (extra || {})[i] || {}));
const AZ = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""), az = AZ.map(l => l.toLowerCase());
const unit = { emoji: "🐢", title: "Sea Turtles", learning: [{ name: "Shell", emoji: "🐚" }], learned: [{ name: "Egg" }], next: [{ name: "Beach" }], days: { tuesday: true } };
const spelling = { title: "Spelling", sections: [{ label: "Mon–Tue", lesson: 3, words: ["cat", "hat", "sat"] }], practice: ["mat"] };
const allPages = { abc: { days: dates }, daysSeasons: { days: dates }, thisMonth: { days: dates } };
// every deck, all 26 letters big and little with their sounds on (so every letter word and sound word can print)
const items = [].concat(mi("Letters", AZ, { 2: { recentMiss: 2 } }), mi("Lowercase", az), mi("Letter Sounds", az),
  mi("Numbers", [11, 12, 13, 14, 15, 16, 17, 18, 19, 20]), mi("Shapes", ["Circle", "Square", "Triangle", "Rectangle", "Hexagon", "Oval"], { 5: { status: "introduction" } }),
  mi("Colors", ["Red", "Blue", "Yellow", "Green", "Orange", "Purple"]), mi("Animals", ["Lion", "Giraffe", "Wombat"], { 1: { drop_count: 1 } }));
const noSounds = items.filter(it => it.subject !== "Letter Sounds");
const LVKEYS = ["nbLowercase", "nbFindIt", "nbTeens", "nbShapesAhead", "nbSkipNoSchoolDays"];
const LEVELS = []; for (let m = 0; m < 32; m++) { const lv = {}; LVKEYS.forEach((k, i) => { lv[k] = !!(m & (1 << i)); }); LEVELS.push(lv); }
const walk = (w) => ({ weekNum: "week" + w, reviewCap: 0, letterCursor: { week: w, idx: (w - 30) * 5, adv: 5, from: 30 } });
const full = (look, lv, extra) => base(Object.assign({ masteryItems: items, extraPages: allPages, units: [unit], spelling, teachNotes: "Short day.", kidName: "Finn", notebookTheme: look, nbLevel: lv }, extra || {}));
const clone = (o) => JSON.parse(JSON.stringify(o));
const both = (kid, ctx) => [NB.generate(kid, clone(ctx)), OLD.generate(kid, clone(ctx))];
const cues = (h) => (h.match(/<div class="cue">[^<]*/g) || []).map(c => c.slice(17));

// ── 1. sound-picture words ────────────────────────────────────────────────────────────────────────────────────────────
console.log("sound-picture words: the dinosaur and shark looks have their own");
const CB_ONLY = ["bucket", "dig", "fire truck", "hammer", "ladder", "magnet", "nut", "rock", "saw", "truck", "wheel"];
const otherWords = (k) => { const s = {}; KEYS.filter(o => o !== k).forEach(o => { const T = lookObj(NB, o); Object.values(T.letterWords).concat(Object.values(T.soundWords || {})).forEach(w => { s[w[0].toLowerCase()] = o; }); }); return s; };
["dino", "shark"].forEach(k => {
  const T = lookObj(NB, k), sw = T.soundWords || {}, mine = {}; Object.values(T.letterWords).forEach(w => { mine[w[0].toLowerCase()] = 1; });
  const bad = az.filter(l => { const w = sw[l]; return !w || !w[0] || !w[1] || (l !== "x" && w[0][0] !== l); });
  ok(!bad.length && !lookObj(OLD, k).soundWords, k + ": a word and a picture for all 26 letter sounds, each starting with its letter (before: none of its own)", bad.join(""));
  const other = otherWords(k), shared = az.filter(l => other[sw[l][0]] && !mine[sw[l][0]]).map(l => sw[l][0] + " (" + other[sw[l][0]] + ")");
  ok(!shared.length, k + ": no sound word comes from another look's lists unless it is already one of this look's own letter words", shared.join(", "));
  ok(!az.some(l => CB_ONLY.indexOf(sw[l][0]) >= 0) && !az.some(l => /🔨|⛏️|🚛|🪚|🪣|🪜|🧲|🔩|🪨|🛞|🚒/.test(sw[l][1])), k + ": none of the construction look's words or pictures");
  ok(["a", "e", "i", "o", "u"].every(v => ({ alligator: 1, anchor: 1, egg: 1, igloo: 1, ox: 1, octopus: 1, umbrella: 1 })[sw[v][0]]), k + ": short vowels (a " + sw.a[0] + ", e " + sw.e[0] + ", i " + sw.i[0] + ", o " + sw.o[0] + ", u " + sw.u[0] + ")");
  ok(["c", "g"].every(l => !/^(ci|ce|cy|gi|ge|gy)/.test(sw[l][0])) && Math.max.apply(null, az.map(l => Array.from(sw[l][0]).length)) <= "fire truck".length, k + ": hard c and g, and no word longer than the longest the construction look prints (fire truck)");
  // a six-week walk with little letters + every sound on: every "x says /x/ · word" printed is this look's own
  const seen = {}, wrong = [];
  for (let w = 30; w <= 35; w++) cues(NB.generate("kid9", full(k, { nbLowercase: true }, walk(w))).student).forEach(c => {
    const m = /^([a-z]) says \/[a-z]\/ · (.*) (\S+)$/.exec(c); if (!m) return; seen[m[1]] = 1; if (sw[m[1]][0] !== m[2] || sw[m[1]][1] !== m[3]) wrong.push(c); });
  ok(Object.keys(seen).length === 26 && !wrong.length, k + ": all 26 “a says /a/ · …” lines printed, each from its own list", wrong.slice(0, 3).join(" | "));
});
ok(JSON.stringify(lookObj(NB, "construction").soundWords) === JSON.stringify(lookObj(OLD, "construction").soundWords) && /says \/d\/ · dig ⛏️/.test(text([30, 31, 32, 33, 34, 35].map(w => NB.generate("kid9", full("construction", { nbLowercase: true }, walk(w))).student).join(""))),
  "the construction look keeps its own (dig ⛏️, hammer, truck…)");
const juSounds = [30, 31, 32, 33, 34, 35].map(w => NB.generate("julian", full("", { nbLowercase: true }, Object.assign(walk(w), { kidName: undefined }))).student).join("");
ok(/d says \/d\/ · dinosaur 🦕/.test(juSounds) && !/· (dig|hammer|truck) /.test(juSounds), "a kid's own dinosaur look with little letters on prints the dinosaur sound words too");

// ── 2. animal friends ─────────────────────────────────────────────────────────────────────────────────────────────────
console.log("animal friends: the construction look has its own");
const friends = (h) => ((/My Animal Friends<\/div><div class="learn-val"[^>]*>([^<]*)/.exec(h) || [])[1] || "");
const cnNew = NB.generate("kid9", base({ kidName: "Finn", notebookTheme: "construction" })), cnOld = OLD.generate("kid9", base({ kidName: "Finn", notebookTheme: "construction" }));
ok(friends(cnNew.student) === "🦫 🐜 🐝 🐦" && friends(cnOld.student) === "🦁 🦖 🦕 🦒", "no Animals deck: the cover lists 🦫 🐜 🐝 🐦 (was 🦁 🦖 🦕 🦒)");
ok(/Beaver, Ant, Bee, Bird/.test(text(cnNew.parent)) && !/T-Rex|Brachiosaurus/.test(text(cnNew.student + cnNew.parent)) && !/🦖|🦕/.test(noStyle(cnNew.student + cnNew.parent)), "…the guide lists them by name, and no dinosaur name or picture prints anywhere");
const deck = (N, look) => N.generate("kid9", base({ kidName: "Finn", notebookTheme: look, masteryItems: mi("Animals", ["Lion", "Beaver", "Wombat", "Giraffe"]) }));
ok(friends(deck(NB, "construction").student) === "🦁 🦫 🐾 🦒" && friends(deck(OLD, "construction").student) === "🦁 🦕 🦕 🦒", "the kid's own Animals deck wins; an animal with no picture gets 🐾, not 🦕");
ok(friends(deck(NB, "shark").student) === friends(deck(OLD, "shark").student) && friends(NB.generate("kid9", base({ kidName: "Finn", notebookTheme: "shark" })).student) === "🦈 🐟 🐙 🐳" &&
   friends(NB.generate("kid9", base({ kidName: "Finn", notebookTheme: "dino" })).student) === "🦁 🦖 🦕 🦒", "the shark look already had its own sea friends and the dinosaur look's are its own — both unchanged");
// the counting picture: construction still counts it, not the animal — same count, same planner rows
const countRow = (h) => (h.match(/<div class="count-row[\s\S]*?<span class="lab"/g) || []).join("|");
const cnCtx = (extra) => base(Object.assign({ kidName: "Finn", notebookTheme: "construction", countEmoji: "🚒" }, extra || {}));
ok([{}, { masteryItems: items }, { nbLevel: LEVELS[31], masteryItems: items }].every(x => { const [n, o] = both("kid9", cnCtx(x)); return countRow(n.student) === countRow(o.student) && /🚒/.test(countRow(n.student)); }),
  "the construction look still counts its counting picture (🚒 here) — the count is the same as before");
ok([{}, { masteryItems: items }].every(x => JSON.stringify(NB.planFor("kid9", cnCtx(x))) === JSON.stringify(OLD.planFor("kid9", cnCtx(x))) && !("animals" in NB.planFor("kid9", cnCtx(x)).subjects)),
  "…and Mom's week plan for it is unchanged (no Animals row)");
ok(JSON.stringify(NB.reviewDecks("kid9", { notebookTheme: "construction" })) === JSON.stringify(OLD.reviewDecks("kid9", { notebookTheme: "construction" })), "…and the decks its trouble card says come back are the same");

// ── 3. the J rule ─────────────────────────────────────────────────────────────────────────────────────────────────────
console.log("the J line");
const jLine = (o) => ((/J is for [^<]*/.exec(o.student) || [])[0] || "");
const jCtx = (look, name, extra) => base(Object.assign({ masteryItems: mi("Letters", ["J"]), notebookTheme: look, kidName: name }, extra || {}));
const own = both("julian", jCtx("", undefined));
ok(jLine(own[0]) === "J is for " + OWN + "! ⭐" && JSON.stringify(own[0]) === JSON.stringify(own[1]), "a kid's own look, name starting with J: the J line is that name, byte for byte as before (whole notebook)");
const jFull = [30, 31, 32, 33, 34, 35].every(w => { const c = full("", {}, Object.assign(walk(w), { kidName: undefined })); return JSON.stringify(NB.generate("julian", clone(c))) === JSON.stringify(OLD.generate("julian", clone(c))); });
ok(jFull, "…and over a six-week walk through all 26 letters at that kid's own levels, every notebook is byte for byte the same");
FIRST.forEach(k => {
  const word = lookObj(NB, k).letterWords.J;
  ok(jLine(NB.generate("kid9", jCtx(k, "Jade"))) === "J is for Jade! ⭐" && jLine(NB.generate("kid9", jCtx(k, "jonah"))) === "J is for Jonah! ⭐", k + ": a child named Jade sees “J is for Jade! ⭐” (a lower-case jonah prints Jonah)");
  ok(jLine(NB.generate("kid9", jCtx(k, "Finn"))) === "J is for " + word.join(" ") && jLine(NB.generate("kid9", jCtx(k, "Finn"))) === jLine(OLD.generate("kid9", jCtx(k, "Finn"))) && jLine(NB.generate("kid9", jCtx(k, undefined))) === "J is for " + word.join(" "),
    k + ": anyone else (or no name) sees the look's own J word — “J is for " + word.join(" ") + "”, as before");
});
ok(jLine(NB.generate("julian", jCtx("", "Jonah"))) === "J is for Jonah! ⭐" && jLine(NB.generate("julian", jCtx("", "Max"))) === "J is for Jet ✈️" && jLine(OLD.generate("julian", jCtx("", "Max"))) === "J is for Jet ✈️",
  "a kid's own look renamed on the Notebook tab: a J name gets the J line, any other name the look's J word (as before)");
ok(NEWER.every(k => jLine(NB.generate("kid9", jCtx(k, "Jade"))) === jLine(OLD.generate("kid9", jCtx(k, "Jade"))) && /J is for Jet/.test(jLine(NB.generate("kid9", jCtx(k, "Jade"))))), "the newer looks keep their own J word for everyone, as built (not part of this change)");
const lowJ = NB.generate("kid9", full("shark", { nbLowercase: true }, Object.assign(walk(31), { kidName: "Jade" })));
ok(/j says \/j\/ · jellyfish 🪼/.test(text(lowJ.student)) && !/J is for/.test(lowJ.student), "with little letters on, j keeps its sound picture — a name is not a sound word");

// ── 4. nothing else changes ───────────────────────────────────────────────────────────────────────────────────────────
console.log("nothing else changes (baseline = this file with the block and its call sites out)");
// the three pieces, masked in both builds: a sound word, the J line, the cover's friends and the guide's animal list
const mask = (o) => JSON.stringify(o).replace(/( says \/[a-z]\/ · )[^<]*/g, "$1#").replace(/(J is for )[^<]*/g, "$1#")
  .replace(/(My Animal Friends<\/div><div class=\\"learn-val\\"[^>]*>)[^<]*/g, "$1#").replace(/(Animals<\/div><div class=\\"p-tval\\">)[^<]*/g, "$1#");
const spots = (n, o) => { const out = []; const re = [[/ says \/[a-z]\/ · [^<]*/g, "sound"], [/J is for [^<]*/g, "J"], [/My Animal Friends<\/div><div class="learn-val"[^>]*>[^<]*/g, "friends"], [/Animals<\/div><div class="p-tval">[^<]*/g, "guide animals"]];
  re.forEach(([r, name]) => { const a = (n.student + n.parent).match(r) || [], b = (o.student + o.parent).match(r) || []; if (a.join("|") !== b.join("|")) out.push(name); }); return out.sort().join(","); };
const NAMES = ["Finn", "Jade", undefined];
let cmp = 0; const leak = [], wrongSpot = [];
FIRST.forEach(k => [LEVELS[0], LEVELS[1], LEVELS[3], LEVELS[31], LEVELS[6], LEVELS[2]].forEach(lv => NAMES.forEach(nm => [{}, { masteryItems: noSounds }, { masteryItems: [] }, walk(32)].forEach((x, xi) => {
  const ctx = full(k, lv, Object.assign({}, x, { kidName: nm })), [n, o] = both("kid9", ctx); cmp++;
  if (mask(n) !== mask(o)) leak.push(k + "/" + JSON.stringify(lv).replace(/"nb|true|false|[{}"]/g, "") + "/" + nm + "/x" + xi);
  const got = spots(n, o), sounds = lv.nbLowercase && (ctx.masteryItems || []).some(it => it.subject === "Letter Sounds");
  const want = [].concat(k !== "construction" && sounds ? ["sound"] : [], nm === "Jade" && !lv.nbLowercase && n.student.indexOf("J is for") >= 0 ? ["J"] : [],
    // construction: no Animals deck → its own four friends (cover + guide); a deck animal with no picture → 🐾, not 🦕 (cover);
    // with little letters on, neither the cover nor the guide lists animals, so nothing there changes
    k !== "construction" ? [] : !(ctx.masteryItems || []).some(it => it.subject === "Animals") ? (lv.nbLowercase ? [] : ["friends", "guide animals"])
      : (!lv.nbLowercase && ctx.masteryItems.some(it => it.prompt === "Wombat")) ? ["friends"] : []).sort().join(",");
  if (got !== want) wrongSpot.push(k + "/lv" + LEVELS.indexOf(lv) + "/" + nm + "/x" + xi + ": " + got + " ≠ " + want);
}))));
ok(!leak.length, cmp + " notebooks of the first three looks: with the three pieces masked, byte for byte the same (pages, cursors, plan, guide)", leak.slice(0, 4).join(", "));
ok(!wrongSpot.length, "…and the pieces that DO change are exactly the expected ones for that look, name and level", wrongSpot.slice(0, 4).join(" | "));
// the two kids' own looks at their own levels, and the newer looks, and every school-age notebook: byte for byte
const same = []; let n2 = 0;
const eq = (kid, ctx, tag) => { n2++; const [n, o] = both(kid, ctx); if (JSON.stringify(n) !== JSON.stringify(o)) same.push(tag); };
["julian", "caleb"].forEach(kid => [{}, { masteryItems: items }, { masteryItems: [] }, { weekNum: "week36", numberCursor: { week: 35, from: 40, adv: 5 } }].forEach((x, xi) => eq(kid, base(Object.assign({ extraPages: allPages, units: [unit], spelling }, x)), kid + "/own/x" + xi)));
NEWER.forEach(k => LEVELS.forEach((lv, li) => ["Finn", "Jade", "Maximilian"].forEach(nm => eq("kid9", full(k, lv, { kidName: nm }), k + "/lv" + li + "/" + nm))));
["lincoln", "ellis", "lucy", "kid9"].forEach(kid => [{}, { bindingMargin: true }, { masteryItems: items, extraPages: allPages, units: [unit], spelling }].forEach((x, xi) => eq(kid, base(x), kid + "/x" + xi)));
ok(!same.length, n2 + " notebooks — the two kids' own looks at their own levels, space / farm / forest at all 32 level settings, every school-age and starter notebook — byte for byte the same", same.slice(0, 4).join(", "));
ok(NEWER.every(k => JSON.stringify(lookObj(NB, k)) === JSON.stringify(lookObj(OLD, k))) && JSON.stringify(Object.keys(NB.themes)) === JSON.stringify(Object.keys(OLD.themes)), "the newer looks' pieces and the picker list are untouched");
ok(FIRST.every(k => { const a = lookObj(NB, k), b = lookObj(OLD, k); delete a.soundWords; delete b.soundWords; delete a.curOpt; delete b.curOpt; return JSON.stringify(a) === JSON.stringify(b); }), "the first three looks' other pieces are the same objects' worth of data");

// ── 5. page fit ───────────────────────────────────────────────────────────────────────────────────────────────────────
// The pieces sit in the letter card (the cue line), the cover's fourth card and the guide's target cards. The cue changes
// width with the word: the longest sound words are 10 letters (footprints, pufferfish — as long as "fire truck"), and the
// J line carries the child's name, so a 10- and a 14-letter J name are measured. Level settings: each that changes those
// spots (little letters on/off) crossed with the ones that change the card they sit in (find it, teens).
const FIT_LV = [["capitals", {}], ["capitals + find it", { nbFindIt: true }], ["capitals + teens", { nbTeens: true }], ["little letters", { nbLowercase: true }],
  ["little letters + find it", { nbLowercase: true, nbFindIt: true }], ["all switches", LEVELS[31]]];
const FIT_X = [["sounds on", {}], ["sounds off", { masteryItems: noSounds }], ["no decks", { masteryItems: [] }], ["J name, 10 letters", { kidName: "Jacqueline" }], ["J name, 14 letters", { kidName: "Jacquelinemaya" }]];
for (let w = 31; w <= 35; w++) FIT_X.push(["week " + w, walk(w)]);
const MEASURE_FN = "function(doc){var b=[],pages=0,max=0;doc.querySelectorAll('.page').forEach(function(pg,i){pages++;" +
  "var oh=pg.scrollHeight-pg.clientHeight,ow=pg.scrollWidth-pg.clientWidth;max=Math.max(max,oh,ow);if(oh>1||ow>1)b.push(i+': page +'+oh+'h +'+ow+'w');" +
  "pg.querySelectorAll('.body,.card,.col,.grid2,.path-wrap,.cover-learn,.learn-card,.p-sec,.header,.todo,.cover-body,.cue').forEach(function(el){var h=el.scrollHeight-el.clientHeight,w=el.scrollWidth-el.clientWidth;max=Math.max(max,h,w);if(h>2||w>2)b.push(i+': .'+el.className.split(' ')[0]+' +'+h+'h +'+w+'w');});" +
  "pg.querySelectorAll('.cue').forEach(function(c){var card=c.closest('.card');if(card&&c.getBoundingClientRect().right>card.getBoundingClientRect().right+1)b.push(i+': the cue runs past its card');});" +
  "var ft=pg.querySelector('.footer');if(ft&&ft.getBoundingClientRect().bottom>pg.getBoundingClientRect().bottom+1)b.push(i+': footer below the page');" +
  "var pw=pg.querySelector('.path-wrap');if(pw){var top=pw.getBoundingClientRect().top;pg.querySelectorAll('.grid2 .col .card').forEach(function(c){var r=c.getBoundingClientRect();if(r.top<top&&r.bottom>top+1)b.push(i+': a card runs under the warm-up strip');});}" +
  "});return{bad:b,pages:pages,max:max};}";
function chromeMeasure(jsFile) {
  const chrome = process.env.CHROME_BIN || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
  if (!fs.existsSync(chrome)) { console.log("Chrome page measurement — SKIPPED (no Google Chrome at " + chrome + "; set CHROME_BIN)"); return null; }
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "nb-lookfix-"));
  if (!jsFile) { jsFile = path.join(dir, "baseline.js"); fs.writeFileSync(jsFile, oldSrc); }   // the baseline build, measured the same way
  const cfg = [];
  FIRST.forEach(k => FIT_LV.forEach(l => FIT_X.forEach(x => cfg.push({ name: k + " · " + l[0] + " · " + x[0], look: k, kid: "kid9", ctx: full(k, l[1], x[1]) }))));
  // the two kids' own looks: the dinosaur one with little letters + sounds on, the construction one with capitals (its friends)
  [["own dino · little letters", "julian", { nbLowercase: true }], ["own construction · capitals", "caleb", { nbLowercase: false, nbFindIt: false, nbTeens: false, nbShapesAhead: false }]].forEach(([nm, kid, lv]) =>
    FIT_X.slice(0, 3).forEach(x => cfg.push({ name: nm + " · " + x[0], look: "own", kid, ctx: full("", lv, Object.assign({ kidName: undefined }, x[1])) })));
  fs.writeFileSync(path.join(dir, "m.html"), '<!doctype html><meta charset="utf-8"><pre id="out">PENDING</pre><script src="file://' + jsFile + '"></script><script>\n' +
    "var CFG=" + JSON.stringify(cfg).replace(/</g, "\\u003c") + ",M=" + MEASURE_FN + ";\n" +
    "(async function(){var res=[];for(var c of CFG){var o=window.HoweNotebooks.generate(c.kid,c.ctx);for(var part of ['student','parent']){" +
    "var f=document.createElement('iframe');f.style.cssText='position:absolute;left:0;top:0;width:1000px;height:1200px;border:0';document.body.appendChild(f);" +
    "await new Promise(function(r){f.onload=r;f.srcdoc=o[part];});var d=f.contentDocument;try{await Promise.race([d.fonts.ready,new Promise(function(r){setTimeout(r,6000);})]);}catch(e){}" +
    "await new Promise(function(r){setTimeout(r,60);});var m=M(d);m.name=c.name+' ('+part+')';m.look=c.look;m.emj=d.querySelectorAll('img.ha-emj').length;" +
    "m.fonts=Array.from(d.fonts).filter(function(x){return x.status==='loaded';}).length;res.push(m);f.remove();}}" +
    "document.getElementById('out').textContent='RESULT'+JSON.stringify(res)+'ENDRESULT';})().catch(function(e){document.getElementById('out').textContent='RESULT'+JSON.stringify({error:String(e&&e.stack||e)})+'ENDRESULT';});\n</script>");
  let dom = "";
  try {
    dom = require("child_process").execFileSync(chrome, ["--headless=new", "--disable-gpu", "--no-first-run", "--user-data-dir=" + path.join(dir, "profile"), "--allow-file-access-from-files",
      "--virtual-time-budget=1800000", "--dump-dom", "file://" + path.join(dir, "m.html")], { stdio: ["ignore", "pipe", "ignore"], maxBuffer: 64 * 1024 * 1024, timeout: 900000 }).toString();
  } catch (e) {
    dom = String((e && e.stdout) || "");   // Chrome can finish the page and still exit non-zero while shutting down
    if (!/RESULT[\s\S]*ENDRESULT/.test(dom)) { console.log("Chrome page measurement — SKIPPED: " + String(e.message).split("\n")[0].slice(0, 160)); return null; }
  }
  const m = /RESULT([\s\S]*?)ENDRESULT/.exec(dom);
  let res = null; try { res = JSON.parse(m[1].replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&")); } catch (e) {}
  try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {}
  return res;
}
function measureBoth() {
  const res = chromeMeasure(file); if (!res) return;
  if (res.error) { ok(false, "Chrome page measurement ran", res.error); return; }
  const was = chromeMeasure(null) || [], wasBy = {}; was.forEach(x => { wasBy[x.name] = x; });
  console.log("Chrome page measurement (Google Chrome headless; built in the browser; " + res[0].fonts + " font faces loaded, " + res[0].emj + " emoji as images on the first notebook)");
  // a clip is this change's only if the same notebook did not clip the same way before it (the baseline, measured alike)
  FIRST.concat(["own"]).forEach(k => {
    const r = res.filter(x => x.look === k), pages = r.reduce((a, x) => a + x.pages, 0), max = Math.max.apply(null, r.map(x => x.max));
    const mine = r.filter(x => x.bad.length && (!wasBy[x.name] || wasBy[x.name].bad.join("|") !== x.bad.join("|"))), before = r.filter(x => x.bad.length && wasBy[x.name] && wasBy[x.name].bad.join("|") === x.bad.join("|"));
    ok(r.length > 0 && was.length === res.length && !mine.length, k + ": " + r.length / 2 + " notebooks, " + pages + " pages measured — largest overflow " + max + " px; clipped by this change: " + mine.length +
      (before.length ? "; clipped the same before it (not this change): " + before.map(x => x.name + " → " + x.bad.join("; ")).join(" | ") : ""), mine.slice(0, 3).map(x => x.name + " → " + x.bad.slice(0, 2).join("; ")).join(" | "));
  });
}
if (process.argv.includes("--measure")) measureBoth();
else console.log("Chrome page measurement — SKIPPED (run `node test_nb_lookfix.js --measure`)");
console.log(pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
