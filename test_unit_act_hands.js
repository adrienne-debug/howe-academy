// 🧪 UACTHANDS — a Hands-on activity: supplies[], steps[], and "Mom leads it" on any kind (slice 5 of
//   PLAN_unit_activity_types_2026-11-19 §2(e), §4 row 5, §5 Q4; her go 2026-11-22/23 "go with her answers and build").
//   Runs the REAL index.html blocks against a fake db that records paths. No real names.
//   · the box: Supplies + Steps only while 🧪 is picked (wrapper uak-<kk>-box-hands), "👩 Mom leads it" under every kind; ids unique
//   · + Add: supplies / steps / mom inside UTADDACT's ONE update; ✎ Save: …/supplies | …/steps | …/mom, only when changed
//   · not Mom → nothing; dry run → nothing written
//   · the supplies path: utResOf tags act:true, deduped by name against the day's own / the craft's; the 🧺 Sunday list, 🏡 Family,
//     the kids' 🎒 bring line (no "| mom"), the 🛒 rule; the Days table's 🎒 cell "🧪 …"
//   · Today's card: the steps list, the kids' supplies, "👩 with Mom"
//   · no fields → the card, the editor (minus the new box), utResOf, the Days row, the Sunday list: byte-identical to the tree minus the block,
//     on a made-up fixture shaped like a beta family's two units (a 6-day holiday unit with two-activity days, a 20-day fish unit)
//   run: node test_unit_act_hands.js
process.env.TZ = "America/New_York";
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x).slice(0, 700) : "")); } };
const J = x => JSON.stringify(x);
const cut = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error("markers " + a); return src.slice(i, j); };
const fn = name => { const i = src.indexOf("function " + name + "("); if (i < 0) throw new Error("no " + name); let d = 0, j = i, seen = false; for (; j < src.length; j++) { const c = src[j]; if (c === "{") { d++; seen = true; } else if (c === "}") { d--; if (seen && d === 0) break; } } return src.slice(i, j + 1); };
const BLK = cut("// UACTHANDS_START", "// UACTHANDS_END") + "// UACTHANDS_END\n";
const UT = cut("// UNITTRACK_START", "// UNITTRACK_END"), AA = cut("// UTADDACT_START", "// UTADDACT_END"), DC = cut("// DAYCARD_START", "// DAYCARD_END");
const KIND = cut("// UACTKIND_START", "// UACTKIND_END"), LINK = cut("// UACTLINK_START", "// UACTLINK_END"), PRINT = cut("// UACTPRINT_START", "// UACTPRINT_END");
const SIGN = ["_unitActs", "_nbActKeys", "_nbActWrite", "_nbActRemove", "unitActPoints", "unitActivityClaim", "unitActivityDone"].map(fn).join("\n");
const LR = "const LR_PARTS=[\"links\",\"supplies\",\"books\",\"orders\",\"notes\"];\n" + ["lrSafeUrl", "lrList", "lrStr", "lrDate", "lrClean", "lrHost", "lrEsc", "lrKidLineHTML"].map(fn).join("\n");
const ids = h => [...h.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
const dup = L => L.filter((x, i) => L.indexOf(x) !== i);
const balanced = h => { const st = []; for (const m of h.matchAll(/<(\/?)([a-zA-Z0-9]+)[^>]*?(\/?)>/g)) { const t = m[2].toLowerCase(); if (/^(input|img|br|hr|meta|link)$/.test(t) || m[3]) continue; if (!m[1]) st.push(t); else if (st.pop() !== t) return false; } return st.length === 0; };

console.log("── wiring ──");
ok("UACTHANDS is one marked block right after UACTANS", src.indexOf("// UACTANS_END\n// UACTHANDS_START") > 0 && src.split("// UACTHANDS_START").length === 2 && src.split("// UACTHANDS_END").length === 2);
const code = BLK.split("\n").filter(l => !/^\s*\/\//.test(l)).join("\n");
ok("the block itself never calls the database (UTADDACT's one update carries every field)", !/db\.|\.ref\(|\.set\(|\.update\(|\.remove\(|\.transaction\(|\.on\(|\.once\(/.test(code));
const NAMES = /\b(adrienne|andrew|julian|lincoln|ellis|lucy|sara|sarah|caleb|taylor|makenzie|kenzie|dewalt|burris|melanie|howe)\b/i;
ok("no kid or family name in the block, no 🔀", !NAMES.test(BLK) && BLK.indexOf("\u{1F500}") < 0, (BLK.match(NAMES) || [])[0]);
const testTxt = fs.readFileSync(__filename, "utf8").split("\n").filter(l => !/^const NAMES =/.test(l)).join("\n");
ok("this test file names no real kid or family", !NAMES.test(testTxt), (testTxt.match(NAMES) || [])[0]);
const hooks = [
  [KIND, `  if(typeof uahKindShow==="function") uahKindShow(kk,t);   // UACTHANDS`],
  [KIND, `  if(typeof uahKindHTML==="function") h+=uahKindHTML(kk,t,a);   // UACTHANDS`],
  [KIND, `  if(typeof uahKindAdd==="function"&&!uahKindAdd(kk,t,act)) return false;   // UACTHANDS`],
  [KIND, `  if(typeof uahKindEdit==="function"&&!uahKindEdit(kk,t,a,upd,base)) return false;   // UACTHANDS`],
  [UT, `if(typeof uahSupplies==="function") uahSupplies(d,out.supplies).forEach(s=>push("supplies",s)); });   // UACTHANDS`],
  [UT, `utCellList(d,"supplies").concat((typeof uahSupplyCells==="function")?uahSupplyCells(u,d):[])`],
  [DC, `+((typeof uahCardHTML==="function")?uahCardHTML(g,act):"")+((typeof wbdRowBtnHTML==="function")?wbdRowBtnHTML(g,act):"")`]];
ok("each hook is in the source exactly once, typeof-guarded", hooks.every(h => h[0].split(h[1]).length === 2), hooks.filter(h => h[0].split(h[1]).length !== 2).map(h => h[1]));
ok("the hand-off hooks come right after the other kinds' (show, box, + Add, ✎)", /uakKindShow\(kk,t\);\n  if\(typeof uahKindShow/.test(KIND) && /h\+=uakKindHTML\(kk,t,a\);[^\n]*\n  if\(typeof uahKindHTML/.test(KIND) && /!uakKindAdd\(kk,t,act\)\) return false;\n  if\(typeof uahKindAdd/.test(KIND) && /!uakKindEdit\(kk,t,a,upd,base\)\) return false;\n  if\(typeof uahKindEdit/.test(KIND));

// ── world 1: the day editor + Today's card ──
const UNIT = () => ({ id: "harv", title: "Harvest", emoji: "🌾", enrolled: { k1: true, k2: true }, decks: [],
  activities: [
    { key: "corn_maze", title: "Draw a corn maze", emoji: "🎨", kind: "sheet", points: 5, day: 2 },
    { key: "salt", title: "Grow salt crystals", emoji: "🎨", kind: "sheet", points: 5, day: 2, type: "hands", desc: "With Mom at the stove.",
      supplies: [{ name: "salt", kids: true }, { qty: "1", name: "dish", kids: true }, { name: "hot water", kids: false }], steps: ["Stir salt into hot water", "Pour it in the dish", "Look every day"], mom: true },
    { key: "walk", title: "Nature walk", emoji: "🎨", kind: "sheet", points: 3, day: 3, type: "screen", mom: true }],
  track: { mode: "seq", perWeek: 4, days: [{ id: "d1", n: 1, t: "Fields" }, { id: "d2", n: 2, t: "Mazes", nb: { activity: "corn_maze" }, craft: { title: "Paper corn", supplies: [{ name: "Salt", kids: true }, { name: "glue", kids: true }] } }, { id: "d3", n: 3, t: "Walk", nb: { activity: "walk" } }] } });
function world(o) {
  o = o || {}; const writes = [], toasts = []; const dom = o.dom || {};
  const ctx = { console, JSON, Object, Array, String, Number, Math, Set, Map, RegExp, Date, Promise, Error, parseInt, isNaN, isFinite, WeakMap, URL,
    unitStudies: { harv: o.unit || UNIT() }, ROSTER: ["k1", "k2"], KID_NAME: { k1: "Ada", k2: "Ben" }, kcKid: o.kcKid || "",
    momHere: () => ctx.MOM, MOM: o.mom !== false, _dryRun: () => !!o.dry, gwShowToast: m => toasts.push(m), bankDirect: () => {}, confirm: () => true,
    db: { ref: p => ({ set: v => writes.push(["set", p === undefined ? "" : p, JSON.parse(J(v === undefined ? null : v))]), update: v => writes.push(["update", p === undefined ? "" : p, JSON.parse(J(v))]), remove: () => writes.push(["remove", p]), transaction: () => {}, child: () => null }) },
    renderAll: () => { ctx.repaints = (ctx.repaints || 0) + 1; }, repaints: 0, document: { getElementById: id => (id in dom) ? dom[id] : null } };
  vm.createContext(ctx);
  vm.runInContext(LR + "\n" + UT + "\n" + AA + "\n" + KIND + "\n" + LINK + "\n" + PRINT + "\n" + (o.before ? "" : BLK) + "\n" + DC + "\n" + SIGN + "\n" + fn("ubSlug") +
    "\nObject.defineProperty(this,'uakPicked',{get:()=>uakPicked});", ctx);
  return { ctx, writes, toasts, dom };
}
const G = (c, id) => ({ day: c.utRef("harv", c.utDay(c.unitStudies.harv, id)), u: c.unitStudies.harv, first: null, present: [] });
const BOX = /<div id="uak-[^"]+-box-hands"[^]*?<\/label>/;

console.log("\n── the box ──");
{
  const w = world({ dom: { "uak-harv-d1-box-hands": { style: {} }, "uak-harv-d1-box-link": { style: {} }, "uak-harv-d1-box-print": { style: {} } } }); const c = w.ctx, u = c.unitStudies.harv;
  const h = c.utaaEditorHTML(u, c.utDay(u, "d1"));
  ok("+ Add box: the 🧪 box is there, hidden while 📓 is picked, with Supplies and Steps", /id="uak-harv-d1-box-hands" data-uak-kind="hands" style="display:none/.test(h) && /<textarea id="utaa-harv-d1-supplies"/.test(h) && /<textarea id="utaa-harv-d1-steps"/.test(h) && /\| mom = not on the kids’ line/.test(h));
  ok("…\"👩 Mom leads it\" sits OUTSIDE the 🧪 box (shown for every kind), unticked, finger-sized", /<\/div><label data-uah-momsw="1" style="display:flex;gap:8px;align-items:center;min-height:44px[^"]*"><input id="utaa-harv-d1-mom" type="checkbox" style="width:20px;height:20px;margin:0"> 👩 Mom leads it<\/label>/.test(h));
  ok("…the 🧪 box comes after the 🔗 and 🖨 boxes, before the line", h.indexOf("box-link") < h.indexOf("box-hands") && h.indexOf("box-print") < h.indexOf("box-hands") && h.indexOf("box-hands") < h.indexOf("utaa-harv-d1-line"));
  c.uakPick("harv-d1", "hands");
  ok("tapping 🧪 shows it in place (no full render); the 🔗 and 🖨 boxes stay hidden", w.dom["uak-harv-d1-box-hands"].style.display === "block" && w.dom["uak-harv-d1-box-link"].style.display === "none" && w.dom["uak-harv-d1-box-print"].style.display === "none" && c.repaints === 0);
  c.uakPick("harv-d1", "print"); ok("tapping 🖨 hides it", w.dom["uak-harv-d1-box-hands"].style.display === "none" && w.dom["uak-harv-d1-box-print"].style.display === "block");
  const e = c.utaaEditorHTML(u, c.utDay(u, "d2"));
  ok("✎ on a day whose nb is a 📓 activity: the 🧪 box hidden and empty, the switch unticked", /id="uak-harv-d2-box-hands"[^>]*display:none/.test(e) && /<textarea id="utaa-harv-d2-supplies"[^>]*><\/textarea>/.test(e) && /id="utaa-harv-d2-mom" type="checkbox" style/.test(e));
  const u2 = UNIT(); u2.track.days[1].nb = { activity: "salt" }; const w2 = world({ unit: u2 }); const e2 = w2.ctx.utaaEditorHTML(u2, w2.ctx.utDay(u2, "d2"));
  ok("✎ on a 🧪 activity: 🧪 pressed, the box open, supplies back as lines (\"| mom\" kept), steps one per line, the switch ticked",
    /id="uak-harv-d2-hands" aria-pressed="true"/.test(e2) && /id="uak-harv-d2-box-hands"[^>]*display:block/.test(e2) && e2.indexOf(">salt\n1 dish\nhot water | mom</textarea>") > 0 && e2.indexOf(">Stir salt into hot water\nPour it in the dish\nLook every day</textarea>") > 0 && /id="utaa-harv-d2-mom" type="checkbox" checked/.test(e2), e2.slice(e2.indexOf("box-hands"), e2.indexOf("box-hands") + 900));
  ok("the box wraps at phone width (flex-wrap, flex-basis, min-width:0 — no fixed width)", /flex-wrap:wrap/.test(e2.match(BOX)[0]) && !/[^-]width:\d+px/.test(e2.match(BOX)[0].replace(/width:20px;height:20px/, "")));
  ok("the box's HTML is balanced", balanced(h) && balanced(e2) && balanced(c.uahKindHTML("x", "hands", u2.activities[1])));
  const esc = world().ctx.uahKindHTML("k", "hands", { supplies: [{ name: "<b>glue</b>", kids: true }], steps: ["a & \"b\""] });
  ok("supplies and steps are escaped in the box", esc.indexOf("&lt;b&gt;glue&lt;/b&gt;") > 0 && esc.indexOf("a &amp; &quot;b&quot;") > 0 && esc.indexOf("<b>glue") < 0);
  const k = world({ mom: false }); ok("not Mom: no box at all (UTADDACT's gate)", k.ctx.utaaEditorHTML(k.ctx.unitStudies.harv, k.ctx.utDay(k.ctx.unitStudies.harv, "d1")) === "");
}
console.log("\n── element ids: unique in the whole editor box ──");
{
  const c = world().ctx, u = c.unitStudies.harv; const u2 = UNIT(); u2.track.days[1].nb = { activity: "salt" }; const c2 = world({ unit: u2 }).ctx;
  const hNew = c.utaaEditorHTML(u, c.utDay(u, "d1")), hNb = c.utaaEditorHTML(u, c.utDay(u, "d2")), hH = c2.utaaEditorHTML(u2, c2.utDay(u2, "d2"));
  ok("+ Add box: every id unique (chips, 🔗, 🖨, 🧪 boxes, inputs)", ids(hNew).length >= 15 && dup(ids(hNew)).length === 0, dup(ids(hNew)));
  ok("✎ on 📓 and on 🧪: every id unique", dup(ids(hNb)).length === 0 && dup(ids(hH)).length === 0, [dup(ids(hNb)), dup(ids(hH))]);
  ok("the 🧪 box's id is not the 🧪 chip's id", ids(hNew).indexOf("uak-harv-d1-hands") >= 0 && ids(hNew).indexOf("uak-harv-d1-box-hands") >= 0 && hNew.split('id="uak-harv-d1-hands"').length === 2);
  ok("the new ids are free everywhere else in the app (no other utaa-…-supplies/-steps/-mom, no other …-box-hands)", !/["'](utaa-'\+[a-z]+\+'-(supplies|steps|mom)|uak-'\+kk\+'-box-hands)["']/.test(src.replace(BLK, "")) && src.split("-box-hands").length === BLK.split("-box-hands").length);
  // a browser-like document: getElementById = the FIRST element with that id
  const browser = h => { const els = []; for (const m of h.matchAll(/<(\w+)\b([^>]*)>/g)) { const id = (m[2].match(/\bid="([^"]+)"/) || [])[1]; if (!id) continue; const st = (m[2].match(/\bstyle="([^"]*)"/) || [])[1] || ""; const disp = (st.match(/display:(\w+)/) || [])[1] || ""; els.push({ id, tag: m[1], style: { display: disp }, attrs: {}, setAttribute(k, v) { this.attrs[k] = v; if (k === "style") { const d = (v.match(/display:(\w+)/) || [])[1]; if (d) this.style.display = d; } } }); } return { els, getElementById: id => els.find(e => e.id === id) || null }; };
  const w = world(); const cc = w.ctx, uu = cc.unitStudies.harv; const doc = browser(cc.utaaEditorHTML(uu, cc.utDay(uu, "d1"))); cc.document = doc;
  const chip = doc.getElementById("uak-harv-d1-hands"), boxEl = doc.els.find(x => x.tag === "div" && x.id === "uak-harv-d1-box-hands");
  cc.uakPick("harv-d1", "hands");
  ok("browser-like: tapping 🧪 opens the 🧪 box and leaves the 🧪 chip showing, pressed", chip && boxEl && chip !== boxEl && boxEl.style.display === "block" && chip.style.display === "" && chip.attrs["aria-pressed"] === "true");
  cc.uakPick("harv-d1", "link"); ok("…tapping 🔗 closes it", boxEl.style.display === "none");
}

console.log("\n── + Add ──");
const A3 = "unitStudies/harv/activities/3", NB0 = "unitStudies/harv/track/days/0/nb";
{
  const dom = { "utaa-harv-d1-line": { value: "Rock hunt | 6 | Outside" }, "utaa-harv-d1-supplies": { value: "1 magnet\n  \nbucket | mom\n2 bags" }, "utaa-harv-d1-steps": { value: "Find 5 rocks\n\n  Test each with the magnet  \nSort them" }, "utaa-harv-d1-mom": { checked: true } };
  const w = world({ dom }); const c = w.ctx; c.uakPick("harv-d1", "hands"); const r = c.utaaAdd("harv", "d1");
  ok("🧪 + Add: ONE update of the same two paths (the record + the day's nb)", r === true && w.writes.length === 1 && w.writes[0][0] === "update" && J(Object.keys(w.writes[0][2]).sort()) === J([A3, NB0].sort()), w.writes);
  ok("…the record carries supplies (LESSONRES's shape, \"| mom\" → kids:false), steps (strings), mom:true, type hands",
    J(w.writes[0][2][A3]) === J({ key: "rock_hunt", title: "Rock hunt", emoji: "🎨", kind: "sheet", points: 6, day: 1, desc: "Outside", mom: true,
      supplies: [{ name: "magnet", kids: true, qty: "1" }, { name: "bucket", kids: false }, { name: "bags", kids: true, qty: "2" }], steps: ["Find 5 rocks", "Test each with the magnet", "Sort them"], type: "hands" }), w.writes[0][2][A3]);
}
{
  const dom = { "utaa-harv-d1-line": { value: "Rock hunt | 6" }, "utaa-harv-d1-supplies": { value: "" }, "utaa-harv-d1-steps": { value: "" }, "utaa-harv-d1-mom": { checked: false } };
  const w = world({ dom }); w.ctx.uakPick("harv-d1", "hands"); w.ctx.utaaAdd("harv", "d1");
  ok("🧪 with empty boxes and the switch off: no supplies / steps / mom field (just type hands)", J(w.writes[0][2][A3]) === J({ key: "rock_hunt", title: "Rock hunt", emoji: "🎨", kind: "sheet", points: 6, day: 1, type: "hands" }), w.writes[0][2][A3]);
}
{
  const dom = { "utaa-harv-d1-line": { value: "Farm video | 2" }, "utaa-harv-d1-url": { value: "https://example.org/farm" }, "utaa-harv-d1-supplies": { value: "corn" }, "utaa-harv-d1-steps": { value: "Watch" }, "utaa-harv-d1-mom": { checked: true } };
  const w = world({ dom }); w.ctx.uakPick("harv-d1", "link"); w.ctx.utaaAdd("harv", "d1");
  ok("another kind (🔗) with the switch on: mom:true rides along; the 🧪 boxes are ignored (not 🧪)", J(w.writes[0][2][A3]) === J({ key: "farm_video", title: "Farm video", emoji: "🎨", kind: "sheet", points: 2, day: 1, url: "https://example.org/farm", mom: true, type: "link" }), w.writes[0][2][A3]);
}
{
  const dom = { "utaa-harv-d1-line": { value: "Leaf hunt | 8 | Find five shapes" }, "utaa-harv-d1-mom": { checked: false } };
  const A = world({ dom }), B = world({ dom, before: true }); A.ctx.utaaAdd("harv", "d1"); B.ctx.utaaAdd("harv", "d1");
  ok("📓 (untouched), switch off: the write is byte-identical to the tree minus UACTHANDS", A.writes.length === 1 && J(A.writes) === J(B.writes), [A.writes, B.writes]);
  const sup = Array.from({ length: 40 }, (_, i) => "thing " + i).join("\n"), long = "x".repeat(300);
  const w = world({ dom: { "utaa-harv-d1-line": { value: "Big | 1" }, "utaa-harv-d1-supplies": { value: sup }, "utaa-harv-d1-steps": { value: long + "\n" + sup } } }); w.ctx.uakPick("harv-d1", "hands"); w.ctx.utaaAdd("harv", "d1");
  const rec = w.writes[0][2][A3]; ok("capped: 30 supplies, 20 steps, a step ≤ 240 letters", rec.supplies.length === 30 && rec.steps.length === 20 && rec.steps[0].length === 240);
  const dw = world({ dry: true, dom: { "utaa-harv-d1-line": { value: "Rock hunt | 6" }, "utaa-harv-d1-supplies": { value: "magnet" }, "utaa-harv-d1-mom": { checked: true } } }); dw.ctx.uakPick("harv-d1", "hands"); dw.ctx.utaaAdd("harv", "d1");
  ok("dry run: nothing written, the screen copy carries the fields", dw.writes.length === 0 && dw.ctx.unitStudies.harv.activities[3].mom === true && dw.ctx.unitStudies.harv.activities[3].supplies[0].name === "magnet");
  const kw = world({ mom: false, dom: { "utaa-harv-d1-line": { value: "Rock hunt | 6" } } }); ok("not Mom: + Add does nothing", kw.ctx.utaaAdd("harv", "d1") === false && kw.writes.length === 0);
}

console.log("\n── ✎ Save ──");
const P1 = "unitStudies/harv/activities/1/";
{
  const u = UNIT(); u.track.days[1].nb = { activity: "salt" };
  const dom = { "utaa-harv-d2-title": { value: "Grow salt crystals" }, "utaa-harv-d2-points": { value: "5" }, "utaa-harv-d2-desc": { value: "With Mom at the stove." },
    "utaa-harv-d2-supplies": { value: "salt\n1 dish\nhot water | mom" }, "utaa-harv-d2-steps": { value: "Stir salt into hot water\nPour it in the dish\nLook every day" }, "utaa-harv-d2-mom": { checked: true } };
  const w = world({ unit: u, dom }); const c = w.ctx, a = () => c.unitStudies.harv.activities[1];
  c.utaaEdit("harv", "d2"); ok("nothing changed → no write", w.writes.length === 0, w.writes);
  dom["utaa-harv-d2-supplies"].value = "salt\n1 dish\nhot water | mom\nstring";
  c.utaaEdit("harv", "d2"); ok("a supply added → ONE update of only …/supplies (the whole list, its own path)", J(w.writes) === J([["update", "", { [P1 + "supplies"]: [{ name: "salt", kids: true }, { name: "dish", kids: true, qty: "1" }, { name: "hot water", kids: false }, { name: "string", kids: true }] }]]), w.writes);
  w.writes.length = 0; dom["utaa-harv-d2-steps"].value = "Stir\nWait"; dom["utaa-harv-d2-mom"].checked = false; c.utaaEdit("harv", "d2");
  ok("steps changed + switch off → only …/steps and …/mom = null", J(w.writes) === J([["update", "", { [P1 + "mom"]: null, [P1 + "steps"]: ["Stir", "Wait"] }]]) && !("mom" in a()), w.writes);
  w.writes.length = 0; dom["utaa-harv-d2-supplies"].value = ""; dom["utaa-harv-d2-steps"].value = " \n "; c.utaaEdit("harv", "d2");
  ok("both boxes emptied → …/supplies and …/steps = null (the fields go)", J(w.writes) === J([["update", "", { [P1 + "supplies"]: null, [P1 + "steps"]: null }]]) && !("supplies" in a()) && !("steps" in a()), w.writes);
  w.writes.length = 0; dom["utaa-harv-d2-supplies"].value = "glue"; c.uakPick("harv-d2", "notebook"); c.utaaEdit("harv", "d2");
  ok("switching 🧪 → 📓: only …/type; the 🧪 boxes are not read (left as they were)", J(w.writes) === J([["update", "", { [P1 + "type"]: null }]]), w.writes);
  w.writes.length = 0; dom["utaa-harv-d2-mom"].checked = true; c.utaaEdit("harv", "d2");
  ok("the switch on a 📓 activity → only …/mom = true (any kind)", J(w.writes) === J([["update", "", { [P1 + "mom"]: true }]]) && a().mom === true, w.writes);
  const k = world({ unit: UNIT(), mom: false, dom }); k.ctx.unitStudies.harv.track.days[1].nb = { activity: "salt" }; k.ctx.utTouched(k.ctx.unitStudies.harv); k.ctx.utaaEdit("harv", "d2"); ok("not Mom: ✎ writes nothing", k.writes.length === 0);
  const du = UNIT(); du.track.days[1].nb = { activity: "salt" }; const d = world({ unit: du, dry: true, dom: Object.assign({}, dom, { "utaa-harv-d2-supplies": { value: "rope" } }) });
  d.ctx.uakPick("harv-d2", "hands"); d.ctx.utaaEdit("harv", "d2"); ok("dry run: ✎ writes nothing (the screen copy changes)", d.writes.length === 0 && d.ctx.unitStudies.harv.activities[1].supplies[0].name === "rope");
  const su = UNIT(); su.activities[1].supplies = { "0": { name: "salt", kids: true }, "2": { qty: "1", name: "dish", kids: true }, "5": { name: "hot water", kids: false } }; su.track.days[1].nb = { activity: "salt" };
  const s = world({ unit: su, dom: Object.assign({}, dom, { "utaa-harv-d2-supplies": { value: "salt\n1 dish\nhot water | mom" }, "utaa-harv-d2-steps": { value: "Stir salt into hot water\nPour it in the dish\nLook every day" }, "utaa-harv-d2-mom": { checked: true } }) });
  s.ctx.utaaEdit("harv", "d2"); ok("supplies as Firebase's keyed object, unchanged → no write", s.writes.length === 0, s.writes);
}

console.log("\n── Today's card ──");
const row = (h, t) => { const i = h.indexOf(t); return i < 0 ? "" : h.slice(i, (h.indexOf("data-dc-actchk", i) + 1 || h.length + 1) - 1); };
{
  for (const [who, o] of [["Mom", {}], ["a kid's device", { mom: false, kcKid: "k1" }], ["the board", { mom: false }]]) {
    const w = world(o); const h = w.ctx.dcDayHTML(G(w.ctx, "d2")), r = row(h, "Grow salt crystals");
    ok(who + ": the 🧪 row lists the steps, numbered, big", /<ol data-uah-steps="1" style="margin:10px 0 0;padding-left:28px;font-size:20px[^"]*"><li style="margin:4px 0">Stir salt into hot water<\/li><li style="margin:4px 0">Pour it in the dish<\/li><li style="margin:4px 0">Look every day<\/li><\/ol>/.test(r), r);
    ok(who + ": …the kids' supplies (\"| mom\" items left off), then \"👩 with Mom\"", /data-uah-sup="1"[^>]*>🎒 salt · 1 dish<\/div>/.test(r) && !/data-uah-sup="1"[^<]*hot water/.test(r) && /data-uah-mom="1"[^>]*>👩 with Mom<\/div>/.test(r) && r.indexOf("data-uah-sup") < r.indexOf("data-uah-mom"), r);
    ok(who + ": …under the line about it, before the ✓ chips", r.indexOf("With Mom at the stove.") < r.indexOf("data-uah-steps") && h.indexOf("data-uah-mom") < h.indexOf("data-dc-actchk", h.indexOf("Grow salt crystals")));
  }
  const w = world(); const h3 = w.ctx.dcDayHTML(G(w.ctx, "d3"));
  ok("\"👩 with Mom\" on another kind (📱) too; no steps list there", /data-uah-mom="1"[^>]*>👩 with Mom</.test(row(h3, "Nature walk")) && !/data-uah-steps/.test(h3));
  ok("the 📓 row beside the 🧪 one gets nothing", !/data-uah-/.test(row(w.ctx.dcDayHTML(G(w.ctx, "d2")), "Draw a corn maze")));
  const u = UNIT(); u.activities[1].type = undefined; delete u.activities[1].type; u.activities[1].mom = undefined; delete u.activities[1].mom; const wn = world({ unit: u });
  ok("steps + supplies on a 📓 activity (code-shipped units carry steps): nothing drawn — only 🧪 shows them", !/data-uah-/.test(wn.ctx.dcDayHTML(G(wn.ctx, "d2"))));
  const ue = UNIT(); ue.activities[1].steps = ["<i>hot</i> & wet"]; ue.activities[1].supplies = [{ name: "<b>x</b>", kids: true }]; const we = world({ unit: ue });
  const he = we.ctx.dcDayHTML(G(we.ctx, "d2")); ok("steps and supplies are escaped on the card", he.indexOf("&lt;i&gt;hot&lt;/i&gt; &amp; wet") > 0 && he.indexOf("🎒 &lt;b&gt;x&lt;/b&gt;") > 0 && he.indexOf("<i>hot") < 0);
  const us = UNIT(); us.activities[1].supplies = "salt\nhot water | mom"; us.activities[1].steps = { "0": "One", "3": "Two" }; const ws = world({ unit: us }); const rs = row(ws.ctx.dcDayHTML(G(ws.ctx, "d2")), "Grow salt");
  ok("supplies as text lines and steps as a keyed object (older / hand-typed shapes) read the same way", /🎒 salt<\/div>/.test(rs) && /<li[^>]*>One<\/li><li[^>]*>Two<\/li>/.test(rs), rs);
  const all = world().ctx.dcDayHTML(G(world().ctx, "d2")); ok("the card's HTML is balanced, no duplicate ids", balanced(all) && dup(ids(all)).length === 0);
  const wq = world(); wq.ctx.dcDayHTML(G(wq.ctx, "d2")); ok("drawing the card writes nothing", wq.writes.length === 0);
}

console.log("\n── the supplies path (utResOf) and the Days table ──");
{
  const w = world(), c = w.ctx, u = c.unitStudies.harv;
  const r = c.utResOf([c.utRef("harv", c.utDay(u, "d2"))]);
  ok("Day 2: the craft's (✂️) then the 🧪 activity's, tagged act:true; \"salt\" is the craft's already → not twice (by name, any case)",
    J(r.supplies) === J([{ name: "Salt", kids: true, craft: true }, { name: "glue", kids: true, craft: true }, { name: "dish", kids: true, qty: "1", act: true }, { name: "hot water", kids: false, act: true }]), r.supplies);
  ok("the kids' 🎒 bring line reads the act items like any supply — \"| mom\" left off", c.lrKidLineHTML(r).indexOf("🎒 bring: Salt, glue, 1 dish<") > 0 && c.lrKidLineHTML(r).indexOf("hot water") < 0, c.lrKidLineHTML(r));
  ok("a day with no 🧪 activity: utResOf identical to the tree minus the block", J(c.utResOf([c.utRef("harv", c.utDay(u, "d3"))])) === J(world({ before: true }).ctx.utResOf([c.utRef("harv", c.utDay(u, "d3"))])));
  ok("a day without its unit id (UNITGATHER hands utResOf bare days) → no act items (UNITGATHER reads activities itself)", !c.utResOf([c.utDay(u, "d2")]).supplies.some(s => s.act));
  const u2 = UNIT(); u2.activities.push({ key: "salt2", title: "Second", type: "hands", day: 2, supplies: [{ name: "DISH", kids: true }, { name: "spoon", kids: true }] }); const c2 = world({ unit: u2 }).ctx;
  ok("two 🧪 activities on one day: a name the first already lists is not listed again", J(c2.utResOf([c2.utRef("harv", c2.utDay(u2, "d2"))]).supplies.filter(s => s.act).map(s => s.name)) === J(["dish", "hot water", "spoon"]));
  const u3 = UNIT(); u3.activities[1].type = "screen"; const c3 = world({ unit: u3 }).ctx;
  ok("supplies on an activity that is no longer 🧪 are not listed", !c3.utResOf([c3.utRef("harv", c3.utDay(u3, "d2"))]).supplies.some(s => s.act));
  ok("Days table 🎒 cell: \"🧪 …\" after the day's and the craft's (all of them — it is Mom's table)", J(c.uahSupplyCells(u, c.utDay(u, "d2"))) === J(["🧪 salt", "🧪 1 dish", "🧪 hot water"]));
  const row2 = c.utRowHTML(u, c.utDay(u, "d2"), true), row2b = world({ before: true }).ctx.utRowHTML(u, c.utDay(u, "d2"), true);
  ok("…the row shows them; a day with none draws byte-identical to the tree minus the block", row2.indexOf("🧪 1 dish") > 0 && row2b.indexOf("🧪") < 0 && c.utRowHTML(u, c.utDay(u, "d1"), true) === world({ before: true }).ctx.utRowHTML(u, c.utDay(u, "d1"), true));
}

// ── world 2: the Sunday list on a made-up family (test_unit_act_print's shape) ──
const cutS = (a, b) => cut(a, b);
const KIDS = ["kida", "kidb"];
const LINES = ["Bugs up close", "Insect bodies", "Caterpillars", "Ant snack day", "Bug games", "Bug parade"];
const SCHOOL = (() => { const out = []; const d = new Date(2026, 10, 2); while (d <= new Date(2027, 0, 29)) { const s = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); if (d.getDay() >= 1 && d.getDay() <= 5) out.push(s); d.setDate(d.getDate() + 1); } return out; })();
const DN = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const WEEKDAYS = ["monday", "tuesday", "wednesday", "thursday", "friday"];
const BUGS = o => ({ id: "bugs", title: "Backyard Bugs", emoji: "🐞", enrolled: { kida: true, kidb: true }, decks: [],
  activities: [{ key: "draw", title: "Draw a bug", points: 5, day: 3 }].concat(o.noHands ? [] : [{ key: "jar", title: "Bug jar", day: 3, type: "hands", supplies: [{ name: "egg carton", kids: true }, { name: "pipe cleaners", kids: true }, { name: "hot glue", kids: false }], steps: ["Cut", "Glue"] }]),
  track: { mode: "seq", perWeek: 5, days: LINES.map((t, i) => Object.assign({ id: "d" + (i + 1), n: i + 1, t }, i === 2 ? { craft: { title: "Egg-carton caterpillar", supplies: [{ name: "egg carton" }] } } : {})) } });
const ROCKS = o => ({ id: "rocks", title: "Rock Hunt", emoji: "🪨", enrolled: { kidb: true }, decks: [],
  activities: [{ key: "chart", title: "Rock chart", day: 2 }].concat(o.noHands ? [] : [{ key: "magnet", title: "Magnet test", day: 2, type: "hands", supplies: [{ qty: "1", name: "magnet", kids: true }, { name: "scale", kids: false }] }]),
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
  SCHOOL.forEach((d, i) => { lessons.kida[i] = { date: d, week: "Wk" }; lessons.kidb[i] = { date: d, week: "Wk" }; if (GEO[d]) lessons.kidb[i].geo = GEO[d]; });
  const subjects = { kidb: { geo: GEOSUB() } };
  const units = { bugs: BUGS(o), rocks: ROCKS(o) };
  const writes = [], sent = [];
  const ctx = { console, JSON, Object, Array, String, Number, Math, Set, Map, RegExp, WeakMap, Date: FakeDate, parseInt, parseFloat, isNaN, isFinite, setTimeout: () => 0, clearTimeout: () => {},
    ROSTER: KIDS.slice(), KID_COLOR: {}, unitStudies: units, notebookSettings: {},
    rulesData: { schoolDay: { defaultStart: "9:00 AM", defaultEnd: "4:00 PM", lunchStart: "12:00 PM", lunchEnd: "1:00 PM" }, familyBlocks: { ft: BLOCK() }, buy: { auto: true } },
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
  vm.runInContext([cutS("// FAMBLOCK_START", "// FAMBLOCK_END"), cutS("// FAMTOGETHER_START", "// FAMTOGETHER_END"), cutS("// FAMBLOCKOUT_START", "// FAMBLOCKOUT_END"),
    cutS("// FAMLESSONS_START", "// FAMLESSONS_END"), cutS("// FAMDAYSTART_START", "// FAMDAYSTART_END"), cutS("// UNITFT_START", "// UNITFT_END"),
    cutS("// LESSONRES_START", "// LESSONRES_END"), cutS("// FAMRES_START", "// FAMRES_END"), UT, cutS("// PUTSCHED_START", "// PUTSCHED_END"), cutS("// CRAFT_START", "// CRAFT_END"),
    cutS("// UNITDAY_EXTRAS_START", "// UNITDAY_EXTRAS_END"), cutS("// UNITDAY_GAME_START", "// UNITDAY_GAME_END"),
    fn("lidsFor"), fn("_unitActs"), cutS("// UNITGATHER_START", "// UNITGATHER_END"), AA, KIND, LINK, PRINT, o.before ? "" : BLK,
    ["blMom", "blFind", "blCleared", "blRule", "blItems", "blRowChipHTML", "blAutoSend"].map(fn).join("\n"), "const BL_CHIP='';",
    "function blSend(it){ __sent.push(it.id); return {id:'x'}; } function blRuleStore(){ return ''; } function blEsc(s){ return String(s); } function blListName(){ return 'Shopping List'; } function blPickOpen(){}",
    "Object.defineProperty(this,'famProgress',{get:()=>famProgress,set:v=>{famProgress=v;}});"].join("\n"), Object.assign(ctx, { __sent: sent }));
  ctx.famProgress = {};
  return { ctx, writes, sent };
}
const rowsOf = L => L.kids.map(K => K.kid + ":" + K.kinds.map(k => k.kind + "[" + k.items.map(it => it.name + (it.craft ? "✂" : "")).join("|") + "]").join(","));

console.log("\n── the 🧺 Sunday list ──");
{
  const w = home(), L = w.ctx.lrBuildList();
  ok("🏡 Family (the bugs unit on family time, Day 3 next week): the craft's egg carton once (✂️), then the 🧪 activity's pipe cleaners and hot glue",
    J(rowsOf(L).filter(r => /^_family/.test(r))) === J(["_family:supplies[egg carton✂|pipe cleaners|hot glue]"]), rowsOf(L));
  ok("the 🧪 rows are ordinary supply rows (the Sunday list's own ids, ✓ Got it as any supply)", L.items.some(x => /^lr__family_.*_supplies_pipe_cleaners$/.test(x.id)) && L.items.some(x => /^lr__family_.*_supplies_hot_glue$/.test(x.id)), L.items.map(x => x.id));
  w.ctx.lrSundayHTML(L);
  ok("the 🛒 shopping-list rule takes them as it takes a craft's (auto-send)", w.sent.some(id => /pipe_cleaners/.test(id)) && w.sent.some(id => /egg_carton/.test(id)), w.sent);
  const kr = w.ctx.lrFor("kidb", "geo", "k2");
  ok("a kid's own subject (rocks, lesson 2 → Day 2): the lesson's record carries the day's rock, then magnet and scale tagged act:true", J(kr.supplies) === J([{ name: "rock 2", kids: true }, { name: "magnet", kids: true, qty: "1", act: true }, { name: "scale", kids: false, act: true }]) && kr._from.supplies === "unit", kr.supplies);
  const kid = w.ctx.lrKidLineHTML(w.ctx.lrFor("kidb", "geo", "k2"));
  ok("the kid's own card for that lesson: \"🎒 bring: rock 2, 1 magnet\" — the \"| mom\" scale left off", kid.indexOf("🎒 bring: rock 2, 1 magnet<") > 0 && kid.indexOf("scale") < 0, kid);
  ok("building the list wrote nothing", w.writes.length === 0);
  const g = w.ctx.unitGather(w.ctx.unitStudies.bugs, {}), sup = g.totals.supplies.filter(s => /egg carton|pipe cleaners|hot glue/.test(s.name));
  ok("the 🧾 Get ready sheet (UNITGATHER) still counts each once, from the activity", sup.length === 3 && sup.find(s => s.name === "hot glue").mom === true && sup.find(s => s.name === "pipe cleaners").from.indexOf("act") >= 0, sup);
  const A = home({ noHands: true }), B = home({ noHands: true, before: true });
  ok("no 🧪 activity: lrBuildList and the Sunday list's HTML identical to the tree minus UACTHANDS", J(A.ctx.lrBuildList()) === J(B.ctx.lrBuildList()) && A.ctx.lrSundayHTML() === B.ctx.lrSundayHTML());
  const C = home(), D = home({ before: true });
  ok("with 🧪 rows: every row that is not an activity supply is the same as without the block", J(C.ctx.lrBuildList().items.filter(x => !/pipe_cleaners|hot_glue|_magnet$|_scale$/.test(x.id))) === J(D.ctx.lrBuildList().items));
  ok("…and UNITGATHER's totals are identical with or without the block (it already read activity supplies)", J(C.ctx.unitGather(C.ctx.unitStudies.bugs, {})) === J(D.ctx.unitGather(D.ctx.unitStudies.bugs, {})) && J(C.ctx.unitGather(C.ctx.unitStudies.rocks, {})) === J(D.ctx.unitGather(D.ctx.unitStudies.rocks, {})));
}

console.log("\n── a beta family's two units (made-up words, their shape): nothing changes without the new fields ──");
{
  const HOL = () => ({ id: "hol", title: "Holiday", emoji: "🦃", enrolled: { k1: true, k2: true }, decks: [],
    activities: [
      { key: "own_holiday", title: "Your own holiday", kind: "sheet", emoji: "🎨", points: 20, day: 2, desc: "Write 2-3 sentences." },
      { key: "own_holiday_y", title: "Your own holiday (younger)", kind: "sheet", emoji: "🎨", points: 10, day: 2, desc: "Draw it." },
      { key: "design_float", title: "Design your float", kind: "sheet", emoji: "🎨", points: 5, day: 4 },
      { key: "create_float", title: "Create your float", kind: "sheet", emoji: "🎨", points: 15, day: 4, desc: "Gather supplies around your house." },
      { key: "leaf_game", title: "Leaf blowing game", kind: "sheet", emoji: "🎨", points: 5, day: 1 },
      { key: "name_bird", title: "Name a bird", kind: "sheet", emoji: "🎨", points: 5, day: 3 },
      { key: "corn_snack", title: "Corn snack", kind: "sheet", emoji: "🎨", points: 5, day: 5, desc: "Make a snack with Mom." },
      { key: "hunt", title: "Gratitude hunt", kind: "sheet", emoji: "🎨", points: 5, day: 6 }],
    track: { mode: "seq", perWeek: 4, days: [1, 2, 3, 4, 5, 6].map(n => Object.assign({ id: "d" + n, n, t: "Day " + n, nb: { activity: ["leaf_game", "own_holiday", "name_bird", "design_float", "corn_snack", "hunt"][n - 1] }, res: { books: [{ title: "Book " + n }], links: [{ url: "https://example.org/v" + n, label: "Video" }] } }, n === 2 || n === 5 ? { craft: { title: "Craft " + n, steps: [{ text: "Cut" }], supplies: [{ name: "paper" }, { name: "glue" }] } } : {})) } });
  const FISH = () => ({ id: "fish", title: "Fish", emoji: "🐟", enrolled: { k1: true }, decks: [],
    activities: [{ key: "fav_fish", title: "My favorite fish", kind: "sheet", emoji: "🎨", points: 10, day: 8 }, { key: "fact_file", title: "Fish fact file", kind: "sheet", emoji: "🎨", points: 5, day: 14 }, { key: "fish_or_not", title: "Fish or not fish?", kind: "sheet", emoji: "🎨", points: 10, day: 20 }],
    track: { mode: "seq", perWeek: 4, days: Array.from({ length: 20 }, (_, i) => Object.assign({ id: "f" + (i + 1), n: i + 1, t: "Fish day " + (i + 1) }, [8, 14, 20].indexOf(i + 1) >= 0 ? { nb: { activity: ["fav_fish", "fact_file", "fish_or_not"][[8, 14, 20].indexOf(i + 1)] } } : {})) } });
  const mk = (before, who) => { const w = world(Object.assign({ unit: HOL(), before }, who)); w.ctx.unitStudies.fish = FISH(); return w; };
  for (const [lbl, who] of [["Mom", {}], ["a kid's device", { mom: false, kcKid: "k1" }], ["the board", { mom: false }]]) {
    const A = mk(false, who), B = mk(true, who); let same = true, bad = [];
    for (const uid of ["hol", "fish"]) { const ua = A.ctx.unitStudies[uid], ub = B.ctx.unitStudies[uid];
      A.ctx.utDays(ua).forEach(d => { const ga = { day: A.ctx.utRef(uid, d), u: ua, first: null, present: [] }, gb = { day: B.ctx.utRef(uid, B.ctx.utDay(ub, d.id)), u: ub, first: null, present: [] };
        if (A.ctx.dcDayHTML(ga) !== B.ctx.dcDayHTML(gb)) { same = false; bad.push(uid + " card " + d.id); }
        if (J(A.ctx.utResOf([ga.day])) !== J(B.ctx.utResOf([gb.day]))) { same = false; bad.push(uid + " res " + d.id); }
        if (who.mom !== false) { if (A.ctx.utRowHTML(ua, d, true) !== B.ctx.utRowHTML(ub, B.ctx.utDay(ub, d.id), true)) { same = false; bad.push(uid + " row " + d.id); }
          if (A.ctx.utaaEditorHTML(ua, d).replace(BOX, "") !== B.ctx.utaaEditorHTML(ub, B.ctx.utDay(ub, d.id))) { same = false; bad.push(uid + " editor " + d.id); } } }); }
    ok(lbl + ": all 26 days — the card, utResOf" + (who.mom !== false ? ", the Days row, and the day editor minus the new 🧪 box + switch" : "") + " — byte-identical to the tree minus UACTHANDS", same, bad);
  }
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
