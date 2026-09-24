/*
 * 🌅 Mom's Plan "Kids today" counts only the morning steps due that day (her report 2026-09-23:
 * "it says Ellis needs to do things that aren't on his individual list — give crickets and stuff").
 * The card counted EVERY morning step (Tue/Fri cricket jobs, the as-needed paper towel) → Ellis
 * showed 7 of 10 on a Wednesday he'd finished. His own list uses morningDueIdx; now so does the card.
 *   run:  node test_kids_today_morning.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
let pass = 0, fail = 0;
function ok(n, c, x) { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x) + ")" : "")); } }
const grab = (start, end) => { const i = src.indexOf(start); if (i < 0) throw new Error("missing " + start); return src.slice(i, src.indexOf(end, i) + end.length); };
const CODE = [
  grab("function morningDueIdx(kid,d){", "\n}"),
  grab("const _CAD_DOW=", ";"),
  grab("function cadDowIdx(dn){", "}"),
  grab("function cadDueOn(cad,dn){", "\n}"),
].join("\n");
// Ellis's live morning list (config/routines/morning/ellis, 9/23)
const ELLIS = [["daily", "Brush Teeth"], ["daily", "Take vitamins"], ["daily", "Feed sunny greens"], ["daily", "dispose of old greens for Sunny"],
  ["daily", "Water sunny"], ["daily", "Change underwear & socks"], ["daily", "Put clothes on"], ["wk:1,4", "Feed Sunny Crickets"],
  ["wk:4", "Feed Greg Crickets"], ["asneeded", "Change Gregs paper towel and clean up any poop"]].map(([cad, label]) => ({ cad, label }));
// Wednesday: he checked mstep0–6 (live week24/sl)
const doneWed = new Set([0, 1, 2, 3, 4, 5, 6]);
const ctx = { morningStepsFor: () => ELLIS, stepWindowOk: () => true, day: "wednesday", DAY_DT: {}, cadDateNum: () => null };
vm.createContext(ctx); vm.runInContext(CODE, ctx);
const due = d => vm.runInContext("morningDueIdx('ellis','" + d + "')", ctx);

console.log("── Ellis's Wednesday (the live case) ──");
const wed = due("wednesday");
ok("7 steps due on Wednesday — no cricket jobs, no as-needed", JSON.stringify(wed) === "[0,1,2,3,4,5,6]", wed);
ok("the card now reads 7 of 7 (was 7 of 10)", wed.filter(i => doneWed.has(i)).length === 7 && wed.length === 7);
console.log("\n── the cricket days still count them ──");
ok("Tuesday: Sunny's crickets are due (8 steps)", JSON.stringify(due("tuesday")) === "[0,1,2,3,4,5,6,7]", due("tuesday"));
ok("Friday: both cricket jobs are due (9 steps)", JSON.stringify(due("friday")) === "[0,1,2,3,4,5,6,7,8]", due("friday"));
ok("the as-needed step is never counted as due", [ "monday", "tuesday", "wednesday", "thursday", "friday" ].every(d => due(d).indexOf(9) < 0));

console.log("\n── the wiring ──");
ok("Kids today counts that day's due steps", /const _mDue=morningDueIdx\(kid,_kd\); mT=_mDue\.length;\s*_mDue\.forEach\(i=>\{ if\(mStepDoneOn\(kid,_kd,i\)\) mD\+\+; \}\);/.test(src));
ok("its pop-up lists only due steps, plus an as-needed one that was done", /if\(!_due&&!\(st\.cad==="asneeded"&&_dn\)\) return;/.test(src) && /\(_due\?"":" \(as needed\)"\)/.test(src));

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
