/*
 * 🚪 HOUSE step 0 — clear out chore code that was already unreachable (DESIGN_household_rooms_2026-11-15 §8 A, §9 row 0).
 * Her yes 2026-11-15 to step 0 only: nothing on any screen changes, nothing is written. Each name below had no caller
 * anywhere in the repo (index.html, the other .js / .html files, every test) other than its own definition; the two
 * branches could not run from any call site. This pins that they stay gone, and that the live neighbours stay.
 *   run:  node test_house_step0_dead.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x) + ")" : "")); } };
const fn = name => { const i = src.indexOf("function " + name + "("); if (i < 0) return ""; let d = 0; for (let k = src.indexOf("{", i); k < src.length; k++) { if (src[k] === "{") d++; else if (src[k] === "}" && --d === 0) return src.slice(i, k + 1); } return ""; };
const word = name => new RegExp("(^|[^A-Za-z0-9_$])" + name.replace(/\$/g, "\\$") + "(?![A-Za-z0-9_$])");

console.log("── removed: no trace of the name anywhere in index.html ──");
[
  "_cpRoutineRulesHTML",                       // Chores & Stars: the old Routine rules box (its pieces live on the Rooms / Points / Log tabs)
  "cpGoMornings",                              // jump to the Morning lists — no button calls it
  "rtCfgAdd", "rtCfgRemove",                   // config/routines editor add / remove — the lists use cpAddChore / cpDelChore
  "kcSubnav", "kcBankHTML",                    // Kids' Corner subnav + Bank tab, unwired since 2026-09-05
  "walletCashed", "prAllPendingCount",
  "HH_LAYERS",
  "hhLaundrySel", "hhLaundryCellPick", "hhLaundryDows",   // the laundry chore grid, erased 2026-10-18
].forEach(n => ok(n + " is gone", !word(n).test(src)));

console.log("\n── removed: branches no call site could reach ──");
const proj = fn("hhProjectsHTML");
ok("hhProjectsHTML still lists only projects (the reason its once-job arms could never run)", /const ids=Object\.keys\(jobs\)\.filter\(function\(id\)\{ return hhIsProject\(jobs\[id\]\); \}\);/.test(proj));
ok("…and the once-job arms are gone", !/\bproj\b/.test(proj) && !/Due until it is checked once/.test(src) && !/'☑️ '/.test(proj));
ok("…the project title, status line and editor are still drawn", /'🧰 '\+esc\(j\.emoji/.test(proj) && /'\+esc\(S\.txt\)\+/.test(proj) && /hhProjSet\(/.test(proj) && /hhProjLogFromForm\(/.test(proj));
ok("…the empty-state line stays (reachable: no projects at all)", /No projects or once-jobs yet\./.test(proj));
const mcc = fn("momChoresCardHTML");
ok("momChoresCardHTML's only caller is mcPopHTML", (src.match(/momChoresCardHTML\(/g) || []).length === 2 && /momChoresCardHTML\(iso,today\)/.test(fn("mcPopHTML")));
ok("…and mcPopHTML is only drawn while managing (the reason the non-edit branch could never run)", (src.match(/mcPopHTML\(/g) || []).length === 2 && /if\(mcManage\)\{ try\{ h\+=mcPopHTML\(iso,today\); \}catch\(e\)\{\} \}/.test(src));
ok("…the non-edit branch is gone", !/\} else \{/.test(mcc) && !/Nothing of yours due today/.test(mcc) && /Nothing of yours due today\. 🎉/.test(fn("momDayStripHTML")) &&!/more on other days · ✎ Edit to see the week/.test(src));
ok("…the manage list and the add row are still drawn", /if\(mcManage\)\{/.test(mcc) && /mcDel\(/.test(mcc) && /mcSetSlot\(/.test(mcc) && /onclick="mcAdd\(\)"/.test(mcc));
const lh = fn("hhLaundryHTML");
ok("hhLaundryHTML lost only its unused locals", !/const jobs=hhJobs\(\), ids=hhLaundryRows\(\)/.test(lh) && /mdCardLaundry\(true,false,true\)/.test(lh) && /llCardHTML\(true\)/.test(lh) && /qlCardHTML\(\)/.test(lh));

console.log("\n── live neighbours are still here ──");
["_boardClaimsHTML", "boardStatPop", "choreUndo", "cuUnpay", "hhLaundryHTML", "hhProjectsHTML", "momChoresCardHTML", "renderHousehold", "renderChorePlan"]
  .forEach(n => ok(n + " is defined", src.indexOf("function " + n + "(") >= 0));
ok("_boardClaimsHTML is still called (Mom's Day 🔴 Now)", (src.match(/_boardClaimsHTML\(/g) || []).length >= 2);
ok("boardStatPop is still called (Kids today pop-ups)", (src.match(/boardStatPop\(/g) || []).length >= 2);

console.log("\n── comments brought up to date ──");
ok("grabs pay through bankDirect, and the comment says so", /bankDirect\(kid, _paid/.test(fn("_gbEarn")) && /straight to the Star Bank \(bankDirect, no day-claim gate\)/.test(src) && !/SAME pipeline as routine chores: addKidPoints/.test(src));
ok("a step moved to Morning keeps its stars, and the comment says so", !/a step moved there loses its stars/.test(src) && /moved there keeps its stars and schedule/.test(src));
ok("hhView's comment lists every view the chip row has", /let hhView="review";\s+\/\/ "review" \| "habits" \| "week" \| "area" \| "room" \| "levels" \| "rot" \| "laundry" \| "kitchen" \| "once" \| "proj" \| "today"/.test(src));

console.log("\n── the app's main script still compiles ──");
{
  const re = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g; let m, big = "";
  while ((m = re.exec(src))) if (m[1].length > big.length) big = m[1];
  let err = null; try { new vm.Script(big, { filename: "index.html#main" }); } catch (e) { err = String(e); }
  ok("the largest inline <script> (" + big.length + " chars) parses", big.length > 1000000 && !err, err);
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
