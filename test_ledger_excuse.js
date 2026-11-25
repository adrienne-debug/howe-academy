/*
 * test_ledger_excuse.js — ➖ Excuse on a 📒 Ledger row and its Undo, slice L3 of DESIGN_chore_ledger_2026-11-21 (§3 "➖ Excuse"; her "go"
 * 2026-11-22). Her rule: "merge in things and not repeat things" — Excuse writes the SAME record ✕ today writes (rtWave: waved/<wk>/<day>/
 * <kid>/<slot>step<i> + the Click-off Log's "— waved by Mom" line; a plan row: houseDay/<iso>/skip/<id> + lastSkip + the same log line),
 * on the chore's OWN day; Undo is the same tap again and removes it. ✕ today in the Kids today pop-ups stays exactly as it is.
 * The WHOLE app runs per device (test_fixtures/house_world.js) on a made-up family (kid_a … kid_d), the clock moved day by day from
 * Mon 11/16 (day 0) to Thu 11/26 (day 10):
 *   kid_a  🌅 Brush teeth (daily, 0 ⭐) · Feed the rabbit (Mon Wed Fri, 15) · Start your laundry (the line's Thursday load)
 *          🧹 Make the bed (daily 2) · Vacuum the den (Tue 10) · Dust the shelves (Wed 10) · Wipe the baseboards (Mon 10) ·
 *             Empty the trash (Mon Wed Fri 5, 3+ a week) · Wash the car (Sun 10)   ·   🌙 Lay out clothes (daily 0)
 *          ☀️ Pick up the den / Pick up the porch (daily 5, 🔄 takes turns with kid_b; not done in week 1, done every day of week 2)
 *   kid_b  🧹 Sweep the porch (Tue 6) · ☀️ the other 🔄 turn   ·   kid_c  🧹 Toys in the bin (daily 3)   ·   kid_d  nothing
 * Week 1: everything on its day but the rabbit on Fri 11/20 (last week's ✖). Week 2: Sun 11/22 the car missed, ticked Mon (8 of 10,
 * L2's ⭐ Give); Mon the baseboards (gone Thu) and the trash (gone Wed) missed; Tue the vacuum missed (⏳ Thu, day 2 of 2, pays 6 of 10);
 * Wed the dust (⏳ Thu, pays 8 of 10), the trash (⏳ Thu, "1 day late", pays 4 of 5), the bed and the rabbit missed; Thu the bed, the
 * clothes and the laundry not done yet. A second world with the plan ON (house_world's own table) for plan rows.
 * Checks: A while nobody taps, every screen, the pop-up (but the L3 buttons) and the database = the app before, every day · B where the
 * button is and is not · C each kind of row: the exact writes, the row before / after, the kid's list, the bank, Undo back byte for byte ·
 * D Excuse = ✕ today's record, write for write · E ✕ today in the Kids today pop-up exactly as before; its record undone from the ledger ·
 * F 📊 How often "not counted" · G turns that cannot be excused; a second tap; the kid's list after · H a kid's device, a kiosk, Dad's
 * link (locked / unlocked) · I dryrun · J L1 and L2 still hold · K rows refused even when called directly · L LEDGERXLOG: a gone turn's
 * "— not done" line out on Excuse and back on Undo (this week, last week, a second device just booted, dryrun, the kid's device) ·
 * P plan rows (plan ON) · Q the laundry row.
 * "The app before" = THIS tree with L3 taken out (no git, no pinned commit): house.js minus the LEDGERX block and its four hooks in
 * LEDGERVIEW, index.html minus rtWave's two extra arguments and the routineLog listener's LEDGERXLOG line (arguments[4] / [5]; each must match exactly once, or the test stops).
 * LGX_INDEX / LGX_HJS = other copies of index.html / house.js (a mutation check). LGX_DUMP = a file for the preview page's drawings.
 * run: node test_ledger_excuse.js
 */
"use strict";
const fs = require("fs"), path = require("path"), os = require("os");
const W = require(path.join(__dirname, "test_fixtures", "house_world.js"));
let pass = 0, fail = 0; const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x).slice(0, 900) + ")" : "")); } };
const J = x => JSON.stringify(x), clone = x => JSON.parse(J(x));
const IDX = process.env.LGX_INDEX || path.join(__dirname, "index.html"), HJS = fs.readFileSync(process.env.LGX_HJS || path.join(__dirname, "house.js"), "utf8");

// ── the app before: this tree, L3 taken out ──
const once = (src, what, from, to, label) => { const n = typeof from === "string" ? src.split(from).length - 1 : (src.match(from) || []).length;
  if (n !== 1) throw new Error("test_ledger_excuse: the app before cannot be built — " + label + " found " + n + "× in " + what + " (must be exactly once)"); return src.replace(from, () => to); };
const noXLog = s => once(s, "index.html", /else delete routineLog\[kid\]\[w\]; if\(typeof _hhLogCache!=="undefined"\) _hhLogCache=null; \}\);   \/\/ LEDGERXLOG[^\n]*/, "else delete routineLog[kid][w]; });", "the routineLog listener's LEDGERXLOG line");
const BASE_IDX = (() => { let s = noXLog(fs.readFileSync(path.join(__dirname, "index.html"), "utf8"));
  s = once(s, "index.html", /^ {2}const wk0=arguments\[4\], st0=arguments\[5\];[^\n]*LEDGERX[^\n]*\n/m, "", "rtWave's two extra arguments");
  s = once(s, "index.html", "const wk=wk0||activeWk(), key=rtWaveKey(slot,i), steps=st0?[]:(", "const wk=activeWk(), key=rtWaveKey(slot,i), steps=(", "rtWave's week");
  s = once(s, "index.html", "st=st0||steps[i]; if(!st) return;", "st=steps[i]; if(!st) return;", "rtWave's row");
  s = once(s, "index.html", "const on=!(wk0?!!(((wavedData[wk]||{})[d]||{})[kid]||{})[key]:rtWaved(slot,kid,d,i));", "const on=!rtWaved(slot,kid,d,i);", "rtWave's on");
  if (/LEDGERX|wk0|st0/.test(s.slice(s.indexOf("// WAVE_START"), s.indexOf("// WAVE_END")))) throw new Error("test_ledger_excuse: the app before still mentions LEDGERX");
  const t = path.join(os.tmpdir(), "ledger_x_before_" + process.pid + ".html"); fs.writeFileSync(t, s); return t; })();
const BASE_HJS = (() => { let s = fs.readFileSync(path.join(__dirname, "house.js"), "utf8");
  s = once(s, "house.js", /^\/\/ LEDGERX_START[^\n]*\n[\s\S]*?^\/\/ LEDGERX_END\n/m, "", "the LEDGERX block");
  s = once(s, "house.js", "let r=lgRow(slot,kid,D,i,st); if(typeof lgXRow===\"function\") r=lgXRow(r,slot,kid,D,i,st);   // ➖ LEDGERX (L3): Excuse / Undo on the row\n        if(!r) return;", "const r=lgRow(slot,kid,D,i,st); if(!r) return;", "the row hook");
  s = once(s, "house.js", "(lgWaved(slot,kid,E,i)&&!(typeof lgXHere===\"function\"&&lgXHere(kid,D,slot,i,E)))) return;   // ➖ LEDGERX: excused here just now → kept in its spot", "lgWaved(slot,kid,E,i)) return;", "the gone hook");
  s = once(s, "house.js", "if(f&&f.gone&&f.gone.k===D.k){ const g={ic:\"✖\",nm:(st.emoji?st.emoji+\" \":\"\")+(st.label||\"Chore\"),id:st.house||st._hh||\"\",note:\"due \"+lgWd(E.iso)+\", not done in time\"}; if(typeof lgXGone===\"function\") lgXGone(g,slot,kid,D,E,i,st); out.gone.push(g); } });",
    "if(f&&f.gone&&f.gone.k===D.k) out.gone.push({ic:\"✖\",nm:(st.emoji?st.emoji+\" \":\"\")+(st.label||\"Chore\"),id:st.house||st._hh||\"\",note:\"due \"+lgWd(E.iso)+\", not done in time\"}); });", "the gone row hook");
  s = once(s, "house.js", "+(r.xH||'')", "", "the drawing hook");
  if (/lgX|LEDGERX|r\.xH/.test(s)) throw new Error("test_ledger_excuse: the app before's house.js still mentions LEDGERX");
  return s; })();
// LEDGERXLOG (the Click-off Log's "— not done" line out on Excuse, back on Undo; her "fix" 2026-11-22): a third world runs this tree with
// only that taken out (the block and its two calls, and index.html's one line in the routineLog listener), so section L can show the
// log as it was before the fix.
const HJS_X0 = (() => { let s = fs.readFileSync(path.join(__dirname, "house.js"), "utf8");
  s = once(s, "house.js", /^\/\/ LEDGERXLOG_START[^\n]*\n[\s\S]*?^\/\/ LEDGERXLOG_END\n/m, "", "the LEDGERXLOG block");
  s = once(s, "house.js", /^ {2}if\(on&&!st\.house\) lgXMissOff\(kid,E,slot,i\);[^\n]*\n/m, "", "the Excuse call");
  s = once(s, "house.js", /^ {2}if\(off&&!st\.house\) lgXMissOn\(kid,E,slot,i,st\);[^\n]*\n/m, "", "the Undo call");
  if (/lgXMiss|LEDGERXLOG/.test(s)) throw new Error("test_ledger_excuse: the tree without LEDGERXLOG still mentions it"); return s; })();
const IDX_X0 = (() => { const s = noXLog(fs.readFileSync(path.join(__dirname, "index.html"), "utf8")); if (/LEDGERXLOG/.test(s)) throw new Error("test_ledger_excuse: index.html without LEDGERXLOG still mentions it");
  const t = path.join(os.tmpdir(), "ledger_x0_" + process.pid + ".html"); fs.writeFileSync(t, s); return t; })();
console.log("(the app before: this tree with LEDGERX taken out of house.js and rtWave's two extra arguments out of index.html)");

const K = o => Object.assign({ src: { kind: "routine" }, status: "active", area: "cleaning", verdict: "", note: "", level: 1, minutes: 5 }, o);
const FAM = () => ({
  a_teeth: K({ label: "Brush teeth", emoji: "🪥", who: "kid_a", slot: "morning", cad: "daily", area: "health", order: 0 }),
  a_rabbit: K({ label: "Feed the rabbit", emoji: "🐇", who: "kid_a", slot: "morning", cad: "wk:0,2,4", pts: 15, area: "animals", order: 1 }),
  a_bed: K({ label: "Make the bed", emoji: "🛏", who: "kid_a", slot: "chores", cad: "daily", pts: 2, order: 1 }),
  a_vac: K({ label: "Vacuum the den", emoji: "🧹", who: "kid_a", slot: "chores", cad: "wk:1", pts: 10, order: 2 }),
  a_dust: K({ label: "Dust the shelves", emoji: "🪶", who: "kid_a", slot: "chores", cad: "wk:2", pts: 10, order: 3 }),
  a_base: K({ label: "Wipe the baseboards", emoji: "🧽", who: "kid_a", slot: "chores", cad: "wk:0", pts: 10, order: 4 }),
  a_trash: K({ label: "Empty the trash", emoji: "🗑", who: "kid_a", slot: "chores", cad: "wk:0,2,4", pts: 5, order: 5 }),
  a_car: K({ label: "Wash the car", emoji: "🚗", who: "kid_a", slot: "chores", cad: "wk:6", pts: 10, order: 6 }),
  a_pick: K({ label: "Pick up the den", emoji: "🧸", who: "kid_a", slot: "afternoon", cad: "daily", area: "pickup", rot: "pick", pts: 5, order: 0 }),   // 🔄 a job that takes turns with kid_b's
  b_pick: K({ label: "Pick up the porch", emoji: "🪣", who: "kid_b", slot: "afternoon", cad: "daily", area: "pickup", rot: "pick", pts: 5, order: 0 }),
  a_clothes: K({ label: "Lay out clothes", emoji: "👕", who: "kid_a", slot: "evening", cad: "daily", area: "health", order: 0 }),
  b_porch: K({ label: "Sweep the porch", emoji: "🧺", who: "kid_b", slot: "chores", cad: "wk:1", pts: 6, order: 0 }),
  c_toys: K({ label: "Toys in the bin", emoji: "🧩", who: "kid_c", slot: "chores", cad: "daily", pts: 3, order: 0 })
});
const LINE = { caps: { "0": 0, "1": 0, "2": 0, "3": 1, "4": 0, "5": 0, "6": 0 }, asOf: "2026-11-23", homeFrom: "2026-11-23" };   // one load a week, on Thursday: kid_a's
const dOf = n => new Date(2026, 10, 16 + n);
const go = (w, n, h, mi) => { const d = dOf(n); return w.at(d.getFullYear(), d.getMonth() + 1, d.getDate(), h, mi || 0); };
const CAP = "globalThis.__pop='';document.body.insertAdjacentHTML=function(p,h){ globalThis.__pop=h; };tab='moms-plan';1";
async function mkWorld(index, hjs) {
  const w = await W.world({ index, household: { jobs: FAM(), people: clone(W.PEOPLE), meta: { takeover: 1, engine: { mode: "preview", on: "2026-11-09" } } }, tree: { config: clone(W.FX.db.config), laundryLine: clone(LINE) } });
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
const rowsRaw = h => String(h).split(ROWSPLIT).slice(1).map(r => '<div ' + r.split("</div>")[0]);
const goneH = h => { const i = String(h).indexOf(">Gone from "); return i < 0 ? "" : String(h).slice(i); };
const listH = h => { const i = String(h).indexOf(">Gone from "); return i < 0 ? String(h) : String(h).slice(0, i); };
const rowRaw = (h, name) => rowsRaw(h).filter(r => r.indexOf(name) >= 0)[0] || "";
const rowT = (h, name) => txt(rowRaw(h, name));
const top = h => txt((/<div style="font-size:13\.5px;padding:6px 2px 2px">([\s\S]*?)<\/div>/.exec(h) || ["", ""])[1]);
const EXC = /<button onclick="lgExcuse\('[^']*','[^']*','[^']*','[^']*',\d+(,'[^']*'(,1)?)?\)" title="[^"]*" style="[^"]*">➖ Excuse<\/button>/g;
const UND = /<button onclick="lgExcuseUndo\('[^']*','[^']*','[^']*','[^']*',\d+\)" style="[^"]*">Undo<\/button>/g;
const stripX = h => String(h).replace(EXC, "").replace(UND, "");
const argsOf = (raw, fn) => { const m = new RegExp(fn + "\\(([^)]*)\\)").exec(raw || ""); return m ? m[1] : null; };
const adj = (w, kid) => (((w.db.tree.root.bank || {})[kid] || {}).adjustments) || {};
const writes = (w, m) => w.since(m).filter(e => !/^(get|once|on|read)/.test(String(e.op || "")));
const WS = (w, m) => writes(w, m).map(e => e.op + " " + e.path + (e.keys ? " [" + e.keys.join(",") + "]" : ""));
const kidLists = d => { const o = JSON.parse(d.run("(function(){ const d0=day, o={}; day=_todayDay; try{ ROSTER.forEach(function(k){ ['afternoon','chores','evening'].forEach(function(s){ rtOpen={}; o[k+s]=rtSlotHTML(s,k); }); o[k+'morning']=mrIndividualHTML(k); }); } finally{ day=d0; } return JSON.stringify(o); })()"));
  Object.keys(o).forEach(k => { o[k] = o[k].replace(/ <span class="ls-fire"[^>]*>🔥 \d+<\/span>/g, ""); }); return o; };   // LISTSTREAK (P2): an excuse does not break a list's 🔥 streak (§4.1), so the title's 🔥 may follow it; the rows are what this checks
const page = (d, f) => { d.run("globalThis.__el={innerHTML:'',style:{},appendChild(){},querySelector(){ return null; },querySelectorAll(){ return []; }};1"); try { d.run(f + "(__el);1"); } catch (e) { return "threw " + e.message; } return d.run("__el.innerHTML"); };
const bal = (d, kid) => d.run("bankBalance(" + J(kid) + ")");
const tree = w => J(w.db.tree.root);
const canon = x => JSON.stringify(x, (k, v) => (v && typeof v === "object" && !Array.isArray(v)) ? Object.keys(v).sort().reduce((o, q) => { o[q] = v[q]; return o; }, {}) : v);   // key order left out (a line filed again goes last)
const ctree = w => canon(noTs(w.db.tree.root));
const ddiff = (a, b, p) => { p = p || ""; if (J(a) === J(b)) return []; if (!a || !b || typeof a !== "object" || typeof b !== "object") return [p + ": " + String(J(a)).slice(0, 120) + " ≠ " + String(J(b)).slice(0, 120)]; return [...new Set([...Object.keys(a), ...Object.keys(b)])].flatMap(k => ddiff(a[k], b[k], p + "/" + k)).slice(0, 8); };
const noTs = x => JSON.parse(J(x), (k, v) => (k === "ts" || k === "at") ? "·" : v);
const pop = (d, k, wk) => LG(d, "lgGo('kid_a'," + k + "," + (wk ? 1 : 0) + ")");
const bsp = (d, slot) => d.run("(function(){ __pop=''; boardStatPop('kid_a','" + slot + "',_todayDay); return __pop; })()");
const howOften = (d, id) => JSON.parse(d.run("(function(){ const X=hoX(), r=hoRec(" + J(id) + ",X); return JSON.stringify({s:hoSum(r.marks),t:hoText(r)}); })()"));

(async () => {
const X = await mkWorld(IDX, HJS), BW = await mkWorld(BASE_IDX, BASE_HJS), X0 = await mkWorld(IDX_X0, HJS_X0);
const { w, A, B, Dd, Kk } = X;
const S = { same: [], pop: [], dump: {} };
const daily = (B, n, dow) => { tick(B, "morning", "kid_a", "Brush teeth"); if ([0, 2, 4].includes(dow) && n !== 4 && n !== 9) tick(B, "morning", "kid_a", "Feed the rabbit");
  if (n !== 9 && n !== 10) tick(B, "chores", "kid_a", "Make the bed"); tick(B, "chores", "kid_c", "Toys in the bin"); };
const pops = (V, n) => { loadH(V.A, V.hjs); const o = {}; ["kid_a", "kid_b", "kid_c", "kid_d"].forEach(k => { o[k + "day"] = LG(V.A, "lgGo('" + k + "',0,0)"); o[k + "week"] = LG(V.A, "lgGo('" + k + "',0,1)"); for (let j = 1; j <= Math.min(n, 9); j++) o[k + "d" + j] = LG(V.A, "lgGo('" + k + "',-" + j + ",0)"); if (n >= 7) o[k + "lastwk"] = LG(V.A, "lgGo('" + k + "',-7,1)"); }); V.A.run("lgClose();1"); return o; };
for (let n = 0; n <= 10; n++) {
  for (const V of [X, BW, X0]) {
    const { w, A, B } = V, dow = (dOf(n).getDay() + 6) % 7;   // 0 = Monday
    await go(w, n, 8); daily(B, n, dow); await w.flush();
    await go(w, n, 16);
    if (n < 6) { if (dow === 0 && n !== 0) tick(B, "chores", "kid_a", "Wipe the baseboards"); if ([0, 2, 4].includes(dow)) tick(B, "chores", "kid_a", "Empty the trash"); if (dow === 1) { tick(B, "chores", "kid_a", "Vacuum the den"); tick(B, "chores", "kid_b", "Sweep the porch"); } if (dow === 2) tick(B, "chores", "kid_a", "Dust the shelves"); }
    if (n >= 6) { tick(B, "afternoon", "kid_a", "Pick up the"); tick(B, "afternoon", "kid_b", "Pick up the"); }   // 🔄 week 2 only: week 1's turns stay not done (last week's 🔄 rows)
    if (n === 7) tick(B, "chores", "kid_a", "Wash the car");   // Sunday's, 1 day late: 8 of 10
    if (n === 8) tick(B, "chores", "kid_b", "Sweep the porch");
    await w.flush(); await go(w, n, 18);
    if (n < 10) { tick(B, "evening", "kid_a", "Lay out clothes"); await w.flush(); }   // the Evening list opens at 6 PM
    B.run("(function(){ day=_todayDay; ['chores','afternoon','evening'].forEach(function(s){ ROSTER.forEach(function(k){ rtOpen={}; rtSlotHTML(s,k); }); }); })()");
    A.run("haMomOn();tab='moms-plan';1"); A.run("mdCardKidsToday(mdTodayName(),true,true)"); await w.flush();
  }
  const scr = V => { const o = { lists: kidLists(V.B) }; V.A.run("haMomOn();tab='moms-plan';1"); o.momsDay = page(V.A, "renderMomsPlan"); o.dadsDay = page(V.Dd, "renderDadsDay"); V.B.run("kcKid='kid_a';1"); o.corner = page(V.B, "renderKidsCorner");
    o.bank = V.A.run("JSON.stringify(ROSTER.map(function(k){ return [bankBalance(k),bankLedger(k).length]; }))"); o.log = V.A.run("chSettingsClickoffLogHTML()"); return o; };
  const a = scr(X), b = scr(BW), diff = Object.keys(a).filter(k => J(a[k]) !== J(b[k]));
  const pa = pops(X, n), pb = pops(BW, n), btn = {}, pd = Object.keys(pa).filter(k => { btn[k] = (pa[k].match(EXC) || []).length + (pa[k].match(UND) || []).length; return stripX(pa[k]) !== pb[k]; });
  S.same.push([n, diff, tree(w) === tree(BW.w), w.db.log.length === BW.w.db.log.length, tree(w) === tree(X0.w) && J(scr(X0)) === J(a)]);
  S.pop.push([n, pd, btn, pd.length ? [pa[pd[0]].slice(0, 300), pb[pd[0]].slice(0, 300)] : null, Object.keys(pa).every(k => rowsRaw(pa[k]).every(r => /lgExcuse\(/.test(r) === (/^[○⏳✖] (?!🌅|🔄 a job that takes turns)/.test(txt(r)) && !/, late \(see that day\)/.test(txt(r)))))]);
}
A.run("lgClose();1");
const wk = A.run("activeWk()"), pwk = A.run("_prevWkKey()");
const I = { bed: idxOf(A, "chores", "kid_a", "Make the bed"), vac: idxOf(A, "chores", "kid_a", "Vacuum the den"), dust: idxOf(A, "chores", "kid_a", "Dust the shelves"), base: idxOf(A, "chores", "kid_a", "Wipe the baseboards"), trash: idxOf(A, "chores", "kid_a", "Empty the trash"), car: idxOf(A, "chores", "kid_a", "Wash the car"),
  clothes: idxOf(A, "evening", "kid_a", "Lay out clothes"), rabbit: idxOf(A, "morning", "kid_a", "Feed the rabbit", "wednesday"), teeth: idxOf(A, "morning", "kid_a", "Brush teeth"), laundry: idxOf(A, "morning", "kid_a", "Start your laundry") };

// ── A ──
console.log("\n── A · while nobody taps: every screen, the pop-up (but the L3 buttons) and the database = the app before ──");
ok("11 days: the kids' lists (every list, every kid, Morning too), Mom's Day, Dad's Day, Kids' Corner, the Star Bank, the Click-off Log = the app before, byte for byte", S.same.every(s => s[1].length === 0), S.same.filter(s => s[1].length));
ok("…and the whole database and the number of writes = the app before, every day (drawing the buttons writes nothing)", S.same.every(s => s[2] && s[3]), S.same.filter(s => !(s[2] && s[3])));
ok("…and = this tree without LEDGERXLOG, every day (it acts only on a tap)", S.same.every(s => s[4]), S.same.filter(s => !s[4]).map(s => s[0]));
ok("the 📒 pop-up, every kid, Today, every day back to Monday, This week and last week = the app before once ➖ Excuse / Undo are taken out", S.pop.every(p => p[1].length === 0), S.pop.filter(p => p[1].length));
ok("…on every kid, every day, every view: ➖ Excuse is on exactly the rows not done (○ · ⏳ · ✖, not a turn done late), never on a done, ➖, 🌅 or ⏸ row, nor on last week's 🔄 rows", S.pop.every(p => p[4]), S.pop.filter(p => !p[4]).map(p => p[0]));

// ── B ──
console.log("\n── B · where ➖ Excuse is, Thursday 11/26 ──");
const TH = pop(A, 0), WE = pop(A, -1), MO = pop(A, -3), SU = pop(A, -4), FR = pop(A, -6);
{ const xs = h => rowsRaw(h).filter(r => /lgExcuse\(/.test(r)).map(r => txt(r).replace(/ ➖ Excuse$/, ""));
  ok("Today: ➖ Excuse on the 7 not-done rows (the laundry, the bed, the vacuum ⏳, the dust ⏳, the trash ⏳, the clothes, the baseboards gone), nowhere else", J(xs(TH)) === J(["○ 👕 Start your laundry: Kid A's clothes not done yet 10 ⭐", "○ 🛏 Make the bed not done yet 2 ⭐", "⏳ 🧹 Vacuum the den still on Kid A's list from Tue · pays 6 of 10 ⭐ today", "⏳ 🪶 Dust the shelves still on Kid A's list from Wed · pays 8 of 10 ⭐ today", "⏳ 🗑 Empty the trash 1 day late · pays 4 of 5 ⭐ today", "○ 👕 Lay out clothes not done yet", "✖ 🧽 Wipe the baseboards due Mon, not done in time"]), xs(TH));
  ok("…each button names the turn's OWN day: the vacuum Tue, the dust and the trash Wed, the baseboards Mon (with the day on screen, to keep the row in its spot), today's rows Thursday",
    argsOf(rowRaw(TH, "Vacuum the den"), "lgExcuse") === "'kid_a','" + wk + "','tuesday','chores'," + I.vac + ",'2026-11-26'" && argsOf(rowRaw(TH, "Dust the shelves"), "lgExcuse") === "'kid_a','" + wk + "','wednesday','chores'," + I.dust + ",'2026-11-26'"
    && argsOf(rowRaw(TH, "Empty the trash"), "lgExcuse") === "'kid_a','" + wk + "','wednesday','chores'," + I.trash + ",'2026-11-26'" && argsOf(rowRaw(goneH(TH), "Wipe the baseboards"), "lgExcuse") === "'kid_a','" + wk + "','monday','chores'," + I.base + ",'2026-11-26',1"
    && argsOf(rowRaw(TH, "Make the bed"), "lgExcuse") === "'kid_a','" + wk + "','thursday','chores'," + I.bed, [argsOf(rowRaw(TH, "Vacuum the den"), "lgExcuse"), argsOf(rowRaw(goneH(TH), "Wipe the baseboards"), "lgExcuse")]);
  ok("…the button's words and its tip: \"➖ Excuse\", \"Not the kid's fault: the same as ✕ today on Wed. It costs nothing and is not a miss.\"", /title="Not the kid's fault: the same as ✕ today on Wed\. It costs nothing and is not a miss\."[^>]*>➖ Excuse</.test(rowRaw(TH, "Dust the shelves")));
  ok("no button on the done rows (the teeth ✅), nor any Undo (nothing excused yet)", !/lgExcuse/.test(rowRaw(TH, "Brush teeth")) && !UND.test(TH));
  ok("Wed (a past day): ✖ the bed and the rabbit (Morning) · ✖ the dust and the trash \"still on Kid A's list today\" · gone: the trash's Monday turn", J(xs(WE)) === J(["✖ 🐇 Feed the rabbit not done 15 ⭐", "✖ 🛏 Make the bed not done 2 ⭐", "✖ 🪶 Dust the shelves not done · still on Kid A's list today 10 ⭐", "✖ 🗑 Empty the trash not done · still on Kid A's list today 5 ⭐", "✖ 🗑 Empty the trash due Mon, not done in time"]), xs(WE));
  ok("Mon: ✖ the baseboards \"gone from Kid A's list Thu\" and the trash \"gone … Wed\"; the car's late tick (paid 8 of 10) has L2's ⭐ Give, not Excuse", J(xs(MO)) === J(["✖ 🧽 Wipe the baseboards not done · gone from Kid A's list Thu 10 ⭐", "✖ 🗑 Empty the trash not done · gone from Kid A's list Wed 5 ⭐"]) && /⭐ Give stars back$/.test(rowT(MO, "Wash the car")) && !/lgExcuse/.test(rowRaw(MO, "Wash the car")), [xs(MO), rowT(MO, "Wash the car")]);
  ok("Sun 11/22: the car's turn was done late (\"done Mon, late\"): no Excuse (that is the done row's ⭐ Give)", /^✖ 🚗 Wash the car not done · done Mon, late \(see that day\) 10 ⭐$/.test(rowT(SU, "Wash the car")) && !/lgExcuse/.test(rowRaw(SU, "Wash the car")), rowT(SU, "Wash the car"));
  ok("last week, Fri 11/20: ✖ the rabbit (Morning, not fed), with last week's key", /^✖ 🐇 Feed the rabbit not done 15 ⭐ ➖ Excuse$/.test(rowT(FR, "Feed the rabbit")) && argsOf(rowRaw(FR, "Feed the rabbit"), "lgExcuse") === "'kid_a','" + pwk + "','friday','morning'," + I.rabbit, [rowT(FR, "Feed the rabbit"), argsOf(rowRaw(FR, "Feed the rabbit"), "lgExcuse")]);
  S.dump.before = TH;
}

// ── D ── (first, while both worlds are in step)
console.log("\n── D · Excuse writes exactly what ✕ today writes ──");
{ const mX = w.mark(), mB = BW.w.mark();
  ok("Mom's ➖ Excuse on today's bed (the ledger) and Mom's ✕ today on it (the Kids today pop-up, the app before): both yes", A.run("lgExcuse(" + argsOf(rowRaw(TH, "Make the bed"), "lgExcuse") + ")") === true && (BW.A.run("rtWave('chores','kid_a',_todayDay," + I.bed + ");1"), true));
  await w.flush(); await BW.w.flush();
  ok("the same database writes, in the same order: set waved/" + wk + "/thursday/kid_a/choresstep" + I.bed + " · set routineLog/kid_a/" + wk + "/thursday/wave_choresstep" + I.bed, J(WS(w, mX)) === J(WS(BW.w, mB)) && J(WS(w, mX)) === J(["set waved/" + wk + "/thursday/kid_a/choresstep" + I.bed, "set routineLog/kid_a/" + wk + "/thursday/wave_choresstep" + I.bed]), [WS(w, mX), WS(BW.w, mB)]);
  const v = w.get("waved/" + wk + "/thursday/kid_a/choresstep" + I.bed), l = w.get("routineLog/kid_a/" + wk + "/thursday/wave_choresstep" + I.bed);
  ok("…the same records: {label:\"Make the bed\", by:\"mom\", ts, at} and the log's {label:\"Make the bed — waved by Mom\", slot chores, act wave, pts 0}", J(noTs(v)) === J(noTs(BW.w.get("waved/" + wk + "/thursday/kid_a/choresstep" + I.bed))) && J(noTs(l)) === J(noTs(BW.w.get("routineLog/kid_a/" + wk + "/thursday/wave_choresstep" + I.bed))) && v.label === "Make the bed" && v.by === "mom" && l.label === "Make the bed — waved by Mom" && l.act === "wave" && l.pts === 0 && l.slot === "chores", [v, l]);
  ok("…the whole database is the same as the app before's after its ✕ today (but the times)", J(noTs(w.db.tree.root)) === J(noTs(BW.w.db.tree.root)));
  ok("…every screen is the same: the kids' lists (the bed greyed, \"🙋 Mom waved this today\"), Mom's Day, Kids' Corner, the Click-off Log", J(kidLists(B)) === J(kidLists(BW.B)) && /Make the bed<\/div><span class="cadtag"[^>]*>🙋 Mom waved this today/.test(kidLists(B).kid_achores) && page(A, "renderMomsPlan") === page(BW.A, "renderMomsPlan") && A.run("chSettingsClickoffLogHTML()") === BW.A.run("chSettingsClickoffLogHTML()"));
  const h = pop(A, 0);
  ok("the row: \"➖ 🛏 Make the bed excused (✕ today)\" with Undo in the same spot; \"5 not done yet\" (was 6)", rowT(h, "Make the bed") === "➖ 🛏 Make the bed excused (✕ today) Undo" && / 5 not done yet/.test(top(h)) && / 6 not done yet/.test(top(TH)), [rowT(h, "Make the bed"), top(h)]);
  const m2 = w.mark(), mb2 = BW.w.mark();
  ok("Undo (the ledger) and ✕ today's own undo (the app before): both remove the same two paths", A.run("lgExcuseUndo(" + argsOf(rowRaw(h, "Make the bed"), "lgExcuseUndo") + ")") === true && (BW.A.run("rtWave('chores','kid_a',_todayDay," + I.bed + ");1"), true) && (await w.flush(), await BW.w.flush(), true)
    && J(WS(w, m2)) === J(WS(BW.w, mb2)) && J(WS(w, m2)) === J(["remove waved/" + wk + "/thursday/kid_a/choresstep" + I.bed, "remove routineLog/kid_a/" + wk + "/thursday/wave_choresstep" + I.bed]), [WS(w, m2), WS(BW.w, mb2)]);
  ok("…and the database is back to the app before's, byte for byte (the times too)", tree(w) === tree(BW.w));
  ok("…the pop-up is the one from before the tap, byte for byte", pop(A, 0) === TH);
}

// ── C ──
console.log("\n── C · each kind of row: writes, before / after, the kid's list, the bank, Undo ──");
async function caseRun(c) {
  const h0 = pop(A, c.k), raw = c.gone ? rowRaw(goneH(h0), c.nm) : rowRaw(listH(h0), c.nm), args = argsOf(raw, "lgExcuse");
  const lists0 = kidLists(B), t0 = tree(w), bank0 = J(adj(w, "kid_a")), b0 = bal(A, "kid_a"), bs0 = c.slot === "morning" ? null : bsp(A, c.slot), m = w.mark();
  const due0 = c.dueK != null ? pop(A, c.dueK) : null;
  ok(c.lbl + ": the row before: \"" + c.before + "\"", txt(raw) === c.before + " ➖ Excuse", txt(raw));
  ok(c.lbl + ": the tap → yes", !!args && A.run("lgExcuse(" + args + ")") === true, args);
  await w.flush();
  const P = "waved/" + c.wk + "/" + c.dn + "/kid_a/" + c.slot + "step" + c.i, L = "routineLog/kid_a/" + c.wk + "/" + c.dn + "/wave_" + c.slot + "step" + c.i, M = "routineLog/kid_a/" + c.wk + "/" + c.dn + "/miss_" + c.slot + "_" + c.i;
  const XW = ["set " + P, "set " + L].concat(c.miss ? ["remove " + M] : []);
  ok(c.lbl + ": exactly " + XW.length + " writes, on its own day (" + c.dn + "): " + XW.join(" · ") + (c.miss ? " (its \"— not done\" line out)" : ""), J(WS(w, m)) === J(XW), WS(w, m));
  const v = w.get(P) || {}, l = w.get(L) || {};
  ok(c.lbl + ": ✕ today's record: label \"" + c.label + "\", by mom; the log line \"" + c.label + " — waved by Mom\", act wave, 0 ⭐", v.label === c.label && v.by === "mom" && l.label === c.label + " — waved by Mom" && l.act === "wave" && l.pts === 0 && l.slot === c.slot, [v, l]);
  ok(c.lbl + ": nothing on the bank (nothing was taken for it, so nothing is given back); every device's balance as before", J(adj(w, "kid_a")) === bank0 && bal(A, "kid_a") === b0 && bal(B, "kid_a") === b0);
  const h1 = pop(A, c.k), r1 = c.gone ? rowT(goneH(h1), c.nm) : rowT(listH(h1), c.nm);
  ok(c.lbl + ": the row after, in its spot: \"" + c.after + " Undo\"", r1 === c.after + " Undo", r1);
  if (c.dueK != null && c.dueK !== c.k) { const hd = pop(A, c.dueK), rd = rowT(listH(hd), c.nm);
    ok(c.lbl + ": its own day (" + c.dn + ") reads \"➖ " + c.nm2 + " excused (✕ today)\" with Undo", rd === "➖ " + c.nm2 + " excused (✕ today) Undo", rd); }
  if (c.after2) c.after2(h1);
  const lists1 = kidLists(B);
  if (c.listGone) ok(c.lbl + ": the kid's " + c.slot + " list: the row is off it (no longer waiting, no longer falling); every other list as before", lists1["kid_a" + c.slot].indexOf(c.nm) < 0 && lists0["kid_a" + c.slot].indexOf(c.nm) >= 0 && Object.keys(lists0).filter(k => k !== "kid_a" + c.slot).every(k => lists0[k] === lists1[k]));
  if (c.listGrey) ok(c.lbl + ": the kid's " + c.slot + " list: the row greyed, \"🙋 Mom waved this today\", no tick", new RegExp(c.nmEsc + "</div><span class=\"cadtag\"[^>]*>🙋 Mom waved this today").test(lists1["kid_a" + c.slot]), lists1["kid_a" + c.slot].slice(0, 400));
  if (c.listSame) ok(c.lbl + ": the kid's lists are unchanged (the turn was not on them today)", J(lists0) === J(lists1));
  if (c.lateZero) ok(c.lbl + ": the lists' own rule: rtLateDays → 0 (it no longer waits), rtFallPay → its full stars, never counted late", A.run("(function(){ day=_todayDay; return rtLateDays('" + c.slot + "','kid_a'," + c.i + "); })()") === 0);
  if (bs0 !== null) { const bs1 = bsp(A, c.slot); ok(c.lbl + ": the Kids today " + c.slot + " pop-up: " + (c.listGone ? "the row is off it" : c.listGrey ? "the row greyed with ✕ today's undo" : "as before"), c.listGone ? (bs1.indexOf(c.nm) < 0 && bs0.indexOf(c.nm) >= 0) : c.listGrey ? />undo<\/button>/.test(bs1) : bs1 === bs0); }
  if (c.dump) S.dump[c.dump] = h1;
  // Undo
  const un = argsOf(c.gone ? rowRaw(goneH(h1), c.nm) : rowRaw(listH(h1), c.nm), "lgExcuseUndo"), m2 = w.mark();
  const UW = ["remove " + P, "remove " + L].concat(c.miss ? ["set " + M] : []);
  ok(c.lbl + ": Undo → yes; " + (c.miss ? "two removes of those same paths and its \"— not done\" line set again" : "two removes of those same paths"), !!un && A.run("lgExcuseUndo(" + un + ")") === true && (await w.flush(), J(WS(w, m2)) === J(UW)), [un, WS(w, m2)]);
  ok(c.lbl + ": after Undo the database, the kid's lists, the bank and the pop-up are what they were, byte for byte" + (c.miss ? " (but the \"— not done\" line's time: it is filed again)" : ""), (c.miss ? canon(noTs(JSON.parse(tree(w)))) === canon(noTs(JSON.parse(t0))) : tree(w) === t0) && J(kidLists(B)) === J(lists0) && J(adj(w, "kid_a")) === bank0 && pop(A, c.k) === h0 && (due0 === null || pop(A, c.dueK) === due0), [tree(w) === t0, J(kidLists(B)) === J(lists0), pop(A, c.k) === h0]);
  return { args, un };
}
await caseRun({ lbl: "○ not done yet (today, the clothes, Evening)", k: 0, nm: "Lay out clothes", nm2: "👕 Lay out clothes", nmEsc: "Lay out clothes", before: "○ 👕 Lay out clothes not done yet", after: "➖ 👕 Lay out clothes excused (✕ today)", wk, dn: "thursday", slot: "evening", i: I.clothes, label: "Lay out clothes", listGrey: true });
await caseRun({ lbl: "⏳ falling (the dust, due Wed, pays 8 of 10)", k: 0, dueK: -1, nm: "Dust the shelves", nm2: "🪶 Dust the shelves", before: "⏳ 🪶 Dust the shelves still on Kid A's list from Wed · pays 8 of 10 ⭐ today", after: "➖ 🪶 Dust the shelves excused · due Wed", wk, dn: "wednesday", slot: "chores", i: I.dust, label: "Dust the shelves", listGone: true, lateZero: true, dump: "dust",
  after2: h => ok("⏳ the dust: the top line \"5 not done yet\" (was 6), the earned stars unchanged", / 5 not done yet/.test(top(h)) && (/earned (\d+)/.exec(top(h)) || [])[1] === (/earned (\d+)/.exec(top(TH)) || [])[1], top(h)) });
await caseRun({ lbl: "⏳ the last day of its wait (the vacuum, due Tue, pays 6 of 10)", k: 0, dueK: -2, nm: "Vacuum the den", nm2: "🧹 Vacuum the den", before: "⏳ 🧹 Vacuum the den still on Kid A's list from Tue · pays 6 of 10 ⭐ today", after: "➖ 🧹 Vacuum the den excused · due Tue", wk, dn: "tuesday", slot: "chores", i: I.vac, label: "Vacuum the den", listGone: true, lateZero: true });
await caseRun({ lbl: "⏳ 3+ a week (the trash, Wed's turn, \"1 day late\")", k: 0, dueK: -1, nm: "Empty the trash", nm2: "🗑 Empty the trash", before: "⏳ 🗑 Empty the trash 1 day late · pays 4 of 5 ⭐ today", after: "➖ 🗑 Empty the trash excused · due Wed", wk, dn: "wednesday", slot: "chores", i: I.trash, label: "Empty the trash", listGone: true, lateZero: true,
  after2: () => ok("⏳ the trash: the kid's list loses the red \"1 day late\" tag with the row", !/Empty the trash[\s\S]{0,400}rt-late/.test(kidLists(B).kid_achores)) });
const missLine = (wkk, dn, nm) => J(((((w.db.tree.root.routineLog || {}).kid_a || {})[wkk || wk] || {})[dn || "monday"] || {})["miss_chores_" + (nm == null ? I.base : nm)] || null);
const miss0 = missLine();
await caseRun({ lbl: "✖ gone from the list (the baseboards, due Mon)", k: 0, dueK: -3, gone: true, nm: "Wipe the baseboards", nm2: "🧽 Wipe the baseboards", before: "✖ 🧽 Wipe the baseboards due Mon, not done in time", after: "➖ 🧽 Wipe the baseboards due Mon · excused", wk, dn: "monday", slot: "chores", i: I.base, label: "Wipe the baseboards", listSame: true, dump: "gone", miss: true,
  after2: () => ok("✖ gone: its \"— not done\" line (filed this morning, when it left the list) is out of the Click-off Log while it is excused (LEDGERXLOG)", miss0 !== "null" && missLine() === "null" && !/Wipe the baseboards — not done/.test(A.run("chSettingsClickoffLogHTML()")) && /Wipe the baseboards — waved by Mom/.test(A.run("chSettingsClickoffLogHTML()")), miss0) });
ok("✖ gone: after Undo its \"— not done\" line is back: the same key, words, list, act, stars and missed mark; only its time is the Undo's", J(noTs(JSON.parse(missLine()))) === J(noTs(JSON.parse(miss0))) && JSON.parse(missLine()).at > JSON.parse(miss0).at, [miss0, missLine()]);
await caseRun({ lbl: "✖ a daily row on a past day (Wed's bed)", k: -1, nm: "Make the bed", nm2: "🛏 Make the bed", before: "✖ 🛏 Make the bed not done 2 ⭐", after: "➖ 🛏 Make the bed excused (✕ today)", wk, dn: "wednesday", slot: "chores", i: I.bed, label: "Make the bed", listSame: true });
await caseRun({ lbl: "✖ a Morning row on a past day (Wed's rabbit)", k: -1, nm: "Feed the rabbit", nm2: "🐇 Feed the rabbit", before: "✖ 🐇 Feed the rabbit not done 15 ⭐", after: "➖ 🐇 Feed the rabbit excused (✕ today)", wk, dn: "wednesday", slot: "morning", i: I.rabbit, label: "Feed the rabbit", listSame: true });
await caseRun({ lbl: "✖ 3+ a week, gone (the trash's Monday turn, seen on Mon)", k: -3, nm: "Empty the trash", nm2: "🗑 Empty the trash", before: "✖ 🗑 Empty the trash not done · gone from Kid A's list Wed 5 ⭐", after: "➖ 🗑 Empty the trash excused (✕ today)", wk, dn: "monday", slot: "chores", i: I.trash, label: "Empty the trash", listSame: true, miss: true,
  after2: () => ok("✖ the trash's Monday turn: Wednesday's \"Gone from Kid A's list\" no longer lists it (an excused turn never left a list)", !/Empty the trash/.test(goneH(pop(A, -1))), goneH(pop(A, -1)).slice(0, 200)) });
await caseRun({ lbl: "✖ last week (Fri 11/20's rabbit)", k: -6, nm: "Feed the rabbit", nm2: "🐇 Feed the rabbit", before: "✖ 🐇 Feed the rabbit not done 15 ⭐", after: "➖ 🐇 Feed the rabbit excused (✕ today)", wk: pwk, dn: "friday", slot: "morning", i: I.rabbit, label: "Feed the rabbit", listSame: true, dump: "lastwk" });
// ✖ "still on the list today" (Wed's dust, seen on Wed): the same turn as today's ⏳ row
{ const h0 = pop(A, -1), a = argsOf(rowRaw(listH(h0), "Dust the shelves"), "lgExcuse"), t0 = pop(A, 0); A.run("lgExcuse(" + a + ")"); await w.flush();
  ok("✖ \"still on Kid A's list today\" (Wed's dust, seen on Wed): the same turn as today's ⏳ row — excused there, today has no dust row; Wed reads excused", rowT(pop(A, -1), "Dust the shelves") === "➖ 🪶 Dust the shelves excused (✕ today) Undo" && !/Dust the shelves/.test(pop(A, 0)), rowT(pop(A, 0), "Dust the shelves"));
  A.run("lgExcuseUndo(" + argsOf(rowRaw(pop(A, -1), "Dust the shelves"), "lgExcuseUndo") + ")"); await w.flush();
  ok("…its Undo: Wed and today back as they were", pop(A, -1) === h0 && pop(A, 0) === t0); }

// ── Q ──
console.log("\n── Q · the laundry row (Start your laundry, Morning) ──");
{ const ll0 = J(w.db.tree.root.laundryLine || null), h0 = pop(A, 0), a = argsOf(rowRaw(h0, "Start your laundry"), "lgExcuse"), m = w.mark(), l0 = kidLists(B);
  ok("Excuse on today's ○ Start your laundry: yes; the ✕ record on its row (morningstep" + I.laundry + "), the laundry line itself untouched (the load still waits to be started)", A.run("lgExcuse(" + a + ")") === true && (await w.flush(), J(WS(w, m)) === J(["set waved/" + wk + "/thursday/kid_a/morningstep" + I.laundry, "set routineLog/kid_a/" + wk + "/thursday/wave_morningstep" + I.laundry])) && J(w.db.tree.root.laundryLine || null) === ll0, WS(w, m));
  ok("…the kid's Morning list completes without it (\"Morning 1/2\" → \"1/1\"); the Kids today Morning pop-up shows it greyed with ✕ today's undo", /Morning <span[^>]*>1\/2</.test(l0.kid_amorning) && /Morning <span[^>]*>1\/1</.test(kidLists(B).kid_amorning) && /Start your laundry[^<]*<\/span>(?:(?!<\/div>)[\s\S])*>undo<\/button>/.test(bsp(A, "morning")) && /^➖ /.test(rowT(pop(A, 0), "Start your laundry")), rowT(pop(A, 0), "Start your laundry"));
  A.run("lgExcuseUndo(" + argsOf(rowRaw(pop(A, 0), "Start your laundry"), "lgExcuseUndo") + ")"); await w.flush();
  ok("…Undo: the row, the kid's lists and the line as before", pop(A, 0) === h0 && J(kidLists(B)) === J(l0) && J(w.db.tree.root.laundryLine || null) === ll0); }

// ── F ──
console.log("\n── F · 📊 How often: an excused turn is \"not counted\", as ✕ today's is ──");
{ const b0 = howOften(A, "a_bed"), t0 = howOften(A, "a_trash");
  A.run("lgExcuse(" + argsOf(rowRaw(pop(A, -1), "Make the bed"), "lgExcuse") + ")"); A.run("lgExcuse(" + argsOf(rowRaw(pop(A, -3), "Empty the trash"), "lgExcuse") + ")"); await w.flush();
  const b1 = howOften(A, "a_bed"), t1 = howOften(A, "a_trash");
  ok("the bed (daily): Wed's ✖ moves from not done to not counted (" + b0.t + " → " + b1.t + ")", b1.s.skip === b0.s.skip + 1 && b1.s.drop === b0.s.drop - 1 && /not counted/.test(b1.t), [b0, b1]);
  ok("the trash (3+ a week, a count): Monday's turn the same (" + t0.t + " → " + t1.t + ")", t1.s.skip === t0.s.skip + 1 && t1.s.drop === t0.s.drop - 1, [t0, t1]);
  A.run("lgExcuseUndo(" + argsOf(rowRaw(pop(A, -1), "Make the bed"), "lgExcuseUndo") + ")"); A.run("lgExcuseUndo(" + argsOf(rowRaw(pop(A, -3), "Empty the trash"), "lgExcuseUndo") + ")"); await w.flush();
  ok("…Undo: both counts back", J(howOften(A, "a_bed")) === J(b0) && J(howOften(A, "a_trash")) === J(t0)); }

// ── E ──
console.log("\n── E · ✕ today in the Kids today pop-up: exactly as before; one record with the ledger ──");
{ const p0 = bsp(A, "evening"), q0 = bsp(BW.A, "evening");
  ok("the Evening pop-up for kid_a = the app before's, byte for byte (✕ today on the clothes)", p0 === q0 && /✕ today<\/button>/.test(p0));
  const m = w.mark(), mb = BW.w.mark(); A.run("rtWave('evening','kid_a',_todayDay," + I.clothes + ");1"); BW.A.run("rtWave('evening','kid_a',_todayDay," + I.clothes + ");1"); await w.flush(); await BW.w.flush();
  ok("its ✕ today tap: the same writes as the app before's, the pop-up after the same (undo), the kids' lists the same", J(WS(w, m)) === J(WS(BW.w, mb)) && bsp(A, "evening") === bsp(BW.A, "evening") && J(kidLists(B)) === J(kidLists(BW.B)), [WS(w, m), WS(BW.w, mb)]);
  const h = pop(A, 0);
  ok("the ledger reads that ✕ today as \"➖ 👕 Lay out clothes excused (✕ today)\" with Undo (one record, one home)", rowT(h, "Lay out clothes") === "➖ 👕 Lay out clothes excused (✕ today) Undo", rowT(h, "Lay out clothes"));
  A.run("lgExcuseUndo(" + argsOf(rowRaw(h, "Lay out clothes"), "lgExcuseUndo") + ")"); BW.A.run("rtWave('evening','kid_a',_todayDay," + I.clothes + ");1"); await w.flush(); await BW.w.flush();
  ok("…the ledger's Undo takes the ✕ today away just as its own undo does: the pop-up and the database = the app before's", bsp(A, "evening") === bsp(BW.A, "evening") && bsp(A, "evening") === p0 && ctree(w) === ctree(BW.w)); }

// ── G ──
console.log("\n── G · turns that cannot be excused, a second tap, the kid's list after ──");
{ const m = w.mark(), t0 = tree(w);
  ok("a done row (today's teeth): lgExcuse says no", A.run("lgExcuse('kid_a','" + wk + "','thursday','morning'," + I.teeth + ")") === false);
  ok("the car's Sunday turn, done late Monday: no", A.run("lgExcuse('kid_a','" + wk + "','sunday','chores'," + I.car + ")") === false);
  ok("a day the chore was not due (the vacuum on Thursday): no", A.run("lgExcuse('kid_a','" + wk + "','thursday','chores'," + I.vac + ")") === false);
  ok("a day not on this device (two weeks back), a made-up kid, list or row: no", A.run("lgExcuse('kid_a','week1','monday','chores'," + I.bed + ")") === false && A.run("lgExcuse('kid_x','" + wk + "','thursday','chores'," + I.bed + ")") === false && A.run("lgExcuse('kid_a','" + wk + "','thursday','tasks'," + I.bed + ")") === false && A.run("lgExcuse('kid_a','" + wk + "','thursday','chores',99)") === false);
  ok("Undo on a row that is not excused: no", A.run("lgExcuseUndo('kid_a','" + wk + "','thursday','chores'," + I.bed + ")") === false);
  ok("…none of those wrote anything", writes(w, m).length === 0 && tree(w) === t0, WS(w, m));
  const a = argsOf(rowRaw(pop(A, 0), "Dust the shelves"), "lgExcuse"); A.run("lgExcuse(" + a + ")"); await w.flush(); const m2 = w.mark();
  ok("a second tap on the same turn (the old button): no, nothing written", A.run("lgExcuse(" + a + ")") === false && writes(w, m2).length === 0);
  ok("the kid's list after the dust is excused: no dust row, so nothing to tick (Kids' Corner too)", kidLists(B).kid_achores.indexOf("Dust the shelves") < 0 && (B.run("kcKid='kid_a';1"), page(B, "renderKidsCorner").indexOf("Dust the shelves") < 0));
  A.run("lgExcuseUndo(" + argsOf(rowRaw(pop(A, 0), "Dust the shelves"), "lgExcuseUndo") + ")"); await w.flush();
  ok("…Undo: the dust is back on the kid's list, falling as before (pays 8 of 10)", /Dust the shelves[\s\S]{0,600}10<\/s> → 8 ⭐/.test(kidLists(B).kid_achores)); }

// ── H ──
console.log("\n── H · a kid's device, a kiosk and Dad's link ──");
{ const a = argsOf(rowRaw(TH, "Make the bed"), "lgExcuse");
  for (const [nm, d] of [["a kid's device", B], ["the kitchen kiosk", Kk]]) {
    d.run(HJS); const m = w.mark();
    const p = LG(d, "lgShow()"), e = d.run("lgExcuse(" + a + ")"), r = d.run("(function(){ const r=lgXRow({ic:'○',c:0,nm:'x'},'chores','kid_a',lgDay(0)," + I.bed + ",(rtStepsFor('chores','kid_a',false,_todayDay)||[])[" + I.bed + "]); return r.xH||''; })()"); await w.flush();
    ok(nm + " (house.js loaded there anyway): the pop-up does not open, lgExcuse says no, a row drawn there carries no button, nothing written", p === "" && e === false && r === "" && writes(w, m).length === 0, [p.slice(0, 40), e, r]); }
  A.run("lgExcuse(" + a + ")"); await w.flush(); const m = w.mark();
  ok("…nor Undo Mom's excuse", B.run("lgExcuseUndo('kid_a','" + wk + "','thursday','chores'," + I.bed + ")") === false && Kk.run("lgExcuseUndo('kid_a','" + wk + "','thursday','chores'," + I.bed + ")") === false && writes(w, m).length === 0);
  A.run("lgExcuseUndo('kid_a','" + wk + "','thursday','chores'," + I.bed + ")"); await w.flush();
  loadH(Dd, HJS); const hl = LG(Dd, "lgShow();lgGo('kid_a',0,0)"), m2 = w.mark();
  ok("Dad's link, his code not in (✕ today's own rule: Mom or an unlocked Dad): the pop-up opens, no ➖ Excuse and no Undo, lgExcuse says no", hl.length > 0 && !/lgExcuse/.test(hl) && Dd.run("lgExcuse(" + a + ")") === false && writes(w, m2).length === 0);
  Dd.run("dadUnlocked=true;1"); const hu = LG(Dd, "lgShow();lgGo('kid_a',0,0)");
  ok("Dad's link, unlocked: the same buttons as Mom's", (hu.match(EXC) || []).length === (TH.match(EXC) || []).length, [(hu.match(EXC) || []).length]);
  ok("his tap: yes; the record says by dad, the log \"Make the bed — waved by Dad\"", Dd.run("lgExcuse(" + a + ")") === true && (await w.flush(), true) && (w.get("waved/" + wk + "/thursday/kid_a/choresstep" + I.bed) || {}).by === "dad" && (w.get("routineLog/kid_a/" + wk + "/thursday/wave_choresstep" + I.bed) || {}).label === "Make the bed — waved by Dad");
  ok("…Mom's ledger shows it excused with Undo; his Undo removes it", /^➖ 🛏 Make the bed excused \(✕ today\) Undo$/.test(rowT(pop(A, 0), "Make the bed")) && Dd.run("lgExcuseUndo('kid_a','" + wk + "','thursday','chores'," + I.bed + ")") === true && (await w.flush(), !w.get("waved/" + wk + "/thursday/kid_a/choresstep" + I.bed)));
  Dd.run("dadUnlocked=false;1"); }

// ── J ──
console.log("\n── J · L1 and L2 still hold ──");
{ const h = pop(A, -3), a = argsOf(rowRaw(h, "Wash the car"), "lgGive"), m = w.mark();
  ok("L2: ⭐ Give stars back on Monday's car (paid 8 of 10): one line +2, then its Undo", !!a && A.run("lgGive(" + a + ")") === true && (await w.flush(), writes(w, m).length === 1 && /lgb_/.test(writes(w, m)[0].path)) && A.run("lgGiveUndo(" + a + ")") === true && (await w.flush(), !Object.keys(adj(w, "kid_a")).some(k => /^lgb_/.test(k))), WS(w, m));
  ok("L1: every pop-up = the app before's once the L3 buttons are taken out (Today, every day back, This week, last week)", ["kid_a", "kid_b"].every(k => [0, -1, -2, -3, -4, -5, -6, -7].every(j => stripX(LG(A, "lgGo('" + k + "'," + j + ",0)")) === LG(BW.A, "lgGo('" + k + "'," + j + ",0)")) && stripX(LG(A, "lgGo('" + k + "',0,1)")) === LG(BW.A, "lgGo('" + k + "',0,1)")));
  ok("after every tap above was undone, the whole database = the app before's (but the times, and the order of a line filed again)", ctree(w) === ctree(BW.w), ddiff(noTs(w.db.tree.root), noTs(BW.w.db.tree.root))); }

// ── I ──
console.log("\n── I · dryrun writes nothing ──");
{ const Dr = w.boot("Dr", "devDr", { mom: true }); Dr.run(CAP); await w.flush(); Dr.run(HJS);
  Dr.run("HA_LS.setItem('ha_dryrun','1');1"); const m = w.mark(), a = argsOf(rowRaw(TH, "Dust the shelves"), "lgExcuse");
  const e = Dr.run("lgExcuse(" + a + ")"); await w.flush();
  ok("?dryrun=1: the tap shows on that screen only (its own copy), nothing reaches the database", e === true && writes(w, m).length === 0 && !w.get("waved/" + wk + "/wednesday/kid_a/choresstep" + I.dust) && /^➖ 🪶 Dust the shelves excused · due Wed Undo$/.test(rowT(LG(Dr, "lgGo('kid_a',0,0)"), "Dust the shelves")), [WS(w, m), rowT(LG(Dr, "lgGo('kid_a',0,0)"), "Dust the shelves")]);
  const u = Dr.run("lgExcuseUndo('kid_a','" + wk + "','wednesday','chores'," + I.dust + ")"); await w.flush();
  ok("…and its Undo writes nothing either", u === true && writes(w, m).length === 0);
  w.devs.splice(w.devs.indexOf(Dr), 1); }

// ── K ──
console.log("\n── K · a row that cannot be excused even when called directly: last week's 🔄, a 🌅 sent-to-morning row ──");
{ const ri = idxOf(A, "afternoon", "kid_a", "Pick up the"), h = pop(A, -6), raw = rowRaw(h, "🔄 a job that takes turns"), m = w.mark(), t0 = tree(w);
  ok("last week (Fri 11/20): kid_a's 🔄 row \"✖ 🔄 a job that takes turns not done 5 ⭐\" draws no ➖ Excuse (its turn is not worked out for last week)", ri >= 0 && txt(raw) === "✖ 🔄 a job that takes turns not done 5 ⭐" && !/lgExcuse/.test(raw), [ri, txt(raw)]);
  ok("…and lgExcuse called on it directly says no and writes nothing", A.run("lgExcuse('kid_a','" + pwk + "','friday','afternoon'," + ri + ")") === false && (await w.flush(), writes(w, m).length === 0) && tree(w) === t0, WS(w, m));
  A.run("amSend('chores','kid_a',_todayDay," + I.bed + ");1"); await w.flush();
  const hs = pop(A, 0), rs = rowRaw(hs, "Make the bed"), m2 = w.mark(), t1 = tree(w);
  ok("a 🌅 row (today's bed, sent to tomorrow morning): \"🌅 🛏 Make the bed sent to tomorrow morning\", no ➖ Excuse", txt(rs) === "🌅 🛏 Make the bed sent to tomorrow morning" && !/lgExcuse/.test(rs), txt(rs));
  ok("…and lgExcuse called on it directly says no and writes nothing (it is the morning list's now)", A.run("lgExcuse('kid_a','" + wk + "','thursday','chores'," + I.bed + ")") === false && (await w.flush(), writes(w, m2).length === 0) && tree(w) === t1, WS(w, m2)); }

// ── L ──
console.log("\n── L · LEDGERXLOG: a gone turn's \"— not done\" line out on Excuse, back on Undo (her \"fix\", 2026-11-22) ──");
{ const labels = h => (String(h).match(/>(?:✓|🌅|↩) ([^<]*)<\/span>/g) || []).map(x => x.replace(/^>\S+ /, "").replace(/<\/span>$/, "")).sort();
  const sub = W0 => canon(noTs({ rl: ((W0.db.tree.root.routineLog || {}).kid_a) || null, wv: W0.db.tree.root.waved || null }));
  const MT = "routineLog/kid_a/" + wk + "/monday/miss_chores_" + I.base, ML = "routineLog/kid_a/" + pwk + "/monday/miss_chores_" + I.base;
  const aT = argsOf(rowRaw(goneH(pop(A, 0)), "Wipe the baseboards"), "lgExcuse"), hL = pop(A, -7), rL = rowRaw(goneH(hL), "Wipe the baseboards"), aL = argsOf(rL, "lgExcuse");
  const log0 = A.run("chSettingsClickoffLogHTML()"), s0 = sub(w), mT0 = missLine(), mL0 = missLine(pwk), ho0 = howOften(A, "a_base"), bank0 = J(adj(w, "kid_a"));
  ok("before: this week's line (Mon 11/23's turn, gone Thu) and last week's (Mon 11/16's, gone Thu 11/19) are both in the log; Thu 11/19 lists the old turn under Gone", /— not done/.test(mT0) && /— not done/.test(mL0) && txt(rL) === "✖ 🧽 Wipe the baseboards due Mon, not done in time ➖ Excuse" && labels(log0).includes("Wipe the baseboards — not done"), [mT0, mL0, txt(rL)]);
  // the app before this fix (X0: this tree without LEDGERXLOG): both lines
  { loadH(X0.A, HJS_X0); const a0 = argsOf(rowRaw(goneH(LG(X0.A, "lgGo('kid_a',0,0)")), "Wipe the baseboards"), "lgExcuse"); X0.A.run("lgExcuse(" + a0 + ")"); await X0.w.flush(); const l = labels(X0.A.run("chSettingsClickoffLogHTML()"));
    ok("without the fix (this tree minus LEDGERXLOG) the Click-off Log showed both \"Wipe the baseboards — not done\" and \"— waved by Mom\" for the one turn", l.includes("Wipe the baseboards — not done") && l.includes("Wipe the baseboards — waved by Mom"), l);
    X0.A.run("lgExcuseUndo(" + argsOf(rowRaw(goneH(LG(X0.A, "lgGo('kid_a',0,0)")), "Wipe the baseboards"), "lgExcuseUndo") + ")"); await X0.w.flush(); }
  let m = w.mark(); A.run("lgExcuse(" + aT + ")"); await w.flush();
  ok("this week: Excuse → the ✕ record on Monday 11/23 and one remove of its line: " + J(WS(w, m)), J(WS(w, m)) === J(["set waved/" + wk + "/monday/kid_a/choresstep" + I.base, "set routineLog/kid_a/" + wk + "/monday/wave_choresstep" + I.base, "remove " + MT]), WS(w, m));
  m = w.mark(); A.run("lgExcuse(" + aL + ")"); await w.flush();
  ok("last week: Excuse → the ✕ record on last week's Monday 11/16 and one remove of its line", J(WS(w, m)) === J(["set waved/" + pwk + "/monday/kid_a/choresstep" + I.base, "set routineLog/kid_a/" + pwk + "/monday/wave_choresstep" + I.base, "remove " + ML]), WS(w, m));
  const log1 = labels(A.run("chSettingsClickoffLogHTML()"));
  ok("the Click-off Log now: \"Wipe the baseboards — waved by Mom\", no \"— not done\" for it; every other line as before", !log1.includes("Wipe the baseboards — not done") && log1.includes("Wipe the baseboards — waved by Mom") && J(log1.filter(x => !/Wipe the baseboards/.test(x))) === J(labels(log0).filter(x => !/Wipe the baseboards/.test(x))), log1);
  ok("the Star Bank untouched (no line written or removed)", J(adj(w, "kid_a")) === bank0);
  ok("📊 How often on Dad's device, which only heard it (one line swapped for another: the same number of lines), = Mom's", J(howOften(Dd, "a_base")) === J(howOften(A, "a_base")) && howOften(Dd, "a_base").s.skip === ho0.s.skip + 2, [howOften(Dd, "a_base"), howOften(A, "a_base")]);
  const ho1 = howOften(A, "a_base");
  ok("📊 How often: Mon 11/16's dropped turn and Mon 11/23's open one are both \"not counted\" (" + ho0.t + " → " + ho1.t + ")", ho1.s.skip === ho0.s.skip + 2 && ho1.s.drop === ho0.s.drop - 1, [ho0, ho1]);
  m = w.mark(); B.run("(function(){ day=_todayDay; ROSTER.forEach(function(k){ ['afternoon','chores','evening'].forEach(function(s){ rtOpen={}; rtSlotHTML(s,k); }); }); })()"); await w.flush();
  ok("the kid's device draws every list (where a dropped turn's line is filed): nothing written, the line stays out while it is excused", writes(w, m).length === 0 && missLine() === "null" && missLine(pwk) === "null", WS(w, m));
  m = w.mark();
  ok("a second Excuse tap on either: no, nothing written", A.run("lgExcuse(" + aT + ")") === false && A.run("lgExcuse(" + aL + ")") === false && (await w.flush(), writes(w, m).length === 0));
  m = w.mark();
  ok("a kid's device and the kiosk: Undo says no, nothing written, the line stays out", B.run("lgExcuseUndo('kid_a','" + wk + "','monday','chores'," + I.base + ")") === false && Kk.run("lgExcuseUndo('kid_a','" + wk + "','monday','chores'," + I.base + ")") === false && (await w.flush(), writes(w, m).length === 0) && missLine() === "null");
  // dryrun: a grown-up device with ?dryrun=1 — Undo shows the line again on that screen only
  { const Dr = w.boot("Dr2", "devDr2", { mom: true }); Dr.run(CAP); await w.flush(); Dr.run(HJS); Dr.run("_loadPrevSl();1"); await w.flush(); Dr.run("HA_LS.setItem('ha_dryrun','1');1"); const md = w.mark();
    const u = Dr.run("lgExcuseUndo('kid_a','" + wk + "','monday','chores'," + I.base + ")"); await w.flush();
    ok("?dryrun=1: Undo shows the line again on that screen only; nothing reaches the database", u === true && writes(w, md).length === 0 && missLine() === "null" && labels(Dr.run("chSettingsClickoffLogHTML()")).includes("Wipe the baseboards — not done"), WS(w, md));
    w.__dr = Dr; }
  // Undo from a second grown-up device, just booted (no memory of the Excuse: a reload)
  const A2 = w.boot("A2", "devA2", { mom: true }); A2.run(CAP); await w.flush(); A2.run(HJS); A2.run("_loadPrevSl();1"); await w.flush();
  m = w.mark(); const u1 = A2.run("lgExcuseUndo('kid_a','" + wk + "','monday','chores'," + I.base + ")"); await w.flush(); const w1 = WS(w, m);
  ok("Undo from a second grown-up device just booted (this week): the ✕ record removed and the line filed again through _rtLogMiss", u1 === true && J(w1) === J(["remove waved/" + wk + "/monday/kid_a/choresstep" + I.base, "remove routineLog/kid_a/" + wk + "/monday/wave_choresstep" + I.base, "set " + MT]), w1);
  m = w.mark(); const u2 = A2.run("lgExcuseUndo('kid_a','" + pwk + "','monday','chores'," + I.base + ")"); await w.flush(); const w2 = WS(w, m);
  ok("…and last week's from the same device: the ✕ record removed, the line set again under last week's Monday", u2 === true && J(w2) === J(["remove waved/" + pwk + "/monday/kid_a/choresstep" + I.base, "remove routineLog/kid_a/" + pwk + "/monday/wave_choresstep" + I.base, "set " + ML]), w2);
  ok("each line back as it was: the same key, words, list, act, stars and missed mark; only its time stamp (ts, at) is the Undo's", J(noTs(JSON.parse(missLine()))) === J(noTs(JSON.parse(mT0))) && J(noTs(JSON.parse(missLine(pwk)))) === J(noTs(JSON.parse(mL0))) && JSON.parse(missLine()).at > JSON.parse(mT0).at, [mT0, missLine()]);
  ok("kid_a's whole Click-off Log record and the ✕ records = before the Excuse (but those two times); the Click-off Log lists the same lines", sub(w) === s0 && J(labels(A.run("chSettingsClickoffLogHTML()"))) === J(labels(log0)));
  ok("How often back as it was; the bank untouched", J(howOften(A, "a_base")) === J(ho0) && J(adj(w, "kid_a")) === bank0, [ho0, howOften(A, "a_base"), howOften(A2, "a_base")]);
  m = w.mark();
  ok("a second Undo: no, nothing written", A2.run("lgExcuseUndo('kid_a','" + wk + "','monday','chores'," + I.base + ")") === false && A.run("lgExcuseUndo('kid_a','" + pwk + "','monday','chores'," + I.base + ")") === false && (await w.flush(), writes(w, m).length === 0));
  // a turn that never left the list: no line out, none filed on Undo (the dust, ⏳ since Wed)
  const aD = argsOf(rowRaw(pop(A, 0), "Dust the shelves"), "lgExcuse"); m = w.mark(); A.run("lgExcuse(" + aD + ")"); await w.flush(); const wd1 = WS(w, m);
  m = w.mark(); A.run("lgExcuseUndo('kid_a','" + wk + "','wednesday','chores'," + I.dust + ")"); await w.flush(); const wd2 = WS(w, m);
  ok("a turn still on the list (the dust): Excuse and Undo touch no \"— not done\" line (2 writes each)", wd1.length === 2 && wd2.length === 2 && !wd1.concat(wd2).some(x => /miss_/.test(x)) && missLine(wk, "wednesday", I.dust) === "null", [wd1, wd2]);
  { const Dr = w.__dr, md = w.mark(); await w.flush(); const a = argsOf(rowRaw(goneH(LG(Dr, "lgGo('kid_a',0,0)")), "Wipe the baseboards"), "lgExcuse"), e = Dr.run("lgExcuse(" + a + ")"); await w.flush();
    ok("?dryrun=1: Excuse on the gone row takes the line out on that screen only; nothing reaches the database, the line stays in it", !!a && e === true && writes(w, md).length === 0 && missLine() !== "null" && !labels(Dr.run("chSettingsClickoffLogHTML()")).includes("Wipe the baseboards — not done"), [a, e, WS(w, md)]);
    w.devs.splice(w.devs.indexOf(Dr), 1); }
  w.devs.splice(w.devs.indexOf(A2), 1); }

// ── P ──
console.log("\n── P · plan rows (the plan ON): ✕ today's record is the plan's skip ──");
{ const P1 = await W.world({ mode: "on", index: IDX }), P0 = await W.world({ mode: "on", index: BASE_IDX });
  const pa = P1.boot("A", "devA", { mom: true }), pb = P1.boot("B", "devB"), qa = P0.boot("A", "devA", { mom: true }), qb = P0.boot("B", "devB");
  for (const d of [pa, pb, qa, qb]) d.run(CAP);
  await P1.flush(); await P0.flush(); await P1.at(2026, 11, 16, 16, 30); await P0.at(2026, 11, 16, 16, 30); loadH(pa, HJS); loadH(qa, BASE_HJS);
  const pidx = d => d.run("(rtStepsFor('chores','kid_a',false,_todayDay)||[]).findIndex(function(s){ return s&&s.house==='c_a_dishes'; })"), j = pidx(pa);
  const h0 = LG(pa, "lgGo('kid_a',0,0)"), a = argsOf(rowRaw(h0, "Unload the dishwasher"), "lgExcuse"), wkp = pa.run("activeWk()"), t0 = J(P1.db.tree.root), l0 = kidLists(pb);
  ok("a plan row (kid_a's \"Unload the dishwasher\", Mon 11/16): \"○ 🍽 Unload the dishwasher not done yet 10 ⭐\" with ➖ Excuse", j >= 0 && rowT(h0, "Unload the dishwasher") === "○ 🍽 Unload the dishwasher not done yet 10 ⭐ ➖ Excuse" && a === "'kid_a','" + wkp + "','monday','chores'," + j, [j, rowT(h0, "Unload the dishwasher"), a]);
  const m = P1.mark(), mb = P0.mark(); const e = pa.run("lgExcuse(" + a + ")"); qa.run("rtWave('chores','kid_a','monday'," + pidx(qa) + ");1"); await P1.flush(); await P0.flush();
  ok("Excuse → yes; ONE update, the same keys as ✕ today's (houseDay/2026-11-16/skip/c_a_dishes · household/jobs/c_a_dishes/lastSkip · the log's wave_h_ line)", e === true && J(WS(P1, m)) === J(WS(P0, mb)) && J(WS(P1, m)) === J(["update  [houseDay/2026-11-16/skip/c_a_dishes,household/jobs/c_a_dishes/lastSkip,routineLog/kid_a/" + wkp + "/monday/wave_h_c_a_dishes]"]), [WS(P1, m), WS(P0, mb)]);
  ok("…the records the same as ✕ today's (skip {by mom, prev}, lastSkip 2026-11-16, \"Unload the dishwasher — waved by Mom\"); the whole database the same (but the times)", J(noTs(P1.db.tree.root)) === J(noTs(P0.db.tree.root)) && P1.get("household/jobs/c_a_dishes/lastSkip") === "2026-11-16" && (P1.get("houseDay/2026-11-16/skip/c_a_dishes") || {}).by === "mom");
  ok("…the row: \"➖ 🍽 Unload the dishwasher excused (✕ today)\" with Undo; the kid's list = the app before's after its ✕ today", rowT(LG(pa, "lgGo('kid_a',0,0)"), "Unload the dishwasher") === "➖ 🍽 Unload the dishwasher excused (✕ today) Undo" && J(kidLists(pb)) === J(kidLists(qb)), rowT(LG(pa, "lgGo('kid_a',0,0)"), "Unload the dishwasher"));
  const m2 = P1.mark(); const u = pa.run("lgExcuseUndo(" + argsOf(rowRaw(LG(pa, "lgGo('kid_a',0,0)"), "Unload the dishwasher"), "lgExcuseUndo") + ")"); await P1.flush();
  ok("Undo → yes; one update putting the three back (null); the database, the kid's list and the row as before", u === true && J(WS(P1, m2)) === J(["update  [houseDay/2026-11-16/skip/c_a_dishes,household/jobs/c_a_dishes/lastSkip,routineLog/kid_a/" + wkp + "/monday/wave_h_c_a_dishes]"]) && J(P1.db.tree.root) === t0 && J(kidLists(pb)) === J(l0) && LG(pa, "lgGo('kid_a',0,0)") === h0, WS(P1, m2));
  qa.run("rtWave('chores','kid_a','monday'," + pidx(qa) + ");1"); await P0.flush();
  // a plan row on a past day: Tuesday, Monday's dishes (not done)
  await P1.at(2026, 11, 17, 16, 30); const hm = LG(pa, "lgGo('kid_a',-1,0)"), am = argsOf(rowRaw(hm, "Unload the dishwasher"), "lgExcuse"), m3 = P1.mark(), tt = LG(pa, "lgGo('kid_a',0,0)");
  ok("Tue: Monday's plan row \"✖ 🍽 Unload the dishwasher not done 10 ⭐\" with ➖ Excuse; Excuse writes Monday's skip (not Tuesday's)", rowT(hm, "Unload the dishwasher") === "✖ 🍽 Unload the dishwasher not done 10 ⭐ ➖ Excuse" && pa.run("lgExcuse(" + am + ")") === true && (await P1.flush(), !!P1.get("houseDay/2026-11-16/skip/c_a_dishes") && !P1.get("houseDay/2026-11-17/skip/c_a_dishes")), [rowT(hm, "Unload the dishwasher"), WS(P1, m3)]);
  ok("…Monday reads \"➖ … excused (✕ today)\" with Undo; Tuesday's own plan row is untouched (still \"○ not done yet\")", rowT(LG(pa, "lgGo('kid_a',-1,0)"), "Unload the dishwasher") === "➖ 🍽 Unload the dishwasher excused (✕ today) Undo" && LG(pa, "lgGo('kid_a',0,0)") === tt);
  pa.run("lgExcuseUndo(" + argsOf(rowRaw(LG(pa, "lgGo('kid_a',-1,0)"), "Unload the dishwasher"), "lgExcuseUndo") + ")"); await P1.flush();
  ok("…Undo: Monday back as it was", LG(pa, "lgGo('kid_a',-1,0)") === hm && !P1.get("houseDay/2026-11-16/skip/c_a_dishes")); }

if (process.env.LGX_DUMP) fs.writeFileSync(process.env.LGX_DUMP, J(S.dump));   // read only by the preview page's builder
console.log("\n" + pass + " passed, " + fail + " failed");
try { fs.unlinkSync(BASE_IDX); fs.unlinkSync(IDX_X0); } catch (e) {}
process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); try { fs.unlinkSync(BASE_IDX); fs.unlinkSync(IDX_X0); } catch (x) {} process.exit(1); });
