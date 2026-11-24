// 📥 ONESPLIT — Mastery HQ 📥 Import and the Database box (Add to Mastery ▸ Batch) split a pasted list with the same rules as
//   ＋ Add cards (cardSplit), through a thin adapter (PLAN_unit_easy_import_2026-11-19.md §2.2, §6, slice H).
//   The bar: everything that imported correctly before imports IDENTICALLY after. The old splitters are kept in the block
//   (mhqImpSplitOld, mastBatchSplitOld), so this test runs old and new side by side:
//   · the old splitter's own shapes (test_study_import.js inputs; TSV / Anki with # lines and HTML; pipe; CSV with quoted cells;
//     3 columns; names; sums; name-only rows mixed in; a first card that looks like a header) → new === old, row for row
//   · the §2.2 shapes the old one got wrong (dash, colon, bullets, numbered list under a heading, name / meaning on indented
//     lines, commas inside meanings, a ChatGPT table) → the rows a person means
//   · a few thousand seeded lines of each → no case where new differs from old on an old shape
//   · the Database box: Flip decks take the shared rules (never a comma); every other mode is exactly as before
//   · the real 📥 Import screen still draws a balanced preview with no duplicate ids; the Database box still hands
//     mastBankAddMany its rows; the block writes nothing and parks no state
//   run: node test_one_split.js
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const cut = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error("markers " + a); return src.slice(i, j); };
const fn = name => { const i = src.indexOf("function " + name + "("); if (i < 0) throw new Error("no " + name); let d = 0, j = i, seen = false; for (; j < src.length; j++) { const c = src[j]; if (c === "{") { d++; seen = true; } else if (c === "}") { d--; if (seen && d === 0) break; } } return src.slice(i, j + 1); };
const CS = cut("// CARDSPLIT_START", "// CARDSPLIT_END"), S7 = cut("// ── S7_START ──", "// ── S7_END ──"), OS = cut("// ONESPLIT_START", "// ONESPLIT_END");
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x).slice(0, 700) : "")); } };
const J = x => JSON.stringify(x), eq = (a, b) => J(a) === J(b);

function world() {
  const calls = [], toasts = [], alerts = [];
  const ctx = { console, JSON, Object, Array, String, Number, Math, Set, Map, RegExp, Date, parseInt, isNaN, Error,
    masteryData: {}, masteryKid: "k", mhqKid: "k", mhqView: "import", mastBankAddNewCat: "", mastBankAddCat: "Deck", mastBankAddMode: "",
    momHere: () => true, mastAdminPinOk: false, __bank: {}, renderAll() {}, _mastRe() {}, alert: m => alerts.push(m), gwShowToast: m => toasts.push(m),
    mastBankAddMany: (kid, cat, entries) => { calls.push({ kid, cat, entries }); return { added: entries.filter(e => e.name), dupes: [], badDefKeys: [] }; },
    mastAdminCatMode() {}, __mode: "flip", __raw: "", mastGetPrintNum: () => 100,
    mhqEsc: s => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"),
    mhqArgEsc: s => String(s == null ? "" : s).replace(/'/g, "\\'"), mhqPlain: s => String(s == null ? "" : s),
    _mhqPill: (label, active, onclick) => '<button onclick="' + onclick + '">' + label + "</button>",
    document: { getElementById: id => id === "mast-curr-add-batch" ? { value: ctx.__raw } : null } };
  ctx.mhqBank = () => ctx.__bank; ctx.mhqDeckStats = () => Object.keys(ctx.__bank).map(d => ({ deck: d }));
  ctx.mastGetCatMode = () => ctx.__mode;
  vm.createContext(ctx);
  vm.runInContext(CS + "\n" + S7 + "\n" + fn("mastBankAddBatch") + "\nthis.__state=()=>({text:mhqImpText,deck:mhqImpDeck});", ctx);
  return { ctx, calls, toasts, alerts,
    imp: t => { const r = ctx.mhqImpSplit(t); return { sep: r.sep, rows: r.rows.map(x => [x.name, x.def]) }; },
    old: t => { const r = ctx.mhqImpSplitOld(t); return { sep: r.sep, rows: r.rows.map(x => [x.name, x.def]) }; },
    plan: (t, f) => { const p = ctx[f || "mhqImpPlan"]("k", "Deck", t); return { total: p.total, dupes: p.dupes, sep: p.sep, fresh: p.fresh.map(x => [x.name, x.def]) }; },
    db: (t, mode) => { ctx.__raw = t; ctx.__mode = mode || "flip"; calls.length = 0; ctx.mastBankAddBatch(); return calls.length ? calls[0].entries.map(x => [x.name, x.def]) : null; },
    dbOld: t => ctx.mastBatchSplitOld(t).map(x => [x.name, x.def]) };
}
const W = world(), c = W.ctx;
let means0;
const same = (label, t) => { const o = W.old(t), n = W.imp(t); ok(label + " — identical to the old splitter", eq(o, n), { old: o, new: n }); };

console.log("── the old splitter's own shapes: identical, row for row ──");
{
  // every input of test_study_import.js
  same("tab", "front\tback\nfront2\tback2"); same("pipe", "front|back\nfront2|back2"); same("comma", "front,back\nfront2,back2");
  same("names", "justaname\nanothername"); same("mixed tab + one comma line", "a\tb\nc\td\ne,f");
  same("quoted CSV cell with a comma and \"\"", '"Hello, ""World""",the greeting\nplain,def2');
  same("Anki HTML + entities", '<b>Katze</b>\tthe &quot;cat&quot;<br>animal');
  same("a name pasted twice + Mr.", "der Hund\tthe dog\ndie Katze\tthe cat\ndie Katze\tagain\nMr.\tsome title");
  same("blank and # lines", "\n# a comment\nfront\tback\n\n   \n#another comment\nfront2\tback2\n");
  same("Anki export header lines", "#separator:tab\n#html:true\n<div>der Hund</div>\t<i>the dog</i>\ndie Katze\tthe cat");
  same("3 columns, tab (tags column)", "der Hund\tthe dog\tnoun\ndie Katze\tthe cat\tnoun");
  same("3 columns, pipe", "der Hund | the dog | noun\ndie Katze | the cat | noun");
  same("CSV whose meanings carry commas", "apple,a red fruit, sweet\nbanana,a yellow fruit, long");
  same("CSV with a name-only row", "Hund,dog\nKatze\nMaus,mouse");
  same("CSV with a dash in the meaning (comma first)", "Hund,the dog - a pet\nKatze,the cat - a pet");
  same("comma list where line 2 has two commas (old split at the first)", "Betta, a colorful fish with flowing fins\nMolly, a peaceful fish, lives in fresh or brackish water");
  same("sums: the dash is a minus", "5 - 3\n12 - 5 = 7\n6×7");
  same("a first card that looks like a header", "front\tback\nHund\tdog");
  same("first line with no mark over pipe lines stays a card", "die Katze\nder Hund | the dog\ndas Haus | the house");
  same("Name | der Name first", "Name | der Name\ndie Katze\nder Hund | the dog\ndas Haus | the house");
  const chatTop = "Here is your list:\nAnimals\nder Hund | the dog\ndie Katze | the cat";
  means0 = W.imp(chatTop);
  ok("pipe lines under a chat line and a heading: the heading stays a card as before; the chat line goes", eq(means0.rows, [["Animals", ""], ["der Hund", "the dog"], ["die Katze", "the cat"]]), means0);
  same("Essen / essen stay two cards", "Essen\nessen\nTrinken");
  same("CRLF + trailing spaces", "der Hund\tthe dog  \r\ndie Katze\tthe cat\r\n");
  same("unquoted names with a quote", "don't\tdo not\nO'Neil\ta name");
  same("empty", ""); same("only blank lines", "\n  \n\t\n");
  const p0 = W.plan("der Hund\tthe dog\ndie Katze\tthe cat\ndie Katze\tagain\nMr.\tsome title");
  ok("the preview counts are as before (4 lines · 1 already there · Mr. cleaned)", p0.total === 4 && p0.dupes === 1 && eq(p0.fresh, [["der Hund", "the dog"], ["die Katze", "the cat"], ["Mr", "some title"]]), p0);
}

console.log("── §2.2: the shapes the old splitter got wrong ──");
const means = (label, t, rows, sep) => { const n = W.imp(t); ok(label, eq(n.rows, rows) && (!sep || n.sep === sep), n); };
{
  means("dash, commas inside the meaning (old split at the comma)", "Guppy - A tiny, colorful tropical fish\nNeon Tetra - A small fish with blue and red stripes",
    [["Guppy", "A tiny, colorful tropical fish"], ["Neon Tetra", "A small fish with blue and red stripes"]], "dash");
  means("colon (old: whole lines, no meaning)", "Guppy: a tiny colorful fish\nPlaty: a peaceful round fish", [["Guppy", "a tiny colorful fish"], ["Platy", "a peaceful round fish"]], "colon");
  means("heading over a numbered en-dash list", "Parts of a Fish\n1. Mouth – takes in food and water\n2. Gills – breathe underwater",
    [["Mouth", "takes in food and water"], ["Gills", "breathe underwater"]], "dash");
  means("bullets come off names", "• Dorsal Fin\n• Caudal Fin\n• Pelvic Fin", [["Dorsal Fin", ""], ["Caudal Fin", ""], ["Pelvic Fin", ""]], "none");
  means("name, then its meaning on an indented line", "Swim Bladder\n    An air-filled organ that helps the fish float\nLateral Line\n    A row of sensors along the side",
    [["Swim Bladder", "An air-filled organ that helps the fish float"], ["Lateral Line", "A row of sensors along the side"]], "next line");
  means("ChatGPT table: header and ---|--- rule are not cards, names not empty", "| German | English |\n| --- | --- |\n| der Hund | the dog |\n| die Katze | the cat |",
    [["der Hund", "the dog"], ["die Katze", "the cat"]], "pipe");
  means("ChatGPT chat lines and **bold** come off", "Here is your list:\n- **Hund** - dog\n- **Katze** - cat\nLet me know if you want more!", [["Hund", "dog"], ["Katze", "cat"]], "dash");
  means("= and → lists", "Hund = dog\nKatze = cat", [["Hund", "dog"], ["Katze", "cat"]], "equals");
  means("a name pasted twice in a dash list still counts as a repeat", "Hund - dog\nKatze - cat\nHund - dog again", [["Hund", "dog"], ["Katze", "cat"], ["Hund", "dog again"]]);
  const p = W.plan("Hund - dog\nKatze - cat\nHund - dog again");
  ok("…so the preview says 1 already there, as the old one did for a repeat", p.total === 3 && p.dupes === 1 && p.fresh.length === 2, p);
  means("Essen / essen in a dash list stay two cards", "Essen - food\nessen - to eat", [["Essen", "food"], ["essen", "to eat"]]);
  means("Anki HTML on a dash line is cleaned per field", "<b>Hund</b> - the &quot;dog&quot;\n<b>Katze</b> - the cat", [["Hund", 'the "dog"'], ["Katze", "the cat"]]);
  const n2 = W.imp("Name and indented line that is short\n  short");
  ok("short indented lines are NOT paired (could be a names list) — old result", eq(n2, W.old("Name and indented line that is short\n  short")), n2);
  const lp = "Swim Bladder\nAn air-filled organ that helps the fish float\nLateral Line\nA row of sensors along the side";
  ok("name / meaning lines with no indent stay as before (ambiguous with a names list)", eq(W.imp(lp), W.old(lp)), W.imp(lp));
}

console.log("── the Database box (Add to Mastery ▸ Batch) ──");
{
  const fl = "Guppy - A tiny, colorful tropical fish\nNeon Tetra - A small fish with blue and red stripes";
  ok("Flip deck: a dash list splits", eq(W.db(fl, "flip"), [["Guppy", "A tiny, colorful tropical fish"], ["Neon Tetra", "A small fish with blue and red stripes"]]), W.db(fl, "flip"));
  ["flash", "quiz", "spell"].forEach(m => ok(m + " deck: one line, one card, exactly as before", eq(W.db(fl, m), W.dbOld(fl)), W.db(fl, m)));
  const caps = "Albany, New York\nAustin, Texas";
  ok("Flip deck: never splits at a comma (\"Albany, New York\" stays one name)", eq(W.db(caps, "flip"), [["Albany, New York", ""], ["Austin, Texas", ""]]), W.db(caps, "flip"));
  const pip = "Apple | a sweet red fruit that grows on trees\nBanana | a long yellow fruit | extra\n  Cherry|small";
  ok("Flip deck: \"Name | definition\" lines exactly as before (3 columns too)", eq(W.db(pip, "flip"), W.dbOld(pip)), W.db(pip, "flip"));
  ok("Flip deck: sums stay whole", eq(W.db("5 - 3\n7 - 2", "flip"), [["5 - 3", ""], ["7 - 2", ""]]));
  ok("Flip deck: a ChatGPT table → rows (old: empty names)", eq(W.db("| Word | Meaning |\n|---|---|\n| Hund | dog |", "flip"), [["Hund", "dog"]]), W.db("| Word | Meaning |\n|---|---|\n| Hund | dog |", "flip"));
  ok("Flip deck: a first line \"Word ⇥ das Wort\" stays a card", eq(W.db("Word\tdas Wort\nHund\tdog", "flip"), [["Word", "das Wort"], ["Hund", "dog"]]), W.db("Word\tdas Wort\nHund\tdog", "flip"));
  c.mastBankAddMode = "flash"; c.__mode = "flip"; c.__raw = fl; W.calls.length = 0; c.mastBankAddBatch(); c.mastBankAddMode = "";
  ok("the mode picked on the box (not the deck's saved one) decides, as the box shows it", W.calls.length === 1 && eq(W.calls[0].entries.map(e => [e.name, e.def]), W.dbOld(fl)), W.calls);
  W.db(fl, "flip");
  ok("still ONE mastBankAddMany call, the picked deck", W.calls.length === 1 && W.calls[0].cat === "Deck" && W.calls[0].kid === "k", W.calls);
  const before = W.alerts.length; c.__raw = "  \n "; W.calls.length = 0; c.mastBankAddBatch();
  ok("an empty box still asks for a line and writes nothing", W.alerts.length === before + 1 && W.calls.length === 0);
  c.momHere = () => false; c.__raw = fl; W.calls.length = 0; c.mastBankAddBatch(); c.momHere = () => true;
  ok("not Mom → nothing", W.calls.length === 0);
}

console.log("── a few thousand seeded lines in each shape ──");
{
  let seed = 4242; const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  const pick = a => a[Math.floor(rnd() * a.length)], chance = p => rnd() < p, int = (a, b) => a + Math.floor(rnd() * (b - a + 1));
  const NAMES = ["der Hund", "die Katze", "das Haus", "Guppy", "Neon Tetra", "Swim Bladder", "Mr. Smith", "and/or", "don't", "Dr. Seuss", "x-ray", "Spider-Man", "Mouth",
    "Gills", "Dorsal Fin", "Essen", "essen", "Albany", "1984", "Mercury", "photosynthesis", "la casa", "el perro", "Molly", "C#", "A [b]", "O'Neil", "St. Louis", "e.g.",
    "U.S.", "Lateral Line", "Washington, D.C.", "Paris, France", "Word", "Name", "English"];
  const DEFS = ["the dog", "the cat", "a tiny, colorful tropical fish", "takes in food and water", "an air-filled organ that helps the fish float", "to eat", "food",
    "a peaceful fish, lives in fresh or brackish water", "ratio 3: 4", "x - y", "see: below", "a = b", "one, two, three", "\"quoted\" word", "it's fine", "first – second",
    "the capital → city", "a long meaning that goes on and on with many words in it", "meaning", "das Wort"];
  const plain = () => { let n; do n = pick(NAMES); while (/[,|\t]|\s[-–—]\s|:\s|\s=\s|→|->/.test(n)); return n; };
  const plainDef = () => { let d; do d = pick(DEFS); while (/[,|]/.test(d)); return d; };
  const sp = () => pick(["", " ", "  "]), blanks = L => { const o = []; L.forEach(l => { if (chance(0.15)) o.push(pick(["", "   "])); o.push(l); }); return o.join(pick(["\n", "\r\n"])); };
  const OLDSHAPES = {
    tsv() { const L = chance(0.3) ? ["#separator:tab", "#html:true"] : []; for (let i = int(1, 8); i > 0; i--) { const h = chance(0.2), a = pick(NAMES), b = pick(DEFS); L.push(sp() + (h ? "<b>" + a + "</b>" : a) + "\t" + (h ? b.replace(/"/g, "&quot;") + "<br>more" : b) + sp() + (chance(0.15) ? "\tnoun" : "")); } return blanks(L); },
    pipe() { const L = []; for (let i = int(1, 8); i > 0; i--) L.push(sp() + pick(NAMES) + sp() + "|" + sp() + pick(DEFS) + (chance(0.15) ? " | extra" : "")); return blanks(L); },
    csv() { const L = []; for (let i = int(1, 8); i > 0; i--) { const a = pick(NAMES), b = pick(DEFS); L.push(((/[,"]/.test(a) || chance(0.2)) ? '"' + a.replace(/"/g, '""') + '"' : a) + "," + (chance(0.3) ? '"' + b.replace(/"/g, '""') + '"' : b)); } return blanks(L); },
    names() { const L = []; for (let i = int(1, 10); i > 0; i--) L.push(sp() + plain()); return blanks(L); },
    mixed() { const ch = pick(["\t", " | ", ","]), L = []; for (let i = int(2, 8); i > 0; i--) L.push(chance(0.3) ? plain() : plain() + ch + plainDef()); return L.join("\n"); },
    sums() { const L = []; for (let i = int(2, 8); i > 0; i--) { const x = int(2, 12), y = int(1, 9); L.push(pick([x + " - " + y, x + "+" + y, x + " + " + y + " = " + (x + y), x + "×" + y])); } return L.join("\n"); },
  };
  const NEWSHAPES = {
    dash() { const N = [...new Set(Array.from({ length: int(2, 8) }, plain))], d = pick([" - ", " – ", " — "]), bul = pick(["", "- ", "• ", "1. "]), rows = [], L = [];
      if (chance(0.25)) L.push("Here is your list:"); if (chance(0.25)) L.push("Parts of a Fish");
      N.forEach((a, i) => { let b; do b = pick(DEFS); while (/\s[-–—]\s|:\s|\s=\s|→|\|/.test(b)); L.push((bul === "1. " ? (i + 1) + ". " : bul) + (chance(0.3) ? "**" + a + "**" : a) + d + b); rows.push([a, b]); });
      return [L.join("\n"), rows]; },
    colon() { const N = [...new Set(Array.from({ length: int(2, 8) }, plain))], rows = [], L = []; N.forEach(a => { let b; do b = pick(DEFS); while (/:\s|\s[-–—]\s|\|/.test(b)); L.push(a + ": " + b); rows.push([a, b]); }); return [L.join("\n"), rows]; },
    table() { const N = [...new Set(Array.from({ length: int(2, 6) }, plain))], rows = [], L = ["| Word | Meaning |", "| --- | --- |"]; N.forEach(a => { const b = plainDef(); L.push("| " + a + " | " + b + " |"); rows.push([a, b]); }); return [L.join("\n"), rows]; },
    pairs() { const N = [...new Set(Array.from({ length: int(2, 5) }, plain))], rows = [], L = []; N.forEach(a => { const b = "A small fish with bright red stripes"; L.push(a, "    " + b); rows.push([a, b]); }); return [L.join("\n"), rows]; },
  };
  let nOld = 0, diffOld = [], nNew = 0, missNew = [], nDb = 0, diffDb = [];
  for (let i = 0; i < 3000; i++) {
    const k = Object.keys(OLDSHAPES)[i % 6], t = OLDSHAPES[k](); nOld++;
    if (!eq(W.imp(t), W.old(t))) diffOld.push([k, t, W.old(t), W.imp(t)]);
    const mode = pick(["flip", "flip", "flash", "quiz", "spell"]); nDb++;
    if (!/^(?:mixed|tsv|csv)$/.test(k) || mode !== "flip") { if (!eq(W.db(t, mode), W.dbOld(t))) diffDb.push([k, mode, t]); }   // a tab or a CSV comma is not the Database box's mark: on a Flip deck those lines came in whole (wrong) before
    const nk = Object.keys(NEWSHAPES)[i % 4], g = NEWSHAPES[nk](); nNew++;
    if (!eq(W.imp(g[0]).rows, g[1])) missNew.push([nk, g[0], W.imp(g[0]).rows]);
    if (!eq(W.db(g[0], "flip"), g[1])) missNew.push(["db " + nk, g[0], W.db(g[0], "flip")]);
  }
  ok(nOld + " pastes in the old shapes: 📥 Import gives exactly the old rows and separator", !diffOld.length, diffOld.slice(0, 2));
  ok(nDb + " pastes in the old shapes: the Database box gives exactly the old rows (every mode)", !diffDb.length, diffDb.slice(0, 2));
  ok(nNew + " pastes in the §2.2 shapes: both places give the rows a person means", !missNew.length, missNew.slice(0, 2));
}

console.log("── the 📥 Import screen and the block itself ──");
{
  const html = t => { c.__bank = { German: ["der Hund"] }; vm.runInContext("mhqImpText=" + J(t) + ";mhqImpDeck='German';mhqImpNewDeck='';", c); return c._mhqRenderImport("k"); };
  const balanced = h => { const o = (h.match(/<div\b/g) || []).length, cl = (h.match(/<\/div>/g) || []).length; return o === cl; };
  const ids = h => { const a = (h.match(/\bid="([^"]+)"/g) || []); return a.length === new Set(a).size; };
  ["Guppy - A tiny, colorful tropical fish\nNeon Tetra - A small fish", "der Hund\tthe dog\ndie Katze\tthe cat", "| German | English |\n| --- | --- |\n| der Hund | the dog |", "<b>x</b> - <i>y</i>", ""].forEach((t, i) => {
    const h = html(t); ok("preview " + (i + 1) + ": balanced <div>s, no duplicate ids", balanced(h) && ids(h), h.slice(0, 300)); });
  const h1 = html("Guppy - A tiny, colorful tropical fish\nNeon Tetra - A small fish with blue and red stripes");
  ok("preview names the new separator and both cards", /separator: dash/.test(h1) && /Guppy → A tiny, colorful tropical fish/.test(h1) && /Import 2 cards/.test(h1), h1.slice(0, 900));
  const h2 = html("der Hund\tthe dog\ndie Katze\tthe cat");
  ok("an old-shape preview reads as before", /2 lines · separator: tab · 1 new · 1 already there/.test(h2), h2.slice(0, 900));
  vm.runInContext("mhqImpText='Hund - dog\\nKatze - cat';mhqImpDeck='German';mhqImpNewDeck='';", c); c.confirm = () => true; W.calls.length = 0; c.mhqImpRun();
  ok("Import hands mastBankAddMany the split rows (same single write path)", W.calls.length === 1 && W.calls[0].cat === "German" && eq(W.calls[0].entries, [{ name: "Hund", def: "dog" }, { name: "Katze", def: "cat" }]), W.calls);
  const code = OS.split("\n").filter(l => !/^\s*\/\//.test(l)).join("\n");
  ok("the block writes nothing itself (no db / ref / set / update / transaction in its code)", !/\bdb\b|\.ref\(|\.set\(|\.update\(|\.transaction\(/.test(code));
  ok("the block parks no state (no let / var at its top level; one const table)", !/^(?:let|var)\s/m.test(OS) && (OS.match(/^const\s/mg) || []).length === 1);
  ok("cardSplit is called, not copied (no second splitter of its own rules)", /cardSplit\(/.test(OS) && !/CS_CHAT_TOP|function csClean|function csCut/.test(OS));
  ok("the old splitter is kept whole as mhqImpSplitOld", /function mhqImpSplitOld\(text\)[\s\S]*tabN > 0 && tabN >= pipeN && tabN >= commaN[\s\S]*mhqImpSplitLine\(l, sepChar\)/.test(OS));
  ok("mhqImpSplit is defined once, inside the block", (src.match(/function mhqImpSplit\(/g) || []).length === 1 && /function mhqImpSplit\(/.test(OS));
  ok("the Database box calls the block's splitter with the mode the box shows", /mastBatchSplit\(raw,mastBankAddMode\|\|mastGetCatMode\(kid,cat\)\)/.test(fn("mastBankAddBatch")));
  ok("no kid's name in the block", !/\b(?:julian|lincoln|ellis|lucy)\b/i.test(OS));
  ok("no 🔀 in the block", OS.indexOf("\u{1F500}") < 0);
}

console.log("\n" + pass + " passed, " + fail + " failed");
if (fail) process.exit(1);
