/*
 * Node tests — 🖨 PDGRADE: grade a paper drill later (her ask 2026-10-28/29: "when the drill card is checked off on the
 * schedule by Grandma or anyone else and the drill wasn't actually run in the app, the printed questions are saved and go
 * to Mom's list to grade … Mom enters the results, and the drill ladder continues as if it had run in the app").
 * A drill card checked off on a day with a printed paper drill and no drill logged → that record turns "pending" →
 * "🖨 Grade <kid>'s paper drill" on Mom's list → Mom marks each number → Save runs the REAL ladder engine
 * (mastApplyScores, sliced from index.html) on the paper day's school-day number and writes that day's drill history.
 *   run:  node test_paper_drill_grade.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const cut = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error("markers " + a); return src.slice(i, j); };
function slice(name) { const i = src.indexOf("function " + name + "("); if (i < 0) throw new Error("missing " + name);
  let d = 0; for (let k = src.indexOf("{", i); k < src.length; k++) { if (src[k] === "{") d++; else if (src[k] === "}") { d--; if (!d) return src.slice(i, k + 1); } } }
const constLine = n => { const m = src.match(new RegExp("const " + n + "=[^\\n]*;")); if (!m) throw new Error("missing const " + n); return m[0]; };
const CODE = ['const MAST_CLOCK_EPOCH="2026-01-01"; let _mastClockMemo={};', constLine("MAST_TIER_INT"), constLine("MAST_TIER_ORDER"),
  ...["getSchoolDays", "mastKidSchoolDows", "mastSchoolDayNum", "mastShuffleDeck", "mastApplyScores", "mastStampNextDue", "mastIntroDotsFor", "mastIntroMaxFor"].map(slice),
  cut("// PAPERDRILL_START", "// PAPERDRILL_END")].join("\n");

let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x) : "")); } };

const KID = "kid1", KEY = "20261028";
const LADDER = ["every_other_day", "weekly", "bi_weekly", "monthly", "graduated"];
const card = (id, prompt, tier, extra) => Object.assign({ id, prompt, subject: "Math Facts", tier, status: "active", consecutive_correct: 0, cycle: 1, drop_count: 0, tally_dots: 5, next_due: 210 }, extra || {});
function world(o) {
  o = o || {};
  const writes = [], toasts = [], els = {}, calls = { ww: 0, gate: 0, grad: 0 };
  const items = o.items || [card("a", "7×8", "weekly", { consecutive_correct: 2 }), card("b", "6×7", "bi_weekly", { consecutive_correct: 1 }),
    card("c", "9×9", "monthly"), card("n", "8×8", "daily", { status: "introduction", tally_dots: 2, next_due: undefined }), card("x", "3×3", "weekly")];
  const ctx = { console, JSON, Object, Array, String, Number, Math, Set, Map, RegExp, Date, parseInt, isNaN,
    masteryKid: "other", calendarData: {}, paceData: {}, ROSTER: new Set([KID, "kid2"]), SL_KLBL: { [KID]: "Kid One" },
    DAY_DT: { wednesday: "October 28", thursday: "October 29" },
    masteryData: Object.assign({ [KID]: items, [KID + "_settings"]: { definitions: { "7×8": "56" } }, history: {},
      [KID + "_paperDrills"]: { [KEY]: { date: "2026-10-28", pn: 214, ids: ["a", "b", "c", "n", "gone"], q: ["7×8", "6×7", "9×9", "8×8", "old"], ts: 1, state: o.state || "printed" } } }, o.mastery || {}),
    momHere: () => o.mom !== false, _dryRun: () => !!o.dry, today: o.today || "2026-10-28",
    db: { ref: p => ({ set: v => writes.push(["set", p, v]), update: v => writes.push(["update", p, v]) }) },
    document: { body: { appendChild: e => { els[e.id] = e; } }, getElementById: id => els[id] || null, createElement: () => ({ style: {}, remove() { delete els[this.id]; } }) },
    gwShowToast: m => toasts.push(m), renderAll: () => {}, confirm: () => true, HA_LS: { setItem: () => {} },
    effectiveDay: t => t.day, mastGetCatMode: () => "flip", mastGetDef: (k, p) => ((ctx.masteryData[k + "_settings"] || {}).definitions || {})[p] || "",
    owRuleBack: () => "", mastGetVisual: () => null, mastCatFace: () => "name",
    mastDrillSettings: () => ({ ladder: LADDER, tier_streaks: {}, ladder_streak: 3, miss_drop: "reset", auto_pull: false, intro_dots: 5, cat_intro_dots: {}, max_intro_per_cat: 3 }),
    mastIsParked: () => false, mastIsNeverDrill: () => false, mastBankEligible: () => [], mastCatFinishedLearning: () => false,
    mastDynamicEligible: () => false, mastDynamicMark: () => {}, mastDynamicClear: () => {}, mastDynamicShouldAdd: () => false, mastDynamicShouldPrune: () => false,
    mastGateStart: () => { calls.gate++; }, wwAfterDrill: () => { calls.ww++; }, drillsCompletedCats: () => [], checkDrillsGraduation: () => { calls.grad++; },
    mastPrintLogAppend: (d, n) => writes.push(["printLog", d, n]) };
  ctx.calToday = () => ctx.today;
  vm.createContext(ctx);
  vm.runInContext(CODE + "\nObject.defineProperty(this,'pdUI',{get:()=>pdUI});", ctx);
  return { ctx, writes, toasts, els, calls };
}
const drillCard = (extra) => Object.assign({ id: "kid1_drills_wed", who: KID, day: "wednesday", subjectKey: "drills", title: "📄 Drills — Drills" }, extra || {});

console.log("── a drill card checked off with no drill run → Mom's list ──");
{
  const w = world(), c = w.ctx;
  c.pdOnDrillChecked(drillCard());
  ok("the printed record turns pending (one targeted update of its state)", c.masteryData[KID + "_paperDrills"][KEY].state === "pending"
    && w.writes.length === 1 && w.writes[0][0] === "update" && w.writes[0][1] === "mastery/" + KID + "_paperDrills/" + KEY && w.writes[0][2].state === "pending", w.writes);
  const html = c.pdPendingHTML();
  ok("Mom's list shows “Grade Kid One’s paper drill” for that day", /Grade Kid One’s paper drill/.test(html) && /Wed, Oct 28/.test(html) && /pdOpen\('kid1','20261028'\)/.test(html));
  ok("not Mom → no row", (() => { const w2 = world({ mom: false }); w2.ctx.pdOnDrillChecked(drillCard()); return w2.ctx.pdPendingHTML() === ""; })());
}
{
  const w = world({ today: "2026-10-29" }), c = w.ctx;
  c.pdOnDrillChecked(drillCard());
  ok("checked the next morning → still Wednesday's paper (the card's own day)", c.masteryData[KID + "_paperDrills"][KEY].state === "pending");
}
{
  const w = world({ mastery: { history: { [KID]: { [KEY]: { date: "2026-10-28", items: [] } } } } });
  w.ctx.pdOnDrillChecked(drillCard());
  ok("the drill ran in the app that day → nothing to grade", w.ctx.masteryData[KID + "_paperDrills"][KEY].state === "printed" && !w.writes.length);
}
{
  const w = world();
  w.ctx.pdOnDrillChecked(drillCard({ subjectKey: "math" }));
  w.ctx.pdOnDrillChecked(drillCard({ who: "kid2" }));
  ok("another card, or a kid with no paper that day → nothing", w.ctx.masteryData[KID + "_paperDrills"][KEY].state === "printed" && !w.writes.length);
  w.ctx.today = "2026-10-27"; w.ctx.pdOnDrillChecked(drillCard({ day: "thursday" }));
  ok("a paper for a day still ahead is never marked", w.ctx.masteryData[KID + "_paperDrills"][KEY].state === "printed");
}
{
  const w = world({ dry: true });
  w.ctx.pdOnDrillChecked(drillCard());
  ok("?dryrun=1 → pending on this screen only, nothing written", w.ctx.masteryData[KID + "_paperDrills"][KEY].state === "pending" && !w.writes.length);
}
{
  const w = world({ state: "pending", mastery: { history: { [KID]: { [KEY]: { date: "2026-10-28", items: [] } } } } });
  ok("a pending paper leaves the list once a drill for that day is logged in the app", w.ctx.pdPendingHTML() === "");
}

console.log("\n── Mom grades it → the ladder moves as if the drill ran in the app ──");
{
  const w = world({ state: "pending" }), c = w.ctx;
  c.pdOpen(KID, KEY);
  ok("the screen lists the printed cards in printed order, numbered", c.pdUI.items.length === 5 && c.pdUI.items[0].id === "a" && /1\./.test(w.els["pd-panel"].innerHTML));
  ok("…with the answer beside each (7×8 → 56)", /7×8<span[^>]*>56<\/span>/.test(w.els["pd-panel"].innerHTML));
  ok("a learning card offers “Went over it”, not ✓ ~ ✗", /pdSet\(3,'shown'\)/.test(w.els["pd-panel"].innerHTML) && !/pdSet\(3,'c'\)/.test(w.els["pd-panel"].innerHTML));
  ok("a card no longer in the deck is shown greyed, with no buttons", /no longer in the deck/.test(w.els["pd-panel"].innerHTML) && !/pdSet\(4,/.test(w.els["pd-panel"].innerHTML));
  c.pdSet(0, "c"); c.pdSet(1, "m"); c.pdSet(3, "shown");   // c left unmarked
  c.pdSave();
  const it = id => c.masteryData[KID].find(x => x.id === id);
  ok("✓ on its 3rd right in a row → weekly → bi-weekly (the drill's own streak rule)", it("a").tier === "bi_weekly" && it("a").consecutive_correct === 0, it("a"));
  ok("…booked a full interval out from the paper day (school day 214 + 10 or a bit later)", it("a").next_due >= 224 && it("a").next_due <= 229, it("a").next_due);
  ok("✗ → back to the bottom rung, a drop counted", it("b").tier === "every_other_day" && it("b").drop_count === 1, it("b"));
  ok("unmarked card untouched (still due next drill)", it("c").tier === "monthly" && it("c").next_due === 210);
  ok("“Went over it” fills a learning dot (2 → 3)", it("n").tally_dots === 3 && it("n").status === "introduction");
  ok("a card that wasn't on the paper is untouched", it("x").tier === "weekly");
  const H = c.masteryData.history[KID][KEY];
  ok("that day's drill history is written: 1 ✓, 1 ✗, 1 shown, marked paper", H && H.date === "2026-10-28" && H.printNum === 214 && H.correct === 1 && H.miss === 1 && H.shown === 1 && H.pct === 50 && H.paper === true, H);
  const setH = w.writes.find(x => x[0] === "set" && x[1] === "mastery/history/" + KID + "/" + KEY);
  ok("…to mastery/history/<kid>/<day> (the key the app's drill uses)", !!setH);
  const cardUpd = w.writes.find(x => x[0] === "update" && x[1] === "mastery/" + KID);
  ok("the cards are written field by field, only the touched ones (targeted, never the whole list)", cardUpd && Object.keys(cardUpd[2]).every(k => /^[013]\//.test(k)) && cardUpd[2]["0/tier"] === "bi_weekly" && cardUpd[2]["1/tier"] === "every_other_day", cardUpd && Object.keys(cardUpd[2]));
  ok("the paper record is marked graded with each number's mark", (() => { const u = w.writes.find(x => x[0] === "update" && x[1] === "mastery/" + KID + "_paperDrills/" + KEY); return u && u[2].state === "graded" && u[2].res.join() === "c,m,,shown,"; })());
  ok("the print log gets the paper day", w.writes.some(x => x[0] === "printLog" && x[1] === "2026-10-28" && x[2] === 214));
  ok("Word Workout, gate start and drills graduation run just like an app drill", w.calls.ww === 1 && w.calls.grad === 1);
  ok("the screen closes, the row leaves Mom's list", !w.els["pd-panel"] && c.pdPendingHTML() === "");
}
{
  const w = world({ state: "pending" }), c = w.ctx;
  c.pdOpen(KID, KEY); c.pdSkip();
  ok("“Didn't do it” → dropped, nothing on the ladder moves, no history", c.masteryData[KID + "_paperDrills"][KEY].state === "skipped" && !c.masteryData.history[KID]
    && w.writes.length === 1 && w.writes[0][2].state === "skipped");
}
{
  const w = world({ state: "pending", dry: true }), c = w.ctx;
  c.pdOpen(KID, KEY); c.pdSetAll(); c.pdSave();
  ok("?dryrun=1 → graded on screen, nothing written to Firebase", !w.writes.length && c.masteryData.history[KID][KEY].correct === 3);
  ok("All ✓ marks learning cards “Went over it”", c.masteryData.history[KID][KEY].shown === 1);
}
{
  const w = world({ state: "pending", mom: false });
  w.ctx.pdOpen(KID, KEY);
  ok("only Mom can open the grading screen", w.ctx.pdUI === null);
}

console.log("\n── wiring ──");
ok("a check-off asks the paper drill (right after the spelling test's hook)", /stOnTestChecked\(t\); \}catch\(e\)\{\}[^\n]*\n\s*try\{ if\(typeof pdOnDrillChecked==="function"\) pdOnDrillChecked\(t\); \}catch\(e\)\{\}/.test(src));
ok("Mom HQ and Mom's Day both list paper drills to grade", (src.match(/h\+=pdPendingHTML\(\);/g) || []).length === 2);
ok("Save uses the drill's own engine with the same options as an app drill", /mastApplyScores\(items,due,scores,pn,_jset,\{prevShown:prevShown,autoPull:true,chain:true\}\)/.test(slice("pdSave")));
ok("no kid names in the block", !/lincoln|ellis|lucy|julian|andrew|taylor|makenzie|caleb/i.test(cut("// PAPERDRILL_START", "// PAPERDRILL_END")));

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
