/*
 * 🧘 UNITS_CALM (her "yes" 2026-10-04): an early "➡ Start Stage" tap asks first (a ready kid moves up with no question),
 * and on a STARTER path the Up next + Sprints panels fold into one closed "🏃 Speed rounds (optional)" row.
 *   run:  node test_units_calm.js
 */
const fs = require("fs"), path = require("path");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
let pass = 0, fail = 0;
function ok(name, cond, extra) { if (cond) { pass++; console.log("  ok  - " + name); } else { fail++; console.log("  FAIL- " + name + (extra !== undefined ? "  (" + JSON.stringify(extra) + ")" : "")); } }
const block = src.slice(src.indexOf("// STARTER_UNITS_START"), src.indexOf("// STARTER_UNITS_END"));
function world(confirmAnswer) {
  const G = { masteryData: {}, currData: { subjects: {} }, writes: [], unitStudies: {}, asked: [], content: { innerHTML: "" } };
  const db = { ref(p) { return { update(v) { G.writes.push(["update", p, v]); }, set(v) { G.writes.push(["set", p, v]); }, transaction() { return Promise.resolve({ committed: false }); } }; } };
  const api = new Function("G", "db", "confirm", `
    const masteryData=G.masteryData, currData=G.currData; let unitStudies=G.unitStudies;
    function momHere(){ return true; } function _dryRun(){ return false; } function cap(s){ return s[0].toUpperCase()+s.slice(1); }
    function renderUnits(){} const HA_LS={ setItem(){} }; const document={ getElementById:()=>G.content };
    function mastDefKeyOk(n){ return !/[.$#\\[\\]\\/]/.test(n); } function mastGateChapter(){ return null; }
    ${block}
    return { STARTER_UNITS, unitStageFormOpen, unitStageFormSet, unitStageEnroll, unitStageStatus, unitStageMoveUp };`)(G, db, m => { G.asked.push(m); return confirmAnswer; });
  const u = api.STARTER_UNITS.letters_path(); G.unitStudies[u.id] = u; api.u = u; api.G = G; return api;
}
const enrollAt2 = w => { w.unitStageFormOpen("letters_path", "caleb"); w.unitStageFormSet("stage", "1"); w.unitStageFormSet("knows", "S–Z"); w.unitStageEnroll(); w.unitStageMoveUp("letters_path", "caleb"); };

console.log("early 'Start Stage' tap");
{ const w = world(false); enrollAt2(w);
  ok("Stage 1 → 2 (ready) moved up with no question", w.G.asked.length === 0 && w.u.kidStage.caleb.stage === 2, w.G.asked);
  w.unitStageMoveUp("letters_path", "caleb");
  ok("Stage 2 → 3 while NOT ready asks first", w.G.asked.length === 1 && /Caleb isn’t ready yet \(0 of 20 on the ladder\)\. Start Letter sounds anyway\? Little letters keeps going too\./.test(w.G.asked[0]), w.G.asked);
  ok("…'No' → stays on Stage 2, nothing written", w.u.kidStage.caleb.stage === 2 && !w.G.writes.some(x => x[1] === "unitStudies/letters_path/kidStage/caleb" && x[2].stage === 3)); }
{ const w = world(true); enrollAt2(w); w.unitStageMoveUp("letters_path", "caleb");
  ok("…'Yes' → starts Stage 3 anyway (her call)", w.u.kidStage.caleb.stage === 3); }

console.log("\nstarter path: Up next + Sprints fold away");
const r0 = src.indexOf("const _calm=!!(u.starter&&enrolledKids.length);"), r1 = src.indexOf("if(_calm) h+='</div></details>';");
ok("only on a starter path (u.starter) with kids enrolled", r0 > 0 && r1 > r0);
const seg = src.slice(r0, r1);
ok("closed <details> 'Speed rounds (optional)' opens before Up next…", /<details[^>]*><summary[^>]*>\\u\{1F3C3\} Speed rounds \(optional\)/.test(seg) && seg.indexOf("📌 Up next") > seg.indexOf("<details"));
ok("…and closes after Sprints", seg.indexOf("🏃 Sprints") > 0 && src.slice(r1, r1 + 60).includes("</details>"));
ok("non-starter units unchanged (no details unless _calm)", /if\(_calm\) h\+='<details/.test(seg));

console.log("\nno sprint nudges on starter paths (her ask 10/4: play only, nothing due)");
ok("unitPlanNudges returns nothing for a starter path", /function unitPlanNudges\(u,kid\)\{\n  const out=\[\]; if\(!u\|\|!\(u\.enrolled\|\|\{\}\)\[kid\]\) return out;\n  if\(u\.starter\) return out;/.test(src));
ok("the folded row says 'just for fun … nothing here is due'", /Speed rounds \(optional\) <span[^>]*>\\u00B7 just for fun if they want to play \\u2014 nothing here is due/.test(src));

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
