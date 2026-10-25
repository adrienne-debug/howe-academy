/*
 * Node tests — 🏛 Word Roots starter unit, step 1 of 6 (WORDROOTS block; her ask 2026-10-24, design
 * DESIGN_word_roots_unit_2026-10-24.md §2 + §6 PR 1, adjusted for her answers in §7).
 *   · One deck, "Greek & Latin Roots" exactly. Stages: Beginning, Levels 1–4, More roots (open now: lesson 0).
 *   · Every root the boys have today (built-in lists, Ellis's 50 saved, the 17 live cards) maps to exactly ONE unit card,
 *     except the ones she sent to Ellis's "Our words" (ir-, omni-, the number prefixes) and the dropped word "active".
 *     Ellis's and the live cards' names are unit names byte-for-byte, so attaching later never makes a second card.
 *   · No two cards are the same root (same-root keys: lowercase, no "-", split on "/" and ",", plus aka).
 *   · Every lesson matches the books' contents pages (transcribed below): each listed root is a card at its FIRST lesson,
 *     a later listing folds into the earlier card.
 *   · No defsOnBank, no cardLessons, nobody enrolled; the 📚 Add writes ONE create-only node (unitStudies/word_roots).
 * Runs the real STARTER_UNITS block sliced from index.html.   run: node test_word_roots_unit.js
 */
const fs = require("fs"), path = require("path");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x) : "")); } };

const a = src.indexOf("// STARTER_UNITS_START"), b = src.indexOf("// STARTER_UNITS_END");
const block = src.slice(a, b);
const wa = src.indexOf("// WORDROOTS_START"), wb = src.indexOf("// WORDROOTS_END");
ok("WORDROOTS block present once, inside the STARTER_UNITS block", wa > a && wb > wa && wb < b && src.indexOf("// WORDROOTS_START", wa + 1) < 0);
function load(env) {
  env = env || {};
  const g = { unitStudies: env.unitStudies || {}, mom: env.mom !== false, dry: !!env.dry, db: env.db || null, rendered: 0, content: { innerHTML: "" } };
  const api = new Function("G", `
    let unitStudies=G.unitStudies; const db=G.db;
    function momHere(){ return G.mom; } function _dryRun(){ return G.dry; }
    function renderUnits(){ G.rendered++; }
    const document={ getElementById:()=>G.content };
    ${block}
    return { STARTER_UNITS, WR_DATA, WR_DECK, _starterUnitsHtml, starterUnitAdd, _unitStagedEnrollPending, _ustCards, _ustFamilies, get us(){ return unitStudies; } };`)(g);
  api.G = g; return api;
}
const api = load();
const U = api.STARTER_UNITS.word_roots();
const D = U.decks[0], C = D.cards;
const byName = new Map(C.map(c => [c.name, c]));

console.log("── the record ──");
ok("registered as starter word_roots, version 1", U.id === "word_roots" && U.starter === "word_roots" && U.starterVer === 1);
ok("title Word Roots, 🏛 (the deck's own emoji)", U.title === "Word Roots" && U.emoji === "\u{1F3DB}");
ok("ONE deck, key exactly \"Greek & Latin Roots\"", U.decks.length === 1 && D.key === "Greek & Latin Roots" && api.WR_DECK === "Greek & Latin Roots");
ok("flip deck, 2 new at a time, grouped by family", D.mode === "flip" && D.introCap === 2 && D.groupBy === "family");
ok("no defsOnBank (a bank def would make recite cards)", !("defsOnBank" in D) && !("defsOnBank" in U));
ok("no cardLessons (that flag turns on the AAS spelling-test tools)", !("cardLessons" in U));
ok("no `active` field, notebook insert off, family sort on", !("active" in U) && U.nbInsert === false && U.famSort === true);
ok("nobody enrolled: no enrolled / kidStage on the record", !("enrolled" in U) && !("kidStage" in U));
ok("stages: Beginning, Level 1, 2, 3, 4, More roots", U.stages.map(s => s.n + ":" + s.label).join("|") === "1:Word Roots Beginning|2:Word Roots Level 1|3:Word Roots Level 2|4:Word Roots Level 3|5:Word Roots Level 4|6:More roots");
ok("staged unit → the plain enroll stays closed", api._unitStagedEnrollPending(U));
ok("fresh object per call", api.STARTER_UNITS.word_roots() !== U && api.STARTER_UNITS.word_roots().decks[0].cards[0] !== C[0]);
ok("no 🔀 in index.html", src.indexOf("\u{1F500}") < 0);

console.log("\n── the cards ──");
const st = n => C.filter(c => c.stage === n);
const counts = [1, 2, 3, 4, 5, 6].map(n => st(n).length);
console.log("     cards per stage (Beginning, L1, L2, L3, L4, More): " + counts.join(", ") + " = " + C.length);
ok("cards per stage 99 / 40 / 42 / 49 / 106 / 33 = 369", counts.join() === "99,40,42,49,106,33" && C.length === 369, counts);
ok("names unique", byName.size === C.length);
ok("no name has a character Firebase forbids in a value path (. # $ [ ])", C.every(c => !/[.#$\[\]]/.test(c.name)));
ok("every card has a meaning", C.every(c => typeof c.def === "string" && c.def.trim().length > 0));
ok("order runs 1…N with no gaps", C.every((c, i) => c.order === i + 1));
ok("Beginning: lesson 1–24, family 'Lesson N'", st(1).every(c => c.lesson >= 1 && c.lesson <= 24 && c.family === "Lesson " + c.lesson));
ok("Levels: lesson = level×100 + book lesson, family 'Lesson <book lesson>'", [2, 3, 4, 5].every(n => st(n).every(c => Math.floor(c.lesson / 100) === n - 1 && c.family === "Lesson " + (c.lesson % 100))));
ok("More roots: lesson 0 (open now), themed families", st(6).every(c => c.lesson === 0 && !/^Lesson/.test(c.family)));
ok("example words: 3 each, only on Beginning + More roots", C.filter(c => c.ex).every(c => c.ex.length === 3 && (c.stage === 1 || c.stage === 6)) && C.filter(c => c.ex).length === 95 + 33);
ok("one -ion card covers -tion / -ation", byName.get("-ion").aka.join() === "-tion,-ation,u-ation" && !byName.has("-tion") && !byName.has("-ation"));
ok("kid's spellings kept: cycl, aud (book: cycle, audi)", byName.get("cycl").lesson === 4 && byName.get("aud").lesson === 11 && !byName.has("cycle") && !byName.has("audi"));
ok("scope's back is 'see' (what his card shows)", byName.get("scope").def === "see");
ok("her moves: il-, a- → Level 1; poly- → Level 3 Lesson 1", byName.get("il-").stage === 2 && byName.get("a-").stage === 2 && byName.get("poly-").stage === 4 && byName.get("poly-").lesson === 301);
const ourWords = ["ir-", "omni-", "-quadra", "penta-", "hexa-", "hepta-", "oct-", "novem-", "deca-"];
ok("not unit cards: ir-, omni-, the number prefixes, active", ourWords.concat(["active", "omni"]).every(n => !byName.has(n)));
ok("Beginning word-parts roots with no lesson open at the book's end (24)", ["capt", "centr", "mar", "pharmac"].every(n => byName.get(n).stage === 1 && byName.get(n).lesson === 24));
{ const f = api._ustFamilies(U, 1); ok("Beginning families run Lesson 1 … Lesson 24 in order", f.length === 24 && f.every((x, i) => x === "Lesson " + (i + 1)), f); }
{ const f = api._ustFamilies(U, 6); ok("More roots keep their theme order", f.join("|") === "Time & change|People & feelings|How many & how much|Where & which way|Science words|See, say, carry|Move & send", f); }

console.log("\n── one card per root ──");
const keysOf = s => String(s).toLowerCase().split(/[\/,]/).map(x => x.replace(/-/g, "").trim()).filter(Boolean);
const cardKeys = c => new Set([].concat(keysOf(c.name), ...(c.aka || []).map(keysOf)));
const keyIdx = new Map(); C.forEach(c => cardKeys(c).forEach(k => { if (!keyIdx.has(k)) keyIdx.set(k, []); keyIdx.get(k).push(c.name); }));
// The one true homograph: Level 1's nom/nomin (Latin, "name") and Level 3's nom (Greek, "law, order") — different roots.
const HOMOGRAPH = new Set(["nom"]);
const shared = [...keyIdx].filter(([k, v]) => v.length > 1 && !HOMOGRAPH.has(k));
ok("no two cards share a same-root key (only the nom homograph, by design)", !shared.length, shared);
ok("…and the homograph is exactly nom/nomin (name) vs nom (law)", JSON.stringify(keyIdx.get("nom")) === JSON.stringify(["nom/nomin", "nom"]) && byName.get("nom/nomin").def === "name" && byName.get("nom").def === "law, order");
const find = n => { const hit = new Set(); keysOf(n).forEach(k => (keyIdx.get(k) || []).forEach(x => hit.add(x))); return [...hit]; };

// What the boys have today (GET 2026-10-24, design §1). Built-in lists are read back from index.html below.
const ELLIS_CODE = ["bio", "geo", "graph", "scope", "tele", "auto", "micro", "macro", "hydro", "therm", "photo", "meter", "port", "rupt", "struct", "dict", "scrib/script", "tract", "aud", "vis/vid", "mit/miss", "ject", "duct", "spect", "form", "cred", "flex/flect", "aqua", "terra", "astro"];
const LINCOLN_CODE = ["chron", "morph", "bene", "mal", "omni", "poly", "mono", "anthro", "phil", "phob", "path", "log/logy", "arch", "neo", "pseudo", "syn/sym", "anti", "hyper", "hypo", "circum", "inter", "intra", "trans", "pre", "post", "retro", "sub", "super", "uni", "bi"];
const ELLIS_SAVED = ["peri-", "phob", "-ia", "acro", "bat", "naut", "uni-", "corn", "dis-", "re-", "un-", "im-", "il-", "a-", "in-", "ir-", "act", "dent", "ego", "-ive", "-ist", "-ism", "active", "-able", "-ful", "-ible", "-id", "-ly", "-ness", "-or", "-ure", "bi-", "tri-", "cycl", "-quadra", "penta-", "hexa-", "hepta-", "oct-", "novem-", "deca-", "poly-", "omni-", "counter-", "inter-", "trans-", "ab-", "e-", "ex-", "op-"];
const LIVE = ["micro", "scope", "tele", "acro", "astro", "bat", "geo", "graph", "therm", "peri-", "hydro", "phob", "-ia", "chron", "morph", "bene", "mal"];
ok("built-in lists match index.html (Ellis 30, Lincoln 30)", src.indexOf('"Greek & Latin Roots":' + JSON.stringify(ELLIS_CODE)) > 0 && src.indexOf('"Greek & Latin Roots":' + JSON.stringify(LINCOLN_CODE)) > 0);
ok("Ellis saved 50 (49 roots + active)", ELLIS_SAVED.length === 50 && new Set(ELLIS_SAVED).size === 50);
const NOT = new Set(ourWords.concat(["active", "omni"]));
const all = [...new Set(ELLIS_CODE.concat(ELLIS_SAVED, LINCOLN_CODE, LIVE))];
ok("110 names today → " + all.length + " distinct spellings", ELLIS_CODE.length + ELLIS_SAVED.length + LINCOLN_CODE.length === 110);
{ const bad = all.filter(n => !NOT.has(n) && find(n).length !== 1);
  ok("every existing root maps to exactly one card", !bad.length, bad.map(n => [n, find(n)])); }
{ const bad = [...NOT].filter(n => find(n).length);
  ok("…and the Our-words ones (and Lincoln's omni) map to none", !bad.length, bad); }
{ const bad = ELLIS_CODE.concat(ELLIS_SAVED).filter(n => !NOT.has(n) && !byName.has(n));
  ok("Ellis's names are unit names byte-for-byte (nothing renamed)", !bad.length, bad); }
ok("the 17 live cards are unit names byte-for-byte", LIVE.every(n => byName.has(n)));
ok("Ellis's 13 live cards are Beginning Lesson 1; Lincoln's 4 are More roots (open now)", LIVE.slice(0, 13).every(n => byName.get(n).lesson === 1 && byName.get(n).stage === 1) && LIVE.slice(13).every(n => byName.get(n).stage === 6 && byName.get(n).lesson === 0));
ok("Lincoln's book prefixes land on their Beginning lessons (uni 2, bi 4, inter 5, trans 5, pre 12, sub 19, log/logy 11)",
  [["uni", 2], ["bi", 4], ["inter", 5], ["trans", 5], ["pre", 12], ["sub", 19], ["log/logy", 11]].every(([n, l]) => { const f = find(n); return f.length === 1 && byName.get(f[0]).stage === 1 && byName.get(f[0]).lesson === l; }));

console.log("\n── lessons match the contents pages ──");
// Beginning, page iii (her photo 10/24, ©2012): every word part printed per lesson.
const BEGIN = { 1: "micro, scope, tele, acro, astro, bat, geo, graphy, meter, naut, thermo", 2: "uni-, dis-, re-, un-", 3: "-able, ti-ful, -ible, -id, -ism, -ist, -ive, -ly, -ness, -or, -ure",
  4: "cycle, uni-, bi-, tri-", 5: "act, counter-, inter-, re-, trans-", 6: "rupt, ab-, dis-, e-, inter-", 7: "pose, com-, dis-, ex-, im-, op-, pro-", 8: "loc, -al, -ale, -ate, -ly",
  9: "medi, -an, -ate, at-or, -um", 10: "grad, u-al, u-ate, u-ation, i-ent", 11: "audi, -ence, -ist, -olog, -ology, t-orium, t-ory, -tion", 12: "dict, e-, pre-, -ary, -ate, -ion",
  13: "fer, con-, in-, re-, trans-, -able, -ence, t-ile", 14: "flect, flex, in-, re-, -ible, -ion, -or", 15: "port, ex-, im-, sup-, trans-, -able, -ation", 16: "plen, plet, plete, com-, de-, -ion, t-y",
  17: "scrib, scribe, script, de-, in-, pre-, -able, -ion, -ive", 18: "sens, sent, con-, dis-, in-, -ation, it-ive, i-ment", 19: "tract, at-, ex-, sub-, -ion, -or",
  20: "struct, con-, de-, in-, ob-, -ible, -ure", 21: "viv, vive, con-, re-, -acious, -al, i-al, i-fy, -id", 22: "vert, vers, con-, di-, in-, re-, -ible, -ical, -ion",
  23: "serv, serve, con-, pre-, re-, sub-, -ant, -ation, i-ent", 24: "therm, thermo, thermos, cline, meter, stat, -al" };
// Beginning cards NOT on the contents page: lesson from where she sorted them in Ellis's list (§2.2), or the book's end.
const BEGIN_INFERRED = new Set(["peri-", "hydro", "phob", "-ia", "corn", "im-", "in-", "dent", "ego", "capt", "centr", "mar", "pharmac"]);
// Levels 1–4 contents pages (publisher samples, ©2015/2018) — roots only, as printed (book typos kept: psend, heiro, tyhp, vic).
const LV = {
  1: ["struct", "tract, vinc/vince", "mob/mot/mote/mov", "brev/cede/ceed/cess", "celer, gress", "avi/avia, memor", "aqu/aqua, mar, pug/pugn", "act, aud", "juven, vene/vent", "cogn, termin",
    "scribe/script", "capt/cept, tact", "dict, rupt", "pose/posit", "fract/frag", "anim, cred, equ", "duct, vol", "vers/verse/vert", "loqu, nom/nomin", "carni, manu, scrib/scribe/script, vor/vour",
    "annu/enni, later", "tempor, ver", "dur/dure, viv/vive", "claim/clam, equ/equi, voc", "cumul, lumin", "nov, voc/voci", "clude/clus, herbi, vor", "form, son, tort", "spec/spect, vis", "miss/mit/mitt, sect"],
  2: ["acer/acr/acu, migr", "al/alter, tru", "arbitr, noc/nox", "auct/aug/aux/auxano", "capit/capita, corp/corpor", "cern/cert", "crypt, gnos", "dign, press", "dom, domin/domit", "dorm, tact/tang",
    "dyn/dynam/dynamo, meter/metr", "err, spers/sperse", "centr, ethn/ethno", "flect/flex", "funct", "gastr/gastro, nom/nomin", "gen/gend/gener", "grac/grace/grat/grate", "ject", "join/joint/jug/junct",
    "dict, jur/jure/juris/just", "lect/leg/lig", "lingu, turb", "meter, ped/pede/pedo, veloc/veloci, thermo", "pel/puls/pulse", "gen, graph, mania, meter/metr, techn, pyro", "rid/ris, sens/sense/sent",
    "sed/sede/sess/side", "soci", "solu/solute/solv/solve", "tect/teg/tege", "verd/virid, strict"],
  3: ["chrom/chrome/chromo, gen, poly, scope", "derm, meso, pachy", "chron/chrono, geo, meter", "anth, heli, meso, nat, opt, phil, phyte, somat, therm", "chrono, gen, graph, meter, therm/thermo",
    "gen, geo, graph, hydr/hydro, path, phone, therm", "andr/andro, center, crac, gen, gyn, poly", "auto, bio, cosm, crac, gen, graph, nom", "gen, hydr, nom, onym, phon", "anthrope, gam, gyn, log, mis/miso, ne",
    "nom, path, poly, psycho, the/theo", "astro, geo, graph, hydro, metr, naut, nom", "agro, bio, geo, graph/grapho, neo, nom/nomo", "centr, gen, gynec/gyneco, metr, opt/opto, phone", "bio, graph, metr, nom, psych/psycho",
    "anthrop/anthropo, meter, nom, path, phil", "gram, log/logo, mania, neo", "crac, gen, gram, ideo, phob, phone", "biblio, graph/grapho, klept/klepto, mania, phile, phob", "acro, cardio, gyno, hydro, klepto, neo, phob, phono, xeno",
    "gen, gram, homo, path, phon/phone, poly, tele", "meter, bio, chron, hydro, meter, phono, seismo, therm", "arch, centr, gam, gen, gyn, poly", "centr, cycl/cycle/cyclo, gen, meter, pod, poly",
    "centr, chrom, gen, geo, graph, therm", "bio, heli, log, metr, nom, phon", "bio, metr/metro, nome", "gen, metr, path/patho, psycho, somat/somato", "bronch/broncho, gen, gram, phon, scope",
    "cardi/cardio, gram, graph, path, scope", "bio, cosm, graph, meter, micro, phone, scope", "anthrop, arch, gyn, log, patri, phil/philo", "anthrop, cosm, crac, demo, gen, gyno, meso, neo",
    "bi/bio, cosm, gen, graph, macro, mania, metr, ops", "hydro, macro, micro, phone, scop/scope, tele", "gra/gram, metr, path, phone, tele, thermo", "centr, graph, helio, meter, phile, phono, scope, xeno",
    "ge, gen/geno, mania, patho, psycho", "dermat/dermato, graph, podo", "bi, caco, dem, phon, taph, therm", "clast, graph, icono, litho, myri, onym, poly, psend", "arthr, cephal, entom, hemat, hydro, hypno, thanas, therap"],
  4: ["acou, dog/dox, meter, ortho", "aesth/esth/esthesi/esthesio, meter", "agon, culp, prot", "agora, fort, ornitho/phob", "anemo, bar/baro, meter/metr, phil, trop", "anth/antho, chrys, geo, graph, heli, phag, phyte",
    "arch/arche/crac, glyph, hier/heiro, olig, type", "aort, arct, thes/thet", "asper, turb", "branchi/branchio, helminth, platy, pod/pus, rrhine", "cant", "cephal/cephalo, morph, thorax", "cint, cuss",
    "cinemat/cinemato/kin, esth/esthe, graph", "ciner, combus", "colla, gen, mano, meter, sphygm/sphygmo/sphyx", "cryo, cryst, gen, phil, scop, therap", "dactyl/dactylio/dactylo, glyph, gram, ptero, scop",
    "cardio, echo, gram, lal, locat", "anthrop, eo, graph, lith/litho, paleo, sphere", "ergo/urg, metall, meter, nom, phob, pyro", "calypt, peps/pept, phor", "felic, troph", "flu/fluc/flux",
    "ambul, foli, somn", "glac", "gloss/glosso/glot/glott, lal, poly", "gen, greg, tum/tumori", "caust, gram, hol/holo, stas/stat/statis", "hypn/hypno, narco, phob, therap", "fauna, ichthy/ichthyo, saur",
    "lav/lu/luge, pur/purg/purge", "anim, loqu, magn/magni", "ev, medi, terr", "crypto, melan, mnem/mnes", "moll/mollusk", "leps, mania, narc/narco, thes", "dont, dox, ortho, graph, ped, scop",
    "gen, mor, ox/oxy/oxysm", "arch, pater/patri", "pend/pens", "glyph, graph, petr/petro", "anthropo, eso, ichthyo, phag/phago, phyllo, sarco, tomy, xero", "phys",
    "chrome, cryo, gen, morph, patho, phag, phyte/phyto, therap", "plac", "pon/pone/pose", "brachy, pter/ptero, saur", "gen, pyret/pyreto, pyro, therap, tyhp", "secute/sequ", "sec/sicc",
    "centre, dont, graph, scop, selen/seleno", "surg/surrect, trauma/traumat", "card, graph, meter, phras, scope, tachisto/tachy", "ten", "appendec/appendix, micro, tme/tom/tome/tomy", "trude/trus",
    "fug, phob, verm/vermi, vor", "elast, meter, vic/visco", "derma, graph, ophthalm, phyte, therm, xer/xero", "graph, phag, phone, xyl/xylo"]
};
// Printed items that need a hand fold: two roots in one item, a homograph (nom, bi), or a book typo.
const FOLD = { "brev/cede/ceed/cess": ["brev", "cede/ceed/cess"], "ornitho/phob": ["ornitho", "phob"], "arch/arche/crac": ["arch", "crac"], "al/alter": ["alter"],
  "nom/nomin": ["nom/nomin"], "nom": ["nom"], "nom/nomo": ["nom"], "bi/bio": ["bio"], "bi": ["bio"], "ne": ["neo-"], "psend": ["pseudo-"], "tyhp": ["typh"] };
// Left out on purpose (said in the PR): Level 2 Lesson 2 "tru" — its meaning isn't on the contents page.
const UNPLACED = new Set(["tru"]);
const LEVEL_EXTRA = new Set(["il-", "a-"]);   // Ellis's saved entries, her answer: Level 1, no lesson given → its end
const first = new Map(), problems = [];
const see = (item, gate) => { if (UNPLACED.has(item)) return; const names = FOLD[item] || find(item);
  if (names.length !== 1 && !FOLD[item]) { problems.push([item, gate, names]); return; }
  names.forEach(n => { if (!byName.has(n)) { problems.push([item, gate, "no card " + n]); return; } if (!first.has(n) || first.get(n) > gate) first.set(n, gate); }); };
Object.keys(BEGIN).forEach(l => BEGIN[l].split(", ").forEach(it => see(it, +l)));
Object.keys(LV).forEach(lv => LV[lv].forEach((line, i) => line.split(", ").forEach(it => see(it, lv * 100 + i + 1))));
ok("every printed root resolves to one card (or a listed fold)", !problems.length, problems);
ok("Level contents: 30 / 32 / 42 / 61 lessons transcribed", LV[1].length === 30 && LV[2].length === 32 && LV[3].length === 42 && LV[4].length === 61);
{ const bad = C.filter(c => c.stage === 1 && !BEGIN_INFERRED.has(c.name) && first.get(c.name) !== c.lesson).map(c => [c.name, c.lesson, first.get(c.name)]);
  ok("Beginning: each contents-page card sits at its FIRST lesson", !bad.length, bad); }
{ const bad = C.filter(c => c.stage === 1 && BEGIN_INFERRED.has(c.name) && first.has(c.name) && first.get(c.name) < c.lesson).map(c => [c.name, c.lesson, first.get(c.name)]);
  ok("…the inferred ones never open later than the page lists them (im- L2 ≤ L7, in- L2 ≤ L13)", !bad.length, bad); }
{ const bad = C.filter(c => c.stage >= 2 && c.stage <= 5 && !LEVEL_EXTRA.has(c.name) && first.get(c.name) !== c.lesson).map(c => [c.name, c.lesson, first.get(c.name)]);
  ok("Levels 1–4: each card sits at the first lesson that lists it", !bad.length, bad); }
{ const bad = [...first].filter(([n, g]) => { const c = byName.get(n); return c.lesson > g; });
  ok("no card opens later than any lesson that teaches it (a repeat folds into the earlier card)", !bad.length, bad); }
ok("a root taught again later stays one card: therm (Beginning L1 = Level 3 L4 …)", byName.get("therm").lesson === 1 && find("thermo").length === 1 && find("therm/thermo")[0] === "therm");
ok("More roots a level also teaches stay in More roots (open now): chron, phil, path, arch, bio", ["chron", "phil", "path", "arch", "bio"].every(n => byName.get(n).stage === 6));
ok("Level 1 starts at Lesson 2 (Lesson 1's struct is a Beginning root)", Math.min(...st(2).map(c => c.lesson)) === 102 && first.get("struct") === 20);

console.log("\n── the stock enroll can't run on Word Roots (her OK 10/24: \"the real attach comes in step 3\") ──");
function world() {
  const G = { masteryData: { ellis: [{ id: "ell_micro", subject: "Greek & Latin Roots", prompt: "micro", status: "active" }], ellis_settings: { definitions: { micro: "small" } } },
    currData: { subjects: { ellis: { spelling: { display: "Spelling" } } } }, writes: [], unitStudies: {}, content: { innerHTML: "" } };
  const db = { ref(p) { return { update(v) { G.writes.push(["update", p, v]); }, set(v) { G.writes.push(["set", p, v]); }, transaction() { return Promise.resolve({ committed: false }); } }; } };
  const w = new Function("G", "db", `
    const masteryData=G.masteryData, currData=G.currData; let unitStudies=G.unitStudies;
    function momHere(){ return true; } function _dryRun(){ return false; } function cap(s){ return s[0].toUpperCase()+s.slice(1); }
    function renderUnits(){} const HA_LS={ setItem(){} }; const document={ getElementById:()=>G.content };
    function mastDefKeyOk(n){ return !/[.$#\\[\\]\\/]/.test(n); } function mastGateChapter(){ return null; }
    ${block}
    return { STARTER_UNITS, WR_ENROLL_NOTE, _ustApply, _unitStageRowsHtml, unitStageFormOpen, unitStageFormSet, unitStageEnroll, unitStageMoveUp,
      setForm(f){ unitStageForm=f; }, get form(){ return unitStageForm; } };`)(G, db);
  ["word_roots", "all_about_spelling"].forEach(id => { G.unitStudies[id] = w.STARTER_UNITS[id](); });
  w.G = G; return w;
}
{ const w = world(), before = JSON.stringify(w.G.masteryData), wr = w.G.unitStudies.word_roots, roster = ["lincoln", "ellis", "lucy", "julian"];
  const rows = w._unitStageRowsHtml(wr, roster);
  ok("Word Roots page: no + kid buttons, the plain note instead", rows.indexOf("unitStageFormOpen(") < 0 && rows.indexOf("hooks up to each kid") > 0 && (rows.match(/not hooked up yet/g) || []).length === 4);
  ok("…every other staged unit keeps its + kid buttons (AAS)", (w._unitStageRowsHtml(w.G.unitStudies.all_about_spelling, roster).match(/unitStageFormOpen\('all_about_spelling'/g) || []).length === 4);
  w.unitStageFormOpen("word_roots", "ellis");
  ok("+ Ellis can't open the start form", w.form === null);
  w.setForm({ unitId: "word_roots", kid: "ellis", stage: 1, knows: "Lesson 3", subject: "word_roots", map: "", how: "knows" });
  w.unitStageEnroll();
  ok("stock enroll (forced form): writes nothing, enrolls nobody", w.G.writes.length === 0 && !wr.enrolled && !wr.kidStage);
  ok("_ustApply refuses the unit and leaves the kid's data in memory untouched", w._ustApply(wr, "ellis", 1, "", "word_roots", "") === null && JSON.stringify(w.G.masteryData) === before);
  wr.kidStage = { ellis: { stage: 1, knows: "", subject: "", map: "" } }; wr.enrolled = { ellis: true };
  w.unitStageMoveUp("word_roots", "ellis");
  ok("➡ move-up can't run the stock enroll either", w.G.writes.length === 0 && wr.kidStage.ellis.stage === 1);
  delete wr.kidStage; delete wr.enrolled; w.setForm(null);
  // another unit still enrolls exactly as before
  w.unitStageFormOpen("all_about_spelling", "ellis"); w.unitStageEnroll();
  const aas = w.G.unitStudies.all_about_spelling;
  ok("AAS still enrolls through the same buttons (kidStage written, cards seeded)", aas.enrolled && aas.enrolled.ellis === true && w.G.writes.some(x => x[1] === "unitStudies/all_about_spelling/kidStage/ellis") && w.G.writes.some(x => x[1] === "mastery/ellis")); }
{ // the two stock paths outside the sliced block: the plain enroll and the check-up start
  const fnSrc = n => { const i = src.indexOf("function " + n + "("); let d = 0; for (let k = src.indexOf("{", i); k < src.length; k++) { if (src[k] === "{") d++; else if (src[k] === "}") { d--; if (!d) return src.slice(i, k + 1); } } };
  const trap = new Proxy({}, { get() { throw new Error("touched the kid's data"); } });
  const run = (n, pre) => { let err = null; try { new Function("masteryData", "unitStudies", "_wrEnrollLocked", pre + fnSrc(n) + "; return " + n)(trap, { word_roots: { id: "word_roots", stages: [], decks: [] } }, u => !!(u && u.id === "word_roots"))("word_roots", "ellis"); } catch (e) { err = e; } return err; };
  ok("plain enroll (unitEnroll) returns before touching anything", run("unitEnroll", "function momHere(){return true;} function _unitStagedEnrollPending(){return false;}\n") === null);
  ok("check-up start (unitStageCheckup) returns before touching anything", run("unitStageCheckup", "function momHere(){return true;} const unitStageForm={unitId:'word_roots',kid:'ellis',stage:1};\n") === null); }

console.log("\n── 📚 starter list + Add ──");
ok("Mom sees Word Roots with its Add button", /starterUnitAdd\('word_roots'\)/.test(api._starterUnitsHtml()) && /Word Roots/.test(api._starterUnitsHtml()));
ok("…with its card count and stages", api._starterUnitsHtml().indexOf("369 cards") > 0 && /6\. More roots/.test(api._starterUnitsHtml()));
ok("kids see nothing", load({ mom: false })._starterUnitsHtml() === "");
ok("hidden once the family has it", !/starterUnitAdd\('word_roots'\)/.test(load({ unitStudies: { word_roots: { id: "word_roots" } } })._starterUnitsHtml()));
{ const t = load({ dry: true, db: { ref() { throw new Error("db touched in dry run"); } } });
  t.starterUnitAdd("word_roots");
  ok("dry run: added locally, no DB write", t.us.word_roots && t.us.word_roots.decks[0].cards.length === 369 && t.G.rendered === 1); }
{ const calls = []; const t = load({ mom: false, db: { ref(p) { calls.push(p); return { transaction() { return Promise.resolve({}); } }; } } });
  t.starterUnitAdd("word_roots"); ok("non-Mom: Add does nothing", calls.length === 0 && !t.us.word_roots); }
{ const calls = []; let result;
  const db = { ref(p) { return { transaction(fn) { calls.push(p); result = fn(null); return Promise.resolve({ committed: true }); } }; } };
  const t = load({ db }); t.starterUnitAdd("word_roots");
  setTimeout(() => {
    ok("live: ONE create-only transaction at unitStudies/word_roots — nothing else", calls.length === 1 && calls[0] === "unitStudies/word_roots" && result && result.id === "word_roots");
    ok("…the record written enrolls nobody", result && !result.enrolled && !result.kidStage);
    ok("live: transaction aborts if the family already has it", (() => { let r = "x"; const db2 = { ref() { return { transaction(fn) { r = fn({ id: "word_roots" }); return Promise.resolve({ committed: false }); } }; } };
      load({ db: db2 }).starterUnitAdd("word_roots"); return r === undefined; })());
    console.log("\n" + pass + " passed, " + fail + " failed");
    process.exit(fail ? 1 : 0);
  }, 0); }
