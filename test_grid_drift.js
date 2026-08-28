/*
 * Node tests for gvPlanDrift — Stage 1 of "one truth" (Grid vs plan).
 *
 * curriculum/lessons stores a lesson TEXT against a date; a rebuild writes it once and
 * nothing updates it again, while the plan (lessonSeq + curriculum/done) advances at the
 * kid's real pace. Nothing compared them, so the Grid can name a lesson that isn't next —
 * 2026-08-28: 23 of 24 plan-backed columns disagreed, from +5 (Ellis Reading Detective)
 * to -2 (Lincoln Singapore, where he was AHEAD of the calendar).
 *
 * gvPlanDrift is pure and read-only. These cover the arithmetic, the sign, the fallbacks,
 * and a replay against a snapshot of the real 2026-08-28 curriculum.
 *
 *   run:  node test_grid_drift.js
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
const body = ["lidsFor", "lidStamped", "lidDoneSet", "planBacked", "gvPlanDrift"].map(extractFn).join("\n");
const norm = src.match(/^const _lidNorm=.*$/m);
const filled = src.match(/^const gvFilled=.*$/m);
if (!norm || !filled) throw new Error("_lidNorm / gvFilled not found");

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log("  ok  - " + name); }
  else { fail++; console.log("  FAIL- " + name + (extra !== undefined ? "  (" + JSON.stringify(extra) + ")" : "")); }
}

function drift(currData, today, kid, sk) {
  const ctx = { currData: currData, cbTodayISO: () => today, console: console };
  vm.createContext(ctx);
  vm.runInContext(norm[0] + "\n" + filled[0] + "\n" + body +
    "\nvar __r=gvPlanDrift(" + JSON.stringify(kid) + "," + JSON.stringify(sk) + ");", ctx);
  return ctx.__r;
}

// A minimal world: 10 lessons, `doneN` of them finished, grid cell for today = seq[gridIdx].
function world(doneN, gridIdx, opts) {
  opts = opts || {};
  const seq = [], ids = [], done = {};
  for (let i = 1; i <= 10; i++) { ids.push("L" + String(i).padStart(4, "0")); seq.push("pg " + i); }
  for (let i = 0; i < doneN; i++) done[ids[i]] = { ts: "x", src: "check" };
  const rows = [];
  for (let i = 0; i < 10; i++) rows.push({ date: "2026-08-2" + i, week: "W" });
  if (gridIdx !== null) rows[8]["mr"] = seq[gridIdx];          // 2026-08-28 = "today"
  if (opts.futureOnly) { delete rows[8]["mr"]; rows[9]["mr"] = seq[gridIdx]; }
  if (opts.rawCell !== undefined) { rows[8]["mr"] = opts.rawCell; }
  const s = { display: "MR", lessonSeq: seq, lessonIds: ids, doneImportedAt: "2026-08-01", planId: "lincoln__mr" };
  Object.assign(s, opts.subject || {});
  return { subjects: { lincoln: { mr: s } }, done: { lincoln: { mr: done } }, lessons: { lincoln: rows } };
}
const T = "2026-08-28";

console.log("\n── the arithmetic ──");
ok("aligned column returns null", drift(world(4, 4), T, "lincoln", "mr") === null);
{
  const d = drift(world(4, 6), T, "lincoln", "mr");
  ok("grid two lessons AHEAD reads +2", d && d.delta === 2, d);
  ok("it reports what the grid says", d && d.gridText === "pg 7", d);
  ok("it reports what is really next", d && d.planText === "pg 5" && d.planLid === "L0005", d);
  ok("it knows the cell is on today", d && d.onToday === true, d);
}
{
  const d = drift(world(6, 4), T, "lincoln", "mr");
  ok("grid two lessons BEHIND reads -2", d && d.delta === -2, d);
  ok("really-next is still the kid's position", d && d.planText === "pg 7", d);
}
ok("+5 drift reads +5", (drift(world(0, 5), T, "lincoln", "mr") || {}).delta === 5);

console.log("\n── fallbacks and guards ──");
{
  const d = drift(world(4, 6, { futureOnly: true }), T, "lincoln", "mr");
  ok("no cell today → falls back to the next dated cell", d && d.delta === 2, d);
  ok("and flags that it is not today's cell", d && d.onToday === false, d);
}
ok("nothing left to do → null", drift(world(10, 4), T, "lincoln", "mr") === null);
ok("cell text not in the list → null (never guesses)",
  drift(world(4, 4, { rawCell: "some lesson that isn't in the book" }), T, "lincoln", "mr") === null);
ok("empty cell text is ignored", drift(world(4, 4, { rawCell: "—" }), T, "lincoln", "mr") === null);
ok("not plan-backed (no planId) → null",
  drift(world(4, 6, { subject: { planId: null } }), T, "lincoln", "mr") === null);
ok("not stamped (no doneImportedAt) → null",
  drift(world(4, 6, { subject: { doneImportedAt: null } }), T, "lincoln", "mr") === null);
ok("unknown subject → null", drift(world(4, 6), T, "lincoln", "nope") === null);
{
  // A repeated text resolves to the occurrence at or after the kid's position, so a
  // sequence that legitimately repeats a lesson can't read as drift.
  const w = world(4, null);
  w.subjects.lincoln.mr.lessonSeq[7] = "pg 5";
  w.lessons.lincoln[8]["mr"] = "pg 5";
  const d = drift(w, T, "lincoln", "mr");
  ok("repeated text prefers the occurrence at/after the kid's position", d === null, d);
}

console.log("\n── replay against the real 2026-08-28 curriculum ──");
const SNAP = path.join(__dirname, "test_fixture_griddrift_2026-08-28.json");
if (!fs.existsSync(SNAP)) {
  console.log("  (skipped — snapshot " + path.basename(SNAP) + " not present)");
} else {
  const snap = JSON.parse(fs.readFileSync(SNAP, "utf8"));
  // Measured independently in Python straight off the live database, before this code existed.
  const EXPECT = {
    "ellis|daily_geo": 3, "ellis|daily_sci": 3, "ellis|editor_chief": 4, "ellis|eggspress_e": null,
    "ellis|hwt": 2, "ellis|lang_smarts": 3, "ellis|math_reason": 2, "ellis|read_detect": 5,
    "ellis|singapore_e": 1, "ellis|word_roots": 4,
    "lincoln|aas": 4, "lincoln|conventions": 4, "lincoln|dictation": 4, "lincoln|eggspress_l": 1,
    "lincoln|mr_pages": 1, "lincoln|singapore_l": -2, "lincoln|wordsmith": 4, "lincoln|written_expr": 1,
    "lucy|dimensions_math_1a": 3, "lucy|hwt": 4, "lucy|loe": 2,
    // mathseeds is 1, not 2: her list carries "Lesson 68" TWICE (indexes 5 and 6). The
    // first is done and she is sitting on the second, so her position is 6 and the grid's
    // "Lesson 69" at index 7 is one ahead. A text-matching measure reads index 5 and says
    // 2 — which is exactly why gvPlanDrift takes the position from the done set, never
    // from the text. (The duplicate itself looks like a list error worth her attention.)
    "lucy|mathseeds": 1,
    "lucy|nzk_l": 1, "lucy|read_eggs": 1
  };
  let drifted = 0;
  Object.keys(EXPECT).forEach(key => {
    const [kid, sk] = key.split("|");
    const d = drift(snap, T, kid, sk);
    const got = d ? d.delta : null;
    if (got !== null) drifted++;
    ok(key + " reads " + (EXPECT[key] === null ? "aligned" : EXPECT[key]), got === EXPECT[key], { got: got, want: EXPECT[key] });
  });
  ok("23 of 24 columns drifted", drifted === 23, drifted);
  const rd = drift(snap, T, "ellis", "read_detect");
  ok("worst case names both lessons", rd && rd.gridText === "Ex. 49–50" && rd.planText === "Ex. 39–40", rd);
  const sl = drift(snap, T, "lincoln", "singapore_l");
  ok("the BEHIND column reports a negative delta", sl && sl.delta < 0, sl);
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
