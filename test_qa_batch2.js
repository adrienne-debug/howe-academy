/*
 * 🧹 QA_BATCH2 — Caleb's notebook (walkthrough 2026-10-04): parent-guide targets = this week's shapes/colors · the week
 * opens with the shapes he's LEARNING · no page on a day with no school cards (co-op Thursday).
 *   run:  node test_qa_batch2.js
 */
const fs = require("fs"), path = require("path");
global.window = {};
eval(fs.readFileSync(path.join(__dirname, "notebooks.js"), "utf8"));
const NB = window.HoweNotebooks;
let pass = 0, fail = 0;
function ok(name, cond, extra) { if (cond) { pass++; console.log("  ok  - " + name); } else { fail++; console.log("  FAIL- " + name + (extra !== undefined ? "  (" + JSON.stringify(extra) + ")" : "")); } }
const dates = { monday: "October 5, 2026", tuesday: "October 6, 2026", wednesday: "October 7, 2026", thursday: "October 8, 2026", friday: "October 9, 2026" };
// Caleb on 10/4: basic 4 shapes known, learning Hexagon + Oval; school cards Mon/Tue/Wed/Fri (Thursday = co-op)
const items = ["Circle", "Square", "Triangle", "Rectangle"].map(n => ({ subject: "Shapes", prompt: n, status: "active" }))
  .concat([{ subject: "Shapes", prompt: "Hexagon", status: "introduction" }, { subject: "Shapes", prompt: "Oval", status: "introduction" }]);
const tasks = ["monday", "tuesday", "wednesday", "friday"].map(d => ({ who: "caleb", day: d, title: "📖 Morning Notebook" }))
  .concat([{ who: "andrew", day: "thursday", title: "Piano" }]);
const gen = (wk, extra) => NB.generate("caleb", Object.assign({ weekNum: "week" + wk, weekDates: "x", weekData: { dates, tasks }, masteryItems: items, letterCursor: { week: 1, idx: 0, adv: 4, from: 1 } }, extra || {}));
const dayLabels = o => [...o.student.matchAll(/class="page-label">Daily Page — (\w+)/g)].map(m => m[1]);
const shapesOf = o => [...o.student.matchAll(/recap-chip">⭐ (\w+)/g)].map(m => m[1]);

let o = gen(1);
ok("no Thursday page (co-op day, no school cards for him)", dayLabels(o).join() === "Monday,Tuesday,Wednesday,Friday", dayLabels(o));
ok("the week opens with the shapes he's learning: Hexagon, Oval", shapesOf(o).slice(0, 2).join() === "Hexagon,Oval", shapesOf(o));
ok("…then two of his other shapes", shapesOf(o).length === 4 && !shapesOf(o).slice(2).some(s => s === "Hexagon" || s === "Oval"), shapesOf(o));
const tg = /🔢 Numbers[\s\S]*?⭐ Shapes<\/div><div class="p-tval">([^<]*)<[\s\S]*?🎨 Colors<\/div><div class="p-tval">([^<]*)</.exec(o.parent);
ok("parent guide lists THIS week's 4 shapes (was all 18)", tg && tg[1].split(", ").length === 4 && /Hexagon/.test(tg[1]) && /Oval/.test(tg[1]), tg && tg[1]);
ok("…and this week's colors (was all 8)", tg && tg[2].split(", ").length === 4, tg && tg[2]);
const o2 = gen(2, { letterCursor: { week: 1, idx: 0, adv: 4, from: 1 } });
ok("next week still opens with the learning shapes", shapesOf(o2).slice(0, 2).join() === "Hexagon,Oval", shapesOf(o2));
ok("…and rotates to different other shapes", shapesOf(o2).slice(2).join() !== shapesOf(o).slice(2).join(), [shapesOf(o).slice(2), shapesOf(o2).slice(2)]);
ok("letters continue across the 4-day week (cursor advances by 4, nothing skipped)", JSON.stringify(o.letterCursor) === '{"week":1,"idx":0,"adv":4,"from":1}', o.letterCursor);
const o3 = NB.generate("caleb", { weekNum: "week1", weekDates: "x", weekData: { dates, tasks: [] }, masteryItems: items });
ok("a week with no schedule for him yet still prints all 5 days", dayLabels(o3).length === 5, dayLabels(o3));
const j = NB.generate("julian", { weekNum: "week1", weekDates: "x", weekData: { dates, tasks }, masteryItems: [] });
ok("Julian's notebook keeps all 5 days (unchanged)", [...j.student.matchAll(/Daily Page — /g)].length === 5);

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
