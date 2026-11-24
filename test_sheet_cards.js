// 📄 SHEETCARDS — an Excel workbook, a CSV / TSV or a .txt list, read on Mom's device into the ＋ Add cards check screen
//   (her ask 2026-11-19: "Mom could import an Excel sheet"; PLAN_unit_easy_import_2026-11-19.md §3 Files, §6, slice C).
//   Runs the REAL CARDSPLIT + CHECKFIX + PDFCARDS + SHEETCARDS blocks, the real kitCsvParse, and the real unitBatchAdd /
//   unitBatchClose / unitBatchSave — on stubs. No network: the workbook is a real .xlsx zip built byte by byte below (3 tabs + a
//   hidden one); it is read by SheetJS when `require("xlsx")` finds it, else by a small stand-in for the four SheetJS calls the
//   block makes (read with sheetRows, SheetNames / Workbook.Sheets[i].Hidden, utils.sheet_to_json header:1, utils.decode_range).
//   · the column guesser: header row = first row with 2+ filled cells; title row; column-name words; short Title words over long
//     cells; no header; row numbers; one column; links / picture names never guessed
//   · CSV with commas, quotes and line breaks inside cells (kitCsvParse); a ";" CSV; TSV; UTF-16 and Windows-1252 text
//   · the sheet: 📄 File door (finger-sized, ids unique beside 📄 PDF and 📸 Photo), the library AWAITED before any read on every
//     pick (also a second file picked while it loads), tab chips, column dropdowns, "Row N is a card", the same check screen
//   · an empty file, one column (names, meanings blank, nothing invented), a huge sheet (500-row cap), a wrong-type file, a
//     reader that can't load, a locked workbook, not Mom, the sheet closed mid-read, the same file picked twice
//   · Add writes exactly what pasting the same text writes; a dry run writes nothing; nothing is fetched
//   run: node test_sheet_cards.js
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const cut = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error("markers " + a); return src.slice(i, j); };
const fn = name => { const i = src.indexOf("function " + name + "("); if (i < 0) throw new Error("no " + name); let d = 0, j = i, seen = false; for (; j < src.length; j++) { const c = src[j]; if (c === "{") { d++; seen = true; } else if (c === "}") { d--; if (seen && d === 0) break; } } return src.slice(i, j + 1); };
const CS = cut("// CARDSPLIT_START", "// CARDSPLIT_END"), CF = cut("// CHECKFIX_START", "// CHECKFIX_END"), PC = cut("// PDFCARDS_START", "// PDFCARDS_END"), SC = cut("// SHEETCARDS_START", "// SHEETCARDS_END"), PH = cut("// PHOTOCARDS_START", "// PHOTOCARDS_END");
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x).slice(0, 900) : "")); } };
const J = x => JSON.stringify(x);
const enc = s => new TextEncoder().encode(s);

// ── a real .xlsx, built byte by byte: a zip (stored entries, CRC-32) of the SpreadsheetML parts ──
const CRC = (() => { const t = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return b => { let c = 0xFFFFFFFF; for (const x of b) c = t[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }; })();
function zip(files) {   // [{name, data:string|Uint8Array}] → Uint8Array
  const parts = [], central = []; let off = 0;
  files.forEach(f => { const name = enc(f.name), data = typeof f.data === "string" ? enc(f.data) : f.data, crc = CRC(data);
    const h = Buffer.alloc(30); h.writeUInt32LE(0x04034b50, 0); h.writeUInt16LE(20, 4); h.writeUInt32LE(crc, 14); h.writeUInt32LE(data.length, 18); h.writeUInt32LE(data.length, 22); h.writeUInt16LE(name.length, 26);
    const c = Buffer.alloc(46); c.writeUInt32LE(0x02014b50, 0); c.writeUInt16LE(20, 4); c.writeUInt16LE(20, 6); c.writeUInt32LE(crc, 16); c.writeUInt32LE(data.length, 20); c.writeUInt32LE(data.length, 24); c.writeUInt16LE(name.length, 28); c.writeUInt32LE(off, 42);
    parts.push(h, name, data); central.push(c, name); off += 30 + name.length + data.length; });
  const cd = Buffer.concat(central.map(x => Buffer.from(x))), e = Buffer.alloc(22); e.writeUInt32LE(0x06054b50, 0); e.writeUInt16LE(files.length, 8); e.writeUInt16LE(files.length, 10); e.writeUInt32LE(cd.length, 12); e.writeUInt32LE(off, 16);
  return new Uint8Array(Buffer.concat(parts.map(x => Buffer.from(x)).concat([cd, e])));
}
const xesc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const colL = c => { let s = ""; c++; while (c > 0) { const m = (c - 1) % 26; s = String.fromCharCode(65 + m) + s; c = Math.floor((c - 1) / 26); } return s; };
// tabs: [{name, rows:[[cell…]], hidden}] — strings go in the shared-string table, numbers as numbers
function xlsx(tabs) {
  const ss = [], si = s => { let i = ss.indexOf(s); if (i < 0) { ss.push(s); i = ss.length - 1; } return i; };
  const sheets = tabs.map(t => { let w = 1; const rows = t.rows.map((r, ri) => '<row r="' + (ri + 1) + '">' + r.map((v, ci) => { if (v === "" || v == null) return ""; w = Math.max(w, ci + 1); const ref = colL(ci) + (ri + 1);
      return typeof v === "number" ? '<c r="' + ref + '"><v>' + v + '</v></c>' : '<c r="' + ref + '" t="s"><v>' + si(v) + '</v></c>'; }).join("") + '</row>').join("");
    const dim = t.rows.length ? "A1:" + colL(Math.max(0, ...t.rows.map(r => r.length - 1))) + t.rows.length : "A1";
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><dimension ref="' + dim + '"/><sheetData>' + rows + '</sheetData></worksheet>'; });
  const files = [
    { name: "[Content_Types].xml", data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' + tabs.map((t, i) => '<Override PartName="/xl/worksheets/sheet' + (i + 1) + '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>').join("") + '<Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/></Types>' },
    { name: "_rels/.rels", data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>' },
    { name: "xl/workbook.xml", data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>' + tabs.map((t, i) => '<sheet name="' + xesc(t.name) + '" sheetId="' + (i + 1) + '"' + (t.hidden ? ' state="hidden"' : '') + ' r:id="rId' + (i + 1) + '"/>').join("") + '</sheets></workbook>' },
    { name: "xl/_rels/workbook.xml.rels", data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' + tabs.map((t, i) => '<Relationship Id="rId' + (i + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet' + (i + 1) + '.xml"/>').join("") + '<Relationship Id="rId' + (tabs.length + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/></Relationships>' }]
    .concat(sheets.map((x, i) => ({ name: "xl/worksheets/sheet" + (i + 1) + ".xml", data: x })))
    .concat([{ name: "xl/sharedStrings.xml", data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="' + ss.length + '" uniqueCount="' + ss.length + '">' + ss.map(s => '<si><t xml:space="preserve">' + xesc(s) + '</t></si>').join("") + '</sst>' }]);
  return zip(files);
}

// ── the library: real SheetJS if it is installed here, else a stand-in for the calls the block makes ──
let REAL = null; try { REAL = require("xlsx"); } catch (e) { REAL = null; }
function standIn() {
  const unzip = b => { const dv = new DataView(b.buffer, b.byteOffset, b.byteLength), out = {}; let e = -1;
    for (let i = b.length - 22; i >= 0; i--) if (dv.getUint32(i, true) === 0x06054b50) { e = i; break; }
    if (e < 0) throw new Error("Unsupported file"); let off = dv.getUint32(e + 16, true); const n = dv.getUint16(e + 10, true);
    for (let k = 0; k < n; k++) { const cs = dv.getUint32(off + 20, true), nl = dv.getUint16(off + 28, true), xl = dv.getUint16(off + 30, true), cl = dv.getUint16(off + 32, true), loc = dv.getUint32(off + 42, true);
      const name = new TextDecoder().decode(b.subarray(off + 46, off + 46 + nl)), st = loc + 30 + dv.getUint16(loc + 26, true) + dv.getUint16(loc + 28, true);
      out[name] = new TextDecoder().decode(b.subarray(st, st + cs)); off += 46 + nl + xl + cl; } return out; };
  const un = s => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&amp;/g, "&");
  const decAddr = a => { const m = /^([A-Z]+)(\d+)$/.exec(a); let c = 0; for (const ch of m[1]) c = c * 26 + ch.charCodeAt(0) - 64; return { r: +m[2] - 1, c: c - 1 }; };
  const X = { reads: [], utils: {} };
  X.utils.decode_range = r => { const [a, b] = r.split(":"); return { s: decAddr(a), e: decAddr(b || a) }; };
  X.read = (bytes, o) => { X.reads.push({ o, loaded: X.loaded !== false });
    if (bytes[0] === 0xD0 && bytes[1] === 0xCF) throw new Error("File is password-protected");
    const z = unzip(bytes), ss = [...(z["xl/sharedStrings.xml"] || "").matchAll(/<si><t[^>]*>([\s\S]*?)<\/t><\/si>/g)].map(m => un(m[1]));
    const wb = { SheetNames: [], Sheets: {}, Workbook: { Sheets: [] } };
    [...z["xl/workbook.xml"].matchAll(/<sheet name="([^"]*)" sheetId="(\d+)"( state="hidden")? r:id="rId(\d+)"\/>/g)].forEach(m => {
      const name = un(m[1]), xml = z["xl/worksheets/sheet" + m[4] + ".xml"], cells = {}; let maxR = -1, maxC = 0;
      [...xml.matchAll(/<c r="([A-Z]+\d+)"( t="s")?><v>([\s\S]*?)<\/v><\/c>/g)].forEach(c => { const a = decAddr(c[1]); maxR = Math.max(maxR, a.r); maxC = Math.max(maxC, a.c); cells[c[1]] = { v: c[2] ? ss[+c[3]] : +c[3], w: c[2] ? ss[+c[3]] : String(+c[3]) }; });
      const ws = Object.assign({}, cells); const full = "A1:" + colL(maxC) + (maxR + 1);
      if (maxR >= 0) { ws["!ref"] = full; if (o && o.sheetRows && maxR + 1 > o.sheetRows) { ws["!fullref"] = full; ws["!ref"] = "A1:" + colL(maxC) + o.sheetRows; Object.keys(cells).forEach(k => { if (decAddr(k).r >= o.sheetRows) delete ws[k]; }); } }
      wb.SheetNames.push(name); wb.Sheets[name] = ws; wb.Workbook.Sheets.push({ name, Hidden: m[3] ? 1 : 0 }); });
    return wb; };
  X.utils.sheet_to_json = (ws, o) => { if (!ws["!ref"]) return []; const g = X.utils.decode_range(ws["!ref"]), out = [];
    for (let r = g.s.r; r <= g.e.r; r++) { const row = []; let any = false; for (let c = g.s.c; c <= g.e.c; c++) { const x = ws[colL(c) + (r + 1)]; if (x) any = true; row.push(x ? (o.raw === false ? x.w : x.v) : o.defval); } if (any || o.blankrows !== false) out.push(row); }
    return out; };
  return X;
}
const LIB = () => REAL || standIn();
console.log("  (workbook reader: " + (REAL ? "SheetJS from require('xlsx')" : "the stand-in — SheetJS is not installed here; the app loads the real one with haNeedXlsx()") + ")");

// the 3-tab workbook (+ a hidden tab): a vocab tab with a header row, a tab with a merged-style title row and a picture column, a notes tab
const BOOK_TABS = [
  { name: "Fish Vocab", rows: [["Word", "Meaning"], ["Guppy", "A tiny, colorful fish"], ["Neon tetra", "A small fish with a bright blue stripe"], ["Betta", "A fish with long, flowing fins"]] },
  { name: "Plants", rows: [["Pond Plants"], [], ["Plant", "Fact", "Picture"], ["Cattail", "A tall plant with a brown, fuzzy top", "cattail.jpg"], ["Duckweed", "Tiny leaves that float on top of the water", "duckweed.png"], ["Lily pad", "", "lily.jpg"]] },
  { name: "Notes", rows: [["Bring the net on Tuesday"]] },
  { name: "Old", hidden: true, rows: [["Word", "Meaning"], ["Hidden", "Should not show"]] }];
const BOOK = xlsx(BOOK_TABS);

function sheetWorld(o) {
  o = o || {}; const writes = [], els = {}, net = [];
  const store = {};
  const el = id => els[id] || (els[id] = { id, value: "", innerHTML: "", textContent: "", style: {}, remove() { delete els[id]; } });
  const X = o.X || LIB();
  const ctx = { console, JSON, Object, Array, String, Number, Math, Set, Map, RegExp, Date, parseInt, isNaN, isFinite, Promise, Error, Uint8Array, Infinity, TextDecoder, TextEncoder,
    unitStudies: { u1: { id: "u1", title: "Pond", enrolled: o.kids === false ? {} : { k1: true }, decks: [{ key: "Pond", mode: "flip", introCap: 3, cards: [{ name: "Goldfish", def: "An orange pond fish", order: 1 }] }] } },
    masteryData: { k1: [] }, mom: o.mom !== false, _dryRun: () => !!o.dry, cap: s => s, mastDefKeyOk: p => !/[.#$\[\]\/]/.test(p), alert() {},
    haKeys: m => m, HA_LS: { setItem() {}, getItem() { return null; } }, renderUnits() {}, loads: 0,
    nbLoadPdfJs: () => Promise.reject(new Error("no pdf.js in this test")),
    fetch: (...a) => { net.push(a); return Promise.reject(new Error("no network in tests")); },
    db: { ref: p => ({
      transaction: f => { const r = f(store[p] === undefined ? null : JSON.parse(J(store[p]))); store[p] = r; writes.push([p, "tx", r]); return { then: () => {} }; },
      update: v => writes.push([p, "update", JSON.parse(J(v))]), set: v => writes.push([p, "set", v]) }) },
    document: { getElementById: id => els[id] || null, createElement: () => { const x = { style: {}, remove() { if (els[x.id] === x) delete els[x.id]; } }; return x; }, body: { appendChild: x => { els[x.id] = x; } } } };
  // haNeedXlsx as XLSXLAZY behaves: the library is fetched once, every caller waits on the same promise; o.gate holds it back
  let loading = null;
  if (!o.noLoader) ctx.haNeedXlsx = () => { if (ctx.XLSX) return Promise.resolve(ctx.XLSX); if (loading) return loading; ctx.loads++; X.loaded = false;
    loading = new Promise((res, rej) => { const go = () => { if (o.noLib) { loading = null; rej(new Error("couldn't load the spreadsheet tools")); } else { X.loaded = true; ctx.XLSX = X; res(X); } }; if (o.gate) o.gate.push(go); else Promise.resolve().then(go); }); return loading; };
  if (o.key) ctx.ubCanAsk = () => true;
  ctx.momHere = () => ctx.mom;
  vm.createContext(ctx);
  vm.runInContext(CS + "\n" + CF + "\n" + PC + "\n" + PH + "\n" + (o.noBlock ? "" : SC) + "\n" + fn("kitCsvParse") + "\n" + fn("unitBatchAdd") + "\n" + fn("unitBatchClose") + "\n" + fn("unitBatchSave") + "\nlet unitBatch=null;\nObject.defineProperty(this,'cardSheet',{get:()=>cardSheet,set:v=>{cardSheet=v;}});" + (o.noBlock ? "" : "\nObject.defineProperty(this,'sheetCards',{get:()=>sheetCards});"), ctx);
  const open = () => { ctx.unitBatchAdd("u1", "Pond"); ["unit-batch-txt", "card-sheet-prev", "card-sheet-go", "unit-batch-msg", "card-sheet-file", "card-sheet-cols"].forEach(el); return ctx.cardSheet; };
  const pick = async file => { const inp = { files: [file], value: "C:\\fakepath\\" + file.name }; const r = await ctx.sheetCardsPick(inp); return { r, inp }; };
  return { ctx, X, writes, els, el, net, open, pick, box: () => els["unit-batch-txt"].value, panel: () => els["card-sheet-cols"].innerHTML, prev: () => els["card-sheet-prev"].innerHTML };
}
const file = (name, data, type) => { const b = typeof data === "string" ? enc(data) : data; return { name, type: type || "", size: b.length, arrayBuffer: async () => b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) }; };
const rowsOf = S => S.rows.filter(r => !r.drop).map(r => [r.name, r.back]);
const balanced = h => { const st = []; const voids = /^(input|br|img|hr|meta|link)$/i; for (const m of h.matchAll(/<(\/?)([a-z][a-z0-9]*)\b[^>]*?(\/?)>/gi)) { const t = m[2].toLowerCase(); if (voids.test(t) || m[3]) continue; if (m[1]) { if (st.pop() !== t) return false; } else st.push(t); } return st.length === 0; };
const ids = h => (h.match(/\sid="([^"]+)"/g) || []).map(x => x.replace(/^\sid="|"$/g, ""));

(async () => {
  const G = sheetWorld().ctx;
  const guess = rows => { const g = G.sheetGuess(rows); return { head: g.head, start: g.start, title: g.title, name: g.name, back: g.back, pic: g.pic, headLike: g.headLike, width: g.width }; };
  console.log("── the column guesser (pure) ──");
  {
    let g = guess([["Word", "Meaning"], ["Guppy", "A tiny fish"], ["Molly", "A calm fish"]]);
    ok("a 'Word | Meaning' header row is the column names; name = Word, meaning = Meaning", g.headLike && g.start === 1 && g.name === 0 && g.back === 1, g);
    g = guess([["Freshwater Fish"], ["", ""], ["Fish", "Fact", "Picture"], ["Guppy", "A tiny, colorful fish", "guppy.jpg"]]);
    ok("a one-cell title row over the header: header = first row with 2+ filled cells; the title is kept as the deck name; the Picture column is never the meaning", g.title === "Freshwater Fish" && g.head === 2 && g.headLike && g.name === 0 && g.back === 1 && g.pic === 2, g);
    g = guess([["Guppy", "A tiny, colorful fish"], ["Molly", "A calm fish that likes warm water"]]);
    ok("no header: the first row is a card", !g.headLike && g.start === 0 && g.name === 0 && g.back === 1, g);
    g = guess([["Fish", "Looks Like"], ["Guppy", "A tiny fish with a bright fan of a tail"], ["Molly", "A round, calm fish that comes in many colors"], ["Pleco", "A brown fish with a sucker mouth that eats algae"]]);
    ok("short Title words over a column of long ones = the column names (no known word needed)", g.headLike && g.start === 1 && g.back === 1, g);
    g = guess([["Betta", "A fish"], ["Guppy", "A tiny fish with a bright fan of a tail"], ["Molly", "A round, calm fish that comes in many colors"]]);
    ok("…but a first row with lower-case or longer cells stays a card", !g.headLike && g.start === 0, g);
    g = guess([["#", "Word", "Meaning"], [1, "Gill", "How a fish breathes"], [2, "Fin", "How a fish steers"]].map(r => r.map(String)));
    ok("a row-number column: the header's Word column is the name", g.headLike && g.name === 1 && g.back === 2, g);
    g = guess([["1", "Gill", "How a fish breathes underwater"], ["2", "Fin", "How a fish steers"]]);
    ok("…and with no header the number column is skipped for the name", !g.headLike && g.name === 1 && g.back === 2, g);
    g = guess([["Dorsal fin"], ["Caudal fin"], ["Pelvic fin"]]);
    ok("one column: names only, no meaning column", g.width === 1 && g.name === 0 && g.back === -1 && !g.headLike && g.start === 0, g);
    g = guess([["Words"], ["Gill"], ["Fin"]]);
    ok("one column under 'Words': that row is the column name", g.headLike && g.start === 1 && g.back === -1, g);
    g = guess([["English", "German"], ["the dog", "der Hund"], ["the cat", "die Katze"]]);
    ok("English | German: name = English, meaning = German", g.headLike && g.name === 0 && g.back === 1, g);
    g = guess([["Guppy", "https://upload.example.org/guppy-picture-from-a-long-link.jpg", "A tiny fish"], ["Molly", "https://upload.example.org/molly-picture.jpg", "A calm fish"]]);
    ok("a column of links is never guessed as the meaning, even when it is the longest", g.pic === 1 && g.back === 2 && g.name === 0, g);
    g = guess([]); const g2 = guess([[""], ["", " "]]);
    ok("an empty tab: nothing to pick", g.width === 0 && g2.width === 0);
    const L = G.sheetLines([["Gill", "How a fish breathes"], ["Fin", ""], ["", "orphan meaning"], ["  Swim\tbladder ", " keeps it\nafloat "]], { start: 0, name: 0, back: 1 });
    ok("sheetLines: name<TAB>meaning; a name alone stays alone; a row with no name is counted, not turned into a card; tabs and line breaks inside cells flattened",
      J(L.lines) === J(["Gill\tHow a fish breathes", "Fin", "Swim bladder\tkeeps it afloat"]) && L.noName === 1, L);
  }

  console.log("\n── text files: CSV (kitCsvParse), ';' CSV, TSV, UTF-16 / Windows-1252 ──");
  {
    const csv = 'Word,Meaning\r\nGuppy,"A tiny, colorful fish"\r\n"Neon tetra","A small fish\nwith a blue stripe"\r\nBetta,"Says ""hi"" with its fins"\r\n';
    const R = G.scDelimRows(csv, G.scCsvDelim(csv));
    ok("a quoted CSV: commas, a line break and doubled quotes inside cells stay in their cell", J(R) === J([["Word", "Meaning"], ["Guppy", "A tiny, colorful fish"], ["Neon tetra", "A small fish with a blue stripe"], ["Betta", 'Says "hi" with its fins']]), R);
    const semi = 'Wort;Bedeutung\nder Hund;the dog, a pet\ndie Katze;the cat\n';
    ok("a ';' CSV (a European Excel) splits at ';', commas stay in the meaning", G.scCsvDelim(semi) === ";" && J(G.scDelimRows(semi, ";")[1]) === J(["der Hund", "the dog, a pet"]));
    const tsv = 'Fish\tMeaning\nGuppy\t"A tiny fish\twith a tab"\nMolly\tA 5" fish\n';
    ok("TSV: quotes only open at a cell's start (a 5\" fish keeps its mark)", J(G.scDelimRows(tsv, "\t")) === J([["Fish", "Meaning"], ["Guppy", "A tiny fish with a tab"], ["Molly", 'A 5" fish']]), G.scDelimRows(tsv, "\t"));
    const u16 = new Uint8Array([0xFF, 0xFE, ...[..."Guppy\tFisch\n"].flatMap(ch => [ch.charCodeAt(0), 0])]);
    ok("Excel's 'Unicode text' (UTF-16 with its mark) reads", G.scDecode(u16) === "Guppy\tFisch\n");
    ok("an old Excel CSV in Windows-1252 reads (é not lost)", G.scDecode(new Uint8Array([0x43, 0x61, 0x66, 0xE9, 0x2C, 0x78])) === "Café,x");
    ok("file kinds by name, then type", ["a.xlsx", "a.XLS", "a.ods", "a.csv", "a.tsv", "a.txt", "a.pdf", "a.docx", "a.doc", "a.numbers", "a.pages", "a.jpg"].map(n => G.scKind(n)).join() === "book,book,book,csv,tsv,txt,pdf,docx,doc,numbers,pages,other" && G.scKind("noext", "text/csv") === "csv");
  }

  console.log("\n── the sheet: 📄 File beside 📄 PDF and 📸 Photo ──");
  {
    const w = sheetWorld({ key: true }), c = w.ctx, S = w.open();
    const html = c.cardSheetHTML(S);
    ok("a finger-sized 📄 File door (Excel · CSV) in the same row as 📄 PDF and 📸 Photo — one sheet",
      /data-pdfc-bar="1"[^]*id="card-sheet-pdf"[^]*id="card-sheet-xfile"[^]*id="card-sheet-photo"/.test(html) && /📄 File|\\u\{1F4C4\} File/.test(html) && /Excel · CSV/.test(html) && /data-sc-door="1" style="[^"]*min-height:40px/.test(html), html.slice(0, 400));
    ok("it takes Excel, CSV, TSV, .txt (and a PDF, handed to the PDF reader)", /accept="\.xlsx,\.xlsm,\.xls,\.ods,\.csv,\.tsv,\.txt,\.pdf,/.test(html));
    const { inp, r } = await w.pick(file("Pond.xlsx", BOOK));
    ok("the picker is cleared (the same file can be picked again)", inp.value === "" && !!r);
    ok("the spreadsheet library was loaded (awaited) before the workbook was read", c.loads === 1 && w.X.reads.length === 1 && (REAL || w.X.reads[0].loaded) && w.X.reads[0].o.sheetRows === 520);
    ok("tab chips: 3 tabs (the hidden one left out), the first with cards picked", (w.panel().match(/data-sc-tab="/g) || []).length === 3 && /Fish Vocab · 3/.test(w.panel()) && /Plants · 3/.test(w.panel()) && /Notes · 1/.test(w.panel()) && !/Old/.test(w.panel()), w.panel());
    ok("the paste box holds the tab name then name<TAB>meaning lines", w.box() === "Fish Vocab\nGuppy\tA tiny, colorful fish\nNeon tetra\tA small fish with a bright blue stripe\nBetta\tA fish with long, flowing fins", w.box());
    ok("the SAME check screen: split at tab, green rows, no per-row tick; the tab name is offered as a new deck, not a card",
      S.res.sep === "tab" && J(rowsOf(S)) === J([["Guppy", "A tiny, colorful fish"], ["Neon tetra", "A small fish with a bright blue stripe"], ["Betta", "A fish with long, flowing fins"]]) && S.res.heading === "Fish Vocab" && /Make it a new deck/.test(w.prev()) && /#86efac/.test(w.prev()) && !/#f59e0b/.test(w.prev()) && !/data-cf-tick/.test(w.prev()) && c.cardSheetReady(S).length === 3, rowsOf(S));
    ok("the dropdowns are pre-picked: Card name = A · Word, Meaning = B · Meaning; Row 1 is the column names", /data-sc-col="name"[^]*value="0" selected>A · Word</.test(w.panel()) && /data-sc-col="back"[^]*value="1" selected>B · Meaning</.test(w.panel()) && /Row 1 \(<b>Word, Meaning<\/b>\) is the column names/.test(w.panel()), w.panel());
    ok("she is told it was read here and nothing was uploaded; no fetch, no write", /on this device — nothing was uploaded/.test(w.panel()) && w.net.length === 0 && w.writes.length === 0);
    ok("16px dropdowns (no iPad zoom), 44px tall; 40px chips", /<select[^>]*style="[^"]*min-height:44px[^"]*font-size:16px/.test(w.panel()) && /data-sc-tab="0"[^>]*style="[^"]*min-height:40px/.test(w.panel()));
    ok("balanced HTML in the panel and the whole sheet", balanced(w.panel()) && balanced(c.cardSheetHTML(S)) && balanced(w.prev()));
    const all = ids(c.cardSheetHTML(S));
    ok("every id on the sheet is unique with all three doors present (card-sheet-xfile, card-sheet-cols are new)", all.length === new Set(all).size && ["card-sheet-pdf", "card-sheet-photo", "card-sheet-xfile", "card-sheet-cols"].every(x => all.includes(x)), all);
    ok("no 🔀 anywhere in the block", !/🔀|\\u\{1F500\}/.test(SC));

    c.sheetCardsTab(1);
    ok("tab 2: the title row (not the tab name) is the deck offered; header row 3 = the columns; Picture not used, said so",
      w.box().startsWith("Pond Plants\nCattail\tA tall plant") && S.res.heading === "Pond Plants" && /Not used: C · Picture \(pictures come later\)/.test(w.panel()) && !/Guppy/.test(w.box()), w.box());
    ok("…the row with a name and no meaning arrives amber, meaning blank — nothing invented", (r2 => r2 && r2.back === "")(S.rows.find(x => x.name === "Lily pad")) && /#f59e0b/.test(w.prev()) && c.cardSheetReady(S).length === 2);
    c.sheetCardsCol("back", "-1");
    ok("Meaning → (none): names only, every meaning blank, said so", S.rows.every(x => x.back === "") && /No meaning column/.test(w.panel()) && c.cardSheetReady(S).length === 0);
    c.sheetCardsCol("back", "1"); c.sheetCardsCol("name", "1");
    ok("picking the meaning column as the name swaps the two", c.sheetCards.pick.name === 1 && c.sheetCards.pick.back === 0 && S.rows[0].name === "A tall plant with a brown, fuzzy top");
    c.sheetCardsTab(0); c.sheetCardsHead(false);
    ok("'It's a card': row 1 comes in as a card, and the button flips back", S.rows[0].name === "Word" && S.rows[0].back === "Meaning" && /data-sc-head="names"/.test(w.panel()));
    c.sheetCardsHead(true);
    ok("…'It's the column names' puts it back", S.rows[0].name === "Guppy");
    c.sheetCardsTab(2);
    ok("the notes tab: one line, a name with no meaning (amber), nothing invented", J(rowsOf(S)) === J([["Bring the net on Tuesday", ""]]));
  }
  {
    const w = sheetWorld(), c = w.ctx, S = w.open();
    w.els["unit-batch-txt"].value = "Swordtail - a fish with a long tail"; c.cardSheetInput(w.box());
    await w.pick(file("Pond.xlsx", BOOK));
    ok("what she typed stays at the top; the file's lines go under it (no tab-name heading over her own line)", w.box().startsWith("Swordtail - a fish with a long tail\nGuppy\t") && S.res.heading === "" && rowsOf(S)[0][0] === "Swordtail", w.box());
    c.sheetCardsTab(1);
    ok("another tab replaces the file's lines and keeps what she typed", w.box().startsWith("Swordtail - a fish with a long tail\nCattail\t") && !/Guppy/.test(w.box()), w.box());
    const again = await w.pick(file("Pond.xlsx", BOOK));
    ok("the same file picked twice: read again (library not fetched twice), lines not doubled", !!again.r && c.loads === 1 && w.X.reads.length === 2 && (w.box().match(/Guppy/g) || []).length === 1, w.box());
  }

  console.log("\n── the library: awaited on every path ──");
  {
    const gate = [], w = sheetWorld({ gate }), c = w.ctx, S = w.open();
    const p1 = w.pick(file("Pond.xlsx", BOOK));
    const csvBook = xlsx([{ name: "Second", rows: [["Term", "Definition"], ["Algae", "A tiny green plant"]] }]);
    const p2 = w.pick(file("Second.xlsx", csvBook));
    for (let i = 0; i < 20; i++) await Promise.resolve();
    ok("two files picked while the library loads: it is fetched once, nothing is read before it arrives", c.loads === 1 && w.X.reads.length === 0 && /⏳ Reading “Second\.xlsx”/.test(w.panel()));
    gate.forEach(f => f()); const [{ r: r1 }, { r: r2 }] = await Promise.all([p1, p2]);
    ok("…both waited; only the later pick lands", r1 === null && !!r2 && w.X.reads.every(x => x.loaded) && J(rowsOf(S)) === J([["Algae", "A tiny green plant"]]) && !/Guppy/.test(w.box()), [w.box(), w.X.reads]);
  }
  {
    const w = sheetWorld({ noLib: true }), c = w.ctx, S = w.open();
    await w.pick(file("Pond.xlsx", BOOK));
    ok("a library that can't load: one plain line (CSV still works), nothing read, the box untouched", /couldn’t load \(offline\?\)\. Save the sheet as CSV/.test(w.panel()) && w.X.reads.length === 0 && w.box() === "" && !S.rows.length);
    await w.pick(file("words.csv", "Gill,How a fish breathes\nFin,How a fish steers\n"));
    ok("…a CSV needs no library at all", J(rowsOf(S)) === J([["Gill", "How a fish breathes"], ["Fin", "How a fish steers"]]) && w.X.reads.length === 0);
  }
  {
    const w = sheetWorld({ noLoader: true }), S = w.open();
    await w.pick(file("Pond.xlsx", BOOK));
    ok("no loader in this tree → the plain line, no crash", /couldn’t load/.test(w.panel()) && !S.rows.length);
  }

  console.log("\n── CSV / TSV / TXT on the sheet ──");
  {
    const w = sheetWorld(), c = w.ctx, S = w.open();
    await w.pick(file("fish.csv", 'Word,Meaning\r\nGuppy,"A tiny, colorful fish"\r\n"Neon tetra","A small fish\nwith a blue stripe"\r\n'));
    ok("a quoted CSV → the check screen: header row = the columns, commas and line breaks kept in the meaning; no library loaded",
      J(rowsOf(S)) === J([["Guppy", "A tiny, colorful fish"], ["Neon tetra", "A small fish with a blue stripe"]]) && c.loads === 0 && !/data-sc-tab/.test(w.panel()) && S.res.heading === "", rowsOf(S));
    await w.pick(file("words.tsv", "der Hund\tthe dog\ndie Katze\tthe cat\n"));
    ok("a TSV replaces the CSV's lines", J(rowsOf(S)) === J([["der Hund", "the dog"], ["die Katze", "the cat"]]) && !/Guppy/.test(w.box()));
    await w.pick(file("list.txt", "Parts of a Fish\n1. Mouth – takes in food and water\n2. Gills – breathe underwater\n"));
    ok("a plain .txt list goes in like a paste (the splitter's own rules: heading, numbers, dash)", S.res.heading === "Parts of a Fish" && J(rowsOf(S)) === J([["Mouth", "takes in food and water"], ["Gills", "breathe underwater"]]) && /Read “list\.txt” on this device/.test(w.panel()), rowsOf(S));
    await w.pick(file("tabbed.txt", "Gill\tHow a fish breathes\nFin\tHow a fish steers\n"));
    ok("a .txt with tabs gets the column dropdowns", J(rowsOf(S)) === J([["Gill", "How a fish breathes"], ["Fin", "How a fish steers"]]) && /data-sc-col="name"/.test(w.panel()));
  }

  console.log("\n── empty, one column, huge, wrong type, locked ──");
  {
    const w = sheetWorld(), S = w.open();
    await w.pick(file("empty.csv", ""));
    ok("an empty file says so; nothing lands", /That file is empty/.test(w.panel()) && w.box() === "" && !S.rows.length);
    await w.pick(file("blank.csv", " ,\n,\n"));
    ok("a file of blank cells says so too", /That file is empty/.test(w.panel()) && w.box() === "");
    await w.pick(file("blank.xlsx", xlsx([{ name: "Sheet1", rows: [] }])));
    ok("a workbook with no cells says so", /That file is empty/.test(w.panel()) && w.box() === "");
  }
  {
    const w = sheetWorld(), c = w.ctx, S = w.open();
    await w.pick(file("fins.xlsx", xlsx([{ name: "Sheet1", rows: [["Dorsal fin"], ["Caudal fin"], ["Pelvic: low fin"]] }])));
    ok("one column: every name arrives, meanings blank, nothing invented (the generic tab name isn't offered as a deck)",
      J(rowsOf(S).slice(0, 2)) === J([["Dorsal fin", ""], ["Caudal fin", ""]]) && rowsOf(S)[0][0] === "Dorsal fin" && S.res.heading === "" && /No meaning column/.test(w.panel()) && /value="-1" selected>\(none/.test(w.panel()), rowsOf(S));
    ok("…NOTE the splitter's own per-line rule still cuts a lone name at its own ': ' (as a paste does) — her ↔ / ⤓ fix it", J(rowsOf(S)[2]) === J(["Pelvic", "low fin"]), rowsOf(S)[2]);
  }
  {
    const big = [["Word", "Meaning"]]; for (let i = 1; i <= 2000; i++) big.push(["Word " + i, "Meaning " + i]);
    const w = sheetWorld(), c = w.ctx, S = w.open();
    await w.pick(file("big.xlsx", xlsx([{ name: "All words", rows: big }])));
    ok("a 2,000-row tab: the library reads only 520 rows; 500 cards come in; she is told the cap and the size",
      w.X.reads[0].o.sheetRows === 520 && S.rows.length === 500 && S.rows[499].name === "Word 500" && /Only the first 500 rows were read — this tab has about 2001/.test(w.panel()), [S.rows.length, w.panel().slice(-600)]);
    const csv = big.map(r => r.join(",")).join("\n");
    await w.pick(file("big.csv", csv));
    ok("a 2,000-row CSV: 500 cards, the cap said", S.rows.length === 500 && /Only the first 500 rows were read\./.test(w.panel()));
    const long = [["Word", "Meaning"]]; for (let i = 1; i <= 300; i++) long.push(["W" + i, "x".repeat(300)]);
    await w.pick(file("long.csv", long.map(r => r.join(",")).join("\n")));
    ok("past 60,000 characters: the first part, said so", S.rows.length < 300 && S.rows.length > 150 && w.box().length <= 60000 && /only the first part was read/.test(w.panel()));
    const hw = { name: "huge.xlsx", type: "", size: 16 * 1024 * 1024, arrayBuffer: async () => { throw new Error("should not read"); } };
    await w.pick(hw);
    ok("over 15 MB: not read, one plain line", /over 15 MB/.test(w.panel()));
  }
  {
    const w = sheetWorld(), S = w.open();
    for (const [n, re] of [["notes.odt", /The app reads Excel \(\.xlsx, \.xls\), CSV, TSV, \.txt, Word \(\.docx\) and PDF files/], ["pic.jpg", /copy the list and paste it/], ["sheet.numbers", /That’s a Numbers file — in Numbers, Share ▸ Export ▸ Excel/]]) {
      await w.pick(file(n, "PK\u0003\u0004 not for this"));
      ok("a wrong-type file (" + n + ") says what to do; nothing lands", re.test(w.panel()) && w.box() === "" && !S.rows.length, w.panel());
    }
    await w.pick(file("locked.xlsx", new Uint8Array([0xD0, 0xCF, 0x11, 0xE0, 1, 2, 3])));
    ok("a password-locked workbook says so", /locked with a password/.test(w.panel()) && w.box() === "");
    await w.pick(file("broken.xlsx", "this is not a workbook"));
    ok("a workbook that won't open says so", /Couldn’t open that file/.test(w.panel()) && w.box() === "");
  }
  {
    const w = sheetWorld(), c = w.ctx; w.open(); c.mom = false;
    const { r, inp } = await w.pick(file("Pond.xlsx", BOOK));
    ok("not Mom → nothing is read (and the picker is still cleared)", r === null && c.loads === 0 && !c.sheetCards && inp.value === "");
  }
  {
    const w = sheetWorld(), c = w.ctx; w.open();
    const p = c.sheetCardsPick({ files: [file("Pond.xlsx", BOOK)], value: "" }); c.unitBatchClose(); const r = await p;
    ok("closing the sheet while it reads → nothing lands; a new sheet starts with no file panel", r === null && c.cardSheet === null);
    const S2 = w.open(); ok("…", c.sheetCardsPanelInner(S2) === "" && w.box() === "");
  }
  {
    const w = sheetWorld(), c = w.ctx; w.open(); let handed = null;
    c.pdfCardsSheetPick = inp => { handed = inp.files[0].name; return Promise.resolve("pdf"); };
    const r = await c.sheetCardsPick({ files: [file("vocab.pdf", "%PDF")], value: "x" });
    ok("a PDF picked on 📄 File goes to the PDF reader (PDFCARDS), unchanged", handed === "vocab.pdf" && r === "pdf" && !c.sheetCards);
  }

  console.log("\n── Add: the same writes as pasting the same text; a dry run writes nothing ──");
  {
    const wp = sheetWorld(), Sp = wp.open(); await wp.pick(file("Pond.xlsx", BOOK)); wp.ctx.sheetCardsTab(1); wp.ctx.unitBatchSave();
    const text = wp.box(), opts = J(Sp.opts);
    const wt = sheetWorld({ noBlock: true }), St = wt.open(); St.opts = JSON.parse(opts); wt.els["unit-batch-txt"].value = text; wt.ctx.cardSheetInput(text); wt.ctx.unitBatchSave();
    ok("Add after a workbook writes exactly what Add after pasting that text writes (CHECKFIX's targeted writes, unchanged)", wp.writes.length > 0 && J(wp.writes) === J(wt.writes), wp.writes.map(x => x[0] + " " + x[1]));
    ok("…every write targeted (no whole-node set); the amber row is left out", wp.writes.every(x => x[1] !== "set") && !J(wp.writes).includes("Lily pad") && J(wp.writes).includes("Duckweed"));
    const wd = sheetWorld({ dry: true }), Sd = wd.open(); await wd.pick(file("Pond.xlsx", BOOK)); const read = Sd.rows.length === 3; wd.ctx.unitBatchSave();
    ok("a dry run reads the file but writes nothing", read && wd.writes.length === 0 && /Dry run — nothing written\. 3 cards/.test(wd.els["unit-batch-msg"].textContent));
    const wn = sheetWorld(), Sn = wn.open(); await wn.pick(file("Pond.xlsx", BOOK)); wn.ctx.checkFixDo("headdeck"); wn.ctx.unitBatchSave();
    ok("'Make it a new deck' from the tab name → the new deck 'Fish Vocab' by CHECKFIX's one transaction", wn.writes.some(x => x[0] === "unitStudies/u1/decks" && x[1] === "tx" && x[2].some(d => d.key === "Fish Vocab" && d.cards.length === 3)));
  }

  console.log("\n── the sheet with no file picked: unchanged apart from the new door ──");
  {
    const base = sheetWorld({ noBlock: true, key: true }), cur = sheetWorld({ key: true });
    const Sb = base.open(), Sc = cur.open();
    const hb = base.ctx.cardSheetHTML(Sb), hc = cur.ctx.cardSheetHTML(Sc);
    ok("cardSheetHTML minus the 📄 File door and its empty panel = the tree without SHEETCARDS, byte for byte", hc.replace(cur.ctx.sheetCardsBtnHTML(), "").replace('<div id="card-sheet-cols"></div>', "") === hb && hc !== hb);
    const txt = "Guppy - a tiny fish\nMolly - a calm fish"; [[base, Sb], [cur, Sc]].forEach(([w, S]) => { w.els["unit-batch-txt"].value = txt; w.ctx.cardSheetInput(txt); });
    ok("…and a paste draws the same check screen and gives the same cardSplit result", base.prev() === cur.prev() && J(Sb.res) === J(Sc.res));
  }

  console.log("\n" + pass + " passed, " + fail + " failed");
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
