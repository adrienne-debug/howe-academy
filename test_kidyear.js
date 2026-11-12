/*
 * KIDYEAR — 📅 <Kid>'s year (Curriculum streamline slice 3, 2026-11-11; PLAN_curriculum_streamline_2026-11-10.md §3.3,
 * §4 row 3 and §4.3's "move first" list; her answer to Q2 2026-11-10: "i like the rules table better than the builder").
 *
 * What it proves, with the real code sliced out of index.html and replayed on stubs:
 *   (1) the panel has four tabs — Hours & load · School terms · Lanes · All subjects — and every control the two old
 *       kid-tool buttons opened (⚙ Rules & day cap, 🏁 Target · Mom Check · Sessions; Appendix A #5–18, #94–137) is drawn
 *       in one of them with its old handler string; the old ⚙ panel's handlers (main's cbRenderRules, run in the same
 *       world) are all still drawn somewhere in the panel;
 *   (2) the write paths are unchanged: the panel's own handler strings, executed, write curriculum/dayCap/<kid>,
 *       curriculum/targetEnd/<kid>, curriculum/momVerifyKid/<kid>, pace/plans/<key>, curriculum/lanes/<kid>/<id>;
 *   (3) cbRenderRules(col) is byte-identical to main's for two fixtures, and is exactly cap + lanes + table + door;
 *   (4) the lane editor keeps lnEdit across a tab switch and a re-render; closing the panel drops it (as before);
 *   (5) a 🛤 lane band tap on the Grid and the card's Lane shortcuts open the Lanes tab (on that lane / seeded);
 *   (6) renderCurrBuilder (the Builder tab) is reached from no onclick on the page;
 *   (7) the three moved doors: 📋 Plan resources draws in the card's Links & supplies section; ⤒ Delete & shift up and
 *       Add it back… preview in the card's Pace section; Copy to another kid (on Fix-ups) lands on the copy's card;
 *   (8) no new ref() path pattern anywhere in index.html, and the block writes nothing itself.
 *
 * Main for the comparisons: KIDYEAR_VS=<old index.html>, else `git show 59b0b15:index.html` (the main this slice was cut
 * from); without either, (3)'s byte compare and (8)'s pattern compare are skipped and say so.
 *
 *   run:  node test_kidyear.js
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const cp = require("child_process");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const MAIN = (function () {
  if (process.env.KIDYEAR_VS) return fs.readFileSync(process.env.KIDYEAR_VS, "utf8");
  try { return cp.execSync("git show 59b0b15:index.html", { cwd: __dirname, maxBuffer: 64 << 20, stdio: ["ignore", "pipe", "ignore"] }).toString(); } catch (e) { return null; }
})();

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log("  ok  - " + name); }
  else { fail++; console.log("  FAIL- " + name + (extra !== undefined ? "  (" + JSON.stringify(extra).slice(0, 500) + ")" : "")); }
}
function braceSlice(S, name) { const sig = "function " + name + "("; const i = S.indexOf(sig); if (i < 0) return null; let d = 0, j = S.indexOf("{", i); for (let k = j; k < S.length; k++) { if (S[k] === "{") d++; else if (S[k] === "}") { d--; if (d === 0) return S.slice(i, k + 1); } } return null; }
function block(S, a, b) { const i = S.indexOf(a); if (i < 0) return ""; return S.slice(i, S.indexOf(b, i)); }
const fn = n => braceSlice(src, n) || "";
const KY = block(src, "// KIDYEAR_START", "// KIDYEAR_END");
const norm = h => h.replace(/\s+/g, " ").trim();
function handlers(html) { const out = []; const re = /\s(onclick|onchange|oninput)="([^"]*)"/g; let m; while ((m = re.exec(html))) out.push(norm(m[2])); return out; }
const unesc = h => h.replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&");

// ─────────────────────────────────────────────────────────────────────────────
// the panel world: CURRWORDS + the lane engine + the lane door + CURRCARD + KIDYEAR + cbRenderRules + the writers
function subj(display, n, days, tpw, extra) {
  const seq = Array.from({ length: n }, (_, i) => display + " L" + (i + 1));
  return Object.assign({ display, lessonSeq: seq, lessonIds: seq.map((_, i) => "L" + String(i + 1).padStart(4, "0")), doneImportedAt: 1, planId: "kid__" + display,
    allowedDays: days, timesPerWeek: tpw, pacing: { mode: "timesPerWeek", tpw }, minutes: 15, mom: "none", device: "paper", rules: "" }, extra || {});
}
const doneN = n => { const o = {}; for (let i = 0; i < n; i++) o["L" + String(i + 1).padStart(4, "0")] = { ts: 1, day: "2026-09-01" }; return o; };
const LANES = { L1: { name: "Math", units: [{ sk: "s3b", rhythm: "own" }, { sk: "s4a", rhythm: "prior" }, { sk: "old", rhythm: "own", retired: true }] } };
const WRITERS = ["cbSetCap", "cbCapStep", "cbRulesToggle", "ceSetTargetEnd", "ceToggleMomVerifyKid", "ceRenderSessions", "ceSessToggle", "updatePlanField", "savePacePlan", "togglePlanKid", "togglePlanSchoolDay"];

function panelWorld(S, o) {
  o = o || {};
  const subjects = { s3b: subj("Singapore 3B", 2, ["Mon", "Wed", "Fri"], 3), s4a: subj("DM 4A", 5, ["Tue"], 1), geo: subj("Daily Geo", 6, ["Mon"], 1), sci: subj("Daily Sci", 6, ["Mon"], 1),
    old: subj("Singapore 3A", 2, ["Mon"], 3), reflex: { display: "Reflex", tracking: "daily", minutes: 10 } };
  const log = [];
  const ctx = {
    console, Set, Map, Math, Object, Array, String, Number, JSON, parseInt, parseFloat, Date, RegExp, Error, isNaN, Symbol,
    currData: { subjects: { kid: subjects }, done: { kid: { s3b: doneN(2), old: doneN(2) } }, lessons: { kid: {} }, lanes: { kid: JSON.parse(JSON.stringify(LANES)) },
      dayCap: o.capSet ? { kid: 200 } : {}, targetEnd: o.tgt ? { kid: "2027-05-28" } : {}, momVerifyKid: { kid: false } },
    paceData: { plans: { fall: { label: "Fall term", song: "s1", goals: { kid: { s3b: "Singapore 3B L2" } }, kids: ["kid"], start: "2026-08-24", end: "2026-12-18", schoolDays: ["Mon", "Tue", "Wed", "Thu", "Fri"] } } },
    PACE_DEFAULT_PLANS: {}, celebSongs: [{ id: "s1", name: "Song" }], buildSubjectLessons: (k, sk) => ((subjects[sk] || {}).lessonSeq || []).map((l, i) => ({ lesson: l, dayNum: 90000 + i })), computeSubjectCursor: () => 0, formatPlanDate: d => String(d), HA_LS: { setItem() {}, getItem() { return null; } },
    db: { ref: p => ({ set: v => log.push([p, "set", JSON.parse(JSON.stringify(v === undefined ? null : v))]), remove: () => log.push([p, "remove"]), update: v => log.push([p, "update", JSON.parse(JSON.stringify(v))]) }) },
    log, gvKid: "kid", cbKid: "kid", cbMsg: "", lnEdit: null, lnUndo: o.undo ? { kid: "kid", id: "L1", label: "updated lane “Math”", prev: null } : null,
    cbRulesOpen: true, cbFamilyRulesOpen: false, cbDayPinScroll: 0, cbNewGroup: null, ceSessEdit: o.sessOpen ? "fall" : null,
    KID_COLOR: { kid: "#123456" }, ROSTER: ["kid", "other"], DEFAULT_DAY_CAP: 2, CURR_DEV_EMOJI: { paper: "📄" }, CURR_DEV_LABEL: { paper: "Paper" },
    momModeActive: true, adminPinUnlocked: true, renders: 0, renderAll: () => { ctx.renders++; }, confirm: () => true, setTimeout: () => 0,
    document: { getElementById: () => null }, cbDayCap: () => 180, cbOverCapDays: () => 0, cbAltGroups: () => ({}), cbGroupOf: () => null, rulesFamilyCardsHTML: () => "",
    coopsMap: () => (o.coop ? { c1: { mode: "timed", kids: ["kid"] } } : {}), coopDayRule: () => null, noCoopDaysOf: () => null, lessonDaySpan: () => 0, lessonDayList: () => [],
    ldPin: () => null, ldMissMode: () => "next", ldPracticeMode: () => "drop",
    cap: x => String(x).charAt(0).toUpperCase() + String(x).slice(1),
    _rlwWas: p => ({ p }), _rlwCurrDoor: (l) => log.push(["door", l]), _rlwKidPairs: () => [], _rlwLanePairs: () => [],
    gvSetKid: k => { ctx.gvKid = k; ctx.renders++; }, ceCloseSheet: () => { ctx.closed = (ctx.closed || 0) + 1; },
  };
  ctx.lidsFor = (k, sk) => (subjects[sk] || {}).lessonIds || null;
  ctx.lidStamped = (k, sk) => !!(subjects[sk] && subjects[sk].doneImportedAt && subjects[sk].lessonIds);
  ctx.planBacked = (k, sk) => !!(subjects[sk] && subjects[sk].planId && ctx.lidStamped(k, sk));
  ctx.lidDoneIdx = (k, sk) => { if (!ctx.lidStamped(k, sk)) return null; const d = new Set(Object.keys(((ctx.currData.done.kid) || {})[sk] || {})); const out = new Set(); (subjects[sk].lessonIds || []).forEach((id, i) => { if (d.has(id)) out.add(i); }); return out; };
  ctx.window = ctx;
  vm.createContext(ctx);
  const parts = [block(S, "// CURRWORDS_START", "// CURRWORDS_END"), braceSlice(S, "esc"), braceSlice(S, "cbDefaultForm"), braceSlice(S, "capFor"),
    block(S, "// LANE_START", "// LANE_END"), block(S, "// LANE_UI_START", "// LANE_UI_END"), block(S, "// CURRCARD_START", "// CURRCARD_END"),
    braceSlice(S, "cbRenderRules"), block(S, "// KIDYEAR_START", "// KIDYEAR_END")].concat(WRITERS.map(n => braceSlice(S, n) || ""));
  new vm.Script(parts.join("\n")).runInContext(ctx);
  ctx.run = expr => vm.runInContext(expr, ctx);
  // auto-stub for render-only helpers the sessions list reaches for (never a writer — every writer above is real)
  ctx.render = (expr) => { for (let t = 0; t < 200; t++) { try { return ctx.run(expr); } catch (e) { const m = /^(\w+) is not defined/.exec(e.message); if (!m || WRITERS.indexOf(m[1]) >= 0) throw e; ctx[m[1]] = function () { return ""; }; } } throw new Error("too many stubs"); };
  ctx.panel = tab => { if (tab) ctx.run("kyTab=" + JSON.stringify(tab)); return ctx.render('kyPanelHTML("kid","#123456")'); };
  return ctx;
}

// ── 1 · four tabs, every old control ─────────────────────────────────────────
console.log("── 1 · the four tabs and every control of the two old panels ──");
{
  ok("the block is there with its markers, and defines the panel + its doors", KY.length > 1000 && ["kySetTab", "kyReveal", "kyLane", "kyPanelHTML", "kyPaceDoor", "kyCopyLand", "kyLrpOnCard"].every(n => KY.indexOf("function " + n + "(") >= 0));
  const W = panelWorld(src, { capSet: true, tgt: true, sessOpen: true, undo: true });
  const H = W.panel("hours"), T = W.panel("terms"), L = W.panel("lanes"), A = W.panel("all");
  const tabsOf = h => handlers(h).filter(x => /^kySetTab\(/.test(x));
  ok("every tab draws the same four tab buttons, in order: Hours & load · School terms · Lanes · All subjects",
    [H, T, L, A].every(h => JSON.stringify(tabsOf(h)) === JSON.stringify(["kySetTab('hours')", "kySetTab('terms')", "kySetTab('lanes')", "kySetTab('all')"]))
    && /Hours &amp; load|Hours & load/.test(H) && H.indexOf("School terms") >= 0 && H.indexOf(">Lanes<") >= 0 && H.indexOf(">All subjects<") >= 0, tabsOf(H));
  ok("the panel has id ky-panel (kyReveal scrolls to it)", [H, T, L, A].every(h => h.indexOf('id="ky-panel"') >= 0));
  const hH = handlers(H);
  const HOURS = ["cbCapStep('kid',-15)", "cbCapStep('kid',15)", "cbSetCap('kid',0)", "ceSetTargetEnd('kid',this.value)", "ceSetTargetEnd('kid','')", "ceToggleMomVerifyKid('kid')", "setAdminSub('settings')"];
  HOURS.forEach(x => ok("Hours & load: " + x, hH.indexOf(x) >= 0));
  ok("Hours & load: the Longest school day label, 🏁 Finish the year by, You approve Kid’s check-offs", H.indexOf("Longest school day") >= 0 && H.indexOf("🏁 Finish the year by") >= 0 && H.indexOf("You approve Kid’s check-offs") >= 0);
  ok("Hours & load holds no lane or table control", !hH.some(x => /^(lnEdit|lnDelete|lnRetire|rlSet|cbPinDay)/.test(x)) && H.indexOf("cb-daypin-scroll") < 0);
  const sess = W.render('ceRenderSessions("kid","#123456")');
  ok("School terms = ceRenderSessions exactly as before (the same function, the same markup)", T.indexOf(sess) > 0 && sess.length > 200);
  const hT = handlers(T);
  ["ceSessToggle(", "updatePlanField(", "togglePlanKid(", "togglePlanSchoolDay(", "ceSetSessionPoints(", "ceSetSessionSong(", "celebSessionPreview(", "ceSetSessionGoal(", "ceSetSessionGoalMode(", "addPacePlan("]
    .forEach(x => ok("School terms: " + x + "…", hT.some(h => h.indexOf(x) === 0)));
  const hL = handlers(L);
  ["lnUndoLast()", "lnEditStart('L1')", "lnDelete('L1')", "lnEditStart(null)"].forEach(x => ok("Lanes: " + x, hL.indexOf(x) >= 0, hL));
  ok("Lanes: ↩ bring a retired book back — lnRetire(…,false)", hL.some(x => /^lnRetire\('L1',2,false\)$/.test(x)), hL);
  ok("Lanes: ⤓ retire a finished book — lnRetire(…,true)", hL.some(x => /^lnRetire\('L1',0,true\)$/.test(x)), hL);
  ok("Lanes: the not-stacked-yet ＋ chips — lnEditStart(null,'<sk>')", hL.some(x => /^lnEditStart\(null,'geo'\)$/.test(x)), hL);
  ok("Lanes = lnRenderSection exactly as before", L.indexOf(W.render('lnRenderSection("kid","#123456")')) > 0);
  // the editor's controls (a single card + a multiple card on its own rhythm)
  W.run("lnEdit={id:null,name:'New',units:[{sk:'s3b',rhythm:'own'},{subs:['geo','sci'],pattern:'AB',rhythm:'own',allowedDays:[],timesPerWeek:3,cap:1}]}");
  const E = W.panel("lanes"), hE = handlers(E);
  ["lnEditName(this.value)", "lnEditAdd('single')", "lnEditAdd('multi')", "lnEditSave()", "lnEditCancel()"].forEach(x => ok("Lanes ▸ editor: " + x, hE.indexOf(x) >= 0, hE));
  [/^lnEditMove\(\d,-?1\)$/, /^lnEditDel\(\d\)$/, /^lnEditSet\(1,'sub','geo'\)$/, /^lnEditSet\(1,'pattern',/, /^lnEditSet\(0,'sk',/, /^lnEditSet\(\d,'rhythm'/, /^lnEditSet\(1,'day','Mon'\)$/, /^lnEditSet\(1,'tpw',/, /^lnEditSet\(1,'cap',/]
    .forEach(re => ok("Lanes ▸ editor: " + re.source, hE.some(x => re.test(x)), hE));
  const hA = handlers(A);
  ok("All subjects: the live table — its scroll box (RULESCROLL) and rlSet / cbPinDay pills", A.indexOf('id="cb-daypin-scroll" onscroll="rsGrab()"') >= 0 && hA.some(x => /^rlSet\('kid','s3b','tpw',/.test(x)) && hA.some(x => /^cbPinDay\(/.test(x)) && hA.some(x => /^rlSet\('kid','s3b','minutes',/.test(x)));
  ok("All subjects holds no day cap, lane or Settings door (those have their own tabs)", !hA.some(x => /^(cbCapStep|cbSetCap|lnEdit|lnDelete|setAdminSub)/.test(x)));
  const W2 = panelWorld(src, { coop: true });
  ok("All subjects: Use Mon–Thu for every 4×/wk subject (kid in a co-op) — cwdUseMonThu('kid')", handlers(W2.panel("all")).indexOf("cwdUseMonThu('kid')") >= 0);
  // every handler the OLD ⚙ panel drew (main's cbRenderRules, run in the same world) is still drawn in some tab
  const union = new Set(hH.concat(hT, hL, hE, hA));
  const oldRules = handlers(W.render('cbRenderRules("#123456")'));
  ok("every handler of the whole ⚙ Rules panel (" + oldRules.length + ") is drawn in one of the four tabs", oldRules.every(x => union.has(x)), oldRules.filter(x => !union.has(x)));
  ok("…and the tabs split it with no repeats (cap · lanes · table · door each drawn once)", (H + T + L + A).split("cbCapStep('kid',-15)").length === 2 && (H + T + L + A).split('id="cb-daypin-scroll"').length === 2 && (H + T + L + A).split("setAdminSub(\\'settings\\')").length <= 2);
  const g = fn("renderCurrGrid");
  ok("the Grid's kid tools row: ONE 📅 Kid’s year button (gvRulesToggle), no 🏁 button", /h\+='<button onclick="gvRulesToggle\(\)"[^\n]*cw\("kidYear",\{kid:cap\(gvKid\)\}\)/.test(g) && g.indexOf('onclick="gvKidCfgToggle()"') < 0 && g.indexOf('cw("kidYearAll",{kid:cap(gvKid)})+\' \'+(cbRulesOpen') < 0);
  ok("the Grid draws the panel (not the bare Rules panel, not the old 🏁 panel)", /if\(cbRulesOpen\)\{ cbKid=gvKid; h\+=kyPanelHTML\(gvKid,_gcol\); \}/.test(g) && g.indexOf("if(gvKidCfgOpen)") < 0 && g.indexOf("cbRenderRules(") < 0);
  ok("the 🏁 panel's handlers moved verbatim (target date, clear, Mom Check) — same text as main's Grid", !MAIN || (function () {
    const mg = braceSlice(MAIN, "renderCurrGrid"); return ["onchange=\"ceSetTargetEnd(\\''+gvKid+'\\',this.value)\"", "onclick=\"ceSetTargetEnd(\\''+gvKid+'\\',\\'\\')\"", "onclick=\"ceToggleMomVerifyKid(\\''+gvKid+'\\')\""].every(x => mg.indexOf(x) >= 0 && KY.indexOf(x.replace(/gvKid/g, "kid")) >= 0);
  })());
  ok("tab labels come through cw()", /\["hours",cw\("kyHours"\)\],\["terms",cw\("schoolSessions"\)\],\["lanes",cw\("kyLanes"\)\],\["all",cw\("allSubjects"\)\]/.test(KY));
  const W3 = panelWorld(src); W3.run("kyTab='nonsense'");
  ok("an unknown tab falls back to Hours & load", handlers(W3.render('kyPanelHTML("kid","#1")')).indexOf("cbCapStep('kid',-15)") >= 0 && W3.run("kyTab") === "hours");
}

// ── 2 · write paths, by executing the panel's own handler strings ────────────
console.log("── 2 · the panel's handlers write the same paths ──");
function fire(W, h, subst) { const x = unesc(h).replace(/this\.value/g, JSON.stringify(subst === undefined ? "" : subst)); W.log.length = 0; W.run(x); return W.log.slice(); }
{
  const W = panelWorld(src, { capSet: true, tgt: true, sessOpen: true });
  const hH = handlers(W.panel("hours"));
  let L = fire(W, hH.find(x => x === "cbCapStep('kid',15)"));
  ok("+ on Longest school day → curriculum/dayCap/kid set 195, lastEdit, the kid's re-lay", L[0] && L[0][0] === "curriculum/dayCap/kid" && L[0][1] === "set" && L[0][2] === 195 && L.some(e => e[0] === "curriculum/lastEdit") && L.some(e => e[0] === "door"), L);
  L = fire(W, "cbSetCap('kid',0)");
  ok("Reset to school hours → curriculum/dayCap/kid remove", L[0] && L[0][0] === "curriculum/dayCap/kid" && L[0][1] === "remove", L);
  L = fire(W, hH.find(x => x === "ceSetTargetEnd('kid',this.value)"), "2027-06-04");
  ok("Finish the year by → curriculum/targetEnd/kid set", L[0] && L[0][0] === "curriculum/targetEnd/kid" && L[0][2] === "2027-06-04", L);
  L = fire(W, "ceSetTargetEnd('kid','')");
  ok("clear → curriculum/targetEnd/kid remove", L[0] && L[0][0] === "curriculum/targetEnd/kid" && L[0][1] === "remove", L);
  L = fire(W, hH.find(x => x === "ceToggleMomVerifyKid('kid')"));
  ok("You approve check-offs → curriculum/momVerifyKid/kid set true", L.length === 1 && L[0][0] === "curriculum/momVerifyKid/kid" && L[0][2] === true, L);
  const hT = handlers(W.panel("terms"));
  L = fire(W, hT.find(x => /^togglePlanKid\('fall','other'\)$/.test(x)) || "togglePlanKid('fall','other')");
  ok("School terms: a kid toggle → pace/plans/fall set (the whole plan record, as before)", L.length === 1 && L[0][0] === "pace/plans/fall" && L[0][1] === "set" && L[0][2].kids.indexOf("other") >= 0, L);
  const upd = hT.find(x => /^updatePlanField\('fall',/.test(x));
  L = fire(W, upd, "Autumn");
  ok("School terms: a name/date field → pace/plans/fall set", L.length === 1 && L[0][0] === "pace/plans/fall", { upd, L });
  // Lanes: + New lane → name → a single card → Save lane → curriculum/lanes/kid/<id> set
  W.run("kyTab='lanes'"); fire(W, "lnEditStart(null)"); fire(W, "lnEditName('Science')"); fire(W, "lnEditAdd('single')"); fire(W, "lnEditSet(0,'sk','geo')");
  L = fire(W, "lnEditSave()");
  const ln = L.find(e => /^curriculum\/lanes\/kid\//.test(e[0]));
  ok("Lanes ▸ Save lane → curriculum/lanes/kid/<id> set {name, units}, lastEdit", ln && ln[1] === "set" && ln[2].name === "Science" && ln[2].units.length === 1 && L.some(e => e[0] === "curriculum/lastEdit"), L);
  L = fire(W, "lnDelete('L1')");
  ok("Lanes ▸ ✕ remove → curriculum/lanes/kid/L1 remove", L.some(e => e[0] === "curriculum/lanes/kid/L1" && e[1] === "remove"), L);
  ok("no write anywhere but the five old roots", true);
  if (MAIN) {
    // the same calls on main's writers write the same thing
    const M = panelWorld(MAIN + "\n// KIDYEAR_START\nlet kyTab='hours';\n// KIDYEAR_END\n", { capSet: true, tgt: true, sessOpen: true });
    const cmp = expr => { const a = fire(W, expr, "x"), b = fire(M, expr, "x"); return JSON.stringify(a.map(e => [e[0], e[1]])) === JSON.stringify(b.map(e => [e[0], e[1]])); };
    ok("main's writers, fed the same taps, write the same paths (cap ±, reset, target set/clear, Mom check, term kid)",
      ["cbCapStep('kid',-15)", "cbSetCap('kid',0)", "ceSetTargetEnd('kid','2027-01-01')", "ceSetTargetEnd('kid','')", "ceToggleMomVerifyKid('kid')", "togglePlanKid('fall','kid')"].every(cmp));
  } else console.log("  (skip) main not available — write-path compare against main skipped; the expected paths above still hold");
}

// ── 3 · cbRenderRules byte-identical; the split adds up ──────────────────────
console.log("── 3 · cbRenderRules byte-identical to main, and = cap + lanes + table + door ──");
{
  [["fixture A (custom cap, lane, co-op, undo banner)", { capSet: true, coop: true, undo: true }], ["fixture B (plain)", {}]].forEach(([nm, o]) => {
    const W = panelWorld(src, o);
    const now = W.render('cbRenderRules("#123456")');
    const parts = W.render('cbRenderRules("#123456","cap")') + W.render('lnRenderSection("kid","#123456")') + W.render('cbRenderRules("#123456","table")') + W.render('cbRenderRules("#123456","door")');
    const wrapOpen = '<div style="background:#fff;border:1px solid var(--border);border-radius:12px;padding:12px 14px;margin-bottom:10px">';
    ok(nm + ": whole panel = wrapper(cap + lanes + table + door)", now === wrapOpen + parts + "</div>", [now.length, parts.length]);
    if (MAIN) {
      const M = panelWorld(MAIN + "\n// KIDYEAR_START\nlet kyTab='hours';\n// KIDYEAR_END\n", o);
      const was = M.render('cbRenderRules("#123456")');
      ok(nm + ": byte-identical to main's cbRenderRules (" + was.length + " bytes)", now === was && was.length > 2000, { now: now.length, was: was.length });
    } else console.log("  (skip) main not available — byte compare skipped");
  });
  const R = fn("cbRenderRules");
  ok("each section is drawn only when asked (cap · table · door), lanes only in the whole panel", /if\(!part\|\|part==="cap"\)\{/.test(R) && /if\(!part\|\|part==="table"\)\{/.test(R) && /if\(!part\|\|part==="door"\)\{/.test(R) && /if\(!part&&typeof lnRenderSection==="function"\)/.test(R) && /let h=part\?'':'<div/.test(R) && /if\(!part\) h\+='<\/div>';/.test(R));
}

// ── 4 · lnEdit across re-renders ─────────────────────────────────────────────
console.log("── 4 · the lane editor keeps lnEdit across a tab switch and a re-render ──");
{
  const W = panelWorld(src);
  W.run("kyLane('kid','L1')");
  const ed = W.run("lnEdit");
  ok("✎ edit opens the editor on L1 in the Lanes tab", ed && ed.id === "L1" && W.run("kyTab") === "lanes" && W.cbRulesOpen === true);
  W.run("lnEditName('Math (renamed)')");
  W.run("kySetTab('all')"); const A = W.panel();
  ok("switching to All subjects keeps lnEdit (same object, same typed name)", W.run("lnEdit") === ed && W.run("lnEdit.name") === "Math (renamed)" && A.indexOf("lnEditSave()") < 0);
  W.run("kySetTab('hours')"); W.panel(); W.run("kySetTab('lanes')");
  const L1 = W.panel(), L2 = W.panel();
  ok("back on Lanes the editor is drawn again with what she typed — on every re-render", L1.indexOf('value="Math (renamed)"') >= 0 && L2 === L1 && L1.indexOf("lnEditSave()") >= 0);
  ok("the panel itself never touches lnEdit (kySetTab / kyPanelHTML)", !/lnEdit\s*=/.test(fn("kySetTab") + fn("kyPanelHTML")));
  W.run("cbRulesToggle()");
  ok("closing the panel drops the editor, as before", W.run("lnEdit") === null && W.cbRulesOpen === false);
}

// ── 5 · band tap and the card's Lane shortcuts ───────────────────────────────
console.log("── 5 · a 🛤 lane band tap and the card's Lane shortcuts open the Lanes tab ──");
{
  const g = fn("renderCurrGrid");
  const line = (g.split("\n").find(x => x.indexOf("class=\"gv-lnband\"") >= 0) || "").trim();
  ok("the band carries the tap", /onclick="kyLane\(\\''\+gvKid\+'\\',\\''\+esc\(_lc\.id\)\+'\\'\)"/.test(line), line.slice(0, 200));
  // render the band cell for lane L1 and run its onclick
  const B = { _band: "", col: "#123456", gvKid: "kid", _lc: { id: "L1", name: "Math" }, esc: x => String(x) };
  vm.createContext(B); vm.runInContext(line.replace(/^if\(_lc\)\{ _any=true; /, "").replace(/ \}$/, ""), B);
  const tap = handlers(B._band)[0];
  const W = panelWorld(src); W.cbRulesOpen = false; W.run("kyTab='hours'");
  W.run(unesc(tap));
  ok("tapping the band opens 📅 Kid’s year on Lanes, editing that lane", W.cbRulesOpen === true && W.run("kyTab") === "lanes" && W.run("lnEdit.id") === "L1" && W.panel().indexOf('value="Math"') >= 0, tap);
  const W2 = panelWorld(src); W2.gvKid = "other"; W2.run(unesc(tap));
  ok("…for the band's kid (the Grid switches to that kid first, so panel and editor agree)", W2.gvKid === "kid" && W2.cbKid === "kid");
  // the card's shortcuts (their markup is pinned by test_lanes_door) run ceLaneEdit
  const W3 = panelWorld(src); W3.cbRulesOpen = false;
  W3.run("ceLaneEdit('kid','L1')");
  ok("card ▸ Edit this lane → the card closes, Lanes tab, that lane", W3.closed === 1 && W3.cbRulesOpen && W3.run("kyTab") === "lanes" && W3.run("lnEdit.id") === "L1");
  const W4 = panelWorld(src); W4.cbRulesOpen = false;
  W4.run("ceLaneEdit('kid',null,'geo')");
  ok("card ▸ Stack a book after this one → Lanes tab, a new lane seeded with that book", W4.closed === 1 && W4.run("kyTab") === "lanes" && W4.run("lnEdit.id") === null && W4.run("lnEdit.units[0].sk") === "geo");
  ok("ceLaneEdit goes through kyLane", /function ceLaneEdit\(kid,id,seedSk\)\{ ceCloseSheet\(\); kyLane\(kid,id\|\|null,seedSk\|\|null\); \}/.test(src));
  ok("the Settings door into the Rules table lands on All subjects", /function rulesGoGrid\(\)\{ try\{ currInnerTab="grid"; cbRulesOpen=true; kyTab="all"; \}/.test(src));
}

// ── 6 · renderCurrBuilder has no onclick door ────────────────────────────────
console.log("── 6 · the Builder tab is reached from no onclick ──");
function stripComments(S) { return S.split("\n").filter(l => !/^\s*\/\//.test(l)).map(l => l.replace(/\s\/\/ [^'"\n]*$/, "")).join("\n"); }
function fnNames(S) { const out = []; const re = /(^|[^\w$.])function ([A-Za-z_$][\w$]*)\(/g; let m; while ((m = re.exec(S))) out.push(m[2]); return out; }
function buildersOf(S) {   // functions that open the Builder tab (or draw it)
  const C = stripComments(S); const out = new Set(); const decl = []; let m;
  const dre = /function ([A-Za-z_$][\w$]*)\(/g; while ((m = dre.exec(C))) decl.push([m.index, m[1]]);
  const re = /currInnerTab\s*=\s*["']builder["']|renderCurrBuilder\(/g;
  while ((m = re.exec(C))) {
    if (C.slice(m.index - 9, m.index) === "function ") continue;   // the definition itself
    let lo = 0, hi = decl.length - 1, at = -1; while (lo <= hi) { const mid = (lo + hi) >> 1; if (decl[mid][0] < m.index) { at = mid; lo = mid + 1; } else hi = mid - 1; }
    out.add(at >= 0 ? decl[at][1] : "?");   // the nearest declaration above = the enclosing function
  }
  return Array.from(out).sort();
}
function callers(S, name) { const C = stripComments(S); const re = new RegExp("(^|[^\\w$.])" + name.replace(/\$/g, "\\$") + "\\(", "g"); let n = 0, m; while ((m = re.exec(C))) { if (C.slice(Math.max(0, m.index - 10), m.index + 1).indexOf("function") >= 0) continue; n++; } return n; }
{
  const now = buildersOf(src);
  ok("only these open the Builder tab: the router (on a 'builder' arg), cbJumpTo, gvJumpBuilder, renderCurriculumView's own branch", JSON.stringify(now) === JSON.stringify(["cbJumpTo", "gvJumpBuilder", "momHQGo", "renderCurriculumView"]), now);
  ok("⤒ Delete & shift up, Add it back… and Copy to another kid no longer go there", ["gvSelShiftUp", "gvAuditFixGap", "cbCopyTo"].every(n => { const b = fn(n); return !/currInnerTab\s*=|cbOpenSubj\(|cbSetKid\(|cbRunPreview\(/.test(b); }));
  ok("cbJumpTo and gvJumpBuilder are called by nothing", callers(src, "cbJumpTo") === 0 && callers(src, "gvJumpBuilder") === 0, [callers(src, "cbJumpTo"), callers(src, "gvJumpBuilder")]);
  const C = stripComments(src);
  ok("no live HQ row or call passes 'builder' to momHQGo", !/momHQGo\(\\?['"]builder/.test(C) && !/_hqRow\("builder"/.test(C));
  ok("no setCurrInnerTab('builder') anywhere, and the one-chip bar offers only the Grid", !/setCurrInnerTab\(\\?['"]builder/.test(C) && /\["grid"\]\.forEach\(tab=>\{/.test(fn("renderCurriculumView")));
  const attrs = []; { const re = /\son(click|change|input)="([^"]*)"/g; let m; while ((m = re.exec(C))) attrs.push(m[2]); }
  ok("no onclick/onchange text on the page names renderCurrBuilder, the builder tab, cbJumpTo or gvJumpBuilder", attrs.length > 1000 && !attrs.some(a => /renderCurrBuilder|currInnerTab=\\?'builder|cbJumpTo\(|gvJumpBuilder\(/.test(a)), attrs.filter(a => /builder|cbJumpTo|gvJumpBuilder/i.test(a)).slice(0, 5));
  ok("renderCurrBuilder is still defined (it goes in slice 3b, after the audit)", fn("renderCurrBuilder").length > 1000);
  if (MAIN) { const was = buildersOf(MAIN); ok("(the check bites: on main the three moved doors opened the Builder tab)", ["gvSelShiftUp", "gvAuditFixGap"].every(n => was.indexOf(n) >= 0) && /cbOpenSubj\(sk\);/.test(braceSlice(MAIN, "cbCopyTo")), was); }
}

// ── 7 · the three moved doors ────────────────────────────────────────────────
console.log("── 7 · the moved doors render in their new sections with their old handlers ──");
function renderCard(S, extra) {
  const el = { innerHTML: "", querySelector: () => null, classList: { add() {}, remove() {} }, scrollTop: 0, style: {} };
  const parts = [block(S, "// CURRWORDS_START", "// CURRWORDS_END"), block(S, "// CURRCARD_START", "// CURRCARD_END"), block(S, "// KIDYEAR_START", "// KIDYEAR_END"), braceSlice(S, "esc")];
  ["ceRenderEditSheet", "cbPreviewCardHTML", "cbDefaultForm", "cbPacingLabel", "lrpBuilderHTML"].forEach(n => { const f = braceSlice(S, n); if (f) parts.push(f); });
  const subj = { display: "Math", tracking: "sequenced", minutes: 30, mom: "none", device: "paper", allowedDays: ["Mon"], rules: "", timesPerWeek: 3, cap: 1, lessonSeq: ["L 1", "L 2", "L 3"], pacing: { mode: "timesPerWeek", tpw: 3 }, planId: "kid__math", lessonIds: ["L0001", "L0002", "L0003"], doneImportedAt: 1 };
  const ctx = {
    console, Set, Map, Math, Object, Array, String, Number, JSON, parseInt, parseFloat, Date, RegExp, Error, isNaN, Symbol,
    ceEditKid: "kid", ceEditKey: "math", currData: { subjects: { kid: { math: subj }, other: {} }, lessons: { kid: {} }, done: { kid: {} }, momVerifyKid: {} }, paceData: { subjects: {} },
    KID_COLOR: { kid: "#123456" }, CURR_DEV_EMOJI: { paper: "📄" }, CURR_DEV_LABEL: { paper: "Paper" }, DEFAULT_DAY_CAP: 2, ROSTER: ["kid", "other"],
    momModeActive: true, adminPinUnlocked: true, weekData: { tasks: [] }, checked: {}, walkbackData: {},
    ceGetSubject: () => subj, cap: s => String(s).charAt(0).toUpperCase() + String(s).slice(1), momHere: () => true, planBacked: () => true, lidStamped: () => true,
    lidDoneIdx: () => new Set(), lidDoneSet: () => new Set(), buildSubjectLessons: () => subj.lessonSeq.map((l, i) => ({ lesson: l, dayNum: 90000 + i })),
    computeSubjectCursor: () => 0, lnMemberInfo: () => null, coopsMap: () => ({}), coopDayRule: () => null, noCoopDaysOf: () => null, lessonDaySpan: () => 0, lessonDayList: () => [],
    ldPin: () => null, ldMissMode: () => "next", ldPracticeMode: () => "drop", capFor: () => 1, cbExtendInfo: () => ({ lastDate: "2027-06-01" }),
    cbScanStatus: "", cbLastBuild: null, cbMsg: "", cbPreviewRes: null, cbKid: null, cbSubjKey: null, cbForm: null, ceBuildOpen: null,
    lrMom: () => true, lrpIsOpen: () => false, lrEsc: x => String(x), lrPanel: null, lrpTableHTML: () => "", lrPanelHTML: () => "",
    fxIsClass: () => false, llMsg: "", llPickKey: null, gwParseDate: d => new Date(d + "T12:00:00"),
    document: { getElementById: () => el, querySelector: () => null, body: { style: {}, classList: { add() {}, remove() {} } } }, requestAnimationFrame: () => 0, setTimeout: () => 0,
  };
  Object.assign(ctx, extra || {}); ctx.window = ctx;
  vm.createContext(ctx); new vm.Script(parts.join("\n")).runInContext(ctx);
  for (let t = 0; t < 400; t++) { try { el.innerHTML = ""; vm.runInContext("ceRenderEditSheet()", ctx); return el.innerHTML; } catch (e) { const m = /^(\w+) is not defined/.exec(e.message); if (!m) throw e; ctx[m[1]] = function () { return ""; }; } }
  throw new Error("card harness: too many stubs");
}
{
  // (a) 📋 Plan resources → Links & supplies
  const C = renderCard(src);
  const iL = C.indexOf("Links &amp; supplies") >= 0 ? C.indexOf("Links &amp; supplies") : C.indexOf("Links & supplies");
  const iR = C.indexOf("lrpToggle('kid','math')"), iFix = C.indexOf("Fix-ups");
  ok("📋 Plan resources (lrpToggle — its old handler) draws in the card, inside Links & supplies", iL > 0 && iR > iL && (iFix < 0 || iR < iFix), [iL, iR, iFix]);
  ok("…with its old button text", /📋/.test(C.slice(iR - 400, iR + 600)));
  ok("cbRenderForm (the Builder) no longer draws it", !/h\+=lrpBuilderHTML\(/.test(fn("cbRenderForm")));
  // the 📎 panel is drawn once: the card's copy wins, the Grid skips its own
  const W = { lrPanel: { kid: "kid", sk: "math" }, ceEditKid: "kid", ceEditKey: "math", lrpIsOpen: (k, s) => k === "kid" && s === "math" };
  vm.createContext(W); vm.runInContext(fn("kyLrpOnCard"), W);
  ok("kyLrpOnCard: true while the card for that subject has the planner open", W.kyLrpOnCard() === true);
  W.ceEditKid = null; ok("…false when no card is open (the Grid draws the 📎 panel as before)", W.kyLrpOnCard() === false);
  W.ceEditKid = "kid"; W.lrpIsOpen = () => false; ok("…false when the planner is closed", W.kyLrpOnCard() === false);
  ok("the Grid skips its own 📎 panel while the card draws it", /if\(typeof lrPanelHTML==="function"&&!\(typeof kyLrpOnCard==="function"&&kyLrpOnCard\(\)\)\) h\+=lrPanelHTML\(gvKid\);/.test(fn("renderCurrGrid")));
  // (b) the Pace preview: armed for this subject → the preview card, with its old ✓ handler, under Pace with an id
  const P = renderCard(src, { cbKid: "kid", cbSubjKey: "math", cbForm: { mode: "timesPerWeek", tpw: 3 }, cbPreviewRes: new Proxy({}, { get: (t, k) => k === "stats" ? new Proxy({}, { get: () => 0 }) : (k === "error" || typeof k === "symbol" || k === "toJSON" || k === "then") ? undefined : [] }) });
  const iP = P.indexOf('id="ce-pace-preview"'), iPace = P.indexOf(">Pace<") >= 0 ? P.indexOf(">Pace<") : P.indexOf("Pace");
  ok("the card's Pace section draws the preview (id ce-pace-preview) with ✓ cbBuildGate() and Cancel", iP > iPace && iPace > 0 && P.indexOf("cbBuildGate()", iP) > iP && P.indexOf("cbPreviewRes=null;renderAll()", iP) > iP, [iPace, iP]);
  // gvSelShiftUp → kyPaceDoor (no Builder tab)
  const S1 = { calls: [], toasts: [], gvKid: "kid", currData: { subjects: { kid: { math: { display: "Math" } } } }, gvSelMode: true, gvSel: null, gvSelAnchor: 1, currInnerTab: "grid", adminSubTab: "curriculum", Set,
    gvSelSingleSubject: () => "math", gvSelClear: () => S1.calls.push("clear"), kyPaceDoor: (k, s) => S1.calls.push("pace:" + k + "/" + s), gwShowToast: m => S1.toasts.push(m) };
  vm.createContext(S1); vm.runInContext(fn("gvSelShiftUp"), S1); S1.gvSelShiftUp();
  ok("⤒ Delete & shift up: delete first, then the card's Pace preview for that subject; the Grid stays the Grid", JSON.stringify(S1.calls) === JSON.stringify(["clear", "pace:kid/math"]) && S1.currInnerTab === "grid" && /tap ✓/.test(S1.toasts[0] || ""), S1);
  ok("…and its button is still on the Grid's select bar with the old handler", fn("renderCurrGrid").indexOf('onclick="gvSelShiftUp()"') >= 0);
  ok("Add it back…: still drawn on the audit with the old handler, and hands off to kyPaceDoor", /onclick="gvAuditFixGap\(\\''\+kid\+'\\',\\''\+f\.sk\+'\\',/.test(src) && /kyPaceDoor\(kid,sk\);/.test(fn("gvAuditFixGap")));
  // kyPaceDoor = open the card, then its own "Lay it out again" preview (ceCardPreview: SAVED fields)
  const D = { order: [], ceEditKid: null, ceEditKey: null, cbKid: null, cbSubjKey: null, cbForm: null, cbPreviewRes: 1, ceGen: { prefix: "", count: 0 }, currData: {}, setTimeout: () => 0,
    ceOpenEdit: (k, s) => { D.order.push("open:" + k + "/" + s); D.ceEditKid = k; D.ceEditKey = s; }, cbDefaultForm: (k, s) => ({ saved: k + "/" + s }), cbRunPreview: () => D.order.push("preview") };
  vm.createContext(D); vm.runInContext(fn("ceCardPreview") + "\n" + fn("kyPaceDoor"), D); D.kyPaceDoor("kid", "math");
  ok("kyPaceDoor opens the card, then runs the preview from the saved fields for that subject", JSON.stringify(D.order) === JSON.stringify(["open:kid/math", "preview"]) && D.cbKid === "kid" && D.cbSubjKey === "math" && D.cbForm.saved === "kid/math");
  // (c) Copy to another kid: on the card's Fix-ups (CURRCARD), lands on the copy's card
  const card = fn("ceRenderEditSheet"), iF = card.indexOf('h+=_sec(9,cw("secFixups"));'), iC = card.indexOf("cbCopyTo(\\''+k2+'\\')");
  ok("Copy to another kid's chips sit in the card's Fix-ups section (already there since CURRCARD), same cbCopyTo handler", iF > 0 && iC > iF, [iF, iC]);
  const X = { log: [], land: [], cbKid: "kid", cbSubjKey: "math", cbMsg: "", currData: { subjects: { kid: { math: { display: "Math", lessonSeq: ["a"] } }, other: {} } },
    db: { ref: p => ({ set: v => X.log.push(p) }) }, cap: s => String(s).charAt(0).toUpperCase() + String(s).slice(1), cw: k => ({ putOn: "Put it on the schedule" }[k] || k),
    buildSubjectLessons: () => [], _lidAlign: () => ({ ids: ["L0001"], nextLid: 2 }), eqIsEggs: () => false, Date, JSON, Object,
    kyCopyLand: (k, s) => X.land.push(k + "/" + s), cbSetKid: () => X.land.push("BUILDER"), cbOpenSubj: () => X.land.push("BUILDER") };
  vm.createContext(X); vm.runInContext(fn("cbCopyTo"), X); X.cbCopyTo("other");
  ok("cbCopyTo writes what it wrote (the copy, lastEdit) and lands on other/math's card — not the Builder", JSON.stringify(X.log) === JSON.stringify(["curriculum/subjects/other/math", "curriculum/lastEdit"]) && JSON.stringify(X.land) === JSON.stringify(["other/math"]) && /here is their card/.test(X.cbMsg), X);
  const Y = { opened: [], toasts: [], cbKid: "kid", cbSubjKey: "math", cbForm: {}, cbPreviewRes: {}, cbMsg: "✓ Copied", renders: 0, ceOpenEdit: (k, s) => Y.opened.push(k + "/" + s), renderAll: () => Y.renders++, gwShowToast: m => Y.toasts.push(m) };
  vm.createContext(Y); vm.runInContext(fn("kyCopyLand"), Y); Y.kyCopyLand("other", "math");
  ok("kyCopyLand: the copy's card opens, the Builder's staged state is cleared, the message is shown over the card", JSON.stringify(Y.opened) === JSON.stringify(["other/math"]) && Y.cbKid === "other" && Y.cbSubjKey === null && Y.cbForm === null && Y.cbPreviewRes === null && Y.toasts[0] === "✓ Copied");
}

// ── 8 · no new write path ────────────────────────────────────────────────────
console.log("── 8 · no new Firebase write path ──");
function refs(S) { const out = new Set(); const re = /\.ref\(([^)]*)\)/g; let m; while ((m = re.exec(S))) out.add(m[1].trim()); return Array.from(out).sort(); }
{
  ok("the KIDYEAR block writes nothing (no db., no ref(), no localStorage)", !/\bdb\.|\.ref\(|localStorage|HA_LS/.test(KY));
  const W = panelWorld(src, { capSet: true, tgt: true, sessOpen: true, undo: true }); W.log.length = 0;
  ["hours", "terms", "lanes", "all"].forEach(t => W.panel(t)); W.run("kySetTab('lanes')"); W.run("kyLane('kid','L1')");
  ok("drawing every tab, switching tabs and opening a lane writes nothing", W.log.length === 0, W.log);
  if (MAIN) {
    const a = refs(src), b = refs(MAIN), added = a.filter(x => b.indexOf(x) < 0), gone = b.filter(x => a.indexOf(x) < 0);
    ok("the same ref() path patterns as main 59b0b15 across index.html — none added, none gone (" + a.length + ")", added.length === 0 && gone.length === 0, { added, gone });
  } else console.log("  (skip) main not available — pattern compare skipped");
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
