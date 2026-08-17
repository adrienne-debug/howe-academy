/*
 * Node tests for Stage 4 slice 1: plan-backed subjects never produce _c carry twins.
 * The projection owns their backlog (an undone lesson is served fresh, in order, as
 * "owed"), so a _c twin next to the fresh card was a duplicate. Runs the real
 * carryPlanBacked + getCarryOverPool, and asserts every carry-creation site is guarded.
 *
 *   run:  node test_carry_planbacked.js
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");

function slice(name) {
  const sig = "function " + name + "(";
  const i = src.indexOf(sig);
  if (i < 0) throw new Error("function not found: " + name);
  let d = 0, j = src.indexOf("{", i);
  for (let k = j; k < src.length; k++) {
    if (src[k] === "{") d++;
    else if (src[k] === "}") { d--; if (d === 0) return src.slice(i, k + 1); }
  }
  throw new Error("unbalanced braces: " + name);
}
const code = ["carryPlanBacked", "getCarryOverPool", "subjNoCarry", "carrySubjectGone", "baseId", "planBacked", "planIdFor", "lidStamped"].map(slice).join("\n");

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log("  ok  - " + name); }
  else { fail++; console.log("  FAIL- " + name + (extra !== undefined ? "  (" + JSON.stringify(extra) + ")" : "")); }
}

function mkEnv() {
  const env = {
    console,
    currData: { subjects: { lincoln: {
      ws: { display: "Wordsmith", planId: "lincoln__ws", doneImportedAt: 1, lessonIds: ["L0001"] },   // plan-backed
      aas: { display: "AAS" },                                                                       // legacy
      pend: { display: "Pending", doneImportedAt: 1, lessonIds: ["L0001"] },                          // stamped, not plan-backed
    } } },
    lidsFor: (kid, sk) => (env.currData.subjects[kid][sk] || {}).lessonIds || null,
    weekData: { week: "week18", tasks: [] }, WK: "week18",
    checked: {}, coExclusions: {},
    completedLessonKeys: () => new Set(),
    _carryBlocked: () => false,
    carryRebaselined: () => false,
    archive: {},
  };
  vm.createContext(env);
  vm.runInContext(code, env);
  return env;
}

console.log("carryPlanBacked");
{
  const e = mkEnv();
  ok("plan-backed subject → true", e.carryPlanBacked({ who: "lincoln", subjectKey: "ws" }) === true);
  ok("legacy subject → false", e.carryPlanBacked({ who: "lincoln", subjectKey: "aas" }) === false);
  ok("stamped but no planId → false", e.carryPlanBacked({ who: "lincoln", subjectKey: "pend" }) === false);
  ok("no subjectKey → false", e.carryPlanBacked({ who: "lincoln" }) === false);
  ok("unknown kid → false", e.carryPlanBacked({ who: "nobody", subjectKey: "ws" }) === false);
  ok("null → false", e.carryPlanBacked(null) === false);
  e.planBacked = () => { throw new Error("boom"); };
  ok("planBacked throwing → false, no throw", e.carryPlanBacked({ who: "lincoln", subjectKey: "ws" }) === false);
}

console.log("getCarryOverPool — plan-backed missed lessons stay out of the Carried-Over box");
{
  const e = mkEnv();
  e.archive = { week17: { weekLabel: "week17", checked: { "2026d224_1": 1 }, tasks: [
    { id: "2026d224_1", who: "lincoln", subjectKey: "ws", day: "monday", title: "✍️ WS — pg 5" },      // done
    { id: "2026d225_2", who: "lincoln", subjectKey: "ws", day: "tuesday", title: "✍️ WS — pg 6" },     // missed, plan-backed → NOT carried
    { id: "2026d225_3", who: "lincoln", subjectKey: "aas", day: "tuesday", title: "AAS L2-16" },        // missed, legacy → carried
    { id: "2026d225_4", who: "lincoln", subjectKey: "pend", day: "tuesday", title: "P L1" },            // missed, stamped-not-plan → carried
  ] } };
  const pool = e.getCarryOverPool();
  const ids = pool.tasks.map(t => t.id);
  ok("legacy missed lesson carries as _c", ids.includes("2026d225_3_c"), ids);
  ok("stamped-but-not-plan-backed still carries", ids.includes("2026d225_4_c"), ids);
  ok("plan-backed missed lesson NOT carried", !ids.includes("2026d225_2_c"), ids);
  ok("done lesson never carried", !ids.includes("2026d224_1_c"));
}

console.log("every carry-creation site is guarded (source assertions)");
{
  const sites = (src.match(/[!\s]carryPlanBacked\(t\)/g) || []).length; // calls only (not the definition)
  ok("carryPlanBacked used at 6 sites (pool + 2 loadJson + ghost + 2 gwCommit)", sites === 6, sites);
  // gwCommit ghost filter: checked/claimed twins return BEFORE the plan-backed check
  const g = src.indexOf("const _ghostC=t=>{");
  const body = src.slice(g, src.indexOf("};", g));
  const iChecked = body.indexOf("return false"), iPb = body.indexOf("carryPlanBacked(t)) return true");
  ok("_ghostC keeps checked/claimed twins first, then ghosts plan-backed", iChecked > 0 && iPb > iChecked, body);
  // new-week and archive-reconstruct filters in gwCommit + loadJson
  const guardedNewWeek = (src.match(/snapTasks\.filter\(t=>!t\.id\.endsWith\("_c"\)&&!snapChecked\[t\.id\][^\n]*carryPlanBacked\(t\)\)/g) || []).length;
  ok("both new-week carry filters guarded", guardedNewWeek === 2, guardedNewWeek);
  const guardedArch = (src.match(/\(_archPrev\.tasks\|\|\[\]\)\.filter\([^\n]*carryPlanBacked\(t\)\)/g) || []).length;
  ok("both archive-reconstruct filters guarded", guardedArch === 2, guardedArch);
  // no site guards a filter that could contain CHECKED base tasks (all guarded filters exclude checked first)
  ok("guard never applied to _c re-attach lists outside the ghost filter", !/t\.id\.endsWith\("_c"\)&&!newIds\.has[^\n]*carryPlanBacked/.test(src));
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
