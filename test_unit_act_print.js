// 🖨 UACTPRINT — a Printable activity (slice 4 of PLAN_unit_activity_types_2026-11-19 §2(c), §3.1; a beta mom 2026-11-20: "The week
//   before on my weekend list", one sheet for the family at family time (§7.1); her go 2026-11-22 "go with her answers and build").
//   Runs the REAL index.html blocks against a fake db that records paths and a fake Storage that records puts. No real names.
//   · the box: "📄 Add a PDF" + "One for the family" only while 🖨 is picked; its own id (uak-<kk>-box-print); every id unique
//   · the upload: PDF only, 20 MB cap, Storage pictures/units/<unitId>/activities/<key>/<name>_<stamp>.pdf, the https link only —
//     a failed upload / a data URI / no Storage is refused and said plainly; dry run and not-Mom upload and write nothing;
//     a file picked before + Add uploads right after + Add under the new key
//   · the writes: …/pdf {url,title} (+ …/type "print" when it was not one), …/oneCopy only when the tick changed
//   · Today's card: "🖨 Finish the paper Mom printed: <title>" on every device, text only; no 🖨 → byte-identical to the tree minus the block
//   · the 🧺 Sunday list + Mom's Day due soon: "🖨 Print ×N: <title>" the week before, ✓ Got it on <week>/supplies/<id>;
//     ×1 family time / "One for the family", × the kids for a kids' day, one row only; never to 🛒, never on a kid's 🎒 line;
//     no 🖨 → lrBuildList JSON-identical to the tree minus the block
//   run: node test_unit_act_print.js
process.env.TZ = "America/New_York";
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x).slice(0, 700) : "")); } };
const J = x => JSON.stringify(x);
const cut = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error("markers " + a); return src.slice(i, j); };
const fn = name => { const i = src.indexOf("function " + name + "("); if (i < 0) throw new Error("no " + name); let d = 0, j = i, seen = false; for (; j < src.length; j++) { const c = src[j]; if (c === "{") { d++; seen = true; } else if (c === "}") { d--; if (seen && d === 0) break; } } return src.slice(i, j + 1); };
const tick = () => new Promise(r => setImmediate(r));
const BLK = cut("// UACTPRINT_START", "// UACTPRINT_END") + "// UACTPRINT_END\n";
const UT = cut("// UNITTRACK_START", "// UNITTRACK_END"), AA = cut("// UTADDACT_START", "// UTADDACT_END"), DC = cut("// DAYCARD_START", "// DAYCARD_END");
const KIND = cut("// UACTKIND_START", "// UACTKIND_END"), LINK = cut("// UACTLINK_START", "// UACTLINK_END");
const SIGN = ["_unitActs", "_nbActKeys", "_nbActWrite", "_nbActRemove", "unitActPoints", "unitActivityClaim", "unitActivityDone"].map(fn).join("\n");
const PIC = fn("_picSlug") + "\n" + fn("picStorePath");

console.log("── wiring ──");
ok("UACTPRINT is one marked block right after UACTLINK", src.indexOf("// UACTLINK_END\n// UACTPRINT_START") > 0 && src.split("// UACTPRINT_START").length === 2 && src.split("// UACTPRINT_END").length === 2);
const code = BLK.split("\n").filter(l => !/^\s*\/\//.test(l)).join("\n");
ok("the block's only database call is one update, behind utaaLive() (db && !_dryRun)", (code.match(/db\./g) || []).length === 1 && /if\(utaaLive\(\)\) db\.ref\(\)\.update\(upd\);/.test(code) && !/\.set\(|\.remove\(|\.transaction\(|\.once\(|\.on\(/.test(code));
ok("never a data URI kept: the link must be https before anything is written", /if\(!\/\^https:\\\/\\\/\/i\.test\(String\(url\|\|""\)\)\) throw/.test(code) && !/toDataURL|readAsDataURL|data:application/.test(code));
const NAMES = /\b(adrienne|andrew|julian|lincoln|ellis|lucy|sara|sarah|caleb|taylor|makenzie|kenzie|dewalt|burris|melanie|howe)\b/i;
ok("no kid or family name in the block, no 🔀", !NAMES.test(BLK) && BLK.indexOf("\u{1F500}") < 0, (BLK.match(NAMES) || [])[0]);
const testTxt = fs.readFileSync(__filename, "utf8").split("\n").filter(l => !/^const NAMES =/.test(l)).join("\n");
ok("this test file names no real kid or family", !NAMES.test(testTxt), (testTxt.match(NAMES) || [])[0]);
const hooks = [
  [LINK, `return h+'</div>'+((typeof uapKindHTML==="function")?uapKindHTML(kk,t,a):"");`],
  [LINK, `if(typeof uapKindShow==="function") uapKindShow(kk,t); }`],
  [LINK, `if(t!=="link") return (typeof uapKindAdd==="function")?uapKindAdd(kk,t,act):true;`],
  [LINK, `if(t!=="link") return (typeof uapKindEdit==="function")?uapKindEdit(kk,t,a,upd,base):true;`],
  [LINK, `if(!act||uakType(act)!=="link") return (act&&typeof uapCardHTML==="function")?uapCardHTML(g,act):"";`],
  [src, `try{ if(typeof uapSundayAdd==="function") uapSundayAdd(kids,all,w0,w1,today,roster,_laySig); }catch(e){}`],
  [src, `it.kind==="orders"?"🛒 Order":it.print?"":"🎒 Get";`],
  [src, `if(!blMom()||!it||!it.id||it.print) return "";`],
  [src, `if(it.print||blFind(it.id)||blCleared(it.id)) return;`],
  [src, `day,a.oneCopy===true?1:n); }`]];
ok("each hook is in the source exactly once, typeof-guarded where it calls the block", hooks.every(h => h[0].split(h[1]).length === 2), hooks.filter(h => h[0].split(h[1]).length !== 2).map(h => h[1]));
ok("the Sunday-list hook sits right after the 🏡 Family group in lrBuildList", /kids\.push\(_fr\); \} \}catch\(e\)\{\}[^\n]*\n  try\{ if\(typeof uapSundayAdd==="function"\)/.test(fn("lrBuildList")));

// ── world 1: the day editor + Today's card ──
const UNIT = () => ({ id: "harv", title: "Harvest", emoji: "🌾", enrolled: { k1: true, k2: true }, decks: [],
  activities: [
    { key: "corn_maze", title: "Draw a corn maze", emoji: "🎨", kind: "sheet", points: 5, day: 2 },
    { key: "seed_sheet", title: "Seed sorting sheet", emoji: "🎨", kind: "sheet", points: 3, day: 2, type: "print", pdf: { url: "https://files.example.org/seeds.pdf", title: "seeds" } },
    { key: "leaf_map", title: "Leaf map", emoji: "🎨", kind: "sheet", points: 2, day: 3, type: "print", oneCopy: true }],
  track: { mode: "seq", perWeek: 4, days: [{ id: "d1", n: 1, t: "Fields" }, { id: "d2", n: 2, t: "Mazes", nb: { activity: "corn_maze" } }, { id: "d3", n: 3, t: "Leaves", nb: { activity: "leaf_map" } }] } });
function world(o) {
  o = o || {}; const writes = [], toasts = [], puts = []; const dom = o.dom || {};
  const fb = { fail: o.putFail || "", url: o.url };
  const ctx = { console, JSON, Object, Array, String, Number, Math, Set, Map, RegExp, Date, Promise, Error, parseInt, isNaN, isFinite, WeakMap, URL,
    unitStudies: { harv: o.unit || UNIT() }, ROSTER: ["k1", "k2"], KID_NAME: { k1: "Ada", k2: "Ben" }, kcKid: o.kcKid || "",
    momHere: () => ctx.MOM, MOM: o.mom !== false, _dryRun: () => !!o.dry, gwShowToast: m => toasts.push(m), bankDirect: () => {}, confirm: () => true,
    db: { ref: p => ({ set: v => writes.push(["set", p === undefined ? "" : p, JSON.parse(J(v === undefined ? null : v))]), update: v => writes.push(["update", p === undefined ? "" : p, JSON.parse(J(v))]), remove: () => writes.push(["remove", p]), transaction: () => {}, child: () => null }) },
    renderAll: () => { ctx.repaints = (ctx.repaints || 0) + 1; }, repaints: 0, document: { getElementById: id => (id in dom) ? dom[id] : null } };
  if (!o.noStorage) ctx.firebase = { storage: () => ({ ref: p => ({ put: async (f, m) => { if (fb.fail) throw new Error(fb.fail); puts.push({ path: p, type: m && m.contentType, cache: m && m.cacheControl, name: f && f.name }); },
    getDownloadURL: async () => fb.url !== undefined ? fb.url : "https://firebasestorage.example/v0/b/x/o/" + encodeURIComponent(p) + "?alt=media&token=t" }) }) };
  vm.createContext(ctx);
  const LR = "const LR_PARTS=[\"links\",\"supplies\",\"books\",\"orders\",\"notes\"];\n" + ["lrSafeUrl", "lrList", "lrStr", "lrDate", "lrClean", "lrHost"].map(fn).join("\n");
  vm.runInContext(LR + "\n" + UT + "\n" + AA + "\n" + KIND + "\n" + LINK + "\n" + (o.before ? "" : BLK) + "\n" + DC + "\n" + SIGN + "\n" + PIC + "\n" + fn("ubSlug") +
    "\nObject.defineProperty(this,'uakPicked',{get:()=>uakPicked});" + (o.before ? "" : "Object.defineProperty(this,'uapStatus',{get:()=>uapStatus});Object.defineProperty(this,'uapPend',{get:()=>uapPend});"), ctx);
  return { ctx, writes, toasts, dom, puts, fb };
}
const G = (c, id) => ({ day: c.utRef("harv", c.utDay(c.unitStudies.harv, id)), u: c.unitStudies.harv, first: null, present: [] });
const PDF = (name, size, type) => ({ name: name || "Seed Sort_v2.pdf", size: size == null ? 300000 : size, type: type === undefined ? "application/pdf" : type });
const inp = f => ({ files: [f], value: "C:\\fake\\" + (f && f.name) });
const ids = h => [...h.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
const dup = L => L.filter((x, i) => L.indexOf(x) !== i);

(async () => {
console.log("\n── the box ──");
{
  const w = world({ dom: { "uak-harv-d1-box-print": { style: {} }, "uak-harv-d1-box-link": { style: {} } } }); const c = w.ctx, u = c.unitStudies.harv;
  const h = c.utaaEditorHTML(u, c.utDay(u, "d1"));
  ok("+ Add box: the 🖨 box is there, hidden while 📓 is picked, with 📄 Add a PDF, the tick off, the line", /id="uak-harv-d1-box-print" data-uak-kind="print" style="display:none/.test(h) && /📄 Add a PDF<input type="file" accept="application\/pdf,.pdf" onchange="uapFile\('harv-d1',this\)"/.test(h) && /id="utaa-harv-d1-onecopy" type="checkbox">/.test(h) && /One for the family/.test(h) && /up to 20 MB/.test(h));
  c.uakPick("harv-d1", "print");
  ok("tapping 🖨 shows it in place (no full render); the 🔗 box stays hidden", w.dom["uak-harv-d1-box-print"].style.display === "block" && w.dom["uak-harv-d1-box-link"].style.display === "none" && c.repaints === 0);
  c.uakPick("harv-d1", "link"); ok("tapping 🔗 hides it and shows the address", w.dom["uak-harv-d1-box-print"].style.display === "none" && w.dom["uak-harv-d1-box-link"].style.display === "block");
  const e = c.utaaEditorHTML(u, c.utDay(u, "d3"));
  ok("✎ on a 🖨 activity: 🖨 pressed, the box open, the tick checked, no PDF yet → 📄 Add a PDF", /id="uak-harv-d3-print" aria-pressed="true"/.test(e) && /data-uak-kind="print" style="display:block/.test(e) && /id="utaa-harv-d3-onecopy" type="checkbox" checked>/.test(e) && /📄 Add a PDF</.test(e) && !/data-uap-has/.test(e));
  const u2 = UNIT(); u2.activities[2].pdf = { url: "https://files.example.org/leaf.pdf", title: "leaf map" }; const w2 = world({ unit: u2 });
  const e2 = w2.ctx.utaaEditorHTML(u2, w2.ctx.utDay(u2, "d3"));
  ok("…with a PDF: its name + open → (new tab, noopener) and 📄 Replace the PDF", /data-uap-has="1"[^>]*>📄 leaf map <a href="https:\/\/files.example.org\/leaf.pdf" target="_blank" rel="noopener noreferrer"/.test(e2) && /📄 Replace the PDF</.test(e2));
  ok("the box fits a phone (wraps, no fixed width)", /<div id="uak-harv-d1-box-print"[^>]*>/.test(h) && !/id="uak-harv-d1-box-print"[^>]*width:\d+px/.test(h) && /flex-wrap:wrap/.test(c.uapKindHTML("harv-d1", "print", null)));
}
console.log("\n── element ids: unique in the whole editor box ──");
{
  const c = world().ctx, u = c.unitStudies.harv;
  const hNew = c.utaaEditorHTML(u, c.utDay(u, "d1")), hPrint = c.utaaEditorHTML(u, c.utDay(u, "d3")), hNb = c.utaaEditorHTML(u, c.utDay(u, "d2"));
  ok("+ Add box: every id unique (chips, 🔗 box, 🖨 box, inputs)", ids(hNew).length >= 12 && dup(ids(hNew)).length === 0, dup(ids(hNew)));
  ok("✎ on 🖨 and on 📓: every id unique", dup(ids(hPrint)).length === 0 && dup(ids(hNb)).length === 0 && ids(hPrint).length >= 14, [dup(ids(hPrint)), dup(ids(hNb))]);
  ok("the 🖨 box's id is not the 🖨 chip's id", ids(hNew).indexOf("uak-harv-d1-print") >= 0 && ids(hNew).indexOf("uak-harv-d1-box-print") >= 0 && hNew.split('id="uak-harv-d1-print"').length === 2);
  ok("the 🖨 box ids: uak-…-box-print, utaa-…-onecopy, uap-st-…", ["uak-harv-d1-box-print", "utaa-harv-d1-onecopy", "uap-st-harv-d1"].every(x => ids(hNew).indexOf(x) >= 0));
  // a browser-like document: getElementById = the FIRST element with that id
  const browser = h => { const els = []; for (const m of h.matchAll(/<(\w+)\b([^>]*)>/g)) { const id = (m[2].match(/\bid="([^"]+)"/) || [])[1]; if (!id) continue; const st = (m[2].match(/\bstyle="([^"]*)"/) || [])[1] || ""; const disp = (st.match(/display:(\w+)/) || [])[1] || ""; els.push({ id, tag: m[1], style: { display: disp }, attrs: {}, setAttribute(k, v) { this.attrs[k] = v; if (k === "style") { const d = (v.match(/display:(\w+)/) || [])[1]; if (d) this.style.display = d; } } }); } return { els, getElementById: id => els.find(e => e.id === id) || null }; };
  const w = world(); const cc = w.ctx, uu = cc.unitStudies.harv; const doc = browser(cc.utaaEditorHTML(uu, cc.utDay(uu, "d1"))); cc.document = doc;
  const chip = doc.getElementById("uak-harv-d1-print"), boxEl = doc.els.find(x => x.tag === "div" && x.id === "uak-harv-d1-box-print");
  cc.uakPick("harv-d1", "print");
  ok("browser-like: tapping 🖨 opens the 🖨 box and leaves the 🖨 chip showing, pressed", chip && boxEl && chip !== boxEl && boxEl.style.display === "block" && chip.style.display === "" && chip.attrs["aria-pressed"] === "true");
  cc.uakPick("harv-d1", "notebook");
  ok("…tapping 📓 closes it, the chip still showing", boxEl.style.display === "none" && chip.style.display === "");
}

console.log("\n── the upload: an activity already on the day (✎) ──");
const P2 = "unitStudies/harv/activities/0/", P3 = "unitStudies/harv/activities/2/";
{
  const w = world(); const c = w.ctx;
  const r = await c.uapFile("harv-d2", inp(PDF()));
  const p = w.puts[0] || {};
  ok("a PDF on Day 2 (its activity is 📓): ONE put, the activity's folder, stamped name, PDF type, cached a year", r === true && w.puts.length === 1 && /^pictures\/units\/harv\/activities\/corn_maze\/Seed_Sort_v2_[a-z0-9]+\.pdf$/.test(p.path) && p.type === "application/pdf" && p.cache === "public,max-age=31536000", w.puts);
  const url = "https://firebasestorage.example/v0/b/x/o/" + encodeURIComponent(p.path) + "?alt=media&token=t";
  ok("…ONE update: …/pdf = {url, title} and …/type = print (it was 📓) — nothing else", J(w.writes) === J([["update", "", { [P2 + "pdf"]: { url, title: "Seed Sort v2" }, [P2 + "type"]: "print" }]]), w.writes);
  ok("…the screen copy has it, the line says so, the editor repaints", c.unitStudies.harv.activities[0].pdf.url === url && c.unitStudies.harv.activities[0].type === "print" && /✓ Saved the PDF: Seed Sort v2/.test(c.uapStatus["harv-d2"]) && c.repaints === 1);
}
{
  const w = world(); await w.ctx.uapFile("harv-d3", inp(PDF("leaf map.pdf")));
  ok("an activity that is already 🖨: only …/pdf", w.writes.length === 1 && J(Object.keys(w.writes[0][2])) === J([P3 + "pdf"]) && w.writes[0][2][P3 + "pdf"].title === "leaf map", w.writes);
  w.writes.length = 0; const before = w.puts[0].path; await w.ctx.uapFile("harv-d3", inp(PDF("leaf map.pdf")));
  ok("replacing it: a new put (the old file stays), …/pdf replaced whole", w.puts.length === 2 && w.writes.length === 1 && J(Object.keys(w.writes[0][2])) === J([P3 + "pdf"]) && w.writes[0][2][P3 + "pdf"].url.indexOf("leaf_map") > 0, [before, w.puts[1].path]);
  const i = inp(PDF()); await w.ctx.uapFile("harv-d3", i); ok("the file box is cleared after a pick (the same file can be picked again)", i.value === "");
}
{
  const at = n => { const w = world(); return w.ctx.uapFile("harv-d3", inp(PDF("big.pdf", n))).then(r => ({ r, w })); };
  const big = await at(20 * 1024 * 1024 + 1), edge = await at(20 * 1024 * 1024);
  ok("over 20 MB: refused before any upload — nothing put, nothing written, the line says the cap", big.r === false && big.w.puts.length === 0 && big.w.writes.length === 0 && big.w.ctx.uapStatus["harv-d3"] === "That PDF is too large (max 20 MB).");
  ok("exactly 20 MB: uploads", edge.r === true && edge.w.puts.length === 1);
  const w = world(); const r = await w.ctx.uapFile("harv-d3", inp({ name: "photo.png", size: 1000, type: "image/png" }));
  ok("a picture: \"Please pick a PDF.\", nothing put", r === false && w.puts.length === 0 && w.writes.length === 0 && w.ctx.uapStatus["harv-d3"] === "Please pick a PDF.");
  const w2 = world(); await w2.ctx.uapFile("harv-d3", inp(PDF("sheet.PDF", 100, "")));
  ok("a .pdf name with no type (some tablets): accepted", w2.puts.length === 1);
}
{
  const w = world({ putFail: "network down" }); const r = await w.ctx.uapFile("harv-d3", inp(PDF()));
  ok("the upload fails: refused, said plainly, nothing written", r === false && w.writes.length === 0 && w.ctx.uapStatus["harv-d3"] === "Didn’t save: network down" && !w.ctx.unitStudies.harv.activities[2].pdf);
  const d = world({ url: "data:application/pdf;base64,AAAA" }); const rd = await d.ctx.uapFile("harv-d3", inp(PDF()));
  ok("Storage hands back a data URI: refused — never a data URI in the database", rd === false && d.writes.length === 0 && /^Didn’t save: no link came back/.test(d.ctx.uapStatus["harv-d3"]) && !d.ctx.unitStudies.harv.activities[2].pdf);
  const n = world({ noStorage: true }); const rn = await n.ctx.uapFile("harv-d3", inp(PDF()));
  ok("no Storage on the device: refused, said plainly, nothing written", rn === false && n.writes.length === 0 && /Storage isn’t ready/.test(n.ctx.uapStatus["harv-d3"]));
  const dr = world({ dry: true }); const rdr = await dr.ctx.uapFile("harv-d3", inp(PDF()));
  ok("dry run: nothing uploaded, nothing written, the line says so", rdr === false && dr.puts.length === 0 && dr.writes.length === 0 && /^Dry run/.test(dr.ctx.uapStatus["harv-d3"]));
  const k = world({ mom: false }); const rk = await k.ctx.uapFile("harv-d3", inp(PDF()));
  ok("not Mom: nothing uploaded, nothing written", rk === false && k.puts.length === 0 && k.writes.length === 0);
}

console.log("\n── the upload: a file picked before + Add ──");
const A3 = "unitStudies/harv/activities/3";
{
  const dom = { "utaa-harv-d1-line": { value: "Pumpkin sheet | 4" }, "utaa-harv-d1-onecopy": { checked: true } };
  const w = world({ dom }); const c = w.ctx;
  c.uakPick("harv-d1", "print"); const r = await c.uapFile("harv-d1", inp(PDF("pumpkin.pdf")));
  ok("picked on a day with no activity: held on this device, nothing put yet, the line says when", r === true && w.puts.length === 0 && w.writes.length === 0 && c.uapStatus["harv-d1"] === "📄 pumpkin — it uploads when you tap + Add.");
  ok("+ Add: ONE update — the record with type print and oneCopy (ticked), the day's nb", c.utaaAdd("harv", "d1") === true && w.writes.length === 1 &&
    J(w.writes[0][2][A3]) === J({ key: "pumpkin_sheet", title: "Pumpkin sheet", emoji: "🎨", kind: "sheet", points: 4, day: 1, oneCopy: true, type: "print" }), w.writes);
  await tick(); await tick();
  ok("…then the PDF uploads under the NEW key and only …/activities/3/pdf is written", w.puts.length === 1 && /^pictures\/units\/harv\/activities\/pumpkin_sheet\/pumpkin_[a-z0-9]+\.pdf$/.test(w.puts[0].path) && w.writes.length === 2 && J(Object.keys(w.writes[1][2])) === J([A3 + "/pdf"]) && w.writes[1][2][A3 + "/pdf"].title === "pumpkin", w.writes);
  ok("…nothing left waiting", Object.keys(c.uapPend).length === 0);
}
{
  const dom = { "utaa-harv-d1-line": { value: "Pumpkin sheet | 4" }, "utaa-harv-d1-onecopy": { checked: false } };
  const w = world({ dom }); const c = w.ctx; c.uakPick("harv-d1", "print"); await c.uapFile("harv-d1", inp(PDF("pumpkin.pdf")));
  c.uakPick("harv-d1", "screen"); c.utaaAdd("harv", "d1"); await tick(); await tick();
  ok("Mom switched to another kind before + Add: the held file is dropped, nothing uploads, no oneCopy", w.puts.length === 0 && w.writes.length === 1 && !("oneCopy" in w.writes[0][2][A3]) && w.writes[0][2][A3].type === "screen" && Object.keys(c.uapPend).length === 0);
  const w2 = world({ dom: { "utaa-harv-d1-line": { value: "Plain sheet | 2" }, "utaa-harv-d1-onecopy": { checked: false } } }); w2.ctx.uakPick("harv-d1", "print"); w2.ctx.utaaAdd("harv", "d1"); await tick();
  ok("+ Add 🖨 with no file: the record (type print, no oneCopy), no put", w2.puts.length === 0 && w2.writes.length === 1 && w2.writes[0][2][A3].type === "print" && !("oneCopy" in w2.writes[0][2][A3]) && !("pdf" in w2.writes[0][2][A3]));
}

console.log("\n── ✎ Save: the tick ──");
{
  const dom = { "utaa-harv-d3-title": { value: "Leaf map" }, "utaa-harv-d3-points": { value: "2" }, "utaa-harv-d3-desc": { value: "" }, "utaa-harv-d3-onecopy": { checked: true } };
  const w = world({ dom }); const c = w.ctx, a = () => c.unitStudies.harv.activities[2];
  c.utaaEdit("harv", "d3"); ok("nothing changed → no write", w.writes.length === 0);
  dom["utaa-harv-d3-onecopy"].checked = false; c.utaaEdit("harv", "d3");
  ok("untick → ONE update of only …/oneCopy = null (the field goes)", J(w.writes) === J([["update", "", { [P3 + "oneCopy"]: null }]]) && !("oneCopy" in a()), w.writes);
  w.writes.length = 0; dom["utaa-harv-d3-onecopy"].checked = true; c.utaaEdit("harv", "d3");
  ok("tick → only …/oneCopy = true", J(w.writes) === J([["update", "", { [P3 + "oneCopy"]: true }]]) && a().oneCopy === true);
  w.writes.length = 0; c.uakPick("harv-d3", "notebook"); dom["utaa-harv-d3-onecopy"].checked = false; c.utaaEdit("harv", "d3");
  ok("switching 🖨 to 📓: only …/type (the tick is not 📓's — left as it is)", J(w.writes) === J([["update", "", { [P3 + "type"]: null }]]) && a().oneCopy === true, w.writes);
}

console.log("\n── Today's card ──");
const row = (h, t) => { const i = h.indexOf(t); return i < 0 ? "" : h.slice(i, (h.indexOf("data-dc-actchk", i) + 1 || h.length + 1) - 1); };
{
  for (const [who, o] of [["Mom", {}], ["a kid's device", { mom: false, kcKid: "k1" }], ["the board", { mom: false }]]) {
    const w = world(o); const h = w.ctx.dcDayHTML(G(w.ctx, "d2"));
    ok(who + ": the 🖨 row says \"🖨 Finish the paper Mom printed: Seed sorting sheet\", text only, no PDF link anywhere", /data-uap-paper="1"[^>]*>🖨 Finish the paper Mom printed: Seed sorting sheet</.test(row(h, "Seed sorting sheet")) && h.indexOf("seeds.pdf") < 0 && !/data-uak-link/.test(h), row(h, "Seed sorting sheet"));
    ok(who + ": the 📓 row beside it has no paper line", !/data-uap-paper/.test(row(h, "Draw a corn maze")));
  }
  const w = world(); const h3 = w.ctx.dcDayHTML(G(w.ctx, "d3"));
  ok("a 🖨 with no PDF yet still says it (Mom may print from her own copy)", /Finish the paper Mom printed: Leaf map</.test(h3));
  const u = UNIT(); u.activities[1].title = "<b>Seeds & more</b>"; const we = world({ unit: u });
  ok("the title is escaped", /Finish the paper Mom printed: &lt;b&gt;Seeds &amp; more&lt;\/b&gt;</.test(we.ctx.dcDayHTML(G(we.ctx, "d2"))));
  const u2 = UNIT(); u2.activities[0].pdf = { url: "https://files.example.org/x.pdf", title: "x" }; const w2 = world({ unit: u2 });
  ok("a PDF on a 📓 activity draws nothing (only 🖨 says it)", !/data-uap-paper/.test(row(w2.ctx.dcDayHTML(G(w2.ctx, "d2")), "Draw a corn maze")));
  const w3 = world(); w3.ctx.dcDayHTML(G(w3.ctx, "d2")); ok("drawing the card writes and uploads nothing", w3.writes.length === 0 && w3.puts.length === 0);
}
{
  const u = UNIT(); u.activities = u.activities.filter(a => !a.type); u.activities.push({ key: "farm", title: "Farm tour", kind: "sheet", points: 3, day: 2, type: "link", url: "https://example.org/farm" });
  for (const [who, o] of [["Mom", {}], ["a kid's device", { mom: false, kcKid: "k1" }], ["the board", { mom: false }]]) {
    const A = world(Object.assign({ unit: JSON.parse(J(u)) }, o)), B = world(Object.assign({ unit: JSON.parse(J(u)), before: true }, o));
    ok("no 🖨 on the day (a 📓 and a 🔗): the card byte-identical to the tree minus UACTPRINT — " + who, A.ctx.dcDayHTML(G(A.ctx, "d2")) === B.ctx.dcDayHTML(G(B.ctx, "d2")));
  }
}

// ── world 2: the Sunday list on a made-up family (test_unit_prep's shape) ──
const KIDS = ["kida", "kidb"];
const LINES = ["Bugs up close", "Insect bodies", "Caterpillars", "Ant snack day", "Bug games", "Bug parade"];
const SCHOOL = (() => { const out = []; const d = new Date(2026, 10, 2); while (d <= new Date(2027, 0, 29)) { const s = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); if (d.getDay() >= 1 && d.getDay() <= 5) out.push(s); d.setDate(d.getDate() + 1); } return out; })();
const DN = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const WEEKDAYS = ["monday", "tuesday", "wednesday", "thursday", "friday"];
const BUGS = o => ({ id: "bugs", title: "Backyard Bugs", emoji: "🐞", enrolled: { kida: true, kidb: true }, decks: [],
  activities: [{ key: "draw", title: "Draw a bug", points: 5 }].concat(o.noPrint ? [] : [{ key: "hunt", title: "Bug hunt sheet", day: 6, type: "print", pdf: { url: "https://files.example.org/hunt.pdf", title: "hunt" } }]),
  track: { mode: "seq", perWeek: 5, days: LINES.map((t, i) => Object.assign({ id: "d" + (i + 1), n: i + 1, t }, i === 2 ? { craft: { title: "Egg-carton caterpillar", supplies: [{ name: "egg carton" }] } } : {})) } });
const ROCKS = o => ({ id: "rocks", title: "Rock Hunt", emoji: "🪨", enrolled: { kidb: true }, decks: [],
  activities: [{ key: "chart", title: "Rock chart", day: 2 }].concat(o.noPrint ? [] : [{ key: "layers", title: "Rock layers page", day: 2, type: "print", pdf: { url: "https://files.example.org/layers.pdf", title: "layers" }, oneCopy: !!o.oneCopy }]),
  track: { mode: "seq", days: Array.from({ length: 7 }, (_, i) => ({ id: "r" + (i + 1), n: i + 1, t: "Rock day " + (i + 1), res: { supplies: [{ name: "rock " + (i + 1) }] } })) } });
const BLOCK = () => ({ name: "Together", kids: KIDS.slice(), days: ["Mon", "Tue", "Wed", "Thu", "Fri"], at: "1:00 PM",
  items: [{ key: "un", name: "Backyard Bugs", minutes: 30, track: { mode: "seq", startDate: "2026-11-16", list: LINES.map((t, i) => ({ t: "Day " + (i + 1) + " — " + t, n: 1, u: { id: "bugs", d: "d" + (i + 1) } })) } }] });
const GEO = { "2026-11-16": "Rock 1", "2026-11-18": "Rock 2", "2026-11-20": "Rock 3", "2026-11-23": "Rock 4", "2026-11-24": "Rock 5", "2026-11-26": "Rock 6" };
const GEOSUB = () => ({ display: "Rocks", unit: { id: "rocks" }, lessonSeq: ["Rock 1", "Rock 2", "Rock 3", "Rock 4", "Rock 5", "Rock 6", "Rock 7"], lessonIds: ["k1", "k2", "k3", "k4", "k5", "k6", "k7"] });
function home(o) {
  o = o || {};
  const RealDate = Date; const NOW = new RealDate(o.now || "2026-11-16T07:00:00");
  class FakeDate extends RealDate { constructor(...a) { if (a.length) super(...a); else super(NOW.getTime()); } static now() { return NOW.getTime(); } }
  const iso = d => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  const today = iso(NOW), todayDay = DN[NOW.getDay()];
  const mon = (() => { const d = new RealDate(NOW.getTime()); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d; })();
  const BOARD = {}; WEEKDAYS.forEach((dn, i) => { const d = new RealDate(mon.getTime()); d.setDate(d.getDate() + i); BOARD[dn] = iso(d); });
  const lessons = { kida: {}, kidb: {} };
  SCHOOL.forEach((d, i) => { lessons.kida[i] = { date: d, week: "Wk" }; lessons.kidb[i] = { date: d, week: "Wk" }; if (GEO[d]) { lessons.kidb[i].geo = GEO[d]; if (o.bothGeo) lessons.kida[i].geo = GEO[d]; } });
  const subjects = { kidb: { geo: GEOSUB() } }; if (o.bothGeo) subjects.kida = { geo: GEOSUB() };
  const units = { bugs: BUGS(o), rocks: ROCKS(o) };
  const writes = [], sent = [];
  const ctx = { console, JSON, Object, Array, String, Number, Math, Set, Map, RegExp, WeakMap, Date: FakeDate, parseInt, parseFloat, isNaN, isFinite, setTimeout: () => 0, clearTimeout: () => {},
    ROSTER: KIDS.slice(), KID_COLOR: {}, unitStudies: units, notebookSettings: {},
    rulesData: { schoolDay: { defaultStart: "9:00 AM", defaultEnd: "4:00 PM", lunchStart: "12:00 PM", lunchEnd: "1:00 PM" }, familyBlocks: o.noFam ? {} : { ft: BLOCK() }, buy: { auto: true } },
    currData: { subjects, lessons, resources: {} }, supplies: {}, grData: { items: {}, cleared: {} },
    masteryData: {}, weekData: { tasks: [] }, checked: {}, claimed: {}, histState: {}, archive: {}, blockouts: {},
    WK: "week12", _todayDay: todayDay, lastTasksWrite: 0, rulesOpen: {}, gvShowPast: false, tab: "home",
    momHere: () => true, _dryRun: () => false, renderAll: () => {}, renderAllSoon: () => {}, dbg: () => {}, gwShowToast: () => {}, sv: () => {}, ld: () => null,
    db: { ref: p => ({ set: v => writes.push(["set", p, v]), update: v => writes.push(["update", p, v]), remove: () => writes.push(["remove", p]), transaction: () => writes.push(["tx", p]), once: () => writes.push(["read", p]), on: () => writes.push(["on", p]) }) },
    fbArr: v => v, cap: s => s ? s[0].toUpperCase() + s.slice(1) : s,
    toMin: t => { const m = String(t || "").trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i); if (!m) return NaN; let h = +m[1]; const ap = (m[3] || "").toUpperCase(); if (ap === "PM" && h !== 12) h += 12; if (ap === "AM" && h === 12) h = 0; return h * 60 + (+m[2]); },
    gwParseDate: s => { const p = s.split("-"); return new FakeDate(+p[0], +p[1] - 1, +p[2]); },
    cbTodayISO: () => today, routineDateISO: dn => dn === todayDay ? today : (BOARD[dn] || null),
    llLessonKey: t => (t && t.lid) ? String(t.lid) : "", taskLessonRef: t => "",
    smapIsKidOff: () => false, coopTimedEndMin: () => 0, FX_DOW: { monday: "Mon", tuesday: "Tue", wednesday: "Wed", thursday: "Thu", friday: "Fri", saturday: "Sat", sunday: "Sun" },
    confirm: () => true, alert: () => {}, document: { getElementById: () => null, createElement: () => ({ style: {} }), body: { appendChild: () => {} } }, window: {} };
  ctx.fromMin = v => { let h = Math.floor(v / 60), m = v % 60; const ap = h >= 12 ? "PM" : "AM"; let hh = h % 12; if (hh === 0) hh = 12; return hh + ":" + String(m).padStart(2, "0") + " " + ap; };
  ctx.relayWeek = () => {};
  vm.createContext(ctx);
  vm.runInContext([cut("// FAMBLOCK_START", "// FAMBLOCK_END"), cut("// FAMTOGETHER_START", "// FAMTOGETHER_END"), cut("// FAMBLOCKOUT_START", "// FAMBLOCKOUT_END"),
    cut("// FAMLESSONS_START", "// FAMLESSONS_END"), cut("// FAMDAYSTART_START", "// FAMDAYSTART_END"), cut("// UNITFT_START", "// UNITFT_END"),
    cut("// LESSONRES_START", "// LESSONRES_END"), cut("// FAMRES_START", "// FAMRES_END"), UT, cut("// PUTSCHED_START", "// PUTSCHED_END"), cut("// CRAFT_START", "// CRAFT_END"),
    cut("// UNITDAY_EXTRAS_START", "// UNITDAY_EXTRAS_END"), cut("// UNITDAY_GAME_START", "// UNITDAY_GAME_END"),
    fn("lidsFor"), fn("_unitActs"), cut("// UNITGATHER_START", "// UNITGATHER_END"), AA, KIND, LINK, o.before ? "" : BLK,
    ["blMom", "blFind", "blCleared", "blRule", "blItems", "blRowChipHTML", "blAutoSend"].map(fn).join("\n"), "const BL_CHIP='';",
    "function blSend(it){ __sent.push(it.id); return {id:'x'}; } function blRuleStore(){ return ''; } function blEsc(s){ return String(s); } function blListName(){ return 'Shopping List'; } function blPickOpen(){}",
    "Object.defineProperty(this,'famProgress',{get:()=>famProgress,set:v=>{famProgress=v;}});"].join("\n"), Object.assign(ctx, { __sent: sent }));
  ctx.famProgress = {};
  return { ctx, writes, sent };
}
const prints = L => L.items.filter(it => it.print);
const rowsOf = L => L.kids.map(K => K.kid + ":" + K.kinds.map(k => k.kind + "[" + k.items.map(it => it.name).join("|") + "]").join(","));

console.log("\n── the 🧺 Sunday list ──");
{
  const w = home(), L = w.ctx.lrBuildList();
  const P = prints(L);
  ok("two 🖨 rows: the family-time day (next Mon) and the kid's day (this Wed)", P.length === 2, P.map(x => x.name));
  const hunt = P.find(x => /Bug hunt/.test(x.name)), lay = P.find(x => /Rock layers/.test(x.name));
  ok("family time: \"🖨 Print ×1: Bug hunt sheet\" under 🏡 Family, next week, the PDF as its link", hunt && hunt.name === "🖨 Print ×1: Bug hunt sheet" && hunt.kid === "_family" && J(hunt.weeks) === J([1]) && hunt.url === "https://files.example.org/hunt.pdf" && hunt.kind === "supplies", hunt);
  ok("…due the Sunday before its week (Sun 11/22), \"by Sun\"; its lesson line is the family card's label + date", hunt && hunt.byISO === "2026-11-22" && hunt.by === "by Sun" && hunt.lessons.length === 1 && hunt.lessons[0].date === "2026-11-23" && /Bug parade/.test(hunt.lessons[0].text), hunt && hunt.lessons);
  ok("a kid's subject: \"🖨 Print ×1: Rock layers page\" under that kid, this week, due Sun 11/15 (\"was due\")", lay && lay.name === "🖨 Print ×1: Rock layers page" && lay.kid === "kidb" && lay.sk === "geo" && J(lay.weeks) === J([0]) && lay.byISO === "2026-11-15" && /^was due/.test(lay.by) && lay.lessons[0].date === "2026-11-18", lay);
  ok("ids are the Sunday list's own shape (lr_<kid>_<subject>_print_<unit key>)", hunt.id === "lr__family_" + hunt.sk + "_print_bugs_hunt" && lay.id === "lr_kidb_geo_print_rocks_layers", [hunt.id, lay.id]);
  ok("the rows sit in their groups' 🎒 Supplies, after what was there (the craft's egg carton stays first)", J(rowsOf(L)) === J(["kidb:supplies[🖨 Print ×1: Rock layers page]", "_family:supplies[egg carton|🖨 Print ×1: Bug hunt sheet]"]), rowsOf(L));
  ok("n counts them", L.n === L.items.length + L.staples.length && L.items.indexOf(hunt) >= 0 && L.items.indexOf(lay) >= 0);
  const kidLine = w.ctx.lrKidLineHTML(w.ctx.lrFor("kidb", "geo", "k2"));
  ok("never on a kid's 🎒 bring line (the card reads supplies, not the print rows)", kidLine.indexOf("Print") < 0 && kidLine.indexOf("rock 2") > 0, kidLine);
  ok("building the list wrote nothing", w.writes.length === 0);
}
{
  const w = home({ bothGeo: true }), P = prints(w.ctx.lrBuildList()), lay = P.find(x => /Rock layers/.test(x.name));
  ok("both kids have the subject: ONE row \"×2\", under the first kid in the roster — not one per kid", P.filter(x => /Rock layers/.test(x.name)).length === 1 && lay.name === "🖨 Print ×2: Rock layers page" && lay.kid === "kida", P.map(x => x.kid + " " + x.name));
  const w1 = home({ bothGeo: true, oneCopy: true }), l1 = prints(w1.ctx.lrBuildList()).find(x => /Rock layers/.test(x.name));
  ok("…\"One for the family\" ticked: ×1", l1 && l1.name === "🖨 Print ×1: Rock layers page");
  const g = w.ctx.unitGather(w.ctx.unitStudies.rocks, { n: 2 }), g1 = w1.ctx.unitGather(w1.ctx.unitStudies.rocks, { n: 2 });
  ok("the 🧾 Get ready sheet counts the tick the same way (×2 → ×1)", g.totals.prints.find(p => p.kind === "print").n === 2 && g1.totals.prints.find(p => p.kind === "print").n === 1);
}
{
  const fri = home({ now: "2026-11-20T07:00:00" }), due = fri.ctx.lrDueSoon();
  const hunt = due.find(x => /Bug hunt/.test(x.name));
  ok("Mom's Day \"due soon\" on the Friday before: the family-time row, by Sun, for next week", hunt && hunt.days === 2 && hunt.w === 1, due.map(x => x.name + " " + x.days));
  const html = fri.ctx.lrNowRowHTML(hunt);
  ok("…its row reads \"🖨 Print ×1: Bug hunt sheet by Sun\" (no \"🎒 Get\") with ✓ Got it", /<b>🖨 Print ×1: Bug hunt sheet<\/b>/.test(html) && html.indexOf("🎒 Get") < 0 && /✓ Got it/.test(html) && html.indexOf("lrTick('" + hunt.id + "',1)") > 0, html);
  fri.ctx.lrTick(hunt.id, 1);
  ok("✓ Got it lands where a supply's tick lands: week13/supplies/<id> = true", J(fri.writes) === J([["set", "week13/supplies/" + hunt.id, true]]), fri.writes);
  ok("…and it leaves due soon", !fri.ctx.lrDueSoon().some(x => x.id === hunt.id));
  const mon = home(), d0 = mon.ctx.lrDueSoon();
  ok("on the Monday a week before: not due yet (6 days out)", !d0.some(x => /Bug hunt/.test(x.name)), d0.map(x => x.name));
}
{
  const w = home(), L = w.ctx.lrBuildList(), h = w.ctx.lrSundayHTML(L);
  ok("the Sunday list draws the row with its \"open →\" to the PDF", /🖨 Print ×1: Bug hunt sheet/.test(h) && /href="https:\/\/files.example.org\/hunt.pdf" target="_blank" rel="noopener noreferrer"[^>]*>open →/.test(h));
  ok("never offered to the 🛒 shopping list: no → 🛒 chip on a print row", w.ctx.blRowChipHTML(prints(L)[0]) === "" && w.ctx.blRowChipHTML(L.items.find(x => !x.print)).indexOf("🛒") > 0);
  ok("…and the auto-send rule skips it (the egg carton still goes)", w.sent.length >= 1 && !w.sent.some(id => /_print_/.test(id)) && w.sent.some(id => /egg_carton/.test(id)), w.sent);
}
{
  const strip = L => J(L);
  for (const [lbl, o] of [["family + kid subject", {}], ["both kids", { bothGeo: true }], ["no family time", { noFam: true }]]) {
    const A = home(Object.assign({ noPrint: true }, o)), B = home(Object.assign({ noPrint: true, before: true }, o));
    ok("no 🖨 activity: lrBuildList JSON-identical to the tree minus UACTPRINT — " + lbl, strip(A.ctx.lrBuildList()) === strip(B.ctx.lrBuildList()));
  }
  const A = home({ noPrint: true }), B = home({ noPrint: true, before: true });
  ok("…and the Sunday list's HTML byte-identical", A.ctx.lrSundayHTML() === B.ctx.lrSundayHTML());
  const C = home(), D = home({ before: true });
  ok("with 🖨 rows: everything that is not a print row is the same as without the block", J(C.ctx.lrBuildList().items.filter(x => !x.print)) === J(D.ctx.lrBuildList().items));
}
{
  const w = home({ noFam: true }), P = prints(w.ctx.lrBuildList());
  ok("a family-time unit with no family time on the schedule: no row for it (nothing is laid)", !P.some(x => /Bug hunt/.test(x.name)) && P.some(x => /Rock layers/.test(x.name)));
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
})().catch(e => { console.log("CRASH", e && e.stack); process.exit(1); });
