/*
 * ▶ Run on a unit round in the Sprint Plan's "Today's queue" (RETRUNITRUN, 2026-10-07).
 * Live: Lincoln's Sprint Plan (top of every Sprint source, so also his Math Sprints page) said
 * "👑 Normandy round — never run" — Normandy is a house round of his British Monarchy unit — with
 * only a plain "Units tab →" label, so nothing on the page could start it.
 *   · retrTodayQueue carries the never-run round + whether the kid is enrolled
 *   · the queue row draws ▶ Run → unitGoSprint(kid, unitId, round key): Sprint view, Unit source, round loaded
 *   · a PB-chase row opens the unit's round picker (key null); not enrolled → the old label, no button
 *   · a round name with an apostrophe still makes a working onclick; no writes anywhere
 *   run:  node test_retr_unit_run.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
let pass = 0, fail = 0;
function ok(n, c, x) { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x) + ")" : "")); } }
function fn(name) {
  const s = src.indexOf("\nfunction " + name + "("); if (s < 0) throw new Error("not found: " + name);
  let i = src.indexOf("{", s), d = 0;
  for (; i < src.length; i++) { const c = src[i]; if (c === "{") d++; else if (c === "}") { d--; if (!d) return src.slice(s, i + 1); } }
  throw new Error("unbalanced: " + name);
}
ok("RETRUNITRUN block present", src.indexOf("// RETRUNITRUN_START") > 0 && src.indexOf("// RETRUNITRUN_END") > src.indexOf("// RETRUNITRUN_START"));

function world(o) {
  o = o || {};
  const writes = [], gone = [];
  const ctx = {
    console, Object, Array, String, JSON, Math,
    masteryKid: "lincoln", mastView: "drill", mastLogMode: true, mastScoreItemId: 5, sprintSource: "book", sprintUnitId: null, sprintUnitKey: "old",
    unitStudies: { british_monarchy: { id: "british_monarchy", title: "British Monarchy", enrolled: o.enrolled === false ? {} : { lincoln: true } } },
    rounds: o.rounds, best: o.best || {},
    retrTracks: () => [{ key: "monarchy", icon: "👑", label: "Monarchy rounds", src: "unit", unitId: "british_monarchy" }],
    unitSprintRounds: () => ctx.rounds, unitSprintBest: (k, l) => ctx.best[l] == null ? null : ctx.best[l],
    retrEvalTrack: () => ({ stages: [], done: true }), retrTodayKinds: () => ["sprint"], retrSettings: () => ({ gate_pct: 80, gate_streak: 2 }),
    RETR_KIND_ICON: { sprint: "🏃", off: "·" }, retrPlanOpen: true, retrMatchSuggest: () => null,
    esc: s => String(s || "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;"),
    showTab: t => gone.push(t), db: { ref: p => ({ set: v => writes.push(p), update: v => writes.push(p) }) },
  };
  vm.createContext(ctx);
  vm.runInContext([fn("retrTodayQueue"), fn("retrPlanCardHtml"), fn("unitGoSprint")].join("\n"), ctx);
  return { ctx, writes, gone, call: e => vm.runInContext(e, ctx) };
}
const R = (label, extra) => Object.assign({ key: "british_monarchy|British Monarchs|" + label, label, logLabel: label + " · British Monarchy", unlocked: true }, extra || {});
// the onclick of the ▶ Run button, as the browser would see it (attribute entities decoded)
function runClick(h) {
  const m = /<button onclick="(unitGoSprint\([^"]*\))"[^>]*>▶ Run<\/button>/.exec(h);
  return m ? m[1].replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&") : null;
}

console.log("── a never-run round (the live Normandy case) ──");
{
  const w = world({ rounds: [R("Normandy"), R("Tudors", { unlocked: false })] });
  const q = w.call("retrTodayQueue('lincoln')");
  ok("queue names the Normandy round", q.length === 1 && q[0].label === "👑 Normandy round — never run", q.map(x => x.label));
  ok("the queue item carries the round and enrollment", q[0].round && q[0].round.key === "british_monarchy|British Monarchs|Normandy" && q[0].enrolled === true);
  const h = w.call("retrPlanCardHtml('#2563eb')");
  ok("the row has a ▶ Run button, not just 'Units tab →'", runClick(h) && h.indexOf("Units tab →") < 0);
  w.call(runClick(h));
  ok("▶ Run lands on the Sprint view, Unit source, Normandy loaded",
    w.ctx.mastView === "sprint" && w.ctx.sprintSource === "unit" && w.ctx.sprintUnitId === "british_monarchy" &&
    w.ctx.sprintUnitKey === "british_monarchy|British Monarchs|Normandy" && w.ctx.masteryKid === "lincoln" && w.ctx.mastLogMode === false,
    [w.ctx.mastView, w.ctx.sprintSource, w.ctx.sprintUnitKey]);
  ok("it opens the Mastery tab", w.gone.join() === "mastery");
  ok("nothing is written", w.writes.length === 0);
}

console.log("── a PB chase (every round already run) ──");
{
  const w = world({ rounds: [R("Normandy")], best: { "Normandy · British Monarchy": 31 } });
  const q = w.call("retrTodayQueue('lincoln')");
  ok("queue offers the PB treat", q.length === 1 && q[0].kind === "treat" && !q[0].round);
  const h = w.call("retrPlanCardHtml('#2563eb')");
  const c = runClick(h);
  ok("the treat row has ▶ Run too", !!c);
  w.call(c);
  ok("it opens the unit's round picker (no round preselected)", w.ctx.sprintSource === "unit" && w.ctx.sprintUnitId === "british_monarchy" && w.ctx.sprintUnitKey === null);
}

console.log("── not enrolled ──");
{
  const w = world({ rounds: [R("Normandy")], enrolled: false });
  const h = w.call("retrPlanCardHtml('#2563eb')");
  ok("no button — nowhere to land; the old label stays", !runClick(h) && h.indexOf("Units tab →") > 0);
}

console.log("── a round name with an apostrophe ──");
{
  const w = world({ rounds: [R("King's Men")] });
  const c = runClick(w.call("retrPlanCardHtml('#2563eb')"));
  let threw = null; try { w.call(c); } catch (e) { threw = e.message; }
  ok("the onclick still parses and loads that round", !threw && w.ctx.sprintUnitKey === "british_monarchy|British Monarchs|King's Men", threw || w.ctx.sprintUnitKey);
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
