// ✍️ WBDROW — the whiteboard's second door: a "✍️ Whiteboard" on each activity row of Today's card (PLAN_unit_activity_types
//   §6.9/§7.2; Sara's answer 2026-11-20; Adrienne's "go with her answers and build" 2026-11-22).
//   Runs the REAL UNITTRACK + DAYCARD (DCACTS, UNITACTCHK) + WBOARD + WBDSAVE + WBDROW blocks and the viewer's real pieces
//   against a fake DOM, canvas and db.
//   · one guarded hook in the activity row; the block writes nothing (no db / Storage / localStorage); no element id in a row
//   · baselines = this tree minus the feature: a day with no activity is byte-identical; a day with activities is the old card plus
//     one button bar per row, nothing else; the top bar's door is unchanged
//   · the row's button opens the scratch board with {uid, dayId, key, kid}: kid = the device's kid on a kid's own device only
//   · ✕ is untouched: it closes at once and wipes the drawing, no question, nothing written
//   run: node test_wbd_row.js
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const cut = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error("markers " + a); return src.slice(i, j + b.length); };
const fnOf = (s, name) => { let i = s.indexOf("function " + name + "("); if (i < 0) throw new Error("no " + name); if (s.slice(i - 6, i) === "async ") i -= 6;
  let d = 0, q = null; for (let j = s.indexOf("{", i); j < s.length; j++) { const c = s[j]; if (q) { if (c === "\\") j++; else if (c === q) q = null; continue; }
    if (c === "/" && s[j + 1] === "/") { j = s.indexOf("\n", j); continue; }
    if (c === "'" || c === '"' || c === "`") q = c; else if (c === "{") d++; else if (c === "}" && --d === 0) return s.slice(i, j + 1); } throw new Error("unclosed " + name); };
const fnPlain = name => { const i = src.indexOf("function " + name + "("); let d = 0, j = i, seen = false; for (; j < src.length; j++) { const c = src[j]; if (c === "{") { d++; seen = true; } else if (c === "}") { d--; if (seen && d === 0) break; } } return src.slice(i, j + 1); };
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x).slice(0, 400) : "")); } };
const J = x => JSON.stringify(x);
const code = s => s.replace(/^\s*\/\/.*$/gm, "");
const ROW = cut("// WBDROW_START", "// WBDROW_END"), WBD = cut("// WBOARD_START", "// WBOARD_END"), SV = cut("// WBDSAVE_START", "// WBDSAVE_END");
const UT = cut("// UNITTRACK_START", "// UNITTRACK_END"), DC = cut("// DAYCARD_START", "// DAYCARD_END");
const HOOK = '+((typeof wbdRowBtnHTML==="function")?wbdRowBtnHTML(g,act):"")';
const SIGN = ["_unitActs", "_nbActKeys", "_nbActWrite", "_nbActRemove", "unitActPoints", "unitActivityClaim", "unitActivityDone"].map(fnPlain).join("\n");
const LR = "const LR_PARTS=[\"links\",\"supplies\",\"books\",\"orders\",\"notes\"];\n" + ["lrSafeUrl", "lrList", "lrStr", "lrDate", "lrClean", "lrHost"].map(fnPlain).join("\n");
const VIEW = ["var wbView=null, _wbAutoT=null, _wbRO=null, wbBooks={bk:{id:'bk',name:'Book',pages:3,imgs:{}}}; const WB_PEN=\"#1d4ed8\", WB_MOMPEN=\"#dc2626\";",
  ...["wbBook", "wbInkPath", "wbAssignRender", "wbBarRender", "wbTool", "wbTogglePen", "wbFit", "wbWatchFit", "wbPaint", "wbPt", "wbEraseAt", "wbUndo", "wbClear", "wbMarkDirty", "wbAutoSaveSoon", "wbSave", "wbClose"].map(n => fnOf(src, n)),
  src.slice(src.indexOf("(function wbBindOnce(){"), src.indexOf("function wbPt("))].join("\n");
const UNIT = () => ({ id: "harv", title: "Harvest", emoji: "*", decks: [], enrolled: { k1: true, k2: true },
  activities: [
    { key: "corn_maze", title: "Draw a corn maze", points: 5, day: 1 },
    { key: "my_hol", title: "Your own holiday", points: 20, day: 2, desc: "Write 2-3 sentences." },
    { key: "my_hol_2", title: "Your own holiday (younger)", points: 10, day: 2, desc: "Draw it.", type: "link", url: "https://example.org/x", kidOpen: true }],
  track: { mode: "seq", perWeek: 4, days: [
    { id: "d1", n: 1, t: "Fields", nb: { activity: "corn_maze" } },
    { id: "d2", n: 2, t: "Holidays", nb: { activity: "my_hol" } },
    { id: "d3", n: 3, t: "Rest day", res: { books: [{ title: "A Book" }] }, note: "Read outside." }] } });

// ── the card: DAYCARD (+ WBOARD for wbdJ) with or without the feature ──
function card(o) {
  o = o || {}; const writes = [];
  const ctx = { console, JSON, Object, Array, String, Number, Math, Set, Map, RegExp, Date, Promise, Error, parseInt, isNaN, isFinite, URL,
    unitStudies: { harv: UNIT() }, ROSTER: ["k1", "k2", "k3"], KID_NAME: { k1: "Ada", k2: "Ben", k3: "Cy" }, kcKid: o.kc === undefined ? null : o.kc,
    momHere: () => !!o.mom, _dryRun: () => false, window: { addEventListener() {} },
    db: { ref: p => ({ set: v => writes.push(["set", p]), update: v => writes.push(["update", p]), remove: () => writes.push(["remove", p]), once: () => { writes.push(["read", p]); return Promise.resolve({ val: () => null }); }, on: () => writes.push(["on", p]) }) },
    renderAll: () => {}, confirm: () => true, bankDirect: () => {} };
  vm.createContext(ctx);
  const dc = o.base ? DC.split(HOOK).join("") : DC;
  vm.runInContext(LR + "\n" + UT + "\n" + dc + "\n" + SIGN + "\n" + WBD + "\n" + SV + "\n" + (o.base ? "" : ROW), ctx);
  return { ctx, writes };
}
const G = (c, id) => { const u = c.unitStudies.harv; return { day: c.utRef("harv", c.utDay(u, id)), u: u, first: null, present: [] }; };
const BAR_RE = /<div data-wbd-rowbar="1"[^>]*><button data-wbd-row="[^"]*" onclick="wbdOpen\(\{[^"]*\}\)"[^>]*>✍️ Whiteboard<\/button><\/div>/g;
const opens = h => { const o = []; const re = /onclick="wbdOpen\((\{[^"]*\})\)"/g; let m; while ((m = re.exec(h))) o.push(m[1]); return o; };

// ── the board: viewer + WBOARD + WBDSAVE + WBDROW on a fake DOM ──
function board(o) {
  o = o || {}; const reg = {}, writes = [], listeners = {}, asked = [];
  const make = id => {
    const el = { id: id || "", style: {}, attrs: {}, _html: "", width: 0, height: 0, ops: [], setAttribute(k, v) { this.attrs[k] = v; },
      remove() { Object.keys(reg).forEach(k => { if (k === this.id || (this._kids || []).indexOf(k) >= 0) delete reg[k]; }); },
      insertAdjacentHTML() {}, setPointerCapture() {}, toDataURL() { return "data:image/jpeg;base64,/9j/"; },
      getBoundingClientRect() { if (this.id === "wbd-stage") return { left: 0, top: 52, width: 1000, height: 700 }; if (/^wb-(img|ink|hold)$/.test(this.id)) { const hs = reg["wb-hold"].style; return { left: 8, top: 60, width: parseFloat(hs.width) || 0, height: parseFloat(hs.height) || 0 }; } return { left: 0, top: 0, width: 0, height: 0 }; },
      getContext() { const ops = this.ops; return new Proxy({}, { get: (t, k) => (typeof k === "string" && /^(clearRect|beginPath|moveTo|lineTo|stroke|fillRect|drawImage)$/.test(k)) ? ((...a) => ops.push([k, ...a])) : t[k], set: (t, k, v) => { t[k] = v; return true; } }); } };
    Object.defineProperty(el, "innerHTML", { get() { return this._html; }, set(h) { this._html = h; const re = /id="([^"]+)"/g; let m; this._kids = []; while ((m = re.exec(h))) { if (!reg[m[1]]) reg[m[1]] = make(m[1]); this._kids.push(m[1]); } } });
    return el;
  };
  const ctx = { console: { log() {}, warn() {}, error() {} }, JSON, Object, Array, String, Number, Math, Promise, Error, Date, parseInt, isNaN, Proxy, Set, Map, RegExp,
    unitStudies: { harv: UNIT() }, ROSTER: ["k1", "k2", "k3"], KID_NAME: { k1: "Ada", k2: "Ben" }, kcKid: null,
    momHere: () => !!o.mom, _dryRun: () => false, confirm: m => { asked.push(m); return ctx.ANSWER; }, ANSWER: true, alert: m => { throw new Error("alert " + m); }, dbg: () => {}, SL_KCOL: {}, SL_KLBL: {},
    db: { ref: p => ({ set: v => { writes.push(["set", p]); return Promise.resolve(); }, update: v => { writes.push(["update", p]); return Promise.resolve(); }, once: () => { writes.push(["read", p]); return Promise.resolve({ val: () => null }); }, on: () => writes.push(["on", p]) }) },
    firebase: { storage: () => { writes.push(["storage"]); return { ref: () => ({ put: () => Promise.resolve(), getDownloadURL: () => Promise.resolve("https://x/y.jpg") }) }; } },
    setTimeout: (f, ms) => { ctx.timers.push(f); return ctx.timers.length; }, timers: [], clearTimeout: () => {},
    document: { getElementById: id => reg[id] || null, createElement: () => make(""), body: { appendChild(c) { if (c.id) reg[c.id] = c; return c; } }, addEventListener: (t, f) => { (listeners[t] = listeners[t] || []).push(f); } },
    window: { devicePixelRatio: 2, addEventListener() {} }, haDragOn() {}, haDragOff() {} };
  vm.createContext(ctx);
  vm.runInContext(VIEW + "\n" + WBD + "\n" + SV + "\n" + ROW, ctx);
  const ev = (x, y) => ({ target: reg["wb-ink"], pointerType: "touch", clientX: x, clientY: y, pressure: 0.5, pointerId: 1, buttons: 1, preventDefault() {} });
  const fire = (t, e) => (listeners[t] || []).forEach(f => f(e));
  const stroke = pts => { fire("pointerdown", ev(pts[0][0], pts[0][1])); pts.slice(1).forEach(p => fire("pointermove", ev(p[0], p[1]))); fire("pointerup", {}); };
  const bar = () => reg["wb-bar"] ? reg["wb-bar"].innerHTML : "";
  // tap the bar's ✕ exactly as the browser would: run its onclick text
  const tapX = () => { const m = /<button onclick="([^"]*)"[^>]*>✕<\/button>/.exec(bar()); if (!m) throw new Error("no ✕"); vm.runInContext(m[1].replace(/&quot;/g, '"'), ctx); };
  return { ctx, reg, writes, asked, stroke, bar, tapX, call: e => vm.runInContext(e, ctx), open: () => !!reg["wb-view"] };
}
const flush = async () => { for (let i = 0; i < 5; i++) await new Promise(r => setImmediate(r)); };

(async () => {
console.log("── the block ──");
ok("WBDROW is a marked block right after WBDSAVE", src.indexOf("// WBDROW_START") === src.indexOf("// WBDSAVE_END") + "// WBDSAVE_END\n".length);
ok("ONE guarded hook in the activity row (dcDayHTML), before the link's hook; nowhere else", src.split(HOOK).length === 2 && fnOf(src, "dcDayHTML").indexOf(HOOK + '+((typeof uakCardHTML==="function")') > 0);
ok("the block writes nothing: no db, no Storage, no localStorage", !/db\.|\.ref\(|\.set\(|\.update\(|firebase|picStore|HA_LS|localStorage|setItem/.test(code(ROW)));
ok("no element id in the row (a card has several rows): data-* only", !/\sid="/.test(code(fnOf(src, "wbdRowBtnHTML"))));
ok("the button is finger-sized (≥44 px tall)", /min-height:44px/.test(fnOf(src, "wbdRowBtnHTML")));
ok("no 🔀, no family names", ROW.indexOf("\u{1F500}") < 0 && !/Lincoln|Ellis|Lucy|Julian|DeWalt|Taylor|Kenzie/i.test(ROW + J(UNIT())));
ok("the top bar's door is untouched: wbdDoorHTML still opens {uid, dayId} with no key", /onclick="wbdOpen\('\+a\+'\)"/.test(fnOf(src, "wbdDoorHTML")) && !/key/.test(fnOf(src, "wbdDoorHTML")));
ok("✕ is untouched: the whiteboard's bar still has plain wbClose(), no question anywhere in the block", WBD.indexOf('return btn("\\u2715","wbClose()")+') > 0 && !/confirm\(/.test(code(ROW)) && !/confirm|wbdCloseOk/.test(fnOf(src, "wbClose")));

console.log("── baseline: the tree minus the feature ──");
{
  const a = card({ mom: true }), b = card({ mom: true, base: true });
  ok("a day with no activity: byte-identical", a.ctx.dcDayHTML(G(a.ctx, "d3")) === b.ctx.dcDayHTML(G(b.ctx, "d3")));
  ["d1", "d2"].forEach(id => { const h = a.ctx.dcDayHTML(G(a.ctx, id)), hb = b.ctx.dcDayHTML(G(b.ctx, id));
    ok(id + ": the old card plus one ✍️ bar per activity row, nothing else", h.replace(BAR_RE, "") === hb && (h.match(BAR_RE) || []).length === a.ctx.dcActivities(G(a.ctx, id)).length); });
  const h2 = a.ctx.dcDayHTML(G(a.ctx, "d2"));
  ok("…the bar sits under the activity's words, before its link and ✓ chips", h2.indexOf("Write 2-3 sentences.") < h2.indexOf("data-wbd-row=\"my_hol\"") && h2.indexOf("data-wbd-row=\"my_hol\"") < h2.indexOf("data-dc-actkid"));
  ok("two rows → two buttons, each its own activity (no id shared)", J(opens(h2).map(s => /key:'([^']*)'/.exec(s)[1])) === J(["my_hol", "my_hol_2"]) && (h2.match(/data-wbd-row="/g) || []).length === 2 && !/data-wbd-row[^>]*\sid=/.test(h2));
  ok("rendering the card wrote and read nothing", a.writes.length === 0);
  ok("no unit day / no activity key: no button", a.ctx.wbdRowBtnHTML({ day: null }, { key: "x" }) === "" && a.ctx.wbdRowBtnHTML(G(a.ctx, "d2"), { title: "no key" }) === "");
}

console.log("── who the board opens for ──");
{
  const arg = (o, id) => { const w = card(o); return opens(w.ctx.dcDayHTML(G(w.ctx, id || "d2")))[0]; };
  ok("Mom's device: {uid, dayId, key, kid:''}", arg({ mom: true, kc: "k2" }) === "{uid:'harv',dayId:'d2',key:'my_hol',kid:''}", arg({ mom: true, kc: "k2" }));
  ok("a kid's own device (Kids' Corner picked him, Mom mode off): kid = that kid", arg({ kc: "k2" }) === "{uid:'harv',dayId:'d2',key:'my_hol',kid:'k2'}", arg({ kc: "k2" }));
  ok("the shared board (no kid picked): kid empty", arg({ kc: "" }) === "{uid:'harv',dayId:'d2',key:'my_hol',kid:''}");
  ok("a picked name not on the roster: kid empty", arg({ kc: "zz" }) === "{uid:'harv',dayId:'d2',key:'my_hol',kid:''}");
  const q = card({ mom: true }); const u = q.ctx.unitStudies.harv; u.activities[0].key = "it's"; u.track.days[0].nb.activity = "it's";
  ok("a key with a quote is escaped for the onclick", opens(q.ctx.dcDayHTML(G(q.ctx, "d1")))[0] === "{uid:'harv',dayId:'d1',key:'it\\'s',kid:''}", opens(q.ctx.dcDayHTML(G(q.ctx, "d1"))));
}

console.log("── the board from a row ──");
{
  const w = board({ mom: false });
  ok("the row's onclick opens the scratch board with the activity on it", w.call("wbdOpen({uid:'harv',dayId:'d2',key:'my_hol',kid:'k2'})") === true && w.open() && w.ctx.wbView.scratch && w.ctx.wbView.key === "my_hol" && w.ctx.wbView.kid === "k2" && w.ctx.wbView.uid === "harv" && w.ctx.wbView.dayId === "d2");
  ok("the same tools as the top bar's board (✕ · Blank/Grid · ✏️ · Erase · Undo · Clear · Finger too)", ["wbdBg('blank')", "wbdBg('grid')", "wbTool('pen')", "wbTool('erase')", "wbUndo()", "wbClear()", "wbTogglePen()", "wbClose()"].every(f => w.bar().indexOf(f) > 0));
  ok("nothing drawn: ✕ closes at once", (w.tapX(), !w.open()) && w.asked.length === 0 && w.ctx.wbView === null);
}
{
  const w = board(); w.call("wbdOpen({uid:'harv',dayId:'d2',key:'my_hol',kid:''})"); w.stroke([[100, 100], [200, 200]]);
  w.tapX(); await flush(); w.ctx.timers.forEach(f => f()); await flush();
  ok("something drawn: ✕ still closes at once with no question (as on main) and wipes it", !w.open() && w.ctx.wbView === null && w.asked.length === 0);
  ok("nothing written — not the autosave, not ✕ (scratch)", w.writes.length === 0, w.writes);
}
console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
})();
