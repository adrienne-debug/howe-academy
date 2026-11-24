/*
 * ⏸ DRILLPAUSE — pause one kind of card practice, plain or with dates (her picks 2026-11-22 on the design's question 7,
 * DESIGN_drill_rows_curriculum_2026-11-19.md §3.6 / slice 5: "Pause with dates" and then "and a plain pause"). Stored as one
 * leaf, mastery/retrievalPlan/<kid>/pausedKinds/<kind> = true (until ▶ Resume) or {pauseFrom, resumeOn} (Family Time's two
 * leaves, Family Time's rule: pauseFrom ≤ date < resumeOn). The one laying reader, retrDayKindsOn, leaves a paused kind out
 * on that date; the week builder, the live pass, the Grid's Min column and the brain-work strip follow. Against code sliced
 * out of index.html, and against origin/main (or the same tree with the slice taken out again — stripPause):
 *   0. stripPause undoes the slice exactly (== origin/main); the reader block writes nothing; no dialogs
 *   1. REPLAY: nothing paused (and every pause shape that touches nothing this week) → the builder and the live pass are
 *      byte-identical to origin/main's, 1,000+ random plans × co-op worlds × two clocks
 *   2. plain pause: == origin/main laying the plan with that kind off for that child; other children keep their cards;
 *      Resume → the plan, the build and the live week come back
 *   3. dated pause: absent inside, present the day before and the day after; inside one week; across a week boundary;
 *      starting next week; random ranges == origin/main with the kind off on exactly those dates
 *   4. with DRILLCOOP: a co-op day inside and outside a pause
 *   5. the live pass: Pause mid-week → the open cards from today on leave, past days and held cards stay; Resume → back
 *   6. writes: Pause, dated Pause, Resume = one drPlanWrite each, exactly one path; refused dates, dry run, not Mom → nothing
 *   7. readers: the Curriculum line (greyed, ⏸ until when; upcoming shown as upcoming), the day sheet (lit days kept, HTML
 *      balanced, no duplicate ids, 44 px), DRILLADD (not offered again), the three-a-day slot, DRILLPOINT, the Min column,
 *      the brain-work strip
 *   run:  node test_drill_pause.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm"), cp = require("child_process");

// ── stripPause: the slice taken out again. Its two blocks go; every other edit is put back to its old text.
// [new text, old text] — exactly what the slice changed outside its blocks (each new text occurs exactly once).
const PAUSE_EDITS = [
  ["function retrDayKindsOn(kid,dk,ds){ return retrDayKinds(kid,dk).filter(function(k){ return !retrCoopOff(kid,ds,k)&&!(typeof retrPausedOn===\"function\"&&retrPausedOn(kid,ds,k)); }); }   // DRILLPAUSE: + a kind paused on that date\n", "function retrDayKindsOn(kid,dk,ds){ return retrDayKinds(kid,dk).filter(function(k){ return !retrCoopOff(kid,ds,k); }); }\n"],
  ["    const kinds=retrTodayKinds(kid).filter(k=>!(typeof retrCoopOff===\"function\"&&retrCoopOff(kid,(typeof calToday===\"function\")?calToday():today,k)));   // DRILLCOOP: no Mom-run chip on a ticked co-op day\n    const _dpKinds=kinds.filter(k=>!(typeof retrPausedOn===\"function\"&&retrPausedOn(kid,(typeof calToday===\"function\")?calToday():today,k)));   // DRILLPAUSE: no chip for a kind paused today\n", "    const kinds=retrTodayKinds(kid).filter(k=>!(typeof retrCoopOff===\"function\"&&retrCoopOff(kid,(typeof calToday===\"function\")?calToday():today,k)));   // DRILLCOOP: no Mom-run chip on a ticked co-op day\n"],
  ["    let chips=chip(\"\\u{1F0CF}\",\"Daily Drill\",drillDone,\"drill\");\n    _dpKinds.forEach(kind=>{   // DRILLPAUSE\n", "    let chips=chip(\"\\u{1F0CF}\",\"Daily Drill\",drillDone,\"drill\");\n    kinds.forEach(kind=>{\n"],
  ["  const _dpLeaf=Object.keys(payload).filter(function(k){ return k.indexOf(\"/\")>=0; });   // DRILLPAUSE: \"pausedKinds/<kind>\" = that one leaf (update() writes that path only)\n  if(_dpLeaf.some(function(k){ return !/^[^.#$\\[\\]\\/]+(\\/[^.#$\\[\\]\\/]+)+$/.test(k); })) return false;   // DRILLPAUSE: no empty or bad path part\n  const _dpFlat={}; Object.keys(payload).forEach(function(k){ if(k.indexOf(\"/\")<0) _dpFlat[k]=payload[k]; });   // DRILLPAUSE\n  masteryData.retrievalPlan[kid]=Object.assign({},masteryData.retrievalPlan[kid]||{},JSON.parse(JSON.stringify(_dpFlat)));   // update() keeps the kid's other keys — the mirror does too\n  _dpLeaf.forEach(function(k){ drPlanMirrorLeaf(masteryData.retrievalPlan[kid],k,payload[k]); });   // DRILLPAUSE\n", "  masteryData.retrievalPlan[kid]=Object.assign({},masteryData.retrievalPlan[kid]||{},JSON.parse(JSON.stringify(payload)));   // update() keeps the kid's other keys — the mirror does too\n"],
  ["// DRILLPAUSE: the mirror of one \"a/b\" leaf — copies on the way down (never edits a shared object), null removes it and any\n// parent it leaves empty (as the database does)\nfunction drPlanMirrorLeaf(obj,p,v){\n  const ks=p.split(\"/\"), path=[obj]; let o=obj;\n  for(let i=0;i<ks.length-1;i++){ o[ks[i]]=(o[ks[i]]&&typeof o[ks[i]]===\"object\")?Object.assign({},o[ks[i]]):{}; o=o[ks[i]]; path.push(o); }\n  if(v===null||v===undefined) delete o[ks[ks.length-1]]; else o[ks[ks.length-1]]=JSON.parse(JSON.stringify(v));\n  for(let i=ks.length-2;i>=0;i--){ if(Object.keys(path[i+1]).length) break; delete path[i][ks[i]]; }\n}\n// DRILLSAVE_END\n", "// DRILLSAVE_END\n"],
  ["      mom:((typeof retrSlotMom===\"function\")?retrSlotMom(r.kind):\"required\")===\"none\"?\"on their own\":\"with Mom\",\n      pause:(typeof drPauseState===\"function\")?drPauseWords(drPauseState(kid,r.kind)):\"\", paused:(typeof drPauseState===\"function\")&&!!(drPauseState(kid,r.kind)||{}).now};   // DRILLPAUSE\n  });\n}\n", "      mom:((typeof retrSlotMom===\"function\")?retrSlotMom(r.kind):\"required\")===\"none\"?\"on their own\":\"with Mom\"};\n  });\n}\n"],
  ["  return r.title+\" · \"+r.dayText+(r.min!=null?\" · \"+r.min+\" min\":\"\")+\" · \"+r.mom+(r.pause?\" · \"+r.pause:\"\")+\" →\";   // DRILLPAUSE: + \"⏸ paused until Jan 3\"\n", "  return r.title+\" · \"+r.dayText+(r.min!=null?\" · \"+r.min+\" min\":\"\")+\" · \"+r.mom+\" →\";\n"],
  ["style=\"'+base+'border:1px solid #c4b5fd;color:'+((r.ok&&!r.paused)?'#6d28d9':'#9ca3af')+'\">'+esc(drLineText(r,name))+'</button>';   // DRILLPAUSE: greyed while paused\n", "style=\"'+base+'border:1px solid #c4b5fd;color:'+(r.ok?'#6d28d9':'#9ca3af')+'\">'+esc(drLineText(r,name))+'</button>';\n"],
  ["  h+='<div style=\"margin-top:12px;font-size:12px;font-weight:700;color:#6d28d9\">'+(min!=null?min+' min · ':'')+mom+'</div>';\n  if(typeof drPauseSheetHtml===\"function\"&&typeof drPauseState===\"function\") h+=drPauseSheetHtml(kid,kind);   // DRILLPAUSE: ⏸ Pause · Pause from / Resume on · ▶ Resume\n", "  h+='<div style=\"margin-top:12px;font-size:12px;font-weight:700;color:#6d28d9\">'+(min!=null?min+' min · ':'')+mom+'</div>';\n"],
  ["  if(drDaysKid!==kid||drDaysKind!==kind) drDaysSaved=null;\n  drDaysKid=kid; drDaysKind=kind; drDaysFull=null; drPauseMsg=\"\";   // DRILLPAUSE\n", "  if(drDaysKid!==kid||drDaysKind!==kind) drDaysSaved=null;\n  drDaysKid=kid; drDaysKind=kind; drDaysFull=null;\n"],
  ["  drDaysKid=null; drDaysKind=null; drDaysFull=null; drDaysSaved=null; drPauseMsg=\"\";   // DRILLPAUSE\n", "  drDaysKid=null; drDaysKind=null; drDaysFull=null; drDaysSaved=null;\n"]
];
function stripPause(s) {
  if (s.indexOf("DRILLPAUSE") < 0) return s;   // a tree without the slice (origin/main before it is merged)
  [["// DRILLPAUSE_START", "// DRILLPAUSE_END\n"], ["// DRILLPAUSESHEET_START", "// DRILLPAUSESHEET_END\n"]].forEach(function (m) {
    const a = s.indexOf(m[0]), b = s.indexOf(m[1]);
    if (a < 0 || b < a || s.split(m[0]).length !== 2) throw new Error("stripPause: block markers " + m[0]);
    s = s.slice(0, a) + s.slice(b + m[1].length);
  });
  PAUSE_EDITS.forEach(function (p) {
    const n = s.split(p[0]).length - 1;
    if (n !== 1) throw new Error("stripPause: an edit is not there exactly once (" + n + "): " + p[0].slice(0, 80));
    s = s.replace(p[0], () => p[1]);
  });
  return s;
}
module.exports = { stripPause };
if (require.main !== module) return;

const { stripSwitch } = require("./test_drill_switch.js");   // DRILLSWITCH (slice 7): its door / strip / paper-drill lines and its block are taken out on both sides (test_drill_switch.js pins them)
const src = stripSwitch(fs.readFileSync(path.join(__dirname, "index.html"), "utf8"));   // DRILLSWITCH
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

let MAIN = ""; try { MAIN = cp.execSync("git show origin/main:index.html", { cwd: __dirname, encoding: "utf8", maxBuffer: 1 << 28, stdio: ["ignore", "pipe", "ignore"] }); } catch (e) { MAIN = ""; } MAIN = stripSwitch(MAIN);   // DRILLSWITCH: the same on origin/main's side
const OLD = stripPause(MAIN || src);   // origin/main (as-if-merged: the merged tree with the slice taken out again)
// the tree this branch was cut from (origin/main can move on with unrelated work while the branch waits)
let BASE = ""; try { const mb = cp.execSync("git merge-base HEAD origin/main", { cwd: __dirname, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim(); BASE = stripPause(stripSwitch(cp.execSync("git show " + mb + ":index.html", { cwd: __dirname, encoding: "utf8", maxBuffer: 1 << 28, stdio: ["ignore", "pipe", "ignore"] }))); } catch (e) { BASE = ""; }   // DRILLSWITCH

// ───────────────────────────────────────────────────────────────────────────────────────────────
console.log("0. the slice, and stripPause undoing it exactly");
const BLOCK = sliceIn(src, "// DRILLPAUSE_START", "// DRILLPAUSE_END"), SHEET = sliceIn(src, "// DRILLPAUSESHEET_START", "// DRILLPAUSESHEET_END");
{
  ok("DRILLPAUSE_START / _END once each, inside RETRWEEK after DRILLCOOP; DRILLPAUSESHEET inside DRILLDAYS",
    src.split("// DRILLPAUSE_START").length === 2 && src.split("// DRILLPAUSE_END").length === 2 && src.indexOf("// DRILLCOOP_END\n// DRILLPAUSE_START") > 0
    && src.indexOf("// DRILLPAUSE_END\n// RETRWEEK_END") > 0 && src.indexOf("// DRILLPAUSESHEET_END\n// DRILLDAYS_END") > 0);
  ok("the block cites her two picks, the date and the design", /Pause with dates/.test(BLOCK) && /and a plain pause/.test(BLOCK) && /2026-11-22/.test(BLOCK) && /DESIGN_drill_rows_curriculum_2026-11-19\.md/.test(BLOCK));
  const code = BLOCK.replace(/^\s*\/\/.*$/gm, "");
  ok("the reader block writes nothing (no db, no plan write, no set / update)", !/db\.ref|drPlanWrite|drDaysWrite|\.set\(|\.update\(/.test(code));
  const scode = SHEET.replace(/^\s*\/\/.*$/gm, "");
  ok("the sheet writes only through drPlanWrite (no db of its own), Mom only, and never a dialog", !/db\.ref|\.set\(|\.update\(/.test(scode) && (scode.match(/drPlanWrite\(/g) || []).length === 1 && /_drMom\(\)/.test(scode) && !/confirm\(|alert\(|prompt\(/.test(scode + code));
  ok("no 🔀 anywhere in index.html", src.indexOf("\u{1F500}") < 0);
  ok("stripped: no trace left", !/DRILLPAUSE|retrPausedOn|retrPauseOf|drPause|pausedKinds|drPlanMirrorLeaf|_dpKinds|_dpLeaf/.test(stripPause(src)));
  if (BASE) ok("stripped == the tree the branch grew from, byte for byte (merged: the merged tree stripped the same way)", stripPause(src) === BASE);
  if (MAIN) {
    const S0 = stripPause(src);
    const regions = [["// RETRWEEK_START", "// RETRWEEK_END"], ["// GWRETR_START", "// GWRETR_END"], ["// RETRLIVE_START", "// RETRLIVE_END"], ["// SCHOOLEND_START", "// SCHOOLEND_END"],
      ["// DRILLROWS_START", "// DRILLROWS_END"], ["// DRILLDAYS_START", "// DRILLDAYS_END"], ["// DRILLADD_START", "// DRILLADD_END"], ["// DRILLSAVE_START", "// DRILLSAVE_END"], ["// DRILLPOINT_START", "// DRILLPOINT_END"]];
    const diff = regions.filter(r => sliceIn(S0, r[0], r[1]) !== sliceIn(OLD, r[0], r[1])).map(r => r[0]);
    const fns = ["retrSchedStripHtml", "renderCurrGrid", "relayWeek", "coopNoMomBaseFor"].filter(n => fnIn(S0, n) !== fnIn(OLD, n));
    ok("stripped, every touched region equals origin/main's (RETRWEEK, GWRETR, RETRLIVE, SCHOOLEND, the drill blocks, the strip, the Grid, the door)", diff.length === 0 && fns.length === 0, diff.concat(fns));
  } else console.log("  (origin/main not readable here — compare skipped)");
}

// ── the scheduler world: builder + slot finder + live pass + the co-op readers, from a given source (test_drill_coop's) ──
function schedCode(S) {
  return [sliceIn(S, "// RETRWEEK_START", "// RETRWEEK_END").replace(DEF_RE, "const RETR_WEEK_DEFAULT={};"),
    sliceIn(S, "// GWRETR_START", "// GWRETR_END"), sliceIn(S, "// SCHOOLEND_START", "// SCHOOLEND_END"),
    S.slice(S.indexOf("function dtSd("), S.indexOf("// ── what the day is")), sliceIn(S, "// RETRLIVE_START", "// RETRLIVE_END"),
    ["coopsMap", "_coopHasDate", "coopMomDay", "coopNoMomBaseFor", "coopTimedOn", "coopTimedNameFor", "coopDayRule", "coopDaySkips", "coopBlocksBase", "calToday"].map(n => fnIn(S, n)).join("\n")].join("\n");
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
    let t = toMin(["8:30 AM", "9:00 AM", "9:30 AM", "10:00 AM", "12:30 PM"][Math.floor(r() * 5)]);
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
    if (r() < 0.4) e.week3 = randRow(r, 0.7);
    if (r() < 0.2) e.settings = { gate_pct: 80 };
    p[kid] = e;
  });
  return p;
}
const subset = (r, xs, p) => { const o = xs.filter(() => r() < p); return o.length ? o : [xs[Math.floor(r() * xs.length)]]; };
const WEEK_ISO = DAYS.map(dn => ISO[dn]);
function randCoop(r) {   // none / unticked / ticked (the natural ON) / a date flipped back — every co-op shape
  const c = { coops: {}, coopMomDays: {} }; const x = r();
  if (x < 0.3) return c;
  const n = 1 + Math.floor(r() * 2);
  for (let i = 0; i < n; i++) {
    const co = { name: "Co-op " + i, mode: "timed", start: "9:00 AM", end: "12:00 PM", kids: subset(r, ["k1", "k2", "k3"], .5), dates: subset(r, WEEK_ISO, .35) };
    if (r() < .3) co.noMomBase = false; else if (r() < .5) co.noMomBase = true;
    c.coops["c" + i] = co;
  }
  if (r() < .3) c.coopMomDays[WEEK_ISO[Math.floor(r() * 5)]] = true;
  return c;
}
// pause shapes that touch NOTHING this week (Nov 2–6): must replay byte-identical
const AROUND = ["2026-10-26", "2026-10-30", "2026-11-01", "2026-11-02", "2026-11-07", "2026-11-09", "2026-11-23"];
function randPauseNone(r, P) {
  const shapes = [];
  Object.keys(P).forEach(kid => {
    const x = r();
    if (x < 0.25) return;
    if (x < 0.35) { P[kid].pausedKinds = {}; shapes.push("empty pausedKinds"); return; }
    const k = KINDS[Math.floor(r() * 4)], pk = {};
    const y = r();
    if (y < 0.3) { pk[k] = { pauseFrom: ["2026-10-19", "2026-10-26"][Math.floor(r() * 2)], resumeOn: ["2026-10-30", "2026-11-01", "2026-11-02"][Math.floor(r() * 3)] }; shapes.push("over before the week"); }
    else if (y < 0.6) { pk[k] = { pauseFrom: ["2026-11-07", "2026-11-09", "2026-12-01"][Math.floor(r() * 3)], resumeOn: "2027-01-04" }; shapes.push("starts after the week"); }
    else if (y < 0.8) { pk[k] = { pauseFrom: "2026-11-09" }; shapes.push("from next week, no end"); }
    else { pk[k] = [false, null, "x", 0][Math.floor(r() * 4)]; shapes.push("a value that is not a pause"); }
    P[kid].pausedKinds = pk;
  });
  return shapes;
}
// the test's own rule (Family Time's): true / an object with no good date → every date; else pauseFrom ≤ ds < resumeOn
const isoOk = s => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
function pausedRef(P, kid, kind, ds) {
  const v = ((P[kid] || {}).pausedKinds || {})[kind];
  if (v === true) return true;
  if (!v || typeof v !== "object") return false;
  const f = isoOk(v.pauseFrom) ? v.pauseFrom : null, b = isoOk(v.resumeOn) ? v.resumeOn : null;
  if (!f && !b) return true;
  return (!f || ds >= f) && (!b || ds < b);
}
const MOMRUN = (env, k) => env.retrSlotMom(k) === "required";
const blockedIn = (env, coop, kid, dn) => { env.calendarData = clone(coop); return !!env.coopNoMomBaseFor(kid, ISO[dn]); };
// the plan origin/main must lay: every row's kind turned off for a child-day where off(kid, dn, kind)
function planOff(P, off) {
  const Q = clone(P);
  Object.keys(Q).forEach(kid => ["week", "week2", "week3"].forEach(row => {
    const w = Q[kid][row]; if (!w) return;
    D3.forEach((d3, i) => { if (w[d3] && w[d3] !== "off" && off(kid, DAYS[i], w[d3])) w[d3] = "off"; });
  }));
  return Q;
}
function randDay(env, r) {
  env.MIN = { drill: [5, 8, 10][Math.floor(r() * 3)], match: [10, 15][Math.floor(r() * 2)], sprint: 2, recheck: 3 };
  env.rulesData.schoolDay = Object.assign({}, env.rulesData.schoolDay, { defaultEnd: ["3:00 PM", "3:30 PM", "4:00 PM", "4:15 PM"][Math.floor(r() * 4)] });
}
function randHeld(r, T) {
  const h = { checked: {}, claimed: {} };
  T.forEach(t => { if (t.subjectKey !== "retrieval") return; const x = r(); if (x < .12) h.checked[t.id] = "10:00 AM"; else if (x < .18) h.claimed[t.id] = true; else if (x < .22) t.momPartDone = true; });
  return h;
}
const retr = T => T.filter(t => t.subjectKey === "retrieval");
const sig = L => J(L.slice().sort((a, b) => (a.id < b.id ? -1 : 1)).map(t => [t.id, t.retrieval, t.dur, t.mom]));
const CLOCKS = [["2026-11-01T20:00:00", "before the week (Sunday evening)"], ["2026-11-04T11:47:00", "a running Wednesday, 11:47"]];
const openFrom = env => { const g = env._NOW.getDay(); return (g >= 1 && g <= 5) ? DAYS.slice(DAYS.indexOf(WDAY_MAP[g])) : DAYS; };

// ───────────────────────────────────────────────────────────────────────────────────────────────
console.log("1. REPLAY — nothing paused this week: the builder and the live pass are byte-identical to origin/main's");
{
  const N = 550; let total = 0;
  CLOCKS.forEach(function (c, ci) {
    const A = schedEnv(src, c[0]), B = schedEnv(OLD, c[0]);
    let same = 0, liveSame = 0, cards = 0, adds = 0, rems = 0, coopTicked = 0, three = 0; const shapes = {}; const bad = [];
    for (let i = 0; i < N; i++) {
      const r = rng(5100 * (ci + 1) + i), kids = ["k1", "k2", "k3"];
      const T = randWeek(r, kids), P = randPlan(r, kids), P2 = randPlan(r, kids), coop = randCoop(r);
      randPauseNone(r, P).concat(randPauseNone(r, P2)).forEach(s => { shapes[s] = (shapes[s] || 0) + 1; });
      if (kids.some(k => DAYS.some(dn => blockedIn(A, coop, k, dn)))) coopTicked++;
      if (Object.keys(P).some(k => P[k].week3)) three++;
      const s1 = r(); randDay(A, rng(s1 * 1e9)); randDay(B, rng(s1 * 1e9));
      const a = build(A, P, T, coop), b = build(B, P, T, coop);
      if (J(a) === J(b)) same++; else bad.push(["build", i]);
      cards += retr(a).length;
      const held = randHeld(r, a);
      const la = live(A, P2, a, coop, held), lb = live(B, P2, a, coop, held);
      if (J(la.diffs) === J(lb.diffs)) liveSame++; else bad.push(["live", i]);
      la.diffs.forEach(d => { adds += d.added.length; rems += d.removed.length; });
    }
    total += N;
    ok(c[1] + ": builder byte-identical, " + N + " random plans (" + cards + " practice cards; " + coopTicked + " with a ticked co-op day; " + three + " with a third row)", same === N && cards > 5000 && coopTicked > 100 && three > 100, bad.slice(0, 5));
    ok(c[1] + ": live pass (plan changed mid-week, cards checked / claimed / Mom's part done) byte-identical (" + adds + " added, " + rems + " taken off)", liveSame === N && adds > 100 && rems > 100, bad.slice(0, 5));
    ok(c[1] + ": every no-change pause shape replayed — " + Object.keys(shapes).sort().map(k => k + " " + shapes[k]).join(", "), Object.keys(shapes).length === 5 && Object.values(shapes).every(v => v > 30));
  });
  ok("replay total: " + total + " cases (≥ 1,000)", total >= 1000);
}

// ───────────────────────────────────────────────────────────────────────────────────────────────
console.log("2. plain pause (⏸ until ▶ Resume): the kind is off every day for that child only");
{
  const N = 250;
  CLOCKS.forEach(function (c, ci) {
    const A = schedEnv(src, c[0]), B = schedEnv(OLD, c[0]);
    let eq = 0, gone = 0, absent = 0, others = 0, othersExact = 0, solo = 0, back = 0; const bad = [];
    for (let i = 0; i < N; i++) {
      const r = rng(20000 + 1000 * ci + i), kids = ["k1", "k2", "k3"];
      const T = randWeek(r, kids), P = randPlan(r, kids), coop = r() < .5 ? randCoop(r) : { coops: {}, coopMomDays: {} };
      const s1 = r(); randDay(A, rng(s1 * 1e9)); randDay(B, rng(s1 * 1e9));
      const kid = kids[Math.floor(r() * 3)], kind = KINDS[Math.floor(r() * 4)];
      const Pp = clone(P); if (!Pp[kid]) Pp[kid] = { week: {} }; Pp[kid].pausedKinds = { [kind]: true };
      const a = build(A, Pp, T, coop), o = build(B, P, T, coop);
      const b = build(B, planOff(Pp, (k, dn, kd) => k === kid && kd === kind), T, coop);
      if (J(a) === J(b)) eq++; else bad.push(["eq", i]);
      gone += retr(o).filter(t => t.who === kid && t.retrieval === kind).length;
      if (!retr(a).some(t => t.who === kid && t.retrieval === kind)) absent++; else bad.push(["absent", i]);
      // the other children: the same cards (ids, kinds, minutes, Mom); only a time can differ when a Mom-run card left Mom's lane
      const okOthers = kids.filter(k => k !== kid).every(k => sig(retr(a).filter(t => t.who === k)) === sig(retr(o).filter(t => t.who === k)));
      if (okOthers) others++; else bad.push(["others", i]);
      // a sibling with no Mom-run practice card of its own never feels Mom's lane: byte-identical
      kids.filter(k => k !== kid && !retr(o).some(t => t.who === k && t.mom === "required")).forEach(k => { solo++; if (J(a.filter(t => t.who === k)) === J(o.filter(t => t.who === k))) othersExact++; else bad.push(["exact", i, k]); });
      // Resume (the leaf removed): the plan is the old plan again → the old week, byte for byte
      const Pr = clone(Pp); delete Pr[kid].pausedKinds; if (!P[kid]) delete Pr[kid];
      if (J(build(A, Pr, T, coop)) === J(o)) back++; else bad.push(["back", i]);
    }
    ok(c[1] + ": " + N + " plans — the builder == origin/main's with that kind turned off in every row for that child (" + gone + " cards left off)", eq === N && gone > 200, bad.filter(x => x[0] === "eq").slice(0, 5));
    ok(c[1] + ": no card of the paused kind for that child, any day", absent === N);
    ok(c[1] + ": the other children keep the same cards (only a time may move when a Mom-run card leaves Mom's lane)", others === N, bad.filter(x => x[0] === "others").slice(0, 5));
    ok(c[1] + ": a sibling with no Mom-run practice card is byte-identical, card for card (" + solo + " sibling-weeks)", othersExact === solo && solo > 60, bad.filter(x => x[0] === "exact").slice(0, 5));
    ok(c[1] + ": ▶ Resume → the week origin/main lays, byte for byte", back === N, bad.filter(x => x[0] === "back").slice(0, 5));
  });
}

// ───────────────────────────────────────────────────────────────────────────────────────────────
console.log("3. dated pause (Pause from … Resume on …): off inside the dates, on outside");
{
  const A = schedEnv(src, CLOCKS[0][0]);
  const T = [];
  DAYS.forEach(dn => { T.push({ id: "a_" + dn, who: "k1", day: dn, time: "9:00 AM", dur: 30, mom: "none", subjectKey: "s1", title: "A", cascade: true },
    { id: "c_" + dn, who: "k1", day: dn, time: "9:30 AM", dur: 10, mom: "none", subjectKey: "closing_nb", title: "Closing Notebook", cascade: true }); });
  const P = { k1: { week: { mon: "drill", tue: "drill", wed: "drill", thu: "drill", fri: "drill" }, week2: { mon: "match", tue: "match", wed: "match", thu: "match", fri: "match" } } };
  const days = (pk) => { const Q = clone(P); Q.k1.pausedKinds = { drill: pk }; return retr(build(A, Q, T)).filter(t => t.retrieval === "drill").map(t => t.day.slice(0, 3)).join(" "); };
  const matchAll = (pk) => { const Q = clone(P); Q.k1.pausedKinds = { drill: pk }; return retr(build(A, Q, T)).filter(t => t.retrieval === "match").length === 5; };
  ok("inside one week (Tue – Wed: pauseFrom Tue, resumeOn Thu) → Daily Drill Mon, Thu, Fri: present the day before and the day after",
    days({ pauseFrom: "2026-11-03", resumeOn: "2026-11-05" }) === "mon thu fri", days({ pauseFrom: "2026-11-03", resumeOn: "2026-11-05" }));
  ok("one day (Wed: pauseFrom Wed, resumeOn Thu) → off Wednesday only (both ends: the first paused day and the day before Resume on)", days({ pauseFrom: "2026-11-04", resumeOn: "2026-11-05" }) === "mon tue thu fri");
  ok("across a week boundary (Thu Oct 29 – Tue Nov 3) → off Mon, Tue; back Wednesday by itself", days({ pauseFrom: "2026-10-29", resumeOn: "2026-11-04" }) === "wed thu fri");
  ok("across the next boundary (Thu Nov 5 – Jan 3) → on Mon–Wed, off Thu, Fri", days({ pauseFrom: "2026-11-05", resumeOn: "2027-01-04" }) === "mon tue wed");
  ok("starting next week (Nov 9 – Jan 3) → this week untouched", days({ pauseFrom: "2026-11-09", resumeOn: "2027-01-04" }) === "mon tue wed thu fri");
  ok("over before this week (Resume on Mon Nov 2) → this week untouched", days({ pauseFrom: "2026-10-26", resumeOn: "2026-11-02" }) === "mon tue wed thu fri");
  ok("plain (true) → off every day", days(true) === "");
  ok("🎯 Match & Play, not paused, stays every day in each case", [true, { pauseFrom: "2026-11-03", resumeOn: "2026-11-05" }, { pauseFrom: "2026-10-29", resumeOn: "2026-11-04" }].every(matchAll));
  // random ranges == origin/main with the kind off on exactly those dates
  const N = 300;
  CLOCKS.forEach(function (c, ci) {
    const A2 = schedEnv(src, c[0]), B = schedEnv(OLD, c[0]);
    let eq = 0, inside = 0, outside = 0; const bad = [];
    for (let i = 0; i < N; i++) {
      const r = rng(40000 + 1000 * ci + i), kids = ["k1", "k2", "k3"];
      const T2 = randWeek(r, kids), P2 = randPlan(r, kids), coop = r() < .4 ? randCoop(r) : { coops: {}, coopMomDays: {} };
      const s1 = r(); randDay(A2, rng(s1 * 1e9)); randDay(B, rng(s1 * 1e9));
      Object.keys(P2).forEach(kid => {
        if (r() < .3) return; const pk = {};
        subset(r, KINDS, .4).forEach(kind => {
          const x = r(), f = AROUND.concat(WEEK_ISO)[Math.floor(r() * 12)], b = AROUND.concat(WEEK_ISO)[Math.floor(r() * 12)];
          pk[kind] = x < .15 ? true : x < .25 ? { pauseFrom: f } : x < .35 ? { resumeOn: b } : (f < b ? { pauseFrom: f, resumeOn: b } : { pauseFrom: b, resumeOn: f });
        });
        P2[kid].pausedKinds = pk;
      });
      const a = build(A2, P2, T2, coop), b = build(B, planOff(P2, (k, dn, kd) => pausedRef(P2, k, kd, ISO[dn])), T2, coop);
      if (J(a) === J(b)) eq++; else bad.push(["eq", i]);
      kids.forEach(k => DAYS.forEach(dn => KINDS.forEach(kd => { if (pausedRef(P2, k, kd, ISO[dn])) inside++; else outside++; })));
    }
    ok(c[1] + ": " + N + " random date ranges (incl. from-only, until-only, empty ranges) == origin/main's builder with the kind off on exactly the paused dates (" + inside + " paused / " + outside + " running child-day-kinds)", eq === N && inside > 2000 && outside > 2000, bad.slice(0, 5));
  });
}

// ───────────────────────────────────────────────────────────────────────────────────────────────
console.log("4. with DRILLCOOP: a ticked co-op day inside and outside a pause");
{
  const A = schedEnv(src, CLOCKS[0][0]);
  const T = [];
  DAYS.forEach(dn => { T.push({ id: "a_" + dn, who: "k1", day: dn, time: "12:30 PM", dur: 30, mom: "none", subjectKey: "s1", title: "A", cascade: true },
    { id: "c_" + dn, who: "k1", day: dn, time: "1:00 PM", dur: 10, mom: "none", subjectKey: "closing_nb", title: "Closing Notebook", cascade: true }); });
  const P = { k1: { week: { mon: "sprint", tue: "sprint", wed: "sprint", thu: "sprint", fri: "sprint" }, week2: { mon: "match", tue: "match", wed: "match", thu: "match", fri: "match" } } };
  const coop = { coops: { a: { name: "Co-op", mode: "timed", start: "9:00 AM", end: "12:00 PM", kids: ["k1"], dates: ["2026-11-03", "2026-11-05"] } }, coopMomDays: {} };   // ticked Tue + Thu
  const lay = (pk) => { const Q = clone(P); if (pk) Q.k1.pausedKinds = pk; const a = retr(build(A, Q, T, coop)); return D3.map(d => a.filter(t => t.day.slice(0, 3) === d).map(t => t.retrieval).join("+") || "-").join(" "); };
  ok("no pause: Tue / Thu ticked → Match only there (DRILLCOOP)", lay(null) === "sprint+match match sprint+match match sprint+match", lay(null));
  ok("Match paused Wed – Thu: the ticked Tuesday outside keeps its Match; the ticked Thursday inside has nothing; Wednesday loses Match only",
    lay({ match: { pauseFrom: "2026-11-04", resumeOn: "2026-11-06" } }) === "sprint+match match sprint - sprint+match", lay({ match: { pauseFrom: "2026-11-04", resumeOn: "2026-11-06" } }));
  ok("Sprint paused Mon – Tue: a ticked day inside a pause is just as clean; the ticked Thursday outside keeps the co-op rule (Match only)",
    lay({ sprint: { pauseFrom: "2026-11-02", resumeOn: "2026-11-04" } }) === "match match sprint+match match sprint+match", lay({ sprint: { pauseFrom: "2026-11-02", resumeOn: "2026-11-04" } }));
  ok("Mom flips Thursday to \"Mom's here\" while Sprint is paused all week → Thursday gets Match, still no Sprint",
    (() => { const Q = clone(P); Q.k1.pausedKinds = { sprint: true }; const a = retr(build(A, Q, T, Object.assign(clone(coop), { coopMomDays: { "2026-11-05": true } }))); return J(a.filter(t => t.day === "thursday").map(t => t.retrieval)) === J(["match"]); })());
  // random: pause × ticked co-op == origin/main with both rules' kinds off
  const N = 200; let eq = 0, both = 0; const bad = [];
  const A2 = schedEnv(src, CLOCKS[1][0]), B = schedEnv(OLD, CLOCKS[1][0]);
  for (let i = 0; i < N; i++) {
    const r = rng(70000 + i), kids = ["k1", "k2", "k3"];
    const T2 = randWeek(r, kids), P2 = randPlan(r, kids), cw = randCoop(r);
    Object.keys(P2).forEach(kid => { if (r() < .5) P2[kid].pausedKinds = { [KINDS[Math.floor(r() * 4)]]: r() < .3 ? true : { pauseFrom: WEEK_ISO[Math.floor(r() * 3)], resumeOn: WEEK_ISO[2 + Math.floor(r() * 3)] } }; });
    const a = build(A2, P2, T2, cw);
    const b = build(B, planOff(P2, (k, dn, kd) => pausedRef(P2, k, kd, ISO[dn]) || (MOMRUN(B, kd) && blockedIn(B, cw, k, dn))), T2, cw);
    if (J(a) === J(b)) eq++; else bad.push(i);
    kids.forEach(k => DAYS.forEach(dn => KINDS.forEach(kd => { if (pausedRef(P2, k, kd, ISO[dn]) && MOMRUN(B, kd) && blockedIn(B, cw, k, dn)) both++; })));
  }
  ok(N + " random plans × pauses × co-op worlds == origin/main with the paused and the co-op kinds off (" + both + " child-day-kinds under both rules)", eq === N && both > 50, bad.slice(0, 5));
}

// ───────────────────────────────────────────────────────────────────────────────────────────────
console.log("5. the live pass: Pause mid-week takes the open cards from today on off; Resume brings them back");
{
  const N = 250;
  CLOCKS.forEach(function (c, ci) {
    const A = schedEnv(src, c[0]); const open = openFrom(A);
    let offOk = 0, heldOk = 0, othersOk = 0, backOk = 0, timesSame = 0, took = 0, heldN = 0, backN = 0, datedOk = 0; const bad = [];
    for (let i = 0; i < N; i++) {
      const r = rng(90000 + 1000 * ci + i), kids = ["k1", "k2", "k3"];
      const T = randWeek(r, kids), P = randPlan(r, kids), coop = r() < .4 ? randCoop(r) : { coops: {}, coopMomDays: {} };
      const s1 = r(); randDay(A, rng(s1 * 1e9));
      const w0 = build(A, P, T, coop), held = randHeld(r, w0);
      const isHeld = t => !!held.checked[t.id] || !!held.claimed[t.id] || !!t.momPartDone;
      const kid = kids[Math.floor(r() * 3)], kind = KINDS[Math.floor(r() * 4)];
      const Pp = clone(P); if (!Pp[kid]) Pp[kid] = { week: {} }; Pp[kid].pausedKinds = { [kind]: true };
      // ⏸ Pause → the live pass, as the tap queues it (that child only)
      const L = live(A, Pp, w0, coop, held, [kid]);
      const rem = L.diffs[0].removed.slice().sort();
      const want = retr(w0).filter(t => t.who === kid && t.retrieval === kind && open.indexOf(t.day) >= 0 && !isHeld(t)).map(t => t.id).sort();
      if (J(rem) === J(want) && !L.diffs[0].added.length && !L.diffs[0].retimed.length) offOk++; else bad.push(["off", i, rem, want]);
      took += rem.length;
      const H = retr(w0).filter(t => t.who === kid && t.retrieval === kind && (isHeld(t) || open.indexOf(t.day) < 0)); heldN += H.length;
      if (H.every(t => L.tasks.some(x => x.id === t.id && J(x) === J(t)))) heldOk++; else bad.push(["held", i]);
      // nobody else's cards move
      if (J(L.tasks.filter(t => !(t.who === kid && t.retrieval === kind))) === J(w0.filter(t => !(t.who === kid && t.retrieval === kind)))) othersOk++; else bad.push(["others", i]);
      // ▶ Resume → the same cards (same ids, kinds, minutes, Mom) are laid again; nothing else changes
      const R = live(A, P, L.tasks, coop, held, [kid]);
      const added = R.diffs[0].added.map(t => t.id).sort();
      if (J(added) === J(want) && !R.diffs[0].removed.length && sig(retr(R.tasks)) === sig(retr(w0))) backOk++; else bad.push(["back", i, added, want]);
      backN += added.length;
      if (J(retr(R.tasks).slice().sort((a, b) => (a.id < b.id ? -1 : 1)).map(t => t.time)) === J(retr(w0).slice().sort((a, b) => (a.id < b.id ? -1 : 1)).map(t => t.time))) timesSame++;
      // a dated pause starting Thursday → only Thu / Fri open cards leave
      const Pd = clone(P); if (!Pd[kid]) Pd[kid] = { week: {} }; Pd[kid].pausedKinds = { [kind]: { pauseFrom: "2026-11-05", resumeOn: "2026-11-16" } };
      const Ld = live(A, Pd, w0, coop, held, [kid]);
      const wantD = want.filter(id => /_retr_/.test(id) && retr(w0).some(t => t.id === id && (t.day === "thursday" || t.day === "friday")));
      if (J(Ld.diffs[0].removed.slice().sort()) === J(wantD) && !Ld.diffs[0].added.length) datedOk++; else bad.push(["dated", i]);
    }
    ok(c[1] + ": ⏸ Pause → exactly that child's open, unheld cards of that kind on " + (open.length === 5 ? "every open day" : "today (open) and later") + " leave (" + took + "), nothing added or re-timed", offOk === N && took > 100, bad.filter(x => x[0] === "off").slice(0, 3));
    ok(c[1] + ": checked / claimed / Mom's-part-done cards" + (open.length < 5 ? " and past days' cards" : "") + " stay untouched (" + heldN + ")", heldOk === N && heldN > 30, bad.filter(x => x[0] === "held").slice(0, 3));
    ok(c[1] + ": every other card in the week is byte-identical", othersOk === N, bad.filter(x => x[0] === "others").slice(0, 3));
    ok(c[1] + ": ▶ Resume → the same cards back (" + backN + "; same ids, kinds, minutes, Mom; " + timesSame + "/" + N + " weeks also at the very same times)", backOk === N && backN > 100, bad.filter(x => x[0] === "back").slice(0, 3));
    ok(c[1] + ": a dated pause from Thursday → only Thursday's and Friday's open cards leave", datedOk === N, bad.filter(x => x[0] === "dated").slice(0, 3));
  });
}

// ── the Curriculum side: RETRWEEK + the drill blocks + the one plan write, with a db that records ──
function uiEnv(S, nowIso) {
  const E = schedEnv(S, nowIso || "2026-11-23T10:00:00");
  const code = [sliceIn(S, "// DRILLROWS_START", "// DRILLROWS_END"), sliceIn(S, "// DRILLDAYS_START", "// DRILLDAYS_END"), sliceIn(S, "// DRILLADD_START", "// DRILLADD_END"),
    sliceIn(S, "// DRILLSAVE_START", "// DRILLSAVE_END"), sliceIn(S, "// DRILLPOINT_START", "// DRILLPOINT_END")].join("\n");
  Object.assign(E, { esc: s => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;"),
    KID_COLOR: { k1: "#2563eb" }, HA_LS: { setItem: () => {} }, momHere: () => true, retrAdminLocal: null,
    mstOwnedIds: () => null, mastIsNeverDrill: () => false, masteryKid: "k1", mastMatchDecks: () => ["a"] });
  new vm.Script(code + "\nthis.__drPauseMsg=()=>drPauseMsg;").runInContext(E);
  E.W = []; E.Q = [];
  E.db = { ref: p => ({ update: v => E.W.push([p, clone(v)]), set: v => E.W.push(["SET " + p, clone(v)]), remove: () => E.W.push(["REMOVE " + p]) }) };
  E._dryRun = () => false;
  E.retrLiveQueue = k => { E.Q.push(k); return true; };
  return E;
}
const tagBal = h => ["div", "button", "span", "a"].every(t => (h.match(new RegExp("<" + t + "[\\s>]", "g")) || []).length === (h.match(new RegExp("</" + t + ">", "g")) || []).length);
const ids = h => (h.match(/\sid="[^"]*"/g) || []);

// ───────────────────────────────────────────────────────────────────────────────────────────────
console.log("6. writes: one drPlanWrite each, exactly one path; nothing on a refused date, in a dry run, or not Mom");
{
  const E = uiEnv(src);   // today = Mon Nov 23, 2026
  const plan = { k1: { week: { mon: "drill", tue: "match", wed: "drill", thu: "drill", fri: "off" }, week2: { mon: "match" }, settings: { gate_pct: 80 } } };
  const reset = () => { E.masteryData.retrievalPlan = clone(plan); E.W.length = 0; E.Q.length = 0; };
  reset(); E.drDaysOpen("k1", "drill");
  ok("⏸ Pause → ONE update at mastery/retrievalPlan/k1 = {\"pausedKinds/drill\": true}; the live pass queued for that child", E.drPauseNow() === true && J(E.W) === J([["mastery/retrievalPlan/k1", { "pausedKinds/drill": true }]]) && J(E.Q) === J(["k1"]), E.W);
  ok("…the mirror holds the leaf and keeps every other key (the days, Row 2, the numbers)", J(E.masteryData.retrievalPlan.k1) === J(Object.assign(clone(plan.k1), { pausedKinds: { drill: true } })));
  E.W.length = 0; E.Q.length = 0;
  ok("▶ Resume → ONE update {\"pausedKinds/drill\": null}; the plan is exactly the pre-pause plan again (the empty pausedKinds goes too)", E.drResumeNow() === true && J(E.W) === J([["mastery/retrievalPlan/k1", { "pausedKinds/drill": null }]]) && J(E.Q) === J(["k1"]) && J(E.masteryData.retrievalPlan.k1) === J(plan.k1), [E.W, E.masteryData.retrievalPlan.k1]);
  reset();
  ok("dated: Pause from Dec 1 · Resume on Jan 4 → ONE update {\"pausedKinds/drill\": {pauseFrom:\"2026-12-01\", resumeOn:\"2027-01-04\"}}",
    E.drPauseDates("2026-12-01", "2027-01-04") === true && J(E.W) === J([["mastery/retrievalPlan/k1", { "pausedKinds/drill": { pauseFrom: "2026-12-01", resumeOn: "2027-01-04" } }]]) && J(E.Q) === J(["k1"]), E.W);
  reset();
  ok("a start in the past (or empty) is today, as Family Time does", E.drPauseDates("2026-11-01", "2026-11-30") === true && J(E.W[0][1]) === J({ "pausedKinds/drill": { pauseFrom: "2026-11-23", resumeOn: "2026-11-30" } })
    && (E.W.length = 0, E.drPauseDates("", "2026-11-30") === true) && J(E.W[0][1]) === J({ "pausedKinds/drill": { pauseFrom: "2026-11-23", resumeOn: "2026-11-30" } }));
  const refused = [["2026-12-01", "", /Pick the day it comes back/], ["2026-11-01", "2026-11-20", /already come/], ["2026-11-01", "2026-11-23", /already come/], ["2026-12-10", "2026-12-01", /has to be after/], ["2026-12-01", "2026-12-01", /has to be after/], ["2026-12-01", "Jan 4", /Pick the day/]];
  refused.forEach(x => { reset(); const r = E.drPauseDates(x[0], x[1]);
    ok("refused, nothing written, a plain line says why: from " + J(x[0]) + " resume on " + J(x[1]) + " → \"" + E.__drPauseMsg() + "\"", r === false && !E.W.length && !E.Q.length && x[2].test(E.__drPauseMsg()) && J(E.masteryData.retrievalPlan) === J(plan)); });
  ok("…and the line shows on the sheet", /dr-pause-msg/.test(E.drDaysHtml("k1", "drill")));
  reset(); E._dryRun = () => true;
  ok("?dryrun=1 → no database write (drPlanWrite's own guard)", E.drPauseNow() === true && !E.W.length && (E.drResumeNow(), !E.W.length) && (E.drPauseDates("2026-12-01", "2027-01-04"), !E.W.length));
  E._dryRun = () => false; reset(); E.momHere = () => false;
  ok("not Mom → nothing at all (no write, no mirror change, no live pass)", E.drPauseNow() === false && E.drResumeNow() === false && E.drPauseDates("2026-12-01", "2027-01-04") === false && !E.W.length && !E.Q.length && J(E.masteryData.retrievalPlan) === J(plan));
  E.momHere = () => true; reset();
  ok("a second kind's pause keeps the first (one leaf each — update() never replaces pausedKinds)", (E.drPauseNow(), E.drDaysOpen("k1", "match"), E.drPauseDates("2026-12-01", "2027-01-04"))
    && J(E.W.map(w => w[1])) === J([{ "pausedKinds/drill": true }, { "pausedKinds/match": { pauseFrom: "2026-12-01", resumeOn: "2027-01-04" } }])
    && J(E.masteryData.retrievalPlan.k1.pausedKinds) === J({ drill: true, match: { pauseFrom: "2026-12-01", resumeOn: "2027-01-04" } })
    && (E.drResumeNow(), J(E.masteryData.retrievalPlan.k1.pausedKinds) === J({ drill: true })));
  reset();
  ok("drPlanWrite refuses a bad leaf path (empty part, '.', '#', '$', '[', ']') — nothing written",
    ["pausedKinds/", "/x", "a//b", "pausedKinds/x.y", "pausedKinds/#", "pausedKinds/$", "pausedKinds/[a]"].every(p => E.drPlanWrite("k1", { [p]: true }) === false) && !E.W.length && J(E.masteryData.retrievalPlan) === J(plan));
  ok("drPlanWrite with ordinary keys mirrors exactly as before (Object.assign of the payload)", (E.drPlanWrite("k1", { week: { mon: "match" }, settings: null }), J(E.masteryData.retrievalPlan.k1) === J(Object.assign(clone(plan.k1), { week: { mon: "match" }, settings: null }))) && J(E.W) === J([["mastery/retrievalPlan/k1", { week: { mon: "match" }, settings: null }]]));
  reset();
  ok("the day buttons never write pausedKinds; a pause never writes the days", (E.drDaysOpen("k1", "drill"), E.drDaysTap("fri"), E.drPauseNow(), E.W.length === 2 && !("pausedKinds/drill" in E.W[0][1]) && J(Object.keys(E.W[1][1])) === J(["pausedKinds/drill"])));
}

// ───────────────────────────────────────────────────────────────────────────────────────────────
console.log("7. what Mom sees, and every other reader of \"which kinds run\"");
{
  const E = uiEnv(src);   // Mon Nov 23, 2026
  const set = pk => { E.masteryData.retrievalPlan = { k1: { week: { mon: "drill", tue: "drill", wed: "match", thu: "drill", fri: "off" }, week2: { mon: "match", tue: "sprint" }, week3: { mon: "sprint" }, pausedKinds: pk } }; };
  const line = k => { const r = E.drRows("k1").find(x => x.kind === k); return r ? E.drLineText(r, "K1") : null; };
  set({ drill: true });
  ok("plain: the line keeps its days and says \"⏸ paused\" — " + line("drill"), line("drill") === "🃏 Daily Drill · Mon Tue Thu · 5 min · with Mom · ⏸ paused →", line("drill"));
  const chip = E.drStripChips("k1"), dchip = (chip.match(/<button class="dr-row"[^]*?<\/button>/g) || []).find(b => /Daily Drill/.test(b)) || "";
  ok("…greyed in the purple strip (like a paused subject chip) and still opens its day sheet", /color:#9ca3af/.test(dchip) && /drDaysOpen\(/.test(dchip) && !/dr-empty/.test(chip));
  ok("…the running kinds keep their colour", (chip.match(/<button class="dr-row"[^]*?<\/button>/g) || []).filter(b => !/Daily Drill/.test(b)).every(b => /color:#6d28d9/.test(b)));
  set({ drill: { pauseFrom: "2026-11-20", resumeOn: "2027-01-04" } });
  ok("dated, begun: \"⏸ paused until Jan 3\" (the last paused day — stored Resume on Jan 4) — " + line("drill"), /· ⏸ paused until Jan 3 →$/.test(line("drill")) && E.drRows("k1").find(x => x.kind === "drill").paused === true);
  set({ drill: { pauseFrom: "2026-12-01", resumeOn: "2027-01-04" } });
  const up = E.drRows("k1").find(x => x.kind === "drill");
  ok("dated, ahead: shown as upcoming, not paused today — \"⏸ pauses Dec 1 – Jan 3\", the line keeps its colour", /· ⏸ pauses Dec 1 – Jan 3 →$/.test(line("drill")) && up.paused === false && /color:#6d28d9/.test(((E.drStripChips("k1").match(/<button class="dr-row"[^]*?<\/button>/g) || []).find(b => /Daily Drill/.test(b))) || ""));
  set({ drill: { pauseFrom: "2026-11-02", resumeOn: "2026-11-23" } });
  ok("dated, over (Resume on came today) → the line is the plain line again; nothing cleans the leaf", line("drill") === "🃏 Daily Drill · Mon Tue Thu · 5 min · with Mom →" && !!E.masteryData.retrievalPlan.k1.pausedKinds.drill);
  set(undefined);
  ok("no pause → every line exactly as origin/main's drLineText words it", (() => { const B = uiEnv(OLD); B.masteryData.retrievalPlan = clone(E.masteryData.retrievalPlan); return J(E.drRows("k1").map(r => E.drLineText(r, "K1"))) === J(B.drRows("k1").map(r => B.drLineText(r, "K1"))) && E.drStripChips("k1") === B.drStripChips("k1"); })());

  // the day sheet
  const states = [["not paused", undefined], ["plain", { drill: true }], ["dated, begun", { drill: { pauseFrom: "2026-11-20", resumeOn: "2027-01-04" } }], ["dated, ahead", { drill: { pauseFrom: "2026-12-01", resumeOn: "2027-01-04" } }]];
  states.forEach(s => {
    set(s[1]); E.drDaysOpen("k1", "drill"); const h = E.drDaysHtml("k1", "drill"), p = E.drPauseSheetHtml("k1", "drill");
    const ctl = (p.match(/<(button|input)[^>]*>/g) || []);
    ok("sheet, " + s[0] + ": HTML balanced, no duplicate ids, every pause control 44 px, the days still lit Mon Tue Thu",
      tagBal(h) && new Set(ids(h)).size === ids(h).length && ctl.length >= (s[1] ? 1 : 4) && ctl.every(x => /min-height:44px/.test(x)) && J(E.drDaysLit("k1", "drill")) === J(["mon", "tue", "thu"]), { ids: ids(h), ctl });
  });
  set(undefined); let p = E.drPauseSheetHtml("k1", "drill");
  ok("sheet, not paused: ⏸ Pause (until you tap ▶ Resume) · Or pause from [today] · Resume on [blank, from tomorrow] · ⏸ Pause these days — Family Time's words and date boxes",
    /⏸ Pause<\/button>/.test(p) && /until you tap ▶ Resume/.test(p) && /Or pause from/.test(p) && /data-drp="f" type="date" min="2026-11-23" value="2026-11-23"/.test(p) && /Resume on/.test(p) && /data-drp="r" type="date" min="2026-11-24" value=""/.test(p) && /⏸ Pause these days/.test(p) && /flex-wrap:wrap/.test(p));
  set({ drill: true }); p = E.drPauseSheetHtml("k1", "drill");
  ok("sheet, plain: \"⏸ paused\" · ▶ Resume · \"▶ Resume brings it back on the same days\"", /⏸ paused</.test(p) && /▶ Resume<\/button>/.test(p) && /same days/.test(p) && !/data-drp/.test(p));
  set({ drill: { pauseFrom: "2026-11-20", resumeOn: "2027-01-04" } }); p = E.drPauseSheetHtml("k1", "drill");
  ok("sheet, dated: \"⏸ paused until Jan 3\" · ▶ Resume · \"comes back by itself on Jan 4\"", /⏸ paused until Jan 3/.test(p) && /▶ Resume<\/button>/.test(p) && /comes back by itself on Jan 4/.test(p));
  set({ drill: { pauseFrom: "2026-12-01", resumeOn: "2027-01-04" } }); p = E.drPauseSheetHtml("k1", "drill");
  ok("sheet, ahead: \"⏸ pauses Dec 1 – Jan 3\" · ✕ Don't pause (Family Time's word) · \"runs as usual until Dec 1\"", /⏸ pauses Dec 1 – Jan 3/.test(p) && /✕ Don’t pause<\/button>/.test(p) && /runs as usual until Dec 1/.test(p));
  ok("✕ Don't pause → the leaf removed (one write)", (E.W.length = 0, E.drResumeNow(), J(E.W) === J([["mastery/retrievalPlan/k1", { "pausedKinds/drill": null }]])));
  set({ drill: true }); E.drDaysOpen("k1", "drill");
  ok("a day tap still works while paused (the days stay hers to change) and keeps the pause", (E.W.length = 0, E.drDaysTap("fri") === true) && E.masteryData.retrievalPlan.k1.pausedKinds.drill === true && J(E.drDaysLit("k1", "drill")) === J(["mon", "tue", "thu", "fri"]));

  // the other readers
  set({ drill: true, sprint: { pauseFrom: "2026-11-20", resumeOn: "2027-01-04" } });
  ok("＋ Add subject ▸ Card practice: a paused kind is still on the week — never offered again as missing", (() => { const i = E.daInfo("k1"); return i.has.drill === true && i.has.sprint === true && !E.daKindsFrom(i).some(x => x.kind === "drill" || x.kind === "sprint"); })());
  ok("the three-a-day limit: Monday (Daily Drill paused + Match + Sprint) is full — a paused kind keeps its slot",
    J(E.daRoom(E.retrWeek("k1"), E.retrWeek2("k1"), "recheck", E.retrWeek3("k1")).mon) === J(["drill", "match", "sprint"]));
  ok("retrDayKinds, retrOn and drPlanFor (the plan's readers) still list a paused kind; retrDayKindsOn leaves it out on paused dates",
    J(E.retrDayKinds("k1", "mon")) === J(["drill", "match", "sprint"]) && E.retrOn("k1") && J(E.drPlanFor("k1").on.mon) === J(["drill", "match", "sprint"])
    && J(E.retrDayKindsOn("k1", "mon", "2026-11-23")) === J(["match"]) && J(E.retrDayKindsOn("k1", "mon", "2026-11-16")) === J(["match", "sprint"]) && J(E.retrDayKindsOn("k1", "mon", "2027-01-04")) === J(["match", "sprint"]));
  ok("Mastery's read-only lines (DRILLPOINT) say the same words as the Curriculum line", E.drPointLines("k1").find(l => l.kind === "drill").text === "🃏 Daily Drill · Mon Tue Thu · 5 min · with Mom · ⏸ paused"
    && /⏸ paused until Jan 3$/.test(E.drPointLines("k1").find(l => l.kind === "sprint").text));
  ok("retrDayKinds / retrTodayKinds / retrOn / drPlanFor / drDaysMap / daKindsFrom code unchanged from origin/main",
    ["retrDayKinds", "retrTodayKinds", "retrOn", "drPlanFor", "drDaysMap", "daKindsFrom", "daInfo", "retrLiveDiff", "retrLiveCtx", "gwInjectRetrieval", "drDaysWrite", "relayWeek", "retrLiveQueue"].every(n => fnIn(src, n) === fnIn(OLD, n)));

  // the Grid's Min column, run as written in renderCurrGrid
  const minFn = S => { const g = fnIn(S, "renderCurrGrid"), k = "    let retrievalMins=0;\n", i = g.indexOf(k), j = g.indexOf("\n", i + k.length);
    if (i < 0) throw new Error("Min column line not found");
    return "(function(gvKid,d,l,offReason,mapOff){ const DOWS=[\"Sun\",\"Mon\",\"Tue\",\"Wed\",\"Thu\",\"Fri\",\"Sat\"];\n" + g.slice(i, j + 1) + " return retrievalMins; })"; };
  const A = schedEnv(src, CLOCKS[0][0]); const fa = vm.runInContext(minFn(src), A);
  let agree = 0, n = 0, pausedDays = 0;
  for (let i = 0; i < 200; i++) {
    const r = rng(123000 + i), kids = ["k1", "k2", "k3"];
    const T = randWeek(r, kids), P = randPlan(r, kids), coop = randCoop(r);
    Object.keys(P).forEach(kid => { if (r() < .6) P[kid].pausedKinds = { [KINDS[Math.floor(r() * 4)]]: r() < .3 ? true : { pauseFrom: WEEK_ISO[Math.floor(r() * 3)], resumeOn: WEEK_ISO[2 + Math.floor(r() * 3)] } }; });
    const a = build(A, P, T, coop);
    kids.forEach(k => DAYS.forEach(dn => {
      if (!T.some(t => t.who === k && t.day === dn)) return; n++;
      const laid = retr(a).filter(t => t.who === k && t.day === dn).reduce((s, t) => s + t.dur, 0);
      A.calendarData = clone(coop); A.masteryData.retrievalPlan = clone(P);
      if (fa(k, new Date(ISO[dn] + "T12:00:00"), { date: ISO[dn] }, null, false) === laid) agree++;
      if (KINDS.some(kd => pausedRef(P, k, kd, ISO[dn]))) pausedDays++;
    }));
  }
  ok("the Grid's Min column == the minutes of the practice cards actually laid, every child-day (" + n + ", " + pausedDays + " with a paused kind)", agree === n && pausedDays > 300, { agree, n });

  // the brain-work strip (Wednesday Nov 4, nothing laid today)
  const stripEnv = (S, pk) => {
    const X = schedEnv(S, "2026-11-04T09:30:00");
    Object.assign(X, { _todayDay: "wednesday", weekData: { tasks: [] }, esc: s => String(s), kidOffOwnDay: () => false, effectiveDay: t => t.day,
      retrEntries: () => [], retrTodayQueue: () => [], retrMatchSuggest: () => null });
    X.masteryData.retrievalPlan = { k1: { week: { wed: "sprint" }, week2: { wed: "match" }, week3: { wed: "recheck" } } };
    if (pk) X.masteryData.retrievalPlan.k1.pausedKinds = pk;
    vm.runInContext(fnIn(S, "retrSchedStripHtml"), X);
    return X.retrSchedStripHtml("k1", "wednesday");
  };
  const chips = h => (h.match(/\u{1F3C3} [^<✓]*|\u{1F3AF} [^<✓]*|\u{1F0CF} [^<✓]*/gu) || []).map(s => s.trim());
  ok("brain-work strip, nothing paused: as origin/main", stripEnv(src) === stripEnv(OLD));
  ok("brain-work strip, Sprint paused (plain) and Match paused over today: only Re-checks left beside the always-there Daily Drill chip",
    J(chips(stripEnv(src, { sprint: true, match: { pauseFrom: "2026-11-04", resumeOn: "2026-11-05" } }))) === J(["\u{1F0CF} Daily Drill", "\u{1F3C3} Re-checks"]));
  ok("brain-work strip, Match paused from tomorrow: today's chips unchanged", stripEnv(src, { match: { pauseFrom: "2026-11-05", resumeOn: "2026-11-09" } }) === stripEnv(OLD));
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
