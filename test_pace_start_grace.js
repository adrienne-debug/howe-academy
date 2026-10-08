// ⏱ Pace box before the first check-off (her ask 2026-10-06, DeWalt): nothing checked yet is ON TIME until the first
// activity's own end time passes. 9:00 card, 10 min → Not Started 8:59 · On Schedule 9:02 and 9:10 · Behind 9:11.
// All page: each kid's first card, the earliest end decides. Every other state renders byte-for-byte as before.
// Runs the real dailyPaceTracker from index.html; PACE_SRC=<path> runs it against another copy; PACE_OLD=<path> adds
// the old-vs-new comparison.
const fs = require("fs"), path = require("path");
let pass = 0, fail = 0;
function ok(name, cond) { if (cond) { pass++; console.log("  ok  - " + name); } else { fail++; console.log("  FAIL- " + name); } }
function load(file) {
  const src = fs.readFileSync(file, "utf8");
  const a = src.indexOf("function dailyPaceTracker("), b = src.indexOf("// ── DAY TIME READOUT", a);
  const t = src.indexOf("function toMin(s){"), te = src.indexOf("\n}\n", t) + 3;
  if (a < 0 || b < 0 || t < 0) throw new Error("dailyPaceTracker / toMin not found in " + file);
  return new Function("W", `
    let checked=W.checked, rulesData=W.rulesData; const _todayDay=W.today;
    const Date=class extends W.RealDate{ constructor(...a){ if(a.length) super(...a); else super(W.now); } };
    ${src.slice(t, te)}
    ${src.slice(a, b)}
    return dailyPaceTracker;`);
}
function run(file, tasks, at, opt) {
  opt = opt || {};
  const [h, m] = at.split(":").map(Number);
  const W = { checked: opt.checked || {}, rulesData: { schoolDay: { lunchStart: "12:00 PM", lunchEnd: "1:00 PM" } },
    today: "monday", RealDate: Date, now: new Date(2026, 9, 5, h, m, 0).getTime() };
  return load(file)(W)(tasks, opt.day || "monday");
}
const status = html => (/pace-tracker-status">([^<]*)</.exec(html) || [])[1];
const NEW = process.env.PACE_SRC || path.join(__dirname, "index.html"), OLD = process.env.PACE_OLD;

// One kid (Taylor): 9:00 for 10 min, then the rest of the morning.
const one = [
  { id: "a1", who: "taylor", title: "Morning Math Facts", time: "9:00 AM", dur: 10 },
  { id: "a2", who: "taylor", title: "Reading", time: "9:10 AM", dur: 30 },
  { id: "a3", who: "taylor", title: "Spelling", time: "9:40 AM", dur: 20 },
];
// All page: Taylor's first card ends 9:10, Caleb's 9:30 — the earliest (9:10) decides.
const all = one.concat([
  { id: "b1", who: "caleb", title: "Letters", time: "9:00 AM", dur: 30 },
  { id: "b2", who: "caleb", title: "Shapes", time: "9:30 AM", dur: 15 },
]);

console.log("# one kid");
ok("8:59 → Not Started", status(run(NEW, one, "8:59")) === "Not Started");
ok("9:02 → On Schedule", status(run(NEW, one, "9:02")) === "On Schedule");
ok("9:10 → On Schedule (last minute of the 10-min card)", status(run(NEW, one, "9:10")) === "On Schedule");
ok("9:11 → Behind Schedule", status(run(NEW, one, "9:11")) === "Behind Schedule");
ok("On Schedule box says when the first one is due + shows Target", /first one due by 9:10 AM/.test(run(NEW, one, "9:02")) && /Target<\/div><div class="pace-tracker-val">10:00 AM/.test(run(NEW, one, "9:02")));
ok("On Schedule box uses the green on-track style", /class="pace-tracker on-track"/.test(run(NEW, one, "9:05")));

console.log("# All page");
ok("8:59 → Not Started", status(run(NEW, all, "8:59")) === "Not Started");
ok("9:02 → On Schedule", status(run(NEW, all, "9:02")) === "On Schedule");
ok("9:10 → On Schedule", status(run(NEW, all, "9:10")) === "On Schedule");
ok("9:11 → Behind (Taylor is past her first card even though Caleb's runs to 9:30)", status(run(NEW, all, "9:11")) === "Behind Schedule");
const late = [{ id: "c1", who: "taylor", title: "Math", time: "9:15 AM", dur: 10 }, { id: "c2", who: "caleb", title: "Letters", time: "9:00 AM", dur: 40 }];
ok("staggered starts: earliest END wins (9:25 not 9:40) — 9:25 on time, 9:26 behind", status(run(NEW, late, "9:25")) === "On Schedule" && status(run(NEW, late, "9:26")) === "Behind Schedule");
ok("card with no dur uses the 20-min default", status(run(NEW, [{ id: "d1", who: "taylor", title: "X", time: "9:00 AM" }], "9:20")) === "On Schedule" && status(run(NEW, [{ id: "d1", who: "taylor", title: "X", time: "9:00 AM" }], "9:21")) === "Behind Schedule");
ok("once something is checked, the normal in-progress pace takes over", /of 3 tasks · /.test(run(NEW, one, "9:12", { checked: { a1: "9:09 AM Mon Oct 5" } })));

if (OLD) {
  console.log("# unchanged vs before (" + path.basename(OLD) + ")");
  const same = (t, at, o) => run(OLD, t, at, o) === run(NEW, t, at, o);
  ok("8:59 Not Started identical (one + All)", same(one, "8:59") && same(all, "8:59"));
  ok("9:11 Behind identical (one + All)", same(one, "9:11") && same(all, "9:11") && same(one, "11:30") && same(all, "14:45"));
  ok("old code said Behind at 9:02 — the bug", status(run(OLD, one, "9:02")) === "Behind Schedule");
  const ck = { a1: "9:09 AM Mon Oct 5" }, done = { a1: "9:09 AM", a2: "9:40 AM", a3: "10:01 AM" };
  ok("in-progress identical", same(one, "9:12", { checked: ck }) && same(all, "9:12", { checked: ck }) && same(one, "13:30", { checked: ck }));
  ok("all-done identical", same(one, "10:05", { checked: done }));
  ok("another day identical", same(one, "9:05", { day: "tuesday" }) && same(one, "9:05", { day: "tuesday", checked: ck }));
}
console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
