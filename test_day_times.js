/*
 * Node tests — ⏰ THIS DAY'S SCHOOL TIMES (DAYTIMES). Her ask 2026-10-29: "I need to make daily adjustments, like extending the
 * school day, changing lunchtime, or shortening the school day. Really just a start/finish time per day would be great. I need
 * to be able to do this myself, and probably all the apps will need it." One DATE's own start / finish / lunch for the whole
 * family: config/rules/schoolDay/byDate/<iso> = {start,end} + SETTIME_TODAY's lunchByDate/<iso>/all.
 *
 * Checks, against code sliced verbatim out of index.html:
 *   0. shape: one block right after FIXEDDAYTIME_END; every reader hooked (typeof-guarded); writes only through stWrite
 *   1. the resolvers: no byDate anywhere → the caller's own value back, untouched; a leaf wins on ITS date only; a bad or
 *      backwards leaf is ignored; a weekday name means today's real date for today, else that day of the week on the board
 *   2. the save writes only what differs from the day's usual rule, in ONE multi-path update; the usual times → the leaves go
 *   3. a finish before the start / a lunch that ends before it starts → a plain message, nothing written
 *   4. Back to normal removes both leaves; ?dryrun=1 changes this device's memory only; a kid lens writes nothing
 *   5. the doors: the day banner button and the Month day-sheet row draw for Mom only, never on a Sunday, and show the
 *      date's own times when it has some
 *   6. the REAL school-end guard (seGuardWeek + seGuardCtx): Tuesday finishing at 2:00 PM moves Tuesday's late card off the
 *      end and leaves Wednesday byte-identical; with no leaf the guard's answer is byte-identical to the old rule
 *   7. the live day (MOMLOOP): today's own finish is the cut line, today's own lunch is the lunch window
 *
 *   run:  node test_day_times.js          (reads ./index.html)
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");

function extractFn(name, from) {
  from = from || src;
  const i = from.indexOf("function " + name + "(");
  if (i < 0) throw new Error("not found: " + name);
  let depth = 0, started = false;
  for (let k = from.indexOf("{", i); k < from.length; k++) {
    const c = from[k];
    if (c === "{") { depth++; started = true; }
    else if (c === "}") { depth--; if (started && depth === 0) return from.slice(i, k + 1); }
  }
  throw new Error("unbalanced: " + name);
}
function slice(a, b) {
  const i = src.indexOf(a); if (i < 0) throw new Error("slice start not found: " + a);
  const j = src.indexOf(b, i); if (j < 0) throw new Error("slice end not found: " + b);
  return src.slice(i, j);
}
let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log("  ok  - " + name); }
  else { fail++; console.log("  FAIL- " + name + (extra !== undefined ? "  (" + JSON.stringify(extra) + ")" : "")); }
}
const toMin = (t) => {
  if (t == null) return NaN;
  const m = String(t).trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!m) return NaN;
  let h = parseInt(m[1], 10); const mi = parseInt(m[2], 10); const ap = (m[3] || "").toUpperCase();
  if (ap === "PM" && h !== 12) h += 12; if (ap === "AM" && h === 12) h = 0;
  return h * 60 + mi;
};
const fromMin = (n) => { let h = Math.floor(n / 60), m = n % 60; const ap = h >= 12 ? "PM" : "AM"; h = h % 12 || 12; return h + ":" + String(m).padStart(2, "0") + " " + ap; };

const DT = slice("// DAYTIMES_START", "// DAYTIMES_END");
const ST = slice("// SETTIME_TODAY_START", "// SETTIME_TODAY_END");

// ── 0. shape ──
console.log("0. shape");
ok("one DAYTIMES block", src.split("// DAYTIMES_START").length === 2 && src.split("// DAYTIMES_END").length === 2);
ok("the block sits right after FIXEDDAYTIME_END", src.indexOf("// FIXEDDAYTIME_END\n// DAYTIMES_START") >= 0);
ok("the block writes only through stWrite (no set / update / remove of its own)", !/db\.ref|\.(set|update|transaction|push)\(/.test(DT) && /stWrite\(dtUpd\(st\)\)/.test(DT) && /stWrite\(upd\)/.test(DT));
const HOOKS = {
  gateStartMin: /dtS\(d,_v\)/, rvPlanDay: /dtS\(nd,_v\)/, _agLunchRow: /dtLunch\(dayName\)/, _mvtSchoolStartMin: /dtS\(_todayDay,_v\)/,
  _mlDayEndMin: /dtE\(_todayDay,_v\)/, _mlLunchWin: /dtLunch\(_todayDay\)/, dsRetime: /dtS\(d,_floorV\)/, resortDayTasks: /dtDay\(day\)/,
  seGuardCtx: /dtLunch\(day\)[\s\S]*dtS\(day,_vs\)[\s\S]*dtE\(day,_ve\)/, stSyncCtx: /dtLunch\(day\)[\s\S]*dtS\(day,_v\)/,
  _rpRelayMode: /dtSM\(td,_r0\.schoolStart\)/, cbBeforeSchoolToday: /dtSM\(_todayDay,r\.schoolStart\)/, mstAlertsFor: /dtEM\(td,r\.schoolEnd\)/,
  gwBuildDayTasks: /dtEM\(dayName,cutoff,dayConfig\.dateStr\)[\s\S]*end:_cutD,/, gwAutoBalance: /dtS\(dayName,_ss0,dk\)[\s\S]*DAY_END_D/,
  generateWeek: /dtS\(dn,_ssw,dk\)[\s\S]*dtS\("saturday",_ds0,_satDk\)/, reprojectSubjectWeek: /dtSM\(day,gwR\.schoolStart,calDateForWeekDay\(day,wn\)\)/,
  runDisplacement: /dtS\(d,v\)[\s\S]*dtE\(d,v\)[\s\S]*dtLunch\(d\)/, auditSchedule: /dtLunch\(day\)/, calDaySheetHTML: /dtCalRowHTML\(iso,L,who,kidMode\)/,
};
Object.keys(HOOKS).forEach(function (fn) { let body = ""; try { body = extractFn(fn); } catch (e) {} ok(fn + " asks the date's own time first", HOOKS[fn].test(body)); });
{ const C = extractFn("cascadeIntraWeek"); const n = (C.match(/typeof dt(S|E|SM|Day)==="function"/g) || []).length;
  ok("cascadeIntraWeek: closing cap, today open / over, heal, receiving days, end-of-week stack, bookends, gap fill (8 hooks)", n === 8, n); }
ok("the day banner has the ⏰ door", /typeof dtBtnHTML==="function"\?dtBtnHTML\(day\):''/.test(src));
{ const outside = src.replace(DT, "").split("\n").filter((l) => /\bdt(S|E|SM|EM|Lunch|Day|BtnHTML|CalRowHTML)\(/.test(l));
  ok("every hook line outside the block is typeof-guarded (" + outside.length + " lines)", outside.length >= 30 && outside.every((l) => /typeof dt\w+==="function"/.test(l)), outside.filter((l) => !/typeof dt\w+==="function"/.test(l)).map((l) => l.trim().slice(0, 80))); }

// ── a sandbox with the two blocks ──
function sandbox(o) {
  o = o || {};
  const writes = [];
  const ctx = {
    toMin, fromMin, console, Date,
    esc: (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])),
    ampmTo24: (s) => { const m = String(s || "").match(/(\d+):(\d+)\s*(AM|PM)/i); if (!m) return s; let h = +m[1]; if (/PM/i.test(m[3]) && h !== 12) h += 12; if (/AM/i.test(m[3]) && h === 12) h = 0; return String(h).padStart(2, "0") + ":" + m[2]; },
    to12h: (s) => { const p = String(s || "").split(":"); if (p.length !== 2) return s; let h = +p[0]; const ap = h >= 12 ? "PM" : "AM"; if (h === 0) h = 12; else if (h > 12) h -= 12; return h + ":" + p[1] + " " + ap; },
    momHere: () => o.mom !== false, onecalMom: () => o.mom !== false,
    _dryRun: () => !!o.dry, dbg: () => {}, renderAll: () => { ctx._renders++; }, schedCascade: () => { ctx._cascades++; }, gwShowToast: (m) => { ctx._toast = m; },
    db: { ref: () => ({ update: (u) => writes.push(JSON.parse(JSON.stringify(u))) }) },
    rulesData: o.rules || { schoolDay: { defaultStart: "10:00 AM", defaultEnd: "4:15 PM", lunchStart: "1:00 PM", lunchEnd: "2:00 PM", overrides: { friday: { end: "3:00 PM" } } } },
    currData: { subjects: {} },
    _todayDay: o.today || "monday",
    calToday: () => o.todayIso || "2026-11-02",
    calDateForWeekDay: (dn) => ({ monday: "2026-11-02", tuesday: "2026-11-03", wednesday: "2026-11-04", thursday: "2026-11-05", friday: "2026-11-06", saturday: "2026-11-07", sunday: "2026-11-08" }[dn] || null),
    document: { getElementById: () => null, createElement: () => ({ style: {}, set innerHTML(v) { ctx._sheet = v; }, get innerHTML() { return ctx._sheet; } }), body: { appendChild: () => {} } },
    _renders: 0, _cascades: 0, _toast: "", _sheet: "",
  };
  vm.createContext(ctx);
  vm.runInContext(ST + "\n" + DT + "\nthis._dt=function(){ return dtState; }; this._setDt=function(v){ dtState=v; };", ctx);
  ctx._writes = writes;
  return ctx;
}

// ── 1. resolvers ──
console.log("1. resolvers");
{
  const S = sandbox();
  const fb = "10:00 AM";
  ok("no byDate anywhere → dtAny false and the caller's own value back", S.dtAny() === false && S.dtS("tuesday", fb) === fb && S.dtE("tuesday", "4:15 PM") === "4:15 PM" && S.dtSM("tuesday", 600) === 600 && S.dtEM("tuesday", null) === null && S.dtLunch("tuesday") === null);
  S.rulesData.schoolDay.byDate = { "2026-11-03": { start: "11:00 AM", end: "2:00 PM" } };
  ok("Tuesday's leaf wins on Tuesday", S.dtS("tuesday", fb) === "11:00 AM" && S.dtE("tuesday", "4:15 PM") === "2:00 PM" && S.dtSM("tuesday", 600) === 660 && S.dtEM("tuesday", 975) === 840);
  ok("…and nowhere else (Wednesday keeps its rule)", S.dtS("wednesday", fb) === fb && S.dtE("wednesday", "4:15 PM") === "4:15 PM");
  ok("an explicit iso is used as given (the generator's next-week dates)", S.dtS("tuesday", fb, "2026-11-10") === fb && S.dtS("tuesday", fb, "2026-11-03") === "11:00 AM");
  S.rulesData.schoolDay.byDate = { "2026-11-03": { end: "1:30 PM" } };
  ok("a finish-only leaf keeps the usual start", S.dtS("tuesday", fb) === fb && S.dtE("tuesday", "x") === "1:30 PM");
  S.rulesData.schoolDay.byDate = { "2026-11-03": { start: "3:00 PM", end: "2:00 PM" } };
  ok("a backwards leaf (finish before start) is ignored whole", S.dtS("tuesday", fb) === fb && S.dtE("tuesday", "4:15 PM") === "4:15 PM");
  S.rulesData.schoolDay.byDate = { "2026-11-03": { start: "soon", end: 5 } };
  ok("a bad leaf is ignored", S.dtS("tuesday", fb) === fb && S.dtE("tuesday", "4:15 PM") === "4:15 PM");
  const T = sandbox({ today: "thursday", todayIso: "2026-10-29" });
  T.rulesData.schoolDay.byDate = { "2026-10-29": { start: "11:30 AM" }, "2026-11-05": { start: "9:00 AM" } };
  ok("today's weekday means today's real date (not that weekday of the week on the board)", T.dtS("thursday", fb) === "11:30 AM");
  const L = sandbox();
  L.rulesData.schoolDay.lunchByDate = { "2026-11-03": { all: { start: "12:00 PM", end: "12:45 PM" } } };
  ok("the date's own lunch is SETTIME's lunchByDate/<iso>/all", JSON.stringify(L.dtLunch("tuesday")) === JSON.stringify({ s: 720, e: 765 }) && L.dtLunch("wednesday") === null);
  ok("dtDay: usual rule + the weekday override, the date's own on top", JSON.stringify(L.dtDay("friday")) === JSON.stringify({ s: 600, e: 900, ls: 780, le: 840 }) && L.dtDay("tuesday").ls === 720);
}

// ── 2–4. the sheet ──
console.log("2. save writes only what differs, in one update");
{
  const S = sandbox();
  S.dtOpen("2026-11-03");
  ok("the sheet opens with the day's times", S._dt() && S._dt().s === 600 && S._dt().e === 975 && /usually 10:00 AM–4:15 PM · lunch 1:00 PM–2:00 PM/.test(S._sheet));
  S.dtSet("e", "14:00"); S.dtSet("ls", "12:00"); S.dtSet("le", "12:45");
  S.dtSave();
  ok("ONE multi-path update", S._writes.length === 1);
  const u = S._writes[0] || {};
  ok("finish-only leaf + the lunch leaf", JSON.stringify(u["config/rules/schoolDay/byDate/2026-11-03"]) === JSON.stringify({ end: "2:00 PM" }) && JSON.stringify(u["config/rules/schoolDay/lunchByDate/2026-11-03/all"]) === JSON.stringify({ start: "12:00 PM", end: "12:45 PM" }), u);
  ok("only those two paths", Object.keys(u).length === 2);
  ok("this device follows at once (rulesData) + the day re-lays + a toast", S.dtE("tuesday", "x") === "2:00 PM" && S._cascades === 1 && S._renders === 1 && /Tue, Nov 3: school 10:00 AM–2:00 PM · lunch 12:00 PM–12:45 PM/.test(S._toast), S._toast);
  S.dtOpen("2026-11-03"); S.dtSet("e", "16:15"); S.dtSet("ls", "13:00"); S.dtSet("le", "14:00"); S.dtSave();
  const u2 = S._writes[1] || {};
  ok("saving the usual times removes both leaves (null)", u2["config/rules/schoolDay/byDate/2026-11-03"] === null && u2["config/rules/schoolDay/lunchByDate/2026-11-03/all"] === null, u2);
  const F = sandbox(); F.dtOpen("2026-11-06"); F.dtSet("s", "11:00"); F.dtSave();
  ok("Friday: the usual is Friday's own 3:00 PM override, so only the start is written", JSON.stringify(F._writes[0]["config/rules/schoolDay/byDate/2026-11-06"]) === JSON.stringify({ start: "11:00 AM" }));
}
console.log("3. a day that can't be");
{
  const S = sandbox(); S.dtOpen("2026-11-03"); S.dtSet("e", "09:00"); S.dtSave();
  ok("finish before start → a message, nothing written", S._writes.length === 0 && /finish after it starts/.test(S._sheet));
  S.dtSet("e", "15:00"); S.dtSet("le", "12:00"); S.dtSave();
  ok("lunch ending before it starts → a message, nothing written", S._writes.length === 0 && /Lunch has to end/.test(S._sheet));
}
console.log("4. back to normal · dry run · kid lens");
{
  const S = sandbox(); S.rulesData.schoolDay.byDate = { "2026-11-03": { start: "11:00 AM" } };
  S.dtClear("2026-11-03");
  const u = S._writes[0] || {};
  ok("Back to normal removes both leaves in one update", u["config/rules/schoolDay/byDate/2026-11-03"] === null && u["config/rules/schoolDay/lunchByDate/2026-11-03/all"] === null && S.dtS("tuesday", "10:00 AM") === "10:00 AM");
  const D = sandbox({ dry: true }); D.dtOpen("2026-11-03"); D.dtSet("s", "11:00"); D.dtSave();
  ok("?dryrun=1: nothing sent, this device's memory follows", D._writes.length === 0 && D.dtS("tuesday", "x") === "11:00 AM");
  const K = sandbox({ mom: false }); K.dtOpen("2026-11-03"); K._setDt({ iso: "2026-11-03", dn: "tuesday", s: 660, e: 900, ls: 780, le: 840, err: "" }); K.dtSave(); K.dtClear("2026-11-03");
  ok("a kid lens never writes", K._writes.length === 0);
}

// ── 5. the doors ──
console.log("5. the doors");
{
  const S = sandbox();
  ok("banner: Mom sees ⏰ Day times", /⏰ Day times/.test(S.dtBtnHTML("tuesday")) && /dtOpenDay\('tuesday'\)/.test(S.dtBtnHTML("tuesday")));
  ok("banner: never on a Sunday", S.dtBtnHTML("sunday") === "");
  S.rulesData.schoolDay.byDate = { "2026-11-03": { start: "11:00 AM", end: "2:00 PM" } };
  ok("banner: a day with its own times shows them", /⏰ 11:00 AM–2:00 PM/.test(S.dtBtnHTML("tuesday")) && /⏰ Day times/.test(S.dtBtnHTML("wednesday")));
  ok("banner: nothing for a kid", sandbox({ mom: false }).dtBtnHTML("tuesday") === "");
  const r = S.dtCalRowHTML("2026-11-03", { school: true }, null, false);
  ok("day sheet: one School row with the date's times and Back to normal", r.n === 1 && /School day/.test(r.html) && /11:00 AM–2:00 PM/.test(r.html) && /this day only \(usually 10:00 AM–4:15 PM/.test(r.html) && /dtClear\('2026-11-03'\)/.test(r.html));
  const r2 = S.dtCalRowHTML("2026-11-10", { school: true }, null, false);
  ok("day sheet: a future week's date draws too (no Back to normal without its own times)", r2.n === 1 && /dtOpen\('2026-11-10'\)/.test(r2.html) && !/Back to normal/.test(r2.html));
  ok("day sheet: nothing in a kid lens, on a Sunday, or with the School layer off", S.dtCalRowHTML("2026-11-03", { school: true }, null, true).n === 0 && S.dtCalRowHTML("2026-11-08", { school: true }, null, false).n === 0 && S.dtCalRowHTML("2026-11-03", {}, null, false).n === 0);
  S.dtOpen("2026-11-08"); ok("the sheet never opens for a Sunday", S._dt() === null);
}

// ── 6. the real school-end guard ──
console.log("6. seGuardWeek + seGuardCtx");
{
  const S = sandbox({ today: "monday", todayIso: "2026-11-02" });
  vm.runInContext([extractFn("seGuardWeek"), extractFn("seGuardCtx")].join("\n") + "\nthis.seGuardWeek=seGuardWeek; this.seGuardCtx=seGuardCtx;", S);
  S.DAY_DT = { monday: "November 2", tuesday: "November 3", wednesday: "November 4", thursday: "November 5", friday: "November 6" };
  S.gwRules = () => ({ schoolStart: 600, schoolEnd: 975, lunchStart: 780, lunchEnd: 840 });
  const week = () => ["tuesday", "wednesday"].map((d) => [
    { id: d + "_a", who: "kid1", day: d, time: "10:00 AM", dur: 60, subjectKey: "math", title: "Math", mom: "none" },
    { id: d + "_b", who: "kid1", day: d, time: "2:00 PM", dur: 60, subjectKey: "reading", title: "Reading", mom: "none" },
  ]).flat();
  const at = (L, id) => (L.find((t) => t.id === id) || {}).time + "/" + (L.find((t) => t.id === id) || {}).day;
  const base = week(); const baseOut = S.seGuardWeek(base, S.seGuardCtx({ nowMin: 8 * 60 }));
  ok("no leaf: the guard leaves a fine week alone (2:00–3:00 PM ends before 4:15)", at(base, "tuesday_b") === "2:00 PM/tuesday");
  S.rulesData.schoolDay.byDate = { "2026-11-03": { end: "2:00 PM" } };
  const w = week(); S.seGuardWeek(w, S.seGuardCtx({ nowMin: 8 * 60 }));
  const tb = w.find((t) => t.id === "tuesday_b");
  ok("Tuesday finishing at 2:00 PM: the 2:00–3:00 card no longer ends past Tuesday's end", !(tb.day === "tuesday" && toMin(tb.time) + tb.dur > 14 * 60), at(w, "tuesday_b"));
  ok("Wednesday is byte-identical", JSON.stringify(w.filter((t) => t.day === "wednesday" && t.id.startsWith("wednesday"))) === JSON.stringify(week().filter((t) => t.day === "wednesday")));
  ok("the guard's window for Tuesday is the date's own", S.seGuardCtx().win("tuesday").end === 840 && S.seGuardCtx().win("wednesday").end === 975);
  S.rulesData.schoolDay.lunchByDate = { "2026-11-04": { all: { start: "12:00 PM", end: "12:45 PM" } } };
  ok("…and Wednesday's own lunch", S.seGuardCtx().win("wednesday").lunchStart === 720 && S.seGuardCtx().win("tuesday").lunchStart === 780);
}

// ── 7. the live day ──
console.log("7. MOMLOOP cut line + lunch");
{
  const S = sandbox({ today: "thursday", todayIso: "2026-10-29" });
  vm.runInContext([extractFn("_mlDayEndMin"), extractFn("_mlLunchWin")].join("\n") + "\nthis._mlDayEndMin=_mlDayEndMin; this._mlLunchWin=_mlLunchWin;", S);
  ok("no leaf: 4:15 PM and 1:00–2:00 PM as before", S._mlDayEndMin() === 975 && JSON.stringify(S._mlLunchWin()) === "[780,840]");
  S.rulesData.schoolDay.byDate = { "2026-10-29": { end: "5:30 PM" } };
  S.rulesData.schoolDay.lunchByDate = { "2026-10-29": { all: { start: "12:30 PM", end: "1:15 PM" } } };
  ok("today's own finish is the cut line (an extended day)", S._mlDayEndMin() === 17 * 60 + 30);
  ok("today's own lunch is the lunch window", JSON.stringify(S._mlLunchWin()) === "[750,795]");
  S._mlLunchOverride = false; ok("the harness pin still wins", S._mlLunchWin() === null);
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
