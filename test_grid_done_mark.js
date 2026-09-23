/*
 * ✓ A finished lesson in the Grid reads as finished (her ask 2026-09-22): a green check before the text
 * and a strike-through, not just a greyed cell.
 *   run:  node test_grid_done_mark.js
 */
const fs = require("fs"), path = require("path");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
let pass = 0, fail = 0;
function ok(n, c) { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n); } }
ok("done cell text is struck through in green", /\.gv \.gv-done\{color:#15803d;text-decoration:line-through;text-decoration-color:#15803d\}/.test(src));
ok("a bold green check sits before the text", /\.gv \.gv-chk\{color:#15803d;font-weight:800;margin-right:3px\}/.test(src) && /<span class="gv-chk">&#10003;<\/span><span class="gv-done" title="/.test(src));
ok("only done lessons carry the check — the done branch and the done-on-this-day line (moved / co-op-blocked cells keep their own marks)", (src.match(/<span class="gv-chk">/g) || []).length === 2);
// 📅 done where it was done (her ask 2026-09-22)
ok("done records (lesson id + day) are matched to the finished cells", /const _gvDoneAway=\{\}, _gvDoneOn=\{\};/.test(src) && /if\(r\.day!==l\.date\)\{ _gvDoneAway\[dn\+"\|"\+sk\]=_DOWS\[/.test(src));
ok("a lesson finished on another day reads '↪ done <day>' on its planned cell", /\(_isDone&&_gvDoneAway\[dn\+"\|"\+sk\]\)\?'<s style="color:var\(--muted\)">'\+esc\(v\)\+'<\/s> <span class="gv-away"/.test(src));
ok("the day it was done shows it with a check", /const _on=\(_lc\?_lc\.members:\[sk\]\)\.reduce/.test(src) && /title="Done on this day/.test(src));
ok("future done records never draw (today and earlier only)", /if\(r\.used\|\|r\.day>_gvToday\) return;/.test(src));
console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
