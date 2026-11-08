/*
 * Node tests — 👀 PDKIDPAGE: the paper drill's new layout (her design 2026-11-02). The kid's page prints first (the cards
 * the kid looks at, numbered, 12 to a page, no answers; a "Show Me" learning card shows its three tiles without the
 * question), then the tester's sheet: two columns, bigger type, ✓ – ✗ printed beside each answer to circle. Which decks
 * go on the kid's page is a per-deck Mom switch, <kid>_settings/paper_kid/<deck>. Grading is unchanged (– = "~").
 * Runs the REAL PAPERDRILL block with the drill's real Show Me tile pieces (_smTileVis, mastShowMeTiles).
 *   run:  node test_paper_drill_kidpage.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const cut = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error("markers " + a); return src.slice(i, j); };
function slice(name) { const i = src.indexOf("function " + name + "("); if (i < 0) throw new Error("missing " + name);
  let d = 0; for (let k = src.indexOf("{", i); k < src.length; k++) { if (src[k] === "{") d++; else if (src[k] === "}") { d--; if (!d) return src.slice(i, k + 1); } } }
const CODE = 'const MAST_CLOCK_EPOCH="2026-01-01"; let _mastClockMemo={};\n'
  + ["getSchoolDays", "mastKidSchoolDows", "mastSchoolDayNum", "mastShuffleDeck", "_smHash", "_smTileVis", "mastShowMeTiles", "mastColorBorder"].map(slice).join("\n")
  + "\n" + cut("// PRINTPHONE_START", "// PRINTPHONE_END") + "\n" + cut("// PAPERDRILL_START", "// PAPERDRILL_END");

let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x) : "")); } };

const KID = "kid1";
function world(o) {
  o = o || {};
  const writes = [], updates = [];
  const items = o.items || [];
  const modes = Object.assign({ Words: "spell", "Math Facts": "quiz", Letters: "flash", Phonograms: "flash", History: "flip", Shapes: "flash" }, o.modes || {});
  const ctx = { console, JSON, Object, Array, String, Number, Math, Set, Map, RegExp, Date, parseInt, isNaN,
    masteryKid: "other", calendarData: {}, paceData: {},
    masteryData: Object.assign({ [KID]: items, [KID + "_settings"]: Object.assign({ definitions: { "7×8": "56" } }, o.settings || {}) }, o.mastery || {}),
    momHere: () => o.mom !== false, _dryRun: () => !!o.dry,
    db: { ref: p => ({ set: v => writes.push([p, v]), update: v => updates.push([p, v]) }) },
    HA_LS: { setItem() {} }, _mastRe() {}, SL_KLBL: { [KID]: "Kid One" },
    MAST_ANIMAL_EMOJI: { Lion: "🦁" }, MAST_COLOR_MAP: { Red: "#ef4444" },
    mastGetCatMode: (k, c) => modes[c] || "flip",
    mastGetDef: (k, p) => ((ctx.masteryData[k + "_settings"] || {}).definitions || {})[p] || "",
    owRuleBack: (k, it) => it.answer != null ? String(it.answer) : "",
    mastGetVisual: () => null, mastShapeVis: p => "◆",
    mastCatFace: s => "name",
    mastDueItems: () => items.slice() };
  ctx.calToday = () => "2026-10-27";
  vm.createContext(ctx);
  vm.runInContext(CODE, ctx);
  return { ctx, writes, updates };
}
const DAY = { iso: "2026-11-03", pn: 210 };
const kidPart = h => h.split("Tester’s sheet")[0], testPart = h => h.slice(h.indexOf("Tester’s sheet"));

console.log("── which decks go on the kid's page (unset → a sensible default) ──");
{
  const c = world({ items: [
    { id: "l1", prompt: "b", subject: "Letters" }, { id: "p1", prompt: "igh", subject: "Phonograms" }, { id: "p2", prompt: "ch", subject: "Phonograms" },
    { id: "m1", prompt: "7×8", subject: "Math Facts" }, { id: "h1", prompt: "Magna Carta", subject: "History", answer: "1215" },
    { id: "x1", prompt: "Excavator", subject: "Machines", imageUrl: "https://x/ex.jpg" }, { id: "x2", prompt: "Crane", subject: "Machines" },
    { id: "s1", prompt: "a", subject: "Short Flip" }] }).ctx;
  ok("ABCs (Letters) → every card", c.pdKidDeck(KID, "Letters") === "all");
  ok("Counting / Numbers / Colors / Shapes → every card, even with no cards yet", ["Counting", "Numbers", "Colors", "Shapes"].every(d => c.pdKidDeck(KID, d) === "all"));
  ok("a deck with a picture card → its pictures only", c.pdKidDeck(KID, "Machines") === "pics");
  ok("…so the picture card goes on the kid's page, its picture-less neighbour stays with the tester", c.pdKidCard(KID, c.masteryData[KID][5], {}) && !c.pdKidCard(KID, c.masteryData[KID][6], {}));
  ok("a flash deck of 1–3 letter cards (phonograms) → every card", c.pdKidDeck(KID, "Phonograms") === "all");
  ok("math facts (a quiz deck) and history → off", c.pdKidDeck(KID, "Math Facts") === "off" && c.pdKidDeck(KID, "History") === "off");
  ok("short cards in a flip deck → off (the tester reads those)", c.pdKidDeck(KID, "Short Flip") === "off");
  ok("a spelling word is never on it", !c.pdKidCard(KID, { prompt: "a", subject: "Letters" }, { spell: true }));
}

console.log("\n── the deck switch (Mom's tap, this deck only) ──");
{
  const w = world({});
  w.ctx.pdSetKidDeck(KID, "Letters", "off");
  ok("Mom turns Letters off → one targeted update of paper_kid", w.updates.length === 1 && w.updates[0][0] === "mastery/" + KID + "_settings/paper_kid" && JSON.stringify(w.updates[0][1]) === '{"Letters":"off"}' && !w.writes.length, w.updates);
  ok("…and the deck reads off", w.ctx.pdKidDeck(KID, "Letters") === "off");
  w.ctx.pdSetKidDeck(KID, "U.S. History", "all");
  ok("a deck name with a period gets a Firebase-safe key", JSON.stringify(w.updates[1][1]) === '{"U_S_ History":"all"}' && w.ctx.pdKidDeck(KID, "U.S. History") === "all");
  w.ctx.pdSetKidDeck(KID, "Letters", "maybe");
  ok("an unknown choice writes nothing", w.updates.length === 2);
  const n = world({ mom: false });
  n.ctx.pdSetKidDeck(KID, "Letters", "off");
  ok("not Mom → nothing changes", !n.updates.length && n.ctx.pdKidDeck(KID, "Letters") === "all");
  ok("…and no switch shows", n.ctx.pdKidDeckRow(KID, "Letters") === "");
  const d = world({ dry: true });
  d.ctx.pdSetKidDeck(KID, "Letters", "off");
  ok("?dryrun=1 → changes on screen, writes nothing", !d.updates.length && d.ctx.pdKidDeck(KID, "Letters") === "off");
  const row = world({}).ctx.pdKidDeckRow(KID, "Letters");
  ok("the switch row: 🖼 Pictures only · Every card · Off, the current one lit", /👀 On the kid’s page/.test(row) && /🖼 Pictures only/.test(row) && /pdSetKidDeck\('kid1','Letters','off'\)/.test(row)
    && /background:var\(--header\);color:#fff;[^>]*>Every card</.test(row));
  ok("it sits in ⚙ Settings for this deck", /if\(typeof pdKidDeckRow==="function"\) h\+=pdKidDeckRow\(kid,deck\);/.test(src)
    && src.indexOf("h+=pdKidDeckRow(kid,deck)") > src.indexOf("⚙ Settings for this deck") && src.indexOf("h+=pdKidDeckRow(kid,deck)") < src.indexOf("Order of the waiting cards"));
}

console.log("\n── the kid's page ──");
{
  const L = ["A", "B", "C", "D"].map((p, i) => ({ id: "L" + p, prompt: p, subject: "Letters", status: i ? "active" : "introduction", tally_dots: i ? 0 : 2 }));
  const items = L.concat([{ id: "m", prompt: "7×8", subject: "Math Facts" }, { id: "w", prompt: "garden", subject: "Words" }, { id: "x", prompt: "Lion", subject: "Animals" }]);
  const c = world({ items }).ctx;
  const h = c.pdSheetsHtml(KID, DAY, items), kp = kidPart(h), tp = testPart(h);
  ok("it prints first, titled for the kid", /Kid One’s page<\/b>/.test(kp) && h.indexOf("’s page</b>") < h.indexOf("Tester’s sheet"));
  ok("letters and the animal are on it with their drill numbers; the fact and the spelling word are not",
    [1, 2, 3, 4, 7].every(n => kp.includes('<div class="num">' + n + "</div>")) && !kp.includes('<div class="num">5</div>') && !kp.includes('<div class="num">6</div>'));
  ok("a letter prints big", /<div class="w" style="font-size:96px">B<\/div>/.test(kp));
  ok("the Show Me learning card shows its three tiles — and no question", /<div class="card"><div class="num">1<\/div><div class="t3">(<div class="t">[\s\S]*?<\/div>){3}<\/div>/.test(kp) && !/Tap the|Show me/.test(kp));
  ok("…the same three the drill shows that day (mastShowMeTiles on the day's number)", (() => { const t = c.mastShowMeTiles(L[0], items, DAY.pn); return t && t.length === 3 && t[0] && kp.includes(c._smTileVis(t[0])); })());
  ok("nothing on the kid's page gives an answer away", !/garden|>56<|Lion/.test(kp.replace(/<title>[^<]*<\/title>/, "")));
  ok("the tester's line for it: point, say “Show me the A”, go over it", /👀 “Show me the A”<\/div><div class="r"><div class="a">A<\/div><span class="lrn">learning —<br>go over it<\/span>/.test(tp));
  const off = world({ items, settings: { show_me: false } }).ctx.pdSheetsHtml(KID, DAY, items);
  ok("Show Me turned off → the plain letter instead of tiles", !/class="t3"/.test(kidPart(off)) && /<div class="num">1<\/div><div class="w" style="font-size:96px">A<\/div>/.test(kidPart(off)));
  ok("any other kid's-page card is one line: 👀 + the answer, marks beside it", /<div class="n">2\.<\/div><div class="b"><div class="r"><div class="a">👀 B<\/div><span class="mk">/.test(tp));
  const sw = world({ items, settings: { paper_kid: { Letters: "off" } } }).ctx.pdSheetsHtml(KID, DAY, items);
  ok("Letters switched off → only the animal is on the kid's page", /<div class="num">7<\/div>/.test(kidPart(sw)) && !/<div class="num">2<\/div>/.test(kidPart(sw)));
  const many = Array.from({ length: 13 }, (_, i) => ({ id: "n" + i, prompt: String(i), subject: "Numbers" }));
  const mh = world({ items: many }).ctx.pdSheetsHtml(KID, DAY, many);
  ok("13 cards → two kid's pages (12 to a page)", (mh.match(/’s page<\/b>/g) || []).length === 2);
  const none = world({ items: [items[4], items[5]] }).ctx.pdSheetsHtml(KID, DAY, [items[4], items[5]]);
  ok("no kid's-page cards → no kid's page, and the how-to doesn't mention it", !/’s page<\/b>/.test(none) && !/point to that number/.test(none));
}

console.log("\n── the tester's sheet ──");
{
  const items = Array.from({ length: 40 }, (_, i) => ({ id: "h" + i, prompt: "Event " + i, subject: "History", answer: "Year " + (1000 + i) }));
  items.push({ id: "p", prompt: "Fri<b class=mast-hl>.</b> <script>x</script>", subject: "Punctuation", answer: "Period — after an abbreviation." });
  items.push({ id: "s", prompt: "Spain", subject: "Geography" });
  const c = world({ items }).ctx, h = c.pdSheetsHtml(KID, DAY, items), tp = testPart(h);
  ok("✓ – ✗ printed beside every answer to circle (no empty boxes)", (tp.match(/<span class="mk"><span>✓<\/span><span>–<\/span><span>✗<\/span><\/span>/g) || []).length === 42 && !/border:1.5px solid #64748b;border-radius:3px/.test(h));
  ok("the marks sit in the answer's row, right of it", /<div class="r"><div class="a">Year 1000<\/div><span class="mk">/.test(tp));
  ok("the how-to: circle one — ✓ got it · – close / slow · ✗ missed", /Circle one for each: <b>✓<\/b> got it · <b>–<\/b> close \/ slow · <b>✗<\/b> missed/.test(tp));
  ok("bigger type: cards 19px, marks 23px, header 24px", /\.q\{font-size:19px/.test(h) && /\.a\{[^}]*font-size:19px/.test(h) && /\.mk span\{[^}]*font-size:23px/.test(h) && /\.hd b\{font-size:24px/.test(h));
  const pages = h.split('<div class="sheet ts">').slice(1);
  ok("two columns on every page", pages.length >= 2 && pages.every(p => (p.match(/<div class="col">/g) || []).length === 2));
  const nums = p => [...p.matchAll(/<div class="n">(\d+)\.<\/div>/g)].map(m => +m[1]);
  const cols = pages[0].split('<div class="col">').slice(1).map(nums);
  ok("down the left column, then the right (1, 2, 3 … then on)", cols[0][0] === 1 && cols[1][0] === cols[0][cols[0].length - 1] + 1 && cols[0].every((n, i) => n === i + 1), cols);
  ok("every card exactly once, in order, across the pages", pages.map(nums).flat().join() === Array.from({ length: 42 }, (_, i) => i + 1).join());
  ok("pages say page 1 of N", new RegExp("page 1 of " + pages.length).test(tp));
  ok("a card's bold survives; other tags print as text", /Fri<b>\.<\/b> &lt;script&gt;x&lt;\/script&gt;/.test(tp) && !/mast-hl/.test(tp));
  ok("a card whose front is its answer prints once", /<div class="n">42\.<\/div><div class="b"><div class="r"><div class="a">Spain<\/div>/.test(tp));
  ok("the sheet re-measures itself before printing (10.2 in of an 11 in page)", /<script>\(function\(\)\{try\{var S=/.test(h) && /LIM=Math\.round\(10\.2\*96\)-6/.test(h) && /@page\{size:letter portrait;margin:0\.4in\}/.test(h));
}

console.log("\n── grading is unchanged ──");
ok("the grading screen's middle button shows – and still saves \"~\"", /\["~","–","Close \/ slow"/.test(src) && !/\["~","~","Close \/ slow"/.test(src));
ok("a learning card is still graded “Went over it”", /✓ Went over it/.test(cut("// PAPERDRILL_START", "// PAPERDRILL_END")));

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
