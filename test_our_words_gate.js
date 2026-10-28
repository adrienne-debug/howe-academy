// 📝 OURWORDS PR 2 — "Opens at a lesson" (DESIGN_our_words_2026-10-24.md §5.2, §8.5, §14 test 3; her yes 2026-10-27 evening:
//   "brief the runner to build Our words PR 2 (owAtOpen + the gate hook) on fable/running-now with these answers").
//   Runs the REAL OURWORDS block, the REAL RS4K_GATE block (mastBankEligible, mastGateChapter), the real lesson-identity
//   readers (lidsFor, lidStamped, lidDoneSet, lidDoneIdx) and the real mastMintFromBank / mastPullItem slices.
//   · her answer 1's fixture: Singapore 5B, 130 lessons, 54 done (last ✓ 5B Ch.11 L7); a percent card at {subject, lid:"L0066"}
//     (= 5B Ch.15 L1, index 65) waits, and opens the day he starts that lesson; the order-of-operations cards (at:null) open now
//   · whole book done → open; unknown lid → open; unstamped subject → open; {lesson:n} / {ch:n} read mastGateChapter, no gate → open
//   · mastBankEligible drops a waiting Our word, keeps it once the spot is reached; cat_hold still wins; with no records the answers
//     are byte-for-byte the un-hooked function's (and the very same array)
//   · Mom's ▶ Start (mastPullItem) never asks the gate; owMintPatch puts the record's back/fields on the three builders' cards
//   run: node test_our_words_gate.js
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const cut = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error("markers " + a); return src.slice(i, j); };
const fn = name => { const i = src.indexOf("function " + name + "("); if (i < 0) throw new Error("no " + name); let d = 0, j = i, seen = false; for (; j < src.length; j++) { const c = src[j]; if (c === "{") { d++; seen = true; } else if (c === "}") { d--; if (seen && d === 0) break; } } return src.slice(i, j + 1); };
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x) : "")); } };
const J = x => JSON.stringify(x);

// Her answer 1: Lincoln's Singapore list — 130 lessons L0001…L0130, 5B Ch.15 L1 = L0066 (index 65); 54 done.
const SEQ = []; const IDS = [];
for (let n = 1; n <= 130; n++) { IDS.push("L" + String(n).padStart(4, "0")); SEQ.push(n === 66 ? "5B Ch.15 L1" : (n === 54 ? "5B Ch.11 L7" : "5B Ch." + (1 + Math.floor((n - 1) / 8)) + " L" + (1 + (n - 1) % 8))); }
const DONE = k => { const d = {}; for (let n = 1; n <= k; n++) d[IDS[n - 1]] = "2026-10-01"; return d; };
const PCT = ["25% of 80", "40% of 50", "10% of 230", "75% of 12", "5% of 60", "30% of 90", "60% of 15", "50% of 86", "20% of 45"];
const OPS = ["3 + 4 × 2", "(8 − 2) × 5", "12 ÷ 4 + 3²", "20 − 6 ÷ 2", "7 × (3 + 1)"];
function world(o) {
  o = o || {}; const writes = [];
  const recs = {};
  if (o.records !== false) {
    PCT.forEach((n, i) => { recs["owp" + i] = { v: 1, kind: "add", unit: null, deck: "Math Facts", name: n, at: { subject: "singapore_l", lid: "L0066", label: "5B Ch.15 L1" }, src: "migrate", order: i + 1, ts: 1 }; });
    OPS.forEach((n, i) => { recs["owo" + i] = { v: 1, kind: "add", unit: null, deck: "Math Facts", name: n, at: null, back: o.opsBack === undefined ? "11" : o.opsBack, card: o.opsCard || {}, src: "migrate", order: 10 + i, ts: 1 }; });
    if (o.extra) Object.assign(recs, o.extra);
  }
  const bank = [].concat(PCT, OPS).map(n => ({ cat: "Math Facts", name: n })).concat([{ cat: "Math Facts", name: "9 × 7" }]).concat(o.bank || []);
  const ctx = { console, JSON, Object, Array, String, Number, Math, Set, Map, RegExp, Date, parseInt, isNaN, isFinite, WeakMap,
    masteryKid: "lincoln", momHere: () => true, _dryRun: () => !!o.dry,
    db: { ref: p => ({ set: v => writes.push(["set", p]), update: v => writes.push(["update", p]), transaction: f => writes.push(["transaction", p]) }) },
    masteryData: { lincoln: o.items || [], lincoln_custom_items: bank, lincoln_ourwords: recs, lincoln_settings: { cat_gate: o.gate || {}, cat_hold: o.hold || {}, definitions: {} } },
    currData: { subjects: { lincoln: { singapore_l: { display: "Singapore", lessonSeq: SEQ, lessonIds: IDS, doneImportedAt: o.unstamped ? null : "2026-08-01" }, rs: { lessonSeq: ["RS4K · Ch 3 · Cells", "RS4K · Ch 4 · Energy", "RS4K · Ch 5 · Light"], lessonIds: ["r1", "r2", "r3"], doneImportedAt: "2026-08-01" } } },
      done: { lincoln: { singapore_l: DONE(o.done === undefined ? 54 : o.done), rs: o.rsDone || { r1: 1 } } } },
    mastFullBank: kid => { const base = {}; (ctx.masteryData[kid + "_custom_items"] || []).forEach(e => { if (!base[e.cat]) base[e.cat] = []; if (!base[e.cat].includes(e.name)) base[e.cat].push(e.name); }); return base; },
    mastCustomDef: (kid, cat, name) => { const e = (ctx.masteryData[kid + "_custom_items"] || []).find(c => c.cat === cat && c.name === name); return (e && e.def) || ""; },
    mastGetDef: (kid, prompt) => ({ "9 × 7": "63" })[prompt] || "", mastGetVisual: () => null, MAST_ANIMAL_EMOJI: {},
    mastUniqueId: (items, b) => { const ids = new Set(items.map(i => i && i.id)); if (!ids.has(b)) return b; let n = 2; while (ids.has(b + "_" + n)) n++; return b + "_" + n; },
    mastDrillSettings: () => ({ ladder: ["every_other_day"], cat_intro_max: {}, max_intro_per_cat: 3 }), mastIntroMaxFor: () => 3, mastIsParked: i => !!(i && i.status === "parked"),
    mastPutCards: (kid, items, news) => writes.push(["putCards", kid, news.map(n => n.prompt)]), HA_LS: { setItem: () => {} }, _mastRe: () => {}, alert: m => writes.push(["alert", m]),
    wrGateDone: undefined, ldPin: undefined };
  vm.createContext(ctx);
  const code = (o.noBlock ? "" : cut("// OURWORDS_START", "// OURWORDS_END")) + "\n" + cut("// ── RS4K_GATE_START", "// ── RS4K_GATE_END") + "\n" + fn("lidsFor") + "\n" + fn("lidStamped") + "\n" + fn("lidDoneSet") + "\n" + fn("lidDoneIdx") + "\n" + fn("mastMintFromBank") + "\n" + fn("mastPullItem");
  vm.runInContext(code, ctx);
  return { ctx, writes, setDone: k => { ctx.currData.done.lincoln.singapore_l = DONE(k); } };
}
const EL = c => c.mastBankEligible("lincoln", "Math Facts");
const AT66 = { subject: "singapore_l", lid: "L0066" };

console.log("── §5.2 owAtOpen — her answer 1's fixture ──");
{
  const w = world(), c = w.ctx;
  ok("the list is her list: 130 lessons, L0066 is '5B Ch.15 L1' at index 65, 54 done, the first not-done is index 54", c.lidsFor("lincoln", "singapore_l").length === 130 && c.lidsFor("lincoln", "singapore_l")[65] === "L0066" && SEQ[65] === "5B Ch.15 L1" && c.lidDoneIdx("lincoln", "singapore_l").size === 54 && !c.lidDoneIdx("lincoln", "singapore_l").has(54));
  ok("at:null → open (the order-of-operations cards open now)", c.owAtOpen("lincoln", null, "Math Facts") === true && c.owAtOpen("lincoln", undefined) === true);
  ok("at {singapore_l, L0066} with 54 done → held (he is at 5B Ch.11 L7 ✓, Ch.15 is ahead)", c.owAtOpen("lincoln", AT66, "Math Facts") === false);
  w.setDone(64); ok("64 done (the lesson before it is next) → still held", c.owAtOpen("lincoln", AT66, "Math Facts") === false);
  w.setDone(65); ok("65 done → the first not-done lesson IS 5B Ch.15 L1 → open the day he starts it", c.owAtOpen("lincoln", AT66, "Math Facts") === true);
  w.setDone(66); ok("…and it stays open once that lesson is done", c.owAtOpen("lincoln", AT66, "Math Facts") === true);
  w.setDone(130); ok("whole book done → open", c.owAtOpen("lincoln", AT66, "Math Facts") === true);
  w.setDone(54);
  ok("a lid not in the list → fails open", c.owAtOpen("lincoln", { subject: "singapore_l", lid: "L9999" }, "Math Facts") === true);
  ok("a subject that is not his → fails open", c.owAtOpen("lincoln", { subject: "nope", lid: "L0066" }, "Math Facts") === true);
  ok("an unstamped subject → fails open", world({ unstamped: true }).ctx.owAtOpen("lincoln", AT66, "Math Facts") === true);
  ok("a lesson earlier than where he is → open (the 54 done; L0010 is behind him)", c.owAtOpen("lincoln", { subject: "singapore_l", lid: "L0010" }, "Math Facts") === true);
}
console.log("\n── §5.2 owAtOpen — {lesson:n} / {ch:n} read the deck's chapter gate ──");
{
  const c = world({ gate: { "Math Facts": { subject: "rs" } }, rsDone: { r1: 1 } }).ctx;   // on Ch 4
  ok("mastGateChapter says Ch 4 (first not-done)", c.mastGateChapter("lincoln", "rs") === 4);
  ok("{ch:4} open · {ch:5} held · {lesson:3} open · {lesson:6} held", c.owAtOpen("lincoln", { ch: 4 }, "Math Facts") && !c.owAtOpen("lincoln", { ch: 5 }, "Math Facts") && c.owAtOpen("lincoln", { lesson: 3 }, "Math Facts") && !c.owAtOpen("lincoln", { lesson: 6 }, "Math Facts"));
  ok("no gate on the deck → fails open", c.owAtOpen("lincoln", { ch: 9 }, "Other Deck") === true && world().ctx.owAtOpen("lincoln", { ch: 9 }, "Math Facts") === true);
  ok("a gate on a subject with no chapter titles → fails open", (() => { const c2 = world({ gate: { "Math Facts": { subject: "singapore_l" } } }).ctx; return c2.mastGateChapter("lincoln", "singapore_l") === null && c2.owAtOpen("lincoln", { ch: 2 }, "Math Facts") === true; })());
  ok("junk → open ({ch:'x'}, {}, 'str')", c.owAtOpen("lincoln", { ch: "x" }, "Math Facts") && c.owAtOpen("lincoln", {}, "Math Facts") && c.owAtOpen("lincoln", "soon", "Math Facts"));
}
console.log("\n── the one hook: mastBankEligible drops a waiting Our word, keeps it once the spot is reached ──");
{
  const w = world(), c = w.ctx;
  ok("54 done: the 9 percent cards are held; the 5 ops cards and the plain bank word are offered", J(EL(c)) === J(OPS.concat(["9 × 7"])), EL(c));
  w.setDone(65); ok("65 done: the percent cards open — in the bank's order", J(EL(c)) === J(PCT.concat(OPS, ["9 × 7"])));
  w.setDone(54);
  ok("cat_hold still wins over everything", world({ hold: { "Math Facts": true }, done: 130 }).ctx.mastBankEligible("lincoln", "Math Facts").length === 0);
  ok("a gated deck (RS4K-style) still gates by ch AND holds the Our word", (() => { const c2 = world({ gate: { "Math Facts": { subject: "rs" } }, bank: [{ cat: "Math Facts", name: "late", ch: 9 }, { cat: "Math Facts", name: "early", ch: 2 }] }).ctx; const e = c2.mastBankEligible("lincoln", "Math Facts"); return e.indexOf("late") < 0 && e.indexOf("early") >= 0 && e.indexOf(PCT[0]) < 0 && e.indexOf(OPS[0]) >= 0; })());
  ok("an 'off' record does not hold its word; a wording/link record never holds", (() => { const c2 = world({ extra: { x1: { kind: "add", deck: "Math Facts", name: "9 × 7", at: AT66, off: true }, x2: { kind: "wording", deck: "Math Facts", name: OPS[0], back: "eleven", at: AT66 }, x3: { kind: "link", deck: "Math Facts", name: OPS[1], cardId: "zz", at: AT66 } } }).ctx; const e = c2.mastBankEligible("lincoln", "Math Facts"); return e.indexOf("9 × 7") >= 0 && e.indexOf(OPS[0]) >= 0 && e.indexOf(OPS[1]) >= 0; })());
  ok("a record in another deck never touches this deck's list", (() => { const c2 = world({ extra: { x1: { kind: "add", deck: "Spelling", name: "9 × 7", at: AT66 } } }).ctx; return c2.mastBankEligible("lincoln", "Math Facts").indexOf("9 × 7") >= 0; })());
}
console.log("\n── with no records: byte-for-byte the un-hooked answers ──");
{
  const cases = [{}, { gate: { "Math Facts": { subject: "rs" } }, bank: [{ cat: "Math Facts", name: "late", ch: 9 }, { cat: "Math Facts", name: "early", ch: 2 }] }, { hold: { "Math Facts": true } }, { gate: { "Math Facts": { subject: "singapore_l" } } }];
  let same = true;
  cases.forEach(o => { const a = world(Object.assign({ records: false }, o)).ctx.mastBankEligible("lincoln", "Math Facts"); const b = world(Object.assign({ records: false, noBlock: true }, o)).ctx.mastBankEligible("lincoln", "Math Facts"); if (J(a) !== J(b)) same = false; });
  ok("four gate shapes × no records: the hooked and the un-hooked (no OURWORDS block) function answer the same", same);
  const c = world({ records: false }).ctx;
  ok("no records → owGateNames hands back the very same array (no copy)", (() => { const arr = ["a", "b"]; return c.owGateNames("lincoln", "Math Facts", arr) === arr; })());
  ok("records that all open → the same array too; an empty list stays itself", (() => { const c2 = world({ done: 130 }).ctx; const arr = PCT.slice(); const e = []; return c2.owGateNames("lincoln", "Math Facts", arr) === arr && c2.owGateNames("lincoln", "Math Facts", e) === e; })());
  ok("the hook is one guarded line in mastBankEligible, before every return path", (() => { const f = fn("mastBankEligible"); const i = f.indexOf('if(typeof owGateNames==="function") all=owGateNames(kid,cat,all);'); return i > 0 && i < f.indexOf("return") && (f.match(/owGateNames/g) || []).length === 2; })());
  ok("the six automatic-start callers still read mastBankEligible (none bypasses it)", ["mastApplyScores", "mastGateStart", "mastSeedCat", "nbWaiting", "mstPile"].every(n => fn(n).indexOf("mastBankEligible(") > 0));
}
console.log("\n── Mom's ▶ Start is not gated; the mint hook ──");
{
  const w = world(), c = w.ctx;
  ok("mastPullItem never asks the gate (source) and starts a held percent card on Mom's tap", fn("mastPullItem").indexOf("mastBankEligible") < 0 && fn("mastPullItem").indexOf("owAtOpen") < 0 && (() => { c.mastPullItem("Math Facts", PCT[0]); return c.masteryData.lincoln.length === 1 && c.masteryData.lincoln[0].prompt === PCT[0] && w.writes.some(x => x[0] === "putCards"); })());
  ok("…and that card got no back (the percent records carry none) and stays flash", c.masteryData.lincoln[0].answer === undefined && c.masteryData.lincoln[0].review_mode === "flash");
  const it = c.mastMintFromBank("Math Facts", OPS[0], c.masteryData.lincoln);
  ok("mastMintFromBank: the record's back lands on the card as a flash card", it.answer === "11" && it.review_mode === "flash" && it.prompt === OPS[0]);
  const c2 = world({ bank: [{ cat: "Math Facts", name: OPS[1], def: "a bank def" }], opsBack: "30" }).ctx;
  const it2 = c2.mastMintFromBank("Math Facts", OPS[1], []);
  ok("a bank def had made it recite — the record's back and its review_mode (flash) win", it2.answer === "30" && it2.review_mode === "flash");
  const c3 = world({ opsBack: "30", opsCard: { review_mode: "recite", knowledge_type: "procedure", example: "8 − 2 = 6, × 5 = 30" } }).ctx;
  const it3 = c3.mastMintFromBank("Math Facts", OPS[1], []);
  ok("card fields copy (review_mode recite, knowledge_type, example) when the record says so", it3.review_mode === "recite" && it3.knowledge_type === "procedure" && it3.example === "8 − 2 = 6, × 5 = 30" && it3.answer === "30");
  const c4 = world({ records: false }).ctx, c5 = world({ records: false, noBlock: true }).ctx;
  ok("no record → the minted card is byte-identical to the un-hooked mint (bank def → recite, kid def → flash back)", (() => { const b1 = [{ cat: "Math Facts", name: "rule", def: "the rule" }]; c4.masteryData.lincoln_custom_items.push(...b1); c5.masteryData.lincoln_custom_items.push(...b1); return J(c4.mastMintFromBank("Math Facts", "rule", [])) === J(c5.mastMintFromBank("Math Facts", "rule", [])) && J(c4.mastMintFromBank("Math Facts", "9 × 7", [])) === J(c5.mastMintFromBank("Math Facts", "9 × 7", [])) && c4.mastMintFromBank("Math Facts", "rule", []).review_mode === "recite"; })());
  ok("owMintPatch itself: no record → the same item untouched; it never writes", (() => { const x = { subject: "Math Facts", prompt: "9 × 7", answer: "63" }; const before = J(x); const r = c.owMintPatch("lincoln", x); return r === x && J(x) === before && !w.writes.some(y => y[0] === "set" || y[0] === "update"); })());
  ok("the three builders each call owMintPatch once, guarded (mastApplyScores' inline mint, mastMintFromBank, mastPullItem)", ["mastApplyScores", "mastMintFromBank", "mastPullItem"].every(n => (fn(n).match(/if\(typeof owMintPatch==="function"\) owMintPatch\(/g) || []).length === 1) && (src.match(/owMintPatch\(/g) || []).length === 4);
}
console.log("\n── housekeeping ──");
{
  const block = cut("// OURWORDS_START", "// OURWORDS_END");
  ok("owAtOpen / owGateNames / owMintPatch live inside the OURWORDS block (markers once)", block.indexOf("function owAtOpen(") > 0 && block.indexOf("function owGateNames(") > 0 && block.indexOf("function owMintPatch(") > 0 && src.split("// OURWORDS_START").length === 2 && src.split("// OURWORDS_END").length === 2);
  ok("PR 2 writes nothing: no db.ref in the new functions", !/db\.ref/.test(block.slice(block.indexOf("// ── PR 2"))));
  ok("no kid's name in the block; no 🔀 anywhere", !/lincoln|ellis|lucy|julian/i.test(block.replace(/\/\/[^\n]*/g, "")) && src.indexOf("🔀") < 0);
}
console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
