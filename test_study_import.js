// Node test harness for s7_block.js (📥 Import). No deps. Exits 1 on any failure.
const fs = require("fs"), path = require("path");
const SRC = process.env.S7_SRC || path.join(__dirname, "index.html");

const raw = fs.readFileSync(SRC, "utf8");
const startTag = "// ── S7_START ──";
const endTag = "// ── S7_END ──";
const si = raw.indexOf(startTag);
const ei = raw.indexOf(endTag);
if (si < 0 || ei < 0) { console.error("FAIL: could not find S7_START/S7_END markers in " + SRC); process.exit(1); }
const block = raw.slice(si + startTag.length, ei);

// Build a fresh module instance. `bank` seeds mhqBank(); `addManyResult` is what
// the mastBankAddMany stub returns; `confirmReturns` controls the confirm() stub.
function build(opts) {
  opts = opts || {};
  const bank = opts.bank !== undefined ? opts.bank : { German: ["der Hund"] };
  const addManyResult = opts.addManyResult !== undefined ? opts.addManyResult : { added: [], dupes: [], badDefKeys: [] };
  const confirmReturns = opts.confirmReturns !== undefined ? opts.confirmReturns : true;

  const stubs =
    'var masteryData = {};\n' +
    'var masteryKid = "german_kid";\n' +
    'var mhqKid = "german_kid";\n' +
    'var mhqView = "import";\n' +
    'var __BANK = ' + JSON.stringify(bank) + ';\n' +
    'function mhqBank(kid){ return __BANK; }\n' +
    'function mhqDeckStats(kid,pn){ return Object.keys(__BANK).map(function(d){ return {deck:d}; }); }\n' +
    'function mastGetPrintNum(){ return 100; }\n' +
    'function mhqEsc(s){ return String(s==null?"":s); }\n' +
    'function mhqArgEsc(s){ return String(s==null?"":s); }\n' +
    'function mhqPlain(s,max){ return String(s==null?"":s); }\n' +
    'function _mhqPill(label,active,onclick){ return "<button>"+label+"</button>"; }\n' +
    'var __renderCalls = 0;\n' +
    'function renderAll(){ __renderCalls++; }\n' +
    'var __addManyCalls = [];\n' +
    'var __addManyResult = ' + JSON.stringify(addManyResult) + ';\n' +
    'function mastBankAddMany(kid,cat,entries){ __addManyCalls.push({kid:kid,cat:cat,entries:entries}); return __addManyResult; }\n' +
    'var __confirmCalls = [];\n' +
    'function confirm(msg){ __confirmCalls.push(msg); return ' + JSON.stringify(confirmReturns) + '; }\n';

  const ret =
    '\nreturn {\n' +
    '  mhqImpSplit: mhqImpSplit,\n' +
    '  mhqImpClean: mhqImpClean,\n' +
    '  mhqImpPlan: mhqImpPlan,\n' +
    '  mhqImpSetText: mhqImpSetText,\n' +
    '  mhqImpSetDeck: mhqImpSetDeck,\n' +
    '  mhqImpSetNewDeck: mhqImpSetNewDeck,\n' +
    '  mhqImpRun: mhqImpRun,\n' +
    '  _mhqImportPill: _mhqImportPill,\n' +
    '  _mhqRenderImport: _mhqRenderImport,\n' +
    '  getAddManyCalls: function(){ return __addManyCalls; },\n' +
    '  getConfirmCalls: function(){ return __confirmCalls; },\n' +
    '  getRenderCalls: function(){ return __renderCalls; },\n' +
    '  getMsg: function(){ return mhqImpMsg; },\n' +
    '  getText: function(){ return mhqImpText; },\n' +
    '  getFile: function(){ return mhqImpFile; }\n' +
    '};\n';

  return new Function(stubs + block + ret)();
}

let passed = 0, failed = 0;
function ok(name, cond, detail) {
  if (cond) { passed++; console.log("PASS " + name); }
  else { failed++; console.log("FAIL " + name + (detail ? " — " + detail : "")); }
}
function deepEq(a, b) { return JSON.stringify(a) === JSON.stringify(b); }

// ---------------------------------------------------------------
// (a) separator detection
// ---------------------------------------------------------------
(function () {
  const mod = build();
  let r = mod.mhqImpSplit("front\tback\nfront2\tback2");
  ok("(a) tab detected", r.sep === "tab", r.sep);

  r = mod.mhqImpSplit("front|back\nfront2|back2");
  ok("(a) pipe detected", r.sep === "pipe", r.sep);

  r = mod.mhqImpSplit("front,back\nfront2,back2");
  ok("(a) comma detected", r.sep === "comma", r.sep);

  r = mod.mhqImpSplit("justaname\nanothername");
  ok("(a) none detected", r.sep === "none" && r.rows[0].name === "justaname" && r.rows[0].def === "", r.sep);

  // mixed: tab appears on 2 lines, comma appears on only 1 line -> tab wins
  r = mod.mhqImpSplit("a\tb\nc\td\ne,f");
  ok("(a) mixed file: tab wins over comma", r.sep === "tab", r.sep);
})();

// ---------------------------------------------------------------
// (b) CSV quoted fields incl "" unescaping, comma inside quotes stays in field
// ---------------------------------------------------------------
(function () {
  const mod = build();
  const text = '"Hello, ""World""",the greeting\nplain,def2';
  const r = mod.mhqImpSplit(text);
  ok("(b) sep is comma", r.sep === "comma", r.sep);
  ok("(b) quoted comma stays in field, \"\" unescaped",
    r.rows[0].name === 'Hello, "World"' && r.rows[0].def === "the greeting",
    JSON.stringify(r.rows[0]));
  ok("(b) plain unquoted row still splits", r.rows[1].name === "plain" && r.rows[1].def === "def2", JSON.stringify(r.rows[1]));
})();

// ---------------------------------------------------------------
// (c) HTML stripping + entity unescaping from an Anki-style line
// ---------------------------------------------------------------
(function () {
  const mod = build();
  const text = '<b>Katze</b>\tthe &quot;cat&quot;<br>animal';
  const r = mod.mhqImpSplit(text);
  ok("(c) sep is tab", r.sep === "tab", r.sep);
  ok("(c) tags stripped from name", r.rows[0].name === "Katze", r.rows[0].name);
  ok("(c) tags stripped + entities unescaped in def",
    r.rows[0].def === 'the "cat" animal',
    JSON.stringify(r.rows[0].def));
})();

// ---------------------------------------------------------------
// (d) mhqImpClean rules
// ---------------------------------------------------------------
(function () {
  const mod = build();

  let c = mod.mhqImpClean("Mr.");
  ok("(d) trailing period", c.name === "Mr" && c.changed === true && c.why.indexOf("trailing period") >= 0, JSON.stringify(c));

  c = mod.mhqImpClean("and/or");
  ok("(d) slash", c.name === "and⁄or" && c.changed === true && c.why.indexOf("slash") >= 0, JSON.stringify(c));

  c = mod.mhqImpClean("don't");
  ok("(d) apostrophe", c.name === "don’t" && c.changed === true && c.why.indexOf("quotes") >= 0, JSON.stringify(c));

  c = mod.mhqImpClean("A#B[C]D");
  ok("(d) # [ ] characters", c.name === "A B C D" && c.changed === true && c.why.indexOf("illegal characters") >= 0, JSON.stringify(c));

  c = mod.mhqImpClean("Hello");
  ok("(d) already-clean name unchanged", c.name === "Hello" && c.changed === false, JSON.stringify(c));
})();

// ---------------------------------------------------------------
// (e) mhqImpPlan: fresh vs duplicates (bank + within-paste repeats), cleaned list
// ---------------------------------------------------------------
(function () {
  const mod = build({ bank: { German: ["der Hund"] } });
  const text = [
    "der Hund\tthe dog",      // dup vs bank
    "die Katze\tthe cat",     // fresh
    "die Katze\tagain",       // repeat within paste -> dup
    "Mr.\tsome title"         // cleaned to "Mr", fresh
  ].join("\n");
  const plan = mod.mhqImpPlan("german_kid", "German", text);
  ok("(e) total rows", plan.total === 4, plan.total);
  ok("(e) dupes counted (bank + within-paste)", plan.dupes === 2, plan.dupes);
  ok("(e) fresh rows", plan.fresh.length === 2 &&
    plan.fresh[0].name === "die Katze" && plan.fresh[1].name === "Mr",
    JSON.stringify(plan.fresh));
  ok("(e) cleaned list records the rename", plan.cleaned.length === 1 &&
    plan.cleaned[0].from === "Mr." && plan.cleaned[0].to === "Mr" &&
    plan.cleaned[0].why.indexOf("trailing period") >= 0,
    JSON.stringify(plan.cleaned));
})();

// ---------------------------------------------------------------
// (f) blank lines and # comments ignored
// ---------------------------------------------------------------
(function () {
  const mod = build();
  const text = "\n# a comment\nfront\tback\n\n   \n#another comment\nfront2\tback2\n";
  const r = mod.mhqImpSplit(text);
  ok("(f) blank/comment lines dropped", r.rows.length === 2 &&
    r.rows[0].name === "front" && r.rows[1].name === "front2",
    JSON.stringify(r.rows));
})();

// ---------------------------------------------------------------
// (g) mhqImpRun calls mastBankAddMany with cleaned fresh rows + resolved deck;
//     does NOT call it when nothing is fresh.
// ---------------------------------------------------------------
(function () {
  const mod = build({ bank: { German: ["der Hund"] }, addManyResult: { added: [{ name: "die Katze" }, { name: "Mr" }], dupes: [], badDefKeys: [] } });
  mod.mhqImpSetDeck("German");
  mod.mhqImpSetText("der Hund\tthe dog\ndie Katze\tthe cat\nMr.\tsome title");
  mod.mhqImpRun();
  const calls = mod.getAddManyCalls();
  ok("(g) mastBankAddMany called once", calls.length === 1, calls.length);
  if (calls.length === 1) {
    ok("(g) resolved deck name passed through", calls[0].cat === "German", calls[0].cat);
    ok("(g) entries are the cleaned fresh rows", deepEq(calls[0].entries, [
      { name: "die Katze", def: "the cat" },
      { name: "Mr", def: "some title" }
    ]), JSON.stringify(calls[0].entries));
  }
  ok("(g) state cleared after successful import", mod.getText() === "" && mod.getFile() === "", mod.getText() + "|" + mod.getFile());
})();

(function () {
  // mhqImpNewDeck overrides mhqImpDeck
  const mod = build({ bank: {}, addManyResult: { added: [{ name: "x" }], dupes: [], badDefKeys: [] } });
  mod.mhqImpSetDeck("German");
  mod.mhqImpSetNewDeck("Spanish");
  mod.mhqImpSetText("hola\thello");
  mod.mhqImpRun();
  const calls = mod.getAddManyCalls();
  ok("(g) new-deck name overrides picked deck", calls.length === 1 && calls[0].cat === "Spanish", JSON.stringify(calls));
})();

(function () {
  // nothing fresh -> mastBankAddMany NOT called
  const mod = build({ bank: { German: ["der Hund"] } });
  mod.mhqImpSetDeck("German");
  mod.mhqImpSetText("der Hund\tthe dog"); // only row, already in bank -> 0 fresh
  mod.mhqImpRun();
  ok("(g) no fresh rows -> mastBankAddMany not called", mod.getAddManyCalls().length === 0, mod.getAddManyCalls().length);
  ok("(g) message set for nothing-new case", /already/i.test(mod.getMsg()), mod.getMsg());
})();

(function () {
  // empty deck -> mastBankAddMany NOT called, no crash
  const mod = build({ bank: {} });
  mod.mhqImpSetText("front\tback");
  mod.mhqImpRun();
  ok("(g) no deck chosen -> mastBankAddMany not called", mod.getAddManyCalls().length === 0, mod.getAddManyCalls().length);
  ok("(g) message asks to pick a deck", /deck/i.test(mod.getMsg()), mod.getMsg());
})();

console.log("");
console.log(passed + " passed, " + failed + " failed");
if (failed > 0) process.exit(1);
