// ▤ WBDLINES — handwriting lines on the whiteboard (Adrienne's yes 2026-11-24): a beta family starts Logic of English
//   Foundations A; Lesson 1 teaches the top line, the dotted midline and the baseline, and Mom writes big on a lined board for
//   the child to trace. They have no physical board, so the on-screen one gets a third background, ▤ Lines.
//   Runs the REAL viewer pieces + WBOARD + WBDLINES + WBDSAVE (for its picture, wbdJpeg) against a fake DOM, canvas and db.
//   · the block is marked, small, after WBOARD; its four call sites are WBOARD's wbdFit / wbdBg / bar and WBDSAVE's wbdJpeg
//   · wbdBg takes blank · grid · lines; anything else is blank. Blank stays the default
//   · baseline = this tree minus the block and its call sites: Blank and Grid draw byte-identically (styles, bar, picture)
//   · Lines: each row a solid top line, a dashed midline halfway, a darker, heavier baseline; top→base = 1/8 of the board's
//     width, half that between rows; it scales with the board (a turned iPad) and sits in the same place under the ink;
//     the 💾 Save picture has the same rows
//   · the pick is remembered for the next board this sitting; nothing is written anywhere
//   run: node test_wbd_lines.js
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const cut = (s, a, b) => { const i = s.indexOf(a), j = s.indexOf(b, i); if (i < 0 || j < 0) throw new Error("markers " + a); return s.slice(i, j + b.length); };
const fnOf = (s, name) => { let i = s.indexOf("function " + name + "("); if (i < 0) throw new Error("no " + name); if (s.slice(i - 6, i) === "async ") i -= 6;   // braces matched, strings + comments skipped
  let d = 0, q = null; for (let j = s.indexOf("{", i); j < s.length; j++) { const c = s[j]; if (q) { if (c === "\\") j++; else if (c === q) q = null; continue; }
    if (c === "/" && s[j + 1] === "/") { j = s.indexOf("\n", j); continue; }
    if (c === "'" || c === '"' || c === "`") q = c; else if (c === "{") d++; else if (c === "}" && --d === 0) return s.slice(i, j + 1); } throw new Error("unclosed " + name); };
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x) : "")); } };
const near = (a, b, e) => Math.abs(a - b) <= (e || 0.011);

const LN = cut(src, "// WBDLINES_START", "// WBDLINES_END");
const code = s => s.replace(/^\s*\/\/.*$/gm, "");

// ── the tree minus the feature: the block out, each call site back to the line it replaced (each must match once) ──
const lineWith = (s, needle) => { const L = s.split("\n").filter(l => l.indexOf(needle) >= 0); if (L.length !== 1) throw new Error("call site " + needle + " x" + L.length); return L[0]; };
const SITES = [
  ["wbdFit: the Lines CSS", lineWith(src, "wbdLinesCss(hold.style"), null],
  ["wbdBg: a third pick", lineWith(src, 'k==="lines"?k:"blank"'), l => l.replace('(k==="grid"||k==="lines"?k:"blank")', '(k==="grid"?"grid":"blank")').replace("   // WBDLINES: + lines", "")],
  ["the bar: the Lines button", lineWith(src, 'Lines","wbdBg('), l => l.replace('&&v.bg!=="lines"', "").replace(/\+btn\("[^"]*Lines","wbdBg\([^)]*\)",v\.bg==="lines"\)/, "").replace("   // WBDLINES", "")],
  ["wbdJpeg: the rows on the Save picture", lineWith(src, ") wbdLinesDraw(g,W,H)"), null]];
let BASE = src; const matched = [];
const once = (from, to) => { matched.push(BASE.split(from).length - 1); BASE = BASE.split(from).join(to); };
once(LN + "\n", "");
SITES.forEach(([, l, f]) => f ? once(l, f(l)) : once(l + "\n", ""));
const WBD = cut(src, "// WBOARD_START", "// WBOARD_END"), SV = cut(src, "// WBDSAVE_START", "// WBDSAVE_END");
const WBD_B = cut(BASE, "// WBOARD_START", "// WBOARD_END"), SV_B = cut(BASE, "// WBDSAVE_START", "// WBDSAVE_END");
const VIEW = ["var wbView=null, _wbAutoT=null, _wbRO=null, wbBooks={}; const WB_PEN=\"#1d4ed8\", WB_MOMPEN=\"#dc2626\";",
  ...["wbBook", "wbInkPath", "wbAssignRender", "wbBarRender", "wbTool", "wbTogglePen", "wbFit", "wbWatchFit", "wbPaint", "wbPt", "wbEraseAt", "wbUndo", "wbClear", "wbMarkDirty", "wbAutoSaveSoon", "wbSave", "wbClose"].map(n => fnOf(src, n)),
  src.slice(src.indexOf("(function wbBindOnce(){"), src.indexOf("function wbPt("))].join("\n");

// ── a fake DOM (test_wboard's): innerHTML registers ids; rects follow the stage and the hold's px size; canvases record paint ──
function world(o) {
  o = o || {}; const reg = {}, writes = [], storage = [], timers = [], listeners = {}, winL = {}, canvases = [];
  const stage = { w: o.w || 1000, h: o.h || 700 };
  const holdRect = () => { const hs = reg["wb-hold"] && reg["wb-hold"].style; return { left: 8, top: 60, width: parseFloat(hs && hs.width) || 0, height: parseFloat(hs && hs.height) || 0 }; };
  const make = id => {
    const el = { id: id || "", style: {}, attrs: {}, _html: "", width: 0, height: 0, ops: [], setAttribute(k, v) { this.attrs[k] = v; },
      remove() { Object.keys(reg).forEach(k => { if (k === this.id || (this._kids || []).indexOf(k) >= 0) delete reg[k]; }); },
      insertAdjacentHTML() {}, setPointerCapture() {}, toDataURL(t, q) { this.ops.push(["toDataURL", t, q]); return "data:image/jpeg;base64,AA=="; },
      getBoundingClientRect() { if (this.id === "wbd-stage") return { left: 0, top: 52, width: stage.w, height: stage.h }; if (/^wb-(img|ink|hold)$/.test(this.id)) return holdRect(); return { left: 0, top: 0, width: 0, height: 0 }; },
      getContext() { const ops = this.ops; return new Proxy({}, { get: (t, k) => (typeof k === "string" && /^(clearRect|beginPath|moveTo|lineTo|stroke|fillRect|drawImage|setLineDash|arc|fill)$/.test(k)) ? ((...a) => ops.push([k, ...a])) : t[k], set: (t, k, v) => { t[k] = v; ops.push(["=" + k, v]); return true; } }); } };
    Object.defineProperty(el, "innerHTML", { get() { return this._html; }, set(h) { this._html = h; const re = /id="([^"]+)"/g; let m; this._kids = []; while ((m = re.exec(h))) { if (!reg[m[1]]) reg[m[1]] = make(m[1]); this._kids.push(m[1]); } } });
    return el;
  };
  const spyStore = name => new Proxy({}, { get: (t, k) => { storage.push([name, String(k)]); return () => null; } });
  const ctx = { console, JSON, Object, Array, String, Number, Math, Promise, Error, Date, parseInt, isNaN, isFinite, Proxy,
    momHere: () => !!o.mom, _dryRun: () => false, confirm: () => true, alert: m => { throw new Error("alert " + m); }, dbg: () => {}, SL_KCOL: {}, SL_KLBL: {},
    db: { ref: p => ({ set: v => { writes.push(["set", p, v]); return Promise.resolve(); }, update: v => { writes.push(["update", p, v]); return Promise.resolve(); }, remove: () => { writes.push(["remove", p]); return Promise.resolve(); }, once: () => { writes.push(["read", p]); return Promise.resolve({ val: () => null }); } }) },
    firebase: { storage: () => { writes.push(["storage"]); return {}; } }, localStorage: spyStore("localStorage"), sessionStorage: spyStore("sessionStorage"), HA_LS: spyStore("HA_LS"),
    setTimeout: (f, ms) => { timers.push({ f, ms, live: true }); return timers.length; }, clearTimeout: i => { if (i && timers[i - 1]) timers[i - 1].live = false; },
    document: { getElementById: id => reg[id] || null, createElement: t => { const c = make(""); if (t === "canvas") canvases.push(c); return c; }, body: { appendChild(c) { if (c.id) reg[c.id] = c; return c; } },
      addEventListener: (t, f) => { (listeners[t] = listeners[t] || []).push(f); } },
    window: { devicePixelRatio: 2, addEventListener: (t, f) => { (winL[t] = winL[t] || []).push(f); } }, haDragOn() {}, haDragOff() {} };
  vm.createContext(ctx);
  vm.runInContext(VIEW + "\n" + (o.base ? WBD_B + "\n" + SV_B : WBD + "\n" + LN + "\n" + SV), ctx);
  const ev = (x, y) => ({ target: reg["wb-ink"], pointerType: "touch", clientX: x, clientY: y, pressure: 0.5, pointerId: 1, buttons: 1, preventDefault() {} });
  const fire = (t, e) => (listeners[t] || []).forEach(f => f(e));
  const stroke = pts => { fire("pointerdown", ev(pts[0][0], pts[0][1])); pts.slice(1).forEach(p => fire("pointermove", ev(p[0], p[1]))); fire("pointerup", {}); };
  const runTimers = () => { let n = 0; timers.filter(t => t.live).forEach(t => { t.live = false; t.f(); n++; }); return n; };
  const turn = (W, H) => { stage.w = W; stage.h = H; (winL.resize || []).forEach(f => f()); };
  return { ctx, reg, writes, storage, canvases, stroke, runTimers, turn, call: e => vm.runInContext(e, ctx),
    hold: () => reg["wb-hold"].style, bar: () => reg["wb-bar"] ? reg["wb-bar"].innerHTML : "",
    jpeg: () => { vm.runInContext("wbdJpeg(wbView)", ctx); return canvases[canvases.length - 1]; } };
}
const flush = async () => { for (let i = 0; i < 5; i++) await new Promise(r => setImmediate(r)); };
const LINES_BTN = /<button[^>]*>▤ Lines<\/button>/;
const on = (bar, label) => new RegExp('background:#dbeafe[^"]*">' + label).test(bar);
// the Lines CSS, read back: four layers (top · base · white gaps · midline), each line's centre and thickness in px, the tile
const parseCss = st => {
  const layers = (st.backgroundImage.match(/linear-gradient\([^()]*\)/g) || []);
  const line = g => { const m = g.match(/^linear-gradient\(transparent ([\d.]+)px,(#[0-9a-f]+) ([\d.]+)px,\2 ([\d.]+)px,transparent ([\d.]+)px\)$/); return m ? { y: (+m[3] + +m[4]) / 2, h: +m[4] - +m[3], c: m[2] } : null; };
  const sz = st.backgroundSize.split(",").map(x => x.trim().split(" "));
  return { n: layers.length, top: line(layers[0] || ""), base: line(layers[1] || ""), gaps: layers[2], mid: line(layers[3] || ""), sz };
};
const lum = c => { const n = parseInt(c.slice(1), 16); return 0.2126 * (n >> 16) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255); };

(async () => {
console.log("── the block ──");
ok("WBDLINES is a marked block right after WBOARD, before WBDSAVE, under 1.5 KB of code (comments aside)", src.indexOf("// WBDLINES_START") === src.indexOf("// WBOARD_END") + "// WBOARD_END\n".length && src.indexOf("// WBDLINES_END") < src.indexOf("// WBDSAVE_START") && code(LN).length < 1500, code(LN).length);
ok("it writes nothing: no db, no Storage, no localStorage, no fetch", !/db\.ref|\bdb\b|firebase|HA_LS|localStorage|sessionStorage|setItem|fetch\(|XMLHttpRequest|picStore|uxDocAdd/.test(code(LN)));
ok("no 🔀, no data URI, no new door (it never opens a board)", LN.indexOf("\u{1F500}") < 0 && !/data:/.test(LN) && !/wbdOpen\(|onclick/.test(code(LN)));
ok("exactly four call sites outside the block, each guarded or a plain value, each marked WBDLINES", (src.replace(LN, "").match(/WBDLINES/g) || []).length === 4 && /typeof wbdLinesCss==="function"/.test(SITES[0][1]) && /typeof wbdLinesDraw==="function"/.test(SITES[3][1]));
ok("three of them sit in WBOARD (wbdFit · wbdBg · the bar), one in WBDSAVE (wbdJpeg); the viewer's own code is untouched", [0, 1, 2].every(i => WBD.indexOf(SITES[i][1]) > 0) && SV.indexOf(SITES[3][1]) > 0 && fnOf(src, "wbdFit").indexOf(SITES[0][1].trim()) > 0 && fnOf(src, "wbdJpeg").indexOf(SITES[3][1].trim()) > 0);
ok("the baseline: the block and each call site came out exactly once", matched.length === 5 && matched.every(n => n === 1), matched);
ok("…and the baseline is the two-background board (no lines anywhere in it)", !/WBDLINES|wbdLines|"lines"/.test(WBD_B + SV_B) && WBD_B.indexOf('v.bg=_wbdBg=(k==="grid"?"grid":"blank"); wbdFit(); wbBarRender(); }') > 0 && SV_B.indexOf("g.stroke(); }\n  g.drawImage(ink,0,0,W,H);") > 0);

console.log("── wbdBg: three picks, anything else is blank ──");
{
  const w = world(); w.call("wbdOpen({})");
  ok("a new board opens on Blank (the default)", w.call("_wbdBg") === "blank" && w.ctx.wbView.bg === "blank" && w.hold().backgroundImage === "none" && on(w.bar(), "▢ Blank") && !on(w.bar(), "▤ Lines"));
  const got = ["blank", "grid", "lines"].map(k => (w.call("wbdBg(" + JSON.stringify(k) + ")"), [w.ctx.wbView.bg, w.call("_wbdBg")]));
  ok("blank · grid · lines are taken as given", JSON.stringify(got) === JSON.stringify([["blank", "blank"], ["grid", "grid"], ["lines", "lines"]]), got);
  const odd = ["'foo'", "''", "undefined", "null", "'Lines'", "'GRID'", "'lines '", "1", "{}"].map(k => { w.call("wbdBg('lines')"); w.call("wbdBg(" + k + ")"); return w.ctx.wbView.bg + "/" + w.call("_wbdBg"); });
  ok("anything else falls back to blank", odd.every(x => x === "blank/blank"), odd);
  const b = world({ base: true }); b.call("wbdOpen({})"); b.call("wbdBg('lines')");
  ok("(before: 'lines' was not a background — it fell back to blank)", b.ctx.wbView.bg === "blank");
  const n = world(); n.call("wbdBg('lines')");
  ok("with no board open wbdBg does nothing (as before)", n.call("_wbdBg") === "blank");
}

console.log("── baseline: Blank and Grid draw exactly as before ──");
for (const k of ["blank", "grid"]) for (const [W, H] of [[1000, 700], [700, 1000]]) {
  const a = world({ w: W, h: H }), b = world({ w: W, h: H, base: true });
  [a, b].forEach(x => { x.call("wbdOpen({uid:'u1',dayId:'d6'})"); x.call("wbdBg('" + k + "')"); x.stroke([[100, 100], [200, 200], [300, 150]]); });
  ok(k + " at " + W + "×" + H + ": the board's styles are byte-identical", JSON.stringify(a.hold()) === JSON.stringify(b.hold()) && JSON.stringify(a.reg["wb-ink"].style) === JSON.stringify(b.reg["wb-ink"].style), [a.hold(), b.hold()]);
  ok(k + " at " + W + "×" + H + ": the bar is the old bar plus one ▤ Lines button (not lit)", LINES_BTN.test(a.bar()) && a.bar().replace(LINES_BTN, "") === b.bar() && !on(a.bar(), "▤ Lines"));
  const ja = a.jpeg(), jb = b.jpeg();
  ok(k + " at " + W + "×" + H + ": the 💾 Save picture makes exactly the same canvas calls", ja.ops.length > 0 && JSON.stringify(ja.ops) === JSON.stringify(jb.ops) && ja.width === jb.width && ja.height === jb.height);
  a.turn(H, W); b.turn(H, W);
  ok(k + ": after a turn, still byte-identical", JSON.stringify(a.hold()) === JSON.stringify(b.hold()));
}

console.log("── ▤ Lines on the board ──");
let first;
{
  const w = world(); w.call("wbdOpen({uid:'u1',dayId:'d6'})"); w.stroke([[108, 160], [208, 260]]);
  w.call("wbdBg('lines')");
  const st = w.hold(), wd = parseFloat(st.width), ht = parseFloat(st.height), c = parseCss(st);
  first = { wd, ht, c };
  ok("the board is 984×684 (the stage less 8 px round)", wd === 984 && ht === 684, [wd, ht]);
  ok("four CSS layers: top line · baseline · the midline's white gaps · the midline", c.n === 4 && !!c.top && !!c.base && !!c.mid && /^linear-gradient\(90deg,transparent 50%,#fff 50%\)$/.test(c.gaps), st.backgroundImage);
  ok("top line → baseline is 1/8 of the board's width", near(c.base.y - c.top.y, wd / 8), [c.top.y, c.base.y]);
  ok("the midline sits halfway between them", near(c.mid.y, (c.top.y + c.base.y) / 2));
  ok("rows repeat every 1½ × (top→base): a gap of half that between a baseline and the next top line", c.sz.every(s => near(parseFloat(s[1]), 1.5 * wd / 8)) && near(parseFloat(c.sz[0][1]) - (c.base.y - c.top.y), wd / 16) && c.sz[0][0] === "100%" && c.sz[1][0] === "100%" && c.sz[3][0] === "100%", c.sz);
  ok("…and the gap is split above and below each row (a quarter at the top of the board), so nothing sits on the edge", near(c.top.y, wd / 32));
  ok("the midline is dashed: white gaps half of every " + c.sz[2][0] + " tile, layered over it but under the top and base lines", near(parseFloat(c.sz[2][0]), 2 * wd / 96));
  ok("the baseline is heavier (twice the width) and darker than the top and middle lines", near(c.base.h, 2 * c.top.h) && near(c.mid.h, c.top.h) && c.top.c === c.mid.c && lum(c.base.c) < lum(c.top.c) - 40, [c.top, c.base, c.mid]);
  ok("thin lines stay visible (at least 1 px)", c.top.h >= 1);
  ok("the bar lights ▤ Lines, not Blank or Grid", on(w.bar(), "▤ Lines") && !on(w.bar(), "▢ Blank") && !on(w.bar(), "▦ Grid") && /wbdBg\('lines'\)/.test(w.bar()));
  ok("the ink is untouched: the same stroke, nothing drawn into the ink canvas by the lines", w.ctx.wbView.strokes.length === 1 && !w.reg["wb-ink"].ops.some(op => op[0] === "=strokeStyle" && /#94a3b8|#475569/.test(op[1])));
  w.turn(700, 1000);
  const st2 = w.hold(), wd2 = parseFloat(st2.width), ht2 = parseFloat(st2.height), c2 = parseCss(st2);
  ok("the iPad turns: the same board smaller (684 wide), never stretched", wd2 === 684 && near(wd2 / ht2, wd / ht, 0.005), [wd2, ht2]);
  ok("…the rows scale with it: every line's place, thickness and the tile are the same share of the width", ["top", "mid", "base"].every(k => near(c2[k].y / wd2, c[k].y / wd, 0.0001) && near(c2[k].h / wd2, c[k].h / wd, 0.0001)) && near(parseFloat(c2.sz[0][1]) / wd2, parseFloat(c.sz[0][1]) / wd, 0.0001) && near(parseFloat(c2.sz[2][0]) / wd2, parseFloat(c.sz[2][0]) / wd, 0.0001));
  ok("…and sit in the same place under the drawing (points are shares of the board: y ÷ height is unchanged)", ["top", "mid", "base"].every(k => near(c2[k].y / ht2, c[k].y / ht, 0.002)) && w.ctx.wbView.strokes[0].p[0][0] === 0.1016);
  w.call("wbdBg('grid')");
  ok("▦ Grid after Lines: exactly the grid's styles", /^linear-gradient\(#bfdbfe 1px,transparent 1px\),linear-gradient\(90deg,#bfdbfe 1px,transparent 1px\)$/.test(w.hold().backgroundImage) && w.hold().backgroundSize === (684 / 20).toFixed(2) + "px " + (684 / 20).toFixed(2) + "px");
  w.call("wbdBg('lines')"); w.call("wbdBg('blank')");
  ok("▢ Blank after Lines: no background at all", w.hold().backgroundImage === "none" && w.hold().backgroundSize === "auto");
}

console.log("── ▤ Lines on the 💾 Save picture ──");
{
  const w = world(); w.call("wbdOpen({uid:'u1',dayId:'d6'})"); w.call("wbdBg('lines')"); w.stroke([[100, 100], [200, 200]]);
  const j = w.jpeg(), W = j.width, H = j.height, ops = j.ops;
  ok("the picture is 1600 wide as before (the ink is 1968)", W === 1600 && H === Math.round(1368 * 1600 / 1968), [W, H]);
  const iFill = ops.findIndex(x => x[0] === "fillRect"), iImg = ops.findIndex(x => x[0] === "drawImage"), strokes = ops.map((x, i) => x[0] === "stroke" ? i : -1).filter(i => i >= 0);
  ok("white first, then the lines (two strokes: light, then the baseline), then the ink on top", iFill >= 0 && strokes.length === 2 && iFill < strokes[0] && strokes[1] < iImg && iImg === ops.length - 2);
  // segments per stroke group: [x0,y,x1]
  const groups = []; let cur = null, style = {};
  ops.forEach(op => { if (op[0] === "=strokeStyle") style.c = op[1]; if (op[0] === "=lineWidth") style.w = op[1]; if (op[0] === "beginPath") { cur = { c: style.c, w: style.w, seg: [] }; groups.push(cur); }
    if (op[0] === "moveTo" && cur) cur.seg.push([op[1], op[2]]); if (op[0] === "lineTo" && cur) { const s = cur.seg[cur.seg.length - 1]; s.push(op[1]); s.push(op[2]); } });
  const light = groups[0], heavy = groups[1];
  ok("every segment is level (no slanted lines)", groups.every(g => g.seg.every(s => s[1] === s[3])));
  ok("the baseline is twice as heavy and darker", heavy.w === 2 * light.w && light.w === Math.max(1, W / 600) && lum(heavy.c) < lum(light.c) - 40, [light.c, light.w, heavy.c, heavy.w]);
  const x = W / 8, p = 1.5 * x, t = x / 4, d = W / 96;
  const full = g => g.seg.filter(s => s[0] === 0 && s[2] === W).map(s => s[1]);
  const tops = full(light), bases = full(heavy);
  const rows = []; for (let k = 0; t + k * p + x < H; k++) rows.push(k);
  ok("one solid top line per row and one solid baseline per row, every 1½ × (top→base) from a quarter-gap down", bases.length === rows.length && rows.every(k => near(bases[k], t + k * p + x, 1e-9) && near(tops[k], t + k * p, 1e-9)), [tops, bases]);
  const midY = rows.map(k => t + k * p + x / 2);
  const dashes = light.seg.filter(s => !(s[0] === 0 && s[2] === W));
  ok("each row's midline is dashed, halfway: dashes of 1/96 of the width with equal gaps, across the whole board", midY.every(m => { const ds = dashes.filter(s => near(s[1], m, 1e-9)); return ds.length === Math.ceil(W / (2 * d)) && ds.every((s, i) => near(s[0], i * 2 * d, 1e-9) && near(s[2], Math.min(W, s[0] + d), 1e-9)); }), dashes.slice(0, 3));
  ok("so each full row is exactly three lines: top, dashed middle, base", rows.every(k => { const ys = new Set(light.seg.concat(heavy.seg).map(s => s[1]).filter(y => y >= t + k * p - 0.01 && y <= t + k * p + x + 0.01)); return ys.size === 3; }));
  ok("a row cut off at the bottom draws only what fits — the same as on the screen", light.seg.concat(heavy.seg).every(s => s[1] < H) && tops.length >= rows.length);
  ok("the picture's rows sit where the screen's do (the same share of the height)", near(t / H, first.c.top.y / first.ht, 0.002) && near((t + x) / H, first.c.base.y / first.ht, 0.002));
}

console.log("── remembered for the next board; nothing written ──");
{
  const w = world({ mom: true }); w.call("wbdOpen({uid:'u1',dayId:'d6'})"); w.call("wbdBg('lines')"); w.stroke([[100, 100], [150, 150]]);
  const n = w.runTimers(); await flush();
  w.call("wbClose()"); await flush();
  ok("autosave and ✕ write nothing, touch no storage", n >= 1 && w.writes.length === 0 && w.storage.length === 0, [w.writes, w.storage]);
  ok("the pick is kept in memory only (_wbdBg), for this sitting", w.call("_wbdBg") === "lines");
  w.call("wbdOpen({})");
  ok("the next board opens empty, on Lines, the button lit", w.ctx.wbView.strokes.length === 0 && w.ctx.wbView.bg === "lines" && parseCss(w.hold()).n === 4 && on(w.bar(), "▤ Lines") && !on(w.bar(), "▢ Blank"));
  w.call("wbClose()"); await flush();
  ok("still nothing written anywhere", w.writes.length === 0 && w.storage.length === 0);
  const fresh = world(); fresh.call("wbdOpen({})");
  ok("a reload (a fresh page) opens on Blank again", fresh.ctx.wbView.bg === "blank" && fresh.hold().backgroundImage === "none");
}
console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
})();
