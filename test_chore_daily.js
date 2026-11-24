/*
 * test_chore_daily.js — ⭐ CHOREDAILY (missed-chores design §2.8, slice C5; her words 11/19–11/20: "if missed 2 days in a row then 20% etc,
 * 1 day missed wouldnt cost them"; a paying daily: "It pays 20% less"; Evening lists: "yes but make it start on a blank slate").
 * A daily row that pays stars: one missed day is free; after two missed days in a row it pays one rtFallPts step less (10 → 8), one more
 * for each further missed day (6 4 2 0), then 0 until it is done once; the day after it is done it is back at full. Nothing is ever taken
 * from a bank. Not a miss (and the count starts over): ✕ today / ➖ Excuse, 😷 Kid Off, 🌅 sent. Only days on or after RT_DAILY_FROM
 * (Mon 2026-11-30) and on or after the kid's "Stars fall when late" (📒 Ledger ⚙) count.
 * The WHOLE app runs per device (test_fixtures/house_world.js: one shared in-memory Firebase, one virtual clock) on a made-up family
 * (kid_a … kid_d), the clock moved day by day from Sat 11/28 to Wed 12/9 (the week changes on Sun 11/29 and Sun 12/6):
 *   kid_a  🌅 Feed the cat (10) · ☀️ Pick up shoes (10) · 🧹 Unload dishes (10) · 🧹 Make the bed (0) · 🌙 Tidy the room (10) — never
 *          done from 11/23 until Tue 12/8 (each day ticked and un-ticked, to read what a tick pays and that an un-tick takes it back)
 *   kid_b  🧹 Water plants (5) · Sweep steps (15) · Wipe counters (22) — never done (ticked + un-ticked, Mom's ○ for the 15) ·
 *          Fold napkins (10) — done Tue, Thu, Sat only
 *   kid_c  🧹 Wipe the sink (✕ Wed) · Set the table (➖ Excuse of Wed, made Thu) · Feed the fish · Water the garden (🌅 Wed); 😷 Kid Off Sun 12/6
 *   kid_d  🧹 Rake leaves (10) — "Stars fall when late" Off Wed, On again Thu; ticked Sun (6), Mom undoes it Mon (−6)
 *   A · the function and where it is read · B the design's table on every list and every payer/display, the week boundary included ·
 *   C 5 / 15 / 22 ⭐ rounding · D missed / done / missed / done · E ✕ / ➖ / 😷 / 🌅 restart the count · F the per-kid switch · G ⏸ Pause ·
 *   H un-tick returns exactly what was paid · I nothing is ever taken: a 0 ⭐ daily, the bank · J dry-run · K the 📒 ledger's words ·
 *   L nothing else moves: = the app before, byte for byte (every other day done 11/28 … 12/9; misses only before the slate).
 * "The app before" = THIS tree with C5 taken out (no git, no pinned commit): index.html minus CHOREDAILY and its hooks, house.js minus
 * its two ledger hooks (each must match exactly once). CD_INDEX / CD_HJS = other copies (a mutation check). CD_DUMP = a file for the
 * preview page's drawings.   run: node test_chore_daily.js
 */
"use strict";
const fs = require("fs"), path = require("path"), os = require("os");
const W = require(path.join(__dirname, "test_fixtures", "house_world.js"));
let pass = 0, fail = 0; const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x).slice(0, 900) + ")" : "")); } };
const J = x => JSON.stringify(x), clone = x => JSON.parse(J(x));
const IDX = process.env.CD_INDEX || path.join(__dirname, "index.html"), HJS = fs.readFileSync(process.env.CD_HJS || path.join(__dirname, "house.js"), "utf8");

// ── the app before: this tree, C5 taken out ──
const once = (src, what, from, to, label) => { const n = typeof from === "string" ? src.split(from).length - 1 : (src.match(from) || []).length;
  if (n !== 1) throw new Error("test_chore_daily: the app before cannot be built — " + label + " found " + n + "× in " + what + " (must be exactly once)"); return src.replace(from, () => to); };
const BASE_IDX = (() => { let s = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
  const R = (a, b, l) => { s = once(s, "index.html", a, b, l); };
  R(/^\/\/ CHOREDAILY_START[^\n]*\n[\s\S]*?^\/\/ CHOREDAILY_END\n/m, "", "the CHOREDAILY block");
  R('\n    const _bd=(now&&_b0>0&&typeof rtDailyPay==="function"&&day===_todayDay&&rtDailyRow(_st0))?rtDailyPay(slot,kid,i,_st0):_bf;   // CHOREDAILY: a daily missed 2+ days in a row', "", "toggleRtStep");
  R("(_bd + zoneBonusFor(_st0&&_st0.zone,_bd))", "(_bf + zoneBonusFor(_st0&&_st0.zone,_bf))", "toggleRtStep's pay");
  R(', _b1=_st?(_st.pts||0):0, _b0=(now&&_b1>0&&typeof _todayDay==="string"&&day===_todayDay&&typeof rtDailyPay==="function")?rtDailyPay("morning",kid,i,_st):_b1;   // CHOREDAILY', ", _b0=_st?(_st.pts||0):0;", "toggleMorningStep");
  R("((cur&&cur.pts!=null)?cur.pts:_b1);", "((cur&&cur.pts!=null)?cur.pts:_b0);", "toggleMorningStep's un-tick");
  R(`((st.pts||0)>0?' '+((typeof rtDailyPay==="function"&&day===_todayDay)?rtDailyPill(st.pts,rtDailyPay("morning",kid,i,st),'cadtag" style="color:#b45309;border-color:#fde68a'):'<span class="cadtag" style="color:#b45309;border-color:#fde68a">+'+(st.pts||0)+' \\u2b50</span>'):'')+   // CHOREDAILY`,
    `((st.pts||0)>0?' <span class="cadtag" style="color:#b45309;border-color:#fde68a">+'+(st.pts||0)+' \\u2b50</span>':'')+`, "the Morning row");
  R(`((typeof rtDailyPay==="function"&&day===_todayDay&&rtDailyRow(st))?rtDailyPill(pts,rtDailyPay(slot,kid,i,st)):(typeof rtFallPill==="function")?`, `((typeof rtFallPill==="function")?`, "rtSlotHTML");
  R("; CHOREDAILY: a daily after 2+ missed days\n", "\n", "rtSlotHTML's comment");
  R(`,dly:(_due&&typeof rtDailyNote==="function"&&day===_todayDay)?rtDailyNote("morning",kid,i,st):""}); });   // CHOREDAILY: Mom's note`, "}); });", "boardStatPop's Morning note");
  R(`const _dl=typeof rtDailyRow==="function"&&day===_todayDay&&rtDailyRow(st), _f=_dl?rtDailyPay(slot,kid,i,st):(typeof rtFallPay==="function")?rtFallPay(st,_ln,kid):(st.pts||0);   // CHOREFALL: a falling row shows both numbers, as on the kid's row; CHOREDAILY: a daily too`,
    `const _f=(typeof rtFallPay==="function")?rtFallPay(st,_ln,kid):(st.pts||0);   // CHOREFALL: a falling row shows both numbers, as on the kid's row`, "boardStatPop's pay");
  R(`,pay:_f,dly:_dl?rtDailyNote(slot,kid,i,st):""}); });`, ",pay:_f}); });", "boardStatPop's note field");
  R(`+((r.dly&&_note&&!r.done&&!r.wv)?'<span style="font-size:10.5px;font-weight:700;color:#6b7280;margin-left:6px;white-space:nowrap">'+r.dly+'</span>':'')+'</span>'+   // CHOREDAILY: "missed 2 days · pays 8 of 10 ⭐"; CHOREWAIT`, "+'</span>'+   // CHOREWAIT", "boardStatPop's note");
  R(`:(typeof rtDailyPay==="function")?rtDailyPay(slot,k,i,steps[i]):((steps[i]||{}).pts||0)); });   // CHOREFALL: a falling row counts what it pays today; CHOREDAILY: a daily too`, ":((steps[i]||{}).pts||0)); });   // CHOREFALL: a falling row counts what it pays today", "kcPointsHTML");
  R(`\n      if(due&&dn===today&&typeof rtDailyPay==="function"){ const f=rtDailyPay(slot,who,idx,st); if(f!==row.pts) row.fall=f; }   // CHOREDAILY: a daily after 2+ missed days`, "", "hhCleanRows");
  // the join stamps (hub's review): whole added lines, and the two pieces inside hhLevelSet's one line
  R("\n  if(typeof rtDailyJoin===\"function\"&&rtDailyJoin(job)) job.from=rtDailyJoin(job);              // CHOREDAILY: a new daily starts today", "", "hhAddSave's stamp");
  R("\n        if(typeof rtDailyJoin===\"function\"&&rtDailyJoin(job)) job.from=rtDailyJoin(job);   // CHOREDAILY: a new daily starts today", "", "hhSyncKids' new-row stamp");
  R(/\n        const _dw=\(typeof rtDailyOn==="function"\)\?rtDailyOn\(j\)\+"\|"\+j\.who\+"\|"\+j\.slot:"";[^\n]*/, "", "hhSyncKids' before");
  R(/\n        if\(_dw&&rtDailyJoin\(j\)&&_dw!=="true\|"\+j\.who[^\n]*/, "", "hhSyncKids' stamp");
  R("\n  if(typeof rtDailyJoin===\"function\"&&rtDailyJoin(j)) set(\"from\",rtDailyJoin(j));               // CHOREDAILY: a daily's new owner starts today", "", "hhGiveTo's stamp");
  R("\n  const _dw=(typeof rtDailyOnIds===\"function\")?rtDailyOnIds():null;   // CHOREDAILY: a level or keep that brings a daily on starts it today", "", "hhSet's before");
  R("\n  if(_dw) rtDailyStampNew(_dw);   // CHOREDAILY\n  householdOnValue(householdData);\n  if(_hhWrite()){ db.ref(\"household/jobs/\"+id+\"/\"+field)", "\n  householdOnValue(householdData);\n  if(_hhWrite()){ db.ref(\"household/jobs/\"+id+\"/\"+field)", "hhSet's stamp");
  R("\n  const _dw=(typeof rtDailyOnIds===\"function\")?rtDailyOnIds():null;   // CHOREDAILY: the dailies a level brings on start today", "", "hhLevelSetFor's before");
  R("\n  if(_dw) rtDailyStampNew(_dw);   // CHOREDAILY", "", "hhLevelSetFor's stamp");
  R(" const _dw=(typeof rtDailyOnIds===\"function\")?rtDailyOnIds():null; householdData.levels=householdData.levels||{}; householdData.levels.cleaning=", " householdData.levels=householdData.levels||{}; householdData.levels.cleaning=", "hhLevelSet's before");
  R("{current:v,at:Date.now()}); if(_dw) rtDailyStampNew(_dw); householdOnValue(", "{current:v,at:Date.now()}); householdOnValue(", "hhLevelSet's stamp");
  if (/CHOREDAILY|rtDaily|RT_DAILY_FROM|_b1|_bd\b/.test(s)) throw new Error("test_chore_daily: the app before still mentions CHOREDAILY");
  const t = path.join(os.tmpdir(), "chore_daily_before_" + process.pid + ".html"); fs.writeFileSync(t, s); return t; })();
const BASE_HJS = (() => { let s = HJS;
  const R = (a, b, l) => { s = once(s, "house.js", a, b, l); };
  R(`    if(due){ if(p<full&&typeof rtDailyRow==="function"&&rtDailyRow(st)){ r.sh=full-p; r.note="paid "+p+" of "+full+" ⭐"; } return r; }   // CHOREDAILY (C5): a daily after 2+ missed days`, "    if(due) return r;", "the ledger's done row");
  R(`    if(D.k===0){ const dl=(typeof rtDailyNote==="function")?rtDailyNote(slot,kid,i,st):""; return Object.assign(r,{ic:"○",note:"not done yet"+(dl?" · "+dl:"")}); }   // CHOREDAILY (C5)`, `    if(D.k===0) return Object.assign(r,{ic:"○",note:"not done yet"});`, "the ledger's open row");
  R(/\n  const _dw=\(typeof rtDailyOn==="function"\)\?rtDailyOn\(j\)\+"\|"\+j\.slot:"";[^\n]*/, "", "hhEditSet's before");
  R(/\n  if\(_dw&&field!=="from"&&rtDailyJoin\(j\)[^\n]*/, "", "hhEditSet's stamp");
  if (/CHOREDAILY|rtDaily/.test(s)) throw new Error("test_chore_daily: the app before's house.js still mentions CHOREDAILY");
  return s; })();
console.log("(the app before: this tree with CHOREDAILY taken out)");

const K = o => Object.assign({ src: { kind: "routine" }, status: "active", area: "cleaning", verdict: "", note: "", level: 1, minutes: 5 }, o);
const FAM = () => ({
  a_cat: K({ label: "Feed the cat", emoji: "🐈", who: "kid_a", slot: "morning", cad: "daily", area: "animals", pts: 10, order: 0 }),
  a_shoes: K({ label: "Pick up shoes", emoji: "👟", who: "kid_a", slot: "afternoon", cad: "daily", pts: 10, order: 1 }),
  a_dish: K({ label: "Unload dishes", emoji: "🍽", who: "kid_a", slot: "chores", cad: "daily", pts: 10, order: 2 }),
  a_bed: K({ label: "Make the bed", emoji: "🛏", who: "kid_a", slot: "chores", cad: "daily", pts: 0, order: 3 }),
  a_room: K({ label: "Tidy the room", emoji: "🧸", who: "kid_a", slot: "evening", cad: "daily", pts: 10, order: 4 }),
  b_plants: K({ label: "Water plants", emoji: "🪴", who: "kid_b", slot: "chores", cad: "daily", pts: 5, order: 0 }),
  b_steps: K({ label: "Sweep steps", emoji: "🧹", who: "kid_b", slot: "chores", cad: "daily", pts: 15, order: 1 }),
  b_count: K({ label: "Wipe counters", emoji: "🧽", who: "kid_b", slot: "chores", cad: "daily", pts: 22, order: 2 }),
  b_nap: K({ label: "Fold napkins", emoji: "🧻", who: "kid_b", slot: "chores", cad: "daily", pts: 10, order: 3 }),
  c_sink: K({ label: "Wipe the sink", emoji: "🚰", who: "kid_c", slot: "chores", cad: "daily", pts: 10, order: 0 }),
  c_table: K({ label: "Set the table", emoji: "🍴", who: "kid_c", slot: "chores", cad: "daily", pts: 10, order: 1 }),
  c_fish: K({ label: "Feed the fish", emoji: "🐟", who: "kid_c", slot: "chores", cad: "daily", pts: 10, order: 2 }),
  c_garden: K({ label: "Water the garden", emoji: "🌱", who: "kid_c", slot: "chores", cad: "daily", pts: 10, order: 3 }),
  d_rake: K({ label: "Rake leaves", emoji: "🍂", who: "kid_d", slot: "chores", cad: "daily", pts: 10, order: 0 })
});
// Sat 11/28 … Wed 12/9; DAY[iso] = its weekday tab
const DATES = []; for (let i = 0; i < 12; i++) { const d = new Date(2026, 10, 28 + i); DATES.push(d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0")); }
const WD = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"], wdOf = iso => WD[new Date(iso + "T12:00:00").getDay()];
const at = (w, iso, h) => { const [y, m, d] = iso.split("-").map(Number); return w.at(y, m, d, h, 0); };
const CAP = "globalThis.__pop='';globalThis.__toast=[];globalThis.__cf=[];document.body.insertAdjacentHTML=function(p,h){ globalThis.__pop=h; };gwShowToast=function(m){ __toast.push(m); };confirm=function(m){ __cf.push(m); return true; };tab='moms-plan';HA_LS.setItem('ha_ledger_hello','1');1";
async function mkWorld(index, hjs, jobs) {
  const w = await W.world({ index, household: { jobs: jobs || FAM(), people: clone(W.PEOPLE), meta: { takeover: 1, engine: { mode: "preview", on: "2026-11-09" } } }, tree: { config: clone(W.FX.db.config) } });
  const A = w.boot("A", "devA", { mom: true }), B = w.boot("B", "devB");
  for (const d of [A, B]) d.run(CAP);
  if (A.run("typeof lgShow") !== "function") A.run(hjs);
  await w.flush(); return { w, A, B };
}
const steps = (d, slot, kid) => JSON.parse(d.run("(function(){ const d0=day; day=_todayDay; try{ return JSON.stringify(" + (slot === "morning" ? "morningStepsFor(" + J(kid) + ")" : "rtStepsFor(" + J(slot) + "," + J(kid) + ",false,day)") + "||[]); } finally{ day=d0; } })()"));
const idxOf = (d, slot, kid, label) => steps(d, slot, kid).findIndex(x => x && x.label === label && x.cad !== "none");
// what a kid's device draws: one list on today's tab, opened
const draw = (d, slot, kid) => d.run("(function(){ const d0=day; day=_todayDay; try{ rtOpen={}; mrOpen={}; return " + (slot === "morning" ? "mrIndividualHTML(" + J(kid) + ")" : "rtSlotHTML(" + J(slot) + "," + J(kid) + ")") + "; } finally{ day=d0; } })()");
const rowOf = (h, label) => String(h).split('<div class="mr-step').filter(x => x.indexOf(label + "<") >= 0 || x.indexOf(label + " <") >= 0)[0] || "";
const pillRaw = (h, label) => { const r = rowOf(h, label); return (r.match(/<span class="(?:mr-pts|cadtag" style="color:#b45309;border-color:#fde68a)">.*?⭐<\/span>/) || [""])[0]; };
const txt = h => String(h || "").replace(/<[^>]+>/g, " ").replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
const pill = (h, label) => txt(pillRaw(h, label));   // "+10 ⭐" · "10 → 8 ⭐"
const PILL = (p, f) => f === p ? "+" + p + " ⭐" : p + " → " + f + " ⭐";
const pop = (d, kid, slot) => d.run("(function(){ let h=''; const b=document.body.insertAdjacentHTML; document.body.insertAdjacentHTML=function(w,x){ h=x; }; try{ boardStatPop(" + J(kid) + "," + J(slot) + ",_todayDay); } finally{ document.body.insertAdjacentHTML=b; } return h; })()");
const popRow = (h, label) => txt(String(h).split('<div style="display:flex;align-items:center;gap:8px;padding:6px 2px').filter(r => r.indexOf(label) >= 0)[0] || "");
const kcLeft = (d, kid) => { const m = /\+(\d+) still to get/.exec(txt(d.run("kcPointsHTML(" + J(kid) + ")"))); return m ? +m[1] : null; };
const hhFall = (d, kid, label) => { const r = JSON.parse(d.run("JSON.stringify(hhCleanRows(" + J(kid) + ",mwTodayIso(),_todayDay).map(function(r){ return {label:r.label,pts:r.pts,fall:r.fall}; }))")).filter(x => x.label === label)[0]; return r ? (r.fall === undefined ? r.pts : r.fall) : "missing"; };
const hhPanel = (d, kid) => d.run("hhCleanPanelHTML(" + J(kid) + ",mwTodayIso(),_todayDay,'House')");
const LG = (d, js) => d.run("(function(){ __pop=''; " + js + "; return __pop; })()");
const ROWSPLIT = '<div style="display:flex;flex-wrap:wrap;align-items:baseline;gap:2px 8px;padding:5px 2px;';
const lgRow = (h, name) => txt(String(h).split(ROWSPLIT).slice(1).map(r => '<div ' + r.split("</div>")[0]).filter(r => r.indexOf(name) >= 0)[0] || "");
// the kid's own tick on today's tab (Morning: toggleMorningStep), Mom's ○ in her pop-up (mdKidTick)
const tick = (d, slot, kid, label) => { const i = idxOf(d, slot, kid, label); if (i < 0) return -1; d.run("(function(){ day=_todayDay; " + (slot === "morning" ? "toggleMorningStep(" + J(kid) + "," + i + ")" : "toggleRtStep(" + J(slot) + "," + J(kid) + "," + i + ")") + "; })()"); return i; };
const momTick = (A, slot, kid, label, dn) => { const i = idxOf(A, slot, kid, label); if (i < 0) return -1; A.run("mdKidTick(" + J(slot) + "," + J(kid) + "," + (dn ? J(dn) : "_todayDay") + "," + i + ")"); return i; };
const adj = (w, kid) => (w.get("bank/" + kid + "/adjustments") || {});
const bal = (w, kid) => Object.values(adj(w, kid)).reduce((s, a) => s + (a && !a.held ? (a.amount || 0) : 0), 0);
const lineAmts = (w, kid, label) => Object.values(adj(w, kid)).filter(a => a && String(a.note || "").indexOf(label) >= 0).map(a => a.amount);
const logs = (w, kid, label) => { const L = (w.get("routineLog/" + kid) || {}), out = []; Object.values(L).forEach(wk => Object.values(wk || {}).forEach(dy => Object.values(dy || {}).forEach(r => { if (r && r.label === label && !r.missed) out.push(r); }))); return out.sort((a, b) => a.at - b.at); };
const writes = (w, m) => w.since(m || 0).map(l => l.op + " " + l.path + " " + (l.keys || []).join(","));
// a row never done from Mon 11/30: what it pays on 11/30 + k (the design's table, rtFallPts steps)
const fallTab = (p, k) => { const n = Math.min(k, 6), s = n > 1 ? n - 1 : 0; if (!s) return p; return Math.max(0, p - Math.max(s, Math.round(p * s / 5))); };
const A_ROWS = [["morning", "Feed the cat"], ["afternoon", "Pick up shoes"], ["chores", "Unload dishes"], ["evening", "Tidy the room"]];
const DUMP = {};

(async () => {
// ── A ──
console.log("\n── A · the function, the blank slate, every payer and display reads it ──");
const { w, A, B } = await mkWorld(IDX, HJS);
ok("the blank slate is one constant, Mon 2026-11-30, read in one function (rtDailyMissed), beside the kid's switch (starFallFrom)", A.run("RT_DAILY_FROM") === "2026-11-30" && A.run("rtDailyMissed.toString()").indexOf("RT_DAILY_FROM") >= 0 && A.run("rtDailyMissed.toString()").indexOf("starFallFrom(kid)") >= 0
  && fs.readFileSync(IDX, "utf8").split("\n").filter(l => !/^\s*\/\//.test(l)).join("\n").split("RT_DAILY_FROM").length - 1 === 2);
ok("what it pays steps with the one function (rtFallPts) and the count less one: rtDailyPay → rtFallPts(p, n−1)", /rtFallPts\(p,n-1\)/.test(A.run("rtDailyPay.toString()")));
ok("every payer and display reads rtDailyPay: toggleRtStep, toggleMorningStep, the lists (rtSlotHTML, mrIndividualHTML), Mom's pop-up, Kids' Corner, the 🧽 house panel",
  ["toggleRtStep", "toggleMorningStep", "rtSlotHTML", "mrIndividualHTML", "boardStatPop", "kcPointsHTML", "hhCleanRows"].every(f => A.run(f + ".toString()").indexOf("rtDailyPay(") >= 0));
ok("which rows: a daily that pays stars; not 0 ⭐, not a weekly, not the plan's own row, not the laundry line, not a rotating job",
  A.run("rtDailyRow({cad:'daily',pts:10})&&rtDailyRow({pts:5})&&!rtDailyRow({cad:'daily',pts:0})&&!rtDailyRow({cad:'wk:1',pts:10})&&!rtDailyRow({cad:'asneeded',pts:10})&&!rtDailyRow({cad:'daily',pts:10,house:'x'})&&!rtDailyRow({cad:'daily',pts:10,line:'x',laundry:true})&&!rtDailyRow({cad:'daily',pts:10,rot:'pick'})") === true);

// ── the replay ──
const S = { a: {}, b: {}, c: {}, d: {}, pay: {}, misc: {} };
const payOf = async (key, fn, kid, label) => { const b0 = bal(w, kid), l0 = lineAmts(w, kid, label).length, g0 = logs(w, kid, label).length; fn(); await w.flush();
  const ln = lineAmts(w, kid, label), lg = logs(w, kid, label).slice(g0); S.pay[key] = { paid: bal(w, kid) - b0, line: ln.length > l0 ? ln[ln.length - 1] : null, nLines: ln.length - l0, log: lg.length ? lg[lg.length - 1].pts : null, act: lg.length ? lg[lg.length - 1].act : null }; return S.pay[key]; };
const recPts = (d, slot, kid, i, dn) => d.run("(function(){ const r=slState[activeWk()+'_'+" + (dn ? J(dn) : "_todayDay") + "+'_" + kid + "_" + (slot === "morning" ? "m" : slot.charAt(0)) + "step" + i + "']; return r?r.pts:null; })()");
const ALLB = ["Water plants", "Sweep steps", "Wipe counters", "Fold napkins"], ALLC = ["Wipe the sink", "Set the table", "Feed the fish", "Water the garden"];
for (const iso of DATES) {
  const wd = wdOf(iso);
  // 7 AM: the switches (📒 Ledger ⚙ on Mom's device) and 😷 Kid Off
  await at(w, iso, 7);
  if (iso === "2026-12-02") { A.run("lgRuleFall('kid_d')"); await w.flush(); S.misc.fallOff = J(w.get("household/meta/starRules")); }
  if (iso === "2026-12-06") { A.run("db.ref('calendar/kidOverrides/kid_c/2026-12-06').set({school:false,note:'Day off'})"); await w.flush(); S.misc.kidOff = B.run("JSON.stringify(calendarData.kidOverrides.kid_c)"); }
  if (iso === "2026-12-03") { A.run("lgRuleFall('kid_d')"); await w.flush(); S.misc.fallOn = J(w.get("household/meta/starRules")); }
  for (const kid of ["kid_a", "kid_b", "kid_c", "kid_d"]) { draw(B, "chores", kid); draw(A, "chores", kid); } await w.flush();   // a kid opens a list in the morning: last week's check-offs load (the lists' own _loadPrevSl), as on a real device
  // 8 PM: every list open
  await at(w, iso, 20);
  (S.misc.wk = S.misc.wk || {})[iso] = B.run("activeWk()+' '+routineDateISO('monday')+' '+(prevSlState&&_prevSlWk===_prevWkKey()?'prev':'-')");
  const a = S.a[iso] = { lists: {}, mom: {}, kid: {}, kc: kcLeft(B, "kid_a"), hh: hhFall(B, "kid_a", "Unload dishes") };
  for (const [slot] of A_ROWS) { a.lists[slot] = draw(B, slot, "kid_a"); a.mom[slot] = pop(A, "kid_a", slot); a.kid[slot] = pop(B, "kid_a", slot); }
  a.ledger = LG(A, "lgGo('kid_a',0,0)"); A.run("lgClose();1");
  if (iso === "2026-12-02") { DUMP.panel = hhPanel(B, "kid_a"); DUMP.kc = B.run("kcPointsHTML('kid_a')"); }
  S.b[iso] = { list: draw(B, "chores", "kid_b"), mom: pop(A, "kid_b", "chores"), kc: kcLeft(B, "kid_b") };
  S.c[iso] = { list: draw(B, "chores", "kid_c") }; S.d[iso] = { list: draw(B, "chores", "kid_d") };
  // kid_c: Mom's ✕ today on Wipe the sink (Wed), 🌅 Water the garden (Wed); the ➖ Excuse of Wednesday's Set the table, made Thursday
  if (iso === "2026-12-02") { const i = idxOf(A, "chores", "kid_c", "Wipe the sink"); A.run("rtWave('chores','kid_c',_todayDay," + i + ")"); const g = idxOf(A, "chores", "kid_c", "Water the garden"); S.misc.sent = A.run("amSend('chores','kid_c',_todayDay," + g + ")"); await w.flush(); }
  if (iso === "2026-12-03") { const i = idxOf(A, "chores", "kid_c", "Set the table"); S.misc.xBefore = J([i, B.run("JSON.stringify(wavedData[activeWk()]||null)")]); A.run("(function(){ const st=rtStepsFor('chores','kid_c',false,'wednesday')[" + i + "]; rtWave('chores','kid_c','wednesday'," + i + ",activeWk(),st); })()"); await w.flush(); S.c[iso].after = draw(B, "chores", "kid_c"); S.misc.xAfter = B.run("JSON.stringify(wavedData[activeWk()]||null)"); }
  // kid_a: on Tue 12/8 every row is done (kept); every other day each paying row is ticked and un-ticked (what a tick pays, and back)
  for (const [slot, label] of A_ROWS) {
    const keep = iso === "2026-12-08";
    const on = await payOf("a " + slot + " " + iso, () => tick(B, slot, "kid_a", label), "kid_a", label); on.rec = recPts(B, slot, "kid_a", idxOf(B, slot, "kid_a", label));
    if (iso === "2026-12-02") DUMP.doneRow = DUMP.doneRow || draw(B, "chores", "kid_a");
    if (!keep) await payOf("a " + slot + " " + iso + " off", () => tick(B, slot, "kid_a", label), "kid_a", label); }
  { const on = await payOf("a bed " + iso, () => tick(B, "chores", "kid_a", "Make the bed"), "kid_a", "Make the bed"); if (iso !== "2026-12-08") await payOf("a bed " + iso + " off", () => tick(B, "chores", "kid_a", "Make the bed"), "kid_a", "Make the bed"); void on; }
  // kid_b: the 5 and 22 by the kid, the 15 by Mom's ○ (and her ○ again to undo); Fold napkins done Tue / Thu / Sat
  await payOf("b 5 " + iso, () => tick(B, "chores", "kid_b", "Water plants"), "kid_b", "Water plants"); await payOf("b 5 " + iso + " off", () => tick(B, "chores", "kid_b", "Water plants"), "kid_b", "Water plants");
  await payOf("b 22 " + iso, () => tick(B, "chores", "kid_b", "Wipe counters"), "kid_b", "Wipe counters"); await payOf("b 22 " + iso + " off", () => tick(B, "chores", "kid_b", "Wipe counters"), "kid_b", "Wipe counters");
  await payOf("b 15 " + iso, () => momTick(A, "chores", "kid_b", "Sweep steps"), "kid_b", "Sweep steps"); await payOf("b 15 " + iso + " off", () => momTick(A, "chores", "kid_b", "Sweep steps"), "kid_b", "Sweep steps");
  if (["tuesday", "thursday", "saturday"].indexOf(wd) >= 0 && iso >= "2026-12-01" && iso <= "2026-12-05") await payOf("b nap " + iso, () => tick(B, "chores", "kid_b", "Fold napkins"), "kid_b", "Fold napkins");
  // kid_d: ticks Rake leaves on Sun 12/6 (it pays 6); Mom undoes it Monday on Sunday's tab
  if (iso === "2026-12-06") { await payOf("d rake", () => tick(B, "chores", "kid_d", "Rake leaves"), "kid_d", "Rake leaves"); S.misc.dLedger = LG(A, "lgGo('kid_d',0,0)"); A.run("lgClose();1"); S.misc.dRow = draw(B, "chores", "kid_d"); }
  if (iso === "2026-12-07") { S.misc.dMon = pill(S.d[iso].list, "Rake leaves"); await payOf("d rake off", () => A.run("choreUndo('chores','kid_d','sunday'," + idxOf(A, "chores", "kid_d", "Rake leaves") + ")"), "kid_d", "Rake leaves"); }
}
S.misc.bankAll = ["kid_a", "kid_b", "kid_c", "kid_d"].map(k => Object.values(adj(w, k)));
S.misc.amCarry = J(w.get("amCarry/kid_c"));

// ── cost (printed, not checked): Wed 12/9 at 8 PM, Wipe counters never done (six days back, three of them in last week) ──
await at(w, "2026-12-09", 20); draw(B, "chores", "kid_b"); await w.flush();
{ const T = (js, N) => { B.run("(function(){ day=_todayDay; const st=rtStepsFor('chores','kid_b',false,day); for(let j=0;j<20;j++){ " + js + " } })()"); const t = process.hrtime.bigint(); B.run("(function(){ day=_todayDay; const st=rtStepsFor('chores','kid_b',false,day); for(let j=0;j<" + N + ";j++){ " + js + " } })()"); return Number(process.hrtime.bigint() - t) / 1e6 / N; };
  const C = { n: B.run("(function(){ day=_todayDay; return rtDailyMissed('chores','kid_b',2,rtStepsFor('chores','kid_b',false,day)[2]); })()"), call: T("rtDailyMissed('chores','kid_b',j%3,st[j%3]);", 30000), draw: T("rtOpen={}; rtSlotHTML('chores','kid_b');", 2000), kc: T("kcPointsHTML('kid_b');", 300) };
  B.run("globalThis.__k=rtDailyPay; rtDailyPay=undefined;1"); C.drawOff = T("rtOpen={}; rtSlotHTML('chores','kid_b');", 2000); C.kcOff = T("kcPointsHTML('kid_b');", 300); B.run("rtDailyPay=__k;1");
  console.log("  (cost on this machine, Node: one count " + (C.call * 1000).toFixed(1) + " µs (n=" + C.n + "); kid_b's Chores list (4 rows) " + C.draw.toFixed(3) + " ms vs " + C.drawOff.toFixed(3) + " ms without C5; Kids' Corner " + C.kc.toFixed(2) + " ms vs " + C.kcOff.toFixed(2) + " ms)"); S.misc.cost = C; }

// ── B ──
console.log("\n── B · the design's table, never done from Mon 11/30: 10, 10, 8, 6, 4, 2, 0, then 0 until done once, then 10 the next day ──");
const EXP10 = { "2026-11-28": 10, "2026-11-29": 10 }; DATES.slice(2).forEach((iso, k) => { EXP10[iso] = iso <= "2026-12-08" ? fallTab(10, k) : 10; });
ok("the expected row (Sat 11/28 … Wed 12/9): " + DATES.map(d => EXP10[d]).join(", "), J(DATES.map(d => EXP10[d])) === J([10, 10, 10, 10, 8, 6, 4, 2, 0, 0, 0, 10]));
for (const [slot, label] of A_ROWS) {
  const got = DATES.map(iso => pill(S.a[iso].lists[slot], label)), exp = DATES.map(iso => PILL(10, EXP10[iso]));
  ok(slot + " · " + label + ": the kid's row each day " + got.join(" | "), J(got) === J(exp), { got, exp });
  const paid = DATES.map(iso => S.pay["a " + slot + " " + iso]);
  ok("…a tick pays it (the bank, the bank line, the log line and the stored check-off the same; no line at 0)", paid.every((p, k) => { const e = EXP10[DATES[k]]; return p.paid === e && (e > 0 ? p.line === e && p.nLines === 1 : p.nLines === 0) && p.log === e && p.act === "on" && p.rec === e; }), paid.map(p => [p.paid, p.line, p.log, p.rec]));
}
ok("the week really changes on Sun 11/29 and Sun 12/6 (its Monday = the next day), and from 12/6 last week's check-offs are on the kid's device", (() => { const W0 = DATES.map(d => S.misc.wk[d].split(" ")); return W0[0][0] !== W0[1][0] && W0[7][0] === W0[1][0] && W0[8][0] !== W0[7][0] && W0[8][1] === "2026-12-07" && W0[1][1] === "2026-11-30" && W0.slice(8).every(x => x[2] === "prev"); })(), S.misc.wk);
ok("the 0 ⭐ the kid ticks on Tue 12/8 writes no bank line; the stored check-off says 0 (\"10 → 0 ⭐\" before it)", S.pay["a chores 2026-12-08"].nLines === 0 && S.pay["a chores 2026-12-08"].rec === 0 && pill(S.a["2026-12-08"].lists.chores, "Unload dishes") === "10 → 0 ⭐");
ok("the week boundary: Sun 12/6 and Mon 12/7 count back across Sunday into the week before (Sat 12/5 …) — 0, 0", S.pay["a evening 2026-12-06"].paid === 0 && S.pay["a evening 2026-12-07"].paid === 0 && pill(S.a["2026-12-06"].lists.evening, "Tidy the room") === "10 → 0 ⭐");
ok("the Morning row keeps its tag look with both numbers (Wed: \"10 → 8 ⭐\" in the yellow tag)", /<span class="cadtag" style="color:#b45309;border-color:#fde68a"><s style="opacity:\.6">10<\/s> → 8 ⭐<\/span>/.test(S.a["2026-12-02"].lists.morning));
ok("a done row keeps what it paid (Tue 12/8 done at 0: still \"10 → 0 ⭐\"; the next day \"+10 ⭐\")", pill(DUMP.doneRow, "Unload dishes") === "10 → 8 ⭐" && pill(S.a["2026-12-09"].lists.chores, "Unload dishes") === "+10 ⭐");
// every display agrees with the pay, each day
const agree = DATES.map(iso => { const e = EXP10[iso], a = S.a[iso];
  const momC = popRow(a.mom.chores, "Unload dishes"), kidC = popRow(a.kid.chores, "Unload dishes");
  return { iso, e, momC, kidC, kc: a.kc, hh: a.hh, ok: momC.indexOf(e === 10 ? "Unload dishes +10 ⭐" : "Unload dishes 10 → " + e + " ⭐") >= 0 && kidC.indexOf(e === 10 ? "Unload dishes +10 ⭐" : "Unload dishes 10 → " + e + " ⭐") >= 0 && a.hh === e
    && ["afternoon", "evening"].every(s => popRow(a.mom[s], A_ROWS.filter(r => r[0] === s)[0][1]).indexOf(e === 10 ? "+10 ⭐" : "10 → " + e + " ⭐") >= 0) }; });
ok("every display says the same number each day: Mom's pop-up and a kid's pop-up (\"Unload dishes 10 → 8 ⭐\"), the Afternoon and Evening pop-ups, the 🧽 house panel", agree.every(x => x.ok), agree.filter(x => !x.ok));
ok("Kids' Corner \"still to get\" counts what the four rows pay today (4 × the table: 40, 40, 40, 40, 32, 24, 16, 8, 0, 0, 0, 40)", J(DATES.map(iso => S.a[iso].kc)) === J(DATES.map(iso => 4 * EXP10[iso] || null)), DATES.map(iso => S.a[iso].kc));
const noteOf = (h, label) => { const r = popRow(h, label); const m = /missed \d+ days · pays \d+ of \d+ ⭐/.exec(r); return m ? m[0] : ""; };
ok("Mom's Kids today pop-up note: Wed \"missed 2 days · pays 8 of 10 ⭐\", Thu \"missed 3 days · pays 6 of 10 ⭐\", Sun \"missed 6 days · pays 0 of 10 ⭐\"; none on 10 ⭐ days",
  noteOf(S.a["2026-12-02"].mom.chores, "Unload dishes") === "missed 2 days · pays 8 of 10 ⭐" && noteOf(S.a["2026-12-03"].mom.chores, "Unload dishes") === "missed 3 days · pays 6 of 10 ⭐" && noteOf(S.a["2026-12-06"].mom.chores, "Unload dishes") === "missed 6 days · pays 0 of 10 ⭐"
  && ["2026-11-30", "2026-12-01", "2026-12-09"].every(iso => !/missed|pays/.test(txt(S.a[iso].mom.chores))), [popRow(S.a["2026-12-02"].mom.chores, "Unload dishes"), popRow(S.a["2026-12-01"].mom.chores, "Unload dishes")]);
ok("…the Morning, Afternoon and Evening pop-ups the same note (Wed)", ["morning", "afternoon", "evening"].every(s => noteOf(S.a["2026-12-02"].mom[s], A_ROWS.filter(r => r[0] === s)[0][1]) === "missed 2 days · pays 8 of 10 ⭐"), ["morning", "afternoon", "evening"].map(s => popRow(S.a["2026-12-02"].mom[s], A_ROWS.filter(r => r[0] === s)[0][1])));
ok("a kid's device opening the same pop-up: both numbers, no note (no \"missed\", no \"pays\")", DATES.every(iso => ["morning", "afternoon", "chores", "evening"].every(s => !/missed|pays/.test(txt(S.a[iso].kid[s])))));
ok("no kid list says why: no \"missed\", \"late\", \"pays\" on any row of kid_a … kid_d, any day", DATES.every(iso => !/missed|late|pays/i.test(txt(Object.values(S.a[iso].lists).join("") + S.b[iso].list + S.c[iso].list + S.d[iso].list))));

// ── C ──
console.log("\n── C · rounding: 5, 15 and 22 ⭐ (the same steps as every chore) ──");
for (const [v, label, by] of [[5, "Water plants", "the kid"], [15, "Sweep steps", "Mom's ○"], [22, "Wipe counters", "the kid"]]) {
  const exp = DATES.map(iso => iso < "2026-11-30" ? v : fallTab(v, DATES.indexOf(iso) - 2)), got = DATES.map(iso => pill(S.b[iso].list, label)), paid = DATES.map(iso => S.pay["b " + v + " " + iso].paid);
  ok(v + " ⭐ (" + by + "): " + exp.join(", "), J(got) === J(exp.map(e => PILL(v, e))) && J(paid) === J(exp), { got, paid }); }
ok("…Mom's ○ in her pop-up pays what the kid's tick would (Sweep steps, Wed: 12; the row in her pop-up \"Sweep steps 15 → 12 ⭐\" and the note)", S.pay["b 15 2026-12-02"].paid === 12 && /Sweep steps 15 → 12 ⭐ missed 2 days · pays 12 of 15 ⭐/.test(popRow(S.b["2026-12-02"].mom, "Sweep steps")), popRow(S.b["2026-12-02"].mom, "Sweep steps"));

// ── D ──
console.log("\n── D · missed / done / missed / done changes nothing ──");
const nap = DATES.slice(2, 10).map(iso => pill(S.b[iso].list, "Fold napkins")), napPaid = ["2026-12-01", "2026-12-03", "2026-12-05"].map(iso => (S.pay["b nap " + iso] || {}).paid);
ok("Fold napkins, missed Mon, done Tue, missed Wed, done Thu, missed Fri, done Sat (11/30 … 12/7): \"+10 ⭐\" every day, each tick pays 10", nap.every(p => p === "+10 ⭐") && J(napPaid) === J([10, 10, 10]), { nap, napPaid });
ok("…then missed Sun and Mon: Tuesday's row is \"10 → 8 ⭐\", Wednesday's \"10 → 6 ⭐\" (the rule still holds for it)", pill(S.b["2026-12-08"].list, "Fold napkins") === "10 → 8 ⭐" && pill(S.b["2026-12-09"].list, "Fold napkins") === "10 → 6 ⭐");

// ── E ──
console.log("\n── E · not a miss, and the count starts over: ✕ today, ➖ Excuse, 😷 Kid Off, 🌅 sent ──");
const cRow = (iso, label, k) => pill((k && S.c[iso][k]) || S.c[iso].list, label);
const cWeek = label => ["2026-12-02", "2026-12-03", "2026-12-04", "2026-12-05"].map(iso => cRow(iso, label));
ok("every kid_c row on Wed 12/2 before Mom acts (missed Mon, Tue): \"10 → 8 ⭐\"", ALLC.every(l => cRow("2026-12-02", l) === "10 → 8 ⭐"), ALLC.map(l => cRow("2026-12-02", l)));
ok("✕ today on Wednesday (Wipe the sink): Thu \"+10\", Fri \"+10\" (Thursday a first miss), Sat \"10 → 8\"", J(cWeek("Wipe the sink").slice(1)) === J(["+10 ⭐", "+10 ⭐", "10 → 8 ⭐"]), cWeek("Wipe the sink"));
ok("➖ Excuse of Wednesday made on Thursday (Set the table): Thursday \"10 → 6 ⭐\" before, \"+10 ⭐\" after; Fri \"+10\", Sat \"10 → 8\"", cRow("2026-12-03", "Set the table") === "10 → 6 ⭐" && cRow("2026-12-03", "Set the table", "after") === "+10 ⭐" && J(cWeek("Set the table").slice(2)) === J(["+10 ⭐", "10 → 8 ⭐"]), [cRow("2026-12-03", "Set the table"), cRow("2026-12-03", "Set the table", "after"), cWeek("Set the table"), S.misc.xBefore, S.misc.xAfter]);
ok("Feed the fish (nothing done, nothing excused): Wed 8, Thu 6, Fri 4, Sat 2, Sun 0", J(cWeek("Feed the fish").concat([cRow("2026-12-06", "Feed the fish")])) === J(["10 → 8 ⭐", "10 → 6 ⭐", "10 → 4 ⭐", "10 → 2 ⭐", "10 → 0 ⭐"]), cWeek("Feed the fish"));
ok("😷 Kid Off on Sun 12/6 (calendar/kidOverrides/kid_c school:false): every kid_c row Mon \"+10\", Tue \"+10\", Wed 12/9 \"10 → 8\" (Feed the fish from \"10 → 0\")", /"2026-12-06":\{"school":false,"note":"Day off"\}/.test(S.misc.kidOff) && ALLC.every(l => J(["2026-12-07", "2026-12-08", "2026-12-09"].map(iso => cRow(iso, l))) === J(["+10 ⭐", "+10 ⭐", "10 → 8 ⭐"])), [S.misc.kidOff, ALLC.map(l => ["2026-12-06", "2026-12-07", "2026-12-08", "2026-12-09"].map(iso => cRow(iso, l)))]);
ok("🌅 sent to the next morning on Wednesday: Water the garden Thu \"+10\", Fri \"+10\", Sat \"10 → 8\"", S.misc.sent === true && /2026-12-02_cstep3/.test(S.misc.amCarry) && J(cWeek("Water the garden").slice(1)) === J(["+10 ⭐", "+10 ⭐", "10 → 8 ⭐"]), [S.misc.sent, cWeek("Water the garden")]);

// ── F ──
console.log("\n── F · the per-kid \"Stars fall when late\" switch covers it; on again does not reach back ──");
const dW = ["2026-12-01", "2026-12-02", "2026-12-03", "2026-12-04", "2026-12-05", "2026-12-06"].map(iso => pill(S.d[iso].list, "Rake leaves"));
ok("kid_d's switch Off on Wed (household/meta/starRules/fall/kid_d = {on:false}): Wednesday \"+10 ⭐\" while kid_a's row says \"10 → 8 ⭐\" the same day", /"fall":\{"kid_d":\{"on":false\}\}/.test(S.misc.fallOff) && dW[1] === "+10 ⭐" && pill(S.a["2026-12-02"].lists.chores, "Unload dishes") === "10 → 8 ⭐", [S.misc.fallOff, dW]);
ok("On again Thursday ({from:\"2026-12-03\"}): Thu \"+10\", Fri \"+10\" (the misses before the flip do not count), Sat \"10 → 8\", Sun \"10 → 6\"", /"kid_d":\{"from":"2026-12-03"\}/.test(S.misc.fallOn) && J(dW.slice(2)) === J(["+10 ⭐", "+10 ⭐", "10 → 8 ⭐", "10 → 6 ⭐"]), [S.misc.fallOn, dW]);

// ── G ──
console.log("\n── G · ⏸ Pause for everyone covers it the same way ──");
{ const P = await mkWorld(IDX, HJS, { a_dish: FAM().a_dish, b_nap: K({ label: "Fold napkins", who: "kid_b", slot: "chores", cad: "daily", pts: 10, order: 0 }) }); const got = {}, gotB = {};
  for (const iso of DATES.slice(2, 8)) { await at(P.w, iso, 7); if (iso === "2026-12-02" || iso === "2026-12-03") { P.A.run("lgRulePause()"); await P.w.flush(); got["sr" + iso] = J(P.w.get("household/meta/starRules")); }
    await at(P.w, iso, 20); got[iso] = pill(draw(P.B, "chores", "kid_a"), "Unload dishes"); gotB[iso] = pill(draw(P.B, "chores", "kid_b"), "Fold napkins");
    if (iso === "2026-12-02") got.tick = await (async () => { const b0 = bal(P.w, "kid_a"); tick(P.B, "chores", "kid_a", "Unload dishes"); await P.w.flush(); const d = bal(P.w, "kid_a") - b0; tick(P.B, "chores", "kid_a", "Unload dishes"); await P.w.flush(); return d; })(); }
  ok("⏸ on Wednesday: \"+10 ⭐\" for every kid, a tick pays 10; ⏸ off Thursday: Thu, Fri \"+10\", Sat \"10 → 8\"", /"pause":\{"on":true\}/.test(got["sr2026-12-02"]) && /"pause":\{"from":"2026-12-03"\}/.test(got["sr2026-12-03"]) && got["2026-12-01"] === "+10 ⭐" && got["2026-12-02"] === "+10 ⭐" && gotB["2026-12-02"] === "+10 ⭐" && got.tick === 10
    && J(["2026-12-03", "2026-12-04", "2026-12-05"].map(d => got[d])) === J(["+10 ⭐", "+10 ⭐", "10 → 8 ⭐"]) && gotB["2026-12-05"] === "10 → 8 ⭐", got); }

// ── H ──
console.log("\n── H · un-tick takes back exactly what was paid ──");
const offs = DATES.filter(iso => iso !== "2026-12-08").map(iso => [S.pay["a chores " + iso], S.pay["a chores " + iso + " off"]]);
ok("the kid's own un-tick, every day: −what the tick paid, the bank line gone, the \"off\" log line carries it", offs.every(([on, off]) => off.paid === -on.paid && off.nLines === -(on.paid > 0 ? 1 : 0) && off.act === "off" && off.log === on.paid), offs.map(([a, b]) => [a.paid, b.paid, b.nLines, b.log]));
const bOffs = DATES.map(iso => [S.pay["b 15 " + iso], S.pay["b 15 " + iso + " off"]]);
ok("Mom's ○ again in her pop-up (15 ⭐, every day): −what it paid, to the cent", bOffs.every(([on, off]) => off.paid === -on.paid && off.log === on.paid), bOffs.map(([a, b]) => [a.paid, b.paid]));
ok("kid_d ticks Rake leaves Sun 12/6: +6; Mom undoes it Monday on Sunday's tab (Monday's own row \"+10 ⭐\", a fresh tick would pay 10): −6", S.pay["d rake"].paid === 6 && S.pay["d rake"].line === 6 && S.misc.dMon === "+10 ⭐" && S.pay["d rake off"].paid === -6 && S.pay["d rake off"].log === 6, [S.pay["d rake"], S.misc.dMon, S.pay["d rake off"]]);

// ── I ──
console.log("\n── I · nothing is ever taken: a 0 ⭐ daily, the banks ──");
ok("Make the bed (0 ⭐, missed every day): no pill, a tick writes no bank line and logs 0, every day", DATES.every(iso => !/⭐/.test(rowOf(S.a[iso].lists.chores, "Make the bed")) && S.pay["a bed " + iso].nLines === 0 && S.pay["a bed " + iso].paid === 0 && S.pay["a bed " + iso].log === 0));
ok("every bank line written in the replay is a tick's pay or Mom's undo of one: no line takes stars for a miss (all > 0, or Mom's undo note)", S.misc.bankAll.every(L => L.every(a => a.amount > 0 || /undo|↩|unchecked/i.test(a.note || ""))), S.misc.bankAll.map(L => L.filter(a => !(a.amount > 0)).map(a => [a.note, a.amount])));

// ── J ──
console.log("\n── J · dry-run writes nothing ──");
{ const Dr = w.boot("Dr", "devDr", { mom: true }); Dr.run(CAP); Dr.run(HJS); Dr.run("HA_LS.setItem('ha_dryrun','1');1"); await w.flush(); await at(w, "2026-12-09", 20); draw(Dr, "chores", "kid_b"); await w.flush();
  const m = w.mark(), b0 = J(w.db.tree.root), o = {};
  for (const kid of ["kid_a", "kid_b"]) for (const slot of ["morning", "afternoon", "chores", "evening"]) { o[kid + slot] = draw(Dr, slot, kid); o["pop" + kid + slot] = pop(Dr, kid, slot); }
  o.kc = Dr.run("kcPointsHTML('kid_b')"); o.hh = hhPanel(Dr, "kid_b"); o.lg = LG(Dr, "lgGo('kid_b',0,0)"); await w.flush();
  ok("?dryrun=1 (Mom's device): every list, pop-up, Kids' Corner, the 🧽 house panel and the ledger work out the lower pay (\"22 → 0 ⭐\") and write nothing", Dr.run("_dryRun()") === true && pill(o.kid_bchores, "Wipe counters") === "22 → 0 ⭐" && /pays 0 of 22 ⭐/.test(txt(o.popkid_bchores)) && w.since(m).length === 0 && J(w.db.tree.root) === b0, [pill(o.kid_bchores, "Wipe counters"), writes(w, m)]); }

// ── K ──
console.log("\n── K · the 📒 Ledger and 📊 How often ──");
ok("Mom's 📒 Ledger, today's open row: \"not done yet · missed 2 days · pays 8 of 10 ⭐\" (Wed)", /Unload dishes not done yet · missed 2 days · pays 8 of 10 ⭐/.test(lgRow(S.a["2026-12-02"].ledger, "Unload dishes")) && /Tidy the room not done yet · missed 2 days · pays 8 of 10 ⭐/.test(lgRow(S.a["2026-12-02"].ledger, "Tidy the room")), lgRow(S.a["2026-12-02"].ledger, "Unload dishes"));
ok("…a 10 ⭐ day says only \"not done yet\" (Tue 12/1)", /^○ 🍽 Unload dishes not done yet 10 ⭐/.test(lgRow(S.a["2026-12-01"].ledger, "Unload dishes")) && !/missed|pays/.test(lgRow(S.a["2026-12-01"].ledger, "Unload dishes")), lgRow(S.a["2026-12-01"].ledger, "Unload dishes"));
ok("…a done row that paid less: \"✅ Rake leaves paid 6 of 10 ⭐ +6 ⭐\", and the day's \"fell short 4 ⭐\"", /^✅ 🍂 Rake leaves paid 6 of 10 ⭐ \+6 ⭐/.test(lgRow(S.misc.dLedger, "Rake leaves")) && /fell short 4 ⭐/.test(txt(S.misc.dLedger)), [lgRow(S.misc.dLedger, "Rake leaves"), txt(S.misc.dLedger).slice(0, 200)]);

// ── N, P: a row that joins a list, and a row whose place moves ──
// kid_a 🧹 Sweep porch (never done) · Feed the dog (done every day) · Fold towels (never done) · Wipe the stove (Level 3: off the list)
// kid_b 🧹 Wipe the door (Fridays, turned daily Wed) · Polish shoes (Level 3, put at Level 1 Wed) · Dust the TV (added Wed)
// kid_c 🧹 Water the fern (done every day by kid_c; given to kid_d Wed) · kid_d 🧹 Rake leaves (done every day)
// Wed 12/2 7 AM Mom: + Add (Dust the TV), Wipe the door → Daily, Water the fern → Give to kid_d, Kid A to Level 3, Polish shoes → Level 1.
// Then Mom's Chores & Stars editor on kid_a's list: Wed 8:30 PM a row put in between Sweep porch and Feed the dog, Thu 8:30 PM taken out
// again, Fri 8:30 PM Feed the dog and Fold towels swapped.
{ const JN = () => ({
    a_sweep: K({ label: "Sweep porch", emoji: "🧹", who: "kid_a", slot: "chores", cad: "daily", pts: 10, order: 0 }),
    a_dog: K({ label: "Feed the dog", emoji: "🐶", who: "kid_a", slot: "chores", cad: "daily", pts: 10, area: "animals", order: 1 }),
    a_towel: K({ label: "Fold towels", emoji: "🧺", who: "kid_a", slot: "chores", cad: "daily", pts: 10, order: 2 }),
    a_stove: K({ label: "Wipe the stove", emoji: "🍳", who: "kid_a", slot: "chores", cad: "daily", pts: 10, level: 3, order: 3 }),
    b_door: K({ label: "Wipe the door", emoji: "🚪", who: "kid_b", slot: "chores", cad: "wk:4", pts: 10, order: 0 }),
    b_shoe: K({ label: "Polish shoes", emoji: "👞", who: "kid_b", slot: "chores", cad: "daily", pts: 10, level: 3, order: 1 }),
    c_fern: K({ label: "Water the fern", emoji: "🪴", who: "kid_c", slot: "chores", cad: "daily", pts: 10, area: "animals", order: 0 }),
    d_rake: K({ label: "Rake leaves", emoji: "🍂", who: "kid_d", slot: "chores", cad: "daily", pts: 10, area: "animals", order: 0 }) });
  const X = await mkWorld(IDX, HJS, JN()), R = {}, pay = {};
  const EDITOR = js => X.A.run("(function(){ const a=routineCfg2.chores.kid_a; " + js + " hhSyncKids(); return a.map(function(s){ return s.label; }).join('|'); })()");
  for (const iso of DATES.slice(0, 9)) {
    await at(X.w, iso, 7);
    if (iso === "2026-12-02") { const j = clone(X.w.get("household/jobs"));
      X.A.run("Object.assign(hhAdd,{who:'kid_b',slot:'chores',cad:'daily',kind:'chore',label:'Dust the TV',emoji:'📺',pts:'10',area:'cleaning',level:0,room:'any',can:{}}); document.getElementById('hh-add-label').value='Dust the TV'; document.getElementById('hh-add-emoji').value='📺'; document.getElementById('hh-add-pts').value='10'; hhAddSave()");
      X.A.run("hhEditSet('b_door','cad','daily')"); X.A.run("hhGiveTo('c_fern','kid_d')"); X.A.run("hhLevelSetFor('kid_a',3)"); X.A.run("hhEditSet('b_shoe','level',1)"); await X.w.flush();
      R.jobsWed = X.w.get("household/jobs"); R.jobsBefore = j; }
    for (const kid of ["kid_a", "kid_b", "kid_c", "kid_d"]) { draw(X.B, "chores", kid); draw(X.A, "chores", kid); } await X.w.flush();
    await at(X.w, iso, 20);
    R[iso] = { a: draw(X.B, "chores", "kid_a"), b: draw(X.B, "chores", "kid_b"), d: draw(X.B, "chores", "kid_d"), momA: pop(X.A, "kid_a", "chores") };
    pay["dog " + iso] = await (async () => { const b0 = bal(X.w, "kid_a"); tick(X.B, "chores", "kid_a", "Feed the dog"); await X.w.flush(); return bal(X.w, "kid_a") - b0; })();
    if (iso < "2026-12-02") tick(X.B, "chores", "kid_c", "Water the fern");
    tick(X.B, "chores", "kid_d", "Rake leaves"); await X.w.flush();
    if (iso === "2026-12-02") R.ins = EDITOR("a.splice(1,0,{label:'Wipe the table',emoji:'🧽',pts:5,cad:'daily'});");
    if (iso === "2026-12-03") R.del = EDITOR("a.splice(a.findIndex(function(s){ return s.label==='Wipe the table'; }),1);");
    if (iso === "2026-12-04") R.swap = EDITOR("const i=a.findIndex(function(s){ return s.label==='Feed the dog'; }), k=a.findIndex(function(s){ return s.label==='Fold towels'; }), t=a[i]; a[i]=a[k]; a[k]=t;");
    await X.w.flush(); }
  const WTF = ["2026-12-02", "2026-12-03", "2026-12-04"], P3 = (h, l) => WTF.map(d => pill(R[d][h], l));
  console.log("\n── N · a daily row that joins a list starts that day (no walk back over days it was not that kid's daily) ──");
  ok("+ Add a paying daily on Wed (Dust the TV, kid_b, never done): Wed \"+10\", Thu \"+10\", Fri \"10 → 8\"", J(P3("b", "Dust the TV")) === J(["+10 ⭐", "+10 ⭐", "10 → 8 ⭐"]), P3("b", "Dust the TV"));
  ok("a Fridays chore turned Daily on Wed (Wipe the door): Wed \"+10\", Thu \"+10\", Fri \"10 → 8\"", J(P3("b", "Wipe the door")) === J(["+10 ⭐", "+10 ⭐", "10 → 8 ⭐"]), P3("b", "Wipe the door"));
  ok("a daily given to another kid on Wed (Water the fern → kid_d, who never does it): Wed \"+10\", Thu \"+10\", Fri \"10 → 8\"", J(P3("d", "Water the fern")) === J(["+10 ⭐", "+10 ⭐", "10 → 8 ⭐"]), P3("d", "Water the fern"));
  ok("a daily that comes on with a level (Kid A to Level 3 Wed: Wipe the stove): Wed \"+10\", Thu \"+10\", Fri \"10 → 8\"", J(P3("a", "Wipe the stove")) === J(["+10 ⭐", "+10 ⭐", "10 → 8 ⭐"]), P3("a", "Wipe the stove"));
  ok("a daily whose own level is put at or below the kid's (Polish shoes → Level 1 Wed): Wed \"+10\", Thu \"+10\", Fri \"10 → 8\"", J(P3("b", "Polish shoes")) === J(["+10 ⭐", "+10 ⭐", "10 → 8 ⭐"]), P3("b", "Polish shoes"));
  const fr = id => ((R.jobsWed || {})[id] || {}).from || "";
  ok("…each of those rows now says from = Wed 12/2 in the table (the same targeted writes; Rake leaves and Sweep porch untouched)", ["b_door", "c_fern", "a_stove", "b_shoe"].every(id => fr(id) === "2026-12-02") && Object.values(R.jobsWed || {}).filter(j => j.label === "Dust the TV").every(j => j.from === "2026-12-02") && !fr("d_rake") && !fr("a_sweep"), Object.entries(R.jobsWed || {}).map(([k, j]) => [k, j.label, j.from]));
  console.log("\n── P · a row whose place in the list moves keeps paying what it should (ticks are kept by place) ──");
  ok("the editor really moved places: Wed night a row in at 2nd place, Thu night out again, Fri night Feed the dog and Fold towels swapped", /^Sweep porch\|Wipe the table\|Feed the dog\|Fold towels/.test(R.ins || "") && /^Sweep porch\|Feed the dog\|Fold towels/.test(R.del || "") && /^Sweep porch\|Fold towels\|Feed the dog/.test(R.swap || ""), [R.ins, R.del, R.swap]);
  const dogDays = ["2026-12-03", "2026-12-04", "2026-12-05"];
  ok("Feed the dog (done every day) after each move: Thu, Fri, Sat \"+10 ⭐\", and each tick pays 10", dogDays.every(d => pill(R[d].a, "Feed the dog") === "+10 ⭐" && pay["dog " + d] === 10), dogDays.map(d => [pill(R[d].a, "Feed the dog"), pay["dog " + d]]));
  ok("…Mom's pop-up the same: no \"missed\" note on Feed the dog", dogDays.every(d => !/missed/.test(popRow(R[d].momA, "Feed the dog"))), dogDays.map(d => popRow(R[d].momA, "Feed the dog")));
  ok("a row that really was missed (Sweep porch, never done, its place never moved) still pays less: Thu 6, Fri 4, Sat 2", J(dogDays.map(d => pill(R[d].a, "Sweep porch"))) === J(["10 → 6 ⭐", "10 → 4 ⭐", "10 → 2 ⭐"]), dogDays.map(d => pill(R[d].a, "Sweep porch")));
  ok("…Fold towels, missed every day: Thu \"10 → 6 ⭐\" (the places it reads held no done tick); Fri \"+10 ⭐\": its place now holds Feed the dog's Thursday tick, so the count stops there (unsure: it pays more, never less)", J(["2026-12-03", "2026-12-04"].map(d => pill(R[d].a, "Fold towels"))) === J(["10 → 6 ⭐", "+10 ⭐"]), ["2026-12-03", "2026-12-04", "2026-12-05"].map(d => pill(R[d].a, "Fold towels")));
}

// ── Q: family-calendar days off ──
console.log("\n── Q · a holiday / vacation that took a list off that day is not a miss and starts the count over ──");
{ const JQ = () => ({ a_cat: FAM().a_cat, a_dish: FAM().a_dish, a_room: FAM().a_room, b_nap: K({ label: "Fold napkins", who: "kid_b", slot: "morning", cad: "daily", pts: 2, order: 0 }) });   // kid_b ticks every day the Morning list runs, so each week has check-offs
  const run = async (cal, dates) => { const X = await mkWorld(IDX, HJS, JQ()), out = {};
    for (const [k, v] of Object.entries(cal)) X.A.run("db.ref('calendar/" + k + "').set(" + J(v) + ")"); await X.w.flush();
    for (const iso of dates) { await at(X.w, iso, 7); for (const sl of ["morning", "chores", "evening"]) { draw(X.B, sl, "kid_a"); draw(X.A, sl, "kid_a"); } await X.w.flush();
      await at(X.w, iso, 20); out[iso] = { m: pill(draw(X.B, "morning", "kid_a"), "Feed the cat"), c: pill(draw(X.B, "chores", "kid_a"), "Unload dishes"), e: pill(draw(X.B, "evening", "kid_a"), "Tidy the room"), slots: X.B.run("activeSlots().join(',')") };
      if (X.B.run("activeSlots().indexOf('morning')>=0")) { tick(X.B, "morning", "kid_b", "Fold napkins"); await X.w.flush(); }
      if (iso === dates[dates.length - 1]) out.tick = await (async () => { const b0 = bal(X.w, "kid_a"); tick(X.B, "chores", "kid_a", "Unload dishes"); await X.w.flush(); return bal(X.w, "kid_a") - b0; })(); }
    return out; };
  const D = []; for (let i = 0; i < 15; i++) { const d = new Date(2026, 10, 28 + i); D.push(d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0")); }
  // a 10-day vacation, "Everything — a real day off", Mon 11/30 … Wed 12/9, nobody ticking before or after
  const V = await run({ "vacations/trip": { name: "Trip", start: "2026-11-30", end: "2026-12-09", pause: "all" } }, D);
  ok("a 10-day vacation that paused everything (11/30 … 12/9): no lists those days (activeSlots empty)", V["2026-12-03"].slots === "" && V["2026-12-10"].slots === "morning,afternoon,chores,evening", [V["2026-12-03"].slots, V["2026-12-10"].slots]);
  ok("…first day back (Thu 12/10): every daily \"+10 ⭐\" (Morning, Chores, Evening); Fri \"+10\" (one miss is free); Sat \"10 → 8\"", ["m", "c", "e"].every(k => J(["2026-12-10", "2026-12-11", "2026-12-12"].map(d => V[d][k])) === J(["+10 ⭐", "+10 ⭐", "10 → 8 ⭐"])) && V.tick === 8, [["m", "c", "e"].map(k => ["2026-12-10", "2026-12-11", "2026-12-12"].map(d => V[d][k])), V.tick]);
  // "School + chores — keep morning & evening" Tue 12/1 … Thu 12/3, then a school-only holiday Sat 12/5 … Sun 12/6
  const C = await run({ "vacations/v": { name: "Short break", start: "2026-12-01", end: "2026-12-03", pause: "chores" }, "holidays/h": { name: "Holiday", start: "2026-12-05", end: "2026-12-06", pause: "school" } }, D.slice(0, 11));
  ok("a break that paused school + chores (12/1 … 12/3): the Chores list is off, Morning and Evening run (activeSlots)", C["2026-12-02"].slots === "morning,evening", C["2026-12-02"].slots);
  ok("…Chores (Unload dishes): Fri 12/4 \"+10\" (12/3 was off), Sat \"+10\", Sun \"10 → 8\", Mon \"10 → 6\"", J(["2026-12-04", "2026-12-05", "2026-12-06", "2026-12-07"].map(d => C[d].c)) === J(["+10 ⭐", "+10 ⭐", "10 → 8 ⭐", "10 → 6 ⭐"]), ["2026-12-04", "2026-12-05", "2026-12-06", "2026-12-07"].map(d => C[d].c));
  ok("…Morning and Evening kept running, so they count as before: Wed 12/2 \"10 → 8\", Fri 12/4 \"10 → 4\", Sun 12/6 \"10 → 0\"", ["m", "e"].every(k => J(["2026-12-02", "2026-12-04", "2026-12-06"].map(d => C[d][k])) === J(["10 → 8 ⭐", "10 → 4 ⭐", "10 → 0 ⭐"])), ["m", "e"].map(k => ["2026-12-02", "2026-12-04", "2026-12-06"].map(d => C[d][k])));
  ok("a school-only holiday (12/5 … 12/6, every list on) changes nothing: Chores Sun 12/6 \"10 → 8\" and Mon \"10 → 6\" as any days, Morning as the table", C["2026-12-05"].slots === "morning,afternoon,chores,evening" && C["2026-12-06"].c === "10 → 8 ⭐" && C["2026-12-07"].c === "10 → 6 ⭐" && C["2026-12-07"].m === "10 → 0 ⭐", [C["2026-12-05"].slots, C["2026-12-06"].c, C["2026-12-07"].c, C["2026-12-07"].m]);
}

// ── L ──
console.log("\n── L · nothing else moves: the app before, byte for byte ──");
const replay = async (index, hjs, plan) => { const R = await mkWorld(index, hjs); const snaps = [];
  for (const iso of plan.dates) { await at(R.w, iso, 20); const o = {};
    for (const kid of ["kid_a", "kid_b", "kid_c", "kid_d"]) for (const slot of ["morning", "afternoon", "chores", "evening"]) { o[slot + " " + kid] = draw(R.B, slot, kid); o["pop " + slot + " " + kid] = pop(R.A, kid, slot); }
    for (const kid of ["kid_a", "kid_b"]) { o["kc " + kid] = R.B.run("kcPointsHTML(" + J(kid) + ")"); o["hh " + kid] = hhPanel(R.B, kid); o["ledger " + kid] = LG(R.A, "lgGo(" + J(kid) + ",0,0)"); R.A.run("lgClose();1"); }
    snaps.push([iso, J(o)]);
    for (const kid of ["kid_a", "kid_b", "kid_c", "kid_d"]) for (const slot of ["morning", "afternoon", "chores", "evening"]) steps(R.B, slot, kid).forEach(x => { if (x && x.cad !== "none" && plan.tick(iso, kid)) tick(R.B, slot, kid, x.label); });
    await R.w.flush(); }
  return { snaps, writes: writes(R.w, 0).join("\n"), tree: J(R.w.db.tree.root) }; };
const cmp = (N, O) => ({ bad: N.snaps.filter((s, i) => s[1] !== O.snaps[i][1]).map(s => s[0]), w: (() => { const x = N.writes.split("\n"), y = O.writes.split("\n"); const i = x.findIndex((l, j) => l !== y[j]); return i < 0 && x.length === y.length ? null : [i, x[i], y[i]]; })() });
{ const plan = { dates: DATES, tick: (iso, kid) => (DATES.indexOf(iso) + (kid === "kid_a" || kid === "kid_c" ? 0 : 1)) % 2 === 0 };
  const N = await replay(IDX, HJS, plan), O = await replay(BASE_IDX, BASE_HJS, plan), c = cmp(N, O);
  ok("every row done every other day, 11/28 … 12/9 (half the kids on even days, half on odd): every list, pop-up, Kids' Corner, 🧽 house panel and ledger = the app before", c.bad.length === 0, c.bad);
  ok("…every write in order (" + N.writes.split("\n").length + ") and the whole database = the app before", !c.w && N.tree === O.tree, c.w); }
{ const DS = []; for (let i = 0; i < 9; i++) { const d = new Date(2026, 10, 22 + i); DS.push(d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0")); }
  const plan = { dates: DS, tick: iso => iso === "2026-11-30" };
  const N = await replay(IDX, HJS, plan), O = await replay(BASE_IDX, BASE_HJS, plan), c = cmp(N, O);
  ok("nothing done Sun 11/22 … Sun 11/29 (before the blank slate), everything ticked Mon 11/30: every screen = the app before (full stars)", c.bad.length === 0, c.bad);
  ok("…every write and the whole database = the app before", !c.w && N.tree === O.tree, c.w); }

if (process.env.CD_DUMP) { DUMP.wed = S.a["2026-12-02"]; DUMP.mon = S.a["2026-11-30"]; DUMP.thu = S.a["2026-12-03"]; DUMP.bWed = S.b["2026-12-02"]; fs.writeFileSync(process.env.CD_DUMP, J(DUMP)); }
try { fs.unlinkSync(BASE_IDX); } catch (e) {}
console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
})().catch(e => { console.log("CRASH " + (e && e.stack || e)); try { fs.unlinkSync(BASE_IDX); } catch (x) {} process.exit(1); });
