// Julian letter rotation: cursor-based continuation (2026-08-24).
// The bug: natural picks were ((wk-1)*5 + i) % bankSize, and the Letters bank GROWS
// (~1 letter/week via auto_pull) — every growth changed the modulo and rewound the
// weekly window toward A (wk19 landed on exactly A B C D E after near-identical weeks).
// The fix: the app stores notebookSettings/julian/letterCursor = {week, idx, adv} after
// each print; the next week continues from idx+adv regardless of bank size. Review
// injection advances the cursor only by the natural letters actually shown, so a
// displaced letter opens the NEXT week's window instead of being silently skipped.
// Run: node test_julian_letters.js

const fs = require("fs");
global.window = {};
eval(fs.readFileSync(__dirname + "/notebooks.js", "utf8"));
const NB = window.HoweNotebooks;

let pass = 0, fail = 0;
function ok(cond, name, detail) {
  if (cond) { pass++; console.log("  ✓ " + name); }
  else { fail++; console.log("  ✗ " + name + (detail ? "  → " + detail : "")); }
}

function bank(letters, flagged) {
  // flagged: letters with a drop_count on a fast tier => review-flagged
  return letters.map(ch => ({
    subject: "Letters", prompt: ch, status: "active",
    tier: (flagged || []).includes(ch) ? "every_third_day" : "bi_weekly",
    drop_count: (flagged || []).includes(ch) ? 8 : 0
  }));
}
const dates = { monday: "1", tuesday: "2", wednesday: "3", thursday: "4", friday: "5" };
function ctxFor(wk, items, cursor) {
  return { weekNum: "week" + wk, weekDates: "x", weekData: { dates, tasks: [] }, masteryItems: items, letterCursor: cursor || null, reviewCap: 2 };
}
function lettersShown(ctx) {
  return NB.juPlanPreview(ctx).subjects.letters.slots.map(s => s.prompt);
}
function cursorAfter(ctx) {
  return NB.generate("julian", ctx).letterCursor;
}

const AO = "ABCDEFGHIJKLMNO".split("");

console.log("1) bootstrap (no cursor) keeps the legacy window");
{
  const c = ctxFor(19, bank(AO));
  ok(lettersShown(c).join("") === "ABCDE", "wk19 no-cursor boots at ((19-1)*5)%15 = A B C D E", lettersShown(c).join(""));
  const cur = cursorAfter(c);
  ok(cur && cur.week === 19 && cur.idx === 0 && cur.adv === 5, "cursor recorded {19,0,5}", JSON.stringify(cur));
}

console.log("2) weeks continue from the cursor; review letters displace INTO the window");
{
  let cursor = { week: 19, idx: 0, adv: 5 };
  const flagged = ["D"];
  const seq = {};
  for (let wk = 20; wk <= 23; wk++) {
    const c = ctxFor(wk, bank(AO, flagged), cursor);
    seq[wk] = lettersShown(c);
    cursor = cursorAfter(c);
  }
  ok(seq[20].join(" ") === "D F G H I", "wk20 = D* F G H I (D injected, window F–I)", seq[20].join(" "));
  ok(seq[21].join(" ") === "D J K L M", "wk21 continues at J — displaced J was NOT skipped", seq[21].join(" "));
  ok(seq[22].join(" ") === "D N O A B", "wk22 wraps N O A B", seq[22].join(" "));
  const union = new Set([].concat(seq[20], seq[21], seq[22], seq[23]));
  ok(AO.every(ch => union.has(ch)), "every letter A–O appears within the cycle (no starvation)", [...union].join(""));
  ok(seq[23].join(" ") === "C D E F G", "wk23 opens with displaced C; D now falls naturally in-window (no inject)", seq[23].join(" "));
  ok(cursor.week === 23 && cursor.idx === 2 && cursor.adv === 5, "cursor {23,2,5}: adv=4 on injected weeks, back to 5 when review is natural", JSON.stringify(cursor));
}

console.log("3) bank growth no longer rewinds the window");
{
  const cursor = { week: 20, idx: 5, adv: 4 };
  const before = lettersShown(ctxFor(21, bank(AO, ["D"]), cursor));
  const grown = lettersShown(ctxFor(21, bank(AO.concat(["P", "Q"]), ["D"]), cursor));
  ok(before.join(" ") === grown.join(" "), "wk21 identical with 15-letter and 17-letter bank", before.join(" ") + " vs " + grown.join(" "));
  // and the OLD formula would have rewound: prove the regression case is dead
  const legacy21_n17 = ((21 - 1) * 5) % 17; // = 15 → would start at P
  ok(grown[1] === "J", "window starts at J (cursor), not index " + legacy21_n17 + " (legacy)", grown.join(" "));
}

console.log("4) same-week reprint is idempotent");
{
  const cursor = { week: 20, idx: 5, adv: 4 };
  const c = ctxFor(20, bank(AO, ["D"]), cursor);
  const first = lettersShown(c);
  const cur2 = cursorAfter(c);
  const second = lettersShown(ctxFor(20, bank(AO, ["D"]), cur2));
  ok(first.join(" ") === second.join(" "), "reprint shows the same letters", first.join(" ") + " vs " + second.join(" "));
  ok(cur2.week === 20 && cur2.idx === 5 && cur2.adv === 4, "reprint rewrites the same cursor", JSON.stringify(cur2));
}

console.log("5) printing an earlier week walks back without crashing");
{
  const cursor = { week: 22, idx: 13, adv: 4 };
  const shown = lettersShown(ctxFor(20, bank(AO), cursor));
  ok(shown.length === 5 && shown.every(ch => AO.includes(ch)), "walk-back yields a valid 5-letter window", shown.join(" "));
}

console.log("6) other subjects and Mom's picks are untouched");
{
  const items = bank(AO).concat(["1", "2", "3", "4", "5", "6", "7"].map(n => ({ subject: "Numbers", prompt: n, status: "active", tier: "weekly", drop_count: 0 })));
  const noCur = NB.juPlanPreview(ctxFor(20, items)).subjects.numbers.slots.map(s => s.prompt);
  const withCur = NB.juPlanPreview(ctxFor(20, items, { week: 19, idx: 0, adv: 5 })).subjects.numbers.slots.map(s => s.prompt);
  ok(noCur.join(" ") === withCur.join(" "), "numbers window ignores the letter cursor", noCur.join(" ") + " vs " + withCur.join(" "));
  const c = ctxFor(20, bank(AO), { week: 19, idx: 0, adv: 5 });
  c.juPicks = { letters: { 2: "M" } };
  const picked = lettersShown(c);
  ok(picked[2] === "M", "Mom's per-slot pick still wins", picked.join(" "));
  ok(cursorAfter(c).idx === 5, "an override does not shift the cursor", JSON.stringify(cursorAfter(c)));
}

console.log("\n" + pass + "/" + (pass + fail) + " passed" + (fail ? "  ← FAILURES" : ""));
process.exit(fail ? 1 : 0);
