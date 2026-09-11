/*
 * Node tests for 🛤 LANES, Stage 6 — tidy: alternation groups retired (a multiple card is how two
 * subjects share a rhythm now), and the Finish Line knows a waiting lane member is not running.
 *   run:  node test_lanes_tidy.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
function block(a, b) { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error("markers " + a); return src.slice(i, j); }
function braceSlice(name) { const sig = "function " + name + "("; const i = src.indexOf(sig); if (i < 0) throw new Error("fn " + name); let d = 0, j = src.indexOf("{", i); for (let k = j; k < src.length; k++) { if (src[k] === "{") d++; else if (src[k] === "}") { d--; if (d === 0) return src.slice(i, k + 1); } } throw new Error("unbalanced " + name); }
let pass = 0, fail = 0;
function ok(name, cond, extra) { if (cond) { pass++; console.log("  ok  - " + name); } else { fail++; console.log("  FAIL- " + name + (extra !== undefined ? "  (" + JSON.stringify(extra) + ")" : "")); } }
const code = src.split("\n").filter(l => !/^\s*\/\//.test(l)).join("\n");   // code lines only

console.log("── alternation groups retired ──");
{
  ["cbAltGroups", "cbGroupOf", "cbBlockedDates", "cbNewGroup", "cbGroupStart", "cbGroupSave", "cbGroupDel", "cbGroupToggleMember", "currData.altGroups", "curriculum/altGroups"].forEach(n => ok("no code mentions " + n, code.indexOf(n) < 0, n));
  ok("no 🔀 marks anywhere", src.indexOf("\\u{1F500}") < 0 && src.indexOf("🔀") < 0);
  ok("the Rules panel has no Alternation groups section", !/Alternation groups — members never share a day/.test(src) && !/New group/.test(src));
  ok("the legacy xlsx carry list no longer names altGroups (nothing to carry) but still carries lanes", /\["done","skiplog","rebaseline","dayCap","groups","plans","lanes"\]/.test(src));
  ok("planMaterialize feeds no blocked days (engine input kept, unfed)", /const blocked=\{\};   \/\/ alternation groups retired/.test(braceSlice("planMaterialize")) && /blocked:\{\[kid\]:\{\[sk\]:blocked\}\}/.test(braceSlice("planMaterialize")));
  ok("cbBuildCfg passes no blockedDates", !/blockedDates/.test(braceSlice("cbBuildCfg")));
  ok("projectPlans still honours a blocked input (pure engine, test_projection pins it)", /plan\._blocked=\(\(\(input\.blocked\|\|\{\}\)\[kid\]\|\|\{\}\)\[plan\.sk\]\)\|\|\{\};/.test(src));
  ok("the grid header no longer looks for a group", !/cbGroupOf\(gvKid/.test(src) && /const mark='';/.test(braceSlice("renderCurrGrid")));
}

console.log("\n── Finish Line: a waiting lane member ──");
{
  const subjects = { s3b: { display: "3B", lessonSeq: ["a", "b"], lessonIds: ["L0001", "L0002"], doneImportedAt: 1, planId: "x", timesPerWeek: 3 }, s4a: { display: "4A", lessonSeq: ["c", "d", "e"], lessonIds: ["L0001", "L0002", "L0003"], doneImportedAt: 1, planId: "y", timesPerWeek: 3 } };
  function run(done, lanes) {
    const ctx = { console, Object, Array, String, Number, Math, JSON, Set, parseInt, Date, ROSTER: ["kid"], DEFAULT_DAY_CAP: 2,
      currData: { subjects: { kid: subjects }, done: { kid: done }, lanes: lanes ? { kid: lanes } : undefined, targetEnd: {} },
      computeFutureSlots: () => ({ kid: { s3b: ["2026-09-14", "2026-09-16"], s4a: ["2026-09-14", "2026-09-16", "2026-09-18"] } }),
      buildSubjectLessons: (k, sk) => subjects[sk].lessonSeq.map(l => ({ lesson: l })), computeSubjectCursor: (k, sk) => Object.keys(done[sk] || {}).length,
      capFor: () => 1, currExpectedBase: () => 0, currWeekNum: () => 22, calNormDate: d => d, gwParseDate: s => new Date(s + "T12:00:00"),
      cbDefaultForm: () => ({ mode: "timesPerWeek", tpw: 3, allowedDays: [] }) };
    ctx.lidsFor = (k, sk) => subjects[sk].lessonIds; ctx.lidStamped = () => true; ctx.planBacked = () => true;
    ctx.lidDoneIdx = (k, sk) => { const d = new Set(Object.keys(done[sk] || {})); const o = new Set(); subjects[sk].lessonIds.forEach((id, i) => { if (d.has(id)) o.add(i); }); return o; };
    vm.createContext(ctx); vm.runInContext(block("// LANE_START", "// LANE_END") + "\n" + braceSlice("computeFinishLines"), ctx);
    return ctx.computeFinishLines("kid");
  }
  const lanes = { math: { name: "Math", units: [{ sk: "s3b" }, { sk: "s4a", rhythm: "prior" }] } };
  const rows = run({}, lanes); const r4 = rows.find(r => r.sk === "s4a"), r3 = rows.find(r => r.sk === "s3b");
  ok("the waiting successor gets status 'waiting' with who it waits for and its lane", r4 && r4.status === "waiting" && r4.waitsFor === "3B" && r4.lane === "Math" && r4.projDate === null && r4.remaining === 3, r4);
  ok("the subject that is up keeps its normal projection", r3 && r3.status !== "waiting" && r3.projDate, r3);
  const rows2 = run({ s3b: { L0001: 1, L0002: 1 } }, lanes);
  ok("once 3B is done, 4A projects normally", rows2.find(r => r.sk === "s4a").status !== "waiting" && rows2.find(r => r.sk === "s3b").status === "done");
  const rows3 = run({}, null);
  ok("no lane → no waiting rows at all", rows3.every(r => r.status !== "waiting"));
}
{
  ok("the 🏁 chip renders the waiting state", /waiting:"#6366f1"/.test(src) && /else if\(_fl\.status==="waiting"\) txt="🛤 "\+_fl\.remaining\+" left · waits for "/.test(src));
  ok("the weekly report does not flag a waiting member as 'needs a look'", /f\.status!=="ontime"&&f\.status!=="done"&&f\.status!=="waiting"/.test(src));
}
console.log("\n" + pass + " passed, " + fail + " failed"); process.exit(fail ? 1 : 0);
