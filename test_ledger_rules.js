/*
 * test_ledger_rules.js — ⚙ the star rules in the 📒 Ledger pop-up, slice L4 of DESIGN_chore_ledger_2026-11-21 (§4; her "Yes, start it"
 * 2026-11-23). "Stars fall when late" and "Take stars away", one switch per kid, and "⏸ Pause for everyone", at household/meta/starRules
 * (house.js LEDGERRULES writes them, Mom only; index.html STARRULES reads them on every device). A flip never reaches back.
 * The WHOLE app runs per device (test_fixtures/house_world.js) on a made-up family (kid_a … kid_d), the clock moved day by day from
 * Mon 11/23 (day 7) to Sat 11/28 (day 12):
 *   kid_a  🧹 Make the bed (daily 2) · Vacuum the den (Tue 10) · Dust the shelves (Wed 10) · Wipe the sink (Wed 10) ·
 *             Shake the rugs (Thu 10) · Wipe the mirror (Fri 10)
 *   kid_b  🧹 Feed the dog (daily 2) · Sweep the porch (Wed 10) · Rake the leaves (Thu 10) · Fold the towels (Fri 10)
 *   kid_c  🧹 Toys in the bin (daily 3)
 * Nothing is done on its day but the daily rows, so Thursday has kid_a's vacuum (6 of 10), dust and sink (8 of 10) and kid_b's porch
 * (8 of 10) waiting; Friday adds the rugs and the leaves; Saturday the mirror and the towels. The 🔎 Spot check's extra stars are ON at 100.
 * Checks: A every switch at its default: every screen, the pop-up (but the ⚙), the database and every write = the app before, day by day,
 *   the penalty paths included · B each flip's one write (exact path and value, nothing else) · C fall OFF for one kid · D what was paid
 *   stays (a late tick before the flip; the ledger's words and ⭐ Give stars back) · E fall ON again (and off/on the same day) ·
 *   F ⏸ pause and un-pause (the same day) · G Take stars away OFF for one kid: the spot check, the Click-off Log's −100, 🧾's −100 ·
 *   H the two look-only lines · I Dad's link and a kid's device (and Mom's open panel on a device that leaves Mom mode or turns Dad's
 *   link) · J dryrun · K a second device sees the flip. C and F also read Kids' Corner's "still to get" and the 🧽 house panel's rows.
 * "The app before" = THIS tree with L4 taken out (no git, no pinned commit): index.html minus STARRULES, the kid argument the falling
 * stars' callers pass and the three take gates; house.js minus LEDGERRULES and its four hooks in LEDGERVIEW (each must match exactly once).
 * LR_INDEX / LR_HJS = other copies (a mutation check). LR_DUMP = a file for the preview page's drawings.
 * run: node test_ledger_rules.js
 */
"use strict";
const fs = require("fs"), path = require("path"), os = require("os");
const W = require(path.join(__dirname, "test_fixtures", "house_world.js"));
let pass = 0, fail = 0; const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x).slice(0, 900) + ")" : "")); } };
const J = x => JSON.stringify(x), clone = x => JSON.parse(J(x));
const IDX = process.env.LR_INDEX || path.join(__dirname, "index.html"), HJS = fs.readFileSync(process.env.LR_HJS || path.join(__dirname, "house.js"), "utf8");

// ── the app before: this tree, L4 taken out ──
const once = (src, what, from, to, label) => { const n = typeof from === "string" ? src.split(from).length - 1 : (src.match(from) || []).length;
  if (n !== 1) throw new Error("test_ledger_rules: the app before cannot be built — " + label + " found " + n + "× in " + what + " (must be exactly once)"); return src.replace(from, () => to); };
const BASE_IDX = (() => { let s = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
  const R = (a, b, l) => { s = once(s, "index.html", a, b, l); };
  R(/^\/\/ STARRULES_START[^\n]*\n[\s\S]*?^\/\/ STARRULES_END\n/m, "", "the STARRULES block");
  R('  const s=d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");\n  return s>=RT_FALL_FROM&&s>=starFallFrom(arguments[2])?n:0;   // STARRULES: [2] = kid\n',
    '  return (d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"))>=RT_FALL_FROM?n:0;\n', "rtFallDays");
  R("rtFallDays(st,n,arguments[2])", "rtFallDays(st,n)", "rtFallPay's kid");
  R("const from=[RT_DAILY_FROM,starFallFrom(kid)].sort()[1]", "const from=RT_DAILY_FROM", "C5's daily count (CHOREDAILY reads the fall switch too)");
  R("f=rtFallPay(st,n,arguments[2]);", "f=rtFallPay(st,n);", "rtFallPill's kid");
  R("?rtFallPay(_st0,rtLateDays(slot,kid,i),kid):_b0;", "?rtFallPay(_st0,rtLateDays(slot,kid,i)):_b0;", "toggleRtStep's kid");
  R("rtFallPill(st,sd?0:_wait[i],kid)", "rtFallPill(st,sd?0:_wait[i])", "rtSlotHTML's kid");
  R("rtFallPay(st,_ln,kid):(st.pts||0);", "rtFallPay(st,_ln):(st.pts||0);", "boardStatPop's kid");
  R("const f=rtFallPay(st,rtLateDays(slot,who,idx),who);", "const f=rtFallPay(st,rtLateDays(slot,who,idx));", "hhCleanRows's kid");
  R("?rtFallPay(steps[i],rtLateDays(slot,k,i),k):", "?rtFallPay(steps[i],rtLateDays(slot,k,i)):", "kcPointsHTML's kid");
  R('const p=rec.picks[j], pen=spPenalty(), _nt=pen.on&&typeof starTakeOk==="function"&&!starTakeOk(kid); if(_nt) pen.on=false;   // STARRULES\n', "const p=rec.picks[j], pen=spPenalty();\n", "the spot check's gate");
  R('+(_nt?"\\n\\n"+starTakeWhy(kid)+", so nothing more comes off.":"")', "", "the spot check's words");
  R('const off=typeof starTakeOk==="function"&&!starTakeOk(kid), who=', "const off=false, who=", "the Click-off Log's gate (FLAGWHO: Take off marks with no stars)");
  R("+starTakeWhy(kid)+", "+", "FLAGWHO's words");
  R(', off=typeof starTakeOk==="function"&&!starTakeOk(kid);   // FLAGWHO', ", off=false;   // FLAGWHO", "🧾's gate (FLAGWHO: Take off marks with no stars)");
  R("  const no=starTakeAt(kid,iso); if(no) return {n:0,why:no};   // the 📒 ⚙ switches, as they are at the drop\n", "", "C3's drop (CHOREDROP): its read of the switches");   // C3 reads L4's switches; without L4 a drop takes as if they were on
  if (/STARRULES|starTake|starFallFrom|starRules|arguments\[2\]\)/.test(s)) throw new Error("test_ledger_rules: the app before still mentions STARRULES");
  const t = path.join(os.tmpdir(), "ledger_rules_before_" + process.pid + ".html"); fs.writeFileSync(t, s); return t; })();
const BASE_HJS = (() => { let s = fs.readFileSync(path.join(__dirname, "house.js"), "utf8");
  const R = (a, b, l) => { s = once(s, "house.js", a, b, l); };
  R(/^\/\/ LEDGERRULES_START[^\n]*\n[\s\S]*?^\/\/ LEDGERRULES_END\n/m, "", "the LEDGERRULES block");
  R("const pay=rtFallPay(st,n,kid);   // ⚙ LEDGERRULES: that kid's switch", "const pay=rtFallPay(st,n);", "the ⏳ row's kid");
  R("+(typeof lgRulesBtn===\"function\"?lgRulesBtn():'')+'<button onclick=\"lgClose()\"", "<button onclick=\"lgClose()\"", "the header hook");
  R("+(typeof lgRulesTop===\"function\"?lgRulesTop():'')   // ⚙ LEDGERRULES: the panel, the ⏸ banner", "", "the panel hook");
  R("+(typeof lgRulesHello===\"function\"?lgRulesHello():'')", "", "the first-minute hook");
  if (/lgRules|LEDGERRULES/.test(s)) throw new Error("test_ledger_rules: the app before's house.js still mentions LEDGERRULES");
  return s.replace("</div>'<button onclick=\"lgClose()\"", "</div><button onclick=\"lgClose()\""); })();   // the header hook's quote, put back
console.log("(the app before: this tree with STARRULES / LEDGERRULES taken out)");

const K = o => Object.assign({ src: { kind: "routine" }, status: "active", area: "cleaning", verdict: "", note: "", level: 1, minutes: 5 }, o);
const FAM = () => ({
  a_bed: K({ label: "Make the bed", emoji: "🛏", who: "kid_a", slot: "chores", cad: "daily", pts: 2, order: 0 }),
  a_vac: K({ label: "Vacuum the den", emoji: "🧹", who: "kid_a", slot: "chores", cad: "wk:1", pts: 10, order: 1 }),
  a_dust: K({ label: "Dust the shelves", emoji: "🪶", who: "kid_a", slot: "chores", cad: "wk:2", pts: 10, order: 2 }),
  a_sink: K({ label: "Wipe the sink", emoji: "🚰", who: "kid_a", slot: "chores", cad: "wk:2", pts: 10, order: 3 }),
  a_rugs: K({ label: "Shake the rugs", emoji: "🧶", who: "kid_a", slot: "chores", cad: "wk:3", pts: 10, order: 4 }),
  a_mirror: K({ label: "Wipe the mirror", emoji: "🪞", who: "kid_a", slot: "chores", cad: "wk:4", pts: 10, order: 5 }),
  b_dog: K({ label: "Feed the dog", emoji: "🐶", who: "kid_b", slot: "chores", cad: "daily", pts: 2, area: "animals", order: 0 }),
  b_porch: K({ label: "Sweep the porch", emoji: "🧺", who: "kid_b", slot: "chores", cad: "wk:2", pts: 10, order: 1 }),
  b_leaves: K({ label: "Rake the leaves", emoji: "🍂", who: "kid_b", slot: "chores", cad: "wk:3", pts: 10, order: 2 }),
  b_towels: K({ label: "Fold the towels", emoji: "🧻", who: "kid_b", slot: "chores", cad: "wk:4", pts: 10, order: 3 }),
  c_toys: K({ label: "Toys in the bin", emoji: "🧩", who: "kid_c", slot: "chores", cad: "daily", pts: 3, order: 0 })
});
const dOf = n => new Date(2026, 10, 16 + n), isoN = n => { const d = dOf(n); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
const go = (w, n, h, mi) => { const d = dOf(n); return w.at(d.getFullYear(), d.getMonth() + 1, d.getDate(), h, mi || 0); };
const CAP = "globalThis.__pop='';globalThis.__toast=[];globalThis.__cf=[];document.body.insertAdjacentHTML=function(p,h){ globalThis.__pop=h; };gwShowToast=function(m){ __toast.push(m); };confirm=function(m){ __cf.push(m); return true; };tab='moms-plan';HA_LS.setItem('ha_ledger_hello','1');1";
async function mkWorld(index, hjs, penalty) {
  const settings = Object.assign(clone(W.FX.db.settings || {}), penalty === false ? {} : { spotCheck: { penalty: { on: true, pts: 100 } } });
  const w = await W.world({ index, household: { jobs: FAM(), people: clone(W.PEOPLE), meta: { takeover: 1, engine: { mode: "preview", on: "2026-11-09" } } }, tree: { config: clone(W.FX.db.config), settings } });
  const A = w.boot("A", "devA", { mom: true }), B = w.boot("B", "devB"), Dd = w.boot("D", "devD"), Kk = w.boot("Kk", "devK");
  Dd.run("HA_LS.setItem('ha_kiosk','dad');1"); Kk.run("HA_LS.setItem('ha_kiosk','routines');1");
  for (const d of [A, B, Dd, Kk]) d.run(CAP);
  await w.flush(); return { w, A, B, Dd, Kk, hjs };
}
const idxOf = (d, kid, label) => d.run("(function(){ const d0=day; day=_todayDay; try{ return (rtStepsFor('chores','" + kid + "',false,day)||[]).findIndex(function(x){ return x&&x.label===" + J(label) + "&&x.cad!=='none'; }); } finally{ day=d0; } })()");
const tick = (d, kid, label) => { const i = idxOf(d, kid, label); if (i < 0) return -1; d.run("(function(){ day=_todayDay; toggleRtStep('chores','" + kid + "'," + i + "); })()"); return i; };
const loadH = (d, hjs) => { if (d.run("typeof lgShow") !== "function") d.run(hjs); };
const LG = (d, js) => d.run("(function(){ __pop=''; " + js + "; return __pop; })()");
const txt = h => String(h || "").replace(/<[^>]+>/g, " ").replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
const ROWSPLIT = '<div style="display:flex;flex-wrap:wrap;align-items:baseline;gap:2px 8px;padding:5px 2px;';
const rowRaw = (h, name) => String(h).split(ROWSPLIT).slice(1).map(r => '<div ' + r.split("</div>")[0]).filter(r => r.indexOf(name) >= 0)[0] || "";
const rowT = (h, name) => txt(rowRaw(h, name));
const GEAR = /<button onclick="lgRulesToggle\(\)" title="To change the star rules, tap ⚙" aria-label="Star rules" style="[^"]*">⚙<\/button>/;
// a kid's own list as their device draws it, and one row's star pill
const draw = (d, kid) => d.run("(function(){ const d0=day; day=_todayDay; try{ rtOpen={}; return rtSlotHTML('chores'," + J(kid) + "); } finally{ day=d0; } })()");
const pill = (h, label) => { const r = String(h).split('<div class="mr-step').filter(x => x.indexOf(label + "<") >= 0 || x.indexOf(label + " <") >= 0)[0] || ""; return txt((r.match(/<span class="mr-pts">.*?⭐<\/span>/) || [""])[0]); };
const pop = (d, kid) => d.run("(function(){ let h=''; const b=document.body.insertAdjacentHTML; document.body.insertAdjacentHTML=function(w,x){ h=x; }; try{ boardStatPop(" + J(kid) + ",'chores',_todayDay); } finally{ document.body.insertAdjacentHTML=b; } return h; })()");
const kc = (d, kid) => d.run("kcPointsHTML(" + J(kid) + ")");
// Kids' Corner's "+N still to get" (what is left today, a waiting row counted at what it pays now) · the 🧽 house panel's rows for a kid
const kcLeft = (d, kid) => { const m = /\+(\d+) still to get/.exec(txt(kc(d, kid))); return m ? +m[1] : null; };
const hh = (d, kid) => JSON.parse(d.run("JSON.stringify(hhCleanRows(" + J(kid) + ",mwTodayIso(),_todayDay).map(function(r){ return {label:r.label,pts:r.pts,fall:r.fall,late:r.late}; }))"));
const hhFall = (d, kid, label) => { const r = hh(d, kid).filter(x => x.label === label)[0]; return r ? (r.fall === undefined ? "none" : r.fall) : "missing"; };
const adj = (w, kid) => (w.get("bank/" + kid + "/adjustments") || {});
const lines = (w, kid, s) => Object.values(adj(w, kid)).filter(a => a && String(a.note || "").indexOf(s) >= 0).map(a => a.amount);
const writes = (w, m) => w.since(m || 0).map(l => l.op + " " + l.path);
const SR = "household/meta/starRules";
// a routine log "on" line for a kid's chore today → [wk, day, key]
const logKey = (d, kid, label) => JSON.parse(d.run("(function(){ const wk=activeWk(), dn=_todayDay, L=((routineLog[" + J(kid) + "]||{})[wk]||{})[dn]||{}; const k=Object.keys(L).filter(function(k){ return L[k]&&L[k].act==='on'&&L[k].label===" + J(label) + "; })[0]; return JSON.stringify(k?[wk,dn,k]:null); })()"));
const spotPick = (d, kid, label, pts) => d.run("(function(){ const i=(rtStepsFor('chores'," + J(kid) + ",false,_todayDay)||[]).findIndex(function(x){ return x&&x.label===" + J(label) + "; }); spotData[" + J(kid) + "]=spotData[" + J(kid) + "]||{}; spotData[" + J(kid) + "][_spIso()]={n:2,picks:[{k:'s:chores:'+i,kind:'step',slot:'chores',i:i,d:_todayDay,label:" + J(label) + ",type:'chore',pts:" + pts + "}]}; return i; })()");
const DUMP = {};

(async () => {
// ── A ──
console.log("\n── A · every switch at its default: = the app before, every screen, the database and every write, day by day ──");
{ const N = await mkWorld(IDX, HJS), O = await mkWorld(BASE_IDX, BASE_HJS);
  const snap = S => { const o = {};
    for (const kid of ["kid_a", "kid_b", "kid_c"]) { o["list " + kid] = draw(S.A, kid); o["kidtab " + kid] = draw(S.Kk, kid); o["pop " + kid] = pop(S.A, kid); o["kc " + kid] = kc(S.Kk, kid);
      o["ledger " + kid] = LG(S.A, "lgGo('" + kid + "',0,0)").replace(GEAR, ""); o["week " + kid] = LG(S.A, "lgGo('" + kid + "',0,1)").replace(GEAR, ""); o["dad " + kid] = LG(S.Dd, "lgGo('" + kid + "',0,0)"); S.A.run("lgClose();lgWeek=false;1"); S.Dd.run("lgClose();1"); }
    o.db = J(S.w.db.tree.root); o.writes = J(writes(S.w)); return o; };
  let same = true, bad = [];
  for (const S of [N, O]) for (const d of [S.A, S.Dd]) loadH(d, S.hjs);
  for (const n of [7, 8, 9, 10, 11, 12]) for (const h of [7, 18]) {
    for (const S of [N, O]) { await go(S.w, n, h); if (h === 18) { tick(S.Kk, "kid_a", "Make the bed"); tick(S.Kk, "kid_b", "Feed the dog"); if (n === 10) tick(S.Kk, "kid_a", "Vacuum the den"); if (n === 11) tick(S.Kk, "kid_b", "Rake the leaves"); await S.w.flush(); } }
    const a = snap(N), b = snap(O); Object.keys(a).forEach(k => { if (a[k] !== b[k]) { same = false; bad.push(n + "/" + h + " " + k); } });
    if (n === 10 && h === 18) { DUMP.thuBefore = a["ledger kid_a"]; }
  }
  ok("6 days × morning and evening: each kid's list (Mom's tablet and a kid's), Mom's Kids today pop-up, Kids' Corner, the ledger (but its ⚙), the week, Dad's ledger, the whole database and every write = the app before", same, bad.slice(0, 8));
  ok("…the defaults read as before: starRules() {}, every kid falls from \"\" (RT_FALL_FROM alone), every kid's stars may be taken, nothing stored", N.A.run("JSON.stringify(starRules())") === "{}" && ["kid_a", "kid_b", "kid_c", "kid_d"].every(k => N.A.run("starFallFrom('" + k + "')") === "" && N.A.run("starTakeOk('" + k + "')") === true) && N.w.get(SR) == null);
  // the penalty paths at their default, in both worlds the same way (Saturday evening)
  const pen = S => { const m = S.w.mark(); const k1 = logKey(S.A, "kid_a", "Make the bed"), k2 = logKey(S.A, "kid_b", "Feed the dog");
    S.A.run("rlogFlag('kid_a','" + k1.join("','") + "')"); S.A.run("ckLogDock('step','kid_b'," + J(k2.join("/")) + ",'Feed the dog')");
    tick(S.Kk, "kid_c", "Toys in the bin"); spotPick(S.A, "kid_c", "Toys in the bin", 3); S.A.run("spResolve('kid_c',0,'no')");
    return { w: J(writes(S.w, m)), db: J(S.w.db.tree.root), cf: S.A.run("JSON.stringify(__cf)"), toast: S.A.run("JSON.stringify(__toast)") }; };
  const pa = pen(N), pb = pen(O);
  ok("the Click-off Log's ⚠️ −100, 🧾's −100 and the 🔎 Spot check's ✗ (+100) at the defaults: the same writes, database, asks and toasts as the app before", J(pa) === J(pb) && /🚩 false check-off dock/.test(pa.db) && /Spot check: not done/.test(pa.db), [pa.w, pb.w]);
  ok("…and the ⚙ is drawn only for Mom: the ledger's header, before ✕", GEAR.test(LG(N.A, "lgShow()")) && !/⚙/.test(LG(N.Dd, "lgShow()")));
  N.A.run("HA_LS.removeItem('ha_ledger_hello');1"); const hello = txt(LG(N.A, "lgShow()")); N.A.run("HA_LS.setItem('ha_ledger_hello','1');lgClose();1");
  ok("the first-minute card ends with the design's sentence: \"To change the star rules, tap ⚙.\"", /tap its name\. To change the star rules, tap ⚙\./.test(hello), hello.slice(0, 500));
}

// the world the switches are tried in
const S = await mkWorld(IDX, HJS); const { w, A, B, Dd, Kk } = S; loadH(A, HJS); loadH(Dd, HJS);
for (const n of [7, 8, 9]) { await go(w, n, 18); tick(Kk, "kid_a", "Make the bed"); tick(Kk, "kid_b", "Feed the dog"); await w.flush(); }
await go(w, 10, 8);

// ── B ──
console.log("\n── B · each switch's default, and each flip's one write ──");
{ const P = LG(A, "lgGo('kid_a',0,0);lgRulesToggle()");
  ok("⚙ opens the panel \"⚙ Star rules\": ⏸ Pause for everyone Off; every kid's Stars fall when late On and Take stars away On", /⚙ Star rules Done A change counts from now on\. Stars already paid or taken stay as they are\. ⏸ Pause for everyone On: no stars fall and none are taken, for every kid\. Off Kid A Stars fall when late On Take stars away On Kid B Stars fall when late On Take stars away On Kid C Stars fall when late On Take stars away On Kid D Stars fall when late On Take stars away On/.test(txt(P)), txt(P).slice(0, 600));
  ok("…each switch is a button with role=switch and aria-checked (9 here: one pause, two per kid)", (P.match(/role="switch" aria-checked="(true|false)"/g) || []).length === 9);
  const flip = (js, path) => { const m = w.mark(); const r = A.run(js); return { r, w: writes(w, m), v: w.get(path) }; };
  let f = flip("lgRuleFall('kid_a')", SR + "/fall/kid_a");
  ok("Stars fall when late, kid_a Off: one set of " + SR + "/fall/kid_a = {on:false}, nothing else", f.r === true && J(f.w) === J(["set " + SR + "/fall/kid_a"]) && J(f.v) === J({ on: false }), f);
  f = flip("lgRuleFall('kid_a')", SR + "/fall/kid_a");
  ok("…On again: one set of the same path = {from:\"2026-11-26\"} (today)", J(f.w) === J(["set " + SR + "/fall/kid_a"]) && J(f.v) === J({ from: isoN(10) }), f);
  f = flip("lgRuleTake('kid_c')", SR + "/take/kid_c");
  ok("Take stars away, kid_c Off: one set of " + SR + "/take/kid_c = false", J(f.w) === J(["set " + SR + "/take/kid_c"]) && f.v === false, f);
  f = flip("lgRuleTake('kid_c')", SR + "/take/kid_c");
  ok("…On again: that one path set to {from: today} (C3: \"On: it starts clean\" — a drop of a turn due before today takes nothing; starTakeOk reads it as On)", J(f.w) === J(["set " + SR + "/take/kid_c"]) && J(f.v) === J({ from: isoN(10) }) && A.run("starTakeOk('kid_c')") === true, f);
  f = flip("lgRulePause()", SR + "/pause");
  ok("⏸ Pause On: one set of " + SR + "/pause = {on:true}", J(f.w) === J(["set " + SR + "/pause"]) && J(f.v) === J({ on: true }), f);
  f = flip("lgRulePause()", SR + "/pause");
  ok("…Off: one set of the same path = {from:\"2026-11-26\"}", J(f.w) === J(["set " + SR + "/pause"]) && J(f.v) === J({ from: isoN(10) }), f);
  const m = w.mark(); const r = [A.run("lgRuleFall('kid_x')"), A.run("lgRuleTake('mom')"), A.run("lgRuleFall('kid_b.x')")];
  ok("a made-up kid, Mom or a key with a period: refused, nothing written", r.every(x => x === false) && w.since(m).length === 0, r);
  ok("the switch shows its new state: kid_a's Stars fall when late reads On (from today), the pause Off", /Kid A Stars fall when late On/.test(txt(A.run("__pop"))) && /⏸ Pause for everyone On: no stars fall and none are taken, for every kid\. Off/.test(txt(A.run("__pop"))));
  // back to a clean slate for C (kid_a's {from:Thu} would stop Wednesday's turns falling): the test puts the node back as the defaults
  w.db.tree.root.household.meta.starRules = null; delete w.db.tree.root.household.meta.starRules; A.run("delete householdData.meta.starRules;1"); B.run("delete householdData.meta.starRules;1"); Kk.run("delete householdData.meta.starRules;1"); Dd.run("delete householdData.meta.starRules;1");
  A.run("lgClose();lgRulesOpen=false;1");
}

// ── C / D ──
console.log("\n── C · Stars fall when late OFF for kid_a only · D · what was paid stays ──");
{ let la = draw(Kk, "kid_a"), lb = draw(Kk, "kid_b");
  ok("Thursday before: kid_a's vacuum 10 → 6, dust 10 → 8, sink 10 → 8; kid_b's porch 10 → 8", pill(la, "Vacuum the den") === "10 → 6 ⭐" && pill(la, "Dust the shelves") === "10 → 8 ⭐" && pill(la, "Wipe the sink") === "10 → 8 ⭐" && pill(lb, "Sweep the porch") === "10 → 8 ⭐", [pill(la, "Vacuum the den"), pill(la, "Dust the shelves"), pill(lb, "Sweep the porch")]);
  tick(Kk, "kid_a", "Vacuum the den"); await w.flush();   // a late tick BEFORE the flip: pays 6
  ok("kid_a ticks the vacuum before any flip: one bank line of 6", J(lines(w, "kid_a", "Vacuum the den")) === J([6]));
  const L0 = LG(A, "lgGo('kid_a',0,0)"), v0 = rowRaw(L0, "Vacuum the den");
  const kc0 = { a: kcLeft(Kk, "kid_a"), b: kcLeft(Kk, "kid_b") }, hh0 = [hhFall(A, "kid_a", "Dust the shelves"), hhFall(A, "kid_a", "Wipe the sink"), hhFall(A, "kid_b", "Sweep the porch")];
  ok("(before the flip) the 🧽 house panel's late rows carry what they pay now: kid_a's dust 8, sink 8; kid_b's porch 8", J(hh0) === J([8, 8, 8]), hh0);
  A.run("lgRuleFall('kid_a')"); await w.flush();
  const kc1 = { a: kcLeft(Kk, "kid_a"), b: kcLeft(Kk, "kid_b") };
  ok("Off for kid_a: Kids' Corner's \"still to get\" counts the dust and the sink at their full stars (+2 each: " + kc0.a + " → " + kc1.a + "); kid_b's stays " + kc0.b + " (the porch still at 8)", kc0.a > 0 && kc1.a === kc0.a + 4 && kc0.b > 0 && kc1.b === kc0.b, [kc0, kc1]);
  ok("…the 🧽 house panel: kid_a's dust and sink have no fallen number (plain stars); kid_b's porch still 8", hhFall(A, "kid_a", "Dust the shelves") === "none" && hhFall(A, "kid_a", "Wipe the sink") === "none" && hhFall(A, "kid_b", "Sweep the porch") === 8, hh(A, "kid_a"));
  la = draw(Kk, "kid_a"); lb = draw(Kk, "kid_b");
  ok("Off for kid_a: the dust and the sink show the plain stars on kid_a's own list (\"+10 ⭐\")", pill(la, "Dust the shelves") === "+10 ⭐" && pill(la, "Wipe the sink") === "+10 ⭐", [pill(la, "Dust the shelves")]);
  ok("…kid_b is untouched: the porch still 10 → 8", pill(lb, "Sweep the porch") === "10 → 8 ⭐");
  ok("…Mom's Kids today pop-up and Kids' Corner agree (kid_a plain, kid_b falling)", /Dust the shelves \+10 ⭐/.test(txt(pop(A, "kid_a"))) && /Sweep the porch 10 → 8 ⭐/.test(txt(pop(A, "kid_b"))) && kc(Kk, "kid_a") !== "" );
  const L1 = LG(A, "lgGo('kid_a',0,0)");
  ok("…the ledger's ⏳ rows for kid_a no longer say \"pays 8 of 10 ⭐ today\"; kid_b's still does", /^⏳ 🪶 Dust the shelves still on Kid A's list from Wed ➖ Excuse$/.test(rowT(L1, "Dust the shelves")) && /pays 8 of 10 ⭐ today/.test(rowT(LG(A, "lgGo('kid_b',0,0)"), "Sweep the porch")), rowT(L1, "Dust the shelves"));
  ok("D · the vacuum ticked before the flip keeps its words and its ⭐ Give stars back (4): the row is byte for byte as before the flip", rowRaw(L1, "Vacuum the den") === v0 && /paid 6 of 10 ⭐ · due Tue/.test(rowT(L1, "Vacuum the den")) && /title="Pay the 4 ⭐/.test(v0), rowT(L1, "Vacuum the den"));
  tick(Kk, "kid_a", "Dust the shelves"); tick(Kk, "kid_b", "Sweep the porch"); await w.flush();
  ok("kid_a ticks the dust: paid 10 (full); kid_b ticks the porch: paid 8 (falling); the vacuum's 6 stays", J(lines(w, "kid_a", "Dust the shelves")) === J([10]) && J(lines(w, "kid_b", "Sweep the porch")) === J([8]) && J(lines(w, "kid_a", "Vacuum the den")) === J([6]));
  const L2 = LG(A, "lgGo('kid_a',0,0)");
  ok("…the ledger: the dust \"✅ … done late\" with +10 and no ⭐ Give (nothing fell short); kid_b's porch \"paid 8 of 10\" with ⭐ Give 2", /done late · due Wed/.test(rowT(L2, "Dust the shelves")) && !/Give stars back/.test(rowRaw(L2, "Dust the shelves")) && /paid 8 of 10 ⭐ · due Wed/.test(rowT(LG(A, "lgGo('kid_b',0,0)"), "Sweep the porch")) && /title="Pay the 2 ⭐/.test(rowRaw(A.run("__pop"), "Sweep the porch")));
  const gb = A.run("lgGive('kid_a',activeWk(),'thursday','chores'," + idxOf(A, "kid_a", "Vacuum the den") + ")"); await w.flush();
  ok("D · ⭐ Give stars back on the vacuum after the flip pays what that tick really fell short: +4", gb === true && J(lines(w, "kid_a", "gave back")) === J([4]));
  A.run("lgGiveUndo('kid_a',activeWk(),'thursday','chores'," + idxOf(A, "kid_a", "Vacuum the den") + ")"); await w.flush();
  // un-tick the dust: takes back the 10 it stored (never today's rule)
  tick(Kk, "kid_a", "Dust the shelves"); await w.flush();
  ok("D · an un-tick takes back exactly what its tick stored (the dust's 10), even with the switch off", lines(w, "kid_a", "Dust the shelves").reduce((s, a) => s + a, 0) === 0 && lines(w, "kid_a", "Dust the shelves").length !== 1);
  DUMP.thuOff = LG(A, "lgGo('kid_a',0,0);lgRulesOpen=true;lgDraw()"); A.run("lgRulesOpen=false;lgClose();1");
}

// ── E ──
console.log("\n── E · Stars fall when late ON again: only turns due from that day fall (and off/on the same day) ──");
{ A.run("lgRuleFall('kid_a')"); await w.flush();   // Thursday: off → on the same day
  ok("Off then On the same day (Thu): kid_a falls from Thu; Wednesday's sink and dust, still waiting, pay their full stars", A.run("starFallFrom('kid_a')") === isoN(10) && pill(draw(Kk, "kid_a"), "Wipe the sink") === "+10 ⭐" && pill(draw(Kk, "kid_a"), "Dust the shelves") === "+10 ⭐");
  ok("…and the vacuum's ledger row is still \"paid 6 of 10 ⭐ · due Tue\" with ⭐ Give 4", /paid 6 of 10 ⭐ · due Tue/.test(rowT(LG(A, "lgGo('kid_a',0,0)"), "Vacuum the den")) && /title="Pay the 4 ⭐/.test(rowRaw(A.run("__pop"), "Vacuum the den")));
  await go(w, 11, 8);   // Friday: the rugs (Thu) were missed after the switch came back on
  const la = draw(Kk, "kid_a");
  ok("Friday: the rugs (due Thu, the day it came back on) fall: 10 → 8; the sink (due Wed) still +10", pill(la, "Shake the rugs") === "10 → 8 ⭐" && pill(la, "Wipe the sink") === "+10 ⭐", [pill(la, "Shake the rugs"), pill(la, "Wipe the sink")]);
  ok("…kid_b's leaves (Thu) fall as always: 10 → 8", pill(draw(Kk, "kid_b"), "Rake the leaves") === "10 → 8 ⭐");
}

// ── F ──
console.log("\n── F · ⏸ Pause for everyone, and un-pause the same day ──");
{ const kp0 = { a: kcLeft(Kk, "kid_a"), b: kcLeft(Kk, "kid_b") }, hp0 = [hhFall(A, "kid_a", "Shake the rugs"), hhFall(A, "kid_b", "Rake the leaves")];
  A.run("lgRulePause()"); await w.flush();
  const kp1 = { a: kcLeft(Kk, "kid_a"), b: kcLeft(Kk, "kid_b") };
  ok("Paused: Kids' Corner counts kid_a's rugs and kid_b's leaves at full stars (+2 each: " + J(kp0) + " → " + J(kp1) + "); the 🧽 house panel drops their fallen numbers (8 → none)", kp1.a === kp0.a + 2 && kp1.b === kp0.b + 2 && J(hp0) === J([8, 8]) && hhFall(A, "kid_a", "Shake the rugs") === "none" && hhFall(A, "kid_b", "Rake the leaves") === "none", [kp0, kp1, hp0]);
  ok("Paused: nobody falls — kid_a's rugs and kid_b's leaves show +10", pill(draw(Kk, "kid_a"), "Shake the rugs") === "+10 ⭐" && pill(draw(Kk, "kid_b"), "Rake the leaves") === "+10 ⭐");
  const LA = LG(A, "lgGo('kid_b',0,0)"), LD = LG(Dd, "lgGo('kid_b',0,0)");
  ok("…a banner on the ledger, Mom's (with \"Tap ⚙ to change.\") and Dad's (without)", /⏸ Star rules are paused for everyone: no stars fall and none are taken\. Tap ⚙ to change\./.test(txt(LA)) && /⏸ Star rules are paused for everyone: no stars fall and none are taken\.( |$)/.test(txt(LD)) && !/Tap ⚙/.test(txt(LD)), txt(LD).slice(0, 300));
  ok("…the ⏳ rows say no \"pays … today\" for either kid", !/pays \d+ of/.test(rowT(LA, "Rake the leaves")) && !/pays \d+ of/.test(rowT(LG(A, "lgGo('kid_a',0,0)"), "Shake the rugs")));
  DUMP.paused = LG(A, "lgGo('kid_a',0,0);lgRulesOpen=true;lgDraw()"); DUMP.pausedClosed = LG(A, "lgRulesOpen=false;lgDraw()"); A.run("lgClose();1");
  // nothing is taken, for anyone
  const dog0 = lines(w, "kid_b", "Feed the dog").reduce((s, a) => s + a, 0);
  tick(Kk, "kid_b", "Feed the dog"); await w.flush(); const k2 = logKey(A, "kid_b", "Feed the dog"), m = w.mark(); A.run("__toast.length=0;__cf.length=0;1");
  A.run("rlogFlag('kid_b','" + k2.join("','") + "')"); await w.flush(); Dd.run("__toast.length=0;1");   // FLAGWHO: Dad's device hears the mark first Dd.run("ckLogDock('step','kid_b'," + J(k2.join("/")) + ",'Feed the dog')");
  spotPick(A, "kid_b", "Feed the dog", 2); A.run("spResolve('kid_b',0,'no')"); await w.flush();
  ok("…paused: the Click-off Log's −100 (Mom), 🧾's −100 (Dad's link) and the spot check's extra stars take nothing from kid_b; the Log's ⚠️ still marks the line: 🚩, penalty 0, by Mom (FLAGWHO 2026-11-23)", lines(w, "kid_b", "false check-off").length === 0 && lines(w, "kid_b", "Spot check").length === 0 && (r => r.flagged === true && r.penalty === 0 && r.flagBy === "mom")(w.get("routineLog/kid_b/" + k2.join("/")) || {}), writes(w, m));
  ok("…and each says why where she tapped: the Log's ask \"…⏸ Star rules are paused for everyone, so no stars come off.\" (FLAGWHO) / the spot check's ask", A.run("__toast.length") === 0 && /^Mark a false check-off for Kid B\?[\s\S]*⏸ Star rules are paused for everyone, so no stars come off\./.test(A.run("__cf[0]")) && Dd.run("__toast.length") === 0 && /⏸ Star rules are paused for everyone, so nothing more comes off\./.test(A.run("__cf[1]")) && !/The rule: −100/.test(A.run("__cf[1]")), [A.run("JSON.stringify(__toast)"), A.run("JSON.stringify(__cf)")]);
  ok("…the spot check's ✗ still did its own part: the dog back to not done, its own 2 ⭐ back off (an un-tick, not a take)", A.run("rtDoneOn('chores','kid_b',_todayDay," + idxOf(A, "kid_b", "Feed the dog") + ")") === false && lines(w, "kid_b", "Feed the dog").reduce((s, a) => s + a, 0) === dog0, [dog0, lines(w, "kid_b", "Feed the dog")]);
  A.run("lgRulePause()"); await w.flush();   // un-pause, the same day
  ok("Un-paused the same day (Fri): it starts clean — the rugs and leaves (due Thu) pay +10; pause = {from:Fri}", J(w.get(SR + "/pause")) === J({ from: isoN(11) }) && pill(draw(Kk, "kid_a"), "Shake the rugs") === "+10 ⭐" && pill(draw(Kk, "kid_b"), "Rake the leaves") === "+10 ⭐");
  ok("…no banner any more", !/paused for everyone/.test(txt(LG(A, "lgGo('kid_a',0,0)"))));
  await go(w, 12, 8);   // Saturday: Friday's mirror and towels were missed after the un-pause
  ok("Saturday: Friday's turns fall again for both kids (mirror 10 → 8, towels 10 → 8)", pill(draw(Kk, "kid_a"), "Wipe the mirror") === "10 → 8 ⭐" && pill(draw(Kk, "kid_b"), "Fold the towels") === "10 → 8 ⭐");
}

// ── G ──
console.log("\n── G · Take stars away OFF for kid_a only: every penalty path ──");
{ A.run("lgRuleTake('kid_a')"); await w.flush();
  tick(Kk, "kid_a", "Make the bed"); tick(Kk, "kid_b", "Feed the dog"); await w.flush();
  const ka = logKey(A, "kid_a", "Make the bed"), kb = logKey(A, "kid_b", "Feed the dog");
  A.run("__toast.length=0;__cf.length=0;1"); let m = w.mark();
  A.run("rlogFlag('kid_a','" + ka.join("','") + "')"); await w.flush();
  ok("the Click-off Log's ⚠️ −100 on kid_a: nothing taken; it asks (\"…Taking stars away is off for Kid A, so no stars come off.\") and marks the line with penalty 0 (FLAGWHO)", J(writes(w, m)) === J(["update routineLog/kid_a/" + ka.join("/")]) && lines(w, "kid_a", "false check-off").length === 0 && /Taking stars away is off for Kid A, so no stars come off\./.test(A.run("__cf[0]")) && A.run("__toast.length") === 0 && w.get("routineLog/kid_a/" + ka.join("/") + "/penalty") === 0, writes(w, m));
  m = w.mark(); A.run("rlogFlag('kid_b','" + kb.join("','") + "')"); await w.flush();
  ok("…on kid_b it works as before: −100 and the 🚩 mark", J(lines(w, "kid_b", "false check-off")) === J([-100]) && w.get("routineLog/kid_b/" + kb.join("/") + "/flagged") === true);
  m = w.mark(); A.run("__toast.length=0;1"); A.run("ckLogDock('step','kid_a'," + J(ka.join("/")) + ",'Make the bed')"); await w.flush();
  ok("🧾 Today's check-offs' −100 on kid_a's line the Log just marked: nothing taken, nothing written, no ask (a line is marked once; FLAGWHO)", writes(w, m).length === 0 && A.run("__toast.length") === 0 && A.run("__cf.length") === 2, [writes(w, m), A.run("JSON.stringify(__cf)"), A.run("JSON.stringify(__toast)")]);
  ok("…the line shows the shared mark in 🧾 too: \"🚩 by Mom · no stars taken\" (FLAGWHO; before: the button stayed)", /🚩 by Mom · no stars taken/.test(A.run("(function(){ ckLogOpen=true; return mdCardCheckLog(); })()")));
  // the school-card kind of 🧾's −100 is refused the same way (it takes from the same bank)
  m = w.mark(); A.run("ckLogDock('task','kid_a','t_x','Math')");
  ok("…its school-card kind too (the same button, the same bank)", writes(w, m).length === 0);
  m = w.mark(); A.run("__cf.length=0;1"); spotPick(A, "kid_a", "Make the bed", 2); A.run("spResolve('kid_a',0,'no')"); await w.flush();
  ok("🔎 Spot check ✗ on kid_a: the bed back to not done and its 2 ⭐ back off, but no −100; the ask says so; the record has no −100", lines(w, "kid_a", "Spot check").length === 0 && /Taking stars away is off for Kid A, so nothing more comes off\./.test(A.run("__cf[0]")) && !/The rule: −100/.test(A.run("__cf[0]")) && A.run("rtDoneOn('chores','kid_a',_todayDay," + idxOf(A, "kid_a", "Make the bed") + ")") === false && !("pen" in (w.get("spotChecks/kid_a/" + isoN(12) + "/results/0") || {})), A.run("__cf[0]"));
  m = w.mark(); A.run("__cf.length=0;1"); tick(Kk, "kid_b", "Feed the dog"); tick(Kk, "kid_b", "Feed the dog"); await w.flush(); spotPick(A, "kid_b", "Feed the dog", 2); A.run("spResolve('kid_b',0,'no')"); await w.flush();
  ok("…on kid_b the spot check takes its 100 as before (\"The rule: −100 ⭐ more\")", J(lines(w, "kid_b", "Spot check")) === J([-100]) && /The rule: −100 ⭐ more/.test(A.run("__cf[0]")));
  A.run("lgRuleTake('kid_a')"); await w.flush(); A.run("__toast.length=0;1");
  m = w.mark(); A.run("rlogFlag('kid_a','" + ka.join("','") + "')"); await w.flush(); const n3 = w.since(m).length;
  tick(Kk, "kid_a", "Make the bed"); await w.flush();   // the bed again (the spot check put it back): a new line
  const k3 = JSON.parse(A.run("(function(){ const L=routineLog.kid_a[" + J(ka[0]) + "][" + J(ka[1]) + "]; const k=Object.keys(L).filter(function(k){ return k!==" + J(ka[2]) + "&&L[k].act==='on'&&L[k].label==='Make the bed'; }).pop(); return JSON.stringify([" + J(ka[0]) + "," + J(ka[1]) + ",k]); })()"));
  A.run("rlogFlag('kid_a','" + k3.join("','") + "')"); await w.flush();
  ok("Take stars away On again for kid_a: the line marked while Off is never docked, nothing written (FLAGWHO); a new line's −100 works again (from that tap)", n3 === 0 && !!k3[2] && J(lines(w, "kid_a", "false check-off")) === J([-100]) && A.run("__toast.length") === 0, [n3, k3, lines(w, "kid_a", "false check-off")]);
  { A.run("lgRuleTake('kid_c')"); await w.flush(); const t0 = lines(w, "kid_c", "Toys in the bin").reduce((s, a) => s + a, 0);
    tick(Kk, "kid_c", "Toys in the bin"); await w.flush(); const t1 = lines(w, "kid_c", "Toys in the bin").reduce((s, a) => s + a, 0); tick(Kk, "kid_c", "Toys in the bin"); await w.flush();
    const t2 = lines(w, "kid_c", "Toys in the bin").reduce((s, a) => s + a, 0); A.run("bankGiveDock('kid_c',-1,7,'a typed dock')"); await w.flush();
    ok("not \"taking away\" (not gated): with kid_c Off, an un-tick still takes back what its tick paid (+3, then back), and the Star Bank's typed dock of 7 lands", t1 === t0 + 3 && t2 === t0 && J(lines(w, "kid_c", "a typed dock")) === J([-7]), [t0, t1, t2, lines(w, "kid_c", "a typed dock")]);
    A.run("lgRuleTake('kid_c')"); await w.flush(); }
}

// ── H ──
console.log("\n── H · the two look-only lines ──");
{ let P = txt(LG(A, "lgGo('kid_a',0,0);lgRulesOpen=true;lgDraw()"));
  ok("\"Penalty: 100 ⭐ ›\" (settings/spotCheck/penalty is on at 100), and where it is changed", /Penalty: 100 ⭐ › Changed on the 🔎 Spot check card's ⚙ \(its ✗ Not done\)\. The −100 on the Click-off Log and 🧾 is always 100\./.test(P), P.slice(-400));
  ok("\"Mom checks before pay: off ›\" (nobody switched on)", /Mom checks before pay: off › Changed in Chores & Stars ▸ Points\./.test(P));
  A.run("choreVerifySet('kid_b',true)"); A.run("spSetPenOn()"); await w.flush();
  P = txt(LG(A, "lgDraw()"));
  ok("…they follow the real settings: \"Penalty: off ›\" and \"Mom checks before pay: on for Kid B ›\"", /Penalty: off ›/.test(P) && /Mom checks before pay: on for Kid B ›/.test(P), P.slice(-400));
  DUMP.lines = A.run("__pop");
  const raw = A.run("__pop"), tail = raw.slice(raw.indexOf("Penalty:") - 200);
  ok("…not editable here: no input, no switch, only a jump (lgRulesGoSpot / lgRulesGoPoints)", !/<input|role="switch"/.test(tail.slice(0, tail.indexOf("</div></div>") + 400)) && /onclick="lgRulesGoSpot\(\)"/.test(raw) && /onclick="lgRulesGoPoints\(\)"/.test(raw));
  let m = w.mark(); A.run("lgRulesGoSpot()");
  ok("Penalty ›: the ledger closes and the Spot check card's ⚙ sheet is open; nothing written", A.run("spSetOpen") === true && A.run("lgRulesOpen") === false && w.since(m).length === 0);
  LG(A, "lgShow();lgRulesOpen=true;lgDraw()"); m = w.mark(); A.run("lgRulesGoPoints()");
  ok("Mom checks before pay ›: Chores & Stars on its Points tab; nothing written", A.run("cpTab") === "points" && w.since(m).length === 0);
  A.run("choreVerifySet('kid_b',false)"); A.run("spSetPenOn()"); A.run("tab='moms-plan';1"); await w.flush();
  const W2 = await mkWorld(IDX, HJS, false); loadH(W2.A, HJS);
  ok("a family that never set the penalty: \"Penalty: off ›\" (missing = off, as today; this slice does not change it)", /Penalty: off ›/.test(txt(LG(W2.A, "lgShow();lgRulesOpen=true;lgDraw()"))) && W2.w.get("settings/spotCheck/penalty") == null);
}

// ── I ──
console.log("\n── I · Dad's link and a kid's device ──");
{ const h = LG(Dd, "lgShow()"), m = w.mark();
  const r = [Dd.run("lgRuleFall('kid_a')"), Dd.run("lgRuleTake('kid_a')"), Dd.run("lgRulePause()"), Dd.run("lgRulesGoSpot()"), Dd.run("lgRulesGoPoints()")]; Dd.run("lgRulesToggle()");
  ok("Dad's link: the ledger with no ⚙ and no panel; every switch refuses; nothing written", !/⚙|lgRules/.test(h) && r.every(x => x === false) && Dd.run("lgRulesOpen") === false && w.since(m).length === 0, r);
  Dd.run("dadUnlocked=true;1");
  ok("…with his Dad code in (DADCTL, her words 2026-11-23): the ⚙ is drawn; opening it writes nothing (his flips: test_dad_controls.js)", Dd.run("dadAwardOk()") === true && /onclick="lgRulesToggle\(\)"[^>]*>⚙</.test(LG(Dd, "lgShow()")) && Dd.run("lgRulesOk()") === true && w.since(m).length === 0); Dd.run("dadUnlocked=false;1");
  loadH(Kk, HJS); Kk.run("__pop='';ledgerOpen();1");
  ok("a kid's device: the ledger never opens, and every switch refuses even with house.js loaded; nothing written", Kk.run("__pop") === "" && [Kk.run("lgRuleFall('kid_a')"), Kk.run("lgRuleTake('kid_a')"), Kk.run("lgRulePause()")].every(x => x === false) && w.since(m).length === 0);
}

// ── J ──
{ const Sd = w.boot("Sd", "devSd", { mom: true }); await w.flush(); Sd.run(CAP); loadH(Sd, HJS);
  const open = LG(Sd, "lgShow();lgRulesToggle()");
  ok("(same device) Mom opens ⚙: the panel is drawn", /id="lg-rules"/.test(open) && Sd.run("lgRulesOpen") === true);
  Sd.run("haMomOff();1"); const off = LG(Sd, "lgGo('kid_b',0,0)");
  ok("…Mom mode ends while the pop-up is open: the next drawing (a kid chip) has no panel, no switch and no ⚙", Sd.run("momHere()") === false && Sd.run("lgRulesOpen") === true && off !== "" && !/id="lg-rules"|role="switch"|lgRulesToggle/.test(off), txt(off).slice(0, 200));
  Sd.run("HA_LS.setItem('ha_kiosk','dad');1"); const dad = LG(Sd, "lgShow()");
  ok("…the same device on Dad's link: the ledger opens with no panel, no switch and no ⚙ (lgRulesOpen still true from Mom)", Sd.run("_kioskD()") === true && /📒 Ledger/.test(dad) && Sd.run("lgRulesOpen") === true && !/id="lg-rules"|role="switch"|lgRulesToggle/.test(dad), txt(dad).slice(0, 200));
  Sd.run("lgClose();HA_LS.removeItem('ha_kiosk');1"); }

console.log("\n── J · dryrun writes nothing ──");
{ const Dr = w.boot("Dr", "devDr", { mom: true }); await w.flush(); Dr.run(CAP); Dr.run("HA_LS.setItem('ha_dryrun','1');1"); loadH(Dr, HJS);
  const tk0 = J(w.get(SR + "/take/kid_c")), m = w.mark(); Dr.run("lgRuleTake('kid_c')"); Dr.run("lgRuleFall('kid_c')"); Dr.run("lgRulePause()");   // C3: kid_c's take is {from} since B's On again
  ok("?dryrun=1: the flips show on that screen (kid_c Off, Off, paused) and nothing reaches the database", Dr.run("_dryRun()") === true && w.since(m).length === 0 && J(w.get(SR + "/take/kid_c")) === tk0 && tk0 !== "false" && /Kid C Stars fall when late Off Take stars away Off/.test(txt(LG(Dr, "lgShow();lgRulesOpen=true;lgDraw()"))) && /paused for everyone/.test(txt(Dr.run("__pop"))));
  ok("…every other device still reads the house as it was", A.run("starTakeOk('kid_c')") === true && B.run("(starRules().pause||{}).on") !== true);
}

// ── K ──
console.log("\n── K · a second device sees the flip ──");
{ await go(w, 12, 9); const m = w.mark(); A.run("lgRuleFall('kid_b')"); await w.flush();
  ok("Mom flips kid_b off on her device: a second device (B) and kid_b's tablet read it at once (the household listener they already have)", B.run("starFallFrom('kid_b')") === "~" && Kk.run("starFallFrom('kid_b')") === "~" && J(writes(w, m)) === J(["set " + SR + "/fall/kid_b"]));
  ok("…their fresh drawing of kid_b's list shows the towels plain (+10); kid_a's mirror still 10 → 8", pill(draw(B, "kid_b"), "Fold the towels") === "+10 ⭐" && pill(draw(Kk, "kid_b"), "Fold the towels") === "+10 ⭐" && pill(draw(Kk, "kid_a"), "Wipe the mirror") === "10 → 8 ⭐");
  tick(Kk, "kid_b", "Fold the towels"); await w.flush();
  ok("…and kid_b's tick there pays 10", J(lines(w, "kid_b", "Fold the towels")) === J([10]));
  const B2 = w.boot("B2", "devB2"); await w.flush();
  ok("a device booted after the flip reads it too", B2.run("starFallFrom('kid_b')") === "~");
  DUMP.mobile = LG(A, "lgGo('kid_a',0,0);lgRulesOpen=true;lgDraw()"); A.run("lgRulesOpen=false;lgClose();1");
}

if (process.env.LR_DUMP) fs.writeFileSync(process.env.LR_DUMP, J(DUMP));
try { fs.unlinkSync(BASE_IDX); } catch (e) {}
console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); try { fs.unlinkSync(BASE_IDX); } catch (x) {} process.exit(1); });
