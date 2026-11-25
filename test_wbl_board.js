// ✍️ WBLBOARD — the whiteboard from a linked book's side strip (Adrienne's yes 2026-11-24: "a whiteboard chip on the side strip so
//   she can reach the board from the manual"). Runs the REAL viewer (wbOpen, bar, load, save, autosave, close, card chip) + WBOARD,
//   WBDLINES, WBDSAVE, WBDKID, WBLINK and WBLBOARD on a fake DOM / db.
//   · the chip shows on every page of a linked book (read / toc / links / a wblRet) and never on a scratch, 🖨, EIC, key or rules view
//   · a plain book is byte-identical to the tree without the feature: no strip, no wrapper, the same bar and the same db calls
//   · a tap saves the ink first, stops the autosave, stores a reading book's place, stops the book's fit observer, opens the board
//   · wbdOpen still refuses Today's door (and any forged token) while a book is open
//   · the board's bar: ↩ Back to <book> · p. N, Blank / Grid / Lines and the tools, no ✕, no Save (Mom or kid)
//   · Back restores book, page, opts, the card's banner and the book's own wblRet
//   · the drawing (strokes, background, shape) survives a trip, 🧽 Clear empties it, the book's ✕ drops it; Today's board is fresh
//   · the board writes nothing; dry run writes nothing at all
//   run: node test_wbl_board.js
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const cut = (s, a, b) => { const i = s.indexOf(a), j = s.indexOf(b, i); if (i < 0 || j < 0) throw new Error("markers " + a); return s.slice(i, j + b.length); };
const fnOf = (s, name) => { let i = s.indexOf("\nfunction " + name + "("); if (i < 0) { i = s.indexOf("\nasync function " + name + "("); if (i < 0) throw new Error("no " + name); } i++;
  const k = s.indexOf("\n", i), l = s.slice(i, k), n = c => l.split(c).length;   // a one-line function ends on its own line
  return n("{") === n("}") ? l : s.slice(i, s.indexOf("\n}", i) + 2); };
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x) : "")); } };
const BLK = cut(src, "// WBLBOARD_START", "// WBLBOARD_END");
const CODE = BLK.replace(/^\s*\/\/.*$/gm, "");

// ── the tree minus the feature: the block out, each call site back to the line it replaced (each must match exactly once) ──
const SITES = [
  ['  if(typeof wbView!=="undefined"&&wbView&&!wbView.scratch&&!(typeof wblbPass==="function"&&wblbPass(opts))) return false;   // a workbook page is open — never wipe it (WBLBOARD: but the strip\'s chip)\n',
   '  if(typeof wbView!=="undefined"&&wbView&&!wbView.scratch) return false;   // a workbook page is open — never wipe it\n'],
  ['  if(v.wblb&&typeof wblbBarHTML==="function") return wblbBarHTML(v,btn);   // WBLBOARD: ↩ Back to the book, no ✕\n', ""],
  ['  if(wbView&&!wbView.scratch&&typeof wblbDrop==="function") wblbDrop();   // WBLBOARD: the book\'s ✕ drops its board\n', ""],
  ['  const L=wblLinks(b,v.page), r=v.wblRet, wd=typeof wblbShow==="function"&&wblbShow(v); let el=document.getElementById("wb-link");   // WBLBOARD: wd = the ✍️ chip\n  if(!L.length&&!r&&!wd){',
   '  const L=wblLinks(b,v.page), r=v.wblRet; let el=document.getElementById("wb-link");\n  if(!L.length&&!r){'],
  ['.join("")+\n    (wd?\'<button onclick="wblbOpen()">✍️ Whiteboard</button>\':"");   // WBLBOARD\n}', '.join("");\n}']];
let BASE = src; const sitesOnce = [];
sitesOnce.push(BASE.split(BLK + "\n").length === 2); BASE = BASE.replace(BLK + "\n", "");
SITES.forEach(([a, b]) => { sitesOnce.push(BASE.split(a).length === 2); BASE = BASE.split(a).join(b); });

const FNS = ["esc", "uascIs", "wbBook", "wbInkPath", "wbPageFor", "wbMomEyes", "wbTaskLink", "wbOpenFor", "wbAssignFor", "wbAssignLast", "wbAssignClean", "wbAssignRender", "wbGoAssign",
  "wbOpen", "wbClose", "wbBarRender", "wbTool", "wbTogglePen", "wbGo", "wbLoadPage", "wbFit", "wbWatchFit", "wbPaint", "wbUndo", "wbClear", "wbMarkDirty", "wbAutoSaveSoon", "wbSave"];
const BLOCKS = [["// WBOARD_START", "// WBOARD_END"], ["// WBDLINES_START", "// WBDLINES_END"], ["// WBDSAVE_START", "// WBDSAVE_END"], ["// WBDKID_START", "// WBDKID_END"], ["// WBLINK_START", "// WBLINK_END"]];

const PR = "uact~u1~a1";   // a 🖨 printable's book id (it even has a toc here — still no chip)
const BOOKS = () => ({
  man: { id: "man", name: "Logic of English Foundations A Teacher's Manual", pages: 245, read: true, imgs: { 64: "m64", 69: "m69" },
    toc: { offset: 5, sec: { lesson_20: 60, lesson_21: 64, review_d: 70, lesson_22: 74 } },
    links: { 69: [{ b: "wb", p: 71, t: "Phonogram page" }, { b: "rd", p: 10, t: "Reader 3" }] } },
  wb: { id: "wb", name: "Logic of English Foundations A Student Workbook", pages: 231, imgs: { 71: "w71", 72: "w72" }, toc: { offset: 4 },
    links: { 71: [{ b: "man", p: 69, t: "Lesson 21" }] } },
  rd: { id: "rd", name: "Team Readers", pages: 130, read: true, toc: { offset: 2 } },
  tc: { id: "tc", name: "Spelling Lists", pages: 40, toc: { offset: 1 } },               // toc only
  lk: { id: "lk", name: "Phonics Cards", pages: 40, links: { 3: [{ b: "pl", p: 5, t: "Plain" }] } },   // links only
  pl: { id: "pl", name: "Reading Detective", pages: 193, imgs: { 5: "p5", 25: "p25" } }    // a plain book: none of read / toc / links
});

function world(o) {
  o = o || {}; const reg = {}, ops = [], timers = [], ls = Object.assign({}, o.ls || {}), alerts = [], ros = [], eicCalls = [];
  const unreg = el => { if (el.id && reg[el.id] === el) delete reg[el.id]; (el.children || []).forEach(unreg); };
  const make = (id) => {
    const el = { id: id || "", style: {}, attrs: {}, children: [], parentNode: null, _html: "", textContent: "", width: 0, height: 0,
      setAttribute(k, v) { this.attrs[k] = v; },
      appendChild(c) { if (c.parentNode) c.parentNode.children = c.parentNode.children.filter(x => x !== c); c.parentNode = this; this.children.push(c); const r = e => { if (e.id) reg[e.id] = e; e.children.forEach(r); }; if (this.id && reg[this.id] === this || this === body) r(c); return c; },
      insertBefore(c, ref) { if (c.parentNode) c.parentNode.children = c.parentNode.children.filter(x => x !== c); c.parentNode = this; const i = this.children.indexOf(ref); this.children.splice(i < 0 ? this.children.length : i, 0, c); if (c.id) reg[c.id] = c; return c; },
      remove() { if (this.parentNode) this.parentNode.children = this.parentNode.children.filter(x => x !== this); unreg(this); this.parentNode = null; },
      insertAdjacentHTML() {},
      getBoundingClientRect() { return this.id === "wbd-stage" ? { left: 0, top: 50, width: 1000, height: 700 } : { width: 0, height: 0 }; },
      getContext() { return new Proxy({}, { get: () => () => {} }); } };
    Object.defineProperty(el, "innerHTML", { get() { return this._html; }, set(h) { this._html = h; this.children.forEach(unreg); this.children = []; const re = /id="([^"]+)"/g; let m; while ((m = re.exec(h))) { const c = make(m[1]); c.parentNode = this; this.children.push(c); reg[m[1]] = c; } } });
    return el;
  };
  const body = make("body");
  const ctx = { console, JSON, Object, Array, String, Number, Math, Promise, Error, Date, parseInt, parseFloat, setImmediate, Proxy,
    wbBooks: BOOKS(), WB_PEN: "#1d4ed8", WB_MOMPEN: "#dc2626",
    momHere: () => !!o.mom, adminPinUnlocked: false, _dryRun: () => !!o.dry, alert: m => alerts.push(m), confirm: () => true, dbg: () => {}, SL_KCOL: {}, SL_KLBL: {},
    _todayDay: "monday", DAY_LBL: { monday: "Monday" }, uxDocAdd: () => true,
    uascBook: () => ({ id: PR, name: "Printable", pages: 2, imgs: {}, toc: { offset: 0 } }), uascInkPath: (k, b, p) => "unitWork/" + k + "/" + p,
    uascBarHTML: (v, btn) => btn("✕", "uascClose()") + "printable", uascSave: () => { ops.push(["uascSave"]); },
    HA_LS: { getItem: k => (k in ls ? ls[k] : null), setItem: (k, v) => { ls[k] = String(v); ops.push(["ls", k]); }, removeItem: k => { delete ls[k]; } },
    db: o.nodb ? null : { ref: p => ({
      once: () => { ops.push(["read", p]); return Promise.resolve({ val: () => null }); },
      set: v => { ops.push(["set", p, JSON.parse(JSON.stringify(v)), ctx.wbView && ctx.wbView.bookId, ctx.wbView && ctx.wbView.page, !!(ctx.wbView && ctx.wbView.scratch)]); return Promise.resolve(); },
      update: v => { ops.push(["update", p]); return Promise.resolve(); }, remove: () => { ops.push(["remove", p]); return Promise.resolve(); } }) },
    ResizeObserver: function (cb) { const r = { el: null, off: false }; ros.push(r); this.observe = el => { r.el = el; }; this.disconnect = () => { r.off = true; }; },
    setTimeout: (f, ms) => { timers.push({ f, ms, live: true }); return timers.length; }, clearTimeout: i => { if (i && timers[i - 1]) timers[i - 1].live = false; },
    document: { getElementById: id => reg[id] || null, createElement: () => make(""), body, addEventListener() {} },
    window: { addEventListener() {}, eicPanel: k => eicCalls.push(k), devicePixelRatio: 1 } };
  vm.createContext(ctx);
  const S = o.base ? BASE : src;
  vm.runInContext("var wbView=null, _wbAutoT=null, _wbRO=null;\n" + FNS.map(n => fnOf(S, n)).join("\n") + "\n" + BLOCKS.map(([a, b]) => cut(S, a, b)).join("\n") + "\n" + (o.base ? "" : BLK), ctx);
  const runTimers = () => { let n = 0; timers.filter(t => t.live).forEach(t => { t.live = false; t.f(); n++; }); return n; };
  return { ctx, reg, ops, timers, ls, alerts, ros, eicCalls, runTimers, call: e => vm.runInContext(e, ctx), live: () => timers.filter(t => t.live).length };
}
const flush = async () => { for (let i = 0; i < 8; i++) await new Promise(r => setImmediate(r)); };
const ink = w => { w.call("wbView.strokes.push({c:'#1d4ed8',w:0.004,p:[[0.1,0.1],[0.2,0.2]]}); wbMarkDirty(wbView);"); };
const strip = w => { const el = w.reg["wb-link"]; return el && el.style.display !== "none" ? el.innerHTML : ""; };
const chip = w => /onclick="wblbOpen\(\)">✍️ Whiteboard<\/button>$/.test(strip(w));
const bar = w => w.reg["wb-bar"] ? w.reg["wb-bar"].innerHTML : "";
const sets = w => w.ops.filter(x => x[0] === "set" || x[0] === "update" || x[0] === "remove" || x[0] === "uascSave");
const noTs = ops => JSON.stringify(ops).replace(/"ts":\d+/g, '"ts":0');
const open = async (w, js) => { w.call(js); await flush(); };

(async () => {
console.log("── the block ──");
ok("WBLBOARD is one marked block, small (< 4 KB with comments)", BLK.length > 1500 && BLK.length < 4096, BLK.length);
ok("the block and each of its 5 call sites came out exactly once for the baseline", sitesOnce.every(Boolean), sitesOnce);
ok("the baseline has no trace of it", !/wblb|WBLBOARD/.test(BASE));
ok("every call site outside the block is guarded with typeof", (src.replace(BLK, "").match(/typeof wblb[A-Za-z]+==="function"/g) || []).length === 4);
ok("the block writes nothing: no db, no Storage, no localStorage, no fetch", !/db\.ref|\bdb\b|firebase|picStore|HA_LS|localStorage|sessionStorage|setItem|fetch\(|\.set\(|\.update\(/.test(CODE));
ok("no 🔀, no family name", BLK.indexOf("\u{1F500}") < 0 && !/zuri|melanie|burris|julian|lincoln|ellis|lucy/i.test(BLK));

console.log("── where the chip shows ──");
{
  const w = world();
  await open(w, 'wbOpen("man","k1",64)');
  ok("a reading book on a page with no links: the strip exists and holds just the chip", chip(w) && strip(w).split("<button").length === 2 && !!w.reg["wbl-row"]);
  await open(w, 'wbOpen("man","k1",69)');
  ok("…on a page with links: the link chips first, ✍️ Whiteboard last", chip(w) && strip(w).split("<button").length === 4 && strip(w).indexOf("wblGo(1)") < strip(w).indexOf("wblbOpen"));
  await open(w, 'wbOpen("tc","k1",3)'); ok("a book with only a toc: chip", chip(w));
  await open(w, 'wbOpen("lk","k1",9)'); ok("a book with only links, on a page without one: chip", chip(w));
  await open(w, 'wbOpen("lk","k1",3)'); await w.call("wblGo(0)"); await flush();
  ok("a plain book reached through a link (it holds a wblRet): ↩ Back first, chip last", w.ctx.wbView.bookId === "pl" && /^<button class="wbl-bk"/.test(strip(w)) && chip(w));
  await open(w, 'wbOpen("pl","k1",25)');
  ok("a plain book on its own: no strip, no wrapper, no chip", !w.reg["wb-link"] && !w.reg["wbl-row"] && !/wblbOpen/.test(w.reg["wb-view"].innerHTML));
  await open(w, 'wbOpen("wb","k1",71,{eic:{skill:"x"}})'); ok("an Editor in Chief view: no chip (the page's own link chip stays)", !/wblbOpen/.test(strip(w)) && /wblGo\(0\)/.test(strip(w)));
  await open(w, 'wbOpen("wb","k1",72,{rules:[2]})'); ok("a view with rule pages: no chip", !/wblbOpen/.test(strip(w)) && w.ctx.wbView.rules.length === 1);
  await open(w, 'wbOpen("' + PR + '","k1",1)'); ok("a 🖨 printable (with a toc even): no chip", !/wblbOpen/.test(strip(w)) && /printable/.test(bar(w)));
  const m = world({ mom: true });
  await open(m, 'wbOpen("wb","k1",72,{ans:5})'); ok("Mom's check with an answer key: no chip", m.ctx.wbView.ans === 5 && !/wblbOpen/.test(strip(m)));
  await open(m, 'wbOpen("wb","k1",72)'); ok("the same page without the key: chip", chip(m));
  m.call('wbView=null; wbdOpen({uid:"u1",dayId:"2"})'); m.call("wblRender(wbView,function(){return ''})");
  ok("a scratch board (Today's door): no strip, no chip", m.ctx.wbView.scratch && !strip(m) && m.call("wblbShow(wbView)") === false);
  ok("wblbShow refuses a missing view", w.call("wblbShow(null)") === false);
}

console.log("── a plain book is exactly as before ──");
for (const mom of [false, true]) {
  const a = world({ mom }), b = world({ mom, base: true });
  for (const x of [a, b]) { await open(x, 'wbOpenFor("pl","k1",25,{title:"Reading Detective",ref:"Pg 25",day:"monday"})'); ink(x); await x.call("wbGo(1)"); await flush(); ink(x); x.runTimers(); await flush(); }
  const same = a.reg["wb-view"].innerHTML === b.reg["wb-view"].innerHTML && bar(a) === bar(b) && !a.reg["wb-link"] && !a.reg["wbl-row"];
  a.call("wbClose()"); b.call("wbClose()"); await flush();
  ok("open, ink, page turn, autosave, close (" + (mom ? "Mom" : "kid") + "): overlay, bar and every db call byte-identical; no strip", same && noTs(a.ops) === noTs(b.ops) && a.ops.length === 3, [same, noTs(a.ops), noTs(b.ops)]);
}
{
  const a = world(), b = world({ base: true });
  await open(a, 'wbOpen("man","k1",69)'); await open(b, 'wbOpen("man","k1",69)');
  ok("a linked page: the bar is unchanged and the strip is the old strip + the chip", bar(a) === bar(b) && strip(a) === strip(b) + '<button onclick="wblbOpen()">✍️ Whiteboard</button>');
  const c = world(), d = world({ base: true });
  for (const x of [c, d]) x.call('wbdOpen({uid:"u1",dayId:"2"})');
  ok("Today's board: overlay and bar byte-identical to the tree without the feature", c.reg["wb-view"].innerHTML === d.reg["wb-view"].innerHTML && bar(c) === bar(d) && /wbClose\(\)/.test(bar(c)));
}

console.log("── tapping the chip ──");
{
  const w = world({ mom: true });
  await open(w, 'wbOpen("wb","k1",71)'); w.call("wbWatchFit()");   // the fake page image never "loads": start its fit observer by hand
  const bookRO = w.ros.filter(r => r.el && r.el === w.reg["wb-img"]).pop();
  ink(w); ok("ink written → an autosave is pending", w.ctx.wbView.dirty && w.live() === 1);
  const book = w.ctx.wbView; await w.call("wblbOpen()"); await flush();
  const sv = w.ops.findIndex(x => x[0] === "set" && x[1] === "workbookWork/k1/wb/71");
  ok("the page's ink was saved first, while the book was still the open view", sv >= 0 && w.ops[sv][3] === "wb" && w.ops[sv][4] === 71 && !w.ops[sv][5] && w.ops[sv][2].s.length === 1);
  ok("…then the whiteboard opened for the same kid, over the book", w.ctx.wbView !== book && w.ctx.wbView.scratch && w.ctx.wbView.kid === "k1" && w.reg["wb-view"].attrs["data-wbd"] === "1");
  ok("the book's fit observer was stopped", !!bookRO && bookRO.off);
  const n0 = sets(w).length; w.runTimers(); await flush();
  ok("the old autosave was cancelled: nothing more written", sets(w).length === n0 && n0 === 1);
  ok("the Editor in Chief way back was not fired", !w.eicCalls.length);
  const B = bar(w);
  ok("the board's bar: one blue ↩ Back to Student Workbook · p. 67 (printed page), first", /^<button onclick="wblbBack\(\)" style="[^"]*background:#1d4ed8[^"]*">↩ Back to Student Workbook · p\. 67<\/button>/.test(B), B.slice(0, 260));
  ok("…no ✕ and nothing else that leaves to Today", !/wbClose|✕|\\u2715/.test(B));
  ok("…Blank / Grid / Lines and the tools are there", ["wbdBg('blank')", "wbdBg('grid')", "wbdBg('lines')", "wbTool('pen')", "wbTool('erase')", "wbUndo()", "wbClear()", "wbTogglePen()"].every(s => B.indexOf(s) > 0));
  ok("…no 💾 Save (Mom's day save or a kid's save)", !/wbdSave|wbdKidSave|💾|Save/.test(B));
  const k = world(); await open(k, 'wbOpen("man","k1",64)'); await k.call("wblbOpen()"); await flush();
  ok("a kid's device: no Save either; a reading book's Back reads Teacher's Manual · p. 59", !/Save|wbClose/.test(bar(k)) && /↩ Back to Teacher's Manual · p\. 59</.test(bar(k)));
  ok("the reading book stored its place on the way out (wblClose)", k.ops.filter(x => x[0] === "set" && x[1] === "workbookPlace/k1/man" && x[2].p === 64).length === 2);
  const r = world(); await open(r, 'wbOpen("rd","k1",12)'); await r.call("wblbOpen()"); await flush();
  ok("a book that links nowhere keeps its whole name", /↩ Back to Team Readers · p\. 10</.test(bar(r)));
}

console.log("── Today's door still refuses over a book ──");
{
  const w = world({ mom: true });
  await open(w, 'wbOpen("man","k1",69)'); const v = w.ctx.wbView;
  ok("the card door's wbdOpen({uid, dayId}) refuses while the book is open", w.call('wbdOpen({uid:"u1",dayId:"2"})') === false && w.ctx.wbView === v);
  ok("…so does an empty door and a forged token", w.call("wbdOpen({})") === false && w.call("wbdOpen({wblb:{b:'man',p:69}})") === false && w.call("wbdOpen({wblb:null})") === false && w.ctx.wbView === v);
  await w.call("wblbOpen()"); await flush(); const tok = w.ctx.wbView.wblb; await w.call("wblbBack()"); await flush();
  w.ctx.usedTok = tok;
  ok("a used token does not open it again", !!tok && w.call("wbdOpen({wblb:usedTok})") === false && w.ctx.wbView.bookId === "man");
  ok("the chip refuses on a scratch board", (await w.call('wbView=null; wbdOpen({}); wblbOpen()')) === false);
}

console.log("── Back ──");
{
  const w = world({ nodb: true });
  w.call('wbOpenFor("man","k1",69,{title:"Logic of English",ref:"Lesson 21 · workbook p. 67–69",day:"monday"})'); await flush();
  await w.call("wblGo(0)"); await flush();
  ok("manual p. 69 → workbook 71 with its ↩ Back to the manual", w.ctx.wbView.bookId === "wb" && w.ctx.wbView.page === 71 && w.ctx.wbView.wblRet.b === "man");
  const ret = JSON.stringify(w.ctx.wbView.wblRet), as = JSON.stringify(w.ctx.wbView.assignment);
  await w.call("wblbOpen()"); await flush(); await w.call("wblbBack()"); await flush();
  ok("Back: the same book and page, a book view again", w.ctx.wbView.bookId === "wb" && w.ctx.wbView.page === 71 && !w.ctx.wbView.scratch && !!w.reg["wb-ink"]);
  ok("…its own ↩ Back to the manual is still there", JSON.stringify(w.ctx.wbView.wblRet) === ret && /^<button class="wbl-bk" onclick="wblBack\(\)">↩ Back to Teacher's Manual · p\. 64/.test(strip(w)) && chip(w));
  ok("…same assignment state (none on a linked jump)", JSON.stringify(w.ctx.wbView.assignment) === as);
  await w.call("wblBack()"); await flush();
  ok("…and that Back still lands on the manual with the card's banner", w.ctx.wbView.bookId === "man" && w.ctx.wbView.page === 69 && w.ctx.wbView.assignment && w.ctx.wbView.assignment.ref === "Lesson 21 · workbook p. 67–69");
  await w.call("wbGo(1)"); await flush();
  const a0 = JSON.stringify(w.ctx.wbView.assignment), h0 = w.reg["wb-assign"].innerHTML;
  await w.call("wblbOpen()"); await flush();
  ok("on the board there is no banner and no strip", !w.reg["wb-assign"] && !w.reg["wb-link"]);
  await w.call("wblbBack()"); await flush();
  ok("Back from p. 70: page 70, the card's banner as it was (starts p. 69, its ↩ p. 64 shown)", w.ctx.wbView.page === 70 && JSON.stringify(w.ctx.wbView.assignment) === a0 && w.reg["wb-assign"].innerHTML === h0 && /↩ p\. 69/.test(h0) && w.ctx.wbView.assignment.page === 69);
  ok("…with no wblRet invented", !w.ctx.wbView.wblRet);
  const c = world({ nodb: true }); c.call('wbOpen("wb","k1",71,{cover:[[0.1,0.1,0.2,0.2]]})');
  const cov = JSON.stringify(c.ctx.wbView.cover); await c.call("wblbOpen()"); await c.call("wblbBack()"); await flush();
  ok("the page's opts come back too (cover boxes)", cov.length > 4 && JSON.stringify(c.ctx.wbView.cover) === cov && c.ctx.wbView.kid === "k1");
  ok("wblbBack does nothing on a book view", c.call("wblbBack()") === false && c.ctx.wbView.bookId === "wb");
}

console.log("── the drawing ──");
{
  const w = world();
  await open(w, 'wbOpen("man","k1",69)'); await w.call("wblbOpen()"); await flush();
  ok("the first board is blank", w.ctx.wbView.strokes.length === 0);
  ink(w); ink(w); w.call("wbdBg('lines')"); w.ctx.wbView.ar = 1.25;
  const S = JSON.stringify(w.ctx.wbView.strokes);
  w.call("wblbBack()"); await flush(); await w.call("wbGo(1)"); await flush();
  await w.call("wblbOpen()"); await flush();
  ok("the next tap shows the same drawing, background and shape", JSON.stringify(w.ctx.wbView.strokes) === S && w.ctx.wbView.bg === "lines" && w.ctx.wbView.ar === 1.25 && /wbdBg\('lines'\)" style="[^"]*#1d4ed8/.test(bar(w)));
  ok("…and the bar points at the page it came from now (p. 65)", /p\. 65</.test(bar(w)));
  w.call("wbUndo()"); w.call("wblbBack()"); await flush(); await w.call("wblGo(0)"); await flush(); await w.call("wblbOpen()"); await flush();
  ok("an undo is kept, and the drawing follows a linked jump (no ✕ between)", w.ctx.wbView.strokes.length === 1);
  w.call("wbClear()"); w.call("wblbBack()"); await flush(); await w.call("wblbOpen()"); await flush();
  ok("🧽 Clear empties it", w.ctx.wbView.strokes.length === 0);
  ink(w); w.call("wblbBack()"); await flush();
  w.call("wbClose()"); await flush();
  ok("the book's ✕ closes to nothing and drops the drawing", w.ctx.wbView === null && w.call("_wblbKeep") === null);
  await open(w, 'wbOpen("man","k1",69)'); await w.call("wblbOpen()"); await flush();
  ok("…so the next board from the book is blank", w.ctx.wbView.strokes.length === 0);
  ink(w); w.call("wblbBack()"); await flush();
  ok("a drawing is waiting", w.call("_wblbKeep").strokes.length === 1);
  w.call("wbView=null"); w.call('wbdOpen({uid:"u1",dayId:"2"})');
  ok("Today's board is fresh: blank, plain ✕, no Back", w.ctx.wbView.strokes.length === 0 && !w.ctx.wbView.wblb && /wbClose\(\)/.test(bar(w)) && !/wblbBack/.test(bar(w)));
  ink(w); w.call("wbClose()"); await flush();
  ok("…and its ✕ leaves the book's drawing alone", w.call("_wblbKeep").strokes.length === 1);
}

console.log("── nothing new is written ──");
for (const dry of [false, true]) {
  const w = world({ dry, mom: true });
  await open(w, 'wbOpen("wb","k1",71)'); ink(w);
  await w.call("wblbOpen()"); await flush();
  const before = w.ops.length;
  ink(w); ink(w); w.call("wbdBg('grid')"); w.runTimers(); await flush(); w.call("wbSave()"); await flush();
  ok("drawing, autosave and a direct wbSave on the board" + (dry ? " (dry run)" : "") + ": no db call, no local storage", w.ops.length === before);
  w.call("wblbBack()"); await flush();
  const extra = sets(w).filter(x => !(x[0] === "set" && (x[1] === "workbookWork/k1/wb/71" || /^workbookPlace\//.test(x[1]))));
  ok("the whole trip" + (dry ? " (dry run)" : "") + ": only the page's ink save main already makes" + (dry ? " — and in dry run not even that" : ""),
    !extra.length && sets(w).every(x => !x[5]) && (dry ? sets(w).length === 0 : sets(w).length === 1), sets(w));
  ok("no new local key" + (dry ? " (dry run)" : ""), !Object.keys(w.ls).length);
}
{
  const w = world({ dry: true });
  await open(w, 'wbOpen("man","k1",64)'); await w.call("wblbOpen()"); await flush(); await w.call("wblbBack()"); await flush();
  ok("a reading book in dry run: no db write; only its existing local place mirror", sets(w).length === 0 && Object.keys(w.ls).join() === "ha_wbplace");
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
