/*
 * Node tests — 🧱 STNOSTACK: the spelling test card taking its lesson's slot never stacks the lesson on the next card
 * (her yes 2026-11-02, "1 yes"). Live DeWalt week 5, Regenerate 11/2 6:57 PM: with no free 10 minutes before the lesson,
 * the test took the lesson's time and the lesson moved 10 minutes later, on top of the next card. The school-end guard saw
 * the stack, re-laid the day, ran past 4:00 and took a lesson off the week (Taylor's AAS 4 Lesson 13 on Wednesday,
 * Andrew's Phonics 61 on Friday). Now the kid's later cards that day slide down just enough; held cards never move.
 * The two real days below are the week builder's own output for that Regenerate (dry-run replay on the live data,
 * before the test card). Runs the REAL SPELLTEST block (+ AAS data, ckResultTier) and the REAL seGuardWeek.
 *   run:  node test_st_nostack.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const cut = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error("markers " + a); return src.slice(i, j); };
function slice(name) { const i = src.indexOf("function " + name + "("); if (i < 0) throw new Error("missing " + name);
  let d = 0; for (let k = src.indexOf("{", i); k < src.length; k++) { if (src[k] === "{") d++; else if (src[k] === "}") { d--; if (!d) return src.slice(i, k + 1); } } }
const CODE = cut("// AAS_START", "// AAS_END") + "\n" + slice("ckResultTier") + "\n" + cut("// SPELLTEST_START", "// SPELLTEST_END") + "\n" + slice("seGuardWeek");
const toMin = s => { const m = String(s || "").match(/(\d+):(\d+)\s*(AM|PM)/i); if (!m) return null; let h = +m[1]; if (m[3].toUpperCase() === "PM" && h !== 12) h += 12; if (m[3].toUpperCase() === "AM" && h === 12) h = 0; return h * 60 + +m[2]; };
const fromMin = m => { let h = Math.floor(m / 60), mn = m % 60; const ap = h >= 12 ? "PM" : "AM"; if (h === 0) h = 12; else if (h > 12) h -= 12; return h + ":" + String(mn).padStart(2, "0") + " " + ap; };

let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x) : "")); } };

// [id, who, day, time, dur, momRequired, subjectKey, lesson text, lane, planLesson, ahead, familyTitle]
const DAYS = [
["andrew_andrew__all_about_spelling_1_L0029","andrew","wed","9:00 AM",10,0,"all_about_spelling_1","L22 Adding S to Make Words Plural · day 5 of 5","",0,1,""],
["2026d308_2678","caleb","wed","9:00 AM",10,1,"morning_notebook","Morning Notebook","",0,0,""],
["makenzie_makenzie__aas_4_L0160","makenzie","wed","9:00 AM",10,0,"aas_4","Lesson 7 · day 5 of 5","",0,0,""],
["2026d308_2687","taylor","wed","9:00 AM",10,0,"fact_practice","Fact Practice","",0,0,""],
["2026d308_2682","caleb","wed","9:10 AM",10,1,"drills","Drills","",0,0,""],
["2026d308_2689","andrew","wed","9:10 AM",10,0,"spelling_practice","Spelling Practice","screen",0,0,""],
["2026d308_2694","makenzie","wed","9:10 AM",10,0,"fact_review_with_andrew","Fact Review","",0,0,""],
["2026d308_2699","taylor","wed","9:10 AM",10,0,"spelling_words","Spelling Words","",0,0,""],
["2026d308_2686","caleb","wed","9:20 AM",5,1,"closing_notebook","Closing Notebook","",0,0,""],
["2026d308_2692","andrew","wed","9:20 AM",10,0,"fact_review_with_kenzie","Fact Review with Kenzie","",0,0,""],
["2026d308_2697","makenzie","wed","9:20 AM",10,0,"penmanship","Penmanship","",0,0,""],
["2026d308_2675","taylor","wed","9:25 AM",10,1,"checkup_spelling","Checkup Spelling","screen",0,0,""],
["andrew_andrew__language_arts_2_phonics_L0024","andrew","wed","9:30 AM",30,1,"language_arts_2_phonics","Lesson 60","",1,1,""],
["taylor_taylor__all_about_spelling_4_L0005","taylor","wed","9:35 AM",20,1,"all_about_spelling_4","Lesson 13","",1,0,""],
["2026d308_2691","makenzie","wed","9:35 AM",10,0,"spelling_practice","Spelling Practice","screen",0,0,""],
["2026d308_2700","makenzie","wed","9:45 AM",20,0,"piano","Piano","keyboard",0,0,""],
["2026d308_2683","taylor","wed","9:55 AM",10,1,"facts_check_up","Facts Check-up","",0,0,""],
["andrew_andrew__arithmetic_2_L0021","andrew","wed","10:05 AM",20,1,"arithmetic_2","Lesson 55","",1,0,""],
["2026d308_2690","taylor","wed","10:05 AM",20,0,"fix_it_practice","Fix-It Practice","",0,0,""],
["2026d308_2704","makenzie","wed","10:05 AM",20,0,"typing","Typing","keyboard",0,0,""],
["2026d308_2676","makenzie","wed","10:25 AM",10,1,"checkup_spelling","Checkup Spelling","screen",0,0,""],
["2026d308_2693","taylor","wed","10:25 AM",20,0,"piano","Piano","keyboard",0,0,""],
["2026d308_2695","andrew","wed","10:25 AM",10,0,"handwriting","Handwriting","",0,0,""],
["makenzie_makenzie__apologia_math_4_L0017","makenzie","wed","10:35 AM",20,1,"apologia_math_4","Lesson 67","",1,0,""],
["2026d308_2698","andrew","wed","10:35 AM",20,0,"independent_reading","Independent Reading","",0,0,""],
["2026d308_2696","taylor","wed","10:45 AM",30,0,"reading","Reading","",0,0,""],
["makenzie_makenzie__cle_language_arts_4_L0022","makenzie","wed","10:55 AM",30,1,"cle_language_arts_4","404 L5: Quiz 1 and Extra Activity","",1,0,""],
["2026d308_2701","andrew","wed","10:55 AM",20,0,"piano","Piano","keyboard",0,0,""],
["2026d308_2702","taylor","wed","11:15 AM",15,0,"typing_1_lesson","Typing (1 lesson)","computer",0,0,""],
["2026d308_2703","makenzie","wed","11:25 AM",30,0,"reading","Reading","",0,0,""],
["2026d308_2706","taylor","wed","1:00 PM",30,0,"","","",0,0,"🏡 History"],
["2026d308_2707","makenzie","wed","1:00 PM",30,0,"","","",0,0,"🏡 History"],
["2026d308_2708","andrew","wed","1:00 PM",30,0,"","","",0,0,"🏡 History"],
["2026d308_2709","caleb","wed","1:00 PM",30,0,"","","",0,0,"🏡 History"],
["2026d308_2710","taylor","wed","1:30 PM",30,0,"","","",0,0,"🏡 Science"],
["2026d308_2711","makenzie","wed","1:30 PM",30,0,"","","",0,0,"🏡 Science"],
["2026d308_2712","andrew","wed","1:30 PM",30,0,"","","",0,0,"🏡 Science"],
["2026d308_2713","caleb","wed","1:30 PM",30,0,"","","",0,0,"🏡 Science"],
["2026d308_2714","taylor","wed","2:00 PM",20,0,"","","",0,0,"🏡 Read Aloud"],
["2026d308_2715","makenzie","wed","2:00 PM",20,0,"","","",0,0,"🏡 Read Aloud"],
["2026d308_2716","andrew","wed","2:00 PM",20,0,"","","",0,0,"🏡 Read Aloud"],
["2026d308_2717","caleb","wed","2:00 PM",20,0,"","","",0,0,"🏡 Read Aloud"],
["2026d308_2705","makenzie","wed","2:20 PM",20,0,"we_remember","We Remember","",0,0,""],
["2026d310_2730","caleb","fri","9:00 AM",10,1,"morning_notebook","Morning Notebook","",0,0,""],
["2026d310_2739","taylor","fri","9:00 AM",10,0,"fact_practice","Fact Practice","",0,0,""],
["2026d310_2741","andrew","fri","9:00 AM",10,0,"spelling_practice","Spelling Practice","screen",0,0,""],
["2026d310_2749","makenzie","fri","9:00 AM",10,0,"fact_review_with_andrew","Fact Review","",0,0,""],
["2026d310_2734","caleb","fri","9:10 AM",10,1,"drills","Drills","",0,0,""],
["2026d310_2742","taylor","fri","9:10 AM",20,0,"fix_it_practice","Fix-It Practice","",0,0,""],
["2026d310_2743","makenzie","fri","9:10 AM",10,0,"spelling_practice","Spelling Practice","screen",0,0,""],
["2026d310_2744","andrew","fri","9:10 AM",10,0,"fact_review_with_kenzie","Fact Review with Kenzie","",0,0,""],
["2026d310_2738","caleb","fri","9:20 AM",5,1,"closing_notebook","Closing Notebook","",0,0,""],
["makenzie_makenzie__iew_fables_myths_fairy_tales_L0019","makenzie","fri","9:20 AM",20,0,"iew_fables_myths_fairy_tales","Lesson 8: Daedalus and Icarus (pp. 57–64) · day 3 of 4","",1,0,""],
["andrew_andrew__all_about_spelling_1_L0030","andrew","fri","9:25 AM",20,1,"all_about_spelling_1","L23 Adding ES to Make Words Plural · day 1 of 5","",1,1,""],
["2026d310_2745","taylor","fri","9:30 AM",20,0,"piano","Piano","keyboard",0,0,""],
["2026d310_2752","makenzie","fri","9:40 AM",10,0,"penmanship","Penmanship","",0,0,""],
["andrew_andrew__arithmetic_2_L0022","andrew","fri","9:45 AM",20,1,"arithmetic_2","Lesson 56","",1,0,""],
["2026d310_2748","taylor","fri","9:50 AM",30,0,"reading","Reading","",0,0,""],
["2026d310_2754","makenzie","fri","9:50 AM",20,0,"piano","Piano","keyboard",0,0,""],
["andrew_andrew__language_arts_2_phonics_L0025","andrew","fri","10:05 AM",30,1,"language_arts_2_phonics","Lesson 61","",1,1,""],
["2026d310_2755","makenzie","fri","10:10 AM",30,0,"reading","Reading","",0,0,""],
["2026d310_2751","taylor","fri","10:20 AM",10,0,"spelling_words","Spelling Words","",0,0,""],
["2026d310_2727","taylor","fri","10:35 AM",10,1,"checkup_spelling","Checkup Spelling","screen",0,0,""],
["2026d310_2747","andrew","fri","10:35 AM",10,0,"handwriting","Handwriting","",0,0,""],
["2026d310_2756","makenzie","fri","10:40 AM",20,0,"we_remember","We Remember","",0,0,""],
["taylor_taylor__saxon_math_8_7_L0021","taylor","fri","10:45 AM",20,1,"saxon_math_8_7","Lesson 44","",1,0,""],
["2026d310_2750","andrew","fri","10:45 AM",20,0,"independent_reading","Independent Reading","",0,0,""],
["2026d310_2735","taylor","fri","11:05 AM",10,1,"facts_check_up","Facts Check-up","",0,0,""],
["2026d310_2753","andrew","fri","11:05 AM",20,0,"piano","Piano","keyboard",0,0,""],
["2026d310_2728","makenzie","fri","11:15 AM",10,1,"checkup_spelling","Checkup Spelling","screen",0,0,""],
["makenzie_makenzie__aas_4_L0161","makenzie","fri","11:25 AM",20,1,"aas_4","Lesson 8 · day 1 of 5","",1,0,""],
["2026d310_2757","taylor","fri","1:00 PM",30,0,"","","",0,0,"🏡 History"],
["2026d310_2758","makenzie","fri","1:00 PM",30,0,"","","",0,0,"🏡 History"],
["2026d310_2759","andrew","fri","1:00 PM",30,0,"","","",0,0,"🏡 History"],
["2026d310_2760","caleb","fri","1:00 PM",30,0,"","","",0,0,"🏡 History"],
["2026d310_2761","taylor","fri","1:30 PM",30,0,"","","",0,0,"🏡 Science"],
["2026d310_2762","makenzie","fri","1:30 PM",30,0,"","","",0,0,"🏡 Science"],
["2026d310_2763","andrew","fri","1:30 PM",30,0,"","","",0,0,"🏡 Science"],
["2026d310_2764","caleb","fri","1:30 PM",30,0,"","","",0,0,"🏡 Science"],
["2026d310_2765","taylor","fri","2:00 PM",20,0,"","","",0,0,"🏡 Read Aloud"],
["2026d310_2766","makenzie","fri","2:00 PM",20,0,"","","",0,0,"🏡 Read Aloud"],
["2026d310_2767","andrew","fri","2:00 PM",20,0,"","","",0,0,"🏡 Read Aloud"],
["2026d310_2768","caleb","fri","2:00 PM",20,0,"","","",0,0,"🏡 Read Aloud"],
["makenzie_makenzie__apologia_math_4_L0018","makenzie","fri","2:20 PM",20,1,"apologia_math_4","Lesson 68","",1,0,""],
["makenzie_makenzie__cle_language_arts_4_L0023","makenzie","fri","2:40 PM",30,1,"cle_language_arts_4","404 L6: Finding Fragments Within Paragraphs","",1,0,""],
];
const DN = { wed: "wednesday", fri: "friday" };
const META = {};
function realDays() {
  return DAYS.map(r => { const t = { id: r[0], who: r[1], day: DN[r[2]], time: r[3], dur: r[4], mom: r[5] ? "required" : "none" };
    if (r[11]) { t.title = r[11]; t.famBlock = "fb1"; t.famItem = r[11]; } else { t.subjectKey = r[6]; t.title = "📄 " + r[6] + " — " + r[7]; }
    META[t.id] = { lane: r[8] || null, lesson: !!r[9], ahead: r[10] }; return t; });
}

function world(o) {
  o = o || {};
  const ctx = { console, JSON, Object, Array, String, Number, Math, Set, Map, RegExp, Date, parseInt, isNaN,
    document: { body: { appendChild: () => {} }, getElementById: () => null, createElement: () => ({ style: {}, remove() {} }) },
    momHere: () => false, _dryRun: () => true, masteryData: {}, db: null,
    HA_LS: { setItem: () => {} }, gwShowToast: () => {}, renderAll: () => {}, renderUnits: () => {},
    DAY_DT: { wednesday: "November 4", friday: "November 6" }, checked: o.checked || {}, claimed: {}, toMin, fromMin,
    helperHolds: () => null, weekData: { tasks: o.tasks || [] } };
  vm.createContext(ctx);
  vm.runInContext(CODE, ctx);
  ctx.unitStudies = { all_about_spelling: { id: "all_about_spelling", cardLessons: true, decks: ctx._aasDecks(),
    kidStage: { taylor: { stage: 4, subject: "all_about_spelling_4" }, andrew: { stage: 1, subject: "all_about_spelling_1" } } } };
  if (o.oldSlide) ctx.stSlideDown = () => {};   // the code before this fix: the lesson just moves 10 minutes
  return ctx;
}
const WIN = { start: toMin("9:00 AM"), end: toMin("4:00 PM"), lunchStart: toMin("12:00 PM"), lunchEnd: toMin("1:00 PM") };
const sctx = (c, extra) => Object.assign({ checked: c.checked, claimed: {}, toMin, fromMin, win: () => WIN }, extra || {});
const gctx = c => ({ days: ["monday", "tuesday", "wednesday", "thursday", "friday"], todayDay: "monday", nowMin: toMin("6:57 PM"),
  checked: c.checked, claimed: {}, win: () => WIN, kidOff: () => false, isClass: t => !!t.famBlock,
  isLesson: t => !!(META[t.id] && META[t.id].lesson), ahead: (kid, sk) => { const r = DAYS.find(x => x[1] === kid && x[6] === sk); return r ? r[10] : 0; },
  lane: t => (META[t.id] && META[t.id].lane) || null, laneCap: () => 1, toMin, fromMin });
const dayOf = (T, who, day) => T.filter(t => t.who === who && t.day === day && !/lunch/i.test(t.title || "")).sort((a, b) => toMin(a.time) - toMin(b.time));
const stacks = (T, who, day) => { const L = dayOf(T, who, day), s = [];
  for (let i = 1; i < L.length; i++) { const p = L[i - 1]; if (toMin(L[i].time) < toMin(p.time) + (+p.dur || 20)) s.push((p.subjectKey || p.title) + " / " + (L[i].subjectKey || L[i].title)); } return s; };
const at = (T, id) => (T.find(t => t.id === id) || {}).time;

console.log("── The real Wednesday (Taylor) and Friday (Andrew): the test card makes room, nothing stacks ──");
{
  const T = realDays(), c = world({ tasks: T });
  ok("before the test card: neither day stacks", !stacks(T, "taylor", "wednesday").length && !stacks(T, "andrew", "friday").length);
  const r = c.stSyncWeek(T, sctx(c));
  ok("two test cards: Taylor Lesson 12 (before AAS 4 Lesson 13), Andrew 1-22 (before AAS 1 L23)",
    r.added.indexOf("taylor_st_L4-12") >= 0 && r.added.indexOf("andrew_st_L1-22") >= 0, r);
  ok("Taylor: the test takes the lesson's 9:35, the lesson follows at 9:45", at(T, "taylor_st_L4-12") === "9:35 AM" && at(T, "taylor_taylor__all_about_spelling_4_L0005") === "9:45 AM");
  ok("Taylor: Facts Check-up slides 9:55 → 10:05, Fix-It 10:05 → 10:15, Piano 10:25 → 10:35, Reading 10:45 → 10:55, Typing 11:15 → 11:25",
    at(T, "2026d308_2683") === "10:05 AM" && at(T, "2026d308_2690") === "10:15 AM" && at(T, "2026d308_2693") === "10:35 AM" && at(T, "2026d308_2696") === "10:55 AM" && at(T, "2026d308_2702") === "11:25 AM",
    dayOf(T, "taylor", "wednesday").map(t => t.time + " " + (t.subjectKey || t.title)));
  ok("Taylor's Wednesday has no stacked cards", !stacks(T, "taylor", "wednesday").length, stacks(T, "taylor", "wednesday"));
  ok("Andrew: the test takes 9:25, AAS 1 follows at 9:35, Arithmetic 9:45 → 9:55, Phonics 61 10:05 → 10:15",
    at(T, "andrew_st_L1-22") === "9:25 AM" && at(T, "andrew_andrew__all_about_spelling_1_L0030") === "9:35 AM" && at(T, "andrew_andrew__arithmetic_2_L0022") === "9:55 AM" && at(T, "andrew_andrew__language_arts_2_phonics_L0025") === "10:15 AM",
    dayOf(T, "andrew", "friday").map(t => t.time + " " + (t.subjectKey || t.title)));
  ok("Andrew's Friday has no stacked cards", !stacks(T, "andrew", "friday").length, stacks(T, "andrew", "friday"));
  ok("the family time cards keep 1:00 / 1:30 / 2:00", T.filter(t => t.famBlock).every(t => t.time === DAYS.find(x => x[0] === t.id)[3]));
  ok("no other kid's card moved", T.filter(t => !t.stTest && !((t.who === "taylor" && t.day === "wednesday") || (t.who === "andrew" && t.day === "friday"))).every(t => t.time === DAYS.find(x => x[0] === t.id)[3]));
  const again = c.stSyncWeek(T, sctx(c));
  ok("a second pass changes nothing", !again.added.length && !again.moved.length && !again.removed.length && !stacks(T, "taylor", "wednesday").length, again);

  const g = c.seGuardWeek(T, gctx(c));
  ok("the school-end guard then defers nothing", !g.deferred.length && !g.rolled.length, { deferred: g.deferred, rolled: g.rolled });
  ok("Taylor keeps AAS 4 Lesson 13 on Wednesday, Andrew keeps Phonics 61 on Friday",
    T.some(t => t.id === "taylor_taylor__all_about_spelling_4_L0005" && t.day === "wednesday") && T.some(t => t.id === "andrew_andrew__language_arts_2_phonics_L0025" && t.day === "friday"));
}

console.log("\n── The live incident, replayed with the old code (lesson moves 10 minutes, nothing else) ──");
{
  const T = realDays(), c = world({ tasks: T, oldSlide: true });
  c.stSyncWeek(T, sctx(c));
  ok("the old code stacks both days", stacks(T, "taylor", "wednesday").length === 1 && stacks(T, "andrew", "friday").length === 1, [stacks(T, "taylor", "wednesday"), stacks(T, "andrew", "friday")]);
  const g = c.seGuardWeek(T, gctx(c));
  ok("…and the guard takes Taylor's AAS 4 Lesson 13 and Andrew's Phonics 61 off the week (what happened live)",
    g.deferred.indexOf("taylor_taylor__all_about_spelling_4_L0005") >= 0 && g.deferred.indexOf("andrew_andrew__language_arts_2_phonics_L0025") >= 0, g.deferred);
}

console.log("\n── The slide's rules ──");
const L = (id, time, dur, extra) => Object.assign({ id, who: "andrew", day: "friday", time, dur: dur || 20, mom: "required",
  subjectKey: "all_about_spelling_1", title: "📄 All About Spelling 1 — L23 Adding ES · day 1 of 5" }, extra || {});
const X = (id, time, dur, extra) => Object.assign({ id, who: "andrew", day: "friday", time, dur: dur || 20, mom: "none", subjectKey: "x_" + id, title: "📄 X — " + id }, extra || {});
{
  const T = [X("A", "9:15 AM", 10), L("L", "9:25 AM"), X("B", "9:45 AM"), X("C", "10:20 AM")], c = world({ tasks: T });
  c.stSyncWeek(T, sctx(c));
  ok("only as far as needed: B 9:45 → 9:55; C at 10:20 already clear, stays", at(T, "L") === "9:35 AM" && at(T, "B") === "9:55 AM" && at(T, "C") === "10:20 AM", T.map(t => t.id + " " + t.time));
}
{
  const T = [X("A", "9:15 AM", 10), L("L", "9:25 AM"), X("B", "9:45 AM")], c = world({ tasks: T, checked: { B: "9:50 AM Nov 6" } });
  c.stSyncWeek(T, sctx(c));
  ok("a checked card never moves (the slide stops there)", at(T, "B") === "9:45 AM" && at(T, "L") === "9:35 AM");
}
{
  const T = [X("A", "9:15 AM", 10), L("L", "9:25 AM"), X("B", "9:45 AM", 20, { famBlock: "fb1", famItem: "i", title: "🏡 History" }), X("C", "10:05 AM")], c = world({ tasks: T });
  c.stSyncWeek(T, sctx(c));
  ok("a family time card never moves, and nothing past it is touched", at(T, "B") === "9:45 AM" && at(T, "C") === "10:05 AM");
}
{
  const T = [X("A", "9:15 AM", 10), L("L", "9:25 AM"), X("B", "9:45 AM")], c = world({ tasks: T });
  c.stSyncWeek(T, sctx(c, { isFixed: t => t.id === "B" }));
  ok("a set-time card (isFixed) never moves", at(T, "B") === "9:45 AM");
}
{
  const T = [X("A", "9:15 AM", 10), L("L", "9:25 AM"), X("B", "9:45 AM")], c = world({ tasks: T });
  c.stSyncWeek(T, sctx(c, { started: (day, t) => t.id === "B" }));
  ok("a card already started today never moves", at(T, "B") === "9:45 AM");
}
{
  const T = [X("A", "11:05 AM", 10), L("L", "11:15 AM", 20), X("B", "11:35 AM", 20), X("C", "1:00 PM", 20)], c = world({ tasks: T });
  c.stSyncWeek(T, sctx(c));
  ok("lunch is stepped over: B 11:35 → 11:45 would run into lunch → 1:00, C 1:00 → 1:20", at(T, "B") === "1:00 PM" && at(T, "C") === "1:20 PM", T.map(t => t.id + " " + t.time));
}
{
  const T = [L("L", "9:25 AM"), X("B", "9:45 AM"), X("O", "9:45 AM", 20, { who: "taylor" })], c = world({ tasks: T });
  c.stSyncWeek(T, sctx(c));
  ok("room before the lesson (9:15 free) → the test goes there, nothing slides", at(T, "andrew_st_L1-22") === "9:15 AM" && at(T, "L") === "9:25 AM" && at(T, "B") === "9:45 AM");
  ok("another kid's card is never moved", at(T, "O") === "9:45 AM");
}
{
  const T = [X("A", "9:15 AM", 10), L("L", "9:25 AM"), X("B", "9:45 AM"), X("Bt", "9:45 AM", 20, { day: "thursday" })], c = world({ tasks: T });
  c.stSyncWeek(T, sctx(c));
  ok("a card on another day is never moved", at(T, "Bt") === "9:45 AM" && at(T, "B") === "9:55 AM");
}

console.log("\n── The app's context hands the slide its held-card rules ──");
{
  const blk = cut("// STNOSTACK_START", "// STNOSTACK_END");
  ok("the block is marked and holds stSlideDown", blk.indexOf("function stSlideDown(") >= 0);
  const ctxSrc = slice("stSyncCtx");
  ok("stSyncCtx gives isFixed (the school-end guard's isClass) and started", /isFixed:t=>/.test(ctxSrc) && /seGuardCtx\(\)\.isClass/.test(ctxSrc) && /started:\(day,t\)=>/.test(ctxSrc));
  ok("the no-room branch calls the slide", /else \{ T\.time=L\.time; L\.time=fm\(Lt\+dur\); stSlideDown\(L,busy,o,day,Lt\); \}/.test(slice("stSyncWeek")));
  ok("no 🔀 anywhere in the block", blk.indexOf("\u{1F500}") < 0);
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
