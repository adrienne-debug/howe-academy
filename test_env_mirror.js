/*
 * Node tests — 🌿 ENVMIRROR, step 5 of the Envirothon plan (PLAN_envirothon_2026-10-27.md; design
 * DESIGN_envirothon_console_2026-10-27.md ✅ DECISIONS + §1.2 + §3 + §4). Her decision 2026-10-27: one Envirothon
 * site on one Firebase project; Lincoln studies in Howe and a SUMMARY is mirrored over; the teacher's release reads back.
 *   · No config block → no named app, no listener, no hook fires, no Settings card: byte-identical boot for every other family.
 *   · A fake config + a replayed masteryData / studyLog / history / _tests → the exact §1.2 summary record.
 *   · Publish = ONE update on the NAMED app at students/<sid> = {summary, meta}; nothing on the default app.
 *   · Debounce: two saves inside 60 s → one publish; an unchanged summary is never re-sent; dry run → nothing.
 *   · Release: one targeted cat_hold removal per released deck, never a set, idempotent; locked → publishing stops.
 * Runs the real ENVMIRROR block sliced from index.html against fake firebase / db / window.   run: node test_env_mirror.js
 */
const fs = require("fs"), path = require("path");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const LIB = require(path.join(__dirname, "envirothon.js"));
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x).slice(0, 400) : "")); } };

const a = src.indexOf("// ENVMIRROR_START"), b = src.indexOf("// ENVMIRROR_END");
const block = src.slice(a, b);
ok("ENVMIRROR block present once, right after NUDGE_ROLLUP_END", a > 0 && b > a && src.indexOf("// ENVMIRROR_START", a + 1) < 0 && src.slice(src.indexOf("// NUDGE_ROLLUP_END"), a).trim() === "// NUDGE_ROLLUP_END");
ok("the block declares only (no top-level statement runs at boot)", block.split("\n").every(l => !l.trim() || /^(\/\/|function |const |let | |})/.test(l)));
ok("no Howe kid name as a code literal in the block", !/["'`](lincoln|ellis|lucy|julian)["'`]/i.test(block));
ok("no 🔀 in index.html", src.indexOf("\u{1F500}") < 0);
// the real tier helper, as the app has it
const tierFn = src.slice(src.indexOf("function mastTierAtLeast(tier,gateTier){"), src.indexOf("}", src.indexOf("return a>=b;", src.indexOf("function mastTierAtLeast(tier,gateTier){"))) + 1);
ok("mastTierAtLeast sliced from the source", /return a>=b;\s*}$/.test(tierFn));

// ── a tiny world: fake firebase (default app + the named one), a recording family db, HA_LS, the globals the block leans on ──
const CFG = { firebase: { apiKey: "k", authDomain: "x.firebaseapp.com", databaseURL: "https://x-default-rtdb.firebaseio.com", projectId: "x", appId: "1:2:web:3" }, classId: "ms2027" };
function world(o) {
  o = o || {};
  const G = { now: o.now || Date.UTC(2026, 9, 27, 15, 0, 0), inits: [], listeners: [], onces: [], envWrites: [], writes: [], signins: [], timers: [], ls: {}, toasts: [], repaints: 0, remote: o.remote || {},
    dry: !!o.dry, mom: o.mom !== false, masteryData: o.mastery || {}, unitStudies: o.unitStudies || {}, unitsReady: o.unitsReady !== false, hasDb: o.hasDb !== false };
  const famCfg = { familyId: o.familyId || "howe", roster: [] };
  if (o.cfg !== null) famCfg.envirothon = o.cfg || CFG;
  const auth = { currentUser: o.user || null, cbs: [], onAuthStateChanged(fn) { auth.cbs.push(fn); fn(auth.currentUser); },
    signInWithEmailAndPassword(e, p) { G.signins.push([e, p]); auth.currentUser = { uid: "fam1", email: e }; auth.cbs.forEach(f => f(auth.currentUser)); return Promise.resolve({ user: auth.currentUser }); },
    signOut() { auth.currentUser = null; auth.cbs.forEach(f => f(null)); return Promise.resolve(); } };
  const edb = { ref(p) { return { on(ev, fn) { G.listeners.push({ p, fn }); }, off(ev, fn) { G.listeners = G.listeners.filter(l => !(l.p === p && l.fn === fn)); },
    once(ev, fn) { G.onces.push(p); if (p in G.remote) fn({ val: () => G.remote[p] }); else fn({ val: () => null }); },
    update(v) { G.envWrites.push(["update", p, JSON.parse(JSON.stringify(v))]); return G.refuse ? Promise.reject(new Error("PERMISSION_DENIED")) : Promise.resolve(); }, set(v) { G.envWrites.push(["set", p, v]); return Promise.resolve(); }, remove() { G.envWrites.push(["remove", p]); return Promise.resolve(); } }; } };
  const firebase = { apps: [{ name: "[DEFAULT]" }], initializeApp(cfg, name) { G.inits.push([cfg, name]); const app = { name, options: cfg, database: () => edb, auth: () => auth }; firebase.apps.push(app); return app; } };
  const db = G.hasDb ? { ref(p) { return { update(v) { G.writes.push(["update", p, v]); }, set(v) { G.writes.push(["set", p, v]); }, remove() { G.writes.push(["remove", p]); } }; } } : null;
  const api = new Function("G", "firebase", "db", "famCfg", "tierFn", `
    const window={ HA_FAMILY: famCfg }; const masteryData=G.masteryData; let unitStudies=G.unitStudies; let _haUnitsReady=G.unitsReady;
    const HA_LS={ getItem(k){ return (k in G.ls)?G.ls[k]:null; }, setItem(k,v){ G.ls[k]=String(v); }, removeItem(k){ delete G.ls[k]; } };
    const Date={ now(){ return G.now; }, UTC: globalThis.Date.UTC.bind(globalThis.Date) }; function _D(ms){ return new globalThis.Date(ms); }
    const setTimeout=(fn,ms)=>{ const t={fn,ms,id:G.timers.length+1}; G.timers.push(t); return t.id; }, clearTimeout=(id)=>{ G.timers=G.timers.filter(t=>t.id!==id); };
    const document={ getElementById:(id)=>(G.doc&&G.doc[id])||null }; const console={ log(){}, error(){} };
    function momHere(){ return G.mom; } function _dryRun(){ return G.dry; }
    const KID_NAME={ lincoln:"Lincoln", ellis:"Ellis" }; function cap(s){ return KID_NAME[s]||(s[0].toUpperCase()+s.slice(1)); }
    const MAST_TIER_ORDER=["daily","every_other_day","every_third_day","weekly","bi_weekly","monthly","learned","graduated"]; const MAST_MASTERY_TIER_DEFAULT="monthly";
    ${tierFn}
    const ENV_UNIT_ID="nc_envirothon"; function envCardsInCode(u){ return !!(u&&u.cardsInCode&&(u.starter===ENV_UNIT_ID||u.id===ENV_UNIT_ID)); }
    function gwShowToast(m){ G.toasts.push(m); } function renderAllSoon(){ G.repaints++; }
    ${block.replace(/new Date\(/g, "_D(")}
    return { setUnits(v){ _haUnitsReady=v; }, envSummary, envMirrorOn, envMirrorCardHtml, envmBodyHtml, envmRelease, envmSignIn, envmSignOut, envmSendNow, envmPublishAll, envmKids, envmSid, envmHash, envmCfg, envmReady, _envm, firebase, auth: firebase.apps[1]&&firebase.apps[1].auth() };`)(G, firebase, db, famCfg, tierFn);
  api.G = G; api.fb = firebase; api.authObj = auth;
  api.fire = (p, v) => { const ls = G.listeners.filter(l => l.p === p); ls.forEach(l => l.fn({ val: () => v })); return ls.length; };
  api.tick = () => { const t = G.timers.shift(); if (t) { G.now += t.ms; t.fn(); } return !!t; };
  return api;
}
// A small Envirothon unit record, hydrated (cards in memory as envHydrateAll leaves them), enrolled for one kid.
const DK = { ft: "Forestry · Terms", ff: "Forestry · Facts", st: "Soils and Land Use · Terms", gt: "General Concepts · Terms" };
function unit(kid) {
  return { nc_envirothon: { id: "nc_envirothon", starter: "nc_envirothon", starterVer: 1, cardsInCode: true, enrolled: { [kid]: true },
    decks: [
      { key: DK.gt, station: "general", stage: 0, n: 2, cards: [{ name: "Biosphere", family: "The Biosphere" }, { name: "Ecosystem", family: "The Biosphere" }] },
      { key: DK.ft, station: "forestry", stage: 1, n: 4, cards: [{ name: "Cambium", family: "Tree Biology" }, { name: "Xylem", family: "Tree Biology" }, { name: "Crown", family: "Tree Biology" }, { name: "Silviculture", family: "Forest Management" }] },
      { key: DK.ff, station: "forestry", stage: 1, n: 3, cards: [{ name: "Fact A", family: "Tree Biology" }, { name: "Fact B", family: "Forest Management" }, { name: "Fact C", family: "Forest Management" }] },
      { key: DK.st, station: "soils", stage: 2, n: 2, cards: [{ name: "Horizon", family: "Soil Formation" }, { name: "Loam", family: "Soil Formation" }] }] } };
}
const KID = "lincoln", OTHER = "ellis";   // test data only — the block itself names no kid
const T0 = Date.UTC(2026, 9, 27, 15, 0, 0);   // 2026-10-27 15:00Z → today = 20261027
function mastery() {
  return {
    [KID]: [
      { id: "lin_cambium", subject: DK.ft, prompt: "Cambium", tier: "weekly", status: "active", drop_count: 1 },
      { id: "lin_xylem", subject: DK.ft, prompt: "Xylem", tier: "daily", status: "introduction", drop_count: 0 },
      { id: "lin_crown", subject: DK.ft, prompt: "Crown", tier: "monthly", status: "active", drop_count: 0 },
      { id: "lin_facta", subject: DK.ff, prompt: "Fact A", tier: "daily", status: "parked", drop_count: 0 },
      { id: "lin_factb", subject: DK.ff, prompt: "Fact B", tier: "graduated", status: "active", drop_count: 2 },
      { id: "lin_horizon", subject: DK.st, prompt: "Horizon", tier: "daily", status: "introduction", drop_count: 0 },
      { id: "lin_other", subject: "Science", prompt: "Mitochondria", tier: "daily", status: "active", drop_count: 9 }],   // another deck: never counted
    [KID + "_settings"]: { cat_hold: { [DK.gt]: true, [DK.st]: true, "AAS Words": true } },   // forestry released, general + soils held
    [KID + "_custom_items"]: [{ cat: DK.gt, name: "Biosphere" }, { cat: DK.gt, name: "Ecosystem" }, { cat: DK.st, name: "Horizon" }, { cat: DK.st, name: "Loam" }],
    studyLog: { [KID]: { envirothon: {
      "20261027": { date: "20261027", total: 4, correct: 2, miss: 1, shown: 1, secs: 50, sits: [{ secs: 30, total: 2 }, { secs: 20, total: 2 }],
        items: [{ id: "lin_cambium", name: "Cambium", deck: DK.ft, result: "m" }, { id: "lin_xylem", name: "Xylem", deck: DK.ft, result: "shown" }, { id: "lin_crown", name: "Crown", deck: DK.ft, result: "c" }, { id: "lin_factb", name: "Fact B", deck: DK.ff, result: "c" }] },
      "20261026": { date: "20261026", total: 2, correct: 1, miss: 1, secs: 40,
        items: [{ id: "lin_cambium", name: "Cambium", deck: DK.ft, result: "m" }, { id: "lin_crown", name: "Crown", deck: DK.ft, result: "c" }] },
      "20261001": { date: "20261001", total: 2, correct: 2, miss: 0, secs: 25,
        items: [{ id: "lin_cambium", name: "Cambium", deck: DK.ft, result: "c" }, { id: "lin_crown", name: "Crown", deck: DK.ft, result: "c" }] } },
      daily: { "20261027": { date: "20261027", total: 2, correct: 1, miss: 1, secs: 60,
        items: [{ id: "lin_horizon", name: "Horizon", deck: DK.st, result: "c" }, { id: "x", name: "Mitochondria", deck: "Science", result: "m" }] } } } },
    history: { [KID]: { "20261020": { date: "2026-10-20", items: [{ id: "lin_factb", prompt: "Fact B", result: "m" }, { id: "lin_other", prompt: "Mitochondria", result: "m" }, { id: "lin_cambium", prompt: "Cambium", result: "c" }] } } },
    [KID + "_tests"]: { forestry: { pre: { form: "2022", date: "2026-09-15", n: 20, right: 9, secs: 600, answers: { 0: 1 } }, post: { t1: { right: 15, n: 20 }, best: { right: 17, n: 20, date: "2026-10-20" } }, graduated: { date: "2026-10-20", right: 17, n: 20 } },
      soils: { postOpen: { date: "2026-10-27" } }, junk: "x" }
  };
}

console.log("── no config block → inert, byte-identical boot ──");
{ const w = world({ cfg: null, mastery: mastery(), unitStudies: unit(KID) });
  ok("envmCfg() is null; every hook returns false", w.envmCfg() === null && ["boot", "study", "drill", "enroll"].every(h => w.envMirrorOn(h) === false));
  ok("no named app, no listener, no once, no write on either database, no timer", w.G.inits.length === 0 && w.G.listeners.length === 0 && w.G.onces.length === 0 && w.G.envWrites.length === 0 && w.G.writes.length === 0 && w.G.timers.length === 0);
  ok("Settings card is empty, even for Mom", w.envMirrorCardHtml() === "");
  ok("a release call does nothing without a config (no app could be listening)", w.envmRelease(KID, { soils: true }) === 0 && w.G.writes.length === 0 && w.G.masteryData[KID + "_settings"].cat_hold[DK.st] === true); }
{ const famBlock = fs.readFileSync(path.join(__dirname, "family-config.js"), "utf8");
  ok("family-config.js on main carries no envirothon block (Howe's boot is unchanged until Adrienne pastes it)", !/envirothon\s*:/.test(famBlock)); }
{ const w = world({ cfg: { firebase: { apiKey: "k" } } });   // half a config: no databaseURL
  ok("a config without a databaseURL counts as absent", w.envmCfg() === null && w.envMirrorOn("boot") === false && w.G.inits.length === 0); }

console.log("\n── the summary record (pure) ──");
{ const w = world({ mastery: mastery(), unitStudies: unit(KID) });
  const s = w.envSummary(KID, { M: w.G.masteryData, u: w.G.unitStudies.nc_envirothon, now: T0 });
  ok("unitVer 1, at = now, the five parts + tests", s.unitVer === 1 && s.at === T0 && ["byDeck", "byConcept", "streak", "weak", "days", "tests"].every(k => k in s));
  ok("byDeck covers exactly the unit's four decks — Science and AAS Words never appear", Object.keys(s.byDeck).sort().join("|") === [DK.gt, DK.ft, DK.ff, DK.st].sort().join("|"));
  const ft = s.byDeck[DK.ft], ff = s.byDeck[DK.ff], gt = s.byDeck[DK.gt], st = s.byDeck[DK.st];
  ok("Forestry · Terms: total 4, new 1, learning 1 (Xylem), active 1 (Cambium weekly), mastered 1 (Crown monthly), not held", ft.total === 4 && ft.new === 1 && ft.waiting === 0 && ft.learning === 1 && ft.active === 1 && ft.mastered === 1 && ft.held === false, ft);
  ok("Forestry · Terms accuracy: 4 right / 2 missed over all time (67 %), shown excluded; 14-day window 2 right / 2 missed (50 %); last 20261027", ft.correct === 4 && ft.miss === 2 && ft.acc === 67 && ft.c14 === 2 && ft.m14 === 2 && ft.acc14 === 50 && ft.last === "20261027", ft);
  ok("Forestry · Facts: waiting 1 (parked), mastered 1 (graduated tier), new 1; 1 right; the drill miss does NOT count toward accuracy (her 8.9)", ff.total === 3 && ff.waiting === 1 && ff.mastered === 1 && ff.new === 1 && ff.correct === 1 && ff.miss === 0 && ff.acc === 100 && ff.c14 === 1, ff);
  ok("General Concepts · Terms: held, 2 new, no cards, no accuracy (null), no last", gt.held === true && gt.total === 2 && gt.new === 2 && gt.acc === null && gt.acc14 === null && gt.last === null, gt);
  ok("Soils · Terms: held (teacher not yet), 1 learning + 1 new; its Daily Study right counts (1/0)", st.held === true && st.learning === 1 && st.new === 1 && st.correct === 1 && st.miss === 0 && st.acc === 100, st);
  ok("every deck counter has exactly the §1.2 fields", Object.values(s.byDeck).every(c => Object.keys(c).sort().join() === "acc,acc14,active,c14,correct,held,last,learning,m14,mastered,miss,new,total,waiting"));
  // concepts
  const cTB = s.byConcept["forestry|Tree Biology"], cFM = s.byConcept["forestry|Forest Management"];
  ok("byConcept keyed <station>|<Key Concept>: 5 concepts across the four decks", Object.keys(s.byConcept).sort().join("|") === ["forestry|Forest Management", "forestry|Tree Biology", "general|The Biosphere", "soils|Soil Formation"].sort().join("|"), Object.keys(s.byConcept));
  ok("forestry|Tree Biology: 4 cards (3 Terms + Fact A): new 0, waiting 1, learning 1, active 1, mastered 1; 4 right / 2 missed", cTB.total === 4 && cTB.new === 0 && cTB.waiting === 1 && cTB.learning === 1 && cTB.active === 1 && cTB.mastered === 1 && cTB.correct === 4 && cTB.miss === 2 && cTB.held === false, cTB);
  ok("forestry|Forest Management: 3 cards (Silviculture new, Fact B mastered, Fact C new); 1 right", cFM.total === 3 && cFM.new === 2 && cFM.mastered === 1 && cFM.correct === 1 && cFM.miss === 0, cFM);
  ok("a concept whose decks are all held says held", s.byConcept["general|The Biosphere"].held === true && s.byConcept["soils|Soil Formation"].held === true);
  // streak + days
  ok("streak: 2 days (10/26, 10/27), last 20261027 — 10/01 is not consecutive", s.streak.days === 2 && s.streak.last === "20261027", s.streak);
  ok("days: three study days; 10/27 = 4 Envirothon items + Soils' 1 from Daily Study (n 5, c 3, m 1); secs = the sittings' sum (50) + Daily Study's share (30)", Object.keys(s.days).sort().join() === "20261001,20261026,20261027" && JSON.stringify(s.days["20261027"]) === JSON.stringify({ n: 5, c: 3, m: 1, secs: 80 }) && JSON.stringify(s.days["20261026"]) === JSON.stringify({ n: 2, c: 1, m: 1, secs: 40 }), s.days);
  // weak
  ok("weak: Forestry · Terms = Cambium (2 study misses + 1 drop) first; Forestry · Facts = Fact B (1 drill miss + 2 drops); fronts only, no backs", JSON.stringify(s.weak[DK.ft]) === JSON.stringify([{ n: "Cambium", m: 2, d: 1, t: "weekly" }]) && JSON.stringify(s.weak[DK.ff]) === JSON.stringify([{ n: "Fact B", m: 1, d: 2, t: "graduated" }]), s.weak);
  ok("decks with nothing weak are left out; the Science card's 9 drops never appear", !(DK.gt in s.weak) && !(DK.st in s.weak) && JSON.stringify(s.weak).indexOf("Mitochondria") < 0);
  // tests
  ok("tests: forestry pre {right 9, n 20, date}, post.best {17/20}, graduated {date,right,n}; the open-only soils record and junk are dropped; answers/secs never copied", JSON.stringify(s.tests) === JSON.stringify({ forestry: { pre: { right: 9, n: 20, date: "2026-09-15" }, post: { best: { right: 17, n: 20, date: "2026-10-20" } }, graduated: { date: "2026-10-20", right: 17, n: 20 } } }), s.tests);
  ok("nothing of the card backs, the schedule, points or another kid in the record", (() => { const j = JSON.stringify(s); return j.indexOf("answer") < 0 && j.indexOf("def") < 0 && j.indexOf(OTHER) < 0 && j.indexOf("Science") < 0; })());
  ok("pure: calling twice gives the same record; masteryData untouched", JSON.stringify(w.envSummary(KID, { M: w.G.masteryData, u: w.G.unitStudies.nc_envirothon, now: T0 })) === JSON.stringify(s) && w.G.masteryData[KID].length === 7 && w.G.writes.length === 0 && w.G.envWrites.length === 0);
  ok("the hash ignores `at` and changes with any count", w.envmHash(s) === w.envmHash(Object.assign({}, s, { at: 1 })) && w.envmHash(s) !== w.envmHash(Object.assign({}, s, { streak: { days: 3, last: s.streak.last } }))); }
{ const w = world({ mastery: { [KID + "_tests"]: null }, unitStudies: unit(KID) });
  const s = w.envSummary(KID, { M: w.G.masteryData, u: w.G.unitStudies.nc_envirothon, now: T0 });
  ok("nothing studied yet: every deck all new, streak 0, no days, no weak, no tests key", Object.values(s.byDeck).every(c => c.new === c.total && c.acc === null) && s.streak.days === 0 && s.streak.last === null && Object.keys(s.days).length === 0 && Object.keys(s.weak).length === 0 && !("tests" in s)); }
{ const M = mastery(); const w = world({ mastery: M, unitStudies: unit(KID) });
  const s = w.envSummary(KID, { M, u: w.G.unitStudies.nc_envirothon, now: T0 + 2 * 86400000 });   // two days later, nothing since
  ok("streak drops to 0 once the last study day is older than yesterday; `last` stays", s.streak.days === 0 && s.streak.last === "20261027"); }
{ const M = mastery(); const w = world({ mastery: M, unitStudies: unit(KID) });
  const s = w.envSummary(KID, { M, u: w.G.unitStudies.nc_envirothon, now: Date.UTC(2026, 9, 28, 15) });   // the next day: yesterday counts
  ok("a streak that ended yesterday still stands (2)", s.streak.days === 2); }
{ const M = mastery(); const sl = M.studyLog[KID].envirothon; for (let i = 0; i < 40; i++) { const k = new Date(Date.UTC(2026, 7, 1) + i * 86400000).toISOString().slice(0, 10).replace(/-/g, ""); sl[k] = { date: k, items: [{ id: "lin_crown", name: "Crown", deck: DK.ft, result: "c" }], secs: 10 }; }
  const w = world({ mastery: M, unitStudies: unit(KID) }); const s = w.envSummary(KID, { M, u: w.G.unitStudies.nc_envirothon, now: T0 });
  ok("days keeps only the last 30 study days", Object.keys(s.days).length === 30 && Object.keys(s.days).sort().pop() === "20261027"); }
{ const M = mastery(); const u = unit(KID); u.nc_envirothon.decks.forEach(d => { delete d.cards; });   // envirothon.js not loaded yet: thin record
  const w = world({ mastery: M, unitStudies: u }); const s = w.envSummary(KID, { M, u: u.nc_envirothon, now: T0 });
  ok("thin record (cards not hydrated): totals from the record's n / the bank, buckets from the items, no concepts yet", s.byDeck[DK.ft].total === 4 && s.byDeck[DK.ft].new === 1 && s.byDeck[DK.gt].total === 2 && Object.keys(s.byConcept).length === 0 && s.weak[DK.ft][0].n === "Cambium"); }
{ const w = world({ mastery: { [KID]: { 0: { id: "a", subject: DK.ft, prompt: "Cambium", tier: "daily", status: "active" } }, studyLog: { [KID]: { s: { "20261027": { items: { 0: { id: "a", name: "Cambium", deck: DK.ft, result: "c" } } } } } } }, unitStudies: unit(KID) });
  const s = w.envSummary(KID, { M: w.G.masteryData, u: w.G.unitStudies.nc_envirothon, now: T0 });
  ok("object-shaped items / log items (as Firebase hands them back) are read like arrays", s.byDeck[DK.ft].active === 1 && s.byDeck[DK.ft].correct === 1 && s.streak.days === 1); }
{ const w = world({ unitStudies: { nc_envirothon: { id: "nc_envirothon", starter: "nc_envirothon", starterVer: 1, cardsInCode: true, enrolled: { [KID]: true }, decks: LIB.unit.decks.map(d => ({ key: d.key, station: d.station, n: d.cards.length, cards: d.cards })) } } });
  const s = w.envSummary(KID, { M: {}, u: w.G.unitStudies.nc_envirothon, now: T0 });
  const tot = Object.values(s.byDeck).reduce((n, c) => n + c.total, 0), ctot = Object.values(s.byConcept).reduce((n, c) => n + c.total, 0);
  console.log("     real unit: " + Object.keys(s.byDeck).length + " decks, " + Object.keys(s.byConcept).length + " concepts, " + tot + " cards, record " + Buffer.byteLength(JSON.stringify(s)) + " B");
  ok("the real unit (envirothon.js): 15 decks, 4,371 cards in both views, under 40 KB with nothing studied", Object.keys(s.byDeck).length === 15 && tot === 4371 && ctot === 4371 && Buffer.byteLength(JSON.stringify(s)) < 40 * 1024); }

console.log("\n── the named app, sign-in, publish ──");
function booted(o) { const w = world(Object.assign({ mastery: mastery(), unitStudies: unit(KID) }, o || {})); w.envMirrorOn("boot"); return w; }
{ const w = booted();
  ok("boot hook: ONE named app \"envirothon\" from cfg.firebase, the default app untouched", w.G.inits.length === 1 && w.G.inits[0][1] === "envirothon" && w.G.inits[0][0] === CFG.firebase && w.fb.apps.length === 2 && w.fb.apps[0].name === "[DEFAULT]");
  ok("not signed in: nothing published, no listener on the Envirothon project, no family write", w.G.envWrites.length === 0 && w.G.listeners.length === 0 && w.G.writes.length === 0);
  ok("a second boot / study hook reuses the app (no second initializeApp)", (w.envMirrorOn("study"), w.envMirrorOn("boot"), w.G.inits.length === 1));
  ok("sid = <familyId>_<kid>; the kids mirrored = the unit's enrolled kids", w.envmSid(KID) === "howe_" + KID && w.envmKids().join() === KID);
  ok("Mom's card: status line 'not signed in', the sign-in form, the kid and sid", /not signed in on this device/.test(w.envMirrorCardHtml()) && /envmSignIn\(event\)/.test(w.envMirrorCardHtml()) && /Lincoln/.test(w.envMirrorCardHtml()) && /howe_lincoln/.test(w.envMirrorCardHtml()) && /Envirothon: sign in/.test(w.envMirrorCardHtml()));
  // sign in through the card
  ok("sign-in with empty fields → false, nothing sent", w.envmSignIn({ preventDefault() {} }) === false && w.G.signins.length === 0);
  w.G.doc = { "envm-e": { value: " mom@example.com " }, "envm-p": { value: "pw" } };
  ok("the card's form: email trimmed + password straight to the NAMED app's auth, nothing kept", w.envmSignIn({ preventDefault() {} }) === true && w.G.signins.length === 1 && w.G.signins[0][0] === "mom@example.com" && w.G.signins[0][1] === "pw" && JSON.stringify(w.G.ls).indexOf("pw") < 0);
  ok("signed in → release/locked listener + the class id read (cfg.classId, no read needed) + release/<class>/all + release/<class>/students/<sid>", w.G.listeners.map(l => l.p).sort().join("|") === ["release/locked", "release/ms2027/all", "release/ms2027/students/howe_lincoln"].join("|") && w.G.onces.length === 0, w.G.listeners.map(l => l.p));
  ok("…and ONE update on the named app at students/<sid> = {summary, meta}", w.G.envWrites.length === 1 && w.G.envWrites[0][0] === "update" && w.G.envWrites[0][1] === "students/howe_lincoln" && Object.keys(w.G.envWrites[0][2]).sort().join() === "meta,summary", w.G.envWrites.map(x => x[1]));
  const pub = w.G.envWrites[0][2];
  ok("meta = {familyId, kid, name from the roster, at}", JSON.stringify(pub.meta) === JSON.stringify({ familyId: "howe", kid: KID, name: "Lincoln", at: pub.summary.at }), pub.meta);
  ok("the published summary IS envSummary(kid) (same hash)", w.envmHash(pub.summary) === w.envmHash(w.envSummary(KID, { now: w.G.now })) && pub.summary.streak.days === 2);
  ok("nothing written to the family database by a publish", w.G.writes.length === 0);
  ok("the hash is remembered in HA_LS under the sid", /"h":/.test(w.G.ls["ha_envm_howe_lincoln"] || ""));
  ok("status line says signed in as … · last mirrored …", /signed in as mom@example\.com/.test(w.envmBodyHtml()) && /last mirrored/.test(w.envmBodyHtml()) && /Sign out/.test(w.envmBodyHtml()));
  // debounce
  const n0 = w.G.envWrites.length;
  w.G.masteryData[KID][1].status = "active";   // Xylem finished learning
  w.envMirrorOn("study");
  ok("a save 0 s after a publish: no second write yet, one timer waiting the remainder of 60 s", w.G.envWrites.length === n0 && w.G.timers.length === 1 && w.G.timers[0].ms === 60000);
  w.G.now += 20000; w.G.masteryData[KID][0].tier = "bi_weekly"; w.envMirrorOn("drill");
  ok("a second save inside the window joins the same timer (still one)", w.G.envWrites.length === n0 && w.G.timers.length === 1);
  w.tick();
  ok("when the timer fires: ONE publish carrying both changes", w.G.envWrites.length === n0 + 1 && w.G.envWrites[n0][2].summary.byDeck[DK.ft].learning === 0 && w.G.envWrites[n0][2].summary.byDeck[DK.ft].active === 2);
  w.G.now += 61000; w.envMirrorOn("study");
  ok("a save after the window with NOTHING changed → no write (the hash matched)", w.G.envWrites.length === n0 + 1 && w.G.timers.length === 0);
  w.G.now += 61000; w.G.masteryData[KID].push({ id: "lin_silv", subject: DK.ft, prompt: "Silviculture", tier: "daily", status: "introduction" }); w.envMirrorOn("study");
  ok("a save after the window with a change → publishes at once", w.G.envWrites.length === n0 + 2 && w.G.envWrites[n0 + 1][2].summary.byDeck[DK.ft].new === 0);
  // Send now
  const n1 = w.G.envWrites.length; w.envmSendNow();
  ok("Mom's Send now publishes even when unchanged (force), one update", w.G.envWrites.length === n1 + 1 && w.G.envWrites[n1][1] === "students/howe_lincoln");
  ok("Send now / sign-in / sign-out are Mom-only", (w.G.mom = false, w.envmSendNow() === 0 && w.envmSignIn({ preventDefault() {} }) === false && (w.envmSignOut(), w.authObj.currentUser !== null)));
  w.G.mom = true;
  // sign out
  w.envmSignOut();
  ok("sign out: listeners off, timers cleared, card back to the form", w.G.listeners.length === 0 && w.G.timers.length === 0 && /envmSignIn\(event\)/.test(w.envmBodyHtml()) && w.authObj.currentUser === null); }
{ const w = booted({ user: { uid: "fam1", email: "mom@example.com" } });
  ok("a device already signed in (the SDK remembers): the boot publishes once, no password asked", w.G.envWrites.length === 1 && w.G.signins.length === 0 && !/envmSignIn\(event\)/.test(w.envmBodyHtml()));
  const w2 = world({ mastery: mastery(), unitStudies: unit(KID), user: { uid: "fam1", email: "mom@example.com" } }); w2.G.ls["ha_envm_howe_lincoln"] = w.G.ls["ha_envm_howe_lincoln"]; w2.envMirrorOn("boot");
  ok("boot with the same hash remembered → nothing re-sent", w2.G.envWrites.length === 0); }
{ const w = booted({ user: { uid: "fam1" }, dry: true });
  ok("dry run (?dryrun=1): the app opens and listens, but NOTHING is written to the Envirothon project", w.G.inits.length === 1 && w.G.envWrites.length === 0 && w.envmSendNow() === 0 && w.G.envWrites.length === 0); }
{ const w = booted({ user: { uid: "fam1" }, cfg: Object.assign({}, CFG, { classId: undefined }), remote: { "students/howe_lincoln/class": "cls9" } });
  ok("no cfg.classId → students/<sid>/class read once → release listeners on that class", w.G.onces.join() === "students/howe_lincoln/class" && w.G.listeners.some(l => l.p === "release/cls9/all") && w.G.listeners.some(l => l.p === "release/cls9/students/howe_lincoln")); }
{ const w = booted({ user: { uid: "fam1" }, cfg: Object.assign({}, CFG, { familyId: "howe", kids: [KID, OTHER] }), unitStudies: (() => { const u = unit(KID); u.nc_envirothon.enrolled[OTHER] = true; return u; })() });
  ok("two enrolled kids in the config: two sids, two updates, two per-student release listeners", w.G.envWrites.map(x => x[1]).sort().join("|") === "students/howe_ellis|students/howe_lincoln" && w.G.listeners.filter(l => /\/students\//.test(l.p)).length === 2); }
{ const w = booted({ user: { uid: "fam1" }, cfg: Object.assign({}, CFG, { kids: [OTHER] }) });
  ok("a config kid who is not enrolled in the unit is not mirrored (nothing to send)", w.envmKids().length === 0 && w.G.envWrites.length === 0); }
{ const w = world({ mastery: mastery(), unitStudies: unit(KID), hasDb: false }); w.envMirrorOn("boot");
  ok("before initFb (no db yet) the named app is NOT created — the default-app guard stays safe", w.G.inits.length === 0 && w.fb.apps.length === 1); }
{ const w = world({ mastery: mastery(), unitStudies: unit(KID), unitsReady: false, user: { uid: "fam1" } }); w.envMirrorOn("boot");
  ok("units not in yet (signed in): the app opens, a 3-s retry is set, nothing published", w.G.inits.length === 1 && w.G.timers.length === 1 && w.G.timers[0].ms === 3000 && w.G.envWrites.length === 0);
  w.setUnits(true); w.tick();
  ok("…once the units are in, the retry publishes", w.G.envWrites.length === 1); }
{ const w = world({ mastery: mastery(), unitStudies: unit(KID), unitsReady: false }); w.envMirrorOn("boot");
  ok("units not in yet (not signed in): no retry, nothing published", w.G.timers.length === 0 && w.G.envWrites.length === 0); }
{ const u = unit(KID); u.nc_envirothon.decks.forEach(d => { delete d.cards; }); const w = world({ mastery: mastery(), unitStudies: u, user: { uid: "fam1" } }); w.envMirrorOn("boot");
  ok("cards not hydrated yet (envirothon.js loading): boot waits, retries at 3 s", w.G.timers.length === 1 && w.G.envWrites.length === 0);
  u.nc_envirothon.decks.forEach((d, i) => { d.cards = unit(KID).nc_envirothon.decks[i].cards; }); w.tick();
  ok("…and publishes once the cards are in", w.G.envWrites.length === 1 && Object.keys(w.G.envWrites[0][2].summary.byConcept).length === 4); }

{ const w = booted({ user: { uid: "fam1" } }); w.G.refuse = true; w.G.now += 61000; w.G.masteryData[KID].push({ id: "n", subject: DK.ft, prompt: "Silviculture", tier: "daily", status: "introduction" }); w.envMirrorOn("study");
  ok("a refused publish is attempted once…", w.G.envWrites.length === 2);
  setImmediate(() => {
    ok("…then the remembered hash is dropped and the error shows on the card, so the next save resends", !("ha_envm_howe_lincoln" in w.G.ls) && /PERMISSION_DENIED/.test(w.envmBodyHtml()));
    w.G.refuse = false; w.G.now += 61000; w.envMirrorOn("drill");
    ok("…and it does", w.G.envWrites.length === 3 && ("ha_envm_howe_lincoln" in w.G.ls));
    finish(); }); }
function finish(){
console.log("\n── release read-back ──");
{ const w = booted({ user: { uid: "fam1" } }); const n0 = w.G.envWrites.length; w.G.toasts.length = 0;
  const hold = w.G.masteryData[KID + "_settings"].cat_hold;
  const n = w.fire("release/ms2027/all", { soils: { openedAt: 1, by: "t1" } });
  ok("the teacher sends out the Soils station: exactly ONE targeted removal — mastery/<kid>_settings/cat_hold/<deck> — on the FAMILY database", n === 1 && w.G.writes.length === 1 && w.G.writes[0][0] === "remove" && w.G.writes[0][1] === "mastery/" + KID + "_settings/cat_hold/" + DK.st, w.G.writes);
  ok("the hold is cleared in memory; the other holds stand (General, AAS Words); nothing was ever SET", !(DK.st in hold) && hold[DK.gt] === true && hold["AAS Words"] === true && !w.G.writes.some(x => x[0] !== "remove"));
  ok("notice: 🌿 <deck> released by your teacher (toast + the card)", w.G.toasts.length === 1 && w.G.toasts[0] === "\u{1F33F} " + DK.st + " released by your teacher" && /released by your teacher/.test(w.envmBodyHtml()));
  ok("the Envirothon project gets nothing from a release but the next summary (held:false now), after the debounce", w.G.envWrites.length === n0 && w.G.timers.length === 1);
  w.tick(); ok("…that summary says Soils is no longer held", w.G.envWrites.length === n0 + 1 && w.G.envWrites[n0][2].summary.byDeck[DK.st].held === false);
  const w1 = w.G.writes.length; w.fire("release/ms2027/all", { soils: { openedAt: 1, by: "t1" } });
  ok("the same release again (listener re-fire) → idempotent: no second removal", w.G.writes.length === w1);
  w.fire("release/ms2027/all", { forestry: true, "Forestry · Terms": true });
  ok("a station already open (Forestry) → nothing to clear, nothing written", w.G.writes.length === w1);
  w.fire("release/ms2027/students/howe_lincoln", { [DK.gt]: { openedAt: 2, by: "t1" } });
  ok("a per-student release of ONE deck by its key clears just that deck", w.G.writes.length === w1 + 1 && w.G.writes[w1][1] === "mastery/" + KID + "_settings/cat_hold/" + DK.gt && hold["AAS Words"] === true);
  w.fire("release/ms2027/all", null); w.fire("release/ms2027/all", { wildlife: false, nonsense: true });
  ok("an empty / false / unknown release does nothing", w.G.writes.length === w1 + 1);
  ok("the mirror never re-holds: a release that disappears leaves the open decks open", (w.fire("release/ms2027/all", {}), !(DK.st in hold) && !(DK.gt in hold)));
  ok("a repaint was asked for after a release", w.G.repaints >= 1); }
{ const w = booted({ user: { uid: "fam1" }, dry: true }); w.fire("release/ms2027/all", { soils: true });
  ok("dry run: the hold clears in memory, the family database is not written", !(DK.st in w.G.masteryData[KID + "_settings"].cat_hold) && w.G.writes.length === 0); }
{ const w = booted({ user: { uid: "fam1" } }); const hold = w.G.masteryData[KID + "_settings"].cat_hold;
  w.fire("release/ms2027/all", { soils: true, general: true });
  ok("two stations in one release → two removals, one per deck, no hold set", w.G.writes.length === 2 && w.G.writes.every(x => x[0] === "remove") && Object.keys(hold).join() === "AAS Words"); }

console.log("\n── season lock ──");
{ const w = booted({ user: { uid: "fam1" } }); const n0 = w.G.envWrites.length;
  w.fire("release/locked", true);
  ok("release/locked = true: the card says season closed", w._envm.locked === true && /season closed/.test(w.envmBodyHtml()));
  w.G.now += 120000; w.G.masteryData[KID].push({ id: "n", subject: DK.ft, prompt: "Silviculture", tier: "daily", status: "introduction" }); w.envMirrorOn("study"); w.envmSendNow();
  ok("locked: a save and Send now publish nothing", w.G.envWrites.length === n0);
  ok("locked never touches Howe: no family write, holds unchanged", w.G.writes.length === 0 && w.G.masteryData[KID + "_settings"].cat_hold[DK.gt] === true);
  w.fire("release/locked", false);
  ok("unlocked: publishing resumes with the pending change", w._envm.locked === false && w.G.envWrites.length === n0 + 1);
  w.fire("release/locked", { locked: true }); ok("an object {locked:true} locks too", w._envm.locked === true); }

console.log("\n── the hooks in index.html (one guarded line each) ──");
ok("study-session save (_mstSaveInner) → envMirrorOn(\"study\") right after the log entry lands in memory", /masteryData\.studyLog\[kid\]\[sid\]\[todayKey\]=entry;\n  if\(typeof envMirrorOn==="function"\) envMirrorOn\("study"\);/.test(src));
ok("Mom-drill save (mastSaveResults) → envMirrorOn(\"drill\") right after the history entry lands in memory", /masteryData\.history\[masteryKid\]\[today\.replace\(\/-\/g,""\)\]=histEntry;\n  if\(typeof envMirrorOn==="function"\) envMirrorOn\("drill"\);/.test(src));
ok("unit enroll (unitStageEnroll) → envMirrorOn(\"enroll\") after the session hook", /envEnrollSession\(u,f\.kid\);   \/\/ 🌿 ENVUNIT: his own session, once\n  if\(typeof envMirrorOn==="function"\) envMirrorOn\("enroll"\);/.test(src));
ok("boot catch-up: the first mastery arrival, after _haMastReady (after initFb's default app + db)", /_haMastReady=true;[^\n]*\n      if\(_mastFirst&&typeof envMirrorOn==="function"\) envMirrorOn\("boot"\);/.test(src) && src.indexOf('envMirrorOn("boot")') > src.indexOf("function initFb()"));
ok("Settings: the card rides after the voice card, Mom-only inside", /pinHtml\+=renderTtsVoiceCard\(\);[^\n]*\n  if\(typeof envMirrorCardHtml==="function"\) pinHtml\+=envMirrorCardHtml\(\);/.test(src));
const _siteA=src.indexOf("// ENVSITE_START"), _siteB=src.indexOf("// ENVCONSOLE_END"); const _outside=(src.slice(0, a) + src.slice(b)).replace(_siteA>0?src.slice(_siteA,_siteB):"","");   // 🌿 ENVSITE (2026-10-28) calls envMirrorOn("enroll") from its own block — a sibling feature, not a hook
ok("exactly five hook lines outside the block, all typeof-guarded", (_outside).split("\n").filter(l => /envMirrorOn\(|envMirrorCardHtml\(/.test(l)).length === 5 && (_outside).split("\n").filter(l => /envMirrorOn\(|envMirrorCardHtml\(/.test(l)).every(l => /typeof envMirror(On|CardHtml)==="function"/.test(l)));
ok("the default-app guards are untouched (two, as before)", (src.match(/if\(!\(firebase\.apps&&firebase\.apps\.length\)\) firebase\.initializeApp\(FB_CFG\)/g) || []).length === 2);
ok("the block never calls firebase.database() / firebase.auth() on the default app, never db.ref except the hold removal", !/firebase\.database\(\)|firebase\.auth\(\)/.test(block) && (block.match(/(^|[^e])db\.ref\(/g) || []).length === 1 && /db\.ref\("mastery\/"\+kid\+"_settings\/cat_hold\/"\+dk\)\.remove\(\)/.test(block));
ok("every write in the block is targeted: one update at students/<sid>, one remove of a cat_hold leaf; no set()", !/\.set\(/.test(block) && (block.match(/\.update\(/g) || []).length === 1 && /_envm\.edb\.ref\("students\/"\+sid\)\.update\(\{summary:s,meta:meta\}\)/.test(block));
ok("every Envirothon write is behind the dry-run check", /if\(typeof _dryRun==="function"&&_dryRun\(\)\) return 0;/.test(block.slice(block.indexOf("function envmPublishAll"), block.indexOf("function envmPublishKid"))));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
}
