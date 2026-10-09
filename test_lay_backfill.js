/*
 * 🧩 BACKFILL (her yes 2026-10-09, #3): Ellis's Math Reasoning (25 min) and Reflex (15 min) went to "didn't fit today"
 * while he waited on Mom. The living-day lay laid a kid's own cards strictly one after another and never went back to
 * an earlier open gap — so when a card had to jump lunch (or the kid's Mom block), every card behind it lined up after
 * it, the gap stayed empty, and whatever ended past school end fell off the day.
 *
 * Her rule: a kid's own card may move into an EARLIER open gap that fits it — only a gap that has not passed (never
 * before now / the kid's floor), never into lunch, family time, a class, the kid's Mom block or another card. The card
 * in hand stays the card in hand; Morning Notebook first, Closing Notebook last; cards of the same subject keep their
 * order; Mom-required cards stay where Mom's loop puts them; before school starts the plan's times hold exactly.
 *
 *   run:  node test_lay_backfill.js          (HTML=old.html node test_lay_backfill.js to run against another file)
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const src = fs.readFileSync(process.env.HTML || path.join(__dirname, "index.html"), "utf8");
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
function card(who, time, dur, mom, title, sk, extra) {
  return Object.assign({ id: who + "_" + (ID++), who, day: "thursday", mom: mom || "none", time, dur: dur || 20, title: title || (who + " card"), subjectKey: sk || ("sk" + ID) }, extra || {});
}
const toM = s => { const m = String(s).match(/(\d+):(\d+)\s*(AM|PM)/i); let h = +m[1] % 12; if (/pm/i.test(m[3])) h += 12; return h * 60 + +m[2]; };
function lay(o) {
  const tasks = o.tasks;
  const ctx = {
    console, ROSTER: ["julian", "lucy", "lincoln", "ellis"], db: null,
    checked: o.checked || {}, claimed: {}, momMoves: {},
    getActiveTasks: () => tasks, morningComplete: () => true, bbActive: () => null,
    momHere: () => true, adminPinUnlocked: true, renderAll: () => {},
    cap: s => String(s || "").charAt(0).toUpperCase() + String(s || "").slice(1),
    esc: s => String(s == null ? "" : s),
    rulesData: { schoolDay: { defaultStart: "10:00 AM", defaultEnd: "4:15 PM" } },
    currData: o.currData || {},
    Object, Array, String, Number, parseInt, isNaN, Math, JSON, Date, RegExp,
  };
  ctx._mlNowOverride = o.nowMin;
  ctx._mlLunchOverride = [13 * 60, 14 * 60];
  Object.defineProperty(ctx, "_todayDay", { get: () => "thursday" });
  vm.createContext(ctx);
  vm.runInContext(HELPERS, ctx); vm.runInContext(BLOCK, ctx);
  vm.runInContext("momLoop={cursor:0};", ctx);
  const laid = vm.runInContext("mlQueueLay(" + JSON.stringify(tasks) + ")", ctx);
  const get = id => laid.find(t => t.id === id);
  return { at: id => get(id).time, s: id => toM(get(id).time), off: id => !!get(id)._offDay };
}
const H = (h, m) => h * 60 + m;
const overlapsLunch = (s, d) => s < H(14, 0) && s + d > H(13, 0);

// Ellis's day (shaped like Friday): notebook done, Science in hand to 12:45, then his own cards; Lincoln has Mom
// first (2:00–2:50), so Ellis's Mom work waits until 2:50–3:30.
function ellisDay(opts) {
  opts = opts || {};
  const nb = card("ellis", "10:00 AM", 5, "none", "📖 Morning Notebook", "morning_nb");
  const prev = card("ellis", "10:05 AM", 25, "none", "Dimensions", "dims");
  const sci = card("ellis", "12:30 PM", 15, "maybe", "Daily Science", "daily_sci");
  const ls = card("ellis", "12:45 PM", 25, "maybe", "Language Smarts", "lang_smarts");
  const ir = card("ellis", "2:00 PM", 15, "none", "Independent Reading", "independent_reading");
  const mr = card("ellis", "2:15 PM", 25, "maybe", "Mathematical Reasoning", "mathematical_reasoning");
  const hwt = card("ellis", "2:40 PM", 10, "maybe", "HWT", "hwt");
  const rfx = card("ellis", "2:50 PM", 15, "none", "Reflex Math", "reflex");
  const eic = card("ellis", "3:05 PM", 25, "required", "Editor in Chief", "editor_chief");
  const drill = card("ellis", "3:30 PM", 15, "required", "Daily Drill", "retrieval");
  const cl = card("ellis", "3:45 PM", 5, "none", "📖 Closing Notebook", "closing_nb");
  const l1 = card("lincoln", "2:00 PM", 25, "required", "Lincoln Mom 1", "l1");
  const l2 = card("lincoln", "2:25 PM", 25, "required", "Lincoln Mom 2", "l2");
  const T = { nb, prev, sci, ls, ir, mr, hwt, rfx, eic, drill, cl, l1, l2 };
  const checked = opts.checked || { [nb.id]: "10:05 AM Oct 9", [prev.id]: "12:30 PM Oct 9" };
  return { T, tasks: Object.values(T), checked };
}

console.log("\n── the gap: Ellis's cards wait behind lunch + his Mom block, an earlier gap fits one ──");
{
  const D = ellisDay(), T = D.T;
  const L = lay({ tasks: D.tasks, nowMin: H(12, 35), checked: D.checked });
  ok("Science (in hand) stays 12:30 PM", L.at(T.sci.id) === "12:30 PM", L.at(T.sci.id));
  ok("Independent Reading (15) moves into the 12:45–1:00 gap", L.at(T.ir.id) === "12:45 PM", L.at(T.ir.id));
  ok("Language Smarts (25) can't fit before lunch → 2:00 PM", L.at(T.ls.id) === "2:00 PM", L.at(T.ls.id));
  ok("Math Reasoning fits before his Mom block (2:25 PM)", L.at(T.mr.id) === "2:25 PM", L.at(T.mr.id));
  ok("Math Reasoning is NOT 'didn't fit'", !L.off(T.mr.id));
  ok("Reflex is NOT 'didn't fit'", !L.off(T.rfx.id), L.at(T.rfx.id));
  ok("HWT is NOT 'didn't fit'", !L.off(T.hwt.id), L.at(T.hwt.id));
  ok("Ellis's Mom cards stay where the loop puts them (2:50, 3:15)", L.at(T.eic.id) === "2:50 PM" && L.at(T.drill.id) === "3:15 PM", [L.at(T.eic.id), L.at(T.drill.id)]);
  ok("Lincoln's Mom cards unchanged (2:00, 2:25)", L.at(T.l1.id) === "2:00 PM" && L.at(T.l2.id) === "2:25 PM", [L.at(T.l1.id), L.at(T.l2.id)]);
  const own = [T.ls, T.ir, T.mr, T.hwt, T.rfx];
  ok("no own card in lunch", own.every(c => !overlapsLunch(L.s(c.id), c.dur)), own.map(c => L.at(c.id)));
  ok("no own card before now or before the card in hand ends (12:45)", own.every(c => L.s(c.id) >= H(12, 45)));
  ok("no own card on Ellis's Mom block (2:50–3:30)", own.every(c => L.s(c.id) + c.dur <= H(14, 50) || L.s(c.id) >= H(15, 30)), own.map(c => L.at(c.id)));
  const all = own.concat([T.sci, T.eic, T.drill]).map(c => [L.s(c.id), L.s(c.id) + c.dur]).sort((x, y) => x[0] - y[0]);
  ok("no two Ellis cards overlap", all.every((iv, i) => !i || iv[0] >= all[i - 1][1]), all);
  const lastEnd = Math.max.apply(null, own.concat([T.eic, T.drill]).map(c => L.s(c.id) + c.dur));
  ok("Closing Notebook is last and before school end", L.s(T.cl.id) >= lastEnd && L.s(T.cl.id) + 5 <= H(16, 15), L.at(T.cl.id));
}

console.log("\n── a gap that has already passed is never used ──");
{
  const D = ellisDay(), T = D.T;
  const L = lay({ tasks: D.tasks, nowMin: H(12, 56), checked: D.checked });   // Science in hand slides to end at now
  const own = [T.ls, T.ir, T.mr, T.hwt, T.rfx];
  ok("nothing lays before now (12:56) or into lunch", own.every(c => L.s(c.id) >= H(12, 56) && !overlapsLunch(L.s(c.id), c.dur)), own.map(c => L.at(c.id)));
}

console.log("\n── same subject keeps its order ──");
{
  const D = ellisDay(), T = D.T;
  // a second Language Smarts (10 min) after the first: it fits the 12:45 gap but must stay behind its lesson before it
  const ls2 = card("ellis", "2:10 PM", 10, "maybe", "Language Smarts 2", "lang_smarts");
  D.tasks.splice(D.tasks.indexOf(T.ir), 1);   // only the same-subject card could take the gap
  D.tasks.push(ls2);
  const L = lay({ tasks: D.tasks, nowMin: H(12, 35), checked: D.checked });
  ok("Language Smarts lesson 2 stays after lesson 1", L.s(ls2.id) >= L.s(T.ls.id) + 25, [L.at(T.ls.id), L.at(ls2.id)]);
  ok("…while HWT (10, other subject) may take the 12:45 gap", L.at(T.hwt.id) === "12:45 PM", L.at(T.hwt.id));
}

console.log("\n── Morning Notebook stays first ──");
{
  const nb = card("ellis", "10:00 AM", 5, "none", "📖 Morning Notebook", "morning_nb", { nbRedo: true });
  const x = card("ellis", "10:05 AM", 30, "none", "Writing", "w"), y = card("ellis", "10:35 AM", 5, "none", "Short", "s");
  const m = card("ellis", "10:40 AM", 20, "required", "Mom work", "m");
  const L = lay({ tasks: [nb, x, y, m], nowMin: H(10, 20) });
  ok("no card lays before the notebook ends", [x, y].every(c => L.s(c.id) >= L.s(nb.id) + 5), [L.at(nb.id), L.at(x.id), L.at(y.id)]);
}

console.log("\n── a class keeps its slot and no card lays on it ──");
{
  const D = ellisDay(), T = D.T;
  const cls = card("ellis", "2:00 PM", 15, "none", "Outschool class", "outschool");
  D.tasks.splice(D.tasks.indexOf(T.ir), 1); D.tasks.push(cls);
  const cur = { subjects: { ellis: { outschool: { fixedTime: "2:00 PM", minutes: 15 } } } };
  const L = lay({ tasks: D.tasks, nowMin: H(12, 35), checked: D.checked, currData: cur });
  ok("the class is not pulled into the 12:45 gap", L.s(cls.id) >= H(14, 0), L.at(cls.id));
  const own = [T.ls, T.mr, T.hwt, T.rfx];
  ok("no card overlaps the class's own slot", own.every(c => L.s(c.id) + c.dur <= L.s(cls.id) || L.s(c.id) >= L.s(cls.id) + 15), own.map(c => L.at(c.id)).concat(L.at(cls.id)));
}

console.log("\n── before school the plan's times hold exactly ──");
{
  const D = ellisDay({ checked: {} }), T = D.T;
  // plan: everything at its printed time (a 12:45–1:00 gap after Language Smarts is NOT filled before school)
  T.prev.time = "11:30 AM"; T.sci.time = "11:55 AM"; T.ls.time = "12:15 PM";
  T.ir.time = "2:00 PM"; T.mr.time = "2:15 PM"; T.hwt.time = "2:40 PM"; T.rfx.time = "3:30 PM"; T.cl.time = "3:45 PM";
  T.eic.time = "2:50 PM"; T.drill.time = "3:15 PM";
  const L = lay({ tasks: D.tasks, nowMin: H(9, 30), checked: {} });
  const bad = D.tasks.filter(c => L.at(c.id) !== c.time).map(c => c.title + " " + c.time + "→" + L.at(c.id));
  ok("every card at its printed time at 9:30 AM", !bad.length, bad);
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
