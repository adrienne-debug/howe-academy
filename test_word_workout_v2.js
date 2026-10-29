/*
 * Node tests — 🏋️ Word Workout v2 (WWV2, her yes 2026-10-29: problem words need extra practice the kid can SEE).
 *   1. In right away: a 🚩 problem word or a graded ✗ on a spelling test turns the workout on at once; drill / study
 *      misses (and a test closed with "no time") keep the 2-day rule; leaving stays right on 3 different days.
 *   2. 👀 See it, copy it: look → cover → write → compare (wrong letters marked) → fix while looking, before the
 *      hidden-word step. Copying never counts a right day and writes nothing.
 *   3. "🏋️ Word Workout · N words" on the kid's own Day page, today only — derived, never a scheduled card.
 * Runs the REAL code.   run:  node test_word_workout_v2.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const cut = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error("markers " + a); return src.slice(i, j); };
function slice(name) { const i = src.indexOf("function " + name + "("); if (i < 0) throw new Error("no " + name); let d = 0; for (let k = src.indexOf("{", i); k < src.length; k++) { if (src[k] === "{") d++; else if (src[k] === "}") { d--; if (!d) return src.slice(i, k + 1); } } }
const CODE = cut("// AAS_START", "// AAS_END") + "\n" + cut("// SPELLTEST_START", "// SPELLTEST_END") + "\n" + cut("// PROBLEMWORDS_START", "// PROBLEMWORDS_END") + "\n"
  + cut("// WORDWORKOUT_START", "// WORDWORKOUT_END") + "\n" + slice("mstEsc") + "\n" + slice("mstCopyDiff") + "\n" + slice("mstCopyMarked");
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x) : "")); } };
function world(items, extra) {
  const writes = [], els = {}, timers = [];
  const document = { body: { appendChild: e => { els[e.id] = e; } }, getElementById: id => els[id] || null, createElement: () => ({ style: {}, remove() { delete els[this.id]; } }) };
  const ctx = Object.assign({ console, JSON, Object, Array, String, Number, Math, Set, Map, RegExp, Date, parseInt, isNaN, document, setTimeout: (f, ms) => { timers.push({ f, ms }); },
    momHere: () => true, _dryRun: () => false, HA_LS: { setItem: () => {} }, gwShowToast: () => {}, _mastRe: () => {}, mastGetPrintNum: () => 1, mastSpeak: () => {},
    _todayDay: "Wed", masteryData: { k: items || [], k_custom_items: [] },
    db: { ref: p => ({ set: v => writes.push(["set", p, v]), update: v => writes.push(["update", p, v]), push: () => {} }) } }, extra || {});
  vm.createContext(ctx); vm.runInContext(CODE + "\nObject.defineProperty(this,'wwUI',{get:()=>wwUI,set:v=>{wwUI=v;}}); Object.defineProperty(this,'pwUI',{get:()=>pwUI,set:v=>{pwUI=v;}});", ctx);
  return { ctx, writes, els, timers };
}
const W = (prompt, extra) => Object.assign({ id: "k_" + prompt, subject: "AAS Words", prompt, answer: prompt, status: "active", tier: "weekly" }, extra || {});
const panel = w => (w.els["ww-panel"] || {}).innerHTML || "";

console.log("── 1. in right away (🚩 and a graded ✗), the rest keep the 2-day rule ──");
{
  const w = world([W("been")]), c = w.ctx;
  c.pwOpen("k"); c.pwUI.text = "been"; c.pwFromText(); c.pwApply();
  const it = c.masteryData.k[0];
  ok("a word Mom flags 🚩 with no miss days before → in the workout at once", it.ww && it.ww.on === true && it.ww.m === 1, it.ww);
  ok("…and the flag write carries item.ww (no new node)", w.writes.some(x => x[0] === "update" && x[1] === "mastery/k" && x[2][0] && x[2][0].ww && x[2][0].ww.on));
}
{
  const w = world([]), c = w.ctx;
  c.pwOpen("k"); c.pwUI.text = "friend"; c.pwFromText(); c.pwApply();
  const it = c.masteryData.k.find(i => i.prompt === "friend");
  ok("a brand-new 🚩 word (no card yet) → in the workout at once", it && it.ww && it.ww.on === true, it && it.ww);
}
{
  const w = world([W("snack")]), c = w.ctx;
  c.stApplyResults("k", ["snack"], { 0: "m" }, "L1-18");
  ok("a ✗ on a graded spelling test → in the workout at once", c.masteryData.k[0].ww.on === true);
  ok("…the test's targeted write carries item.ww", w.writes.some(x => x[1] === "mastery/k" && x[2][0] && x[2][0].ww && x[2][0].ww.on));
}
{
  const w = world([W("snack"), W("jump")]), c = w.ctx;
  c.stApplyResults("k", ["snack", "jump"], { 0: "c", 1: "s" }, "L1-18");
  ok("✓ and 〰 on a test don't put a word in", !(c.masteryData.k[0].ww && c.masteryData.k[0].ww.on) && !(c.masteryData.k[1].ww && c.masteryData.k[1].ww.on));
}
{
  const w = world([W("snack")]), c = w.ctx;
  c.stApplyResults("k", ["snack"], { 0: "m" }, "L1-18", null, true);
  ok("a test closed with 'no time' is not a ✗ — one miss day, 2-day rule", c.masteryData.k[0].ww.m === 1 && !c.masteryData.k[0].ww.on);
}
{
  const items = [W("they")], c = world(items).ctx;
  c.wwAfterDrill("k", items, [{ id: "k_they" }], { k_they: "m" }, []);
  ok("a drill miss keeps the 2-day rule (one miss → not in)", items[0].ww.m === 1 && !items[0].ww.on);
  const it = W("were"); c.wwNote(it, "miss", "2026-10-05");
  ok("wwNote without `now` → still 2 days", !it.ww.on);
  c.wwNote(it, "miss", "2026-10-06");
  ok("…second miss day → in", it.ww.on === true);
}
{
  const c = world().ctx, it = W("said");
  c.wwNote(it, "miss", "2026-10-05", true);
  ["2026-10-06", "2026-10-06", "2026-10-07"].forEach(d => c.wwNote(it, "right", d));
  ok("in right away, still needs 3 different right days (2 so far)", it.ww.on && it.ww.r.length === 2);
  c.wwNote(it, "right", "2026-10-08");
  ok("third right day → out, as before", it.ww.on === false && it.ww.out === "2026-10-08");
  ok("math cards never join, even with `now`", c.wwNote({ subject: "Math Facts", prompt: "7×8" }, "miss", "2026-10-05", true) === false);
}

console.log("\n── 2. 👀 see it, copy it — before the hidden-word step ──");
{
  const it = W("together", { ww: { m: 1, on: true, r: [] } });
  const w = world([it]), c = w.ctx;
  c.wwOpen("k");
  ok("the workout opens on the copy step: LOOK, the word shows", c.wwUI.step === "look" && /data-ww-step="look"/.test(panel(w)) && />together</.test(panel(w)));
  ok("…with a 'Hide it' button and a 4 s auto-hide", /wwCopyHide\(\)/.test(panel(w)) && w.timers.some(t => t.ms === 4000));
  const stale = w.timers.find(t => t.ms === 4000);
  c.wwCopyHide();
  ok("Hide it → COVER: the word is gone, a write box shows", c.wwUI.step === "cover" && !/>together</.test(panel(w)) && /id="ww-copy-in"/.test(panel(w)));
  stale.f();
  ok("the old timer firing later changes nothing", c.wwUI.step === "cover");
  w.els["ww-copy-in"] = { value: "togather" }; c.wwCopyCheck();
  ok("wrong copy → COMPARE with the wrong letters marked, the word beside it", c.wwUI.step === "fix" && /mst-copy-miss[^>]*>a</.test(panel(w)) && /The word/.test(panel(w)));
  ok("…and a 'fix it while you look' box", /id="ww-copy-fix"/.test(panel(w)) && /write it right while you look/.test(panel(w)));
  ok("copying writes nothing and counts no right day", w.writes.length === 0 && it.ww.r.length === 0);
  ok("'Now from memory' isn't offered until it's fixed", !/wwCopyDone\(\)/.test(panel(w)));
  w.els["ww-copy-fix"] = { value: "togehter" }; c.wwCopyFix();
  ok("a wrong fix → 'Not yet', box cleared", c.wwUI.fixMiss && !c.wwUI.fixed && /Not yet/.test(panel(w)));
  w.els["ww-copy-fix"] = { value: "Together" }; c.wwCopyFix();
  ok("fixed (any capitals) → ✓ Fixed and 'Now from memory →'", c.wwUI.fixed && /✓ Fixed/.test(panel(w)) && /wwCopyDone\(\)/.test(panel(w)));
  c.wwCopyDone();
  ok("then the hidden-word step: hear it — the word is NOT on screen", c.wwUI.step === "test" && /Hear the word/.test(panel(w)) && !/>together</.test(panel(w)));
  w.els["ww-in"] = { value: "together" }; c.wwCheck();
  ok("the hidden-word step is what counts the right day (and saves item.ww)", it.ww.r.length === 1 && w.writes.some(x => x[1] === "mastery/k/0/ww"));
}
{
  const it = W("people", { ww: { m: 1, on: true, r: [] } }), it2 = W("could", { ww: { m: 1, on: true, r: [] } });
  const w = world([it, it2]), c = w.ctx;
  c.wwOpen("k"); c.wwCopyHide();
  w.els["ww-copy-in"] = { value: "people" }; c.wwCopyCheck();
  ok("right copy → ✓ and straight on to 'Now from memory'", c.wwUI.step === "compare" && /You copied it/.test(panel(w)) && /wwCopyDone\(\)/.test(panel(w)));
  w.els["ww-in"] = { value: "people" }; c.wwCheck();
  ok("Check on the hidden step does nothing while still copying", it.ww.r.length === 0);
  c.wwNext();
  ok("the next word starts at LOOK again (and its own timer)", c.wwUI.step === "look" && />could</.test(panel(w)) && w.timers.filter(t => t.ms === 4000).length === 2);
  c.wwCopyDone();
  ok("can't skip past the copy to the hidden step", c.wwUI.step === "look");
  c.wwCopyHide(); w.els["ww-copy-in"] = { value: "could" }; c.wwCopyCheck(); c.wwCopyDone();
  ok("second word's hidden step is fill-the-gaps (alternates as before)", c.wwUI.mode === "gaps" && /c__ld/.test(panel(w)));
}

console.log("\n── 3. the kid can find it on their Day page ──");
{
  const w = world([W("they", { ww: { m: 1, on: true, r: [] } }), W("were", { ww: { m: 1, on: true, r: [] } }), W("jump")]), c = w.ctx;
  const h = c.wwDayChipHtml("k", "Wed");
  ok("'🏋️ Word Workout · 2 words' shows today, and opens the Workout", /🏋️ Word Workout · 2 words/.test(h) && /onclick="wwOpen\('k'\)"/.test(h));
  ok("not on another day's page", c.wwDayChipHtml("k", "Thu") === "");
  ok("not on Mom's or the all-kids view", c.wwDayChipHtml("mom", "Wed") === "" && c.wwDayChipHtml("all", "Wed") === "");
  ok("one word → '1 word'", /· 1 word</.test(world([W("they", { ww: { on: true, r: [] } })]).ctx.wwDayChipHtml("k", "Wed")));
  ok("nothing when the workout is empty", world([W("jump")]).ctx.wwDayChipHtml("k", "Wed") === "");
  ok("nothing on the kid's own day off", world([W("they", { ww: { on: true, r: [] } })], { kidOffOwnDay: () => true }).ctx.wwDayChipHtml("k", "Wed") === "");
  ok("drawing it writes nothing", w.writes.length === 0);
}
{
  const hook = src.indexOf('h+=wwDayChipHtml(kid,day)'), strip = src.indexOf('h+=retrSchedStripHtml(kid,day);');
  ok("hooked on the kid's Day page right under the 🧠 brain work strip, typeof-guarded",
    hook > strip && hook - strip < 200 && /typeof wwDayChipHtml==="function"\) h\+=wwDayChipHtml\(kid,day\)/.test(src));
  const ww = cut("// WORDWORKOUT_START", "// WORDWORKOUT_END"), wwCode = ww.split("\n").filter(l => !/^\s*\/\//.test(l)).join("\n");
  ok("never a scheduled card: the Workout code never touches week tasks / checked", !/weekData|week\d|\/tasks|checked\[/.test(wwCode));
  ok("no new Firebase node: the only db write in the Workout is mastery/<kid>/<i>/ww", (ww.match(/db\.ref\(/g) || []).length === 1 && /db\.ref\("mastery\/"\+kid\+"\/"\+ix\+"\/ww"\)/.test(ww));
  ok("PATCCC's 4 s is read at call time (its const loads after this block — a load-time read would throw)", !/^(const|let|var) [^\n]*MST_COPY_HIDE_MS/m.test(ww) && src.indexOf("// WORDWORKOUT_START") < src.indexOf("const MST_COPY_HIDE_MS"));
  ok("the Drills button stays",/h\+=wwBtnHtml\(masteryKid\)/.test(src));
  ok("'no time' passes noTime to stApplyResults", /stApplyResults\(S\.kid,S\.words\.map\(w=>w\.name\),res,S\.key,prev\.was\|\|null,true\)/.test(src));
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
