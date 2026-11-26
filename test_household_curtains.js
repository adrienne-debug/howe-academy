/*
 * 🪟 HHCURTAINS — a household is not offered the one-tap "Add the curtains" (seven rows named for the Howes' own rooms) — her
 * "Yes, start step 5" 2026-11-24/25, slice 5 of DESIGN_household_edition_2026-11-24.md §5.5.
 *
 * Runs the WHOLE app (test_fixtures/demo_week_sandbox.js) and checks:
 *   0. the block, and stripCurtains() undoing the slice (the "app before" = this tree with the slice taken out — no git)
 *   1. EVERY OTHER FAMILY IS UNCHANGED: the demo family's "Every few weeks" card is byte for byte the same, the button is there,
 *      and tapping it writes the same seven rows as before
 *   2. a household: no button, the hint line and ＋ Add stay, and the function behind the button does nothing if called
 *
 *   run:  node test_household_curtains.js
 */
const fs = require("fs"), path = require("path"), os = require("os");
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

const SLICE = [
  ["block + guard",
   "// HHCURTAINS_START — 🪟 \"Add the curtains\" is seven rows named for the Howes' own rooms (School room, Littles' room, Big boys' room,\n// Master bedroom…). A household does not get that one-tap button — its hint line and ＋ Add stay, so she adds her own (her \"Yes, start\n// step 5\" 2026-11-24/25: \"your room names … would not show\"; slice 5 of DESIGN_household_edition_2026-11-24.md §5.5). Household only:\n// every other family keeps the button exactly as it is. No database reads or writes.\nfunction llCurtainsOffer(){ return !((typeof HA_HOUSEHOLD!==\"undefined\")&&HA_HOUSEHOLD); }\n// HHCURTAINS_END\nfunction llXCurtains(){ if(!llCurtainsOffer()) return;   /* 🪟 HHCURTAINS */ llChange(function(){ const t=llToday(),",
   "function llXCurtains(){ llChange(function(){ const t=llToday(),"],
  ["button",
   "+(mom?((hasC||(typeof llCurtainsOffer===\"function\"&&!llCurtainsOffer()))?'':btn(\"llXCurtains()\",\"🪟 Add the curtains\"))+btn(\"llXToggle()\",llXOpen?\"Cancel\":\"＋ Add\"):'')+'</div>';",
   "+(mom?(hasC?'':btn(\"llXCurtains()\",\"🪟 Add the curtains\"))+btn(\"llXToggle()\",llXOpen?\"Cancel\":\"＋ Add\"):'')+'</div>';"]
];
function stripCurtains(s) {
  SLICE.forEach(([what, now, before]) => {
    const n = s.split(now).length - 1;
    if (n !== 1) throw new Error("stripCurtains: \"" + what + "\" matched " + n + " times");
    s = s.replace(now, () => before);
  });
  return s;
}
console.log("0. the slice, and the app before it");
const BLOCK = src.slice(src.indexOf("// HHCURTAINS_START"), src.indexOf("// HHCURTAINS_END"));
ok("HHCURTAINS_START / _END once each, right before llXCurtains", src.split("// HHCURTAINS_START").length === 2 && src.split("// HHCURTAINS_END").length === 2 && src.indexOf("// HHCURTAINS_END\nfunction llXCurtains(){") > 0);
ok("the block cites her yes, her words and the design", /Yes, start\s+(\/\/ )?step 5/.test(BLOCK.replace(/\n\/\/ /g, " ")) && /would not show/.test(BLOCK) && /DESIGN_household_edition_2026-11-24\.md/.test(BLOCK));
ok("the block reads and writes nothing (no db, no storage, no dialog)", !/db\.ref|HA_LS|\.set\(|\.update\(|alert\(|confirm\(|prompt\(/.test(BLOCK.replace(/^\s*\/\/.*$/gm, "")));
let BEFORE = "";
try { BEFORE = stripCurtains(src); } catch (e) { ok("stripCurtains runs", false, String(e)); }
ok("stripped: no trace of the slice left", !!BEFORE && !/HHCURTAINS|llCurtainsOffer/.test(BEFORE));
ok("the seven rows are still the list they were", /const LL_CURTAINS=\[\["schoolroom","School room"\],\["kitchen","Kitchen"\],\["living","Living room"\],\["littles","Littles' room"\],\["bigboys","Big boys' room"\],\["hallway","Hallway"\],\["master","Master bedroom"\]\];/.test(src));
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "hhcurt-"));
const INDEX_BEFORE = path.join(TMP, "index.html");
fs.writeFileSync(INDEX_BEFORE, BEFORE || src);

const AT = new Date("2026-11-24T14:00:00").getTime(), FB = { apiKey: "x", authDomain: "x.local", databaseURL: "https://x.local", projectId: "x" };
const LINE = { items: { load_a: { label: "Whites", emoji: "🧺", order: 0 } } };   // a laundry line that is set up, no extras yet
async function world(family, tree, index) {
  const clock = SB.makeClock(AT); clock.boot = clock.now; const sched = SB.makeScheduler(clock);
  const db = SB.makeDb(clone(tree || {}), clock, sched);
  const d = SB.bootDevice({ name: "A", dev: "devA", db, clock, sched, family, indexPath: index || INDEX });
  d.momOn(); await sched.run(clock.now + 30000);
  d.db = db; d.sched = sched; d.clock = clock;
  d.card = () => d.run("llExtrasHTML(true,llToday())");
  d.errors = () => sched.errors.map(e => e.err).concat(d.logs.filter(l => /^error /.test(l)));
  return d;
}
const BTN = /<button onclick="llXCurtains\(\)"[^>]*>🪟 Add the curtains<\/button>/;
const extras = w => w.filter(x => /laundryLine/.test(x.path)).map(x => x.op + " " + x.path);

(async () => {
  console.log("1. every other family: this tree == the tree with the slice taken out");
  const treeFam = Object.assign(clone(FX.db), { laundryLine: clone(LINE) });
  const now = await world(FX.family, treeFam), was = await world(FX.family, treeFam, INDEX_BEFORE);
  ok("the demo family is offered the button", now.run("llCurtainsOffer()") === true && BTN.test(now.card()));
  ok("its Every-few-weeks card is byte for byte the card before", now.card() === was.card());
  { const a = now.db.log.length, b = was.db.log.length;
    now.run("__c=(typeof confirm==='function')?confirm:null; confirm=function(){ return true; }; llXCurtains();"); was.run("confirm=function(){ return true; }; llXCurtains();");
    await now.sched.run(now.clock.now + 2000); await was.sched.run(was.clock.now + 2000);
    const wa = now.db.log.slice(a), wb = was.db.log.slice(b);
    ok("tapping it writes exactly what it wrote before", JSON.stringify(extras(wa)) === JSON.stringify(extras(wb)) && extras(wa).length > 0, [extras(wa).slice(0, 3), extras(wb).slice(0, 3)]);
    ok("… the seven curtain rows are in the family's line, the same on both", JSON.stringify(now.run("JSON.stringify(Object.keys(llExtras()).sort())")) === JSON.stringify(was.run("JSON.stringify(Object.keys(llExtras()).sort())")) && now.run("Object.keys(llExtras()).filter(function(k){ return /^x_curtains_/.test(k); }).length") === 7);
    ok("… and with all seven added the button is gone, as before", !BTN.test(now.card()) && now.card() === was.card()); }
  ok("no error on either", now.errors().length === 0 && was.errors().length === 0, now.errors().slice(0, 2));

  console.log("2. a household");
  const hh = await world({ familyId: "hh_check", familyName: "Check Family", appName: "Howe Household", kind: "household", roster: [], firebase: FB }, { laundryLine: clone(LINE) });
  const card = hh.card();
  ok("it is not offered the button", hh.run("llCurtainsOffer()") === false && !BTN.test(card) && !/llXCurtains\(/.test(card));
  ok("＋ Add and the hint line (“Curtains, shower mats, dog beds…”) are there", /llXToggle\(\)/.test(card) && /Curtains, shower mats, dog beds/.test(card));
  ok("none of the Howe room names is on the card", !/School room|Littles|Big boys|Master bedroom/.test(card));
  { const n = hh.db.log.length; hh.run("confirm=function(){ return true; }; llXCurtains();"); await hh.sched.run(hh.clock.now + 2000);
    ok("the function behind the button does nothing for a household if it is ever called (no write, no row)", hh.db.log.length === n && hh.run("Object.keys(llExtras()).length") === 0, hh.db.log.slice(n).map(w => w.path)); }
  ok("the card is the demo family's card minus that one button", card === was.run("laundryLine=" + JSON.stringify(LINE) + "; llExtrasHTML(true,llToday())").replace(BTN, ""));
  ok("a household: no error", hh.errors().length === 0, hh.errors().slice(0, 2));

  try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (e) {}
  console.log("\n" + pass + " passed, " + fail + " failed");
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error("test crashed:", e && e.stack || e); process.exit(1); });
