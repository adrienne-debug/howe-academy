// 🧮 Staged unit enroll + book link (UNIT_STAGES block inside STARTER_UNITS, her plan 2026-10-02).
// Runs the real block over fixtures shaped like the DeWalt kids:
//  · Taylor  — × ÷, knows through the 12s, no book → all 313 on the ladder (6s–12s weekly, 0s–5s
//              every 2 weeks), nothing learning, no gate;
//  · Kenzie  — × ÷, knows through the 5s → 0s–5s review, 3 of the 6s start learning;
//  · Andrew  — + −, already has his live deck → enrolling adds NOTHING (no duplicate), gate kept;
//  · a new kid on the Abeka map — `ch` stamped on HIS bank only, intros held until the book's lesson;
//  · ➡ move up — next stage's cards join the bank, 3 start learning, the old stage keeps reviewing;
//  · writes are targeted paths only, none in dry run.
// UNITS_SRC=<path> runs it against another copy of index.html.
const fs = require("fs"), path = require("path");
const src = fs.readFileSync(process.env.UNITS_SRC || path.join(__dirname, "index.html"), "utf8");
let pass = 0, fail = 0;
function ok(name, cond) { if (cond) { pass++; console.log("  ok  - " + name); } else { fail++; console.log("  FAIL- " + name); } }
const a = src.indexOf("// STARTER_UNITS_START"), b = src.indexOf("// STARTER_UNITS_END");
ok("UNIT_STAGES inside the STARTER_UNITS block", a > 0 && src.indexOf("// UNIT_STAGES_START") > a && src.indexOf("// UNIT_STAGES_END") < b);
const block = src.slice(a, b);

function world(o) {
  o = o || {};
  const G = { masteryData: o.mastery || {}, currData: o.curr || { subjects: {} }, writes: [], dry: !!o.dry, gateCh: o.gateCh,
    unitStudies: {}, content: { innerHTML: "" } };
  const db = { ref(p) { return { update(v) { G.writes.push(["update", p, v]); }, set(v) { G.writes.push(["set", p, v]); },
    transaction() { return Promise.resolve({ committed: false }); } }; } };
  const api = new Function("G", "db", `
    const masteryData=G.masteryData, currData=G.currData; let unitStudies=G.unitStudies;
    function momHere(){ return true; } function _dryRun(){ return G.dry; } function cap(s){ return s[0].toUpperCase()+s.slice(1); }
    function renderUnits(){} const HA_LS={ setItem(){} }; const document={ getElementById:()=>G.content };
    function mastDefKeyOk(n){ return !/[.$#\\[\\]\\/]/.test(n); }
    function mastGateChapter(){ return G.gateCh==null?null:G.gateCh; }
    ${block}
    return { STARTER_UNITS, UNIT_BOOK_MAPS, unitStageFormOpen, unitStageFormSet, unitStageEnroll, unitStageStatus, unitStageMoveUp,
      _unitStageRowsHtml, _ustFamilies, get form(){ return unitStageForm; } };`)(G, db);
  const u = api.STARTER_UNITS.math_fluency_path(); G.unitStudies[u.id] = u; api.u = u; api.G = G; return api;
}
function enroll(w, kid, stage, knows, subject, map) {
  w.unitStageFormOpen("math_fluency_path", kid); w.unitStageFormSet("stage", String(stage));
  if (knows) w.unitStageFormSet("knows", knows); if (subject) w.unitStageFormSet("subject", subject); if (map) w.unitStageFormSet("map", map);
  w.unitStageEnroll();
}
const items = (w, k) => w.G.masteryData[k] || [];
const tally = (arr, f) => arr.reduce((m, x) => (m[f(x)] = (m[f(x)] || 0) + 1, m), {});

// ── Taylor ──
{ const w = world(); enroll(w, "taylor", 7, "× ÷ · 12s");
  const it = items(w, "taylor"), t = tally(it, i => i.status + "/" + (i.tier || ""));
  ok("Taylor: 313 cards (0s–12s), all on the ladder", it.length === 313 && it.every(i => i.status === "active"));
  ok("Taylor: 6s–12s weekly (168), 0s–5s every 2 weeks (145)", t["active/weekly"] === 168 && t["active/bi_weekly"] === 145);
  ok("Taylor: 6×7 weekly, 3×4 every 2 weeks", it.find(i => i.prompt === "6×7").tier === "weekly" && it.find(i => i.prompt === "3×4").tier === "bi_weekly");
  ok("Taylor: first reviews spread (weekly 2–8, every-2-weeks 2–15)", it.filter(i => i.tier === "weekly").every(i => i.next_due >= 2 && i.next_due <= 8) && new Set(it.filter(i => i.tier === "bi_weekly").map(i => i.next_due)).size === 14);
  ok("Taylor: every card carries its answer", it.every(i => i.answer === String(eval(i.prompt.replace("×", "*").replace("÷", "/")))));
  ok("Taylor: bank = 313, definitions = 313, quiz mode, no gate", w.G.masteryData.taylor_custom_items.length === 313 && Object.keys(w.G.masteryData.taylor_settings.definitions).length === 313 && w.G.masteryData.taylor_settings.cat_modes["Math Facts"] === "quiz" && !w.G.masteryData.taylor_settings.cat_gate);
  ok("Taylor: ids unique", new Set(it.map(i => i.id)).size === 313);
  const st = w.unitStageStatus(w.u, "taylor");
  ok("Taylor: status = ready, next = Stage 8", st.ready && st.on === 313 && st.next && st.next.n === 8);
  ok("Taylor: kidStage + enrolled written", w.G.writes.some(x => x[1] === "unitStudies/math_fluency_path/kidStage/taylor" && x[2].stage === 7) && w.G.writes.some(x => x[1] === "unitStudies/math_fluency_path/enrolled/taylor" && x[2] === true));
  ok("writes are targeted (index updates / leaf sets only)", w.G.writes.every(x => x[0] === "update" ? /^mastery\/taylor(_custom_items|_settings\/(cat_modes|cat_intro_max|definitions|cat_instructions|cat_instructions_kid))?$/.test(x[1]) : /^(unitStudies\/math_fluency_path\/(kidStage|enrolled)\/taylor|mastery\/taylor_settings\/cat_gate\/Math Facts)$/.test(x[1])));
  ok("items update keyed by new indices 0..312", (() => { const u = w.G.writes.find(x => x[1] === "mastery/taylor"); return u && Object.keys(u[2]).length === 313 && u[2]["0"]; })());
  const h = w._unitStageRowsHtml(w.u, ["taylor"]);
  ok("row: Taylor shows Stage 7 + ready + ➡ Start Stage 8", /Stage 7/.test(h) && /ready to move up/.test(h) && /Start Stage 8: Fractions, decimals &amp; beyond/.test(h));
  w.unitStageMoveUp("math_fluency_path", "taylor");
  ok("Taylor → Stage 8: ½ ¼ ¾ as decimal start", JSON.stringify(items(w, "taylor").filter(i => i.status === "introduction").map(i => i.prompt + "=" + i.answer)) === JSON.stringify(["½ as decimal=0.5", "¼ as decimal=0.25", "¾ as decimal=0.75"])); }
{ const w = world({ mastery: { lincoln: [{ id: "lin_1", subject: "Math Facts", prompt: "⅓ as decimal", status: "introduction", tier: "daily" }, { id: "lin_2", subject: "Math Facts", prompt: "⅔ as decimal", status: "introduction", tier: "daily" }] } });
  enroll(w, "lincoln", 8, "");
  ok("Lincoln (2 live cards) at Stage 8: keeps ⅓ ⅔, adds just 1 more to fill 3", JSON.stringify(items(w, "lincoln").map(i => i.prompt)) === JSON.stringify(["⅓ as decimal", "⅔ as decimal", "½ as decimal"])); }

// ── Kenzie ──
{ const w = world(); enroll(w, "makenzie", 7, "× ÷ · 5s");
  const it = items(w, "makenzie");
  ok("Kenzie: 0s–5s review (145, every 2 weeks)", it.filter(i => i.status === "active").length === 145 && it.filter(i => i.status === "active").every(i => i.tier === "bi_weekly"));
  ok("Kenzie: 3 of the 6s learning (6×1, 6×2, 6×3)", JSON.stringify(it.filter(i => i.status === "introduction").map(i => i.prompt)) === JSON.stringify(["6×1", "6×2", "6×3"]));
  ok("Kenzie: bank holds the whole stage (313) for auto-pull", w.G.masteryData.makenzie_custom_items.length === 313);
  const st = w.unitStageStatus(w.u, "makenzie");
  ok("Kenzie: not ready, learning the 6s", !st.ready && st.learn === 3 && st.fam === "× ÷ · 6s");
  ok("form shows the next family hint", (() => { w.unitStageFormOpen("math_fluency_path", "taylor"); w.unitStageFormSet("stage", "7"); w.unitStageFormSet("knows", "× ÷ · 5s"); return /Starts learning the × ÷ · 6s/.test(w._unitStageRowsHtml(w.u, ["taylor"])); })()); }

// ── Andrew (live-shaped: 0–8 on the ladder, 3 of the 9s learning, all 200 in the bank with ch) ──
function andrewMastery(u) {
  const s6 = u.decks.find(d => d.key === "Math Facts").cards.filter(c => c.stage === 6); const its = []; let n = 0;
  s6.forEach(c => { const f = +/(\d+)/.exec(c.family)[1];
    if (f <= 8) its.push({ id: "and_" + (n++), subject: "Math Facts", prompt: c.name, status: "active", tier: f >= 6 ? "weekly" : "bi_weekly", answer: c.def }); });
  ["1+8", "8+1", "9-8"].forEach(p => its.push({ id: "and_" + (n++), subject: "Math Facts", prompt: p, status: "introduction", tier: "daily" }));
  const bank = s6.map(c => ({ cat: "Math Facts", name: c.name }));
  bank.forEach(be => { if (be.name === "9+1") be.ch = 36; });
  return { andrew: its, andrew_custom_items: bank, andrew_settings: { cat_modes: { "Math Facts": "quiz" }, cat_gate: { "Math Facts": { subject: "arithmetic_2" } }, definitions: {} } };
}
{ const probe = world(); const m = andrewMastery(probe.u);
  const w = world({ mastery: m, curr: { subjects: { andrew: { arithmetic_2: { display: "Arithmetic 2" } } } } });
  enroll(w, "andrew", 6, "+ − · 8 family", "arithmetic_2", "abeka_arith_2");
  ok("Andrew: no new cards (93 stays 93)", items(w, "andrew").length === 93);
  ok("Andrew: no new bank entries (200 stays 200), his ch kept", w.G.masteryData.andrew_custom_items.length === 200 && w.G.masteryData.andrew_custom_items.find(c => c.name === "9+1").ch === 36);
  ok("Andrew: no items/bank write at all", !w.G.writes.some(x => x[1] === "mastery/andrew" || x[1] === "mastery/andrew_custom_items"));
  ok("Andrew: gate stays arithmetic_2", w.G.masteryData.andrew_settings.cat_gate["Math Facts"].subject === "arithmetic_2");
  ok("Andrew: row shows the book link", /Arithmetic 2 · Abeka Arithmetic 2 map/.test(w._unitStageRowsHtml(w.u, ["andrew"]))); }

// ── new kid on the Abeka map: ch on HIS bank, intros held by the book ──
{ const curr = { subjects: { caleb: { arithmetic_2: { display: "Arithmetic 2" } } } };
  const w = world({ curr, gateCh: 35 }); enroll(w, "caleb", 6, "+ − · 9 family", "arithmetic_2", "abeka_arith_2");
  const bank = w.G.masteryData.caleb_custom_items;
  ok("map: 10 family bank cards carry ch 36, 0–9 none", bank.find(c => c.name === "1+9").ch === 36 && bank.find(c => c.name === "10-1").ch === 36 && bank.find(c => c.name === "4+5").ch == null && bank.find(c => c.name === "18-9").ch === 111);
  ok("map: at L35 nothing new starts (10s open at L36)", items(w, "caleb").filter(i => i.status === "introduction").length === 0);
  ok("map: gate written as a leaf", w.G.writes.some(x => x[0] === "set" && x[1] === "mastery/caleb_settings/cat_gate/Math Facts" && x[2].subject === "arithmetic_2"));
  ok("shared unit cards untouched (no ch leaked)", w.u.decks.every(d => d.cards.every(c => c.ch == null)));
  const w2 = world({ curr, gateCh: 36 }); enroll(w2, "caleb", 6, "+ − · 9 family", "arithmetic_2", "abeka_arith_2");
  ok("map: at L36 the 10s start, one fact family at a time", JSON.stringify(items(w2, "caleb").filter(i => i.status === "introduction").map(i => i.prompt)) === JSON.stringify(["1+9", "9+1", "10-9"])); }
{ const w = world(); enroll(w, "caleb", 6, "", "", "");
  ok("no book: starts at 0+0, 0-0, 0+1; no gate", JSON.stringify(items(w, "caleb").map(i => i.prompt)) === JSON.stringify(["0+0", "0-0", "0+1"]) && !w.G.masteryData.caleb_settings.cat_gate); }
{ const w = world({ curr: { subjects: { taylor: { saxon: { display: "Saxon 8/7" } } } } }); enroll(w, "taylor", 7, "× ÷ · 12s", "saxon", "abeka_arith_2");
  ok("a stage-6 map is ignored at stage 7 (no gate, no ch)", !w.G.masteryData.taylor_settings.cat_gate && w.G.masteryData.taylor_custom_items.every(c => c.ch == null)); }

// ── move up ──
{ const probe = world(); const m = andrewMastery(probe.u);
  m.andrew.forEach(i => { i.status = "active"; i.tier = "weekly"; });
  const s6 = probe.u.decks.find(d => d.key === "Math Facts").cards.filter(c => c.stage === 6); let n = 100;
  s6.forEach(c => { if (!m.andrew.some(i => i.prompt === c.name)) m.andrew.push({ id: "and_" + (n++), subject: "Math Facts", prompt: c.name, status: "active", tier: "weekly" }); });
  const w = world({ mastery: m, curr: { subjects: { andrew: { arithmetic_2: { display: "Arithmetic 2" } } } } });
  enroll(w, "andrew", 6, "+ − · 8 family", "arithmetic_2", "abeka_arith_2");
  const st = w.unitStageStatus(w.u, "andrew");
  ok("all 200 on the ladder → ready, next = Stage 7", st.ready && st.next && st.next.n === 7);
  ok("row offers ➡ Start Stage 7", /Start Stage 7: × and ÷ facts/.test(w._unitStageRowsHtml(w.u, ["andrew"])));
  w.G.writes.length = 0; w.unitStageMoveUp("math_fluency_path", "andrew");
  const it = items(w, "andrew");
  ok("move up: 3 of the 0s start learning", JSON.stringify(it.filter(i => i.status === "introduction").map(i => i.prompt)) === JSON.stringify(["0×0", "0×1", "0×2"]));
  ok("move up: + − keep reviewing (200 still active)", it.filter(i => /[+-]/.test(i.prompt) && i.status === "active").length === 200);
  ok("move up: bank 200 → 513", w.G.masteryData.andrew_custom_items.length === 513);
  ok("move up: kidStage = 7 from 6, Abeka map dropped for × ÷", w.u.kidStage.andrew.stage === 7 && w.u.kidStage.andrew.from === 6 && w.u.kidStage.andrew.map === "");
  ok("move up: gate left as it was (not rewritten)", !w.G.writes.some(x => /cat_gate/.test(x[1])));
  ok("move up: items written at indices after his existing ones", (() => { const u = w.G.writes.find(x => x[1] === "mastery/andrew"); return u && Object.keys(u[2]).map(Number).every(k => k >= 200); })()); }

// ── stages 1–4 (Numbers / Counting / Number Sense) ──
{ const w = world(); enroll(w, "caleb", 2, "");
  const it = items(w, "caleb");
  ok("Caleb (K, knows 1–10) at Stage 2: 11, 12, 13 + eleven, twelve, thirteen start", JSON.stringify(it.map(i => i.subject + ":" + i.prompt)) === JSON.stringify(["Numbers:11", "Numbers:12", "Numbers:13", "Counting:eleven", "Counting:twelve", "Counting:thirteen"]));
  ok("Numbers/Counting cards have no back (the kid says it), flash", it.every(i => i.answer === undefined && i.review_mode === "flash"));
  ok("modes written per deck: Numbers + Counting flash", w.G.masteryData.caleb_settings.cat_modes.Numbers === "flash" && w.G.masteryData.caleb_settings.cat_modes.Counting === "flash" && !("Math Facts" in w.G.masteryData.caleb_settings.cat_modes));
  ok("bank = stage 2 only (20)", w.G.masteryData.caleb_custom_items.length === 20); }
function julianMastery() {
  const W = ["one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"]; const its = [];
  for (let n = 1; n <= 16; n++) its.push({ id: "jul_" + n, subject: "Numbers", prompt: String(n), status: n <= 13 ? "active" : "introduction", tier: n <= 13 ? "monthly" : "daily" });
  W.forEach((w, i) => its.push({ id: "jul_" + w, subject: "Counting", prompt: w, status: i < 9 ? "active" : "introduction", tier: i < 9 ? "bi_weekly" : "daily" }));
  return { julian: its, julian_settings: {} };
}
{ const w = world({ mastery: julianMastery() }); enroll(w, "julian", 1, "1–5");
  ok("Julian (live-shaped) at Stage 1: nothing new — his 26 cards stay 26", items(w, "julian").length === 26);
  const st = w.unitStageStatus(w.u, "julian");
  ok("Julian Stage 1: 19 of 20 on the ladder, learning 6–10 (counting ten)", st.on === 19 && st.learn === 1 && st.fam === "6–10" && !st.ready);
  items(w, "julian").find(i => i.prompt === "ten").status = "active";
  ok("…ten learned → ready, next = Stage 2", w.unitStageStatus(w.u, "julian").ready && w.unitStageStatus(w.u, "julian").next.n === 2);
  w.unitStageMoveUp("math_fluency_path", "julian");
  const intro = items(w, "julian").filter(i => i.status === "introduction").map(i => i.subject + ":" + i.prompt);
  ok("move up: his 14–16 keep learning (no extra numerals), eleven–thirteen start counting", JSON.stringify(intro) === JSON.stringify(["Numbers:14", "Numbers:15", "Numbers:16", "Counting:eleven", "Counting:twelve", "Counting:thirteen"]));
  ok("move up: no duplicate Numbers cards", items(w, "julian").filter(i => i.subject === "Numbers").length === 16); }
{ const w = world(); enroll(w, "caleb", 3, "");
  const it = items(w, "caleb");
  ok("Stage 3: Number Sense flip cards with backs", JSON.stringify(it.map(i => i.prompt + "=" + i.answer)) === JSON.stringify(["1 more than 1=2", "1 more than 2=3", "1 more than 3=4"]) && w.G.masteryData.caleb_settings.cat_modes["Number Sense"] === "flip");
  ok("Stage 3 backs go in definitions", w.G.masteryData.caleb_settings.definitions["1 more than 2"] === "3"); }
{ const w = world(); enroll(w, "caleb", 4, "");
  ok("Stage 4 spans two decks: Counting tens + Number Sense", JSON.stringify(items(w, "caleb").map(i => i.subject + ":" + i.prompt)) === JSON.stringify(["Counting:thirty", "Counting:forty", "Counting:fifty", "Number Sense:10 + 1", "Number Sense:10 + 2", "Number Sense:10 + 3"])); }

{ const w = world(); enroll(w, "caleb", 5, "");
  ok("Stage 5: partners start with the five-frame cards", JSON.stringify(items(w, "caleb").map(i => i.prompt + "=" + i.answer)) === JSON.stringify(["1 and ? make 5=4", "2 and ? make 5=3", "3 and ? make 5=2"]));
  ok("Stage 5 → next is Stage 6 (+ and − facts)", w.unitStageStatus(w.u, "caleb").next.n === 6); }

// ── dry run ──
{ const w = world({ dry: true }); enroll(w, "taylor", 7, "× ÷ · 12s");
  ok("dry run: local only, nothing written", w.G.writes.length === 0 && items(w, "taylor").length === 313 && w.u.enrolled.taylor); }

// ── wiring ──
ok("renderUnitDetail uses the staged rows for staged units", /if\(_unitStagedEnrollPending\(u\)\) h\+=_unitStageRowsHtml\(u,roster\);\n\s*else roster\.forEach/.test(src));
console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
