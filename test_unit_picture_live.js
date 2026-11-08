/*
 * Node tests — UNITPIC: a card shows the LIVE picture (a family's report 2026-11-08: Mom added a new picture
 * to a unit card; the unit menu showed it, but the flashcard kept the original wiki picture — every card drawer
 * read the copy stamped onto the kid's item at enroll before the unit's visual).
 *   1 · a kid item with a stale imageUrl + a changed unit visual → the card shows the unit's picture
 *   2 · a kid-level _visuals override wins over the unit's
 *   3 · a non-unit card with only its own imageUrl still shows it
 *   4 · emoji visuals still work (unit emoji, kid emoji, item emoji)
 *   5 · the unit menu (_unitPortrait) and the card agree on a fixture
 *   6 · every drawer (flashcard, Study, games, paper drill, printed sheet, lists) goes through the one helper
 * Runs the REAL code sliced from index.html.   run:  node test_unit_picture_live.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
function slice(name) { const i = src.indexOf("function " + name + "("); if (i < 0) throw new Error("missing " + name);
  let d = 0; for (let k = src.indexOf("{", i); k < src.length; k++) { if (src[k] === "{") d++; else if (src[k] === "}") { d--; if (!d) return src.slice(i, k + 1); } } }

let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x) : "")); } };

const WIKI = "https://upload.wikimedia.org/old_great_white.jpg";
const NEW_PIC = "https://firebasestorage.googleapis.com/v0/b/x/o/unit_images%2Fsharks%2Fnew_great_white.jpg?alt=media";
const KID_PIC = "https://firebasestorage.googleapis.com/v0/b/x/o/mastery%2Fk1%2Fmy_hammerhead.jpg?alt=media";
const OWN_PIC = "https://example.test/own_card.jpg";

const NEEDED = ["_mastVisNorm", "mastLiveVisual", "mastLiveImg", "mastGetVisual", "mastItemVis", "_smTileVis",
  "_unitPortrait", "_pdAs", "pdVisual", "mstCardPic", "mastExpandHtml"];
const ctx = { console, Object, Array, String, masteryKid: "k1",
  masteryData: {
    k1: [
      { id: "a", subject: "Sharks", prompt: "Great White", imageUrl: WIKI },                 // stamped at enroll, then Mom changed the unit picture
      { id: "b", subject: "Sharks", prompt: "Hammerhead", imageUrl: WIKI },                  // kid override on top
      { id: "c", subject: "Tools", prompt: "Wrench", imageUrl: OWN_PIC },                    // not from a unit
      { id: "d", subject: "Sharks", prompt: "Nurse Shark", emoji: "🦈" },                    // unit emoji
      { id: "e", subject: "Pets", prompt: "Goldfish", emoji: "🐠" },                         // item emoji only
      { id: "f", subject: "Sharks", prompt: "Tiger Shark", emoji: "🐯" }],                   // kid emoji over a unit photo
    k1_visuals: { "Sharks_Hammerhead": { imageUrl: KID_PIC }, "Sharks_Tiger Shark": "🐅" },
    history: {} },
  unitStudies: { sharks: { decks: [{ key: "Sharks" }], visuals: {
    "Sharks_Great White": { imageUrl: NEW_PIC, credit: "Mom" },
    "Sharks_Hammerhead": { imageUrl: NEW_PIC },
    "Sharks_Nurse Shark": "🐟",
    "Sharks_Tiger Shark": { imageUrl: NEW_PIC } } } },
  MAST_ANIMAL_EMOJI: {}, MAST_COLOR_MAP: {}, mastColorBorder: () => "#000", mastShapeVis: () => "",
  mastCountN: () => 0, mastCountEmoji: () => "", mastExpandedId: null, owRuleBack: (k, it) => it.answer };
vm.createContext(ctx);
vm.runInContext(NEEDED.map(slice).join("\n"), ctx);
const run = c => vm.runInContext(c, ctx);
const item = id => run("masteryData.k1.find(i=>i.id===" + JSON.stringify(id) + ")");
ctx._it = null;
const lv = id => { ctx._it = item(id); return run("mastLiveVisual(_it)"); };
const draw = (fn, id) => { ctx._it = item(id); return String(run(fn + "(_it)")); };

console.log("1 · stale imageUrl + changed unit visual → the unit's picture");
ok("helper gives the unit's new picture", lv("a").img === NEW_PIC && lv("a").from === "live", lv("a"));
ok("drill grid / train (mastItemVis) shows it", draw("mastItemVis", "a").includes(NEW_PIC) && !draw("mastItemVis", "a").includes(WIKI));
ok("game + Match tiles (_smTileVis) show it", draw("_smTileVis", "a").includes(NEW_PIC) && !draw("_smTileVis", "a").includes(WIKI));
ok("paper drill (pdVisual) shows it", String(run("pdVisual('k1',masteryData.k1[0],40)")).includes(NEW_PIC));
ok("Study card (mstCardPic) shows it", run("mstCardPic({id:'a',deck:'Sharks',name:'Great White'})") === NEW_PIC);
ok("the tap-to-reveal (mastExpandHtml) shows it", draw("mastExpandHtml", "a").includes(NEW_PIC) && !draw("mastExpandHtml", "a").includes(WIKI));
ok("the item's own copy is NOT rewritten (no migration)", item("a").imageUrl === WIKI);

console.log("2 · a kid-level override wins over the unit's");
ok("helper gives the kid's picture", lv("b").img === KID_PIC && lv("b").from === "live", lv("b"));
ok("mastItemVis shows the kid's picture", draw("mastItemVis", "b").includes(KID_PIC));
ok("paper drill for that kid shows it", String(run("pdVisual('k1',masteryData.k1[1],40)")).includes(KID_PIC));
ok("another kid without the override gets the unit's", run("mastLiveVisual(masteryData.k1[1],'k2')").img === NEW_PIC);

console.log("3 · a non-unit card with only its own imageUrl still shows it");
ok("helper falls back to the item's imageUrl", lv("c").img === OWN_PIC && lv("c").from === "item", lv("c"));
ok("mastItemVis + _smTileVis + Study show it", draw("mastItemVis", "c").includes(OWN_PIC) && draw("_smTileVis", "c").includes(OWN_PIC)
  && run("mstCardPic({id:'c',deck:'Tools',name:'Wrench'})") === OWN_PIC);

console.log("4 · emoji visuals still work");
ok("unit emoji beats the item's stamped emoji", lv("d").emoji === "🐟" && draw("mastItemVis", "d") === "🐟", lv("d"));
ok("item emoji alone still draws", lv("e").emoji === "🐠" && lv("e").from === "item" && draw("_smTileVis", "e").includes("🐠"));
ok("kid emoji beats a unit photo", lv("f").emoji === "🐅" && draw("mastItemVis", "f") === "🐅", lv("f"));
ok("an emoji is never a Study picture", run("mstCardPic({id:'f',deck:'Sharks',name:'Tiger Shark'})") === "");
ok("a card with nothing has no picture", run("mastLiveVisual({subject:'X',prompt:'y'})") === null && run("mastLiveVisual(null)") === null);

console.log("5 · the unit menu and the card agree");
const u = ctx.unitStudies.sharks;
[["a", "Great White"], ["b", "Hammerhead"], ["d", "Nurse Shark"], ["f", "Tiger Shark"]].forEach(([id, name]) => {
  ctx._u = u; const menu = run("_unitPortrait(_u,'k1','Sharks'," + JSON.stringify(name) + ")"); const card = lv(id);
  ok("menu = card for " + name, menu && card && (menu.img || null) === (card.img || null) && (menu.emoji || null) === (card.emoji || null), { menu, card });
});
ctx.unitStudies.sharks.visuals["Sharks_Great White"] = { imageUrl: KID_PIC + "&v=3" };   // Mom changes it again
ok("a second change reaches the card at once", lv("a").img === KID_PIC + "&v=3");

console.log("6 · every drawer goes through the one helper");
const blk = src.slice(src.indexOf("// UNITPIC_START"), src.indexOf("// UNITPIC_END"));
ok("UNITPIC block present", blk.length > 200);
const outside = src.replace(blk, "");
// the only item-copy mentions left outside the helper are the editor's own writes/deletes
const readLines = outside.split("\n").filter(l => /\b(it|i)\.imageUrl\b/.test(l) && !/delete (it|i)\.imageUrl|(it|i)\.imageUrl=/.test(l));
ok("no drawer reads the item's imageUrl outside the helper", readLines.length === 0, readLines.map(l => l.trim().slice(0, 90)));
const drill = src.slice(src.indexOf("// Big visual"), src.indexOf("// Big visual") + 1200);
ok("the drill flashcard asks the helper first", /const _lv=mastLiveVisual\(it\);[^\n]*\n\s*let bigVis=/.test(drill));
ok("the drill's 'guess the name' check uses the same answer", src.includes('const _hasPic=!!_lv&&(!!_lv.img||_lv.from!=="item");'));
ok("printed sheet (jVis) uses the helper", /function jVis\(it,sz\)\{\s*const lv=mastLiveVisual\(it\);/.test(src));
ok("ladder rows use the helper", src.includes("{ const _lv=mastLiveVisual(i);   // UNITPIC"));
ok("enroll still stamps the copy (offline / older cards)", (src.match(/else if\(vis\.imageUrl\) item\.imageUrl=vis\.imageUrl;/g) || []).length >= 2);

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
