// Mom's Day "Kids today" card (her report 2026-10-03: "🚿 no" for every kid on a shower day). findDue lived only
// inside renderMomBoard, so the card threw a silent ReferenceError → showers, pickup rooms and chores all empty.
const fs = require("fs"), path = require("path");
const s = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
let pass = 0, fail = 0;
function ok(msg, cond){ if(cond){ pass++; } else { fail++; console.log("FAIL:", msg); } }
function slice(name){ const i = s.indexOf("function " + name + "("); let d = 0, j = s.indexOf("{", i); for(; j < s.length; j++){ if(s[j] === "{") d++; else if(s[j] === "}"){ d--; if(!d) break; } } return s.slice(i, j + 1); }

const card = slice("mdCardKidsToday");
ok("the card defines its own findDue", /function findDue\(slot,kid,re\)\{/.test(card));
ok("…and uses it for showers", /findDue\("evening",kid,\/shower\/i\)/.test(card));

const fd = card.slice(card.indexOf("function findDue("), card.indexOf("\n", card.indexOf("function findDue(")));
let day = "saturday";
const rtStepsFor = (slot) => slot === "evening" ? [{ label: "PJs" }, { label: "Shower", cad: "wk:1,3,5" }] : [];
const cadDueOn = (cad, d) => cad === "daily" || cad.slice(3).split(",").map(Number).indexOf(["monday","tuesday","wednesday","thursday","friday","saturday","sunday"].indexOf(d)) >= 0;
const findDue = eval("(" + fd + ")");
ok("Saturday shower is found", findDue("evening", "taylor", /shower/i) === "Shower");
day = "friday";
ok("Friday has none", findDue("evening", "taylor", /shower/i) === null);

console.log(pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
