// ⌨️ UACTANS — "My answers", typed beside the page (piece 4c, commit 2 of PLAN_unit_activity_types §7.1; a beta mom 2026-11-20: "Type
//   answers in boxes beside the page" — "Because we don’t have a pen, they could type"; she checks "later on my own screen"; her go
//   2026-11-22). Runs the REAL unit blocks, UACTSCREEN, UACTANS, the day card and the workbook viewer against a fake DOM, db and
//   visualViewport. No real names.
//   · one box beside the page (under it upright); the kid types; saved per page at unitWork/<kid>/<unitId>/<key>/t/<page>, apart
//     from the ink, ≤ 2,000 letters, 2.5 s after typing stops and before ◀ ▶ / ✕, behind db && !_dryRun
//   · Mom sees his text read-only and can't type into it; a sibling's tablet never reads it; refusals said, the text kept
//   · the keyboard: the viewer is fitted to what the keyboard leaves and the box scrolled into view
//   · the tree minus the feature (UACTANS not loaded): the viewer, the card and a workbook are as in commit 1
//   run: node test_unit_act_ans.js
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
  o = o || {}; const S = src;
  const reg = {}, writes = [], reads = [], toasts = [], timers = [], listeners = {}, store = Object.assign({}, o.store || {}), puts = [];
  const make = id => {
    const el = { id: id || "", style: {}, attrs: {}, _html: "", width: 0, height: 0, ops: [], value: "", setAttribute(k, v) { this.attrs[k] = v; }, getAttribute(k) { return this.attrs[k]; },
      remove() { const sub = [this, ...(this._kids || []).map(k => reg[k]).filter(Boolean)]; sub.forEach(e => (e.children || []).forEach(c => c.remove())); Object.keys(reg).forEach(k => { if (k === this.id || (this._kids || []).indexOf(k) >= 0) delete reg[k]; }); },
      insertAdjacentHTML(w, h) { this.adj = (this.adj || "") + h; }, setPointerCapture() {}, appendChild(c) { if (c.id) reg[c.id] = c; (this.children = this.children || []).push(c); return c; },
      toBlob(cb, type, q) { cb({ blob: true, type: type }); }, focus() { ctx.document.activeElement = this; }, scrollIntoView(a) { (this.scrolls = this.scrolls || []).push(a); },
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
    window: { devicePixelRatio: 2, addEventListener() {}, visualViewport: o.vv || null }, haDragOn() {}, haDragOff() {} };
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
    "\n" + (o.base ? "" : cut("// UACTSCREEN_START", "// UACTSCREEN_END")) + "\n" + (o.ans === false ? "" : (S.indexOf("// UACTANS_START") >= 0 ? cut("// UACTANS_START", "// UACTANS_END") : "")) + "\n" + cut("// DAYCARD_START", "// DAYCARD_END");
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
const code = s => s.split("\n").filter(l => !/^\s*\/\//.test(l)).join("\n");
const BLK = cutIn(src, "// UACTANS_START", "// UACTANS_END") + "// UACTANS_END\n";
const SCR = cutIn(src, "// UACTSCREEN_START", "// UACTSCREEN_END");
const NAMES = /\b(adrienne|andrew|julian|lincoln|ellis|lucy|sara|sarah|caleb|taylor|makenzie|kenzie|dewalt|burris|melanie|howe)\b/i;
const TA = w => w.reg["uasc-ans-ta"], RO = w => w.reg["uasc-ans-ro"], STL = w => (w.reg["uasc-ans-st"] || {}).textContent || "";
const type = (w, t) => { TA(w).value = t; return w.call("uascAnsInput(document.getElementById('uasc-ans-ta'))"); };
const TXT = (k, p) => "unitWork/" + k + "/harv/seed_sheet/t/" + (p || 1);

(async () => {
console.log("── the block and its hooks ──");
ok("UACTANS is one marked block right after UACTSCREEN", src.indexOf("// UACTSCREEN_END\n// UACTANS_START") > 0 && src.split("// UACTANS_START").length === 2);
const hooks = src.replace(BLK, "").split("\n").filter(l => /UACTANS/.test(l));
ok("four guarded hooks, all inside UACTSCREEN (open · bar · ◀ ▶ · ✕), none in the viewer or a workbook", hooks.length === 4 && hooks.every(l => SCR.indexOf(l) >= 0 && /typeof uascAns\w+==="function"/.test(l)), hooks);
const C = code(BLK);
ok("its database calls: ONE once (the page's text, on open) and ONE set — no update / remove / transaction / on / push", (C.match(/db\.ref\(/g) || []).length === 2 && /db\.ref\(path\)\.once\("value"\)/.test(C) && /await db\.ref\(path\)\.set\(txt\?txt:null\)/.test(C) && !/\.update\(|\.remove\(|\.transaction\(|\.on\(|\.push\(|firebase|HA_LS|localStorage/.test(C));
ok("the path is UACTSCREEN's gated ink path with /t/ before the page", /const ink=uascInkPath\(kid,id,page\); return ink\.slice\(0,ink\.lastIndexOf\("\/"\)\)\+"\/t\/"\+parseInt\(page,10\);/.test(C));
ok("the save asks dry run and db before writing", C.indexOf("uascDryRun()") < C.indexOf(".set(txt") && C.indexOf('typeof db==="undefined"||!db') < C.indexOf(".set(txt"));
ok("at most 2,000 letters (maxlength and the save)", /const UASC_ANS_MAX=2000;/.test(C) && /maxlength="'\+UASC_ANS_MAX\+'"/.test(C) && (C.match(/slice\(0,UASC_ANS_MAX\)/g) || []).length >= 3);
ok("the spelling is his: no autocorrect, no spell-check, no autocomplete, no auto-capitals; 18px so an iPad doesn't zoom", /autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"/.test(C) && /font-size:18px/.test(C));
ok("nothing to set up, nothing checked, no answer shown: no questions, no key, no compare", !/question|answer ?key|correct\b|===\s*a\.answer|wbOpenCheck/i.test(C.replace(/autocorrect="off"/, "")));
ok("no kid or family name, no 🔀", !NAMES.test(BLK) && BLK.indexOf("\u{1F500}") < 0, (BLK.match(NAMES) || [])[0]);
const testTxt = fs.readFileSync(__filename, "utf8").split("\n").filter(l => !/^const NAMES =/.test(l)).join("\n");
ok("this test file names no real kid or family", !NAMES.test(testTxt), (testTxt.match(NAMES) || [])[0]);

console.log("── his tablet: the box beside the page ──");
{
  const w = world({ kc: "k1", do: "either", store: { [TXT("k1")]: "1. seeds" } });
  w.call(OPEN("k1"));
  ok("the box is on the viewer's stage, after the page", !!w.reg["uasc-ans"] && (w.reg["wb-stage"].children || []).indexOf(w.reg["uasc-ans"]) >= 0 && !!TA(w) && !RO(w));
  ok("disabled until his text is read (so nothing typed is overwritten)", TA(w).disabled === true);
  await flush();
  ok("read once: his ink at …/1 and his text at …/t/1, nothing written", J(w.reads.slice().sort()) === J([INK("k1"), TXT("k1")]) && w.writes.length === 0, w.reads);
  ok("his saved text is in the box, the box open to type, label “⌨️ My answers · page 1”", TA(w).value === "1. seeds" && TA(w).disabled === false && w.reg["uasc-ans-lbl"].textContent === "⌨️ My answers · page 1");
  ok("the page and the box share the row on a wide screen; under the page when the iPad is upright", w.reg["wb-hold"].style.flex === "1 1 560px" && w.reg["wb-hold"].style.maxWidth === "900px" &&
    /#uasc-ans\{flex:1 1 280px;max-width:520px/.test(w.reg["uasc-ans"].innerHTML) && /@media \(orientation:portrait\)\{#uasc-ans\{flex-basis:100%;max-width:900px\}\}/.test(w.reg["uasc-ans"].innerHTML));
  ok("the bar has “⌨️ My answers” (jumps to the box)", /uascAnsGo\(\)"[^>]*>⌨️ My answers</.test(w.bar()));
  const editor = w.call("utaaEditorHTML(unitStudies.harv,unitStudies.harv.track.days[1])"), card = world({ kc: "k1", do: "either" }).card();
  const all = [...ids(editor), ...ids(card), ...ids(w.reg["wb-view"].innerHTML), ...ids(w.bar()), ...ids(w.reg["uasc-ans"].innerHTML), "uasc-ans"];
  ok("every id unique with the day editor's 🖨 box, the day card and the viewer + box all on the page", dup(all).length === 0 && all.indexOf("uasc-ans-ta") >= 0 && all.indexOf("wb-ink") >= 0, dup(all));
  ok("typing keeps it on the page and waits", type(w, "1. seeds  2. a pod") === true && sets(w).length === 0 && STL(w) === "…");
  const t = w.timers.filter(x => x.live && x.ms === 2500);
  ok("2.5 s after he stops typing it saves", t.length === 1);
  w.runTimers(); await flush();
  ok("ONE set: unitWork/k1/harv/seed_sheet/t/1 = the text, nothing else", sets(w).length === 1 && J(sets(w)[0]) === J(["set", TXT("k1"), "1. seeds  2. a pod"]) && STL(w) === "✓ Saved", sets(w));
  w.stroke([[100, 100], [200, 150]]); w.runTimers(); await flush();
  const ink = sets(w)[1];
  ok("his ink saves at …/1 — the text is never in the ink record and the ink never at …/t/", ink && ink[1] === INK("k1") && !J(ink[2]).includes("pod") && w.store[TXT("k1")] === "1. seeds  2. a pod");
  type(w, "x".repeat(2500)); w.runTimers(); await flush();
  ok("at most 2,000 letters are kept", sets(w)[2] && sets(w)[2][2].length === 2000);
  type(w, ""); w.runTimers(); await flush();
  ok("emptied → the leaf goes (set null on that one path)", J(sets(w)[3]) === J(["set", TXT("k1"), null]));
  type(w, "page one");
  await w.call("uascGo(1)"); await flush();
  const n = sets(w);
  ok("▶ saves the box first (no wait), then opens page 2 with its own text", n[4] && J(n[4]) === J(["set", TXT("k1"), "page one"]) && w.ctx.wbView.page === 2 && w.reads.indexOf(TXT("k1", 2)) >= 0 && w.reg["uasc-ans-lbl"].textContent === "⌨️ My answers · page 2" && TA(w).value === "");
  ok("…and no timer is left to save page 1's text onto page 2", w.timers.filter(x => x.live && x.ms === 2500).length === 0);
  type(w, "page two");
  await w.call("uascClose()"); await flush();
  ok("✕ saves the box and closes", J(sets(w).pop()) === J(["set", TXT("k1", 2), "page two"]) && !w.ctx.wbView && !w.reg["uasc-ans"]);
  ok("no write ever outside his own unitWork page leaves", w.writes.every(x => x[0] === "set" && /^unitWork\/k1\/harv\/seed_sheet\/(t\/)?\d$/.test(x[1])));
}

console.log("── Mom: his text beside the page, read-only ──");
{
  const w = world({ mom: true, do: "either", store: { [TXT("k1")]: "1. seeds\n2. a pod" } });
  w.call(OPEN("k1")); await flush();
  ok("no box to type in: his text shows read-only, under “⌨️ Ada’s answers · page 1”", !TA(w) && RO(w).textContent === "1. seeds\n2. a pod" && w.reg["uasc-ans-lbl"].textContent === "⌨️ Ada’s answers · page 1");
  ok("her bar says “⌨️ Answers”", /uascAnsGo\(\)"[^>]*>⌨️ Answers</.test(w.bar()));
  ok("she cannot type into his text (refused even if called)", w.call("uascAnsInput({value:'oops'})") === false && w.ctx.wbView.ans.text === "1. seeds\n2. a pod");
  w.stroke([[300, 300], [320, 330]]);
  await w.call("uascClose()"); await flush();
  ok("closing writes her red ink only — his text is never written from her screen", sets(w).length === 1 && sets(w)[0][1] === INK("k1") && !w.writes.some(x => /\/t\//.test(x[1])));
  const e = world({ mom: true, do: "either" }); e.call(OPEN("k2")); await flush();
  ok("a page with nothing typed: “Nothing typed on this page yet.”", RO(e).textContent === "Nothing typed on this page yet.");
}

console.log("── refused, said plainly, what he typed kept ──");
{
  const w = world({ kc: "k1", do: "either", setFails: true }); w.call(OPEN("k1")); await flush();
  type(w, "my answer"); w.runTimers(); await flush();
  ok("the database says no: the line under the box says so, the text stays in the box", /Didn’t save — the database said no\. What you typed is still here/.test(STL(w)) && TA(w).value === "my answer" && w.ctx.wbView.ans.saved === "");
  await w.call("uascGo(1)"); await flush();
  ok("▶ stays on the page", w.ctx.wbView.page === 1);
  await w.call("uascClose()"); await flush();
  ok("✕ stays open once (“Tap ✕ again”), then closes", !!w.ctx.wbView && /Tap ✕ again/.test(w.bar()) && (await w.call("uascClose()"), !w.ctx.wbView));
  const s = world({ kc: "k1", do: "either" }); s.call(OPEN("k1")); await flush();
  s.ctx.kcKid = "k2"; TA(s).value = "mine"; s.ctx.wbView.ans.text = "mine"; await s.call("uascAnsSave(wbView)");
  ok("the tablet switched to a sibling: nothing written, said plainly", sets(s).length === 0 && /isn’t open to this tablet/.test(STL(s)));
  const d = world({ kc: "k1", do: "either", dry: true }); d.call(OPEN("k1")); await flush();
  type(d, "dry"); d.runTimers(); await flush();
  ok("dry run: nothing written, “Dry run — nothing saved.”", d.writes.length === 0 && STL(d) === "Dry run — nothing saved.");
  const nd = world({ kc: "k1", do: "either", noDb: true }); nd.call(OPEN("k1")); await flush();
  ok("no connection: the box still opens, and says what he types won't save", TA(nd).disabled === false && /Not connected — what you type won’t save/.test(STL(nd)));
  type(nd, "offline"); nd.runTimers(); await flush();
  ok("…and after typing it says it isn't saved, the text kept", /isn’t saved/.test(STL(nd)) && TA(nd).value === "offline");
  const sib = world({ kc: "k2", do: "either", store: { [TXT("k1")]: "secret" } });
  ok("a sibling's tablet never opens his page, so never reads his text", sib.call(OPEN("k1")) === false && sib.reads.length === 0 && !sib.reg["uasc-ans"]);
}

console.log("── the on-screen keyboard ──");
{
  const vv = { height: 520, offsetTop: 0, addEventListener(t, f) { this.l = f; } };
  const w = world({ kc: "k1", do: "either", vv }); w.call(OPEN("k1")); await flush();
  ok("one visualViewport listener, added on the first open", typeof vv.l === "function");
  TA(w).focus(); w.call("uascAnsFocus()");
  const ov = w.reg["wb-view"].style;
  ok("the cursor in the box: the viewer is fitted to the part the keyboard leaves (520 px) and the box scrolled into view", ov.height === "520px" && ov.bottom === "auto" && ov.top === "0px" && (w.reg["uasc-ans"].scrolls || []).length >= 1);
  ok("…again once the keyboard has slid up (350 ms)", w.timers.some(t => t.live && t.ms === 350));
  vv.height = 480; vv.offsetTop = 40; vv.l();
  ok("the keyboard moves (a bar shows, the iPad turns): it follows", ov.height === "480px" && ov.top === "40px");
  w.ctx.document.activeElement = null; w.call("uascAnsFocus()");
  ok("the box lets go: the viewer fills the screen again", ov.height === "" && ov.top === "0" && ov.bottom === "0");
  ok("“⌨️ My answers” in the bar puts the cursor in the box", w.call("uascAnsGo()") === true && w.ctx.document.activeElement === TA(w));
}

console.log("── the tree minus the feature ──");
{
  const a = world({ kc: "k1", do: "either" }), b = world({ kc: "k1", do: "either", ans: false });
  a.call(OPEN("k1")); b.call(OPEN("k1")); await flush();
  ok("without UACTANS: no box, the same bar minus “⌨️ My answers”, only the ink read", !b.reg["uasc-ans"] && a.bar().replace(/<button onclick="uascAnsGo\(\)"[^>]*>⌨️ My answers<\/button>/, "") === b.bar() && J(b.reads) === J([INK("k1")]));
  ok("the day card is the same with or without it", world({ kc: "k1", do: "either" }).card() === world({ kc: "k1", do: "either", ans: false }).card());
  const wa = world({ kc: "k1" }), wb = world({ kc: "k1", ans: false }); wa.call("wbOpen('bk','k1',1)"); wb.call("wbOpen('bk','k1',1)"); await flush();
  ok("a workbook: no box, same bar, same reads", !wa.reg["uasc-ans"] && wa.bar() === wb.bar() && J(wa.reads) === J(wb.reads));
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
})();
