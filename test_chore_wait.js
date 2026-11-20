/*
 * test_chore_wait.js — ⏳ CHOREWAIT (missed-chores design slice C1, her rule 2026-11-19: "there needs to be a buffer for that so that
 * way we're not getting lots of things backed up. Because once it reaches that grace window, then that one's just going to be
 * dropped"; "kids see nothing but mom view sees the notes"; the wait on today's lists: "Yes, now").
 * A chore on its days that is not done waits rtWaitDays (daily / 3+ a week none · twice a week 1 · weekly 2 · every 2 weeks 4 ·
 * 4-week cycle 7, never past its next day), as a plain row; then it is off the list until its next day, and its "— not done" is
 * filed that day under the day it was due. Mom's Kids today pop-up says "from Tue · day 2 of 2".
 * The WHOLE app runs per device (test_fixtures/house_world.js: one shared in-memory Firebase, one virtual clock) on a made-up family
 * (kid_a … kid_d), the clock moved day by day from Mon 11/16 (day 0) for 14 days:
 *   A · the wait table (rtWaitDays) row by row;
 *   B · nothing done for 14 days: each chore on the list exactly on its day and its wait days, once, then gone, back on its next day
 *       (weekly, twice a week, 3 a week, a Saturday chore into the next week, every 2 weeks, the 4-week cycle on-cycle only, an
 *       animal row); every "— not done": one per missed time, filed under its due day, written on its drop day, the same from two
 *       devices; a kid's row on a wait day = the row on its own day, byte for byte, and no "late", "from ", red on the list;
 *       Mom's pop-up has the note, a kid device's pop-up does not;
 *   C · done on day 1 or 2 of the wait: the tick's writes (stars, list bonus, log) = the app before this change; no "— not done";
 *   D · every chore done on its day for 14 days: every list, pop-up, write and the database = the app before this change;
 *   E · a missed week with ✕ skip, 🌅 Send to next morning, a turn wheel and dailies: those rows and their writes = the app before;
 *       the waved and the sent chore file no "— not done";
 *   F · the plan ON, a missed week: the stored days (houseDay) and their writes = the app before; the animal row (the lists' own
 *       rule under ON) waits and drops;
 *   G · the first day after the change lands: chores 3–6 days late under the old rule leave the lists with no second line.
 * "The app before" = git show 2faffd06:index.html (skipped with a note if that commit is missing). HOUSE_INDEX=<a copy> runs the
 * branch side on another copy (the mutation checks).   run: node test_chore_wait.js
 */
"use strict";
const fs = require("fs"), path = require("path"), os = require("os"), cp = require("child_process");
const W = require(path.join(__dirname, "test_fixtures", "house_world.js")), S = require(path.join(__dirname, "test_fixtures", "demo_week_sandbox.js"));
let pass = 0, fail = 0; const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x).slice(0, 600) + ")" : "")); } };
const J = x => JSON.stringify(x), clone = x => JSON.parse(J(x));
const BASE_SHA = "2faffd06";
let BASE = null; try { const t = path.join(os.tmpdir(), "chore_wait_base_" + process.pid + ".html"); fs.writeFileSync(t, cp.execSync("git show " + BASE_SHA + ":index.html", { cwd: __dirname, maxBuffer: 64 << 20, stdio: ["ignore", "pipe", "ignore"] })); BASE = t; } catch (e) { BASE = null; }
console.log("(the app before: " + (BASE ? BASE_SHA : "none — git show " + BASE_SHA + " failed; the checks against it are skipped") + ")");

// ── the made-up family's table. Day 0 = Mon 11/16; wk: 0 = Monday ──
const K = o => Object.assign({ src: { kind: "routine" }, status: "active", area: "cleaning", verdict: "", note: "", level: 1 }, o);
const JOBS = () => ({
  a_table: K({ label: "Wipe the table", emoji: "🍽", who: "kid_a", slot: "chores", cad: "daily", minutes: 5, pts: 5, order: 0 }),
  a_vac: K({ label: "Vacuum the den", emoji: "🧹", who: "kid_a", slot: "chores", cad: "wk:1", minutes: 15, pts: 10, order: 1 }),
  a_mirror: K({ label: "Shine the mirror", emoji: "🪞", who: "kid_a", slot: "chores", cad: "wk:1,4", minutes: 5, pts: 4, order: 2 }),
  a_trash: K({ label: "Empty the trash", emoji: "🗑", who: "kid_a", slot: "chores", cad: "wk:0,2,4", minutes: 5, pts: 3, order: 3 }),
  a_teeth: K({ label: "Brush teeth", emoji: "🪥", who: "kid_a", slot: "morning", cad: "daily", area: "health", order: 0 }),
  b_bikes: K({ label: "Wash the bikes", emoji: "🚲", who: "kid_b", slot: "chores", cad: "wk:5", minutes: 20, pts: 8, order: 0 }),
  b_blinds: K({ label: "Dust the blinds", emoji: "🪟", who: "kid_b", slot: "chores", cad: "wk:1", cycW: 1, cycN: 2, cycStart: "2026-11-16", minutes: 10, pts: 6, order: 1 }),
  b_tub: K({ label: "Scrub the tub", emoji: "🛁", who: "kid_b", slot: "chores", cad: "wk:2", cycW: 1, cycN: 4, cycStart: "2026-11-16", minutes: 15, pts: 12, order: 2 }),
  b_cage: K({ label: "Clean the hamster cage", emoji: "🐹", who: "kid_b", slot: "chores", cad: "wk:3", area: "animals", pts: 5, order: 3 }),
  b_sink: K({ label: "Rinse the sink", emoji: "🚰", who: "kid_b", slot: "chores", cad: "daily", minutes: 5, pts: 2, order: 4 }),
  c_plants: K({ label: "Water the plants", emoji: "🪴", who: "kid_c", slot: "chores", cad: "wk:1,2", minutes: 5, pts: 3, order: 0 }),
  p_a: K({ label: "Pickup the den", emoji: "🧸", who: "kid_a", slot: "afternoon", cad: "daily", area: "pickup", rot: "pick", minutes: 5, pts: 5, order: 0 }),
  p_b: K({ label: "Pickup the porch", emoji: "🧺", who: "kid_b", slot: "afternoon", cad: "daily", area: "pickup", rot: "pick", minutes: 5, pts: 5, order: 0 }),
  m_fridge: K({ label: "Wipe the fridge", who: "mom", slot: "", cad: "daily", minutes: 10, src: { kind: "momChore", id: "fridge" }, order: 1 }),
  d_trash: K({ label: "Trash to the curb", who: "dad", slot: "", cad: "daily", area: "pickup", minutes: 5, src: { kind: "dadChore", id: "trash" }, order: 0 })
});
const LBL = Object.fromEntries(Object.entries(JOBS()).map(([id, j]) => [id, j.label]));
const household = mode => { const h = { jobs: JOBS(), people: clone(W.PEOPLE), meta: { takeover: 1 } }; if (mode) h.meta.engine = { mode: mode, on: "2026-11-09" }; return h; };
const tree = () => ({ config: Object.assign(clone(W.FX.db.config), { routineBonus: { chores: { kid_a: 7, kid_b: 7 }, day: { kid_a: 3 } } }) });
const DN = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const dOf = n => new Date(2026, 10, 16 + n), isoN = n => { const d = dOf(n); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
const go = (w, n, h, mi) => { const d = dOf(n); return w.at(d.getFullYear(), d.getMonth() + 1, d.getDate(), h, mi || 0); };
const nOfMs = ms => { const d = new Date(ms); return Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()) - new Date(2026, 10, 16)) / 864e5); };

// a device on another copy of the app, on the same world (G: the change lands)
function bootOn(w, index, name, dev, mom) { let seed = 0; for (const ch of String(dev)) seed = (seed * 31 + ch.charCodeAt(0)) % 2147483647; seed = seed || 7; const M = Object.create(Math); M.random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const d = S.bootDevice({ name, dev, db: w.db, clock: w.clock, sched: w.sched, family: W.FX.family, indexPath: index, globals: { Math: M } }); if (mom) d.momOn(); else d.run("try{ if(typeof haMomOff==='function') haMomOff(); }catch(e){}"); w.devs.push(d); return d; }
async function mkWorld(mode, index) { const w = await W.world({ household: household(mode), tree: tree(), index }); const A = w.boot("A", "devA", { mom: true }), B = w.boot("B", "devB"), C = w.boot("C", "devC"); await w.flush(); return { w, A, B, C }; }

// what a kid's device draws: one list on today's tab, opened as the kid finds it
const draw = (d, slot, kid) => d.run("(function(){ const d0=day; day=_todayDay; try{ rtOpen={}; return rtSlotHTML(" + J(slot) + "," + J(kid) + "); } finally{ day=d0; } })()");
// the list's rows, each cut at its own end (the last one would otherwise carry the list's closing </div>)
const rowsOf = h => { const i = h.indexOf('<div class="mr-steps"'); if (i < 0) return []; const p = h.slice(h.indexOf(">", i) + 1).split('<div class="mr-step').slice(1).map(r => '<div class="mr-step' + r); if (p.length) p[p.length - 1] = p[p.length - 1].replace(/<\/div>$/, ""); return p; };
const rowOf = (h, label) => rowsOf(h).filter(r => r.indexOf(label) >= 0);
const onList = (h, id) => rowOf(h, LBL[id]).filter(r => r.indexOf("toggleRtStep(") >= 0).length;   // a live row (a waved one is greyed, with no tap)
// a tick on today's tab (Kids' Corner's): day is pinned to the real today
const tick = (d, slot, kid, label) => d.run("(function(){ day=_todayDay; const s=rtStepsFor('" + slot + "','" + kid + "',false,day)||[]; const i=s.findIndex(function(x){ return x&&x.label===" + J(label) + "&&x.cad!=='none'; }); if(i<0) return -1; toggleRtStep('" + slot + "','" + kid + "',i); return i; })()");
const stepIdx = (d, slot, kid, label) => d.run("(function(){ day=_todayDay; return (rtStepsFor('" + slot + "','" + kid + "',false,day)||[]).findIndex(function(x){ return x&&x.label===" + J(label) + "&&x.cad!=='none'; }); })()");
// every family ticks something each day; the lists only look back into last week when last week's check-offs exist (as today)
const teeth = d => d.run("(function(){ day=_todayDay; const i=morningStepsFor('kid_a').findIndex(function(s){ return s.label==='Brush teeth'; }); if(i>=0&&!mStepDoneOn('kid_a',day,i)) toggleMorningStep('kid_a',i); return i; })()");
const pop = (d, kid, slot) => d.run("(function(){ let h=''; const b=document.body.insertAdjacentHTML; document.body.insertAdjacentHTML=function(w,x){ h=x; }; try{ boardStatPop(" + J(kid) + "," + J(slot) + ",_todayDay); } finally{ document.body.insertAdjacentHTML=b; } return h; })()");
// every "— not done" line in the database: [kid, week, day, key, label]
const misses = w => { const L = w.db.tree.root.routineLog || {}, out = []; Object.keys(L).forEach(k => Object.keys(L[k] || {}).forEach(wk => Object.keys(L[k][wk] || {}).forEach(dn => Object.keys(L[k][wk][dn] || {}).forEach(key => { if (/^miss_/.test(key)) out.push([k, wk, dn, key, L[k][wk][dn][key].label]); })))); return out.sort((a, b) => J(a) < J(b) ? -1 : 1); };
const missWrites = (w, m) => w.since(m || 0).filter(l => /^routineLog\/[^/]+\/[^/]+\/[^/]+\/miss_/.test(l.path || ""));
const writes = (w, m) => w.since(m || 0).map(l => l.op + " " + l.path + " " + (l.keys || []).join(","));
const treeJ = w => JSON.stringify(w.db.tree.root);
const RED = /rt-late|is-late|#b91c1c|#ef4444|#fca5a5|#fef2f2|#fffafa/;

(async () => {
// ── A ──
console.log("\n── A · the wait, by how often (rtWaitDays: a third of the gap, at most 7) ──");
{ const { w, A } = await mkWorld("preview"); const wt = st => A.run("rtWaitDays(" + J(st) + ")");
  ok("daily → none", wt({ cad: "daily" }) === 0);
  ok("3 or more times a week (Mon Wed Fri) → none", wt({ cad: "wk:0,2,4" }) === 0 && wt({ cad: "wk:0,1,2,3,4" }) === 0);
  ok("twice a week (Tue Fri) → 1 day", wt({ cad: "wk:1,4" }) === 1);
  ok("weekly (Tue) → 2 days", wt({ cad: "wk:1" }) === 2 && wt({ cad: "wk:5" }) === 2);
  ok("every 2 weeks (a 2-week cycle) → 4 days", wt({ cad: "wk:1", cycW: 1, cycN: 2, cycStart: "2026-11-16" }) === 4);
  ok("the 4-week cycle and rarer → 7 days", wt({ cad: "wk:2", cycW: 1, cycN: 4, cycStart: "2026-11-16" }) === 7 && wt({ cad: "wk:2", cycW: 1, cycN: 8 }) === 7);
  ok("one function for every row (a later slice reads a per-chore setting there)", A.run("rtLateDays.toString()").indexOf("rtWaitCut") >= 0 && A.run("rtWaitCut.toString()").indexOf("rtWaitDays(") >= 0);
  void w;
}

// ── B ──
console.log("\n── B · 14 days, nothing done (preview, her setting): on its day and its wait, then gone, back on its next day ──");
const EXPECT = {   // the days (n) each chore is on its kid's Chores list
  a_vac: [1, 2, 3, 8, 9, 10], a_mirror: [1, 2, 4, 5, 8, 9, 11, 12], a_trash: [0, 2, 4, 7, 9, 11],
  c_plants: [1, 2, 3, 8, 9, 10], b_bikes: [5, 6, 7, 12, 13], b_blinds: [1, 2, 3, 4, 5], b_tub: [2, 3, 4, 5, 6], b_cage: [3, 4, 5, 10, 11, 12],
  a_table: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13], b_sink: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]
};
// every missed time: [kid, chore, due day n, drop day n]; filed under the due day's week and weekday
const DROPS = [["kid_a", "a_trash", 0, 1], ["kid_a", "a_mirror", 1, 3], ["kid_a", "a_vac", 1, 4], ["kid_a", "a_trash", 2, 3], ["kid_a", "a_trash", 4, 5],
  ["kid_a", "a_mirror", 4, 6], ["kid_a", "a_trash", 7, 8], ["kid_a", "a_mirror", 8, 10], ["kid_a", "a_vac", 8, 11], ["kid_a", "a_trash", 9, 10],
  ["kid_a", "a_trash", 11, 12], ["kid_a", "a_mirror", 11, 13],
  ["kid_c", "c_plants", 1, 2], ["kid_c", "c_plants", 2, 4], ["kid_c", "c_plants", 8, 9], ["kid_c", "c_plants", 9, 11],
  ["kid_b", "b_blinds", 1, 6], ["kid_b", "b_tub", 2, 7], ["kid_b", "b_cage", 3, 6], ["kid_b", "b_bikes", 5, 8], ["kid_b", "b_cage", 10, 13]];
const B1 = {};
{ const { w, A, B, C } = await mkWorld("preview"); const wkOf = {}; const seen = {}, html = {}, twoOf = [], mom = {}, kidPop = {}, holds = {};
  for (let n = 0; n < 14; n++) {
    await go(w, n, 7, 0); wkOf[n] = B.run("activeWk()");
    // two kid devices draw in the same moment (neither has heard the other yet), then again after they have
    const hA = [draw(B, "chores", "kid_a"), draw(C, "chores", "kid_a")], hB = [draw(B, "chores", "kid_b"), draw(C, "chores", "kid_b")]; await w.flush();
    draw(B, "chores", "kid_a"); draw(C, "chores", "kid_b"); pop(A, "kid_a", "chores"); pop(A, "kid_b", "chores"); await w.flush();   // Mom's device is open too
    draw(B, "chores", "kid_c"); await w.flush();
    await go(w, n, 17, 0); const a = draw(B, "chores", "kid_a"), b = draw(B, "chores", "kid_b"), c = draw(B, "chores", "kid_c"); await w.flush();
    html[n] = { kid_a: a, kid_b: b, kid_c: c }; holds[n] = A.run("(function(){ day=_todayDay; const s=rtStepsFor('chores','kid_a',false,day), i=s.findIndex(function(x){ return x.label==='Vacuum the den'; }); return rtDueOrLate('chores','kid_a',day,i,s[i]); })()");
    Object.keys(EXPECT).forEach(id => { const h = id[0] === "a" ? a : id[0] === "b" ? b : c; const k = onList(h, id); (seen[id] = seen[id] || []); if (k) seen[id].push(n); if (k > 1) twoOf.push([id, n, k]); });
    if (hA[0] !== hA[1] || hB[0] !== hB[1]) twoOf.push(["devices disagree", n]);
    mom[n] = { kid_a: pop(A, "kid_a", "chores"), kid_b: pop(A, "kid_b", "chores"), kid_c: pop(A, "kid_c", "chores") }; kidPop[n] = { kid_a: pop(B, "kid_a", "chores"), kid_b: pop(B, "kid_b", "chores") };
    teeth(B); await w.flush();
  }
  Object.keys(EXPECT).forEach(id => ok(LBL[id] + " (" + JOBS()[id].cad + (JOBS()[id].cycN ? ", " + JOBS()[id].cycN + "-week cycle" : "") + ") on the list on days " + EXPECT[id].join(","), J(seen[id]) === J(EXPECT[id]), seen[id]));
  ok("never two of a chore on one list, and two devices drawing at once draw the same list", twoOf.length === 0, twoOf);
  // the "— not done" lines
  const M = misses(w), want = DROPS.map(([k, id, due, drop]) => { const wk = wkOf[due] === wkOf[drop] || DN[dOf(due).getDay()] !== "sunday" ? (dOf(due).getDay() === 0 ? wkOf[due] : null) : null; void wk; return [k, id, due, drop]; });
  const keyOf = (k, id, due) => { const dn = DN[dOf(due).getDay()]; const wk = wkOf[due]; return [k, wk, dn, LBL[id] + " — not done"]; };
  const got = M.map(x => [x[0], x[1], x[2], x[4]]).sort((a, b) => J(a) < J(b) ? -1 : 1), exp = want.map(x => keyOf(x[0], x[1], x[2])).sort((a, b) => J(a) < J(b) ? -1 : 1);
  ok("exactly one \"— not done\" per missed time, filed under the day it was due (" + exp.length + " lines)", J(got) === J(exp), { got: got.filter(g => !exp.some(e => J(e) === J(g))), missing: exp.filter(e => !got.some(g => J(g) === J(e))) });
  const MW = missWrites(w);
  const wrongDay = want.filter(([k, id, due, drop]) => { const p = keyOf(k, id, due); const ws = MW.filter(l => l.path.indexOf("routineLog/" + k + "/" + p[1] + "/" + p[2] + "/") === 0 && (w.db.tree.root.routineLog[k][p[1]][p[2]][l.path.split("/").pop()] || {}).label === p[3]); return !ws.length || ws.some(l => nOfMs(l.at) !== drop); });
  ok("each line is written on the day the chore drops, never while it waits", wrongDay.length === 0, wrongDay);
  ok("…by plain targeted sets (routineLog/<kid>/<week>/<day>/miss_<list>_<i>), at most one per drawing device", MW.every(l => l.op === "set" && !l.whole) && MW.length <= 2 * exp.length, MW.length);
  const recs = M.map(x => w.db.tree.root.routineLog[x[0]][x[1]][x[2]][x[3]]);
  ok("…each line as today's: \"<chore> — not done\", act miss, its stars, missed:true", recs.every(r => r.act === "miss" && r.missed === true && /— not done$/.test(r.label) && typeof r.pts === "number"), recs[0]);
  // what a kid sees
  const vTue = rowOf(html[1].kid_a, LBL.a_vac)[0], vWed = rowOf(html[2].kid_a, LBL.a_vac)[0], vThu = rowOf(html[3].kid_a, LBL.a_vac)[0];
  ok("Vacuum the den on wait days 1 and 2 = its row on Tuesday, byte for byte", !!vTue && vWed === vTue && vThu === vTue, [vTue, vWed]);
  const tTue = rowOf(html[5].kid_b, LBL.b_bikes)[0], tSun = rowOf(html[6].kid_b, LBL.b_bikes)[0], tMon = rowOf(html[7].kid_b, LBL.b_bikes)[0];
  ok("Wash the bikes on Sunday and Monday (into the next week) = its Saturday row, byte for byte", !!tTue && tSun === tTue && tMon === tTue, [tTue, tSun]);
  const all = Object.keys(html).map(n => html[n].kid_a + html[n].kid_b).join("");
  ok("no list on any day says \"late\" or \"from \", or carries the red of the old tag", !/late/i.test(all) && all.indexOf("from ") < 0 && !RED.test(all));
  ok("…what differs between its day and a wait day is only the list's own count (Chores 0/3 on Tue, 0/2 on Thu)", /Chores <span[^>]*>0\/3</.test(html[1].kid_a) && /Chores <span[^>]*>0\/2</.test(html[3].kid_a), [html[1].kid_a.slice(0, 400)]);
  ok("a waiting chore holds the list (and its bonus) open as today: Wed and Thu yes; dropped (Fri … Mon) it does not", holds[2] === true && holds[3] === true && [4, 5, 6, 7].every(n => holds[n] === false) && holds[8] === true, holds);
  ok("the day it drops it is just not there (Friday: no Vacuum the den, nothing in its place)", onList(html[4].kid_a, "a_vac") === 0 && rowsOf(html[4].kid_a).length === 3, rowsOf(html[4].kid_a).length);
  // Mom's notes
  ok("Mom's Kids today pop-up: Vacuum the den \"from Tue · day 1 of 2\" on Wednesday, \"day 2 of 2\" on Thursday", /Vacuum the den \+10 ⭐<span[^>]*>from Tue · day 1 of 2<\/span>/.test(mom[2].kid_a) && /Vacuum the den \+10 ⭐<span[^>]*>from Tue · day 2 of 2<\/span>/.test(mom[3].kid_a), mom[2].kid_a.slice(0, 900));
  ok("…Wash the bikes \"from Sat · day 2 of 2\" on Monday; Shine the mirror \"from Tue · day 1 of 1\"", /Wash the bikes \+8 ⭐<span[^>]*>from Sat · day 2 of 2</.test(mom[7].kid_b) && /Shine the mirror \+4 ⭐<span[^>]*>from Tue · day 1 of 1</.test(mom[2].kid_a));
  ok("…Scrub the tub (4-week cycle) \"from Wed · day 4 of 4\" on Sunday: its cycle week ends that night", /Scrub the tub \+12 ⭐<span[^>]*>from Wed · day 4 of 4</.test(mom[6].kid_b), (mom[6].kid_b.match(/Scrub the tub[^<]*<span[^>]*>[^<]*/) || [""])[0]);
  ok("…the note is grey and plain (no red, no \"late\")", !RED.test(mom[2].kid_a) && !/late/.test(mom[2].kid_a));
  ok("…a chore on its own day has no note (Shine the mirror on Friday: Tuesday's turn has already dropped)", /Shine the mirror \+4 ⭐<\/span>/.test(mom[4].kid_a) && mom[4].kid_a.indexOf("from Tue") < 0);
  ok("…never past its next day: Water the plants (Tue + Wed) has no \"from Tue\" on Wednesday — Tuesday's dropped when Wednesday came; Thursday says \"from Wed · day 1 of 1\"", /Water the plants \+3 ⭐<\/span>/.test(mom[2].kid_c) && /Water the plants \+3 ⭐<span[^>]*>from Wed · day 1 of 1</.test(mom[3].kid_c), [mom[2].kid_c.slice(0, 700)]);
  const kp = Object.keys(kidPop).map(n => kidPop[n].kid_a + kidPop[n].kid_b).join("");
  ok("a kid's device opening the same pop-up: no note, no \"late\", no red", kp.indexOf("from ") < 0 && !/late/.test(kp) && !RED.test(kp) && /Vacuum the den/.test(kidPop[2].kid_a));
  Object.assign(B1, { html, mom });
}

// ── C ──
console.log("\n── C · done in its wait: full stars, counted done, the list's bonus as today, no \"— not done\" ──");
{ const run = async index => { const { w, B } = await mkWorld("preview", index); const out = {};
    for (let n = 0; n < 9; n++) { await go(w, n, 7, 0); draw(B, "chores", "kid_a"); draw(B, "chores", "kid_b"); await w.flush();
      await go(w, n, 17, 0);
      teeth(B); if (n === 1) tick(B, "chores", "kid_b", "Dust the blinds"); if (n === 2) tick(B, "chores", "kid_b", "Scrub the tub"); if (n === 3) tick(B, "chores", "kid_b", "Clean the hamster cage");
      if (n === 2) { tick(B, "chores", "kid_a", "Wipe the table"); tick(B, "chores", "kid_a", "Empty the trash"); tick(B, "chores", "kid_a", "Shine the mirror"); await w.flush();
        const m = w.mark(); tick(B, "chores", "kid_a", "Vacuum the den"); await w.flush(); out.tick1 = writes(w, m); out.bank1 = J(w.get("bank/kid_a")); out.html1 = draw(B, "chores", "kid_a"); }
      if (n === 7) { tick(B, "chores", "kid_b", "Rinse the sink"); await w.flush(); const m = w.mark(); tick(B, "chores", "kid_b", "Wash the bikes"); await w.flush(); out.tick2 = writes(w, m); out.bank2 = J(w.get("bank/kid_b")); }
      draw(B, "chores", "kid_a"); draw(B, "chores", "kid_b"); await w.flush(); }
    out.miss = misses(w); return out; };
  const N = await run(undefined);
  ok("no \"— not done\" for Vacuum the den (done Wed, wait day 1) or Wash the bikes (done Mon, wait day 2)", !N.miss.some(x => /Vacuum the den|Wash the bikes/.test(x[4])), N.miss);
  ok("…the list counts it done: Chores ✓ on Wednesday (a late row ticked leaves the count, as before: 2/2)", /sl-check-row done/.test(N.html1) && /2\/2/.test(N.html1), N.html1.slice(0, 300));
  if (BASE) { const O = await run(BASE);
    ok("Vacuum the den on Wednesday: every write of the tick (its stars, the list's bonus, the day bonus, the log) = the app before", J(N.tick1) === J(O.tick1), [N.tick1, O.tick1]);
    ok("…and the bank after it = the app before (10 ⭐, not less)", N.bank1 === O.bank1 && /"amount":10\b/.test(N.bank1));
    ok("Wash the bikes on Monday (next week): the tick's writes and the bank = the app before", J(N.tick2) === J(O.tick2) && N.bank2 === O.bank2 && /"amount":8\b/.test(N.bank2), [N.tick2, O.tick2]);
    ok("(the app before filed a \"— not done\" for both the first time they were late; this one files none)", O.miss.some(x => /Vacuum the den/.test(x[4])) && O.miss.some(x => /Wash the bikes/.test(x[4])));
  } else console.log("  (skipped: the app before)");
}

// ── D ──
console.log("\n── D · every chore done on its day for 14 days: everything = the app before, byte for byte ──");
if (BASE) { const run = async index => { let { w, A, B } = await mkWorld("preview", index); const snaps = [];
    for (let n = 0; n < 14; n++) { await go(w, n, 7, 0);
      // Sunday morning: the devices reload. A device left open over the week change reads last week's ticks from a stale copy for a
      // moment (prevSlState is never cleared when the week moves on — a bug before this change, in the report), and the old and the
      // new rule file different phantom lines from it; that is not what this part measures.
      if (dOf(n).getDay() === 0) { w.devs.splice(0); A = w.boot("A", "devA", { mom: true }); B = w.boot("B", "devB"); await w.flush(); }
      const s0 = [draw(B, "chores", "kid_a"), draw(B, "chores", "kid_b"), draw(B, "afternoon", "kid_a")]; await w.flush();
      await go(w, n, 17, 0); B.run("day=_todayDay"); teeth(B);
      ["kid_a", "kid_b"].forEach(k => { const st = JSON.parse(B.run("JSON.stringify(rtStepsFor('chores','" + k + "',false,day))")); st.forEach(x => { if (x && x.cad !== "none" && B.run("cadDueOn(" + J(x.cad || "daily") + ",day)&&stepWindowOk(" + J(x) + ",day)")) tick(B, "chores", k, x.label); }); });
      ["kid_a", "kid_b"].forEach(k => { const i = stepIdx(B, "afternoon", k, B.run("(rtStepsFor('afternoon','" + k + "',false,day)[0]||{}).label")); if (i >= 0) B.run("toggleRtStep('afternoon','" + k + "'," + i + ")"); }); await w.flush();
      snaps.push(J([s0, draw(B, "chores", "kid_a"), draw(B, "chores", "kid_b"), pop(A, "kid_a", "chores"), pop(A, "kid_b", "chores"), J(W.lists(B, { days: [DN[dOf(n).getDay()]] }))])); }
    return { snaps, writes: writes(w, 0).join("\n"), tree: treeJ(w), miss: misses(w) }; };
  const N = await run(undefined), O = await run(BASE);
  const bad = N.snaps.map((s, i) => s === O.snaps[i] ? null : isoN(i)).filter(Boolean);
  ok("every kid list (morning and evening draw), Mom's pop-ups and every list's rows: the app before on all 14 days", bad.length === 0, bad);
  ok("every write in 14 days is the app before's, in order (" + N.writes.split("\n").length + " writes)", N.writes === O.writes, (() => { const x = N.writes.split("\n"), y = O.writes.split("\n"); const i = x.findIndex((l, j) => l !== y[j]); return [i, x[i], y[i]]; })());
  ok("the whole database after 14 days (the log, the bank) is the app before's, byte for byte", N.tree === O.tree);
  ok("(sanity) nothing was ever missed: no \"— not done\" at all", N.miss.length === 0 && O.miss.length === 0, N.miss);
} else console.log("  (skipped: the app before)");

// ── E ──
console.log("\n── E · a missed week with ✕ skip, 🌅 Send to next morning, a turn wheel and dailies: as before ──");
if (BASE) { const run = async index => { const { w, A, B } = await mkWorld("preview", index); const out = { day: [] };
    for (let n = 0; n < 10; n++) { await go(w, n, 7, 0); const a0 = draw(B, "chores", "kid_a"), b0 = draw(B, "chores", "kid_b"); await w.flush();
      if (n === 1) { const m = w.mark(); A.run("rtWave('chores','kid_a',_todayDay," + stepIdx(A, "chores", "kid_a", "Vacuum the den") + ")"); await w.flush(); out.wave = writes(w, m); }
      if (n === 5) { const m = w.mark(); A.run("amSend('chores','kid_b',_todayDay," + stepIdx(A, "chores", "kid_b", "Wash the bikes") + ")"); await w.flush(); out.send = writes(w, m); }
      await go(w, n, 17, 0); teeth(B); await w.flush(); const a = draw(B, "chores", "kid_a"), b = draw(B, "chores", "kid_b"), pa = draw(B, "afternoon", "kid_a"), pb = draw(B, "afternoon", "kid_b");
      const keep = h => rowsOf(h).filter(r => /Wipe the table|Rinse the sink|Pickup the|opacity:\.55|text-decoration:line-through/.test(r)).join("");
      out.day.push(J([keep(a0), keep(b0), keep(a), keep(b), pa, pb, B.run("JSON.stringify(typeof amFor==='function'?amFor('kid_b',_todayDay):[])"), B.run("typeof mrIndividualHTML==='function'?mrIndividualHTML('kid_b'):''")]));
      out.vacOn = (out.vacOn || []).concat(onList(a, "a_vac") ? [n] : []); out.bikesOn = (out.bikesOn || []).concat(onList(b, "b_bikes") ? [n] : []); await w.flush(); }
    out.miss = misses(w); out.am = J(w.get("amCarry")); out.waved = J(w.get("waved")); return out; };
  const N = await run(undefined), O = await run(BASE);
  const bad = N.day.map((s, i) => s === O.day[i] ? null : isoN(i)).filter(Boolean);
  ok("the daily rows (Wipe the table, Rinse the sink), the turn wheel's rows (Pickup the den / porch), the waved row, the 🌅 morning list: the app before on all 10 days", bad.length === 0, bad);
  ok("✕ today on Vacuum the den (Tuesday): the same writes as before (the wave record + its log line)", J(N.wave) === J(O.wave) && N.waved === O.waved, [N.wave, O.wave]);
  ok("…it does not wait: off the list from Tuesday, back next Tuesday (and then waits as usual)", J(N.vacOn) === J([8, 9]), N.vacOn);
  ok("🌅 Send to next morning on Wash the bikes (Saturday): the same writes as before, the same morning list", J(N.send) === J(O.send) && N.am === O.am, [N.send, O.send]);
  ok("…it does not wait on the Chores list (it is on the morning list)", J(N.bikesOn) === J([5]), N.bikesOn);
  ok("no \"— not done\" for the waved chore or the sent one (10 days: neither has dropped since)", !N.miss.some(x => /Vacuum the den|Wash the bikes/.test(x[4])) && N.miss.length > 0, N.miss.filter(x => /Vacuum|bikes/.test(x[4])));
} else console.log("  (skipped: the app before)");

// ── F ──
console.log("\n── F · the plan ON, a missed week: the stored days are the app before's; an animal row waits and drops ──");
if (BASE) { const run = async index => { const { w, B } = await mkWorld("on", index); const out = { cage: [] };
    for (let n = 0; n < 9; n++) { await go(w, n, 7, 0); const h = draw(B, "chores", "kid_b"); out.cage.push(onList(h, "b_cage")); await w.flush(); await go(w, n, 17, 0); draw(B, "chores", "kid_a"); draw(B, "chores", "kid_b"); teeth(B); await w.flush(); }
    const t = w.db.tree.root; out.houseDay = J(t.houseDay); out.hdWrites = writes(w, 0).filter(l => /houseDay/.test(l)); out.miss = misses(w); out.built = Object.keys(t.houseDay || {}).length; return out; };
  const N = await run(undefined), O = await run(BASE);
  ok("every stored day (houseDay: plans, carries, drops, notes) = the app before's, byte for byte (" + N.built + " days)", N.houseDay === O.houseDay && N.built >= 8, N.built);
  ok("…and every houseDay write, in order", J(N.hdWrites) === J(O.hdWrites));
  ok("Clean the hamster cage (an animal row: the lists' own rule under ON) on Thu and its 2 wait days, then gone", J(N.cage.map((c, i) => c ? i : -1).filter(i => i >= 0)) === J([3, 4, 5]), N.cage);
  ok("…its \"— not done\" filed once, under Thursday", N.miss.filter(x => /hamster/.test(x[4])).length === 1 && N.miss.filter(x => /hamster/.test(x[4]))[0][2] === "thursday");
} else console.log("  (skipped: the app before)");

// ── G ──
console.log("\n── G · the first day after the change lands (Monday): chores 3–6 days late under the old rule leave with no second line ──");
if (BASE) { const w = await W.world({ household: household("preview"), tree: tree(), index: BASE }); const oA = w.boot("oA", "devOA", { mom: true }), oB = w.boot("oB", "devOB"); await w.flush();
  for (let n = 0; n < 7; n++) { await go(w, n, 7, 0); draw(oB, "chores", "kid_a"); draw(oB, "chores", "kid_b"); await w.flush(); await go(w, n, 17, 0); draw(oB, "chores", "kid_a"); draw(oB, "chores", "kid_b"); teeth(oB); await w.flush(); }
  const before = misses(w), linesBefore = J(w.db.tree.root.routineLog);
  w.devs.splice(0, w.devs.length);   // the old app is gone from every device
  const NEW = process.env.HOUSE_INDEX || path.join(__dirname, "index.html");
  const nB = bootOn(w, NEW, "nB", "devNB"), nA = bootOn(w, NEW, "nA", "devNA", true); await w.flush();
  await go(w, 7, 7, 0); const m = w.mark(); draw(nB, "chores", "kid_b"); await w.flush();   // the first draw asks for last week's ticks
  const a = draw(nB, "chores", "kid_a"), b = draw(nB, "chores", "kid_b"); await w.flush();
  const gone = ["a_vac", "a_mirror", "b_blinds", "b_tub", "b_cage"].filter(id => onList(id[0] === "a" ? a : b, id));
  ok("Monday: Vacuum the den (6 days), Shine the mirror (3), Dust the blinds (6), Scrub the tub (5), the hamster cage (4) are off the lists", gone.length === 0, gone);
  ok("…Wash the bikes (2 days, inside its wait) is still there, as a plain row", onList(b, "b_bikes") === 1 && !/late/.test(b));
  ok("…no \"— not done\" written: each already has its line from the old rule (" + before.length + " lines)", missWrites(w, m).length === 0 && J(w.db.tree.root.routineLog) === linesBefore, missWrites(w, m).map(l => l.path));
  for (let n = 8; n < 10; n++) { await go(w, n, 7, 0); draw(nB, "chores", "kid_a"); draw(nB, "chores", "kid_b"); teeth(nB); await w.flush(); }
  const after = misses(w);
  ok("Tuesday: Wash the bikes drops; still one line for it (the old one), and none of last week's lines doubled", after.filter(x => /Wash the bikes/.test(x[4])).length === 1 && before.every(x => after.some(y => J(y) === J(x))) && missWrites(w, m).every(l => !before.some(x => l.path.indexOf("routineLog/" + x[0] + "/" + x[1] + "/" + x[2] + "/" + x[3]) === 0)), after.filter(x => !before.some(y => J(y) === J(x))));
  void nA; void oA;
} else console.log("  (skipped: the app before)");

if (BASE) try { fs.unlinkSync(BASE); } catch (e) {}
console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
})().catch(e => { console.log("CRASH " + (e && e.stack || e)); process.exit(1); });
