/*
 * test_archive_core_sync.js — PLAN_archive_window_2026-11-21.md, slice 3 (her "Start slice 3", 2026-11-22): ARCHCORE.
 * The smaller copy of the past weeks, archiveCore/<wk>, is written in step with archive/<wk>; Settings ▸ 📚 Past weeks fills it
 * once on her tap and checks it. Nothing reads it yet (slice 4).
 *
 * What it proves:
 *   1. Static: the app's ARCH_CORE is the audited list test_archive_core.js pins; nothing writes archive/ except archWrite; the
 *      five writers (gwCommit, loadJson, addManualAttWeek, setAttDate, ceWalkApply) all go through it.
 *   2. The app's archCoreOf gives exactly what slice 1's parity test proved safe (its archCoreOf, on its made-up weeks).
 *   3. In the whole app: a real week close (the Sunday self-build) writes BOTH copies in ONE update, and the copy matches; an
 *      attendance week, an attendance date and a walk-back do the same; a refused copy never costs the full record.
 *   4. The 📚 card: Mom only; it reads the copy once, counts what's missing; "Make the copy" writes every week in one update,
 *      removes a left-over week, re-reads and says all match; dry run writes nothing.
 *   5. Optional, read-only live data (ARCH_CORE_SNAPSHOT=<folder>, as in test_archive_core.js): the app's copy of every real week
 *      equals the audited copy, and its size.
 *   run: node test_archive_core_sync.js
 */
"use strict";
process.env.TZ = "America/New_York";
const fs = require("fs"), path = require("path");
const SB = require(path.join(__dirname, "test_fixtures", "demo_week_sandbox.js"));
const FX = JSON.parse(fs.readFileSync(path.join(__dirname, "test_fixtures", "living_demo_family.json"), "utf8"));
const INDEX = path.join(__dirname, "index.html");
const SRC = fs.readFileSync(INDEX, "utf8");
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + (typeof x === "string" ? x : JSON.stringify(x)).slice(0, 900) + ")" : "")); } };
const clone = v => v === undefined ? undefined : JSON.parse(JSON.stringify(v));

// slice 1's audited list, its archCoreOf and its made-up weeks — one source
const CORE_TEST = fs.readFileSync(path.join(__dirname, "test_archive_core.js"), "utf8");
const grab = re => { const m = re.exec(CORE_TEST); if (!m) throw new Error("test_archive_core.js changed shape: " + re); return m[1]; };
const T = (0, eval)("(function(clone){ " +
  grab(/(const ARCH_CORE = \{[\s\S]*?\n\};)/) + "\n" +
  grab(/(const pick = [^\n]*)/) + "\n" +
  grab(/(function archCoreOf\(aw\) \{[\s\S]*?\n\})/) + "\n" +
  grab(/(const FAM = [^\n]*)/) + "\n" +
  grab(/(function makePast\(liveTasks\) \{[\s\S]*?\n\})/) + "\n" +
  "return {ARCH_CORE, archCoreOf, makePast}; })")(clone);
// the same comparison Firebase makes possible: no nulls, no empty objects, a list reads like its 0..n keys, key order ignored
function canon(v) {
  if (v === null || v === undefined) return undefined;
  if (typeof v !== "object") return v;
  const o = {}; Object.keys(v).sort().forEach(k => { const c = canon(v[k]); if (c !== undefined) o[k] = c; });
  return Object.keys(o).length ? o : undefined;
}
const same = (a, b) => JSON.stringify(canon(a)) === JSON.stringify(canon(b));

// ── 1. static ───────────────────────────────────────────────────────────────────────────────────────────────────────────
console.log("\n── 1. one list, one door for every past-weeks write ──");
const blockA = SRC.indexOf("// ARCHCORE_START"), blockB = SRC.indexOf("// ARCHCORE_END");
{
  ok("ARCHCORE is in index.html once", blockA > 0 && blockB > blockA && SRC.split("// ARCHCORE_START").length === 2);
  const L = SRC.split("\n"), a = L.lastIndexOf("<script>"), b = L.lastIndexOf("</script>");
  const script = L.slice(a + 1, b).join("\n");
  const block = SRC.slice(blockA, blockB);
  const appList = (0, eval)("(" + /const ARCH_CORE=(\{[\s\S]*?\n\});/.exec(block)[1] + ")");
  ok("the app's field list is the audited one (test_archive_core.js)", JSON.stringify(appList) === JSON.stringify(T.ARCH_CORE), { app: appList, audit: T.ARCH_CORE });
  // every "archive/…" path text (a write target) outside the block — only the listener's db.ref("archive") may name the node
  const outside = script.slice(0, script.indexOf("// ARCHCORE_START")) + script.slice(script.indexOf("// ARCHCORE_END"));
  const lines = outside.split("\n").filter(l => !/^\s*\/\//.test(l));
  const named = lines.filter(l => /["'`]archive\//.test(l.replace(/\/\/.*$/, "")));
  ok("nothing outside archWrite names an archive/ path", !named.length, named.map(l => l.trim().slice(0, 140)));
  const refs = lines.filter(l => /\.ref\(\s*["'`]archive["'`]/.test(l));
  ok("…and db.ref(\"archive\") is only the start-up listener", refs.length === 1 && /\.on\("value"/.test(refs[0]), refs.map(l => l.trim().slice(0, 120)));
  const sites = {}; let cur = null;
  outside.split("\n").forEach(l => { const m = /^function\s+([\w$]+)/.exec(l); if (m) cur = m[1]; if (/[^\w$.]archWrite\(/.test(l) && !/^\s*\/\//.test(l)) sites[cur] = (sites[cur] || 0) + 1; });
  const want = ["addManualAttWeek", "setAttDate", "loadJson", "ceWalkApply", "gwCommit"];
  ok("the five writers go through archWrite: " + want.join(", "), JSON.stringify(Object.keys(sites).sort()) === JSON.stringify(want.slice().sort()) && want.every(f => sites[f] === 1), sites);
  ok("the week closes write the whole week ({\"\":entry}) — both of them", (outside.match(/archWrite\(oldWK,\{"":entry\}\)/g) || []).length === 2);
  ok("one multi-path update for both copies; the full record alone if it's refused", /pr=db\.ref\(\)\.update\(both\)/.test(block) && (block.match(/db\.ref\(\)\.update\(full\)/g) || []).length === 2);
  ok("the 📚 card is on Settings, after the pictures card", /pinHtml\+=picMoveCardHtml\(\);[^\n]*\n\s*if\(typeof archCoreCardHtml==="function"\) pinHtml\+=archCoreCardHtml\(\);/.test(SRC));
  ok("nothing new listens at start (the card reads the copy once, when Mom opens it)", !/archiveCore"\)\.on\(/.test(SRC) && /db\.ref\("archiveCore"\)\.once\("value"\)/.test(block));
}

// ── worlds ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
const AT = new Date(2026, 10, 8, 0, 0, 30).getTime();
const hm = (iso, h, m) => new Date(iso + "T" + String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0") + ":00").getTime();
async function world(tree, opts) {
  opts = opts || {};
  const clock = SB.makeClock(AT); clock.boot = clock.now; const sched = SB.makeScheduler(clock);
  const base = SB.makeDb(tree, clock, sched);
  let db = base;
  if (opts.refuseCore) {   // the server says no to any update that names archiveCore/
    db = Object.assign({}, base, { api(dev) { const a = base.api(dev); return Object.assign({}, a, { ref(p) { const r = a.ref(p);
      return Object.assign({}, r, { update(o) { if (Object.keys(o || {}).some(k => /^archiveCore\//.test(String((p ? p + "/" : "") + k)))) { base.log.push({ op: "refused", path: p || "", keys: Object.keys(o) }); return Promise.reject(new Error("PERMISSION_DENIED")); } return r.update(o); } }); } }); } });
  }
  const d = SB.bootDevice({ name: "A", dev: "devSync", db, clock, sched, family: FX.family, indexPath: INDEX });
  if (opts.mom !== false) d.momOn();
  await sched.run(clock.now + 30000);
  return { d, db: base, clock, sched };
}
const html = (d, call) => d.run("(function(){ const el=document.getElementById('ac-body'); el.innerHTML=" + call + "; return el.innerHTML; })()");
const coreWrites = (db, mark) => db.log.slice(mark).filter(w => (w.keys || []).some(k => /^archiveCore\//.test(k)) || /^archiveCore/.test(w.path));

(async () => {
  console.log("\n── 2. the app's copy is the one slice 1 proved ──");
  let live = null;
  {
    const W0 = await world(clone(FX.db));
    live = W0.d.tasks().filter(t => t && t.id && !String(t.id).endsWith("_c"));
    const past = T.makePast(live);
    W0.d.ctx.__past = past;
    const app = JSON.parse(W0.d.run("JSON.stringify(Object.fromEntries(Object.entries(__past).map(([k,v])=>[k,archCoreOf(v)])))"));
    const audit = Object.fromEntries(Object.entries(past).map(([k, v]) => [k, T.archCoreOf(v)]));
    ok("the app's archCoreOf = the audited one, on every made-up week (" + Object.keys(past).length + ")", Object.keys(past).every(k => same(app[k], audit[k])));
    ok("…cards keep id/who/title/day/subjectKey/lid only, history keys all kept", app.week1.tasks.every(t => Object.keys(t).every(f => T.ARCH_CORE.task.includes(f))) && Object.keys(app.week1.history).length === Object.keys(past.week1.history).length);
    ok("…a history record with no kept field stays as `true`", W0.d.run("archCoreOf({history:{x:{spent:1}}}).history.x") === true);
    ok("…a part-week write keeps only kept fields (detail dropped; a slot_points write isn't copied)", W0.d.run("JSON.stringify([archCoreAt('history/a',{who:'k',detail:'x'}),archCoreAt('slot_points/k',{a:1})===undefined,archCoreAt('checked/z',null),archCoreAt('dates/monday','Nov 2')])") === JSON.stringify([{ who: "k" }, true, null, "Nov 2"]));
  }

  console.log("\n── 3. every write keeps both copies in step ──");
  {
    const W = await world(clone(FX.db));
    const { d, db, clock, sched } = W;
    ok("the demo week is built (" + d.tasks().length + " cards), no past weeks yet", d.tasks().length > 40 && !db.get("archive") && !db.get("archiveCore"));
    // a few checks so the closed week has something in it
    const some = d.tasks().filter(t => t.who === "kid_a").slice(0, 4);
    d.ctx.__ids = some.map(t => t.id); d.run('__ids.forEach(id=>{ checked[id]="9:00 AM"; })');   // finished cards (the close reads the in-memory checks)
    await sched.run(clock.now + 5000);
    // Sunday 00:00: the next week builds itself and the week that ended is archived — _abBuild, the self-build's own step
    // (the one autoGenerateWeekIfNeeded runs inside the scheduler lock), so this is the real close: generateWeek → gwCommit
    let mark = db.log.length;
    clock.now = hm("2026-11-15", 0, 0) + 30000;
    d.run("_abBuild(2,null)"); await sched.run(clock.now + 120000);
    ok("week 2 is the live week now", d.get("WK") === "week2");
    const full = db.get("archive/week1"), core = db.get("archiveCore/week1");
    ok("the Sunday self-build closes week 1: the full record is saved", !!full && Array.isArray(full.tasks) && full.tasks.length > 40);
    ok("…and its smaller copy, in the SAME update", (() => { const w = db.log.slice(mark).filter(x => (x.keys || []).includes("archive/week1")); return w.length === 1 && w[0].keys.includes("archiveCore/week1"); })());
    ok("…the copy matches the full record's core", !!core && same(core, T.archCoreOf(full)));
    ok("…and it's smaller (" + JSON.stringify(full).length + " → " + JSON.stringify(core).length + " bytes)", JSON.stringify(core).length < JSON.stringify(full).length * 0.8);
    // Attendance: add a week, set a date
    mark = db.log.length;
    d.run('addManualAttWeek("week77")'); await sched.run(clock.now + 2000);
    ok("an attendance week: both copies, one update", !!db.get("archive/week77") && same(db.get("archiveCore/week77"), T.archCoreOf(db.get("archive/week77"))) && coreWrites(db, mark).length === 1);
    mark = db.log.length;
    d.run('setAttDate("week1","monday"," Nov 9 ")'); await sched.run(clock.now + 2000);
    ok("an attendance date: both copies", db.get("archive/week1/dates/monday") === "Nov 9" && db.get("archiveCore/week1/dates/monday") === "Nov 9" && coreWrites(db, mark).length === 1);
    // the editor's walk-back on a closed week removes the check and its history record from both
    const ck = Object.keys(db.get("archive/week1/checked") || {})[0];
    ok("(week 1 has a check to walk back)", !!ck);
    mark = db.log.length;
    d.set("_ceWalkItems", [{ archive: true, wk: "week1", doneKey: ck, title: "t", who: "kid_a", sk: "x" }]); d.run("ceWalkSel=new Set([0])");
    try { d.run("ceWalkApply()"); } catch (e) { ok("ceWalkApply ran", false, e.message); }
    await sched.run(clock.now + 2000);
    ok("a walk-back on a closed week: gone from both copies", ck && !db.get("archive/week1/checked/" + ck) && !db.get("archiveCore/week1/checked/" + ck) && !db.get("archiveCore/week1/history/" + ck));
    ok("…in one update", coreWrites(db, mark).length === 1);
    ok("the copies still match after all of it", Object.keys(db.get("archive")).every(wk => same(db.get("archiveCore/" + wk), T.archCoreOf(db.get("archive/" + wk)))));
  }
  {
    const W = await world(clone(FX.db), { refuseCore: true });
    const mark = W.db.log.length;
    W.d.run('addManualAttWeek("week78")'); await W.sched.run(W.clock.now + 3000);
    ok("if the copy is refused, the full record is still saved (alone), and no copy is half-written", !!W.db.get("archive/week78") && !W.db.get("archiveCore/week78") && W.db.log.slice(mark).some(w => w.op === "refused"));
  }

  console.log("\n── 4. Settings ▸ 📚 Past weeks ──");
  {
    const tree = Object.assign(clone(FX.db), { archive: T.makePast(live), archiveCore: { week99: { weekLabel: "week99" } } });
    const W = await world(tree);
    const { d, db, clock, sched } = W;
    ok("the card is there for Mom", /📚 Past weeks/.test(d.run("archCoreCardHtml()")));
    d.run("momModeActive=false; adminPinUnlocked=false;");
    const kidSees = d.run("(function(){ try{ return momHere(); }catch(e){ return 'x'; } })()") === false ? d.run("archCoreCardHtml()") : "";
    ok("…and not for anyone else", kidSees === "");
    d.momOn();
    let h = html(d, "_acBody()");
    ok("it reads the copy once (Checking the copy…)", /Checking the copy/.test(h));
    await sched.run(clock.now + 2000);
    h = html(d, "_acBody()");
    ok("then counts: 5 past weeks, 0 match, 5 not copied, 1 left over", /<b>5<\/b> past weeks · <b>0<\/b> match/.test(h) && /5 not copied yet/.test(h) && /1 left over/.test(h), h.slice(0, 300));
    ok("…with a Make the copy (5 weeks) button", /archCoreBackfill\(\)[^>]*>Make the copy \(5 weeks\)/.test(h));
    // dry run first
    d.run('HA_LS.setItem("ha_dryrun","1")');
    let mark = db.log.length;
    d.run("archCoreBackfill()"); await sched.run(clock.now + 2000);
    ok("dry run: nothing written, and it says so", coreWrites(db, mark).length === 0 && /Dry run — nothing was written \(5 weeks/.test(d.get("_acMsg")));
    d.run('HA_LS.removeItem("ha_dryrun")');
    mark = db.log.length;
    d.run("archCoreBackfill()"); await sched.run(clock.now + 3000); await sched.run(clock.now + 3000);   // the write, then the re-read
    const w = coreWrites(db, mark);
    ok("Make the copy: ONE update with every week (+ the left-over one removed)", w.length === 1 && w[0].keys.length === 6 && w[0].keys.includes("archiveCore/week99"), w.map(x => x.keys));
    ok("…every week's copy matches its full record", Object.keys(db.get("archive")).every(wk => same(db.get("archiveCore/" + wk), T.archCoreOf(db.get("archive/" + wk)))) && !db.get("archiveCore/week99"));
    ok("…it re-read the copy and says all match", /✓ Saved and checked: all 5 weeks match/.test(d.get("_acMsg")));
    h = html(d, "_acBody()");
    ok("…and the card now says the copy matches every week (no button)", /✓ The copy matches every past week/.test(h) && !/archCoreBackfill/.test(h));
    ok("the full past weeks weren't touched", !db.log.slice(mark).some(x => /^archive\//.test(x.path) || (x.keys || []).some(k => /^archive\//.test(k))));
  }

  // ── 5. live data, read only ──
  const SNAP = process.env.ARCH_CORE_SNAPSHOT;
  if (SNAP && fs.existsSync(path.join(SNAP, "archive.json"))) {
    console.log("\n── 5. live snapshot (read-only copy; names and titles never printed) ──");
    const A = JSON.parse(fs.readFileSync(path.join(SNAP, "archive.json"), "utf8")) || {};
    const W = await world(clone(FX.db));
    W.d.ctx.__A = A;
    const app = JSON.parse(W.d.run("JSON.stringify(Object.fromEntries(Object.entries(__A).map(([k,v])=>[k,archCoreOf(v)])))"));
    const bad = Object.keys(A).filter(wk => !same(app[wk], T.archCoreOf(A[wk])));
    ok("live: the app's copy of every real week (" + Object.keys(A).length + ") = the audited copy", !bad.length, bad);
    const kb = o => Math.round(JSON.stringify(o).length / 1024);
    console.log("        live: full " + kb(A) + " KB → copy " + kb(app) + " KB; the backfill's one update ≈ " + kb(app) + " KB");
  } else console.log("\n(live snapshot not run — set ARCH_CORE_SNAPSHOT=<folder of read-only GETs> to check the copy of every real week)");

  console.log("\n" + pass + " passed, " + fail + " failed");
  process.exit(fail ? 1 : 0);
})().catch(e => { console.log("CRASH " + (e && e.stack || e)); process.exit(1); });
