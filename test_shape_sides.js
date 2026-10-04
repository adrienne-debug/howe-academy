// SHAPE_SIDES — Julian's polygon drill: tap each side to count the sides (2026-09-27).
// Slices the real MAST_SHAPE_SIDES / mastShapePoly / mastShapeVis / mastShapeSidesVis and the
// tap handlers out of index.html and drives them against a tiny fake DOM:
//   - the sides map is exactly the eight straight-sided drill shapes
//   - the Hexagon drill SVG has 6 tappable side segments (one per edge)
//   - a tap lights a side and the count follows; tapping a lit side counts back down
//   - all sides lit -> ✓ shows and the number pulses once; ↺ clears everything
//   - the render's sync clears the count when the card on screen changes, keeps it otherwise
//   - Circle / Oval / Heart / Star draw exactly as before and get no side segments
//   - side and ↺ handlers stopPropagation (the flip/score buttons must not fire)
//   - wiring: the slideshow big visual uses the drill, HQ thumbnails stay static, px sizes only
// Run: node test_shape_sides.js
const fs = require("fs");
const src = fs.readFileSync(__dirname + "/index.html", "utf8");

let pass = 0, fail = 0;
function ok(cond, name, detail) {
  if (cond) { pass++; console.log("  ✓ " + name); }
  else { fail++; console.log("  ✗ " + name + (detail ? "  → " + detail : "")); }
}

// ── slice the feature block + mastShapeVis ────────────────────────────────────────────────
const bs = src.indexOf("// SHAPE_SIDES_START"), be = src.indexOf("// SHAPE_SIDES_END");
ok(bs > 0 && be > bs, "SHAPE_SIDES_START / _END markers present");
const block = src.slice(bs, be);
function fnBlock(name) {
  const i = src.indexOf("function " + name + "(");
  let d = 0;
  for (let k = src.indexOf("{", i); k < src.length; k++) {
    if (src[k] === "{") d++;
    else if (src[k] === "}") { d--; if (d === 0) return src.slice(i, k + 1); }
  }
}
// `const`/`let` inside eval stay in the eval scope — hoist onto globalThis so the sliced
// functions (and this test) can see them.
eval(block.replace(/\bconst MAST_SHAPE_SIDES=/, "globalThis.MAST_SHAPE_SIDES=")
          .replace(/\blet mastSides=/, "globalThis.mastSides=")
          .replace(/\bmastSides=\{/g, "globalThis.mastSides={"));
eval(fnBlock("mastShapeVis"));
// mastShapeVis's tail references helpers only for the 2026-08-17 bank; not needed here.

// ── 1. sides map ─────────────────────────────────────────────────────────────────────────
// + Heptagon and Nonagon (her yes 2026-10-04) — they already had polygon geometry, now they get the drill too
const want = { Triangle: 3, Square: 4, Rectangle: 4, Diamond: 4, Pentagon: 5, Hexagon: 6, Heptagon: 7, Octagon: 8, Nonagon: 9, Decagon: 10 };
ok(JSON.stringify(MAST_SHAPE_SIDES) === JSON.stringify(want), "sides map is exactly the ten straight-sided shapes", JSON.stringify(MAST_SHAPE_SIDES));
for (const [nm, n] of Object.entries(want)) {
  const p = mastShapePoly(nm, 210);
  ok(p && p.pts.length === n, nm + " polygon has " + n + " corners");
}
ok(mastShapePoly("Circle", 210) === null && mastShapePoly("Oval", 210) === null, "Circle/Oval have no polygon geometry");

// ── 2. Hexagon drill SVG: 6 side segments, finger-wide hit strokes ───────────────────────
mastSides = { key: null, on: {} };
const hex = mastShapeSidesVis("Hexagon", 210, "hex1");
const sideCount = (hex.match(/<g data-side="\d+"/g) || []).length;
ok(sideCount === 6, "Hexagon drill has 6 tappable side segments", String(sideCount));
ok((hex.match(/<polygon /g) || []).length === 1, "…over one filled polygon");
ok((hex.match(/stroke="transparent" stroke-width="(\d+)"/g) || []).length === 6, "…each side has a transparent hit stroke");
const hitW = parseInt((hex.match(/stroke="transparent" stroke-width="(\d+)"/) || [])[1], 10);
ok(hitW >= 28, "hit stroke is finger-wide (≥28px)", String(hitW));
ok(/data-sides-num/.test(hex) && /data-sides-done/.test(hex) && /data-sides-reset/.test(hex), "number, ✓ and ↺ are in the wrapper");
ok(/data-sides-wrap data-key="hex1" data-n="6"/.test(hex), "wrapper carries the card key and n");
ok(!/cqw|cqh|vw|vh/.test(hex), "no container/viewport units in the drill markup");
ok(/width="210" height="210"/.test(hex), "Hexagon drawn at the 210px card size");
// Rectangle keeps the wide box (1.6:1) the CSS version had
ok(/width="336" height="210"/.test(mastShapeSidesVis("Rectangle", 210, "r")), "Rectangle drill is 336×210 (same 1.6:1 box as before)");

// ── fake DOM built from the real markup ──────────────────────────────────────────────────
function mkEl(attrs, parent) {
  const el = {
    attrs, parent, style: {}, textContent: "", children: [],
    _cls: new Set(),
    classList: { add: c => el._cls.add(c), remove: c => el._cls.delete(c), contains: c => el._cls.has(c) },
    getAttribute: a => (a in attrs ? String(attrs[a]) : null),
    matches: sel => { const m = sel.match(/^\[([\w-]+)\]$/); return !!m && m[1] in attrs; },
    closest(sel) { let e = el; while (e) { if (e.matches(sel)) return e; e = e.parent; } return null; },
    querySelectorAll(sel) { const out = []; (function walk(e) { e.children.forEach(c => { if (c.matches(sel)) out.push(c); walk(c); }); })(el); return out; },
    querySelector(sel) { return el.querySelectorAll(sel)[0] || null; }
  };
  if (parent) parent.children.push(el);
  return el;
}
function buildWrap(html) {
  const m = html.match(/data-sides-wrap data-key="([^"]*)" data-n="(\d+)"/);
  const wrap = mkEl({ "data-sides-wrap": "", "data-key": m[1], "data-n": m[2] });
  const row = mkEl({}, wrap);
  const num = mkEl({ "data-sides-num": "" }, row);
  num.textContent = (html.match(/data-sides-num[^>]*>([^<]*)</) || [])[1] || "";
  mkEl({ "data-sides-done": "" }, row);
  mkEl({ "data-sides-reset": "" }, row);
  const svg = mkEl({}, wrap);
  const re = /<g data-side="(\d+)"[^>]*>\s*<line data-side-hl [^>]*style="opacity:(\d)/g; let g;
  while ((g = re.exec(html))) { const grp = mkEl({ "data-side": g[1] }, svg); const hl = mkEl({ "data-side-hl": "" }, grp); hl.style.opacity = g[2]; }
  return wrap;
}
const side = (wrap, i) => wrap.querySelectorAll("[data-side]")[i];
const lit = wrap => wrap.querySelectorAll("[data-side-hl]").filter(h => h.style.opacity === "1").length;
const numOf = wrap => wrap.querySelector("[data-sides-num]");

// ── 3. tap toggles a side; the count follows ─────────────────────────────────────────────
mastSides = { key: null, on: {} };
let w = buildWrap(mastShapeSidesVis("Hexagon", 210, "hex1"));
ok(w.querySelectorAll("[data-side]").length === 6, "fake DOM has the 6 sides");
mastSideTap(side(w, 0));
ok(mastSidesCount() === 1 && numOf(w).textContent === "1" && lit(w) === 1, "tap side 0 → count 1, one side lit");
mastSideTap(side(w, 3));
ok(mastSidesCount() === 2 && numOf(w).textContent === "2" && lit(w) === 2, "tap side 3 → count 2");
mastSideTap(side(w, 0));
ok(mastSidesCount() === 1 && numOf(w).textContent === "1" && lit(w) === 1 && side(w, 3).querySelector("[data-side-hl]").style.opacity === "1", "tap side 0 again → un-lit, count back to 1 (side 3 still lit)");
ok(w.querySelector("[data-sides-done]").style.opacity === "0", "✓ hidden while sides remain");
ok(w.querySelector("[data-sides-reset]").style.display === "inline-block", "↺ shows once something is lit");
// tap order doesn't matter: the same side lit twice never counts twice
ok(mastSides.key === "hex1", "state is keyed to the card on screen");

// ── 4. all sides → ✓ + one pulse; ↺ resets ───────────────────────────────────────────────
[1, 2, 4, 5, 0].forEach(i => mastSideTap(side(w, i)));
ok(mastSidesCount() === 6 && numOf(w).textContent === "6", "all six lit → count 6");
ok(w.querySelector("[data-sides-done]").style.opacity === "1", "✓ appears when every side is lit");
ok(numOf(w).classList.contains("mast-sides-pulse"), "the number pulses on the finishing tap");
ok(numOf(w).style.color === "#16a34a", "…and turns green");
mastSideTap(side(w, 2));
ok(mastSidesCount() === 5 && !numOf(w).classList.contains("mast-sides-pulse") && w.querySelector("[data-sides-done]").style.opacity === "0", "un-lighting one drops the ✓ and the pulse class");
mastSideTap(side(w, 2));
ok(mastSidesCount() === 6 && numOf(w).classList.contains("mast-sides-pulse"), "re-finishing pulses again (once per finish)");
mastSidesReset(w.querySelector("[data-sides-reset]"));
ok(mastSidesCount() === 0 && numOf(w).textContent === "" && lit(w) === 0, "↺ clears every side and blanks the count");
ok(w.querySelector("[data-sides-reset]").style.display === "none" && w.querySelector("[data-sides-done]").style.opacity === "0", "↺ hides itself and the ✓");

// re-render of the SAME card (e.g. Mom flips it) keeps the lit sides
mastSideTap(side(w, 1)); mastSideTap(side(w, 4));
const again = mastShapeSidesVis("Hexagon", 210, "hex1");
ok((again.match(/style="opacity:1;/g) || []).length === 2 && />2<\/span>/.test(again), "re-rendering the same card keeps 2 lit sides and the count");

// ── 5. card change resets ────────────────────────────────────────────────────────────────
mastSidesSync("hex1");
ok(mastSidesCount() === 2, "sync with the same card key keeps the count");
mastSidesSync("tri9");
ok(mastSidesCount() === 0 && mastSides.key === null, "sync with a different card key clears it");
const fresh = mastShapeSidesVis("Hexagon", 210, "hex1");
ok(!/style="opacity:1;/.test(fresh) && /data-sides-num[^>]*><\/span>/.test(fresh), "coming back to the card starts clean");
// a tap on a card other than the one in memory starts a fresh count for that card
mastSides = { key: "hex1", on: { 0: true, 1: true } };
const w2 = buildWrap(mastShapeSidesVis("Triangle", 210, "tri9"));
mastSideTap(side(w2, 0));
ok(mastSides.key === "tri9" && mastSidesCount() === 1, "tapping a different card's side starts that card at 1");
ok(mastSidesKey({ id: "ju_shapes_hexagon" }, false) === "ju_shapes_hexagon" && mastSidesKey({ id: "x" }, true) === "x|2", "second-look pass has its own key");

// ── 6. Circle / Oval / Heart / Star unchanged ────────────────────────────────────────────
ok(mastShapeVis("Circle", 210) === "\u{1F534}", "Circle still the red-circle emoji");
ok(mastShapeVis("Star", 210) === "\u{2B50}", "Star still the star emoji");
ok(mastShapeVis("Heart", 210) === "❤️", "Heart still the heart emoji");
ok(mastShapeVis("Oval", 210) === '<span style="display:inline-block;width:315px;max-width:80%;height:210px;background:#22c55e;border-radius:50%;vertical-align:middle"></span>', "Oval still the green CSS oval");
["Circle", "Oval", "Heart", "Star"].forEach(nm => {
  const v = mastShapeSidesVis(nm, 210, "k");
  ok(!/data-side/.test(v) && v.indexOf(mastShapeVis(nm, 210)) >= 0, nm + " gets no side segments (plain picture)");
  ok(!(nm in MAST_SHAPE_SIDES), nm + " is not in the sides map");
});
// the converted four are real polygons now, in the same colour family as the regular polygons
["Triangle", "Square", "Rectangle", "Diamond"].forEach(nm => {
  const v = mastShapeVis(nm, 54);
  ok(/^<svg width="\d+" height="54" viewBox="0 0 \d+ 54"/.test(v) && /<polygon points="[^"]+" fill="#[0-9a-f]{6}" stroke="#[0-9a-f]{6}"/.test(v), nm + " static picture is an SVG polygon");
});
// the regular polygons draw exactly the points they always did
{
  const hx = mastShapeVis("Hexagon", 210);
  const c = 105, r = 210 * 0.46, rot = -90 * Math.PI / 180, pts = [];
  for (let i = 0; i < 6; i++) { const a = rot + i * 2 * Math.PI / 6; pts.push((c + r * Math.cos(a)).toFixed(1) + "," + (c + r * Math.sin(a)).toFixed(1)); }
  ok(hx.indexOf('points="' + pts.join(" ") + '"') >= 0 && /fill="#3b82f6" stroke="#1d4ed8"/.test(hx), "Hexagon static picture: same points and colours as before");
}

// ── 7. handlers stop propagation ─────────────────────────────────────────────────────────
const sideOn = (hex.match(/<g data-side="\d+" onclick="([^"]*)"/g) || []);
ok(sideOn.length === 6 && sideOn.every(s => /onclick="event\.stopPropagation\(\);mastSideTap\(this\)"/.test(s)), "every side's onclick stops propagation before mastSideTap");
ok(/data-sides-reset onclick="event\.stopPropagation\(\);mastSidesReset\(this\)"/.test(hex), "↺ onclick stops propagation");
ok(/pointer-events="stroke"/.test(hex), "hit strokes take the tap even though they're transparent");
ok(!/_mastRe\(|mastPersistLog|\bref\(|\bdb\b|\.set\(|\.update\(|bankDirect|mastLogScores/.test(block), "block never re-renders, writes, scores or banks");

// ── 8. wiring ────────────────────────────────────────────────────────────────────────────
ok(/if\(!bigVis&&cat==="Shapes"\) bigVis=MAST_SHAPE_SIDES\[it\.prompt\]\?mastShapeSidesVis\(it\.prompt,210,mastSidesKey\(it,secondLook\)\):'<span class="mast-bigmoji">'\+mastShapeVis\(it\.prompt,210\)\+'<\/span>';/.test(src), "slideshow big visual uses the drill for sides shapes, the plain picture otherwise");
ok(/mastSidesSync\(slideList\[mastSlideIdx\]\?mastSidesKey\(slideList\[mastSlideIdx\],mastSlideIdx>=_slBase\):null\);\s*\/\/[^\n]*\n\s*mastSlideCardsHtml=slideList\.map/.test(src), "render syncs the lit sides to the card on screen before building the cards");
ok((src.match(/mastShapeSidesVis\(/g) || []).length === 2, "the drill visual is built in exactly one place (definition + slideshow)", String((src.match(/mastShapeSidesVis\(/g) || []).length));
ok(/if\(cat==="Shapes"\) return mastShapeVis\(it\.prompt,26\);/.test(src), "mastItemVis (deck lists) still the static 26px picture");
ok(/else if\(cat==="Shapes"\) vis='<span style="font-size:18px;opacity:0\.35">'\+mastShapeVis\(name,12\)/.test(src), "HQ thumbnail still the static 12px picture");
ok(/if\(it\.subject==="Shapes"\) return '<span class="memoji" style="font-size:54px;line-height:1;pointer-events:none">'\+mastShapeVis\(it\.prompt,54\)/.test(src), "show-me tiles still the static 54px picture");
ok(/@keyframes sidesPulse\{/.test(src) && /\.mast-sides-pulse\{animation:sidesPulse .5s ease-in-out 1\}/.test(src), "one-shot pulse keyframes in the CSS");
ok(!/cqw/.test(block.replace(/\/\/[^\n]*/g, "")), "no cqw in the block\x27s code (comments aside)");
ok(!/\u{1F500}/u.test(src), "no shuffle emoji in index.html");

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
