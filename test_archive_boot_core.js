/* test_archive_boot_core.js — ARCHBOOT, slice 4 of PLAN_archive_window_2026-11-21.md (her "Start slice 4" 2026-11-23)
 *
 * Devices start on the smaller copy of the past weeks (archiveCore) instead of the full record (archive). The main
 * screens read only the kept fields; anything that needs every detail (a build, a re-lay, History, a print) asks
 * archiveEnsureAll(), which now fetches the full record, and waits for it.
 *
 *   1. static: one start-up listener on the copy, the full record only through archLoadFull, the waits in place
 *   2. a start reads the copy, not the full record — kids' devices never fetch the full record on the main screens
 *   3. the main screens show exactly what they show on the full record ("minus the feature": the same tree, started on the full record)
 *   4. a build waits for every past week, then builds the same week
 *   5. Mom's direct re-lay (reprojectSubjectWeek) waits and then runs — it used to skip — with the same result
 *   6. a schedule re-lay (relayWeek) waits for every past week and lays the same week
 *   7. History fetches the full record and shows it
 *   8. the copy isn't trusted when it's empty or behind: the full record at once (and after a week closes)
 *   9. optional, read-only: ARCH_CORE_SNAPSHOT=<folder with archive.json + archiveCore.json> — the sizes a start reads
 *   run: node test_archive_boot_core.js
 */
"use strict";
process.env.TZ = "America/New_York";
const fs = require("fs"), path = require("path"), os = require("os");
const SB = require(path.join(__dirname, "test_fixtures", "demo_week_sandbox.js"));
const FX = JSON.parse(fs.readFileSync(path.join(__dirname, "test_fixtures", "living_demo_family.json"), "utf8"));
const INDEX = path.join(__dirname, "index.html");
const SRC = fs.readFileSync(INDEX, "utf8");
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + (typeof x === "string" ? x : JSON.stringify(x)).slice(0, 700) + ")" : "")); } };
const clone = v => v === undefined ? undefined : JSON.parse(JSON.stringify(v));

// slice 1's audited copy and its made-up past weeks — one source
const CORE_TEST = fs.readFileSync(path.join(__dirname, "test_archive_core.js"), "utf8");
const grab = re => { const m = re.exec(CORE_TEST); if (!m) throw new Error("test_archive_core.js changed shape: " + re); return m[1]; };
const T = (0, eval)("(function(clone){ " + grab(/(const ARCH_CORE = \{[\s\S]*?\n\};)/) + "\n" + grab(/(const pick = [^\n]*)/) + "\n" +
  grab(/(function archCoreOf\(aw\) \{[\s\S]*?\n\})/) + "\n" + grab(/(const FAM = [^\n]*)/) + "\n" + grab(/(function makePast\(liveTasks\) \{[\s\S]*?\n\})/) + "\n" +
  "return {archCoreOf, makePast}; })")(clone);

// ── the tree minus the feature: the same app, started on the full record (what every device did before slice 4) ──
const B0 = SRC.indexOf("// ARCHBOOT_START"), B1 = SRC.indexOf("// ARCHBOOT_END");
const MINUS = SRC.replace(/function archBootListen\(\)\{[\s\S]*?\n\}\n/, 'function archBootListen(){ if(typeof db==="undefined"||!db) return; archLoadFull("start"); }\n');
const MINUS_PATH = path.join(os.tmpdir(), "ha_archboot_minus_" + process.pid + ".html");
fs.writeFileSync(MINUS_PATH, MINUS);
process.on("exit", () => { try { fs.unlinkSync(MINUS_PATH); } catch (e) {} });

const AT = new Date(2026, 10, 8, 0, 0, 30).getTime();   // Sunday 11/8 — the demo family's week 1 (Nov 9–15) is built at the first start
async function world(tree, o) {
  o = o || {};
  const clock = SB.makeClock(o.at || AT); clock.boot = clock.now; const sched = SB.makeScheduler(clock);
  const db = SB.makeDb(tree, clock, sched);
  const d = SB.bootDevice({ name: o.name || "A", dev: o.dev || "devM", db, clock, sched, family: FX.family, indexPath: o.index || INDEX });
  if (o.mom !== false) d.momOn();
  await sched.run(clock.now + 30000);
  return { d, db, clock, sched };
}
const listensTo = (W, p) => W.db.listeners.some(l => l.path === p && l.dev === (W.d.devId || l.dev) && l.ev === "value");
const archPaths = W => W.db.listeners.filter(l => /^archive/.test(l.path)).map(l => l.path).sort();
// each page's own draw function into a fresh element (the router reads the device's chrome first; the page itself is what the past weeks feed)
async function page(W, fn) { await W.sched.run(W.clock.now + 1000); return W.d.run("(function(){ const el=document.createElement('div'); " + fn + "(el); return el.innerHTML; })()"); }

(async () => {
  // the family as it is after its first week is built, with five past weeks and their copy
  const W0 = await world(clone(FX.db));
  const base = clone(W0.db.tree.root);
  const live = W0.d.tasks().filter(t => t && t.id && !String(t.id).endsWith("_c"));
  const past = {}; const made = T.makePast(live);
  Object.keys(made).forEach(k => { past["week" + (90 + parseInt(k.slice(4), 10))] = made[k]; });   // week91…week95: no clash with the live week1
  Object.keys(past).forEach(k => { past[k].weekLabel = k; });
  const coreOf = A => { const c = {}; Object.keys(A).forEach(k => { c[k] = T.archCoreOf(A[k]); }); return c; };
  const tree = (extra) => Object.assign(clone(base), { archive: clone(past), archiveCore: coreOf(past) }, extra || {});
  ok("(the family's week is built and active before the checks start)", W0.d.get("WK") === "week1" && live.length > 20, { WK: W0.d.get("WK"), n: live.length });

  console.log("\n── 1. static ──");
  {
    ok("ARCHBOOT is in index.html once", B0 > 0 && B1 > B0 && SRC.split("// ARCHBOOT_START").length === 2);
    const outside = SRC.slice(0, B0) + SRC.slice(B1);
    ok("the start listens through archBootListen() (initFb no longer opens the full record itself)", /\n\s*archBootListen\(\);/.test(outside) && !/ref\("archive"\)\.on\(/.test(outside));
    const block = SRC.slice(B0, B1);
    ok("the copy is listened to once, the full record only inside archLoadFull", (block.match(/ref\("archiveCore"\)\.on\(/g) || []).length === 1 && (block.match(/ref\("archive"\)\.on\(/g) || []).length === 1 && /function archLoadFull\(why\)\{[\s\S]*ref\("archive"\)\.on\(/.test(block));
    ok("…and the full record stops the copy's listener (the copy never overwrites it)", /ref\("archiveCore"\)\.off\("value",_archCoreCb\)/.test(block) && /if\(_archFullOn\) return;/.test(block));
    ok("archiveEnsureAll() fetches the full record when it isn't here", /function archiveEnsureAll\(\)\{[^}]*archLoadFull\("needed"\)/.test(SRC));
    ok("Mom's direct re-lay waits for it (reprojectSubjectWeek)", /function reprojectSubjectWeek\([\s\S]{0,2500}?archiveWhenAll\(function\(\)\{ reprojectSubjectWeek\(kid,sk,why,opts\); \}\)/.test(SRC));
    ok("the schedule re-lay waits for it (_rlwFire), with one named re-run", /function _rlwFire\(att\)\{\n[^\n]*\n\s*if\(typeof archiveWhenAll==="function"&&!archiveWhenAll\(_rlwArchRefire\)\) return;/.test(SRC));
    ok("the self-build asks for it last — after its own data says a build is due", /if\(!_abDue\(_abDueCtx\(\)\)\)[^\n]*\n\s*if\(typeof archiveEnsureAll==="function"\?!archiveEnsureAll\(\):!fbArchiveLoaded\)/.test(SRC));
    ok("the diary's archMs is stamped in one place (copy or full, the first to arrive)", (SRC.match(/cdMark\("archMs"\)/g) || []).length === 1);
  }

  console.log("\n── 2. a start reads the copy ──");
  const C = await world(tree());                         // Mom's phone, started with slice 4
  const F = await world(tree(), { index: MINUS_PATH });  // the same tree, started the old way
  {
    ok("Mom's device: listens to archiveCore only", JSON.stringify(archPaths(C)) === JSON.stringify(["archiveCore"]), archPaths(C));
    ok("…holds the copy (every week, no card details) and says so", C.d.get("archCoreOnly") === true && C.d.get("fbArchiveLoaded") === false &&
      JSON.stringify(Object.keys(C.d.get("archive")).sort()) === JSON.stringify(Object.keys(past).sort()) && !("detail" in C.d.get("archive").week91.tasks[0]));
    ok("…and its in-memory copy is exactly the stored copy", JSON.stringify(C.d.get("archive")) === JSON.stringify(C.db.get("archiveCore")));
    ok("the old way (baseline): listens to the full record", JSON.stringify(archPaths(F)) === JSON.stringify(["archive"]) && F.d.get("fbArchiveLoaded") === true);
    const K = await world(tree(), { mom: false, dev: "devK", name: "K" });
    for (const t of ["kids", "schedule", "mastery", "notebook", "units"]) { try { K.d.run("showTab('" + t + "')"); } catch (e) {} await K.sched.run(K.clock.now + 3000); }
    ok("a kid's device on every main page never fetches the full record", JSON.stringify(archPaths(K)) === JSON.stringify(["archiveCore"]) && K.d.get("fbArchiveLoaded") === false, archPaths(K));
  }

  console.log("\n── 3. the main screens are the same on the copy ──");
  {
    const pages = [["schedule", "renderSchedule"], ["Kids' Corner", "renderKidsCorner"], ["Mom's Day", "renderMomsPlan"], ["Pace", "renderPace"]];
    const diffs = [], sizes = [];
    for (const [name, call] of pages) {
      const a = await page(C, call), b = await page(F, call);
      if (a !== b) diffs.push(name + " (" + a.length + " vs " + b.length + ")");
      sizes.push(name + " " + a.length);
    }
    console.log("        page sizes drawn: " + sizes.join(" · "));
    ok("schedule, Kids' Corner, Mom's Day and Pace draw the same on the copy as on the full record", !diffs.length && sizes.every(x => / [1-9]\d{3,}$/.test(x)), diffs.concat(sizes));
    const ans = d => JSON.parse(d.run("JSON.stringify(Object.fromEntries(ROSTER.map(k=>[k,Object.keys(((currData&&currData.subjects)||{})[k]||{}).map(sk=>{ try{ return [sk,paceAutoCount(k,sk),Object.keys(completedLessonKeys()||{}).length]; }catch(e){ return [sk,'x']; } })])))"));
    ok("…and the lesson counts behind them match for every kid and subject", JSON.stringify(ans(C.d)) === JSON.stringify(ans(F.d)));
    ok("…without fetching the full record", JSON.stringify(archPaths(C)) === JSON.stringify(["archiveCore"]) && C.d.get("fbArchiveLoaded") === false, archPaths(C));
    // the comparison can see a difference: a copy missing one kept field (history ts — the streaks) draws differently
    const bad = tree(); Object.values(bad.archiveCore).forEach(w => Object.values(w.history || {}).forEach(h => { if (h && typeof h === "object") delete h.ts; }));
    const Bd = await world(bad);
    const dif = [];
    for (const [name, fn] of pages) if ((await page(Bd, fn)) !== (await page(F, fn))) dif.push(name);
    const ansB = ans(Bd.d), ansF = ans(F.d);
    ok("(a copy missing a kept field is caught: " + (dif.join(", ") || "no page") + (JSON.stringify(ansB) !== JSON.stringify(ansF) ? " + counts" : "") + " differ)", dif.length > 0 || JSON.stringify(ansB) !== JSON.stringify(ansF));
  }

  console.log("\n── 4. a build waits for every past week ──");
  {
    const W = await world(tree());
    const first = W.d.run("JSON.stringify(generateWeek(gwEffectiveConfig(2)))");
    ok("on the copy, the build refuses (nothing built from part of the past weeks)…", /Past weeks are still loading/.test(first), first.slice(0, 200));
    ok("…and that fetches the full record", W.db.listeners.some(l => l.path === "archive"));
    await W.sched.run(W.clock.now + 5000);
    ok("once it's here: the full record replaces the copy and the copy's listener is gone", W.d.get("fbArchiveLoaded") === true && W.d.get("archCoreOnly") === false &&
      JSON.stringify(archPaths(W)) === JSON.stringify(["archive"]) && "detail" in W.d.get("archive").week91.tasks[0]);
    const strip = s => JSON.stringify((JSON.parse(s).result || {}).tasks || []);
    const now = W.d.run("JSON.stringify(generateWeek(gwEffectiveConfig(2)))"), old = F.d.run("JSON.stringify(generateWeek(gwEffectiveConfig(2)))");
    ok("…and the same week is built as on the old start", strip(now) === strip(old) && JSON.parse(now).result.tasks.length > 0, [JSON.parse(now).result && JSON.parse(now).result.tasks.length, JSON.parse(old).result && JSON.parse(old).result.tasks.length]);
    // a later change to the copy (another device's write) never overwrites the full record here
    W.db.api("devX").ref("archiveCore/week91").update({ weekLabel: "changed elsewhere" }); await W.sched.run(W.clock.now + 2000);
    ok("…and a later change to the copy never replaces the full record on this device", "detail" in W.d.get("archive").week91.tasks[0] && W.d.get("archive").week91.weekLabel === "week91");
  }

  console.log("\n── 5. Mom's direct re-lay waits, then runs ──");
  {
    // the demo family has no plan-backed subject: treat one subject with cards this week as plan-backed, the same on both starts
    const pick = d => JSON.parse(d.run("JSON.stringify((function(){ const n={}; weekData.tasks.forEach(t=>{ if(t&&t.who&&t.subjectKey&&(currData.subjects[t.who]||{})[t.subjectKey]) { const k=t.who+'|'+t.subjectKey; n[k]=(n[k]||0)+1; } }); const best=Object.keys(n).sort((a,b)=>n[b]-n[a])[0]; return best?best.split('|'):null; })())"));
    const ks = pick(C.d);
    ok("(a subject with cards this week to re-lay)", !!ks, ks);
    if (ks) {
      const run = async (W) => {
        W.d.run("planBacked=function(k,sk){ return k===" + JSON.stringify(ks[0]) + "&&sk===" + JSON.stringify(ks[1]) + "; };");
        W.d.run("globalThis.__rp=null; reprojectSubjectWeek(" + JSON.stringify(ks[0]) + "," + JSON.stringify(ks[1]) + ",'mom',{then:function(v){ __rp=v||'none'; }})");
        const before = W.d.get("__rp");
        await W.sched.run(W.clock.now + 8000);
        return { before, after: W.d.get("__rp"), cards: JSON.stringify(W.d.tasks().filter(t => t.who === ks[0] && t.subjectKey === ks[1]).map(t => [t.id, t.day, t.time, t.title])) };
      };
      const W = await world(tree()), Fb = await world(tree(), { index: MINUS_PATH });
      const a = await run(W), b = await run(Fb);
      ok("on the copy it doesn't run yet (it waits instead of skipping)…", a.before === null);
      ok("…the full record arrives and the re-lay runs (its then() is called)", a.after !== null && W.d.get("fbArchiveLoaded") === true, a);
      ok("…with the same cards as on the old start", a.cards === b.cards, { copy: a.cards.slice(0, 200), old: b.cards.slice(0, 200) });
    }
  }

  console.log("\n── 6. a schedule re-lay waits for every past week ──");
  {
    const run = async (W) => {
      W.d.run("relayWeek('settings',{label:'test'})");
      await W.sched.run(W.clock.now + 15000);
      return JSON.stringify(W.d.tasks().map(t => [t.id, t.who, t.day, t.time]).sort());
    };
    const W = await world(tree()), Fb = await world(tree(), { index: MINUS_PATH });
    const a = await run(W), b = await run(Fb);
    ok("on the copy the re-lay fetches the full record and runs (no 'another device' give-up)", W.d.get("fbArchiveLoaded") === true && !W.db.debug.some(x => /catches up on its next sweep/.test(x.msg || "")));
    ok("…and lays the same week as on the old start", a === b);
  }

  console.log("\n── 7. History fetches the full record ──");
  {
    const W = await world(tree());
    const h1 = W.d.run("(function(){ const el=document.getElementById('content'); renderHistory(el); return el.innerHTML; })()");
    ok("History says Loading past weeks… and fetches the full record", /Loading past weeks/.test(h1) && W.db.listeners.some(l => l.path === "archive"));
    await W.sched.run(W.clock.now + 5000);
    const h2 = W.d.run("(function(){ const el=document.getElementById('content'); renderHistory(el); return el.innerHTML; })()");
    const h3 = F.d.run("(function(){ const el=document.getElementById('content'); renderHistory(el); return el.innerHTML; })()");
    ok("…then shows the same History as the old start", !/Loading past weeks/.test(h2) && h2 === h3 && h2.length > 500, [h2.length, h3.length]);
  }

  console.log("\n── 8. when the copy isn't trusted ──");
  {
    const noCopy = clone(tree()); delete noCopy.archiveCore;
    const W1 = await world(noCopy);
    ok("no copy yet (a family that hasn't tapped Make the copy): the full record at once", JSON.stringify(archPaths(W1)) === JSON.stringify(["archive"]) && W1.d.get("fbArchiveLoaded") === true);
    // the active week is week96 (a copy of this week's cards, so nothing is due); last week = week95
    const at96 = extra => { const t = tree(extra); t.ha_active_wk = "week96"; t.week96 = clone(t.week1); return t; };
    const good = await world(at96());
    ok("the copy has last week: it is used", good.d.get("WK") === "week96" && good.d.get("archCoreOnly") === true && JSON.stringify(archPaths(good)) === JSON.stringify(["archiveCore"]), { WK: good.d.get("WK"), p: archPaths(good) });
    const behindT = at96(); delete behindT.archiveCore.week95;
    const behind = await world(behindT);
    ok("the copy is missing last week (closed where the copy wasn't kept): the full record at once", behind.d.get("fbArchiveLoaded") === true && JSON.stringify(archPaths(behind)) === JSON.stringify(["archive"]));
    // a week closes while a device runs on the copy: the new week's copy write arrives → still the copy
    const close = async (writeCopy) => {
      const W = await world(at96());
      const x = W.db.api("devX");
      const wk = clone(W.db.get("archive/week95")); wk.weekLabel = "week96";
      const upd = { "archive/week96": wk, ha_active_wk: "week97", week97: clone(W.db.get("week96")) };
      if (writeCopy) upd["archiveCore/week96"] = T.archCoreOf(wk);
      x.ref().update(upd);
      await W.sched.run(W.clock.now + 8000);
      return W;
    };
    const w1 = await close(true);
    ok("a week closes with its copy (slice 3's one update): the device stays on the copy", w1.d.get("WK") === "week97" && w1.d.get("archCoreOnly") === true && w1.d.get("fbArchiveLoaded") === false && !!w1.d.get("archive").week96);
    const w2 = await close(false);
    ok("a week closes WITHOUT its copy: five seconds later the device fetches the full record", w2.d.get("WK") === "week97" && w2.d.get("fbArchiveLoaded") === true && !!w2.d.get("archive").week96.tasks);
  }

  console.log("\n── 9. live sizes (read-only copy; nothing printed but sizes) ──");
  const SNAP = process.env.ARCH_CORE_SNAPSHOT;
  if (SNAP && fs.existsSync(path.join(SNAP, "archive.json")) && fs.existsSync(path.join(SNAP, "archiveCore.json"))) {
    const A = fs.readFileSync(path.join(SNAP, "archive.json"), "utf8"), Cc = fs.readFileSync(path.join(SNAP, "archiveCore.json"), "utf8");
    const a = JSON.parse(A) || {}, c = JSON.parse(Cc) || {};
    ok("live: the copy has every week the full record has", Object.keys(a).every(k => k in c) && Object.keys(c).length === Object.keys(a).length);
    console.log("        live: a start reads " + (Cc.length / 1e6).toFixed(2) + " MB of past weeks instead of " + (A.length / 1e6).toFixed(2) + " MB (" + Math.round(100 - 100 * Cc.length / A.length) + "% less)");
  } else console.log("(live sizes not run — set ARCH_CORE_SNAPSHOT=<folder with read-only GETs of archive.json and archiveCore.json>)");

  console.log("\n" + pass + " passed, " + fail + " failed");
  process.exit(fail ? 1 : 0);
})().catch(e => { console.log("CRASH " + (e && e.stack || e)); process.exit(1); });
