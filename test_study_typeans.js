/*
 * Node tests — MST_TYPEANS: "Type the answer" (her ask 2026-10-13, DeWalt family, math-facts study
 * sessions). A switch Mom flips in the session form, default OFF; on, the kid types the answer to the
 * fact and the app checks it against mstCardDef(card).
 *   1 · the field round-trips through mstSessions and mhqSessSave (deck, mix, all kinds); absent = off
 *   2 · the normaliser: " 12 ", −3 vs -3, 1/2 vs ½, 6×7 vs 6 x 7, 0.333... vs 0.333…, 4.0 vs 4
 *   3 · the card shows an input only when the flag is on; a card with no answer flips as before
 *   4 · a wrong answer grades 'again', a right one 'good', through the real mstTap
 *   5 · wiring: the form pill, the grade buttons hide, the face is chosen after picture/rule/spell cards
 * Runs the REAL code sliced from index.html.   run:  node test_study_typeans.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
function slice(name) { const i = src.indexOf("function " + name + "("); if (i < 0) throw new Error("missing " + name);
  let d = 0; for (let k = src.indexOf("{", i); k < src.length; k++) { if (src[k] === "{") d++; else if (src[k] === "}") { d--; if (!d) return src.slice(i, k + 1); } } }
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x) : "")); } };

const a = src.indexOf("// MST_TYPEANS_START"), b = src.indexOf("// MST_TYPEANS_END");
ok("MST_TYPEANS block present", a > 0 && b > a);
const BLOCK = src.slice(a, b);

// ── 1 · the session field ───────────────────────────────────────────────────────────
console.log("── 1 · typeAnswer round-trips through mstSessions and mhqSessSave ──");
{
  const ctx = { console, Object, Array, String, Number, JSON, masteryKid: "lincoln", mhqKid: "lincoln",
    masteryData: { lincoln_sessions: {
      facts: { name: "Math Facts", kind: "deck", decks: ["Math Facts"], typeAnswer: true },
      vocab: { name: "Words", kind: "deck", decks: ["Vocabulary"] } } },
    MST_SESSION_DEFAULTS: { who: "solo", newPerDay: 5, passes: 2, mixInAt: "weekly", handOffAt: "bi_weekly", kind: "deck", audio: "front", order: "bank", maxCards: 0, focusDecks: 0 },
    mstPatternClean: p => Array.isArray(p) && p.length ? p : null, mstHowtoClean: s => String(s || "").trim(),
    mastFullBank: () => ({}), mhqSessValidate: () => ({ ok: true }), mastDrillSettings: () => ({ ladder: [] }),
    _mhqSlug: (n, k) => String(n).toLowerCase().replace(/[^a-z0-9]+/g, "_"), renderAll: () => {}, HA_LS: { setItem: () => {}, getItem: () => null },
    mhqSessEdit: null, mhqSessForm: null, mhqSessErr: "" };
  vm.createContext(ctx);
  vm.runInContext(["mstSessions", "mhqSessOpen", "mhqSessClose", "mhqSessSet", "mhqSessSave"].map(slice).join("\n"), ctx);
  const run = c => vm.runInContext(c, ctx);
  const ses = run('mstSessions("lincoln")');
  ok("mstSessions carries typeAnswer:true", ses.find(s => s.sid === "facts").typeAnswer === true);
  ok("absent in the record → false (default off)", ses.find(s => s.sid === "vocab").typeAnswer === false);
  run('mhqSessOpen("facts")');
  ok("the form opens with the switch On", run("mhqSessForm.typeAnswer") === true);
  run('mhqSessSet("typeAnswer", false); mhqSessSave()');
  ok("Off → the saved record has no typeAnswer key", !("typeAnswer" in ctx.masteryData.lincoln_sessions.facts), ctx.masteryData.lincoln_sessions.facts);
  run('mhqSessOpen("facts"); mhqSessSet("typeAnswer", true); mhqSessSave()');
  ok("On → the saved deck record carries typeAnswer:true", ctx.masteryData.lincoln_sessions.facts.typeAnswer === true);
  ok("…and nothing else about it changed", ctx.masteryData.lincoln_sessions.facts.kind === "deck" && JSON.stringify(ctx.masteryData.lincoln_sessions.facts.decks) === '["Math Facts"]');
  run('mhqSessOpen("__new_deck"); mhqSessSet("name", "Plain Deck"); mhqSessSave()');
  ok("a new deck session is Off unless Mom flips it", !("typeAnswer" in ctx.masteryData.lincoln_sessions.plain_deck));
  run('mhqSessOpen("__new_mix"); mhqSessSet("typeAnswer", true); mhqSessSave()');
  ok("a mix session keeps it too (other kinds)", ctx.masteryData.lincoln_sessions.daily_mix.typeAnswer === true);
  run('mhqSessOpen("__new_all"); mhqSessSet("typeAnswer", true); mhqSessSave()');
  ok("a Daily Study (all) session keeps it", ctx.masteryData.lincoln_sessions.daily_study.typeAnswer === true);
  ok("mstSessions reads every one back", run('mstSessions("lincoln")').filter(s => s.typeAnswer).map(s => s.sid).sort().join() === "daily_mix,daily_study,facts");
}

// ── 2 · the normaliser ──────────────────────────────────────────────────────────────
console.log("── 2 · number-aware normaliser ──");
{
  const ctx = { console, Object, Array, String, Number };
  vm.createContext(ctx);
  vm.runInContext(BLOCK, ctx);   // the normaliser needs nothing outside the block
  const N = s => vm.runInContext("mstNormMath(" + JSON.stringify(s) + ")", ctx);
  const OK = (t, a) => vm.runInContext("mstTypeAnsOk(" + JSON.stringify(t) + "," + JSON.stringify(a) + ")", ctx);
  ok('" 12 " trims to "12"', N(" 12 ") === "12" && OK(" 12 ", "12"));
  ok("−3 (unicode minus) is -3, and - 3", OK("-3", "−3") && OK("- 3", "−3") && N("−9") === "-9");
  ok("1/2 is ½, and 1 1/2 is 1½", OK("1/2", "½") && OK("1 1/2", "1½") && N("½") === "1/2");
  ok("6×7 is 6 x 7, 6*7, 6 X 7", OK("6 x 7", "6×7") && OK("6*7", "6×7") && OK("6 X 7", "6×7"));
  ok("12÷4 is 12/4, 12 / 4", OK("12/4", "12÷4") && OK("12 / 4", "12÷4"));
  ok("0.333... is 0.333…", OK("0.333...", "0.333…") && OK("0.333…", "0.333…"));
  ok("4.0 and 04 are 4; 1,000 is 1000", OK("4.0", "4") && OK("04", "4") && OK("1,000", "1000"));
  ok("an = in front doesn't count", OK("=42", "42") && OK("= 42", "42"));
  ok("case doesn't count on a word answer", OK("Ready To Face Danger", "ready to face danger"));
  ok("wrong is wrong: 41 ≠ 42, 1/3 ≠ 1/2, empty ≠ anything", !OK("41", "42") && !OK("1/3", "½") && !OK("", "42") && !OK("   ", "42") && !OK("42", ""));
  ok("a word with an x in it keeps its spaces", N("fox and hen") === "fox and hen");
}

// ── 3 + 4 · the card face and the grade ─────────────────────────────────────────────
console.log("── 3 · the card shows an input only when the flag is on ──");
function study() {
  const calls = [];
  const ctx = { console, Object, Array, String, Number, JSON, masteryKid: "lincoln", mstFlipped: false, mstTyped: "", mstChecked: null,
    mstState: { q: 1 }, mstSid: "facts", mstStartTs: 1, mstDone: null, mstKid: "lincoln", mstSaveErr: null,
    masteryData: { lincoln: [ { id: "lin_67", subject: "Math Facts", prompt: "6×7" }, { id: "lin_x", subject: "Math Facts", prompt: "6×13" } ], lincoln_settings: {} },
    MAST_MATH_ANS: { "6×7": "42" }, MAST_VOCAB_DEFS: {}, unitStudies: {},
    mastGetDefAudio: () => "", ttsFlipAttrs: () => "", mastGetCatMode: () => "quiz", mastCustomDef: () => "", mstCardPic: () => "",
    mastSpeak: () => {}, mastPlayDefAudio: () => {}, mastGetVisual: () => "", mastCatFace: () => "name",
    document: { getElementById: () => null }, _mastRe: () => { calls.push("re"); },
    mstCurrent: st => st && st.card || null, mstAnswer: (st, key, ans) => { calls.push("answer:" + key + ":" + ans); st.card = null; },
    mstPersist: () => {}, mstSave: () => { calls.push("save"); }, mstAutoPlayCurrent: () => {},
    mstSessions: () => [ { sid: "facts", name: "Math Facts", audio: "off", typeAnswer: true }, { sid: "plain", name: "Plain", audio: "off" } ],
    calls };
  vm.createContext(ctx);
  vm.runInContext(["mastGetDef", "mstEsc", "mstEscJs", "mstItemAnswer", "mstCardDef", "mstCardMode", "mstIsRuleCard", "mstIsSpellCard", "mstFlipBtn", "mstAudioBtn", "mstCardHtml", "mstTap"].map(slice).join("\n") + BLOCK, ctx);
  return ctx;
}
const CARD = { key: "r:lin_67", kind: "review", id: "lin_67", deck: "Math Facts", name: "6×7" };
const NOANS = { key: "r:lin_x", kind: "review", id: "lin_x", deck: "Math Facts", name: "6×13" };
const text = h => h.replace(/<[^>]*>/g, " ");
{
  const ctx = study(); const run = c => vm.runInContext(c, ctx);
  const on = run('mstCardHtml({sid:"facts",name:"Math Facts",audio:"off",typeAnswer:true},' + JSON.stringify(CARD) + ')');
  ok("flag on: the fact is on the face", /mast-slide-name">6×7</.test(on));
  ok("flag on: an input and a Check button", /id="mst-typeans-in"/.test(on) && /mstCheckTypeAns\(\)/.test(on) && /Type the answer/.test(on));
  ok("flag on: no flip, no answer shown", !/mast-flip-back/.test(on) && !/tap to flip/.test(on) && !/>42</.test(on));
  const off = run('mstCardHtml({sid:"plain",name:"Plain",audio:"off"},' + JSON.stringify(CARD) + ')');
  ok("flag off: the normal flip card, no input", /mast-flip-back/.test(off) && /tap to flip/.test(off) && !/mst-typeans-in/.test(off));
  const none = run('mstCardHtml({sid:"facts",name:"Math Facts",audio:"off",typeAnswer:true},' + JSON.stringify(NOANS) + ')');
  ok("flag on but no answer: falls back to the normal flip", /mast-flip-back/.test(none) && !/mst-typeans-in/.test(none));
  ok("mstTypeAnsOn says the same", run('mstTypeAnsOn({typeAnswer:true},' + JSON.stringify(CARD) + ')') === true && run('mstTypeAnsOn({typeAnswer:true},' + JSON.stringify(NOANS) + ')') === false && run('mstTypeAnsOn({},' + JSON.stringify(CARD) + ')') === false);
}
console.log("── 4 · a wrong answer grades 'again', a right one 'good' ──");
{
  const ctx = study(); const run = c => vm.runInContext(c, ctx);
  ctx.mstState.card = CARD;
  run('mstTyped=""; mstCheckTypeAns()');
  ok("an empty box doesn't check", run("mstChecked") === null);
  run('mstTyped="41"; mstCheckTypeAns()');
  ok("41: checked wrong, repaint", run("mstChecked") && run("mstChecked.ok") === false && ctx.calls.includes("re"));
  const h = run('mstCardHtml({sid:"facts",name:"Math Facts",audio:"off",typeAnswer:true},' + JSON.stringify(CARD) + ')');
  ok("shows ✗ Not quite — 42 and what he typed", /✗ Not quite — 42/.test(h) && /line-through">41</.test(h) && !/mst-typeans-in/.test(h));
  const m = h.match(/onclick="(mstTap\('[a-z]+'\))"/);
  ok("Next grades 'again'", !!m && m[1] === "mstTap('again')", m && m[1]);
  run(m[1]);
  ok("…through the real mstTap: mstAnswer got again, state cleared", ctx.calls.includes("answer:r:lin_67:again") && run("mstTyped") === "" && run("mstChecked") === null);
  ctx.mstState.card = CARD; ctx.calls.length = 0;
  run('mstTyped=" 42 "; mstCheckTypeAns()');
  const h2 = run('mstCardHtml({sid:"facts",name:"Math Facts",audio:"off",typeAnswer:true},' + JSON.stringify(CARD) + ')');
  ok("42 (with spaces): ✓ Right!, Next grades 'good'", run("mstChecked.ok") === true && /✓ Right!/.test(h2) && /mstTap\('good'\)/.test(h2) && !/Not quite/.test(h2));
  run("mstTap('good')");
  ok("…and mstAnswer got good", ctx.calls.includes("answer:r:lin_67:good"));
  ctx.mstState.card = CARD;
  run('mstTyped="42"; mstCheckTypeAns()');
  ctx.mstSid = "plain";
  run('mstChecked=null; mstTyped="42"; mstCheckTypeAns()');
  ok("no check when the session's switch is off", run("mstChecked") === null);
}

// ── 5 · wiring ──────────────────────────────────────────────────────────────────────
console.log("── 5 · wiring ──");
ok("mstSessions copies the field (it would vanish otherwise)", /typeAnswer: !!rec\.typeAnswer,/.test(src));
ok("mhqSessSave writes it for every kind, after the kind blocks", (() => { const s = slice("mhqSessSave"); const i = s.indexOf("if (mhqSessForm.typeAnswer) rec.typeAnswer = true;"); return i > 0 && i > s.indexOf('if (mhqSessForm.kind === "all")') && i < s.indexOf("masteryData[kid"); })());
ok("the form has an Off/On pill labelled Type the answer", /Type the answer<\/div>/.test(src) && /_mhqPill\("Off", !f\.typeAnswer, "mhqSessSet\(\\'typeAnswer\\',false\)"\) \+ _mhqPill\("On", !!f\.typeAnswer, "mhqSessSet\(\\'typeAnswer\\',true\)"\)/.test(src));
ok("renderMastStudy hides Again/Good for a typed-answer card", /if\(mstCardMode\(card\)==="type"\|\|\(typeof mstTypeAnsOn==="function"&&mstTypeAnsOn\(session,card\)\)\)\{/.test(src));
{ const s = slice("mstCardHtml"); const i = s.indexOf('typeof mstTypeAnsOn==="function"&&mstTypeAnsOn(session,card,def)');
  ok("mstCardHtml picks the typed-answer face after picture, rule and spell cards, before the type/say modes", i > s.indexOf("mstIsSpellCard(card)") && i > s.indexOf("mstPicCardHtml") && i < s.indexOf('mode==="type"')); }
ok("the input only sets mstTyped on input (no repaint per keystroke)", /id="mst-typeans-in"[^>]*oninput="mstTyped=this\.value"/.test(src));
ok("no 🔀 in index.html", src.indexOf("🔀") === -1);
console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
