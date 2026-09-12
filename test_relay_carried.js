/*
 * Node tests — her re-lay rule (2026-09-11): "a relay should take the pattern starting on the next
 * due that was carried over and relay the whole pattern." A card the overnight cascade carried onto
 * an off-pattern day triggers the re-sequence: it takes the next pattern sitting, every later lesson
 * slides one sitting, what falls off the week is deferred to next week's build. Runs the real REPROJ block.
 *   run:  node test_relay_carried.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const a = src.indexOf("// REPROJ_START"), b = src.indexOf("// REPROJ_END"); if (a < 0 || b < 0) { console.error("REPROJ markers"); process.exit(1); }
const block = src.slice(a, b);
let pass = 0, fail = 0;
function ok(name, cond, extra) { if (cond) { pass++; console.log("  ok  - " + name); } else { fail++; console.log("  FAIL- " + name + (extra !== undefined ? "  (" + JSON.stringify(extra) + ")" : "")); } }
const eq = (x, y) => JSON.stringify(x) === JSON.stringify(y);
const toMin = s => { if (!s) return 0; const m = String(s).match(/(\d+):(\d+)\s*(AM|PM)/i); if (!m) return 0; let h = +m[1] % 12; if (/PM/i.test(m[3])) h += 12; return h * 60 + +m[2]; };
const fromMin = m => { const h = Math.floor(m / 60), mm = m % 60; const ap = h >= 12 ? "PM" : "AM"; const hh = ((h + 11) % 12) + 1; return hh + ":" + String(mm).padStart(2, "0") + " " + ap; };
const packAround = (fixed, news, ctx) => { const cur = {}; fixed.forEach(t => { cur[t.who] = Math.max(cur[t.who] || ctx.start, toMin(t.time) + (t.dur || 20)); }); news.forEach(t => { const c = Math.max(cur[t.who] || ctx.start, ctx.start); t.time = fromMin(c); cur[t.who] = c + (t.dur || 20); }); return []; };
const dayCtx = () => ({ start: 600, end: 975, lunchStart: 780, lunchEnd: 840 });
function mkEnv() { const env = { console, JSON, Object, Array, String, Number, Math, parseInt, Date, RegExp }; vm.createContext(env); new vm.Script(block).runInContext(env); return env; }
const T = (id, day, time, title, extra) => Object.assign({ id, who: "lincoln", subjectKey: "ws", day, time, dur: 20, title, lid: id.split("_").pop() }, extra || {});
const O = (id, who, day, time, dur) => ({ id, who, subjectKey: "other", day, time, dur: dur || 20, title: "other" });
const OPTS = o => Object.assign({ todayDay: "tuesday", nowMin: 660, checked: {}, claimed: {}, dayCtx, packAround, toMin, fromMin, dayCap: 1, allowedDays: ["Mon", "Wed", "Fri"], lidOrder: ["L0005", "L0006", "L0007", "L0008"] }, o || {});
const L5 = "lincoln_lincoln__ws_L0005", L6 = "lincoln_lincoln__ws_L0006", L7 = "lincoln_lincoln__ws_L0007";
// the kid has school cards every weekday (so every day is a candidate), Sat too
const kidWeek = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"].map(d => O("o_" + d, "lincoln", d, "9:00 AM"));
// generator's desired week: it treats the carried L5 as still due and lays it on Monday (past), then L6 Wed, L7 Fri
const DESIRED = [T(L5, "monday", "10:00 AM", "WS 5"), T(L6, "wednesday", "10:00 AM", "WS 6"), T(L7, "friday", "10:00 AM", "WS 7")];
const dayOf = (r, id) => (r.tasksAfter.find(t => t.id === id) || {}).day || null;
const clone = a => a.map(t => Object.assign({}, t));   // _reprojectPlan edits task objects in place — never reuse a fixture across runs

console.log("── carried lesson → whole pattern re-laid from it ──");
{
  const e = mkEnv();
  const live = kidWeek.concat([T(L5, "tuesday", "1:00 PM", "WS 5", { cascadedFrom: "monday" }), T(L6, "wednesday", "10:00 AM", "WS 6"), T(L7, "friday", "10:00 AM", "WS 7")]);
  const r = e._reprojectPlan("lincoln", "ws", clone(live), DESIRED, OPTS());
  ok("the carried card is detected", eq(r.summary.carried, [L5]), r.summary);
  ok("L5 takes the next pattern sitting (Wed)", dayOf(r, L5) === "wednesday", dayOf(r, L5));
  ok("L6 slides to Fri", dayOf(r, L6) === "friday");
  ok("L7 falls off the week → deferred (removed this week; next week's build serves it first)", dayOf(r, L7) === null && r.upd[L7] === null && r.summary.deferred.indexOf(L7) >= 0 && r.summary.removed.indexOf(L7) >= 0);
  ok("the swept-to day (Tue) is not a landing day", !r.tasksAfter.some(t => t.subjectKey === "ws" && t.day === "tuesday"));
  ok("the carried marker is cleared once it sits on its pattern", r.upd[L5 + "/cascadedFrom"] === null && !r.tasksAfter.find(t => t.id === L5).cascadedFrom);
  ok("writes are targeted: day/time for the movers, null for the deferred, nothing for the other kid's cards", r.upd[L5 + "/day"] === "wednesday" && r.upd[L6 + "/day"] === "friday" && !Object.keys(r.upd).some(k => k.startsWith("o_")), Object.keys(r.upd));
  ok("cards on Wed/Fri stay one per day (cap 1)", r.tasksAfter.filter(t => t.subjectKey === "ws" && t.day === "wednesday").length === 1 && r.tasksAfter.filter(t => t.subjectKey === "ws" && t.day === "friday").length === 1);
  // Running again: the generator now (merge rule) serves L5 on the next pattern day, not the past
  // Monday — so its desired week is L5 Wed, L6 Fri, L7 next week, and the second run changes nothing.
  const DESIRED2 = [T(L5, "wednesday", "10:00 AM", "WS 5"), T(L6, "friday", "10:00 AM", "WS 6")];
  const r2 = e._reprojectPlan("lincoln", "ws", clone(r.tasksAfter), DESIRED2, OPTS());
  ok("idempotent: running again on the re-laid week changes nothing", eq(r2.summary.carried, []) && eq(r2.summary.moved, []) && eq(r2.summary.removed, []) && eq(r2.summary.added, []) && eq(r2.upd, {}), r2.summary);
}
console.log("\n── started / locked carried card holds still ──");
{
  const e = mkEnv();
  const live = kidWeek.concat([T(L5, "tuesday", "10:00 AM", "WS 5", { cascadedFrom: "monday" }), T(L6, "wednesday", "10:00 AM", "WS 6"), T(L7, "friday", "10:00 AM", "WS 7")]);
  const r = e._reprojectPlan("lincoln", "ws", clone(live), DESIRED, OPTS());   // 10:00 ≤ now 11:00 → started
  ok("a carried card already started today is locked: not carried, nothing moves", eq(r.summary.carried, []) && dayOf(r, L5) === "tuesday" && dayOf(r, L6) === "wednesday" && dayOf(r, L7) === "friday" && eq(r.upd, {}), r.summary);
  const r2 = e._reprojectPlan("lincoln", "ws", kidWeek.concat([T(L5, "tuesday", "1:00 PM", "WS 5", { cascadedFrom: "monday" }), T(L6, "wednesday", "10:00 AM", "WS 6")]), DESIRED.slice(0, 2), OPTS({ checked: { [L5]: 1 } }));
  ok("a checked carried card never moves", dayOf(r2, L5) === "tuesday" && eq(r2.summary.carried, []));
}
console.log("\n── cap 2, ➕ days, Saturday, no-op ──");
{
  const e = mkEnv();
  const live = kidWeek.concat([T(L5, "tuesday", "1:00 PM", "WS 5", { cascadedFrom: "monday" }), T(L6, "wednesday", "10:00 AM", "WS 6"), T(L7, "friday", "10:00 AM", "WS 7")]);
  const r = e._reprojectPlan("lincoln", "ws", clone(live), DESIRED, OPTS({ dayCap: 2 }));
  ok("cap 2: L5 + L6 both on Wed, L7 Fri, nothing deferred", dayOf(r, L5) === "wednesday" && dayOf(r, L6) === "wednesday" && dayOf(r, L7) === "friday" && eq(r.summary.deferred, []));
  // a ➕ day (Thu) shows up as a generator-wanted day → it is a landing day
  const plus = [T(L5, "monday", "10:00 AM", "WS 5"), T(L6, "wednesday", "10:00 AM", "WS 6"), T(L7, "thursday", "10:00 AM", "WS 7")];
  const r3 = e._reprojectPlan("lincoln", "ws", clone(live), plus, OPTS());
  ok("a ➕ day the generator wants is a landing day: L5 Wed, L6 Thu, L7 Fri", dayOf(r3, L5) === "wednesday" && dayOf(r3, L6) === "thursday" && dayOf(r3, L7) === "friday" && eq(r3.summary.deferred, []), [dayOf(r3, L5), dayOf(r3, L6), dayOf(r3, L7)]);
  // a card carried onto Saturday (overflow) with a Mon–Fri subject, today Friday afternoon → nothing after Fri is a pattern day → deferred
  const sat = kidWeek.concat([T("lincoln_lincoln__ws_L0018", "saturday", "10:00 AM", "WS 18", { cascadedFrom: "wednesday" })]);
  const r4 = e._reprojectPlan("lincoln", "ws", sat, [], OPTS({ todayDay: "friday", nowMin: 800, allowedDays: ["Mon", "Tue", "Wed", "Thu", "Fri"], lidOrder: ["L0018"] }));
  ok("Saturday-carried card of a Mon–Fri subject, Friday afternoon with room: it comes to TODAY after now (the next pattern sitting), marker cleared", dayOf(r4, "lincoln_lincoln__ws_L0018") === "friday" && toMin(r4.upd["lincoln_lincoln__ws_L0018/time"]) >= 800 && r4.upd["lincoln_lincoln__ws_L0018/cascadedFrom"] === null, { day: dayOf(r4, "lincoln_lincoln__ws_L0018"), upd: r4.upd });
  // same, but today already holds this subject's started card (cap 1 → no room today) → deferred to next week
  const sat2 = kidWeek.concat([T("lincoln_lincoln__ws_L0017", "friday", "12:45 PM", "WS 17"), T("lincoln_lincoln__ws_L0018", "saturday", "10:00 AM", "WS 18", { cascadedFrom: "wednesday" })]);
  const r4b = e._reprojectPlan("lincoln", "ws", sat2, [], OPTS({ todayDay: "friday", nowMin: 800, allowedDays: ["Mon", "Tue", "Wed", "Thu", "Fri"], lidOrder: ["L0017", "L0018"] }));
  ok("— and with no room left today (started card, cap 1): deferred to next week (Saturday is not its pattern)", dayOf(r4b, "lincoln_lincoln__ws_L0018") === null && r4b.upd["lincoln_lincoln__ws_L0018"] === null && eq(r4b.summary.deferred, ["lincoln_lincoln__ws_L0018"]) && dayOf(r4b, "lincoln_lincoln__ws_L0017") === "friday", { day: dayOf(r4b, "lincoln_lincoln__ws_L0018"), upd: r4b.upd });
  // a NON-carried later card never slides INTO today: today Wed (pattern), L5 carried on Tue?? — no: L5 carried on today (Wed, after now) stays; L6 (Fri) stays Fri
  const live7 = kidWeek.concat([T(L5, "wednesday", "2:00 PM", "WS 5", { cascadedFrom: "monday" }), T(L6, "friday", "10:00 AM", "WS 6")]);
  // with the merge rule the generator serves L5 on today (its card is there, after now) and L6 on Fri
  const r7 = e._reprojectPlan("lincoln", "ws", live7, [T(L5, "wednesday", "2:00 PM", "WS 5"), T(L6, "friday", "10:00 AM", "WS 6")], OPTS({ todayDay: "wednesday", nowMin: 660 }));
  ok("a carried card already on today (a pattern day, after now) stays there; L6 stays Fri; only the marker is cleared", dayOf(r7, L5) === "wednesday" && dayOf(r7, L6) === "friday" && eq(Object.keys(r7.upd), [L5 + "/cascadedFrom"]) && r7.upd[L5 + "/cascadedFrom"] === null, { L5: dayOf(r7, L5), L6: dayOf(r7, L6), upd: r7.upd });
  // no carried card, nothing pushed → the branch does not run at all (regression guard for every existing re-lay)
  const plain = kidWeek.concat([T(L5, "wednesday", "10:00 AM", "WS 5"), T(L6, "friday", "10:00 AM", "WS 6")]);
  const r5 = e._reprojectPlan("lincoln", "ws", plain, [T(L5, "wednesday", "10:00 AM", "WS 5"), T(L6, "friday", "10:00 AM", "WS 6")], OPTS());
  ok("no carried card → no re-sequence, no writes", eq(r5.summary.carried, []) && eq(r5.summary.resequenced, []) && eq(r5.upd, {}));
  // a card whose cascadedFrom equals its day (marker never cleaned) is not carried
  const same = kidWeek.concat([T(L5, "wednesday", "10:00 AM", "WS 5", { cascadedFrom: "wednesday" })]);
  const r6 = e._reprojectPlan("lincoln", "ws", same, [T(L5, "wednesday", "10:00 AM", "WS 5")], OPTS());
  ok("cascadedFrom equal to its own day is not a carry", eq(r6.summary.carried, []) && eq(r6.upd, {}));
}
console.log("\n── the carries box: a deferral takes the whole tail with it (live bug 2026-09-11) ──");
{
  const e = mkEnv();
  // today Thursday; subject runs Mon/Wed/Fri cap 1, so only Friday is a landing day.
  // L5 carried onto today, L6 carried onto Saturday (not its pattern), L7 parked in the
  // end-of-week carries box, L4 also parked but EARLIER in the book.
  const OPT = OPTS({ todayDay: "thursday", nowMin: 660, allowedDays: ["Mon", "Wed", "Fri"], lidOrder: ["L0004", "L0005", "L0006", "L0007"] });
  const L4 = "lincoln_lincoln__ws_L0004";
  const live = kidWeek.concat([
    T(L5, "thursday", "1:00 PM", "WS 5", { cascadedFrom: "monday" }),
    T(L6, "saturday", "10:00 AM", "WS 6", { cascadedFrom: "tuesday" }),
    T(L7, "wednesday", "11:50 AM", "WS 7", { cascadedFrom: "monday", _eowOverflow: true }),
    T(L4, "monday", "11:50 AM", "WS 4", { cascadedFrom: "monday", _eowOverflow: true })]);
  const r = e._reprojectPlan("lincoln", "ws", clone(live), [], OPT);
  ok("L5 (carried, today) takes Friday — the next pattern sitting", dayOf(r, L5) === "friday", dayOf(r, L5));
  ok("L6 has no pattern day left → deferred", dayOf(r, L6) === null && r.upd[L6] === null && r.summary.deferred.indexOf(L6) >= 0);
  ok("THE FIX: L7 sits in the carries box AFTER the deferred lesson → it leaves the week too", dayOf(r, L7) === null && r.upd[L7] === null && r.summary.deferred.indexOf(L7) >= 0, { L7: dayOf(r, L7), deferred: r.summary.deferred });
  ok("an earlier lesson parked in the carries box is NOT touched", dayOf(r, L4) === "monday" && !(L4 in r.upd), { L4: dayOf(r, L4) });
  ok("no write path is a prefix of another (Firebase multi-path)", (() => { const ks = Object.keys(r.upd); return ks.every(k => ks.every(o => o === k || !o.startsWith(k + "/"))); })(), Object.keys(r.upd));
}
{
  // Lincoln's REAL shape tonight, before the re-lay (week22, Friday): Editor in Chief runs
  // Mon–Fri cap 1. pg 32 on Friday (its pattern), pg 33 swept onto Saturday, pg 34 parked in
  // the carries box on Thursday. Old code deferred pg 33 and the cascade then promoted pg 34
  // onto Saturday, so the week read pg 32 → pg 34 and the order guard refused it.
  const e = mkEnv();
  const A = "lincoln_lincoln__ws_L0017", B = "lincoln_lincoln__ws_L0018", C = "lincoln_lincoln__ws_L0019";
  const OPT = OPTS({ todayDay: "friday", nowMin: 13 * 60, allowedDays: ["Mon", "Tue", "Wed", "Thu", "Fri"], lidOrder: ["L0017", "L0018", "L0019"] });
  const live = kidWeek.concat([
    T(A, "friday", "12:45 PM", "EIC — B2 pg 32"),
    T(B, "saturday", "12:20 PM", "EIC — B2 pg 33", { cascadedFrom: "wednesday" }),
    T(C, "thursday", "12:45 PM", "EIC — B2 pg 34", { cascadedFrom: "wednesday", _eowOverflow: true })]);
  const r = e._reprojectPlan("lincoln", "ws", clone(live), [], OPT);
  ok("pg 32 keeps its Friday slot", dayOf(r, A) === "friday" && !(A in r.upd));
  ok("pg 33 (carried to Saturday, not a pattern day, no room left) → deferred", dayOf(r, B) === null && r.upd[B] === null);
  ok("pg 34 goes with it, so the cascade cannot promote it into the gap", dayOf(r, C) === null && r.upd[C] === null, { C: dayOf(r, C) });
  const left = r.tasksAfter.filter(t => t.subjectKey === "ws").map(t => t.lid);
  ok("the week ends on a contiguous run: pg 32 alone", JSON.stringify(left) === JSON.stringify(["L0017"]), left);
}

console.log("\n── wiring ──");
{
  const rp = block;
  ok("carried = unlocked, today or later, not overflow, swept by the cascade", /const carried=after\.filter\(t=>isPlanCard\(t\)&&dayIx\(t\.day\)>=tIx&&!locked\(t\)&&!t\._eowOverflow&&t\.cascadedFrom&&t\.cascadedFrom!==t\.day\);/.test(rp));
  ok("the re-sequence runs for a push OR a carried card", /if\(summary\.pushed\.length\|\|carried\.length\)\{/.test(rp));
  ok("a carried card's swept-to day is never a landing day", /!carriedIds\[t\.id\]\) dayOk\[t\.day\]=1;/.test(rp) && /if\(carriedIds\[id\]\) return; const d=orig0\[id\]\.day;/.test(rp));
  ok("a Mom push alone keeps the older keep-where-started behaviour", /if\(carried\.length\)\{ const mi2=/.test(rp) && /summary\.kept\.push\(t\.id\); return;/.test(rp));
  ok("reprojectSubjectWeek logs the carried count", /🔁"\+\(\(r\.summary\.carried\|\|\[\]\)\.length\)/.test(src));
  ok("a deferral takes every later lesson of the subject with it", /if\(summary\.deferred\.length\)\{/.test(rp) && /if\(_cgRank\(t\)<=_minR\) return;/.test(rp));
  ok("the contiguity guard runs for ANY deferral, not just the re-sequence branch", /CONTIGUITY GUARD/.test(rp) && rp.indexOf("if(summary.deferred.length){") > rp.indexOf("if(summary.pushed.length||carried.length){"));
  ok("sub-path writes are cleared before a card is nulled", /const _rmPaths=id=>/.test(rp) && (rp.match(/_rmPaths\(t\.id\); upd\[t\.id\]=null;/g) || []).length === 2);
}
console.log("\n── generator merge: a past day whose card was carried away is not served again ──");
{
  const LANE = src.slice(src.indexOf("// LANE_START"), src.indexOf("// LANE_END"));
  const ma = src.indexOf("      {\n        const _t=(typeof cbTodayISO===\"function\")?cbTodayISO():\"\";"), mb = src.indexOf("      const cursor=(savedCursors", ma);
  const MERGE = src.slice(ma, mb);
  function merge(o) {
    const subjects = { ws: { display: "WS", lessonSeq: ["a", "b", "c"], lessonIds: ["L0001", "L0002", "L0003"], doneImportedAt: 1, planId: "x", allowedDays: ["Mon", "Wed", "Fri"], timesPerWeek: 3, pacing: { mode: "timesPerWeek", tpw: 3 } } };
    const ctx = { console, Object, Array, String, Number, Math, JSON, Set, parseInt, Date, kid: "kid", sk: "ws", subjects, currData: { subjects: { kid: subjects }, done: { kid: {} } },
      dates: o.dates.slice(), dayData: {}, cbTodayISO: () => o.today, _gwPlanDates: () => o.projected || [], dbg: () => {}, schedOv: () => null,
      weekData: { tasks: o.tasks || [] }, DAY_DT: { monday: "September 14", tuesday: "September 15", wednesday: "September 16", thursday: "September 17", friday: "September 18" },
      lidsFor: () => subjects.ws.lessonIds, lidStamped: () => true, planBacked: () => true, lidDoneIdx: () => new Set(), cbDefaultForm: () => ({ mode: "timesPerWeek", tpw: 3, allowedDays: ["Mon", "Wed", "Fri"] }) };
    o.dates.forEach(d => { ctx.dayData[d] = { kid: { ws: "TMP" } }; }); (o.projected || []).forEach(d => { ctx.dayData[d] = ctx.dayData[d] || { kid: {} }; });
    vm.createContext(ctx); vm.runInContext(LANE + "\n" + MERGE, ctx); return ctx.dates;
  }
  const yr = new Date().getFullYear();   // DAY_DT is "Month day"; the merge appends the current year — pin the fixture to it
  const iso = (m, d) => yr + "-" + String(m).padStart(2, "0") + "-" + String(d).padStart(2, "0");
  const ctxDates = { mon: iso(9, 14), tue: iso(9, 15), wed: iso(9, 16), fri: iso(9, 18) };
  const card = (day) => ({ id: "kid_x_L0001", who: "kid", subjectKey: "ws", day });
  const a = merge({ today: ctxDates.tue, dates: [ctxDates.mon, ctxDates.wed, ctxDates.fri], projected: [ctxDates.wed, ctxDates.fri], tasks: [card("tuesday")] });
  ok("Monday's card was carried to Tuesday → Monday is no longer served (L5 lands Wed)", eq(a, [ctxDates.wed, ctxDates.fri]), a);
  const b = merge({ today: ctxDates.tue, dates: [ctxDates.mon, ctxDates.wed, ctxDates.fri], projected: [ctxDates.wed, ctxDates.fri], tasks: [card("monday")] });
  ok("a past day that still holds its card is kept as before", eq(b, [ctxDates.mon, ctxDates.wed, ctxDates.fri]), b);
  const c = merge({ today: ctxDates.mon, dates: [ctxDates.mon, ctxDates.wed], projected: [ctxDates.wed], tasks: [] });
  ok("today is always kept, even with no card yet", eq(c, [ctxDates.mon, ctxDates.wed]), c);
}
console.log("\n" + pass + " passed, " + fail + " failed"); process.exit(fail ? 1 : 0);
