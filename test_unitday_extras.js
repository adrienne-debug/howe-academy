// 🖼🍎 UNITDAY_EXTRAS — Pictures & documents and a Snack on a unit day (her words 2026-11-11, for Sara: "on each day another section
//   … pictures and documents that would open when they click it on that day. Also, a section for snacks … kind of like there's crafts").
//   Runs the REAL UNITTRACK + CRAFT + DAYCARD + UNITDAY_EXTRAS blocks (and LESSONRES's cleaners) against a fake db that records paths.
//   · the block exists, its only db writes are …/track/days/<i>/res/docs and …/track/days/<i>/snack — one set each, no whole-unit set
//   · utClean keeps res.docs + snack; "Save this day" keeps docs when it rewrites res
//   · the day card draws the docs row + the snack section when present; a picture opens in the gallery, a PDF / link in a new tab
//   · supplies readers (utResOf → the Sunday list, the Days table cell) include the snack's supplies
//   · a day without the new fields cleans and renders byte-identical with the block as without it
//   · uploads: a picture through picStore under pictures/units/<id>/days/<day>/…, a PDF as application/pdf in the same folder;
//     a data URI never lands in the record; dry run uploads and writes nothing
//   run: node test_unitday_extras.js
const fs = require("fs"), path = require("path"), vm = require("vm"), crypto = require("crypto");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const cut = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error("markers " + a); return src.slice(i, j); };
const fn = name => { const i = src.indexOf("function " + name + "("); if (i < 0) throw new Error("no " + name); let d = 0, j = i, seen = false; for (; j < src.length; j++) { const c = src[j]; if (c === "{") { d++; seen = true; } else if (c === "}") { d--; if (seen && d === 0) break; } } return src.slice(i, j + 1); };
const UT = cut("// UNITTRACK_START", "// UNITTRACK_END"), CR = cut("// CRAFT_START", "// CRAFT_END"), DC = cut("// DAYCARD_START", "// DAYCARD_END");
const UX = cut("// UNITDAY_EXTRAS_START", "// UNITDAY_EXTRAS_END");
const LR = "const LR_PARTS=[\"links\",\"supplies\",\"books\",\"orders\",\"notes\"];\n" + ["lrSafeUrl", "lrList", "lrStr", "lrDate", "lrClean", "lrHost", "_picSlug", "picStorePath"].map(fn).join("\n");
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x) : "")); } };
const J = x => JSON.stringify(x);
const sha = s => crypto.createHash("sha256").update(String(s)).digest("hex");
const PIC = "https://firebasestorage.googleapis.com/v0/b/x/o/pictures%2Funits%2Fthanksgiving%2Fdays%2Fd6%2Fhunt_abc.jpg?alt=media&token=t";
const PDF = "https://firebasestorage.googleapis.com/v0/b/x/o/pictures%2Funits%2Fthanksgiving%2Fdays%2Fd6%2Fhunt_list_abc.pdf?alt=media&token=t";
const LINK = "https://example.org/gratitude-games";
const UNIT = () => ({ id: "thanksgiving", title: "Thanksgiving", emoji: "🦃", decks: [],
  track: { mode: "seq", perWeek: 4, days: [
    { id: "d1", n: 1, t: "Who were the Wampanoag?", res: { books: [{ title: "Squanto's Journey", by: "Joseph Bruchac" }], links: [{ url: "https://www.youtube.com/watch?v=abc", label: "The first harvest", kind: "video" }], supplies: [{ name: "paper", qty: "2" }] },
      craft: { title: "Hand turkey", steps: [{ text: "Trace your hand" }, { text: "Color the feathers" }], supplies: [{ name: "crayons" }] }, note: "Keep it short." },
    { id: "d6", n: 6, t: "Giving thanks", res: { books: [{ title: "Thanksgiving Is for Giving Thanks" }],
      docs: [{ kind: "image", title: "Gratitude scavenger hunt", url: PIC, by: "Sara" }, { kind: "pdf", title: "Hunt checklist", url: PDF }, { kind: "link", title: "More games", url: LINK }, { kind: "image", title: "bad", url: "data:image/png;base64,AAAA" }] },
      snack: { title: "Pilgrim corn muffins", steps: [{ text: "Mix" }, { text: "Bake" }], supplies: [{ name: "corn muffin mix", qty: "1" }, { name: "oven mitt", kids: false }] } }] } });
function world(o) {
  o = o || {}; const writes = [], gallery = [], puts = [], picCalls = []; const dom = o.dom || {};
  const ctx = { console, JSON, Object, Array, String, Number, Math, Set, Map, RegExp, Date, Promise, Error, parseInt, isNaN, isFinite, WeakMap, URL,
    unitStudies: { thanksgiving: o.unit || UNIT() }, momHere: () => o.mom !== false, _dryRun: () => !!o.dry,
    db: { ref: p => ({ set: v => writes.push(["set", p === undefined ? "" : p, JSON.parse(J(v === undefined ? null : v))]), update: v => writes.push(["update", p === undefined ? "" : p, JSON.parse(J(v))]) }) },
    renderAll: () => { ctx.repaints = (ctx.repaints || 0) + 1; }, repaints: 0, confirm: () => true,
    document: { getElementById: id => (id in dom) ? dom[id] : null },
    _ugReg: {}, _ug: null, _ugDraw: () => { ctx.drawn = (ctx.drawn || 0) + 1; },
    unitGalleryOpen: id => { gallery.push(id); ctx._ug = { pics: ctx._ugReg[id], i: 0 }; },
    mastCompressImg: () => Promise.resolve("data:image/jpeg;base64,AAAA"),
    picStore: (d, parts) => { picCalls.push(parts); return Promise.resolve(o.picFails ? d : PIC); },
    firebase: { storage: () => ({ ref: p => ({ put: (f, meta) => { puts.push([p, meta]); return Promise.resolve(); }, getDownloadURL: () => Promise.resolve(PDF) }) }) } };
  vm.createContext(ctx);
  vm.runInContext(LR + "\n" + UT + "\n" + CR + "\n" + DC + "\n" + (o.noUx ? "" : UX), ctx);
  return { ctx, writes, dom, gallery, puts, picCalls };
}
const P_DOCS = "unitStudies/thanksgiving/track/days/1/res/docs", P_SNACK = "unitStudies/thanksgiving/track/days/1/snack";
const G = (c, id) => { const u = c.unitStudies.thanksgiving; return { day: c.utRef("thanksgiving", c.utDay(u, id)), u: u, first: null, present: [] }; };
const visible = h => h.replace(/<style[\s\S]*?<\/style>/g, "").replace(/<[^>]+>/g, " ");

console.log("── the block ──");
ok("UNITDAY_EXTRAS is a marked block; its hooks sit in utClean, utResOf, the day editor, Save this day, and the day card",
  UX.length > 3000 && /uxCleanInto\(day,d\)/.test(UT) && /uxEditorHTML\(u,d\)/.test(UT) && /docs:\(d\.res\|\|\{\}\)\.docs/.test(UT) && /snack:true/.test(UT) && /uxDocsCardHTML\(g\)/.test(DC) && /uxSnackCardHTML\(g\)/.test(DC));
{
  const refs = UX.match(/db\.ref\([^)]*\)\.[a-z]+\(/g) || [];
  ok("the block's db writes are exactly two: …/days/<k>/res/docs and …/days/<k>/snack, each a set", refs.length === 2 && refs.some(r => /"\/track\/days\/"\+x\.k\+"\/res\/docs"\)\.set\($/.test(r)) && refs.some(r => /"\/track\/days\/"\+x\.k\+"\/snack"\)\.set\($/.test(r)), refs);
  ok("no whole-unit / whole-track / whole-day set, no multi-path update, no listener or timer", !/ref\("unitStudies\/"\+uid\)|\/track"\)|\/track\/days\/"\+x\.k\)|\.update\(|\.on\(|setInterval|addEventListener/.test(UX));
  ok("writes go through db only when db && !_dryRun; Mom-only gates on the writers", /function uxLive\(\)\{ return !!\(typeof db!=="undefined"&&db\)&&!\(\(typeof _dryRun==="function"\)&&_dryRun\(\)\); \}/.test(UX) && /function uxWriteDocs\(uid,dayId,list\)\{\n  if\(!uxMom\(\)/.test(UX) && /function uxWriteSnack\(uid,dayId,value\)\{\n  if\(!uxMom\(\)/.test(UX));
  ok("no 🔀 in the block", UX.indexOf("\u{1F500}") < 0);
}

console.log("\n── the shapes, cleaned ──");
{
  const c = world().ctx, d6 = c.utDay(c.unitStudies.thanksgiving, "d6");
  ok("res.docs kept (https only — the data URI dropped), kinds and titles kept, by kept", J(d6.res.docs) === J([{ kind: "image", title: "Gratitude scavenger hunt", url: PIC, by: "Sara" }, { kind: "pdf", title: "Hunt checklist", url: PDF }, { kind: "link", title: "More games", url: LINK }]), d6.res.docs);
  ok("the day's books stay beside docs", d6.res.books.length === 1 && d6.res.books[0].title === "Thanksgiving Is for Giving Thanks");
  ok("snack kept in craft's shape (supplies get kids, | mom → kids:false)", J(d6.snack) === J({ title: "Pilgrim corn muffins", steps: [{ text: "Mix" }, { text: "Bake" }], supplies: [{ name: "corn muffin mix", kids: true, qty: "1" }, { name: "oven mitt", kids: false }] }), d6.snack);
  ok("a kind is guessed from the link when missing or unknown; an empty title gets the kind's name", J(c.uxCleanDocs([{ url: "https://a.org/x.PDF?y=1" }, { url: "https://a.org/p.jpeg", kind: "zzz" }, { url: "https://docs.google.com/document/d/1" }, { url: "https://a.org/" }]).map(x => x.kind + ":" + x.title)) === J(["pdf:PDF", "image:Picture", "doc:Document", "link:Link"]));
}

console.log("\n── a day without the new fields is unchanged ──");
{
  const a = world({ noUx: true }).ctx, b = world().ctx;
  const ua = a.unitStudies.thanksgiving, ub = b.unitStudies.thanksgiving;
  ok("utClean: Day 1 cleans byte-identical with and without the block", J(a.utDay(ua, "d1")) === J(b.utDay(ub, "d1")));
  const ha = sha(a.dcDayHTML(G(a, "d1"))), hb = sha(b.dcDayHTML(G(b, "d1")));
  ok("the day card for Day 1 hashes the same with and without the block", ha === hb, [ha, hb]);
  ok("the Days table row for Day 1 is byte-identical", a.utRowHTML(ua, a.utDay(ua, "d1"), true) === b.utRowHTML(ub, b.utDay(ub, "d1"), true));
  ok("utResOf for Day 1 is identical", J(a.utResOf([a.utDay(ua, "d1")])) === J(b.utResOf([b.utDay(ub, "d1")])));
  ok("Day 1's card has no docs row and no snack section", !/Pictures &amp; documents|\u{1F34E} Snack/u.test(b.dcDayHTML(G(b, "d1"))));
}

console.log("\n── the day card ──");
{
  const w = world(), c = w.ctx; const h = c.dcDayHTML(G(c, "d6"));
  ok("draws 🖼 Pictures & documents and 🍎 Snack", /\u{1F5BC} Pictures &amp; documents/u.test(h) && /\u{1F34E} Snack/u.test(h));
  ok("the docs row comes after the book and before the snack; the snack is drawn like Craft (numbered steps, then 🎒 supplies)",
    h.indexOf("The book") < h.indexOf("Pictures &amp; documents") && h.indexOf("Pictures &amp; documents") < h.indexOf("\u{1F34E} Snack") && /<ol[^>]*>\s*<li[^>]*>Mix<\/li><li[^>]*>Bake<\/li><\/ol>/.test(h) && /\u{1F392} 1 corn muffin mix · oven mitt/u.test(h));
  const pdfA = (h.match(/<a data-ux-open="pdf"[^>]*>/) || [""])[0], linkA = (h.match(/<a data-ux-open="link"[^>]*>/) || [""])[0];
  ok("a PDF and a link open in a new tab (target=_blank, rel=noopener noreferrer)", /target="_blank"/.test(pdfA) && /rel="noopener noreferrer"/.test(pdfA) && pdfA.indexOf(PDF.replace(/&/g, "&amp;")) > 0 && /target="_blank"/.test(linkA) && linkA.indexOf(LINK) > 0, [pdfA, linkA]);
  const picB = (h.match(/<button data-ux-pic="1" onclick="([^"]*)"/) || [])[1] || "";
  ok("a picture is a button into the viewer (no link, no title in the onclick)", /^uxPicOpen\('ux[0-9a-z]+',0\)$/.test(picB) && !/<a [^>]*hunt_abc/.test(h), picB);
  ok("titles show; no URL is visible text", /Gratitude scavenger hunt/.test(visible(h)) && /Hunt checklist/.test(visible(h)) && /More games/.test(visible(h)) && !/https?:|firebasestorage|example\.org/.test(visible(h)));
  const gid = /uxPicOpen\('([^']+)'/.exec(picB)[1];
  ok("the gallery gets the day's pictures only, with the photo credit", J(c._ugReg[gid]) === J([{ url: PIC, by: "Sara" }]));
  c.uxPicOpen(gid, 0);
  ok("tapping the picture opens UNITPICS_CREDIT's gallery on it", w.gallery.length === 1 && w.gallery[0] === gid && c._ug && c._ug.i === 0);
  const u = c.unitStudies.thanksgiving; c.utDay(u, "d6").res.docs.push({ kind: "image", title: "Two", url: PIC + "2" });
  const h2 = c.dcDayHTML(G(c, "d6")); c.uxPicOpen(gid, 1);
  ok("with two pictures, the second tile opens the gallery at picture 2", /uxPicOpen\('ux[0-9a-z]+',1\)/.test(h2) && c._ug.i === 1 && c.drawn >= 1);
  ok("a snack with only supplies still draws; an empty snack draws nothing", /corn/.test(c.uxSnackCardHTML({ day: { snack: { supplies: [{ name: "corn", kids: true }] } } })) && c.uxSnackCardHTML({ day: { snack: {} } }) === "" && c.uxDocsCardHTML({ day: { res: {} } }) === "");
}

console.log("\n── supplies readers ──");
{
  const c = world().ctx, u = c.unitStudies.thanksgiving, d6 = c.utDay(u, "d6");
  const r = c.utResOf([d6]);
  ok("utResOf (the Sunday list / Family group / kids' bring line) carries the snack's supplies, tagged snack:true", r.supplies.some(s => s.name === "corn muffin mix" && s.snack === true && s.kids === true) && r.supplies.some(s => s.name === "oven mitt" && s.kids === false));
  ok("utResOf does not add docs to the lesson record (LESSONRES parts only)", !("docs" in r));
  ok("the Days table's 🎒 Supplies cell lists them as 🍎 …", J(c.utCellList(d6, "supplies")) === J(["\u{1F34E} 1 corn muffin mix", "\u{1F34E} oven mitt"]));
  const row = c.utRowHTML(u, d6, true);
  ok("the Days table row badges 🖼 3 and 🍎", /\u{1F5BC} 3/u.test(row) && /title="a snack"/.test(row));
}

console.log("\n── the writes ──");
{
  const w = world(), c = w.ctx;
  ok("uxWriteSnack → ONE set at …/days/1/snack with the cleaned value", c.uxWriteSnack("thanksgiving", "d6", { title: "Apple slices", steps: [{ text: "Slice" }], supplies: [{ name: "apples", qty: "4" }] }) === true && w.writes.length === 1 && J(w.writes[0]) === J(["set", P_SNACK, { title: "Apple slices", steps: [{ text: "Slice" }], supplies: [{ name: "apples", kids: true, qty: "4" }] }]), w.writes);
  w.writes.length = 0;
  ok("uxDocMove → ONE set at …/days/1/res/docs, the order swapped", c.uxDocMove("thanksgiving", "d6", 0, 1) === true && w.writes.length === 1 && w.writes[0][1] === P_DOCS && J(w.writes[0][2].map(x => x.title)) === J(["Hunt checklist", "Gratitude scavenger hunt", "More games"]), w.writes);
  w.writes.length = 0; c.uxDocTitle("thanksgiving", "d6", 2, "Gratitude games");
  ok("uxDocTitle renames in place (one set of res/docs)", w.writes.length === 1 && w.writes[0][1] === P_DOCS && w.writes[0][2][2].title === "Gratitude games");
  w.writes.length = 0; c.uxDocRemove("thanksgiving", "d6", 0);
  ok("uxDocRemove takes one off (one set of res/docs); the books stay on screen", w.writes.length === 1 && w.writes[0][2].length === 2 && c.utDay(c.unitStudies.thanksgiving, "d6").res.books.length === 1);
  w.writes.length = 0; c.uxDocRemove("thanksgiving", "d6", 0); c.uxDocRemove("thanksgiving", "d6", 0);
  ok("the last one off sets res/docs to null (clears the part); the books stay", J(w.writes[w.writes.length - 1]) === J(["set", P_DOCS, null]) && c.utDay(c.unitStudies.thanksgiving, "d6").res.books.length === 1);
  w.writes.length = 0; c.uxWriteSnack("thanksgiving", "d6", null);
  ok("an empty snack clears it (set null)", J(w.writes) === J([["set", P_SNACK, null]]) && !c.utDay(c.unitStudies.thanksgiving, "d6").snack);
  ok("every write path is one of the two per-day paths", true);
}
{
  const w = world({ dom: { "ux-thanksgiving-d1-url": { value: LINK }, "ux-thanksgiving-d1-title": { value: "  Thankful games " } } }), c = w.ctx;
  ok("+ Add the link on a day with none → one set of …/days/0/res/docs = [{kind:link,…}]; the day's books/links/supplies untouched",
    c.uxDocAddLink("thanksgiving", "d1") === true && J(w.writes) === J([["set", "unitStudies/thanksgiving/track/days/0/res/docs", [{ kind: "link", title: "Thankful games", url: LINK }]]]) && c.utDay(c.unitStudies.thanksgiving, "d1").res.books.length === 1, w.writes);
  w.dom["ux-thanksgiving-d1-url"].value = "javascript:alert(1)"; w.writes.length = 0;
  ok("a link that isn't https is refused, nothing written", c.uxDocAddLink("thanksgiving", "d1") === false && w.writes.length === 0);
}
{
  const dom = { "ux-thanksgiving-d6-stitle": { value: "Popcorn" }, "ux-thanksgiving-d6-ssteps": { value: "Pop it\n\nShare it" }, "ux-thanksgiving-d6-ssup": { value: "1 bag popcorn\npot | mom" } };
  const w = world({ dom }), c = w.ctx;
  ok("Save the snack reads the boxes (steps per line, qty name, | mom) → one set of …/snack", c.uxSnackSave("thanksgiving", "d6") === true && J(w.writes) === J([["set", P_SNACK, { title: "Popcorn", steps: [{ text: "Pop it" }, { text: "Share it" }], supplies: [{ name: "bag popcorn", kids: true, qty: "1" }, { name: "pot", kids: false }] }]]), w.writes);
}
{
  const w = world({ mom: false }), c = w.ctx;
  ok("not Mom → no write, no editor", c.uxWriteDocs("thanksgiving", "d6", []) === false && c.uxWriteSnack("thanksgiving", "d6", null) === false && c.uxEditorHTML(c.unitStudies.thanksgiving, c.utDay(c.unitStudies.thanksgiving, "d6")) === "" && w.writes.length === 0);
}
{
  const w = world({ dry: true }), c = w.ctx;
  ok("dry run → the day changes on screen, nothing written", c.uxWriteSnack("thanksgiving", "d6", { title: "Pie" }) === true && w.writes.length === 0 && c.utDay(c.unitStudies.thanksgiving, "d6").snack.title === "Pie");
}

console.log("\n── Save this day keeps docs ──");
{
  const c0 = world().ctx; const d6 = c0.utDay(c0.unitStudies.thanksgiving, "d6");
  const dom = { "ut-e-t": { value: d6.t }, "ut-e-links": { value: "https://a.org/v | A video" }, "ut-e-books": { value: c0.utLinesOf("books", d6) }, "ut-e-supplies": { value: "" }, "ut-e-orders": { value: "" }, "ut-e-cards": { value: "" }, "ut-e-note": { value: "" }, "ut-e-wtitle": { value: "" }, "ut-e-wby": { value: "" }, "ut-e-wtext": { value: "" }, "ut-e-rmode": { value: "" }, "ut-e-rwhat": { value: "" }, "ut-e-rurl": { value: "" } };
  const w = world({ dom }), c = w.ctx; c.utEditSave("thanksgiving", "d6");
  const resW = w.writes.find(x => /\/res$/.test(x[1]));
  ok("a new link through the Links box writes res with the new link AND the docs still in it", resW && resW[2].links.length === 1 && resW[2].docs && resW[2].docs.length === 3, w.writes);
  ok("…and the day on screen still has its docs and snack", c.utDay(c.unitStudies.thanksgiving, "d6").res.docs.length === 3 && !!c.utDay(c.unitStudies.thanksgiving, "d6").snack);
}

console.log("\n── the editor ──");
{
  const c = world().ctx, u = c.unitStudies.thanksgiving, d6 = c.utDay(u, "d6");
  const h = c.utEditorHTML(u, d6);
  ok("the day editor shows 🖼 Pictures & documents and 🍎 Snack under ✂️ Craft", h.indexOf("Craft on this day") > 0 && h.indexOf("Craft on this day") < h.indexOf("Pictures &amp; documents") && h.indexOf("Pictures &amp; documents") < h.indexOf("Snack on this day"));
  ok("a picture from the camera roll / a file (image/*), a PDF (.pdf), a pasted link", /accept="image\/\*" onchange="uxDocFile\(/.test(h) && /accept="application\/pdf,\.pdf" onchange="uxDocFile\(/.test(h) && /uxDocAddLink\(/.test(h));
  ok("each doc: a title box, ▲ ▼, ✕", (h.match(/onchange="uxDocTitle\(/g) || []).length === 3 && (h.match(/uxDocMove\(/g) || []).length === 6 && (h.match(/uxDocRemove\(/g) || []).length === 3);
  ok("the snack boxes are filled from the day (| mom kept)", /value="Pilgrim corn muffins"/.test(h) && /Mix\nBake<\/textarea>/.test(h) && /1 corn muffin mix\noven mitt \| mom<\/textarea>/.test(h));
}

(async () => {
  console.log("\n── uploads ──");
  {
    const dom = { "ux-thanksgiving-d6-title": { value: "Scavenger hunt page 2" } };
    const w = world({ dom }), c = w.ctx;
    const r = await c.uxDocFile("thanksgiving", "d6", { files: [{ name: "IMG_1.HEIC", type: "image/heic", size: 3e6 }], value: "x" });
    ok("a picture goes through picStore under units/<id>/days/<day>/<title> and is added as kind image", r === true && J(w.picCalls[0]) === J(["units", "thanksgiving", "days", "d6", "Scavenger hunt page 2"]) && J(w.writes[w.writes.length - 1][2].slice(-1)[0]) === J({ kind: "image", title: "Scavenger hunt page 2", url: PIC }), [w.picCalls, w.writes]);
    ok("…its Storage path is pictures/units/thanksgiving/days/d6/…", /^pictures\/units\/thanksgiving\/days\/d6\/Scavenger_hunt_page_2_[0-9a-z]+\.jpg$/.test(c.picStorePath(w.picCalls[0])));
  }
  {
    const w = world(), c = w.ctx;
    const r = await c.uxDocFile("thanksgiving", "d6", { files: [{ name: "hunt_list.pdf", type: "application/pdf", size: 2e6 }], value: "x" });
    ok("a PDF is put as application/pdf at pictures/units/thanksgiving/days/d6/hunt_list_<stamp>.pdf and added as kind pdf (title from the name)",
      r === true && w.puts.length === 1 && /^pictures\/units\/thanksgiving\/days\/d6\/hunt_list_[0-9a-z]+\.pdf$/.test(w.puts[0][0]) && w.puts[0][1].contentType === "application/pdf" && J(w.writes[w.writes.length - 1][2].slice(-1)[0]) === J({ kind: "pdf", title: "hunt list", url: PDF }), [w.puts, w.writes]);
  }
  {
    const w = world(), c = w.ctx;
    ok("a too-large PDF and a non-picture file are refused, nothing uploaded or written",
      (await c.uxDocFile("thanksgiving", "d6", { files: [{ name: "big.pdf", type: "application/pdf", size: 50 * 1024 * 1024 }] })) === false && (await c.uxDocFile("thanksgiving", "d6", { files: [{ name: "a.zip", type: "application/zip", size: 10 }] })) === false && w.puts.length === 0 && w.writes.length === 0);
  }
  {
    const w = world({ picFails: true }), c = w.ctx;
    ok("a picture upload that falls back to a data URI is NOT saved (never a data URI in the record)", (await c.uxDocFile("thanksgiving", "d6", { files: [{ name: "a.jpg", type: "image/jpeg", size: 10 }] })) === false && w.writes.length === 0 && /Didn/.test(vm.runInContext("uxStatus", c)["thanksgiving|d6"]));
  }
  {
    const w = world({ dry: true }), c = w.ctx;
    ok("dry run: no upload, no write", (await c.uxDocFile("thanksgiving", "d6", { files: [{ name: "a.pdf", type: "application/pdf", size: 10 }] })) === false && w.puts.length === 0 && w.picCalls.length === 0 && w.writes.length === 0);
  }
  console.log("\n" + pass + " passed, " + fail + " failed");
  process.exit(fail ? 1 : 0);
})();
