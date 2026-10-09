/*
 * 📅 Review with Mom (her "build it" 2026-09-24): grading a kid's work can book a short Mom-required review
 * card — later today (after the kid's last open card, if it fits before the school end) or the next school
 * day (at school start; co-op and kid-off days skipped) — with a note; the graded lesson's history entry gets a
 * review chip; a review with no school day left waits as pending and is placed when one exists; a review whose
 * card a rebuild dropped is re-added from reviews/<kid>.
 *   run:  node test_review.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const a = src.indexOf("// REVIEW_START"), b = src.indexOf("// REVIEW_END");
if (a < 0 || b < 0) { console.error("REVIEW markers not found"); process.exit(1); }
const fn = n => { const i = src.indexOf("function " + n + "("); return src.slice(i, src.indexOf("\n}", i) + 2); };
const BLOCK = [fn("toMin"), fn("fromMin"), src.slice(a, b)].join("\n");
let pass = 0, fail = 0;
function ok(n, c, x) { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x) + ")" : "")); } }
const toM = s => { const m = /(\d+):(\d+)\s*(AM|PM)/.exec(s); return ((+m[1] % 12) + (m[3] === "PM" ? 12 : 0)) * 60 + (+m[2]); };
function world(o) {
  o = o || {};
  const writes = [], toasts = [], logs = [];
  const tasks = o.tasks || [];
  const ctx = {
    console, WK: "week24", weekData: { tasks }, checked: o.checked || {}, histState: o.hist || {},
    _todayDay: o.today || "thursday", _mlNowOverride: o.now != null ? o.now : 11 * 60,
    rulesData: { schoolDay: { defaultStart: "10:00 AM", defaultEnd: "4:15 PM", overrides: o.overrides || {} } },
    DAY_DT: { monday: "September 21", tuesday: "September 22", wednesday: "September 23", thursday: "September 24", friday: "September 25" },
    DAY_LBL: { monday: "Mon", tuesday: "Tue", wednesday: "Wed", thursday: "Thu", friday: "Fri" },
    _mlDayEndMin: () => o.end != null ? o.end : toM("4:15 PM"), _mlNowMin: () => o.now != null ? o.now : 11 * 60,
    _pushDateStr: dn => ctx.DAY_DT[dn] || "", routineDateISO: dn => ({ thursday: "2026-09-24", friday: "2026-09-25", monday: "2026-09-21" })[dn] || "",
    schedOvKidOff: () => false, smapIsKidOff: (k, ds) => !!(o.kidOff || {})[ds], coopTimedEndMin: (k, iso) => (o.coop || {})[iso] || 0, coopFullDayFor: () => null,
    _nextSchoolDay: (kid, from) => { const order = ["monday", "tuesday", "wednesday", "thursday", "friday"]; const i = order.indexOf(from); return (o.noNextDay ? null : (order[i + 1] || null)); },
    effectiveDay: t => t.day, taskSubject: t => t.subject || "Math", taskLessonRef: t => t.ref || "",
    momHere: () => o.kid ? false : true, cap: s => s.charAt(0).toUpperCase() + s.slice(1), esc: s => String(s), nowTs: () => "11:00 AM Sep 24", dayOfYear: () => 267,
    ld: () => ({}), sv: () => {}, dbg: m => logs.push(m), gwShowToast: m => toasts.push(m), renderAll: () => {}, lastTasksWrite: 0,
    _dryRun: () => !!o.dry, db: { ref: p => ({ set: v => writes.push(["set", p, v]), update: v => writes.push(["update", p, v]), remove: () => writes.push(["remove", p]) }) },
    document: { getElementById: () => null, createElement: () => ({ style: {} }), body: { appendChild: () => {} } },
    Object, Array, String, Number, Math, Date, JSON, RegExp, Set, setTimeout: fn => fn(),
  };
  vm.createContext(ctx); vm.runInContext(BLOCK, ctx);
  return { ctx, tasks, writes, toasts, logs, call: e => vm.runInContext(e, ctx) };
}
const lesson = (id, who, day, time, dur, x) => Object.assign({ id, who, day, time, dur, title: "📖 Dimensions Math 4A — Ch.1 L5", subject: "Dimensions Math 4A", ref: "Ch.1 L5", subjectKey: "dm4a", mom: "none" }, x || {});

console.log("── later today: after the kid's last open card ──");
{
  const w = world({ tasks: [lesson("dm5", "ellis", "thursday", "10:00 AM", 25), lesson("x1", "ellis", "thursday", "11:20 AM", 20, { title: "Reading" }), lesson("x2", "ellis", "thursday", "2:00 PM", 15, { title: "Reflex" })], checked: { dm5: "11:00 AM Sep 24" }, hist: { dm5: { title: "x" } } });
  const rec = w.call("rvBook('ellis','dm5',{minutes:10,when:'today',note:'borrowing on #4, 6, 9'})");
  const card = w.tasks.find(t => t.review);
  ok("a review card exists on today", card && card.day === "thursday" && card.who === "ellis");
  ok("it sits after his last open card (2:15 PM)", card.time === "2:15 PM", card.time);
  ok("Mom-required, 10 min, its own subject key (not a lesson), no lid", card.mom === "required" && card.dur === 10 && card.subjectKey === "review" && !card.lid);
  ok("title names the lesson, the note is the detail", card.title === "🔁 Review with Mom — Dimensions Math 4A Ch.1 L5" && card.detail === "📝 borrowing on #4, 6, 9", [card.title, card.detail]);
  ok("targeted writes only: one card, one record, one history chip", w.writes.some(x => x[0] === "update" && x[1] === "week24/tasks" && Object.keys(x[2])[0] === card.id) && w.writes.some(x => x[0] === "set" && x[1] === "reviews/ellis/" + rec.id) && w.writes.some(x => x[1] === "week24/history/dm5/review"), w.writes.map(x => x[1]));
  ok("the graded lesson remembers it", w.ctx.histState.dm5.review && w.ctx.histState.dm5.review.id === rec.id);
  ok("Mom is told", /Review with Ellis — later today, 10 min/.test(w.toasts[0]), w.toasts);
}
console.log("\n── later today when the day is full → right after now ──");
{
  const w = world({ tasks: [lesson("x2", "ellis", "thursday", "3:50 PM", 20)], now: 12 * 60 });
  w.call("rvBook('ellis',null,{minutes:15,when:'today',fromTitle:'Spelling'})");
  ok("lands at now (12:00 PM) for Mom's queue to lay", w.tasks.find(t => t.review).time === "12:00 PM", w.tasks.find(t => t.review).time);
}
console.log("\n── after school / past the end → next school day at school start ──");
{
  const w = world({ tasks: [], now: 19 * 60 });
  w.call("rvBook('lucy',null,{minutes:10,when:'today',fromTitle:'HWT'})");
  const c = w.tasks.find(t => t.review);
  ok("grading at 7 PM Thursday → Friday 10:00 AM", c.day === "friday" && c.time === "10:00 AM", [c.day, c.time]);
}
{
  const w = world({ tasks: [], overrides: { friday: { start: "9:30 AM" } } });
  w.call("rvBook('lucy',null,{minutes:10,when:'next',fromTitle:'HWT'})");
  ok("a per-day school start override is honored", w.tasks.find(t => t.review).time === "9:30 AM");
}
console.log("\n── co-op and kid-off days are skipped; no day left → pending ──");
{
  const w = world({ tasks: [], today: "wednesday", coop: { "2026-09-24": 14 * 60 } });
  w.call("rvBook('lincoln',null,{minutes:10,when:'next',fromTitle:'Singapore'})");
  ok("Wednesday grading skips Thursday's co-op → Friday", w.tasks.find(t => t.review).day === "friday");
}
{
  const w = world({ tasks: [], today: "friday", now: 20 * 60 });
  const rec = w.call("rvBook('ellis',null,{minutes:10,when:'today',fromTitle:'Reading'})");
  ok("Friday night: no school day left → pending, no card", rec.status === "pending" && !w.tasks.length && /No school day left this week/.test(w.toasts[0]));
  ok("…the pending record is saved", w.writes.some(x => x[1] === "reviews/ellis/" + rec.id && x[2].status === "pending"));
}
console.log("\n── remove, heal, dry-run, kid ──");
{
  const w = world({ tasks: [], hist: { dm5: {} } });
  const rec = w.call("rvBook('ellis','dm5',{minutes:10,when:'next'})");
  w.call("rvRemove('" + rec.id + "')");
  ok("✕ removes the card, marks the record removed, clears the chip", !w.tasks.length && rec.status === "removed" && !w.ctx.histState.dm5.review && w.writes.some(x => x[1] === "reviews/ellis/" + rec.id + "/status" && x[2] === "removed"));
}
{
  const w = world({ tasks: [] });
  w.call('reviews={ ellis: { r1: { id: "r1", kid: "ellis", fromTitle: "Dimensions", minutes: 15, note: "regroup", status: "booked", week: "week24", day: "friday" } } }');
  w.call("rvHeal()");
  ok("a booked review whose card vanished is re-added", w.tasks.length === 1 && w.tasks[0].id === "r1" && w.tasks[0].dur === 15 && w.tasks[0].detail === "📝 regroup");
  const n = w.writes.length; w.call("rvHeal()");
  ok("…once only, never a loop", w.writes.length === n);
}
{
  const w = world({ tasks: [] });
  w.call('reviews={ lucy: { p1: { id: "p1", kid: "lucy", fromTitle: "HWT", minutes: 5, note: "", status: "pending", week: null } } }');
  w.call("rvHeal()");
  ok("a pending review is placed once a school day exists", w.tasks.length === 1 && w.tasks[0].day === "friday" && w.writes.some(x => x[1] === "reviews/lucy/p1" && x[2].status === "booked"));
}
{
  const w = world({ tasks: [], dry: true });
  w.call("rvBook('ellis',null,{minutes:10,when:'next',fromTitle:'x'})");
  ok("dry-run writes nothing to the database", w.writes.length === 0);
}
{
  const w = world({ tasks: [], kid: true });
  ok("a kid can't book or remove reviews", w.call("rvBook('ellis',null,{minutes:10})") === null);
}
console.log("\n── the wiring ──");
ok("the score dialog carries the review row", /rvRowHtml\(t\.who,"rv"\)/.test(src));
ok("approve with a score books it; approve without a score books it; a later edit books it", /if\(_rv&&_rt\) setTimeout\(function\(\)\{ rvBook\(_rt\.who,sp\.id,_rv\); \},0\);/.test(src) && /const _rv=\(sp&&sp\.mode==="approve"\)\?rvReadRow\("rv"\):null;/.test(src) && /if\(_rv&&_rt\) rvBook\(_rt\.who,sp\.id,_rv\);/.test(src));
ok("📅 beside Approve in the ⏳ list and on the card", /h\+=rvBtn\(o\.id\);/.test(src) && (/rvBtn\(srcId\)\+/.test(src) || (/coActionsHTML\(srcId\)/.test(src) && /rvBtn\(id\);   \/\/ 📅/.test(src))));   // ✅ CLOSEOUT: the card's actions moved into coActionsHTML
ok("done cards show the chip and a 📅; a review card gets Mom's ✕", /const rvChip=/.test(src) && /const rvDoneBtn=/.test(src) && /wbRow\+eicRow\+rvRow\+/.test(src));
ok("History shows the chip and a 📅", /e\.review\?' <span[^']*📅 review/.test(src) && /rvOpen\(\\''\+e\.id\+'\\'\)/.test(src));
ok("reviews are listened to and healed after the week's cards load", /db\.ref\("reviews"\)\.on\("value"/.test(src) && /if\(firstLoad \|\| inFP!==curFP\)\{ try\{ rvHeal\(\); \}catch\(e\)\{\} \}/.test(src));

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
