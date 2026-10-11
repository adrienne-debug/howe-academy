/*
 * Node tests — 👨 DADFIX (her report 2026-10-11): Dad's Day as a school helper.
 *  A  the cards he picked (helperHolds → his id) are listed ON Dad's Day, each with a check-off that is tapTask — the same tap
 *     Mom's schedule card makes — and confirming it writes the same check as Mom's (weekN/checked + history), counted as his
 *     ("done with Dad"), never a kid-style claim.
 *  B  Dad's Day ▸ All draws the Schedule's All agenda (every kid side by side), look-only; Mom's All agenda is unchanged.
 *  D  a card Mom sent him (HELPERGIVE) shows "Mom sent you" on his page — before he checks in too — with the same check-off.
 *
 *   run:  node test_dads_day_helper.js
 *   (set DADFIX_DUMP=/path/dir to write rendered fixtures for screenshots)
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
const d0 = new Date(), TODAY = d0.getFullYear() + "-" + String(d0.getMonth() + 1).padStart(2, "0") + "-" + String(d0.getDate()).padStart(2, "0");
const C = (id, who, sk, time, mom) => ({ id, who, subjectKey: sk, day: "wednesday", time, dur: 20, title: "📘 " + id, detail: "do " + id, mom: mom || "required" });
const T = [C("l_read", "lucy", "read", "10:00 AM"), C("e_sci", "ellis", "sci", "11:00 AM"), C("l_math", "lucy", "math", "1:00 PM"), C("e_free", "ellis", "free", "10:00 AM", "none")];
const DAD = { name: "Dad", icon: "👨", createdAt: 1, dadPage: true, pick: true, days: { wednesday: { start: "9:00 AM", end: "3:00 PM" } }, help: { lucy: { read: true }, ellis: { sci: true } } };

// ── the HELPERS block, run as-is ─────────────────────────────────────────────────────
function helpers(sess, give, o, text) {
  o = o || {}; text = text || src;
  const a = text.indexOf("// ── HELPERS_START"), b = text.indexOf("// ── HELPERS_END");
  const ctx = { console, db: null, _dryRun: () => true, momHere: () => !!o.mom, pageOn: () => true, DAYS: ["wednesday"], ROSTER: ["lucy", "ellis"],
    weekData: { tasks: T }, getActiveTasks: () => T, checked: o.checked || {}, KID_COLOR: { lucy: "#be185d", ellis: "#1d4ed8" },
    cap: s => String(s).charAt(0).toUpperCase() + String(s).slice(1), esc: s => String(s == null ? "" : s).replace(/&(?![#a-z0-9]+;)/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;"),
    document: { activeElement: null, getElementById: () => null, createElement: () => ({}), body: { appendChild: () => {} } },
    dadUnlocked: false, _kioskD: () => o.kiosk !== false, kitPinGate: () => {}, renderAll: () => {},
    Date, Object, Array, String, Number, JSON, Math, parseInt, isNaN, RegExp };
  Object.defineProperty(ctx, "_todayDay", { get: () => "wednesday" });
  vm.createContext(ctx);
  vm.runInContext(sliceFrom(text, "toMin") + "\n" + text.slice(a, b) + "\nthis.__set=(h,d,g)=>{helpersData=h;helperDaysData=d||{};helperGiveData=g||{};};", ctx);
  ctx.__set({ dad: DAD }, { [TODAY]: { dad: sess || {} } }, { [TODAY]: { dad: give || {} } });
  return ctx;
}
const txt = h => h.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

console.log("A — the cards he picked are on his page, with a check-off");
let H = helpers({ arrived: 1, took: { l_read: true } });
let card = H.helperDadCardHTML();
ok("his picked card is listed on Dad's Day", card.includes("📘 l_read") && card.includes('data-dadcard="l_read"'), txt(card));
ok("…with a check-off that is tapTask (the tap Mom's schedule card makes)", card.includes("onclick=\"tapTask('l_read')\""));
ok("a card he didn't pick stays off his list", !card.includes("e_sci"));
ok("independent work never shows", !card.includes("e_free"));
ok("on his ?kiosk=dad link the dead \"My list\" jump is gone", !card.includes("selHelper("));
ok("in the app (not his link) \"My list\" is still there", helpers({ arrived: 1, took: { l_read: true } }, {}, { kiosk: false }).helperDadCardHTML().includes("selHelper('dad')"));
ok("Pick my cards / I'm done helping still there", card.includes("helpersPopOpen('dad')") && card.includes("helperLeave('dad')"));
ok("count line says 1 to do", txt(card).includes("1 to do"));
card = helpers({ arrived: 1, took: { l_read: true } }, {}, { checked: { l_read: "10:20 AM" } }).helperDadCardHTML();
ok("checked → the row shows ✓ done and the card says All done", card.includes("&#10003;") && txt(card).includes("done") && card.includes("All done"));
ok("not checked in and nothing sent → only the I'm-here box (unchanged)", (() => { const h = helpers({}).helperDadCardHTML(); return !h.includes("tapTask") && h.includes("helperDadRequest()"); })());
if (old) {
  ok("origin/main reproduces A: his picked card is NOT on his page", (() => {
    const ctx = helpers({ arrived: 1, took: { l_read: true } }, {}, {}, old);
    const h = ctx.helperDadCardHTML(); return ctx.helperHolds(T[0]) === "dad" && !h.includes("l_read") && !h.includes("tapTask");
  })());
  ok("origin/main reproduces D: a card Mom sent him is his, but his page doesn't show it", (() => {
    const ctx = helpers({}, { l_math: { at: 1, who: "lucy", sk: "math" } }, {}, old);
    const h = ctx.helperDadCardHTML(); return ctx.helperHolds(T[2]) === "dad" && !h.includes("l_math");
  })());
}

// ── the check-off itself: tapTask → dlg-ok → finalizeDone, run for real ─────────────────
function checkOff(id, who, Hc) {
  const writes = [], els = {};
  const el = k => (els[k] = els[k] || { id: k, style: {}, textContent: "", innerHTML: "", onclick: null });
  const env = {
    weekData: { tasks: T.map(t => Object.assign({}, t)) }, checked: {}, claimed: {}, histState: {}, momMoves: {}, pendingSpins: {}, DAY_DT: {}, DAYS: ["wednesday"], WK: "week26",
    manualUnchecks: new Set(), pendingId: null, pendingClaimMode: false, lastCheckedWrite: 0, _todayDay: "wednesday", day: "wednesday",
    db: { ref: p => ({ set: v => { writes.push(["set", p, v]); }, remove: () => writes.push(["remove", p]), update: v => writes.push(["update", p, v]) }) },
    document: { getElementById: el }, nowTs: () => "10:20 AM", checkoffHeld: () => false, momHere: () => who === "mom", momHereCards: () => who === "mom",
    needsVerify: t => t.mom === "required", effectiveDay: t => t.day, helperHolds: t => Hc.helperHolds(t), helperName: id => Hc.helperName(id),
    ld: () => null, sv: () => {}, taskLessonRef: () => "", closeDlg: () => { env.pendingId = null; }, renderAll: () => {}, obSet: (p, v) => writes.push(["claim", p, v]),
    _isNextUpLesson: () => false, paceData: {}, _nextSchoolDay: () => null,
  };
  const noop = function () {};
  const scope = new Proxy(env, { has: () => true, get: (t, k) => k === Symbol.unscopables ? undefined : (k in t ? t[k] : (k in globalThis ? globalThis[k] : noop)), set: (t, k, v) => { t[k] = v; return true; } });
  const okH = src.slice(src.indexOf('document.getElementById("dlg-ok").onclick='), src.indexOf('document.getElementById("dlg-uncheck").onclick='));
  const code = sliceFrom(src, "tapTask") + "\n" + sliceFrom(src, "finalizeDone") + "\n" + okH + "\nreturn {tapTask};";
  const api = new Function("__s", "with(__s){" + code + "}")(scope);
  api.tapTask(id);
  const label = el("dlg-ok").textContent;
  el("dlg-ok").onclick();
  return { writes, env, label };
}
let r = checkOff("l_read", "dad", H);
ok("Dad's dialog says ✓ Mark Done (not \"send to Mom\")", r.label === "✓ Mark Done", r.label);
ok("confirming writes the check: week26/checked/l_read", r.writes.some(w => w[0] === "set" && w[1] === "week26/checked/l_read" && w[2] === "10:20 AM"), r.writes);
const hist = r.writes.find(w => w[1] === "week26/history/l_read");
ok("…and the history entry, marked done with Dad", hist && hist[2].helper === "Dad" && hist[2].who === "lucy", hist);
ok("…never a claim waiting for Mom", !r.writes.some(w => w[0] === "claim"));
const m = checkOff("l_read", "mom", helpers({}));
ok("Mom's own check writes the same two paths", ["week26/checked/l_read", "week26/history/l_read"].every(p => m.writes.some(w => w[1] === p)) && !(m.writes.find(w => w[1] === "week26/history/l_read")[2].helper), m.writes);
const kidR = checkOff("e_sci", "kid", helpers({}));
ok("(control) a kid's tap on a Mom card that isn't Dad's is a claim, not a check", kidR.writes.some(w => w[0] === "claim") && !kidR.writes.some(w => w[1] === "week26/checked/e_sci"));

console.log("D — a card Mom sent him shows on his page with a check-off");
H = helpers({}, { l_math: { at: 1, who: "lucy", sk: "math" } });
card = H.helperDadCardHTML();
ok("Mom's schedule shows it as his (helperHolds → dad)", H.helperHolds(T[2]) === "dad");
ok("not checked in yet → \"Mom sent you 1 card\" on his page", txt(card).includes("Mom sent you 1 card") && card.includes("📘 l_math"), txt(card));
ok("…with the check-off", card.includes("onclick=\"tapTask('l_math')\""));
ok("…and the I'm-here box still below it", card.indexOf("Mom sent you 1 card") < card.indexOf("helperDadRequest()"));
r = checkOff("l_math", "dad", H);
ok("checking it off counts like Mom's, done with Dad", r.writes.some(w => w[1] === "week26/checked/l_math") && (r.writes.find(w => w[1] === "week26/history/l_math") || [])[2].helper === "Dad");
card = helpers({ arrived: 1, took: { l_read: true } }, { l_math: { at: 1, who: "lucy", sk: "math" } }).helperDadCardHTML();
ok("checked in → sent + picked cards in one list, the sent one tagged \"Mom sent you this\"", card.includes("l_read") && card.includes("l_math") && card.includes("Mom sent you this") && !card.includes("Mom sent you 1 card"));
card = helpers({ requested: 1 }, { l_math: { at: 1, who: "lucy", sk: "math" } }).helperDadCardHTML();
ok("waiting for Mom's yes → the sent card still shows", card.includes("Mom sent you 1 card") && card.includes("Waiting for Mom"));
ok("she sent nothing → no \"Mom sent\" box", !helpers({}).helperDadCardHTML().includes("Mom sent"));

console.log("B — Dad's Day ▸ All (look-only)");
function agenda(text, ro) {
  const env = { SL_KIDS: ["lucy", "ellis"], SL_KCOL: { lucy: "#be185d", ellis: "#1d4ed8" }, day: "wednesday",
    cap: s => String(s).charAt(0).toUpperCase() + String(s).slice(1), fromMin: m => (Math.floor(m / 60) % 12 || 12) + ":" + String(m % 60).padStart(2, "0") + (m >= 720 ? " PM" : " AM"),
    gateLookAhead: () => false, isScheduleUnlocked: k => k !== "ellis", gateClockHeld: () => false, morningComplete: () => false, gateStartMin: () => 540, rulesData: {},
    taskCard: (t, f, ro2) => '<div class="task-card" data-id="' + t.id + '"' + (ro2 ? ' data-ro="1"' : ' onclick="tapTask(\'' + t.id + '\')"') + ">" + t.title + "</div>" };
  const fns = ["toMin", "_agLunchFmt", "_agLunchRow", "allAgendaHtml"].map(n => sliceFrom(text, n)).join("\n");
  const keys = Object.keys(env);
  return new Function(...keys, fns + "\nreturn allAgendaHtml;")(...keys.map(k => env[k]))(T, null, ro);
}
const roH = agenda(src, true);
ok("All view lists every kid's cards side by side", roH.includes('data-id="l_read"') && roH.includes('data-id="e_sci"') && roH.includes('data-id="e_free"'));
ok("…drawn read-only (no tapTask, no skylight jump)", !roH.includes("tapTask") && !roH.includes("scrollToSkylight") && (roH.match(/data-ro="1"/g) || []).length === T.length);
if (old) ok("Mom's/kids' All agenda (no ro) is byte-for-byte origin/main", agenda(src) === agenda(old, undefined));
// real taskCard with readOnly=true has no tap
ok("taskCard's readOnly path draws no tapTask onclick (code check)", /\(readOnly\?"":' onclick="tapTask\(/.test(sliceFrom(src, "taskCard")));
// renderDadAll wiring
{
  let seen = null; const el = { innerHTML: "" };
  const env = { mdTodayName: () => "wednesday", mpSchTasks: (w, d) => { seen = [w, d]; return T; }, allAgendaHtml: (ts, only, ro) => "<!--AG ro=" + ro + " n=" + ts.length + " day=" + _day() + "-->", kid: "lincoln", day: "monday" };
  let _day = () => null;
  const f = new Function("env", "let kid=env.kid, day=env.day; const mdTodayName=env.mdTodayName, mpSchTasks=env.mpSchTasks; const allAgendaHtml=(a,b,c)=>env.allAgendaHtml(a,b,c).replace('day=null','day='+day);" + sliceFrom(src, "renderDadAll") + "; return {r:renderDadAll, get:()=>[kid,day]};")(env);
  f.r(el);
  ok("renderDadAll asks for today's All cards and draws them read-only", seen && seen[0] === "all" && seen[1] === "wednesday" && el.innerHTML.includes("AG ro=true n=4 day=wednesday"), el.innerHTML.slice(0, 200));
  ok("…restores the page's kid/day after", f.get()[0] === "lincoln" && f.get()[1] === "monday");
  ok("…with a way back to Dad's Day", el.innerHTML.includes("mpSubView=\\'dad\\'") || el.innerHTML.includes("mpSubView='dad'"));
}
ok("Dad's Day header has the All button", /mpSubView=\\'dadall\\'[^\n]*All<\/button>/.test(sliceFrom(src, "renderDadsDay")));
ok("▸ All routes and is on Dad's side of the Mom gate", sliceFrom(src, "renderMomsPlanView").includes("mpSubView==='dadall'){ return renderDadAll(el); }") && sliceFrom(src, "momGateOpen").includes("mpSubView==='dadall'"));

if (process.env.DADFIX_DUMP) {
  const css = (src.match(/<style>([\s\S]*?)<\/style>/) || [, ""])[1];
  const H2 = helpers({ arrived: 1, took: { l_read: true } }, { l_math: { at: 1, who: "lucy", sk: "math" } }, { checked: {} });
  const H3 = helpers({}, { l_math: { at: 1, who: "lucy", sk: "math" } });
  fs.mkdirSync(process.env.DADFIX_DUMP, { recursive: true });
  fs.writeFileSync(path.join(process.env.DADFIX_DUMP, "dad_cards.html"), '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>' + css + '</style></head><body style="background:#f5f1ea;margin:0;font-family:DM Sans,sans-serif">'
    + '<div style="padding:14px 14px 4px;font-family:Fraunces,serif;font-size:22px;font-weight:700;color:#2C5F8A">👨 Dad\'s Day <span style="font-size:12px">[🗓 Calendar] [👨‍👩‍👧‍👦 All]</span></div>'
    + '<div style="font-size:11px;color:#666;padding:0 14px">Checked in, picked Lucy reading + Mom sent Lucy math:</div>' + H2.helperDadCardHTML()
    + '<div style="font-size:11px;color:#666;padding:12px 14px 0">Not checked in yet, Mom sent Lucy math:</div>' + H3.helperDadCardHTML() + "</body></html>");
  fs.writeFileSync(path.join(process.env.DADFIX_DUMP, "dad_all_agenda.html"), roH);
}
console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
