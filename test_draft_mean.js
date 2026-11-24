// ✨ DRAFTMEAN — "✨ Draft meanings" for names with none, and "✨ Make cards from this text" for running prose, on ＋ Add cards
//   (her words 2026-11-19: "where the AI can help with the vocabulary of the units"; PLAN_unit_easy_import_2026-11-19.md §2.3,
//   §5, slice G; Q3: a button she presses; Q4: claude-sonnet-5-5).
//   Runs the REAL CARDSPLIT + CHECKFIX + PDFCARDS + PHOTOCARDS + SHEETCARDS + DOCXCARDS + PICFOLDER + DRAFTMEAN blocks, the real
//   UNITBUILD (UB_PROMPTS, ubParseAI), the REAL kitCapAsk over a stubbed fetch (so the body checked is the body that would be
//   sent), and the real unitBatchAdd / unitBatchClose / unitBatchSave. No key, no network, no Claude.
//   · the button shows only with name-only rows AND a key; no key → the plain line; ONE request, model claude-sonnet-5-5
//   · the request carries the names, the unit's title / deck and an age band ONLY — no kid's name, no family name (scanned)
//   · drafted meanings: amber + "drafted", not counted until ✓ (PHOTOCARDS' ✓); an empty / "not sure" answer stays empty;
//     they stay on their names when the paste is re-read
//   · a refusal, a cut-off answer, an HTTP error, a network failure, a malformed answer → one plain line, no row changed
//   · prose → cards: the Builder's card prompt + the text only; rows amber + drafted; the sentences stop showing as cards
//   · nothing written; Mom-only; closing mid-request; ids and balanced HTML
//   run: node test_draft_mean.js
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const cut = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error("markers " + a); return src.slice(i, j); };
const fn = name => { const i = src.indexOf("function " + name + "("); if (i < 0) throw new Error("no " + name); let d = 0, j = i, seen = false; for (; j < src.length; j++) { const c = src[j]; if (c === "{") { d++; seen = true; } else if (c === "}") { d--; if (seen && d === 0) break; } } return src.slice(i, j + 1); };
const UB = cut("// UNITBUILD_START", "// UNITBUILD_END"), CS = cut("// CARDSPLIT_START", "// CARDSPLIT_END"), CF = cut("// CHECKFIX_START", "// CHECKFIX_END"),
  PC = cut("// PDFCARDS_START", "// PDFCARDS_END"), PH = cut("// PHOTOCARDS_START", "// PHOTOCARDS_END"), SC = cut("// SHEETCARDS_START", "// SHEETCARDS_END"),
  DX = cut("// DOCXCARDS_START", "// DOCXCARDS_END"), PF = cut("// PICFOLDER_START", "// PICFOLDER_END"), DM = cut("// DRAFTMEAN_START", "// DRAFTMEAN_END");
const ASK = "const KIT_CAP_SLOW_MSG='slow';\nasync " + fn("kitCapAsk");
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x).slice(0, 900) : "")); } };
const J = x => JSON.stringify(x);
const tick = () => new Promise(r => setTimeout(r, 0));
const settle = async n => { for (let i = 0; i < (n || 10); i++) await tick(); };
// a made-up family (never a real one): roster kids "ava" and "ben", family "Testerson"
const PRIV = /\b(?:ava|ben|testerson)\b/i;
const MEANS = '{"items":[{"front":"Dorsal Fin","back":"The fin on top of a fish’s back."},{"front":"Caudal Fin","back":"The tail fin that pushes a fish along."},{"front":"Pelvic Fin","back":""},{"front":"Gill Cover","back":"not sure"},{"front":"Shark","back":"A big fish."}]}';
const PROSE_REPLY = '{"items":[{"front":"Guppy","back":"A tiny fish that lives in warm water"},{"front":"Neon tetra","back":"A small fish that swims in big groups and shines blue"}]}';
const NAMES = "Dorsal Fin\nCaudal Fin\nPelvic Fin\nGill Cover";
const PROSE = "The guppy is a tiny fish that lives in warm water and has babies that swim right away. Neon tetras swim together in big groups and their stripe shines blue under the light.";

function world(o) {
  o = o || {}; const writes = [], els = {}, sent = [], G = { hold: null };
  const el = id => els[id] || (els[id] = { id, value: "", innerHTML: "", textContent: "", disabled: false, style: {}, remove() { delete els[id]; } });
  const reply = () => { const m = o.mode || "ok";
    if (m === "net") return Promise.reject(new TypeError("Failed to fetch"));
    if (m === "http") return Promise.resolve({ ok: false, status: 500, text: async () => "overloaded" });
    const body = { content: [{ type: "text", text: o.reply === undefined ? MEANS : o.reply }], stop_reason: m === "refusal" ? "refusal" : m === "cut" ? "max_tokens" : "end_turn" };
    return Promise.resolve({ ok: true, status: 200, json: async () => body }); };
  const ctx = { console: { log() {}, warn() {}, error() {} }, JSON, Object, Array, String, Number, Math, Set, Map, RegExp, Date, parseInt, isNaN, isFinite, Promise, Error, TypeError, Uint8Array, Infinity, setTimeout, clearTimeout,
    ROSTER: ["ava", "ben"], window: { HA_FAMILY: { familyId: "testerson", familyName: "Testerson Academy" } },
    unitStudies: { u1: { id: "u1", title: o.title === undefined ? "Ava’s Fish of the Testerson Pond" : o.title, ages: o.ages === undefined ? "Ages 5-12" : o.ages, enrolled: { ava: true },
      decks: [{ key: "Fish", mode: "flip", introCap: 3, cards: [{ name: "Goldfish", def: "An orange pond fish", order: 1 }] }] } },
    masteryData: { ava: [] }, mom: o.mom !== false, _dryRun: () => false, cap: s => s.charAt(0).toUpperCase() + s.slice(1), mastDefKeyOk: p => !/[.#$\[\]\/]/.test(p), alert() {},
    haKeys: m => m, HA_LS: { setItem() {}, getItem() { return "Mom"; } }, renderUnits() {}, renderAll() {}, lrSafeUrl: u => u,
    mastAIKey: "", haGetKey: () => o.key === false ? "" : "sk-test",
    _cbShrinkImage: async f => "IMG", FileReader: function () {}, nbLoadPdfJs: () => Promise.reject(new Error("no")),
    fetch: (url, init) => { sent.push({ url, init, body: JSON.parse(init.body) }); if (o.hold) return new Promise(r => { G.hold = () => r(reply()); }); return reply(); },
    navigator: { onLine: true }, URL: { createObjectURL: () => "blob:x", revokeObjectURL() {} },
    db: { ref: p => ({ transaction: f => { const r = f(null); writes.push([p, "tx", r]); return { then: () => {} }; }, update: v => writes.push([p, "update", JSON.parse(J(v))]), set: v => writes.push([p, "set", v]) }) },
    document: { getElementById: id => els[id] || null, createElement: () => { const x = { style: {}, remove() { if (els[x.id] === x) delete els[x.id]; } }; return x; }, body: { appendChild: x => { els[x.id] = x; } } } };
  ctx.momHere = () => ctx.mom;
  vm.createContext(ctx);
  vm.runInContext(ASK + "\nfunction kitCapKey(){ return (typeof mastAIKey!=='undefined'&&mastAIKey)||(typeof haGetKey==='function'?haGetKey():'')||''; }\n" + UB + "\n" + CS + "\n" + CF + "\n" + PC + "\n" + PH + "\n" + SC + "\n" + DX + "\n" + PF + "\n" + (o.noBlock ? "" : DM) + "\n" +
    fn("unitBatchAdd") + "\n" + fn("unitBatchClose") + "\n" + fn("unitBatchSave") +
    "\nlet unitBatch=null;\nObject.defineProperty(this,'cardSheet',{get:()=>cardSheet,set:v=>{cardSheet=v;}});" + (o.noBlock ? "" : "\nObject.defineProperty(this,'draftMean',{get:()=>draftMean});"), ctx);
  const open = text => { ctx.unitBatchAdd("u1", "Fish"); ["unit-batch-txt", "card-sheet-prev", "card-sheet-go", "unit-batch-msg", "card-sheet-file", "pic-folder-panel"].forEach(el);
    if (text != null) { els["unit-batch-txt"].value = text; ctx.cardSheetInput(text); } return ctx.cardSheet; };
  const type = text => { els["unit-batch-txt"].value = text; ctx.cardSheetInput(text); };
  return { ctx, G, writes, els, sent, open, type, prev: () => els["card-sheet-prev"].innerHTML };
}
const live = S => S.rows.filter(r => !r.drop);
const row = (S, n) => live(S).find(r => r.name === n);
const rowsJ = S => J(live(S).map(r => [r.name, r.back, !!r.drafted, !!r.seen]));
const prompt = w => { const b = w.sent[0] && w.sent[0].body; return b ? b.messages[0].content.map(x => x.text).join("\n") : ""; };

(async () => {
  console.log("── ✨ Draft meanings: when it shows ──");
  {
    const w = world(), c = w.ctx, S = w.open(NAMES);
    ok("4 name-only rows + a key → the button, with the count", /data-dm="mean" onclick="draftMeanGo\(\)"[^>]*>✨ Draft meanings \(4\)<\/button>/.test(w.prev()), w.prev().slice(-1500));
    ok("age chips: the unit's own \"Ages 5-12\" (as 5–12) first and picked, then 4–6 · 7–9 · 10–12 · 13+", /data-dm-age="5–12"[^>]*background:#2d6a4f[^>]*>5–12<\/button><button type="button" data-dm-age="4–6"[\s\S]*>13\+<\/button>/.test(w.prev()));
    ok("it says what goes out and that each waits for her ✓", /only the names, the unit’s title and the age go out\. Each waits for your ✓; a name Claude isn’t sure of stays empty/.test(w.prev()));
    w.type("Guppy - a tiny fish\nMolly - a calm fish");
    ok("every row has a meaning → no button", !/data-dm=/.test(w.prev()));
  }
  {
    const w = world({ key: false }), c = w.ctx, S = w.open(NAMES);
    ok("no key → no button, the plain no-key line (the photo door's shape)", !/data-dm="mean"/.test(w.prev()) && /✨ Draft meanings needs a Claude key — Admin ▸ Settings ▸ ✨ AI key\. Typing the meanings always works\./.test(w.prev()));
    await c.draftMeanGo();
    ok("…and the handler sends nothing", w.sent.length === 0);
  }

  console.log("── the request: one, through kitCapAsk, claude-sonnet-5-5, no names ──");
  {
    const w = world(), c = w.ctx, S = w.open(NAMES);
    await c.draftMeanGo();
    const s = w.sent[0] || {}, b = s.body || {}, p = prompt(w);
    ok("ONE request, to api.anthropic.com/v1/messages, from the browser with the family's key (the app's one request path)", w.sent.length === 1 && s.url === "https://api.anthropic.com/v1/messages" && s.init.headers["anthropic-dangerous-direct-browser-access"] === "true" && s.init.headers["x-api-key"] === "sk-test");
    ok("model claude-sonnet-5-5 (Q4), 8000 tokens, one user message with ONE text block", b.model === "claude-sonnet-5-5" && b.max_tokens === 8000 && b.messages.length === 1 && b.messages[0].content.length === 1 && b.messages[0].content[0].type === "text");
    ok("the prompt carries every name, in order", /Names:\n1\. Dorsal Fin\n2\. Caudal Fin\n3\. Pelvic Fin\n4\. Gill Cover$/.test(p), p);
    ok("…the unit's title with the kid's and family's names taken out, and the age band", /for a unit called "Fish of the Pond"/.test(p) && /\(deck: "Fish"\)/.test(p) && /for children aged 5–12\./.test(p), p);
    ok("…one short sentence of plain words; not sure → empty, never guess or invent; strict JSON", /ONE short sentence of plain words a child that age can read/.test(p) && /leave its back empty \(""\) — never guess or invent/.test(p) && /Return ONLY strict JSON: \{"items":\[\{"front":"","back":""\}\]\}/.test(p));
    ok("SCAN: the whole request body has no kid's name and no family name (roster ava · ben, enrolled ava, family Testerson)", !PRIV.test(s.init.body), s.init.body);
    ok("…and nothing from the database: no deck cards, no enrolment, no ages box text beyond the band", !/Goldfish|enrolled|An orange pond fish|Ages 5-12/.test(s.init.body));
    c.draftMeanAge("10–12"); c.draftMeanAge("<b>"); w.sent.length = 0; S.rows.forEach(r => { if (r.drafted) { r.back = ""; r.drafted = false; } }); c.draftMeanGo(); await settle();
    ok("her age tap changes the band; a value not on the chips is ignored", /for children aged 10–12\./.test(prompt(w)));
  }
  {
    const w = world({ title: "Ben's Fish", ages: "Ben is 7" }), c = w.ctx, S = w.open(NAMES); await c.draftMeanGo();
    ok("a title that is just a kid's name + topic: the name comes out; an Ages box with words in it is not used (7–9)", /for a unit called "Fish"/.test(prompt(w)) && /aged 7–9\./.test(prompt(w)) && !PRIV.test(w.sent[0].init.body), prompt(w));
  }
  {
    const w = world(), c = w.ctx;
    await c.kitCapAsk([{ type: "text", text: "x" }], null, { raw: true });
    ok("every other kitCapAsk caller (no model named) still sends claude-sonnet-5", w.sent[0].body.model === "claude-sonnet-5");
  }

  console.log("── the answer: amber, drafted, waits for ✓; empty stays empty ──");
  {
    const w = world(), c = w.ctx, S = w.open(NAMES);
    await c.draftMeanGo();
    ok("Dorsal Fin and Caudal Fin get Claude's meanings, amber + drafted, not yet looked at", (r => r && r.back === "The fin on top of a fish’s back." && r.drafted && !r.seen)(row(S, "Dorsal Fin")) && (r => r && r.drafted)(row(S, "Caudal Fin")) && /data-phc-tag/.test(w.prev()) && /#f59e0b/.test(w.prev()));
    ok("Pelvic Fin (empty) and Gill Cover (\"not sure\") stay empty — nothing invented; a name it wasn't asked (Shark) is not added",
      row(S, "Pelvic Fin").back === "" && !row(S, "Pelvic Fin").drafted && row(S, "Gill Cover").back === "" && !row(S, "Shark"));
    ok("one plain line says what happened", /✓ Claude drafted 2 meanings — each is amber until you’ve looked at it and tapped ✓\. Claude wasn’t sure of 2 — they stay empty; type them in\./.test(w.prev()), w.prev().slice(-900));
    ok("the button now counts the two still empty", /✨ Draft meanings \(2\)/.test(w.prev()));
    ok("NOT counted until ✓: Add says \"Add cards\" and writes nothing", c.cardSheetReady(S).length === 0 && w.els["card-sheet-go"].textContent === "Add cards");
    c.unitBatchSave();
    ok("…tapping Add: PHOTOCARDS' line, nothing written", w.writes.length === 0 && /Tap ✓ on each row Claude read/.test(w.els["unit-batch-msg"].textContent));
    c.photoCardsSeen(row(S, "Dorsal Fin").id);
    ok("✓ (the same ✓ a photo's rows have) → counted", c.cardSheetReady(S).length === 1 && w.els["card-sheet-go"].textContent === "Add 1 card" && /drafted · ✓ looked/.test(w.prev()));
    c.cardSheetEdit(row(S, "Caudal Fin").id, "back", "The tail fin.");
    w.type(NAMES + "\nAnal Fin");
    ok("re-reading the paste: the drafted meanings stay on their names — her ✓ and her edit kept, still waiting where she hadn't ticked",
      (r => r && r.back === "The fin on top of a fish’s back." && r.drafted && r.seen)(row(S, "Dorsal Fin")) && (r => r && r.back === "The tail fin." && r.drafted && !r.seen)(row(S, "Caudal Fin")) && row(S, "Anal Fin").back === "");
    c.unitBatchSave();
    const deck = w.writes.find(x => x[0] === "unitStudies/u1/decks/0/cards");
    ok("Add writes only the ✓ row, through CHECKFIX's writes; no set", deck && J(deck[2].map(x => x.name)) === J(["Dorsal Fin"]) && w.writes.every(x => x[1] !== "set"), w.writes.map(x => x[0]));
  }
  {
    const w = world(), c = w.ctx, S = w.open(NAMES);
    await c.draftMeanGo();
    w.type("Dorsal Fin - my own words\nCaudal Fin\nPelvic Fin\nGill Cover");
    ok("a meaning she types in the paste wins over a drafted one (green, hers)", row(S, "Dorsal Fin").back === "my own words" && !row(S, "Dorsal Fin").drafted && row(S, "Caudal Fin").drafted);
    w.type(NAMES);
    ok("…and replaces the draft for good: taking her words out leaves the name empty, not the old draft back", row(S, "Dorsal Fin").back === "" && !row(S, "Dorsal Fin").drafted && row(S, "Caudal Fin").drafted);
  }

  console.log("── each failure: one plain line, no row changed ──");
  for (const [label, o, re] of [
    ["a refusal", { mode: "refusal" }, /^Claude declined that one — nothing was changed/],
    ["a cut-off answer", { mode: "cut" }, /^Claude’s answer was cut off — nothing was changed/],
    ["an HTTP error", { mode: "http" }, /^Claude couldn’t do it just now — nothing was changed\. Try again, or type them in\. \(Claude 500\)$/],
    ["a network failure", { mode: "net" }, /^Claude couldn’t do it just now — nothing was changed/],
    ["a malformed answer", { reply: "Sorry, here are some ideas: fins are cool." }, /^Claude’s answer wasn’t a list the app could read — nothing was changed/],
    ["half a JSON answer", { reply: '{"items":[{"front":"Dorsal Fin","back":"The' }, /^Claude’s answer wasn’t a list the app could read/],
    ["an answer where every name is blank", { reply: '{"items":[{"front":"Dorsal Fin","back":""},{"front":"Caudal Fin","back":"unknown"}]}' }, /^Claude wasn’t sure of any of those names — nothing was changed/]]) {
    const w = world(o), c = w.ctx, S = w.open(NAMES), before = rowsJ(S);
    await c.draftMeanGo();
    const m = c.draftMean.msg;
    ok(label + " → one plain line, no row changed, the button back", re.test(m) && rowsJ(S) === before && !c.draftMean.busy && /✨ Draft meanings \(4\)/.test(w.prev()) && (w.prev().match(/data-dm-msg/g) || []).length === 1, m);
  }

  console.log("── busy · closing mid-request · Mom-only · the 80 cap ──");
  {
    const w = world({ hold: true }), c = w.ctx, S = w.open(NAMES);
    c.draftMeanGo(); await settle(3);
    ok("while Claude works: the line says so, the button is gone, a second tap sends nothing", /⏳ Claude is drafting meanings…/.test(w.prev()) && !/data-dm="mean"/.test(w.prev()) && (c.draftMeanGo(), w.sent.length === 1));
    c.unitBatchClose(); w.G.hold(); await settle(10);
    ok("she closes the sheet before the answer: set aside — no row of any sheet changed, nothing thrown", S.rows.every(r => !r.drafted) && c.cardSheet === null);
    const S2 = w.open(NAMES);
    ok("a new sheet starts clean (no stale ⏳, no stale message)", !/⏳/.test(w.prev()) && !/data-dm-msg/.test(w.prev()) && /✨ Draft meanings \(4\)/.test(w.prev()));
  }
  {
    const w = world(), c = w.ctx; c.mom = true; const S = w.open(NAMES); c.mom = false;
    await c.draftMeanGo(); await c.draftMeanProse();
    ok("not Mom: neither button sends anything", w.sent.length === 0);
  }
  {
    const names = Array.from({ length: 85 }, (_, i) => "Fish " + (i + 1)).join("\n");
    const reply = J({ items: Array.from({ length: 80 }, (_, i) => ({ front: "Fish " + (i + 1), back: "Fish number " + (i + 1) + "." })) });
    const w = world({ reply }), c = w.ctx, S = w.open(names);
    ok("85 names: the button says 80 and that the rest go next", /✨ Draft meanings \(80\)/.test(w.prev()) && /The first 80 go now; tap again for the rest/.test(w.prev()));
    await c.draftMeanGo();
    ok("…ONE request with the first 80; the next 5 offered", /\n80\. Fish 80$/.test(prompt(w)) && !/Fish 81/.test(prompt(w)) && /Tap ✨ again for the next 5\./.test(c.draftMean.msg) && /✨ Draft meanings \(5\)/.test(w.prev()), c.draftMean.msg);
  }

  console.log("── ✨ Make cards from this text (prose) ──");
  {
    const w = world({ reply: PROSE_REPLY }), c = w.ctx, S = w.open(PROSE);
    ok("running text (the rules found nothing to split) + a key → the prose button; no meanings button", /data-dm="prose" onclick="draftMeanProse\(\)"[^>]*>✨ Make cards from this text<\/button>/.test(w.prev()) && !/data-dm="mean"/.test(w.prev()) && S.res.found === false);
    await c.draftMeanProse();
    const b = w.sent[0].body, parts = b.messages[0].content;
    ok("ONE request: the pasted text, then the Builder's card prompt (\"Use ONLY what is there — never invent\") — as its messy paste sends; model claude-sonnet-5-5",
      w.sent.length === 1 && b.model === "claude-sonnet-5-5" && parts.length === 2 && parts[0].text === "Pasted text:\n" + PROSE && parts[1].text === vm.runInContext("UB_PROMPTS.cards", c) && /Use ONLY what is there — never invent/.test(parts[1].text));
    ok("SCAN: no kid's name, no family name, no unit title, no age band in that body", !PRIV.test(w.sent[0].init.body) && !/Pond|aged/.test(w.sent[0].init.body));
    ok("the cards land amber + drafted (PHOTOCARDS' rows); the sentences themselves no longer show as cards", J(live(S).map(r => r.name)) === J(["Guppy", "Neon tetra"]) && live(S).every(r => r.drafted && !r.seen && r.how === "ai"));
    ok("the line says so; the prose button is gone", /✓ Claude made 2 cards from your text — each is amber until you’ve looked at it and tapped ✓\. The sentences themselves aren’t cards\./.test(w.prev()) && !/data-dm="prose"/.test(w.prev()));
    ok("not counted until ✓", c.cardSheetReady(S).length === 0);
    c.photoCardsSeen(row(S, "Guppy").id);
    ok("✓ one → counted", c.cardSheetReady(S).length === 1);
    w.type(PROSE + " Mollies are calm fish that like company.");
    ok("she changes the text: the sentences show again beside the drafted cards (the ✓ kept), and the button is back", live(S).some(r => r.how === "none") && row(S, "Guppy").seen && /data-dm="prose"/.test(w.prev()));
  }
  {
    const w = world({ key: false }), c = w.ctx, S = w.open(PROSE);
    ok("prose with no key → the plain line instead of the button", !/data-dm="prose"/.test(w.prev()) && /✨ Making cards from running text needs a Claude key — Admin ▸ Settings ▸ ✨ AI key\. One card per line \(“word - meaning”\) always works\./.test(w.prev()));
  }
  for (const [label, o, re] of [["a refusal", { mode: "refusal" }, /^Claude declined/], ["a cut-off answer", { mode: "cut" }, /^Claude’s answer was cut off/], ["a network failure", { mode: "net" }, /^Claude couldn’t do it just now/],
    ["a malformed answer", { reply: "I can't" }, /^Claude’s answer wasn’t a list/], ["no cards", { reply: '{"items":[]}' }, /^Claude found no cards in that text — nothing was changed/]]) {
    const w = world(o), c = w.ctx, S = w.open(PROSE), before = rowsJ(S);
    await c.draftMeanProse();
    ok("prose, " + label + " → one plain line, no row changed", re.test(c.draftMean.msg) && rowsJ(S) === before && !(S.ai && S.ai.length) && /data-dm="prose"/.test(w.prev()), c.draftMean.msg);
  }

  console.log("── nothing else changes: no writes, the sheet's ids, balanced HTML ──");
  {
    const w0 = world({ noBlock: true }), w = world();
    const a = w0.open("Guppy - a tiny fish\nMolly"), b = w.open("Guppy - a tiny fish\nMolly");
    ok("cardSplit's rows are identical with the block in (it adds nothing to a re-read until she drafts)", rowsJ(a) === rowsJ(b) && J(a.res) === J(b.res));
    w0.ctx.unitBatchSave(); w.ctx.unitBatchSave();
    ok("Add writes exactly the same with the block in", J(w0.writes) === J(w.writes));
    ok("the block writes nothing and makes no request of its own (only kitCapAsk)", !/db\.ref|\.set\(|\.update\(|\.transaction\(/.test(DM) && !/fetch\(/.test(DM) && (DM.match(/kitCapAsk\(/g) || []).length === 1);
  }
  {
    const w = world(), c = w.ctx, S = w.open(NAMES);
    c.picFolderPick({ files: [{ name: "dorsal_fin.jpg", type: "image/jpeg", size: 1000, lastModified: 1 }], value: "" });
    const html = c.cardSheetHTML(S);
    const ids = (html.match(/\sid="([^"]+)"/g) || []).map(x => x.slice(5, -1)), dup = ids.filter((x, i) => ids.indexOf(x) !== i);
    ok("no id twice on the sheet with the PDF, File, Photo, Pictures and Draft doors all present", dup.length === 0 && /id="card-sheet-pdf"/.test(html) && /id="card-sheet-xfile"/.test(html) && /id="card-sheet-photo"/.test(html) && /id="card-sheet-pics"/.test(html) && /data-dm="mean"/.test(html), dup);
    const bal = h => { const st = []; const re = /<\/?([a-z0-9]+)\b[^>]*?(\/?)>/gi; let m; const VOID = /^(input|img|br|hr|meta|link)$/i;
      while ((m = re.exec(h))) { const t = m[1].toLowerCase(); if (VOID.test(t) || m[2]) continue; if (m[0][1] === "/") { if (st.pop() !== t) return false; } else st.push(t); } return st.length === 0; };
    const D = c.draftMean, states = [];
    states.push(c.draftMeanBarHTML(S)); D.busy = true; D.what = "mean"; states.push(c.draftMeanBarHTML(S)); D.what = "prose"; states.push(c.draftMeanBarHTML(S)); D.busy = false; D.msg = "x <y>"; states.push(c.draftMeanBarHTML(S));
    c.kitCapKey = () => ""; states.push(c.draftMeanBarHTML(S));
    const wp = world({ key: false }), Sp = wp.open(PROSE); states.push(wp.ctx.draftMeanBarHTML(Sp));
    const wq = world(), Sq = wq.open(PROSE); states.push(wq.ctx.draftMeanBarHTML(Sq));
    ok("balanced HTML in every state of the bar (button, busy ×2, a message, no key ×2, prose) and the whole sheet; a message is escaped", states.every(bal) && bal(html) && states.every(x => x === "" || /^<div data-dm-bar="1">/.test(x)) && /x &lt;y&gt;/.test(states[3]), states.map(bal));
    ok("finger-sized: the ✨ buttons 40px tall, the age chips 34px", /data-dm="mean"[^>]*min-height:40px/.test(states[0]) && /data-dm-age="7–9"[^>]*min-height:34px/.test(states[0]));
  }

  console.log("── what the block does not do ──");
  {
    ok("one DRAFTMEAN block; no 🔀; no kid or family name as a literal", (src.match(/\/\/ DRAFTMEAN_START/g) || []).length === 1 && !DM.includes("\u{1F500}") && !/lincoln|ellis|lucy|julian|howe|dewalt/i.test(DM));
    ok("the model is claude-sonnet-5-5 (Q4); kitCapAsk takes a caller's model and keeps claude-sonnet-5 for everyone else", /const DM_MODEL="claude-sonnet-5-5"/.test(DM) && /model:\(opt&&opt\.model\)\|\|"claude-sonnet-5"/.test(src) && (src.match(/model:DM_MODEL/g) || []).length === 1);
    ok("the key is never read here (yes/no via ubCanAsk only)", !/kitCapKey|mastAIKey|haGetKey|config\//.test(DM));
    ok("hooks: the bar in the preview; drafted meanings kept by cardSheetSplit; both typeof-guarded", /if\(typeof draftMeanBarHTML==="function"\) h\+=draftMeanBarHTML\(S\);/.test(src) && /if\(typeof draftMeanAfterSplit==="function"\) draftMeanAfterSplit\(S\); return S; \}/.test(src));
  }

  console.log("\n" + pass + " passed, " + fail + " failed");
  process.exit(fail ? 1 : 0);
})().catch(e => { console.log("CRASH", e && e.stack || e); process.exit(1); });
