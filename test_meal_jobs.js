// 🍽 After-meal jobs (2026-10-02, DeWalt table-jobs chart): a step tagged with a meal shows under its
// meal's heading in Morning / Afternoon / Evening; Lunch and Supper open at their own hour; breakfast
// jobs count toward the Morning unlock unless Mom switches that off.
const fs = require("fs"), path = require("path");
const s = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
let pass = 0, fail = 0;
function ok(msg, cond){ if(cond){ pass++; } else { fail++; console.log("FAIL:", msg); } }
const block = s.slice(s.indexOf("// MEALS_START"), s.indexOf("// MEALS_END"));
ok("MEALS block present", block.length > 200);

let routineTimes = {}, _todayDay = "monday", HOUR = 9, LIST_OPEN = { afternoon: false, evening: false };
const RealDate = Date;
global.Date = class extends RealDate { getHours(){ return HOUR; } };
function rtAvailable(slot){ return slot === "morning" || slot === "chores" || LIST_OPEN[slot]; }
function rtFmtHour(h){ const ap = h >= 12 ? "PM" : "AM"; let hh = h % 12; if(hh === 0) hh = 12; return hh + ":00 " + ap; }
function esc(x){ return String(x); }
function momHere(){ return true; }
eval(block.replace(/^const /gm, "var "));

const lunchJob = { label: "Set table", meal: "lunch" }, supperJob = { label: "Dishwasher", meal: "supper" }, plain = { label: "Shower" };
ok("defaults", mealCfg().lunchHour === 12 && mealCfg().supperHour === 17 && mealCfg().supper === "Supper" && mealCfg().breakfastGate === true);
ok("meal only counts in its own list", mealOf("afternoon", lunchJob) === "lunch" && mealOf("evening", lunchJob) === "" && mealOf("afternoon", plain) === "");
HOUR = 11;
ok("11 AM: lunch job locked even if afternoon were open", (LIST_OPEN.afternoon = true, rtStepAvail("afternoon", "caleb", "monday", lunchJob)) === false);
LIST_OPEN.afternoon = false;
HOUR = 12;
ok("12 PM: lunch job opens while the afternoon list is still locked", rtStepAvail("afternoon", "caleb", "monday", lunchJob) === true);
ok("12 PM: the rest of afternoon still follows its own rule", rtStepAvail("afternoon", "caleb", "monday", plain) === false);
HOUR = 16;
ok("4 PM: supper job still locked", rtStepAvail("evening", "caleb", "monday", supperJob) === false);
HOUR = 17;
ok("5 PM: supper job opens before the evening list", rtStepAvail("evening", "caleb", "monday", supperJob) === true && rtStepAvail("evening", "caleb", "monday", plain) === false);
HOUR = 8;
ok("another day is never locked", rtStepAvail("evening", "caleb", "tuesday", supperJob) === true);
routineTimes = { meals: { supper: "Dinner", supperHour: 18, breakfastGate: false } };
ok("Mom renames and retimes", mealCfg().supper === "Dinner" && mealHour("supper") === 18 && mealCfg().breakfastGate === false);
ok("heading uses her name", /After Dinner/.test(mealHeadHTML("supper", "monday")));

// wiring in the app
ok("toggleRtStep gates per step", /rtStepAvail\(slot,kid,day,rtStepsFor\(slot,kid\)\[i\]\):rtAvailable\(slot,kid,day\)\)\)\{/.test(s));
ok("morning unlock honours breakfastGate", /idx=morningDueIdx\(kid,d\)\.filter\(i=>_bg\|\|!mealOf\("morning",steps\[i\]\)\)/.test(s));
ok("locked list still renders when a meal group is open", /if\(!avail&&!dueIdx\.concat\(optIdx\)\.some\(i=>mealOf\(slot,steps\[i\]\)&&mealOpen/.test(s));
ok("meal settings sit with the routine times", /if\(typeof mealSettingsHTML==="function"\) h\+=mealSettingsHTML\(\);/.test(s));
ok("meal names saved to their own node", /db\.ref\("config\/routineTimes\/meals"\)\.set\(m\)/.test(block));
ok("Chore Plan row has the meal button", /cpSetMeal\('\+i\+',/.test(s));
ok("seeding keeps the tag", /if\(s\.meal\) o\.meal=s\.meal;/.test(s));

global.Date = RealDate;
console.log(pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
