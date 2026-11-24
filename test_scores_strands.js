/*
 * Node tests for 📊 Skill areas by year (SCSTRANDS, her ask 2026-11-23: "can we also add the things that were below
 * average like spelling from this year and other years … or maybe all the areas").
 *   · the table sits inside the unfolded Test scores strip, one row per area, one column per Iowa report (latest first)
 *   · it opens on the areas below the national average on the LATEST report, weakest first; "Show all areas" lists all
 *   · spelling / capitalization / punctuation printed under "Language" on older forms line up with "Conventions"
 *   · read-only: no write, no listener, no timer; names and dates are escaped
 *   · everything else = the app before: this tree with the block and its one call removed draws the same strip
 *
 *   run:  node test_scores_strands.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
let pass = 0, fail = 0;
function ok(n, c, x) { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x) + ")" : "")); } }

const bA = src.indexOf("// SCSTRANDS_START"), bZ = src.indexOf("// SCSTRANDS_END");
ok("block present", bA > 0 && bZ > bA);
const block = src.slice(bA, bZ);
const CALL = "    h+=scStrandsHTML(kid,iowa);   // SCSTRANDS\n";
ok("called once, from the scores strip", src.split(CALL).length === 2 && src.indexOf(CALL) > src.indexOf("function scStripHTML(kid){"));

function boot(code) {
  const a = code.indexOf("// ROADMAP_START"), z = code.indexOf("// SCORES_END");
  const writes = [];
  const db = { ref(p) { return { set(v) { writes.push(p); }, update(v) { writes.push(p); }, remove() { writes.push(p); }, on() { writes.push("on:" + p); } }; } };
  const ctx = { console, Date, db, gwParseDate: iso => new Date(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)), _cbISO: d => d.toISOString().slice(0, 10), _todayStr: () => "2026-11-23",
    esc: s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])), cap: s => s.charAt(0).toUpperCase() + s.slice(1),
    ROSTER: ["lincoln", "ellis"], KID_COLOR: {}, currData: { subjects: {} }, roadmapData: {}, adminPinUnlocked: true, momPinUnlocked: false, _dryRun: () => false, renderAll() {}, gwShowToast() {}, confirm: () => true, setInterval: () => { writes.push("interval"); return 0; }, clearInterval() {}, showTab() {}, plSetSub() {} };
  ctx.window = ctx; vm.createContext(ctx); vm.runInContext(code.slice(a, z), ctx);
  return { ctx, writes, T: n => vm.runInContext(n, ctx) };
}
const D = (items, pct, nat) => ({ items, pct, nat, diff: pct - nat });
const DATA = () => ({ lincoln: { scores: {
  "2024-09": { test: "Iowa Assessments", form_level: "E-8", date: "2024-09", grade: "3", tests: { reading: { npr: 14 } },
    domains: { language_spelling: D(20, 73, 82), language_capitalization: D(14, 86, 78), reading_key_ideas: D(6, 33, 60) } },
  "2026-03": { test: "Iowa Assessments", form_level: "E-10", date: "2026-03", grade: "4", tests: { reading: { npr: 27 } },
    domains: { conventions_spelling: D(27, 30, 65), conventions_capitalization: D(22, 32, 56), written_expression_usage_grammar: D(12, 42, 55), mathematics_measurement: D(11, 36, 50), vocabulary_vocabulary: D(34, 97, 67) } },
  "2026-03-cogat": { test: "CogAT", date: "2026-03", batteries: { verbal: { sas: 113, npr: 79 } } },
  "2026-11": { test: "Iowa Assessments", form_level: "E-11", date: "2026-11", grade: "5", tests: { reading: { npr: 67 } },
    domains: { conventions_spelling: D(30, 30, 58), conventions_capitalization: D(24, 42, 48), written_expression_usage_grammar: D(14, 29, 49), written_expression_sentence_structure: D(7, 29, 59), mathematics_measurement: D(12, 75, 54), vocabulary_vocabulary: D(37, 81, 60), reading_authors_craft: D(8, 63, 58) } } } },
  ellis: { scores: { "2026-08": { test: "Iowa Assessments", date: "2026-08", tests: { reading: { npr: 82 } } } } } });
const rowsOf = h => { const t = h.slice(h.indexOf("Skill areas by year")); return (t.match(/<tr style="border-top[\s\S]*?<\/tr>/g) || []); };
const text = r => r.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

console.log("\n# where it shows");
{
  const A = boot(src); A.ctx.roadmapData = DATA();
  ok("folded strip: no table", !/Skill areas by year/.test(A.T("scStripHTML")("lincoln")));
  vm.runInContext("scOpen={lincoln:true,ellis:true}", A.ctx);
  ok("unfolded strip: table shown", /Skill areas by year/.test(A.T("scStripHTML")("lincoln")));
  ok("no report has skill areas → nothing added", !/Skill areas by year/.test(A.T("scStripHTML")("ellis")));
  ok("drawing writes nothing, starts nothing", A.writes.length === 0, A.writes);
}
console.log("\n# opens on the areas below average on the latest test");
{
  const A = boot(src); A.ctx.roadmapData = DATA(); vm.runInContext("scOpen={lincoln:true}", A.ctx);
  const h = A.T("scStripHTML")("lincoln"), R = rowsOf(h).map(text);
  ok("says how many and which test", /4 below the national average on the latest test \(2026-11\)/.test(h), h.slice(h.indexOf("Skill areas"), h.indexOf("Skill areas") + 300));
  ok("4 rows, weakest first", R.length === 4 && /Sentence Structure/.test(R[0]) && /Spelling/.test(R[1]) && /Usage &amp; Grammar|Usage & Grammar/.test(R[2]) && /Capitalization/.test(R[3]), R);
  ok("areas at or above average are left out (Measurement, Vocabulary, Author's Craft)", !R.some(r => /Measurement|Vocabulary|Craft/.test(r)));
  ok("columns latest first, CogAT is not a column", (() => { const t = h.slice(h.indexOf("Skill areas by year")); return t.indexOf(">2026-11<") < t.indexOf(">2026-03<") && t.indexOf(">2026-03<") < t.indexOf(">2024-09<") && !/cogat/i.test(t.slice(t.indexOf("<thead"), t.indexOf("</thead>"))); })());
  ok("spelling: one row across the renamed forms — 30% (-28) · 30% (-35) · 73% (-9)", /Conventions · Spelling 30% \(-28\) 30% \(-35\) 73% \(-9\)/.test(R[1]), R[1]);
  ok("an area a test did not report shows —", /Sentence Structure 29% \(-30\) — —/.test(R[0]), R[0]);
  ok("above average in an older year is not red: capitalization 86% (+8)", /Capitalization 42% \(-6\) 32% \(-24\) 86% \(\+8\)/.test(R[3]) && /color:#334155">86%/.test(h) && /color:#b5394a;font-weight:700">42%/.test(h));
  ok("link offers every area", /Show all areas<\/a>/.test(h) && /scAll\['lincoln'\]=!scAll\['lincoln'\];renderAll\(\)/.test(h));
}
console.log("\n# show all areas");
{
  const A = boot(src); A.ctx.roadmapData = DATA(); vm.runInContext("scOpen={lincoln:true};scAll={lincoln:true}", A.ctx);
  const h = A.T("scStripHTML")("lincoln"), R = rowsOf(h).map(text);
  ok("every area ever reported, renamed ones once: 8 rows", R.length === 8, R);
  ok("in report order: Reading, Written Expression, Conventions, Vocabulary, Math", /^Reading · Author/.test(R[0]) && /^Reading · Key Ideas/.test(R[1]) && /^Written Expression/.test(R[2]) && /^Conventions/.test(R[4]) && /^Vocabulary 81%/.test(R[6]) && /^Math · Measurement 75% \(\+21\) 36% \(-14\) —/.test(R[7]), R);
  ok("older-only area keeps its row: Key Ideas — — 33% (-27)", /Key Ideas — — 33% \(-27\)/.test(R[1]), R[1]);
  ok("link goes back", /Show below average only<\/a>/.test(h) && /every area/.test(h));
  ok("the other kid's switch is untouched", !A.T("scAll").ellis);
}
console.log("\n# edges");
{
  const A = boot(src); const d = DATA();
  d.lincoln.scores["2027-08"] = { test: "Iowa Assessments", date: "2027-08", tests: { reading: { npr: 70 } } };   // newest report typed without areas yet
  A.ctx.roadmapData = d; vm.runInContext("scOpen={lincoln:true}", A.ctx);
  let h = A.T("scStripHTML")("lincoln");
  ok("newest report has no areas yet → the latest one that does is used", /on the latest test \(2026-11\)/.test(h) && rowsOf(h).length === 4);
  const e = DATA(); Object.keys(e.lincoln.scores["2026-11"].domains).forEach(k => { const x = e.lincoln.scores["2026-11"].domains[k]; x.pct = x.nat + 5; x.diff = 5; });
  A.ctx.roadmapData = e; h = A.T("scStripHTML")("lincoln");
  ok("nothing below → says so, still offers all areas", /Nothing below the national average on the latest test\./.test(h) && /Show all areas/.test(h) && rowsOf(h).length === 0);
  const x = DATA(); x.lincoln.scores["2026-11"].domains["reading_<img src=x onerror=1>"] = D(5, 10, 60); x.lincoln.scores["2026-11"].date = "<b>2026-11";
  A.ctx.roadmapData = x; h = A.T("scStripHTML")("lincoln"); const t = h.slice(h.indexOf("Skill areas by year"));
  ok("names and dates are escaped", !/<img/.test(t) && !/<b>2026-11/.test(t) && /&lt;b&gt;2026-11/.test(t));
  const z = DATA(); z.lincoln.scores["2026-11"].domains.conventions_spelling = { items: 30, pct: 30 };   // no gap typed
  A.ctx.roadmapData = z; h = A.T("scStripHTML")("lincoln");
  ok("an area with no gap typed never counts as below", !rowsOf(h).map(text).some(r => /Spelling/.test(r)));
}
console.log("\n# read-only + the app before");
{
  ok("block makes no write, listener or timer", !/db\.ref|\.set\(|\.update\(|\.remove\(|\.on\(|setInterval|setTimeout|localStorage|HA_LS/.test(block));
  const before = src.replace(block + "// SCSTRANDS_END\n", "").replace(CALL, "");
  ok("the app before = this tree minus the block and its call (each removed once)", before.length === src.length - block.length - "// SCSTRANDS_END\n".length - CALL.length && !/scStrands|SCSTRANDS|scAll\b/.test(before.slice(before.indexOf("// ROADMAP_START"), before.indexOf("// SCORES_END"))));
  const A = boot(src), B = boot(before); A.ctx.roadmapData = DATA(); B.ctx.roadmapData = DATA();
  ok("folded strip: same as before", A.T("scStripHTML")("lincoln") === B.T("scStripHTML")("lincoln"));
  vm.runInContext("scOpen={lincoln:true,ellis:true}", A.ctx); vm.runInContext("scOpen={lincoln:true,ellis:true}", B.ctx);
  const hA = A.T("scStripHTML")("lincoln"), hB = B.T("scStripHTML")("lincoln"), add = A.T("scStrandsHTML")("lincoln", A.T("scList")("lincoln").filter(r => r.tests));
  ok("unfolded strip = the strip before + the table, nothing else changed", add.length > 0 && hA.replace(add, "") === hB && hA.split(add).length === 2);
  ok("a kid with no skill areas: strip same as before", A.T("scStripHTML")("ellis") === B.T("scStripHTML")("ellis"));
  ok("the weakest / strongest line is still there", /weakest<\/b>: /.test(hA) && /strongest<\/b>: /.test(hA));
}
console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
