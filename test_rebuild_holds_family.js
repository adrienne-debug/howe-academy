/*
 * 👨‍👩‍👧 FAMHOLD: a rebuild for ONE kid never moves family time (shared by several kids). Her rule 2026-10-24: "those should
 * always be at the same time because they are family subjects". DeWalt: a 4:05 PM AAS rebuild put Kenzie's Fact Review at
 * 5:35 while Andrew's stayed 4:15; 10/16 her Science + Read Aloud slid an hour off everyone else's.
 * Harness copied from test_reproject_targeted.js (runs the real REPROJ block).   run: node test_rebuild_holds_family.js
 * Control: BASE_INDEX=<pre-fix index.html> node test_rebuild_holds_family.js → the family cases FAIL on the old code.
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(process.env.BASE_INDEX || path.join(__dirname, "index.html"), "utf8");
const a = src.indexOf("// REPROJ_START"), b = src.indexOf("// REPROJ_END");
if (a < 0 || b < 0) { console.error("REPROJ markers not found"); process.exit(1); }
const block = src.slice(a, b);
let pass = 0, fail = 0;
function ok(name, cond, extra) { if (cond) { pass++; console.log("  ok  - " + name); } else { fail++; console.log("  FAIL- " + name + (extra !== undefined ? "  (" + JSON.stringify(extra) + ")" : "")); } }
const toMin = s => { if (!s) return 0; const m = String(s).match(/(\d+):(\d+)\s*(AM|PM)/i); if (!m) return 0; let h = +m[1] % 12; if (/PM/i.test(m[3])) h += 12; return h * 60 + +m[2]; };
const fromMin = m => { const h = Math.floor(m / 60), mm = m % 60; const ap = h >= 12 ? "PM" : "AM"; const hh = ((h + 11) % 12) + 1; return hh + ":" + String(mm).padStart(2, "0") + " " + ap; };
const packAround = (fixed, news, ctx) => { const cur = {}; fixed.forEach(t => { cur[t.who] = Math.max(cur[t.who] || ctx.start, toMin(t.time) + (t.dur || 20)); }); news.forEach(t => { const c = Math.max(cur[t.who] || ctx.start, ctx.start); t.time = fromMin(c); cur[t.who] = c + (t.dur || 20); }); return []; };
const dayCtx = () => ({ start: 540, end: 960, lunchStart: 720, lunchEnd: 780 });
function mkEnv() { const env = { console, JSON, Object, Array, String, Number, Math, parseInt, Date, RegExp }; vm.createContext(env); new vm.Script(block).runInContext(env); return env; }
const OPTS = o => Object.assign({ todayDay: "monday", nowMin: 540, checked: {}, claimed: {}, dayCtx, packAround, toMin, fromMin }, o || {});
const L = (n, day, time, dur) => ({ id: "makenzie_makenzie__aas_4_L" + String(n).padStart(4, "0"), who: "makenzie", subjectKey: "aas_4", day, time, dur: dur || 10, title: "AAS 4 — Lesson " + n, lid: "L" + String(n).padStart(4, "0") });
const C = (id, who, day, time, dur, title, extra) => Object.assign({ id, who, day, time, dur, title }, extra || {});
const fam = (id, who, day, time, dur, item, auto) => C(id, who, day, time, dur, "🏡 " + item, { famBlock: auto ? "fbFR" : "fbFT", famItem: item, famAuto: !!auto });
const overlaps = (x, y) => toMin(x.time) < toMin(y.time) + y.dur && toMin(y.time) < toMin(x.time) + x.dur;

console.log("── 👨‍👩‍👧 a rebuild that adds a lesson for Kenzie never moves the family cards ──");
{
  // Kenzie's Friday: AAS lesson added at 1:00 PM (generator time) ahead of Penmanship 1:00, History 1:30 (all kids), Piano 2:00.
  const e = mkEnv();
  const live = [
    C("k_pen", "makenzie", "friday", "1:00 PM", 20, "📄 Penmanship", { subjectKey: "penmanship" }),
    fam("k_hist", "makenzie", "friday", "1:30 PM", 30, "History", false),
    fam("a_hist", "andrew", "friday", "1:30 PM", 30, "History", false),
    fam("t_hist", "taylor", "friday", "1:30 PM", 30, "History", false),
    C("k_piano", "makenzie", "friday", "2:00 PM", 20, "🎹 Piano", { subjectKey: "piano" }),
  ];
  const r = e._reprojectPlan("makenzie", "aas_4", live, [L(152, "friday", "1:00 PM", 20)], OPTS());
  const at = id => r.tasksAfter.find(t => t.id === id);
  ok("the lesson was added for Kenzie", r.summary.added.length === 1, r.summary);
  ok("Kenzie's History stays at 1:30 with everyone else's", at("k_hist").time === "1:30 PM" && at("a_hist").time === "1:30 PM", [at("k_hist").time, at("a_hist").time]);
  ok("no write touches any History card", !Object.keys(r.upd).some(k => /_hist/.test(k)), Object.keys(r.upd));
  ok("Kenzie's own cards moved instead, and none sits on top of History", at("k_pen").time !== "1:00 PM" && !r.tasksAfter.filter(t => t.who === "makenzie" && !t.famBlock).some(t => overlaps(t, at("k_hist"))), r.tasksAfter.filter(t => t.who === "makenzie").map(t => t.title + " " + t.time));
}
{
  // Scheduler-picked Fact Review (Andrew + Kenzie) behind Kenzie's cards; the added lesson pushes her day.
  const e = mkEnv();
  const live = [
    C("k_pen", "makenzie", "friday", "9:00 AM", 20, "📄 Penmanship", { subjectKey: "penmanship" }),
    fam("k_fr", "makenzie", "friday", "9:20 AM", 15, "Fact Review", true),
    fam("a_fr", "andrew", "friday", "9:20 AM", 15, "Fact Review", true),
    C("k_read", "makenzie", "friday", "9:35 AM", 30, "📖 Reading", { subjectKey: "reading" }),
  ];
  const r = e._reprojectPlan("makenzie", "aas_4", live, [L(152, "friday", "9:00 AM", 20)], OPTS());
  const at = id => r.tasksAfter.find(t => t.id === id);
  ok("Fact Review stays at 9:20 for BOTH kids", at("k_fr").time === "9:20 AM" && at("a_fr").time === "9:20 AM", [at("k_fr").time, at("a_fr").time]);
  ok("no write touches Fact Review", !Object.keys(r.upd).some(k => /_fr/.test(k)), Object.keys(r.upd));
  ok("Kenzie's own cards step around it (nothing overlaps 9:20–9:35)", !r.tasksAfter.filter(t => t.who === "makenzie" && !t.famBlock).some(t => overlaps(t, at("k_fr"))), r.tasksAfter.filter(t => t.who === "makenzie").map(t => t.title + " " + t.time));
}
{
  // The generator's slot for the new lesson IS the family time: the lesson goes after it, never on top of it.
  const e = mkEnv();
  const live = [fam("k_hist", "makenzie", "friday", "1:30 PM", 30, "History", false), fam("a_hist", "andrew", "friday", "1:30 PM", 30, "History", false)];
  const r = e._reprojectPlan("makenzie", "aas_4", live, [L(152, "friday", "1:30 PM", 20)], OPTS());
  const t = r.tasksAfter.find(x => x.id.endsWith("L0152")), h = r.tasksAfter.find(x => x.id === "k_hist");
  ok("new lesson lands after History (2:00), History unmoved", t && t.time === "2:00 PM" && h.time === "1:30 PM", [t && t.time, h.time]);
}

console.log("── ✅ unchanged when there is no family time ──");
{
  const e = mkEnv();
  const live = [C("k_pen", "makenzie", "friday", "1:00 PM", 20, "📄 Penmanship", { subjectKey: "penmanship" }), C("k_piano", "makenzie", "friday", "1:20 PM", 20, "🎹 Piano", { subjectKey: "piano" })];
  const r = e._reprojectPlan("makenzie", "aas_4", live, [L(152, "friday", "1:00 PM", 20)], OPTS());
  const at = id => r.tasksAfter.find(t => t.id === id);
  ok("lesson at 1:00, Penmanship and Piano shift by 20 (1:20, 1:40) exactly as before", at("k_pen").time === "1:20 PM" && at("k_piano").time === "1:40 PM", [at("k_pen").time, at("k_piano").time]);
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
