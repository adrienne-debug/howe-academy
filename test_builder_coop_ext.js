// COOPEXT — the Builder co-op quirk (her ask 2026-10-15). Days the Builder ADDS past the grid's end
// (a kid's first build, or a rebuild that runs past the end) must skip co-op days for a subject co-op
// blocks, exactly like the grid's existing days do (cbFutureRows → coopBlocksBase). Live case: Taylor's
// Saxon (Mom-required, first build 10/2) landed 9 lessons on co-op Thursdays.
// Runs the REAL cbExtendInfo (sliced from index.html) and feeds its extension into the REAL cbMaterialize.
const fs = require("fs"), path = require("path");
const src = fs.readFileSync(process.env.CQ_SRC || path.join(__dirname, "index.html"), "utf8");
let pass = 0, fail = 0;
function ok(name, cond, extra) { if (cond) pass++; else { fail++; console.log("FAIL " + name + (extra !== undefined ? "  " + JSON.stringify(extra) : "")); } }

const a = src.indexOf("// CBGEN_START"), b = src.indexOf("// CBGEN_END");
if (a < 0 || b < 0) throw new Error("CBGEN markers");
const { cbMaterialize } = new Function(src.slice(a, b) + "; return {cbMaterialize};")();
const fi = src.indexOf("function cbExtendInfo(");
const fe = src.indexOf("\n}\n", fi);
if (fi < 0 || fe < 0) throw new Error("cbExtendInfo not found");
const extSrc = src.slice(fi, fe + 2);

const COOP = new Set(["2026-10-08", "2026-10-22"]);   // co-op Thursdays (every other week)
const SUBJ = { saxon: { mom: "required" }, piano: { mom: "none" } };
function mk(lessons) {
  return new Function("currData", "COOP", "SUBJ", `
    function _cbParseDate(s){ return new Date(s+"T12:00:00"); }
    function _cbISO(d){ return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); }
    function cbTodayISO(){ return "2026-10-03"; } function cbPlanTodayISO(){ return "2026-10-03"; }
    function smapIsKidOff(){ return false; } function schedOvKidOff(){ return false; }
    function coopBlocksBase(kid,ds,sk){ return COOP.has(ds) && (SUBJ[sk]||{}).mom==="required"; }
    ${extSrc}
    return cbExtendInfo;`)({ lessons: { taylor: lessons }, weekDays: { taylor: {} } }, COOP, SUBJ);
}
const texts = n => Array.from({ length: n }, (_, i) => "Lesson " + (26 + i));
function build(ext, sk, n) {
  return cbMaterialize({ sk, minutes: 20, mode: "timesPerWeek", tpw: 5, allowedDays: [], content: texts(n), rows: [], dayCapMin: 0, extend: ext });
}
const dates = res => (res.assignments || []).map(x => x.date);

// 1) First build (no grid yet), Mom-required: nothing on co-op days
{
  const extInfo = mk({});
  const ex = extInfo("taylor", "2026-10-05", "saxon");
  ok("synthetic anchor (no grid)", ex.synthetic === true && ex.lastDate === "2026-10-04", ex);
  ok("co-op Thursday is off for a Mom-required subject", ex.isOff("2026-10-08") === true);
  ok("a regular Thursday is not off", ex.isOff("2026-10-15") === false);
  const res = build(ex, "saxon", 15);
  const d = dates(res);
  ok("15 lessons placed", d.length === 15, d.length);
  ok("none on co-op 10/8 or 10/22", !d.includes("2026-10-08") && !d.includes("2026-10-22"), d);
  ok("regular Thursday 10/15 used", d.includes("2026-10-15"), d);
  ok("starts Mon 10/5", d[0] === "2026-10-05", d[0]);
}
// 2) The old behaviour (no subject passed) still lands on co-op — proves the test catches the quirk
{
  const ex = mk({})("taylor", "2026-10-05");
  ok("without sk the co-op day is not off (old path)", ex.isOff("2026-10-08") === false);
  ok("old path puts a lesson on co-op 10/8", dates(build(ex, "saxon", 15)).includes("2026-10-08"));
}
// 3) A subject co-op doesn't block (no Mom) keeps co-op days
{
  const ex = mk({})("taylor", "2026-10-05", "piano");
  ok("non-Mom subject: co-op day stays open", ex.isOff("2026-10-08") === false);
  ok("non-Mom subject uses 10/8", dates(build(ex, "piano", 15)).includes("2026-10-08"));
}
// 4) Rebuild that grows past an existing grid's end (grid ends Fri 10/16): new days skip co-op 10/22
{
  const L = {}; ["2026-10-12", "2026-10-13", "2026-10-14", "2026-10-15", "2026-10-16"].forEach((d, i) => { L[i + 1] = { date: d, week: "Wk 2" }; });
  const ex = mk(L)("taylor", "", "saxon");
  ok("anchored at the grid's last day", ex.lastDate === "2026-10-16" && !ex.synthetic, ex);
  ok("extension co-op day 10/22 is off", ex.isOff("2026-10-22") === true);
  const d = dates(build(ex, "saxon", 8));
  ok("no lesson on 10/22", !d.includes("2026-10-22"), d);
  ok("next co-op-free days used (10/19–21, 10/23)", ["2026-10-19", "2026-10-20", "2026-10-21", "2026-10-23"].every(x => d.includes(x)), d);
}
// 5) Kid-off days still off (unchanged)
{
  const f = new Function("currData", "COOP", "SUBJ", `
    function _cbParseDate(s){ return new Date(s+"T12:00:00"); }
    function _cbISO(d){ return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); }
    function cbTodayISO(){ return "2026-10-03"; } function cbPlanTodayISO(){ return "2026-10-03"; }
    function smapIsKidOff(k,ds){ return ds==="2026-10-06"; } function schedOvKidOff(){ return false; }
    ${extSrc}
    return cbExtendInfo;`)({ lessons: { taylor: {} }, weekDays: {} }, COOP, SUBJ);   // no coopBlocksBase at all → fails open
  const ex = f("taylor", "2026-10-05", "saxon");
  ok("kid-off day still off", ex.isOff("2026-10-06") === true);
  ok("no coopBlocksBase in scope → co-op check fails open (no crash)", ex.isOff("2026-10-08") === false);
}
console.log(pass + " passed, " + fail + " failed");
if (fail) process.exit(1);
