/*
 * Node tests for 📚 Books — Stage A (2026-09-13): the database is the source of truth.
 *   · ✏️ Edit writes ONE targeted update of only the changed fields (never a whole-node set)
 *   · an emptied field is removed (null), a cleared TOC too; untouched fields never appear
 *   · location round-trips through the form for every mode (cube / cart / BOX / TABLE / ONLINE / BASKET / none)
 *   · ➕ New book writes one new record + cover + meta, with a unique slug id
 *   · the Mom PIN gate blocks edit / new / save until unlocked
 *   · ⬇ Export reproduces the JSON shape without the private _lane/_hay fields
 *   · photos: per-book node fetched only when a sheet opens; add = set of that ONE kind
 *
 *   run:  node test_library_edit.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
let pass = 0, fail = 0;
function ok(n, c, x) { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x) + ")" : "")); } }

// ── fake DOM (just enough for the sheet + the list) ──────────────────────────
function el(id) { return { id, innerHTML: "", value: "", files: [], classList: { add() {}, remove() {}, contains() { return false; } }, querySelector() { return null; }, querySelectorAll() { return []; }, style: {}, focus() {}, appendChild() {}, remove() {}, click() {} }; }
const nodes = {};
const document = {
  getElementById(id) { return nodes[id] || (nodes[id] = el(id)); },
  createElement(t) { return el(t); },
  head: { appendChild() {} }, body: { appendChild() {}, classList: { contains() { return false; } } },
  activeElement: null,
};
// ── fake db: records every write with its exact path ─────────────────────────
const writes = [], reads = [];
const db = { ref(p) { return {
  set(v) { writes.push({ op: "set", path: p, val: v }); return Promise.resolve(); },
  update(v) { writes.push({ op: "update", path: p, val: v }); return Promise.resolve(); },
  push(v) { writes.push({ op: "push", path: p, val: v }); return Promise.resolve(); },
  once() { reads.push(p); return Promise.resolve({ val: () => (p.startsWith("library/photos/") ? { toc: ["data:t1", "data:t2"] } : null) }); },
}; } };
const toasts = [];
const ctx = { window: {}, document, db, console, setTimeout, URL: { createObjectURL: () => "blob:x", revokeObjectURL() {} }, Blob: function () {}, Image: function () {},
  gwShowToast: m => toasts.push(m), alert: m => toasts.push("ALERT " + m), APP_PIN: "1234", momPinUnlocked: false };
ctx.window = ctx; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, "library.js"), "utf8"), ctx);
const T = ctx._lbTest;

const BOOKS = [
  { id: "dm-4a", title: "Dimensions Math 4A", publisher: "Singapore", subject: "Math", kid: "ellis", status: "planned", type: "curriculum", consumable: false,
    location: { cart: null, tier: null, kallax: "D5" }, toc: ["Ch 1 Numbers", "Ch 2 Add"], planning: "Ellis after 3B", links: [{ label: "Site", url: "https://x" }] },
  { id: "aas-1", title: "All About Spelling 1", subject: "Spelling", kid: "ellis", status: "in-use", location: { cart: "ellis", tier: 2, kallax: null }, toc: [] },
  { id: "ij-b1", title: "Inference Jones B1", subject: "Reading comprehension", kid: "lucy", status: "shelved", location: { kallax: "A5" } },
];
T.setData(BOOKS.map(b => JSON.parse(JSON.stringify(b))), { "dm-4a": "data:cover" });

console.log("\n# form ⇄ record");
{
  const b = T.books().find(x => x.id === "dm-4a");
  const f = T.lbFormFrom(b);
  ok("form carries the stored values", f.title === "Dimensions Math 4A" && f.toc === "Ch 1 Numbers\nCh 2 Add" && f.links === "Site | https://x" && f.consumable === "no");
  ok("location → form: cube", f.loc.mode === "shelf" && f.loc.cube === "D5");
  const r = T.lbRecordFrom(f);
  ok("untouched form → empty patch", Object.keys(T.lbPatch(b, r)).length === 0, T.lbPatch(b, r));
  f.planning = "  Ellis after 3B, 5×/wk  "; f.toc = "Ch 1 Numbers\n\nCh 2 Add\nCh 3 Sub";
  const p = T.lbPatch(b, T.lbRecordFrom(f));
  ok("only changed keys in the patch", Object.keys(p).sort().join() === "planning,toc", p);
  ok("strings trimmed, TOC blank lines dropped", p.planning === "Ellis after 3B, 5×/wk" && p.toc.length === 3);
  f.notes = ""; f.summary = ""; f.toc = "";
  const p2 = T.lbPatch(b, T.lbRecordFrom(f));
  ok("emptying a field that was never set adds nothing", !("notes" in p2) && !("summary" in p2));
  ok("clearing the TOC writes null (delete), not []", p2.toc === null);
  f.links = "https://only-url";
  ok("a bare url line becomes {label:url,url}", T.lbRecordFrom(f).links[0].label === "https://only-url");
}
console.log("\n# location modes round-trip");
{
  const cases = [
    [{ cart: "lucy", tier: 2, kallax: null }, "cart"], [{ kallax: "B4" }, "shelf"], [{ kallax: "BOX" }, "BOX"],
    [{ kallax: "TABLE", nextCube: "C2" }, "TABLE"], [{ kallax: "ONLINE" }, "ONLINE"], [{ kallax: "BASKET" }, "BASKET"], [{}, "none"]];
  cases.forEach(([loc, mode]) => {
    const f = T.lbLocForm({ location: loc }), back = T.lbLocFrom(f);
    const want = { cart: loc.cart || null, tier: loc.tier == null ? null : loc.tier, kallax: loc.kallax || null };
    if (loc.nextCube) want.nextCube = loc.nextCube;
    ok("mode " + mode + " round-trips", f.mode === mode && JSON.stringify(back) === JSON.stringify(want), [f, back]);
  });
  ok("cube typed lower-case is upper-cased", T.lbLocFrom({ mode: "shelf", cube: " d5 " }).kallax === "D5");
  ok("cart mode with no kid defaults to lincoln", T.lbLocFrom({ mode: "cart", cart: "", tier: "" }).cart === "lincoln");
}
console.log("\n# PIN gate");
{
  writes.length = 0;
  ctx.lbEditStart("dm-4a");
  ok("edit needs the code: no edit state, PIN sheet shown", !T.edit() && /Admin Code/.test(nodes["lb-shbody"].innerHTML));
  ctx.lbNewStart();
  ok("new book needs the code too", !T.newState());
  ctx.lbPinTry("0000"); ok("wrong code stays locked", !T.edit() && !T.newState());
  ctx.lbPinTry("1234"); ok("right code unlocks and re-runs the gated action", !!T.newState());
  ctx.lbNewCancel();
  ok("nothing was written while gated", writes.length === 0, writes);
}
console.log("\n# ✏️ Edit save = one targeted update");
{
  writes.length = 0; toasts.length = 0;
  ctx.lbEditStart("dm-4a");
  ok("edit state opened for the book", T.edit() && T.edit().id === "dm-4a");
  ok("edit sheet renders the form", /✏️ Edit/.test(nodes["lb-shbody"].innerHTML) && /Only the fields you changed/.test(nodes["lb-shbody"].innerHTML));
  ctx.lbEditSet("status", "in-use"); ctx.lbEditSet("loc.mode", "cart"); ctx.lbEditSet("loc.cart", "ellis"); ctx.lbEditSet("loc.tier", "2");
  ctx.lbEditSave();
  const up = writes.filter(w => w.op === "update" && w.path === "library/books/dm-4a");
  ok("exactly one update on library/books/<id>", up.length === 1, writes.map(w => w.op + " " + w.path));
  ok("patch = status + location only", up.length && Object.keys(up[0].val).sort().join() === "location,status", up[0] && up[0].val);
  ok("location written as the whole object", up.length && JSON.stringify(up[0].val.location) === JSON.stringify({ cart: "ellis", tier: 2, kallax: null }));
  ok("no set anywhere (never a whole-node write)", !writes.some(w => w.op === "set"), writes);
  ok("one log line names the keys", writes.some(w => w.op === "push" && w.path === "library/log" && w.val.id === "dm-4a" && w.val.keys.slice().sort().join() === "location,status"));
  ok("meta.updated touched", writes.some(w => w.path === "library/meta" && w.val.updated));
  const b = T.books().find(x => x.id === "dm-4a");
  ok("in-memory record updated + edit state closed", b.status === "in-use" && b.location.cart === "ellis" && !T.edit());
  ok("toast", toasts.some(t => /Saved 2 fields/.test(t)), toasts);
  writes.length = 0;
  ctx.lbEditStart("dm-4a"); ctx.lbEditSave();
  ok("saving with no change writes nothing", writes.length === 0, writes);
  ctx.lbEditStart("dm-4a"); ctx.lbEditSet("title", "   "); ctx.lbEditSave();
  ok("blank title refused, nothing written", writes.length === 0 && T.edit() && toasts.some(t => /title is needed/.test(t)));
  ctx.lbEditCancel(); ok("cancel closes edit without writes", !T.edit() && writes.length === 0);
}
console.log("\n# ➕ New book");
{
  writes.length = 0;
  ok("slug", T.lbSlug("Daily Grams: Grade 4 (eBook)") === "daily-grams-grade-4-ebook");
  ok("unique id when the slug exists", T.lbNewId("Dm 4a") === "dm-4a-2");
  ctx.lbNewStart();
  ok("new form defaults: planned, in the box", T.newState().form.status === "planned" && T.newState().form.loc.mode === "BOX");
  ctx.lbNewSet("title", "Editor in Chief Beginning 1"); ctx.lbNewSet("subject", "Grammar / editing"); ctx.lbNewSet("kid", "ellis"); ctx.lbNewSet("toc", "Lesson 1\nLesson 2");
  T.newState().cover = "data:small"; T.newState().coverBig = "data:big";
  ctx.lbNewSave();
  const set = writes.filter(w => w.op === "set");
  ok("record set at library/books/<new id> only", set.some(w => w.path === "library/books/editor-in-chief-beginning-1"), set.map(w => w.path));
  const rec = (set.find(w => w.path === "library/books/editor-in-chief-beginning-1") || {}).val || {};
  ok("record has no null keys and an added date", !Object.values(rec).some(v => v === null) && /^\d{4}-\d{2}-\d{2}$/.test(rec.added) && rec.toc.length === 2 && rec.location.kallax === "BOX");
  ok("cover → libraryPhotos/<id> (150) + library/photos/<id>/cover (700)", set.some(w => w.path === "libraryPhotos/editor-in-chief-beginning-1" && w.val === "data:small") && set.some(w => w.path === "library/photos/editor-in-chief-beginning-1/cover" && w.val === "data:big"));
  ok("meta count = 4 books", writes.some(w => w.path === "library/meta" && w.val.count === 4 && w.val.covers === 2));
  ok("never touches library/books as a whole", !writes.some(w => w.path === "library/books" || w.path === "libraryPhotos"));
  ok("book in memory, sheet opens on it, search set to it", T.books().some(b => b.id === "editor-in-chief-beginning-1") && T.lbF.q === "Editor in Chief Beginning 1");
  ok("lane derived for the new book", T.books().find(b => b.id === "editor-in-chief-beginning-1")._lane === "WRITING");
}
console.log("\n# ⬇ Export");
{
  const d = T.lbExportData();
  ok("4 books, no private fields, links+scans carried", d.count === 4 && d.books.every(b => !("_lane" in b) && !("_hay" in b)) && "links" in d && "scans" in d && d.version === 2);
  ok("export keeps ids", d.books.some(b => b.id === "dm-4a"));
}
console.log("\n# 📷 photos");
{
  reads.length = 0; writes.length = 0;
  ok("nothing fetched before a sheet opens", reads.length === 0);
  ctx.lbOpen("aas-1");
  ok("opening a sheet fetches library/photos/<id> once", reads.filter(r => r === "library/photos/aas-1").length === 1, reads);
  ctx.lbOpen("aas-1");
  ok("second open does not refetch", reads.filter(r => r === "library/photos/aas-1").length === 1);
  T.setFull("aas-1", { toc: ["data:t1", "data:t2"], extra: ["data:e1"] });
  ok("photo list order: cover, toc…, extra…", T.lbPhotoList("aas-1").map(p => p.kind).join() === "toc,toc,extra");
  ctx.lbOpen("aas-1");
  ok("sheet shows the photo strip with 3 photos", /Photos <span[^>]*>\(3\)/.test(nodes["lb-shbody"].innerHTML));
  ctx.lbPhotoView("aas-1", 2);
  ok("tap opens the big view with prev only", /2 of 3|3 of 3/.test(nodes["lb-shbody"].innerHTML) && /‹ Back/.test(nodes["lb-shbody"].innerHTML));
  ctx.lbViewBack();
  ok("back returns to the sheet", /Table of contents/.test(nodes["lb-shbody"].innerHTML));
  ok("no writes from viewing", writes.length === 0);
}
console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
