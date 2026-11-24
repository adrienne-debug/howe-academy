/*
 * test_ledger_sendback.js — ↩ Send back on a ticked 📒 Ledger row, slice L5 of DESIGN_chore_ledger_2026-11-21 (§3 the ask, §5 "one
 * record", §6 laundry rows; her answers 11/21: "a wasnt done would need the 100 off right? with a setting to change that?" → "Stars back
 * + the penalty"; the penalty where nobody set it: "ON at 100"). Two answers: 🚩 Wasn't done · Just a mistake ("Do it again" is L6).
 * The WHOLE app runs per device (test_fixtures/house_world.js) on a made-up family (kid_a … kid_d), the clock moved day by day from
 * Fri 11/27 to Thu 12/3:
 *   kid_a  🌅 Make the bed (daily 5) · Start your laundry (the line's Thursday load) · 🧹 Feed the cat (daily 10) · Vacuum the den (Mon 10)
 *          · Dust the shelves (Tue 10) · Wipe the table (daily 10) · Zoned sweep (Wed 10, bonus room z1 at double on Wednesday)
 *          ☀️ Water the plants (daily 5)
 *   kid_b  🧹 Sweep the porch (daily 6; Mom checks before pay)   ·   kid_c  🧹 Toys in the bin (daily 3)   ·   kid_d nothing
 * Fri 11/27 the cat and the bed (last week). Mon 11/30 the bed, the cat, the plants; the vacuum and the table missed. Tue the vacuum
 * (1 day late, pays less), the table missed again, the plants sent to the morning (🌅). Wed the dust (1 day late) + ⭐ Give stars back,
 * the table (C5: missed 2 days, pays 8), the zoned sweep (20: double), the 🌅 plants on the morning list. Thu the cat, the bed, the
 * porch (kid_b, held), the laundry Start.
 * Checks: A while nobody taps, every screen and the database = the app before; the pop-up = the app before once ↩ Send back is taken out;
 * where the button is · J Just a mistake = the Kids today pop-up's un-tick, write for write and byte for byte, on every kind of row; its
 * Undo exact · W Wasn't done = that un-tick + ONE fixed-id minus line + the 🚩 mark, every kind of row; each Undo exact · D the three places
 * agree (ledger, Click-off Log, 🧾), both ways; each loses its button; the log's and 🧾's undo · S the amount (100, 50, off), Take stars
 * away off and ⏸ (nothing taken, never later), the unset default ON at 100, a set one kept · T two taps, two devices · G Dad's link
 * (locked / with his code), a kid's device, ?dryrun=1 · L laundry Start (LE_BACKLINE) and Fold rows · P a plan row (plan ON).
 * "The app before" = THIS tree with L5 taken out (no git, no pinned commit; each piece must match exactly once, or the test stops):
 * house.js minus the LEDGERSB block, its three hooks and its drawing hook, and the two ⚙ panel sentences; index.html minus FLAGONE and the
 * lines that use it, with spPenalty's unset default back to OFF.
 * LGS_INDEX / LGS_HJS = other copies (a mutation check). LGS_DUMP = a file for the preview page's drawings.
 * run: node test_ledger_sendback.js
 */
"use strict";
const fs = require("fs"), path = require("path"), os = require("os");
const W = require(path.join(__dirname, "test_fixtures", "house_world.js"));
let pass = 0, fail = 0; const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x).slice(0, 900) + ")" : "")); } };
const J = x => JSON.stringify(x), clone = x => JSON.parse(J(x));
const IDX = process.env.LGS_INDEX || path.join(__dirname, "index.html"), HJS = fs.readFileSync(process.env.LGS_HJS || path.join(__dirname, "house.js"), "utf8");

// ── the app before: this tree, L5 taken out ──
const L5 = require(path.join(__dirname, "test_fixtures", "ledger_l5_out.js"));   // the pieces (shared with test_flag_mark_who and test_ledger_rules)
const BASE_IDX = (() => { const s = L5.idx(fs.readFileSync(path.join(__dirname, "index.html"), "utf8"));
  if (/FLAGONE|flagSet|flagN\(|flagLbl|flagUndo/.test(s)) throw new Error("test_ledger_sendback: the app before still mentions FLAGONE");
  const t = path.join(os.tmpdir(), "ledger_sb_before_" + process.pid + ".html"); fs.writeFileSync(t, s); return t; })();
const BASE_HJS = (() => { const s = L5.hjs(fs.readFileSync(path.join(__dirname, "house.js"), "utf8"));
  if (/lgSb|LEDGERSB|sbH|lgFlagUndo|lgSendBack/.test(s)) throw new Error("test_ledger_sendback: the app before's house.js still mentions LEDGERSB"); return s; })();
console.log("(the app before: this tree with LEDGERSB taken out of house.js and FLAGONE out of index.html)");

const K = o => Object.assign({ src: { kind: "routine" }, status: "active", area: "cleaning", verdict: "", note: "", level: 1, minutes: 5 }, o);
const FAM = () => ({
  a_bed: K({ label: "Make the bed", emoji: "🛏", who: "kid_a", slot: "morning", cad: "daily", pts: 5, order: 0 }),
  a_cat: K({ label: "Feed the cat", emoji: "🐱", who: "kid_a", slot: "chores", cad: "daily", pts: 10, area: "animals", order: 1 }),
  a_vac: K({ label: "Vacuum the den", emoji: "🧹", who: "kid_a", slot: "chores", cad: "wk:0", pts: 10, order: 2 }),
  a_dust: K({ label: "Dust the shelves", emoji: "🪶", who: "kid_a", slot: "chores", cad: "wk:1", pts: 10, order: 3 }),
  a_table: K({ label: "Wipe the table", emoji: "🧽", who: "kid_a", slot: "chores", cad: "daily", pts: 10, order: 4 }),
  a_zone: K({ label: "Zoned sweep", emoji: "🧹", who: "kid_a", slot: "chores", cad: "wk:2", zone: "z1", pts: 10, order: 5 }),
  a_plants: K({ label: "Water the plants", emoji: "🪴", who: "kid_a", slot: "afternoon", cad: "daily", pts: 5, order: 0 }),
  b_porch: K({ label: "Sweep the porch", emoji: "🧺", who: "kid_b", slot: "chores", cad: "daily", pts: 6, order: 0 }),
  c_toys: K({ label: "Toys in the bin", emoji: "🧩", who: "kid_c", slot: "chores", cad: "daily", pts: 3, order: 0 })
});
const LINE = { caps: { "0": 0, "1": 0, "2": 0, "3": 1, "4": 0, "5": 0, "6": 0 }, asOf: "2026-11-23", homeFrom: "2026-11-23" };   // one load a week, on Thursday
const CFG = () => Object.assign(clone(W.FX.db.config), { choreVerify: { kid_b: true }, zoneBonus: { enabled: true, mode: "double" }, zonePlan: { wednesday: "z1" } });
const dOf = n => new Date(2026, 10, 27 + n);   // n=0 Fri 11/27 … n=6 Thu 12/3
const go = (w, n, h, mi) => { const d = dOf(n); return w.at(d.getFullYear(), d.getMonth() + 1, d.getDate(), h, mi || 0); };
const CAP = "globalThis.__pop='';globalThis.__toast=[];globalThis.__cf=[];document.body.insertAdjacentHTML=function(p,h){ globalThis.__pop=h; };gwShowToast=function(m){ __toast.push(m); };mwToast=function(m){ __toast.push(m); };confirm=function(m){ __cf.push(m); return true; };tab='moms-plan';HA_LS.setItem('ha_ledger_hello','1');1";
async function mkWorld(index, hjs, o) { o = o || {};
  const w = await W.world({ index, mode: o.mode, household: o.mode ? undefined : { jobs: FAM(), people: clone(W.PEOPLE), meta: { takeover: 1, engine: { mode: "preview", on: "2026-11-09" } } },
    tree: { config: CFG(), laundryLine: clone(LINE), settings: o.unset ? {} : { spotCheck: { penalty: { on: true, pts: 100 } } } } });
  const A = w.boot("A", "devA", { mom: true }), B = w.boot("B", "devB"), Dd = w.boot("D", "devD"), Kk = w.boot("Kk", "devK");
  Dd.run("HA_LS.setItem('ha_kiosk','dad');1"); Kk.run("HA_LS.setItem('ha_kiosk','routines');1");
  for (const d of [A, B, Dd, Kk]) d.run(CAP);
  await w.flush(); return { w, A, B, Dd, Kk, hjs };
}
const idxOf = (d, slot, kid, label, dn) => d.run("(function(){ const d0=day; day=" + (dn ? J(dn) : "_todayDay") + "; try{ return (rtStepsFor('" + slot + "','" + kid + "',false,day)||[]).findIndex(function(x){ return x&&x.label.indexOf(" + J(label) + ")===0&&x.cad!=='none'; }); } finally{ day=d0; } })()");
const tick = (d, slot, kid, label) => { const i = idxOf(d, slot, kid, label); if (i < 0) return -1; d.run("(function(){ day=_todayDay; " + (slot === "morning" ? "toggleMorningStep('" + kid + "'," + i + ")" : "toggleRtStep('" + slot + "','" + kid + "'," + i + ")") + "; })()"); return i; };
const loadH = (d, hjs) => { if (d.run("typeof lgShow") !== "function") d.run(hjs); };
const LG = (d, js) => d.run("(function(){ __pop=''; " + js + "; return __pop; })()");
const txt = h => String(h || "").replace(/<[^>]+>/g, " ").replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
const ROWSPLIT = '<div style="display:flex;flex-wrap:wrap;align-items:baseline;gap:2px 8px;padding:5px 2px;';
const rowsRaw = h => String(h).split(ROWSPLIT).slice(1).map(r => { const k = r.indexOf("</div>" + ROWSPLIT.slice(0, 20)); return '<div ' + r; });
const rowRaw = (h, name) => rowsRaw(h).filter(r => txt(r.split(ROWSPLIT)[0]).indexOf(name) >= 0)[0] || "";
const rowT = (h, name) => txt(rowRaw(h, name)).replace(/\s*(Cancel)$/, " $1");
const SBB = /<button onclick="lgSbAskSet\('[^']*'\)" title="[^"]*" style="[^"]*">↩ Send back<\/button>/g;
const stripSB = h => String(h).replace(SBB, "");
const adj = (w, kid) => (((w.db.tree.root.bank || {})[kid] || {}).adjustments) || {};
const writes = (w, m) => w.since(m).filter(e => !/^(get|once|on|read)/.test(String(e.op || "")));
const WS = (w, m) => writes(w, m).map(e => e.op + " " + e.path + (e.keys ? " [" + e.keys.join(",") + "]" : ""));
const MASK = a => a.map(s => s.replace(/(\/adjustments\/)bd[0-9a-z]+/g, "$1bd*").replace(/(routineLog\/[^/ ]+\/[^/ ]+\/[^/ ]+\/)-[A-Za-z0-9_-]+/g, "$1<key>").replace(/flg_([^ ]+)_-[A-Za-z0-9_-]+/g, "flg_$1_<key>"));
const kidLists = d => JSON.parse(d.run("(function(){ const d0=day, o={}; day=_todayDay; try{ ROSTER.forEach(function(k){ ['afternoon','chores','evening'].forEach(function(s){ rtOpen={}; o[k+s]=rtSlotHTML(s,k); }); o[k+'morning']=mrIndividualHTML(k); }); } finally{ day=d0; } return JSON.stringify(o); })()"));
const page = (d, f) => { d.run("globalThis.__el={innerHTML:'',style:{},appendChild(){},querySelector(){ return null; },querySelectorAll(){ return []; }};1"); try { d.run(f + "(__el);1"); } catch (e) { return "threw " + e.message; } return d.run("__el.innerHTML"); };
const bal = (d, kid) => d.run("bankBalance(" + J(kid) + ")");
const canon = x => JSON.stringify(x, (k, v) => (v && typeof v === "object" && !Array.isArray(v)) ? Object.keys(v).sort().reduce((o, q) => { o[q] = v[q]; return o; }, {}) : v);
const noTs = x => JSON.parse(J(x), (k, v) => (k === "ts" || k === "at" || k === "iso" || k === "flagTs") ? "·" : v);
const ctree = w => canon(w.db.tree.root), ntree = w => canon(noTs(w.db.tree.root));
const ddiff = (a, b, p) => { p = p || ""; if (canon(a) === canon(b)) return []; if (!a || !b || typeof a !== "object" || typeof b !== "object") return [p + ": " + String(J(a)).slice(0, 160) + " ≠ " + String(J(b)).slice(0, 160)]; return [...new Set([...Object.keys(a), ...Object.keys(b)])].flatMap(k => ddiff(a[k], b[k], p + "/" + k)).slice(0, 8); };
const pop = (d, kid, k, wk) => LG(d, "lgGo('" + kid + "'," + k + "," + (wk ? 1 : 0) + ")");
const ck = d => d.run("(function(){ ckLogOpen=true; const h=mdCardCheckLog(); ckLogOpen=false; return h; })()");
const ckRow = (h, l) => (String(h).split('<div style="display:flex;align-items:center;gap:8px;padding:4px 0;border-bottom:1px solid #f3f4f6">').filter(r => r.indexOf(l) >= 0)[0] || "");
const logRow = (h, l) => (String(h).split('<div style="display:flex;align-items:center;gap:8px;padding:7px 0;').filter(r => r.indexOf("✓ " + l) >= 0)[0] || "");
const logKey = (d, kid, label, dn) => JSON.parse(d.run("(function(){ const wk=activeWk(), dd=" + (dn ? J(dn) : "_todayDay") + ", L=((routineLog['" + kid + "']||{})[wk]||{})[dd]||{}; let b=null; Object.keys(L).forEach(function(k){ const r=L[k]; if(r&&r.act==='on'&&r.label===" + J(label) + "&&(!b||(r.at||0)>(L[b].at||0))) b=k; }); return JSON.stringify(b?[wk,dd,b]:null); })()"));
const lineOf = (w, kid, k) => w.get("routineLog/" + kid + "/" + k.join("/"));

(async () => {
const X = await mkWorld(IDX, HJS), BW = await mkWorld(BASE_IDX, BASE_HJS);
const { w, A, B, Dd, Kk } = X;
const S = { same: [], pop: [], dump: {} };
// ── the week, the same taps in both worlds ──
for (const V of [X, BW]) { await go(V.w, -3, 16); tick(V.B, "chores", "kid_a", "Feed the cat"); await V.w.flush(); }   // Tue 11/24, last week
for (let n = 0; n <= 6; n++) {
  for (const V of [X, BW]) {
    const { w, A, B } = V, dow = dOf(n).getDay();   // 0 Sunday
    await go(w, n, 8);
    if (n === 0 || n >= 3) { tick(B, "morning", "kid_a", "Make the bed"); }
    if (n === 6) tick(B, "morning", "kid_a", "Start your laundry");
    await w.flush(); await go(w, n, 16);
    if (n === 0 || n === 3 || n === 6) tick(B, "chores", "kid_a", "Feed the cat");
    if (n === 3) tick(B, "afternoon", "kid_a", "Water the plants");
    if (n === 4) { tick(B, "chores", "kid_a", "Vacuum the den"); V.A.run("haMomOn();1"); V.A.run("amSend('afternoon','kid_a',_todayDay," + idxOf(V.A, "afternoon", "kid_a", "Water the plants") + ")"); }
    if (n === 5) { tick(B, "chores", "kid_a", "Dust the shelves"); tick(B, "chores", "kid_a", "Wipe the table"); tick(B, "chores", "kid_a", "Zoned sweep"); }
    if (n === 6) tick(B, "chores", "kid_b", "Sweep the porch");
    await w.flush();
    if (n === 5) { const id = V.A.run("Object.keys(amCarry.kid_a||{})[0]||''"); V.A.run("haMomOn();1"); V.A.run("amMomTick('kid_a'," + J(id) + ",_todayDay)"); await w.flush();   // the 🌅 plants, ticked on Wednesday's morning list
      loadH(V.A, V.hjs); const D = V.A.run("JSON.stringify(lgDay(0))"); V.A.run("(function(){ const D=JSON.parse(" + J(D) + "), i=" + idxOf(V.A, "chores", "kid_a", "Dust the shelves", "wednesday") + "; lgGive('kid_a',D.wk,D.dn,'chores',i); })()"); await w.flush(); }   // ⭐ L2 on the late dust
    V.A.run("haMomOn();tab='moms-plan';1"); V.A.run("mdCardKidsToday(mdTodayName(),true,true)"); await w.flush();
  }
  const scr = V => { const o = { lists: kidLists(V.B) }; V.A.run("haMomOn();tab='moms-plan';1"); o.momsDay = page(V.A, "renderMomsPlan"); o.dadsDay = page(V.Dd, "renderDadsDay"); V.B.run("kcKid='kid_a';1"); o.corner = page(V.B, "renderKidsCorner");
    o.bank = V.A.run("JSON.stringify(ROSTER.map(function(k){ return [bankBalance(k),bankLedger(k).length]; }))"); o.log = V.A.run("chSettingsClickoffLogHTML()"); o.ck = ck(V.A); o.dck = ck(V.Dd); return o; };
  const a = scr(X), b = scr(BW), diff = Object.keys(a).filter(k => J(a[k]) !== J(b[k]));
  loadH(X.A, X.hjs); loadH(BW.A, BW.hjs); const pa = {}, pb = {};
  for (const k of ["kid_a", "kid_b", "kid_c"]) for (let j = 0; j >= -Math.min(n, 6); j--) { pa[k + j] = pop(X.A, k, j); pb[k + j] = pop(BW.A, k, j); }
  pa.week = pop(X.A, "kid_a", 0, 1); pb.week = pop(BW.A, "kid_a", 0, 1); X.A.run("lgClose();1"); BW.A.run("lgClose();1");
  S.same.push([n, diff, ctree(w) === ctree(BW.w), w.db.log.length === BW.w.db.log.length, diff.length ? [a[diff[0]].slice(0, 200), b[diff[0]].slice(0, 200)] : null]);
  S.pop.push([n, Object.keys(pa).filter(k => stripSB(pa[k]) !== pb[k]), Object.keys(pa).reduce((o, k) => (o[k] = (pa[k].match(SBB) || []).length, o), {})]);
}
const wk = A.run("activeWk()"), pwk = A.run("_prevWkKey()");
A.run("haMomOn();1"); BW.A.run("haMomOn();1"); loadH(A, X.hjs);
const I = { bed: idxOf(A, "morning", "kid_a", "Make the bed"), cat: idxOf(A, "chores", "kid_a", "Feed the cat"), vac: idxOf(A, "chores", "kid_a", "Vacuum the den", "tuesday"), dust: idxOf(A, "chores", "kid_a", "Dust the shelves", "wednesday"),
  table: idxOf(A, "chores", "kid_a", "Wipe the table", "wednesday"), zone: idxOf(A, "chores", "kid_a", "Zoned sweep", "wednesday"), porch: idxOf(A, "chores", "kid_b", "Sweep the porch"), laundry: idxOf(A, "morning", "kid_a", "Start your laundry") };
const carry = A.run("Object.keys(amCarry.kid_a||{})[0]||''");

// ── A ──
console.log("\n── A · while nobody taps: every screen and the database = the app before (the penalty set at 100 in both) ──");
ok("7 days: the kids' lists, Mom's Day, Dad's Day, Kids' Corner, the Star Bank, the Click-off Log, 🧾 (Mom's and Dad's) = the app before, byte for byte", S.same.every(s => s[1].length === 0), S.same.filter(s => s[1].length));
ok("…and the whole database and the number of writes = the app before, every day (drawing the button writes nothing)", S.same.every(s => s[2] && s[3]), S.same.filter(s => !(s[2] && s[3])).map(s => s[0]));
ok("the 📒 pop-up (3 kids, every day this week and Friday, This week) = the app before once ↩ Send back is taken out", S.pop.every(p => p[1].length === 0), S.pop.filter(p => p[1].length));
const TH = pop(A, "kid_a", 0), WE = pop(A, "kid_a", -1), TU = pop(A, "kid_a", -2), FR = pop(A, "kid_a", -6), LTU = pop(A, "kid_a", -9), BTH = pop(A, "kid_b", 0);
{ const sb = h => rowsRaw(h).filter(r => SBB.test(r) && !(SBB.lastIndex = 0)).map(r => txt(r).replace(/ ↩ Send back.*$/, ""));
  ok("Thursday: ↩ Send back on the 3 ticked rows (the bed, the laundry Start, the cat), nowhere else", J(sb(TH).map(s => s.split(" ")[1] + " " + s.split(" ")[2])) === J(["🛏 Make", "👕 Start", "🐱 Feed"]) && sb(TH).length === 3, sb(TH));
  ok("Wednesday: on the 🌅 plants, the late dust (beside ⭐ Mom gave back +2 and its Undo), the table (C5), the zoned sweep — never more than two buttons on a row",
    ["Water the plants", "Dust the shelves", "Wipe the table", "Zoned sweep"].every(l => /↩ Send back/.test(rowT(WE, l))) && rowsRaw(WE).every(r => (r.match(/<button /g) || []).length <= 2) && /⭐ Mom gave back \+2 ⭐ Undo ↩ Send back$|↩ Send back.*⭐ Mom gave back \+2 ⭐ Undo$/.test(rowT(WE, "Dust the shelves")), [sb(WE), rowT(WE, "Dust the shelves")]);
  ok("Tuesday: on the vacuum (done late, \"paid 8 of 10 ⭐\"); not on the plants' \"sent to the next morning\" row", /paid 8 of 10/.test(rowT(TU, "Vacuum the den")) && /↩ Send back/.test(rowT(TU, "Vacuum the den")) && !/Send back/.test(rowT(TU, "Water the plants")), [rowT(TU, "Vacuum the den"), rowT(TU, "Water the plants")]);
  ok("last week (Tue 11/24, Fri 11/27): no ↩ Send back on its ticked rows (the un-tick reaches this week only)", /^✅ 🐱 Feed the cat/.test(rowT(FR, "Feed the cat")) && /^✅ 🐱 Feed the cat/.test(rowT(LTU, "Feed the cat")) && !SBB.test(FR) && !SBB.test(LTU), [rowT(FR, "Feed the cat"), rowT(LTU, "Feed the cat")]);
  ok("kid_b's held porch (⏸ waiting for your ✓): ↩ Send back too", /^⏸ 🧺 Sweep the porch waiting for your ✓ · \d+ ⭐/.test(rowT(BTH, "Sweep the porch")) && /↩ Send back/.test(rowT(BTH, "Sweep the porch")), rowT(BTH, "Sweep the porch"));
  ok("the button's tip: \"It was not done, or it was a mistake: it goes back on the list and its stars come off. Asks which.\"", /title="It was not done, or it was a mistake: it goes back on the list and its stars come off\. Asks which\."[^>]*>↩ Send back</.test(rowRaw(TH, "Feed the cat")));
  S.dump.before = TH;
}
console.log("\n── the ask ──");
const aCat = "'kid_a','" + wk + "','thursday','s:chores:" + I.cat + "'";
{ const m = w.mark(), h = LG(A, "lgGo('kid_a',0,0);lgSbAskSet('kid_a|" + wk + "|thursday|s:chores:" + I.cat + "')");
  ok("tapping it asks one thing in the row: ↩ Send back \"Feed the cat\"? · 🚩 Wasn't done · Just a mistake · Cancel; nothing written", /↩ Send back "Feed the cat"\? 🚩 Wasn't done It goes back on Kid A's list and its 8 ⭐ come off, and 100 ⭐ more come off \(the penalty\)\. The Click-off Log gets a 🚩\. Just a mistake It goes back on Kid A's list and its 8 ⭐ come off\. Nothing more, and nothing is said to Kid A\. Cancel$/.test(rowT(h, "Feed the cat")) && writes(w, m).length === 0, rowT(h, "Feed the cat"));
  ok("…the two answers are buttons lgSendBack(…,'w') and (…,'m'); the answers come from one list (LG_SBA), so L6 adds one entry", h.indexOf("lgSendBack(" + aCat + ",'w')") > 0 && h.indexOf("lgSendBack(" + aCat + ",'m')") > 0 && J(A.run("JSON.stringify(LG_SBA.map(function(x){ return x.a; }))")) === J('["w","m"]'));
  S.dump.ask = h; const c = LG(A, "lgSbAskSet('')"); ok("Cancel closes it, nothing written", !/Send back "/.test(c) && writes(w, m).length === 0);
}

// ── J ──
console.log("\n── J · Just a mistake = the Kids today pop-up's un-tick, write for write, on every kind of row ──");
const ROWS = [
  ["the cat (today)", "kid_a", "thursday", "s:chores:" + I.cat, "mdKidTick('chores','kid_a','thursday'," + I.cat + ")", 10],
  ["the bed (Morning, today)", "kid_a", "thursday", "s:morning:" + I.bed, "mdKidTick('morning','kid_a','thursday'," + I.bed + ")", 5],
  ["the vacuum (late, Tue)", "kid_a", "tuesday", "s:chores:" + I.vac, "mdKidTick('chores','kid_a','tuesday'," + I.vac + ")", 8],
  ["the dust (late, ⭐ given back)", "kid_a", "wednesday", "s:chores:" + I.dust, "mdKidTick('chores','kid_a','wednesday'," + I.dust + ")", 10],
  ["the table (C5: paid less)", "kid_a", "wednesday", "s:chores:" + I.table, "mdKidTick('chores','kid_a','wednesday'," + I.table + ")", 8],
  ["the zoned sweep (bonus room double)", "kid_a", "wednesday", "s:chores:" + I.zone, "mdKidTick('chores','kid_a','wednesday'," + I.zone + ")", 20],
  ["the 🌅 plants (Wed morning)", "kid_a", "wednesday", "a:" + carry, "amMomTick('kid_a'," + J(carry) + ",'wednesday')", 5],
  ["kid_b's held porch", "kid_b", "thursday", "s:chores:" + I.porch, "mdKidTick('chores','kid_b','thursday'," + I.porch + ")", 0]
];
const JW = {}, T0 = ctree(w), B0 = { a: bal(A, "kid_a"), b: bal(A, "kid_b") };
const paidOf = (kid, dn, ref) => JSON.parse(A.run("(function(){ const R=lgSbR('" + kid + "','" + wk + "','" + dn + "','" + ref + "'); const g=(bank['" + kid + "'].adjustments||{})['lgb_'+String(R.c).split('/sl/')[1]]; return JSON.stringify((lgHeld('" + kid + "',R.rec.bid)?0:(R.rec.pts||0))+(g?g.amount:0)); })()"));   // what the tick paid, and a ⭐ give-back on it
for (const [nm, kid, dn, ref, js, p0] of ROWS) {
  const mX = w.mark(), mB = BW.w.mark(), b0 = bal(A, kid), paid = paidOf(kid, dn, ref);
  const r = A.run("lgSendBack('" + kid + "','" + wk + "','" + dn + "','" + ref + "','m')"); BW.A.run(js + ";1"); await w.flush(); await BW.w.flush();
  JW[kid + ref] = MASK(WS(w, mX));
  ok("Just a mistake on " + nm + ": yes; the same writes as the pop-up's un-tick (" + JW[kid + ref].length + "), the same database (but the times), the same bank: −" + paid + " (what the tick paid, with any ⭐ given back on it)",
    r === true && J(JW[kid + ref]) === J(MASK(WS(BW.w, mB))) && ntree(w) === ntree(BW.w) && bal(A, kid) === b0 - paid && bal(A, kid) === bal(BW.A, kid), [r, JW[kid + ref], MASK(WS(BW.w, mB)), ddiff(noTs(w.db.tree.root), noTs(BW.w.db.tree.root)), bal(A, kid), b0]);
}
ok("…every screen the same as the pop-up's un-tick: the kids' lists, Mom's Day, Kids' Corner, the Star Bank lines (\"↩︎ Mom undid: …\"), the Click-off Log, 🧾", J(kidLists(B)) === J(kidLists(BW.B)) && page(A, "renderMomsPlan") === page(BW.A, "renderMomsPlan") && A.run("chSettingsClickoffLogHTML()") === BW.A.run("chSettingsClickoffLogHTML()") && ck(A) === ck(BW.A)
  && A.run("JSON.stringify(bankLedger('kid_a').map(function(x){ return [x.amount,x.note]; }))") === BW.A.run("JSON.stringify(bankLedger('kid_a').map(function(x){ return [x.amount,x.note]; }))"));
{ const t = pop(A, "kid_a", 0), we = pop(A, "kid_a", -1);
  ok("the rows read as the lists do (○ not done yet), with \"↩ sent back · just a mistake\" and Undo in the spot; the late dust (not due Wed) keeps a line of its own there, its ⭐ give-back gone with the un-tick", /^○ 🐱 Feed the cat not done yet( · [^⭐]*⭐)? 10 ⭐ ↩ sent back · just a mistake Undo ➖ Excuse$/.test(rowT(t, "Feed the cat")) && rowT(we, "Dust the shelves") === "↩ 🪶 Dust the shelves ↩ sent back · just a mistake Undo", [rowT(t, "Feed the cat"), rowT(we, "Dust the shelves")]);
  S.dump.mistake = t; S.dump.kidM = { list: kidLists(B).kid_achores, bank: JSON.parse(A.run("JSON.stringify(bankLedger('kid_a').slice(0,4).map(function(x){ return [x.amount,x.note]; }))")) }; }
for (const [nm, kid, dn, ref] of ROWS.slice().reverse()) { const r = A.run("lgSbUndo('" + kid + "','" + wk + "','" + dn + "','" + ref + "')"); await w.flush(); if (!r) ok("Undo " + nm, false); }
ok("each Undo (last first) puts the tick and its pay back exactly: the database = before, byte for byte (the times too), the banks as before", ctree(w) === T0 && bal(A, "kid_a") === B0.a && bal(A, "kid_b") === B0.b, ddiff(JSON.parse(ctree(w)), JSON.parse(T0)));
ok("…and on this device only: a second Undo finds nothing (nothing written)", (m => A.run("lgSbUndo('kid_a','" + wk + "','thursday','s:chores:" + I.cat + "')") === false && writes(w, m).length === 0)(w.mark()));

// ── W ──
console.log("\n── W · Wasn't done = the un-tick + ONE fixed-id minus line + the 🚩 mark on the tick's own log line; Undo exact ──");
for (const [nm, kid, dn, ref] of ROWS) {
  const t0 = ctree(w), b0 = bal(A, kid), paid = paidOf(kid, dn, ref), kL = A.run("JSON.stringify((function(){ const R=lgSbR('" + kid + "','" + wk + "','" + dn + "','" + ref + "'); const L=lgSbLine(R); return [L.wk,L.d,L.key]; })())"), k3 = JSON.parse(kL), m = w.mark();
  const r = A.run("lgSendBack('" + kid + "','" + wk + "','" + dn + "','" + ref + "','w')"); await w.flush();
  const ws = MASK(WS(w, m)), fid = "flg_" + k3.join("_"), line = adj(w, kid)[fid], mk = lineOf(w, kid, k3);
  ok("Wasn't done on " + nm + ": the un-tick's writes, then set bank/" + kid + "/adjustments/flg_<wk>_<day>_<its log key> and one update of its log line; −" + paid + " −100",
    r === true && J(ws) === J(JW[kid + ref].concat(MASK(["set bank/" + kid + "/adjustments/" + fid, "update routineLog/" + kid + "/" + k3.join("/") + " [flagged,penalty,flagTs,flagBy,flagBid,sb]"]))) && bal(A, kid) === b0 - paid - 100, [r, ws, JW[kid + ref], bal(A, kid), b0]);
  ok("…the line: −100 \"🚩 Wasn't done: " + nm.split(" (")[0].replace(/^the (🌅 )?|^kid_b's held /, "") + "…· by Mom\"; the mark {flagged, penalty −100, flagBy mom, flagBid = that id, sb}", !!line && line.amount === -100 && /^🚩 Wasn't done: .+ · by Mom$/.test(line.note) && line.src === "earn" && mk.flagged === true && mk.penalty === -100 && mk.flagBy === "mom" && mk.flagBid === fid && !!mk.sb && mk.sb.r === ref, [line, mk && Object.assign({}, mk, { sb: !!mk.sb })]);
  const u = A.run("lgFlagUndo('step','" + kid + "','" + k3.join("/") + "',0)"); await w.flush();
  ok("…Undo (the ledger's): the database = before, byte for byte; the bank as before", u === true && ctree(w) === t0 && bal(A, kid) === b0, ddiff(JSON.parse(ctree(w)), JSON.parse(t0)));
}
// ── D ──
console.log("\n── D · one record: the ledger, the Click-off Log and 🧾 agree, both ways ──");
{ const kc = logKey(A, "kid_a", "Feed the cat"), m = w.mark();
  A.run("lgSendBack(" + aCat + ",'w')"); await w.flush();
  const L = A.run("chSettingsClickoffLogHTML()"), C = ck(A), CD = ck(Dd), t = pop(A, "kid_a", 0);
  ok("after Wasn't done: the Click-off Log's line says \"🚩 Wasn't done · by Mom · −100\" with an undo, and no ⚠️", /🚩 Wasn't done · by Mom · −100/.test(logRow(L, "Feed the cat")) && /flagUndo\('step','kid_a','[^']+'\)/.test(logRow(L, "Feed the cat")) && !/rlogFlag/.test(logRow(L, "Feed the cat")), logRow(L, "Feed the cat").slice(0, 600));
  ok("…🧾 (Mom's) the same mark and undo, no −100; Dad's 🧾 (locked) the mark, no undo, no −100", /🚩 Wasn't done · by Mom · −100/.test(ckRow(C, "Feed the cat")) && /flagUndo/.test(ckRow(C, "Feed the cat")) && !/ckLogDock/.test(ckRow(C, "Feed the cat")) && /🚩 Wasn't done · by Mom · −100/.test(ckRow(CD, "Feed the cat")) && !/flagUndo|ckLogDock/.test(ckRow(CD, "Feed the cat")), [ckRow(C, "Feed the cat").slice(-500), ckRow(CD, "Feed the cat").slice(-300)]);
  ok("…the ledger row: \"○ … not done yet … ↩ sent back · Wasn't done · by Mom · −100 Undo\" (and ➖ Excuse: two buttons)", /^○ 🐱 Feed the cat not done yet( · [^⭐]*⭐)? 10 ⭐ ↩ sent back · Wasn't done · by Mom · −100 Undo ➖ Excuse$/.test(rowT(t, "Feed the cat")), rowT(t, "Feed the cat"));
  S.dump.wasnt = t; S.dump.logW = logRow(L, "Feed the cat"); S.dump.ckW = ckRow(C, "Feed the cat"); S.dump.ckWD = ckRow(CD, "Feed the cat");
  S.dump.kidW = { list: kidLists(B).kid_achores, bank: JSON.parse(A.run("JSON.stringify(bankLedger('kid_a').slice(0,4).map(function(x){ return [x.amount,x.note]; }))")) };
  const m2 = w.mark(); A.run("rlogFlag('kid_a'," + J(kc[0]) + "," + J(kc[1]) + "," + J(kc[2]) + ")"); A.run("ckLogDock('step','kid_a'," + J(kc.join("/")) + ",'Feed the cat')"); await w.flush();
  ok("…the log's ⚠️ and 🧾's −100 called anyway on that line: nothing (never twice)", writes(w, m2).length === 0);
  const b1 = bal(A, "kid_a"), m3 = w.mark(); Dd.run("__cf.length=0;1"); Dd.run("dadUnlocked=true;1"); loadH(Dd, HJS);
  const u = Dd.run("flagUndo('step','kid_a'," + J(kc.join("/")) + ")"); await w.flush();
  ok("🧾's undo (Dad, his code in; it asks) puts it all back: the tick, its 8 (C5), the 100, the mark — the database as before Wasn't done", /^Take the 🚩 off Kid A's "Feed the cat"\?\n\nThe 100 ⭐ go back\.\n\nIt is ticked again and paid as it was\.$/.test(Dd.run("__cf[0]")) && bal(A, "kid_a") === b1 + 108 && ctree(w) === (await (async () => T0)()), [Dd.run("__cf[0]"), bal(A, "kid_a") - b1, ddiff(JSON.parse(ctree(w)), JSON.parse(T0))]);
  Dd.run("dadUnlocked=false;1");
  // the other way: the log's ⚠️ first
  const m4 = w.mark(); A.run("rlogFlag('kid_a'," + J(kc[0]) + "," + J(kc[1]) + "," + J(kc[2]) + ")"); await w.flush();
  const t2 = pop(A, "kid_a", 0), C2 = ck(A);
  ok("the Click-off Log's ⚠️ first: −100 with the fixed id flg_<wk>_<day>_<key>, the mark; the chore stays ticked", J(MASK(WS(w, m4))) === J(MASK(["set bank/kid_a/adjustments/flg_" + kc.join("_"), "update routineLog/kid_a/" + kc.join("/") + " [flagged,penalty,flagTs,flagBy,flagBid]"])) && A.run("rtDoneOn('chores','kid_a','thursday'," + I.cat + ")") === true, MASK(WS(w, m4)));
  ok("…the ledger row shows \"🚩 by Mom · −100\" with Undo and no ↩ Send back; 🧾 the mark and undo, no −100", /^✅ 🐱 Feed the cat .*\+8 ⭐ .*🚩 by Mom · −100 Undo$/.test(rowT(t2, "Feed the cat")) && !SBB.test(rowRaw(t2, "Feed the cat")) && /🚩 by Mom · −100/.test(ckRow(C2, "Feed the cat")) && !/ckLogDock/.test(ckRow(C2, "Feed the cat")), [rowT(t2, "Feed the cat"), ckRow(C2, "Feed the cat").slice(-300)]);
  S.dump.logFirst = t2;
  ok("…Wasn't done called anyway: refused (one record), nothing written", (mm => A.run("lgSendBack(" + aCat + ",'w')") === false && writes(w, mm).length === 0)(w.mark()));
  const u2 = A.run("lgFlagUndo('step','kid_a'," + J(kc.join("/")) + ",0)"); await w.flush();
  ok("…the ledger row's Undo takes the mark and the 100 off; the tick stays; the database as before", u2 === true && ctree(w) === T0, ddiff(JSON.parse(ctree(w)), JSON.parse(T0)));
  // 🧾 −100 first, then the log's undo
  A.run("ckLogDock('step','kid_a'," + J(kc.join("/")) + ",'Feed the cat')"); await w.flush();
  const L3 = A.run("chSettingsClickoffLogHTML()"), t3 = pop(A, "kid_a", 0);
  ok("🧾's −100 first: the Click-off Log shows its mark with undo, no ⚠️; the ledger the mark, no Send back", /🚩 by Mom · −100/.test(logRow(L3, "Feed the cat")) && !/rlogFlag/.test(logRow(L3, "Feed the cat")) && /🚩 by Mom · −100 Undo$/.test(rowT(t3, "Feed the cat")) && !SBB.test(rowRaw(t3, "Feed the cat")), [rowT(t3, "Feed the cat")]);
  S.dump.logC = logRow(L3, "Feed the cat"); S.dump.ckC = ckRow(ck(A), "Feed the cat");
  A.run("__cf.length=0;1"); A.run("flagUndo('step','kid_a'," + J(kc.join("/")) + ")"); await w.flush();
  ok("…the log's undo (it asks: \"…The 100 ⭐ go back.\") takes it off: the database as before", /^Take the 🚩 off Kid A's "Feed the cat"\?\n\nThe 100 ⭐ go back\.$/.test(A.run("__cf[0]")) && ctree(w) === T0, [A.run("__cf[0]"), ddiff(JSON.parse(ctree(w)), JSON.parse(T0))]);
  // a ticked-again row: undo keeps the new tick
  A.run("lgSendBack(" + aCat + ",'w')"); await w.flush(); tick(B, "chores", "kid_a", "Feed the cat"); await w.flush();
  const b2 = bal(A, "kid_a"), t4 = pop(A, "kid_a", 0);
  ok("ticked again after Wasn't done: the new tick has its own ↩ Send back; the mark stays on the old line", /^✅ 🐱 Feed the cat .*↩ Send back$/.test(rowT(t4, "Feed the cat")), rowT(t4, "Feed the cat"));
  A.run("__cf.length=0;1"); A.run("flagUndo('step','kid_a'," + J(kc.join("/")) + ")"); await w.flush();
  ok("…its undo says so and gives back only the 100 (the new tick stays, paid once)", /It was ticked again since, so that tick stays\.$/.test(A.run("__cf[0]")) && bal(A, "kid_a") === b2 + 100 && A.run("rtDoneOn('chores','kid_a','thursday'," + I.cat + ")") === true, [A.run("__cf[0]"), bal(A, "kid_a") - b2]);
}
// ── S ──
console.log("\n── S · the amount is the one penalty; Take stars away off and ⏸ take nothing, never later; the default ──");
const fresh = async (kid, label) => { tick(B, "chores", kid, label); await w.flush(); const i = idxOf(A, "chores", kid, label); return "'" + kid + "','" + wk + "','thursday','s:chores:" + i + "'"; };
{ const a1 = "'kid_c','" + wk + "','thursday','s:chores:" + idxOf(A, "chores", "kid_c", "Toys in the bin") + "'";
  A.run("spotSetOnValue({penalty:{on:true,pts:50}})"); tick(B, "chores", "kid_c", "Toys in the bin"); await w.flush();
  let b0 = bal(A, "kid_c"); const p3 = A.run("hdSlRec('chores','kid_c','thursday'," + idxOf(A, "chores", "kid_c", "Toys in the bin") + ").pts"); A.run("lgSendBack(" + a1 + ",'w')"); await w.flush();
  const L = A.run("chSettingsClickoffLogHTML()");
  ok("the penalty at 50 (her 🔎 Spot check ⚙): Wasn't done takes what the tick paid (" + p3 + ") + 50; the mark −50; the log and 🧾 say −50", bal(A, "kid_c") === b0 - p3 - 50 && /🚩 Wasn't done · by Mom · −50/.test(logRow(L, "Toys in the bin")) && /tap ⚠️ −50 to dock 50 points\./.test(L) && />−50<\/button>|−50/.test(ck(A)), [bal(A, "kid_c") - b0]);
  const ka = logKey(A, "kid_a", "Feed the cat"); A.run("__cf.length=0;1"); b0 = bal(A, "kid_a"); A.run("rlogFlag('kid_a'," + J(ka[0]) + "," + J(ka[1]) + "," + J(ka[2]) + ")"); await w.flush();
  ok("…the Click-off Log's ⚠️ asks \"Dock 50 points…\" and takes 50", /^Dock 50 points from Kid A/.test(A.run("__cf[0]")) && bal(A, "kid_a") === b0 - 50, A.run("__cf[0]"));
  A.run("lgFlagUndo('step','kid_a'," + J(ka.join("/")) + ",0)"); await w.flush();
  A.run("spotSetOnValue({penalty:{on:false,pts:50}})"); b0 = bal(A, "kid_a"); A.run("__cf.length=0;1"); const m = w.mark(); A.run("rlogFlag('kid_a'," + J(ka[0]) + "," + J(ka[1]) + "," + J(ka[2]) + ")"); await w.flush();
  ok("the penalty OFF: the log's ⚠️ still marks the line (penalty 0, no line), asking \"…The penalty is off, so no stars come off.\"; its label \"⚠️ 🚩 Mark\"", J(WS(w, m)) === J(["update routineLog/kid_a/" + ka.join("/") + " [flagged,penalty,flagTs,flagBy]"]) && bal(A, "kid_a") === b0 && /The penalty is off, so no stars come off\./.test(A.run("__cf[0]")) && lineOf(w, "kid_a", ka).penalty === 0, [WS(w, m), A.run("__cf[0]")]);
  ok("…🧾's button reads \"🚩 Mark\" and its foot \"A dock takes no stars (the penalty is off) and marks the line.\"", />🚩 Mark<\/button>/.test(ck(A)) && /A dock takes no stars \(the penalty is off\) and marks the line\./.test(ck(A)));
  A.run("lgFlagUndo('step','kid_a'," + J(ka.join("/")) + ",0)"); await w.flush();
  const aB = "'kid_a','" + wk + "','thursday','s:morning:" + I.bed + "'"; b0 = bal(A, "kid_a"); const m2 = w.mark(); A.run("lgSendBack(" + aB + ",'w')"); await w.flush();
  const kb = logKey(A, "kid_a", "Make the bed");
  ok("…Wasn't done with the penalty off: the un-tick (−5) and the mark with penalty 0, no minus line; the row says \"no stars taken\"", bal(A, "kid_a") === b0 - 5 && lineOf(w, "kid_a", kb).penalty === 0 && !Object.keys(adj(w, "kid_a")).some(k => k.indexOf("flg_" + kb.join("_")) === 0) && /↩ sent back · Wasn't done · by Mom · no stars taken Undo/.test(rowT(pop(A, "kid_a", 0), "Make the bed")), [bal(A, "kid_a") - b0, rowT(pop(A, "kid_a", 0), "Make the bed")]);
  A.run("lgFlagUndo('step','kid_a'," + J(kb.join("/")) + ",0)"); await w.flush();
  ok("…its Undo puts the tick and its 5 back", bal(A, "kid_a") === b0 && A.run("mStepDoneOn('kid_a','thursday'," + I.bed + ")") === true);
  A.run("spotSetOnValue({penalty:{on:true,pts:100}})");
  // Take stars away off, ⏸
  A.run("lgRuleTake('kid_a')"); await w.flush(); b0 = bal(A, "kid_a"); A.run("lgSendBack(" + aB + ",'w')"); await w.flush();
  const askT = rowT(LG(A, "lgGo('kid_a',0,0);lgSbAskSet('kid_a|" + wk + "|thursday|s:chores:" + I.cat + "')"), "Feed the cat"); A.run("lgSbAskSet('');1");
  ok("Take stars away OFF for kid_a: Wasn't done un-ticks (−5) and marks, penalty 0; the ask says \"…and no more come off (Taking stars away is off for Kid A).\"", bal(A, "kid_a") === b0 - 5 && lineOf(w, "kid_a", kb).penalty === 0 && /and no more come off \(Taking stars away is off for Kid A\)\./.test(askT), [bal(A, "kid_a") - b0, askT]);
  A.run("lgRuleTake('kid_a')"); await w.flush(); A.run("renderAll();1"); await w.flush();
  ok("…switched back ON: nothing taken later (a flip never reaches back)", bal(A, "kid_a") === b0 - 5 && lineOf(w, "kid_a", kb).penalty === 0);
  A.run("lgFlagUndo('step','kid_a'," + J(kb.join("/")) + ",0)"); await w.flush();
  A.run("lgRulePause()"); await w.flush(); b0 = bal(A, "kid_a"); A.run("lgSendBack(" + aB + ",'w')"); await w.flush();
  ok("⏸ Pause ON: the same (un-tick, mark, penalty 0); off again: nothing taken later", bal(A, "kid_a") === b0 - 5 && lineOf(w, "kid_a", kb).penalty === 0 && (A.run("lgRulePause()"), await w.flush(), bal(A, "kid_a") === b0 - 5));
  A.run("lgFlagUndo('step','kid_a'," + J(kb.join("/")) + ",0)"); await w.flush();
  ok("the penalty where nobody set it: ON at 100 (spPenalty with no settings, the same the 🔎 Spot check uses); a set one is kept: off stays off, 50 stays 50, {pts:50} alone is on at 50",
    (A.run("spotSetOnValue(null)"), J(A.run("JSON.stringify(spPenalty())")) === J('{"on":true,"pts":100}')) && (A.run("spotSetOnValue({penalty:{on:false}})"), J(A.run("JSON.stringify(spPenalty())")) === J('{"on":false,"pts":100}'))
    && (A.run("spotSetOnValue({penalty:{on:true,pts:50}})"), A.run("spPenalty().pts") === 50) && (A.run("spotSetOnValue({penalty:{pts:50}})"), J(A.run("JSON.stringify(spPenalty())")) === J('{"on":true,"pts":50}')) && J(BW.A.run("(spotSetOnValue(null),JSON.stringify(spPenalty()))")) === J('{"on":false,"pts":100}'));
  A.run("spotSetOnValue({penalty:{on:true,pts:100}})");
}
// ── T ──
console.log("\n── T · two taps, two devices ──");
{ const A2 = w.boot("A2", "devA2", { mom: true }); await w.flush(); A2.run(CAP); A2.run("haMomOn();1"); loadH(A2, HJS);
  const aT = await fresh("kid_c", "Toys in the bin"), kt = logKey(A, "kid_c", "Toys in the bin"), b0 = bal(A, "kid_c");
  A.run("lgSendBack(" + aT + ",'w')"); await w.flush(); const m = w.mark();
  ok("a second tap here, and Wasn't done on a second Mom device: refused, nothing written (the row is no longer ticked)", A.run("lgSendBack(" + aT + ",'w')") === false && A2.run("lgSendBack(" + aT + ",'w')") === false && (await w.flush(), writes(w, m).length === 0) && bal(A, "kid_c") < b0 - 99);
  await A.run("lgFlagUndo('step','kid_c'," + J(kt.join("/")) + ",0)"); await w.flush();
  const b1 = bal(A, "kid_c"), m2 = w.mark(); A.run("lgSendBack(" + aT + ",'w')"); A2.run("lgSendBack(" + aT + ",'w')"); await w.flush();
  const pen = Object.keys(adj(w, "kid_c")).filter(k => k === "flg_" + kt.join("_"));
  ok("both devices at the same moment (neither has heard the other): ONE penalty line (the fixed id), one mark", pen.length === 1 && adj(w, "kid_c")[pen[0]].amount === -100 && lineOf(w, "kid_c", kt).flagged === true, [pen, WS(w, m2)]);
  S.race = bal(A, "kid_c") - b1;
}
// ── G ──
console.log("\n── G · Dad's link, a kid's device, ?dryrun=1 ──");
{ loadH(Dd, HJS); const aT = await fresh("kid_a", "Wipe the table"), m = w.mark();
  const dl = pop(Dd, "kid_a", 0);
  ok("Dad's link, locked: the rows and the marks, no ↩ Send back; the taps refused, nothing written", !SBB.test(dl) && Dd.run("lgSendBack(" + aT + ",'w')") === false && Dd.run("lgSendBack(" + aT + ",'m')") === false && writes(w, m).length === 0);
  Dd.run("dadUnlocked=true;1"); const du = pop(Dd, "kid_a", 0), dw = pop(Dd, "kid_a", -1);
  ok("with his code in: ↩ Send back on today's ticked rows, not on Wednesday's (his un-tick reaches today only)", /↩ Send back/.test(rowT(du, "Wipe the table")) && !SBB.test(dw) && Dd.run("lgSendBack('kid_a','" + wk + "','wednesday','s:chores:" + I.zone + "','w')") === false, rowT(du, "Wipe the table"));
  const b0 = bal(A, "kid_a"), kt = logKey(A, "kid_a", "Wipe the table"); Dd.run("lgSendBack(" + aT + ",'w')"); await w.flush();
  const L = adj(w, "kid_a")["flg_" + kt.join("_")];
  ok("…Wasn't done by Dad: \"🚩 Wasn't done: Wipe the table · by Dad\" −100, the mark by dad; the un-tick's line \"↩︎ Dad undid: Wipe the table\"", !!L && L.note === "🚩 Wasn't done: Wipe the table · by Dad" && lineOf(w, "kid_a", kt).flagBy === "dad" && A.run("JSON.stringify(bankLedger('kid_a').map(function(x){ return x.note; }))").indexOf("↩︎ Dad undid: Wipe the table") >= 0 && bal(A, "kid_a") === b0 - 110, [L, bal(A, "kid_a") - b0]);
  ok("…and the row on Mom's ledger says \"by Dad\"", /↩ sent back · Wasn't done · by Dad · −100 Undo/.test(rowT(pop(A, "kid_a", 0), "Wipe the table")));
  Dd.run("lgFlagUndo('step','kid_a'," + J(kt.join("/")) + ",0)"); await w.flush(); Dd.run("dadUnlocked=false;1");
  ok("…his Undo puts it back", bal(A, "kid_a") === b0 && A.run("rtDoneOn('chores','kid_a','thursday'," + idxOf(A, "chores", "kid_a", "Wipe the table") + ")") === true);
  loadH(Kk, HJS); loadH(B, HJS); const m2 = w.mark();
  ok("a kid's device (the kiosk, a kid's own list): no pop-up, and the taps and undo refused, nothing written", Kk.run("(lgShow(),__pop)") === "" && Kk.run("lgSendBack(" + aT + ",'w')") === false && B.run("lgSendBack(" + aT + ",'m')") === false && Kk.run("lgFlagUndo('step','kid_a'," + J(kt.join("/")) + ",0)") === false && writes(w, m2).length === 0);
  const Dr = w.boot("Dr", "devDr", { mom: true }); await w.flush(); Dr.run(CAP); Dr.run("HA_LS.setItem('ha_dryrun','1');haMomOn();1"); loadH(Dr, HJS);
  Dr.run("(function(){ const o=db.ref.bind(db); db.ref=function(p){ const r=o(p); r.set=r.update=r.remove=function(){ return Promise.resolve(); }; return r; }; })();1");   // the app's boot-time dry-run patch (as test_dad_code_gates)
  await w.flush(); const m3 = w.mark();
  const dr = Dr.run("lgSendBack(" + aT + ",'w')"); await w.flush();
  ok("?dryrun=1 (Mom): the screen answers (un-ticked, marked here), nothing reaches the database", Dr.run("_dryRun()") === true && dr === true && writes(w, m3).length === 0, WS(w, m3));
}
// ── L ──
console.log("\n── L · laundry rows ──");
{ const iso = A.run("llToday()"), item = A.run("(rtStepsFor('morning','kid_a',false,_todayDay)||[])[" + I.laundry + "].line"), e0 = J(w.get("laundryLine/log/" + iso + "/" + item)), lid = (w.get("laundryLine/log/" + iso + "/" + item) || {}).load, t0 = ctree(w), b0 = bal(A, "kid_a");
  const aL = "'kid_a','" + wk + "','thursday','s:morning:" + I.laundry + "'";
  ok("Thursday's Start row is ticked and its load is in the washer", !!lid && (w.get("laundry/" + lid) || {}).stage === "washer", [lid, w.get("laundry/" + lid)]);
  const m = w.mark(); A.run("lgSendBack(" + aL + ",'w')"); await w.flush();
  ok("Wasn't done on \"Start your laundry\": the laundry's own ↩ back on the line (LE_BACKLINE: laundry/<id> removed, the line's log entry gone), the row un-ticked, its stars and 100 off", !w.get("laundry/" + lid) && !w.get("laundryLine/log/" + iso + "/" + item) && A.run("mStepDoneOn('kid_a','thursday'," + I.laundry + ")") === false && bal(A, "kid_a") === b0 - 10 - 100 && WS(w, m).some(s => s === "remove laundry/" + lid), [WS(w, m), bal(A, "kid_a") - b0]);
  ok("…the line offers 🫧 Start again for it (its \"is back on the laundry line\" toast)", A.run("JSON.stringify(__toast)").indexOf("is back on the laundry line") >= 0);
  S.dump.laundry = pop(A, "kid_a", 0);
  const kL = Object.values(A.run("JSON.stringify(lgSbMarks('kid_a'))") && JSON.parse(A.run("JSON.stringify(lgSbMarks('kid_a'))"))).filter(x => x.ref)[0];
  A.run("lgFlagUndo('step','kid_a'," + J(kL.ref) + ",0)"); await w.flush();
  ok("…Undo: the load back in the washer, the line's log entry back, the tick and its pay back — the database as before", ctree(w) === t0 && J(w.get("laundryLine/log/" + iso + "/" + item)) === e0 && bal(A, "kid_a") === b0, ddiff(JSON.parse(ctree(w)), JSON.parse(t0)));
  // the Fold row: the load to the fold pile, the kid ticks Fold
  A.run("(function(){ laundryData['" + lid + "'].stage='fold'; laundryData['" + lid + "'].ts=Date.now(); db.ref('laundry/" + lid + "').set(laundryData['" + lid + "']); })()"); await w.flush();
  const fi = idxOf(A, "afternoon", "kid_a", "Fold + put away");
  if (fi < 0) ok("the Fold row is on kid_a's afternoon list", false, A.run("JSON.stringify((rtStepsFor('afternoon','kid_a',false,_todayDay)||[]).map(function(x){ return x.label; }))"));
  else { tick(B, "afternoon", "kid_a", "Fold + put away"); await w.flush();
    ok("the kid ticks Fold: the load is put away", !w.get("laundry/" + lid));
    const t1 = ctree(w), b1 = bal(A, "kid_a"); A.run("lgSendBack('kid_a','" + wk + "','thursday','s:afternoon:" + fi + "','w')"); await w.flush();
    ok("Wasn't done on the Fold row: the un-tick brings the load back to the fold pile (FOLD_BACK), the stars and 100 off", (w.get("laundry/" + lid) || {}).stage === "fold" && A.run("rtDoneOn('afternoon','kid_a','thursday'," + fi + ")") === false && bal(A, "kid_a") < b1 - 99, [w.get("laundry/" + lid), bal(A, "kid_a") - b1]);
    const kF = JSON.parse(A.run("JSON.stringify(lgSbMarks('kid_a'))"))[wk + "|thursday|s:afternoon:" + fi];
    A.run("lgFlagUndo('step','kid_a'," + J(kF.ref) + ",0)"); await w.flush();
    ok("…Undo: put away again, the tick and its pay back — the database as before", ctree(w) === t1 && bal(A, "kid_a") === b1, ddiff(JSON.parse(ctree(w)), JSON.parse(t1))); }
}
// ── P ──
console.log("\n── P · a plan row (the plan ON) ──");
{ const P = await mkWorld(IDX, HJS, { mode: "on" }); await P.w.at(2026, 11, 26, 16, 0); await P.w.flush();
  const i = idxOf(P.B, "chores", "kid_a", "Unload the dishwasher"); tick(P.B, "chores", "kid_a", "Unload the dishwasher"); await P.w.flush();
  P.A.run("haMomOn();1"); loadH(P.A, HJS); const pw = P.A.run("activeWk()"), dn = P.A.run("_todayDay"), t0 = ctree(P.w), b0 = bal(P.A, "kid_a");
  const isH = P.A.run("!!(rtStepsFor('chores','kid_a',false,_todayDay)[" + i + "]||{}).house");
  const r = P.A.run("lgSendBack('kid_a','" + pw + "','" + dn + "','s:chores:" + i + "','w')"); await P.w.flush();
  const M = JSON.parse(P.A.run("JSON.stringify(lgSbMarks('kid_a'))"))[pw + "|" + dn + "|s:chores:" + i];
  ok("a plan row (houseDay/<iso>/done/<id>): Wasn't done un-ticks it by chore (hdToggle), −10 −100, the mark on its log line", isH && r === true && !!M && bal(P.A, "kid_a") === b0 - 110 && !P.A.run("hdDone(hdIsoOf(_todayDay),'c_a_dishes')"), [isH, r, bal(P.A, "kid_a") - b0]);
  P.A.run("lgFlagUndo('step','kid_a'," + J(M.ref) + ",0)"); await P.w.flush();
  ok("…Undo: done by chore again, its last-done stamps and the pay back — the database as before", ctree(P.w) === t0 && bal(P.A, "kid_a") === b0, ddiff(JSON.parse(ctree(P.w)), JSON.parse(t0)));
}
console.log("\n── Z · last: an Undo after the row was ticked again; an old mark ──");
{ const aC = "'kid_a','" + wk + "','thursday','s:chores:" + I.cat + "'"; A.run("lgSendBack(" + aC + ",'m')"); await w.flush(); tick(B, "chores", "kid_a", "Feed the cat"); await w.flush();
  const t1 = ctree(w), m = w.mark();
  ok("Just a mistake, then the kid ticks it again: its Undo does nothing (the new tick stays, paid once), nothing written", A.run("lgSbUndo(" + aC + ")") === false && (await w.flush(), writes(w, m).length === 0) && ctree(w) === t1);
}
{
  // an old mark (FLAGWHO, before L5: no line id kept): drawn as before, no undo anywhere
  { const ko = logKey(A, "kid_c", "Toys in the bin"); tick(B, "chores", "kid_c", "Toys in the bin"); await w.flush(); const kn = logKey(A, "kid_c", "Toys in the bin");
    A.run("(function(){ const r=routineLog.kid_c[" + J(kn[0]) + "][" + J(kn[1]) + "][" + J(kn[2]) + "]; Object.assign(r,{flagged:true,penalty:-100,flagTs:'9:30 AM',flagBy:'mom'}); })()");
    const Lo = A.run("chSettingsClickoffLogHTML()"), Co = ck(A), mo = w.mark();
    ok("an old −100 mark (no line id kept): \"🚩 by Mom · −100\" on the log and 🧾, no undo there; lgFlagUndo refuses it", /🚩 by Mom · −100/.test(logRow(Lo, "Toys in the bin")) && !/flagUndo/.test(logRow(Lo, "Toys in the bin")) && !/flagUndo/.test(ckRow(Co, "Toys in the bin")) && A.run("lgFlagUndo('step','kid_c'," + J(kn.join("/")) + ",0)") === false && writes(w, mo).length === 0, [logRow(Lo, "Toys in the bin").slice(-300)]);
    A.run("(function(){ const r=routineLog.kid_c[" + J(kn[0]) + "][" + J(kn[1]) + "][" + J(kn[2]) + "]; ['flagged','penalty','flagTs','flagBy'].forEach(function(f){ delete r[f]; }); })()"); }
}
if (process.env.LGS_DUMP) fs.writeFileSync(process.env.LGS_DUMP, J(S.dump));
console.log("\n(two devices at the same moment: the un-tick itself, the pop-up's own, ran on both: kid_c's bank moved " + S.race + " — see the report)");
console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
