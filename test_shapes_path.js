// 🔷 Shapes Path starter unit (her "okay go" on Caleb's step 3, 2026-10-04).
// Runs the real STARTER_UNITS block (SHAPES_PATH + UNIT_STAGES):
//  · every shape has a real drawing in the drill (mastShapeVis) AND the notebook (juSvgShape);
//  · every count-the-sides shape (MAST_SHAPE_SIDES) is in the unit, plus Julian's 7- and 9-gons;
//  · Caleb starts at Basic shapes, 2 at a time; a kid who already has Shapes cards gets no duplicates;
//  · the notebook's Shape of the Day runs ahead only through the stage he's on.
// UNITS_SRC=<path> runs it against another copy of index.html.
const fs = require("fs"), path = require("path");
const src = fs.readFileSync(process.env.UNITS_SRC || path.join(__dirname, "index.html"), "utf8");
let pass = 0, fail = 0;
function ok(name, cond) { if (cond) { pass++; console.log("  ok  - " + name); } else { fail++; console.log("  FAIL- " + name); } }
const a = src.indexOf("// STARTER_UNITS_START"), b = src.indexOf("// STARTER_UNITS_END");
ok("SHAPES_PATH inside the STARTER_UNITS block", a > 0 && src.indexOf("SHAPES_PATH (her") > a && src.indexOf("// SHAPES_PATH_END") < b);
const block = src.slice(a, b);
function world(mastery) {
  const G = { masteryData: mastery || {}, currData: { subjects: {} }, writes: [], unitStudies: {}, content: { innerHTML: "" } };
  const db = { ref(p) { return { update(v) { G.writes.push(["update", p, v]); }, set(v) { G.writes.push(["set", p, v]); }, transaction() { return Promise.resolve({ committed: false }); } }; } };
  const api = new Function("G", "db", `
    const masteryData=G.masteryData, currData=G.currData; let unitStudies=G.unitStudies;
    function momHere(){ return true; } function _dryRun(){ return false; } function cap(s){ return s[0].toUpperCase()+s.slice(1); }
    function renderUnits(){} const HA_LS={ setItem(){} }; const document={ getElementById:()=>G.content };
    function mastDefKeyOk(n){ return !/[.$#\\[\\]\\/]/.test(n); } function mastGateChapter(){ return null; }
    ${block}
    return { STARTER_UNITS, SP_STAGES, unitStageFormOpen, unitStageFormSet, unitStageEnroll, unitStageStatus, unitStageMoveUp };`)(G, db);
  const u = api.STARTER_UNITS.shapes_path(); G.unitStudies[u.id] = u; api.u = u; api.G = G; return api;
}
const w = world(), u = w.u, cards = u.decks[0].cards, names = cards.map(c => c.name);

ok("one deck, key 'Shapes' (the drill draws it + the tap-each-side drill), flash, 2 at a time", u.decks.length === 1 && u.decks[0].key === "Shapes" && u.decks[0].mode === "flash" && u.decks[0].introCap === 2);
ok("3 stages: Basic shapes · More flat shapes · Solid shapes", u.stages.map(s => s.label).join("|") === "Basic shapes|More flat shapes|Solid shapes");
ok("Basic shapes = circle, square, triangle, rectangle", cards.filter(c => c.stage === 1).map(c => c.name).join(",") === "Circle,Square,Triangle,Rectangle");
ok("kindergarten list covered (K.G.2: + hexagon; cube, cone, cylinder, sphere)", ["Hexagon", "Cube", "Cone", "Cylinder", "Sphere"].every(n => names.includes(n)));
ok("solids only in Stage 3", cards.filter(c => c.stage === 3).map(c => c.name).join(",") === "Cube,Sphere,Cone,Cylinder,Pyramid");
const sidesSrc = /const MAST_SHAPE_SIDES=(\{[^}]*\});/.exec(src)[1];
const SIDES = new Function("return " + sidesSrc)();
ok("every count-the-sides shape is in the unit (her ask 10/4)", Object.keys(SIDES).every(n => names.includes(n)));
ok("Julian's 7- and 9-gons are in, with the decagon, last in flat shapes", cards.filter(c => c.family === "Count the sides: 7, 9, 10").map(c => c.name).join(",") === "Heptagon,Nonagon,Decagon");
ok("no duplicate names", new Set(names).size === names.length);

// every name has a real drill picture (mastShapeVis falls back to the first LETTER for unknown names)
const vs = src.indexOf("function mastShapeVis("), ve = src.indexOf("// SHAPE_SIDES_START");
const ps = src.indexOf("function mastShapePoly("), pe = src.indexOf("let mastSides=");
const vis = new Function(src.slice(vs, ve) + "\n" + src.slice(ps, pe) + "\nreturn mastShapeVis;")();
ok("drill: every shape draws a real picture (none fall back to its first letter)", names.every(n => vis(n, 60) !== n.charAt(0)));
// … and in the notebook
global.window = {};
eval(fs.readFileSync(path.join(__dirname, "notebooks.js"), "utf8"));
const NB = window.HoweNotebooks;
ok("notebook: every shape has a drawing (no 'NO DRAWING' box)", names.every(n => !/NO DRAWING/.test(NB.juSvgShape(n))));

// ── Caleb starts at Basic shapes ──
w.unitStageFormOpen("shapes_path", "caleb"); w.unitStageFormSet("stage", "1"); w.unitStageEnroll();
let it = w.G.masteryData.caleb || [];
ok("Caleb: Circle + Square start learning", it.map(i => i.prompt).join(",") === "Circle,Square" && it.every(i => i.status === "introduction" && i.subject === "Shapes"));
ok("Caleb: bank holds the 4 basic shapes", w.G.masteryData.caleb_custom_items.map(c => c.name).join(",") === "Circle,Square,Triangle,Rectangle");
it.forEach(i => { i.status = "active"; i.tier = "weekly"; });
w.G.masteryData.caleb.push({ id: "x1", subject: "Shapes", prompt: "Triangle", status: "active" }, { id: "x2", subject: "Shapes", prompt: "Rectangle", status: "active" });
let st = w.unitStageStatus(u, "caleb");
ok("all 4 known → ready, next = More flat shapes", st.ready && st.next && st.next.n === 2);
w.unitStageMoveUp("shapes_path", "caleb");
ok("➡ Stage 2: Hexagon + Oval start learning", w.G.masteryData.caleb.filter(i => i.status === "introduction").map(i => i.prompt).join(",") === "Hexagon,Oval");

// ── a kid who already has Shapes cards (Julian-style) gets no duplicates ──
const jw = world({ julian: ["Circle", "Square", "Triangle", "Rectangle", "Hexagon", "Oval"].map((n, i) => ({ id: "j" + i, subject: "Shapes", prompt: n, status: "active", tier: "weekly" })) });
jw.unitStageFormOpen("shapes_path", "julian"); jw.unitStageFormSet("stage", "2"); jw.unitStageFormSet("knows", "Hexagon & oval"); jw.unitStageEnroll();
const jit = jw.G.masteryData.julian;
ok("existing Hexagon/Oval kept, not duplicated; Diamond + Star start", jit.filter(i => i.prompt === "Hexagon").length === 1 && jit.filter(i => i.status === "introduction").map(i => i.prompt).join(",") === "Diamond,Star");

// ── the notebook stays inside his stage ──
const dates = { monday: "1", tuesday: "2", wednesday: "3", thursday: "4", friday: "5" };
const shapesWeek = items => [...NB.generate("caleb", { weekNum: "week26", weekDates: "x", weekData: { dates, tasks: [] }, masteryItems: items }).student.matchAll(/recap-chip">⭐ (\w+)/g)].map(m => m[1]).join(",");
const sh = (n, s) => ({ subject: "Shapes", prompt: n, status: s || "introduction" });
ok("notebook, Stage 1 (drilling Circle + Square): only the basic 4", shapesWeek([sh("Circle"), sh("Square")]) === "Circle,Square,Triangle,Rectangle,Circle");
const w2 = shapesWeek(["Circle", "Square", "Triangle", "Rectangle"].map(n => sh(n, "active")).concat([sh("Hexagon"), sh("Oval")]));
ok("notebook, Stage 2: flat shapes appear, no solids yet", !/Cube|Sphere|Cone|Cylinder|Pyramid/.test(NB.generate("caleb", { weekNum: "week26", weekDates: "x", weekData: { dates, tasks: [] }, masteryItems: ["Circle", "Square", "Triangle", "Rectangle"].map(n => sh(n, "active")).concat([sh("Hexagon"), sh("Oval")]) }).student.replace(/<style[\s\S]*?<\/style>/g, "")) && w2.length > 0);
ok("notebook, no Shapes deck yet: the basic 4 as before", shapesWeek([]) === "Circle,Square,Triangle,Rectangle,Circle");

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
