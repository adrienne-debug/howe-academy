// 🎓 NUDGE_ROLLUP (her "all 3", 2026-10-04): the Schedule's Unit Study "up next" box.
// 1 one sprint nudge per deck (whole round wins, else newest group + "+N more"; a run/dismissed whole
//   round covers its groups) · 2 one line per kid on the Schedule → panel · 3 cards a kid came in
//   already knowing read "📏 Get a baseline". Extracts the REAL functions and runs them on a
//   Caleb-shaped kid (capitals + 1–10 + basic shapes placed at enroll).
// NUDGE_SRC=<path> runs it against another copy of index.html.
const fs = require("fs"), path = require("path");
const src = fs.readFileSync(process.env.NUDGE_SRC || path.join(__dirname, "index.html"), "utf8");
let pass = 0, fail = 0;
function ok(name, cond) { if (cond) { pass++; console.log("  ok  - " + name); } else { fail++; console.log("  FAIL- " + name); } }
function extract(startPat) {
  const i = src.indexOf("\n" + startPat); if (i < 0) throw new Error("not found: " + startPat);
  let depth = 0, inS = null, seen = false, k = i + 1;
  for (; k < src.length; k++) { const c = src[k], p = src[k - 1];
    if (inS) { if (c === inS && p !== "\\") inS = null; continue; }
    if (c === '"' || c === "'" || c === "`") { inS = c; continue; }
    if (c === "/" && src[k + 1] === "/") { k = src.indexOf("\n", k) - 1; continue; }
    if (c === "/" && /[=(,:!&|?{};]\s*$/.test(src.slice(Math.max(0, k - 3), k))) {
      let q = k + 1, cls = false; for (; q < src.length; q++) { const d = src[q];
        if (d === "\\") { q++; continue; } if (d === "[") cls = true; else if (d === "]") cls = false; else if (d === "/" && !cls) break; }
      k = q; continue; }
    if (c === "{" || c === "[" || c === "(") { depth++; seen = true; } else if (c === "}" || c === "]" || c === ")") depth--;
    else if (c === "\n" && depth === 0 && seen) break; }
  return src.slice(i + 1, k + 1);
}
const a = src.indexOf("// NUDGE_ROLLUP_START"), b = src.indexOf("// NUDGE_ROLLUP_END");
ok("NUDGE_ROLLUP block present", a > 0 && b > a);
ok("staged enroll tags known cards placed:true", /status:"active",placed:true,tier:wk\?"weekly":"bi_weekly"/.test(src));
const code = [src.slice(a, b), extract("function _unitSafeKey("), extract("function unitSprintRounds("),
  extract("function unitSprintBest("), extract("function unitPlanNudges("), extract("function unitAllNudges("),
  extract("function unitNudgeChips("), extract("function _unitNudgeChipsFor("), extract("function unitScheduleNudges(")].join("\n");

const L = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const letters = { key: "Letters", groupBy: "family", cards: L.map((x, i) => ({ name: x, family: i < 9 ? "A–I" : i < 18 ? "J–R" : "S–Z", order: i + 1 })) };
const numbers = { key: "Numbers", groupBy: "family", cards: Array.from({ length: 20 }, (_, i) => ({ name: String(i + 1), family: ["1–5", "6–10", "11–15", "16–20"][Math.floor(i / 5)], order: i + 1 })) };
const shapes = { key: "Shapes", groupBy: "family", cards: ["Circle", "Square", "Triangle", "Rectangle", "Hexagon", "Oval"].map((n, i) => ({ name: n, family: i < 4 ? "Basic 4" : "Hexagon & oval", order: i + 1 })) };
function world(opts) {
  opts = opts || {};
  const items = [];
  L.forEach(x => items.push({ id: "cal_" + x, subject: "Letters", prompt: x, status: "active", tier: "weekly", placed: true }));
  for (let n = 1; n <= 10; n++) items.push({ id: "cal_" + n, subject: "Numbers", prompt: String(n), status: "active", tier: "weekly" });
  ["11", "12", "13"].forEach(n => items.push({ id: "cal_" + n, subject: "Numbers", prompt: n, status: "introduction", tier: "daily" }));
  ["Circle", "Square", "Triangle", "Rectangle"].forEach(n => items.push({ id: "cal_" + n, subject: "Shapes", prompt: n, status: "active", tier: "weekly" }));
  const units = {
    letters_path: { id: "letters_path", title: "Letters Path", emoji: "🔤", stages: [{ n: 1 }], enrolled: { caleb: true }, decks: [letters] },
    math_fluency_path: { id: "math_fluency_path", title: "Math Fluency Path", emoji: "🧮", stages: [{ n: 1 }], enrolled: { caleb: true }, decks: [numbers] },
    shapes_path: { id: (opts.shapesStaged === false ? "shapes_plain" : "shapes_path"), title: "Shapes", emoji: "🔷", stages: opts.shapesStaged === false ? undefined : [{ n: 1 }], enrolled: { caleb: true }, decks: [shapes] } };
  if (opts.dismiss) units.letters_path.planDismiss = { caleb: opts.dismiss };
  const md = { caleb: items, caleb_settings: {}, history: opts.history || {}, sprintLog: opts.sprintLog || {} };
  const writes = [];
  const fn = new Function("masteryData", "unitStudies", "writes", "MOM",
    `const ROSTER=["caleb","andrew"]; const momModeActive=true; let renders=0;
     function momHere(){ return MOM; } function cap(s){ return s.charAt(0).toUpperCase()+s.slice(1); }
     function renderAll(){ renders++; } function _unitActs(){ return []; } function _nbActKeys(){ return []; }
     function _unitPlanFired(){ return false; } function mastTierAtLeast(t,g){ const o=["daily","every_other_day","weekly","bi_weekly","monthly","graduated"]; return o.indexOf(t)>=o.indexOf(g); }
     function mastUntimedAccuracy(){ return null; }
     function haKidUnits(k){ return Object.values(unitStudies).filter(u=>(u.enrolled||{})[k]); }
     const db={ ref:p=>({ update:v=>writes.push(["update",p,v]), set:v=>writes.push(["set",p,v]) }) };
     ${code}
     return { unitPlanNudges, unitAllNudges, unitScheduleNudges, unitDismissSprintNudge, unitDismissAllSprints, _unitNudgeChipsFor,
       openPanel:k=>{ unitNudgePanelKid=k; }, panelKid:()=>unitNudgePanelKid };`);
  return { api: fn(md, units, writes, opts.mom !== false), units, writes };
}

// 1 — roll-up: Caleb today = 9 group/whole rounds unlocked → 3 nudges (one per deck)
{ const { api, units } = world();
  const all = api.unitAllNudges("caleb");
  ok("one nudge per deck (3, was 7+ for these decks)", all.length === 3);
  const lt = all.find(n => n.deckKey === "Letters"), nm = all.find(n => n.deckKey === "Numbers"), sh = all.find(n => n.deckKey === "Shapes");
  ok("Letters shows the whole round", lt && lt.round.whole && lt.round.label === "All Letters");
  ok("Letters' ✕ stands for whole + A–I/J–R/S–Z (4 keys)", lt && lt.keys.length === 4);
  ok("Numbers (no whole round yet) shows newest group 6–10 +1 more", nm && nm.round.label === "6–10" && nm.more === 1);
  ok("Shapes shows Basic 4, nothing more", sh && sh.round.label === "Basic 4" && sh.more === 0);
  // 3 — wording
  ok("Letters placed → baseline", lt.placed === true);
  ok("staged + never drilled → baseline (cards placed before the tag)", nm.placed === true);
  const chips = api._unitNudgeChipsFor("caleb", all, true);
  ok("chip says '📏 Get a baseline: All Letters'", chips.indexOf("📏 Get a baseline: All Letters") >= 0);
  ok("group chip names its deck + '+1 more'", /Numbers 6–10 <span[^>]*>\(\+1 more\)/.test(chips));
  ok("✕ on a sprint clears the deck", chips.indexOf("unitDismissSprintNudge('letters_path','caleb','Letters')") >= 0);
}
// 3 — drilled in the app → normal wording; non-staged + no tag → normal wording (Howe unchanged)
{ const { api } = world({ history: { caleb: { "20261005": { items: [{ id: "cal_7", result: "correct" }] } } } });
  const nm = api.unitAllNudges("caleb").find(n => n.deckKey === "Numbers");
  ok("a drilled card → 'ready to sprint' wording", nm && nm.placed === false && api._unitNudgeChipsFor("caleb", [nm], true).indexOf("🏃 Numbers 6–10") >= 0); }
{ const { api } = world({ shapesStaged: false });
  const sh = api.unitAllNudges("caleb").find(n => n.deckKey === "Shapes");
  ok("non-staged unit, no placed tag → 'ready to sprint'", sh && sh.placed === false); }
// 1 — whole round run or dismissed covers its groups
{ const { api } = world({ sprintLog: { caleb: [{ src: "unit", deck: "All Letters · Letters Path", best: 31 }] } });
  ok("All Letters run → no Letters nudge (groups covered)", !api.unitAllNudges("caleb").some(n => n.deckKey === "Letters")); }
{ const { api } = world({ dismiss: { "sprint|letters_path|Letters|*": true } });
  ok("All Letters dismissed → groups don't come back", !api.unitAllNudges("caleb").some(n => n.deckKey === "Letters")); }
{ const { api } = world({ sprintLog: { caleb: [{ src: "unit", deck: "6–10 · Math Fluency Path", best: 9 }] } });
  const nm = api.unitAllNudges("caleb").find(n => n.deckKey === "Numbers");
  ok("a run group drops out; the other remains", nm && nm.round.label === "1–5" && nm.more === 0); }
// ✕ writes every folded key in ONE targeted update
{ const { api, writes, units } = world();
  api.unitDismissSprintNudge("letters_path", "caleb", "Letters");
  const w = writes.filter(x => x[1] === "unitStudies/letters_path/planDismiss/caleb");
  ok("dismiss = one update at planDismiss/caleb with 4 keys", w.length === 1 && w[0][0] === "update" && Object.keys(w[0][2]).length === 4);
  ok("Letters nudge gone after ✕", !api.unitAllNudges("caleb").some(n => n.deckKey === "Letters"));
  ok("no other paths written", writes.every(x => x[1].indexOf("/planDismiss/caleb") > 0)); }
{ const { api, writes } = world({ mom: false });
  api.unitDismissSprintNudge("letters_path", "caleb", "Letters");
  ok("not Mom → ✕ writes nothing", writes.length === 0); }
// 2 — Schedule: one line per kid, panel on tap
{ const { api } = world();
  const h = api.unitScheduleNudges("mom");
  ok("Schedule: one summary line for Caleb", (h.match(/unitNudgePanelOpen\('caleb'\)/g) || []).length === 1 && h.indexOf("🏃 3 sprints ready") >= 0);
  ok("Schedule: no inline chips", h.indexOf("ready to sprint!") < 0 && h.indexOf("Get a baseline") < 0);
  ok("Andrew (nothing live) gets no line", h.indexOf("'andrew'") < 0);
  api.openPanel("caleb");
  const p = api.unitScheduleNudges("mom");
  ok("panel lists units with full chips", p.indexOf("🔤 Letters Path") >= 0 && p.indexOf("🧮 Math Fluency Path") >= 0 && p.indexOf("▶ Sprint") >= 0);
  ok("panel has Clear all sprints (Mom)", p.indexOf("unitDismissAllSprints('caleb')") >= 0);
  ok("one-kid filter elsewhere hides Caleb's panel", api.unitScheduleNudges("andrew") === ""); }
{ const { api, writes } = world();
  api.openPanel("caleb"); api.unitDismissAllSprints("caleb");
  ok("Clear all → 3 updates (one per unit), panel closed, nothing left",
    writes.length === 3 && api.panelKid() === null && api.unitAllNudges("caleb").length === 0); }
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
