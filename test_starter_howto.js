// 📋 Starter-unit decks ship with their How-to (STARTER_HOWTO, her note 2026-10-04: "counting will need the
// instructions on the drill"). Joining a stage fills mastery/<kid>_settings/cat_instructions(+_kid)[deck] for the
// decks that stage brings — only when the deck has no note, so Mom's own words are never replaced.
// UNITS_SRC=<path> runs it against another copy of index.html.  Run: node test_starter_howto.js
const fs = require("fs"), path = require("path");
const src = fs.readFileSync(process.env.UNITS_SRC || path.join(__dirname, "index.html"), "utf8");
let pass = 0, fail = 0;
function ok(name, cond) { if (cond) { pass++; console.log("  ok  - " + name); } else { fail++; console.log("  FAIL- " + name); } }
const block = src.slice(src.indexOf("// STARTER_UNITS_START"), src.indexOf("// STARTER_UNITS_END"));
ok("STARTER_HOWTO inside the STARTER_UNITS block", /const STARTER_HOWTO=\{/.test(block));
function world(mastery, unitId) {
  const G = { masteryData: mastery || {}, currData: { subjects: {} }, writes: [], unitStudies: {}, content: { innerHTML: "" } };
  const db = { ref(p) { return { update(v) { G.writes.push(["update", p, v]); }, set(v) { G.writes.push(["set", p, v]); }, transaction() { return Promise.resolve({ committed: false }); } }; } };
  const api = new Function("G", "db", `
    const masteryData=G.masteryData, currData=G.currData; let unitStudies=G.unitStudies;
    function momHere(){ return true; } function _dryRun(){ return false; } function cap(s){ return s[0].toUpperCase()+s.slice(1); }
    function renderUnits(){} const HA_LS={ setItem(){} }; const document={ getElementById:()=>G.content };
    function mastDefKeyOk(n){ return !/[.$#\\[\\]\\/]/.test(n); } function mastGateChapter(){ return null; }
    ${block}
    return { STARTER_UNITS, STARTER_HOWTO, unitStageFormOpen, unitStageFormSet, unitStageEnroll, unitStageMoveUp };`)(G, db);
  const u = api.STARTER_UNITS[unitId](); G.unitStudies[u.id] = u; api.u = u; api.G = G; return api;
}
const enroll = (w, kid, stage, knows) => { w.unitStageFormOpen(w.u.id, kid); w.unitStageFormSet("stage", String(stage)); if (knows) w.unitStageFormSet("knows", knows); w.unitStageEnroll(); };

const probe = world({}, "math_fluency_path");
const allDecks = new Set();
["math_fluency_path", "letters_path", "shapes_path"].forEach(id => probe.STARTER_UNITS[id]().decks.forEach(d => allDecks.add(d.key)));
ok("every starter deck has a How-to (main + kid)", [...allDecks].every(k => probe.STARTER_HOWTO[k] && probe.STARTER_HOWTO[k].main && probe.STARTER_HOWTO[k].kid));
ok("every How-to fits the 240-character box", Object.values(probe.STARTER_HOWTO).every(t => t.main.length <= 240 && t.kid.length <= 240));
ok("Counting's How-to: touch each picture, count out loud, teens from the full ten-frame", /Touch each picture once and count out loud/.test(probe.STARTER_HOWTO.Counting.main) && /ten-frame/.test(probe.STARTER_HOWTO.Counting.main));

// Caleb joins the Math Fluency Path at Stage 1 → Numbers + Counting get their How-to
let w = world({}, "math_fluency_path"); enroll(w, "caleb", 1, "6–10");
let st = w.G.masteryData.caleb_settings;
ok("Stage 1 fills Numbers + Counting (Mom's note + kid line)", st.cat_instructions.Numbers === w.STARTER_HOWTO.Numbers.main && st.cat_instructions_kid.Counting === w.STARTER_HOWTO.Counting.kid);
ok("…written as targeted updates on the two instruction paths", w.G.writes.some(x => x[0] === "update" && x[1] === "mastery/caleb_settings/cat_instructions" && Object.keys(x[2]).sort().join() === "Counting,Numbers") && w.G.writes.some(x => x[1] === "mastery/caleb_settings/cat_instructions_kid"));
ok("…and nothing for decks this stage doesn't bring (Number Sense, Math Facts)", !st.cat_instructions["Number Sense"] && !st.cat_instructions["Math Facts"]);

// Mom already wrote her own Counting note → kept; Numbers still filled
w = world({ caleb_settings: { cat_instructions: { Counting: "Mom's own words" }, cat_instructions_kid: {} } }, "math_fluency_path"); enroll(w, "caleb", 1);
st = w.G.masteryData.caleb_settings;
ok("Mom's own Counting note is never replaced", st.cat_instructions.Counting === "Mom's own words" && !st.cat_instructions_kid.Counting);
ok("…the deck without a note still gets one (Numbers)", st.cat_instructions.Numbers === w.STARTER_HOWTO.Numbers.main);
ok("…and the write carries only Numbers", w.G.writes.filter(x => x[1] === "mastery/caleb_settings/cat_instructions").every(x => !("Counting" in x[2])));

// Letters Path: Stage 1 → Letters; ➡ Stage 2 → Lowercase; ➡ Stage 3 → Letter Sounds
w = world({}, "letters_path"); enroll(w, "caleb", 1, "S–Z");
ok("Letters Path Stage 1: Letters How-to", w.G.masteryData.caleb_settings.cat_instructions.Letters === w.STARTER_HOWTO.Letters.main);
w.unitStageMoveUp("letters_path", "caleb");
ok("➡ Stage 2: Lowercase How-to (names only — sounds later)", /Names only for now/.test(w.G.masteryData.caleb_settings.cat_instructions.Lowercase));
// Shapes Path
w = world({}, "shapes_path"); enroll(w, "caleb", 1);
ok("Shapes Path: 'Name the shape! Count its sides.' on his card", w.G.masteryData.caleb_settings.cat_instructions_kid.Shapes === "Name the shape! Count its sides.");

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
