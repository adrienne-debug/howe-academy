/*
 * 🏫 DRILLCOOP — Mom-run practice cards stay off a "No Mom-required lessons" co-op day (her decision 2026-11-22 on the design's
 * co-op question, DESIGN_drill_rows_curriculum_2026-11-19.md Q6: "Leave them off"). The rule is the subjects' own test,
 * coopNoMomBaseFor(child, date) — Mom's one-date flip inside it — applied to the kinds retrSlotMom calls "required"
 * (Daily Drill, Sprint, Sprint Re-checks). Match & Play (the child's own) is still laid. Against code sliced out of index.html
 * (RETRWEEK with the DRILLCOOP block, GWRETR, SCHOOLEND, the ⏰ day-time readers, RETRLIVE, the co-op readers + coopToggleMomDay,
 * the Grid's Min column line, the brain-work strip), and against the same tree with the slice taken out again (stripCoop):
 *   0. stripCoop undoes the slice exactly; the touched code equals origin/main's (stripped the same way — still true merged);
 *      the block decides only through coopNoMomBaseFor × retrSlotMom and writes nothing
 *   1. REPLAY: no child on a ticked day (no co-op; box unticked; full-day co-op; other weeks; every date flipped; other family) →
 *      the builder and the live pass (plan changed mid-week, cards checked / claimed / Mom's part done) byte-identical, 1,000 cases
 *   2. ticked days: the builder == origin/main's with those kinds turned off in every row; Match & Play kept; other dates
 *      byte-identical; a sibling keeps the same cards (only a time can differ: Mom's lane is freer)
 *   3. Mom's one-date flip: the builder and the live pass bring the cards back for that date only; flipped back they go again
 *      (a checked one stays); coopToggleMomDay's run carries pass R only for this week's open dates
 *   4. the live pass: idempotent on a built week; a plan save == origin/main's with the ticked kinds off; held cards never leave;
 *      a week laid the old way loses exactly its open Mom-run cards on open ticked days at the next plan save
 *   5. the Grid's Min column == the minutes actually laid; the brain-work strip drops Sprint / Re-checks chips on a ticked day
 *   6. readers: retrDayKindsOn / retrCoopOff; retrDayKinds, the plan and the Curriculum lines untouched
 *   run:  node test_drill_coop.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm"), cp = require("child_process");

// ── stripCoop: the slice taken out again. The block (inside RETRWEEK) goes; every other edit is put back to its old text.
// [new text, old text] — exactly what the slice changed outside its block (each new text occurs exactly once).
const COOP_EDITS = [
  ["      // DRILLCOOP: minus the Mom-run kinds on a ticked \"No Mom-required lessons\" co-op day of this child (retrDayKindsOn).\n      const kinds=(typeof retrDayKindsOn===\"function\")?retrDayKindsOn(kid,dn.slice(0,3),dk)\n                  :(typeof retrDayKinds===\"function\")?retrDayKinds(kid,dn.slice(0,3))\n                  :[((retrWeek(kid)||{})[dn.slice(0,3)]||\"off\")];\n", "      const kinds=(typeof retrDayKinds===\"function\")?retrDayKinds(kid,dn.slice(0,3))\n                  :[((retrWeek(kid)||{})[dn.slice(0,3)]||\"off\")];\n"],
  ["// o = {dayISO(dn), todayISO, todayOpen, nowMin, win(dn,iso), kidOff(kid,dn), checked, claimed, on, kinds(dn3,iso)→[kind],", "// o = {dayISO(dn), todayISO, todayOpen, nowMin, win(dn,iso), kidOff(kid,dn), checked, claimed, on, kinds(dn3)→[kind],"],
  ["    const want=(o.on?(o.kinds(dn.slice(0,3),iso)||[]):[]).filter(k=>k&&k!==\"off\"&&RETR_SLOT_TITLE[k]);   // DRILLCOOP: the date too\n", "    const want=(o.on?(o.kinds(dn.slice(0,3))||[]):[]).filter(k=>k&&k!==\"off\"&&RETR_SLOT_TITLE[k]);\n"],
  ["    kinds:(dk,ds)=>((typeof retrDayKindsOn===\"function\")?retrDayKindsOn(kid,dk,ds):retrDayKinds(kid,dk)), minutes:", "    kinds:dk=>retrDayKinds(kid,dk), minutes:"],
  ["const _rks=((typeof retrDayKindsOn===\"function\")?retrDayKindsOn(gvKid,DOWS[d.getDay()].toLowerCase(),l.date):retrDayKinds(gvKid,DOWS[d.getDay()].toLowerCase())).filter(k=>typeof RETR_SLOT_TITLE!==\"undefined\"&&RETR_SLOT_TITLE[k]);", "const _rks=retrDayKinds(gvKid,DOWS[d.getDay()].toLowerCase()).filter(k=>typeof RETR_SLOT_TITLE!==\"undefined\"&&RETR_SLOT_TITLE[k]);"],
  ["retrievalMins=_rks.reduce((n,k)=>n+((typeof retrSlotMinutes===\"function\")?retrSlotMinutes(gvKid,k):15),0); }   // 🧠 RETRFAM: a ladder OR a saved rhythm · DRILLCOOP: not the Mom-run kinds on a ticked co-op day\n", "retrievalMins=_rks.reduce((n,k)=>n+((typeof retrSlotMinutes===\"function\")?retrSlotMinutes(gvKid,k):15),0); }   // 🧠 RETRFAM: a ladder OR a saved rhythm\n"],
  ["    const kinds=retrTodayKinds(kid).filter(k=>!(typeof retrCoopOff===\"function\"&&retrCoopOff(kid,(typeof calToday===\"function\")?calToday():today,k)));   // DRILLCOOP: no Mom-run chip on a ticked co-op day\n    const chip=(icon,label,done,view)=>", "    const kinds=retrTodayKinds(kid);\n    const chip=(icon,label,done,view)=>"],
  ["  // 🔁 RELAY3: one run through the door, chained, the banner line says what moved; Undo puts the flag and the cards back\n  // DRILLCOOP: + pass R (RETRLIVE) for the co-op children on the practice plan when ds is an open day of this week, so their\n  // Mom-run practice cards follow the flip like the subjects. Queued as its own \"retrieval\" reason: alone it is a practice-only\n  // run (nothing else is re-laid); with the subjects below the door merges both into ONE run (same label, same Undo path).\n  const _retr=(typeof retrCoopFlipKids===\"function\")?retrCoopFlipKids(ds,kids):[];\n  if(_retr.length&&typeof relayWeek===\"function\") relayWeek(\"retrieval\",{label:on?(\"👩 Mom's here \"+ds):(\"🏫 Co-op rule \"+ds),retr:_retr,undo:[on?{p:\"calendar/coopMomDays/\"+ds,gone:true}:{p:\"calendar/coopMomDays/\"+ds,was:true}]});\n", "  // 🔁 RELAY3: one run through the door, chained, the banner line says what moved; Undo puts the flag and the cards back\n"]
];
function stripCoop(s) {
  if (s.indexOf("DRILLCOOP") < 0) return s;   // a tree without the slice (origin/main before it is merged)
  const a = s.indexOf("// DRILLCOOP_START"), b = s.indexOf("// DRILLCOOP_END\n");
  if (a < 0 || b < a) throw new Error("DRILLCOOP block markers not found");
  s = s.slice(0, a) + s.slice(b + "// DRILLCOOP_END\n".length);
  COOP_EDITS.forEach(function (p) {
    const n = s.split(p[0]).length - 1;
    if (n !== 1) throw new Error("stripCoop: an edit is not there exactly once (" + n + "): " + p[0].slice(0, 80));
    s = s.replace(p[0], () => p[1]);
  });
  return s;
}
module.exports = { stripCoop };
if (require.main !== module) return;

const { stripPause } = require("./test_drill_pause.js");   // DRILLPAUSE (slice 5): this test pins its own slice on the tree with the pause taken out (both sides); test_drill_pause.js pins the pause
const src = stripPause(fs.readFileSync(path.join(__dirname, "index.html"), "utf8"));   // DRILLPAUSE
let pass = 0, fail = 0;
function ok(n, c, x) { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x).slice(0, 600) + ")" : "")); } }
function fnIn(S, name) { const i = S.indexOf("function " + name + "("); if (i < 0) throw new Error("not found " + name); let d = 0; for (let k = S.indexOf("{", i); k < S.length; k++) { if (S[k] === "{") d++; else if (S[k] === "}") { d--; if (!d) return S.slice(i, k + 1); } } throw new Error("unbalanced " + name); }
function sliceIn(S, a, b) { const i = S.indexOf(a), j = S.indexOf(b, i + 1); if (i < 0 || j < 0) throw new Error("marker " + a); return S.slice(i, j + b.length); }
const clone = x => JSON.parse(JSON.stringify(x));
const J = JSON.stringify;
const DEF_RE = /const RETR_WEEK_DEFAULT=\{[\s\S]*?\n\s*lincoln:\{[^}]*\}\};/;
const D3 = ["mon", "tue", "wed", "thu", "fri"], DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday"];
const WDAY_MAP = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const ISO = { monday: "2026-11-02", tuesday: "2026-11-03", wednesday: "2026-11-04", thursday: "2026-11-05", friday: "2026-11-06" };
const DT = { monday: "Nov 2", tuesday: "Nov 3", wednesday: "Nov 4", thursday: "Nov 5", friday: "Nov 6" };
const doy = d => Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 864e5);
const toMin = s => { const m = String(s || "").match(/(\d+):(\d+)\s*(AM|PM)/i); if (!m) return null; let h = +m[1] % 12; if (/pm/i.test(m[3])) h += 12; return h * 60 + +m[2]; };
const fromMin = mn => { let h = Math.floor(mn / 60), m = mn % 60, ap = h >= 12 ? "PM" : "AM"; h = h % 12; if (h === 0) h = 12; return h + ":" + String(m).padStart(2, "0") + " " + ap; };
function rng(seed) { let a = seed >>> 0; return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

const SRC0 = stripCoop(src);
let MAIN = ""; try { MAIN = cp.execSync("git show origin/main:index.html", { cwd: __dirname, encoding: "utf8", maxBuffer: 1 << 28, stdio: ["ignore", "pipe", "ignore"] }); } catch (e) { MAIN = ""; } MAIN = stripPause(MAIN);   // DRILLPAUSE: the same on origin/main's side

// ───────────────────────────────────────────────────────────────────────────────────────────────
console.log("0. the slice, and stripCoop undoing it exactly");
const BLOCK = sliceIn(src, "// DRILLCOOP_START", "// DRILLCOOP_END");
{
  ok("DRILLCOOP_START / _END once each, inside RETRWEEK, after retrTodayKinds", src.split("// DRILLCOOP_START").length === 2 && src.split("// DRILLCOOP_END").length === 2
    && src.indexOf("function retrTodayKinds(") < src.indexOf("// DRILLCOOP_START") && src.indexOf("// DRILLCOOP_END\n// RETRWEEK_END") > 0);
  ok("the block cites her decision, the date and the design", /Leave them off/.test(BLOCK) && /2026-11-22/.test(BLOCK) && /DESIGN_drill_rows_curriculum_2026-11-19\.md/.test(BLOCK));
  const code = BLOCK.replace(/^\s*\/\/.*$/gm, "");
  ok("one source of truth: the rule is coopNoMomBaseFor (the subjects' own no-Mom test, Mom's one-date flip inside it) × retrSlotMom — no co-op map, box or flip read of its own",
    /coopNoMomBaseFor\(kid,ds\)/.test(code) && /retrSlotMom\(kind\)==="required"/.test(code) && !/coopsMap|noMomBase\b|coopMomDays|coopMomDay\(|calendarData|_coopHasDate/.test(code));
  ok("…and never lists the kinds itself (no drill / sprint / recheck / match literal)", !/"(drill|sprint|recheck|match)"/.test(code));
  ok("a laying rule only: the block writes nothing (no db, no plan write, no retrievalPlan path)", !/db\.ref|drPlanWrite|drDaysWrite|retrievalPlan\/|\.set\(|\.update\(/.test(code));
  ok("no 🔀 anywhere in index.html", src.indexOf("\u{1F500}") < 0);
  ok("stripped: no trace left", !/DRILLCOOP|retrDayKindsOn|retrCoopOff|retrCoopFlipKids/.test(SRC0));
  if (MAIN) {
    const M0 = stripCoop(MAIN);
    const regions = [["// RETRWEEK_START", "// RETRWEEK_END"], ["// GWRETR_START", "// GWRETR_END"], ["// RETRLIVE_START", "// RETRLIVE_END"], ["// SCHOOLEND_START", "// SCHOOLEND_END"]];
    const diff = regions.filter(r => sliceIn(SRC0, r[0], r[1]) !== sliceIn(M0, r[0], r[1])).map(r => r[0]);
    ok("stripped, RETRWEEK / GWRETR / RETRLIVE / SCHOOLEND equal origin/main's (stripped the same way)", diff.length === 0, diff);
    const fns = ["coopToggleMomDay", "coopNoMomBaseFor", "coopBlocksBase", "retrSchedStripHtml", "renderCurrGrid", "relayWeek", "retrLiveQueue"];
    const fd = fns.filter(n => fnIn(SRC0, n) !== fnIn(M0, n));
    ok("stripped, " + fns.join(" / ") + " equal origin/main's", fd.length === 0, fd);
  } else console.log("  (origin/main not readable here — compare skipped)");
}

// ── the scheduler world: builder + slot finder + live pass + the co-op readers, from a given source ──
function schedCode(S) {
  return [sliceIn(S, "// RETRWEEK_START", "// RETRWEEK_END").replace(DEF_RE, "const RETR_WEEK_DEFAULT={};"),
    sliceIn(S, "// GWRETR_START", "// GWRETR_END"), sliceIn(S, "// SCHOOLEND_START", "// SCHOOLEND_END"),
    S.slice(S.indexOf("function dtSd("), S.indexOf("// ── what the day is")), sliceIn(S, "// RETRLIVE_START", "// RETRLIVE_END"),
    ["coopsMap", "_coopHasDate", "coopMomDay", "coopNoMomBaseFor", "coopTimedOn", "coopToggleMomDay", "coopTimedNameFor", "coopDayRule", "coopDaySkips", "coopBlocksBase", "calToday"].map(n => fnIn(S, n)).join("\n")].join("\n");
}
const LADDER = { k1: true, k2: true, k3: false };   // k3 has no sprint ladder → Drill + Match only (RETRFAM)
function schedEnv(S, nowIso) {
  const NOW = new Date(nowIso).getTime();
  class FD extends Date { constructor(...a) { if (!a.length) super(NOW); else super(...a); } static now() { return NOW; } }
  const env = {
    rulesData: { schoolDay: { defaultStart: "9:00 AM", defaultEnd: "4:00 PM", lunchStart: "12:00 PM", lunchEnd: "1:00 PM" } },
    masteryData: { retrievalPlan: {}, history: {} }, ROSTER: ["k1", "k2", "k3"],
    calendarData: { coops: {}, coopMomDays: {} },
    retrTracks: k => (LADDER[k] ? [{ key: "t" }] : []),
    MIN: { drill: 5, match: 10, sprint: 2, recheck: 3 },
    gwParseDate: s => new FD(s + "T12:00:00"),
    mlMomSpan: (t, s, d) => [s, s + (d == null ? (t.dur || 20) : d)],
    stIsoOk: s => /^\d{4}-\d{2}-\d{2}$/.test(String(s || "")), stDsOf: dn => ISO[dn] || null,
    _todayDay: null, DAY_DT: clone(DT), currData: { subjects: {} }, checked: {}, claimed: {},
    _rlwModeToday: () => "now",
    cap: s => String(s).charAt(0).toUpperCase() + String(s).slice(1),
    db: null, _dryRun: () => true, dbg: () => {}, toMin, fromMin, Date: FD, Math, Object, JSON, String, Number, Array, parseInt, parseFloat, isNaN, Set, Map, RegExp, console,
  };
  vm.createContext(env);
  new vm.Script(schedCode(S)).runInContext(env);
  env.retrSlotMinutes = (k, kind) => env.MIN[kind] || 15;   // the test's minutes, not the app's measured ones
  env._NOW = new FD();
  return env;
}
function build(env, plan, tasks, coop) {
  env.masteryData.retrievalPlan = clone(plan); env.calendarData = clone(coop || { coops: {}, coopMomDays: {} });
  const T = clone(tasks), dates = {};
  const sorted = DAYS.map(dn => { dates[dn] = "x"; return ISO[dn]; });
  env.gwInjectRetrieval(T, sorted, WDAY_MAP, new Set(), dates, doy);
  return T;
}
// the live pass through the APP's own context (retrLiveCtx: its kinds() is what the slice changes)
function live(env, plan, tasks, coop, held, kids) {
  env.masteryData.retrievalPlan = clone(plan); env.calendarData = clone(coop || { coops: {}, coopMomDays: {} });
  held = held || {}; env.checked = clone(held.checked || {}); env.claimed = clone(held.claimed || {});
  let T = clone(tasks); const out = [];
  (kids || env.ROSTER).forEach(kid => {
    const d = env.retrLiveDiff(kid, T, env.retrLiveCtx(kid));
    out.push(clone({ kid, upd: d.upd, added: d.added, removed: d.removed, retimed: d.retimed }));
    T = T.filter(t => d.removed.indexOf(t.id) < 0).map(t => { const r = d.retimed.find(x => x.id === t.id); return r ? Object.assign({}, t, { time: r.to }) : t; }).concat(clone(d.added));
  });
  return { diffs: out, tasks: T };
}
const KINDS = ["drill", "match", "sprint", "recheck"];
function randWeek(r, kids) {
  const T = []; let n = 0;
  kids.forEach(kid => DAYS.forEach(dn => {
    if (r() < 0.12) return;
    let t = toMin(["8:30 AM", "9:00 AM", "9:30 AM", "10:00 AM", "12:30 PM"][Math.floor(r() * 5)]);   // 12:30: home from a morning co-op
    if (r() < 0.6) { T.push({ id: kid + "_" + dn + "_mnb", who: kid, day: dn, time: fromMin(t), dur: 15, mom: "none", subjectKey: "morning_nb", title: "Morning Notebook", cascade: true }); t += 15; }
    const packed = r() < 0.25;
    const k = packed ? 9 + Math.floor(r() * 4) : 2 + Math.floor(r() * 7);
    for (let i = 0; i < k; i++) {
      t += packed ? 0 : [0, 0, 5, 10, 30][Math.floor(r() * 5)];
      if (t >= toMin("12:00 PM") && t < toMin("1:00 PM")) t = toMin("1:00 PM");
      const dur = [10, 15, 20, 25, 30, 45][Math.floor(r() * 6)];
      T.push({ id: kid + "_" + dn + "_" + (++n), who: kid, day: dn, time: fromMin(t), dur, mom: r() < 0.4 ? "required" : "none", subjectKey: "s" + Math.floor(r() * 6), title: "Card " + n, cascade: true });
      t += dur;
    }
    if (r() < 0.7) T.push({ id: kid + "_" + dn + "_cnb", who: kid, day: dn, time: fromMin(t), dur: 10, mom: "none", subjectKey: "closing_nb", title: "Closing Notebook", cascade: true });
  }));
  return T;
}
function randRow(r, pOn) { const w = {}; D3.forEach(d => { if (r() < pOn) w[d] = r() < 0.2 ? "off" : KINDS[Math.floor(r() * 4)]; }); return w; }
function randPlan(r, kids) {
  const p = {};
  kids.forEach(kid => {
    if (r() < 0.12) return;
    const e = { week: randRow(r, 0.9) };
    if (r() < 0.75) e.week2 = randRow(r, 0.7);
    if (r() < 0.4) e.week3 = randRow(r, 0.7);                         // three-a-day rows (DRILLTHREE)
    if (r() < 0.2) e.settings = { gate_pct: 80 };
    p[kid] = e;
  });
  return p;
}
const subset = (r, xs, p) => { const o = xs.filter(() => r() < p); return o.length ? o : [xs[Math.floor(r() * xs.length)]]; };
const WEEK_ISO = DAYS.map(dn => ISO[dn]);
// a co-op world where NO child is on a ticked no-Mom day this week (every shape that must change nothing)
function randCoopNone(r) {
  const c = { coops: {}, coopMomDays: {} }; const shapes = [];
  const pick = Math.floor(r() * 7);
  if (pick === 0) { shapes.push("no co-op at all"); return { c: { coops: {}, coopMomDays: {} }, shapes }; }
  const n = 1 + Math.floor(r() * 3);
  for (let i = 0; i < n; i++) {
    const s = (pick === 6) ? Math.floor(r() * 5) : pick - 1, id = "c" + i;
    if (s === 0) { c.coops[id] = { name: "Unticked", mode: "timed", noMomBase: false, kids: subset(r, ["k1", "k2", "k3"], .6), dates: subset(r, WEEK_ISO, .5) }; shapes.push("box unticked"); }
    else if (s === 1) { c.coops[id] = { name: "Field trip", mode: "fullDay", noMomBase: true, kids: subset(r, ["k1", "k2", "k3"], .6), dates: subset(r, WEEK_ISO, .5) }; shapes.push("full-day co-op"); }
    else if (s === 2) { c.coops[id] = { name: "Next week", mode: "timed", kids: subset(r, ["k1", "k2", "k3"], .6), dates: ["2026-11-09", "2026-11-12", "2026-10-29"] }; shapes.push("ticked, other weeks"); }
    else if (s === 3) { const ds = subset(r, WEEK_ISO, .5); c.coops[id] = { name: "Flipped", mode: "timed", noMomBase: true, kids: subset(r, ["k1", "k2", "k3"], .6), dates: ds }; ds.forEach(d => { c.coopMomDays[d] = true; }); shapes.push("ticked, every date flipped to Mom's here"); }
    else { c.coops[id] = { name: "Other family", mode: "timed", kids: ["zz"], dates: subset(r, WEEK_ISO, .5) }; shapes.push("ticked, none of these children"); }
  }
  return { c, shapes };
}
// a co-op world with ticked days (the natural ON: noMomBase missing or true), some dates flipped back
function randCoopTicked(r) {
  const c = { coops: {}, coopMomDays: {} };
  const n = 1 + Math.floor(r() * 2);
  for (let i = 0; i < n; i++) {
    const co = { name: "Co-op " + i, mode: "timed", start: "9:00 AM", end: "12:00 PM", kids: subset(r, ["k1", "k2", "k3"], .5), dates: subset(r, WEEK_ISO, .35) };
    if (r() < .5) co.noMomBase = true;                                 // missing = the natural ON
    c.coops["c" + i] = co;
  }
  if (r() < .3) c.coopMomDays[WEEK_ISO[Math.floor(r() * 5)]] = true;
  if (r() < .2) c.coops.u = { name: "Unticked", mode: "timed", noMomBase: false, kids: ["k1", "k2", "k3"], dates: subset(r, WEEK_ISO, .4) };
  return c;
}
const MOMRUN = (env, k) => env.retrSlotMom(k) === "required";
const blockedIn = (env, coop, kid, dn) => { env.calendarData = clone(coop); return !!env.coopNoMomBaseFor(kid, ISO[dn]); };
// the plan with the Mom-run kinds turned off on each child's ticked days — what the unchanged builder must then lay
function planMinus(env, P, coop) {
  const Q = clone(P);
  Object.keys(Q).forEach(kid => ["week", "week2", "week3"].forEach(row => {
    const w = Q[kid][row]; if (!w) return;
    D3.forEach((d3, i) => { if (w[d3] && w[d3] !== "off" && MOMRUN(env, w[d3]) && blockedIn(env, coop, kid, DAYS[i])) w[d3] = "off"; });
  }));
  return Q;
}
function randDay(env, r) {
  env.MIN = { drill: [5, 8, 10][Math.floor(r() * 3)], match: [10, 15][Math.floor(r() * 2)], sprint: 2, recheck: 3 };
  env.rulesData.schoolDay = Object.assign({}, env.rulesData.schoolDay, { defaultEnd: ["3:00 PM", "3:30 PM", "4:00 PM", "4:15 PM"][Math.floor(r() * 4)] });
}
function randHeld(r, T) {   // a few practice cards already checked / claimed / Mom's part done
  const h = { checked: {}, claimed: {} };
  T.forEach(t => { if (t.subjectKey !== "retrieval") return; const x = r(); if (x < .12) h.checked[t.id] = "10:00 AM"; else if (x < .18) h.claimed[t.id] = true; else if (x < .22) t.momPartDone = true; });
  return h;
}
const retr = T => T.filter(t => t.subjectKey === "retrieval");
const byId = T => T.slice().sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
const CLOCKS = [["2026-11-01T20:00:00", "before the week (Sunday evening)"], ["2026-11-04T11:47:00", "a running Wednesday, 11:47"]];
const openFrom = env => { const g = env._NOW.getDay(); return (g >= 1 && g <= 5) ? DAYS.slice(DAYS.indexOf(WDAY_MAP[g])) : DAYS; };

// ───────────────────────────────────────────────────────────────────────────────────────────────
console.log("1. REPLAY — no ticked co-op day for any child: the builder and the live pass are byte-identical to origin/main's");
{
  const N = 500;
  let total = 0;
  CLOCKS.forEach(function (c, ci) {
    const A = schedEnv(src, c[0]), B = schedEnv(SRC0, c[0]);
    let same = 0, liveSame = 0, cards = 0, momCards = 0, three = 0, noLad = 0, adds = 0, rems = 0, clean = 0; const shapes = {}; const bad = [];
    for (let i = 0; i < N; i++) {
      const r = rng(7000 * (ci + 1) + i), kids = ["k1", "k2", "k3"];
      const T = randWeek(r, kids), P = randPlan(r, kids), P2 = randPlan(r, kids), cw = randCoopNone(r);
      cw.shapes.forEach(s => { shapes[s] = (shapes[s] || 0) + 1; });
      if (kids.every(k => DAYS.every(dn => !blockedIn(A, cw.c, k, dn)))) clean++;
      const s1 = r(); randDay(A, rng(s1 * 1e9)); randDay(B, rng(s1 * 1e9));
      const a = build(A, P, T, cw.c), b = build(B, P, T, cw.c);
      if (J(a) === J(b)) same++; else bad.push(["build", i]);
      const ra = retr(a); cards += ra.length; momCards += ra.filter(t => t.mom === "required").length;
      if (Object.keys(P).some(k => P[k].week3)) three++; if (P.k3) noLad++;
      const held = randHeld(r, a);
      const la = live(A, P2, a, cw.c, held), lb = live(B, P2, a, cw.c, held);
      if (J(la.diffs) === J(lb.diffs)) liveSame++; else bad.push(["live", i]);
      la.diffs.forEach(d => { adds += d.added.length; rems += d.removed.length; });
    }
    total += N;
    ok(c[1] + ": " + N + " random weeks + co-op worlds, no child on a ticked day (checked: " + clean + "/" + N + ")", clean === N);
    ok(c[1] + ": builder output byte-identical (" + cards + " practice cards, " + momCards + " Mom-run; " + three + " plans with a third row, " + noLad + " with the no-ladder child)", same === N && momCards > 1000 && three > 100 && noLad > 300, bad.slice(0, 5));
    ok(c[1] + ": live pass (plan changed mid-week, some cards checked / claimed / Mom's part done) byte-identical (" + adds + " added, " + rems + " taken off)", liveSame === N && adds > 100 && rems > 100, bad.slice(0, 5));
    ok(c[1] + ": every no-change shape replayed — " + Object.keys(shapes).sort().map(k => k + " " + shapes[k]).join(", "), Object.keys(shapes).length === 6 && Object.values(shapes).every(v => v > 20));
  });
  ok("replay total: " + total + " cases (≥ 1,000)", total >= 1000);
}

// ───────────────────────────────────────────────────────────────────────────────────────────────
console.log("2. a ticked co-op day: the Mom-run kinds are left off for that child that day; Match & Play stays");
{
  const N = 300;
  CLOCKS.forEach(function (c, ci) {
    const A = schedEnv(src, c[0]), B = schedEnv(SRC0, c[0]);
    let eq = 0, offOk = 0, matchOk = 0, otherDays = 0, otherKids = 0, blockedDays = 0, gone = 0, kept = 0, rowDays = 0, shifted = 0, flipped = 0; const bad = [];
    for (let i = 0; i < N; i++) {
      const r = rng(31000 + 1000 * ci + i), kids = ["k1", "k2", "k3"];
      const T = randWeek(r, kids), P = randPlan(r, kids), coop = randCoopTicked(r);
      const s1 = r(); randDay(A, rng(s1 * 1e9)); randDay(B, rng(s1 * 1e9));
      const a = build(A, P, T, coop);
      // the whole output == the UNCHANGED builder laying the plan with those kinds turned off (row by row, rows 1–3)
      const b = build(B, planMinus(B, P, coop), T, coop);
      if (J(a) === J(b)) eq++; else bad.push(["eq", i]);
      const o = build(B, P, T, coop);                                  // origin/main: laid anyway
      const blk = {}; kids.forEach(k => DAYS.forEach(dn => { blk[k + dn] = blockedIn(A, coop, k, dn); }));
      Object.values(coop.coopMomDays).length && flipped++;
      let fOff = true, fMatch = true, fDays = true, fKids = true;
      kids.forEach(k => DAYS.forEach(dn => {
        const mine = retr(a).filter(t => t.who === k && t.day === dn), was = retr(o).filter(t => t.who === k && t.day === dn);
        if (blk[k + dn]) {
          blockedDays++;
          if (mine.some(t => MOMRUN(A, t.retrieval) || t.mom === "required")) fOff = false;
          if (J(mine.map(t => t.retrieval)) !== J(was.filter(t => !MOMRUN(A, t.retrieval)).map(t => t.retrieval))) fMatch = false;
          gone += was.length - mine.length; kept += mine.length;
          A.masteryData.retrievalPlan = clone(P); if (P[k] && A.retrDayKinds(k, dn.slice(0, 3)).filter(x => MOMRUN(A, x)).length > 1) rowDays++;
        } else if (!DAYS.some(d2 => d2 === dn && kids.some(k2 => blk[k2 + dn]))) {
          // a date no child is ticked on: that day's cards are byte-identical
          if (J(a.filter(t => t.day === dn)) !== J(o.filter(t => t.day === dn))) fDays = false;
        } else {
          // a child with no ticked day on a date a sibling is ticked: the same cards (ids, kinds, minutes); only a time can
          // differ — Mom's lane is freer, so the slot finder may seat it earlier
          const sig = L => J(byId(L).map(t => [t.id, t.retrieval, t.dur, t.mom]));
          if (sig(mine) !== sig(was)) { fKids = false; bad.push(["kids", i, k, dn]); }
          if (J(mine) !== J(was)) shifted++;
        }
      }));
      if (fOff) offOk++; else bad.push(["off", i]);
      if (fMatch) matchOk++; else bad.push(["match", i]);
      if (fDays) otherDays++; else bad.push(["days", i]);
      if (fKids) otherKids++; else bad.push(["kids", i]);
    }
    ok(c[1] + ": " + N + " plans × ticked co-op worlds — the builder == origin/main's builder with those kinds turned off, card for card", eq === N && blockedDays > 300, bad.filter(x => x[0] === "eq").slice(0, 5));
    ok(c[1] + ": no Daily Drill / Sprint / Re-checks card on a child's ticked day (" + blockedDays + " ticked child-days, " + gone + " cards left off)", offOk === N && gone > 100, bad.filter(x => x[0] === "off").slice(0, 5));
    ok(c[1] + ": Match & Play still laid there exactly as before (" + kept + " kept), three-a-day rows handled row by row (" + rowDays + " days with two or three Mom-run kinds)", matchOk === N && kept > 30 && rowDays > 30, bad.filter(x => x[0] === "match").slice(0, 5));
    ok(c[1] + ": a date no child is ticked on is byte-identical (every child)", otherDays === N, bad.filter(x => x[0] === "days").slice(0, 5));
    ok(c[1] + ": a child not ticked on a sibling's ticked date keeps the same cards; only a time may differ (" + shifted + " child-days)", otherKids === N, bad.filter(x => x[0] === "kids").slice(0, 5));
  });
  // a worked day, by hand: Wednesday co-op 9–12, ticked, rows Sprint / Daily Drill / Match & Play
  {
    const A = schedEnv(src, CLOCKS[0][0]);
    const T = [{ id: "c1", who: "k1", day: "wednesday", time: "12:30 PM", dur: 30, mom: "none", subjectKey: "s1", title: "A", cascade: true },
      { id: "c2", who: "k1", day: "wednesday", time: "1:00 PM", dur: 60, mom: "none", subjectKey: "s2", title: "B", cascade: true },
      { id: "c3", who: "k1", day: "wednesday", time: "2:00 PM", dur: 10, mom: "none", subjectKey: "closing_nb", title: "Closing Notebook", cascade: true },
      { id: "c4", who: "k1", day: "thursday", time: "1:00 PM", dur: 60, mom: "none", subjectKey: "s2", title: "B", cascade: true }];
    const P = { k1: { week: { wed: "sprint", thu: "sprint" }, week2: { wed: "drill", thu: "drill" }, week3: { wed: "match", thu: "match" } } };
    const coop = { coops: { a: { name: "Co-op", mode: "timed", start: "9:00 AM", end: "12:00 PM", kids: ["k1"], dates: ["2026-11-04"] } }, coopMomDays: {} };
    const a = build(A, P, T, coop), m = retr(a).map(t => [t.day.slice(0, 3), t.retrieval, t.time]);
    ok("worked Wednesday (ticked): only 🎯 Match & Play, right after the last card (2:00); Closing Notebook 2:10; Thursday keeps all three",
      J(m) === J([["wed", "match", "2:00 PM"], ["thu", "sprint", "2:00 PM"], ["thu", "drill", "2:02 PM"], ["thu", "match", "2:07 PM"]]) && a.find(t => t.id === "c3").time === "2:10 PM", { m, close: a.find(t => t.id === "c3").time });
    const f = build(A, P, T, Object.assign(clone(coop), { coopMomDays: { "2026-11-04": true } }));
    ok("worked Wednesday, Mom flips that date to \"Mom's here\": all three back, laid exactly as with no co-op", J(retr(f)) === J(retr(build(A, P, T, null))));
    const u = build(A, P, T, { coops: { a: Object.assign({}, coop.coops.a, { noMomBase: false }) }, coopMomDays: {} });
    ok("worked Wednesday, the co-op's box unticked: all three laid", J(retr(u)) === J(retr(build(A, P, T, null))));
    const o = build(A, P, T, { coops: { a: Object.assign({}, coop.coops.a, { kids: ["k2"] }) }, coopMomDays: {} });
    ok("worked Wednesday, the co-op is a sibling's: this child's three laid", J(retr(o)) === J(retr(build(A, P, T, null))));
    ok("the saved plan is untouched by a build", J(A.masteryData.retrievalPlan) === J(P));
  }
}

// ───────────────────────────────────────────────────────────────────────────────────────────────
console.log("3. Mom's one-date flip: the Mom-run cards come back for that date only");
{
  const N = 200;
  CLOCKS.forEach(function (c, ci) {
    const A = schedEnv(src, c[0]), B = schedEnv(SRC0, c[0]);
    const open = openFrom(A);
    let bOk = 0, lOk = 0, backOk = 0, kOk = 0, back = 0, off2 = 0, heldKept = 0; const bad = [];
    for (let i = 0; i < N; i++) {
      const r = rng(61000 + 1000 * ci + i), kids = ["k1", "k2", "k3"];
      const T = randWeek(r, kids), P = randPlan(r, kids), coop = randCoopTicked(r); coop.coopMomDays = {};
      const tick = kids.filter(k => DAYS.some(dn => blockedIn(A, coop, k, dn)));
      const X = DAYS.find(dn => kids.some(k => blockedIn(A, coop, k, dn))); if (!X) { bOk++; lOk++; backOk++; kOk++; continue; }
      const flip = Object.assign(clone(coop), { coopMomDays: { [ISO[X]]: true } });
      // builder: with the flip == origin/main's builder with only the OTHER ticked days turned off
      const a = build(A, P, T, flip), b = build(B, planMinus(B, P, flip), T, flip);
      if (J(a) === J(b)) bOk++; else bad.push(["build", i]);
      // live: the week as built before the flip, then the flip → only date X gains cards, exactly the Mom-run kinds the plan has there
      const w0 = build(A, P, T, coop);
      const flipKids = (A.calendarData = clone(flip), clone(A.retrCoopFlipKids(ISO[X], kids)));
      const wantKids = open.indexOf(X) >= 0 ? kids.filter(k => A.retrOn(k)) : [];   // retrOn: a ladder OR a saved rhythm (RETRFAM)
      if (J(flipKids) === J(wantKids)) kOk++; else bad.push(["kids", i, flipKids, wantKids]);
      const L = live(A, P, w0, flip, null, flipKids);
      const added = [].concat(...L.diffs.map(d => d.added)), removed = [].concat(...L.diffs.map(d => d.removed));
      const expect = retr(b).filter(t => t.day === X && open.indexOf(X) >= 0 && flipKids.indexOf(t.who) >= 0 && !w0.some(x => x.id === t.id)).map(t => t.id).sort();
      if (!removed.length && added.every(t => t.day === X && MOMRUN(A, t.retrieval)) && J(added.map(t => t.id).sort()) === J(expect)) lOk++; else bad.push(["live", i, added.map(t => t.id), expect, removed]);
      back += added.length;
      // flipped back to the co-op rule → those open cards come off again; a checked one stays
      const h = { checked: {}, claimed: {} }; if (added[0]) h.checked[added[0].id] = "1:00 PM";
      const L2 = live(A, P, L.tasks, coop, h, flipKids);
      const rem2 = [].concat(...L2.diffs.map(d => d.removed)).sort(), add2 = [].concat(...L2.diffs.map(d => d.added));
      const want2 = added.filter(t => !h.checked[t.id]).map(t => t.id).sort();
      if (J(rem2) === J(want2) && !add2.length && (!added[0] || L2.tasks.some(t => t.id === added[0].id))) backOk++; else bad.push(["back", i, rem2, want2]);
      off2 += rem2.length; if (added[0]) heldKept++;
    }
    ok(c[1] + ": " + N + " flips — the builder lays the flipped date's Mom-run cards, the other ticked dates stay clean", bOk === N, bad.filter(x => x[0] === "build").slice(0, 5));
    ok(c[1] + ": the flip re-lays this week's practice only for the co-op's children on the plan, only when the date is still open", kOk === N, bad.filter(x => x[0] === "kids").slice(0, 5));
    ok(c[1] + ": the live pass then adds exactly those cards, on that date only, nothing taken off (" + back + " back)", lOk === N && back > 40, bad.filter(x => x[0] === "live").slice(0, 3));
    ok(c[1] + ": flipped back → the open ones come off again (" + off2 + "), a checked one stays (" + heldKept + ")", backOk === N && heldKept > 20, bad.filter(x => x[0] === "back").slice(0, 3));
  });
  // coopToggleMomDay's wiring (Mom's tap): one run through the re-lay door, pass R listed
  {
    const A = schedEnv(src, CLOCKS[0][0]);
    const calls = [];
    A.momHere = () => true; A.relayWeek = (why, info) => calls.push([why, clone(info)]); A.gwShowToast = () => {}; A.renderAll = () => {};
    A.planBacked = (k, sk) => sk === "math"; A._rlwDailyOk = () => false;
    A.retrTracks = k => (k === "k1" ? [{ key: "t" }] : []);              // k1 a ladder, k3 a saved rhythm, k2 neither → not on the plan
    A.masteryData.retrievalPlan = { k3: { week: { wed: "drill" } } };
    const base = { coops: { a: { name: "Co-op", mode: "timed", kids: ["k1", "k2", "k3"], dates: ["2026-11-04", "2026-11-20"] } }, coopMomDays: {} };
    A.calendarData = clone(base); A.currData = { subjects: {} };
    let r = A.coopToggleMomDay("2026-11-04");
    ok("flip, no Mom-required subject to re-lay → a practice-only run (\"retrieval\": nothing else is re-laid) for the plan's children, with the flag's Undo",
      calls.length === 1 && calls[0][0] === "retrieval" && J(calls[0][1].retr) === J(["k1", "k3"]) && J(calls[0][1].undo) === J([{ p: "calendar/coopMomDays/2026-11-04", gone: true }]) && r.on === true, calls);
    calls.length = 0; A.currData = { subjects: { k2: { math: { mom: "required" } } } };
    r = A.coopToggleMomDay("2026-11-04");
    ok("flip back, with a Mom-required subject → \"retrieval\" (pass R) + the subjects' own \"coop-mom\" call, unchanged — the door merges them into one run",
      calls.length === 2 && calls[0][0] === "retrieval" && J(calls[0][1].retr) === J(["k1", "k3"]) && J(calls[0][1].undo) === J([{ p: "calendar/coopMomDays/2026-11-04", was: true }])
      && calls[1][0] === "coop-mom" && J(calls[1][1].subjects) === J([{ kid: "k2", sk: "math" }]) && calls[1][1].retr === undefined && calls[0][1].label === calls[1][1].label && r.on === false, calls);
    calls.length = 0; A.currData = { subjects: {} };
    A.coopToggleMomDay("2026-11-20");
    ok("a date outside this week → no practice re-lay (the builder reads the flag when that week is built) — and with no subject, no run at all, as before", calls.length === 0, calls);
    calls.length = 0; A.currData = { subjects: { k2: { math: { mom: "required" } } } };
    A.coopToggleMomDay("2026-11-20");
    ok("…with a subject: the subjects' run exactly as before", calls.length === 1 && calls[0][0] === "coop-mom" && calls[0][1].retr === undefined, calls);
    calls.length = 0; A.momHere = () => false;
    ok("not Mom → nothing (the flip's own gate)", A.coopToggleMomDay("2026-11-04") === null && !calls.length);
    const B0 = schedEnv(SRC0, CLOCKS[0][0]); const callsB = [];
    B0.momHere = () => true; B0.relayWeek = (why, info) => callsB.push([why, clone(info)]); B0.gwShowToast = () => {}; B0.renderAll = () => {}; B0.planBacked = (k, sk) => sk === "math"; B0._rlwDailyOk = () => false;
    B0.calendarData = clone(base); B0.currData = { subjects: { k2: { math: { mom: "required" } } } };
    A.momHere = () => true; A.calendarData = clone(base); calls.length = 0;
    A.masteryData.retrievalPlan = {}; B0.masteryData.retrievalPlan = {}; A.retrTracks = () => []; B0.retrTracks = () => [];
    A.coopToggleMomDay("2026-11-04"); B0.coopToggleMomDay("2026-11-04");
    ok("a family with no practice plan: the flip's run is origin/main's exactly", J(calls) === J(callsB) && calls.length === 1, [calls, callsB]);
  }
}

// ───────────────────────────────────────────────────────────────────────────────────────────────
// the re-lay door itself (relayWeek, unchanged): the flip's two calls land in ONE pending run; the banner says "taken off"
{
  const E = { setTimeout: () => 1, clearTimeout: () => {}, String, JSON, Object, Array, cap: s => String(s).toUpperCase(), Date, Math, dbg: () => {} };
  vm.createContext(E);
  vm.runInContext("let _rlwPend=null,_rlwTimer=null; const RLW_WAIT_MS=2000;\n" + fnIn(src, "relayWeek") + "\n" + fnIn(src, "_rlwRetrOnly") + "\n" + fnIn(src, "_rlwWords") + "\nthis.__pend=()=>_rlwPend; this.__reset=()=>{ _rlwPend=null; };", E);
  const u = [{ p: "calendar/coopMomDays/2026-11-04", was: true }];
  E.relayWeek("retrieval", { label: "🏫 Co-op rule 2026-11-04", retr: ["k1", "k3"], undo: clone(u) });
  E.relayWeek("coop-mom", { label: "🏫 Co-op rule 2026-11-04", subjects: [{ kid: "k2", sk: "math" }], undo: clone(u) });
  const p = E.__pend();
  ok("relayWeek: both calls → one pending run (reasons retrieval + coop-mom, one label, one Undo path, pass R + pass B), not a practice-only run",
    J(p.whys) === J(["retrieval", "coop-mom"]) && p.labels.length === 1 && J(p.undo) === J(u) && J(p.retr) === J(["k1", "k3"]) && J(p.subjects) === J([{ kid: "k2", sk: "math" }]) && E._rlwRetrOnly(p) === false, p);
  E.__reset(); E.relayWeek("retrieval", { label: "x", retr: ["k1"], undo: clone(u) });
  ok("relayWeek: the retrieval call alone → a practice-only run (nothing else re-laid)", E._rlwRetrOnly(E.__pend()) === true);
  const w = E._rlwWords({ label: "🏫 Co-op rule 2026-11-04", why: "retrieval,coop-mom", moves: [], removed: [{ id: "x", subjectKey: "retrieval", day: "wednesday" }] });
  ok("the banner line words a practice card the flip took off as \"taken off\", not \"to next week\" — " + w, /1 taken off/.test(w) && !/next week/.test(w), w);
}

console.log("4. the live pass (a plan saved mid-week; the cards already laid when this goes live)");
{
  const N = 200;
  CLOCKS.forEach(function (c, ci) {
    const A = schedEnv(src, c[0]), B = schedEnv(SRC0, c[0]);
    const open = openFrom(A);
    let idem = 0, eqOld = 0, clean = 0, heldOk = 0, legacy = 0, legacyN = 0, heldN = 0, adds = 0; const bad = [];
    for (let i = 0; i < N; i++) {
      const r = rng(81000 + 1000 * ci + i), kids = ["k1", "k2", "k3"];
      const T = randWeek(r, kids), P = randPlan(r, kids), P2 = randPlan(r, kids), coop = randCoopTicked(r);
      const s1 = r(); randDay(A, rng(s1 * 1e9)); randDay(B, rng(s1 * 1e9));
      const a = build(A, P, T, coop);
      // a week built with the rule is already what the live pass wants
      const L0 = live(A, P, a, coop);
      if (L0.diffs.every(d => !d.added.length && !d.removed.length && !d.retimed.length)) idem++; else bad.push(["idem", i]);
      // a plan saved mid-week: == origin/main's live pass with the ticked days' Mom-run kinds turned off in the new plan
      const held = randHeld(r, a);
      const L = live(A, P2, a, coop, held), Lb = live(B, planMinus(B, P2, coop), a, coop, held);
      if (J(L.diffs) === J(Lb.diffs)) eqOld++; else bad.push(["eq", i]);
      adds += [].concat(...L.diffs.map(d => d.added)).length;
      // the ticked days stay clean (open days), except a card that was held
      const isHeld = t => !!held.checked[t.id] || !!held.claimed[t.id] || !!t.momPartDone;
      if (retr(L.tasks).every(t => open.indexOf(t.day) < 0 || !blockedIn(A, coop, t.who, t.day) || !MOMRUN(A, t.retrieval) || isHeld(t))) clean++; else bad.push(["clean", i]);
      // nothing held ever leaves
      const H = retr(a).filter(isHeld); heldN += H.length;
      if (H.every(t => L.tasks.some(x => x.id === t.id))) heldOk++; else bad.push(["held", i]);
      // the week as origin/main built it (Mom-run cards laid on ticked days) + a plan save → exactly the open, unheld ones on
      // open ticked days come off; nothing is added or re-timed
      const o = build(B, P, T, coop), ho = randHeld(r, o);
      const Lo = live(A, P, o, coop, ho);
      const isH = t => !!ho.checked[t.id] || !!ho.claimed[t.id] || !!t.momPartDone;
      const want = retr(o).filter(t => open.indexOf(t.day) >= 0 && blockedIn(A, coop, t.who, t.day) && MOMRUN(A, t.retrieval) && !isH(t)).map(t => t.id).sort();
      const got = [].concat(...Lo.diffs.map(d => d.removed)).sort();
      if (J(got) === J(want) && Lo.diffs.every(d => !d.added.length && !d.retimed.length)) legacy++; else bad.push(["legacy", i, got, want]);
      legacyN += got.length;
    }
    ok(c[1] + ": " + N + " — a week built with the rule needs no live change", idem === N, bad.filter(x => x[0] === "idem").slice(0, 5));
    ok(c[1] + ": a plan saved mid-week == origin/main's live pass with the ticked days' Mom-run kinds off (" + adds + " added) — nothing allowed is stripped", eqOld === N && adds > 100, bad.filter(x => x[0] === "eq").slice(0, 5));
    ok(c[1] + ": after the save the ticked days hold no open Mom-run card", clean === N, bad.filter(x => x[0] === "clean").slice(0, 5));
    ok(c[1] + ": checked / claimed / Mom's-part-done cards never leave (" + heldN + ")", heldOk === N && heldN > 100, bad.filter(x => x[0] === "held").slice(0, 5));
    ok(c[1] + ": a week laid the old way: the first plan save takes off exactly the open, unheld Mom-run cards on open ticked days (" + legacyN + "), nothing else", legacy === N && legacyN > 50, bad.filter(x => x[0] === "legacy").slice(0, 3));
  });
}

// ───────────────────────────────────────────────────────────────────────────────────────────────
console.log("5. the Grid's Min column and the brain-work strip");
{
  // the Min column's practice line, run as written in renderCurrGrid
  const minFn = S => {
    const g = fnIn(S, "renderCurrGrid"), k = "    let retrievalMins=0;\n", i = g.indexOf(k), j = g.indexOf("\n", i + k.length);
    if (i < 0) throw new Error("Min column line not found");
    return "(function(gvKid,d,l,offReason,mapOff){ const DOWS=[\"Sun\",\"Mon\",\"Tue\",\"Wed\",\"Thu\",\"Fri\",\"Sat\"];\n" + g.slice(i, j + 1) + " return retrievalMins; })";
  };
  ok("the Min column reads the day's kinds through retrDayKindsOn with the row's date", /const _rks=\(\(typeof retrDayKindsOn==="function"\)\?retrDayKindsOn\(gvKid,DOWS\[d\.getDay\(\)\]\.toLowerCase\(\),l\.date\)/.test(fnIn(src, "renderCurrGrid")));
  const A = schedEnv(src, CLOCKS[0][0]), B = schedEnv(SRC0, CLOCKS[0][0]);
  const fa = vm.runInContext(minFn(src), A), fb = vm.runInContext(minFn(SRC0), B);
  let agree = 0, n = 0, ticked = 0, wasOver = 0, sameNo = 0, nNo = 0;
  for (let i = 0; i < 300; i++) {
    const r = rng(99000 + i), kids = ["k1", "k2", "k3"];
    const T = randWeek(r, kids), P = randPlan(r, kids), coop = i % 3 ? randCoopTicked(r) : randCoopNone(r).c;
    const a = build(A, P, T, coop); B.masteryData.retrievalPlan = clone(P); B.calendarData = clone(coop);
    kids.forEach(k => DAYS.forEach(dn => {
      if (!T.some(t => t.who === k && t.day === dn)) return;              // the builder lays nothing on a day the child has no cards
      n++;
      const laid = retr(a).filter(t => t.who === k && t.day === dn).reduce((s, t) => s + t.dur, 0);
      A.calendarData = clone(coop);
      const m = fa(k, new Date(ISO[dn] + "T12:00:00"), { date: ISO[dn] }, null, false), mb = fb(k, new Date(ISO[dn] + "T12:00:00"), { date: ISO[dn] }, null, false);
      if (m === laid) agree++;
      if (blockedIn(A, coop, k, dn)) { ticked++; if (mb > m) wasOver++; } else { nNo++; if (m === mb) sameNo++; }
    }));
  }
  ok("Min column == the minutes of the practice cards actually laid, every child-day (" + n + ", " + ticked + " of them ticked co-op days)", agree === n && ticked > 200, { agree, n });
  ok("…on " + wasOver + " ticked child-days origin/main's column counted cards that are now not laid", wasOver > 100);
  ok("…and on every day that is not ticked the column is origin/main's (" + nNo + ")", sameNo === nNo);

  // the brain-work strip (today's chips, derived from the plan when no practice card is laid today)
  const stripEnv = (S, coop) => {
    const E = schedEnv(S, "2026-11-04T09:30:00");
    Object.assign(E, { _todayDay: "wednesday", weekData: { tasks: [] }, esc: s => String(s), kidOffOwnDay: () => false, effectiveDay: t => t.day,
      retrEntries: () => [], retrTodayQueue: () => [], retrMatchSuggest: () => null, calendarData: clone(coop) });
    E.masteryData.retrievalPlan = { k1: { week: { wed: "sprint" }, week2: { wed: "match" }, week3: { wed: "recheck" } } };
    vm.runInContext(fnIn(S, "retrSchedStripHtml"), E);
    return E;
  };
  const tick = { coops: { a: { name: "Co-op", mode: "timed", kids: ["k1"], dates: ["2026-11-04"] } }, coopMomDays: {} };
  const chips = h => (h.match(/\u{1F3C3} [^<✓]*|\u{1F3AF} [^<✓]*|\u{1F0CF} [^<✓]*/gu) || []).map(s => s.trim());
  const sNo = stripEnv(src, { coops: {}, coopMomDays: {} }).retrSchedStripHtml("k1", "wednesday");
  const sTick = stripEnv(src, tick).retrSchedStripHtml("k1", "wednesday");
  const sFlip = stripEnv(src, Object.assign(clone(tick), { coopMomDays: { "2026-11-04": true } })).retrSchedStripHtml("k1", "wednesday");
  const sOld = stripEnv(SRC0, tick).retrSchedStripHtml("k1", "wednesday");
  ok("strip, no co-op: Daily Drill + Sprint + Match + Re-checks chips (as origin/main)", J(chips(sNo)) === J(["\u{1F0CF} Daily Drill", "\u{1F3C3} Sprint", "\u{1F3AF} Match", "\u{1F3C3} Re-checks"]) && sNo === stripEnv(SRC0, { coops: {}, coopMomDays: {} }).retrSchedStripHtml("k1", "wednesday"), chips(sNo));
  ok("strip, ticked co-op today: no Sprint / Re-checks chip; Match stays; the always-there Daily Drill chip unchanged", J(chips(sTick)) === J(["\u{1F0CF} Daily Drill", "\u{1F3AF} Match"]) && J(chips(sOld)) === J(chips(sNo)), chips(sTick));
  ok("strip, today flipped to Mom's here: as with no co-op", sFlip === sNo);
}

// ───────────────────────────────────────────────────────────────────────────────────────────────
console.log("6. readers stay one");
{
  const A = schedEnv(src, CLOCKS[0][0]);
  A.masteryData.retrievalPlan = { k1: { week: { mon: "sprint", tue: "match" }, week2: { mon: "drill", tue: "drill" }, week3: { mon: "match", tue: "recheck" } }, k3: { week: { mon: "sprint", tue: "drill" }, week2: { tue: "match" } } };
  A.calendarData = { coops: { a: { name: "Co-op", mode: "timed", kids: ["k1", "k3"], dates: ["2026-11-02"] } }, coopMomDays: {} };
  ok("retrDayKindsOn: ticked Monday → Match only; Tuesday untouched (rows 1–3, in order)", J(A.retrDayKindsOn("k1", "mon", "2026-11-02")) === J(["match"]) && J(A.retrDayKindsOn("k1", "tue", "2026-11-03")) === J(A.retrDayKindsOn("k1", "tue")) && J(A.retrDayKindsOn("k1", "tue")) === J(["match", "drill", "recheck"]));
  ok("retrDayKindsOn: no date = retrDayKinds exactly (RETRFAM's no-ladder rule kept)", J(A.retrDayKindsOn("k3", "mon")) === "[]" && J(A.retrDayKindsOn("k3", "tue")) === J(A.retrDayKinds("k3", "tue")));
  ok("retrCoopOff follows retrSlotMom: Match & Play never off; Daily Drill / Sprint / Re-checks off on the ticked date only",
    !A.retrCoopOff("k1", "2026-11-02", "match") && ["drill", "sprint", "recheck"].every(k => A.retrCoopOff("k1", "2026-11-02", k) && !A.retrCoopOff("k1", "2026-11-03", k) && !A.retrCoopOff("k2", "2026-11-02", k)));
  ok("retrDayKinds / retrTodayKinds / retrOn / the saved plan are unchanged (the rule is laying only)", fnIn(src, "retrDayKinds") === fnIn(SRC0, "retrDayKinds") && fnIn(src, "retrTodayKinds") === fnIn(SRC0, "retrTodayKinds") && fnIn(src, "retrOn") === fnIn(SRC0, "retrOn")
    && fnIn(src, "drPlanWrite") === fnIn(SRC0, "drPlanWrite"));
  ok("the Curriculum lines (drRows) and the day sheet wording are untouched", sliceIn(src, "// DRILLROWS_START", "// DRILLROWS_END") === sliceIn(SRC0, "// DRILLROWS_START", "// DRILLROWS_END")
    && sliceIn(src, "// DRILLDAYS_START", "// DRILLDAYS_END") === sliceIn(SRC0, "// DRILLDAYS_START", "// DRILLDAYS_END"));
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
