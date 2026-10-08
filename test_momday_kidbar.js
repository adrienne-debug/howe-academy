/*
 * Node tests — 🧒 KIDBAR: Mom's Day kid rows (her ask 2026-10-08, second pass): the 🧒 Kids-today row she
 * knows, with a done-light in front of every fraction (routine lights = the Schedule ▸ All tab's state),
 * the 🚿/🧺 rooms line under it, then ⭐ today + 🏦 balance with the Star Bank's − [5] + box.
 * Rendering is display only; the + / − buttons call the existing mpBankAdj give/dock path.
 *
 *   run:  node test_momday_kidbar.js
 */
const fs = require("fs"), path = require("path");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
function slice(name) {
  const sig = "function " + name + "(";
  const i = src.indexOf(sig); if (i < 0) throw new Error("function not found: " + name);
  let d = 0, j = src.indexOf("{", i);
  for (let k = j; k < src.length; k++) { if (src[k] === "{") d++; else if (src[k] === "}") { d--; if (d === 0) return src.slice(i, k + 1); } }
  throw new Error("unbalanced: " + name);
}
const FNS = ["slKey", "getSlot", "activeWk", "slCellState", "slDotHTML",
  "renderSkylight", "mdCardStarBank", "mdCardKidsToday", "mdSlotCounts", "_boardTaskCounts", "esc"].map(slice).join("\n");
let pass = 0, fail = 0;
function ok(name, cond, extra) { if (cond) { pass++; console.log("  ok  - " + name); } else { fail++; console.log("  FAIL- " + name + (extra !== undefined ? "  (" + JSON.stringify(extra) + ")" : "")); } }

// A NON-Howe roster on purpose: the bar must come from the roster, never from hard-coded names.
const ROSTER = ["ava", "ben", "cy"];
const NAMES = { ava: "Ava", ben: "Ben", cy: "Cy" };
const COLS = { ava: "#e11d48", ben: "#2563eb", cy: "#16a34a" };

function world(o) {
  o = o || {};
  const log = { writes: [], ls: [], renders: 0 };
  const els = {};
  const mkEl = id => (els[id] = els[id] || { id, style: {}, innerHTML: "", className: "", textContent: "" });
  // Routine "truth" per day — the stubs read the day they are ASKED about, so a wrong pin shows up.
  const morn = o.morn || {}, multi = o.multi || {};
  const env = {
    ROSTER, SL_KIDS: ROSTER.slice(), SL_KLBL: NAMES, SL_KCOL: COLS,
    SL_SLBL: { morning: "Morning", afternoon: "Afternoon", chores: "Chores", evening: "Evening" },
    WK: "week26", weekData: { week: "week26" }, slState: o.slState || {},
    morningComplete: (k, d) => !!(morn[d] || {})[k],
    rtIsMulti: s => s === "afternoon" || s === "chores" || s === "evening",
    rtComplete: (s, k, d) => !!((multi[d] || {})[k] || {})[s],
    activeSlots: () => (o.slots || ["morning", "afternoon", "chores", "evening"]).slice(),
    getActiveTasks: () => o.tasks || [], effectiveDay: t => t.day, checked: o.checked || {},
    earnedDayTotal: (k, d) => ((o.pts || {})[d] || {})[k] || 0,
    bankBalance: k => (o.bal || {})[k] || 0,
    cap: s => NAMES[s] || (String(s).charAt(0).toUpperCase() + String(s).slice(1)),
    mpDayNow: () => o.mpDay || o.today, DAYS_ALL: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
    morningDueIdx: () => [0, 1], mStepDoneOn: () => false, rtStepsFor: () => [], cadDueOn: () => true, rtDoneOn: () => false,
    techLost: () => false, paceKidStatus: () => ({ subjects: 0 }),
    renderMomsPlan: () => { log.renders++; },
    mrIndividualHTML: () => "", rtSlotHTML: () => "", schedTipHtml: () => "", calEventBanner: () => "", calUpcomingHTML: () => "", techBanner: () => "",
    mealMissSweep: undefined,
    document: { getElementById: id => (id === "content" ? mkEl("content") : mkEl(id)) },
    db: { ref: p => ({ set: v => log.writes.push([p, v]), update: v => log.writes.push([p, v]), remove: () => log.writes.push([p, null]), push: v => log.writes.push([p, v]) }) },
    HA_LS: { setItem: (k, v) => log.ls.push([k, v]), getItem: () => null },
    Date: class { getHours() { return o.hour == null ? 9 : o.hour; } getMinutes() { return 0; } },
    Object, Array, String, Number, Math, JSON, parseInt, isNaN,
  };
  const keys = Object.keys(env);
  const body = "let day=" + JSON.stringify(o.day || o.today) + ", _todayDay=" + JSON.stringify(o.today) + ", kid=" + JSON.stringify(o.kid || "all") +
    ", momModeActive=false, tab='schedule', schedShowAdmin=false, schedShowHistory=false, schedShowPace=false, schedShowBoard=false, schedShowPeek=false;\n" +
    FNS + "\nreturn { mdCardKidsToday, renderSkylight, mdCardStarBank, slCellState, slDotHTML, getDay: () => day, setDay: d => { day = d; } };";
  const api = new Function(...keys, body)(...keys.map(k => env[k]));
  return { api, log, els, env };
}
const dots = html => html.match(/<div class="sl-dot[^"]*"[^>]*>[^<]*<\/div>/g) || [];
// one kid's row inside the Kids-today card (rows start with the name in the kid's colour)
const rows = html => html.split('<div style="padding:8px 0;border-bottom:1px solid #f3f4f6">').slice(1);
// the light in front of a pill: done (kid colour, ✓) or not (grey ring, empty)
const light = (row, emo) => { const m = new RegExp("(<span title=\"[^\"]*\" style=\"[^\"]*\">(✓)?</span>)" + emo + " (\\d+)/(\\d+)").exec(row); return m ? { done: !!m[2], frac: m[3] + "/" + m[4] } : null; };

const TODAY = "monday";
const STATE = {
  today: TODAY,
  morn: { monday: { ava: true, ben: false, cy: true }, tuesday: { ava: false, ben: true, cy: false } },
  multi: { monday: { ava: { afternoon: true }, ben: { chores: true, evening: true }, cy: {} }, tuesday: { ava: { chores: true }, ben: {}, cy: { evening: true } } },
  slState: {},
  tasks: [{ id: "a1", who: "ava", day: "monday", title: "Math" }, { id: "a2", who: "ava", day: "monday", title: "Spelling" }, { id: "a3", who: "ava", day: "monday", title: "Lunch" },
    { id: "b1", who: "ben", day: "monday", title: "Reading" }, { id: "b2", who: "ben", day: "tuesday", title: "Science" }],
  checked: { a1: { ts: "9:00 AM" }, b1: { ts: "9:30 AM" } },
  pts: { monday: { ava: 12, ben: 0, cy: 7 } },
  bal: { ava: 1234, ben: 50, cy: 0 },
};

console.log("── lights in front of each fraction ──");
{
  const w = world(STATE);
  const rs = rows(w.api.mdCardKidsToday(TODAY, true, true));
  ok("one row per roster kid, in roster order", rs.length === 3 && /color:#e11d48;[^>]*>Ava</.test(rs[0]) && /color:#2563eb;[^>]*>Ben</.test(rs[1]) && /color:#16a34a;[^>]*>Cy</.test(rs[2]));
  const want = { morning: "🌅", afternoon: "☀️", chores: "🧹", evening: "🌙" };
  let same = true;
  ROSTER.forEach((k, ki) => Object.keys(want).forEach(sl => { const l = light(rs[ki], want[sl]); if (!l || l.done !== !!w.api.slCellState(sl, k).done) same = false; }));
  ok("every routine light matches the All tab's state for that kid + slot", same);
  ok("Ava: 🌅 lit, ☀️ lit, 🧹 dark, 🌙 dark", light(rs[0], "🌅").done && light(rs[0], "☀️").done && !light(rs[0], "🧹").done && !light(rs[0], "🌙").done);
  ok("📅 light: Ava 1/2 dark, Ben 1/1 lit, Cy 0/0 dark", !light(rs[0], "📅").done && light(rs[0], "📅").frac === "1/2" && light(rs[1], "📅").done && light(rs[1], "📅").frac === "1/1" && !light(rs[2], "📅").done);
  ok("lit = ✓ in the kid's colour", /border:2px solid #e11d48;background:#e11d4822;color:#e11d48">✓<\/span>🌅/.test(rs[0]));
}
{
  const w = world(Object.assign({}, STATE, { day: "tuesday" }));
  const rs = rows(w.api.mdCardKidsToday(TODAY, true, true));
  ok("with the Schedule left on Tuesday, the lights still read the Mom's Day day", light(rs[0], "🌅").done && !light(rs[1], "🌅").done);
  ok("…and the global day is handed back", w.api.getDay() === "tuesday");
}

console.log("\n── rooms line, then stars + give/dock box ──");
{
  const rs = rows(world(STATE).api.mdCardKidsToday(TODAY, true, true));
  const r = rs[0];
  ok("order: fractions → 🚿/🧺 rooms → ⭐ stars + box", r.indexOf("🌅") < r.indexOf("🚿") && r.indexOf("🚿") < r.indexOf("🧺 aft") && r.indexOf("🧺 eve") < r.indexOf("⭐ +12") && r.indexOf("⭐ +12") < r.indexOf('id="mpbank-ava"'));
  ok("today's stars + Star Bank balance", /⭐ \+12 /.test(rs[0]) && /🏦 1,234/.test(rs[0]) && /⭐ \+0 /.test(rs[1]) && /🏦 50/.test(rs[1]) && /🏦 0/.test(rs[2]));
  ok("− [5] + box per kid; + / − open the 'what for?' pop-up", ROSTER.every((k, i) => rs[i].indexOf("mpBankAsk('" + k + "',-1)") >= 0 && rs[i].indexOf('id="mpbank-' + k + '"') >= 0 && rs[i].indexOf("mpBankAsk('" + k + "',1)") >= 0 && /value="5"/.test(rs[i])));
  const card = world(STATE).api.mdCardKidsToday(TODAY, true, true);
  ok("no 'why' box at the bottom any more; amount ids unique", !/mpbank-note/.test(card) && !/>why</.test(card) && (card.match(/id="mpbank-\w+"/g) || []).length === 3);
  ok("the old top-row ⭐ pill isn't doubled", (rs[0].match(/boardStatPop\('ava','stars'/g) || []).length === 1);
  const ns = rows(world(STATE).api.mdCardKidsToday(TODAY, false, true));
  ok("not a school day → no 📅, lights + stars stay", !/📅/.test(ns[0]) && light(ns[0], "🌅") && /🏦 1,234/.test(ns[0]));
}

console.log("\n── Dad's Day unchanged ──");
{
  const w = world(STATE);
  const plain = w.api.mdCardKidsToday(TODAY, true);
  ok("without bank mode: no lights, no give/dock, ⭐ pill on the top row as before", !/mpbank-/.test(plain) && !light(rows(plain)[0], "🌅") && /boardStatPop\('ava','stars'[^>]*>⭐ 12</.test(plain));
  ok("Dad's Day Star Bank still lists every kid", ["ava", "ben", "cy"].every(k => w.api.mdCardStarBank(false).indexOf(">" + NAMES[k] + "</b>") >= 0));
}

console.log("\n── display only ──");
{
  const w = world(STATE);
  const before = JSON.stringify(w.env.slState);
  w.api.renderSkylight(); w.api.mdCardKidsToday(TODAY, true, true);
  ok("rendering writes nothing to Firebase", w.log.writes.length === 0, w.log.writes);
  ok("no localStorage writes", w.log.ls.length === 0, w.log.ls);
  ok("routine state untouched", JSON.stringify(w.env.slState) === before);
}

console.log("\n── wiring ──");
{
  const md = slice("renderMomsDay");
  ok("Mom's Day renders Kids-today in bank mode in place of the separate Star Bank card", /mdCardKidsToday\(today,isSchoolDay,true\)/.test(md) && md.indexOf("mdCardStarBank(true);\n  h+=mdCardKidsToday") < 0);
  ok("the All tab still draws its lights with the shared helpers", /slDotHTML\(k2,slCellState\(slot,k2\),pulse\)/.test(slice("renderSkylight")));
  ok("no kid names hard-coded in the KIDBAR block", !/lincoln|ellis|lucy|julian|taylor|caleb|zuri|david/i.test(src.slice(src.indexOf("// KIDBAR_START"), src.indexOf("// KIDBAR_END"))));
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
