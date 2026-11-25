// 🎨 NB_LOOKPICK — the looks a kid may use (Mom's tick list) + the Kids' Corner look picker (looks plan §13 / step 5; her
// decisions 2026-11-24: "Kid picks from mine" · Pre-K kids too, "Yes, with pictures" · "it would need to be on their kids
// corner"). Run: node test_nb_lookpick.js
//   • nothing ticked → the Notebook tab's look card is the card it was (plus only the tick list) and every notebook build is
//     byte for byte as before — baseline = THIS tree with the NB_LOOKPICK blocks and call sites cut out, built here
//   • 0 / 1 / 2+ ticks → exactly one live control: Mom's pills (0–1) or the kid's Kids' Corner card (2+), never both
//   • the kid's tap: own kid only, ticked look only, 2+ ticked only, one field, dry-run inert; Mom's ticks: Mom only, one field
//   • the card's pictures come from notebooks.js (lookCard) for every look — a made-up look shows up with no app change
const fs = require("fs"), path = require("path");
const html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const nbSrc = fs.readFileSync(path.join(__dirname, "notebooks.js"), "utf8");
let pass = 0, fail = 0;
function ok(c, name, d) { if (c) { pass++; console.log("  ✓ " + name); } else { fail++; console.log("  ✗ " + name + (d ? "  → " + d : "")); } }
const count = (s, sub) => s.split(sub).length - 1;
const loadNB = (code) => { const w = {}; new Function("window", code)(w); return w.HoweNotebooks; };

// ── the blocks and their call sites ─────────────────────────────────────────
console.log("the blocks");
const hS = "// NB_LOOKPICK_START", hE = "// NB_LOOKPICK_END\n";
const hA = html.indexOf(hS), hB = html.indexOf(hE);
ok(hA > 0 && hB > hA && count(html, hS) === 1 && count(html, hE) === 1, "index.html: one NB_LOOKPICK block");
const block = html.slice(hA, hB + hE.length);
const SITES = [
  ["function nbSetLook(kid,key){ if(!momHere()) return; if(typeof nbLookKidPicks===\"function\"&&nbLookKidPicks(kid)) return;   // NB_LOOKPICK: 2+ ticked = the kid picks in Kids' Corner\n",
   "function nbSetLook(kid,key){ if(!momHere()) return;\n"],
  // 🎛 NB_CUSTOM (2026-11-24): the look card's two halves are placed apart — the pills/pick on the Customize card's top line, the ticks in its 🎨 Look dial
  ["      pick:nbLookPickRow(sel,lookOpts,pills,\"top\"),   // NB_LOOKPICK: Mom's pills (0–1 ticked) or the kid's pick (2+)\n", "      pick:pills,\n"],
  ["      ticks:nbLookPickRow(sel,lookOpts,pills,\"ticks\")   // NB_LOOKPICK: \"<name> may choose from:\"\n", "      ticks:\"\"\n"],
  ["        if(typeof nbLookPickKcHtml===\"function\") h+=nbLookPickKcHtml(k);   // NB_LOOKPICK: 🎨 My notebook look (2+ looks ticked by Mom)\n", ""]
];
ok(SITES.every(([now, was]) => count(html, now) === 1 && (was === "" || count(html, was) === 0)), "index.html: four call sites, each once (nbSetLook's guard, the look's two halves, Kids' Corner)");
let htmlBase = html.slice(0, hA) + html.slice(hB + hE.length);
// NB_CUSTOM_COPY (2026-11-24): "Same as another kid…" copies the ticks — Mom's settings, not the build (test_nb_customize_copy.js)
const cA = htmlBase.indexOf("// NB_CUSTOM_COPY_START"), cE = "// NB_CUSTOM_COPY_END\n", cB = htmlBase.indexOf(cE), copyBlk = cA >= 0 ? htmlBase.slice(cA, cB + cE.length) : "";
if (copyBlk) htmlBase = htmlBase.replace(copyBlk, "");
SITES.forEach(([now, was]) => { htmlBase = htmlBase.replace(now, was); });
ok(!/NB_LOOKPICK|nbLookPick|nbLookKid|nbLookAllow|nbLooksAllowed|looksAllowed|lookCard/.test(htmlBase), "with the block and call sites cut out, index.html has no trace of this change");
ok(count(html, "looksAllowed") === count(block, "looksAllowed") + count(copyBlk, "looksAllowed") && count(html, "lookCard") === count(block, "lookCard"), "looksAllowed / lookCard are read only inside the block (and the copy) — the notebook build never sees the ticks");
const nS = "  // NB_LOOKPICK_START", nE = "  // NB_LOOKPICK_END\n", nA = nbSrc.indexOf(nS), nB = nbSrc.indexOf(nE);
const EXPORT = "    lookCard: lookCard,                 // 🎨 NB_LOOKPICK: a look's mascot, picture row and colours (Kids' Corner look picker)\n";
ok(nA > 0 && nB > nA && count(nbSrc, "// NB_LOOKPICK_START") === 1 && count(nbSrc, EXPORT) === 1, "notebooks.js: one NB_LOOKPICK block + one export line");
const nbBaseSrc = (nbSrc.slice(0, nA) + nbSrc.slice(nB + nE.length)).replace(EXPORT, "");
ok(!/NB_LOOKPICK|lookCard/.test(nbBaseSrc), "…cut out, notebooks.js has no trace of it");
ok(html.indexOf("\u{1F500}") < 0, "no 🔀 in index.html");
const kc = html.slice(html.indexOf("function renderKidsCorner(el){"), html.indexOf("// WISHES_START"));
ok(/h\+=kcModeBodyHTML\(k\);[^\n]*\n\s*if\(typeof nbLookPickKcHtml==="function"\) h\+=nbLookPickKcHtml\(k\);/.test(kc), "Kids' Corner: the card sits under the page body, in renderKidsCorner only (not the General tablet's My Day)");

// ── notebooks.js: lookCard + byte-for-byte builds ────────────────────────────
console.log("notebooks.js: the look's own picture card; builds unchanged");
const NB = loadNB(nbSrc), NB0 = loadNB(nbBaseSrc);
const KEYS = Object.keys(NB.themes);
ok(KEYS.length >= 3 && KEYS.every(k => { const c = NB.lookCard(k); return c && c.key === k && c.emoji && (c.row.length >= 3 || c.row.length === 0) && c.colors.length === 3 && c.colors.every(x => /^#[0-9a-fA-F]{3,8}$/.test(x)) && c.label === NB.themes[k].chip; }),
  "every look in NB_THEMES has a card: mascot, picture row (none for a look without one, like Plain), three colours, its picker name (" + KEYS.length + " looks)");
ok(KEYS.every(k => { const c = NB.lookCard(k), T = NB.themes[k].theme({}, {}); return c.emoji === T.emoji && c.row.join(" ") === T.coverRow; }), "…taken from the look's own pieces (its emoji and cover row)");
ok([undefined, null, "", "nope", "toString", "__proto__", "constructor"].every(k => NB.lookCard(k) === null), "a key that isn't a look → null");
ok(KEYS.every(k => !/Little |Notebook|'s /.test(JSON.stringify(NB.lookCard(k)))), "no child's name (nor the stand-in name) in a card");
const dates = { monday: "November 9, 2026", tuesday: "November 10, 2026", wednesday: "November 11, 2026", thursday: "November 12, 2026", friday: "November 13, 2026" };
const ctx = (extra) => Object.assign({ weekNum: "week30", weekDates: "Nov 9–13, 2026", weekData: { dates, tasks: [] }, masteryItems: [], extraPages: {}, kidName: "Ari" }, extra || {});
let same = 0, total = 0;
[undefined].concat(KEYS).forEach(look => [{}, { nbLowercase: true, nbFindIt: true }].forEach(lv => {
  const c = ctx({ notebookTheme: look, nbLevel: lv }), a = NB.generate("kidx", c), b = NB0.generate("kidx", c);
  total++; if (a.student === b.student && a.parent === b.parent) same++;
}));
ok(same === total && total > 4, "every notebook build is byte for byte the same as the tree without the block (" + same + "/" + total + " builds)");

// ── the app side, in a sandbox ───────────────────────────────────────────────
const wireOf = (h) => h.slice(h.indexOf("// PREKLEVEL_WIRE_START"), h.indexOf("// PREKLEVEL_WIRE_END"));
const segOf = (h) => { const r = h.slice(h.indexOf("function renderNotebook(el){")); return r.slice(r.indexOf("  // 🎨 Look + level (PREKLEVEL_WIRE)"), r.indexOf("  // Week switcher")); };
const NAMES = { kida: "Ari", kidb: "Bo", kidc: "Cy" };
function sandbox(src, o) {
  const log = { writes: [], ls: [], renders: 0, loads: 0 };
  const env = {
    ROSTER_DEF: [{ id: "kida", name: "Ari" }, { id: "kidb", name: "Bo" }, { id: "kidc", name: "Cy" }], notebookSettings: o.ns,
    HA_LS: { setItem: (k) => log.ls.push(k) }, _dryRun: () => !!o.dry, momHere: () => !!o.mom, isPreK: (k) => k === "kida" || k === "kidb",
    db: { ref: (p) => ({ set: (v) => log.writes.push([p, v]), remove: () => log.writes.push([p, "REMOVE"]), update: (v) => log.writes.push([p, "UPDATE", v]) }) },
    tab: o.tab || "kids", renderNotebook() { log.renders++; }, renderAll() { log.renders++; }, document: { getElementById: () => null },
    window: o.noNB ? {} : { HoweNotebooks: o.NB || NB }, esc: (s) => String(s || "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;"),
    cap: (k) => NAMES[k] || k, KID_COLOR: { kida: "#2563eb", kidb: "#db2777" }, _kcTint: () => "#eef2ff", kcCalGet: () => o.mode || "today",
    nbNameCardHtml: () => "<!--name card-->", haLoadNotebooksLib: () => { log.loads++; return { then: () => ({ catch() {} }) }; }
  };
  const lp = src.indexOf(hS) >= 0 ? src.slice(src.indexOf(hS), src.indexOf(hE) + hE.length) : "";
  const body = "let kcKid=" + JSON.stringify(o.kcKid === undefined ? null : o.kcKid) + "; function _kcLoadKid(){}\n" + wireOf(src) + "\n" + lp +
    "\nfunction lookCardHtml(sel){ const lookOpts=nbLookOpts(sel);\n" + segOf(src) + "\nreturn lookParts?lookParts.pick+lookParts.ticks:\"\"; }\n" +
    "return {log:null, nbSetLook, nbThemeOf, lookCardHtml" + (lp ? ", nbLookAllow, nbLookKidSet, nbLookPickKcHtml, nbLooksAllowed, nbLookKidPicks" : "") + "};";
  const W = new Function(...Object.keys(env), body)(...Object.values(env));
  W.log = log; return W;
}
const NOW = (o) => sandbox(html, o), BASE = (o) => sandbox(htmlBase, o);
const ns = (theme, ticks) => ({ kida: Object.assign({ notebookTheme: theme }, ticks ? { looksAllowed: ticks } : {}) });
const T = (...ks) => Object.fromEntries(ks.map(k => [k, true]));
const stripTicks = (h) => { const a = h.indexOf('<div id="nblookpick-ticks"'), end = "None or one ticked = you pick, as now.</div></div>", b = h.indexOf(end, a); return a < 0 ? h : h.slice(0, a) + h.slice(b + end.length); };
const pills = (h) => count(h, "nbSetLook('kida','");
const kcBtns = (h) => count(h, "nbLookKidSet('kida','");
const [L1, L2, L3] = KEYS.slice(-3);   // three looks, named only through the table
const chip = (k) => NB.themes[k].chip;

console.log("nothing ticked = today");
let a = NOW({ mom: true, ns: ns(L1) }), b = BASE({ mom: true, ns: ns(L1) });
const cardNow = a.lookCardHtml("kida"), cardBase = b.lookCardHtml("kida");
ok(cardBase.length > 200 && stripTicks(cardNow) === cardBase, "Mom's look card is the card it was, byte for byte — plus only the tick list");
ok(cardNow.indexOf('id="nblookpick-ticks"') > 0 && pills(cardNow) === pills(cardBase) && pills(cardNow) === KEYS.length + 1 && cardNow.indexOf("nblookpick-chose") < 0, "…her picker is live (every look's pill, Starter too); no read-only line");
ok(KEYS.every(k => cardNow.indexOf("nbLookAllow('kida','" + k + "')") > 0) && count(cardNow, "nbLookAllow(") === KEYS.length && cardNow.indexOf("nbLookAllow('kida','')") < 0, "the tick list: one tick per look the notebook offers (none for Starter, which has no pictures)");
ok(cardNow.indexOf("Ari may choose from:") > 0 && cardNow.indexOf("2 or more ticked = Ari picks in Kids’ Corner; you’ll see the pick here.") > 0, "…named from the roster, with the line saying what the ticks do");
ok(count(cardNow, 'aria-pressed="true"') === 0, "…nothing ticked");
["kidc"].forEach(k => { const x = NOW({ mom: true, ns: {} }).lookCardHtml(k), y = BASE({ mom: true, ns: {} }).lookCardHtml(k); ok(x === y && x.indexOf("nblookpick") < 0 && x.length > 100, "a notebook with one look (starter only): the card is byte for byte the old one, no tick list"); });
ok(NOW({ mom: false, ns: ns(L1) }).lookCardHtml("kida") === "" && BASE({ mom: false, ns: ns(L1) }).lookCardHtml("kida") === "", "not Mom: no card at all, as before (Dad's link and a kid's device included)");
ok(NOW({ kcKid: "kida", ns: ns(L1) }).nbLookPickKcHtml("kida") === "", "Kids' Corner: nothing new");

console.log("one tick = today");
a = NOW({ mom: true, ns: ns(L1, T(L2)) });
let h = a.lookCardHtml("kida");
ok(pills(h) === KEYS.length + 1 && h.indexOf("nblookpick-chose") < 0 && count(h, 'aria-pressed="true"') === 1, "Mom's picker is live; one tick shows ticked");
a.nbSetLook("kida", L3); ok(a.nbThemeOf("kida") === L3 && a.log.writes.length === 1, "…and her pick still saves");
ok(NOW({ kcKid: "kida", ns: ns(L1, T(L2)) }).nbLookPickKcHtml("kida") === "", "Kids' Corner: nothing new");
ok(NOW({ kcKid: "kida", ns: ns(L1, { [L2]: true, [L3]: false, ghost: true }) }).nbLookPickKcHtml("kida") === "", "a false tick or a tick for a look the notebook doesn't offer doesn't count");

console.log("two or more ticked = the kid picks");
let nsx = ns(L1, T(L1, L2));
a = NOW({ mom: true, ns: nsx }); h = a.lookCardHtml("kida");
ok(pills(h) === 0 && h.indexOf("Ari chose " + chip(L1)) > 0 && h.indexOf("the next notebook will be " + chip(L1)) > 0, "Mom's card: no pills — a read-only line “Ari chose " + chip(L1) + "”");
a.nbSetLook("kida", L3); ok(a.log.writes.length === 0 && nsx.kida.notebookTheme === L1, "…and nbSetLook refuses while the kid picks");
let k1 = NOW({ kcKid: "kida", ns: nsx }).nbLookPickKcHtml("kida");
ok(kcBtns(k1) === 2 && k1.indexOf("\u{1F3A8} My notebook look") > 0 && count(k1, 'aria-pressed="true"') === 1 && k1.indexOf("nbLookKidSet('kida','" + L1 + "')\" aria-pressed=\"true\"") > 0, "Kids' Corner: one big button per ticked look, the one on is marked");
ok(k1.indexOf("Your next notebook will be " + chip(L1) + ".") > 0, "…“Your next notebook will be " + chip(L1) + ".”");
[L1, L2].forEach(k => { const c = NB.lookCard(k); ok(k1.indexOf(c.emoji) > 0 && (!c.row.length || k1.indexOf(c.row.join(" ")) > 0) && c.colors.every(x => k1.indexOf("background:" + x) > 0), "…" + c.label + ": its mascot, picture row and colour swatch"); });
ok(/min-height:120px/.test(k1) && /min-width:120px/.test(k1) && /flex-wrap:wrap/.test(k1) && /flex:1 1 130px/.test(k1) && /max-width:640px/.test(k1), "big buttons (≥120px, well over 44×44), wrapping at phone width");
ok(/min-height:44px/.test(h), "Mom's ticks are 44px tall");
// the look that is on is not ticked: it keeps printing until the kid picks
nsx = ns(L1, T(L2, L3)); a = NOW({ mom: true, ns: nsx }); h = a.lookCardHtml("kida");
ok(pills(h) === 0 && h.indexOf("Ari hasn’t picked yet.") > 0 && h.indexOf("stays " + chip(L1)) > 0 && nsx.kida.notebookTheme === L1, "on but not ticked: Mom sees it stays " + chip(L1) + " until Ari picks — nothing changed it");
k1 = NOW({ kcKid: "kida", ns: nsx }).nbLookPickKcHtml("kida");
ok(kcBtns(k1) === 2 && count(k1, 'aria-pressed="true"') === 0 && k1.indexOf("Tap a picture to pick your next notebook.") > 0, "…the Kids' Corner card shows no button selected");
// unticking down to one brings her picker back with the current look selected
a.nbLookAllow("kida", L3); h = a.lookCardHtml("kida");
ok(pills(h) === KEYS.length + 1 && h.indexOf("nblookpick-chose") < 0 && nsx.kida.notebookTheme === L1 && /nbSetLook\('kida','[^']+'\)" title="This look is on"/.test(h) && h.indexOf("nbSetLook('kida','" + L1 + "')\" title=\"This look is on\"") > 0, "untick down to one → Mom's picker is back, " + chip(L1) + " selected");
ok(NOW({ kcKid: "kida", ns: nsx }).nbLookPickKcHtml("kida") === "", "…and the Kids' Corner card is gone");

console.log("exactly one live control, every case");
[[], [L2], [L1, L2], [L1, L2, L3], KEYS].forEach(ticks => {
  const n = ns(L1, T(...ticks)), m = NOW({ mom: true, ns: n }).lookCardHtml("kida"), c = NOW({ kcKid: "kida", ns: n }).nbLookPickKcHtml("kida");
  const live = (pills(m) > 0 ? 1 : 0) + (kcBtns(c) > 0 ? 1 : 0);
  ok(live === 1 && (ticks.length >= 2 ? kcBtns(c) === ticks.length : pills(m) > 0), ticks.length + " ticked → " + (ticks.length >= 2 ? "the kid's card (" + ticks.length + " buttons)" : "Mom's picker") + ", never both");
});

console.log("the kid's tap: three checks, one field");
const kidSet = (o, kid, key) => { const W = NOW(o); const r = W.nbLookKidSet(kid, key); return { r, W }; };
nsx = ns(L1, T(L1, L2));
let r = kidSet({ kcKid: "kida", ns: nsx }, "kida", L2);
ok(r.r === true && JSON.stringify(r.W.log.writes) === JSON.stringify([["notebookSettings/kida/notebookTheme", L2]]) && nsx.kida.notebookTheme === L2 && r.W.log.ls.join() === "ha_nb_settings", "own Corner + ticked look + 2 ticked → one write, notebookSettings/<kid>/notebookTheme, mirrored to the local cache");
ok(Object.keys(nsx.kida).sort().join() === "looksAllowed,notebookTheme" && Object.keys(nsx.kida.looksAllowed).length === 2, "…nothing else touched");
r = kidSet({ kcKid: "kida", ns: nsx, mom: false }, "kida", L1); ok(r.r && nsx.kida.notebookTheme === L1, "works with Mom mode off (it's the kid's own tap)");
r = kidSet({ kcKid: "kidb", ns: nsx }, "kida", L2); ok(!r.r && r.W.log.writes.length === 0 && nsx.kida.notebookTheme === L1, "another kid's Corner → refused");
r = kidSet({ kcKid: null, ns: nsx }, "kida", L2); ok(!r.r && r.W.log.writes.length === 0, "no kid picked on this device → refused");
r = kidSet({ kcKid: "kida", ns: nsx }, "kida", L3); ok(!r.r && r.W.log.writes.length === 0 && nsx.kida.notebookTheme === L1, "a look Mom didn't tick → refused");
[undefined, null, "", "nope", "__proto__", "x'y", 7].forEach(v => { r = kidSet({ kcKid: "kida", ns: nsx }, "kida", v); ok(!r.r && r.W.log.writes.length === 0 && nsx.kida.notebookTheme === L1, "any other value (" + String(v) + ") → refused"); });
const ns1 = ns(L1, T(L2)); r = kidSet({ kcKid: "kida", ns: ns1 }, "kida", L2); ok(!r.r && r.W.log.writes.length === 0 && ns1.kida.notebookTheme === L1, "only one look ticked → refused");
const nsd = ns(L1, T(L1, L2)); r = kidSet({ kcKid: "kida", ns: nsd, dry: true }, "kida", L2); ok(r.r && r.W.log.writes.length === 0 && nsd.kida.notebookTheme === L2, "?dryrun=1: nothing written to the database (this device's copy only)");
r = kidSet({ kcKid: "kida", ns: nsx, noNB: true }, "kida", L2); ok(!r.r && r.W.log.writes.length === 0, "notebook code not loaded → refused (it can't check the look)");
ok(!/nbSetLook\(|momHere\(\)\)|adminPinUnlocked/.test(block.slice(block.indexOf("function nbLookKidSet"), block.indexOf("function nbLookPickRow"))), "a separate function — it never calls nbSetLook and never loosens Mom's gate");

console.log("Mom's ticks: Mom only, one field each");
let nsm = ns(L1); a = NOW({ mom: true, ns: nsm, tab: "notebook" });
ok(a.nbLookAllow("kida", L2) === true && JSON.stringify(a.log.writes) === JSON.stringify([["notebookSettings/kida/looksAllowed/" + L2, true]]) && nsm.kida.looksAllowed[L2] === true, "tick → one write, notebookSettings/<kid>/looksAllowed/<look> = true");
a.log.writes.length = 0; a.nbLookAllow("kida", L2);
ok(JSON.stringify(a.log.writes) === JSON.stringify([["notebookSettings/kida/looksAllowed/" + L2, "REMOVE"]]) && !(L2 in nsm.kida.looksAllowed), "untick → that one field removed");
ok(nsm.kida.notebookTheme === L1, "ticking never changes the look itself");
a = NOW({ mom: false, ns: nsm }); ok(a.nbLookAllow("kida", L2) === false && a.log.writes.length === 0 && !(L2 in nsm.kida.looksAllowed), "not Mom → refused");
a = NOW({ mom: true, ns: nsm }); ok(["", "nope", "__proto__", undefined].every(v => a.nbLookAllow("kida", v) === false) && a.log.writes.length === 0, "a look the notebook doesn't offer → refused");
ok(NOW({ mom: true, ns: {} }).nbLookAllow("kidc", L2) === false, "a notebook with no looks to choose from → refused");
a = NOW({ mom: true, ns: nsm, dry: true }); ok(a.nbLookAllow("kida", L3) === true && a.log.writes.length === 0 && nsm.kida.looksAllowed[L3] === true, "?dryrun=1: nothing written to the database");

console.log("the Kids' Corner card: only this kid, only 2+ ticked");
nsx = ns(L1, T(L1, L2));
ok(NOW({ kcKid: "kidb", ns: nsx }).nbLookPickKcHtml("kida") === "", "not on another kid's Corner");
ok(NOW({ kcKid: "kidb", ns: nsx }).nbLookPickKcHtml("kidb") === "", "not for a kid with nothing ticked");
ok(NOW({ kcKid: null, ns: nsx }).nbLookPickKcHtml("kida") === "", "not on the who's-here page");
ok(["drills", "games", "card"].every(m => NOW({ kcKid: "kida", ns: nsx, mode: m }).nbLookPickKcHtml("kida") === "") && ["today", "lists", "month"].every(m => NOW({ kcKid: "kida", ns: nsx, mode: m }).nbLookPickKcHtml("kida") !== ""), "not over a drill, a game or a school card; on Today, My Lists and Month");
let W = NOW({ kcKid: "kida", ns: nsx, noNB: true });
ok(W.nbLookPickKcHtml("kida") === "" && W.nbLookPickKcHtml("kida") === "" && W.log.loads === 1, "notebook code not loaded yet: nothing drawn, it loads once (then the Corner redraws)");
W = NOW({ kcKid: "kida", ns: ns(L1, T(L2)), noNB: true }); W.nbLookPickKcHtml("kida"); ok(W.log.loads === 0, "…and with 0–1 ticked nothing loads at all");

console.log("a made-up look appears with no app change");
const NBz = loadNB(nbSrc);
NBz.themes.zz_test = { label: "Test look", chip: "🦓 <Zebras>", theme: () => ({ emoji: "🦓", coverRow: "🦓 🌾 🌳", xpColors: ["#111111", "#eeeeee", "#333333", "red;x:1"] }) };
ok(JSON.stringify(NBz.lookCard("zz_test")) === JSON.stringify({ key: "zz_test", emoji: "🦓", row: ["🦓", "🌾", "🌳"], colors: ["#111111", "#eeeeee", "#333333"], label: "🦓 <Zebras>" }), "lookCard reads it from the table (a colour that isn't a colour is dropped)");
nsx = ns(L1, T("zz_test", L2));
h = NOW({ mom: true, ns: nsx, NB: NBz }).lookCardHtml("kida");
ok(h.indexOf("nbLookAllow('kida','zz_test')") > 0 && h.indexOf("🦓 &lt;Zebras&gt;") > 0 && h.indexOf("<Zebras>") < 0, "Mom's tick list has it (escaped)");
k1 = NOW({ kcKid: "kida", ns: nsx, NB: NBz }).nbLookPickKcHtml("kida");
ok(k1.indexOf("nbLookKidSet('kida','zz_test')") > 0 && k1.indexOf("🦓 🌾 🌳") > 0 && k1.indexOf("background:#111111") > 0 && k1.indexOf("red;x:1") < 0 && k1.indexOf("<Zebras>") < 0, "the Kids' Corner card shows it — mascot, pictures, swatch");
r = kidSet({ kcKid: "kida", ns: nsx, NB: NBz }, "kida", "zz_test"); ok(r.r && nsx.kida.notebookTheme === "zz_test", "…and the kid can pick it");
ok(!KEYS.concat(["zz_test"]).some(k => new RegExp("[\"'`]" + k + "[\"'`]").test(block)) && !KEYS.some(k => block.indexOf(NB.themes[k].chip) >= 0 || block.indexOf(NB.lookCard(k).emoji) >= 0), "no look key, name or mascot is typed in the index.html block");
ok(!/\b(he|his|she|her|him)\b/i.test(block.replace(/^\s*\/\/.*$/gm, "")), "no he/his/she/her for the child in the UI text");

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
