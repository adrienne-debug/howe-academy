/*
 * test_chore_zero_daily.js — CHOREZERO (index.html) + LEDGERZERO (house.js): slice C6 of DESIGN_missed_chores_2026-11-19 (§2.8 "A flat
 * 1 ⭐ a day"; §2.3 one missed day is free; §2.4 one bank line with a fixed id, "Can go below zero"; §9 q1 where it stops: "give both
 * options") and its 📒 Ledger row (DESIGN_chore_ledger_2026-11-21 §2–§4: "−1 ⭐ this morning", ⭐ Give stars back, ➖ Excuse, each with Undo;
 * the ⚙ Star rules setting "Stops after 5 ⭐" / "No stop"). It takes stars from a bank by itself, so the checks are about exactly once
 * and nothing by accident.
 * The WHOLE app runs per device (test_fixtures/house_world.js: one shared in-memory Firebase with transactions, one virtual clock) on a
 * made-up family (kid_a … kid_d), the clock moved day by day from Sat 12/5 to Mon 12/21. RT_ZERO_FROM = Mon 12/7. The family's school
 * calendar has no week after Sat 12/19, so no new week is built on Sun 12/20 (the lists keep last week's): C6 must take nothing then.
 *   kid_a 🦷 Brush teeth (Morning, 0 ⭐, never done until Fri 12/18: the §2.8 table) · 🧵 Floss (Evening, 0 ⭐: done Tue 12/8 and Thu 12/10
 *         only; nobody draws her Evening list on Wed 12/16) · 🛏 Make the bed (Chores, daily 10 ⭐: C5) · 🧹 Vacuum the den (Chores, Tue 10 ⭐: C3)
 *   kid_b 🛁 Hang the towel (Evening, 0 ⭐, never done) — Take stars away Off Thu 12/10, On again Sat 12/12 · 🐱 Feed the cat (Morning 2 ⭐, ticked
 *         every day so every week has ticks)
 *   kid_c 0 ⭐ Evening rows never done but one not-a-miss on Thu 12/10: ✕ today · ➖ Excuse · 🌅 sent · its log says ticked · from Thu 12/10;
 *         🧼 Wash face ✕ today on Sat 12/12 before anyone draws;
 *         🧸 Toys away (Chores, 0 ⭐) on a vacation day that paused the Chores list (Thu 12/10)
 *   kid_d 🪥 Brush teeth (Morning, 0 ⭐, never done) — 😷 Kid Off Thu 12/10; a balance from 0 to below zero
 * The setting: Mom "No stop" Tue 12/15 · Dad (his code in) "Stops after 5" Thu 12/17 · ⏸ Pause On Fri 12/18, Off Sat 12/19.
 * Sections: A functions · T the table (both choices) · N not a miss · S switches · E exactly once (two devices, redraws, a fresh device,
 * the server first, dry-run) · W nobody draws · H the 📒 Ledger (Give back / Undo / Excuse / Undo / Dad) · G below zero · U ⚙ the setting
 * · J nothing else moves (a paying daily, a weekly chore, C3's drop: the app before, every day).
 * "The app before" = THIS tree with C6 taken out (no git, no pinned commit). CZERO_INDEX / CZERO_HJS = other copies (a mutation check).
 * CZERO_DUMP = a file for the preview page's drawings.
 * run: node test_chore_zero_daily.js
 */
"use strict";
const fs = require("fs"), path = require("path"), os = require("os");
const W = require(path.join(__dirname, "test_fixtures", "house_world.js"));
let pass = 0, fail = 0; const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x).slice(0, 900) + ")" : "")); } };
const J = x => JSON.stringify(x), clone = x => JSON.parse(J(x));
const IDX = process.env.CZERO_INDEX || path.join(__dirname, "index.html"), HJS = fs.readFileSync(process.env.CZERO_HJS || path.join(__dirname, "house.js"), "utf8");

// ── the app before: this tree, C6 taken out ──
const once = (src, what, from, to, label) => { const n = typeof from === "string" ? src.split(from).length - 1 : (src.match(from) || []).length;
  if (n !== 1) throw new Error("test_chore_zero_daily: the app before cannot be built — " + label + " found " + n + "× in " + what + " (must be exactly once)"); return src.replace(from, () => to); };
function carveIdx(s) { const R = (a, b, l) => { s = once(s, "index.html", a, b, l); };
  R(/^\/\/ CHOREZERO_START[^\n]*\n[\s\S]*?^\/\/ CHOREZERO_END\n/m, "", "the CHOREZERO block");
  R(/^ {2}if\(typeof rtZeroSee==="function"\) rtZeroSee\("morning",kid,steps\);[^\n]*\n/m, "", "the Morning list's hook");
  R(/^ {2}if\(typeof rtZeroSee==="function"\) rtZeroSee\(slot,kid,steps\);[^\n]*\n/m, "", "rtSlotHTML's hook");
  R("function rtDailyRow(st,z){ return !!st&&(st.cad||\"daily\")===\"daily\"&&(st.pts>0)!==!!z&&", "function rtDailyRow(st){ return !!st&&(st.cad||\"daily\")===\"daily\"&&(st.pts||0)>0&&", "rtDailyRow");
  R(/ z \(CHOREZERO, C6\)[^\n]*/, "", "rtDailyMissed's comment");
  R("function rtDailyMissed(slot,kid,i,st,z){\n  if(!rtDailyRow(st,z)||", "function rtDailyMissed(slot,kid,i,st){\n  if(!rtDailyRow(st)||", "rtDailyMissed");
  R(/^ {2}if\(z\)\{ const q=_todayDay==="monday"[^\n]*\n/m, "", "the walk's week check");
  R("const from=z?rtZeroFrom(kid):[RT_DAILY_FROM,", "const from=[RT_DAILY_FROM,", "the walk's start");
  R("for(let k=1;k<=(z?tp+8:6);k++){", "for(let k=1;k<=6;k++){", "the walk's length");
  R("if(!w||!m){ if(z) return -1; break; }", "if(!w||!m) break;", "the walk's last week");
  R("const lo=rtDailyLogOn(kid,w,dn,slot,st.label); if(lo){ if(z&&lo>1) return -1; break; }", "if(rtDailyLogOn(kid,w,dn,slot,st.label)) break;", "the walk's log");
  R(".indexOf(w)<0) return 2;", ".indexOf(w)<0) return true;", "rtDailyLogOn's unsure");
  R(/\+\(\(e\.zero&&e\.zero\.n\)\?[^\n]*?\/\* CHOREZERO \*\//, "", "the Click-off Log's −1");
  if (/CHOREZERO|rtZero|RT_ZERO_FROM|czero_|e\.zero/.test(s)) throw new Error("test_chore_zero_daily: the app before still mentions CHOREZERO");
  return s; }
function carveHjs(s) { const R = (a, b, l) => { s = once(s, "house.js", a, b, l); };
  R(/^\/\/ LEDGERZERO_START[^\n]*\n[\s\S]*?^\/\/ LEDGERZERO_END\n/m, "", "the LEDGERZERO block");
  R(/^ {8}if\(r&&typeof lgZeroRow===[^\n]*\n/m, "", "the row hook");
  R(/^ {2}out\.lists\.forEach\(function\(L\)\{ L\.rows\.forEach\(function\(r\)\{ out\.taken\+=[^\n]*\n/m, "", "the day's taken");
  R(/^ {2}if\(on&&typeof lgZeroOff===[^\n]*\n/m, "", "the Excuse hook");
  R(/^ {2}if\(off&&typeof lgZeroOn===[^\n]*\n/m, "", "the Excuse Undo hook");
  R("+(typeof lgZeroSet===\"function\"?lgZeroSet(sep,sub):'')", "", "the setting");
  if (/LEDGERZERO|lgZero|rtZero/.test(s)) throw new Error("test_chore_zero_daily: the app before's house.js still mentions LEDGERZERO");
  return s; }
const BASE_IDX = (() => { const t = path.join(os.tmpdir(), "chore_zero_before_" + process.pid + ".html"); fs.writeFileSync(t, carveIdx(fs.readFileSync(path.join(__dirname, "index.html"), "utf8"))); return t; })();
const BASE_HJS = carveHjs(fs.readFileSync(path.join(__dirname, "house.js"), "utf8"));
console.log("(the app before: this tree with CHOREZERO / LEDGERZERO taken out)");

const K = o => Object.assign({ src: { kind: "routine" }, status: "active", area: "health", verdict: "", note: "", level: 1, minutes: 2, cad: "daily" }, o);
const FAM = () => ({
  a_teeth: K({ label: "Brush teeth", emoji: "🦷", who: "kid_a", slot: "morning", order: 0 }),
  a_floss: K({ label: "Floss", emoji: "🧵", who: "kid_a", slot: "evening", order: 1 }),
  a_bed: K({ label: "Make the bed", emoji: "🛏", who: "kid_a", slot: "chores", pts: 10, area: "cleaning", order: 2 }),
  a_vac: K({ label: "Vacuum the den", emoji: "🧹", who: "kid_a", slot: "chores", cad: "wk:1", pts: 10, area: "cleaning", order: 3 }),
  b_cat: K({ label: "Feed the cat", emoji: "🐱", who: "kid_b", slot: "morning", pts: 2, area: "animals", order: 0 }),
  b_towel: K({ label: "Hang the towel", emoji: "🛁", who: "kid_b", slot: "evening", order: 1 }),
  c_x: K({ label: "Wipe the sink", emoji: "🚰", who: "kid_c", slot: "evening", order: 0 }),
  c_ex: K({ label: "Rinse the cup", emoji: "🥤", who: "kid_c", slot: "evening", order: 1 }),
  c_am: K({ label: "Shoes away", emoji: "👟", who: "kid_c", slot: "evening", order: 2 }),
  c_log: K({ label: "Pajamas on", emoji: "👕", who: "kid_c", slot: "evening", order: 3 }),
  c_from: K({ label: "Lights off", emoji: "💡", who: "kid_c", slot: "evening", from: "2026-12-10", order: 4 }),
  c_none: K({ label: "Brush hair", emoji: "🪮", who: "kid_c", slot: "evening", order: 5 }),
  c_w0: K({ label: "Wash face", emoji: "🧼", who: "kid_c", slot: "evening", order: 7 }),
  c_cal: K({ label: "Toys away", emoji: "🧸", who: "kid_c", slot: "chores", area: "cleaning", order: 6 }),
  d_teeth: K({ label: "Brush teeth", emoji: "🪥", who: "kid_d", slot: "morning", order: 0 })
});
const day0 = new Date(2026, 11, 5), dOf = n => new Date(2026, 11, 5 + n), isoN = n => { const d = dOf(n); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
const nOf = iso => Math.round((new Date(iso + "T12:00:00") - new Date(2026, 11, 5, 12)) / 864e5);
const go = (w, n, h, mi) => { const d = dOf(n); return w.at(d.getFullYear(), d.getMonth() + 1, d.getDate(), h, mi || 0); };
const CAP = "globalThis.__pop='';document.body.insertAdjacentHTML=function(p,h){ globalThis.__pop=h; };globalThis.__toast=[];gwShowToast=function(m){ __toast.push(m); };tab='moms-plan';1";
async function mkWorld(index, hjs, rules) {
  const meta = { takeover: 1, engine: { mode: "preview", on: "2026-11-09" } }; if (rules) meta.starRules = rules;
  const w = await W.world({ index, household: { jobs: FAM(), people: clone(W.PEOPLE), meta }, tree: { config: clone(W.FX.db.config) } });
  const A = w.boot("A", "devA", { mom: true }), B = w.boot("B", "devB"), Dd = w.boot("D", "devD"), Kk = w.boot("Kk", "devK");
  Dd.run("HA_LS.setItem('ha_kiosk','dad');1"); Kk.run("HA_LS.setItem('ha_kiosk','routines');1");
  for (const d of [A, B, Dd, Kk]) d.run(CAP);
  await w.flush(); for (const d of [A, Dd, Kk]) d.run(hjs); return { w, A, B, Dd, Kk, hjs };
}
const idxOf = (d, slot, kid, label) => d.run("(function(){ const d0=day; day=_todayDay; try{ return (rtStepsFor(" + J(slot) + "," + J(kid) + ",false,day)||[]).findIndex(function(x){ return x&&x.label===" + J(label) + "; }); } finally{ day=d0; } })()");
// a kid's lists as a screen draws them (Kids' Corner ▸ 📋 Chores: the lists the day has, kcChoresHTML's own loop); skip = lists left undrawn
const drawKid = (d, kid, skip) => d.run("(function(){ const d0=day; day=_todayDay; try{ rtOpen={}; let h=''; activeSlots().forEach(function(s){ if(" + J(skip || []) + ".indexOf(s)>=0) return; h+=s==='morning'?mrIndividualHTML(" + J(kid) + "):rtSlotHTML(s," + J(kid) + "); }); return h; } finally{ day=d0; } })()");
const KIDS = ["kid_a", "kid_b", "kid_c", "kid_d"];
const drawAll = (d, skipA) => KIDS.map(k => drawKid(d, k, k === "kid_a" ? skipA : null)).join("");
const LG = (d, js) => d.run("(function(){ __pop=''; " + js + "; return __pop; })()");
const txt = h => String(h || "").replace(/<[^>]+>/g, " ").replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
const ROWSPLIT = '<div style="display:flex;flex-wrap:wrap;align-items:baseline;gap:2px 8px;padding:5px 2px;';
const rowsRaw = h => String(h).split(ROWSPLIT).slice(1).map(r => '<div ' + r.split("</div>")[0]);
const rowOf = (h, name) => rowsRaw(h).filter(r => r.indexOf(name) >= 0)[0] || "";
const top = h => txt((/<div style="font-size:13\.5px;padding:6px 2px 2px">([\s\S]*?)<\/div>/.exec(h) || ["", ""])[1]);
const root = w => w.db.tree.root;
const adj = (w, kid) => (((root(w).bank || {})[kid] || {}).adjustments) || {};
const czLines = (w, kid) => Object.entries(adj(w, kid)).filter(([id]) => /^czero_/.test(id)).map(([id, a]) => Object.assign({ id }, a));
// every C6 log line: {kid, wk, dn, key, rec}
const zLines = w => { const out = []; Object.entries(root(w).routineLog || {}).forEach(([kid, L]) => Object.entries(L || {}).forEach(([wk, Wk]) => Object.entries(Wk || {}).forEach(([dn, D]) => Object.entries(D || {}).forEach(([k, r]) => { if (/^zero_/.test(k)) out.push({ kid, wk, dn, key: k, rec: r }); })))); return out; };
const bal = (d, kid) => d.run("bankBalance(" + J(kid) + ")");
const writes = (w, m) => w.since(m).filter(e => !/^(get|once|on|read)/.test(String(e.op || "")) && !/^(connDiary|settings\/codeVersion|regen_lock|week\d+\/tasks)/.test(String(e.path || "")));
const WS = (w, m) => writes(w, m).map(e => e.op + " " + e.path + (e.keys ? " [" + e.keys.join(",") + "]" : "") + (e.op === "tx" ? (e.committed ? " ✓" : " ✗") : ""));
const noTs = x => JSON.parse(J(x), (k, v) => (k === "ts" || k === "at" || k === "iso") ? "·" : v);
const canon = x => JSON.stringify(x, (k, v) => (v && typeof v === "object" && !Array.isArray(v)) ? Object.keys(v).sort().reduce((o, q) => { o[q] = v[q]; return o; }, {}) : v);
// the tree without C6's own data: zero_ log lines, czero_ bank lines, starRules/zero, and the connection diary
const noC6 = t => { t = noTs(t); Object.values(t.routineLog || {}).forEach(K1 => Object.values(K1 || {}).forEach(W1 => Object.values(W1 || {}).forEach(D1 => { Object.keys(D1 || {}).forEach(k => { if (/^zero_/.test(k)) delete D1[k]; }); })));
  Object.values(t.bank || {}).forEach(b => { if (b && b.adjustments) Object.keys(b.adjustments).forEach(id => { if (/^czero_/.test(id)) delete b.adjustments[id]; }); });
  const R = ((t.household || {}).meta || {}).starRules; if (R) delete R.zero; delete t.connDiary; delete t.settings;
  return canon(JSON.parse(J(t), (k, v) => (v && typeof v === "object" && !Array.isArray(v) && !Object.keys(v).length) ? undefined : v)); };
const ddiff = (a, b, p) => { p = p || ""; if (J(a) === J(b)) return []; if (!a || !b || typeof a !== "object" || typeof b !== "object") return [p + ": " + String(J(a)).slice(0, 140) + " ≠ " + String(J(b)).slice(0, 140)]; return [...new Set([...Object.keys(a), ...Object.keys(b)])].flatMap(k => ddiff(a[k], b[k], p + "/" + k)).slice(0, 8); };
const pill = (h, label) => { const r = h.split('<div class="mr-step').filter(x => x.indexOf(label + "<") >= 0 || x.indexOf(label + " <") >= 0)[0] || ""; return (r.match(/<span class="mr-pts">.*?⭐<\/span>/) || [""])[0]; };
// the run behind each day's line, per kid and chore: {iso: run} (n:1 lines) and {iso: why} (n:0 lines)
const DN = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const runs = (w, d, kid, label) => { const o = {}; zLines(w).filter(z => z.kid === kid && z.rec.label.indexOf(label + " — not done ") === 0).forEach(z => { o[z.wk + "/" + z.dn] = z.rec.zero.n ? z.rec.zero.run : "0:" + z.rec.zero.why; }); return o; };
const S = { dump: {}, wk: {} };
const key = n => S.wk[n] + "/" + DN[dOf(n).getDay()];
const exp = o => { const r = {}; Object.keys(o).forEach(iso => { r[key(nOf(iso))] = o[iso]; }); return r; };

(async () => {
const X = await mkWorld(IDX, HJS), BW = await mkWorld(BASE_IDX, BASE_HJS);
const { w, A, B, Dd, Kk } = X;

console.log("\n── A · the functions ──");
ok("RT_ZERO_FROM is \"2026-12-07\", one constant", A.run("RT_ZERO_FROM") === "2026-12-07" && (fs.readFileSync(IDX, "utf8").match(/RT_ZERO_FROM="/g) || []).length === 1);
const row = o => J(Object.assign({ label: "x", cad: "daily" }, o));
ok("rtDailyRow(st,1): a 0 ⭐ daily on a kid's list; not a paying daily, a weekly, a plan row, a laundry-line row, a rotating job", A.run("rtDailyRow(" + row({}) + ",1)") === true && A.run("rtDailyRow(" + row({ pts: 0 }) + ",1)") === true && A.run("rtDailyRow(" + row({ pts: 5 }) + ",1)") === false && A.run("rtDailyRow(" + row({ cad: "wk:1" }) + ",1)") === false && A.run("rtDailyRow(" + row({ house: "h1" }) + ",1)") === false && A.run("rtDailyRow(" + row({ line: 1 }) + ",1)") === false && A.run("rtDailyRow(" + row({ laundry: true }) + ",1)") === false && A.run("rtDailyRow(" + row({ rot: "pick" }) + ",1)") === false);
ok("…and C5's own reading is unchanged: rtDailyRow(st) = a PAYING daily only", A.run("rtDailyRow(" + row({ pts: 5 }) + ")") === true && A.run("rtDailyRow(" + row({}) + ")") === false && A.run("rtDailyRow(" + row({ pts: 5, rot: "x" }) + ")") === false);
ok("the ⚙ setting's default (nothing stored): Stops after 5", A.run("rtZeroStop()") === true && A.run("J=JSON.stringify(starRules().zero||null)") === "null");
ok("the chore's key: its table id (Take over) or rt_<list>_<kid>_<words>", A.run("rtZeroKey('evening','kid_a'," + row({ _hh: "a_floss" }) + ")") === "a_floss" && A.run("rtZeroKey('evening','kid_a'," + row({ label: "Floss teeth!" }) + ")") === "rt_evening_kid_a_floss_teeth");

// ── the replay ──
const T = {};   // per day: notes
for (let n = 0; n <= 16; n++) {
  const iso = isoN(n), dow = dOf(n).getDay();   // 0 = Sunday
  for (const V of [X, BW]) {
    const { w, A, B, Dd, Kk } = V, isX = V === X;
    await go(w, n, 6);
    // Mom's / Dad's taps before anyone draws (the same on both, where the app before has them)
    if (iso === "2026-12-10") A.run("lgRuleTake('kid_b')");                     // Take stars away Off for kid_b (Thu)
    if (iso === "2026-12-12") A.run("lgRuleTake('kid_b')");                     // …On again (Sat): it starts clean
    if (iso === "2026-12-15" && isX) { const m = w.mark(); T.flip1 = { r: A.run("lgRuleZero(0)") }; await w.flush(); T.flip1.ws = WS(w, m); T.flip1.v = w.get("household/meta/starRules/zero"); T.flip1.again = A.run("lgRuleZero(0)"); }
    if (iso === "2026-12-17" && isX) { Dd.run("dadUnlocked=true;1"); const m = w.mark(); T.flip2 = { r: Dd.run("lgRuleZero(5)") }; await w.flush(); T.flip2.ws = WS(w, m); T.flip2.v = w.get("household/meta/starRules/zero"); Dd.run("dadUnlocked=false;1"); }
    if (iso === "2026-12-18") A.run("lgRulePause()");                            // ⏸ Pause On (Fri)
    if (iso === "2026-12-19") A.run("lgRulePause()");                            // …Off (Sat): it starts clean
    if (iso === "2026-12-12") A.run("(function(){ day=_todayDay; rtWave('evening','kid_c','saturday'," + idxOf(A, "evening", "kid_c", "Wash face") + "); })()");   // ✕ today before any draw
    if (iso === "2026-12-07") { const b = A.run("bankBalance('kid_d')"); if (b) A.run("bankGiveDock('kid_d',-1," + b + ",'(a test) start at 0')"); }
    await w.flush();
    if (!isX && ["2026-12-11", "2026-12-12", "2026-12-13"].indexOf(iso) >= 0) { const t = w.boot("T" + iso, "devT" + iso); t.run(CAP); await w.flush(); w.devs.splice(w.devs.indexOf(t), 1); }   // the app before boots a device at the same moments
    // the server first (E): a device that has not heard from the server yet takes nothing
    if (iso === "2026-12-12" && isX) {
      const G = w.boot("G", "devG"); G.run(CAP); await w.flush();
      G.run("globalThis.__hold=[];(function(){ const r0=db.ref; db.ref=function(p){ const r=r0.call(db,p), o=r.once; r.once=function(e){ return new Promise(function(res){ __hold.push(function(){ res(o.call(r,e)); }); }); }; return r; }; })();1");
      const m = w.mark(); drawKid(G, "kid_a"); drawKid(G, "kid_a"); await w.flush();
      T.gate1 = { ws: WS(w, m), held: G.run("__hold.length") };
      const m2 = w.mark(); G.run("__hold.splice(0).forEach(function(f){ f(); });1"); await w.flush();
      T.gate1.after = WS(w, m2); w.devs.splice(w.devs.indexOf(G), 1);
    }
    if (iso === "2026-12-11" && isX) {   // Floss was ticked yesterday (Thu); this device's copy of the ticks and the log has not caught up
      const G = w.boot("G2", "devG2"); G.run(CAP); await w.flush();
      const fi = idxOf(G, "evening", "kid_a", "Floss"), k = S.wk[5] + "_thursday_kid_a_estep" + fi;
      G.run("globalThis.__k=" + J(k) + ";globalThis.__keep=slState[__k];delete slState[__k];globalThis.__lk=routineLog.kid_a;routineLog.kid_a={};1");
      const st = "rtStepsFor('evening','kid_a',false,_todayDay)[" + fi + "]";
      T.gate2 = { had: G.run("!!(__keep&&__keep.done)"), stale: G.run("rtZeroRun('evening','kid_a'," + fi + "," + st + ")") };
      G.run("globalThis.__hold=[];(function(){ const r0=db.ref; db.ref=function(p){ const r=r0.call(db,p), o=r.once; r.once=function(e){ return new Promise(function(res){ __hold.push(function(){ res(o.call(r,e)); }); }); }; return r; }; })();1");
      const m = w.mark(); drawKid(G, "kid_a"); drawKid(G, "kid_a"); await w.flush();
      T.gate2.ws = WS(w, m).filter(x => /zero/.test(x)); T.gate2.held = G.run("__hold.length");   // nothing at all while it waits
      const m2 = w.mark(); G.run("slState[__k]=__keep;routineLog.kid_a=__lk;__hold.splice(0).forEach(function(f){ f(); });1"); await w.flush();   // the server's answer: its listeners first, then once()
      T.gate2.after = WS(w, m2).filter(x => /zero_a_floss|czero_\w+_a_floss/.test(x)); T.gate2.n = G.run("rtZeroRun('evening','kid_a'," + fi + "," + st + ")"); w.devs.splice(w.devs.indexOf(G), 1);
    }
    // dry-run (K): a device with ?dryrun=1 notices first and writes nothing
    if (iso === "2026-12-13" && isX) {
      const Dr = w.boot("Dr", "devDr"); Dr.run(CAP); Dr.run("HA_LS.setItem('ha_dryrun','1');1"); await w.flush();
      const m = w.mark(); drawKid(Dr, "kid_d"); await w.flush(); drawKid(Dr, "kid_d"); await w.flush();
      T.dry = { ws: WS(w, m), local: Dr.run("Object.keys((bank.kid_d||{}).adjustments||{}).filter(function(k){ return /^czero_/.test(k); }).length"), srv: czLines(w, "kid_d").length, z: !!Dr.run("!!(((routineLog.kid_d||{})[activeWk()]||{}).sunday||{}).zero_d_teeth") };
      S.Dr = Dr; w.devs.splice(w.devs.indexOf(Dr), 1);
    }
    // the day's draws: Mom's device and a plain device (both draw everything but kid_a's Evening list on Wed 12/16), the kid's tablet 10×
    const skip = iso === "2026-12-16" ? ["evening"] : null;
    await go(w, n, 7); drawAll(A, skip); drawAll(B, skip); await w.flush();
    for (let r = 0; r < (iso === "2026-12-09" || iso === "2026-12-10" ? 10 : 1); r++) drawAll(Kk, skip);
    await w.flush(); drawAll(B, skip); await w.flush();   // a second look (Sunday: last week's ticks have landed)
    // the ticks (the same on both)
    await go(w, n, 8);
    const tickM = (d, kid, label) => { const i = idxOf(d, "morning", kid, label); d.run("(function(){ day=_todayDay; toggleMorningStep(" + J(kid) + "," + i + "); })()"); };
    const tickE = (d, kid, slot, label) => { const i = idxOf(d, slot, kid, label); d.run("(function(){ day=_todayDay; toggleRtStep(" + J(slot) + "," + J(kid) + "," + i + "); })()"); };
    tickM(B, "kid_b", "Feed the cat");
    if (iso === "2026-12-18") tickM(B, "kid_a", "Brush teeth");
    if (iso === "2026-12-12") tickE(B, "kid_a", "chores", "Make the bed");
    if (iso === "2026-12-08") tickE(B, "kid_a", "chores", "Vacuum the den");
    if (iso === "2026-12-10") {   // kid_c's not-a-miss day (and kid_d's Kid Off, set Wednesday night)
      A.run("(function(){ day=_todayDay; rtWave('evening','kid_c','thursday'," + idxOf(A, "evening", "kid_c", "Wipe the sink") + "); })()");   // ✕ today
      A.run("db.ref('routineLog/kid_c/'+activeWk()+'/thursday/zz_log').set({label:'Pajamas on',slot:'evening',act:'on',ts:'8:00 AM',at:Date.now(),pts:0});1");   // its place moved: the day's log says ticked
    }
    await w.flush();
    await go(w, n, 20);
    if (iso === "2026-12-08" || iso === "2026-12-10") tickE(B, "kid_a", "evening", "Floss");
    if (iso === "2026-12-10") A.run("(function(){ day=_todayDay; amSend('evening','kid_c','thursday'," + idxOf(A, "evening", "kid_c", "Shoes away") + "); })()");   // 🌅 sent
    if (iso === "2026-12-09") { A.run("db.ref('calendar/kidOverrides/kid_d/2026-12-10').set({school:false});1"); A.run("db.ref('calendar/vacations/v_t').set({name:'A day out',start:'2026-12-10',end:'2026-12-10',pause:'chores'});1"); }
    await w.flush();
  }
  S.wk[n] = A.run("activeWk()");
  // ── per-day checks and taps (this tree only, then the same tap on the app before where it has one) ──
  if (iso === "2026-12-13") { const Dr = S.Dr; Dr.run(HJS); const a = "'kid_d'," + J(S.wk[n]) + ",'sunday','morning'," + idxOf(A, "morning", "kid_d", "Brush teeth");
    const m = w.mark(); Dr.run("momHere=function(){ return true; };1"); const r = [Dr.run("lgZeroGive(" + a + ")"), Dr.run("lgZeroUndo(" + a + ")"), Dr.run("lgRuleZero(0)")]; await w.flush(); T.dryTap = { r, ws: WS(w, m) }; }
  if (iso === "2026-12-17") {   // Brush teeth's run is 10 (stopped); a walk that cannot see last week must say "unsure", never a shorter run
    const ti = idxOf(A, "morning", "kid_a", "Brush teeth"), st = "rtStepsFor('morning','kid_a',false,_todayDay)[" + ti + "]";
    T.unsure = { full: A.run("rtDailyMissed('morning','kid_a'," + ti + "," + st + ",1)") };
    T.unsure.sl = A.run("(function(){ const a=prevSlState, b=_prevSlWk, c=_loadPrevSl; prevSlState=null; _prevSlWk=null; _loadPrevSl=function(){}; try{ return [rtDailyMissed('morning','kid_a'," + ti + "," + st + ",1),rtZeroRun('morning','kid_a'," + ti + "," + st + ")]; } finally{ prevSlState=a; _prevSlWk=b; _loadPrevSl=c; } })()");
    T.unsure.log = A.run("(function(){ const k=_rlWin.key, p=_prevWkKey(), L=routineLog.kid_a[p]; _rlWin.key=activeWk()+'|'+k.split('|')[1]; delete routineLog.kid_a[p]; try{ return [rtDailyMissed('morning','kid_a'," + ti + "," + st + ",1),rtZeroRun('morning','kid_a'," + ti + "," + st + ")]; } finally{ _rlWin.key=k; if(L) routineLog.kid_a[p]=L; } })()");
  }
  if (iso === "2026-12-09") {
    console.log("\n── H · the 📒 Ledger (Wed 12/9) ──");
    const pop = LG(A, "lgGo('kid_a',0,0)"); S.dump.ledgerWed = pop;
    const r = txt(rowOf(pop, "Brush teeth"));
    ok("H · kid_a's Morning row: \"○ 🦷 Brush teeth not done yet · −1 ⭐ this morning: not done 2 days in a row\" with ➖ Excuse and ⭐ Give stars back", /^○ 🦷 Brush teeth not done yet · −1 ⭐ this morning: not done 2 days in a row ➖ Excuse ⭐ Give stars back$/.test(r), r);
    ok("…the day's line counts it: \"… · taken 1 ⭐ · …\"", /· taken 1 ⭐/.test(top(pop)), top(pop));
    const BWpop = LG(BW.A, "lgGo('kid_a',0,0)");
    ok("…the app before draws the same row without those words and that button (the only difference)", txt(rowOf(BWpop, "Brush teeth")) === r.replace(" · −1 ⭐ this morning: not done 2 days in a row", "").replace(" ⭐ Give stars back", ""), [txt(rowOf(BWpop, "Brush teeth")), r]);
    const kidRow = drawKid(B, "kid_a").split('<div class="mr-step').filter(x => x.indexOf("Brush teeth") >= 0)[0] || "";
    ok("H · the kid's own row stays a plain row: no star, no words", kidRow.length > 0 && !/⭐|not done|−1/.test(txt(kidRow)) && kidRow === (drawKid(BW.B, "kid_a").split('<div class="mr-step').filter(x => x.indexOf("Brush teeth") >= 0)[0] || ""), txt(kidRow));
    const L = czLines(w, "kid_a")[0], lk = "routineLog/kid_a/" + S.wk[n] + "/wednesday/zero_a_teeth";
    S.teethWed = clone(L); S.teethWedLog = clone(w.get(lk));
    const kb = B.run("_bankCardHTML('kid_a',false)"); S.dump.bankA = kb;
    const st = txt(kb.split('<div class="bs-row">').filter(x => x.indexOf("Brush teeth") >= 0)[0] || "");
    ok("H · the kid's Star Bank: \"Dec 9 ➖ 🦷 Brush teeth · not done 2 days −1 ⭐ <balance>\" — no \"late\"", /^Dec 9 ➖ 🦷 Brush teeth · not done 2 days −1 ⭐ -?[\d,]+ ⭐$/.test(st) && !/late/i.test(st), st);
    const args = "'kid_a'," + J(S.wk[n]) + ",'wednesday','morning'," + idxOf(A, "morning", "kid_a", "Brush teeth");
    let m = w.mark(); const rk = Kk.run("lgZeroGive(" + args + ")"); await w.flush();
    ok("H · a kid's device (Kids' Corner): lgZeroGive refused, nothing written", rk === false && writes(w, m).length === 0);
    const b0 = bal(B, "kid_a"); m = w.mark(); const g1 = A.run("lgZeroGive(" + args + ")"); await w.flush();
    ok("H · ⭐ Give stars back (Mom): ONE update — the bank line removed, zero.gb = {by:\"mom\", ts, at, line} on the day's line", g1 === true && J(WS(w, m)) === J(["update  [" + lk + "/zero/gb,bank/kid_a/adjustments/" + L.id + "]"]) && w.get("bank/kid_a/adjustments/" + L.id) == null && w.get(lk + "/zero/gb/by") === "mom" && J(w.get(lk + "/zero/gb/line")) === J((({ id, ...x }) => x)(L)), WS(w, m));
    ok("…her balance +1 exactly, on every device", bal(B, "kid_a") === b0 + 1 && bal(Kk, "kid_a") === b0 + 1);
    const p2 = LG(A, "lgGo('kid_a',0,0)");
    ok("…the row: \"… not done 2 days in a row ➖ Excuse ⭐ Mom gave back +1 ⭐ Undo\"; the day's line no longer counts it", /−1 ⭐ this morning: not done 2 days in a row ➖ Excuse ⭐ Mom gave back \+1 ⭐ Undo$/.test(txt(rowOf(p2, "Brush teeth"))) && !/taken/.test(top(p2)), [txt(rowOf(p2, "Brush teeth")), top(p2)]);
    m = w.mark(); for (let r2 = 0; r2 < 10; r2++) { drawAll(B); drawAll(Kk); } const R3 = w.boot("R3", "devR3"); R3.run(CAP); await w.flush(); drawAll(R3); await w.flush(); drawAll(R3); { const t = BW.w.boot("R3", "devR3"); t.run(CAP); await BW.w.flush(); BW.w.devs.splice(BW.w.devs.indexOf(t), 1); }
    A.run("lgRuleZero(0)"); await w.flush(); drawAll(B); await w.flush(); A.run("lgRuleZero(5)"); await w.flush(); drawAll(B); await w.flush();
    ok("…no device takes it again: 10 redraws, a fresh device, the ⚙ setting flipped to \"No stop\" and back — no bank line, the gb mark kept", w.get("bank/kid_a/adjustments/" + L.id) == null && !!w.get(lk + "/zero/gb") && !WS(w, m).some(x => /czero_|\/zero_|^tx /.test(x)), WS(w, m).filter(x => /zero/.test(x)));
    w.devs.splice(w.devs.indexOf(R3), 1);
    ok("…a second tap: refused, nothing written", (() => { const m3 = w.mark(); return A.run("lgZeroGive(" + args + ")") === false && writes(w, m3).length === 0; })());
    m = w.mark(); const u1 = A.run("lgZeroUndo(" + args + ")"); await w.flush();
    ok("H · Undo: ONE update — that exact line back (byte for byte), the gb mark removed; the balance back", u1 === true && writes(w, m).length === 1 && J(w.get("bank/kid_a/adjustments/" + L.id)) === J((({ id, ...x }) => x)(L)) && w.get(lk + "/zero/gb") == null && bal(B, "kid_a") === b0, WS(w, m));
    ok("…the day's line is the one filed this morning again (byte for byte)", J(w.get(lk)) === J(S.teethWedLog));
    const cl = txt(A.run("chSettingsClickoffLogHTML()"));
    ok("H · the Click-off Log tab (Mom): \"↩ Brush teeth — not done 2 days −1 ⭐\"", /↩ Brush teeth — not done 2 days −1 ⭐ Morning/.test(cl), cl.slice(0, 300));
    ok("…the app before's log has no such line (C6's lines are its only difference there)", !/not done 2 days/.test(txt(BW.A.run("chSettingsClickoffLogHTML()"))));
  }
  if (iso === "2026-12-10") {
    console.log("\n── H · ➖ Excuse, Dad (Thu 12/10) ──");
    const ci = idxOf(A, "evening", "kid_c", "Rinse the cup"), lk = "routineLog/kid_c/" + S.wk[n] + "/thursday/zero_c_ex", L = czLines(w, "kid_c").filter(a => a.day === "thursday" && /Rinse the cup/.test(a.note))[0];
    const log0 = clone(w.get(lk)), b0 = bal(B, "kid_c"), xargs = "'kid_c'," + J(S.wk[n]) + ",'thursday','evening'," + ci;
    let m = w.mark(); const e1 = A.run("lgExcuse(" + xargs + ")"); await w.flush(); BW.A.run("lgExcuse(" + xargs + ")"); await BW.w.flush();
    ok("H · ➖ Excuse on kid_c's \"Rinse the cup\" row (Thu): the ✕ record, and that day's −1 given back (bank line removed, gb.x on the day's line); +1", e1 === true && !!w.get("waved/" + S.wk[n] + "/thursday/kid_c/eveningstep" + ci) && !!L && w.get("bank/kid_c/adjustments/" + L.id) == null && w.get(lk + "/zero/gb/x") === 1 && bal(B, "kid_c") === b0 + 1, WS(w, m));
    const pr = txt(rowOf(LG(A, "lgGo('kid_c',0,0)"), "Rinse the cup"));
    ok("…the row: \"➖ 🥤 Rinse the cup excused (✕ today) · −1 ⭐ this morning: not done 3 days in a row, given back Undo\"", /^➖ 🥤 Rinse the cup excused \(✕ today\) · −1 ⭐ this morning: not done 3 days in a row, given back Undo$/.test(pr), pr);
    m = w.mark(); for (let r = 0; r < 5; r++) drawAll(B); await w.flush();
    ok("…while excused no device files it again: no write", writes(w, m).length === 0, WS(w, m));
    m = w.mark(); const e2 = A.run("lgExcuseUndo(" + xargs + ")"); await w.flush(); BW.A.run("lgExcuseUndo(" + xargs + ")"); await BW.w.flush();
    ok("H · Excuse's Undo: the bank line back byte for byte, the day's line exactly as filed, the ✕ record gone; −1 again", e2 === true && J(w.get("bank/kid_c/adjustments/" + L.id)) === J((({ id, ...x }) => x)(L)) && J(w.get(lk)) === J(log0) && !w.get("waved/" + S.wk[n] + "/thursday/kid_c/eveningstep" + ci) && bal(B, "kid_c") === b0, WS(w, m));
    m = w.mark(); drawAll(B); await w.flush();
    ok("…then: draws write nothing", writes(w, m).length === 0, WS(w, m));
    A.run("lgExcuse(" + xargs + ")"); await w.flush(); BW.A.run("lgExcuse(" + xargs + ")"); await BW.w.flush();   // and excused for good (its case below)
    // Dad
    const ti = idxOf(A, "morning", "kid_a", "Brush teeth"), dargs = "'kid_a'," + J(S.wk[n]) + ",'thursday','morning'," + ti, dl = "routineLog/kid_a/" + S.wk[n] + "/thursday/zero_a_teeth";
    Dd.run("dadUnlocked=false;1"); const rL = LG(Dd, "lgGo('kid_a',0,0)"), bL = bal(B, "kid_a");
    ok("H · Dad's link LOCKED: the row reads \"… −1 ⭐ this morning: not done 3 days in a row\" with no ⭐ Give stars back button", /−1 ⭐ this morning: not done 3 days in a row$/.test(txt(rowOf(rL, "Brush teeth"))) && !/lgZeroGive|Give stars back/.test(rowOf(rL, "Brush teeth")), txt(rowOf(rL, "Brush teeth")));
    m = w.mark(); const gL = Dd.run("lgZeroGive(" + dargs + ")"); await w.flush();
    ok("…a tap anyway is refused: zero writes, the balance unchanged", gL === false && writes(w, m).length === 0 && bal(B, "kid_a") === bL, WS(w, m));
    const Nd = w.boot("Nd", "devNd"); Nd.run(CAP); await w.flush(); { const t = BW.w.boot("Nd", "devNd"); t.run(CAP); await BW.w.flush(); BW.w.devs.splice(BW.w.devs.indexOf(t), 1); } Nd.run(HJS); Nd.run("dadUnlocked=true;1"); Kk.run("dadUnlocked=true;1");
    m = w.mark(); const nds = [Nd, Kk].map(d => [LG(d, "lgShow();lgGo('kid_a',0,0)"), d.run("lgZeroGive(" + dargs + ")")]); await w.flush();
    ok("H · Dad's code typed on a device NOT on his link (a kid's tablet, a plain device): no button, the tap refused, zero writes", nds.every(([h, r]) => !/lgZeroGive|Give stars back/.test(h) && r === false) && writes(w, m).length === 0, WS(w, m));
    Nd.run("dadUnlocked=false;1"); Kk.run("dadUnlocked=false;1"); w.devs.splice(w.devs.indexOf(Nd), 1);
    Dd.run("dadUnlocked=true;1"); m = w.mark(); const gd = Dd.run("lgZeroGive(" + dargs + ")"); await w.flush();
    const rD = txt(rowOf(LG(Dd, "lgGo('kid_a',0,0)"), "Brush teeth"));
    ok("H · Dad's link UNLOCKED: Give stars back works, marked by:\"dad\"; the row says \"⭐ Dad gave back +1 ⭐ Undo\"", gd === true && w.get(dl + "/zero/gb/by") === "dad" && bal(B, "kid_a") === bL + 1 && /⭐ Dad gave back \+1 ⭐ Undo$/.test(rD), rD);
    m = w.mark(); const ud = Dd.run("lgZeroUndo(" + dargs + ")"); await w.flush();
    ok("…and his Undo puts it back (one write)", ud === true && w.get(dl + "/zero/gb") == null && bal(B, "kid_a") === bL && writes(w, m).length === 1, WS(w, m));
    Dd.run("dadUnlocked=false;1");
  }
}

console.log("\n── T · the §2.8 table ──");
const R = (kid, label) => runs(w, A, kid, label);
ok("T · kid_a 🦷 Brush teeth, never done from Mon 12/7, \"Stops after 5\": Mon 0 · Tue 0 · Wed −1 · Thu −1 · Fri −1 · Sat −1 · Sun −1 · Mon nothing (the run is 7)", J(Object.keys(R("kid_a", "Brush teeth")).filter(k => [2, 3, 4, 5, 6, 7, 8, 9].map(key).indexOf(k) >= 0).sort()) === J([4, 5, 6, 7, 8].map(key).sort()) && J([4, 5, 6, 7, 8].map(n => R("kid_a", "Brush teeth")[key(n)])) === J([2, 3, 4, 5, 6]), R("kid_a", "Brush teeth"));
ok("…the whole run of lines: Wed–Sun (2…6), Tue 12/15 and Wed 12/16 under \"No stop\" (8, 9), nothing Thu 12/17 once \"Stops after 5\" is back (10); ticked Fri 12/18, so Sat nothing", canon(R("kid_a", "Brush teeth")) === canon(exp({ "2026-12-09": 2, "2026-12-10": 3, "2026-12-11": 4, "2026-12-12": 5, "2026-12-13": 6, "2026-12-15": 8, "2026-12-16": 9 })), R("kid_a", "Brush teeth"));
ok("T · missed / done / missed / done (Floss Mon 12/7 … Thu 12/10) costs nothing; then never done: Sun −1 · Mon −1 · Tue −1 · (Wed nobody drew) · Thu −1 (run 6) · then stopped", canon(R("kid_a", "Floss")) === canon(exp({ "2026-12-13": 2, "2026-12-14": 3, "2026-12-15": 4, "2026-12-17": 6 })), R("kid_a", "Floss"));
ok("T · every line's words: \"<chore> — not done <run> days\" on the log, \"<emoji> <chore> · not done <run> days\" −1 src \"zero\" in the bank, at czero_<wk>_<day>_<kid>_<chore id>", zLines(w).filter(z => z.rec.zero.n).every(z => { const a = adj(w, z.kid)[z.rec.zero.bid]; return z.rec.act === "zero" && z.rec.pts === 0 && z.rec.zero.bid === "czero_" + z.wk + "_" + z.dn + "_" + z.kid + "_" + z.rec.zero.job && z.key === "zero_" + z.rec.zero.job && (!a || (a.amount === -1 && a.src === "zero" && a.wk === z.wk && a.day === z.dn && / · not done \d+ days$/.test(a.note) && a.note.indexOf(" — ") < 0)); }), zLines(w).slice(0, 2));
// "No stop" from the start: its own small world
{
  const NS = await mkWorld(IDX, HJS, { zero: { stop: 0 } });
  for (let n = 0; n <= 14; n++) { await go(NS.w, n, 7); drawAll(NS.B); await NS.w.flush(); drawAll(NS.B); await NS.w.flush(); await go(NS.w, n, 8);
    NS.B.run("(function(){ day=_todayDay; toggleMorningStep('kid_b'," + idxOf(NS.B, "morning", "kid_b", "Feed the cat") + "); })()"); await NS.w.flush(); }
  const r = runs(NS.w, NS.A, "kid_a", "Brush teeth"), want = {}; for (let n = 4; n <= 14; n++) want[key(n)] = n - 2;
  ok("T · \"No stop\": Mon 0 · Tue 0 · then −1 EVERY day, Wed 12/9 … Sat 12/19 (11 lines; the run in the words grows: 2 … 12)", canon(r) === canon(want), r);
  ok("…the kid's bank is 11 lower for it", czLines(NS.w, "kid_a").filter(a => /Brush teeth/.test(a.note)).length === 11);
}

console.log("\n── N · not a miss: the count starts over ──");
const never = { "2026-12-09": 2, "2026-12-10": 3, "2026-12-13": 2, "2026-12-14": 3, "2026-12-15": 4, "2026-12-16": 5, "2026-12-17": 6 };
ok("N · the plain row (Brush hair, never done): Wed −1 … Sun −1 (2…6), then Tue / Wed under \"No stop\" (8, 9) — the reference", canon(R("kid_c", "Brush hair")) === canon(exp({ "2026-12-09": 2, "2026-12-10": 3, "2026-12-11": 4, "2026-12-12": 5, "2026-12-13": 6, "2026-12-15": 8, "2026-12-16": 9 })), R("kid_c", "Brush hair"));
for (const [lab, what] of [["Wipe the sink", "✕ today on Thu"], ["Shoes away", "🌅 sent on Thu"], ["Pajamas on", "Thu's own log says it was ticked (its place had moved)"]])
  ok("N · " + what + ": nothing Fri or Sat (Thu is not a miss), the run counts again from Fri: Sun −1 (2) … Thu 12/17 (6)", canon(R("kid_c", lab)) === canon(exp(never)), [lab, R("kid_c", lab)]);
ok("N · ✕ today on Sat before anyone drew (Wash face): no Sat line though the run was 5; Sun nothing; Mon 1; Tue −1 (2) … Thu (4); ⏸ Fri (n:0)", canon(R("kid_c", "Wash face")) === canon(exp({ "2026-12-09": 2, "2026-12-10": 3, "2026-12-11": 4, "2026-12-15": 2, "2026-12-16": 3, "2026-12-17": 4, "2026-12-18": "0:pause" })), R("kid_c", "Wash face"));
ok("N · ➖ Excuse on Thu (the ledger): the same, and Thu's own −1 given back", canon(R("kid_c", "Rinse the cup")) === canon(exp(never)) && czLines(w, "kid_c").filter(a => /Rinse the cup/.test(a.note) && a.day === "thursday" && a.wk === S.wk[5]).length === 0, R("kid_c", "Rinse the cup"));
ok("N · a row that starts Thu 12/10 (its from): nothing before; Sat 12/12 −1 (2) … Wed 12/16 (6); Thu 12/17 stopped", canon(R("kid_c", "Lights off")) === canon(exp({ "2026-12-12": 2, "2026-12-13": 3, "2026-12-14": 4, "2026-12-15": 5, "2026-12-16": 6 })), R("kid_c", "Lights off"));
ok("N · a vacation day that paused the Chores list (Thu): no Chores list drawn that day, so no Thu line; Fri / Sat nothing; Sun −1 (2) …", canon(R("kid_c", "Toys away")) === canon(exp({ "2026-12-09": 2, "2026-12-13": 2, "2026-12-14": 3, "2026-12-15": 4, "2026-12-16": 5, "2026-12-17": 6 })), R("kid_c", "Toys away"));
ok("N · 😷 Kid Off on Thu (kid_d): Thu's own −1 stands (it was for Tue and Wed); Fri / Sat nothing; Sun −1 (2) …", canon(R("kid_d", "Brush teeth")) === canon(exp(never)), R("kid_d", "Brush teeth"));

console.log("\n── S · Take stars away, ⏸ Pause, before the slate ──");
ok("S · kid_b's towel: Wed 12/9 −1; Take stars away Off Thu / Fri: recorded once, nothing taken (n:0 \"off\"); On again Sat: it starts clean — Sat, Sun nothing, Mon 12/14 −1 (2) … Thu 12/17 (5); ⏸ Fri: recorded, nothing taken (n:0 \"pause\"); Pause off Sat: starts clean, nothing", canon(R("kid_b", "Hang the towel")) === canon(exp({ "2026-12-09": 2, "2026-12-10": "0:off", "2026-12-11": "0:off", "2026-12-14": 2, "2026-12-15": 3, "2026-12-16": 4, "2026-12-17": 5, "2026-12-18": "0:pause" })), R("kid_b", "Hang the towel"));
ok("S · Sun 12/20 and Mon 12/21 (no school week built for them: the lists still hold last week's): no line at all, for anyone", !zLines(w).some(z => (z.wk === S.wk[14] && (z.dn === "sunday" || z.dn === "monday") && z.rec.at >= dOf(15).getTime()) || z.wk !== S.wk[4] && z.wk !== S.wk[14]), zLines(w).filter(z => z.rec.at >= dOf(15).getTime()).map(z => z.kid + " " + z.wk + "/" + z.dn + " " + z.rec.label));
ok("S · the n:0 lines write no bank line", zLines(w).filter(z => !z.rec.zero.n).every(z => !z.rec.zero.bid && !Object.keys(adj(w, z.kid)).some(id => id.indexOf("czero_" + z.wk + "_" + z.dn + "_" + z.kid + "_") === 0 && id.endsWith(z.rec.zero.job))));
ok("S · before RT_ZERO_FROM nothing at all: no line on Sat 12/5 … Tue 12/8, though every 0 ⭐ row was never done", !zLines(w).some(z => [0, 1, 2, 3].map(key).indexOf(z.wk + "/" + z.dn) >= 0));
ok("S · a paying daily never gets a C6 line, nor a weekly chore", !zLines(w).some(z => /Make the bed|Vacuum the den|Feed the cat/.test(z.rec.label)));

console.log("\n── E · exactly once ──");
const txs = w.db.log.filter(e => e.op === "tx" && /\/zero_/.test(e.path)), ok1 = {}; txs.filter(e => e.committed).forEach(e => { ok1[e.path] = (ok1[e.path] || 0) + 1; });
ok("E · two devices drawing every day, a kid's tablet 10× on Wed and Thu: every day's line was committed ONCE (" + Object.keys(ok1).length + " lines, " + txs.length + " tries)", Object.keys(ok1).length === zLines(w).length && Object.values(ok1).every(c => c === 1) && txs.length > zLines(w).length, { lines: zLines(w).length, ok1: Object.values(ok1).filter(c => c !== 1).length });
const bset = w.db.log.filter(e => e.op === "set" && /^bank\/[^/]+\/adjustments\/czero_/.test(e.path)), bc = {}; bset.forEach(e => { bc[e.path] = (bc[e.path] || 0) + 1; });
const devOk = zLines(w).filter(z => z.rec.zero.n).every(z => { const t = txs.filter(e => e.committed && e.path === "routineLog/" + z.kid + "/" + z.wk + "/" + z.dn + "/" + z.key)[0], b = bset.filter(e => e.path === "bank/" + z.kid + "/adjustments/" + z.rec.zero.bid); return t && b.length === 1 && b[0].dev === t.dev; });
ok("E · ONE bank line per kid, chore and day: each czero_ id was set once, by the device whose line committed", Object.values(bc).every(c => c === 1) && Object.keys(bc).length === zLines(w).filter(z => z.rec.zero.n).length && devOk, bc);
ok("E · never through the 📮 outbox: no device's outbox holds a zero line or a czero_ bank line", [A, B, Dd, Kk].every(d => !/zero_|czero_/.test(d.run("HA_LS.getItem('ha_outbox')||''"))));
ok("E · the server first: a device that has not heard back from the server yet (its once() reads held) writes NOTHING, however often it draws", T.gate1 && T.gate1.ws.length === 0 && T.gate1.held >= 7, T.gate1);
ok("…when the server answers, it decides with what it heard and files Saturday's line itself (it was first that day)", T.gate1 && T.gate1.after.some(x => /^tx routineLog\/kid_a\/week\d+\/saturday\/zero_a_teeth ✓$/.test(x)) && T.gate1.after.some(x => /^set bank\/kid_a\/adjustments\/czero_week\d+_saturday_kid_a_a_teeth$/.test(x)), T.gate1);
ok("E · a device whose copy has not caught up (Floss ticked Thu; its copy says not, so it reads 2 days missed) and has not heard from the server: nothing; the server's answer arrives: still nothing (it was done)", T.gate2 && T.gate2.had && T.gate2.stale === 2 && T.gate2.ws.length === 0 && T.gate2.held >= 7 && T.gate2.after.length === 0 && T.gate2.n === 0 && !zLines(w).some(z => z.kid === "kid_a" && z.wk + "/" + z.dn === key(6) && /Floss/.test(z.rec.label)), T.gate2);
ok("E · a walk that reaches last week before last week's ticks are on the device says unsure (−1) and takes nothing — never a shorter run (Thu 12/17: the run is " + (T.unsure && T.unsure.full) + ")", T.unsure && T.unsure.full === 10 && J(T.unsure.sl) === J([-1, 0]), T.unsure);
ok("…the same when last week's Click-off Log is not on the device", T.unsure && J(T.unsure.log) === J([-1, 0]), T.unsure);
ok("K · dry-run (?dryrun=1): its draws write nothing; the line and the −1 show on that device only; the real devices file it as usual", T.dry && T.dry.ws.length === 0 && T.dry.local === T.dry.srv + 1 && T.dry.z && zLines(w).some(z => z.kid === "kid_d" && z.wk + "/" + z.dn === key(8)), T.dry);
ok("K · dry-run: Give stars back, Undo and the setting change that screen only; nothing written", T.dryTap && T.dryTap.r.join() === "true,true,true" && T.dryTap.ws.length === 0, T.dryTap);

console.log("\n── W · a day nobody draws ──");
ok("W · Wed 12/16 nobody drew kid_a's Evening list: no Floss line that day, and Thursday filed only Thursday's (run 6), never Wednesday's", !zLines(w).some(z => z.kid === "kid_a" && /Floss/.test(z.rec.label) && z.wk + "/" + z.dn === key(11)) && R("kid_a", "Floss")[key(12)] === 6);
ok("…her Morning list was drawn that day as usual (Brush teeth's line is there: \"No stop\")", R("kid_a", "Brush teeth")[key(11)] === 9);

console.log("\n── G · below zero ──");
const bd = bal(B, "kid_d");
ok("G · kid_d started Mon 12/7 at 0 ⭐: her balance is now −(her lines): " + bd, bd === -czLines(w, "kid_d").length && bd < 0, [bd, czLines(w, "kid_d").length]);
ok("…her Star Bank shows the minus balance on its last line", /−1 ⭐ -\d+ ⭐/.test(txt(B.run("_bankCardHTML('kid_d',false)"))), txt(B.run("_bankCardHTML('kid_d',false)")).slice(0, 200));

console.log("\n── U · ⚙ the setting ──");
ok("U · Mom's tap \"No stop\" (Tue 12/15): ONE write, household/meta/starRules/zero = {stop:0}; tapping it again writes nothing", T.flip1 && T.flip1.r === true && J(T.flip1.ws) === J(["set household/meta/starRules/zero"]) && J(T.flip1.v) === J({ stop: 0 }) && T.flip1.again === false, T.flip1);
ok("U · Dad (his code in) taps \"Stops after 5\" (Thu 12/17): ONE write, {stop:5, by:\"dad\"}", T.flip2 && T.flip2.r === true && J(T.flip2.ws) === J(["set household/meta/starRules/zero"]) && J(T.flip2.v) === J({ stop: 5, by: "dad" }), T.flip2);
ok("U · a flip never reaches back: Mon 12/14 (run 7, stopped) was never filed after \"No stop\"; Wed 12/16's −1 stayed after \"Stops after 5\"", !R("kid_a", "Brush teeth")[key(9)] && R("kid_a", "Brush teeth")[key(11)] === 9 && czLines(w, "kid_a").some(a => a.wk + "/" + a.day === key(11)));
const pan = LG(A, "lgRulesOpen=true;lgGo('kid_a',0,0)"); S.dump.rules = pan;
ok("U · ⚙ Star rules (Mom): \"A 0 ⭐ daily not done 2 days in a row\" with [Stops after 5 ⭐] pressed and [No stop]", /A 0 ⭐ daily not done 2 days in a row/.test(txt(pan)) && /aria-pressed="true"[^>]*>Stops after 5 ⭐</.test(pan) && /aria-pressed="false"[^>]*>No stop</.test(pan), txt(pan).slice(0, 400));
Dd.run("dadUnlocked=false;1"); const pD = LG(Dd, "lgRulesOpen=true;lgGo('kid_a',0,0)"), kD = LG(Kk, "lgRulesOpen=true;lgGo('kid_a',0,0)");
ok("U · locked Dad's link and a kid's tablet: no setting, and lgRuleZero refused with no write", !/No stop/.test(pD) && !/No stop/.test(kD) && (() => { const m = w.mark(); const r = [Dd.run("lgRuleZero(0)"), Kk.run("lgRuleZero(0)"), B.run("typeof lgRuleZero")]; return r[0] === false && r[1] === false && writes(w, m).length === 0; })());
ok("U · it lives in the ⚙ panel only: no other drawing of the app offers it", (() => { const s = fs.readFileSync(IDX, "utf8") + HJS; return (s.match(/lgRuleZero\(/g) || []).length === 2 && (s.match(/lgZeroSet\(/g) || []).length === 2; })());

console.log("\n── J · nothing else moves ──");
ok("J · the whole database = the app before's, but for C6's own lines (zero_ log lines, czero_ bank lines, the setting)", noC6(root(w)) === noC6(root(BW.w)), ddiff(JSON.parse(noC6(root(w))), JSON.parse(noC6(root(BW.w)))));
const hA = drawKid(B, "kid_a"), hB = drawKid(BW.B, "kid_a");
ok("J · kid_a's lists today (the paying daily, the weekly chore) draw byte for byte as the app before's", hA === hB);
ok("J · C3's drop of the weekly chore: the same line in both (Vacuum the den, Tue 12/15 → dropped)", J(Object.entries(adj(w, "kid_a")).filter(([k]) => /^cdrop_/.test(k)).map(([k, a]) => [k, a.amount, a.note])) === J(Object.entries(adj(BW.w, "kid_a")).filter(([k]) => /^cdrop_/.test(k)).map(([k, a]) => [k, a.amount, a.note])) && Object.keys(adj(w, "kid_a")).some(k => /^cdrop_/.test(k)));
ok("J · the paying daily's tick (Make the bed, Sat 12/12, after 5 missed days) paid the same in both", J(Object.values(adj(w, "kid_a")).filter(a => /Make the bed/.test(a.note || "")).map(a => a.amount)) === J(Object.values(adj(BW.w, "kid_a")).filter(a => /Make the bed/.test(a.note || "")).map(a => a.amount)));

if (process.env.CZERO_DUMP) fs.writeFileSync(process.env.CZERO_DUMP, J(S.dump));
try { fs.unlinkSync(BASE_IDX); } catch (e) {}
console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); try { fs.unlinkSync(BASE_IDX); } catch (x) {} process.exit(1); });
