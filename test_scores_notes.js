/*
 * Node tests for 📊 Scores + 📝 Notes — Stage D (2026-09-13). Both live under plans/<kid> (roadmapData).
 *   · scores strip: folded summary line, unfolded table latest-first with NPR colour + ▲▼ vs prior year,
 *     weakest/strongest strands from the latest report, CogAT line; hidden when a kid has no reports
 *   · notes: list, fold/unfold renders markdown (headings, bullets, bold, tables, links escaped),
 *     add/edit/delete = one set/remove on plans/<kid>/notes/<id>, Mom-gated, dry-run silent
 *   · both strips are drawn under the Roadmap in the curriculum view; CSS present
 *
 *   run:  node test_scores_notes.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
let pass = 0, fail = 0;
function ok(n, c, x) { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x) + ")" : "")); } }
const a = src.indexOf("// ROADMAP_START"), z = src.indexOf("// SCORES_END");
ok("blocks present", a > 0 && z > a);
const writes = [], toasts = [];
const db = { ref(p) { return { set(v) { writes.push({ op: "set", path: p, val: v }); }, update(v) { writes.push({ op: "update", path: p, val: v }); }, remove() { writes.push({ op: "remove", path: p }); } }; } };
const ctx = { console, Date, db, window: {}, gwParseDate: iso => new Date(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)), _cbISO: d => d.toISOString().slice(0, 10), _todayStr: () => "2026-09-14",
  esc: s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])), cap: s => s.charAt(0).toUpperCase() + s.slice(1),
  ROSTER: ["lincoln", "ellis"], KID_COLOR: {}, currData: { subjects: {} }, roadmapData: {}, adminPinUnlocked: true, momPinUnlocked: false, _dryRun: () => false, renderAll() {}, gwShowToast: m => toasts.push(m), confirm: () => true, setInterval: () => 0, clearInterval() {}, showTab() {}, plSetSub() {} };
ctx.window = ctx; vm.createContext(ctx); vm.runInContext(src.slice(a, z), ctx);
const T = n => vm.runInContext(n, ctx);

console.log("\n# scores");
{
  ctx.roadmapData = { ellis: { scores: {
    "2025-08": { test: "Iowa Assessments", form_level: "E-8", date: "2025-08", grade: "2", tests: { reading: { ss: 146, npr: 12, ge: "1.9" }, mathematics: { ss: 176, npr: 55, ge: "3.0" }, complete_composite: { npr: 40 } } },
    "2026-08": { test: "Iowa Assessments", form_level: "E-9", date: "2026-08", grade: "3", tests: { reading: { ss: 197, npr: 82, ge: "5.1" }, conventions: { npr: 40, ge: "2.9" }, mathematics: { ss: 223, npr: 99, ge: "6.5" }, complete_composite: { npr: 98 } },
      domains: { conventions_spelling: { items: 24, pct: 38, nat: 53, diff: -15 }, conventions_capitalization: { items: 20, pct: 25, nat: 44, diff: -19 }, reading_implicit_meaning: { items: 11, pct: 100, nat: 60, diff: 40 }, math_extended_reasoning: { items: 8, pct: 100, nat: 40, diff: 60 } }, lexile: "650-750L" },
    "2024-10-cogat": { test: "CogAT", level: "7", date: "2024-10", batteries: { verbal: { sas: 135, npr: 99 }, composite: { sas: 128, npr: 96 } } } } } };
  ok("no reports → strip hidden", T("scStripHTML")("lincoln") === "");
  let h = T("scStripHTML")("ellis");
  ok("folded: 3 reports + summary line from the latest Iowa", /3 reports/.test(h) && /composite <b[^>]*>98</.test(h) && /conventions <b[^>]*>40</.test(h) && !/<table/.test(h));
  vm.runInContext("scOpen={ellis:true}", ctx); h = T("scStripHTML")("ellis");
  ok("unfolded: table, latest column first, GE shown", /<table/.test(h) && h.indexOf("2026-08") < h.indexOf("2025-08") && /\(5\.1\)/.test(h));
  ok("arrow vs prior year: reading ▲70, math ▲44", /▲70/.test(h) && /▲44/.test(h));
  ok("NPR colour bands: 99 green, 40 grey, 12 red", /color:#16a34a">99</.test(h) && /color:#475569">40</.test(h) && /color:#b5394a">12</.test(h));
  ok("strands line: weakest capitalization first, strongest math reasoning, Lexile", /weakest<\/b>: Conventions Capitalization 25% \(-19\)/.test(h) && /strongest<\/b>: Math Extended Reasoning 100% \(\+60\)/.test(h) && /Lexile 650-750L/.test(h));
  ok("CogAT line", /CogAT 2024-10<\/b> · Level 7: verbal <b[^>]*>135 \(99\)<\/b>/.test(h));
  ok("rows absent on every report are skipped (no Science row)", !/>Science</.test(h) && />Conventions</.test(h));
}
console.log("\n# markdown");
{
  const md = T("ntMd");
  ok("headings + bold + italic + code", md("## Plan\nSome **bold** and *it* and `x`") === "<h3>Plan</h3><p>Some <b>bold</b> and <i>it</i> and <code>x</code></p>", md("## Plan\nSome **bold** and *it* and `x`"));
  ok("bullets + numbered", md("- a\n- b\n\n1. c") === "<ul><li>a</li><li>b</li></ul><ol><li>c</li></ol>", md("- a\n- b\n\n1. c"));
  ok("table with separator row dropped", md("| A | B |\n|---|---|\n| 1 | 2 |") === '<table class="nt-tbl"><tr><td>A</td><td>B</td></tr><tr><td>1</td><td>2</td></tr></table>', md("| A | B |\n|---|---|\n| 1 | 2 |"));
  ok("html escaped, links rendered", /&lt;script&gt;/.test(md("<script>x</script>")) && /<a href="https:\/\/x" target="_blank"/.test(md("[see](https://x)")));
  ok("blockquote + hr", md("> q\n---") === "<blockquote>q</blockquote><hr>");
}
console.log("\n# notes: add / edit / delete");
{
  writes.length = 0;
  let h = T("ntStripHTML")("ellis");
  ok("empty state + ➕ Note", /No notes yet/.test(h) && /ntNew\('ellis'\)/.test(h));
  T("ntNew")("ellis"); T("ntSave")(); ok("title required", writes.length === 0 && /title/.test(toasts[toasts.length - 1]));
  T("ntSet")("title", "Reading diagnosis"); T("ntSet")("md", "# Where he reads\n- Eggspress Map 21\r\n");
  T("ntSave")();
  ok("save = one set on plans/ellis/notes/<slug-id>, CRs stripped, updated today", writes.length === 1 && writes[0].op === "set" && /^plans\/ellis\/notes\/reading-diagnosis-[a-z0-9]+$/.test(writes[0].path) && !/\r/.test(writes[0].val.md) && writes[0].val.updated === "2026-09-14", writes);
  const id = writes[0].path.split("/").pop();
  h = T("ntStripHTML")("ellis");
  ok("note listed and auto-opened, markdown rendered", /Reading diagnosis/.test(h) && /<h2>Where he reads<\/h2>/.test(h) && /<li>Eggspress Map 21<\/li>/.test(h));
  writes.length = 0; T("ntEditStart")("ellis", id); T("ntSet")("md", "changed"); T("ntSave")();
  ok("edit keeps the id, one set", writes.length === 1 && writes[0].path === "plans/ellis/notes/" + id && writes[0].val.md === "changed");
  writes.length = 0; T("ntEditStart")("ellis", id); T("ntDelete")();
  ok("delete = one remove, gone", writes.length === 1 && writes[0].op === "remove" && T("ntList")("ellis").length === 0);
  vm.runInContext("adminPinUnlocked=false", ctx); toasts.length = 0; T("ntNew")("ellis");
  ok("gated without the code", T("ntEdit") === null && /Mom code/.test(toasts[0]));
  vm.runInContext("adminPinUnlocked=true;_dryRun=function(){return true}", ctx); writes.length = 0;
  T("ntNew")("ellis"); T("ntSet")("title", "x"); T("ntSave")(); ok("dry-run writes nothing", writes.length === 0);
}
console.log("\n# wiring");
{
  ok("cards live in ONE place — the plan bar, not the retired list view", src.indexOf("h+=rmStripHTML(k);") < 0 && src.indexOf("h+=scStripHTML(k);") < 0);
  ok("notes CSS present", /\.nt-md\{/.test(src) && /\.nt-tbl td\{/.test(src));
  const g = src.indexOf('if(currInnerTab==="grid"){');
  ok("GRID branch (the real curriculum page) draws the plan bar before renderCurrGrid", src.indexOf("planBarHTML((typeof gvKid", g) > g && src.indexOf("planBarHTML((typeof gvKid", g) < src.indexOf("renderCurrGrid(el);", g));
  ctx.roadmapData.ellis.roadmap = { r1: { due: "2026-09-10", text: "late", kind: "add" }, r2: { due: "2026-09-18", text: "soon", kind: "add" } };
  let bar = T("planBarHTML")("ellis");
  ok("plan bar folded: counts + overdue + this week, no cards", /Ellis&#39;s plan|Ellis's plan/.test(bar) && /2 to do/.test(bar) && /1 overdue/.test(bar) && /1 this week/.test(bar) && /3 reports/.test(bar) && !/Test scores ·/.test(bar), bar);
  vm.runInContext("planOpen={ellis:true}", ctx); bar = T("planBarHTML")("ellis");
  ok("plan bar open: all three cards", /Roadmap · Ellis/.test(bar) && /Test scores · Ellis/.test(bar) && /Plan notes · Ellis/.test(bar));
  ok("no kid → nothing", T("planBarHTML")("") === "");
  ok("no bare column-0 brace in the block", !/\n\}\n(?!function|const|let|\/\/|$)/.test(src.slice(src.indexOf("// SCORES_START"), z)));
}
console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
