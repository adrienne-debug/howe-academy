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
`;
const api = new Function(prelude + block +
  "; return {find:gvAuditFindings, render:gvAuditRender, toggle:gvAuditToggle, set:function(d){currData=d;}};")();

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

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
