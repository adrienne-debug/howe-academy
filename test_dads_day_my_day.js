/*
 * Node tests — 👨 DADMYDAY (#93, her ask 2026-10-09: "dad needs like moms my day and kids today").
 * Dad's Day draws Mom's 🏡 My day card fed by HIS dadChores + dadday stamps (to-do, Start a load, grocery add inside),
 * and Mom's 🧒 kid rows in place of Star Bank + Kids today — − [5] + and the tech switch only when _dadAward.
 * Mom's Home Base output is compared byte-for-byte against origin/main (git show) for a fixture.
 *
 *   run:  node test_dads_day_my_day.js
 *   (set DADMYDAY_DUMP=/path/file.html to write the rendered Dad's Day fixture for a screenshot)
 */
const fs = require("fs"), path = require("path"), cp = require("child_process");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
let old = null;
try { old = cp.execSync("git show origin/main:index.html", { cwd: __dirname, maxBuffer: 1 << 28, stdio: ["ignore", "pipe", "ignore"] }).toString("utf8"); } catch (e) {}
function sliceFrom(text, name) {
  const i = text.indexOf("function " + name + "("); if (i < 0) return null;
  let d = 0;
  for (let k = text.indexOf("{", i); k < text.length; k++) { if (text[k] === "{") d++; else if (text[k] === "}" && --d === 0) return text.slice(i, k + 1); }
  throw new Error("unbalanced: " + name);
}
function constFrom(text, name) { const i = text.indexOf("const " + name + "="); if (i < 0) throw new Error("const " + name); let d = 0;
  for (let k = text.indexOf("=", i) + 1; k < text.length; k++) { const c = text[k]; if (c === "{" || c === "[") d++; else if (c === "}" || c === "]") d--; else if (c === ";" && d === 0) return text.slice(i, k + 1); } }
let pass = 0, fail = 0;
function ok(name, cond, extra) { if (cond) { pass++; console.log("  ok  - " + name); } else { fail++; console.log("  FAIL- " + name + (extra !== undefined ? "  (" + JSON.stringify(extra).slice(0, 300) + ")" : "")); } }

const FN = ["mdMine", "momDayStripHTML", "_mcRow", "mcDueIn", "mcDueToday", "mcAll", "mcDoneOn", "mcSlotOf", "tdRunning", "mpSlotNow",
  "ddDueToday", "dcAll", "dcDoneOn", "ddPopHTML", "ddSlotGroups", "ddToggleManage", "dcRepaint",
  "mdCardKidsToday", "slCellState", "mdSlotCounts", "_boardTaskCounts", "activeWk", "slKey", "getSlot",
  "renderDadsDay", "mdCardLaundry", "techToggle", "techTaken", "techLost"];
const CONSTS = ["MC_DEFAULT", "MC_SLOTS", "MC_SLOT_ORDER"];
const ROSTER = ["ava", "ben"], NAMES = { ava: "Ava", ben: "Ben" }, COLS = { ava: "#e11d48", ben: "#2563eb" };

// A fixed fixture world. `text` is either the branch or origin/main source.
function world(text, o) {
  o = o || {};
  const log = { writes: [], toasts: [], renders: 0 };
  const els = {};
  const env = {
    SL_KIDS: ROSTER.slice(), SL_KCOL: COLS, WK: "week26", weekData: { week: "week26" }, slState: {},
    DAYS_ALL: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
    esc: s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"),
    cap: s => NAMES[s] || (String(s).charAt(0).toUpperCase() + String(s).slice(1)),
    cadDueOn: (cad, d) => { cad = cad || "daily"; if (cad === "daily") return true; if (cad.indexOf("wk:") === 0) return cad.slice(3).split(",").map(Number).indexOf(["monday","tuesday","wednesday","thursday","friday","saturday","sunday"].indexOf(d)) >= 0; return false; },
    cadLabel: c => "[" + c + "]",
    momChoresData: o.momChores || {}, momdayData: o.momday || {}, dadChoresData: o.dadChores || {}, daddayData: o.dadday || {},
    laundryData: o.laundry || {}, kitSettings: { orderDay: "friday" },
    grMdShopHTML: () => "<!--MOMSHOP-->", grDadShopHTML: () => "<!--DADSHOP-->",
    _todayStr: () => "2026-10-12", mdTodayName: () => "monday", mpDayNow: () => "monday",
    momHere: () => !!o.mom, dadAwardOk: () => !!o.dad, DAD_PIN: "1234", _kioskD: () => !!o.kiosk,
    kitDuePrepHTML: () => ({ n: 0, html: "" }), helperDadCardHTML: () => "",
    mdCardBPDad: () => "<!--BP-->", mdCardStarBank: () => "<!--STARBANK-->", mdCardCheckLog: () => "<!--CHECKLOG-->",
    mdCardDinner: () => "<!--DINNER-->", mdCardBills: () => "<!--BILLS-->",
    LAUNDRY_STAGES: ["washer", "dryer", "fold"], LAUNDRY_STAGE_META: { washer: ["🫧", "In the washer"], dryer: ["🌀", "In the dryer"], fold: ["🧺", "Fold pile"] },
    laundrySince: () => "9:00", laundryDoneTxt: () => "", laundryTimesEditorHTML: () => "", momTipLaundryHTML: () => "", laundryAdvanceLabel: () => "Move",
    morningComplete: (k) => k === "ava", rtIsMulti: () => true, rtComplete: () => false,
    morningDueIdx: () => [0, 1], mStepDoneOn: (k, d, i) => i === 0, rtStepsFor: () => [{ cad: "daily", label: "Shower" }], rtDoneOn: () => false,
    getActiveTasks: () => [], effectiveDay: () => "monday", checked: {},
    earnedDayTotal: k => (k === "ava" ? 12 : 3), bankBalance: k => (k === "ava" ? 1234 : 50),
    paceKidStatus: () => ({ subjects: 0 }), routineRules: {}, techOff: {}, techGrace: {}, breakPause: () => false, _todayDay: "monday",
    loseTechHour: () => 10, techGraced: () => false,
    gwShowToast: t => log.toasts.push(t), renderAll: () => { log.renders++; }, renderMomsPlan: () => { log.renders++; },
    tab: "moms-plan", _kioskR: () => false, renderKioskPerson: () => {},
    db: { ref: p => ({ set: v => log.writes.push([p, v]), update: v => log.writes.push([p, v]), remove: () => log.writes.push([p, null]) }) },
    document: { getElementById: id => (els[id] = els[id] || { id, innerHTML: "", value: "" }) },
    Date: class extends Date { getHours() { return o.hour == null ? 9 : o.hour; } },
    Object, Array, String, Number, Math, JSON, parseInt,
  };
  const fns = FN.map(n => sliceFrom(text, n)).filter(Boolean).join("\n");
  const body = "let day='monday', mcManage=" + !!o.mcManage + ", ddManage=" + !!o.ddManage + ", mpSlot=" + JSON.stringify(o.slot || null) + ";\n" +
    CONSTS.map(c => constFrom(text, c)).join("\n") + "\nfunction mpSlotAuto(){ return 'morning'; }\n" + fns +
    "\nreturn { momDayStripHTML, mdCardKidsToday, renderDadsDay:typeof renderDadsDay==='function'?renderDadsDay:null, techToggle, mdMine:typeof mdMine==='function'?mdMine:null, setDdManage:v=>{ddManage=v;} };";
  const keys = Object.keys(env);
  const api = new Function(...keys, body)(...keys.map(k => env[k]));
  return { api, log, els, env };
}

const MOM = {
  momChores: { m1: { label: "Coffee + creatine", cad: "daily", slot: "morning", ts: 1 }, m2: { label: "Mop", cad: "wk:0", ts: 2 }, m3: { label: "Magnesium", cad: "daily", slot: "night", ts: 3 }, m4: { label: "Tubs", cad: "wk:1", ts: 4 } },
  momday: { "2026-10-12": { chores: { m1: 111 }, todos: { t1: { text: "Call <dentist>", done: false, ts: 5 }, t2: { text: "Return library books", done: true, doneOn: "2026-10-12", ts: 6 } } }, "2026-10-10": { todos: { t0: { text: "Old unfinished", done: false, ts: 1 } } } },
  laundry: { l1: { label: "Towels", stage: "washer", ts: 1 } },
};
const DAD = {
  dadChores: { d1: { label: "Take out trash", cad: "daily", slot: "morning", ts: 10 }, d2: { label: "Feed the dog", cad: "daily", slot: "morning", ts: 11 }, d3: { label: "Mow", cad: "wk:5", slot: "", ts: 12 },
    d4: { label: "Check tire pressure", cad: "daily", slot: "", ts: 13 }, d5: { label: "Lock up", cad: "daily", slot: "night", ts: 14 } },
  dadday: { "2026-10-12": { chores: { d1: 222 }, todos: { x1: { text: "Fix the gate", done: false, ts: 3 } } } },
  laundry: { l1: { label: "Towels", stage: "washer", ts: 1 } },
};

console.log("── Mom's Home Base is byte-identical to origin/main ──");
if (!old) { ok("origin/main source available (git show)", false); }
else {
  ["morning", "afternoon", "night"].forEach(sl => [false, true].forEach(mg => {
    const o = Object.assign({}, MOM, { slot: sl, mcManage: mg });
    const a = world(old, o).api.momDayStripHTML("2026-10-12", "monday");
    const b = world(src, o).api.momDayStripHTML("2026-10-12", "monday");
    ok("🏡 My day, " + sl + (mg ? " (✎ editing)" : "") + ": same bytes (" + a.length + ")", a === b && a.length > 1000);
  }));
  {
    const o = { slot: "afternoon" };   // empty list → code defaults; afternoon has none → ✨ seed button path
    ok("🏡 My day with the defaults + empty slot: same bytes", world(old, o).api.momDayStripHTML("2026-10-12", "tuesday") === world(src, o).api.momDayStripHTML("2026-10-12", "tuesday"));
  }
  [true, false].forEach(sd => {
    const a = world(old, MOM).api.mdCardKidsToday("monday", sd, true), b = world(src, MOM).api.mdCardKidsToday("monday", sd, true);
    ok("🧒 kid rows (Mom's Day, school day=" + sd + "): same bytes", a === b && /mpBankAsk\('ava',1\)/.test(b));
    ok("🧒 plain Kids today (no bank): same bytes", world(old, MOM).api.mdCardKidsToday("monday", sd) === world(src, MOM).api.mdCardKidsToday("monday", sd));
  });
  ok("renderMomsDay source untouched", sliceFrom(old, "renderMomsDay") === sliceFrom(src, "renderMomsDay"));
  ok("Mom's starter seeds / editor / add untouched", ["mcSeedSlot", "mcAdd", "mcToggle", "momChoresCardHTML", "mcPopHTML", "grMdShopHTML"].every(n => sliceFrom(old, n) === sliceFrom(src, n)));
}

console.log("\n── Dad's 🏡 My day: his chores by slot, his done stamps ──");
{
  const w = world(src, DAD);
  const h = w.api.momDayStripHTML("2026-10-12", "monday", "dad");
  ok("same card: 🏡 My day header in his blue with ✎ Edit → his editor", /background:#2C5F8A;[^>]*><span>🏡<\/span> My day/.test(h) && /onclick="ddToggleManage\(\)"/.test(h) && !/mcToggleManage/.test(h));
  ok("☀️ Morning chip counts his 1/2, 🌙 Night 0/1, 🌤 Afternoon 0/0", /☀️ Morning<div[^>]*>1\/2</.test(h) && /🌙 Night<div[^>]*>0\/1</.test(h) && /🌤 Afternoon<div[^>]*>0\/0</.test(h));
  ok("morning list = his two morning chores, oldest first", h.indexOf("Take out trash") > 0 && h.indexOf("Take out trash") < h.indexOf("Feed the dog") && !/Lock up/.test(h));
  ok("done stamp ticks the row (✓ + line-through) and taps go to dcToggle", /onclick="dcToggle\('d1'\)"[^>]*background:#16a34a[^>]*>✓</.test(h) && /onclick="dcToggle\('d2'\)"[^>]*background:#fff/.test(h) && !/mcToggle\(/.test(h));
  ok("🧹 Ongoing = his unslotted chores due today (Mow is Saturday → hidden)", /🧹 Ongoing/.test(h) && /Check tire pressure/.test(h) && !/>Mow</.test(h));
  ok("his add-row keeps time of day + days (dcAdd)", /id="dc-new"/.test(h) && /id="dc-slot"/.test(h) && /id="dc-cad"/.test(h) && /onclick="dcAdd\(\)"/.test(h) && !/id="mc-new"/.test(h));
  ok("📝 his to-do (dadday), toggles via ddTodoToggle", /Fix the gate/.test(h) && /ddTodoToggle\('x1','2026-10-12'\)/.test(h) && /id="dd-todo-new"/.test(h) && !/momdayToggleTodo|md-todo-new/.test(h));
  ok("🧺 Start a load box + 🛒 his grocery add inside the card", /id="laundry-label"/.test(h) && /onclick="laundryAdd\(\)"/.test(h) && /<!--DADSHOP-->/.test(h) && !/MOMSHOP/.test(h));
  ok("no Mom data leaks in (her chores/todos absent)", !/Coffee|dentist/.test(h));
  const n = world(src, Object.assign({}, DAD, { slot: "afternoon" })).api.momDayStripHTML("2026-10-12", "monday", "dad");
  ok("empty slot: a plain hint, no ✨ Mom starter seeds", /Nothing set for afternoon yet/.test(n) && !/mcSeedSlot/.test(n));
  ok("Night chip switches to his night list", /Lock up/.test(world(src, Object.assign({}, DAD, { slot: "night" })).api.momDayStripHTML("2026-10-12", "monday", "dad")));
  ok("rendering writes nothing", w.log.writes.length === 0);
}

console.log("\n── Dad's Day page ──");
function dadPage(o) { const w = world(src, Object.assign({}, DAD, o)); const el = { innerHTML: "" }; w.api.renderDadsDay(el); return { h: el.innerHTML, w }; }
{
  const { h } = dadPage({});
  ok("🏡 My day is on Dad's Day, before the kid rows", h.indexOf("</span> My day") > 0 && h.indexOf("</span> My day") < h.indexOf("</span> Kids today"));
  ok("old separate checklist / to-do / grocery cards gone", !/> My checklist/.test(h) && !/> My to-do/.test(h) && !/🛒 Grocery list<span/.test(h));
  ok("old ⭐ Star Bank card no longer drawn (folded into kid rows)", !/<!--STARBANK-->/.test(h) && (h.match(/<\/span> Kids today/g) || []).length === 1);
  ok("ids unique: one dc-new, one laundry-label, one dd-todo-new", ["dc-new", "laundry-label", "dd-todo-new"].every(id => (h.match(new RegExp('id="' + id + '"', "g")) || []).length === 1));
  const order = ["<!--BP-->", "</span> Kids today", "<!--CHECKLOG-->", "<!--DINNER-->", "<!--BILLS-->", "</span> Laundry"].map(x => h.indexOf(x));
  ok("rest of his cards in the same order: BP · kids · check log · dinner · bills · laundry", order.every((v, i) => v > 0 && (i === 0 || v > order[i - 1])), order);
  ok("laundry card = running loads only (no second start box)", (h.match(/Start a load/g) || []).length === 1);
  ok("✎ Edit pop-up closed by default", !/id="dd-pop"/.test(h));
}
{
  const w = world(src, DAD); w.api.setDdManage(true); const el = { innerHTML: "" }; w.api.renderDadsDay(el); const h = el.innerHTML;
  ok("✎ Edit opens his full list: every chore incl. Mow (not due), with slot/days selects + ✕", /id="dd-pop"/.test(h) && /dcSetSlot\('d3'/.test(h) && /dcSetCad\('d3'/.test(h) && /dcDel\('d5'\)/.test(h));
}

console.log("\n── 🧒 kid rows: star + tech controls only with _dadAward ──");
{
  const locked = dadPage({}).h;
  ok("locked: no − [5] + box, no ⭐ what-for pop-up, no tech switch", !/mpBankAsk\(/.test(locked) && !/id="mpbank-/.test(locked) && !/techToggle\(/.test(locked));
  ok("locked: rows still show lights, fractions, rooms, ⭐ today + 🏦", /🌅 1\/2/.test(locked) && /🚿/.test(locked) && /⭐ \+12/.test(locked) && /🏦 1,234/.test(locked));
  ok("locked: the Dad-code box is shown", /id="dad-pin-input"/.test(locked));
  const dadOn = dadPage({ dad: true }).h, momOn = dadPage({ mom: true }).h;
  [["Dad code", dadOn], ["Mom here", momOn]].forEach(([nm, h]) => {
    ok(nm + ": − [5] + per kid open the what-for pop-up", ROSTER.every(k => h.indexOf("mpBankAsk('" + k + "',-1)") >= 0 && h.indexOf("mpBankAsk('" + k + "',1)") >= 0 && h.indexOf('id="mpbank-' + k + '"') >= 0));
    ok(nm + ": tech switch per kid, marked as Dad's Day (dad=1)", ROSTER.every(k => h.indexOf("techToggle('" + k + "','monday',1)") >= 0));
  });
  // well-formed: same number of <div and </div> on every variant
  [locked, dadOn].forEach((h, i) => ok("balanced divs (" + (i ? "unlocked" : "locked") + ")", (h.match(/<div\b/g) || []).length === (h.match(/<\/div>/g) || []).length));
}
{
  const w = world(src, { dad: true }); w.api.techToggle("ava", "monday", 1);
  ok("techToggle(dad=1) with Dad code → writes the flag", w.log.writes.some(x => x[0] === "techOff/ava/week26/monday" && x[1] === true));
  const w2 = world(src, { dad: true }); w2.api.techToggle("ava", "monday");
  ok("techToggle without dad=1 stays Mom-only even with the Dad code", w2.log.writes.length === 0 && /Unlock Mom/.test(w2.log.toasts[0] || ""));
  const w3 = world(src, {}); w3.api.techToggle("ava", "monday", 1);
  ok("techToggle(dad=1) with no code → nothing written", w3.log.writes.length === 0);
}

console.log("\n── wiring ──");
{
  const dd = sliceFrom(src, "renderDadsDay");
  ok("_dadAward still = momHere()||dadAwardOk(), passed to the kid rows", /const _dadAward=momHere\(\)\|\|dadAwardOk\(\);/.test(dd) && /mdCardKidsToday\(today,true,true,_dadAward\)/.test(dd));
  ok("Dad kiosk still routes to Dad's Day only", /if\(mpSubView==='dad'\)\{ return renderDadsDay\(el\); \}/.test(src) && /function _kioskD\(\)/.test(src));
  ok("his data nodes only (no momChores writes from Dad code)", !/momChores/.test(sliceFrom(src, "ddPopHTML") + sliceFrom(src, "ddDueToday")));
}

if (process.env.DADMYDAY_DUMP) {
  const FIX = Object.assign({}, DAD, { slot: "morning" });
  const page = o => { const w = world(src, Object.assign({}, FIX, o)); const el = { innerHTML: "" }; w.api.renderDadsDay(el); return el.innerHTML; };
  const css = (src.match(/<style>([\s\S]*?)<\/style>/) || [, ""])[1];
  fs.writeFileSync(process.env.DADMYDAY_DUMP, '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>' + css + '</style></head><body style="background:#f5f1ea;margin:0">'
    + '<div style="padding:6px 14px;font:700 12px sans-serif;color:#555">LOCKED (no Dad code)</div>' + page({})
    + '<div style="padding:6px 14px;font:700 12px sans-serif;color:#555">UNLOCKED (Dad code entered)</div>' + page({ dad: true }) + '</body></html>');
  console.log("  wrote " + process.env.DADMYDAY_DUMP);
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
