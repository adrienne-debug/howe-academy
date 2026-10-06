/*
 * Node tests — 🩺 Start a check-up any time + Grade box (step 7 of the AAS plan, 2026-10-04). For an ALREADY-enrolled kid,
 * Mom picks level (earlier ones too), lessons, words-or-everything, Quick 3 / Quick 5 / Every word, and a daily size
 * suggested by grade (K–1 3 · 2–3 5 · 4–5 8 · 6+ 10). The enrollment is untouched. Rule Breakers come first in a quick check.
 *   run:  node test_checkup_start.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const cut = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error("markers " + a); return src.slice(i, j); };
function slice(name) { const i = src.indexOf("function " + name + "("); if (i < 0) throw new Error("missing " + name);
  let d = 0; for (let k = src.indexOf("{", i); k < src.length; k++) { if (src[k] === "{") d++; else if (src[k] === "}") { d--; if (!d) return src.slice(i, k + 1); } } }
const CODE = cut("// AAS_START", "// AAS_END") + "\n" + ["_ustCards", "_ustFamilies", "_ustFamNum", "_ustStageDef", "_ustStagesWithCards"].map(slice).join("\n") + "\n"
  + cut("// CHECKUP_START", "// CHECKUP_END") + "\n" + cut("// CKSTART_START", "// CKSTART_END");
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x) : "")); } };
function world(o) {
  o = o || {}; const writes = [];
  const ctx = { console, JSON, Object, Array, String, Number, Math, Set, Map, RegExp, Date, parseInt, isNaN, document: { getElementById: () => null },
    momHere: () => o.mom !== false, _dryRun: () => false, gwShowToast: () => {}, renderUnits: () => {},
    ROSTER_DEF: [{ id: "taylor", name: "Taylor", grade: o.grade }, { id: "andrew", name: "Andrew", grade: "2" }],
    masteryData: { taylor: [], taylor_settings: {} }, db: { ref: p => ({ set: v => writes.push(["set", p, v]), update: v => writes.push(["update", p, v]) }) } };
  vm.createContext(ctx); vm.runInContext(CODE + "\nObject.defineProperty(this,'ckStartForm',{get:()=>ckStartForm,set:v=>{ckStartForm=v;}});", ctx);
  ctx.unitStudies = { all_about_spelling: { id: "all_about_spelling", cardLessons: true, stages: [1,2,3,4,5,6,7].map(n => ({ n, label: "Level " + n })), decks: ctx._aasDecks(), kidStage: { taylor: { stage: 4, subject: "all_about_spelling_4", knows: "Lesson 8" } } } };
  return { ctx, writes };
}
console.log("── grade → suggested size ──");
{
  const s = g => world({ grade: g }).ctx.ckSuggest("taylor");
  ok("K → 3, 1st → 3, 2nd → 5, 3rd → 5, 4th → 8, 5th → 8, 7th → 10", [s("K"), s("1"), s("2"), s("3"), s("4"), s("5"), s("7")].join() === "3,3,5,5,8,8,10");
  ok("no grade → no suggestion (the form says where to add one)", s(undefined) === null && /Add a grade in Settings ▸ Family/.test((() => { const c = world().ctx; c.ckStartOpen("all_about_spelling", "taylor"); return c.ckStartHtml(c.unitStudies.all_about_spelling, "taylor", c.unitStudies.all_about_spelling.kidStage.taylor); })()));
}
console.log("\n── starting one for an enrolled kid ──");
{
  const w = world({ grade: "7" }), c = w.ctx, u = c.unitStudies.all_about_spelling;
  c.ckStartOpen("all_about_spelling", "taylor");
  ok("defaults: the level below hers (Level 3), words only, Quick 3, 10 a day (7th grade)", c.ckStartForm.level === 3 && c.ckStartForm.what === "words" && c.ckStartForm.mode === "q3" && c.ckStartForm.perDay === 10);
  const h = c.ckStartHtml(u, "taylor", u.kidStage.taylor);
  ok("the form offers every level, lessons, depth and 'Recommended for 7th grade: 10'", /Level 1/.test(h) && /Level 4/.test(h) && /Lesson 2/.test(h) && /Every word/.test(h) && /Recommended for 7th grade: 10/.test(h));
  c.ckStartSet("level", 1); c.ckStartSet("from", "7"); c.ckStartSet("to", "12");
  c.ckStartCreate();
  const sess = c.masteryData.taylor_sessions["checkup_all_about_spelling_1_7-12_w"];
  ok("a check-up session is saved: Level 1 · Lessons 7–12 · words, quick 3", sess && sess.stage === 1 && sess.lessonFrom === 7 && sess.lessonTo === 12 && sess.quick === 3 && sess.untested === "spot" && JSON.stringify(sess.decks) === '["AAS Words"]', sess);
  ok("…her enrollment is untouched (still Level 4, knows Lesson 8); the row just points at the check-up", u.kidStage.taylor.stage === 4 && u.kidStage.taylor.knows === "Lesson 8" && u.kidStage.taylor.checkup === "checkup_all_about_spelling_1_7-12_w"
    && w.writes.some(x => x[1] === "unitStudies/all_about_spelling/kidStage/taylor/checkup") && !w.writes.some(x => x[1] === "unitStudies/all_about_spelling/kidStage/taylor"));
  const cards = c.ckCards(sess);
  ok("the session covers only Lessons 7–12's WORDS (60 cards)", cards.length === 60 && cards.every(x => x._dk === "AAS Words" && x.lesson >= 7 && x.lesson <= 12));
  ok("…grouped by lesson for the quick check", c.ckFamilies(cards).length === 6);
}
{
  const w = world(), c = w.ctx; c.ckStartOpen("all_about_spelling", "taylor"); c.ckStartSet("mode", "all"); c.ckStartSet("what", "all"); c.ckStartCreate();
  const sess = c.masteryData.taylor_sessions["checkup_all_about_spelling_3"];
  ok("'Every word' + 'Every card' → no shortcut, phonograms and rules included", sess && sess.untested === "all" && !sess.decks && c.ckCards(sess).some(x => x._dk === "Phonograms"));
}
{
  // mstSessions() hands every session decks: [] when none were saved — an EMPTY list must mean "no deck filter"
  // (2026-10-05: Taylor's facts check-up resolved to 0 cards and showed "unit isn't in your family yet").
  const c = world().ctx, sess = { kind: "checkup", unit: "all_about_spelling", stage: 3, decks: [] };
  const n = c._ustCards(c.unitStudies.all_about_spelling, 3).length;
  ok("a session with an EMPTY decks list (the mstSessions default) still covers every card of its level", n > 0 && c.ckCards(sess).length === n, [n, c.ckCards(sess).length]);
}
console.log("\n── Rule Breakers first ──");
{
  const c = world().ctx, u = c.unitStudies.all_about_spelling;
  const l29 = c._ustCards(u, 3).filter(x => x._dk === "AAS Words" && x.lesson === 5);   // table, candle, … said, gone (Rule Breakers)
  const picks = c.ckQuickPicks(l29, 3).map(x => x.name);
  ok("a quick check of Level 3 Lesson 5 asks the Rule Breakers 'said' and 'gone' first", picks[0] === "said" && picks[1] === "gone", picks);
  const facts = [{ name: "7×8", order: 1 }, { name: "2×1", order: 2 }];
  ok("math facts keep their own hardest-first order", c.ckQuickPicks(facts, 1)[0].name === "7×8");
}
console.log("\n── Mom only ──");
ok("a kid never sees 'Start a check-up'", world({ mom: false }).ctx.ckStartHtml(world().ctx.unitStudies.all_about_spelling, "taylor", {}) === "");
console.log("\n── wiring ──");
ok("ckCards honors a session's lesson range / decks", /return \(typeof ckSessionFilter==="function"\)\?ckSessionFilter\(session,all\):all;/.test(src));
ok("the unit row carries 'Start a check-up'", /h\+=ckStartHtml\(u,k,ks\)/.test(src));
ok("Settings ▸ Family has a Grade box on each kid", /famSet\('\+i\+',\\'grade\\',this\.value\)/.test(src));
console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
