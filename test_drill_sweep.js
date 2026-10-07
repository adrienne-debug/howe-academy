/*
 * Node tests — DRILLSWEEP: the Mastery drill card bug sweep (her ask 2026-10-07).
 *   1 · a flip belongs to ONE card — Log start / kid switch / another card never opens on the answer side
 *   2 · "Show me" pick-3 always offers two DIFFERENT wrong tiles (decks of 3, same-name twins)
 *   3 · bank rules (custom_items def / ch) read when Firebase hands the list back as an object
 *   4 · a NEW study card (from the bank, no id yet) shows the bank's rule/answer on its back
 *   5 · Save Results counts only cards still in today's drill — a card that left mid-session can't block Save
 * Runs the REAL code sliced from index.html.   run:  node test_drill_sweep.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const cut = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error("markers " + a); return src.slice(i, j); };
function slice(name) { const i = src.indexOf("function " + name + "("); if (i < 0) throw new Error("missing " + name);
  let d = 0; for (let k = src.indexOf("{", i); k < src.length; k++) { if (src[k] === "{") d++; else if (src[k] === "}") { d--; if (!d) return src.slice(i, k + 1); } } }
const BLOCK = cut("// DRILLSWEEP_START", "// DRILLSWEEP_END");

let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x) : "")); } };

function mk(extra) {
  const ctx = Object.assign({ console, JSON, Object, String, Array, renders: 0 }, extra || {});
  ctx._mastRe = () => { ctx.renders++; };
  vm.createContext(ctx);
  vm.runInContext("var mastFlipped=false;\n" + slice("mastFlip") + "\n" + slice("_smHash") + "\n" + BLOCK, ctx);
  return ctx;
}
const run = (ctx, code) => vm.runInContext(code, ctx);

console.log("── 1 · the flip belongs to one card ──");
{ const ctx = mk();
  // practice: card 3 on screen, the kid flips it
  run(ctx, 'mastFlipSync(mastSlideKey("lincoln",false,2,{id:"lin_brave"})); mastFlip();');
  ok("the flipped card stays flipped on a re-render", run(ctx, 'mastFlipSync(mastSlideKey("lincoln",false,2,{id:"lin_brave"}))') === true);
  // Mom taps Log → card 1 of the log
  ok("Log's first card opens on its FRONT", run(ctx, 'mastFlipSync(mastSlideKey("lincoln",true,0,{id:"lin_calm"}))') === false);
  ok("…and stays front after", run(ctx, "mastFlipped") === false);
}
{ const ctx = mk();
  run(ctx, 'mastFlipSync(mastSlideKey("lincoln",false,0,{id:"lin_brave"})); mastFlip();');
  ok("the same position, same card, Log mode → front (practice flip doesn't carry into the graded drill)",
    run(ctx, 'mastFlipSync(mastSlideKey("lincoln",true,0,{id:"lin_brave"}))') === false);
}
{ const ctx = mk();
  run(ctx, 'mastFlipSync(mastSlideKey("lincoln",false,0,{id:"lin_brave"})); mastFlip();');
  ok("switching kids → the other kid's card 1 opens on its front", run(ctx, 'mastFlipSync(mastSlideKey("ellis",false,0,{id:"ell_root"}))') === false);
}
{ const ctx = mk();
  run(ctx, 'mastFlipSync(mastSlideKey("lucy",false,0,{id:"a"})); mastFlip();');
  ok("a different card at the same spot (the deck changed under it) → front", run(ctx, 'mastFlipSync(mastSlideKey("lucy",false,0,{id:"b"}))') === false);
  run(ctx, "mastFlip();");
  ok("flipping the new card works", run(ctx, 'mastFlipSync(mastSlideKey("lucy",false,0,{id:"b"}))') === true);
  run(ctx, "mastFlip();");
  ok("…and flips back", run(ctx, "mastFlipped") === false);
}
{ // the render syncs BEFORE any card is built
  const i = src.indexOf("mastFlipSync(mastSlideKey(masteryKid,mastLogMode,mastSlideIdx,slideList[mastSlideIdx]))");
  const j = src.indexOf("mastSlideCardsHtml=slideList.map(");
  const k = src.indexOf("const buildSlideCard=(it,secondLook)=>{");
  ok("the drill render syncs the flip before building the cards", i > 0 && j > 0 && i < k && i < j);
}

console.log("── 2 · Show me: two different wrong tiles ──");
function smCtx() {
  return mk({ _smTileVis: x => x && x.prompt ? "<b>" + x.prompt + "</b>" : null });
}
{ const ctx = smCtx();
  // a 3-card deck: the target + exactly two others — every seed must give both of them
  let allTwo = true, bad = null;
  for (let n = 0; n < 300; n++) {
    ctx.it = { id: "jul_sq" + n, prompt: "Square", subject: "Shapes" };
    ctx.items = [ctx.it, { id: "jul_ci", prompt: "Circle", subject: "Shapes" }, { id: "jul_tr", prompt: "Triangle", subject: "Shapes" }];
    const t = run(ctx, "mastShowMeTiles(it,items," + (n % 40 + 1) + ")");
    const ids = new Set(t.map(x => x.id));
    if (ids.size !== 3 || !t.some(x => x.id === ctx.it.id)) { allTwo = false; bad = t.map(x => x.id); break; }
  }
  ok("a deck of 3 always shows 3 different tiles (target + both others)", allTwo, bad);
}
{ const ctx = smCtx();
  ctx.it = { id: "ger_hund", prompt: "der Hund", subject: "German" };
  ctx.items = [ctx.it,
    { id: "ger_katze", prompt: "die Katze", subject: "German" }, { id: "ger_katze_p", prompt: "die Katze", subject: "German", dir: "prod" },
    { id: "ger_maus", prompt: "die Maus", subject: "German" }];
  let fine = true, bad = null;
  for (let n = 1; n <= 200; n++) {
    ctx.it.id = "ger_hund" + n;
    const t = run(ctx, "mastShowMeTiles(it,items," + n + ")");
    if (new Set(t.map(x => x.prompt)).size !== 3) { fine = false; bad = t.map(x => x.prompt); break; }
  }
  ok("same-name twins never draw two identical tiles", fine, bad);
}
{ const ctx = smCtx();
  ctx.it = { id: "a", prompt: "A", subject: "Letters" };
  ctx.items = [ctx.it, { id: "b", prompt: "B", subject: "Letters" }, { id: "b2", prompt: "B", subject: "Letters" }, { id: "c", prompt: "C", subject: "Numbers" }];
  ok("not enough DIFFERENT pictures in the deck → plain card (null)", run(ctx, "mastShowMeTiles(it,items,5)") === null);
  ctx.items = [ctx.it, { id: "a2", prompt: "A", subject: "Letters" }, { id: "b", prompt: "B", subject: "Letters" }];
  ok("a twin of the TARGET is never a wrong tile", run(ctx, "mastShowMeTiles(it,items,5)") === null);
}
{ const ctx = smCtx();
  ctx.it = { id: "jul_hex", prompt: "Hexagon", subject: "Shapes" };
  ctx.items = [ctx.it].concat(["Circle", "Square", "Triangle", "Star", "Heart"].map(p => ({ id: "jul_" + p, prompt: p, subject: "Shapes" })));
  const a = run(ctx, "JSON.stringify(mastShowMeTiles(it,items,12).map(x=>x.id))"), b = run(ctx, "JSON.stringify(mastShowMeTiles(it,items,12).map(x=>x.id))");
  ok("same card + same print number → same tiles in the same order (no reshuffle on re-render)", a === b);
  // a bigger deck keeps the old pick (only the collision cases changed)
  const seed = run(ctx, '_smHash("jul_hex|12")'), pool = ctx.items.slice(1);
  const d1 = pool[seed % pool.length]; let d2 = pool[(seed + 1 + (seed % 7)) % pool.length]; if (d2.id === d1.id) d2 = pool[(seed + 2) % pool.length];
  const old = [ctx.it, d1, d2], rot = seed % 3, oldOrder = old.slice(rot).concat(old.slice(0, rot)).map(x => x.id);
  ok("a deck with no duplicates picks exactly what it picked before", a === JSON.stringify(oldOrder), [a, oldOrder]);
}
ok("the render uses mastShowMeTiles (old inline pool gone)", src.indexOf("const _smTiles=mastShowMeTiles(it,items,pn)") > 0 && src.indexOf("} else if(_pool.length>=2){") < 0);

console.log("── 3 · bank rules when custom_items comes back as an object ──");
{ const ctx = { console, Object, Array, Number, String, masteryData: {} };
  vm.createContext(ctx);
  vm.runInContext(slice("mastCustomDef") + "\n" + slice("mastCustomCh"), ctx);
  const entry = { cat: "Capitalization", name: "We saw <u>E.T.</u> today.", def: "Capitalize the title of a movie.", ch: 3 };
  ctx.masteryData.lincoln_custom_items = [null, entry];
  ok("array form: rule found", run(ctx, 'mastCustomDef("lincoln","Capitalization","We saw <u>E.T.</u> today.")') === entry.def);
  ctx.masteryData.lincoln_custom_items = { "0": { cat: "Vocabulary", name: "brave" }, "5": entry };
  ok("object form (Firebase sparse list): rule found", run(ctx, 'mastCustomDef("lincoln","Capitalization","We saw <u>E.T.</u> today.")') === entry.def);
  ok("object form: chapter gate found", run(ctx, 'mastCustomCh("lincoln","Capitalization","We saw <u>E.T.</u> today.")') === 3);
  ok("missing list → empty / null, no throw", run(ctx, 'mastCustomDef("ellis","X","y")') === "" && run(ctx, 'mastCustomCh("ellis","X","y")') === null);
  ok("not in the bank → empty", run(ctx, 'mastCustomDef("lincoln","Capitalization","nope")') === "");
}

console.log("── 4 · a NEW study card shows the bank's rule ──");
{ const ctx = { console, Object, Array, Number, String, masteryKid: "lincoln", mstFlipped: true,
    masteryData: { lincoln: [{ id: "lin_brave", subject: "Vocabulary", prompt: "brave", answer: "ready to face danger" }],
      lincoln_settings: { definitions: { calm: "peaceful" } },
      lincoln_custom_items: { "3": { cat: "Capitalization", name: "We saw <u>E.T.</u> today.", def: "Capitalize the title of a movie." } } },
    MAST_MATH_ANS: {}, MAST_VOCAB_DEFS: {},
    mastGetDefAudio: () => "", ttsFlipAttrs: () => "" };
  vm.createContext(ctx);
  vm.runInContext(["mastGetDef", "mastCustomDef", "mstEsc", "mstEscJs", "mstItemAnswer", "mstCardDef", "mstCardMode", "mstIsRuleCard", "mstIsSpellCard", "mstFlipBtn", "mstAudioBtn", "mstCardHtml"].map(slice).join("\n")
    + "\nfunction mastGetCatMode(){ return 'flip'; }", ctx);
  const back = h => (h.split('mast-flip-back')[1] || "");
  const newRule = run(ctx, 'mstCardHtml({name:"Study"},{key:"n:x",kind:"new",deck:"Capitalization",name:"We saw <u>E.T.</u> today."})');
  ok("new Capitalization card: the rule is on the back", back(newRule).indexOf("Capitalize the title of a movie.") >= 0, back(newRule).slice(0, 200));
  ok("…not 'no rule yet'", back(newRule).indexOf("no rule yet") < 0);
  ok("…and the rule is NOT on the front", newRule.split('mast-flip-back')[0].indexOf("Capitalize the title") < 0);
  const oldCard = run(ctx, 'mstCardHtml({name:"Study"},{key:"r:lin_brave",kind:"review",id:"lin_brave",deck:"Vocabulary",name:"brave"})');
  ok("an existing card still reads its own answer", back(oldCard).indexOf("ready to face danger") >= 0);
  const mapCard = run(ctx, 'mstCardHtml({name:"Study"},{key:"n:calm",kind:"new",deck:"Vocabulary",name:"calm"})');
  ok("a new card with no bank def still uses the definitions map", back(mapCard).indexOf("peaceful") >= 0);
  ok("say/type cards count the bank def as a meaning", run(ctx, 'mstCardMode({kind:"new",deck:"Capitalization",name:"We saw <u>E.T.</u> today.",mode:"say"})') === "say"
    && run(ctx, 'mstCardMode({kind:"new",deck:"Vocabulary",name:"nothing",mode:"say"})') === "rec");
}

console.log("── 5 · Save counts only today's cards ──");
{ const ctx = mk();
  ctx.due = [{ id: "a" }, { id: "b" }, { id: "c" }];
  ok("all three scored → 3", run(ctx, 'mastLogScoredCount(due,{a:"c",b:"m",c:"shown"})') === 3);
  ok("a stray score for a card that left the drill doesn't count", run(ctx, 'mastLogScoredCount(due,{a:"c",b:"m",c:"~",gone:"c"})') === 3);
  ok("…so Save can still turn on (scored === due)", run(ctx, 'mastLogScoredCount(due,{a:"c",b:"m",c:"~",gone:"c"})===due.length') === true);
  ok("one left to mark → 2", run(ctx, 'mastLogScoredCount(due,{a:"c",gone:"m",b:"c"})') === 2);
  ok("empty → 0, no throw", run(ctx, "mastLogScoredCount([],{})") === 0 && run(ctx, "mastLogScoredCount(null,null)") === 0);
  ok("the Save bar uses it", src.indexOf("const scored=mastLogScoredCount(due,mastLogScores);") > 0);
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
