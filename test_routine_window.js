// 🧾 RLWIN (her yes 2026-10-18: "two weeks at startup; older weeks load the first time the Household tab, Home Base alerts
// or cleaning plan need them; those wait, and the once-job sweep never runs on partial history"). Slices the real RLWIN
// block (and the gated functions) out of index.html and runs them over a stubbed db: startup listens to routineLog/<kid>/
// <this week> and <last week> only — never the whole routineLog — and moves forward with the week; the full history loads
// once (one read per kid) when first needed, merges without clobbering the live weeks, and redraws; the Household tab and
// the cleaning plan show a loading line until then; Home Base's alert badge only peeks; the once-job sweep never saves on
// partial history. Check-off writes are untouched.
// Run: node test_routine_window.js
const fs = require("fs"), path = require("path");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
let pass = 0, fail = 0;
function ok(name, cond, d) { if (cond) { pass++; console.log("  ok  - " + name); } else { fail++; console.log("  FAIL- " + name + (d ? "  → " + d : "")); } }
const cut = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error("missing " + a); return src.slice(i, j); };
const fnSrc = name => cut("function " + name + "(", "\n}\n") + "\n}\n";

// ── wiring ──
ok("RLWIN block present once", src.indexOf("// RLWIN_START") > 0 && src.indexOf("// RLWIN_START", src.indexOf("// RLWIN_START") + 1) < 0 && src.indexOf("// RLWIN_END") > src.indexOf("// RLWIN_START"));
ok("nothing listens to the WHOLE routineLog any more", !/ref\(\s*["']routineLog["']\s*\)\s*\.on\(/.test(src));
ok("startup attaches the two-week window", /rlWindowAttach\(activeWk\(\)\);/.test(fnSrc("initFb")));
ok("the window follows the week (attachWeekListeners)", /rlWindowAttach\(wk\)/.test(fnSrc("attachWeekListeners")));
ok("Household tab waits for the history", /if\(typeof rlHistReady==="function"&&!rlHistReady\(\)\)\{ if\(el\) el\.innerHTML=rlLoadingHTML/.test(fnSrc("renderHousehold")));
ok("cleaning plan waits for the history", /!rlHistReady\(\)\) return rlLoadingHTML\("the cleaning plan"\)/.test(fnSrc("hhPlanHomeHTML")));
ok("cleaning plan still builds its panel after the wait", /\n  const jobs=hhJobs\(\), R=hhCleanRules\(\)/.test(fnSrc("hhPlanHomeHTML")));
ok("Home Base's alert badge only peeks (plain call)", /hhLevelReadyList\(\)\.forEach/.test(fnSrc("hbAlertItems")));
ok("Mom's day asks the level list to load the history", /hhLevelReadyList\(\{load:true\}\)/.test(fnSrc("hhLevelReadyNowHTML")));
ok("week attach: the window moves after the pending reset", /_ckPending=null; _ckReplayTries=0;[^\n]*\n\s*try\{ if\(typeof rlWindowAttach==="function"\) rlWindowAttach\(wk\)/.test(fnSrc("attachWeekListeners")));
ok("check-offs still write routineLog/<kid>/<wk>/<day>", /db\.ref\("routineLog\/"\+kid\+"\/"\+wk\+"\/"\+day\)\.push\(\)/.test(fnSrc("rlogAppend")));

// ── the window, run ──
const BLOCK = cut("// RLWIN_START", "// RLWIN_END");
function load(env) {
  env = env || {};
  const G = { on: [], off: [], once: [], renders: 0, resolveOnce: [] };
  const db = env.db === false ? null : { ref(p) { const r = {
    on(ev, cb) { G.on.push(p); r.cb = cb; G.cbs = G.cbs || {}; G.cbs[p] = cb; },
    off() { G.off.push(p); },
    once() { G.once.push(p); return new Promise(res => G.resolveOnce.push([p, res])); } }; return r; } };
  const fn = new Function("G", "db", "env", `
    const ROSTER=["lincoln","ellis","lucy","julian"]; let WK="week28"; function activeWk(){ return WK; }
    let routineLog={}; let _hhLogCache={old:1};
    function renderAll(){ G.renders++; }
    ${BLOCK}
    return { rlWindowAttach, rlHistReady, rlHistFull, rlPrevWk, setWk(w){ WK=w; }, get log(){ return routineLog; }, set log(v){ routineLog=v; }, get cache(){ return _hhLogCache; } };`);
  const api = fn(G, db, env); api.G = G; return api;
}
(async () => {
  let a = load();
  a.rlWindowAttach("week28");
  ok("startup: 8 listeners — 4 kids × this week + last week", a.G.on.length === 8 && a.G.on.every(p => /^routineLog\/(lincoln|ellis|lucy|julian)\/week2[78]$/.test(p)), a.G.on.join(" "));
  a.rlWindowAttach("week28");
  ok("attaching again for the same week adds nothing", a.G.on.length === 8 && a.G.off.length === 0);
  a.G.cbs["routineLog/lucy/week28"]({ val: () => ({ monday: { k1: { act: "on", label: "Brush Teeth" } } }) });
  ok("a live week fills routineLog[kid][wk]", a.log.lucy.week28.monday.k1.label === "Brush Teeth");
  a.G.cbs["routineLog/lucy/week28"]({ val: () => null });
  ok("…and an emptied week clears it", !a.log.lucy.week28);
  a.rlWindowAttach("week29");
  ok("week changes → the old 8 stop, the new 8 start (week29 + week28)", a.G.off.length === 8 && a.G.on.length === 16 && a.G.on.slice(8).every(p => /\/week2[89]$/.test(p)));
  ok("week numbers: week1 has no last week; odd keys have none", a.rlPrevWk("week1") === "" && a.rlPrevWk("week10") === "week9" && a.rlPrevWk("x") === "");

  // the full history, once
  a = load(); a.rlWindowAttach("week28");
  a.log = { lincoln: { week28: { monday: { live: { act: "on" } } } } };
  ok("not loaded yet → rlHistFull false", a.rlHistFull() === false);
  ok("first need → starts loading, says not ready", a.rlHistReady() === false && a.G.once.length === 4 && a.G.once.every(p => /^routineLog\/(lincoln|ellis|lucy|julian)$/.test(p)));
  ok("asking again while it loads reads nothing more", a.rlHistReady() === false && a.G.once.length === 4);
  a.G.resolveOnce.forEach(([p, res]) => res({ val: () => (p === "routineLog/lincoln" ? { week20: { friday: { old: { act: "on" } } }, week28: { monday: { stale: {} } } } : { week15: {} }) }));
  await new Promise(r => setTimeout(r, 5));
  ok("loaded → full, older weeks merged in", a.rlHistFull() === true && a.log.lincoln.week20.friday.old.act === "on" && a.log.ellis.week15);
  ok("…a live week keeps its listener's copy", a.log.lincoln.week28.monday.live && !a.log.lincoln.week28.monday.stale);
  ok("…the Household numbers are recounted and the screen redraws", a.cache === null && a.G.renders === 1);
  ok("…and later needs are ready at once, with no more reads", a.rlHistReady() === true && a.G.once.length === 4);
  a = load({ db: false });
  ok("no database → nothing to wait for", a.rlHistFull() === true && a.rlHistReady() === true);

  // ── the once-job sweep never saves on partial history ──
  function sweep(full) {
    const H = { upd: null };
    const f = new Function("H", `
      function momHere(){ return true; } function rlHistFull(){ return ${full}; }
      function hhJobs(){ return { j1:{ status:"active", once:true } }; } function hhIsOnce(j){ return !!j.once; }
      function hhStats(){ return { last:"2026-09-01" }; } let householdData={}; function householdOnValue(){} function _hhWrite(){ return true; }
      const db={ ref(){ return { update(u){ H.upd=u; } }; } };
      ${fnSrc("hhOnceSweep")}
      return hhOnceSweep();`);
    return [f(H), H];
  }
  let [out, H] = sweep(false);
  ok("sweep on partial history: retires nothing, saves nothing", out.length === 0 && H.upd === null);
  [out, H] = sweep(true);
  ok("sweep on full history: works as before", out.length === 1 && H.upd && H.upd["household/jobs/j1/status"] === "retired");

  // ── level reminders: the badge peeks, Mom's day loads ──
  function levels(opts) {
    const L = { asked: 0 };
    const f = new Function("L", "opts", `
      function rlHistFull(){ return false; } function rlHistReady(){ L.asked++; return false; }
      function hhReady(){ return { ready:true, weeks:4 }; } function hhJobs(){ return { a:1 }; }
      const HH_WHO=["lincoln"]; function hhLevelCurFor(){ return 1; } let householdData={};
      ${fnSrc("hhLevelReadyList")}
      return hhLevelReadyList(opts);`);
    return [f(L, opts), L];
  }
  let [lv, L] = levels(undefined);
  ok("badge peek before history: no reminder, no load started", lv.length === 0 && L.asked === 0);
  [lv, L] = levels({ load: true });
  ok("Mom's day before history: no reminder yet, load started", lv.length === 0 && L.asked === 1);

  // ── the Household tab waits ──
  {
    const E = { swept: 0 };
    const f = new Function("E", `
      function rlHistReady(){ return false; } ${cut("function rlLoadingHTML(", "\n")}
      function hhOnceSweep(){ E.swept++; }
      ${fnSrc("renderHousehold")}
      const el={ innerHTML:"" }; renderHousehold(el); return el;`);
    const el = f(E);
    ok("Household tab before history: a loading line (the sweep is asked, and refuses on its own — tested above)", /Loading chore history/.test(el.innerHTML) && E.swept === 1);
  }

  ok("🔀 not used", src.indexOf("🔀") < 0);
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
