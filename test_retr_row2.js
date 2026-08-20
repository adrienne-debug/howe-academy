/*
 * Node tests for retrieval Row 2: optional second retrieval card per kid per day.
 * Runs the real RETRWEEK helper block (retrWeek/retrWeek2/retrDayKinds), the real
 * retrAdmin* editor slice (init/cycle/save), and the real GWRETR generator block
 * (gwInjectRetrieval) against fixture weeks.
 *
 *   run:  node test_retr_row2.js
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");

function slice(a, b, label) {
  const i = src.indexOf(a), j = src.indexOf(b);
  if (i < 0 || j < 0 || j <= i) { console.error("marker not found: " + label); process.exit(1); }
  return src.slice(i, j + b.length);
}
const retrweek = slice("// RETRWEEK_START", "// RETRWEEK_END", "RETRWEEK");
const gwretr = slice("// GWRETR_START", "// GWRETR_END", "GWRETR");
const _ai = src.indexOf("let retrAdminLocal=null;"), _aj = src.indexOf("function retrAdminReset");
if (_ai < 0 || _aj <= _ai) { console.error("retrAdmin markers not found"); process.exit(1); }
const admin = src.slice(_ai, _aj);

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log("  ok  - " + name); }
  else { fail++; console.log("  FAIL- " + name + (extra !== undefined ? "  (" + JSON.stringify(extra) + ")" : "")); }
}
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

const toMin = s => { if (!s) return 0; const m = String(s).match(/(\d+):(\d+)\s*(AM|PM)/i); if (!m) return 0;
  let h = +m[1] % 12; if (/pm/i.test(m[3])) h += 12; return h * 60 + +m[2]; };
const fromMin = mn => { let h = Math.floor(mn / 60), m = mn % 60, ap = h >= 12 ? "PM" : "AM";
  h = h % 12; if (h === 0) h = 12; return h + ":" + String(m).padStart(2, "0") + " " + ap; };

function mkEnv(retrievalPlan, opts) {
  opts = opts || {};
  const env = {
    masteryData: { retrievalPlan: retrievalPlan || {} },
    masteryKid: opts.kid || "julian",
    ROSTER: opts.roster || ["julian", "lucy"],
    retrTracks: () => [1],
    gwParseDate: s => new Date(s + "T12:00:00"),
    gwRules: () => ({ schoolStart: 600, schoolEnd: 975, lunchStart: 780, lunchEnd: 840 }),
    toMin, fromMin,
    _mastRe: () => {}, renderAll: () => {},
    updates: [], removes: [],
    HA_LS: { setItem: () => {} },
    Date, Math, Object, JSON, String, Number, Array, parseInt, parseFloat, console, Set, RegExp, isNaN,
  };
  env.db = { ref: p => ({ update: u => env.updates.push({ p, u: JSON.parse(JSON.stringify(u)) }),
                          remove: () => env.removes.push(p) }) };
  env.window = env;
  vm.createContext(env);
  new vm.Script(retrweek + "\n" + gwretr + "\n" + admin + "\n;this.__admin=()=>retrAdminLocal;").runInContext(env);
  return env;
}

const WDAY_MAP = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const DATES = { monday: "8/24", tuesday: "8/25" };
const dayOfYear = d => Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 86400000);

function baseTasks() {
  return [
    { id: "a1", who: "julian", day: "monday", time: "10:00 AM", dur: 25, title: "Morning Notebook", subjectKey: "morning_nb", mom: "required" },
    { id: "a2", who: "julian", day: "monday", time: "10:30 AM", dur: 15, title: "Closing Notebook", subjectKey: "closing_nb", mom: "required" },
    { id: "b1", who: "lucy", day: "monday", time: "10:00 AM", dur: 30, title: "Phonics", subjectKey: "fast_phon", mom: "required" },
  ];
}
function inject(env, tasks) {
  env.gwInjectRetrieval(tasks, ["2026-08-24"], WDAY_MAP, new Set(), DATES, dayOfYear);
  return tasks;
}
const slots = (tasks, kid) => tasks.filter(t => t.subjectKey === "retrieval" && (!kid || t.who === kid));
const ov = (a, b) => toMin(a.time) < toMin(b.time) + (b.dur || 20) && toMin(b.time) < toMin(a.time) + (a.dur || 20);

console.log("helpers:");
{
  const env = mkEnv({});
  ok("retrWeek2 defaults empty", eq(env.retrWeek2("julian"), {}));
  ok("retrDayKinds row1 only", eq(env.retrDayKinds("julian", "mon"), ["match"]));
  ok("retrDayKinds row1 default drill day", eq(env.retrDayKinds("julian", "thu"), ["drill"]));
}
{
  const env = mkEnv({ julian: { week: { mon: "drill", tue: "drill", wed: "drill", thu: "drill", fri: "drill" }, week2: { mon: "match", wed: "match" } } });
  ok("row2 adds a second kind", eq(env.retrDayKinds("julian", "mon"), ["drill", "match"]));
  ok("row2 empty day stays single", eq(env.retrDayKinds("julian", "tue"), ["drill"]));
  ok("other kid untouched by julian's plan", eq(env.retrDayKinds("lucy", "mon"), ["sprint"]));
}
{
  const env = mkEnv({ julian: { week: { mon: "drill" }, week2: { mon: "drill" } } });
  ok("same kind both rows collapses to one", eq(env.retrDayKinds("julian", "mon"), ["drill"]));
}
{
  const env = mkEnv({ julian: { week2: { mon: "off" } } });
  ok("row2 'off' adds nothing", eq(env.retrDayKinds("julian", "mon"), ["match"]));
}

console.log("generator:");
{
  const env = mkEnv({});                                     // no overrides = today's live shape
  const tasks = inject(env, baseTasks());
  ok("no row2: one slot per kid (regression)", slots(tasks, "julian").length === 1 && slots(tasks, "lucy").length === 1);
  ok("julian monday default is match", slots(tasks, "julian")[0].retrieval === "match");
}
{
  const env = mkEnv({ julian: { week: { mon: "drill" }, week2: { mon: "match" } } });
  const tasks = inject(env, baseTasks());
  const js = slots(tasks, "julian");
  ok("row2 emits two slots", js.length === 2, js.map(s => s.id));
  ok("one drill + one match", eq(js.map(s => s.retrieval).sort(), ["drill", "match"]));
  ok("distinct day-encoded ids", js[0].id !== js[1].id && js.every(s => /^2026d\d+_retr_(drill|match)_julian$/.test(s.id)));
  ok("slots don't overlap each other", !ov(js[0], js[1]), js.map(s => s.time));
  const closing = tasks.find(t => t.id === "a2");
  ok("closing notebook still last", js.every(s => toMin(closing.time) >= toMin(s.time) + s.dur), closing.time);
  ok("both slots are Mom-required spin tasks", js.every(s => s.mom === "required" && s.subjectKey === "retrieval"));
  const lucySlots = slots(tasks, "lucy");
  ok("lucy still gets exactly one", lucySlots.length === 1);
  ok("julian's slots avoid lucy's Mom cards", js.every(s => !ov(s, tasks.find(t => t.id === "b1"))));
}
{
  const env = mkEnv({ julian: { week: { mon: "drill" }, week2: { mon: "drill" } } });
  const tasks = inject(env, baseTasks());
  ok("duplicate kind in both rows -> one slot", slots(tasks, "julian").length === 1);
}
{
  const env = mkEnv({ julian: { week: { mon: "drill" }, week2: { mon: "match" } } });
  const tasks = inject(env, baseTasks().filter(t => t.who !== "julian"));
  ok("kid with no cards that day gets no slots", slots(tasks, "julian").length === 0);
}
{
  const env = mkEnv({ julian: { week: { mon: "off" }, week2: { mon: "match" } } });
  const tasks = inject(env, baseTasks());
  const js = slots(tasks, "julian");
  ok("row1 off + row2 match -> just the match", js.length === 1 && js[0].retrieval === "match");
}

console.log("admin editor:");
{
  const env = mkEnv({});
  env.retrAdminInit();
  ok("init mirrors empty week2", eq(env.__admin().week2, {}));
  env.retrAdminCycleDay("mon", 2);                            // off -> sprint (cycle order)
  ok("cycle row 2 doesn't touch row 1", env.__admin().week.mon === "match" && env.__admin().week2.mon === "sprint");
  env.retrAdminCycleDay("mon");                               // row 1 default: match -> recheck
  ok("row-less cycle still edits row 1", env.__admin().week.mon === "recheck" && env.__admin().week2.mon === "sprint");
  env.retrAdminSave();
  const u = env.updates[env.updates.length - 1];
  ok("save targets the kid's plan path", u.p === "mastery/retrievalPlan/julian");
  ok("save persists week2", eq(u.u.week2, { mon: "sprint" }), u.u.week2);
}
{
  const env = mkEnv({ julian: { week: { mon: "drill", tue: "drill", wed: "drill", thu: "drill", fri: "drill" }, week2: { mon: "match", tue: "drill" } } });
  env.retrAdminInit();
  env.retrAdminSave();
  const u = env.updates[env.updates.length - 1];
  ok("save drops row2 day equal to row1", eq(u.u.week2, { mon: "match" }), u.u.week2);
}
{
  const env = mkEnv({ julian: { week: { mon: "drill" }, week2: { mon: "match" } } });
  env.retrAdminInit();
  env.retrAdminCycleDay("mon", 2); env.retrAdminCycleDay("mon", 2); env.retrAdminCycleDay("mon", 2);  // match->recheck->drill->off
  ok("row 2 cycles back to off", env.__admin().week2.mon === "off");
  env.retrAdminSave();
  const u = env.updates[env.updates.length - 1];
  ok("cleared row 2 saves as {} (node cleared)", eq(u.u.week2, {}), u.u.week2);
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
