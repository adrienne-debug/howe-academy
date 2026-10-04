/*
 * Node tests — 👻 the re-lay can never make a ghost card (her "deploy this", 2026-10-04).
 *
 * Live 2026-10-04 ~18:50–18:54 on DeWalt: re-laying Makenzie's AAS 4 ADDED card L0141 while the school-end guard
 * retimed it (L0141/time) → Firebase rejected the whole save ("ancestor of another path"). The device had already
 * updated its in-memory week, so the next re-lay (Mom-day minutes 15 → 20) sent only L0141/dur — and Firebase
 * created a node holding just {dur:20}. Every schedule render threw on it; the app went blank on every device.
 *
 * Runs the REAL reprojectSubjectWeek + the REAL _reprojectPlan against a fake Firebase with Firebase's rules
 * (an update with a path beside its own child THROWS and writes nothing; a child write creates a missing node).
 *   D  never a path beside its child          (_rpMergeUpd)
 *   E  memory follows only an accepted save    (commit after the write)
 *   F  a field write never recreates a card    (_rpDropOrphanFieldWrites, server read first)
 *   run:  node test_ghost_relay.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
function slice(name) { const i = src.indexOf("function " + name + "("); if (i < 0) throw new Error("missing " + name);
  let d = 0; for (let k = src.indexOf("{", i); k < src.length; k++) { if (src[k] === "{") d++; else if (src[k] === "}") { d--; if (!d) return src.slice(i, k + 1); } } }
const CODE = src.slice(src.indexOf("// RPMERGE_START"), src.indexOf("// RPMERGE_END")) + "\n"
  + slice("reprojectSubjectWeek") + "\n" + slice("_reprojectPlan") + "\n" + slice("lessonDayList") + "\n" + slice("lessonDayFlags");

let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x) : "")); } };

function FakeDB(tree, o) {
  const log = [];
  const setPath = (root, p, v) => { const ks = p.split("/").filter(Boolean); let x = root;
    for (let i = 0; i < ks.length - 1; i++) { if (x[ks[i]] == null || typeof x[ks[i]] !== "object") x[ks[i]] = {}; x = x[ks[i]]; }
    if (v === null) delete x[ks[ks.length - 1]]; else x[ks[ks.length - 1]] = JSON.parse(JSON.stringify(v)); };
  const get = p => p.split("/").filter(Boolean).reduce((x, k) => (x == null ? x : x[k]), tree);
  return { tree, log, ref(base) { return {
    once: () => Promise.resolve({ val: () => JSON.parse(JSON.stringify(get(base) || null)) }),
    update(map) {
      const ks = Object.keys(map);
      if (o && o.rejectNext) { o.rejectNext = false; throw new Error("update failed: simulated rejection"); }
      for (const a of ks) for (const b of ks) if (a !== b && b.indexOf(a + "/") === 0)
        throw new Error("update failed: values argument contains a path /" + a + " that is ancestor of another path /" + b);
      ks.forEach(k => setPath(tree, base + "/" + k, map[k])); log.push(ks); return Promise.resolve(); } }; } };
}
const ID = "makenzie_makenzie__aas_4_L0141", OLD = "makenzie_makenzie__aas_4_L0002";
const card = dur => ({ id: ID, who: "makenzie", subjectKey: "aas_4", lid: "L0141", day: "wednesday", time: "10:35 AM", dur, mom: "required", title: "📄 AAS 4 — Lesson 4 · day 1 of 5" });
const oldCard = () => ({ id: OLD, who: "makenzie", subjectKey: "aas_4", lid: "L0002", day: "tuesday", time: "10:35 AM", dur: 20, title: "📄 AAS 4 — Lesson 4 · day 1 of 4" });
const ADD = { plan: live => ({ upd: { [OLD]: null, [ID]: card(15) }, tasksAfter: live.filter(t => t.id !== OLD).concat([card(15)]),
  summary: { added: [ID], moved: [], removed: [OLD], retitled: [] } }), guard: { [ID + "/time"]: "10:55 AM" } };
const REAL = { real: true, guard: {} };

function world(steps, dbOpts) {
  const tree = { week1: { tasks: { [OLD]: oldCard() } } };
  const db = FakeDB(tree, dbOpts), dbg = []; let call = 0, done = 0;
  const env = { console, JSON, Object, Array, String, Number, Math, Set, Map, RegExp, Date, parseInt, isNaN, Promise,
    WK: "week1", weekData: { tasks: [oldCard()] }, fbTasksLoaded: true, checked: {}, claimed: {}, db, _dryRun: () => false, sv: () => {}, dbg: m => dbg.push(m),
    planBacked: () => true, currWeekNum: () => 1, gwWeekDateRange: () => ({ start: "2026-10-05", end: "2026-10-09" }), _schoolWeekDateFor: () => "2026-10-05",
    _todayStr: () => "2026-10-04", gwParseDate: s => new Date(s + "T12:00:00"), _cbISO: () => "2026-10-04", _rpRelayMode: () => "pattern",
    _RP_DAYS: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"], haClaimSchedLock: (k, cb) => cb(function () {}), gwShowToast: () => {},
    generateWeek: () => ({ result: { tasks: [] } }), gwSatPlanned: () => false, gwRules: () => ({ schoolStart: 540, schoolEnd: 975, lunchStart: 780, lunchEnd: 840 }),
    currData: { subjects: { makenzie: { aas_4: { momDays: [1], momDayMin: 20, minutes: 10, lessonIds: [] } } }, done: {} },
    toMin: s => { const m = /(\d+):(\d+)\s*(AM|PM)/.exec(s || ""); return m ? (+m[1] % 12 + (m[3] === "PM" ? 12 : 0)) * 60 + +m[2] : null; },
    fromMin: n => n, packAround: () => null, seGuardCtx: x => x || {}, _rpPatternWant: () => null };
  env.seGuardWeek = () => ({ upd: Object.assign({}, steps[call - 1].guard || {}), retimed: [], rolled: [], deferred: [] });
  vm.createContext(env); vm.runInContext(CODE, env);
  const realPlan = env._reprojectPlan;
  env._reprojectPlan = function (kid, sk, live, desired, opts) { const s = steps[call++];
    if (s.real) { opts.lsdSubj = env.currData.subjects.makenzie.aas_4; return realPlan(kid, sk, live, live.map(t => Object.assign({}, t)), opts); }
    return s.plan(live); };
  const run = why => new Promise(res => env.reprojectSubjectWeek("makenzie", "aas_4", why, { then: v => res(v) }));
  return { env, db, tree, dbg, run };
}
const real = c => !!c && !!c.id && !!c.title;

(async () => {
  console.log("── D: the live sequence no longer makes a ghost ──");
  {
    const w = world([ADD, REAL]);
    await w.run("relay");
    ok("re-lay 1 is accepted (no 'ancestor' rejection)", !w.dbg.some(m => /ancestor/.test(m)), w.dbg);
    ok("the new card reaches the database whole, retimed by the guard", real(w.tree.week1.tasks[ID]) && w.tree.week1.tasks[ID].time === "10:55 AM");
    w.env.currData.subjects.makenzie.aas_4.momDayMin = 20;
    await w.run("mom");
    ok("after the Mom-day minutes change the card is still whole (dur 20)", real(w.tree.week1.tasks[ID]) && w.tree.week1.tasks[ID].dur === 20, w.tree.week1.tasks[ID]);
  }
  console.log("\n── E: a rejected save leaves this device = the database ──");
  {
    const o = { rejectNext: true }; const w = world([ADD, REAL], o);
    await w.run("relay");
    ok("the save was rejected", w.dbg.some(m => /reproject skip/.test(m)), w.dbg);
    ok("the database never got the card", !w.tree.week1.tasks[ID]);
    ok("…and neither did this device's week (no divergence)", !w.env.weekData.tasks.some(t => t.id === ID));
    ok("the old card is still in memory, matching the database", w.env.weekData.tasks.some(t => t.id === OLD) && !!w.tree.week1.tasks[OLD]);
  }
  console.log("\n── F: a field write never recreates a card that isn't on the server ──");
  {
    const w = world([REAL]);
    w.env.weekData.tasks = [card(15)];           // this device believes L0141 exists…
    delete w.tree.week1.tasks[ID];               // …but the server doesn't have it (deleted elsewhere / never landed)
    await w.run("mom");
    ok("no ghost: L0141 is not recreated", !w.tree.week1.tasks[ID], w.tree.week1.tasks[ID]);
    ok("the dropped write is logged", w.dbg.some(m => /👻 dropped 1 field write/.test(m)), w.dbg);
  }
  {
    const w = world([REAL]);
    w.env.weekData.tasks = [card(15)];
    w.tree.week1.tasks[ID] = { dur: 15 };        // a ghost already on the server counts as "not a real card"
    await w.run("mom");
    ok("an existing ghost is not fed more fields", JSON.stringify(w.tree.week1.tasks[ID]) === JSON.stringify({ dur: 15 }), w.tree.week1.tasks[ID]);
  }
  {
    const w = world([REAL]);
    w.env.weekData.tasks = [card(15)]; w.tree.week1.tasks[ID] = card(15);
    await w.run("mom");
    ok("a real card on the server still gets its field update", w.tree.week1.tasks[ID].dur === 20 && real(w.tree.week1.tasks[ID]));
  }
  {
    const ctx = { Object, JSON }; vm.createContext(ctx); vm.runInContext(src.slice(src.indexOf("// RPMERGE_START"), src.indexOf("// RPMERGE_END")), ctx);
    const u = { a: { id: "a", title: "x" }, "a/time": "1", "b/time": "2", c: null, "d/dur": 5 };
    const dropped = ctx._rpDropOrphanFieldWrites(u, { d: { id: "d", title: "y" } });
    ok("whole-card adds/removes and fields of a card in the same save are kept", "a" in u && "c" in u && "a/time" in u);
    ok("a field of a missing card is dropped; a field of a real card is kept", !("b/time" in u) && "d/dur" in u && dropped.join() === "b/time");
  }
  console.log("\n── the lock and the callback ──");
  {
    let releases = 0; const w = world([ADD]);
    w.env.haClaimSchedLock = (k, cb) => cb(function () { releases++; });
    const v = await w.run("relay");
    ok("the scheduler lock is released exactly once", releases === 1, releases);
    ok("opts.then gets the summary", v && v.added && v.added[0] === ID);
  }
  console.log("\n" + pass + " passed, " + fail + " failed");
  process.exit(fail ? 1 : 0);
})();
