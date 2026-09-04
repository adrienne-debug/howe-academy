/*
 * Slices the REAL mastGetDef + MAST_MATH_ANS + MAST_VOCAB_DEFS out of index.html and
 * re-evaluates the flip gate from index.html:
 *     _learnFlip = isIntro && catMode==="quiz" && !!_vocabDef
 *     flips if (catMode==="flip" || _isRule || _learnFlip)
 * against Lincoln's ACTUAL card as it exists in the live DB today.
 *   run: node test_math_flip.js
 */
const fs = require("fs");
const src = fs.readFileSync("/Users/adriennehowe/Desktop/howe-academy/index.html", "utf8");

function constBlock(name) {
  const i = src.indexOf("const " + name + "={");
  let d = 0;
  for (let k = src.indexOf("{", i); k < src.length; k++) {
    if (src[k] === "{") d++;
    else if (src[k] === "}") {
      d--;
      // hoist onto globalThis — a `const` declared inside eval() stays in the eval's
      // own scope and would be invisible to the sliced mastGetDef
      if (d === 0) return "globalThis." + name + " = " + src.slice(src.indexOf("{", i), k + 1) + ";";
    }
  }
}
function fnBlock(name) {
  const i = src.indexOf("function " + name + "(");
  let d = 0;
  for (let k = src.indexOf("{", i); k < src.length; k++) {
    if (src[k] === "{") d++;
    else if (src[k] === "}") { d--; if (d === 0) return src.slice(i, k + 1); }
  }
}

const masteryData = { lincoln_settings: {}, ellis_settings: {}, lucy_settings: {} };
eval(constBlock("MAST_VOCAB_DEFS"));
eval(constBlock("MAST_MATH_ANS"));
eval(fnBlock("mastGetDef"));

let pass = 0, fail = 0;
const ok = (n, c, x) => c ? (pass++, console.log("  ok  - " + n))
                          : (fail++, console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x) : "")));

// Lincoln's real card, verbatim from mastery/lincoln in the live DB
const realCard = { id: "lin___as_decimal", prompt: "⅓ as decimal", subject: "Math Facts",
                   status: "introduction", tier: "daily", review_mode: "flash",
                   consecutive_correct: 0, tally_dots: 1, cycle: 1, drop_count: 0, type: "math facts" };

function flips(kid, it, catMode) {
  const isIntro = it.status === "introduction";
  const _vocabDef = mastGetDef(kid, it.prompt) || ((it.answer && it.answer !== it.prompt) ? it.answer : "");
  const _isRule = it.review_mode === "recite" && it.answer && it.answer !== it.prompt;
  const _learnFlip = isIntro && catMode === "quiz" && !!_vocabDef;
  return { flips: catMode === "flip" || !!_isRule || _learnFlip, back: _vocabDef };
}

console.log("Lincoln's real ⅓ card, Math Facts = quiz mode\n");
const r = flips("lincoln", realCard, "quiz");
ok("card now flips", r.flips === true, r);
ok("back shows 0.333…", r.back === "0.333…", r.back);

// The exact regression: with no answer source it did NOT flip
const before = flips("lincoln", { ...realCard, prompt: "NOT_IN_ANY_MAP" }, "quiz");
ok("a card with no answer still does not flip", before.flips === false, before);

console.log("\nevery bank word resolves");
// Math Facts prompts per kid, snapshot of the live mastery banks (test_fixtures/, regenerate when banks change)
const banks = JSON.parse(fs.readFileSync(__dirname + "/test_fixtures/mathbanks_2026-09-04.json", "utf8"));
for (const kid of Object.keys(banks)) {
  const missing = banks[kid].filter(w => !mastGetDef(kid, w));
  ok(kid + ": all " + banks[kid].length + " words have a back", missing.length === 0, missing);
}

console.log("\nspot answers");
[["lincoln", "⅔ as decimal", "0.666…"], ["lincoln", "−5 − 4", "−9"], ["lincoln", "12 ÷ 4 + 3²", "12"],
 ["lincoln", "33% of 90", "29.7"], ["ellis", "12×12", "144"], ["ellis", "108÷9", "12"],
 ["lucy", "10-5", "5"], ["lucy", "5+5", "10"]].forEach(([k, q, a]) =>
  ok(q + " = " + a, mastGetDef(k, q) === a, mastGetDef(k, q)));

console.log("\nvocab lookups still work (no regression)");
ok("advocate still resolves", /publicly support/.test(mastGetDef("lincoln", "advocate")), mastGetDef("lincoln", "advocate"));
ok("noun still resolves", /person, place/.test(mastGetDef("lincoln", "noun")));
ok("per-kid override still wins", (() => {
  masteryData.lincoln_settings = { definitions: { "6×7": "MOM OVERRIDE" } };
  const v = mastGetDef("lincoln", "6×7");
  masteryData.lincoln_settings = {};
  return v === "MOM OVERRIDE";
})());

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
