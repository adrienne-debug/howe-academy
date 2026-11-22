// 📓 UACTKIND — the kind of a unit activity (slice 2 of PLAN_unit_activity_types_2026-11-19; Adrienne 2026-11-22 "go with her
//   answers and build"; labels §5 Q1). One field, activities/<i>/type; none = 📓 Notebook activity.
//   Runs the REAL UNITTRACK + UTADDACT + UACTKIND blocks against a fake db that records paths, and the REAL renderUnitDetail
//   (brace-extracted, unknown helpers shimmed to "") for the Units page.
//   · the day editor's box: five chips, 📓 pre-picked (✎: the activity's own kind); a tap repaints the chips in place
//   · + Add with 📓 → today's record byte for byte; with another kind → the same one update + type; ✎ writes only …/type, only on change
//   · not Mom → nothing; dry run → nothing written
//   · no type → the day editor, the day card and the Units page rows draw byte-identical to the tree minus UACTKIND
//     (only the section's name reads "📓 Notebook activities"); 🖨 Print / 📓 Notebook hide for 📱 and 🔗
//   run: node test_unit_act_kind.js
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const cut = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error("markers " + a); return src.slice(i, j); };
const fn = name => { const i = src.indexOf("function " + name + "("); if (i < 0) throw new Error("no " + name); let d = 0, j = i, seen = false; for (; j < src.length; j++) { const c = src[j]; if (c === "{") { d++; seen = true; } else if (c === "}") { d--; if (seen && d === 0) break; } } return src.slice(i, j + 1); };
const UT = cut("// UNITTRACK_START", "// UNITTRACK_END"), AA = cut("// UTADDACT_START", "// UTADDACT_END"), DC = cut("// DAYCARD_START", "// DAYCARD_END");
const BLK = cut("// UACTKIND_START", "// UACTKIND_END") + "// UACTKIND_END\n";
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x).slice(0, 500) : "")); } };
const J = x => JSON.stringify(x);
const UNIT = () => ({ id: "harv", title: "Harvest", emoji: "🌾", enrolled: { k1: true, k2: true }, decks: [],
  activities: [{ key: "corn_maze", title: "Draw a corn maze", emoji: "🎨", kind: "sheet", points: 5, day: 2, desc: "Start in a corner." }],
  track: { mode: "seq", perWeek: 4, days: [{ id: "d1", n: 1, t: "Fields" }, { id: "d2", n: 2, t: "Mazes", nb: { activity: "corn_maze" } }] } });
function world(o) {
  o = o || {}; const writes = []; const dom = o.dom || {};
  const ctx = { console, JSON, Object, Array, String, Number, Math, Set, Map, RegExp, Date, Promise, Error, parseInt, isNaN, isFinite, WeakMap, URL,
    unitStudies: { harv: o.unit || UNIT() }, ROSTER: ["k1", "k2"], KID_NAME: { k1: "Ada", k2: "Ben" },
    momHere: () => o.mom !== false, _dryRun: () => !!o.dry,
    db: { ref: p => ({ set: v => writes.push(["set", p === undefined ? "" : p, JSON.parse(J(v === undefined ? null : v))]), update: v => writes.push(["update", p === undefined ? "" : p, JSON.parse(J(v))]), remove: () => writes.push(["remove", p]) }) },
    renderAll: () => { ctx.repaints = (ctx.repaints || 0) + 1; }, repaints: 0, document: { getElementById: id => (id in dom) ? dom[id] : null } };
  vm.createContext(ctx);
  vm.runInContext(UT + "\n" + AA + "\n" + (o.before ? "" : BLK) + "\n" + DC + "\n" + fn("ubSlug") + "\n" + fn("_unitActs"), ctx);
  return { ctx, writes, dom };
}
const el = () => { const e = { value: "", attrs: {}, setAttribute(k, v) { this.attrs[k] = v; } }; return e; };
const PICK = /<div role="group" aria-label="Kind of activity"[^]*?<\/button><\/div>/;
const A1 = "unitStudies/harv/activities/1", NB1 = "unitStudies/harv/track/days/0/nb";

console.log("── the block ──");
ok("UACTKIND is a marked block right after UTADDACT; its hooks are typeof-guarded one-liners", BLK.length > 1500 && src.indexOf("// UACTKIND_START") === src.indexOf("// UTADDACT_END") + "// UTADDACT_END\n".length &&
  /typeof uakAddFields==="function"&&!uakAddFields\(utaaKey\(uid,dayId\),act\)\) return false;/.test(AA) && /typeof uakEditFields==="function"&&!uakEditFields\(kk,x\.a,upd,base\)\) return false;/.test(AA) && AA.split("typeof uakPickerHTML===\"function\"").length === 3);
ok("the block itself never touches db (UTADDACT's one update carries the field)", !/db\.|\.ref\(|\.set\(|\.update\(|\.remove\(/.test(BLK.replace(/^\s*\/\/.*$/mg, "")));
ok("five kinds, 📓 first, labels as the plan names them", J(vm.runInContext("UAK_TYPES", world().ctx).map(x => x[1] + " " + x[2])) === J(["📓 Notebook activity", "📱 On-screen activity", "🖨 Printable", "🔗 Web link", "🧪 Hands-on"]));
ok("no family names, no 🔀", BLK.indexOf("\u{1F500}") < 0 && !/Lincoln|Ellis|Lucy|Julian|Sara\b|DeWalt|taylor|makenzie|andrew|caleb/i.test(BLK) && src.indexOf("\u{1F500}") < 0);
ok("the Builder box is labelled 📓 Notebook activities & field trips (§5 Q1)", src.indexOf('["acts","\\u{1F4D3} Notebook activities & field trips"') > 0 && src.indexOf("\\u{1F3A8} Activities & field trips") < 0);
{
  const c = world().ctx;
  ok("uakType: none / notebook / junk → notebook; a real kind → itself", c.uakType({}) === "notebook" && c.uakType({ type: "notebook" }) === "notebook" && c.uakType({ type: "quiz" }) === "notebook" && c.uakType({ type: "link" }) === "link" && c.uakType(null) === "notebook");
}

console.log("\n── the day editor's box ──");
{
  const A = world(), B = world({ before: true }); const u = A.ctx.unitStudies.harv;
  const hA = A.ctx.utaaEditorHTML(u, A.ctx.utDay(u, "d1")), hB = B.ctx.utaaEditorHTML(B.ctx.unitStudies.harv, B.ctx.utDay(B.ctx.unitStudies.harv, "d1"));
  ok("+ Add box: five chips, 📓 pressed, the others not", (hA.match(/id="uak-harv-d1-/g) || []).length === 5 && /id="uak-harv-d1-notebook" aria-pressed="true"/.test(hA) && (hA.match(/aria-pressed="false"/g) || []).length === 4, hA);
  ok("+ Add box = the old box with only the chip row added, above the line", hA.replace(PICK, "") === hB && hA.indexOf("data-uak-pick") < hA.indexOf("utaa-harv-d1-line"));
  const eA = A.ctx.utaaEditorHTML(u, A.ctx.utDay(u, "d2")), eB = B.ctx.utaaEditorHTML(B.ctx.unitStudies.harv, B.ctx.utDay(B.ctx.unitStudies.harv, "d2"));
  ok("✎ box: the same, plus only the chip row", eA.replace(PICK, "") === eB && /aria-pressed="true"[^>]*uakPick\('harv-d2','notebook'\)/.test(eA));
  u.activities[0].type = "screen";
  ok("✎ box on a 📱 activity: 📱 pressed", /id="uak-harv-d2-screen" aria-pressed="true"/.test(A.ctx.utaaEditorHTML(u, A.ctx.utDay(u, "d2"))));
  const kidBox = world({ mom: false }).ctx; ok("not Mom: no box at all (UTADDACT's gate)", kidBox.utaaEditorHTML(kidBox.unitStudies.harv, kidBox.utDay(kidBox.unitStudies.harv, "d1")) === "");
  ok("chips wrap at phone width (flex-wrap, no fixed width)", /data-uak-pick="harv-d1" style="display:flex;gap:6px;flex-wrap:wrap/.test(hA) && !/width:\d/.test(hA.match(PICK)[0]));
}
{
  const dom = { "uak-harv-d1-notebook": el(), "uak-harv-d1-screen": el(), "uak-harv-d1-print": el(), "uak-harv-d1-link": el(), "uak-harv-d1-hands": el() };
  const w = world({ dom }); const c = w.ctx;
  ok("a chip tap: remembered, the chips repaint in place (no full render), nothing written", c.uakPick("harv-d1", "hands") === true && dom["uak-harv-d1-hands"].attrs["aria-pressed"] === "true" && dom["uak-harv-d1-notebook"].attrs["aria-pressed"] === "false" && /#b45309/.test(dom["uak-harv-d1-hands"].attrs.style) && c.repaints === 0 && w.writes.length === 0);
  ok("…a later render keeps the picked chip", /id="uak-harv-d1-hands" aria-pressed="true"/.test(c.utaaEditorHTML(c.unitStudies.harv, c.utDay(c.unitStudies.harv, "d1"))));
  ok("a made-up kind is refused", c.uakPick("harv-d1", "quiz") === false && vm.runInContext("uakPicked", c)["harv-d1"] === "hands");
  const k = world({ mom: false, dom }); ok("not Mom: a tap does nothing", k.ctx.uakPick("harv-d1", "screen") === false && !vm.runInContext("uakPicked", k.ctx)["harv-d1"]);
}

console.log("\n── + Add ──");
{
  const A = world({ dom: { "utaa-harv-d1-line": { value: "Leaf hunt | 8 | Find five shapes" } } }), B = world({ before: true, dom: { "utaa-harv-d1-line": { value: "Leaf hunt | 8 | Find five shapes" } } });
  A.ctx.utaaAdd("harv", "d1"); B.ctx.utaaAdd("harv", "d1");
  ok("📓 (untouched): the write is byte-identical to the tree minus UACTKIND — no type field", A.writes.length === 1 && J(A.writes) === J(B.writes) && !("type" in A.writes[0][2][A1]), A.writes);
}
{
  const w = world({ dom: { "utaa-harv-d1-line": { value: "Pumpkin video | 3 | Watch, then tell Mom one fact" } } }); const c = w.ctx;
  c.uakPick("harv-d1", "screen"); const r = c.utaaAdd("harv", "d1");
  ok("📱 picked: still ONE update of the same two paths", r === true && w.writes.length === 1 && w.writes[0][0] === "update" && J(Object.keys(w.writes[0][2]).sort()) === J([A1, NB1].sort()), w.writes);
  ok("…the record carries type:\"screen\" and nothing else new", J(w.writes[0][2][A1]) === J({ key: "pumpkin_video", title: "Pumpkin video", emoji: "🎨", kind: "sheet", points: 3, day: 1, desc: "Watch, then tell Mom one fact", type: "screen" }), w.writes[0][2][A1]);
  ok("…the pick is cleared for the next one, the screen copy has it", !vm.runInContext("uakPicked", c)["harv-d1"] && c.unitStudies.harv.activities[1].type === "screen");
}
{
  const w = world({ dry: true, dom: { "utaa-harv-d1-line": { value: "Pumpkin | 3" } } }); w.ctx.uakPick("harv-d1", "hands"); w.ctx.utaaAdd("harv", "d1");
  ok("dry run: nothing written, the screen copy carries the kind", w.writes.length === 0 && w.ctx.unitStudies.harv.activities[1].type === "hands");
}

console.log("\n── ✎ Save ──");
{
  const dom = { "utaa-harv-d2-title": { value: "Draw a corn maze" }, "utaa-harv-d2-points": { value: "5" }, "utaa-harv-d2-desc": { value: "Start in a corner." } };
  const w = world({ dom }); const c = w.ctx;
  c.utaaEdit("harv", "d2"); ok("nothing changed (📓 stays 📓) → no write", w.writes.length === 0);
  c.uakPick("harv-d2", "screen"); c.utaaEdit("harv", "d2");
  ok("📱 picked: ONE update of only …/activities/0/type = \"screen\"", J(w.writes) === J([["update", "", { "unitStudies/harv/activities/0/type": "screen" }]]), w.writes);
  w.writes.length = 0; dom["utaa-harv-d2-points"].value = "9"; c.utaaEdit("harv", "d2");
  ok("next ✎ with the kind unchanged and points changed → only …/points", J(w.writes) === J([["update", "", { "unitStudies/harv/activities/0/points": 9 }]]), w.writes);
  w.writes.length = 0; c.uakPick("harv-d2", "notebook"); c.utaaEdit("harv", "d2");
  ok("back to 📓 → …/type null (the field goes: none = notebook)", J(w.writes) === J([["update", "", { "unitStudies/harv/activities/0/type": null }]]) && !("type" in c.unitStudies.harv.activities[0]), w.writes);
  const k = world({ mom: false, dom }); vm.runInContext("uakPicked", k.ctx)["harv-d2"] = "link"; k.ctx.utaaEdit("harv", "d2"); ok("not Mom: ✎ writes nothing", k.writes.length === 0);
  const d = world({ dry: true, dom }); d.ctx.uakPick("harv-d2", "print"); d.ctx.utaaEdit("harv", "d2"); ok("dry run: ✎ writes nothing", d.writes.length === 0 && d.ctx.unitStudies.harv.activities[0].type === "print");
}

console.log("\n── the day card: unchanged for every kind ──");
{
  const A = world(), B = world({ before: true });
  const g = c => ({ day: c.utRef("harv", c.utDay(c.unitStudies.harv, "d2")), u: c.unitStudies.harv, first: null, present: [] });
  ok("no type: dcDayHTML byte-identical to the tree minus UACTKIND", A.ctx.dcDayHTML(g(A.ctx)) === B.ctx.dcDayHTML(g(B.ctx)));
}

console.log("\n── the Units page ──");
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
const RUD = extract("function renderUnitDetail(");
const REAL = ["_unitActs", "_nbActKeys", "unitActPoints"].map(fn).join("\n");
function page(u, mom, withKind) {
  const stubs = `const ROSTER=["k1","k2"]; function momHere(){ return ${!!mom}; } function cap(s){ return s; } function unitCardStatus(){ return {lbl:"",c:"#ccc"}; }
    function unitPlanNudges(){ return []; } function unitSprintRounds(){ return []; } const masteryData={}; function utMom(){ return momHere(); } function utEsc(s){ return String(s); } function utJ(s){ return String(s); }`;
  const shim = new Proxy({}, { has: (t, k) => typeof k === "string" && !(k in globalThis) && !/^uak|^UAK/.test(k), get: (t, k) => (k === Symbol.unscopables ? undefined : () => "") });
  return new Function("SHIM", "with(SHIM){\n" + stubs + "\n" + REAL + "\n" + (withKind ? BLK : "") + "\n" + RUD + "\nreturn renderUnitDetail;\n}")(shim)(u);
}
for (const mom of [true, false]) {
  const who = mom ? "Mom" : "a kid";
  const u = UNIT(); u.activities.push({ key: "leaf_hunt", title: "Leaf hunt", emoji: "🍁", kind: "sheet", points: 5, day: 1 });
  const a = page(u, mom, true), b = page(u, mom, false);
  ok(who + ": no type → the page is the tree minus UACTKIND with only the section name changed", a === b.replace(">🎨 Activities</div>", ">📓 Notebook activities</div>") && a !== b && a.indexOf("📓 Notebook activities") > 0, [a.length, b.length]);
  const u2 = UNIT(); u2.activities.push({ key: "pumpkin_video", title: "Pumpkin video", emoji: "🎨", kind: "sheet", points: 3, day: 1, type: "link" }, { key: "salt", title: "Salt crystals", emoji: "🎨", kind: "sheet", points: 5, type: "hands" });
  const c = page(u2, mom, true);
  const rows = c.split('<div style="border:1px solid var(--border);border-radius:10px;padding:10px 12px;margin-top:8px">').slice(1);
  ok(who + ": a unit with other kinds → the section reads 🎨 Activities; 🔗 and 🧪 rows carry their chip, the 📓 row none", c.indexOf(">🎨 Activities</div>") > 0 && rows.length === 3 && rows[0].indexOf("data-uak-chip") < 0 && /data-uak-chip="link"[^>]*>🔗 Web link</.test(rows[1]) && /data-uak-chip="hands"[^>]*>🧪 Hands-on</.test(rows[2]));
  ok(who + ": 🖨 Print hides on the 🔗 row only (📓 and 🧪 keep it)", rows[0].split("🖨 Print").length === 3 && rows[1].indexOf("🖨 Print") < 0 && rows[2].split("🖨 Print").length === 3);
  if (mom) ok("Mom: 📓 Notebook hides on the 🔗 row; ✓ Done stays on every row", rows[1].indexOf("📓 Notebook") < 0 && rows[0].split("📓 Notebook").length === 3 && rows.every(r => r.split("✓ Done").length === 3));
}
{
  const u = UNIT(); u.activities[0].type = "screen"; u.nbActivity = { k1: { corn_maze: true } };
  const h = page(u, true, true); ok("a 📱 activity already queued: Mom can still 📓 Unqueue it", h.indexOf("📓 Unqueue") > 0 && h.indexOf("📓 Notebook<") < 0);
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
