/*
 * test_morning_why.js — CHOREAMWHY (index.html) + LEDGERAMZ (house.js): slice C4 of DESIGN_missed_chores_2026-11-19 (§2.5 "🌅 Send to next
 * morning asks why", §2.2's last row "never drops": −20% a day after zero, 5 days at most). Her words 11/19: "i think it asks at the time of
 * because maybe it was because the kid was sick or maybe because they ignored the chore".
 * The WHOLE app runs per device (test_fixtures/house_world.js: one shared in-memory Firebase with transactions, one virtual clock) on a
 * made-up family (kid_a … kid_d). Day 0 = Mon 11/30; RT_AMWHY_FROM = Mon 12/07 (day 7); the clock runs to Sat 12/19 (day 19).
 * Two pairs of worlds, each "this tree" beside "the app before" (THIS tree with C4 taken out — no git, no pinned commit):
 *   CALM — every send is closed without an answer, "not their fault", or made before the slate: every screen, every write and the whole
 *          database are byte for byte the app before's, but for the one `why` field (and the question's own onclick name in Mom's pop-up).
 *   IGNORED — "they ignored it": 10 → 8 → 6 … on every payer and display, then one bank line a day for at most 5 days (C3's way), the
 *          switches, days off, the 📒 Ledger's ⭐ Give stars back / Undo / ➖ Excuse / Undo, Dad, two devices, nobody drawing, dry-run.
 * MWHY_INDEX / MWHY_HJS = other copies (a mutation check). MWHY_DUMP = a file for the preview page's drawings.
 * run: node test_morning_why.js
 */
"use strict";
const fs = require("fs"), path = require("path"), os = require("os");
const W = require(path.join(__dirname, "test_fixtures", "house_world.js"));
let pass = 0, fail = 0; const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x).slice(0, 900) + ")" : "")); } };
const J = x => JSON.stringify(x), clone = x => JSON.parse(J(x));
const IDX = process.env.MWHY_INDEX || path.join(__dirname, "index.html"), HJS = fs.readFileSync(process.env.MWHY_HJS || path.join(__dirname, "house.js"), "utf8");

// ── the app before: this tree with C4 taken out ──
const once = (src, what, from, to, label) => { const n = typeof from === "string" ? src.split(from).length - 1 : (src.match(from) || []).length;
  if (n !== 1) throw new Error("test_morning_why: the app before cannot be built — " + label + " found " + n + "× in " + what + " (must be exactly once)"); return src.replace(from, () => to); };
const baseIdx = src => { let s = src; const R = (a, b, l) => { s = once(s, "index.html", a, b, l); };
  R(/^\/\/ CHOREAMWHY_START[^\n]*\n[\s\S]*?^\/\/ CHOREAMWHY_END\n/m, "", "the CHOREAMWHY block");
  R("function amSend(slot,kid,d,i,quiet,why){", "function amSend(slot,kid,d,i,quiet){", "amSend's why");
  R("{ if(why) return amWhySet(kid,id,why);   // CHOREAMWHY: a new answer\n    const ok=", "{ const ok=", "amSend's new answer");
  R(" else if((why===\"ignored\"||why===\"notfault\")&&typeof amAsks===\"function\"&&amAsks()) rec.why=why;   // CHOREAMWHY", "", "the carry's why");
  R("function amSendRest(kid,d,why){", "function amSendRest(kid,d){", "amSendRest's why"); R("x.i,true,why)) n++;", "x.i,true)) n++;", "Send all's why");
  R("const paid=now?(typeof amPay===\"function\"?amPay(kid,it,iso):(it.pts||0)):", "const paid=now?(it.pts||0):", "amToggle's pay");
  R(" if(!sd&&day===_todayDay&&typeof amCostSee===\"function\") amCostSee(kid,it);   // CHOREAMWHY: after 0, today's cost", "", "the Morning list's after-0 hook");
  R("'+(typeof amPayTxt===\"function\"?amPayTxt(kid,it,iso):\"+\"+(it.pts||0))+' ⭐</span>':'')+   // CHOREAMWHY: \"10 → 8 ⭐\"", "+'+(it.pts||0)+' ⭐</span>':'')+", "the Left over row's stars");
  R(/^ {2}const _q=\(typeof amAsks[^\n]*\n/m, "", "the chip's question"); R("stopPropagation();'+_q+'(", "stopPropagation();amSend(", "the chip's call"); R("+(_ig?' \\u{1F648}':'')", "", "the chip's 🙈");
  R("'+((typeof amAsks===\"function\"&&amAsks())?'amAskAll(\\''+kid+'\\',\\''+d+'\\',\\''+slot+'\\')':'amSendRest(\\''+kid+'\\',\\''+d+'\\')')+';boardStatPop(", "amSendRest(\\''+kid+'\\',\\''+d+'\\');boardStatPop(", "Send all's call");
  R("(it.pts?(typeof amPay===\"function\"&&amPay(kid,it,_ai)!==it.pts?\" \"+it.pts+\" → \"+amPay(kid,it,_ai)+\" ⭐\":\" +\"+it.pts+\" ⭐\"):\"\")", "(it.pts?\" +\"+it.pts+\" ⭐\":\"\")", "Mom's pop-up 🌅 row");
  R(/^ {4}if\(typeof amPopRows===[^\n]*\n/m, "", "Mom's pop-up sent row");
  R("left+=(typeof amPay===\"function\"?amPay(k,it,_ai):(it.pts||0)); });   // SENDAM · CHOREAMWHY", "left+=(it.pts||0); });   // SENDAM", "Kids' Corner's left");
  R(/, _ao=\(now&&typeof amOrigPay[^\n]*/, ", _b0=_st0?(_st0.pts||0):0;", "toggleRtStep's carry");
  R("&&!(typeof amWhyIg===\"function\"&&amWhyIg(am[iso+\"_\"+RT_ABBR[slot]+\"step\"+i])))) continue;   // CHOREAMWHY: an ignored 🌅 breaks it", ")) continue;", "the streak");
  R(/\+\(\(e\.amz&&e\.amz\.n\)\?[^\n]*?\/\* CHOREAMWHY \*\//, "", "the Click-off Log's line");
  if (/CHOREAMWHY|\bamWhy|\bamPay|\bamAsk|\bamCost|\bamz|RT_AMWHY_FROM/.test(s)) throw new Error("test_morning_why: the app before still mentions C4");
  return s; };
const baseHjs = src => { let s = src; const R = (a, b, l) => { s = once(s, "house.js", a, b, l); };
  R(/^\/\/ LEDGERAMZ_START[^\n]*\n[\s\S]*?^\/\/ LEDGERAMZ_END\n/m, "", "the LEDGERAMZ block");
  R("+((typeof amPay===\"function\"&&amPay(who,c,today)!==c.pts)?' · '+c.pts+' → '+amPay(who,c,today)+' ⭐':'')", "", "By person's chip"); R("   // CHOREAMWHY (C4): an ignored one shows what it pays", "", "…its comment");
  R("+(typeof lgAmzSent===\"function\"?lgAmzSent(kid,slot,i,D):\"\")});   // LEDGERAMZ", "});", "the ledger's 🌅 sent row");
  R(/^ {8}if\(typeof lgAmzRow===[^\n]*\n/m, "", "the ledger's carry row"); R(/\n {6}if\(slot==="morning"&&typeof lgAmzLost===[^\n]*/, "", "the ledger's lost lines");
  R(/^ {2}out\.lists\.forEach\(function\(L\)\{ L\.rows\.forEach\(function\(r\)\{ out\.taken\+=r\.atk[^\n]*\n/m, "", "the day's taken");
  if (/LEDGERAMZ|lgAmz|\bamPay|CHOREAMWHY|\batk\b/.test(s)) throw new Error("test_morning_why: the app before's house.js still mentions C4");
  return s; };
const BASE_IDX = (() => { const t = path.join(os.tmpdir(), "morning_why_before_" + process.pid + ".html"); fs.writeFileSync(t, baseIdx(fs.readFileSync(path.join(__dirname, "index.html"), "utf8"))); return t; })();
const BASE_HJS = baseHjs(fs.readFileSync(path.join(__dirname, "house.js"), "utf8"));
if (process.env.MWHY_BASE_OUT) { fs.writeFileSync(process.env.MWHY_BASE_OUT + ".html", fs.readFileSync(BASE_IDX, "utf8")); fs.writeFileSync(process.env.MWHY_BASE_OUT + ".js", BASE_HJS); process.exit(0); }
console.log("(the app before: this tree with CHOREAMWHY / LEDGERAMZ taken out)");

const K = o => Object.assign({ src: { kind: "routine" }, status: "active", area: "cleaning", verdict: "", note: "", level: 1, minutes: 5 }, o);
const FAM = () => ({
  a_vac: K({ label: "Vacuum the den", emoji: "🧹", who: "kid_a", slot: "chores", cad: "wk:1", pts: 10, order: 1 }),
  a_lamp: K({ label: "Dust the lamp", emoji: "🪔", who: "kid_a", slot: "chores", cad: "wk:1", pts: 5, order: 2 }),
  a_win: K({ label: "Wipe the window", emoji: "🪟", who: "kid_a", slot: "chores", cad: "wk:1", pts: 15, order: 3 }),
  a_bed: K({ label: "Make the bed", emoji: "🛏", who: "kid_a", slot: "chores", cad: "daily", pts: 10, order: 4 }),
  a_sink: K({ label: "Clean the sink", emoji: "🚰", who: "kid_a", slot: "chores", cad: "wk:3", pts: 10, order: 5 }),
  b_porch: K({ label: "Sweep the porch", emoji: "🧹", who: "kid_b", slot: "chores", cad: "wk:1", pts: 10, order: 1 }),
  c_tub: K({ label: "Scrub the tub", emoji: "🛁", who: "kid_c", slot: "chores", cad: "wk:1", pts: 22, order: 1 }),
  c_sink: K({ label: "Wipe the sink", emoji: "🧽", who: "kid_c", slot: "chores", cad: "wk:0", pts: 3, order: 2 }),
  c_car: K({ label: "Wash the car", emoji: "🚗", who: "kid_c", slot: "chores", cad: "wk:1", pts: 10, order: 3 }),
  c_mat: K({ label: "Shake the mat", emoji: "🧺", who: "kid_c", slot: "chores", cad: "wk:3", pts: 5, order: 4 }),
  d_blind: K({ label: "Dust the blinds", emoji: "🪟", who: "kid_d", slot: "chores", cad: "wk:1", pts: 10, order: 1 })
});
const dOf = n => new Date(2026, 10, 30 + n), isoN = n => { const d = dOf(n); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
const go = (w, n, h, mi) => { const d = dOf(n); return w.at(d.getFullYear(), d.getMonth() + 1, d.getDate(), h, mi || 0); };
const CAP = "globalThis.__pop='';document.body.insertAdjacentHTML=function(p,h){ globalThis.__pop=h; };globalThis.__toast=[];gwShowToast=function(m){ __toast.push(m); };tab='moms-plan';1";
async function mkWorld(index, hjs) {
  const w = await W.world({ index, household: { jobs: FAM(), people: clone(W.PEOPLE), meta: { takeover: 1, engine: { mode: "preview", on: "2026-11-09" } } }, tree: { config: clone(W.FX.db.config) } });
  const A = w.boot("A", "devA", { mom: true }), B = w.boot("B", "devB"), Dd = w.boot("D", "devD"), Kk = w.boot("Kk", "devK");
  Dd.run("HA_LS.setItem('ha_kiosk','dad');1"); Kk.run("HA_LS.setItem('ha_kiosk','routines');1");
  for (const d of [A, B, Dd, Kk]) { d.run(CAP); d.run(hjs); }
  await w.flush(); return { w, A, B, Dd, Kk };
}
const KIDS = ["kid_a", "kid_b", "kid_c", "kid_d"];
const idxOf = (d, kid, label) => d.run("(function(){ const d0=day; day=_todayDay; try{ return (rtStepsFor('chores','" + kid + "',false,day)||[]).findIndex(function(x){ return x&&x.label===" + J(label) + "&&x.cad!=='none'; }); } finally{ day=d0; } })()");
const pin = (d, js) => d.run("(function(){ const d0=day; day=_todayDay; try{ rtOpen={}; mrOpen={}; return " + js + "; } finally{ day=d0; } })()");
const kidList = (d, kid) => pin(d, "mrIndividualHTML(" + J(kid) + ")+['afternoon','chores','evening'].map(function(s){ return rtSlotHTML(s," + J(kid) + "); }).join('')");
const drawAll = (d, kids) => (kids || KIDS).map(k => kidList(d, k)).join("");
const pop = (d, kid, slot, dn) => d.run("(function(){ __pop=''; boardStatPop(" + J(kid) + "," + J(slot) + "," + (dn ? J(dn) : "_todayDay") + "); return __pop; })()");
const LG = (d, js) => d.run("(function(){ __pop=''; " + js + "; return __pop; })()");
const txt = h => String(h || "").replace(/<[^>]+>/g, " ").replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
const ROWSPLIT = '<div style="display:flex;flex-wrap:wrap;align-items:baseline;gap:2px 8px;padding:5px 2px;';
const lgRows = h => String(h).split(ROWSPLIT).slice(1).map(r => '<div ' + r.split("</div>")[0]);
const lgRowOf = (h, name) => txt(lgRows(h).filter(r => r.indexOf(name) >= 0)[0] || "");
const top = h => txt((/<div style="font-size:13\.5px;padding:6px 2px 2px">([\s\S]*?)<\/div>/.exec(h) || ["", ""])[1]);
const root = w => w.db.tree.root;
const adj = (w, kid) => (((root(w).bank || {})[kid] || {}).adjustments) || {};
const amzBank = (w, kid) => Object.entries(adj(w, kid)).filter(([id]) => /^camz_/.test(id)).map(([id, a]) => Object.assign({ id }, a));
const amzLines = (w, kid) => { const L = (root(w).routineLog || {})[kid] || {}, out = []; Object.keys(L).forEach(wk => Object.keys(L[wk] || {}).forEach(dn => Object.keys(L[wk][dn] || {}).forEach(k => { if (/^amz_/.test(k)) out.push(Object.assign({ _wk: wk, _dn: dn, _k: k }, L[wk][dn][k])); }))); return out.sort((a, b) => String(a.amz.day).localeCompare(String(b.amz.day))); };
const bal = (d, kid) => d.run("bankBalance(" + J(kid) + ")");
const writes = (w, m) => w.since(m).filter(e => !/^(get|once|on|read)/.test(String(e.op || "")) && !/^(connDiary|settings\/codeVersion|regen_lock|week\d+\/tasks)/.test(String(e.path || "")));
const WS = (w, m) => writes(w, m).map(e => e.op + " " + e.path + (e.keys ? " [" + e.keys.join(",") + "]" : "") + (e.op === "tx" ? (e.committed ? " ✓" : " ✗") : ""));
const noTs = x => JSON.parse(J(x), (k, v) => (k === "ts" || k === "at") ? "·" : v);
const noWhy = t => { t = noTs(t); Object.values(t.amCarry || {}).forEach(K1 => Object.values(K1 || {}).forEach(r => { if (r) delete r.why; })); return t; };
const ddiff = (a, b, p) => { p = p || ""; if (J(a) === J(b)) return []; if (!a || !b || typeof a !== "object" || typeof b !== "object") return [p + ": " + String(J(a)).slice(0, 140) + " ≠ " + String(J(b)).slice(0, 140)]; return [...new Set([...Object.keys(a), ...Object.keys(b)])].flatMap(k => ddiff(a[k], b[k], p + "/" + k)).slice(0, 8); };
const amRow = (h, label) => { const r = String(h).split('<div class="mr-step').filter(x => x.indexOf("Left over") < 0 && x.indexOf(" " + label + " <span") >= 0 && x.indexOf("from ") >= 0)[0] || ""; return [...r.matchAll(/<span class="cadtag" style="color:#b45309;border-color:#fde68a">((?:(?!<\/span>)[^])*)<\/span>/g)].map(x => x[1]).filter(x => x.indexOf("⭐") >= 0)[0] || ""; };
const carry = (w, kid, label) => Object.entries((root(w).amCarry || {})[kid] || {}).filter(([, r]) => r && r.label === label).map(([id, r]) => Object.assign({ id }, r))[0] || null;
const normQ = h => String(h).replace(/amAskAll\(('[^']*'),('[^']*'),'[^']*'\)/g, "amSendRest($1,$2)").replace(/amAsk\(/g, "amSend(");   // the question's own onclick name
const S = { dump: {} };
const ANS = (d, js, v) => { const r = d.run("(function(){ __pop=''; const r=" + js + "; return {r:r, q:__pop}; })()"); const p = v === "close" ? d.run("amQClose()") : d.run("amQPick(" + J(v) + ")"); return { r: r.r, q: r.q, p }; };
const allScreens = (V, n) => { const o = {}; const { A, B, Kk } = V;
  KIDS.forEach(k => { o["list " + k] = kidList(B, k); o["kc " + k] = pin(Kk, "kcChoresHTML(" + J(k) + ")+kcPointsHTML(" + J(k) + ")"); o["bal " + k] = bal(B, k);
    ["morning", "chores"].forEach(s => { o["pop " + k + " " + s] = normQ(pop(A, k, s)); }); o["pop " + k + " tue"] = normQ(pop(A, k, "chores", "tuesday"));
    o["ledger " + k] = LG(A, "lgGo(" + J(k) + ",0,0)"); o["ledger week " + k] = LG(A, "lgGo(" + J(k) + ",0,1)");
    o["person " + k] = A.run("(function(){ hpSel=" + J(k) + "; return hpPersonHTML(); })()");
    o["streak " + k] = A.run("SL_SLOTS.map(function(s){ return lsStreak(s," + J(k) + "); }).join(',')"); });
  return o; };

(async () => {
console.log("\n── A · the functions, the blank slate ──");
const P = await mkWorld(IDX, HJS), PB = await mkWorld(BASE_IDX, BASE_HJS);
ok("RT_AMWHY_FROM is \"2026-12-07\", one constant", P.A.run("RT_AMWHY_FROM") === "2026-12-07" && (fs.readFileSync(IDX, "utf8").match(/RT_AMWHY_FROM="/g) || []).length === 1);
const pay = (it, iso) => P.A.run("amPay('kid_a'," + J(Object.assign({ slot: "chores", i: 99, label: "x", fromIso: "2026-12-08", at: new Date(2026, 11, 8, 19).getTime() }, it)) + "," + J(iso) + ")");
ok("amPay: ignored, own day Tue 12/08 → Tue 10 · Wed 8 · Thu 6 · Fri 4 · Sat 2 · Sun 0 · later 0 (rtFallPts, the one step function)", [8, 9, 10, 11, 12, 13, 16].map(d => pay({ why: "ignored", pts: 10 }, "2026-12-" + String(d).padStart(2, "0"))).join(",") === "10,8,6,4,2,0,0");
ok("…22 ⭐: 18 · 13 · 9 · 4 · 0; 3 ⭐: 2 · 1 · 0", [9, 10, 11, 12, 13].map(d => pay({ why: "ignored", pts: 22 }, "2026-12-" + String(d).padStart(2, "0"))).join(",") === "18,13,9,4,0" && [9, 10, 11].map(d => pay({ why: "ignored", pts: 3 }, "2026-12-" + String(d).padStart(2, "0"))).join(",") === "2,1,0");
ok("…not their fault, no why, sent before 12/07 (a why:\"ignored\" stamped before the slate), a plan row: full stars every day", [{ why: "notfault" }, {}, { why: "ignored", at: new Date(2026, 11, 6, 19).getTime() }, { why: "ignored", house: "h1" }].every(x => [9, 13, 16].every(d => pay(Object.assign({ pts: 10 }, x), "2026-12-" + d) === 10)));

// ── CALM: closed / not their fault / before the slate — the app before, but for `why` ──
console.log("\n── B · closed, \"not their fault\", before the slate: the app before, byte for byte, but for `why` ──");
const calmBad = []; let calmDays = 0, qOnce = null, qClose = null, preQ = null;
for (let n = 0; n <= 19; n++) {
  const wm = { x: P.w.mark(), b: PB.w.mark() };
  for (const V of [P, PB]) { const { w, A, B } = V, X = V === P;
    await go(w, n, 8); drawAll(B); await w.flush();
    if (n === 3) { await go(w, n, 19); const i = idxOf(A, "kid_a", "Clean the sink");   // Thu 12/03: before the slate — no question, the old tap
      if (X) preQ = { chip: /amSend\('chores','kid_a','thursday',/.test(pop(A, "kid_a", "chores")), q: ANS(A, "amAsk('chores','kid_a','thursday'," + i + ")", "close") }; else A.run("amSend('chores','kid_a','thursday'," + i + ")"); }
    if (n === 8) { await go(w, n, 19);   // Tue 12/08: Send all closed; one row "not their fault"; one closed
      if (X) { qOnce = ANS(A, "amAskAll('kid_a','tuesday','chores')", "close"); ANS(A, "amAsk('chores','kid_b','tuesday'," + idxOf(A, "kid_b", "Sweep the porch") + ")", "notfault"); qClose = ANS(A, "amAsk('chores','kid_c','tuesday'," + idxOf(A, "kid_c", "Scrub the tub") + ")", "close"); }
      else { A.run("amSendRest('kid_a','tuesday')"); A.run("amSend('chores','kid_b','tuesday'," + idxOf(A, "kid_b", "Sweep the porch") + ")"); A.run("amSend('chores','kid_c','tuesday'," + idxOf(A, "kid_c", "Scrub the tub") + ")"); } }
    if (n === 10) { const c = carry(w, "kid_a", "Vacuum the den"); B.run("(function(){ day=_todayDay; amToggle('kid_a'," + J(c.id) + "); })()");   // the kid ticks a carry Thu
      A.run("mdKidTick('chores','kid_c','tuesday'," + idxOf(A, "kid_c", "Scrub the tub") + ")"); }   // Mom ticks the ORIGINAL row on Tuesday's tab
    if (n === 14) { const c = carry(w, "kid_a", "Make the bed"); B.run("(function(){ day=_todayDay; amToggle('kid_a'," + J(c.id) + "); })()"); }
    await w.flush(); await go(w, n, 16); drawAll(B); await w.flush();
  }
  const sx = allScreens(P, n), sb = allScreens(PB, n);
  Object.keys(sx).forEach(k => { if (J(sx[k]) !== J(sb[k])) calmBad.push(n + " " + k + ": " + ddiff({ v: txt(sx[k]) }, { v: txt(sb[k]) }).join(" | ")); });
  const wl = (w, m, x) => writes(w, m).map(e => e.dev + " " + e.op + " " + e.path + " " + (e.keys || []).join(",") + " " + (x && e.op === "set" && /^amCarry\/kid_[a-d]\/[^/]+$/.test(e.path) && root(w).amCarry && J(Object.keys((((root(w).amCarry || {})[e.path.split("/")[1]] || {})[e.path.split("/")[2]]) || {})).indexOf('"why"') >= 0 ? e.n - 1 : e.n) + (e.op === "tx" ? (e.committed ? " ✓" : " ✗") : ""));
  const wx = wl(P.w, wm.x, 1), wb = wl(PB.w, wm.b); if (J(wx) !== J(wb)) calmBad.push(n + " writes: " + ddiff(wx, wb).join(" | ")); S.calmW = (S.calmW || 0) + wx.length;
  const tx = noWhy(root(P.w)), tb = noTs(root(PB.w)); if (J(tx) !== J(tb)) calmBad.push(n + " tree: " + ddiff(tx, tb).join(" | "));
  calmDays++;
  if (n === 9) S.calmWed = sx["list kid_a"];
  if (n === 8) { S.dump.question = qOnce.q; S.dump.questionSent = P.A.run("(function(){ __pop=''; amAsk('chores','kid_b','tuesday'," + idxOf(P.A, "kid_b", "Sweep the porch") + "); const h=__pop; _amQEnd(); return h; })()"); }
}
ok("B · 20 days (Mon 11/30 – Sat 12/19), every screen (each kid's lists, Kids' Corner and its stars, Mom's pop-ups today and on Tuesday's tab, the 📒 Ledger day and week, 👤 By person, the four streaks, every balance) and the WHOLE database equal the app before, but for `why`", calmBad.length === 0 && calmDays === 20, calmBad.slice(0, 6));
const cw = ["kid_a", "kid_b", "kid_c"].map(k => Object.values((root(P.w).amCarry || {})[k] || {}).map(r => r.label + ":" + (r.why || "—"))).flat().sort();
ok("…every write, day by day, the same list (device, kind, path, keys, size — the carry's set one field bigger: `why`), " + S.calmW + " writes", S.calmW > 50);
ok("…and the screens are the real ones: Wed 12/09 kid_a's Morning list has \"Left over\" with \"Vacuum the den\" at +10 ⭐", /Left over/.test(S.calmWed) && amRow(S.calmWed, "Vacuum the den") === "+10 ⭐", amRow(S.calmWed, "Vacuum the den"));
ok("…the only difference: `why` on each carry — \"notfault\" when closed or answered; none on the one sent before 12/07", J(cw) === J(["Clean the sink:—", "Dust the lamp:notfault", "Make the bed:notfault", "Scrub the tub:notfault", "Sweep the porch:notfault", "Vacuum the den:notfault", "Wipe the window:notfault"]), cw);
ok("…before 12/07 the chip is the old tap (amSend), and amAsk asks nothing: it sends at once", preQ.chip && preQ.q.r === true && preQ.q.q === "", preQ);
ok("…Send all asks ONCE for the batch (one question for 4 rows), closing it = not their fault for all four", /Why wasn't it done\?/.test(qOnce.q) && /4 unfinished things/.test(qOnce.q) && /Closing this = not their fault/.test(qOnce.q) && qOnce.p === 4, txt(qOnce.q));
ok("…the question's words: \"🤒 Not their fault\" (Full stars, as always) · \"🙈 They ignored it\" (20% fewer stars each day. After 0, 20% a day comes off the bank, 5 days at most)", /🤒 Not their fault Full stars, as always 🙈 They ignored it 20% fewer stars each day\. After 0, 20% a day comes off the bank, 5 days at most/.test(txt(qOnce.q)), txt(qOnce.q));
ok("…a row already sent asks again: its answer marked ✓, \"↩ Take it off the morning list\", and \"Closing changes nothing\"", /Not their fault ✓/.test(txt(S.dump.questionSent)) && /↩ Take it off the morning list/.test(S.dump.questionSent) && /Closing changes nothing/.test(S.dump.questionSent), txt(S.dump.questionSent));

// ── IGNORED: the stars fall, then a line a day after zero ──
console.log("\n── C · \"they ignored it\": every payer and display, day by day ──");
const Q = await mkWorld(IDX, HJS), QB = await mkWorld(BASE_IDX, BASE_HJS);
const { w } = Q, A = Q.A, B = Q.B, Dd = Q.Dd, Kk = Q.Kk;
const Dm = w.boot("Dm", "devDm", { mom: true }); Dm.run(CAP); Dm.run("HA_LS.setItem('ha_dryrun','1');1"); Dm.run(HJS); await w.flush();
const kidSaw = [], kidAsk = [], ex = {};
const ixs = {}; const ix = (kid, label) => ixs[kid + label] != null ? ixs[kid + label] : (ixs[kid + label] = idxOf(A, kid, label));
const sentIds = () => { const o = {}; ["kid_a", "kid_b", "kid_c", "kid_d"].forEach(k => Object.entries((root(w).amCarry || {})[k] || {}).forEach(([id, r]) => { o[k + "|" + r.label] = id; })); return o; };
for (let n = 7; n <= 19; n++) {
  for (const V of [Q, QB]) { const X = V === Q, vw = V.w, vA = V.A, vB = V.B;
    if (X && n === 14) { await go(vw, n, 6); const m0 = vw.mark(); kidList(Dm, "kid_a"); await vw.flush(); ex.dry = { w: WS(vw, m0), local: Dm.run("Object.keys((bank.kid_a||{}).adjustments||{}).filter(function(k){ return /^camz_/.test(k); }).length") }; }
    if (X && n === 15) { await go(vw, n, 6); vA.run("db.ref('calendar/kidOverrides/kid_c/2026-12-15').set({school:false});1"); await vw.flush(); }
    if (n === 10 && X) { await go(vw, n, 7); vA.run("lgRuleFall('kid_d')"); await vw.flush(); }   // Stars fall Off for kid_d
    if (n === 11 && X) { await go(vw, n, 7); vA.run("lgRuleFall('kid_d')"); await vw.flush(); }   // …On again
    if (n === 17 && X) { await go(vw, n, 7); vA.run("lgRuleTake('kid_b')"); await vw.flush(); }   // Take stars away Off for kid_b
    if (n === 18 && X) { await go(vw, n, 7); vA.run("lgRuleTake('kid_b')"); await vw.flush(); }   // …On again
    await go(vw, n, 8); const mr = vw.mark(); drawAll(vB, n === 16 ? ["kid_a", "kid_c", "kid_d"] : KIDS); if (X && n === 15) { kidList(Kk, "kid_a"); ex.race = vw.since(mr).filter(e => e.op === "tx" && /amz_/.test(e.path)).length; } await vw.flush();   // Tue 12/15: two devices draw kid_a's list before either hears back
    if (X && n === 15) ex.raceW = WS(vw, mr).filter(x => /kid_a\/.*amz_|adjustments\/camz_.*kid_a/.test(x));   // Wed 12/16: nobody draws kid_b's lists
    if (n === 7) { await go(vw, n, 19); const i = ix("kid_c", "Wipe the sink"); if (X) ex.sink = ANS(vA, "amAsk('chores','kid_c','monday'," + i + ")", "ignored"); else vA.run("amSend('chores','kid_c','monday'," + i + ")"); }
    if (n === 8) { await go(vw, n, 19);
      if (X) { const m0 = vw.mark(); ex.all = ANS(vA, "amAskAll('kid_a','tuesday','chores')", "ignored"); await vw.flush(); ex.allW = WS(vw, m0);
        const m1 = vw.mark(); ex.lamp = ANS(vA, "amAsk('chores','kid_a','tuesday'," + ix("kid_a", "Dust the lamp") + ")", "notfault"); await vw.flush(); ex.lampW = WS(vw, m1);
        ANS(vA, "amAsk('chores','kid_b','tuesday'," + ix("kid_b", "Sweep the porch") + ")", "close");
        ["Scrub the tub", "Wash the car"].forEach(l => ANS(vA, "amAsk('chores','kid_c','tuesday'," + ix("kid_c", l) + ")", "ignored"));
        ANS(vA, "amAsk('chores','kid_d','tuesday'," + ix("kid_d", "Dust the blinds") + ")", "ignored");
        S.dump.popTue = pop(vA, "kid_a", "chores", "tuesday"); }
      else { vA.run("amSendRest('kid_a','tuesday')"); vA.run("amSend('chores','kid_b','tuesday'," + ix("kid_b", "Sweep the porch") + ")"); ["Scrub the tub", "Wash the car"].forEach(l => vA.run("amSend('chores','kid_c','tuesday'," + ix("kid_c", l) + ")")); vA.run("amSend('chores','kid_d','tuesday'," + ix("kid_d", "Dust the blinds") + ")"); } }
    if (n === 11) { await go(vw, n, 19); const i = ix("kid_c", "Shake the mat"); if (X) ANS(vA, "amAsk('chores','kid_c','friday'," + i + ")", "ignored"); else vA.run("amSend('chores','kid_c','friday'," + i + ")"); }   // Thursday's mat, sent Friday while it waits
    await vw.flush();
  }
  const I = sentIds(), list = k => kidList(B, k), a = list("kid_a");
  KIDS.filter(k => !(n === 16 && k === "kid_b")).forEach(k => { const h = kidList(Kk, k) + pin(Kk, "kcChoresHTML(" + J(k) + ")+kcPointsHTML(" + J(k) + ")"); if (/ignored|🙈|Why wasn't|They ignored/.test(h)) kidSaw.push(n + " " + k); });
  if (n === 8) {
    ok("C · Tue 12/08: \"Send all\" asks ONCE; \"🙈 They ignored it\" sends 4 rows, each carry set ONCE with why:\"ignored\" (+ its log line) — one write per carry, nothing else", /4 unfinished things/.test(ex.all.q) && ex.all.p === 4 && ex.allW.filter(x => /^set amCarry\/kid_a\//.test(x)).length === 4 && ["Vacuum the den", "Dust the lamp", "Wipe the window", "Make the bed"].every(l => (carry(w, "kid_a", l) || {}).why === "ignored" || l === "Dust the lamp"), ex.allW);
    ok("…then one row's 🌅 chip: the question again (its answer ✓), \"🤒 Not their fault\" → ONE write, amCarry/kid_a/<id>/why = \"notfault\"", /They ignored it ✓/.test(txt(ex.lamp.q)) && ex.lamp.p === true && J(ex.lampW) === J(["set amCarry/kid_a/" + I["kid_a|Dust the lamp"] + "/why"]) && carry(w, "kid_a", "Dust the lamp").why === "notfault", ex.lampW);
    const c = carry(w, "kid_a", "Vacuum the den"), cb = carry(QB.w, "kid_a", "Vacuum the den");
    ok("…the carry record before and after: the app before's {slot,i,label,emoji,pts,fromIso,fromWk,fromDay,dueIso,ts,at,by} + why", J(Object.keys(c)) === J(Object.keys(cb).concat(["why"])) && J(noTs(Object.assign({}, c, { why: undefined }))) === J(noTs(cb)), [Object.keys(c), Object.keys(cb)]);
    ok("…Mom's pop-up: the sent rows' chip reads \"🌅 AM ✓ 🙈\" (ignored) or \"🌅 AM ✓\" (not their fault); its onclick asks (amAsk)", /🌅 AM ✓ 🙈/.test(S.dump.popTue) && /amAsk\('chores','kid_a','tuesday'/.test(S.dump.popTue) && (txt(S.dump.popTue).match(/🌅 AM ✓ 🙈/g) || []).length === 3, txt(S.dump.popTue));
    ok("…Kids' Corner (a kid's device) cannot ask: amAsk refused, no question drawn", Kk.run("(function(){ __pop=''; const r=amAsk('chores','kid_a','tuesday',0); return r===false&&__pop===''; })()"));
  }
  if (n === 9) { const r = (k, l) => amRow(list(k), l);
    S.dump.kidWed = a;
    ok("C · Wed 12/09, kid_a's Morning list \"Left over\": Vacuum \"10 → 8 ⭐\", Wipe the window \"15 → 12 ⭐\", Make the bed \"10 → 8 ⭐\", Dust the lamp (not their fault) \"+5 ⭐\" — both numbers, no words", r("kid_a", "Vacuum the den") === "<s style=\"opacity:.6\">10</s> → 8 ⭐" && r("kid_a", "Wipe the window") === "<s style=\"opacity:.6\">15</s> → 12 ⭐" && r("kid_a", "Make the bed") === "<s style=\"opacity:.6\">10</s> → 8 ⭐" && r("kid_a", "Dust the lamp") === "+5 ⭐", ["Vacuum the den", "Wipe the window", "Make the bed", "Dust the lamp"].map(l => r("kid_a", l)));
    ok("…kid_b (closed = not their fault) \"+10 ⭐\"; kid_c's 3 ⭐ sink (Mon) \"3 → 1 ⭐\" on its 2nd day", r("kid_b", "Sweep the porch") === "+10 ⭐" && r("kid_c", "Wipe the sink") === "<s style=\"opacity:.6\">3</s> → 1 ⭐", [r("kid_b", "Sweep the porch"), r("kid_c", "Wipe the sink")]);
    const mp = txt(pop(A, "kid_a", "morning")); ok("…Mom's Morning pop-up says the same: \"🌅 🧹 Vacuum the den — from Tue Chores 10 → 8 ⭐\"", /🌅 🧹 Vacuum the den — from Tue Chores 10 → 8 ⭐/.test(mp) && /Dust the lamp — from Tue Chores \+5 ⭐/.test(mp), mp);
    const kcx = pin(Kk, "kcPointsHTML('kid_a')"), kcb = pin(QB.Kk, "kcPointsHTML('kid_a')");
    ok("…Kids' Corner's \"stars still to get\" counts 8 + 12 + 8 + 5 where the app before counts 10 + 15 + 10 + 5 (7 fewer)", (() => { const nx = +((/(\d+)\s*(?:⭐)?\s*(?:still|left|to get)/i.exec(txt(kcx)) || [])[1] || NaN), nb = +((/(\d+)\s*(?:⭐)?\s*(?:still|left|to get)/i.exec(txt(kcb)) || [])[1] || NaN); S.kcN = [nx, nb]; return nb - nx === 7; })(), [S.kcN, txt(kcx).slice(0, 300)]);
    const lg = LG(A, "lgGo('kid_a',0,0)"), lgT = LG(A, "lgGo('kid_a',-1,0)");
    ok("…📒 Ledger today: \"🌅 🧹 Vacuum the den from Tue Chores · not done yet · 🙈 ignored · pays 8 of 10 ⭐\"; Tuesday's row \"sent to the next morning · 🙈 they ignored it · pays 8 of 10 ⭐ today\"", /🌅 🧹 Vacuum the den from Tue Chores · not done yet · 🙈 ignored · pays 8 of 10 ⭐/.test(lgRowOf(lg, "Vacuum the den")) && /sent to the next morning · 🙈 they ignored it · pays 8 of 10 ⭐ today/.test(lgRowOf(lgT, "Vacuum the den")), [lgRowOf(lg, "Vacuum the den"), lgRowOf(lgT, "Vacuum the den")]);
    const hp = txt(A.run("(function(){ hpSel='kid_a'; return hpPersonHTML(); })()")); ok("…👤 By person: \"🧹 Vacuum the den from Tue 12/8 · 10 → 8 ⭐\" (Dust the lamp: \"from Tue 12/8\" as before)", /Vacuum the den from Tue 12\/8 · 10 → 8 ⭐/.test(hp) && /Dust the lamp from Tue 12\/8 🪟/.test(hp), (/🌅 Sent to the morning list.{0,300}/.exec(hp) || [""])[0]);
    const b0 = bal(B, "kid_a"); B.run("(function(){ day=_todayDay; amToggle('kid_a'," + J(I["kid_a|Wipe the window"]) + "); })()"); await w.flush();
    ok("…kid_a ticks Wipe the window on her Morning list: it pays 12 (the bank +12, the carry's done.pts 12)", bal(B, "kid_a") === b0 + 12 && carry(w, "kid_a", "Wipe the window").done.pts === 12, [bal(B, "kid_a") - b0, carry(w, "kid_a", "Wipe the window").done]);
    const ls = (V, k) => V.A.run("_lsDay('chores'," + J(k) + ",activeWk(),'tuesday','2026-12-08',slState,0)");
    S.ls = [ls(Q, "kid_a"), ls(QB, "kid_a"), ls(Q, "kid_b"), ls(QB, "kid_b"), ls(Q, "kid_c"), ls(QB, "kid_c")];
    const m2 = w.mark(); ex.porch = ANS(A, "amAsk('chores','kid_b','tuesday'," + ix("kid_b", "Sweep the porch") + ")", "ignored"); await w.flush(); ex.porchW = WS(w, m2); S.ls.push(ls(Q, "kid_b"));
    ok("…noon: Mom changes kid_b's answer to \"they ignored it\" (Tuesday's tab): ONE write; the row now reads \"10 → 8 ⭐\" (counted from its own day)", J(ex.porchW) === J(["set amCarry/kid_b/" + I["kid_b|Sweep the porch"] + "/why"]) && amRow(list("kid_b"), "Sweep the porch") === "<s style=\"opacity:.6\">10</s> → 8 ⭐", [ex.porchW, amRow(list("kid_b"), "Sweep the porch")]);
  }
  if (n === 11) S.dump.kidFri = a;
  if (n === 10) { const r = (k, l) => amRow(list(k), l);
    S.dump.kidThu = a;
    ok("C · Thu 12/10: Vacuum \"10 → 6 ⭐\"; kid_d's blinds (Stars fall Off this morning) \"+10 ⭐\"", r("kid_a", "Vacuum the den") === "<s style=\"opacity:.6\">10</s> → 6 ⭐" && r("kid_d", "Dust the blinds") === "+10 ⭐", [r("kid_a", "Vacuum the den"), r("kid_d", "Dust the blinds")]);
    const pt = txt(pop(A, "kid_c", "chores", "tuesday")); const b0 = bal(B, "kid_c");
    A.run("mdKidTick('chores','kid_c','tuesday'," + ix("kid_c", "Scrub the tub") + ")"); await w.flush();
    ok("…Mom's pop-up on Tuesday's tab shows the tub's ORIGINAL row \"22 → 13 ⭐\"; her ✓ there pays 13 (toggleRtStep) and closes the carry", /Scrub the tub 22 → 13 ⭐/.test(pt) && bal(B, "kid_c") === b0 + 13 && carry(w, "kid_c", "Scrub the tub").done.src === "list", [pt.slice(0, 200), bal(B, "kid_c") - b0]);
    const b1 = bal(B, "kid_a"); B.run("(function(){ day=_todayDay; amToggle('kid_a'," + J(I["kid_a|Make the bed"]) + "); })()"); await w.flush();
    ok("…kid_a's daily Make the bed (sent as ignored) ticked Thursday on her Morning list: pays 6", bal(B, "kid_a") === b1 + 6, bal(B, "kid_a") - b1);
  }
  if (n === 9 || n === 10 || n === 11) { const dm = V => V.A.run("(function(){ const L=rtStepsFor('chores','kid_a'), i=L.findIndex(s=>s&&s.label==='Make the bed'); return rtDailyMissed('chores','kid_a',i,L[i]); })()"); (S.dly = S.dly || []).push([dm(Q), dm(QB)]); }
  if (n === 11) ok("C · Fri 12/11: kid_d's Stars fall On again ({from: today}): the blinds (own day Tue) stay \"+10 ⭐\" — only turns from that day fall; kid_a's Vacuum \"10 → 4 ⭐\"", amRow(list("kid_d"), "Dust the blinds") === "+10 ⭐" && amRow(a, "Vacuum the den") === "<s style=\"opacity:.6\">10</s> → 4 ⭐");
  if (n === 12) ok("C · a row sent while it waited (Thursday's 5 ⭐ mat, sent Friday as ignored) counts from its own day: Sat \"5 → 3 ⭐\" (2 days), not 4", amRow(list("kid_c"), "Shake the mat") === "<s style=\"opacity:.6\">5</s> → 3 ⭐", amRow(list("kid_c"), "Shake the mat"));
  if (n === 12) {
    const L0 = amzLines(w, "kid_c"); ex.sinkLines = L0;
    ok("C · after zero, a 3 ⭐ chore (sent Mon as ignored: 2 · 1 · 0 Tue–Thu): Fri −1, Sat −1 — 20% of 3, at least 1", L0.length === 2 && L0.every(l => l.amz.n === 1 && /^Wipe the sink — not done$/.test(l.label)) && J(L0.map(l => l.amz.day)) === J(["2026-12-11", "2026-12-12"]) && amzBank(w, "kid_c").filter(x => /Wipe the sink/.test(x.note)).length === 2, L0.map(l => [l.amz.day, l.amz.n]));
    const m3 = w.mark(); ex.sinkNF = ANS(A, "amAsk('chores','kid_c','monday'," + ix("kid_c", "Wipe the sink") + ")", "notfault"); await w.flush();
    ok("C · a flip never reaches back: Sat (after the line) Mom changes it to \"not their fault\": ONE write (why); both lines and both −1 stay; the row now \"+3 ⭐\"", J(WS(w, m3)) === J(["set amCarry/kid_c/" + I["kid_c|Wipe the sink"] + "/why"]) && amzLines(w, "kid_c").length === 2 && amzBank(w, "kid_c").filter(x => /Wipe the sink/.test(x.note)).length === 2 && amRow(list("kid_c"), "Wipe the sink") === "+3 ⭐", [WS(w, m3), amRow(list("kid_c"), "Wipe the sink")]);
  }
  if (n === 13) {
    ok("C · Sun 12/13: Vacuum \"10 → 0 ⭐\" — zero, and nothing taken yet; the sink (not their fault now) files no line", amRow(a, "Vacuum the den") === "<s style=\"opacity:.6\">10</s> → 0 ⭐" && amzLines(w, "kid_a").length === 0 && amzLines(w, "kid_c").length === 2);
    const b0 = bal(B, "kid_c"); B.run("(function(){ day=_todayDay; amToggle('kid_c'," + J(I["kid_c|Wipe the sink"]) + "); })()"); await w.flush();
    ok("…kid_c ticks the sink: full 3 ⭐ (the answer counts from now on)", bal(B, "kid_c") === b0 + 3, bal(B, "kid_c") - b0);
  }
  if (n === 14) {
    ok("K · dry-run: a Mom device with ?dryrun=1 drew kid_a's list first (6 AM): nothing reached the database; its own screen has the line", ex.dry.w.length === 0 && ex.dry.local === 1, ex.dry);
    const L = amzLines(w, "kid_a"), bk = amzBank(w, "kid_a");
    ok("D · Mon 12/14, the day after zero: ONE line routineLog/kid_a/<wk>/monday/amz_<carry id> = {label:\"Vacuum the den — not done\", act:\"amz\", amz:{n:2, bid, id, day}}", L.length === 1 && L[0]._dn === "monday" && L[0].act === "amz" && L[0].label === "Vacuum the den — not done" && J(Object.keys(L[0].amz)) === J(["n", "id", "day", "bid"]) && L[0].amz.n === 2 && L[0].amz.id === I["kid_a|Vacuum the den"] && L[0].amz.day === "2026-12-14", L);
    ok("…and ONE bank line bank/kid_a/adjustments/camz_<wk>_monday_kid_a_<carry id> = {amount:-2, note:\"🧹 Vacuum the den · not done\", src:\"drop\"} — never through the 📮 outbox", bk.length === 1 && bk[0].id === L[0].amz.bid && /^camz_week\d+_monday_kid_a_2026-12-08_cstep\d+$/.test(bk[0].id) && bk[0].amount === -2 && bk[0].note === "🧹 Vacuum the den · not done" && bk[0].src === "drop" && !KIDS.some(k => [A, B, Kk].some(d => /camz_|amz_/.test(d.run("HA_LS.getItem('ha_outbox')||''")))), bk);
    const m = w.mark(); for (let r = 0; r < 10; r++) { drawAll(B); drawAll(Kk); drawAll(A); } const R3 = w.boot("R3", "devR3"); R3.run(CAP); await w.flush(); drawAll(R3); await w.flush();
    ok("E · two more devices, ten redraws each and a fresh device: still one line and one bank line per kid and chore (no new write)", amzLines(w, "kid_a").length === 1 && amzBank(w, "kid_a").length === 1 && !WS(w, m).some(x => /amz_|camz_/.test(x) && !/ ✗$/.test(x)), WS(w, m).filter(x => /amz/.test(x)));
    ok("…kid_b's porch and kid_c's car (both ignored) filed their own Monday lines, −2 each", amzLines(w, "kid_b").length === 1 && amzLines(w, "kid_c").filter(l => /car/.test(l.label)).length === 1 && amzBank(w, "kid_b")[0].amount === -2);
    console.log("\n── H · the 📒 Ledger ──");
    const lg = LG(A, "lgGo('kid_a',0,0)"); S.dump.ledgerMon = lg;
    ok("H · the row: \"○ 🌅 🧹 Vacuum the den from Tue Chores · not done yet · 🙈 ignored · pays 0 of 10 ⭐ · 2 ⭐ taken this morning ➖ Excuse ⭐ Give stars back\"; the day's line \"taken 2 ⭐\"", /^○ 🌅 🧹 Vacuum the den from Tue Chores · not done yet · 🙈 ignored · pays 0 of 10 ⭐ · 2 ⭐ taken this morning ➖ Excuse ⭐ Give stars back$/.test(lgRowOf(lg, "Vacuum the den")) && /taken 2 ⭐/.test(top(lg)), [lgRowOf(lg, "Vacuum the den"), top(lg)]);
    const L0 = amzLines(w, "kid_a")[0], line0 = clone(adj(w, "kid_a")[L0.amz.bid]), args = J("kid_a") + "," + J(L0._wk) + ",'monday'," + J(L0.amz.id), b0 = bal(B, "kid_a");
    let m4 = w.mark(); const kr = Kk.run("lgAmzGive(" + args + ")"); ok("…a kid's device: lgAmzGive refused, nothing written", kr === false && writes(w, m4).length === 0);
    m4 = w.mark(); A.run("lgAmzGive(" + args + ")"); await w.flush();
    ok("H · ⭐ Give stars back (Mom): ONE update — the bank line removed + amz.gb = {by:\"mom\", ts, at, line}; balance +2", J(WS(w, m4)) === J(["update  [routineLog/kid_a/" + L0._wk + "/monday/" + L0._k + "/amz/gb,bank/kid_a/adjustments/" + L0.amz.bid + "]"]) && bal(B, "kid_a") === b0 + 2 && J(w.get("routineLog/kid_a/" + L0._wk + "/monday/" + L0._k + "/amz/gb/line")) === J(line0), WS(w, m4));
    ok("…the row: \"… · 2 ⭐ taken this morning ⭐ Mom gave back +2 ⭐ Undo\"; the day's line no longer \"taken\"", /2 ⭐ taken this morning ⭐ Mom gave back \+2 ⭐ Undo$/.test(lgRowOf(LG(A, "lgGo('kid_a',0,0)"), "Vacuum the den")) && !/taken/.test(top(LG(A, "lgGo('kid_a',0,0)"))), lgRowOf(LG(A, "lgGo('kid_a',0,0)"), "Vacuum the den"));
    m4 = w.mark(); for (let r = 0; r < 10; r++) drawAll(B); await w.flush(); ok("…never re-taken: ten redraws write nothing; a second tap refused", !WS(w, m4).some(x => /camz_|amz_/.test(x) && !/ ✗$/.test(x)) && A.run("lgAmzGive(" + args + ")") === false);
    m4 = w.mark(); A.run("lgAmzUndo(" + args + ")"); await w.flush();
    ok("H · Undo: ONE update — that exact line back byte for byte, gb removed, balance back", writes(w, m4).length === 1 && J(adj(w, "kid_a")[L0.amz.bid]) === J(line0) && w.get("routineLog/kid_a/" + L0._wk + "/monday/" + L0._k + "/amz/gb") == null && bal(B, "kid_a") === b0, WS(w, m4));
    A.run("lgAmzGive(" + args + ")"); await w.flush(); ex.monGb = L0;   // given back again (stays so)
  }
  if (n === 15) {
    ok("E · two devices at once (Tue 12/15, both draw kid_a's list before either hears back): two transactions, ONE commits, ONE bank line", J(ex.raceW.filter(x => /^tx /.test(x)).map(x => x.slice(-1))) === J(["✓", "✗"]) && ex.raceW.filter(x => /^set bank/.test(x)).length === 1, ex.raceW);
    const c = amzLines(w, "kid_c").filter(l => /car/.test(l.label)).pop();
    ok("V · days off: kid_c's 😷 Kid Off on Tue 12/15 — the car's line that day is {n:0, why:\"away\"}, no bank line", c && c.amz.day === "2026-12-15" && c.amz.n === 0 && c.amz.why === "away" && !c.amz.bid && amzBank(w, "kid_c").filter(x => /car/.test(x.note)).length === 1, c);
    const L1 = amzLines(w, "kid_a").pop(), line1 = clone(adj(w, "kid_a")[L1.amz.bid]), b0 = bal(B, "kid_a"), id = I["kid_a|Vacuum the den"];
    ok("…ledger: \"… ➖ Excuse\" on the cost; the Excuse button names the carry", /lgAmzExcuse\('kid_a','2026-12-08_cstep\d+'\)/.test(LG(A, "lgGo('kid_a',0,0)")));
    let m5 = w.mark(); A.run("lgAmzExcuse('kid_a'," + J(id) + ")"); await w.flush(); const exW = WS(w, m5);
    ok("H · ➖ Excuse (not their fault after all): ONE update — today's line given back with gb.x, its bank line removed, why → \"notfault\"; Monday's (already given back) untouched", exW.length === 1 && /^update  \[/.test(exW[0]) && exW[0].indexOf("routineLog/kid_a/" + L1._wk + "/tuesday/" + L1._k + "/amz/gb") > 0 && exW[0].indexOf("amCarry/kid_a/" + id + "/why") > 0 && exW[0].indexOf("monday") < 0 && w.get("amCarry/kid_a/" + id + "/why") === "notfault" && w.get("routineLog/kid_a/" + L1._wk + "/tuesday/" + L1._k + "/amz/gb/x") === 1 && bal(B, "kid_a") === b0 + 2, exW);
    ok("…the kid's row now \"+10 ⭐\" (full stars); ten redraws file nothing", (() => { const m6 = w.mark(); for (let r = 0; r < 10; r++) drawAll(B); return amRow(kidList(B, "kid_a"), "Vacuum the den") === "+10 ⭐" && writes(w, m6).length === 0; })());
    ok("…the row: \"… · 2 ⭐ taken this morning ➖ excused · ⭐ Mom gave back +2 ⭐ Undo\"", /2 ⭐ taken this morning ➖ excused · ⭐ Mom gave back \+2 ⭐ Undo$/.test(lgRowOf(LG(A, "lgGo('kid_a',0,0)"), "Vacuum the den")), lgRowOf(LG(A, "lgGo('kid_a',0,0)"), "Vacuum the den"));
    m5 = w.mark(); A.run("lgAmzExUndo('kid_a'," + J(L1._wk) + ",'tuesday'," + J(id) + ")"); await w.flush();
    ok("H · its Undo: ONE update — that line back byte for byte, why → \"ignored\", balance back; Monday's give-back still stands", writes(w, m5).length === 1 && J(adj(w, "kid_a")[L1.amz.bid]) === J(line1) && w.get("amCarry/kid_a/" + id + "/why") === "ignored" && bal(B, "kid_a") === b0 && !!w.get("routineLog/kid_a/" + ex.monGb._wk + "/monday/" + ex.monGb._k + "/amz/gb") && amRow(kidList(B, "kid_a"), "Vacuum the den") === "<s style=\"opacity:.6\">10</s> → 0 ⭐", WS(w, m5));
  }
  if (n === 16) {
    const L2 = amzLines(w, "kid_a").pop(), args = J("kid_a") + "," + J(L2._wk) + ",'wednesday'," + J(L2.amz.id), gp = "routineLog/kid_a/" + L2._wk + "/wednesday/" + L2._k + "/amz/gb";
    Dd.run("dadUnlocked=false;1"); let m7 = w.mark(); const dl = Dd.run("lgAmzGive(" + args + ")"); await w.flush();
    ok("H · Dad's link LOCKED: the row has no buttons; lgAmzGive refused, zero writes", !/lgAmzGive|lgAmzExcuse/.test(LG(Dd, "lgGo('kid_a',0,0)")) && /2 ⭐ taken this morning$/.test(lgRowOf(LG(Dd, "lgGo('kid_a',0,0)"), "Vacuum the den")) && dl === false && writes(w, m7).length === 0, lgRowOf(LG(Dd, "lgGo('kid_a',0,0)"), "Vacuum the den"));
    ok("…locked Dad cannot ask either: amAsk refused, no question", Dd.run("(function(){ __pop=''; return amAsk('chores','kid_a','wednesday',0)===false&&__pop===''; })()"));
    Dd.run("dadUnlocked=true;1"); m7 = w.mark(); const du = Dd.run("lgAmzGive(" + args + ")"); await w.flush();
    ok("H · Dad's link with his code: ⭐ Give stars back works, by:\"dad\"; the row \"⭐ Dad gave back +2 ⭐ Undo\"", du === true && w.get(gp + "/by") === "dad" && /Dad gave back \+2 ⭐ Undo$/.test(lgRowOf(LG(Dd, "lgGo('kid_a',0,0)"), "Vacuum the den")));
    Dd.run("lgAmzUndo(" + args + ")"); await w.flush(); ok("…and his Undo puts it back", w.get(gp) == null && !!adj(w, "kid_a")[L2.amz.bid]);
    const dq = ANS(Dd, "amAsk('chores','kid_a','wednesday'," + ix("kid_a", "Make the bed") + ")", "notfault");
    ok("…unlocked Dad's 🌅 AM asks the same question (Dad, on his own link with his code)", /Why wasn't it done\?/.test(dq.q) && dq.p === true && (carry(w, "kid_a", "Make the bed") && Object.values(root(w).amCarry.kid_a).some(r => r.label === "Make the bed" && r.fromIso === "2026-12-16" && r.by === "dad" && r.why === "notfault")));
  }
  if (n === 17) {
    const b = amzLines(w, "kid_b");
    ok("L · nobody drew kid_b's lists Wed 12/16: no Wednesday line, and Thursday files only Thursday's (never back-filed)", J(b.map(l => l.amz.day)) === J(["2026-12-14", "2026-12-15", "2026-12-17"]), b.map(l => l.amz.day));
    ok("F · Take stars away Off for kid_b (this morning): Thursday's line {n:0, why:\"off\"}, no bank line", b[2].amz.n === 0 && b[2].amz.why === "off" && amzBank(w, "kid_b").length === 2, b[2].amz);
  }
  if (n === 17) {
    const id = I["kid_a|Vacuum the den"], L3 = amzLines(w, "kid_a").pop(), m8 = w.mark();
    const q1 = ANS(Dm, "amAsk('chores','kid_a','thursday'," + ix("kid_a", "Make the bed") + ")", "ignored"); const g1 = Dm.run("lgAmzGive('kid_a'," + J(L3._wk) + ",'thursday'," + J(id) + ")"); const e1 = Dm.run("lgAmzExcuse('kid_a'," + J(id) + ")"); await w.flush();
    ok("K · dry-run (a Mom device with ?dryrun=1): the question and its answer, ⭐ Give stars back and ➖ Excuse write nothing to the database", /Why wasn't it done\?/.test(q1.q) && writes(w, m8).length === 0 && !!adj(w, "kid_a")[L3.amz.bid] && w.get("amCarry/kid_a/" + id + "/why") === "ignored", WS(w, m8));
  }
  if (n === 18) { const b = amzLines(w, "kid_b").pop();
    ok("F · Take stars away On again ({from: today}) — it starts clean: kid_b's porch (own day before it) takes nothing: {n:0, why:\"off\"}", b.amz.day === "2026-12-18" && b.amz.n === 0 && b.amz.why === "off", b.amz); }
  if (n === 19) {
    const La = amzLines(w, "kid_a"), Lc = amzLines(w, "kid_c").filter(l => /car/.test(l.label));
    ok("D · at most 5 days: kid_a's Vacuum filed Mon–Fri 12/14–12/18 (5 lines, −2 each), nothing on Sat 12/19 — it has cost the 10 it was worth", J(La.map(l => l.amz.day)) === J(["2026-12-14", "2026-12-15", "2026-12-16", "2026-12-17", "2026-12-18"]) && La.every(l => l.amz.n === 2), La.map(l => [l.amz.day, l.amz.n]));
    ok("…in the bank: 4 lines (Monday's given back), −8", amzBank(w, "kid_a").length === 4 && amzBank(w, "kid_a").reduce((s, x) => s + x.amount, 0) === -8);
    ok("…kid_c's car: Mon −2, Tue nothing (Kid Off), Wed–Fri −2: 5 days, −8; kid_d (Stars fall off then on again from Fri): never at zero, nothing ever filed", Lc.length === 5 && Lc.map(l => l.amz.n).join(",") === "2,0,2,2,2" && amzLines(w, "kid_d").length === 0, Lc.map(l => [l.amz.day, l.amz.n, l.amz.why]));
    S.dump.kidSat = a; S.dump.ledgerWeek = LG(A, "lgGo('kid_a',0,1)");
    const wk = A.run("(function(){ let a=0,t=0; for(let k=0;k>=-(lgNow()+1);k--){ const x=lgDayData('kid_a',k); if(!x.lists) continue; t+=x.taken; x.lists.forEach(function(L){ L.rows.forEach(function(r){ a+=r.atk||0; }); }); } return [a,t]; })()");
    ok("…the 📒 Ledger's This week adds it up: the 🌅 rows' 8 ⭐ (Tue–Fri; Monday's given back) are in its \"taken\" with C3's drops (" + wk[1] + " ⭐ in all)", wk[0] === 8 && new RegExp("taken " + wk[1] + " ⭐").test(top(S.dump.ledgerWeek)), [wk, top(S.dump.ledgerWeek)]);
    A.run("lgRulePause()"); await w.flush(); const pz = amRow(kidList(B, "kid_a"), "Vacuum the den"); A.run("lgRulePause()"); await w.flush(); const pz2 = amRow(kidList(B, "kid_a"), "Vacuum the den");
    ok("F · ⏸ Pause on: the Vacuum row \"+10 ⭐\" (full stars); off again ({from: today}): still \"+10 ⭐\" — only from that day", pz === "+10 ⭐" && pz2 === "+10 ⭐", [pz, pz2]);
    const cid = I["kid_c|Wash the car"], m9 = w.mark(); A.run("amTakeBack('kid_c'," + J(cid) + ")"); await w.flush();
    const lost = lgRowOf(LG(A, "lgGo('kid_c',-1,0)"), "Wash the car");
    ok("…✕ take off on kid_c's ignored car (it cost Mon, Wed–Fri): the carry goes as before, its lines and bank lines stay (decided); the 📒 Ledger keeps a row for Friday's: \"✖ 🌅 Wash the car taken off the list · 2 ⭐ taken that morning ⭐ Give stars back\" (no ➖ Excuse)", w.get("amCarry/kid_c/" + cid) == null && amzLines(w, "kid_c").filter(l => /car/.test(l.label)).length === 5 && amzBank(w, "kid_c").filter(x => /car/.test(x.note)).length === 4 && /^✖ 🌅 Wash the car taken off the list · 2 ⭐ taken that morning ⭐ Give stars back$/.test(lost), [lost, WS(w, m9)]);
    const Cl = A.run("(function(){ return chSettingsClickoffLogHTML(); })()");
    ok("…the Click-off Log shows each line: \"↩ Vacuum the den — not done −2 ⭐\"", /Vacuum the den — not done\s*<\/span>\s*<span style="color:#b91c1c;font-weight:800">−2 ⭐<\/span>/.test(Cl) || /Vacuum the den — not done −2 ⭐/.test(txt(Cl)), (txt(Cl).match(/.{0,30}Vacuum the den — not done.{0,30}/) || [""])[0]);
  }
}
console.log("\n── G · kids never see the question; the streak; the daily count ──");
ok("G · a kid's device: no \"ignored\", 🙈 or the question on any kid screen, any day (lists, Kids' Corner, its stars)", kidSaw.length === 0, kidSaw);
ok("G · P2's streak, Tue 12/08's Chores: kid_a and kid_c (ignored) break it (−1) where the app before passed the day over (0); kid_b (closed = not their fault) passes it over as before, and breaks it once Mom changes it to ignored", S.ls[0] === -1 && S.ls[1] === 0 && S.ls[2] === 0 && S.ls[3] === 0 && S.ls[4] === -1 && S.ls[5] === 0 && S.ls[6] === -1, S.ls);
ok("G · C5's daily count (hub's default: an ignored send is still not a miss): Make the bed's missed days Wed–Fri equal the app before's", (S.dly || []).length === 3 && S.dly.every(x => x[0] === x[1]), S.dly);

if (process.env.MWHY_DUMP) fs.writeFileSync(process.env.MWHY_DUMP, J(S.dump));
try { fs.unlinkSync(BASE_IDX); } catch (e) {}
console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); try { fs.unlinkSync(BASE_IDX); } catch (x) {} process.exit(1); });
