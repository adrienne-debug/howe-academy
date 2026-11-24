/*
 * test_archive_ensure.js — PLAN_archive_window_2026-11-21.md, slice 2 (her "Start slice 2", 2026-11-22): ARCHENSURE.
 * Builds, archive writes and the History page wait for EVERY past week; the main screens never wait.
 *
 * What it proves:
 *   1. Static: every group A/B reader of `archive` (the list test_archive_core.js pins) is behind archiveEnsureAll() /
 *      archiveWhenAll(): either its own first lines check it, or every call to it is on a guarded line or inside a guarded
 *      function. A group C/D reader (main screens) never checks it — kids' devices must never start the full load.
 *   2. While the archive listener hasn't answered (held in the sandbox): the week build refuses, gwCommit writes nothing,
 *      History says Loading, a past week on Mom's plan says Loading (and isn't cached), the frozen report isn't frozen, an
 *      attendance week waits, a schedule re-lay waits (it already waited for this week's own data); the Pace page and the kid
 *      status still answer, and nothing on them asks to wait.
 *   3. When it answers: what waited runs (the attendance week is written), the build works, History draws.
 *   4. Once the archive is here (every start today) the app is unchanged: the same build, the same History page, the same
 *      writes as this tree minus the feature.
 *   5. With no connection object it never waits (offline works on what the device has).
 *   6. The test can fail: drop the build's guard and the static check names generateWeek; on the tree minus the feature the
 *      build happily runs on an empty archive.
 *   run: node test_archive_ensure.js
 */
"use strict";
process.env.TZ = "America/New_York";
const fs = require("fs"), path = require("path"), os = require("os");
const SB = require(path.join(__dirname, "test_fixtures", "demo_week_sandbox.js"));
const FX = JSON.parse(fs.readFileSync(path.join(__dirname, "test_fixtures", "living_demo_family.json"), "utf8"));
const INDEX = path.join(__dirname, "index.html");
const SRC = fs.readFileSync(INDEX, "utf8");
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + (typeof x === "string" ? x : JSON.stringify(x)).slice(0, 900) + ")" : "")); } };
const clone = v => v === undefined ? undefined : JSON.parse(JSON.stringify(v));

// the reader groups and the code scanner come from slice 1's test, so there is one list
const CORE_TEST = fs.readFileSync(path.join(__dirname, "test_archive_core.js"), "utf8");
const GROUPS = (0, eval)("(" + /const GROUPS = (\{[\s\S]*?\n\});/.exec(CORE_TEST)[1] + ")");
const codeOnly = (0, eval)("(" + /(function codeOnly\(raw\) \{[\s\S]*?\n\})/.exec(CORE_TEST)[1] + ")");
const LOADERS = ["archBootListen", "archLoadFull", "boot"];   // the listeners themselves (ARCHBOOT slice 4: the copy at start, the full record on demand), and boot's dead ha_archive read (NO_MIRROR drops that key)

// ── 1. static: who waits ──────────────────────────────────────────────────────────────────────────────────────────────────
const GUARD = /archiveEnsureAll\(|archiveWhenAll\(/;
function coverage(src) {
  const L = src.split("\n"), a = L.lastIndexOf("<script>"), b = L.lastIndexOf("</script>");
  const code = codeOnly(L.slice(a + 1, b).join("\n"));
  const fns = {}, re = /^function\s+([A-Za-z_$][\w$]*)\s*\(/gm; let m;
  while ((m = re.exec(code))) {
    let dep = 0, e = -1, s = code.indexOf("{", m.index);
    for (let j = s; j < code.length; j++) { const ch = code[j]; if (ch === "{") dep++; else if (ch === "}") { dep--; if (!dep) { e = j; break; } } }
    fns[m[1]] = { start: m.index, open: s, end: e };
  }
  const ranges = Object.entries(fns).sort((x, y) => x[1].start - y[1].start);
  const enclosing = pos => { for (const [n, r] of ranges) if (pos > r.open && pos < r.end) return n; return null; };
  const lineAt = pos => { const s = code.lastIndexOf("\n", pos) + 1, e = code.indexOf("\n", pos); return code.slice(s, e < 0 ? code.length : e); };
  const self = f => { const r = fns[f]; if (!r) return false; return GUARD.test(code.slice(r.open, r.end).split("\n").slice(0, 4).join("\n")); };
  const memo = {};
  function covered(f, seen) {
    if (memo[f] !== undefined) return memo[f];
    if (self(f)) return (memo[f] = "own check");
    if (seen.has(f)) return "cycle";
    seen.add(f);
    const sites = [], cre = new RegExp("(^|[^\\w$.])" + f.replace(/\$/g, "\\$") + "\\s*\\(", "g"); let c;
    while ((c = cre.exec(code))) { const at = c.index + c[1].length; if (/function\s+$/.test(code.slice(Math.max(0, at - 12), at))) continue; sites.push(at); }
    if (!sites.length) { seen.delete(f); return (memo[f] = false); }   // reached only from onclick text → it must check itself
    const via = [];
    for (const at of sites) {
      const ln = lineAt(at);
      if (GUARD.test(ln.slice(0, at - (code.lastIndexOf("\n", at) + 1)))) { via.push("guarded line"); continue; }
      const enc = enclosing(at);
      const r = enc ? covered(enc, seen) : false;
      if (!r) { seen.delete(f); return (memo[f] = false); }
      via.push(enc);
    }
    seen.delete(f);
    return (memo[f] = "via " + [...new Set(via)].join(", "));
  }
  return { code, fns, self, covered: f => covered(f, new Set()) };
}
console.log("\n── 1. every build, write and History path waits; the main screens never do ──");
{
  ok("ARCHENSURE is in index.html once", SRC.split("// ARCHENSURE_START").length === 2 && SRC.indexOf("// ARCHENSURE_END") > SRC.indexOf("// ARCHENSURE_START"));
  const C = coverage(SRC);
  const AB = GROUPS.A.concat(GROUPS.B).filter(f => LOADERS.indexOf(f) < 0);
  const how = {}, open = [];
  AB.forEach(f => { const r = C.covered(f); how[f] = r; if (!r) open.push(f); });
  ok("every group A/B reader (" + AB.length + ") waits for the full past weeks", !open.length, open);
  AB.forEach(f => console.log("        " + f + ": " + how[f]));
  const waits = [].concat(GROUPS.C, GROUPS.D).filter(f => { const r = C.fns[f]; return r && GUARD.test(C.code.slice(r.open, r.end)); });
  ok("no group C/D reader (main screens, kids' devices) ever waits", !waits.length, waits);
  ok("the Pace page doesn't wait (its past-weeks numbers are main-screen ones: paceStreak is group D)", !GUARD.test(C.code.slice(C.fns.renderPace.open, C.fns.renderPace.end)) && GROUPS.D.indexOf("paceStreak") >= 0);
  ok("a schedule re-lay (relayWeek → _rlwFire) waits for every past week, like it waits for the week's own data", /function _rlwFire\(att\)\{[^\n]*\n(?:[^\n]*\n){1,2}\s*const ready=[^\n]*archiveEnsureAll\(\)/.test(SRC));   // ARCHBOOT (slice 4) adds its archiveWhenAll line above it
  ok("the archive listener lets the waiters go", /db\.ref\("archive"\)\.on\("value",[\s\S]{0,1200}?_archAllArrived\(\)/.test(SRC));
  // 6a. the static check can fail
  const noBuildGuard = SRC.replace(/\n  if\(typeof archiveEnsureAll==="function"&&!archiveEnsureAll\(\)\) return \{error:"Past weeks are still loading[^\n]*/, "");
  const C2 = coverage(noBuildGuard);
  ok("the test can fail: without the build's check, generateWeek and getCarryOverPool are named", noBuildGuard !== SRC && !C2.covered("generateWeek") && !C2.covered("getCarryOverPool"));
}

// ── the tree minus the feature (the baseline: same tree, ARCHENSURE taken out) ────────────────────────────────────────────
function minusFeature(src) {
  let s = src.replace(/\/\/ ARCHENSURE_START[\s\S]*?\/\/ ARCHENSURE_END\n/, "");
  s = s.split("\n").filter(ln => !(/\/\/ ARCHENSURE/.test(ln) && /^\s*(if\(|try\{ (if\(typeof _archAllArrived==="function"\) )?_archAllArrived)/.test(ln))).join("\n");
  s = s.replace('(typeof archiveEnsureAll!=="function"||archiveEnsureAll())?ceWalkGather():[]', "ceWalkGather()");
  s = s.replace(/&&\(typeof archiveEnsureAll!=="function"\|\|archiveEnsureAll\(\)\);   \/\/ ARCHENSURE[^\n]*/, ";");
  return s;
}
const MINUS = minusFeature(SRC);
const MINUS_PATH = path.join(os.tmpdir(), "ha_archensure_minus_" + process.pid + ".html");
fs.writeFileSync(MINUS_PATH, MINUS);
process.on("exit", () => { try { fs.unlinkSync(MINUS_PATH); } catch (e) {} });
const MINUS_NO_CORE = MINUS.replace(/\/\/ ARCHCORE_START[\s\S]*?\/\/ ARCHCORE_END/, "").replace(/\/\/ ARCHBOOT_START[\s\S]*?\/\/ ARCHBOOT_END/, "")
  .split("\n").filter(ln => !/ARCHBOOT/.test(ln)).join("\n");   // ARCHCORE (slice 3) and ARCHBOOT (slice 4) use the wait too, typeof-guarded
ok("the baseline has no trace of the feature", !/archiveEnsureAll|archiveWhenAll|_archAllArrived|_archWait/.test(MINUS_NO_CORE), (MINUS_NO_CORE.match(/.*(archiveEnsureAll|archiveWhenAll|_archAllArrived|_archWait).*/) || [""])[0].trim());

// ── worlds: the whole app, with the archive listener held back until we say ───────────────────────────────────────────────
function heldDb(tree, clock, sched, holding) {
  const base = SB.makeDb(tree, clock, sched), held = [];
  let hold = holding;
  return Object.assign({}, base, {
    api(dev) {
      const a = base.api(dev);
      return Object.assign({}, a, { ref(p) {
        const r = a.ref(p);
        if (hold && String(p) === "archive") return Object.assign({}, r, { on(ev, cb) { held.push(() => r.on(ev, cb)); return cb; } });
        return r;
      } });
    },
    release() { hold = false; held.splice(0).forEach(f => f()); }
  });
}
const AT = new Date(2026, 10, 8, 0, 0, 30).getTime();
function pastWeeks() {   // three small closed weeks (the build reads carry-overs and done lessons from them)
  const A = {};
  for (let w = 3; w <= 5; w++) A["week" + w] = { weekLabel: "week" + w, archivedAt: Date.UTC(2026, 9, 9 + 7 * w), dates: { monday: "October " + (5 + 7 * (w - 3)) },
    tasks: [{ id: "w" + w + "_1", who: "kid_a", title: "Old lesson " + w, day: "monday", time: "9:00 AM", dur: 20 }], checked: { ["w" + w + "_1"]: "9:20 AM" }, history: {} };
  return A;
}
async function world(indexPath, holding) {
  const clock = SB.makeClock(AT); clock.boot = clock.now; const sched = SB.makeScheduler(clock);
  const tree = Object.assign(clone(FX.db), { archive: pastWeeks() });
  const db = heldDb(tree, clock, sched, holding);
  const d = SB.bootDevice({ name: "A", dev: "devEnsure", db, clock, sched, family: FX.family, indexPath });
  d.momOn(); await sched.run(clock.now + 30000);
  return { d, db, clock, sched };
}
const CFG = 'generateWeek({weekNum:String(currWeekNum()),babysitter:{},withSitter:[],skipDays:[],lateStart:{},carSchool:{},saturday:false,redistribute:[],autoAdvance:true})';
const html = (d, call) => d.run("(function(){ const el=document.createElement('div'); " + call + "(el); return el.innerHTML; })()");
const LOADING = "Loading past weeks";

(async () => {
  console.log("\n── 2–3. before the past weeks arrive, and when they do ──");
  {
    const { d, db, clock, sched } = await world(INDEX, true);
    ok("held: the listener hasn't answered, so the app knows it doesn't have every week", d.get("fbArchiveLoaded") === false && d.run("archiveEnsureAll()") === false);
    d.set("WK", "week6"); d.run('weekData.week="week6"');   // the live week sits after the closed ones (no build has run: it waits too)
    let mark = db.log.length;
    const g = d.run("JSON.stringify(" + CFG + ")");
    ok("the week build refuses (\"Past weeks are still loading\") instead of building on part of the archive", /Past weeks are still loading/.test(JSON.parse(g).error || ""), g.slice(0, 200));
    d.run('gwResult={week:"week6",tasks:[{id:"x1",who:"kid_a",title:"t",day:"monday"}],dates:{},constraints:{},windows:{}}; gwCommit(); gwResult=null;');
    ok("gwCommit writes nothing (no archive/, no week, no tasks)", db.log.length === mark, db.log.slice(mark).map(w => w.op + " " + w.path));
    ok("History shows Loading past weeks", html(d, "renderHistory").indexOf(LOADING) >= 0);
    const mp = d.run("JSON.stringify(mpSchWkLoad(5))");
    ok("a past week on Mom's plan says Loading, and isn't cached as empty", JSON.parse(mp).loading === true && !d.run("mpSchWkCache.week5"), mp);
    d.run("digestEnsure()"); await sched.run(clock.now + 2000); mark = db.log.length;
    ok("the frozen weekly report isn't frozen from part of the archive", d.run("digestFreezeIfNeeded('week5')") === null && !db.log.slice(mark).some(w => /^digest/.test(w.path)));
    mark = db.log.length;
    d.run('addManualAttWeek("week77")');
    ok("an attendance week waits (nothing written yet, one waiter queued)", db.log.length === mark && d.run("_archWaitFns.length") === 1);
    d.run('addManualAttWeek("week77")');
    d.run("ceWalkOpen=false; ceWalkToggle(); ceWalkToggle();");
    ok("a second tap of the same button doesn't queue it twice", d.run("_archWaitFns.length") === 3 && d.get("ceWalkOpen") === false);
    d.run("_archWaitShown=false");
    const pace = html(d, "renderPace");
    let ks = null; try { ks = d.run("JSON.stringify(ROSTER.map(k=>paceKidStatus(k)))"); } catch (e) { ks = "ERR " + e.message; }
    ok("main screens don't wait: the Pace page draws, kid status answers, nothing asks for the full load", pace.indexOf(LOADING) < 0 && pace.length > 200 && ks && ks.indexOf("ERR") !== 0 && d.get("_archWaitShown") === false, { paceLen: pace.length, ks: String(ks).slice(0, 120) });
    // a re-lay asked for now waits (it retries every half second for ~10 s, as it does for the week's own data)
    mark = db.log.length;
    d.set("fbTasksLoaded", true);   // as if this week's cards had arrived, so the past weeks are the only thing it waits for
    d.run('relayWeek("settings",{label:"test re-lay"})');
    await sched.run(clock.now + 3000);
    ok("a schedule re-lay waits: no lock taken, nothing written, still pending", !db.log.slice(mark).some(w => /regen_lock|relayLog|^week\d+\/tasks/.test(w.path)) && !!d.get("_rlwPend"), db.log.slice(mark).map(w => w.op + " " + w.path));
    // offline: no connection object → never waits
    d.run("var __realDb=db; db=null;");
    ok("no connection object: it never waits (offline works on what the device has)", d.run("archiveEnsureAll()") === true);
    d.run("db=__realDb;");

    // ── 3. the listener answers ──
    d.run("_archWaitShown=true");   // as History left it
    let soon = 0; const realSoon = d.fn("renderAllSoon"); d.ctx.renderAllSoon = function () { soon++; return realSoon.apply(this, arguments); };
    const relAt = clock.now; db.release(); await sched.run(clock.now + 30000);
    ok("arrived: the app now knows it has every week", d.get("fbArchiveLoaded") === true && d.run("archiveEnsureAll()") === true);
    ok("what waited ran: the attendance week is written to archive/week77", !!db.get("archive/week77") && db.get("archive/week77").weekLabel === "week77");
    ok("…once, and the walk-back panel opened (toggle ran once, not open-then-shut)", d.run("_archWaitFns.length") === 0 && d.get("ceWalkOpen") === true);
    ok("the Loading page is redrawn", soon >= 1);
    ok("the waiting re-lay ran once the past weeks arrived", !d.get("_rlwPend") && db.log.some(w => /regen_lock/.test(w.path) && w.at >= relAt));
    ok("History draws", html(d, "renderHistory").indexOf(LOADING) < 0);
    const g2 = JSON.parse(d.run("JSON.stringify(" + CFG + ")"));
    ok("the week build works", !g2.error && g2.result && (g2.result.tasks || []).length > 20, g2.error);
    const mp2 = JSON.parse(d.run("JSON.stringify(mpSchWkLoad(5))"));
    ok("Mom's plan loads the past week", mp2.loading !== true || d.run("!!mpSchWkCache.week5"));
  }

  console.log("\n── 4. once the past weeks are here (every start today) nothing changes ──");
  {
    const F = await world(INDEX, false), M = await world(MINUS_PATH, false);
    ok("both copies boot with the archive loaded", F.d.get("fbArchiveLoaded") === true && M.d.get("fbArchiveLoaded") === true);
    const shape = w => w.db.log.map(x => x.op + " " + x.path.replace(/-P\d+/g, "-P").replace(/^(connDiary\/[^/]+\/)[^/]+/, "$1<device>")).sort();
    ok("the same writes at start (" + F.db.log.length + ")", JSON.stringify(shape(F)) === JSON.stringify(shape(M)));
    ok("the same week on the screen (" + F.d.tasks().length + " cards)", F.d.tasks().length > 20 && JSON.stringify(F.d.tasks()) === JSON.stringify(M.d.tasks()));
    [F, M].forEach(w => w.d.set("WK", "week6"));
    const strip = s => String(s).replace(/\d{10,}/g, "#");
    const gF = JSON.parse(F.d.run("JSON.stringify(" + CFG + ")")), gM = JSON.parse(M.d.run("JSON.stringify(" + CFG + ")"));
    ok("the same week build", !gF.error && strip(JSON.stringify(gF.result)) === strip(JSON.stringify(gM.result)));
    ["log", "trends", "attendance", "report"].forEach(t => {
      F.d.set("histTab", t); M.d.set("histTab", t);
      ok("the same History ▸ " + t + " page", strip(html(F.d, "renderHistory")) === strip(html(M.d, "renderHistory")));
    });
    ok("the same Pace page", strip(html(F.d, "renderPace")) === strip(html(M.d, "renderPace")));
  }

  console.log("\n── 6b. the test can fail: the old code builds on an empty archive ──");
  {
    const { d } = await world(MINUS_PATH, true);
    d.set("WK", "week6");
    const g = JSON.parse(d.run("JSON.stringify(" + CFG + ")"));
    ok("without ARCHENSURE, a build before the past weeks arrive goes ahead (what slice 2 stops)", !g.error && !!g.result, g.error);
    const { d: d2, db: db2, clock: c2, sched: s2 } = await world(MINUS_PATH, true);
    d2.set("fbTasksLoaded", true); const m2 = db2.log.length;
    d2.run('relayWeek("settings",{label:"test re-lay"})'); await s2.run(c2.now + 3000);
    ok("…and so does a re-lay (it takes the lock with no past weeks)", db2.log.slice(m2).some(w => /regen_lock/.test(w.path)));
  }

  console.log("\n" + pass + " passed, " + fail + " failed");
  process.exit(fail ? 1 : 0);
})().catch(e => { console.log("CRASH " + (e && e.stack || e)); process.exit(1); });
