/*
 * test_newfam_seed_button.js — MCSEEDNF (her "Yes, remove it" 2026-11-24, new-family slice 1): the "✨ Start with the morning /
 * afternoon / night basics" button on Home Base ▸ 🏡 My day offers Mom's OWN routine (MC_SEEDS: water + electrolyte, coffee +
 * creatine, adrenal cocktails, magnesium…). A family that is not Howe no longer gets it: the button is not drawn, the line above
 * it no longer ends in "or:", and mcSeedSlot() adds nothing if called anyway. Nothing is put in its place.
 * Howe: byte for byte as before. A family that tapped it in the past keeps what it saved.
 * BASELINE = this index.html with the two MCSEEDNF lines put back the way they were. Whole app in the repo sandbox, made-up family.
 *   node test_newfam_seed_button.js
 */
"use strict";
process.env.TZ = "America/New_York";
const fs = require("fs"), path = require("path"), os = require("os");
const S = require(path.join(__dirname, "test_fixtures", "demo_week_sandbox.js"));
const INDEX = process.env.NEWFAM_INDEX || path.join(__dirname, "index.html");
const SRC = fs.readFileSync(INDEX, "utf8");
let pass = 0, fail = 0;
const ok = (c, m, why) => { if (c) pass++; else { fail++; console.log("  ✗ " + m + (why !== undefined ? "  → " + JSON.stringify(why).slice(0, 400) : "")); } };

// the baseline: the two lines (kept once, in the sandbox) taken back out, plus a marker so the sandbox leaves it that way
S.MCSEEDNF.forEach(([was, now], i) => ok(SRC.split(now).length === 2, "MCSEEDNF line " + (i + 1) + " is in index.html exactly once"));
let BASE_SRC = SRC; S.MCSEEDNF.forEach(([was, now]) => { BASE_SRC = BASE_SRC.split(now).join(was); });
ok(BASE_SRC.split("MCSEEDNF").length === 1, "the baseline is this tree minus the feature");
{ const L = BASE_SRC.split("\n"), a = L.lastIndexOf("<script>"); L.splice(a + 1, 0, "// MCSEEDNF baseline: the two lines taken out (test_newfam_seed_button.js)"); BASE_SRC = L.join("\n"); }
const BASE = path.join(os.tmpdir(), "newfam_seed_base_" + process.pid + ".html");
fs.writeFileSync(BASE, BASE_SRC);
process.on("exit", () => { try { fs.unlinkSync(BASE); } catch (e) {} });

const FAMILY = { familyId: "ridge", familyName: "Ridge Family", windowText: "School day",
  firebase: { apiKey: "x", authDomain: "x.local", databaseURL: "https://x.local", projectId: "x" },
  roster: [{ id: "nora", name: "Nora", color: "#1e3a5f", badge: "#dbeafe", schoolAge: true }, { id: "teo", name: "Teo", color: "#c45e1a", badge: "#ffedd5", schoolAge: false }] };
const START = new Date(2026, 10, 24, 10, 0, 0).getTime();   // Tuesday 24 Nov 2026, 10:00
const SLOTS = ["morning", "afternoon", "night"];
async function boot(index, family, tree) {
  const clock = S.makeClock(START); clock.boot = clock.now; const sched = S.makeScheduler(clock);
  const db = S.makeDb(tree || {}, clock, sched);
  let seed = 7; const M = Object.create(Math); M.random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const A = S.bootDevice({ name: "mom", dev: "dev_a", db, clock, sched, family, indexPath: index, globals: { Math: M } });
  await sched.run(clock.now + 3000); A.momOn(); await sched.run(clock.now + 3000);
  A.run('var __asked=[]; confirm=function(m){ __asked.push(String(m)); return true; };');   // every question the app asks, answered yes
  const strip = sl => A.run('mpSlot=' + JSON.stringify(sl) + '; momDayStripHTML(_todayStr(),mdTodayName())');   // Home Base ▸ 🏡 My day, as drawn
  const home = () => { const c = A.ctx.document.getElementById("content"); c.innerHTML = ""; A.run('tab="moms-plan"; momDayIn=true; mpSlot=null; mcManage=false; mpSubView="plan"; renderMomsPlan(document.getElementById("content"))'); return String(c.innerHTML); };
  const tap = async sl => { const m = db.log.length; A.run("__asked=[]"); A.run("mcSeedSlot(" + JSON.stringify(sl) + ")"); await sched.run(clock.now + 1500);
    return { writes: db.log.slice(m).filter(w => !/^(connDiary|settings\/codeVersion)/.test(w.path)).map(w => [w.op, w.path]), asked: JSON.parse(A.run("JSON.stringify(__asked)")), tree: JSON.stringify(db.tree.root) }; };
  return { A, db, sched, strip, home, tap, js: e => JSON.parse(A.run("JSON.stringify(" + e + ")")) };
}
async function scenario(index, family, tree) {
  const o = {};
  let B = await boot(index, family, tree);
  o.strips = SLOTS.map(B.strip); o.home = B.home(); o.list = B.js("mcAll()");
  o.dad = B.A.run('mpSlot="afternoon"; momDayStripHTML(_todayStr(),mdTodayName(),"dad")');   // Dad's My day keeps its own line
  o.taps = [];
  for (const sl of SLOTS) { B = await boot(index, family, tree); o.taps.push(await B.tap(sl)); }
  o.errs = B.sched.errors.length;
  o.seeds = B.js("MC_SEEDS");
  return o;
}
const text = h => String(h).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");

(async () => {
  console.log("test_newfam_seed_button.js — the ✨ basics button is Howe's only");
  // ── a new family ──────────────────────────────────────────────────────────────────────────────────────────────────
  const N = await scenario(INDEX, FAMILY, {}), N0 = await scenario(BASE, FAMILY, {});
  ok(N0.strips.every(h => /mcSeedSlot\(/.test(h)) && /Start with the morning basics/.test(N0.home), "baseline: a new family WAS offered the button at every time of day (what this removes)");
  SLOTS.forEach((sl, i) => {
    ok(!/mcSeedSlot\(|basics<\/button>|Start with the/.test(N.strips[i]), "new family, " + sl + ": no ✨ basics button on 🏡 My day");
    ok(text(N.strips[i]).indexOf("Nothing set for " + sl + " yet — ✎ Edit to slot a chore you already have. ") >= 0 && !/you already have, or:/.test(N.strips[i]),
      "new family, " + sl + ": the line reads \"Nothing set for " + sl + " yet — ✎ Edit to slot a chore you already have.\" (no dangling \"or:\")");
  });
  ok(!/mcSeedSlot\(|Start with the/.test(N.home), "new family: the whole Home Base page has no button");
  SLOTS.forEach((sl, i) => ok(N.taps[i].writes.length === 0 && N.taps[i].asked.length === 0 && !(JSON.parse(N.taps[i].tree).momChores),
    "new family: mcSeedSlot('" + sl + "') called anyway asks nothing and writes nothing", N.taps[i]));
  ok(N0.taps.every(t => t.writes.length > 0 && t.asked.length === 1), "baseline: the same tap DID ask and write", N0.taps.map(t => t.writes.length));
  ok(N.dad === N0.dad && !/mcSeedSlot\(/.test(N.dad), "Dad's 🏡 My day: unchanged (it never had the button)");
  ok(N.errs === 0, "no timer threw");

  // ── Howe: byte for byte ─────────────────────────────────────────────────────────────────────────────────────────────
  const H = await scenario(INDEX, undefined, {}), H0 = await scenario(BASE, undefined, {});
  ok(H.strips.every(h => /mcSeedSlot\(/.test(h)) && /✨ Start with the morning basics/.test(H.home), "Howe: the button is still on every empty time of day");
  ok(H.strips.every((h, i) => h === H0.strips[i]) && H.home === H0.home, "Howe: 🏡 My day (3 times of day) and Home Base are the same bytes as before");
  ok(H.taps.every((t, i) => JSON.stringify(t) === JSON.stringify(H0.taps[i])), "Howe: each tap asks the same question and writes the same rows, database identical");
  ok(H.taps[0].asked[0] === "Add " + H.seeds.morning.length + " starter morning items? You can rename or remove any of them after.", "Howe: the question is as before", H.taps[0].asked);
  const hm = JSON.parse(H.taps[0].tree).momChores || {};
  ok(H.seeds.morning.every(l => Object.values(hm).some(c => c && c.label === l && c.slot === "morning")), "Howe: a tap adds MC_SEEDS.morning to the morning list");

  // ── a non-Howe family that tapped it in the past keeps its rows ─────────────────────────────────────────────────────
  const PAST = { momChores: { _seeded: true } };
  N.seeds.morning.forEach((l, i) => { PAST.momChores["mcpast" + i] = { label: l, cad: "daily", slot: "morning", ts: 100 + i }; });
  const P = await scenario(INDEX, FAMILY, PAST), P0 = await scenario(BASE, FAMILY, PAST);
  ok(Object.keys(P.list).length === N.seeds.morning.length && JSON.stringify(P.list) === JSON.stringify(P0.list), "tapped before: her " + N.seeds.morning.length + " saved rows are still her list, unchanged");
  ok(N.seeds.morning.every(l => P.strips[0].indexOf(l) >= 0), "tapped before: they still show on ☀️ Morning");
  ok(P.taps.every(t => t.writes.length === 0), "tapped before: nothing is cleaned up or written");
  ok(!/mcSeedSlot\(/.test(P.strips[1]) && !/mcSeedSlot\(/.test(P.strips[2]), "tapped before: no button on her empty afternoon / night either");
  ok(P.strips[0] === P0.strips[0], "tapped before: ☀️ Morning (filled) draws exactly as before");

  console.log((fail ? "FAIL" : "PASS") + " — " + pass + " passed, " + fail + " failed");
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error("CRASH", e); process.exit(1); });
