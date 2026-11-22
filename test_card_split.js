// ＋ CARDSPLIT — one splitter for every list shape + a preview before Add (PLAN_unit_easy_import_2026-11-19.md §2, §6, slice A;
//   her words 2026-11-19: "if they just write a list and send it in, it doesn't need that little line that's on the keyboard").
//   Runs the REAL CARDSPLIT block, the real unitBatchAdd / unitBatchClose / unitBatchSave and the real UNITBUILD block on stubs.
//   · every §2.2 input: dashes, colons, a tab table with a header row, a heading over a numbered list, names only, name / meaning
//     on two lines, commas inside meanings (not split), a ChatGPT pipe table with its ---|--- rule, ChatGPT's chat lines
//   · ＋ Add cards on a saved unit: the preview rows, amber rows with no meaning, names already in the deck; Add writes EXACTLY
//     today's paths and values (deck cards transaction · each enrolled kid's bank transaction + definitions update), checked
//     against a hand-built fixture; nothing when not Mom
//   · the Builder's cards box: the same rules first; Claude only when the rules find nothing (prose) and a key exists
//   run: node test_card_split.js
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const cut = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error("markers " + a); return src.slice(i, j); };
const fn = name => { const i = src.indexOf("function " + name + "("); if (i < 0) throw new Error("no " + name); let d = 0, j = i, seen = false; for (; j < src.length; j++) { const c = src[j]; if (c === "{") { d++; seen = true; } else if (c === "}") { d--; if (seen && d === 0) break; } } return src.slice(i, j + 1); };
const CS = cut("// CARDSPLIT_START", "// CARDSPLIT_END"), CF = cut("// CHECKFIX_START", "// CHECKFIX_END");   // the sheet draws CHECKFIX's fixes (slice B)
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x).slice(0, 600) : "")); } };
const J = x => JSON.stringify(x);

function world(o) {
  o = o || {}; const writes = [], els = {}, alerts = [];
  const store = Object.assign({}, o.store || {});
  const el = id => els[id] || (els[id] = { id, value: "", innerHTML: "", textContent: "", style: {}, remove() { delete els[id]; } });
  const ctx = { console, JSON, Object, Array, String, Number, Math, Set, Map, RegExp, Date, parseInt, isNaN, isFinite, Promise, Error,
    unitStudies: o.units || {}, momHere: () => o.mom !== false, _dryRun: () => !!o.dry, cap: s => s ? s[0].toUpperCase() + s.slice(1) : s,
    mastDefKeyOk: p => !/[.#$\[\]\/]/.test(p), alert: m => alerts.push(m),
    db: o.noDb ? null : { ref: p => ({
      transaction: f => { const r = f(store[p] === undefined ? null : JSON.parse(J(store[p]))); store[p] = r; writes.push([p, "tx", r]); return { then: () => {} }; },
      update: v => writes.push([p, "update", v]), set: v => writes.push([p, "set", v]) }) },
    document: { getElementById: id => els[id] || null, createElement: () => { const x = { style: {}, remove() { if (els[x.id] === x) delete els[x.id]; } }; return x; }, body: { appendChild: x => { els[x.id] = x; } } } };
  vm.createContext(ctx);
  vm.runInContext(CS + "\n" + CF + "\n" + fn("unitBatchAdd") + "\n" + fn("unitBatchClose") + "\n" + fn("unitBatchSave") + "\nlet unitBatch=null;\nObject.defineProperty(this,'cardSheet',{get:()=>cardSheet,set:v=>{cardSheet=v;}});", ctx);
  return { ctx, writes, els, el, alerts, store };
}
const W = world(), c = W.ctx;
const S = (t, o) => c.cardSplit(t, o);
const pairs = r => r.rows.map(x => [x.name, x.back]);

console.log("── §2.2: every list shape, plain rules, no AI ──");
{
  const r = S("Guppy - A tiny, colorful tropical fish\nNeon Tetra - A small fish with blue and red stripes");
  ok("dashes: name → meaning, split at dash (the comma inside a meaning stays)", J(pairs(r)) === J([["Guppy", "A tiny, colorful tropical fish"], ["Neon Tetra", "A small fish with blue and red stripes"]]) && r.sep === "dash" && r.found, pairs(r));
  const r2 = S("Guppy: a tiny colorful fish\nPlaty: a peaceful round fish");
  ok("colons: split at colon", J(pairs(r2)) === J([["Guppy", "a tiny colorful fish"], ["Platy", "a peaceful round fish"]]) && r2.sep === "colon", pairs(r2));
  const r3 = S("Fish\tMeaning\nGuppy\tA tiny fish\nPlaty\tA round fish\t\n");
  ok("two columns from a sheet (tab): the first row “Fish / Meaning” is the columns, not a card", J(pairs(r3)) === J([["Guppy", "A tiny fish"], ["Platy", "A round fish"]]) && r3.sep === "tab" && J(r3.columns) === J(["Fish", "Meaning"]), [pairs(r3), r3.columns]);
  const r4 = S("Parts of a Fish\n1. Mouth – takes in food and water\n2. Gills – breathe underwater");
  ok("a heading over a numbered list: heading = suggested deck, numbers off, en dash split", r4.heading === "Parts of a Fish" && J(pairs(r4)) === J([["Mouth", "takes in food and water"], ["Gills", "breathe underwater"]]), [r4.heading, pairs(r4)]);
  const r5 = S("• Dorsal Fin\n• Caudal Fin\n• Pelvic Fin");
  ok("bullets with no meanings: 3 names, meanings empty, namesOnly (the preview says “No meanings found”)", r5.namesOnly && J(pairs(r5)) === J([["Dorsal Fin", ""], ["Caudal Fin", ""], ["Pelvic Fin", ""]]) && r5.found, pairs(r5));
  const r6 = S("Swim Bladder\n    An air-filled organ that helps the fish float\nLateral Line\n    A row of sensors along the side");
  ok("name, then its meaning indented on the next line: paired", r6.paired && J(pairs(r6)) === J([["Swim Bladder", "An air-filled organ that helps the fish float"], ["Lateral Line", "A row of sensors along the side"]]), pairs(r6));
  const r6b = S("Swim Bladder\nAn air-filled organ that helps the fish float\nLateral Line\nA row of sensors along the side");
  ok("…the same with no indent (short name, longer meaning): paired", r6b.paired && r6b.rows.length === 2 && r6b.rows[1].back === "A row of sensors along the side");
  const r7 = S("Betta, a colorful fish with flowing fins\nMolly, a peaceful fish, lives in fresh or brackish water");
  ok("commas inside meanings: NOT comma-split; both rows have no meaning (amber); rules found nothing", r7.sep === "" && r7.rows.every(x => x.back === "") && r7.rows.length === 2 && !r7.found, pairs(r7));
  const r7b = S("Guppy, small fish\nPlaty, round fish\nMolly, peaceful fish");
  ok("…but a comma on every line, exactly one each, IS the separator", r7b.sep === "comma" && J(pairs(r7b)) === J([["Guppy", "small fish"], ["Platy", "round fish"], ["Molly", "peaceful fish"]]));
  const r8 = S("| Deutsch | English |\n| --- | --- |\n| der Hund | the dog |\n| die Katze | the cat |");
  ok("a ChatGPT table: pipes win; the header row and the ---|--- rule are dropped", r8.sep === "pipe" && J(pairs(r8)) === J([["der Hund", "the dog"], ["die Katze", "the cat"]]) && J(r8.columns) === J(["Deutsch", "English"]), [pairs(r8), r8.columns]);
  const r8b = S("| **Word** | **Meaning** | **Example** |\n|:---|:---:|---:|\n| habitat | a natural home | A pond is a frog's habitat. |");
  ok("…a three-column ChatGPT table: bold off, the extra column joins the meaning", J(pairs(r8b)) === J([["habitat", "a natural home — A pond is a frog's habitat."]]), pairs(r8b));
}
console.log("\n── ChatGPT's other habits, and the per-line rules ──");
{
  const CHATGPT = "Sure! Here is your vocabulary list:\n\n1. **Habitat** – the natural home of an animal\n2. **Predator**: an animal that hunts others\n- Prey - an animal that is hunted\n• Erosion\tthe wearing away of rock\n\nLet me know if you'd like more words!";
  const r = S(CHATGPT);
  ok("chat lines at the top and bottom are left out (noted), not cards", r.intro.length === 2 && !r.heading && r.rows.length === 4, [r.intro, r.heading, pairs(r)]);
  ok("the paste's mark is the dash; a line with its own colon / tab still splits there", r.sep === "dash" && J(pairs(r)) === J([["Habitat", "the natural home of an animal"], ["Predator", "an animal that hunts others"], ["Prey", "an animal that is hunted"], ["Erosion", "the wearing away of rock"]]) && r.rows[1].how === "own" && r.rows[1].own === "colon", pairs(r));
  const r2 = S("## Fish of the Pond\n\nKINDS OF FISH\nGuppy - tiny fish\nPlaty - round fish\nPARTS:\nGills - breathe underwater");
  ok("a markdown # heading is the heading; CAPS / colon lines inside the list are section headings, not cards", r2.heading === "Fish of the Pond" && J(r2.heads) === J(["KINDS OF FISH", "PARTS"]) && r2.rows.length === 3, [r2.heading, r2.heads, pairs(r2)]);
  const r3 = S("Guppy - tiny fish\nguppy  - again\nNeon tetra\nPlaty - round fish");
  ok("a name pasted twice keeps the first; a line with nothing to split is a name with no meaning", r3.dupInPaste === 1 && J(pairs(r3)) === J([["Guppy", "tiny fish"], ["Neon tetra", ""], ["Platy", "round fish"]]), pairs(r3));
  const r4 = S("a. Mouth – eats\nb. Gills – breathes\nc. Fins – swims");
  ok("letter bullets (a. b. c.) come off when most lines have them", J(r4.rows.map(x => x.name)) === J(["Mouth", "Gills", "Fins"]));
  const r5 = S("A. Lincoln – 16th president\nGeorge Washington – 1st president\nJohn Adams – 2nd president");
  ok("…but one “A.” in a name is kept", r5.rows[0].name === "A. Lincoln");
  const r6 = S("well-known - famous\n3:45 is a time\nWWI – 1914–1918");
  ok("a time and a hyphenated word don't split; a spaced dash does (first one)", r6.rows.find(x => x.name === "well-known").back === "famous" && r6.rows.find(x => x.name === "WWI").back === "1914–1918" && r6.rows.find(x => /3:45/.test(x.name)).back === "");
  const r7 = S("Frog → amphibian\nTrout = fish\nSnail -> mollusk");
  ok("arrows and = split too", J(pairs(r7).map(x => x[1])) === J(["amphibian", "fish", "mollusk"]), pairs(r7));
  const r8 = S("The guppy is a small fish that lives in warm water.\nNeon tetras swim together in big groups near plants.");
  ok("prose: the rules find nothing (found=false) — the only case the Builder may ask Claude", !r8.found && r8.rows.length === 2 && r8.lines === 2);
  const r9 = S("Mr. Fish - a name with a period\nTank #1 - a name with a hash");
  ok("Firebase-unsafe names are kept as written (only counted)", r9.unsafe === 2 && r9.rows[0].name === "Mr. Fish");
  ok("blank paste → no rows, nothing found", S("  \n\n").rows.length === 0 && !S("").found);
  const r10 = S("Guppy - tiny\nPlaty - round", { have: ["guppy"] });
  ok("a name already in the deck (any case / spacing) is marked dup", r10.rows[0].dup === true && !r10.rows[1].dup);
  const r11 = S("Guppy - tiny, small\nPlaty - round, calm", { sep: "comma" });
  ok("opts.sep forces the separator (the chips in slice B use it)", r11.sep === "comma" && r11.rows[0].name === "Guppy - tiny" && r11.rows[0].back === "small");
}
console.log("\n── a made-up 12-card list pasted with dashes comes out as typed ──");
{
  const CARDS = [["Bluegill", "A sunfish with a dark spot on its gill flap"], ["Crayfish", "A small freshwater animal with claws, like a tiny lobster"], ["Duckweed", "A tiny floating plant that covers still water"], ["Tadpole", "A young frog that lives in water and breathes with gills"], ["Dragonfly nymph", "The water-living young of a dragonfly"], ["Water strider", "An insect that walks on top of the water"], ["Cattail", "A tall plant with a brown, sausage-shaped top"], ["Snapping turtle", "A big turtle with a strong, hooked jaw"], ["Pond snail", "A snail that eats algae off rocks and plants"], ["Algae", "Simple green living things that make food from sunlight"], ["Heron", "A tall wading bird that spears fish with its beak"], ["Muskrat", "A furry swimmer that builds lodges from cattails"]];
  const r = S(CARDS.map(x => x[0] + " - " + x[1]).join("\n"));
  ok("12 of 12, names and meanings identical to the source list", J(pairs(r)) === J(CARDS) && r.sep === "dash");
  const r2 = S("Pond Life\n" + CARDS.map((x, i) => (i + 1) + ". " + x[0] + " – " + x[1]).join("\n"));
  ok("…and with a heading and numbers: the heading is the deck name, the 12 are identical", r2.heading === "Pond Life" && J(pairs(r2)) === J(CARDS));
}

console.log("\n── ＋ Add cards on a saved unit: the preview, then today's writes ──");
const UNIT = () => ({ u1: { id: "u1", title: "Pond Life", enrolled: { k1: true, k2: true, k3: false }, decks: [{ key: "Pond Life", mode: "flip", introCap: 3, cards: [{ name: "Frog", def: "An amphibian", order: 1 }, { name: "Newt", def: "A small amphibian", order: 4 }] }] } });
{
  const w = world({ units: UNIT(), store: { "unitStudies/u1/decks/0/cards": UNIT().u1.decks[0].cards, "mastery/k1_custom_items": [{ cat: "Other", name: "x" }] } }), c = w.ctx;
  c.unitBatchAdd("u1", "Pond Life");
  const dlg = w.els["unit-batch-dlg"];
  ok("📦 Batch add opens “＋ Add cards” with the ChatGPT tip line; nothing written", dlg && /＋ Add cards/.test(dlg.innerHTML) && /Made it in ChatGPT\? Copying and pasting the list works too\./.test(dlg.innerHTML) && w.writes.length === 0);
  ok("the sheet fits a phone (width capped to the screen) and has no 🔀", /calc\(100vw - 32px\)/.test(dlg.innerHTML) && !/\u{1F500}/u.test(dlg.innerHTML));
  const txt = "Pond animals:\n1. Heron – a tall wading bird\n2. frog – again\n3. Crayfish: a small animal with claws\n4. Duckweed\n5. Mr. Snail – a name with a period";
  w.el("unit-batch-txt").value = txt; w.el("card-sheet-prev"); w.el("card-sheet-go");
  c.cardSheetInput(txt);
  const prev = w.els["card-sheet-prev"].innerHTML;
  ok("the preview: 4 new cards found (frog is already in the deck — shown greyed, not counted), split at dash, the heading noted", /Check — 4 cards found/.test(prev) && (prev.match(/data-cs-row=/g) || []).length === 5 && (prev.match(/data-cf-dup="1"/g) || []).length === 1 && /split at: dash/.test(prev) && /Heading “<b>Pond animals<\/b>”/.test(prev), prev.slice(0, 300));
  ok("…Duckweed (no meaning) is amber and said so; the Add button counts only ready rows", /#f59e0b/.test(prev) && /1 row has no meaning yet/.test(prev) && w.els["card-sheet-go"].textContent === "Add 3 cards");
  const duck = c.cardSheet.rows.find(r => r.name === "Duckweed"); w.el("cs-row-" + duck.id);
  c.cardSheetEdit(duck.id, "back", "  a tiny floating plant ");
  ok("typing a meaning in the amber row makes it ready (green), no redraw", duck.back === "a tiny floating plant" && /#86efac/.test(w.els["cs-row-" + duck.id].style.cssText) && w.els["card-sheet-go"].textContent === "Add 4 cards");
  c.unitBatchSave();
  const want = [
    ["unitStudies/u1/decks/0/cards", "tx", [{ name: "Frog", def: "An amphibian", order: 1 }, { name: "Newt", def: "A small amphibian", order: 4 }, { name: "Heron", def: "a tall wading bird", order: 5 }, { name: "Crayfish", def: "a small animal with claws", order: 6 }, { name: "Duckweed", def: "a tiny floating plant", order: 7 }, { name: "Mr. Snail", def: "a name with a period", order: 8 }]],
    ["mastery/k1_custom_items", "tx", [{ cat: "Other", name: "x" }, { cat: "Pond Life", name: "Heron", def: "a tall wading bird" }, { cat: "Pond Life", name: "Crayfish", def: "a small animal with claws" }, { cat: "Pond Life", name: "Duckweed", def: "a tiny floating plant" }, { cat: "Pond Life", name: "Mr. Snail", def: "a name with a period" }]],
    ["mastery/k1_settings/definitions", "update", { Heron: "a tall wading bird", Crayfish: "a small animal with claws", Duckweed: "a tiny floating plant" }],
    ["mastery/k2_custom_items", "tx", [{ cat: "Pond Life", name: "Heron", def: "a tall wading bird" }, { cat: "Pond Life", name: "Crayfish", def: "a small animal with claws" }, { cat: "Pond Life", name: "Duckweed", def: "a tiny floating plant" }, { cat: "Pond Life", name: "Mr. Snail", def: "a name with a period" }]],
    ["mastery/k2_settings/definitions", "update", { Heron: "a tall wading bird", Crayfish: "a small animal with claws", Duckweed: "a tiny floating plant" }]];
  ok("Add writes EXACTLY today's paths and values: deck cards transaction (orders go on from the highest), each enrolled kid's bank transaction + definitions update (a name with a period rides the bank only); no items, nothing for a kid not enrolled", J(w.writes) === J(want), w.writes);
  ok("no whole-node set anywhere; the sheet closes; she is told", !w.writes.some(x => x[1] === "set") && !w.els["unit-batch-dlg"] && c.cardSheet === null && /4 cards added to Pond Life — flowing to K1, K2/.test(w.alerts[0]), w.alerts);
}
{
  const w = world({ units: UNIT() }), c = w.ctx;
  c.unitBatchAdd("u1", "Pond Life"); w.el("unit-batch-msg"); w.el("unit-batch-txt").value = "Duckweed\nCattail"; c.cardSheetInput("Duckweed\nCattail");
  c.unitBatchSave();
  ok("names only, no meanings typed → nothing written, a plain line says why", w.writes.length === 0 && /needs a meaning/.test(w.els["unit-batch-msg"].textContent));
  w.el("unit-batch-txt").value = "Frog - again"; c.cardSheetInput("Frog - again"); c.unitBatchSave();
  ok("all already in the deck → nothing written", w.writes.length === 0 && /Nothing new to add/.test(w.els["unit-batch-msg"].textContent));
  c.cardSheet.rows = []; c.cardSheet.text = "x"; w.el("unit-batch-txt").value = "Cattail | a tall plant"; c.unitBatchSave();
  ok("the box changed without an input event → re-read before Add (a | line still works)", w.writes.length === 5 && w.writes[0][2].slice(-1)[0].name === "Cattail");
}
{
  const w = world({ units: UNIT(), mom: false }), c = w.ctx;
  c.unitBatchAdd("u1", "Pond Life");
  ok("not Mom → no sheet, nothing written", !w.els["unit-batch-dlg"] && c.cardSheet === null && w.writes.length === 0);
}
{
  const row = src.slice(src.indexOf("_ffBtn(\"name\",\"🖼️ Photo → name\")"), src.indexOf("_ffBtn(\"name\",\"🖼️ Photo → name\")") + 600);
  ok("the deck row's button now reads ＋ Add cards (📦 Batch add is gone)", /unitBatchAdd\(/.test(row) && /\\uFF0B Add cards/.test(row) && !/Batch add<\/button>/.test(src));
  ok("no kid's name in the new code", !/taylor|makenzie|andrew|caleb|lincoln|ellis|lucy|julian|sara\b/i.test(CS));
}

console.log("\n── the Builder's cards box: the same rules first, Claude only for prose with a key ──");
function builder(o) {
  o = o || {}; const asks = [];
  const ctx = { console, JSON, Object, Array, String, Number, Math, Set, Map, RegExp, Date, parseInt, isNaN, isFinite, Promise, setTimeout, Error,
    unitStudies: {}, momHere: () => true, _dryRun: () => true, db: null, HA_LS: { getItem: () => "Mom", setItem: () => {} }, renderAll: () => {},
    lrSafeUrl: u => u, kitCapKey: () => (o.key === false ? "" : "k"), kitCapAsk: async content => { asks.push(content); return '{"items":[{"front":"guppy","back":"a tiny fish"}]}'; },
    document: { getElementById: () => null } };
  vm.createContext(ctx);
  vm.runInContext(CS + "\n" + CF + "\n" + cut("// UNITBUILD_START", "// UNITBUILD_END") + "\nObject.defineProperty(this,'ubForm',{get:()=>ubForm});", ctx);
  ctx.ubOpen(); ctx.ubSet("title", "Pond"); ctx.ubGo("fill");
  const paste = text => { const el = { value: text }; ctx.document.getElementById = id => id === "ub-in-cards-0" ? el : null; return { r: ctx.ubAddLines(0, "cards"), el }; };
  return { ctx, asks, paste, cards: () => ctx.ubForm.days[0].cards.map(x => [x.front, x.back]) };
}
{
  const b = builder();
  const { r, el } = b.paste("Here is your list:\n1. **Heron** – a tall bird\n2. Crayfish: a small animal with claws");
  ok("a ChatGPT list WITH a key stays here (the rules found cards) — no Claude, instant", r === 2 && b.asks.length === 0 && el.value === "" && J(b.cards()) === J([["Heron", "a tall bird"], ["Crayfish", "a small animal with claws"]]), b.cards());
  ok("…the chat line is left out and she is told; every card still waits for the Builder's tick", /Left out: ChatGPT’s chat line/.test(b.ctx.ubForm.msg) && b.ctx.ubUncheckedCount() === 2);
  b.paste("Pond Life\nDuckweed - floats\nCattail - tall");
  ok("a heading over the list is not a card; she is told", b.cards().length === 4 && /the heading “Pond Life”/.test(b.ctx.ubForm.msg));
  b.paste("Duckweed\nCattail\nLily pad");
  ok("names only with a key → names land here with no meaning (no Claude; drafting is a later button)", b.cards().length === 7 && b.asks.length === 0 && b.cards()[6][1] === "");
  const p = b.paste("The guppy is a small fish that lives in warm water.\nNeon tetras swim together in big groups near plants.").r;
  ok("prose with a key → Claude, exactly as before (the paste, then the cards prompt)", p && typeof p.then === "function" && b.asks.length === 1 && /^Pasted text:\nThe guppy/.test(b.asks[0][0].text));
}
{
  const b = builder({ key: false });
  const r = b.paste("The guppy is a small fish that lives in warm water.\nNeon tetras swim together in big groups near plants.").r;
  ok("prose with NO key → each line lands as a card with no meaning (as before), nothing asked", r === 2 && b.asks.length === 0 && b.cards()[0][1] === "");
  ok("one typed `word | meaning` line still works", b.paste("Frog | an amphibian").r === 1 && b.cards()[2][1] === "an amphibian");
  ok("books, videos and activities are untouched (ubParse)", b.ctx.ubAddLines.toString().indexOf('kind==="cards"&&typeof cardSplit') > 0);
}

console.log("\n" + pass + " passed, " + fail + " failed"); process.exit(fail ? 1 : 0);
