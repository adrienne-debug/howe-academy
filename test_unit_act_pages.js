// 📄 UACTPAGES — a Printable's pages made at upload (piece 4b of PLAN_unit_activity_types_2026-11-19 §6.5, §6.7 row 4b, §6.10 Q3:
//   "Pages at upload, always, up to 20 pages"; her go 2026-11-22 "go with her answers and build").
//   Runs the REAL UNITTRACK + UTADDACT + UACTKIND + UACTLINK + UACTPRINT + UACTPAGES blocks with a stubbed pdf.js (loaded only
//   when the code asks for it, as nbLoadPdfJs does), a stubbed canvas and a fake Storage that records every put. No real names.
//   · N pages → N JPEG puts beside the PDF (its stamped name + _p<n>.jpg), then ONE update with N leaves …/pdf/pages/<n>
//   · the line: "… — and N pages."; a 21-page PDF: no pages, "over 20 pages (21), so paper only"; exactly 20: 20 pages
//   · pdf.js is LOADED by the upload (not just looked for); offline / a failed page / a non-https link → no pages, the PDF stays
//   · the PDF replaced meanwhile → these pages are not attached; a file held for + Add makes its pages under the new key
//   · dry run / not Mom: nothing; without the block the upload is slice 4's exactly
//   run: node test_unit_act_pages.js
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x).slice(0, 700) : "")); } };
const J = x => JSON.stringify(x);
const cut = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error("markers " + a); return src.slice(i, j); };
const fn = name => { const i = src.indexOf("function " + name + "("); if (i < 0) throw new Error("no " + name); let d = 0, j = i, seen = false; for (; j < src.length; j++) { const c = src[j]; if (c === "{") { d++; seen = true; } else if (c === "}") { d--; if (seen && d === 0) break; } } return src.slice(i, j + 1); };
const tick = () => new Promise(r => setImmediate(r));
const BLK = cut("// UACTPAGES_START", "// UACTPAGES_END") + "// UACTPAGES_END\n";
const PRINT = cut("// UACTPRINT_START", "// UACTPRINT_END") + "// UACTPRINT_END\n";
const UT = cut("// UNITTRACK_START", "// UNITTRACK_END"), AA = cut("// UTADDACT_START", "// UTADDACT_END");
const KIND = cut("// UACTKIND_START", "// UACTKIND_END"), LINK = cut("// UACTLINK_START", "// UACTLINK_END");
const PIC = fn("_picSlug") + "\n" + fn("picStorePath");

console.log("── wiring ──");
ok("UACTPAGES is one marked block right after UACTPRINT", src.indexOf("// UACTPRINT_END\n// UACTPAGES_START") > 0 && src.split("// UACTPAGES_START").length === 2);
const code = BLK.split("\n").filter(l => !/^\s*\/\//.test(l)).join("\n");
ok("its only database call is one update, behind utaaLive() (db && !_dryRun)", (code.match(/db\./g) || []).length === 1 && /if\(utaaLive\(\)\) db\.ref\(\)\.update\(upd\);/.test(code) && !/\.set\(|\.remove\(|\.transaction\(/.test(code));
ok("it LOADS pdf.js itself (await nbLoadPdfJs()), not just checks for it", /await nbLoadPdfJs\(\)/.test(code));
ok("the workbook page step: scale 1.6, white under the page, JPEG 0.84", /getViewport\(\{scale:1\.6\}\)/.test(code) && /fillStyle="#fff"/.test(code) && /toBlob\(res,"image\/jpeg",0\.84\)/.test(code));
ok("the one hook in UACTPRINT's upload, typeof-guarded", PRINT.split('const more=(typeof uapgPages==="function")?uapgLine(await uapgPages(uid,key,file,pth,url,kk)):"";').length === 2);
const NAMES = /\b(adrienne|andrew|julian|lincoln|ellis|lucy|sara|sarah|caleb|taylor|makenzie|kenzie|dewalt|burris|melanie|howe)\b/i;
ok("no kid or family name, no 🔀", !NAMES.test(BLK) && BLK.indexOf("\u{1F500}") < 0, (BLK.match(NAMES) || [])[0]);
const testTxt = fs.readFileSync(__filename, "utf8").split("\n").filter(l => !/^const NAMES =/.test(l)).join("\n");
ok("this test file names no real kid or family", !NAMES.test(testTxt), (testTxt.match(NAMES) || [])[0]);

const UNIT = () => ({ id: "harv", title: "Harvest", enrolled: { k1: true }, decks: [],
  activities: [{ key: "corn_maze", title: "Draw a corn maze", kind: "sheet", points: 5, day: 2 }, { key: "leaf_map", title: "Leaf map", kind: "sheet", points: 2, day: 3, type: "print" }],
  track: { mode: "seq", days: [{ id: "d1", n: 1, t: "Fields" }, { id: "d2", n: 2, t: "Mazes", nb: { activity: "corn_maze" } }, { id: "d3", n: 3, t: "Leaves", nb: { activity: "leaf_map" } }] } });
// o.pages = numPages; o.failPage = n (its put throws); o.pageUrl = fn(path) for a page's link; o.noLoad = the loader rejects
function world(o) {
  o = o || {}; const writes = [], puts = [], log = { load: 0, getDoc: 0, render: [], blobs: [], destroyed: 0, buf: 0 }; const dom = o.dom || {};
  const win = {};
  const ctx = { console, JSON, Object, Array, String, Number, Math, Set, Map, RegExp, Date, Promise, Error, parseInt, isNaN, isFinite, WeakMap, URL,
    unitStudies: { harv: o.unit || UNIT() }, ROSTER: ["k1"], kcKid: "", window: win,
    momHere: () => ctx.MOM, MOM: o.mom !== false, _dryRun: () => !!o.dry, gwShowToast: () => {}, confirm: () => true,
    db: { ref: p => ({ set: v => writes.push(["set", p, v]), update: v => writes.push(["update", p === undefined ? "" : p, JSON.parse(J(v))]) }) },
    renderAll: () => { ctx.repaints = (ctx.repaints || 0) + 1; }, repaints: 0,
    document: { getElementById: id => (id in dom) ? dom[id] : null,
      createElement: tag => ({ tag, width: 0, height: 0, getContext: () => ({ fillRect: () => {}, set fillStyle(v) { log.fill = v; } }), toBlob(cb, type, q) { const b = { blob: true, type, q, w: this.width, h: this.height }; log.blobs.push(b); cb(b); } }) },
    firebase: { storage: () => ({ ref: p => ({ put: async (f, m) => { const pg = /_p(\d+)\.jpg$/.exec(p); if (pg && o.failPage === +pg[1]) throw new Error("page upload failed"); puts.push({ path: p, type: m && m.contentType, cache: m && m.cacheControl, blob: !!(f && f.blob) }); },
      getDownloadURL: async () => (o.pageUrl && /_p\d+\.jpg$/.test(p)) ? o.pageUrl(p) : "https://store.example/o/" + encodeURIComponent(p) + "?alt=media&token=t" }) }) } };
  if (!o.noLoader) ctx.nbLoadPdfJs = async () => { log.load++; if (o.noLoad) throw new Error("could not load the PDF reader (offline?)");
    win.pdfjsLib = { getDocument: a => { log.getDoc++; log.data = a && a.data; return { promise: Promise.resolve({ numPages: o.pages == null ? 3 : o.pages, destroy: () => { log.destroyed++; },
      getPage: async p => ({ getViewport: v => ({ width: 612 * v.scale, height: 792 * v.scale, scale: v.scale }), render: r => { log.render.push({ p, scale: r.viewport.scale }); return { promise: Promise.resolve() }; } }) }) }; } };
    return win.pdfjsLib; };
  vm.createContext(ctx);
  const LR = ["lrSafeUrl", "lrStr"].map(fn).join("\n");
  vm.runInContext(LR + "\n" + UT + "\n" + AA + "\n" + KIND + "\n" + LINK + "\n" + PRINT + "\n" + (o.before ? "" : BLK) + "\n" + PIC + "\n" + fn("_unitActs") +
    "\nObject.defineProperty(this,'uapStatus',{get:()=>uapStatus});", ctx);
  return { ctx, writes, puts, log, win };
}
const PDF = n => ({ name: (n || "leaf map") + ".pdf", size: 400000, type: "application/pdf", arrayBuffer: async () => "BYTES:" + (n || "leaf map") });
const inp = f => ({ files: [f], value: "x" });
const A1 = "unitStudies/harv/activities/1/";

(async () => {
console.log("\n── a 3-page PDF ──");
{
  const w = world(); ok("pdf.js is not on the page before the upload", !w.win.pdfjsLib);
  const r = await w.ctx.uapFile("harv-d3", inp(PDF()));
  const pdf = w.puts[0] || {}, base = String(pdf.path).replace(/\.pdf$/, "");
  ok("the upload loaded pdf.js once and read the SAME file Mom picked", r === true && w.log.load === 1 && w.log.getDoc === 1 && w.log.data === "BYTES:leaf map");
  ok("4 puts: the PDF, then pages 1–3 beside it as <its stamped name>_p<n>.jpg, JPEG, cached a year", w.puts.length === 4 && /^pictures\/units\/harv\/activities\/leaf_map\/leaf_map_[a-z0-9]+\.pdf$/.test(pdf.path) &&
    J(w.puts.slice(1).map(p => p.path)) === J([1, 2, 3].map(n => base + "_p" + n + ".jpg")) && w.puts.slice(1).every(p => p.type === "image/jpeg" && p.cache === "public,max-age=31536000" && p.blob), w.puts.map(p => p.path));
  ok("each page drawn at 1.6 on white, as a JPEG at 0.84 (612×792 pt → 979×1267 px)", J(w.log.render) === J([1, 2, 3].map(p => ({ p, scale: 1.6 }))) && w.log.fill === "#fff" && w.log.blobs.every(b => b.type === "image/jpeg" && b.q === 0.84 && b.w === 979 && b.h === 1267));
  const L = n => "https://store.example/o/" + encodeURIComponent(base + "_p" + n + ".jpg") + "?alt=media&token=t";
  ok("2 writes: slice 4's …/pdf, then ONE update with exactly 3 leaves …/pdf/pages/1..3", w.writes.length === 2 && J(Object.keys(w.writes[0][2])) === J([A1 + "pdf"]) &&
    J(w.writes[1]) === J(["update", "", { [A1 + "pdf/pages/1"]: L(1), [A1 + "pdf/pages/2"]: L(2), [A1 + "pdf/pages/3"]: L(3) }]), w.writes);
  ok("the screen copy: pdf {url, title, pages{1,2,3}}", J(Object.keys(w.ctx.unitStudies.harv.activities[1].pdf)) === J(["url", "title", "pages"]) && w.ctx.unitStudies.harv.activities[1].pdf.pages[2] === L(2));
  ok("the line: \"✓ Saved the PDF: leaf map — and 3 pages.\"; one repaint; the document is let go", w.ctx.uapStatus["harv-d3"] === "✓ Saved the PDF: leaf map — and 3 pages." && w.ctx.repaints === 1 && w.log.destroyed === 1, w.ctx.uapStatus["harv-d3"]);
}
{
  const one = world({ pages: 1 }); await one.ctx.uapFile("harv-d3", inp(PDF()));
  ok("1 page: \"— and 1 page.\"", /— and 1 page\.$/.test(one.ctx.uapStatus["harv-d3"]) && one.puts.length === 2);
  const tw = world({ pages: 20 }); await tw.ctx.uapFile("harv-d3", inp(PDF()));
  ok("exactly 20 pages: 20 pictures, 20 leaves", tw.puts.length === 21 && Object.keys(tw.writes[1][2]).length === 20 && /— and 20 pages\.$/.test(tw.ctx.uapStatus["harv-d3"]));
}

console.log("\n── no pages: the PDF stays, paper only ──");
{
  const w = world({ pages: 21 }); await w.ctx.uapFile("harv-d3", inp(PDF()));
  ok("21 pages: the PDF uploads, NO page drawn or put, ONE write (…/pdf)", w.puts.length === 1 && w.log.render.length === 0 && w.writes.length === 1 && J(Object.keys(w.writes[0][2])) === J([A1 + "pdf"]) && !w.ctx.unitStudies.harv.activities[1].pdf.pages);
  ok("…one plain line: \"over 20 pages (21), so paper only\"", w.ctx.uapStatus["harv-d3"] === "✓ Saved the PDF: leaf map — over 20 pages (21), so paper only.", w.ctx.uapStatus["harv-d3"]);
  const off = world({ noLoad: true }); await off.ctx.uapFile("harv-d3", inp(PDF()));
  ok("pdf.js can't load (offline): the PDF saved, no pages, the line says why", off.puts.length === 1 && off.writes.length === 1 && /the pages didn’t make \(could not load the PDF reader \(offline\?\)\), so paper only for now\.$/.test(off.ctx.uapStatus["harv-d3"]), off.ctx.uapStatus["harv-d3"]);
  const mid = world({ pages: 5, failPage: 3 }); await mid.ctx.uapFile("harv-d3", inp(PDF()));
  ok("page 3 of 5 fails: no pages written at all (never a half set), the PDF stays", mid.writes.length === 1 && J(Object.keys(mid.writes[0][2])) === J([A1 + "pdf"]) && !mid.ctx.unitStudies.harv.activities[1].pdf.pages && /page upload failed/.test(mid.ctx.uapStatus["harv-d3"]) && mid.log.destroyed === 1);
  const du = world({ pageUrl: () => "data:image/jpeg;base64,AAAA" }); await du.ctx.uapFile("harv-d3", inp(PDF()));
  ok("a page link comes back as a data URI: no pages — never a data URI in the database", du.writes.length === 1 && J(du.writes).indexOf("data:") < 0 && /no link came back for page 1/.test(du.ctx.uapStatus["harv-d3"]));
  const zero = world({ pages: 0 }); await zero.ctx.uapFile("harv-d3", inp(PDF()));
  ok("a PDF pdf.js reads as 0 pages: no pages, said plainly", zero.writes.length === 1 && /no pages in it/.test(zero.ctx.uapStatus["harv-d3"]));
}
{
  const w = world(); const c = w.ctx;
  // Mom replaces the PDF while the first one's pages are still being made: the first run must not attach its pages to the new PDF
  const slowDoc = { numPages: 2, destroy: () => {}, getPage: async () => { c.unitStudies.harv.activities[1].pdf = { url: "https://store.example/other.pdf", title: "other" }; return { getViewport: v => ({ width: 10, height: 10, scale: v.scale }), render: () => ({ promise: Promise.resolve() }) }; } };
  c.nbLoadPdfJs = async () => ({ getDocument: () => ({ promise: Promise.resolve(slowDoc) }) });
  await c.uapFile("harv-d3", inp(PDF()));
  ok("the PDF was replaced meanwhile: these pages are not attached to the new one", w.writes.length === 1 && !c.unitStudies.harv.activities[1].pdf.pages && /another PDF now/.test(c.uapStatus["harv-d3"]));
}

console.log("\n── + Add, dry run, not Mom, without the block ──");
{
  const dom = { "utaa-harv-d1-line": { value: "Pumpkin sheet | 4" }, "utaa-harv-d1-onecopy": { checked: false } };
  const w = world({ dom, pages: 2 }); const c = w.ctx; c.uakPick("harv-d1", "print");
  await c.uapFile("harv-d1", inp(PDF("pumpkin"))); ok("a file held for + Add: nothing loaded, drawn or put yet", w.log.load === 0 && w.puts.length === 0);
  c.utaaAdd("harv", "d1"); for (let i = 0; i < 12; i++) await tick();
  ok("+ Add → the PDF and its 2 pages under the NEW key, pages written as 2 leaves on activities/2", w.puts.length === 3 && w.puts.every(p => p.path.indexOf("activities/pumpkin_sheet/pumpkin_") > 0) &&
    w.writes.length === 3 && J(Object.keys(w.writes[2][2])) === J(["unitStudies/harv/activities/2/pdf/pages/1", "unitStudies/harv/activities/2/pdf/pages/2"]), w.writes.map(x => Object.keys(x[2])));
}
{
  const d = world({ dry: true }); await d.ctx.uapFile("harv-d3", inp(PDF()));
  ok("dry run: nothing loaded, drawn, uploaded or written", d.log.load === 0 && d.puts.length === 0 && d.writes.length === 0);
  const r = await d.ctx.uapgPages("harv", "leaf_map", PDF(), "pictures/x.pdf", "https://x", "harv-d3");
  ok("…even called straight: no pages in a dry run", r.err && d.puts.length === 0 && d.log.load === 0);
  const k = world({ mom: false }); await k.ctx.uapFile("harv-d3", inp(PDF()));
  ok("not Mom: nothing", k.log.load === 0 && k.puts.length === 0 && k.writes.length === 0);
  const n = world({ noLoader: true }); await n.ctx.uapFile("harv-d3", inp(PDF()));
  ok("no PDF reader in the app: the PDF saved, no pages, said", n.writes.length === 1 && /the PDF reader isn’t in this app/.test(n.ctx.uapStatus["harv-d3"]));
}
{
  const A = world({ before: true }), B = world({ before: true, pages: 21 });
  await A.ctx.uapFile("harv-d3", inp(PDF())); await B.ctx.uapFile("harv-d3", inp(PDF()));
  ok("without the block: slice 4's upload exactly — one put, one write, no pdf.js, the plain line", A.puts.length === 1 && A.writes.length === 1 && A.log.load === 0 && A.ctx.uapStatus["harv-d3"] === "✓ Saved the PDF: leaf map");
  const C = world({ pages: 21 }); await C.ctx.uapFile("harv-d3", inp(PDF()));
  ok("with the block, a paper-only PDF writes exactly what slice 4 wrote (same paths)", J(C.writes.map(x => Object.keys(x[2]))) === J(B.writes.map(x => Object.keys(x[2]))));
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
})().catch(e => { console.log("CRASH", e && e.stack); process.exit(1); });
