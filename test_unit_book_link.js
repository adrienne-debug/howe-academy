// 📘 UNITBOOK — her report 2026-11-16: "the geography and maybe others says math book as an option to link up which makes zero
// sense." A book link only does something for a unit whose cards follow the kid's book (cardLessons — All About Spelling) or
// a stage with a book map whose deck is in that stage (UNIT_BOOK_MAPS — Math Fluency, Abeka at Stage 6). Checks:
//  · _ustUsesBook / _ustBookMaps on a geography-like unit (never), a maths-like unit (only the mapped stage), a spelling unit
//    (every stage); a map is offered only when its deck is in the stage;
//  · the Start form shows the book row only where it works, and lists only usable maps;
//  · Start saves no book (and no map) for a stage that can't use one, and keeps it where it can;
//  · the block writes nothing; no kid names.
const fs = require("fs"), path = require("path");
const src = fs.readFileSync(process.env.UNITS_SRC || path.join(__dirname, "index.html"), "utf8");
let pass = 0, fail = 0;
function ok(name, cond, extra) { if (cond) { pass++; console.log("  ok  - " + name); } else { fail++; console.log("  FAIL- " + name + (extra !== undefined ? "  " + JSON.stringify(extra).slice(0, 300) : "")); } }
const line = (needle) => { const s = src.indexOf(needle); return src.slice(s, src.indexOf("\n", s) + 1); };
const sliceFn = (name) => { const s = src.indexOf("function " + name + "("); const e = src.indexOf("\n}\n", s); return src.slice(s, e + 3); };
const b0 = src.indexOf("// UNITBOOK_START"), b1 = src.indexOf("// UNITBOOK_END");
ok("UNITBOOK block present once", b0 > 0 && b1 > b0 && src.indexOf("// UNITBOOK_START", b0 + 1) < 0);
const block = src.slice(b0, b1);
ok("the block writes nothing", !/db\.ref|localStorage|HA_LS|\.update\(|\.set\(/.test(block));
ok("no kid names in the block", !/\b(julian|lincoln|ellis|lucy|taylor|makenzie|andrew|caleb)\b/i.test(block));
const maps = src.slice(src.indexOf("const UNIT_BOOK_MAPS={"), src.indexOf("\n};\n", src.indexOf("const UNIT_BOOK_MAPS={")) + 4);
const H = new Function(maps + line("function _ustCards(") + block + "\nreturn {_ustUsesBook,_ustBookMaps,UNIT_BOOK_MAPS};")();
const mapStage = Object.values(H.UNIT_BOOK_MAPS)[0].stage;
ok("there is a book map to test with (stage " + mapStage + ")", Object.keys(H.UNIT_BOOK_MAPS).length >= 1 && mapStage > 0);
const geo = { decks: [{ key: "Continents", cards: [{ name: "Asia", stage: 1 }] }, { key: "Geography", cards: [{ name: "peak", stage: 4 }] }, { key: "Countries", cards: [{ name: "Peru", stage: mapStage }] }] };
const math = { decks: [{ key: "Numbers", cards: [{ name: "1", stage: 1 }] }, { key: "Math Facts", cards: [{ name: "2+2", stage: mapStage }] }] };
const aas = { cardLessons: true, decks: [{ key: "AAS Words", cards: [{ name: "cat", stage: 1 }, { name: "ship", stage: 2 }] }] };
ok("geography-like: no book at any stage (even the mapped stage number — no maths deck there)", [1, 4, mapStage].every(n => !H._ustUsesBook(geo, n)) && H._ustBookMaps(geo, mapStage).length === 0);
ok("maths-like: the mapped stage uses a book; an earlier stage doesn't", H._ustUsesBook(math, mapStage) && !H._ustUsesBook(math, 1));
ok("maths-like: the mapped stage lists its map", JSON.stringify(H._ustBookMaps(math, mapStage)) === JSON.stringify(Object.keys(H.UNIT_BOOK_MAPS).filter(id => H.UNIT_BOOK_MAPS[id].stage === mapStage)));
ok("spelling (cardLessons): every stage uses the book", H._ustUsesBook(aas, 1) && H._ustUsesBook(aas, 2));
ok("no unit → false", !H._ustUsesBook(null, 1));

const form = src.slice(src.indexOf("const subs=Object.keys((((currData||{}).subjects||{})[k])||{});"), src.indexOf("h+='</div>';", src.indexOf("const subs=Object.keys((((currData||{}).subjects||{})[k])||{});")));
ok("the Start form's book row is guarded by _ustUsesBook", /if\(_ustUsesBook\(u,f\.stage\)\) h\+='<span>'\+\(u\.cardLessons\?'Their book \(subject\)':'Math book'\)/.test(form));
ok("the map row lists only usable maps, and only when there are some", /const maps=_ustBookMaps\(u,f\.stage\);/.test(form) && /if\(f\.subject&&!u\.cardLessons&&maps\.length\)/.test(form));

// Start: run the real unitStageEnroll with stubs that record what it would save.
function enroll(u, f) {
  const seen = {};
  const run = new Function("momHere", "unitStageForm", "unitStudies", "_ustApply", "_ustWrite", "_ustDone", "_wrEnrollLocked", "envEnrollSession", "envMirrorOn",
    maps + line("function _ustCards(") + block + sliceFn("unitStageEnroll") + "\nunitStageEnroll();");
  run(() => true, f, { u1: u }, (uu, kid, st, kn, sub, map) => { seen.apply = { sub, map }; return { gate: !!(sub && map) }; }, (id, kid, w, rec) => { seen.rec = rec; }, () => {}, () => false, undefined, undefined);
  return seen;
}
const g = enroll(Object.assign({ enrolled: {} }, geo), { unitId: "u1", kid: "kidA", stage: 1, knows: "", subject: "math_book", map: "x" });
ok("geography Start: no book and no map passed or saved", g.apply && g.apply.sub === "" && g.apply.map === "" && g.rec.subject === "" && g.rec.map === "", g);
const mid = Object.keys(H.UNIT_BOOK_MAPS)[0];
const m = enroll(Object.assign({ enrolled: {} }, math), { unitId: "u1", kid: "kidA", stage: mapStage, knows: "", subject: "math_book", map: mid });
ok("maths Start at the mapped stage: book + map kept", m.apply.sub === "math_book" && m.apply.map === mid && m.rec.subject === "math_book" && m.rec.map === mid, m);
const m1 = enroll(Object.assign({ enrolled: {} }, math), { unitId: "u1", kid: "kidA", stage: 1, knows: "", subject: "math_book", map: "" });
ok("maths Start at an unmapped stage: no book saved", m1.rec.subject === "", m1);
const a = enroll(Object.assign({ enrolled: {} }, aas), { unitId: "u1", kid: "kidA", stage: 1, knows: "", subject: "spelling", map: "" });
ok("spelling Start: the book is kept", a.apply.sub === "spelling" && a.rec.subject === "spelling", a);

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
