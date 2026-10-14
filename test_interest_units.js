// 🚜🐱 Interest units for the DeWalt kids (INTEREST_UNITS inside STARTER_UNITS, Andrew's ask 2026-10-14):
// Construction Machines (Caleb) + Cats: House & Wild (Taylor). Slices the real block out of index.html and
// checks: both units are in the starter list (Mom-only ＋ Add), they are plain-enroll notebook units (no stages,
// notebook pages ON), every card is a legal Firebase key with a fact on its back, groups come in order, the
// new Tilcayo tiger cat is the last cat card, and a kid enrolling gets introCap cards learning + the rest in
// the bank — targeted writes only, none in dry run. Run: node test_interest_units.js
const fs = require("fs"), path = require("path");
const src = fs.readFileSync(process.env.UNITS_SRC || path.join(__dirname, "index.html"), "utf8");
let pass = 0, fail = 0;
function ok(name, cond, d) { if (cond) { pass++; console.log("  ok  - " + name); } else { fail++; console.log("  FAIL- " + name + (d ? "  → " + d : "")); } }
function extract(startPat) {
  const i = src.indexOf("\n" + startPat); if (i < 0) throw new Error("not found: " + startPat);
  let depth = 0, inS = null, seen = false, k = i + 1;
  for (; k < src.length; k++) { const c = src[k], p = src[k - 1];
    if (inS) { if (c === inS && p !== "\\") inS = null; continue; }
    if (c === '"' || c === "'" || c === "`") { inS = c; continue; }
    if (c === "/" && src[k + 1] === "/") { k = src.indexOf("\n", k) - 1; continue; }
    if (c === "/" && /[=(,:!&|?{};]\s*$/.test(src.slice(Math.max(0, k - 3), k))) {
      let q = k + 1, cls = false; for (; q < src.length; q++) { const d = src[q];
        if (d === "\\") { q++; continue; } if (d === "[") cls = true; else if (d === "]") cls = false; else if (d === "/" && !cls) break; }
      k = q; continue; }
    if (c === "{" || c === "[" || c === "(") { depth++; seen = true; } else if (c === "}" || c === "]" || c === ")") depth--;
    else if (c === "\n" && depth === 0 && seen) break; }
  return src.slice(i + 1, k + 1);
}

const a = src.indexOf("// STARTER_UNITS_START"), b = src.indexOf("// STARTER_UNITS_END");
const ia = src.indexOf("// INTEREST_UNITS_START"), ib = src.indexOf("// INTEREST_UNITS_END");
ok("INTEREST_UNITS block once, inside STARTER_UNITS, before the registry", ia > a && ib > ia && ib < src.indexOf("const STARTER_UNITS={") && src.indexOf("// INTEREST_UNITS_START", ia + 1) < 0);
const block = src.slice(a, b);

function load(env) {
  env = env || {};
  const G = { unitStudies: env.unitStudies || {}, mom: env.mom !== false, dry: !!env.dry, writes: [], content: { innerHTML: "" },
    masteryData: env.mastery || {} };
  const db = env.db === false ? null : { ref(p) { return { update(v) { G.writes.push(["update", p, v]); }, set(v) { G.writes.push(["set", p, v]); },
    transaction(fn) { const r = fn(null); if (r !== undefined) G.writes.push(["txn", p, r]); return Promise.resolve({ committed: r !== undefined }); } }; } };
  const fn = new Function("G", "db", `
    let unitStudies=G.unitStudies; const masteryData=G.masteryData; const HA_LS={ setItem(){} };
    function momHere(){ return G.mom; } function _dryRun(){ return G.dry; } function cap(s){ return s[0].toUpperCase()+s.slice(1); }
    function renderUnits(){} function mastDefKeyOk(n){ return !/[.$#\\[\\]\\/]/.test(n); } function mastGateChapter(){ return null; }
    const document={ getElementById:()=>G.content };
    ${block}
    ${extract("function unitEnroll(")}
    return { STARTER_UNITS, _starterUnitsHtml, starterUnitAdd, _unitStagedEnrollPending, unitEnroll, get us(){ return unitStudies; } };`);
  const api = fn(G, db); api.G = G; return api;
}
const api = load();
const cm = api.STARTER_UNITS.construction_machines(), ct = api.STARTER_UNITS.cats_house_and_wild();
const legal = u => u.decks.every(d => d.cards.every(c => !/[.$#\[\]\/]/.test(c.name)));
const facts = u => u.decks.every(d => d.cards.every(c => typeof c.def === "string" && c.def.length >= 20 && c.def.length <= 240));
const ordered = u => u.decks.every(d => d.cards.every((c, i) => c.order === i + 1));
const unique = u => u.decks.every(d => new Set(d.cards.map(c => c.name)).size === d.cards.length);
const groups = (u, d, f) => [...new Set(u.decks.find(x => x.key === d).cards.map(c => c[f]))];

console.log("# shape (both units)");
for (const u of [cm, ct]) {
  ok(u.id + ": plain-enroll notebook unit (no stages, nbInsert on, title/emoji/desc)", !u.stages && !api._unitStagedEnrollPending(u) && u.nbInsert !== false && u.title && u.emoji && u.desc && u.starter === u.id && u.starterVer === 1);
  ok(u.id + ": two flip decks — a grouped picture deck first, a words deck second", u.decks.length === 2 && u.decks[0].groupBy && !u.decks[1].groupBy && u.decks.every(d => d.mode === "flip" && d.introCap >= 2));
  ok(u.id + ": every card has a legal Firebase key and a fact on its back (20–240 chars)", legal(u) && facts(u));
  ok(u.id + ": names unique per deck, order runs 1..n", unique(u) && ordered(u));
  ok(u.id + ": every grouped card has its group; a words card has none", u.decks[0].cards.every(c => c[u.decks[0].groupBy]) && u.decks[1].cards.every(c => !c[u.decks[0].groupBy]));
  ok(u.id + ": three claimable projects with keys, kinds the notebook knows, and points", u.activities.length === 3 && u.activities.every(x => x.key && x.title && x.desc && ["sheet", "bio", "compare"].indexOf(x.kind) >= 0 && x.points > 0) && new Set(u.activities.map(x => x.key)).size === 3);
  ok(u.id + ": every emoji visual points at a real card", Object.keys(u.visuals).every(k => u.decks.some(d => k.indexOf(d.key + "_") === 0 && d.cards.some(c => d.key + "_" + c.name === k)) && typeof u.visuals[k] === "string"));
  ok(u.id + ": fresh object per call", api.STARTER_UNITS[u.id]() !== u);
  ok(u.id + ": no 🔀 anywhere", !/\u{1F500}/u.test(JSON.stringify(u)));
}

console.log("# 🚜 Construction Machines (Caleb)");
ok("decks: Construction Machines (by job) + Machine Parts", cm.decks[0].key === "Construction Machines" && cm.decks[0].groupBy === "job" && cm.decks[1].key === "Machine Parts");
ok("jobs in order: Diggers · Pushers & smoothers · Lifters · Haulers · Road makers", JSON.stringify(groups(cm, "Construction Machines", "job")) === JSON.stringify(["Diggers", "Pushers & smoothers", "Lifters", "Haulers", "Road makers"]));
ok("19 machines, 10 parts; excavator first, dump truck a hauler", cm.decks[0].cards.length === 19 && cm.decks[1].cards.length === 10 && cm.decks[0].cards[0].name === "Excavator" && cm.decks[0].cards.find(c => c.name === "Dump truck").job === "Haulers");
ok("kindergarten backs: short sentences, no word over 12 letters", cm.decks[0].cards.every(c => c.def.split(/[.!?]/).filter(Boolean).every(s => s.trim().split(/\s+/).length <= 22) && c.def.split(/\s+/).every(w => w.replace(/[^a-z]/gi, "").length <= 12)));
ok("2 at a time (introCap 2 on both decks)", cm.decks.every(d => d.introCap === 2));
ok("projects: draw · build (with steps) · count the wheels, 5 pts each", cm.activities.map(x => x.key).join() === "draw_machine,build_it,count_wheels" && cm.activities[1].steps.length === 4 && cm.activities.every(x => x.points === 5 && x.kind === "sheet"));

console.log("# 🐱 Cats: House & Wild (Taylor)");
ok("decks: Cats (by group) + Cat Words", ct.decks[0].key === "Cats" && ct.decks[0].groupBy === "group" && ct.decks[1].key === "Cat Words");
ok("groups: 3 house-cat groups then 3 wild-cat groups, in order", JSON.stringify(groups(ct, "Cats", "group")) === JSON.stringify(["House cats · Longhair", "House cats · Shorthair", "House cats · Unusual coats", "Wild cats · Big cats", "Wild cats · Africa, Europe & Asia", "Wild cats · The Americas"]));
const cats = ct.decks[0].cards;
ok("21 house cats + 27 wild cats = 48; 10 words", cats.filter(c => /^House/.test(c.group)).length === 21 && cats.filter(c => /^Wild/.test(c.group)).length === 27 && cats.length === 48 && ct.decks[1].cards.length === 10);
const last = cats[cats.length - 1];
ok("the Tilcayo tiger cat (Bolivia, named Sept 2026) is the LAST card, in the Americas group", last.name === "Tilcayo tiger cat" && last.group === "Wild cats · The Americas" && /Bolivia/.test(last.def) && /2026/.test(last.def) && /100 years/.test(last.def));
ok("classic breeds + the famous wild cats are all there", ["Maine Coon", "Siamese", "Persian", "Ragdoll", "Bengal", "Sphynx", "Lion", "Tiger", "Cheetah", "Snow leopard", "Ocelot", "Bobcat"].every(n => cats.some(c => c.name === n)));
ok("backs name a home or a trait (every wild cat says where it lives)", cats.filter(c => /^Wild/.test(c.group)).every(c => /Africa|Asia|America|Europe|India|Canada|Mexico|Spain|Bolivia|Andes|Argentina|Texas|Sri Lanka|desert|steppe|wetland|forest|savanna/i.test(c.def)));
ok("3 at a time on Cats, 2 on Cat Words", ct.decks[0].introCap === 3 && ct.decks[1].introCap === 2);
ok("projects: bio report (10) · house-vs-wild compare (10) · design a coat sheet (5)", ct.activities.map(x => x.kind + ":" + x.points).join() === "bio:10,compare:10,sheet:5");

console.log("# 📚 starter list + Add + enroll");
let h = api._starterUnitsHtml();
ok("Mom sees both with an Add button and the card count", /starterUnitAdd\('construction_machines'\)/.test(h) && /starterUnitAdd\('cats_house_and_wild'\)/.test(h) && /Construction Machines/.test(h) && /Cats: House &amp; Wild/.test(h) && /29 cards/.test(h) && /58 cards/.test(h));
ok("no stage line for these (not staged)", !/1\. Diggers/.test(h));
ok("kid view: nothing", load({ mom: false })._starterUnitsHtml() === "");
ok("hidden once the family has them", (() => { const t = load({ unitStudies: { construction_machines: { id: "construction_machines" }, cats_house_and_wild: { id: "cats_house_and_wild" } } })._starterUnitsHtml(); return !/construction_machines|cats_house_and_wild/.test(t); })());
{ const t = load(); t.starterUnitAdd("construction_machines");
  ok("Add → ONE create-only transaction on unitStudies/construction_machines", t.G.writes.length === 1 && t.G.writes[0][0] === "txn" && t.G.writes[0][1] === "unitStudies/construction_machines" && t.G.writes[0][2].id === "construction_machines" && t.G.writes[0][2].addedTs > 0); }
{ const t = load({ dry: true }); t.starterUnitAdd("cats_house_and_wild");
  ok("dry run: added in memory, nothing written", t.us.cats_house_and_wild && t.G.writes.length === 0); }
// Caleb enrolls in Construction Machines (plain unitEnroll — no stage form)
{ const t = load({ unitStudies: { construction_machines: api.STARTER_UNITS.construction_machines() } });
  t.unitEnroll("construction_machines", "caleb");
  const items = t.G.masteryData.caleb, bank = t.G.masteryData.caleb_custom_items, st = t.G.masteryData.caleb_settings;
  ok("Caleb: 2 machines + 2 parts start learning (introCap), all 29 in his bank", items.length === 4 && items.every(i => i.status === "introduction" && i.tier === "daily") && items.map(i => i.prompt).join() === "Excavator,Backhoe,Bucket,Boom" && bank.length === 29);
  ok("Caleb: both decks flip, 2 at a time, every back in his definitions", st.cat_modes["Construction Machines"] === "flip" && st.cat_modes["Machine Parts"] === "flip" && st.cat_intro_max["Construction Machines"] === 2 && Object.keys(st.definitions).length === 29 && st.definitions["Dump truck"] === cm.decks[0].cards.find(c => c.name === "Dump truck").def);
  ok("Caleb: bank entries carry def + order only (no stage/ch)", bank.every(e => e.cat && e.name && e.def && e.order && e.ch == null && e.stage == null));
  ok("Caleb: enrolled flag written, writes are targeted index updates / leaf sets", t.us.construction_machines.enrolled.caleb === true && t.G.writes.some(w => w[0] === "set" && w[1] === "unitStudies/construction_machines/enrolled/caleb" && w[2] === true) &&
    t.G.writes.every(w => w[0] === "set" ? /^unitStudies\//.test(w[1]) : /^mastery\/caleb(_custom_items|_settings\/(cat_modes|cat_intro_max|definitions))?$/.test(w[1])));
  ok("Caleb: item ids unique", new Set(items.map(i => i.id)).size === items.length);
  t.unitEnroll("construction_machines", "caleb");
  ok("enrolling twice adds nothing", items.length === 4 && bank.length === 29); }
// Taylor enrolls in Cats
{ const t = load({ unitStudies: { cats_house_and_wild: api.STARTER_UNITS.cats_house_and_wild() } });
  t.unitEnroll("cats_house_and_wild", "taylor");
  const items = t.G.masteryData.taylor, bank = t.G.masteryData.taylor_custom_items;
  ok("Taylor: 3 cats + 2 words learning, 58 in the bank, the Tilcayo cat waits at the end", items.map(i => i.prompt).join() === "Maine Coon,Persian,Ragdoll,Whiskers,Retractable claws" && bank.length === 58 && bank.filter(e => e.cat === "Cats").pop().name === "Tilcayo tiger cat");
  ok("Taylor: Cats bank entries keep their order so the Units tab and notebook sort them", bank.filter(e => e.cat === "Cats").every((e, i) => e.order === i + 1)); }
{ const t = load({ mom: false, unitStudies: { cats_house_and_wild: api.STARTER_UNITS.cats_house_and_wild() } });
  t.unitEnroll("cats_house_and_wild", "taylor");
  ok("kid device: enroll does nothing", !t.G.masteryData.taylor && t.G.writes.length === 0); }

console.log("# the other starters are untouched");
ok("math / letters / shapes / AAS still build", ["math_fluency_path", "letters_path", "shapes_path", "all_about_spelling"].every(id => api.STARTER_UNITS[id]().decks.length));
ok("registry order: the four paths, then the two interest units", Object.keys(api.STARTER_UNITS).join() === "math_fluency_path,letters_path,shapes_path,all_about_spelling,construction_machines,cats_house_and_wild");

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
