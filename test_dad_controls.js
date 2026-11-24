/*
 * test_dad_controls.js — DADCTL: Dad with his code in may use the ⚙ Star rules in the 📒 Ledger, the same as Mom (her words
 * 2026-11-23: "dad will need to be able to deduct and check off etc too"). house.js LEDGERRULES: lgRulesOk() = Mom, or Dad's own link
 * (_kioskD()) with his code in (dadAwardOk()) — the ➖ Excuse / ✕ today gate. His fall / pause switch carries by:"dad"; take/<kid> stays a
 * bare false. The panel's two "›" lines stay Mom's (their homes, the 🔎 Spot check card and Chores & Stars ▸ Points, are Mom's pages).
 * The 🔎 Spot check's ✓ / ✗ and the Click-off Log's ⚠️ −100 are NOT opened: neither is drawn or reachable on Dad's link (section D
 * proves they are unchanged).
 * The WHOLE app runs per device (test_fixtures/house_world.js) on a made-up family (kid_a … kid_d), Mon 11/23 → Thu 11/26:
 *   kid_a 🧹 Make the bed (daily 2) · Dust the shelves (Wed 10) · Wipe the sink (Wed 10)   kid_b 🧹 Feed the dog (daily 2) ·
 *   Sweep the porch (Wed 10)   kid_c 🧹 Toys in the bin (daily 3). The 🔎 Spot check's extra stars are ON at 100.
 * Checks: A an unlocked Dad's ⚙ and flips = Mom's (the same writes, values + by:"dad"; the same bank afterwards; his own 🧾 −100 obeys
 *   the switches, with the toast) · B Mom, a locked Dad, a kid's device and a non-Dad device with the code typed: = the app before
 *   (byte-identical HTML, the same answers, zero writes) · C the two "›" lines for Dad · D the spot check and the Click-off Log, unchanged
 *   for Dad · E dryrun · F the lock ends it.
 * "The app before" = THIS tree's house.js with DADCTL taken out (no git, no pinned commit; each piece must match exactly once).
 * DC_INDEX / DC_HJS = other copies (a mutation check). DC_DUMP = a file for the preview page's drawings.
 * run: node test_dad_controls.js
 */
"use strict";
const fs = require("fs"), path = require("path");
const W = require(path.join(__dirname, "test_fixtures", "house_world.js"));
let pass = 0, fail = 0; const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x).slice(0, 900) + ")" : "")); } };
const J = x => JSON.stringify(x), clone = x => JSON.parse(J(x));
const IDX = process.env.DC_INDEX || path.join(__dirname, "index.html"), HJS = fs.readFileSync(process.env.DC_HJS || path.join(__dirname, "house.js"), "utf8");

// ── the app before: this tree's house.js, DADCTL taken out ──
const C6 = require(path.join(__dirname, "test_fixtures", "carve_c6.js"));   // C6 (test_chore_zero_daily.js) is built on this: its app before goes too
const BASE_HJS = (() => { let s = C6.hjs(fs.readFileSync(path.join(__dirname, "house.js"), "utf8"));
  const R = (a, b, l) => { const n = s.split(a).length - 1; if (n !== 1) throw new Error("test_dad_controls: the app before cannot be built — " + l + " found " + n + "×"); s = s.replace(a, () => b); };
  R('function lgRulesMom(){ return typeof momHere==="function"&&momHere(); }\nfunction lgRulesOk(){ return lgRulesMom()||(typeof _kioskD==="function"&&_kioskD()&&typeof dadAwardOk==="function"&&dadAwardOk()); }\nfunction lgRBy(v){ if(!lgRulesMom()) v.by="dad"; return v; }\n',
    'function lgRulesOk(){ return typeof momHere==="function"&&momHere(); }\n', "the gate");
  R('lgRBy(lgRFallOn(kid)?{on:false}:{from:lgRToday()})', 'lgRFallOn(kid)?{on:false}:{from:lgRToday()}', "the fall switch's by");
  R('lgRBy(lgRPaused()?{from:lgRToday()}:{on:true})', 'lgRPaused()?{from:lgRToday()}:{on:true}', "the pause's by");
  R('lgRBy({from:lgRToday()})', '{from:lgRToday()}', "the take switch's by (C3 made On an object)");
  R(`function lgRLine(t,where,js){ const m=lgRulesMom(); return '<div'+(m?' onclick="'+js+'" style="cursor:pointer;padding:4px 0"':' style="padding:4px 0"')+'><b>'+esc(t)+(m?' ›':'')+'</b>`,
    `function lgRLine(t,where,js){ return '<div onclick="'+js+'" style="cursor:pointer;padding:4px 0"><b>'+esc(t)+' ›</b>`, "the › lines");
  R('function lgRulesGoSpot(){ if(!lgRulesMom())', 'function lgRulesGoSpot(){ if(!lgRulesOk())', "› Penalty");
  R('function lgRulesGoPoints(){ if(!lgRulesMom())', 'function lgRulesGoPoints(){ if(!lgRulesOk())', "› Mom checks");
  if (/lgRulesMom|lgRBy/.test(s)) throw new Error("test_dad_controls: the app before still has DADCTL");
  return s; })();
console.log("(the app before: this tree's house.js with DADCTL taken out)");

const K = o => Object.assign({ src: { kind: "routine" }, status: "active", area: "cleaning", verdict: "", note: "", level: 1, minutes: 5 }, o);
const FAM = () => ({
  a_bed: K({ label: "Make the bed", emoji: "🛏", who: "kid_a", slot: "chores", cad: "daily", pts: 2, order: 0 }),
  a_dust: K({ label: "Dust the shelves", emoji: "🪶", who: "kid_a", slot: "chores", cad: "wk:2", pts: 10, order: 1 }),
  a_sink: K({ label: "Wipe the sink", emoji: "🚰", who: "kid_a", slot: "chores", cad: "wk:2", pts: 10, order: 2 }),
  b_dog: K({ label: "Feed the dog", emoji: "🐶", who: "kid_b", slot: "chores", cad: "daily", pts: 2, area: "animals", order: 0 }),
  b_porch: K({ label: "Sweep the porch", emoji: "🧺", who: "kid_b", slot: "chores", cad: "wk:2", pts: 10, order: 1 }),
  c_toys: K({ label: "Toys in the bin", emoji: "🧩", who: "kid_c", slot: "chores", cad: "daily", pts: 3, order: 0 })
});
const dOf = n => new Date(2026, 10, 16 + n), isoN = n => { const d = dOf(n); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
const go = (w, n, h) => { const d = dOf(n); return w.at(d.getFullYear(), d.getMonth() + 1, d.getDate(), h, 0); };
const CAP = "globalThis.__pop='';globalThis.__toast=[];globalThis.__cf=[];document.body.insertAdjacentHTML=function(p,h){ globalThis.__pop=h; };gwShowToast=function(m){ __toast.push(m); };confirm=function(m){ __cf.push(m); return true; };tab='moms-plan';HA_LS.setItem('ha_ledger_hello','1');1";
const loadH = (d, hjs) => { if (d.run("typeof lgShow") !== "function") d.run(hjs); };
async function mkWorld(hjs) {
  const settings = Object.assign(clone(W.FX.db.settings || {}), { spotCheck: { penalty: { on: true, pts: 100 } } });
  const w = await W.world({ index: IDX, household: { jobs: FAM(), people: clone(W.PEOPLE), meta: { takeover: 1, engine: { mode: "preview", on: "2026-11-09" } } }, tree: { config: clone(W.FX.db.config), settings } });
  const A = w.boot("A", "devA", { mom: true }), B = w.boot("B", "devB"), Dd = w.boot("D", "devD"), Kk = w.boot("Kk", "devK");
  Dd.run("HA_LS.setItem('ha_kiosk','dad');1"); Kk.run("HA_LS.setItem('ha_kiosk','routines');1");
  for (const d of [A, B, Dd, Kk]) { d.run(CAP); loadH(d, hjs); }
  await w.flush();
  for (const n of [7, 8, 9]) { await go(w, n, 18); tick(Kk, "kid_a", "Make the bed"); tick(Kk, "kid_b", "Feed the dog"); await w.flush(); }
  await go(w, 10, 8);   // Thursday: kid_a's dust and sink and kid_b's porch (all Wed) are waiting, 10 → 8
  return { w, A, B, Dd, Kk, hjs };
}
const idxOf = (d, kid, label) => d.run("(function(){ const d0=day; day=_todayDay; try{ return (rtStepsFor('chores','" + kid + "',false,day)||[]).findIndex(function(x){ return x&&x.label===" + J(label) + "&&x.cad!=='none'; }); } finally{ day=d0; } })()");
function tick(d, kid, label) { const i = idxOf(d, kid, label); if (i < 0) return -1; d.run("(function(){ day=_todayDay; toggleRtStep('chores','" + kid + "'," + i + "); })()"); return i; }
const LG = (d, js) => d.run("(function(){ __pop=''; " + js + "; return __pop; })()");
const page = (d, f) => { d.run("globalThis.__el={innerHTML:'',style:{},appendChild(){},querySelector(){ return null; },querySelectorAll(){ return []; }};1"); try { d.run(f + "(__el);1"); } catch (e) { return "threw " + e.message; } return d.run("__el.innerHTML"); };
const txt = h => String(h || "").replace(/<[^>]+>/g, " ").replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
const writes = (w, m) => w.since(m || 0).map(l => l.op + " " + l.path.replace(/(\/adjustments\/)[^/]+$/, "$1*"));   // a bank line's id is random
const bankOf = (w, kid) => Object.values(w.get("bank/" + kid + "/adjustments") || {}).map(a => [a.amount, a.note]).sort((x, y) => J(x) < J(y) ? -1 : 1);
const logKey = (d, kid, label) => JSON.parse(d.run("(function(){ const wk=activeWk(), dn=_todayDay, L=((routineLog[" + J(kid) + "]||{})[wk]||{})[dn]||{}; const k=Object.keys(L).filter(function(k){ return L[k]&&L[k].act==='on'&&L[k].label===" + J(label) + "; }).pop(); return JSON.stringify(k?[wk,dn,k]:null); })()"));
const spotPick = (d, kid, label, pts) => d.run("(function(){ const i=(rtStepsFor('chores'," + J(kid) + ",false,_todayDay)||[]).findIndex(function(x){ return x&&x.label===" + J(label) + "; }); spotData[" + J(kid) + "]=spotData[" + J(kid) + "]||{}; spotData[" + J(kid) + "][_spIso()]={n:2,picks:[{k:'s:chores:'+i,kind:'step',slot:'chores',i:i,d:_todayDay,label:" + J(label) + ",type:'chore',pts:" + pts + "}]}; return i; })()");
const SR = "household/meta/starRules";
const GEAR = /<button onclick="lgRulesToggle\(\)" title="To change the star rules, tap ⚙" aria-label="Star rules" style="[^"]*">⚙<\/button>/;
const unlink = h => String(h).replace(/<div onclick="lgRulesGo(?:Spot|Points)\(\)" style="cursor:pointer;padding:4px 0"><b>([^<]*) ›<\/b>/g, '<div style="padding:4px 0"><b>$1</b>');
const DUMP = {};

(async () => {
// ── A ──
console.log("\n── A · an unlocked Dad's ⚙ and flips = Mom's ──");
const M = await mkWorld(HJS), D = await mkWorld(HJS);
M.actor = M.A; D.actor = D.Dd; D.Dd.run("dadUnlocked=true;1");
{ ok("(setup) Dad's device: his own link, his code in, not Mom", D.Dd.run("_kioskD()") === true && D.Dd.run("dadAwardOk()") === true && D.Dd.run("momHere()") === false && D.Dd.run("lgRulesOk()") === true);
  const hm = LG(M.A, "lgShow()"), hd = LG(D.Dd, "lgShow()");
  ok("the ⚙ is in the ledger's header for him, the same button as Mom's, before ✕", GEAR.test(hd) && hm.match(GEAR)[0] === hd.match(GEAR)[0] && /⚙<\/button><button onclick="lgClose\(\)"/.test(hd));
  DUMP.dadClosed = hd;
  const pm = LG(M.A, "lgRulesToggle()"), pd = LG(D.Dd, "lgRulesToggle()");
  const panel = h => (String(h).match(/<div id="lg-rules"[\s\S]*?<\/div><\/div><\/div>(?=<div|<\/div>|$)/) || [""])[0];
  ok("⚙ opens his panel: the same switches, words and states as Mom's; only the two \"›\" lines are plain text", M.A.run("lgRulesHTML()") !== "" && unlink(M.A.run("lgRulesHTML()")) === D.Dd.run("lgRulesHTML()") && M.A.run("lgRulesHTML()") !== D.Dd.run("lgRulesHTML()") && /id="lg-rules"/.test(pd) && (pd.match(/role="switch"/g) || []).length === 9, [txt(D.Dd.run("lgRulesHTML()")).slice(0, 300)]);
  DUMP.dadOpen = pd; DUMP.momOpen = pm;
  const flip = (S, js, p) => { const m = S.w.mark(); const r = S.actor.run(js); return { r, w: writes(S.w, m), v: S.w.get(p) }; };
  const same = (lab, js, p, isObj) => { const a = flip(M, js, p), b = flip(D, js, p);
    const want = isObj ? J(Object.assign({}, a.v, { by: "dad" })) : J(a.v);
    ok(lab + ": his tap = Mom's: one " + (a.w[0] || "?") + " (" + J(a.v) + "), his " + (isObj ? "+ by:\"dad\"" : "the same value"), a.r === true && b.r === true && a.w.length === 1 && J(a.w) === J(b.w) && J(b.v) === want && !(isObj && a.v && a.v.by), [a, b]); };
  same("Stars fall when late, kid_a Off", "lgRuleFall('kid_a')", SR + "/fall/kid_a", true);
  same("Take stars away, kid_b Off", "lgRuleTake('kid_b')", SR + "/take/kid_b", false);
  await M.w.flush(); await D.w.flush();
  ok("…both devices now read: kid_a's stars don't fall, kid_b's aren't taken", [M, D].every(S => S.Kk.run("starFallFrom('kid_a')") === "~" && S.Kk.run("starTakeOk('kid_b')") === false && S.A.run("starTakeOk('kid_a')") === true));
  // the same bank afterwards: the kids tick, the grown-up docks, Mom spot-checks
  const act = async S => { const o = {}; S.actor.run("__toast.length=0;__cf.length=0;1");
    tick(S.Kk, "kid_a", "Dust the shelves"); tick(S.Kk, "kid_b", "Sweep the porch"); tick(S.Kk, "kid_a", "Make the bed"); tick(S.Kk, "kid_b", "Feed the dog"); await S.w.flush();
    const kb = logKey(S.A, "kid_b", "Feed the dog"), ka = logKey(S.A, "kid_a", "Make the bed");
    let m = S.w.mark(); S.actor.run("ckLogDock('step','kid_b'," + J(kb.join("/")) + ",'Feed the dog')"); await S.w.flush(); o.refused = writes(S.w, m).map(x => x.replace(/-P\d+$/, "*")); o.toast = S.actor.run("JSON.stringify(__toast)"); o.ask1 = S.actor.run("__cf[0]||''"); o.offRec = (({ flagTs, ...x }) => x)(S.w.get("routineLog/kid_b/" + kb.join("/")) || {});
    m = S.w.mark(); S.actor.run("ckLogDock('step','kid_a'," + J(ka.join("/")) + ",'Make the bed')"); await S.w.flush(); o.dock = writes(S.w, m); o.flagBy = (S.w.get("routineLog/kid_a/" + ka.join("/")) || {}).flagBy;
    spotPick(S.A, "kid_b", "Sweep the porch", 8); S.A.run("__cf.length=0;1"); S.A.run("spResolve('kid_b',0,'no')"); await S.w.flush(); o.spotAsk = S.A.run("__cf[0]||''");
    o.who = [bankOf(S.w, "kid_a"), bankOf(S.w, "kid_b")].flat().filter(x => / · by (Mom|Dad)$/.test(x[1])).map(x => x[1].slice(-3));
    o.bank = [bankOf(S.w, "kid_a"), bankOf(S.w, "kid_b")].map(L => L.map(x => [x[0], x[1].replace(/ · by (Mom|Dad)$/, "")])); return o; };   // FLAGWHO: a dock's line says who (compared below)
  const am = await act(M), ad = await act(D);
  ok("his switches pay the same: kid_a's late dust pays 10 (not 8), kid_b's porch 8 — the same Star Bank lines as Mom's world (but the dock's \" · by Mom\" / \" · by Dad\", FLAGWHO)", J(am.bank) === J(ad.bank) && J(am.who) === J(["Mom"]) && J(ad.who) === J(["Dad"]) && am.bank[0].some(x => x[0] === 10 && /Dust the shelves/.test(x[1])) && am.bank[1].some(x => x[0] === 8 && /Sweep the porch/.test(x[1])), [am.bank, ad.bank]);
  ok("his own 🧾 −100 on kid_b (Take stars away off): as Mom's — the same ask (no stars, why), ONE write marking the line with penalty 0, no bank line; the mark says Dad (FLAGWHO)", J(ad.refused) === J(am.refused) && ad.refused.length === 1 && /^update routineLog\/kid_b\//.test(ad.refused[0]) && ad.ask1 === am.ask1 && /Taking stars away is off for .*so no stars come off\./.test(ad.ask1) && ad.toast === "[]" && ad.offRec.penalty === 0 && ad.offRec.flagBy === "dad" && am.offRec.flagBy === "mom" && !ad.bank[1].some(x => /false check-off/.test(x[1])), [am.refused, ad.refused, ad.offRec]);
  ok("…his −100 on kid_a works as before (the switch is on for kid_a): the same writes as Mom's, the mark says flagBy \"dad\" (hers \"mom\")", J(ad.dock) === J(am.dock) && ad.dock.length > 0 && ad.flagBy === "dad" && am.flagBy === "mom", [am.dock, ad.dock]);
  ok("…Mom's 🔎 ✗ on kid_b after HIS switch: the porch back to not done, no extra 100 (\"…so nothing more comes off\"), as in Mom's world", am.spotAsk === ad.spotAsk && /so nothing more comes off/.test(ad.spotAsk) && !ad.bank[1].some(x => /Spot check/.test(x[1])));
  // pause, and back on
  same("⏸ Pause On", "lgRulePause()", SR + "/pause", true);
  await M.w.flush(); await D.w.flush();
  ok("…the banner on his ledger says \"Tap ⚙ to change.\" (he can)", /⏸ Star rules are paused for everyone: no stars fall and none are taken\. Tap ⚙ to change\./.test(txt(LG(D.Dd, "lgRulesOpen=false;lgShow()"))));
  for (const S of [M, D]) { tick(S.Kk, "kid_a", "Wipe the sink"); await S.w.flush(); }
  const pz = async S => { S.actor.run("__toast.length=0;__cf.length=0;1"); const k = logKey(S.A, "kid_a", "Wipe the sink"), m = S.w.mark(); S.actor.run("ckLogDock('step','kid_a'," + J(k.join("/")) + ",'Wipe the sink')"); await S.w.flush();
    return { w: writes(S.w, m).map(x => x.replace(/-P\d+$/, "*")), t: S.actor.run("JSON.stringify(__toast)"), a: S.actor.run("__cf[0]||''"), pen: (S.w.get("routineLog/kid_a/" + k.join("/")) || {}).penalty }; };
  const zm = await pz(M), zd = await pz(D);
  ok("paused (by him): his own −100 on kid_a takes nothing — it asks with ⏸ and marks the line, penalty 0, as Mom's does (FLAGWHO)", J(zd.w) === J(zm.w) && zd.w.length === 1 && zd.a === zm.a && /⏸ Star rules are paused for everyone, so no stars come off\./.test(zd.a) && zd.pen === 0 && zd.t === "[]", [zm, zd]);
  same("⏸ Pause Off", "lgRulePause()", SR + "/pause", true);
  same("Stars fall when late, kid_a On again", "lgRuleFall('kid_a')", SR + "/fall/kid_a", true);
  same("Take stars away, kid_b On again ({from: today}, C3)", "lgRuleTake('kid_b')", SR + "/take/kid_b", true);
  await M.w.flush(); await D.w.flush();
  ok("…the stored rules: his = Mom's but each object says by:\"dad\" (" + J(D.w.get(SR)) + ")", J(M.w.get(SR)) === J({ fall: { kid_a: { from: isoN(10) } }, take: { kid_b: { from: isoN(10) } }, pause: { from: isoN(10) } }) && J(D.w.get(SR)) === J({ fall: { kid_a: { from: isoN(10), by: "dad" } }, take: { kid_b: { from: isoN(10), by: "dad" } }, pause: { from: isoN(10), by: "dad" } }));
  ok("…and every device reads his the same as hers: kid_a falls from today, nothing paused, kid_b's stars may be taken again", [M, D].every(S => S.Kk.run("starFallFrom('kid_a')") === isoN(10) && S.Kk.run("starTakeOk('kid_b')") === true && S.B.run("starTakeOk('kid_a')") === true));
  ok("refused for him too: a made-up kid, \"mom\", a key with a period; nothing written", (() => { const m = D.w.mark(); return [D.Dd.run("lgRuleFall('kid_x')"), D.Dd.run("lgRuleTake('mom')"), D.Dd.run("lgRuleFall('kid_b.x')")].every(x => x === false) && D.w.since(m).length === 0; })());
  D.Dd.run("lgClose();lgRulesOpen=false;1"); M.A.run("lgClose();lgRulesOpen=false;1");
}

// ── B ──
console.log("\n── B · Mom, a locked Dad, a kid's device, a non-Dad device with the code typed: = the app before ──");
const L = await mkWorld(HJS), O = await mkWorld(BASE_HJS);
{ const probe = (S, d, opener) => { const o = {}, m = S.w.mark(); d.run("lgRulesOpen=false;1");
    o.h1 = LG(d, opener); o.h2 = LG(d, opener + ";lgRulesOpen=true;lgDraw()"); d.run("lgRulesOpen=false;1");
    o.r = ["lgRuleFall('kid_a')", "lgRuleTake('kid_b')", "lgRulePause()", "lgRulesGoSpot()", "lgRulesGoPoints()"].map(js => d.run(js));
    d.run("lgRulesToggle()"); o.open = d.run("lgRulesOpen"); o.writes = writes(S.w, m); o.rules = J(d.run("JSON.stringify(starRules())")); d.run("lgClose();lgRulesOpen=false;1"); return o; };
  const cmp = (lab, f, extra) => { const a = f(L), b = f(O); ok(lab, J(a) === J(b) && a.writes.length === 0 && a.r.every(x => x === false || x === undefined) && (!extra || extra(a)), [a.r, a.writes, txt(a.h1).slice(0, 200)]); };
  cmp("Dad's link, locked: the same ledger byte for byte (no ⚙, no panel even with it asked for), every switch refused, nothing written", S => probe(S, S.Dd, "lgShow()"), a => !/lgRules|⚙/.test(a.h1 + a.h2) && /📒 Ledger/.test(a.h1));
  cmp("a kid's device with house.js loaded: the ledger never opens; every switch refused; nothing written", S => probe(S, S.Kk, "ledgerOpen()"), a => a.h1 === "");
  for (const S of [L, O]) S.B.run("dadUnlocked=true;1");
  cmp("a device that is not on Dad's link, his code typed (dadUnlocked): refused as before (the gate needs his own link)", S => probe(S, S.B, "lgShow()"), a => !/lgRules/.test(a.h2));
  for (const S of [L, O]) S.B.run("dadUnlocked=false;1");
  // Mom: nothing changes — the same ledger, panel, writes and values
  const mom = async S => { const o = {}; o.h = LG(S.A, "lgShow()"); o.p = LG(S.A, "lgRulesToggle()"); o.f = [];
    for (const [js, p] of [["lgRuleFall('kid_a')", "/fall/kid_a"], ["lgRuleTake('kid_b')", "/take/kid_b"], ["lgRulePause()", "/pause"], ["lgRulePause()", "/pause"], ["lgRuleFall('kid_a')", "/fall/kid_a"], ["lgRuleTake('kid_b')", "/take/kid_b"]]) {
      const m = S.w.mark(); const r = S.A.run(js); await S.w.flush(); o.f.push([r, writes(S.w, m), S.w.get(SR + p)]); }
    o.after = LG(S.A, "lgDraw()"); S.A.run("lgClose();lgRulesOpen=false;1"); return o; };
  const ml = await mom(L), mo = await mom(O);
  const C6SET = /<div style="display:flex;align-items:center;gap:6px 8px;flex-wrap:wrap;[^"]*"><span style="flex:1 1 200px"><b>A 0 ⭐ daily not done 2 days in a row<\/b>[\s\S]*?>No stop<\/button><\/div>/g;   // C6's ⚙ line (test_chore_zero_daily.js): the one line the app before has not
  const c6n = [ml.p, ml.after].map(h => (String(h).match(C6SET) || []).length); ml.p = String(ml.p).replace(C6SET, ""); ml.after = String(ml.after).replace(C6SET, "");
  ok("Mom: the same ledger, the same panel (its \"›\" lines still tap through), the same six flips with the same writes and values as the app before", J(c6n) === J([1, 1]) && J(ml) === J(mo) && /onclick="lgRulesGoSpot\(\)"[^>]*><b>Penalty: 100 ⭐ ›/.test(ml.p) && ml.f.every(x => x[0] === true && x[1].length === 1), [ml.f, mo.f]);
  { const m = L.w.mark(); L.A.run("lgShow();lgRulesGoPoints()"); const sp = L.A.run("cpTab");
    ok("…her \"Mom checks before pay ›\" still goes to Chores & Stars ▸ Points, writing nothing", sp === "points" && L.w.since(m).length === 0); L.A.run("tab='moms-plan';mpSubView=null;1"); }
  // a device that leaves Mom mode (neither Mom nor an unlocked Dad) with the panel open
  const leave = S => { const Sd = S.w.boot("Sd" + (S === L ? "L" : "O"), "devSd", { mom: true }); Sd.run(CAP); loadH(Sd, S.hjs);
    const a = LG(Sd, "lgShow();lgRulesToggle()"); Sd.run("haMomOff();1"); const b = LG(Sd, "lgGo('kid_b',0,0)"); Sd.run("HA_LS.setItem('ha_kiosk','dad');1"); const c = LG(Sd, "lgShow()"); return { a: /id="lg-rules"/.test(a), b, c, open: Sd.run("lgRulesOpen") }; };
  await Promise.resolve(); const vl = leave(L), vo = leave(O); await L.w.flush(); await O.w.flush();
  ok("Mom's open panel on a device that leaves Mom mode, then turns Dad's link (code not typed): no panel, no switch, no ⚙ — byte for byte the app before", J(vl) === J(vo) && vl.a && vl.open === true && !/id="lg-rules"|role="switch"|lgRulesToggle/.test(vl.b + vl.c), [txt(vl.b).slice(0, 120)]);
}

// ── C ──
console.log("\n── C · the two \"›\" lines are Mom's ──");
{ const { w, Dd } = D; const p = LG(Dd, "lgShow();lgRulesToggle()"), m = w.mark();
  ok("his panel shows \"Penalty: 100 ⭐\" and \"Mom checks before pay: …\" as plain lines (no ›, no tap)", /<div style="padding:4px 0"><b>Penalty: 100 ⭐<\/b>/.test(p) && /<div style="padding:4px 0"><b>Mom checks before pay: [^<]*<\/b>/.test(p) && !/lgRulesGo/.test(p));
  const st0 = Dd.run("JSON.stringify([tab,mpSubView,cpTab,spSetOpen,lgRulesOpen])");
  ok("lgRulesGoSpot / lgRulesGoPoints refuse for him: nothing written, his page, the Spot check sheet and Chores & Stars untouched", Dd.run("lgRulesGoSpot()") === false && Dd.run("lgRulesGoPoints()") === false && Dd.run("JSON.stringify([tab,mpSubView,cpTab,spSetOpen,lgRulesOpen])") === st0 && w.since(m).length === 0, st0);
  Dd.run("lgClose();lgRulesOpen=false;1");
}

// ── D ──
console.log("\n── D · the 🔎 Spot check and the Click-off Log: not drawn for Dad, unchanged ──");
{ const dd = S => { const o = {}; S.Dd.run("dadUnlocked=false;1"); o.locked = page(S.Dd, "renderDadsDay"); S.Dd.run("dadUnlocked=true;1"); o.open = page(S.Dd, "renderDadsDay"); S.Dd.run("dadUnlocked=false;1"); return o; };
  const a = dd(L), b = dd(O);
  ok("Dad's Day, locked and unlocked: the same page as before; no 🔎 Spot check card, no ✓ / ✗, no Click-off Log or door to Chores & Stars", J(a) === J(b) && a.open !== a.locked && [a.locked, a.open].every(h => !/sp-card|spResolve|rlogFlag|Click-off Log|mpGoto\(\\?'chores\\?'\)|Chores &amp; Stars|Chores & Stars/.test(h)) && /🔓 Star controls unlocked/.test(a.open), [a.open.slice(0, 120)]);
  const tryIt = async S => { const { w, Dd, Kk } = S; Dd.run("dadUnlocked=true;1"); tick(Kk, "kid_c", "Toys in the bin"); await w.flush();
    spotPick(Dd, "kid_c", "Toys in the bin", 3); const k = logKey(Dd, "kid_c", "Toys in the bin"), m = w.mark(), b0 = J(bankOf(w, "kid_c"));
    const r = [Dd.run("spResolve('kid_c',0,'no')"), Dd.run("spResolve('kid_c',0,'ok')"), Dd.run("rlogFlag('kid_c','" + k.join("','") + "')"), Dd.run("mdCardSpotCheck()")];
    Dd.run("dadUnlocked=false;1"); return { r, w: writes(w, m), bank: J(bankOf(w, "kid_c")) === b0 }; };
  const ta = await tryIt(L), tb = await tryIt(O);
  ok("an unlocked Dad's spResolve (✓ and ✗) and rlogFlag are refused exactly as before: nothing written, no stars move, no card drawn", J(ta) === J(tb) && ta.r[0] === false && ta.r[1] === false && ta.r[2] === undefined && ta.r[3] === "" && ta.w.length === 0 && ta.bank, [ta, tb]);
}

// ── E ──
console.log("\n── E · dryrun writes nothing ──");
{ const { w, A } = D; const Dr = w.boot("Dr", "devDr"); Dr.run("HA_LS.setItem('ha_kiosk','dad');HA_LS.setItem('ha_dryrun','1');dadUnlocked=true;1"); Dr.run(CAP); loadH(Dr, HJS); await w.flush();
  const m = w.mark(); const r = [Dr.run("lgRuleTake('kid_c')"), Dr.run("lgRuleFall('kid_c')"), Dr.run("lgRulePause()")]; await w.flush();
  ok("?dryrun=1 on his link, code in: the flips show on that screen (kid_c Off, Off, paused) and nothing reaches the database", Dr.run("_dryRun()") === true && r.every(x => x === true) && w.since(m).length === 0 && w.get(SR + "/take/kid_c") == null && /Kid C Stars fall when late Off Take stars away Off/.test(txt(LG(Dr, "lgShow();lgRulesOpen=true;lgDraw()"))) && /paused for everyone/.test(txt(Dr.run("__pop"))));
  ok("…every other device still reads the house as it was", A.run("starTakeOk('kid_c')") === true && A.run("(starRules().pause||{}).on") !== true);
}

// ── F ──
console.log("\n── F · 🔒 Lock ends it ──");
{ const { w, Dd } = D; Dd.run("dadUnlocked=true;1"); const h0 = LG(Dd, "lgShow()"); Dd.run("lgClose();dadLock();1");
  const m = w.mark(), h1 = LG(Dd, "lgShow()"), r = [Dd.run("lgRuleFall('kid_a')"), Dd.run("lgRuleTake('kid_a')"), Dd.run("lgRulePause()")];
  ok("unlocked: the ⚙; after his 🔒 Lock (dadLock): no ⚙ and every switch refused, nothing written", GEAR.test(h0) && !/⚙|lgRules/.test(h1) && r.every(x => x === false) && w.since(m).length === 0 && Dd.run("dadAwardOk()") === false);
  Dd.run("lgClose();1");
}

if (process.env.DC_DUMP) fs.writeFileSync(process.env.DC_DUMP, J(DUMP));
console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
