/*
 * Node tests for the workbook ASSIGNMENT BANNER — her ask 2026-09-27: "show today's assignment at
 * the top of a workbook page".
 *
 *   · a card hands the viewer {title, ref, day} (wbAssignFor) and wbOpenFor/wbOpenCheck carry it in opts
 *   · opened without a card (Workbooks panel, ?workbook= door, EIC) → no banner at all
 *   · the banner reads "Today: <ref>" + the subject small beside it, and never an answer page
 *   · paging away keeps the banner and adds "↩ p. N"; the tap jumps back to the assignment's first page
 *   · the banner survives wbBarRender's innerHTML redraws (it is a sibling of the bar, not inside it)
 *   · the block writes nothing to db, and the card row / wbOpen wiring is in place
 *
 *   run:  node test_wb_assignment.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
function slice(name) {
  const i = src.indexOf("function " + name + "(");
  if (i < 0) { console.error(name + " not found"); process.exit(1); }
  return src.slice(i, src.indexOf("\n}", i) + 2);
}
const CODE = ["esc", "wbBook", "wbPageFor", "wbMomEyes", "wbTaskLink", "wbOpenFor", "wbOpenCheck", "wbAssignFor", "wbAssignLast", "wbAssignClean", "wbAssignRender", "wbGoAssign", "wbOpen", "wbBarRender", "wbTool"].map(slice).join("\n");
let pass = 0, fail = 0;
function ok(n, c, x) { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x) + ")" : "")); } }

// ── a fake DOM just big enough for the viewer's shell: innerHTML registers any id="…" it contains ──
function fakeDoc() {
  const reg = {};
  const make = (id) => {
    const el = { id: id || "", style: {}, _html: "", remove() { if (this.id) delete reg[this.id]; },
      appendChild(c) { if (c.id) reg[c.id] = c; return c; }, insertAdjacentHTML() {}, getContext() { return null; } };
    Object.defineProperty(el, "innerHTML", { get() { return this._html; }, set(h) { this._html = h; const re = /id="([^"]+)"/g; let m; while ((m = re.exec(h))) if (!reg[m[1]]) reg[m[1]] = make(m[1]); } });
    return el;
  };
  return { reg, document: { getElementById: id => reg[id] || null, createElement: () => make(""), body: { appendChild(c) { if (c.id) reg[c.id] = c; } } } };
}
// A Reading-Detective-shaped book: printed page = PDF page − 11; exercise n starts on printed 14+2(n−1).
const ex = {}; for (let n = 1; n <= 52; n++) ex[n] = 14 + (n - 1) * 2;
const book = { id: "rd", name: "Reading Detective", pages: 193, toc: { offset: 11, ex, ans: { 45: 173, 46: 174 }, pre: 2, post: 140 } };
const lsBook = { id: "ls", name: "Language Smarts D", pages: 300, toc: { offset: 4 } };
function world(o) {
  o = o || {};
  const d = fakeDoc();
  const ctx = { console, JSON, String, Math, Object, Array, parseInt, wbBooks: { rd: book, ls: lsBook }, momHere: () => !!o.mom, adminPinUnlocked: false,
    currData: { subjects: { ellis: { read_detect: { workbook: "rd", display: "Reading Detective" }, lang_smarts: { workbook: "ls", name: "Language Smarts D" } } } },
    taskLessonRef: t => { const m = (t.title || "").match(/[—–]\s*(.+)$/); return m ? m[1].trim() : ""; },
    taskSubject: t => { const m = (t.title || "").match(/^.{1,2}\s*(.+?)\s*[—–]/); return m ? m[1].trim() : ""; },
    _todayDay: o.today === undefined ? "monday" : o.today, DAY_LBL: { monday: "Monday", tuesday: "Tuesday", wednesday: "Wednesday" },
    db: null, alert: () => {}, loads: 0, saves: 0, document: d.document, wbView: null,
    wbLoadPage() { ctx.loads++; }, wbSave() { ctx.saves++; if (ctx.wbView) ctx.wbView.dirty = false; const th = { then(f) { f(); return th; }, catch() { return th; } }; return th; },
    SL_KCOL: {}, SL_KLBL: {}, window: {} };
  vm.createContext(ctx); vm.runInContext(CODE, ctx);
  return { call: e => vm.runInContext(e, ctx), ctx, reg: d.reg };
}
const card = { id: "t1", who: "ellis", subjectKey: "read_detect", day: "monday", title: "📄 Reading Detective — Ex. 45–46" };
const lsCard = { id: "t2", who: "ellis", subjectKey: "lang_smarts", day: "monday", title: "📄 Language Smarts D — Pg 259–263" };

console.log("── the card's assignment ──");
{
  const w = world();
  const a = w.call("wbAssignFor(" + JSON.stringify(card) + ")");
  ok("wbAssignFor → {title, ref, day} from the card", a && a.title === "Reading Detective" && a.ref === "Ex. 45–46" && a.day === "monday", a);
  const b = w.call("wbAssignFor(" + JSON.stringify(lsCard) + ")");
  ok("a subject with `name` (no display) still names the banner", b && b.title === "Language Smarts D" && b.ref === "Pg 259–263", b);
  ok("a card with no lesson ref → null (nothing to show)", w.call("wbAssignFor({who:'ellis',subjectKey:'read_detect',title:'📄 Reading Detective'})") === null);
  const c = w.call("wbAssignFor({who:'x',subjectKey:'y',day:'tuesday',title:'📄 HWT Printing Power — Pg 49'})");
  ok("no subject record → the title's own subject name", c && c.title === "HWT Printing Power" && c.ref === "Pg 49" && c.day === "tuesday", c);
  ok("wbAssignFor never throws on junk", w.call("wbAssignFor(null)") === null && w.call("wbAssignFor(undefined)") === null);
}

console.log("\n── opts carry the assignment from a card ──");
{
  const w = world(); w.call("var opened=null; wbOpen=function(b,k,p,o){ opened={b,k,p,o}; };");
  w.call("wbOpenFor('rd','ellis',113," + JSON.stringify({ title: "Reading Detective", ref: "Ex. 45–46", day: "monday" }) + ")");
  const o = w.call("opened");
  ok("wbOpenFor passes opts.assignment = {title, ref, day}", o && o.b === "rd" && o.k === "ellis" && o.p === 113 && o.o && o.o.assignment && o.o.assignment.ref === "Ex. 45–46" && o.o.assignment.title === "Reading Detective" && o.o.assignment.day === "monday", o);
  w.call("opened=null; wbOpenFor('rd','ellis',102)");
  ok("wbOpenFor without a card → opts.assignment is null", w.call("opened.o.assignment") === null);
  const m = world({ mom: true }); m.call("var opened=null; wbOpen=function(b,k,p,o){ opened={b,k,p,o}; };");
  m.call("wbOpenCheck('rd','ellis',102,184," + JSON.stringify({ title: "Reading Detective", ref: "Ex. 45–46", day: "monday" }) + ")");
  const mo = m.call("opened");
  ok("Mom's Check answers keeps the key AND carries the assignment", mo && mo.o.ans === 184 && mo.o.assignment && mo.o.assignment.ref === "Ex. 45–46", mo);
}

console.log("\n── no banner without a card ──");
{
  const w = world(); w.call("wbOpen('rd','ellis',113)");
  ok("wbView.assignment is null", w.call("wbView.assignment") === null);
  ok("no #wb-assign element is drawn", !w.reg["wb-assign"]);
  ok("the toolbar still renders", /wbClose\(\)/.test(w.reg["wb-bar"].innerHTML) && /p 113 \/ 193/.test(w.reg["wb-bar"].innerHTML));
  const e = world(); e.call("wbOpen('rd','ellis',113,{rules:[3],eic:{book:'x'}})");
  ok("EIC's own opts (rules/eic) draw no banner either", e.call("wbView.assignment") === null && !e.reg["wb-assign"]);
  const j = world(); j.call("wbOpen('rd','ellis',113,{assignment:{title:'x'}})");
  ok("an assignment without a ref is dropped", j.call("wbView.assignment") === null && !j.reg["wb-assign"]);
}

console.log("\n── the banner ──");
{
  const w = world(); w.call("wbOpen('rd','ellis',113,{assignment:{title:'Reading Detective',ref:'Ex. 45–46',day:'monday'}})");
  const a = w.call("wbView.assignment");
  ok("wbView keeps the assignment with its first and last PDF page (Ex. 46 runs to the page before Ex. 47)", a && a.page === 113 && a.last === 116 && a.ref === "Ex. 45–46", a);
  const el = w.reg["wb-assign"];
  ok("#wb-assign sits in the viewer", !!el);
  ok("reads Today: Ex. 45–46", el && /Today:/.test(el.innerHTML) && /Ex\. 45–46/.test(el.innerHTML), el && el.innerHTML);
  ok("the subject is beside it, small", el && /font-size:11px[^>]*>Reading Detective</.test(el.innerHTML));
  ok("on the assigned page: no ↩", el && !/↩/.test(el.innerHTML));
  ok("the banner is a sibling of #wb-bar, not inside it", !/wb-assign/.test(w.reg["wb-bar"].innerHTML) && /id="wb-assign"/.test(w.reg["wb-view"].innerHTML));
  ok("the banner is drawn between the bar and the stage", (() => { const h = w.reg["wb-view"].innerHTML; return h.indexOf('id="wb-bar"') < h.indexOf('id="wb-assign"') && h.indexOf('id="wb-assign"') < h.indexOf('id="wb-stage"'); })());
  // another day's card (Mom looking ahead) names the day instead of "Today"
  const t = world(); t.call("wbOpen('rd','ellis',113,{assignment:{title:'Reading Detective',ref:'Ex. 45–46',day:'tuesday'}})");
  ok("a card from another day says that day, not Today", /Tuesday:/.test(t.reg["wb-assign"].innerHTML) && !/Today/.test(t.reg["wb-assign"].innerHTML), t.reg["wb-assign"].innerHTML);
  const n = world({ today: undefined }); n.ctx._todayDay = undefined; n.call("wbOpen('rd','ellis',113,{assignment:{title:'Reading Detective',ref:'Ex. 45–46',day:'tuesday'}})");
  ok("no known today → plain Today", /Today:/.test(n.reg["wb-assign"].innerHTML));
  // kid-safe: the ref is escaped, nothing about answers
  const x = world(); x.call("wbOpen('rd','ellis',113,{assignment:{title:'<b>x</b>',ref:'Ex. <1>',day:'monday'}})");
  ok("title and ref are HTML-escaped", /&lt;b&gt;x&lt;\/b&gt;/.test(x.reg["wb-assign"].innerHTML) && /Ex\. &lt;1&gt;/.test(x.reg["wb-assign"].innerHTML));
  const m = world({ mom: true }); m.call("wbOpen('rd','ellis',113,{ans:184,assignment:{title:'Reading Detective',ref:'Ex. 45–46',day:'monday'}})");
  ok("even Mom's check view puts no answer page in the banner", !/184/.test(m.reg["wb-assign"].innerHTML) && !/answer/i.test(m.reg["wb-assign"].innerHTML));
}

console.log("\n── paging away and ↩ back ──");
{
  const w = world(); w.call("wbOpen('rd','ellis',113,{assignment:{title:'Reading Detective',ref:'Ex. 45–46',day:'monday'}})");
  const el = w.reg["wb-assign"];
  w.call("wbView.page=114; wbBarRender()");
  ok("p114 is still inside Ex. 45–46 → no ↩", !/↩/.test(el.innerHTML), el.innerHTML);
  w.call("wbView.page=116; wbBarRender()");
  ok("p116 (Ex. 46's second page) is inside the range too", !/↩/.test(el.innerHTML));
  w.call("wbView.page=117; wbBarRender()");
  ok("paged past the assignment: banner stays, ↩ p. 113 appears", /Ex\. 45–46/.test(el.innerHTML) && /↩ p\. 113/.test(el.innerHTML), el.innerHTML);
  ok("the ↩ is a wbGoAssign tap", /onclick="wbGoAssign\(\)"/.test(el.innerHTML));
  w.call("wbView.page=43; wbBarRender()");
  ok("paged back before it: ↩ too", /↩ p\. 113/.test(el.innerHTML));
  const loads0 = w.ctx.loads;
  w.call("wbGoAssign()");
  ok("↩ jumps to the assignment's first page", w.call("wbView.page") === 113);
  ok("…and reloads the page image + ink", w.ctx.loads === loads0 + 1);
  ok("…and the ↩ is gone again", !/↩/.test(el.innerHTML));
  // an unsaved page saves first, like the arrows
  w.call("wbView.page=130; wbView.dirty=true; wbBarRender(); wbGoAssign()");
  ok("a dirty page is saved before the jump", w.ctx.saves === 1);
  ok("…then the jump lands", w.call("wbView.page") === 113);
  ok("wbGoAssign with no assignment is a no-op", (() => { const v = world(); v.call("wbOpen('rd','ellis',7)"); v.call("wbGoAssign()"); return v.call("wbView.page") === 7; })());
}

console.log("\n── the assigned page range, for every workbook ──");
{
  const w = world();
  ok("Ex. 45–46 → PDF 113..116 (through Ex. 46's spread)", JSON.stringify(w.call("(function(){var a=wbAssignClean({ref:'Ex. 45–46'},wbBooks.rd,113);return [a.page,a.last];})()")) === "[113,116]");
  ok("Ex. 45 (one exercise) → 113..114", JSON.stringify(w.call("(function(){var a=wbAssignClean({ref:'Ex. 45'},wbBooks.rd,113);return [a.page,a.last];})()")) === "[113,114]");
  ok("Ex. 52 (the book's last exercise) → its own page", JSON.stringify(w.call("(function(){var a=wbAssignClean({ref:'Ex. 52'},wbBooks.rd,127);return [a.page,a.last];})()")) === "[127,127]");
  ok("Pretest → its own page", JSON.stringify(w.call("(function(){var a=wbAssignClean({ref:'Pretest'},wbBooks.rd,13);return [a.page,a.last];})()")) === "[13,13]");
  ok("Pg 259–263 (Language Smarts, offset 4) → 263..267", JSON.stringify(w.call("(function(){var a=wbAssignClean({ref:'Pg 259–263'},wbBooks.ls,263);return [a.page,a.last];})()")) === "[263,267]");
  ok("Pg 49 → 53..53", JSON.stringify(w.call("(function(){var a=wbAssignClean({ref:'Pg 49'},wbBooks.ls,53);return [a.page,a.last];})()")) === "[53,53]");
  ok("a hyphen range works too (pg26-29)", JSON.stringify(w.call("(function(){var a=wbAssignClean({ref:'pg26-29'},wbBooks.rd,37);return [a.page,a.last];})()")) === "[37,40]");
  ok("a backwards range never ends before it starts", JSON.stringify(w.call("(function(){var a=wbAssignClean({ref:'Pg 30–20'},wbBooks.ls,34);return [a.page,a.last];})()")) === "[34,34]");
  ok("a range past the book's end falls back to the first page", JSON.stringify(w.call("(function(){var a=wbAssignClean({ref:'Pg 259–900'},wbBooks.ls,263);return [a.page,a.last];})()")) === "[263,263]");
  // the whole thing from a real card, via wbTaskLink's page
  const k = world(); const t = JSON.stringify(lsCard);
  const link = k.call("wbTaskLink(" + t + ")");
  ok("wbTaskLink still resolves the Language Smarts card to PDF 263", link && link.page === 263, link);
  k.call("wbOpenFor('ls','ellis'," + link.page + ",wbAssignFor(" + t + "))");
  ok("Language Smarts gets the same banner", /Today:/.test(k.reg["wb-assign"].innerHTML) && /Pg 259–263/.test(k.reg["wb-assign"].innerHTML) && /Language Smarts D/.test(k.reg["wb-assign"].innerHTML), k.reg["wb-assign"].innerHTML);
  k.call("wbView.page=270; wbBarRender()");
  ok("…and its ↩ p. 263", /↩ p\. 263/.test(k.reg["wb-assign"].innerHTML));
}

console.log("\n── the banner survives wbBarRender (DOM-only redraws) ──");
{
  const w = world(); w.call("wbOpen('rd','ellis',113,{assignment:{title:'Reading Detective',ref:'Ex. 45–46',day:'monday'}})");
  const el = w.reg["wb-assign"]; const before = el.innerHTML;
  w.call("wbBarRender(); wbBarRender(); wbTool('erase'); wbTool('pen'); wbView.dirty=true; wbBarRender();");
  ok("still the same element", w.reg["wb-assign"] === el);
  ok("still shows the assignment", el.innerHTML === before, el.innerHTML);
  ok("the bar redrew without touching it", /🩹 Erase/.test(w.reg["wb-bar"].innerHTML) && !/wb-assign/.test(w.reg["wb-bar"].innerHTML));
  ok("the bar's own pieces are all still there (✕, arrows, pen, undo, save)", ["wbClose()", "wbGo(-1)", "wbGo(1)", "wbTool('pen')", "wbUndo()", "wbSave()"].every(f => w.reg["wb-bar"].innerHTML.indexOf(f) >= 0));
  ok("wbBarRender calls wbAssignRender", /try\{ wbAssignRender\(\); \}catch\(e\)\{\}/.test(slice("wbBarRender")));
  ok("wbAssignRender with no banner element is a no-op", (() => { const v = world(); v.call("wbOpen('rd','ellis',7)"); v.call("wbAssignRender()"); return !v.reg["wb-assign"]; })());
}

console.log("\n── wiring in index.html ──");
{
  const i = src.indexOf("const wbRow="); const row = src.slice(i, src.indexOf("\n", src.indexOf("wbOpenCheck", i)));
  ok("the card's 📕 Open chip hands wbOpenFor the assignment", row.indexOf(String.raw`wbOpenFor(\''+_wbl.bookId+'\',\''+t.who+'\','+_wbl.page+','+esc(JSON.stringify(wbAssignFor(t)))+')"`) >= 0, row.slice(0, 260));
  ok("Mom's Check answers chip hands it along too", row.indexOf(String.raw`wbOpenCheck(\''+_wbl.bookId+'\',\''+t.who+'\','+_wbl.page+','+_wbl.ans+','+esc(JSON.stringify(wbAssignFor(t)))+')"`) >= 0);
  const open = slice("wbOpen");
  ok("wbOpen cleans opts.assignment and keeps it on wbView", /const assign=wbAssignClean\(opts&&opts\.assignment,b,page\);/.test(open) && /assignment:assign\}/.test(open));
  ok("wbOpen draws #wb-assign only when there is an assignment", /\(assign\?'<div id="wb-assign" style="[^"]*"><\/div>':''\)\+/.test(open));
  ok("the banner is slim and flex:none — the stage below keeps flex:1", /id="wb-assign" style="display:flex;[^"]*padding:5px 12px;[^"]*flex:none;/.test(open));
  ok("the Workbooks panel opens without a card", src.indexOf(String.raw`wbPanelClose();wbOpen(\''+b.id+'\',\''+k+'\',1)"`) >= 0);
  const boot = slice("wbBootFromUrl");
  ok("the ?workbook= door opens without a card", /wbOpen\(id,kid,pg\);/.test(boot) && !/assignment/.test(boot));
  ok("the block is marked for slicing", src.indexOf("// WB_ASSIGN_START") > 0 && src.indexOf("// WB_ASSIGN_END") > src.indexOf("// WB_ASSIGN_START"));
  const blk = src.slice(src.indexOf("// WB_ASSIGN_START"), src.indexOf("// WB_ASSIGN_END"));
  ok("the block never writes to (or reads from) db", !/\bdb\.\w+\(/.test(blk) && !/\.set\(|\.update\(|\.remove\(|\.push\(|firebase/.test(blk));
  ok("the block never touches the answer page", !/\.ans\b|wbAnsPageFor/.test(blk));
  ok("no 🔀 anywhere", src.indexOf("\u{1F500}") < 0);
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
