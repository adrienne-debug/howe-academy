/*
 * Node tests for the workbook ANSWER-KEY CHECK MODE — her ask 2026-09-05: "when he's done
 * and goes to mom the pdf opens side by side to its answers for her to see to check".
 *
 *   · a card label resolves to the page where that exercise's answers START in the key
 *   · page-range labels resolve through the exercise that page belongs to
 *   · a kid's device never learns the answer page — the link carries it only for Mom,
 *     and the viewer drops it again on open
 *   · the card shows "Check answers" only when the link carries an answer page
 *
 *   run:  node test_wbcheck.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
function slice(name) {
  const i = src.indexOf("function " + name + "(");
  if (i < 0) { console.error(name + " not found"); process.exit(1); }
  return src.slice(i, src.indexOf("\n}", i) + 2);
}
const CODE = ["wbPageFor", "wbAnsPageFor", "wbMomEyes", "wbTaskLink", "wbOpenCheck", "wbBook"].map(slice).join("\n");
let pass = 0, fail = 0;
function ok(n, c, x) { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x) + ")" : "")); } }

// The real Reading Detective book shape: offset 11, ex map, and the answer map read from
// the key pages on 2026-09-05.
const ans = { "1": 149, "2": 149, "3": 150, "4": 150, "5": 151, "6": 152, "7": 152, "8": 153, "9": 153, "10": 154, "11": 154, "12": 155, "13": 155, "14": 156, "15": 157, "16": 157, "17": 158, "18": 158, "19": 159, "20": 159, "21": 160, "22": 161, "23": 161, "24": 162, "25": 163, "26": 163, "27": 164, "28": 165, "29": 165, "30": 166, "31": 166, "32": 167, "33": 167, "34": 168, "35": 168, "36": 168, "37": 169, "38": 169, "39": 170, "40": 170, "41": 171, "42": 172, "43": 172, "44": 173, "45": 173, "46": 174, "47": 175, "48": 176, "49": 176, "50": 177, "51": 178, "52": 178 };
const ex = {}; for (let n = 1; n <= 52; n++) ex[n] = 14 + (n - 1) * 2 + (n > 25 ? 2 : 0) + (n > 42 ? 0 : 0);   // shape only; exact values below where they matter
ex[7] = 26; ex[8] = 28; ex[39] = 112; ex[50] = 134; ex[51] = 136; ex[52] = 138;
const book = { id: "mtlxymngbwq", name: "01556BEPReadingDetBeg", pages: 193, toc: { offset: 11, pre: 2, post: 140, ex, ans, ansPre: 147, ansPost: 179 } };

function world(mom) {
  const ctx = { console, wbBooks: { mtlxymngbwq: book }, momHere: () => mom, adminPinUnlocked: false,
    currData: { subjects: { ellis: { read_detect: { workbook: "mtlxymngbwq" } } } },
    taskLessonRef: t => t.lessonRef, db: null, alert: () => {}, opened: null };
  vm.createContext(ctx); vm.runInContext(CODE, ctx);
  vm.runInContext("function wbOpen(b,k,p,o){ opened={b,k,p,o}; }", ctx);
  return { call: e => vm.runInContext(e, ctx), ctx };
}
console.log("── label → answer-key page ──");
{
  const w = world(true);
  ok("Ex. 39–40 → key p170 + 11 = PDF 181", w.call("wbAnsPageFor(wbBooks.mtlxymngbwq,'Ex. 39–40')") === 181);
  ok("Ex. 1 → PDF 160", w.call("wbAnsPageFor(wbBooks.mtlxymngbwq,'Ex. 1')") === 160);
  ok("Exercise 52 → PDF 189", w.call("wbAnsPageFor(wbBooks.mtlxymngbwq,'Exercise 52')") === 189);
  ok("Pretest → PDF 158", w.call("wbAnsPageFor(wbBooks.mtlxymngbwq,'Pretest')") === 158);
  ok("Posttest → PDF 190", w.call("wbAnsPageFor(wbBooks.mtlxymngbwq,'Posttest')") === 190);
  ok("pg26-29 → exercise 7's key page (152 + 11)", w.call("wbAnsPageFor(wbBooks.mtlxymngbwq,'pg26-29')") === 163);
  ok("pg27 (mid-exercise) still → exercise 7", w.call("wbAnsPageFor(wbBooks.mtlxymngbwq,'pg27')") === 163);
  ok("unreadable label → null", w.call("wbAnsPageFor(wbBooks.mtlxymngbwq,'Lesson 3')") === null);
  ok("a book without an answer map → null", w.call("wbAnsPageFor({pages:193,toc:{offset:11,ex:{1:14}}},'Ex. 1')") === null);
  ok("the exercise page itself is unchanged", w.call("wbPageFor(wbBooks.mtlxymngbwq,'Ex. 39–40')") === 123);
}
console.log("\n── the link carries the answer page for Mom only ──");
{
  const t = { who: "ellis", subjectKey: "read_detect", lessonRef: "Ex. 39–40" };
  const m = world(true).call("wbTaskLink(" + JSON.stringify(t) + ")");
  ok("Mom's device: page + answer page", m && m.page === 123 && m.ans === 181, m);
  const k = world(false).call("wbTaskLink(" + JSON.stringify(t) + ")");
  ok("kid's device: page only, answer page is null", k && k.page === 123 && k.ans === null, k);
  const a = world(false); a.ctx.adminPinUnlocked = true;
  ok("admin PIN counts as Mom's eyes", a.call("wbTaskLink(" + JSON.stringify(t) + ")").ans === 181);
}
console.log("\n── opening the check is gated twice ──");
{
  const m = world(true); m.call("wbOpenCheck('mtlxymngbwq','ellis',123,181)");
  ok("Mom's device opens the split view", m.ctx.opened && m.ctx.opened.o && m.ctx.opened.o.ans === 181, m.ctx.opened);
  const k = world(false); k.call("wbOpenCheck('mtlxymngbwq','ellis',123,181)");
  ok("a kid device opens nothing at all", k.ctx.opened === null);
  // and wbOpen itself drops a smuggled answer page on a kid device
  const open = slice("wbOpen");
  ok("wbOpen re-checks Mom's eyes before showing a key pane", /if\(!\(ans>=1&&ans<=\(b\.pages\|\|1\)\)\|\|!wbMomEyes\(\)\) ans=0;/.test(open));
  ok("the key pane has no ink canvas", !/wb-ans-hold[\s\S]*?<canvas/.test(open.slice(open.indexOf("wb-ans-hold"), open.indexOf("wb-ans-hold") + 700)));
}
console.log("\n── the card ──");
{
  const i = src.indexOf("const wbRow=");
  const row = src.slice(i, src.indexOf("\n", src.indexOf("wbOpenCheck", i)));
  ok("Check answers chip is rendered only when the link carries an answer page", /\(_wbl\.ans\?'<span onclick="event\.stopPropagation\(\);wbOpenCheck\(/.test(row));
  ok("the plain Open chip is still there for the kid", /wbOpenFor\(/.test(row));
}
console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
