/*
 * Node tests for the ⏱ DAY TIME READOUT (minutes-done + real school-day span).
 *
 * Extracts the REAL functions out of index.html (DAY TIME READOUT → paceToastTimer)
 * and asserts: expected-minutes math, the morning-checklist → last-check-off span,
 * the "First task" fallback when morning never completed, cross-date stamp rejection,
 * exclusion of lunch/_c/overflow, and multi-kid rows in roster order.
 *
 *   run:  node test_daytime.js
 */
const fs = require("fs");
const path = require("path");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");

const a = src.indexOf("// ── DAY TIME READOUT ");
const b = src.indexOf("\nlet paceToastTimer=null;");
if (a < 0 || b < 0) { console.error("DAY TIME READOUT markers not found"); process.exit(1); }
const block = src.slice(a, b);

// Real helpers the readout leans on, pulled from source so the test can't drift from them.
const grab = re => { const m = src.match(re); if (!m) { console.error("helper not found: " + re); process.exit(1); } return m[0]; };
const helpers = grab(/function tsToMin\(ts\)\{[\s\S]*?\n\}/) + "\n" + grab(/function fromMin\(m\)\{[\s\S]*?\n\}/);

// Mutable globals the readout reads (never writes).
let checked = {}, slState = {}, DAY_DT = {}, ROSTER = [];
const harness = `
  ${helpers}
  function cap(s){ s=String(s); return s.charAt(0).toUpperCase()+s.slice(1); }
  function activeWk(){ return "week13"; }
  ${block}
  return { dayTimeReadout, _tsDateKey, _spanFmt,
           setState:(c,s,d,r)=>{ checked=c; slState=s; DAY_DT=d; ROSTER=r; } };
`;
const M = new Function("checked", "slState", "DAY_DT", "ROSTER", harness)
  // eslint-disable-next-line no-unused-vars
  .call(null, checked, slState, DAY_DT, ROSTER);

// The closure captured the initial objects, so mutate them in place rather than reassigning.
const setState = (c, s, d, r) => { M.setState(c, s, d, r); };

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log("  ok  - " + name); }
  else { fail++; console.log("  FAIL- " + name + (extra !== undefined ? "  (" + JSON.stringify(extra) + ")" : "")); }
}

// ── fixtures ─────────────────────────────────────────────────────────────────
const DATES = { monday: "Aug 10", tuesday: "Aug 11" };
const T = (id, who, dur, title) => ({ id, who, dur, title: title || (id + " work") });
const mornKey = (day, kid) => "week13_" + day + "_" + kid + "_morning";

console.log("\n⏱ DAY TIME READOUT\n");

// ── 1. expected minutes done ────────────────────────────────────────────────
(() => {
  const tasks = [T("t1", "lincoln", 20), T("t2", "lincoln", 30), T("t3", "lincoln", 25)];
  setState({ t1: "9:30 AM Aug 10", t2: "10:15 AM Aug 10" }, {}, DATES, ["lincoln"]);
  const h = M.dayTimeReadout(tasks, "monday", "lincoln");
  ok("sums dur over CHECKED tasks only (20+30=50)", /<b>50<\/b> of 75 min done/.test(h), h.slice(0, 200));
  ok("percent of planned load", /· 67%/.test(h));
})();

// ── 2. default duration when a task has none ────────────────────────────────
(() => {
  const tasks = [T("t1", "lincoln", null), T("t2", "lincoln", null)];
  setState({ t1: "9:30 AM Aug 10" }, {}, DATES, ["lincoln"]);
  const h = M.dayTimeReadout(tasks, "monday", "lincoln");
  ok("missing dur falls back to 20 min", /<b>20<\/b> of 40 min done/.test(h));
})();

// ── 3. the span: morning checklist → last schoolwork check-off ──────────────
(() => {
  const tasks = [T("t1", "lincoln", 30), T("t2", "lincoln", 30), T("t3", "lincoln", 30)];
  setState(
    { t1: "10:05 AM Aug 10", t2: "2:47 PM Aug 10", t3: "11:20 AM Aug 10" },
    { [mornKey("monday", "lincoln")]: { done: true, ts: "9:12 AM Aug 10" } },
    DATES, ["lincoln"]);
  const h = M.dayTimeReadout(tasks, "monday", "lincoln");
  ok("start = morning-checklist completion", /<b>9:12 AM<\/b>/.test(h), h.slice(-260));
  ok("end = LATEST check-off, not the last listed", /<b>2:47 PM<\/b>/.test(h));
  ok("span length 9:12→14:47 = 5h 35m", /5h 35m/.test(h));
  ok("labels the start source", /from Morning done/.test(h));
})();

// ── 4. fallback when the morning checklist never completed ──────────────────
(() => {
  const tasks = [T("t1", "lincoln", 30), T("t2", "lincoln", 30)];
  setState({ t1: "10:05 AM Aug 10", t2: "1:05 PM Aug 10" },
    { [mornKey("monday", "lincoln")]: { done: false, ts: "" } }, DATES, ["lincoln"]);
  const h = M.dayTimeReadout(tasks, "monday", "lincoln");
  ok("falls back to first check-off", /<b>10:05 AM<\/b> → <b>1:05 PM<\/b>/.test(h), h.slice(-260));
  ok("says so, rather than implying a morning time", /from First task/.test(h));
})();

// ── 5. morning stamped AFTER work started must not go negative ──────────────
(() => {
  const tasks = [T("t1", "lincoln", 30), T("t2", "lincoln", 30)];
  setState({ t1: "8:00 AM Aug 10", t2: "9:00 AM Aug 10" },
    { [mornKey("monday", "lincoln")]: { done: true, ts: "11:00 AM Aug 10" } }, DATES, ["lincoln"]);
  const h = M.dayTimeReadout(tasks, "monday", "lincoln");
  ok("no negative span — reverts to first task", /<b>8:00 AM<\/b> → <b>9:00 AM<\/b>/.test(h), h.slice(-260));
  ok("span 1h 00m", /1h 00m/.test(h));
})();

// ── 6. a stamp from a DIFFERENT date is not this day's end time ─────────────
(() => {
  const tasks = [T("t1", "lincoln", 30), T("t2", "lincoln", 30)];
  setState({ t1: "10:00 AM Aug 10", t2: "8:30 PM Aug 11" },
    { [mornKey("monday", "lincoln")]: { done: true, ts: "9:00 AM Aug 10" } }, DATES, ["lincoln"]);
  const h = M.dayTimeReadout(tasks, "monday", "lincoln");
  ok("Tuesday's 8:30 PM stamp excluded from Monday's span", !/8:30 PM/.test(h), h.slice(-260));
  ok("end stays Monday's 10:00 AM", /<b>10:00 AM<\/b>/.test(h));
  ok("but its minutes still count as done", /<b>60<\/b> of 60 min done/.test(h));
})();

// ── 7. nothing checked yet ──────────────────────────────────────────────────
(() => {
  const tasks = [T("t1", "lincoln", 30)];
  setState({}, {}, DATES, ["lincoln"]);
  const h = M.dayTimeReadout(tasks, "monday", "lincoln");
  ok("0 of 30 with an em-dash span", /<b>0<\/b> of 30 min done/.test(h) && /—/.test(h), h.slice(-200));
})();

// ── 8. exclusions: lunch, carryover mirrors, end-of-week overflow ───────────
(() => {
  const tasks = [T("t1", "lincoln", 30), T("lunchx", "lincoln", 60, "Lunch"),
    T("t2_c", "lincoln", 30), Object.assign(T("t3", "lincoln", 30), { _eowOverflow: true })];
  setState({ t1: "10:00 AM Aug 10" }, {}, DATES, ["lincoln"]);
  const h = M.dayTimeReadout(tasks, "monday", "lincoln");
  ok("lunch / _c mirror / overflow all excluded from the load", /<b>30<\/b> of 30 min done/.test(h), h.slice(0, 240));
})();

// ── 9. empty day renders nothing ────────────────────────────────────────────
(() => {
  setState({}, {}, DATES, ["lincoln"]);
  ok("no tasks → empty string", M.dayTimeReadout([], "monday", "lincoln") === "");
  ok("only-lunch day → empty string",
    M.dayTimeReadout([T("lx", "lincoln", 60, "Lunch")], "monday", "lincoln") === "");
})();

// ── 10. multi-kid view: one row each, in roster order ───────────────────────
(() => {
  const tasks = [T("a1", "ellis", 20), T("b1", "lincoln", 40), T("b2", "lincoln", 20)];
  setState({ a1: "9:40 AM Aug 10", b1: "11:00 AM Aug 10" }, {}, DATES, ["lincoln", "ellis"]);
  const h = M.dayTimeReadout(tasks, "monday", "all");
  ok("a badge per kid", (h.match(/kid-badge/g) || []).length === 2, h);
  ok("roster order — Lincoln before Ellis", h.indexOf("Lincoln") < h.indexOf("Ellis"));
  ok("per-kid math is independent", /<b>40<\/b> of 60 min done/.test(h) && /<b>20<\/b> of 20 min done/.test(h));
})();

// ── 11. span formatter ──────────────────────────────────────────────────────
(() => {
  ok("_spanFmt under an hour", M._spanFmt(48) === "48m", M._spanFmt(48));
  ok("_spanFmt pads minutes", M._spanFmt(305) === "5h 05m", M._spanFmt(305));
  ok("_spanFmt exact hours", M._spanFmt(120) === "2h 00m", M._spanFmt(120));
  ok("_spanFmt rejects negatives", M._spanFmt(-5) === "");
})();

// ── 12. date-key parsing across both month formats ──────────────────────────
(() => {
  ok("short month from a stamp", M._tsDateKey("10:42 AM Aug 15") === "8-15");
  ok("long month from DAY_DT", M._tsDateKey("August 15") === "8-15");
  ok("garbage → empty", M._tsDateKey("nope") === "");
})();

console.log("\n" + pass + " passed, " + fail + " failed\n");
process.exit(fail ? 1 : 0);
