/*
 * Node tests — 🔁 SUNDAY CATCH-UP (SUNDAYCU). Her ask 2026-10-29: "I need to be able to have schoolwork on Sundays if needed, so
 * we can keep doing catch-up on Sundays." Her answer the same day: "Catch-up only."
 * A switched-on kid (config/rules/sundayCatchup/<kid> = true), on a Sunday with the coming week on the board, sees last week's
 * catch-up on Sunday: every carried-over card + per subject the EARLIEST cards, as many as the catch-up sittings the generator
 * added. Derived in effectiveDay — nothing written.
 *
 * Checks, against code sliced verbatim out of index.html:
 *   0. shape: one block right after DAYTIMES_END; the hooks; no write of its own but the switch through stWrite; no name the
 *      app already uses (a later function of the same name would silently win — the SETTIME lesson)
 *   1. the pick: carried cards; the earliest n per subject (never the flagged extras at the end of the week); only switched-on
 *      kids; twins / end-of-week overflow / family cards never; nothing when the board is not the coming week
 *   2. the gate: null unless today is Sunday and a kid is on
 *   3. the REAL effectiveDay: a picked card is "sunday" on Sunday; a card checked on Sunday stays there; a Mom move wins; no
 *      kid on → every card's day is byte-identical to the build without the block
 *   4. the switch: one leaf on, null off, Mom only; the Settings chips
 *   5. _lidWeekdayISO dates a Sunday check-off the day BEFORE the week's Monday
 *   6. ⏰ DAYTIMES opens on a Sunday only once a kid has Sunday catch-up
 *
 *   run:  node test_sunday_catchup.js          (reads ./index.html)
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
function extractFn(name) {
  const i = src.indexOf("function " + name + "(");
  if (i < 0) throw new Error("not found: " + name);
  let depth = 0, started = false;
  for (let k = src.indexOf("{", i); k < src.length; k++) {
    const c = src[k];
    if (c === "{") { depth++; started = true; }
    else if (c === "}") { depth--; if (started && depth === 0) return src.slice(i, k + 1); }
  }
  throw new Error("unbalanced: " + name);
}
function slice(a, b) { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error("slice: " + a); return src.slice(i, j); }
let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log("  ok  - " + name); }
  else { fail++; console.log("  FAIL- " + name + (extra !== undefined ? "  (" + JSON.stringify(extra) + ")" : "")); }
}
const toMin = (t) => { const m = String(t || "").trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i); if (!m) return NaN; let h = +m[1]; const ap = (m[3] || "").toUpperCase(); if (ap === "PM" && h !== 12) h += 12; if (ap === "AM" && h === 12) h = 0; return h * 60 + +m[2]; };
const fromMin = (n) => { let h = Math.floor(n / 60), m = n % 60; const ap = h >= 12 ? "PM" : "AM"; h = h % 12 || 12; return h + ":" + String(m).padStart(2, "0") + " " + ap; };

const SC = slice("// SUNDAYCU_START", "// SUNDAYCU_END");
const DT = slice("// DAYTIMES_START", "// DAYTIMES_END");
const ST = slice("// SETTIME_TODAY_START", "// SETTIME_TODAY_END");

console.log("0. shape");
ok("one SUNDAYCU block, right after DAYTIMES_END", src.split("// SUNDAYCU_START").length === 2 && src.indexOf("// DAYTIMES_END\n// SUNDAYCU_START") >= 0);
ok("effectiveDay asks sucDay right after the checked branch, before Mom moves", /return t\.day;\n  \}\n  \{ const _sc=\(typeof sucDay==="function"\)\?sucDay\(t\):null; if\(_sc\) return _sc; \}[^\n]*\n  const _mv=momMoves\[t\.id\];/.test(extractFn("effectiveDay")));
ok("…and inside the checked branch when history has no day yet (finalizeDone stamps checkedOnDay from it)", /if\(h&&h\.checkedOnDay\) return h\.checkedOnDay;\n    \{ const _sc=\(typeof sucDay==="function"\)\?sucDay\(t\):null; if\(_sc\) return _sc; \}/.test(extractFn("effectiveDay")));
ok("taskCard + tapTask: a Sunday catch-up card is not a later day's; today's Sunday is not past", (src.match(/&&!\(typeof sucDay==="function"&&sucDay\(t\)===day\)/g) || []).length === 2 && /dn==="sunday"&&dn===_todayDay\) return false;/.test(extractFn("_isPastDay")));
ok("School Day Times card carries the chips", /typeof sucSettingsHTML==="function"\) h\+=sucSettingsHTML\(\)/.test(extractFn("rulesSchoolDayCardHTML")));
ok("no db write of its own; the switch goes through stWrite", !/db\.ref|\.(set|update|transaction|push)\(/.test(SC) && /stWrite\(upd\)/.test(SC));
{ const names = [...SC.matchAll(/function (\w+)\(/g)].map((m) => m[1]).concat([...SC.matchAll(/^let (\w+)/gm)].map((m) => m[1]));
  const dup = names.filter((n) => (src.match(new RegExp("(function |let |const |var )" + n + "\\b", "g")) || []).length !== 1);
  ok("every name in the block is the app's only one (" + names.length + ")", dup.length === 0, dup); }

function sandbox(o) {
  o = o || {};
  const writes = [];
  const ctx = {
    toMin, fromMin, console, Date, JSON, Set,
    esc: (s) => String(s == null ? "" : s), ampmTo24: (s) => s, to12h: (s) => s, cap: (s) => String(s).charAt(0).toUpperCase() + String(s).slice(1),
    momHere: () => o.mom !== false, _dryRun: () => false, dbg: () => {}, renderAll: () => {},
    db: { ref: () => ({ update: (u) => writes.push(JSON.parse(JSON.stringify(u))) }) },
    rulesData: { schoolDay: { defaultStart: "10:00 AM", defaultEnd: "4:15 PM", lunchStart: "1:00 PM", lunchEnd: "2:00 PM" }, sundayCatchup: o.on || null },
    currData: { subjects: {} }, ROSTER: ["kid1", "kid2"],
    _todayDay: o.today || "sunday", calToday: () => o.todayIso || "2026-11-01",
    calDateForWeekDay: (dn) => { const mon = o.monday || "2026-11-02"; const i = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].indexOf(dn); if (i < 0) return null; const d = new Date(mon + "T12:00:00"); d.setDate(d.getDate() + i); return d.toISOString().slice(0, 10); },
    weekData: { week: "week31", tasks: o.tasks || [] },
    document: { getElementById: () => null, createElement: () => ({ style: {} }), body: { appendChild: () => {} } },
  };
  vm.createContext(ctx);
  vm.runInContext(ST + "\n" + DT + "\n" + SC + "\nthis._dt=function(){ return dtState; };", ctx);
  ctx._writes = writes;
  return ctx;
}
let N = 0;
const c = (who, day, time, sk, x) => Object.assign({ id: who + "_" + sk + "_" + (N++), who, day, time, dur: 30, subjectKey: sk, title: sk, detail: "", mom: "none" }, x || {});
function week() {
  N = 0;
  return [
    c("kid1", "monday", "10:00 AM", "math"), c("kid1", "tuesday", "10:00 AM", "math"), c("kid1", "wednesday", "10:00 AM", "math"),
    c("kid1", "thursday", "10:00 AM", "math", { catchup: true }), c("kid1", "friday", "10:00 AM", "math", { catchup: true }),   // 2 catch-up sittings
    c("kid1", "monday", "11:00 AM", "reading"), c("kid1", "friday", "11:00 AM", "reading"),                                   // no catch-up
    c("kid1", "monday", "10:00 AM", "grammar", { detail: "Grammar — L12 (Carried from week30)" }),                            // carried
    c("kid1", "monday", "10:00 AM", "math_c"), c("kid1", "friday", "3:00 PM", "spelling", { catchup: true, _eowOverflow: true }),
    c("kid2", "monday", "10:00 AM", "math"), c("kid2", "friday", "10:00 AM", "math", { catchup: true }),                       // kid2 off
  ];
}

console.log("1. the pick");
{
  const S = sandbox({ on: { kid1: true } });
  const W = week(); const ids = (set) => [...set].sort();
  const set = S.sucPick(W, S.sucOn, true);
  const want = [W[0].id, W[1].id, W[7].id].sort();   // math Mon + Tue (the EARLIEST two), grammar carried
  ok("carried card + the earliest 2 math (not Thu/Fri's flagged extras)", JSON.stringify(ids(set)) === JSON.stringify(want), ids(set));
  ok("a subject with no catch-up stays on its weekdays", !set.has(W[5].id) && !set.has(W[6].id));
  ok("a kid switched off gets nothing", !set.has(W[10].id) && !set.has(W[11].id));
  ok("end-of-week overflow never", !set.has(W[9].id));
  ok("not the coming week on the board → nothing", S.sucPick(W, S.sucOn, false).size === 0);
  const W2 = week(); W2[0].day = "wednesday"; W2[0].time = "9:00 AM";
  ok("order is day then time (Tue 10:00 before a Wed 9:00)", S.sucPick(W2, S.sucOn, true).has(W2[1].id));
}

console.log("2. the gate");
{
  ok("Sunday + kid1 on + Monday tomorrow → a set", sandbox({ on: { kid1: true }, tasks: week() }).sucSet().size === 3);
  ok("not Sunday → null", sandbox({ on: { kid1: true }, tasks: week(), today: "monday" }).sucSet() === null);
  ok("no kid on → null", sandbox({ on: { kid1: false }, tasks: week() }).sucSet() === null && sandbox({ tasks: week() }).sucSet() === null);
  ok("the board still holds LAST week (its Monday is not tomorrow) → empty", sandbox({ on: { kid1: true }, tasks: week(), monday: "2026-10-26" }).sucSet().size === 0);
  const S = sandbox({ on: { kid1: true }, tasks: week() }); const a = S.sucSet(); ok("memoised while the week is unchanged", S.sucSet() === a);
}

console.log("3. the real effectiveDay");
{
  const EFF = extractFn("effectiveDay");
  const mk = (o) => { const S = sandbox(o); vm.runInContext(EFF + "\nthis.effectiveDay=effectiveDay;", S);
    Object.assign(S, { checked: o.checked || {}, histState: o.hist || {}, momMoves: o.moves || {}, subjNoCarry: () => false, kidOffOwnDay: () => false, DAY_DT: { monday: "November 2", tuesday: "November 3", wednesday: "November 4", thursday: "November 5", friday: "November 6", saturday: "November 7" } }); return S; };
  const W = week();
  const S = mk({ on: { kid1: true }, tasks: W });
  ok("a picked card is Sunday's", S.effectiveDay(W[0]) === "sunday" && S.effectiveDay(W[7]) === "sunday");
  ok("an unpicked card keeps its own day", S.effectiveDay(W[3]) === "thursday" && S.effectiveDay(W[10]) === "monday");
  const C = mk({ on: { kid1: true }, tasks: W, checked: { [W[0].id]: "10:20 AM" }, hist: { [W[0].id]: { checkedOnDay: "sunday" } } });
  ok("done on Sunday stays on Sunday", C.effectiveDay(W[0]) === "sunday");
  const C2 = mk({ on: { kid1: true }, tasks: W, checked: { [W[0].id]: "10:20 AM" } });
  ok("checked this moment with no history yet → Sunday (what finalizeDone records as checkedOnDay)", C2.effectiveDay(W[0]) === "sunday");
  const C3 = mk({ on: { kid1: true }, tasks: W, checked: { [W[3].id]: "x" }, hist: { [W[3].id]: { checkedOnDay: "saturday" } } });
  ok("a card done earlier keeps the day history says", C3.effectiveDay(W[3]) === "saturday");
  const M = mk({ on: { kid1: true }, tasks: W, moves: { [W[1].id]: { mode: "push", toDay: "wednesday" } } });
  ok("a Mom move wins", M.effectiveDay(W[1]) === "wednesday");
  const off = mk({ tasks: W }), mon = mk({ on: { kid1: true }, tasks: W, today: "monday" });
  ok("no kid on → every card's day is its own", W.every((t) => off.effectiveDay(t) === t.day));
  ok("Monday (the day after) → every card back on its own day", W.every((t) => mon.effectiveDay(t) === t.day));
}

console.log("4. the switch");
{
  const S = sandbox({ on: { kid1: true } });
  S.sucToggle("kid2"); S.sucToggle("kid1");
  ok("on = one leaf true; off = null", JSON.stringify(S._writes) === JSON.stringify([{ "config/rules/sundayCatchup/kid2": true }, { "config/rules/sundayCatchup/kid1": null }]), S._writes);
  ok("this device follows at once", S.sucOn("kid2") && !S.sucOn("kid1"));
  const K = sandbox({ mom: false }); K.sucToggle("kid1"); ok("a kid lens writes nothing", K._writes.length === 0);
  const h = S.sucSettingsHTML();
  ok("the chips: one per kid, the on one ticked", /Sunday catch-up/.test(h) && /✓ Kid2/.test(h) && />Kid1</.test(h) && (h.match(/sucToggle\(/g) || []).length === 2);
}

console.log("5. a Sunday check-off's date");
{
  const ctx = { gwWeekDateRange: () => ({ start: "2026-11-02" }), Date };
  vm.createContext(ctx); vm.runInContext(extractFn("_lidWeekdayISO") + "\nthis.f=_lidWeekdayISO;", ctx);
  ok("Sunday of week31 = Nov 1 (the day before its Monday), Monday unchanged", ctx.f("week31", "sunday") === "2026-11-01" && ctx.f("week31", "monday") === "2026-11-02" && ctx.f("week31", "saturday") === "2026-11-07");
}

console.log("6. ⏰ DAYTIMES on a Sunday");
{
  const off = sandbox({ tasks: week() }), on = sandbox({ on: { kid1: true }, tasks: week() });
  ok("no kid on: no Sunday door", off.dtBtnHTML("sunday") === "" && off.dtCalRowHTML("2026-11-01", { school: true }, null, false).n === 0);
  ok("a kid on: the Sunday door and its date is today (the day before Monday)", /dtOpenDay\('sunday'\)/.test(on.dtBtnHTML("sunday")) && on.dtIso("sunday") === "2026-11-01");
  on.dtOpen("2026-11-01"); ok("the sheet opens for that Sunday", on._dt() && on._dt().dn === "sunday");
  const later = sandbox({ on: { kid1: true }, tasks: week(), today: "wednesday", todayIso: "2026-11-04" });
  ok("from another day, Sunday means the day BEFORE the week's Monday", later.dtIso("sunday") === "2026-11-01");
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
