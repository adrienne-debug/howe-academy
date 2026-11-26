/*
 * test_chore_drop.js — CHOREDROP (index.html) + LEDGERDROP (house.js): slice C3 of DESIGN_missed_chores_2026-11-19 (§2.2 "the drop takes
 * 20% of its stars, once"; §2.3 what takes nothing; §2.4 one bank line with a fixed id, "Can go below zero") and the 📒 Ledger's row for
 * it (DESIGN_chore_ledger_2026-11-21 §2–§4: "✖ … due Tue, not done in time · 2 ⭐ taken", ⭐ Give stars back, ➖ Excuse, each with Undo).
 * The first slice that ever takes stars by itself, so the checks are about "exactly once".
 * The WHOLE app runs per device (test_fixtures/house_world.js: one shared in-memory Firebase with transactions, one virtual clock) on a
 * made-up family (kid_a … kid_d), the clock moved day by day from Mon 11/16 (day 0) to Fri 12/18 (day 32). RT_TAKE_FROM = Mon 11/30
 * (day 14): turns due before it file exactly as before.
 *   kid_a 🧹 Vacuum the den (Tue 10 ⭐, the §2.2 row) · Dust the lamp (Tue 5) · Wipe the window (Tue 15) · Scrub the tub (Tue 22) ·
 *         Water the fern (Tue 0) · Sweep the hall (Tue 10, ✕ waved) · Fold the towels (Tue 10, ticked Thu) · Clean the sink (Tue 10, 🌅)
 *         · Rake the leaves (Tue 10, from 12/2) · Feed the goat (Mon Wed Fri 50, 3+ a week) · Make the bed (daily 10) · Wipe the counter (as needed 5)
 *   kid_b 🧹 Sweep the porch (Tue 10) · Wash the bins (Fri 10)   — Take stars away Off Wed 12/2, On again Sat 12/5
 *   kid_c 🧹 Scrub the tub (Tue 22) · Toys in the bin (daily 10) — a balance below zero and back
 *   kid_d 🧹 Dust the blinds (Tue 10) · Shake the rugs (Fri 10) · Mop the porch (Mon 10, 4-week cycle, week 1 from 11/30)
 *         — ⏸ Pause On Wed 12/9, Off Sun 12/13
 * Sections: A the function and the blank slate (rounding 5 / 15 / 22, 0 ⭐, plan rows) · B the §2.2 row day by day · C what takes nothing
 * (✕ / waved, ticked late, 🌅, daily, as needed, before `from`, before RT_TAKE_FROM) · D the 3-a-week row (−10 once) and the 4-week cycle
 * (one step only) · E redraws, a reload, two devices, the offline queue · F switches (Take stars away, ⏸ Pause; "a flip never reaches
 * back") · G below zero and back · H the 📒 Ledger: the row, Give back / Undo, Excuse / Undo, who may · I 📊 How often · J nothing else
 * moves (the app before, every day: the lists, the bonuses, every write before the slate) · K dry-run · L nobody draws for days · P plan ON.
 * "The app before" = THIS tree with C3 taken out (no git, no pinned commit): index.html minus CHOREDROP, RT_TAKE_FROM, starTakeAt and the
 * Click-off Log's "−2 ⭐"; house.js minus LEDGERDROP and its hooks (each must match exactly once, or the test stops).
 * CDROP_INDEX / CDROP_HJS = other copies (a mutation check). CDROP_DUMP = a file for the preview page's drawings.
 * run: node test_chore_drop.js
 */
"use strict";
const fs = require("fs"), path = require("path"), os = require("os");
const W = require(path.join(__dirname, "test_fixtures", "house_world.js"));
let pass = 0, fail = 0; const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x).slice(0, 900) + ")" : "")); } };
const J = x => JSON.stringify(x), clone = x => JSON.parse(J(x));
const IDX = process.env.CDROP_INDEX || path.join(__dirname, "index.html"), HJS = fs.readFileSync(process.env.CDROP_HJS || path.join(__dirname, "house.js"), "utf8");

// ── the app before: this tree, C3 taken out ──
const once = (src, what, from, to, label) => { const n = typeof from === "string" ? src.split(from).length - 1 : (src.match(from) || []).length;
  if (n !== 1) throw new Error("test_chore_drop: the app before cannot be built — " + label + " found " + n + "× in " + what + " (must be exactly once)"); return src.replace(from, () => to); };
const C6 = require(path.join(__dirname, "test_fixtures", "carve_c6.js"));   // C6 (test_chore_zero_daily.js) is built on C3: its app before goes too
const BASE_IDX = (() => { let s = C6.idx(fs.readFileSync(path.join(__dirname, "index.html"), "utf8")); const R = (a, b, l) => { s = once(s, "index.html", a, b, l); };
  R(/^\/\/ CHOREDROP_START[^\n]*\n[\s\S]*?^\/\/ CHOREDROP_END\n/m, "", "the CHOREDROP block");
  R(/^\/\/ CHOREAMWHY_START[^\n]*\n[\s\S]*?^\/\/ CHOREAMWHY_END\n/m, "", "C4's block (it reads starTakeAt; its hooks are typeof-guarded)");
  R(/^const RT_TAKE_FROM=[^\n]*\n/m, "", "RT_TAKE_FROM");
  R(/^\/\/ CHOREDROP \(C3\): why the drop[^\n]*\n[^\n]*\nfunction starTakeAt[^\n]*\n/m, "", "starTakeAt");
  R(/^ {2}const due=_rtLastDueIdx\(ds,DAYS_ALL\.indexOf\(_todayDay\)\), tp=[^\n]*/m, "  const due=_rtLastDueIdx(ds,DAYS_ALL.indexOf(_todayDay));", "_rtLogLateMiss's tp");
  R(/_rtDropFile\(kid,slot,i,DAYS_ALL\[due\],label,pts,undefined,tp-_rtPos\(due\)\); return; \}[^\n]*/, "_rtLogMiss(kid,slot,i,DAYS_ALL[due],label,pts); return; }", "this week's call");
  R("_rtDropFile(kid,slot,i,DAYS_ALL[pd],label,pts,pw,tp+7-_rtPos(pd)); }", "_rtLogMiss(kid,slot,i,DAYS_ALL[pd],label,pts,pw); }", "last week's call");
  R(/\+\(\(e\.drop&&e\.drop\.n\)\?[^\n]*?\/\* CHOREDROP: what the drop took \*\//, "", "the Click-off Log's −2");
  if (/CHOREDROP|RT_TAKE_FROM|starTakeAt|_rtDropFile|cdrop_/.test(s)) throw new Error("test_chore_drop: the app before still mentions CHOREDROP");
  const t = path.join(os.tmpdir(), "chore_drop_before_" + process.pid + ".html"); fs.writeFileSync(t, s); return t; })();
const CG = require(path.join(__dirname, "test_fixtures", "carve_g.js"));   // slice G (test_house_record_stored.js) reads C3's hoDrop: its app before goes too
const BASE_HJS = (() => { let s = C6.hjs(CG.hjs(fs.readFileSync(path.join(__dirname, "house.js"), "utf8"))); const R = (a, b, l) => { s = once(s, "house.js", a, b, l); };
  R(/^\/\/ LEDGERDROP_START[^\n]*\n[\s\S]*?^\/\/ LEDGERDROP_END\n/m, "", "the LEDGERDROP block");
  R(/^\/\/ LEDGERAMZ_START[^\n]*\n[\s\S]*?^\/\/ LEDGERAMZ_END\n/m, "", "C4's ledger block (it reads LEDGERDROP's gate)"); R(/^ {2}out\.lists\.forEach\(function\(L\)\{ L\.rows\.forEach\(function\(r\)\{ out\.taken\+=r\.atk[^\n]*\n/m, "", "C4's taken");
  R(/^ {6}const g0=out\.gone\.length;[^\n]*\n/m, "", "the gone rows' start");
  R(/^ {6}if\(typeof lgDropGones===[^\n]*\n/m, "", "the gone rows' hook");
  R(/^ {2}out\.taken=0;[^\n]*\n/m, "", "the day's taken");
  R("(x.taken?\" · taken \"+lgStar(x.taken):\"\")+", "", "the summary's taken");
  R("tot={earned:0,short:0,open:0,held:0,taken:0};", "tot={earned:0,short:0,open:0,held:0};", "the week's totals");
  R("[\"earned\",\"short\",\"open\",\"held\",\"taken\"].forEach(function(f){ tot[f]+=x[f]||0; });", "[\"earned\",\"short\",\"open\",\"held\"].forEach(function(f){ tot[f]+=x[f]; });", "the week's sums");
  R(/^ {2}if\(on&&!st\.house&&typeof lgDropOff===[^\n]*\n/m, "", "the Excuse hook");
  R(/^ {2}if\(!st\.house&&typeof lgDropKept===[^\n]*\n/m, "", "the Undo hook");
  R(/lgRTakeOn\(kid\)\?false:lgRBy\(\{from:lgRToday\(\)\}\)\); \}[^\n]*/, "lgRTakeOn(kid)?false:null); }", "Take stars away On");
  R(/else if\(nx<=X\.t\)\{ const mk=[^\n]*/, "else if(nx<=X.t) marks.push({n:n,m:\"drop\",who:c.who}); }", "How often's mark");
  R("'not done by its next day'+(x.dk?' · '+x.dk.n+' ⭐ '+(x.dk.gb?'given back':'taken'):'')", "'not done by its next day'", "How often's tip");
  R(/\+\(x\.dk\?'<span style="font-size:10px[^\n]*?':''\)\+'<\/span>'; \}\)\.join\(''\)\+'<\/span>'; \}[^\n]*/, "+'</span>'; }).join('')+'</span>'; }", "How often's −2");
  if (/lgDrop|LEDGERDROP|hoDrop|x\.dk|out\.taken|x\.taken|taken:0|"taken"/.test(s)) throw new Error("test_chore_drop: the app before's house.js still mentions LEDGERDROP");
  return s; })();
console.log("(the app before: this tree with CHOREDROP / LEDGERDROP taken out)");

const K = o => Object.assign({ src: { kind: "routine" }, status: "active", area: "cleaning", verdict: "", note: "", level: 1, minutes: 5 }, o);
const FAM = () => ({
  a_vac: K({ label: "Vacuum the den", emoji: "🧹", who: "kid_a", slot: "chores", cad: "wk:1", pts: 10, order: 1 }),
  a_r5: K({ label: "Dust the lamp", emoji: "🪔", who: "kid_a", slot: "chores", cad: "wk:1", pts: 5, order: 2 }),
  a_r15: K({ label: "Wipe the window", emoji: "🪟", who: "kid_a", slot: "chores", cad: "wk:1", pts: 15, order: 3 }),
  a_r22: K({ label: "Scrub the tub", emoji: "🛁", who: "kid_a", slot: "chores", cad: "wk:1", pts: 22, order: 4 }),
  a_zero: K({ label: "Water the fern", emoji: "🪴", who: "kid_a", slot: "chores", cad: "wk:1", order: 5 }),
  a_wave: K({ label: "Sweep the hall", emoji: "🧺", who: "kid_a", slot: "chores", cad: "wk:1", pts: 10, order: 6 }),
  a_late: K({ label: "Fold the towels", emoji: "🧻", who: "kid_a", slot: "chores", cad: "wk:1", pts: 10, order: 7 }),
  a_am: K({ label: "Clean the sink", emoji: "🚰", who: "kid_a", slot: "chores", cad: "wk:1", pts: 10, order: 8 }),
  a_from: K({ label: "Rake the leaves", emoji: "🍂", who: "kid_a", slot: "chores", cad: "wk:1", pts: 10, from: "2026-12-02", order: 9 }),
  a_goat: K({ label: "Feed the goat", emoji: "🐐", who: "kid_a", slot: "chores", cad: "wk:0,2,4", pts: 50, area: "animals", order: 10 }),
  d_cyc: K({ label: "Mop the porch", emoji: "🧽", who: "kid_d", slot: "chores", cad: "wk:0", pts: 10, cycW: 1, cycN: 4, cycStart: "2026-11-30", order: 11 }),
  a_bed: K({ label: "Make the bed", emoji: "🛏", who: "kid_a", slot: "chores", cad: "daily", pts: 10, order: 12 }),
  a_cnt: K({ label: "Wipe the counter", emoji: "🧴", who: "kid_a", slot: "chores", cad: "asneeded", pts: 5, order: 13 }),
  b_vac: K({ label: "Sweep the porch", emoji: "🧹", who: "kid_b", slot: "chores", cad: "wk:1", pts: 10, order: 1 }),
  b_fri: K({ label: "Wash the bins", emoji: "🗑", who: "kid_b", slot: "chores", cad: "wk:4", pts: 10, order: 2 }),
  c_tub: K({ label: "Scrub the tub", emoji: "🛁", who: "kid_c", slot: "chores", cad: "wk:1", pts: 22, order: 1 }),
  c_toys: K({ label: "Toys in the bin", emoji: "🧩", who: "kid_c", slot: "chores", cad: "daily", pts: 10, order: 2 }),
  d_vac: K({ label: "Dust the blinds", emoji: "🪟", who: "kid_d", slot: "chores", cad: "wk:1", pts: 10, order: 1 }),
  d_fri: K({ label: "Shake the rugs", emoji: "🧶", who: "kid_d", slot: "chores", cad: "wk:4", pts: 10, order: 2 })
});
const dOf = n => new Date(2026, 10, 16 + n), isoN = n => { const d = dOf(n); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
const go = (w, n, h, mi) => { const d = dOf(n); return w.at(d.getFullYear(), d.getMonth() + 1, d.getDate(), h, mi || 0); };
const CAP = "globalThis.__pop='';document.body.insertAdjacentHTML=function(p,h){ globalThis.__pop=h; };globalThis.__toast=[];gwShowToast=function(m){ __toast.push(m); };tab='moms-plan';1";
async function mkWorld(index, hjs, jobs, mode) {
  const w = await W.world({ index, household: { jobs: jobs || FAM(), people: clone(W.PEOPLE), meta: { takeover: 1, engine: { mode: mode || "preview", on: "2026-11-09" } } }, tree: { config: clone(W.FX.db.config) } });
  const A = w.boot("A", "devA", { mom: true }), B = w.boot("B", "devB"), Dd = w.boot("D", "devD"), Kk = w.boot("Kk", "devK");
  Dd.run("HA_LS.setItem('ha_kiosk','dad');1"); Kk.run("HA_LS.setItem('ha_kiosk','routines');1");
  for (const d of [A, B, Dd, Kk]) d.run(CAP);
  await w.flush(); return { w, A, B, Dd, Kk, hjs };
}
const idxOf = (d, slot, kid, label) => d.run("(function(){ const d0=day; day=_todayDay; try{ return (rtStepsFor('" + slot + "','" + kid + "',false,day)||[]).findIndex(function(x){ return x&&x.label===" + J(label) + "&&x.cad!=='none'; }); } finally{ day=d0; } })()");
const tick = (d, kid, label) => { const i = idxOf(d, "chores", kid, label); if (i < 0) return -1; d.run("(function(){ day=_todayDay; toggleRtStep('chores','" + kid + "'," + i + "); })()"); return i; };
const draw = (d, kid, slot) => d.run("(function(){ const d0=day; day=_todayDay; try{ rtOpen={}; return rtSlotHTML(" + J(slot || "chores") + "," + J(kid) + "); } finally{ day=d0; } })()");
const drawAll = (d, kids) => (kids || ["kid_a", "kid_b", "kid_c", "kid_d"]).map(k => ["afternoon", "chores", "evening"].map(s => draw(d, k, s)).join("")).join("");
const loadH = (d, hjs) => { if (d.run("typeof lgShow") !== "function") d.run(hjs); };
const LG = (d, js) => d.run("(function(){ __pop=''; " + js + "; return __pop; })()");
const txt = h => String(h || "").replace(/<[^>]+>/g, " ").replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
const ROWSPLIT = '<div style="display:flex;flex-wrap:wrap;align-items:baseline;gap:2px 8px;padding:5px 2px;';
const rowsRaw = h => String(h).split(ROWSPLIT).slice(1).map(r => '<div ' + r.split("</div>")[0]);
const goneH = h => { const i = String(h).indexOf(">Gone from "); return i < 0 ? "" : String(h).slice(i); };
const goneRow = (h, name) => rowsRaw(goneH(h)).filter(r => r.indexOf(name) >= 0)[0] || "";
const top = h => txt((/<div style="font-size:13\.5px;padding:6px 2px 2px">([\s\S]*?)<\/div>/.exec(h) || ["", ""])[1]);
const root = w => w.db.tree.root;
const adj = (w, kid) => (((root(w).bank || {})[kid] || {}).adjustments) || {};
const drops = (w, kid) => Object.entries(adj(w, kid)).filter(([id]) => /^cdrop_/.test(id)).map(([id, a]) => Object.assign({ id }, a));
const dropOf = (w, kid, label) => drops(w, kid).filter(a => a.note.indexOf(label + " · not done") >= 0);
const missLines = (w, kid, label) => { const L = (root(w).routineLog || {})[kid] || {}, out = []; Object.keys(L).forEach(wk => Object.keys(L[wk] || {}).forEach(dn => Object.keys(L[wk][dn] || {}).forEach(k => { const r = L[wk][dn][k]; if (r && r.act === "miss" && r.label === label + " — not done") out.push(Object.assign({ _wk: wk, _dn: dn, _k: k }, r)); }))); return out; };
const sumAdj = (w, kid) => Object.values(adj(w, kid)).reduce((s, a) => s + (a && !a.held ? (a.amount || 0) : 0), 0);
const bal = (d, kid) => d.run("bankBalance(" + J(kid) + ")");
const writes = (w, m) => w.since(m).filter(e => !/^(get|once|on|read)/.test(String(e.op || "")) && !/^(connDiary|settings\/codeVersion|regen_lock|week\d+\/tasks)/.test(String(e.path || "")));   // a booting device's own writes left out
const WS = (w, m) => writes(w, m).map(e => e.op + " " + e.path + (e.keys ? " [" + e.keys.join(",") + "]" : "") + (e.op === "tx" ? (e.committed ? " ✓" : " ✗") : ""));
const noTs = x => JSON.parse(J(x), (k, v) => (k === "ts" || k === "at") ? "·" : v);
const canon = x => JSON.stringify(x, (k, v) => (v && typeof v === "object" && !Array.isArray(v)) ? Object.keys(v).sort().reduce((o, q) => { o[q] = v[q]; return o; }, {}) : v);
// the tree without C3's own data: drop marks on log lines, cdrop_ bank lines, the ✕ record's c3, Take stars away's {from}
const noC3 = t => { t = noTs(t); Object.values(t.routineLog || {}).forEach(K1 => Object.values(K1 || {}).forEach(W1 => Object.values(W1 || {}).forEach(D1 => Object.values(D1 || {}).forEach(r => { if (r) delete r.drop; }))));
  Object.values(t.bank || {}).forEach(b => { if (b && b.adjustments) Object.keys(b.adjustments).forEach(id => { if (/^cdrop_/.test(id)) delete b.adjustments[id]; }); if (b && b.adjustments && !Object.keys(b.adjustments).length) delete b.adjustments; });
  Object.values(t.waved || {}).forEach(W1 => Object.values(W1 || {}).forEach(D1 => Object.values(D1 || {}).forEach(K1 => Object.values(K1 || {}).forEach(r => { if (r) delete r.c3; }))));
  const tk = (((t.household || {}).meta || {}).starRules || {}).take; if (tk) Object.keys(tk).forEach(k => { if (tk[k] && typeof tk[k] === "object") delete tk[k]; });
  return canon(t); };
const ddiff = (a, b, p) => { p = p || ""; if (J(a) === J(b)) return []; if (!a || !b || typeof a !== "object" || typeof b !== "object") return [p + ": " + String(J(a)).slice(0, 140) + " ≠ " + String(J(b)).slice(0, 140)]; return [...new Set([...Object.keys(a), ...Object.keys(b)])].flatMap(k => ddiff(a[k], b[k], p + "/" + k)).slice(0, 8); };
const pill = (h, label) => { const r = h.split('<div class="mr-step').filter(x => x.indexOf(label + "<") >= 0 || x.indexOf(label + " <") >= 0)[0] || ""; return (r.match(/<span class="mr-pts">.*?⭐<\/span>/) || [""])[0]; };
const onList = (h, label) => h.split('<div class="mr-step').some(x => x.indexOf(">" + label) >= 0 || x.indexOf(" " + label + "<") >= 0);
const S = { dump: {} };

(async () => {
const X = await mkWorld(IDX, HJS), BW = await mkWorld(BASE_IDX, BASE_HJS);
const { w, A, B, Dd, Kk } = X;
loadH(A, HJS); loadH(Dd, HJS); loadH(Kk, HJS); loadH(BW.A, BASE_HJS); loadH(BW.Dd, BASE_HJS);

console.log("\n── A · the function, the decision, the blank slate ──");
ok("RT_TAKE_FROM is \"2026-11-30\", one constant beside RT_FALL_FROM", A.run("RT_TAKE_FROM") === "2026-11-30" && /const RT_FALL_FROM="2026-11-22";\nconst RT_TAKE_FROM="2026-11-30";/.test(fs.readFileSync(IDX, "utf8")));
const take = (pts, iso, extra) => J(A.run("rtDropTake('kid_a'," + J(Object.assign({ label: "x", pts: pts }, extra || {})) + "," + J(iso || "2026-12-01") + ")"));
ok("the step: 10 ⭐ → 2 · 5 → 1 · 15 → 3 · 22 → 4 · 50 → 10 · 1 → 1 · 3 → 1 (20%, nearest whole star, at least 1)", [10, 5, 15, 22, 50, 1, 3].map(p => JSON.parse(take(p)).n).join(",") === "2,1,3,4,10,1,1", [10, 5, 15, 22, 50, 1, 3].map(p => take(p)));
ok("…= the chore's stars − its first falling step (rtFallPts(stars,1)), the one function", [10, 5, 15, 22, 50, 1, 3, 7, 13].every(p => JSON.parse(take(p)).n === p - A.run("rtFallPts(" + p + ",1)")));
ok("a 0 ⭐ chore: {n:0, why:\"zero\"} — decided and recorded, nothing to take", take(0) === J({ n: 0, why: "zero" }));
ok("a turn due before RT_TAKE_FROM (Sun 11/29): no decision at all (null = file as before)", take(10, "2026-11-29") === "null" && JSON.parse(take(10, "2026-11-30")).n === 2);
ok("a plan row (st.house): no decision (the plan's own rows are a later slice)", take(10, "2026-12-01", { house: "h1" }) === "null");

// ── the replay ──
const S2 = { lists: {}, popB: {}, kidHtml: {}, bal: {} };
const DUE = n => [1].includes((dOf(n).getDay() + 6) % 7);
for (let n = 0; n <= 32; n++) {
  const dow = (dOf(n).getDay() + 6) % 7;   // 0 = Monday
  for (const V of [X, BW]) {
    const { w, A, B } = V;
    await go(w, n, 8); drawAll(B); await w.flush();
    // the ticks (the same on both)
    const tA = [];
    if (n < 14) {   // two weeks before the slate: kid_a ticks every weekly turn on its day but the vacuum on Tue 11/24 (a drop before the slate)
      if (dow === 1) ["Dust the lamp", "Wipe the window", "Scrub the tub", "Water the fern", "Sweep the hall", "Fold the towels", "Clean the sink"].concat(n === 8 ? [] : ["Vacuum the den"]).forEach(l => tA.push(l));
      if ([0, 2, 4].includes(dow)) tA.push("Feed the goat");
      if (dow === 1) { tick(B, "kid_b", "Sweep the porch"); tick(B, "kid_c", "Scrub the tub"); tick(B, "kid_d", "Dust the blinds"); }
      if (dow === 4) { tick(B, "kid_b", "Wash the bins"); tick(B, "kid_d", "Shake the rugs"); }
    } else if (n < 21) {   // week A (11/30–12/6): the drops
      if (dow === 2 || dow === 4) tA.push("Feed the goat");   // Monday 11/30's is missed
      if (n === 17) tA.push("Fold the towels");                // Tuesday's, two days late (pays 6)
      if (dow === 1) { tick(B, "kid_d", "Dust the blinds"); } if (dow === 4) tick(B, "kid_d", "Shake the rugs");
    } else {   // weeks B and C: kid_a, kid_c tick everything on its day
      if (dow === 1) ["Vacuum the den", "Dust the lamp", "Wipe the window", "Scrub the tub", "Water the fern", "Sweep the hall", "Fold the towels", "Clean the sink", "Rake the leaves"].forEach(l => tA.push(l));
      if ([0, 2, 4].includes(dow)) tA.push("Feed the goat");
      if (dow === 1) tick(B, "kid_c", "Scrub the tub");
      if (dow === 4 && n < 28) tick(B, "kid_b", "Wash the bins");
    }
    tA.forEach(l => tick(B, "kid_a", l));
    if (n === 19) { S.toysPay = B.run("(function(){ const L=rtStepsFor('chores','kid_c'), i=L.findIndex(s=>s&&s.label==='Toys in the bin'); return rtDailyPay('chores','kid_c',i,L[i]); })()"); tick(B, "kid_c", "Toys in the bin"); }   // Sat 12/5: her first tick of the daily since Mon 11/30 (C5: missed 5 days in a row → pays 2 of 10)
    await w.flush();
    // Mom's own taps (the same on both)
    if (n === 15) { A.run("(function(){ day=_todayDay; rtWave('chores','kid_a','tuesday'," + idxOf(A, "chores", "kid_a", "Sweep the hall") + "); })()"); }   // ✕ today: Sweep the hall
    if (n === 15) { await go(w, n, 19); A.run("(function(){ day=_todayDay; amSend('chores','kid_a','tuesday'," + idxOf(A, "chores", "kid_a", "Clean the sink") + "); })()"); }   // 🌅 Clean the sink
    if (n === 16) A.run("lgRuleTake('kid_b')");   // Take stars away Off for kid_b (Wed 12/2)
    if (n === 17) { const b = A.run("bankBalance('kid_c')"); A.run("bankGiveDock('kid_c',-1," + (b - 2) + ",'(a test) start at 2')"); }   // kid_c down to 2 ⭐
    if (n === 19) A.run("lgRuleTake('kid_b')");   // …On again (Sat 12/5)
    if (n === 23) A.run("lgRulePause()");         // ⏸ Pause On (Wed 12/9)
    if (n === 27) A.run("lgRulePause()");         // ⏸ Pause Off (Sun 12/13)
    await w.flush();
    await go(w, n, 16); drawAll(B); await w.flush();
  }
  // ── per-day checks ──
  S2.lists[n] = [drawAll(X.B), drawAll(BW.B)];
  S2.bal[n] = ["kid_a", "kid_b", "kid_c", "kid_d"].map(k => bal(X.B, k));
  if (n === 13) {
    console.log("\n── J · before the slate: nothing moves ──");
    ok("J · Sun 11/29: the whole database = the app before, byte for byte (the vacuum dropped Fri 11/27 before the slate, filed as before)", J(noTs(root(X.w))) === J(noTs(root(BW.w))), ddiff(noTs(root(X.w)), noTs(root(BW.w))));
    const v = missLines(X.w, "kid_a", "Vacuum the den");
    ok("…its \"— not done\" line under Tue 11/24 has no drop mark, and no bank line was written", v.length === 1 && v[0]._dn === "tuesday" && v[0].drop === undefined && drops(X.w, "kid_a").length === 0, v);
  }
  if (n === 15 || n === 16 || n === 17 || n === 18) { const h = draw(X.B, "kid_a");
    S2.kidHtml[n] = h;
    if (n === 15) ok("B · Tue 12/1 (its day): the vacuum is on kid_a's list at +10 ⭐; nothing filed", pill(h, "Vacuum the den") === '<span class="mr-pts">+10 ⭐</span>' && missLines(X.w, "kid_a", "Vacuum the den").length === 1);
    if (n === 16) ok("B · Wed: still on her list, \"10 → 8 ⭐\", no tag; nothing taken", pill(h, "Vacuum the den") === '<span class="mr-pts"><s style="opacity:.6">10</s> → 8 ⭐</span>' && dropOf(X.w, "kid_a", "Vacuum the den").length === 0, pill(h, "Vacuum the den"));
    if (n === 17) ok("B · Thu: \"10 → 6 ⭐\"; nothing taken", pill(h, "Vacuum the den") === '<span class="mr-pts"><s style="opacity:.6">10</s> → 6 ⭐</span>' && dropOf(X.w, "kid_a", "Vacuum the den").length === 0, pill(h, "Vacuum the den"));
    if (n === 18) { const L = dropOf(X.w, "kid_a", "Vacuum the den"), M = missLines(X.w, "kid_a", "Vacuum the den").filter(r => r._wk === X.A.run("activeWk()"));
      ok("B · Fri 12/4: off her list; ONE bank line, −2: bank/kid_a/adjustments/cdrop_<wk>_tuesday_kid_a_c<i>, note \"🧹 Vacuum the den · not done\", src \"drop\"", !onList(h, "Vacuum the den") && L.length === 1 && L[0].amount === -2 && L[0].note === "🧹 Vacuum the den · not done" && L[0].src === "drop" && /^cdrop_week\d+_tuesday_kid_a_cstep\d+$/.test(L[0].id), L);
      ok("…its \"— not done\" line (under Tue 12/1) carries the decision: drop = {n:2, bid, due:\"2026-12-01\", job:\"a_vac\"}", M.length === 1 && M[0]._dn === "tuesday" && J(M[0].drop) === J({ n: 2, due: "2026-12-01", job: "a_vac", bid: L[0] && L[0].id }), M);
      S.vacLine = L[0]; S.vacMiss = M[0];
      ok("…rounding on the same day: Dust the lamp (5) −1 · Wipe the window (15) −3 · Scrub the tub (22) −4", J(["Dust the lamp", "Wipe the window", "Scrub the tub"].map(l => dropOf(X.w, "kid_a", l).map(a => a.amount))) === J([[-1], [-3], [-4]]));
      ok("…Water the fern (0 ⭐): dropped and filed with {n:0, why:\"zero\"}, no bank line", dropOf(X.w, "kid_a", "Water the fern").length === 0 && J((missLines(X.w, "kid_a", "Water the fern").filter(r => r._wk === X.A.run("activeWk()"))[0] || {}).drop) === J({ n: 0, why: "zero", due: "2026-12-01", job: "a_zero" }));
      console.log("\n── C · what never costs a drop ──");
      ok("C · ✕ waved (Sweep the hall), ticked 2 days late (Fold the towels, paid 6), 🌅 sent (Clean the sink), before its `from` (Rake the leaves): no line, no \"— not done\" this week", ["Sweep the hall", "Fold the towels", "Clean the sink", "Rake the leaves"].every(l => dropOf(X.w, "kid_a", l).length === 0 && !missLines(X.w, "kid_a", l).some(r => r._wk === X.A.run("activeWk()"))), ["Sweep the hall", "Fold the towels", "Clean the sink", "Rake the leaves"].map(l => missLines(X.w, "kid_a", l)));
      ok("…the daily (Make the bed, not ticked all week) and the as-needed row: nothing", dropOf(X.w, "kid_a", "Make the bed").length === 0 && dropOf(X.w, "kid_a", "Wipe the counter").length === 0 && missLines(X.w, "kid_a", "Make the bed").length === 0);
      ok("…the late tick paid what it paid (6, C2), and nothing was taken for it", (() => { const l = Object.values(adj(X.w, "kid_a")).filter(a => a.note && a.note.indexOf("Fold the towels") >= 0 && a.amount > 0).map(a => a.amount); return l[l.length - 1] === 6; })());
    }
  }
  if (n === 16) {
    console.log("\n── D · 3 times a week, and the 4-week cycle ──");
    const g = dropOf(X.w, "kid_a", "Feed the goat");
    ok("D · Wed 12/2: Monday's goat (50 ⭐, 3 a week) dropped at its next day: ONE line, −10", g.length === 1 && g[0].amount === -10 && /_monday_kid_a_/.test(g[0].id), g);
  }
  if (n === 15) ok("D · Tue 12/1: Monday's goat still on the list, red \"1 day late\" and \"50 → 40 ⭐\" (C1, C2), nothing taken", /Feed the goat<span class="rt-late">1 day late<\/span>/.test(draw(X.B, "kid_a")) && pill(draw(X.B, "kid_a"), "Feed the goat") === '<span class="mr-pts"><s style="opacity:.6">50</s> → 40 ⭐</span>' && dropOf(X.w, "kid_a", "Feed the goat").length === 0);
  if (n === 19) ok("D · Sat 12/5: kid_d's 4-week-cycle mop (due Mon 11/30, wait 7) pays 0 today and still nothing is taken", pill(draw(X.B, "kid_d"), "Mop the porch") === '<span class="mr-pts"><s style="opacity:.6">10</s> → 0 ⭐</span>' && dropOf(X.w, "kid_d", "Mop the porch").length === 0, pill(draw(X.B, "kid_d"), "Mop the porch"));
  if (n === 21) { const m = dropOf(X.w, "kid_d", "Mop the porch"), g = dropOf(X.w, "kid_a", "Feed the goat");
    ok("D · Mon 12/7 (its cycle week over): the mop drops and takes ONE step only, −2 (not the §2.2 \"wait 7\" row's −2 a day after zero)", m.length === 1 && m[0].amount === -2 && missLines(X.w, "kid_d", "Mop the porch").filter(r => r.drop).length === 1, m);
    ok("…the goat: still that one line (−10); Wed and Fri were ticked on their day", g.length === 1); }
  if (n === 18 || n === 21 || n === 25 || n === 28 || n === 32) {
    const b = { v: dropOf(X.w, "kid_b", "Sweep the porch"), f: dropOf(X.w, "kid_b", "Wash the bins") }, d = { v: dropOf(X.w, "kid_d", "Dust the blinds"), f: dropOf(X.w, "kid_d", "Shake the rugs") };
    const why = (kid, l, wk) => (missLines(X.w, kid, l).filter(r => r.drop && r.drop.due === wk)[0] || {}).drop;
    if (n === 18) { console.log("\n── F · the switches ──");
      ok("F · Take stars away Off for kid_b (Wed): her porch (due Tue 12/1) drops Fri with nothing taken, recorded {n:0, why:\"off\"}; kid_a's same-day drops take (kid_b only)", b.v.length === 0 && J(why("kid_b", "Sweep the porch", "2026-12-01")) === J({ n: 0, why: "off", due: "2026-12-01", job: "b_vac" }) && dropOf(X.w, "kid_a", "Vacuum the den").length === 1, why("kid_b", "Sweep the porch", "2026-12-01")); }
    if (n === 21) {
      ok("F · On again Sat 12/5 (take/kid_b = {from:\"2026-12-05\"}): nothing reaches back — the porch's Fri drop still took nothing after redraws", b.v.length === 0 && J(w.get("household/meta/starRules/take/kid_b")) === J({ from: "2026-12-05" }) && why("kid_b", "Sweep the porch", "2026-12-01").n === 0);
      ok("…\"On: it starts clean\": the bins (due Fri 12/4, while Off) drop Mon 12/7, after On, and take nothing: {n:0, why:\"off\"}", b.f.length === 0 && J(why("kid_b", "Wash the bins", "2026-12-04")) === J({ n: 0, why: "off", due: "2026-12-04", job: "b_fri" }), why("kid_b", "Wash the bins", "2026-12-04")); }
    if (n === 25) ok("F · ⏸ Pause On (Wed 12/9): kid_b's porch and kid_d's blinds (due Tue 12/8) drop Fri 12/11 with {n:0, why:\"pause\"}, nothing taken", b.v.length === 0 && d.v.length === 0 && why("kid_b", "Sweep the porch", "2026-12-08").why === "pause" && why("kid_d", "Dust the blinds", "2026-12-08").why === "pause");
    if (n === 28) ok("F · ⏸ Off Sun 12/13 (pause = {from:\"2026-12-13\"}): kid_d's rugs (due Fri 12/11, while paused) drop Mon 12/14 and take nothing", d.f.length === 0 && why("kid_d", "Shake the rugs", "2026-12-11").why === "pause" && J(w.get("household/meta/starRules/pause")) === J({ from: "2026-12-13" }));
    if (n === 32) ok("F · and turns due after both: kid_b's porch and kid_d's blinds (due Tue 12/15) drop Fri 12/18 and take −2 each; the earlier ones are still 0", J(b.v.map(a => a.amount)) === J([-2]) && J(d.v.map(a => a.amount)) === J([-2]) && b.v[0].id.indexOf("tuesday") > 0, [b.v, d.v]);
  }
  if (n === 18) {
    console.log("\n── G · below zero, and back ──");
    const c = dropOf(X.w, "kid_c", "Scrub the tub");
    ok("G · kid_c at 2 ⭐; her tub (22 ⭐) drops: the whole −4 is written and her balance is −2", c.length === 1 && c[0].amount === -4 && bal(X.B, "kid_c") === -2 && bal(X.A, "kid_c") === -2, [c, bal(X.B, "kid_c")]);
    const html = {
      chip: X.B.run("(function(){ const k0=kid; kid='kid_c'; try{ renderKidFilter(); return document.getElementById('kid-filter').innerHTML; } finally{ kid=k0; } })()"),
      store: X.B.run("_storeCardHTML('kid_c',false)"), bank: X.B.run("_bankCardHTML('kid_c',false)"), sav: X.B.run("_savSectionHTML('kid_c',false)"), kc: X.B.run("kcPointsHTML('kid_c')")
    };
    S.below = { chip: txt(html.chip).slice(-12), store: (/<div class="store-bal">([^<]*)<\/div>/.exec(html.store) || [])[1], vault: txt((/<div class="bv-amt">([^<]*)<\/div>/.exec(html.bank) || [])[1]), stmt: txt(html.bank.split('<div class="bs-row">').filter(r => r.indexOf("Scrub the tub") >= 0)[0] || ""), sav: txt(html.sav), kc: txt(html.kc).slice(0, 160) };
    S.dump.bankC = html.bank;
    ok("…the star chip says \"⭐ -2\", the store \"⭐ -2\", the bank's vault \"-2 ⭐\" (what a kid sees, as the code draws it)", /⭐ -2$/.test(S.below.chip) && S.below.store === "⭐ -2" && S.below.vault === "-2 ⭐", S.below);
    ok("…the Star Bank statement line: \"➖ 🛁 Scrub the tub · not done −4 ⭐ -2 ⭐\"", / ➖ 🛁 Scrub the tub · not done −4 ⭐ -2 ⭐$/.test(S.below.stmt), S.below.stmt);
  }
  if (n === 19) ok("G · …and back up: Sat she ticks Toys in the bin, which pays what C5 says (missed Mon–Fri: 2 of 10) → −2 + 2 = 0 ⭐; the −4 line stays (the drop leaves C5's pay alone)", S.toysPay === 2 && bal(X.B, "kid_c") === -2 + S.toysPay && dropOf(X.w, "kid_c", "Scrub the tub").length === 1, [S.toysPay, bal(X.B, "kid_c")]);
  if (n === 18) {
    // ── E: redraws, reload, two devices, the outbox ──
    console.log("\n── E · exactly once ──");
    const t0 = J(adj(w, "kid_a")), m = w.mark();
    for (let r = 0; r < 10; r++) { drawAll(B); drawAll(Kk); await w.flush(); }
    ok("E · ten more draws on two devices: no write at all, the bank as it was", writes(w, m).length === 0 && J(adj(w, "kid_a")) === t0, WS(w, m));
    const R2 = w.boot("R2", "devR2"); R2.run(CAP); await w.flush(); R2.run("routineLog={};1"); const m2 = w.mark(); drawAll(R2);   // as if its log had not arrived yet await w.flush(); drawAll(R2); await w.flush();
    ok("…a reload (a fresh device draws before its copy of the log has arrived): each drop's transaction finds the line and writes nothing; no bank write", WS(w, m2).every(x => /^tx routineLog\/.* ✗$/.test(x)) && WS(w, m2).length > 0 && J(adj(w, "kid_a")) === t0, WS(w, m2));
    const ob = ["A", "B", "Kk", "R2"].map(k => ({ A, B, Kk, R2 })[k].run("JSON.stringify(Object.values(_obLoad()).map(function(e){ return e.p; }).filter(function(p){ return /cdrop_|miss_/.test(p); }))"));
    ok("…the 📮 outbox (obSet's replay store) holds no drop line and no \"— not done\" line on any device: nothing can replay it", ob.every(x => x === "[]"), ob);
  }
  if (n === 18) {
    // ── H: the 📒 Ledger ──
    console.log("\n── H · the 📒 Ledger ──");
    const pop = LG(A, "lgGo('kid_a',0,0)"); S.dump.ledgerFri = pop;
    const vac = goneRow(pop, "Vacuum the den");
    ok("H · the gone row: \"✖ 🧹 Vacuum the den due Tue, not done in time · 2 ⭐ taken\" with ➖ Excuse and ⭐ Give stars back", /^✖ 🧹 Vacuum the den due Tue, not done in time · 2 ⭐ taken ➖ Excuse ⭐ Give stars back$/.test(txt(vac)), txt(vac));
    ok("…the fern (0 ⭐) says nothing about stars; the tub \"· 4 ⭐ taken\"", /Water the fern due Tue, not done in time ➖ Excuse$/.test(txt(goneRow(pop, "Water the fern"))) && /Scrub the tub due Tue, not done in time · 4 ⭐ taken/.test(txt(goneRow(pop, "Scrub the tub"))), [txt(goneRow(pop, "Water the fern")), txt(goneRow(pop, "Scrub the tub"))]);
    ok("…the day's line: \"… · taken 10 ⭐ · …\" (2 + 1 + 3 + 4)", /· taken 10 ⭐/.test(top(pop)), top(pop));
    const BWpop = LG(BW.A, "lgGo('kid_a',0,0)");
    ok("…the app before draws the same rows with no stars words and no ⭐ button (the only difference)", txt(goneH(BWpop)) === txt(goneH(pop)).replace(/ · \d+ ⭐ taken/g, "").replace(/ ⭐ Give stars back/g, ""), [txt(goneH(BWpop)), txt(goneH(pop))]);
    const k = w.get("bank/kid_a/adjustments/" + S.vacLine.id), b0 = bal(B, "kid_a");
    // a kid's device cannot
    const mk = w.mark(), rk = Kk.run("lgDropGive('kid_a'," + J(S.vacMiss._wk) + ",'tuesday','chores'," + /step(\d+)$/.exec(S.vacLine.id)[1] + ")");
    ok("…a kid's device (Kids' Corner): lgDropGive refused, nothing written", rk === false && writes(w, mk).length === 0);
    const args = J("kid_a") + "," + J(S.vacMiss._wk) + ",'tuesday','chores'," + /step(\d+)$/.exec(S.vacLine.id)[1];
    let m = w.mark(); const g1 = A.run("lgDropGive(" + args + ")"); await w.flush();
    ok("H · ⭐ Give stars back (Mom): ONE update — the bank line removed, drop.gb = {by:\"mom\", ts, at, line} on the log line", g1 === true && J(WS(w, m)) === J(["update  [" + "routineLog/kid_a/" + S.vacMiss._wk + "/tuesday/" + S.vacMiss._k + "/drop/gb,bank/kid_a/adjustments/" + S.vacLine.id + "]"]) && w.get("bank/kid_a/adjustments/" + S.vacLine.id) == null && J(w.get("routineLog/kid_a/" + S.vacMiss._wk + "/tuesday/" + S.vacMiss._k + "/drop/gb/line")) === J(k), WS(w, m));
    ok("…her balance +2 exactly, on every device", bal(B, "kid_a") === b0 + 2 && bal(Kk, "kid_a") === b0 + 2);
    const p2 = LG(A, "lgGo('kid_a',0,0)");
    ok("…the row: \"… · 2 ⭐ taken ⭐ Mom gave back +2 ⭐ Undo\"; the day's line \"taken 8 ⭐\"", /Vacuum the den due Tue, not done in time · 2 ⭐ taken ➖ Excuse ⭐ Mom gave back \+2 ⭐ Undo$/.test(txt(goneRow(p2, "Vacuum the den"))) && /· taken 8 ⭐/.test(top(p2)), [txt(goneRow(p2, "Vacuum the den")), top(p2)]);
    m = w.mark(); for (let r = 0; r < 10; r++) { drawAll(B); drawAll(Kk); } const R3 = w.boot("R3", "devR3"); R3.run(CAP); drawAll(R3); await w.flush(); drawAll(R3);
    A.run("lgRuleTake('kid_a')"); A.run("lgRuleTake('kid_a')"); await w.flush(); drawAll(B); await w.flush();   // flip Take stars away Off and On: no device re-takes
    ok("…no device re-takes it: 10 redraws, a fresh device, the switch flipped Off and On — no bank line, the gb mark kept", w.get("bank/kid_a/adjustments/" + S.vacLine.id) == null && !!w.get("routineLog/kid_a/" + S.vacMiss._wk + "/tuesday/" + S.vacMiss._k + "/drop/gb") && !WS(w, m).some(x => /bank\/kid_a\/adjustments\/cdrop_/.test(x)), WS(w, m));
    ok("…a second tap: refused, nothing written", (() => { const m3 = w.mark(); return A.run("lgDropGive(" + args + ")") === false && writes(w, m3).length === 0; })());
    m = w.mark(); const u1 = A.run("lgDropUndo(" + args + ")"); await w.flush();
    ok("H · Undo: ONE update — that exact line back (byte for byte), the gb mark removed; balance back", u1 === true && J(w.get("bank/kid_a/adjustments/" + S.vacLine.id)) === J(k) && w.get("routineLog/kid_a/" + S.vacMiss._wk + "/tuesday/" + S.vacMiss._k + "/drop/gb") == null && writes(w, m).length === 1 && bal(B, "kid_a") === b0, WS(w, m));
    ok("…the log line is the one filed Friday again (byte for byte)", J(w.get("routineLog/kid_a/" + S.vacMiss._wk + "/tuesday/" + S.vacMiss._k)) === J((({ _wk, _dn, _k, ...r }) => r)(S.vacMiss)));
    // Dad's link: his code first (her answer 2026-11-24 "Yes, ask for code") — a kid holding a locked Dad device sees the row, not the buttons
    const gp = "routineLog/kid_a/" + S.vacMiss._wk + "/tuesday/" + S.vacMiss._k + "/drop/gb";
    Dd.run("dadUnlocked=false;1"); const bL = bal(B, "kid_a"), rL = txt(goneRow(LG(Dd, "lgGo('kid_a',0,0)"), "Vacuum the den"));
    ok("H · Dad's link LOCKED: the row still reads \"… · 2 ⭐ taken\", with no ⭐ Give stars back button", /Vacuum the den due Tue, not done in time · 2 ⭐ taken$/.test(rL) && !/Give stars back/.test(LG(Dd, "lgGo('kid_a',0,0)")), rL);
    m = w.mark(); const gL = Dd.run("lgDropGive(" + args + ")"); await w.flush();
    ok("…a tap anyway (lgDropGive) is refused: zero writes, the line stays, the balance unchanged", gL === false && writes(w, m).length === 0 && !!w.get("bank/kid_a/adjustments/" + S.vacLine.id) && w.get(gp) == null && bal(B, "kid_a") === bL, WS(w, m));
    // the Dad code alone opens nothing (hub round 3): a device NOT on Dad's link with dadUnlocked — a kid's tablet (Kk) and a plain device (Nd)
    const Nd = w.boot("Nd", "devNd"); Nd.run(CAP); await w.flush(); loadH(Nd, HJS);
    const NOD = [["a kid's tablet", Kk], ["a plain device", Nd]], bank0 = () => J(w.get("bank/kid_a"));
    const noBtn = d => { const hs = ["lgShow()", "lgShow();lgGo('kid_a',0,0)", "lgShow();lgGo('kid_a',-1,0)", "lgShow();lgGo('kid_a',0,1)"].map(js => LG(d, js)); try { hs.push(LG(d, "lgDraw()")); } catch (e) {} return { ok: !hs.some(h => /lgDropGive|lgDropUndo|Give stars back/.test(h)), n: hs.map(h => h.length) }; };
    for (const [nm, d] of NOD) {
      d.run("dadUnlocked=true;1"); const v = noBtn(d), b1 = bank0();
      m = w.mark(); const r = d.run("lgDropGive(" + args + ")"); await w.flush();
      ok("H · " + nm + " NOT on Dad's link, Dad's code typed: no ⭐ Give stars back in any ledger it draws; lgDropGive refused, zero writes, the bank unchanged", v.ok && r === false && writes(w, m).length === 0 && bank0() === b1 && w.get(gp) == null, { v, r, w: WS(w, m) });
      d.run("dadUnlocked=false;1"); }
    Dd.run("dadUnlocked=true;1");
    const gd = Dd.run("lgDropGive(" + args + ")"); await w.flush();
    ok("H · Dad's link UNLOCKED (code in): ⭐ Give stars back works the same, marked by:\"dad\"; the row says \"⭐ Dad gave back +2 ⭐\" and his Undo shows", gd === true && w.get(gp + "/by") === "dad" && w.get("bank/kid_a/adjustments/" + S.vacLine.id) == null && bal(B, "kid_a") === bL + 2 && /⭐ Dad gave back \+2 ⭐ Undo$/.test(txt(goneRow(LG(Dd, "lgGo('kid_a',0,0)"), "Vacuum the den"))));
    Dd.run("dadUnlocked=false;1"); const rU = txt(goneRow(LG(Dd, "lgGo('kid_a',0,0)"), "Vacuum the den"));
    ok("H · locked again: the row shows \"⭐ Dad gave back +2 ⭐\" with no Undo button", /· 2 ⭐ taken ⭐ Dad gave back \+2 ⭐$/.test(rU), rU);
    m = w.mark(); const uL = Dd.run("lgDropUndo(" + args + ")"); await w.flush();
    ok("…a tap anyway (lgDropUndo) is refused: zero writes, still given back", uL === false && writes(w, m).length === 0 && w.get(gp + "/by") === "dad" && w.get("bank/kid_a/adjustments/" + S.vacLine.id) == null && bal(B, "kid_a") === bL + 2, WS(w, m));
    for (const [nm, d] of NOD) {
      d.run("dadUnlocked=true;1"); const v = noBtn(d), b1 = bank0();
      m = w.mark(); const r = d.run("lgDropUndo(" + args + ")"); await w.flush();
      ok("H · " + nm + " NOT on Dad's link, Dad's code typed: no Undo on the given-back row in any ledger it draws; lgDropUndo refused, zero writes, the bank unchanged, still given back", v.ok && r === false && writes(w, m).length === 0 && bank0() === b1 && w.get(gp + "/by") === "dad", { v, r, w: WS(w, m) });
      d.run("dadUnlocked=false;1"); }
    w.devs.splice(w.devs.indexOf(Nd), 1);
    // ➖ Excuse on a dropped row (the window, −3): gives it back; Undo restores exactly
    const wi = /step(\d+)$/.exec(dropOf(w, "kid_a", "Wipe the window")[0].id)[1], wline = clone(dropOf(w, "kid_a", "Wipe the window")[0]); delete wline.id;
    const wmiss = clone(w.get("routineLog/kid_a/" + S.vacMiss._wk + "/tuesday/miss_chores_" + wi)), b1 = bal(B, "kid_a");
    const xargs = J("kid_a") + "," + J(S.vacMiss._wk) + ",'tuesday','chores'," + wi + "," + J(isoN(18)) + ",1";
    Dd.run("dadUnlocked=true;1");
    m = w.mark(); const e1 = Dd.run("lgExcuse(" + xargs + ")"); await w.flush();
    ok("H · ➖ Excuse on the window's gone row (Dad unlocked): the ✕ record on Tue, its bank line removed (+3), its \"— not done\" line out, both kept on the ✕ record (c3)", e1 === true && !!w.get("waved/" + S.vacMiss._wk + "/tuesday/kid_a/choresstep" + wi) && dropOf(w, "kid_a", "Wipe the window").length === 0 && w.get("routineLog/kid_a/" + S.vacMiss._wk + "/tuesday/miss_chores_" + wi) == null && canon(w.get("waved/" + S.vacMiss._wk + "/tuesday/kid_a/choresstep" + wi + "/c3")) === canon({ log: wmiss, line: wline }) && bal(B, "kid_a") === b1 + 3, [WS(w, m), e1, dropOf(w, "kid_a", "Wipe the window").length, w.get("routineLog/kid_a/" + S.vacMiss._wk + "/tuesday/miss_chores_" + wi), canon(w.get("waved/" + S.vacMiss._wk + "/tuesday/kid_a/choresstep" + wi + "/c3")), canon({ log: wmiss, line: wline }), bal(B, "kid_a"), b1]);
    m = w.mark(); for (let r = 0; r < 5; r++) drawAll(B); const R4 = w.boot("R4", "devR4"); R4.run(CAP); drawAll(R4); await w.flush(); drawAll(R4); await w.flush();
    ok("…while excused no device files it again (draws, a fresh device): no write", writes(w, m).length === 0, WS(w, m));
    m = w.mark(); const e2 = Dd.run("lgExcuseUndo(" + J("kid_a") + "," + J(S.vacMiss._wk) + ",'tuesday','chores'," + wi + ")"); await w.flush();
    ok("H · Excuse's Undo: the log line and the bank line back byte for byte (time included), the ✕ record gone; balance −3 again", e2 === true && J(w.get("routineLog/kid_a/" + S.vacMiss._wk + "/tuesday/miss_chores_" + wi)) === J(wmiss) && J(dropOf(w, "kid_a", "Wipe the window").map(a => { const c = clone(a); delete c.id; return c; })) === J([wline]) && w.get("waved/" + S.vacMiss._wk + "/tuesday/kid_a/choresstep" + wi) == null && bal(B, "kid_a") === b1, WS(w, m));
    ok("…and in that order: the lines back first, then the ✕ record removed (so no device can file it afresh between)", (() => { const ws = WS(w, m); const a = ws.findIndex(x => /^update .*miss_chores_/.test(x)), b = ws.findIndex(x => /^remove waved\//.test(x)); return a >= 0 && b > a; })(), WS(w, m));
    m = w.mark(); drawAll(B); drawAll(R4); await w.flush();
    ok("…then: draws write nothing", writes(w, m).length === 0, WS(w, m));
    // Excuse on the given-back vacuum, and Undo: the gb mark comes back too
    const vi = /step(\d+)$/.exec(S.vacLine.id)[1], vmiss = clone(w.get("routineLog/kid_a/" + S.vacMiss._wk + "/tuesday/" + S.vacMiss._k));
    A.run("lgExcuse(" + J("kid_a") + "," + J(S.vacMiss._wk) + ",'tuesday','chores'," + vi + "," + J(isoN(18)) + ",1)"); await w.flush();
    ok("H · Excuse on the given-back vacuum: nothing to remove from the bank (no new line, nothing taken twice)", dropOf(w, "kid_a", "Vacuum the den").length === 0 && canon(w.get("waved/" + S.vacMiss._wk + "/tuesday/kid_a/choresstep" + vi + "/c3")) === canon({ log: vmiss }), [dropOf(w, "kid_a", "Vacuum the den"), canon(w.get("waved/" + S.vacMiss._wk + "/tuesday/kid_a/choresstep" + vi + "/c3")), canon({ log: vmiss })]);
    A.run("lgExcuseUndo(" + J("kid_a") + "," + J(S.vacMiss._wk) + ",'tuesday','chores'," + vi + ")"); await w.flush(); drawAll(B); await w.flush();
    ok("…Undo: the log line back with its gb mark; still no bank line", J(w.get("routineLog/kid_a/" + S.vacMiss._wk + "/tuesday/" + S.vacMiss._k)) === J(vmiss) && dropOf(w, "kid_a", "Vacuum the den").length === 0);
    Dd.run("dadUnlocked=false;1");
    // the kid's Star Bank line
    const kb = B.run("_bankCardHTML('kid_a',false)"); S.dump.bankA = kb;
    const st = txt(kb.split('<div class="bs-row">').filter(r => r.indexOf("Dust the lamp") >= 0)[0] || "");
    ok("H · the kid's Star Bank (her own Stars page): \"➖ 🪔 Dust the lamp · not done −1 ⭐ <balance>\" — no \"late\", no 🗑 for a kid", /^Dec 4 ➖ 🪔 Dust the lamp · not done −1 ⭐ -?[\d,]+ ⭐$/.test(st) && !/late/i.test(st), st);
    ok("…Mom's view of the same Star Bank has its 🗑 (bankDeleteAdjustment), as every line does", /bankDeleteAdjustment\('kid_a','cdrop_/.test(A.run("_bankCardHTML('kid_a',true)")));
    S.dump.ledgerAfter = LG(A, "lgGo('kid_a',0,0)");
    const cl = txt(A.run("chSettingsClickoffLogHTML()"));
    ok("H · the Click-off Log tab (Mom): \"↩ Wipe the window — not done −3 ⭐\" and \"↩ Vacuum the den — not done −2 ⭐ given back\"; the fern's line has no stars", /↩ Wipe the window — not done −3 ⭐ /.test(cl) && /↩ Vacuum the den — not done −2 ⭐ given back /.test(cl) && /↩ Water the fern — not done Chores/.test(cl), cl.slice(0, 600));
    ok("…the app before's log: the same lines without the stars", (() => { const b = txt(BW.A.run("chSettingsClickoffLogHTML()")); return /↩ Wipe the window — not done Chores/.test(b) && !/not done −/.test(b); })());
    // Click-off Log
  }
  if (n === 23) {
    console.log("\n── I · 📊 How often ──");
    A.run("rlHistReady()"); await w.flush(); A.run("rlHistReady()");
    const ho = id => JSON.parse(A.run("(function(){ const X=hoX(), r=hoRec(" + J(id) + ",X); return JSON.stringify({m:r.marks.filter(function(x){ return x.m==='drop'; }).map(function(x){ return x.dk||null; }),h:hoMarksHTML(r)}); })()"));
    const r22 = ho("a_r22"), vac = ho("a_vac"), fern = ho("a_zero"); [r22, vac, fern].forEach(x => { x.m = x.m.filter(Boolean); });
    ok("I · Scrub the tub's ○ for Tue 12/1 carries {n:4} and draws \"○ −4\"", J(r22.m) === J([{ n: 4, gb: false }]) && /○<span style="font-size:10px;letter-spacing:0;color:#b91c1c"> −4<\/span>/.test(r22.h), r22);
    ok("…the vacuum's (given back) draws \"○ given back\"; its tip \"… · 2 ⭐ given back\"", J(vac.m) === J([{ n: 2, gb: true }]) && /○<span[^>]*> given back<\/span>/.test(vac.h) && /2 ⭐ given back/.test(vac.h), vac);
    ok("…the fern (0 ⭐, nothing taken) and the turns before the slate: a plain ○", J(fern.m) === "[]" && /○<\/span>/.test(fern.h), fern);
    const BWho = BW.A.run("(function(){ rlHistReady(); const X=hoX(); return hoMarksHTML(hoRec('a_r22',X)); })()");
    ok("…the app before: the same marks without the amount", BWho === r22.h.replace(/<span style="font-size:10px;letter-spacing:0;color:#b91c1c"> −4<\/span>/, "").replace(" · 4 ⭐ taken", ""), [BWho, r22.h]);
    // the Click-off Log line
    const cl = A.run("(function(){ const L=routineLog.kid_a[" + J(S.vacMiss._wk) + "].tuesday; return Object.keys(L).filter(function(k){ return L[k].act==='miss'; }).map(function(k){ return k; }).join(','); })()");
    S.clickoff = cl;
  }
  // ── J · every day: the kids' lists and the bonuses are the app before's ──
  if (!S.jFail && S2.lists[n][0] !== S2.lists[n][1]) S.jFail = { n, a: txt(S2.lists[n][0]).slice(0, 300), b: txt(S2.lists[n][1]).slice(0, 300) };
  const sl = V => { const o = {}; Object.keys(V.w.db.tree.root).filter(k => /^week\d+$/.test(k)).forEach(k => { const s = (V.w.db.tree.root[k] || {}).sl || {}; Object.keys(s).filter(q => /_(afternoon|chores|evening|day)$/.test(q)).forEach(q => { o[k + "/" + q] = noTs(s[q]); }); }); return o; };
  if (!S.bFail && J(sl(X)) !== J(sl(BW))) S.bFail = { n, d: ddiff(sl(X), sl(BW)) };
  if (n === 17 && !S.treeFail && noC3(root(X.w)) !== noC3(root(BW.w))) S.treeFail = ddiff(JSON.parse(noC3(root(X.w))), JSON.parse(noC3(root(BW.w))));
}
console.log("\n── J · nothing else moves ──");
ok("J · every day, Mon 11/16 … Fri 12/18: every kid's Afternoon, Chores and Evening lists = the app before, byte for byte (the drop changes no row)", !S.jFail, S.jFail);
ok("…every 🏁 list bonus and 🏆 whole-day bonus record = the app before (their size, when they were paid)", !S.bFail, S.bFail);
ok("…Thu 12/3: the whole database = the app before, but for C3's own marks (drop on \"— not done\" lines, cdrop_ lines, Take stars away's {from})", !S.treeFail, S.treeFail);

// ── K, L, E2: small worlds ──
console.log("\n── E · two devices at once; a device offline; dry-run ──");
{ const jobs = { a_vac: FAM().a_vac, b_vac: FAM().b_vac, c_toys: FAM().c_toys };   // kid_c's daily is ticked every day: a week with no tick at all leaves last week's check-offs unread (L)
  const V = await mkWorld(IDX, HJS, jobs), { w } = V; const P = V.B, Q = V.Kk, Dr = w.boot("Dr", "devDr"); Dr.run(CAP); Dr.run("HA_LS.setItem('ha_dryrun','1');1");
  const O = w.boot("O", "devO"); O.run(CAP);
  O.run("globalThis.__q=[];(function(){ const r0=db.ref; db.ref=function(p){ const r=r0.call(db,p), tx=r.transaction; r.transaction=function(f,c,a){ if(String(p).indexOf('routineLog/')!==0) return tx.call(r,f,c,a); __q.push(function(){ return tx.call(r,f,c,a); }); return new Promise(function(){}); }; return r; }; })();1");   // offline: its transactions wait
  for (let n = 0; n <= 18; n++) { await go(w, n, 8); tick(P, "kid_c", "Toys in the bin"); await w.flush(); }
  let m = w.mark(); drawAll(Dr); await w.flush();
  ok("K · dry-run: a device with ?dryrun=1 notices the drop first — nothing reaches the database; its own screen has the line (−2) and the decision", writes(w, m).length === 0 && Dr.run("((bank.kid_a||{}).adjustments||{})") && Dr.run("JSON.stringify(Object.keys((bank.kid_a||{}).adjustments||{}).filter(function(k){ return /^cdrop_/.test(k); }).length)") === "1", WS(w, m));
  m = w.mark(); drawAll(O, ["kid_a"]); await w.flush();
  ok("E · the offline device notices it: only its transaction is queued (nothing on the server yet)", writes(w, m).length === 0 && O.run("__q.length") === 1, [WS(w, m), O.run("__q.length")]);
  m = w.mark(); drawAll(P, ["kid_a"]); drawAll(Q, ["kid_a"]); await w.flush();
  ok("E · two devices draw the same moment: two transactions, ONE commits; ONE bank line (−2)", J(WS(w, m).filter(x => /^tx /.test(x)).map(x => x.slice(-1)).sort()) === J(["✓", "✗"]) && dropOf(w, "kid_a", "Vacuum the den").length === 1 && WS(w, m).filter(x => /^set bank\//.test(x)).length === 1, WS(w, m));
  V.A.run(HJS); V.A.run(CAP); const lid = dropOf(w, "kid_a", "Vacuum the den")[0].id, wk = V.A.run("activeWk()"), i = /step(\d+)$/.exec(lid)[1];
  V.A.run("lgDropGive('kid_a'," + J(wk) + ",'tuesday','chores'," + i + ")"); await w.flush();
  ok("…Mom gives it back", dropOf(w, "kid_a", "Vacuum the den").length === 0);
  m = w.mark(); const ql = O.run("__q.length"); O.run("__q.forEach(function(f){ f(); });__q=[];1"); await w.flush();
  ok("E · the offline device comes back: its queued transaction meets the line on the server and aborts — no bank line comes back", ql === 1 && J(WS(w, m)) === J(["tx routineLog/kid_a/" + wk + "/tuesday/miss_chores_" + i + " ✗"]) && dropOf(w, "kid_a", "Vacuum the den").length === 0, WS(w, m));
  m = w.mark(); [P, Q, O, V.A].forEach(d => d.run("_obRetry=null;try{ obReplay(); }catch(e){}1")); await w.flush(60000);
  ok("E · the 📮 outbox replayed on every device: nothing written (no drop line ever went through obSet)", !WS(w, m).some(x => /cdrop_|miss_/.test(x)) && dropOf(w, "kid_a", "Vacuum the den").length === 0, WS(w, m));
  // L: nobody draws kid_b's list until Tue 12/8 — the drop is filed then, under last week's Tuesday, and costs
  for (let n = 19; n <= 22; n++) { await go(w, n, 8); tick(P, "kid_c", "Toys in the bin"); drawAll(P, ["kid_a"]); await w.flush(); }
  console.log("\n── L · nobody draws a kid's list for days ──");
  ok("L · nobody drew kid_b's list Fri 12/4 … Mon 12/7: nothing filed for her porch", missLines(w, "kid_b", "Sweep the porch").filter(r => r.drop).length === 0 && dropOf(w, "kid_b", "Sweep the porch").length === 0);
  m = w.mark(); drawAll(P, ["kid_b"]); await w.flush();
  const lb = dropOf(w, "kid_b", "Sweep the porch"), mb = missLines(w, "kid_b", "Sweep the porch").filter(r => r.drop);
  ok("L · first drawn Tue 12/8 (its next day): filed then, under LAST week's Tuesday (12/1), and it takes −2 (the line dated the day it was noticed)", lb.length === 1 && lb[0].amount === -2 && mb.length === 1 && mb[0].drop.due === "2026-12-01" && mb[0]._wk !== V.A.run("activeWk()") && /^2026-12-08/.test(lb[0].iso), [lb, mb]);
  for (let n = 23; n <= 28; n++) { await go(w, n, 8); tick(P, "kid_c", "Toys in the bin"); await w.flush(); }
  await go(w, 29, 8); tick(P, "kid_c", "Toys in the bin"); await w.flush();   // Tue 12/15: still nobody draws kid_b's list (12/8's turn dropped Wed 12/9; its next day passes undrawn)
  await go(w, 30, 8); m = w.mark(); drawAll(P, ["kid_b"]); await w.flush();
  ok("L · a turn whose list nobody draws from its drop to its next day (12/8's, first drawn Wed 12/16): never filed, never costs", !missLines(w, "kid_b", "Sweep the porch").some(r => r.drop && r.drop.due === "2026-12-08") && dropOf(w, "kid_b", "Sweep the porch").length === 1, missLines(w, "kid_b", "Sweep the porch").map(r => r.drop));
}
console.log("\n── V · days off take nothing (hub's rule 2026-11-23) ──");
{ const jobs = { a_vac: FAM().a_vac, b_vac: FAM().b_vac, b_eve: K({ label: "Lay out the mats", emoji: "🧘", who: "kid_b", slot: "evening", cad: "wk:1", pts: 10, order: 1 }),
    c_vac: K({ label: "Dust the shelf", emoji: "📚", who: "kid_c", slot: "chores", cad: "wk:1", pts: 10, order: 1 }), d_vac: K({ label: "Dust the blinds", emoji: "🪟", who: "kid_d", slot: "chores", cad: "wk:1", pts: 10, order: 1 }),
    c_toys: FAM().c_toys };
  const off = (...isos) => { const o = {}; isos.forEach(i => { o[i] = { school: false }; }); return o; };
  const calendar = { kidOverrides: { kid_a: off("2026-12-01"), kid_c: off("2026-12-03"), kid_d: off("2026-12-04") },
    holidays: { h1: { name: "Made-up chores holiday", start: "2026-12-16", end: "2026-12-16", pause: "chores" }, h2: { name: "Made-up school holiday", start: "2026-12-17", end: "2026-12-17", pause: "school" } },
    vacations: { v1: { name: "Made-up trip", start: "2026-12-09", end: "2026-12-09", pause: "all" }, v2: { name: "Made-up long weekend", start: "2026-12-22", end: "2026-12-22", pause: "all" } } };
  const w = await W.world({ index: IDX, household: { jobs, people: clone(W.PEOPLE), meta: { takeover: 1, engine: { mode: "preview", on: "2026-11-09" } } }, tree: { config: clone(W.FX.db.config), calendar } });
  const P = w.boot("P", "devP"), Am = w.boot("Am", "devAm", { mom: true }), Dm = w.boot("Dm", "devDm", { mom: true }); [P, Am, Dm].forEach(d => d.run(CAP)); await w.flush();
  Dm.run("HA_LS.setItem('ha_dryrun','1');1"); Am.run(HJS); Dm.run(HJS);
  const why = (kid, l, due) => ((missLines(w, kid, l).filter(r => r.drop && r.drop.due === due)[0] || {}).drop || {});
  const day = async n => { await go(w, n, 8); tick(P, "kid_c", "Toys in the bin"); drawAll(P); await w.flush(); };
  for (let n = 0; n <= 18; n++) await day(n);
  ok("V · 😷 Kid Off on its due day (kid_a, Tue 12/1): dropped Fri, {n:0, why:\"away\"}, no bank line", why("kid_a", "Vacuum the den", "2026-12-01").why === "away" && why("kid_a", "Vacuum the den", "2026-12-01").n === 0 && dropOf(w, "kid_a", "Vacuum the den").length === 0, why("kid_a", "Vacuum the den", "2026-12-01"));
  ok("…Kid Off on a day of its wait (kid_c, Thu 12/3): away, nothing taken", why("kid_c", "Dust the shelf", "2026-12-01").why === "away" && dropOf(w, "kid_c", "Dust the shelf").length === 0);
  ok("…Kid Off only on the drop day itself (kid_d, Fri 12/4): it costs (−2) — the day it left the list is not in its wait", J(dropOf(w, "kid_d", "Dust the blinds").map(a => a.amount)) === "[-2]");
  ok("…another kid on the same days (kid_b, no day off): costs −2 on both her lists", J(dropOf(w, "kid_b", "Sweep the porch").map(a => a.amount)) === "[-2]" && J(dropOf(w, "kid_b", "Lay out the mats").map(a => a.amount)) === "[-2]");
  // decided once: the calendar changes afterwards
  Am.run("db.ref('calendar/kidOverrides/kid_a/2026-12-01').remove();db.ref('calendar/kidOverrides/kid_b/2026-12-01').set({school:false});1"); await w.flush();
  let m = w.mark(); drawAll(P); const F = w.boot("F", "devF"); F.run(CAP); await w.flush(); F.run("routineLog={};1"); drawAll(F); await w.flush();
  ok("…decided once: kid_a's Kid Off taken away and one added for kid_b afterwards — redraws and a fresh device change nothing (kid_a still 0, kid_b still −2)", why("kid_a", "Vacuum the den", "2026-12-01").why === "away" && dropOf(w, "kid_a", "Vacuum the den").length === 0 && dropOf(w, "kid_b", "Sweep the porch").length === 1 && !WS(w, m).some(x => /^set bank\/|✓$/.test(x)), WS(w, m));
  const pop = LG(Am, "lgGo('kid_a',0,0)");
  ok("…the 📒 Ledger row: \"… due Tue, not done in time · nothing taken (a day off in its wait)\"", /Vacuum the den due Tue, not done in time · nothing taken \(a day off in its wait\) ➖ Excuse$/.test(txt(goneRow(pop, "Vacuum the den"))), txt(goneRow(pop, "Vacuum the den")));
  // K2: dry-run — the ledger's four taps on kid_b's porch: the screen moves, nothing is written
  console.log("\n── K · dry-run: the ledger's taps write nothing ──");
  const wk = Dm.run("activeWk()"), bl = dropOf(w, "kid_b", "Sweep the porch")[0], bi = /step(\d+)$/.exec(bl.id)[1], args = J("kid_b") + "," + J(wk) + ",'tuesday','chores'," + bi, b0 = bal(Dm, "kid_b");
  m = w.mark(); const g = Dm.run("lgDropGive(" + args + ")");
  ok("K · ⭐ Give stars back on a dry run: its screen gives the 2 back and says \"⭐ Mom gave back +2 ⭐\"; zero writes", g === true && bal(Dm, "kid_b") === b0 + 2 && /Mom gave back \+2 ⭐ Undo/.test(txt(goneRow(LG(Dm, "lgGo('kid_b',0,0)"), "Sweep the porch"))) && w.since(m).length === 0, w.since(m));
  const u = Dm.run("lgDropUndo(" + args + ")");
  ok("…its Undo: the line back on that screen; zero writes", u === true && bal(Dm, "kid_b") === b0 && w.since(m).length === 0, w.since(m));
  const e = Dm.run("lgExcuse(" + args + "," + J(isoN(18)) + ",1)");
  ok("…➖ Excuse on the dropped row: the 2 back on that screen, the row excused; zero writes", e === true && bal(Dm, "kid_b") === b0 + 2 && w.since(m).length === 0, w.since(m));
  const eu = Dm.run("lgExcuseUndo(" + args + ")");
  ok("…Excuse's Undo: the line and the −2 back on that screen; zero writes, and the database's lines as they were", eu === true && bal(Dm, "kid_b") === b0 && w.since(m).length === 0 && dropOf(w, "kid_b", "Sweep the porch").length === 1 && !!w.get("routineLog/kid_b/" + wk + "/tuesday/miss_chores_" + bi), w.since(m));
  w.devs.splice(w.devs.indexOf(Dm), 1);   // the dry-run device leaves (a dry-run Mom device can hold the week-building lock and, rightly, write nothing)
  for (let n = 19; n <= 39; n++) await day(n);
  const cost = (kid, l, due) => why(kid, l, due).n === 2 && dropOf(w, kid, l).some(a => missLines(w, kid, l).some(r => r.drop && r.drop.due === due && r.drop.bid === a.id));
  ok("V · a vacation pausing \"all\" on a wait day (Wed 12/9): every kid's Tuesday turn takes nothing — kid_a, kid_b (both lists), kid_c, kid_d", ["kid_a|Vacuum the den", "kid_b|Sweep the porch", "kid_b|Lay out the mats", "kid_c|Dust the shelf", "kid_d|Dust the blinds"].every(x => why(x.split("|")[0], x.split("|")[1], "2026-12-08").why === "away"), ["kid_a|Vacuum the den", "kid_b|Lay out the mats"].map(x => why(x.split("|")[0], x.split("|")[1], "2026-12-08")));
  ok("…a holiday pausing \"chores\" on a wait day (Wed 12/16): the 🧹 Chores rows take nothing (kid_a, kid_b, kid_c, kid_d)", ["kid_a|Vacuum the den", "kid_b|Sweep the porch", "kid_c|Dust the shelf", "kid_d|Dust the blinds"].every(x => why(x.split("|")[0], x.split("|")[1], "2026-12-15").why === "away"));
  ok("…kid_b's 🌙 Evening row, whose wait had that \"chores\" holiday (Wed) and a school-only holiday (Thu 12/17), neither pausing it: costs −2", cost("kid_b", "Lay out the mats", "2026-12-15"), why("kid_b", "Lay out the mats", "2026-12-15"));
  ok("…a vacation pausing \"all\" ON the due day (Tue 12/22): no turn due that day drops at all (C1: a holiday or vacation day is not in the week's dates, so the late rule never sees it as passed) — nothing filed, nothing taken", ["kid_a|Vacuum the den", "kid_b|Sweep the porch", "kid_b|Lay out the mats", "kid_c|Dust the shelf"].every(x => !missLines(w, x.split("|")[0], x.split("|")[1]).some(r => r.drop && r.drop.due === "2026-12-22")) && !drops(w, "kid_a").some(a => /^cdrop_week\d+_tuesday/.test(a.id) && a.ts && /Dec 2[3-6]$/.test(a.ts)), P.run("JSON.stringify(DAY_DT)"));
  ok("…the wait is unchanged by days off: those rows left their lists on their Friday (12/4, 12/11, 12/18), as without them (C1)", ["2026-12-01", "2026-12-08", "2026-12-15"].every(due => missLines(w, "kid_a", "Vacuum the den").some(r => r.drop && r.drop.due === due && /Dec (4|11|18)$/.test(r.ts))), missLines(w, "kid_a", "Vacuum the den").map(r => r.ts));
}
console.log("\n── P · the plan ON: its own rows never cost here ──");
{ const V = await W.world({ mode: "on", index: IDX }), A2 = V.boot("A", "devA", { mom: true }), B2 = V.boot("B", "devB"); await V.flush();
  for (let n = 14; n <= 22; n++) { await go(V, n, 8); drawAll(B2); await V.flush(); await go(V, n, 20); drawAll(B2); await V.flush(); }
  const all = Object.values(V.db.tree.root.bank || {}).flatMap(b => Object.keys((b && b.adjustments) || {})).filter(id => /^cdrop_/.test(id));
  const marked = []; Object.values(V.db.tree.root.routineLog || {}).forEach(K1 => Object.values(K1 || {}).forEach(W1 => Object.values(W1 || {}).forEach(D1 => Object.values(D1 || {}).forEach(r => { if (r && r.drop) marked.push(r.label); }))));
  const misses = []; Object.values(V.db.tree.root.routineLog || {}).forEach(K1 => Object.values(K1 || {}).forEach(W1 => Object.values(W1 || {}).forEach(D1 => Object.keys(D1 || {}).forEach(k => { if (/^miss_h_/.test(k)) misses.push(k); }))));
  ok("P · a week and more with nothing ticked (plan ON, the house_world table): the plan files its own misses (" + misses.length + "), and not one drop line or bank line is written", all.length === 0 && marked.length === 0, { all, marked, misses: misses.length });
}

if (process.env.CDROP_DUMP) fs.writeFileSync(process.env.CDROP_DUMP, J(Object.assign({ below: S.below }, S.dump)));
console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
