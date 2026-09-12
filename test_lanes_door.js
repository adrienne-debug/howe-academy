/*
 * Node tests for 🛤 LANES, Stage 2 — the door: the ⚙ Rules panel section that lists, edits,
 * saves and removes lanes, the badges on member rows, and the lane line on the subject card.
 *
 * Runs the real LANE_UI block + LANE engine block + cbRenderRules against a synthetic
 * curriculum and a RECORDING fake db (captures every write, sends nothing). The engine's own
 * behaviour is covered by test_lanes.js.
 *
 *   run:  node test_lanes_door.js
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");

function block(a, b) { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error("markers " + a); return src.slice(i, j); }
function braceSlice(name) {
  const sig = "function " + name + "("; const i = src.indexOf(sig); if (i < 0) throw new Error("fn " + name);
  let d = 0, j = src.indexOf("{", i);
  for (let k = j; k < src.length; k++) { if (src[k] === "{") d++; else if (src[k] === "}") { d--; if (d === 0) return src.slice(i, k + 1); } }
  throw new Error("unbalanced " + name);
}
const CODE = [braceSlice("esc"), braceSlice("cbDefaultForm"), block("// LANE_START", "// LANE_END"), block("// LANE_UI_START", "// LANE_UI_END"), braceSlice("cbRenderRules"), braceSlice("capFor")].join("\n");

let pass = 0, fail = 0;
function ok(name, cond, extra) { if (cond) { pass++; console.log("  ok  - " + name); } else { fail++; console.log("  FAIL- " + name + (extra !== undefined ? "  (" + JSON.stringify(extra) + ")" : "")); } }
const eq = (x, y) => JSON.stringify(x) === JSON.stringify(y);

function subj(display, n, days, tpw, extra) {
  const seq = Array.from({ length: n }, (_, i) => display + " L" + (i + 1));
  return Object.assign({ display, lessonSeq: seq, lessonIds: seq.map((_, i) => "L" + String(i + 1).padStart(4, "0")), doneImportedAt: 1, planId: "kid__" + display,
    allowedDays: days, timesPerWeek: tpw, pacing: { mode: "timesPerWeek", tpw }, minutes: 15, mom: "none", device: "paper", rules: "" }, extra || {});
}
const doneN = n => { const o = {}; for (let i = 0; i < n; i++) o["L" + String(i + 1).padStart(4, "0")] = { ts: 1, day: "2026-09-01" }; return o; };

function world(o) {
  o = o || {};
  const subjects = o.subjects || { s3b: subj("Singapore 3B", 2, ["Mon", "Wed", "Fri"], 3), s4a: subj("DM 4A", 5, ["Tue"], 1), geo: subj("Daily Geo", 6, ["Mon"], 1), sci: subj("Daily Sci", 6, ["Mon"], 1), reflex: { display: "Reflex", tracking: "daily", minutes: 10 } };
  const done = o.done || {};
  const writes = [];
  const ctx = {
    console, Set, Math, Object, Array, String, Number, JSON, parseInt, Date,
    currData: { subjects: { kid: subjects }, done: { kid: done }, lessons: { kid: {} }, lanes: o.lanes ? { kid: JSON.parse(JSON.stringify(o.lanes)) } : undefined, dayCap: {} },
    db: { ref: p => ({ set: v => writes.push([p, "set", JSON.parse(JSON.stringify(v))]), remove: () => writes.push([p, "remove"]), update: v => writes.push([p, "update", v]) }) },
    writes, cbKid: "kid", cbMsg: "", lnEdit: null, lnUndo: null, cbNewGroup: null, cbRulesOpen: true, cbFamilyRulesOpen: false, cbDayPinScroll: 0,
    renderAll: () => { ctx.renders = (ctx.renders || 0) + 1; }, confirm: () => (o.confirm === undefined ? true : o.confirm),
    DEFAULT_DAY_CAP: 2, CURR_DEV_EMOJI: {}, CURR_DEV_LABEL: {}, document: { getElementById: () => null },
    cbDayCap: () => 0, cbAltGroups: () => ({}), cbOverCapDays: () => 0, cbGroupOf: () => null, rulesFamilyCardsHTML: () => "",
  };
  ctx.lidsFor = (k, sk) => (subjects[sk] || {}).lessonIds || null;
  ctx.lidStamped = (k, sk) => !!(subjects[sk] && subjects[sk].doneImportedAt && subjects[sk].lessonIds);
  ctx.planBacked = (k, sk) => !!(subjects[sk] && subjects[sk].planId && ctx.lidStamped(k, sk));
  ctx.lidDoneIdx = (k, sk) => { if (!ctx.lidStamped(k, sk)) return null; const d = new Set(Object.keys(done[sk] || {})); const out = new Set(); (subjects[sk].lessonIds || []).forEach((id, i) => { if (d.has(id)) out.add(i); }); return out; };
  vm.createContext(ctx);
  new vm.Script(CODE).runInContext(ctx);
  return ctx;
}
const MATH = { math: { name: "Math", units: [{ sk: "s3b", rhythm: "own" }, { sk: "s4a", rhythm: "prior" }] } };

// ── 1. the section renders ──────────────────────────────────────────────────
console.log("── section ──");
{
  const c = world();
  const h = c.lnRenderSection("kid", "#123456");
  ok("no lanes: explains with her example and offers + New lane", /None yet/.test(h) && /lnEditStart\(null\)/.test(h) && /New lane/.test(h));
  ok("no editor open, no Save button", !/lnEditSave\(\)/.test(h));
}
{
  const c = world({ lanes: MATH });
  const h = c.lnRenderSection("kid", "#123456");
  ok("lists the lane by name with its units in order", h.indexOf("Math") > 0 && h.indexOf("Singapore 3B") < h.indexOf("DM 4A"));
  ok("3B is 'up now', 4A is 'waiting'", /Singapore 3B<\/span><span[^>]*>up now/.test(h) && /DM 4A<\/span><span[^>]*>waiting/.test(h), h.slice(h.indexOf("Singapore 3B"), h.indexOf("Singapore 3B") + 400));
  ok("a borrowing unit says ↑ same as before", /same as before/.test(h));
  ok("edit + remove buttons wired to the lane id", /lnEditStart\('math'\)/.test(h) && /lnDelete\('math'\)/.test(h));
  const c2 = world({ lanes: MATH, done: { s3b: doneN(2) } });
  const h2 = c2.lnRenderSection("kid", "#123456");
  ok("3B done → struck through + 'done', 4A 'up now'", /line-through[^>]*>Singapore 3B<\/span><span[^>]*>done/.test(h2) && /DM 4A<\/span><span[^>]*>up now/.test(h2));
}

// ── 2. editor flow → exactly one targeted write ─────────────────────────────
console.log("\n── editor: new lane ──");
{
  const c = world();
  c.lnEditStart(null);
  ok("a fresh editor has no units and shows both add buttons", c.lnEdit && c.lnEdit.units.length === 0 && /lnEditAdd\('single'\)/.test(c.lnRenderSection("kid", "#1")) && /lnEditAdd\('multi'\)/.test(c.lnRenderSection("kid", "#1")));
  ok("problems: needs a name and a unit", eq(c.lnEditProblems("kid"), ["Give the lane a name.", "Add at least one unit."]));
  c.lnEditName("Math");
  c.lnEditAdd("single"); c.lnEditSet(0, "sk", "s3b");
  c.lnEditAdd("single");
  ok("a second unit defaults to 'same as the one before'", c.lnEdit.units[1].rhythm === "prior");
  ok("problem while its subject is unpicked", eq(c.lnEditProblems("kid"), ["Unit 2: pick a subject."]));
  c.lnEditSet(1, "sk", "s4a");
  ok("no problems once complete", eq(c.lnEditProblems("kid"), []));
  const h = c.lnRenderSection("kid", "#1");
  ok("a picked subject is not offered to another unit", !/<option value="s3b"/.test(h.slice(h.indexOf("2.</b>"))) && /<option value="s4a" selected/.test(h));
  ok("the daily subject is never offered (not plan-backed)", !/reflex/.test(h));
  c.writes.length = 0;
  c.lnEditSave();
  const sets = c.writes.filter(w => w[1] === "set");
  ok("exactly two writes: the lane, and lastEdit", c.writes.length === 2 && sets.length === 2, c.writes);
  const w = sets.find(w => /^curriculum\/lanes\/kid\//.test(w[0]));
  ok("the lane write is targeted to its own path", !!w && /^curriculum\/lanes\/kid\/math_[a-z0-9]+$/.test(w[0]), w && w[0]);
  ok("— and holds exactly {name, units}", w && eq(Object.keys(w[2]), ["name", "units"]) && eq(w[2].units, [{ sk: "s3b", rhythm: "own" }, { sk: "s4a", rhythm: "prior" }]), w && w[2]);
  ok("lastEdit is bumped", sets.some(w => w[0] === "curriculum/lastEdit"));
  ok("the in-memory curriculum has it (the Grid derives from this on the next render)", c.lnOf("kid", "s4a") && c.lnOf("kid", "s4a").unitIdx === 1);
  ok("editor closed", c.lnEdit === null);
  ok("Undo remembers there was nothing before", c.lnUndo && c.lnUndo.prev === null && /created/.test(c.lnUndo.label));
  c.writes.length = 0;
  c.lnUndoLast();
  ok("Undo of a create removes the node", c.writes[0][1] === "remove" && /^curriculum\/lanes\/kid\//.test(c.writes[0][0]) && c.lnOf("kid", "s4a") === null, c.writes);
}
{
  const c = world({ lanes: MATH });
  c.lnEditStart("math");
  ok("editing loads the lane", c.lnEdit.id === "math" && c.lnEdit.name === "Math" && c.lnEdit.units.length === 2);
  ok("the lane being edited is not also listed", !/lnEditStart\('math'\)/.test(c.lnRenderSection("kid", "#1")));
  c.lnEditMove(1, -1);
  ok("reorder swaps units", c.lnEdit.units[0].sk === "s4a");
  ok("— and the first unit may not borrow", /first unit has nothing before it/.test(c.lnEditProblems("kid").join(" ")));
  c.lnEditSet(0, "rhythm"); c.lnEditSet(1, "rhythm");
  ok("rhythm toggles", c.lnEdit.units[0].rhythm === "own" && c.lnEdit.units[1].rhythm === "prior");
  c.writes.length = 0; c.lnEditSave();
  const w = c.writes.find(w => w[0] === "curriculum/lanes/kid/math");
  ok("an edit writes back to the SAME id", !!w && w[2].units[0].sk === "s4a", c.writes);
  ok("Undo remembers the previous lane", c.lnUndo.prev && c.lnUndo.prev.units[0].sk === "s3b");
  c.writes.length = 0; c.lnUndoLast();
  ok("Undo of an edit restores the previous lane", c.writes[0][0] === "curriculum/lanes/kid/math" && c.writes[0][2].units[0].sk === "s3b");
}

// ── 3. multiple card ─────────────────────────────────────────────────────────
console.log("\n── editor: multiple card ──");
{
  const c = world();
  c.lnEditStart(null); c.lnEditName("Geo/Sci"); c.lnEditAdd("multi");
  ok("first unit gets its own rhythm", c.lnEdit.units[0].rhythm === "own");
  ok("problem: needs 2+ subjects", /needs 2\+ subjects/.test(c.lnEditProblems("kid").join(" ")));
  c.lnEditSet(0, "sub", "geo"); c.lnEditSet(0, "sub", "sci");
  c.lnEditSet(0, "pattern", "aab");
  ok("pattern is upper-cased and letter-only", c.lnEdit.units[0].pattern === "AAB");
  c.lnEditSet(0, "pattern", "AAC");
  ok("problem: a letter with no subject", /letter C has no subject/.test(c.lnEditProblems("kid").join(" ")));
  c.lnEditSet(0, "pattern", "AAB");
  c.lnEditSet(0, "day", "Mon"); c.lnEditSet(0, "day", "Wed"); c.lnEditSet(0, "day", "Fri"); c.lnEditSet(0, "tpw", 3); c.lnEditSet(0, "cap", 9);
  ok("cap clamps to 4", c.lnEdit.units[0].cap === 4);
  const h = c.lnRenderSection("kid", "#1");
  ok("chips show the letter each picked subject holds", /A Daily Geo/.test(h) && /B Daily Sci/.test(h));
  c.writes.length = 0; c.lnEditSave();
  const w = c.writes.find(w => /^curriculum\/lanes\/kid\//.test(w[0]));
  ok("saved unit carries subs, pattern and its own rhythm", w && eq(w[2].units[0], { subs: ["geo", "sci"], pattern: "AAB", rhythm: "own", allowedDays: ["Mon", "Wed", "Fri"], timesPerWeek: 3, cap: 4 }), w && w[2]);
  // a borrowing multiple card stores no rhythm fields of its own
  const c2 = world();
  c2.lnEditStart(null); c2.lnEditName("L"); c2.lnEditAdd("single"); c2.lnEditSet(0, "sk", "s3b"); c2.lnEditAdd("multi"); c2.lnEditSet(1, "sub", "geo"); c2.lnEditSet(1, "sub", "sci");
  ok("a later multiple card defaults to 'same as before'", c2.lnEdit.units[1].rhythm === "prior");
  ok("— and hides the days/×wk/cap controls", !/lnEditSet\(1,'day'/.test(c2.lnRenderSection("kid", "#1")));
  c2.writes.length = 0; c2.lnEditSave();
  const w2 = c2.writes.find(w => /^curriculum\/lanes\/kid\//.test(w[0]));
  ok("stored without allowedDays/timesPerWeek/cap (they are the prior unit's)", w2 && eq(Object.keys(w2[2].units[1]).sort(), ["pattern", "rhythm", "subs"]), w2 && w2[2].units[1]);
}

// ── 4. guards ────────────────────────────────────────────────────────────────
console.log("\n── guards ──");
{
  const c = world({ lanes: MATH });
  c.lnEditStart(null); c.lnEditName("Other"); c.lnEditAdd("single"); c.lnEditSet(0, "sk", "s4a");
  ok("a subject already in another lane is refused", /already in lane “Math”/.test(c.lnEditProblems("kid").join(" ")));
  { const f = world({ lanes: MATH }); f.lnEditStart(null); f.lnEditAdd("single");
    ok("— and is not offered in a fresh picker (a bad pick already made stays visible so she sees it)", !/<option value="s4a"/.test(f.lnRenderSection("kid", "#1")) && /<option value="geo"/.test(f.lnRenderSection("kid", "#1"))); }
  c.writes.length = 0; c.lnEditSave();
  ok("save refuses while there are problems (no write, editor stays open)", c.writes.length === 0 && c.lnEdit !== null && /already in lane/.test(c.cbMsg));
  const c2 = world();
  c2.lnEditStart(null); c2.lnEditName("Dup"); c2.lnEditAdd("single"); c2.lnEditSet(0, "sk", "geo"); c2.lnEditAdd("multi"); c2.lnEditSet(1, "sub", "geo"); c2.lnEditSet(1, "sub", "sci");
  ok("the same subject twice in one lane is refused", /in this lane twice/.test(c2.lnEditProblems("kid").join(" ")));
  const c3 = world({ lanes: MATH, confirm: false });
  c3.writes.length = 0; c3.lnDelete("math");
  ok("remove asks first; a 'no' writes nothing", c3.writes.length === 0 && c3.lnOf("kid", "s3b") !== null);
  const c4 = world({ lanes: MATH });
  c4.writes.length = 0; c4.lnDelete("math");
  ok("remove = one targeted remove + lastEdit", c4.writes.length === 2 && c4.writes[0][0] === "curriculum/lanes/kid/math" && c4.writes[0][1] === "remove", c4.writes);
  ok("— members go back to their own settings", c4.lnOf("kid", "s3b") === null && c4.lnUndo.prev.name === "Math");
  c4.writes.length = 0; c4.lnUndoLast();
  ok("Undo of a remove puts the lane back", c4.writes[0][1] === "set" && c4.lnOf("kid", "s4a").unitIdx === 1);
  const c5 = world({ lanes: MATH }); c5.db = null;
  c5.lnEditStart("math"); c5.lnEditSave(); c5.lnDelete("math");
  ok("no db → no writes, no crash", c5.lnOf("kid", "s3b") !== null);
}

// ── 5. the Rules panel: section + member badges ─────────────────────────────
console.log("\n── panel ──");
{
  const c = world({ lanes: MATH });
  let h = ""; try { h = c.cbRenderRules("#123456"); } catch (e) { ok("cbRenderRules renders with a lane", false, String(e)); }
  ok("the panel embeds the lanes section", /🛤 Lanes — a category/.test(h) && /lnEditStart\('math'\)/.test(h));
  const row4a = h.slice(h.indexOf('title="DM 4A"'), h.indexOf("rlSet('kid','s4a','minutes'"));
  ok("4A's row carries its standing", /🛤 Math · 2 of 2 · waiting · ↑ same as before/.test(row4a), row4a.slice(0, 300));
  ok("4A's Days / ×wk / Cap cells are dimmed (the unit before decides)", (row4a.match(/opacity:\.4/g) || []).length === 3, (row4a.match(/opacity:\.4/g) || []).length);
  ok("— with a title saying why", /same as the unit before it in lane Math/.test(row4a));
  const row3b = h.slice(h.indexOf('title="Singapore 3B"'), h.indexOf("rlSet('kid','s3b','minutes'"));
  ok("3B's row says up now and keeps its controls live", /🛤 Math · 1 of 2 · up now/.test(row3b) && !/opacity:\.4/.test(row3b));
  const rowGeo = h.slice(h.indexOf('title="Daily Geo"'), h.indexOf("rlSet('kid','geo','minutes'"));
  ok("a subject not in a lane has no badge and no dimming", !/🛤/.test(rowGeo) && !/opacity:\.4/.test(rowGeo));
  const c2 = world({ lanes: { gs: { name: "Geo/Sci", units: [{ subs: ["geo", "sci"], pattern: "AB", rhythm: "own", allowedDays: ["Mon"], timesPerWeek: 1 }] } } });
  const h2 = c2.cbRenderRules("#1");
  const rg = h2.slice(h2.indexOf('title="Daily Geo"'), h2.indexOf("rlSet('kid','geo','minutes'"));
  ok("a multiple-card member is dimmed too, titled to the card", (rg.match(/opacity:\.4/g) || []).length === 3 && /multiple card’s rhythm applies/.test(rg));
}

// ── 6. wiring in the source ──────────────────────────────────────────────────
console.log("\n── every column is a lane of one (auto-named, editable) ──");
{
  const c = world();
  const A = c.lnAutoName;
  ok("a trailing LEVEL token is dropped — the lane names the category, not the book",
    A("Singapore Math 3B") === "Singapore Math" && A("Dimensions Math 1A") === "Dimensions Math" &&
    A("Language Smarts D") === "Language Smarts" && A("LOE Foundations B") === "LOE Foundations");
  ok("real words are never mistaken for a level",
    A("Editor in Chief") === "Editor in Chief" && A("HWT Printing Power") === "HWT Printing Power" &&
    A("Spelling You See") === "Spelling You See" && A("Word Roots") === "Word Roots" && A("MR5/MR6 Pages") === "MR5/MR6 Pages");
  ok("a one-word name survives", A("Mathseeds") === "Mathseeds" && A("") === "");
  const h = c.lnRenderSection("kid", "#123456");
  ok("with no lanes, every plan-backed subject offers itself as a lane of one", /Not stacked yet/.test(h) &&
    /lnEditStart\(null,'s3b'\)/.test(h) && /lnEditStart\(null,'s4a'\)/.test(h) && /lnEditStart\(null,'geo'\)/.test(h), h.slice(h.indexOf("Not stacked"), h.indexOf("Not stacked") + 260));
  ok("the chip shows the auto name, not the raw subject name", /Singapore ＋/.test(h), h.slice(h.indexOf("Not stacked"), h.indexOf("Not stacked") + 400));
  ok("the daily subject is never offered", !/lnEditStart\(null,'reflex'\)/.test(h));
}
{
  const c = world({ lanes: MATH });
  const h = c.lnRenderSection("kid", "#1");
  ok("a subject already in a lane is NOT offered again", !/lnEditStart\(null,'s3b'\)/.test(h) && !/lnEditStart\(null,'s4a'\)/.test(h));
  ok("— but the ones that are not stacked still are", /lnEditStart\(null,'geo'\)/.test(h) && /lnEditStart\(null,'sci'\)/.test(h));
}
{
  const c = world();
  c.lnEditStart(null, "s3b");
  ok("tapping a chip seeds the editor with that subject as unit 1", c.lnEdit && c.lnEdit.units.length === 1 && c.lnEdit.units[0].sk === "s3b" && c.lnEdit.units[0].rhythm === "own");
  ok("— and pre-fills the auto name, which is editable", c.lnEdit.name === "Singapore");
  ok("no problems: it is already a valid one-unit lane", eq(c.lnEditProblems("kid"), []));
  ok("the chips are hidden while the editor is open", !/Not stacked yet/.test(c.lnRenderSection("kid", "#1")));
  c.lnEditName("Math");                    // she renames it
  c.lnEditAdd("single"); c.lnEditSet(1, "sk", "s4a");
  c.writes.length = 0; c.lnEditSave();
  const w = c.writes.find(x => /^curriculum\/lanes\/kid\//.test(x[0]));
  ok("saving writes ONE real lane record with her name and both books", !!w && w[2].name === "Math" &&
    eq(w[2].units, [{ sk: "s3b", rhythm: "own" }, { sk: "s4a", rhythm: "prior" }]), w && w[2]);
  ok("nothing is stored until she saves — no lane node per subject", c.writes.filter(x => /lanes/.test(x[0])).length === 1);
}
{
  // the engine must NOT see an implicit lane — only display does
  const c = world();
  ok("lnOf still means a REAL stored lane (the generator, projection and re-lay are untouched)", c.lnOf("kid", "s3b") === null);
  ok("lnMemberInfo is still null for an unstacked subject (no badge noise on 24 rows)", c.lnMemberInfo("kid", "s3b") === null);
}

console.log("\n── retire: a finished book is filed away in ⚙ Rules (her rule) ──");
{
  // 3B finished, 4A up
  const c = world({ lanes: MATH, done: { s3b: doneN(2) } });
  let h = c.lnRenderSection("kid", "#1");
  ok("the finished book shows as done with a ⤓ retire option", /line-through[^>]*>Singapore 3B<\/span>[\s\S]{0,200}lnRetire\('math',0,true\)/.test(h), h.slice(h.indexOf("Singapore 3B"), h.indexOf("Singapore 3B") + 420));
  ok("the book that is UP gets no retire option", !/lnRetire\('math',1,true\)/.test(h));
  c.writes.length = 0;
  c.lnRetire("math", 0, true);
  const w = c.writes.find(x => x[0] === "curriculum/lanes/kid/math");
  ok("retiring is ONE targeted lane write", c.writes.length === 2 && !!w, c.writes);
  ok("— it only adds retired:true; the unit and the lane are otherwise unchanged",
    w && eq(w[2].units, [{ sk: "s3b", rhythm: "own", retired: true }, { sk: "s4a", rhythm: "prior" }]), w && w[2]);
  ok("nothing is written to the subject, its lessons or its done record", !c.writes.some(x => /subjects|lessons|done/.test(x[0])));
  h = c.lnRenderSection("kid", "#1");
  ok("it leaves the main line and is filed underneath as retired", /retired: Singapore 3B/.test(h) && !/line-through[^>]*>Singapore 3B/.test(h));
  ok("— with a ↩ to bring it back", /lnRetire\('math',0,false\)/.test(h));
  ok("4A is still up and unaffected", /DM 4A<\/span><span[^>]*>up now/.test(h));
  ok("it STAYS a lane member, so it never returns as its own Grid column", c.lnOf("kid", "s3b") !== null);
  ok("a retired unit is never 'open', so it can never be picked as up", c.lnUnitOpen("kid", { sk: "s3b", retired: true }) === false);
  ok("Undo is armed", c.lnUndo && /retired/.test(c.lnUndo.label));
  c.writes.length = 0; c.lnRetire("math", 0, false);
  const w2 = c.writes.find(x => x[0] === "curriculum/lanes/kid/math");
  ok("↩ brings it back — retired flag removed", w2 && eq(w2[2].units[0], { sk: "s3b", rhythm: "own" }), w2 && w2[2].units[0]);
}
{
  // guard: you cannot retire a book that still has lessons
  const c = world({ lanes: MATH });
  c.gwShowToast = m => (c.__toast = m);
  c.writes.length = 0;
  c.lnRetire("math", 0, true);
  ok("a book with lessons left REFUSES to retire, and says why", c.writes.length === 0 && /still has lessons left/.test(c.__toast || ""), c.__toast);
}

console.log("\n── wiring ──");
{
  ok("state declared beside the panel's other state", /let lnEdit=null, lnUndo=null;/.test(src));
  ok("closing the panel drops an open editor", /function cbRulesToggle\(\)\{ cbRulesOpen=!cbRulesOpen; lnEdit=null; renderAll\(\); \}/.test(src));
  ok("the subject card shows the lane line under Progress", /lnMemberInfo\(ceEditKid,ceEditKey\)/.test(src) && /edit in Grid ▸ ⚙ Rules ▸ 🛤 Lanes/.test(src));
  const ui = block("// LANE_UI_START", "// LANE_UI_END");
  const refs = ui.match(/db\.ref\([^)]*\)/g) || [];
  ok("the door writes ONLY under curriculum/lanes/<kid>/<id> and curriculum/lastEdit", refs.length > 0 && refs.every(r => r === 'db.ref("curriculum/lastEdit")' || /^db\.ref\("curriculum\/lanes\/"\+[a-z.]+\+"\/"\+[a-z.]+\)$/.test(r)), refs);
  ok("no whole-node set: every write names one lane", !/db\.ref\("curriculum\/lanes"\)/.test(ui) && !/db\.ref\("curriculum"\)/.test(ui));
  ok("no re-lay is triggered by a lane write (the Grid derives live)", !/_gvRelaySubject|cbBuildGate|cbApply\(/.test(ui));
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
