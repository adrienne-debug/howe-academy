// 🎨 UTADDACT — add an activity to a saved unit's day (Sara, a beta mom, 2026-11-09: "I did click on the unit and the day but then
//   I could not see where I could add an activity"). Runs the REAL UNITTRACK + UTADDACT blocks against a fake db that records paths.
//   · + Add writes exactly two targeted paths in ONE update — activities/<next index> (the Builder's record shape) and
//     track/days/<i>/nb = {activity:key} — never a whole-node set of activities or track
//   · a second + Add on a day that already names an activity does nothing; ✎ Save is that door, and it never touches nb
//   · the key is slugged like ubSlug and suffixed _2 when the unit already has it
//   · not Mom → nothing changes; dry run → the unit changes on screen, nothing written
//   · the day editor shows the box (+ Add on an empty day, ✎ on a day with one); dcActivity finds the new record by nb
//   run: node test_unit_add_activity.js
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const cut = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error("markers " + a); return src.slice(i, j); };
const fn = name => { const i = src.indexOf("function " + name + "("); if (i < 0) throw new Error("no " + name); let d = 0, j = i, seen = false; for (; j < src.length; j++) { const c = src[j]; if (c === "{") { d++; seen = true; } else if (c === "}") { d--; if (seen && d === 0) break; } } return src.slice(i, j + 1); };
const UT = cut("// UNITTRACK_START", "// UNITTRACK_END"), AA = cut("// UTADDACT_START", "// UTADDACT_END");
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x) : "")); } };
const J = x => JSON.stringify(x);
const UNIT = () => ({ id: "thanksgiving", title: "Thanksgiving", emoji: "🦃", enrolled: { kid1: true }, decks: [{ key: "Thanksgiving", cards: [{ name: "Wampanoag" }] }],
  activities: [{ key: "hand_turkey", title: "Hand turkey", emoji: "🎨", kind: "sheet", points: 5, day: 2 }],
  track: { mode: "seq", perWeek: 4, days: [
    { id: "d1", n: 1, t: "Who were the Wampanoag?" },
    { id: "d2", n: 2, t: "Hand turkey day", nb: { activity: "hand_turkey" } },
    { id: "d3", n: 3, t: "Plymouth" }] } });
function world(o) {
  o = o || {}; const writes = []; const dom = o.dom || {};
  const ctx = { console, JSON, Object, Array, String, Number, Math, Set, Map, RegExp, Date, parseInt, isNaN, isFinite, WeakMap,
    unitStudies: { thanksgiving: o.unit || UNIT() }, momHere: () => o.mom !== false, _dryRun: () => !!o.dry,
    db: { ref: p => ({ set: v => writes.push(["set", p === undefined ? "" : p, JSON.parse(J(v === undefined ? null : v))]), update: v => writes.push(["update", p === undefined ? "" : p, JSON.parse(J(v))]) }) },
    renderAll: () => { ctx.repaints = (ctx.repaints || 0) + 1; }, repaints: 0, document: { getElementById: id => (id in dom) ? dom[id] : null } };
  vm.createContext(ctx);
  vm.runInContext(UT + "\n" + AA + "\n" + fn("ubSlug") + "\n" + fn("dcActivity") + "\n" + fn("_unitActs"), ctx);
  return { ctx, writes, dom };
}
const PATH_ACT = "unitStudies/thanksgiving/activities/1", PATH_NB = "unitStudies/thanksgiving/track/days/0/nb";

console.log("── the block ──");
ok("UTADDACT is a marked block with its own functions; the day editor hooks it in under the craft", AA.length > 500 && /function utaaAdd\(/.test(AA) && /function utaaEdit\(/.test(AA) && /function utaaEditorHTML\(/.test(AA) && /utaaEditorHTML\(u,d\)/.test(UT));
ok("the block writes through db only when live (db && !_dryRun), one multi-path update, no whole-node set, no interval or listener", /db\.ref\(\)\.update\(upd\)/.test(AA) && !/\.set\(/.test(AA) && !/setInterval|addEventListener|\.on\(/.test(AA) && /_dryRun/.test(AA));
ok("the slug rule is ubSlug's", (() => { const c = world().ctx; return ["Gratitude Scavenger Hunt!", "  Make a  thankful-tree ", "Día de Gracias"].every(s => c.utaaSlug(s) === c.ubSlug(s)); })());

console.log("\n── + Add on a day without an activity ──");
{
  const w = world({ dom: { "utaa-thanksgiving-d1-line": { value: "Gratitude scavenger hunt | 8 | Find one thing you're thankful for in each room" } } }), c = w.ctx;
  const r = c.utaaAdd("thanksgiving", "d1");
  ok("returns true, ONE write, a multi-path update at the root", r === true && w.writes.length === 1 && w.writes[0][0] === "update" && w.writes[0][1] === "", w.writes);
  const upd = w.writes[0][2] || {};
  ok("exactly the two targeted paths: activities/<next free index> and track/days/<i>/nb", J(Object.keys(upd).sort()) === J([PATH_ACT, PATH_NB].sort()), Object.keys(upd));
  ok("the record is the Builder's shape: key, title, emoji 🎨, kind sheet, points, day, desc", J(upd[PATH_ACT]) === J({ key: "gratitude_scavenger_hunt", title: "Gratitude scavenger hunt", emoji: "🎨", kind: "sheet", points: 8, day: 1, desc: "Find one thing you're thankful for in each room" }), upd[PATH_ACT]);
  ok("nb points at the new key", J(upd[PATH_NB]) === J({ activity: "gratitude_scavenger_hunt" }));
  ok("no path is a whole node: nothing at …/activities or …/track", !Object.keys(upd).some(k => /\/activities$|\/track$/.test(k)));
  const u = c.unitStudies.thanksgiving, d1 = c.utDay(u, "d1");
  ok("the unit on screen carries it: activities[1] and day 1's nb; the other activity untouched; one repaint", u.activities.length === 2 && u.activities[0].key === "hand_turkey" && d1.nb.activity === "gratitude_scavenger_hunt" && c.repaints === 1);
  ok("dcActivity finds the new record from the day's nb (the day card's reader, unchanged)", (c.dcActivity({ day: d1, u: u }) || {}).title === "Gratitude scavenger hunt");
  ok("the editor now shows ✎ for that day (title + points + line), not + Add", (() => { const h = c.utaaEditorHTML(u, d1); return /utaaEdit\(/.test(h) && /value="Gratitude scavenger hunt"/.test(h) && /value="8"/.test(h) && !/utaaAdd\(/.test(h); })());
}
console.log("\n── defaults and the key suffix ──");
{
  const w = world({ dom: { "utaa-thanksgiving-d3-line": { value: "Hand turkey" } } }), c = w.ctx;
  ok("points blank → 5 (the Builder's default); no desc field when the line has none; day = the day's n", c.utaaAdd("thanksgiving", "d3") === true && (() => { const a = w.writes[0][2][PATH_ACT]; return a.points === 5 && !("desc" in a) && a.day === 3; })(), w.writes[0]);
  ok("a title the unit already has → key suffixed _2", w.writes[0][2][PATH_ACT].key === "hand_turkey_2" && w.writes[0][2]["unitStudies/thanksgiving/track/days/2/nb"].activity === "hand_turkey_2");
  const w2 = world({ dom: { "utaa-thanksgiving-d3-line": { value: "   |  | " } } });
  ok("an empty title → nothing happens, nothing written", w2.ctx.utaaAdd("thanksgiving", "d3") === false && w2.writes.length === 0);
  const sparse = UNIT(); sparse.activities = { "0": sparse.activities[0], "3": { key: "feast", title: "Feast", emoji: "🎨", kind: "sheet", points: 5, day: 3 } };
  const w3 = world({ unit: sparse, dom: { "utaa-thanksgiving-d1-line": { value: "Thank-you cards | 4" } } });
  ok("activities handed back as an object → next free index is max+1 (4), the record lands under it", w3.ctx.utaaAdd("thanksgiving", "d1") === true && "unitStudies/thanksgiving/activities/4" in w3.writes[0][2] && w3.ctx.unitStudies.thanksgiving.activities["4"].key === "thank_you_cards");
}
console.log("\n── a day that already names an activity ──");
{
  const w = world({ dom: { "utaa-thanksgiving-d2-line": { value: "Something else | 9" } } }), c = w.ctx;
  ok("+ Add on day 2 (nb = hand_turkey) does nothing: nb keeps its key, no record added, nothing written", c.utaaAdd("thanksgiving", "d2") === false && w.writes.length === 0 && c.utDay(c.unitStudies.thanksgiving, "d2").nb.activity === "hand_turkey" && c.unitStudies.thanksgiving.activities.length === 1);
  ok("its editor shows ✎ with the current title and points, and no + Add box", (() => { const h = c.utaaEditorHTML(c.unitStudies.thanksgiving, c.utDay(c.unitStudies.thanksgiving, "d2")); return /value="Hand turkey"/.test(h) && /value="5"/.test(h) && !/-line"/.test(h); })());
  Object.assign(w.dom, { "utaa-thanksgiving-d2-title": { value: "Hand turkey card" }, "utaa-thanksgiving-d2-points": { value: "7" }, "utaa-thanksgiving-d2-desc": { value: "Write one thank-you inside" } });
  ok("✎ Save writes only the changed fields under activities/0 in ONE update — never nb, never the whole record", c.utaaEdit("thanksgiving", "d2") === true && w.writes.length === 1 && w.writes[0][0] === "update" && J(w.writes[0][2]) === J({ "unitStudies/thanksgiving/activities/0/title": "Hand turkey card", "unitStudies/thanksgiving/activities/0/points": 7, "unitStudies/thanksgiving/activities/0/desc": "Write one thank-you inside" }), w.writes);
  ok("the record on screen changed; nb still hand_turkey; a second ✎ Save with the same boxes writes nothing", c.unitStudies.thanksgiving.activities[0].title === "Hand turkey card" && c.utDay(c.unitStudies.thanksgiving, "d2").nb.activity === "hand_turkey" && c.utaaEdit("thanksgiving", "d2") === false && w.writes.length === 1);
  w.dom["utaa-thanksgiving-d2-desc"].value = "";
  ok("clearing the line sets desc null at its own path", c.utaaEdit("thanksgiving", "d2") === true && J(w.writes[1][2]) === J({ "unitStudies/thanksgiving/activities/0/desc": null }) && !("desc" in c.unitStudies.thanksgiving.activities[0]));
}
console.log("\n── not Mom, dry run ──");
{
  const dom = { "utaa-thanksgiving-d1-line": { value: "Gratitude scavenger hunt | 8" }, "utaa-thanksgiving-d2-title": { value: "X" }, "utaa-thanksgiving-d2-points": { value: "1" }, "utaa-thanksgiving-d2-desc": { value: "" } };
  const nm = world({ mom: false, dom });
  ok("not Mom: + Add and ✎ do nothing, nothing written, the editor box is not rendered", nm.ctx.utaaAdd("thanksgiving", "d1") === false && nm.ctx.utaaEdit("thanksgiving", "d2") === false && nm.writes.length === 0 && nm.ctx.unitStudies.thanksgiving.activities.length === 1 && nm.ctx.utaaEditorHTML(nm.ctx.unitStudies.thanksgiving, nm.ctx.utDay(nm.ctx.unitStudies.thanksgiving, "d1")) === "");
  const dr = world({ dry: true, dom });
  ok("dry run: the unit changes on screen, nothing written", dr.ctx.utaaAdd("thanksgiving", "d1") === true && dr.ctx.utaaEdit("thanksgiving", "d2") === true && dr.writes.length === 0 && dr.ctx.unitStudies.thanksgiving.activities.length === 2);
  const nodb = world({ dom }); nodb.ctx.db = null;
  ok("no db: same, nothing thrown", nodb.ctx.utaaAdd("thanksgiving", "d1") === true && nodb.writes.length === 0);
}
console.log("\n── the day editor renders the box ──");
{
  const c = world().ctx, u = c.unitStudies.thanksgiving;
  const h1 = c.utEditorHTML(u, c.utDay(u, "d1")), h2 = c.utEditorHTML(u, c.utDay(u, "d2"));
  ok("day 1's editor carries 🎨 Activity on this day with the one-line box and + Add, under the note's neighbours", /Activity on this day/.test(h1) && /utaa-thanksgiving-d1-line/.test(h1) && /utaaAdd\('thanksgiving','d1'\)/.test(h1) && h1.indexOf("data-utaa-editor") < h1.indexOf("ut-e-note"));
  ok("day 2's editor carries ✎ Save the activity", /utaaEdit\('thanksgiving','d2'\)/.test(h2) && /Save the activity/.test(h2));
  ok("plain text, no shuffle emoji, no kid's name", !/🔀/.test(AA) && !/lincoln|ellis|lucy|julian|taylor|makenzie|andrew|caleb/i.test(AA));
}
console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
