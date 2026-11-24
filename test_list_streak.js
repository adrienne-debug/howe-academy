/*
 * test_list_streak.js — 🔥 LISTSTREAK (missed-chores design §4.1, slice P2; her words 11/20: "every list but each by itself at its
 * title"; what it earns: "Nothing at first"). One streak per list (Morning, Afternoon, Chores, Evening) at that list's title on the
 * kid's screen: days in a row on which every row due on that list was ticked on its own day. Shown from 2; at 0 or 1 nothing.
 * The WHOLE app runs per device (test_fixtures/house_world.js: one shared in-memory Firebase, one virtual clock) on a made-up family
 * (kid_a … kid_d), the clock moved day by day from Mon 11/16 (n=0) to Tue 11/24 (n=8); Sun 11/22 (n=6) starts a new week.
 *   A · a run of full days counts up, list by list (each list its own number); today joins once its list is full, before that the
 *       title shows the count to yesterday; at 0 or 1 nothing is shown;
 *   B · one row not ticked on its day sets it to 0 even when done the next day in its wait, and Mom's tick on that day's tab the next
 *       day breaks it too;
 *   C · ✕ today (waved), ➖ Excuse (the 📒 Ledger's, on last week's day), 😷 Kid Off and 🌅 sent to the next morning do not break it;
 *       a day with nothing due is passed over; a holiday that hid the list is passed over;
 *   D · across the week change into last week's stored ticks; with last week not loaded (yet) it counts this week only;
 *   E · Mom's and Dad's four numbers (Kids today pop-up, 👤 By person); none on a kid's device;
 *   F · nothing is written or saved: no database write, no localStorage key; the whole database and every write = the baseline's;
 *   G · every list HTML is byte-identical to the baseline when no streak shows, and differs only by the 🔥 span when one does;
 *   I · further back, one earlier week at a time (a seeded week before the replay): a 20-day streak reads 20 on the Saturday and on the
 *       Sunday after (no drop across the week change); a list broken this week or last week makes no extra read; an unbroken one exactly
 *       one per earlier week, in order, stopping at the first miss, the cap or the reach; a week not there ends it and is not asked again;
 *       plan weeks not back to back stop it; ?dryrun=1 makes none; loading order never shows less the same day; nothing is written;
 *   H · the cost of one draw (printed).
 * The baseline = this index.html with the LISTSTREAK_START … LISTSTREAK_END block cut out (its hooks are typeof-guarded, so they go
 * quiet): this tree minus the feature.   run: node test_list_streak.js
 */
"use strict";
const fs = require("fs"), path = require("path"), os = require("os");
const W = require(path.join(__dirname, "test_fixtures", "house_world.js"));
let pass = 0, fail = 0; const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x).slice(0, 900) + ")" : "")); } };
const J = x => JSON.stringify(x), clone = x => JSON.parse(J(x));

const SRC = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const a0 = SRC.indexOf("// LISTSTREAK_START"), a1 = SRC.indexOf("// LISTSTREAK_END");
ok("index.html has one LISTSTREAK block", a0 > 0 && a1 > a0 && SRC.indexOf("// LISTSTREAK_START", a0 + 1) < 0);
const BASE = path.join(os.tmpdir(), "list_streak_base_" + process.pid + ".html");
fs.writeFileSync(BASE, SRC.slice(0, a0) + SRC.slice(SRC.indexOf("\n", a1) + 1));
const HJS = fs.readFileSync(path.join(__dirname, "house.js"), "utf8");

const K = o => Object.assign({ src: { kind: "routine" }, status: "active", area: "cleaning", verdict: "", note: "", level: 1, minutes: 5 }, o);
const JOBS = () => ({
  a_teeth: K({ label: "Brush teeth", emoji: "🪥", who: "kid_a", slot: "morning", cad: "daily", area: "health", order: 0 }),
  a_pick: K({ label: "Pickup the den", emoji: "🧸", who: "kid_a", slot: "afternoon", cad: "daily", area: "pickup", pts: 5, order: 1 }),
  a_bed: K({ label: "Make the bed", emoji: "🛏", who: "kid_a", slot: "chores", cad: "daily", pts: 5, order: 2 }),
  a_vac: K({ label: "Vacuum the den", emoji: "🧹", who: "kid_a", slot: "chores", cad: "wk:1", pts: 10, order: 3 }),
  a_pjs: K({ label: "Put pjs on", emoji: "🌙", who: "kid_a", slot: "evening", cad: "daily", area: "health", order: 4 }),
  b_sink: K({ label: "Wipe the sink", emoji: "🚰", who: "kid_b", slot: "chores", cad: "daily", pts: 5, order: 0 }),
  b_porch: K({ label: "Sweep the porch", emoji: "🧺", who: "kid_b", slot: "chores", cad: "wk:1", pts: 10, order: 1 }),
  c_toys: K({ label: "Toys in the bin", emoji: "🧩", who: "kid_c", slot: "chores", cad: "daily", pts: 5, order: 0 }),
  c_table: K({ label: "Wipe the table", emoji: "🍽", who: "kid_c", slot: "chores", cad: "daily", pts: 5, order: 1 }),
  d_car: K({ label: "Wash the car", emoji: "🚗", who: "kid_d", slot: "chores", cad: "wk:1", pts: 10, order: 0 }),
  d_garden: K({ label: "Water the garden", emoji: "🪴", who: "kid_d", slot: "chores", cad: "wk:3", pts: 8, order: 1 })
});
const KIDOFF = "2026-11-19";   // Thu: 😷 kid_c
async function mkWorld(index) {
  const cal = clone(W.FX.db.calendar); cal.kidOverrides = { kid_c: { [KIDOFF]: { school: false, note: "Sick" } } };
  const w = await W.world({ household: { jobs: JOBS(), people: clone(W.PEOPLE), meta: { takeover: 1 } }, tree: { calendar: cal }, index });
  const A = w.boot("A", "devA", { mom: true }), B = w.boot("B", "devB"); await w.flush(); return { w, A, B };
}
const dOf = n => new Date(2026, 10, 16 + n), isoN = n => { const d = dOf(n); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
const go = (w, n, h, mi) => { const d = dOf(n); return w.at(d.getFullYear(), d.getMonth() + 1, d.getDate(), h, mi || 0); };
const SLOTS = ["morning", "afternoon", "chores", "evening"], KIDS = ["kid_a", "kid_b", "kid_c", "kid_d"];
// what a kid's device draws: each list on today's tab, opened as the kid finds it
const draw = (d, slot, kid) => d.run("(function(){ const d0=day; day=_todayDay; try{ rtOpen={}; mrOpen={}; return " + (slot === "morning" ? "mrIndividualHTML(" + J(kid) + ")" : "rtSlotHTML(" + J(slot) + "," + J(kid) + ")") + "; } finally{ day=d0; } })()");
const drawAll = d => { const o = {}; KIDS.forEach(k => SLOTS.forEach(s => { o[k + "/" + s] = draw(d, s, k); })); return o; };
const idxOf = (d, slot, kid, label) => d.run("(function(){ return (rtStepsFor('" + slot + "','" + kid + "',false,_todayDay)||[]).findIndex(function(x){ return x&&x.label===" + J(label) + "&&x.cad!=='none'; }); })()");
const tick = (d, slot, kid, label) => { const i = idxOf(d, slot, kid, label); if (i < 0) return -1; d.run("(function(){ const d0=day; day=_todayDay; try{ " + (slot === "morning" ? "toggleMorningStep('" + kid + "'," + i + ")" : "toggleRtStep('" + slot + "','" + kid + "'," + i + ")") + "; } finally{ day=d0; } })()"); return i; };
const pop = (d, kid, slot) => d.run("(function(){ let h=''; const b=document.body.insertAdjacentHTML; document.body.insertAdjacentHTML=function(w,x){ h=x; }; try{ boardStatPop(" + J(kid) + "," + J(slot) + ",_todayDay); } finally{ document.body.insertAdjacentHTML=b; } return h; })()");
const num = (d, slot, kid) => d.run("(typeof lsStreak==='function')?(_lsM={},lsStreak(" + J(slot) + "," + J(kid) + ")):null");
const nums = d => { const o = {}; KIDS.forEach(k => { o[k] = SLOTS.map(s => num(d, s, k)); }); return o; };
const FIRE = /<span class="ls-fire" style="color:#ea580c;font-weight:800;white-space:nowrap">🔥 (\d+)<\/span>/;
const fireOf = h => { const m = FIRE.exec(h); return m ? +m[1] : null; };
const unfire = h => h.replace(/ <span class="ls-fire"[^>]*>🔥 \d+<\/span>/, "");
const unfour = h => h.replace(/<div class="ls-four"[^>]*>.*?<\/div>/, "");
const writes = (w, m) => w.since(m || 0).map(l => l.op + " " + l.path + " " + (l.keys || []).join(","));
const treeJ = w => JSON.stringify(w.db.tree.root);
const lsJ = d => J(Array.from(d.ctx.localStorage._map.entries()).sort());

// One replay, the same taps on both copies. Each day at 7 PM (every list open): the taps, then what each device shows.
async function replay(index, side) {
  const { w, A, B } = await mkWorld(index), R = { draws: {}, pre: {}, nums: {}, pops: {}, kidPops: {}, writes: [], misc: {} };
  for (let n = 0; n <= 8; n++) {
    await go(w, n, 19); await w.flush();
    R.misc["first" + n] = num(B, "chores", "kid_a"); await w.flush();   // the first look after the day rolls (the app's first draw), then its reads land
    R.pre[n] = { a_chores: draw(B, "chores", "kid_a"), b_chores: draw(B, "chores", "kid_b"), c_chores: draw(B, "chores", "kid_c") };   // before today's taps
    R.misc["preNum" + n] = { a: num(B, "chores", "kid_a"), b: num(B, "chores", "kid_b"), c: num(B, "chores", "kid_c") };
    // kid_a: Morning from Tuesday on, Afternoon from Wednesday on, Chores every day (the Tuesday vacuum too), Evening never
    if (n >= 1) tick(B, "morning", "kid_a", "Brush teeth");
    if (n >= 2) tick(B, "afternoon", "kid_a", "Pickup the den");
    tick(B, "chores", "kid_a", "Make the bed"); if (n === 1 || n === 8) tick(B, "chores", "kid_a", "Vacuum the den");
    // kid_b: the sink each day but Friday; the Tuesday porch missed on Tue 11/17 and done Wed in its wait; Friday's sink ticked by Mom on
    // Saturday from Friday's tab; the porch on its day Tue 11/24
    if (n !== 4) tick(B, "chores", "kid_b", "Wipe the sink");
    if (n === 2 || n === 8) tick(B, "chores", "kid_b", "Sweep the porch");
    if (n === 5) { const i = A.run("(rtStepsFor('chores','kid_b',false,'friday')||[]).findIndex(function(x){ return x&&x.label==='Wipe the sink'; })"); A.run("mdKidTick('chores','kid_b','friday'," + i + ")"); R.misc.backfill = A.run("JSON.stringify(slState[activeWk()+'_friday_kid_b_cstep" + i + "'])"); }
    // kid_c: both rows, except Tue (Mom ✕ waves the table), Thu (😷 Kid Off: nothing ticked), Fri (Mom 🌅 sends the table to the next
    // morning), Sat (the table not ticked; Mom ➖ excuses it from the 📒 Ledger on Sunday, last week's row)
    if (n === 1) A.run("rtWave('chores','kid_c',_todayDay," + idxOf(A, "chores", "kid_c", "Wipe the table") + ")");
    if (n === 4) R.misc.sent = A.run("amSend('chores','kid_c',_todayDay," + idxOf(A, "chores", "kid_c", "Wipe the table") + ")");
    if (n === 6) { R.misc.sunBefore = num(B, "chores", "kid_c"); const pw = A.run("_prevWkKey()"), i = A.run("(rtStepsFor('chores','kid_c',false,'saturday')||[]).findIndex(function(x){ return x&&x.label==='Wipe the table'; })");
      A.run("rtWave('chores','kid_c','saturday'," + i + "," + J(pw) + ",rtStepsFor('chores','kid_c',false,'saturday')[" + i + "])"); await w.flush(); R.misc.excused = A.run("JSON.stringify(((wavedData[" + J(pw) + "]||{}).saturday||{}).kid_c||null)"); }
    if (n !== 3) { tick(B, "chores", "kid_c", "Toys in the bin"); if (n !== 1 && n !== 4 && n !== 5) tick(B, "chores", "kid_c", "Wipe the table"); }
    // kid_d: Tue the car, Thu the garden; nothing due the other days
    if (n === 1 || n === 8) tick(B, "chores", "kid_d", "Wash the car"); if (n === 3) tick(B, "chores", "kid_d", "Water the garden");
    await w.flush();
    R.draws[n] = drawAll(B); R.nums[n] = nums(B);
    R.pops[n] = { a_chores: pop(A, "kid_a", "chores"), a_morning: pop(A, "kid_a", "morning"), c_chores: pop(A, "kid_c", "chores") };
    R.kidPops[n] = pop(B, "kid_a", "chores");
  }
  // D · last week not loaded (yet): this week only. A device whose read of last week has not landed, then a fresh device.
  R.misc.unloaded = B.run("(function(){ if(typeof lsStreak!=='function') return null; const ps=prevSlState, o=_lsOld, h=_lsHi; prevSlState=null; _lsM={}; try{ const held=[lsStreak('chores','kid_a'),lsStreak('chores','kid_b'),lsStreak('chores','kid_d')]; _lsM={}; _lsOld={}; _lsHi={}; _lsBusy='x'; return held.concat([lsStreak('chores','kid_a'),lsStreak('chores','kid_b'),lsStreak('chores','kid_d'),lsBadgeHTML('chores','kid_a')]); } finally{ prevSlState=ps; _lsOld=o; _lsHi=h; _lsBusy=null; _lsM={}; } })()");
  const C = w.boot("C", "devC"); await w.flush(); R.misc.freshFirst = C.run("(function(){ const ps=prevSlState; return [ps===null, (typeof lsStreak==='function')?lsStreak('chores','kid_a'):null]; })()");
  await w.flush(); R.misc.freshLater = num(C, "chores", "kid_a");
  const M = w.boot("M", "devM", { mom: true }); await w.flush(); R.misc.momFirst = pop(M, "kid_a", "chores"); await w.flush(); R.misc.momLater = pop(M, "kid_a", "chores");   // Mom's fresh device
  // F · nothing written, nothing saved: every streak read many times on Mom's and a kid's device
  { const m = w.mark(), l0 = lsJ(B), l1 = lsJ(A);
    for (let r = 0; r < 3; r++) { [A, B].forEach(d => d.run("(function(){ _lsM={}; ROSTER.forEach(function(k){ SL_SLOTS.forEach(function(s){ if(typeof lsStreak==='function'){ lsStreak(s,k); lsBadgeHTML(s,k); } }); if(typeof lsFourHTML==='function') lsFourHTML(k); }); })()")); }
    await w.flush(); R.misc.lsWrites = writes(w, m); R.misc.lsSaved = [lsJ(B) === l0, lsJ(A) === l1]; }
  // E · 👤 By person (house.js), Mom's device
  A.run(HJS); A.run("hpSel='kid_a'"); R.misc.person = A.run("hpPersonHTML()");
  // H · the cost of one draw: the kid's four lists, timed from outside the sandbox (its clock is virtual)
  { const t = (fn, k) => { const s = process.hrtime.bigint(); for (let i = 0; i < k; i++) fn(); return Number(process.hrtime.bigint() - s) / 1e6 / k; };
    R.misc.costCold = t(() => B.run("_lsM={}; " + SLOTS.map(s => "lsStreak&&lsStreak('" + s + "','kid_a')").join(";").replace(/lsStreak&&/g, "typeof lsStreak==='function'&&")), 50);
    R.misc.costWarm = t(() => B.run(SLOTS.map(s => "typeof lsStreak==='function'&&lsStreak('" + s + "','kid_a')").join(";")), 200);
    R.misc.costLists = t(() => SLOTS.forEach(s => draw(B, s, "kid_a")), 50); }
  R.writes = w.since(0).map(l => l.op + " " + l.path); R.tree = treeJ(w); R.errs = [A, B].map(d => (d.logs || []).filter(x => /error/i.test(x[0] || "")).length);
  void side; return R;
}

(async () => {
const N = await replay(path.join(__dirname, "index.html"), "new"), O = await replay(BASE, "base");

console.log("\n── A · a run of full days counts up, each list its own number ──");
const chA = [0, 1, 2, 3, 4, 5, 6, 7, 8].map(n => N.nums[n].kid_a[2]);
ok("kid_a Chores, every row ticked each day Mon 11/16 … Tue 11/24: 1, 2, 3 … 9 (the last two in the new week, counting into last week)", J(chA) === J([1, 2, 3, 4, 5, 6, 7, 8, 9]), chA);
const at8 = N.nums[8].kid_a;
ok("each list its own number on Tue 11/24: Morning 8 (from Tue) · Afternoon 7 (from Wed) · Chores 9 · Evening 0 (never ticked)", J(at8) === J([8, 7, 9, 0]), at8);
ok("the title shows it: \"Chores 2/2 🔥 9\", \"Morning 1/1 🔥 8\", \"Afternoon 1/1 🔥 7\"; Evening has no flame",
  fireOf(N.draws[8]["kid_a/chores"]) === 9 && /Chores <span style="color:var\(--muted\);font-weight:700">2\/2<\/span> <span class="ls-fire"/.test(N.draws[8]["kid_a/chores"]) && fireOf(N.draws[8]["kid_a/morning"]) === 8 && fireOf(N.draws[8]["kid_a/afternoon"]) === 7 && fireOf(N.draws[8]["kid_a/evening"]) === null,
  [N.draws[8]["kid_a/chores"].slice(0, 400)]);
const preA = [0, 1, 2, 3, 4, 5, 6, 7, 8].map(n => N.misc["preNum" + n].a), preFire = [0, 1, 2, 3, 4, 5, 6, 7, 8].map(n => fireOf(N.pre[n].a_chores));
ok("before today's list is full the title shows the count to yesterday: 0, 1, 2 … 8", J(preA) === J([0, 1, 2, 3, 4, 5, 6, 7, 8]), preA);
ok("…and nothing is shown at 0 or 1: no flame on Mon or Tue before the taps, 🔥 2 … 🔥 8 after", J(preFire) === J([null, null, 2, 3, 4, 5, 6, 7, 8]), preFire);
ok("at 1 nothing shows: kid_a Chores after Monday's taps (1), Afternoon on Wednesday (1), kid_d on Tuesday (1)", fireOf(N.draws[0]["kid_a/chores"]) === null && N.nums[2].kid_a[1] === 1 && fireOf(N.draws[2]["kid_a/afternoon"]) === null && N.nums[1].kid_d[2] === 1 && fireOf(N.draws[1]["kid_d/chores"]) === null);

console.log("\n── B · a row not ticked on its day breaks it, even when done the next day ──");
const chB = [0, 1, 2, 3, 4, 5, 6, 7, 8].map(n => N.nums[n].kid_b[2]);
ok("kid_b Chores: 1 · 1 (Tue porch not ticked) · 1 (porch done Wed in its wait: Tue still broke it) · 2 · 2 (Fri sink not ticked) · 1 (Mom ticked Fri's sink on Sat) · 2 · 3 · 4 (into last week's Saturday)", J(chB) === J([1, 1, 1, 2, 2, 1, 2, 3, 4]), chB);
ok("on Wednesday before any tap: 0, no flame (Tuesday's porch was not ticked on its day)", N.misc.preNum2.b === 0 && fireOf(N.pre[2].b_chores) === null, N.misc.preNum2);
ok("Mom's tick on Friday's tab is stamped Saturday (that is how it is told apart)", /Nov 21/.test(N.misc.backfill || "") && /"done":true/.test(N.misc.backfill || ""), N.misc.backfill);

console.log("\n── C · what does not break it ──");
const chC = [0, 1, 2, 3, 4, 5, 6, 7, 8].map(n => N.nums[n].kid_c[2]);
ok("kid_c Chores: 1 · 2 (✕ waved table) · 3 · 3 (😷 Kid Off, nothing ticked: passed over) · 4 (🌅 table sent) · 4 (Sat table open) · 6 (➖ excused Sat, + Sun) · 7 · 8", J(chC) === J([1, 2, 3, 3, 4, 4, 6, 7, 8]), chC);
ok("Sunday before the ➖ Excuse: 0 (Saturday's table broke it); the excuse is last week's waved record", N.misc.sunBefore === 0 && /"choresstep1":\{[^}]*"label":"Wipe the table","by":"mom"/.test(N.misc.excused || "") && N.misc.sent === true, [N.misc.sunBefore, N.misc.excused, N.misc.sent]);
const chD = [0, 1, 2, 3, 4, 5, 6, 7, 8].map(n => N.nums[n].kid_d[2]);
ok("kid_d (a Tuesday and a Thursday chore): 0 · 1 · 1 · 2 · 2 · 2 · 2 · 2 · 3 — the days with nothing due are passed over, across the week change", J(chD) === J([0, 1, 1, 2, 2, 2, 2, 2, 3]), chD);
ok("a list with nothing due today still shows the streak at its title: kid_d Fri \"Chores 🔥 2\" + \"Nothing due today\"", /Chores <span class="ls-fire"[^>]*>🔥 2<\/span><\/div><div class="sl-slot-sub">Nothing due today/.test(N.draws[4]["kid_d/chores"]), N.draws[4]["kid_d/chores"].slice(0, 300));

console.log("\n── D · across the week change; last week not loaded ──");
ok("Tue 11/24 with last week loaded: kid_a 9, kid_b 4, kid_d 3 (each reaches into last week's ticks)", N.nums[8].kid_a[2] === 9 && N.nums[8].kid_b[2] === 4 && N.nums[8].kid_d[2] === 3);
ok("last week's copy gone mid-day (a reload of it): the device still shows 9 · 4 · 3 — never less than a moment ago that day", J(N.misc.unloaded.slice(0, 3)) === J([9, 4, 3]), N.misc.unloaded);
ok("nothing of last week on the device at all: this week only — kid_a 3 (Sun, Mon, Tue), kid_b 3, kid_d 1 (no flame), the title \"🔥 3\"", J(N.misc.unloaded.slice(3, 6)) === J([3, 3, 1]) && /🔥 3</.test(N.misc.unloaded[6]), N.misc.unloaded);
ok("Sun 11/22, the first look after the week changes on a device left open: 6 at once (its own copy of last week), 6 once last week's read lands", N.misc.first6 === 6 && N.misc.preNum6.a === 6, [N.misc.first6, N.misc.preNum6]);
ok("a fresh device: before its read of last week lands it says 3; once it lands, 9", J(N.misc.freshFirst) === J([true, 3]) && N.misc.freshLater === 9, [N.misc.freshFirst, N.misc.freshLater]);

console.log("\n── E · Mom's and Dad's four numbers ──");
const fourOf = h => (h.match(/<div class="ls-four"[^>]*>(.*?)<\/div>/) || [])[1] || "";
ok("Mom's fresh device before its read of last week lands: \"Morning 3+ · Afternoon 3+ · Chores 3+ · Evening 0\" (at least 3: older ticks not here yet); once it lands: 8 · 7 · 9 · 0",
  fourOf(N.misc.momFirst) === "🔥 Days in a row: Morning <b>3+</b> · Afternoon <b>3+</b> · Chores <b>3+</b> · Evening <b>0</b>" && fourOf(N.misc.momLater) === "🔥 Days in a row: Morning <b>8</b> · Afternoon <b>7</b> · Chores <b>9</b> · Evening <b>0</b>", [fourOf(N.misc.momFirst), fourOf(N.misc.momLater)]);
const four8 = (N.pops[8].a_chores.match(/<div class="ls-four"[^>]*>(.*?)<\/div>/) || [])[1] || "";
ok("Kids today pop-up (Mom): \"🔥 Days in a row: Morning 8 · Afternoon 7 · Chores 9 · Evening 0\" under the title", four8 === "🔥 Days in a row: Morning <b>8</b> · Afternoon <b>7</b> · Chores <b>9</b> · Evening <b>0</b>", four8);
ok("…on every list's pop-up (Morning too); kid_c's own numbers on hers", /ls-four/.test(N.pops[8].a_morning) && /Chores <b>8<\/b>/.test(N.pops[8].c_chores));
ok("a kid's device pop-up has no line", N.kidPops[8].indexOf("ls-four") < 0 && N.kidPops[8] === O.kidPops[8]);
ok("👤 By person (house.js) ▸ Today: the same line for the kid", /<div class="ls-four"[^>]*>🔥 Days in a row: Morning <b>8<\/b> · Afternoon <b>7<\/b> · Chores <b>9<\/b> · Evening <b>0<\/b><\/div>/.test(N.misc.person), (N.misc.person.match(/ls-four.{0,200}/) || [""])[0]);
ok("…and By person is otherwise the baseline's, byte for byte", unfour(N.misc.person) === O.misc.person);

console.log("\n── F · nothing is written, nothing is saved ──");
ok("reading every streak, badge and line 3 times on Mom's and a kid's device: 0 database writes", N.misc.lsWrites.length === 0, N.misc.lsWrites);
ok("…and no localStorage change on either device", J(N.misc.lsSaved) === J([true, true]));
ok("the whole replay's writes = the baseline's, in order (" + N.writes.length + " writes)", J(N.writes) === J(O.writes), N.writes.filter((x, i) => x !== O.writes[i]).slice(0, 5));
ok("the whole database after the replay = the baseline's, byte for byte", N.tree === O.tree);

console.log("\n── G · the list HTML: byte-identical when no streak shows ──");
let same = 0, fired = 0; const bad = [];
for (let n = 0; n <= 8; n++) Object.keys(N.draws[n]).forEach(k => { const h = N.draws[n][k], b = O.draws[n][k], f = fireOf(h), [kid, slot] = k.split("/"), v = N.nums[n][kid][SLOTS.indexOf(slot)];
  if (f === null) { if (h === b && (v === null || v < 2)) same++; else bad.push([n, k, "no-fire", v]); } else { if (f === v && v >= 2 && unfire(h) === b) fired++; else bad.push([n, k, f, v]); } });
ok("every list drawn on every day (" + (same + fired) + "): no flame → the baseline's HTML byte for byte (" + same + "); a flame → the baseline's plus the 🔥 span alone (" + fired + ")", bad.length === 0 && same > 50 && fired >= 40, bad.slice(0, 6));
ok("the lists before the taps too", [0, 1, 2, 3, 4, 5, 6, 7, 8].every(n => Object.keys(N.pre[n]).every(k => fireOf(N.pre[n][k]) === null ? N.pre[n][k] === O.pre[n][k] : unfire(N.pre[n][k]) === O.pre[n][k])));
ok("Mom's pop-ups = the baseline's plus the one line", [0, 4, 8].every(n => Object.keys(N.pops[n]).every(k => unfour(N.pops[n][k]) === O.pops[n][k] && N.pops[n][k] !== O.pops[n][k])));
ok("no error logged on either device in either copy", J(N.errs) === J([0, 0]) && J(O.errs) === J([0, 0]), [N.errs, O.errs]);

console.log("\n── the rule's corners (one device) ──");
{ const { w, B } = await mkWorld(); await go(w, 2, 19);
  // a holiday that took the Chores list off a day is passed over; one that paused school only is not
  B.run("calendarData.holidays={h1:{name:'Day off',start:'2026-11-17',end:'2026-11-17',pause:'chores'}}");
  const hid = B.run("[_lsOff('chores','kid_a','2026-11-17'),_lsOff('morning','kid_a','2026-11-17'),_lsOff('chores','kid_c','" + KIDOFF + "'),_lsOff('chores','kid_a','2026-11-18')]");
  ok("a holiday that hid the list (pause \"chores\"): passed over for Chores, not for Morning; 😷 Kid Off: excused; a plain day: neither", J(hid) === J(["hid", "", "kid", ""]), hid);
  const ts = B.run("[_lsOnDay({done:true,ts:'07:05 PM Nov 17'},'2026-11-17'),_lsOnDay({done:true,ts:'07:05\\u202fPM Nov 18'},'2026-11-17'),_lsOnDay({done:true,ts:''},'2026-11-17'),_lsOnDay({done:false,ts:'07:05 PM Nov 17'},'2026-11-17')]");
  ok("a tick counts on its own day by its stamp (\"Nov 17\"); another day's stamp does not; an old tick with no date counts; an un-tick does not", J(ts) === J([true, false, true, false]), ts);
  const due = B.run("[_lsDue({cad:'asneeded'},'monday','2026-11-16'),_lsDue({cad:'once'},'monday','2026-11-16'),_lsDue({cad:'daily',house:'x'},'monday','2026-11-16'),_lsDue({cad:'daily',line:'l1'},'monday','2026-11-16'),_lsDue({cad:'daily',from:'2026-11-17'},'monday','2026-11-16'),_lsDue({cad:'wk:0'},'monday','2026-11-16'),_lsDue({cad:'wk:1'},'monday','2026-11-16')]");
  ok("not counted: ✋ as needed, ☑️ once, the plan's own rows, the laundry line's rows, a row before its start date; a Monday row on Monday is", J(due) === J([false, false, false, false, false, true, false]), due);
  ok("off the today tab nothing is drawn: Tuesday's tab viewed on Wednesday has no flame", B.run("(function(){ const d0=day; day='tuesday'; try{ return lsBadgeHTML('chores','kid_a'); } finally{ day=d0; } })()") === "");
}

console.log("\n── I · reaching further back: one earlier week at a time ──");
{ const JI = () => ({
    a_bed: K({ label: "Make the bed", emoji: "🛏", who: "kid_a", slot: "chores", cad: "daily", pts: 5, order: 0 }),
    a_teeth: K({ label: "Brush teeth", emoji: "🪥", who: "kid_a", slot: "morning", cad: "daily", area: "health", order: 1 }),
    b_sink: K({ label: "Wipe the sink", emoji: "🚰", who: "kid_b", slot: "chores", cad: "daily", pts: 5, order: 0 }),
    c_toys: K({ label: "Toys in the bin", emoji: "🧩", who: "kid_c", slot: "chores", cad: "daily", pts: 5, order: 0 }) });
  const w = await W.world({ household: { jobs: JI(), people: clone(W.PEOPLE), meta: { takeover: 1 } } });
  const A = w.boot("A", "devA", { mom: true }), B = w.boot("B", "devB"); await w.flush();
  await go(w, -1, 19);
  // the week before the replay (Sun 11/08 … Sat 11/14) as the database keeps it: kid_a's bed ticked Mon 11/09 … Sat 11/14 on each day
  const bi = idxOf(B, "chores", "kid_a", "Make the bed"), sl1 = {};
  ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"].forEach((dn, j) => { sl1["week1_" + dn + "_kid_a_cstep" + bi] = { done: true, ts: "07:00 PM Nov " + (9 + j), pts: 5, bid: null }; });
  const had1 = J(w.db.tree.root.week1 || null); w.db.tree.root.week1 = Object.assign({}, w.db.tree.root.week1 || {}, { sl: sl1 });
  const I = {};
  for (let n = -1; n <= 13; n++) {
    await go(w, n, 19); await w.flush();
    if (n === 13) { I.sunFirst = num(B, "chores", "kid_a"); I.sunWk = B.run("activeWk()"); }
    tick(B, "chores", "kid_a", "Make the bed"); if (n >= 0) tick(B, "chores", "kid_c", "Toys in the bin"); if (n !== 9) tick(B, "chores", "kid_b", "Wipe the sink");
    await w.flush(); B.run("_lsM={}"); B.run("lsStreak('chores','kid_a')"); await w.flush();
    if (n === 12) { I.sat = num(B, "chores", "kid_a"); I.satFire = fireOf(draw(B, "chores", "kid_a")); I.satWk = B.run("activeWk()"); }
    if (n === 13) I.sunAfter = num(B, "chores", "kid_a");
  }
  ok("a 20-day streak (Mon 11/09 … Sat 11/28, 11/09–11/14 from the stored week before) reads 20 on Saturday (" + I.satWk + ")", I.sat === 20 && I.satFire === 20, [I.sat, I.satFire]);
  ok("…and 20 on the Sunday after (" + I.sunWk + ") before its tick, on the same device: no drop across the week change; 21 once Sunday is ticked", I.sunFirst === 20 && I.sunAfter === 21 && I.sunWk !== I.satWk, [I.sunFirst, I.sunAfter, I.satWk, I.sunWk]);
  // fresh devices on Sunday 11/29 (week4): every <week>/sl read they make, counted
  const wrap = d => d.run("(function(){ const r0=db.ref; globalThis.__slReads=[]; db.ref=function(p){ const r=r0.apply(db,arguments); if(/\\/sl$/.test(String(p))&&r&&r.once){ const o=r.once; r.once=function(){ __slReads.push(String(p)); return o.apply(r,arguments); }; } return r; }; return 1; })()");
  const reads = d => JSON.parse(d.run("JSON.stringify(__slReads)")), extra = d => reads(d).filter(p => p !== d.run("_prevWkKey()") + "/sl");
  const settle = async (d, kid) => { let v = null; for (let r = 0; r < 6; r++) { v = num(d, "chores", kid); await w.flush(); } return v; };
  { const F = w.boot("F", "devF"); wrap(F); await w.flush();
    const mF = w.mark(), nb = await settle(F, "kid_b"), xb = extra(F), rb = reads(F);
    const nc = await settle(F, "kid_c"), xc = extra(F);
    const na = await settle(F, "kid_a"), xa = extra(F);
    const nm = await settle(F, "kid_a"); await settle(F, "kid_c"); const xz = extra(F);
    ok("kid_b (the sink missed Wed 11/25, last week): 4, and NO extra read — only last week's, the app's own", nb === 4 && xb.length === 0 && J(rb) === J(["week3/sl"]), [nb, rb]);
    ok("kid_c (from Mon 11/16; Sun 11/15 not ticked, two weeks back): 14, exactly one extra read: week2", nc === 14 && J(xc) === J(["week2/sl"]), [nc, xc]);
    ok("kid_a (unbroken into the week before): 21, one more read: week1 — in order, week2 not read twice", na === 21 && J(xa) === J(["week2/sl", "week1/sl"]), [na, xa]);
    I.wr = writes(w, mF);
    ok("asked again (both kids, the cache gone): no new read; week1 is the first week, so none earlier is asked for", nm === 21 && J(xz) === J(["week2/sl", "week1/sl"]), xz); }
  { const G = w.boot("G", "devG", { mom: true }); wrap(G); await w.flush(); G.run("LS_CAP=10"); const n = await settle(G, "kid_a");
    ok("the cap (set to 10 here; 60 in the app): kid_a 10, week1 never read (the cap was reached in week2); Mom's line \"Chores 10+\"", n === 10 && J(extra(G)) === J(["week2/sl"]) && /Chores <b>10\+<\/b>/.test(G.run("lsFourHTML('kid_a')")), [n, extra(G)]); }
  { const H = w.boot("H", "devH", { mom: true }); wrap(H); await w.flush(); H.run("LS_REACH=2"); const n = await settle(H, "kid_a");
    ok("the reach (set to 2 weeks back here; 12 in the app): kid_a 15 (Sun 11/15 … Sun 11/29), week1 never read; Mom's line \"15+\"", n === 15 && J(extra(H)) === J(["week2/sl"]) && /Chores <b>15\+<\/b>/.test(H.run("lsFourHTML('kid_a')")), [n, extra(H)]); }
  { const D = w.boot("D", "devD"); wrap(D); await w.flush(); D.run("HA_LS.setItem('ha_dryrun','1')"); const n = await settle(D, "kid_a");
    ok("?dryrun=1: no extra read at all (last week's is the app's own): kid_a 8 (this week and last: what the app itself reads)", n === 8 && extra(D).length === 0, [n, reads(D)]); }
  { const keep = w.db.tree.root.week1; delete w.db.tree.root.week1;
    const E = w.boot("E", "devE"); wrap(E); await w.flush(); const n = await settle(E, "kid_a"), x1 = extra(E); const n2 = await settle(E, "kid_a");
    ok("an earlier week that is not there (week1 gone): the count ends there — 15 (Sun 11/15 … Sun 11/29) — with no error, and it is never asked for again", n === 15 && n2 === 15 && J(x1) === J(["week2/sl", "week1/sl"]) && J(extra(E)) === J(x1) && (E.logs || []).filter(l => /error/i.test(l[0] || "")).length === 0, [n, n2, x1, extra(E)]);
    w.db.tree.root.week1 = keep; }
  { const Q = w.boot("Q", "devQ", { mom: true }); wrap(Q); await w.flush(); Q.run("(function(){ const g0=gwWeekDateRange; gwWeekDateRange=function(n){ return n===2?{start:'2026-11-02',end:'2026-11-08'}:g0(n); }; })()"); const n = await settle(Q, "kid_a");
    ok("plan weeks not back to back (week2 dated two weeks before week3 — a break between): the count stops at the break, 8, with no read of week2; \"8+\"", n === 8 && extra(Q).length === 0 && /Chores <b>8\+<\/b>/.test(Q.run("lsFourHTML('kid_a')")), [n, extra(Q)]); }
  { const ps = B.run("JSON.stringify([lsStreak('chores','kid_a'),(function(){ const a=prevSlState, o=_lsOld; prevSlState=null; _lsOld={}; _lsM={}; try{ return lsStreak('chores','kid_a'); } finally{ prevSlState=a; _lsOld=o; _lsM={}; } })()])");
    ok("loading order never shows less the same day: B at 21, its copies of the earlier weeks dropped mid-day, still 21", ps === "[21,21]", ps); }
  ok("nothing written by any of it: a fresh device's draws and its three reads made 0 database writes (its boot's own records aside)", I.wr.length === 0, I.wr.slice(0, 5));
  void A; void had1;
}

console.log("\n── H · the cost of one draw ──");
console.log("   the four streaks of one kid, cold (cache empty: 13 days × 4 lists): " + N.misc.costCold.toFixed(3) + " ms");
console.log("   the four streaks of one kid, warm (cached past, today worked out):   " + N.misc.costWarm.toFixed(3) + " ms");
console.log("   the kid's four lists drawn whole (rtSlotHTML ×3 + mrIndividualHTML): " + N.misc.costLists.toFixed(3) + " ms with · " + O.misc.costLists.toFixed(3) + " ms without");
ok("a warm draw of the four streaks stays small here (under 20 ms even on a loaded machine)", N.misc.costWarm < 20, N.misc.costWarm);

try { fs.unlinkSync(BASE); } catch (e) {}
console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); try { fs.unlinkSync(BASE); } catch (x) {} process.exit(1); });
