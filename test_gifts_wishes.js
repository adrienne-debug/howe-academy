/*
 * Node tests for 🎁 Gifts — slice 7 (2026-11-20, her "Kids' wish lists → yes, later" + her yes to building it): kids' wish lists.
 *   Kid side — Kids' Corner ▸ 🎁 My wish list (index.html WISHES block + lazy wishes.js):
 *     · the button opens the page and loads wishes.js once, lazily (never at app start)
 *     · the kid's device listens to wishes/<that kid> ONLY, only while the page is open (switching kid / leaving the tab stops it)
 *     · a wish = ONE set on wishes/<kid>/<wid> (+ ONE set on wishPhotos/<kid>/<wid> first, when it has a picture); a picture alone is
 *       fine; nothing → no write; remove = second tap, ONE multi-path remove of the wish + its photo; ?dryrun=1 → no writes
 *     · the kid's view never shows a status — the same before and after Mom turns a wish into a present
 *   Mom side — gifts.js GIFTS_WISH on a kid's person page:
 *     · 💌 card lists that kid's wishes; 💭 Add as an idea = the new-present sheet prefilled (name, for that kid, this occasion);
 *       Save = ONE set on gifts/items with wish:"<kid>/<wid>" and NOTHING under wishes/; the wish then shows "✓ on your list"
 *     · picture read only on tap (wishPhotos/<kid>/<wid> once); ✕ = ONE multi-path remove; dry run = no writes
 *   Source: db.ref("gifts never in index.html or wishes.js; wishes.js never reads gifts/.
 *
 *   run:  node test_gifts_wishes.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
let pass = 0, fail = 0;
function ok(n, c, x) { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x) + ")" : "")); } }
const HTML = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const WSRC = fs.readFileSync(path.join(__dirname, "wishes.js"), "utf8");
const GSRC = fs.readFileSync(path.join(__dirname, "gifts.js"), "utf8");
const slice = (src, a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i); return i >= 0 && j > i ? src.slice(i, j) : ""; };

// ── a fake Firebase that records every write, listener and one-time read ───────────
function fakeDb(log) {
  return { ref(p) { const P = p === undefined ? "" : p; return {
    set(v) { log.writes.push({ op: "set", path: P, val: JSON.parse(JSON.stringify(v)) }); },
    update(v) { log.writes.push({ op: "update", path: P, val: JSON.parse(JSON.stringify(v)) }); },
    remove() { log.writes.push({ op: "remove", path: P }); },
    push(v) { log.writes.push({ op: "push", path: P, val: v }); },
    on(ev, fn) { log.listens.push(P); log.cbs[P] = fn; },
    off() { log.offs.push(P); },
    once() { log.onces.push(P); return Promise.resolve({ val: () => log.photo || null }); } }; } };
}
function el(id) { return { id, innerHTML: "", value: "", style: {}, focus() {}, setSelectionRange() {}, appendChild() {} }; }

console.log("\n# Kids' Corner side — the WISHES block + wishes.js");
const K = { writes: [], listens: [], offs: [], onces: [], cbs: {} };
const knodes = {}, scripts = [];
let kdry = false, renders = 0;
const kctx = { console, Date, Math, JSON, Promise, setTimeout: fn => 0,
  document: { getElementById(id) { return knodes[id] || null; }, createElement(t) { return el(t); }, head: { appendChild(s) { if (s.src !== undefined) scripts.push(s); } }, activeElement: null },
  db: fakeDb(K), _dryRun: () => kdry, gwShowToast() {}, location: { hostname: "localhost", search: "" },
  ROSTER: ["kida", "kidb"], KID_COLOR: { kida: "#2563eb", kidb: "#db2777" }, kcLittle: k => k === "kidb", _kcTint: () => "#eef",
  kcPlay: null, kcPlayClose() { kctx.kcPlay = null; }, renderAll() { renders++; }, tab: "kids" };
kctx.window = kctx; vm.createContext(kctx);
const block = slice(HTML, "// WISHES_START", "// WISHES_END");
ok("index.html has the WISHES block", block.length > 200);
vm.runInContext(block, kctx);
{
  ok("the 🎁 My wish list button, for any kid", /My wish list/.test(kctx.wlTileHTML("kida")) && /wlOpen\('kidb'\)/.test(kctx.wlTileHTML("kidb")));
  ok("a kid not in the family list can't open one", (kctx.wlOpen("nobody"), kctx.wlKid === null && scripts.length === 0));
  kctx.kcPlay = { who: "kida" }; kctx.wlOpen("kida");
  ok("open: wishes.js loads lazily, once; Drills/Games closed", scripts.length === 1 && scripts[0].src === "wishes.js" && kctx.kcPlay === null && kctx.wlOn("kida"));
  ok("before it loads: ← Back + Opening…", /Opening your wish list/.test(kctx.wlPageHTML("kida")) && /wlBack\(\)/.test(kctx.wlPageHTML("kida")));
  kctx.wlOpen("kida");
  ok("a second tap doesn't load it again", scripts.length === 1);
  ok("nothing listened to yet (the page hasn't drawn)", K.listens.length === 0);
  vm.runInContext(WSRC, kctx); scripts[0].onload();
  knodes["wl-root"] = el("wl-root");
  let h = kctx.wlPageHTML("kida");
  ok("the page listens to wishes/kida ONLY", K.listens.length === 1 && K.listens[0] === "wishes/kida", K.listens);
  ok("until the list arrives: Loading your wishes…", /Loading your wishes/.test(h));
  K.cbs["wishes/kida"]({ val: () => null }); h = kctx.wishesPageHTML("kida");
  ok("page: title, Back, Add a wish; no suggested wish text", /🎁 My wish list/.test(h) && /← Back/.test(h) && /＋ Add a wish/.test(h) && !/e\.g\./.test(WSRC));
  K.cbs["wishes/kida"]({ val: () => null });
  h = kctx.wishesPageHTML("kida");
  ok("empty list says so", /No wishes yet/.test(h));

  // a typed wish with ⭐⭐
  K.writes.length = 0;
  kctx.wishNew(); kctx.wishSet("Red scooter"); kctx.wishStars(2); kctx.wishAdd();
  let ws = K.writes.slice();
  ok("typed wish = ONE set on wishes/kida/<wid>", ws.length === 1 && ws[0].op === "set" && /^wishes\/kida\/w[a-z0-9]+$/.test(ws[0].path), ws);
  ok("…with text + stars + ts, no picture flag, nothing else", ws[0].val.text === "Red scooter" && ws[0].val.stars === 2 && ws[0].val.ts > 0 && !("hasPhoto" in ws[0].val) && Object.keys(ws[0].val).sort().join() === "stars,text,ts", ws[0].val);
  const w1 = ws[0].path.split("/")[2];

  // a picture-only wish (a kid who can't read yet)
  K.writes.length = 0;
  kctx.wishNew(); kctx._wlTest.setPhoto("data:image/jpeg;base64,AAAA"); kctx.wishAdd();
  ws = K.writes.slice();
  ok("picture wish = the photo set FIRST on wishPhotos/kida/<wid>, then ONE set on wishes/kida/<wid>",
    ws.length === 2 && ws[0].op === "set" && ws[0].path.indexOf("wishPhotos/kida/") === 0 && ws[0].val === "data:image/jpeg;base64,AAAA" &&
    ws[1].op === "set" && ws[1].path === "wishes/kida/" + ws[0].path.split("/")[2] && ws[1].val.hasPhoto === true && !("text" in ws[1].val) && !("stars" in ws[1].val), ws);
  const w2 = ws[1].path.split("/")[2];

  K.writes.length = 0;
  kctx.wishNew(); kctx.wishSet("   "); kctx.wishAdd();
  ok("nothing typed, no picture → no write, the box stays open", K.writes.length === 0 && !!kctx._wlTest.draft());
  kctx.wishCancel();

  // the server echoes both wishes back
  const server = {}; server[w1] = { text: "Red scooter", stars: 2, ts: 2 }; server[w2] = { hasPhoto: true, ts: 3 }; server.wx = { hasPhoto: true, text: "Fish tank", ts: 4 };
  K.cbs["wishes/kida"]({ val: () => JSON.parse(JSON.stringify(server)) });
  const kidView = kctx._wlTest.inner("kida");
  ok("kid sees their wishes: words, ⭐⭐, the picture spot", /Red scooter/.test(kidView) && /⭐⭐/.test(kidView) && /wl-thumb/.test(kidView));
  ok("a picture it just took isn't read back; another one = once on wishPhotos/kida/<wid>, never a listener", K.onces.length === 1 && K.onces[0] === "wishPhotos/kida/wx" && K.listens.length === 1, K.onces);
  ok("kid view shows NO status (idea / ordered / bought / on your list / ✓)", !/idea|ordered|bought|on your list|✓ on|wrapped|Santa/i.test(kidView.replace(/wl-[a-z-]+/g, "")), kidView.match(/idea|ordered|bought|on your list/gi));

  // remove: the second tap is the yes
  K.writes.length = 0;
  kctx.wishRemove(w2);
  ok("first ✕ tap asks (no write)", K.writes.length === 0 && /Tap again to remove/.test(kctx._wlTest.inner("kida")));
  kctx.wishRemove(w2);
  ws = K.writes.slice();
  ok("second tap = ONE multi-path remove of the wish + its photo", ws.length === 1 && ws[0].op === "update" && ws[0].path === "" &&
    Object.keys(ws[0].val).sort().join() === ["wishPhotos/kida/" + w2, "wishes/kida/" + w2].sort().join() && Object.values(ws[0].val).every(v => v === null), ws);
  K.writes.length = 0;
  kctx.wishRemove(w1); kctx.wishRemove(w1);
  ok("a wish with no picture: remove touches only wishes/kida/<wid>", K.writes.length === 1 && Object.keys(K.writes[0].val).join() === "wishes/kida/" + w1);

  // dry run
  kdry = true; K.writes.length = 0;
  kctx.wishNew(); kctx.wishSet("Kite"); kctx.wishAdd();
  const dw = Object.keys(kctx._wlTest.data())[0];
  kctx.wishRemove(dw); kctx.wishRemove(dw);
  ok("?dryrun=1: add + remove write nothing", K.writes.length === 0);
  kdry = false;

  // the list is full at 40
  const full = {}; for (let i = 0; i < kctx._wlTest.max; i++) full["w" + i] = { text: "x" + i, ts: i };
  K.cbs["wishes/kida"]({ val: () => full });
  K.writes.length = 0; kctx.wishNew(); kctx.wishSet("one more"); kctx.wishAdd();
  ok("40 wishes: no more added", K.writes.length === 0 && /list is full/.test(kctx._wlTest.inner("kida")));
  kctx.wishCancel();

  // closing: another kid, or leaving the tab, stops the listener
  ok("switching to another kid closes the page and stops the kidA listener", kctx.wlOn("kidb") === false && kctx.wlKid === null && K.offs.indexOf("wishes/kida") >= 0 && kctx._wlTest.for() === null);
  kctx.wlOpen("kidb"); kctx.wlPageHTML("kidb"); K.cbs["wishes/kidb"]({ val: () => null });
  ok("kid B's page listens to wishes/kidb only", K.listens[K.listens.length - 1] === "wishes/kidb" && K.listens.every(p => /^wishes\/kid[ab]$/.test(p)));
  ok("a little kid (pre-reader) gets the big page, picture buttons first", /wl-little/.test(kctx.wishesPageHTML("kidb")) && (kctx.wishNew(), (h = kctx._wlTest.inner("kidb")), h.indexOf("Take a picture") < h.indexOf("What is it?")));
  kctx.wishCancel();
  kctx.tab = "schedule";
  ok("leaving the Kids' Corner tab closes it", kctx.wlOn("kidb") === false && K.offs.indexOf("wishes/kidb") >= 0);
  kctx.tab = "kids"; kctx.wlOpen("kidb"); kctx.wlBack();
  ok("← Back closes it", kctx.wlKid === null);
}

console.log("\n# Hooks + the secret, in the source");
{
  const kc = slice(HTML, "function renderKidsCorner(el){", "\nfunction kcAddOpen");
  ok("Kids' Corner: wish page in place of the buttons + page, the button under the buttons", /wlOn\(k\)\) h\+=wlPageHTML\(k\)/.test(kc) && kc.indexOf("kcCalToggleHTML(k)") < kc.indexOf("wlTileHTML(k)") && kc.indexOf("wlTileHTML(k)") < kc.indexOf("kcModeBodyHTML(k)"));
  ok("a tab tap closes the wish list", /if\(typeof wlClose==="function"\) wlClose\(\);/.test(slice(HTML, "function showTab(", "\nfunction ")) || /wlClose\(\);   \/\/ 🎁 WISHES/.test(HTML));
  ok("wishes.js is loaded only from the WISHES block (never at start)", HTML.split("wishes.js").length - 1 === (block.split("wishes.js").length - 1) && block.split("wishes.js").length - 1 >= 1);
  ok("db.ref(\"gifts never in index.html or wishes.js", HTML.indexOf('db.ref("gifts') < 0 && WSRC.indexOf('ref("gifts') < 0 && WSRC.indexOf("giftPhotos") < 0);
  ok("wishes.js never reads gifts/ at all (only wishes/ + wishPhotos/ refs)", (WSRC.match(/db\.ref\("([a-zA-Z]+)/g) || []).every(r => /db\.ref\("(wishes|wishPhotos)$/.test(r)) && !/ref\(["']gifts/.test(WSRC));
  ok("wishes.js has exactly one listener (.on) — its own list", (WSRC.match(/\.on\(/g) || []).length === 1 && /db\.ref\("wishes\/"\+k\)/.test(WSRC));
  ok("gifts.js writes nothing under wishes/ except Mom's ✕ remove", (GSRC.match(/"wishes\/"\+/g) || []).length === 1 && /up\["wishes\/"\+kid\+"\/"\+wid\]=null/.test(GSRC));
}

console.log("\n# Mom side — gifts.js 💌 on a kid's page");
const M = { writes: [], listens: [], offs: [], onces: [], cbs: {}, photo: "data:image/jpeg;base64,BBBB" };
const mnodes = {}; const root = el("content");
let mdry = false, mom = true;
const LS = {};
const mctx = { console, Date, Math, JSON, Promise, document: { getElementById(id) { return mnodes[id] || null; }, createElement(t) { return el(t); }, head: { appendChild() {} }, activeElement: null },
  db: fakeDb(M), _todayStr: () => "2026-11-20", _dryRun: () => mdry, momHere: () => mom, gwShowToast() {}, confirm: () => true,
  HA_LS: { getItem: k => (k in LS ? LS[k] : null), setItem: (k, v) => { LS[k] = String(v); } }, tab: "moms-plan", mpSubView: "gifts" };
mctx.window = mctx; vm.createContext(mctx);
vm.runInContext("const ROSTER_DEF=[{id:'kida',name:'Avery',color:'#2563eb'},{id:'kidb',name:'Blake',color:'#db2777'}];", mctx);
vm.runInContext(GSRC, mctx);
const T = mctx._gfTest, WT = mctx._gfWishTest, W = mctx;
const D = () => ({ occasions: { x: { name: "Christmas 2026", kind: "christmas", date: "2026-12-25",
    secs: { santa: { name: "Santa", emoji: "🎅", order: 0 }, parents: { name: "From Mom & Dad", emoji: "🎁", order: 1 } } } },
  people: { "p-gran": { name: "Gran", group: "mom", ts: 1 } }, items: {} });
const WISH = () => ({ kida: { w1: { text: "Red scooter", stars: 3, ts: 1763600000000 }, w2: { hasPhoto: true, ts: 1763610000000 } } });
{
  M.writes.length = 0; T.setData(D()); T.reset(); T.setOcc("x"); T.setRoot(root, "<nav/>");
  W.gfOpenPerson("k_kida");
  ok("a kid's page starts listening to wishes/ (Mom only, on that page)", M.listens.indexOf("wishes") >= 0 && WT.on());
  WT.setWishes(WISH()); W.gfOpenPerson("k_kida");
  let h = root.innerHTML;
  ok("💌 Their wish list: words, ⭐⭐⭐, a picture wish, Add as an idea", /💌 Their wish list/.test(h) && /Red scooter/.test(h) && /⭐⭐⭐/.test(h) && /a picture/.test(h) && (h.match(/💭 Add as an idea/g) || []).length === 2);
  W.gfOpenPerson("p-gran");
  ok("not on a grown-up's page", !/Their wish list/.test(root.innerHTML));
  W.gfOpenPerson("k_kidb");
  ok("a kid with none: 'hasn't added any wishes yet'", /Blake hasn't added any wishes yet/.test(root.innerHTML));

  W.gfOpenPerson("k_kida"); M.writes.length = 0;
  W.gfWishAdd("kida", "w1");
  const E = T.edit();
  ok("💭 Add as an idea → the new-present sheet, prefilled", E && E.kind === "item" && !E.id && E.form.name === "Red scooter" && E.form.pids.join() === "k_kida" && E.form.occ === "x" && E.form.status === "idea" && E.form.wish === "kida/w1", E && E.form);
  ok("…nothing written yet", M.writes.length === 0);
  W.gfSave();
  const sets = M.writes.filter(w => w.op === "set");
  ok("Save = ONE set on gifts/items/<iid> carrying wish:\"kida/w1\"", sets.length === 1 && /^gifts\/items\//.test(sets[0].path) && sets[0].val.wish === "kida/w1" && sets[0].val.name === "Red scooter" && sets[0].val.pids.join() === "k_kida", sets);
  ok("…and NOTHING under wishes/ or wishPhotos/", M.writes.every(w => w.path !== "" && !/^wish/.test(w.path)), M.writes.map(w => w.path));
  h = root.innerHTML;
  ok("the wish now shows ✓ on your list (Mom's side) — one Add left", /✓ on your list · 💭 Idea/.test(h) && (h.match(/💭 Add as an idea/g) || []).length === 1);
  ok("the kid's own wish record is untouched", JSON.stringify(WT.wishes().kida.w1) === JSON.stringify(WISH().kida.w1));
  const iid = sets[0].path.split("/")[2];
  M.writes.length = 0; W.gfEditItem(iid); W.gfSetDraw("status", "ordered"); W.gfSave();
  ok("editing that present keeps its wish link", M.writes.find(w => w.op === "set").val.wish === "kida/w1" && /✓ on your list · 🛒 Ordered/.test(root.innerHTML));

  // the kid's list is exactly the same as before Mom's add (nothing in wishes/ changed)
  kctx.tab = "kids"; kctx.wlOpen("kida"); kctx.wlPageHTML("kida");
  K.cbs["wishes/kida"]({ val: () => JSON.parse(JSON.stringify(WISH().kida)) });
  const before = kctx._wlTest.inner("kida");
  K.cbs["wishes/kida"]({ val: () => JSON.parse(JSON.stringify(WT.wishes().kida)) });
  ok("kid view after Mom made it a present = the same page, no status", kctx._wlTest.inner("kida") === before && !/on your list|Ordered|Idea/.test(before));
  kctx.wlBack();

  // picture on tap
  M.onces.length = 0;
  ok("no picture read until she taps", M.onces.length === 0 && !/<img/.test(root.innerHTML));
  W.gfWishPicShow("kida", "w2");
  ok("tap 🖼 = once on wishPhotos/kida/w2", M.onces.length === 1 && M.onces[0] === "wishPhotos/kida/w2");
  W.gfWishPicShow("kida", "w2"); W.gfWishPicShow("kida", "w2");
  ok("a second look doesn't read it again", M.onces.length === 1);

  // a picture-only wish has no words: she names it before Save
  M.writes.length = 0; W.gfWishAdd("kida", "w2"); W.gfSave();
  ok("picture-only wish: the sheet needs a name first (no write)", M.writes.length === 0 && T.edit() && T.edit().form.wish === "kida/w2");
  W.gfSet("name", "Doll house"); W.gfSave();
  ok("…then ONE set with wish:\"kida/w2\"", M.writes.filter(w => w.op === "set").length === 1 && M.writes.find(w => w.op === "set").val.wish === "kida/w2");

  // remove
  M.writes.length = 0; W.gfWishDel("kida", "w2");
  ok("✕ = ONE multi-path remove of the wish + its photo", M.writes.length === 1 && M.writes[0].op === "update" && M.writes[0].path === "" &&
    Object.keys(M.writes[0].val).sort().join() === "wishPhotos/kida/w2,wishes/kida/w2" && Object.values(M.writes[0].val).every(v => v === null), M.writes);
  ok("…and it's gone from her card", !/a picture/.test(root.innerHTML));
  mctx.confirm = () => false; M.writes.length = 0; W.gfWishDel("kida", "w1");
  ok("cancel the question → nothing removed", M.writes.length === 0 && !!WT.wishes().kida.w1);
  mctx.confirm = () => true;

  // dry run
  mdry = true; M.writes.length = 0;
  W.gfWishDel("kida", "w1");
  WT.setWishes({ kida: { w3: { text: "Kite", ts: 5 } } }); W.gfWishAdd("kida", "w3"); W.gfSave();
  ok("dry run: remove + add-as-idea write nothing", M.writes.length === 0);
  mdry = false;

  // many wishes fold
  const many = { kida: {} }; for (let i = 0; i < 8; i++) many.kida["m" + i] = { text: "Wish " + i, ts: i };
  WT.setWishes(many); W.gfOpenPerson("k_kida"); h = root.innerHTML;
  ok("more than 5: newest 5 + Show all 8", /Wish 7/.test(h) && !/Wish 2</.test(h) && /Show all 8/.test(h));
  W.gfWishMore("kida");
  ok("Show all unfolds", /Wish 0/.test(root.innerHTML) && /Show fewer/.test(root.innerHTML));
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
