/*
 * CYCLEOWN — the built-in cycle start is Howe's only (her "Yes, start step 0" 2026-11-24,
 * DESIGN_household_edition_2026-11-24.md §5.4).
 *
 * Why: wellnessCycle's fallback date is Adrienne's own. Every other family's app counted from it until a period
 * was logged there, so Home Base showed "Luteal Week / Period Week" and ❤️ Health showed a cycle day, a phase, a
 * "next period expected" date and a pre-filled "last period started" date that family never entered.
 *
 * This runs the REAL code out of index.html — the ⚖️ Weekly Weigh-In block (MW_PHASES … mwRemovePeriod) and the
 * Home Base banner lines — in a small world, and checks:
 *   A. the pin: the helper's built-in date is the same literal as wellnessCycle's fallback
 *   B. mwCycleOwn's truth table
 *   C. the Home Base banner: Howe as before · another family only with a cycle of its own
 *   D. ❤️ Health for another family with no cycle of its own: weights, blood pressure, symptoms and the Period Log
 *      stay; nothing counted from the built-in date is on the page
 *   E. the same family after "Log period start": the page is the page Howe gets from the same data
 *   F. ⚙️ Cycle Settings: an empty date never saves the built-in one into another family's database
 *   G. the date badge under "Log This Week"
 *
 *   run:  node test_cycle_own.js
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log("  ok  - " + name); }
  else { fail++; console.log("  FAIL- " + name + (extra !== undefined ? "  (" + String(extra).slice(0, 300) + ")" : "")); }
}

// ── the real code ────────────────────────────────────────────────────────────
const a = src.indexOf("/* ═══════ ⚖️ WEEKLY WEIGH-IN (cycle-aware) ═══════ */");
const b = src.indexOf("\nfunction mwToast(", a);
if (a < 0 || b < 0) { console.error("Weigh-In block anchors not found"); process.exit(1); }
const block = src.slice(a, b);
const ba = src.indexOf("  // 🌙 Luteal/period support");
const bb = src.indexOf("\n  // ── 🏡 My day — time-of-day checklist", ba);
if (ba < 0 || bb < 0) { console.error("Home Base banner anchors not found"); process.exit(1); }
const bannerSrc = src.slice(ba, bb);

// A. the pin
const mFall = src.match(/let wellnessCycle = \{ anchor:'(\d{4}-\d\d-\d\d)', len:28 \}/);
const mPin = block.match(/const MW_BUILTIN_ANCHOR='(\d{4}-\d\d-\d\d)';/);
ok("A1 wellnessCycle still has its one built-in fallback date", !!mFall);
ok("A2 the helper's built-in date is that same date", !!mFall && !!mPin && mFall[1] === mPin[1]);
ok("A3 the CYCLEOWN block is marked start and end", block.indexOf("// CYCLEOWN_START") > 0 && block.indexOf("// CYCLEOWN_END") > block.indexOf("// CYCLEOWN_START"));
const BUILTIN = mFall ? mFall[1] : "2026-07-25";

// ── a world ──────────────────────────────────────────────────────────────────
// howe: true | false | undefined (a sliced test world with no HA_IS_HOWE at all)
function world(howe, data) {
  data = data || {};
  const writes = [], alerts = [], els = {};
  const el = id => (els[id] = els[id] || { value: "", innerHTML: "", textContent: "" });
  const ctx = {
    wellnessWeighins: JSON.parse(JSON.stringify(data.weighins || [])),
    wellnessCycle: Object.assign({ anchor: BUILTIN, len: 28 }, data.cycle || {}),
    wellnessPeriods: JSON.parse(JSON.stringify(data.periods || [])),
    wellnessBP: JSON.parse(JSON.stringify(data.bp || {})),
    wellnessSymptoms: JSON.parse(JSON.stringify(data.syms || {})),
    wellnessSymBank: {},
    MW_CSS: "",
    mwBanner: s => "[banner:" + s + "]",
    mpSubnav: v => "[subnav:" + v + "]",
    mwAllSyms: () => [["headache", "Headache"], ["cramps", "Cramps"]],
    mwBPCat: () => ({ color: "#111", label: "ok" }),
    mwBPChip: () => "",
    mwBPSlotNow: () => "am",
    HA_LS: { getItem: () => null, setItem: () => {} },
    db: { ref: p => ({ set: v => writes.push(["set", p, JSON.parse(JSON.stringify(v))]), remove: () => writes.push(["remove", p]) }) },
    document: { getElementById: id => el(id) },
    renderMomsPlan: () => {},
    mwToast: () => {},
    alert: m => alerts.push(m),
    console, Date, Math, JSON, Object, Array, String, parseInt, parseFloat,
  };
  if (howe !== undefined) ctx.HA_IS_HOWE = howe;
  vm.createContext(ctx);
  vm.runInContext(block, ctx);
  vm.runInContext("mwTodayIso=function(){ return __today; };", Object.assign(ctx, { __today: data.today || "2026-08-12" }));
  return {
    ctx, writes, alerts, el,
    run: code => vm.runInContext(code, ctx),
    page() { const e = {}; ctx.__el = e; vm.runInContext("renderMPWeigh(__el)", ctx); return e.innerHTML; },
    banner() { return vm.runInContext("(function(){ let h='';\n" + bannerSrc + "\n return h; })()", ctx); },
  };
}

// six weekly weigh-ins, two blood-pressure days, two symptom days
const WEIGH = ["2026-07-03", "2026-07-10", "2026-07-17", "2026-07-24", "2026-07-31", "2026-08-07"].map((iso, i) => ({ iso, lb: 180 - i * 0.6, note: i === 5 ? "felt good" : "" }));
const BP = { "2026-08-06": { am: { sys: 118, dia: 76, pulse: 61 } }, "2026-08-07": { am: { sys: 121, dia: 79 }, pm: { sys: 117, dia: 75 } } };
const SYMS = { "2026-08-05": { headache: true }, "2026-08-07": { cramps: true } };
const DATA = { weighins: WEIGH, bp: BP, syms: SYMS, today: "2026-08-12" };   // built-in date + 18 days = day 19 = luteal

// B. the truth table
ok("B1 Howe: always its own", world(true).run("mwCycleOwn()") === true);
ok("B2 no HA_IS_HOWE at all (a sliced test world): its own", world(undefined).run("mwCycleOwn()") === true);
ok("B3 another family, nothing entered: not its own", world(false).run("mwCycleOwn()") === false);
ok("B4 another family, the built-in date saved back by an old build: still not its own", world(false, { cycle: { anchor: BUILTIN, len: 30 } }).run("mwCycleOwn()") === false);
ok("B5 another family, a period logged: its own", world(false, { periods: [{ iso: "2026-08-01", ts: 1 }] }).run("mwCycleOwn()") === true);
ok("B6 another family, its own start date saved: its own", world(false, { cycle: { anchor: "2026-08-03", len: 29 } }).run("mwCycleOwn()") === true);
ok("B7 another family, an empty start date: not its own", world(false, { cycle: { anchor: "" } }).run("mwCycleOwn()") === false);
ok("B8 a broken period row does not count", world(false, { periods: [null, {}] }).run("mwCycleOwn()") === false);

// C. the Home Base banner
const lutealHowe = world(true, DATA).banner();
ok("C1 Howe, luteal day: the banner is there", /Luteal Week — go gentle/.test(lutealHowe) && /Cycle day 19/.test(lutealHowe), lutealHowe);
ok("C2 another family, nothing entered, same day: no banner", world(false, DATA).banner() === "");
ok("C3 another family on a built-in 'period' day: no banner", world(false, Object.assign({}, DATA, { today: "2026-08-23" })).banner() === "");
ok("C3b … and Howe on that day sees Period Week", /Period Week/.test(world(true, Object.assign({}, DATA, { today: "2026-08-23" })).banner()));
const ownLuteal = world(false, Object.assign({}, DATA, { periods: [{ iso: "2026-07-22", ts: 1 }] })).banner();
ok("C4 another family with a logged period, luteal by ITS date: the banner", /Luteal Week/.test(ownLuteal) && /Cycle day 22/.test(ownLuteal), ownLuteal);
ok("C5 another family with a logged period, follicular by its date: no banner", world(false, Object.assign({}, DATA, { periods: [{ iso: "2026-08-05", ts: 1 }] })).banner() === "");
{ const w = world(true, DATA); w.run("mwCycleOwn=undefined"); ok("C6 a world without the helper (older sliced tests) still draws the banner", /Luteal Week/.test(w.banner())); }
ok("C7 the banner line asks the helper", /mwCycleOwn\(\)\)&&\(_ci\.key==='luteal'\|\|_ci\.key==='menstrual'\)/.test(bannerSrc));

// D. ❤️ Health for another family with no cycle of its own
const other = world(false, DATA), pg = other.page();
const LEAKS = [
  ["a cycle day", /cycle day\s*\d/i], ["the built-in date", new RegExp(BUILTIN)], ["'next period expected'", /Next period expected/],
  ["'you're in your … phase'", /You're in your/], ["'same phase'", /same phase/], ["'different phase'", /different phase/],
  ["the phase legend", /class="legend"/], ["'shaded by cycle phase'", /shaded by cycle phase/], ["a 'd19'-style badge", /> ?[^<>]{0,3} d\d+<\/span>/],
  ["'read against your cycle'", /read against your cycle/], ["a phase band in the chart", /<rect /], ["'learned cycle length' / 'using a 28-day cycle'", /Learned cycle length|-day<\/b> cycle until/],
  ["'true trend'", /the true trend/], ["'carries its cycle day'", /carries its cycle day/], ["'cycle water'", /cycle water|phase noise/],
];
LEAKS.forEach(([what, rx]) => ok("D1 another family, nothing entered: no " + what, !rx.test(pg), (pg.match(rx) || [""])[0]));
ok("D2 the latest weight is there", /Latest Weigh-In/.test(pg) && pg.indexOf(WEIGH[5].lb.toFixed(1)) > 0);
ok("D3 the two comparison tiles are there, plain", /vs last week \(raw\)/.test(pg) && /<div class="lbl">vs 4 wks ago<\/div>/.test(pg));
ok("D4 the plain four-week sentence", /Compared with four weeks ago, you're down <b>2\.4 lb<\/b>\./.test(pg), (pg.match(/Compared[^<]*<b>[^<]*<\/b>\./) || [""])[0]);
ok("D5 the trend chart is there, its dots in the app's teal", /<span>📈<\/span> Trend<\/div>/.test(pg) && /stroke="#2B7A78" stroke-width="2"\/>/.test(pg) && (pg.match(/<circle /g) || []).length === 6);
ok("D6 the history rows are there", (pg.match(/class="wlb"/g) || []).length === 6 && /felt good/.test(pg));
ok("D7 blood pressure is there", /118\/76/.test(pg) && /117\/75/.test(pg));
ok("D8 the symptom days are there", /Headache/.test(pg) && /Cramps/.test(pg));
ok("D9 the Period Log's own way in is there", /Log period start/.test(pg) && /Log the day each period starts/.test(pg));
ok("D10 Cycle Settings opens with an empty date", /id="cy-anchor" value=""/.test(pg));
ok("D11 the page banner is plain", pg.indexOf("[banner:Weekly weigh-in]") >= 0);
const empty = world(false, { today: "2026-08-12" }).page();
ok("D12 no weigh-ins yet: the first-time text has no cycle promise", /No weigh-ins yet/.test(empty) && !/same point in your cycle/.test(empty) && !/cycle day\s*\d/i.test(empty));
ok("D13 nothing was written to the database by looking", other.writes.length === 0);

// Howe keeps every one of those
const howePg = world(true, DATA).page();
ok("D14 Howe: cycle day, phase, legend, next period, bands and its date are all still there",
  /Cycle day \d+ · /.test(howePg) && /class="legend"/.test(howePg) && /Next period expected/.test(howePg) && /<rect /.test(howePg) &&
  howePg.indexOf('id="cy-anchor" value="' + BUILTIN + '"') > 0 && /same phase ⭐/.test(howePg) && /You're in your/.test(howePg) &&
  howePg.indexOf("[banner:Weekly weigh-in · read against your cycle]") >= 0 && /carries its cycle day/.test(howePg));
ok("D15 Howe, no weigh-ins: the first-time text as before", /same point in your cycle a month earlier/.test(world(true, { today: "2026-08-12" }).page()));

// E. the same family after "Log period start" = the page Howe gets from the same data
other.el("period-date").value = "2026-07-22";
other.run("mwLogPeriod()");
ok("E1 logging a period writes what it always wrote", JSON.stringify(other.writes.map(w => w[1])) === JSON.stringify(["wellness/periods/2026-07-22", "wellness/cycle"]) && other.writes[1][2].anchor === "2026-07-22", JSON.stringify(other.writes));
ok("E2 … and the cycle is now its own", other.run("mwCycleOwn()") === true);
const howeSame = world(true, Object.assign({}, DATA, { periods: [{ iso: "2026-07-22", ts: 1 }], cycle: { anchor: "2026-07-22", len: 28 } }));
ok("E3 its Health page is now the page Howe gets from the same data", other.page() === howeSame.page());
ok("E4 … with the cycle day counted from ITS date", /Today · cycle day 22 · Luteal/.test(other.page()));

// F. ⚙️ Cycle Settings
{ const w = world(false, DATA); w.el("cy-anchor").value = ""; w.el("cy-len").value = "30"; w.run("mwSaveCycle()");
  ok("F1 another family, empty date: asked for the date, nothing saved", w.alerts.length === 1 && w.writes.length === 0 && w.run("wellnessCycle.len") === 28, JSON.stringify(w.writes));
  w.el("cy-anchor").value = "2026-08-02"; w.run("mwSaveCycle()");
  ok("F2 another family, its own date: saved, and the cycle is its own", w.writes.length === 1 && w.writes[0][1] === "wellness/cycle" && w.writes[0][2].anchor === "2026-08-02" && w.writes[0][2].len === 30 && w.run("mwCycleOwn()") === true, JSON.stringify(w.writes)); }
{ const w = world(true, DATA); w.el("cy-anchor").value = ""; w.el("cy-len").value = "29"; w.run("mwSaveCycle()");
  ok("F3 Howe, empty date: saves the length as before, no question", w.alerts.length === 0 && w.writes.length === 1 && w.writes[0][2].anchor === BUILTIN && w.writes[0][2].len === 29, JSON.stringify(w.writes)); }

// G. the date badge under "Log This Week"
{ const w = world(false, DATA); w.el("wi-date").value = "2026-08-12"; w.el("wi-daybadge").innerHTML = "old"; w.el("wi-daybadge").textContent = "old"; w.run("mwUpdateDayBadge()");
  ok("G1 another family, nothing entered: no cycle day beside the date", w.el("wi-daybadge").textContent === "" && !/cycle day/.test(w.el("wi-daybadge").innerHTML.replace("old", ""))); }
{ const w = world(true, DATA); w.el("wi-date").value = "2026-08-12"; w.run("mwUpdateDayBadge()");
  ok("G2 Howe: the cycle day beside the date as before", /cycle day 19 · Luteal/.test(w.el("wi-daybadge").innerHTML)); }

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
