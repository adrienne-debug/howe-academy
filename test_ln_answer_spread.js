// LN_ANSWER_SPREAD — the right-answer letters in the 6th-grade notebook's built-in questions are spread out (Mom 2026-11-24:
// "Yes, spread them"). B had been right for 10 of 24 analogies and 17 of 28 number questions. Run: node test_ln_answer_spread.js
//   • one block, right after LN_PLAINQ_END; the data line itself is untouched; cutting the block out rebuilds the old notebook
//   • per-table letter counts before → after, and the exact list of items whose letter moved
//   • every item keeps the same SET of choices, the same right answer TEXT, every other field the same; only letters move
//   • number choices that went smallest to largest still do (now all 27 numeric ones; im18's "equal / cannot compare" stay last)
//   • print order: analogies never the same right letter two days running, no letter more than twice in a week
//   • the blind number solver and a second blind read (a fresh model solving every item without the key) agree with the new key
//   • the printed student pages show the new order, the parent guide's key shows the new letter beside the same answer text
//   • every other notebook prints byte for byte the same; the 6th-grade notebook keeps its page count and order;
//     a notebook whose questions all come from Mom's own banks prints byte for byte the same (her banks are never reordered)
const fs = require("fs"), path = require("path");
const src = fs.readFileSync(path.join(__dirname, "notebooks.js"), "utf8");
const solver = require("./tools/ln_number_solver.js");
let pass = 0, fail = 0;
function ok(c, name, d) { if (c) { pass++; console.log("  ✓ " + name); } else { fail++; console.log("  ✗ " + name + (d ? "  → " + d : "")); } }
const load = (code) => { const w = {}; new Function("window", code)(w); return w.HoweNotebooks; };

// ── the block; the old source = this tree with the block cut out ────────────────────────────────────────────────────
const S0 = "  // LN_ANSWER_SPREAD_START", E0 = "  // LN_ANSWER_SPREAD_END\n";
const a = src.indexOf(S0), b = src.indexOf(E0) + E0.length;
const PRE = "  var LINCOLN_DATA = ", li = src.indexOf("\n" + PRE) + 1, le = src.indexOf("\n", li);
const BASE = src.slice(0, a) + src.slice(b);
console.log("the block");
ok(a > 0 && b > a && src.indexOf(S0, a + 5) < 0 && src.slice(src.indexOf("  // LN_PLAINQ_END"), a) === "  // LN_PLAINQ_END\n" && src.slice(b, b + 24) === "  var LINCOLN_CONFIG = {",
  "one LN_ANSWER_SPREAD block, right after LN_PLAINQ_END and before LINCOLN_CONFIG");
ok(le < a && src.slice(li, le) === BASE.slice(li, le), "the LINCOLN_DATA line itself is not edited (the block moves choices at load)");
ok(!/Math\.random|Date\b|new Date/.test(src.slice(a, b)), "the block is a fixed table — no random, no date");
const dataOf = (code) => new Function(code.slice(code.indexOf(PRE), code.indexOf("  var LINCOLN_CONFIG = {")) + "\nreturn LINCOLN_DATA;")();
const OLDD = dataOf(BASE), NEWD = dataOf(src), RAW = JSON.parse(src.slice(li + PRE.length, src.slice(li, le).lastIndexOf("}; //") + 1 + li));
ok(JSON.stringify(OLDD) === JSON.stringify(RAW), "with the block cut out the data is exactly the data line");
const NB = load(src), OLD = load(BASE);

// ── tables with lettered choices ────────────────────────────────────────────────────────────────────────────────────
// cogat_verbal (24 analogies), iowa_math (28 number questions), fallback_passages (3 passages × 2 questions).
// conventions (fix the sentence) and words (word of the day) have no lettered choices.
const qs = (d) => {
  const out = [];
  ["cogat_verbal", "iowa_math"].forEach(t => d.banks[t].forEach(q => out.push({ table: t, id: q.id, choices: q.choices, ans: q.ans, item: q })));
  d.banks.fallback_passages.forEach((p, i) => ["q1", "q2"].forEach(f => out.push({ table: "fallback_passages", id: "passage" + (i + 1) + "." + f, choices: p[f], ans: p[f + "_ans"], item: p })));
  return out;
};
const QO = qs(OLDD), QN = qs(NEWD);
console.log("which tables have choices");
ok(Object.keys(NEWD.banks).filter(t => NEWD.banks[t].some(x => x.choices || x.q1)).join(",") === "cogat_verbal,iowa_math,fallback_passages" &&
  !NEWD.banks.conventions.some(x => x.choices) && !NEWD.banks.words.some(x => x.choices), "lettered choices: analogies, number questions, passage questions — not conventions or words");
ok(QO.length === 58 && QN.length === 58 && QN.every(q => q.choices.length === 4), "58 questions with choices, four choices each");

// ── counts before → after ───────────────────────────────────────────────────────────────────────────────────────────
const cnt = (list, t) => { const c = { A: 0, B: 0, C: 0, D: 0 }; list.filter(q => q.table === t).forEach(q => c[q.ans]++); return "A" + c.A + " B" + c.B + " C" + c.C + " D" + c.D; };
console.log("letter counts before → after");
ok(cnt(QO, "cogat_verbal") === "A2 B10 C8 D4" && cnt(QN, "cogat_verbal") === "A6 B6 C6 D6", "analogies: " + cnt(QO, "cogat_verbal") + " → " + cnt(QN, "cogat_verbal"));
ok(cnt(QO, "iowa_math") === "A1 B17 C10 D0" && cnt(QN, "iowa_math") === "A2 B15 C11 D0", "number questions: " + cnt(QO, "iowa_math") + " → " + cnt(QN, "iowa_math") + " (26 smallest-to-largest items stay put)");
ok(cnt(QO, "fallback_passages") === "A1 B3 C2 D0" && cnt(QN, "fallback_passages") === "A1 B2 C2 D1", "passage questions: " + cnt(QO, "fallback_passages") + " → " + cnt(QN, "fallback_passages"));
const MOVED = "cv02 B→A, cv05 B→A, cv08 C→A, cv14 C→A, cv16 B→D, cv18 B→D, im18 B→A, im20 B→C, passage1.q2 B→D";
const moved = QN.map((q, i) => q.ans !== QO[i].ans ? q.id + " " + QO[i].ans + "→" + q.ans : null).filter(Boolean).join(", ");
ok(moved === MOVED, "the items whose letter moved (9): " + moved, moved);
const reordered = QN.filter((q, i) => JSON.stringify(q.choices) !== JSON.stringify(QO[i].choices)).map(q => q.id).join(", ");
ok(reordered === MOVED.split(", ").map(x => x.split(" ")[0]).join(", "), "no other item's choices were touched");

// ── nothing but positions changed ───────────────────────────────────────────────────────────────────────────────────
console.log("same choices, same right answers");
const set = (ch) => ch.map(c => c.t).sort().join(" | ");
ok(QN.every((q, i) => q.id === QO[i].id && set(q.choices) === set(QO[i].choices)), "every item has the same set of choices as before");
ok(QN.every(q => q.choices.map(c => c.l).join("") === "ABCD"), "choices are still lettered A B C D in order");
const keyed = (q) => (q.choices.find(c => c.l === q.ans) || {}).t;
ok(QN.every((q, i) => keyed(q) !== undefined && keyed(q) === keyed(QO[i])), "the key letter always points at the same answer text as before");
const strip = (d) => JSON.stringify(d, (k, v) => (k === "choices" || k === "ans" || k === "q1" || k === "q2" || k === "q1_ans" || k === "q2_ans") ? undefined : v);
ok(strip(NEWD) === strip(OLDD), "every other field of every table (text, tags, passages, words, conventions, scores) is the same");
// number choices: the table lists numbers smallest to largest — keep that
const val = (s) => { s = String(s).replace(/,/g, ""); let m = /(\d+) hr (\d+) min/.exec(s); if (m) return m[1] * 60 + +m[2];
  m = /^\s*(\d+) and (\d+)\/(\d+)/.exec(s); if (m) return +m[1] + m[2] / m[3]; m = /^\s*(?:About )?\$?(\d+)\/(\d+)/.exec(s); if (m) return m[1] / m[2];
  m = /(-?\d+(?:\.\d+)?)/.exec(s); return m ? +m[1] : NaN; };
const sorted = (q) => { const v = q.choices.map(c => val(c.t)); return v.every((x, i) => !isNaN(x) && (i === 0 || x > v[i - 1])); };
const numeric = NEWD.banks.iowa_math.filter(q => q.id !== "im18");
ok(OLDD.banks.iowa_math.filter(sorted).length === 26 && numeric.every(sorted), "number choices go smallest to largest — 26 before, all 27 numeric ones now (im20 was the odd one out)",
  numeric.filter(q => !sorted(q)).map(q => q.id).join(","));
const i18 = NEWD.banks.iowa_math.find(q => q.id === "im18");
ok(i18.choices[0].t.indexOf("3/4") === 0 && i18.choices[1].t.indexOf("5/8") === 0 && i18.choices[2].t === "They are equal" && i18.choices[3].t === "Cannot compare",
  "im18 lists 3/4 then 5/8 (the question's order); \"They are equal\" and \"Cannot compare\" stay last");

// ── print order ─────────────────────────────────────────────────────────────────────────────────────────────────────
// lnPick deals table item ((week − 1) × 5 + day) mod n, so the printed order is the table order, wrapping.
console.log("print order");
const seq = (t) => NEWD.banks[t].map(q => q.ans).join("");
const runs = (s, k) => { let r = 0; for (let i = 0; i < s.length; i++) { let same = true; for (let j = 1; j < k; j++) if (s[(i + j) % s.length] !== s[i]) same = false; if (same) r++; } return r; };
const weekMax = (s) => { let m = 0; for (let i = 0; i < s.length; i++) { const c = {}; for (let k = 0; k < 5; k++) { const x = s[(i + k) % s.length]; c[x] = (c[x] || 0) + 1; m = Math.max(m, c[x]); } } return m; };
ok(seq("cogat_verbal") === "BACBABCADCDCBACDBDBADACD", "analogies in print order: " + seq("cogat_verbal"));
ok(runs(seq("cogat_verbal"), 2) === 0 && weekMax(seq("cogat_verbal")) === 2, "analogies: never the same right letter two days running; no letter more than twice in any week (was " +
  runs(OLDD.banks.cogat_verbal.map(q => q.ans).join(""), 2) + " repeats, up to " + weekMax(OLDD.banks.cogat_verbal.map(q => q.ans).join("")) + " in a week)");
const oSeq = OLDD.banks.iowa_math.map(q => q.ans).join("");
ok(seq("iowa_math") === "BBCBBBCBBBBCCBACCABCCBCBBCCB" && runs(seq("iowa_math"), 3) === 4 && runs(oSeq, 3) === 5,
  "number questions in print order: " + seq("iowa_math") + " — three-days-running B down from " + runs(oSeq, 3) + " to " + runs(seq("iowa_math"), 3) + " (the rest are fixed by smallest-to-largest)");
const pSeq = QN.filter(q => q.table === "fallback_passages").map(q => q.ans).join("");
ok(pSeq === "BDACBC" && runs(pSeq, 2) === 0, "passage questions in print order (one passage a week): " + pSeq + " — no letter twice in a row");

// ── two blind checks ────────────────────────────────────────────────────────────────────────────────────────────────
console.log("blind checks");
const solved = NEWD.banks.iowa_math.map(q => [q.id, solver.solve({ text: q.text, choices: q.choices }), q.ans]);
ok(solved.every(s => s[1] === s[2]), "the blind number solver (question + choices only) agrees with the new key on all 28 number questions", solved.filter(s => s[1] !== s[2]).map(s => s[0] + " " + s[1] + "≠" + s[2]).join(", "));
// a fresh model, 2026-11-24, given only the 58 questions in their new order (passage text included) and no key:
const BLIND = {"cv01":"B","cv02":"A","cv03":"C","cv04":"B","cv05":"A","cv06":"B","cv07":"C","cv08":"A","cv09":"D","cv10":"C","cv11":"D","cv12":"C","cv13":"B","cv14":"A","cv15":"C","cv16":"D","cv17":"B","cv18":"D","cv19":"B","cv20":"A","cv21":"D","cv22":"A","cv23":"C","cv24":"D",
  "im01":"B","im02":"B","im03":"C","im04":"B","im05":"B","im06":"B","im07":"C","im08":"B","im09":"B","im10":"B","im11":"B","im12":"C","im13":"C","im14":"B","im15":"A","im16":"C","im17":"C","im18":"A","im19":"B","im20":"C","im21":"C","im22":"B","im23":"C","im24":"B","im25":"B","im26":"C","im27":"C","im28":"B",
  "passage1.q1":"B","passage1.q2":"D","passage2.q1":"A","passage2.q2":"C","passage3.q1":"B","passage3.q2":"C"};
const blindBad = QN.filter(q => BLIND[q.id] !== q.ans);
ok(Object.keys(BLIND).length === 58 && !blindBad.length, "a second blind read (a fresh model, no key) matches the new key on all 58", blindBad.map(q => q.id).join(","));

// ── the printed notebooks ───────────────────────────────────────────────────────────────────────────────────────────
console.log("the notebooks");
const dates = { monday: "November 9, 2026", tuesday: "November 10, 2026", wednesday: "November 11, 2026", thursday: "November 12, 2026", friday: "November 13, 2026" };
const ctx = (w, extra) => Object.assign({ weekNum: "week" + w, weekDates: "Nov 9–13, 2026", weekData: { dates, tasks: [] }, masteryItems: [], extraPages: {} }, extra || {});
const pick = (bank, w, d) => bank[((w - 1) * 5 + d) % bank.length];
let keyBad = [], stuBad = [], allKeys = "";
for (let w = 1; w <= 24; w++) {
  const o = NB.generate("lincoln", ctx(w));
  const rows = [...o.parent.matchAll(/<div class="key-label">(Q[12])<\/div><div><span class="key-ans">\(([A-E])\)<\/span> <span class="key-sub">([\s\S]*?) — /g)];
  for (let d = 0; d < 5; d++) {
    const q1 = pick(NEWD.banks.cogat_verbal, w, d), q2 = pick(NEWD.banks.iowa_math, w, d), r1 = rows[d * 2], r2 = rows[d * 2 + 1];
    if (!r1 || r1[2] !== q1.ans || r1[3] !== keyed(q1) || !r2 || r2[2] !== q2.ans || r2[3] !== keyed(q2)) keyBad.push("wk" + w + " day" + (d + 1));
    [q1, q2].forEach(q => { const h = q.choices.map(c => '<div class="choice"><div class="c-letter">' + c.l + '</div> ' + c.t + '</div>\n').join(""); if (o.student.indexOf(h) < 0) stuBad.push("wk" + w + " " + q.id); });
    allKeys += r1 ? r1[2] : "?";
  }
  const p = NEWD.banks.fallback_passages[(w - 1) % 3];
  ["q1", "q2"].forEach(f => { if (o.parent.indexOf('<div class="ans-circle">' + p[f + "_ans"] + '</div> <span class="choice-correct">' + keyed({ choices: p[f], ans: p[f + "_ans"] }) + '</span>') < 0) keyBad.push("wk" + w + " passage " + f); });
}
ok(!keyBad.length, "the parent guide's key, weeks 1–24 (every analogy, number question and passage question): the new letter beside the same answer text", keyBad.slice(0, 5).join(", "));
ok(!stuBad.length, "the student pages print each question's choices in the new order", stuBad.slice(0, 5).join(", "));
ok(runs(allKeys, 2) === 0, "120 printed days of analogies in a row (weeks 1–24): never the same right letter two days running");
const WEEKS = [1, 2, 3, 4, 5, 6], others = [];
["dino", "construction", "shark", "space", "farm", "forest"].forEach(look => others.push(["julian", { notebookTheme: look }, "Pre-K " + look]));
others.push(["kid9", { isPreK: true }, "Pre-K starter"], ["lucy", {}, "1st grade"], ["ellis", {}, "4th grade"], ["kid9", {}, "starter"], ["kid9", { notebookTheme: "space", kidName: "Finn" }, "another kid on a Pre-K look"]);
let otherBad = [];
others.forEach(([kid, ex, name]) => WEEKS.forEach(w => { if (JSON.stringify(NB.generate(kid, ctx(w, ex))) !== JSON.stringify(OLD.generate(kid, ctx(w, ex)))) otherBad.push(name + " wk" + w); }));
ok(!otherBad.length, "every other notebook prints byte for byte the same (" + others.length + " notebooks × 6 weeks, student + parent)", otherBad.slice(0, 5).join(", "));
const labels = (h) => (h.match(/class="page-label">[^<]*/g) || []).join(" | "), pages = (h) => (h.match(/<div class="page[" ]/g) || []).length;
let lnBad = [], lnDiff = 0;
const extraOn = { allAboutMe: true, moneyLife: true, wilderness: true, memoryCivics: true, brainBreaks: true };
WEEKS.forEach(w => [{}, { extraPages: extraOn }].forEach(ex => { const x = NB.generate("lincoln", ctx(w, ex)), y = OLD.generate("lincoln", ctx(w, ex));
  if (x.student !== y.student) lnDiff++;
  ["student", "parent"].forEach(p => { if (labels(x[p]) !== labels(y[p]) || pages(x[p]) !== pages(y[p])) lnBad.push("wk" + w + " " + p); }); }));
ok(!lnBad.length && lnDiff > 0, "the 6th-grade notebook: same page count and page order, weeks 1–6, plain and with every extra page (and it does print differently)", lnBad.join(", "));
// Mom's own banks (made-up data here) replace the built-ins and are never reordered
const momBanks = { cogatBank: { items: [{ text: "SUN is to DAY as MOON is to ___", c: ["night", "noon", "sky", "star"], ans: "A" }, { text: "COLD is to ICE as HOT is to ___", c: ["snow", "fire", "rain", "wind"], ans: "B" }] },
  quantBank: { items: [{ text: "2 + 2 = ?", c: ["3", "4", "5", "6"], ans: "B" }] },
  passage: { html: "A short made-up story.", q1_stem: "Q one?", q1: [{ l: "A", t: "x" }, { l: "B", t: "y" }], q1_ans: "B", q2_stem: "Q two?", q2: [{ l: "A", t: "x" }, { l: "B", t: "y" }], q2_ans: "B" } };
let momBad = [];
WEEKS.forEach(w => { const x = NB.generate("lincoln", ctx(w, momBanks)), y = OLD.generate("lincoln", ctx(w, momBanks));
  if (x.student.indexOf("SUN is to DAY") < 0 || x.student.indexOf("2 + 2 = ?") < 0 || x.student.indexOf("A short made-up story.") < 0) momBad.push("wk" + w + " banks not used");
  ["student", "parent"].forEach(p => { if (x[p] !== y[p]) momBad.push("wk" + w + " " + p); }); });
ok(!momBad.length, "with Mom's analogy + number banks and a stored passage loaded, the notebook prints byte for byte as before", momBad.slice(0, 4).join(", "));

console.log(pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
