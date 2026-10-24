/*
 * Node tests — PATCCC: 👀 "Copy it", cover-copy-compare as a learning-pattern step (her research plan 2026-10-23).
 *   1 · "copy" is a pattern step: mstPatternClean keeps it, the editor cycles to it and labels it
 *   2 · Look → Cover/Copy → Compare render in order (model + 🔊 + Hide it; the box; both sides, misses marked)
 *   3 · right the first time grades good; wrong needs a correct retype (the fix) and grades again
 *   4 · Type-the-answer on: the fact is the prompt, the answer is copied, checked by the math normaliser
 *   5 · a card with no answer falls back to "rec"; picture/rule/spell cards keep their faces
 *   6 · the side-change rule (PATSIDE) still applies to a copy day
 *   7 · wiring: the hook lines
 * Runs the REAL code sliced from index.html.   run:  node test_pattern_ccc.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
function slice(name) { const i = src.indexOf("function " + name + "("); if (i < 0) throw new Error("missing " + name);
  let d = 0; for (let k = src.indexOf("{", i); k < src.length; k++) { if (src[k] === "{") d++; else if (src[k] === "}") { d--; if (!d) return src.slice(i, k + 1); } } }
function block(a, b) { const i = src.indexOf(a), j = src.indexOf(b); if (i < 0 || j < i) throw new Error("missing " + a); return src.slice(i, j); }
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x) : "")); } };

ok("PATCCC block present", src.indexOf("// PATCCC_START") > 0 && src.indexOf("// PATCCC_END") > src.indexOf("// PATCCC_START"));
const PATCCC = block("// PATCCC_START", "// PATCCC_END");
const TYPEANS = block("// MST_TYPEANS_START", "// MST_TYPEANS_END");
const MODES = src.slice(src.indexOf("const MST_PATTERN_MODES"), src.indexOf("\n", src.indexOf("const MST_PATTERN_MODES")) + 1);
const ENGINE = MODES + ["mstPatternClean", "mstPatternRepeatDay", "mstPatternMode", "mstNormAns", "mstTypedOk"].map(slice).join("\n");

function study(sessions) {
  const calls = [], timers = [];
  const ctx = { console, Object, Array, String, Number, JSON, Math, masteryKid: "lincoln", mstFlipped: false, mstTyped: "", mstChecked: null,
    mstState: { card: null }, mstSid: "ger", mstStartTs: 1, mstDone: null, mstKid: "lincoln", mstSaveErr: null,
    masteryData: { lincoln: [ { id: "lin_67", subject: "Math Facts", prompt: "6×7" }, { id: "lin_x", subject: "Math Facts", prompt: "6×13" } ], lincoln_settings: {} },
    MAST_MATH_ANS: { "6×7": "42" }, MAST_VOCAB_DEFS: { "der hund": "the dog", "die tür": "the door" }, unitStudies: {},
    mastGetDefAudio: () => "", ttsFlipAttrs: () => "", mastGetCatMode: (k, d) => d === "Spelling" ? "spell" : "quiz", mastCustomDef: () => "",
    mstCardPic: c => c && c.name === "Becher" ? "pic.png" : "", mstPicCardHtml: () => "<div class=pic></div>",
    mastSpeak: () => {}, mastPlayDefAudio: () => {}, mastGetVisual: () => "", mastCatFace: () => "name",
    document: { _els: {}, getElementById(id) { return this._els[id] || null; } },
    setTimeout: (f, ms) => { timers.push({ f, ms }); return timers.length; },
    _mastRe: () => { calls.push("re"); },
    mstCurrent: st => st && st.card || null, mstAnswer: (st, key, ans) => { calls.push("answer:" + key + ":" + ans); },
    mstPersist: () => {}, mstSave: () => { calls.push("save"); }, mstAutoPlayCurrent: () => {},
    mstSessions: () => sessions || [ { sid: "ger", name: "German", audio: "front" }, { sid: "facts", name: "Math Facts", audio: "off", typeAnswer: true } ],
    calls, timers };
  vm.createContext(ctx);
  vm.runInContext(ENGINE + "\n" + ["mastGetDef", "mstEsc", "mstEscJs", "mstItemAnswer", "mstCardDef", "mstCardMode", "mstIsRuleCard", "mstIsSpellCard", "mstFlipBtn", "mstAudioBtn", "mstCardHtml", "mstTap"].map(slice).join("\n") + TYPEANS + PATCCC, ctx);
  const navA = src.indexOf("// MST_NAV_START"), navB = src.indexOf("// MST_NAV_END");
  vm.runInContext(src.slice(navA, navB) + "\nmstNow=function(){ return 1e12; };\nif(typeof mstSerialize!==\"function\") mstSerialize=function(s){ return JSON.parse(JSON.stringify(s)); };", ctx);
  return ctx;
}
const GER = { key: "l:lin_h", kind: "learning", deck: "German", name: "der Hund", mode: "copy" };
const TUER = { key: "l:lin_t", kind: "learning", deck: "German", name: "die Tür", mode: "copy" };
const FACT = { key: "l:lin_67", kind: "learning", id: "lin_67", deck: "Math Facts", name: "6×7", mode: "copy" };
const NOANS = { key: "l:lin_n", kind: "learning", deck: "German", name: "das Ding", mode: "copy" };
const SG = { sid: "ger", name: "German", audio: "front" }, SF = { sid: "facts", name: "Math Facts", audio: "off", typeAnswer: true };
const txt = h => h.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ");
const stage = h => (h.match(/data-copy-stage="([a-z]+)"/) || [])[1];

// ── 1 · a pattern step ──────────────────────────────────────────────────────────────
console.log("── 1 · \"copy\" is a pattern step ──");
{
  const ctx = study(); const run = c => vm.runInContext(c, ctx);
  ok("MST_PATTERN_MODES has copy (pushed by the block)", run("MST_PATTERN_MODES.join()") === "rec,say,type,copy");
  ok("mstPatternClean keeps copy", run('JSON.stringify(mstPatternClean(["rec","copy","type","bogus"]))') === '["rec","copy","type"]');
  ok("a copy-only pattern is a pattern", run('JSON.stringify(mstPatternClean(["copy"]))') === '["copy"]');
  ok("mstPatternMode picks copy on its day", run('mstPatternMode(["rec","copy","type"],1,3)') === "copy");
  // the editor: the cycle button walks into copy and back to see-it; the label is there
  const ectx = { MST_PATTERN_MODES: null, mhqSessForm: { pattern: ["type", "copy"] }, renderAll: () => {} };
  vm.createContext(ectx); vm.runInContext(MODES.replace("const ", "var ") + 'MST_PATTERN_MODES.push("copy");\n' + slice("mhqPatCycle"), ectx);
  vm.runInContext("mhqPatCycle(0); mhqPatCycle(1)", ectx);
  ok("editor: Type it → Copy it, Copy it → See it", JSON.stringify(ectx.mhqSessForm.pattern) === '["copy","rec"]', ectx.mhqSessForm.pattern);
  ok("editor: the label 👀 Copy it", src.indexOf('      _pl.copy = "\\u{1F440} Copy it";   // 👀 PATCCC') > 0);
}

// ── 2 · stages in order ─────────────────────────────────────────────────────────────
console.log("── 2 · Look → Cover/Copy → Compare ──");
{
  const ctx = study(); const run = c => vm.runInContext(c, ctx);
  ctx.mstState.card = GER;
  const h1 = run("mstCardHtml(" + JSON.stringify(SG) + "," + JSON.stringify(GER) + ")");
  ok("look: the stage is look", stage(h1) === "look", stage(h1));
  ok("look: the prompt (definition) and the answer (German) show together", /the dog/.test(h1) && /id="mst-copy-model"[^>]*>der Hund</.test(h1));
  ok("look: 🔊 hear-it and a Hide it button, no box", /mastSpeak\('der Hund'\)/.test(h1) && /mstCopyHide\(\)/.test(h1) && /Hide it/.test(h1) && !/<input/.test(h1));
  ok("look: the chip says 👀 Copy it", /👀 Copy it|\u{1F440} Copy it/u.test(txt(h1)));
  ok("look: a 4-second timer is set once", ctx.timers.length === 1 && ctx.timers[0].ms === 4000);
  run("mstCardHtml(" + JSON.stringify(SG) + "," + JSON.stringify(GER) + ")");
  ok("…a repaint doesn't set a second one", ctx.timers.length === 1);
  // the timer only hides while the model is on screen
  ctx.timers[0].f();
  ok("timer with the model off screen: nothing happens", run("mstCopy.stage") === "look");
  ctx.document._els["mst-copy-model"] = {};
  ctx.timers[0].f();
  ok("timer with the model on screen: it hides by itself (cover)", run("mstCopy.stage") === "copy" && ctx.calls.includes("re"));
  const h2 = run("mstCardHtml(" + JSON.stringify(SG) + "," + JSON.stringify(GER) + ")");
  ok("cover: the answer is gone, the prompt stays, a box with an id appears", stage(h2) === "copy" && !/der Hund/.test(txt(h2).replace("mastSpeak", "")) && /the dog/.test(h2) && /<input id="mst-copy-in"/.test(h2) && /mstCopyCheck\(\)/.test(h2));
  ok("cover: no 🔊 (it would say the answer)", !/mastSpeak/.test(h2));
  run('mstCopy.typed="der Hunt"');
  const h3 = run("mstCardHtml(" + JSON.stringify(SG) + "," + JSON.stringify(GER) + ")");
  ok("copy: what he's typed stays in the box", /id="mst-copy-in"[^>]*value="der Hunt"/.test(h3));
  ctx.document._els["mst-copy-in"] = { value: "der Hunt" };
  run("mstCopyCheck()");
  const h4 = run("mstCardHtml(" + JSON.stringify(SG) + "," + JSON.stringify(GER) + ")");
  ok("compare: both sides show, labelled", /You typed/.test(h4) && /The answer/.test(h4) && stage(h4) === "fix");
  ok("compare: only the differing letter is marked (t vs d)", (h4.match(/class="mst-copy-miss"/g) || []).length === 2 && /mst-copy-typed">der Hun<span class="mst-copy-miss"[^>]*>t<\/span>/.test(h4) && /mst-copy-right"[^>]*>der Hun<span class="mst-copy-miss"[^>]*>d<\/span>/.test(h4));
}
{
  const ctx = study(); const run = c => vm.runInContext(c, ctx);
  ctx.mstState.card = GER;
  run("mstCardHtml(" + JSON.stringify(SG) + "," + JSON.stringify(GER) + ")");
  run("mstCopyHide()");
  ok("Hide it hides at once", run("mstCopy.stage") === "copy");
  run('mstCopyCheck()');
  ok("an empty box doesn't check", run("mstCopy.stage") === "copy");
  const d = vm.runInContext('mstCopyDiff("dr Hund","der Hund")', ctx);
  ok("diff: a missing letter is marked on the answer side only", d.ka.every(Boolean) && d.kb.filter(x => !x).length === 1 && d.kb[1] === false);
}

// ── 3 · grading ─────────────────────────────────────────────────────────────────────
console.log("── 3 · right first time → good; wrong → fix → again ──");
{
  const ctx = study(); const run = c => vm.runInContext(c, ctx);
  ctx.mstState.card = TUER;
  run("mstCardHtml(" + JSON.stringify(SG) + "," + JSON.stringify(TUER) + "); mstCopyHide()");
  ctx.document._els["mst-copy-in"] = { value: "Die Tuer" };   // umlaut spelled out + case: the type step's rules
  run("mstCopyCheck()");
  const h = run("mstCardHtml(" + JSON.stringify(SG) + "," + JSON.stringify(TUER) + ")");
  ok("Die Tuer for die Tür is right (mstTypedOk umlaut rule)", run("mstCopy.ok") === true && stage(h) === "compare");
  ok("✓ and no marks, no fix box", /✓|✓/.test(h) && !/mst-copy-miss/.test(h) && !/mst-copy-fix/.test(h));
  const m = h.match(/onclick="(mstTap\('[a-z]+'\))"/);
  ok("Next grades good", !!m && m[1] === "mstTap('good')", m && m[1]);
  run(m[1]);
  ok("…through the real mstTap", ctx.calls.includes("answer:l:lin_t:good"));
}
{
  const ctx = study(); const run = c => vm.runInContext(c, ctx);
  ctx.mstState.card = GER;
  run("mstCardHtml(" + JSON.stringify(SG) + "," + JSON.stringify(GER) + "); mstCopyHide()");
  ctx.document._els["mst-copy-in"] = { value: "das Hund" };
  run("mstCopyCheck()");
  let h = run("mstCardHtml(" + JSON.stringify(SG) + "," + JSON.stringify(GER) + ")");
  ok("wrong: ✗ Not quite, the fix box, no Next yet", /Not quite/.test(h) && /<input id="mst-copy-fix"/.test(h) && !/mstTap\(/.test(h) && /Fix it/.test(h));
  ok("wrong: the right answer stays in view while he fixes it", /mst-copy-right/.test(h) && /Hund/.test(h));
  const fx = { value: "das Hund" }; ctx.document._els["mst-copy-fix"] = fx;
  run("mstCopyFixCheck()");
  h = run("mstCardHtml(" + JSON.stringify(SG) + "," + JSON.stringify(GER) + ")");
  ok("a wrong retype doesn't count: still no Next, box cleared, a nudge", !/mstTap\(/.test(h) && fx.value === "" && /Not yet/.test(h) && run("mstCopy.fixed") === false);
  fx.value = "der Hund";
  run("mstCopyFixCheck()");
  h = run("mstCardHtml(" + JSON.stringify(SG) + "," + JSON.stringify(GER) + ")");
  const m = h.match(/onclick="(mstTap\('[a-z]+'\))"/);
  ok("a correct retype → Fixed, and Next grades again", /Fixed/.test(h) && !!m && m[1] === "mstTap('again')", m && m[1]);
  run(m[1]);
  ok("…through the real mstTap", ctx.calls.includes("answer:l:lin_h:again"));
  const h2 = run("mstCardHtml(" + JSON.stringify(SG) + "," + JSON.stringify(GER) + ")");
  ok("when the card comes back it starts at Look again", stage(h2) === "look");
}

// ── 4 · Type-the-answer direction ──────────────────────────────────────────────────
console.log("── 4 · Type the answer on → copy the answer from the fact ──");
{
  const ctx = study(); ctx.mstSid = "facts"; const run = c => vm.runInContext(c, ctx);
  ctx.mstState.card = FACT;
  const h = run("mstCardHtml(" + JSON.stringify(SF) + "," + JSON.stringify(FACT) + ")");
  ok("the copy face wins over the plain Type-the-answer face", stage(h) === "look" && !/mst-typeans-in/.test(h));
  ok("the fact is the prompt, 42 is the model", /mast-slide-name">6×7</.test(h) && /id="mst-copy-model"[^>]*>42</.test(h));
  run("mstCopyHide()");
  ctx.document._els["mst-copy-in"] = { value: " = 42.0 " };
  run("mstCopyCheck()");
  ok("' = 42.0 ' is right (mstTypeAnsOk normalising)", run("mstCopy.ok") === true);
  ok("plain German session, same fact → no math direction (the definition would be the prompt)", vm.runInContext('mstCopySides({sid:"x"},' + JSON.stringify(FACT) + ').math', ctx) === false);
}

// ── 5 · fallbacks ───────────────────────────────────────────────────────────────────
console.log("── 5 · no answer → rec; picture / rule / spell cards keep their faces ──");
{
  const ctx = study(); const run = c => vm.runInContext(c, ctx);
  ok("no answer: mstCardMode is rec", run("mstCardMode(" + JSON.stringify(NOANS) + ")") === "rec");
  const h = run("mstCardHtml(" + JSON.stringify(SG) + "," + JSON.stringify(NOANS) + ")");
  ok("no answer: the normal flip card", /mast-flip-back/.test(h) && !/data-copy-stage/.test(h));
  ok("no answer: mstCopyOn is false (so the ✓/✗ buttons show)", run("mstCopyOn(" + JSON.stringify(SG) + "," + JSON.stringify(NOANS) + ")") === false);
  const PIC = { key: "l:b", kind: "learning", deck: "German", name: "Becher", mode: "copy" };
  run('MAST_VOCAB_DEFS["becher"]="beaker"');
  ok("picture card: its picture face, mstCopyOn false", run("mstCardHtml(" + JSON.stringify(SG) + "," + JSON.stringify(PIC) + ")") === "<div class=pic></div>" && run("mstCopyOn(" + JSON.stringify(SG) + "," + JSON.stringify(PIC) + ")") === false);
  const SP = { key: "l:s", kind: "learning", deck: "Spelling", name: "der Hund", mode: "copy" };
  ok("spell card: its spell face, mstCopyOn false", /spell it out loud/.test(run("mstCardHtml(" + JSON.stringify(SG) + "," + JSON.stringify(SP) + ")")) && run("mstCopyOn(" + JSON.stringify(SG) + "," + JSON.stringify(SP) + ")") === false);
}

// ── 6 · side-change rule ────────────────────────────────────────────────────────────
console.log("── 6 · PATSIDE still applies on a copy day ──");
{
  const ctx = { console, Object, Array, String, Number, JSON, Math, MST_SESSION_DEFAULTS: { passes: 3 } };
  vm.createContext(ctx);
  vm.runInContext(ENGINE + 'MST_PATTERN_MODES.push("copy");\n' + slice("mstSittingInit"), ctx);
  const ses = { pattern: ["rec", "copy", "copy"], passes: 3 };
  const pile = { reviews: [], newNames: [{ deck: "German", name: "der Hund" }],
    learning: [ { id: "a", subject: "German", prompt: "die Tür", tally_dots: 1 }, { id: "b", subject: "German", prompt: "das Haus", tally_dots: 2 } ] };
  const st = vm.runInContext("mstSittingInit(" + JSON.stringify(pile) + "," + JSON.stringify(ses) + ",{dotsNeeded:()=>3})", ctx);
  ok("day 1 (see it): rec, the full 3", st.cards["n:German|der Hund"].mode === "rec" && st.cards["n:German|der Hund"].passes == null);
  ok("day 2 (copy, a new side): copy, the full 3", st.cards["l:a"].mode === "copy" && st.cards["l:a"].passes == null && st.passes === 3);
  ok("day 3 (copy again, a repeat): copy, 1 right is enough", st.cards["l:b"].mode === "copy" && st.cards["l:b"].passes === 1);
}

// ── 7 · wiring ──────────────────────────────────────────────────────────────────────
console.log("── 7 · wiring ──");
{
  const s = slice("mstCardHtml");
  const c = s.indexOf('if(typeof mstCopyOn==="function"&&mstCopyOn(session,card)) return mstCopyHtml(session,card,def,_lrn);');
  ok("mstCardHtml: the copy face after picture/rule/spell, ahead of Type the answer and the say/type steps",
    c > s.indexOf("mstPicCardHtml") && c > s.indexOf("mstIsSpellCard(card)") && c < s.indexOf("mstTypeAnsOn(session,card,def)") && c < s.indexOf('mode==="say"'));
  const r = slice("renderMastStudy");
  ok("renderMastStudy: no ✓/✗ under a copy card", /if\(typeof mstCopyOn==="function"&&mstCopyOn\(session,card\)\)\{ \/\* 👀 PATCCC: Check \/ Next live inside the card \*\/ \} else\n\s+if\(mstCardMode\(card\)==="type"/.test(r));
  ok("the steps list is pushed from the block, the array literal untouched", /const MST_PATTERN_MODES = \["rec", "say", "type"\];/.test(src) && PATCCC.indexOf('MST_PATTERN_MODES.push("copy");') > 0);
  ok("the boxes have ids, each once in index.html", src.split('"mst-copy-in"').length - 1 >= 1 && /box\("mst-copy-in"/.test(PATCCC) && /box\("mst-copy-fix"/.test(PATCCC) && /'<input id="'\+id\+'"/.test(PATCCC));
  ok("no database writes in the block", !/\.ref\(|\.set\(|\.update\(|firebase/i.test(PATCCC));
  ok("no 🔀 in index.html", src.indexOf("🔀") === -1);
}
console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
