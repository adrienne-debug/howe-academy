/*
 * 🔑 Editor in Chief card → answer key on Mom's device (her yes 2026-10-07).
 * 10/5: Ellis's card opened Beg 1 p 2 for Mom with the rule sheet beside it — no answer key, so she
 * couldn't grade from the schedule. Only the ✅ chip in Mom HQ ▸ Editor in Chief opened page + key.
 * Now both card doorways (▶ Open today's page, ↩ Back to today's page) open page + key + 📊 Score on
 * Mom's device. A kid's device is unchanged: his page with its rule sheet, never a key.
 *   run:  node test_eic_card_key.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
let pass = 0, fail = 0;
function ok(n, c, x) { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x) + ")" : "")); } }
const flush = () => new Promise(r => setImmediate(r));
const d = new Date(), today = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
const BK = "editor-in-chief-beginning-1";
// Shaped like the live tags (10/5): Beg 1 offset 5; p 2 = Lesson 1 capitalization, paragraphs 1–3; n1's key on p 68.
function tagsTree(o) {
  o = o || {};
  const paragraphs = { n1: { page: 2, title: "Never Forget" }, n2: { page: 2 }, n3: { page: 2 } };
  if (!o.noKey) { paragraphs.n1.keyPage = 68; paragraphs.n2.keyPage = 68; paragraphs.n3.keyPage = 69; }
  return { [BK]: { title: "Editor in Chief Beginning 1", pdfPageOffset: 5,
    skills: { capitalization: { name: "Capitalization", rulePages: [1], exercisePages: [2, 3] } },
    pages: { p1: { role: "rules", skill: "capitalization" }, p2: { role: "exercise", skill: "capitalization", paragraphs: [1, 2, 3], unit: "Lesson 1" },
             p3: { role: "exercise", skill: "capitalization", paragraphs: [] } },
    paragraphs } };
}
function world(o) {
  o = o || {};
  const tree = { library: { tags: tagsTree(o) }, eic: { ellis: o.todayRec ? { today: o.todayRec } : {} } };
  const get = p => p.split("/").reduce((x, k) => (x == null ? null : (x[k] === undefined ? null : x[k])), tree);
  const opened = [], toasts = [], writes = [];
  const sb = { window: {}, console, Date, JSON, Promise, String, Number, Math, Object, Array, RegExp, setTimeout, parseInt, isFinite,
    HA_LS: { getItem: () => null, setItem: () => {} },
    db: { ref: p => ({ once: () => Promise.resolve({ val: () => get(p) }), set: v => { writes.push([p, v]); return Promise.resolve(); } }) },
    _dryRun: () => false, gwShowToast: m => toasts.push(m), wbMomEyes: () => !!o.mom,
    wbList: () => [{ id: "w1", name: "Editor in Chief Beginning 1", pages: 120 }],
    wbOpen: (id, kid, pg, opts) => opened.push({ id, kid, pg, opts: JSON.parse(JSON.stringify(opts || {})) }),
    document: { getElementById: () => null, createElement: () => ({ style: {} }), body: { appendChild: () => {} } } };
  sb.window.window = sb.window; vm.createContext(sb);
  vm.runInContext("var window=this.window;" + fs.readFileSync(path.join(__dirname, "eic.js"), "utf8"), sb);
  return { W: sb.window, opened, toasts, writes };
}
const settle = async () => { for (let i = 0; i < 8; i++) await flush(); };

(async () => {
console.log("── ▶ Open today's page (the open card) ──");
{
  const w = world({ mom: true }); w.W.eicOpenNext("ellis"); await settle();
  const o = w.opened[0] || {};
  ok("Mom: opens Ellis's next page (Beg 1 p 2 = PDF p 7)", w.opened.length === 1 && o.id === "w1" && o.kid === "ellis" && o.pg === 7, w.opened);
  ok("Mom: the ANSWER KEY sits beside it (key p 68 = PDF p 73)", o.opts && o.opts.ans === 73, o.opts);
  ok("Mom: it is the EIC view, so 📊 Score shows", o.opts && o.opts.eic && o.opts.eic.book === BK, o.opts);
  ok("Mom: check view is page + key only (no rule sheet)", o.opts && !o.opts.rules, o.opts);
  ok("today's page is still remembered (↩ Back to today's page)", w.writes.some(([p, v]) => p === "eic/ellis/today" && v.book === BK && v.page === 2 && v.date === today), w.writes);
}
{
  const w = world({ mom: false }); w.W.eicOpenNext("ellis"); await settle();
  const o = w.opened[0] || {};
  ok("kid: opens the same page", w.opened.length === 1 && o.pg === 7, w.opened);
  ok("kid: NO answer key", o.opts && !o.opts.ans, o.opts);
  ok("kid: the rule sheet sits beside it, as before (rule p 1 = PDF p 6)", o.opts && JSON.stringify(o.opts.rules) === "[6]", o.opts);
}
console.log("\n── ↩ Back to today's page (the checked card) ──");
const rec = { date: today, book: BK, page: 2, ts: 1 };
{
  const w = world({ mom: true, todayRec: rec }); w.W.eicReopenToday("ellis"); await settle();
  const o = w.opened[0] || {};
  ok("Mom: today's page reopens with the answer key beside it", w.opened.length === 1 && o.pg === 7 && o.opts.ans === 73 && o.opts.eic && o.opts.eic.book === BK, w.opened);
}
{
  const w = world({ mom: false, todayRec: rec }); w.W.eicReopenToday("ellis"); await settle();
  const o = w.opened[0] || {};
  ok("kid: today's page reopens with the rule sheet, no key", w.opened.length === 1 && o.pg === 7 && !o.opts.ans && JSON.stringify(o.opts.rules) === "[6]", w.opened);
}
{
  const w = world({ mom: true, todayRec: { date: "2026-01-02", book: BK, page: 2 } }); w.W.eicReopenToday("ellis"); await settle();
  ok("Mom: yesterday's page still never reopens as today's", w.opened.length === 0, w.opened);
}
console.log("\n── a page with no key tagged ──");
{
  const w = world({ mom: true, noKey: true, todayRec: rec }); w.W.eicReopenToday("ellis"); await settle();
  const o = w.opened[0] || {};
  ok("Mom: no key page → opens as before (rule sheet), never an empty key pane", w.opened.length === 1 && !o.opts.ans && JSON.stringify(o.opts.rules) === "[6]", w.opened);
}
console.log("\n── the ✅ chip and the viewer are untouched ──");
{
  const w = world({ mom: true }); await w.W.eicPanel && null;
  w.W.eicOpenNext("ellis"); await settle(); w.opened.length = 0;
  w.W.eicCheck(BK, 2);
  ok("✅ chip still opens page + key exactly as the card now does", w.opened.length === 1 && w.opened[0].pg === 7 && w.opened[0].opts.ans === 73, w.opened);
}
{
  const w = world({ mom: false }); w.W.eicOpenNext("ellis"); await settle(); w.opened.length = 0;
  w.W.eicCheck(BK, 2);
  ok("✅ check is still refused on a kid's device", w.opened.length === 0, w.opened);
}
const html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
ok("the viewer still drops any key on a device that isn't Mom's (second gate)", /if\(!\(ans>=1&&ans<=\(b\.pages\|\|1\)\)\|\|!wbMomEyes\(\)\) ans=0;/.test(html));
ok("📊 Score still shows only for Mom's eyes", /\(\(v\.eic&&wbMomEyes\(\)&&window\.eicScoreOpen\)\?btn\("📊 Score","eicScoreOpen\(\)"\):""\)/.test(html));

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
})();
