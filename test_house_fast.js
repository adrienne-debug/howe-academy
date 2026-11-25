/*
 * test_house_fast.js — HOUSEFAST (house.js): one draw of a Rooms page (🏠 Whole house, a room) works each shared thing out once (hub
 * brief 2026-11-19: Whole house took ~170 ms on a real-size table). The memo lives for ONE hhRoomsPageHTML() call and no longer.
 * A MADE-UP big family (Ada, Ben, Cal, Mom, Dad; 267 chores, 12 rooms, 8 weeks of Click-off Log, Mom's and Dad's day stamps, today's
 * stored plan) — no real family's names or data.
 *   1 byte for byte = the app before this change (pinned: `git show c6bedace:house.js`, the commit this branch starts from): 🏠 Whole
 *     house (folded, and with Show all / a day / every To do open), every room page, ❔ No room, 👤 By person for everyone and the
 *     🧺 Laundry page — plan off, preview and ON — before and after taps that change data, applied the same in both: a kid's tick
 *     arriving, a tick on today's stored plan, ＋ To-do on Whole house, ✎ edits on the chore card (room, who, cad), ✓ I did it myself
 *     and its undo. Every tap's writes are the same too, and drawing writes nothing (no db call, no storage write).
 *   2 the memo cannot go stale: each tap changes the page; a change made in place with no tap at all (a label, a log line) shows on the
 *     next draw; nothing is kept after a draw, or after a draw that throws; outside a draw the helpers read fresh every time.
 *   3 the repeated work is gone (call counts, not times): each room's 🔴 Now rows once a draw, the chores by room once, hhStats once a chore.
 *   4 _hfNeedOf is hhNeed line for line (its text, and its answer on every chore in every mode).
 *   5 mutation checks: a copy of house.js with one HOUSEFAST line broken → the check that guards it fails.
 *   BASE_HOUSE=/path/to/before/house.js node test_house_fast.js   (default: `git show c6bedace:house.js`; no such commit → 1 is skipped)
 *   run: node test_house_fast.js
 */
"use strict";
const fs = require("fs"), path = require("path"), vm = require("vm"), cp = require("child_process");
const V = require(path.join(__dirname, "test_fixtures", "house_vm.js"));
const { K, T, TODAY, ago, isoOf } = V;
let pass = 0, fail = 0; const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x).slice(0, 600) + ")" : "")); } };
const J = x => JSON.stringify(x), HJS = V.HJS;
const BEFORE = "c6bedace";   // origin/main when this branch started; house.js before HOUSEFAST
let BHJS = process.env.BASE_HOUSE ? fs.readFileSync(process.env.BASE_HOUSE, "utf8") : null;
if (!BHJS) { try { BHJS = cp.execSync("git show " + BEFORE + ":house.js", { cwd: __dirname, maxBuffer: 64 << 20, stdio: ["ignore", "pipe", "ignore"] }).toString("utf8"); } catch (e) { BHJS = null; } }
// HOUSEQUIET (slice B of the missed-chores design, 2026-11-23) changes on purpose what the Household pages draw (no red late badge,
// Mom's notes, % done; test_house_quiet.js). Every caller asks typeof first, so the comparisons with BEFORE's pages run on house.js with
// that block cut out: what HOUSEFAST's memo must leave byte for byte as it was.
const noQ = s0 => ["HOUSEQUIET", "HOUSEMIXSET"].reduce((s, k) => { const i = s.indexOf("// " + k + "_START"); return i < 0 ? s : s.slice(0, i) + s.slice(s.indexOf("\n", s.indexOf("// " + k + "_END")) + 1); }, s0);   // + HOUSEMIXSET (step 7 slice 2): Mom's "Mixed in" line on 👤 By person
console.log("(base: " + (BHJS ? "house.js at " + (process.env.BASE_HOUSE || BEFORE) : "none — git show " + BEFORE + " failed; part 1 is skipped") + ")");

// ── the made-up big family (deterministic) ──
const ROOMS = [["kitchen", "Kitchen", "down"], ["living", "Living room", "down"], ["entry", "Entry", "down"], ["bathdown", "Half bath", "down"], ["school", "School room", "down"], ["laundryrm", "Laundry room", "down"],
  ["boys", "Boys' room", "up"], ["girls", "Girls' room", "up"], ["ours", "Our room", "up"], ["bathup", "Big bath", "up"], ["stairs", "Stairs", "up"], ["playroom", "Playroom", "up"]];
const ROOMS_DB = {}; ROOMS.forEach((r, i) => { ROOMS_DB[r[0]] = { name: r[1], floor: r[2], order: i }; });
const FLOORS = { down: { name: "Downstairs", order: 0 }, up: { name: "Upstairs", order: 1 } };
const VERBS = ["Wipe", "Dust", "Sweep", "Mop", "Vacuum", "Tidy", "Scrub", "Clear", "Sort", "Polish", "Empty", "Wash"], THINGS = ["the counters", "the shelf", "the floor", "the rug", "the sink", "the table", "the window", "the mirror", "the bin", "the toys", "the desk", "the door", "the lamp", "the bench", "the hooks", "the baskets", "the stove", "the tub"];
const WHO = ["ada", "ada", "ben", "ben", "cal", "cal", "mom", "dad", "grab"], CAD = ["daily", "daily", "daily", "wk:0", "wk:1,4", "wk:0,2,4", "wk:5", "7d", "14d", "2w", "30d", "asneeded", "sat", "wk:3"];
const DNS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"], KIDS = ["ada", "ben", "cal"];
function family() {
  let seed = 12345; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }, pick = a => a[Math.floor(rnd() * a.length)];
  const jobs = {}; let i = 0;
  for (; i < 243; i++) { const who = pick(WHO), cad = pick(CAD), kid = KIDS.indexOf(who) >= 0;
    const o = { label: pick(VERBS) + " " + pick(THINGS) + " " + (i + 1), who, slot: kid ? pick(["chores", "chores", "afternoon", "evening"]) : "", cad, room: ROOMS[i % 12][0], minutes: 5 + (i % 4) * 5, order: i % 9, pts: kid ? 5 : 0 };
    if (!kid && who !== "grab") o.src = { kind: who === "mom" ? "momChore" : "dadChore", id: "x" + i };
    if (rnd() < 0.3) o.lastDone = ago(1 + Math.floor(rnd() * 20));
    if (rnd() < 0.2) o.can = [who, pick(KIDS)];
    if (i % 37 === 5) o.room = "attic_gone";   // a room no longer on the list → ❔ No room
    if (i % 41 === 7) o.level = 3;
    if (i % 53 === 9) { o.cycW = 2; o.cycN = 4; o.cycStart = ago(60); o.cad = "wk:2"; }
    jobs["c" + i] = K(o); }
  for (let k = 0; i < 267; i++, k++) { const id = "o" + k, r = ROOMS[k % 12][0];   // the one-time pile: waiting, sent, done; two projects
    if (k < 16) jobs[id] = K({ label: "Job " + (k + 1), who: k % 3 ? "mom" : "ben", slot: k % 3 ? "" : "chores", cad: "once", hold: k % 4 !== 0, room: r, from: ago(k % 9), ts: k, can: ["mom", "ada"], src: k % 3 ? { kind: "momChore", id } : { kind: "new" } });
    else if (k < 21) jobs[id] = K({ label: "Done job " + k, who: "ada", slot: "chores", cad: "once", room: r, status: "retired", done: ago(k - 15), ts: k });
    else jobs[id] = K({ label: "Project " + k, who: "mom", slot: "", cad: "asneeded", layer: "project", room: r, src: { kind: "momChore", id } }); }
  // routineLog/<kid>/<week>/<day>/<key> = {act, at, label, slot}: ~70% of the kids' due days ticked, some late, some "— not done" lines, a few grabs
  const log = {}; let s = 0; const DUE = { daily: [0, 1, 2, 3, 4, 5, 6], sat: [6] };
  const put = (kid, n, label, act, slot) => { const iso = isoOf(n), d = new Date(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8), 9, 0, 0), w = "w" + isoOf(n - d.getDay()), dn = DNS[d.getDay()];
    ((log[kid] = log[kid] || {})[w] = log[kid][w] || {})[dn] = log[kid][w][dn] || {}; log[kid][w][dn]["e" + (++s)] = { act, at: d.getTime(), label, slot, pts: 1 }; };
  Object.keys(jobs).forEach(id => { const j = jobs[id]; if (KIDS.indexOf(j.who) < 0 || j.cad === "once") return;
    const days = DUE[j.cad] || (/^wk:/.test(j.cad) ? j.cad.slice(3).split(",").map(x => (+x + 1) % 7) : []);
    for (let n = T - 56; n < T; n++) { if (days.indexOf(new Date(isoOf(n) + "T12:00:00Z").getUTCDay()) < 0) continue;
      const r = rnd(); if (r < 0.7) put(j.who, n, j.label, "on", j.slot); else if (r < 0.75) put(j.who, n, j.label + " — not done", "miss", j.slot); else if (r < 0.8) put(j.who, n + 1, j.label, "on", j.slot); } });
  Object.keys(jobs).filter(id => jobs[id].who === "grab").slice(0, 8).forEach((id, k) => put(pick(KIDS), T - 1 - k * 3, jobs[id].label, "on", "grab"));
  const momday = {}, dadday = {}; Object.keys(jobs).forEach(id => { const j = jobs[id]; if (!j.src || (j.who !== "mom" && j.who !== "dad")) return; const D = j.who === "mom" ? momday : dadday;
    for (let b = 1; b <= 56; b++) if (rnd() < 0.3) { const k = ago(b); (D[k] = D[k] || { chores: {} }).chores[j.src.id] = true; } });
  const plan = {}, over = {}, done = {}; let o = 0;   // today's stored plan (ON): the daily house chores, three that fit nobody, a third done
  Object.keys(jobs).forEach((id, n) => { const j = jobs[id]; if (j.status === "retired" || j.hold || j.who === "grab" || j.layer === "project" || j.cad !== "daily") return;
    if (n % 11 === 3 && o < 3) { over[id] = { turn: j.who, mins: j.minutes, k: "daily", late: 0 }; o++; return; }
    plan[id] = { who: j.who, mins: j.minutes, order: n % 7, late: n % 5 === 0 ? 1 : 0, k: "daily" }; if (n % 3 === 0) done[id] = { who: j.who, ts: "9:00 AM" }; });
  return { jobs, log, momday, dadday, houseDay: { [TODAY]: { built: { ok: 1, sig: "x" }, plan, over, done } } };
}
const META = { off: { takeover: 1 }, preview: { takeover: 1, engine: { mode: "preview", on: TODAY } }, on: { takeover: 1, engine: { mode: "on", on: ago(3) } } };
const LAU = s => s.slice(s.indexOf("// HH_LAUNDRY_START"), s.indexOf("// HH_LAUNDRY_END"));   // the Laundry page + the laundry line, from index.html
// One world: index.html's Household code + `hjs` (this house.js, the pinned one, or a mutant) + the Laundry page. Every write recorded.
function world(mode, hjs) {
  const F = family(), hd = { meta: META[mode], rooms: ROOMS_DB, floors: FLOORS };
  const c = V.mk({ jobs: F.jobs, momday: F.momday, dadday: F.dadday, hd, houseDay: mode === "on" ? F.houseDay : undefined, house: false });
  vm.runInContext(hjs, c, { filename: "house.js" });
  vm.runInContext("var calNormDate=function(s){ return s; }, _lbWrite=function(){ return typeof db!=='undefined'&&db&&!(typeof _dryRun===\"function\"&&_dryRun()); }, kitPinGate=function(){}, event={stopPropagation:function(){}};\n"
    + "function mdCardLaundry(){ return '<div>MACHINES-NOW</div>'; } function luLgHTML(){ return '<div>LEDGER</div>'; } function qlCardHTML(){ return '<div>QUICK</div>'; }\n" + LAU(V.RAW), c);
  c.householdOnValue(Object.assign({ jobs: F.jobs, meta: { takeover: 1 } }, hd));
  c.laundryLineOnValue({ log: { [ago(1)]: { ben: { at: 1, done: true } } } });
  c.routineLog = F.log; c.event = { stopPropagation: () => {} };
  c.lsw = []; const s0 = c.HA_LS.setItem; c.HA_LS.setItem = (k, v) => { c.lsw.push(k); s0(k, v); };
  c.writes.length = 0; return c;
}
const whole = c => { c.get('hhView="rooms"; hhRmSel=""; hhRmEditing=false'); return c.hhRoomsPageHTML(); };
const room = (c, rid) => { c.get('hhView="rooms"; hhRmEditing=false; hhRmSel=' + J(rid)); return c.hhRoomsPageHTML(); };
const person = (c, who) => { c.get('hhView="person"; hpSel=' + J(who)); return c.hpPersonHTML(); };
const laundry = c => { c.get('hhView="laundry"'); return c.hhLaundryHTML(); };
// Every page, drawn in a fixed order: {name: html}. Also Whole house with every fold open (Show all, today's day, each room's To do).
// few = between two taps: Whole house (folded, open), the rooms the taps touch, ❔ No room, one kid, Mom, Laundry (the full set at the start and the end).
function pages(c, few) {
  const out = {}; out.whole = whole(c);
  c.get('hoAll=true; hwDay=' + J(TODAY) + '; ' + ROOMS.map(r => 'htdMore[' + J(r[0]) + ']=true').join('; ')); out["whole, open"] = whole(c);
  c.get('hoAll=false; hwDay=""; htdMore={}'); out["whole, again"] = whole(c);
  ROOMS.filter(r => !few || r[0] === "kitchen" || r[0] === "living").forEach(r => { out["room " + r[0]] = room(c, r[0]); }); out["room __none"] = room(c, "__none");
  ["ada", "ben", "cal", "mom", "dad"].filter(w => !few || w === "ben" || w === "mom").forEach(w => { out["person " + w] = person(c, w); });
  out.laundry = laundry(c); c.get('hhView="rooms"; hhRmSel=""'); return out;
}
// A kid's tick arriving from their device (a Click-off Log line for today), and a tick on today's stored plan.
function kidTick(c, id) { const j = c.hhJobs()[id], d = new Date(T * 864e5 + 12 * 36e5), w = "w" + isoOf(T - new Date(TODAY + "T12:00:00Z").getUTCDay()), dn = DNS[new Date(TODAY + "T12:00:00Z").getUTCDay()];
  const L = c.routineLog; ((L[j.who] = L[j.who] || {})[w] = L[j.who][w] || {})[dn] = L[j.who][w][dn] || {}; L[j.who][w][dn]["tick_" + id] = { act: "on", at: Date.now(), label: j.label, slot: j.slot, pts: 1 }; return d; }
function planTick(c, id) { c.get("(function(){ var r=houseDayData&&houseDayData[" + J(TODAY) + "]; if(r){ r.done=r.done||{}; r.done[" + J(id) + "]={who:" + J(c.hhJobs()[id].who) + ",ts:'10:00 AM'}; } })()"); }
// The taps, in order (each on both worlds). [name, fn(c)]; a tap's return value and its writes are compared too.
const KITCHEN_KID = "c12", MOVE = "c36", MIN_CH = "c48", CAD_CH = "c60", TODO = "o1";
const PLAN_DONE = (() => { const d = family().houseDay[TODAY]; return Object.keys(d.plan).find(id => !d.done[id]); })();   // on today's stored plan, not done yet
const TAPS = [
  ["a kid's tick arrives (Click-off Log)", c => { kidTick(c, KITCHEN_KID); return null; }],
  ["a tick on today's stored plan", c => { planTick(c, PLAN_DONE); return null; }, "on"],   // only ON stores a plan
  ["＋ To-do on Whole house (Kitchen)", c => c.htdSave("kitchen", "Fix the latch", "🔧")],
  ["chore card: room → Living room", c => c.hhEditSet(MOVE, "room", "living")],
  ["chore card: minutes → 45", c => c.hhEditSet(MIN_CH, "minutes", 45)],
  ["chore card: cad → daily", c => c.hhEditSet(CAD_CH, "cad", "daily")],
  ["✓ I did it myself (a waiting to-do)", c => c.rtdTick(TODO)],
  ["✓ undone", c => c.rtdTick(TODO)]
];

// ── 0. the family is what the brief asks for ──
{ const c = world("off", HJS), A = c.hhJobs(), act = Object.keys(A).filter(id => A[id].status !== "retired");
  ok("the made-up family: 267 chores, 12 rooms, 8 weeks of log, a ❔ No room", Object.keys(A).length === 267 && c.hhRoomList().length === 12 && c.hhRoomChores().__none.length > 0 && Object.keys(c.routineLog).length === 3, [Object.keys(A).length, act.length]);
  ok("the tap targets are what the taps expect", A[KITCHEN_KID].room === "kitchen" && KIDS.indexOf(A[KITCHEN_KID].who) >= 0 && A[MOVE].room !== "living" && A[MIN_CH].minutes !== 45 && A[CAD_CH].cad !== "daily" && A[TODO].hold && A[TODO].cad === "once",
    [A[KITCHEN_KID], A[MOVE].room, A[MIN_CH].minutes, A[CAD_CH].cad, A[TODO]]); }

// ── 1. byte for byte = the pinned house.js, every page, every mode, before and after each tap ──
const S = c => c.get("JSON.stringify([householdData,houseDayData,routineLog,momdayData,daddayData,laundryLine])");
if (BHJS) for (const mode of ["off", "preview", "on"]) {
  console.log("\n── 1. " + mode + ": every page = " + BEFORE + "'s, before and after each tap ──");
  const a = world(mode, noQ(HJS)), b = world(mode, BHJS);   // HOUSEQUIET: noQ
  const cmp = (when, few) => { const w0 = a.writes.length, l0 = a.lsw.length, s0 = S(a), P = pages(a, few), Q = pages(b, few), bad = Object.keys(Q).filter(k => P[k] !== Q[k]);
    ok(mode + ", " + when + ": all " + Object.keys(Q).length + " pages byte for byte (Whole house " + P.whole.length + " chars)", !bad.length && Object.keys(P).length === Object.keys(Q).length, bad);
    ok(mode + ", " + when + ": drawing them wrote nothing (no db call, no storage, no data change)", a.writes.length === w0 && a.lsw.length === l0 && S(a) === s0); return P; };
  let prev = cmp("as loaded");
  for (const [name, tap, only] of TAPS) {
    const wa = a.writes.length, wb = b.writes.length, ra = tap(a), rb = tap(b);
    ok(mode + ", " + name + ": the same answer and the same writes as before", J(ra) === J(rb) && J(a.writes.slice(wa)) === J(b.writes.slice(wb)) && S(a) === S(b), [ra, rb]);
    const last = name === TAPS[TAPS.length - 1][0], P = cmp("after " + name, !last);
    if (!only || only === mode) ok(mode + ", " + name + ": the page changed", Object.keys(P).some(k => prev[k] !== undefined && P[k] !== prev[k]));
    prev = P; }
}

// ── 2. the memo cannot go stale ──
console.log("\n── 2. nothing outlives a draw ──");
function staleChecks(hjs, tag) {   // → {name: passed}
  const r = {}, c = world("off", hjs), A = c.hhJobs();
  const h0 = whole(c), h1 = whole(c);
  r["drawing twice with no change gives the same page"] = h0 === h1;
  r["no memo is left after a draw"] = c.get("_hfD") === null;
  // a change made IN PLACE, no tap, no householdOnValue: a waiting to-do's label (📝 To do shows it), then a log line (🔴 Now's counts)
  A[TODO].label = "Renamed in place " + tag; const h2 = whole(c);
  r["a label changed in place shows on the next draw"] = h2.indexOf("Renamed in place " + tag) >= 0 && h2 !== h1;
  const before = room(c, "kitchen"); kidTick(c, KITCHEN_KID); const after = room(c, "kitchen");
  r["a kid's tick that just arrived shows on the next draw of the room"] = before !== after;
  const w1 = whole(c); planTick(c, PLAN_DONE); A[MOVE].room = "living"; const w2 = whole(c);
  r["a chore moved in place shows on the next Whole house draw"] = w1 !== w2 && J(c.hhRoomChores().living).indexOf(MOVE) >= 0;
  // a draw that throws: the memo is dropped all the same, and the next draw is whole again
  const keep = c.hwCardHTML; c.hwCardHTML = () => { throw new Error("boom"); }; let threw = false; try { whole(c); } catch (e) { threw = true; } c.hwCardHTML = keep;
  r["a draw that throws leaves no memo behind"] = threw && c.get("_hfD") === null;
  A[TODO].label = "Renamed again " + tag; const h3 = whole(c);
  r["…and the next draw reads fresh"] = h3.indexOf("Renamed again " + tag) >= 0;
  // outside a draw every helper reads fresh every time
  const R0 = J(c.rnRows("living")), rc0 = c.hhRoomChores().kitchen.length; ["c1", "c2", "c3"].forEach(id => { A[id].room = "kitchen"; });   // c1 living, c2 entry, c3 half bath
  r["outside a draw: hhRoomChores and rnRows read the table as it is now"] = c.get("_hfD") === null && c.hhRoomChores().kitchen.length === rc0 + 3 && J(c.rnRows("living")) !== R0;
  // the arrays a card gets are its own: changing them cannot change what the next card reads
  r["each caller gets its own arrays"] = c.get("hfDraw(function(){ var a=hhRoomChores(), b=hhRoomChores(), x=rnRows('kitchen'), y=rnRows('kitchen'); return a.kitchen!==b.kitchen&&x.rows!==y.rows&&x.over!==y.over&&J(a)===J(b); })".replace(/J\(/g, "JSON.stringify("));
  return r;
}
{ const r = staleChecks(HJS, "x"); Object.keys(r).forEach(k => ok(k, r[k])); }

// ── 3. the repeated work is gone (call counts on one Whole house draw) ──
console.log("\n── 3. each thing worked out once a draw ──");
function counts(c) { const n = {}, wrap = f => { const g = c[f]; if (typeof g !== "function") return; n[f] = 0; c[f] = function () { n[f]++; return g.apply(this, arguments); }; };
  ["_rnRows", "rnRows", "_hhRoomChores", "hhRoomChores", "hhStats", "hhNeed"].forEach(wrap); whole(c); return n; }
for (const mode of ["off", "preview", "on"]) {
  const c = world(mode, HJS), A = c.hhJobs(), live = Object.keys(A).filter(id => A[id].status !== "retired").length, n = counts(c);
  ok(mode + ": each room's 🔴 Now rows worked out once (" + n._rnRows + " for 12 rooms, ❔ and the plan's no-room), not once per card", n._rnRows === 14, n);
  ok(mode + ": the chores by room worked out once", n._hhRoomChores === 1, n);
  ok(mode + ": hhStats at most once a chore (" + n.hhStats + " for " + live + "), hhNeed never (its arithmetic reuses them)", n.hhStats <= live && n.hhNeed === 0, n);
  if (BHJS) { const m = counts(world(mode, BHJS)); ok(mode + ": before this change: rnRows " + m.rnRows + "×, hhRoomChores " + m.hhRoomChores + "×, hhStats " + m.hhStats + "×", m.rnRows > n._rnRows && m.hhStats > n.hhStats, m); }
}

// ── 4. _hfNeedOf = hhNeed ──
console.log("\n── 4. the need meter's arithmetic, line for line ──");
const fnText = (s, name) => { const i = s.indexOf("function " + name + "("); if (i < 0) return ""; let d = 0; for (let k = s.indexOf("{", i); k < s.length; k++) { if (s[k] === "{") d++; else if (s[k] === "}" && --d === 0) return s.slice(i, k + 1); } return ""; };
function needSame(hjs) {
  const want = fnText(V.RAW, "hhNeed").replace("function hhNeed(j){", "function _hfNeedOf(id,j){").replace("const st=hhStats(j);", "const st=hfStats(id,j);");
  const bare = s => s.replace(/[ \t]+\/\/ [^\n]*/g, "");   // without the end-of-line comments
  const text = !!want && bare(fnText(hjs, "_hfNeedOf")) === bare(want);
  let ans = true; const bad = [];
  for (const mode of ["off", "preview", "on"]) { const c = world(mode, hjs), A = c.hhJobs(); c.hhJobs()[TODO].lastDone = ago(2);   // one to-do with a lastDone too
    const x = c.get("hfDraw(function(){ var J=hhJobs(); return JSON.stringify(Object.keys(J).map(function(id){ var n=_hfNeedOf(id,J[id]); return n&&Object.assign({},n,{pct:String(n.pct)}); })); })");
    const y = c.get("JSON.stringify(Object.keys(hhJobs()).map(function(id){ var n=hhNeed(hhJobs()[id]); return n&&Object.assign({},n,{pct:String(n.pct)}); }))");
    if (x !== y) { ans = false; bad.push(mode); } }
  return { text, ans, bad };
}
{ const r = needSame(HJS);
  ok("_hfNeedOf's text is hhNeed's (index.html), with only this draw's stats put in — if hhNeed changes, change _hfNeedOf too", r.text);
  ok("_hfNeedOf gives hhNeed's answer on all 267 chores, plan off / preview / ON", r.ans, r.bad); }

// ── 5. mutation checks: break one HOUSEFAST line in a copy of house.js → its check fails ──
console.log("\n── 5. mutation checks ──");
const mutant = (name, a, b) => { const n = HJS.split(a).length - 1; if (n !== 1) { ok("(mutation " + name + ": its text occurs exactly once in house.js)", false, n); return null; } return HJS.replace(a, b); };
{ const m = mutant("the memo outlives the draw", "finally{ _hfD=null; }", "finally{ }");
  if (m) { const r = staleChecks(m, "m1"); ok("mutation 1 — the memo is not dropped after a draw → 'nothing outlives a draw' fails", !r["no memo is left after a draw"] && !r["a chore moved in place shows on the next Whole house draw"], r); } }
{ const m = mutant("rnRows keyed without its room", 'hfMemo("rn|"+rid,', 'hfMemo("rn|",');
  if (m) { const a = world("on", m), b = world("on", HJS), x = whole(a), y = whole(b); ok("mutation 2 — every room's 🔴 Now rows from one memo slot → the Whole house page is no longer the same", x !== y); } }
{ const m = mutant("the need forgets lastDone", "  let last=st.last; if(j.lastDone&&/^\\d{4}-\\d{2}-\\d{2}$/.test(j.lastDone)&&(!last||j.lastDone>last)) last=j.lastDone;\n  if(!last) return {pct:Infinity", "  let last=st.last;\n  if(!last) return {pct:Infinity");
  if (m) { const r = needSame(m); let page = true; if (BHJS) { const a = world("off", noQ(m)), b = world("off", BHJS); page = whole(a) !== whole(b); }
    ok("mutation 3 — _hfNeedOf drops the cleaning-day lastDone → part 4 fails" + (BHJS ? " and Whole house differs from " + BEFORE + "'s" : ""), !r.text && !r.ans && page, r); } }
{ const m = mutant("stats shared by every chore", 'hfMemo("st|"+id,', 'hfMemo("st|",');
  if (m && BHJS) { const a = world("off", noQ(m)), b = world("off", BHJS); ok("mutation 4 — one stats slot for every chore → Whole house differs from " + BEFORE + "'s", whole(a) !== whole(b)); } }

console.log("\n" + pass + " passed, " + fail + " failed"); process.exit(fail ? 1 : 0);
