// 📄 DOCXCARDS — a Word file (.docx) read on Mom's device into the ＋ Add cards check screen (her ask 2026-11-19;
//   PLAN_unit_easy_import_2026-11-19.md §1.6, §3 Files, slice D).
//   Runs the REAL CARDSPLIT + CHECKFIX + PDFCARDS + PHOTOCARDS + SHEETCARDS + DOCXCARDS blocks, the real kitZipEntries /
//   kitInflate (the browser's DecompressionStream — Node has it too) and the real unitBatchAdd / unitBatchClose / unitBatchSave.
//   The .docx files are real zips built byte by byte below, their parts DEFLATED as Word writes them (zlib), no network.
//   · docxXmlLines: paragraphs → lines; a soft break → a new line; a tab stays a tab; Heading / Title → "# "; a table row → one
//     line, cells joined by a tab (two paragraphs in a cell → one cell); tracked deletions, field codes, a text box's fallback
//     copy and paragraph settings left out; entities decoded; a nested table stays inside its cell
//   · the sheet: 📄 File (Excel · CSV · Word) takes .docx; paragraphs and a 2-column table → the SAME check screen, green rows
//   · .doc (old Word) and Pages said plainly; a locked .docx, a zip that isn't Word, a Word file with no text, an empty file
//   · the same file picked twice isn't doubled; Add writes what pasting the same text writes; a dry run writes nothing
//   run: node test_docx_cards.js
const fs = require("fs"), path = require("path"), vm = require("vm"), zlib = require("zlib");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const cut = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error("markers " + a); return src.slice(i, j); };
const fn = name => { const i = src.indexOf("function " + name + "("); if (i < 0) throw new Error("no " + name); let d = 0, j = i, seen = false; for (; j < src.length; j++) { const c = src[j]; if (c === "{") { d++; seen = true; } else if (c === "}") { d--; if (seen && d === 0) break; } } return src.slice(i, j + 1); };
const afn = name => { const i = src.indexOf("async function " + name + "("); if (i < 0) throw new Error("no " + name); return "async " + fn(name); };
const CS = cut("// CARDSPLIT_START", "// CARDSPLIT_END"), CF = cut("// CHECKFIX_START", "// CHECKFIX_END"), PC = cut("// PDFCARDS_START", "// PDFCARDS_END"),
  PH = cut("// PHOTOCARDS_START", "// PHOTOCARDS_END"), SC = cut("// SHEETCARDS_START", "// SHEETCARDS_END"), DX = cut("// DOCXCARDS_START", "// DOCXCARDS_END");
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x).slice(0, 900) : "")); } };
const J = x => JSON.stringify(x);
const enc = s => new TextEncoder().encode(s);

// ── a zip, byte by byte: entries deflated (method 8) unless store:true ──
const CRC = (() => { const t = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return b => { let c = 0xFFFFFFFF; for (const x of b) c = t[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }; })();
function zip(files) {
  const parts = [], central = []; let off = 0;
  files.forEach(f => { const name = enc(f.name), raw = typeof f.data === "string" ? enc(f.data) : f.data, crc = CRC(raw), method = f.store ? 0 : 8, data = f.store ? raw : zlib.deflateRawSync(raw);
    const h = Buffer.alloc(30); h.writeUInt32LE(0x04034b50, 0); h.writeUInt16LE(20, 4); h.writeUInt16LE(method, 8); h.writeUInt32LE(crc, 14); h.writeUInt32LE(data.length, 18); h.writeUInt32LE(raw.length, 22); h.writeUInt16LE(name.length, 26);
    const c = Buffer.alloc(46); c.writeUInt32LE(0x02014b50, 0); c.writeUInt16LE(20, 4); c.writeUInt16LE(20, 6); c.writeUInt16LE(method, 10); c.writeUInt32LE(crc, 16); c.writeUInt32LE(data.length, 20); c.writeUInt32LE(raw.length, 24); c.writeUInt16LE(name.length, 28); c.writeUInt32LE(off, 42);
    parts.push(h, name, data); central.push(c, name); off += 30 + name.length + data.length; });
  const cd = Buffer.concat(central.map(x => Buffer.from(x))), e = Buffer.alloc(22); e.writeUInt32LE(0x06054b50, 0); e.writeUInt16LE(files.length, 8); e.writeUInt16LE(files.length, 10); e.writeUInt32LE(cd.length, 12); e.writeUInt32LE(off, 16);
  return new Uint8Array(Buffer.concat(parts.map(x => Buffer.from(x)).concat([cd, e])));
}
// WordprocessingML pieces
const W = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape"';
const run = t => '<w:r><w:rPr><w:b/></w:rPr><w:t xml:space="preserve">' + t + '</w:t></w:r>';
const para = (t, style, extra) => '<w:p><w:pPr>' + (style ? '<w:pStyle w:val="' + style + '"/>' : '') + '<w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr><w:tabs><w:tab w:val="left" w:pos="2880"/></w:tabs></w:pPr>' + (Array.isArray(t) ? t.join("") : run(t)) + (extra || "") + '</w:p>';
const cell = (...ps) => '<w:tc><w:tcPr><w:tcW w:w="4000" w:type="dxa"/></w:tcPr>' + ps.map(p => para(p)).join("") + '</w:tc>';
const table = rows => '<w:tbl><w:tblPr><w:tblStyle w:val="TableGrid"/></w:tblPr><w:tblGrid><w:gridCol w:w="4000"/><w:gridCol w:w="4000"/></w:tblGrid>' + rows.map(r => '<w:tr><w:trPr><w:cantSplit/></w:trPr>' + r.map(c => Array.isArray(c) ? cell(...c) : cell(c)).join("") + '</w:tr>').join("") + '</w:tbl>';
const docXml = body => '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:document ' + W + '><w:body>' + body + '<w:sectPr><w:pgSz w:w="12240" w:h="15840"/></w:sectPr></w:body></w:document>';
const docx = (body, o) => zip([
  { name: "[Content_Types].xml", data: '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>' },
  { name: "_rels/.rels", data: '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>' },
  { name: "word/document.xml", data: docXml(body) },
  { name: "word/media/image1.png", data: new Uint8Array(2000).fill(7), store: !!(o && o.storePic) }]);

// paragraphs: a heading, two list lines with a dash, a tracked deletion, a field code, a soft break, a text box with its fallback
const PARAS = para("Parts of a Fish", "Heading1") +
  para([run("Mouth – takes in "), '<w:del w:id="1"><w:r><w:delText>old words </w:delText></w:r></w:del>', run("food &amp; water")]) +
  para([run("Gills – breathe "), '<w:r><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:instrText> PAGE </w:instrText></w:r><w:r><w:fldChar w:fldCharType="separate"/></w:r>', run("underwater"), '<w:r><w:fldChar w:fldCharType="end"/></w:r>']) +
  para([run("Fins – help it steer"), '<w:r><w:br/></w:r>', run("Tail – pushes it forward")]) +
  para([run("Scales"), '<w:r><w:tab/></w:r>', run("protect its skin"), '<w:r><mc:AlternateContent><mc:Choice Requires="wps"><w:drawing><wps:txbx><w:txbxContent>' + para("Lateral line – feels movement") + '</w:txbxContent></wps:txbx></w:drawing></mc:Choice><mc:Fallback><w:pict><w:txbxContent>' + para("Lateral line – feels movement") + '</w:txbxContent></w:pict></mc:Fallback></mc:AlternateContent></w:r>']) +
  '<w:p/>' + para("");
// a 2-column table: the column names, a cell with two paragraphs, an entity
const TABLE = table([["Word", "Meaning"], ["Guppy", "A tiny, colorful fish"], ["Neon tetra", ["A small fish", "with a blue stripe"]], ["Betta", "Says &quot;hi&quot; with &lt;long&gt; fins"]]);

function sheetWorld(o) {
  o = o || {}; const writes = [], els = {}, net = [];
  const store = {};
  const el = id => els[id] || (els[id] = { id, value: "", innerHTML: "", textContent: "", style: {}, remove() { delete els[id]; } });
  const ctx = { console, JSON, Object, Array, String, Number, Math, Set, Map, RegExp, Date, parseInt, isNaN, isFinite, Promise, Error, Uint8Array, DataView, Infinity, TextDecoder, TextEncoder, Blob, Response, DecompressionStream,
    unitStudies: { u1: { id: "u1", title: "Pond", enrolled: { k1: true }, decks: [{ key: "Pond", mode: "flip", introCap: 3, cards: [{ name: "Goldfish", def: "An orange pond fish", order: 1 }] }] } },
    masteryData: { k1: [] }, mom: true, _dryRun: () => !!o.dry, cap: s => s, mastDefKeyOk: p => !/[.#$\[\]\/]/.test(p), alert() {},
    haKeys: m => m, HA_LS: { setItem() {}, getItem() { return null; } }, renderUnits() {}, loads: 0,
    haNeedXlsx: () => { ctx.loads++; return Promise.reject(new Error("no SheetJS here")); },
    nbLoadPdfJs: () => Promise.reject(new Error("no pdf.js here")),
    fetch: (...a) => { net.push(a); return Promise.reject(new Error("no network in tests")); },
    db: { ref: p => ({
      transaction: f => { const r = f(store[p] === undefined ? null : JSON.parse(J(store[p]))); store[p] = r; writes.push([p, "tx", r]); return { then: () => {} }; },
      update: v => writes.push([p, "update", JSON.parse(J(v))]), set: v => writes.push([p, "set", v]) }) },
    document: { getElementById: id => els[id] || null, createElement: () => { const x = { style: {}, remove() { if (els[x.id] === x) delete els[x.id]; } }; return x; }, body: { appendChild: x => { els[x.id] = x; } } } };
  ctx.momHere = () => ctx.mom;
  vm.createContext(ctx);
  vm.runInContext(CS + "\n" + CF + "\n" + PC + "\n" + PH + "\n" + (o.noBlock ? "" : SC + "\n" + (o.noDocx ? "" : DX)) + "\n" + fn("kitCsvParse") + "\n" + afn("kitInflate") + "\n" + afn("kitZipEntries") + "\n" + fn("unitBatchAdd") + "\n" + fn("unitBatchClose") + "\n" + fn("unitBatchSave") + "\nlet unitBatch=null;\nObject.defineProperty(this,'cardSheet',{get:()=>cardSheet,set:v=>{cardSheet=v;}});", ctx);
  const open = () => { ctx.unitBatchAdd("u1", "Pond"); ["unit-batch-txt", "card-sheet-prev", "card-sheet-go", "unit-batch-msg", "card-sheet-file", "card-sheet-cols"].forEach(el); return ctx.cardSheet; };
  const pick = async f => { const inp = { files: [f], value: "C:\\fakepath\\" + f.name }; const r = await ctx.sheetCardsPick(inp); return { r, inp }; };
  return { ctx, writes, els, el, net, open, pick, box: () => els["unit-batch-txt"].value, panel: () => els["card-sheet-cols"].innerHTML, prev: () => els["card-sheet-prev"].innerHTML };
}
const file = (name, data, type) => { const b = typeof data === "string" ? enc(data) : data; return { name, type: type || "", size: b.length, arrayBuffer: async () => b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) }; };
const rowsOf = S => S.rows.filter(r => !r.drop).map(r => [r.name, r.back]);
const balanced = h => { const st = []; const voids = /^(input|br|img|hr|meta|link)$/i; for (const m of h.matchAll(/<(\/?)([a-z][a-z0-9]*)\b[^>]*?(\/?)>/gi)) { const t = m[2].toLowerCase(); if (voids.test(t) || m[3]) continue; if (m[1]) { if (st.pop() !== t) return false; } else st.push(t); } return st.length === 0; };

(async () => {
  const G = sheetWorld().ctx;
  console.log("── the XML walk (pure) ──");
  {
    const L = G.docxXmlLines(docXml(PARAS));
    ok("paragraphs → lines: the heading marked, a deletion and a field code left out, & decoded, a soft break = a new line, a tab kept, the text box once (its fallback copy left out), empty paragraphs gone",
      J(L) === J(["# Parts of a Fish", "Mouth – takes in food & water", "Gills – breathe underwater", "Fins – help it steer", "Tail – pushes it forward", "Lateral line – feels movement", "Scales\tprotect its skin"]), L);
    ok("…the paragraph's own tab stops (w:tabs in its settings) are not tabs in the text; list numbers aren't text", !L.some(l => /^\t|2880|^\d/.test(l)));
    const T = G.docxXmlLines(docXml(TABLE));
    ok("a 2-column table: each row one line, cells joined by a tab; a cell's two paragraphs = one cell; entities decoded",
      J(T) === J(["Word\tMeaning", "Guppy\tA tiny, colorful fish", "Neon tetra\tA small fish with a blue stripe", 'Betta\tSays "hi" with <long> fins']), T);
    const N = G.docxXmlLines(docXml(table([["Outer", '<!--x-->']]).replace("<!--x-->", "") + table([["Fish", "Facts"]]).replace('</w:tc></w:tr></w:tbl>', table([["a", "b"]]) + '</w:tc></w:tr></w:tbl>')));
    ok("a table inside a cell stays inside that cell (no stray rows)", N.length === 2 && N[1] === "Fish\tFacts a b", N);
    ok("a Title-style paragraph is a heading too; numeric entities decode", J(G.docxXmlLines(docXml(para("Fish &#8211; &#x1F41F;", "Title")))) === J(["# Fish – 🐟"]));
    ok("nothing in, nothing out", J(G.docxXmlLines("")) === "[]" && J(G.docxXmlLines(docXml(""))) === "[]");
  }

  console.log("\n── reading a real .docx (deflated, as Word writes it) ──");
  {
    const t = await G.docxReadText(docx(PARAS + TABLE));
    ok("kitZipEntries + the walk → the text: paragraphs, then the table", t.startsWith("# Parts of a Fish\nMouth – takes in food & water") && t.endsWith("Neon tetra\tA small fish with a blue stripe\nBetta\tSays \"hi\" with <long> fins"), t);
    const err = async b => { try { await G.docxReadText(b); return "no error"; } catch (e) { return e.message; } };
    ok("a locked .docx (an encrypted Word file is not a zip) says so", /locked with a password/.test(await err(new Uint8Array([0xD0, 0xCF, 0x11, 0xE0, 0, 0, 0, 0]))));
    ok("a zip that isn't a Word file says it couldn't open it", /Couldn’t open that Word file/.test(await err(zip([{ name: "xl/workbook.xml", data: "<x/>" }]))));
    ok("not a zip at all → the same line", /Couldn’t open that Word file/.test(await err(enc("just some words"))));
    ok("a Word file with only a picture says it has no text", /no text the app can read/.test(await err(docx('<w:p><w:r><w:drawing/></w:r></w:p>'))));
  }

  console.log("\n── the sheet: 📄 File takes Word ──");
  {
    const w = sheetWorld(), c = w.ctx, S = w.open();
    const html = c.cardSheetHTML(S);
    ok("the door says Excel · CSV · Word and takes .docx (and .doc, only to explain it)", /\(Excel · CSV · Word\)/.test(html) && /accept="[^"]*,\.docx,\.doc,application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document,application\/msword"/.test(html));
    const { inp, r } = await w.pick(file("Parts.docx", docx(PARAS)));
    ok("the picker is cleared; no spreadsheet library or network for a Word file", inp.value === "" && !!r && c.loads === 0 && w.net.length === 0 && w.writes.length === 0);
    ok("the paragraphs go in the paste box and the SAME check screen reads them: heading offered, dash split, green rows",
      S.res.heading === "Parts of a Fish" && J(rowsOf(S)) === J([["Mouth", "takes in food & water"], ["Gills", "breathe underwater"], ["Fins", "help it steer"], ["Tail", "pushes it forward"], ["Lateral line", "feels movement"], ["Scales", "protect its skin"]]) && /#86efac/.test(w.prev()) && !/#f59e0b/.test(w.prev()) && /Make it a new deck/.test(w.prev()), rowsOf(S));
    ok("she is told it was read here and nothing was uploaded", /Read “Parts\.docx” on this device — nothing was uploaded/.test(w.panel()) && balanced(w.panel()) && balanced(c.cardSheetHTML(S)));
    await w.pick(file("Parts.docx", docx(PARAS)));
    ok("the same file picked twice: its lines replace themselves, not doubled", (w.box().match(/Mouth/g) || []).length === 1);
    await w.pick(file("Table.docx", docx(TABLE)));
    ok("a 2-column table: name | meaning, its Word | Meaning row = the columns (not a card), green", J(rowsOf(S)) === J([["Guppy", "A tiny, colorful fish"], ["Neon tetra", "A small fish with a blue stripe"], ["Betta", 'Says "hi" with <long> fins']]) && /Columns: Word, Meaning/.test(w.prev()) && S.res.sep === "tab", rowsOf(S));
    await w.pick(file("Titled.docx", docx(para("Fish Vocabulary", "Heading1") + TABLE)));
    ok("NOTE (cardSplit, as with a pasted titled table): a heading over a table → the heading is the deck offered and the table's Word | Meaning row comes in as a row — one ✕",
      S.res.heading === "Fish Vocabulary" && J(rowsOf(S)[0]) === J(["Word", "Meaning"]) && rowsOf(S).length === 4, rowsOf(S));
  }
  {
    const w = sheetWorld(), S = w.open();
    for (const [n, re] of [["old.doc", /older Word file \(\.doc\), which the app can’t read\. In Word, File ▸ Save As ▸ Word Document \(\.docx\)/], ["notes.pages", /Pages file — in Pages, Share ▸ Export ▸ Word/], ["notes.odt", /Word \(\.docx\) and PDF files here\. For this one, copy the list and paste it/], ["locked.docx", /locked with a password/], ["empty.docx", /That file is empty/], ["pic.docx", /no text the app can read/]]) {
      const data = n === "locked.docx" ? new Uint8Array([0xD0, 0xCF, 0x11, 0xE0, 1, 2]) : n === "empty.docx" ? new Uint8Array(0) : n === "pic.docx" ? docx('<w:p><w:r><w:drawing/></w:r></w:p>') : new Uint8Array([0xD0, 0xCF, 0x11, 0xE0, 9]);
      await w.pick(file(n, data));
      ok(n + " → one plain line; nothing lands", re.test(w.panel()) && w.box() === "" && !S.rows.length, w.panel());
    }
  }
  {
    const w = sheetWorld({ noDocx: true }), S = w.open();
    await w.pick(file("Parts.docx", docx(PARAS)));
    ok("without this block a .docx is a wrong-type file (and the door says Excel · CSV)", /copy the list and paste it/.test(w.panel()) && w.box() === "" && /\(Excel · CSV\)/.test(w.ctx.cardSheetHTML(S)));
  }

  console.log("\n── Add: the same writes as pasting the same text; a dry run writes nothing ──");
  {
    const wp = sheetWorld(), Sp = wp.open(); await wp.pick(file("Table.docx", docx(TABLE))); wp.ctx.unitBatchSave();
    const text = wp.box();
    const wt = sheetWorld({ noBlock: true }), St = wt.open(); wt.els["unit-batch-txt"].value = text; wt.ctx.cardSheetInput(text); wt.ctx.unitBatchSave();
    ok("Add after a Word file writes exactly what Add after pasting that text writes (CHECKFIX's targeted writes, unchanged)", wp.writes.length > 0 && J(wp.writes) === J(wt.writes), wp.writes.map(x => x[0] + " " + x[1]));
    ok("…every write targeted (no whole-node set)", wp.writes.every(x => x[1] !== "set"));
    const wd = sheetWorld({ dry: true }), Sd = wd.open(); await wd.pick(file("Table.docx", docx(TABLE))); const read = Sd.rows.length === 3; wd.ctx.unitBatchSave();
    ok("a dry run reads the file but writes nothing", read && wd.writes.length === 0);
  }
  ok("no 🔀 in the block", !/🔀|\\u\{1F500\}/.test(DX));

  console.log("\n" + pass + " passed, " + fail + " failed");
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
