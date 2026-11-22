// 💾 WBDKID — the kid's own Save on a board opened from an activity row (PLAN_unit_activity_types §7.2; Sara's answer 2026-11-20:
//   a board is kept only "when someone taps Save"; Adrienne's "go with her answers and build" 2026-11-22).
//   Runs the REAL UNITTRACK + DAYCARD + WBOARD + WBDSAVE + WBDROW + WBDKID blocks, PICSTORE and the viewer's real pieces against a
//   fake DOM, canvas, Storage and db.
//   · Save = a JPEG (wbdJpeg) → Storage pictures/units/<unitId>/work/<kid>/<key>/board_<stamp>.jpg → ONE set of
//     unitWork/<kid>/<unitId>/<key>/board = {url, ts}; never a data URI; no points, no done
//   · who: the kid on his own device for himself · Mom for the kid she picks (several → the row's name chips) · nobody else
//   · refused, plainly: nothing drawn, dry run, the upload fails, the database says no, the activity or the kid isn't there
//   · Mom sees "🖼 Board · <name>" on the row (one listener per kid and activity); a kid's device and the board see nothing new
//   · baselines = this tree minus the feature: every bar and card that has no Save / no saved board is byte-identical
//   run: node test_wbd_kid_save.js
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const cut = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error("markers " + a); return src.slice(i, j + b.length); };
const fnOf = (s, name) => { let i = s.indexOf("function " + name + "("); if (i < 0) throw new Error("no " + name); if (s.slice(i - 6, i) === "async ") i -= 6;
  let d = 0, q = null; for (let j = s.indexOf("{", i); j < s.length; j++) { const c = s[j]; if (q) { if (c === "\\") j++; else if (c === q) q = null; continue; }
    if (c === "/" && s[j + 1] === "/") { j = s.indexOf("\n", j); continue; }
    if (c === "'" || c === '"' || c === "`") q = c; else if (c === "{") d++; else if (c === "}" && --d === 0) return s.slice(i, j + 1); } throw new Error("unclosed " + name); };
const fnPlain = name => { const i = src.indexOf("function " + name + "("); let d = 0, j = i, seen = false; for (; j < src.length; j++) { const c = src[j]; if (c === "{") { d++; seen = true; } else if (c === "}") { d--; if (seen && d === 0) break; } } return src.slice(i, j + 1); };
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x).slice(0, 500) : "")); } };
const J = x => JSON.stringify(x);
const code = s => s.replace(/^\s*\/\/.*$/gm, "");
const KID = cut("// WBDKID_START", "// WBDKID_END"), ROW = cut("// WBDROW_START", "// WBDROW_END"), WBD = cut("// WBOARD_START", "// WBOARD_END"), SV = cut("// WBDSAVE_START", "// WBDSAVE_END");
const UT = cut("// UNITTRACK_START", "// UNITTRACK_END"), DC = cut("// DAYCARD_START", "// DAYCARD_END");
// the tree minus the feature: the block out, each hook back to the line it replaced
const H_SAVE = ['  if(!wbdCanSave(v)) return (typeof wbdKidSaveBtnHTML==="function")?wbdKidSaveBtnHTML(v,btn):"";   // WBDKID: a row\'s board → the kid\'s own Save\n  const saved=', '  if(!wbdCanSave(v)) return ""; const saved='];
const H_ROW = ['</button>\'+((typeof wbdBoardLinksHTML==="function")?wbdBoardLinksHTML(g,act):"")+\'</div>\';   // WBDKID: 🖼 Board, Mom only', '</button></div>\';'];
const SV_BASE = SV.split(H_SAVE[0]).join(H_SAVE[1]), ROW_BASE = ROW.split(H_ROW[0]).join(H_ROW[1]);
const SIGN = ["_unitActs", "_nbActKeys", "_nbActWrite", "_nbActRemove", "unitActPoints", "unitActivityClaim", "unitActivityDone"].map(fnPlain).join("\n");
const LR = "const LR_PARTS=[\"links\",\"supplies\",\"books\",\"orders\",\"notes\"];\n" + ["lrSafeUrl", "lrList", "lrStr", "lrDate", "lrClean", "lrHost"].map(fnPlain).join("\n");
const PS = "const PICSTORE_TIMEOUT_MS=20000;\n" + ["_picSlug", "picStorePath", "picDataUrlToBlob", "picStore"].map(fnPlain).join("\n");
const VIEW = ["var wbView=null, _wbAutoT=null, _wbRO=null, wbBooks={}; const WB_PEN=\"#1d4ed8\", WB_MOMPEN=\"#dc2626\";",
  ...["wbBook", "wbInkPath", "wbAssignRender", "wbBarRender", "wbTool", "wbTogglePen", "wbFit", "wbWatchFit", "wbPaint", "wbPt", "wbEraseAt", "wbUndo", "wbClear", "wbMarkDirty", "wbAutoSaveSoon", "wbSave", "wbClose"].map(n => fnOf(src, n)),
  src.slice(src.indexOf("(function wbBindOnce(){"), src.indexOf("function wbPt("))].join("\n");
const URL_OK = "https://firebasestorage.googleapis.com/v0/b/x/o/pictures%2Funits%2Fharv%2Fwork%2Fk1%2Fmy_hol%2Fboard_abc.jpg?alt=media&token=t";
const JPEG = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ==";
const UNIT = o => ({ id: "harv", title: "Harvest", emoji: "*", decks: [], enrolled: (o && o.enrolled) || { k1: true, k2: true },
  activities: [
    { key: "my_hol", title: "Your own holiday", points: 20, day: 2, desc: "Write 2-3 sentences." },
    { key: "my_hol_2", title: "Your own holiday (younger)", points: 10, day: 2 }],
  activityLog: {}, activityClaims: {},
  track: { mode: "seq", perWeek: 4, days: [
    { id: "d2", n: 2, t: "Holidays", nb: { activity: "my_hol" } },
    { id: "d3", n: 3, t: "Rest day", note: "Read outside." }] } });

function world(o) {
  o = o || {}; const reg = {}, writes = [], puts = [], picCalls = [], listeners = {}, ons = [], asked = [];
  const make = id => {
    const el = { id: id || "", style: {}, attrs: {}, _html: "", width: 0, height: 0, ops: [], setAttribute(k, v) { this.attrs[k] = v; },
      remove() { Object.keys(reg).forEach(k => { if (k === this.id || (this._kids || []).indexOf(k) >= 0) delete reg[k]; }); },
      insertAdjacentHTML() {}, setPointerCapture() {}, toDataURL(t, q) { this.ops.push(["toDataURL", t, q]); return o.noJpeg ? "data:," : JPEG; },
      getBoundingClientRect() { if (this.id === "wbd-stage") return { left: 0, top: 52, width: 1000, height: 700 }; if (/^wb-(img|ink|hold)$/.test(this.id)) { const hs = reg["wb-hold"].style; return { left: 8, top: 60, width: parseFloat(hs.width) || 0, height: parseFloat(hs.height) || 0 }; } return { left: 0, top: 0, width: 0, height: 0 }; },
      getContext() { const ops = this.ops; return new Proxy({}, { get: (t, k) => (typeof k === "string" && /^(clearRect|beginPath|moveTo|lineTo|stroke|fillRect|drawImage)$/.test(k)) ? ((...a) => ops.push([k, ...a])) : t[k], set: (t, k, v) => { t[k] = v; ops.push(["=" + k, v]); return true; } }); } };
    Object.defineProperty(el, "innerHTML", { get() { return this._html; }, set(h) { this._html = h; const re = /id="([^"]+)"/g; let m; this._kids = []; while ((m = re.exec(h))) { if (!reg[m[1]]) reg[m[1]] = make(m[1]); this._kids.push(m[1]); } } });
    return el;
  };
  const ctx = { console: { log() {}, warn() {}, error() {} }, JSON, Object, Array, String, Number, Math, Promise, Error, Date, parseInt, isNaN, isFinite, Proxy, Set, Map, RegExp, URL, atob, Blob, Uint8Array,
    unitStudies: { harv: UNIT(o) }, ROSTER: ["k1", "k2", "k3"], KID_NAME: { k1: "Ada", k2: "Ben", k3: "Cy" }, kcKid: o.kc === undefined ? null : o.kc,
    momHere: () => ctx.MOM, MOM: !!o.mom, _dryRun: () => !!o.dry, confirm: m => { asked.push(m); return true; }, alert: m => { throw new Error("alert " + m); }, dbg: () => {}, SL_KCOL: {}, SL_KLBL: {},
    uxDocAdd: () => true, uxEsc: x => String(x),   // UNITDAY_EXTRAS stand-ins: only so WBDSAVE offers its own Save on the day board
    renderAll: () => { ctx.repaints++; }, repaints: 0, navigator: { onLine: true }, bankDirect: () => { writes.push(["bank"]); },
    db: { ref: p => ({ set: v => { writes.push(["set", p, JSON.parse(J(v === undefined ? null : v))]); return o.setFails ? Promise.reject(new Error("PERMISSION_DENIED")) : Promise.resolve(); },
      update: v => { writes.push(["update", p]); return Promise.resolve(); }, remove: () => { writes.push(["remove", p]); return Promise.resolve(); }, transaction: () => { writes.push(["tx", p]); return Promise.resolve(); },
      once: () => { writes.push(["read", p]); return Promise.resolve({ val: () => null }); }, on: (t, cb) => { ons.push({ p, t, cb }); } }) },
    firebase: { storage: () => ({ ref: p => ({ put: (blob, meta) => { puts.push([p, meta, blob && blob.type]); return o.uploadFails ? Promise.reject(new Error("storage/unauthorized")) : Promise.resolve(); }, getDownloadURL: () => Promise.resolve(URL_OK) }) }) },
    setTimeout: (f, ms) => 1, clearTimeout: () => {},
    document: { getElementById: id => reg[id] || null, createElement: () => make(""), body: { appendChild(c) { if (c.id) reg[c.id] = c; return c; } }, addEventListener: (t, f) => { (listeners[t] = listeners[t] || []).push(f); } },
    window: { devicePixelRatio: 2, addEventListener() {} }, haDragOn() {}, haDragOff() {} };
  if (o.noDb) ctx.db = null;
  vm.createContext(ctx);
  vm.runInContext(LR + "\n" + UT + "\n" + DC + "\n" + SIGN + "\n" + PS + "\n" + VIEW + "\n" + WBD + "\n" + (o.base ? SV_BASE + "\n" + ROW_BASE : SV + "\n" + ROW + "\n" + KID), ctx);
  if (o.stubPic) ctx.picStore = (d, parts) => { picCalls.push([d, parts]); return Promise.resolve(o.stubPic === "fail" ? d : URL_OK); };
  const ev = (x, y) => ({ target: reg["wb-ink"], pointerType: "touch", clientX: x, clientY: y, pressure: 0.5, pointerId: 1, buttons: 1, preventDefault() {} });
  const fire = (t, e) => (listeners[t] || []).forEach(f => f(e));
  const stroke = pts => { fire("pointerdown", ev(pts[0][0], pts[0][1])); pts.slice(1).forEach(p => fire("pointermove", ev(p[0], p[1]))); fire("pointerup", {}); };
  const G = id => { const u = ctx.unitStudies.harv; return { day: ctx.utRef("harv", ctx.utDay(u, id)), u: u, first: null, present: [] }; };
  return { ctx, reg, writes, puts, picCalls, ons, asked, stroke, G, call: e => vm.runInContext(e, ctx), bar: () => reg["wb-bar"] ? reg["wb-bar"].innerHTML : "", card: id => ctx.dcDayHTML(G(id || "d2")) };
}
const flush = async () => { for (let i = 0; i < 6; i++) await new Promise(r => setImmediate(r)); };
const visible = h => h.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
const ROWOPEN = kid => "wbdOpen({uid:'harv',dayId:'d2',key:'my_hol',kid:'" + kid + "'})";
const dataSets = w => w.writes.filter(x => x[0] !== "read");

(async () => {
console.log("── the block ──");
ok("WBDKID is a marked block right after WBDROW", src.indexOf("// WBDKID_START") === src.indexOf("// WBDROW_END") + "// WBDROW_END\n".length);
ok("two guarded hooks: the board's Save slot (WBDSAVE) and the row's bar (WBDROW); the baseline strip finds both", SV.split(H_SAVE[0]).length === 2 && ROW.split(H_ROW[0]).length === 2 && SV_BASE !== SV && ROW_BASE !== ROW);
const K = code(KID);
ok("its only database calls: ONE set and ONE listener, both on wbdBoardPath — no update / remove / transaction / push", (K.match(/db\.ref\(/g) || []).length === 2 && /db\.ref\(wbdBoardPath\(k,uid,key\)\)\.set\(rec\)/.test(K) && /db\.ref\(wbdBoardPath\(k,uid,key\)\)\.on\("value"/.test(K) && !/\.update\(|\.remove\(|\.transaction\(|\.push\(|firebase|HA_LS|localStorage/.test(K));
ok("the path is unitWork/<kid>/<unitId>/<key>/board", /return "unitWork\/"\+k\+"\/"\+uid\+"\/"\+key\+"\/board";/.test(K));
ok("the upload is picStore's, under the unit's folder for that kid and activity", /await picStore\(data,\["units",uid,"work",k,key,"board"\]\)/.test(K));
ok("never a data URI in the record: only an https link goes on", /if\(!\/\^https:\\\/\\\/\/i\.test\(String\(url\|\|""\)\)\) return wbdSay/.test(K));
ok("no points, no done: nothing of activityLog / activityClaims / the bank / unitActivityDone", !/activityLog|activityClaims|bankDirect|unitActivityDone|unitActivityClaim|points/.test(K));
ok("writes behind db && !_dryRun (dry run and no db refused before any upload)", K.indexOf("_dryRun()") < K.indexOf("picStore(") && K.indexOf('typeof db==="undefined"||!db') < K.indexOf("picStore("));
ok("no element id in the 🖼 links; finger-sized", !/\sid="/.test(fnOf(src, "wbdBoardLinksHTML")) && /min-height:44px/.test(fnOf(src, "wbdBoardLinksHTML")));
ok("no 🔀, no family names", KID.indexOf("\u{1F500}") < 0 && !/Lincoln|Ellis|Lucy|Julian|DeWalt|Taylor|Kenzie/i.test(KID));

console.log("── baseline: the tree minus the feature ──");
{
  const pair = (o, open) => { const a = world(o), b = world(Object.assign({ base: true }, o)); a.call(open); b.call(open); return [a.bar(), b.bar()]; };
  let [x, y] = pair({ mom: true }, "wbdOpen({uid:'harv',dayId:'d2'})");
  ok("Mom's day board (top bar's door): byte-identical (WBDSAVE's own Save)", x === y && /wbdSave\(\)/.test(x) && !/wbdKidSave/.test(x));
  [x, y] = pair({}, ROWOPEN(""));
  ok("the shared board, from a row: byte-identical, no Save", x === y && !/Save/.test(x));
  [x, y] = pair({ kc: "k2" }, ROWOPEN("k1"));
  ok("a sibling's device (k2's tablet, a board for k1): byte-identical, no Save", x === y && !/Save/.test(x));
  [x, y] = pair({ kc: "k3" }, ROWOPEN("k3"));
  ok("a kid not in the unit: byte-identical, no Save", x === y && !/Save/.test(x));
  [x, y] = pair({ kc: "k1" }, "wbdOpen({uid:'harv',dayId:'d2',key:'gone',kid:'k1'})");
  ok("an activity that isn't in the unit any more: byte-identical, no Save", x === y);
  [x, y] = pair({ kc: "k1" }, ROWOPEN("k1"));
  ok("the kid's own device: the old bar plus 💾 Save at the end, nothing else", x.indexOf(y) === 0 && /^<button onclick="wbdKidSave\('k1'\)"[^>]*>💾 Save<\/button>$/.test(x.slice(y.length)), x.slice(y.length));
  [x, y] = pair({ mom: true }, ROWOPEN(""));
  ok("Mom, two kids in the unit: the old bar plus \"💾 Save for\" and a chip per kid (never a guess)", x.indexOf(y) === 0 && /^<span[^>]*>💾 Save for<\/span><button onclick="wbdKidSave\('k1'\)"[^>]*>Ada<\/button><button onclick="wbdKidSave\('k2'\)"[^>]*>Ben<\/button>$/.test(x.slice(y.length)), x.slice(y.length));
  const a = world({ mom: true }), b = world({ mom: true, base: true });
  ok("Mom's card with no board saved yet: byte-identical", a.card() === b.card() && a.card("d3") === b.card("d3"));
  const c = world({ kc: "k1" }), d = world({ kc: "k1", base: true });
  ok("a kid's card: byte-identical, and it listens to nothing", c.card() === d.card() && c.ons.length === 0);
}

console.log("── a kid saves his own board ──");
{
  const w = world({ kc: "k1" }); w.call(ROWOPEN("k1")); w.call("wbdBg('grid')"); w.stroke([[100, 100], [200, 200], [300, 150]]);
  const p = w.call("wbdKidSave('k1')"); ok("while it uploads: Saving…", /Saving…/.test(w.bar()) && /Saving the board/.test(w.bar()));
  const r = await p; await flush();
  ok("Save resolves true", r === true);
  ok("ONE upload: pictures/units/harv/work/k1/my_hol/board_<stamp>.jpg, a JPEG", w.puts.length === 1 && /^pictures\/units\/harv\/work\/k1\/my_hol\/board_[a-z0-9]+\.jpg$/.test(w.puts[0][0]) && w.puts[0][1].contentType === "image/jpeg", w.puts);
  const S = dataSets(w);
  ok("ONE database write: set unitWork/k1/harv/my_hol/board = {url, ts}", S.length === 1 && S[0][0] === "set" && S[0][1] === "unitWork/k1/harv/my_hol/board" && J(Object.keys(S[0][2]).sort()) === J(["ts", "url"]) && S[0][2].url === URL_OK && typeof S[0][2].ts === "number", S);
  ok("no data URI anywhere in what was written", !/data:/.test(J(w.writes)));
  ok("no points, no done: the unit's log and claims untouched, nothing banked", J(w.ctx.unitStudies.harv.activityLog) === "{}" && J(w.ctx.unitStudies.harv.activityClaims) === "{}" && !w.writes.some(x => x[0] === "bank"));
  ok("the bar: ✓ Saved and a plain line; the board stays open with the drawing", /✓ Saved/.test(w.bar()) && /Saved — Mom will see it with your activity\./.test(w.bar()) && w.ctx.wbView.strokes.length === 1);
  ok("the JPEG is WBDSAVE's: white, the grid, the ink, 0.85", w.call("typeof wbdJpeg") === "function" && /wbdJpeg\(v\)/.test(K));
  w.call("wbClose()"); await flush();
  ok("✕ right after saving: no question, nothing more written", w.asked.length === 0 && dataSets(w).length === 1);
}
{
  const w = world({ kc: "k1" }); w.call(ROWOPEN("k1")); w.stroke([[100, 100], [200, 200]]);
  ok("his device can't save for his sister even if called", await w.call("wbdKidSave('k2')") === false && w.puts.length === 0 && w.writes.length === 0);
  await w.call("wbdKidSave('k1')"); await flush(); w.stroke([[400, 400], [450, 450]]);
  ok("a new stroke: 💾 Save again, the old line gone", /💾 Save/.test(w.bar()) && !/Saved —/.test(w.bar()));
  await w.call("wbdKidSave('k1')"); await flush();
  ok("saving again: one more upload, the same one path set again (the link replaced)", w.puts.length === 2 && dataSets(w).length === 2 && dataSets(w)[1][1] === "unitWork/k1/harv/my_hol/board");
}
{
  const w = world({ kc: "k1" }); w.call(ROWOPEN("k1")); w.stroke([[100, 100], [200, 200]]);
  w.ctx.kcKid = "k2"; w.call("wbBarRender()");
  ok("the device switched to a sibling while the board was open: Save gone, and refused if called", !/Save/.test(w.bar()) && await w.call("wbdKidSave('k1')") === false && w.writes.length === 0);
}
{
  const w = world({}); w.call(ROWOPEN("")); w.stroke([[100, 100], [200, 200]]);
  ok("the shared board: refused for anyone", await w.call("wbdKidSave('k1')") === false && await w.call("wbdKidSave('k2')") === false && w.puts.length === 0 && w.writes.length === 0);
}

console.log("── Mom saves for the kid she picks ──");
{
  const w = world({ mom: true }); w.call(ROWOPEN("")); w.stroke([[100, 100], [200, 200]]);
  await w.call("wbdKidSave('k2')"); await flush();
  const S = dataSets(w);
  ok("she taps Ben's chip: his folder, his path, one set", w.puts.length === 1 && /^pictures\/units\/harv\/work\/k2\/my_hol\/board_/.test(w.puts[0][0]) && S.length === 1 && S[0][1] === "unitWork/k2/harv/my_hol/board", S);
  ok("…his chip says ✓, the other stays to tap, and the line names him", /✓ Ben/.test(w.bar()) && /wbdKidSave\('k1'\)"[^>]*>Ada</.test(w.bar()) && /Saved with Ben’s activity\./.test(w.bar()));
  ok("a kid not in the unit can't be picked", await w.call("wbdKidSave('k3')") === false && dataSets(w).length === 1);
  const one = world({ mom: true, enrolled: { k1: true } }); one.call(ROWOPEN("")); one.stroke([[100, 100], [200, 200]]);
  ok("one kid in the unit: a plain 💾 Save, for that kid", /wbdKidSave\('k1'\)"[^>]*>💾 Save</.test(one.bar()) && !/Save for/.test(one.bar()));
  await one.call("wbdKidSave('k1')"); await flush();
  ok("…and it writes his board", dataSets(one).length === 1 && dataSets(one)[0][1] === "unitWork/k1/harv/my_hol/board");
  ok("Mom's day-board Save (WBDSAVE) is not offered on a row's board", !/wbdSave\(\)/.test(one.bar()));
}

console.log("── refused, plainly ──");
{
  const w = world({ kc: "k1", uploadFails: true }); w.call(ROWOPEN("k1")); w.stroke([[100, 100], [200, 200]]);
  ok("the upload fails: tried once, nothing written", await w.call("wbdKidSave('k1')") === false && w.puts.length === 1 && w.writes.length === 0);
  ok("…said plainly, drawing kept, Save still offered", /Didn’t save: the upload didn’t go through \(no internet\?\)\. Nothing was saved — try again\./.test(w.bar()) && /💾 Save/.test(w.bar()) && w.ctx.wbView.strokes.length === 1 && w.ctx.wbView.saving === false);
}
{
  const w = world({ kc: "k1", stubPic: "fail" }); w.call(ROWOPEN("k1")); w.stroke([[100, 100], [200, 200]]);
  ok("picStore hands the data URL back (offline / timeout / rules): refused, nothing written", await w.call("wbdKidSave('k1')") === false && w.picCalls.length === 1 && w.writes.length === 0);
  ok("…what went to picStore was the canvas JPEG, in that kid's activity folder", /^data:image\/jpeg/.test(w.picCalls[0][0]) && J(w.picCalls[0][1]) === J(["units", "harv", "work", "k1", "my_hol", "board"]));
}
{
  const w = world({ kc: "k1", stubPic: true, dry: true }); w.call(ROWOPEN("k1")); w.stroke([[100, 100], [200, 200]]);
  ok("dry run: nothing uploaded, nothing written, and it says so", await w.call("wbdKidSave('k1')") === false && w.picCalls.length === 0 && w.writes.length === 0 && /Dry run — nothing uploaded, nothing written\./.test(w.bar()));
}
{
  const w = world({ kc: "k1", stubPic: true }); w.call(ROWOPEN("k1"));
  ok("nothing drawn: refused", await w.call("wbdKidSave('k1')") === false && w.picCalls.length === 0 && /Nothing on the board yet\./.test(w.bar()));
}
{
  const w = world({ kc: "k1", stubPic: true, noJpeg: true }); w.call(ROWOPEN("k1")); w.stroke([[100, 100], [200, 200]]);
  ok("a device that can't make a JPEG: refused, nothing uploaded", await w.call("wbdKidSave('k1')") === false && w.picCalls.length === 0 && /couldn’t make the picture/.test(w.bar()));
}
{
  const w = world({ kc: "k1", stubPic: true, noDb: true }); w.call(ROWOPEN("k1")); w.stroke([[100, 100], [200, 200]]);
  ok("no database: refused before any upload", await w.call("wbdKidSave('k1')") === false && w.picCalls.length === 0 && /Not connected/.test(w.bar()));
}
{
  const w = world({ kc: "k1", setFails: true }); w.call(ROWOPEN("k1")); w.stroke([[100, 100], [200, 200]]);
  await w.call("wbdKidSave('k1')"); await flush();
  ok("the database says no: said plainly, ✓ taken back, Save offered again", /Didn’t save — the database said no\. Try again\./.test(w.bar()) && /💾 Save/.test(w.bar()) && !/✓ Saved/.test(w.bar()));
}
{
  const w = world({ kc: "k1", stubPic: true }); w.call(ROWOPEN("k1")); w.stroke([[100, 100], [200, 200]]);
  w.ctx.unitStudies.harv.activities = [w.ctx.unitStudies.harv.activities[1]];
  ok("the activity was taken off the unit meanwhile: refused", await w.call("wbdKidSave('k1')") === false && w.picCalls.length === 0);
}

console.log("── Mom sees it ──");
{
  const w = world({ mom: true }); w.card();
  const paths = w.ons.map(x => x.p).sort();
  ok("Mom's card listens to each enrolled kid's board leaf for each row — one listener each", J(paths) === J(["unitWork/k1/harv/my_hol/board", "unitWork/k1/harv/my_hol_2/board", "unitWork/k2/harv/my_hol/board", "unitWork/k2/harv/my_hol_2/board"]) && w.ons.every(x => x.t === "value"), paths);
  w.card(); w.card(); ok("…drawing the card again adds none", w.ons.length === 4);
  w.ons.forEach(x => x.cb({ val: () => null })); ok("nothing saved: no repaint, no link", w.ctx.repaints === 0 && !/data-wbd-board/.test(w.card()));
  const k1 = w.ons.find(x => x.p === "unitWork/k1/harv/my_hol/board");
  k1.cb({ val: () => ({ url: URL_OK, ts: 1 }) });
  const h = w.card();
  ok("a board arrives: one repaint, and \"🖼 Board · Ada\" on that activity's row only, opening the picture", w.ctx.repaints === 1 && (h.match(/data-wbd-board=/g) || []).length === 1 && /<a data-wbd-board="k1" href="https:\/\/firebasestorage[^"]*" target="_blank" rel="noopener"[^>]*>🖼 Board · Ada<\/a>/.test(h) && h.indexOf("data-wbd-board") > h.indexOf('data-wbd-row="my_hol"') && h.indexOf("data-wbd-board") < h.indexOf('data-wbd-row="my_hol_2"'));
  ok("…the link sits in the row's bar, by the ✍️ Whiteboard and above the ✓ chips", /✍️ Whiteboard<\/button><a data-wbd-board="k1"/.test(h) && h.indexOf("data-wbd-board") < h.indexOf("data-dc-actkid"));
  k1.cb({ val: () => ({ url: "data:image/jpeg;base64,xx", ts: 2 }) });
  ok("a leaf that isn't an https link shows nothing", !/data-wbd-board/.test(w.card()));
}
{
  const w = world({ mom: true }); w.card(); w.call(ROWOPEN("")); w.stroke([[100, 100], [200, 200]]);
  await w.call("wbdKidSave('k1')"); await flush();
  ok("Mom saves one herself: the link is on her card at once (no extra read)", /data-wbd-board="k1"/.test(w.card()) && !w.writes.some(x => x[0] === "read"));
}
{
  const w = world({ kc: "k1" }); w.call(ROWOPEN("k1")); w.stroke([[100, 100], [200, 200]]); await w.call("wbdKidSave('k1')"); await flush();
  ok("the kid's own card after saving: no 🖼 link (Mom's), nothing listened to", !/data-wbd-board/.test(w.card()) && w.ons.length === 0);
}
console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
})();
