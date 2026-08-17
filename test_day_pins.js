/*
 * Node tests for Stage 6c-1: "which days" has ONE door — the Days pins. The no-fri /
 * mon-thu tokens are retired: readers use pins; a one-tap migration folds leftover tokens
 * into pins (with Undo). Runs the real LID block + gwReadWeek's pushItem via source
 * assertions on the rewired readers.
 *
 *   run:  node test_day_pins.js
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");

const la = src.indexOf("// LID_START"), lb = src.indexOf("// LID_END");
if (la < 0 || lb < 0) { console.error("LID block markers not found"); process.exit(1); }
const block = src.slice(la, lb);

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log("  ok  - " + name); }
  else { fail++; console.log("  FAIL- " + name + (extra !== undefined ? "  (" + JSON.stringify(extra) + ")" : "")); }
}
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function mkEnv() {
  const env = {
    currData: { subjects: { ellis: {
      hwt: { display: "HWT", rules: "mon-thu", allowedDays: ["Tue", "Thu"], planId: "ellis__hwt", doneImportedAt: 1, lessonSeq: ["a"], lessonIds: ["L0001"], pacing: { mode: "timesPerWeek", tpw: 2 } },
      geo: { display: "Geo", rules: "sequential,no-fri" },                          // no pins → Mon–Thu
      art: { display: "Art", rules: "no-fri,mon-thu", allowedDays: ["Mon", "Wed", "Fri"] }, // pins narrowed
      mr: { display: "MR", rules: "sequential", allowedDays: ["Mon"] },              // untouched
    } } },
    lidsFor: (k, sk) => (env.currData.subjects[k][sk] || {}).lessonIds || null,
    momModeActive: true, adminPinUnlocked: false, cbMsg: "", confirmText: null, confirmAnswer: true, relayed: [],
    cap: x => x, renderAll: () => {}, gwShowToast: () => {}, updates: [],
    _gvRelaySubject: (k, sk, msg) => { env.relayed.push(sk); return true; },
    confirm: t => { env.confirmText = t; return env.confirmAnswer; },
    Date, Math, Object, JSON, String, Number, Array, parseInt, console,
  };
  env.db = { ref: p => ({ update: u => { env.updates.push({ p, u: JSON.parse(JSON.stringify(u)) }); return { catch: () => {} }; } }) };
  env.window = env;
  vm.createContext(env);
  new vm.Script(block).runInContext(env);
  return env;
}

console.log("dayTokenLeftovers — token → pins mapping");
{
  const e = mkEnv();
  const l = e.dayTokenLeftovers("ellis");
  const by = {}; l.forEach(x => { by[x.sk] = x; });
  ok("three subjects flagged (mr untouched)", l.length === 3 && !by.mr, l.map(x => x.sk));
  ok("mon-thu with Tue/Thu pins → pins unchanged, token dropped", eq(by.hwt.pins, ["Tue", "Thu"]) && by.hwt.rules === "" && by.hwt.changed === false, by.hwt);
  ok("no-fri with no pins → Mon–Thu, sequential kept", eq(by.geo.pins, ["Mon", "Tue", "Wed", "Thu"]) && by.geo.rules === "sequential" && by.geo.changed === true, by.geo);
  ok("both tokens with Mon/Wed/Fri pins → Mon/Wed", eq(by.art.pins, ["Mon", "Wed"]) && by.art.rules === "" && by.art.changed === true, by.art);
  ok("unknown kid → []", eq(e.dayTokenLeftovers("nobody"), []));
}

console.log("gvMigrateDayTokens / Undo");
{
  const e = mkEnv();
  e.gvMigrateDayTokens("ellis");
  const u = e.updates[0] && e.updates[0].u;
  ok("confirm previews each subject", /HWT: mon-thu → days Tue\/Thu \(already pinned so\)/.test(e.confirmText || "") && /Geo: no-fri → days Mon\/Tue\/Wed\/Thu/.test(e.confirmText || ""), e.confirmText);
  ok("one curriculum update: rules + allowedDays per subject + lastEdit", u && u["subjects/ellis/hwt/rules"] === null && eq(u["subjects/ellis/hwt/allowedDays"], ["Tue", "Thu"]) && u["subjects/ellis/geo/rules"] === "sequential" && eq(u["subjects/ellis/geo/allowedDays"], ["Mon", "Tue", "Wed", "Thu"]) && eq(u["subjects/ellis/art/allowedDays"], ["Mon", "Wed"]) && "lastEdit" in u && Object.keys(u).length === 7, u);
  ok("in-memory updated", e.currData.subjects.ellis.geo.rules === "sequential" && eq(e.currData.subjects.ellis.geo.allowedDays, ["Mon", "Tue", "Wed", "Thu"]));
  ok("only plan-backed subjects whose days CHANGED re-lay (hwt unchanged → no relay; geo/art legacy → no relay)", eq(e.relayed, []), e.relayed);
  ok("untouched subject not in payload", !Object.keys(u).some(k => k.indexOf("/mr/") >= 0));
  e.gvMigrateDayTokensUndo();
  const u2 = e.updates[1] && e.updates[1].u;
  ok("undo restores rules + pins exactly (null where absent)", u2 && u2["subjects/ellis/hwt/rules"] === "mon-thu" && u2["subjects/ellis/geo/allowedDays"] === null && u2["subjects/ellis/geo/rules"] === "sequential,no-fri" && eq(u2["subjects/ellis/art/allowedDays"], ["Mon", "Wed", "Fri"]), u2);
  ok("in-memory restored", e.currData.subjects.ellis.geo.allowedDays === undefined && e.currData.subjects.ellis.hwt.rules === "mon-thu");
  const e2 = mkEnv(); e2.confirmAnswer = false; e2.gvMigrateDayTokens("ellis");
  ok("cancel → no write", e2.updates.length === 0);
  const e3 = mkEnv(); e3.momModeActive = false; e3.gvMigrateDayTokens("ellis");
  ok("kid mode → no-op", e3.updates.length === 0);
}
{
  // plan-backed subject whose days DO change re-lays
  const e = mkEnv(); e.currData.subjects.ellis.hwt.allowedDays = ["Tue", "Thu", "Fri"];
  e.gvMigrateDayTokens("ellis");
  ok("plan-backed hwt Tue/Thu/Fri + mon-thu → Tue/Thu and re-lays", eq(e.currData.subjects.ellis.hwt.allowedDays, ["Tue", "Thu"]) && eq(e.relayed, ["hwt"]), e.relayed);
}

console.log("readers rewired to pins (source assertions)");
{
  const engine = src.slice(src.indexOf("function pushItem(kid,key,excelVal)"));
  ok("no engine/UI reader tests the tokens any more", !/rl\.includes\("no-fri"\)|rl\.includes\("mon-thu"\)|rules\.includes\("no-fri"\)|rules\.includes\("mon-thu"\)/.test(src));
  ok("pushItem reads the grid as laid — no token drop, and NO pins drop (past cells laid before pins changed must not vanish)", !/includes\("no-fri"\)|includes\("mon-thu"\)|_al\.includes\(_ab\)|dropped\.push\([^\n]*days/.test(engine.slice(0, engine.indexOf("const id=prefix+"))));
  ok("Rules panel + Add sheet no longer offer the two chips", !/\["no-fri","no-fri"\]/.test(src) && !/"sticky","no-fri","mon-thu"/.test(src));
  ok("migration banner wired", src.indexOf("gvMigrateDayTokens(\\''+gvKid+'\\')") >= 0 && src.indexOf("gvMigrateDayTokensUndo()") >= 0);
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
