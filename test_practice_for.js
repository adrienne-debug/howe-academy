/*
 * 📝 PRACTICEFOR (DeWalt ask 2026-10-08) — a daily practice card that belongs to a weekly lesson subject shows the
 * week's lesson + day: Taylor's "Fix-It Practice" ×3 Tue–Fri reads "Fix-It Practice — Week 17, Day 2 / 3 / 4" when
 * the subject's setting says "practice for Fix-It Grammar, days from 2". Replay on DeWalt's week shape (Fix-It
 * Grammar "Week 17" Monday, practice Tue · Wed · Fri). Display only: t.title never changes.
 *   run:  node test_practice_for.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
let pass = 0, fail = 0;
function ok(name, cond, extra) { if (cond) { pass++; console.log("  ok  - " + name); } else { fail++; console.log("  FAIL- " + name + (extra !== undefined ? "  (" + JSON.stringify(extra) + ")" : "")); } }
const sl = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error("slice " + a); return src.slice(i, j); };

const block = sl("function taskTitleShow(t){", "// PRACTICEFOR_END");
const lessonRef = sl("function taskLessonRef(t){", "\n}\n") + "\n}\n";

function world(subjects, tasks, moves) {
  const ctx = { currData: { subjects }, weekData: { tasks }, DAYS_ALL: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
    moves: moves || {}, writes: [], renders: 0 };
  vm.createContext(ctx);
  vm.runInContext(`
    function effectiveDay(t){ return moves[t.id]||t.day; }
    function momHere(){ return true; } function _dryRun(){ return false; } function esc(s){ return String(s); }
    function renderAll(){ renders++; } function ceRenderEditSheet(){}
    var ceEditKid=null, ceEditKey=null;
    var db={ ref(p){ return { update(u){ writes.push({p,u}); }, set(v){ writes.push({p,set:v}); } }; } };
    ${lessonRef}
    ${block}`, ctx);
  return ctx;
}
const ALL = ["Mon", "Tue", "Wed", "Thu", "Fri"];
function dewalt(extra) {
  return { taylor: Object.assign({
    fix_it_grammar: { display: "Fix-It Grammar", minutes: 30, allowedDays: ["Mon"], timesPerWeek: 1, mom: "required", lessonSeq: ["Week 16", "Week 17", "Week 18"] },
    fix_it_practice: { display: "Fix-It Practice", minutes: 20, allowedDays: ["Tue", "Wed", "Thu", "Fri"], timesPerWeek: 3, tracking: "daily", mom: "none" },
    reading: { display: "Reading", minutes: 30, allowedDays: ALL, tracking: "daily" },
  }, extra || {}) };
}
const task = (id, day, sk, title) => ({ id, day, who: "taylor", subjectKey: sk, title });
const WEEK = () => [
  task("t_fig_mon", "monday", "fix_it_grammar", "📄 Fix-It Grammar — Week 17"),
  task("t_fip_fri", "friday", "fix_it_practice", "📄 Fix-It Practice — Fix-It Practice"),   // stored out of order on purpose
  task("t_fip_tue", "tuesday", "fix_it_practice", "📄 Fix-It Practice — Fix-It Practice"),
  task("t_fip_wed", "wednesday", "fix_it_practice", "📄 Fix-It Practice — Fix-It Practice"),
  task("t_read_tue", "tuesday", "reading", "📄 Reading — Reading"),
  Object.assign(task("m_fip_tue", "tuesday", "fix_it_practice", "📄 Fix-It Practice — Fix-It Practice"), { who: "makenzie" }),   // another kid's same key
];
const show = (w, id) => { const t = w.weekData.tasks.find(x => x.id === id); return w.taskTitleShow(t); };

console.log("before (no setting): the card just says Fix-It Practice");
{ const w = world(dewalt(), WEEK());
  ok("Tue practice: 📄 Fix-It Practice", show(w, "t_fip_tue") === "📄 Fix-It Practice", show(w, "t_fip_tue"));
  ok("lesson card unchanged", show(w, "t_fig_mon") === "📄 Fix-It Grammar — Week 17"); }

console.log("practice for Fix-It Grammar (default days from 2)");
{ const subs = dewalt(); subs.taylor.fix_it_practice.practiceFor = "fix_it_grammar";
  const w = world(subs, WEEK());
  ok("Tue → Week 17, Day 2", show(w, "t_fip_tue") === "📄 Fix-It Practice — Week 17, Day 2", show(w, "t_fip_tue"));
  ok("Wed → Week 17, Day 3", show(w, "t_fip_wed") === "📄 Fix-It Practice — Week 17, Day 3", show(w, "t_fip_wed"));
  ok("Fri → Week 17, Day 4 (order the cards fall, not stored order)", show(w, "t_fip_fri") === "📄 Fix-It Practice — Week 17, Day 4", show(w, "t_fip_fri"));
  ok("the Monday lesson card itself is unchanged", show(w, "t_fig_mon") === "📄 Fix-It Grammar — Week 17");
  ok("other daily subjects unchanged", show(w, "t_read_tue") === "📄 Reading");
  ok("stored t.title never changes", w.weekData.tasks.filter(t => t.subjectKey === "fix_it_practice").every(t => t.title === "📄 Fix-It Practice — Fix-It Practice"));
  ok("another kid's card with the same key is untouched", show(w, "m_fip_tue") === "📄 Fix-It Practice", show(w, "m_fip_tue"));
  // a carry copy keeps its source card's number
  w.weekData.tasks.push(task("t_fip_wed_c", "thursday", "fix_it_practice", "📄 Fix-It Practice — Fix-It Practice"));
  ok("carry copy of Wed's card still Day 3, and Fri stays Day 4", show(w, "t_fip_wed_c").endsWith("Week 17, Day 3") && show(w, "t_fip_fri").endsWith("Day 4"), [show(w, "t_fip_wed_c"), show(w, "t_fip_fri")]);
}

console.log("numbering follows where the cards fall (a card Mom moved)");
{ const subs = dewalt(); subs.taylor.fix_it_practice.practiceFor = "fix_it_grammar";
  const w = world(subs, WEEK(), { t_fip_tue: "thursday" });   // Tue's card pushed to Thu
  ok("Wed now Day 2, moved card Day 3, Fri Day 4", show(w, "t_fip_wed").endsWith("Day 2") && show(w, "t_fip_tue").endsWith("Day 3") && show(w, "t_fip_fri").endsWith("Day 4"),
    [show(w, "t_fip_wed"), show(w, "t_fip_tue"), show(w, "t_fip_fri")]); }

console.log("days from N (generic setting)");
{ const subs = dewalt(); Object.assign(subs.taylor.fix_it_practice, { practiceFor: "fix_it_grammar", practiceDayFrom: 1 });
  const w = world(subs, WEEK());
  ok("from 1: Tue Day 1 · Fri Day 3", show(w, "t_fip_tue").endsWith("Week 17, Day 1") && show(w, "t_fip_fri").endsWith("Week 17, Day 3")); }
{ const subs = { andrew: { spelling: { display: "Spelling Lesson", lessonSeq: ["List 4", "List 5"] }, spell_drill: { display: "Spelling Drill", tracking: "daily", practiceFor: "spelling" } } };
  const tasks = [{ id: "a1", day: "monday", who: "andrew", subjectKey: "spelling", title: "✏️ Spelling Lesson — List 5" },
    { id: "a2", day: "tuesday", who: "andrew", subjectKey: "spell_drill", title: "✏️ Spelling Drill — Spelling Drill" }];
  const w = world(subs, tasks);
  ok("not hard-coded to Fix-It: Spelling Drill — List 5, Day 2", w.taskTitleShow(tasks[1]) === "✏️ Spelling Drill — List 5, Day 2", w.taskTitleShow(tasks[1])); }

console.log("no lesson this week / bad setting → plain title");
{ const subs = dewalt(); subs.taylor.fix_it_practice.practiceFor = "fix_it_grammar";
  const w = world(subs, WEEK().filter(t => t.subjectKey !== "fix_it_grammar"));
  ok("lesson finished / not dealt this week → plain", show(w, "t_fip_tue") === "📄 Fix-It Practice", show(w, "t_fip_tue")); }
{ const subs = dewalt(); subs.taylor.fix_it_practice.practiceFor = "gone_subject";
  ok("practiceFor points at a missing subject → plain", show(world(subs, WEEK()), "t_fip_tue") === "📄 Fix-It Practice"); }
{ const subs = dewalt(); subs.taylor.fix_it_practice.practiceFor = "reading";
  ok("practiceFor points at another daily subject → plain", show(world(subs, WEEK()), "t_fip_tue") === "📄 Fix-It Practice"); }
{ const subs = dewalt(); subs.taylor.fix_it_practice.practiceFor = "fix_it_grammar"; subs.taylor.fix_it_practice.tracking = "sequenced";
  ok("setting ignored on a non-daily subject", show(world(subs, WEEK()), "t_fip_tue") === "📄 Fix-It Practice"); }
{ const w = world(dewalt(), WEEK());
  ok("card not in this week (archive) → plain", w.taskTitleShow(task("old_1", "tuesday", "fix_it_practice", "📄 Fix-It Practice — Fix-It Practice")) === "📄 Fix-It Practice"); }

console.log("a second lesson card later in the week (catch-up) speaks only for the practice after it");
{ const subs = dewalt(); subs.taylor.fix_it_practice.practiceFor = "fix_it_grammar";
  const tasks = WEEK(); tasks.push(task("t_fig_thu", "thursday", "fix_it_grammar", "📄 Fix-It Grammar — Week 18"));
  const w = world(subs, tasks);
  ok("Tue/Wed → Week 17, Fri → Week 18", show(w, "t_fip_tue").includes("Week 17,") && show(w, "t_fip_wed").includes("Week 17,") && show(w, "t_fip_fri").includes("Week 18,"),
    [show(w, "t_fip_tue"), show(w, "t_fip_wed"), show(w, "t_fip_fri")]); }

console.log("Mom's setting writes one targeted path; the sheet offers it only on daily subjects");
{ const subs = dewalt(); const w = world(subs, WEEK());
  vm.runInContext(`ceEditKid="taylor"; ceEditKey="fix_it_practice"; cePracticeSet("practiceFor","fix_it_grammar"); cePracticeSet("practiceDayFrom",0); cePracticeSet("bogus",1);`, w);
  ok("two targeted writes, no whole-node set", w.writes.length === 2 && w.writes.every(x => x.p === "curriculum" && x.u && !("set" in x)), w.writes);
  ok("write paths are the subject's own fields", w.writes[0].u["subjects/taylor/fix_it_practice/practiceFor"] === "fix_it_grammar" && w.writes[1].u["subjects/taylor/fix_it_practice/practiceDayFrom"] === 1, w.writes);
  ok("local state updated", subs.taylor.fix_it_practice.practiceFor === "fix_it_grammar");
  vm.runInContext(`cePracticeSet("practiceFor",null);`, w);
  ok("None clears it (null write)", !("practiceFor" in subs.taylor.fix_it_practice) && w.writes[2].u["subjects/taylor/fix_it_practice/practiceFor"] === null);
  const hDaily = w.cePracticeSectionHTML("taylor", "fix_it_practice", subs.taylor.fix_it_practice);
  ok("daily sheet lists the lesson subjects (not other dailies)", hDaily.includes("Fix-It Grammar") && !hDaily.includes(">Reading<"));
  ok("non-daily subject: no section", w.cePracticeSectionHTML("taylor", "fix_it_grammar", subs.taylor.fix_it_grammar) === ""); }
{ ok("dry-run guard on the write", /function cePracticeSet[\s\S]{0,700}db&&!_dryRun\(\)/.test(src));
  ok("Mom-only", /function cePracticeSet\(field,val\)\{\s*if\(!momHere\(\)/.test(src));
  ok("edit sheet wires the section", src.includes("h+=cePracticeSectionHTML(ceEditKid,ceEditKey,s);")); }

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
