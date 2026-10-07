/*
 * Node tests — 👂 SHOWME_CUE: the "Show Me" pick-3 card's cue (her report 2026-10-07: Lucy's sight-word
 * pick-3 printed the target word in small text, so she matched letters to the same word in the tiles).
 *   · Sight Words default to "spoken": the word is never written above the tiles, a big 🔊 says it
 *     (through the shared mastSpeak), it's said once as the card comes up, and a wrong tap says it again.
 *   · "look" (look away → reveal): the word shows big with NO tiles; 🙈 Look away hides it and shows the tiles.
 *   · "shown" keeps the old card; every other deck stays "shown" unless Mom picks.
 *   · Mom's per-deck setting is one targeted write (show_me_cue/<deck>), Mom-only, inert under ?dryrun=1.
 * Runs the REAL code sliced from index.html.   run:  node test_showme_cue.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const cut = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error("markers " + a); return src.slice(i, j); };
function slice(name) { const i = src.indexOf("function " + name + "("); if (i < 0) throw new Error("missing " + name);
  let d = 0; for (let k = src.indexOf("{", i); k < src.length; k++) { if (src[k] === "{") d++; else if (src[k] === "}") { d--; if (!d) return src.slice(i, k + 1); } } }
const BLOCK = cut("// SHOWME_CUE_START", "// SHOWME_CUE_END");

let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x) : "")); } };

function mk(o) {
  o = o || {};
  const spoken = [], writes = []; let renders = 0;
  const ctx = { console, JSON, Object, String,
    masteryKid: "lucy", masteryData: { lucy_settings: o.settings || {} },
    mastShowMe: {},
    mastSpeak: t => spoken.push(t),
    _mastRe: () => { renders++; },
    momHere: () => o.mom !== false,
    _dryRun: () => !!o.dry,
    HA_LS: { setItem: () => {} },
    db: { ref: p => ({ update: v => writes.push({ p, v, op: "update" }), set: v => writes.push({ p, v, op: "set" }) }) } };
  vm.createContext(ctx);
  vm.runInContext(slice("mastShowMeTap") + "\n" + BLOCK, ctx);
  return { ctx, spoken, writes, renders: () => renders };
}
const it = { id: "luc_the", prompt: "the", subject: "Sight Words" };
const KEY = "luc_the|7";

console.log("── defaults ──");
{ const { ctx } = mk();
  ok("Sight Words default to spoken", vm.runInContext('mastShowMeCue("lucy","Sight Words")', ctx) === "spoken");
  ok("other decks keep the written card", vm.runInContext('mastShowMeCue("lucy","Letters")', ctx) === "shown"
    && vm.runInContext('mastShowMeCue("julian","Shapes")', ctx) === "shown");
}
{ const { ctx } = mk({ settings: { show_me_cue: { "Sight Words": "look", Letters: "spoken", Colors: "bogus" } } });
  ok("Mom's per-deck pick wins", vm.runInContext('mastShowMeCue("lucy","Sight Words")', ctx) === "look"
    && vm.runInContext('mastShowMeCue("lucy","Letters")', ctx) === "spoken");
  ok("a junk value falls back to the default", vm.runInContext('mastShowMeCue("lucy","Colors")', ctx) === "shown");
}

console.log("── spoken ──");
{ const { ctx, spoken } = mk(); ctx.it = it;
  const r = vm.runInContext('mastShowMeCueHtml(it,"spoken","' + KEY + '",undefined)', ctx);
  const text = r.html.replace(/<[^>]*>/g, " ");
  ok("tiles show", r.tiles === true);
  ok("the word is NOT written on the card", !/\bthe\b/i.test(text.replace(/Tap the word you hear/i, "")), text);
  ok("a big 🔊 button speaks the word through mastSpeak", /mastSpeak\('the'\)/.test(r.html) && r.html.indexOf("\u{1F50A}") >= 0 && /width:104px/.test(r.html));
  ok("try-again line doesn't give the word away", !/\bthe\b/.test(r.wrong.replace(/^Almost/, "")), r.wrong);
  ok("says the word once as the card comes up", vm.runInContext('mastShowMeAutoSay("' + KEY + '")', ctx) === true && spoken.join() === "the");
  ok("…and not again on a re-render", vm.runInContext('mastShowMeAutoSay("' + KEY + '")', ctx) === false && spoken.length === 1);
  vm.runInContext('mastShowMeTap("' + KEY + '","luc_the","luc_of")', ctx);
  ok("a wrong tap says the word again", spoken.length === 2 && spoken[1] === "the");
  vm.runInContext('mastShowMeTap("' + KEY + '","luc_the","luc_the")', ctx);
  ok("a right tap doesn't speak (the 🎉 face reveals the word)", spoken.length === 2 && ctx.mastShowMe[KEY] === "ok");
}
{ const { ctx, spoken } = mk(); ctx.it = it;
  vm.runInContext('mastShowMeCueHtml(it,"look","' + KEY + '",undefined)', ctx);
  ok("auto-say only for spoken cards", vm.runInContext('mastShowMeAutoSay("' + KEY + '")', ctx) === false && !spoken.length);
}

console.log("── look away → reveal ──");
{ const { ctx, renders } = mk(); ctx.it = it;
  let r = vm.runInContext('mastShowMeCueHtml(it,"look","' + KEY + '",undefined)', ctx);
  ok("first: the word big, NO tiles", r.tiles === false && /font-size:84px[^>]*>the</.test(r.html));
  ok("…with a 🙈 Look away button", /mastShowMeLookAway\('luc_the\|7',true\)/.test(r.html) && r.html.indexOf("Look away") >= 0);
  vm.runInContext('mastShowMeLookAway("' + KEY + '",true)', ctx);
  ok("tapping it re-renders", renders() === 1);
  r = vm.runInContext('mastShowMeCueHtml(it,"look","' + KEY + '",undefined)', ctx);
  ok("then: tiles show and the word is hidden", r.tiles === true && !/\bthe\b/.test(r.html.replace(/<[^>]*>/g, " ")));
  ok("…with a 👀 Look again button", /mastShowMeLookAway\('luc_the\|7',false\)/.test(r.html));
  vm.runInContext('mastShowMeLookAway("' + KEY + '",false)', ctx);
  ok("Look again brings the word back", vm.runInContext('mastShowMeCueHtml(it,"look","' + KEY + '",undefined)', ctx).tiles === false);
}

console.log("── shown (the old card) ──");
{ const { ctx } = mk(); ctx.it = it;
  const r = vm.runInContext('mastShowMeCueHtml(it,"shown","' + KEY + '",undefined)', ctx);
  ok("still prints \"Tap the <u>word</u>!\"", r.tiles === true && r.html.indexOf("Tap the <u>the</u>!") >= 0 && r.wrong === "Almost — find the the!");
  ok("quotes in a word are escaped in the onclick", vm.runInContext('mastShowMeCueHtml({prompt:"can\'t"},"spoken","k|1")', ctx).html.indexOf("mastSpeak('can\\'t')") >= 0);
}

console.log("── Mom's setting ──");
{ const { ctx, writes } = mk();
  vm.runInContext('mastSetShowMeCue("lucy","Sight Words","look")', ctx);
  ok("one targeted update of show_me_cue/<deck>", writes.length === 1 && writes[0].op === "update"
    && writes[0].p === "mastery/lucy_settings/show_me_cue" && JSON.stringify(writes[0].v) === '{"Sight Words":"look"}', writes);
  ok("local settings follow", vm.runInContext('mastShowMeCue("lucy","Sight Words")', ctx) === "look");
  vm.runInContext('mastSetShowMeCue("lucy","Sight Words","nope")', ctx);
  ok("a junk value writes nothing", writes.length === 1);
}
{ const { ctx, writes } = mk({ mom: false });
  vm.runInContext('mastSetShowMeCue("lucy","Sight Words","shown")', ctx);
  ok("not Mom → no change", writes.length === 0 && vm.runInContext('mastShowMeCue("lucy","Sight Words")', ctx) === "spoken");
}
{ const { ctx, writes } = mk({ dry: true });
  vm.runInContext('mastSetShowMeCue("lucy","Sight Words","look")', ctx);
  ok("?dryrun=1 → no Firebase write", writes.length === 0);
}

console.log("── wired into the drill ──");
{ const i = src.indexOf("const _smElig="), j = src.indexOf("if(!_smDone){", i), seg = src.slice(i, j);
  ok("the pick-3 card asks mastShowMeCueHtml for its cue", /mastShowMeCueHtml\(it,mastShowMeCue\(masteryKid,cat\),_smKey,_smState\)/.test(seg));
  ok("the tiles render only when the cue says so", /if\(_cue\.tiles\)\{/.test(seg));
  ok("no hard-coded \"Tap the <u>\" line left in the card", seg.indexOf("Tap the <u>") < 0);
  ok("the slideshow says the on-screen card's word", /h\+=mastSlideCardsHtml\[mastSlideIdx\];\s*\n\s*if\(slideList\[mastSlideIdx\]&&mastSlideIdx<_slBase\) mastShowMeAutoSay\(slideList\[mastSlideIdx\]\.id\+"\|"\+pn\)/.test(src));
  ok("the deck page carries the Mom control", src.indexOf("mastSetShowMeCue(\\''+kEsc+'\\',\\''+esc+'\\',\\''+m[0]+'\\')") >= 0);
  ok("no new speech path — only mastSpeak", BLOCK.indexOf("SpeechSynthesisUtterance") < 0);
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
