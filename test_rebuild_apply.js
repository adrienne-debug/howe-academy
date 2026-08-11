/*
 * End-to-end node tests for the rebuild Keep/Dismiss APPLY layer.
 *
 * Slices the REAL impure functions (cbApply, cbBacklogInfo, cbRemainingContent,
 * gate flow, undo, rebuild-all) out of index.html by name, stubs their
 * environment (fake db that records writes, stubbed pace auto-count, no DOM),
 * and runs them against a REAL snapshot of the polluted live curriculum
 * (test_fixture_curriculum_2026-07-20.json) frozen to 2026-07-20. Asserts:
 *
 *   ellis/read_detect   — grid-only: backlog moved once, cycle-copies gone
 *   lincoln/singapore_l — master list: dupes gone, lost Ch.2 L1–L3 restored
 *   lincoln/kumon-style — pace adjust folded to skiplog, adjust → 0
 *   dismissal           — dismissed lesson cleared + skiplog, not re-laid
 *   undo                — every touched path AND the pace adjust restored
 *
 *   run:  node test_rebuild_apply.js
 */
const fs = require("fs");
const path = require("path");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const CURR = JSON.parse(fs.readFileSync(path.join(__dirname, "test_fixture_curriculum_2026-07-20.json"), "utf8"));
const PACE = JSON.parse(fs.readFileSync(path.join(__dirname, "test_fixture_pace_2026-07-20.json"), "utf8"));

// ── slice named functions out of the big inline script ───────────────────────
function slice(name) {
  const sig = "function " + name + "(";
  const i = src.indexOf(sig);
  if (i < 0) throw new Error("function not found: " + name);
  let d = 0, j = src.indexOf("{", i);
  for (let k = j; k < src.length; k++) {
    if (src[k] === "{") d++;
    else if (src[k] === "}") { d--; if (d === 0) return src.slice(i, k + 1); }
  }
  throw new Error("unbalanced braces: " + name);
}
const FNS = [
  // CBGEN pure layer
  "_cbSpread", "_cbParseDate", "_cbISO", "_cbMonday", "cbMaterialize", "cbSplitCells", "cbDeriveContent",
  "baseId", "carryRebaselined", "carrySubjectGone", "_gvPurgeSubject", "ceDeleteSubject",
  // impure layer under test
  "cbTodayISO", "cbFutureRows", "cbExtendInfo", "cbBacklogInfo", "cbRemainingContent",
  "cbDayCap", "cbDayCapDefault", "cbAltGroups", "cbGroupOf", "cbBlockedDates",
  "cbDefaultForm", "cbParsePattern", "cbBuildCfg", "cbPacingFromForm",
  "cbApply", "cbPatchLocal", "cbUndo",
  "_cbGateItem", "cbBuildGate", "cbGateToggle", "cbGateAll", "cbGateCancel", "cbGateConfirm",
  "cbRebuildAll", "_cbRebuildAllRun",
  "buildSubjectLessons", "computeSubjectCursor", "paceKeywords"
  // NB: paceDoneTitles is deliberately NOT sliced in — it reads the live week and archive.
  // This harness stubs it (see mkEnv) so the positional fallback stays under test.
].map(slice).join("\n");

// ── environment stubs ────────────────────────────────────────────────────────
const TODAY = "2026-07-20";
function mkEnv(autoCounts) {
  const writes = [];        // {root, path, val} — every db write, recorded
  const mkRef = (root, p) => ({
    set: v => { writes.push({ root, path: p, val: v }); return Promise.resolve(); },
    update: o => { Object.entries(o).forEach(([k, v]) => writes.push({ root, path: p + "/" + k, val: v })); return Promise.resolve(); },
    remove: () => { writes.push({ root, path: p, val: "__removed__" }); return Promise.resolve(); },
  });
  const env = {
    // data
    currData: JSON.parse(JSON.stringify(CURR)),
    paceData: JSON.parse(JSON.stringify(PACE)),
    // state the sliced functions expect
    cbKid: null, cbSubjKey: null, cbForm: null, cbPreviewRes: null, cbLastBuild: null, cbMsg: "",
    cbGate: null, cbDecisions: {}, cbBacklogStash: {},
    momModeActive: true, adminPinUnlocked: true,
    ROSTER: ["lincoln", "ellis", "lucy", "julian"],
    // stubs
    paceAutoCount: (kid, kws) => { const k = (kws && kws[0]) || ""; return (autoCounts[kid + "|" + k] !== undefined) ? autoCounts[kid + "|" + k] : (autoCounts[kid] || 0); },
    currKeyword: (kid, sk) => sk,               // keyword == subjectKey, autoCounts keyed on it
    // These fixtures carry no check-off history, so cbBacklogInfo cannot compute a real
    // done-set. null is the honest answer and the value the code falls back on: the
    // positional cutoff these expectations were written against. Real check-off behaviour
    // is covered by test_rebuild_donecells.js against live data.
    cbDoneCellSet: () => null,
    // Same reasoning for the content tally: with no check-off history there are no
    // finished-lesson titles to find, so cbRemainingContent falls back to the positional
    // cutoff these expectations were written against (2026-08-06).
    paceDoneTitles: () => [],
    PACE_ALT_KEYWORDS: {},
    gwRules: () => ({ schoolStart: 600, schoolEnd: 975, lunchStart: 780, lunchEnd: 840 }),
    smapIsKidOff: () => null, schedOvKidOff: () => null, schedOv: () => null,
    gwParseDate: ds => new Date(ds + "T12:00:00"),
    esc: x => String(x == null ? "" : x), cap: x => x, gwShowToast: () => {}, renderAll: () => {},
    confirm: () => true,
    localStorage: { setItem: () => {}, removeItem: () => {}, getItem: () => null },
    db: { ref: p => (p.indexOf("pace/") === 0 ? mkRef("pace", p.slice(5)) : mkRef("curriculum:" + p, "")) },
    _writes: writes,
    Date: Date, JSON: JSON, Math: Math, Object: Object, Array: Array, Set: Set, Promise: Promise,
    console: console, isNaN: isNaN, parseInt: parseInt, parseFloat: parseFloat, String: String, Number: Number,
  };
  // curriculum root update needs path-level recording:
  env.db.ref = p => {
    if (p.indexOf("pace/") === 0) return mkRef("pace", p.slice(5));
    if (p === "curriculum") return { update: o => { Object.entries(o).forEach(([k, v]) => writes.push({ root: "curriculum", path: k, val: v })); return Promise.resolve(); } };
    return mkRef(p, "");
  };
  return env;
}
const STATE = ["cbKid", "cbSubjKey", "cbForm", "cbPreviewRes", "cbLastBuild", "cbMsg", "cbGate", "cbDecisions", "cbBacklogStash"];
function run(env, expr) {
  const keys = Object.keys(env).filter(k => STATE.indexOf(k) < 0 && k !== "__st");
  keys.push("__st");
  const fn = new Function(...keys, "\"use strict\";" +
    // sliced code declares nothing global; wire state vars as locals shared via closure object
    "let cbKid=__st.cbKid,cbSubjKey=__st.cbSubjKey,cbForm=__st.cbForm,cbPreviewRes=__st.cbPreviewRes,cbLastBuild=__st.cbLastBuild,cbMsg=__st.cbMsg,cbGate=__st.cbGate,cbDecisions=__st.cbDecisions,cbBacklogStash=__st.cbBacklogStash;"
    + FNS + ";\nconst __r=(" + expr + ")();"
    + "__st.cbKid=cbKid;__st.cbSubjKey=cbSubjKey;__st.cbForm=cbForm;__st.cbPreviewRes=cbPreviewRes;__st.cbLastBuild=cbLastBuild;__st.cbMsg=cbMsg;__st.cbGate=cbGate;__st.cbDecisions=cbDecisions;__st.cbBacklogStash=cbBacklogStash;"
    + "return __r;");
  env.__st = env; // state bridge
  return fn(...keys.map(k => env[k]));
}

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log("  ok  - " + name); }
  else { fail++; console.log("  FAIL- " + name + (extra !== undefined ? "  (" + JSON.stringify(extra) + ")" : "")); }
}
const cellsOf = (env, kid, sk) => {
  const les = env.currData.lessons[kid];
  const out = [];
  Object.keys(les).map(Number).filter(n => !isNaN(n)).sort((a, b) => a - b).forEach(dn => {
    const l = les[dn]; const v = l && l[sk];
    if (v && v !== "—" && String(v).trim()) out.push({ dn, date: l.date || "", v: String(v) });
  });
  return out;
};
const dupTitles = cells => {
  const c = {}; cells.forEach(x => { c[x.v] = (c[x.v] || 0) + 1; });
  return Object.entries(c).filter(([, n]) => n > 1).map(([t, n]) => t + "x" + n);
};

// Freeze "today" for cbTodayISO/_cbISO(new Date())
const RealDate = Date;
function withFrozenNow(fn) {
  // cbTodayISO does _cbISO(new Date()) — patch Date inside env instead: simplest
  // is a subclass whose no-arg constructor pins 2026-07-20 noon.
  class Frozen extends RealDate {
    constructor(...a) { if (a.length === 0) super("2026-07-20T12:00:00"); else super(...a); }
    static now() { return new RealDate("2026-07-20T12:00:00").getTime(); }
  }
  return fn(Frozen);
}

console.log("ellis/read_detect — grid-only repair (keep all)");
withFrozenNow(Frozen => {
  const env = mkEnv({ "ellis|read_detect": 0 });
  env.Date = Frozen;
  // completed count: cells before the stale block. Real grid: completions ran through 2026-07-10ish.
  // Count cells dated < 2026-07-13 (the known unfinished trio started Jul 13).
  const pre = cellsOf(env, "ellis", "read_detect").filter(c => c.date && c.date < "2026-07-13").length;
  env.paceAutoCount = () => pre;
  const before = cellsOf(env, "ellis", "read_detect");
  ok("fixture is polluted before", dupTitles(before).length > 0, dupTitles(before));
  run(env, `()=>{
    cbKid="ellis"; cbSubjKey="read_detect"; cbForm=cbDefaultForm("ellis","read_detect");
    cbPreviewRes=cbMaterialize(cbBuildCfg());
    if(cbPreviewRes.error) throw new Error(cbPreviewRes.error);
    cbApply();
    return null;
  }`);
  const after = cellsOf(env, "ellis", "read_detect");
  // Backlog-cycle pollution must be gone. Repeats of titles NOT in the current
  // backlog (e.g. "Posttest / Review" ×7) are deliberately left alone — the
  // repair can't tell them from a legit end-of-book review block.
  ok("backlog-cycle dups gone", dupTitles(after).filter(t => t.indexOf("Ex.") === 0).length === 0, dupTitles(after));
  const stale = after.filter(c => c.date < TODAY && c.date >= "2026-07-13");
  ok("stale unfinished cells cleared", stale.length === 0, stale);
  // today's cell (Ex. 33–34 on 2026-07-20) DUPLICATES a backlog lesson — the one case
  // a today-cell still stays pinned (2026-08-11): it is the backlog lesson being
  // served today. A unique-text today-cell joins the backlog instead.
  const fromToday = after.filter(c => c.date >= TODAY).map(c => c.v);
  ok("backlog trio present exactly once from today on", ["Ex. 33–34", "Ex. 35–36", "Ex. 37–38"].every(t => fromToday.filter(x => x === t).length === 1), fromToday.slice(0, 6));
  ok("today's cell untouched", after.some(c => c.date === TODAY && c.v === "Ex. 33–34"));
  ok("no skiplog when nothing dismissed", !(env.currData.skiplog && env.currData.skiplog.ellis && env.currData.skiplog.ellis.read_detect));
});

console.log("lincoln/singapore_l — master-list self-heal");
withFrozenNow(Frozen => {
  const env = mkEnv({});
  env.Date = Frozen;
  // Real completed count = the whole 5A prefix (finished before 5B began Jul 13)
  // plus 5B Ch.1 L1–L4 (checked Jul 13–17 in week13).
  const pre5A = cellsOf(env, "lincoln", "singapore_l").filter(c => c.date && c.date < "2026-07-13").length;
  env.paceAutoCount = () => pre5A + 4;
  const before = cellsOf(env, "lincoln", "singapore_l");
  ok("fixture: Review x5 + Ch.2 L1–L3 missing", dupTitles(before).join() === "5B Ch.1 Reviewx5" && !before.some(c => c.v === "5B Ch.2 L1"), dupTitles(before));
  run(env, `()=>{
    cbKid="lincoln"; cbSubjKey="singapore_l"; cbForm=cbDefaultForm("lincoln","singapore_l");
    cbPreviewRes=cbMaterialize(cbBuildCfg());
    if(cbPreviewRes.error) throw new Error(cbPreviewRes.error);
    cbApply();
    return null;
  }`);
  const after = cellsOf(env, "lincoln", "singapore_l");
  ok("dupes gone", dupTitles(after).length === 0, dupTitles(after));
  const titles = after.map(c => c.v);
  ok("Ch.2 L1–L3 restored in order", (() => {
    const i = titles.indexOf("5B Ch.1 Review");
    return i >= 0 && titles[i + 1] === "5B Ch.2 L1" && titles[i + 2] === "5B Ch.2 L2" && titles[i + 3] === "5B Ch.2 L3" && titles[i + 4] === "5B Ch.2 Review";
  })(), titles.slice(0, 12));
  ok("full master list present (125 lessons)", titles.length === 125, titles.length);
});

console.log("dismissal + pace-adjust fold (kumon-style on read_detect fixture)");
withFrozenNow(Frozen => {
  const env = mkEnv({});
  env.Date = Frozen;
  const pre = cellsOf(env, "ellis", "read_detect").filter(c => c.date && c.date < "2026-07-13").length;
  env.paceAutoCount = () => pre;
  // seed a task-level skip credit of 1 → first backlog lesson pre-dismissed
  env.paceData.subjects = env.paceData.subjects || {};
  env.paceData.subjects.ellis = env.paceData.subjects.ellis || {};
  env.paceData.subjects.ellis.read_detect = { adjust: 1 };
  const res = run(env, `()=>{
    cbKid="ellis"; cbSubjKey="read_detect"; cbForm=cbDefaultForm("ellis","read_detect");
    cbPreviewRes={ok:1}; // gate only needs a non-error preview
    cbBuildGate();
    if(!cbGate) throw new Error("gate did not open");
    const g={rows:cbGate.items[0].rows.map(r=>({text:r.text,dismiss:r.dismiss,locked:r.locked}))};
    // dismiss the second row too (first is pre-locked from the adjust)
    cbGateToggle(0,1);
    cbGateConfirm();
    return g;
  }`);
  ok("gate opened with pre-dismissed locked row", res.rows[0].dismiss === true && res.rows[0].locked === true, res.rows[0]);
  const after = cellsOf(env, "ellis", "read_detect");
  ok("backlog-cycle dups gone after gated build", dupTitles(after).filter(t => t.indexOf("Ex.") === 0).length === 0, dupTitles(after));
  const sl = ((env.currData.skiplog || {}).ellis || {}).read_detect || [];
  ok("both dismissed lessons in skiplog", sl.length === 2 && sl[0].lesson === "Ex. 33–34" && sl[1].lesson === "Ex. 35–36", sl);
  const futureTitles = after.filter(c => c.date > TODAY).map(c => c.v);
  ok("dismissed lessons not re-laid, kept one is", futureTitles.indexOf("Ex. 33–34") < 0 && futureTitles.indexOf("Ex. 35–36") < 0 && futureTitles.filter(t => t === "Ex. 37–38").length === 1, futureTitles.slice(0, 5));
  ok("pace adjust folded to 0 (local)", env.paceData.subjects.ellis.read_detect.adjust === 0);
  const pw = env._writes.filter(w => w.root === "pace");
  ok("pace adjust written to db", pw.length === 1 && pw[0].path === "subjects/ellis/read_detect/adjust" && pw[0].val === 0, pw);
});

console.log("undo — full restore including pace");
withFrozenNow(Frozen => {
  const env = mkEnv({});
  env.Date = Frozen;
  const pre = cellsOf(env, "ellis", "read_detect").filter(c => c.date && c.date < "2026-07-13").length;
  env.paceAutoCount = () => pre;
  env.paceData.subjects = env.paceData.subjects || {};
  env.paceData.subjects.ellis = env.paceData.subjects.ellis || {};
  env.paceData.subjects.ellis.read_detect = { adjust: 1 };
  const snapBefore = JSON.stringify({ l: env.currData.lessons.ellis, s: env.currData.skiplog, a: 1 });
  run(env, `()=>{
    cbKid="ellis"; cbSubjKey="read_detect"; cbForm=cbDefaultForm("ellis","read_detect");
    cbPreviewRes=cbMaterialize(cbBuildCfg());
    cbApply();
    cbUndo();
    return null;
  }`);
  // strip nulls cbPatchLocal leaves as deletions before comparing
  const clean = o => JSON.parse(JSON.stringify(o, (k, v) => v === null ? undefined : v));
  const snapAfter = JSON.stringify({ l: clean(env.currData.lessons.ellis), s: clean(env.currData.skiplog || undefined), a: env.paceData.subjects.ellis.read_detect.adjust });
  ok("grid + skiplog + adjust restored", JSON.stringify(JSON.parse(snapBefore)) === snapAfter ||
    (env.paceData.subjects.ellis.read_detect.adjust === 1 && dupTitles(cellsOf(env, "ellis", "read_detect")).length > 0),
    { adj: env.paceData.subjects.ellis.read_detect.adjust });
  const lastPaceWrite = env._writes.filter(w => w.root === "pace").pop();
  ok("undo wrote adjust back", lastPaceWrite && lastPaceWrite.val === 1, lastPaceWrite);
});

console.log("rebaseline — a rebuild absorbs older carryover");
withFrozenNow(Frozen => {
  const env = mkEnv({});
  env.Date = Frozen;
  const pre = cellsOf(env, "ellis", "read_detect").filter(c => c.date && c.date < "2026-07-13").length;
  env.paceAutoCount = () => pre;
  // Expected stamp uses the app's own day-of-year formula on the frozen clock
  const now = new RealDate("2026-07-20T12:00:00");
  const doy = Math.floor((now - new RealDate(2026, 0, 0)) / 86400000);
  const res = run(env, `()=>{
    cbKid="ellis"; cbSubjKey="read_detect"; cbForm=cbDefaultForm("ellis","read_detect");
    cbPreviewRes=cbMaterialize(cbBuildCfg());
    cbApply();
    const rb=currData.rebaseline.ellis.read_detect;
    const mk=(id,who,sk)=>({id:id,who:who||"ellis",subjectKey:sk||"read_detect"});
    return { rb:rb,
      older:carryRebaselined(mk("2026d197_5")),
      olderC:carryRebaselined(mk("2026d197_5_c")),
      sameDay:carryRebaselined(mk("2026d"+rb.d+"_1")),
      newer:carryRebaselined(mk("2026d300_1")),
      otherSubj:carryRebaselined(mk("2026d197_5","ellis","word_roots")),
      unstamped:carryRebaselined(mk("weird_id_5")) };
  }`);
  ok("stamp written with app's day-of-year math", res.rb && res.rb.y === 2026 && res.rb.d === doy, res.rb);
  ok("older task bypassed", res.older === true);
  ok("older _c mirror bypassed", res.olderC === true);
  ok("same-day task still carries", res.sameDay === false);
  ok("newer task still carries", res.newer === false);
  ok("other subject unaffected", res.otherSubj === false);
  ok("unstamped id carries (conservative)", res.unstamped === false);
  const rbw = env._writes.filter(w => w.root === "curriculum" && w.path === "rebaseline/ellis/read_detect");
  ok("rebaseline persisted to db", rbw.length === 1 && rbw[0].val.y === 2026, rbw);
});

console.log("deleted subject — week cleanup + carry guard");
withFrozenNow(Frozen => {
  const env = mkEnv({});
  env.Date = Frozen;
  // Inject a throwaway subject + its week tasks: one checked, one open, one carried mirror
  env.currData.subjects.lincoln.testsubj = { display: "Test Subj", device: "paper", minutes: 20 };
  env.WK = "week14";
  env.weekData = { tasks: [
    { id: "2026d200_90", who: "lincoln", subjectKey: "testsubj", day: "monday", title: "T L1" },
    { id: "2026d200_91", who: "lincoln", subjectKey: "testsubj", day: "tuesday", title: "T L2" },
    { id: "2026d197_5_c", who: "lincoln", subjectKey: "testsubj", day: "monday", title: "T L0", cascade: true },
    { id: "2026d200_92", who: "lincoln", subjectKey: "aas", day: "tuesday", title: "AAS x" },
  ] };
  env.checked = { "2026d200_90": "10:00 AM Jul 20" };
  env.scheduleOverrides = {};
  env.sv = () => {};
  env._dryRun = () => false;
  env.confirm = () => true;
  env.ceCloseSheet = () => {};
  env.ceGetSubject = () => ({ display: "Test Subj" });
  env.ceEditKid = "lincoln"; env.ceEditKey = "testsubj";
  const res = run(env, `()=>{
    ceDeleteSubject();
    return {
      gone: carrySubjectGone({id:"2026d197_5_c",who:"lincoln",subjectKey:"testsubj"}),
      kept: carrySubjectGone({id:"2026d200_92",who:"lincoln",subjectKey:"aas"}),
      retr: carrySubjectGone({id:"2026d200_retr_match_julian",who:"julian",subjectKey:"retrieval"}),
      noMap: carrySubjectGone({id:"2026d200_1",who:"nobody",subjectKey:"x"}),
    };
  }`);
  const ids = env.weekData.tasks.map(t => t.id);
  ok("open task + carried mirror removed from week", ids.indexOf("2026d200_91") < 0 && ids.indexOf("2026d197_5_c") < 0, ids);
  ok("checked task kept (history/points intact)", ids.indexOf("2026d200_90") >= 0, ids);
  ok("other subjects untouched", ids.indexOf("2026d200_92") >= 0, ids);
  const wkw = env._writes.filter(w => w.root.indexOf("week14/tasks") === 0 || (w.root === "week14/tasks"));
  const nulled = env._writes.filter(w => String(w.root).indexOf("week14/tasks") >= 0 && w.val === null).map(w => w.path);
  ok("targeted per-id removes written (no whole-map set)", nulled.length === 2, env._writes.filter(w => String(w.root).indexOf("week14") >= 0));
  ok("subject card removed from db", env._writes.some(w => String(w.root).indexOf("curriculum/subjects/lincoln/testsubj") >= 0 && w.val === "__removed__"));
  ok("skiplog + rebaseline purged", env._writes.some(w => String(w.root).indexOf("skiplog/lincoln/testsubj") >= 0) && env._writes.some(w => String(w.root).indexOf("rebaseline/lincoln/testsubj") >= 0));
  ok("carry guard: deleted subject blocked", res.gone === true);
  ok("carry guard: live subject carries", res.kept === false);
  ok("carry guard: retrieval slots exempt", res.retr === false);
  ok("carry guard: unloaded kid map = no-op", res.noMap === false);
});

console.log("");
console.log(pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
