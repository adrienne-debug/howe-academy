/*
 * Node tests — 🔊 TTS: one shared speak path for every card (her report 2026-10-07, LG StanbyME).
 *   (1) a speak button read the FRONT of a card flipped to its BACK → a flip card's button reads the side
 *       that's SHOWING at tap time (ttsFlipSay + the card's per-side data-say-* text);
 *   (2) an AAS word in Lincoln's drill said nothing while other cards spoke → speech waits for the voice
 *       list to load, a stale "engine-less" flag clears once voices appear, and the baking script covers
 *       every AAS card.
 * Runs the REAL code sliced from index.html against a fake speechSynthesis with manual timers.
 *   run:  node test_tts_shared.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const cut = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error("markers " + a); return src.slice(i, j); };
function slice(name) { const i = src.indexOf("function " + name + "("); if (i < 0) throw new Error("missing " + name);
  let d = 0; for (let k = src.indexOf("{", i); k < src.length; k++) { if (src[k] === "{") d++; else if (src[k] === "}") { d--; if (!d) return src.slice(i, k + 1); } } }
const TTS = cut("// TTS_START", "// TTS_END");

let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x) : "")); } };

// ── harness ────────────────────────────────────────────────────────────────
const CHROME_UA = "Mozilla/5.0 (Web0S; Linux/SmartTV) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0 Safari/537.36";
const SAFARI_UA = "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
function mk(o) {
  o = o || {};
  let now = 0, tid = 0; const timers = [];
  const setTimeout = (f, ms) => { const id = ++tid; timers.push({ id, at: now + (ms || 0), f, every: 0 }); return id; };
  const setInterval = (f, ms) => { const id = ++tid; timers.push({ id, at: now + ms, f, every: ms }); return id; };
  const clear = id => { const k = timers.findIndex(t => t.id === id); if (k >= 0) timers.splice(k, 1); };
  const advance = ms => { const end = now + ms; for (;;) { timers.sort((a, b) => a.at - b.at || a.id - b.id); const t = timers[0]; if (!t || t.at > end) break; now = t.at; if (t.every) t.at += t.every; else timers.shift(); t.f(); } now = end; };
  let voices = (o.voices || []).slice(); const listeners = [];
  const spoken = [];
  const synth = { speaking: false, pending: false,
    getVoices: () => voices.slice(),
    addEventListener: (ev, f) => { if (ev === "voiceschanged") listeners.push(f); },
    cancel: () => {}, resume: () => {},
    speak: u => { spoken.push({ text: u.text, voice: u.voice, lang: u.lang, rate: u.rate, at: now }); if (o.engineSpeaks !== false && voices.length) synth.speaking = true; } };
  const store = Object.assign({}, o.store || {});
  const files = [];
  function Audio() { const a = { src: "", play: () => { files.push(a.src); return { catch: () => {} }; } }; return a; }
  const logs = [];
  const ctx = { console, JSON, Object, Array, String, Number, Math, RegExp,
    setTimeout, setInterval, clearInterval: clear, clearTimeout: clear,
    navigator: { userAgent: o.ua || CHROME_UA }, Audio,
    SpeechSynthesisUtterance: function (t) { this.text = t; },
    HA_LS: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } },
    dbg: m => logs.push(m), masteryKid: "lincoln", masteryData: { lincoln: o.items || [], lincoln_settings: {} },
    mastGetDef: (k, p) => (o.defs || {})[p] || "", mastGetDefAudio: (k, p) => (o.recs || {})[p] || "",
    recPlayed: [] };
  if (o.noSynth !== true) ctx.speechSynthesis = synth;
  ctx.window = ctx;
  ctx.mastPlayDefAudio = p => ctx.recPlayed.push(p);
  vm.createContext(ctx);
  vm.runInContext(TTS, ctx);
  return { ctx, synth, spoken, files, store, logs, advance,
    loadVoices: (vs, fire) => { voices = vs.slice(); if (fire !== false) listeners.forEach(f => f()); } };
}
const V_EN = [{ name: "Google Deutsch", lang: "de-DE", default: true }, { name: "Google UK", lang: "en-GB" }, { name: "Google US", lang: "en-US" }];

console.log("── the voice list loads before speaking ──");
{
  const h = mk({ voices: [] });
  h.ctx.mastSpeak("crash");
  ok("no voices yet → nothing spoken in the tap", h.spoken.length === 0);
  h.advance(300); h.loadVoices(V_EN);
  ok("voiceschanged → the word is spoken once", h.spoken.length === 1 && h.spoken[0].text === "crash", h.spoken);
  ok("…with an English voice picked (US over UK, a German default skipped)", h.spoken[0].voice && h.spoken[0].voice.name === "Google US", h.spoken[0].voice);
  ok("…and the utterance lang set to that voice's", h.spoken[0].lang === "en-US");
  h.advance(3000);
  ok("the wait timer doesn't speak it a second time", h.spoken.length === 1);
  ok("no file fallback when the engine has voices", h.files.length === 0);
}
{
  const h = mk({ voices: V_EN });
  h.ctx.mastSpeak("splash");
  ok("voices already loaded → spoken in the same tick (keeps the tap gesture)", h.spoken.length === 1 && h.spoken[0].at === 0);
  ok("default rate 0.85", h.spoken[0].rate === 0.85);
  h.ctx.mastSpeak("brush", { rate: 0.8 });
  ok("opts.rate carries (Word Workout's 0.8)", h.spoken[1].rate === 0.8);
}
{
  const h = mk({ voices: [] });
  h.ctx.mastSpeak("hat"); h.advance(500);
  h.loadVoices(V_EN, false);   // some webOS builds fill the list without firing voiceschanged
  h.advance(260);
  ok("voices appear with no event → the 250 ms re-check speaks it", h.spoken.length === 1 && h.spoken[0].text === "hat", h.spoken);
}
{
  const h = mk({ voices: [] });
  h.ctx.mastSpeak("first"); h.ctx.mastSpeak("second");
  h.loadVoices(V_EN); h.advance(3000);
  ok("two taps while the list loads → only the latest word is spoken", h.spoken.map(s => s.text).join() === "second", h.spoken);
}

console.log("── engine-less devices (the pre-baked files) ──");
{
  const h = mk({ voices: V_EN, store: { ha_tts_dead: "1" } });
  ok("a persisted engine-less flag…", h.ctx._ttsDead === false || h.store.ha_tts_dead === undefined);
  h.ctx.mastSpeak("man");
  ok("…clears once the device lists voices, so the engine speaks the word", h.spoken.length === 1 && h.files.length === 0);
  ok("…and the stored flag is removed", h.store.ha_tts_dead === undefined);
}
{
  const h = mk({ voices: [], store: { ha_tts_dead: "1" } });
  h.ctx.mastSpeak("sat");
  ok("proven engine-less, still no voices → the baked file plays inside the tap", h.files.length === 1 && h.files[0] === h.ctx._ttsFileUrl("sat"));
  ok("…no utterance attempted", h.spoken.length === 0);
}
{
  const h = mk({ voices: [], engineSpeaks: false });
  h.ctx.mastSpeak("map");
  h.advance(1499);
  ok("no voices: waits the full voice-list window before trying", h.spoken.length === 0);
  h.advance(1);
  ok("at the window's end it tries the engine anyway", h.spoken.length === 1);
  h.advance(700);
  ok("engine silent + list still empty → this word plays from its file", h.files.length === 1 && h.files[0] === h.ctx._ttsFileUrl("map"));
  ok("…and the device is remembered as engine-less", h.store.ha_tts_dead === "1" && h.ctx._ttsDead === true);
}
{
  const h = mk({ noSynth: true });
  h.ctx.mastSpeak("dig");
  ok("no speechSynthesis API at all → the baked file (was silent)", h.files.length === 1);
}
{
  const h = mk({ voices: V_EN, ua: SAFARI_UA });
  h.ctx.mastSpeak("pig");
  ok("iPad Safari path still speaks through the shared function", h.spoken.length === 1 && h.spoken[0].text === "pig");
}

console.log("── what the engine reads ──");
{
  const h = mk({ voices: V_EN });
  h.ctx.mastSpeak("<u>E.T.</u> phoned  home");
  ok("markup stripped, spaces collapsed", h.spoken[0].text === "E.T. phoned home", h.spoken[0].text);
  h.ctx.mastSpeak("Mr․ Smith");
  ok("the AAS one-dot leader reads as a period", h.spoken[1].text === "Mr. Smith", h.spoken[1].text);
  h.ctx.mastSpeak(""); h.ctx.mastSpeak(null);
  ok("empty text speaks nothing", h.spoken.length === 2);
}

console.log("── a flip card reads the side that's SHOWING ──");
function fakeBtn(attrs, flipped) {
  const wrap = { classList: { contains: c => c === "flipped" && flipped }, getAttribute: k => (k in attrs ? attrs[k] : null) };
  return { closest: sel => (sel === ".mast-flip-wrap" ? wrap : null) };
}
function parseAttrs(html) { const o = {}; html.replace(/data-(say|rec)-(front|back)="([^"]*)"/g, (m, a, b, v) => { o["data-" + a + "-" + b] = v.replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&"); }); return o; }
{
  const h = mk({ voices: V_EN });
  const A = parseAttrs(h.ctx.ttsFlipAttrs({ front: "abate", back: "to lessen" }));
  h.ctx.ttsFlipSay(fakeBtn(A, false));
  ok("front showing → reads the front", h.spoken.pop().text === "abate");
  h.ctx.ttsFlipSay(fakeBtn(A, true));
  ok("flipped to the back → reads the back (the reported bug)", h.spoken.pop().text === "to lessen");
}
{
  const h = mk({ voices: V_EN, recs: { abate: "data:audio/x" } });
  const A = parseAttrs(h.ctx.ttsFlipAttrs({ front: "abate", back: "to lessen", recBack: "abate" }));
  h.ctx.ttsFlipSay(fakeBtn(A, true));
  ok("Mom's recording plays on the side it belongs to", h.ctx.recPlayed.join() === "abate" && h.spoken.length === 0);
  h.ctx.ttsFlipSay(fakeBtn(A, false));
  ok("…and the front still reads the word, not her definition clip", h.spoken.pop().text === "abate" && h.ctx.recPlayed.length === 1);
}
{
  const h = mk({ voices: V_EN });
  const raw = 'say "hi" & <wave>';
  const A = parseAttrs(h.ctx.ttsFlipAttrs({ front: raw }));
  ok("per-side text survives HTML-attribute escaping", A["data-say-front"] === raw, A);
  ok("empty sides add no attribute", !/data-say-back/.test(h.ctx.ttsFlipAttrs({ front: "x", back: "" })));
}

console.log("── study cards (mstCardHtml) carry the right per-side text ──");
function study(card, o) {
  o = o || {};
  const h = mk({ voices: V_EN, recs: o.recs });
  const c = h.ctx;
  Object.assign(c, { mstFlipped: false, mstChecked: null, mstTyped: "",
    mstEsc: s => String(s), mstEscJs: s => String(s).replace(/'/g, "\\'"),
    mstItemAnswer: () => o.answer || "", mstCardMode: () => o.mode || "rec",
    mstIsRuleCard: () => false, mstIsSpellCard: () => !!o.spell });
  c.mastGetDef = () => o.def || "";
  vm.runInContext(slice("mstFlipBtn") + "\n" + slice("mstAudioBtn") + "\n" + slice("mstCardHtml"), c);
  return c.mstCardHtml({ name: "Vocab", audio: o.audio }, card);
}
{
  const html = study({ name: "abate", deck: "Vocabulary" }, { def: "to lessen" });
  const A = parseAttrs(html);
  ok("vocab card: front says the word, back says the definition", A["data-say-front"] === "abate" && A["data-say-back"] === "to lessen", A);
  ok("…no button bakes a word in (every speak button asks the card)", !/mastSpeak\(/.test(html) && (html.match(/ttsFlipSay\(this\)/g) || []).length === 2);
}
{
  const html = study({ name: "abate", deck: "Vocabulary" }, { def: "to lessen", recs: { abate: "data:x" } });
  const A = parseAttrs(html);
  ok("with Mom's recording: it rides the back (the side showing the definition)", A["data-rec-back"] === "abate" && !A["data-rec-front"]);
}
{
  const html = study({ name: "abate", deck: "Vocabulary" }, {});
  ok("no definition and no recording → the back has no speak button", (html.match(/ttsFlipSay\(this\)/g) || []).length === 1);
}
{
  const html = study({ name: "crash", deck: "AAS Words" }, { spell: true });
  const A = parseAttrs(html);
  ok("spell card (AAS): both sides say the word", A["data-say-front"] === "crash" && A["data-say-back"] === "crash");
  ok("…both its buttons use the shared flip speak", (html.match(/ttsFlipSay\(this\)/g) || []).length === 2 && !/mastSpeak\(/.test(html));
}
{
  const html = study({ name: "der Hund", deck: "German" }, { mode: "say", def: "the dog" });
  const A = parseAttrs(html);
  ok("say-it card: the back says the German word it shows", A["data-say-back"] === "der Hund" && !A["data-say-front"]);
}
{
  const html = study({ name: "abate", deck: "Vocabulary" }, { def: "to lessen", audio: "off" });
  ok("a deck with sound off still gets no buttons", !/ttsFlipSay/.test(html.replace(/data-say[^"]*"[^"]*"/g, "")));
}

console.log("── the daily drill slideshow ──");
{
  const i = src.indexOf("const buildSlideCard=(it,secondLook)=>{");
  const body = src.slice(i, src.indexOf("mastSlideCardsHtml=slideList.map", i));
  ok("the flip wrap carries the per-side text", /class="mast-flip-wrap'\+\(mastFlipped\?" flipped":""\)\+'"'\+ttsFlipAttrs\(_ttsSide\)/.test(body));
  ok("every flip-card speak button asks the card (no id / prompt baked in)", !/mastSpellSay\(|mastSpeakItem\(|mastPlayDefAudio\(/.test(body) && (body.match(/ttsFlipSay\(this\)/g) || []).length === 3);
  // Evaluate the side map for each card shape.
  const expr = body.slice(body.indexOf("const _ttsSide="), body.indexOf(";", body.indexOf("const _ttsSide=")) + 1);
  const side = v => vm.runInNewContext(expr + " _ttsSide", v);
  const it = { prompt: "der Hund", dir: "prod" };
  ok("🇬🇧→🇩🇪 reversed card: the back says the German word (was the English definition)", side({ _isSpell: false, _faceRev: true, _faceName: false, it, _sayDef: "the dog" }).back === "der Hund");
  ok("…and Mom's clip (it says the answer) stays on that back", side({ _isSpell: false, _faceRev: true, _faceName: false, it, _sayDef: "the dog" }).recBack === "der Hund");
  const rev = side({ _isSpell: false, _faceRev: true, _faceName: false, it: { prompt: "abate", dir: "rec" }, _sayDef: "to lessen" });
  ok("reversed vocab card: front says the definition it shows, back the word", rev.front === "to lessen" && rev.back === "abate" && rev.recFront === "abate" && !rev.recBack);
  const sp = side({ _isSpell: true, _faceRev: false, _faceName: false, it: { prompt: "crash" }, _sayDef: "" });
  ok("AAS spell card: both sides say the word (no id lookup to fail)", sp.front === "crash" && sp.back === "crash");
  const nm = side({ _isSpell: false, _faceRev: false, _faceName: true, it: { prompt: "Lincoln" }, _sayDef: "16th president" });
  ok("guess-the-name card: the back says the name it shows", nm.back === "Lincoln" && !nm.recBack);
  const n = side({ _isSpell: false, _faceRev: false, _faceName: false, it: { prompt: "abate" }, _sayDef: "to lessen" });
  ok("plain flip card: front the word, back the definition", n.front === "abate" && n.back === "to lessen" && n.recBack === "abate");
}

console.log("── one speak path, app-wide ──");
{
  const outside = src.replace(TTS, "");
  ok("no screen builds its own SpeechSynthesisUtterance", !/new SpeechSynthesisUtterance/.test(outside));
  ok("no screen calls speechSynthesis.speak directly", !/speechSynthesis\.speak\(/.test(outside));
  ok("spelling test 🔊 uses mastSpeak", /function stSpeak\(\)\{[^\n]*mastSpeak\(/.test(src));
  ok("Word Workout 🔊 uses mastSpeak", /function wwSay\(\)\{[^\n]*mastSpeak\(wwWord\(it\),\{rate:0\.8\}\)/.test(src));
  ok("no 🔀 emoji added", src.indexOf("\u{1F500}") < 0);
}

console.log("── the baking script covers every AAS card ──");
{
  const gen = require("./scripts/gen_tts.js");
  const texts = new Set(gen.aasTexts());
  const ctx = {}; vm.createContext(ctx);
  vm.runInContext(cut("const AAS_DATA={", "]]};") + "]]};\nthis.AAS_DATA=AAS_DATA;", ctx);
  const D = ctx.AAS_DATA;
  ok("every AAS word is baked (" + D.w.length + ")", D.w.every(r => texts.has(r[2])));
  ok("every phonogram / rule / sound-spelling front and back is baked", ["p", "r", "s"].every(k => D[k].every(r => texts.has(r[2]) && texts.has(r[3]))));
  const w = D.w.find(r => r[3]);
  ok("the spelling test's \"word. sentence\" is baked", texts.has(w[2] + ". " + w[3]));
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
