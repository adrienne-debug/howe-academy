/*
 * HHKIND — a home with no school: family-config.js kind:"household" (her "Yes, start step 1" 2026-11-24,
 * slice 1 of DESIGN_household_edition_2026-11-24.md §5.1).
 *
 * Why: her mom's house has no kids at home, and the app could not have an empty kid list — an empty roster in the family
 * file, in the saved copy or in settings/family fell back to the four Howe kids, and the Kids editor refused to save
 * with nobody on it.
 *
 * Runs the WHOLE app (test_fixtures/demo_week_sandbox.js: the real main script, a fake Firebase, a virtual clock) on
 * made-up families and checks:
 *   0. the block, and stripKind() undoing the slice (the "app before" = this tree with the slice taken out — no git)
 *   1. who is a household: only kind:"household" with a familyId of its own; every other family file gives the kid
 *      list it gave before (an empty roster without the kind is still the Howe four — unchanged)
 *   2. a household with no kids starts with no error; Household's and laundry's people are Mom and Dad only; every
 *      Mom's Day page draws without throwing; none of the eight Howe names is on a household-side page
 *   3. the Kids editor: a household may save nobody (one targeted write, settings/family) and may add a kid; any other
 *      family is still told "You need at least one kid." and nothing is written
 *   4. settings/family going empty: a household's other devices drop the kid and reload; any other family: as before
 *   5. the weekly build and the 8 PM sweep do not run for a household (no week… write)
 *   6. EVERY OTHER FAMILY IS UNCHANGED: the demo family on this tree and on the tree with the slice taken out — the same
 *      database writes and the same pages, byte for byte
 *
 *   run:  node test_household_kind.js
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
function once(s, from, to, what) {
  const n = s.split(from).length - 1;
  if (n !== 1) throw new Error("stripKind: \"" + what + "\" matched " + n + " times");
  return s.replace(from, () => to);
}
function stripKind(s) {
  const a = s.indexOf("// HHKIND_START"), b = s.indexOf("// HHKIND_END\n");
  if (a < 0 || b < a) throw new Error("stripKind: block not found");
  s = s.slice(0, a) + s.slice(b + "// HHKIND_END\n".length);
  s = s.replace(/const FAMILY_DEFAULT = HA_HOUSEHOLD \? \(haRosterOk\(window\.HA_FAMILY\.roster\)\?window\.HA_FAMILY\.roster:\[\]\) : {3}\/\/ HHKIND:[^\n]*\n {23}\(window\.HA_FAMILY/, "const FAMILY_DEFAULT = (window.HA_FAMILY");
  s = once(s, "(v.length||HA_HOUSEHOLD)&&v.every(", "v.length&&v.every(", "roster cache");
  s = s.replace(/\n {6}else if\(HA_HOUSEHOLD&&v==null\)\{[^\n]*\/\/ HHKIND:[^\n]*/, "");
  s = once(s, "if(!out.length&&!HA_HOUSEHOLD){", "if(!out.length){", "kids editor save");
  s = once(s, "Array.isArray(ROSTER)&&(ROSTER.length||(typeof HA_HOUSEHOLD!==\"undefined\"&&HA_HOUSEHOLD)))?ROSTER.slice()", "Array.isArray(ROSTER)&&ROSTER.length)?ROSTER.slice()", "household who");
  s = once(s, "ROSTER&&(ROSTER.length||(typeof HA_HOUSEHOLD!==\"undefined\"&&HA_HOUSEHOLD)))?ROSTER:", "ROSTER&&ROSTER.length)?ROSTER:", "laundry people");
  s = s.replace(/\n {2}if\(typeof HA_HOUSEHOLD!=="undefined"&&HA_HOUSEHOLD\) return(?: false)?; {3}\/\/ HHKIND:[^\n]*/g, "");
  s = s.replace(/ {3}\/\/ HHKIND:[^\n]*/g, "");
  return s;
}
console.log("0. the slice, and the app before it");
const BLOCK = src.slice(src.indexOf("// HHKIND_START"), src.indexOf("// HHKIND_END"));
ok("HHKIND_START / _END once each, right before FAMILY_DEFAULT", src.split("// HHKIND_START").length === 2 && src.split("// HHKIND_END").length === 2 && src.indexOf("// HHKIND_END\nconst FAMILY_DEFAULT = ") > 0);
ok("the block cites her ask, her yes, the date and the design", /her mom's house/.test(BLOCK) && /Yes, start step 1/.test(BLOCK) && /2026-11-24/.test(BLOCK) && /DESIGN_household_edition_2026-11-24\.md/.test(BLOCK));
ok("the block writes nothing and asks nothing (no db, no dialog)", !/db\.ref|\.set\(|\.update\(|alert\(|confirm\(|prompt\(/.test(BLOCK.replace(/^\s*\/\/.*$/gm, "")));
ok("a household needs a familyId of its own (never the Howe app)", /kind==="household"&&window\.HA_FAMILY\.familyId&&window\.HA_FAMILY\.familyId!=="howe"/.test(BLOCK));
let BEFORE = "";
try { BEFORE = stripKind(src); } catch (e) { ok("stripKind runs", false, String(e)); }
ok("stripped: no trace of the slice left (outside the 🧩 AREAS block, which reads HA_HOUSEHOLD for a household's starting switches)", !!BEFORE && !/HHKIND|const HA_HOUSEHOLD|function haHousehold|haRosterOk|HA_HOUSEHOLD \?|\|\|HA_HOUSEHOLD\)&&v\.every|!out\.length&&!HA_HOUSEHOLD/.test(BEFORE.replace(/\/\/ AREAS_START[\s\S]*?\/\/ AREAS_END\n/, "")));   // later slices (🧩 AREAS, 🏡 HHHOME) read HA_HOUSEHOLD behind a typeof guard — this looks for the slice's OWN lines
ok("stripped: the old lines are back", BEFORE.indexOf("const FAMILY_DEFAULT = (window.HA_FAMILY && Array.isArray(window.HA_FAMILY.roster) && window.HA_FAMILY.roster.length &&") > 0
  && BEFORE.indexOf('if(!out.length){ alert("You need at least one kid."); return; }') > 0
  && BEFORE.indexOf("function autoGenerateWeekIfNeeded(){\n  if(_autoGenTried) return;") > 0 && BEFORE.indexOf("function mlEveningSweep(force){\n  try{") > 0);
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "hhkind-"));
const INDEX_BEFORE = path.join(TMP, "index.html");
fs.writeFileSync(INDEX_BEFORE, BEFORE || src);

// ── worlds ─────────────────────────────────────────────────────────────────────────────────────────────────────
const AT = new Date("2026-11-24T14:00:00").getTime();   // a Tuesday afternoon
const FB = { apiKey: "x", authDomain: "x.local", databaseURL: "https://x.local", projectId: "x" };
const HH = { familyId: "hh_check", familyName: "Check Family", kind: "household", roster: [], firebase: FB };
const LAZY = ["house.js", "seasons.js", "gifts.js", "bigmeal.js"];
async function world(family, tree, o) {
  o = o || {};
  const clock = SB.makeClock(o.at || AT); clock.boot = clock.now; const sched = SB.makeScheduler(clock);
  const db = SB.makeDb(tree || {}, clock, sched);
  const d = SB.bootDevice({ name: "A", dev: "devA", db, clock, sched, family, indexPath: o.index || INDEX });
  d.run("__alerts=[]; alert=function(m){ __alerts.push(String(m)); }; __reloads=0; location.reload=function(){ __reloads++; };");
  d.momOn(); await sched.run(clock.now + 30000);
  d.db = db; d.clock = clock; d.sched = sched;
  d.lazy = () => LAZY.forEach(f => vm.runInContext(fs.readFileSync(path.join(__dirname, f), "utf8"), d.ctx, { filename: f }));
  d.page = v => { d.run("__HARNESS_NO_RENDER=false; mpSubView=" + JSON.stringify(v) + "; if(typeof mpSchMode!=='undefined') mpSchMode='week'; tab='moms-plan'; __el={innerHTML:''}; try{ renderMomsPlan(__el); } finally { __HARNESS_NO_RENDER=true; }"); return String(d.get("__el.innerHTML") || ""); };
  d.errors = () => sched.errors.map(e => e.err).concat(d.logs.filter(l => /^error /.test(l)));
  return d;
}
const roster = d => JSON.stringify(d.get("ROSTER"));
const HOWE4 = JSON.stringify(["lincoln", "ellis", "lucy", "julian"]);
const KID = { id: "sam", name: "Sam", color: "#123456" };
const VIEWS_HOME = ["plan", "cal", "house", "meals", "grocery", "prep", "budget", "gifts", "seasons", "weigh"];              // what a household is for
const VIEWS_REST = ["hq", "gen", "chores", "esa", "curr", "sset", "hist", "wins", "scor", "mhq", "dad", "dadcal", "dadall"];   // still there until the area switches (slice 2)
const NAMES = /Lincoln|Ellis|Lucy|Julian|Maggie|Adrienne|Andrew|Zuri/;
const noMsg = h => h.replace(/From Adrienne|Send to Adrienne/g, "");   // 💬 the message box to the app's owner — there on purpose for every family but Howe

(async () => {
  // ── 1. who is a household ──────────────────────────────────────────────────────────────────────────────────
  console.log("1. who is a household");
  const hh = await world(HH);
  ok("kind household + its own familyId + roster [] → a household with no kids", hh.get("HA_HOUSEHOLD") === true && hh.run("haHousehold()") === true && roster(hh) === "[]" && JSON.stringify(hh.get("SCHOOL_KIDS")) === "[]" && hh.get("FIRST_KID") === undefined);
  ok("… and it is not the Howe app", hh.get("HA_IS_HOWE") === false);
  { const d = await world({ familyId: "hh2", kind: "household", firebase: FB }); ok("a household file with no roster line at all → no kids (never the Howe four)", roster(d) === "[]"); }
  { const d = await world({ familyId: "hh3", kind: "household", roster: [KID], firebase: FB }); ok("a household file that lists a kid → that kid", roster(d) === '["sam"]' && d.get("HA_HOUSEHOLD") === true); }
  { const d = await world({ familyId: "hh4", kind: "household", roster: [{ id: "x" }], firebase: FB }); ok("a household file with a broken kid row → no kids", roster(d) === "[]"); }
  { const d = await world({ familyId: "other", familyName: "Other Family", roster: [], firebase: FB }); ok("UNCHANGED: no kind + an empty roster → still the fallback four (as before)", d.get("HA_HOUSEHOLD") === false && roster(d) === HOWE4); }
  { const d = await world({ familyId: "howe", kind: "household", roster: [], firebase: FB }); ok("the Howe app can never be a household (familyId howe)", d.get("HA_HOUSEHOLD") === false && d.get("HA_IS_HOWE") === true && roster(d) === HOWE4); }
  { const d = await world({ kind: "household", roster: [], firebase: FB }); ok("… nor a file with no familyId", d.get("HA_HOUSEHOLD") === false && roster(d) === HOWE4); }
  { const d = await world({ familyId: "other2", kind: "Household ", roster: [], firebase: FB }); ok("the kind is exactly \"household\" — anything else is an ordinary family", d.get("HA_HOUSEHOLD") === false); }
  { const d = await world(FX.family, clone(FX.db)); ok("UNCHANGED: the demo family is not a household and has its four kids", d.get("HA_HOUSEHOLD") === false && d.get("ROSTER").length === FX.family.roster.length); }

  // ── 2. a household with no kids ────────────────────────────────────────────────────────────────────────────
  console.log("2. a household with no kids");
  ok("it starts with no error", hh.errors().length === 0, hh.errors().slice(0, 3));
  ok("Household's who list is Mom, Dad and Up for Grabs — no kids", JSON.stringify(hh.get("HH_WHO")) === '["mom","dad","grab"]');
  ok("laundry's people are Mom and Dad", JSON.stringify(hh.run("llPeople()")) === '["mom","dad"]');
  ok("laundry starts with the two grown-up loads, Mom's", (() => { const it = hh.run("JSON.stringify(llDefaultItems())"); return !NAMES.test(it) && /Mom/.test(it); })(), hh.run("JSON.stringify(llDefaultItems())"));
  ok("starting wrote nothing about a kid, a week or the roster", hh.db.log.every(w => !/^(week\d+|archive|archiveCore|settings\/family|routineLog|mastery)/.test(w.path)), [...new Set(hh.db.log.map(w => w.path))]);
  hh.lazy();
  const pages = {};
  VIEWS_HOME.concat(VIEWS_REST).forEach(v => { try { pages[v] = hh.page(v); } catch (e) { pages[v] = "THROW " + String(e && e.stack || e).split("\n").slice(0, 2).join(" | "); } });
  await hh.sched.run(hh.clock.now + 3000);   // chore history (no kids → nothing to read) arrives
  try { pages.house = hh.page("house"); } catch (e) { pages.house = "THROW " + String(e); }
  VIEWS_HOME.forEach(v => ok("household side · " + v + ": draws, and something is on it", !/^THROW/.test(pages[v]) && pages[v].length > 200, pages[v].slice(0, 300)));
  VIEWS_HOME.forEach(v => { const m = noMsg(pages[v]).match(NAMES); ok("household side · " + v + ": none of the eight Howe names", !m, m ? noMsg(pages[v]).slice(Math.max(0, m.index - 80), m.index + 40) : ""); });
  ok("Household is past its loading line", !/Loading chore history/.test(pages.house), pages.house.slice(0, 200));
  VIEWS_REST.forEach(v => ok("the rest · " + v + ": still draws without throwing (hidden for a household in slice 2)", !/^THROW/.test(pages[v]), pages[v].slice(0, 300)));
  ok("no error from drawing them", hh.errors().length === 0, hh.errors().slice(0, 3));

  // ── 3. the Kids editor ─────────────────────────────────────────────────────────────────────────────────────
  console.log("3. the Kids editor");
  { const n = hh.db.log.length; hh.run("familyEdit=[]; famSave();"); await hh.sched.run(hh.clock.now + 1000);
    const w = hh.db.log.slice(n);
    ok("a household saves an empty list: no question, ONE write, settings/family", hh.get("__alerts").length === 0 && w.length === 1 && w[0].op === "set" && w[0].path === "settings/family", w.map(x => [x.op, x.path]));
    ok("… remembered on the device as an empty list, and the app reloads", hh.run("HA_LS.getItem('ha_family')") === "[]" && hh.get("__reloads") === 1); }
  { const n = hh.db.log.length; hh.run("familyEdit=[{name:'Sam',color:'#123456',schoolAge:false}]; famSave();"); await hh.sched.run(hh.clock.now + 1000);
    const w = hh.db.log.slice(n);
    ok("a household can add a kid: one write, settings/family", w.length === 1 && w[0].path === "settings/family" && /"name":"Sam"/.test(hh.run("HA_LS.getItem('ha_family')")), w.map(x => [x.op, x.path])); }
  { const d = await world(FX.family, clone(FX.db)); const n = d.db.log.length; d.run("familyEdit=[]; famSave();"); await d.sched.run(d.clock.now + 1000);
    ok("UNCHANGED: any other family saving nobody is told \"You need at least one kid.\" and nothing is written", JSON.stringify(d.get("__alerts")) === '["You need at least one kid."]' && d.db.log.slice(n).every(w => w.path !== "settings/family") && d.get("__reloads") === 0, [d.get("__alerts"), d.db.log.slice(n).map(w => w.path)]); }

  // ── 4. settings/family going empty on another device ───────────────────────────────────────────────────────
  console.log("4. the saved list going empty");
  { const d = await world(HH, { settings: { family: [KID] } });
    ok("a household device picks up a saved kid (cache written, reload — as every family does)", /"id":"sam"/.test(d.run("HA_LS.getItem('ha_family')")) && d.get("__reloads") === 1);
    d.db.api("devB").ref("settings/family").set(null); await d.sched.run(d.clock.now + 2000);
    ok("the list emptied elsewhere → this household device drops the kid and reloads", d.run("HA_LS.getItem('ha_family')") === "[]" && d.get("__reloads") === 2, [d.run("HA_LS.getItem('ha_family')"), d.get("__reloads")]);
    d.db.api("devB").ref("settings/family").set(null); await d.sched.run(d.clock.now + 2000);
    ok("… once (an empty list that is already empty does nothing)", d.get("__reloads") === 2); }
  { const d = await world(HH, {}); ok("a household with nothing saved and nothing remembered: no reload", d.get("__reloads") === 0 && d.run("HA_LS.getItem('ha_family')") === null); }
  { const d = await world(FX.family, Object.assign(clone(FX.db), { settings: Object.assign({}, clone(FX.db).settings || {}, { family: clone(FX.family.roster) }) }));
    const r0 = d.get("__reloads"), c0 = d.run("HA_LS.getItem('ha_family')");
    d.db.api("devB").ref("settings/family").set(null); await d.sched.run(d.clock.now + 2000);
    ok("UNCHANGED: any other family ignores an emptied list (keeps its kids, no reload)", d.get("__reloads") === r0 && d.run("HA_LS.getItem('ha_family')") === c0 && !!c0, [r0, d.get("__reloads")]); }

  // ── 5. no weekly build, no 8 PM sweep ──────────────────────────────────────────────────────────────────────
  console.log("5. the weekly build and the 8 PM sweep");
  { const d = await world(HH, { curriculum: { subjects: { none: true }, weekDays: { none: true }, lessons: { none: true } } });
    const n = d.db.log.length;
    d.run("_autoGenTried=false; autoGenerateWeekIfNeeded();"); await d.sched.run(d.clock.now + 180000);
    ok("a household's weekly build does nothing (never even marks itself tried)", d.get("_autoGenTried") === false && d.db.log.slice(n).every(w => !/^(week\d+|archive|archiveCore|settings\/activeWeek|schedLock)/.test(w.path)), d.db.log.slice(n).map(w => w.path));
    ok("a household's 8 PM sweep answers no, even when forced", d.run("mlEveningSweep(true)") === false && d.run("mlEveningSweep()") === false);
    ok("the two guards are the first line of each", /function autoGenerateWeekIfNeeded\(\)\{\n {2}if\(typeof HA_HOUSEHOLD!=="undefined"&&HA_HOUSEHOLD\) return;/.test(src) && /function mlEveningSweep\(force\)\{\n {2}if\(typeof HA_HOUSEHOLD!=="undefined"&&HA_HOUSEHOLD\) return false;/.test(src)); }

  // ── 6. every other family is unchanged ─────────────────────────────────────────────────────────────────────
  console.log("6. every other family: this tree == the tree with the slice taken out");
  async function snapshot(index, family, tree) {
    const d = await world(family, clone(tree), { index });
    d.lazy();
    const out = { roster: roster(d), school: JSON.stringify(d.get("SCHOOL_KIDS")), first: d.get("FIRST_KID"), who: JSON.stringify(d.get("HH_WHO")), ll: JSON.stringify(d.run("llPeople()")), pages: {} };
    VIEWS_HOME.concat(VIEWS_REST).forEach(v => { try { out.pages[v] = d.page(v); } catch (e) { out.pages[v] = "THROW " + String(e); } });
    await d.sched.run(d.clock.now + 120000);
    d.run("_autoGenTried=false; autoGenerateWeekIfNeeded();"); await d.sched.run(d.clock.now + 120000);
    out.sweep = String(d.run("(function(){ try{ return mlEveningSweep(); }catch(e){ return 'THROW '+e; } })()"));
    out.writes = d.db.log.map(w => (w.op + " " + w.path).replace(/^(\w+ connDiary\/[^/]+\/)[^/]+/, "$1*"));   // the start-up diary's row id is random per start
    out.errors = d.errors();
    return out;
  }
  for (const [label, family, tree] of [["the demo family (four kids, a built week)", FX.family, FX.db], ["a family with an empty roster and no kind", { familyId: "other", familyName: "Other Family", roster: [], firebase: FB }, {}]]) {
    const now = await snapshot(INDEX, family, tree), was = await snapshot(INDEX_BEFORE, family, tree);
    ok(label + ": the same kids, Household people and laundry people", ["roster", "school", "first", "who", "ll"].every(k => now[k] === was[k]), [now.roster, was.roster]);
    const diff = Object.keys(now.pages).filter(v => now.pages[v] !== was.pages[v]);
    ok(label + ": all " + Object.keys(now.pages).length + " Mom's Day pages byte for byte the same", diff.length === 0, diff);
    const wd = now.writes.map((w, i) => w === was.writes[i] ? null : [w, was.writes[i]]).filter(Boolean);
    ok(label + ": the same database writes, in the same order (" + now.writes.length + ")", JSON.stringify(now.writes) === JSON.stringify(was.writes), wd.slice(0, 4));
    ok(label + ": the same 8 PM sweep answer and the same (no) errors", now.sweep === was.sweep && JSON.stringify(now.errors) === JSON.stringify(was.errors), [now.sweep, was.sweep, now.errors.slice(0, 2)]);
  }

  try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (e) {}
  console.log("\n" + pass + " passed, " + fail + " failed");
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error("test crashed:", e && e.stack || e); process.exit(1); });
