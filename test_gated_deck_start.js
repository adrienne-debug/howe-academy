// 📘 GATESTART: a book-gated deck with no learning cards starts itself on the next drill save.
// Live case (audit 2026-10-23): Ellis's First Language Lessons 4 deck, gated on his book, 5 words
// released, 0 started since 9/19 — auto-pull only fires on a graduation IN that deck, and it had none.
// Extracts the REAL mastGateStart + mastBankEligible + mastMintFromBank + mstSessions and runs them
// over Ellis-shaped fixtures; then checks the call sits inside mastSaveResults on the same save path.
const fs = require("fs"), path = require("path");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
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
const a = src.indexOf("// GATESTART_START"), b = src.indexOf("// GATESTART_END");
ok("GATESTART block present", a > 0 && b > a);
const code = [src.slice(a, b), extract("function mastBankEligible("), extract("function mastMintFromBank("),
  extract("function mastUniqueId("), extract("function mastIntroMaxFor("), extract("function mstSessions(")].join("\n");

const FLL = "First Language Lessons 4", LOE = "Logic of English", SK = "first_language_lessons_4";
const FLL_WORDS = ["noun", "pronoun", "verb", "adjective", "adverb", "preposition", "conjunction"];   // ch 1..7
function run(o) {
  o = o || {};
  const bank = FLL_WORDS.map((n, i) => ({ cat: FLL, name: n, ch: i + 1 }))
    .concat(["a", "c", "d", "e", "f"].map(n => ({ cat: LOE, name: n })));
  const settings = { auto_pull: true, max_intro_per_cat: o.cap || 3, ladder: ["every_other_day", "weekly"] };
  if (!o.ungated) settings.cat_gate = { [FLL]: { subject: SK } };
  if (o.held) settings.cat_hold = { [FLL]: true };
  const md = { ellis: o.items || [], ellis_custom_items: bank, ellis_settings: settings };
  if (o.sessions) md.ellis_sessions = o.sessions;
  const fn = new Function(`
    let masteryKid="ellis";
    let masteryData=${JSON.stringify(md)};
    const MST_SESSION_DEFAULTS={who:"kid",newPerDay:3,passes:1,mixInAt:"weekly",handOffAt:"monthly",kind:"deck",audio:false,order:"in",maxCards:0,mixFinish:0,focusDecks:0};
    const MAST_ANIMAL_EMOJI={};
    function mstPatternClean(p){ return p||null; }
    function mastFullBank(kid){ const out={}; masteryData[kid+"_custom_items"].forEach(c=>{ (out[c.cat]=out[c.cat]||[]).push(c.name); }); return out; }
    function mastGateChapter(){ return ${o.chapter == null ? 5 : o.chapter}; }   // his book is at Lesson ${o.chapter == null ? 5 : o.chapter}
    function mastCustomDef(){ return ""; } function mastGetDef(){ return ""; } function mastGetVisual(){ return null; }
    ${code}
    const items=masteryData.ellis, minted=[];
    const _jset=masteryData.ellis_settings;
    // the exact call line from mastSaveResults
    if(_jset.auto_pull${o.autoPullOff ? "&&false" : ""}){ try{ mastGateStart(masteryKid,items,minted,_jset); }catch(e){} }
    return {items,minted};`);
  return fn();
}
const card = (subject, prompt, status) => ({ id: "ell_" + prompt, subject, prompt, status, tier: status === "active" ? "weekly" : "daily" });

// 1 · Ellis-shaped: gated, 5 released (Lesson 5), 0 items → mints up to the cap, in bank order
let r = run();
ok("Ellis FLL: mints up to the learning cap (3)", r.minted.length === 3);
ok("…in bank order", r.minted.map(i => i.prompt).join() === "noun,pronoun,verb");
ok("…as learning cards", r.minted.every(i => i.status === "introduction" && i.subject === FLL && i.tally_dots === 0));
ok("…pushed onto items too", r.items.length === 3);
ok("LOE (ungated) untouched", !r.items.some(i => i.subject === LOE));
r = run({ cap: 10 });
ok("cap above released → only the 5 released words", r.minted.length === 5 && !r.minted.some(i => i.prompt === "preposition"));

// 2 · a deck with a learning card → no extra mint
r = run({ items: [card(FLL, "noun", "introduction")] });
ok("deck with a learning card → nothing minted", r.minted.length === 0);
r = run({ items: [card(FLL, "noun", "parked")] });
ok("deck with a parked card → nothing minted", r.minted.length === 0);
// …but active-only (all graduated) with released words left still starts again, skipping existing cards
r = run({ items: [card(FLL, "noun", "active")] });
ok("active-only deck: mints new names only", r.minted.length === 3 && !r.minted.some(i => i.prompt === "noun"));

// 3 · ungated deck with 0 learning → untouched
r = run({ ungated: true });
ok("ungated decks (FLL ungated, LOE) → nothing minted", r.minted.length === 0);

// 4 · held deck → untouched
r = run({ held: true });
ok("held deck → nothing minted", r.minted.length === 0);

// 5 · a deck in a study session → untouched (named session, and the Daily Study catch-all)
r = run({ sessions: { s1: { name: "Grammar", kind: "deck", decks: [FLL] } } });
ok("deck owned by a named study session → nothing minted", r.minted.length === 0);
r = run({ sessions: { s1: { name: "Daily Study", kind: "all" } } });
ok("deck owned by the Daily Study catch-all → nothing minted", r.minted.length === 0);
r = run({ sessions: { s1: { name: "Daily Study", kind: "all", skipDecks: [FLL] } } });
ok("deck kept with Mom (skipDecks) → starts", r.minted.length === 3);
r = run({ sessions: { s1: { name: "Other", kind: "deck", decks: ["German"] } } });
ok("session owning other decks → FLL still starts", r.minted.length === 3);

// 6 · nothing eligible (gate closed) → untouched
r = run({ chapter: 0 });
ok("gate closed (nothing released) → nothing minted", r.minted.length === 0);
r = run({ items: FLL_WORDS.slice(0, 5).map(n => card(FLL, n, "active")) });
ok("every released word already a card → nothing minted", r.minted.length === 0);

// 7 · auto_pull off → untouched
r = run({ autoPullOff: true });
ok("auto_pull off → nothing minted", r.minted.length === 0);

// 8 · the call rides mastSaveResults' one save: after the engine, before the targeted update
const sv = extract("function mastSaveResults(");
const iApplied = sv.indexOf("minted=_applied.minted"), iCall = sv.indexOf("mastGateStart(masteryKid,items,minted,_jset)"),
  iWrite = sv.indexOf("minted.forEach(it=>{ const ix=items.indexOf(it); if(ix>=0) upd[ix]=it; })"),
  iUpd = sv.indexOf('db.ref("mastery/"+masteryKid).update(upd)');
ok("called once from mastSaveResults", iCall > 0 && sv.indexOf("mastGateStart(", iCall + 1) < 0);
ok("…after the engine's auto-pull, before minted cards are written", iApplied > 0 && iCall > iApplied && iWrite > iCall && iUpd > iWrite);
ok("…under the auto_pull guard", /if\(_jset\.auto_pull\)\{ try\{ mastGateStart\(/.test(sv));
ok("study sessions' engine path does not call it", extract("function mastApplyScores(").indexOf("mastGateStart") < 0);
ok("called nowhere else (but a paper drill graded later, which saves exactly like an app drill)", src.split("mastGateStart(").length === 4
  && /if\(_jset\.auto_pull\)\{ try\{ mastGateStart\(kid,items,ap\.minted,_jset\); \}/.test(extract("function pdSave(")));   // definition + the drill's call + 🖨 PDGRADE (2026-10-28)

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
