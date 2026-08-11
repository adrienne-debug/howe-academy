/*
 * Node tests for rebuild hygiene (Keep/Dismiss) — cbSplitCells + cbDeriveContent.
 *
 * Extracts the REAL pure helpers out of index.html via the CBGEN markers and
 * asserts: backlog/today/future split vs the completed count, move-not-copy
 * content (backlog exactly once), removal of duplicate copies earlier buggy
 * rebuilds left in the map, master-list self-heal (restores lost lessons),
 * dismissals, folded task-level skip credit, today's-cell handling, and that
 * legitimately repeating generic lessons (e.g. "Free choice") are untouched.
 *
 *   run:  node test_rebuild.js
 */
const fs = require("fs");
const path = require("path");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");

const a = src.indexOf("// CBGEN_START");
const b = src.indexOf("// CBGEN_END");
if (a < 0 || b < 0) { console.error("CBGEN markers not found"); process.exit(1); }
const block = src.slice(a, b);
const { cbSplitCells, cbDeriveContent, cbMaterialize } =
  new Function(block + "; return {cbSplitCells:cbSplitCells,cbDeriveContent:cbDeriveContent,cbMaterialize:cbMaterialize};")();

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log("  ok  - " + name); }
  else { fail++; console.log("  FAIL- " + name + (extra ? "  (" + JSON.stringify(extra) + ")" : "")); }
}
const J = JSON.stringify;

// cell factory: [dayNum, date, text]
const C = (dn, date, text) => ({ dayNum: dn, date, text });
const TODAY = "2026-07-20";

console.log("cbSplitCells");
{
  // 2 completed, 2 stale (past unfinished), 1 today, 2 future
  const cells = [
    C(1, "2026-07-13", "L1"), C(2, "2026-07-14", "L2"),
    C(3, "2026-07-15", "L3"), C(4, "2026-07-17", "L4"),
    C(5, "2026-07-20", "L5"),
    C(6, "2026-07-21", "L6"), C(7, "2026-07-22", "L7")
  ];
  const s = cbSplitCells(cells, 2, TODAY);
  // 2026-08-11: an unchecked today-cell is backlog now, not pinned — the pin meant a
  // rebuild could never replace today's content after a card fix (Ellis Math Reasoning
  // kept a phantom "Pg 247–250" through every relay).
  ok("completed prefix excluded", J(s.stale.map(c => c.text)) === '["L3","L4","L5"]', s.stale);
  ok("today joins the backlog, todayCells empty", s.todayCells.length === 0);
  ok("future split", J(s.future.map(c => c.text)) === '["L6","L7"]');
}
{
  // doneN beyond the past region: a completed cell can sit on a future date (checked early)
  const cells = [C(1, "2026-07-13", "A"), C(2, "2026-07-21", "B"), C(3, "2026-07-22", "C")];
  const s = cbSplitCells(cells, 2, TODAY);
  ok("doneN covers future-dated cells too", s.stale.length === 0 && J(s.future.map(c => c.text)) === '["C"]');
}
{
  const s = cbSplitCells([], 0, TODAY);
  ok("empty cells → empty split", s.stale.length === 0 && s.future.length === 0 && s.todayCells.length === 0);
}

console.log("grid-only derive — move, not copy (the read_detect pattern)");
{
  // Real-world shape: backlog trio was copied forward in cycles by old rebuilds.
  const split = cbSplitCells([
    C(1, "2026-07-13", "Ex. 33–34"), C(2, "2026-07-15", "Ex. 35–36"), C(3, "2026-07-17", "Ex. 37–38"),
    C(4, "2026-07-21", "Ex. 33–34"), C(5, "2026-07-22", "Ex. 35–36"), C(6, "2026-07-27", "Ex. 37–38"),
    C(7, "2026-07-29", "Ex. 33–34"), C(8, "2026-07-30", "Ex. 39–40"), C(9, "2026-08-03", "Posttest")
  ], 0, TODAY);
  const out = cbDeriveContent(split, null, 0, []);
  ok("backlog once + copies dropped", J(out) === '["Ex. 33–34","Ex. 35–36","Ex. 37–38","Ex. 39–40","Posttest"]', out);
}
{
  // No backlog → future untouched, even with legit repeats (ind_read "Free choice")
  const split = cbSplitCells([
    C(1, "2026-07-21", "Free choice"), C(2, "2026-07-22", "Free choice"), C(3, "2026-07-27", "Free choice")
  ], 0, TODAY);
  const out = cbDeriveContent(split, null, 0, []);
  ok("legit generic repeats survive", J(out) === '["Free choice","Free choice","Free choice"]', out);
}
{
  // Generic title in backlog does NOT nuke unrelated future generics of DIFFERENT title
  const split = cbSplitCells([
    C(1, "2026-07-15", "Review"),
    C(2, "2026-07-21", "L10"), C(3, "2026-07-22", "Review"), C(4, "2026-07-27", "L11")
  ], 0, TODAY);
  const out = cbDeriveContent(split, null, 0, []);
  ok("backlog-title future copy removed (visible in sheet count)", J(out) === '["Review","L10","L11"]', out);
}

console.log("grid-only derive — dismissals");
{
  const split = cbSplitCells([
    C(1, "2026-07-15", "6c"), C(2, "2026-07-16", "6d"), C(3, "2026-07-17", "6e"),
    C(4, "2026-07-21", "7a"), C(5, "2026-07-22", "7b")
  ], 0, TODAY);
  ok("dismiss middle lesson", J(cbDeriveContent(split, null, 0, [1])) === '["6c","6e","7a","7b"]');
  ok("dismiss all backlog", J(cbDeriveContent(split, null, 0, [0, 1, 2])) === '["7a","7b"]');
}
{
  // Folded task-level skip credit (kumon: adjust=2 → first 2 pre-dismissed by caller)
  const split = cbSplitCells([
    C(1, "2026-07-15", "Ex.30"), C(2, "2026-07-16", "Ex.31"), C(3, "2026-07-17", "Ex.32"),
    C(4, "2026-07-21", "Ex.33")
  ], 0, TODAY);
  const out = cbDeriveContent(split, null, 0, [0, 1]);
  ok("pre-dismissed skip credit drops the dropped lessons", J(out) === '["Ex.32","Ex.33"]', out);
}

console.log("grid-only derive — today's cell");
{
  // Today's cell duplicates a backlog lesson (a pollution copy landed on today):
  // that is the ONE case a today-cell still stays pinned (2026-08-11) — it IS the
  // backlog lesson being served today, and the kept backlog drops one occurrence
  // so it isn't laid a second time. A today-cell with UNIQUE text joins the
  // backlog instead (see the split + master-list tests).
  const split = cbSplitCells([
    C(1, "2026-07-15", "Map 19 L3"), C(2, "2026-07-17", "Map 19 L4"),
    C(3, "2026-07-20", "Map 19 L3"),
    C(4, "2026-07-22", "Map 19 L4"), C(5, "2026-07-27", "Map 19 L5")
  ], 0, TODAY);
  ok("duplicate-of-backlog today-cell stays pinned", J(split.todayCells.map(c => c.text)) === '["Map 19 L3"]', split.todayCells);
  const out = cbDeriveContent(split, null, 0, []);
  ok("today's lesson not re-laid", J(out) === '["Map 19 L4","Map 19 L5"]', out);
}

console.log("master-list derive — self-heal (the singapore pattern)");
{
  // Grid lost Ch.2 L1–L3 and holds Review×4; the master list restores everything.
  const seq = ["L1", "L2", "L3", "L4", "Ch.1 Review", "Ch.2 L1", "Ch.2 L2", "Ch.2 L3", "Ch.2 Review", "Ch.3 L1"];
  const split = cbSplitCells([
    C(1, "2026-07-13", "L1"), C(2, "2026-07-14", "L2"), C(3, "2026-07-15", "L3"), C(4, "2026-07-16", "L4"),
    C(5, "2026-07-17", "Ch.1 Review"),
    C(6, "2026-07-21", "Ch.1 Review"), C(7, "2026-07-22", "Ch.1 Review"),
    C(8, "2026-07-27", "Ch.1 Review"), C(9, "2026-07-28", "Ch.2 Review"), C(10, "2026-07-29", "Ch.3 L1")
  ], 4, TODAY);
  const out = cbDeriveContent(split, seq, 4, []);
  ok("lost lessons restored, dupes gone", J(out) === '["Ch.1 Review","Ch.2 L1","Ch.2 L2","Ch.2 L3","Ch.2 Review","Ch.3 L1"]', out);
  const out2 = cbDeriveContent(split, seq, 4, [0]);
  ok("master-list dismiss drops the lesson", J(out2) === '["Ch.2 L1","Ch.2 L2","Ch.2 L3","Ch.2 Review","Ch.3 L1"]', out2);
}
{
  // Master list + today's cell: 2026-08-11 — today's unchecked lesson is backlog, so it
  // stays IN the remaining lay (its cell gets cleared by the rebuild and B is re-laid)
  // instead of being pinned on today and dropped from the relay.
  const seq = ["A", "B", "C", "D"];
  const split = cbSplitCells([C(1, "2026-07-13", "A"), C(2, "2026-07-20", "B")], 1, TODAY);
  const out = cbDeriveContent(split, seq, 1, []);
  ok("today's unchecked lesson stays in the relay", J(out) === '["B","C","D"]', out);
}
{
  // doneN at/past the end of the master list
  const out = cbDeriveContent(cbSplitCells([], 5, TODAY), ["A", "B"], 5, []);
  ok("doneN past master end → nothing left", out.length === 0);
}

console.log("integration — derived content lays clean through cbMaterialize");
{
  // Mon 2026-08-03 week rows; content from the read_detect-style repair
  const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const rows = [];
  const d = new Date("2026-08-03T12:00:00");
  for (let i = 0, dn = 1; i < 10; i++) {
    if (d.getDay() !== 0 && d.getDay() !== 6) {
      const ds = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
      rows.push({ dayNum: dn++, date: ds, week: "Wk 1", dow: DOW[d.getDay()], off: false, usedMin: 0, hadMine: i % 2 === 0 });
    }
    d.setDate(d.getDate() + 1);
  }
  const split = cbSplitCells([
    C(90, "2026-07-15", "U1"), C(91, "2026-07-17", "U2"),
    C(92, "2026-08-04", "U1"), C(93, "2026-08-05", "U2"), C(94, "2026-08-06", "U3")
  ], 0, "2026-08-03");
  const content = cbDeriveContent(split, null, 0, []);
  const res = cbMaterialize({ sk: "x", minutes: 20, mode: "timesPerWeek", tpw: 5, allowedDays: [], content, rows, dayCapMin: 0 });
  ok("each lesson placed exactly once", J(res.assignments.map(x => x.text)) === '["U1","U2","U3"]', res.assignments.map(x => x.text));
}

console.log("");
console.log(pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
