// JU_NUMBERS_AHEAD — a new number every school day, 1 → 100, for Julian and Caleb (her asks
// 2026-10-12: "why is julian's notebook cycling back through small numbers after 16?" → "link it to
// the math facts unit like caleb is" → "at the last 17 it should move to the next level instead of
// repeating" → "a new number each day all the way to 100"). Before: a sliding window over the
// Numbers bank with a plain modulo (bank to 16 → week 4 printed 16 1 2 3 4). Now: the first week
// opens on the number the drills are introducing (else just past the highest known), and from then
// on the notebook keeps its own place (numberCursor, saved by the app after each print) so the
// next week continues and nothing repeats. Missed bank numbers still come back with 🔁. Past 20
// the page shows tens and ones + the number's hundred-chart row instead of counting every picture.
const fs = require("fs");
global.window = {};
eval(fs.readFileSync(__dirname + "/notebooks.js", "utf8"));
const NB = window.HoweNotebooks;

let pass = 0, fail = 0;
function ok(cond, name, detail) {
  if (cond) { pass++; console.log("  ✓ " + name); }
  else { fail++; console.log("  ✗ " + name + (detail ? "  → " + detail : "")); }
}
const dates = { monday: "1", tuesday: "2", wednesday: "3", thursday: "4", friday: "5" };
const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map(ch => ({ subject: "Letters", prompt: ch, status: "active", tier: "weekly" }));
const numItems = (known, learning, extra) => known.map(n => Object.assign({ subject: "Numbers", prompt: String(n), status: "active", tier: "weekly" }, (extra || {})[n] || {}))
  .concat(learning.map(n => ({ subject: "Numbers", prompt: String(n), status: "introduction", tier: "daily" })));
const ctx = (wk, items, cursor, reviewCap) => ({ weekNum: "week" + wk, weekDates: "x", weekData: { dates, tasks: [] }, masteryItems: letters.concat(items), numberCursor: cursor || null, reviewCap: reviewCap == null ? 2 : reviewCap });
const nums = (o) => [...o.student.matchAll(/recap-chip">🔢 (\d+)/g)].map(m => m[1]).join(" ");
const planNums = (c) => NB.juPlanPreview(c).subjects.numbers.slots.map(s => s.prompt).join(" ");
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

console.log("— the live symptom, and the first week —");
let c = ctx(4, numItems(range(1, 16), []));
let o = NB.generate("julian", c);
ok(nums(o) === "17 18 19 20 21", "bank tops out at 16 (all known), week 4 → 17 18 19 20 21 (was 16 1 2 3 4)", nums(o));
ok(same(o.numberCursor, { week: 4, from: 17, adv: 5 }), "returns the place to save: week 4 started at 17, showed 5 new", JSON.stringify(o.numberCursor));
ok(/17 · 18 · 19 · 20 · 21/.test(o.student) && /17 · 18 · 19 · 20 · 21/.test(o.parent), "cover and parent guide list this week's five", (o.student.match(/\d+ · \d+ · \d+ · \d+ · \d+/) || [])[0]);
ok(planNums(c) === nums(o), "planner preview matches the printed pages", planNums(c) + " vs " + nums(o));
o = NB.generate("julian", ctx(1, numItems(range(1, 10), [11, 12, 13])));
ok(nums(o) === "11 12 13 14 15", "drills introducing 11–13 → first week opens on 11", nums(o));

console.log("— the saved place carries week to week —");
const cur4 = { week: 4, from: 17, adv: 5 };
o = NB.generate("julian", ctx(5, numItems(range(1, 16), []), cur4));
ok(nums(o) === "22 23 24 25 26", "next week continues: 22 23 24 25 26", nums(o));
ok(same(o.numberCursor, { week: 5, from: 22, adv: 5 }), "and hands back its own place", JSON.stringify(o.numberCursor));
o = NB.generate("julian", ctx(4, numItems(range(1, 16), []), cur4));
ok(nums(o) === "17 18 19 20 21", "re-printing the saved week prints the same numbers", nums(o));
o = NB.generate("julian", ctx(7, numItems(range(1, 16), []), cur4));
ok(nums(o) === "32 33 34 35 36", "two unprinted weeks later: skips 5 per week (32–36)", nums(o));
o = NB.generate("julian", ctx(5, numItems(range(1, 20), []), cur4));
ok(nums(o) === "22 23 24 25 26", "the saved place rules even after the drills catch up (knows 1–20)", nums(o));
o = NB.generate("julian", ctx(3, numItems(range(1, 16), []), cur4));
ok(nums(o) === "12 13 14 15 16", "an earlier week walks back (week 3 → 12–16)", nums(o));
ok(planNums(ctx(5, numItems(range(1, 16), []), cur4)) === "22 23 24 25 26", "planner preview reads the saved place too");

console.log("— review, short weeks, the top —");
o = NB.generate("julian", ctx(1, numItems(range(1, 10), [11, 12, 13], { 7: { recentMiss: 2 } })));
ok(nums(o) === "7 11 12 13 14" && /Practice Again 🔁 · 7/.test(o.student), "missed 7 comes back once with 🔁 ahead of the new numbers", nums(o));
ok(same(o.numberCursor, { week: 1, from: 11, adv: 4 }), "a review day means only 4 new numbers showed (adv 4)", JSON.stringify(o.numberCursor));
o = NB.generate("julian", ctx(2, numItems(range(1, 10), [11, 12, 13], { 7: { recentMiss: 2 } }), { week: 1, from: 11, adv: 4 }));
ok(nums(o).startsWith("7 15 16 17 18") || nums(o) === "7 15 16 17 18", "next week picks up at 15 — the displaced number isn't skipped", nums(o));
const d4 = { monday: "1", tuesday: "2", wednesday: "3", friday: "5" };
o = NB.generate("julian", Object.assign(ctx(1, numItems(range(1, 16), [])), { weekData: { dates: d4, tasks: [] } }));
ok(nums(o) === "17 18 19 20" && o.numberCursor.adv === 4, "a 4-day week shows 4 and advances 4", nums(o) + " adv " + (o.numberCursor || {}).adv);
o = NB.generate("julian", ctx(20, numItems(range(1, 20), []), { week: 19, from: 93, adv: 5 }));
ok(nums(o) === "98 99 100 98 99", "the last week runs out at 100", nums(o));
o = NB.generate("julian", ctx(21, numItems(range(1, 20), []), { week: 20, from: 98, adv: 5 }));
ok(nums(o) === "1 2 3 4 5" && !o.numberCursor, "past 100 → plain review rotation over his bank, no cursor written", nums(o));
o = NB.generate("julian", ctx(1, []));
ok(nums(o) === "1 2 3 1 2" && !o.numberCursor, "no Numbers deck → default 1 2 3 rotation as before, no cursor", nums(o));
const curObj = NB._internal.juCurriculumFromMastery(letters.concat(numItems(range(1, 10), [11, 12, 13])));
const before = curObj.numbers.join(" ");
NB.juPlanPreview({ weekNum: "week3", weekData: { dates }, curriculum: curObj });
ok(curObj.numbers.join(" ") === before, "juPlanPreview leaves a passed-in curriculum untouched", curObj.numbers.join(" "));

console.log("— the page past 20: tens and ones —");
const page = (o, num) => { const i = o.student.indexOf('Number of the Day · ' + num); return i < 0 ? "" : o.student.slice(i, i + 6000); };
o = NB.generate("julian", ctx(5, numItems(range(1, 20), []), { week: 4, from: 42, adv: 5 }));
let pg = page(o, "47");
ok((pg.match(/class="ten-tile"/g) || []).length === 4, "47 → four ten-tiles", String((pg.match(/class="ten-tile"/g) || []).length));
ok((pg.match(/tf-cell on/g) || []).length === 7, "…and 7 ones in the small frame", String((pg.match(/tf-cell on/g) || []).length));
ok(/4 tens and 7 ones · count by tens/.test(pg), "label says 4 tens and 7 ones");
ok(/hc-cell on">47</.test(pg) && /hc-cell">41</.test(pg) && /hc-cell">50</.test(pg), "hundred-chart row 41–50 with 47 lit");
o = NB.generate("julian", ctx(5, numItems(range(1, 20), []), { week: 4, from: 91, adv: 5 }));
pg = page(o, "100");
ok((pg.match(/class="ten-tile"/g) || []).length === 10 && !/<div class="ten-frame">/.test(pg.slice(0, pg.indexOf("hc-strip"))), "100 → ten ten-tiles and no ones frame", String((pg.match(/class="ten-tile"/g) || []).length));
ok(/10 tens · count by tens/.test(pg) && /hc-cell on">100</.test(pg), "100: label '10 tens', row 91–100 with 100 lit");
o = NB.generate("julian", ctx(1, numItems(range(1, 10), [11, 12, 13])));
pg = page(o, "13");
ok((pg.match(/<div class="ten-frame">/g) || []).length === 2 && !/ten-tile/.test(pg) && /How many\? Count, then trace/.test(pg), "11–20 unchanged: two ten-frames, old label");

console.log("— Caleb shares it —");
const cb = (wk, items, cursor) => NB.generate("caleb", { weekNum: "week" + wk, weekDates: "x", weekData: { dates, tasks: [] }, masteryItems: items, numberCursor: cursor || null, reviewCap: 2 });
o = cb(1, numItems(range(1, 17), [18, 19, 20]));
ok(nums(o) === "18 19 20 21 22" && same(o.numberCursor, { week: 1, from: 18, adv: 5 }), "Caleb: 18 19 20 21 22 and a saved place", nums(o));
o = cb(2, numItems(range(1, 17), [18, 19, 20]), { week: 1, from: 18, adv: 5 });
ok(nums(o) === "23 24 25 26 27", "Caleb next week: 23–27", nums(o));
ok(/= 2 tens and 3</.test(o.student) && /class="ten-tile"/.test(o.student), "Caleb's title says '= 2 tens and 3' and his page shows ten-tiles");

console.log("— wiring —");
const src = fs.readFileSync(__dirname + "/notebooks.js", "utf8");
ok(src.indexOf("// JU_NUMBERS_AHEAD_START") > 0 && src.indexOf("// JU_NUMBERS_AHEAD_END") > src.indexOf("// JU_NUMBERS_AHEAD_START"), "marked block present");
ok((src.match(/numbersFront = /g) || []).length === 1 && !/juTurnNumbers/.test(src), "one shared engine, no per-kid copy");
const app = fs.readFileSync(__dirname + "/index.html", "utf8");
ok(/numberCursor:\(\(\(\(notebookSettings\|\|\{\}\)\[kid\]\)\|\|\{\}\)\.numberCursor\)\|\|null/.test(app), "app passes notebookSettings/<kid>/numberCursor into the notebook context");
ok((app.match(/db\.ref\("notebookSettings\/"\+kid\+"\/numberCursor"\)\.set\(nc\)/g) || []).length === 2, "app saves the place after each print (both print paths), per kid, targeted write");
ok(!/kid==="julian"&&out&&out\.numberCursor/.test(app), "no Julian-only cursor write");

console.log("\n" + pass + "/" + (pass + fail) + " passed");
process.exit(fail ? 1 : 0);
