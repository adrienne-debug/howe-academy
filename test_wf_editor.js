/*
 * Node tests for the Workflow subject-name editor + the rename-proof matcher.
 *
 * Extracts the WFEDIT block (wfMatch/wfResolveEntry/wfUnmatched + mutators) AND the real
 * gwWorkflowRank out of index.html. The fixture is Lincoln's LIVE 2026-08-30 config — the
 * one whose 8 dead names put Editor in Chief and Spelling You See at rank 39, dead last —
 * so the suite proves three things:
 *   1. the hybrid matcher reproduces today's live ranks EXACTLY on legacy text entries,
 *   2. the staleness that was invisible is now found (8 dead names, 6 fallback subjects),
 *   3. a KEY entry ranks by identity and a rename cannot move it.
 *
 *   run:  node test_wf_editor.js
 */
const fs = require("fs");
const path = require("path");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");

const a = src.indexOf("// WFEDIT_START");
const b = src.indexOf("// WFEDIT_END");
if (a < 0 || b < 0) { console.error("WFEDIT markers not found"); process.exit(1); }
const block = src.slice(a, b);

const g = src.indexOf("function gwWorkflowRank");
const gEnd = src.indexOf("\n}", g);
if (g < 0 || gEnd < 0) { console.error("gwWorkflowRank not found"); process.exit(1); }
const rankFn = src.slice(g, gEnd + 2);

// ── the fixture: Lincoln live, 2026-08-30 ──
const SUBJECTS = {
  morning_nb:   { display: "Morning Notebook", rules: "first" },
  closing_nb:   { display: "Closing Notebook", rules: "last" },
  eggspress_l:  { display: "Eggspress Map-Lesson", device: "computer" },
  ind_read:     { display: "Ind Reading" },
  singapore_l:  { display: "Singapore Math", mom: "maybe" },
  build_writing:{ display: "Building Writing Skills", mom: "maybe" },
  mr_pages:     { display: "MR5/MR6 Pages", mom: "maybe" },
  math_sprints: { display: "Math Sprints", mom: "required" },
  aas_l:        { display: "AAS Lesson", mom: "required" },
  wordsmith:    { display: "Wordsmith Session", mom: "maybe" },
  drills_l:     { display: "Drills", mom: "required" },
  editor_chief: { display: "Editor in Chief", mom: "required" },
  spell_ysee:   { display: "Spelling You See", mom: "required" },
};
const STEPS = [
  { label: "Computer first", tier: "computer",    subjects: ["TTRS", "Eggspress"] },
  { label: "Independent",    tier: "independent", subjects: ["Ind. Reading"] },
  { label: "May Need Mom",   tier: "maybe",       subjects: ["Singapore", "MR5 Math Reasoning", "Kumon", "LOF"] },
  { label: "Mom Required",   tier: "required",    subjects: ["Math Sprints", "AAS", "Dictation", "Wordsmith", "Conventions", "Written Expression"] },
];
// Live ranks measured 2026-08-30 (scratchpad rank computation, corroborated by the
// Evening Out starvation ordering). This IS the behavior the matcher must preserve.
const LIVE_RANKS = {
  morning_nb: -1, eggspress_l: 1, ind_read: 19, singapore_l: 20, build_writing: 29,
  mr_pages: 29, math_sprints: 30, aas_l: 31, wordsmith: 33, drills_l: 39,
  editor_chief: 39, spell_ysee: 39, closing_nb: 1000,
};

function fresh() {
  const prelude = `
    var fbArr=function(v){ if(!v) return v; if(Array.isArray(v)) return v;
      if(typeof v==="object"&&v!==null){ const ks=Object.keys(v);
        if(ks.length&&ks.every(k=>/^\\d+$/.test(k))) return ks.sort((x,y)=>x-y).map(k=>v[k]); }
      return v; };
    var saves=[];
    var saveRules=function(r){ saves.push(r); rulesData=r; };
    var currData={subjects:{lincoln:${JSON.stringify(SUBJECTS)}}};
    var rulesData={workflow:{lincoln:{normal:${JSON.stringify(STEPS)}}}};
  `;
  return new Function(prelude + block + rankFn + `;
    return { match:wfMatch, resolve:wfResolveEntry, unmatched:wfUnmatched,
      move:wfSubjMove, remove:wfSubjRemove, add:wfSubjAdd,
      rank:function(sk){ const s=currData.subjects.lincoln[sk];
        return gwWorkflowRank("lincoln", sk, s, "monday", false); },
      rename:function(sk,disp){ currData.subjects.lincoln[sk].display=disp; },
      steps:function(){ return rulesData.workflow.lincoln.normal; },
      saves:function(){ return saves; } };`)();
}

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log("  ok  - " + name); }
  else { fail++; console.log("  FAIL- " + name + (extra !== undefined ? "  (" + JSON.stringify(extra) + ")" : "")); }
}

console.log("legacy identity — the hybrid matcher reproduces the live ranks exactly");
{
  const api = fresh();
  const got = {}; Object.keys(LIVE_RANKS).forEach(sk => got[sk] = api.rank(sk));
  ok("all 13 subjects rank exactly as live",
    Object.keys(LIVE_RANKS).every(sk => got[sk] === LIVE_RANKS[sk]), got);
  ok("EIC and SYS sit at the tier fallback, dead last",
    got.editor_chief === 39 && got.spell_ysee === 39);
  ok("one period drops Ind Reading from 10 to the fallback", got.ind_read === 19);
}

console.log("\nthe invisible staleness is found");
{
  const api = fresh();
  const dead = [];
  STEPS.forEach(st => st.subjects.forEach(nm => { if (api.resolve("lincoln", nm).dead) dead.push(nm); }));
  ok("exactly the 8 dead names", dead.length === 8, dead);
  ok("and they are the right 8",
    ["TTRS","Ind. Reading","MR5 Math Reasoning","Kumon","LOF","Dictation","Conventions","Written Expression"]
      .every(n => dead.indexOf(n) >= 0), dead);
  ok("Eggspress is typed-but-alive, not dead",
    api.resolve("lincoln", "Eggspress").typed === true && api.resolve("lincoln", "Eggspress").dead === false);
  const um = api.unmatched("lincoln", "normal").map(o => o.disp);
  // 6, not 4: Ind Reading and MR5/MR6 also run on tier fallback (back of THEIR tiers,
  // ranks 19 and 29) — matches the live 2026-08-30 measurement exactly.
  ok("all 6 fallback subjects are the unmatched ones",
    um.length === 6 && ["Building Writing Skills","Drills","Editor in Chief","Ind Reading",
      "MR5/MR6 Pages","Spelling You See"].every(n => um.indexOf(n) >= 0), um);
  ok("notebooks are never reported unmatched",
    um.indexOf("Morning Notebook") < 0 && um.indexOf("Closing Notebook") < 0);
}

console.log("\nkey entries — rank by identity, rename-proof");
{
  const api = fresh();
  api.add("lincoln", "normal", 3, { value: "editor_chief" });
  ok("adding writes the KEY, not the name",
    api.steps()[3].subjects.indexOf("editor_chief") === 6, api.steps()[3].subjects);
  ok("EIC leaves the fallback: rank 39 -> 36", api.rank("editor_chief") === 36);
  api.rename("editor_chief", "EIC Level B2 — renamed");
  ok("a rename cannot move a key entry", api.rank("editor_chief") === 36);
  ok("the chip re-labels itself to the new name",
    api.resolve("lincoln", "editor_chief").disp === "EIC Level B2 — renamed");
  // the contrast: a typed entry breaks on a rename that drops the matched text
  // (falling to its maybe-tier fallback, rank 29 — not 39; 39 is the required tier)
  api.rename("wordsmith", "Word Builder");
  ok("a typed entry still breaks on a rename (rank 33 -> fallback 29)", api.rank("wordsmith") === 29);
  ok("and its chip goes dead", api.resolve("lincoln", "Wordsmith").dead === true);
}

console.log("\nmutations — clone, saveRules, nothing else");
{
  const api = fresh();
  api.move("lincoln", "normal", 2, 2, -1);
  ok("within-step move swaps positions",
    api.steps()[2].subjects.join("|") === "Singapore|Kumon|MR5 Math Reasoning|LOF", api.steps()[2].subjects);
  api.remove("lincoln", "normal", 2, 1);
  ok("remove deletes exactly one entry",
    api.steps()[2].subjects.join("|") === "Singapore|MR5 Math Reasoning|LOF");
  const n = api.saves().length;
  api.add("lincoln", "normal", 3, { value: "aas_l_dup_test" });
  api.add("lincoln", "normal", 3, { value: "aas_l_dup_test" });
  ok("a duplicate add saves nothing the second time", api.saves().length === n + 1);
  api.move("lincoln", "normal", 0, 0, -1);
  api.move("lincoln", "normal", 0, 1, 1);
  ok("out-of-range moves save nothing", api.saves().length === n + 1);
  api.add("lincoln", "normal", 9, { value: "singapore_l" });
  ok("a missing step saves nothing", api.saves().length === n + 1);
}

console.log("\nsource wiring — the one matcher really owns all four sites");
{
  ok("gwWorkflowRank calls wfMatch", src.indexOf("wfMatch(subs[j],key,disp)") > 0);
  ok("ceWorkflowTier calls wfMatch", src.indexOf("wfMatch(subs[j],sk,disp)") > 0);
  ok("_wfWeight and cascadeWeight both call wfMatch",
    (src.match(/wfMatch\(subs\[j\],String\(t\.subjectKey\|\|""\),subj\)/g) || []).length === 2);
  ok("no ranking site still substring-matches on its own",
    (src.match(/subjL\.includes\(String\(subs\[j\]\)/g) || []).length === 0 &&
    (src.match(/subj\.includes\(subs\[j\]\.toLowerCase\(\)\)/g) || []).length === 0);
  const card = src.slice(src.indexOf("Workflow Orders</div>"), src.indexOf("Workflow Orders</div>") + 12000);
  ok("chips wire to the three mutators",
    card.indexOf("wfSubjMove") > 0 && card.indexOf("wfSubjRemove") > 0 && card.indexOf("wfSubjAdd") > 0);
  ok("the picker stores the subject KEY as the option value", card.indexOf("esc(o2.sk)") > 0);
  ok("the picker never offers free text", card.indexOf("<option value=\"\">+ add</option>") > 0);
  ok("the unmatched readout renders", card.indexOf("No step names these") > 0);
  ok("dead chips explain themselves", card.indexOf("Matches no subject") > 0);
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
