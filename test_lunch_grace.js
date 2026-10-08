/*
 * Node tests for LUNCHGRACE — a card that can't finish before lunch moves after lunch (her rule 2026-10-08).
 *
 * Live 10/6: Lucy's 20-minute Reading Eggs sat 12:54–1:14 across her 1:00 lunch — the card in hand slides so it
 * ends at now, and it was stepped over lunch only when its START was inside lunch. Her rule: a card that can't
 * finish before lunch moves after lunch; the card being worked on gets ~5 minutes of grace (it may run up to
 * 5 min into lunch and stay there to be checked off), then it bumps to after lunch.
 *
 *   run:  node test_lunch_grace.js
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const a = src.indexOf("// MOMLOOP_START"), b = src.indexOf("// MOMLOOP_END");
if (a < 0 || b < 0) { console.error("MOMLOOP markers not found"); process.exit(1); }
const BLOCK = src.slice(a, b);
function slice(name) {
  const i = src.indexOf("function " + name);
  if (i < 0) { console.error(name + " not found"); process.exit(1); }
  return src.slice(i, src.indexOf("\n}", i) + 2);
}
const HELPERS = slice("toMin") + "\n" + slice("fromMin");

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log("  ok  - " + name); }
  else { fail++; console.log("  FAIL- " + name + (extra !== undefined ? "  (" + JSON.stringify(extra) + ")" : "")); }
}
let ID = 0;
function card(who, time, dur, mom, title) {
  return { id: who + "_" + (ID++), who, day: "thursday", mom: mom || "none", time, dur: dur || 20, title: title || (who + " card") };
}
function run(o) {
  const tasks = o.tasks;
  const ctx = {
    console, ROSTER: ["julian", "lucy", "lincoln", "ellis"], db: null,
    checked: o.checked || {}, momMoves: {},
    getActiveTasks: () => tasks, morningComplete: () => true, bbActive: () => null,
    momHere: () => true, adminPinUnlocked: true, renderAll: () => {},
    cap: s => String(s || "").charAt(0).toUpperCase() + String(s || "").slice(1),
    esc: s => String(s == null ? "" : s),
    Object, Array, String, Number, parseInt, isNaN, Math, JSON, Date, RegExp,
  };
  ctx._mlNowOverride = o.nowMin;
  ctx._mlLunchOverride = [13 * 60, 14 * 60];   // lunch 1:00–2:00 PM
  Object.defineProperty(ctx, "_todayDay", { get: () => "thursday" });
  vm.createContext(ctx);
  vm.runInContext(HELPERS, ctx); vm.runInContext(BLOCK, ctx);
  vm.runInContext("momLoop={cursor:0};", ctx);
  const laid = vm.runInContext("mlQueueLay(" + JSON.stringify(tasks) + ")", ctx);
  return id => laid.find(t => t.id === id).time;
}
const H = (h, m) => h * 60 + m;

// Each case runs twice: Lucy on her own, and Lucy with Mom work in the ring (a different lay path).
for (const withMom of [false, true]) {
  const tag = withMom ? " [Mom work in the ring]" : "";
  const mk = () => withMom ? [card("lucy", "2:40 PM", 15, "required", "Lucy Mom lesson")] : [];
  console.log("\n── the card in hand" + tag + " ──");
  {
    const done = card("lucy", "12:30 PM", 20, "none", "done"), re = card("lucy", "12:50 PM", 20, "none", "Reading Eggs");
    const at = run({ tasks: [done, re].concat(mk()), nowMin: H(12, 50), checked: { [done.id]: "12:50 PM Oct 8" } });
    ok("20 min from 12:50 can't finish by 1:00 (+5) → after lunch (2:00 PM)", at(re.id) === "2:00 PM", at(re.id));
  }
  {
    const done = card("lucy", "12:20 PM", 20, "none", "done"), re = card("lucy", "12:40 PM", 20, "none", "Reading Eggs");
    const at = run({ tasks: [done, re].concat(mk()), nowMin: H(12, 55), checked: { [done.id]: "12:40 PM Oct 8" } });
    ok("12:40–1:00 fits → stays at 12:40 PM", at(re.id) === "12:40 PM", at(re.id));
    const at2 = run({ tasks: [done, re].concat(mk()), nowMin: H(13, 4), checked: { [done.id]: "12:40 PM Oct 8" } });
    ok("still on it at 1:04 → grace: stays to be checked off (12:44 PM, ends 1:04)", at2(re.id) === "12:44 PM", at2(re.id));
    const at3 = run({ tasks: [done, re].concat(mk()), nowMin: H(13, 5), checked: { [done.id]: "12:40 PM Oct 8" } });
    ok("at 1:05 → still inside the 5-minute grace (12:45 PM)", at3(re.id) === "12:45 PM", at3(re.id));
    const at4 = run({ tasks: [done, re].concat(mk()), nowMin: H(13, 6), checked: { [done.id]: "12:40 PM Oct 8" } });
    ok("at 1:06 → grace over: bumps to after lunch (2:00 PM)", at4(re.id) === "2:00 PM", at4(re.id));
  }
  // (With Mom work waiting, the loop lays her lesson right after the card in hand, so the card behind moves for that
  // reason first — the solo run is the lunch check.)
  if (!withMom) { console.log("\n── a card behind the one in hand ──");
  {
    const ih = card("lucy", "12:30 PM", 10, "none", "Daily Drill"), re = card("lucy", "12:40 PM", 20, "none", "Reading Eggs");
    const at = run({ tasks: [ih, re].concat(mk()), nowMin: H(12, 35) });
    ok("12:40–1:00 fits → stays at 12:40 PM", at(re.id) === "12:40 PM", at(re.id));
    const ih2 = card("lucy", "12:40 PM", 10, "none", "Daily Drill"), re2 = card("lucy", "12:50 PM", 20, "none", "Reading Eggs");
    const at2 = run({ tasks: [ih2, re2].concat(mk()), nowMin: H(12, 40) });
    ok("12:50 + 20 min can't finish → after lunch (no grace when not started)", at2(re2.id) === "2:00 PM", at2(re2.id));
  }
}
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
