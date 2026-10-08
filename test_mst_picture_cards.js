/*
 * Node tests — MST_PICS: study-session cards draw their picture (her report 2026-10-08: Lincoln's
 * Chemistry Instruments pictures never showed in his Science session; the front showed the NAME instead).
 *   1 · a glassware card ("name" face, recite answer) → picture on the front, NO name on the front;
 *       name + definition on the back
 *   2 · a NEW card straight from the bank (no id) finds the unit's shared picture
 *   3 · a "desc" face deck with a picture → picture AND name on the front
 *   4 · cards without a picture render exactly as before (vocab, rule, spell, emoji visual)
 *   5 · the picture branch runs before the rule branch
 * Runs the REAL code sliced from index.html.   run:  node test_mst_picture_cards.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
function has(name) { return src.indexOf("function " + name + "(") >= 0; }
function slice(name) { const i = src.indexOf("function " + name + "("); if (i < 0) throw new Error("missing " + name);
  let d = 0; for (let k = src.indexOf("{", i); k < src.length; k++) { if (src[k] === "{") d++; else if (src[k] === "}") { d--; if (!d) return src.slice(i, k + 1); } } }

let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x) : "")); } };

const URL_ALEMBIC = "https://firebasestorage.googleapis.com/v0/b/howeacademy.firebasestorage.app/o/unit_images%2Frs4k_book6%2Fv2%2Falembic.jpg?alt=media&token=t1";
const URL_BALANCE = "https://firebasestorage.googleapis.com/v0/b/howeacademy.firebasestorage.app/o/unit_images%2Frs4k_book6%2Fv2%2Fbalance.jpg?alt=media&token=t2";
const URL_BOHR = "https://example.test/monarch.jpg?x=1&y=\"2\"";
const DEF_ALEMBIC = "An early piece of specialized glassware used by chemists for simple distillation.";
const DEF_BALANCE = "An instrument that measures mass by comparing an unknown mass to a known mass.";

const NEEDED = ["mastGetDef", "mastCustomDef", "mastGetVisual", "mastCatFace", "mstEsc", "mstEscJs", "mstItemAnswer", "mstCardDef",
  "mstCardMode", "mstIsRuleCard", "mstIsSpellCard", "mstFlipBtn", "mstAudioBtn", "mstCardPic", "mstPicCardHtml", "mstCardHtml"];
const MODES = { "Chemistry Instruments": "flip", "British Monarchs": "flip", "Vocabulary": "flip", "Capitalization": "flash", "Spelling": "spell", "Shapes": "flash" };

function mk(code) {
  const ctx = { console, Object, Array, Number, String, masteryKid: "lincoln", mstFlipped: false,
    masteryData: {
      lincoln: [
        { id: "lin_alembic", subject: "Chemistry Instruments", prompt: "alembic", answer: DEF_ALEMBIC, review_mode: "recite", status: "active", imageUrl: URL_ALEMBIC },
        { id: "lin_henry", subject: "British Monarchs", prompt: "Henry VIII", answer: "Tudor king", review_mode: "flash", status: "active" },
        { id: "lin_brave", subject: "Vocabulary", prompt: "brave", answer: "ready to face danger" },
        { id: "lin_rule", subject: "Capitalization", prompt: "We saw <u>E.T.</u> today.", answer: "Capitalize a title.", review_mode: "recite" },
        { id: "lin_cat", subject: "Spelling", prompt: "cat" },
        { id: "lin_star", subject: "Shapes", prompt: "Star" }],
      lincoln_settings: { definitions: {}, cat_face: {} },
      lincoln_custom_items: [{ cat: "Chemistry Instruments", name: "balance", def: DEF_BALANCE, ch: 2 }] },
    unitStudies: { rs4k_book6: { decks: [{ key: "Chemistry Instruments", flipFace: "name" }],
                                 visuals: { "Chemistry Instruments_balance": { imageUrl: URL_BALANCE } } },
                   british_monarchy: { decks: [{ key: "British Monarchs", flipFace: "desc" }],
                                 visuals: { "British Monarchs_Henry VIII": { imageUrl: URL_BOHR } } },
                   shapes: { decks: [], visuals: { "Shapes_Star": "⭐" } } },
    MAST_MATH_ANS: {}, MAST_VOCAB_DEFS: {},
    mastGetDefAudio: () => "", ttsFlipAttrs: () => "",
    mastGetCatMode: (k, c) => MODES[c] || "flash" };
  vm.createContext(ctx);
  vm.runInContext((code || NEEDED.filter(has).map(slice).join("\n")), ctx);
  return ctx;
}
const ctx = mk();
const run = code => vm.runInContext(code, ctx);
const front = h => (h.split("mast-flip-back")[0] || "");
const back = h => (h.split("mast-flip-back")[1] || "");
const text = h => h.replace(/<[^>]*>/g, " ");
const S = '{name:"Science",audio:"off"}';

console.log("── 1 · a glassware card in the Science session ──");
{ const h = run('mstCardHtml(' + S + ',{key:"r:lin_alembic",kind:"review",id:"lin_alembic",deck:"Chemistry Instruments",name:"alembic"})');
  ok("the picture is on the front", front(h).indexOf('<img src="' + URL_ALEMBIC.replace(/&/g, "&amp;") + '"') >= 0, front(h).slice(0, 300));
  ok("the NAME is not on the front (it's the answer)", !/\balembic\b/.test(text(front(h))), text(front(h)));
  ok("the front asks what it is, not for 'the rule'", front(h).indexOf("what this is") >= 0 && front(h).indexOf("the rule") < 0);
  ok("the back shows the name big", back(h).indexOf('<div class="mast-slide-name">alembic</div>') >= 0);
  ok("the back shows the definition", back(h).indexOf(DEF_ALEMBIC) >= 0);
}

console.log("── 2 · a NEW card from the bank uses the unit's picture ──");
{ const h = run('mstCardHtml(' + S + ',{key:"n:balance",kind:"new",deck:"Chemistry Instruments",name:"balance"})');
  ok("the unit's picture is on the front", front(h).indexOf(URL_BALANCE.replace(/&/g, "&amp;")) >= 0);
  ok("no name on the front", !/\bbalance\b/.test(text(front(h))));
  ok("…marked Learning", front(h).indexOf("Learning") >= 0);
  ok("the bank's definition is on the back", back(h).indexOf(DEF_BALANCE) >= 0);
}

console.log("── 3 · a 'desc' face deck shows picture AND name ──");
{ const h = run('mstCardHtml({name:"Daily Study",audio:"front"},{key:"r:lin_henry",kind:"review",id:"lin_henry",deck:"British Monarchs",name:"Henry VIII"})');
  ok("picture on the front (unit visual, URL escaped)", front(h).indexOf('src="https://example.test/monarch.jpg?x=1&amp;y=&quot;2&quot;"') >= 0, front(h).slice(0, 300));
  ok("name on the front too", front(h).indexOf('<div class="mast-slide-name">Henry VIII</div>') >= 0);
  ok("definition on the back", back(h).indexOf("Tudor king") >= 0);
  ok("a cat_face override to 'name' hides it", (() => { run('masteryData.lincoln_settings.cat_face["British Monarchs"]="name"');
    const h2 = run('mstCardHtml({name:"Daily Study"},{key:"r:lin_henry",kind:"review",id:"lin_henry",deck:"British Monarchs",name:"Henry VIII"})');
    run('delete masteryData.lincoln_settings.cat_face["British Monarchs"]'); return !/Henry VIII/.test(text(front(h2))) && front(h2).indexOf("<img") >= 0; })());
}

console.log("── 4 · cards without a picture are unchanged ──");
{ // the same cards rendered by the code WITHOUT the picture branch (helpers removed, call line stripped)
  const plain = NEEDED.filter(n => n !== "mstCardPic" && n !== "mstPicCardHtml").filter(has).map(slice).join("\n")
    .replace(/\n\s*\{ const _pic=\(typeof mstCardPic[^\n]*/, "");
  const ctx0 = mk(plain);
  const cards = [
    '{key:"r:lin_brave",kind:"review",id:"lin_brave",deck:"Vocabulary",name:"brave"}',
    '{key:"r:lin_rule",kind:"review",id:"lin_rule",deck:"Capitalization",name:"We saw <u>E.T.</u> today."}',
    '{key:"r:lin_cat",kind:"review",id:"lin_cat",deck:"Spelling",name:"cat"}',
    '{key:"r:lin_star",kind:"review",id:"lin_star",deck:"Shapes",name:"Star"}'];
  for (const c of cards) {
    const a = run('mstCardHtml(' + S + ',' + c + ')'), b = vm.runInContext('mstCardHtml(' + S + ',' + c + ')', ctx0);
    ok("identical output: " + c.match(/deck:"([^"]+)"/)[1], a === b);
  }
  const pic = c => run('typeof mstCardPic==="function" ? mstCardPic(' + c + ') : "MISSING"');
  ok("an emoji visual is not a picture", pic('{id:"lin_star",deck:"Shapes",name:"Star"}') === "");
  ok("no card → no picture, no throw", pic('null') === "");
}

console.log("── 5 · wiring ──");
{ const body = has("mstCardHtml") ? slice("mstCardHtml") : "";
  const i = body.indexOf("mstCardPic(card)"), j = body.indexOf("if(mstIsRuleCard(card))");
  ok("mstCardHtml checks the picture BEFORE the rule branch", i > 0 && j > 0 && i < j, { i, j });
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
