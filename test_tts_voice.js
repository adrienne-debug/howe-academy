/*
 * Node tests — 🔊 the clearest US-English voice + a slower rate for spelling words + Mom's voice picker
 * (her report 2026-10-07: the spelling word "grasp" sounded like "grass").
 *   (1) each device picks its clearest natural US-English voice from a ranked list (Apple Premium/Enhanced,
 *       Edge neural, Google US English, Apple built-in, Android Google speech…), never a novelty voice,
 *       with a fallback to any English voice, then the device default;
 *   (2) Mom's choice for THIS device (Settings ▸ 🔊 Spelling voice) wins when the device has that voice;
 *       it lives in this device's storage only — no Firebase write;
 *   (3) every spelling-word speak path reads at TTS_SPELL_RATE (slower than the 0.85 default);
 *       the pre-baked files (engine-less TV) play slightly slower too.
 * Runs the REAL code sliced from index.html against a fake speechSynthesis.
 *   run:  node test_tts_voice.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const cut = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error("markers " + a); return src.slice(i, j); };
const TTS = cut("// TTS_START", "// TTS_END");
const CARD = cut("// TTS_VOICE_CARD_START", "// TTS_VOICE_CARD_END");

let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x) : "")); } };

function mk(o) {
  o = o || {};
  let voices = (o.voices || []).slice();
  const spoken = [], files = [], store = Object.assign({}, o.store || {}), dbWrites = [];
  const synth = { speaking: false, pending: false, getVoices: () => voices.slice(), addEventListener: () => {},
    cancel: () => {}, resume: () => {}, speak: u => { spoken.push({ text: u.text, voice: u.voice, rate: u.rate }); } };
  function Audio() { const a = { src: "", play: () => { files.push({ src: a.src, rate: a.playbackRate }); return { catch: () => {} }; } }; return a; }
  const els = {};
  const ctx = { console, JSON, Object, Array, String, Number, Math, RegExp,
    setTimeout: () => 0, setInterval: () => 0, clearInterval: () => {}, clearTimeout: () => {},
    navigator: { userAgent: "Mozilla/5.0 (Macintosh) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36" }, Audio,
    SpeechSynthesisUtterance: function (t) { this.text = t; },
    HA_LS: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } },
    dbg: () => {}, masteryKid: "lincoln", masteryData: { lincoln: o.items || [], lincoln_settings: {} },
    mastGetDef: () => "", mastGetDefAudio: () => "", mastPlayDefAudio: () => {},
    momHere: () => o.mom !== false,
    db: { ref: p => ({ set: () => dbWrites.push(p), update: () => dbWrites.push(p), remove: () => dbWrites.push(p) }) },
    document: { getElementById: id => els[id] || null } };
  if (o.noSynth !== true) ctx.speechSynthesis = synth;
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(TTS + "\n" + CARD + "\nthis.TTS_SPELL_RATE=TTS_SPELL_RATE; this.TTS_PREVIEW_TEXT=TTS_PREVIEW_TEXT;", ctx);
  return { ctx, spoken, files, store, els, dbWrites, setVoices: vs => { voices = vs.slice(); } };
}
const pick = vs => { const h = mk({ voices: vs }); h.ctx.mastSpeak("grasp"); return h.spoken[0] && h.spoken[0].voice && h.spoken[0].voice.name; };
const V = (name, lang, extra) => Object.assign({ name, lang, voiceURI: "uri:" + name }, extra || {});

console.log("── the clearest US-English voice, per device ──");
// iPad / Mac Safari: a compact default, an Enhanced and a Premium download, novelty voices.
const APPLE = [V("Fred", "en-US"), V("Albert", "en-US"), V("Daniel", "en-GB", { default: true }), V("Samantha", "en-US"),
  V("Samantha (Enhanced)", "en-US"), V("Ava (Premium)", "en-US"), V("Thomas", "fr-FR")];
ok("Apple: a Premium voice beats Enhanced, compact, the UK default and novelty voices", pick(APPLE) === "Ava (Premium)");
ok("Apple without downloads: Enhanced beats compact Samantha", pick(APPLE.filter(v => !/Premium/.test(v.name))) === "Samantha (Enhanced)");
ok("Apple built-in only: Samantha over Fred / Albert / the UK default", pick([V("Fred", "en-US"), V("Albert", "en-US"), V("Daniel", "en-GB", { default: true }), V("Samantha", "en-US")]) === "Samantha");
ok("novelty voices never picked while any normal English voice exists", pick([V("Zarvox", "en-US"), V("Bad News", "en-US"), V("Karen", "en-AU")]) === "Karen");
// Chrome on a computer.
ok("Chrome desktop: Google US English over Google UK English (the old default-first pick)", pick([V("Google UK English Female", "en-GB", { default: true }), V("Google US English", "en-US"), V("Google Deutsch", "de-DE")]) === "Google US English");
ok("Edge: a Microsoft Natural voice over the classic Zira", pick([V("Microsoft Zira - English (United States)", "en-US", { default: true }), V("Microsoft Aria Online (Natural) - English (United States)", "en-US")]) === "Microsoft Aria Online (Natural) - English (United States)");
// Android / LG with Google speech.
ok("Android: a US network voice over a US local one and a UK one", pick([V("en-gb-x-gba-local", "en-GB"), V("en-us-x-sfg-local", "en-US"), V("en-us-x-iol-network", "en-US")]) === "en-us-x-iol-network");
ok("Android names it plainly: any en-US (underscore lang too) over en-GB", pick([V("English United Kingdom", "en_GB", { default: true }), V("English United States", "en_US")]) === "English United States");
// Fallbacks.
ok("no US voice: any English", pick([V("Anna", "de-DE", { default: true }), V("Karen", "en-AU")]) === "Karen");
ok("no English voice at all: the device default", pick([V("Thomas", "fr-FR"), V("Anna", "de-DE", { default: true })]) === "Anna");
ok("ranked list for the picker is English only, clearest first", (() => { const h = mk({ voices: APPLE }); const r = h.ctx._ttsRanked(APPLE).map(v => v.name); return r[0] === "Ava (Premium)" && r.indexOf("Thomas") < 0 && r.indexOf("Fred") > r.indexOf("Daniel"); })());

console.log("── Mom's choice for this device ──");
{
  const h = mk({ voices: APPLE, store: { ha_tts_voice: "uri:Samantha" } });
  h.ctx.mastSpeak("grasp");
  ok("a stored choice wins over the ranked pick", h.spoken[0].voice.name === "Samantha");
}
{
  const h = mk({ voices: APPLE, store: { ha_tts_voice: "uri:Some Other Mac Voice" } });
  h.ctx.mastSpeak("grasp");
  ok("a choice this device doesn't have → falls back to the ranked pick", h.spoken[0].voice.name === "Ava (Premium)");
}
{
  const h = mk({ voices: APPLE });
  h.ctx.mastSpeak("one");
  h.ctx.ttsVoiceSet("uri:Samantha (Enhanced)");
  ok("ttsVoiceSet saves to this device's storage", h.store.ha_tts_voice === "uri:Samantha (Enhanced)");
  ok("…re-picks immediately and previews in the new voice", h.spoken[1].voice.name === "Samantha (Enhanced)" && h.spoken[1].text === h.ctx.TTS_PREVIEW_TEXT.replace(/\s+/g, " "));
  ok("…the preview is the reported pair (grasp / grass) at spelling speed", /grasp/.test(h.spoken[1].text) && /grass/.test(h.spoken[1].text) && h.spoken[1].rate === h.ctx.TTS_SPELL_RATE);
  h.ctx.ttsVoiceSet("");
  ok("choosing Automatic clears it and goes back to the ranked pick", !("ha_tts_voice" in h.store) && h.spoken[2].voice.name === "Ava (Premium)");
  ok("no Firebase write, ever", h.dbWrites.length === 0);
}
{
  const h = mk({ voices: APPLE, mom: false });
  h.ctx.ttsVoiceSet("uri:Fred");
  ok("not Mom → nothing changes", !("ha_tts_voice" in h.store) && h.spoken.length === 0);
}

console.log("── the Settings card ──");
{
  const h = mk({ voices: APPLE, store: { ha_tts_voice: "uri:Samantha" } });
  const html = h.ctx.renderTtsVoiceCard();
  ok("card lists this device's English voices (not the French one)", /Ava \(Premium\)/.test(html) && !/Thomas/.test(html));
  ok("…an Automatic option naming the ranked pick", /Automatic — clearest available \(Ava \(Premium\)\)/.test(html));
  ok("…Mom's current choice selected", /value="uri:Samantha" selected/.test(html));
  ok("…and a Preview button", /onclick="ttsVoicePreview\(\)"/.test(html));
  ok("Settings renders the card", /pinHtml\+=renderTtsVoiceCard\(\);/.test(src));
}
{
  const h = mk({ voices: [] });
  ok("voices not loaded yet → a loading line, refreshed when they arrive", /Loading this device/.test(h.ctx.renderTtsVoiceCard()));
  h.els["tts-voice-body"] = { innerHTML: "" };
  h.setVoices(APPLE); h.ctx.ttsVoiceCardRefresh();
  ok("…ttsVoiceCardRefresh fills the list in place", /Ava \(Premium\)/.test(h.els["tts-voice-body"].innerHTML));
}
{
  const h = mk({ noSynth: true });
  ok("no speech engine (LG TV) → the card says so plainly", /no speech voices/.test(h.ctx.renderTtsVoiceCard()));
}

console.log("── spelling words: a little slower ──");
{
  const h = mk({ voices: APPLE });
  h.ctx.mastSpeak("abate");
  h.ctx.mastSpeak("grasp", { spell: true });
  ok("default rate unchanged (0.85)", h.spoken[0].rate === 0.85);
  ok("spelling rate is slower, but only slightly", h.spoken[1].rate === h.ctx.TTS_SPELL_RATE && h.ctx.TTS_SPELL_RATE < 0.85 && h.ctx.TTS_SPELL_RATE >= 0.7);
}
{
  const h = mk({ noSynth: true });
  h.ctx.mastSpeak("grasp", { spell: true }); h.ctx.mastSpeak("abate");
  ok("baked file (no engine): a spelling word plays a touch slower, other words at normal speed", h.files[0].rate < 1 && h.files[0].rate > 0.8 && h.files[1].rate === 1, h.files);
}
{
  const h = mk({ voices: APPLE });
  const wrap = { classList: { contains: () => false }, getAttribute: k => ({ "data-say-front": "grasp", "data-tts-spell": "1" })[k] || null };
  h.ctx.ttsFlipSay({ closest: () => wrap });
  ok("a spell flip card (data-tts-spell) reads at the spelling rate", h.spoken[0].rate === h.ctx.TTS_SPELL_RATE);
  ok("ttsFlipAttrs marks a spell card", / data-tts-spell="1"/.test(h.ctx.ttsFlipAttrs({ front: "x", back: "x", spell: 1 })));
}
ok("AAS / spell deck 🔊 (mastSpellSay) → spelling rate", /function mastSpellSay\(id\)\{[\s\S]{0,250}mastSpeak\(String\(it\.prompt\),\{spell:true\}\)/.test(src));
ok("spelling test 🔊 (stSpeak) → spelling rate", /function stSpeak\(\)\{[^\n]*\{spell:true\}\)/.test(src));
ok("Word Workout 🔊 (wwSay) → spelling rate", /function wwSay\(\)\{[^\n]*mastSpeak\(wwWord\(it\),\{spell:true\}\)/.test(src));
ok("Mastery spell card auto-play → spelling rate", /if\(mstIsSpellCard\(card\)\)\{ if\(card\.name\) mastSpeak\(card\.name,\{spell:true\}\); return; \}/.test(src));
ok("Mastery spell flip card marks itself", /ttsFlipAttrs\(\{front:name,back:name,spell:1\}\)/.test(src));
ok("daily drill spell flip card marks itself", /const _ttsSide=_isSpell\?\{front:it\.prompt,back:it\.prompt,spell:1\}/.test(src));
ok("no 🔀 emoji added", src.indexOf("\u{1F500}") < 0);

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
