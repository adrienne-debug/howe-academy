// 💾 WBDSAVE — Save on the whiteboard (Sara's answer 2026-11-20: a board is kept only "when someone taps Save"; PLAN §7.2;
//   "go with her answers and build" 2026-11-22). Runs the REAL UNITTRACK + CRAFT + UNITDAY_EXTRAS blocks, the viewer pieces,
//   WBOARD + WBDSAVE and PICSTORE against a fake DOM, canvas, Storage and db.
//   · scratch stays the default: nothing is uploaded or written until Mom taps 💾 Save
//   · Save = a JPEG from the canvas → Storage pictures/units/<unitId>/days/<dayId>/whiteboard_<stamp>.jpg → ONE set of
//     unitStudies/<unitId>/track/days/<i>/res/docs (the day's existing list + the picture); the day's card shows it
//   · refused, plainly, when the upload fails (never a data URI in the database), dry run, nothing drawn, a kid, a row, no day, 24
//   · baseline = this tree minus the feature: the whiteboard's bar is the scratch bar plus the button, nothing else
//   run: node test_wboard_save.js
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const cut = (s, a, b) => { const i = s.indexOf(a), j = s.indexOf(b, i); if (i < 0 || j < 0) throw new Error("markers " + a); return s.slice(i, j + b.length); };
const fnOf = (s, name) => { let i = s.indexOf("function " + name + "("); if (i < 0) throw new Error("no " + name); if (s.slice(i - 6, i) === "async ") i -= 6;   // braces matched, strings + comments skipped
  let d = 0, q = null; for (let j = s.indexOf("{", i); j < s.length; j++) { const c = s[j]; if (q) { if (c === "\\") j++; else if (c === q) q = null; continue; }
    if (c === "/" && s[j + 1] === "/") { j = s.indexOf("\n", j); continue; }
    if (c === "'" || c === '"' || c === "`") q = c; else if (c === "{") d++; else if (c === "}" && --d === 0) return s.slice(i, j + 1); } throw new Error("unclosed " + name); };
const fnPlain = name => { const i = src.indexOf("function " + name + "("); let d = 0, j = i, seen = false; for (; j < src.length; j++) { const c = src[j]; if (c === "{") { d++; seen = true; } else if (c === "}") { d--; if (seen && d === 0) break; } } return src.slice(i, j + 1); };   // test_unitday_extras's
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x) : "")); } };
const SV = cut(src, "// WBDSAVE_START", "// WBDSAVE_END"), WBD = cut(src, "// WBOARD_START", "// WBOARD_END");
const HOOK = "+\n    ((typeof wbdSaveBtnHTML===\"function\")?wbdSaveBtnHTML(v,btn):\"\");   // WBDSAVE: 💾 Save — Mom, from Today's card on a unit day";
const UT = cut(src, "// UNITTRACK_START", "// UNITTRACK_END"), CR = cut(src, "// CRAFT_START", "// CRAFT_END"), UX = cut(src, "// UNITDAY_EXTRAS_START", "// UNITDAY_EXTRAS_END");
const LR = "const LR_PARTS=[\"links\",\"supplies\",\"books\",\"orders\",\"notes\"];\n" + ["lrSafeUrl", "lrList", "lrStr", "lrDate", "lrClean", "lrHost"].map(fnPlain).join("\n");
const PS = "const PICSTORE_TIMEOUT_MS=20000;\n" + ["_picSlug", "picStorePath", "picDataUrlToBlob", "picStore"].map(fnPlain).join("\n");
const VIEW = ["var wbView=null, _wbAutoT=null, _wbRO=null, wbBooks={}; const WB_PEN=\"#1d4ed8\", WB_MOMPEN=\"#dc2626\";",
  ...["wbBook", "wbInkPath", "wbAssignRender", "wbBarRender", "wbTool", "wbTogglePen", "wbFit", "wbWatchFit", "wbPaint", "wbPt", "wbEraseAt", "wbUndo", "wbClear", "wbMarkDirty", "wbAutoSaveSoon", "wbSave", "wbClose"].map(n => fnOf(src, n)),
  src.slice(src.indexOf("(function wbBindOnce(){"), src.indexOf("function wbPt("))].join("\n");
const URL_OK = "https://firebasestorage.googleapis.com/v0/b/x/o/pictures%2Funits%2Fu1%2Fdays%2Fd6%2Fwhiteboard_abc.jpg?alt=media&token=t";
const OLD_PIC = "https://firebasestorage.googleapis.com/v0/b/x/o/pictures%2Funits%2Fu1%2Fdays%2Fd6%2Fhunt_abc.jpg?alt=media&token=t";
const JPEG = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ==";
const UNIT = o => ({ id: "u1", title: "Harvest", emoji: "*", decks: [], track: { mode: "seq", perWeek: 4, days: [
  { id: "d1", n: 1, t: "Day one", res: { books: [{ title: "A book" }] } },
  { id: "d6", n: 6, t: "Giving thanks", res: { books: [{ title: "Another book" }], docs: (o && o.docs) || [{ kind: "image", title: "Scavenger hunt", url: OLD_PIC }] } }] } });
const P_DOCS = "unitStudies/u1/track/days/1/res/docs";

function world(o) {
  o = o || {}; const reg = {}, writes = [], puts = [], picCalls = [], listeners = {}, canvases = [];
  const stage = { w: 1000, h: 700 };
  const holdRect = () => { const hs = reg["wb-hold"] && reg["wb-hold"].style; return { left: 8, top: 60, width: parseFloat(hs && hs.width) || 0, height: parseFloat(hs && hs.height) || 0 }; };
  const make = id => {
    const el = { id: id || "", style: {}, attrs: {}, _html: "", width: 0, height: 0, ops: [], setAttribute(k, v) { this.attrs[k] = v; },
      remove() { Object.keys(reg).forEach(k => { if (k === this.id || (this._kids || []).indexOf(k) >= 0) delete reg[k]; }); },
      insertAdjacentHTML() {}, setPointerCapture() {}, toDataURL(t, q) { this.ops.push(["toDataURL", t, q]); return o.noJpeg ? "data:," : JPEG; },
      getBoundingClientRect() { if (this.id === "wbd-stage") return { left: 0, top: 52, width: stage.w, height: stage.h }; if (/^wb-(img|ink|hold)$/.test(this.id)) return holdRect(); return { left: 0, top: 0, width: 0, height: 0 }; },
      getContext() { const ops = this.ops; return new Proxy({}, { get: (t, k) => (typeof k === "string" && /^(clearRect|beginPath|moveTo|lineTo|stroke|fillRect|drawImage)$/.test(k)) ? ((...a) => ops.push([k, ...a])) : t[k], set: (t, k, v) => { t[k] = v; ops.push(["=" + k, v]); return true; } }); } };
    Object.defineProperty(el, "innerHTML", { get() { return this._html; }, set(h) { this._html = h; const re = /id="([^"]+)"/g; let m; this._kids = []; while ((m = re.exec(h))) { if (!reg[m[1]]) reg[m[1]] = make(m[1]); this._kids.push(m[1]); } } });
    return el;
  };
  const ctx = { console: { log() {}, warn() {}, error() {} }, JSON, Object, Array, String, Number, Math, Promise, Error, Date, parseInt, isNaN, isFinite, Proxy, Set, Map, RegExp, WeakMap, URL, atob, Blob, Uint8Array,
    unitStudies: { u1: UNIT(o) }, momHere: () => o.mom !== false, _dryRun: () => !!o.dry, confirm: () => true, alert: m => { throw new Error("alert " + m); }, dbg: () => {}, SL_KCOL: {}, SL_KLBL: {},
    renderAll: () => { ctx.repaints++; }, repaints: 0, navigator: { onLine: true },
    db: { ref: p => ({ set: v => { writes.push(["set", p, JSON.parse(JSON.stringify(v === undefined ? null : v))]); return Promise.resolve(); }, update: v => { writes.push(["update", p, v]); return Promise.resolve(); }, once: () => { writes.push(["read", p]); return Promise.resolve({ val: () => null }); } }) },
    firebase: { storage: () => ({ ref: p => ({ put: (blob, meta) => { puts.push([p, meta, blob && blob.type, blob && blob.size]); return o.uploadFails ? Promise.reject(new Error("storage/unauthorized")) : Promise.resolve(); }, getDownloadURL: () => Promise.resolve(URL_OK) }) }) },
    setTimeout: (f, ms) => 1, clearTimeout: () => {},
    document: { getElementById: id => reg[id] || null, createElement: t => { const c = make(""); if (t === "canvas") canvases.push(c); return c; }, body: { appendChild(c) { if (c.id) reg[c.id] = c; return c; } },
      addEventListener: (t, f) => { (listeners[t] = listeners[t] || []).push(f); } },
    window: { devicePixelRatio: 2, addEventListener() {} }, haDragOn() {}, haDragOff() {} };
  vm.createContext(ctx);
  vm.runInContext(LR + "\n" + UT + "\n" + CR + "\n" + UX + "\n" + PS + "\n" + VIEW + "\n" + (o.base ? WBD.split(HOOK).join(";") : WBD + "\n" + SV), ctx);
  if (o.stubPic) ctx.picStore = (d, parts) => { picCalls.push([d, parts]); return Promise.resolve(o.stubPic === "fail" ? d : URL_OK); };
  const ev = (x, y) => ({ target: reg["wb-ink"], pointerType: "touch", clientX: x, clientY: y, pressure: 0.5, pointerId: 1, buttons: 1, preventDefault() {} });
  const fire = (t, e) => (listeners[t] || []).forEach(f => f(e));
  const stroke = pts => { fire("pointerdown", ev(pts[0][0], pts[0][1])); pts.slice(1).forEach(p => fire("pointermove", ev(p[0], p[1]))); fire("pointerup", {}); };
  return { ctx, reg, writes, puts, picCalls, canvases, stroke, call: e => vm.runInContext(e, ctx), bar: () => reg["wb-bar"] ? reg["wb-bar"].innerHTML : "" };
}
const flush = async () => { for (let i = 0; i < 5; i++) await new Promise(r => setImmediate(r)); };
const visible = h => h.replace(/<[^>]+>/g, " ");

(async () => {
console.log("── the block ──");
ok("WBDSAVE is a marked block after WBOARD, ~3 KB of code (comments aside)", src.indexOf("// WBDSAVE_START") > src.indexOf("// WBOARD_END") && SV.replace(/^\s*\/\/.*$/gm, "").length < 3600, SV.replace(/^\s*\/\/.*$/gm, "").length);
ok("its one hook sits in WBOARD's bar, guarded", src.split(HOOK).length === 2 && WBD.indexOf(HOOK) > 0);
ok("no db, no Storage call of its own: the upload is picStore's, the write is uxDocAdd's (UNITDAY_EXTRAS)", !/db\.ref|firebase|HA_LS|localStorage|setItem/.test(SV.replace(/^\s*\/\/.*$/gm, "")) && /await picStore\(data,\["units",v\.uid,"days",v\.dayId,"whiteboard"\]\)/.test(SV) && /uxDocAdd\(v\.uid,v\.dayId,\{kind:"image",title:wbdTitle\(\),url:url\}\)/.test(SV));
ok("never a data URI in the record: only an https link goes on", /if\(!\/\^https:\\\/\\\/\/i\.test\(String\(url\|\|""\)\)\) return wbdSay/.test(SV));
ok("Mom only, from Today's card on a unit day, not from an activity row (the kid's Save waits for that door)", /function wbdCanSave\(v\)\{ return !!\(v&&v\.scratch&&v\.uid&&v\.dayId&&!v\.key&&typeof momHere==="function"&&momHere\(\)/.test(SV) && !/unitWork/.test(SV.replace(/^\s*\/\/.*$/gm, "")));
ok("no 🔀", SV.indexOf("\u{1F500}") < 0);

console.log("── baseline: the tree minus the feature ──");
{
  const a = world(), b = world({ base: true });
  a.call("wbdOpen({})"); b.call("wbdOpen({})");
  ok("a board with no unit day: the bar is byte-identical to the scratch bar (no Save)", a.bar() === b.bar() && !/wbdSave/.test(a.bar()));
  const k = world({ mom: false }), kb = world({ mom: false, base: true }); k.call("wbdOpen({uid:'u1',dayId:'d6'})"); kb.call("wbdOpen({uid:'u1',dayId:'d6'})");
  ok("a kid at the screen: no Save, the bar byte-identical", k.bar() === kb.bar() && !/wbdSave/.test(k.bar()));
  const r = world(), rb = world({ base: true }); r.call("wbdOpen({uid:'u1',dayId:'d6',key:'act1',kid:'k1'})"); rb.call("wbdOpen({uid:'u1',dayId:'d6',key:'act1',kid:'k1'})");
  ok("a board from an activity row (opts.key): no Save yet, byte-identical", r.bar() === rb.bar());
  const m = world(), mb = world({ base: true }); m.call("wbdOpen({uid:'u1',dayId:'d6'})"); mb.call("wbdOpen({uid:'u1',dayId:'d6'})");
  ok("Mom, a unit day: the scratch bar plus 💾 Save at the end, nothing else", m.bar().indexOf(mb.bar()) === 0 && /^<button onclick="wbdSave\(\)"[^>]*>💾 Save<\/button>$/.test(m.bar().slice(mb.bar().length)), m.bar().slice(mb.bar().length));
}

console.log("── scratch stays the default ──");
{
  const w = world({ stubPic: true }); w.call("wbdOpen({uid:'u1',dayId:'d6'})"); w.stroke([[100, 100], [200, 200]]); w.call("wbClose()"); await flush();
  ok("drawing and closing without Save: nothing uploaded, nothing written", w.picCalls.length === 0 && w.puts.length === 0 && w.writes.length === 0);
}

console.log("── 💾 Save ──");
{
  const w = world(); w.call("wbdOpen({uid:'u1',dayId:'d6'})"); w.call("wbdBg('grid')"); w.stroke([[100, 100], [200, 200], [300, 150]]);
  const done = w.call("wbdSave()"); ok("while it uploads the button says Saving…", /Saving…/.test(w.bar()) && /Saving the board/.test(w.bar()));
  const res = await done; await flush();
  ok("Save resolves true", res === true);
  ok("ONE upload to Storage: pictures/units/u1/days/d6/whiteboard_<stamp>.jpg, a JPEG, cached a year", w.puts.length === 1 && /^pictures\/units\/u1\/days\/d6\/whiteboard_[a-z0-9]+\.jpg$/.test(w.puts[0][0]) && w.puts[0][1].contentType === "image/jpeg" && w.puts[0][1].cacheControl === "public,max-age=31536000" && w.puts[0][2] === "image/jpeg", w.puts);
  ok("ONE database write: a set of unitStudies/u1/track/days/1/res/docs", w.writes.length === 1 && w.writes[0][0] === "set" && w.writes[0][1] === P_DOCS, w.writes.map(x => x[1]));
  const L = w.writes[0][2];
  ok("…the day's list as it was, plus the board as a picture by its https link", L.length === 2 && L[0].url === OLD_PIC && L[0].title === "Scavenger hunt" && L[1].kind === "image" && L[1].url === URL_OK && /^Whiteboard( · .+)?$/.test(L[1].title), L);
  ok("no data URI anywhere in what was written", !/data:/.test(JSON.stringify(w.writes)));
  ok("the day the app holds has it too (its 🖼 Pictures & documents on Today's card)", w.ctx.unitStudies.u1.track.days[1].res.docs.length === 2 && w.ctx.repaints >= 1);
  ok("the bar: ✓ Saved and a plain line saying where it went; the board stays open, the drawing on it", /✓ Saved/.test(w.bar()) && /Saved to the day’s 🖼 Pictures &amp; documents/.test(w.bar()) && w.ctx.wbView && w.ctx.wbView.strokes.length === 1);
  const jc = w.canvases[w.canvases.length - 1];
  ok("the JPEG is made from the canvas: white, the grid (it was on), then the ink, at most 1600 px wide, 0.85", jc.width === 1600 && jc.height === Math.round(1368 * 1600 / 1968) && jc.ops.findIndex(x => x[0] === "fillRect") < jc.ops.findIndex(x => x[0] === "stroke") && jc.ops.findIndex(x => x[0] === "stroke") < jc.ops.findIndex(x => x[0] === "drawImage") && jc.ops.some(x => x[0] === "=fillStyle" && x[1] === "#fff") && jc.ops.some(x => x[0] === "drawImage" && x[1] === w.reg["wb-ink"]) && jc.ops.some(x => x[0] === "toDataURL" && x[1] === "image/jpeg" && x[2] === 0.85), [jc.width, jc.height]);
  w.stroke([[400, 400], [450, 450]]);
  ok("a new stroke: 💾 Save again, the old line gone", /💾 Save/.test(w.bar()) && !/Saved to the day/.test(w.bar()));
  await w.call("wbdSave()"); await flush();
  ok("saving again adds a second picture (a later timeline), still one set each", w.puts.length === 2 && w.writes.length === 2 && w.writes[1][2].length === 3);
  w.call("wbClose()"); await flush(); ok("✕ after saving writes nothing more", w.writes.length === 2);
}
{
  const w = world({ base: false }); w.call("wbdOpen({uid:'u1',dayId:'d6'})"); w.stroke([[100, 100], [200, 200]]);
  await w.call("wbdSave()"); const jc = w.canvases[w.canvases.length - 1];
  ok("blank background: no grid lines in the JPEG, just white + ink", !jc.ops.some(x => x[0] === "stroke") && jc.ops.some(x => x[0] === "drawImage"));
}

console.log("── refused, plainly ──");
{
  const w = world({ uploadFails: true }); w.call("wbdOpen({uid:'u1',dayId:'d6'})"); w.stroke([[100, 100], [200, 200]]);
  const r = await w.call("wbdSave()"); await flush();
  ok("the upload fails: refused — tried once, nothing written, never the picture as text", r === false && w.puts.length === 1 && w.writes.length === 0 && w.ctx.unitStudies.u1.track.days[1].res.docs.length === 1);
  ok("…said plainly, the drawing still on the board, Save still offered", /Didn’t save: the upload didn’t go through \(no internet\?\)\. Nothing was saved — try again\./.test(w.bar()) && /💾 Save/.test(w.bar()) && w.ctx.wbView.strokes.length === 1 && w.ctx.wbView.saving === false);
}
{
  const w = world({ stubPic: "fail" }); w.call("wbdOpen({uid:'u1',dayId:'d6'})"); w.stroke([[100, 100], [200, 200]]);
  ok("picStore hands back the data URL (offline / timeout / rules): refused, nothing written", await w.call("wbdSave()") === false && w.picCalls.length === 1 && w.writes.length === 0);
  ok("…what went to picStore was the canvas JPEG, under the day's folder", /^data:image\/jpeg/.test(w.picCalls[0][0]) && JSON.stringify(w.picCalls[0][1]) === '["units","u1","days","d6","whiteboard"]');
}
{
  const w = world({ stubPic: true, dry: true }); w.call("wbdOpen({uid:'u1',dayId:'d6'})"); w.stroke([[100, 100], [200, 200]]);
  ok("dry run: nothing uploaded, nothing written, and it says so", await w.call("wbdSave()") === false && w.picCalls.length === 0 && w.writes.length === 0 && /Dry run — nothing uploaded, nothing written\./.test(w.bar()));
}
{
  const w = world({ stubPic: true }); w.call("wbdOpen({uid:'u1',dayId:'d6'})");
  ok("nothing drawn: refused", await w.call("wbdSave()") === false && w.picCalls.length === 0 && /Nothing on the board yet\./.test(w.bar()));
  w.stroke([[100, 100], [200, 200]]); ok("…the line goes with the next stroke", !/Nothing on the board/.test(w.bar()));
}
{
  const w = world({ stubPic: true, mom: false }); w.call("wbdOpen({uid:'u1',dayId:'d6'})"); w.stroke([[100, 100], [200, 200]]);
  ok("a kid's device: wbdSave does nothing even if called", await w.call("wbdSave()") === false && w.picCalls.length === 0 && w.writes.length === 0);
  const r = world({ stubPic: true }); r.call("wbdOpen({uid:'u1',dayId:'d6',key:'act1',kid:'k1'})"); r.stroke([[100, 100], [200, 200]]);
  ok("a row's board: wbdSave does nothing (the kid's own Save is not built)", await r.call("wbdSave()") === false && r.picCalls.length === 0 && r.writes.length === 0);
}
{
  const w = world({ stubPic: true }); w.call("wbdOpen({uid:'u1',dayId:'gone'})"); w.stroke([[100, 100], [200, 200]]);
  ok("the day is gone: refused before any upload", await w.call("wbdSave()") === false && w.picCalls.length === 0 && /isn’t there any more/.test(w.bar()));
}
{
  const docs = Array.from({ length: 24 }, (_, i) => ({ kind: "link", title: "L" + i, url: "https://example.org/" + i }));
  const w = world({ stubPic: true, docs }); w.call("wbdOpen({uid:'u1',dayId:'d6'})"); w.stroke([[100, 100], [200, 200]]);
  ok("24 on the day already: refused before any upload", await w.call("wbdSave()") === false && w.picCalls.length === 0 && w.writes.length === 0 && /24 pictures &amp; documents already/.test(w.bar()));
}
{
  const w = world({ stubPic: true, noJpeg: true }); w.call("wbdOpen({uid:'u1',dayId:'d6'})"); w.stroke([[100, 100], [200, 200]]);
  ok("a device that can't make a JPEG: refused, nothing uploaded", await w.call("wbdSave()") === false && w.picCalls.length === 0 && /couldn’t make the picture/.test(w.bar()));
}
console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
})();
