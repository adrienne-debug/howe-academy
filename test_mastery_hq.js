/*
 * Node tests for the Mastery HQ compute functions (MHQ_START / MHQ_END block).
 *
 * Mirrors test_report.js's approach: slice the block out by its markers and build it
 * with `new Function`, but here masteryData/masteryKid are passed in as PARAMETERS
 * (not baked into the source) so each test case can hand in fresh fixture data while
 * reusing the exact same stub helper source.
 *
 *   run:  node test_mastery_hq.js
 *   run against index.html once patched in:  MHQ_SRC=../index.html node test_mastery_hq.js
 */
const fs = require("fs");
const path = require("path");

const srcPath = process.env.MHQ_SRC || path.join(__dirname, "index.html");
const src = fs.readFileSync(srcPath, "utf8");

const a = src.indexOf("// ── MHQ_START ──");
const b = src.indexOf("// ── MHQ_END ──");
if (a < 0 || b < 0) { console.error("MHQ markers not found in " + srcPath); process.exit(1); }
const block = src.slice(a, b);

// ── Stub helper source (documented semantics only — no reach into undocumented globals) ──
const STUB_SRC = `
  const MAST_TIER_INT={daily:1,every_other_day:2,every_third_day:3,weekly:7,bi_weekly:14,monthly:28,learned:60,graduated:null};
  const MAST_TIER_ORDER=["daily","every_other_day","every_third_day","weekly","bi_weekly","monthly","learned","graduated"];
  const ROSTER=["lincoln","ellis","lucy","julian"];
  function renderAll(){}
  function mastGetVisual(cat,name){ return null; }
  function mastIsParked(i){ return !!(i&&i.status==="parked"); }
  function mastIsNeverDrill(item){
    const kt=(item&&item.knowledge_type)||"fact_association";
    return kt==="concept"||kt==="transfer";
  }
  function mastIsDue(item,pn){
    const iv=MAST_TIER_INT[item.tier||"daily"];
    if(iv===null||iv===undefined) return false;
    if(item.next_due!=null&&iv>1) return pn>=item.next_due;
    const cy=item.cycle||1;
    return (pn-1)%iv===(cy-1)%iv;
  }
  function mastGetPrintNum(){
    const today=new Date().toISOString().slice(0,10);
    let pl=masteryData.printLog||[];
    if(!Array.isArray(pl)) pl=Object.values(pl);
    const existing=pl.find(x=>x&&x.date===today);
    if(existing) return existing.num;
    return pl.reduce((m,x)=>Math.max(m,(x&&x.num)||0),0)+1;
  }
  function mastFullBank(kidArg){
    const kid=kidArg||masteryKid;
    const base={};
    let custom=masteryData[kid+"_custom_items"]||[];
    if(!Array.isArray(custom)) custom=Object.values(custom);
    custom.forEach(ci=>{
      if(!ci) return;
      if(!base[ci.cat]) base[ci.cat]=[];
      if(!base[ci.cat].includes(ci.name)) base[ci.cat].push(ci.name);
    });
    const orders=masteryData[kid+"_bank_order"]||{};
    Object.entries(orders).forEach(([cat,order])=>{
      if(!base[cat]||!order) return;
      const set=new Set(base[cat]);
      const ordered=order.filter(n=>set.has(n));
      base[cat].forEach(n=>{ if(!ordered.includes(n)) ordered.push(n); });
      base[cat]=ordered;
    });
    return base;
  }
  function mastDrillSettings(){
    const kid=masteryKid||"lincoln";
    const s=masteryData[kid+"_settings"]||{};
    const defaultLadder=["every_other_day","weekly","bi_weekly","monthly","graduated"];
    return {intro_dots:s.intro_dots??5,ladder_streak:s.ladder_streak??3,max_per_cat:s.max_per_cat??5,
      max_intro_per_cat:s.max_intro_per_cat??3,max_learn_per_drill:s.max_learn_per_drill??0,
      auto_pull:s.auto_pull!==false,ladder:s.ladder||defaultLadder,cat_caps:s.cat_caps||{},
      cat_intro_dots:s.cat_intro_dots||{},cat_intro_max:s.cat_intro_max||{},miss_drop:s.miss_drop||"reset",
      close_behavior:s.close_behavior||"stay",drop_threshold:s.drop_threshold??0,tier_streaks:s.tier_streaks||{},
      gate_tier:s.gate_tier||"weekly",sprint_default:s.sprint_default===true,cat_sprint:s.cat_sprint||{},
      dynamic_decks:s.dynamic_decks===true,dynamic_cap:s.dynamic_cap??24,show_me:s.show_me!==false,match_speak:s.match_speak===true};
  }
  function mastDueItems(kid,pn){
    let items=masteryData[kid];
    if(!items) return [];
    if(!Array.isArray(items)) items=Object.values(items);
    items=items.filter(Boolean);
    return items.filter(i=>mastIsDue(i,pn)&&!mastIsNeverDrill(i)&&!mastIsParked(i));
  }
`;

// Build one factory: masteryData / masteryKid are real parameters of the constructed
// function, so mhqDeckStats's internal `masteryKid=kid; ...; masteryKid=_mk;` swap only
// ever touches that call's own local binding — exactly like the real app's module scope.
function build(masteryDataFixture, masteryKidFixture) {
  const factory = new Function(
    "masteryData", "masteryKid",
    STUB_SRC + block + `
    return {mhqItems,mhqBank,mhqDeckStats,mhqTotals,mhqAttention,mhqDeckCards,mhqFinish};
    `
  );
  return factory(masteryDataFixture, masteryKidFixture || "lincoln");
}

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log("  ok  - " + name); }
  else { fail++; console.log("  FAIL- " + name + (extra !== undefined ? "  (" + JSON.stringify(extra) + ")" : "")); }
}
function eq(name, actual, expected) {
  const c = JSON.stringify(actual) === JSON.stringify(expected);
  ok(name, c, c ? undefined : { actual, expected });
}

const KID = "lincoln";
const PN = 100;

// ── (a) 3 intro + 2 active (due today / due pn+3) + bank of 5, 2 already items ──
(() => {
  const M = build({
    lincoln: [
      { id: "i1", subject: "Alpha", prompt: "x1", answer: "x1", status: "introduction", tally_dots: 1 },
      { id: "i2", subject: "Alpha", prompt: "x2", answer: "x2", status: "introduction", tally_dots: 0 },
      { id: "i3", subject: "Alpha", prompt: "x3", answer: "x3", status: "introduction", tally_dots: 2 },
      { id: "i4", subject: "Alpha", prompt: "w1", answer: "w1", status: "active", tier: "weekly", next_due: PN },
      { id: "i5", subject: "Alpha", prompt: "w2", answer: "w2", status: "active", tier: "weekly", next_due: PN + 3 },
    ],
    lincoln_custom_items: [
      { cat: "Alpha", name: "w1" }, { cat: "Alpha", name: "w2" }, { cat: "Alpha", name: "w3" },
      { cat: "Alpha", name: "w4" }, { cat: "Alpha", name: "w5" },
    ],
  }, KID);
  const rows = M.mhqDeckStats(KID, PN);
  const row = rows.find(r => r.deck === "Alpha");
  ok("(a) row exists", !!row);
  eq("(a) learning=3", row.learning, 3);
  eq("(a) active=2", row.active, 2);
  eq("(a) dueToday=1", row.dueToday, 1);
  eq("(a) dueWeek=2", row.dueWeek, 2);
  eq("(a) bank=3", row.bank, 3);
  eq("(a) nextUp=[w3,w4,w5]", row.nextUp, ["w3", "w4", "w5"]);
  eq("(a) forecast[0]=1", row.forecast[0], 1);
  eq("(a) forecast[3]=1", row.forecast[3], 1);
  const restZero = row.forecast.every((v, i) => i === 0 || i === 3 || v === 0);
  ok("(a) forecast elsewhere is 0", restZero, row.forecast);
})();

// ── (b) overdue item counts on forecast[0] only ──
(() => {
  const M = build({
    lincoln: [
      { id: "j1", subject: "Beta", prompt: "b1", answer: "b1", status: "active", tier: "weekly", next_due: PN - 5 },
    ],
  }, KID);
  const row = M.mhqDeckStats(KID, PN).find(r => r.deck === "Beta");
  eq("(b) dueToday=1", row.dueToday, 1);
  eq("(b) forecast[0]=1", row.forecast[0], 1);
  const restZero = row.forecast.slice(1).every(v => v === 0);
  ok("(b) forecast[1..13] all 0", restZero, row.forecast);
})();

// ── (c) parked + never-drill excluded from due counts, present in deck cards ──
(() => {
  const M = build({
    lincoln: [
      { id: "k1", subject: "Gamma", prompt: "g1", answer: "g1", status: "parked", tier: "weekly", next_due: PN },
      { id: "k2", subject: "Gamma", prompt: "g2", answer: "g2", status: "active", tier: "weekly", next_due: PN, knowledge_type: "concept" },
    ],
    lincoln_custom_items: [{ cat: "Gamma", name: "g1" }, { cat: "Gamma", name: "g2" }],
  }, KID);
  const row = M.mhqDeckStats(KID, PN).find(r => r.deck === "Gamma");
  eq("(c) dueToday=0", row.dueToday, 0);
  ok("(c) forecast all 0", row.forecast.every(v => v === 0), row.forecast);
  eq("(c) parked=1", row.parked, 1);
  eq("(c) active=1", row.active, 1); // concept item still counts toward active bucket, just excluded from due
  const cards = M.mhqDeckCards(KID, "Gamma");
  const g1 = cards.find(c => c.name === "g1");
  const g2 = cards.find(c => c.name === "g2");
  ok("(c) g1 state parked", g1 && g1.state === "parked", g1);
  ok("(c) g1 tier weekly", g1 && g1.tier === "weekly", g1);
  ok("(c) g2 present with tier weekly", g2 && g2.tier === "weekly", g2);
})();

// ── (d) legacy parity item without next_due ──
(() => {
  // every_other_day (iv=2); pn=101 odd so (pn-1)=100 is even -> due at offset 0, then
  // every other offset (2,4,...) per the formula, but forecast only records the FIRST hit.
  const PN2 = 101;
  const M = build({
    lincoln: [
      { id: "l1", subject: "Delta", prompt: "d1", answer: "d1", status: "active", tier: "every_other_day", cycle: 1 },
    ],
  }, KID);
  const row = M.mhqDeckStats(KID, PN2).find(r => r.deck === "Delta");
  eq("(d) dueToday=1", row.dueToday, 1);
  eq("(d) forecast[0]=1", row.forecast[0], 1);
  eq("(d) forecast[2]=0 (already counted at day0)", row.forecast[2], 0);
})();

// ── (e) mhqFinish: bank 396, perDay 5 -> 80 sessions, eta skips weekends ──
(() => {
  const row = { learning: 0, active: 0, graduated: 0, bank: 396 };
  const monday = new Date(2026, 8, 14); // 2026-09-14 is a Monday
  const M = build({}, KID);
  const fin = M.mhqFinish(row, 5, monday);
  eq("(e) cardsDone=0", fin.cardsDone, 0);
  eq("(e) total=396", fin.total, 396);
  eq("(e) sessionsLeft=80", fin.sessionsLeft, 80);

  // Independent weekday-skip loop (not sharing code with mhqFinish) for cross-check.
  let d = new Date(2026, 8, 14), count = 0;
  while (count < 80) { d.setDate(d.getDate() + 1); const dow = d.getDay(); if (dow !== 0 && dow !== 6) count++; }
  const expEta = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  eq("(e) eta skips weekends", fin.eta, expEta);
})();

// ── (f) mhqTotals sums ──
(() => {
  const M = build({}, KID);
  const rows = [
    { learning: 1, active: 2, dueToday: 3, dueWeek: 4, bank: 5, forecast: [1, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
    { learning: 10, active: 20, dueToday: 30, dueWeek: 40, bank: 50, forecast: [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3] },
  ];
  const t = M.mhqTotals(rows);
  eq("(f) learning", t.learning, 11);
  eq("(f) active", t.active, 22);
  eq("(f) dueToday", t.dueToday, 33);
  eq("(f) dueWeek", t.dueWeek, 44);
  eq("(f) bank", t.bank, 55);
  eq("(f) forecast", t.forecast, [1, 1, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3]);
})();

// ── (g) deck present only in the bank ──
(() => {
  const M = build({
    lincoln_custom_items: [
      { cat: "Solo", name: "s1" }, { cat: "Solo", name: "s2" }, { cat: "Solo", name: "s3" }, { cat: "Solo", name: "s4" },
    ],
  }, KID);
  const row = M.mhqDeckStats(KID, PN).find(r => r.deck === "Solo");
  ok("(g) row exists", !!row);
  eq("(g) bank=4", row.bank, 4);
  eq("(g) nextUp=[s1,s2,s3]", row.nextUp, ["s1", "s2", "s3"]);
  eq("(g) learning=0", row.learning, 0);
  eq("(g) active=0", row.active, 0);
  eq("(g) graduated=0", row.graduated, 0);
  eq("(g) parked=0", row.parked, 0);
  eq("(g) dueToday=0", row.dueToday, 0);
  eq("(g) dueWeek=0", row.dueWeek, 0);
})();

// ── (h) sparse-object items and bank normalize ──
(() => {
  const M = build({
    lincoln: { 0: null, 1: { id: "m1", subject: "Sparse", prompt: "p1", answer: "p1", status: "active", tier: "weekly", next_due: PN }, 2: null },
    lincoln_custom_items: { 0: null, 1: { cat: "Sparse", name: "p1" }, 2: { cat: "Sparse", name: "p2" } },
  }, KID);
  const items = M.mhqItems(KID);
  eq("(h) mhqItems drops nulls, len=1", items.length, 1);
  const bank = M.mhqBank(KID);
  ok("(h) bank.Sparse has 2 names", Array.isArray(bank.Sparse) && bank.Sparse.length === 2, bank.Sparse);
  const row = M.mhqDeckStats(KID, PN).find(r => r.deck === "Sparse");
  eq("(h) active=1", row.active, 1);
  eq("(h) dueToday=1", row.dueToday, 1);
  eq("(h) bank=1 (p2 unmatched)", row.bank, 1);
})();

console.log("\n" + pass + " passed, " + fail + " failed");
if (fail > 0) process.exit(1);
