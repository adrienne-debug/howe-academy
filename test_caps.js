/*
 * Node tests for Stage 6c-2: ONE per-day cap — `s.cap` (⚙ Rules "Cap"). config/rules.maxPerDay
 * and the max1 token are retired; the engines read capFor / capForDisplay; a one-tap migration
 * folds both old forms into `cap` (with Undo). Runs the real CAP block + LID block.
 *
 *   run:  node test_caps.js
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");

const ca = src.indexOf("// CAP_START"), cb = src.indexOf("// CAP_END");
const la = src.indexOf("// LID_START"), lb = src.indexOf("// LID_END");
if (ca < 0 || cb < 0 || la < 0 || lb < 0) { console.error("markers not found"); process.exit(1); }
const code = src.slice(la, lb) + "\n" + src.slice(ca, cb);

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log("  ok  - " + name); }
  else { fail++; console.log("  FAIL- " + name + (extra !== undefined ? "  (" + JSON.stringify(extra) + ")" : "")); }
}
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function mkEnv(o) {
  o = o || {};
  const env = {
    currData: { subjects: {
      lincoln: {
        ws: { display: "Wordsmith", planId: "lincoln__ws", doneImportedAt: 1, lessonSeq: ["a"], lessonIds: ["L0001"], pacing: { mode: "timesPerWeek", tpw: 3 } }, // plan-backed, cap unset
        aas: { display: "AAS Lesson", cap: 3 },                                    // explicit
        drills: { display: "Drills", rules: "sequential, max1", tracking: "daily" }, // max1 word
        ind: { display: "Ind Reading" },                                          // legacy, unset
      },
      julian: { drills: { display: "Drills", rules: "max1" } },
    } },
    rulesData: { maxPerDay: { "AAS Lesson": { max: 2, saturday_max: 2 }, "Ind Reading": { max: 2, saturday_max: 1 }, "Drills": { max: 2 }, "Fast Phonics": { max: 2 } } },
    DEFAULT_DAY_CAP: 2,
    lidsFor: (k, sk) => (env.currData.subjects[k][sk] || {}).lessonIds || null,
    momModeActive: true, adminPinUnlocked: false, cbMsg: "", confirmText: null, confirmAnswer: true, relayed: [],
    cap: x => String(x).charAt(0).toUpperCase() + String(x).slice(1), renderAll: () => {}, gwShowToast: () => {}, updates: [], sets: [],
    _gvRelaySubject: (k, sk) => { env.relayed.push(k + "/" + sk); return true; },
    confirm: t => { env.confirmText = t; return env.confirmAnswer; },
    Date, Math, Object, JSON, String, Number, Array, parseInt, console, RegExp,
  };
  env.db = { ref: p => ({ update: u => { env.updates.push({ p, u: JSON.parse(JSON.stringify(u)) }); return { catch: () => {} }; }, set: v => { env.sets.push({ p, v: v == null ? null : JSON.parse(JSON.stringify(v)) }); } }) };
  env.window = env;
  vm.createContext(env);
  new vm.Script(code).runInContext(env);
  return env;
}

console.log("capFor / capForDisplay / catchupDayCap");
{
  const e = mkEnv();
  ok("explicit cap wins", e.capFor("lincoln", "aas", 2) === 3);
  ok("plan-backed unset → 1", e.capFor("lincoln", "ws", 2) === 1);
  ok("legacy unset → caller default (2)", e.capFor("lincoln", "ind", 2) === 2);
  ok("legacy unset → caller default (999 for displacement)", e.capFor("lincoln", "ind", 999) === 999);
  ok("lingering max1 word → 1 (transitional read)", e.capFor("lincoln", "drills", 2) === 1);
  ok("unknown subject → default", e.capFor("lincoln", "zz", 2) === 2 && e.capFor("nobody", "zz", null) === null);
  ok("by display name", e.capForDisplay("lincoln", "AAS Lesson", 2) === 3 && e.capForDisplay("lincoln", "aas lesson", 2) === 3);
  ok("by key too", e.capForDisplay("lincoln", "aas", 2) === 3);
  ok("display shared across kids resolves per kid", e.capForDisplay("julian", "Drills", 2) === 1 && e.capForDisplay("lincoln", "Drills", 2) === 1);
  ok("catchupDayCap = capForDisplay with DEFAULT_DAY_CAP", e.catchupDayCap("lincoln", "Ind Reading") === 2 && e.catchupDayCap("lincoln", "AAS Lesson") === 3 && e.isCatchupCapped("lincoln", "Ind Reading") === true);
  ok("maxPerDay node is NOT consulted any more", (() => { e.rulesData.maxPerDay["Ind Reading"].max = 7; return e.catchupDayCap("lincoln", "Ind Reading") === 2; })());
}

console.log("capLeftovers — what the fold will do");
{
  const e = mkEnv();
  const L = e.capLeftovers();
  const by = {}; L.items.forEach(x => { by[x.kid + "/" + x.sk] = x; });
  ok("AAS: max/day 2 → cap 2 (was 3 explicit — max/day wins as the migrated value)", by["lincoln/aas"] && by["lincoln/aas"].cap === 2 && by["lincoln/aas"].capBefore === 3);
  ok("Ind Reading: max 2 (Sat 1 dropped) → cap 2", by["lincoln/ind"] && by["lincoln/ind"].cap === 2 && /Sat 1 dropped/.test(by["lincoln/ind"].why.join(" ")));
  ok("Drills (lincoln): max/day 2 + max1 → cap 1, word removed, sequential kept", by["lincoln/drills"] && by["lincoln/drills"].cap === 1 && by["lincoln/drills"].hadMax1 && by["lincoln/drills"].rules === "sequential");
  ok("Drills (julian): max1 → cap 1", by["julian/drills"] && by["julian/drills"].cap === 1 && by["julian/drills"].rules === "");
  ok("Wordsmith untouched (no old cap)", !by["lincoln/ws"]);
  ok("orphan entry detected", eq(L.orphans, ["Fast Phonics"]));
}

console.log("gvMigrateCaps / Undo");
{
  const e = mkEnv();
  e.gvMigrateCaps();
  const u = e.updates[0] && e.updates[0].u;
  ok("confirm lists per subject + orphans", /Lincoln · AAS Lesson: cap 2/.test(e.confirmText || "") && /Julian · Drills: cap 1/.test(e.confirmText || "") && /Fast Phonics/.test(e.confirmText || ""), e.confirmText);
  ok("one curriculum update: cap per subject, rules only where max1 was", u && u["subjects/lincoln/aas/cap"] === 2 && u["subjects/lincoln/ind/cap"] === 2 && u["subjects/lincoln/drills/cap"] === 1 && u["subjects/lincoln/drills/rules"] === "sequential" && u["subjects/julian/drills/cap"] === 1 && u["subjects/julian/drills/rules"] === null && !("subjects/lincoln/aas/rules" in u) && !("subjects/lincoln/ws/cap" in u), u);
  ok("config/rules/maxPerDay set to null (whole node retired)", e.sets.some(s => s.p === "config/rules/maxPerDay" && s.v === null) && !e.rulesData.maxPerDay);
  ok("in-memory: caps + rules updated", e.currData.subjects.lincoln.drills.cap === 1 && e.currData.subjects.lincoln.drills.rules === "sequential" && e.currData.subjects.lincoln.aas.cap === 2);
  ok("engines now read the folded cap", e.capFor("lincoln", "aas", 2) === 2 && e.capFor("julian", "drills", 2) === 1);
  ok("no plan-backed subject changed cap → no relay", eq(e.relayed, []));
  ok("second call finds nothing left", (() => { const L = e.capLeftovers(); return L.items.length === 0 && L.orphans.length === 0 && L.node === null; })());
  e.gvMigrateCapsUndo();
  const u2 = e.updates[1] && e.updates[1].u;
  ok("undo restores caps/rules (null where absent) and the node", u2 && u2["subjects/lincoln/aas/cap"] === 3 && u2["subjects/lincoln/ind/cap"] === null && u2["subjects/lincoln/drills/rules"] === "sequential, max1" && e.sets.some(s => s.p === "config/rules/maxPerDay" && s.v && s.v["Fast Phonics"]) && e.rulesData.maxPerDay && e.rulesData.maxPerDay["Ind Reading"].saturday_max === 1, u2);
  ok("in-memory restored", e.currData.subjects.lincoln.ind.cap === undefined && e.currData.subjects.lincoln.aas.cap === 3);
  const e2 = mkEnv(); e2.confirmAnswer = false; e2.gvMigrateCaps();
  ok("cancel → no writes", e2.updates.length === 0 && e2.sets.length === 0);
  const e3 = mkEnv(); e3.momModeActive = false; e3.gvMigrateCaps();
  ok("kid mode → no-op", e3.updates.length === 0);
}
{
  // plan-backed subject whose cap changes re-lays
  const e = mkEnv(); e.rulesData.maxPerDay["Wordsmith"] = { max: 2 };
  e.gvMigrateCaps();
  ok("plan-backed Wordsmith cap 1 → 2 re-lays", e.currData.subjects.lincoln.ws.cap === 2 && eq(e.relayed, ["lincoln/ws"]), e.relayed);
}

console.log("readers rewired (source assertions)");
{
  ok("no engine reads maxPerDay / saturday_max any more", !/rulesData\.maxPerDay\[|mp\[subj\]|cfg\.saturday_max|r\.maxPerDay\[/.test(src));
  ok("no engine reads the max1 word (only capFor's transitional read + the migration that removes it)", (src.match(/includes\("max1"\)/g) || []).length === 1 && /const hasMax1=toks\.includes\("max1"\)/.test(src) && (src.match(/max1\(\[,\\s\]\|\$\)/g) || []).length === 1);
  ok("rulesUpdateMax / rulesAddMax / rulesRemoveMax gone", !/function rules(Update|Add|Remove)Max/.test(src));
  ok("Rules panel has no Max/day column; Add sheet has no max1 chip", !/"No-carry","Rules","Max\/day"/.test(src) && !/"sticky","max1","first"/.test(src));
  ok("🧢 banner wired", src.indexOf("gvMigrateCaps()") >= 0 && src.indexOf("gvMigrateCapsUndo()") >= 0);
  ok("catchupDayCap / isCatchupCapped take (kid, subj)", /catchupDayCap\(t\.who,taskSubject\(t\)\)/.test(src) && /isCatchupCapped\(t\.who,taskSubject\(t\)\)/.test(src));
  ok("runDisplacement maxFor takes (who, subj)", /maxFor\(who,subj\)/.test(src) && /maxFor\(t\.who,subj\)/.test(src));
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
