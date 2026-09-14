/*
 * Node tests for 📅 Roadmap — Stage B (2026-09-13): dated curriculum to-dos per kid,
 * plans/<kid>/roadmap/<id> = {due, text, kind, subject?, book?, done, at}.
 *   · list sorted by date; state = over / week / later / done from today's ISO
 *   · Mom HQ strip: open by date, overdue counted, finished folded, inline add/edit form
 *   · My Day card: overdue + due this week across kids, ✓ only, empty → nothing rendered
 *   · calendar day sheet: only items due THAT day and not done
 *   · every write = ONE set/update/remove of ONE item path; nothing without the Mom/Admin code;
 *     nothing in dry-run; validation refuses a missing date or text
 *   · the three insertion points exist in index.html (curriculum view, My Day, day sheet)
 *
 *   run:  node test_roadmap.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
let pass = 0, fail = 0;
function ok(n, c, x) { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x) + ")" : "")); } }

const a = src.indexOf("// ROADMAP_START"), z = src.indexOf("// ROADMAP_END");
ok("ROADMAP block present", a > 0 && z > a);
const block = src.slice(a, z);

const writes = [], toasts = []; let renders = 0;
const db = { ref(p) { return { set(v) { writes.push({ op: "set", path: p, val: v }); }, update(v) { writes.push({ op: "update", path: p, val: v }); }, remove() { writes.push({ op: "remove", path: p }); } }; } };
function gwParseDate(iso) { const m = iso.split("-"); return new Date(+m[0], +m[1] - 1, +m[2]); }
function _cbISO(d) { const p = n => String(n).padStart(2, "0"); return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()); }
const ctx = {
  console, Date, window: {}, db, gwParseDate, _cbISO, _todayStr: () => "2026-09-16", esc: s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])),
  cap: s => s.charAt(0).toUpperCase() + s.slice(1), ROSTER: ["lincoln", "ellis", "lucy", "julian"], KID_COLOR: { ellis: "#16a34a" },
  currData: { subjects: { ellis: { hwt: { display: "HWT Printing Power" }, singapore_e: { display: "Singapore Math 3B" } } } },
  roadmapData: {}, adminPinUnlocked: false, momPinUnlocked: false, _dryRun: () => false, renderAll: () => { renders++; }, gwShowToast: m => toasts.push(m),
  confirm: () => true, setInterval: () => 0, clearInterval() {}, showTab: () => {}, plSetSub: () => {},
};
ctx.window = ctx; vm.createContext(ctx);
vm.runInContext(block, ctx);
const T = name => vm.runInContext(name, ctx);

console.log("\n# list + state");
{
  ctx.roadmapData = { ellis: { roadmap: {
    "20261006_01": { due: "2026-10-06", text: "Printing Power ends → Cursive", kind: "swap", subject: "hwt", book: "hwt-cursive-handwriting", done: null },
    "20260913_01": { due: "2026-09-13", text: "Add AAS", kind: "add", done: null },
    "20260918_01": { due: "2026-09-18", text: "Append DM 4A", kind: "append", subject: "singapore_e", done: null },
    "20260913_02": { due: "2026-09-13", text: "Pause Daily Geography", kind: "pause", done: 1757800000000 },
    "junk": { text: "no date" },
  } } };
  const L = T("rmList")("ellis");
  ok("sorted by due, junk (no date) dropped", L.map(r => r.id).join() === "20260913_01,20260913_02,20260918_01,20261006_01", L.map(r => r.id));
  const S = T("rmState");
  ok("week end of Wed 9/16 = Sun 9/20", T("rmWeekEnd")("2026-09-16") === "2026-09-20");
  ok("states: over / done / week / later", [S(L[0], "2026-09-16"), S(L[1], "2026-09-16"), S(L[2], "2026-09-16"), S(L[3], "2026-09-16")].join() === "over,done,week,later");
  ok("day-sheet collector = due that day, not done", T("_calRoadmapFor")("ellis", "2026-09-13").map(r => r.id).join() === "20260913_01" && T("_calRoadmapFor")("ellis", "2026-10-06").length === 1 && T("_calRoadmapFor")("lucy", "2026-10-06").length === 0);
  ok("empty kid → []", T("rmList")("julian").length === 0);
}
console.log("\n# Mom HQ strip");
{
  const h = T("rmStripHTML")("ellis");
  ok("header counts: 3 to do, 1 overdue, 1 done", /3 to do/.test(h) && /1 overdue/.test(h) && /1 done/.test(h), h.slice(0, 400));
  ok("overdue row flagged, subject chip named, book chip present", /⚠ Sep 13/.test(h) && /HWT Printing Power/.test(h) && /rmOpenBook\('hwt-cursive-handwriting'\)/.test(h));
  ok("done row folded until 'Show 1 done'", !/Pause Daily Geography/.test(h) && /Show 1 done/.test(h));
  ctx.rmShowDone = { ellis: true }; vm.runInContext("rmShowDone={ellis:true}", ctx);
  ok("unfolded shows the done row struck through", /Pause Daily Geography/.test(T("rmStripHTML")("ellis")));
  ok("empty kid shows the hint + Add", /Nothing dated yet/.test(T("rmStripHTML")("lucy")) && /rmNew\('lucy'\)/.test(T("rmStripHTML")("lucy")));
  ok("text is escaped", /&lt;b&gt;/.test((() => { ctx.roadmapData.lucy = { roadmap: { x: { due: "2026-09-16", text: "<b>x</b>", kind: "note" } } }; return T("rmStripHTML")("lucy"); })()));
  delete ctx.roadmapData.lucy;
}
console.log("\n# My Day card");
{
  const h = T("rmWeekHTML")("2026-09-16");
  ok("shows overdue + this week only (2 items), grouped under Ellis", /2 items/.test(h) && /Add AAS/.test(h) && /Append DM 4A/.test(h) && !/Cursive/.test(h) && /Ellis/.test(h), h.slice(0, 300));
  ok("compact rows carry ✓ but no ✏️", /rmDone\('ellis'/.test(h) && !/rmEditStart/.test(h));
  ok("nothing due → renders nothing", T("rmWeekHTML")("2026-01-05") === "");
}
console.log("\n# gate + writes");
{
  writes.length = 0; toasts.length = 0;
  T("rmDone")("ellis", "20260913_01");
  ok("✓ without the code → toast, no write", writes.length === 0 && /Mom code/.test(toasts[0]), toasts);
  T("rmNew")("ellis"); ok("Add without the code → no form", T("rmEdit") === null);
  ctx.momPinUnlocked = true; vm.runInContext("momPinUnlocked=true", ctx);
  T("rmDone")("ellis", "20260913_01");
  ok("✓ = one update {done:ts} on the item path", writes.length === 1 && writes[0].op === "update" && writes[0].path === "plans/ellis/roadmap/20260913_01" && typeof writes[0].val.done === "number", writes);
  T("rmDone")("ellis", "20260913_01");
  ok("✓ again reopens (done:null)", writes.length === 2 && writes[1].val.done === null);
  writes.length = 0; toasts.length = 0;
  T("rmNew")("ellis");
  ok("form opens with today's date, kind add", T("rmEdit").kid === "ellis" && T("rmEdit").form.due === "2026-09-16" && /rmSet\('text'/.test(T("rmStripHTML")("ellis")));
  T("rmSave")(); ok("save with no text refused", writes.length === 0 && /Say what/.test(toasts[toasts.length - 1]));
  T("rmSet")("text", "  Math Reasoning D ends →  MR E "); T("rmSet")("due", "2026-10-12"); T("rmSet")("kind", "swap"); T("rmSet")("subject", "math_reason"); T("rmSet")("book", "");
  T("rmSave")();
  ok("save = one set on plans/ellis/roadmap/<new id>", writes.length === 1 && writes[0].op === "set" && /^plans\/ellis\/roadmap\/20261012_[a-z0-9]+$/.test(writes[0].path), writes);
  const rec = writes[0].val;
  ok("record: trimmed text, kind, subject, no book key, done null, at today", rec.text === "Math Reasoning D ends → MR E" && rec.kind === "swap" && rec.subject === "math_reason" && !("book" in rec) && rec.done === null && rec.at === "2026-09-16", rec);
  ok("form closed, in memory, re-rendered", T("rmEdit") === null && T("rmList")("ellis").some(r => r.text === "Math Reasoning D ends → MR E") && renders > 0);
  writes.length = 0;
  T("rmEditStart")("ellis", "20261006_01"); T("rmSet")("text", "Printing Power ends → add HWT Cursive Tue/Thu 10"); T("rmSave")();
  ok("edit keeps the id, at and done; one set", writes.length === 1 && writes[0].path === "plans/ellis/roadmap/20261006_01" && writes[0].val.text.startsWith("Printing Power ends → add") && writes[0].val.done === null && writes[0].val.book === "hwt-cursive-handwriting");
  T("rmEditStart")("ellis", "20261006_01"); T("rmSet")("due", "bad"); writes.length = 0; T("rmSave")();
  ok("bad date refused", writes.length === 0 && T("rmEdit") !== null);
  T("rmCancel")(); ok("cancel closes the form", T("rmEdit") === null);
  writes.length = 0; T("rmDelete")("ellis", "20261006_01");
  ok("delete = one remove of the item path, gone from memory", writes.length === 1 && writes[0].op === "remove" && writes[0].path === "plans/ellis/roadmap/20261006_01" && !T("rmList")("ellis").some(r => r.id === "20261006_01"));
  vm.runInContext("_dryRun=function(){return true}", ctx); writes.length = 0;
  T("rmDone")("ellis", "20260913_01");
  ok("dry-run: no write at all", writes.length === 0);
  vm.runInContext("_dryRun=function(){return false}", ctx);
}
console.log("\n# insertion points in index.html");
{
  ok("global roadmapData + plans listener", /let roadmapData=\{\}/.test(src) && /db\.ref\("plans"\)\.on\("value"/.test(src));
  ok("curriculum GRID page draws the plan bar (which holds the roadmap strip)", /planBarHTML\(\(typeof gvKid/.test(src) && /h\+=rmStripHTML\(kid\)/.test(src));
  ok("My Day draws the week card after the day strip", src.indexOf("h+=rmWeekHTML(iso);") > src.indexOf("h+=momDayStripHTML(iso,today);") && src.indexOf("h+=rmWeekHTML(iso);") < src.indexOf("Now — needs you</div>"));
  const ds = src.indexOf("function calDaySheetHTML(");
  ok("day sheet lists roadmap items after the lessons", src.indexOf("_calRoadmapFor(who,iso).forEach", ds) > src.indexOf("_calLessonsFor(who,iso)", ds));
  ok("no bare column-0 brace inside the block (test slicer safety)", !/\n\}\n(?!function|const|let|\/\/|$)/.test(block));
}
console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
