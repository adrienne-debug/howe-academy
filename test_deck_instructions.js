/*
 * Node tests for per-deck "How to" instructions (DECKINSTR_START / DECKINSTR_END, 2026-09-27).
 *   · the field is read from mastery/<kid>_settings/cat_instructions[deck] (+ cat_instructions_kid)
 *   · Save writes a TARGETED update({[deck]:text}) on those two paths — never the whole map,
 *     never a set(); Mom-only; inert under ?dryrun=1; clipped to 240 chars; blank → null (delete)
 *   · the strip renders only when the deck has text, and follows the card on screen
 *   · kid-facing text wins on the strip; falls back to the main note when empty
 *   · collapsed / expanded remembered per device in localStorage
 *   · the missing list counts decks with no note and orders them LA first, then A→Z
 *   · wiring: the hooks in index.html (deck page, slideshow, quiz list, Sprint, Match, Today & Week)
 *
 *   run:  node test_deck_instructions.js
 */
const fs = require("fs"), path = require("path");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
let pass = 0, fail = 0;
function ok(n, c, x) { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x) + ")" : "")); } }

const a = src.indexOf("// DECKINSTR_START"), z = src.indexOf("// DECKINSTR_END");
ok("DECKINSTR block present", a > 0 && z > a);
const block = src.slice(a, z);

// ── harness: build the block with stubbed globals; every db call is recorded ──
function mk(opts) {
  opts = opts || {};
  const writes = [], ls = {};
  const db = { ref(p) { return { update(v) { writes.push({ path: p, op: "update", v }); }, set(v) { writes.push({ path: p, op: "set", v }); } }; } };
  const els = {};
  const document = {
    getElementById(id) { return els[id] || null; },
    querySelectorAll() { return []; },
  };
  const env = {
    masteryData: opts.masteryData || {},
    masteryKid: opts.masteryKid || "lincoln",
    mhqKid: opts.mhqKid || opts.masteryKid || "lincoln",
    mhqDeck: null,
    ROSTER: opts.roster || ["lincoln", "ellis", "lucy", "julian"],
    db: opts.db === null ? null : db,
    _dryRun: () => !!opts.dryrun,
    momHere: () => opts.mom !== false,
    HA_LS: { getItem: k => (k in ls ? ls[k] : null), setItem: (k, v) => { ls[k] = String(v); }, removeItem: k => { delete ls[k]; } },
    document,
    renderAll: () => { env.renders++; },
    setTimeout: (fn) => { fn(); },
    mhqDeckStats: (kid) => (opts.decks && opts.decks[kid] ? opts.decks[kid] : []).map(d => ({ deck: d })),
    cap: s => s.charAt(0).toUpperCase() + s.slice(1),
    mastAdminLocal: {},
    renders: 0,
  };
  const names = Object.keys(env);
  const exportsList = ["DECKINSTR_MAX", "DECKINSTR_LA_FIRST", "deckInstrClean", "deckInstrGet", "deckInstrText", "deckInstrCollapsed", "deckInstrToggle", "deckInstrStripHtml", "deckInstrOrder", "deckInstrMissing", "deckInstrMissingHtml", "mhqOpenDeckInstr", "deckInstrEditorHtml", "deckInstrSet", "deckInstrSave"];
  const fn = new Function(...names, block + "\nreturn {" + exportsList.join(",") + ", _env:{get mhqKid(){return mhqKid;},get mhqDeck(){return mhqDeck;}}};");
  const api = fn(...names.map(n => env[n]));
  return { api, writes, ls, els, env };
}

// ── 1. reading the field ──
{
  const md = { lincoln_settings: { cat_instructions: { Spelling: "  Say it, then spell it.\r\n " }, cat_instructions_kid: { Spelling: "Spell it out loud" } } };
  const { api } = mk({ masteryData: md });
  ok("deckInstrGet reads cat_instructions[deck] (trimmed)", api.deckInstrGet("lincoln", "Spelling").main === "Say it, then spell it.");
  ok("deckInstrGet reads cat_instructions_kid[deck]", api.deckInstrGet("lincoln", "Spelling").kid === "Spell it out loud");
  ok("deckInstrGet empty for a deck with nothing", api.deckInstrGet("lincoln", "Nouns").main === "" && api.deckInstrGet("lincoln", "Nouns").kid === "");
  ok("deckInstrGet empty for a kid with no settings", api.deckInstrGet("lucy", "Spelling").main === "");
  ok("deckInstrText: kid-facing text wins", api.deckInstrText("lincoln", "Spelling") === "Spell it out loud");
  md.lincoln_settings.cat_instructions_kid = {};
  ok("deckInstrText: falls back to the main note when the kid line is empty", api.deckInstrText("lincoln", "Spelling") === "Say it, then spell it.");
  ok("deckInstrText: '' with no deck", api.deckInstrText("lincoln", null) === "");
}

// ── 2. writing — targeted update on mastery/<kid>_settings/cat_instructions ──
{
  const { api, writes, env } = mk({ masteryData: {}, masteryKid: "ellis", mhqKid: "ellis" });
  const r = api.deckInstrSet("ellis", "Phonograms", "Say each sound.", "Say the sounds");
  ok("deckInstrSet returns true for Mom", r === true);
  ok("exactly two writes (main + kid map)", writes.length === 2, writes);
  ok("write 1 path is mastery/<kid>_settings/cat_instructions", writes[0].path === "mastery/ellis_settings/cat_instructions");
  ok("write 1 is a targeted update({[deck]:text})", writes[0].op === "update" && JSON.stringify(writes[0].v) === JSON.stringify({ Phonograms: "Say each sound." }));
  ok("write 2 path is mastery/<kid>_settings/cat_instructions_kid", writes[1].path === "mastery/ellis_settings/cat_instructions_kid");
  ok("write 2 is a targeted update({[deck]:text})", writes[1].op === "update" && JSON.stringify(writes[1].v) === JSON.stringify({ Phonograms: "Say the sounds" }));
  ok("no set() anywhere", writes.every(w => w.op === "update"));
  ok("local masteryData updated", env.masteryData.ellis_settings.cat_instructions.Phonograms === "Say each sound." && env.masteryData.ellis_settings.cat_instructions_kid.Phonograms === "Say the sounds");

  // blank → null (delete the key), other decks untouched
  env.masteryData.ellis_settings.cat_instructions.Other = "keep me";
  writes.length = 0;
  api.deckInstrSet("ellis", "Phonograms", "", "");
  ok("blank note writes {[deck]:null} (delete), not the whole map", JSON.stringify(writes[0].v) === JSON.stringify({ Phonograms: null }) && !("Other" in writes[0].v));
  ok("blank kid line writes {[deck]:null}", JSON.stringify(writes[1].v) === JSON.stringify({ Phonograms: null }));
  ok("local key removed; other deck untouched", !("Phonograms" in env.masteryData.ellis_settings.cat_instructions) && env.masteryData.ellis_settings.cat_instructions.Other === "keep me");

  // 240-char cap
  writes.length = 0;
  api.deckInstrSet("ellis", "Spelling", "x".repeat(300), "");
  ok("note clipped to 240 chars", writes[0].v.Spelling.length === 240 && api.DECKINSTR_MAX === 240);
}
{
  const { api, writes, env } = mk({ masteryData: {}, mom: false });
  const r = api.deckInstrSet("lincoln", "Spelling", "hi", "");
  ok("not Mom → no write, returns false", r === false && writes.length === 0 && !env.masteryData.lincoln_settings);
  ok("not Mom → no editor card on the deck page", api.deckInstrEditorHtml("lincoln", "Spelling") === "");
  ok("not Mom → no missing list", api.deckInstrMissingHtml(1) === "");
}
{
  const { api, writes, env } = mk({ masteryData: {}, dryrun: true });
  const r = api.deckInstrSet("lincoln", "Spelling", "hi", "");
  ok("?dryrun=1 → no Firebase write, local state still updates", r === true && writes.length === 0 && env.masteryData.lincoln_settings.cat_instructions.Spelling === "hi");
}
{
  const { api, writes } = mk({ masteryData: {}, db: null });
  api.deckInstrSet("lincoln", "Spelling", "hi", "");
  ok("no db → no throw, no write", writes.length === 0);
}
// Save button path: reads the two boxes, writes for the HQ kid, updates the status span
{
  const { api, writes, els } = mk({ masteryData: {}, masteryKid: "lincoln", mhqKid: "lucy" });
  els["deckinstr-main"] = { value: "Read the rule, then the example." };
  els["deckinstr-kid"] = { value: "" };
  els["deckinstr-status"] = { textContent: "" };
  api.deckInstrSave("Capitalization");
  ok("deckInstrSave writes for the kid HQ is showing (mhqKid)", writes[0].path === "mastery/lucy_settings/cat_instructions" && writes[0].v.Capitalization === "Read the rule, then the example.");
  ok("deckInstrSave marks Saved", els["deckinstr-status"].textContent === "✓ Saved");
}

// ── 3. the strip ──
{
  const md = { lincoln_settings: { cat_instructions: { Spelling: "Say the word, then spell it.", Punctuation: "Find the end mark." } } };
  const { api, ls } = mk({ masteryData: md });
  ok("no text → no strip", api.deckInstrStripHtml("lincoln", "Grammar") === "");
  ok("no deck → no strip", api.deckInstrStripHtml("lincoln", undefined) === "");
  const s1 = api.deckInstrStripHtml("lincoln", "Spelling");
  ok("strip shows when the deck has text", /class="deck-instr"/.test(s1) && s1.includes("How to") && s1.includes("Say the word, then spell it."));
  ok("strip carries the deck it belongs to", s1.includes('data-deck="Spelling"'));
  ok("strip toggles on tap", s1.includes('onclick="deckInstrToggle()"'));
  // follows the current card: same expression the slideshow hook uses
  const slideList = [{ subject: "Spelling" }, { subject: "Punctuation" }, { subject: "Grammar" }];
  const at = i => api.deckInstrStripHtml("lincoln", (slideList[i] || {}).subject);
  ok("card 0 → Spelling strip", at(0).includes('data-deck="Spelling"'));
  ok("card 1 → Punctuation strip (deck changed mid-drill)", at(1).includes('data-deck="Punctuation"') && at(1).includes("Find the end mark."));
  ok("card 2 → no strip (deck has no text)", at(2) === "");
  ok("past the end → no strip, no throw", at(9) === "");
  // kid-facing text on the strip
  md.lincoln_settings.cat_instructions_kid = { Spelling: "Spell it out loud" };
  const s2 = api.deckInstrStripHtml("lincoln", "Spelling");
  ok("strip shows the kid-facing line when set", s2.includes("Spell it out loud") && !s2.includes("Say the word, then spell it."));
  // escaping
  md.lincoln_settings.cat_instructions.Grammar = "<b>bold</b> & \"q\"";
  ok("strip escapes HTML", api.deckInstrStripHtml("lincoln", "Grammar").includes("&lt;b&gt;bold&lt;/b&gt; &amp; &quot;q&quot;"));
  // collapsed state per device
  ok("default: expanded (full text visible, short hidden)", /di-full" style="display:block/.test(s1) && /di-short" style="display:none/.test(s1));
  api.deckInstrToggle();
  ok("toggle → collapsed flag in localStorage", ls["ha_deckinstr_collapsed"] === "1" && api.deckInstrCollapsed() === true);
  const s3 = api.deckInstrStripHtml("lincoln", "Punctuation");
  ok("collapsed: one-line short shown, full hidden", /di-short" style="display:inline/.test(s3) && /di-full" style="display:none/.test(s3));
  api.deckInstrToggle();
  ok("toggle again → expanded, flag cleared", !("ha_deckinstr_collapsed" in ls) && api.deckInstrCollapsed() === false);
}

// ── 4. missing list: counts and LA-first order ──
{
  const { api } = mk({});
  const ord = api.deckInstrOrder(["Zebras", "Grammar", "Bible", "Spelling", "Capitalization", "aas words", "Math Facts"]);
  ok("LA decks first in her order, then A→Z (case-insensitive)", JSON.stringify(ord) === JSON.stringify(["Capitalization", "Spelling", "aas words", "Grammar", "Bible", "Math Facts", "Zebras"]), ord);
  ok("her LA list is complete", JSON.stringify(api.DECKINSTR_LA_FIRST) === JSON.stringify(["Capitalization", "Punctuation", "Spelling", "AAS Words", "SpellingYouSee", "Phonograms", "Nouns & Pronouns", "Articles", "Subject-Verb Agreement", "Plural Nouns", "Verb Tenses", "Grammar"]));
}
{
  const md = {
    lincoln_settings: { cat_instructions: { Spelling: "done" } },
    lucy_settings: { cat_instructions_kid: { Phonograms: "kid line only" } },
  };
  const { api } = mk({ masteryData: md, decks: { lincoln: ["Math Facts", "Spelling", "Grammar", "Bible"], lucy: ["Phonograms", "Articles"], ellis: [], julian: ["Colors"] } });
  const m = api.deckInstrMissing({ lincoln: ["Math Facts", "Spelling", "Grammar", "Bible"], lucy: ["Phonograms", "Articles"], ellis: [], julian: ["Colors"] });
  ok("counts every deck with no note across kids", m.total === 5, m);
  ok("a deck with only a kid line counts as done", !m.byKid.find(g => g.kid === "lucy").decks.includes("Phonograms"));
  ok("kids with nothing missing are left out", !m.byKid.find(g => g.kid === "ellis"));
  ok("per kid, LA first then A→Z", JSON.stringify(m.byKid.find(g => g.kid === "lincoln").decks) === JSON.stringify(["Grammar", "Bible", "Math Facts"]));
  const html = api.deckInstrMissingHtml(1);
  ok("HQ list headline counts", html.includes("\u{1F4DD} 5 decks have no instructions yet"));
  ok("HQ list names each kid", html.includes("Lincoln") && html.includes("Lucy") && html.includes("Julian") && !html.includes("Ellis"));
  ok("each deck is a tap that opens that kid's deck page", html.includes("mhqOpenDeckInstr('lincoln','Grammar')") && html.includes("mhqOpenDeckInstr('lucy','Articles')"));
  ok("LA deck listed before the rest in the HTML", html.indexOf("'lincoln','Grammar'") < html.indexOf("'lincoln','Bible'"));
  ok("singular wording for one deck", (function () { const o = mk({ masteryData: {}, decks: { lincoln: ["Bible"] }, roster: ["lincoln"] }); return o.api.deckInstrMissingHtml(1).includes("1 deck has no instructions yet"); })());
  ok("nothing missing → nothing rendered", mk({ masteryData: { lincoln_settings: { cat_instructions: { Bible: "x" } } }, decks: { lincoln: ["Bible"] }, roster: ["lincoln"] }).api.deckInstrMissingHtml(1) === "");
}
// tap → deck page with the note box focused
{
  const { api, els, env } = mk({ masteryData: {}, mhqKid: "lincoln" });
  let focused = false, scrolled = false;
  els["deckinstr-main"] = { focus() { focused = true; }, scrollIntoView() { scrolled = true; } };
  api.mhqOpenDeckInstr("lucy", "Articles");
  ok("mhqOpenDeckInstr switches HQ to that kid + deck and re-renders", api._env.mhqKid === "lucy" && api._env.mhqDeck === "Articles" && env.renders === 1);
  ok("…and focuses the textarea", focused && scrolled);
}

// ── 5. editor card ──
{
  const md = { lincoln_settings: { cat_instructions: { Spelling: "Say it & spell it" }, cat_instructions_kid: { Spelling: "Spell it" } } };
  const { api } = mk({ masteryData: md });
  const e = api.deckInstrEditorHtml("lincoln", "Spelling");
  ok("editor has the note textarea with the saved text, capped at 240", /<textarea id="deckinstr-main" maxlength="240"/.test(e) && e.includes("Say it &amp; spell it</textarea>"));
  ok("editor has the kid-facing input with the saved text", /<input id="deckinstr-kid" maxlength="240" value="Spell it"/.test(e));
  ok("Save calls deckInstrSave for this deck", e.includes("onclick=\"deckInstrSave('Spelling')\""));
  ok("editor never supplies text for an empty deck", (function () { const o = mk({ masteryData: {} }); const h = o.api.deckInstrEditorHtml("lincoln", "Grammar"); return h.includes('placeholder="How to work this deck') && h.includes("></textarea>") && h.includes("No instructions yet"); })());
  ok("no auto-generated / mode-specific hints in the block", !/flash\s*:|flip\s*:|spell\s*:|quiz\s*:/i.test(block.replace(/\/\/.*$/gm, "")));
}

// ── 6. wiring in index.html ──
ok("deck page renders the editor under the deck settings", /_mhqDeckSettings\(kid,deck\):'';\n\s*h\+=\(typeof deckInstrEditorHtml==="function"\)\?deckInstrEditorHtml\(kid,deck\):'';/.test(src));
ok("slideshow strip follows the card on screen", /h\+='<div style="padding:10px 14px">';\n\s*if\(typeof deckInstrStripHtml==="function"\) h\+=deckInstrStripHtml\(masteryKid,\(slideList\[mastSlideIdx\]\|\|\{\}\)\.subject\);/.test(src));
ok("slideshow strip sits above the card", src.indexOf("deckInstrStripHtml(masteryKid,(slideList[mastSlideIdx]||{}).subject)") < src.indexOf("h+=mastSlideCardsHtml[mastSlideIdx];"));
ok("quiz list strip per deck section", /mast-section-lbl">'\+qEmoji\+' '\+qcat\+[^\n]*\n\s*if\(typeof deckInstrStripHtml==="function"\) h\+=deckInstrStripHtml\(masteryKid,qcat\);/.test(src));
ok("Sprint tab strip when one deck is picked", /if\(deckFilter&&typeof deckInstrStripHtml==="function"\) h\+=deckInstrStripHtml\(masteryKid,deckFilter\);/.test(src));
ok("Match round strip for that deck", /if\(typeof deckInstrStripHtml==="function"\) h\+=deckInstrStripHtml\(masteryKid,st\.deck\);/.test(src));
ok("Match strip sits above the board", src.indexOf("deckInstrStripHtml(masteryKid,st.deck)") < src.indexOf("if(st.pausedAt&&!st.endTs){"));
ok("Today & Week shows the missing list", /h\+=\(typeof deckInstrMissingHtml==="function"\)\?deckInstrMissingHtml\(pn\):'';/.test(src));
ok("missing list hook is inside _mhqRenderWeekView", (function () { const f = src.indexOf("function _mhqRenderWeekView"); const g = src.indexOf("function _mhqRenderDeckPage"); const i = src.indexOf("deckInstrMissingHtml(pn)"); return i > f && i < g; })());
ok("the only Firebase paths the block writes are the two cat_instructions maps", (function () { const n = (block.match(/db\.ref\(/g) || []).length; return n === 2 && /db\.ref\("mastery\/"\+kid\+"_settings\/cat_instructions"\)\.update\(\{\[deck\]:main\|\|null\}\)/.test(block) && /db\.ref\("mastery\/"\+kid\+"_settings\/cat_instructions_kid"\)\.update\(\{\[deck\]:kidText\|\|null\}\)/.test(block); })());
ok("block never calls set() / whole-node writes", !/\.set\(/.test(block) && !/\.remove\(/.test(block));
ok("block writes only when db && !_dryRun()", /db&&!\(typeof _dryRun==="function"&&_dryRun\(\)\)/.test(block));
ok("no scheduler code touched (no MOMLOOP/DAYSTART/SCHOOLEND/REPROJ in block)", !/MOMLOOP_|DAYSTART_|SCHOOLEND_|REPROJ_/.test(block));
ok("no 🔀 in index.html", !src.includes("\u{1F500}"));

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
