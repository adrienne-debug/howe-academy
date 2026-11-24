/*
 * 🃏 DRILLSWITCH — the one-tap switch for an old-style "Drills" daily subject (slice 7 of DESIGN_drill_rows_curriculum_2026-11-19.md,
 * §5; her answers 2026-11-22: question 4 "Yes, offer it", question 5 "Use the usual time"). Against code sliced out of index.html,
 * and against origin/main (or the same tree with the slice taken out again — stripSwitch):
 *   0. stripSwitch undoes the slice exactly; every region it touched equals origin/main's; the block writes only through
 *      drPlanWrite / ceSaveField / relayWeek; no dialogs; no names
 *   1. REPLAY: no old-style subject → the Curriculum strip's card-practice chips byte-identical; the builder and the live pass
 *      byte-identical over 1,000+ random plans × co-op worlds × three clocks; the door (relayWeek, _rlwChain, _rlwWords,
 *      _rlwApplyLocal) identical for every run nobody marks; the paper-drill hook identical for every card but a Daily Drill one
 *   2. spotting: each §5.1 condition on and off
 *   3. the confirm's text: every-day; fewer times a week (= the builder's own spread, run from its own source line); a Saturday;
 *      a day already holding three kinds; Daily Drill already on some days; Daily Drill paused (plain and dated); minutes; co-op;
 *      today / tomorrow / next week
 *   4. the writes: exactly the expected paths and values (no slot_min_drill), one relayWeek; dry run and not-Mom write nothing
 *   5. this week after the tap, through the real door, three clock cases (+ a tap a second before school): never an old Drills card
 *      and a Daily Drill card both open on a day; past days and checked / claimed / Mom's-part-done / started cards untouched
 *   6. ↩ Undo: every leaf back, this device's copy back, the week's cards back
 *   7. a ticked "No Mom-required lessons" co-op day: no drill card before, none after
 *   8. the paper-drill hook: an old card as before; a 🃏 Daily Drill card now feeds it; Sprint / Re-checks / Match do not
 *   9. the HTML: balanced, no ids, 44 px controls, wraps at phone width
 *   run:  node test_drill_switch.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm"), cp = require("child_process");

// ── stripSwitch: the slice taken out again. The block goes; every other edit is put back to its old text.
// [new text, old text] — exactly what the slice changed outside its block (each new text occurs exactly once).
const SWITCH_EDITS = [
[
"  let h=(typeof drSwOfferHtml===\"function\")?drSwOfferHtml(kid):'';   // DRILLSWITCH: the one-tap offer for an old-style drills subject (\"\" for every other child)\n  rows.forEach(function(r){\n    h+='<button class=\"dr-row\" ",
"  let h='';\n  rows.forEach(function(r){\n    h+='<button class=\"dr-row\" "
],
[
"  (info.retr||[]).forEach(function(k){ if(!k) return; if(!_rlwPend.retr) _rlwPend.retr=[]; if(_rlwPend.retr.indexOf(k)<0) _rlwPend.retr.push(k); });   // 🃏 RETRLIVE: pass R — the kids whose practice days changed\n  if(info.from) _rlwPend.from=(info.from===\"tomorrow\"||_rlwPend.from===\"tomorrow\")?\"tomorrow\":\"clock\";   // 🃏 DRILLSWITCH: one clock rule for pass B and pass R (_rlwFromMode); no other caller sets it\n",
"  (info.retr||[]).forEach(function(k){ if(!k) return; if(!_rlwPend.retr) _rlwPend.retr=[]; if(_rlwPend.retr.indexOf(k)<0) _rlwPend.retr.push(k); });   // 🃏 RETRLIVE: pass R — the kids whose practice days changed\n"
],
[
"const mode=_mvt?\"tomorrow\":((typeof _rlwFromMode===\"function\"&&_rlwFromMode(pend))||((pend&&pend.today&&typeof RLW_CURR_TODAY!==\"undefined\"&&RLW_CURR_TODAY&&typeof _rlwModeToday===\"function\")?_rlwModeToday():_rlwModeNoAsk())); const why=",
"const mode=_mvt?\"tomorrow\":(pend&&pend.today&&typeof RLW_CURR_TODAY!==\"undefined\"&&RLW_CURR_TODAY&&typeof _rlwModeToday===\"function\")?_rlwModeToday():_rlwModeNoAsk(); const why="
],
[
"  if(parts[0]===\"calendar\"&&typeof calendarData!==\"undefined\"&&calendarData){ let o=calendarData; for(let i=1;i<parts.length-1;i++){ if(!o[parts[i]]||typeof o[parts[i]]!==\"object\") o[parts[i]]={}; o=o[parts[i]]; } if(v===null) delete o[parts[parts.length-1]]; else o[parts[parts.length-1]]=v; return; }\n  if(parts[0]===\"mastery\"&&parts.length>1&&typeof masteryData!==\"undefined\"&&masteryData){ let o=masteryData; for(let i=1;i<parts.length-1;i++){ if(!o[parts[i]]||typeof o[parts[i]]!==\"object\") o[parts[i]]={}; o=o[parts[i]]; } if(v===null) delete o[parts[parts.length-1]]; else o[parts[parts.length-1]]=JSON.parse(JSON.stringify(v)); return; }   // 🃏 DRILLSWITCH: a plan leaf (no other caller lists a mastery path)\n",
"  if(parts[0]===\"calendar\"&&typeof calendarData!==\"undefined\"&&calendarData){ let o=calendarData; for(let i=1;i<parts.length-1;i++){ if(!o[parts[i]]||typeof o[parts[i]]!==\"object\") o[parts[i]]={}; o=o[parts[i]]; } if(v===null) delete o[parts[parts.length-1]]; else o[parts[parts.length-1]]=v; return; }\n"
],
[
"  const nRetr=(String(e.why||\"\").split(\",\").indexOf(\"retrieval\")>=0)?(e.removed||[]).filter(function(c){ return c&&c.subjectKey===\"retrieval\"; }).length:0;   // 🃏 RETRLIVE: a practice card taken off is not \"to next week\"\n  const nSw=(String(e.why||\"\").split(\",\").indexOf(\"drillswitch\")>=0)?(e.removed||[]).filter(function(c){ return c&&/^drills(_|$)/.test(String(c.subjectKey||\"\")); }).length:0;   // 🃏 DRILLSWITCH: nor is an old drills card the switch took off\n  let s=(e.label||\"Re-laid\")+\" → \"+nm+\" card\"+(nm===1?\"\":\"s\")+\" moved\"+(kids?\" (\"+kids+\")\":\"\");\n  if(nr-nSat-nRetr-nSw) s+=\" · \"+(nr-nSat-nRetr-nSw)+\" to next week\";\n  if(nSat) s+=\" · \"+nSat+\" off Saturday\";\n  if(nRetr+nSw) s+=\" · \"+(nRetr+nSw)+\" taken off\";\n",
"  const nRetr=(String(e.why||\"\").split(\",\").indexOf(\"retrieval\")>=0)?(e.removed||[]).filter(function(c){ return c&&c.subjectKey===\"retrieval\"; }).length:0;   // 🃏 RETRLIVE: a practice card taken off is not \"to next week\"\n  let s=(e.label||\"Re-laid\")+\" → \"+nm+\" card\"+(nm===1?\"\":\"s\")+\" moved\"+(kids?\" (\"+kids+\")\":\"\");\n  if(nr-nSat-nRetr) s+=\" · \"+(nr-nSat-nRetr)+\" to next week\";\n  if(nSat) s+=\" · \"+nSat+\" off Saturday\";\n  if(nRetr) s+=\" · \"+nRetr+\" taken off\";\n"
],
[
"      const d=retrLiveDiff(kid,weekData.tasks,(typeof _rlwFromCtx===\"function\")?_rlwFromCtx(pend,retrLiveCtx(kid)):retrLiveCtx(kid));   // 🃏 DRILLSWITCH: a switch run's today follows pass B's (_rlwFromMode); any other run: unchanged\n",
"      const d=retrLiveDiff(kid,weekData.tasks,retrLiveCtx(kid));\n"
],
[
"    const sk=(t&&t.subjectKey)||\"\"; if(!t||!t.who||!(sk===\"drills\"||/^drills(_|$)/.test(sk)||(sk===\"retrieval\"&&t.retrieval===\"drill\"))) return;   // 🃏 DRILLSWITCH: + a 🃏 Daily Drill practice card (never Sprint / Re-checks / Match)\n",
"    const sk=(t&&t.subjectKey)||\"\"; if(!t||!t.who||!(sk===\"drills\"||/^drills(_|$)/.test(sk))) return;\n"
]
];
function stripSwitch(s) {
  if (s.indexOf("DRILLSWITCH") < 0) return s;   // a tree without the slice (origin/main before it is merged)
  const a = s.indexOf("// DRILLSWITCH_START"), m = "// DRILLSWITCH_END\n", b = s.indexOf(m);
  if (a < 0 || b < a || s.split("// DRILLSWITCH_START").length !== 2) throw new Error("stripSwitch: block markers");
  s = s.slice(0, a) + s.slice(b + m.length);
  SWITCH_EDITS.forEach(function (p) {
    const n = s.split(p[0]).length - 1;
    if (n !== 1) throw new Error("stripSwitch: an edit is not there exactly once (" + n + "): " + p[0].slice(0, 80));
    s = s.replace(p[0], () => p[1]);
  });
  return s;
}
module.exports = { stripSwitch };
if (require.main !== module) return;

const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
let pass = 0, fail = 0;
function ok(n, c, x) { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x).slice(0, 700) + ")" : "")); } }
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
const esc = s => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

let MAIN = ""; try { MAIN = cp.execSync("git show origin/main:index.html", { cwd: __dirname, encoding: "utf8", maxBuffer: 1 << 28, stdio: ["ignore", "pipe", "ignore"] }); } catch (e) { MAIN = ""; }
const OLD = stripSwitch(MAIN || src);   // origin/main (as-if-merged: the merged tree with the slice taken out again)
const S0 = stripSwitch(src);

// ───────────────────────────────────────────────────────────────────────────────────────────────
console.log("0. the slice, and stripSwitch undoing it exactly");
const BLOCK = sliceIn(src, "// DRILLSWITCH_START", "// DRILLSWITCH_END");
{
  ok("DRILLSWITCH_START / _END once each, right after DRILLADD_END", src.split("// DRILLSWITCH_START").length === 2 && src.split("// DRILLSWITCH_END").length === 2 && src.indexOf("// DRILLADD_END\n// DRILLSWITCH_START") > 0);
  ok("the block cites her two answers, the date and the design", /Yes, offer it/.test(BLOCK) && /Use the usual\s*(\/\/\s*)?time/.test(BLOCK) && /2026-11-22/.test(BLOCK) && /DESIGN_drill_rows_curriculum_2026-11-19\.md/.test(BLOCK));
  const code = BLOCK.replace(/^\s*\/\/.*$/gm, "");
  ok("the block writes only through drPlanWrite (once), ceSaveField (paused, pausedSince) and relayWeek (once) — no db of its own",
    !/db\.ref|\.update\(|\.set\(/.test(code) && (code.match(/drPlanWrite\(/g) || []).length === 1 && (code.match(/relayWeek\(/g) || []).length === 1
    && /ceSaveField\("paused",true\); ceSaveField\("pausedSince",new Date\(\)\.toISOString\(\)\)/.test(code) && !/slot_min_drill"?\s*[:=]/.test(code.replace(/\.slot_min_drill!==undefined/g, "")));
  ok("never a dialog; Mom only (_drMom) on the offer, open, What changes? and the tap; the live gate db && !_dryRun()",
    !/confirm\(|alert\(|prompt\(/.test(code) && (code.match(/_drMom\(\)/g) || []).length >= 4 && /function _drSwLive\(\)\{ return typeof db!=="undefined"&&!!db&&!\(typeof _dryRun==="function"&&_dryRun\(\)\); \}/.test(code));
  ok("no family or child names in the block or this test's worlds", !/lincoln|ellis|lucy|julian|kenzie|caleb|andrew|sara|dewalt|howe/i.test(code));
  ok("no 🔀 anywhere in index.html", src.indexOf("\u{1F500}") < 0);
  ok("stripped: no trace left", !/DRILLSWITCH|drSw|_rlwFromMode|_rlwFromCtx|drillswitch|_drSw/.test(S0));
  if (MAIN) {
    const regions = [["// DRILLROWS_START", "// DRILLROWS_END"], ["// DRILLDAYS_START", "// DRILLDAYS_END"], ["// DRILLADD_START", "// DRILLADD_END"], ["// RELAY_START", "// RELAY_END"],
      ["// RETRLIVE_START", "// RETRLIVE_END"], ["// PAPERDRILL_START", "// PAPERDRILL_END"], ["// RETRWEEK_START", "// RETRWEEK_END"], ["// DRILLSAVE_START", "// DRILLSAVE_END"]];
    const diff = regions.filter(r => sliceIn(S0, r[0], r[1]) !== sliceIn(OLD, r[0], r[1])).map(r => r[0]);
    const fns = ["drStripChips", "relayWeek", "_rlwChain", "_rlwApplyLocal", "_rlwWords", "retrLiveRelay", "pdOnDrillChecked", "relayUndo", "_rlwUndoUpd", "_rlwRun", "_rlwFire", "ceSaveField", "ceTogglePause", "renderCurrGrid"].filter(n => fnIn(S0, n) !== fnIn(OLD, n));
    const seam = s => { const i = s.indexOf("// DRILLADD_END\n"); return s.slice(i - 300, i + 300); };
    ok("stripped, every touched region and function equals origin/main's (the drill blocks, the door, the live pass, the paper drill, the strip)", diff.length === 0 && fns.length === 0 && seam(S0) === seam(OLD), diff.concat(fns));
  } else console.log("  (origin/main not readable here — compare skipped)");
  ok("the door changes are the marked lines only: relayWeek +1 line, _rlwChain one expression, _rlwApplyLocal +1 branch, _rlwWords +1 line / 2 sums, retrLiveRelay one argument",
    (fnIn(src, "relayWeek").match(/DRILLSWITCH/g) || []).length === 1 && (fnIn(src, "_rlwChain").match(/_rlwFromMode/g) || []).length === 2 && (fnIn(src, "_rlwApplyLocal").match(/DRILLSWITCH/g) || []).length === 1
    && (fnIn(src, "_rlwWords").match(/nSw/g) || []).length === 5 && (fnIn(src, "retrLiveRelay").match(/_rlwFromCtx/g) || []).length === 2);
}

// ── the world: the scheduler (builder, slot finder, live pass, co-op), the door, the Curriculum drill blocks, from a given source ──
function worldCode(S) {
  const parts = [
    "var ceEditKid=null, ceEditKey=null, retrAdminLocal=null, lastTasksWrite=0;",
    sliceIn(S, "// RETRWEEK_START", "// RETRWEEK_END").replace(DEF_RE, "const RETR_WEEK_DEFAULT={};"),
    sliceIn(S, "// GWRETR_START", "// GWRETR_END"), sliceIn(S, "// SCHOOLEND_START", "// SCHOOLEND_END"),
    S.slice(S.indexOf("function dtSd("), S.indexOf("// ── what the day is")), sliceIn(S, "// RETRLIVE_START", "// RETRLIVE_END"),
    ["coopsMap", "_coopHasDate", "coopMomDay", "coopNoMomBaseFor", "coopTimedOn", "coopTimedNameFor", "coopDayRule", "coopDaySkips", "coopBlocksBase", "calToday",
      "retrSlotMinutes", "retrSettings", "ceSaveField", "stApplyLocal", "pdOnDrillChecked", "_pdDayIso", "_pdLogged", "noCoopDaysOf"].map(n => fnIn(S, n)).join("\n"),
    (S.match(/const RETR_DEFAULTS=\{[\s\S]*?\};/) || [""])[0], (S.match(/const _CWD_DAYS=\[[^\]]*\];/) || [""])[0],
    sliceIn(S, "// RELAY_START", "// RELAY_END"),
    sliceIn(S, "// DRILLROWS_START", "// DRILLROWS_END"), sliceIn(S, "// DRILLDAYS_START", "// DRILLDAYS_END"), sliceIn(S, "// DRILLADD_START", "// DRILLADD_END"),
    sliceIn(S, "// DRILLSAVE_START", "// DRILLSAVE_END")];
  if (S.indexOf("// DRILLSWITCH_START") >= 0) parts.push(sliceIn(S, "// DRILLSWITCH_START", "// DRILLSWITCH_END"));
  parts.push("this.__pend=()=>_rlwPend; this.__log=()=>relayLogData; this.__setLog=(x)=>{ relayLogData=x; }; this.__resetPend=()=>{ _rlwPend=null; };");
  return parts.join("\n");
}
const LADDER = { k1: true, k2: true, k3: false };   // k3 has no sprint ladder → Drill + Match only (RETRFAM)
function world(S, nowIso) {
  let NOW = new Date(nowIso).getTime();
  class FD extends Date { constructor(...a) { if (!a.length) super(NOW); else super(...a); } static now() { return NOW; } }
  const E = {
    rulesData: { schoolDay: { defaultStart: "9:00 AM", defaultEnd: "4:00 PM", lunchStart: "12:00 PM", lunchEnd: "1:00 PM" } },
    masteryData: { retrievalPlan: {}, history: {} }, ROSTER: ["k1", "k2", "k3"],
    calendarData: { coops: {}, coopMomDays: {} },
    retrTracks: k => (LADDER[k] ? [{ key: "t" }] : []),
    gwParseDate: s => new FD(s + "T12:00:00"),
    mlMomSpan: (t, s, d) => [s, s + (d == null ? (t.dur || 20) : d)],
    stIsoOk: s => /^\d{4}-\d{2}-\d{2}$/.test(String(s || "")), stDsOf: dn => ISO[dn] || null,
    _todayDay: "wednesday", DAY_DT: clone(DT), currData: { subjects: {} }, checked: {}, claimed: {},
    weekData: { tasks: [] }, WK: "week45", MEAS: {}, PD: {},
    gwRules: () => ({ schoolStart: 540, schoolEnd: 960, lunchStart: 720, lunchEnd: 780 }),
    cap: s => String(s).charAt(0).toUpperCase() + String(s).slice(1), esc,
    KID_COLOR: { k3: "#2563eb" }, HA_LS: { setItem: () => {}, getItem: () => null }, momHere: () => true,
    mstOwnedIds: () => null, mastIsNeverDrill: () => false, mastMatchDecks: () => ["a"],
    mastMeasuredDrillMin: k => E.MEAS[k] || null, pdRecs: k => E.PD[k] || {}, _pdIso: d => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"),
    effectiveDay: t => t.day, sv: () => {}, renderAll: () => {}, haClaimSchedLock: (n, cb) => cb(() => {}), cascadeIntraWeek: () => {}, runCascade: () => {},
    dbg: () => {}, toMin, fromMin, Date: FD, Math, Object, JSON, String, Number, Array, parseInt, parseFloat, isNaN, Set, Map, RegExp, console,
  };
  E.W = []; E.T = []; E.TOAST = []; E.RP = [];
  E.db = { ref: p => ({ update: v => E.W.push(["UPDATE " + (p == null ? "/" : p), clone(v)]), set: v => E.W.push(["SET " + p, clone(v)]), remove: () => E.W.push(["REMOVE " + p]) }) };
  E._dryRun = () => false;
  E.gwShowToast = m => E.TOAST.push(m);
  E.setTimeout = (fn, ms) => { E.T.push({ fn, ms }); return E.T.length; }; E.clearTimeout = () => {};
  E.requestAnimationFrame = () => {};
  vm.createContext(E);
  new vm.Script(worldCode(S)).runInContext(E);
  E.__setNow = iso => { NOW = new Date(iso).getTime(); };
  // pass B's subject re-lay, the way reprojectSubjectWeek runs a daily (RELAY3D): the generator wants nothing for a paused
  // subject, so _rlwDailyDiff takes its open cards off on the eligible days of the mode the door hands it
  E.reprojectSubjectWeek = function (kid, sk, why, opts) {
    E.RP.push({ kid, sk, why, mode: opts && opts.relayFrom, daily: !!(opts && opts.daily) });
    const n = new FD(), s = (E.currData.subjects[kid] || {})[sk] || {};
    const want = s.paused ? [] : DAYS.map(d => ({ who: kid, subjectKey: sk, day: d, dur: s.minutes || 20, title: s.display || sk, mom: s.mom || "none" }));
    const r = E._rlwDailyDiff(kid, sk, E.weekData.tasks, want, { todayDay: E._todayDay, nowMin: n.getHours() * 60 + n.getMinutes(), checked: E.checked, claimed: E.claimed, toMin, fromMin, mode: opts.relayFrom, days: DAYS.concat(["saturday"]), rules: "" });
    E.weekData.tasks = r.tasksAfter;
    E.W.push(["UPDATE " + E.WK + "/tasks (pass B)", clone(r.upd)]);
    if (opts && typeof opts.then === "function") opts.then(r.summary);
  };
  return E;
}
// fire the re-lay door's pending 2 s wait (the last one queued)
function fireRelay(E) { const t = E.T.filter(x => x.ms === 2000).pop(); if (!t) return false; E.T = E.T.filter(x => x !== t); t.fn(); return true; }

// a child's old-style subject and the week on the board (Mon–Fri): math 9:00, Drills 9:30, reading 10:00, science 1:00, Closing 2:00
const OLD_SUB = { display: "Drills", tracking: "daily", mom: "required", minutes: 10 };
function weekTasks(kid, o) {
  o = o || {}; const T = [];
  DAYS.forEach(d => {
    T.push({ id: "m_" + d, who: kid, day: d, time: "9:00 AM", dur: 30, title: "Math", subjectKey: "math", mom: "none" });
    if (!(o.noOld || []).includes(d)) T.push({ id: "d_" + d, who: kid, day: d, time: (o.oldAt && o.oldAt[d]) || "9:30 AM", dur: 10, title: "Drills", subjectKey: "drills", mom: "required" });
    T.push({ id: "r_" + d, who: kid, day: d, time: "10:00 AM", dur: 30, title: "Reading", subjectKey: "reading", mom: "none" });
    T.push({ id: "s_" + d, who: kid, day: d, time: "1:00 PM", dur: 45, title: "Science", subjectKey: "science", mom: "none" });
    T.push({ id: "c_" + d, who: kid, day: d, time: "2:00 PM", dur: 10, title: "Closing Notebook", subjectKey: "closing_nb", mom: "none" });
  });
  return T;
}
function swWorld(nowIso, o) {
  o = o || {};
  const E = world(src, nowIso);
  E.currData = { subjects: { k3: Object.assign({ drills: Object.assign({}, OLD_SUB, o.sub || {}), math: { display: "Math", lessonSeq: ["a"] } }, o.subs || {}) } };
  E.masteryData = { retrievalPlan: clone(o.plan || {}), history: {} };
  E.weekData = { tasks: o.tasks || weekTasks("k3", o) };
  E.checked = clone(o.checked || {}); E.claimed = clone(o.claimed || {});
  if (o.coop) E.calendarData = clone(o.coop);
  return E;
}
const linesOf = (E, kid, sk) => E.drSwLines(kid, E.drSwPlan(kid, sk));
const has = (L, re) => L.some(l => re.test(l));

// ───────────────────────────────────────────────────────────────────────────────────────────────
console.log("1. REPLAY: no old-style subject → the strip, the builder, the live pass and the door are origin/main's");
{
  const A = world(src, "2026-11-04T10:00:00"), B = world(OLD, "2026-11-04T10:00:00");
  const R = rng(20261124); const pick = a => a[Math.floor(R() * a.length)];
  const KINDS = ["drill", "match", "sprint", "recheck", "off"];
  const randPlan = () => { const p = {}; ["k1", "k2", "k3"].forEach(k => { if (R() < 0.2) return; const w = {}, w2 = {}, w3 = {}; D3.forEach(d => { w[d] = pick(KINDS); if (R() < 0.5) w2[d] = pick(KINDS); if (R() < 0.25) w3[d] = pick(KINDS); });
    p[k] = { week: w }; if (R() < 0.7) p[k].week2 = w2; if (R() < 0.4) p[k].week3 = w3; if (R() < 0.2) p[k].pausedKinds = R() < 0.5 ? { drill: true } : { match: { pauseFrom: "2026-11-03", resumeOn: "2026-11-06" } }; });
    return p; };
  const randCoop = () => R() < 0.5 ? { coops: {}, coopMomDays: {} } : { coops: { c1: { name: "Co-op", mode: "timed", kids: ["k1", "k3"].filter(() => R() < 0.7), dates: [pick(Object.values(ISO))], noMomBase: R() < 0.8 ? undefined : false } }, coopMomDays: R() < 0.2 ? { "2026-11-05": true } : {} };
  // subjects that are NOT a running old-style subject: other keys, and drills keys that fail one §5.1 test
  const notOld = [{}, { math: { display: "Math", tracking: "daily" } }, { drills: Object.assign({}, OLD_SUB, { paused: true }) }, { drills: Object.assign({}, OLD_SUB, { study: "s1" }) },
    { drills: Object.assign({}, OLD_SUB, { tracking: "pace" }) }, { drillsx: Object.assign({}, OLD_SUB) }, { mydrills: Object.assign({}, OLD_SUB) }];
  const CLOCKS = ["2026-11-04T08:00:00", "2026-11-04T11:00:00", "2026-11-04T16:30:00"];
  let stripSame = 0, stripN = 0, buildSame = 0, liveSame = 0, N = 0, firstBad = null;
  for (let i = 0; i < 1100; i++) {
    const plan = randPlan(), coop = randCoop(), subs = pick(notOld), clock = pick(CLOCKS), mom = R() < 0.85;
    [A, B].forEach(E => { E.__setNow(clock); E.masteryData = { retrievalPlan: clone(plan), history: {} }; E.calendarData = clone(coop); E.currData = { subjects: { k1: clone(subs), k3: clone(subs) } }; E.momHere = () => mom; });
    ["k1", "k3"].forEach(k => { stripN++; const a = A.drStripChips(k), b = B.drStripChips(k); if (a === b) stripSame++; else if (!firstBad) firstBad = { k, a, b }; });
    // the builder
    const base = []; ["k1", "k2", "k3"].forEach(k => DAYS.forEach(d => { if (R() < 0.9) base.push({ id: "x_" + k + d, who: k, day: d, time: "9:00 AM", dur: 30, title: "Work", subjectKey: "math" }, { id: "cl_" + k + d, who: k, day: d, time: "11:00 AM", dur: 10, title: "Closing Notebook", subjectKey: "closing_nb" }); }));
    const bld = E => { const T = clone(base), dates = {}; const sorted = DAYS.map(dn => { dates[dn] = "x"; return ISO[dn]; }); E.gwInjectRetrieval(T, sorted, WDAY_MAP, new Set(), dates, doy); return J(T); };
    if (bld(A) === bld(B)) buildSame++;
    // the live pass, inside a plain retrieval run and a mixed one (nobody marks it)
    const live = E => { E.weekData = { tasks: clone(base) }; E.W = []; const r = E.retrLiveRelay({ whys: R() < 0.5 ? ["retrieval"] : ["retrieval", "coop-mom"], retr: ["k1", "k2", "k3"] }); return J([E.weekData.tasks, r, E.W]); };
    const st = R(); R.s = st;
    if (live(A) === live(B)) liveSame++;
    N++;
  }
  ok("the strip's card-practice chips: byte-identical for " + stripN + " child-worlds with no running old-style subject (other keys, paused, study-linked, not daily), Mom here or not", stripSame === stripN, firstBad);
  ok("the builder (gwInjectRetrieval): byte-identical over " + N + " random plans × co-op worlds × three clocks", buildSame === N, buildSame);
  ok("the live pass (retrLiveRelay inside a run nobody marked): byte-identical over the same " + N + " worlds (cards, return, writes)", liveSame === N, liveSame);

  // the door, for every run nobody marks
  let pendSame = 0, chainSame = 0, wordsSame = 0, applySame = 0;
  const WHYS = ["curriculum", "retrieval", "kidoff", "daytimes", "coop-mom", "sweep", "saturday"];
  for (let i = 0; i < 400; i++) {
    const calls = []; const n = 1 + Math.floor(R() * 4);
    for (let j = 0; j < n; j++) calls.push([pick(WHYS), { label: R() < 0.7 ? "L" + Math.floor(R() * 3) : undefined, today: R() < 0.2, retr: R() < 0.4 ? [pick(["k1", "k3"])] : undefined,
      subjects: R() < 0.5 ? [{ kid: "k3", sk: pick(["math", "drills"]) }] : undefined, undo: R() < 0.5 ? [{ p: "calendar/x/" + Math.floor(R() * 3), gone: R() < 0.5, was: 1 }] : undefined }]);
    const pend = E => { E.__resetPend(); E.T = []; calls.forEach(c => E.relayWeek(c[0], clone(c[1]))); return J(E.__pend()); };
    if (pend(A) === pend(B)) pendSame++;
    const clock = pick(["2026-11-04T08:00:00", "2026-11-04T11:00:00", "2026-11-04T16:30:00", "2026-11-07T10:00:00"]);
    const chain = E => { E.__setNow(clock); E.RP = []; E.currData = { subjects: { k3: { drills: Object.assign({}, OLD_SUB), math: Object.assign({}, OLD_SUB, { display: "M" }) } } }; E.weekData = { tasks: weekTasks("k3") };
      const p = clone(JSON.parse(pend(E))); let done = 0; E._rlwChain(p.subjects || [], p, () => { done++; }); return J([E.RP, done]); };
    if (chain(A) === chain(B)) chainSame++;
    const e = { label: "x", why: [pick(WHYS), pick(WHYS)].join(","), moves: R() < 0.5 ? [{ who: "k3" }] : [], removed: [0, 1, 2].filter(() => R() < 0.5).map(() => ({ subjectKey: pick(["drills", "drills_b", "retrieval", "math"]), day: pick(["saturday", "monday"]) })), added: R() < 0.5 ? ["a"] : [], undone: R() < 0.2 };
    if (A._rlwWords(clone(e)) === B._rlwWords(clone(e))) wordsSame++;
    const p = pick(["calendar/coopMomDays/2026-11-04", "calendar/kidOverrides/k3/2026-11-04", "config/rules/schoolDay/byDate/2026-11-04", "curriculum/subjects/k3/drills/paused", "weekConfig/45/x", "week45/babysitter/x", "other/thing"]);
    const v = R() < 0.4 ? null : { a: Math.floor(R() * 9) };
    const apply = E => { const tw = []; E._twsApplyLocal = (pp, vv) => tw.push([pp, vv]); E.calendarData = { coops: {}, coopMomDays: {} }; E.rulesData = { schoolDay: {} }; E.currData = { subjects: { k3: {} } }; E._rlwApplyLocal(p, clone(v)); return J([E.calendarData, E.rulesData, E.currData, tw, E.masteryData]); };
    if (apply(A) === apply(B)) applySame++;
  }
  ok("relayWeek: the pending run is byte-identical for 400 random call sequences that carry no `from`", pendSame === 400, pendSame);
  ok("_rlwChain: pass B's mode and calls identical for the same 400 runs at four clocks (before / mid / after school, a Saturday)", chainSame === 400, chainSame);
  ok("_rlwWords: the banner words identical for 400 random log entries of every other reason", wordsSame === 400, wordsSame);
  ok("_rlwApplyLocal: every non-mastery path (calendar, config, curriculum, weekConfig, babysitter, other) lands exactly as before", applySame === 400, applySame);
  // the paper-drill hook for every card that is not a Daily Drill practice card
  let pdSame = 0, pdN = 0;
  for (let i = 0; i < 300; i++) {
    const sk = pick(["drills", "drills_l", "drills_x", "retrieval", "math", "", "mydrills"]), kind = pick(["match", "sprint", "recheck", undefined]);
    const t = { id: "t" + i, who: "k3", day: pick(DAYS), subjectKey: sk, retrieval: sk === "retrieval" ? kind : undefined };
    const recs = { "20261104": { state: pick(["printed", "pending", "done"]), date: "2026-11-04", ids: ["a"] }, "20261103": { state: "printed", date: "2026-11-03", ids: ["a"] } };
    const run = E => { E.PD = { k3: clone(recs) }; E.W = []; E.masteryData = { history: R.h ? { k3: { "20261104": 1 } } : {} }; E.pdOnDrillChecked(clone(t)); return J([E.PD, E.W.map(w => w[0])]); };
    R.h = R() < 0.3; pdN++; if (run(A) === run(B)) pdSame++;
  }
  ok("pdOnDrillChecked: identical for " + pdN + " cards that are not a 🃏 Daily Drill card (old drills keys, Sprint, Re-checks, Match, other subjects)", pdSame === pdN, pdSame);
}

// ───────────────────────────────────────────────────────────────────────────────────────────────
console.log("2. spotting (§5.1): key drills / drills_*, no study link, every-day tracking, not paused — data only");
{
  const E = swWorld("2026-11-04T08:00:00");
  const sp = subs => { E.currData = { subjects: { k3: subs } }; return J(E.drSwSubs("k3")); };
  ok("drills, daily, no study, not paused → spotted", sp({ drills: Object.assign({}, OLD_SUB) }) === '["drills"]');
  ok("drills_l (a drills_ key) → spotted", sp({ drills_l: Object.assign({}, OLD_SUB) }) === '["drills_l"]');
  ok("drillsx / mydrills / Drills → not (the key test is drills or drills_…)", sp({ drillsx: Object.assign({}, OLD_SUB), mydrills: Object.assign({}, OLD_SUB), Drills: Object.assign({}, OLD_SUB) }) === "[]");
  ok("a study-session link → not", sp({ drills: Object.assign({}, OLD_SUB, { study: "sess1" }) }) === "[]");
  ok("not every-day tracking (tracking missing / pace) → not", sp({ drills: Object.assign({}, OLD_SUB, { tracking: undefined }) }) === "[]" && sp({ drills: Object.assign({}, OLD_SUB, { tracking: "pace" }) }) === "[]");
  ok("paused → not (and the offer is gone)", sp({ drills: Object.assign({}, OLD_SUB, { paused: true }) }) === "[]" && E.drSwOfferHtml("k3") === "");
  ok("the display name plays no part (\"Flash cards\" with key drills → spotted)", sp({ drills: Object.assign({}, OLD_SUB, { display: "Flash cards" }) }) === '["drills"]');
  ok("the same test as DRILLADD's daOldDrills (one spotting rule in the app)", /&&\/\^drills\(_\|\$\)\/\.test\(k\)&&!s\.study&&s\.tracking==="daily"&&!s\.paused/.test(fnIn(src, "drSwSubs")) && /\/\^drills\(_\|\$\)\/\.test\(k\)&&!s\.study&&s\.tracking==="daily"&&!s\.paused/.test(fnIn(src, "daOldDrills")));
  E.currData = { subjects: { k3: { drills: Object.assign({}, OLD_SUB) } } };
  ok("Mom here → the offer line; not Mom → \"\"", /dr-sw-go/.test(E.drSwOfferHtml("k3")) && (E.momHere = () => false, E.drSwOfferHtml("k3") === ""));
}

// ───────────────────────────────────────────────────────────────────────────────────────────────
console.log("3. the confirm's text, for this child");
{
  // the builder's own spread, run from its own source line (resolveWeekSlots)
  const rws = fnIn(src, "resolveWeekSlots"), line = (rws.match(/for\(let i=0;i<_tpw;i\+\+\)\{[^\n]*?runDates\.push\(dd\); \}/) || [""])[0];
  ok("the builder's spread line is where the switch says it is (resolveWeekSlots)", !!line, line);
  const spread = new Function("matchDates", "_tpw", "let runDates=[]; " + line + " return runDates;");
  const E0 = swWorld("2026-11-04T08:00:00"); const R = rng(7); let same = 0, n = 0;
  const AB = { mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri" };
  for (let i = 0; i < 300; i++) {
    const al = D3.filter(() => R() < 0.6), base = al.length ? al : D3, tpw = Math.floor(R() * 6);
    const sd = E0.drSwDays({ allowedDays: al.map(d => AB[d]), timesPerWeek: tpw });
    const want = (tpw > 0 && tpw < base.length) ? spread(base, tpw) : base;
    n++; if (J(sd.days) === J(want)) same++;
  }
  ok("fewer times a week than days → exactly the days the builder's spread picks (300 random day sets × 0–5 times)", same === n, same);

  let E = swWorld("2026-11-04T08:00:00");
  let L = linesOf(E, "k3", "drills");
  ok("every-day: \"Days: 🃏 Daily Drill goes on Mon Tue Wed Thu Fri — the days “Drills” runs now.\"", L[0] === "Days: \u{1F0CF} Daily Drill goes on Mon Tue Wed Thu Fri — the days “Drills” runs now.", L);
  ok("minutes: the usual Daily Drill time and the old number, plainly — \"Length: 5 min, the usual 🃏 Daily Drill time — “Drills” is 10 min now. After K3’s timed drill sittings it follows K3’s own measured time.\"",
    has(L, /^Length: 5 min, the usual \u{1F0CF} Daily Drill time — “Drills” is 10 min now\. After K3’s timed drill sittings it follows K3’s own measured time\.$/u), L);
  E.MEAS.k3 = 7; L = linesOf(E, "k3", "drills");
  ok("…after timed sittings: \"Length: 7 min, the usual 🃏 Daily Drill time (K3’s own measured drill time) — “Drills” is 10 min now.\"", has(L, /^Length: 7 min, the usual \u{1F0CF} Daily Drill time \(K3’s own measured drill time\) — “Drills” is 10 min now\.$/u), L);
  E.MEAS.k3 = null;
  ok("time of day: the end of the school day, before the Closing Notebook", has(L, /^Time of day: it moves to the end of K3’s school day, just before the Closing Notebook \(or an earlier free gap if the end is full\)\./));
  ok("co-op (old Mom-required, Daily Drill Mom-run): \"Co-op days: no change — like “Drills” now, it stays off a co-op day when “No Mom-required lessons” is ticked.\"", has(L, /^Co-op days: no change — like “Drills” now, it stays off a co-op day when “No Mom-required lessons” is ticked\.$/));
  ok("paused, not deleted: its card, history and Workflow Order place stay", has(L, /^“Drills” is paused, not deleted — its card, its history and its place in the Workflow Order stay; it rests in the strip as ⏸ Drills\.$/));
  ok("how to go back: ↩ Undo for 15 minutes; later ▶ Resume and turn Daily Drill off or ⏸ pause it", has(L, /^Changed your mind\? ↩ Undo on the day banner puts it all back for 15 minutes\. Later: ▶ Resume “Drills” on its card, and turn \u{1F0CF} Daily Drill off \(or ⏸ pause it\) on its line\.$/u));
  ok("before school: \"Starts today: today’s “Drills” card comes off and 🃏 Daily Drill takes its place (school hasn’t started yet).\"", has(L, /^Starts today: today’s “Drills” card comes off and \u{1F0CF} Daily Drill takes its place \(school hasn’t started yet\)\.$/u));
  ok("no Saturday / full-day / already-on / pause line when none applies", !has(L, /Saturday|skipped|already on|paused for|set to pause/));

  E = swWorld("2026-11-04T08:00:00", { sub: { timesPerWeek: 3 } }); L = linesOf(E, "k3", "drills");
  ok("3 times a week on Mon–Fri: \"Days: “Drills” runs 3 times a week on Mon Tue Wed Thu Fri, and the week builder spreads that to Mon Wed Fri — so 🃏 Daily Drill goes on Mon Wed Fri.\"", L[0] === "Days: “Drills” runs 3 times a week on Mon Tue Wed Thu Fri, and the week builder spreads that to Mon Wed Fri — so \u{1F0CF} Daily Drill goes on Mon Wed Fri.", L);
  E = swWorld("2026-11-04T08:00:00", { sub: { allowedDays: ["Mon", "Tue", "Thu", "Sat"], timesPerWeek: 2 } }); L = linesOf(E, "k3", "drills");
  ok("2 times on Mon Tue Thu + Saturday: Mon Thu, and \"Saturday isn’t carried over — card practice runs Mon–Fri.\"", L[0] === "Days: “Drills” runs 2 times a week on Mon Tue Thu, and the week builder spreads that to Mon Thu — so \u{1F0CF} Daily Drill goes on Mon Thu." && has(L, /^Saturday isn’t carried over — card practice runs Mon–Fri\.$/), L);
  E = swWorld("2026-11-04T08:00:00", { sub: { allowedDays: ["Mon", "Wed", "Sat"] } }); L = linesOf(E, "k3", "drills");
  ok("a Saturday on an every-day subject: named, not carried over; its weekdays carried", L[0] === "Days: \u{1F0CF} Daily Drill goes on Mon Wed — the days “Drills” runs now." && has(L, /^Saturday isn’t carried over/), L);

  const full = { k3: { week: { mon: "match", tue: "off", wed: "match", thu: "match", fri: "off" }, week2: { thu: "sprint" }, week3: { thu: "recheck" } } };
  E = swWorld("2026-11-04T08:00:00", { plan: full }); L = linesOf(E, "k3", "drills"); const p = E.drSwPlan("k3", "drills");
  ok("a day already holding three kinds is skipped and named: \"Thursday is skipped — it already has three: 🎯 Match & Play, 🏃 Sprint and 📅 Sprint Re-checks. Turn one off on its line, then turn 🃏 Daily Drill on for Thursday.\"",
    L[0] === "Days: \u{1F0CF} Daily Drill goes on Mon Tue Wed Fri." && has(L, /^Thursday is skipped — it already has three: \u{1F3AF} Match & Play, \u{1F3C3} Sprint and \u{1F4C5} Sprint Re-checks\. Turn one off on its line, then turn \u{1F0CF} Daily Drill on for Thursday\.$/u)
    && J(p.on) === J(["mon", "tue", "wed", "fri"]) && J(p.full.map(f => f.day)) === '["thu"]', L);
  ok("…placed by drDaysMap's own rule (week → week2 → week3): week {match,drill,match,match,drill} week2 {mon:drill,wed:drill,thu:sprint} week3 {thu:recheck}",
    J(p.week) === J({ mon: "match", tue: "drill", wed: "match", thu: "match", fri: "drill" }) && J(p.week2) === J({ mon: "drill", wed: "drill", thu: "sprint" }) && J(p.week3) === J({ thu: "recheck" }), [p.week, p.week2, p.week3]);
  ok("…the offer line drops \"same days\" when a day is skipped", /Switch it to \u{1F0CF} Daily Drill\.</u.test(E.drSwOfferHtml("k3")) && !/same days/.test(E.drSwOfferHtml("k3")));
  E = swWorld("2026-11-04T08:00:00"); ok("…and says \"— same days.\" when every day carries", /Switch it to \u{1F0CF} Daily Drill — same days\.</u.test(E.drSwOfferHtml("k3")));

  E = swWorld("2026-11-04T08:00:00", { plan: { k3: { week: { mon: "off", tue: "drill", wed: "off", thu: "drill", fri: "match" } } } }); L = linesOf(E, "k3", "drills");
  ok("Daily Drill already on Tue and Thu: \"🃏 Daily Drill is already on Tue Thu — those days stay as they are.\"; the five days still listed", has(L, /^\u{1F0CF} Daily Drill is already on Tue Thu — those days stay as they are\.$/u) && L[0] === "Days: \u{1F0CF} Daily Drill goes on Mon Tue Wed Thu Fri — the days “Drills” runs now.", L);
  ok("…and what is written keeps them: week {drill,drill,drill,drill,match} week2 {fri:drill}", (p2 => J(p2.week) === J({ mon: "drill", tue: "drill", wed: "drill", thu: "drill", fri: "match" }) && J(p2.week2) === J({ fri: "drill" }))(E.drSwPlan("k3", "drills")), E.drSwPlan("k3", "drills"));

  E = swWorld("2026-11-04T08:00:00", { plan: { k3: { week: { mon: "drill", tue: "off", wed: "off", thu: "off", fri: "off" }, pausedKinds: { drill: true } } } }); L = linesOf(E, "k3", "drills");
  ok("Daily Drill ⏸ paused (plain): \"⏸ 🃏 Daily Drill is paused for K3. Switching doesn’t lift that: no drill card goes on K3’s paused days — ▶ Resume on its line brings it back.\"", has(L, /^⏸ \u{1F0CF} Daily Drill is paused for K3\. Switching doesn’t lift that: no drill card goes on K3’s paused days — ▶ Resume on its line brings it back\.$/u), L);
  E = swWorld("2026-11-04T08:00:00", { plan: { k3: { pausedKinds: { drill: { pauseFrom: "2026-11-01", resumeOn: "2026-11-09" } } } } }); L = linesOf(E, "k3", "drills");
  ok("Daily Drill paused with dates: \"… paused for K3 until Nov 8. … — it comes back by itself on Nov 9.\"", has(L, /^⏸ \u{1F0CF} Daily Drill is paused for K3 until Nov 8\. Switching doesn’t lift that: no drill card goes on K3’s paused days — it comes back by itself on Nov 9\.$/u), L);
  E = swWorld("2026-11-04T08:00:00", { plan: { k3: { pausedKinds: { drill: { pauseFrom: "2026-12-01", resumeOn: "2027-01-04" } } } } }); L = linesOf(E, "k3", "drills");
  ok("a pause set to start later: \"⏸ 🃏 Daily Drill is set to pause (⏸ pauses Dec 1 – Jan 3). …\"", has(L, /^⏸ \u{1F0CF} Daily Drill is set to pause \(⏸ pauses Dec 1 – Jan 3\)\. Switching doesn’t lift that/u), L);

  E = swWorld("2026-11-04T08:00:00", { sub: { mom: "none" } }); L = linesOf(E, "k3", "drills");
  ok("co-op, old subject NOT Mom-required: says it ran on co-op days and Daily Drill stays off a ticked one (the truth for this child)", has(L, /^Co-op days: “Drills” isn’t Mom-required, so it runs on co-op days now; \u{1F0CF} Daily Drill is done with Mom, so it stays off a co-op day when “No Mom-required lessons” is ticked\.$/u), L);
  E = swWorld("2026-11-04T08:00:00", { sub: { coopDay: "skip" } }); L = linesOf(E, "k3", "drills");
  ok("co-op, old subject skips co-op days: says so", has(L, /^Co-op days: “Drills” skips co-op days now; \u{1F0CF} Daily Drill stays off a co-op day only when “No Mom-required lessons” is ticked\.$/u), L);
  ok("…the co-op claim is retrDayKindsOn's: Daily Drill is a kind retrSlotMom calls \"required\", so retrCoopOff leaves it off a ticked co-op day", E.retrSlotMom("drill") === "required" && /retrSlotMom\(kind\)==="required"&&!!coopNoMomBaseFor\(kid,ds\)/.test(fnIn(src, "retrCoopOff")));
  E = swWorld("2026-11-04T08:00:00", { sub: { allowedDays: ["Mon", "Tue", "Wed", "Fri"], noCoopDays: ["Mon", "Tue", "Wed", "Thu"] } }); L = linesOf(E, "k3", "drills");
  ok("a weeks-without-co-op day set: named; the plan keeps one set of days", has(L, /^In weeks without co-op “Drills” uses Mon Tue Wed Thu; card practice keeps the same days every week\.$/), L);

  E = swWorld("2026-11-04T11:00:00"); L = linesOf(E, "k3", "drills");
  ok("mid-day: \"Starts Thursday: today keeps its “Drills” card (school has started), so K3 never gets two drill cards in one day.\"", has(L, /^Starts Thursday: today keeps its “Drills” card \(school has started\), so K3 never gets two drill cards in one day\.$/), L);
  E = swWorld("2026-11-04T16:30:00"); L = linesOf(E, "k3", "drills");
  ok("after school: the same — starts Thursday", has(L, /^Starts Thursday: today keeps its “Drills” card \(school has started\)/), L);
  E = swWorld("2026-11-04T08:00:00", { checked: { d_wednesday: 1 } }); L = linesOf(E, "k3", "drills");
  ok("before school with today's card already checked: \"Starts Thursday: today keeps its “Drills” card (it’s already started or done) …\"", has(L, /^Starts Thursday: today keeps its “Drills” card \(it’s already started or done\), so K3 never gets two drill cards in one day\.$/), L);
  E = swWorld("2026-11-06T16:30:00"); E._todayDay = "friday"; L = linesOf(E, "k3", "drills");
  ok("Friday after school: \"Nothing changes on this week’s cards — it starts with next week’s.\" and no ↩ Undo promised", has(L, /^Nothing changes on this week’s cards — it starts with next week’s\.$/) && has(L, /^To go back: ▶ Resume “Drills”/) && !has(L, /↩ Undo/), L);

  E = swWorld("2026-11-04T08:00:00", { subs: { drills_b: Object.assign({}, OLD_SUB, { display: "Drills B" }) } });
  const two = E.drSwOfferHtml("k3");
  ok("two running old-style subjects: no Switch, one line says why", !/dr-sw-go/.test(two) && /“Drills” and “Drills B” are set up the older way\. The switch to \u{1F0CF} Daily Drill moves one at a time/u.test(two) && E.drSwOpen("k3", "drills") === true && !/dr-sw-do/.test(E.drSwSheetHtml("k3", "drills")), two);
  E = swWorld("2026-11-04T08:00:00", { plan: { k3: { week: { mon: "match", tue: "match", wed: "match", thu: "match", fri: "match" }, week2: { mon: "sprint", tue: "sprint", wed: "sprint", thu: "sprint", fri: "sprint" }, week3: { mon: "recheck", tue: "recheck", wed: "recheck", thu: "recheck", fri: "recheck" } } } });
  ok("every day full: no ✓ Switch on the confirm (it would leave the child with no drill)", !/dr-sw-do/.test(E.drSwSheetHtml("k3", "drills")) && /would go on no day/.test(E.drSwSheetHtml("k3", "drills")));
  E = swWorld("2026-11-04T08:00:00");
  const sh = E.drSwSheetHtml("k3", "drills");
  ok("the confirm: its title, \"Nothing changes until you tap ✓ Switch.\", the same list as What changes?, Not now / ✓ Switch", /Switch “Drills” to \u{1F0CF} Daily Drill\?/u.test(sh) && /Nothing changes until you tap ✓ Switch\./.test(sh) && sh.indexOf(E._drSwList("k3", E.drSwPlan("k3", "drills"))) > 0 && /ce-btn-cancel[^>]*>Not now</.test(sh) && /dr-sw-do[^>]*>✓ Switch</.test(sh));
  E.drSwWhat("k3", "drills");
  ok("What changes? opens the same list under the line (Hide closes it)", E.drSwOfferHtml("k3").indexOf(E._drSwList("k3", E.drSwPlan("k3", "drills"))) > 0 && /dr-sw-what[^>]*>Hide</.test(E.drSwOfferHtml("k3")) && (E.drSwWhat("k3", "drills"), !/dr-sw-list/.test(E.drSwOfferHtml("k3"))));
}

// ───────────────────────────────────────────────────────────────────────────────────────────────
console.log("4. the writes: exactly these paths and values, one run through the door; nothing in a dry run or for anyone but Mom");
{
  const plan = { k3: { week: { mon: "match", tue: "off", wed: "match", thu: "off", fri: "match" }, week2: { tue: "sprint" }, settings: { gate_pct: 80 } } };
  let E = swWorld("2026-11-04T08:00:00", { plan });
  const rel = []; const realRelay = E.relayWeek; E.relayWeek = (w, i) => { rel.push([w, clone(i)]); return realRelay(w, i); };
  const before = clone(E.masteryData), subBefore = clone(E.currData.subjects.k3.drills);
  ok("✓ Switch → true", E.drSwOpen("k3", "drills") === true && E.drSwDo() === true);
  const W = E.W.map(w => w[0]);
  ok("ONE update at mastery/retrievalPlan/k3 = {week, week2} — the five days with drill placed, Row 2 cleaned; never settings, never slot_min_drill",
    J(E.W[0]) === J(["UPDATE mastery/retrievalPlan/k3", { week: { mon: "match", tue: "drill", wed: "match", thu: "drill", fri: "match" }, week2: { mon: "drill", tue: "sprint", wed: "drill", fri: "drill" } }]) && !J(E.W).includes("slot_min_drill") && !J(E.W).includes("settings"), E.W[0]);
  ok("then the subject's two leaves through ceSaveField: paused = true, pausedSince = now (ISO), each with curriculum/lastEdit (ceSaveField's own)",
    J(W.slice(1)) === J(["SET curriculum/subjects/k3/drills/paused", "SET curriculum/lastEdit", "SET curriculum/subjects/k3/drills/pausedSince", "SET curriculum/lastEdit"]) && E.W[1][1] === true && E.W[3][1] === new E.Date().toISOString(), E.W);
  ok("nothing else written yet (the run waits its 2 s); no week3 (the third row was never used)", E.W.length === 5 && !J(E.W[0][1]).includes("week3"));
  ok("this device's copy: the plan mirrored (settings kept), the subject paused, pausedSince set", J(E.masteryData.retrievalPlan.k3) === J(Object.assign(clone(plan.k3), E.W[0][1])) && E.currData.subjects.k3.drills.paused === true && !!E.currData.subjects.k3.drills.pausedSince);
  ok("ONE relayWeek(\"drillswitch\"): pass B = the subject, pass R = the child, the Undo list, from = \"clock\" (before school)",
    rel.length === 1 && rel[0][0] === "drillswitch" && J(rel[0][1].subjects) === J([{ kid: "k3", sk: "drills" }]) && J(rel[0][1].retr) === '["k3"]' && rel[0][1].from === "clock" && /K3’s “Drills” is now Daily Drill/.test(rel[0][1].label), rel);
  ok("the Undo list: every leaf the tap wrote, as it was (week / week2 objects, paused gone, pausedSince gone)",
    J(rel[0][1].undo) === J([{ p: "mastery/retrievalPlan/k3/week", was: plan.k3.week }, { p: "mastery/retrievalPlan/k3/week2", was: plan.k3.week2 }, { p: "curriculum/subjects/k3/drills/paused", gone: true }, { p: "curriculum/subjects/k3/drills/pausedSince", gone: true }]), rel[0][1].undo);
  ok("no second run: the live-pass timer (retrLiveQueue's 6 s) was never queued — drPlanWrite ran without {rhythm}", !E.T.some(t => t.ms === 6000) && E.T.filter(t => t.ms === 2000).length === 1);
  ok("the toast says what happened, in plain words", E.TOAST[E.TOAST.length - 1] === "✓ “Drills” is now \u{1F0CF} Daily Drill for K3 — Mon Tue Wed Thu Fri. This week’s cards change in a moment.", E.TOAST);
  ok("the offer is gone (the subject is paused); the old chip is still in the strip's subject chips (paused dailies stay there with ⏸)", E.drSwOfferHtml("k3") === "" && /drSwOfferHtml\(kid\)/.test(fnIn(src, "drStripChips")) && /\(_pz\?'⏸ ':''\)/.test(fnIn(src, "renderCurrGrid")));
  ok("a second ✓ Switch writes nothing (no longer running the older way)", (E.W.length = 0, E.drSwOpen("k3", "drills") === false && (E.drSwKid = "k3", E.drSwSk = "drills", true)));

  // week3 used: the third slot is written
  E = swWorld("2026-11-04T08:00:00", { plan: { k3: { week: { mon: "match", tue: "match", wed: "match", thu: "match", fri: "match" }, week2: { mon: "sprint", tue: "sprint", wed: "sprint", thu: "sprint", fri: "sprint" } } } });
  E.drSwOpen("k3", "drills"); E.drSwDo();
  ok("two kinds already on every day → week3 written with drill, in the same one update", J(E.W[0]) === J(["UPDATE mastery/retrievalPlan/k3", { week: { mon: "match", tue: "match", wed: "match", thu: "match", fri: "match" }, week2: { mon: "sprint", tue: "sprint", wed: "sprint", thu: "sprint", fri: "sprint" }, week3: { mon: "drill", tue: "drill", wed: "drill", thu: "drill", fri: "drill" } }]), E.W[0]);

  // dry run / not Mom / db missing
  E = swWorld("2026-11-04T08:00:00", { plan }); const relD = []; E.relayWeek = (w, i) => relD.push(w); E._dryRun = () => true;
  const mBefore = clone(E.masteryData), cBefore = clone(E.currData);
  ok("?dryrun=1 → no write, no mirror change, no run; the confirm says preview mode and has no ✓ Switch", E.drSwOpen("k3", "drills") === true && E.drSwDo() === false && !E.W.length && !relD.length && J(E.masteryData) === J(mBefore) && J(E.currData) === J(cBefore)
    && /Preview mode — nothing can be saved here\./.test(E.drSwSheetHtml("k3", "drills")) && !/dr-sw-do/.test(E.drSwSheetHtml("k3", "drills")));
  E._dryRun = () => false; E.momHere = () => false;
  ok("not Mom (a kid's device, Dad's link where momHere is false) → nothing: no offer, the confirm won't open, the tap writes nothing", E.drSwOfferHtml("k3") === "" && E.drSwOpen("k3", "drills") === false && (E.drSwKid = "k3", E.drSwSk = "drills", E.drSwDo() === false) && !E.W.length && !relD.length && J(E.masteryData) === J(mBefore) && J(E.currData) === J(cBefore));
  E.momHere = () => true; E.db = null;
  ok("no database (offline copy) → nothing written, nothing mirrored", E.drSwDo() === false && J(E.masteryData) === J(mBefore) && J(E.currData) === J(cBefore));
}

// ───────────────────────────────────────────────────────────────────────────────────────────────
console.log("5. this week after the tap, through the real door — three clock cases, never two drill cards open on a day");
const open = (E, t) => !!t && !E.checked[t.id] && !E.claimed[t.id];
const ddId = (E, d) => E.retrLiveId("k3", "drill", ISO[d]);
function runSwitch(E, fireIso) {
  E.drSwOpen("k3", "drills"); const okTap = E.drSwDo();
  if (fireIso) E.__setNow(fireIso);
  const okFire = fireRelay(E);
  return okTap && okFire;
}
function noTwo(E, fromDay) {
  const bad = [];
  DAYS.slice(DAYS.indexOf(fromDay)).forEach(d => {
    const old = E.weekData.tasks.filter(t => t.day === d && t.subjectKey === "drills" && open(E, t)), dd = E.weekData.tasks.filter(t => t.id === ddId(E, d) && open(E, t));
    if (old.length && dd.length) bad.push(d);
  });
  return bad;
}
const cardOn = (E, d, sk) => E.weekData.tasks.filter(t => t.day === d && t.subjectKey === sk);
{
  const held = { checked: { m_monday: 1, d_monday: 1, d_tuesday: 1 }, claimed: { r_tuesday: 1 } };
  // before school
  let E = swWorld("2026-11-04T08:00:00", held); let T0 = clone(E.weekData.tasks);
  ok("before school (8:00): the tap fires one run", runSwitch(E) === true);
  ok("…pass B ran in \"fresh\" (today included) and pass R laid today: Wed / Thu / Fri — old card off, 🃏 Daily Drill on", J(E.RP.map(r => r.mode)) === '["fresh"]'
    && ["wednesday", "thursday", "friday"].every(d => !cardOn(E, d, "drills").length && cardOn(E, d, "retrieval").length === 1 && cardOn(E, d, "retrieval")[0].retrieval === "drill"), [E.RP, E.weekData.tasks.filter(t => t.subjectKey === "drills" || t.subjectKey === "retrieval").map(t => t.id + "@" + t.day + " " + t.time)]);
  ok("…Monday and Tuesday (past days, checked / claimed) are byte-identical", J(E.weekData.tasks.filter(t => /monday|tuesday/.test(t.day)).sort((a, b) => a.id < b.id ? -1 : 1)) === J(T0.filter(t => /monday|tuesday/.test(t.day)).sort((a, b) => a.id < b.id ? -1 : 1)));
  ok("…never both open on a day from today on", noTwo(E, "wednesday").length === 0, noTwo(E, "wednesday"));
  ok("…the Daily Drill card goes at the end of the day, before the Closing Notebook (re-timed to stay last); the usual 5 min, with Mom",
    (c => !!c && c.dur === 5 && c.mom === "required" && toMin(c.time) >= toMin("1:45 PM") && E.weekData.tasks.filter(t => t.day === "wednesday" && t.subjectKey === "closing_nb").every(cl => toMin(cl.time) >= toMin(c.time) + c.dur))(E.weekData.tasks.find(t => t.id === ddId(E, "wednesday"))), E.weekData.tasks.filter(t => t.day === "wednesday"));
  const e1 = Object.values(E.__log())[0];
  ok("…the banner line: \"🃏 K3’s “Drills” is now Daily Drill → 1 card moved · 3 taken off · 3 added\" style — the old cards are \"taken off\", never \"to next week\"", !!e1 && /taken off/.test(E._rlwWords(e1)) && !/to next week/.test(E._rlwWords(e1)) && /3 taken off/.test(E._rlwWords(e1)) && /3 added/.test(E._rlwWords(e1)), e1 && E._rlwWords(e1));
  // mid-day
  ["2026-11-04T11:00:00", "2026-11-04T16:30:00"].forEach(clock => {
    [{}, { oldAt: { wednesday: "2:30 PM" } }].forEach(var_ => {
      const E2 = swWorld(clock, Object.assign({}, held, var_)); const W0 = clone(E2.weekData.tasks.filter(t => t.day === "wednesday"));
      const lbl = (clock.endsWith("11:00:00") ? "mid-day (11:00)" : "after school (4:30)") + (var_.oldAt ? ", today's card later in the day (2:30, not started)" : ", today's card at 9:30 (started, unchecked)");
      ok(lbl + ": from tomorrow on both sides — pass B \"tomorrow\", today keeps its old card and gets no Daily Drill; Thu / Fri switched",
        runSwitch(E2) === true && J(E2.RP.map(r => r.mode)) === '["tomorrow"]' && cardOn(E2, "wednesday", "drills").length === 1 && !cardOn(E2, "wednesday", "retrieval").length
        && ["thursday", "friday"].every(d => !cardOn(E2, d, "drills").length && cardOn(E2, d, "retrieval").length === 1), E2.weekData.tasks.filter(t => t.subjectKey === "drills" || t.subjectKey === "retrieval").map(t => t.id + "@" + t.day));
      ok("…today's cards byte-identical, never both open on a day", J(E2.weekData.tasks.filter(t => t.day === "wednesday")) === J(W0) && noTwo(E2, "wednesday").length === 0);
    });
  });
  // the tap a second before school, the run after it began: both passes follow the run's clock
  E = swWorld("2026-11-04T08:59:00", held);
  ok("tap 8:59 (from \"clock\"), the run fires at 9:00:30: both passes take \"tomorrow\" — today keeps its old card, no Daily Drill today",
    runSwitch(E, "2026-11-04T09:00:30") === true && J(E.RP.map(r => r.mode)) === '["tomorrow"]' && cardOn(E, "wednesday", "drills").length === 1 && !cardOn(E, "wednesday", "retrieval").length && noTwo(E, "wednesday").length === 0, E.RP);
  // held before school: checked / claimed / Mom's part done
  [["checked", { checked: { d_wednesday: 1 } }], ["claimed", { claimed: { d_wednesday: 1 } }], ["Mom's part done", { momPart: true }]].forEach(c => {
    const o = clone(c[1]); const E3 = swWorld("2026-11-04T08:00:00", o);
    if (o.momPart) E3.weekData.tasks.find(t => t.id === "d_wednesday").momPartDone = true;
    const w0 = clone(E3.weekData.tasks.find(t => t.id === "d_wednesday"));
    ok("before school, today's old card " + c[0] + " → from tomorrow (from \"tomorrow\"): that card untouched, no Daily Drill today",
      runSwitch(E3) === true && J(E3.RP.map(r => r.mode)) === '["tomorrow"]' && J(E3.weekData.tasks.find(t => t.id === "d_wednesday")) === J(w0) && !cardOn(E3, "wednesday", "retrieval").length, E3.RP);
  });
  // a full-week replay: random held states and clocks — the rule holds every time
  const R = rng(99); let good = 0, N = 0, bad1 = null;
  for (let i = 0; i < 120; i++) {
    const clock = ["2026-11-04T08:00:00", "2026-11-04T10:15:00", "2026-11-04T13:30:00", "2026-11-04T16:30:00"][Math.floor(R() * 4)];
    const ck = {}, cl = {}; ["d_wednesday", "d_thursday", "m_wednesday", "r_thursday"].forEach(id => { if (R() < 0.25) ck[id] = 1; else if (R() < 0.15) cl[id] = 1; });
    const at = {}; if (R() < 0.5) at.wednesday = ["9:30 AM", "11:30 AM", "2:30 PM"][Math.floor(R() * 3)];
    const E4 = swWorld(clock, { checked: ck, claimed: cl, oldAt: at });
    const heldIds = Object.keys(ck).concat(Object.keys(cl)); const h0 = J(heldIds.map(id => E4.weekData.tasks.find(t => t.id === id)));
    runSwitch(E4); N++;
    const okk = noTwo(E4, "wednesday").length === 0 && J(heldIds.map(id => E4.weekData.tasks.find(t => t.id === id))) === h0;
    if (okk) good++; else if (!bad1) bad1 = { clock, ck, cl, at, tasks: E4.weekData.tasks.filter(t => t.subjectKey === "drills" || t.subjectKey === "retrieval") };
  }
  ok("replay, " + N + " random weeks (four clocks, random checked / claimed cards, random time of today's card): never both open on a day, every held card byte-identical", good === N, bad1);
}

// ───────────────────────────────────────────────────────────────────────────────────────────────
console.log("6. ↩ Undo: every leaf back, this device's copy back, the week's cards back");
{
  const plan = { k3: { week: { mon: "match", tue: "off", wed: "match", thu: "off", fri: "match" }, week2: { tue: "sprint" }, settings: { gate_pct: 80 } } };
  [["before school", "2026-11-04T08:00:00"], ["mid-day", "2026-11-04T11:00:00"]].forEach(c => {
    const E = swWorld(c[1], { plan, checked: { d_monday: 1 } });
    const m0 = clone(E.masteryData), s0 = clone(E.currData.subjects.k3.drills), t0 = J(clone(E.weekData.tasks).sort((a, b) => a.id < b.id ? -1 : 1));
    runSwitch(E);
    const e = Object.values(E.__log())[0];
    ok(c[0] + ": the run logged with its Undo list; the banner offers ↩ Undo", !!e && e.undo.length === 4 && /relayUndo\('/.test(E.relayLineHTML()), e);
    E.W = [];
    E.relayUndo(String(e.at));
    const up = (E.W.find(w => w[0] === "UPDATE /") || [])[1] || {};
    ok("…ONE multi-path update: the plan's week / week2 back to the old objects, paused and pausedSince removed (null), the cards back, the log marked undone",
      J(up["mastery/retrievalPlan/k3/week"]) === J(plan.k3.week) && J(up["mastery/retrievalPlan/k3/week2"]) === J(plan.k3.week2) && up["curriculum/subjects/k3/drills/paused"] === null && up["curriculum/subjects/k3/drills/pausedSince"] === null
      && Object.keys(up).some(k => /^week45\/tasks\//.test(k)) && Object.keys(up).some(k => /relayLog\/\d+\/undone$/.test(k)) && !Object.keys(up).some(k => /slot_min_drill|settings/.test(k)), up);
    ok("…this device's copy of the plan is back (masteryData — the door's new mastery branch), settings untouched", J(E.masteryData) === J(m0), [E.masteryData, m0]);
    ok("…this device's copy of the subject is back (no paused, no pausedSince)", J(E.currData.subjects.k3.drills) === J(s0), E.currData.subjects.k3.drills);
    ok("…this week's cards are back exactly (old cards returned, the Daily Drill cards gone, the Closing Notebooks' times back)", J(clone(E.weekData.tasks).sort((a, b) => a.id < b.id ? -1 : 1)) === t0);
  });
  // a plan with no saved rows before: the leaves are removed again
  const E = swWorld("2026-11-04T08:00:00"); runSwitch(E); const e = Object.values(E.__log())[0]; E.relayUndo(String(e.at));
  ok("no plan before the tap → Undo removes week / week2 again (gone), here and in the update", !E.masteryData.retrievalPlan.k3 || (!("week" in E.masteryData.retrievalPlan.k3) && !("week2" in E.masteryData.retrievalPlan.k3)), E.masteryData);
  ok("the mastery branch of _rlwApplyLocal copies the value (the log's object is never shared with this device's copy)", (() => { const A = world(src, "2026-11-04T08:00:00"); const v = { mon: "drill" }; A._rlwApplyLocal("mastery/retrievalPlan/k9/week", v); v.mon = "x"; return A.masteryData.retrievalPlan.k9.week.mon === "drill"; })());
}

// ───────────────────────────────────────────────────────────────────────────────────────────────
console.log("7. a ticked \"No Mom-required lessons\" co-op day: no drill card before, none after");
{
  const coop = { coops: { c1: { name: "Co-op", mode: "timed", kids: ["k3"], dates: [ISO.thursday] } }, coopMomDays: {} };
  // the old Mom-required subject has no card on Thursday (coopBlocksBase), the week as the builder lays it
  const E = swWorld("2026-11-04T08:00:00", { coop, noOld: ["thursday"] });
  ok("before: the old Mom-required subject is blocked there (coopBlocksBase) and the week has no drill card on Thursday", E.coopBlocksBase("k3", ISO.thursday, "drills") === true && !cardOn(E, "thursday", "drills").length && !cardOn(E, "thursday", "retrieval").length);
  ok("the confirm says co-op days don't change", has(linesOf(E, "k3", "drills"), /^Co-op days: no change/));
  runSwitch(E);
  ok("after: still none on Thursday — retrDayKindsOn leaves 🃏 Daily Drill off the ticked co-op day; Wed and Fri switched", !cardOn(E, "thursday", "drills").length && !cardOn(E, "thursday", "retrieval").length
    && E.retrDayKindsOn("k3", "thu", ISO.thursday).indexOf("drill") < 0 && E.retrDayKindsOn("k3", "wed", ISO.wednesday).indexOf("drill") >= 0 && cardOn(E, "wednesday", "retrieval").length === 1 && cardOn(E, "friday", "retrieval").length === 1);
  const E2 = swWorld("2026-11-04T08:00:00", { coop: { coops: coop.coops, coopMomDays: { [ISO.thursday]: true } } });
  runSwitch(E2);
  ok("Mom flipped Thursday to \"Mom's here\": the old subject runs there and so does the Daily Drill (same before and after)", E2.coopBlocksBase("k3", ISO.thursday, "drills") === false && cardOn(E2, "thursday", "retrieval").length === 1 && !cardOn(E2, "thursday", "drills").length);
}

// ───────────────────────────────────────────────────────────────────────────────────────────────
console.log("8. the paper-drill hook");
{
  const A = world(src, "2026-11-04T15:00:00"), B = world(OLD, "2026-11-04T15:00:00");
  const recs = () => ({ "20261104": { state: "printed", date: "2026-11-04", ids: ["a", "b"] } });
  const run = (E, t, hist) => { E.PD = { k3: recs() }; E.W = []; E.masteryData = { history: hist || {} }; E.pdOnDrillChecked(t); return { st: E.PD.k3["20261104"].state, W: E.W }; };
  const oldCard = { id: "d_wednesday", who: "k3", day: "wednesday", subjectKey: "drills" };
  const a = run(A, clone(oldCard)), b = run(B, clone(oldCard));
  ok("an old drills card checked on a printed paper-drill day → pending + ONE targeted write, exactly as before", a.st === "pending" && J(a.W.map(w => w[0])) === '["UPDATE mastery/k3_paperDrills/20261104"]' && J(a) === J(b), [a, b]);
  ok("…and with the drill already logged in the app → nothing, as before", J(run(A, clone(oldCard), { k3: { "20261104": 1 } })) === J(run(B, clone(oldCard), { k3: { "20261104": 1 } })) && run(A, clone(oldCard), { k3: { "20261104": 1 } }).st === "printed");
  const dd = { id: "2026d308_retr_drill_k3", who: "k3", day: "wednesday", subjectKey: "retrieval", retrieval: "drill" };
  const c = run(A, clone(dd)), d = run(B, clone(dd));
  ok("a checked 🃏 Daily Drill card now feeds the Grade list (pending + the same one write); origin/main ignored it", c.st === "pending" && J(c.W.map(w => w[0])) === '["UPDATE mastery/k3_paperDrills/20261104"]' && d.st === "printed" && !d.W.length, [c, d]);
  ["sprint", "recheck", "match"].forEach(k => { const r = run(A, Object.assign(clone(dd), { retrieval: k, id: "x_" + k })); ok("a 🏃/📅/🎯 " + k + " card does not trigger it", r.st === "printed" && !r.W.length); });
  ok("a retrieval card with no kind does not either", (r => r.st === "printed" && !r.W.length)(run(A, { id: "y", who: "k3", day: "wednesday", subjectKey: "retrieval" })));
  ok("dry run: the Daily Drill card marks this device's record only, no write (the hook's own guard)", (A._dryRun = () => true, (r => r.st === "pending" && !r.W.length)(run(A, clone(dd)))));
}

// ───────────────────────────────────────────────────────────────────────────────────────────────
console.log("9. the HTML: balanced, no ids, 44 px, wraps at phone width");
{
  const tagBal = h => ["div", "button", "span", "a", "ul", "li"].every(t => (h.match(new RegExp("<" + t + "[\\s>]", "g")) || []).length === (h.match(new RegExp("</" + t + ">", "g")) || []).length);
  const E = swWorld("2026-11-04T08:00:00", { plan: { k3: { week: { mon: "match", tue: "drill", wed: "match", thu: "match", fri: "off" }, week2: { thu: "sprint" }, week3: { thu: "recheck" }, pausedKinds: { drill: true } } }, sub: { allowedDays: ["Mon", "Tue", "Wed", "Thu", "Sat"], timesPerWeek: 3 } });
  E.drSwWhat("k3", "drills");
  const H = [E.drSwOfferHtml("k3"), E.drSwSheetHtml("k3", "drills"), E.drStripChips("k3")];
  E._dryRun = () => true; H.push(E.drSwSheetHtml("k3", "drills")); E._dryRun = () => false;
  const E2 = swWorld("2026-11-04T08:00:00", { subs: { drills_b: Object.assign({}, OLD_SUB) } }); H.push(E2.drSwOfferHtml("k3"));
  ok("every piece balanced (div, button, span, a, ul, li)", H.every(tagBal), H.map(tagBal));
  ok("no id attributes (nothing to duplicate; the sheet's wrap is made once by drSwRender)", H.every(h => !/\sid="/.test(h)));
  ok("every button of the switch is at least 44 px tall (the strip's own day-line chips are DRILLROWS' and unchanged)", H.map(h => h.replace(/<button class="dr-(row|empty)"[^>]*>/g, "")).every(h => (h.match(/<button[^>]*>/g) || []).every(b => /min-height:44px/.test(b))), H.map(h => (h.match(/<button[^>]*>/g) || []).filter(b => !/min-height:44px/.test(b))));
  ok("the offer wraps (flex-wrap, the text shrinks: flex:1 1 200px; min-width:0) and nothing has a fixed width wider than a phone", /display:flex;flex-wrap:wrap/.test(H[0]) && /flex:1 1 200px;min-width:0/.test(H[0]) && !H.some(h => /(^|[;"])\s*(min-)?width:\s*[4-9]\d\d+px/.test(h)));
  ok("the names are escaped (a display name with < & \" stays text)", (() => { const E3 = swWorld("2026-11-04T08:00:00", { sub: { display: "<b>Drill & \"go\"" } }); const h = E3.drSwOfferHtml("k3") + E3.drSwSheetHtml("k3", "drills"); return !/<b>/.test(h) && /&lt;b&gt;Drill &amp; &quot;go&quot;/.test(h); })());
  ok("the onclick arguments survive a quote in a key (escaped like the strip's own)", /drSwOpen\('k3','drills'\)/.test(H[0]));
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
