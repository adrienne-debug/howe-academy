// 🖼 UNITDRAWN — her rule 2026-11-16: "It needs to show in the units page what it is going to show on the actual drills and
// study sessions for all units … if someone uploads something into units, that needs to be able to be shown."
// (Her report: every Geography Path tile showed the unit's 🌍 — code-drawn {svg} pictures the tile didn't know.)
// Runs the real UNITDRAWN block with the real _mastVisNorm / mastLiveVisual / mastGetVisual / mastShapeVis and checks:
//  · unitCardFace order: unit photo (first of several) → unit emoji → unit drawing → an enrolled kid's stamped card
//    picture → built-in (animal emoji, colour swatch, shape) → nothing;
//  · AGREEMENT: for every card, what the Units page shows is what an enrolled kid's drill card shows (mastLiveVisual),
//    whenever the kid has no picture of his own — photo, emoji and drawing alike;
//  · a Units upload (photo) beats the old stamped copy on the kid's card AND on the tile;
//  · a kid's own picture: his card shows it; the card sheet names him; the tile keeps the unit's;
//  · the tile, the card sheet (no photo → the same face; a photo picked still wins; buttons still read `cur`) and the
//    Mastery list/picker (a drawn picture shows) all use it; display only — nothing in the block writes.
const fs = require("fs"), path = require("path");
const FILE = process.env.UNITS_SRC || path.join(__dirname, "index.html");
const src = fs.readFileSync(FILE, "utf8");
const HoweGeo = require(path.join(path.dirname(FILE), "geo.js"));
let pass = 0, fail = 0;
function ok(name, cond, extra) { if (cond) { pass++; console.log("  ok  - " + name); } else { fail++; console.log("  FAIL- " + name + (extra !== undefined ? "  " + JSON.stringify(extra).slice(0, 300) : "")); } }
const line = (needle) => { const s = src.indexOf(needle); return src.slice(s, src.indexOf("\n", s) + 1); };
const sliceFn = (name) => { const s = src.indexOf("function " + name + "("); const e = src.indexOf("\n}\n", s); return src.slice(s, e + 3); };

const b0 = src.indexOf("// UNITDRAWN_START"), b1 = src.indexOf("// UNITDRAWN_END");
ok("UNITDRAWN block present once", b0 > 0 && b1 > b0 && src.indexOf("// UNITDRAWN_START", b0 + 1) < 0);
const block = src.slice(b0, b1);
ok("the block writes nothing (no database, storage or card writes)", !/db\.ref|firebase|localStorage|HA_LS|mastPutCards|\.update\(|\.remove\(|\.push\(/.test(block));
ok("no kid names in the block", !/\b(julian|lincoln|ellis|lucy|taylor|makenzie|andrew|caleb)\b/i.test(block));

const code = [line("const MAST_ANIMAL_EMOJI="), line("const MAST_COLOR_MAP="), line("function mastColorBorder("), line("const MAST_SHAPE_SIDES="), sliceFn("mastShapePoly"), sliceFn("mastShapeVis"),
  line("function _mastVisNorm("), sliceFn("mastLiveVisual"), line("function mastItemStampVisual("), sliceFn("mastGetVisual"), block].join("\n");
function world(mastery, units) {
  const f = new Function("masteryData", "unitStudies", "masteryKid", code +
    "\nreturn {unitCardFace, unitFaceHTML, unitOwnPicKids, unitDrawnPic, mastLiveVisual, mastShapeVis};");
  return f(mastery, units, "kidA");
}
const SVG = HoweGeo.svg("word", "isthmus"), PHOTO = "https://img.example/cat.jpg", OLD = "https://img.example/old-wiki.jpg";
ok("geo.js pictures are data:image/svg+xml URIs", /^data:image\/svg\+xml/.test(SVG));
const U = { id: "u1", emoji: "🌍", enrolled: { kidA: true, kidB: true },
  decks: [{ key: "Cats", cards: [{ name: "Lion" }, { name: "Lynx" }, { name: "Ocelot" }, { name: "Serval" }, { name: "Margay" }] },
          { key: "Geography", cards: [{ name: "isthmus" }] }, { key: "Colors", cards: [{ name: "Red" }] }, { key: "Shapes", cards: [{ name: "Hexagon" }] }],
  visuals: { "Cats_Lynx": { imageUrl: PHOTO, credit: "x", more: ["https://img.example/2.jpg"] }, "Cats_Ocelot": "🐆", "Geography_isthmus": { svg: SVG, credit: "" } } };
const M = { kidA: [{ subject: "Cats", prompt: "Lynx", imageUrl: OLD }, { subject: "Cats", prompt: "Serval", imageUrl: OLD }, { subject: "Geography", prompt: "isthmus" },
                   { subject: "Cats", prompt: "Ocelot" }, { subject: "Cats", prompt: "Lion" }, { subject: "Colors", prompt: "Red" }, { subject: "Shapes", prompt: "Hexagon" }, { subject: "Cats", prompt: "Margay" }],
            kidB: [{ subject: "Cats", prompt: "Margay", imageUrl: OLD }] };
const W = world(M, { u1: U });
const F = (deck, name) => W.unitCardFace(U, deck, name);
ok("1 unit photo → the photo (the first of several)", F("Cats", "Lynx") && F("Cats", "Lynx").img === PHOTO);
ok("2 unit emoji → the emoji", F("Cats", "Ocelot") && F("Cats", "Ocelot").emoji === "🐆");
ok("3 unit drawing → the drawing", F("Geography", "isthmus") && F("Geography", "isthmus").img === SVG);
ok("4 no unit picture → an enrolled kid's stamped card picture", F("Cats", "Serval") && F("Cats", "Serval").img === OLD);
ok("4b … found on the second enrolled kid too", F("Cats", "Margay") && F("Cats", "Margay").img === OLD);
ok("5 built-in animal emoji (Lion)", F("Cats", "Lion") && F("Cats", "Lion").emoji === "\u{1F981}");
ok("5 built-in colour swatch", F("Colors", "Red") && /#ef4444/.test(F("Colors", "Red").html));
ok("5 built-in shape", F("Shapes", "Hexagon") && F("Shapes", "Hexagon").html === W.mastShapeVis("Hexagon", 26) && !!F("Shapes", "Hexagon").html);
ok("6 nothing → null (tile keeps the unit emoji)", W.unitCardFace({ decks: [], enrolled: {} }, "Cats", "Nobody") === null);
ok("a Units upload beats the old stamped copy (Lynx: unit photo, card stamp is old)", F("Cats", "Lynx").img === PHOTO);

// AGREEMENT with the drill card: for every card, the Units face is what an enrolled kid's drill card shows (the unit's
// picture is the same for every kid; with none, the face is the one a kid's stamped card shows), or the built-in drawing.
let agree = 0, checked = 0;
U.decks.forEach(d => d.cards.forEach(c => { const unit = W.unitCardFace(U, d.key, c.name); checked++;
  const cards = ["kidA", "kidB"].map(k => { const it = M[k].find(i => i.subject === d.key && i.prompt === c.name); return it ? W.mastLiveVisual(it, k) : null; });
  const same = (unit && unit.from === "builtin" && cards.every(x => !x)) || cards.some(x => x && unit && ((x.img && x.img === unit.img) || (x.emoji && x.emoji === unit.emoji)));
  if (same) agree++; else console.log("     differs:", d.key, c.name, cards, unit); }));
ok("the Units face is an enrolled kid's drill picture on every card (" + agree + "/" + checked + ")", checked === 8 && agree === checked);
const kidAMargay = W.mastLiveVisual(M.kidA.find(i => i.prompt === "Margay"), "kidA"), kidBMargay = W.mastLiveVisual(M.kidB[0], "kidB");
ok("unit picture present → every enrolled kid's card shows the same one (Lynx, both kids)", W.mastLiveVisual({ subject: "Cats", prompt: "Lynx" }, "kidB").img === PHOTO && W.mastLiveVisual(M.kidA[0], "kidA").img === PHOTO);
ok("(no unit picture, kids differ: the tile shows the one a kid's card has — Margay)", !kidAMargay && kidBMargay.img === OLD && F("Cats", "Margay").img === OLD);

// A kid's own picture.
const M2 = JSON.parse(JSON.stringify(M)); M2.kidA_visuals = { "Cats_Lynx": "🐈" };
const W2 = world(M2, { u1: U });
ok("own picture: his drill card shows his own", W2.mastLiveVisual(M2.kidA[0], "kidA").emoji === "🐈");
ok("own picture: the tile keeps the unit's photo", W2.unitCardFace(U, "Cats", "Lynx").img === PHOTO);
ok("own picture: unitOwnPicKids names him (and only him)", JSON.stringify(W2.unitOwnPicKids(U, "Cats_Lynx")) === '["kidA"]' && W2.unitOwnPicKids(U, "Cats_Ocelot").length === 0);

// unitFaceHTML
const hSvg = W.unitFaceHTML({ img: SVG }, 46, 7, "1px solid #ccc"), hPh = W.unitFaceHTML({ img: PHOTO }, 46, 7, "1px solid #ccc");
ok("HTML: a drawing → contain on white; a photo → cover", /object-fit:contain;background:#fff/.test(hSvg) && /object-fit:cover/.test(hPh));
ok("HTML: emoji and built-in html sit in a box", /🐆/.test(W.unitFaceHTML({ emoji: "🐆" }, 46, 7, "x")) && /<svg|<div/.test(W.unitFaceHTML(F("Shapes", "Hexagon"), 46, 7, "x")));
ok("HTML: quotes in a src are escaped", W.unitFaceHTML({ img: 'a"b' }, 46, 7, "x").indexOf('a&quot;b') > 0);
ok("unitDrawnPic: svg only", W.unitDrawnPic({ svg: SVG }) === SVG && W.unitDrawnPic({ svg: SVG, imageUrl: PHOTO }) === "" && W.unitDrawnPic("🐆") === "" && W.unitDrawnPic(null) === "");

// Wiring
const tileLine = (() => { const i = src.indexOf("UNITDRAWN: the same picture the kids' cards show"); return src.slice(src.lastIndexOf("\n", i) + 1, src.indexOf("\n", i)); })();
ok("the Units tile uses unitCardFace + unitFaceHTML", /unitCardFace\(u,d\.key,c\.name\)/.test(tileLine) && /unitFaceHTML\(_f,46/.test(tileLine));
const sheet = src.slice(src.indexOf("function _unitEditOverlay("), src.indexOf("function unitEditPhoto("));
ok("the card sheet: a photo (saved or just picked) first, else unitCardFace", /const _f=cur\?null:unitCardFace\(u,deck\.key,card\.name\)/.test(sheet) && /const face=cur \?/.test(sheet));
ok("the card sheet: `cur` unchanged; buttons + extras still read it", /const cur=unitEdit\.newImg \|\| \(existing&&typeof existing==="object"&&existing\.imageUrl\) \|\| null;/.test(sheet) && /\(cur\?"Change photo":"Add photo"\)/.test(sheet) && /unitMorePicsHtml\(u,key,cur\)/.test(sheet));
ok("the card sheet names a kid with his own picture", /unitOwnPicKids\(u,key\)/.test(sheet) && /_ownNote/.test(sheet));
ok("Mastery list + picker show a drawn picture", (src.match(/else if\(unitDrawnPic\((avVis|curVis)\)\)/g) || []).length === 2);

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
