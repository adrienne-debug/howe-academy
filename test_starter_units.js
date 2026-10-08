// 📚 Starter units + 🧮 Math Fluency Path (STARTER_UNITS block, her ask 2026-10-02).
// Slices the real block out of index.html by its markers and runs it over stubs:
//  · the + − stage is EXACTLY Andrew's live DeWalt "Math Facts" bank (names + order), so
//    enrolling him later can't duplicate a card; every card carries a correct answer;
//  · × ÷ = 0s–12s, 313 cards; names are legal Firebase keys (they become definitions keys);
//  · the 📚 list is Mom-only, hides a unit the family already has, and "Add" writes ONE new
//    node (unitStudies/<id>) via a create-only transaction — nothing in dry run;
//  · staged units keep the plain enroll closed (Units detail shows a note, unitEnroll is inert).
// UNITS_SRC=<path> runs it against another copy of index.html.
const fs = require("fs"), path = require("path");
const src = fs.readFileSync(process.env.UNITS_SRC || path.join(__dirname, "index.html"), "utf8");
let pass = 0, fail = 0;
function ok(name, cond) { if (cond) { pass++; console.log("  ok  - " + name); } else { fail++; console.log("  FAIL- " + name); } }

const a = src.indexOf("// STARTER_UNITS_START"), b = src.indexOf("// STARTER_UNITS_END");
ok("STARTER_UNITS block present once", a > 0 && b > a && src.indexOf("// STARTER_UNITS_START", a + 1) < 0);
const block = src.slice(a, b);

function load(env) {
  env = env || {};
  const g = { unitStudies: env.unitStudies || {}, mom: env.mom !== false, dry: !!env.dry, db: env.db || null,
    rendered: 0, content: { innerHTML: "" } };
  const fn = new Function("G", `
    let unitStudies=G.unitStudies; const db=G.db;
    function momHere(){ return G.mom; } function _dryRun(){ return G.dry; }
    function renderUnits(){ G.rendered++; }
    const document={ getElementById:()=>G.content };
    ${block}
    return { STARTER_UNITS, _mfpCards, _starterUnitsHtml, starterUnitAdd, _unitStagedEnrollPending, get us(){ return unitStudies; } };`);
  const api = fn(g); api.G = g; return api;
}

// ── content ──
const api = load();
const u = api.STARTER_UNITS.math_fluency_path();
ok("unit id/title/emoji", u.id === "math_fluency_path" && u.title === "Math Fluency Path" && u.emoji === "\u{1F9EE}");
ok("notebook insert OFF by default (a facts drill, not a notebook unit)", u.nbInsert === false);
ok("8 stages, 6–8 point at the Math Facts deck", u.stages.length === 8 && u.stages[7].deck === "Math Facts" && u.stages[5].deck === "Math Facts" && u.stages[6].deck === "Math Facts" && !u.stages[0].deck);
ok("decks: Numbers, Counting (Julian's names), Number Sense, Math Facts", JSON.stringify(u.decks.map(d => d.key)) === JSON.stringify(["Numbers", "Counting", "Number Sense", "Math Facts"]));
const mf = u.decks.find(d => d.key === "Math Facts");
ok("facts deck key stays 'Math Facts' (app special-cases it), quiz mode", mf.mode === "quiz" && mf.groupBy === "family");
const cards = mf.cards;
// ── stages 1–4 ──
const dk = k => u.decks.find(d => d.key === k).cards;
ok("Numbers: 1–20 flash, 1–10 stage 1, 11–20 stage 2, no back", dk("Numbers").length === 20 && dk("Numbers").every((c, i) => c.name === String(i + 1) && c.stage === (i < 10 ? 1 : 2) && c.def == null) && u.decks[0].mode === "flash");
ok("Counting: one–twenty (stages 1–2) + thirty…one hundred (stage 4), names the counting picture knows", dk("Counting").length === 28 && dk("Counting")[9].name === "ten" && dk("Counting")[19].name === "twenty" && dk("Counting")[27].name === "one hundred" && dk("Counting").slice(20).every(c => c.stage === 4));
ok("Numbers/Counting families 1–5 · 6–10 · 11–15 · 16–20", JSON.stringify([...new Set(dk("Numbers").map(c => c.family))]) === JSON.stringify(["1–5", "6–10", "11–15", "16–20"]));
const ns = dk("Number Sense");
ok("Number Sense: 86 flip cards — stage 3 = 48, stage 4 = 16, stage 5 = 22", ns.length === 86 && ns.filter(c => c.stage === 3).length === 48 && ns.filter(c => c.stage === 4).length === 16 && ns.filter(c => c.stage === 5).length === 22 && u.decks[2].mode === "flip");
ok("Stage 5 families: Make 5 · Make 10 · Partners of 10", JSON.stringify([...new Set(ns.filter(c => c.stage === 5).map(c => c.family))]) === JSON.stringify(["Make 5", "Make 10", "Partners of 10"]));
const nsAns = c => { let m; if ((m = /^1 more than (\d+)$/.exec(c.name))) return +m[1] + 1; if ((m = /^1 less than (\d+)$/.exec(c.name))) return +m[1] - 1;
  if ((m = /^Which is bigger: (\d+) or (\d+)\?$/.exec(c.name))) return Math.max(+m[1], +m[2]); if ((m = /^10 \+ (\d)$/.exec(c.name))) return 10 + +m[1];
  if ((m = /^(\d+), (\d+), (\d+), what comes next\?$/.exec(c.name))) return +m[3] + 10;
  if ((m = /^(\d+) and \? make (5|10)$/.exec(c.name))) return +m[2] - +m[1]; if ((m = /^(\d+) \+ \? = 10$/.exec(c.name))) return 10 - +m[1]; return NaN; };
ok("Number Sense: every back is right", ns.every(c => String(nsAns(c)) === c.def));
ok("every card in the unit is a legal Firebase key", u.decks.every(d => d.cards.every(c => !/[.$#\[\]\/]/.test(c.name))));
ok("every stage 1–8 has cards", u.stages.every(st => u.decks.some(d => d.cards.some(c => c.stage === st.n))));
const s6 = cards.filter(c => c.stage === 6), s7 = cards.filter(c => c.stage === 7), s8 = cards.filter(c => c.stage === 8);
ok("724 cards = 200 (+ −) + 313 (× ÷: 0s + 1s–12s) + 211 (stage 8)", cards.length === 724 && s6.length === 200 && s7.length === 313 && s8.length === 211);
ok("0s first: 0×0…0×12 then 1×0…12×0, all = 0, no ÷0", (() => { const f = cards.filter(c => c.family === "× ÷ · 0s"); return f.length === 25 && f[0].name === "0\u00d70" && f[13].name === "1\u00d70" && f.every(c => c.def === "0") && !cards.some(c => /\u00f70$/.test(c.name)) && s7[0].family === "× ÷ · 0s"; })());
const ANDREW = "0+0 0-0 0+1 1+0 1-0 1-1 0+2 1+1 2+0 2-0 2-1 2-2 0+3 1+2 2+1 3+0 3-0 3-1 3-2 3-3 0+4 1+3 2+2 3+1 4+0 4-0 4-1 4-2 4-3 4-4 0+5 1+4 2+3 3+2 4+1 5+0 5-0 5-1 5-2 5-3 5-4 5-5 0+6 1+5 2+4 3+3 4+2 5+1 6+0 6-0 6-1 6-2 6-3 6-4 6-5 6-6 0+7 1+6 2+5 3+4 4+3 5+2 6+1 7+0 7-0 7-1 7-2 7-3 7-4 7-5 7-6 7-7 0+8 1+7 2+6 3+5 4+4 5+3 6+2 7+1 8+0 8-0 8-1 8-2 8-3 8-4 8-5 8-6 8-7 8-8 1+8 8+1 9-8 9-1 2+7 7+2 9-7 9-2 3+6 6+3 9-6 9-3 4+5 5+4 9-5 9-4 0+9 9+0 9-0 9-9 1+9 2+8 3+7 4+6 5+5 6+4 7+3 8+2 9+1 10-1 10-2 10-3 10-4 10-5 10-6 10-7 10-8 10-9 2+9 3+8 4+7 5+6 6+5 7+4 8+3 9+2 11-2 11-3 11-4 11-5 11-6 11-7 11-8 11-9 3+9 4+8 5+7 6+6 7+5 8+4 9+3 12-3 12-4 12-5 12-6 12-7 12-8 12-9 4+9 5+8 6+7 7+6 8+5 9+4 13-4 13-5 13-6 13-7 13-8 13-9 5+9 6+8 7+7 8+6 9+5 14-5 14-6 14-7 14-8 14-9 6+9 7+8 8+7 9+6 15-6 15-7 15-8 15-9 7+9 8+8 9+7 16-7 16-8 16-9 8+9 9+8 17-8 17-9 9+9 18-9".split(" ");
ok("+ − stage == Andrew's live DeWalt bank, same 200 names", s6.length === ANDREW.length && JSON.stringify(s6.map(c => c.name).sort()) === JSON.stringify(ANDREW.slice().sort()));
ok("fact-family order (her rule 10/7): each family a+b, b+a, n−b, n−a, doubles a+a, n−a, zero family last", (() => {
  const fam = n => s6.filter(c => c.family === "+ − · " + n + " family").map(c => c.name).join(" ");
  return fam(9) === "1+8 8+1 9-8 9-1 2+7 7+2 9-7 9-2 3+6 6+3 9-6 9-3 4+5 5+4 9-5 9-4 0+9 9+0 9-0 9-9" &&
    fam(10) === "1+9 9+1 10-9 10-1 2+8 8+2 10-8 10-2 3+7 7+3 10-7 10-3 4+6 6+4 10-6 10-4 5+5 10-5" &&
    fam(18) === "9+9 18-9" && fam(2) === "1+1 2-1 0+2 2+0 2-0 2-2" && fam(0) === "0+0 0-0"; })());
ok("families still run 0 → 18 in order", (() => { const n = s6.map(c => +/(\d+) family/.exec(c.family)[1]); return n.every((x, i) => i === 0 || x >= n[i - 1]); })());
const evalCard = n => { const m = /^(\d+)([+\-×÷])(\d+)$/.exec(n); if (!m) return NaN; const x = +m[1], y = +m[3];
  return m[2] === "+" ? x + y : m[2] === "-" ? x - y : m[2] === "×" ? x * y : x / y; };
ok("every + − × ÷ card's answer is right", s6.concat(s7).every(c => String(evalCard(c.name)) === c.def));
ok("names unique", new Set(cards.map(c => c.name)).size === cards.length);
ok("names are legal Firebase keys (no . $ # [ ] /)", cards.every(c => !/[.$#\[\]\/]/.test(c.name)));
ok("order runs 1..724", cards.every((c, i) => c.order === i + 1));
ok("× ÷: 6s family = 6×1…6×12 then 6÷6…72÷6", (() => { const f = cards.filter(c => c.family === "× ÷ · 6s").map(c => c.name);
  return f.length === 24 && f[0] === "6×1" && f[11] === "6×12" && f[12] === "6÷6" && f[23] === "72÷6"; })());
ok("no shared card carries a lesson number (book link is per kid)", cards.every(c => c.ch == null));
ok("fresh object per call (a family's copy can't alias the template)", api.STARTER_UNITS.math_fluency_path() !== u);

// ── stage 8 ──
{ const fam = {}; s8.forEach(c => fam[c.family] = (fam[c.family] || 0) + 1);
  ok("stage 8: 12 families in research order", JSON.stringify(Object.keys(fam)) === JSON.stringify(["Halves & fourths", "Fifths & tenths", "Eighths", "Thirds & sixths", "Percent shortcuts", "Squares to 15²", "Cubes to 5³", "Powers of 10 & 2", "Prime or not?", "Customary units", "Metric", "Integer signs"]));
  const LINCOLN = ["⅓ as decimal", "⅔ as decimal", "¼ as decimal", "¾ as decimal", "⅕ as decimal", "⅛ as decimal", "⅜ as decimal", "⅝ as decimal", "⅞ as decimal", "2³", "3³", "5²", "10³", "2⁵", "4³", "−3 + 7", "−5 − 4", "−8 + 3", "6 × (−2)", "−12 ÷ 3", "−4 × −5"];
  ok("stage 8 keeps Lincoln's Howe card names exactly (21) — no duplicates for him", LINCOLN.every(n => s8.some(c => c.name === n)));
  const FR = { "½": .5, "¼": .25, "¾": .75, "⅕": .2, "⅖": .4, "⅗": .6, "⅘": .8, "⅒": .1, "³⁄₁₀": .3, "⁷⁄₁₀": .7, "⁹⁄₁₀": .9, "⅛": .125, "⅜": .375, "⅝": .625, "⅞": .875, "⅓": 1 / 3, "⅔": 2 / 3, "⅙": 1 / 6, "⅚": 5 / 6, "¹⁄₂₀": .05, "¹⁄₂₅": .04, "¹⁄₅₀": .02, "¹⁄₁₀₀": .01, "1¼": 1.25, "1½": 1.5, "2": 2 };
  const pct = p => parseFloat(p.replace("⅓", ".3333333").replace("⅔", ".6666667").replace(/\.(\d+)\.(\d+)/, ".$1$2")) / 100;
  const close = (x, y) => Math.abs(x - y) < 0.002;
  const fdp = s8.filter(c => / as (decimal|percent|fraction|a mixed number)$/.test(c.name));
  ok("fraction ↔ decimal ↔ percent backs all agree (" + fdp.length + " cards)", fdp.every(c => { const [, l, k] = / *(.+) as (decimal|percent|fraction|a mixed number)$/.exec(c.name);
    if (k === "decimal") return close(FR[l], parseFloat(c.def.replace("…", "")));
    if (k === "percent") return close(FR[l], pct(c.def));
    return close(/%$/.test(l) ? pct(l.replace("\u2024", ".")) : parseFloat(l.replace("\u2024", ".").replace("…", "")), FR[c.def]); }));
  ok("every equivalent all four ways (fraction→decimal, fraction→%, %→fraction, decimal→fraction)", ["½","¼","¾","⅕","⅖","⅗","⅘","⅒","³⁄₁₀","⁷⁄₁₀","⁹⁄₁₀","⅛","⅜","⅝","⅞","⅓","⅔","⅙","⅚"].every(f =>
    s8.some(c => c.name === f + " as decimal") && s8.some(c => c.name === f + " as percent") && s8.filter(c => c.def === f && / as fraction$/.test(c.name)).length === 2));
  ok("decimal fronts use the look-alike dot (U+2024), answers keep real periods", s8.some(c => c.name === "0\u2024375 as fraction" && c.def === "⅜") && s8.some(c => c.name === "62\u20245% as fraction") && s8.find(c => c.name === "⅜ as decimal").def === "0.375");
  const SUP = "⁰¹²³⁴⁵⁶⁷⁸⁹", unsup = s => s.replace(/⁻/g, "-").split("").map(ch => SUP.indexOf(ch) >= 0 ? SUP.indexOf(ch) : ch).join("");
  const num = s => parseFloat(String(s).replace(/,/g, ""));
  ok("squares / roots / cubes / powers all right", s8.filter(c => /Squares|Cubes|Powers/.test(c.family)).every(c => {
    let m; if ((m = /^√(\d+)$/.exec(c.name))) return num(c.def) ** 2 === +m[1]; if ((m = /^∛(\d+)$/.exec(c.name))) return num(c.def) ** 3 === +m[1];
    m = /^(\d+?)([⁻⁰¹²³⁴⁵⁶⁷⁸⁹]+)$/.exec(c.name); return m && close(Math.pow(+m[1], +unsup(m[2])), num(c.def)); }));
  const isP = n => n > 1 && [...Array(n).keys()].slice(2).every(d => n % d);
  ok("Prime or not?: Yes ⇔ prime; every No shows a true product (or 1)", s8.filter(c => c.family === "Prime or not?").every(c => { const n = +c.name.split(" ")[1];
    if (c.def === "Yes") return isP(n); if (n === 1) return /1 is not prime/.test(c.def); const m = /(\d+) × (\d+)/.exec(c.def); return !isP(n) && m && m[1] * m[2] === n; }));
  ok("integer signs all right", s8.filter(c => c.family === "Integer signs").every(c => eval(c.name.replace(/−/g, "-").replace(/×/g, "*").replace(/÷/g, "/").replace(/- -/g, "- (-").replace(/(\* )-(\d+)$/, "$1(-$2)").replace(/\(-\(-/g, "(-(-")) === num(c.def.replace("−", "-"))));
  ok("stage 8 = Fractions, decimals & beyond, in the Math Facts deck", u.stages[7] && u.stages[7].n === 8 && u.stages[7].deck === "Math Facts"); }

// ── 📚 list ──
ok("Mom sees the starter + Add button", /Starter units/.test(api._starterUnitsHtml()) && /starterUnitAdd\('math_fluency_path'\)/.test(api._starterUnitsHtml()));
ok("kids see nothing", load({ mom: false })._starterUnitsHtml() === "");
// (other starter units — e.g. the Letters Path, 10/4 — can still be listed; only THIS one's Add goes away)
ok("hidden once the family has it", !/starterUnitAdd\('math_fluency_path'\)/.test(load({ unitStudies: { math_fluency_path: { id: "math_fluency_path" } } })._starterUnitsHtml()));

// ── Add ──
{ const t = load({ dry: true, db: { ref() { throw new Error("db touched in dry run"); } } });
  t.starterUnitAdd("math_fluency_path");
  ok("dry run: added locally, no DB write", t.us.math_fluency_path && t.us.math_fluency_path.decks.find(d => d.key === "Math Facts").cards.length === 724 && t.G.rendered === 1); }
{ const calls = []; let result;
  const db = { ref(p) { return { transaction(fn) { calls.push(p); result = fn(null); return Promise.resolve({ committed: true }); } }; } };
  const t = load({ db }); t.starterUnitAdd("math_fluency_path");
  setTimeout(() => {
    ok("live: ONE create-only transaction at unitStudies/math_fluency_path", calls.length === 1 && calls[0] === "unitStudies/math_fluency_path" && result && result.id === "math_fluency_path");
    ok("live: transaction aborts if the node already exists", (() => { let r = "x"; const db2 = { ref() { return { transaction(fn) { r = fn({ id: "math_fluency_path" }); return Promise.resolve({ committed: false }); } }; } };
      load({ db: db2 }).starterUnitAdd("math_fluency_path"); return r === undefined; })());
    ok("live: local copy set after commit", t.us.math_fluency_path && t.G.rendered === 1);
    finish();
  }, 0); }
{ const calls = []; const t = load({ mom: false, db: { ref(p) { calls.push(p); return { transaction() { return Promise.resolve({}); } }; } } });
  t.starterUnitAdd("math_fluency_path"); ok("non-Mom: Add does nothing", calls.length === 0 && !t.us.math_fluency_path); }
{ const calls = []; const t = load({ unitStudies: { math_fluency_path: { id: "math_fluency_path", mine: 1 } }, db: { ref(p) { calls.push(p); return { transaction() { return Promise.resolve({}); } }; } } });
  t.starterUnitAdd("math_fluency_path"); ok("already added: no write, family copy untouched", calls.length === 0 && t.us.math_fluency_path.mine === 1); }

// ── enroll stays closed for staged units ──
ok("staged unit → enroll pending; ordinary unit → not", api._unitStagedEnrollPending(u) && !api._unitStagedEnrollPending({ id: "nc_snakes", decks: [] }));
ok("renderUnitDetail swaps the plain kid buttons for the staged rows on a staged unit", /_unitStagedEnrollPending\(u\)\) h\+=_unitStageRowsHtml\(u,roster\);\n\s*else roster\.forEach/.test(src));
ok("unitEnroll returns early for a staged unit", /function unitEnroll\(unitId,kid\)\{[\s\S]{0,200}if\(typeof _unitStagedEnrollPending==="function"&&_unitStagedEnrollPending\(u\)\) return;/.test(src));
ok("📚 list rendered at the bottom of the Units tab", /h\+=_starterUnitsHtml\(\);\n  h\+='<\/div>';\n  con\.innerHTML=h;/.test(src));

function finish() { console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0); }
