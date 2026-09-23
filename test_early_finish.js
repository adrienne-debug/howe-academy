/*
 * ⏩ Early finish pulls the next lesson forward (her rule 2026-09-22): automatic, Mom-required
 * too when Mom is free, furthest-behind subject first, lesson order held by a chain slide.
 * Narrowed 2026-09-23 (her rule): AUTOMATIC only for work that FELL OFF today (rolledFrom / cascadedFrom = today);
 * any other later-day lesson is a ⏩ Get ahead choice, never pulled on its own. The week below marks each subject's
 * next lesson as fallen off Tuesday (the school-end rule rolled it), so the original scenarios still apply.
 *   run:  node test_early_finish.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const a = src.indexOf("// EFPULL_START"), b = src.indexOf("// EFPULL_END");
if (a < 0 || b < 0) { console.error("EFPULL markers not found"); process.exit(1); }
const BLOCK = src.slice(a, b);
function slice(n) { const i = src.indexOf("function " + n); return src.slice(i, src.indexOf("\n}", i) + 2); }
const HELPERS = slice("toMin") + "\n" + slice("fromMin");
let pass = 0, fail = 0;
function ok(n, c, x) { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x) + ")" : "")); } }
let ID = 0;
function card(who, day, time, dur, mom, sk, title, extra) { return Object.assign({ id: sk + "_" + (ID++), who, day, time, dur, mom: mom || "none", subjectKey: sk, title: title || sk }, extra || {}); }
function world(o) {
  const writes = [], toasts = [], logs = [];
  const ctx = {
    console, WK: "week24", weekData: { tasks: o.tasks }, checked: o.checked || {}, fbTasksLoaded: true, momMoves: o.momMoves || {},
    _todayDay: o.today || "tuesday", DAY_DT: {}, lastTasksWrite: 0,
    _mlNowMin: () => o.now, _mlDayEndMin: () => 16 * 60 + 15, _mlLunchWin: () => [13 * 60, 14 * 60],
    mlMomOff: () => !!o.momOff, mlNow: () => ({ kid: o.momWith === undefined ? null : o.momWith }),
    currExpectedBase: (kid, sk) => (o.behind || {})[sk] === undefined ? null : (o.behind || {})[sk], computeSubjectCursor: () => 0,
    planPace: (kid, sk) => ({ behind: (o.behind || {})[sk] || 0, ahead: 0, score: -((o.behind || {})[sk] || 0) }),   // 2026-09-23: behind vs the CURRENT plan
    catchupDayCap: (kid, subj) => (o.caps || {})[subj] === undefined ? 2 : o.caps[subj], taskSubject: t => t.subjectKey,
    subjNoCarry: t => /_retr_|reflex/.test(t.id + t.subjectKey), _mlDayOf: t => t.day,
    sv: () => {}, dbg: m => logs.push(m), gwShowToast: m => toasts.push(m), cap: s => s, _dryRun: () => false,
    db: { ref: p => ({ update: u => writes.push([p, u]) }) },
    Object, String, Array, Math, Date, RegExp, parseInt, JSON,
  };
  vm.createContext(ctx); vm.runInContext(HELPERS, ctx); vm.runInContext(BLOCK, ctx);
  return { ctx, writes, toasts, logs, call: e => vm.runInContext(e, ctx), pull: k => vm.runInContext("efPullNext('" + (k || "lincoln") + "')", ctx) };
}
// Lincoln's real Tuesday 9/22 shape: all done by 2:26, Singapore L2 Wed / L3+L4 Fri / L5 Sat, MR5 Wed/Fri/Sat, WriteShop (Mom) Wed+Sat
function lincolnWeek() {
  ID = 0;
  const done1 = card("lincoln", "tuesday", "12:05 PM", 25, "maybe", "singapore_l", "Singapore L1"), done2 = card("lincoln", "tuesday", "12:30 PM", 25, "maybe", "mr_pages", "MR5 a");
  const close = card("lincoln", "tuesday", "2:26 PM", 5, "none", "closing_nb", "Closing Notebook");
  const s2 = card("lincoln", "wednesday", "12:25 PM", 25, "maybe", "singapore_l", "Singapore L2", { rolledFrom: "tuesday" }), s3 = card("lincoln", "friday", "12:05 PM", 25, "maybe", "singapore_l", "Singapore L3"),
        s4 = card("lincoln", "friday", "12:30 PM", 25, "maybe", "singapore_l", "Singapore L4"), s5 = card("lincoln", "saturday", "10:00 AM", 25, "maybe", "singapore_l", "Singapore L5");
  const m2 = card("lincoln", "wednesday", "2:00 PM", 25, "maybe", "mr_pages", "MR5 b", { rolledFrom: "tuesday" }), m3 = card("lincoln", "saturday", "10:25 AM", 25, "maybe", "mr_pages", "MR5 c");
  const w1 = card("lincoln", "wednesday", "3:10 PM", 25, "required", "writeshop", "WriteShop 1a", { cascadedFrom: "tuesday" }), w2 = card("lincoln", "saturday", "11:15 AM", 25, "required", "writeshop", "WriteShop 1b");
  const drill = card("lincoln", "wednesday", "2:55 PM", 13, "required", "retrieval", "Daily Drill", { id: "2026d265_retr_drill_lincoln" });
  const nb = card("lincoln", "wednesday", "10:45 AM", 5, "none", "morning_nb", "Morning Notebook");
  const ellis = card("ellis", "wednesday", "10:00 AM", 25, "none", "dm4a", "Ellis DM");
  const checked = {}; [done1, done2, close].forEach(t => { checked[t.id] = "x"; });
  return { tasks: [done1, done2, close, s2, s3, s4, s5, m2, m3, w1, w2, drill, nb, ellis], checked, cards: { done1, done2, close, s2, s3, s4, s5, m2, m3, w1, w2, drill, nb, ellis } };
}
console.log("── nothing happens unless today is finished ──");
{
  const L = lincolnWeek(); delete L.checked[L.cards.done2.id];
  const w = world({ tasks: L.tasks, checked: L.checked, now: 14 * 60 + 26 });
  ok("an open card today → no pull", w.pull() === null && w.writes.length === 0);
}
{
  const L = lincolnWeek(); const w = world({ tasks: L.tasks, checked: L.checked, now: 14 * 60 + 26, today: "saturday" });
  ok("Saturday (no later day) → no pull", w.pull() === null);
}
console.log("\n── finished at 2:26: the furthest-behind subject's NEXT lesson comes to today, its chain slides up ──");
{
  const L = lincolnWeek(); const c = L.cards;
  const w = world({ tasks: L.tasks, checked: L.checked, now: 14 * 60 + 26, behind: { singapore_l: 2, mr_pages: 0, writeshop: 1 } });
  const got = w.pull();
  ok("Singapore (behind 2) wins over WriteShop (1) and MR5 (0)", got && got.id === c.s2.id, got && got.title);
  // his last card ended 12:55 and he checked the closing notebook at 2:26 → the pull lands at NOW (2:26), never earlier
  ok("it lands today at the moment he finished", c.s2.day === "tuesday" && c.s2.time === "2:26 PM" && c.s2.pulledFrom === "wednesday", [c.s2.day, c.s2.time, c.s2.pulledFrom]);
  ok("L3 slides into L2's Wednesday slot", c.s3.day === "wednesday" && c.s3.time === "12:25 PM", [c.s3.day, c.s3.time]);
  ok("L4 slides into L3's Friday slot, L5 into L4's — Saturday's Singapore is gone", c.s4.day === "friday" && c.s4.time === "12:05 PM" && c.s5.day === "friday" && c.s5.time === "12:30 PM", [c.s4.day, c.s4.time, c.s5.day, c.s5.time]);
  ok("MR5 and WriteShop untouched", c.m2.day === "wednesday" && c.m3.day === "saturday" && c.w1.day === "wednesday" && c.w2.day === "saturday");
  ok("one targeted multi-path write to the week's tasks", w.writes.length === 1 && w.writes[0][0] === "week24/tasks" && Object.keys(w.writes[0][1]).length === 10 && w.writes[0][1]["singapore_l_3/rolledFrom"] === null, w.writes[0] && Object.keys(w.writes[0][1]));   // +1: the "fell off today" mark cleared
  ok("the kid hears what is next", w.toasts.length === 1 && /next up: Singapore L2 \(from Wednesday\)/.test(w.toasts[0]), w.toasts);
  // the pulled card is open now → a second call pulls nothing until it is checked
  ok("nothing more until the pulled card is done", w.pull() === null);
  w.ctx.checked[c.s2.id] = "x"; w.call("_mlNowMin=()=>15*60");
  const got2 = w.pull();
  // Singapore has now been done twice today (L1 + the pulled L2) = the default per-day cap of 2 → the next
  // pull moves on to the next-most-behind subject (WriteShop, Mom free here); L3 stays on Wednesday
  ok("…checked → Singapore is at its 2-a-day cap, so the next pull takes WriteShop and L3 stays on Wednesday", got2 && got2.id === c.w1.id && c.s3.day === "wednesday" && got2.time === "3:00 PM", got2 && [got2.title, c.s3.day, got2.time]);
}
console.log("\n── Mom-required: only when Mom is free ──");
{
  const L = lincolnWeek(); const c = L.cards;
  const w = world({ tasks: L.tasks, checked: L.checked, now: 14 * 60 + 26, behind: { writeshop: 5 }, momWith: "lucy" });
  const got = w.pull();
  ok("Mom with Lucy → WriteShop (most behind) is skipped, next subject pulled instead", got && got.subjectKey !== "writeshop" && c.w1.day === "wednesday", got && got.title);
}
{
  const L = lincolnWeek(); const c = L.cards;
  const w = world({ tasks: L.tasks, checked: L.checked, now: 14 * 60 + 26, behind: { writeshop: 5 }, momWith: null });
  const got = w.pull();
  ok("Mom free (nobody needs her) → WriteShop 1a comes to today, 1b slides from Saturday to Wednesday", got && got.id === c.w1.id && c.w2.day === "wednesday" && c.w2.time === "3:10 PM", [got && got.title, c.w2.day, c.w2.time]);
}
{
  const L = lincolnWeek();
  const w = world({ tasks: L.tasks, checked: L.checked, now: 14 * 60 + 26, behind: { writeshop: 5 }, momWith: "lincoln" });
  ok("Mom already with this kid counts as free", w.pull().subjectKey === "writeshop");
}
{
  const L = lincolnWeek();
  const w = world({ tasks: L.tasks, checked: L.checked, now: 14 * 60 + 26, behind: { writeshop: 5 }, momOff: true });
  ok("Mom switched off → never a Mom-required card", w.pull().subjectKey !== "writeshop");
}
console.log("\n── the guards ──");
{
  const L = lincolnWeek(); const c = L.cards;
  const w = world({ tasks: L.tasks, checked: L.checked, now: 14 * 60 + 26, behind: { singapore_l: 9 }, caps: { singapore_l: 1 } });
  const got = w.pull();
  ok("per-day cap: Singapore already done once today with cap 1 → not pulled, next subject instead", got && got.subjectKey !== "singapore_l" && c.s2.day === "wednesday", got && got.title);
}
{
  const L = lincolnWeek();
  const w = world({ tasks: L.tasks, checked: L.checked, now: 16 * 60, behind: { singapore_l: 9 } });
  ok("4:00 PM with only 25-min lessons left → nothing fits before 4:15, nothing pulled", w.pull() === null && w.writes.length === 0);
}
{
  const L = lincolnWeek(); const c = L.cards;
  const short = card("lincoln", "friday", "11:30 AM", 10, "none", "gwtm", "GWTM", { rolledFrom: "tuesday" }); L.tasks.push(short);
  const w = world({ tasks: L.tasks, checked: L.checked, now: 16 * 60, behind: { singapore_l: 9 } });
  const got = w.pull();
  ok("…but a 10-minute subject that fits is taken", got && got.id === short.id && short.day === "tuesday" && short.time === "4:00 PM", got && got.title);
}
{
  const L = lincolnWeek(); const c = L.cards;
  const w = world({ tasks: L.tasks, checked: L.checked, now: 12 * 60 + 50, behind: { singapore_l: 9 } });
  // pretend he finished at 12:50 (his last card ended 12:55 → start 12:55, lunch 1–2)
  const got = w.pull();
  ok("finished just before lunch → the pulled card lands at 2:00 PM, not on lunch", got && c.s2.time === "2:00 PM", c.s2.time);
}
{
  const L = lincolnWeek(); const c = L.cards;
  const w = world({ tasks: L.tasks, checked: L.checked, now: 14 * 60 + 26, behind: { retrieval: 99, morning_nb: 99 } });
  const got = w.pull();
  ok("day-bound drill and the morning notebook are never pulled, whatever the behind score", got && got.subjectKey !== "retrieval" && got.subjectKey !== "morning_nb" && c.drill.day === "wednesday" && c.nb.day === "wednesday", got && got.title);
}
{
  const L = lincolnWeek(); const c = L.cards; const mm = {}; mm[c.s2.id] = { mode: "push" };
  const w = world({ tasks: L.tasks, checked: L.checked, now: 14 * 60 + 26, behind: { singapore_l: 9 }, momMoves: mm });
  const got = w.pull();
  ok("a card Mom pushed/dismissed is hers — not pulled", got && got.id !== c.s2.id, got && got.title);
}
{
  const L = lincolnWeek();
  const w = world({ tasks: L.tasks, checked: L.checked, now: 14 * 60 + 26 });
  const got = w.pull();
  ok("another kid's cards are never touched", got && got.who === "lincoln" && L.cards.ellis.day === "wednesday");
}
console.log("\n── wiring ──");
ok("finalizeDone hands the kid to efPullNext after a today check-off", /efPullNext\(t\.who\)/.test(src) && /mlOnCheck\(t\); \}catch\(e\)\{\}[^\n]*\n\s*\/\/ ⏩ last open card/.test(src));
console.log("\n── her rule 2026-09-23: only what fell off TODAY comes in on its own ──");
{
  const L = lincolnWeek(); [L.cards.s2, L.cards.m2].forEach(t => { delete t.rolledFrom; }); delete L.cards.w1.cascadedFrom;
  const w = world({ tasks: L.tasks, checked: L.checked, now: 14 * 60 + 26, behind: { singapore_l: 2, writeshop: 1, mr_pages: 0 } });
  ok("a later day's lesson that did NOT fall off today is never pulled (it is a ⏩ Get ahead choice)", w.pull() === null && w.writes.length === 0);
}
{
  const L = lincolnWeek(); const w = world({ tasks: L.tasks, checked: L.checked, now: 14 * 60 + 26, behind: { singapore_l: 2, writeshop: 1, mr_pages: 0 } });
  const c = w.pull();
  ok("a fallen-off lesson comes back home and loses its 'fell off' mark", c && c.id === L.cards.s2.id && c.rolledFrom === undefined && w.writes.some(x => x[1][c.id + "/rolledFrom"] === null));
}
console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
