/*
 * 🔀 LA rule sprints: sheet B never tests the same rule at the same item number as sheet A
 * (her report 2026-09-23: "the first sprint and the second sprint basically have the same exact rule
 * ... even though the sentences are changing ... make sure the A and the B are set different").
 *   run:  node test_la_ab_order.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const a = src.indexOf("// LASTAGGER_START"), b = src.indexOf("// LASTAGGER_END");
if (a < 0 || b < 0) { console.error("LASTAGGER markers not found"); process.exit(1); }
const ctx = { Array, String, Math, Object }; vm.createContext(ctx); vm.runInContext(src.slice(a, b), ctx);
const stagger = (A, B) => { ctx.A = A; ctx.B = B; return vm.runInContext("laStaggerB(A,B)", ctx); };
let pass = 0, fail = 0;
function ok(n, c, x) { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x) + ")" : "")); } }
const sheet = (rules, tagPrefix) => rules.map((r, i) => ({ text: tagPrefix + i, answer: "fix " + i, rule: r, ok: false }));
const collisions = (A, B) => B.map((it, i) => i).filter(i => A[i] && A[i].rule.toLowerCase() === B[i].rule.toLowerCase()).length;
const sameSet = (X, Y) => JSON.stringify(X.map(i => i.text).sort()) === JSON.stringify(Y.map(i => i.text).sort());

console.log("── the live case: the AI walked the rule list top to bottom on both sheets ──");
{
  const rules = ["Days of the week", "Proper nouns", "First word of a sentence", "Titles", "Days of the week", "Proper nouns", "First word of a sentence", "Titles", "Holidays"];
  const A = sheet(rules, "a"), B = sheet(rules, "b");
  ok("before: every item number tests the same rule on A and B", collisions(A, B) === 9);
  const out = stagger(A, B);
  ok("after: NO item number tests the same rule on both sheets", collisions(A, out) === 0, out.map(i => i.rule));
  ok("every B item is still there, just reordered", sameSet(B, out) && out.length === 9);
  ok("A is untouched", A.map(i => i.text).join() === "a0,a1,a2,a3,a4,a5,a6,a7,a8");
}
{
  const rules = ["Days", "Names", "Days", "Names", "Days", "Names"];
  const out = stagger(sheet(rules, "a"), sheet(rules, "b"));
  ok("two rules alternating (worst case for a plain rotation) → still no collisions", collisions(sheet(rules, "a"), out) === 0, out.map(i => i.rule));
}
{
  const A = sheet(["Days", "Days", "Days"], "a"), B = sheet(["Days", "Days", "Days"], "b");
  const out = stagger(A, B);
  ok("only one rule on the sheet → nothing can differ, items all kept", out.length === 3 && sameSet(B, out));
}
{
  const A = sheet(["Days", "Names"], "a"), B = [{ text: "b0", rule: "Days", review: true }, { text: "b1", rule: "Names" }];
  const out = stagger(A, B);
  ok("review flags ride along with their items", out.every(i => (i.text === "b0") === !!i.review));
}
{
  const B = sheet(["x"], "b");
  ok("a one-item sheet is returned as-is", stagger(sheet(["x"], "a"), B) === B);
  ok("bad input is returned as-is", stagger(null, B) === B && stagger([], "nope") === "nope");
}
{
  const A = sheet(["days", "NAMES", "Titles"], "a"), B = sheet(["Days", "names", "titles"], "b");
  ok("rule tags compare case-insensitively", collisions(A, stagger(A, B)) === 0);
}
console.log("\n── the wiring ──");
ok("the AI is told to order B's rules differently", /Sheet B must also test the focus rules in a DIFFERENT ORDER from Sheet A/.test(src));
ok("the AI result is staggered before it renders", /laRenderSheets\(pA,laStaggerB\(pA,pB\)\);/.test(src));
ok("the built-in backup set is staggered too", /laRenderSheets\(fA,laStaggerB\(fA,fB\)\);/.test(src));

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
