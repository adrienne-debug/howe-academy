/*
 * 🏫 COOPWEEKDAYS (Sarah's ask 2026-10-13): "Kenzie's math is 4 days a week on Mon, Tue, Wed and Fri. On co-op weeks
 * (co-op is Thursday) it has to be that way. But on weeks we DON'T have co-op I'd like all the 4-day-a-week subjects
 * on Mon, Tue, Wed, Thu so Friday is lighter … without moving each lesson by hand." A standing rule, never a hand move.
 *
 * subject.noCoopDays = the days in a week with NO co-op; allowedDays stays the co-op-week set; a missing field is
 * today's behaviour everywhere. Replay on the test_coopday fixtures (China-Grove timed co-op, Kenzie; WK1 has a co-op
 * Thursday 10/8, WK2 has none) through every day picker: the pure helper, the projection (_pjPatternRows /
 * projectPlans), the builder (cbMaterialize incl. its extension), the slot walker (resolveWeekSlots' inject), the
 * catch-up extra-day picker, the editor (pills + one-tap), and the co-op-date re-lay. The spread rule is unchanged.
 *   run:  node test_coop_week_days.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
let pass = 0, fail = 0;
function ok(name, cond, extra) { if (cond) { pass++; console.log("  ok  - " + name); } else { fail++; console.log("  FAIL- " + name + (extra !== undefined ? "  (" + JSON.stringify(extra) + ")" : "")); } }
const eq = (x, y) => JSON.stringify(x) === JSON.stringify(y);
const sl = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error("slice " + a); return src.slice(i, j); };
function fn(name) {
  const m = src.search(new RegExp("^function\\s+" + name + "\\s*\\(", "m")); if (m < 0) throw new Error("missing " + name);
  let i = src.indexOf("{", m), d = 0;
  for (let j = i; j < src.length; j++) { const c = src[j]; if (c === "{") d++; else if (c === "}") { d--; if (!d) return src.slice(m, j + 1); } }
}

const HELPERS = [fn("coopsMap"), fn("_coopHasDate"), fn("_pjWeekKey"), sl("// COOPWEEKDAYS_START", "// COOPWEEKDAYS_END")].join("\n");
const PROJ = sl("// PROJ_START", "// PROJ_END");            // _pjWeeksBetween, _pjPatternRows, projectPlans (+ _pjWeekKey again — same text)
const CBGEN = sl("// CBGEN_START", "// CBGEN_END");         // _cbParseDate, _cbISO, _cbMonday, _cbSpread, cbMaterialize
const INJECT = sl("    // Inject in-app subjects (lessonSeq, no Excel data) onto matching days", "    // Manual Lesson Map additions");
const CATCHUP = fn("gwCatchupExtraDates");

// ── fixtures (test_coopday.js): China-Grove timed co-op, every other Thursday; Kenzie = makenzie ──
const COOP = { coop_1790955225959: { name: "China-Grove Co-Op", mode: "timed", start: "9:00 AM", end: "3:00 PM", noMomBase: true, kids: ["taylor", "makenzie", "andrew", "caleb"],
  dates: ["2026-09-10", "2026-09-24", "2026-10-08", "2026-10-22", "2026-11-05"] } };
const MTWF = ["Mon", "Tue", "Wed", "Fri"], MTWT = ["Mon", "Tue", "Wed", "Thu"];
const WK1 = ["2026-10-05", "2026-10-06", "2026-10-07", "2026-10-08", "2026-10-09"];   // co-op Thu 10/8
const WK2 = ["2026-10-12", "2026-10-13", "2026-10-14", "2026-10-15", "2026-10-16"];   // no co-op
const L = n => Array.from({ length: n }, (_, i) => "L" + (i + 1));
function kenzie() {
  return { makenzie: {
    math: { display: "Math", minutes: 30, allowedDays: MTWF.slice(), noCoopDays: MTWT.slice(), timesPerWeek: 4, pacing: { mode: "timesPerWeek", tpw: 4 }, lessonSeq: L(40), planId: "p" },
    spelling: { display: "Spelling", minutes: 20, allowedDays: MTWF.slice(), timesPerWeek: 4, pacing: { mode: "timesPerWeek", tpw: 4 }, lessonSeq: L(40), planId: "p" },   // no field
    piano: { display: "Piano", minutes: 20, allowedDays: ["Mon", "Tue", "Wed", "Thu", "Fri"], timesPerWeek: 5, tracking: "daily" },
    typing: { display: "Typing", minutes: 15, allowedDays: MTWF.slice(), timesPerWeek: 4, lessonSeq: L(10) },           // 4×/wk, no pacing (not plan-backed)
    art: { display: "Art", minutes: 30, allowedDays: ["Fri"], timesPerWeek: 1, lessonSeq: L(10) },
    old: { display: "Old", minutes: 20, allowedDays: MTWF.slice(), timesPerWeek: 4, paused: true, lessonSeq: L(10) },
  } };
}
function world(o) {
  o = o || {};
  const log = { writes: [], relays: [], toasts: [], rl: [], gv: [] };
  const ctx = {
    console, Date, Math, Object, Array, String, Number, JSON, parseInt, isNaN,
    currData: { subjects: o.subjects || kenzie() },
    calendarData: { coops: JSON.parse(JSON.stringify(o.coops || COOP)) },
    cbKid: "makenzie", cbSubjKey: null, dbg: () => {},
    db: { ref: p => ({ set: v => { log.writes.push(["set", p, v]); }, update: v => { log.writes.push(["update", p, v]); }, remove: () => { log.writes.push(["remove", p]); } }) },
    _dryRun: () => !!o.dry, momHere: () => o.mom !== false,
    planBacked: (k, sk) => !!(((ctx.currData.subjects || {})[k] || {})[sk] || {}).planId,
    _gvRelaySubject: (k, sk) => { log.gv.push(k + "/" + sk); return true; },
    reprojectSubjectWeek: (k, sk, why) => { log.relays.push([k, sk, why]); return {}; },
    rlSet: (k, sk, f, v, relay) => { log.rl.push([k, sk, f, v, relay]); const s = ((ctx.currData.subjects || {})[k] || {})[sk]; if (s) { if (v == null) delete s[f]; else s[f] = v; } },   // the real generic branch: set / remove the field
    gwShowToast: m => { log.toasts.push(m); }, renderAll: () => {},
    gwParseDate: d => { const [y, m, dd] = d.split("-").map(Number); return new Date(y, m - 1, dd); },
    smapIsKidOff: () => false, _ovOffX: () => false, _ovRmX: () => false,
    capFor: () => 2, DEFAULT_DAY_CAP: 1, gwRules: () => ({ schoolStart: 9 * 60, schoolEnd: 16 * 60, lunchStart: 12 * 60, lunchEnd: 13 * 60 }),
  };
  vm.createContext(ctx);
  vm.runInContext(HELPERS + "\n" + PROJ + "\n" + CBGEN + "\n" + CATCHUP + `
    var WDAY_ABBR={0:"Sun",1:"Mon",2:"Tue",3:"Wed",4:"Thu",5:"Fri",6:"Sat"};
    function walk(kid,sortedDates){ const dayData={}; sortedDates.forEach(d=>dayData[d]={}); const subjects=currData.subjects[kid]; const subjectSlots={}; const ignoreAuto=false;
      ${INJECT}
      return {dayData,subjectSlots}; }`, ctx);
  ctx.log = log; return ctx;
}
const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const cal = dates => dates.map(d => ({ date: d, dow: DOW[new Date(d + "T12:00:00").getDay()], off: false }));
const rows = (dates, dn0, wk) => dates.map((d, i) => ({ dayNum: dn0 + i, date: d, week: wk, dow: DOW[new Date(d + "T12:00:00").getDay()], off: false, usedMin: 0, hadMine: false }));
const md = d => d.slice(5);

console.log("the helper — subjDaysFor(kid, subject, iso) is pure and week-based");
{
  const w = world(); const m = w.currData.subjects.makenzie.math, sp = w.currData.subjects.makenzie.spelling;
  ok("WK1 (co-op Thu 10/8): Kenzie's math keeps Mon/Tue/Wed/Fri on every date of the week", WK1.every(d => eq(w.subjDaysFor("makenzie", m, d), MTWF)));
  ok("WK2 (no co-op): math takes Mon/Tue/Wed/Thu on every date of the week", WK2.every(d => eq(w.subjDaysFor("makenzie", m, d), MTWT)));
  ok("a subject without the field reads allowedDays in both weeks (today's behaviour)", WK1.concat(WK2).every(d => eq(w.subjDaysFor("makenzie", sp, d), MTWF)));
  ok("a kid NOT in the co-op (Lincoln) has no co-op week — the field applies every week", eq(w.subjDaysFor("lincoln", m, "2026-10-08"), MTWT));
  ok("week boundary: Sunday 10/11 closes WK1 (the app's week is Mon–Sun) → co-op-week days", eq(w.subjDaysFor("makenzie", m, "2026-10-11"), MTWF));
  ok("…Monday 10/12 opens WK2 → no-co-op days", eq(w.subjDaysFor("makenzie", m, "2026-10-12"), MTWT));
  ok("…Sunday 10/4 belongs to the week of 9/28 (no co-op) → no-co-op days", eq(w.subjDaysFor("makenzie", m, "2026-10-04"), MTWT) && w._pjWeekKey("2026-10-04") === "2026-09-28");
  ok("an empty / junk field counts as missing", w.noCoopDaysOf({ noCoopDays: [] }) === null && w.noCoopDaysOf({ noCoopDays: ["Sat", "x"] }) === null && w.noCoopDaysOf({ noCoopDays: "Mon" }) === null && eq(w.noCoopDaysOf({ noCoopDays: ["Thu", "Mon"] }), ["Thu", "Mon"]));
  ok("subjDaysByWeek over 10/5–10/16 = one entry per Monday", eq(w.subjDaysByWeek("makenzie", m, "2026-10-05", "2026-10-16"), { "2026-10-05": MTWF, "2026-10-12": MTWT }));
  ok("…and null for a subject without the field (callers keep their old path)", w.subjDaysByWeek("makenzie", sp, "2026-10-05", "2026-10-16") === null);
  ok("a kid is only 'in' the co-op if listed", w.coopWeekHas("makenzie", "2026-10-07") === true && w.coopWeekHas("lincoln", "2026-10-07") === false && w.coopWeekHas("makenzie", "2026-10-14") === false);
}
console.log("\na FULL-DAY co-op week behaves like the timed one");
{
  const full = JSON.parse(JSON.stringify(COOP)); full.coop_1790955225959.mode = "fullDay"; delete full.coop_1790955225959.start; delete full.coop_1790955225959.end;
  const w = world({ coops: full }); const m = w.currData.subjects.makenzie.math;
  ok("WK1 → Mon/Tue/Wed/Fri, WK2 → Mon/Tue/Wed/Thu", WK1.every(d => eq(w.subjDaysFor("makenzie", m, d), MTWF)) && WK2.every(d => eq(w.subjDaysFor("makenzie", m, d), MTWT)));
  const w2 = world({ coops: {} });
  ok("no co-ops at all: every week is a no-co-op week", WK1.concat(WK2).every(d => eq(w2.subjDaysFor("makenzie", m, d), MTWT)));
}

console.log("\nthe projection — _pjPatternRows / projectPlans read plan.daysByWeek");
{
  const w = world(); const m = w.currData.subjects.makenzie.math;
  const C = cal(WK1.concat(WK2));
  const plan = kid => ({ pid: "k__math", kid: "makenzie", sk: "math", lessons: L(8).map((t, i) => ({ lid: "L" + i, text: t })), allowedDays: MTWF.slice(), tpw: 4, daysByWeek: w.subjDaysByWeek("makenzie", m, WK1[0], WK2[4]) });
  const out = w.projectPlans({ todayISO: WK1[0], calendar: { makenzie: C }, plans: [plan()] });
  const dates = Object.keys(out.byDate).sort().map(md);
  ok("8 lessons at 4×/wk land Mon/Tue/Wed/FRI in WK1 and Mon/Tue/Wed/THU in WK2", eq(dates, ["10-05", "10-06", "10-07", "10-09", "10-12", "10-13", "10-14", "10-15"]), dates);
  const p2 = plan(); delete p2.daysByWeek;
  const out2 = w.projectPlans({ todayISO: WK1[0], calendar: { makenzie: C }, plans: [p2] });
  ok("without the map (no field): Friday both weeks — unchanged", eq(Object.keys(out2.byDate).sort().map(md), ["10-05", "10-06", "10-07", "10-09", "10-12", "10-13", "10-14", "10-16"]));
  const pr = w._pjPatternRows({ allowedDays: MTWF.slice(), daysByWeek: { "2026-10-12": MTWT }, offDates: {}, _blocked: {} }, C, 4).map(r => md(r.date));
  ok("_pjPatternRows: a week missing from the map reads allowedDays", eq(pr, ["10-05", "10-06", "10-07", "10-09", "10-12", "10-13", "10-14", "10-15"]), pr);
  const pr3 = w._pjPatternRows({ allowedDays: MTWF.slice(), daysByWeek: { "2026-10-12": MTWT }, offDates: {}, _blocked: {} }, C, 3).map(r => md(r.date));
  ok("the spread rule is untouched: 3×/wk on Mon/Tue/Wed/Thu → Mon · Wed · Thu (round(i·3/2))", eq(pr3.slice(3), ["10-12", "10-14", "10-15"]) && eq(w._cbSpread(MTWT, 3), ["Mon", "Wed", "Thu"]), pr3);
  ok("owed counting uses the same per-week days (anchor 10/5, today 10/16: 8 pattern days, 5 done → owed 3)",
    w.projectPlans({ todayISO: "2026-10-16", calendar: { makenzie: C }, plans: [Object.assign(plan(), { anchor: "2026-10-05", doneSince: 5, cap: 1 })] }).plans["k__math"].owed === 3);
}

console.log("\nthe builder — cbMaterialize reads cfg.daysByWeek (rows and the extension)");
{
  const w = world(); const m = w.currData.subjects.makenzie.math;
  const dbw = w.subjDaysByWeek("makenzie", m, WK1[0], "2026-10-30");
  const R = rows(WK1, 1, "Wk 1").concat(rows(WK2, 6, "Wk 2"));
  const res = w.cbMaterialize({ sk: "math", minutes: 30, mode: "timesPerWeek", tpw: 4, allowedDays: MTWF.slice(), daysByWeek: dbw, content: L(8), rows: R, dayCapMin: 0 });
  ok("WK1 Mon/Tue/Wed/Fri, WK2 Mon/Tue/Wed/Thu", eq(res.assignments.map(a => md(a.date)), ["10-05", "10-06", "10-07", "10-09", "10-12", "10-13", "10-14", "10-15"]), res.assignments.map(a => a.date));
  const res0 = w.cbMaterialize({ sk: "math", minutes: 30, mode: "timesPerWeek", tpw: 4, allowedDays: MTWF.slice(), content: L(8), rows: R, dayCapMin: 0 });
  ok("no map: Friday both weeks (unchanged)", eq(res0.assignments.map(a => md(a.date)), ["10-05", "10-06", "10-07", "10-09", "10-12", "10-13", "10-14", "10-16"]));
  const ext = w.cbMaterialize({ sk: "math", minutes: 30, mode: "timesPerWeek", tpw: 4, allowedDays: MTWF.slice(), daysByWeek: dbw, content: L(8), rows: rows(WK1, 1, "Wk 1"), dayCapMin: 0,
    extend: { lastDayNum: 5, lastDate: WK1[4], lastWeekNum: 1, lastWeekLabel: "Wk 1", isOff: () => false } });
  ok("the grid extension minted for WK2 also takes Thursday, not Friday", eq(ext.assignments.filter(a => a.isNew).map(a => md(a.date)), ["10-12", "10-13", "10-14", "10-15"]), ext.assignments.map(a => a.date));
}

console.log("\nthe slot walker — resolveWeekSlots' inject reads the week's day set");
{
  const w = world();
  const got = (kid, dates, sk) => dates.filter(d => (w.walk(kid, dates).dayData[d][kid] || {})[sk] !== undefined).map(md);
  ok("WK1: math on Mon/Tue/Wed/Fri", eq(got("makenzie", WK1, "math"), ["10-05", "10-06", "10-07", "10-09"]), got("makenzie", WK1, "math"));
  ok("WK2: math on Mon/Tue/Wed/Thu", eq(got("makenzie", WK2, "math"), ["10-12", "10-13", "10-14", "10-15"]), got("makenzie", WK2, "math"));
  ok("spelling (no field) is Mon/Tue/Wed/Fri in both weeks", eq(got("makenzie", WK1, "spelling"), ["10-05", "10-06", "10-07", "10-09"]) && eq(got("makenzie", WK2, "spelling"), ["10-12", "10-13", "10-14", "10-16"]));
  ok("piano (daily, every day) unchanged in both weeks", got("makenzie", WK1, "piano").length === 5 && got("makenzie", WK2, "piano").length === 5);
}

console.log("\ncatch-up extra days follow the week's day set");
{
  const w = world(); const m = w.currData.subjects.makenzie.math;
  const dd = dates => { const o = {}; dates.forEach(d => { o[d] = { makenzie: { piano: "Daily" } }; }); return o; };
  ok("WK2: the extra sitting after Mon/Tue/Wed goes to Thursday", eq(w.gwCatchupExtraDates("makenzie", "math", m, WK2.slice(0, 3), 1, dd(WK2)), ["2026-10-15"]));
  ok("WK1: …to Friday", eq(w.gwCatchupExtraDates("makenzie", "math", m, WK1.slice(0, 3), 1, dd(WK1)), ["2026-10-09"]));
}

console.log("\nthe editor — pills write noCoopDays through rlSet (re-lay on); one tap sets Mon–Thu on every 4×/wk subject");
{
  const w = world();
  w.cwdPinDay("math", "Fri");
  ok("tapping F on math adds Fri → rlSet(kid, sk, 'noCoopDays', [Mon,Tue,Wed,Thu,Fri], relay=true)", eq(w.log.rl[0], ["makenzie", "math", "noCoopDays", ["Mon", "Tue", "Wed", "Thu", "Fri"], true]), w.log.rl[0]);
  w.cwdPinDay("math", "Thu");
  ok("tapping a lit day removes it (sorted Mon→Fri)", eq(w.log.rl[1][3], ["Mon", "Tue", "Wed", "Fri"]), w.log.rl[1]);
  w.currData.subjects.makenzie.spelling.noCoopDays = ["Thu"]; w.cwdPinDay("spelling", "Thu");
  ok("unlighting the last pill writes null — the field is gone, allowedDays every week again", w.log.rl[2][3] === null && w.log.rl[2][4] === true);
  w.cwdPinDay("nothing", "Mon");
  ok("an unknown subject writes nothing", w.log.rl.length === 3);
}
{
  const w = world();
  const r = w.cwdUseMonThu("makenzie");
  const up = w.log.writes.find(x => x[0] === "update" && x[1] === "curriculum/subjects/makenzie");
  ok("ONE multi-path update on curriculum/subjects/makenzie …", !!up);
  ok("… whose paths are only <sk>/noCoopDays of the 4×/wk subjects that need it: spelling + typing (math already Mon–Thu, piano 5×, art 1×, old paused)",
    up && eq(Object.keys(up[2]).sort(), ["spelling/noCoopDays", "typing/noCoopDays"]) && eq(up[2]["spelling/noCoopDays"], MTWT), up && up[2]);
  ok("never a whole-node set", !w.log.writes.some(x => x[0] === "set" && /curriculum\/subjects/.test(x[1])));
  ok("local record updated; lastEdit stamped", eq(w.currData.subjects.makenzie.spelling.noCoopDays, MTWT) && eq(w.currData.subjects.makenzie.typing.noCoopDays, MTWT) && w.log.writes.some(x => x[1] === "curriculum/lastEdit"));
  ok("plan-backed ones re-lay (spelling), a card-only one does not (typing)", eq(w.log.gv, ["makenzie/spelling"]) && eq(r.set, ["spelling", "typing"]) && eq(r.relaid, ["spelling"]));
  const r2 = w.cwdUseMonThu("makenzie");
  ok("a second tap finds nothing to do and writes nothing", eq(r2.set, []) && w.log.writes.filter(x => x[0] === "update").length === 1);
  const wd = world({ dry: true }); wd.cwdUseMonThu("makenzie");
  ok("?dryrun=1: no write", wd.log.writes.length === 0 && eq(wd.currData.subjects.makenzie.spelling.noCoopDays, MTWT));
  const wm = world({ mom: false });
  ok("not Mom → nothing", wm.cwdUseMonThu("makenzie") === null && wm.log.writes.length === 0);
}

console.log("\nadding / removing a co-op date re-lays the kids' noCoopDays subjects (active week, like coopToggleMomDay)");
{
  const w = world();
  const got = w.cwdRelayKids(["makenzie", "taylor"], "coop-dates");
  ok("only plan-backed subjects WITH the field re-lay: makenzie/math (spelling has no field, typing not plan-backed, old paused)", eq(got, ["makenzie/math"]) && eq(w.log.relays, [["makenzie", "math", "coop-dates"]]), got);
  const cs = fn("coopSave"), cd = fn("coopDelete");
  ok("coopSave compares the dates + kids before/after and calls cwdRelayKids on a change", /const _prev=coopsMap\(\)\[coopEditId\]\|\|null;/.test(cs) && /if\(_pd!==obj\.dates\.join\(\)\|\|_pk!==obj\.kids\.slice\(\)\.sort\(\)\.join\(\)\)\{/.test(cs) && /cwdRelayKids\(_ks,"coop-dates"\)/.test(cs));
  ok("…covering kids removed from the co-op too", /\(\(_prev&&_prev\.kids\)\|\|\[\]\)\.forEach\(function\(k\)\{ if\(_ks\.indexOf\(k\)<0\) _ks\.push\(k\); \}\)/.test(cs));
  ok("coopDelete re-lays the deleted co-op's kids", /cwdRelayKids\(\(c&&c\.kids\)\|\|\[\],"coop-dates"\)/.test(cd));
}

console.log("\nwiring — every day picker asks the helper; the field rides rlSet's generic path");
{
  ok("_pjPatternRows reads plan.daysByWeek keyed by _pjWeekKey", /const _dbw=plan\.daysByWeek\|\|null;/.test(fn("_pjPatternRows")) && /_dbw\[_pjWeekKey\(r\.date\)\]/.test(fn("_pjPatternRows")));
  const pm = fn("planMaterialize");
  ok("planMaterialize builds plan.daysByWeek over past + future rows (a borrowed lane rhythm brings its source's field)", /subjDaysByWeek\(kid,\{allowedDays:plan\.allowedDays,noCoopDays:_nc\},_lo,_hi\)/.test(pm) && /const _nc=\(_lnRh&&!_lnRh\.own\)\?\(_lnRh\.noCoopDays\|\|null\):s\.noCoopDays;/.test(pm));
  ok("lnRhythm carries noCoopDays on a single card", /noCoopDays:\(typeof noCoopDaysOf==="function"\)\?noCoopDaysOf\(s\):null/.test(fn("lnRhythm")));
  ok("planOwed + the pace chip count owed on the same per-week days", /plan\.daysByWeek=_m/.test(fn("planOwed")) && (src.match(/subjDaysByWeek\(kid,\{allowedDays:plan\.allowedDays,noCoopDays:s\.noCoopDays\},rows\[0\]\.date,rows\[rows\.length-1\]\.date\)/g) || []).length === 2);
  const cb = fn("cbMaterialize");
  ok("cbMaterialize reads cfg.daysByWeek in dayFits and in the extension", /const _dbw=cfg\.daysByWeek\|\|null;/.test(cb) && /const dayFits=r=>!r\.off&&!blocked\[r\.date\]&&_dowOk\(r\);/.test(cb) && /!r\.exists&&!blocked\[r\.date\]&&_dowOk\(r\)&&/.test(cb));
  ok("cbBuildCfg hands the Builder the map over rows + 800 extension days", /cfg\.daysByWeek=_m/.test(fn("cbBuildCfg")) && /_hiD\.setDate\(_hiD\.getDate\(\)\+800\)/.test(fn("cbBuildCfg")));
  ok("resolveWeekSlots picks the week's set from its first weekday (the resolved rhythm's line is untouched)", /_alWk=subjDaysFor\(kid,\{allowedDays:allowed,noCoopDays:_lnRh\?_lnRh\.noCoopDays:s\.noCoopDays\},_wd\)/.test(fn("resolveWeekSlots")) && /const allowed=\(_lnRh\?_lnRh\.allowedDays:s\.allowedDays\)\|\|\[\];/.test(fn("resolveWeekSlots")) && /return abbr&&_alWk\.includes\(abbr\);/.test(fn("resolveWeekSlots")));
  ok("Excel re-import carries the field like allowedDays", /const CARRY=\["pacing","paused","momVerify","allowedDays","noCoopDays",/.test(src));
  ok("the balancer asks per date", /allowed=subjDaysFor\(kid,subjects\[key\],dk\)/.test(fn("gwAutoBalance")));
  ok("gwCatchupExtraDates asks per date", /subjDaysFor\(kid,s,date\):al/.test(fn("gwCatchupExtraDates")));
  ok("reprojectSubjectWeek's _rpDays are the week's set (lane rhythm's field honoured; its own lines untouched)", /if\(_rh&&!_rh\.own\) _rpNc=_rh\.noCoopDays;/.test(fn("reprojectSubjectWeek")) && /_rpDays=subjDaysFor\(kid,\{allowedDays:_rpDays,noCoopDays:_rpNc\},_wISO\)/.test(fn("reprojectSubjectWeek")) && /let _rpDays=_subj\.allowedDays\|\|\[\], _rpCap=_subj\.cap\|\|1;/.test(fn("reprojectSubjectWeek")));
  ok("grid views (lost-to-co-op chips, daily minutes) ask per row date", (src.match(/subjDaysFor\(gvKid,s2,l2\.date\)/g) || []).length === 1 && (src.match(/subjDaysFor\(gvKid,s,l\.date\)/g) || []).length === 1);
  ok("make-up suggester + make-up appender ask per week", /subjDaysFor\(k,s,dy\.date\):al/.test(fn("lmComputeSuggestions")) && /subjDaysFor\(kid,s,range\.start\)/.test(src));
  ok("placement-rules table: a second pill row + the one-tap link, only for a kid in a co-op", /_coopAny\?\(function\(\)\{ const _nc=/.test(src) && /onclick="cwdPinDay\(\\''\+sk\+'\\',\\''\+d\+'\\'\)"/.test(src) && /onclick="cwdUseMonThu\(\\''\+kid\+'\\'\)"/.test(src) && /if\(_coopAny\) h\+=/.test(src));
  ok("rlSet's generic branch writes curriculum/subjects/<kid>/<sk>/<field> — noCoopDays rides it (null removes)", /db\.ref\("curriculum\/subjects\/"\+kid\+"\/"\+sk\+"\/"\+field\)\.set\(val===undefined\?null:val\)/.test(fn("rlSet")));
  // live 2026-10-14: Makenzie's rules + day cap came up blank. cbRenderRules has a local `cap`
  // (the kid's minutes), so the two co-op lines must reach the global name helper via window.cap.
  { const _r = fn("cbRenderRules");
    ok("cbRenderRules never calls its local minutes `cap` as a function (the co-op lines use window.cap)", !/[^.\w]cap\(kid\)/.test(_r) && (_r.match(/window\.cap\(kid\)/g) || []).length === 2); }
  ok("no 🔀 anywhere", src.indexOf("\u{1F500}") < 0);
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
