/*
 * 🩺 HHCYCLE — ❤️ Health without the cycle (her "Yes, start step 4" 2026-11-24 — slice 4 of
 * DESIGN_household_edition_2026-11-24.md §5.4; her ask: her mom "would use the health stuff").
 *
 * A household tracks no cycle: no Luteal / Period banner on Home Base, no cycle day or phase anywhere, and ❤️ Health has no
 * 🩸 Period Log and no ⚙️ Cycle Settings — weights, the four-week comparison, the trend, blood pressure and symptoms stay.
 * Adrienne's families dashboard can turn it on or off for any home (settings/pages/cycle).
 *
 * Runs the REAL ⚖️ Weekly Weigh-In block and Home Base's banner lines out of index.html in a small world, and the whole app
 * (test_fixtures/demo_week_sandbox.js) for the switch, and checks:
 *   0. the block, and stripCycle() undoing the slice (the "app before" = this tree with the slice taken out — no git)
 *   1. who tracks a cycle: every family yes, a household no, the dashboard's switch wins either way
 *   2. EVERY OTHER FAMILY IS UNCHANGED: Howe and another family, with and without a cycle of their own — the page, the
 *      banner and the date badge byte for byte the tree before, on 30 days
 *   3. a household: nothing of the cycle, even with a period once logged; the rest of Health is there
 *   4. the switch, from the dashboard's side, on the whole app: on for a household, off for an ordinary family
 *
 *   run:  node test_health_no_cycle.js
 */
const fs = require("fs"), path = require("path"), os = require("os"), vm = require("vm");
const SB = require(path.join(__dirname, "test_fixtures", "demo_week_sandbox.js"));
const FX = JSON.parse(fs.readFileSync(path.join(__dirname, "test_fixtures", "living_demo_family.json"), "utf8"));
const INDEX = path.join(__dirname, "index.html");
const src = fs.readFileSync(INDEX, "utf8");

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log("  ok  - " + name); }
  else { fail++; console.log("  FAIL- " + name + (extra !== undefined ? "  (" + (typeof extra === "string" ? extra : JSON.stringify(extra)).slice(0, 400) + ")" : "")); }
}
const clone = v => JSON.parse(JSON.stringify(v));

// ── 0. the slice, and the app before it ────────────────────────────────────────────────────────────────────────
const SLICE = [
  ["block",
   "// CYCLEOWN_END\n// HHCYCLE_START — ❤️ Health without the cycle (her \"Yes, start step 4\" 2026-11-24 — slice 4 of DESIGN_household_edition_2026-11-24.md\n// §5.4; her ask 2026-11-24: her mom \"would use the health stuff\"). mwCycleShown() = this home tracks a cycle at all: yes for every\n// family, no for a household (a family file with kind household) — unless Adrienne's families dashboard has set settings/pages/cycle (true | false), which\n// wins either way; it rides the listener that already reads the page switches, no new one. Not shown → mwCycleOwn() is false, so\n// everything CYCLEOWN leaves out is left out (Home Base's Luteal / Period banner, the cycle day, phase, legend and bands, next\n// period, the date badge) — even if a period was once logged — and ❤️ Health also drops the 🩸 Period Log and ⚙️ Cycle Settings\n// cards. Weights, the four-week comparison, the trend, blood pressure and symptoms stay. No database reads or writes of its own.\nfunction mwCycleShown(){\n  let v; try{ v=(typeof PAGES!==\"undefined\"&&PAGES)?PAGES.cycle:undefined; }catch(e){}\n  if(v===true||v===false) return v;\n  return !((typeof HA_HOUSEHOLD!==\"undefined\")&&HA_HOUSEHOLD);\n}\n// HHCYCLE_END\n",
   "// CYCLEOWN_END\n"],
  ["own",
   "function mwCycleOwn(){\n  if(typeof mwCycleShown===\"function\"&&!mwCycleShown()) return false;   // 🩺 HHCYCLE: a home that tracks no cycle has none of its own\n",
   "function mwCycleOwn(){\n"],
  ["cards",
   "${currentCard}${mwCycleShown()?periodCard:''}${comparisonCard}${trendCard}${logCard}${bpCard}${symCard}${historyCard}${mwCycleShown()?cycleCard:''}",
   "${currentCard}${periodCard}${comparisonCard}${trendCard}${logCard}${bpCard}${symCard}${historyCard}${cycleCard}"]
];
function stripCycle(s) {
  SLICE.forEach(([what, now, before]) => {
    const n = s.split(now).length - 1;
    if (n !== 1) throw new Error("stripCycle: \"" + what + "\" matched " + n + " times");
    s = s.replace(now, () => before);
  });
  return s;
}
console.log("0. the slice, and the app before it");
const BLOCK = src.slice(src.indexOf("// HHCYCLE_START"), src.indexOf("// HHCYCLE_END"));
ok("HHCYCLE_START / _END once each, right after CYCLEOWN", src.split("// HHCYCLE_START").length === 2 && src.split("// HHCYCLE_END").length === 2 && src.indexOf("// CYCLEOWN_END\n// HHCYCLE_START") > 0);
ok("the block cites her yes, her ask, the date and the design", /Yes, start step 4/.test(BLOCK) && /would use the health stuff/.test(BLOCK) && /2026-11-24/.test(BLOCK) && /DESIGN_household_edition_2026-11-24\.md/.test(BLOCK));
ok("the block reads and writes nothing of its own (no db, no storage, no dialog)", !/db\.ref|HA_LS|\.set\(|\.update\(|alert\(|confirm\(|prompt\(/.test(BLOCK.replace(/^\s*\/\/.*$/gm, "")));
let BEFORE = "";
try { BEFORE = stripCycle(src); } catch (e) { ok("stripCycle runs (" + SLICE.length + " places)", false, String(e)); }
ok("stripped: no trace of the slice left", !!BEFORE && !/HHCYCLE|mwCycleShown/.test(BEFORE));

// ── the small world: the real Weigh-In block + Home Base's banner lines ────────────────────────────────────────
function cut(s) {
  const a = s.indexOf("/* ═══════ ⚖️ WEEKLY WEIGH-IN (cycle-aware) ═══════ */"), b = s.indexOf("\nfunction mwToast(", a);
  const ba = s.indexOf("  // 🌙 Luteal/period support"), bb = s.indexOf("\n  // ── 🏡 My day — time-of-day checklist", ba);
  if (a < 0 || b < 0 || ba < 0 || bb < 0) throw new Error("anchors not found");
  return { block: s.slice(a, b), banner: s.slice(ba, bb) };
}
const NOW = cut(src), WAS = cut(BEFORE || src);
// o = { howe, household, pages (the saved switches), data }
function world(code, o) {
  o = o || {}; const data = o.data || {};
  const els = {}; const el = id => (els[id] = els[id] || { value: "", innerHTML: "", textContent: "" });
  const ctx = {
    wellnessWeighins: clone(data.weighins || []), wellnessCycle: Object.assign({ anchor: "2026-07-25", len: 28 }, data.cycle || {}), wellnessPeriods: clone(data.periods || []),
    wellnessBP: clone(data.bp || {}), wellnessSymptoms: clone(data.syms || {}), wellnessSymBank: {},
    MW_CSS: "", mwBanner: s => "[banner:" + s + "]", mpSubnav: v => "[subnav:" + v + "]", mwAllSyms: () => [["headache", "Headache"], ["cramps", "Cramps"]],
    mwBPCat: () => ({ color: "#111", label: "ok" }), mwBPChip: () => "", mwBPSlotNow: () => "am",
    HA_LS: { getItem: () => null, setItem: () => {} }, db: null, document: { getElementById: id => el(id) }, renderMomsPlan: () => {}, mwToast: () => {}, alert: () => {},
    console, Date, Math, JSON, Object, Array, String, parseInt, parseFloat, __today: data.today || "2026-08-12",
  };
  if (o.howe !== undefined) ctx.HA_IS_HOWE = o.howe;
  if (o.household !== undefined) ctx.HA_HOUSEHOLD = o.household;
  if (o.pages !== undefined) ctx.PAGES = o.pages;
  vm.createContext(ctx); vm.runInContext(code.block, ctx); vm.runInContext("mwTodayIso=function(){ return __today; };", ctx);
  return {
    run: c => vm.runInContext(c, ctx),
    page() { const e = {}; ctx.__el = e; vm.runInContext("renderMPWeigh(__el)", ctx); return e.innerHTML; },
    banner() { return vm.runInContext("(function(){ let h='';\n" + code.banner + "\n return h; })()", ctx); },
    badge() { el("wi-date").value = ctx.__today; el("wi-daybadge").innerHTML = ""; el("wi-daybadge").textContent = ""; vm.runInContext("mwUpdateDayBadge()", ctx); return el("wi-daybadge").innerHTML; },
  };
}
const WEIGH = ["2026-07-03", "2026-07-10", "2026-07-17", "2026-07-24", "2026-07-31", "2026-08-07"].map((iso, i) => ({ iso, lb: 180 - i * 0.6, note: i === 5 ? "felt good" : "" }));
const BP = { "2026-08-06": { am: { sys: 118, dia: 76, pulse: 61 } }, "2026-08-07": { am: { sys: 121, dia: 79 }, pm: { sys: 117, dia: 75 } } };
const SYMS = { "2026-08-05": { headache: true }, "2026-08-07": { cramps: true } };
const FULL = { weighins: WEIGH, bp: BP, syms: SYMS, today: "2026-08-12" };                                   // the built-in date + 18 days = luteal
const OWN = Object.assign({}, FULL, { periods: [{ iso: "2026-07-22", ts: 1 }], cycle: { anchor: "2026-07-22", len: 28 } });   // a cycle of its own, luteal today

// ── 1. who tracks a cycle ──────────────────────────────────────────────────────────────────────────────────
console.log("1. who tracks a cycle");
const shown = o => world(NOW, o).run("mwCycleShown()");
ok("Howe: yes", shown({ howe: true, household: false, pages: {} }) === true);
ok("another family: yes", shown({ howe: false, household: false, pages: { kids: true } }) === true);
ok("a household: no", shown({ howe: false, household: true, pages: { kids: false } }) === false);
ok("a sliced test world (no HA_HOUSEHOLD, no PAGES at all): yes", shown({}) === true);
ok("the dashboard's switch on → a household tracks one", shown({ howe: false, household: true, pages: { cycle: true } }) === true);
ok("the dashboard's switch off → an ordinary family does not, nor Howe", shown({ howe: false, household: false, pages: { cycle: false } }) === false && shown({ howe: true, household: false, pages: { cycle: false } }) === false);
ok("only true / false count as set", shown({ howe: false, household: true, pages: { cycle: null } }) === false && shown({ howe: false, household: false, pages: { cycle: "no" } }) === true);
ok("not shown → no cycle of its own, even with a period logged", world(NOW, { howe: false, household: true, data: OWN }).run("mwCycleOwn()") === false && world(NOW, { howe: true, household: false, pages: { cycle: false }, data: OWN }).run("mwCycleOwn()") === false);
ok("shown → as CYCLEOWN decides (Howe yes; another family with nothing entered no; with its own yes)", world(NOW, { howe: true, household: false, data: FULL }).run("mwCycleOwn()") === true && world(NOW, { howe: false, household: false, data: FULL }).run("mwCycleOwn()") === false && world(NOW, { howe: false, household: false, data: OWN }).run("mwCycleOwn()") === true);

// ── 2. every other family is unchanged ─────────────────────────────────────────────────────────────────────
console.log("2. every other family: this tree == the tree with the slice taken out");
{ let n = 0; const bad = [];
  const days = []; for (let d = 0; d < 30; d++) days.push(new Date(Date.parse("2026-08-01") + d * 86400000).toISOString().slice(0, 10));
  const CASES = [["Howe, full", { howe: true, household: false, pages: { kids: true } }, FULL], ["Howe, nothing logged", { howe: true, household: false, pages: {} }, {}], ["Howe + periods", { howe: true, household: false }, OWN],
    ["another family, nothing entered", { howe: false, household: false, pages: { kids: true } }, FULL], ["another family, its own cycle", { howe: false, household: false, pages: {} }, OWN], ["a sliced world", {}, FULL]];
  for (const today of days) for (const [name, o, data] of CASES) {
    const d = Object.assign({}, data, { today }), a = world(NOW, Object.assign({}, o, { data: d })), b = world(WAS, Object.assign({}, o, { data: d }));
    for (const k of ["page", "banner", "badge"]) { n++; if (a[k]() !== b[k]()) bad.push(name + " " + today + " " + k); }
  }
  ok("the Health page, Home Base's banner and the date badge: " + n + " comparisons, all the same", bad.length === 0, bad.slice(0, 4)); }

// ── 3. a household ─────────────────────────────────────────────────────────────────────────────────────────
console.log("3. a household");
for (const [label, data] of [["nothing ever logged", FULL], ["a period once logged and a start date saved", OWN]]) {
  const w = world(NOW, { howe: false, household: true, pages: { kids: false }, data }), pg = w.page();
  const LEAKS = [["a cycle day", /cycle day\s*\d/i], ["the built-in date", /2026-07-25/], ["its logged date", /2026-07-22/], ["'next period'", /Next period expected/], ["a phase sentence", /You're in your/], ["'same phase'", /same phase/],
    ["the phase legend", /class="legend"/], ["phase bands", /<rect /], ["'read against your cycle'", /read against your cycle/], ["🩸 Period Log", /Period Log/], ["'Log period start'", /Log period start|mwLogPeriod/], ["⚙️ Cycle Settings", /Cycle Settings|mwSaveCycle|cy-anchor/], ["a 'd19' badge", /> ?[^<>]{0,3} d\d+<\/span>/]];
  LEAKS.forEach(([what, rx]) => ok(label + ": no " + what, !rx.test(pg), (pg.match(rx) || [""])[0]));
  ok(label + ": no Luteal / Period banner on Home Base, on any of 28 days", (() => { for (let d = 0; d < 28; d++) { const t = new Date(Date.parse("2026-08-01") + d * 86400000).toISOString().slice(0, 10); if (world(NOW, { howe: false, household: true, data: Object.assign({}, data, { today: t }) }).banner() !== "") return false; } return true; })());
  ok(label + ": no cycle day beside the weigh-in date", w.badge() === "");
  ok(label + ": the latest weight, both comparison tiles, the plain four-week sentence", /Latest Weigh-In/.test(pg) && /vs last week \(raw\)/.test(pg) && /<div class="lbl">vs 4 wks ago<\/div>/.test(pg) && /Compared with four weeks ago, you're down <b>2\.4 lb<\/b>\./.test(pg));
  ok(label + ": the trend (6 dots), the history (6 rows), Log This Week", (pg.match(/<circle /g) || []).length === 6 && (pg.match(/class="wlb"/g) || []).length === 6 && /Save weigh-in/.test(pg));
  ok(label + ": blood pressure and the symptom days", /118\/76/.test(pg) && /117\/75/.test(pg) && /Headache/.test(pg) && /Cramps/.test(pg));
  ok(label + ": the page is the page an ordinary family with nothing entered gets, minus the two cards", pg === world(NOW, { howe: false, household: false, data: FULL }).page().replace(/<div class="card"><div class="head" style="background:#c2547e">[\s\S]*?(?=<div class="card"><div class="head h-purple"><span>📊)/, "").replace(/<details><summary>⚙️ Cycle Settings[\s\S]*?<\/details>/, ""));
}
ok("a household with no weigh-ins yet: the first-time card, no cycle promise", (() => { const pg = world(NOW, { howe: false, household: true, data: { today: "2026-08-12" } }).page(); return /No weigh-ins yet/.test(pg) && !/cycle/i.test(pg.replace(/\[banner:[^\]]*\]/, "")); })());
ok("the dashboard turns it on for a household → exactly the page an ordinary family with that cycle gets", world(NOW, { howe: false, household: true, pages: { cycle: true }, data: OWN }).page() === world(NOW, { howe: false, household: false, data: OWN }).page() && /Period Log/.test(world(NOW, { howe: false, household: true, pages: { cycle: true }, data: OWN }).page()));
ok("the dashboard turns it off for an ordinary family → exactly a household's page", world(NOW, { howe: false, household: false, pages: { cycle: false }, data: OWN }).page() === world(NOW, { howe: false, household: true, data: OWN }).page());

// ── 4. the switch on the whole app ─────────────────────────────────────────────────────────────────────────
(async () => {
  console.log("4. the switch, from the dashboard's side, on the whole app");
  const AT = new Date("2026-11-24T14:00:00").getTime(), FB = { apiKey: "x", authDomain: "x.local", databaseURL: "https://x.local", projectId: "x" };
  async function app(family, tree) {
    const clock = SB.makeClock(AT); clock.boot = clock.now; const sched = SB.makeScheduler(clock);
    const db = SB.makeDb(clone(tree || {}), clock, sched);
    const d = SB.bootDevice({ name: "A", dev: "devA", db, clock, sched, family, indexPath: INDEX });
    d.momOn(); await sched.run(clock.now + 30000);
    d.health = () => { d.run("__HARNESS_NO_RENDER=false; mpSubView='weigh'; tab='moms-plan'; __el={innerHTML:''}; try{ renderMomsPlan(__el); } finally { __HARNESS_NO_RENDER=true; }"); return String(d.get("__el.innerHTML") || ""); };
    d.dash = async v => { db.api("dashboard").ref("settings/pages/cycle").set(v); await sched.run(clock.now + 1500); };
    d.db = db; d.errors = () => sched.errors.map(e => e.err).concat(d.logs.filter(l => /^error /.test(l)));
    return d;
  }
  const hh = await app({ familyId: "hh_check", familyName: "Check Family", appName: "Howe Household", kind: "household", roster: [], firebase: FB }, {});
  ok("a household: ❤️ Health opens, with no 🩸 Period Log and no ⚙️ Cycle Settings", hh.get("mpSubView") === "weigh" || (() => { hh.health(); return hh.get("mpSubView") === "weigh"; })());
  ok("… and the page says so", !/Period Log|Cycle Settings/.test(hh.health()) && /Blood Pressure/.test(hh.health()) && /Log This Week/.test(hh.health()));
  await hh.dash(true);
  ok("the dashboard sets settings/pages/cycle = true → the two cards are there", /Period Log/.test(hh.health()) && /Cycle Settings/.test(hh.health()) && hh.run("mwCycleShown()") === true);
  await hh.dash(null);
  ok("the switch removed → a household's own start again (none)", !/Period Log|Cycle Settings/.test(hh.health()) && hh.run("mwCycleShown()") === false);
  const fam = await app(FX.family, FX.db);
  ok("an ordinary family: both cards, as always", /Period Log/.test(fam.health()) && /Cycle Settings/.test(fam.health()));
  await fam.dash(false);
  ok("the dashboard sets it false → both cards gone for that family", !/Period Log|Cycle Settings/.test(fam.health()) && /Blood Pressure/.test(fam.health()));
  ok("the app wrote no switch itself, and nothing under wellness/", [hh, fam].every(d => d.db.log.filter(w => /^settings\/pages/.test(w.path)).every(w => w.dev === "dashboard") && d.db.log.every(w => !/^wellness/.test(w.path))));
  ok("no error", hh.errors().length === 0 && fam.errors().length === 0, hh.errors().concat(fam.errors()).slice(0, 2));

  console.log("\n" + pass + " passed, " + fail + " failed");
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error("test crashed:", e && e.stack || e); process.exit(1); });
