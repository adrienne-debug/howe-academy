/*
 * Node tests for gvCellIdentity + the gesture wiring that keeps cell actions honest.
 *
 * The disease (live, 2026-08-30): since Stage 2 a plan-backed FUTURE cell displays the
 * DERIVED lesson while the stored text under it lags the plan. 🗑 read the stored text and
 * deleted Lucy's Lesson 108 while her screen showed the duplicate Lesson 103. ✓ done had
 * the same read; ✎ edit was worse — its list re-sync would rebuild lessonSeq from the
 * lagging cells (lincoln/aas 95 → 91, four unfinished lessons deleted).
 *
 * Behavior tests extract the GVIDENT block; the gesture paths carry heavy db/UI deps, so
 * they are pinned by source assertions on the exact guards.
 *
 *   run:  node test_cell_identity.js
 */
const fs = require("fs");
const path = require("path");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");

const a = src.indexOf("// GVIDENT_START");
const b = src.indexOf("// GVIDENT_END");
if (a < 0 || b < 0) { console.error("GVIDENT markers not found"); process.exit(1); }
const block = src.slice(a, b);

const TODAY = "2026-08-30";
function fresh(opts) {
  opts = opts || {};
  const prelude = `
    var cbTodayISO=function(){ return "${TODAY}"; };
    var gvFilled=function(v){ return !!(v&&v!=="—"&&String(v).trim()); };
    var planBacked=function(kid,sk){ return ${opts.planBacked === false ? "false" : "true"}; };
    var currData=${JSON.stringify({ lessons: { kid: opts.lessons || {} } })};
    var gvDerivedColumn=function(){ return ${JSON.stringify(opts.derived === undefined ? null : opts.derived)}; };
  `;
  return new Function(prelude + block + "; return {ident:gvCellIdentity};")();
}

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log("  ok  - " + name); }
  else { fail++; console.log("  FAIL- " + name + (extra !== undefined ? "  (" + JSON.stringify(extra) + ")" : "")); }
}

console.log("gvCellIdentity");
{
  const lessons = { 100: { date: "2026-09-18", k: "Lesson 108" } };
  const derived = { byDate: { "2026-09-18": { text: "Lesson 103", lid: "L0015", src: "plan" } } };
  const r = fresh({ lessons, derived }).ident("kid", 100, "k");
  ok("a plan-backed future cell resolves to the DERIVED lesson",
    r.mode === "plan" && r.text === "Lesson 103" && r.lid === "L0015", r);
  ok("— which is NOT the stored text (the Lucy incident, pinned)", r.text !== "Lesson 108");
}
{
  const lessons = { 100: { date: "2026-01-05", k: "Lesson 40" } };
  const derived = { byDate: { "2026-01-05": { text: "WRONG", lid: "LX" } } };
  const r = fresh({ lessons, derived }).ident("kid", 100, "k");
  ok("a PAST cell keeps its stored text — the record is never recomputed",
    r.mode === "stored" && r.text === "Lesson 40", r);
}
{
  const lessons = { 100: { date: "2026-09-18", k: "Lesson 40" } };
  const r = fresh({ lessons, derived: null, planBacked: false }).ident("kid", 100, "k");
  ok("legacy columns resolve to the stored text", r.mode === "stored" && r.text === "Lesson 40");
}
{
  const lessons = { 100: { date: "2026-09-18", k: "Lesson 40 ✓" } };
  const derived = { byDate: {} };
  const r = fresh({ lessons, derived }).ident("kid", 100, "k");
  ok("no derived entry (done cell / empty day) falls back to stored",
    r.mode === "stored" && r.text === "Lesson 40 ✓", r);
}
{
  const lessons = { 100: { date: "2026-09-18", k: "Lesson 40" } };
  const r = fresh({ lessons, derived: { err: "boom", byDate: {} } }).ident("kid", 100, "k");
  ok("a projection error falls back to stored, never throws", r.mode === "stored");
}
{
  const lessons = { 100: { date: "2026-09-18", k: "card text" } };
  const derived = { byDate: { "2026-09-18": { text: "Lesson 7a", lid: "L0007", src: "card" } } };
  const r = fresh({ lessons, derived }).ident("kid", 100, "k");
  ok("a dealt-day cell reports src card", r.mode === "plan" && r.src === "card", r);
}

console.log("\ngesture wiring — every cell action resolves the DISPLAYED identity");
{
  const del = src.slice(src.indexOf("function gvDeleteLesson"), src.indexOf("function gvDeleteLesson") + 6000);
  ok("🗑 resolves gvCellIdentity FIRST", del.indexOf("gvCellIdentity") > 0 &&
    del.indexOf("gvCellIdentity") < del.indexOf("const lessons="));
  ok("🗑 deletes by lid INDEX, never by text search",
    /ids2\.indexOf\(_idn\.lid\)/.test(del));
  ok("🗑 uses the exact-index hint", /hint:\{index:li,op:"delete"\}/.test(del));
  ok("🗑 refuses a finished lesson", del.indexOf("is finished — its record stays") > 0);
  ok("🗑 refuses a dealt card cell", /src==="card"/.test(del));

  const done = src.slice(src.indexOf("function gvMenuDone"), src.indexOf("function gvMenuDone") + 5000);
  ok("✓ resolves gvCellIdentity FIRST", done.indexOf("gvCellIdentity") > 0 &&
    done.indexOf("gvCellIdentity") < done.indexOf('const txt=String(l[sk]'));
  ok("✓ writes the done record BY LID", /up\["done\/"\+kid\+"\/"\+sk\+"\/"\+_idn\.lid\]/.test(done));
  ok("✓ refuses an already-finished lesson", done.indexOf("is already finished") > 0);

  const edit = src.slice(src.indexOf("function gvCommitCell"), src.indexOf("function gvCommitCell") + 3000);
  ok("✎ refuses plan-backed cells before any write", edit.indexOf("gvCellIdentity") > 0 &&
    edit.indexOf("gvCellIdentity") < edit.indexOf("db.ref("));

  const sync = src.slice(src.indexOf("function gvSyncSeqInto"), src.indexOf("function gvSyncSeqInto") + 1600);
  ok("gvSyncSeqInto NEVER rebuilds a plan-backed list from cells",
    /planBacked\(kid,sk\)\) return;/.test(sync));
  ok("— guarded before the cell walk", sync.indexOf("planBacked") < sync.indexOf("const newSeq"));

  const tapAt = src.indexOf("// Decide by what the cell DISPLAYS");
  const tap = tapAt < 0 ? "" : src.slice(tapAt, tapAt + 700);
  ok("the tap decides menu-vs-editor by the displayed value",
    /_shown/.test(tap) && /gvFilled\(_shown\)/.test(tap));
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
