// 🔬 RS4K chapter gate: a deck gated on a curriculum subject only AUTOMATICALLY mints bank cards
// whose `ch` he has reached in the grid. Extracts the REAL helpers + mastApplyScores + mastSeedCat
// + unitEnroll by brace-matching and runs them over fixtures shaped like Lincoln's live data.
// GATE_SRC=<path> runs it against another copy of index.html (used for the dry run).
const fs = require("fs"), path = require("path");
const src = fs.readFileSync(process.env.GATE_SRC || path.join(__dirname, "index.html"), "utf8");
let pass = 0, fail = 0;
function ok(name, cond) { if (cond) { pass++; console.log("  ok  - " + name); } else { fail++; console.log("  FAIL- " + name); } }
function extract(startPat) {
  const i = src.indexOf("\n" + startPat); if (i < 0) throw new Error("not found: " + startPat);
  let depth = 0, inS = null, seen = false, k = i + 1;
  for (; k < src.length; k++) { const c = src[k], p = src[k - 1];
    if (inS) { if (c === inS && p !== "\\") inS = null; continue; }
    if (c === '"' || c === "'" || c === "`") { inS = c; continue; }
    if (c === "/" && src[k + 1] === "/") { k = src.indexOf("\n", k) - 1; continue; }
    if (c === "/" && /[=(,:!&|?{};]\s*$/.test(src.slice(Math.max(0, k - 3), k))) {   // regex literal
      let q = k + 1, cls = false; for (; q < src.length; q++) { const d = src[q];
        if (d === "\\") { q++; continue; } if (d === "[") cls = true; else if (d === "]") cls = false; else if (d === "/" && !cls) break; }
      k = q; continue; }
    if (c === "{" || c === "[" || c === "(") { depth++; seen = true; } else if (c === "}" || c === "]" || c === ")") depth--;
    else if (c === "\n" && depth === 0 && seen) break; }
  return src.slice(i + 1, k + 1);
}
const FNS = ["function mastCustomCh(", "function mastGateChapter(", "function mastBankEligible(", "function mastFullBank(",
  "function mastCustomDef(", "function mastMintFromBank(", "function mastUniqueId(", "function mastSeedCat(",
  "function mastCatFinishedLearning(", "function mastApplyScores(", "function lidStamped(", "function lidDoneSet(",
  "function lidDoneIdx(", "function lidsFor(", "function mastIntroMaxFor(", "function mastIntroDotsFor(",
  "function unitEnroll(", "function mastDefKeyOk("];
const code = FNS.map(extract).join("\n");

// ── fixtures shaped like the live data ──
const CH = { 1: ["technology", "engineering", "odometer", "optics", "cosmology"],
  2: ["distillation", "alembic", "pelican", "condenser", "beaker", "flask", "Erlenmeyer flask", "volumetric flask", "graduated cylinder", "pipet", "pipetman", "balance", "scale", "analytical balance", "gas chromatograph", "mass spectrometer", "infrared spectrometer"],
  3: ["acid", "base", "lye", "electrolyte", "ion", "aqueous", "litmus paper", "lichen", "concentration", "dilute", "pH", "acid-base indicator", "pH meter"],
  4: ["acid-base reaction", "neutralization", "antacid", "assay", "titration", "plot (graph)", "x-axis", "y-axis", "molecular weight", "atomic mass unit (amu)", "mole", "Avogadro's constant", "conversion factor"] };
const TITLES = { 1: "Introduction · Ch 1 Technology in Science (p.1)", 2: "Chemistry · Ch 2 Technology in Chemistry (p.10)",
  3: "Chemistry · Ch 3 Acids, Bases, and pH (p.21)", 4: "Chemistry · Ch 4 Acid-Base Neutralization (p.30)" };
function seqFor(chs, glossary) { const seq = []; chs.forEach(c => { for (let d = 1; d <= 4; d++) seq.push(TITLES[c] + " · day " + d + " of 4"); });
  if (glossary) for (let d = 1; d <= 4; d++) seq.push("Conclusion · Glossary/Index (p.235) · day " + d + " of 4"); return seq; }
const SK = "real_science_4_kids_science_book_6", DECK = "Real Science-4-Kids";

function world(o) {
  o = o || {};
  const seq = o.seq || seqFor([1, 2, 3, 4], true);
  const ids = seq.map((_, i) => "L" + String(24 + i).padStart(4, "0"));
  const bank = [{ cat: "German", name: "der Hund" }, { cat: "German", name: "die Katze" }];
  if (!o.noDeck) [1, 2, 3, 4].forEach(c => CH[c].forEach(n => bank.push(o.noCh ? { cat: DECK, name: n } : { cat: DECK, name: n, ch: c })));
  const settings = { intro_dots: 1, auto_pull: true, ladder: ["every_other_day", "weekly"] };
  if (!o.ungated) settings.cat_gate = { [DECK]: { subject: o.gateSubject || SK } };
  const doneRecs = {}; (o.doneIdx || []).forEach(i => { doneRecs[ids[i]] = { day: "2026-09-16", src: "check" }; });
  const subj = { lessonSeq: seq, lessonIds: ids };
  if (!o.unstamped) subj.doneImportedAt = "2026-09-13T04:25:09.025Z";
  const stubs = `
    let masteryKid="lincoln"; const db=null;
    let masteryData=${JSON.stringify({ lincoln: o.items || [], lincoln_custom_items: bank, lincoln_settings: settings })};
    let currData=${JSON.stringify({ subjects: { lincoln: { [SK]: subj } }, done: { lincoln: { [SK]: doneRecs } } })};
    let unitStudies={};
    const MAST_BANK_MAP={}, MAST_TIER_INT={every_other_day:2,weekly:7}, MAST_ANIMAL_EMOJI={};
    function mastStampNextDue(){} function mastIsParked(){ return false; } function mastGetDef(){ return ""; }
    function mastGetVisual(){ return null; } function mastPutCards(){} function mastDrillSettings(){ return masteryData.lincoln_settings; }
    const HA_LS={setItem(){},getItem(){return null;}}; function cap(s){return s;} function renderUnits(){} function momHere(){ return true; }
    const document={getElementById(){return null;}};
  `;
  return new Function(stubs + code + `; return {mastGateChapter, mastBankEligible, mastFullBank, mastSeedCat, mastCatFinishedLearning,
    mastApplyScores, unitEnroll, md:()=>masteryData, setUnits:(u)=>{unitStudies=u;}, cd:()=>currData};`)();
}
const doneThrough = ch => Array.from({ length: ch * 4 }, (_, i) => i);   // every lesson of chapters 1..ch

console.log("# where is he");
ok("nothing logged → Ch 1 (stamped subject, empty done)", world().mastGateChapter("lincoln", SK) === 1);
ok("Ch 1 finished → Ch 2", world({ doneIdx: doneThrough(1) }).mastGateChapter("lincoln", SK) === 2);
ok("mid-chapter (Ch 2 day 2 done) → still Ch 2", world({ doneIdx: [0, 1, 2, 3, 4, 5] }).mastGateChapter("lincoln", SK) === 2);
ok("out-of-order check (a Ch 3 day ticked, Ch 2 not) → Ch 2 = first NOT done", world({ doneIdx: [0, 1, 2, 3, 8] }).mastGateChapter("lincoln", SK) === 2);
ok("on the Glossary rows → walks back to Ch 4", world({ doneIdx: doneThrough(4) }).mastGateChapter("lincoln", SK) === 4);
ok("whole book done → last chapter", world({ doneIdx: doneThrough(5) }).mastGateChapter("lincoln", SK) === 4);
ok("re-paced subject (2 days/chapter) parses by label, not by 4s",
  world({ seq: [TITLES[1] + " · day 1 of 2", TITLES[1] + " · day 2 of 2", TITLES[2] + " · day 1 of 2", TITLES[2] + " · day 2 of 2"], doneIdx: [0, 1] }).mastGateChapter("lincoln", SK) === 2);
ok("unstamped subject → null", world({ unstamped: true }).mastGateChapter("lincoln", SK) === null);
ok("unknown subject → null", world().mastGateChapter("lincoln", "no_such_subject") === null);
ok("no 'Ch N' anywhere → null", world({ seq: ["Lesson one", "Lesson two"] }).mastGateChapter("lincoln", SK) === null);

console.log("# eligible slice");
const count = w => w.mastBankEligible("lincoln", DECK).length;
ok("released 5 → 22 → 35 → 48 as chapters 1..4 open",
  count(world()) === 5 && count(world({ doneIdx: doneThrough(1) })) === 22 && count(world({ doneIdx: doneThrough(2) })) === 35 && count(world({ doneIdx: doneThrough(3) })) === 48);
ok("keeps BANK ORDER", JSON.stringify(world({ doneIdx: doneThrough(1) }).mastBankEligible("lincoln", DECK)) === JSON.stringify(CH[1].concat(CH[2])));
{ const w = world({ ungated: true }); ok("ungated deck is byte-identical to the full bank", JSON.stringify(w.mastBankEligible("lincoln", DECK)) === JSON.stringify(w.mastFullBank("lincoln")[DECK])); }
{ const w = world(); ok("a different, ungated deck is untouched", JSON.stringify(w.mastBankEligible("lincoln", "German")) === JSON.stringify(["der Hund", "die Katze"])); }
ok("FAIL OPEN: gate points at an unstamped subject → full bank", count(world({ unstamped: true })) === 48);
ok("FAIL OPEN: gate points at a missing subject → full bank", count(world({ gateSubject: "nope" })) === 48);
ok("FAIL OPEN: cards without `ch` are always allowed", count(world({ noCh: true })) === 48);

console.log("# mastSeedCat (Mom's 'start this deck now')");
{ const w = world(); w.md().lincoln_settings.cat_intro_max = { [DECK]: 10 }; const n = w.mastSeedCat(DECK);
  const got = w.md().lincoln.filter(i => i.subject === DECK).map(i => i.prompt);
  ok("intro cap 10 but only Ch 1 open → seeds exactly the 5 Ch 1 words", n === 5 && JSON.stringify(got) === JSON.stringify(CH[1])); }
{ const w = world({ ungated: true }); w.md().lincoln_settings.cat_intro_max = { [DECK]: 10 };
  ok("ungated → seeds 10 as before", w.mastSeedCat(DECK) === 10); }

console.log("# auto-pull through the real mastApplyScores");
function graduateOne(w, prompt) {
  const items = w.md().lincoln, it = items.find(i => i.prompt === prompt);
  const r = w.mastApplyScores(items, [it], { [it.id]: "shown" }, 1, w.md().lincoln_settings, { autoPull: true, chain: false });
  return (r && r.minted || []).map(m => m.prompt);
}
{ // Ch 1 open, all 5 Ch 1 words already minted → a graduation must NOT pull a Ch 2 word
  const w = world(); w.md().lincoln_settings.cat_intro_max = { [DECK]: 5 }; w.mastSeedCat(DECK);
  const minted = graduateOne(w, "technology");
  ok("boundary: graduating a Ch 1 card with Ch 2 still shut mints nothing", minted.length === 0);
  // now he opens Ch 2 — LIVE done data changes, same session
  for (let i = 0; i < 4; i++) w.cd().done.lincoln[SK]["L" + String(24 + i).padStart(4, "0")] = { src: "check" };
  const minted2 = graduateOne(w, "engineering");
  ok("he opens Ch 2 → next graduation pulls the FIRST Ch 2 word", minted2.length === 1 && minted2[0] === "distillation");
}
{ const w = world({ ungated: true }); w.md().lincoln_settings.cat_intro_max = { [DECK]: 5 }; w.mastSeedCat(DECK);
  ok("ungated deck: graduation pulls the next word as before", JSON.stringify(graduateOne(w, "technology")) === JSON.stringify(["distillation"])); }

console.log("# finished-learning stays on the FULL bank");
{ const w = world(); const items = CH[1].map((n, i) => ({ id: "c" + i, subject: DECK, prompt: n, status: "active" }));
  ok("all released cards active but book not done → NOT finished learning", w.mastCatFinishedLearning(items, DECK) === false); }

console.log("# unitEnroll");
function enrollWorld(o) {
  const w = world(Object.assign({ noDeck: true, ungated: true }, o));
  const cards = []; let order = 0; [1, 2, 3, 4].forEach(c => CH[c].forEach(n => cards.push({ name: n, def: "def of " + n, ch: c, order: order++ })));
  const deck = { key: DECK, mode: "flip", introCap: 8, cards };
  if (!(o && o.noGate)) deck.gate = { subject: SK };
  w.setUnits({ rs4k_book6: { id: "rs4k_book6", decks: [deck], enrolled: {} } });
  w.unitEnroll("rs4k_book6", "lincoln");
  return w;
}
{ const w = enrollWorld();
  const bank = w.md().lincoln_custom_items.filter(c => c.cat === DECK);
  ok("all 48 cards land in the BANK with their chapter", bank.length === 48 && bank.every(c => typeof c.ch === "number"));
  ok("the gate setting travels from the unit onto the kid", JSON.stringify(w.md().lincoln_settings.cat_gate) === JSON.stringify({ [DECK]: { subject: SK } }));
  const seeded = w.md().lincoln.filter(i => i.subject === DECK).map(i => i.prompt);
  ok("introCap 8 but only Ch 1 open → enroll seeds just the 5 Ch 1 words", JSON.stringify(seeded) === JSON.stringify(CH[1])); }
{ const w = enrollWorld({ doneIdx: doneThrough(1) });
  ok("enrolling mid-book (Ch 2 open) seeds up to the cap across Ch 1–2", w.md().lincoln.filter(i => i.subject === DECK).length === 8); }
{ const w = enrollWorld({ noGate: true });
  ok("a unit deck with no gate enrolls exactly as before (cap 8, no cat_gate)", w.md().lincoln.filter(i => i.subject === DECK).length === 8 && !w.md().lincoln_settings.cat_gate); }

console.log("# source guards");
ok("mastPullItem (Mom's explicit tap) is NOT gated", !/mastBankEligible/.test(extract("function mastPullItem(")));
ok("ladder helpers untouched: no gate reference in mastStampNextDue / pass 2",
  !/mastBankEligible|cat_gate/.test(src.slice(src.indexOf("// Pass 2 — ladder scoring"), src.indexOf("// Pass 2 — ladder scoring") + 4000)));

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
