// 📄 PDFCARDS — a PDF's own text, read on Mom's device, into the ＋ Add cards check screen (no key, no AI, nothing uploaded)
//   (her go 2026-11-22; a beta mom 11/20: "a pic of my notes and a pdf from chat would be all I would use";
//   PLAN_unit_easy_import_2026-11-19.md §3, §9.1, slice F).
//   Runs the REAL CARDSPLIT + CHECKFIX + PDFCARDS blocks and the real unitBatchAdd / unitBatchClose / unitBatchSave, and the
//   real UNITBUILD for the Builder's cards box — with pdf.js and every network call stubbed (no real PDF, no key, no fetch).
//   · lines rebuilt from the text items' positions: a ChatGPT-style table row = one line, cells in order, joined by a tab
//   · page frame left out (page numbers, a link line, the print header, a header row repeated on page 2)
//   · pdf.js is LOADED on demand (nbLoadPdfJs), 15 MB / 40 pages caps, a locked PDF, a reader that can't load → one plain line
//   · a scan (no text) says so; no key → the plan's line; the ✨ offer only with a key AND a path to send it
//   · two-column tables that come out interleaved are fixed with the check screen's ⤓ Join and ↔ Swap
//   · the sheet with no file picked draws byte-identical to the tree without the block, apart from the new button
//   · Add writes exactly what pasting the same text writes; a dry run writes nothing; not Mom → nothing read
//   · the Builder's cards box: a PDF reads its text first (no Claude); a scan offers ✨ only with a key; photos still go to Claude
//   run: node test_pdf_cards.js
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const cut = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error("markers " + a); return src.slice(i, j); };
const fn = name => { const i = src.indexOf("function " + name + "("); if (i < 0) throw new Error("no " + name); let d = 0, j = i, seen = false; for (; j < src.length; j++) { const c = src[j]; if (c === "{") { d++; seen = true; } else if (c === "}") { d--; if (seen && d === 0) break; } } return src.slice(i, j + 1); };
const CS = cut("// CARDSPLIT_START", "// CARDSPLIT_END"), CF = cut("// CHECKFIX_START", "// CHECKFIX_END"), PC = cut("// PDFCARDS_START", "// PDFCARDS_END"), UB = cut("// UNITBUILD_START", "// UNITBUILD_END");
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x).slice(0, 900) : "")); } };
const J = x => JSON.stringify(x);

// ── text items as pdf.js getTextContent() gives them: transform [a,b,c,d,x,y], width, height (page units, y up) ──
const it = (s, x, y, w, h) => ({ str: s, transform: [h || 11, 0, 0, h || 11, x, y], width: w, height: h || 11, dir: "ltr", hasEOL: false });
const sp = (x, y) => it(" ", x, y, 3);   // pdf.js hands spaces over as their own items
// a ChatGPT-style vocabulary table: print header, header row, rows (a bold name, the meaning in two runs), a wrapped meaning,
// a link + page number footer — handed over OUT of order, with a little baseline jitter, as pdf.js can
function chatgptPage1() {
  const A = [
    it("11/20/26, 3:45 PM", 20, 780, 70, 8), it("ChatGPT", 280, 780, 30, 8),
    it("Word", 72, 720, 28), it("Meaning", 200, 720, 45),
    it("Guppy", 72, 700.4, 30), it("A tiny, colorful", 200, 700, 80), sp(280, 700), it("fish", 284, 700, 18),
    it("Neon", 72, 684, 24), sp(96, 684), it("tetra", 99, 684, 24), it("A small fish with a bright blue stripe", 200, 684, 190),
    it("Betta", 72, 668, 27), it("A fish with long, flowing fins that", 200, 668, 170), it("lives alone", 200, 654, 52),
    it("https://chatgpt.com/c/abc123", 20, 30, 120, 8), it("1/2", 560, 30, 12, 8)];
  return [A[9], A[3], A[0], A[14], A[2], A[4], A[11], A[5], A[7], A[1], A[6], A[8], A[10], A[12], A[13], A[15], A[16]];
}
function chatgptPage2() {
  return [it("Word", 72, 720, 28), it("Meaning", 200, 720, 45), it("Molly", 72, 700, 27), it("A calm fish that likes warm water", 200, 700, 165),
    it("Pleco", 72, 684, 27), it("A fish that eats algae", 200, 684, 110), it("2/2", 560, 30, 12, 8)];
}

// a stub pdf.js: getDocument({data}) → {promise: doc}; pages give their items
function fakeLib(pages, o) {
  o = o || {}; const L = { calls: [], pagesAsked: [], destroyed: 0 };
  L.getDocument = arg => { L.calls.push(arg); if (o.reject) return { promise: Promise.reject(o.reject) };
    return { promise: Promise.resolve({ numPages: o.numPages || pages.length, getPage: async p => { L.pagesAsked.push(p); return { getTextContent: async () => ({ items: pages[p - 1] || [] }), cleanup() {} }; }, destroy() { L.destroyed++; } }) }; };
  return L;
}
const pdfFile = (name, size) => ({ name: name || "Fish vocab.pdf", type: "application/pdf", size: size || 40000, arrayBuffer: async () => new Uint8Array([37, 80, 68, 70]).buffer });

function sheetWorld(o) {
  o = o || {}; const writes = [], els = {}, net = [];
  const store = {};
  const el = id => els[id] || (els[id] = { id, value: "", innerHTML: "", textContent: "", style: {}, remove() { delete els[id]; } });
  const lib = o.lib || fakeLib([chatgptPage1(), chatgptPage2()]);
  const ctx = { console, JSON, Object, Array, String, Number, Math, Set, Map, RegExp, Date, parseInt, isNaN, isFinite, Promise, Error, Uint8Array, Infinity,
    unitStudies: { u1: { id: "u1", title: "Fish", enrolled: o.kids === false ? {} : { k1: true }, decks: [{ key: "Fish", mode: "flip", introCap: 3, cards: [{ name: "Goldfish", def: "An orange pond fish", order: 1 }] }] } },
    masteryData: { k1: [] }, mom: o.mom !== false, _dryRun: () => !!o.dry, cap: s => s, mastDefKeyOk: p => !/[.#$\[\]\/]/.test(p), alert() {},
    haKeys: m => m, HA_LS: { setItem() {}, getItem() { return null; } }, renderUnits() {},
    loads: 0, nbLoadPdfJs: () => { ctx.loads++; return o.noLib ? Promise.reject(new Error("could not load the PDF reader (offline?)")) : Promise.resolve(lib); },
    fetch: (...a) => { net.push(a); return Promise.reject(new Error("no network in tests")); },
    db: { ref: p => ({
      transaction: f => { const r = f(store[p] === undefined ? null : JSON.parse(J(store[p]))); store[p] = r; writes.push([p, "tx", r]); return { then: () => {} }; },
      update: v => writes.push([p, "update", JSON.parse(J(v))]), set: v => writes.push([p, "set", v]) }) },
    document: { getElementById: id => els[id] || null, createElement: () => { const x = { style: {}, remove() { if (els[x.id] === x) delete els[x.id]; } }; return x; }, body: { appendChild: x => { els[x.id] = x; } } } };
  if (o.key) ctx.ubCanAsk = () => true;
  ctx.momHere = () => ctx.mom;
  vm.createContext(ctx);
  vm.runInContext(CS + "\n" + CF + "\n" + (o.noBlock ? "" : PC) + "\n" + fn("unitBatchAdd") + "\n" + fn("unitBatchClose") + "\n" + fn("unitBatchSave") + "\nlet unitBatch=null;\nObject.defineProperty(this,'cardSheet',{get:()=>cardSheet,set:v=>{cardSheet=v;}});", ctx);
  const open = () => { ctx.unitBatchAdd("u1", "Fish"); ["unit-batch-txt", "card-sheet-prev", "card-sheet-go", "unit-batch-msg", "card-sheet-file"].forEach(el); return ctx.cardSheet; };
  const pick = async file => { const inp = { files: [file || pdfFile()], value: "C:\\fakepath\\x.pdf" }; const r = await ctx.pdfCardsSheetPick(inp); return { r, inp }; };
  return { ctx, writes, els, el, net, lib, open, pick, note: () => els["card-sheet-file"].innerHTML, prev: () => els["card-sheet-prev"].innerHTML };
}
const rowsOf = S => S.rows.filter(r => !r.drop).map(r => [r.name, r.back]);

(async () => {
  console.log("── lines rebuilt from where the text sits ──");
  {
    const c = sheetWorld().ctx;
    const L = c.pdfItemsLines(chatgptPage1());
    ok("a ChatGPT table: each row is ONE line, its cells in order, joined by a tab (items handed over out of order)",
      J(L) === J(["11/20/26, 3:45 PM\tChatGPT", "Word\tMeaning", "Guppy\tA tiny, colorful fish", "Neon tetra\tA small fish with a bright blue stripe", "Betta\tA fish with long, flowing fins that", "lives alone", "https://chatgpt.com/c/abc123\t1/2"]), L);
    ok("a word gap is a space, a pdf.js space item adds nothing extra, a half-point baseline jitter stays on the line", L[2] === "Guppy\tA tiny, colorful fish" && L[3].startsWith("Neon tetra\t"));
    ok("touching pieces join with no space (a word split in two runs)", J(c.pdfItemsLines([it("Gup", 72, 700, 18), it("py", 90, 700, 12), it("a fish", 200, 700, 30)])) === J(["Guppy\ta fish"]));
    ok("empty / space-only / broken items are skipped", J(c.pdfItemsLines([it("  ", 72, 700, 5), { str: "x" }, null, it("Platy", 72, 690, 25)])) === J(["Platy"]));
    const T = c.pdfPagesText([chatgptPage1(), chatgptPage2()]);
    ok("two pages → one text: the print header, the link + page number footers and page 2's repeated header row are left out",
      T.text === "Word\tMeaning\nGuppy\tA tiny, colorful fish\nNeon tetra\tA small fish with a bright blue stripe\nBetta\tA fish with long, flowing fins that\nlives alone\nMolly\tA calm fish that likes warm water\nPleco\tA fish that eats algae" && T.pages === 2 && !T.scan && T.empty === 0, T);
    const cs = c.cardSplit(T.text);
    ok("…and cardSplit reads it: split at tab, the header row is the columns (not a card)", cs.sep === "tab" && J(cs.columns) === J(["Word", "Meaning"]) && cs.rows[0].name === "Guppy" && cs.rows.length === 6, cs.rows);
    ok("a page with no text at all + a page with text: not a scan, the empty page counted", (r => !r.scan && r.empty === 1 && r.lines === 3)(c.pdfPagesText([[], chatgptPage2()])));
    ok("no text on any page = a scan", (r => r.scan && r.lines === 0 && r.empty === 2)(c.pdfPagesText([[], [it(" ", 1, 1, 1)]])));
    ok("page numbers in their usual shapes are frame, not cards", ["3", "Page 2", "page 2 of 5", "2 / 5", "https://x.org/a", "www.x.org"].every(l => c.pdfcChrome(l)) && !c.pdfcChrome("Guppy") && !c.pdfcChrome("2 fish"));
    const big = []; for (let i = 0; i < 2000; i++) big.push(it("Card number " + i + " has a long meaning to fill the page up", 72, 10000 - i * 12, 300));
    ok("text over 60,000 characters stops there and says so", (r => r.cut && r.text.length <= 60000)(c.pdfPagesText([big])));
  }

  console.log("\n── reading a file: pdf.js loaded on demand, caps, plain lines ──");
  {
    const w = sheetWorld(), c = w.ctx;
    const r = await c.pdfReadText(pdfFile());
    ok("pdf.js is LOADED on demand (nbLoadPdfJs called), handed the file's own bytes, every page asked, the document closed",
      c.loads === 1 && w.lib.calls.length === 1 && w.lib.calls[0].data instanceof c.Uint8Array && w.lib.calls[0].data.length === 4 && J(w.lib.pagesAsked) === "[1,2]" && w.lib.destroyed === 1 && r.total === 2);
    ok("no network: nothing fetched while reading", w.net.length === 0);
    let e1 = ""; try { await c.pdfReadText(pdfFile("big.pdf", 16 * 1024 * 1024)); } catch (e) { e1 = e.message; }
    ok("over 15 MB → one plain line, and the reader is not even loaded", /over 15 MB/.test(e1) && /paste/.test(e1) && c.loads === 1);
    const w2 = sheetWorld({ noLib: true }); let e2 = ""; try { await w2.ctx.pdfReadText(pdfFile()); } catch (e) { e2 = e.message; }
    ok("pdf.js can't load (offline, never cached) → one plain line that says to paste", e2 === "The PDF reader couldn’t load (offline?). Copy the list out of the PDF and paste it in the box instead.", e2);
    const w3 = sheetWorld({ lib: fakeLib([], { reject: Object.assign(new Error("pw"), { name: "PasswordException" }) }) }); let e3 = ""; try { await w3.ctx.pdfReadText(pdfFile()); } catch (e) { e3 = e.message; }
    ok("a password-locked PDF → its own plain line", /locked with a password/.test(e3), e3);
    const w4 = sheetWorld({ lib: fakeLib([], { reject: new Error("Invalid PDF structure") }) }); let e4 = ""; try { await w4.ctx.pdfReadText(pdfFile()); } catch (e) { e4 = e.message; }
    ok("a broken file → \"Couldn’t open that PDF\" (no error text from the library shown)", /^Couldn’t open that PDF/.test(e4) && !/Invalid/.test(e4));
    const pages = []; for (let i = 0; i < 45; i++) pages.push([it("Card" + i + " - meaning " + i, 72, 700, 100)]);
    const w5 = sheetWorld({ lib: fakeLib(pages) }); const r5 = await w5.ctx.pdfReadText(pdfFile());
    ok("a 45-page PDF: the first 40 pages are read, and the line says so", w5.lib.pagesAsked.length === 40 && r5.total === 45 && /Only the first 40 of 45 pages/.test(w5.ctx.pdfcDoneMsg("x.pdf", r5)));
  }

  console.log("\n── the ＋ Add cards sheet: 📄 PDF → the same check screen ──");
  {
    const w = sheetWorld(), c = w.ctx, S = w.open();
    const html = c.cardSheetHTML(S);
    ok("the sheet has a finger-sized 📄 PDF button that takes PDFs only", /id="card-sheet-pdf" accept="application\/pdf,\.pdf" onchange="pdfCardsSheetPick\(this\)"/.test(html) && /min-height:40px/.test(html) && /\\u\{1F4C4\} PDF|📄 PDF/.test(html));
    const { inp } = await w.pick();
    ok("the picker is cleared (the same file can be picked again)", inp.value === "");
    ok("the PDF's text lands in the paste box and the check screen reads it — green rows, split at tab, header row = the columns",
      w.els["unit-batch-txt"].value.startsWith("Word\tMeaning\nGuppy\t") && S.res.sep === "tab" && J(rowsOf(S).slice(0, 3)) === J([["Guppy", "A tiny, colorful fish"], ["Neon tetra", "A small fish with a bright blue stripe"], ["Betta", "A fish with long, flowing fins that"]]) && /#86efac/.test(w.prev()) && /Columns: Word, Meaning/.test(w.prev()), rowsOf(S));
    ok("she is told it was read on this device and nothing was uploaded", /^✓ Read “Fish vocab\.pdf” on this device — 2 pages\. Nothing was uploaded/.test(S.file.msg) && /Nothing was uploaded/.test(w.note()));
    ok("nothing left the device: no fetch, no database write", w.net.length === 0 && w.writes.length === 0);
    ok("the wrapped meaning shows as an amber row (no meaning) — not silently added", (r => r && !r.back)(S.rows.find(r => r.name === "lives alone")) && /lives alone/.test(w.prev()) && c.cardSheetReady(S).length === 5);
    ok("the Add button counts the ready rows", w.els["card-sheet-go"].textContent === "Add 5 cards");
  }
  {
    const w = sheetWorld(), c = w.ctx, S = w.open();
    w.els["unit-batch-txt"].value = "Swordtail - a fish with a long tail"; c.cardSheetInput(w.els["unit-batch-txt"].value);
    await w.pick();
    ok("what she already typed stays in the box; the PDF's text goes under it and is read", w.els["unit-batch-txt"].value.startsWith("Swordtail - a fish with a long tail\nWord\tMeaning") && S.rows.some(r => r.name === "Pleco"));
  }
  {
    const w = sheetWorld({ mom: false }), c = w.ctx; w.ctx.mom = true; const S = w.open(); c.mom = false;
    const { r } = await w.pick();
    ok("not Mom → nothing is read", r === null && c.loads === 0 && !S.file);
  }
  {
    const w = sheetWorld(), c = w.ctx; w.open();
    const p = c.pdfCardsSheetPick({ files: [pdfFile()], value: "" }); c.unitBatchClose(); const r = await p;
    ok("closing the sheet while it reads → nothing lands anywhere", r === null && c.cardSheet === null);
  }

  console.log("\n── Add: the same writes as pasting the same text; a dry run writes nothing ──");
  {
    const wp = sheetWorld(), Sp = wp.open(); await wp.pick(); wp.ctx.unitBatchSave();
    const text = wp.els["unit-batch-txt"].value;
    const wt = sheetWorld({ noBlock: true }), St = wt.open(); wt.els["unit-batch-txt"].value = text; wt.ctx.cardSheetInput(text); wt.ctx.unitBatchSave();
    ok("Add after a PDF writes exactly what Add after pasting that text writes (CHECKFIX's targeted writes, unchanged)", wp.writes.length > 0 && J(wp.writes) === J(wt.writes), wp.writes.map(x => x[0] + " " + x[1]));
    ok("…every write targeted (no whole-node set)", wp.writes.every(x => x[1] !== "set"));
    const wd = sheetWorld({ dry: true }), Sd = wd.open(); await wd.pick(); const read = Sd.rows.length === 6; wd.ctx.unitBatchSave();
    ok("a dry run reads the file but writes nothing", read && wd.writes.length === 0);
  }

  console.log("\n── two-column tables that come out interleaved — fixed with the check screen ──");
  {
    // (1) a meaning that wraps onto a second line of the cell: its tail comes out as its own amber row → ⤓ Join
    const w = sheetWorld(), c = w.ctx, S = w.open(); await w.pick();
    const betta = S.rows.find(r => r.name === "Betta");
    c.checkFixDo("join", betta.id);
    ok("⤓ Join on the row above puts the wrapped tail back on its meaning", betta.back === "A fish with long, flowing fins that lives alone" && !S.rows.some(r => r.name === "lives alone" && !r.drop) && c.cardSheetReady(S).length === 5, rowsOf(S));
  }
  {
    // (2) names set big, meanings small: the meaning's baseline sits above the name's, so each meaning comes out on the line
    //     ABOVE its own name → name-only rows, meaning first. ⤓ Join then ↔ Swap puts each card right.
    const page = [it("Guppy", 72, 694, 50, 18), it("A tiny, colorful fish", 200, 700, 95, 9),
                  it("Molly", 72, 664, 48, 18), it("A calm, round fish", 200, 670, 88, 9)];
    const w = sheetWorld({ lib: fakeLib([page]) }), c = w.ctx, S = w.open(); await w.pick();
    ok("it comes out interleaved: meaning, name, meaning, name — four name-only (amber) rows", J(rowsOf(S)) === J([["A tiny, colorful fish", ""], ["Guppy", ""], ["A calm, round fish", ""], ["Molly", ""]]) && c.cardSheetReady(S).length === 0, rowsOf(S));
    [0, 1].forEach(() => { const r = S.rows.filter(x => !x.drop && !x.back)[0]; c.checkFixDo("join", r.id); c.checkFixDo("swap", r.id); });
    ok("⤓ Join + ↔ Swap on each → two right cards, ready to add", J(rowsOf(S)) === J([["Guppy", "A tiny, colorful fish"], ["Molly", "A calm, round fish"]]) && c.cardSheetReady(S).length === 2 && w.els["card-sheet-go"].textContent === "Add 2 cards", rowsOf(S));
  }

  console.log("\n── a scan (no text) ──");
  {
    const w = sheetWorld({ lib: fakeLib([[], []]) }), c = w.ctx, S = w.open(); await w.pick(pdfFile("notes scan.pdf"));
    ok("a scan says so plainly; no key → the plan's line (what to do instead); no ✨ button", S.file.scan && /“notes scan\.pdf” is a scan/.test(w.note()) && /Needs a Claude key|needs a Claude key/.test(w.note()) && /Admin ▸ Settings ▸ ✨ AI key/.test(w.note()) && /Typing or pasting the lines always works/.test(w.note()) && !/data-pdfc="scan"/.test(w.note()), w.note());
    ok("…the paste box and the rows are left as they were", w.els["unit-batch-txt"].value === "" && !S.rows.length && w.net.length === 0);
  }
  {
    const w = sheetWorld({ lib: fakeLib([[]]), key: true }), c = w.ctx, S = w.open(); await w.pick(pdfFile("scan.pdf"));
    const route = vm.runInContext("typeof cardSheetAskPdf", c) === "function";
    ok("a key but no Claude path on this sheet (this block alone) → no ✨ button, the paste line; with the path → the ✨ button",
      route ? /data-pdfc="scan"/.test(w.note()) : (!/data-pdfc="scan"/.test(w.note()) && /Typing or pasting the lines always works/.test(w.note()) && !/AI key/.test(w.note())), w.note());
  }

  console.log("\n── the sheet with no file picked: byte-identical apart from the new button ──");
  {
    const base = sheetWorld({ noBlock: true }), cur = sheetWorld();
    const Sb = base.open(), Sc = cur.open();
    const hb = base.ctx.cardSheetHTML(Sb), hc = cur.ctx.cardSheetHTML(Sc), bar = cur.ctx.pdfCardsSheetBarHTML(Sc);
    ok("cardSheetHTML minus the 📄 PDF bar = the tree without PDFCARDS, byte for byte", hc.replace(bar, "") === hb && hc !== hb);
    const txt = "Guppy - a tiny fish\nMolly - a calm fish"; [[base, Sb], [cur, Sc]].forEach(([w, S]) => { w.els["unit-batch-txt"].value = txt; w.ctx.cardSheetInput(txt); });
    ok("…and after a paste the check screen draws the same", base.prev() === cur.prev() && base.ctx.cardSheetHTML(Sb) === cur.ctx.cardSheetHTML(Sc).replace(cur.ctx.pdfCardsSheetBarHTML(Sc), ""));
    const ids = h => (h.match(/\sid="([^"]+)"/g) || []).map(x => x.replace(/^\sid="|"$/g, ""));
    const w = sheetWorld({ lib: fakeLib([[]]) }), S = w.open(); await w.pick();
    const all = ids(w.ctx.cardSheetHTML(S));
    ok("every id on the sheet is unique (card-sheet-pdf, card-sheet-file are new)", all.length === new Set(all).size && all.includes("card-sheet-pdf") && all.includes("card-sheet-file"), all);
  }

  console.log("\n── the Builder's 🃏 Cards box ──");
  function ubWorld(o) {
    o = o || {}; const asks = [];
    const lib = o.lib || fakeLib([chatgptPage1(), chatgptPage2()]);
    const ctx = { console, JSON, Object, Array, String, Number, Math, Set, Map, RegExp, Date, parseInt, isNaN, isFinite, Promise, setTimeout, Error, Uint8Array, Infinity,
      unitStudies: {}, momHere: () => true, _dryRun: () => true, db: null, HA_LS: { getItem: () => "Mom", setItem: () => {} },
      renderAll: () => {}, lrSafeUrl: u => /^https:\/\//i.test(String(u || "").trim()) ? String(u).trim() : "",
      kitCapKey: () => (o.key ? "k" : ""), _cbShrinkImage: async () => "IMG", loads: 0,
      nbLoadPdfJs: () => { ctx.loads++; return Promise.resolve(lib); },
      kitCapAsk: async content => { asks.push(content); return '{"items":[{"front":"Pleco","back":"A fish that eats algae"}]}'; },
      FileReader: function () { this.readAsDataURL = f => { this.result = "data:application/pdf;base64,PDFDATA"; this.onload(); }; },
      document: { getElementById: () => null } };
    vm.createContext(ctx);
    vm.runInContext(UB + "\n" + CS + "\n" + PC + "\nObject.defineProperty(this,'ubForm',{get:()=>ubForm,set:v=>{ubForm=v;}});", ctx);
    ctx.ubOpen(); ctx.ubSet("title", "Fish"); ctx.ubGo("fill");
    return { ctx, asks, lib };
  }
  const bcards = w => w.ctx.ubForm.days[0].cards.map(c => [c.front, c.back, !!c.draft]);
  {
    const w = ubWorld(), c = w.ctx;
    await c.ubPhoto(0, "cards", { files: [pdfFile()], value: "" });
    ok("a PDF on the cards box: its text is read here (pdf.js loaded), Claude is NOT asked, no key needed", c.loads === 1 && w.asks.length === 0);
    ok("…the rows land like a paste (not drafted); the header row is not a card", J(bcards(w).slice(0, 2)) === J([["Guppy", "A tiny, colorful fish", false], ["Neon tetra", "A small fish with a bright blue stripe", false]]) && !bcards(w).some(x => x[0] === "Word"), bcards(w));
    ok("…the source says pdftext, and she is told: no AI, nothing uploaded, check each one; the column names left out", c.ubForm.sources.some(s => s.kind === "pdftext" && s.n === 6) && /no AI, nothing uploaded/.test(c.ubForm.msg) && /column names/.test(c.ubForm.msg) && !c.ubForm.pdf, c.ubForm.msg);
  }
  {
    const w = ubWorld({ key: true }), c = w.ctx;
    await c.ubPhoto(0, "cards", { files: [{ name: "a.jpg", type: "image/jpeg" }], value: "" });
    ok("a photo on the cards box still goes to Claude as before", w.asks.length === 1 && w.asks[0].some(b => b.type === "image") && c.loads === 0);
    await c.ubPhoto(0, "books", { files: [pdfFile()], value: "" });
    ok("a PDF on another box (books) still goes to Claude as before", w.asks.length === 2 && w.asks[1].some(b => b.type === "document") && c.loads === 0);
    await c.ubPhoto(0, "cards", { files: [{ name: "a.jpg", type: "image/jpeg" }, pdfFile()], value: "" });
    ok("a photo + a PDF together on the cards box: as before, both to Claude", w.asks.length === 3 && c.loads === 0);
  }
  {
    const w = ubWorld({ lib: fakeLib([[]]) }), c = w.ctx;
    await c.ubPhoto(0, "cards", { files: [pdfFile("scan.pdf")], value: "" });
    const h = c.ubBoxHTML(0, "cards");
    ok("a scan in the Builder, no key: says it's a scan and the key line; no ✨ button; Claude not asked", /“scan\.pdf” is a scan/.test(h) && /Admin ▸ Settings ▸ ✨ AI key/.test(h) && !/data-pdfc="scan"/.test(h) && w.asks.length === 0, h);
    ok("…the note shows on that box only", !/is a scan/.test(c.ubBoxHTML(1, "cards") || "") && !/is a scan/.test(c.ubBoxHTML(0, "books")));
  }
  {
    const w = ubWorld({ lib: fakeLib([[]]), key: true }), c = w.ctx;
    await c.ubPhoto(0, "cards", { files: [pdfFile("scan.pdf")], value: "" });
    ok("a scan with a key: the ✨ Read it with Claude button (finger-sized)", /data-pdfc="scan" onclick="pdfCardsBuilderScan\(\)"/.test(c.ubBoxHTML(0, "cards")) && w.asks.length === 0);
    await c.pdfCardsBuilderScan();
    const a = w.asks[0] || [];
    ok("✨ sends ONLY the PDF and the card prompt (the Builder's own request), and the cards land drafted",
      a.length === 3 && a[0].text === "PDF 1:" && a[1].type === "document" && a[1].source.data === "PDFDATA" && a[2].text === vm.runInContext("UB_PROMPTS.cards", c) && J(bcards(w)) === J([["Pleco", "A fish that eats algae", true]]) && !c.ubForm.pdf, a);
  }
  {
    const w = ubWorld(), c = w.ctx;
    await c.ubPhoto(0, "cards", { files: [pdfFile("huge.pdf", 20 * 1024 * 1024)], value: "" });
    ok("a PDF over 15 MB in the Builder → the plain line, nothing asked", /over 15 MB/.test(c.ubForm.msg) && w.asks.length === 0 && c.loads === 0 && !c.ubForm.pdf);
  }

  console.log("\n── house rules ──");
  ok("no kid's or family name in the block", !/taylor|makenzie|kenzie|andrew|caleb|lincoln|ellis|lucy|julian|dewalt|howe/i.test(PC));
  ok("no 🔀 in the block", PC.indexOf("\u{1F500}") < 0);
  ok("the block never reads the key itself (only ubCanAsk, a yes/no) and never logs", !/kitCapKey|mastAIKey|haGetKey|console\./.test(PC));
  ok("no database or network call in the block", !/db\.ref|fetch\(|XMLHttpRequest/.test(PC));

  console.log("\n" + pass + " passed, " + fail + " failed"); process.exit(fail ? 1 : 0);
})().catch(e => { console.log("CRASH", e); process.exit(1); });
