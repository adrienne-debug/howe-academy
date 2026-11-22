// 📸 PHOTOCARDS — a photo of a page on ＋ Add cards, and "✨ Read it with Claude" for a scanned PDF (Claude, only with a key)
//   (her go 2026-11-22; a beta mom 11/20: "just a pic of my notes and a pdf from chat would be all I would use";
//   PLAN_unit_easy_import_2026-11-19.md §1.5, §5, §9.1, slice F).
//   Runs the REAL CARDSPLIT + CHECKFIX + PDFCARDS + PHOTOCARDS blocks, the real UNITBUILD (ubReq / ubFilesContent / ubAsk /
//   ubPhoto / ubParseAI / UB_PROMPTS) and the real unitBatchAdd / unitBatchClose / unitBatchSave, with kitCapAsk, the image
//   shrinker, FileReader and pdf.js stubbed (no real photo, no real PDF, no key, no network).
//   · the request: ONLY the picture(s) / PDF + the Builder's card prompt — the Builder's exact shape; no kid name, unit or deck
//   · rows from Claude are amber + "drafted" and Add leaves them out until she taps ✓; they survive a re-read and the fix tools
//   · no key → the button says so in one line and opens nothing; a refusal / cut-off / empty / failed answer → one plain line
//   · the scan route from PDFCARDS uses the same request; the Builder's own photo/PDF request is unchanged
//   · the sheet with no file picked draws byte-identical to the tree without the block, apart from the new button
//   run: node test_photo_cards.js
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const cut = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error("markers " + a); return src.slice(i, j); };
const fn = name => { const i = src.indexOf("function " + name + "("); if (i < 0) throw new Error("no " + name); let d = 0, j = i, seen = false; for (; j < src.length; j++) { const c = src[j]; if (c === "{") { d++; seen = true; } else if (c === "}") { d--; if (seen && d === 0) break; } } return src.slice(i, j + 1); };
const CS = cut("// CARDSPLIT_START", "// CARDSPLIT_END"), CF = cut("// CHECKFIX_START", "// CHECKFIX_END"), PC = cut("// PDFCARDS_START", "// PDFCARDS_END"),
  PH = cut("// PHOTOCARDS_START", "// PHOTOCARDS_END"), UB = cut("// UNITBUILD_START", "// UNITBUILD_END");
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x).slice(0, 900) : "")); } };
const J = x => JSON.stringify(x);
const REPLY = '{"items":[{"front":"Guppy","back":"A tiny, colorful fish"},{"front":"Molly","back":"A calm fish"},{"front":"Goldfish","back":"An orange pond fish"}]}';
const photo = n => ({ name: n || "notes.jpg", type: "image/jpeg", size: 900000 });
const pdfFile = n => ({ name: n || "scan.pdf", type: "application/pdf", size: 40000, arrayBuffer: async () => new Uint8Array([37, 80, 68, 70]).buffer });
const fakeLib = pages => ({ getDocument: () => ({ promise: Promise.resolve({ numPages: pages.length, getPage: async p => ({ getTextContent: async () => ({ items: pages[p - 1] }), cleanup() {} }), destroy() {} }) }) });

function world(o) {
  o = o || {}; const writes = [], els = {}, asks = [], opts = [], net = [], store = {};
  const el = id => els[id] || (els[id] = { id, value: "", innerHTML: "", textContent: "", style: {}, remove() { delete els[id]; } });
  const ctx = { console, JSON, Object, Array, String, Number, Math, Set, Map, RegExp, Date, parseInt, isNaN, isFinite, Promise, Error, Uint8Array, Infinity, setTimeout,
    unitStudies: { u1: { id: "u1", title: "Fish", enrolled: { k1: true }, decks: [{ key: "Fish", mode: "flip", introCap: 3, cards: [{ name: "Goldfish", def: "An orange pond fish", order: 1 }] }] } },
    masteryData: { k1: [] }, mom: o.mom !== false, _dryRun: () => !!o.dry, cap: s => s, mastDefKeyOk: p => !/[.#$\[\]\/]/.test(p), alert() {},
    haKeys: m => m, HA_LS: { setItem() {}, getItem() { return "Mom"; } }, renderUnits() {}, renderAll() {}, lrSafeUrl: u => u,
    keyReads: 0, kitCapKey: () => { ctx.keyReads++; return o.key === false ? "" : "sk-test"; },
    _cbShrinkImage: async f => "IMG:" + f.name,
    FileReader: function () { this.readAsDataURL = f => { this.result = "data:application/pdf;base64,PDFDATA"; this.onload(); }; },
    nbLoadPdfJs: () => Promise.resolve(fakeLib(o.pages || [[]])),
    kitCapAsk: async (content, tools, opt) => { asks.push(content); opts.push(opt); if (o.throws) throw new Error(o.throws);
      const r = { text: o.reply === undefined ? REPLY : o.reply, stop: o.stop || "end_turn" }; return opt && opt.withStop ? r : r.text; },
    fetch: (...a) => { net.push(a); return Promise.reject(new Error("no network")); },
    db: { ref: p => ({
      transaction: f => { const r = f(store[p] === undefined ? null : JSON.parse(J(store[p]))); store[p] = r; writes.push([p, "tx", r]); return { then: () => {} }; },
      update: v => writes.push([p, "update", JSON.parse(J(v))]), set: v => writes.push([p, "set", v]) }) },
    document: { getElementById: id => els[id] || null, createElement: () => { const x = { style: {}, remove() { if (els[x.id] === x) delete els[x.id]; } }; return x; }, body: { appendChild: x => { els[x.id] = x; } } } };
  ctx.momHere = () => ctx.mom;
  vm.createContext(ctx);
  vm.runInContext(UB + "\n" + CS + "\n" + CF + "\n" + PC + "\n" + (o.noBlock ? "" : PH) + "\n" + fn("unitBatchAdd") + "\n" + fn("unitBatchClose") + "\n" + fn("unitBatchSave") +
    "\nlet unitBatch=null;\nObject.defineProperty(this,'cardSheet',{get:()=>cardSheet,set:v=>{cardSheet=v;}});\nObject.defineProperty(this,'ubForm',{get:()=>ubForm,set:v=>{ubForm=v;}});", ctx);
  const open = () => { ctx.unitBatchAdd("u1", "Fish"); ["unit-batch-txt", "card-sheet-prev", "card-sheet-go", "unit-batch-msg", "card-sheet-file"].forEach(el); return ctx.cardSheet; };
  return { ctx, writes, els, el, asks, opts, net, open, note: () => els["card-sheet-file"].innerHTML, prev: () => els["card-sheet-prev"].innerHTML };
}
const live = S => S.rows.filter(r => !r.drop);

(async () => {
  console.log("── 📸 Photo: what is sent, and to where ──");
  {
    const w = world(), c = w.ctx, S = w.open();
    const n = await c.cardSheetPhoto({ files: [photo("page1.jpg"), photo("page2.jpg")], value: "x" });
    const a = w.asks[0] || [];
    ok("ONE request: Photo 1, image, Photo 2, image, then the Builder's card prompt — nothing else",
      w.asks.length === 1 && J(a.map(b => b.type)) === J(["text", "image", "text", "image", "text"]) && a[0].text === "Photo 1:" && a[1].source.data === "IMG:page1.jpg" && a[1].source.media_type === "image/jpeg" && a[3].source.data === "IMG:page2.jpg" && a[4].text === vm.runInContext("UB_PROMPTS.cards", c), a);
    ok("…the prompt says use ONLY what is there, never invent", /Use ONLY what is there/.test(a[4].text) && /never invent/.test(a[4].text));
    ok("…no kid's name, unit title, deck name or family data rides along", !/k1|Fish\b|Goldfish|Mom/.test(J(a.filter(b => b.type === "text"))));
    ok("…the Builder's request options (raw text, 8000 tokens) + the stop reason, through kitCapAsk (the browser → api.anthropic.com)", J(w.opts[0]) === J({ raw: true, maxTokens: 8000, withStop: true }) && w.net.length === 0);
    ok("Claude's rows land on the check screen amber + drafted; one already in the deck shows greyed", n === 3 && live(S).length === 3 && live(S).every(r => r.drafted && !r.seen) && /#f59e0b/.test(w.prev()) && /data-phc-tag/.test(w.prev()) && (r => r && r.dup)(live(S).find(r => r.name === "Goldfish")));
    ok("she is told how many and that each waits for her look", /^✓ Claude drafted 3 cards from the photos/.test(S.file.msg) && /2 rows Claude read wait for your look/.test(w.prev()));
    ok("Add leaves drafted rows out until she taps ✓ (button: \"Add cards\")", c.cardSheetReady(S).length === 0 && w.els["card-sheet-go"].textContent === "Add cards");
    c.unitBatchSave();
    ok("tapping Add before looking: a plain line, nothing written", w.writes.length === 0 && /Tap ✓ on each row Claude read/.test(w.els["unit-batch-msg"].textContent));
    c.photoCardsSeen(live(S).find(r => r.name === "Guppy").id);
    ok("✓ on a row → green, counted; the other still waits", c.cardSheetReady(S).length === 1 && w.els["card-sheet-go"].textContent === "Add 1 card" && /drafted · ✓ looked/.test(w.prev()) && /1 row Claude read waits/.test(w.prev()));
    w.els["unit-batch-txt"].value = "Platy - a round fish"; c.cardSheetInput("Platy - a round fish");
    ok("typing in the box re-reads the paste — the drafted rows ride along, her ✓ kept", J(live(S).map(r => r.name)) === J(["Platy", "Guppy", "Molly", "Goldfish"]) && live(S).find(r => r.name === "Guppy").seen);
    c.checkFixDo("swap", live(S).find(r => r.name === "Molly").id);
    ok("the fix tools work on a drafted row (↔ Swap) and it still waits for ✓", (r => r && r.back === "Molly" && r.drafted && !r.seen)(live(S).find(r => r.name === "A calm fish")));
    c.checkFixDo("drop", live(S).find(r => r.name === "A calm fish").id); c.cardSheetInput("Platy - a round fish");
    ok("a dropped drafted row stays dropped after a re-read", !live(S).some(r => r.name === "A calm fish"));
    c.unitBatchSave();
    const deck = w.writes.find(x => x[0] === "unitStudies/u1/decks/0/cards");
    ok("Add writes the typed row and the ✓ row, through CHECKFIX's own writes (targeted, no set)", w.writes.length > 0 && w.writes.every(x => x[1] !== "set") && J(w.writes).includes('"Guppy"') && J(w.writes).includes('"Platy"') && !J(w.writes).includes("Molly"), w.writes.map(x => x[0]));
  }
  {
    const w = world({ dry: true }), c = w.ctx, S = w.open(); await c.cardSheetPhoto({ files: [photo()], value: "" });
    live(S).forEach(r => c.photoCardsSeen(r.id)); c.unitBatchSave();
    ok("a dry run: Claude's rows show and can be ticked, but Add writes nothing", live(S).length === 3 && w.writes.length === 0);
  }

  console.log("\n── no key, refusals, cut-off answers ──");
  {
    const w = world({ key: false }), c = w.ctx, S = w.open();
    const bar = c.pdfCardsSheetBarHTML(S);
    ok("no key → 📸 is a plain button, not a file picker", /data-phc="nokey"/.test(bar) && !/card-sheet-photo/.test(bar));
    c.cardSheetPhotoNoKey();
    ok("…tapping it says so in one plain line, and nothing else happens", S.file.msg === "📸 Photo needs a Claude key — Admin ▸ Settings ▸ ✨ AI key. Typing or pasting the lines always works." && w.asks.length === 0 && !S.rows.length);
    await c.cardSheetPhoto({ files: [photo()], value: "" });
    ok("…even a photo handed in directly is not sent", w.asks.length === 0);
  }
  for (const [label, o, re] of [
    ["a refusal (stop_reason refusal) → one plain line, no rows", { stop: "refusal" }, /^Claude declined that one — type or paste the list instead\.$/],
    ["kitCapAsk's own refusal error → the same plain line", { throws: "Claude declined that one — try 📋 Pasted text." }, /^Claude declined that one — type or paste/],
    ["a cut-off answer (max_tokens) → one plain line, no half rows", { stop: "max_tokens", reply: '{"items":[{"front":"Guppy","back":"A ti' }, /^Claude’s answer was cut off/],
    ["an answer with no cards → one plain line", { reply: '{"items":[]}' }, /^Claude found no cards in that/],
    ["an answer that isn't the list → one plain line", { reply: "Sorry, I can't see a list." }, /^Claude couldn’t read it just now/],
    ["a failed call → one plain line with the status, never the error body", { throws: "Claude 401 — {\"error\":\"invalid x-api-key sk-test\"}" }, /^Claude couldn’t read it just now — try again, or type or paste the list\. \(Claude 401\)$/]]) {
    const w = world(o), c = w.ctx, S = w.open(); await c.cardSheetPhoto({ files: [photo()], value: "" });
    ok(label, re.test(S.file.msg) && !S.rows.length && !/sk-test|x-api-key/.test(w.note()), S.file.msg);
  }
  {
    const w = world(), c = w.ctx; w.open();
    const p = c.cardSheetPhoto({ files: [photo()], value: "" }); c.unitBatchClose(); await p;
    ok("closing the sheet while Claude reads → nothing lands", c.cardSheet === null);
    const w2 = world(), S2 = w2.open(); w2.ctx.mom = false; await w2.ctx.cardSheetPhoto({ files: [photo()], value: "" });
    ok("not Mom → nothing sent", w2.asks.length === 0 && !S2.rows.length);
  }

  console.log("\n── the scan route: ✨ Read it with Claude ──");
  {
    const w = world(), c = w.ctx, S = w.open();
    await c.pdfCardsSheetPick({ files: [pdfFile("notes scan.pdf")], value: "" });
    ok("a scanned PDF with a key → the ✨ Read it with Claude button on the sheet", S.file.scan && /data-pdfc="scan" onclick="cardSheetAskPdf\(\)"/.test(w.note()) && w.asks.length === 0);
    await c.cardSheetAskPdf();
    const a = w.asks[0] || [];
    ok("✨ sends ONLY that PDF (whole, as a document block) + the card prompt", J(a.map(b => b.type)) === J(["text", "document", "text"]) && a[0].text === "PDF 1:" && a[1].source.media_type === "application/pdf" && a[1].source.data === "PDFDATA" && a[2].text === vm.runInContext("UB_PROMPTS.cards", c), a);
    ok("…its rows are amber + drafted; she is told they came from the PDF", live(S).length === 3 && live(S).every(r => r.drafted) && /from the PDF/.test(S.file.msg));
  }
  {
    const w = world({ key: false }), c = w.ctx, S = w.open(); await c.pdfCardsSheetPick({ files: [pdfFile()], value: "" });
    ok("a scan with no key: no ✨ button, the key line", !/data-pdfc="scan"/.test(w.note()) && /AI key/.test(w.note()));
    await c.cardSheetAskPdf();
    ok("…and ✨ called anyway sends nothing", w.asks.length === 0);
  }

  console.log("\n── the Builder's own request is unchanged ──");
  {
    const w = world(), c = w.ctx; c.ubOpen(); c.ubSet("title", "Fish"); c.ubGo("fill");
    await c.ubPhoto(0, "cards", { files: [photo("a.jpg")], value: "" });
    const a = w.asks[0];
    ok("the Builder's 📸: the same blocks and prompt, options exactly {raw, maxTokens 8000} as before", J(a.map(b => b.type)) === J(["text", "image", "text"]) && a[2].text === vm.runInContext("UB_PROMPTS.cards", c) && J(w.opts[0]) === J({ raw: true, maxTokens: 8000 }) && c.ubForm.days[0].cards.length === 3 && c.ubForm.days[0].cards.every(x => x.draft));
    const w2 = world({ pages: [[]] }), c2 = w2.ctx; c2.ubOpen(); c2.ubSet("title", "Fish"); c2.ubGo("fill");
    await c2.ubPhoto(0, "cards", { files: [pdfFile()], value: "" }); await c2.pdfCardsBuilderScan();
    ok("the Builder's scan route goes through the same helper: PDF 1 + document + the prompt", J(w2.asks[0].map(b => b.type)) === J(["text", "document", "text"]) && c2.ubForm.days[0].cards.length === 3);
  }

  console.log("\n── the sheet with no file picked: byte-identical apart from the new button ──");
  {
    const base = world({ noBlock: true }), cur = world(); const Sb = base.open(), Sc = cur.open();
    const btn = cur.ctx.photoCardsBtnHTML();
    ok("cardSheetHTML minus the 📸 button = the tree without PHOTOCARDS, byte for byte", cur.ctx.cardSheetHTML(Sc).replace(btn, "") === base.ctx.cardSheetHTML(Sb) && cur.ctx.cardSheetHTML(Sc) !== base.ctx.cardSheetHTML(Sb));
    const txt = "Guppy - a tiny fish\nMolly - a calm fish"; [[base, Sb], [cur, Sc]].forEach(([w, S]) => { w.els["unit-batch-txt"].value = txt; w.ctx.cardSheetInput(txt); });
    ok("…and a pasted list's check screen draws the same", base.prev() === cur.prev() && /Check — 2 cards/.test(cur.prev()));
    await cur.ctx.cardSheetPhoto({ files: [photo()], value: "" });
    const ids = cur.ctx.cardSheetHTML(Sc).match(/\sid="[^"]+"/g).map(x => x.trim());
    ok("every id on the sheet is unique, with Claude's rows in it (card-sheet-photo is new)", ids.length === new Set(ids).size && ids.includes('id="card-sheet-photo"'), ids);
  }

  console.log("\n── house rules ──");
  ok("no kid's or family name in the block", !/taylor|makenzie|kenzie|andrew|caleb|lincoln|ellis|lucy|julian|dewalt|howe/i.test(PH));
  ok("no 🔀 in the block", PH.indexOf("\u{1F500}") < 0);
  ok("the block never reads, shows or logs the key (only ubCanAsk, a yes/no)", !/kitCapKey|mastAIKey|haGetKey|x-api-key|console\./.test(PH));
  ok("no database or direct network call in the block (the request is kitCapAsk's, via ubReq)", !/db\.ref|fetch\(|XMLHttpRequest/.test(PH) && /ubReq\("cards"/.test(PH));
  ok("finger-sized buttons (40px; the ✓ uses the check screen's 36px tool size)", /min-height:40px/.test(cut("const PDFC_BTN", "\n")) && /CF_BTN/.test(PH));

  console.log("\n" + pass + " passed, " + fail + " failed"); process.exit(fail ? 1 : 0);
})().catch(e => { console.log("CRASH", e); process.exit(1); });
