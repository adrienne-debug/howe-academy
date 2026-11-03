// ✚ UBANYPASTE — the Units Builder reads whatever a mom brings (Sara 2026-11-02: ChatGPT vocabulary lists saved as PDFs; her
//   paste "could not separate the word with the definition"; Adrienne: "read whatever she inserted in there").
//   · 📸 takes a PDF as well as photos: the PDF goes to Claude as a document block (as the receipt reader sends one)
//   · a pasted list (2+ lines) that isn't clean `front | back` goes to Claude; a single typed line stays here; videos never
//   · no key, or Claude fails → the app splits each line itself: bullets, numbers, **bold**, table pipes off; first tab / dash / colon
//   · clean `a | b` pastes stay local and instant; every card still waits for a tick
//   run: node test_unit_any_paste.js
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const cut = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error("markers " + a); return src.slice(i, j); };
const UB = cut("// UNITBUILD_START", "// UNITBUILD_END");
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x) : "")); } };
function world(o) {
  o = o || {}; const asks = [];
  const ctx = { console, JSON, Object, Array, String, Number, Math, Set, Map, RegExp, Date, parseInt, isNaN, isFinite, Promise, setTimeout, Error,
    unitStudies: {}, momHere: () => true, _dryRun: () => true, db: null, HA_LS: { getItem: () => "Mom", setItem: () => {} },
    renderAll: () => {}, lrSafeUrl: u => /^https:\/\//i.test(String(u || "").trim()) ? String(u).trim() : "",
    kitCapKey: () => (o.key === false ? "" : "k"), _cbShrinkImage: async () => "IMG",
    kitCapAsk: async (content) => { asks.push(content); if (o.askFails) throw new Error("Claude 529 — overloaded"); return o.reply || '{"items":[{"front":"habitat","back":"the natural home of an animal"}]}'; },
    FileReader: function () { this.readAsDataURL = f => { this.result = "data:application/pdf;base64,PDFDATA"; this.onload(); }; },
    document: { getElementById: id => (o.dom && (id in o.dom)) ? o.dom[id] : null } };
  vm.createContext(ctx);
  vm.runInContext(UB + "\nObject.defineProperty(this,'ubForm',{get:()=>ubForm,set:v=>{ubForm=v;}});", ctx);
  ctx.ubOpen(); ctx.ubSet("title", "Habitats"); ctx.ubGo("fill");
  return { ctx, asks };
}
const paste = (w, kind, text) => { const el = { value: text }; w.ctx.document.getElementById = id => id === "ub-in-" + kind + "-0" ? el : null; const r = w.ctx.ubAddLines(0, kind); return { r, el }; };
const cards = w => w.ctx.ubForm.days[0].cards.map(c => [c.front, c.back]);
const CHATGPT = "Here is your vocabulary list:\n\n1. **Habitat** – the natural home of an animal\n2. **Predator**: an animal that hunts others\n- Prey - an animal that is hunted\n• Erosion\tthe wearing away of rock";

(async () => {
  console.log("── the line splitter (no key) ──");
  {
    const w = world({ key: false }), c = w.ctx;
    ok("ubLine takes bullets, numbers, **bold** and table pipes off", c.ubLine("1. **Habitat** – home") === "Habitat – home" && c.ubLine("- Prey") === "Prey" && c.ubLine("• Erosion") === "Erosion" && c.ubLine("| Word | Def |") === "Word | Def" && c.ubLine("(3) x") === "x");
    ok("ubSplitLoose: en dash, em dash, spaced hyphen, colon, tab, =", [["a – b"], ["a — b"], ["a - b"], ["a: b"], ["a\tb"], ["a = b"]].every(([s]) => JSON.stringify(c.ubSplitLoose(s)) === '["a","b"]'));
    ok("…and leaves a hyphenated word, a time and a link alone", c.ubSplitLoose("well-known").length === 1 && c.ubSplitLoose("3:45").length === 1 && c.ubSplitLoose("https://x.org").length === 1);
    const { r, el } = paste(w, "cards", CHATGPT);
    ok("a ChatGPT list with no key → split here, word and meaning apart", r === 5 && JSON.stringify(cards(w).slice(1)) === JSON.stringify([["Habitat", "the natural home of an animal"], ["Predator", "an animal that hunts others"], ["Prey", "an animal that is hunted"], ["Erosion", "the wearing away of rock"]]), cards(w));
    ok("…the intro line lands as a card with no back (she drops it at Check); nothing asked; the box is cleared", cards(w)[0][0] === "Here is your vocabulary list:" && cards(w)[0][1] === "" && w.asks.length === 0 && el.value === "");
    ok("…every card waits for a tick", w.ctx.ubUncheckedCount() === 5);
  }
  {
    const w = world({ key: false }), c = w.ctx;
    paste(w, "cards", "| Word | Meaning |\n|---|---|\n| Habitat | home |\n| Prey | hunted |");
    ok("a pasted table: the ---|--- row is skipped, the outer pipes don't eat the word", JSON.stringify(cards(w)) === JSON.stringify([["Word", "Meaning"], ["Habitat", "home"], ["Prey", "hunted"]]), cards(w));
    paste(w, "books", "1. Over in the Forest by Marianne Berkes\n2. Squanto's Journey – Joseph Bruchac");
    const b = c.ubForm.days[0].books.map(x => [x.title, x.by]);
    ok("books: “Title by Author” and “Title – Author” split", JSON.stringify(b) === JSON.stringify([["Over in the Forest", "Marianne Berkes"], ["Squanto's Journey", "Joseph Bruchac"]]), b);
    paste(w, "videos", "- Animal homes (https://youtu.be/abc)\nhttps://youtu.be/def – Who lives here?\nftp://no");
    const v = c.ubForm.days[0].videos.map(x => [x.url, x.label]);
    ok("videos: the link is found anywhere in the line, the rest is the label; a bad link is dropped", JSON.stringify(v) === JSON.stringify([["https://youtu.be/abc", "Animal homes"], ["https://youtu.be/def", "Who lives here?"]]), v);
    paste(w, "acts", "Shoebox diorama – build a habitat\nNature walk | 10 | find three homes");
    const a = c.ubForm.days[0].acts.map(x => [x.title, x.points, x.desc]);
    ok("activities: “title – a line” keeps 5 points; the piped line is read as before", JSON.stringify(a) === JSON.stringify([["Shoebox diorama", 5, "build a habitat"], ["Nature walk", 10, "find three homes"]]), a);
  }
  console.log("\n── with the family key: a messy paste goes to Claude ──");
  {
    const w = world(), c = w.ctx;
    const { r, el } = paste(w, "cards", CHATGPT);
    ok("ubAddLines hands back a promise and clears the box at once", r && typeof r.then === "function" && el.value === "");
    ok("…busy while Claude reads", c.ubForm.busy === true && /Claude is reading it/.test(c.ubPageHTML()));
    const n = await r;
    ok("Claude was sent the whole paste and the cards prompt", w.asks.length === 1 && w.asks[0][0].text.indexOf("Here is your vocabulary list") >= 0 && /drill cards/.test(w.asks[0][w.asks[0].length - 1].text));
    ok("its cards land drafted (wait for a tick), a pasted source is recorded, she is told", n === 1 && c.ubForm.days[0].cards[0].draft === true && c.ubForm.sources.some(s => s.kind === "pasted" && s.n === 1) && /drafted from what you pasted/.test(c.ubForm.msg) && !c.ubForm.busy);
  }
  {
    const w = world(), c = w.ctx;
    const { r } = paste(w, "cards", "Habitat | home\nPrey | hunted");
    ok("a clean `a | b` paste stays local and instant (no Claude)", r === 2 && w.asks.length === 0);
    const r2 = paste(w, "books", "Over in the Forest").r, r4 = paste(w, "cards", "1. **Den** – a wild animal's home").r;
    ok("one plain book title, one typed `word – meaning` card stay local too (no wait)", r2 === 1 && r4 === 1 && w.asks.length === 0 && c.ubForm.days[0].cards[2].back === "a wild animal's home");
    const r3 = paste(w, "videos", "Animal homes https://youtu.be/abc\nhttps://youtu.be/def").r;
    ok("videos never go to Claude (it can't invent a link)", r3 === 2 && w.asks.length === 0);
  }
  {
    const w = world({ askFails: true }), c = w.ctx;
    const n = await paste(w, "cards", CHATGPT).r;
    ok("Claude fails → the paste is not lost: the app splits it and says so", n === 5 && cards(w)[1][0] === "Habitat" && /split it line by line/.test(c.ubForm.msg) && !c.ubForm.busy);
  }
  console.log("\n── 📸 Photo or 📄 PDF ──");
  {
    const w = world(), c = w.ctx;
    await c.ubPhoto(0, "cards", { files: [{ name: "Vocab.pdf", type: "application/pdf", size: 40000 }], value: "" });
    const d = w.asks[0].find(b => b.type === "document");
    ok("a PDF goes to Claude as a document block (base64), no image shrink", d && d.source.media_type === "application/pdf" && d.source.data === "PDFDATA" && !w.asks[0].some(b => b.type === "image"));
    ok("…its cards land drafted; the source says pdf; she is told “from the PDF”", c.ubForm.days[0].cards.length === 1 && c.ubForm.sources.some(s => s.kind === "pdf" && s.pdfs === 1) && /from the PDF/.test(c.ubForm.msg));
  }
  {
    const w = world(), c = w.ctx;
    await c.ubPhoto(0, "cards", { files: [{ name: "a.jpg", type: "image/jpeg" }, { name: "b.PDF" }], value: "" });
    ok("a photo and a PDF together: one image block, one document block (a .PDF name with no type counts)", w.asks[0].filter(b => b.type === "image").length === 1 && w.asks[0].filter(b => b.type === "document").length === 1);
  }
  {
    const w = world(), c = w.ctx;
    await c.ubPhoto(0, "cards", { files: [{ name: "huge.pdf", type: "application/pdf", size: 20 * 1024 * 1024 }], value: "" });
    ok("a PDF over 15 MB → a plain message, nothing asked", /too big/.test(c.ubForm.msg) && w.asks.length === 0 && !c.ubForm.busy);
  }
  {
    const w = world({ key: false }), c = w.ctx;
    await c.ubPhoto(0, "cards", { files: [{ name: "v.pdf", type: "application/pdf" }], value: "" });
    ok("no key → the plain message names pasting as the way that always works", /Needs a Claude key/.test(c.ubForm.msg) && /pasting/.test(c.ubForm.msg) && w.asks.length === 0);
  }
  {
    const h = world().ctx.ubPageHTML();
    ok("each box's button reads Photo or PDF and accepts PDFs; the hint says any shape", (h.match(/accept="image\/\*,application\/pdf,\.pdf"/g) || []).length === 4 && /Photo or/.test(h) && /paste a list in any shape/.test(h));
    ok("no kid's name in the new code", !/taylor|makenzie|andrew|caleb|lincoln|ellis|lucy|julian/i.test(cut("function ubLine(", "function ubDi(") + cut("function ubCanAsk(", "// ── the spread")));
  }
  console.log("\n" + pass + " passed, " + fail + " failed"); process.exit(fail ? 1 : 0);
})().catch(e => { console.log("CRASH", e); process.exit(1); });
