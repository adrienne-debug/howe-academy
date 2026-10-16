/*
 * Node tests — ↩ a walked-back check-off never rides a Regenerate back onto the week (live 2026-10-14).
 *
 * Live (week27, Lincoln, Discover! Social Studies 6A): lesson 5 was checked Monday 02:34 PM Oct 12. At 12:04 PM Wednesday
 * Adrienne walked it back (snapshot wb_1791993846397, walkback_excl/<id> = true, the check-off and history removed by
 * targeted writes — the other devices logged "FB checked keys=39 local=40" and took the 39). At 12:04:36 she tapped
 * Regenerate on the same device. gwCommit rebuilds this week's checks as the UNION of the device's two local copies
 * (localStorage + memory); one still held the old key, the generator served lesson 5 fresh under the SAME id, so the
 * new card was born checked with the original done-time, the cascade's ts heal moved it to Monday ("cascade heal(ts):
 * …_L0005 friday → monday"), the whole-week save wrote 40 keys ("FB checked keys=40 local=39" on the others), and
 * she had to walk it back again at 12:06 (wb_1791994001048 — the same card, the same 02:34 PM Oct 12). Lincoln then
 * really did the lesson at 12:09 PM Wednesday — a NEW done-time under the same id, which must survive a regenerate.
 *
 * WBREGEN (in gwCommit, same-week branch, before the re-attach passes): a check whose id is in walkback_excl AND whose
 * done-time is one a walk-back snapshot recorded for this week is dropped from the maps the existing save writes
 * (with its history entry). It adds no write of its own. A check with a new done-time is kept and heals as before.
 *
 * Replays the REAL ceWalkApply, then the REAL gwCommit (+ the real cascadeIntraWeek / runCascade it calls — the heal)
 * against a fake Firebase; the pre-fix code (WBREGEN sliced out) is run as a control and must reproduce her report.
 *   run:  node test_walkback_regen.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x) : "")); } };
function slice(name) { const i = src.indexOf("function " + name + "("); if (i < 0) throw new Error("missing " + name);
  let d = 0; for (let k = src.indexOf("{", i); k < src.length; k++) { if (src[k] === "{") d++; else if (src[k] === "}") { d--; if (!d) return src.slice(i, k + 1); } } }
function sliceConst(name) { const i = src.indexOf("const " + name + "="); if (i < 0) throw new Error("missing const " + name); return src.slice(i, src.indexOf("\n", i)); }
const GWC = slice("gwCommit");
const CASCADE = ["toMin", "fromMin", "_parseCheckTs", "_dismissed", "_normOrderArr", "taskDevice", "taskSubject", "taskTier", "capFor", "capForDisplay",
  "catchupDayCap", "isCatchupCapped", "subjNoCarry", "applyStickyOrder", "packDay", "packAround", "momClosingSlot", "cascadeIntraWeek", "runCascade"].map(slice).join("\n")
  + "\n" + ["_normTitle", "_lessonPart", "_sameLesson", "_histOwnsCard"].map(sliceConst).join("\n") + "\n";
const CODE = GWC + "\n" + slice("gwCheckTsMs") + "\n" + slice("ceWalkApply") + "\n" + slice("_walkDoneKey") + "\n" + slice("baseId") + "\n" + CASCADE;
// the control: the same code with the fix sliced out
const CODE_OLD = CODE.replace(/ *\/\/ WBREGEN_START[\s\S]*?\/\/ WBREGEN_END\n/, "");

console.log("── wiring ──");
{
  const ga = src.indexOf("function gwCommit("), gb = ga + GWC.length;
  const wa = src.indexOf("// WBREGEN_START"), wb = src.indexOf("// WBREGEN_END");
  ok("WBREGEN block exists, inside gwCommit", wa > ga && wb < gb && wb > wa);
  const sc = src.indexOf("const snapChecked={...lsChecked,...memChecked};", ga), gm = src.indexOf("// GWC_MATCH_START", ga);
  ok("it sits after the union of the two local copies and before the re-attach passes", sc > ga && sc < wa && gm > wb);
  const blk = src.slice(wa, wb);
  ok("it keys on walkback_excl AND the snapshot's done-time (never the exclusion alone)", /walkbackExcl/.test(blk) && /checkedTs/.test(blk) && /indexOf\(String\(snapChecked\[id\]\)\)<0\) return/.test(blk));
  ok("it drops the history entry with the check", /delete snapHist\[id\]/.test(blk));
  ok("it writes nothing of its own (no db.ref, no sv)", blk.indexOf("db.ref(") < 0 && blk.indexOf("sv(") < 0 && blk.indexOf(".set(") < 0 && blk.indexOf(".update(") < 0);
  const rg = slice("schedRegenerateNow");
  ok("the Regenerate tap loads the walk-back snapshots when this device has none (a read)", /walkbackData===null\) db\.ref\("walkbacks"\)\.once\("value"\)/.test(rg) && rg.indexOf("walkbacks\").set") < 0);
  ok("the control code really lacks the fix", CODE_OLD.indexOf("WBREGEN") < 0 && CODE_OLD.indexOf("_wbTs") < 0 && CODE.indexOf("_wbTs") > 0);
}

// ── the world ─────────────────────────────────────────────────────────────────────────────────────
const SK = "discover_social_studies_6_student_worktext_6a", KID = "lincoln", WK = "week27";
const L = n => KID + "_" + KID + "__" + SK + "_L" + String(n).padStart(4, "0");
const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const DAY_DT = { monday: "October 12", tuesday: "October 13", wednesday: "October 14", thursday: "October 15", friday: "October 16", saturday: "October 17" };
const SEQ = ["Lesson 1", "Lesson 2", "Lesson 3", "Lesson 4", "Lesson 5: What Makes a Civilization (p.20)", "Lesson 6: Life in Sumer (p.22)", "Lesson 7", "Lesson 8", "Lesson 9", "Lesson 10"];
const IDS = SEQ.map((_, i) => "L" + String(i + 1).padStart(4, "0"));
const TITLE = n => "📖 Discover! Social Studies 6 — Student Worktext 6A — " + SEQ[n - 1];
const ss = (n, day, time, x) => Object.assign({ id: L(n), who: KID, subjectKey: SK, lid: IDS[n - 1], day, time, dur: 25, mom: "required", device: "book", title: TITLE(n), detail: "25 minutes. Mom Required. Sequential. Max 1 per day." }, x || {});
let N = 0;
const c = (who, day, time, dur, sk, x) => Object.assign({ id: "2026d" + (280 + DAYS.indexOf(day)) + "_" + (N++), who, day, time, dur, subjectKey: sk, title: sk === "morning_nb" ? "📖 Morning Notebook — Morning Notebook" : sk === "closing_nb" ? "📖 Closing Notebook — Closing Notebook" : "📄 " + sk, mom: "none", device: "paper" }, x || {});
const dailies = () => { const out = []; ["monday", "tuesday", "wednesday", "thursday", "friday"].forEach(d => {
  out.push(c(KID, d, "10:00 AM", 5, "morning_nb")); out.push(c(KID, d, "10:05 AM", 25, "mr_pages")); out.push(c(KID, d, "10:30 AM", 25, "eggspress_l")); out.push(c(KID, d, "2:00 PM", 5, "closing_nb")); }); return out; };

function FakeDB(tree) {
  const log = [];
  const setPath = (p, v) => { const ks = p.split("/").filter(Boolean); let x = tree;
    for (let i = 0; i < ks.length - 1; i++) { if (x[ks[i]] == null || typeof x[ks[i]] !== "object") x[ks[i]] = {}; x = x[ks[i]]; }
    if (v === null) delete x[ks[ks.length - 1]]; else x[ks[ks.length - 1]] = JSON.parse(JSON.stringify(v)); };
  const get = p => p.split("/").filter(Boolean).reduce((x, k) => (x == null ? x : x[k]), tree);
  return { tree, log, ref(base) { return {
    once: () => Promise.resolve({ val: () => JSON.parse(JSON.stringify(get(base) || null)) }),
    set(v) { log.push({ op: "set", base, keys: Object.keys(v || {}) }); setPath(base, v); return Promise.resolve(); },
    remove() { log.push({ op: "remove", base, keys: [] }); setPath(base, null); return Promise.resolve(); },
    update(map) { const ks = Object.keys(map);
      for (const a of ks) for (const b of ks) if (a !== b && b.indexOf(a + "/") === 0) throw new Error("update failed: /" + a + " is ancestor of /" + b);
      ks.forEach(k => setPath(base + "/" + k, map[k])); log.push({ op: "update", base, keys: ks, map: JSON.parse(JSON.stringify(map)) }); return Promise.resolve(); } }; } };
}

// Lincoln's week as the walk-back found it: lesson 5 checked Monday, the week's dailies with Mon/Tue done.
function world(o) {
  o = o || {}; N = 0;
  const tasks = dailies();
  tasks.push(ss(5, "monday", "11:05 AM", { cascade: true }));
  tasks.push(ss(6, "saturday", "10:00 AM", { _eowOverflow: true }));
  const checked = { [L(5)]: "02:34 PM Oct 12" };
  tasks.filter(t => (t.day === "monday" || t.day === "tuesday") && t.who === KID && t.subjectKey !== SK).forEach(t => { checked[t.id] = (t.day === "monday" ? "10:3" : "10:4") + "0 AM Oct 1" + (t.day === "monday" ? "2" : "3"); });
  const history = { [L(5)]: { id: L(5), lid: "L0005", day: "monday", checkedOnDay: "monday", ts: "02:34 PM Oct 12", week: WK, who: KID, title: TITLE(5) } };
  Object.keys(checked).forEach(id => { if (!history[id]) { const t = tasks.find(x => x.id === id); history[id] = { id, day: t.day, checkedOnDay: t.day, ts: checked[id], week: WK, who: KID, title: t.title }; } });
  const done = { L0004: { day: "2026-10-05", src: "check", taskId: L(4), ts: "11:29 AM Oct 5" }, L0005: { day: "2026-10-12", src: "check", taskId: L(5), ts: "02:34 PM Oct 12" } };
  const tree = { [WK]: { tasks: Object.fromEntries(tasks.map(t => [t.id, JSON.parse(JSON.stringify(t))])), checked: Object.assign({}, checked), history: JSON.parse(JSON.stringify(history)), meta: { week: WK, dates: DAY_DT } },
    curriculum: { done: { [KID]: { [SK]: JSON.parse(JSON.stringify(done)) } } }, walkbacks: {}, walkback_excl: {} };
  const db = FakeDB(tree); const dbgL = [], toasts = [];
  const LS = {};   // this device's localStorage
  const sv = (k, v) => { LS[k] = JSON.stringify(v); }, ld = k => (LS[k] == null ? null : JSON.parse(LS[k]));
  sv(WK + "_tasks", tasks); sv(WK + "_checked", checked); sv(WK + "_history", history);
  const env = { console, JSON, Object, Array, String, Number, Math, Set, Map, RegExp, parseInt, isNaN, Promise, Infinity, setTimeout,
    WK, weekData: { tasks: tasks.map(t => Object.assign({}, t)), week: WK }, fbTasksLoaded: true, fbCheckedLoaded: true, fbHistoryLoaded: true, fbCurrLoaded: true,
    checked, claimed: {}, histState: JSON.parse(JSON.stringify(history)), archive: {}, slState: {}, momMoves: {}, coExclusions: {}, DAY_DT: Object.assign({}, DAY_DT), ROSTER: ["lincoln", "ellis", "lucy", "julian"],
    db, _dryRun: () => false, sv, ld, LS, dbg: m => dbgL.push(m), gwShowToast: m => toasts.push(m),
    HA_LS: { getItem: k => (k === "ha_active_wk" ? WK : null), setItem: () => {} }, isUploading: false, lastCheckedWrite: 0, lastTasksWrite: 0,
    currData: { subjects: { [KID]: { [SK]: { display: "Discover! Social Studies 6", mom: "required", minutes: 25 }, morning_nb: { noCarry: true }, closing_nb: { noCarry: true }, mr_pages: {}, eggspress_l: {} } }, done: { [KID]: { [SK]: done } } },
    rulesData: { schoolDay: { defaultStart: "10:00 AM", defaultEnd: "4:15 PM", lunchStart: "1:00 PM", lunchEnd: "2:00 PM" } }, DEFAULT_DAY_CAP: 2, _cascNowMin: 12 * 60 + 7,
    smapIsKidOff: () => null, schedOv: () => null, schedOvKidOff: () => null, satCutoffMin: () => null, satApplyCutoff: () => {}, lockHeldByOther: () => false,
    safeWriteTasks: (reason) => { env.writes.push({ reason, five: JSON.parse(JSON.stringify(env.weekData.tasks.find(t => t.id === L(5)) || null)) }); }, writes: [],
    renderAll: () => {}, runDisplacement: () => {}, applyWeekMeta: () => {},
    gwSyncConfigOverrides: () => {}, weekShapeSig: () => "sig", committedShapeSigs: {}, gwConfig: { weekNum: "27" }, gwDropped: null, gwCursors: null, _wkHandingOver: false, _wkIsFutureWeek: () => false, _wkParkFuture: () => { throw new Error("parked"); },
    completedLessonKeys: () => new Set(), carryPlanBacked: () => false, _carryBlocked: () => false, carryRebaselined: () => false, carrySubjectGone: () => false,
    // ── walk-back sheet state (lesson 5, "take them off the schedule" ticked) ──
    ceEditKid: KID, ceEditKey: SK, _ceWalkItems: [{ wk: WK, wkNum: 27, dord: 0, doneKey: L(5), baseId: L(5), title: TITLE(5), detail: "25 minutes", day: "monday", ts: "02:34 PM Oct 12", hist: history[L(5)], archive: false }],
    ceWalkSel: new Set([0]), document: { getElementById: id => id === "ce-walk-note" ? { value: "he never did it" } : id === "ce-walk-remove" ? { checked: true } : null },
    confirm: () => true, manualUnchecks: new Set(), ckForget: () => {}, obRemove: () => {},
    walkbackExcl: {}, walkbackData: o.wbNull ? null : {}, nowTs: () => "12:04 PM Oct 14", schedCascade: () => {}, ceRenderEditSheet: () => {},
    lidDoneRemoveByCard: (kid, sk, ids, title, patch) => { const node = env.currData.done[kid][sk]; const set = new Set(ids.filter(Boolean)); const lid = Object.keys(node).find(k => node[k] && set.has(node[k].taskId)) || null; if (!lid) return null; patch["done/" + kid + "/" + sk + "/" + lid] = null; delete node[lid]; return lid; },
  };
  // frozen clock: Wednesday Oct 14, 12:07 PM
  const RealDate = Date;
  env.Date = class extends RealDate { constructor(...a) { if (a.length) super(...a); else { super("2026-10-14T00:00:00"); this.setHours(12, 7, 0, 0); } } static now() { return new RealDate("2026-10-14T12:07:00").getTime(); } };
  vm.createContext(env);
  new vm.Script(o.old ? CODE_OLD : CODE).runInContext(env);
  return { env, db, dbgL, toasts, LS, tasks };
}
const card = (w, n) => w.env.weekData.tasks.find(t => t.id === L(n)) || null;
const srvChecked = w => w.db.tree[WK].checked || {};
const srvTask = (w, n) => ((w.db.tree[WK].tasks || {})[L(n)]) || null;
// the Regenerate: the generator serves lesson 5 fresh (no done record) on Friday, the dailies under new ids
function regen(w, extra) {
  const tasks = dailies(); tasks.push(ss(5, "friday", "2:25 PM")); (extra || []).forEach(t => tasks.push(t));
  w.env.gwResult = { week: WK, tasks: tasks.map(t => Object.assign({}, t)), dates: DAY_DT, constraints: {}, windows: {} };
  w.env.gwCommit();
}
const healLine = (w, n) => w.dbgL.find(m => m.indexOf("cascade heal(ts): " + L(n)) === 0) || null;
const ranClean = (w, label) => ok(label + ": the real cascade + runCascade ran after the commit (no error swallowed)", w.dbgL.some(m => /^wrote tasks \(cascade-heal\)|^gc: purged/.test(m)) && !w.dbgL.some(m => /error/i.test(m)), w.dbgL.filter(m => /error/i.test(m)));

console.log("\n── her case: walk back Monday's lesson 5, Regenerate from a device whose LOCALSTORAGE copy still holds the key ──");
{
  const w = world();
  const stale = JSON.parse(w.LS[WK + "_checked"]);   // the map before the walk-back (40 keys live)
  w.env.ceWalkApply();
  ok("walk-back: the check is gone locally and on the server, excl set, snapshot saved", !w.env.checked[L(5)] && !srvChecked(w)[L(5)] && w.db.tree.walkback_excl[L(5)] === true && Object.values(w.db.tree.walkbacks.lincoln)[0].items[0].checkedTs === "02:34 PM Oct 12");
  w.LS[WK + "_checked"] = JSON.stringify(stale);        // this device's localStorage copy is stale (the live "local=40")
  const nBefore = Object.keys(srvChecked(w)).length;
  regen(w);
  ranClean(w, "her case");
  ok("the re-served lesson-5 card is NOT born checked", !w.env.checked[L(5)], w.env.checked[L(5)]);
  ok("the whole-week save did not write the walked-back check", !srvChecked(w)[L(5)] && Object.keys(srvChecked(w)).length === nBefore, Object.keys(srvChecked(w)));
  ok("history for it is not written either", !(w.db.tree[WK].history || {})[L(5)] && !w.env.histState[L(5)]);
  ok("the heal never moved it to Monday — it sits on Friday, open", !healLine(w, 5) && card(w, 5) && card(w, 5).day === "friday" && srvTask(w, 5) && srvTask(w, 5).day === "friday", [healLine(w, 5), card(w, 5) && card(w, 5).day]);
  ok("runCascade did not restore it from history", !w.dbgL.some(m => /reconciled/.test(m)), w.dbgL.filter(m => /reconciled/.test(m)));
  ok("the drop is logged", w.dbgL.some(m => /↩ walk-back \(regenerate\): dropped 1/.test(m) && m.indexOf(L(5)) > 0), w.dbgL);
  ok("the other checks (Mon/Tue dailies) re-attached as before", Object.keys(srvChecked(w)).length === nBefore && nBefore >= 8, nBefore);
  ok("no write touched walkbacks/ or walkback_excl/ (the walk-back's own excl set aside)", w.db.log.filter(e => /^walkback/.test(e.base)).length === 2 && w.db.log.filter(e => /^walkback/.test(e.base)).every(e => e.op === "set"));
}
console.log("\n── the same, with the MEMORY copy stale instead (a listener echo put the old map back) ──");
{
  const w = world();
  const stale = Object.assign({}, w.env.checked);
  w.env.ceWalkApply();
  w.env.checked = stale;   // memory holds the pre-walk-back map; localStorage is clean
  regen(w);
  ok("not born checked; nothing written for it", !w.env.checked[L(5)] && !srvChecked(w)[L(5)] && !healLine(w, 5));
}

console.log("\n── control: the pre-fix code reproduces her report ──");
{
  const w = world({ old: true });
  const stale = JSON.parse(w.LS[WK + "_checked"]);
  w.env.ceWalkApply();
  w.LS[WK + "_checked"] = JSON.stringify(stale);
  regen(w);
  ranClean(w, "control");
  ok("old code: the fresh card came back CHECKED with the original done-time", w.env.checked[L(5)] === "02:34 PM Oct 12", w.env.checked[L(5)]);
  ok("old code: the whole-week save wrote it to the server (her 'FB checked keys=40')", srvChecked(w)[L(5)] === "02:34 PM Oct 12");
  ok("old code: the cascade heal moved it friday → monday (the live log line)", healLine(w, 5) && /friday → monday/.test(healLine(w, 5)) && card(w, 5).day === "monday", healLine(w, 5));
}

console.log("\n── a genuinely NEW check-off on the re-served card still heals (Lincoln did it at 12:09 PM Wednesday) ──");
{
  const w = world();
  w.env.ceWalkApply();
  // the walk-back's re-lay put lesson 5 back on Thursday; Lincoln checked it off at 12:09 PM Wednesday (a new done-time)
  const five = ss(5, "thursday", "10:55 AM"); w.env.weekData.tasks.push(five); w.db.tree[WK].tasks[L(5)] = JSON.parse(JSON.stringify(five));
  const NEW = "12:09 PM Oct 14";
  w.env.checked[L(5)] = NEW; w.db.tree[WK].checked[L(5)] = NEW; w.env.sv(WK + "_checked", w.env.checked);
  const h = { id: L(5), lid: "L0005", day: "thursday", checkedOnDay: "wednesday", ts: NEW, week: WK, who: KID, title: TITLE(5) };
  w.env.histState[L(5)] = h; w.db.tree[WK].history[L(5)] = h; w.env.sv(WK + "_history", w.env.histState);
  ok("precondition: excl still names the id, the snapshot still holds the OLD done-time", w.env.walkbackExcl[L(5)] === true && Object.values(w.env.walkbackData.lincoln)[0].items[0].checkedTs === "02:34 PM Oct 12");
  regen(w);
  ranClean(w, "new check");
  ok("the new check is kept on the re-served card", w.env.checked[L(5)] === NEW && srvChecked(w)[L(5)] === NEW, [w.env.checked[L(5)], srvChecked(w)[L(5)]]);
  ok("its history entry is kept", (w.db.tree[WK].history || {})[L(5)] && w.db.tree[WK].history[L(5)].ts === NEW);
  ok("the heal moved the card to the day it was really done: Wednesday 12:09 PM", healLine(w, 5) && /friday → wednesday/.test(healLine(w, 5)) && card(w, 5).day === "wednesday" && card(w, 5).time === "12:09 PM", [healLine(w, 5), card(w, 5)]);
  ok("…and the healed day rides the cascade's own week write that follows (live: 'wrote tasks (cascade): 168')", w.env.writes.some(x => x.reason === "cascade" && x.five && x.five.day === "wednesday" && x.five.time === "12:09 PM"), w.env.writes);
  ok("nothing was dropped", !w.dbgL.some(m => /walk-back \(regenerate\): dropped/.test(m)));
}

console.log("\n── guards: the exclusion alone never strips a check ──");
{
  // no snapshot on this device (walkbackData loaded empty), excl names the id, a check sits under it → kept
  const w = world();
  w.env.walkbackExcl[L(5)] = true;   // an older walk-back's exclusion, say
  const NEW = "11:40 AM Oct 14";
  w.env.checked[L(5)] = NEW; w.db.tree[WK].checked[L(5)] = NEW; w.env.sv(WK + "_checked", w.env.checked);
  regen(w);
  ok("no snapshot → the check under an excluded id is kept (a strip needs the snapshot's proof)", w.env.checked[L(5)] === NEW && srvChecked(w)[L(5)] === NEW);
}
{
  // a snapshot for ANOTHER week with this id + done-time does not count for this week
  const w = world();
  w.env.ceWalkApply();
  Object.values(w.env.walkbackData.lincoln)[0].items[0].wk = "week26";
  const stale = { [L(5)]: "02:34 PM Oct 12" }; w.LS[WK + "_checked"] = JSON.stringify(Object.assign(JSON.parse(w.LS[WK + "_checked"]), stale));
  regen(w);
  ok("another week's snapshot does not strip this week's check", w.env.checked[L(5)] === "02:34 PM Oct 12");
}
{
  // a _c twin walked back: the snapshot names <id>_c, the stale copy holds <id>_c → dropped by its own key
  const w = world();
  w.env._ceWalkItems[0].doneKey = L(5) + "_c"; w.env._ceWalkItems[0].baseId = L(5);
  w.env.weekData.tasks.push(ss(5, "monday", "11:05 AM", { id: L(5) + "_c", cascade: true }));
  w.env.checked[L(5) + "_c"] = "02:34 PM Oct 12"; w.db.tree[WK].checked[L(5) + "_c"] = "02:34 PM Oct 12"; w.env.sv(WK + "_checked", w.env.checked);
  const stale = JSON.parse(w.LS[WK + "_checked"]);
  w.env.ceWalkApply();
  ok("walk-back removed the twin's check, excl names the base", !w.env.checked[L(5) + "_c"] && w.env.walkbackExcl[L(5)] === true);
  w.LS[WK + "_checked"] = JSON.stringify(stale);
  regen(w, [ss(5, "monday", "11:05 AM", { id: L(5) + "_c", cascade: true })]);
  ok("the twin's walked-back check is dropped too (key matched through its base)", !w.env.checked[L(5) + "_c"] && !srvChecked(w)[L(5) + "_c"], Object.keys(w.env.checked).filter(k => k.indexOf(L(5)) === 0));
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
