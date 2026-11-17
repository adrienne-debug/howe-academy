/*
 * 🪶 HOUSESLIM — the Household page's own code lives in house.js (her "Yes, slim down" 2026-11-17, before Household step 4; her
 * words 11/8: the LG got slow because the code grew). HH_ROTATE, HH_PROJECTS' view (HH_PROJSWEEP, HH_PROJVIEW), HH_ONCEPILE's view
 * (HH_ONCEVIEW), HH_EDITOR, HH_ROOMPAGE and HH_CARD moved out of index.html unchanged; renderHousehold is their one door.
 * Proves, on a made-up family (Ada, Ben, Cal; Mom, Dad):
 *   1. With house.js NOT loaded, everything a kid's, Dad's or a kiosk screen runs gives exactly what the unmoved source gives —
 *      every kid's four lists (raw and on every weekday), Mom's and Dad's lists (hhDerivePerson, mcAll / dcAll), householdOnValue →
 *      materialize, a Chores & Stars save (rtCfgSave → hhSyncKids), the 🏡 House card (folded and open), the cleaning-day plan, its
 *      📨 send, a kid's check-off, Mom's agenda rows, Up for Grabs — and none of it starts a load of house.js.
 *   2. A scan, with the names read from house.js itself: every mention in index.html of a house.js name is typeof-guarded on its
 *      line, and sits in a function reached only from renderHousehold (or only from house.js's own code); the other .js files never
 *      mention one; HOUSEENG (which step 4 moves into the page) reads none of the moved names. A planted call is caught.
 *   3. With house.js loaded, every Household view (Rooms top page, a room page, the chore card, ⚙ Rules, 🔍 Checks, the rotation
 *      editor, Projects, the Once pile, By person, and the rest) is byte-identical to the unmoved source on the same data.
 *   4. Before the file lands each view draws "Loading the Household page…" and starts exactly ONE load (the real haLazyLoad, one
 *      <script>); when it lands the view draws, the same as (3); a page she already left is not drawn over.
 *   run:  node test_house_slim.js
 *   BASE_HTML=/path/to/main/index.html node test_house_slim.js → "the unmoved source" is that copy (house.js beside it) instead of
 *   this branch's joined page (test_src.js).
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const testSrc = require("./test_src.js");
const P = require("./perf_budget_measure.js");
const DIR = __dirname;
const RAW = fs.readFileSync(path.join(DIR, "index.html"), "utf8"), HJS = fs.readFileSync(path.join(DIR, "house.js"), "utf8");
const BASE = process.env.BASE_HTML ? testSrc(process.env.BASE_HTML) : testSrc();
if (process.env.BASE_HTML) console.log("(base: " + process.env.BASE_HTML + ")");
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x).slice(0, 500) + ")" : "")); } };
const fnOf = s => name => { const i = s.indexOf("function " + name + "("); if (i < 0) throw new Error("missing " + name); let d = 0; for (let k = s.indexOf("{", i); k < s.length; k++) { if (s[k] === "{") d++; else if (s[k] === "}" && --d === 0) return s.slice(i, k + 1); } throw new Error("unbalanced " + name); };
const cutOf = s => (a, b) => { const i = s.indexOf(a), j = s.indexOf(b, i); if (i < 0 || j < 0) throw new Error("missing " + a + " / " + b); return s.slice(i, s.indexOf("\n", j)); };

// ── the made-up family and its table ──────────────────────────────────────────────────────────────────────────────────────
const isoD = d => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
const NOW = new Date(); NOW.setHours(12, 0, 0, 0); const FIXED = NOW.getTime();   // one clock for every world
const TODAY = isoD(NOW), DN = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"], TDN = DN[NOW.getDay()], DOW = (NOW.getDay() + 6) % 7;
const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const K = o => Object.assign({ src: { kind: "new" }, status: "active", area: "cleaning", verdict: "", note: "" }, o);
const JOBS = () => ({
  h_teeth: K({ label: "Brush teeth", emoji: "🪥", who: "ada", slot: "morning", cad: "daily", area: "health", order: 0 }),
  a_fish: K({ label: "Feed the fish", who: "cal", slot: "afternoon", cad: "daily", area: "animals", order: 0 }),
  k_counter: K({ label: "Wipe the counters", emoji: "🧽", who: "ada", slot: "chores", cad: "daily", room: "kitchen", minutes: 10, order: 1, can: ["ada", "ben"], pts: 10 }),
  k_floor: K({ label: "Sweep the kitchen", who: "ada", slot: "chores", cad: "wk:" + ((DOW + 1) % 7), room: "kitchen", minutes: 15, order: 2, pts: 15 }),
  k_oven: K({ label: "Clean the oven", who: "cal", slot: "chores", cad: "3d", room: "kitchen", minutes: 30, order: 1, level: 2 }),
  k_mop: K({ label: "Mop the floor", who: "ben", slot: "chores", cad: "2w", room: "kitchen", minutes: 15, order: 1, can: ["ben", "ada"], pts: 20 }),
  l_dust: K({ label: "Dust the den", who: "ben", slot: "chores", cad: "wk:" + ((DOW + 3) % 7), room: "living", order: 2 }),   // no minutes → a 🔍 check
  r_ada: K({ label: "Pickup the den", who: "ada", slot: "afternoon", cad: "daily", rot: "pick", area: "pickup", room: "living", order: 5, minutes: 5 }),
  r_ben: K({ label: "Pickup the porch", who: "ben", slot: "afternoon", cad: "daily", rot: "pick", area: "pickup", room: "entry", order: 5, minutes: 5 }),
  m_tea: K({ label: "Morning tea", who: "mom", slot: "morning", cad: "daily", area: "health", src: { kind: "momChore", id: "tea" }, order: 0 }),
  m_fridge: K({ label: "Wipe the fridge", who: "mom", slot: "", cad: "wk:" + DOW, room: "kitchen", minutes: 10, src: { kind: "momChore", id: "fridge" }, order: 1, can: ["mom", "ada"] }),
  d_trash: K({ label: "Trash to the curb", who: "dad", slot: "", cad: "daily", area: "pickup", room: "kitchen", minutes: 5, src: { kind: "dadChore", id: "trash" }, order: 0 }),
  o_shelf: K({ label: "Fix the shelf", who: "ben", slot: "chores", cad: "once", hold: true, room: "kitchen", minutes: 10, order: 9 }),
  o_boxes: K({ label: "Boxes to the curb", who: "cal", slot: "chores", cad: "once", room: "entry", minutes: 5, order: 8 }),
  p_cab: K({ label: "The art cabinet", who: "mom", slot: "", cad: "asneeded", layer: "project", room: "living", expect: 40, src: { kind: "momChore", id: "cab" }, order: 50, target: TODAY,
    steps: { s1: { label: "Buy hinges", done: "", order: 0 } }, work: { "1700000000000": { min: 20, by: "mom", note: "sanded", iso: "2026-11-01" } } }),
  g_win: K({ label: "Wash the windows", who: "grab", cad: "wk:5", pts: 25, room: "living", minutes: 10, src: { kind: "grab", i: 0 }, order: 0 }),
  x_old: K({ label: "Old chore", who: "cal", slot: "evening", cad: "daily", status: "retired", verdict: "retire", order: 3 })
});
const HD = () => ({ jobs: JOBS(), meta: { takeover: 1 }, rooms: { kitchen: { name: "Kitchen", floor: "main", order: 1 } } });

// ── one world = the Household area of a source, run in a vm with the app's edges stubbed ──────────────────────────────────
// region: HOUSEHOLD_START … KITCHEN_TAB_END (the takeover, levels, add/give, cleaning day, the House card, the plan, HH_PEOPLE,
// HOUSESLIM's door and the Kitchen tab) + the small helpers it leans on, sliced from the same source.
const LIB = s => { const f = fnOf(s), c = cutOf(s);
  return s.slice(s.indexOf("const _CAD_DOW="), s.indexOf("function cadLabel(")) + f("cadLabel") + "\nlet rotationPeriod={};\n"
    + ["_rotKey", "rtRotPeriod", "_rtRotHop", "rtApplyRot", "rtCfgEnsure", "rtCfgSave", "stepCycleOk", "rtStepsFor", "toMin", "fromMin", "to12h", "ampmTo24", "mcAll", "dcAll", "mwTodayIso", "laundrySince", "gbDefault", "gbList", "rlLoadingHTML", "mealCfg"].map(f).join("\n")
    + "\n" + ["const MEAL_SLOT=", "const MEAL_EMOJI="].map(k => { const i = s.indexOf(k); return s.slice(i, s.indexOf("\n", i)); }).join("\n")
    + "\nfunction _mlNowMin(){ return _mlNowOverride; }\n" + c("// MOMSCHED_LAUNDRY_START", "// MOMSCHED_LAUNDRY_END") + "\n" + c("// MEALPREP_BLOCK_START", "// MEALPREP_BLOCK_END"); };
const REGION = s => cutOf(s)("// HOUSEHOLD_START", "// KITCHEN_TAB_END");
const LAZY = RAW.slice(RAW.indexOf("// LAZYSPLIT_START"), RAW.indexOf("// LAZYSPLIT_END"));
function mk(srcText, o) {
  o = o || {}; const writes = [], ls = {}, tags = [], bank = [], rlog = [], grabsDone = [], renders = [];
  let seed = 7; const M = Object.create(Math); M.random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  class D extends Date { constructor(...a) { if (a.length) super(...a); else super(FIXED); } static now() { return FIXED; } }
  const W = {};
  const ctx = { console, Object, Array, String, Number, parseInt, parseFloat, isNaN, isFinite, Math: M, JSON, Date: D, RegExp, Error, Set, Map, Infinity, Promise, Symbol,
    window: W, location: { hostname: "localhost", search: "" },
    document: { getElementById: id => (id === "content" && ctx.pageEl) || null, createElement: () => ({}), head: { appendChild: t => tags.push(t) } },
    HA_LS: { getItem: k => ls[k] || null, setItem: (k, v) => { ls[k] = v; } },
    db: { ref: p => ({ set: v => writes.push(["set", p === undefined ? "" : p, v === null || v === undefined ? null : JSON.parse(JSON.stringify(v))]), update: v => writes.push(["update", p === undefined ? "" : p, JSON.parse(JSON.stringify(v))]), remove: () => writes.push(["rm", p]), on: () => {}, once: () => ({ then: () => {} }) }) },
    _dryRun: () => false, isMom: true, momHere: () => ctx.isMom, kcKid: "", _kioskD: () => false, confirm: () => true,
    calendarData: { holidays: {}, vacations: {}, cleaningDays: { [TODAY]: { at: 1, by: "mom" } } }, calToday: () => TODAY, calDateForWeekDay: d => d === TDN ? TODAY : null,
    rulesData: { cleaningDay: { start: "9:00 AM", end: "11:00 AM", lunchStart: "9:20 AM", lunchEnd: "9:40 AM", minutes: { ada: 60, ben: 40, cal: 30, mom: 40, dad: 15 } } },
    ROSTER: ["ada", "ben", "cal"], SL_KIDS: ["ada", "ben", "cal"], SL_SLOTS: ["morning", "afternoon", "chores", "evening"], SL_SLBL: { morning: "Morning", afternoon: "Afternoon", chores: "Chores", evening: "Evening" }, FIRST_KID: "ada",
    KID_NAME: { ada: "Ada", ben: "Ben", cal: "Cal" }, KID_COLOR: { ada: "#aa1111", ben: "#11aa11", cal: "#1111aa" }, MC_DEFAULT: {}, HA_IS_HOWE: false, RT_ABBR: { afternoon: "a", chores: "c", evening: "e" },
    LAUNDRY_STAGES: ["washer", "dryer", "fold"], laundryData: {},
    routineCfg2: {}, morningRoutineCfg: {}, RT_DEFAULT: { afternoon: {}, chores: {}, evening: {} }, _mrLegacySteps: () => [], routineTimes: {}, _rtRotDayNum: () => Math.round(FIXED / 864e5),
    stepWindowOk: () => true, rtDoneOn: (s, k, d, i) => k === "cal" && s === "afternoon" && i === 0, mStepDoneOn: (k, d, i) => k === "ada" && i === 0, rtLateDays: () => 0, rtWaved: () => false,
    toggleRtStep: () => {}, mcToggle: () => {}, dcToggle: () => {}, mcDoneOn: () => false, dcDoneOn: () => false, gbCur: () => null, gbInstant: (k, i) => grabsDone.push([k, i]),
    bankDirect: (k, p, n) => { bank.push([k, p, n]); return "bid" + bank.length; }, bankDirectRemove: (k, b) => bank.push([k, "rm", b]), rlogAppend: (k, sl, l, act, p) => rlog.push([k, sl, l, act, p]), zoneBonusFor: () => 0,
    slState: {}, sv: () => {}, nowTs: () => "9:50 AM", activeWk: () => "week9", mdTodayName: () => TDN, weekData: { week: "week9" }, _todayStr: () => TODAY, _lbNowMin: () => 600,
    routineLog: {}, momdayData: {}, daddayData: {}, momChoresData: {}, dadChoresData: {}, momBlocks: {}, momBlocksOnValue: () => {},
    getActiveTasks: () => [], checked: {}, momMoves: {}, morningComplete: () => true, bbActive: () => null, adminPinUnlocked: true, famIsMomCard: () => false, taskCard: () => "", _agLunchRow: () => null,
    routineDateISO: () => TODAY, DAY_DT: {}, rlHistReady: () => true, rlHistFull: () => true,
    amList: k => k === "ada" ? [{ id: "x", label: "Put away shoes", emoji: "👟", fromIso: TODAY, dueIso: TODAY, slot: "chores" }] : [],
    rtBonusFor: () => 0, rtBonusSet: () => {},
    cap: s => s.charAt(0).toUpperCase() + s.slice(1), esc: s => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;"),
    mwBanner: s => "<banner>" + s + "</banner>", mpSubnav: v => "<subnav " + v + ">", mwToast: () => {}, renderAll: () => {},
    gwParseDate: s => { const p = s.split("-"); return new D(+p[0], +p[1] - 1, +p[2]); },
    writes, tags, bank, rlog, grabsDone, renders, W };
  ctx._mlNowOverride = 9 * 60; Object.defineProperty(ctx, "_todayDay", { get: () => TDN });
  ctx.renderMomsPlan = el => { renders.push(1); if (ctx.pageEl) ctx.renderHousehold(ctx.pageEl); };   // hhRender draws the page again into the same element
  vm.createContext(ctx);
  vm.runInContext(LIB(srcText) + "\nlet grabs=[{emoji:\"🪟\",label:\"Wash the windows\",pts:25,cad:\"wk:5\"}];\nconst GRAB_DEFAULT=[];\n" + LAZY + "\n" + REGION(srcText)
    + "\nthis.get=function(e){ return eval(e); };", ctx);
  if (o.house) vm.runInContext(HJS, ctx, { filename: "house.js" });   // the browser runs house.js after the page, in the same global scope
  ctx.householdOnValue(HD()); ctx.writes.length = 0;
  return ctx;
}
const NEW = () => mk(RAW), NEWH = () => mk(RAW, { house: true }), OLD = () => mk(BASE);

// ── 1. house.js NOT loaded: what every screen outside the Household page runs ─────────────────────────────────────────────
console.log("\n── 1. without house.js, everything outside the Household page is the same ──");
const norm = s => s && JSON.parse(JSON.stringify(s));
function lists(c) { const out = {}; c.SL_SLOTS.forEach(s => c.ROSTER.forEach(k => { out[s + "/" + k] = norm(c.rtStepsFor(s, k, true)); DAYS.forEach(d => { out[s + "/" + k + "/" + d] = norm(c.rtStepsFor(s, k, false, d)); }); }));
  out.momPerson = c.hhDerivePerson("mom"); out.dadPerson = c.hhDerivePerson("dad"); out.mom = c.mcAll(); out.dad = c.dcAll();
  out.momData = norm(c.momChoresData); out.dadData = norm(c.dadChoresData); out.cfg = norm(c.get("routineCfg2")); out.jobs = norm(c.hhJobs()); return JSON.stringify(out); }
function outside(c) {
  const R = {}, T = (k, f) => { try { R[k] = f(); } catch (e) { R[k] = "THREW " + e.message; } };
  T("lists", () => lists(c));
  T("materialize", () => { c.householdOnValue(Object.assign(HD(), { meta: { takeover: 1 } })); return lists(c); });
  T("save", () => { c.get('routineCfg2.chores.ada.push({emoji:"🧺",label:"Fold the towels",pts:5,cad:"daily"}); routineCfg2.chores.ben[0].label="Mop the whole floor";'); c.rtCfgSave(); const w = norm(c.writes); c.writes.length = 0; return JSON.stringify([w, lists(c)]); });
  T("houseCard", () => { const a = c.hhHouseCardHTML("ada", TDN, []), b = c.hhHouseCardHTML("ben", TDN, []); c.hhHouseCardToggle("ada"); return [a, b, c.hhHouseCardHTML("ada", TDN, [])].join("\n"); });
  T("houseCardNormalDay", () => { const cd = c.get("calendarData.cleaningDays"); c.get("calendarData.cleaningDays={}"); const h = [c.hhHouseCardHTML("ada", TDN, []), c.hhHouseCardHTML("ben", TDN, []), JSON.stringify(c.hhHouseBlocksOpen()), JSON.stringify(c.momSchedHouse(TDN, []))].join("\n"); c.get("calendarData.cleaningDays=" + JSON.stringify(cd)); return h; });
  T("houseBlocks", () => JSON.stringify([c.hhHouseBlocksOpen(), c.momSchedHouse(TDN, [])]));
  T("plan", () => JSON.stringify(c.hhPlanBuild(TODAY)));
  T("planSend", () => { c.hhPlanSend(TODAY); const w = norm(c.writes); c.writes.length = 0; return JSON.stringify([w, c.hhPlanRec(TODAY), c.hhPlanLay(TODAY, "ada"), c.hhPlanLay(TODAY, "mom")]); });
  T("momAgenda", () => JSON.stringify([c.hhHouseBlocksOpen(), c.momSchedHouse(TDN, [])]));
  T("kidCheck", () => { const plan = c.hhPlanRec(TODAY).plan, ids = Object.keys(plan).sort(), id = ids.find(i => plan[i].who === "ada") || ids[0];
    c.isMom = false; c.get('kcKid="' + plan[id].who + '"'); const card = c.hhCleanCardHTML ? c.hhCleanCardHTML() : "", up = c.hhPlanCheck(TODAY, id);
    const panel = c.hhCleanPanelHTML(plan[id].who, TODAY, TDN, "House"); c.isMom = true; c.get('kcKid=""'); return JSON.stringify([id, card, norm(up), panel, norm(c.bank), norm(c.rlog), norm(c.grabsDone)]); });
  T("grabCheck", () => { const plan = c.hhPlanRec(TODAY).plan; if (!plan.g_win) return "no grab on the plan"; const up = c.hhPlanCheck(TODAY, "g_win"); return JSON.stringify([norm(up), norm(c.grabsDone)]); });
  T("grabs", () => JSON.stringify(c.gbList()));
  T("dadsList", () => JSON.stringify([c.dcAll(), c.hhDerivePerson("dad")]));
  T("levels", () => JSON.stringify(c.hhJobs && Object.keys(c.hhJobs()).map(id => [id, c.hhLevelOut(c.hhJobs()[id])])));
  return R;
}
{ const n = NEW(), o = OLD(), A = outside(n), B = outside(o);
  const threw = Object.keys(A).filter(k => /^THREW/.test(A[k]));
  ok("without house.js every call runs (lists, materialize, a Chores & Stars save, the House card, the plan, its send and a check-off, Up for Grabs)", threw.length === 0, threw.map(k => k + ": " + A[k]));
  ok("…and the unmoved source runs them too (the comparison means something)", Object.keys(B).every(k => !/^THREW/.test(B[k])), Object.keys(B).filter(k => /^THREW/.test(B[k])).map(k => k + ": " + B[k]));
  Object.keys(B).forEach(k => ok("same as the unmoved source: " + k, A[k] === B[k], k));
  ok("the made-up data reaches every path (four lists filled, a save that writes, a plan with jobs, the card open, a check that pays)",
    /Wipe the counters/.test(A.lists) && /Fold the towels/.test(A.save) && /"who":"ada"/.test(A.plan) && /🏡 House/.test(A.houseCard + A.houseCardNormalDay) && /bid1|"pts":10|"pts":15|"pts":20/.test(A.kidCheck), [A.plan.slice(0, 200)]);
  ok("none of it started a load of house.js (no <script> tag)", n.tags.length === 0, n.tags.length);
  ok("house.js is really not there in that world (sanity: no hcCardHTML, no hhRotationsHTML, no hpPeople)", n.get('typeof hcCardHTML+typeof hhRotationsHTML+typeof hpPeople') === "undefinedundefinedundefined");
  // the same with the device being a kid's (not Mom): lists and the House card
  const nk = NEW(), ok2 = OLD(); [nk, ok2].forEach(c => { c.isMom = false; c.get('kcKid="ben"'); });
  ok("a kid's device: the four lists and the House card are the same too", lists(nk) === lists(ok2) && nk.hhHouseCardHTML("ben", TDN, []) === ok2.hhHouseCardHTML("ben", TDN, []));
  ok("…and a kid's device's Chores & Stars save writes nothing in both", (() => { [nk, ok2].forEach(c => { c.writes.length = 0; c.rtCfgSave(); }); return nk.writes.length === ok2.writes.length; })());
}

// ── 2. the scan ───────────────────────────────────────────────────────────────────────────────────────────────────────────
console.log("\n── 2. no moved name is reachable outside the Household page ──");
const topNames = js => { const out = new Set(), cm = P.scanJs(js).cm;
  for (const m of cm.matchAll(/^(?:async\s+)?function\s*\*?\s*([\w$]+)|^(?:const|let|var)\s+([\w$]+)/gm)) out.add(m[1] || m[2]);
  for (const m of cm.matchAll(/^(?:const|let|var)\s[^\n]*/gm)) for (const k of m[0].matchAll(/[,;]\s*(?:let\s+|const\s+)?([A-Za-z_$][\w$]*)\s*=/g)) out.add(k[1]);
  return out; };
const HNAMES = [...topNames(HJS)].filter(n => n.length >= 3);
const blockOf = (js, a, b) => js.slice(js.indexOf("// " + a + "_START"), js.indexOf("// " + b + "_END"));
const STEP3 = topNames(blockOf(HJS, "HOUSEENG", "HOUSEPREVIEW")), MOVED = HNAMES.filter(n => !STEP3.has(n));
ok("house.js declares the moved blocks' names (" + MOVED.length + " of them, read from the file itself)", MOVED.length >= 90 && ["hcCardHTML", "hhRoomsPageHTML", "hhRotationsHTML", "hhProjectsHTML", "hhOnceHTML", "hhEditHTML", "hhOnceSweep"].every(n => MOVED.includes(n)), MOVED.length);
ok("…and the ones the plan and the lists need stayed in index.html (hhIsOnce, hhIsProject, hhProjLog, hhOnceHeld)", ["hhIsOnce", "hhIsProject", "hhProjLog", "hhOnceHeld"].every(n => !HNAMES.includes(n) && new RegExp("^function " + n + "\\(", "m").test(RAW)));
// units: every top-level declaration of index.html's main script and of the other .js files
function unitsOf(raw, file, mainOnly) {
  const L = raw.split("\n"), cm = P.scanJs(raw).cm.split("\n"); let a = 0, b = L.length; const out = [];
  if (mainOnly) { a = L.lastIndexOf("<script>") + 1; b = L.lastIndexOf("</script>"); out.push({ file, name: "<outside the main script>", line: 0, text: cm.slice(0, a).join("\n") + "\n" + cm.slice(b).join("\n") }); }
  const st = []; for (let i = a; i < b; i++) { const m = /^(?:async\s+)?function\s*\*?\s*([\w$]+)|^(?:const|let|var)\s+([\w$]+)|^class\s+([\w$]+)/.exec(L[i]); if (m) st.push([i, m[1] || m[2] || m[3]]); }
  out.push({ file, name: "<top of " + file + ">", line: a + 1, text: cm.slice(a, st.length ? st[0][0] : b).join("\n") });
  st.forEach((s, k) => out.push({ file, name: s[1], line: s[0] + 1, text: cm.slice(s[0], k + 1 < st.length ? st[k + 1][0] : b).join("\n"), lines: cm.slice(s[0], k + 1 < st.length ? st[k + 1][0] : b) }));
  return out;
}
const OTHER = fs.readdirSync(DIR).filter(f => /\.js$/.test(f) && !/^test_|^perf_budget|^house\.js$|^sw\.js$/.test(f));
const mention = (text, n) => text.indexOf(n) >= 0 && new RegExp("(^|[^\\w$.])" + n.replace(/\$/g, "\\$") + "(?![\\w$])").test(text);
// who reaches the house.js names from the page: walk back from every unit that mentions one; a chain may end only at
// renderHousehold (the door) or at a unit nobody mentions except house.js itself (an onclick drawn by house.js).
const LOADER = new Set(["haLazyReady"]);   // LAZYSPLIT's sentinel check (typeof hpPeople) — the loader itself, name-agnostic
function reach(raw) {
  const U = unitsOf(raw, "index.html", true), H = unitsOf(HJS, "house.js", false).filter(u => !u.name.startsWith("<"));
  const all = U.concat(H); const names = new Set(HNAMES);
  const seen = new Map(), q = [], bad = [];
  U.forEach(u => { if (names.has(u.name) || LOADER.has(u.name)) return; const hit = HNAMES.find(n => mention(u.text, n)); if (hit) { seen.set(u.name, hit); q.push(u); } });
  while (q.length) { const u = q.shift(); if (u.name === "renderHousehold") continue;
    if (u.name.startsWith("<")) { bad.push(u.name + " ← " + seen.get(u.name)); continue; }
    const by = all.filter(v => v !== u && !names.has(v.name) && v.file === "index.html" && mention(v.text, u.name));
    const byHouse = H.some(v => mention(v.text, u.name));
    if (!by.length && !byHouse) bad.push(u.name + " (nothing calls it) ← " + seen.get(u.name));
    by.forEach(v => { if (!seen.has(v.name)) { seen.set(v.name, u.name + " ← " + seen.get(u.name)); q.push(v); } }); }
  return { bad, seen };
}
{ const R = reach(RAW);
  ok("every function in index.html that reaches a house.js name is reached only from renderHousehold (or only from house.js's own code)", R.bad.length === 0, R.bad.slice(0, 6));
  ok("…the walk saw the Household page's own drawing (hhRowHTML, hhGiveHTML, hhKitchenHTML, hhAddHTML, renderHousehold)", ["hhRowHTML", "hhGiveHTML", "hhKitchenHTML", "hhAddHTML", "renderHousehold"].every(n => R.seen.has(n)), [...R.seen.keys()]);
  ok("…and nothing a kid, Dad or a kiosk runs is in it (rtStepsFor, hhMaterialize, hhSyncKids, rtCfgSave, hhPlanBuild, hhPlanCheck, hhHouseCardHTML, momSchedHouse, gbList)",
    ["rtStepsFor", "hhMaterialize", "hhSyncKids", "rtCfgSave", "hhPlanBuild", "hhPlanCheck", "hhHouseCardHTML", "momSchedHouse", "gbList", "householdOnValue", "hhDerivePerson"].every(n => !R.seen.has(n)));
  // mutation: a planted call from Chores & Stars' save into a moved function must be caught
  const planted = RAW.replace("function rtCfgSave(){", "function rtCfgSave(){ if(typeof hhRotationsHTML===\"function\") hhRotationsHTML();");
  ok("a planted call (rtCfgSave → hhRotationsHTML) is caught by the walk", planted !== RAW && reach(planted).bad.length > 0);
  // the line guard (test_lazy_split's rule, here for every house.js name): typeof X / window.X on the same line
  const cmL = P.scanJs(RAW).cm.split("\n"), Lr = RAW.split("\n"), a = Lr.lastIndexOf("<script>"), b = Lr.lastIndexOf("</script>"), bare = [];
  for (let i = a + 1; i < b; i++) for (const n of HNAMES) { const l = cmL[i]; if (l.indexOf(n) < 0 || !mention(l, n)) continue;
    if (!new RegExp("typeof\\s+(window\\.)?" + n.replace(/\$/g, "\\$") + "(?![\\w$])|window\\." + n.replace(/\$/g, "\\$") + "(?![\\w$])").test(l)) bare.push((i + 1) + " " + n); }
  ok("every mention of a house.js name in index.html is typeof-guarded on its line", bare.length === 0, bare.slice(0, 8));
  const others = []; OTHER.forEach(f => { const t = P.scanJs(fs.readFileSync(path.join(DIR, f), "utf8")).cm; MOVED.forEach(n => { if (mention(t, n)) others.push(f + " " + n); }); });
  ok("no other .js file (" + OTHER.length + " of them) mentions a moved name", others.length === 0, others);
  const eng = P.scanJs(blockOf(HJS, "HOUSEENG", "HOUSEENG")).cm, engUse = MOVED.filter(n => mention(eng, n));
  ok("HOUSEENG (step 4 moves it into the page) reads none of the moved names", eng.length > 1000 && engUse.length === 0, engUse);
}

// ── 3. house.js loaded: every Household view is byte-identical to the unmoved source ─────────────────────────────────────
console.log("\n── 3. with house.js, every Household view is the same as before ──");
const page = (c, view, setup) => { c.get('hhView="' + view + '"'); if (setup) setup(c); const el = { innerHTML: "" }; c.renderHousehold(el); return el.innerHTML; };
const VIEWS = [
  ["review", null], ["rooms (top page)", c => c.get('hhView="rooms"; hhRmSel=""'), "rooms"], ["a room page (kitchen)", c => c.get('hhRmSel="kitchen"'), "rooms"],
  ["the chore card", c => { c.get('hhRmSel="kitchen"'); c.hcOpen("k_counter"); }, "rooms"], ["the chore card, a new chore", c => { c.get('hhRmSel="kitchen"'); c.hcAdd("kitchen"); }, "rooms"],
  ["⚙ Rules", c => { c.get('hhRmSel="kitchen"'); c.hcFold("kitchen|rules"); }, "rooms"], ["🔍 Checks", c => { c.get('hhRmSel="kitchen"'); c.hcFold("kitchen|checks"); }, "rooms"],
  ["a room page, editing rooms", c => { c.get('hhRmSel="kitchen"'); if (c.hhRmEditToggle) c.hhRmEditToggle(); }, "rooms"],
  ["the rotation editor", c => { c.hhRotOpen("r_ada"); }, "rot"], ["the rotation list", null, "rot"], ["a rotation panel under a row", c => { c.hhRotOpen("r_ben"); }, "review"],
  ["Projects", null, "proj"], ["Projects, one open", c => c.hhProjToggle("p_cab"), "proj"], ["the Once pile", null, "once"],
  ["By person", null, "person"], ["the older editor (✎ under a row)", c => c.hhEditToggle("k_mop"), "area"],
  ["Today", null, "today"], ["Habits", null, "habits"], ["Week", null, "week"], ["Area", null, "area"], ["Room", null, "room"], ["Levels", null, "levels"], ["Kitchen", null, "kitchen"], ["Laundry", null, "laundry"]
];
const NV = {};
VIEWS.forEach(([name, setup, view]) => { const n = NEWH(), o = OLD(); let a, b;
  try { a = page(n, view || name, setup); } catch (e) { a = "THREW " + e.message; } try { b = page(o, view || name, setup); } catch (e) { b = "THREW " + e.message; }
  NV[name] = a; ok("same page: " + name + " (" + a.length + " chars)", a === b && !/^THREW/.test(a) && a.length > 200 && !/Loading the Household page/.test(a), [a.slice(0, 160), b.slice(0, 160)]); });
ok("the views show what they are for (card, rules, checks, rotation, projects, once pile, by person)",
  /Wipe the counters/.test(NV["the chore card"]) && /⚙ Rules ▾/.test(NV["⚙ Rules"]) && /🔍 Checks/.test(NV["🔍 Checks"]) && /🔁/.test(NV["the rotation editor"]) && /The art cabinet/.test(NV["Projects, one open"]) && /Fix the shelf/.test(NV["the Once pile"]) && /hpPick|👤/.test(NV["By person"]));
{ const n = NEWH(); ["review", "rooms", "rot", "proj", "once", "person", "kitchen"].forEach(v => { try { page(n, v); } catch (e) {} }); ok("drawing every view with house.js wrote nothing", n.writes.length === 0, n.writes.slice(0, 3)); }

// ── 4. before the file lands: the loading line, one load, then the page ───────────────────────────────────────────────────
console.log("\n── 4. before house.js lands ──");
VIEWS.forEach(([name, setup, view]) => {
  const c = NEW(); c.get('hhView="' + (view || name) + '"');
  const el = { innerHTML: "" }; c.pageEl = el;
  try { c.renderHousehold(el); c.renderHousehold(el); } catch (e) { el.innerHTML = "THREW " + e.message; }   // asked twice before it lands
  const waiting = /⏳ Loading the Household page…/.test(el.innerHTML) && !/banner/.test(el.innerHTML);
  const oneLoad = c.tags.length === 1 && c.tags[0].src === "house.js";
  if (!oneLoad) return ok("before it lands: " + name, false, { waiting, tags: c.tags.length });
  vm.runInContext(HJS, c, { filename: "house.js" }); c.tags[0].onload();   // the <script> ran; its onload resolves haLazyLoad
  new Promise(r => setTimeout(r, 0)).then(() => {
    try { if (setup) { setup(c); c.renderHousehold(el); } } catch (e) { el.innerHTML = "THREW " + e.message; }
    ok("before it lands: " + name + " says 'Loading the Household page…' and starts ONE load; when it lands the page draws, the same as with house.js", waiting && c.renders.length >= 1 && el.innerHTML === NV[name], { waiting, renders: c.renders.length, same: el.innerHTML === NV[name] });
  }).catch(e => ok("before it lands: " + name, false, e.message));
});
const left = (() => { const c = NEW(); const el = { innerHTML: "" }; c.pageEl = el; c.renderHousehold(el); el.innerHTML = "<kids corner>";
  vm.runInContext(HJS, c, { filename: "house.js" }); c.tags[0].onload();
  return new Promise(r => setTimeout(r, 0)).then(() => ok("a page she has already left is not drawn over when the file lands", el.innerHTML === "<kids corner>" && c.renders.length === 0, c.renders.length)); })();
const failed = (() => { const c = NEW(); const el = { innerHTML: "" }; c.pageEl = el; c.renderHousehold(el); c.tags[0].onerror();
  return new Promise(r => setTimeout(r, 0)).then(() => { c.renderHousehold(el);
    ok("a failed fetch keeps the loading line and tries again on the next draw (a second <script>)", /Loading the Household page/.test(el.innerHTML) && c.tags.length === 2, c.tags.length); }); })();

setTimeout(() => { console.log("\n" + pass + " passed, " + fail + " failed"); process.exit(fail ? 1 : 0); }, 300);
