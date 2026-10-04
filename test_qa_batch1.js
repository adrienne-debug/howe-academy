/*
 * 🧹 QA_BATCH1 (Caleb walkthrough 2026-10-04): Trace it uses lowercase stroke words for a–z · the Howe-only Combined
 * Parent Guide button is hidden in other families · the Notebook tab's top line describes 🖨 Print, not Cmd/Ctrl+P.
 *   run:  node test_qa_batch1.js
 */
const fs = require("fs"), path = require("path");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
let pass = 0, fail = 0;
function ok(name, cond, extra) { if (cond) { pass++; console.log("  ok  - " + name); } else { fail++; console.log("  FAIL- " + name + (extra !== undefined ? "  (" + JSON.stringify(extra) + ")" : "")); } }
global.window = {};
eval(fs.readFileSync(path.join(__dirname, "notebooks.js"), "utf8"));
const NB = window.HoweNotebooks;

console.log("Trace it — lowercase stroke words");
ok("notebooks.js shares the lowercase scripts", NB.lowerStrokes && NB.lowerStrokes.a === "magic c · up to the top · back down" && Object.keys(NB.lowerStrokes).length === 26);
ok("capitals still shared as before", NB.letterStrokes && /big line slides down/.test(NB.letterStrokes.A));
// run the real setTip logic over a fake tip element
const t0 = src.indexOf("const setTip=()=>{"), t1 = src.indexOf("setTip();", t0);
const body = src.slice(t0, t1);
function tipFor(glyph) {
  const tip = { textContent: "" };
  new Function("window", "glyph", "tip", body + "\nsetTip();")(window, glyph, tip);
  return tip.textContent;
}
ok("lowercase a → the lowercase words", tipFor("a") === "🖍 a — magic c · up to the top · back down", tipFor("a"));
ok("lowercase d → its own words (not the capital D's)", /magic c · up high · back down/.test(tipFor("d")) && !/big line down · jump/.test(tipFor("d")));
ok("capital A → still the capital words", /^🖍 A — start at the top: big line slides down/.test(tipFor("A")), tipFor("A"));
ok("a number → no letter tip", tipFor("7") === "");

console.log("\nCombined Parent Guide — Howe only");
ok("the button is wrapped in HA_IS_HOWE", /\(HA_IS_HOWE\?'<button onclick="haNbCombinedParent\(\)"[^\n]*<\/button>':''\)\+/.test(src));

console.log("\nNotebook tab top line");
ok("describes 🖨 Print (PDF, any browser / iPad / iPhone)", /Pick a kid, then tap 🖨 Print — it makes a letter-size PDF that prints from any browser, iPad or iPhone\./.test(src));
ok("the old Cmd/Ctrl+P line is gone", !/Pick a kid, then generate\. Print from the new tab/.test(src));

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
