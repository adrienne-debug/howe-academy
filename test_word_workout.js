/*
 * Node tests — 🏋️ Word Workout (step 6 of the AAS plan; her rules 2026-10-04: in after a word is missed twice, out
 * after three right days). Misses come from the drill, the spelling test and 🚩 problem words; right days from the
 * drill and the workout itself. The workout never shows the answer. Runs the REAL code.
 *   run:  node test_word_workout.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const cut = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error("markers " + a); return src.slice(i, j); };
const CODE = cut("// AAS_START", "// AAS_END") + "\n" + cut("// SPELLTEST_START", "// SPELLTEST_END") + "\n" + cut("// PROBLEMWORDS_START", "// PROBLEMWORDS_END") + "\n" + cut("// WORDWORKOUT_START", "// WORDWORKOUT_END");
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x) : "")); } };
function world(items) {
  const writes = [], els = {};
  const document = { body: { appendChild: e => { els[e.id] = e; } }, getElementById: id => els[id] || null, createElement: () => ({ style: {}, remove() { delete els[this.id]; } }) };
  const ctx = { console, JSON, Object, Array, String, Number, Math, Set, Map, RegExp, Date, parseInt, isNaN, document, setTimeout: () => {},
    momHere: () => true, _dryRun: () => false, HA_LS: { setItem: () => {} }, gwShowToast: () => {}, _mastRe: () => {}, mastGetPrintNum: () => 1,
    masteryData: { k: items || [], k_custom_items: [] }, db: { ref: p => ({ set: v => writes.push(["set", p, v]), update: v => writes.push(["update", p, v]), push: () => {} }) } };
  vm.createContext(ctx); vm.runInContext(CODE + "\nObject.defineProperty(this,'wwUI',{get:()=>wwUI,set:v=>{wwUI=v;}}); Object.defineProperty(this,'pwUI',{get:()=>pwUI,set:v=>{pwUI=v;}});", ctx);
  return { ctx, writes, els };
}
const W = (prompt, extra) => Object.assign({ id: "k_" + prompt, subject: "AAS Words", prompt, answer: prompt, status: "active", tier: "weekly" }, extra || {});
console.log("── in after 2 miss days, out after 3 right days ──");
{
  const c = world().ctx, it = W("they");
  c.wwNote(it, "miss", "2026-10-05");
  ok("one miss → not yet in the workout", !it.ww.on && it.ww.m === 1);
  c.wwNote(it, "miss", "2026-10-05");
  ok("a second miss the SAME day doesn't count twice", it.ww.m === 1 && !it.ww.on);
  c.wwNote(it, "miss", "2026-10-06");
  ok("a miss on a second day → in the workout", it.ww.on === true && it.ww.since === "2026-10-06");
  c.wwNote(it, "right", "2026-10-07"); c.wwNote(it, "right", "2026-10-07");
  ok("right twice on one day counts as one right day", it.ww.r.length === 1);
  c.wwNote(it, "miss", "2026-10-08");
  ok("a miss during the workout starts the three days over", it.ww.on && it.ww.r.length === 0);
  ["2026-10-09", "2026-10-10"].forEach(d => c.wwNote(it, "right", d));
  ok("two right days → still in", it.ww.on && it.ww.r.length === 2);
  c.wwNote(it, "right", "2026-10-11");
  ok("third right day → out of the workout", it.ww.on === false && it.ww.out === "2026-10-11" && it.ww.m === 0);
  ok("math cards are never in a word workout", c.wwNote({ subject: "Math Facts", prompt: "7×8" }, "miss", "2026-10-05") === false);
}
console.log("\n── where misses and right days come from ──");
{
  const items = [W("they"), W("were"), { id: "m1", subject: "Math Facts", prompt: "7×8" }];
  const c = world(items).ctx; const touched = [];
  c.wwAfterDrill("k", items, [{ id: "k_they" }, { id: "k_were" }, { id: "m1" }], { k_they: "m", k_were: "c", m1: "m" }, touched);
  ok("the drill's miss is counted on the spelling card and it joins the write", items[0].ww.m === 1 && touched.indexOf(items[0]) >= 0);
  ok("a right answer outside a workout changes nothing; math untouched", !items[1].ww || !items[1].ww.on);
  ok("…and the math card is not written for this", touched.indexOf(items[2]) < 0);
}
{
  const w = world([W("snack", { ww: { m: 1, d: "2000-01-01", r: [] } })]), c = w.ctx;
  c.stApplyResults("k", ["snack"], { 0: "m" }, "L1-18");
  ok("a ✗ on the spelling test is a miss day → second miss puts it in the workout", c.masteryData.k[0].ww.on === true);
}
{
  const w = world([W("been", { status: "active", tier: "graduated", ww: { m: 1, d: "2000-01-01", r: [] } })]), c = w.ctx;
  c.pwOpen("k"); c.pwUI.text = "been"; c.pwFromText(); c.pwApply();
  ok("Mom flagging it as a 🚩 problem word counts as a miss", c.masteryData.k[0].ww.on === true);
}
console.log("\n── the kid's workout ──");
{
  const it = W("together", { ww: { m: 2, on: true, r: [] } });
  const w = world([it]), c = w.ctx;
  ok("the drill page shows '🏋️ Word Workout (1)'", /Word Workout \(1\)/.test(c.wwBtnHtml("k")));
  ok("no button when there's nothing in the workout", world([W("x")]).ctx.wwBtnHtml("k") === "");
  c.wwOpen("k");
  ok("hear-and-type first: the word is NOT on the screen", !/together/.test(w.els["ww-panel"].innerHTML));
  w.els["ww-in"] = { value: "togather" }; c.wwCheck(); w.els["ww-in"] = { value: "togehter" }; c.wwCheck();
  ok("two wrong tries → 'try it again tomorrow' — the answer is never shown", /Try it again tomorrow/.test(w.els["ww-panel"].innerHTML) && !/>together</.test(w.els["ww-panel"].innerHTML) && !/: together/.test(w.els["ww-panel"].innerHTML));
  c.wwUI.done = {}; c.wwUI.tries = 0; w.els["ww-in"] = { value: "Together" }; c.wwCheck();
  ok("typed right (any capitals) → a right day, saved to the card", it.ww.r.length === 1 && w.writes.some(x => x[1] === "mastery/k/0/ww"));
  c.wwNext();
  ok("next round switches to fill-the-gaps: vowels blank, the kid types the whole word", c.wwUI.mode === "gaps" && /t_g_th_r/.test(w.els["ww-panel"].innerHTML));
}
console.log("\n── wiring ──");
ok("drill save feeds the workout before its targeted write", /wwAfterDrill\(masteryKid,items,due,mastLogScores,touched\)/.test(src) && /upd\[ix\+"\/ww"\]=it\.ww;/.test(src));
ok("spelling test and problem words feed it", /wwNote\(it,r==="m"\?"miss"/.test(src) && /wwNote\(it,"miss"\);   \/\/ 🏋️ WORDWORKOUT: Mom flagging/.test(src));
ok("the notebook's Practice Words includes workout words", /\(i\.ww&&i\.ww\.on\)/.test(src));
ok("the drill page shows the kid's workout button", /h\+=wwBtnHtml\(masteryKid\)/.test(src));
console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
