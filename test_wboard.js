// ✍️ WBOARD — a scratch whiteboard on Today's card (Sara's answer 2026-11-20 via PLAN_unit_activity_types §6.9/§7.2; "go with her
//   answers and build" 2026-11-22). Runs the REAL viewer pieces (bar, pointer plumbing, fit, paint, undo/erase/clear, save, close)
//   + the WBOARD block + DAYCARD against a fake DOM, canvas and db.
//   · the block is marked, small, and writes nothing: no db / Storage / localStorage anywhere in it
//   · the door sits in Today's card top bar and carries the unit day; wbdOpen opens a blank full-screen board on the viewer's tools
//   · finger draws (thicker pen), Mom red / others blue, a Pencil flips to pencil-only; erase, undo, clear, blank · grid
//   · the shape holds when the iPad turns; works with no ResizeObserver (the LG)
//   · autosave and ✕ write nothing; ✕ throws the drawing away; a workbook page that is open is never wiped
//   · baselines = this tree minus the feature: the viewer's bar, pen and save, and the day card, are byte-identical without it
//   run: node test_wboard.js
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const cut = (s, a, b) => { const i = s.indexOf(a), j = s.indexOf(b, i); if (i < 0 || j < 0) throw new Error("markers " + a); return s.slice(i, j + b.length); };
const fnOf = (s, name) => { let i = s.indexOf("function " + name + "("); if (i < 0) throw new Error("no " + name); if (s.slice(i - 6, i) === "async ") i -= 6;   // braces matched, strings skipped
  let d = 0, q = null; for (let j = s.indexOf("{", i); j < s.length; j++) { const c = s[j]; if (q) { if (c === "\\") j++; else if (c === q) q = null; continue; }
    if (c === "/" && s[j + 1] === "/") { j = s.indexOf("\n", j); continue; }   // a comment's "don't" is not a string
    if (c === "'" || c === '"' || c === "`") q = c; else if (c === "{") d++; else if (c === "}" && --d === 0) return s.slice(i, j + 1); } throw new Error("unclosed " + name); };
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x) : "")); } };
const WBD = cut(src, "// WBOARD_START", "// WBOARD_END");
// the tree minus the feature: the block out, each hook back to the line it replaced
const HOOKS = [
  ["  if(typeof wbdDoorHTML===\"function\") h+=wbdDoorHTML(g);   // WBOARD: ✍️ Whiteboard — Mom's door, for whoever is at the screen\n", ""],
  ["  bar.innerHTML=(v.scratch&&typeof wbdBarHTML===\"function\")?wbdBarHTML(v,btn):   // WBOARD: the whiteboard's own bar (no book, no pages, no save)\n", "  bar.innerHTML=\n"],
  ["    const _pw=wbView.penW||0.0026, w=_pw+_pw*(e.pressure&&e.pressure>0?e.pressure:0.5);   // WBOARD: penW = the whiteboard's thicker finger pen", "    const w=0.0026+0.0026*(e.pressure&&e.pressure>0?e.pressure:0.5);"],
  ["  const v=wbView; if(!v||v.scratch) return;   // WBOARD: a scratch whiteboard never writes", "  const v=wbView; if(!v) return;"]];
let BASE = src.replace(WBD + "\n", "");
HOOKS.forEach(([a, b]) => { BASE = BASE.split(a).join(b); });
const VIEW_FNS = ["wbBook", "wbInkPath", "wbAssignRender", "wbBarRender", "wbTool", "wbTogglePen", "wbFit", "wbWatchFit", "wbPaint", "wbPt", "wbEraseAt", "wbUndo", "wbClear", "wbMarkDirty", "wbAutoSaveSoon", "wbSave", "wbClose"];
const viewer = s => ["var wbView=null, _wbAutoT=null, _wbRO=null, wbBooks={bk:{id:'bk',name:'Book',pages:3,imgs:{}}}; const WB_PEN=\"#1d4ed8\", WB_MOMPEN=\"#dc2626\";",
  ...VIEW_FNS.map(n => fnOf(s, n)), s.slice(s.indexOf("(function wbBindOnce(){"), s.indexOf("function wbPt("))].join("\n");

// ── a fake DOM: innerHTML registers any id="…"; rects follow the stage and the hold's px size; canvases record paint ──
function world(o) {
  o = o || {}; const reg = {}, writes = [], timers = [], listeners = {}, winL = {}, ROs = [];
  const stage = { w: o.w || 1000, h: o.h || 700 };
  const holdRect = () => { const hs = reg["wb-hold"] && reg["wb-hold"].style; const w = parseFloat(hs && hs.width) || 0, h = parseFloat(hs && hs.height) || 0; return { left: 8, top: 60, width: w, height: h }; };
  const make = id => {
    const el = { id: id || "", style: {}, attrs: {}, _html: "", width: 0, height: 0, ops: [], setAttribute(k, v) { this.attrs[k] = v; },
      remove() { Object.keys(reg).forEach(k => { if (k === this.id || (this._kids || []).indexOf(k) >= 0) delete reg[k]; }); this.removed = true; },
      insertAdjacentHTML() {}, setPointerCapture() {},
      getBoundingClientRect() { if (this.id === "wbd-stage") return { left: 0, top: 52, width: stage.w, height: stage.h }; if (/^wb-(img|ink|hold)$/.test(this.id)) return holdRect(); return { left: 0, top: 0, width: 0, height: 0 }; },
      getContext() { const ops = this.ops; return new Proxy({}, { get: (t, k) => (typeof k === "string" && /^(clearRect|beginPath|moveTo|lineTo|stroke|fillRect|drawImage)$/.test(k)) ? ((...a) => ops.push([k, ...a])) : t[k], set: (t, k, v) => { t[k] = v; ops.push(["=" + k, v]); return true; } }); } };
    Object.defineProperty(el, "innerHTML", { get() { return this._html; }, set(h) { this._html = h; const re = /id="([^"]+)"/g; let m; this._kids = []; while ((m = re.exec(h))) { if (!reg[m[1]]) reg[m[1]] = make(m[1]); this._kids.push(m[1]); } } });
    return el;
  };
  const ctx = { console, JSON, Object, Array, String, Number, Math, Promise, Error, Date, parseInt, Proxy,
    momHere: () => !!o.mom, _dryRun: () => false, confirm: () => true, alert: m => { throw new Error("alert " + m); }, dbg: () => {}, SL_KCOL: {}, SL_KLBL: {},
    db: { ref: p => { const r = { set: v => { writes.push(["set", p, v]); return Promise.resolve(); }, update: v => { writes.push(["update", p, v]); return Promise.resolve(); }, once: () => { writes.push(["read", p]); return Promise.resolve({ val: () => null }); } }; return r; } },
    setTimeout: (f, ms) => { timers.push({ f, ms, live: true }); return timers.length; }, clearTimeout: i => { if (i && timers[i - 1]) timers[i - 1].live = false; },
    document: { getElementById: id => reg[id] || null, createElement: () => make(""), body: { appendChild(c) { if (c.id) reg[c.id] = c; (c._kids || []).forEach(k => {}); return c; } },
      addEventListener: (t, f) => { (listeners[t] = listeners[t] || []).push(f); } },
    window: { devicePixelRatio: 2, addEventListener: (t, f) => { (winL[t] = winL[t] || []).push(f); } },
    haDragOn() {}, haDragOff() {} };
  if (o.ro) ctx.ResizeObserver = function (cb) { this.observe = el => ROs.push({ el, cb }); this.disconnect = () => {}; };
  vm.createContext(ctx);
  vm.runInContext(viewer(o.base ? BASE : src) + "\n" + (o.base ? "" : WBD), ctx);
  const fire = (t, e) => (listeners[t] || []).forEach(f => f(e));
  const ev = (x, y, pt, extra) => Object.assign({ target: reg["wb-ink"], pointerType: pt || "touch", clientX: x, clientY: y, pressure: 0.5, pointerId: 1, buttons: 1, prevented: 0, preventDefault() { this.prevented++; } }, extra || {});
  const stroke = (pts, pt) => { fire("pointerdown", ev(pts[0][0], pts[0][1], pt)); pts.slice(1).forEach(p => fire("pointermove", ev(p[0], p[1], pt))); fire("pointerup", {}); };
  const runTimers = () => { let n = 0; timers.filter(t => t.live).forEach(t => { t.live = false; t.f(); n++; }); return n; };
  return { ctx, reg, writes, timers, fire, ev, stroke, runTimers, stage, winL, ROs, call: e => vm.runInContext(e, ctx) };
}
const flush = () => new Promise(r => setImmediate(r));

(async () => {
console.log("── the block ──");
ok("WBOARD is a marked block, ~4–6 KB of code (comments aside)", WBD.length > 2500 && WBD.replace(/^\s*\/\/.*$/gm, "").length < 6000, WBD.replace(/^\s*\/\/.*$/gm, "").length);
ok("it writes nothing: no db, no Storage, no localStorage, no fetch", !/db\.ref|\bdb\b\s*&&|firebase|HA_LS|localStorage|sessionStorage|setItem|fetch\(|XMLHttpRequest/.test(WBD.replace(/^\s*\/\/.*$/gm, "")));
ok("no 🔀, no data URI", WBD.indexOf("\u{1F500}") < 0 && !/data:image/.test(WBD));
ok("the opener for the activity rows is wbOpen's sibling wbdOpen(opts)", /\nfunction wbdOpen\(opts\)\{/.test(WBD));
ok("exactly four hooks outside the block, each guarded (DAYCARD door · bar · pen width · save)", HOOKS.every(([a]) => src.split(a).length === 2) && (src.replace(WBD, "").match(/WBOARD:/g) || []).length === 4);
ok("the door hook sits in DAYCARD's top bar (dcPageHTML), not in the activity rows", fnOf(src, "dcPageHTML").indexOf(HOOKS[0][0].trim()) > 0 && !/wbd/.test(fnOf(src, "dcDayHTML")) && !/wbd/.test(cut(src, "// UNITACTCHK_START", "// UNITACTCHK_END")));

console.log("── baselines: the tree minus the feature ──");
{
  const view = { bookId: "bk", kid: "k1", page: 2, strokes: [], dirty: true, tool: "pen", penOnly: false, sawPen: false };
  const bar = o => { const w = world(o); w.ctx.document.body.appendChild(Object.assign(w.ctx.document.createElement("div"), { id: "x" })); w.reg["wb-bar"] = w.ctx.document.createElement("div"); w.reg["wb-bar"].id = "wb-bar"; w.ctx.wbView = JSON.parse(JSON.stringify(view)); w.call("wbBarRender()"); return w.reg["wb-bar"].innerHTML; };
  ok("a workbook page's bar is byte-identical with and without WBOARD (Kid · Mom)", bar({}) === bar({ base: true }) && bar({ mom: true }) === bar({ mom: true, base: true }) && /p 2 \/ 3/.test(bar({})));
  const ink = o => { const w = world(o); w.reg["wb-ink"] = w.ctx.document.createElement("canvas"); w.reg["wb-ink"].id = "wb-ink"; w.reg["wb-img"] = w.reg["wb-ink"]; w.reg["wb-hold"] = { style: { width: "500px", height: "650px" } };
    w.ctx.wbView = JSON.parse(JSON.stringify(view)); w.stroke([[50, 100], [80, 140], [120, 200]], "touch"); w.stroke([[60, 90], [70, 95]], "pen"); return w; };
  const a = ink({}), b = ink({ base: true });
  ok("a workbook stroke (finger, then Pencil) records the same points, width and colour as before", JSON.stringify(a.ctx.wbView.strokes) === JSON.stringify(b.ctx.wbView.strokes) && a.ctx.wbView.strokes[0].w === 0.0039 && a.ctx.wbView.penOnly === true);
  a.runTimers(); await flush(); b.runTimers(); await flush();
  ok("…and its autosave writes the same one page, one path", JSON.stringify(a.writes, (k, x) => k === "ts" ? 0 : x) === JSON.stringify(b.writes, (k, x) => k === "ts" ? 0 : x) && a.writes.length === 1 && typeof a.writes[0][2].ts === "number" && a.writes[0][1] === "workbookWork/k1/bk/2");
  // the day card, with no family time and with a unit day: only the door differs
  const dcWorld = base => { const c = { console, JSON, Object, Array, String, Math, Date, parseInt, isFinite, getActiveTasks: () => [], _todayDay: "monday", _todayStr: () => "2026-11-23", momHere: () => true };
    vm.createContext(c); vm.runInContext(cut(base ? BASE : src, "// DAYCARD_START", "// DAYCARD_END") + "\n" + (base ? "" : WBD), c); return c; };
  const G = { bid: "b1", key: "k", b: { name: "Family time" }, it: { name: "History" }, day: { uid: "u1", id: "d6", n: 6, t: "Giving thanks" }, u: { emoji: "*" }, copies: [], present: [], first: null, done: false };
  const page = (base, g) => { const c = dcWorld(base); if (g) c.dcTodayGroups = () => [g]; c.dcState = { bid: "b1", key: "k" }; return c.dcPageHTML(); };
  const door = /<button data-wbd-door="1"[^>]*>[^<]*<\/button>/;
  ok("Today's card with no family time: the page is the old page plus the door", page(false).replace(door, "") === page(true) && door.test(page(false)));
  ok("Today's card on a unit day: the page is the old page plus the door", page(false, G).replace(door, "") === page(true, G) && door.test(page(false, G)));
  const h = page(false, G);
  ok("the door sits in the top bar, after ← Back and before the date", h.indexOf("← Back") < h.indexOf("data-wbd-door") && h.indexOf("data-wbd-door") < h.indexOf("2026-11-23") && h.indexOf("data-wbd-door") < h.indexOf("<h1"));
  ok("the door carries the card's unit day (for 💾 Save) and reads ✍️ Whiteboard", /onclick="wbdOpen\(\{uid:'u1',dayId:'d6'\}\)"/.test(h) && />✍️ Whiteboard<\/button>/.test(h));
  ok("a card with no unit day opens a board with nothing", /onclick="wbdOpen\(\{\}\)"/.test(page(false)));
}

console.log("── the board ──");
{
  const w = world();
  ok("wbdOpen opens it", w.call("wbdOpen({uid:'u1',dayId:'d6'})") === true);
  const ov = w.reg["wb-view"], v = w.ctx.wbView, bar = w.reg["wb-bar"].innerHTML;
  ok("full screen, above the app, no text selection on a long press", /position:fixed;top:0;left:0;right:0;bottom:0;z-index:10050/.test(ov.style.cssText) && /user-select:none/.test(ov.style.cssText) && ov.attrs["data-wbd"] === "1");
  ok("one blank page: the viewer's ink canvas (#wb-ink, touch-action:none), no picture, no book", !!w.reg["wb-ink"] && /<canvas style="[^"]*touch-action:none[^"]*" id="wb-ink">/.test(ov.innerHTML) && !/<img/.test(ov.innerHTML) && v.bookId === "");
  ok("the viewer's tools: ✕ · ✏️ · 🩹 Erase · ↩︎ Undo · 🧽 Clear · 👆 Finger too, plus ▢ Blank / ▦ Grid", ["wbClose()", "wbTool('pen')", "wbTool('erase')", "wbUndo()", "wbClear()", "wbTogglePen()", "wbdBg('blank')", "wbdBg('grid')"].every(f => bar.indexOf(f) > 0) && /👆 Finger too/.test(bar) && /✍️ Whiteboard/.test(bar));
  ok("no book name, no page arrows, no 💾 page save", !/wbGo\(|wbSave\(|p \d|💾/.test(bar));
  ok("finger-first: finger draws by default, a thicker pen", v.penOnly === false && v.penW === 0.0045 && v.scratch === true && v.uid === "u1" && v.dayId === "d6");
  ok("the board fills the space under the bar (8 px round) at its opening shape", w.reg["wb-hold"].style.width === "984px" && w.reg["wb-hold"].style.height === "684px" && w.reg["wb-ink"].width === 1968 && w.reg["wb-ink"].height === 1368, [w.reg["wb-hold"].style.width, w.reg["wb-hold"].style.height, w.reg["wb-ink"].width]);
  w.stroke([[108, 160], [208, 260], [308, 360]], "touch");
  const s = v.strokes[0];
  ok("a finger stroke draws: normalised points, the thick pen, blue for a kid", v.strokes.length === 1 && s.p.length === 3 && s.p[0][0] === 0.1016 && s.w === 0.00675 && s.c === "#1d4ed8", s);
  ok("…and paints on the canvas at the board's width", w.reg["wb-ink"].ops.some(op => op[0] === "=lineWidth" && Math.abs(op[1] - 0.00675 * 1968) < 1e-6));
  w.stage.w = 700; w.stage.h = 1000; (w.winL.resize || []).forEach(f => f());
  ok("the iPad turns: same shape, smaller — never stretched (no ResizeObserver: the window's resize, as on the LG)", w.reg["wb-hold"].style.width === "684px" && w.reg["wb-hold"].style.height === Math.round(684 / (984 / 684)) + "px" && w.reg["wb-ink"].width === 1368, [w.reg["wb-hold"].style.width, w.reg["wb-hold"].style.height]);
  ok("…the drawing stays put (points are of the board, not the screen)", v.strokes[0].p[0][0] === 0.1016);
  w.call("wbdBg('grid')");
  ok("▦ Grid: squares under the ink, 20 across (CSS only; nothing drawn into the ink)", /linear-gradient/.test(w.reg["wb-hold"].style.backgroundImage) && w.reg["wb-hold"].style.backgroundSize === "34.20px 34.20px" && /background:#dbeafe[^"]*">▦ Grid/.test(w.reg["wb-bar"].innerHTML) && v.strokes.length === 1);
  w.call("wbdBg('blank')"); ok("▢ Blank takes it off", w.reg["wb-hold"].style.backgroundImage === "none");
  w.call("wbTool('erase')"); w.fire("pointerdown", w.ev(8 + 0.1016 * 684, 60 + s.p[0][1] * parseFloat(w.reg["wb-hold"].style.height), "touch"));
  ok("🩹 Erase takes the stroke under the finger", v.strokes.length === 0);
  w.call("wbTool('pen')"); w.stroke([[100, 100], [150, 150]]); w.stroke([[200, 200], [250, 250]]); w.call("wbUndo()");
  ok("↩︎ Undo takes the last stroke", v.strokes.length === 1);
  w.call("wbClear()"); ok("🧽 Clear wipes the board", v.strokes.length === 0);
  w.stroke([[100, 100], [120, 130]], "pen");
  ok("a real Pencil flips it to pencil-only (palm rests), and the canvas lets a finger scroll then", v.penOnly === true && w.reg["wb-ink"].style.touchAction === "pan-x pan-y" && /✍️ Pencil only/.test(w.reg["wb-bar"].innerHTML));
  const f = w.ev(300, 300, "touch"); w.fire("pointerdown", f);
  ok("…a finger then makes no mark", v.strokes.length === 1 && f.prevented === 0);
  w.call("wbTogglePen()"); ok("👆 Finger too switches back", v.penOnly === false && w.reg["wb-ink"].style.touchAction === "none");
  ok("the grid pick is remembered for the next board this sitting", (w.call("wbdBg('grid')"), w.call("_wbdBg")) === "grid");
  const n = w.runTimers(); await flush();
  ok("the 3 s autosave fires and writes nothing", n >= 1 && w.writes.length === 0);
  w.call("wbClose()"); await flush();
  ok("✕ closes: the board is gone, the drawing thrown away, nothing written", w.ctx.wbView === null && !w.reg["wb-view"] && !w.reg["wb-ink"] && w.writes.length === 0);
  w.call("wbdOpen({})");
  ok("the next board opens empty, on the grid picked before, with no unit day", w.ctx.wbView.strokes.length === 0 && w.ctx.wbView.bg === "grid" && w.ctx.wbView.uid === "" && /linear-gradient/.test(w.reg["wb-hold"].style.backgroundImage));
}
{
  const w = world({ mom: true, ro: true });
  w.call("wbdOpen({uid:'u1',dayId:'d6'})"); w.stroke([[100, 100], [150, 150]]);
  ok("Mom's device: Mom's red pen", w.ctx.wbView.strokes[0].c === "#dc2626");
  ok("with a ResizeObserver: the stage is watched (a turn re-fits) and so is the page (the viewer's own)", w.ROs.some(r => r.el && r.el.id === "wbd-stage") && w.ROs.some(r => r.el && r.el.id === "wb-img"));
  w.stage.w = 600; w.ROs.filter(r => r.el.id === "wbd-stage").forEach(r => r.cb());
  ok("…and its callback re-fits", w.reg["wb-hold"].style.width === "584px");
  w.call("wbClose()"); await flush(); ok("nothing written on Mom's device either", w.writes.length === 0);
}
{
  const w = world(); w.ctx.wbView = { bookId: "bk", kid: "k1", page: 2, strokes: [{ p: [[0.1, 0.1]] }], dirty: true };
  ok("a workbook page that is open is never wiped: wbdOpen refuses", w.call("wbdOpen({})") === false && w.ctx.wbView.bookId === "bk" && w.ctx.wbView.strokes.length === 1);
}
{
  const w = world(); w.ctx.document.body = null;
  ok("no page body (a test, a worker): wbdOpen does nothing", w.call("wbdOpen({})") === false);
  ok("an update waits while the board is open (haBusyReason already holds for any open wbView)", /if\(typeof wbView!=="undefined"&&wbView\) return "workbook open";/.test(fnOf(src, "haBusyReason")));
}
console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
})();
