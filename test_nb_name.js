// ✏️ The name in a Pre-K notebook, set on the Notebook tab (NBNAME, her ask 2026-11-10: "can we also have the option on
// notebooks for caleb 3d and julian to edit the name, so 3d will be David in his notebook"). Run: node test_nb_name.js
//   • index.html: the NBNAME block; the Mom-only field on the Notebook tab (Pre-K notebooks); Save writes exactly
//     notebookSettings/<kid>/notebookName (clear removes it), ?dryrun=1 inert; the build reads it before the Family record
//   • notebooks.js: a kid's OWN look (no override, or its own name) is byte-for-byte what main printed; another name replaces
//     the old one everywhere — cover, days, trace, footer, guide — in the own look and in a data-driven look
// If a notebook changes ON PURPOSE later, refresh the snapshots: node test_nb_name.js --hashes
const fs = require("fs"), path = require("path"), crypto = require("crypto");
const src = fs.readFileSync(path.join(__dirname, "notebooks.js"), "utf8");
const html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
global.window = {};
eval(src);
const NB = window.HoweNotebooks;
let pass = 0, fail = 0;
function ok(c, name, d) { if (c) { pass++; console.log("  ✓ " + name); } else { fail++; console.log("  ✗ " + name + (d ? "  → " + d : "")); } }
const clone = (o) => JSON.parse(JSON.stringify(o));
const hash = (o) => crypto.createHash("sha256").update(JSON.stringify(o)).digest("hex").slice(0, 16);

// ── fixtures ────────────────────────────────────────────────────────────────────────────────
const dates = { monday: "November 9, 2026", tuesday: "November 10, 2026", wednesday: "November 11, 2026", thursday: "November 12, 2026", friday: "November 13, 2026" };
const base = (extra) => Object.assign({ weekNum: "week30", weekDates: "Nov 9–13, 2026", weekData: { dates, tasks: [] }, masteryItems: [], extraPages: {} }, extra || {});
const mi = (subject, prompts) => prompts.map((p) => ({ subject, prompt: String(p), tier: "daily" }));
const AZ = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const big = [].concat(mi("Letters", AZ), mi("Lowercase", AZ.map((l) => l.toLowerCase())), mi("Numbers", [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]),
  mi("Shapes", ["Circle", "Square", "Triangle"]), mi("Colors", ["Red", "Blue"]), mi("Animals", ["Lion", "Dog"]));
const FIX = {
  empty: base(),
  big: base({ masteryItems: big }),
  jWeek: base({ masteryItems: big, letterCursor: { week: 29, idx: 4, adv: 5, from: 28 } }),   // a week whose letters reach J
  extras: base({ masteryItems: big, extraPages: { abc: { on: true }, daysSeasons: { on: true }, thisMonth: { on: true } }, units: [{ emoji: "🐢", title: "Sea Turtles", learning: [{ name: "Shell" }], days: { tuesday: true } }] })
};
// sha256 (first 16 hex) of JSON.stringify(generate(kid, ctx)) with no name passed — taken from origin/main 3c00664, BEFORE NBNAME.
const BEFORE = {"julian/empty":"8a86b1e0d153f181","julian/big":"d39fada8e323128d","julian/jWeek":"3d4101251bd64c9e","julian/extras":"069037003d6715c3",
  "caleb/empty":"8b37fe802fbd9ed6","caleb/big":"429921b3ea20175a","caleb/jWeek":"5ab6e2f2139b3704","caleb/extras":"6640936f94d04e6c"};
const KIDS = ["julian", "caleb"];
const snap = {};
for (const kid of KIDS) for (const f in FIX) snap[kid + "/" + f] = hash(NB.generate(kid, clone(FIX[f])));
if (process.argv.includes("--hashes")) { console.log(JSON.stringify(snap)); process.exit(0); }

const OWN = { julian: "Julian", caleb: "Caleb" };   // the name each own look was written with (JU_THEME / CB_THEME)
console.log("a kid's own look with no new name = main, byte for byte");
for (const k in BEFORE) ok(snap[k] === BEFORE[k], k + " (no name)", "now " + snap[k]);
ok(Object.keys(BEFORE).length === KIDS.length * Object.keys(FIX).length, "every case has a snapshot");
for (const kid of KIDS) for (const f in FIX) {
  const own = OWN[kid];
  ok(hash(NB.generate(kid, Object.assign(clone(FIX[f]), { kidName: own, nbKidName: own }))) === BEFORE[kid + "/" + f] &&
     hash(NB.generate(kid, Object.assign(clone(FIX[f]), { kidName: " " + own.toLowerCase() + " " }))) === BEFORE[kid + "/" + f], kid + "/" + f + ": the roster's own name (any case) = no change");
}

console.log("another name replaces the old one everywhere");
const all = (o) => o.student + "\n" + o.parent;
for (const kid of KIDS) for (const f of ["big", "jWeek", "extras"]) {
  const out = all(NB.generate(kid, Object.assign(clone(FIX[f]), { kidName: "Sam" })));
  const own = OWN[kid], dot = (s) => s.split("").map((c) => "#" + c).join("");
  const traced = out.indexOf(dot("SAM")) >= 0 || out.indexOf(dot("Sam")) >= 0;
  ok(/Sam's Notebook/.test(out) && /Hi, Sam!/.test(out) && /Sam's Day/.test(out) && /Sam's (Grown-Up|Parent) Guide/.test(out) && traced,
     kid + "/" + f + ": Sam on the cover, the days, the guide, and traced");
  ok(!new RegExp(own, "i").test(out) && out.indexOf(dot(own.toUpperCase())) < 0 && out.indexOf(dot(own)) < 0, kid + "/" + f + ": the old name is gone (text and trace)");
}
const jw = all(NB.generate("julian", Object.assign(clone(FIX.jWeek), { kidName: "Sam" })));
ok(/#S#A#M/.test(jw) && /Jet/.test(jw), "julian: the trace reads SAM; the J card's word is no longer his name (Jet)");
const longNm = NB.generate("julian", Object.assign(clone(FIX.big), { kidName: "Maximilian" })).student;
ok(/font-size:26px[^"]*">#M#A#X#I#M#I#L#I#A#N/.test(longNm), "a long name is traced smaller (pkKidName's size rule)");
const esc = NB.generate("caleb", Object.assign(clone(FIX.big), { kidName: "<b>Al</b>" })).student;
ok(esc.indexOf("<b>Al</b>") < 0 && /&lt;b>Al&lt;\/b>'s Notebook/.test(esc), "a typed name is escaped");
for (const [kid, look] of [["d3", "shark"], ["julian", "shark"], ["d3", "dino"], ["caleb", "construction"]]) {
  const out = all(NB.generate(kid, Object.assign(clone(FIX.big), { notebookTheme: look, kidName: "Sam", nbKidName: kid === "d3" ? "3D" : OWN[kid] })));
  ok(/Sam's Notebook/.test(out) && /Hi, Sam!/.test(out) && /#S#A#M|#S#a#m/.test(out) && !/3D|Julian|Caleb/i.test(out.replace(/<style[\s\S]*?<\/style>/g, "").replace(/<svg[\s\S]*?<\/svg>/g, "")),
     kid + " in the " + look + " look: Sam, and no other name");
}

console.log("the Notebook tab (index.html NBNAME)");
const s0 = html.indexOf("// NBNAME_START"), s1 = html.indexOf("// NBNAME_END");
ok(s0 > 0 && s1 > s0 && html.indexOf("// NBNAME_START", s0 + 1) < 0, "one NBNAME block in index.html");
const blk = html.slice(s0, s1);
const wire = html.slice(html.indexOf("// PREKLEVEL_WIRE_START"), html.indexOf("// PREKLEVEL_WIRE_END"));
const save = blk.slice(blk.indexOf("function nbSaveName("), blk.indexOf("function nbClearName("));
const clear = blk.slice(blk.indexOf("function nbClearName("));
ok((save.match(/\bref\(/g) || []).length === 1 && /db\.ref\("notebookSettings\/"\+kid\+"\/notebookName"\)\.set\(v\)/.test(save), "Save: one ref(), notebookSettings/<kid>/notebookName .set");
ok((clear.match(/\bref\(/g) || []).length === 1 && /db\.ref\("notebookSettings\/"\+kid\+"\/notebookName"\)\.remove\(\)/.test(clear), "Use the family name: one ref(), the same path .remove");
ok((blk.match(/\bref\(/g) || []).length === 2 && !/settings\/family/.test(blk.replace(/^\/\/.*$/gm, "")), "no other write in the block (never settings/family)");
ok(/^function nbSaveName\(kid\)\{ if\(!momHere\(\)\) return;/m.test(blk) && /^function nbClearName\(kid\)\{ if\(!momHere\(\)\) return;/m.test(blk) && (blk.match(/db&&!_dryRun\(\)/g) || []).length === 2, "Mom only, ?dryrun=1 inert");
const writes = [];
function sandbox(opts) {
  const els = {};
  const env = { ROSTER_DEF: opts.roster, notebookSettings: opts.ns, HA_LS: { setItem() {} }, db: { ref: (p) => ({ set: (v) => writes.push(["set", p, v]), remove: () => writes.push(["remove", p]), update: (v) => writes.push(["update", p, v]) }) },
    momHere: () => opts.mom !== false, _dryRun: () => !!opts.dry, isPreK: (k) => k === "d3" || k === "julian", tab: "x", renderNotebook() {}, window: { HoweNotebooks: NB },
    document: { getElementById: (id) => els[id] || null }, cap: (k) => k.charAt(0).toUpperCase() + k.slice(1), esc: (s) => String(s || "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;") };
  const fn = new Function(...Object.keys(env), wire + "\n" + blk + "\nreturn {nbLookOpts,nbNameOf,nbNameCardHtml,nbSaveName,nbClearName};");
  const W = fn(...Object.values(env)); W.els = els; return W;
}
const roster = [{ id: "julian", name: "Julian" }, { id: "d3", name: "3D", notebookTheme: "shark" }, { id: "kid5", name: "Kid", notebookName: "Kiddo" }, { id: "lincoln", name: "Lincoln" }];
const ns = {}, W = sandbox({ roster, ns });
ok(W.nbNameOf("d3") === "3D" && W.nbNameOf("kid5") === "Kiddo" && W.nbNameOf("zz") === "Zz", "prefill = what prints today: the record's notebookName, else its name, else the id name");
const card = W.nbNameCardHtml("d3", W.nbLookOpts("d3"));
ok(/✏️ Name in the notebook/.test(card) && /What the notebook prints and traces\. It changes the next notebook you print\./.test(card) && /id="nbname-d3"/.test(card) && /value="3D"/.test(card) && /nbSaveName\('d3'\)/.test(card) && !/nbClearName/.test(card),
   "the field: label, hint, prefilled, Save (no clear link until a name is saved)");
ok(W.nbNameCardHtml("lincoln", W.nbLookOpts("lincoln")) === "", "not offered for an older kid's notebook");
W.els["nbname-d3"] = { value: "  David " }; writes.length = 0; W.nbSaveName("d3");
ok(JSON.stringify(writes) === '[["set","notebookSettings/d3/notebookName","David"]]' && ns.d3.notebookName === "David", "Save: exactly notebookSettings/<kid>/notebookName, trimmed, local settings in step");
ok(W.nbNameOf("d3") === "David" && /nbClearName\('d3'\)/.test(W.nbNameCardHtml("d3", W.nbLookOpts("d3"))) && /Use the family name/.test(W.nbNameCardHtml("d3", W.nbLookOpts("d3"))), "…the field now shows it, with \"Use the family name\"");
writes.length = 0; W.nbClearName("d3");
ok(JSON.stringify(writes) === '[["remove","notebookSettings/d3/notebookName"]]' && !("notebookName" in ns.d3) && W.nbNameOf("d3") === "3D", "Use the family name: removes that one path, back to the record's name");
W.els["nbname-julian"] = { value: "   " }; ns.julian = { notebookName: "Jules" }; writes.length = 0; W.nbSaveName("julian");
ok(JSON.stringify(writes) === '[["remove","notebookSettings/julian/notebookName"]]', "saving an empty field = use the family name");
const W2 = sandbox({ roster, ns: {}, mom: false }); W2.els["nbname-d3"] = { value: "X" }; writes.length = 0; W2.nbSaveName("d3"); W2.nbClearName("d3");
ok(writes.length === 0 && W2.nbNameCardHtml("d3", W2.nbLookOpts("d3")) === "", "Mom only: no field, no write");
const ns3 = {}, W3 = sandbox({ roster, ns: ns3, dry: true }); W3.els["nbname-d3"] = { value: "David" }; writes.length = 0; W3.nbSaveName("d3");
ok(writes.length === 0 && ns3.d3.notebookName === "David", "?dryrun=1: nothing written to the database");
const rn = html.slice(html.indexOf("function renderNotebook(el){"), html.indexOf("function renderActivities(el){"));
ok(/lvRows:''\)\+\s*nbNameCardHtml\(sel,lookOpts\)\+/.test(rn), "the Notebook tab shows it in the 🎨 look card (Mom only, Pre-K notebooks)");
ok(/kidName:nbNm\(\(\(\(notebookSettings\|\|\{\}\)\[kid\]\)\|\|\{\}\)\.notebookName\)\|\|nbNm\(nbRec\.notebookName\)\|\|nbNm\(nbRec\.name\), notebookTheme:/.test(html) && /nbKidName:cap\(kid\), kidName:/.test(html),
   "the build reads notebookSettings/<kid>/notebookName first, then the record's notebookName, then its name; nbKidName unchanged");

console.log("notebooks.js NBNAME");
const nb0 = src.indexOf("// NBNAME_START"), nb1 = src.indexOf("// NBNAME_END");
ok(nb0 > 0 && nb1 > nb0 && /T = pkOwnName\(T \|\| JU_THEME, ctx\);/.test(src), "one NBNAME block; generatePreK runs the look through pkOwnName");
const code = src.slice(nb0, nb1).replace(/^\s*\/\/.*$/gm, "");
ok(!/julian|caleb|david|3d\b|howe|dewalt/i.test(code), "no child or family name in the new code");

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
