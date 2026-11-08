/*
 * Node tests — 🖨 PRINTPHONE: the drill sheets print from their own tab on a phone (Sara's phone, 2026-11-08: after
 * printing / cancelling the drill sheet there was no way back to the app). Her words: "print without any extra little
 * button showing to go back to the main screen, but then after she's done printing it or seeing it, she can then go back
 * to the main app."
 *   · phone / tablet → a NEW tab with the same pages + the app's own Mastery print CSS, and a print call there; the app's
 *     page (the #mast-print-container) is never touched;
 *   · desktop → the in-page print, as before;
 *   · tab blocked → the in-page print, cleared on afterprint as well as by the timer;
 *   · the paper drill (a whole document) always gets its own tab; blocked → false (the caller says "allow pop-ups").
 * Runs the REAL PRINTPHONE block with the REAL mastPrintDrill / mastPrintCards in a fake page.
 *   run:  node test_print_phone.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const cut = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error("markers " + a); return src.slice(i, j); };
function slice(name) { const i = src.indexOf("function " + name + "("); if (i < 0) throw new Error("missing " + name);
  let d = 0; for (let k = src.indexOf("{", i); k < src.length; k++) { if (src[k] === "{") d++; else if (src[k] === "}") { d--; if (!d) return src.slice(i, k + 1); } } }
const BLOCK = cut("// PRINTPHONE_START", "// PRINTPHONE_END");
// the card-picture helpers the print sheets call (UNITPIC), when the source has them
const HELPERS = ["_mastVisNorm", "mastLiveVisual"].filter(n => src.includes("function " + n + "(")).map(slice).join("\n");
const CODE = BLOCK + "\n" + HELPERS + "\n" + slice("mastPrintDrill") + "\n" + slice("mastPrintCards");
const CSS = cut("/* MASTPRINT_CSS_START */", "/* MASTPRINT_CSS_END */");
const FONT = '<link href="https://fonts.googleapis.com/css2?family=DM+Sans" rel="stylesheet"/>';

let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x) : "")); } };

const KID = "kid1";
const DUE = [{ id: "a", prompt: "garden", tier: "daily", review_mode: "written" }, { id: "b", prompt: "7×8", tier: "weekly", review_mode: "oral" },
  { id: "c", prompt: "river", tier: "every_other_day", review_mode: "written" }];
const CARDS = [{ id: "x", prompt: "A", subject: "Letters", status: "introduction", tally_dots: 2 }, { id: "y", prompt: "Red", subject: "Colors", tier: "daily" },
  { id: "z", prompt: "Circle", subject: "Shapes", tier: "weekly" }];

// o.coarse / o.narrow — what matchMedia answers; o.blocked — window.open returns null; o.throws — window.open throws
function world(o) {
  o = o || {};
  const opened = [], timers = [], listeners = {}, els = {}, appended = [];
  let appPrints = 0, created = 0;
  const document = {
    getElementById: id => els[id] || null,
    createElement: () => { created++; return { id: "", className: "", innerHTML: "" }; },
    body: { appendChild: e => { appended.push(e); els[e.id] = e; } },
    querySelectorAll: sel => sel === "style" ? [{ textContent: "body{color:red}" }, { textContent: "x{}\n/* Mastery print */\n" + CSS + "/* MASTPRINT_CSS_END */\n.y{}" }]
      : /fonts\.googleapis/.test(sel) ? [{ outerHTML: FONT }] : [],
  };
  const window = {
    matchMedia: q => ({ matches: (/coarse/.test(q) && !!o.coarse) || (/max-width/.test(q) && !!o.narrow) }),
    open: () => { if (o.throws) throw new Error("nope"); if (o.blocked) return null;
      const w = { html: "", closed: false, document: { write: h => { w.html += h; }, close() { w.done = true; } }, close() { w.closed = true; } }; opened.push(w); return w; },
    print: () => { appPrints++; },
    addEventListener: (ev, fn) => { (listeners[ev] = listeners[ev] || []).push(fn); },
    removeEventListener: (ev, fn) => { listeners[ev] = (listeners[ev] || []).filter(f => f !== fn); },
  };
  const ctx = { console, JSON, Object, Array, String, Number, Math, Set, Map, RegExp, Date, parseInt, isNaN, window, document,
    setTimeout: (fn, ms) => { timers.push({ fn, ms }); }, alert: () => {},
    masteryKid: KID, masteryData: { [KID]: CARDS }, weekData: { week: "week12" }, WK: "week12",
    MAST_KID_COL: { [KID]: "#2563eb" }, SL_KLBL: { [KID]: "Kid One" }, MAST_KID_EMOJI: { [KID]: "🦊" },
    MAST_TIER_LBL: { daily: "Daily", weekly: "Weekly", every_other_day: "Every_Other_Day" },
    MAST_CAT_EMOJI_MAP: {}, MAST_ANIMAL_EMOJI: {},
    mastGetPrintNum: () => 7, mastOrderedDue: () => DUE.slice(),
    mastDrillSettings: () => ({}), mastColorBorder: () => "#000", mastCountEmoji: () => "🦕", mastCountN: () => 3, mastCountVisFrames: () => "",
  };
  // the print-sheet checkboxes
  els["mast-chk-student"] = { checked: true }; els["mast-chk-parent"] = { checked: true };
  vm.createContext(ctx);
  vm.runInContext(CODE, ctx);
  const flush = () => { while (timers.length) timers.shift().fn(); };
  const step = () => { const t = timers.shift(); if (t) t.fn(); return t; };
  return { ctx, opened, timers, listeners, els, appended, flush, step, prints: () => appPrints, created: () => created };
}

// What the desktop print draws into the app's page — the reference pages for each printer.
function desktopPages(fn) { const w = world(); w.ctx[fn](); return w.els["mast-print-container"].innerHTML; }

for (const fn of ["mastPrintDrill", "mastPrintCards"]) {
  console.log("\n── " + fn + " ──");
  const ref = desktopPages(fn);
  ok("(the reference pages are real sheets)", ref.length > 200 && ref.includes('class="mpp-sheet"'), ref.slice(0, 80));
  {
    const w = world();
    w.ctx[fn]();
    const c = w.els["mast-print-container"];
    ok("desktop: no new tab — the pages go into the app's print container", !w.opened.length && c && c.className === "mast-print-page" && c.innerHTML === ref);
    w.step();
    ok("desktop: …the app prints after 100 ms", w.prints() === 1);
    w.step();
    ok("desktop: …and the container is cleared after", c.innerHTML === "");
  }
  for (const [lbl, o] of [["phone (coarse pointer)", { coarse: true }], ["phone (narrow screen)", { narrow: true }]]) {
    const w = world(o);
    w.ctx[fn]();
    w.flush();
    const t = w.opened[0];
    ok(lbl + ": one new tab, written and closed", w.opened.length === 1 && t.done && t.html.startsWith("<!doctype html>"));
    ok(lbl + ": …with exactly the same pages", t && t.html.includes('<div class="mast-print-page">' + ref + "</div>"));
    ok(lbl + ": …the app's own Mastery print CSS, the font, a phone viewport", t && t.html.includes("<style>" + CSS) && t.html.includes(FONT) && /name="viewport"/.test(t.html));
    ok(lbl + ": …and it prints itself once loaded", t && /window\.onload=function\(\)\{setTimeout\(function\(\)\{window\.print\(\)\},250\)\}/.test(t.html));
    ok(lbl + ": no back button on the paper", t && !/<button/i.test(t.html) && !/<button/i.test(ref));
    ok(lbl + ": the app's page is untouched (no container, no app print)", !w.created() && !w.appended.length && !w.els["mast-print-container"] && w.prints() === 0);
  }
  for (const [lbl, o] of [["blocked tab", { coarse: true, blocked: true }], ["tab throws", { coarse: true, throws: true }]]) {
    const w = world(o);
    w.ctx[fn]();
    const c = w.els["mast-print-container"];
    ok(lbl + ": falls back to the in-page print with the same pages", !w.opened.length && c && c.innerHTML === ref);
    w.step();
    ok(lbl + ": …the app prints", w.prints() === 1);
    (w.listeners.afterprint || []).slice().forEach(f => f());
    ok(lbl + ": …afterprint clears the pages at once (not just the timer)", c.innerHTML === "" && !(w.listeners.afterprint || []).length);
    c.innerHTML = "next print"; w.step();
    ok(lbl + ": …and the late timer does nothing more", c.innerHTML === "next print");
  }
}

console.log("\n── a whole document (the paper drill) ──");
{
  const DOC = '<!doctype html><html><head><title>t</title></head><body><div class="sheet">A</div><script>relay()</' + 'script></body></html>';
  for (const [lbl, o] of [["desktop", {}], ["phone", { coarse: true }]]) {
    const w = world(o);
    const r = w.ctx.haPrintDoc("", DOC, "", { whole: true });
    const h = w.opened[0] && w.opened[0].html;
    ok(lbl + ": its own tab, the document as written + the print call after its re-lay script", r === "tab" && w.opened.length === 1
      && h === DOC.replace("</body>", vm.runInContext("HA_PRINT_GO", w.ctx) + "</body>") && h.indexOf("relay()") < h.indexOf("window.print()"));
    ok(lbl + ": the app's page is untouched", !w.created() && w.prints() === 0 && !w.timers.length);
  }
  const b = world({ blocked: true });
  ok("blocked → false and nothing drawn in the app (the caller says “Allow pop-ups to print”)", b.ctx.haPrintDoc("", DOC, "", { whole: true }) === false && !b.created() && !b.timers.length);
}

console.log("\n── the printers all go through the helper ──");
{
  const drill = slice("mastPrintDrill"), cards = slice("mastPrintCards"), paper = slice("pdPrintNext");
  ok("mastPrintDrill → haPrintDoc with the Mastery print CSS", /haPrintDoc\([^;]*pages,haPrintCss\(\)\)/.test(drill));
  ok("mastPrintCards → haPrintDoc with the Mastery print CSS", /haPrintDoc\([^;]*page,haPrintCss\(\)\)/.test(cards));
  ok("pdPrintNext → haPrintDoc (whole document)", /haPrintDoc\("",pdSheetsHtml\(kid,day,items\),"",\{whole:true\}\)/.test(paper) && /Allow pop-ups to print/.test(paper));
  ok("none of them prints or opens a tab on its own any more", [drill, cards, paper].every(f => !/window\.print|window\.open|mast-print-container/.test(f)));
  ok("only the helper draws into #mast-print-container", src.split('getElementById("mast-print-container")').length === 2 && BLOCK.includes('getElementById("mast-print-container")'));
  ok("phone = coarse pointer or the 640px phone layout", /mm\("\(pointer: coarse\)"\)\.matches\|\|mm\("\(max-width: 640px\)"\)\.matches/.test(BLOCK) && src.includes("@media (max-width:640px){"));
  ok("the CSS markers wrap the app's Mastery print rules", CSS.startsWith("/* MASTPRINT_CSS_START */\n.mast-print-page{display:none}") && /@media print\{\n  \.mast-print-page\{display:block!important/.test(CSS)
    && /\.mpp-ptable tr\{height:26px!important\}\.mpp-ptable td\{height:26px!important\}\n\}\n$/.test(CSS));
}

console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
