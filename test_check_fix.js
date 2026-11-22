// ✓ CHECKFIX — the ＋ Add cards check screen: one-tap fixes and where the cards go (PLAN_unit_easy_import_2026-11-19.md §2.4,
//   §6, slice B; her standing rule: the app asks DATABASE vs ACTIVE LEARNING, never decides silently).
//   Runs the REAL CARDSPLIT + CHECKFIX blocks, the real unitBatchAdd / unitBatchClose / unitBatchSave, and the real unitEnroll
//   (for the item shape) on stubs.
//   · each fix on a fixture row: ↔ Swap · ⤓ Join · ✂ Split (where she tapped / first comma / first word) · ✕ drop
//   · "Split at" chips re-read the paste; "It's a card" / "First line is a heading"; a heading → a new deck; doubles greyed
//   · bank is the default and the choice is always shown when a kid is enrolled; "start now" writes items ONLY for the ticked
//     cards, in unitEnroll's exact item shape; a new deck = the Builder's deck shape appended by ONE transaction
//   · dry run writes nothing; not Mom writes nothing; every write is targeted (no whole-node set)
//   run: node test_check_fix.js
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const cut = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error("markers " + a); return src.slice(i, j); };
const fn = name => { const i = src.indexOf("function " + name + "("); if (i < 0) throw new Error("no " + name); let d = 0, j = i, seen = false; for (; j < src.length; j++) { const c = src[j]; if (c === "{") { d++; seen = true; } else if (c === "}") { d--; if (seen && d === 0) break; } } return src.slice(i, j + 1); };
const CS = cut("// CARDSPLIT_START", "// CARDSPLIT_END"), CF = cut("// CHECKFIX_START", "// CHECKFIX_END");
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x).slice(0, 700) : "")); } };
const J = x => JSON.stringify(x);
const UNIT = o => ({ u1: Object.assign({ id: "u1", title: "Pond Life", enrolled: { k1: true, k2: true, k3: false }, decks: [{ key: "Pond Life", mode: "flip", introCap: 3, cards: [{ name: "Frog", def: "An amphibian", order: 1 }, { name: "Newt", def: "A small amphibian", order: 4 }] }, { key: "Pond Plants", mode: "flip", introCap: 3, cards: [{ name: "Cattail", def: "A tall plant", order: 1 }] }] }, o || {}) });

function world(o) {
  o = o || {}; const writes = [], els = {}, alerts = [];
  const store = Object.assign({}, o.store || {});
  const el = id => els[id] || (els[id] = { id, value: "", innerHTML: "", textContent: "", style: {}, remove() { delete els[id]; } });
  const ctx = { console, JSON, Object, Array, String, Number, Math, Set, Map, RegExp, Date, parseInt, isNaN, isFinite, Promise, Error,
    unitStudies: o.units || UNIT(), masteryData: o.mastery || { k1: [{ id: "old", subject: "Other", prompt: "x" }], k2: [] }, mom: o.mom !== false,
    _dryRun: () => !!o.dry, cap: s => s ? s[0].toUpperCase() + s.slice(1) : s, mastDefKeyOk: p => !/[.#$\[\]\/]/.test(p), alert: m => alerts.push(m),
    haKeys: m => m, HA_LS: { setItem() {}, getItem() { return null; } }, renderUnits() {},
    db: { ref: p => ({
      transaction: f => { const r = f(store[p] === undefined ? null : JSON.parse(J(store[p]))); store[p] = r; writes.push([p, "tx", r]); return { then: () => {} }; },
      update: v => writes.push([p, "update", JSON.parse(J(v))]), set: v => writes.push([p, "set", v]) }) },
    document: { getElementById: id => els[id] || null, createElement: () => { const x = { style: {}, remove() { if (els[x.id] === x) delete els[x.id]; } }; return x; }, body: { appendChild: x => { els[x.id] = x; } } } };
  ctx.momHere = () => ctx.mom;
  vm.createContext(ctx);
  vm.runInContext(CS + "\n" + CF + "\n" + fn("unitBatchAdd") + "\n" + fn("unitBatchClose") + "\n" + fn("unitBatchSave") + "\n" + fn("unitEnroll") + "\nlet unitBatch=null;\nObject.defineProperty(this,'cardSheet',{get:()=>cardSheet,set:v=>{cardSheet=v;}});", ctx);
  const open = (text, deck) => { ctx.unitBatchAdd("u1", deck || "Pond Life"); el("unit-batch-txt").value = text; el("card-sheet-prev"); el("card-sheet-go"); el("unit-batch-msg"); ctx.cardSheetInput(text); return ctx.cardSheet; };
  return { ctx, writes, els, el, alerts, store, open, prev: () => els["card-sheet-prev"].innerHTML };
}
const rowsOf = S => S.rows.filter(r => !r.drop).map(r => [r.name, r.back]);
const byName = (S, n) => S.rows.find(r => r.name === n);

console.log("── one-tap fixes on a fixture row ──");
{
  const w = world(), c = w.ctx;
  const S = w.open("A tiny colorful fish - Guppy\nHeron - a tall bird that\nwades in ponds\nBetta, a colorful fish with flowing fins\nMolly a peaceful fish\nDuckweed - a floating plant");
  c.checkFixDo("swap", byName(S, "A tiny colorful fish").id);
  ok("↔ Swap: name and meaning change places", J(rowsOf(S)[0]) === J(["Guppy", "A tiny colorful fish"]), rowsOf(S));
  c.checkFixDo("join", byName(S, "Heron").id);
  ok("⤓ Join: the wrapped line joins the meaning above and its row goes", J(rowsOf(S)[1]) === J(["Heron", "a tall bird that wades in ponds"]) && !byName(S, "wades in ponds"), rowsOf(S));
  c.checkFixDo("split", byName(S, "Betta, a colorful fish with flowing fins").id);
  ok("✂ Split with no tap spot: at the first comma", J(rowsOf(S)[2]) === J(["Betta", "a colorful fish with flowing fins"]), rowsOf(S));
  const molly = byName(S, "Molly a peaceful fish"); c.checkFixCaret(molly.id, 5); c.checkFixDo("split", molly.id);
  ok("✂ Split where she tapped in the name (caret 5)", J([molly.name, molly.back]) === J(["Molly", "a peaceful fish"]));
  ok("✂ Split with no comma and no tap: after the first word; a one-word name can't split", J(c.cfSplitAt("Swim bladder organ")) === J(["Swim", "bladder organ"]) && c.cfSplitAt("Guppy") === null);
  c.checkFixDo("drop", byName(S, "Duckweed").id);
  ok("✕ drops the row (it is not drawn and not added)", !w.prev().includes("Duckweed") && !c.cardSheetReady(S).some(r => r.name === "Duckweed") && c.cardSheetReady(S).length === 4);
  ok("each fix redrew the preview; the rows have ↔ ⤓ ✂ ✕ as finger-sized buttons", /data-cf="swap"/.test(w.prev()) && /data-cf="join"/.test(w.prev()) && /data-cf="split"/.test(w.prev()) && /data-cf="drop"/.test(w.prev()) && /min-height:36px/.test(w.prev()));
  ok("⤓ on the last row does nothing", c.cfJoin(S, S.rows.filter(r => !r.drop).slice(-1)[0].id) === false);
}
console.log("\n── Split at chips · heading / card ──");
{
  const w = world(), c = w.ctx;
  const S = w.open("Betta, a colorful fish with flowing fins\nMolly, a peaceful fish, lives in fresh or brackish water");
  ok("commas inside meanings: no split, both rows amber; the chips are drawn", S.res.sep === "" && rowsOf(S).every(r => r[1] === "") && /data-cf-sep="comma"/.test(w.prev()));
  c.checkFixDo("sep", null, "comma");
  ok("“Split at: comma” re-reads the paste at the first comma; the chip shows chosen", J(rowsOf(S)) === J([["Betta", "a colorful fish with flowing fins"], ["Molly", "a peaceful fish, lives in fresh or brackish water"]]) && /data-cf-sep="comma"[^>]*background:#2d6a4f/.test(w.prev()), rowsOf(S));
  const S2 = w.open("Parts of a Fish\nMouth – takes in food\nGills – breathe underwater");
  ok("a heading is shown with “Make it a new deck” and “It's a card”", S2.res.heading === "Parts of a Fish" && /data-cf="headdeck"/.test(w.prev()) && /data-cf="headcard"/.test(w.prev()));
  c.checkFixDo("heading", null, false);
  ok("“It's a card” → the first line is a row (no meaning, amber)", !S2.res.heading && rowsOf(S2)[0][0] === "Parts of a Fish" && rowsOf(S2).length === 3);
  c.checkFixDo("heading", null, true);
  ok("“First line is a heading” → back to a heading", S2.res.heading === "Parts of a Fish" && rowsOf(S2).length === 2);
  const S3 = w.open("Fish\tMeaning\nGuppy\ttiny");
  c.checkFixDo("heading", null, false);
  ok("“The column row is a card” keeps the table's first row", J(rowsOf(S3)) === J([["Fish", "Meaning"], ["Guppy", "tiny"]]));
}
console.log("\n── doubles greyed · where they go · bank is the default ──");
{
  const w = world(), c = w.ctx;
  const S = w.open("Pond Plants\nfrog - again\nHeron - a tall bird\nCattail - a tall plant again");
  const p = w.prev();
  ok("a name already in this deck shows greyed, “already in this deck”, with no inputs; not counted", /data-cf-dup="1"[^]*frog[^]*already in this deck/.test(p) && /Check — 2 cards found/.test(p) && c.cardSheetReady(S).length === 2);
  ok("Where: this deck is picked; a new deck is offered, its box filled from the heading", /data-cf-dest="deck" checked/.test(p) && /data-cf-dest="new" (?!checked)/.test(p) && /value="Pond Plants" placeholder="deck name"/.test(p));
  ok("kids enrolled → the choice is ALWAYS shown, 📚 Database (bank) picked; no ticks", /K1, K2 are enrolled — database or active learning\?/.test(p) && /data-cf-start="bank" checked/.test(p) && /data-cf-start="now" (?!checked)/.test(p) && !/data-cf-tick/.test(p) && !S.start);
  c.checkFixDo("headdeck");
  ok("heading → new deck: the new deck is picked and named; doubles re-checked against THAT deck (Cattail is in Pond Plants, frog is not)", c.cfDest(S).kind === "new" && c.cfNewKey(S) === "Pond Plants" && byName(S, "Cattail").dup === true && !byName(S, "frog").dup, [c.cfDest(S), S.rows.map(r => [r.name, r.dup])]);
  ok("…and a note says the cards go into the deck already called that", /already a deck called that/.test(w.prev()));
  const w2 = world({ units: UNIT({ enrolled: {} }) }); w2.open("Heron - a bird");
  ok("no kid enrolled → no database / active question", !/data-cf-start/.test(w2.prev()));
}
console.log("\n── Add: bank (default) = today's writes, nothing started ──");
{
  const w = world(), c = w.ctx;
  w.open("Heron - a tall bird\nCrayfish - a small animal with claws"); c.unitBatchSave();
  ok("the deck transaction + each enrolled kid's bank + definitions — no item writes", J(w.writes.map(x => x[0] + " " + x[1])) === J(["unitStudies/u1/decks/0/cards tx", "mastery/k1_custom_items tx", "mastery/k1_settings/definitions update", "mastery/k2_custom_items tx", "mastery/k2_settings/definitions update"]) && /flowing to K1, K2 via auto-pull/.test(w.alerts[0]), w.writes.map(x => x[0]));
}
console.log("\n── Add: active learning — items ONLY for the ticked cards, in unitEnroll's shape ──");
{
  const w = world(), c = w.ctx;
  const S = w.open("Heron - a tall bird\nCrayfish - a small animal with claws\nMr. Snail - a name with a period");
  c.checkFixDo("start", null, true);
  ok("start now shows a tick on every row, on by default", (w.prev().match(/data-cf-tick="[^"]+" checked/g) || []).length === 3 && /data-cf-start="now" checked/.test(w.prev()));
  c.checkFixDo("tick", byName(S, "Crayfish").id, false);
  c.unitBatchSave();
  const items = w.writes.filter(x => /^mastery\/k\d$/.test(x[0]));
  ok("one index update of mastery/<kid> per enrolled kid, appended after what's there (k1 had 1 item, k2 none)", J(items.map(x => [x[0], Object.keys(x[2])])) === J([["mastery/k1", ["1", "2"]], ["mastery/k2", ["0", "1"]]]), items);
  ok("…only the ticked cards (Heron, Mr. Snail), not Crayfish", J(Object.values(items[0][2]).map(i => i.prompt)) === J(["Heron", "Mr. Snail"]));
  // the shape unitEnroll writes for the same cards (orders 5 and 7, as the deck transaction gives them)
  const e = world({ units: { u1: { id: "u1", decks: [{ key: "Pond Life", mode: "flip", introCap: 9, cards: [{ name: "Heron", def: "a tall bird", order: 5 }, { name: "Mr. Snail", def: "a name with a period", order: 7 }] }] } }, mastery: { k1: [{ id: "old", subject: "Other", prompt: "x" }] } });
  e.ctx.unitEnroll("u1", "k1"); const want = e.writes.find(x => x[0] === "mastery/k1")[2];
  ok("…in unitEnroll's EXACT item shape (id, status introduction, tier daily…; a name with a period flips to its meaning as recite)", J(items[0][2]) === J(want), [items[0][2], want]);
  ok("the bank and definitions are written too (all three cards), and she is told “started now”", w.writes.filter(x => /_custom_items$/.test(x[0])).every(x => x[2].filter(b => b.cat === "Pond Life").length === 3) && /started now for K1, K2/.test(w.alerts[0]));
  ok("this device's copy gets the items too", c.masteryData.k1.length === 3 && c.masteryData.k2.length === 2);
}
console.log("\n── Add: a new deck — the Builder's deck shape, ONE transaction ──");
{
  const w = world({ store: { "unitStudies/u1/decks": UNIT().u1.decks } }), c = w.ctx;
  const S = w.open("Parts of a Fish\nMouth – takes in food\nGills – breathe underwater");
  c.checkFixDo("headdeck"); c.checkFixDo("start", null, true); c.checkFixDo("tick", byName(S, "Gills").id, false);
  c.unitBatchSave();
  const tx = w.writes.find(x => x[0] === "unitStudies/u1/decks");
  const deck = tx && tx[2][2];
  ok("one transaction on unitStudies/u1/decks appends {key, mode:flip, introCap:3, cards} — the Builder's shape; the two decks before are untouched", tx && tx[2].length === 3 && J(Object.keys(deck)) === J(["key", "mode", "introCap", "cards"]) && J(deck) === J({ key: "Parts of a Fish", mode: "flip", introCap: 3, cards: [{ name: "Mouth", def: "takes in food", order: 1 }, { name: "Gills", def: "breathe underwater", order: 2 }] }) && J(tx[2].slice(0, 2)) === J(UNIT().u1.decks), tx);
  ok("…the same shape the Builder saves (u.decks=[{key,mode:\"flip\",introCap:3,cards}])", /u\.decks=\[\{key:deck,mode:"flip",introCap:3,cards:cards\}\]/.test(src));
  const k1 = w.writes.filter(x => /^mastery\/k1/.test(x[0])).map(x => [x[0], x[1], x[2]]);
  ok("each enrolled kid: bank, definitions, the deck's mode + intro cap (as unitEnroll sets them), items for the ticked card only", J(k1.map(x => x[0] + " " + x[1])) === J(["mastery/k1_custom_items tx", "mastery/k1_settings/definitions update", "mastery/k1_settings/cat_modes update", "mastery/k1_settings/cat_intro_max update", "mastery/k1 update"]) && J(k1[2][2]) === J({ "Parts of a Fish": "flip" }) && J(k1[3][2]) === J({ "Parts of a Fish": 3 }) && J(Object.values(k1[4][2]).map(i => [i.subject, i.prompt, i.id])) === J([["Parts of a Fish", "Mouth", "k1_u_partso_1"]]), k1);
  ok("no write for the kid who isn't enrolled; she is told", !w.writes.some(x => /k3/.test(x[0])) && /added to a new deck, Parts of a Fish \(K1, K2 — started now\)/.test(w.alerts[0]), w.alerts);
}
{
  const w = world({ store: { "unitStudies/u1/decks/1/cards": UNIT().u1.decks[1].cards } }), c = w.ctx;
  w.open("pond plants\nDuckweed - floats"); c.checkFixDo("headdeck"); c.unitBatchSave();
  ok("a new-deck name that matches a deck already there (any case) adds to THAT deck by today's path", J(w.writes.map(x => x[0])[0]) === J("unitStudies/u1/decks/1/cards") && w.writes[0][2].slice(-1)[0].name === "Duckweed" && w.writes[0][2].slice(-1)[0].order === 2 && !w.writes.some(x => x[0] === "unitStudies/u1/decks"));
  const w3 = world(); w3.open("Heron - a bird"); w3.el("cf-dest-new").checked = false; w3.ctx.checkFixDestName("Birds");
  ok("typing a new deck's name picks “a new deck” (its radio ticks, no redraw)", w3.ctx.cfDest(w3.ctx.cardSheet).kind === "new" && w3.els["cf-dest-new"].checked === true && /id="cf-dest-new"/.test(w3.prev()));
  const w2 = world(); w2.open("Heron - a bird"); w2.ctx.checkFixDo("dest", null, "new"); w2.ctx.checkFixDestName("   "); w2.ctx.unitBatchSave();
  ok("a new deck with no name → nothing written, “Give the new deck a name.”", w2.writes.length === 0 && /Give the new deck a name/.test(w2.els["unit-batch-msg"].textContent));
}
console.log("\n── dry run · not Mom · targeted ──");
{
  for (const [label, setup] of [["bank", () => {}], ["start now", c => c.checkFixDo("start", null, true)], ["a new deck", c => { c.checkFixDo("dest", null, "new"); c.checkFixDestName("Birds"); }]]) {
    const w = world({ dry: true }), c = w.ctx; w.open("Heron - a tall bird"); setup(c); c.unitBatchSave();
    ok("dry run (" + label + "): nothing written, the sheet stays open and says what would happen", w.writes.length === 0 && !!w.els["unit-batch-dlg"] && /Dry run — nothing written\. 1 card would go to/.test(w.els["unit-batch-msg"].textContent), w.els["unit-batch-msg"].textContent);
  }
  const w = world(), c = w.ctx; w.open("Heron - a tall bird"); c.mom = false; c.unitBatchSave();
  ok("Mom mode gone before Add → nothing written", w.writes.length === 0);
  ok("no whole-node set in the block; its ref() paths are the targeted ones", !/\.set\(/.test(CF) && J([...CF.matchAll(/\bref\(([^)]*)\)/g)].map(m => m[1])) === J(['"unitStudies/"+unitId+"/decks"', '"mastery/"+kid+"_custom_items"', '"mastery/"+kid+"_settings/definitions"', '"mastery/"+kid+"_settings/cat_modes"', '"mastery/"+kid+"_settings/cat_intro_max"', '"mastery/"+kid', ].sort((a, b) => CF.indexOf("ref(" + a) - CF.indexOf("ref(" + b))), [...CF.matchAll(/\bref\(([^)]*)\)/g)].map(m => m[1]));
  ok("every write in the block sits behind cfLive() (db && !_dryRun())", /function cfLive\(\)\{ return !!\(typeof db!=="undefined"&&db\)&&!\(\(typeof _dryRun==="function"\)&&_dryRun\(\)\); \}/.test(CF) && /function checkFixNewDeck\([^)]*\)\{ if\(!cfLive\(\)\) return null;/.test(CF) && /if\(cfLive\(\)&&Object\.keys\(iu\)\.length\) db\.ref/.test(CF));
  ok("no kid's name in the code; no 🔀", !/taylor|makenzie|andrew|caleb|lincoln|ellis|lucy|julian|sara\b/i.test(CF) && !/\u{1F500}/u.test(CF));
}
console.log("\n" + pass + " passed, " + fail + " failed"); process.exit(fail ? 1 : 0);
