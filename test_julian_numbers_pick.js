// JU_NUMPICK — Mom can swap a Numbers day on Julian's "This week's plan" card to ANY number (her
// 2026-11-03: "I am not able to click the numbers that they are learning and adjust them to a
// different number"). Since JU_NUMBERS_AHEAD the week's number list is only this week's five, so the
// chooser offered the same five and a pick for a number outside them had nothing to resolve to.
// Now: the chooser offers 1–100, a picked number joins the week list, the printed page and the
// cover show it, and the saved place (numberCursor) still advances as if nothing was picked.
const fs = require("fs");
global.window = {};
eval(fs.readFileSync(__dirname + "/notebooks.js", "utf8"));
const NB = window.HoweNotebooks;
let pass = 0, fail = 0;
function ok(cond, name, detail) { if (cond) { pass++; console.log("  ✓ " + name); } else { fail++; console.log("  ✗ " + name + (detail ? "  → " + detail : "")); } }
const dates = { monday: "1", tuesday: "2", wednesday: "3", thursday: "4", friday: "5" };
const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map(ch => ({ subject: "Letters", prompt: ch, status: "active", tier: "weekly" }));
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const numItems = (known, learning) => known.map(n => ({ subject: "Numbers", prompt: String(n), status: "active", tier: "weekly" }))
  .concat(learning.map(n => ({ subject: "Numbers", prompt: String(n), status: "introduction", tier: "daily" })));
const ctx = (picks) => ({ weekNum: "week28", weekDates: "x", weekData: { dates, tasks: [] }, masteryItems: letters.concat(numItems(range(1, 15), [16, 17, 18])), numberCursor: { week: 27, from: 14, adv: 4 }, reviewCap: 0, juPicks: picks || null });
const slots = (p, sub) => p.subjects[sub].slots.map(s => s.prompt).join(" ");
const printed = (o) => [...o.student.matchAll(/recap-chip">🔢 (\d+)/g)].map(m => m[1]).join(" ");

console.log("— the chooser —");
let plan = NB.juPlanPreview(ctx());
ok(plan.subjects.numbers.items.length === 100 && plan.subjects.numbers.items[0].prompt === "1" && plan.subjects.numbers.items[99].prompt === "100", "Numbers chooser offers 1–100 (was only this week's five)", plan.subjects.numbers.items.length);
ok(plan.subjects.letters.items.length === 26, "Letters chooser unchanged (the whole bank)", plan.subjects.letters.items.length);
ok(slots(plan, "numbers") === "18 19 20 21 22", "no pick: week 28 continues from the saved place (14+4)", slots(plan, "numbers"));

console.log("— a pick outside this week's five —");
plan = NB.juPlanPreview(ctx({ numbers: { 2: "40" } }));
ok(slots(plan, "numbers") === "18 19 40 21 22", "Wednesday swapped to 40; the other days keep the engine's pick", slots(plan, "numbers"));
ok(plan.subjects.numbers.slots[2].picked === true && plan.subjects.numbers.slots[1].picked === false, "📌 marks only the picked slot");
let o = NB.generate("julian", ctx({ numbers: { 2: "40" } }));
ok(printed(o) === "18 19 40 21 22", "the printed pages show 40 on Wednesday", printed(o));
ok(/18 · 19 · 40 · 21 · 22/.test(o.student), "the cover lists this week's numbers with the pick", (o.student.match(/\d+ · \d+ · \d+ · \d+ · \d+/) || [])[0]);
const o0 = NB.generate("julian", ctx());
ok(JSON.stringify(o.numberCursor) === JSON.stringify(o0.numberCursor), "the saved place advances exactly as without the pick (next week is not shifted)", JSON.stringify(o.numberCursor));

console.log("— a pick inside this week's five, and back to auto —");
plan = NB.juPlanPreview(ctx({ numbers: { 0: "22" } }));
ok(slots(plan, "numbers") === "22 19 20 21 22", "picking a number already on the week works too", slots(plan, "numbers"));
plan = NB.juPlanPreview(ctx({ numbers: {} }));
ok(slots(plan, "numbers") === "18 19 20 21 22", "an empty pick map = engine order", slots(plan, "numbers"));

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
