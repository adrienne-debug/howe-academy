/*
 * Node tests — GRADKEEP: a ✓ never moves a card down (DESIGN_aas_lesson_spelling_test_2026-10-24.md §3.4; units switch-over
 * step 14, the gate for step 15; her go-ahead 2026-10-26). GRADKEEP_START…END inside the SPELLTEST block.
 *   · gkTier, the whole §3.4 table: no card / held / parked · graduated · on the ladder · learning × ✓ 〰 ✗ (and the check-up's
 *     k / spot / p codes); 〰 on a new word = one rung below testRight on THIS kid's ladder (monthly → bi_weekly; graduated → monthly)
 *   · stApplyResults: a graduated word's ✓ stays graduated (stLast stamped, no due day); a ladder word's ✓/〰 keeps rung AND due
 *     day; ✗ anywhere → learning (+ 🔁 came back for a graduated word); learning stays learning; the record saves `was`
 *   · re-grade: the first grade's ✗ put a ladder word in learning; grading it ✓ again (from `was`) puts it back on its rung
 *   · stSave / stNoTime carry `was` on the record; the record write is the same single set as before
 *   · ckTap (spelling deck only): c / k / spot on a graduated card keeps it graduated; on a ladder card leaves it alone;
 *     a new word takes testRight / one below; a math check-up is untouched (ckResultTier as before)
 *   run: node test_gradkeep.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const cut = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error("markers " + a); return src.slice(i, j); };
function slice(name) { const i = src.indexOf("function " + name + "("); if (i < 0) throw new Error("missing " + name); let d = 0; for (let k = src.indexOf("{", i); k < src.length; k++) { if (src[k] === "{") d++; else if (src[k] === "}") { d--; if (!d) return src.slice(i, k + 1); } } }
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x).slice(0, 500) : "")); } };

console.log("── the block ──");
const gk = cut("// GRADKEEP_START", "// GRADKEEP_END"), st = cut("// SPELLTEST_START", "// SPELLTEST_END"), ck = cut("// CHECKUP_START", "// CHECKUP_END");
ok("GRADKEEP sits inside the SPELLTEST block, once; no write of its own", src.split("// GRADKEEP_START").length === 2 && st.indexOf("// GRADKEEP_START") > 0 && !/db\.ref/.test(gk));
ok("stApplyResults takes `was`, reads gkBefore/gkTier, keeps a card whose place is unchanged (not even the due day moves), returns was", /function stApplyResults\(kid,words,res,key,was\)/.test(st) && /const before=\(was&&was\[i\]&&was\[i\]\.st\)\?was\[i\]:gkBefore\(idx>=0\?items\[idx\]:null\); wasOut\[i\]=before;/.test(st) && /if\(tt&&!\(it\.status===tt\.status&&it\.tier===tt\.tier\)\)/.test(st) && /return \{iu,bu,was:wasOut\};/.test(st));
ok("stSave and stNoTime pass the record's `was` in and save it back", (st.match(/out=stApplyResults\(S\.kid,S\.words\.map\(w=>w\.name\),res,S\.key,prev\.was\|\|null\)/g) || []).length === 2 && (st.match(/if\(out&&out\.was\) rec\.was=out\.was;/g) || []).length === 2);
ok("ckTap: the spelling deck goes through gkTier (by typeof), math decks keep ckResultTier; an unchanged card is left alone", /spellDeck&&typeof gkTier==="function"\)\?gkTier\(kid,gkBefore\(idx0>=0\?items\[idx0\]:null\),o\.res\)/.test(ck) && /ckResultTier\(o\.res\)\)/.test(ck) && /if\(tt&&!\(item\.status===tt\.status&&item\.tier===tt\.tier\)\)/.test(ck));

// ── a spelling-test world (the real AAS data + SPELLTEST block, as test_spell_test.js builds it) ──
const CODE = cut("// AAS_START", "// AAS_END") + "\n" + slice("ckResultTier") + "\n" + slice("_unitKidLadderCfg") + "\n" + st;
function world(o) {
  o = o || {};
  const writes = [], toasts = [], els = {}, cb = [];
  const document = { body: { appendChild: e => { els[e.id] = e; } }, getElementById: id => els[id] || null, createElement: () => ({ style: {}, remove() { delete els[this.id]; } }) };
  const ctx = { console, JSON, Object, Array, String, Number, Math, Set, Map, RegExp, Date, parseInt, isNaN, document,
    momHere: () => o.mom !== false, _dryRun: () => false, ROSTER: new Set(["andrew"]),
    masteryData: o.mastery || { andrew: [], andrew_custom_items: [], andrew_settings: {} },
    db: { ref: p => ({ set: v => writes.push(["set", p, v]), update: v => writes.push(["update", p, v]) }) },
    HA_LS: { setItem: () => {} }, gwShowToast: m => toasts.push(m), renderAll: () => {}, renderUnits: () => {},
    mastGetPrintNum: () => 7, mastStampNextDue: (it) => { it.next_due = 99; }, cbLog: (kid, e) => cb.push(e), wwNote: () => {},
    DAY_DT: {}, weekData: { tasks: [] } };
  vm.createContext(ctx); vm.runInContext(CODE + "\nthis.AAS_DATA=AAS_DATA; Object.defineProperty(this,\"stUI\",{get:()=>stUI,set:v=>{stUI=v;}});", ctx);
  const decks = ctx._aasDecks();
  ctx.unitStudies = { all_about_spelling: { id: "all_about_spelling", cardLessons: true, decks, kidStage: { andrew: Object.assign({ stage: 1, subject: "all_about_spelling_1" }, o.ks || {}) } } };
  return { ctx, writes, toasts, cb, run: e => vm.runInContext(e, ctx) };
}
const card = (name, status, tier, extra) => Object.assign({ id: "and_" + name, subject: "AAS Words", prompt: name, answer: name, status, tier, tally_dots: 5, next_due: 42, placed: true }, extra || {});

console.log("\n── gkTier: the §3.4 table ──");
{
  const w = world(), c = w.ctx, T = (b, r) => c.gkTier("andrew", b, r);
  const BANK = { st: "bank" }, PARK = { st: "parked" }, GRAD = { st: "graduated", t: "graduated" }, LAD = { st: "ladder", t: "weekly" }, LRN = { st: "learning", t: "daily" };
  ok("new word (no card): ✓ → testRight (monthly by default); 〰 → one rung below (bi_weekly); ✗ → learning", JSON.stringify([T(BANK, "c"), T(BANK, "s"), T(BANK, "m")]) === JSON.stringify([{ status: "active", tier: "monthly" }, { status: "active", tier: "bi_weekly" }, { status: "introduction", tier: "daily" }]), [T(BANK, "c"), T(BANK, "s"), T(BANK, "m")]);
  ok("parked = the same as no card; the check-up's k / spot / p read as ✓ / 〰 / ✗", T(PARK, "k").tier === "monthly" && T(PARK, "spot").tier === "bi_weekly" && T(PARK, "p").status === "introduction");
  c.unitStudies.all_about_spelling.kidStage.andrew.testRight = "graduated";
  ok("testRight graduated: ✓ → graduated; 〰 → monthly (today's behaviour)", T(BANK, "c").tier === "graduated" && T(BANK, "s").tier === "monthly");
  c.unitStudies.all_about_spelling.kidStage.andrew.testRight = "bi_weekly";
  ok("testRight bi_weekly: 〰 → weekly (one rung below on the default ladder)", T(BANK, "s").tier === "weekly");
  c.masteryData.andrew_settings.ladder = ["weekly", "monthly", "graduated"];
  c.unitStudies.all_about_spelling.kidStage.andrew.testRight = "monthly";
  ok("…on THIS kid's own ladder (weekly · monthly · graduated): 〰 → weekly; at the bottom rung it stays there", T(BANK, "s").tier === "weekly" && (c.unitStudies.all_about_spelling.kidStage.andrew.testRight = "weekly", T(BANK, "s").tier === "weekly"));
  delete c.masteryData.andrew_settings.ladder; c.unitStudies.all_about_spelling.kidStage.andrew.testRight = undefined;
  ok("graduated: ✓ stays graduated; 〰 → monthly; ✗ → learning", T(GRAD, "c").tier === "graduated" && T(GRAD, "k").tier === "graduated" && T(GRAD, "s").tier === "monthly" && T(GRAD, "spot").tier === "monthly" && T(GRAD, "m").status === "introduction");
  ok("on the ladder (weekly): ✓ / 〰 → back where it was (weekly); ✗ → learning", JSON.stringify(T(LAD, "c")) === JSON.stringify({ status: "active", tier: "weekly" }) && JSON.stringify(T(LAD, "s")) === JSON.stringify({ status: "active", tier: "weekly" }) && T(LAD, "m").status === "introduction");
  ok("learning: null — the card is left exactly where it is, whatever the result", T(LRN, "c") === null && T(LRN, "s") === null && T(LRN, "m") === null);
  ok("gkBefore reads a card: none → bank; parked; introduction → learning; graduated; else ladder with its tier", c.gkBefore(null).st === "bank" && c.gkBefore({ status: "parked" }).st === "parked" && c.gkBefore({ status: "introduction", tier: "daily" }).st === "learning" && c.gkBefore({ status: "active", tier: "graduated" }).st === "graduated" && JSON.stringify(c.gkBefore({ status: "active", tier: "bi_weekly" })) === JSON.stringify({ st: "ladder", t: "bi_weekly" }));
}

console.log("\n── stApplyResults: first grades ──");
{
  const w = world({ mastery: { andrew: [card("black", "active", "graduated", { next_due: undefined }), card("clock", "active", "weekly"), card("milk", "introduction", "daily", { tally_dots: 2, next_due: undefined, placed: undefined }), card("desk", "active", "monthly")], andrew_custom_items: [], andrew_settings: {} } }), c = w.ctx;
  const out = c.stApplyResults("andrew", ["black", "clock", "milk", "desk", "snack", "stick"], ["c", "c", "c", "m", "c", "s"], "L1-18");
  const by = n => c.masteryData.andrew.find(i => i.prompt === n);
  ok("graduated + ✓ → STAYS graduated, no due day, stLast stamped", by("black").tier === "graduated" && by("black").status === "active" && by("black").next_due === undefined && by("black").stLast && by("black").stLast.r === "c", by("black"));
  ok("ladder (weekly) + ✓ → UNCHANGED: weekly, and the due day (42) did not move", by("clock").tier === "weekly" && by("clock").next_due === 42, by("clock"));
  ok("learning + ✓ → stays learning (dots untouched)", by("milk").status === "introduction" && by("milk").tier === "daily" && by("milk").tally_dots === 2);
  ok("ladder (monthly) + ✗ → learning", by("desk").status === "introduction" && by("desk").tier === "daily" && by("desk").next_due === undefined);
  ok("new word + ✓ → monthly (testRight), a next look booked; new word + 〰 → bi_weekly", by("snack").tier === "monthly" && by("snack").next_due === 99 && by("stick").tier === "bi_weekly" && by("stick").next_due === 99);
  ok("the before-states come back for the record: graduated · ladder weekly · learning · ladder monthly · bank · bank", JSON.stringify(Object.values(out.was).map(b => b.st + (b.t ? ":" + b.t : ""))) === JSON.stringify(["graduated:graduated", "ladder:weekly", "learning:daily", "ladder:monthly", "bank", "bank"]), out.was);
  ok("no 🔁 came-back for a graduated ✓; writes are the same targeted update + bank update as before", w.cb.length === 0 && w.writes.some(x => x[0] === "update" && x[1] === "mastery/andrew") && w.writes.every(x => x[0] === "update"));
}
{
  const w = world({ mastery: { andrew: [card("black", "active", "graduated", { next_due: undefined })], andrew_custom_items: [], andrew_settings: {} } }), c = w.ctx;
  c.stApplyResults("andrew", ["black"], ["m"], "L1-18");
  const b = c.masteryData.andrew[0];
  ok("graduated + ✗ → learning on the SAME card, with a 🔁 came-back note", b.status === "introduction" && b.tier === "daily" && b.id === "and_black" && w.cb.length === 1 && w.cb[0].from === "graduated" && w.cb[0].name === "black");
  c.stApplyResults("andrew", ["black"], ["s"], "L1-18");
  ok("graduated + 〰 (on a fresh graduated card) → monthly", (() => { const w2 = world({ mastery: { andrew: [card("black", "active", "graduated", { next_due: undefined })], andrew_custom_items: [], andrew_settings: {} } }); w2.ctx.stApplyResults("andrew", ["black"], ["s"], "L1-18"); return w2.ctx.masteryData.andrew[0].tier === "monthly" && w2.ctx.masteryData.andrew[0].next_due === 99; })());
}

console.log("\n── re-grade from `was` ──");
{
  const w = world({ mastery: { andrew: [card("clock", "active", "weekly")], andrew_custom_items: [], andrew_settings: {} } }), c = w.ctx;
  const first = c.stApplyResults("andrew", ["clock", "snack"], ["m", "m"], "L1-18");
  ok("first grade: a ✗ on the ladder word puts it in learning; the new word too", c.masteryData.andrew[0].status === "introduction" && c.masteryData.andrew[1].status === "introduction" && first.was[0].st === "ladder" && first.was[0].t === "weekly" && first.was[1].st === "bank");
  const again = c.stApplyResults("andrew", ["clock", "snack"], ["c", "c"], "L1-18", first.was);
  ok("re-grade ✓ ✓ FROM `was`: the ladder word goes back to weekly (not stuck in learning); the new word lands at testRight", c.masteryData.andrew[0].status === "active" && c.masteryData.andrew[0].tier === "weekly" && c.masteryData.andrew[1].tier === "monthly", c.masteryData.andrew.map(i => i.status + "/" + i.tier));
  ok("…and `was` is carried through unchanged", JSON.stringify(again.was) === JSON.stringify(first.was));
  ok("without `was` the same re-grade would read the cards as learning and leave them there (why `was` exists)", (() => { const w2 = world({ mastery: { andrew: [card("clock", "introduction", "daily", { next_due: undefined })], andrew_custom_items: [], andrew_settings: {} } }); w2.ctx.stApplyResults("andrew", ["clock"], ["c"], "L1-18"); return w2.ctx.masteryData.andrew[0].status === "introduction"; })());
}

console.log("\n── stSave / stNoTime save `was` on the record and re-grade from it ──");
{
  const w = world({ mastery: { andrew: [card("black", "active", "weekly")], andrew_custom_items: [], andrew_settings: {} } }), c = w.ctx;
  c.stOpen("andrew", 1, 18); c.stToGrade(); c.stSetAll("m"); c.stSave();
  const rec = c.masteryData.andrew_spelltests["L1-18"];
  ok("the graded record carries `was` (10 words: black = ladder weekly, the rest bank) in the same single set", rec.state === "graded" && rec.was && Object.keys(rec.was).length === 10 && rec.was[0].st === "ladder" && rec.was[1].st === "bank" && w.writes.filter(x => x[0] === "set" && x[1] === "mastery/andrew_spelltests/L1-18").length === 1);
  ok("black is in learning after the ✗", c.masteryData.andrew.find(i => i.prompt === "black").status === "introduction");
  w.writes.length = 0; c.stOpen("andrew", 1, 18); c.stSetAll("c"); c.stSave();
  ok("re-grading every word ✓ from 📝 Tests: black is back on weekly; `was` unchanged on the record", c.masteryData.andrew.find(i => i.prompt === "black").tier === "weekly" && c.masteryData.andrew.find(i => i.prompt === "black").status === "active" && c.masteryData.andrew_spelltests["L1-18"].was[0].t === "weekly");
  const w2 = world({ mastery: { andrew: [card("black", "active", "graduated", { next_due: undefined })], andrew_custom_items: [], andrew_settings: {} } }), c2 = w2.ctx;
  c2.stOpen("andrew", 1, 18); c2.stNoTime();
  ok("'Didn't have time' saves `was` too (black = graduated) and sends every word to learning", c2.masteryData.andrew_spelltests["L1-18"].was[0].st === "graduated" && c2.masteryData.andrew.every(i => i.status === "introduction"));
}

console.log("\n── ckTap: the spelling check-up follows the rule; a math check-up does not change ──");
{
  // the check-up harness, as test_checkup.js builds it, plus ST_DECK / stRightTier / GRADKEEP
  const engine = cut("// ── MST_ENGINE_START ──", "// ── MST_ENGINE_END ──");
  const stubs = `
var masteryData={}, masteryKid=null, unitStudies={}, currData={subjects:{}}, unitStageForm=null;
var MAST_TIER_ORDER=["daily","every_other_day","every_third_day","weekly","bi_weekly","monthly","learned","graduated"];
var MAST_TIER_INT={daily:1,every_other_day:2,every_third_day:3,weekly:5,bi_weekly:10,monthly:20,learned:60,graduated:null};
function mastDrillSettings(){ return {ladder:["every_other_day","weekly","bi_weekly","monthly","graduated"]}; }
function _unitKidLadderCfg(kid){ return {ladder:["every_other_day","weekly","bi_weekly","monthly","graduated"]}; }
function mastIsDue(i,pn){ const iv=MAST_TIER_INT[i.tier||"daily"]; if(iv==null) return false; if(i.next_due!=null&&iv>1) return pn>=i.next_due; return true; }
function mastIsParked(i){ return i&&i.status==="parked"; } function mastIsNeverDrill(){ return false; }
function mastFullBank(kid){ const out={}; (Object.values(masteryData[kid+"_custom_items"]||{})).forEach(c=>{ if(c){ (out[c.cat]=out[c.cat]||[]).push(c.name);} }); return out; }
function mastGetPrintNum(){ return 40; } function mstTodayKey(){ return DAYKEY; } var DAYKEY="20261026";
function mastStampNextDue(it,items,tier,pn){ it.next_due=pn+28; }
function mastDefKeyOk(n){ return !/[.#$\\[\\]\\/]/.test(n); }
var MOM=true; function momHere(){ return MOM; } function _dryRun(){ return false; }
function renderAll(){} function kitPinGate(then){ then(); }
var WRITES=[]; var db={ref:p=>({update:v=>WRITES.push(["update",p,v]),set:v=>WRITES.push(["set",p,v])})};
var HA_LS={setItem(){},getItem(){return null;},removeItem(){}}; function gwShowToast(){} function _mastRe(){}
function cap(s){ return s[0].toUpperCase()+s.slice(1); }
function _ustCards(u,n){ const out=[]; (u.decks||[]).forEach(d=>{ (d.cards||[]).filter(c=>c.stage===n).forEach(c=>out.push(Object.assign({},c,{_dk:d.key}))); }); return out; }
function _ustStageDef(u,n){ return (u.stages||[]).find(s=>s.n===n)||null; }
var document={getElementById(){return null;}}; function setInterval(){ return 1; } function clearInterval(){}
const ST_DECK="AAS Words"; var TR="monthly"; function stRightTier(kid){ return TR; } function stTier(r,kid){ return r==="c"?{status:"active",tier:TR}:ckResultTier(r); }
`;
  const run = new Function(stubs + engine + ck + gk + "\nckMix=function(q){ return q; };\n" + `
return { ckTap, ckStart, ckStop, mstSessions, get:()=>({masteryData,WRITES,unitStudies}), set:(k,v)=>{ if(k==="MOM") MOM=v; if(k==="TR") TR=v; if(k==="masteryData") masteryData=v; if(k==="unitStudies") unitStudies=v; }, clear:()=>{ WRITES.length=0; } };`)();
  const words = (L, names) => names.map((n, i) => ({ family: "Lesson " + L, name: n, stage: 1, lesson: L, order: L * 100 + i }));
  const aas = { id: "all_about_spelling", title: "All About Spelling", cardLessons: true, stages: [{ n: 1, label: "Level 1" }], decks: [{ key: "AAS Words", mode: "flash", bankOnly: true, cards: words(7, ["at", "man", "sat", "am", "an"]) }], enrolled: { taylor: true }, kidStage: { taylor: { stage: 1 } } };
  const spell = (cards) => { run.set("unitStudies", { all_about_spelling: aas }); run.set("masteryData", { taylor: cards, taylor_custom_items: cards.map(c => ({ cat: "AAS Words", name: c.prompt })), taylor_settings: {}, taylor_sessions: { ck_sp: { name: "Check-up: Level 1 · words", kind: "checkup", who: "mom", unit: "all_about_spelling", stage: 1, perDay: 10, quick: 5, untested: "spot", decks: ["AAS Words"] } } }); run.set("MOM", true); run.ckStart("taylor", "ck_sp", 0); };
  const ckCard = (n, status, tier) => ({ id: "tay_" + n, subject: "AAS Words", prompt: n, answer: n, status, tier, tally_dots: 5, next_due: 30, placed: true });
  spell([ckCard("at", "active", "graduated"), ckCard("man", "active", "weekly"), ckCard("sat", "introduction", "daily")]);
  run.ckTap("c", "at"); run.ckTap("c", "man"); run.ckTap("c", "sat");
  let M = run.get().masteryData.taylor, by = n => M.find(i => i.prompt === n);
  ok("check-up ✓ on a graduated spelling word → stays graduated (was: → monthly via the old STRIGHT path)", by("at").tier === "graduated" && by("at").status === "active" && by("at").ckLast && by("at").ckLast.r === "c", by("at"));
  ok("check-up ✓ on a ladder word (weekly) → left alone, due day kept (30)", by("man").tier === "weekly" && by("man").next_due === 30, by("man"));
  ok("check-up ✓ on a learning word → stays learning", by("sat").status === "introduction");
  run.ckTap("m", "am");   // a new word (no card) missed → learning; the quick check fails → the rest of the lesson is asked
  M = run.get().masteryData.taylor; by = n => M.find(i => i.prompt === n);
  ok("a new word ✗ → learning card minted (as before)", by("am") && by("am").status === "introduction");
  run.ckStop();
  spell([ckCard("at", "active", "graduated"), ckCard("man", "active", "bi_weekly")]);
  run.ckTap("c", "at"); run.ckTap("c", "man"); run.ckTap("c", "sat"); run.ckTap("c", "am"); run.ckTap("c", "an");   // quick 5 all right → pass; nothing untested here
  M = run.get().masteryData.taylor; by = n => M.find(i => i.prompt === n);
  ok("a passed family: graduated stays graduated, the ladder word keeps bi_weekly, the new words land at testRight (monthly)", by("at").tier === "graduated" && by("man").tier === "bi_weekly" && by("sat").tier === "monthly" && by("an").tier === "monthly", M.map(i => i.prompt + ":" + i.tier));
  run.ckStop(); run.set("TR", "graduated");
  spell([]); run.ckTap("c", "at"); run.ckTap("s", "man");
  M = run.get().masteryData.taylor; by = n => M.find(i => i.prompt === n);
  ok("testRight graduated: a new word's ✓ → graduated, its 〰 → monthly", by("at").tier === "graduated" && by("man").tier === "monthly");
  run.ckStop(); run.set("TR", "monthly");
  // a math check-up: untouched (ckResultTier as before: ✓ → graduated even on a ladder card)
  const s7 = []; for (let k = 1; k <= 12; k++) s7.push({ family: "× ÷ · 7s", name: "7×" + k, def: String(7 * k), stage: 7, order: k });
  run.set("unitStudies", { math_fluency_path: { id: "math_fluency_path", stages: [{ n: 7, label: "× and ÷" }], decks: [{ key: "Math Facts", cards: s7 }], enrolled: { taylor: true }, kidStage: { taylor: { stage: 7 } } } });
  run.set("masteryData", { taylor: [{ id: "t1", subject: "Math Facts", prompt: "7×3", answer: "21", status: "active", tier: "weekly", next_due: 30 }], taylor_custom_items: s7.map(c => ({ cat: "Math Facts", name: c.name })), taylor_settings: {}, taylor_sessions: { ck_m: { name: "Check-up", kind: "checkup", who: "mom", unit: "math_fluency_path", stage: 7, perDay: 12, quick: 12, untested: "known", decks: ["Math Facts"] } } });
  run.ckStart("taylor", "ck_m", 0); run.ckTap("c", "7×3");
  ok("math check-up: a ✓ on a ladder fact still graduates it (ckResultTier, exactly as before)", run.get().masteryData.taylor.find(i => i.prompt === "7×3").tier === "graduated");
  run.ckStop();
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
