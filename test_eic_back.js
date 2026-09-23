/*
 * ✏️ ↩ 💾 Editor in Chief "back to today's page" + workbook autosave (her yes 2026-09-23, "yes all").
 * Live 9/23: Ellis's EIC card was hand-checked at 10:14 → the "Open today's page" row vanished and
 * there was no way back to the page; and pen marks only saved on ✕, so a reload lost the page.
 *   run:  node test_eic_back.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
let pass = 0, fail = 0;
function ok(n, c, x) { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x) + ")" : "")); } }

// ── 💾 autosave ──
const a = src.indexOf("// 💾 AUTOSAVE"), b = src.indexOf("// ── Mom's panel: add a book");
if (a < 0 || b < 0) { console.error("AUTOSAVE block not found"); process.exit(1); }
const AB = src.slice(a, b);
function wbWorld(o) {
  o = o || {};
  const timers = [], saves = [], alerts = [];
  let pendingResolve = null;
  const ctx = {
    wbView: { kid: "ellis", bookId: "bk", page: 5, strokes: [], dirty: false },
    db: { ref: p => ({ set: v => { saves.push([p, JSON.parse(JSON.stringify(v.s))]); return o.hold ? new Promise(r => { pendingResolve = r; }) : (o.failSave ? Promise.reject(new Error("offline")) : Promise.resolve()); } }) },
    _dryRun: () => false, wbInkPath: (k, bk, p) => "wbInk/" + k + "/" + bk + "/" + p, wbBarRender: () => {}, dbg: () => {},
    alert: m => alerts.push(m),
    setTimeout: (fn, ms) => { timers.push({ fn, ms, live: true }); return timers.length; },
    clearTimeout: id => { if (id && timers[id - 1]) timers[id - 1].live = false; },
    Date, JSON, Promise,
  };
  vm.createContext(ctx); vm.runInContext(AB, ctx);
  const fire = () => { const t = timers.filter(t => t.live).pop(); if (!t) return false; t.live = false; t.fn(); return true; };
  return { ctx, timers, saves, alerts, fire, resolve: () => pendingResolve && pendingResolve(), call: e => vm.runInContext(e, ctx) };
}
const flush = () => new Promise(r => setImmediate(r));
(async () => {
console.log("── 💾 writing saves itself ──");
{
  const w = wbWorld();
  w.ctx.wbView.strokes.push({ p: [[0.1, 0.1]] }); w.call("wbMarkDirty(wbView)");
  ok("a stroke schedules a save 3s later", w.timers.filter(t => t.live).length === 1 && w.timers[0].ms === 3000);
  w.ctx.wbView.strokes.push({ p: [[0.2, 0.2]] }); w.call("wbMarkDirty(wbView)");
  ok("more writing pushes the save back (one pending, not two)", w.timers.filter(t => t.live).length === 1);
  w.fire(); await flush();
  ok("the page saves with both strokes, no ✕ needed", w.saves.length === 1 && w.saves[0][0] === "wbInk/ellis/bk/5" && w.saves[0][1].length === 2);
  ok("…and is clean afterwards", w.ctx.wbView.dirty === false);
}
{
  const w = wbWorld();
  w.ctx.wbView._live = { p: [] }; w.ctx.wbView.strokes.push(w.ctx.wbView._live); w.call("wbMarkDirty(wbView)");
  w.fire(); await flush();
  ok("mid-stroke (pen still down) → waits instead of saving half a stroke", w.saves.length === 0 && w.timers.filter(t => t.live).length === 1);
  w.ctx.wbView._live = null; w.fire(); await flush();
  ok("…then saves once the pen lifts", w.saves.length === 1);
}
{
  const w = wbWorld({ hold: true });
  w.ctx.wbView.strokes.push({ p: [] }); w.call("wbMarkDirty(wbView)");
  w.fire();                                              // save in flight…
  w.ctx.wbView.strokes.push({ p: [] }); w.call("wbMarkDirty(wbView)");   // …he keeps writing
  w.resolve(); await flush();
  ok("writing during a save keeps the page dirty — nothing is dropped", w.ctx.wbView.dirty === true && w.timers.filter(t => t.live).length === 1);
  w.fire(); w.resolve(); await flush();
  ok("…and the next save carries the new stroke", w.saves.length === 2 && w.saves[1][1].length === 2);
}
{
  const w = wbWorld({ failSave: true });
  w.ctx.wbView.strokes.push({ p: [] }); w.call("wbMarkDirty(wbView)");
  w.fire(); await flush();
  ok("an autosave that fails is quiet (no pop-up mid-work) and stays dirty for ✕ to retry", w.alerts.length === 0 && w.ctx.wbView.dirty === true);
  await w.call("wbSave()").catch(() => {}); await flush();
  ok("a hand save still tells you when it fails", w.alerts.length === 1);
}
ok("every place that changes the page marks it for autosave",
  /wbView\.strokes\.push\(wbView\._live\); wbMarkDirty\(wbView\);/.test(src) &&
  /if\(wbView\._live\)\{ wbView\._live=null; wbMarkDirty\(wbView\);/.test(src) &&
  /if\(v\.strokes\.length!==before\)\{ wbMarkDirty\(v\);/.test(src) &&
  /v\.strokes\.pop\(\); wbMarkDirty\(v\);/.test(src) && /v\.strokes=\[\]; wbMarkDirty\(v\);/.test(src) &&
  (src.match(/\.dirty=true/g) || []).length === 1);   // only wbMarkDirty itself sets it
ok("✕ cancels the pending autosave (the close saves it)", /function wbClose\(\)\{\n  clearTimeout\(_wbAutoT\); _wbAutoT=null;/.test(src));

// ── ✏️ ↩ back to today's page ──
console.log("\n── ✏️ back to today's page ──");
function eicWorld(o) {
  o = o || {};
  const tree = o.tree || {}, opened = [], toasts = [], writes = [];
  const get = p => p.split("/").reduce((x, k) => (x == null ? null : (x[k] === undefined ? null : x[k])), tree);
  const sb = { window: {}, console, Date, JSON, Promise, String, Number, Math, Object, Array, RegExp, setTimeout,
    HA_LS: { getItem: () => null, setItem: () => {} },
    db: { ref: p => ({ once: () => Promise.resolve({ val: () => get(p) }), set: v => { writes.push([p, v]); return Promise.resolve(); }, push: () => ({ key: "x", set: () => Promise.resolve() }) }) },
    _dryRun: () => false, gwShowToast: m => toasts.push(m), wbMomEyes: () => !!o.mom,
    wbList: () => [{ id: "w1", name: "Editor in Chief Beginning 1", pages: 120 }],
    wbOpen: (id, kid, pg, opts) => opened.push([id, kid]),
    document: { getElementById: () => null, createElement: () => ({ style: {} }), body: { appendChild: () => {} } } };
  sb.window.window = sb.window; vm.createContext(sb);
  vm.runInContext("var window=this.window;" + fs.readFileSync(path.join(__dirname, "eic.js"), "utf8"), sb);
  return { sb, opened, toasts, writes, W: sb.window };
}
const d = new Date(), today = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
{
  const w = eicWorld({ tree: { eic: { ellis: { today: { date: today, book: "editor-in-chief-beginning-1", page: 12 } } } } });
  ok("eic.js exposes eicReopenToday", typeof w.W.eicReopenToday === "function");
  w.W.eicReopenToday("ellis"); for (let i = 0; i < 6; i++) await flush();
  ok("today's page reopens for Ellis, even after the card is checked", w.opened.length === 1 && w.opened[0][0] === "w1" && w.opened[0][1] === "ellis", w.opened);
}
{
  const w = eicWorld({ tree: { eic: { ellis: { today: { date: "2026-01-02", book: "editor-in-chief-beginning-1", page: 12 } } } } });
  w.W.eicReopenToday("ellis"); for (let i = 0; i < 6; i++) await flush();
  ok("yesterday's page is never reopened as today's", w.opened.length === 0 && /No Editor in Chief page was opened today/.test(w.toasts.join("|")), w.toasts);
}
ok("the doorway remembers the page it opens", /rememberToday\(kid,n\.book,n\.page\); openPage\(n\.book,n\.page\);/.test(fs.readFileSync(path.join(__dirname, "eic.js"), "utf8")));
ok("a checked EIC card of TODAY shows ↩ Back to today's page", /:\(_eicL&&done&&effectiveDay\(t\)===_todayDay\)\?'<div style="margin-top:5px"><span onclick="event\.stopPropagation\(\);eicReopenTodayFor\(/.test(src));
ok("an open card still shows Open today's page", /const eicRow=\(_eicL&&!done\)\?/.test(src));

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
})();
