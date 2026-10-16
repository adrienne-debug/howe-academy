/*
 * Node tests — 👨 DADFIX (her report + answers 2026-10-11): Dad's Day as a school helper.
 *  A  the cards he picked (helperHolds → his id) are on Dad's Day — in 🗓 My schedule today — each with a check-off (dadTap →
 *     the dialog Mom's tap opens); confirming writes the same check as Mom's, noted helper:"Dad", never a kid-style claim.
 *  B  Dad's Day ▸ All draws the Schedule's All agenda with a 👨 Dad column; kid cards are checkable with dadTap (counts like
 *     Mom's, "done with Dad"); Mom's/kids' All agenda and taskCard output are unchanged.
 *  C  his TIMED day: helper cards at their laid time, loads he started (by:"dad") on the laundry clock, his checklist in its
 *     time of day (7:00 AM / 12:00 PM / 5:00 PM, ongoing = any time). Mom's lane functions are byte-identical to origin/main.
 *  D  a card Mom sent him shows "Mom sent you" — before he checks in too — and checks off the same way.
 *  3  "Give Dad more today" works any day the Dad profile exists (no regular hours needed).
 *
 *   run:  node test_dads_day_helper.js
 */
const fs = require("fs"), vm = require("vm"), path = require("path"), cp = require("child_process");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
let old = null;
try { old = cp.execSync("git show origin/main:index.html", { cwd: __dirname, maxBuffer: 1 << 28, stdio: ["ignore", "pipe", "ignore"] }).toString("utf8"); } catch (e) {}
let pass = 0, fail = 0;
function ok(name, cond, extra) { if (cond) { pass++; console.log("  ok  - " + name); } else { fail++; console.log("  FAIL- " + name + (extra !== undefined ? "  (" + JSON.stringify(extra).slice(0, 400) + ")" : "")); } }
function sliceFrom(text, name) {
  const i = text.indexOf("function " + name + "("); if (i < 0) return null;
  let d = 0;
  for (let k = text.indexOf("{", i); k < text.length; k++) { if (text[k] === "{") d++; else if (text[k] === "}" && --d === 0) return text.slice(i, k + 1); }
  throw new Error("unbalanced: " + name);
}
function constFrom(text, name) { const i = text.indexOf("const " + name + "="); if (i < 0) throw new Error("const " + name); let d = 0;
  for (let k = text.indexOf("=", i) + 1; k < text.length; k++) { const c = text[k]; if (c === "{" || c === "[") d++; else if (c === "}" || c === "]") d--; else if (c === ";" && d === 0) return text.slice(i, k + 1); } }
const d0 = new Date(), TODAY = d0.getFullYear() + "-" + String(d0.getMonth() + 1).padStart(2, "0") + "-" + String(d0.getDate()).padStart(2, "0");
const mid = new Date(); mid.setHours(0, 0, 0, 0); const AT = m => mid.getTime() + m * 60000;
const C = (id, who, sk, time, mom) => ({ id, who, subjectKey: sk, day: "wednesday", time, dur: 20, title: "📘 " + id, detail: "do " + id, mom: mom || "required" });
const T = [C("l_read", "lucy", "read", "10:00 AM"), C("e_sci", "ellis", "sci", "11:00 AM"), C("l_math", "lucy", "math", "1:00 PM"), C("e_free", "ellis", "free", "10:00 AM", "none")];
const DAD = { name: "Dad", icon: "👨", createdAt: 1, dadPage: true, pick: true, help: { lucy: { read: true }, ellis: { sci: true } } };   // no regular hours
const GMA = { name: "Grandma", icon: "👵", createdAt: 2, help: { lucy: { math: true } } };

// ── the HELPERS block + his timed-day functions, run as-is ─────────────────────────────
const SCHED = ["dadSchedLaundry", "dadSchedItems", "_ddSchedBox", "dadSchedHTML", "dcAll", "dcDoneOn", "ddDueToday", "mcSlotOf",
  "_lbBox", "_lbBtn", "_lbMin", "_lbNowMin", "_lbQ", "laundrySince", "laundryDoneAt", "laundryT", "laundryAdvanceLabel", "fromMin"];
function helpers(sess, give, o, text) {
  o = o || {}; text = text || src;
  const a = text.indexOf("// ── HELPERS_START"), b = text.indexOf("// ── HELPERS_END");
  const ctx = { console, db: null, _dryRun: () => !o.db, momHere: () => !!o.mom, pageOn: () => true, DAYS: ["wednesday"], ROSTER: ["lucy", "ellis"],
    weekData: { tasks: T }, getActiveTasks: () => T, checked: o.checked || {}, KID_COLOR: { lucy: "#be185d", ellis: "#1d4ed8" },
    cap: s => String(s).charAt(0).toUpperCase() + String(s).slice(1), esc: s => String(s == null ? "" : s).replace(/&(?![#a-z0-9]+;)/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;"),
    document: { activeElement: null, getElementById: () => null, createElement: () => ({}), body: { appendChild: () => {} } },
    dadUnlocked: false, _kioskD: () => o.kiosk !== false, kitPinGate: () => { ctx.__gated = (ctx.__gated || 0) + 1; }, renderAll: () => {},
    dadChoresData: o.dadChores || {}, daddayData: o.dadday || {}, laundryData: o.laundry || {}, laundryTimes: {}, _todayStr: () => TODAY,
    cadDueOn: (cad) => (cad || "daily") === "daily" || cad === "wk:2", mpSchTasks: () => (o.lay || T),
    Date, Object, Array, String, Number, JSON, Math, parseInt, isNaN, RegExp };
  Object.defineProperty(ctx, "_todayDay", { get: () => "wednesday" });
  vm.createContext(ctx);
  const writes = []; ctx.__writes = writes;
  if (o.db) ctx.db = { ref: p => ({ set: v => writes.push(["set", p, v]), remove: () => writes.push(["remove", p]), update: v => writes.push(["update", p, v]) }) };
  const extra = text === src ? SCHED.map(n => sliceFrom(text, n)).join("\n") + "\n" + ["MC_SLOTS", "DAD_SLOT_MIN", "LAUNDRY_STAGE_META"].map(c => constFrom(text, c)).join("\n") : "";
  vm.runInContext(sliceFrom(text, "toMin") + "\n" + text.slice(a, b) + "\n" + extra + "\nthis.__set=(h,d,g)=>{helpersData=h;helperDaysData=d||{};helperGiveData=g||{};};", ctx);
  ctx.__set(o.helpers || { dad: DAD }, { [TODAY]: { dad: sess || {} } }, { [TODAY]: { dad: give || {} } });
  return ctx;
}
const txt = h => h.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

console.log("A — the cards he picked are on his page, with a check-off");
let H = helpers({ arrived: 1, took: { l_read: true } });
let card = H.helperDadCardHTML(), items = H.dadSchedItems("wednesday"), sched = H.dadSchedHTML("wednesday");
ok("helper card: 1 to do, pointing at his schedule", txt(card).includes("1 to do") && card.includes("on your schedule below"), txt(card));
ok("his picked card is on 🗓 My schedule today, at its time", sched.includes('data-dadcard="l_read"') && items.some(x => x.kind === "card" && x.id === "l_read" && x.m === 600), items);
ok("…with a check-off: dadTap (the dialog Mom's tap opens)", sched.includes("onclick=\"dadTap('l_read')\""));
ok("a card he didn't pick stays off", !sched.includes("e_sci") && !sched.includes("e_free"));
ok("on his ?kiosk=dad link the dead \"My list\" jump is gone; in the app it stays", !card.includes("selHelper(") && helpers({ arrived: 1, took: { l_read: true } }, {}, { kiosk: false }).helperDadCardHTML().includes("selHelper('dad')"));
ok("Pick my cards / I'm done helping still there", card.includes("helpersPopOpen('dad')") && card.includes("helperLeave('dad')"));
sched = helpers({ arrived: 1, took: { l_read: true } }, {}, { checked: { l_read: "10:20 AM" } }).dadSchedHTML("wednesday");
ok("checked → the row shows ✓ and done", sched.includes("&#10003;") && txt(sched).includes("done"));
ok("the live lay's time wins (▸ All and his day agree)", helpers({ arrived: 1, took: { l_read: true } }, {}, { lay: [Object.assign({}, T[0], { time: "10:40 AM" })] }).dadSchedItems("wednesday")[0].m === 640);
if (old) {
  ok("origin/main reproduces A: his picked card is NOT on his page", (() => { const c = helpers({ arrived: 1, took: { l_read: true } }, {}, {}, old); const h = c.helperDadCardHTML(); return c.helperHolds(T[0]) === "dad" && !h.includes("l_read"); })());
}

// ── the check-off itself: dadTap / tapTask → dlg-ok → finalizeDone, run for real ─────────
function checkOff(id, who, Hc, viaDad, taskOver) {
  const writes = [], els = {}, toasts = [];
  const el = k => (els[k] = els[k] || { id: k, style: {}, textContent: "", innerHTML: "", onclick: null });
  const env = {
    weekData: { tasks: T.map(t => Object.assign({}, t, (taskOver || {})[t.id] || {})) }, checked: {}, claimed: {}, histState: {}, momMoves: {}, pendingSpins: {}, DAY_DT: {}, DAYS: ["wednesday"], WK: "week26",
    manualUnchecks: new Set(), pendingId: null, pendingClaimMode: false, lastCheckedWrite: 0, _todayDay: "wednesday", day: "wednesday",
    db: { ref: p => ({ set: v => { writes.push(["set", p, v]); }, remove: () => writes.push(["remove", p]), update: v => writes.push(["update", p, v]) }) },
    document: { getElementById: el }, nowTs: () => "10:20 AM", checkoffHeld: () => false, momHere: () => who === "mom", momHereCards: () => who === "mom",
    needsVerify: t => t.mom === "required", effectiveDay: t => t.day, helperHolds: t => Hc.helperHolds(t), helperName: id => Hc.helperName(id), helperDadId: () => Hc.helperDadId(),
    ld: () => null, sv: () => {}, taskLessonRef: () => "", renderAll: () => {}, obSet: (p, v) => writes.push(["claim", p, v]), gwShowToast: t => toasts.push(t),
    _isNextUpLesson: () => false, paceData: {}, _nextSchoolDay: () => null, famKidsRate: () => false,
  };
  const noop = function () {};
  const scope = new Proxy(env, { has: () => true, get: (t, k) => k === Symbol.unscopables ? undefined : (k in t ? t[k] : (k in globalThis ? globalThis[k] : noop)), set: (t, k, v) => { t[k] = v; return true; } });
  const okH = src.slice(src.indexOf('document.getElementById("dlg-ok").onclick='), src.indexOf('document.getElementById("dlg-uncheck").onclick='));
  const code = "var dadTapCtx=false;\n" + ["tapTask", "finalizeDone", "closeDlg", "dadTap", "dadTapName"].map(n => sliceFrom(src, n)).join("\n") + "\n" + okH + "\nreturn {tapTask,dadTap,ctx:()=>dadTapCtx};";
  const api = new Function("__s", "with(__s){" + code + "}")(scope);
  (viaDad ? api.dadTap : api.tapTask)(id);
  const label = el("dlg-ok").textContent, open = el("dlg").style.display === "flex", ctxOpen = api.ctx();
  if (open) el("dlg-ok").onclick();
  return { writes, env, label, open, ctxOpen, ctxAfter: api.ctx(), toasts };
}
let r = checkOff("l_read", "dad", H, true);
ok("Dad's dialog says ✓ Mark Done (not \"send to Mom\")", r.label === "✓ Mark Done", r.label);
ok("confirming writes the check: week26/checked/l_read", r.writes.some(w => w[0] === "set" && w[1] === "week26/checked/l_read" && w[2] === "10:20 AM"), r.writes);
const hist = r.writes.find(w => w[1] === "week26/history/l_read");
ok("…and the history entry, marked done with Dad", hist && hist[2].helper === "Dad" && hist[2].who === "lucy", hist);
ok("…never a claim waiting for Mom", !r.writes.some(w => w[0] === "claim"));
ok("…and Dad's tap mode switches off after", r.ctxOpen === true && r.ctxAfter === false);
const m = checkOff("l_read", "mom", helpers({}), false);
ok("Mom's own check writes the same two paths (no helper note)", ["week26/checked/l_read", "week26/history/l_read"].every(p => m.writes.some(w => w[1] === p)) && !(m.writes.find(w => w[1] === "week26/history/l_read")[2].helper), m.writes);

console.log("B — Dad's Day ▸ All: a 👨 Dad column, and he can check off");
r = checkOff("e_sci", "dad", helpers({}), true);
ok("a kid's Mom card that isn't his: Dad's tap is a real check (not a claim)", r.label === "✓ Mark Done" && r.writes.some(w => w[1] === "week26/checked/e_sci") && !r.writes.some(w => w[0] === "claim"), r.writes);
ok("…noted done with Dad", (r.writes.find(w => w[1] === "week26/history/e_sci") || [])[2].helper === "Dad");
const kidR = checkOff("e_sci", "kid", helpers({}), false);
ok("(control) a kid's own tap on that card is still a claim", kidR.writes.some(w => w[0] === "claim") && !kidR.writes.some(w => w[1] === "week26/checked/e_sci"));
r = checkOff("e_sci", "dad", helpers({}), true, { e_sci: { famBlock: "fb1" } });
ok("family time stays Mom's (toast, no dialog) and Dad's tap mode switches off", !r.open && r.ctxAfter === false && r.toasts.length === 1 && !r.writes.length);
function agenda(text, opt) {
  const env = { SL_KIDS: ["lucy", "ellis"], SL_KCOL: { lucy: "#be185d", ellis: "#1d4ed8" }, day: "wednesday",
    cap: s => String(s).charAt(0).toUpperCase() + String(s).slice(1), fromMin: m => (Math.floor(m / 60) % 12 || 12) + ":" + String(m % 60).padStart(2, "0") + (m >= 720 ? " PM" : " AM"),
    gateLookAhead: () => false, isScheduleUnlocked: k => k !== "ellis", gateClockHeld: () => false, morningComplete: () => false, gateStartMin: () => 540, rulesData: {},
    taskCard: (t, f, ro2) => '<div class="task-card" data-id="' + t.id + '"' + (ro2 ? ' data-ro="1"' : ' onclick="tapTask(\'' + t.id + '\')"') + ">" + t.title + "</div>" };
  const fns = ["toMin", "_agLunchFmt", "_agLunchRow", "allAgendaHtml"].map(n => sliceFrom(text, n)).join("\n");
  const keys = Object.keys(env);
  return new Function(...keys, fns + "\nreturn allAgendaHtml;")(...keys.map(k => env[k]))(T, null, opt);
}
const ex = { key: "dad", label: "👨 Dad", color: "#2C5F8A", items: [{ m: 600, html: "<!--DAD10-->" }, { m: 420, html: "<!--DAD7-->" }, { m: null, html: "<!--DADANY-->" }] };
const exH = agenda(src, { extra: ex });
ok("All agenda gets a 👨 Dad column first (5 columns: Dad + kids)", exH.includes('--allk:3') && exH.indexOf("👨 Dad") < exH.indexOf(">Lucy<"), exH.slice(0, 300));
ok("…his items on the clock (7:00 row before 10:00) and any-time last", exH.indexOf("DAD7") < exH.indexOf("DAD10") && exH.indexOf("DAD10") < exH.indexOf("DADANY"));
ok("…kids' cards still there, tappable", exH.includes("onclick=\"tapTask('l_read')\"") && exH.includes("data-id=\"e_sci\""));
if (old) ok("Mom's/kids' All agenda (no opt) is byte-for-byte origin/main", agenda(src) === agenda(old));
// real taskCard: default byte-identical to origin/main; on Dad's view its box is dadTap
function card1(text, dadView) {
  const env = { checked: {}, claimed: {}, momMoves: {}, histState: {}, pendingSpins: {}, DAYS: ["wednesday"], day: "wednesday", kid: "all", dadTapView: dadView,
    helperHolds: () => null, momHereCards: () => false, effectiveDay: t => t.day, _todayDay: "wednesday", _isPastDay: () => false, _dismissed: () => false,
    cap: s => String(s).charAt(0).toUpperCase() + String(s).slice(1), esc: s => String(s), taskTitleShow: t => t.title, taskDeepLinkView: () => null, taskLessonRef: () => "" };
  const noop = function () {};
  const scope = new Proxy(env, { has: () => true, get: (t, k) => k === Symbol.unscopables ? undefined : (k in t ? t[k] : (k in globalThis ? globalThis[k] : noop)), set: (t, k, v) => { t[k] = v; return true; } });
  return new Function("__s", "with(__s){" + sliceFrom(text, "taskCard") + "\nreturn taskCard;}")(scope)(T[1]);
}
ok("taskCard on Dad's ▸ All: the box is dadTap", card1(src, true).includes("onclick=\"dadTap('e_sci')\"") && !card1(src, true).includes("tapTask"));
if (old) ok("taskCard everywhere else is byte-for-byte origin/main", card1(src, false) === card1(old, false) && card1(src, undefined) === card1(old, undefined));
{
  let seen = null, opt = null, viewDuring = null; const el = { innerHTML: "" };
  const env = { mdTodayName: () => "wednesday", mpSchTasks: (w, d) => { seen = [w, d]; return T; }, dadSchedItems: () => ex.items };
  const f = new Function("env", "let kid='lincoln', day='monday'; var dadTapView=false; const mdTodayName=env.mdTodayName, mpSchTasks=env.mpSchTasks, dadSchedItems=env.dadSchedItems; const allAgendaHtml=(a,b,c)=>{ env.opt=c; env.view=dadTapView; return '<!--AG n='+a.length+' day='+day+'-->'; };" + sliceFrom(src, "renderDadAll") + "; return {r:renderDadAll, get:()=>[kid,day,dadTapView]};")(env);
  f.r(el); opt = env.opt; viewDuring = env.view;
  ok("renderDadAll: today's All cards + his column, drawn with dadTap boxes", seen && seen[0] === "all" && opt && opt.extra && opt.extra.key === "dad" && opt.extra.items === ex.items && viewDuring === true && el.innerHTML.includes("AG n=4 day=wednesday"));
  ok("…restores kid/day and turns dadTap view off after", f.get().join() === "lincoln,monday,false");
  ok("…with a way back to Dad's Day", el.innerHTML.includes("mpSubView=\\'dad\\'") || el.innerHTML.includes("mpSubView='dad'"));
}
ok("Dad's Day header has the All button; ▸ All routes and is on Dad's side of the Mom gate", /mpSubView=\\'dadall\\'[^\n]*All<\/button>/.test(sliceFrom(src, "renderDadsDay")) && sliceFrom(src, "renderMomsPlanView").includes("mpSubView==='dadall'){ return renderDadAll(el); }") && sliceFrom(src, "momGateOpen").includes("mpSubView==='dadall'"));

console.log("C — his timed day");
const dadChores = { c1: { label: "Take vitamins", cad: "daily", slot: "morning", ts: 1 }, c2: { label: "Trash out", cad: "daily", slot: "night", ts: 2 }, c3: { label: "Mow", cad: "wk:2", ts: 3 },
  c4: { label: "Lunch walk", cad: "daily", slot: "afternoon", ts: 4 }, c5: { label: "Not today", cad: "wk:5", slot: "morning", ts: 5 } };
const laundry = { lw: { label: "Towels", stage: "washer", ts: AT(8 * 60), by: "dad" }, lm: { label: "Mom's darks", stage: "washer", ts: AT(8 * 60) },
  lf: { label: "Jeans", stage: "fold", ts: AT(9 * 60), by: "dad" }, lb: { label: "💦 Sheets", stage: "bin", ts: AT(6 * 60), by: "dad" } };
H = helpers({ arrived: 1, took: { l_read: true } }, { l_math: { at: 1, who: "lucy", sk: "math" } }, { dadChores, laundry, dadday: { [TODAY]: { chores: { c1: 123 } } } });
items = H.dadSchedItems("wednesday");
const at = (kind, id) => (items.find(x => x.kind === kind && x.id === id) || {}).m;
ok("checklist: ☀️ morning at 7:00 AM, 🌤 afternoon 12:00 PM, 🌙 night 5:00 PM, ongoing = any time", at("chore", "c1") === 420 && at("chore", "c4") === 720 && at("chore", "c2") === 1020 && at("chore", "c3") === null, items.map(x => [x.kind, x.id, x.m]));
ok("…only what's due today", at("chore", "c5") === undefined);
ok("…each row checks off with dcToggle; done shows ✓", items.find(x => x.id === "c1").html.includes("dcToggle('c1')") && items.find(x => x.id === "c1").html.includes("&#10003;") && !items.find(x => x.id === "c2").html.includes("&#10003;"));
const lau = items.filter(x => x.kind === "laundry").map(x => [x.m, txt(x.html)]);
ok("laundry: only loads HE started (by:\"dad\")", !lau.some(x => x[1].includes("Mom's darks")) && lau.some(x => x[1].includes("Towels")), lau);
ok("…a washer load: started row at its start, done row at start + wash time (60)", lau.some(x => x[0] === 480 && x[1].includes("Towels — in the washer")) && lau.some(x => x[0] === 540 && /Towels (is done|done ~)/.test(x[1])), lau);
ok("…fold pile and wash-today bin show with their next step (laundryAdvance)", items.some(x => x.kind === "laundry" && x.html.includes("Jeans") && x.html.includes("laundryAdvance('lf')")) && items.some(x => x.kind === "laundry" && x.html.includes("Sheets") && x.html.includes("laundryAdvance('lb')")));
ok("helper cards (picked + Mom-sent) at their card times", at("card", "l_read") === 600 && at("card", "l_math") === 780);
ok("sorted by the clock, any-time last", items.map(x => x.m == null ? 1e9 : x.m).every((v, i, a) => !i || a[i - 1] <= v));
sched = H.dadSchedHTML("wednesday");
ok("🗓 My schedule today draws time headers in order, ANY TIME last", sched.indexOf("My schedule today") >= 0 && sched.indexOf("7:00 AM") < sched.indexOf("10:00 AM") && sched.indexOf("10:00 AM") < sched.indexOf("ANY TIME"), txt(sched).slice(0, 300));
ok("empty day → a plain hint", helpers({}).dadSchedHTML("wednesday").includes("Nothing on the clock yet"));
ok("Dad's Day draws it under the helper card", /helperDadCardHTML\(\); \}catch\(e\)\{\}[^\n]*\n\s*try\{ h\+=dadSchedHTML\(dn\); \}/.test(sliceFrom(src, "renderDadsDay")));
{ // laundryAdd: his loads are his; Mom's write is unchanged
  const run = (text, by) => { const data = {}, w = []; const f = new Function("laundryData", "document", "HA_LS", "db", "renderMomsPlan", "_lbWrite", sliceFrom(text, "laundryAdd") + "; return laundryAdd;")(data, { getElementById: id => id === "laundry-label" ? { value: "Towels" } : null }, { setItem: () => {} }, { ref: p => ({ set: v => w.push([p, v]) }) }, () => {}, () => true); f(by); return w[0] && w[0][1]; };
  ok("Start a load from his Day writes by:\"dad\"", run(src, "dad").by === "dad");
  ok("Mom's Start a load writes exactly what origin/main wrote (no by)", !("by" in run(src)) && (!old || JSON.stringify(Object.keys(run(src))) === JSON.stringify(Object.keys(run(old)))));
}
// LAUNDRY_NUDGE (2026-10-15, hole 3) rewrites renderMomsDay's 🔴 NOW laundry rows on purpose — test_laundry_nudges.js covers them.
const unnudge = s => String(s).replace(/  \/\/ Load sitting in the washer[\s\S]*?(?=  \/\/ Bills that can't wait)/, "  /*laundry nudge*/\n");
if (old) ok("Mom's lane is byte-identical: momAgendaHtml · momSchedPrep · momSchedHouse · renderMomsDay (momSchedLaundry has its own test — LAUNDRY_WHEN changes it on purpose)", ["momAgendaHtml", "momSchedPrep", "momSchedHouse", "renderMomsDay", "mpSchTasks", "mpSchAgendaHTML"].every(n => unnudge(sliceFrom(src, n)) === unnudge(sliceFrom(old, n))));

console.log("D — a card Mom sent him");
H = helpers({}, { l_math: { at: 1, who: "lucy", sk: "math" } });
card = H.helperDadCardHTML(); sched = H.dadSchedHTML("wednesday");
ok("Mom's schedule shows it as his (helperHolds → dad), even with no hours today", H.helperHolds(T[2]) === "dad");
ok("not checked in yet → \"Mom sent you 1 card\" on his page, above the I'm-here box", txt(card).includes("Mom sent you 1 card") && card.indexOf("Mom sent you 1 card") < card.indexOf("helperDadRequest()"), txt(card));
ok("…the card on his schedule, tagged and checkable", sched.includes("Mom sent you this") && sched.includes("onclick=\"dadTap('l_math')\""));
r = checkOff("l_math", "dad", H, true);
ok("checking it off counts like Mom's, done with Dad", r.writes.some(w => w[1] === "week26/checked/l_math") && (r.writes.find(w => w[1] === "week26/history/l_math") || [])[2].helper === "Dad");
ok("waiting for Mom's yes → the sent notice still shows", helpers({ requested: 1 }, { l_math: { at: 1, who: "lucy", sk: "math" } }).helperDadCardHTML().includes("Mom sent you 1 card"));
ok("she sent nothing → no \"Mom sent\" box", !helpers({}).helperDadCardHTML().includes("Mom sent"));
if (old) ok("origin/main reproduces D: a sent card isn't on his page", (() => { const DADH = Object.assign({}, DAD, { days: { wednesday: { start: "9:00 AM", end: "3:00 PM" } } }); const c = helpers({}, { l_math: { at: 1, who: "lucy", sk: "math" } }, { helpers: { dad: DADH } }, old); return c.helperHolds(T[2]) === "dad" && !c.helperDadCardHTML().includes("l_math"); })());

console.log("3 — \"Give Dad more today\" any day");
H = helpers({}, {}, { mom: true, db: true, helpers: { dad: DAD, g: GMA } });
let btn = H.helperGiveBtnsHTML();
ok("Mom sees \"Give Dad more today\" with no regular hours set", btn.includes("Give Dad more today"), btn);
ok("…a helper without hours who isn't Dad still doesn't", !btn.includes("Give Grandma"));
ok("the pop says the cards keep their time (no empty \"()\" window)", H.helperGivePopHTML("dad").includes("stay at their own time") && !H.helperGivePopHTML("dad").includes("(&ndash;)"));
H.helperGiveToggle("dad", "l_math");
ok("ticking writes helperGive/<today> and the card is his", H.__writes.some(w => w[0] === "update" && w[1] === "helperGive/" + TODAY) && H.helperGivenTo(T[2]) === "dad" && H.helperHolds(T[2]) === "dad", H.__writes);
ok("…with no window, so the lay keeps it at its own time", H.helperGivenWin(T[2]) === null);
ok("…and it shows on his page", H.helperDadSentHTML("dad").includes("Mom sent you 1 card"));
ok("Grandma with hours: unchanged (her window)", (() => { const G2 = Object.assign({}, GMA, { days: { wednesday: { start: "9:30 AM", end: "12:00 PM" } } }); const x = helpers({}, {}, { mom: true, helpers: { dad: DAD, g: G2 } }); return x.helperGiveBtnsHTML().includes("Give Grandma more today") && x.helperWinToday("g").s === 570; })());
{ const x = helpers({}, {}, { mom: false, helpers: { dad: DAD } }); x.helperGiveToggle("dad", "l_math"); ok("still Mom-only: off Mom mode it asks for the PIN, writes nothing", x.__gated === 1 && x.helperGiveBtnsHTML() === ""); }

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
