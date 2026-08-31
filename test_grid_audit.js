/*
 * Node tests for the 🔍 Grid audit — gvAuditFindings + gvAuditRender.
 *
 * Extracts the REAL detector out of index.html via the GVAUDIT markers and
 * asserts, on synthetic fixtures: skipped numbers, lessons booked twice,
 * out-of-order and backwards cells, mixed dashes, and — the rule the whole
 * feature rests on — that nothing dated before today is ever offered a fix.
 *
 * Also covers the two readings of a trailing "a-b": pages 24-27 vs unit 2
 * lesson 7, decided per column by which one actually fits.
 *
 *   run:  node test_grid_audit.js
 */
const fs = require("fs");
const path = require("path");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");

const a = src.indexOf("// GVAUDIT_START");
const b = src.indexOf("// GVAUDIT_END");
if (a < 0 || b < 0) { console.error("GVAUDIT markers not found"); process.exit(1); }
const block = src.slice(a, b);

const TODAY = "2026-08-15";
// The globals the extracted block closes over, supplied as a prelude.
const prelude = `
  var cbTodayISO=function(){return "${TODAY}";};
  var gvFilled=function(v){return !!(v&&v!=="—"&&v!=="nan"&&String(v).trim());};
  var cap=function(s){return String(s).charAt(0).toUpperCase()+String(s).slice(1);};
  var esc=function(s){return String(s).replace(/[&<>"]/g,function(c){
    return {"&":"&amp;","<":"&lt;",">":"&gt;","\\"":"&quot;"}[c];});};
  var gvGrabScroll=function(){}, renderAll=function(){};
  var currData={subjects:{},lessons:{}};
  var lidDoneIdx=function(){return new Set();};   // plan-backed path: nothing done in fixtures
`;
const api = new Function(prelude + block +
  "; return {find:gvAuditFindings, render:gvAuditRender, toggle:gvAuditToggle, rec:gvReconcile," +
  " set:function(d){currData=d;}, setSkip:function(s){currData.skiplog=s;}};")();

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log("  ok  - " + name); }
  else { fail++; console.log("  FAIL- " + name + (extra !== undefined ? "  (" + JSON.stringify(extra) + ")" : "")); }
}

// Build a one-kid, one-subject grid. `texts` are laid on consecutive weekdays
// starting `startDay` days before today, so past/future is controllable.
function grid(texts, opts) {
  opts = opts || {};
  const lessons = {}, base = new Date(TODAY + "T12:00:00Z");
  texts.forEach(function (t, i) {
    const d = new Date(base);
    d.setUTCDate(d.getUTCDate() + (opts.offset === undefined ? -Math.floor(texts.length / 2) : opts.offset) + i);
    lessons[100 + i] = { date: d.toISOString().slice(0, 10), k: t };
  });
  return {
    subjects: { kid: { k: Object.assign({ display: "Subj", tracking: "sequenced" }, opts.subj || {}) } },
    lessons: { kid: lessons },
  };
}
const all = r => r.now.concat(r.past);
const types = r => all(r).map(f => f.type).sort();

console.log("gaps");
{
  api.set(grid(["pg 1", "pg 2", "pg 3", "pg 6", "pg 7", "pg 8"]));
  const f = all(api.find("kid")).filter(x => x.type === "gap");
  ok("finds a skipped run", f.length === 1, types(api.find("kid")));
  ok("names the missing numbers", f[0] && f[0].missing === "4–5", f[0] && f[0].missing);
}
{
  // A subject that legitimately advances 4 pages at a time is NOT broken.
  api.set(grid(["pp.1-4", "pp.5-8", "pp.9-12", "pp.13-16", "pp.17-20"]));
  ok("a consistent multi-page stride is clean", all(api.find("kid")).length === 0, types(api.find("kid")));
}
{
  api.set(grid(["pp.1-4", "pp.5-8", "pp.13-16", "pp.17-20", "pp.21-24"]));
  const f = all(api.find("kid")).filter(x => x.type === "gap");
  ok("catches a gap against that stride", f.length === 1 && f[0].missing === "9–12", f[0] && f[0].missing);
}

console.log("a lesson done early is not a missing lesson");
{
  // The AAS case, 2026-08-15: L2-17 was done early, so the column reads
  // 17, 15, 16, 18. A pairwise walk sees 16→18 and calls 17 missing; the fix
  // then inserted a second copy and the re-lay refused it as already done.
  api.set(grid(["L2-13", "L2-14", "L2-17", "L2-15", "L2-16", "L2-18", "L2-19"]));
  const f = all(api.find("kid"));
  ok("does not report a gap for a number present elsewhere",
    f.filter(x => x.type === "gap").length === 0, f.map(x => x.type + ":" + (x.missing || "")));
  ok("still reports the out-of-order lesson", f.some(x => x.type === "order" || x.type === "back"),
    f.map(x => x.type));
}
{
  // Partially covered: 4 exists later, 5 truly never appears.
  api.set(grid(["pg 1", "pg 2", "pg 4", "pg 3", "pg 6", "pg 7", "pg 8"]));
  const f = all(api.find("kid")).filter(x => x.type === "gap");
  ok("reports only the numbers genuinely absent", f.length === 1 && f[0].missing === "5",
    f.map(x => x.missing));
}

console.log("duplicates");
{
  api.set(grid(["L1", "L2", "L3", "L3", "L4", "L5"]));
  const f = all(api.find("kid")).filter(x => x.type === "dup");
  ok("finds a lesson booked twice", f.length === 1 && f[0].n === 2, f.length);
}
{
  // Generic repeating labels are the plan working as intended, not a fault.
  api.set(grid(["Free choice", "Free choice", "Free choice", "Free choice"]));
  ok("ignores unnumbered repeats", all(api.find("kid")).filter(x => x.type === "dup").length === 0);
}

console.log("order");
{
  api.set(grid(["pg 1", "pg 2", "pg 5", "pg 3", "pg 6", "pg 7"]));
  const t = types(api.find("kid"));
  ok("a displaced lesson is ONE finding, not three", t.filter(x => x === "order").length === 1, t);
}

console.log("the two readings of \"a-b\"");
{
  // Unit 2, lessons 7..11 — must not be read as pages 2–7, 2–8, …
  api.set(grid(["L2-7", "L2-8", "L2-9", "L2-10", "L2-11"]));
  ok("hierarchical numbering reads as unit+lesson", all(api.find("kid")).length === 0, types(api.find("kid")));
}
{
  api.set(grid(["L2-7", "L2-8", "L2-9", "L2-12", "L2-13"]));
  const f = all(api.find("kid")).filter(x => x.type === "gap");
  ok("and still finds a gap inside the unit", f.length === 1 && f[0].missing === "10–11", f[0] && f[0].missing);
}
{
  // A new unit resets the count — 3-1 after 2-9 is correct, not backwards.
  api.set(grid(["L2-7", "L2-8", "L2-9", "L3-1", "L3-2", "L3-3"]));
  ok("a unit boundary is not a fault", all(api.find("kid")).length === 0, types(api.find("kid")));
}

console.log("dashes");
{
  api.set(grid(["pp.1-4", "pp.5-8", "pp.9–12", "pp.13–16", "pp.17–20"], { offset: 0 }));
  const f = all(api.find("kid")).filter(x => x.type === "dash");
  ok("flags a column mixing - and –", f.length === 1, types(api.find("kid")));
  ok("counts only the upcoming cells needing a change", f[0] && f[0].fwd === 2, f[0] && f[0].fwd);
}

console.log("past is the record — never fixed");
{
  // Everything behind today: findings still surface, but as past.
  api.set(grid(["pg 1", "pg 2", "pg 5", "pg 6"], { offset: -40 }));
  const r = api.find("kid");
  ok("old findings land in past, not actionable", r.now.length === 0 && r.past.length === 1,
    { now: r.now.length, past: r.past.length });
  api.toggle();                                   // expand so rows render
  const h = api.render("kid", "#333");
  const tail = h.split("Already happened")[1] || "";
  ok("no fix button anywhere in the past section", tail.indexOf("gvAuditFix") < 0);
  ok("past section still offers “Show me”", tail.indexOf("gvAuditGoto") > 0);
  api.toggle();
}
{
  api.set(grid(["pg 1", "pg 2", "pg 5", "pg 6"], { offset: 0 }));
  const r = api.find("kid");
  ok("upcoming findings are actionable", r.now.length === 1 && r.past.length === 0,
    { now: r.now.length, past: r.past.length });
  ok("every actionable finding is dated today or later",
    r.now.every(f => f.type === "dash" || f.date >= TODAY));
}

console.log("scope");
{
  api.set(grid(["L1", "L2", "L5"], { subj: { tracking: "daily" } }));
  ok("daily-tracked subjects are never audited", all(api.find("kid")).length === 0);
  api.set(grid(["L1", "L2", "L5"], { subj: { paused: true } }));
  ok("paused subjects are never audited", all(api.find("kid")).length === 0);
  api.set(grid(["L1", "L2", "L3", "L4"]));
  ok("a clean column renders no strip at all", api.render("kid", "#333") === "");
}

console.log("the gap hand-off is disconnected");
{
  // 2026-08-15: "Add it back…" routed into the Builder and a whole column came
  // back cleared with no Apply behind it. No gap may offer a fix button until
  // that write path is traced.
  api.set(grid(["pg 1", "pg 2", "pg 5", "pg 6", "pg 7"], { offset: 0 }));
  const r = api.find("kid");
  ok("the gap is still reported", r.now.some(f => f.type === "gap"));
  api.toggle();
  const h = api.render("kid", "#333");
  api.toggle();
  ok("no gap fix button is rendered anywhere", h.indexOf("gvAuditFixGap") < 0);
  ok("the gap row still offers “Show me”", h.indexOf("gvAuditGoto") > 0);
}

console.log("card list vs grid");
{
  // Grid is a superset: adopting it only ADDS, so it's offered as one tap.
  api.set(grid(["L1", "L2", "L3", "L4"], { subj: { lessonSeq: ["L1", "L2", "L3"] } }));
  const r = api.rec("kid");
  ok("spots a list missing grid work", r.length === 1 && r[0].onlyInGrid.length === 1, r);
  ok("and calls it lossless", r[0] && r[0].lossless === true);
}
{
  // List holds work the grid doesn't: matching would discard it, so no button.
  api.set(grid(["L1", "L2"], { subj: { lessonSeq: ["L1", "L2", "L3", "L4"] } }));
  const r = api.rec("kid");
  ok("spots lessons a rebuild would insert", r[0] && r[0].onlyInList.length === 2, r);
  ok("and refuses to call it lossless", r[0] && r[0].lossless === false);
}
{
  api.set(grid(["L1", "L2", "L3"], { subj: { lessonSeq: ["L1", "L2", "L3"] } }));
  ok("agreement reports nothing", api.rec("kid").length === 0);
}
{
  // A dismissed lesson is absent from the grid ON PURPOSE — not drift.
  api.set(grid(["L1", "L2"], { subj: { lessonSeq: ["L1", "L2", "L3"] } }));
  api.setSkip({ kid: { k: [{ lesson: "L3" }] } });
  ok("excludes dismissed lessons", api.rec("kid").length === 0, api.rec("kid"));
  api.setSkip({});
}
{
  // Sequences repeat on purpose; compare as multisets, not sets.
  api.set(grid(["Free choice", "Free choice", "Free choice"],
    { subj: { lessonSeq: ["Free choice", "Free choice"] } }));
  const r = api.rec("kid");
  ok("counts repeats rather than de-duping", r[0] && r[0].onlyInGrid.length === 1, r);
}
{
  api.set(grid(["L1", "L2", "L3"], { subj: { lessonSeq: ["L1", "L2"], tracking: "daily" } }));
  ok("skips daily-tracked subjects", api.rec("kid").length === 0);
  api.set(grid(["L1", "L2", "L3"], { subj: { lessonSeq: ["L1", "L2"], paused: true } }));
  ok("skips paused subjects", api.rec("kid").length === 0);
  api.set(grid(["L1", "L2", "L3"], { subj: {} }));
  ok("skips subjects with no list at all", api.rec("kid").length === 0);
}
{
  // Renamed content reads as drift in BOTH directions — the Dimensions Math case.
  // It must never be offered as a one-tap.
  api.set(grid(["Ch1: adding", "Ch2: taking away"], { subj: { lessonSeq: ["Lesson 1", "Lesson 2"] } }));
  const r = api.rec("kid");
  ok("renamed lessons show as both insert and delete",
    r[0] && r[0].onlyInList.length === 2 && r[0].onlyInGrid.length === 2, r);
  ok("and are never offered as one tap", r[0] && r[0].lossless === false);
}
{
  api.set(grid(["L1", "L2", "L3", "L4"], { subj: { lessonSeq: ["L1", "L2", "L3"] } }));
  api.toggle();
  const h = api.render("kid", "#333");
  api.toggle();
  ok("the strip shows the list-vs-grid section", h.indexOf("Card list vs grid") > 0);
  ok("lossless rows offer the match button", h.indexOf("gvReconcileAdopt") > 0);
  const d = (h.match(/<div\b/g) || []).length - (h.match(/<\/div>/g) || []).length;
  ok("divs still balance with the new section", d === 0, d);
}
{
  api.set(grid(["L1", "L2"], { subj: { lessonSeq: ["L1", "L2", "L3", "L4"] } }));
  api.toggle();
  const h = api.render("kid", "#333");
  api.toggle();
  ok("rows needing a decision get NO button", h.indexOf("gvReconcileAdopt") < 0);
  ok("and say why", h.indexOf("Needs a decision") > 0);
}

console.log("markup");
{
  api.set(grid(["pg 1", "pg 2", "pg 5", "pg 6", "pg 6"], { offset: -2 }));
  api.toggle();
  const h = api.render("kid", "#333");
  api.toggle();
  const d = (h.match(/<div\b/g) || []).length - (h.match(/<\/div>/g) || []).length;
  ok("divs balance (an unbalanced strip breaks the grid below it)", d === 0, d);
  ok("buttons balance", (h.match(/<button\b/g) || []).length === (h.match(/<\/button>/g) || []).length);
  ok("nothing leaks undefined/NaN into the markup", !/undefined|NaN/.test(h));
}

// ── the adopt button cannot delete a plan-backed subject's work ────────────
// Stage 2 killed this button's premise: the Grid now DISPLAYS the plan, so "take the grid's
// names" would adopt the STALE stored cells. On Lincoln's AAS (list 95, grid 90, nothing
// grid-only) that meant rewriting the list to 90 and deleting L2-16…L2-20 — five lessons he
// had not done. Source assertions, because the guard lives in the render and the action.
console.log("\nadopt guard (plan-backed)");
{
  const srcAll = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
  const fnStart = srcAll.indexOf("function gvReconcileAdopt");
  const fn = fnStart < 0 ? "" : srcAll.slice(fnStart, fnStart + 6000);   // must span the write path
  ok("gvReconcileAdopt exists", fnStart >= 0);
  ok("it refuses outright for a plan-backed subject",
    /planBacked\(kid,sk\)\)\{[\s\S]{0,400}?return;/.test(fn), "no plan-backed bail-out");
  const iGuard = fn.indexOf("planBacked(kid,sk)"), iWrite = fn.indexOf("gvSyncSeqInto");
  ok("the refusal happens BEFORE any patch is built",
    iGuard >= 0 && iWrite > iGuard, { guard: iGuard, write: iWrite });
  ok("it points her at Rebuild instead", /Rebuild the subject instead/.test(fn));

  const rStart = srcAll.indexOf("Card list vs grid — out of step");
  const render = rStart < 0 ? "" : srcAll.slice(rStart, rStart + 4000);
  ok("the findings section exists", rStart >= 0);
  ok("a plan-backed row offers NO adopt button",
    /planBacked\(kid,r\.sk\)\)\s*\n?\s*h\+='<span/.test(render), "plan-backed row still reaches a button");
  ok("and says the stored cells are the thing that lags",
    /only the stored cells behind it are/.test(render));
  ok("and warns against matching the list to the grid",
    /would delete work still to do/.test(render));
  // the legacy paths survive for non-plan-backed subjects
  ok("the lossless button still exists for legacy subjects", /Match the list to the grid/.test(render));
  ok("the lossy button still exists for legacy stamped subjects", /Take the grid’s names/.test(render));
}

// ── lag rows don't count as "things to check" ──────────────────────────────
// 2026-08-30, the strip's first real render: Lincoln's headline said "7 things to
// check — skipped numbers, lessons booked twice, out of order" while nNow was 0 and
// all 7 rows were plan-backed insert-only lag (stored cells behind the plan, which
// is permanent and harmless since Stage 2). The count excludes those rows now; the
// rows themselves stay listed. A plan-backed row a rebuild would DELETE still counts.
console.log("\nplan-backed lag rows and the headline count");
{
  global.planBacked = function(){ return true; };
  api.set(grid(["L1","L2"], { subj: { lessonSeq: ["L1","L2","L3","L4"] } }));
  let h = api.render("kid", "#333");
  ok("insert-only lag does not count", h.indexOf("looks clean") > 0);
  ok("headline no longer blames the card list", h.indexOf("disagrees with the grid") < 0);
  api.toggle();
  h = api.render("kid", "#333");
  api.toggle();
  ok("the row is still listed when opened", h.indexOf("A rebuild would <b>insert</b>") > 0);
  ok("under the calm title", h.indexOf("Stored cells behind the plan") > 0);
  ok("not the alarming one", h.indexOf("out of step") < 0);
  api.set(grid(["L1","L2","L3","L4"], { subj: { lessonSeq: ["L1","L2","L3"] } }));
  h = api.render("kid", "#333");
  ok("a plan-backed row a rebuild would DELETE still counts", h.indexOf("1 thing to check") > 0);
  api.toggle();
  h = api.render("kid", "#333");
  api.toggle();
  ok("and keeps the alarming title", h.indexOf("out of step") > 0);
  delete global.planBacked;
  api.set(grid(["L1","L2"], { subj: { lessonSeq: ["L1","L2","L3","L4"] } }));
  h = api.render("kid", "#333");
  ok("legacy rows count exactly as before", h.indexOf("1 thing to check") > 0);
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
