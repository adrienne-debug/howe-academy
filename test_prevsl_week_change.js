/*
 * test_prevsl_week_change.js — PREVSLWK (found 2026-11-19 while building the chore wait; her "fix all fixes"): last week's
 * check-offs (prevSlState) were never forgotten when the week moved on. A device left open over the week change kept the week
 * before last, so on Sunday morning, until last week's read landed, every chore due last week read as missed: the lists showed it
 * (late or waiting) and filed a permanent "— not done" line. Now it is cleared the moment the week moves on; the late rule says
 * nothing until last week lands, then is as normal.
 * The WHOLE app per device (test_fixtures/house_world.js), made-up family, every chore done on its day for two weeks, the devices open throughout:
 *   1 · a device left open across the week change: no "— not done" line, no late or waiting row from the stale week — and the app
 *       before this fix (git show 6b3fe607:index.html) did file them (so the check means something);
 *   2 · after last week's read lands: the rule as normal — a Saturday chore really missed waits Sun and Mon, drops Tuesday, one line;
 *   3 · a device that reloads on Sunday: every draw and every write = the app before, byte for byte.
 *   run: node test_prevsl_week_change.js        HOUSE_INDEX=<a copy> → the branch side (a mutation check)
 */
"use strict";
const fs = require("fs"), path = require("path"), os = require("os"), cp = require("child_process");
const W = require(path.join(__dirname, "test_fixtures", "house_world.js"));
let pass = 0, fail = 0; const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x).slice(0, 500) + ")" : "")); } };
const J = x => JSON.stringify(x), clone = x => JSON.parse(J(x));
const BASE_SHA = "6b3fe607";
let BASE = null; try { const t = path.join(os.tmpdir(), "prevsl_base_" + process.pid + ".html"); fs.writeFileSync(t, cp.execSync("git show " + BASE_SHA + ":index.html", { cwd: __dirname, maxBuffer: 64 << 20, stdio: ["ignore", "pipe", "ignore"] })); BASE = t; } catch (e) { BASE = null; }
console.log("(the app before: " + (BASE ? BASE_SHA : "none — git show " + BASE_SHA + " failed; the checks against it are skipped") + ")");

const K = o => Object.assign({ src: { kind: "routine" }, status: "active", area: "cleaning", verdict: "", note: "", level: 1 }, o);
const JOBS = () => ({
  a_table: K({ label: "Wipe the table", who: "kid_a", slot: "chores", cad: "daily", minutes: 5, pts: 5, order: 0 }),
  a_vac: K({ label: "Vacuum the den", who: "kid_a", slot: "chores", cad: "wk:3", minutes: 15, pts: 10, order: 1 }),
  a_trash: K({ label: "Empty the trash", who: "kid_a", slot: "chores", cad: "wk:0,2,4", minutes: 5, pts: 3, order: 2 }),
  a_teeth: K({ label: "Brush teeth", who: "kid_a", slot: "morning", cad: "daily", area: "health", order: 0 }),
  b_bikes: K({ label: "Wash the bikes", who: "kid_b", slot: "chores", cad: "wk:5", minutes: 20, pts: 8, order: 0 }),
  b_mirror: K({ label: "Shine the mirror", who: "kid_b", slot: "chores", cad: "wk:3,4", minutes: 5, pts: 4, order: 1 }),
  b_sink: K({ label: "Rinse the sink", who: "kid_b", slot: "chores", cad: "daily", minutes: 5, pts: 2, order: 2 })
});
const household = () => ({ jobs: JOBS(), people: clone(W.PEOPLE), meta: { takeover: 1, engine: { mode: "preview", on: "2026-11-09" } } });
const dOf = n => new Date(2026, 10, 16 + n);
const go = (w, n, h) => { const d = dOf(n); return w.at(d.getFullYear(), d.getMonth() + 1, d.getDate(), h, 0); };
const draw = (d, kid) => d.run("(function(){ const d0=day; day=_todayDay; try{ rtOpen={}; return rtSlotHTML('chores'," + J(kid) + "); } finally{ day=d0; } })()");
const rows = h => (h.split(/<div class="mr-step[ "]/).slice(1).map(r => r.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()));
const misses = w => { const L = w.db.tree.root.routineLog || {}, out = []; Object.keys(L).forEach(k => Object.keys(L[k] || {}).forEach(wk => Object.keys(L[k][wk] || {}).forEach(dn => Object.keys(L[k][wk][dn] || {}).forEach(key => { if (/^miss_/.test(key)) out.push(k + "/" + wk + "/" + dn + "/" + L[k][wk][dn][key].label); })))); return out.sort(); };
// every chore due today ticked on the kid's device (and teeth, so the week's check-offs exist)
const doAll = (B, skip) => B.run("(function(){ day=_todayDay; ['kid_a','kid_b'].forEach(function(k){ (rtStepsFor('chores',k,false,day)||[]).forEach(function(x,i){ if(x&&x.cad!=='none'&&cadDueOn(x.cad||'daily',day)&&stepWindowOk(x,day)&&!rtDoneOn('chores',k,day,i)&&" + J(skip || []) + ".indexOf(x.label)<0) toggleRtStep('chores',k,i); }); }); const t=morningStepsFor('kid_a').findIndex(function(s){ return s.label==='Brush teeth'; }); if(t>=0&&!mStepDoneOn('kid_a',day,t)) toggleMorningStep('kid_a',t); })()");

async function week(index, o) { o = o || {};
  const w = await W.world({ household: household(), index }); let A = w.boot("A", "devA", { mom: true }), B = w.boot("B", "devB"); await w.flush();
  // two weeks open on the same devices (the first week change only loads last week; the second is the one that went stale)
  for (let n = 0; n < 13; n++) { await go(w, n, 7); draw(B, "kid_a"); draw(B, "kid_b"); await w.flush(); await go(w, n, 17); doAll(B, n === 12 ? o.skip : []); await w.flush(); draw(B, "kid_a"); draw(B, "kid_b"); await w.flush(); }
  const out = { w };
  await go(w, 13, 7);   // Sunday 11/29: the week moves on again (the active week flips on the weekend)
  if (o.reload) { w.devs.splice(0); A = w.boot("A", "devA", { mom: true }); B = w.boot("B", "devB"); await w.flush(); }
  const m = w.mark();
  out.first = [draw(B, "kid_a"), draw(B, "kid_b")]; out.firstPop = A.run("(function(){ let h=''; const b=document.body.insertAdjacentHTML; document.body.insertAdjacentHTML=function(w,x){ h=x; }; try{ boardStatPop('kid_b','chores',_todayDay); } finally{ document.body.insertAdjacentHTML=b; } return h; })()");
  await w.flush(); out.firstWrites = w.since(m).map(l => l.op + " " + l.path);
  out.after = [draw(B, "kid_a"), draw(B, "kid_b")]; await w.flush();
  for (const n of [14, 15]) { await go(w, n, 7); out["d" + (n - 7)] = [draw(B, "kid_a"), draw(B, "kid_b")]; await w.flush(); }
  out.miss = misses(w); out.writes = w.since(0).map(l => l.op + " " + l.path + " " + (l.keys || []).join(",")).join("\n"); out.tree = J(w.db.tree.root);
  return out; }

(async () => {
console.log("\n── 1 · a device left open over the week change, every chore done on its day ──");
{ const N = await week(undefined);
  ok("Sunday morning, before last week's read lands: no row from last week on either list (only today's dailies)", rows(N.first[0]).every(r => /Wipe the table/.test(r)) && rows(N.first[1]).every(r => /Rinse the sink/.test(r)), N.first.map(rows));
  ok("…no late tag, no Mom's note in her pop-up", !/rt-late|is-late/.test(N.first.join("")) && !/from (Sat|Fri|Thu|Wed)/.test(N.firstPop));
  ok("…and no \"— not done\" written that morning, nor in the whole run", !N.firstWrites.some(p => /miss_/.test(p)) && N.miss.length === 0, N.miss);
  if (BASE) { const O = await week(BASE);
    ok("(the app before, the same device left open: it filed \"— not done\" lines for chores that were done)", O.miss.length > 0, O.miss);
  } else console.log("  (skipped: the app before)");
}
console.log("\n── 2 · after last week's read lands: the rule as normal ──");
{ const N = await week(undefined, { skip: ["Wash the bikes"] });
  const bikes = h => rows(h).filter(r => /Wash the bikes/.test(r)).length;
  ok("Wash the bikes (Saturday) really missed: not shown in the stale moment, shown once the read lands (Sunday), still Monday (its wait)", bikes(N.first[1]) === 0 && bikes(N.after[1]) === 1 && bikes(N.d7[1]) === 1, [rows(N.first[1]), rows(N.after[1])]);
  ok("…gone Tuesday, with exactly one \"— not done\" under last Saturday; nothing else filed", bikes(N.d8[1]) === 0 && J(N.miss) === J(["kid_b/week3/saturday/Wash the bikes — not done"]), N.miss);
}
console.log("\n── 3 · a device that reloads on Sunday: as today ──");
if (BASE) { const N = await week(undefined, { reload: true, skip: ["Wash the bikes"] }), O = await week(BASE, { reload: true, skip: ["Wash the bikes"] });
  ok("every draw (the first, after the read, Monday, Tuesday) = the app before, byte for byte", J([N.first, N.after, N.d7, N.d8]) === J([O.first, O.after, O.d7, O.d8]));
  ok("every write and the whole database = the app before", N.writes === O.writes && N.tree === O.tree);
  ok("(sanity) the missed chore's line was filed on both", N.miss.length === 1 && J(N.miss) === J(O.miss), N.miss);
} else console.log("  (skipped: the app before)");

if (BASE) try { fs.unlinkSync(BASE); } catch (e) {}
console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
})().catch(e => { console.log("CRASH " + (e && e.stack || e)); process.exit(1); });
