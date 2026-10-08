/*
 * Node tests — 3 small AAS fixes (her yes 2026-10-07):
 *   1 · a ✗ in a check-up counts as a miss day for 🏋️ Word Workout (missed on two days → the workout)
 *   2 · 🚩 Problem Words looks a word up in the SPELLING decks only (a German / vocab card with the same word is skipped)
 *   3 · AAS cards a kid already knows go on the ladder at bi-weekly, never weekly (math units unchanged)
 * Runs the REAL code sliced from index.html.
 *   run:  node test_aas_review_fixes.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const cut = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error("markers " + a); return src.slice(i, j); };
function slice(name) { const i = src.indexOf("function " + name + "("); if (i < 0) throw new Error("missing " + name);
  let d = 0; for (let k = src.indexOf("{", i); k < src.length; k++) { if (src[k] === "{") d++; else if (src[k] === "}") { d--; if (!d) return src.slice(i, k + 1); } } }
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x) : "")); } };

console.log("── 1 · check-up ✗ feeds Word Workout ──");
{
  const engine = cut("// ── MST_ENGINE_START ──", "// ── MST_ENGINE_END ──"), ck = cut("// CHECKUP_START", "// CHECKUP_END"), ww = cut("// WORDWORKOUT_START", "// WORDWORKOUT_END");
  const stubs = `
var masteryData={}, masteryKid=null, unitStudies={}, currData={subjects:{}}, unitStageForm=null;
var MAST_TIER_ORDER=["daily","every_other_day","every_third_day","weekly","bi_weekly","monthly","learned","graduated"];
var MAST_TIER_INT={daily:1,every_other_day:2,every_third_day:3,weekly:7,bi_weekly:14,monthly:28,learned:60,graduated:null};
function mastDrillSettings(){ return {ladder:["every_other_day","weekly","bi_weekly","monthly","graduated"]}; }
function mastIsDue(i,pn){ const iv=MAST_TIER_INT[i.tier||"daily"]; if(iv==null) return false; if(i.next_due!=null&&iv>1) return pn>=i.next_due; return true; }
function mastIsParked(i){ return i&&i.status==="parked"; } function mastIsNeverDrill(){ return false; }
function mastFullBank(kid){ return {}; }
function mastGetPrintNum(){ return 40; } function mstTodayKey(){ return DAYKEY; } var DAYKEY="20261005";
function mastStampNextDue(it,items,tier,pn){ it.next_due=pn+28; }
function mastDefKeyOk(n){ return !/[.#$\\[\\]\\/]/.test(n); }
function momHere(){ return true; } function _dryRun(){ return false; } function renderAll(){}
var WRITES=[]; var db={ref:p=>({update:v=>WRITES.push(["update",p,v]),set:v=>WRITES.push(["set",p,v])})};
var HA_LS={setItem(){},getItem(){return null;},removeItem(){}};
function gwShowToast(){} function _mastRe(){} function cap(s){ return s[0].toUpperCase()+s.slice(1); }
function _ustCards(u,n){ const out=[]; (u.decks||[]).forEach(d=>{ (d.cards||[]).filter(c=>c.stage===n).forEach(c=>out.push(Object.assign({},c,{_dk:d.key}))); }); return out; }
function _ustStageDef(u,n){ return (u.stages||[]).find(s=>s.n===n)||null; }
function _ustDone(id,kid,rec){ unitStudies[id].kidStage=unitStudies[id].kidStage||{}; unitStudies[id].kidStage[kid]=rec; }
var document={getElementById(){return null;}}; function setInterval(){ return 1; } function clearInterval(){}
`;
  const mk = (deckKey, names) => new Function(stubs + engine + ck + ww + `
wwToday=function(){ return DAYKEY; };
return {ckTap,ckStart,unitStageCheckup,ckPlan,ckCards,ckSession,ckState,
  get:()=>({masteryData,WRITES}), set:(k,v)=>{ if(k==="DAYKEY") DAYKEY=v; if(k==="unitStageForm") unitStageForm=v; if(k==="unitStudies") unitStudies=v; if(k==="masteryData") masteryData=v; } };`)();
  const words = ["cat", "dog", "sun", "hat", "pig", "bed"].map((n, i) => ({ family: "Lesson 7", name: n, stage: 1, order: i, lesson: 7 }));
  const R = mk();
  const unit = { id: "all_about_spelling", title: "AAS", stages: [{ n: 1, label: "Level 1" }], decks: [{ key: "AAS Words", mode: "spell", introCap: 3, cards: words }] };
  R.set("unitStudies", { all_about_spelling: unit }); R.set("masteryData", {});
  R.set("unitStageForm", { unitId: "all_about_spelling", kid: "andrew", stage: 1, how: "checkup", perDay: 10, untested: "spot" });
  R.unitStageCheckup();
  const sid = Object.keys(R.get().masteryData.andrew_sessions || {})[0];
  R.ckStart("andrew", sid, 0); R.ckTap("m");
  let items = R.get().masteryData.andrew;
  const missed = items.find(i => i.ckLast && i.ckLast.r === "m");
  ok("a check-up ✗ on a spelling word counts one miss day (ww.m = 1)", missed && missed.ww && missed.ww.m === 1 && !missed.ww.on, missed && missed.ww);
  ok("the ww rides in the same targeted card write", R.get().WRITES.some(w => w[0] === "update" && w[1] === "mastery/andrew" && Object.values(w[2]).some(v => v.ww && v.ww.m === 1)));
  ok("cards a rule filled in (not tapped) get no workout mark", items.filter(i => i !== missed).every(i => !i.ww));
  // the same word missed on a second day (a spelling test / drill sets ww the same way) → into the workout
  R.set("DAYKEY", "20261006");
  // second miss through the real wwNote (the same function the check-up calls)
  const wwOnly = new Function(ww + "\nreturn wwNote;")();
  wwOnly(missed, "miss", "2026-10-06");
  ok("missed on a second day → in Word Workout", missed.ww.on === true && missed.ww.m === 2);
  // a math fact check-up miss never touches Word Workout
  const R2 = mk();
  const facts = [{ family: "× · 7s", name: "7×8", def: "56", stage: 7, order: 0 }, { family: "× · 7s", name: "7×9", def: "63", stage: 7, order: 1 }];
  R2.set("unitStudies", { math_fluency_path: { id: "math_fluency_path", stages: [{ n: 7, label: "×" }], decks: [{ key: "Math Facts", mode: "quiz", introCap: 3, cards: facts }] } });
  R2.set("masteryData", {});
  R2.set("unitStageForm", { unitId: "math_fluency_path", kid: "taylor", stage: 7, how: "checkup", perDay: 10, untested: "spot" });
  R2.unitStageCheckup();
  const sid2 = Object.keys(R2.get().masteryData.taylor_sessions || {})[0];
  R2.ckStart("taylor", sid2, 0); R2.ckTap("m");
  ok("a math fact ✗ gets no Word Workout mark", (R2.get().masteryData.taylor || []).every(i => !i.ww));
}

console.log("\n── 2 · Problem Words: spelling decks only ──");
{
  const CODE = cut("// AAS_START", "// AAS_END") + "\n" + cut("// SPELLTEST_START", "// SPELLTEST_END") + "\n" + cut("// PROBLEMWORDS_START", "// PROBLEMWORDS_END");
  const mastery = { lincoln: [
    { id: "lin_hund", subject: "German", prompt: "Hund", status: "active", tier: "weekly" },
    { id: "lin_been_v", subject: "Word of the Day", prompt: "been", status: "active", tier: "weekly" },
    { id: "lin_keep", subject: "Spelling", prompt: "keep", status: "active", tier: "graduated" },
    { id: "lin_said", subject: "Vocabulary", prompt: "said", status: "active", tier: "weekly" },
    { id: "lin_said2", subject: "AAS Words", prompt: "said", status: "active", tier: "monthly" }] };
  const ctx = { console, JSON, Object, Array, String, Number, Math, Set, Map, RegExp, Date, parseInt, isNaN, Promise, masteryData: mastery, momHere: () => true };
  vm.createContext(ctx); vm.runInContext(CODE, ctx);
  ctx.unitStudies = { all_about_spelling: { id: "all_about_spelling", cardLessons: true, decks: ctx._aasDecks(), kidStage: { lincoln: { stage: 2, subject: "aas" } } } };
  const f = w => ctx.pwLookup("lincoln", w);
  ok("a word only on a German card is NOT 'brought back' from German", f("Hund").kind === "new", f("Hund"));
  ok("'been' (only a Word of the Day card) → found as its AAS card instead", f("been").kind === "aas" && f("been").deck === "AAS Words", f("been"));
  ok("a Spelling-deck card is still brought back", f("keep").kind === "existing" && f("keep").id === "lin_keep");
  ok("vocab + AAS both have 'said' → the AAS card, dupes don't count the vocab one", f("said").kind === "existing" && f("said").id === "lin_said2" && f("said").dupes === 0, f("said"));
}

console.log("\n── 3 · known AAS cards start bi-weekly ──");
{
  const AAS = cut("// AAS_START", "// AAS_END"), UNITS = cut("const STARTER_UNITS={", "\n};") + "\n};", HOWTO = cut("const STARTER_HOWTO={", "\n};") + "\n};";
  const FNS = ["_ustCards", "_ustFamilies", "_ustFamNum", "_ustStageDef", "_ustStagesWithCards", "_ustSlug", "_ustBookCh", "_ustApply", "mastBankEligible", "mastGateChapter"].map(slice).join("\n");
  const mk = () => { const ctx = { console, JSON, Object, Array, String, Number, Math, Set, Map, RegExp, Date, parseInt, isNaN, UNIT_BOOK_MAPS: {}, masteryData: {}, currData: { subjects: { k: { aas: { lessonSeq: ["Lesson 20"] } } }, done: {} },
    mastDefKeyOk: n => !/[.#$\[\]\/]/.test(n), mastFullBank: () => ({}), lidStamped: () => true, lidDoneIdx: () => new Set() };
    vm.createContext(ctx); vm.runInContext(AAS + "\n" + UNITS + "\n" + HOWTO + "\n" + FNS + "\nthis.STARTER_UNITS=STARTER_UNITS;", ctx); return ctx; };
  const c = mk(); const u = c.STARTER_UNITS.all_about_spelling();
  c.masteryData = { k: [], k_custom_items: [], k_settings: {} };
  const w = c._ustApply(u, "k", 1, "Lesson 18", "aas", "");
  const known = Object.values(w.iu).filter(i => i.status === "active");
  ok("knows through Lesson 18 → known phonogram/rule cards are on the ladder", known.length > 20, known.length);
  ok("every known AAS card is bi-weekly (none weekly — lessons 6+ used to be weekly)", known.every(i => i.tier === "bi_weekly"), [...new Set(known.map(i => i.tier))]);
  ok("their first due dates spread over two weeks (2 … 15)", known.every(i => i.next_due >= 2 && i.next_due <= 15) && new Set(known.map(i => i.next_due)).size > 7);
  // a math unit is unchanged: families 6+ still start weekly
  const fams = []; for (let n = 1; n <= 8; n++) fams.push({ family: n + "s", name: "1+" + n, def: String(1 + n), stage: 3, order: n });
  const mu = { id: "m", stages: [{ n: 3, label: "+" }], decks: [{ key: "Math Facts", mode: "quiz", introCap: 3, cards: fams }] };
  c.masteryData = { j: [], j_custom_items: [], j_settings: {} };
  const w2 = c._ustApply(mu, "j", 3, "8s", "", "");
  const its = Object.values(w2.iu);
  ok("math unit: families 6+ still weekly, earlier ones bi-weekly", its.filter(i => /^1\+[678]$/.test(i.prompt)).every(i => i.tier === "weekly") && its.filter(i => /^1\+[1-5]$/.test(i.prompt)).every(i => i.tier === "bi_weekly"));
}
console.log("\n" + pass + " passed, " + fail + " failed"); if (fail) process.exit(1);
