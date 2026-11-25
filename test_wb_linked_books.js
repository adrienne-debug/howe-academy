// 📖 WBLINK — linked books in the Workbooks viewer (her ask 2026-11-24, for the Burris family's Logic of English Foundations A:
//   the manual, workbook and readers on screen "so she can read what she needs to read to teach Zuri", and where the manual
//   says open the workbook page, "off to the side a little spot she can click and then go back to where her other page is").
//   Runs the REAL viewer (wbOpen, bar, page turns, load, save, autosave, close, card chip) + the WBLINK block on a fake DOM / db.
//   · "Lesson 21 · …" / "Review D · …" labels open through toc.sec (+ offset, clamped); every older label reads as before
//   · a read:true book: no pen, no ink layer, never touches workbookWork; its page is remembered (workbookPlace + local mirror)
//   · the strip: nothing without links; chips in order with icon, PRINTED page and an escaped, shortened label
//   · a chip saves the dirty page first and cancels the autosave; ↩ Back saves first and reopens the exact page;
//     the return point survives page turns, is not replaced by a second jump, and goes away with ✕
//   · the remembered page is used only inside the card's section, at both edges
//   · baseline = this tree minus the WBLINK block and its call sites: a plain book is byte-identical
//   run: node test_wb_linked_books.js
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const cut = (s, a, b) => { const i = s.indexOf(a), j = s.indexOf(b, i); if (i < 0 || j < 0) throw new Error("markers " + a); return s.slice(i, j + b.length); };
const fn = (s, name) => { let i = s.indexOf("\nfunction " + name + "("); if (i < 0) { i = s.indexOf("\nasync function " + name + "("); if (i < 0) throw new Error("no " + name); } i++;
  return s.slice(i, s.indexOf("\n}", i) + 2); };
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x) : "")); } };
const BLK = cut(src, "// WBLINK_START", "// WBLINK_END");
const CODE = BLK.replace(/^\s*\/\/.*$/gm, "");

// ── the app before: this tree minus the block and each call site (each must match exactly once) ──
const SITES = [
  ['  if(typeof wblSecPage==="function") return wblSecPage(book,s,clamp);   // WBLINK: "Lesson 21 …" / "Review D …" through toc.sec\n', ""],
  ['  if(typeof wblOpenFor==="function"&&wblOpenFor(bookId,kid,page,assign)) return;   // WBLINK: a reading book opens at its remembered page inside the section\n', ""],
  ['  if(typeof wblRender==="function") try{ wblRender(v,btn); }catch(e){}   // WBLINK: reading-book bar + the linked-books strip\n', ""],
  ['    if(db&&!b.read){ const s=await db.ref(wbInkPath(v.kid,v.bookId,v.page)).once("value"); const d=s.val();   // WBLINK: a reading book has no ink\n',
   '    if(db){ const s=await db.ref(wbInkPath(v.kid,v.bookId,v.page)).once("value"); const d=s.val();\n'],
  ['  if(typeof wblClose==="function") wblClose();   // WBLINK: a reading book remembers its page\n', ""],
  ['  if(typeof wblIsRead==="function"&&wblIsRead(v)) return;   // WBLINK: a reading book never writes ink\n', ""]];
let BASE = src; const sitesOnce = [];
sitesOnce.push(BASE.split(BLK + "\n").length === 2); BASE = BASE.replace(BLK + "\n", "");
SITES.forEach(([a, b]) => { sitesOnce.push(BASE.split(a).length === 2); BASE = BASE.split(a).join(b); });
if (src.indexOf("// WBLBOARD_START") >= 0) BASE = BASE.replace(cut(src, "// WBLBOARD_START", "// WBLBOARD_END") + "\n", "");   // the strip's ✍️ chip builds on this block (test_wbl_board.js)

const FNS = ["esc", "wbBook", "wbInkPath", "wbPageFor", "wbMomEyes", "wbTaskLink", "wbOpenFor", "wbAssignFor", "wbAssignLast", "wbAssignClean", "wbAssignRender", "wbGoAssign",
  "wbOpen", "wbClose", "wbBarRender", "wbTool", "wbGo", "wbLoadPage", "wbFit", "wbWatchFit", "wbPaint", "wbMarkDirty", "wbAutoSaveSoon", "wbSave"];

// ── books: printed page + offset = file page ──
const BOOKS = () => ({
  man: { id: "man", name: "Logic of English Foundations A Teacher's Manual", pages: 245, read: true, imgs: { 64: "m64", 69: "m69" },
    toc: { offset: 5, sec: { lesson_20: 60, lesson_21: 64, review_d: 70, lesson_22: 74, lesson_99: 400 } },
    links: { 69: [{ b: "wb", p: 71, t: 'Phonogram <b>"sh"</b> & the two-letter words page' }, { b: "rd", p: 10, t: "Reader 3" }, { b: "gone", p: 4, t: "missing book" }],
      70: { 0: { b: "wb", p: 72, t: "Spelling" } },
      80: [1, 2, 3, 4, 5].map(n => ({ b: "rd", p: n + 2, t: "R" + n })) } },
  wb: { id: "wb", name: "Logic of English Foundations A Student Workbook", pages: 231, imgs: { 71: "w71" }, toc: { offset: 4 },
    links: { 71: [{ b: "man", p: 69, t: "Lesson 21" }] } },
  rd: { id: "rd", name: "Team Readers", pages: 130, read: true, toc: { offset: 2 } },
  pl: { id: "pl", name: "Reading Detective", pages: 193, imgs: { 25: "p25" }, toc: { offset: 11, ex: { 1: 14, 2: 16, 39: 90 }, pre: 2, post: 140 } }
});

// ── a fake DOM with parents, so the strip's wrapper can move the stage ──
function world(o) {
  o = o || {}; const reg = {}, ops = [], timers = [], ls = Object.assign({}, o.ls || {}), alerts = [];
  const unreg = el => { if (el.id && reg[el.id] === el) delete reg[el.id]; (el.children || []).forEach(unreg); };
  const make = (id) => {
    const el = { id: id || "", style: {}, children: [], parentNode: null, _html: "", textContent: "",
      appendChild(c) { if (c.parentNode) c.parentNode.children = c.parentNode.children.filter(x => x !== c); c.parentNode = this; this.children.push(c); const r = e => { if (e.id) reg[e.id] = e; e.children.forEach(r); }; if (this.id && reg[this.id] === this || this === body) r(c); return c; },
      insertBefore(c, ref) { if (c.parentNode) c.parentNode.children = c.parentNode.children.filter(x => x !== c); c.parentNode = this; const i = this.children.indexOf(ref); this.children.splice(i < 0 ? this.children.length : i, 0, c); if (c.id) reg[c.id] = c; return c; },
      remove() { if (this.parentNode) this.parentNode.children = this.parentNode.children.filter(x => x !== this); unreg(this); this.parentNode = null; },
      insertAdjacentHTML() {}, getBoundingClientRect() { return { width: 0, height: 0 }; }, getContext() { return new Proxy({}, { get: () => () => {} }); } };
    Object.defineProperty(el, "innerHTML", { get() { return this._html; }, set(h) { this._html = h; this.children.forEach(unreg); this.children = []; const re = /id="([^"]+)"/g; let m; while ((m = re.exec(h))) { const c = make(m[1]); c.parentNode = this; this.children.push(c); reg[m[1]] = c; } } });
    return el;
  };
  const body = make("body");
  const dbv = o.dbv || {};
  const ctx = { console, JSON, Object, Array, String, Number, Math, Promise, Error, Date, parseInt, setImmediate,
    wbBooks: BOOKS(), wbView: null, _wbAutoT: null, _wbRO: null, WB_PEN: "#1d4ed8", WB_MOMPEN: "#dc2626", WB_MAXP: 400,
    momHere: () => !!o.mom, adminPinUnlocked: false, _dryRun: () => !!o.dry, alert: m => alerts.push(m), confirm: () => true, dbg: () => {}, SL_KCOL: {}, SL_KLBL: {},
    _todayDay: "monday", DAY_LBL: { monday: "Monday" },
    currData: { subjects: { zuri: { loe: { workbook: "man", display: "Logic of English" }, loew: { workbook: "wb", display: "LOE Workbook" } }, ellis: { rd: { workbook: "pl", display: "Reading Detective" } } } },
    taskLessonRef: t => { const m = (t.title || "").match(/[—–]\s*(.+)$/); return m ? m[1].trim() : ""; },
    HA_LS: { getItem: k => (k in ls ? ls[k] : null), setItem: (k, v) => { ls[k] = String(v); }, removeItem: k => { delete ls[k]; } },
    db: o.nodb ? null : { ref: p => ({
      once: () => { ops.push(["read", p]); return o.hang ? new Promise(() => {}) : Promise.resolve({ val: () => (p in dbv ? dbv[p] : null) }); },
      set: v => { ops.push(["set", p, JSON.parse(JSON.stringify(v)), ctx.wbView && ctx.wbView.bookId, ctx.wbView && ctx.wbView.page]); return Promise.resolve(); } }) },
    setTimeout: (f, ms) => { timers.push({ f, ms, live: true }); return timers.length; }, clearTimeout: i => { if (i && timers[i - 1]) timers[i - 1].live = false; },
    document: { getElementById: id => reg[id] || null, createElement: () => make(""), body }, window: {} };
  vm.createContext(ctx);
  const S = o.base ? BASE : src;
  vm.runInContext(FNS.map(n => fn(S, n)).join("\n") + "\n" + (o.base ? "" : BLK), ctx);
  const runTimers = () => { let n = 0; timers.filter(t => t.live).forEach(t => { t.live = false; t.f(); n++; }); return n; };
  return { ctx, reg, ops, timers, ls, alerts, runTimers, call: e => vm.runInContext(e, ctx), live: () => timers.filter(t => t.live).length };
}
const flush = async () => { for (let i = 0; i < 8; i++) await new Promise(r => setImmediate(r)); };
const ink = w => { w.call("wbView.strokes.push({c:'#1d4ed8',w:0.004,p:[[0.1,0.1],[0.2,0.2]]}); wbMarkDirty(wbView);"); };
const work = w => w.ops.filter(x => /^workbookWork\//.test(x[1]));
const strip = w => { const el = w.reg["wb-link"]; return el && el.style.display !== "none" ? el.innerHTML : ""; };

(async () => {
console.log("── the block ──");
ok("WBLINK is one marked block, lean (< 9 KB with comments)", BLK.length > 3000 && BLK.length < 9216, BLK.length);
ok("the block and each of its 6 call sites came out exactly once for the baseline", sitesOnce.every(Boolean), sitesOnce);
ok("the baseline has no trace of it", !/wbl[A-Z]|WBLINK|wb-link|workbookPlace/.test(BASE));
ok("no 🔀, no workbookWork, no whole-node write in the block", BLK.indexOf("\u{1F500}") < 0 && CODE.indexOf("workbookWork") < 0 && !/\.update\(|\.remove\(\)\.|ref\("workbooks/.test(CODE));
ok("its only write is one targeted set at workbookPlace/<kid>/<bookId>, behind db && !_dryRun()", (CODE.match(/\.set\(/g) || []).length === 1 && /if\(db&&!_dryRun\(\)\) try\{ db\.ref\(k\)\.set\(r\)/.test(CODE) && /"workbookPlace\/"\+kid\+"\/"\+id/.test(CODE));

console.log("── section labels ──");
{
  const w = world(), pf = (b, l) => w.call("wbPageFor(wbBooks." + b + "," + JSON.stringify(l) + ")");
  ok("keys: Lesson 21 → lesson_21, Review D → review_d, any case", w.call('[wblSecKey("Lesson 21 · workbook p. 67–69"),wblSecKey("Review D · workbook p. 64–66"),wblSecKey("LESSON 21"),wblSecKey("review d")].join()') === "lesson_21,review_d,lesson_21,review_d");
  ok("not section labels: Lessons, Review Day, Lesson 21a, plain words", w.call('[wblSecKey("Lessons 21–22"),wblSecKey("Review Day"),wblSecKey("Lesson 21a"),wblSecKey("Read aloud")].every(x=>x===null)'));
  ok("Lesson 21 · workbook p. 67–69 → printed 64 + offset 5 = file 69", pf("man", "Lesson 21 · workbook p. 67–69") === 69);
  ok("Review D · workbook p. 64–66 → file 75; Lesson 20 → 65", pf("man", "Review D · workbook p. 64–66") === 75 && pf("man", "Lesson 20") === 65);
  ok("a section past the book's end, or not in the map → null (no link, never a wrong page)", pf("man", "Lesson 99") === null && pf("man", "Lesson 23") === null && pf("rd", "Lesson 21") === null);
  ok("the card chip on a manual-linked subject opens the manual at today's lesson", JSON.stringify(w.call('wbTaskLink({who:"zuri",subjectKey:"loe",title:"📖 Logic of English — Lesson 21 · workbook p. 67–69"})')) === JSON.stringify({ bookId: "man", name: BOOKS().man.name, page: 69, ans: null }));
  const b = world({ base: true }), pb = (bk, l) => b.call("wbPageFor(wbBooks." + bk + "," + JSON.stringify(l) + ")");
  const labels = ["Ex. 39–40", "Ex 1", "Exercise 2", "pg14-17", "Pg 25", "p. 20", "pp 30–31", "pages 40", "Pretest", "Post-test", "Lesson 21", "Review D", "", "Read chapter 3", "Pg 999"];
  const same = [];
  ["pl", "man", "wb", "rd"].forEach(bk => labels.forEach(l => { if (pf(bk, l) !== pb(bk, l) && !(bk === "man" && /^(Lesson 21|Review D)$/.test(l))) same.push(bk + ":" + l); }));
  ok("every older label resolves exactly as before, in every book", !same.length, same);
  ok("…and the app before could not read Lesson / Review labels at all", pb("man", "Lesson 21") === null && pb("man", "Review D") === null);
}

console.log("── a reading book ──");
{
  const w = world();
  w.call('wbOpen("man","zuri",64)'); await flush();
  const bar = w.reg["wb-bar"].innerHTML;
  ok("opens with ✕, the name, ◀ p. 59 ▶ (printed page) and nothing else", /wbClose\(\)/.test(bar) && bar.indexOf("Logic of English Foundations A Teacher&#39;s Manual") < 0 && bar.indexOf("Teacher's Manual") > 0 && /wbGo\(-1\)/.test(bar) && /p\. 59</.test(bar) && /wbGo\(1\)/.test(bar));
  ok("no pen, erase, undo, clear, pencil switch or save in its bar", !/wbTool|wbUndo|wbClear|wbTogglePen|wbSave|✏️|💾|✓ Saved/.test(bar));
  ok("no ink layer to write on", !w.reg["wb-ink"]);
  ok("the kid still rides on the view", w.ctx.wbView.kid === "zuri");
  ok("its page is remembered: workbookPlace/zuri/man = {p:64,ts} + the local mirror", w.ops.some(x => x[0] === "set" && x[1] === "workbookPlace/zuri/man" && x[2].p === 64 && x[2].ts > 0) && JSON.parse(w.ls.ha_wbplace)["workbookPlace/zuri/man"].p === 64);
  await w.call("wbGo(1)"); await flush();
  ok("a page turn stores the new page once", w.ops.filter(x => x[0] === "set" && x[1] === "workbookPlace/zuri/man" && x[2].p === 65).length === 1 && /p\. 60</.test(w.reg["wb-bar"].innerHTML));
  w.call("wbSave()"); w.runTimers(); await flush();
  w.call("wbClose()"); await flush();
  ok("closing stores the page again", w.ops.filter(x => x[0] === "set" && x[1] === "workbookPlace/zuri/man").length === 3 && !w.ctx.wbView);
  ok("it never read or wrote workbookWork", work(w).length === 0, work(w));
  const d = world({ dry: true }); d.call('wbOpen("man","zuri",64)'); d.call("wbGo(1)"); await flush(); d.call("wbClose()"); await flush();
  ok("dry run: no db write at all, the local mirror still follows", !d.ops.some(x => x[0] === "set") && JSON.parse(d.ls.ha_wbplace)["workbookPlace/zuri/man"].p === 65);
  const wb = world(); wb.call('wbOpen("wb","zuri",71)'); await flush();
  ok("a writing book still reads its ink and keeps its pen bar", work(wb).some(x => x[0] === "read" && x[1] === "workbookWork/zuri/wb/71") && /wbTool/.test(wb.reg["wb-bar"].innerHTML) && !!wb.reg["wb-ink"]);
}

console.log("── the strip ──");
{
  const w = world();
  w.call('wbOpen("man","zuri",64)'); await flush();
  ok("a page with no links shows no strip and no wrapper", !w.reg["wb-link"] && !w.reg["wbl-row"]);
  w.call('wbOpen("man","zuri",69)'); await flush();
  const h = strip(w), chips = h.split("<button").slice(1);
  ok("one chip per link whose book is loaded, in order (the missing book is left out)", chips.length === 2 && /wblGo\(0\)/.test(chips[0]) && /wblGo\(1\)/.test(chips[1]), chips.length);
  ok("📓 for a writing book with its PRINTED page (71 − 4 = 67)", /^[^>]*>📓 <b>p\. 67<\/b>/.test(chips[0]), chips[0]);
  ok("📖 for a reading book (10 − 2 = 8) and its label", /📖 <b>p\. 8<\/b> Reader 3/.test(chips[1]), chips[1]);
  ok("the label is escaped and shortened", chips[0].indexOf("<b>\"sh") < 0 && chips[0].indexOf("&lt;b&gt;&quot;sh&quot;&lt;/b&gt; &amp;") > 0 && /…<\/button>/.test(chips[0]) && chips[0].indexOf("words page") < 0);
  ok("the strip sits beside the stage in its own row, with its style (side strip; a bar under the toolbar under 700 px)",
    w.reg["wb-stage"].parentNode === w.reg["wbl-row"] && w.reg["wb-link"].parentNode === w.reg["wbl-row"] && w.reg["wbl-row"].parentNode === w.reg["wb-view"] &&
    w.reg["wbl-row"].children.some(c => /@media\(max-width:699px\)\{#wbl-row\{flex-direction:column\}#wb-link\{order:-1;flex-direction:row/.test(c.textContent)));
  ok("chips are finger-sized (48 px tall at least)", /#wb-link button\{[^}]*min-height:48px/.test(w.call("WBL_CSS")));
  await w.call("wbGo(1)"); await flush();
  ok("links stored as an object (how Firebase can return them) work too", /wblGo\(0\)/.test(strip(w)) && /p\. 68<\/b> Spelling/.test(strip(w)));
  await w.call("wbGo(1)"); await flush();
  ok("turning to a page with no links hides the strip", strip(w) === "" && w.reg["wb-link"].style.display === "none");
  w.call('wbOpen("man","zuri",80)'); await flush();
  ok("at most 4 chips on a page", strip(w).split("<button").length - 1 === 4);
}

console.log("── jump and back ──");
{
  const w = world({ mom: true });
  w.call('wbOpen("wb","zuri",71)'); await flush();
  ink(w); ok("ink written → an autosave is pending", w.ctx.wbView.dirty && w.live() === 1);
  const p = w.call("wblGo(0)"); await p; await flush();
  const sv = w.ops.findIndex(x => x[0] === "set" && x[1] === "workbookWork/zuri/wb/71");
  ok("the jump saved the dirty page first, while it was still the open page", sv >= 0 && w.ops[sv][3] === "wb" && w.ops[sv][4] === 71 && w.ops[sv][2].s.length === 1);
  ok("…then opened the target at its file page for the same kid", w.ctx.wbView.bookId === "man" && w.ctx.wbView.page === 69 && w.ctx.wbView.kid === "zuri");
  const n0 = work(w).filter(x => x[0] === "set").length; w.runTimers(); await flush();
  ok("the old autosave was cancelled: nothing more is written after the jump", work(w).filter(x => x[0] === "set").length === n0 && n0 === 1);
  ok("the return point is the exact page left", JSON.stringify([w.ctx.wbView.wblRet.b, w.ctx.wbView.wblRet.p]) === '["wb",71]');
  ok("one large Back chip first: ↩ Back to Student Workbook · p. 67", /^<button class="wbl-bk" onclick="wblBack\(\)">↩ Back to Student Workbook · p\. 67<\/button>/.test(strip(w)), strip(w).slice(0, 120));
  await w.call("wbGo(1)"); await flush(); await w.call("wbGo(-1)"); await flush();
  ok("page turns in the target keep the return point", w.ctx.wbView.wblRet && w.ctx.wbView.wblRet.p === 71 && /wblBack/.test(strip(w)));
  await w.call("wblGo(0)"); await flush();   // man 69 → wb 71 (a link tapped from inside the target)
  ok("a link tapped inside the target does not replace the return point", w.ctx.wbView.bookId === "wb" && w.ctx.wbView.wblRet.b === "wb" && w.ctx.wbView.wblRet.p === 71);
  w.call('wbOpen("man","zuri",70)'); await flush(); w.ctx.wbView.wblRet = null;
  await w.call("wblGo(0)"); await flush();   // man 70 → wb 72
  ok("from the manual at p. 70 → workbook 72, Back points at the manual", w.ctx.wbView.bookId === "wb" && w.ctx.wbView.page === 72 && /↩ Back to Teacher's Manual · p\. 65/.test(strip(w)));
  ink(w); const b = w.call("wblBack()"); await b; await flush();
  const s2 = w.ops.findIndex(x => x[0] === "set" && x[1] === "workbookWork/zuri/wb/72");
  ok("Back saved the dirty page first (awaited, before the switch)", s2 >= 0 && w.ops[s2][3] === "wb");
  ok("…and reopened the first book at the exact page", w.ctx.wbView.bookId === "man" && w.ctx.wbView.page === 70 && !w.ctx.wbView.wblRet);
  const n1 = work(w).filter(x => x[0] === "set").length; w.runTimers(); await flush();
  ok("no stray autosave after Back", work(w).filter(x => x[0] === "set").length === n1);
  ok("after Back the strip shows the page's links again, no Back chip", !/wblBack/.test(strip(w)) && /wblGo\(0\)/.test(strip(w)));
  await w.call("wblGo(0)"); await flush(); w.call("wbClose()"); await flush();
  ok("✕ clears the return point", w.ctx.wbView === null);
  w.call('wbOpen("wb","zuri",71)'); await flush();
  ok("…so the next open has no Back chip", !w.ctx.wbView.wblRet && !/wblBack/.test(strip(w)));
  // the card's banner survives the round trip
  const c = world({ nodb: true });
  c.call('wbOpenFor("man","zuri",69,{title:"Logic of English",ref:"Lesson 21 · workbook p. 67–69",day:"monday"})');
  const a0 = JSON.stringify(c.ctx.wbView.assignment);
  await c.call("wblGo(0)"); await c.call("wblBack()"); await flush();
  ok("Back brings the card's banner back as it was", c.ctx.wbView.bookId === "man" && JSON.stringify(c.ctx.wbView.assignment) === a0 && !!c.reg["wb-assign"]);
}

console.log("── the remembered page, inside the section only ──");
{
  // Lesson 21 = file 69 … 74 (Review D starts at 75)
  const open = async (p, o) => { const ls = p ? { ha_wbplace: JSON.stringify({ "workbookPlace/zuri/man": { p, ts: 100 } }) } : {}; const w = world(Object.assign({ nodb: true, ls }, o || {}));
    w.call('wbOpenFor("man","zuri",69,{title:"LOE",ref:"Lesson 21 · workbook p. 67–69",day:"monday"})'); await flush(); return w; };
  ok("remembered 74 (the section's last page) → opens at 74", (await open(74)).ctx.wbView.page === 74);
  ok("remembered 75 (the next section's first page) → the section start, 69", (await open(75)).ctx.wbView.page === 69);
  ok("remembered 69 (the section's first page) → 69", (await open(69)).ctx.wbView.page === 69);
  ok("remembered 68 (the page before) → 69", (await open(68)).ctx.wbView.page === 69);
  ok("nothing remembered → the section start", (await open(0)).ctx.wbView.page === 69);
  const w74 = await open(74);
  ok("opened at 74, the banner still knows the lesson starts at 69", w74.ctx.wbView.assignment.page === 69);
  const last = world({ nodb: true, ls: { ha_wbplace: JSON.stringify({ "workbookPlace/zuri/man": { p: 245, ts: 1 } }) } });
  last.call('wbOpenFor("man","zuri",79,{ref:"Lesson 22",day:"monday"})'); await flush();
  ok("the last section runs to the book's last page", last.ctx.wbView.page === 245);
  const dbw = world({ ls: { ha_wbplace: JSON.stringify({ "workbookPlace/zuri/man": { p: 70, ts: 100 } }) }, dbv: { "workbookPlace/zuri/man": { p: 73, ts: 200 } } });
  dbw.call('wbOpenFor("man","zuri",69,{ref:"Lesson 21",day:"monday"})'); await flush();
  ok("the newer of the device copy and the database copy wins", dbw.ctx.wbView.page === 73 && dbw.ops[0][0] === "read" && dbw.ops[0][1] === "workbookPlace/zuri/man");
  const hang = world({ hang: true, ls: { ha_wbplace: JSON.stringify({ "workbookPlace/zuri/man": { p: 72, ts: 100 } }) } });
  hang.call('wbOpenFor("man","zuri",69,{ref:"Lesson 21",day:"monday"})'); await flush();
  const opened = !!hang.ctx.wbView; hang.runTimers(); await flush();
  ok("offline (the read never answers): opens from the device copy after a moment", !opened && hang.ctx.wbView && hang.ctx.wbView.page === 72);
  const wr = world({ nodb: true, ls: { ha_wbplace: JSON.stringify({ "workbookPlace/zuri/wb": { p: 90, ts: 100 } }) } });
  wr.call('wbOpenFor("wb","zuri",71,{ref:"Pg 67",day:"monday"})');
  ok("a writing book from a card opens exactly where the card says", wr.ctx.wbView.page === 71);
}

console.log("── a plain book is exactly as before ──");
{
  const run = async (o, js) => { const w = world(o); w.call(js); await flush(); return w; };
  for (const mom of [false, true]) {
    const a = await run({ mom }, 'wbOpenFor("pl","ellis",25,{title:"Reading Detective",ref:"Ex. 39–40",day:"monday"})'), b = await run({ mom, base: true }, 'wbOpenFor("pl","ellis",25,{title:"Reading Detective",ref:"Ex. 39–40",day:"monday"})');
    ok("open from a card (" + (mom ? "Mom" : "kid") + "): overlay, bar, banner and db reads byte-identical", a.reg["wb-view"].innerHTML === b.reg["wb-view"].innerHTML && a.reg["wb-bar"].innerHTML === b.reg["wb-bar"].innerHTML &&
      a.reg["wb-assign"].innerHTML === b.reg["wb-assign"].innerHTML && JSON.stringify(a.ops) === JSON.stringify(b.ops) && !a.reg["wb-link"]);
    ink(a); ink(b); await a.call("wbGo(1)"); await b.call("wbGo(1)"); await flush(); ink(a); ink(b); a.runTimers(); b.runTimers(); await flush(); a.call("wbClose()"); b.call("wbClose()"); await flush();
    const strip_ts = w => JSON.stringify(w.ops.map(x => [x[0], x[1], x[2] && x[2].s]));
    ok("ink, page turn, autosave and close write the same paths (" + (mom ? "Mom" : "kid") + ")", strip_ts(a) === strip_ts(b) && !a.ops.some(x => /workbookPlace/.test(x[1])) && !Object.keys(a.ls).length);
  }
  const w = world(); w.call('wbOpen("wb","zuri",71)'); await flush();
  ok("a book with links keeps its own bar untouched (the strip is a sibling)", w.reg["wb-bar"].innerHTML === (await run({ base: true }, 'wbOpen("wb","zuri",71)')).reg["wb-bar"].innerHTML);
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
