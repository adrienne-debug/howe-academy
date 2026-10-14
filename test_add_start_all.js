/*
 * Node tests — ➕ Add Items "Start In" for every kid (ADD_START_ALL, her rule 2026-10-13: "I don't want those to go to
 * learning, even on Howe, but an option for them to pick is fine — I want mine to go to the ladder").
 * Before: the Learn First / Straight to Ladder pills only drew for the four Howe bank kids (isJ), and a non-Howe kid's
 * added cards silently started ACTIVE on the Daily tier. Now the pills show for everyone and default to Straight to Ladder.
 *   run:  node test_add_start_all.js
 */
const fs = require("fs"), path = require("path");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x) : "")); } };
const line = re => src.split("\n").find(l => re.test(l)) || "";

ok("default start mode is Straight to Ladder", /^let mastAddStartMode="ladder";/.test(line(/^let mastAddStartMode=/)));
ok("Learn First parks/introduces for ANY kid (no isJ gate)", /const _learnPark = mastAddStartMode==="learn";/.test(src) && !/const _learnPark = isJ && /.test(src));
ok("a ladder add lands on the kid's first rung for ANY kid, not the Daily tier", /tier:mastAddStartMode==="ladder"\?\(mastDrillSettings\(\)\.ladder\[0\]\|\|"every_other_day"\):"daily",/.test(src) && !/tier:isJ&&mastAddStartMode==="ladder"/.test(src));
ok("the Start In pills are drawn for every kid", /\{   \/\/ ADD_START_ALL: Start In pills for every kid/.test(src) && !/if\(isJ\)\{\s*\n\s*const _jset=mastDrillSettings\(\);\s*\n\s*const _addCat=mastAddCustomSubject\|\|mastAddCat;/.test(src));
ok("both pills still present", /Learn First \('\+_addDots\+' days\)/.test(src) && /Straight to Ladder<\/button>/.test(src));
ok("the preview sentence follows the mode for every kid (no 'daily tier with cycle #1' branch left)", !/at <strong>daily<\/strong> tier with cycle #1/.test(src) && /New items enter '\+\(mastAddStartMode==="learn"\?/.test(src));
ok("the non-Howe subject still feeds the intro-dots count", /mastIntroDotsFor\(isJ\?\(mastAddCustomSubject\|\|mastAddCat\):\(mastAddCustomSubject\|\|mastAddSubject\)\)/.test(src));

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
