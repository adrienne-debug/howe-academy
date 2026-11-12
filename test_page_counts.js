/*
 * Node tests for PAGECOUNT (her ask 2026-11-12: "fix page counts").
 *
 * "Pages worked through" and the page progress bar split a subject into books with _bookRuns. A new book used to start
 * on EVERY label change, and most labels name the lesson, so each lesson was a "book" and the totals summed every
 * lesson's page number (live: a 379-page grammar workbook read 20,180; a 585-page one read 32,683).
 * Now a new book starts only when the pages go back down AND the label's first word changes (MR5 → MR6) or the count
 * restarts at page 1. Label shapes below are the real ones from the kids' lesson lists (titles shortened).
 *
 *   run:  node test_page_counts.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
function slice(name) { const i = src.indexOf("function " + name + "("); if (i < 0) { console.error(name + " not found"); process.exit(1); } return src.slice(i, src.indexOf("\n}", i) + 2); }
function line(name) { const i = src.indexOf("function " + name + "("); if (i < 0) { console.error(name + " not found"); process.exit(1); } return src.slice(i, src.indexOf("\n", i) + 1); }
let pass = 0, fail = 0;
function ok(n, c, x) { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x) + ")" : "")); } }
const ctx = {}; vm.createContext(ctx);
vm.runInContext([slice("parsePageNum"), line("_bookKey"), line("_bookTok"), slice("_bookRuns"), slice("_bankedPages"), slice("subjectCurrentBook")].join("\n"), ctx);
const runs = l => ctx._bookRuns(l.map(x => ({ lesson: x })));
const pages = l => ctx._bankedPages(l.map(x => ({ lesson: x })), l.length - 1);
const cur = (l, i) => ctx.subjectCurrentBook(l.map(x => ({ lesson: x })), i);

// lesson-named labels, pages climbing → one book, total = last page
const fll = ["Lesson 1 · Ch 1 — The Parts of This Book (WB p.1)", "Lesson 2 · Ch 2 — Nouns (WB p.2)", "Lesson 3 · Ch 3 — Plurals (WB p.3)", "Lesson 50 · Ch 50 — Summary (WB p.198)", "Dictionary Skills 5 — Synonyms (WB p.379)"];
ok("lesson-named workbook is one book", runs(fll).length === 1, runs(fll).length);
ok("…pages = 379, not the sum of every lesson's page", pages(fll) === 379, pages(fll));
ok("…unnamed (labels differ), so no 'book 1 of N' in the progress bar", runs(fll)[0].name === "" && cur(fll, 2).bookCount === 1);

// several days on one page
const rs = ["Introduction · Ch 1 Discovering (p.1) · day 1 of 2", "Introduction · Ch 1 Discovering (p.1) · day 2 of 2", "Chemistry · Ch 2 Electrons (p.8) · day 1 of 2", "Chemistry · Ch 2 Electrons (p.8) · day 2 of 2", "Conclusion · Glossary/Index (p.201) · day 2 of 2"];
ok("day 1 / day 2 on the same page stay one book", runs(rs).length === 1 && pages(rs) === 201, [runs(rs).length, pages(rs)]);

// unit-labelled
const ss = ["Unit 1 · Pg 5–6", "Unit 1 · Pg 7–8", "Unit 2 · Pg 13–14", "Unit 16 · Pg 131–132"];
ok("unit-labelled workbook: one book, 132 pages", runs(ss).length === 1 && pages(ss) === 132);

// a page or two out of order inside one book
const hwt = ["Pg 27", "Pg 33", "Pg 45", "Pg 37", "Pg 49", "Pg 57"];
ok("a dip in pages (Pg 45 → Pg 37) is not a new book", runs(hwt).length === 1 && pages(hwt) === 57, [runs(hwt).length, pages(hwt)]);

// pages jumping around one workbook
const wsj = ["pp. 169–180 · Lesson 1 Fable · Set 1", "pp. 7–16 · Lesson 1 Fable · Set 2", "pp. 17–20 · Lesson 1 Fable · Set 3", "Lesson 1 Fable · Set 5", "pp. 229–240 · Lesson 6 Poetry · Set 1", "pp. 91–92 · Lesson 6 Poetry · Set 2"];
ok("a workbook whose lessons jump around stays one book", runs(wsj).length === 1 && pages(wsj) === 240, [runs(wsj).length, pages(wsj)]);

// real multi-book: MR5 → MR6
const mr = ["MR5 pp.136–139", "MR5 pp.300–303", "MR5 pp.412–413", "MR6 pp.1–4", "MR6 pp.200–203", "MR6 pp.401–404"];
const mrr = runs(mr);
ok("MR5 → MR6 is still two books", mrr.length === 2 && mrr[0].name === "MR5" && mrr[1].name === "MR6", mrr.map(r => r.name));
ok("…pages bank per book: 413 + 404", pages(mr) === 817, pages(mr));
ok("…progress in MR6 reads book 2 of 2", cur(mr, 4).bookNum === 2 && cur(mr, 4).bookCount === 2);

// same label, count restarts at page 1
const again = ["Book p.10", "Book p.30", "Book p.1", "Book p.20"];
ok("same label starting over at page 1 is a new book", runs(again).length === 2);

// volume tokens untouched: a 'B2 pg' run with a small dip
const eic = ["B2 pg 9", "B2 pg 20", "B2 pg 27", "B2 pg 25", "B2 pg 40"];
ok("B2 pg 27 → B2 pg 25 stays one book", runs(eic).length === 1 && pages(eic) === 40);

// a series word names the book; a lesson number never does
const lv = ["Level A p.40", "Level A p.44", "Level B p.12", "Level B p.16"];
ok("Level A → Level B (pages drop) is a new book", runs(lv).map(r => r.name).join("|") === "Level A|Level B", runs(lv).map(r => r.name));
const bk = ["Book 1 · Ch 3 p.88", "Book 2 · Ch 1 p.3"];
ok("Book 1 → Book 2 is a new book", runs(bk).length === 2);
const ls = ["pp. 21–24 · Lesson 1 Fable · Set 6", "pp. 181–192 · Lesson 2 Tale · Set 1", "pp. 25–30 · Lesson 2 Tale · Set 2"];
ok("Lesson 1 → Lesson 2 with a page drop is NOT a new book", runs(ls).length === 1);

ok("no page labels → null as before", ctx._bankedPages([{ lesson: "Quest 59" }], 0) === null);

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
