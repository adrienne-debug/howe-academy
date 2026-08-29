/*
 * Node tests for the drill clock's two interruption guards (her design, 2026-08-29):
 *
 *   PAUSE            — an interruption you catch in the moment. Stops the clock.
 *   "we were interrupted" — one you only notice afterwards. By definition you realise AFTER,
 *                      so it marks a FINISHED session rather than the live drill; the scores
 *                      stay and only the timing is disowned.
 *
 * Both feed retrSlotMinutes, which now reserves a drill's real measured length.
 *
 *   run:  node test_drill_clock.js
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

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log("  ok  - " + name); }
  else { fail++; console.log("  FAIL- " + name + (extra !== undefined ? "  (" + JSON.stringify(extra) + ")" : "")); }
}

// ── pause: run the real mastLogPause against a controllable clock ──────────
const T0 = 1700000000000;   // a real epoch — mastLogStartTs is Date.now(), never 0 (and 0 is falsy)
function clockWorld(now) {
  const ctx = { console, Math, _mastRe() {}, mastPersistLog() {},
    mastLogStartTs: null, mastLogPausedMs: 0, mastLogPauseAt: null,
    Date: { now: () => ctx._now } };
  ctx._now = T0 + (now || 0);
  vm.createContext(ctx);
  vm.runInContext(extractFn("mastLogPause"), ctx);
  ctx.at = t => { ctx._now = T0 + t; };   // t = ms since the drill started
  // the elapsed expression as written in mastSaveResults
  ctx.elapsed = () => {
    const paused = ctx.mastLogPausedMs + (ctx.mastLogPauseAt ? (ctx._now - ctx.mastLogPauseAt) : 0);
    return ctx.mastLogStartTs ? Math.max(1, Math.round(Math.max(0, (ctx._now - ctx.mastLogStartTs) - paused) / 1000)) : null;
  };
  return ctx;
}

console.log("\n── pause ──");
{
  const w = clockWorld(0);
  w.mastLogPause();
  ok("pause does nothing before the first score tap", w.mastLogPauseAt === null && w.mastLogPausedMs === 0);
}
{
  const w = clockWorld(0);
  w.mastLogStartTs = T0;
  w.at(60000); w.mastLogPause();                      // pause at 1:00
  ok("pausing records when it started", w.mastLogPauseAt === T0 + 60000, w.mastLogPauseAt);
  w.at(180000); w.mastLogPause();                     // resume at 3:00 → 2 min paused
  ok("resuming banks the paused time", w.mastLogPausedMs === 120000 && w.mastLogPauseAt === null, [w.mastLogPausedMs, w.mastLogPauseAt]);
  w.at(240000);                                       // save at 4:00
  ok("elapsed excludes the pause — 4 min wall, 2 paused → 120s", w.elapsed() === 120, w.elapsed());
}
{
  const w = clockWorld(0);
  w.mastLogStartTs = T0; w.at(60000); w.mastLogPause(); w.at(300000);
  ok("saving WHILE paused still discounts the open pause", w.elapsed() === 60, w.elapsed());
}
{
  const w = clockWorld(0);
  w.mastLogStartTs = T0;
  w.at(30000); w.mastLogPause(); w.at(60000); w.mastLogPause();
  w.at(90000); w.mastLogPause(); w.at(150000); w.mastLogPause();
  w.at(180000);
  ok("several pauses accumulate (3 min wall, 90s paused → 90s)", w.elapsed() === 90, w.elapsed());
}
{
  const w = clockWorld(0);
  w.mastLogStartTs = T0; w.at(10000); w.mastLogPause(); w.at(999999); w.mastLogPause(); w.at(999999);
  ok("a pause longer than the session never yields a negative time", w.elapsed() >= 1, w.elapsed());
}

// ── "we were interrupted" on a finished session ───────────────────────────
console.log("\n── interrupted mark ──");
function badWorld(entry) {
  const writes = {};
  const ctx = { console, Object, JSON,
    masteryKid: "lincoln",
    masteryData: { history: { lincoln: { "20260829": entry } } },
    HA_LS: { setItem() {} },
    _mastRe() {},
    db: { ref: p => ({ set: v => { writes[p] = v; } }) },
    writes };
  vm.createContext(ctx);
  vm.runInContext(extractFn("mastToggleBad"), ctx);
  return ctx;
}
{
  const w = badWorld({ secs: 300, items: [{ id: 1 }] });
  w.mastToggleBad("20260829");
  const e = w.masteryData.history.lincoln["20260829"];
  ok("marking sets bad", e.bad === true);
  ok("it writes only that session's flag", w.writes["mastery/history/lincoln/20260829/bad"] === true, w.writes);
  ok("the scores are untouched — only the timing is disowned", e.secs === 300 && e.items.length === 1);
  w.mastToggleBad("20260829");
  ok("tapping again clears it", !("bad" in w.masteryData.history.lincoln["20260829"]));
  ok("and clears it in the database (null, not false)", w.writes["mastery/history/lincoln/20260829/bad"] === null);
}
{
  const w = badWorld({ secs: 300, items: [{ id: 1 }] });
  w.mastToggleBad("19990101");
  ok("an unknown session is ignored, not created", Object.keys(w.writes).length === 0 &&
    !w.masteryData.history.lincoln["19990101"]);
}

// ── the two are wired into the UI ─────────────────────────────────────────
console.log("\n── wiring ──");
{
  ok("the pause button only shows once the clock is running", /if\(mastLogStartTs\)\{[\s\S]{0,200}?mastLogPause\(\)/.test(src));
  ok("a paused drill says so on screen", /Paused — the clock is stopped/.test(src));
  ok("the ⏱ chip on a finished session is the interrupted toggle", /mastToggleBad\(\\'/.test(src));
  ok("pause survives a reload", /pausedMs:mastLogPausedMs,pauseAt:mastLogPauseAt/.test(src) &&
    /mastLogPausedMs=s\.pausedMs\|\|0/.test(src));
  ok("starting a log clears any previous pause", /mastStartLog\(\)\{[\s\S]{0,200}?mastLogPausedMs=0; mastLogPauseAt=null;/.test(src));
  ok("the saved duration subtracts paused time", /-_pausedMs\)\/1000/.test(src));
  ok("mastDrillSamples skips a session marked bad", /if\(!d\|\|d\.bad\) return;/.test(src));
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
