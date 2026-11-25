// ✍️ UACTSCREEN — a Printable done on the screen (piece 4c of PLAN_unit_activity_types_2026-11-19 §6.5, §6.7 row 4c, §7.1; a beta mom
//   2026-11-20: a page done "Either. I'd pick page by page", fingers only, she checks "later on my own screen"; her go 2026-11-22).
//   Runs the REAL UNITTRACK + UTADDACT + UACTKIND + UACTLINK + UACTPRINT + UACTPAGES + UACTSCREEN + DAYCARD blocks, the workbook
//   viewer's real functions and pointer plumbing, and Mom's ⏳ queue, against a fake DOM, canvas, Storage and db. No real names.
//   · the switch: "How it's done: 🖨 paper · ✍️ screen · either" → …/do on ✎ Save (only when changed); no pages → paper only + why;
//     a new printable starts as "either" when its pages are made (UACTPAGES' one update), never over Mom's own pick
//   · Today's card: paper / no pages / no `do` → byte-identical to the tree minus the feature; either → the 🖨 line + the door;
//     screen → the door only; a kid's own device "✍️ Do it on the screen", Mom "👁 Look · <name>", the board a line
//   · the viewer opens on the activity's pages (pages read with the database's empty first slot); a kid's device opens only his
//     own; Mom any kid's, red pen; ink at unitWork/<kid>/<unitId>/<key>/<page>, never workbookWork; refusals said in the bar
//   · a workbook opens, draws its bar and saves exactly as before (the hooks are inert for a workbook id)
//   run: node test_unit_act_screen.js
process.env.TZ = "America/New_York";
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x).slice(0, 600) : "")); } };
const J = x => JSON.stringify(x);
const cutIn = (s, a, b) => { const i = s.indexOf(a), j = s.indexOf(b, i); if (i < 0 || j < 0) throw new Error("markers " + a); return s.slice(i, j); };
const fnIn = (s, name) => { let i = s.indexOf("function " + name + "("); if (i < 0) throw new Error("no " + name); if (s.slice(i - 6, i) === "async ") i -= 6;
  let d = 0, q = null; for (let j = s.indexOf("{", i); j < s.length; j++) { const c = s[j]; if (q) { if (c === "\\") j++; else if (c === q) q = null; continue; }
    if (c === "/" && s[j + 1] === "/") { j = s.indexOf("\n", j); continue; }
    if (c === "'" || c === '"' || c === "`") q = c; else if (c === "{") d++; else if (c === "}" && --d === 0) return s.slice(i, j + 1); } throw new Error("unclosed " + name); };
const fnPlainIn = (s, name) => { const i = s.indexOf("function " + name + "("); if (i < 0) throw new Error("no " + name); let d = 0, j = i, seen = false; for (; j < s.length; j++) { const c = s[j]; if (c === "{") { d++; seen = true; } else if (c === "}") { d--; if (seen && d === 0) break; } } return s.slice(i, j + 1); };
const code = s => s.split("\n").filter(l => !/^\s*\/\//.test(l)).join("\n");
const BLK = cutIn(src, "// UACTSCREEN_START", "// UACTSCREEN_END") + "// UACTSCREEN_END\n";

// ── the tree minus the feature: the block out, each hook back to the line it replaced ──
const HOOK_LINES = src.split("\n").filter(l => /\/\/ UACTSCREEN:/.test(l));
let BASE = src.replace(BLK, "");
if (src.indexOf("// UACTANS_START") >= 0) BASE = BASE.replace(cutIn(src, "// UACTANS_START", "// UACTANS_END") + "// UACTANS_END\n", "");   // the next piece (typed answers) has its own test
if (src.indexOf("// WBLBOARD_START") >= 0) BASE = BASE.replace(cutIn(src, "// WBLBOARD_START", "// WBLBOARD_END") + "// WBLBOARD_END\n", "");   // the strip's ✍️ chip (test_wbl_board.js) asks uascIs too
{
  const strip = [/^\s+h\+=\(\(typeof uascLookBtnHTML===/, /^\s+if\(typeof uascDoHTML===/, /^\s+if\(typeof uascDoEdit===/, /^\s+return \(typeof uascCardHTML===/, /^\s+if\(typeof uascDoNew===/, /^\s+\(typeof uascIs==="function"&&uascIs\(v\.bookId\)\)\?uascBarHTML/, /^\s+if\(typeof uascIs==="function"&&uascIs\(v\.bookId\)\) return uascSave/];
  HOOK_LINES.forEach(l => { if (strip.some(r => r.test(l))) BASE = BASE.split(l + "\n").join(""); });
  BASE = BASE.split("  const h='<div data-uap-paper=").join("  return '<div data-uap-paper=");
  BASE = BASE.replace(/function wbBook\(id\)\{ if\(typeof uascIs[^\n]*/, "function wbBook(id){ return (wbBooks||{})[id]||null; }");
  BASE = BASE.replace(/function wbInkPath\(kid,bookId,page\)\{ if\(typeof uascIs[^\n]*/, 'function wbInkPath(kid,bookId,page){ return "workbookWork/"+kid+"/"+bookId+"/"+page; }');
}
const NAMES = /\b(adrienne|andrew|julian|lincoln|ellis|lucy|sara|sarah|caleb|taylor|makenzie|kenzie|dewalt|burris|melanie|howe)\b/i;

console.log("── the block and its hooks ──");
ok("UACTSCREEN is one marked block right after UACTPAGES", src.indexOf("// UACTPAGES_END\n// UACTSCREEN_START") > 0 && src.split("// UACTSCREEN_START").length === 2 && src.split("// UACTSCREEN_END").length === 2);
ok("nine guarded hooks outside the block (box · ✎ Save · card · pages · wbBook · wbInkPath · bar · save · Mom's ⏳ row)", HOOK_LINES.length === 9 && HOOK_LINES.every(l => /typeof uasc\w+==="function"/.test(l)), HOOK_LINES.length);
ok("the tree minus the feature has no trace of it", BASE.indexOf("uasc") < 0 && BASE.indexOf("UACTSCREEN") < 0, (BASE.match(/.{60}uasc.{60}/) || [])[0]);
const C = code(BLK);
ok("its only database call: ONE set of the page's ink path — no update / remove / transaction / once / on / push", (C.match(/db\.ref\(/g) || []).length === 1 && /await db\.ref\(path\)\.set\(\{v:1,s:v\.strokes,ts:Date\.now\(\)\}\)/.test(C) && !/\.update\(|\.remove\(|\.transaction\(|\.once\(|\.on\(|\.push\(|firebase|HA_LS|localStorage/.test(C));
ok("the ink path is unitWork/<kid>/<unitId>/<key>/<page>; the block never names workbookWork", /return "unitWork\/"\+kid\+"\/"\+w\.uid\+"\/"\+w\.key\+"\/"\+p;/.test(C) && C.indexOf("workbookWork") < 0);
ok("the save is behind _dryRun and db", C.indexOf("uascDryRun()") < C.indexOf("db.ref(path)") && C.indexOf('typeof db==="undefined"||!db') < C.indexOf("db.ref(path)"));
ok("no answer anything: no key, no check, no reveal", !/answer ?key|wbOpenCheck|\bans:|auto-?check/i.test(C));
ok("no kid or family name, no 🔀", !NAMES.test(BLK) && BLK.indexOf("\u{1F500}") < 0, (BLK.match(NAMES) || [])[0]);
const testTxt = fs.readFileSync(__filename, "utf8").split("\n").filter(l => !/^const NAMES =/.test(l)).join("\n");
ok("this test file names no real kid or family", !NAMES.test(testTxt), (testTxt.match(NAMES) || [])[0]);
ok("finger-sized card buttons (min-height 48px)", /min-height:48px/.test(fnIn(src, "uascBtnStyle")));

// ── the world ──
const P1 = "https://store.example/o/pictures%2Funits%2Fharv%2Factivities%2Fseed_sheet%2Fseeds_p1.jpg?alt=media&token=a";
const P2 = "https://store.example/o/pictures%2Funits%2Fharv%2Factivities%2Fseed_sheet%2Fseeds_p2.jpg?alt=media&token=b";
const PDFREC = (o) => Object.assign({ url: "https://store.example/o/seeds.pdf?alt=media", title: "seeds" }, o || {});
const UNIT = o => { o = o || {}; return { id: "harv", title: "Harvest", emoji: "*", enrolled: { k1: true, k2: true }, decks: [],
  activities: [
    { key: "corn_maze", title: "Draw a corn maze", emoji: "*", kind: "sheet", points: 5, day: 2 },
    Object.assign({ key: "seed_sheet", title: "Seed sorting sheet", emoji: "*", kind: "sheet", points: 3, day: 2, type: "print",
      pdf: PDFREC({ pages: o.pages === undefined ? [null, P1, P2] : o.pages }) }, o.do === undefined ? {} : { do: o.do }),
    { key: "leaf_map", title: "Leaf map", emoji: "*", kind: "sheet", points: 2, day: 3, type: "print" }],
  activityLog: {}, activityClaims: o.claims || {},
  track: { mode: "seq", perWeek: 4, days: [{ id: "d1", n: 1, t: "Fields" }, { id: "d2", n: 2, t: "Seeds", nb: { activity: "seed_sheet" } }, { id: "d3", n: 3, t: "Leaves", nb: { activity: "leaf_map" } }] } }; };

function world(o) {
  o = o || {}; const S = o.base ? BASE : src;
  const reg = {}, writes = [], reads = [], toasts = [], timers = [], listeners = {}, store = Object.assign({}, o.store || {}), puts = [];
  const make = id => {
    const el = { id: id || "", style: {}, attrs: {}, _html: "", width: 0, height: 0, ops: [], value: "", setAttribute(k, v) { this.attrs[k] = v; }, getAttribute(k) { return this.attrs[k]; },
      remove() { Object.keys(reg).forEach(k => { if (k === this.id || (this._kids || []).indexOf(k) >= 0) delete reg[k]; }); },
      insertAdjacentHTML(w, h) { this.adj = (this.adj || "") + h; }, setPointerCapture() {}, appendChild(c) { if (c.id) reg[c.id] = c; (this.children = this.children || []).push(c); return c; },
      toBlob(cb, type, q) { cb({ blob: true, type: type }); },
      getBoundingClientRect() { if (/^wb-(img|ink)$/.test(this.id)) return { left: 0, top: 60, width: 800, height: 1035 }; return { left: 0, top: 0, width: 0, height: 0 }; },
      getContext() { const ops = this.ops; return new Proxy({}, { get: (t, k) => (typeof k === "string" && /^(clearRect|beginPath|moveTo|lineTo|stroke|fillRect|drawImage)$/.test(k)) ? ((...a) => ops.push([k, ...a])) : t[k], set: (t, k, v) => { t[k] = v; ops.push(["=" + k, v]); return true; } }); } };
    Object.defineProperty(el, "innerHTML", { get() { return this._html; }, set(h) { this._html = h; const re = /\bid="([^"]+)"/g; let m; this._kids = []; while ((m = re.exec(h))) { if (!reg[m[1]]) reg[m[1]] = make(m[1]); this._kids.push(m[1]); } } });
    return el;
  };
  Object.assign(reg, o.dom || {});
  const ctx = { console: { log() {}, warn() {}, error() {} }, JSON, Object, Array, String, Number, Math, Promise, Error, Date, parseInt, isNaN, isFinite, Proxy, Set, Map, RegExp, URL, WeakMap,
    unitStudies: { harv: o.unit || UNIT(o) }, ROSTER: ["k1", "k2", "k3"], KID_NAME: { k1: "Ada", k2: "Ben", k3: "Cy" }, kcKid: o.kc || "",
    momHere: () => ctx.MOM, MOM: !!o.mom, _dryRun: () => !!o.dry, gwShowToast: m => toasts.push(m), alert: m => { toasts.push("ALERT " + m); }, confirm: () => true, dbg: () => {},
    SL_KCOL: {}, SL_KLBL: {}, bankDirect: () => {}, renderAll: () => { ctx.repaints++; }, repaints: 0, navigator: { onLine: true },
    kid: "all", claimed: {}, checked: {}, weekData: { tasks: [] }, PACE_KCOL: {}, cap: s => s, esc: s => String(s),
    db: { ref: p => ({ set: v => { writes.push(["set", p, JSON.parse(J(v === undefined ? null : v))]); if (o.setFails) return Promise.reject(new Error("PERMISSION_DENIED")); store[p] = JSON.parse(J(v)); return Promise.resolve(); },
      update: v => { writes.push(["update", p === undefined ? "" : p, JSON.parse(J(v))]); return Promise.resolve(); }, remove: () => { writes.push(["remove", p]); return Promise.resolve(); }, transaction: () => { writes.push(["tx", p]); },
      once: () => { reads.push(p); return Promise.resolve({ val: () => (p in store) ? JSON.parse(J(store[p])) : null }); }, on: () => { writes.push(["on", p]); }, child: () => null }) },
    firebase: { storage: () => ({ ref: p => ({ put: async (f, m) => { puts.push(p); }, getDownloadURL: async () => "https://store.example/o/" + encodeURIComponent(p) + "?alt=media&token=t" }) }) },
    setTimeout: (f, ms) => { timers.push({ f, ms, live: true }); return timers.length; }, clearTimeout: n => { if (timers[n - 1]) timers[n - 1].live = false; },
    document: { getElementById: id => reg[id] || null, createElement: () => make(""), body: { appendChild(c) { if (c.id) reg[c.id] = c; return c; } }, addEventListener: (t, f) => { (listeners[t] = listeners[t] || []).push(f); } },
    window: { devicePixelRatio: 2, addEventListener() {} }, haDragOn() {}, haDragOff() {} };
  if (o.noDb) ctx.db = null;
  if (!o.noPdf) ctx.nbLoadPdfJs = async () => ({ getDocument: () => ({ promise: Promise.resolve({ numPages: o.numPages || 2, destroy() {},
    getPage: async p => ({ getViewport: v => ({ width: 612 * v.scale, height: 792 * v.scale }), render: () => ({ promise: Promise.resolve() }) }) }) }) });
  const cut = (a, b) => cutIn(S, a, b), fn = n => fnIn(S, n), fnp = n => fnPlainIn(S, n);
  const LR = "const LR_PARTS=[\"links\",\"supplies\",\"books\",\"orders\",\"notes\"];\n" + ["lrSafeUrl", "lrList", "lrStr", "lrDate", "lrClean", "lrHost"].map(fnp).join("\n");
  const SIGN = ["_unitActs", "_nbActKeys", "_nbActWrite", "_nbActRemove", "unitActPoints", "unitActivityClaim", "unitActivityDone"].map(fnp).join("\n");
  const PIC = fnp("_picSlug") + "\n" + fnp("picStorePath");
  const VIEW = ["var wbView=null, _wbAutoT=null, _wbRO=null, wbBooks={bk:{id:'bk',name:'Book',pages:3,imgs:{1:'https://w.example/p1.jpg',2:'https://w.example/p2.jpg',3:'https://w.example/p3.jpg'}}}; const WB_PEN=\"#1d4ed8\", WB_MOMPEN=\"#dc2626\";",
    ...["wbBook", "wbInkPath", "wbMomEyes", "wbAssignClean", "wbAssignRender", "wbOpen", "wbClose", "wbBarRender", "wbTool", "wbTogglePen", "wbGo", "wbLoadPage", "wbFit", "wbWatchFit", "wbPaint", "wbPt", "wbEraseAt", "wbUndo", "wbClear", "wbMarkDirty", "wbAutoSaveSoon", "wbSave"].map(fn),
    S.slice(S.indexOf("(function wbBindOnce(){"), S.indexOf("function wbPt("))].join("\n");
  const blocks = ["UNITTRACK", "UTADDACT", "UACTKIND", "UACTLINK", "UACTPRINT", "UACTPAGES"].map(n => cut("// " + n + "_START", "// " + n + "_END")).join("\n") +
    "\n" + (o.base ? "" : cut("// UACTSCREEN_START", "// UACTSCREEN_END")) + "\n" + (!o.ans || o.base ? "" : (S.indexOf("// UACTANS_START") >= 0 ? cut("// UACTANS_START", "// UACTANS_END") : "")) + "\n" + cut("// DAYCARD_START", "// DAYCARD_END");
  vm.createContext(ctx);
  vm.runInContext(LR + "\n" + blocks + "\n" + SIGN + "\n" + PIC + "\n" + fnp("ubSlug") + "\n" + fn("renderClaimQueue") + "\n" + VIEW, ctx);
  const ev = (x, y, pt) => ({ target: reg["wb-ink"], pointerType: pt || "touch", clientX: x, clientY: y + 60, pressure: 0.5, pointerId: 1, buttons: 1, preventDefault() {} });
  const fire = (t, e) => (listeners[t] || []).forEach(f => f(e));
  const stroke = pts => { fire("pointerdown", ev(pts[0][0], pts[0][1])); pts.slice(1).forEach(p => fire("pointermove", ev(p[0], p[1]))); fire("pointerup", {}); };
  const runTimers = () => { let n = 0; timers.filter(t => t.live).forEach(t => { t.live = false; t.f(); n++; }); return n; };
  const G = id => { const u = ctx.unitStudies.harv; return { day: ctx.utRef("harv", ctx.utDay(u, id)), u: u, first: null, present: [] }; };
  return { ctx, reg, writes, reads, toasts, timers, store, puts, stroke, runTimers, G, call: e => vm.runInContext(e, ctx), bar: () => reg["wb-bar"] ? reg["wb-bar"].innerHTML : "", card: id => ctx.dcDayHTML(G(id || "d2")) };
}
const flush = async () => { for (let i = 0; i < 8; i++) await new Promise(r => setImmediate(r)); };
const sets = w => w.writes.filter(x => x[0] === "set");
const OPEN = k => "uascOpen('harv','seed_sheet','" + k + "')";
const INK = (k, p) => "unitWork/" + k + "/harv/seed_sheet/" + (p || 1);
const ids = h => [...String(h).matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
const dup = L => L.filter((x, i) => L.indexOf(x) !== i);

(async () => {
console.log("── the box: How it's done ──");
{
  const w = world({ mom: true, do: undefined });
  const a = w.ctx.unitStudies.harv.activities[1];
  const box = w.call("uapKindHTML('harv-d2','print',unitStudies.harv.activities[1])");
  ok("a printable with pages: three chips, paper pressed when there is no `do` (no field = paper)", /How it’s done:/.test(box) && /id="uasc-harv-d2-do-paper" aria-pressed="true"/.test(box) && /id="uasc-harv-d2-do-screen" aria-pressed="false"/.test(box) && /id="uasc-harv-d2-do-either" aria-pressed="false"/.test(box) && />✍️ screen</.test(box));
  ok("…and it says how many pages the screen gets", /the kid writes on the 2 pages/.test(box));
  const L = ids(box), all = ids(w.call("utaaEditorHTML(unitStudies.harv,unitStudies.harv.track.days[1])"));
  ok("every id in the day editor is unique (the kind chips, the 🖨 box, the switch)", dup(all).length === 0 && L.every(i => all.indexOf(i) >= 0), dup(all));
  const dom = { "utaa-harv-d2-title": { value: a.title }, "utaa-harv-d2-points": { value: String(a.points) }, "utaa-harv-d2-desc": { value: "" } };
  const w2 = world({ mom: true, dom });
  ok("a chip tap repaints in place and writes nothing", w2.call("uascDoPick('harv-d2','either')") === true && w2.writes.length === 0);
  ok("✎ Save: ONE update, exactly …/do = \"either\"", w2.call("utaaEdit('harv','d2')") === true && w2.writes.length === 1 && J(w2.writes[0]) === J(["update", "", { "unitStudies/harv/activities/1/do": "either" }]), w2.writes);
  w2.writes.length = 0;
  ok("✎ Save again with nothing picked: nothing written", w2.call("utaaEdit('harv','d2')") === false && w2.writes.length === 0);
  const w3 = world({ mom: true, dom, do: "either" });
  w3.call("uascDoPick('harv-d2','screen')"); w3.call("utaaEdit('harv','d2')");
  ok("either → screen: only …/do", w3.writes.length === 1 && J(w3.writes[0][2]) === J({ "unitStudies/harv/activities/1/do": "screen" }));
  const w4 = world({ mom: true, dom });
  w4.call("uascDoPick('harv-d2','paper')"); w4.call("utaaEdit('harv','d2')");
  ok("paper picked on a record with no `do`: nothing written (it already is paper)", w4.writes.length === 0);
  const w5 = world({ mom: true, dom, dry: true });
  w5.call("uascDoPick('harv-d2','either')"); w5.call("utaaEdit('harv','d2')");
  ok("dry run: ✎ Save writes nothing", w5.writes.length === 0);
  const w6 = world({ mom: false, dom });
  ok("not Mom: the chip refuses", w6.call("uascDoPick('harv-d2','either')") === false);
  const w7 = world({ mom: true, dom, pages: null });
  const b7 = w7.call("uapKindHTML('harv-d2','print',unitStudies.harv.activities[1])");
  ok("a printable with a PDF but no pages: paper only, no screen chip, and why", !/uasc-harv-d2-do-/.test(b7) && /🖨 paper/.test(b7) && /Paper only: this PDF has no pages made for the screen/.test(b7));
  w7.call("uascDoPick('harv-d2','either')"); w7.call("utaaEdit('harv','d2')");
  ok("…and ✎ Save can't switch it", w7.writes.length === 0);
  const b8 = w.call("uapKindHTML('harv-d9','print',null)");
  ok("a new activity (no PDF yet): paper for now, and it says pages arrive with the PDF and start as “either”", /Paper only for now: the screen needs the PDF’s pages/.test(b8) && /starts as “either”/.test(b8) && !/uasc-harv-d9-do-/.test(b8));
}

console.log("── a new printable starts as “either” when its pages are made ──");
{
  const PDF = { name: "leaf map.pdf", size: 400000, type: "application/pdf", arrayBuffer: async () => "BYTES" };
  const w = world({ mom: true });
  await w.call("uapFile('harv-d3',{files:[" + J(PDF).slice(0, -1) + ",arrayBuffer:async()=>'B'}],value:''})"); await flush();
  const up = w.writes.filter(x => x[0] === "update");
  const last = up[up.length - 1] || [];
  ok("the pages' ONE update also carries …/do = \"either\" (the record had none)", up.length === 2 && J(Object.keys(last[2] || {})) === J(["unitStudies/harv/activities/2/pdf/pages/1", "unitStudies/harv/activities/2/pdf/pages/2", "unitStudies/harv/activities/2/do"]) && last[2]["unitStudies/harv/activities/2/do"] === "either", up);
  ok("…and the record in memory says either", w.ctx.unitStudies.harv.activities[2].do === "either");
  const u = UNIT(); u.activities[2].do = "paper";
  const w2 = world({ mom: true, unit: u });
  await w2.call("uapFile('harv-d3',{files:[{name:'leaf.pdf',size:9,type:'application/pdf',arrayBuffer:async()=>'B'}],value:''})"); await flush();
  const up2 = w2.writes.filter(x => x[0] === "update"), l2 = up2[up2.length - 1] || [];
  ok("Mom's own pick (paper) is never overwritten: pages only", up2.length === 2 && Object.keys(l2[2] || {}).every(k => /pdf\/pages\/\d$/.test(k)) && u.activities[2].do === "paper", up2);
  const w3 = world({ mom: true, numPages: 21 });
  await w3.call("uapFile('harv-d3',{files:[{name:'leaf.pdf',size:9,type:'application/pdf',arrayBuffer:async()=>'B'}],value:''})"); await flush();
  ok("over 20 pages: no pages, no `do` (stays paper)", w3.writes.filter(x => x[0] === "update").length === 1 && w3.ctx.unitStudies.harv.activities[2].do === undefined);
  const w4 = world({ mom: true, base: true });
  await w4.call("uapFile('harv-d3',{files:[{name:'leaf.pdf',size:9,type:'application/pdf',arrayBuffer:async()=>'B'}],value:''})"); await flush();
  const l4 = w4.writes.filter(x => x[0] === "update").pop() || [];
  ok("baseline (tree minus the feature): the same upload writes pages only", J(Object.keys(l4[2] || {})) === J(["unitStudies/harv/activities/2/pdf/pages/1", "unitStudies/harv/activities/2/pdf/pages/2"]));
}

console.log("── Today's card ──");
{
  const same = (o, d) => { const a = world(o), b = world(Object.assign({ base: true }, o)); return [a.card(d), b.card(d)]; };
  const devs = [["Mom", { mom: true }], ["a kid's tablet", { kc: "k1" }], ["the board", {}]];
  for (const [nm, o] of devs) {
    let [x, y] = same(Object.assign({}, o));
    ok(nm + ": a printable with pages but no `do` (every record from before) → byte-identical", x === y && /Finish the paper Mom printed: Seed sorting sheet/.test(x));
    [x, y] = same(Object.assign({ do: "paper" }, o));
    ok(nm + ": do = paper → byte-identical", x === y);
    [x, y] = same(Object.assign({ do: "either", pages: null }, o));
    ok(nm + ": either, but no pages → byte-identical (paper only)", x === y);
    [x, y] = same(Object.assign({ do: "either" }, o), "d3");
    ok(nm + ": another day's printable with no PDF → byte-identical", x === y);
    [x, y] = same(Object.assign({ do: "either" }, o), "d1");
    ok(nm + ": a day with no activity → byte-identical", x === y);
  }
  const kid = world({ kc: "k1", do: "either" }).card(), kidB = world({ kc: "k1", do: "either", base: true }).card();
  ok("either, his own tablet: the 🖨 line AND “✍️ Do it on the screen” for himself", kid.indexOf("Finish the paper Mom printed") > 0 && /<button data-uasc-open="k1" onclick="uascOpen\('harv','seed_sheet','k1'\)"[^>]*>✍️ Do it on the screen<\/button>/.test(kid));
  ok("…and nothing else changed on the card", kid.replace(/<div style="margin-top:10px"><button data-uasc-open[^]*?<\/button><\/div>/, "") === kidB);
  const scr = world({ kc: "k1", do: "screen" }).card();
  ok("screen: the door only, no 🖨 line", scr.indexOf("Finish the paper") < 0 && /✍️ Do it on the screen/.test(scr));
  const mom = world({ mom: true, do: "either" }).card();
  ok("Mom: “👁 Look · <name>” per kid in the unit, each opening that kid's page", /uascOpen\('harv','seed_sheet','k1'\)"[^>]*>👁 Look · Ada</.test(mom) && /uascOpen\('harv','seed_sheet','k2'\)"[^>]*>👁 Look · Ben</.test(mom) && !/'k3'/.test(mom) && !/Do it on the screen/.test(mom));
  const brd = world({ do: "either" }).card();
  ok("the board: a line, no button", /data-uasc-board="1"[^>]*>✍️ Or on the screen — on your own tablet</.test(brd) && !/uascOpen/.test(brd));
  ok("a kid not in the unit: the board's line, no button", !/uascOpen/.test(world({ kc: "k3", do: "either" }).card()) && /Do it on the screen — on your own tablet/.test(world({ kc: "k3", do: "screen" }).card()));
  ok("the card's buttons carry no element id (a card can have several rows)", !/\sid="/.test(kid.match(/data-uasc[^]*$/)[0].split("</div>")[0]) && !/<button[^>]* id="uasc/.test(mom));
}

console.log("── opening the page: who may ──");
{
  const w = world({ kc: "k1", do: "either" });
  ok("his own tablet opens his own page", w.call(OPEN("k1")) === true && w.ctx.wbView && w.ctx.wbView.bookId === "uact~harv~seed_sheet" && w.ctx.wbView.kid === "k1" && w.ctx.wbView.page === 1);
  await flush();
  ok("page 1's picture (pages read with the database's empty first slot), his ink read from unitWork/k1/harv/seed_sheet/1", w.reg["wb-img"].src === P1 && J(w.reads) === J([INK("k1")]), w.reads);
  ok("the viewer's own overlay (#wb-view, #wb-ink), its bar is the printable's: ✕ · title · p 1 / 2 · the tools · 💾", !!w.reg["wb-view"] && !!w.reg["wb-ink"] && /uascClose\(\)/.test(w.bar()) && /🖨 Seed sorting sheet/.test(w.bar()) && /p 1 \/ 2/.test(w.bar()) &&
    ["wbTool('pen')", "wbTool('erase')", "wbUndo()", "wbClear()", "wbTogglePen()", "uascGo(-1)", "uascGo(1)", "uascSaveNow()"].every(s => w.bar().indexOf(s) >= 0) && !/wbGo\(|wbSave\(|Key|ANSWER/.test(w.bar()), w.bar());
  ok("a thicker pen for a finger", w.ctx.wbView.penW === 0.004);
  ok("“👆 Finger too” is on (no Pencil needed)", /👆 Finger too/.test(w.bar()) && w.ctx.wbView.penOnly === false);
  ok("one page open at a time: a second open is refused", w.call(OPEN("k1")) === false && /Close the page/.test(w.toasts.join()));
  const sib = world({ kc: "k2", do: "either" });
  ok("a sibling's tablet cannot open his page (nothing read)", sib.call(OPEN("k1")) === false && !sib.ctx.wbView && sib.reads.length === 0 && /isn’t open to this tablet/.test(sib.toasts.join()));
  ok("the board (no kid picked) cannot open anyone's", world({ do: "either" }).call(OPEN("k1")) === false);
  ok("a kid not in the unit cannot open his own", world({ kc: "k3", do: "either" }).call(OPEN("k3")) === false);
  ok("paper (no `do`): a kid's tablet cannot open it", world({ kc: "k1" }).call(OPEN("k1")) === false);
  ok("no pages: nobody can open it, Mom neither", world({ kc: "k1", do: "either", pages: null }).call(OPEN("k1")) === false && world({ mom: true, do: "either", pages: null }).call(OPEN("k1")) === false);
  ok("Mom opens any kid in the unit (paper set or not), not a kid outside it", world({ mom: true }).call(OPEN("k2")) === true && world({ mom: true }).call(OPEN("k3")) === false);
  const obj = world({ kc: "k1", do: "screen", pages: { 1: P1, 2: P2 } });
  ok("pages as an object {1,2} read the same", obj.call(OPEN("k1")) === true && obj.call("wbBook('uact~harv~seed_sheet').pages") === 2);
  const gap = world({ kc: "k1", do: "screen", pages: [null, P1, "data:image/jpeg;base64,xx", P2] });
  ok("a page that isn't an https link ends the book there (never a data URI)", gap.call(OPEN("k1")) === true && gap.call("wbBook('uact~harv~seed_sheet').pages") === 1);
}

console.log("── his writing ──");
{
  const w = world({ kc: "k1", do: "either" }); w.call(OPEN("k1")); await flush();
  w.stroke([[100, 100], [200, 150], [300, 160]]);
  const s0 = w.ctx.wbView.strokes[0];
  ok("a finger stroke draws blue, the fat pen (0.004 + half for pressure)", s0 && s0.c === "#1d4ed8" && s0.w === 0.006 && s0.p.length === 3 && w.ctx.wbView.dirty === true);
  ok("💾 shows until it saves", /💾 Save/.test(w.bar()));
  w.runTimers(); await flush();
  const st = sets(w);
  ok("3 s after the finger lifts: ONE set at unitWork/k1/harv/seed_sheet/1 = {v:1, s:[…], ts}", st.length === 1 && st[0][1] === INK("k1") && st[0][2].v === 1 && st[0][2].s.length === 1 && typeof st[0][2].ts === "number", st);
  ok("never workbookWork, never anything else", w.writes.every(x => x[0] === "set" && /^unitWork\/k1\/harv\/seed_sheet\/\d$/.test(x[1])) && !J(w.writes).includes("workbookWork"));
  ok("✓ Saved after", /✓ Saved/.test(w.bar()) && w.ctx.wbView.dirty === false);
  w.stroke([[400, 400], [420, 420]]);
  await w.call("uascGo(1)"); await flush();
  ok("▶ saves page 1 first, then page 2: its picture, its own ink path", sets(w).length === 2 && sets(w)[1][2].s.length === 2 && w.ctx.wbView.page === 2 && w.reg["wb-img"].src === P2 && w.reads[w.reads.length - 1] === INK("k1", 2) && /p 2 \/ 2/.test(w.bar()));
  await w.call("uascGo(1)");
  ok("no page 3 (the book has 2)", w.ctx.wbView.page === 2);
  w.stroke([[10, 10], [20, 20]]);
  await w.call("uascClose()"); await flush();
  ok("✕ saves page 2 and closes", sets(w).length === 3 && sets(w)[2][1] === INK("k1", 2) && !w.ctx.wbView && !w.reg["wb-view"]);
  // Mom opens the same page later on her own screen
  const m = world({ mom: true, do: "either", store: w.store });
  m.call(OPEN("k1")); await flush();
  ok("Mom opens his page 1 and sees his writing", m.ctx.wbView.kid === "k1" && m.ctx.wbView.strokes.length === 2 && /👁 your pen is red/.test(m.bar()) && /Ada/.test(m.bar()));
  m.stroke([[500, 500], [520, 520]]);
  ok("Mom's pen is red (the viewer's own rule)", m.ctx.wbView.strokes[2].c === "#dc2626");
  m.runTimers(); await flush();
  ok("her red marks save into HIS page record", sets(m).length === 1 && sets(m)[0][1] === INK("k1") && sets(m)[0][2].s.length === 3);
}

console.log("── refused, said plainly, his writing kept ──");
{
  const w = world({ kc: "k1", do: "either", setFails: true }); w.call(OPEN("k1")); await flush();
  w.stroke([[100, 100], [200, 150]]); w.runTimers(); await flush();
  ok("the database says no: the bar says so, the stroke stays, still unsaved", /Didn’t save — the database said no\. Your writing is still here/.test(w.bar()) && w.ctx.wbView.strokes.length === 1 && w.ctx.wbView.dirty === true, w.bar());
  ok("no alert pops up (the autosave and the bar say it)", !w.toasts.some(t => /^ALERT/.test(t)));
  await w.call("uascGo(1)"); await flush();
  ok("▶ on a page that didn't save stays on it", w.ctx.wbView.page === 1);
  await w.call("uascClose()"); await flush();
  ok("✕ the first time stays open and says “Tap ✕ again”", !!w.ctx.wbView && /Tap ✕ again to close without it/.test(w.bar()));
  const n = sets(w).length; await w.call("uascClose()"); await flush();
  ok("✕ again closes, with no second write", !w.ctx.wbView && sets(w).length === n);
  const sw = world({ kc: "k1", do: "either" }); sw.call(OPEN("k1")); await flush();
  sw.ctx.kcKid = "k2"; sw.stroke([[100, 100], [200, 150]]); sw.runTimers(); await flush();
  ok("the tablet switched to a sibling while his page was open: nothing written, said in the bar", sets(sw).length === 0 && /isn’t open to this tablet/.test(sw.bar()));
  const d = world({ kc: "k1", do: "either", dry: true }); d.call(OPEN("k1")); await flush();
  d.stroke([[100, 100], [200, 150]]); d.runTimers(); await flush();
  ok("dry run: nothing written, the bar says so", d.writes.length === 0 && /Dry run — nothing saved/.test(d.bar()));
  await d.call("uascClose()"); ok("…and ✕ closes", !d.ctx.wbView && d.writes.length === 0);
  const nd = world({ kc: "k1", do: "either", noDb: true }); nd.call(OPEN("k1")); await flush();
  nd.stroke([[100, 100], [200, 150]]); nd.runTimers(); await flush();
  ok("no connection: the bar says it isn't saved", /Not connected — your writing is still here/.test(nd.bar()) && nd.ctx.wbView.dirty === true);
  ok("wbInkPath refuses a sibling's page outright (throws — nothing read or written)", (() => { try { sw.call("wbInkPath('k1','uact~harv~seed_sheet',1)"); return false; } catch (e) { return /not this device/.test(e.message); } })());
  ok("…and a page number outside the book", (() => { try { world({ mom: true, do: "either" }).call("wbInkPath('k1','uact~harv~seed_sheet',21)"); return false; } catch (e) { return true; } })());
  ok("a workbook's path is unchanged", w.call("wbInkPath('k1','bk',3)") === "workbookWork/k1/bk/3" && w.call("wbInkPath('k1','uact~x',3)") === "workbookWork/k1/uact~x/3");
}

console.log("── Mom's Day ⏳: 👁 Look beside ✓ Approve ──");
{
  const claims = { k1: { seed_sheet: { ts: 1 } } };
  const q = o => { const a = world(Object.assign({ mom: true, claims }, o)), b = world(Object.assign({ mom: true, claims, base: true }, o)); return [a.call("renderClaimQueue()"), b.call("renderClaimQueue()")]; };
  let [x, y] = q({ do: "either" });
  ok("a claimed screen printable: 👁 Look opens his page, right before ✓ Approve", /uascOpen\('harv','seed_sheet','k1'\)"[^>]*>👁 Look<\/button><button onclick="unitActivityApprove\('harv','k1','seed_sheet'\)/.test(x));
  ok("…and nothing else in the row changed", x.replace(/<button data-uasc-look-kid[^]*?<\/button>/, "") === y);
  [x, y] = q({});
  ok("paper (no `do`): byte-identical", x === y && /unitActivityApprove/.test(x));
  [x, y] = q({ do: "either", pages: null });
  ok("no pages: byte-identical", x === y);
}

console.log("── a workbook is exactly as before ──");
{
  const pair = async o => { const a = world(o), b = world(Object.assign({ base: true }, o)); a.call("wbOpen('bk','k1',2)"); b.call("wbOpen('bk','k1',2)"); await flush(); return [a, b]; };
  const [a, b] = await pair({ kc: "k1" });
  ok("its bar: byte-identical", a.bar() === b.bar() && /wbSave\(\)/.test(a.bar()) && /p 2 \/ 3/.test(a.bar()));
  ok("its ink read: workbookWork/k1/bk/2 in both", J(a.reads) === J(b.reads) && a.reads[0] === "workbookWork/k1/bk/2");
  a.stroke([[100, 100], [200, 150]]); b.stroke([[100, 100], [200, 150]]);
  ok("the workbook pen is the thin one", a.ctx.wbView.strokes[0].w === 0.0039 && J(a.ctx.wbView.strokes) === J(b.ctx.wbView.strokes));
  a.runTimers(); b.runTimers(); await flush();
  const sa = sets(a), sb = sets(b);
  ok("its save: one set at workbookWork/k1/bk/2 in both", sa.length === 1 && sa[0][1] === "workbookWork/k1/bk/2" && J(sa.map(x => [x[1], x[2].s])) === J(sb.map(x => [x[1], x[2].s])));
  ok("uascGo / uascClose on a workbook do nothing special (✕ = wbClose)", a.call("uascIs(wbView.bookId)") === false);
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
})();
