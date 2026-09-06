/*
 * _gwWeekConsumed — mid-week regen: which lessons has the ACTIVE week already used up?
 *
 * Live 2026-09-03 (Lincoln AAS): a Rebuild re-dealt the week while today's L2-16 card was
 * started but unchecked. The generator re-served L2-16 for Friday; that wanted card could not
 * land (the live one is locked to Thursday) and Friday's two real cards were not wanted, so the
 * re-deal deleted both. A started card's lesson is spoken for.
 *
 *   run: node test_regen_started.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
function extractFn(name) {
  const start = src.search(new RegExp("^function\\s+" + name + "\\s*\\(", "m"));
  if (start < 0) throw new Error("fn not found: " + name);
  let i = src.indexOf("{", start), depth = 0, inStr = null, esc = false;
  for (let j = i; j < src.length; j++) {
    const c = src[j];
    if (esc) { esc = false; continue; }
    if (c === "\\") { esc = true; continue; }
    if (inStr) { if (c === inStr) inStr = null; continue; }
    if (c === "/" && src[j + 1] === "/") { j = src.indexOf("\n", j); continue; }
    if (c === '"' || c === "'" || c === "`") { inStr = c; continue; }
    if (c === "{") depth++;
    else if (c === "}") { depth--; if (!depth) return src.slice(start, j + 1); }
  }
  throw new Error("unbalanced: " + name);
}
const body = ["_gwWeekConsumed", "taskLessonRef"].map(extractFn).join("\n");
let pass = 0, fail = 0;
const ok = (n, c, x) => c ? (pass++, console.log("  ok  - " + n)) : (fail++, console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x) : "")));

// World: today is THURSDAY 3:00 PM. Week dates Mon Aug 31 … Sat Sep 5.
const DAY_DT = { monday: "August 31", tuesday: "September 1", wednesday: "September 2", thursday: "September 3", friday: "September 4", saturday: "September 5" };
function run(tasks, dates, checked, claimed) {
  const dayData = {}; dates.forEach(d => { dayData[d] = { lincoln: { aas: "TMP", other: "x" } }; });
  const ctx = {
    console, Date: class extends Date { constructor(...a) { if (!a.length) { super(2026, 8, 3, 15, 0, 0); } else super(...a); } },
    weekData: { tasks }, checked: checked || {}, claimed: claimed || {}, _todayDay: "thursday", _todayStr: () => "2026-09-03", DAY_DT,
    toMin: s => { const m = /(\d+):(\d+)\s*(AM|PM)/i.exec(s || ""); if (!m) return null; let h = +m[1] % 12; if (/pm/i.test(m[3])) h += 12; return h * 60 + +m[2]; },
  };
  vm.createContext(ctx);
  const ds = dates.slice();
  ctx.__dates = ds; ctx.__dd = dayData;
  vm.runInContext(body + "\nvar __seen={}; var __n=_gwWeekConsumed('lincoln','aas',__dates,__dd,__seen);", ctx);
  return { n: ctx.__n, dates: ds, dayData, seen: ctx.__seen };
}
const card = (id, day, time, ref, extra) => Object.assign({ id: "lincoln_lincoln__aas_" + id, who: "lincoln", subjectKey: "aas", day, time, title: "📄 AAS Lesson — " + ref }, extra || {});

console.log("\n── her live case: started today, off-pattern day ──");
{
  // Thu 2:40 PM L2-16 (started, unchecked, Thursday is NOT an AAS day so it holds no slot),
  // Fri 12:30 L2-17 + Fri 2:00 L2-18 (future, unlocked). Serving list = [Friday].
  const r = run([card("L0011", "thursday", "2:40 PM", "L2-16"), card("L0009", "friday", "12:30 PM", "L2-17"), card("L0012", "friday", "2:00 PM", "L2-18")], ["2026-09-04"]);
  ok("the started card consumes ONE lesson (L2-16)", r.n === 1, r.n);
  ok("Friday's slot is NOT dropped for it — Thursday held no slot", r.dates.join() === "2026-09-04", r.dates);
  ok("dayData for Friday still holds the subject", r.dayData["2026-09-04"].lincoln.aas === "TMP");
  // The serve loop skips lessons BY TEXT through the caller's set — the first live push
  // returned only a count and left that set empty, so generation threw for every plan-backed
  // subject and the re-deal silently did nothing (2026-09-03, 9:10 PM).
  ok("the caller's seen-set is filled with the started lesson's ref", r.seen && r.seen["L2-16"] === true, r.seen);
}
console.log("\n── future unchecked cards consume nothing ──");
{
  const r = run([card("L0009", "friday", "12:30 PM", "L2-17"), card("L0012", "friday", "2:00 PM", "L2-18")], ["2026-09-04"]);
  ok("nothing consumed", r.n === 0 && r.dates.length === 1, r);
}
console.log("\n── a card later TODAY is not started ──");
{
  const r = run([card("L0011", "thursday", "4:00 PM", "L2-16")], ["2026-09-03", "2026-09-04"]);
  ok("4:00 PM card at 3:00 PM consumes nothing", r.n === 0 && r.dates.length === 2, r);
}
console.log("\n── a checked card frees exactly ITS OWN slot ──");
{
  const r = run([card("L0011", "wednesday", "1:00 PM", "L2-16")], ["2026-09-02", "2026-09-04"], { lincoln_lincoln__aas_L0011: "1:20 PM Sep 2" });
  ok("one consumed", r.n === 1);
  ok("its own slot (Wednesday) is dropped, Friday kept", r.dates.join() === "2026-09-04", r.dates);
  ok("Wednesday's dayData entry cleared so no phantom is laid", r.dayData["2026-09-02"].lincoln.aas === undefined && r.dayData["2026-09-02"].lincoln.other === "x");
  // Ellis's live case: the checked card sat on an OFF-pattern day (cascaded to Thursday); the old
  // front-drop took Friday's slot for it and the re-deal removed Friday's Pg 52–54.
  const r2 = run([card("L0011", "thursday", "11:49 AM", "Pg 49–51")], ["2026-09-04"], { lincoln_lincoln__aas_L0011: "12:10 PM Sep 3" });
  ok("checked card on an off-pattern day consumes its lesson but frees NO slot — Friday stays", r2.n === 1 && r2.dates.join() === "2026-09-04", r2.dates);
}
console.log("\n── a started card on a PATTERN day frees exactly its own date ──");
{
  // Wed L2-16 undone (past day → started/locked), serving list [Wed, Fri, Sat]
  const r = run([card("L0011", "wednesday", "1:00 PM", "L2-16")], ["2026-09-02", "2026-09-04", "2026-09-05"]);
  ok("one consumed", r.n === 1);
  ok("its own date leaves the list; the others stay", r.dates.join() === "2026-09-04,2026-09-05", r.dates);
}
console.log("\n── claimed counts like checked; overflow and carry twins ──");
{
  const r = run([card("L0011", "tuesday", "1:00 PM", "L2-16"), card("L0011_c", "thursday", "2:00 PM", "L2-16"), card("L0020", "wednesday", "1:00 PM", "L2-25", { _eowOverflow: true })],
    ["2026-09-01", "2026-09-04"], {}, { lincoln_lincoln__aas_L0011: true });
  ok("claimed card + its carry twin = ONE lesson; overflow ignored", r.n === 1, r.n);
  ok("the claimed card's own Tuesday slot dropped", r.dates.join() === "2026-09-04", r.dates);
}
console.log("\n── mixed: one done + one started ──");
{
  const r = run([card("L0011", "tuesday", "1:00 PM", "L2-16"), card("L0009", "thursday", "2:40 PM", "L2-17")], ["2026-09-01", "2026-09-04"], { lincoln_lincoln__aas_L0011: "1:20 PM Sep 1" });
  ok("two consumed", r.n === 2, r.n);
  ok("only the done card's own Tuesday slot is dropped; Friday stays for the NEXT lesson", r.dates.join() === "2026-09-04", r.dates);
}
// ── Sunday regen: the week is all ahead — nothing is started (2026-09-06: weekday-position
// compare put Sunday after every weekday, consumed every lesson, dropped every subject). ──
console.log("Sunday regen — nothing started");
{
  const tasks = [card(1, "tuesday", "10:00 AM", "L2-16"), card(2, "wednesday", "10:00 AM", "L2-17"), card(3, "friday", "10:00 AM", "L2-18")];
  const dates = ["2026-09-01", "2026-09-02", "2026-09-04"]; const dayData = {}; dates.forEach(d => { dayData[d] = { lincoln: { aas: "TMP" } }; });
  const ctx = {
    console, Date: class extends Date { constructor(...a) { if (!a.length) { super(2026, 7, 30, 16, 0, 0); } else super(...a); } },
    weekData: { tasks }, checked: {}, claimed: {}, _todayDay: "sunday", _todayStr: () => "2026-08-30", DAY_DT,
    toMin: s => { const m = /(\d+):(\d+)\s*(AM|PM)/i.exec(s || ""); if (!m) return null; let h = +m[1] % 12; if (/pm/i.test(m[3])) h += 12; return h * 60 + +m[2]; },
  };
  vm.createContext(ctx); ctx.__dates = dates; ctx.__dd = dayData;
  vm.runInContext(body + "\nvar __seen={}; var __n=_gwWeekConsumed('lincoln','aas',__dates,__dd,__seen);", ctx);
  ok("Sunday before the week consumes nothing", ctx.__n === 0, ctx.__n);
  ok("every date stays in the serving list", dates.length === 3, dates);
  ok("dayData slots stay", Object.keys(dayData).every(d => dayData[d].lincoln.aas === "TMP"));
  // Saturday AFTER the week: every card's day has passed → all consumed (by date, not by weekday position)
  const ctx2 = Object.assign({}, ctx, { _todayDay: "saturday", _todayStr: () => "2026-09-05", __dates: dates.slice(), __dd: {} });
  ctx2.__dates.forEach(d => { ctx2.__dd[d] = { lincoln: { aas: "TMP" } }; });
  vm.createContext(ctx2); vm.runInContext(body + "\nvar __seen={}; var __n=_gwWeekConsumed('lincoln','aas',__dates,__dd,__seen);", ctx2);
  ok("Saturday after the week: all three consumed by date", ctx2.__n === 3, ctx2.__n);
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
