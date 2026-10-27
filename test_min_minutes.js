/*
 * ⏱ Timed cards — a minimum before the check, a countdown on the card, Mom's rule for early checks
 * (her decisions 2026-10-22). Runs the real MINMINUTES block out of index.html against a small fake
 * day: a subject's default (practice on, lesson off — derived, never written), the countdown text,
 * "Not yet" vs "Let it through and tell me", a card never started, the overrun line once per card
 * per day, Mom's ⏱ N min on the done row, and an untimed subject rendering exactly as before.
 * Section 12 (her decision 2026-10-23): a forgotten Start counts from the kid's last check-off today
 * (or their day start), crediting at most 15 minutes; an explicit Start wins; the fallback never overruns.
 *
 *   run: node test_min_minutes.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const a = src.indexOf("// MINMINUTES_START"), b = src.indexOf("// MINMINUTES_END");
if (a < 0 || b < 0) { console.error("MINMINUTES markers not found"); process.exit(1); }
const pa = src.indexOf("function _parseCheckTs(ts){"), pb = src.indexOf("\n}", pa) + 2;
const BLOCK = src.slice(a, b) + "\n" + src.slice(pa, pb);

let pass = 0, fail = 0;
const ok = (n, c, x) => c ? (pass++, console.log("  ok  - " + n)) : (fail++, console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x) : "")));

// ── a fake day: Friday Oct 23 2026, 10:00 AM ──
const BASE = new Date(2026, 9, 23, 10, 0, 0).getTime();
function world(opts) {
  opts = opts || {};
  let NOW = BASE;
  class FDate extends Date { constructor(...x) { if (!x.length) super(NOW); else super(...x); } static now() { return NOW; } }
  const writes = [];
  const ref = p => ({ set: v => { writes.push({ op: "set", path: p, val: v }); return Promise.resolve(); }, remove: () => { writes.push({ op: "remove", path: p }); return Promise.resolve(); }, update: v => { writes.push({ op: "update", path: p, val: v }); return Promise.resolve(); }, on: () => {}, off: () => {} });
  const subjects = {
    lincoln: {
      piano: { display: "Piano", minutes: 15 },                       // practice by name → default on at 15
      reading: { display: "Reading", minutes: 20 },                   // practice by name
      drill: { display: "Spanish", minutes: 10, practiceFor: "x" },   // practice by link
      math: { display: "Dimensions Math", minutes: 30 },             // lesson work → off
      math10: { display: "Dimensions Math", minutes: 30, minMin: 10 },
      pianoOff: { display: "Piano", minutes: 15, minMin: 0 },
      pianoHide: { display: "Piano", minutes: 15, minShow: false },
    },
  };
  const toasts = [], ceSaved = [];
  const ctx = {
    console, Date: FDate, Object, String, Number, Array, Math, JSON, parseInt, isNaN, Promise,
    weekData: { tasks: opts.tasks || [] }, checked: {}, claimed: {}, histState: {},
    rulesData: opts.rules === undefined ? {} : opts.rules,
    currData: { subjects }, gwGetSubjects: k => subjects[k] || {},
    KID_NAME: { lincoln: "Lincoln", ellis: "Ellis" }, cap: s => s.charAt(0).toUpperCase() + s.slice(1), esc: s => String(s),
    effectiveDay: t => t.day, _todayDay: "friday", _todayStr: () => "2026-10-23",
    WK: "week8", db: ref ? { ref } : null, _dryRun: () => false, fbWeekRefs: [], isUploading: false,
    _ls: {}, momHereCards: () => !!opts.mom, momHere: () => !!opts.mom, kitPinGate: fn => fn(),
    gwShowToast: m => toasts.push(m), renderAll: () => {}, ceRenderEditSheet: () => {},
    ceEditKid: "lincoln", ceEditKey: "piano", ceSaveField: (f, v) => { ceSaved.push([f, v]); subjects.lincoln.piano[f] = v; },
    taskSubject: t => t.title,
  };
  ctx.sv = (k, v) => { ctx._ls[k] = JSON.stringify(v); }; ctx.ld = k => ctx._ls[k] ? JSON.parse(ctx._ls[k]) : null;
  if (opts.dad) ctx.dadTapCtx = { by: "dad" };
  vm.createContext(ctx); vm.runInContext(BLOCK, ctx);
  const run = code => vm.runInContext(code, ctx);
  return { ctx, run, writes, toasts, ceSaved, subjects, setNow: ms => { NOW = ms; }, now: () => NOW,
    startAgo: (id, min) => run("started[" + JSON.stringify(id) + "]=" + (NOW - min * 60000)) };
}
const card = (id, sk, extra) => Object.assign({ id, who: "lincoln", subjectKey: sk, day: "friday", time: "10:00 AM", title: "🎹 " + sk }, extra || {});

console.log("\n── 1. the subject's default — derived at read time, never written ──");
{
  const w = world();
  const t = w.run;
  ok("Piano (no minMin) defaults to its own 15 min", t("mmTargetOf(currData.subjects.lincoln.piano,'piano')") === 15);
  ok("Reading defaults to its own 20 min", t("mmTargetOf(currData.subjects.lincoln.reading,'reading')") === 20);
  ok("a subject with a Practice-for link counts as practice", t("mmTargetOf(currData.subjects.lincoln.drill,'drill')") === 10);
  ok("lesson work (Dimensions Math) is off", t("mmTargetOf(currData.subjects.lincoln.math,'math')") === 0);
  ok("an explicit minMin wins (math at 10)", t("mmTargetOf(currData.subjects.lincoln.math10,'math10')") === 10);
  ok("minMin 0 turns a practice subject off", t("mmTargetOf(currData.subjects.lincoln.pianoOff,'pianoOff')") === 0);
  ok("a subject whose KEY says practice counts too", t("mmTargetOf({display:'Scales',minutes:12},'daily_practice')") === 12);
  ok("'ready' / 'bread' in a name is not 'read'", t("mmTargetOf({display:'Ready Writing',minutes:12},'rw')") === 0 && t("mmTargetOf({display:'Bread Baking',minutes:12},'bb')") === 0);
  ok("deriving wrote nothing to Firebase", w.writes.length === 0, w.writes);
  ok("deriving added no minMin to the subject record", !("minMin" in w.subjects.lincoln.piano) && !("minMin" in w.subjects.lincoln.math));
  ok("a Family Time card is never timed", t("mmTarget({id:'f1',who:'lincoln',subjectKey:'piano',famBlock:'fb1'})") === 0);
  ok("a _c twin is never timed", t("mmTarget({id:'x_c',who:'lincoln',subjectKey:'piano'})") === 0);
  ok("minShow absent = on, false = off", t("mmShowOf(currData.subjects.lincoln.piano)") === true && t("mmShowOf(currData.subjects.lincoln.pianoHide)") === false);
}

console.log("\n── 2. the countdown on the card (target 15, grace 2) ──");
{
  const w = world({ tasks: [card("p1", "piano"), card("h1", "pianoHide")] });
  const c = m => { w.startAgo("p1", m); return w.run("mmCountdownText(weekData.tasks[0])"); };
  ok("not started → no text", w.run("mmCountdownText(weekData.tasks[0])") === "");
  ok("just started → 15 min left", c(0) === "15 min left", c(0));
  ok("3 min in → 12 min left", c(3) === "12 min left", c(3));
  ok("12.5 min in → 3 min left (whole minutes, no seconds)", c(12.5) === "3 min left", c(12.5));
  ok("13 min in (target − grace) → ready ✓", c(13) === "ready ✓", c(13));
  ok("20 min in (over) → still ready ✓", c(20) === "ready ✓", c(20));
  w.startAgo("p1", 3);
  const row = w.run("mmCardRow(weekData.tasks[0],false,false,false)");
  ok("the card row shows ⏱ 12 min left", /⏱ 12 min left/.test(row), row);
  w.run("started={}");
  const startRow = w.run("mmCardRow(weekData.tasks[0],false,false,false)");
  ok("before Start the card shows a ▶ Start button with the minutes", /mmStart\('p1'\)/.test(startRow) && /▶ Start/.test(startRow) && /15 min/.test(startRow), startRow);
  ok("no Start on a done, claimed or read-only card", w.run("mmCardRow(weekData.tasks[0],true,false,false)") === "" && w.run("mmCardRow(weekData.tasks[0],false,true,false)") === "" && w.run("mmCardRow(weekData.tasks[0],false,false,true)") === "");
  ok("no Start on another day's card", w.run("mmCardRow(Object.assign({},weekData.tasks[0],{day:'monday'}),false,false,false)") === "");
  w.startAgo("h1", 3);
  ok("minShow off: the countdown is hidden…", w.run("mmCardRow(weekData.tasks[1],false,false,false)") === "");
  ok("…but the lock still applies (Not yet)", w.run("mmTapGate(weekData.tasks[1])") === true && /Not yet/.test(w.toasts[w.toasts.length - 1]));
}

console.log("\n── 3. 'Not yet' (default rule) blocks and says how long to go ──");
{
  const w = world({ tasks: [card("p1", "piano")] });
  w.startAgo("p1", 9);
  ok("the rule defaults to Not yet, grace 2, overrun on", JSON.stringify(w.run("mmRules()")) === JSON.stringify({ grace: 2, early: "wait", over: true }));
  ok("9 of 15 min: the tap stops", w.run("mmTapGate(weekData.tasks[0])") === true);
  ok("the kid reads 'Not yet — 4 min to go' (to target − grace)", w.toasts[0] === "⏱ Not yet — 4 min to go", w.toasts[0]);
  w.startAgo("p1", 12.2);
  w.run("mmTapGate(weekData.tasks[0])");
  ok("12.2 min: 1 min to go", /1 min to go/.test(w.toasts[1]), w.toasts[1]);
  w.startAgo("p1", 13);
  ok("13 min (target − grace): the tap goes through", w.run("mmTapGate(weekData.tasks[0])") === false);
  w.startAgo("p1", 40);
  ok("going over is always fine", w.run("mmTapGate(weekData.tasks[0])") === false);
  ok("nothing was written while blocking", w.writes.length === 0);
  w.startAgo("p1", 5);
  ok("a check that still lands early under Not yet (a system path) records spent but sends no line", w.run("mmOnDone('p1','10:00 AM Oct 23')") === 5 && w.writes.length === 0, w.writes);
  w.startAgo("p1", 5); w.run("checked.p1='10:05 AM Oct 23'");
  ok("a card already checked is never gated (Unmark still opens)", w.run("mmTapGate(weekData.tasks[0])") === false);
  w.run("delete checked.p1; claimed.p1='10:05 AM Oct 23'");
  ok("a card waiting on Mom is never gated", w.run("mmTapGate(weekData.tasks[0])") === false);
}

console.log("\n── 4. 'Let it through and tell me' checks and sends exactly one line ──");
{
  const w = world({ tasks: [card("p1", "piano"), card("y1", "piano", { day: "thursday" })], rules: { minMinutes: { early: "tell" } } });
  w.startAgo("p1", 9);
  ok("the tap goes through", w.run("mmTapGate(weekData.tasks[0])") === false && w.toasts.length === 0);
  w.startAgo("y1", 5);
  ok("a past day's card finalized by a heal records spent but sends no line", w.run("mmOnDone('y1','10:00 AM Oct 23')") === 5 && w.writes.length === 0, w.writes);
  const spent = w.run("mmOnDone('p1','10:00 AM Oct 23')");
  ok("spent = 9 minutes", spent === 9, spent);
  const al = w.writes.filter(x => /minAlerts/.test(x.path));
  ok("ONE alert record, at week8/minAlerts/early_p1_2026-10-23", al.length === 1 && al[0].op === "set" && al[0].path === "week8/minAlerts/early_p1_2026-10-23", al);
  ok("the line reads 'Lincoln finished Piano at 9 of 15 minutes'", al[0].val.text === "Lincoln finished Piano at 9 of 15 minutes", al[0].val.text);
  ok("the record names the kid, card and day", al[0].val.kid === "lincoln" && al[0].val.id === "p1" && al[0].val.day === "2026-10-23" && al[0].val.kind === "early");
  // the kid sent it to Mom (claim) and Mom approves 20 minutes later → spent is to the claim, no second line
  w.run("claimed.p1='10:00 AM Oct 23'"); w.setNow(BASE + 20 * 60000);
  const spent2 = w.run("mmOnDone('p1','10:20 AM Oct 23')");
  ok("Mom's later approve: spent still counts to the kid's 'send to Mom' (9)", spent2 === 9, spent2);
  ok("…and no second line", w.writes.filter(x => /minAlerts/.test(x.path)).length === 1);
  const now = w.run("mmAlertsNowHTML()");
  ok("Mom's Day 🔴 Now shows one ⏱ Timed cards row with ✓ Got it", now.n === 1 && /Timed cards/.test(now.html) && /Lincoln finished Piano at 9 of 15 minutes/.test(now.html) && /mmAlertDismiss\('early_p1_2026-10-23'\)/.test(now.html));
  ok("the Home Base list sees it too", w.run("mmAlertList()").length === 1);
  w.run("mmAlertDismiss('early_p1_2026-10-23')");
  const rm = w.writes.filter(x => x.op === "remove");
  ok("✓ Got it is one targeted remove of that record", rm.length === 1 && rm[0].path === "week8/minAlerts/early_p1_2026-10-23" && w.run("mmAlertsNowHTML()").n === 0, rm);
  // on time → no line at all
  const w2 = world({ tasks: [card("p1", "piano")], rules: { minMinutes: { early: "tell" } } });
  w2.startAgo("p1", 14);
  ok("14 of 15 (inside grace): checks, no line", w2.run("mmOnDone('p1','10:00 AM Oct 23')") === 14 && w2.writes.length === 0);
}

console.log("\n── 5. a card with no clock at all (no Start, nothing checked, no day start) — counts as 0 minutes ──");
{
  const w = world({ tasks: [card("p1", "piano")] });
  ok("Not yet: blocked, 'Not yet — 13 min to go' and nothing more", w.run("mmTapGate(weekData.tasks[0])") === true && w.toasts[0] === "⏱ Not yet — 13 min to go", w.toasts[0]);
  const w2 = world({ tasks: [card("p1", "piano")], rules: { minMinutes: { early: "tell" } } });
  ok("Let it through: the tap goes through", w2.run("mmTapGate(weekData.tasks[0])") === false);
  const spent = w2.run("mmOnDone('p1','10:00 AM Oct 23')");
  const al = w2.writes.filter(x => /minAlerts/.test(x.path));
  ok("one line: 'Lincoln finished Piano at 0 of 15 minutes (no Start tap)' — no '(never started)'", al.length === 1 && al[0].val.text === "Lincoln finished Piano at 0 of 15 minutes (no Start tap)", al);
  ok("no clock → no spent minutes in history, no spentFrom", spent === null && w2.run("mmSpentFrom('p1')") === "");
}

console.log("\n── 6. Mom's own tap never waits and never alerts; Dad's neither ──");
{
  const w = world({ tasks: [card("p1", "piano")], mom: true });
  w.startAgo("p1", 2);
  ok("Mom mode: the gate stays open", w.run("mmTapGate(weekData.tasks[0])") === false);
  ok("Mom's check at 2 min: spent recorded (2), no line to herself", w.run("mmOnDone('p1','10:00 AM Oct 23')") === 2 && w.writes.length === 0);
  const d = world({ tasks: [card("p1", "piano")], dad: true });
  d.startAgo("p1", 2);
  ok("Dad's tap: the gate stays open, no line", d.run("mmTapGate(weekData.tasks[0])") === false && d.run("mmOnDone('p1','10:00 AM Oct 23')") === 2 && d.writes.length === 0);
}

console.log("\n── 7. the overrun line — once per card per day, past double the target ──");
{
  const w = world({ tasks: [card("p1", "piano"), card("m1", "math")] });
  w.startAgo("p1", 29);
  let sig = w.run("mmTick()");
  ok("29 min open (under 2×15): no line", w.writes.length === 0);
  ok("a card past its target no longer forces a re-render each minute", sig === "", sig);
  w.startAgo("p1", 30);
  w.run("mmTick()");
  const al = w.writes.filter(x => /minAlerts/.test(x.path));
  ok("30 min: ONE line at week8/minAlerts/over_p1_2026-10-23", al.length === 1 && al[0].path === "week8/minAlerts/over_p1_2026-10-23", al);
  ok("it reads 'Lincoln’s Piano has been open 30 minutes (15 planned)'", al[0].val.text === "Lincoln’s Piano has been open 30 minutes (15 planned)", al[0].val.text);
  w.startAgo("p1", 32); w.run("mmTick()"); w.setNow(BASE + 60000); w.run("mmTick()");
  ok("later ticks the same day add nothing", w.writes.filter(x => /minAlerts/.test(x.path)).length === 1);
  w.run("checked.p1='x'"); w.run("mmTick()");
  ok("a checked card is left alone", w.writes.filter(x => /minAlerts/.test(x.path)).length === 1);
  const off = world({ tasks: [card("p1", "piano")], rules: { minMinutes: { over: false } } });
  off.startAgo("p1", 45); off.run("mmTick()");
  ok("rule off: no overrun line", off.writes.length === 0);
  const tomorrow = world({ tasks: [card("p1", "piano")] });
  tomorrow.ctx._todayStr = () => "2026-10-24"; tomorrow.startAgo("p1", 45); tomorrow.run("mmTick()");
  ok("another day is another key (once per card per DAY)", tomorrow.writes[0].path === "week8/minAlerts/over_p1_2026-10-24", tomorrow.writes);
  const fresh = world({ tasks: [card("p1", "piano")] });
  fresh.startAgo("p1", 4);
  const s1 = fresh.run("mmTick()"); fresh.setNow(BASE + 60000); const s2 = fresh.run("mmTick()");
  ok("while a countdown is on screen the tick signature changes each minute (the body re-renders)", s1 && s2 && s1 !== s2, [s1, s2]);
  ok("an untimed card (math) never shows in the signature", !/m1/.test(s1));
}

console.log("\n── 8. ▶ Start — one targeted write on the week's started node ──");
{
  const w = world({ tasks: [card("p1", "piano")] });
  w.run("mmStart('p1')");
  ok("week8/started/p1 = the tap time (ms)", w.writes.length === 1 && w.writes[0].op === "set" && w.writes[0].path === "week8/started/p1" && w.writes[0].val === BASE, w.writes);
  ok("the local mirror follows (week8_started)", w.run("ld('week8_started')").p1 === BASE);
  w.setNow(BASE + 5 * 60000); w.run("mmStart('p1')");
  ok("a second tap does not restart the clock", w.writes.length === 1 && w.run("mmStartMs('p1')") === BASE);
  ok("the countdown now reads 10 min left", w.run("mmCountdownText(weekData.tasks[0])") === "10 min left");
  ok("a start saved as a check-style stamp is read too", (w.run("started.q1='09:40 AM Oct 23'; mmElapsed('q1')") | 0) === 25);
  w.run("checked.z1='x'; mmStart('z1')");
  ok("a checked card can't be started", w.writes.length === 1);
}

console.log("\n── 9. Mom's view of a checked card: ⏱ minutes spent on the done row ──");
{
  const w = world({ mom: true });
  w.run("histState.p1={id:'p1',ts:'10:14 AM Oct 23',spent:14}; histState.p2={id:'p2',ts:'10:14 AM Oct 23'}");
  ok("Mom sees ⏱ 14 min", /⏱ 14 min/.test(w.run("mmSpentChip('p1')")));
  ok("no start recorded → no chip", w.run("mmSpentChip('p2')") === "");
  const k = world({ mom: false });
  k.run("histState.p1={id:'p1',spent:14}");
  ok("the kid's view shows no chip", k.run("mmSpentChip('p1')") === "");
}

console.log("\n── 10. the Family rule card and the subject editor write one field at a time ──");
{
  const w = world({ mom: true });
  w.run("mmRuleSet('grace','3'); mmRuleSet('early','tell'); mmRuleSet('over',false)");
  ok("three targeted writes under config/rules/minMinutes", w.writes.map(x => x.path + "=" + JSON.stringify(x.val)).join(",") === "config/rules/minMinutes/grace=3,config/rules/minMinutes/early=\"tell\",config/rules/minMinutes/over=false", w.writes);
  ok("mmRules reads them back", JSON.stringify(w.run("mmRules()")) === JSON.stringify({ grace: 3, early: "tell", over: false }));
  w.run("mmRuleSet('early','bogus'); mmRuleSet('grace','-4')");
  ok("bad values fall back to the defaults", w.run("mmRules().early") === "wait" && w.run("mmRules().grace") === 2);
  const html = w.run("mmRulesCardHTML()");
  ok("the card has Grace, the two choices and the double-time switch", /Timed cards/.test(html) && /Grace/.test(html) && /Not yet/.test(html) && /Let it through and tell me/.test(html) && /double its time/.test(html));
  const kid = world({ mom: false });
  kid.run("mmRuleSet('grace','9')");
  ok("not Mom → no write", kid.writes.length === 0);
  // the subject editor
  const e = world({ mom: true });
  e.run("mmEditorSet('minMin','10'); mmEditorSet('minMin',''); mmEditorSet('minShow',false)");
  ok("ceSaveField: minMin 10 · blank → 0 (off) · minShow false", JSON.stringify(e.ceSaved) === JSON.stringify([["minMin", 10], ["minMin", 0], ["minShow", false]]), e.ceSaved);
  const sec = world().run("mmEditorSectionHTML('lincoln','piano',currData.subjects.lincoln.piano)");
  ok("a practice subject's editor shows its derived 15 and says it's the default", /value="15"/.test(sec) && /On by default/.test(sec) && /Show the countdown to the kid/.test(sec), sec);
  const sec2 = world().run("mmEditorSectionHTML('lincoln','math',currData.subjects.lincoln.math)");
  ok("lesson work shows blank (off) and says so", /value=""/.test(sec2) && /Off by default/.test(sec2));
}

console.log("\n── 11. an untimed subject is untouched — and the hooks are one guarded line each ──");
{
  const w = world({ tasks: [card("m1", "math")] });
  ok("mmTapGate → false, no toast, no write", w.run("mmTapGate(weekData.tasks[0])") === false && w.toasts.length === 0 && w.writes.length === 0);
  ok("mmCardRow → '' (the card renders exactly as before)", w.run("mmCardRow(weekData.tasks[0],false,false,false)") === "");
  ok("mmOnDone → null, nothing sent", w.run("mmOnDone('m1','10:30 AM Oct 23')") === null && w.writes.length === 0);
  ok("mmSpentChip → ''", w.run("mmSpentChip('m1')") === "");
  const tt = src.slice(src.indexOf("function tapTask(id){"), src.indexOf("document.getElementById(\"dlg-ok\").onclick"));
  ok("tapTask carries exactly one MINMINUTES line, typeof-guarded, before the dialog", (tt.match(/mmTapGate/g) || []).length === 2 && /if\(typeof mmTapGate==="function"&&mmTapGate\(t\)\) return;/.test(tt));
  const tc0 = src.indexOf("function taskCard(t, fromDay, readOnly, doneId){"); const tc = src.slice(tc0, src.indexOf("// ── BRAIN BREAK", tc0));
  ok("taskCard: the row and the chip are each one typeof-guarded call", /\(\(typeof mmCardRow==="function"&&mmCardRow\(t,done,claimedHere,readOnly\)\)\|\|""\)/.test(tc) && /\(\(typeof mmSpentChip==="function"&&mmSpentChip\(srcId\)\)\|\|""\)/.test(tc));
  const fd = src.slice(src.indexOf("function finalizeDone(id, doneTs, score){"), src.indexOf("// EFPULL_START"));
  ok("finalizeDone: spent is read before the claim is cleared and lands on the history entry (with spentFrom when a fallback clock counted)", fd.indexOf("_mmSpent=mmOnDone(id,doneTs)") > 0 && fd.indexOf("_mmSpent=mmOnDone(id,doneTs)") < fd.indexOf("if(claimed[id]!=null){") && /if\(_mmSpent!=null\)\{ entry\.spent=_mmSpent; const _mf=\(typeof mmSpentFrom==="function"\)\?mmSpentFrom\(id\):""; if\(_mf\) entry\.spentFrom=_mf; \}/.test(fd));
  ok("the history hook is still one line", (fd.match(/mmSpentFrom/g) || []).length === 2 && fd.split("\n").filter(l => /mmSpentFrom/.test(l)).length === 1);
  ok("the block itself never writes a whole node (every write is …/<id> or …/<field>)", !/db\.ref\(WK\+"\/(started|minAlerts)"\)\.set/.test(BLOCK) && !/db\.ref\("config\/rules\/minMinutes"\)\.set/.test(BLOCK));
  ok("no scheduler code is touched (no lay / pack / sweep calls in the block)", !/mlQueueLay|dsRetime|cascadeIntraWeek|efPullNext|bumpSkippedInTier|pushTaskForward/.test(BLOCK));
  ok("no 🔀 anywhere", src.indexOf("🔀") < 0);
}

console.log("\n── 12. a forgotten Start counts from the last check-off (or the day start), up to 15 minutes (her decision 2026-10-23) ──");
{
  const AGO = m => { const d = new Date(BASE - m * 60000); let h = d.getHours(), ap = h >= 12 ? "PM" : "AM"; h = h % 12 || 12; return String(h).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0") + " " + ap + " Oct 23"; };
  const tasks = () => [card("p1", "piano"), card("r1", "reading"), card("m1", "math"), card("e1", "piano", { who: "ellis" })];
  ok("MM_FALLBACK_CAP is 15 and sits in the block", world().run("MM_FALLBACK_CAP") === 15 && /const MM_FALLBACK_CAP=15;/.test(BLOCK));
  // no Start, last check-off 20 min ago, minimum 15 → ready
  const w = world({ tasks: tasks() });
  w.run("checked.m1=" + JSON.stringify(AGO(20)));
  ok("no Start, Math checked 20 min ago: Piano reads 'ready ✓' (credited 15, the cap)", w.run("mmCountdownText(weekData.tasks[0])") === "ready ✓" && (w.run("mmElapsed('p1')") | 0) === 15, w.run("mmCountdownText(weekData.tasks[0])"));
  ok("…and the check goes through under Not yet", w.run("mmTapGate(weekData.tasks[0])") === false && w.toasts.length === 0);
  ok("the clock says where it counts from", JSON.stringify(w.run("mmClock('p1')")) === JSON.stringify({ ms: BASE - 15 * 60000, from: "check" }), w.run("mmClock('p1')"));
  // no Start, last check-off 9 min ago → Not yet — 4 min to go
  const w2 = world({ tasks: tasks() });
  w2.run("checked.m1=" + JSON.stringify(AGO(9)));
  ok("no Start, Math checked 9 min ago: Piano reads '6 min left'", w2.run("mmCountdownText(weekData.tasks[0])") === "6 min left", w2.run("mmCountdownText(weekData.tasks[0])"));
  ok("the tap stops with 'Not yet — 4 min to go' (grace 2) and no 'tap Start first'", w2.run("mmTapGate(weekData.tasks[0])") === true && w2.toasts[0] === "⏱ Not yet — 4 min to go", w2.toasts[0]);
  const row = w2.run("mmCardRow(weekData.tasks[0],false,false,false)");
  ok("the card shows the countdown, 'since your last check-off' under it, and still ▶ Start", /⏱ 6 min left/.test(row) && /since your last check-off/.test(row) && /mmStart\('p1'\)/.test(row) && row.indexOf("6 min left") < row.indexOf("since your last") && row.indexOf("since your last") < row.indexOf("mmStart"), row);
  ok("a kid's 'send to Mom' counts as their check-off too", (w2.run("delete checked.m1; claimed.m1=" + JSON.stringify(AGO(9)) + "; mmElapsed('p1')") | 0) === 9);
  ok("another kid's check-off is not this kid's", w2.run("delete claimed.m1; checked.e1=" + JSON.stringify(AGO(9)) + "; mmElapsed('p1')") === null);
  ok("a check-off from another day is not today's", w2.run("checked.m1='10:00 AM Oct 22'; mmElapsed('p1')") === null);
  ok("the most RECENT check-off wins", (w2.run("checked.m1=" + JSON.stringify(AGO(12)) + "; checked.r1=" + JSON.stringify(AGO(4)) + "; mmElapsed('p1')") | 0) === 4);
  // a 60-minute lunch gap credits 15
  const w3 = world({ tasks: tasks() });
  w3.run("checked.m1=" + JSON.stringify(AGO(60)));
  ok("60-min gap: Piano (15 min) is ready", w3.run("mmCountdownText(weekData.tasks[0])") === "ready ✓" && w3.run("mmTapGate(weekData.tasks[0])") === false);
  // MMCAPLONG (her yes 2026-10-27): a 20-minute card is credited up to its own 20 — it used to stick at "5 min left" forever
  ok("60-min gap: Reading (20 min) is ready too (credited its own 20, not the flat 15)", w3.run("mmCountdownText(weekData.tasks[1])") === "ready ✓" && (w3.run("mmElapsed('r1')") | 0) === 20, w3.run("mmCountdownText(weekData.tasks[1])"));
  ok("…and its check goes through under Not yet", w3.run("mmTapGate(weekData.tasks[1])") === false, w3.toasts);
  // first card of the day uses the day start
  const w4 = world({ tasks: tasks() });
  w4.ctx.dayStarts = { friday: { lincoln: "9:50 AM" } };
  ok("nothing checked yet: the day start (9:50) counts → 10 min elapsed, '5 min left'", (w4.run("mmElapsed('p1')") | 0) === 10 && w4.run("mmCountdownText(weekData.tasks[0])") === "5 min left", w4.run("mmElapsed('p1')"));
  const row4 = w4.run("mmCardRow(weekData.tasks[0],false,false,false)");
  ok("the card says 'since your day started' and keeps ▶ Start", /since your day started/.test(row4) && /mmStart\('p1'\)/.test(row4), row4);
  ok("a day start 40 min back is capped at 15 → ready", w4.run("dayStarts.friday.lincoln='9:20 AM'; mmCountdownText(weekData.tasks[0])") === "ready ✓");
  ok("another kid's day start is not this kid's", w4.run("dayStarts.friday={ellis:'9:20 AM'}; mmElapsed('p1')") === null);
  ok("a check-off beats the day start", (w4.run("dayStarts.friday.lincoln='9:20 AM'; checked.m1=" + JSON.stringify(AGO(3)) + "; mmElapsed('p1')") | 0) === 3 && w4.run("mmClock('p1').from") === "check");
  // an explicit Start wins over a later check-off
  const w5 = world({ tasks: tasks() });
  w5.startAgo("p1", 12); w5.run("checked.m1=" + JSON.stringify(AGO(3)));
  ok("Start 12 min ago, Math checked 3 min ago: the Start clock counts (12)", (w5.run("mmElapsed('p1')") | 0) === 12 && w5.run("mmClock('p1').from") === "start");
  const row5 = w5.run("mmCardRow(weekData.tasks[0],false,false,false)");
  ok("a started card shows no fallback note and no ▶ Start", /⏱ 3 min left/.test(row5) && !/since your/.test(row5) && !/mmStart/.test(row5), row5);
  // tapping Start switches to the real clock from that moment
  const w6 = world({ tasks: tasks() });
  w6.run("checked.m1=" + JSON.stringify(AGO(9)));
  ok("fallback at 9 min…", (w6.run("mmElapsed('p1')") | 0) === 9);
  w6.run("mmStart('p1')");
  ok("…▶ Start restarts at 0 from now (the real clock wins)", w6.run("mmElapsed('p1')") === 0 && w6.run("mmCountdownText(weekData.tasks[0])") === "15 min left" && w6.writes.length === 1 && w6.writes[0].path === "week8/started/p1");
  // the fallback never fires the overrun alert
  const w7 = world({ tasks: tasks() });
  w7.run("checked.m1=" + JSON.stringify(AGO(90)));
  w7.run("mmTick()"); w7.setNow(BASE + 60 * 60000); w7.run("mmTick()");
  ok("a fallback clock never sends the overrun line (Start tap only)", w7.writes.length === 0, w7.writes);
  ok("a capped fallback clock no longer forces a re-render each minute", w7.run("mmTick()") === "");
  const w7b = world({ tasks: tasks() });
  w7b.run("checked.m1=" + JSON.stringify(AGO(4)));
  const s1 = w7b.run("mmTick()"); w7b.setNow(BASE + 60000); const s2 = w7b.run("mmTick()");
  ok("while a fallback countdown is moving the tick signature changes each minute", s1 && s2 && s1 !== s2, [s1, s2]);
  // Mom's early-check line and the history entry carry the note
  const w8 = world({ tasks: tasks(), rules: { minMinutes: { early: "tell" } } });
  w8.run("checked.m1=" + JSON.stringify(AGO(9)) + "; checked.p1=" + JSON.stringify(AGO(0)));   // finalizeDone has already stamped p1 when mmOnDone runs
  const spent8 = w8.run("mmOnDone('p1','10:00 AM Oct 23')");
  const al8 = w8.writes.filter(x => /minAlerts/.test(x.path));
  ok("Let it through: spent = 9 from the fallback, the card's own stamp is skipped", spent8 === 9, spent8);
  ok("Mom's line: 'Lincoln finished Piano at 9 of 15 minutes (no Start tap — counted from the last check-off)'", al8.length === 1 && al8[0].val.text === "Lincoln finished Piano at 9 of 15 minutes (no Start tap — counted from the last check-off)", al8);
  ok("the history hook learns the clock: spentFrom = 'check'", w8.run("mmSpentFrom('p1')") === "check");
  w8.run("histState.p1={id:'p1',ts:'10:00 AM Oct 23',spent:9,spentFrom:'check'}");
  const kidChip = w8.run("mmSpentChip('p1')");
  ok("the kid's view shows no chip", kidChip === "");
  w8.ctx.momHereCards = () => true;
  const chip = w8.run("mmSpentChip('p1')");
  ok("Mom's done row: ⏱ 9 min (no Start tap — counted from the last check-off)", /⏱ 9 min/.test(chip) && /\(no Start tap — counted from the last check-off\)/.test(chip), chip);
  w8.run("histState.p2={id:'p2',ts:'10:00 AM Oct 23',spent:14}");
  ok("a started card's chip carries no note", /⏱ 14 min/.test(w8.run("mmSpentChip('p2')")) && !/no Start tap/.test(w8.run("mmSpentChip('p2')")));
  const w9 = world({ tasks: tasks(), rules: { minMinutes: { early: "tell" } } });
  w9.ctx.dayStarts = { friday: { lincoln: "9:55 AM" } }; w9.run("checked.p1=" + JSON.stringify(AGO(0)));
  const spent9 = w9.run("mmOnDone('p1','10:00 AM Oct 23')");
  ok("first card of the day: 5 min from the day start, the line says '(no Start tap — counted from the day start)'", spent9 === 5 && w9.writes[0].val.text === "Lincoln finished Piano at 5 of 15 minutes (no Start tap — counted from the day start)" && w9.run("mmSpentFrom('p1')") === "day", w9.writes);
  // a started card is untouched by all this
  const w10 = world({ tasks: tasks(), rules: { minMinutes: { early: "tell" } } });
  w10.startAgo("p1", 9); w10.run("checked.m1=" + JSON.stringify(AGO(2)));
  ok("Start tapped: the line has no note and spentFrom is ''", w10.run("mmOnDone('p1','10:00 AM Oct 23')") === 9 && w10.writes[0].val.text === "Lincoln finished Piano at 9 of 15 minutes" && w10.run("mmSpentFrom('p1')") === "");
  // untimed and Family Time stay out
  const w11 = world({ tasks: tasks().concat([card("f1", "piano", { famBlock: "fb1" })]) });
  w11.run("checked.m1=" + JSON.stringify(AGO(9)));
  ok("a card with no minMin (math) is byte-identical to base: no row, no gate, no clock use", w11.run("mmCardRow(weekData.tasks[2],false,false,false)") === "" && w11.run("mmTapGate(weekData.tasks[2])") === false && w11.run("mmCountdownText(weekData.tasks[2])") === "" && w11.run("mmOnDone('m1','10:00 AM Oct 23')") === null);
  ok("a Family Time card stays untimed", w11.run("mmCardRow(weekData.tasks[4],false,false,false)") === "" && w11.run("mmTapGate(weekData.tasks[4])") === false);
  ok("nothing new was written to Firebase by any of this", w11.writes.length === 0 && w.writes.length === 0 && w2.writes.length === 0 && w3.writes.length === 0 && w4.writes.length === 0);
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
