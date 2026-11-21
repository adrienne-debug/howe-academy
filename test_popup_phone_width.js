/*
 * Node tests — POPUPW: pop-ups stay on a phone's screen (her Planning Board note 2026-10-04: "Pop-ups run off the right
 * edge at phone width (page is 468px wide on a 375 phone) — all pop-ups incl. PIN box"; her yes to the fix 2026-11-21).
 *   Cause (measured 2026-11-21 at 375 px in a dry-run copy): one row wider than the phone — School Room's mode bar, 429 px —
 *   made the browser lay the whole page out 429 wide, and every position:fixed pop-up centred on that wider page.
 *   1. body clips sideways (overflow-x:clip — no scroll box, so the sticky bars still stick), so no row can grow the page.
 *   2. The shared pop-up layers and the code / sign-in boxes are never wider than the screen (max-width:100vw).
 *   3. No fixed-position element in the app types a pixel width wider than a 320 px phone; the shared pop-up boxes are
 *      width:100% + a max-width, and the tall ones scroll inside.
 *   4. The row that did it (play.js #pl-modebar) wraps.
 *   run:  node test_popup_phone_width.js
 */
const fs = require("fs"), path = require("path");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const play = fs.readFileSync(path.join(__dirname, "play.js"), "utf8");
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x) : "")); } };
const rule = sel => { const m = src.match(new RegExp("\\n" + sel.replace(/[#.>]/g, "\\$&") + "\\{([^}]*)\\}")); return m ? m[1] : ""; };
const fnSrc = name => {
  const i = src.indexOf("function " + name + "("); if (i < 0) return "";
  let d = 0; for (let k = src.indexOf("{", i); k < src.length; k++) { if (src[k] === "{") d++; else if (src[k] === "}" && --d === 0) return src.slice(i, k + 1); }
  return "";
};
const pxWidths = s => (s.match(/(?:^|[;{"'\s])width:\s*(\d+)px/g) || []).map(w => +w.match(/(\d+)px/)[1]);

console.log("── 1. the page can't grow wider than the phone ──");
const a = src.indexOf("/* POPUPW_START"), b = src.indexOf("/* POPUPW_END */");
ok("the POPUPW block exists, once", a > 0 && b > a && src.indexOf("/* POPUPW_START", a + 1) < 0);
const styleEnd = src.indexOf("</style>");
ok("…inside the app's first stylesheet (applies at boot)", a > 0 && a < styleEnd);
const blk = src.slice(a, b);
ok("body clips sideways (overflow-x:clip)", /\nbody\{overflow-x:clip\}/.test(blk));
ok("body is never a sideways scroll box (hidden/auto/scroll would break the sticky bars)", !/\nbody\{[^}]*overflow-x:(hidden|auto|scroll)/.test(src));
ok("html still hides the sideways scroll (NAVSTACK, unchanged)", /\nhtml\{overflow-x:hidden\}/.test(src));
ok("the viewport is the device's width", /<meta name="viewport" content="width=device-width, initial-scale=1\.0"\/>/.test(src));

console.log("── 2. the shared pop-up layers are bounded by the screen, not the page ──");
const LAYERS = [".dlg-overlay", ".bo-dlg", ".kk-confirm", ".ce-sheet", ".mast-vis-overlay", "#ha-auth", "#kit-pin-wrap>div", "#store-pin-wrap>div"];
const vwRule = (blk.match(/\n([^{}\n]+)\{max-width:100vw\}/) || [])[1] || "";
const vwSel = vwRule.split(",").map(s => s.trim());
LAYERS.forEach(sel => ok(sel + " carries max-width:100vw", vwSel.indexOf(sel) >= 0, vwSel));
[".dlg-overlay", ".bo-dlg", ".kk-confirm", ".ce-sheet"].forEach(sel =>
  ok(sel + " covers the screen edge to edge (position:fixed;inset:0)", /position:fixed;inset:0/.test(rule(sel)), rule(sel)));
ok(".mast-vis-overlay covers the screen edge to edge", /position:fixed;top:0;left:0;right:0;bottom:0/.test(rule(".mast-vis-overlay")));

console.log("── 3. no pop-up box is wider than a phone; tall ones scroll inside ──");
[[".dlg-box", 0], [".bo-dlg-box", 440], [".kk-confirm-box", 420], [".ce-sheet-box", 480], [".mast-vis-modal", 360]].forEach(([sel, mw]) => {
  const r = rule(sel);
  ok(sel + " is width:100%" + (mw ? " + max-width:" + mw + "px" : ""), /width:100%/.test(r) && (!mw || new RegExp("max-width:" + mw + "px").test(r)), r);
  ok(sel + " types no pixel width wider than 320", pxWidths(r).every(w => w <= 320), pxWidths(r));
});
[".dlg-box", ".bo-dlg-box", ".ce-sheet-box", ".mast-vis-modal"].forEach(sel =>
  ok(sel + " scrolls inside when tall (max-height + overflow-y:auto)", /max-height:\d+vh/.test(rule(sel)) && /overflow-y:auto/.test(rule(sel)), rule(sel)));
// the code (PIN) boxes and the sign-in box
[["kitPinGate", 300, "PIN box (Mom switch / kitchen)"], ["storePinGate", 300, "Star Store PIN box"], ["haAuthShow", 340, "sign-in box"]].forEach(([fn, mw, what]) => {
  const f = fnSrc(fn);
  ok(what + ": a full-screen layer with padding (" + fn + ")", /position:fixed;inset:0;[^"']*padding:20px/.test(f));
  ok(what + ": the box is width:100%;max-width:" + mw + "px", new RegExp("width:100%;max-width:" + mw + "px").test(f));
});
ok("the Mom switch opens the same PIN box", /kitPinGate\(/.test(fnSrc("momSwitchTap")));
// every fixed-position element in the app: none types a pixel width wider than a 320 px phone
const wide = [];
const re = /position:\s*fixed/g; let m;
while ((m = re.exec(src))) {
  const from = Math.max(src.lastIndexOf("{", m.index), src.lastIndexOf('style="', m.index), src.lastIndexOf("cssText=\"", m.index), src.lastIndexOf("style='", m.index));
  const to = m.index + src.slice(m.index).search(/[}"']/);
  const decl = src.slice(from, to);
  pxWidths(decl).filter(w => w > 320).forEach(w => wide.push(src.slice(0, m.index).split("\n").length + ": " + w + "px"));
}
ok("no position:fixed element types a pixel width wider than 320", wide.length === 0, wide);

console.log("── 4. the row that grew the page wraps ──");
const mb = (play.match(/<div id="pl-modebar" style="([^"]*)"/) || [])[1] || "";
ok("School Room's mode bar (play.js #pl-modebar) wraps", /display:flex/.test(mb) && /flex-wrap:wrap/.test(mb), mb);
ok("…and its count has no fixed width", !/width:\d+px/.test((play.match(/<span id="pl-outcount" style="([^"]*)"/) || [])[1] || "x"));

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
