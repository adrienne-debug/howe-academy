// 🗂 Units tab: a deck with groupBy renders one titled section per group (card order, "Other" last);
// a photo-less card shows the unit's own emoji instead of the old hardcoded 👑. Extracts the REAL
// renderUnitDetail by brace-matching and renders it over stubbed units.
// UNITS_SRC=<path> runs it against another copy of index.html (used for the dry run).
const fs = require("fs"), path = require("path");
const src = fs.readFileSync(process.env.UNITS_SRC || path.join(__dirname, "index.html"), "utf8");
let pass = 0, fail = 0;
function ok(name, cond) { if (cond) { pass++; console.log("  ok  - " + name); } else { fail++; console.log("  FAIL- " + name); } }
function extract(startPat) {
  const i = src.indexOf("\n" + startPat); if (i < 0) throw new Error("not found: " + startPat);
  let depth = 0, inS = null, seen = false, k = i + 1;
  for (; k < src.length; k++) { const c = src[k], p = src[k - 1];
    if (inS) { if (c === inS && p !== "\\") inS = null; continue; }
    if (c === '"' || c === "'" || c === "`") { inS = c; continue; }
    if (c === "/" && src[k + 1] === "/") { k = src.indexOf("\n", k) - 1; continue; }
    if (c === "/" && /[=(,:!&|?{};]\s*$/.test(src.slice(Math.max(0, k - 3), k))) {
      let q = k + 1, cls = false; for (; q < src.length; q++) { const d = src[q];
        if (d === "\\") { q++; continue; } if (d === "[") cls = true; else if (d === "]") cls = false; else if (d === "/" && !cls) break; }
      k = q; continue; }
    if (c === "{" || c === "[" || c === "(") { depth++; seen = true; } else if (c === "}" || c === "]" || c === ")") depth--;
    else if (c === "\n" && depth === 0 && seen) break; }
  return src.slice(i + 1, k + 1);
}
const code = extract("function renderUnitDetail(");
function render(u, mom) {
  const stubs = `const ROSTER=["lincoln","ellis","lucy","julian"]; function momHere(){ return ${!!mom}; }
    function cap(s){ return s; } function unitCardStatus(){ return {lbl:"",c:"#ccc"}; }
    function unitPlanNudges(){ return []; } function unitSprintRounds(){ return []; } const masteryData={};`;
  // Any helper this screen calls that the test doesn't care about (mom lock, plan rows, sprint chips…)
  // resolves to a no-op returning "" — real JS globals (Object, JSON, String…) pass straight through.
  const shim = new Proxy({}, { has: (t, k) => typeof k === "string" && !(k in globalThis), get: (t, k) => (k === Symbol.unscopables ? undefined : () => "") });
  return new Function("SHIM", "with(SHIM){\n" + stubs + "\n" + code + "\nreturn renderUnitDetail;\n}")(shim)(u);
}
const text = h => h.replace(/<[^>]+>/g, "|");
const heads = h => [...h.matchAll(/color:#2d6a4f;margin:12px 0 6px[^>]*>([^<]*) <span[^>]*>· (\d+)</g)].map(m => [m[1], +m[2]]);
const balanced = h => (h.match(/<div\b/g) || []).length === (h.match(/<\/div>/g) || []).length;

const rs4k = { id: "rs4k_book6", title: "Real Science-4-Kids — Book 6", emoji: "🔬", enrolled: {},
  decks: [{ key: "Real Science-4-Kids", mode: "flip", groupBy: "chapter", cards: [
      { name: "technology", chapter: "Ch 1 · Technology in Science", order: 1 },
      { name: "engineering", chapter: "Ch 1 · Technology in Science", order: 2 },
      { name: "beaker", chapter: "Ch 2 · Technology in Chemistry", order: 4 },
      { name: "alembic", chapter: "Ch 2 · Technology in Chemistry", order: 3 },
      { name: "acid", chapter: "Ch 3 · Acids, Bases, and pH", order: 5 }] },
    { key: "Chemistry Instruments", mode: "flip", flipFace: "name", groupBy: "chapter", cards: [
      { name: "beaker", chapter: "Ch 2 · Technology in Chemistry", order: 1 },
      { name: "pH meter", chapter: "Ch 3 · Acids, Bases, and pH", order: 2 }] }],
  visuals: { "Chemistry Instruments_beaker": { imageUrl: "https://example/beaker.jpg" } } };
const bm = { id: "british_monarchy", title: "British Monarchy", emoji: "🏰", enrolled: {},
  decks: [{ key: "British Monarchs", mode: "flip", groupBy: "house", cards: [
    { name: "Mystery King", order: 1 }, { name: "William I", house: "Normans", order: 2 }, { name: "Henry VIII", house: "Tudors", order: 3 }] }],
  visuals: {} };
const la = { id: "language_arts", title: "Language Arts", emoji: "✏️", enrolled: {},
  decks: [{ key: "Capitalization", mode: "flip", cards: [{ name: "a", order: 1 }, { name: "b", order: 2 }] }], visuals: {} };

for (const mom of [true, false]) {
  console.log("# " + (mom ? "Mom view" : "kid view"));
  const h = render(rs4k, mom);
  ok("chapter sections in BOOK order with counts (vocab deck)",
    JSON.stringify(heads(h).slice(0, 3)) === JSON.stringify([["Ch 1 · Technology in Science", 2], ["Ch 2 · Technology in Chemistry", 2], ["Ch 3 · Acids, Bases, and pH", 1]]));
  ok("picture deck gets its own chapter sections", JSON.stringify(heads(h).slice(3)) === JSON.stringify([["Ch 2 · Technology in Chemistry", 1], ["Ch 3 · Acids, Bases, and pH", 1]]));
  const t = text(h);
  ok("within a chapter, cards follow card order (alembic before beaker)", t.indexOf("|alembic|") < t.indexOf("|beaker|"));
  ok("every card rendered exactly once per deck", ["technology", "engineering", "alembic", "acid", "pH meter"].every(n => t.split("|" + n + "|").length - 1 === 1) && t.split("|beaker|").length - 1 === 2);
  ok("photo-less cards show the unit emoji 🔬, not 👑", h.includes("font-size:22px\">🔬</div>") && !h.includes("👑"));
  ok("a card WITH a photo still shows the photo", h.includes('src="https://example/beaker.jpg"'));
  ok("HTML stays balanced", balanced(h));
}
console.log("# other units");
{ const h = render(bm, true);
  ok("British Monarchy sections by house, 'Other' LAST", JSON.stringify(heads(h)) === JSON.stringify([["Normans", 1], ["Tudors", 1], ["Other", 1]]));
  ok("BM photo-less card shows its unit emoji", h.includes("font-size:22px\">🏰</div>")); ok("balanced", balanced(h)); }
{ const h = render(la, true);
  ok("a deck with NO groupBy gets no section headings", heads(h).length === 0);
  ok("Language Arts placeholder is ✏️ now", h.includes("font-size:22px\">✏️</div>") && !h.includes("👑"));
  ok("balanced", balanced(h)); }
{ const noEmoji = Object.assign({}, la, { emoji: undefined });
  ok("a unit with no emoji falls back to 👑", render(noEmoji, true).includes("font-size:22px\">👑</div>")); }
{ const h = render(Object.assign({}, rs4k, { emoji: '<b>"x' }), true);
  ok("card placeholder escapes the unit emoji", h.includes('font-size:22px">&lt;b>&quot;x</div>') && !h.includes('font-size:22px"><b>"x')); }

console.log("# card editor");
{ const ed = extract("function _unitEditOverlay(");
  ok("editor placeholder uses the unit emoji", /font-size:48px">'\+esc\(u\.emoji\|\|"👑"\)\+'<\/div>'/.test(ed) && !/font-size:48px">👑<\/div>/.test(ed)); }
console.log("# Monarchy-only screens keep their crown");
ok("the royal-line page still uses 👑 (it is British Monarchy by design)", src.includes("rl-face rl-face-empty\">\\u{1F451}</div>"));

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
