// 🗓 4-week chore cycle (2026-10-02): a step with cycW runs only in its week of the cycle,
// counted in Mondays from cycStart; off-cycle it is hidden, not due, and can't block the list.
const fs = require("fs"), path = require("path");
const s = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
function slice(name){ const i = s.indexOf("function " + name + "("); let d = 0, j = s.indexOf("{", i); for(; j < s.length; j++){ if(s[j] === "{") d++; else if(s[j] === "}"){ d--; if(!d) break; } } return s.slice(i, j + 1); }
let pass = 0, fail = 0;
function ok(msg, cond){ if(cond){ pass++; } else { fail++; console.log("FAIL:", msg); } }

let day = "monday", ISO = {};
function routineDateISO(dn){ return ISO[dn]; }
eval(slice("stepCycleOk") + slice("stepWindowOk") + slice("stepWindowLabel").replace("routineDateISO(_todayDay)", "null"));

const st = { label: "Kitchen", cad: "wk:0", cycW: 2, cycN: 4, cycStart: "2026-10-05" };
ok("week 1 Monday is off for a wk-2 step", stepCycleOk(st, "2026-10-05") === false);
ok("week 1 Sunday is still week 1", stepCycleOk(st, "2026-10-11") === false);
ok("week 2 Monday is on", stepCycleOk(st, "2026-10-12") === true);
ok("week 2 Sunday is on", stepCycleOk(st, "2026-10-18") === true);
ok("week 3 is off", stepCycleOk(st, "2026-10-19") === false);
ok("repeats: week 6 is on again", stepCycleOk(st, "2026-11-09") === true);
ok("before the start the cycle runs backwards", stepCycleOk(st, "2026-09-14") === true && stepCycleOk(st, "2026-09-28") === false);
ok("no cycle = always", stepCycleOk({ label: "x" }, "2026-10-05") === true);
ISO.monday = "2026-10-12"; ok("stepWindowOk on in its week", stepWindowOk(st, "monday") === true);
ISO.monday = "2026-10-26"; ok("stepWindowOk off out of its week", stepWindowOk(st, "monday") === false);
ISO.monday = undefined; ok("unknown date never hides a step", stepWindowOk(st, "monday") === true);
ok("label", stepWindowLabel(st) === "wk 2 of 4" && stepWindowLabel({ label: "x" }) === "");
ok("due/late respects the window", /function rtDueOrLate\(slot,kid,d,i,st\)\{ if\(typeof stepWindowOk==="function"&&!stepWindowOk\(st,d\)\) return false;/.test(s));
ok("family calendar respects the cycle", /stepCycleOk\(st,iso\)\) return;/.test(slice("_calChoresFor")));
ok("seeding keeps the cycle fields", /o\.cycW=s\.cycW/.test(slice("rtCfgEnsure")));

console.log(pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
