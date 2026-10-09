/*
 * Node tests — her picks 2026-10-08 for 📅 Move to today (b): (1) a missed lesson marked done after school gets NO
 * got-ahead bonus; (2) the old orange "Mark Done (Future Day)" button hides when "✓ Mark done today" shows.
 *   run:  node test_mvt_picks.js
 */
const fs = require("fs"), path = require("path");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
function slice(name) { const i = src.indexOf("function " + name + "("); let d = 0; for (let k = src.indexOf("{", i); k < src.length; k++) { if (src[k] === "{") d++; else if (src[k] === "}" && --d === 0) return src.slice(i, k + 1); } }
let pass = 0, fail = 0;
const ok = (n, c) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n); } };
const md = slice("momMarkDoneToday");
ok("mark-done-today marks the card as a catch-up before the check-off runs", md.indexOf("_mvtNoBonus[id]=true") > 0 && md.indexOf("_mvtNoBonus[id]=true") < md.indexOf("ok.onclick()"));
ok("the GOT AHEAD heal skips the bonus for a catch-up", /if\(_ga&&!\(typeof _mvtNoBonus!=="undefined"&&_mvtNoBonus\[id\]\)\)\{ t\.gotAhead=t\.day;/.test(src));
ok("ordinary early check-offs still earn the bonus (flag only set by mark-done-today)", (src.match(/_mvtNoBonus\[id\]=true/g) || []).length === 1);
ok("after school, the old orange button hides when the new one shows", /mtBtn\.onclick=\(\)=>momMarkDoneToday\(id\);\s*const _okB=document\.getElementById\("dlg-ok"\); if\(_okB\) _okB\.style\.display="none";/.test(src));
ok("during school the old button is untouched (only the 'done' mode hides it)", /else \{ mtBtn\.innerHTML="&#128197; Move to today";/.test(src));
console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
