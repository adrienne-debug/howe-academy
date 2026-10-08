/*
 * ✓ Mark done / ↩ Not done from a Grid lesson square (her ask 2026-10-08) — GVMARK block.
 *
 * Replays the REAL path end to end: the grid tap (gvMarkThrough / gvMarkNotDone) → the subject
 * sheet's own write (_ceMarkDoneApply → lidMarkDone, ceUnfinishLesson, ceUnmarkLessonDone) →
 * the real _ceRelayAfterMark. The recorded multi-path update is applied to a mirror of the
 * curriculum node (as Firebase would) and must match memory; the re-lay hook then lays what is
 * left with the REAL projection engine (PROJ block, projectPlans) — list minus done, in order —
 * and the Grid's derived column is that same projection, so a future square resolves to the
 * lesson it DISPLAYS (GVIDENT). Plan-backed and 📌 lesson-day subjects, plus a legacy hand-mark.
 *
 *   run:  node test_grid_mark_through.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
function between(a, b) { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error("markers " + a); return src.slice(i, j); }
function braceSlice(name) {
  const sig = "function " + name + "("; const i = src.indexOf(sig); if (i < 0) throw new Error("fn not found: " + name);
  let d = 0, j = src.indexOf("{", i);
  for (let k = j; k < src.length; k++) { if (src[k] === "{") d++; else if (src[k] === "}") { d--; if (d === 0) return src.slice(i, k + 1); } }
  throw new Error("unbalanced: " + name);
}
const CODE = [
  between("// LID_START", "// LID_END"),
  between("// LID_SERVE_START", "// LID_SERVE_END"),
  between("// GVIDENT_START", "// GVIDENT_END"),
  between("// GVMARK_START", "// GVMARK_END"),
  between("// PROJ_START", "// PROJ_END"),
  ...["_cbSpread", "_mdKey", "_mdText", "ceMarkLessonDone", "_ceMarkDoneAsk", "_ceMarkDoneApply", "ceUnmarkLessonDone", "_ceRelayAfterMark"].map(braceSlice),
].join("\n");

let pass = 0, fail = 0;
function ok(n, c, extra) { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (extra !== undefined ? "  (" + JSON.stringify(extra) + ")" : "")); } }
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

const TODAY = "2026-10-08";   // a Thursday
const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
function weekdays(fromISO, n) {
  const out = []; let t = Date.UTC(+fromISO.slice(0, 4), +fromISO.slice(5, 7) - 1, +fromISO.slice(8, 10));
  while (out.length < n) { const d = new Date(t); const w = d.getUTCDay(); if (w && w !== 6) out.push({ date: d.toISOString().slice(0, 10), dow: DOW[w], off: false }); t += 86400000; }
  return out;
}
// Firebase multi-path update, applied to a plain object.
function applyUpdate(root, up) {
  Object.keys(up).forEach(p => {
    const ks = p.split("/"); let o = root;
    for (let i = 0; i < ks.length - 1; i++) o = (o[ks[i]] = (o[ks[i]] && typeof o[ks[i]] === "object") ? o[ks[i]] : {});
    const last = ks[ks.length - 1];
    if (up[p] === null) delete o[last]; else o[last] = JSON.parse(JSON.stringify(up[p]));
  });
}
const prune = o => { const j = JSON.stringify(o == null ? {} : o, (k, v) => (k && v && typeof v === "object" && !Array.isArray(v) && !Object.keys(v).length) ? undefined : v); return j === undefined ? {} : JSON.parse(j); };

function mkEnv(subj, done, lessons, opts) {
  opts = opts || {};
  const curr = { subjects: { lincoln: { mr: subj } }, lessons: { lincoln: lessons }, done: { lincoln: { mr: done || {} } } };
  const env = {
    currData: curr, paceData: { subjects: {} }, mirror: JSON.parse(JSON.stringify(curr)),
    updates: [], relays: [], toasts: [], confirms: [], cbMsg: "", _gvDelUndo: null, gvMenu: "x", gvEdit: null,
    momHere: () => opts.mom !== false, momModeActive: opts.mom !== false, adminPinUnlocked: false,
    cbTodayISO: () => TODAY, gvFilled: v => !!(v && v !== "—" && String(v).trim()),
    buildCurrPaceCum: () => {}, renderAll: () => {}, gvGrabScroll: () => {}, cap: x => x, esc: x => String(x),
    gwShowToast: m => env.toasts.push(m),
    paceDoneTitles: () => [], paceKeywords: () => [], buildSubjectLessons: () => [],
    confirm: m => { env.confirms.push(m); return opts.confirm !== false; },
    document: { getElementById: id => (id === "gv-md-day" && opts.day !== undefined) ? { value: opts.day, getAttribute: () => null } : null },
    Date, Math, Object, JSON, String, Number, Array, Set, Map, parseInt, isNaN, console,
  };
  env.db = { ref: p => ({
    update: u => { if (p === "curriculum") { env.updates.push(u); applyUpdate(env.mirror, u); } return { catch: () => {} }; },
    set: v => { applyUpdate(env.mirror, { [p.replace(/^curriculum\//, "")]: v }); return { catch: () => {} }; },
  }) };
  // What's left, laid by the REAL projection engine: list minus done (lidDoneIdx), in list order.
  env.project = () => {
    const s = env.currData.subjects.lincoln.mr; const ids = env.lidsFor("lincoln", "mr"); const di = env.lidDoneIdx("lincoln", "mr");
    const lessons = ids.map((lid, i) => ({ lid, text: s.lessonSeq[i] })).filter((x, i) => !di.has(i));
    const out = env.projectPlans({ todayISO: TODAY, calendar: { lincoln: weekdays(TODAY, 30) }, plans: [{ pid: "lincoln__mr", kid: "lincoln", sk: "mr", lessons, allowedDays: [] }] });
    const laid = []; Object.keys(out.byDate).sort().forEach(d => (out.byDate[d].lincoln || []).forEach(x => laid.push({ date: d, lid: x.lid, text: x.text })));
    return laid;
  };
  // The Grid's derived column for a plan-backed subject IS that projection.
  env.gvDerivedColumn = () => { const byDate = {}; env.project().forEach(x => { if (!byDate[x.date]) byDate[x.date] = { text: x.text, lid: x.lid, src: "plan" }; }); return { byDate }; };
  // The re-lay hook: record it and lay the subject again from the data as it now stands.
  env._gvRelaySubject = (kid, sk, msg) => { env.relays.push({ kid, sk, msg, laid: env.project() }); return true; };
  env.window = env;
  vm.createContext(env);
  new vm.Script(CODE).runInContext(env);
  return env;
}
const doneKeys = e => Object.keys(e.currData.done.lincoln.mr).sort();
const mirrorMatches = e => eq(prune(e.mirror.done), prune(e.currData.done)) && eq(prune(e.mirror.subjects.lincoln.mr.manualDone || {}), prune(e.currData.subjects.lincoln.mr.manualDone || {}));

// Plan-backed subject: 6 lessons, "Review" twice. Past grid: Mon–Wed; today Thu; future after.
const PB = () => ({ display: "Math", lessonSeq: ["pg 1", "Review", "pg 2", "pg 3", "Review", "pg 4"], lessonIds: ["L0001", "L0002", "L0003", "L0004", "L0005", "L0006"], nextLid: 7, doneImportedAt: 1, planId: "lincoln__mr", pacing: { mode: "timesPerWeek" } });
const GRID = () => ({ 1: { date: "2026-10-05", mr: "pg 1" }, 2: { date: "2026-10-06", mr: "Review" }, 3: { date: "2026-10-07", mr: "pg 2" }, 4: { date: "2026-10-08", mr: "pg 3" }, 5: { date: "2026-10-09", mr: "Review" }, 6: { date: "2026-10-12", mr: "pg 4" } });
const CHK = { src: "check", ts: "t", day: "2026-10-05" };

console.log("which lesson a square holds");
{
  const e = mkEnv(PB(), { L0001: CHK }, GRID());
  ok("past done square → its own record (pg 1 = L0001)", eq(e.gvCellLesson("lincoln", 1, "mr"), { i: 0, lid: "L0001", text: "pg 1" }));
  ok("past open square with a repeated text → the first open copy (Review = L0002, not L0005)", e.gvCellLesson("lincoln", 2, "mr").lid === "L0002");
  // derived from today: Thu L0002 Review, Fri L0003 pg 2 — the stored "Review" on Fri is stale
  ok("plan-backed future square → the lesson it DISPLAYS (Fri shows pg 2 = L0003, stored text says Review)", eq(e.gvCellLesson("lincoln", 5, "mr"), { i: 2, lid: "L0003", text: "pg 2" }));
  ok("states: L0001 latest done, L0002 open", e.gvLessonState("lincoln", "mr", 0) === "latest" && e.gvLessonState("lincoln", "mr", 1) === "open");
  const u = mkEnv(Object.assign(PB(), { doneImportedAt: null }), {}, GRID());
  ok("unstamped subject → null (the menu keeps its single ✓ done)", u.gvCellLesson("lincoln", 1, "mr") === null);
}

console.log("✓ Mark done — marks it and every earlier open lesson, through the sheet's write + re-lay");
{
  const e = mkEnv(PB(), { L0001: CHK }, GRID());
  ok("menu offers Day it was done (default today) + ✓ Mark done", /Day it was done/.test(e.gvMarkMenuHTML("lincoln", 5, "mr", e.gvCellLesson("lincoln", 5, "mr"))) && /value="2026-10-08"/.test(e.gvMarkMenuHTML("lincoln", 5, "mr", e.gvCellLesson("lincoln", 5, "mr"))) && /gvMarkThrough\('lincoln',5,'mr'\)/.test(e.gvMarkMenuHTML("lincoln", 5, "mr", e.gvCellLesson("lincoln", 5, "mr"))));
  e.gvMarkThrough("lincoln", 5, "mr");   // Fri square, showing pg 2 (L0003)
  const u = e.updates[0] || {};
  ok("ONE update: done records for L0002 + L0003 only (L0001 already done, nothing after the tap)", eq(Object.keys(u).sort(), ["done/lincoln/mr/L0002", "done/lincoln/mr/L0003"]), Object.keys(u));
  ok("records are the sheet's: src manual, via mark, day = today", ["L0002", "L0003"].every(l => u["done/lincoln/mr/" + l].src === "manual" && u["done/lincoln/mr/" + l].via === "mark" && u["done/lincoln/mr/" + l].day === TODAY));
  ok("plan-backed: no manualDone written", !e.currData.subjects.lincoln.mr.manualDone);
  ok("the write lands in Firebase exactly as in memory", mirrorMatches(e));
  ok("the sheet's confirm text (2 lessons, through “pg 2”)", /^Mark 2 lessons done, through “pg 2”\?/.test(e.confirms[0] || ""), e.confirms);
  ok("one Undo covers it (prev = no record)", e._gvDelUndo && eq(Object.keys(e._gvDelUndo.paths).sort(), ["done/lincoln/mr/L0002", "done/lincoln/mr/L0003"]) && e._gvDelUndo.paths["done/lincoln/mr/L0002"] === null);
  ok("menu closed", e.gvMenu === null);
  const r = e.relays[0] || {};
  ok("re-lay ran for this subject (_ceRelayAfterMark → _gvRelaySubject)", r.kid === "lincoln" && r.sk === "mr" && /✓ Marked 2 lessons done/.test(r.msg), r);
  ok("re-lay: the rest lay from today in list order — pg 3, Review, pg 4", eq(r.laid.map(x => x.lid), ["L0004", "L0005", "L0006"]) && r.laid[0].date === TODAY, r.laid);
  ok("done stays contiguous (nothing out of order)", eq(e.lidOutOfOrder("lincoln", "mr"), []) && eq(doneKeys(e), ["L0001", "L0002", "L0003"]));
}
{
  // through the LAST lesson from a past square with nothing done yet
  const e = mkEnv(PB(), {}, GRID());
  e.gvMarkThrough("lincoln", 2, "mr");   // past "Review" = L0002
  ok("past open square: marks pg 1 + Review (L0001, L0002), never the later Review", eq(doneKeys(e), ["L0001", "L0002"]));
}
{
  const e = mkEnv(PB(), { L0001: CHK }, GRID(), { day: "2026-10-06" });
  e.gvMarkThrough("lincoln", 2, "mr");
  const u = e.updates[0] || {};
  ok("Day it was done = Tue → record day Tue, and the sheet's own cell move rides along", u["done/lincoln/mr/L0002"].day === "2026-10-06" && /Recorded as done on 2026-10-06/.test(e.confirms[0]), u);
  ok("…and still matches memory", mirrorMatches(e));
}
{
  const e = mkEnv(PB(), { L0001: CHK }, GRID(), { day: TODAY });
  e.gvMarkThrough("lincoln", 5, "mr");
  ok("day = today → recorded today, no lesson cells touched (the sheet's blank default)", !Object.keys(e.updates[0] || {}).some(k => k.indexOf("lessons/") === 0) && !/Recorded as done on/.test(e.confirms[0]));
}
{
  const e = mkEnv(PB(), { L0001: CHK }, GRID(), { day: "2026-10-20" });
  e.gvMarkThrough("lincoln", 5, "mr");
  ok("a future day is refused — nothing written", !e.updates.length && e.toasts.length === 1);
}
{
  const e = mkEnv(PB(), { L0001: CHK }, GRID(), { confirm: false });
  e.gvMarkThrough("lincoln", 5, "mr");
  ok("cancelled confirm → nothing written, no re-lay", !e.updates.length && !e.relays.length);
  const k = mkEnv(PB(), { L0001: CHK }, GRID(), { mom: false });
  k.gvMarkThrough("lincoln", 5, "mr"); k.gvMarkNotDone("lincoln", 1, "mr");
  ok("not Mom → nothing", !k.updates.length && !k.confirms.length);
}

console.log("↩ Not done — latest done lesson only");
{
  const e = mkEnv(PB(), { L0001: CHK, L0002: { src: "manual", via: "mark", day: "2026-10-06" } }, GRID());
  ok("older done square says “Undo the newer ones first”", /Undo the newer ones first/.test(e.gvMarkMenuHTML("lincoln", 1, "mr", e.gvCellLesson("lincoln", 1, "mr"))));
  e.gvMarkNotDone("lincoln", 1, "mr");
  ok("…and ↩ on it is refused — nothing written", !e.updates.length && e.toasts.length === 1);
  ok("latest done square offers ↩ Not done", /↩ Not done/.test(e.gvMarkMenuHTML("lincoln", 2, "mr", e.gvCellLesson("lincoln", 2, "mr"))));
  e.gvMarkNotDone("lincoln", 2, "mr");
  ok("↩ removes ONLY that record (the sheet's ceUnfinishLesson)", eq(Object.keys(e.updates[0] || {}).sort(), ["done/lincoln/mr/L0002", "lastEdit"]) && e.updates[0]["done/lincoln/mr/L0002"] === null);
  ok("matches memory; Undo restores the record", mirrorMatches(e) && e._gvDelUndo.paths["done/lincoln/mr/L0002"].src === "manual");
  const r = e.relays[0] || {};
  ok("re-lay: Review is first again, then the rest in order", eq(r.laid.map(x => x.lid), ["L0002", "L0003", "L0004", "L0005", "L0006"]) && r.laid[0].date === TODAY, r.laid);
  ok("now pg 1 (a check-off) is the latest → ↩ offered there", e.gvLessonState("lincoln", "mr", 0) === "latest");
  e.gvMarkNotDone("lincoln", 1, "mr");
  ok("↩ on a check-off: the record goes, list fully open, re-lay from pg 1", !e.currData.done.lincoln.mr.L0001 && eq(e.relays[1].laid.map(x => x.lid), ["L0001", "L0002", "L0003", "L0004", "L0005", "L0006"]));
}
{
  // legacy (stamped, NOT plan-backed) hand-mark: the manualDone twin goes with it
  const s = PB(); delete s.planId; s.manualDone = { "pg 1": { lesson: "pg 1", day: "2026-10-05" } };
  const e = mkEnv(s, { L0001: { src: "manual", via: "mark", day: "2026-10-05" } }, GRID());
  e.gvMarkNotDone("lincoln", 1, "mr");
  ok("legacy hand-mark: done record AND its manualDone twin dropped (the sheet's ✕ chip path)", !e.currData.done.lincoln.mr.L0001 && !e.currData.subjects.lincoln.mr.manualDone && mirrorMatches(e));
  ok("…and re-laid", /Un-marked “pg 1”/.test((e.relays[0] || {}).msg || ""));
}

console.log("📌 lesson-day subject");
{
  const s = { display: "AAS", lessonDay: "Mon", lessonSeq: ["Step 1 · day 1 of 2", "Step 1 · day 2 of 2", "Step 2 · day 1 of 2", "Step 2 · day 2 of 2", "Step 3 · day 1 of 2"], lessonIds: ["L0001", "L0002", "L0003", "L0004", "L0005"], nextLid: 6, doneImportedAt: 1, planId: "lincoln__mr", pacing: { mode: "timesPerWeek" } };
  const grid = { 1: { date: "2026-10-05", mr: "Step 1 · day 1 of 2" }, 2: { date: "2026-10-06", mr: "Step 1 · day 2 of 2" }, 3: { date: "2026-10-07", mr: "Step 2 · day 1 of 2" }, 4: { date: "2026-10-08", mr: "Step 2 · day 2 of 2" }, 5: { date: "2026-10-09", mr: "Step 3 · day 1 of 2" } };
  // Step 2 day 1 done by check; Step 1's two sittings were passed over (dropped, no records)
  const e = mkEnv(s, { L0003: { src: "check", day: "2026-10-07" } }, grid);
  ok("passed-over practice squares read done but OLDER (no ↩ there)", e.gvLessonState("lincoln", "mr", 1) === "older" && /Undo the newer ones first/.test(e.gvMarkMenuHTML("lincoln", 2, "mr", e.gvCellLesson("lincoln", 2, "mr"))));
  ok("the real latest (Step 2 day 1) offers ↩", e.gvLessonState("lincoln", "mr", 2) === "latest");
  const r0 = e.project();
  ok("before: the lay starts at Step 2 day 2", r0[0].lid === "L0004");
  ok("Friday's square shows Step 3 day 1 (derived)", e.gvCellLesson("lincoln", 5, "mr").lid === "L0005");
  e.gvMarkThrough("lincoln", 5, "mr");
  const marked = Object.keys(e.updates[0] || {}).filter(k => k.indexOf("done/") === 0);
  ok("✓ on the square showing Step 3 day 1 marks Step 2 day 2 + Step 3 day 1, never the dropped practice", eq(marked.sort(), ["done/lincoln/mr/L0004", "done/lincoln/mr/L0005"]), marked);
  ok("re-lay requested + matches memory; nothing left to lay", e.relays.length === 1 && mirrorMatches(e) && eq(e.relays[0].laid, []));
  e.gvMarkNotDone("lincoln", 5, "mr");
  ok("↩ on Step 3 day 1 → it alone is owed again and re-laid first", !e.currData.done.lincoln.mr.L0005 && eq(e.relays[1].laid.map(x => x.lid), ["L0005"]));
}

console.log("wiring");
{
  const blk = between("// GVMARK_START", "// GVMARK_END");
  ok("GVMARK writes nothing itself — it calls the sheet's paths", !/db\.ref|db&&/.test(blk) && /_ceMarkDoneApply\(kid,sk,list,dayISO\)/.test(blk) && /ceUnfinishLesson\(kid,sk,c\.lid\)/.test(blk));
  ok("the sheet's ✓ Mark a lesson done uses the same tail", /if\(!confirm\(_ceMarkDoneAsk\(s,sk,list,lesson,dayISO\)\+"\\n\\nYou can undo it on this card\."\)\) return;\n  _ceMarkDoneApply\(kid,sk,list,dayISO\);/.test(src));
  ok("cell menu: GVMARK controls for stamped subjects, the old single ✓ done only otherwise", /if\(_gm\) m\+=gvMarkMenuHTML\(gvKid,dn,sk,_gm\);\n\s*else if\(gvFilled\(v\)&&!_isDone\) m\+=_mb\("✓ done"/.test(src));
  ok("a past lesson square opens the menu (Mom, stamped) — ✎ edit stays one tap away", /const _pastLesson=past&&gvFilled\(l\[sk\]\)&&momHere\(\)/.test(src) && /if\(past\)\{\n\s*m\+=_mb\("✎"/.test(src));
  ok("no 🔀 in index.html", src.indexOf("\u{1F500}") < 0);
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
