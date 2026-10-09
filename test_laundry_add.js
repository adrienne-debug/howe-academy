/*
 * Node tests — 🧺 LAUNDRYADD (her ask 2026-10-08): on 🏡 Home Base the "Start a load" box sits right under the to-do
 * "Add to your list…" box; the 🧺 Laundry card below keeps the running loads (and hides when nothing runs). Dad's Day unchanged.
 *   run:  node test_laundry_add.js
 */
const fs = require("fs"), path = require("path");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
function slice(name) { const i = src.indexOf("function " + name + "("); let d = 0; for (let k = src.indexOf("{", i); k < src.length; k++) { if (src[k] === "{") d++; else if (src[k] === "}" && --d === 0) return src.slice(i, k + 1); } }
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x) : "")); } };
function card(loads, noAdd) {
  return new Function("laundryData", "LAUNDRY_STAGE_META", "LAUNDRY_STAGES", "esc", "laundrySince", "laundryDoneTxt", "laundryTimesEditorHTML", "laundryTimesOpen", "momTipLaundryHTML", "laundryAdvanceLabel", "laundryEditToggle",
    slice("mdCardLaundry").replace("}catch(e){}", "}catch(e){ throw e; }") + "\nreturn mdCardLaundry(" + (noAdd ? "true" : "") + ");")(
    loads, ...new Function(src.slice(src.indexOf("const LAUNDRY_STAGES"), src.indexOf("\n", src.indexOf("const LAUNDRY_STAGE_META"))) + "\nreturn [LAUNDRY_STAGE_META, LAUNDRY_STAGES];")(), s => String(s), () => "11:05", () => "", () => "", false, () => "", () => "Moved it", () => "");
}
const one = { l1: { label: "Towels", stage: "washer", ts: 1 } };
ok("Dad's Day card unchanged: start box still there", /id="laundry-label"/.test(card({})) && /id="laundry-label"/.test(card(one)));
ok("Mom's Day card: no start box of its own", !/id="laundry-label"/.test(card(one, true)) && /Towels/.test(card(one, true)));
ok("Mom's Day card hides when nothing is running", card({}, true) === "");
const strip = slice("momDayStripHTML");
const iTodo = strip.indexOf('id="md-todo-new"'), iLaun = strip.indexOf('id="laundry-label"'), iShop = strip.indexOf("colHd('🛒','Shopping'");
ok("Home Base: Start a load sits right under the to-do box, before Shopping", iTodo > 0 && iLaun > iTodo && iShop > iLaun);
ok("…same start action (laundryAdd)", /onclick="laundryAdd\(\)"/.test(strip.slice(iLaun - 400, iLaun + 900)));
ok("Mom's Day draws the card in running-loads mode", /h\+=mdCardLaundry\(true\);/.test(slice("renderMomsDay")));
ok("Dad's Day still draws the full card", /h\+=mdCardLaundry\(\);/.test(slice("renderDadsDay")));
console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
