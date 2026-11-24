// 📷 PICFOLDER — "📷 Pictures for these cards" on ＋ Add cards: a folder of photos named after the cards, paired by file name
//   (her ask 2026-11-19: "maybe there's pictures that are included in that … those pictures, those facts, those names all become
//   their little cards by themselves"; PLAN_unit_easy_import_2026-11-19.md §4, slice E; Q6: a failed picture is skipped and
//   listed, never saved as text inside the database).
//   Runs the REAL CARDSPLIT + CHECKFIX + PDFCARDS + PHOTOCARDS + SHEETCARDS + DOCXCARDS + PICFOLDER blocks, the real PICSTORE
//   (picStore over a stubbed firebase.storage(), as test_pictures_storage.js does), the real unitPicsPlan, and the real
//   unitBatchAdd / unitBatchClose / unitBatchSave. Stubbed: the image shrinker (no canvas in Node), object URLs, the database.
//   · the matcher: §4's rules exactly — extension off; case, spaces, underscores, dashes ignored; nothing else
//   · thumbnails on rows; unmatched files listed with the card dropdown (and a hand pick taken back); cards with no picture listed
//   · Add: uploads ONE AT A TIME through mastCompressImg(420, 0.82) + picStore, then CHECKFIX's writes unchanged, then ONE update
//     of unitStudies/<id> with visuals/<deck>_<name> = {imageUrl:<https>} — nothing else is written, never a data: picture
//   · a failed / unreadable / offline picture: said on its row and in a list, Add stops once, then the card goes in without it
//   · dry run, closing mid-upload, picking again mid-upload, a new deck, a coded name, caps, Mom-only, ids, balanced HTML
//   run: node test_pic_folder.js
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const cut = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error("markers " + a); return src.slice(i, j); };
const fn = name => { const i = src.indexOf("function " + name + "("); if (i < 0) throw new Error("no " + name); let d = 0, j = i, seen = false; for (; j < src.length; j++) { const c = src[j]; if (c === "{") { d++; seen = true; } else if (c === "}") { d--; if (seen && d === 0) break; } } return src.slice(i, j + 1); };
const CS = cut("// CARDSPLIT_START", "// CARDSPLIT_END"), CF = cut("// CHECKFIX_START", "// CHECKFIX_END"), PC = cut("// PDFCARDS_START", "// PDFCARDS_END"),
  PH = cut("// PHOTOCARDS_START", "// PHOTOCARDS_END"), SC = cut("// SHEETCARDS_START", "// SHEETCARDS_END"), DX = cut("// DOCXCARDS_START", "// DOCXCARDS_END"),
  PF = cut("// PICFOLDER_START", "// PICFOLDER_END"), PS = cut("// PICSTORE_START", "// PICSTORE_END").replace("PICSTORE_TIMEOUT_MS=20000", "PICSTORE_TIMEOUT_MS=40");
const PICS = "const UNIT_MORE_MAX=4;\n" + fn("haKeyOk") + "\n" + fn("haKey") + "\n" + fn("unitPicsOf") + "\n" + fn("unitPicsPlan");
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x).slice(0, 900) : "")); } };
const J = x => JSON.stringify(x);
const tick = () => new Promise(r => setTimeout(r, 0));
const settle = async (n) => { for (let i = 0; i < (n || 30); i++) await tick(); };
const MB = 1024 * 1024;
const pic = (name, o) => Object.assign({ name, type: /\.txt$/.test(name) ? "text/plain" : /\.heic$/i.test(name) ? "image/heic" : "image/jpeg", size: 300000, lastModified: 1700000000000 }, o || {});
const PASTE = "Guppy - a tiny, colorful fish\nMolly - a calm fish\nPlaty - a round fish\nGoldfish - an orange pond fish";

function world(o) {
  o = o || {}; const writes = [], els = {}, puts = [], made = [], revoked = [], shrunk = [], toasts = [], store = {};
  const G = { inflight: 0, maxInflight: 0, hold: null };
  const el = id => els[id] || (els[id] = { id, value: "", innerHTML: "", textContent: "", disabled: false, style: {}, remove() { delete els[id]; } });
  const storage = { ref(p) { return {
    put(blob, meta) { puts.push({ p, meta, size: blob && blob.size }); G.inflight++; G.maxInflight = Math.max(G.maxInflight, G.inflight);
      const bad = o.failOn && o.failOn.test(p);
      let pr; if (o.hold) pr = new Promise((res, rej) => { G.hold = () => bad ? rej(new Error("storage/unauthorized")) : res({}); });
      else pr = new Promise((res, rej) => setTimeout(() => bad ? rej(new Error("storage/unauthorized")) : res({}), 1));
      pr = pr.then(v => { G.inflight--; return v; }, e => { G.inflight--; throw e; }); pr.cancel = () => {}; return pr; },
    getDownloadURL() { return Promise.resolve("https://firebasestorage.googleapis.com/v0/b/x/o/" + encodeURIComponent(p) + "?alt=media&token=t"); } }; } };
  const ctx = { console: { log() {}, warn() {}, error() {} }, JSON, Object, Array, String, Number, Math, Set, Map, RegExp, Date, parseInt, isNaN, isFinite, Promise, Error, Uint8Array, Infinity,
    setTimeout, clearTimeout, atob, Blob,
    unitStudies: { u1: { id: "u1", title: "Fish", enrolled: { k1: true }, decks: [{ key: "Fish", mode: "flip", introCap: 3, cards: [{ name: "Goldfish", def: "An orange pond fish", order: 1 }] }],
      visuals: o.visuals || {} } },
    masteryData: { k1: [] }, mom: o.mom !== false, _dryRun: () => !!o.dry, cap: s => s, mastDefKeyOk: p => !/[.#$\[\]\/]/.test(p), alert() {},
    haKeys: m => m, renderUnits() {}, renderAll() {}, gwShowToast: m => toasts.push(m),
    kitCapKey: () => "", ubCanAsk: () => false,
    navigator: { onLine: !o.offline }, firebase: { storage: () => storage },
    URL: { createObjectURL: f => { const u = "blob:local/" + made.length; made.push(u); return u; }, revokeObjectURL: u => revoked.push(u) },
    mastCompressImg: (f, px, q) => { shrunk.push([f.name, px, q]); return /\.heic$/i.test(f.name) && !o.heicOk ? Promise.reject(new Error("Could not read image")) : Promise.resolve("data:image/jpeg;base64," + Buffer.from("JPEG:" + f.name).toString("base64")); },
    document: { getElementById: id => els[id] || null, createElement: () => { const x = { style: {}, remove() { if (els[x.id] === x) delete els[x.id]; } }; return x; }, body: { appendChild: x => { els[x.id] = x; } } } };
  ctx.momHere = () => ctx.mom;
  ctx.db = o.noDb ? null : { ref: p => ({
    transaction: f => { const r = f(store[p] === undefined ? null : JSON.parse(J(store[p]))); store[p] = r; writes.push([p, "tx", r]); return { then: () => {} }; },
    update: v => writes.push([p, "update", JSON.parse(J(v))]), set: v => writes.push([p, "set", v]) }) };
  vm.createContext(ctx);
  vm.runInContext(CS + "\n" + CF + "\n" + PC + "\n" + PH + "\n" + SC + "\n" + DX + "\n" + (o.noBlock ? "" : PF) + "\n" + PS + "\n" + PICS + "\n" + fn("unitBatchAdd") + "\n" + fn("unitBatchClose") + "\n" + fn("unitBatchSave") +
    "\nlet unitBatch=null;\nObject.defineProperty(this,'cardSheet',{get:()=>cardSheet,set:v=>{cardSheet=v;}});" + (o.noBlock ? "" : "\nObject.defineProperty(this,'picFolder',{get:()=>picFolder});"), ctx);
  const open = (text) => { ctx.unitBatchAdd("u1", "Fish"); ["unit-batch-txt", "card-sheet-prev", "card-sheet-go", "unit-batch-msg", "card-sheet-file", "pic-folder-panel"].forEach(el);
    if (text != null) { els["unit-batch-txt"].value = text; ctx.cardSheetInput(text); } return ctx.cardSheet; };
  const pick = files => { const inp = { files, value: "C:\\fakepath\\x.jpg" }; ctx.picFolderPick(inp); return inp; };
  return { ctx, G, writes, els, el, puts, made, revoked, shrunk, toasts, open, pick, prev: () => els["card-sheet-prev"].innerHTML, panel: () => els["pic-folder-panel"].innerHTML };
}
const live = S => S.rows.filter(r => !r.drop);
const row = (S, n) => live(S).find(r => r.name === n);
const noData = w => !J(w.writes).includes("data:");

(async () => {
  console.log("── the matcher: §4's rules, and only those ──");
  {
    const w = world(), c = w.ctx, K = (s, f) => c.pfKey(s, f);
    ok("extension off, then case / spaces / underscores / dashes ignored", K("neon_tetra.JPG", true) === "neontetra" && K("Neon Tetra") === "neontetra" && K("NEON-TETRA.png", true) === "neontetra" && K("neon – tetra.webp", true) === "neontetra" && K("Neon  Tetra.heic", true) === "neontetra");
    ok("only the LAST dot-part of a file name is its extension (\"Dr. Who.jpg\" = \"Dr. Who\")", K("Dr. Who.jpg", true) === K("Dr. Who") && K("Dr. Who.jpg", true) === "dr.who");
    ok("a card name keeps its dots (\"3.5\" is not an extension)", K("Cell 3.5") === "cell3.5");
    ok("nothing else is ignored: a trailing number, (1), or an apostrophe still counts (§4 names none of them)", K("Guppy 2.jpg", true) !== K("Guppy") && K("guppy (1).jpg", true) !== K("Guppy") && K("Fowlers Toad.jpg", true) !== K("Fowler's Toad"));
    ok("a name typed on one device and saved on a Mac (accents) still pairs", K("Pok\u0065\u0301mon.png", true) === K("Pok\u00e9mon"));
    const M = (files, names) => c.picMatch(files.map(f => typeof f === "string" ? { key: K(f, true), hand: null } : f), names);
    let m = M(["guppy.jpg", "MOLLY.png", "img_2231.jpg"], ["Guppy", "Molly", "Platy"]);
    ok("by name: guppy.jpg → Guppy, MOLLY.png → Molly; img_2231.jpg → none; Platy → none", J(m.row) === J([0, 1, -1]) && J(m.file) === J([0, 1, -1]) && J(m.same) === J([]), m);
    m = M(["Guppy.jpg", "guppy.png"], ["Guppy", "Molly"]);
    ok("two files with one card's name: the first gets it, the second is listed as \"its card has another picture\"", J(m.row) === J([0, -1]) && J(m.same) === J([1]), m);
    m = M(["neon-tetra.jpg", "Neon Tetra.png"], ["Neon Tetra", "Neon-Tetra"]);
    ok("two cards whose names read the same: one file each, in order", J(m.row) === J([0, 1]), m);
    m = M([{ key: "img2231", hand: "platy" }, "platy.jpg"], ["Guppy", "Platy"]);
    ok("a hand pick comes first; the by-name file for that card is then listed", J(m.row) === J([-1, 0]) && J(m.same) === J([1]), m);
    m = M([{ key: "guppy", hand: "-" }], ["Guppy"]);
    ok("\"— no card —\" by hand: never paired, not even by name", J(m.row) === J([-1]) && J(m.file) === J([-1]), m);
    m = M([{ key: "x", hand: "gone" }], ["Guppy"]);
    ok("a hand pick whose card is gone (renamed / dropped) pairs with nothing", J(m.file) === J([-1]));
    ok("pure: same answer twice, inputs untouched", (() => { const f = [{ key: "guppy", hand: null }], n = ["Guppy"]; const a = J(c.picMatch(f, n)), b = J(c.picMatch(f, n)); return a === b && J(f) === J([{ key: "guppy", hand: null }]) && J(n) === J(["Guppy"]); })());
  }

  console.log("── the sheet: pick, see, pair by hand ──");
  {
    const w = world(), c = w.ctx, S = w.open(PASTE);
    const inp = w.pick([pic("guppy.jpg"), pic("MOLLY.png", { type: "image/png" }), pic("img_2231.jpg"), pic("notes.txt"), pic("huge.jpg", { size: 11 * MB })]);
    ok("the input is cleared so picking the same files again fires again", inp.value === "");
    ok("3 pictures kept (a .txt and an 11 MB file left out); 2 matched a card", c.picFolder.files.length === 3 && /3 pictures picked · 2 matched a card/.test(w.panel()), w.panel());
    ok("thumbnails on the Guppy and Molly rows (her own file, an object URL — nothing uploaded yet)", /data-pf-thumb/.test(w.prev()) && (w.prev().match(/<img src="blob:local\/\d"/g) || []).length === 2 && w.puts.length === 0 && w.writes.length === 0);
    ok("…each thumbnail inside its own row", (() => { const p = w.prev(), g = p.indexOf('id="cs-row-' + row(S, "Guppy").id), m = p.indexOf('id="cs-row-' + row(S, "Molly").id), t = p.indexOf("blob:local/0"); return g >= 0 && t > g && t < m; })());
    ok("img_2231.jpg listed with a dropdown: — no card — / Platy (Goldfish is already in the deck — not offered)", /1 picture matched no card by name/.test(w.panel()) && /data-pf-hand="pf\d+"/.test(w.panel()) && /<option value="-" selected>— no card —<\/option><option value="platy">Platy<\/option><\/select>/.test(w.panel()), w.panel());
    ok("cards with no picture are listed plainly", /No picture: “Platy”/.test(w.panel()));
    ok("not a picture / too big: each listed with a plain line", /Not a picture, left out: “notes.txt”/.test(w.panel()) && /Over 10 MB, left out: “huge.jpg”/.test(w.panel()));
    const f3 = c.picFolder.files[2].id;
    c.picFolderHand(f3, "platy");
    ok("her pick: img_2231.jpg → Platy (thumbnail on Platy's row; Platy no longer listed as without)", /blob:local\/2/.test(w.prev()) && !/No picture:/.test(w.panel()) && /Paired by hand — pick its card/.test(w.panel()) && /<option value="platy" selected>Platy/.test(w.panel()), w.panel());
    c.picFolderHand(f3, "-");
    ok("…and taken back with \"— no card —\"", !/blob:local\/2/.test(w.prev()) && /No picture: “Platy”/.test(w.panel()));
    c.picFolderHand(f3, "platy");
    w.els["unit-batch-txt"].value = PASTE + "\nSwordtail - a fish with a long tail"; c.cardSheetInput(w.els["unit-batch-txt"].value);
    ok("re-reading the paste (new row ids) keeps every pairing — they go by name", /blob:local\/0/.test(w.prev()) && /blob:local\/1/.test(w.prev()) && /blob:local\/2/.test(w.prev()) && /No picture: “Swordtail”/.test(w.panel()));
    w.pick([pic("guppy.jpg"), pic("MOLLY.png", { type: "image/png" })]);
    ok("the same files picked twice: not doubled, said once", c.picFolder.files.length === 3 && /2 pictures picked again — already here/.test(w.panel()));
    c.unitBatchClose();
    ok("closing the sheet lets go of every thumbnail (each object URL revoked)", w.made.length === 3 && J(w.revoked.slice().sort()) === J(w.made.slice().sort()) && c.picFolder === null);
  }

  console.log("── Add: one at a time, then the cards, then ONE picture write ──");
  {
    const w0 = world({ noBlock: true }), S0 = w0.open(PASTE); w0.ctx.unitBatchSave();
    const w = world(), c = w.ctx, S = w.open(PASTE);
    w.pick([pic("guppy.jpg"), pic("MOLLY.png", { type: "image/png" }), pic("img_2231.jpg")]); c.picFolderHand(c.picFolder.files[2].id, "platy");
    c.unitBatchSave();
    ok("the tap starts the uploads — no card written yet; Add shows the progress and is disabled", w.writes.length === 0 && w.els["card-sheet-go"].disabled === true && /^Uploading 1 of 3…/.test(w.els["card-sheet-go"].textContent) && /id="pf-prog">Uploading 1 of 3…/.test(w.panel()));
    c.unitBatchSave();
    ok("a second tap while it uploads does nothing", w.writes.length === 0);
    await settle(60);
    ok("ONE upload at a time (never two in flight), 3 in all", w.G.maxInflight === 1 && w.puts.length === 3, w.G);
    ok("each picture shrunk as a tapped card's photo is (420 px, JPEG 0.82)", J(w.shrunk) === J([["guppy.jpg", 420, 0.82], ["MOLLY.png", 420, 0.82], ["img_2231.jpg", 420, 0.82]]));
    ok("Storage: pictures/units/<unit>/<deck>/<order>_<stamp>.jpg — the orders the cards get (2, 3, 4 after Goldfish 1), JPEG, a year's cache",
      /^pictures\/units\/u1\/Fish\/2_[a-z0-9]+\.jpg$/.test(w.puts[0].p) && /^pictures\/units\/u1\/Fish\/3_/.test(w.puts[1].p) && /^pictures\/units\/u1\/Fish\/4_/.test(w.puts[2].p) && w.puts.every(x => x.meta.contentType === "image/jpeg" && /max-age=31536000/.test(x.meta.cacheControl)), w.puts.map(x => x.p));
    const extra = w.writes.filter(x => !w0.writes.some(y => J(y) === J(x)));
    ok("the card writes are CHECKFIX's, exactly as without pictures (same paths, same values, same order)", J(w.writes.slice(0, w0.writes.length)) === J(w0.writes), [w.writes.map(x => x[0]), w0.writes.map(x => x[0])]);
    ok("…plus ONE update of unitStudies/u1 — and nothing else", extra.length === 1 && extra[0][0] === "unitStudies/u1" && extra[0][1] === "update" && w.writes.length === w0.writes.length + 1, extra);
    const up = extra[0] && extra[0][2] || {};
    ok("…its paths: visuals/Fish_Guppy, visuals/Fish_Molly, visuals/Fish_Platy — each {imageUrl:<the https link>} (a tapped card's photo shape)",
      J(Object.keys(up).sort()) === J(["visuals/Fish_Guppy", "visuals/Fish_Molly", "visuals/Fish_Platy"]) && Object.values(up).every(v => J(Object.keys(v)) === J(["imageUrl"]) && /^https:\/\/firebasestorage\.googleapis\.com\//.test(v.imageUrl)), up);
    ok("…each link is that card's own upload", /2_/.test(decodeURIComponent(up["visuals/Fish_Guppy"].imageUrl)) && /3_/.test(decodeURIComponent(up["visuals/Fish_Molly"].imageUrl)) && /4_/.test(decodeURIComponent(up["visuals/Fish_Platy"].imageUrl)));
    ok("no picture bytes, no data: anywhere in the database; never a set()", noData(w) && w.writes.every(x => x[1] !== "set"));
    ok("the unit on this device shows them at once; the sheet closed; a toast says how many", c.unitStudies.u1.visuals.Fish_Guppy && /^https:/.test(c.unitStudies.u1.visuals.Fish_Guppy.imageUrl) && c.cardSheet === null && /3 pictures saved on their cards/.test(w.toasts.join()));
    ok("…and the thumbnails were let go", w.revoked.length === 3);
  }

  console.log("── a card being added only: amber, drafted and doubles keep their pictures off ──");
  {
    const w = world(), c = w.ctx, S = w.open("Guppy - a tiny fish\nMolly\nGoldfish - an orange fish");
    w.pick([pic("guppy.jpg"), pic("molly.jpg"), pic("goldfish.jpg")]);
    ok("Goldfish is already in the deck: its picture pairs with nothing (no row offered)", /2 matched a card/.test(w.panel()) && /<option value="-" selected>— no card —<\/option><\/select>/.test(w.panel()) && /its card has another picture|matched no card by name/.test(w.panel()));
    c.unitBatchSave(); await settle(40);
    ok("Molly has no meaning → not added → her picture is not uploaded; only Guppy's goes up", w.puts.length === 1 && /\/2_/.test(w.puts[0].p));
    const v = w.writes.find(x => x[0] === "unitStudies/u1");
    ok("…and only Guppy's picture is written", v && J(Object.keys(v[2])) === J(["visuals/Fish_Guppy"]));
  }

  console.log("── a picture that fails: said, listed, never saved as text (Q6) ──");
  {
    const w = world({ failOn: /\/3_/ }), c = w.ctx, S = w.open(PASTE);
    w.pick([pic("guppy.jpg"), pic("MOLLY.png", { type: "image/png" }), pic("platy.jpg")]);
    c.unitBatchSave(); await settle(60);
    ok("Molly's upload is refused → after the run NOTHING is written; the sheet stays open", w.puts.length === 3 && w.writes.length === 0 && c.cardSheet === S);
    ok("her row says so; the list says which and what the next tap does", /id="pf-st-pf\d+"[^>]*>✕ didn’t upload — goes in without a picture/.test(w.prev()) && /1 picture didn’t upload \(offline, or the upload was refused\): “MOLLY\.png”\. Nothing of it was saved\. Tap Add again to add the cards — that one without a picture/.test(w.panel()), w.panel());
    ok("the Add button is back", w.els["card-sheet-go"].disabled === false && w.els["card-sheet-go"].textContent === "Add 3 cards");
    c.unitBatchSave(); await settle(10);
    const v = w.writes.find(x => x[0] === "unitStudies/u1");
    ok("the next tap: all 3 cards go in; pictures only for Guppy and Platy; Molly's not retried", J(w.writes.find(x => x[0] === "unitStudies/u1/decks/0/cards")[2].map(x => x.name)) === J(["Guppy", "Molly", "Platy"]) && J(Object.keys(v[2]).sort()) === J(["visuals/Fish_Guppy", "visuals/Fish_Platy"]) && w.puts.length === 3);
    ok("no data: picture anywhere in the database", noData(w));
  }
  {
    const w = world({ offline: true }), c = w.ctx, S = w.open(PASTE);
    w.pick([pic("guppy.jpg")]); c.unitBatchSave(); await settle(20);
    ok("offline: picStore hands back the picture itself — the app treats that as a failure, writes nothing, says so", w.puts.length === 0 && w.writes.length === 0 && /didn’t upload/.test(w.panel()));
    c.unitBatchSave(); await settle(5);
    ok("…next tap: the cards go in with NO visuals write at all", w.writes.length > 0 && !w.writes.some(x => x[0] === "unitStudies/u1") && noData(w));
  }
  {
    const w = world(), c = w.ctx, S = w.open(PASTE);
    w.pick([pic("guppy.heic"), pic("molly.jpg")]);
    c.picFolderBad(c.picFolder.files[0].id); c.picFolderBad(c.picFolder.files[0].id); c.cfRedraw();
    ok("a thumbnail the browser can't draw (HEIC on a computer): ONE plain line; at the next draw its row says so with no <img> left to fail again", (w.panel().match(/can’t be opened in this browser — often an iPhone HEIC photo: “guppy\.heic”/g) || []).length === 1 && /can’t open this picture/.test(w.prev()) && !/blob:local\/0/.test(w.prev()));
    c.unitBatchSave(); await settle(30);
    ok("…Add doesn't try it; the list says it couldn't be opened; nothing written yet", w.puts.length === 1 && w.writes.length === 0 && /1 picture couldn’t be opened here: “guppy\.heic”/.test(w.panel()));
  }
  {
    const w = world(), c = w.ctx, S = w.open(PASTE);
    w.pick([pic("platy.HEIC")]); c.unitBatchSave(); await settle(30);
    ok("a HEIC whose thumbnail drew but the shrinker can't read: failed, said, nothing written", w.puts.length === 0 && w.writes.length === 0 && /couldn’t be opened here: “platy\.HEIC”/.test(w.panel()));
  }

  console.log("── dry run · closing mid-upload · picking again mid-upload ──");
  {
    const w = world({ dry: true }), c = w.ctx, S = w.open(PASTE);
    w.pick([pic("guppy.jpg"), pic("molly.jpg")]); c.unitBatchSave(); await settle(10);
    ok("dry run: nothing uploaded, nothing written, both lines say so", w.puts.length === 0 && w.shrunk.length === 0 && w.writes.length === 0 && /Dry run — no pictures uploaded \(2 pictures would be\)/.test(w.panel()) && /^Dry run — nothing written/.test(w.els["unit-batch-msg"].textContent));
  }
  {
    const w = world({ hold: true }), c = w.ctx, S = w.open(PASTE);
    w.pick([pic("guppy.jpg"), pic("molly.jpg")]); c.unitBatchSave(); await settle(5);
    ok("an upload in flight", w.puts.length === 1 && typeof w.G.hold === "function");
    c.unitBatchClose(); w.G.hold(); await settle(20);
    ok("she closes the sheet mid-upload: the run stops — no second upload, nothing written", w.puts.length === 1 && w.writes.length === 0);
  }
  {
    const w = world({ hold: true }), c = w.ctx, S = w.open(PASTE);
    w.pick([pic("guppy.jpg"), pic("molly.jpg")]); c.unitBatchSave(); await settle(5);
    w.pick([pic("platy.jpg")]); const h = w.G.hold; h(); await settle(20);
    ok("she picks more mid-upload: the run stops (its answer set aside), Add is free again", w.puts.length === 1 && w.writes.length === 0 && w.els["card-sheet-go"].disabled === false && !/uploading…/.test(w.prev()));
    c.unitBatchSave(); for (let i = 0; i < 3; i++) { await settle(5); if (w.G.hold) w.G.hold(); } await settle(20);
    ok("…next Add uploads all three (the stopped one again — its answer never counted), then writes", w.puts.length === 4 && J(Object.keys((w.writes.find(x => x[0] === "unitStudies/u1") || [0, 0, {}])[2]).sort()) === J(["visuals/Fish_Guppy", "visuals/Fish_Molly", "visuals/Fish_Platy"]), w.puts.map(x => x.p));
  }

  console.log("── a new deck · a coded name · a card that already had extra pictures ──");
  {
    const w = world(), c = w.ctx, S = w.open("Parts of a Fish\nDorsal Fin - the fin on top\nDr. Gill - breathes"); c.checkFixDo("headdeck");
    w.pick([pic("dorsal_fin.jpg"), pic("Dr. Gill.png")]); c.unitBatchSave(); await settle(40);
    const v = w.writes.find(x => x[0] === "unitStudies/u1");
    ok("a new deck: Storage under its name, orders 1, 2", /^pictures\/units\/u1\/Parts_of_a_Fish\/1_/.test(w.puts[0].p) && /\/2_/.test(w.puts[1].p), w.puts.map(x => x.p));
    ok("…written AFTER the deck's own transaction, under visuals/Parts of a Fish_<name>; a '.' in a name coded as the app codes it (haKey)",
      w.writes.findIndex(x => x[0] === "unitStudies/u1") > w.writes.findIndex(x => x[0] === "unitStudies/u1/decks") && v && J(Object.keys(v[2]).sort()) === J(["visuals/Parts of a Fish_Dorsal Fin", "visuals/Parts of a Fish_Dr%2E Gill"]), v);
  }
  {
    const old = { imageUrl: "https://upload.wikimedia.org/old.jpg", credit: "Wikipedia · Guppy", more: ["https://x/1.jpg"] };
    const w = world({ visuals: { Fish_Guppy: old } }), c = w.ctx, S = w.open("Guppy - a tiny fish");
    w.pick([pic("guppy.jpg")]); c.unitBatchSave(); await settle(20);
    const v = w.writes.find(x => x[0] === "unitStudies/u1");
    ok("a card name that already had pictures (left from an earlier card): only imageUrl + credit:null — its extras untouched (unitPicsPlan's targeted paths)",
      v && J(Object.keys(v[2]).sort()) === J(["visuals/Fish_Guppy/credit", "visuals/Fish_Guppy/imageUrl"]) && v[2]["visuals/Fish_Guppy/credit"] === null && /^https:/.test(v[2]["visuals/Fish_Guppy/imageUrl"]), v);
  }

  console.log("── caps · Mom-only · no pictures = Add as before ──");
  {
    const w = world(), c = w.ctx, S = w.open(PASTE);
    w.pick(Array.from({ length: 103 }, (_, i) => pic("p" + i + ".jpg", { size: 1000 })));
    ok("100 pictures at a time; the rest said on screen", c.picFolder.files.length === 100 && /3 more pictures left out — 100 at a time is the most/.test(w.panel()));
  }
  {
    const w = world(), c = w.ctx, S = w.open(PASTE);
    w.pick(Array.from({ length: 32 }, (_, i) => pic("q" + i + ".jpg", { size: 9.9 * MB })));
    ok("300 MB in all; the rest said on screen", c.picFolder.files.length === 30 && /2 more pictures left out — 300 MB of pictures at once is the most/.test(w.panel()));
  }
  {
    const w = world({ mom: false }), c = w.ctx; c.mom = true; const S = w.open(PASTE); c.mom = false;
    w.pick([pic("guppy.jpg")]);
    ok("not Mom: a pick does nothing", c.picFolder === null);
    c.mom = true; w.pick([pic("guppy.jpg")]); c.mom = false; c.unitBatchSave(); await settle(10);
    ok("not Mom: Add does nothing (its Mom check comes before the pictures)", w.puts.length === 0 && w.writes.length === 0);
  }
  {
    const w0 = world({ noBlock: true }), w = world();
    w0.open(PASTE); w.open(PASTE); w0.ctx.unitBatchSave(); w.ctx.unitBatchSave();
    ok("no pictures picked: Add writes exactly what it did before (byte for byte)", J(w.writes) === J(w0.writes) && w.puts.length === 0);
    const w2 = world(); w2.open(PASTE); w2.pick([pic("swordtail.jpg")]); w2.ctx.unitBatchSave();
    ok("pictures picked but none on a card being added: Add as before, at once", w2.writes.length === w0.writes.length && w2.puts.length === 0);
  }

  console.log("── the sheet's HTML: one of each id with every door; balanced; finger-sized ──");
  {
    const w = world(), c = w.ctx;
    c.ubCanAsk = () => true; c.kitCapKey = () => "sk-test";
    const S = w.open(PASTE); w.pick([pic("guppy.jpg"), pic("img_1.jpg")]);
    const html = c.cardSheetHTML(S);
    const ids = (html.match(/\sid="([^"]+)"/g) || []).map(x => x.slice(5, -1)), dup = ids.filter((x, i) => ids.indexOf(x) !== i);
    ok("no id twice on the sheet with the PDF, File, Photo and Pictures doors and a picture on a row", dup.length === 0 && /id="card-sheet-pdf"/.test(html) && /id="card-sheet-xfile"/.test(html) && /id="card-sheet-photo"/.test(html) && /id="card-sheet-pics"/.test(html) && /id="pic-folder-panel"/.test(html), dup);
    ok("the Pictures door takes many image files", /<input type="file" id="card-sheet-pics" accept="image\/\*" multiple onchange="picFolderPick\(this\)"/.test(html));
    const bal = h => { const st = []; const re = /<\/?([a-z0-9]+)\b[^>]*?(\/?)>/gi; let m; const VOID = /^(input|img|br|hr|meta|link)$/i;
      while ((m = re.exec(h))) { const t = m[1].toLowerCase(); if (VOID.test(t) || m[2]) continue; if (m[0][1] === "/") { if (st.pop() !== t) return false; } else st.push(t); } return st.length === 0; };
    const P = c.picFolder;
    ok("balanced HTML: the door, the panel (every state), a row's thumbnail", bal(c.picFolderBtnHTML()) && bal(c.picFolderPanelHTML(S)) && bal(c.picFolderRowHTML(S, row(S, "Guppy"))) && bal(html));
    P.busy = true; P.prog = "Uploading 1 of 2…"; const busy = c.picFolderPanelInner(S); P.busy = false; P.msg = "x"; const msg = c.picFolderPanelInner(S); P.msg = "";
    P.files[0].up = { err: "upload" }; const failRow = c.picFolderRowHTML(S, row(S, "Guppy")); P.files[0].bad = true; const badRow = c.picFolderRowHTML(S, row(S, "Guppy"));
    ok("…and while uploading, with a message, a failed row, an unreadable row", bal(busy) && bal(msg) && bal(failRow) && bal(badRow) && /id="pf-prog"/.test(busy));
    ok("finger-sized: the door 40px tall, dropdowns 44px with 16px text (no iPad zoom), thumbnails 44px", /min-height:40px/.test(c.picFolderBtnHTML()) && /min-height:44px[^"]*font-size:16px/.test(c.picFolderPanelInner(S)) && /width:44px;height:44px/.test(c.picFolderRowHTML(S, row(S, "Guppy"))));
  }

  console.log("── what the block does not do ──");
  {
    ok("one PICFOLDER block; no 🔀; no kid or family name", (src.match(/\/\/ PICFOLDER_START/g) || []).length === 1 && !PF.includes("\u{1F500}") && !/lincoln|ellis|lucy|julian|howe|dewalt/i.test(PF));
    ok("its only database write is the one visuals update (no set, no transaction, no other ref)", (PF.match(/db\.ref\(/g) || []).length === 1 && /db\.ref\("unitStudies\/"\+unitId\)\.update\(up\)/.test(PF) && !/\.set\(|\.transaction\(|\.remove\(/.test(PF));
    ok("uploads only through mastCompressImg + picStore; never stores the shrunk picture itself", /mastCompressImg\(f\.file,420,0\.82\)/.test(PF) && /picStore\(d,\["units",plan\.unitId,plan\.destKey,j\.order\]\)/.test(PF) && /\/\^https:\\\/\\\/\/\.test\(url\)\) return;/.test(PF));
    ok("own state object — nothing parked on the sheet or on sheetCards", !/cardSheet\.\w+\s*=|S\.\w+\s*=(?!=)|sheetCards\.\w+\s*=/.test(PF.replace(/\/\/[^\n]*/g, "")));
    ok("unitBatchSave asks the pictures first, right after its Mom check; its own writes unchanged", /if\(!momHere\(\)\) return;   \/\/ CHECKFIX: Mom-only\n  if\(typeof picFolderGate==="function"&&picFolderGate\(\)\) return;/.test(src));
  }

  console.log("\n" + pass + " passed, " + fail + " failed");
  process.exit(fail ? 1 : 0);
})().catch(e => { console.log("CRASH", e && e.stack || e); process.exit(1); });
