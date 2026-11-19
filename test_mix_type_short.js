/*
 * ⌨️ MIXTYPE (her words 2026-11-18, "Yes, build it"): the Daily Mix checks a short answer. With the Mix session's
 * "Type short answers" switch On, a review card whose answer is 1–3 words shows its front, the kid types the answer and
 * the app marks it (capitals, end punctuation and a leading "the" / "a" / "an" don't count). Off to start.
 * Live case: 11/11 Lincoln "answered" 60 Mix cards in 99 s (48 under 2 s, 59 marked right); 11/12 60 cards in 286 s.
 *   1 · source: marker blocks + hook lines
 *   2 · which cards are typed (mstTypeAnsOn / mstMixTypeOn): switch off = today; 1–3 words; exclusions; only kind "mix"
 *   3 · the lenient check (mstMixTypeOk) and which check the typed face uses (mstCheckTypeAns)
 *   4 · the Mix "asked once" rule still holds for a typed card (real engine)
 *   5 · Mom's switch in the real session editor (open → pills → save → reopen)
 * Runs the REAL code sliced from index.html, on made-up demo data (kid_a, made-up decks). No database.
 * run: node test_mix_type_short.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x).slice(0, 300) + ")" : "")); } };
const fn = name => { const i = src.indexOf("function " + name + "("); if (i < 0) throw new Error("missing " + name); let d = 0; for (let k = src.indexOf("{", i); k < src.length; k++) { if (src[k] === "{") d++; else if (src[k] === "}" && --d === 0) return src.slice(i, k + 1); } throw new Error("unbalanced " + name); };
const cut = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error("missing " + a); return src.slice(i, j); };

// ── 1 · source ─────────────────────────────────────────────────────────────────────
console.log("── 1 · source ──");
const mA = src.indexOf("// MIXTYPE_START"), mB = src.indexOf("// MIXTYPE_END");
const tA = src.indexOf("// MST_TYPEANS_START"), tB = src.indexOf("// MST_TYPEANS_END");
ok("MIXTYPE block present, inside MST_TYPEANS", mA > 0 && mB > mA && mA > tA && mB < tB);
const fA = src.indexOf("// MIXTYPE_FORM_START"), fB = src.indexOf("// MIXTYPE_FORM_END");
ok("MIXTYPE_FORM block present, right after MIXFINISH_EDIT", fA > 0 && fB > fA && src.indexOf("// MIXFINISH_EDIT_END") < fA && fA - src.indexOf("// MIXFINISH_EDIT_END") < 40);
const BLK = src.slice(mA, mB), FBLK = src.slice(fA, fB);
ok("header cites her words and the date", BLK.includes("2026-11-18") && BLK.includes("Yes, build it") && BLK.includes("99 seconds"));
ok("header says what is stored and no other writes", BLK.includes("mixType:true") && BLK.includes("No database writes other than the session record's own save"));
ok("the blocks write nothing (no db / ref / set / update)", !/\bdb\b|\.ref\(|\.set\(|\.update\(/.test(BLK + FBLK));
ok("mstSessions exposes mixType", fn("mstSessions").includes("mixType: !!rec.mixType,"));
ok("mstTypeAnsOn asks mstMixTypeOn first", /if\(!session\|\|!card\) return false;\n  if\(typeof mstMixTypeOn==="function"&&mstMixTypeOn\(session,card,def\)\) return true;/.test(fn("mstTypeAnsOn")));
ok("mhqSessSave writes mixType only for a mix", fn("mhqSessSave").includes('if (mhqSessForm.kind === "mix" && mhqSessForm.mixType) rec.mixType = true;'));
ok("the form hook is Mix-only, right after the Finish line", fn("_mhqRenderSessForm").includes("if (isMix) h += _mhqMixFinishFormHtml(f, lbl);   // MIXFINISH_EDIT\n  if (isMix && typeof _mhqMixTypeFormHtml === \"function\") h += _mhqMixTypeFormHtml(f, lbl);"));
ok("mstPile is untouched (no mixType in it)", !fn("mstPile").includes("mixType") && !fn("mstSittingInit").includes("mixType"));
ok("no family names in the new blocks", !/ellis|lucy|julian|adrienne/i.test(BLK + FBLK));
ok("no 🔀 in index.html", src.indexOf("\u{1F500}") === -1);

// ── shared VM: the real engine + the real MST_TYPEANS block (with MIXTYPE) + the real card-kind checks ──
const PN = 300;
const ENGINE = cut("// ── MST_ENGINE_START ──", "// ── MST_ENGINE_END ──");
const TYPEANS = src.slice(tA, tB);
function mkStudy(items, sessions) {
  const ctx = { console, Object, Array, String, Number, JSON, Math, Set, Map, Date };
  vm.createContext(ctx);
  vm.runInContext(`
var masteryData = {}; var masteryKid = "kid_a";
var MAST_TIER_ORDER = ["daily","every_other_day","every_third_day","weekly","bi_weekly","monthly","learned","graduated"];
var MAST_TIER_INT = {daily:1,every_other_day:2,every_third_day:3,weekly:5,bi_weekly:10,monthly:20,learned:60,graduated:null};
function mastDrillSettings(){ return { ladder: ["every_other_day","weekly","bi_weekly","monthly","graduated"] }; }
function mastIsDue(i,pn){ return i.next_due == null || i.next_due <= pn; } function mastIsParked(i){ return !!(i && i.status === "parked"); } function mastIsNeverDrill(){ return false; }
function mastFullBank(){ return {}; }
var HA_LS = { getItem(){ return null; }, setItem(){}, removeItem(){} };
function mastGetCatMode(kid, deck){ return deck === "Demo Spelling" ? "spell" : ""; }
function mastLiveImg(it){ return (it && it.imageUrl) || ""; }
function usNoTyped(c){ return !!(c && c.deck === "Demo Civics"); }
function mstCardDef(card){ const it = (masteryData.kid_a || []).find(i => i.id === card.id); return it ? (it.answer || "") : (card._def || ""); }
function mstEsc(s){ return String(s == null ? "" : s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }
var _reDraws = 0; function _mastRe(){ _reDraws++; }
var _boxVal = ""; var document = { getElementById(id){ return id === "mst-typeans-in" ? { value: _boxVal } : null; } };
var mstState = null, mstSid = null, mstTyped = "", mstChecked = null;
`, ctx);
  vm.runInContext(ENGINE + "\n" + TYPEANS + "\n" + ["mstIsRuleCard", "mstIsSpellCard", "mstCardPic"].map(fn).join("\n"), ctx);
  ctx.masteryData.kid_a = items; ctx.masteryData.kid_a_sessions = sessions;
  return { ctx, run: c => vm.runInContext(c, ctx) };
}
const R = (id, deck, prompt, answer, extra) => Object.assign({ id, subject: deck, prompt, answer, review_mode: "flash", status: "active", tier: "weekly", next_due: PN }, extra || {});
const ITEMS = [
  R("w1", "Demo Words", "der Hund", "dog"),
  R("w2", "Demo Words", "Wie geht's?", "How are you"),
  R("w3", "Demo Words", "Guten Morgen", "good morning sir"),
  R("w4", "Demo Words", "Gute Nacht", "sleep well my friend"),
  R("w5", "Demo Words", "das ist", "that/this is"),
  R("w6", "Demo Words", "meine Freundin", "my friend (female)"),
  R("w7", "Demo Words", "ja", ""),
  R("w8", "Demo Words", "Berlin", "Berlin"),
  R("w9", "Demo Words", "die Trommel", "<b>the drum</b>"),
  R("r1", "Capitalization", "<u>Monday</u> is a day.", "Days of the week"),
  R("r2", "Demo Grammar", "noun", "person", { review_mode: "recite" }),
  R("s1", "Demo Spelling", "because", "a word"),
  R("p1", "Demo Rocks", "quartz", "a mineral", { imageUrl: "https://example.test/q.jpg" }),
  R("c1", "Demo Civics", "the capital", "Washington")
];
const SESS = {
  daily_mix: { name: "Daily Mix", kind: "mix", mixFinish: 0, mixType: true },
  plain_mix: { name: "Plain Mix", kind: "mix", mixFinish: 0 },
  exact_mix: { name: "Exact Mix", kind: "mix", mixFinish: 0, typeAnswer: true },
  both_mix: { name: "Both Mix", kind: "mix", mixFinish: 0, typeAnswer: true, mixType: true },
  words: { name: "Words", kind: "deck", decks: ["Demo Words"], mixType: true },
  study: { name: "Daily Study", kind: "all", mixType: true }
};
const card = id => { const it = ITEMS.find(i => i.id === id); return { key: "r:" + id, kind: "review", id, deck: it.subject, name: it.prompt }; };

// ── 2 · which cards are typed ─────────────────────────────────────────────────────────
console.log("── 2 · which cards are typed ──");
{
  const S = mkStudy(JSON.parse(JSON.stringify(ITEMS)), JSON.parse(JSON.stringify(SESS)));
  const ses = S.run('mstSessions("kid_a")'); const by = sid => ses.find(s => s.sid === sid);
  ok("mstSessions: mixType true when the record has it, false when absent", by("daily_mix").mixType === true && by("plain_mix").mixType === false);
  const on = (sid, id) => S.ctx.mstTypeAnsOn(by(sid), card(id));
  ok("switch off (no mixType): a short-answer Mix review card stays a flip card (today)", on("plain_mix", "w1") === false && on("plain_mix", "w2") === false);
  ok("switch on: 1-word answer is typed", on("daily_mix", "w1") === true);
  ok("switch on: 3-word answer is typed (How are you)", on("daily_mix", "w2") === true);
  ok("switch on: 3-word answer is typed (good morning sir)", on("daily_mix", "w3") === true);
  { const c2 = { key: "n:x", kind: "review", deck: "Demo Words", name: "Wie geht es dir", _def: "fine thanks" };
    ok("switch on: 2-word answer is typed", S.ctx.mstTypeAnsOn(by("daily_mix"), c2) === true && S.ctx.mstMixTypeOn(by("daily_mix"), c2, "fine thanks") === true); }
  ok("4-word answer stays a flip card", on("daily_mix", "w4") === false);
  ok("an answer with / stays a flip card", on("daily_mix", "w5") === false);
  ok("an answer with ( ) stays a flip card", on("daily_mix", "w6") === false);
  ok("an empty answer stays a flip card", on("daily_mix", "w7") === false);
  ok("answer the same as the front stays a flip card", on("daily_mix", "w8") === false);
  ok("an answer with markup counts its words without the tags (the drum = 2)", on("daily_mix", "w9") === true);
  ok("a rule card (Capitalization) stays a flip card", on("daily_mix", "r1") === false);
  ok("a recite rule card stays a flip card", on("daily_mix", "r2") === false);
  ok("a spelling card stays a flip card", on("daily_mix", "s1") === false);
  ok("a picture card stays a flip card", on("daily_mix", "p1") === false);
  ok("a no-typing deck (usNoTyped) stays a flip card", on("daily_mix", "c1") === false);
  ok("a deck session with mixType on its record is NOT affected", on("words", "w1") === false && S.ctx.mstMixTypeOn(by("words"), card("w1")) === false);
  ok("a Daily Study (all) session with mixType on its record is NOT affected", by("study").kind === "all" && on("study", "w1") === false && S.ctx.mstMixTypeOn(by("study"), card("w1")) === false);
  ok("a Mix with Type the answer on still types every card it did before (4 words too)", on("exact_mix", "w1") && on("exact_mix", "w4") && on("exact_mix", "w5") && !on("exact_mix", "w7") && !on("exact_mix", "r1"));
  ok("mstMixTypeOn uses the def passed in", S.ctx.mstMixTypeOn(by("daily_mix"), card("w4"), "dog") === true && S.ctx.mstMixTypeOn(by("daily_mix"), card("w1"), "one two three four") === false);
  ok("no session / no card → false", S.ctx.mstMixTypeOn(null, card("w1")) === false && S.ctx.mstMixTypeOn(by("daily_mix"), null) === false);
}

// ── 3 · the lenient check ─────────────────────────────────────────────────────────────
console.log("── 3 · the lenient check, and which check the face uses ──");
{
  const S = mkStudy(JSON.parse(JSON.stringify(ITEMS)), JSON.parse(JSON.stringify(SESS)));
  const M = (t, a) => S.ctx.mstMixTypeOk(t, a);
  ok('"drum" vs "the drum" ✓', M("drum", "the drum") === true);
  ok('"the drum" vs "drum" ✓', M("the drum", "drum") === true);
  ok('"fine thanks" vs "Fine, thanks." ✓', M("fine thanks", "Fine, thanks.") === true);
  ok('"How are you" vs "How are you?" ✓', M("How are you", "How are you?") === true);
  ok('"mrs" vs "Mrs." ✓', M("mrs", "Mrs.") === true);
  ok('"a house" vs "house" ✓ and "house" vs "a house" ✓', M("a house", "house") === true && M("house", "a house") === true);
  ok('"an apple" vs "apple" ✓', M("an apple", "apple") === true);
  ok('"0.25" vs "0.25" ✓', M("0.25", "0.25") === true);
  ok('"025" vs "0.25" ✗', M("025", "0.25") === false);
  ok('"1000" vs "1,000" ✓ (the exact matcher already reads 1,000 as 1000)', M("1000", "1,000") === true);
  ok('"12" vs "1,2" ✗ (a comma between digits is kept)', M("12", "1,2") === false);
  ok('"dram" vs "drum" ✗ (no typo tolerance)', M("dram", "drum") === false);
  ok('"" vs "drum" ✗', M("", "drum") === false && M("   ", "drum") === false);
  ok('"drum" vs "" ✗', M("drum", "") === false);
  ok('curly apostrophe: "it\'s" vs "it’s" ✓', M("it's", "it’s") === true);
  ok('quotes don\'t count: "hello" vs "“Hello!”" ✓', M("hello", "“Hello!”") === true);
  ok('only ONE leading article dropped: "the drum" vs "a the drum" ✗', M("the drum", "a the drum") === false);
  ok('"the" alone vs "the" ✓; "the" vs "" ✗', M("the", "the") === true && M("the", "") === false);
  ok("the exact matcher is unchanged: \"the drum\" vs \"drum\" ✗", S.ctx.mstTypeAnsOk("the drum", "drum") === false && S.ctx.mstTypeAnsOk("Drum", "drum") === true);

  // the face's Check: lenient only for a card typed BECAUSE of the Mix switch
  const check = (sid, id, typed) => {
    S.ctx.mstSid = sid; S.ctx.mstChecked = null; S.ctx.mstTyped = typed; S.ctx._boxVal = typed;
    S.ctx.mstState = { cards: { ["r:" + id]: card(id) }, queue: ["r:" + id], passes: 2 };
    S.run("mstCheckTypeAns()"); return S.ctx.mstChecked;
  };
  const items2 = S.ctx.masteryData.kid_a; items2.push(R("w10", "Demo Words", "Wie geht es?", "Fine, thanks."), R("w11", "Demo Words", "die Trommel", "drum"));
  ITEMS.push(R("w10", "Demo Words", "Wie geht es?", "Fine, thanks."), R("w11", "Demo Words", "die Trommel", "drum"));
  { const c = check("daily_mix", "w10", "fine thanks"); ok("Mix switch on: \"fine thanks\" for \"Fine, thanks.\" is marked right", c && c.ok === true, c); }
  { const c = check("daily_mix", "w11", "The drum"); ok("Mix switch on: \"The drum\" for \"drum\" is marked right", c && c.ok === true, c); }
  { const c = check("daily_mix", "w11", "dram"); ok("Mix switch on: \"dram\" for \"drum\" is marked wrong", c && c.ok === false, c); }
  { const c = check("exact_mix", "w11", "the drum"); ok("Type the answer on: the exact matcher — \"the drum\" for \"drum\" is wrong", c && c.ok === false, c); }
  { const c = check("both_mix", "w10", "fine thanks"); ok("Type the answer AND Mix switch on: the exact matcher still", c && c.ok === false, c); }
  { const c = check("plain_mix", "w11", "drum"); ok("switch off: the Check does nothing (the card is a flip card)", c === null, c); }
}

// ── 4 · asked once ────────────────────────────────────────────────────────────────────
console.log("── 4 · the Mix asks a typed card once ──");
{
  const items = [R("w1", "Demo Words", "der Hund", "dog"), R("w2", "Demo Words", "die Katze", "cat"), R("w4", "Demo Words", "Gute Nacht", "sleep well my friend")];
  const S = mkStudy(items, { daily_mix: { name: "Daily Mix", kind: "mix", mixFinish: 0, mixType: true },
    words: { name: "Words", kind: "deck", decks: ["Demo Words"], mixInAt: "every_other_day", handOffAt: "bi_weekly", passes: 2 } });
  const ses = S.run('mstSessions("kid_a")').find(s => s.sid === "daily_mix");
  const pile = S.ctx.mstPile("kid_a", "daily_mix", PN, null);
  ok("mstPile draws the three reviews as before", pile.reviews.length === 3, pile.reviews.map(i => i.id));
  const st = S.ctx.mstSittingInit(pile, ses, {});
  ok("every Mix card still carries the once flag, and no mode is set", Object.keys(st.cards).every(k => st.cards[k].once === true && st.cards[k].mode === undefined));
  S.ctx.mstState = st; S.ctx.mstSid = "daily_mix";
  const answers = { w1: "cat", w2: "Cat.", w4: null };
  const seen = {}; let n = 0, cur;
  while ((cur = S.ctx.mstCurrent(st)) && n < 20) {
    seen[cur.key] = (seen[cur.key] || 0) + 1;
    const typed = S.ctx.mstTypeAnsOn(ses, cur);
    let grade;
    if (typed) {
      S.ctx.mstChecked = null; S.ctx.mstTyped = answers[cur.id]; S.ctx._boxVal = answers[cur.id];
      S.run("mstCheckTypeAns()");
      const face = S.ctx.mstTypeAnsHtml(ses, cur, S.ctx.mstCardDef(cur), "");
      grade = S.ctx.mstChecked.ok ? "good" : "again";
      ok("typed face for " + cur.id + ": Next grades " + grade, face.includes("mstTap('" + grade + "')"));
    } else grade = "again";   // the long answer is a flip card; he taps ✗
    S.ctx.mstAnswer(st, cur.key, grade); n++;
  }
  ok("3 answers, every card shown exactly once", n === 3 && Object.values(seen).every(v => v === 1), seen);
  ok("the 4-word card was a flip card, the others typed", S.ctx.mstTypeAnsOn(ses, st.cards["r:w4"]) === false && S.ctx.mstTypeAnsOn(ses, st.cards["r:w1"]) === true);
  const o = S.ctx.mstOutcomes(st);
  ok("the wrong typed answer is scored ✗ once and not re-queued (w1 = m, done)", o.scores["w1"] === "m" && st.cards["r:w1"].done === true && st.queue.indexOf("r:w1") === -1, o.scores);
  ok("the right typed answer \"Cat.\" for \"cat\" is scored ✓ (w2 = c)", o.scores["w2"] === "c", o.scores);
  ok("nothing left in the sitting", S.ctx.mstProgress(st).remaining === 0);
}

// ── 5 · Mom's switch in the editor ───────────────────────────────────────────────────────
console.log("── 5 · the session editor ──");
function mkEd(sessions) {
  const writes = [];
  const ctx = { console, Object, Array, String, Number, parseInt, Math, JSON, Date, Set, Map, Infinity,
    masteryData: { kid_a: [], kid_a_sessions: JSON.parse(JSON.stringify(sessions || {})) }, masteryKid: "kid_a", mhqKid: "kid_a",
    mastDrillSettings: () => ({ ladder: ["every_other_day", "weekly", "bi_weekly", "monthly", "graduated"] }), mastGetPrintNum: () => 201,
    mhqSessValidate: () => ({ ok: true }), _mhqSlug: (n) => String(n).toLowerCase().replace(/\W+/g, "_"), renderAll: () => {},
    mhqDeckStats: () => [{ deck: "Demo Words", learning: 0, active: 0, bank: 0 }], mhqDeckOwner: () => null, mhqEsc: s => String(s), mhqArgEsc: s => String(s),
    _mhqPill: (l, on, oc) => '<button data-on="' + (on ? 1 : 0) + '" onclick="' + oc + '">' + l + '</button>', mhqTierLbl: t => t, NB_PACE_DAYS: 10, NB_ROLE_LBL: {}, mastIntroDotsFor: () => null,
    nbBudgetCardHtml: () => "", nbSessionToday: () => null, gwGetSubjects: () => ({}), mhqMigrationPreview: () => ({}), _mhqMigrationSentence: () => "",
    mastFullBank: () => ({}), mastAdminLocal: true, mastAdminWaitingHtml: () => "", mastAdminInit: () => {},
    db: { ref: p => ({ set: v => writes.push(["set", p, v]), update: v => writes.push(["update", p, v]), remove: () => writes.push(["remove", p]) }) },
    HA_LS: { setItem: () => {}, getItem: () => null }, writes };
  vm.createContext(ctx);
  vm.runInContext(cut("const MST_SESSION_DEFAULTS =", "\n};") + "\n};\n" + cut("const MST_PATTERN_MODES", ";\n") + ";\n" + cut("const MST_HOWTO_MAX", ";\n") + ";\n" +
    "let mhqSessEdit = null, mhqSessForm = null, mhqSessErr = '';\n" + cut("// MIXFINISH_EDIT_START", "// MIXFINISH_EDIT_END") + "\n" + FBLK + "\n" +
    ["mstPatternClean", "mstHowtoClean", "mstSessions", "mhqSessOpen", "mhqSessClose", "mhqSessSet", "mhqSessSave", "_mhqStepper", "_mhqRenderSessForm"].map(fn).join("\n") +
    "\nfunction _get(e){ return eval(e); }", ctx);
  ctx.get = e => ctx._get(e);
  return ctx;
}
const HINT = "On: a card with a short answer (1–3 words) is typed and the app checks it. Long answers and rule cards stay flip cards. Off: flip and grade yourself.";
const pills = h => { const i = h.indexOf(">Type short answers<"); if (i < 0) return null; const seg = h.slice(i, i + 700);
  const b = [...seg.matchAll(/<button data-on="(\d)" onclick="([^"]*)">(Off|On)<\/button>/g)].slice(0, 2);
  return { off: b[0] && { on: b[0][1] === "1", click: b[0][2] }, on: b[1] && { on: b[1][1] === "1", click: b[1][2] } }; };
const lastSet = c => { const w = c.writes.filter(x => x[0] === "set"); return w[w.length - 1]; };
const EB = { daily_mix: { name: "Daily Mix", emoji: "🧠", kind: "mix", who: "solo", audio: "off" },
  words: { name: "Words", kind: "deck", decks: ["Demo Words"], newPerDay: 5, passes: 2, mixInAt: "weekly", handOffAt: "bi_weekly" },
  ds: { name: "Daily Study", kind: "all", newPerDay: 5, passes: 2, mixInAt: "weekly", handOffAt: "bi_weekly", maxCards: 12, focusDecks: 3 } };
{ const c = mkEd(EB); c.get("mhqSessOpen('daily_mix')"); const h = c.get("_mhqRenderSessForm('kid_a')"); const p = pills(h);
  ok("the Mix form shows Type short answers", !!p && !!p.off && !!p.on, p);
  ok("it sits directly under the Finish line (after its hint, before Audio)", h.indexOf(">Type short answers<") > h.indexOf("done at this many; Keep going for the rest. 0 = all") && h.indexOf(">Type short answers<") < h.indexOf(">Audio<"));
  ok("with the hint text", h.includes(HINT));
  ok("an existing Mix with no saved value shows Off", p.off.on === true && p.on.on === false, p);
  ok("the pills set mixType", p.on.click === "mhqSessSet('mixType',true)" && p.off.click === "mhqSessSet('mixType',false)", p);
  c.get(p.on.click); const p2 = pills(c.get("_mhqRenderSessForm('kid_a')"));
  ok("tapping On shows On", p2.on.on === true && p2.off.on === false);
  c.get("mhqSessSave()"); const w = lastSet(c);
  ok("saving writes mixType:true on mastery/kid_a_sessions/daily_mix", w && w[1] === "mastery/kid_a_sessions/daily_mix" && w[2].mixType === true && w[2].kind === "mix", w);
  ok("one targeted set, nothing else", c.writes.length === 1, c.writes);
  c.get("mhqSessOpen('daily_mix')"); const p3 = pills(c.get("_mhqRenderSessForm('kid_a')"));
  ok("reopening the saved Mix shows On", p3.on.on === true && p3.off.on === false, p3);
  c.get(p3.off.click); c.get("mhqSessSave()");
  ok("switching Off and saving writes no mixType", !("mixType" in lastSet(c)[2]), lastSet(c));
  ok("…and the local copy has none", !("mixType" in c.masteryData.kid_a_sessions.daily_mix)); }
{ const c = mkEd(EB); c.get("mhqSessOpen('daily_mix')"); c.get("mhqSessSave()");
  ok("saving a Mix untouched writes no mixType (default Off)", !("mixType" in lastSet(c)[2]), lastSet(c)); }
{ const c = mkEd({}); c.get("mhqSessOpen('__new_mix')"); const p = pills(c.get("_mhqRenderSessForm('kid_a')"));
  ok("a new Mix starts Off", p && p.off.on === true && p.on.on === false, p);
  c.get(p.on.click); c.get("mhqSessSave()"); ok("a new Mix saved On carries mixType:true", lastSet(c)[2].mixType === true && lastSet(c)[2].kind === "mix", lastSet(c)); }
{ const c = mkEd(EB);
  c.get("mhqSessOpen('words')"); ok("a deck session's form has no Type short answers", !c.get("_mhqRenderSessForm('kid_a')").includes("Type short answers"));
  c.get("mhqSessOpen('ds')"); ok("Daily Study's form has no Type short answers", !c.get("_mhqRenderSessForm('kid_a')").includes("Type short answers"));
  c.get("mhqSessOpen('__new_deck')"); ok("a new deck form has no Type short answers", !c.get("_mhqRenderSessForm('kid_a')").includes("Type short answers"));
  c.get("mhqSessOpen('words')"); c.get("mhqSessSet('mixType',true)"); c.get("mhqSessSave()");
  ok("saving a deck session never writes mixType, even if the form had it", !("mixType" in lastSet(c)[2]), lastSet(c));
  c.get("mhqSessOpen('ds')"); c.get("mhqSessSet('mixType',true)"); c.get("mhqSessSave()");
  ok("saving Daily Study never writes mixType", !("mixType" in lastSet(c)[2]), lastSet(c)); }
{ const c = mkEd(Object.assign({}, EB, { words: Object.assign({}, EB.words, { mixType: true }) })); c.get("mhqSessOpen('words')"); c.get("mhqSessSave()");
  ok("a deck record that somehow had mixType loses it on its next save", !("mixType" in lastSet(c)[2]), lastSet(c)); }
{ const c = mkEd(Object.assign({}, EB, { daily_mix: Object.assign({}, EB.daily_mix, { typeAnswer: true }) })); c.get("mhqSessOpen('daily_mix')"); c.get("mhqSessSave()");
  ok("Type the answer on a Mix still saves as before (typeAnswer:true, no mixType)", lastSet(c)[2].typeAnswer === true && !("mixType" in lastSet(c)[2]), lastSet(c)); }

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
