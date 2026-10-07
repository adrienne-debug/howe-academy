// BINDPDF (2026-10-07): the ½" prong margin must survive printing. Live: margin on, Ellis's printed pages had NO margin
// and the hole punch went through words. The margin is a CSS scale on each .page; the 📄 PDF captured the scaled box with
// html2canvas and stretched it back to 8.5in, so the gap vanished. Now the page is captured unscaled and placed 8in wide:
// fronts ½" from the left, backs gap right. Part 1 drives toPdf with stand-ins for html2canvas/jsPDF (always runs);
// part 2 renders real notebooks in an iframe in Chromium and measures the page edges (runs when Playwright is installed).
// Run: node test_nb_binding_print.js
const fs = require("fs"), path = require("path");
let pass = 0, fail = 0; const ok = (c, m) => { if (c) pass++; else { fail++; console.log("  FAIL - " + m); } };
const near = (a, b) => Math.abs(a - b) < 0.02;
const src = fs.readFileSync(path.join(__dirname, "notebooks.js"), "utf8");

console.log("BINDPDF block");
ok(src.indexOf("// BINDPDF_START") > 0 && src.indexOf("// BINDPDF_END") > src.indexOf("// BINDPDF_START"), "marked block present");
ok(/scale\(0\.94118\)/.test(src) && /var BIND_W_IN = 8;/.test(src), "CSS scale (8 / 8.5) and the PDF width agree");

// ── Part 1: toPdf with stand-ins. Each fake .page records its transform at capture time; jsPDF records addImage.
function runToPdf(classes) {
  const pages = classes.map(c => ({ className: c, style: { transform: "" }, seenTransform: null }));
  const frameDoc = { open() {}, write() {}, close() {}, querySelectorAll: sel => sel === ".page" ? pages : [], images: [], styleSheets: [], head: { appendChild() {} } };
  const placed = [];
  const html2canvas = pg => { pg.seenTransform = pg.style.transform; return Promise.resolve({ toDataURL: () => "data:x" }); };
  const frame = { style: {}, setAttribute() {}, remove() {}, contentDocument: frameDoc, contentWindow: { html2canvas } };
  const document = { createElement: () => frame, body: { appendChild() { setTimeout(() => frame.onload && frame.onload(), 0); } }, head: { appendChild() {} } };
  function jsPDF() { this.addPage = () => {}; this.addImage = (d, t, x, y, w, h) => placed.push({ x, y, w, h }); this.output = () => ({ size: 1 }); this.save = () => {}; }
  const win = { html2canvas, jspdf: { jsPDF } };
  (new Function("window", "document", src))(win, document);
  return win.HoweNotebooks.toPdf("<html></html>", "x.pdf", { returnBlob: true }).then(r => ({ r, pages, placed }));
}

(async () => {
  console.log("📄 PDF placement");
  const on = await runToPdf(["page pg-front", "page pg-back", "page pg-front", "page drill-sheet pg-back"]);
  ok(on.r.pages === 4 && on.placed.length === 4, "every page placed");
  ok(on.pages.every(p => p.seenTransform === "none"), "pages captured UNscaled (the scaled box is what lost the margin)");
  ok(on.pages.every(p => p.style.transform === ""), "the page's own scale comes back after capture");
  [0, 2].forEach(i => ok(near(on.placed[i].x, 0.5) && near(on.placed[i].w, 8) && near(on.placed[i].y, 0), "front sheet " + (i + 1) + ": ½in strip on the LEFT (x=" + on.placed[i].x + ", w=" + on.placed[i].w + ")"));
  [1, 3].forEach(i => ok(near(on.placed[i].x, 0) && near(on.placed[i].x + on.placed[i].w, 8), "back sheet " + (i + 1) + ": ½in strip on the RIGHT (right edge at " + (on.placed[i].x + on.placed[i].w) + "in)"));
  ok(on.placed.every(p => near(p.h, 11 * 8 / 8.5)), "same 8/8.5 shrink top to bottom — nothing stretched");
  const off = await runToPdf(["page", "page drill-sheet"]);
  ok(off.placed.every(p => p.x === 0 && p.w === 8.5 && p.h === 11), "margin off: pages fill the sheet exactly as before");
  ok(off.pages.every(p => p.seenTransform === ""), "margin off: page styles untouched");

  // ── Part 2: real Chromium, notebook in an iframe, print media — measure each page's content box against its page box.
  let pw = null;
  try { pw = require("playwright"); } catch (e) {
    try { pw = require(path.join(require("child_process").execSync("npm root -g", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim(), "playwright")); } catch (e2) {}
  }
  if (!pw) console.log("Chromium iframe measurement — SKIPPED (Playwright not installed)");
  else {
    console.log("Chromium iframe measurement (print media)");
    const w = {}; (new Function("window", "document", src))(w, {});
    const H = w.HoweNotebooks;
    const dates = { tuesday: "October 6", wednesday: "October 7", thursday: "October 8", friday: "October 9", monday: "October 12" };
    let browser;
    try { browser = await pw.chromium.launch(); } catch (e) { console.log("  SKIPPED — Chromium would not start: " + e.message.split("\n")[0]); }
    if (browser) {
      const page = await browser.newPage();
      await page.emulateMedia({ media: "print" });
      for (const kid of ["ellis", "lincoln", "lucy", "julian"]) for (const bm of [true, false]) {
        const html = H.generate(kid, { weekData: { dates, tasks: [] }, weekNum: 27, extraPages: {}, pace: [], units: [], bindingMargin: bm }).student
          .replace(/<link[^>]*fonts\.googleapis[^>]*>/g, "");
        await page.setContent("<html><body style='margin:0'><iframe id='f' style='width:900px;height:1200px;border:0'></iframe></body></html>");
        const m = await page.evaluate(async html => {
          const f = document.getElementById("f"), d = f.contentDocument; d.open(); d.write(html); d.close();
          await new Promise(r => setTimeout(r, 50));
          return Array.from(d.querySelectorAll(".page")).slice(0, 4).map(el => {
            const r = el.getBoundingClientRect(), x0 = el.offsetLeft, w0 = el.offsetWidth;   // offset* = the unscaled 8.5in page box
            return { cls: el.className, left: (r.left - x0) / 96, right: (x0 + w0 - r.right) / 96, page: w0 / 96 };
          });
        }, html);
        ok(m.length === 4 && m.every(p => near(p.page, 8.5)), kid + (bm ? " (margin on)" : " (margin off)") + ": 8.5in pages");
        if (bm) m.forEach((p, i) => ok(i % 2 === 0 ? (near(p.left, 0.5) && near(p.right, 0)) : (near(p.left, 0) && near(p.right, 0.5)),
          kid + " sheet " + (i + 1) + " (" + (i % 2 ? "back" : "front") + "): ½in on the " + (i % 2 ? "right" : "left") + " — measured left " + p.left.toFixed(2) + "in, right " + p.right.toFixed(2) + "in"));
        else ok(m.every(p => near(p.left, 0) && near(p.right, 0)), kid + " margin off: content to both edges, as before");
      }
      await browser.close();
    }
  }
  console.log(pass + " passed, " + fail + " failed");
  process.exit(fail ? 1 : 0);
})().catch(e => { console.log("  FAIL - threw: " + (e && e.stack || e)); process.exit(1); });
