/*
 * Node tests — 🔒 Star Store edits need the Mom PIN every time (her ask 2026-10-07: Kenzie set a reward to "$5 for 1 star"
 * on a tablet with Mom mode left on). Adding / renaming / re-pricing / deleting / moving rewards, the Ask-Mom threshold and
 * the store settings wait for the PIN typed into the store pop-up; Kids' Corner never shows the editor; kids still view + buy.
 *   run:  node test_store_lock.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const cut = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error("markers " + a); return src.slice(i, j); };
function slice(name) { const i = src.indexOf("function " + name + "("); if (i < 0) throw new Error("missing " + name);
  let d = 0; for (let k = src.indexOf("{", i); k < src.length; k++) { if (src[k] === "{") d++; else if (src[k] === "}") { d--; if (!d) return src.slice(i, k + 1); } } }
const CODE = cut("// STORELOCK_START", "// STORELOCK_END") + "\n" + ["_storeCfgSave", "storeToggleOpen", "storeToggleKid", "storeSetMode", "storeSetHour",
  "_rwEnsure", "_rwSave", "rwCatSet", "rwCatAdd", "rwCatDel", "rwCatMove", "storeSetThreshold", "storeToggleEdit", "rwCatalog",
  "_storeEditorHTML", "_storeCardHTML", "_cadDows"].map(slice).join("\n");
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x) : "")); } };
function world(o) {
  o = o || {}; const writes = [], els = {};
  const el = id => els[id] || (els[id] = { id, innerHTML: "", value: "", textContent: "", focus() {} });
  const ctx = { console, JSON, Object, Array, String, Number, Math, parseInt, setTimeout: () => {},
    window: {}, document: { getElementById: id => els[id] || null, createElement: () => el("store-pin-wrap"), body: { appendChild() {} } },
    tab: o.tab || "wins", momHere: () => true,   // Mom mode LEFT ON — the Kenzie case
    pinOk: v => v === "1234" || v === "0329", renderAll: () => {}, esc: s => String(s), cap: s => s[0].toUpperCase() + s.slice(1),
    RW_DEFAULT: [{ emoji: "🍬", label: "Candy", cost: 15 }, { emoji: "📺", label: "Control over the TV", cost: 60 }],
    rewardCatalog: [], storeEditOpen: false, storeCfg: { threshold: 100, open: true, mode: "always", hour: 16, closedFor: {} },
    bankBalance: () => 200, storeOpenFor: () => true, storeClosedReason: () => "", _prSectionHTML: () => "", _rwWds: () => [],
    _storeFmtHour: h => h + ":00", gbList: () => [],
    db: { ref: p => ({ set: v => writes.push(["set", p, JSON.parse(JSON.stringify(v))]), update: v => writes.push(["update", p, v]) }) } };
  vm.createContext(ctx);
  vm.runInContext(CODE + "\nObject.defineProperty(this,'_pinOk',{get:()=>storeEditPinOk});", ctx);
  return { ctx, writes, els };
}

console.log("── Mom mode left on, no PIN typed (Kenzie's tablet) ──");
{
  const { ctx: c, writes } = world();
  c.rwCatSet(0, "cost", "1"); c.rwCatSet(0, "label", "$5"); c.rwCatAdd(); c.rwCatDel(0); c.rwCatMove(0, 1);
  c.storeSetThreshold("1"); c.storeToggleOpen(); c.storeToggleKid("taylor"); c.storeSetMode("time"); c.storeSetHour("8");
  ok("no reward or store-setting change is written", writes.length === 0, writes);
  ok("the catalog and settings are untouched", c.rwCatalog()[0].cost === 15 && c.storeCfg.threshold === 100 && c.storeCfg.open === true);
  c.storeToggleEdit();
  ok("✏️ Edit store asks for the PIN instead of opening the editor", c.storeEditOpen === false && /Mom PIN/.test(c.document.getElementById("store-pin-wrap").innerHTML));
  const h = c._storeCardHTML("taylor", true);
  ok("the Mom store shows a 🔒 Change the store button — no settings, no editor", /Change the store \(Mom PIN\)/.test(h) && !/Store settings/.test(h) && !/rwCatSet/.test(h) && !/storeToggleOpen/.test(h));
  ok("…and the shelf is still there to buy from", /storeBuy\('taylor',0\)/.test(h));
}
console.log("\n── wrong PIN ──");
{
  const { ctx: c, writes, els } = world();
  c.storeUnlockEdit(); c.storePinCheck("9999");
  ok("a wrong PIN unlocks nothing and the PIN box stays up", c._pinOk === false && /Mom PIN/.test(els["store-pin-wrap"].innerHTML));
  c.rwCatSet(0, "cost", "1");
  ok("…edits still blocked", writes.length === 0);
}
console.log("\n── Mom types the PIN in the store ──");
{
  const { ctx: c, writes } = world();
  c.storeToggleEdit(); c.storePinCheck("1234");
  ok("the right PIN opens the editor it was asked for", c._pinOk === true && c.storeEditOpen === true);
  const h = c._storeCardHTML("taylor", true);
  ok("settings + editor show once unlocked", /Store settings/.test(h) && /rwCatSet\(0,'cost'/.test(h) && !/Change the store \(Mom PIN\)/.test(h));
  c.rwCatSet(0, "cost", "20"); c.storeSetThreshold("50");
  ok("her price change and threshold are written (targeted paths)", writes.some(w => w[1] === "config/rewards" && w[2][0].cost === 20) && writes.some(w => w[1] === "config/storeCfg" && w[2].threshold === 50), writes);
  c.storeEditLock();   // pop-up closed
  c.rwCatSet(0, "cost", "1");
  ok("closing the pop-up locks it again — the next edit needs the PIN", c.rwCatalog()[0].cost === 20 && c.storeEditOpen === false);
}
{
  const { ctx: c } = world(); c.storeUnlockEdit(); c.storePinCheck("0329");
  ok("the admin code works too (same pinOk as every Mom door)", c._pinOk === true);
}
console.log("\n── Kids' Corner ──");
{
  const { ctx: c, writes } = world({ tab: "kids" });
  ok("Kids' Corner never gets the Mom store, even with Mom mode on", c.storeMomView(true) === false && world().ctx.storeMomView(true) === true && c.storeMomView(false) === false);
  c.storeUnlockEdit();
  ok("no PIN box is offered there", !c.document.getElementById("store-pin-wrap"));
  vm.runInContext("storeEditPinOk=true", c);
  c.rwCatSet(0, "cost", "1");
  ok("…and even a stray unlock can't edit from Kids' Corner", writes.length === 0);
}
console.log("\n── wiring in index.html ──");
ok("the store pop-up passes momView through storeMomView", /_storeCardHTML\(popKid,storeMomView\(momView\)\)/.test(src));
ok("opening and closing a pop-up both re-lock the store", /function popOpen\(kid,view\)\{ if\(typeof storeEditLock==="function"\) storeEditLock\(\);/.test(src) && /function popClose\(\)\{ if\(typeof storeEditLock==="function"\) storeEditLock\(\);/.test(src));
ok("no reward/store write is guarded by momHere() alone any more", !/function (rwCatSet|rwCatAdd|rwCatDel|rwCatMove|_storeCfgSave)\([^)]*\)\{ if\(!momHere\(\)\)/.test(src));

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
