/*
 * Node tests — 🖨 PDTODAY: which drill the paper-drill button prints (her rule 2026-11-02). Today's drill not done yet
 * (and today is a school day) → today's drill; today's drill done (saved in the app, graded from paper, or its paper is
 * waiting to be graded) or no school today → the next school day's. "Done" comes from the day's drill record, never
 * from the due list (learning cards stay due all day). Runs the REAL PAPERDRILL block with the REAL drill clock.
 *   run:  node test_paper_drill_today.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const cut = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error("markers " + a); return src.slice(i, j); };
function slice(name) { const i = src.indexOf("function " + name + "("); if (i < 0) throw new Error("missing " + name);
  let d = 0; for (let k = src.indexOf("{", i); k < src.length; k++) { if (src[k] === "{") d++; else if (src[k] === "}") { d--; if (!d) return src.slice(i, k + 1); } } }
const CODE = 'const MAST_CLOCK_EPOCH="2026-01-01"; let _mastClockMemo={};\n' + ["getSchoolDays", "mastKidSchoolDows", "mastSchoolDayNum", "mastShuffleDeck"].map(slice).join("\n")
  + "\n" + cut("// PAPERDRILL_START", "// PAPERDRILL_END");

let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x) : "")); } };

const KID = "kid1";
const ITEMS = [{ id: "a", prompt: "7×8", subject: "Math Facts" }, { id: "b", prompt: "A", subject: "Letters", status: "introduction", tally_dots: 0 }];
function world(o) {
  o = o || {};
  const writes = [], toasts = [], opened = [], dueCalls = [];
  const ctx = { console, JSON, Object, Array, String, Number, Math, Set, Map, RegExp, Date, parseInt, isNaN,
    masteryKid: "other", calendarData: o.cal || {}, paceData: {}, today: o.today || "2026-11-03",
    masteryData: { [KID]: ITEMS, [KID + "_settings"]: { definitions: { "7×8": "56" } }, history: { [KID]: o.hist || {} }, [KID + "_paperDrills"]: o.recs || {} },
    momHere: () => true, _dryRun: () => false,
    db: { ref: p => ({ set: v => writes.push([p, v]), update() {} }) },
    gwShowToast: m => toasts.push(m), SL_KLBL: { [KID]: "Kid One" }, HA_LS: { setItem() {} },
    mastGetCatMode: () => "flip", mastGetDef: (k, p) => p === "7×8" ? "56" : "", owRuleBack: () => "", mastGetVisual: () => null, mastCatFace: () => "name",
    mastDueItems: (k, pn) => { dueCalls.push(pn); return o.due ? o.due(pn) : ITEMS.slice(); },
    window: { open: () => { const w = { document: { write: h => { w.html = h; }, close() {} }, print() {} }; opened.push(w); return w; } } };
  ctx.calToday = () => ctx.today;
  vm.createContext(ctx);
  vm.runInContext(CODE, ctx);
  return { ctx, writes, toasts, opened, dueCalls };
}

console.log("── which day the button prints ──");
{
  const w = world();
  const d = w.ctx.pdPrintDay(KID);
  ok("Tuesday, today's drill not done → today's drill", d.iso === "2026-11-03" && d.today === true && d.pn === w.ctx.mastSchoolDayNum(KID, "2026-11-03"), d);
  ok("…the button says “Print today’s drill”", /🖨 Print today’s drill on paper</.test(w.ctx.pdButtonHtml(KID)) && !/Print next drill/.test(w.ctx.pdButtonHtml(KID)));
  w.ctx.pdPrintNext(KID);
  ok("…it prints today's cards (today's school-day number) and saves the paper under today", w.dueCalls[0] === d.pn && w.writes.length === 1 && w.writes[0][0] === "mastery/" + KID + "_paperDrills/20261103" && w.writes[0][1].pn === d.pn);
  ok("…and a reprint still offers today's", /Print today’s drill on paper \(printed — reprint\)/.test(w.ctx.pdButtonHtml(KID)));
}
{
  const w = world({ hist: { "20261103": { items: [] } } });
  const d = w.ctx.pdPrintDay(KID);
  ok("today's drill saved → the next school day (Wednesday)", d.iso === "2026-11-04" && !d.today, d);
  ok("…the button says “Print next drill · Wed, Nov 4”", /🖨 Print next drill on paper · Wed, Nov 4</.test(w.ctx.pdButtonHtml(KID)));
}
{
  const w = world({ recs: { "20261103": { date: "2026-11-03", pn: 1, ids: ["a"], state: "pending" } } });
  ok("today's drill done on paper, waiting for Mom to grade → the next drill", w.ctx.pdPrintDay(KID).iso === "2026-11-04");
}
{
  const w = world({ recs: { "20261103": { date: "2026-11-03", pn: 1, ids: ["a"], state: "printed" } } });
  ok("today's paper printed but not done yet → still today's (a reprint)", w.ctx.pdPrintDay(KID).today === true);
}
{
  const w = world({ today: "2026-11-07" });
  ok("Saturday (no school) → Monday's drill", w.ctx.pdPrintDay(KID).iso === "2026-11-09" && !w.ctx.pdPrintDay(KID).today);
  const h = world({ cal: { holidays: { a: { start: "2026-11-03" } } } });
  ok("a holiday today → the next school day", h.ctx.pdPrintDay(KID).iso === "2026-11-04");
}
{
  const w = world({ due: () => [] });
  w.ctx.pdPrintNext(KID);
  ok("nothing in today's drill → a toast about today, no print, no record", !w.opened.length && !w.writes.length && /today/.test(w.toasts[0]));
}
{
  const w = world({ due: pn => pn === 999 ? [] : ITEMS.slice() });
  ok("learning cards still due after the drill don't make it “not done” — only the drill record counts",
    /function pdPrintDay[\s\S]*?_pdLogged\(kid,key\)/.test(src) && !/function pdPrintDay[^]*?mastDueItems[^]*?function pdPrintNext/.test(src));
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
