/*
 * Node tests — 🧒 KIDBAR: one status bar per kid on Mom's Day (her ask 2026-10-08).
 * The bar shows the SAME routine lights as Schedule ▸ All, today's school cards done/total, and
 * stars (today + Star Bank balance). Tapping it opens that kid's existing Kids-today + Star Bank
 * detail. Display only — nothing is written.
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
const FNS = ["slKey", "getSlot", "activeWk", "slCellState", "slDotHTML", "kbToggle", "kbBarHTML", "kbCardHTML",
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
    ", momModeActive=false, tab='schedule', schedShowAdmin=false, schedShowHistory=false, schedShowPace=false, schedShowBoard=false, schedShowPeek=false, kbOpen=null;\n" +
    FNS + "\nreturn { kbCardHTML, kbBarHTML, kbToggle, renderSkylight, mdCardStarBank, slCellState, slDotHTML, getDay: () => day, setDay: d => { day = d; }, getOpen: () => kbOpen };";
  const api = new Function(...keys, body)(...keys.map(k => env[k]));
  return { api, log, els, env };
}
const dots = html => html.match(/<div class="sl-dot[^"]*"[^>]*>[^<]*<\/div>/g) || [];
const bars = html => html.split('<div class="kb-row"').slice(1).map(x => '<div class="kb-row"' + x.split('<div class="kb-row"')[0]);

const TODAY = "monday";
const STATE = {
  today: TODAY,
  morn: { monday: { ava: true, ben: false, cy: true }, tuesday: { ava: false, ben: true, cy: false } },
  multi: { monday: { ava: { afternoon: true }, ben: { chores: true, evening: true }, cy: {} }, tuesday: { ava: { chores: true }, ben: {}, cy: { evening: true } } },
  slState: { week26_monday_ava_morning: { done: false, ts: "8:01 AM Oct 5" } },
  tasks: [{ id: "a1", who: "ava", day: "monday", title: "Math" }, { id: "a2", who: "ava", day: "monday", title: "Spelling" }, { id: "a3", who: "ava", day: "monday", title: "Lunch" },
    { id: "b1", who: "ben", day: "monday", title: "Reading" }, { id: "b2", who: "ben", day: "tuesday", title: "Science" }],
  checked: { a1: { ts: "9:00 AM" }, b1: { ts: "9:30 AM" } },
  pts: { monday: { ava: 12, ben: 0, cy: 7 } },
  bal: { ava: 1234, ben: 50, cy: 0 },
};

console.log("── lights = the All tab's lights ──");
{
  const w = world(STATE);
  w.api.renderSkylight();
  const grid = dots(w.els["sl-grid"].innerHTML);            // slot-major: [slot][kid]
  const card = w.api.kbCardHTML(TODAY, true);
  const bs = bars(card);
  ok("one bar per roster kid, in roster order", bs.length === 3 && bs.map(b => /data-kid="(\w+)"/.exec(b)[1]).join() === "ava,ben,cy");
  ok("names + colors come from the roster maps", /color:#e11d48">Ava</.test(bs[0]) && /color:#2563eb">Ben</.test(bs[1]) && /color:#16a34a">Cy</.test(bs[2]));
  let same = grid.length === 12;
  ROSTER.forEach((k, ki) => { const bd = dots(bs[ki]); ["morning", "afternoon", "chores", "evening"].forEach((s, si) => { if (bd[si] !== grid[si * 3 + ki]) same = false; }); });
  ok("every light is byte-identical to the All tab's light for the same kid + slot", same, { grid: grid.length });
  ok("lights carry the slot labels", ["Morning", "Afternoon", "Chores", "Evening"].every(l => bs[0].indexOf('<span class="kb-ll">' + l + "</span>") >= 0));
  ok("done = ✓ in the kid's color; not done = empty", /sl-dot done" style="background:#e11d4822;border-color:#e11d48;color:#e11d48"[^>]*>✓/.test(bs[0]) && /sl-dot " style=";cursor:default" title="Not checked"><\/div>/.test(bs[1]));
}
{
  // The 10:30 pulse is the All tab's only time-of-day state; with it on, everything else still matches.
  const w = world(Object.assign({}, STATE, { hour: 11 }));
  w.api.renderSkylight();
  const grid = dots(w.els["sl-grid"].innerHTML).map(x => x.replace("sl-dot alert", "sl-dot "));
  const bs = bars(w.api.kbCardHTML(TODAY, true));
  let same = true; ROSTER.forEach((k, ki) => { const bd = dots(bs[ki]); [0, 1, 2, 3].forEach(si => { if (bd[si] !== grid[si * 3 + ki]) same = false; }); });
  ok("at 11 AM the All tab pulses undone mornings; the bar shows the same state without the pulse", same);
}
{
  // Schedule tab left on Tuesday — the bar must still read TODAY, and hand `day` back untouched.
  const w = world(Object.assign({}, STATE, { day: "tuesday" }));
  const bs = bars(w.api.kbCardHTML(TODAY, true));
  w.api.setDay(TODAY); const ref = world(STATE); ref.api.renderSkylight();
  const grid = dots(ref.els["sl-grid"].innerHTML);
  let same = true; ROSTER.forEach((k, ki) => { const bd = dots(bs[ki]); [0, 1, 2, 3].forEach(si => { if (bd[si] !== grid[si * 3 + ki]) same = false; }); });
  ok("with the Schedule viewing another day, the bar still shows TODAY's lights", same);
  const w2 = world(Object.assign({}, STATE, { day: "tuesday" })); w2.api.kbCardHTML(TODAY, true);
  ok("…and the global day is restored afterwards", w2.api.getDay() === "tuesday");
}
{
  const w = world(Object.assign({}, STATE, { slots: ["morning", "evening"] }));
  const bs = bars(w.api.kbCardHTML(TODAY, true));
  ok("a 'school + chores' break shows only the slots the All tab shows (morning, evening)", dots(bs[0]).length === 2 && /Morning/.test(bs[0]) && /Evening/.test(bs[0]) && !/Chores<\/span>/.test(bs[0]));
}

console.log("\n── school + stars ──");
{
  const w = world(STATE);
  const bs = bars(w.api.kbCardHTML(TODAY, true));
  ok("school cards done/total for today (lunch excluded, other days excluded) — Ava 1/2", /📅 <b>1\/2<\/b>/.test(bs[0]), bs[0].match(/📅[^<]*<b>[^<]*/));
  ok("Ben 1/1 (his Tuesday card isn't today's) and the bar turns green when all done", /📅 <b>1\/1<\/b>/.test(bs[1]) && /width:100%;background:#16a34a/.test(bs[1]));
  ok("Cy 0/0 on a free day", /📅 <b>0\/0<\/b>/.test(bs[2]));
  ok("today's stars shown", /⭐ <b>\+12<\/b>/.test(bs[0]) && /⭐ <b>\+0<\/b>/.test(bs[1]) && /⭐ <b>\+7<\/b>/.test(bs[2]));
  ok("Star Bank balance shown (formatted)", /🏦 1,234/.test(bs[0]) && /🏦 50/.test(bs[1]) && /🏦 0/.test(bs[2]));
  const ns = bars(world(STATE).api.kbCardHTML(TODAY, false));
  ok("not a school day → no 📅 school progress, lights + stars stay", !/📅/.test(ns[0]) && dots(ns[0]).length === 4 && /🏦 1,234/.test(ns[0]));
}

console.log("\n── tap opens the details that exist today ──");
{
  const w = world(STATE);
  let card = w.api.kbCardHTML(TODAY, true);
  ok("closed by default: no detail, no give/dock boxes", !/class="kb-det"/.test(card) && !/mpbank-/.test(card));
  ok("each bar is tappable → kbToggle(kid)", /onclick="kbToggle\('ben'\)"/.test(card) && /aria-expanded="false"/.test(card));
  w.api.kbToggle("ben");
  ok("tap re-renders Mom's Day", w.log.renders === 1 && w.api.getOpen() === "ben");
  card = w.api.kbCardHTML(TODAY, true);
  ok("Ben's detail opens under his bar", /data-kid="ben" role="button" aria-expanded="true"/.test(card) && /class="kb-det"/.test(card));
  ok("…with his ⭐ Star Bank row (give/dock) and nobody else's", /id="mpbank-ben"/.test(card) && !/mpbank-ava/.test(card) && !/mpbank-cy/.test(card) && /mpBankAdj\('ben',1\)/.test(card));
  ok("…and his 🧒 Kids-today row (pills open the same pop-ups)", /boardStatPop\('ben','chores'/.test(card) && !/boardStatPop\('ava'/.test(card));
  w.api.kbToggle("ben");
  ok("tap again closes it", w.api.getOpen() === null && !/class="kb-det"/.test(w.api.kbCardHTML(TODAY, true)));
  w.api.kbToggle("ava"); w.api.kbToggle("cy");
  ok("one kid open at a time (give/dock box ids stay unique)", w.api.getOpen() === "cy" && (w.api.kbCardHTML(TODAY, true).match(/id="mpbank-(?!note")\w+"/g) || []).length === 1);
}
{
  const w = world(STATE);
  const all = w.api.mdCardStarBank(false);
  ok("Dad's Day Star Bank (no kid given) still lists every kid", ["ava", "ben", "cy"].every(k => all.indexOf(">" + NAMES[k] + "</b>") >= 0));
}

console.log("\n── display only ──");
{
  const w = world(STATE);
  const before = JSON.stringify(w.env.slState);
  w.api.renderSkylight(); w.api.kbCardHTML(TODAY, true); w.api.kbToggle("ava"); w.api.kbCardHTML(TODAY, true); w.api.kbToggle("ava");
  ok("no Firebase writes", w.log.writes.length === 0, w.log.writes);
  ok("no localStorage writes", w.log.ls.length === 0, w.log.ls);
  ok("routine state untouched", JSON.stringify(w.env.slState) === before);
  const blk = src.slice(src.indexOf("// KIDBAR_START"), src.indexOf("// KIDBAR_END"));
  ok("the KIDBAR block has no db / storage / write calls", blk.length > 500 && !/db\.ref|\.set\(|\.update\(|\.remove\(|HA_LS\.setItem|localStorage/.test(blk));
}

console.log("\n── wiring ──");
{
  const md = slice("renderMomsDay");
  ok("Mom's Day renders the kid bars in place of the separate Star Bank + Kids-today cards", /kbCardHTML\(today,isSchoolDay\)/.test(md) && md.indexOf("mdCardStarBank(true);\n  h+=mdCardKidsToday") < 0);
  ok("the All tab draws its lights with the same two helpers", /slDotHTML\(k2,slCellState\(slot,k2\),pulse\)/.test(slice("renderSkylight")));
  ok("no kid names hard-coded in the block", !/lincoln|ellis|lucy|julian|taylor|caleb|zuri|david/i.test(src.slice(src.indexOf("// KIDBAR_START"), src.indexOf("// KIDBAR_END"))));
  ok("phone width: rows wrap at ≤480px", /@media \(max-width:480px\)/.test(slice("kbCardHTML")) && /flex-wrap:wrap/.test(slice("kbCardHTML")));
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
