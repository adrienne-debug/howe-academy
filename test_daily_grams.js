// Daily Grams in the notebook (2026-09-15): one workbook page per school day printed after that
// day's page (Ellis + Lincoln), the answer-key page(s) for those days at the end of the parent
// book, and a stored cursor {week, day, adv} that advances one Day per school day on its own.
// Run: node test_daily_grams.js

const fs = require("fs");
global.window = {};
eval(fs.readFileSync(__dirname + "/notebooks.js", "utf8"));
const NB = window.HoweNotebooks;
const dgWeekPlan = NB._internal.dgWeekPlan;

let pass = 0, fail = 0;
function ok(cond, name, detail) {
  if (cond) { pass++; console.log("  ✓ " + name); }
  else { fail++; console.log("  ✗ " + name + (detail ? "  → " + detail : "")); }
}
const count = (html, re) => (html.match(re) || []).length;
const dates5 = { monday: "September 21", tuesday: "September 22", wednesday: "September 23", thursday: "September 24", friday: "September 25" };
const dates4 = { monday: "October 12", tuesday: "October 13", wednesday: "October 14", friday: "October 16" };

// a tiny fake book: 12 days, key pages 197 (Days 1–8, continues onto 198) and 198 (Days 9–12)
function book(opts) {
  opts = opts || {};
  const pages = { day: {}, ans: {} };
  for (let d = 1; d <= 12; d++) if (!(opts.missingDay === d)) pages.day[d] = "data:image/png;base64,DAY" + d;
  pages.ans[197] = "data:image/png;base64,ANS197"; pages.ans[198] = "data:image/png;base64,ANS198";
  const dayAns = {}; for (let d = 1; d <= 12; d++) dayAns[d] = d < 8 ? [197] : (d === 8 ? [197, 198] : [198]);
  return { book: "dailyGramsTest", title: "Daily Grams Grade 4", total: 12, cursor: opts.cursor || null,
    ansMeta: { 197: { first: 1, last: 8, cont: true }, 198: { first: 9, last: 12, cont: false } }, dayAns, pages };
}
function ctxFor(kid, wk, dates, dg) {
  return { weekNum: "week" + wk, weekDates: "x", weekData: { dates, tasks: [] }, dailyGrams: dg === undefined ? null : dg, extraPages: {} };
}

console.log("1) cursor rule — dgStart");
{
  ok(NB.dgStart(null, 23) === 1, "no cursor → Day 1");
  ok(NB.dgStart({ week: 23, day: 12, adv: 5 }, 23) === 12, "same week reuses the start");
  ok(NB.dgStart({ week: 23, day: 12, adv: 5 }, 24) === 17, "next week = day + adv");
  ok(NB.dgStart({ week: 23, day: 12, adv: 4 }, 24) === 16, "a 4-day week advances 4, not 5");
  ok(NB.dgStart({ week: 23, day: 12, adv: 5 }, 26) === 27, "two unprinted weeks between → +5 each");
  ok(NB.dgStart({ week: 23, day: 12, adv: 5 }, 22) === 7, "earlier week walks back 5");
  ok(NB.dgStart({ week: 23, day: 3, adv: 5 }, 21) === 0, "a week before the start → 0 (nothing prints, nothing stored) — was: clamp to Day 1");
  ok(NB.dgStart({ week: 23, day: 7, adv: 5 }, 22) === 2 && NB.dgStart({ week: 23, day: 7, adv: 5 }, 21) === 0, "walk back stops at the start week (23 − 1 = 22)");
  ok(NB.dgStart({ week: "23", day: "12", adv: "5" }, "week24") === 17, "string fields (RTDB) parse");
}

console.log("2) week plan");
{
  const p = dgWeekPlan(book({ cursor: { week: 23, day: 6, adv: 5 } }), 23, Object.keys(dates5), dates5);
  ok(p.days.map(d => d.n).join(",") === "6,7,8,9,10", "Mon–Fri = Day 6..10", p.days.map(d => d.n).join(","));
  ok(p.ans.map(a => a.page).join(",") === "197,198", "key pages 197 (6–8) + 198 (8 continues, 9–10)", p.ans.map(a => a.page).join(","));
  ok(p.cursor.week === 23 && p.cursor.day === 6 && p.cursor.adv === 5, "cursor {23,6,5}", JSON.stringify(p.cursor));
  ok(p.warnings.length === 0, "no warnings");
  const p4 = dgWeekPlan(book({ cursor: { week: 23, day: 1, adv: 5 } }), 23, Object.keys(dates4), dates4);
  ok(p4.days.length === 4 && p4.cursor.adv === 4, "4-day week → 4 pages, adv 4");
  ok(p4.ans.map(a => a.page).join(",") === "197", "Days 1–4 need only page 197", p4.ans.map(a => a.page).join(","));
  const pe = dgWeekPlan(book({ cursor: { week: 23, day: 10, adv: 5 } }), 23, Object.keys(dates5), dates5);
  ok(pe.days.map(d => d.n).join(",") === "10,11,12", "past the end: only Days 10–12 print", pe.days.map(d => d.n).join(","));
  ok(pe.warnings.length === 1 && /last page/.test(pe.warnings[0]), "…with a warning", pe.warnings.join(" | "));
  const pm = dgWeekPlan(book({ cursor: { week: 23, day: 1, adv: 5 }, missingDay: 3 }), 23, Object.keys(dates5), dates5);
  ok(pm.days[2].url === "" && /Day 3/.test(pm.warnings[0]), "missing page image → placeholder + warning");
  ok(dgWeekPlan(null, 23, Object.keys(dates5), dates5) === null, "no book → no plan");
}

console.log("3) Ellis — pages in the notebook + keys in the parent book");
{
  const off = NB.generate("ellis", ctxFor("ellis", 23, dates5, null));
  const on = NB.generate("ellis", ctxFor("ellis", 23, dates5, book({ cursor: { week: 23, day: 6, adv: 5 } })));
  const pagesOff = count(off.student, /<div class="page"/g), pagesOn = count(on.student, /<div class="page"/g);
  ok(pagesOn === pagesOff + 5, "student book gains exactly 5 pages", pagesOff + " → " + pagesOn);
  ok(count(on.student, /Daily Grams Grade 4 — Day \d+/g) === 5, "one Daily Grams page per school day");
  for (let d = 6; d <= 10; d++) ok(on.student.indexOf("base64,DAY" + d) > 0, "Day " + d + " image embedded");
  // order: the Daily Grams page sits right behind that day's daily page, before the brain break
  const iDaily = on.student.indexOf("DAILY PAGE: MONDAY"), iDg = on.student.indexOf("Daily Grams Grade 4 — Day 6"), iBb = on.student.indexOf("base64,DAY6");
  const iNext = on.student.indexOf("DAILY PAGE: TUESDAY");
  ok(iDaily < iDg && iDg < iNext, "Monday's Daily Grams page comes after Monday's daily page and before Tuesday's");
  ok(off.dailyGramsCursor === undefined, "off → no cursor returned");
  ok(on.dailyGramsCursor && on.dailyGramsCursor.day === 6, "on → cursor returned for the app to store");
  const keysOff = count(off.parent, /<div class="page"/g), keysOn = count(on.parent, /<div class="page"/g);
  ok(keysOn === keysOff + 2, "parent book gains the 2 key pages", keysOff + " → " + keysOn);
  ok(on.parent.indexOf("base64,ANS197") > 0 && on.parent.indexOf("base64,ANS198") > 0, "both key page images embedded");
  ok(/Answer key · Days 1–8/.test(on.parent) && /Answer key · Days 9–12/.test(on.parent), "key strips name the Days they hold");
  ok(/this week: Day 6–10/.test(on.parent), "key strip names this week's Days");
  ok(on.student.indexOf("ANS197") < 0, "no answer key in the student book");
  ok(!/Parent only/.test(on.student) && /Parent only/.test(on.parent), "parent-only badge only on the key pages");
}

console.log("4) Lincoln — same behavior in his shell");
{
  const off = NB.generate("lincoln", ctxFor("lincoln", 23, dates4, null));
  const on = NB.generate("lincoln", ctxFor("lincoln", 23, dates4, book({ cursor: { week: 23, day: 1, adv: 5 } })));
  ok(count(on.student, /<div class="page"/g) === count(off.student, /<div class="page"/g) + 4, "4-day week → 4 pages added");
  ok(count(on.parent, /<div class="page"/g) === count(off.parent, /<div class="page"/g) + 1, "parent gains 1 key page (Days 1–4 all on 197)");
  ok(on.dailyGramsCursor && on.dailyGramsCursor.adv === 4, "cursor adv = 4 for the short week");
  const iDaily = on.student.indexOf("Daily Page — Monday"), iDg = on.student.indexOf("Daily Grams Grade 4 — Day 1 · Monday"), iTue = on.student.indexOf("Daily Page — Tuesday");
  ok(iDaily < iDg && iDg < iTue, "Daily Grams page rides behind Monday's daily page");
  // the padding lives INSIDE the page (his shell forces .page padding:0), so the image never bleeds
  ok(/<div class="page" style="background:#fff;"><div style="flex:1;min-height:0;display:flex;flex-direction:column;padding:0\.25in/.test(on.student), "inner wrapper carries the padding");
}

console.log("5) combined parent packet carries the key pages too");
{
  const html = NB.combinedParent({ ellis: ctxFor("ellis", 23, dates5, book({ cursor: { week: 23, day: 6, adv: 5 } })) });
  ok(html.indexOf("base64,ANS197") > 0, "Ellis's key page is in the combined packet");
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);

// ── start week (2026-09-21): an earlier week prints no Daily Grams pages and hands back no cursor ──
(function(){
  const fs=require("fs");const w={};(new Function("window","document",fs.readFileSync("notebooks.js","utf8")))(w,{});const H=w.HoweNotebooks;
  let p=0,f=0;const ok=(c,m)=>{c?p++:(f++,console.log("FAIL",m));};
  const LIVE={week:24,day:2,adv:5};                                  // the shape stored live tonight (no `from`)
  ok(H.dgStart(LIVE,23,180)===0&&H.dgStart(LIVE,24,180)===2&&H.dgStart(LIVE,25,180)===7,"dgStart: wk23 → 0 (before), wk24 → 2, wk25 → 7");
  ok(H.dgStart({week:26,day:11,adv:5,from:24},24,180)===1&&H.dgStart({week:26,day:11,adv:5,from:24},23,180)===0,"stored from: walk back to the start week works, one earlier is before");
  ok(H.dgStart({week:30,day:32,adv:5},24,180)===2&&H.dgStart({week:30,day:32,adv:5},23,180)===0,"old cursor without from: start week worked out (30 − 6 = 24)");
  const dg={book:"b",title:"DG",total:180,cursor:LIVE,ansMeta:{},dayAns:{},pages:{day:{},ans:{}}};
  const days=["monday","tuesday","wednesday","thursday","friday"];
  ok(H._internal.dgWeekPlan(dg,23,days,{})===null,"week before the start → no plan (no pages, no cursor)");
  const p24=H._internal.dgWeekPlan(dg,24,days,{});ok(p24&&p24.start===2&&JSON.stringify(p24.cursor)===JSON.stringify({week:24,day:2,adv:5,from:24}),"week 24 → Days 2–6, cursor now carries from:24");
  const p25=H._internal.dgWeekPlan(Object.assign({},dg,{cursor:p24.cursor}),25,days,{});ok(p25.start===7&&p25.cursor.from===24,"week 25 continues at Day 7, start week kept");
  ok(H._internal.dgWeekPlan(Object.assign({},dg,{cursor:{week:23,day:1,adv:5,from:23}}),23,days,{}).start===1,"Mom can still start an earlier week on purpose (from moves back)");
  console.log("\n[start week] "+p+" passed, "+f+" failed");if(f)process.exit(1);
})();
