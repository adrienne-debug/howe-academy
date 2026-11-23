/*
 * Node tests for the Retrieval Plan admin editor's per-kid state.
 *
 * 2026-08-29: after saving Lincoln's plan, his rows showed on every other kid. mastSetKid
 * clears mastAdminLocal but never retrAdminLocal, and every guard was `if(!retrAdminLocal)`,
 * so the editor state survived a kid switch. retrAdminSave writes that state to whoever
 * masteryKid is NOW — so one Save on Lucy's screen would have written Lincoln's plan onto
 * Lucy. She spotted the rows and stopped before saving; the live data was clean.
 *
 * The fix stamps the kid onto the editor state and re-inits on mismatch, which covers every
 * entry point that sets masteryKid rather than trusting each to reset.
 *
 * DRILLPOINT (slice 6, her pick 2026-11-22 "Yes, replace them"): the panel's day buttons are gone (the days are set in
 * Curriculum) and its save writes the numbers only — so the per-kid cases below drive the editor with a number box
 * (retrAdminNum), and the old Row 2 save rules became "a save carries no days".
 *
 *   run:  node test_retr_admin.js
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");

function extractFn(name) {
  const start = src.search(new RegExp("^function\\s+" + name + "\\s*\\(", "m"));
  if (start < 0) throw new Error("fn not found: " + name);
  let i = src.indexOf("{", start), depth = 0, inStr = null, esc = false;
  for (let j = i; j < src.length; j++) {
    const c = src[j];
    if (esc) { esc = false; continue; }
    if (c === "\\") { esc = true; continue; }
    if (inStr) { if (c === inStr) inStr = null; continue; }
    if (c === "/" && src[j + 1] === "/") { j = src.indexOf("\n", j); if (j < 0) break; continue; }
    if (c === "/" && src[j + 1] === "*") { j = src.indexOf("*/", j) + 1; continue; }
    if (c === '"' || c === "'" || c === "`") { inStr = c; continue; }
    if (c === "{") depth++;
    else if (c === "}") { depth--; if (!depth) return src.slice(start, j + 1); }
  }
  throw new Error("unbalanced: " + name);
}
const a = src.indexOf("// RETRWEEK_START"), b = src.indexOf("// RETRWEEK_END");
if (a < 0 || b < 0) throw new Error("RETRWEEK markers not found");
const BLOCK = src.slice(a, b) + "\n" +
  ["retrAdminInit", "retrAdminNum", "retrAdminSave", "drPlanWrite"].map(extractFn).join("\n") +
  "\nlet retrAdminLocal=null;";

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log("  ok  - " + name); }
  else { fail++; console.log("  FAIL- " + name + (extra !== undefined ? "  (" + JSON.stringify(extra) + ")" : "")); }
}

function world() {
  const writes = {};
  const ctx = {
    console,
    masteryKid: "lincoln",
    masteryData: { retrievalPlan: {} },
    HA_LS: { setItem() {}, getItem() { return null; } },
    JSON, Object, String, Number, parseInt, parseFloat, isNaN, Date,
    _mastRe() {},
    db: { ref: p => ({ update: v => { writes[p] = JSON.parse(JSON.stringify(v)); } }) },
    writes,
  };
  vm.createContext(ctx);
  // retrAdminLocal must be declared before the functions that close over it
  vm.runInContext("let retrAdminLocal=null;\n" + BLOCK.replace(/\nlet retrAdminLocal=null;$/, ""), ctx);
  ctx.get = () => vm.runInContext("retrAdminLocal", ctx) || {};   // null-safe: the old code nulled it on save
  ctx.run = code => vm.runInContext(code, ctx);
  return ctx;
}

console.log("\n── the editor state belongs to one kid ──");
{
  const w = world();
  w.run("retrAdminInit();");
  ok("init stamps the kid it was built for", w.get().kid === "lincoln", w.get() && w.get().kid);
}
{
  const w = world();
  w.run("retrAdminNum('gate_pct','91');");              // touch Lincoln's numbers
  w.run("masteryKid='lucy'; retrAdminNum('sprint_seconds','45');");
  ok("switching kids rebuilds the editor state", w.get().kid === "lucy", w.get().kid);
  ok("Lucy does not inherit Lincoln's numbers",
    w.get().settings.gate_pct === undefined && w.get().settings.sprint_seconds === 45, w.get().settings);
  ok("the editor holds no days (DRILLPOINT: they are read, never copied)",
    w.get().week === undefined && w.get().week2 === undefined, Object.keys(w.get()));
}

console.log("\n── Save can never cross kids ──");
{
  const w = world();
  w.run("retrAdminNum('gate_pct','91');");              // Lincoln edit (RETRSAVE 2026-11-19: it saves Lincoln at once)
  const before = JSON.stringify(w.writes);
  w.run("masteryKid='lucy';");                          // switch WITHOUT rendering
  w.run("retrAdminSave();");
  ok("a stale-kid Save writes nothing", JSON.stringify(w.writes) === before && !w.writes["mastery/retrievalPlan/lucy"], w.writes);
  ok("and it reloads the editor for the kid on screen", w.get().kid === "lucy", w.get().kid);
}
{
  const w = world();
  w.run("retrAdminNum('gate_pct','91'); retrAdminSave();");
  ok("a same-kid Save writes to that kid's node",
    !!w.writes["mastery/retrievalPlan/lincoln"], Object.keys(w.writes));
  ok("and to nobody else", Object.keys(w.writes).length === 1, Object.keys(w.writes));
}
{
  const w = world();
  w.run("masteryKid='lucy'; retrAdminNum('gate_pct','91'); retrAdminSave();");
  ok("editing Lucy writes only Lucy",
    !!w.writes["mastery/retrievalPlan/lucy"] && !w.writes["mastery/retrievalPlan/lincoln"],
    Object.keys(w.writes));
}

console.log("\n── a save carries no days (DRILLPOINT) ──");
{
  const w = world();
  // even an editor copy in the old shape (with Row 1 / Row 2 days) writes the numbers only
  w.run("retrAdminInit(); retrAdminLocal.week={mon:'drill'}; retrAdminLocal.week2={mon:'sprint',tue:'drill'}; retrAdminLocal.settings.gate_pct=88; retrAdminSave();");
  const p = w.writes["mastery/retrievalPlan/lincoln"];
  ok("the payload is {settings} only", p && JSON.stringify(Object.keys(p)) === '["settings"]', p);
  ok("with the number in it", p && p.settings.gate_pct === 88, p && p.settings);
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
