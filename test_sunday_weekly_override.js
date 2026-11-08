/*
 * Node tests — 🔁 SUNDAY'S WEEKLY TIMES. Her ask 2026-10-31 (Polar Express busy season): every Sunday 9:00 AM–12:00 PM for
 * catch-up, set ONCE in Settings ▸ School Day Times ▸ Per-Day Overrides instead of date by date. Stored exactly like Saturday's:
 * config/rules/schoolDay/overrides/sunday = {start,end,...}.
 *
 * Checks, against code sliced verbatim out of index.html (and the card as it was before, from git, for the byte-identical check):
 *   0. shape: the Sunday chip is gated on dtSunOk(); every Sunday reader asks overrides[<day name>] the same way Saturday's does
 *   1. the card: no kid on Sunday catch-up + no Sunday override → the card is byte-identical to before; a kid on → "Sunday"
 *      is offered; a Sunday override already set stays listed (with Remove) even after catch-up is switched off
 *   2. save: the Sunday chip / time boxes write overrides/sunday through the same rulesUpdateDayOverride; Mon–Sat untouched;
 *      Remove takes only Sunday away
 *   3. read: dtUsual / dtDay("sunday") give 9:00–12:00; the live day's readers (gateStartMin, _mvtSchoolStartMin, _mlDayEndMin,
 *      seGuardCtx) see it on a Sunday; a date's own ⏰ byDate leaf still wins over it, on its date only
 *   4. Mon–Sat byte-identical with and without the Sunday override; no Sunday override → Sunday reads the defaults as before
 *
 *   run:  node test_sunday_weekly_override.js          (reads ./index.html)
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const cp = require("child_process");
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
const SU = slice("// SUNDAYCU_START", "// SUNDAYCU_END");
const CARD = extractFn("rulesSchoolDayCardHTML");
// The card as it was before this change (origin/main's first parent of this branch), when git can tell us.
let CARD_OLD = null;
try {
  const old = cp.execSync("git show origin/main:index.html", { cwd: __dirname, maxBuffer: 1 << 30, stdio: ["ignore", "pipe", "ignore"] }).toString("utf8");
  const c = extractFn("rulesSchoolDayCardHTML", old);
  if (!/dtSunOk/.test(c)) CARD_OLD = c;   // only if origin/main hasn't taken this change yet
} catch (e) {}

// ── 0. shape ──
console.log("0. shape");
ok("Per-Day Overrides adds Sunday only through dtSunOk() (or one already set)", /const sdDays=\["monday","tuesday","wednesday","thursday","friday","saturday"\]\s*\.concat\(\(\(typeof dtSunOk==="function"&&dtSunOk\(\)\)\|\|sdOv\.sunday\)\?\["sunday"\]:\[\]\);/.test(CARD));
ok("the save / remove are the same day-name functions Saturday uses", /rulesUpdateDayOverride\(\\''\+d\+'\\',\\'start\\'/.test(CARD) && /rulesRemoveDayOverride\(\\''\+d\+'\\'\)/.test(CARD));
{ const L = extractFn("_mlQueueLayCore");
  ok("the Mom loop lay reads today's override by day name, then the date's own start", /\(\(_sd\.overrides\|\|\{\}\)\[_todayDay\]\)\|\|\{\}\)\.start\|\|_sd\.defaultStart\|\|"10:00 AM"; return toMin\(\(typeof dtS==="function"\)\?dtS\(_todayDay,_v\):_v\)/.test(L)); }
ok("dtUsual reads overrides[dn] for any day name (Sunday included)", /ov=\(sd\.overrides\|\|\{\}\)\[dn\]\|\|\{\}/.test(extractFn("dtUsual", DT)));

// ── a sandbox: SETTIME + DAYTIMES + SUNDAYCU + the card + its save/remove + the live-day readers ──
function sandbox(o) {
  o = o || {};
  const writes = [];
  const ctx = {
    toMin, fromMin, console, Date, JSON,
    esc: (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])),
    ampmTo24: (s) => { const m = String(s || "").match(/(\d+):(\d+)\s*(AM|PM)/i); if (!m) return s; let h = +m[1]; if (/PM/i.test(m[3]) && h !== 12) h += 12; if (/AM/i.test(m[3]) && h === 12) h = 0; return String(h).padStart(2, "0") + ":" + m[2]; },
    to12h: (s) => { const p = String(s || "").split(":"); if (p.length !== 2) return s; let h = +p[0]; const ap = h >= 12 ? "PM" : "AM"; if (h === 0) h = 12; else if (h > 12) h -= 12; return h + ":" + p[1] + " " + ap; },
    cap: (s) => String(s).charAt(0).toUpperCase() + String(s).slice(1),
    momHere: () => true, onecalMom: () => true,
    _dryRun: () => false, dbg: () => {}, renderAll: () => {}, schedCascade: () => {}, gwShowToast: () => {},
    db: { ref: () => ({ update: (u) => writes.push(JSON.parse(JSON.stringify(u))) }) },
    rulesData: o.rules || { schoolDay: { defaultStart: "9:00 AM", defaultEnd: "4:15 PM", lunchStart: "1:00 PM", lunchEnd: "2:00 PM", overrides: { saturday: { start: "9:00 AM", end: "12:00 PM" } } } },
    rulesOpen: {},
    gwDeviceCaps: () => ({ screen: 2, computer: 1, keyboard: 1 }),
    ROSTER: ["lincoln", "ellis", "lucy", "julian"],
    DAY_COL: { monday: "#1e3a5f", tuesday: "#2d5a3d", wednesday: "#5b3a8c", thursday: "#c45e1a", friday: "#b5394a", saturday: "#1a6b5a", sunday: "#7c5295" },
    DAY_LBL: { monday: "Monday", tuesday: "Tuesday", wednesday: "Wednesday", thursday: "Thursday", friday: "Friday", saturday: "Saturday", sunday: "Sunday" },
    currData: { subjects: {} },
    _todayDay: o.today || "sunday",
    calToday: () => o.todayIso || "2026-11-01",
    // the week on the board is the COMING week (Sunday auto-build ran): Sunday Nov 1 is the day before its Monday
    calDateForWeekDay: (dn) => ({ monday: "2026-11-02", tuesday: "2026-11-03", wednesday: "2026-11-04", thursday: "2026-11-05", friday: "2026-11-06", saturday: "2026-11-07" }[dn] || null),
    document: { getElementById: () => null, createElement: () => ({ style: {} }), body: { appendChild: () => {} } },
    _saved: 0,
  };
  ctx.saveRules = (r) => { ctx._saved++; ctx.rulesData = r; };
  vm.createContext(ctx);
  vm.runInContext([ST, DT, SU, CARD, extractFn("rulesUpdateDayOverride"), extractFn("rulesRemoveDayOverride"),
    extractFn("gateStartMin"), extractFn("_mvtSchoolStartMin"), extractFn("_mlDayEndMin"), extractFn("seGuardCtx")].join("\n")
    + (CARD_OLD ? "\nthis._cardOld=(function(){ " + CARD_OLD + "; return rulesSchoolDayCardHTML; })();" : ""), ctx);
  ctx._writes = writes;
  if (o.sunOn) ctx.rulesData.sundayCatchup = { lincoln: true };
  return ctx;
}
const sunChip = /rulesUpdateDayOverride\('sunday','start','09:00'\)[^>]*>Sunday<\/button>/;

// ── 1. the card ──
console.log("1. the card");
{
  const S = sandbox();
  const h = S.rulesSchoolDayCardHTML(S.rulesData, true);
  ok("no kid on Sunday catch-up: no Sunday anywhere in Per-Day Overrides", !/'sunday'/.test(h));
  ok("…and Saturday's override + the Mon–Fri chips draw as before", /rulesRemoveDayOverride\('saturday'\)/.test(h) && /rulesUpdateDayOverride\('friday','start','09:00'\)/.test(h));
  if (CARD_OLD) {
    const cfgs = [
      S.rulesData,
      { schoolDay: { defaultStart: "10:00 AM", defaultEnd: "4:15 PM" } },
      { schoolDay: { defaultStart: "9:00 AM", overrides: { friday: { end: "3:00 PM" }, saturday: { start: "9:00 AM", end: "12:00 PM" } }, byDate: { "2026-11-01": { end: "12:00 PM" } } } },
      { schoolDay: { overrides: { monday: { start: "8:00 AM" }, tuesday: { start: "8:00 AM" }, wednesday: { start: "8:00 AM" }, thursday: { start: "8:00 AM" }, friday: { start: "8:00 AM" }, saturday: { start: "8:00 AM" } } } },
    ];
    ok("byte-identical to the card before this change (" + cfgs.length + " Settings shapes, no Sunday catch-up)", cfgs.every((r) => { S.rulesData = r; return S.rulesSchoolDayCardHTML(r, true) === S._cardOld(r, true); }));
  } else ok("byte-identical check skipped (origin/main not readable or already has this change) — shape test above covers the gate", true);
  const N = sandbox({ sunOn: true });
  const hn = N.rulesSchoolDayCardHTML(N.rulesData, true);
  ok("a kid on Sunday catch-up: Sunday is offered under Add override", sunChip.test(hn));
  if (CARD_OLD) ok("…and that chip is the only difference from before", hn.replace(/<button onclick="rulesUpdateDayOverride\('sunday'[^]*?<\/button>/, "") === N._cardOld(N.rulesData, true));
}

// ── 2. save / remove ──
console.log("2. save / remove");
{
  const S = sandbox({ sunOn: true });
  const before = JSON.stringify(Object.assign({}, S.rulesData.schoolDay.overrides));
  S.rulesUpdateDayOverride("sunday", "start", "09:00");
  S.rulesUpdateDayOverride("sunday", "end", "12:00");
  const ov = S.rulesData.schoolDay.overrides;
  ok("Sunday saved as overrides/sunday = 9:00 AM–12:00 PM", JSON.stringify(ov.sunday) === JSON.stringify({ start: "9:00 AM", end: "12:00 PM" }), ov.sunday);
  const rest = Object.assign({}, ov); delete rest.sunday;
  ok("Mon–Sat overrides untouched", JSON.stringify(rest) === before, rest);
  ok("written through saveRules (no write of its own)", S._saved === 2 && S._writes.length === 0);
  const h = S.rulesSchoolDayCardHTML(S.rulesData, true);
  ok("the card lists Sunday with its times and Remove, and no longer offers it under Add", /rulesRemoveDayOverride\('sunday'\)/.test(h) && /value="09:00" onchange="rulesUpdateDayOverride\('sunday','start'/.test(h) && /value="12:00" onchange="rulesUpdateDayOverride\('sunday','end'/.test(h) && !sunChip.test(h));
  delete S.rulesData.sundayCatchup;
  const hOff = S.rulesSchoolDayCardHTML(S.rulesData, true);
  ok("catch-up switched off later: the Sunday override stays listed so it can be removed", /rulesRemoveDayOverride\('sunday'\)/.test(hOff));
  S.rulesRemoveDayOverride("sunday");
  ok("Remove takes only Sunday away", !S.rulesData.schoolDay.overrides.sunday && JSON.stringify(S.rulesData.schoolDay.overrides) === before);
  const h2 = S.rulesSchoolDayCardHTML(S.rulesData, true);
  ok("…and with catch-up off, Sunday is gone from the card again", !/'sunday'/.test(h2));
}

// ── 3. read ──
console.log("3. read");
{
  const S = sandbox({ sunOn: true });
  ok("no Sunday override: Sunday reads the defaults as before (9:00 AM–4:15 PM)", S.dtUsual("sunday").s === 540 && S.dtUsual("sunday").e === 975 && S._mlDayEndMin() === 975);
  S.rulesUpdateDayOverride("sunday", "start", "09:00"); S.rulesUpdateDayOverride("sunday", "end", "12:00");
  ok("dtUsual('sunday') = the weekly 9:00–12:00", S.dtUsual("sunday").s === 540 && S.dtUsual("sunday").e === 720);
  ok("dtDay on any Sunday date = 9:00–12:00", S.dtDay("sunday", "2026-11-08").s === 540 && S.dtDay("sunday", "2026-11-08").e === 720 && S.dtDay("sunday", "2027-01-10").e === 720);
  ok("live day on a Sunday: Mom loop cut line is 12:00 PM", S._mlDayEndMin() === 720);
  ok("…start gate + Move-to-today start are 9:00 AM", S.gateStartMin("sunday") === 540 && S._mvtSchoolStartMin() === 540);
  ok("…school-end guard window for Sunday is 9:00–12:00", S.seGuardCtx().win("sunday").start === 540 && S.seGuardCtx().win("sunday").end === 720);
  ok("the Month day sheet / day banner say 9:00 AM–12:00 PM for a Sunday", /9:00 AM–12:00 PM/.test(S.dtCalRowHTML("2026-11-08", { school: true }, null, false).html));
  // a date's own leaf wins (her byDate Sundays Nov 1 – Dec 20)
  S.rulesData.schoolDay.byDate = { "2026-11-01": { end: "11:30 AM" }, "2026-11-08": { start: "10:00 AM", end: "1:00 PM" } };
  ok("today's own ⏰ leaf (Nov 1) beats the weekly Sunday: cut line 11:30 AM, start still the weekly 9:00", S._mlDayEndMin() === 690 && S._mvtSchoolStartMin() === 540 && S.gateStartMin("sunday") === 540);
  ok("Nov 8's own leaf wins on Nov 8 only", S.dtDay("sunday", "2026-11-08").s === 600 && S.dtDay("sunday", "2026-11-08").e === 780 && S.dtDay("sunday", "2026-11-15").e === 720);
  ok("the Month sheet shows Nov 8 as its own day, 'usually' the weekly Sunday", /this day only \(usually 9:00 AM–12:00 PM/.test(S.dtCalRowHTML("2026-11-08", { school: true }, null, false).html));
}

// ── 4. Mon–Sat byte-identical ──
console.log("4. Mon–Sat unchanged");
{
  const A = sandbox({ sunOn: true, today: "tuesday", todayIso: "2026-11-03" });
  const B = sandbox({ sunOn: true, today: "tuesday", todayIso: "2026-11-03" });
  B.rulesUpdateDayOverride("sunday", "start", "09:00"); B.rulesUpdateDayOverride("sunday", "end", "12:00");
  const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const snap = (S) => JSON.stringify(DAYS.map((d) => [S.dtUsual(d), S.dtDay(d), S.gateStartMin(d), S.seGuardCtx().win(d)]).concat([S._mlDayEndMin(), S._mvtSchoolStartMin()]));
  ok("every Mon–Sat reader gives the same answer with and without the Sunday override", snap(A) === snap(B));
  ok("Saturday still reads its own 9:00–12:00", B.dtUsual("saturday").s === 540 && B.dtUsual("saturday").e === 720);
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
