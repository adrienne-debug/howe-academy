// 🩺 CHECKUP — Mom-graded check-up study session (her design 2026-10-04, Taylor's × ÷ facts).
// Slices the CHECKUP block AND the study-engine block out of index.html and runs them with stubs.
const fs = require("fs"), path = require("path");
const SRC = process.env.CK_SRC || path.join(__dirname, "index.html");
const src = fs.readFileSync(SRC, "utf8");
function slice(a, b) { const i = src.indexOf(a), j = src.indexOf(b); if (i < 0 || j < 0) throw new Error("markers " + a); return src.slice(i, j); }
const engine = slice("// ── MST_ENGINE_START ──", "// ── MST_ENGINE_END ──");
const ck = slice("// CHECKUP_START", "// CHECKUP_END");

let pass = 0, fail = 0;
function ok(c, m) { if (c) pass++; else { fail++; console.log("FAIL " + m); } }

const stubs = `
var masteryData={}, masteryKid=null, unitStudies={}, currData={subjects:{}}, unitStageForm=null;
var MAST_TIER_ORDER=["daily","every_other_day","every_third_day","weekly","bi_weekly","monthly","learned","graduated"];
var MAST_TIER_INT={daily:1,every_other_day:2,every_third_day:3,weekly:7,bi_weekly:14,monthly:28,learned:60,graduated:null};
function mastDrillSettings(){ return {ladder:["every_other_day","weekly","bi_weekly","monthly","graduated"]}; }
function mastIsDue(i,pn){ const iv=MAST_TIER_INT[i.tier||"daily"]; if(iv==null) return false; if(i.next_due!=null&&iv>1) return pn>=i.next_due; return true; }
function mastIsParked(i){ return i&&i.status==="parked"; } function mastIsNeverDrill(){ return false; }
function mastFullBank(kid){ const out={}; (Object.values(masteryData[kid+"_custom_items"]||{})).forEach(c=>{ if(c){ (out[c.cat]=out[c.cat]||[]).push(c.name);} }); return out; }
function mastGetPrintNum(){ return 40; } function mstTodayKey(){ return DAYKEY; } var DAYKEY="20261005";
function mastStampNextDue(it,items,tier,pn){ it.next_due=pn+28; }
function mastDefKeyOk(n){ return !/[.#$\\[\\]\\/]/.test(n); }
var MOM=true; var adminPinUnlocked=false; function momHere(){ return MOM||adminPinUnlocked; } function _dryRun(){ return false; }
var PINGATE=[]; var RENDERS=0; function renderAll(){ RENDERS++; }
function kitPinGate(then,why){ if(momHere()){ then(); return; } PINGATE.push(why); adminPinUnlocked=true; then(); }   // a correct PIN, instantly
var WRITES=[]; var db={ref:p=>({update:v=>WRITES.push(["update",p,v]),set:v=>WRITES.push(["set",p,v])})};
var HA_LS={setItem(){},getItem(){return null;},removeItem(){}};
var TOASTS=[]; function gwShowToast(t){ TOASTS.push(t); } function _mastRe(){}
function cap(s){ return s[0].toUpperCase()+s.slice(1); }
function _ustCards(u,n){ const out=[]; (u.decks||[]).forEach(d=>{ (d.cards||[]).filter(c=>c.stage===n).forEach(c=>out.push(Object.assign({},c,{_dk:d.key}))); }); return out; }
function _ustStageDef(u,n){ return (u.stages||[]).find(s=>s.n===n)||null; }
function _ustDone(id,kid,rec){ unitStudies[id].kidStage=unitStudies[id].kidStage||{}; unitStudies[id].kidStage[kid]=rec; }
var document={getElementById(){return null;}}; function setInterval(){ return 1; } function clearInterval(){}
`;
// Build the real stage-7 shape: families 0s..12s, N×1..12 then (N·k)÷N
function stage7() {
  const cards = []; let o = 0;
  for (let n = 0; n <= 12; n++) {
    const fam = "× ÷ · " + n + "s";
    for (let k = 1; k <= 12; k++) cards.push({ family: fam, name: n + "×" + k, def: String(n * k), stage: 7, order: o++ });
    if (n > 0) for (let k = 1; k <= 12; k++) cards.push({ family: fam, name: (n * k) + "÷" + n, def: String(k), stage: 7, order: o++ });
  }
  return cards;
}
const run = new Function(stubs + engine + ck + `
return {ckSlug,ckFactors,ckHard,ckQuickPicks,ckFamilies,ckPlan,ckTodayLeft,ckGrade,ckResultTier,ckCardLine,ckRenderHtml,ckTap,ckStart,ckFlip,ckStop,ckMomStart,unitStageCheckup,
  mstSessions,mstOwns,mstOwnedIds,mstPile,
  get:()=>({masteryData,WRITES,TOASTS,unitStudies,adminPinUnlocked,PINGATE,RENDERS}), set:(k,v)=>{ if(k==="MOM") MOM=v; if(k==="DAYKEY") DAYKEY=v; if(k==="unitStageForm") unitStageForm=v; if(k==="unitStudies") unitStudies=v; if(k==="masteryData") masteryData=v; },
  clearWrites:()=>{ WRITES.length=0; TOASTS.length=0; } };`)();

// ── factors + hardness ────────────────────────────────────────────
ok(JSON.stringify(run.ckFactors("7×8")) === '{"op":"x","a":7,"b":8}', "× factors");
ok(JSON.stringify(run.ckFactors("56÷7")) === '{"op":"d","a":8,"b":7}', "÷ factors = quotient, divisor");
ok(run.ckFactors("cat") === null, "a word has no factors");
ok(run.ckHard("7×8") > run.ckHard("7×2") && run.ckHard("7×2") > run.ckHard("7×1"), "7×8 harder than 7×2 harder than 7×1");
ok(run.ckHard("12×12") > run.ckHard("12×10"), "12×12 harder than 12×10");

// ── quick picks ─────────────────────────────────────────────────
const C7 = stage7();
const sevens = C7.filter(c => c.family === "× ÷ · 7s");
const qp = run.ckQuickPicks(sevens, 5).map(c => c.name);
ok(qp.length === 5, "5 picks");
ok(qp.filter(n => n.includes("÷")).length === 2, "2 division picks: " + qp);
ok(qp.includes("7×12") && qp.includes("7×9") && qp.includes("7×8"), "hardest × first: " + qp);
ok(qp.includes("84÷7") && qp.includes("63÷7"), "hardest ÷ (12, 9) first: " + qp);
const zeros = C7.filter(c => c.family === "× ÷ · 0s");
ok(run.ckQuickPicks(zeros, 5).length === 5 && run.ckQuickPicks(zeros, 5).every(c => c.name.includes("×")), "0s family (no ÷) still gives 5 × picks");
const words = [{ name: "cat", order: 1 }, { name: "dog", order: 2 }, { name: "sun", order: 3 }];
ok(run.ckQuickPicks(words, 2).map(c => c.name).join() === "cat,dog", "words: first q in order");

// ── plan / grade ────────────────────────────────────────────────
const S = { sid: "checkup_x", kind: "checkup", perDay: 10, quick: 5, untested: "spot" };
let st = { f: {}, day: {} };
let p = run.ckPlan(C7, S, st);
ok(run.ckFamilies(C7).length === 13, "13 families");
ok(p.queue.length === 13 * 5 - 0 && p.checked === 0, "fresh plan = 5 per family (65): " + p.queue.length);
ok(p.queue[0].fam === "× ÷ · 0s", "starts with the 0s");
// pass the 7s quick check
let out;
const q7 = run.ckQuickPicks(sevens, 5);
q7.forEach(c => { out = run.ckGrade(st, S, C7, c, "c", "20261005", 1.2); });
ok(st.f[run.ckSlug("× ÷ · 7s")].m === "pass", "7s passed after 5 ✓");
ok(out.length === 1 + 19 && out.slice(1).every(o => o.res === "spot"), "passing tap returns the 19 unasked cards as spot (monthly once): " + out.length);
ok(st.day["20261005"] === 5, "day count 5");
p = run.ckPlan(C7, S, st);
ok(p.checked === 1 && p.queue.every(x => x.fam !== "× ÷ · 7s"), "7s no longer queued");
// a miss in the 8s → whole family
const eights = C7.filter(c => c.family === "× ÷ · 8s");
const q8 = run.ckQuickPicks(eights, 5);
out = run.ckGrade(st, S, C7, q8[0], "m", "20261005");
ok(st.f[run.ckSlug("× ÷ · 8s")].m === "full", "a miss turns the quick check into the full family");
p = run.ckPlan(C7, S, st);
ok(p.queue.filter(x => x.fam === "× ÷ · 8s").length === 23, "rest of the 8s queued (23): " + p.queue.filter(x => x.fam === "× ÷ · 8s").length);
ok(p.practice === 1, "1 in practice");
eights.forEach(c => { if (!st.f[run.ckSlug("× ÷ · 8s")].a[run.ckSlug(c.name)]) out = run.ckGrade(st, S, C7, c, "s", "20261006"); });
ok(st.f[run.ckSlug("× ÷ · 8s")].m === "done" && out.length === 1, "full family checked → done, no untested leftovers");
// 〰 alone does not fail a quick check
const nines = C7.filter(c => c.family === "× ÷ · 9s");
run.ckQuickPicks(nines, 5).forEach((c, i) => run.ckGrade(st, S, C7, c, i === 0 ? "s" : "c", "20261006"));
ok(st.f[run.ckSlug("× ÷ · 9s")].m === "pass", "〰 alone keeps the quick check (slow fact goes monthly)");
// untested rules
const Sk = Object.assign({}, S, { untested: "known" }); let st2 = { f: {}, day: {} };
run.ckQuickPicks(sevens, 5).forEach(c => { out = run.ckGrade(st2, Sk, C7, c, "c", "d"); });
ok(out.slice(1).every(o => o.res === "k"), "untested=known → graduated");
const Sa = Object.assign({}, S, { untested: "all" }); const st3 = { f: {}, day: {} };
p = run.ckPlan(C7, Sa, st3);
ok(p.queue.length === C7.length, "untested=all → every card asked (" + C7.length + ")");
// tiers
ok(run.ckResultTier("c").tier === "graduated" && run.ckResultTier("k").tier === "graduated", "✓/known → graduated");
ok(run.ckResultTier("s").tier === "monthly" && run.ckResultTier("spot").tier === "monthly", "〰/spot → monthly");
ok(run.ckResultTier("m").status === "introduction", "✗ → learning");
// daily size
ok(run.ckTodayLeft(S, { day: { "20261005": 7 } }, "20261005", 0) === 3, "3 left of 10");
ok(run.ckTodayLeft(S, { day: { "20261005": 10 } }, "20261005", 5) === 5, "keep going +5");

// ── app side: start from Units, card line, taps, writes ─────────
const unit = { id: "math_fluency_path", title: "Math Fluency Path", stages: [{ n: 7, label: "× and ÷ facts" }], decks: [{ key: "Math Facts", mode: "quiz", introCap: 3, cards: C7 }] };
run.set("unitStudies", { math_fluency_path: unit });
run.set("masteryData", {});
run.set("unitStageForm", { unitId: "math_fluency_path", kid: "taylor", stage: 7, how: "checkup", perDay: 10, untested: "spot" });
run.clearWrites();
run.unitStageCheckup();
let G = run.get();
const sid = "checkup_math_fluency_path_7";
ok(G.masteryData.taylor_sessions && G.masteryData.taylor_sessions[sid].kind === "checkup", "session record created");
ok(G.WRITES.some(w => w[1] === "mastery/taylor_sessions/" + sid && w[0] === "set"), "session written (targeted)");
ok(G.WRITES.some(w => w[1] === "unitStudies/math_fluency_path/kidStage/taylor" && w[2].checkup === sid), "kidStage records the check-up");
ok(!G.WRITES.some(w => w[1] === "mastery/taylor"), "no cards minted at start");
ok(G.unitStudies.math_fluency_path.kidStage.taylor.stage === 7, "kid on stage 7");
const sess = run.mstSessions("taylor").find(s => s.sid === sid);
ok(sess && sess.unit === "math_fluency_path" && sess.stage === 7 && sess.perDay === 10, "mstSessions carries unit/stage/perDay");
ok(run.mstPile("taylor", sid, 40, null).reviews.length === 0, "mstPile: a check-up has no pile");
ok(run.ckCardLine("taylor", sid) === "\u{1FA7A} 10 to check today", "card line: 10 to check today → " + run.ckCardLine("taylor", sid));
// kid view is closed
run.set("MOM", false);
ok(/check-up with Mom/.test(run.ckRenderHtml("taylor", sess)), "kid sees 'check-up with Mom', never the facts");
run.set("MOM", true);
ok(/Start · 10 today/.test(run.ckRenderHtml("taylor", sess)), "Mom sees Start · 10 today");
run.ckStart("taylor", sid, 0);
ok(/0 × 12|0 × 1/.test(run.ckRenderHtml("taylor", sess)) || /×/.test(run.ckRenderHtml("taylor", sess)), "running shows a fact");
ok(!/= 0</.test(run.ckRenderHtml("taylor", sess)) && /tap the fact to check the answer/.test(run.ckRenderHtml("taylor", sess)), "answer hidden until the flip");
run.ckFlip(); ok(/= 0</.test(run.ckRenderHtml("taylor", sess)), "flip shows the answer");
run.ckFlip(); ok(!/= 0</.test(run.ckRenderHtml("taylor", sess)), "flip again hides it");
run.ckFlip();
run.clearWrites();
run.ckTap("m");   // first 0s fact missed
ok(!/= \d+</.test(run.ckRenderHtml("taylor", sess)), "next fact starts hidden again");
G = run.get();
let items = G.masteryData.taylor;
ok(Array.isArray(items) && items.length === 1 && items[0].status === "introduction" && items[0].tier === "daily", "✗ → card minted in learning");
ok(items[0].subject === "Math Facts" && items[0].answer != null, "card has deck + answer");
ok(G.WRITES.some(w => w[1] === "mastery/taylor" && w[0] === "update" && w[2]["0"]), "card written by index (update)");
ok(G.WRITES.some(w => w[1].indexOf("mastery/taylor_checkup/" + sid + "/f/") === 0), "family state written");
ok(G.WRITES.some(w => w[1] === "mastery/taylor_checkup/" + sid + "/day/20261005" && w[2] === 1), "day count written");
ok(G.WRITES.some(w => w[1] === "mastery/taylor_custom_items"), "bank entry written");
ok(G.TOASTS.some(t => /checking the rest/.test(t)), "toast: checking the rest of this family");
ok(!run.mstOwnedIds("taylor").size, "the check-up owns no cards");
// grade through the rest of today's 10 with ✓
for (let i = 0; i < 9; i++) run.ckTap("c");
G = run.get();
ok(G.masteryData.taylor_checkup[sid].day["20261005"] === 10, "10 done today");
ok(run.ckCardLine("taylor", sid) === "\u{1FA7A} ✓ done today", "card line after 10: done today");
ok(/Keep going/.test(run.ckRenderHtml("taylor", sess)), "Keep going offered");
ok(G.masteryData.taylor.filter(i => i.tier === "graduated").length >= 9, "✓ cards graduated");
// next day resumes, never re-asks
run.set("DAYKEY", "20261006");
ok(run.ckCardLine("taylor", sid) === "\u{1FA7A} 10 to check today", "next day: 10 again");
const askedBefore = Object.keys(G.masteryData.taylor_checkup[sid].f).reduce((n, k) => n + Object.keys(G.masteryData.taylor_checkup[sid].f[k].a).length, 0);
run.ckStart("taylor", sid, 0); run.ckTap("c");
G = run.get();
const askedAfter = Object.keys(G.masteryData.taylor_checkup[sid].f).reduce((n, k) => n + Object.keys(G.masteryData.taylor_checkup[sid].f[k].a).length, 0);
ok(askedAfter === askedBefore + 1, "resume: one more asked, nothing re-asked");
// a passed family's untested cards land monthly with next_due
run.set("masteryData", {}); run.set("unitStageForm", { unitId: "math_fluency_path", kid: "kid2", stage: 7, how: "checkup", perDay: 100, untested: "spot" });
run.unitStudies; run.get().unitStudies.math_fluency_path.enrolled = {};
run.unitStageCheckup();
const s2 = run.mstSessions("kid2")[0];
run.ckStart("kid2", s2.sid, 0); for (let i = 0; i < 5; i++) run.ckTap("c");   // the 0s quick check passes
G = run.get();
const z = G.masteryData.kid2;
ok(z.length === 12, "0s: 5 asked + 7 untested minted (12 cards): " + z.length);
ok(z.filter(i => i.tier === "monthly" && i.next_due === 68).length === 7, "7 untested → monthly with next_due");
ok(G.TOASTS.some(t => /passed/.test(t)), "toast: passed");

// ── 🔒 Mom's code on the kid's screen (her ask 2026-10-05) ───────
run.ckStop(); run.set("MOM", false);
ok(/ckMomStart\('taylor','checkup_math_fluency_path_7'\)/.test(run.ckRenderHtml("taylor", sess)) && /Mom: start the check-up/.test(run.ckRenderHtml("taylor", sess)), "kid view has a Start button for Mom");
ok(!/×/.test(run.ckRenderHtml("taylor", sess).replace(/× and ÷ facts/g, "")), "…and still no facts on it");
run.ckMomStart("taylor", sid);
ok(run.get().PINGATE.length === 1 && /code/.test(run.get().PINGATE[0]), "the button asks for Mom's code");
ok(run.get().adminPinUnlocked === true && /✓ Got it/.test(run.ckRenderHtml("taylor", sess)), "a correct PIN starts the sitting on this screen");
const rBefore = run.get().RENDERS;
run.ckStop();
ok(run.get().adminPinUnlocked === false && run.get().RENDERS === rBefore + 1, "Stop for today locks the screen again (and redraws)");
ok(/Mom: start the check-up/.test(run.ckRenderHtml("taylor", sess)), "…kid view is back to the Start button");
run.set("MOM", true); run.ckMomStart("taylor", sid);
ok(run.get().PINGATE.length === 1, "Mom's own view: no PIN asked");
run.ckStop();
ok(run.get().RENDERS === rBefore + 1, "…and Stop does not touch the lock when Mom was already here");
run.set("MOM", false);
console.log(pass + " passed, " + fail + " failed");
if (fail) process.exit(1);
