/*
 * test_fixtures/house_vm.js — the Household page in a vm, house.js loaded, for test_house_room_now.js and test_house_room_todo.js
 * (DESIGN_now_todo_schedule_2026-11-17, slice A). The same world test_house_slim.js builds: index.html's Household region
 * (HOUSEHOLD_START … KITCHEN_TAB_END: the table, the plan and HOUSEDAY, the engine) + the helpers it leans on, sliced from the page,
 * then house.js run in the same global scope the way the browser runs it. One fixed clock (today, noon). A MADE-UP family (Ada, Ben,
 * Cal, Mom, Dad); every database write is recorded, none is sent anywhere.
 *   const V=require("./test_fixtures/house_vm.js");
 *   const c=V.mk({jobs, hd:{meta:{…}}, houseDay:{<iso>:{…}}, dry:true, noMom:true, src:<another index.html text>});
 *   c.writes → [["update","",{…}], ["set","household/jobs/x",{…}], …];  c.bank, c.rlog → stars and Click-off lines paid
 */
"use strict";
const fs = require("fs"), path = require("path"), vm = require("vm");
const DIR = path.join(__dirname, "..");
const RAW = fs.readFileSync(path.join(DIR, "index.html"), "utf8"), HJS = fs.readFileSync(path.join(DIR, "house.js"), "utf8");
const fnOf = s => name => { const i = s.indexOf("function " + name + "("); if (i < 0) throw new Error("missing " + name); let d = 0; for (let k = s.indexOf("{", i); k < s.length; k++) { if (s[k] === "{") d++; else if (s[k] === "}" && --d === 0) return s.slice(i, k + 1); } throw new Error("unbalanced " + name); };
const cutOf = s => (a, b) => { const i = s.indexOf(a), j = s.indexOf(b, i); if (i < 0 || j < 0) throw new Error("missing " + a + " / " + b); return s.slice(i, s.indexOf("\n", j)); };
const isoD = d => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
const NOW = new Date(); NOW.setHours(12, 0, 0, 0); const FIXED = NOW.getTime();
const TODAY = isoD(NOW), DN = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"], TDN = DN[NOW.getDay()], DOW = (NOW.getDay() + 6) % 7;
const dayNum = s => { const p = s.split("-").map(Number); return Math.round(Date.UTC(p[0], p[1] - 1, p[2]) / 864e5); }, isoOf = n => new Date(n * 864e5).toISOString().slice(0, 10);
const T = dayNum(TODAY), ago = n => isoOf(T - n);
const K = o => Object.assign({ src: { kind: "new" }, status: "active", area: "cleaning", verdict: "", note: "" }, o);
const LIB = s => { const f = fnOf(s), c = cutOf(s);
  return s.slice(s.indexOf("const _CAD_DOW="), s.indexOf("function cadLabel(")) + f("cadLabel") + "\nlet rotationPeriod={};\n"
    + ["_rotKey", "rtRotPeriod", "_rtRotHop", "rtApplyRot", "rtCfgEnsure", "rtCfgSave", "stepCycleOk", "rtStepsFor", "toMin", "fromMin", "to12h", "ampmTo24", "mcAll", "dcAll", "mwTodayIso", "laundrySince", "gbDefault", "gbList", "rlLoadingHTML", "mealCfg"].map(f).join("\n")
    + "\n" + ["const MEAL_SLOT=", "const MEAL_EMOJI="].map(k => { const i = s.indexOf(k); return s.slice(i, s.indexOf("\n", i)); }).join("\n")
    + "\nfunction _mlNowMin(){ return _mlNowOverride; }\n" + c("// MOMSCHED_LAUNDRY_START", "// MOMSCHED_LAUNDRY_END") + "\n" + c("// MEALPREP_BLOCK_START", "// MEALPREP_BLOCK_END"); };
const REGION = s => cutOf(s)("// HOUSEHOLD_START", "// KITCHEN_TAB_END");
const LAZY = s => s.slice(s.indexOf("// LAZYSPLIT_START"), s.indexOf("// LAZYSPLIT_END"));
function mk(o) {
  o = o || {}; const src = o.src || RAW, writes = [], ls = {}, tags = [], bank = [], rlog = [], toasts = [], els = {};
  let seed = 7; const M = Object.create(Math); M.random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  class D extends Date { constructor(...a) { if (a.length) super(...a); else super(FIXED); } static now() { return FIXED; } }
  const ctx = { console, Object, Array, String, Number, parseInt, parseFloat, isNaN, isFinite, Math: M, JSON, Date: D, RegExp, Error, Set, Map, Infinity, Promise, Symbol,
    window: {}, location: { hostname: "localhost", search: "" },
    document: { getElementById: id => els[id] || null, createElement: () => ({}), head: { appendChild: t => tags.push(t) } },
    HA_LS: { getItem: k => ls[k] || null, setItem: (k, v) => { ls[k] = v; } },
    db: { ref: p => ({ set: v => { writes.push(["set", p === undefined ? "" : p, v === null || v === undefined ? null : JSON.parse(JSON.stringify(v))]); return Promise.resolve(); }, update: v => { writes.push(["update", p === undefined ? "" : p, JSON.parse(JSON.stringify(v))]); return Promise.resolve(); }, remove: () => { writes.push(["rm", p]); return Promise.resolve(); }, on: () => {}, once: () => ({ then: () => {} }), transaction: () => Promise.resolve() }) },
    _dryRun: () => !!o.dry, isMom: !o.noMom, momHere: () => ctx.isMom, kcKid: "", _kioskD: () => false, confirm: () => true,
    calendarData: { holidays: {}, vacations: {}, cleaningDays: {} }, calToday: () => TODAY, calDateForWeekDay: d => d === TDN ? TODAY : null,
    rulesData: {}, ROSTER: ["ada", "ben", "cal"], SL_KIDS: ["ada", "ben", "cal"], SL_SLOTS: ["morning", "afternoon", "chores", "evening"], SL_SLBL: { morning: "Morning", afternoon: "Afternoon", chores: "Chores", evening: "Evening" }, FIRST_KID: "ada",
    KID_NAME: { ada: "Ada", ben: "Ben", cal: "Cal" }, KID_COLOR: { ada: "#aa1111", ben: "#11aa11", cal: "#1111aa" }, MC_DEFAULT: {}, HA_IS_HOWE: false, RT_ABBR: { afternoon: "a", chores: "c", evening: "e" },
    LAUNDRY_STAGES: ["washer", "dryer", "fold"], laundryData: {}, DAYS_ALL: [], amIso: () => null, amCarry: {},
    routineCfg2: {}, morningRoutineCfg: {}, RT_DEFAULT: { afternoon: {}, chores: {}, evening: {} }, _mrLegacySteps: () => [], routineTimes: {}, _rtRotDayNum: () => Math.round(FIXED / 864e5),
    stepWindowOk: () => true, rtDoneOn: () => false, mStepDoneOn: () => false, rtLateDays: () => 0, rtWaved: () => false,
    toggleRtStep: () => {}, mcToggle: () => {}, dcToggle: () => {}, mcDoneOn: () => false, dcDoneOn: () => false, gbCur: () => null, gbInstant: () => {},
    bankDirect: (k, p, n) => { bank.push([k, p, n]); return "bid" + bank.length; }, bankDirectRemove: (k, b) => bank.push([k, "rm", b]), rlogAppend: (k, sl, l, act, p) => rlog.push([k, sl, l, act, p]), zoneBonusFor: () => 0,
    slState: {}, sv: () => {}, nowTs: () => "9:50 AM", activeWk: () => "week9", mdTodayName: () => TDN, weekData: { week: "week9" }, _todayStr: () => TODAY, _lbNowMin: () => 600,
    routineLog: {}, momdayData: o.momday || {}, daddayData: o.dadday || {}, momChoresData: {}, dadChoresData: {}, momBlocks: {}, momBlocksOnValue: () => {},
    getActiveTasks: () => [], checked: {}, momMoves: {}, morningComplete: () => true, bbActive: () => null, adminPinUnlocked: true, famIsMomCard: () => false, taskCard: () => "", _agLunchRow: () => null,
    routineDateISO: () => TODAY, DAY_DT: {}, rlHistReady: () => true, rlHistFull: () => true, amList: () => [], rtBonusFor: () => 0, rtBonusSet: () => {},
    cap: s => s.charAt(0).toUpperCase() + s.slice(1), esc: s => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;"),
    mwBanner: s => "<banner>" + s + "</banner>", mpSubnav: v => "<subnav " + v + ">", mwToast: m => toasts.push(m), renderAll: () => {},
    gwParseDate: s => { const p = s.split("-"); return new D(+p[0], +p[1] - 1, +p[2]); },
    writes, tags, bank, rlog, toasts, els };
  ctx._mlNowOverride = 9 * 60; Object.defineProperty(ctx, "_todayDay", { get: () => TDN });
  ctx.renderMomsPlan = () => {};
  vm.createContext(ctx);
  vm.runInContext(LIB(src) + "\nlet grabs=[];\nconst GRAB_DEFAULT=[];\n" + LAZY(src) + "\n" + REGION(src) + "\nthis.get=function(e){ return eval(e); };", ctx);
  if (o.house !== false) vm.runInContext(HJS, ctx, { filename: "house.js" });
  ctx.householdOnValue(Object.assign({ jobs: o.jobs || {}, meta: { takeover: 1 } }, o.hd || {}));
  if (o.houseDay) ctx.get("houseDayData=" + JSON.stringify(o.houseDay));
  ctx.writes.length = 0;
  return ctx;
}
// A room page (Mom's Household ▸ Rooms ▸ <room>), as drawn.
function roomPage(c, rid) { c.get('hhView="rooms"; hhRmSel=' + JSON.stringify(rid)); return c.hhRoomsPageHTML(); }
const handlers = h => { const out = [], re = / on(click|change)="([^"]*)"/g; let m; while ((m = re.exec(h))) out.push(m[2].replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/&#39;/g, "'")); return out; };
// The card that starts with this title (🔴 Now / 📝 To do), up to the next card.
const card = (h, title) => { const i = h.indexOf(title); if (i < 0) return ""; const s = h.lastIndexOf('<div style="background:#fff;border-radius:12px', i); const n = h.indexOf('<div style="background:#fff;border-radius:12px', i); return h.slice(s, n < 0 ? h.length : n); };
module.exports = { mk, roomPage, handlers, card, K, TODAY, T, DOW, TDN, ago, isoOf, dayNum, RAW, HJS, FIXED };
