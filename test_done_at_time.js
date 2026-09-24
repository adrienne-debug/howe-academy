/*
 * ✓ A finished card shows at the time it was really finished (her report 2026-09-23:
 * "it showed 2:48 and went to 10:05 when clicked"). The rendered day re-lays OPEN cards from now,
 * but a checked card fell back to its stored slot, so checking it made it jump up to 10:05.
 *   run:  node test_done_at_time.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const a = src.indexOf("// DONEAT_START"), b = src.indexOf("// DONEAT_END");
if (a < 0 || b < 0) { console.error("DONEAT markers not found"); process.exit(1); }
const pa = src.indexOf("function _parseCheckTs(ts){"), pb = src.indexOf("\n}", pa) + 2;
const BLOCK = src.slice(a, b) + "\n" + src.slice(pa, pb);
let pass = 0, fail = 0;
function ok(n, c, x) { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x) + ")" : "")); } }
const fromMin = m => { let h = Math.floor(m / 60), mm = m % 60; const ap = h >= 12 ? "PM" : "AM"; h = h % 12 || 12; return h + ":" + String(mm).padStart(2, "0") + " " + ap; };
function run(tasks, checked) {
  const ctx = { checked, DAY_DT: { wednesday: "September 23", tuesday: "September 22" }, effectiveDay: t => t.day, fromMin, Date, Object, String, parseInt, isNaN, Array };
  vm.createContext(ctx); vm.runInContext(BLOCK, ctx);
  ctx.list = tasks; return vm.runInContext("dsDoneAtTime(list)", ctx);
}
console.log("── the live case: Lucy's Dimensions Math ──");
{
  const tasks = [
    { id: "nb", who: "lucy", day: "wednesday", time: "10:00 AM" },
    { id: "dm", who: "lucy", day: "wednesday", time: "10:05 AM" },
    { id: "hwt", who: "lucy", day: "wednesday", time: "2:55 PM" },   // open, re-laid from now
  ];
  const out = run(tasks, { nb: "02:35 PM Sep 23", dm: "02:48 PM Sep 23" });
  ok("Morning Notebook shows 2:35 PM (was 10:00)", out[0].time === "2:35 PM", out[0].time);
  ok("Dimensions Math shows 2:48 PM (was jumping back to 10:05)", out[1].time === "2:48 PM", out[1].time);
  ok("the open card is untouched", out[2] === tasks[2]);
  ok("stored tasks are never changed (display copies only)", tasks[0].time === "10:00 AM" && tasks[1].time === "10:05 AM");
  const order = out.slice().sort((x, y) => new Date("2000/1/1 " + x.time) - new Date("2000/1/1 " + y.time)).map(t => t.id);
  ok("done work reads on top in the order it was done, then what's left", JSON.stringify(order) === JSON.stringify(["nb", "dm", "hwt"]), order);
}
{
  const t = { id: "x", who: "ellis", day: "wednesday", time: "9:40 AM" };
  const out = run([t], { x: "09:40 AM Sep 23" });
  ok("a card finished right on time is returned as-is", out[0] === t);
}
{
  const t = { id: "y", who: "ellis", day: "wednesday", time: "10:00 AM" };
  const out = run([t], { y: "07:10 PM Sep 22" });   // worked ahead the night before — its day is Wednesday's list
  ok("finished on a different day than it shows → left alone", out[0] === t);
}
{
  const t = { id: "z", who: "ellis", day: "wednesday", time: "10:00 AM" };
  ok("an unreadable time stamp → left alone", run([t], { z: "done" })[0] === t);
}
console.log("\n── the wiring ──");
ok("the schedule view uses it", /const activeTasks=dsDoneAtTime\(mlQueueLay\(dsRetime\(/.test(src));
ok("Kids' Corner uses it", /const laid=dsDoneAtTime\(mlQueueLay\(dsRetime\(srcTasks\)\)\);/.test(src));
ok("no 🌿 Break notes between finished cards", /if\(_singleKid&&!_slotDone&&_prevEnd>0/.test(src) && /if\(!_slotDone\) _prevEnd=Math\.max/.test(src));

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
