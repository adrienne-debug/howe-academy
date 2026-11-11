/*
 * Node tests — TILEFIT (her report 2026-11-10: "in all the games the options after say it the words wrap and dont finish in the
 * square and it doesnt look great could we make this look more professional either shrink the words to fit or another option").
 * One shared rule for every text tile: never a mid-word break, never clipped or ellipsized; shrink to fit (floor 60%), and a tile
 * grows when one word still can't fit at the floor.
 *   run:  node test_tilefit.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const gsrc = fs.readFileSync(path.join(__dirname, "games.js"), "utf8");
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x) : "")); } };

console.log("── marked block ──");
const a = src.indexOf("// TILEFIT_START"), b = src.indexOf("// TILEFIT_END");
ok("TILEFIT_START / _END block exists in index.html, in order", a >= 0 && b > a);
ok("the block is in index.html only (so it exists before games.js loads)", gsrc.indexOf("TILEFIT_START") < 0);
const block = src.slice(a, b);
ok("block defines tileFitSize, tileFit, tileFitSoon, TILEFIT_CSS", ["function tileFitSize(", "function tileFit(", "function tileFitSoon(", "const TILEFIT_CSS="].every(s => block.includes(s)));
ok("floor is 60%", /const TILEFIT_FLOOR=0\.6;/.test(block));

console.log("── CSS: no mid-word breaks, no ellipsis ──");
const css = (block.match(/const TILEFIT_CSS='([^\n]*)'\+\n\s*'([^\n]*)';/) || []).slice(1).join("");
const tfRule = (css.match(/\.tf\{[^}]*\}/) || [""])[0];
ok("TILEFIT_CSS found", css.length > 0);
ok(".tf: overflow-wrap:normal!important", tfRule.includes("overflow-wrap:normal!important"));
ok(".tf: word-break:keep-all!important", tfRule.includes("word-break:keep-all!important"));
ok(".tf: hyphens:none!important (and -webkit-)", tfRule.includes("-webkit-hyphens:none!important") && tfRule.includes(";hyphens:none!important"));
ok(".tf: text-overflow:clip (never ellipsis)", tfRule.includes("text-overflow:clip!important"));
ok("no ellipsis / anywhere / break-all / break-word anywhere in the block", !/ellipsis|anywhere|break-all|break-word/.test(css));
const growRule = (css.match(/\.tf-grow\{[^}]*\}/) || [""])[0];
ok(".tf-grow grows instead of clipping (overflow visible, aspect-ratio auto, height auto, min-width min-content)",
  ["overflow:visible!important", "aspect-ratio:auto!important", "height:auto!important", "min-width:min-content!important"].every(s => growRule.includes(s)));

console.log("── every inventoried render site calls the helper ──");
const CALL = 'if(typeof tileFitSoon==="function") tileFitSoon();   // TILEFIT';
const IDX_SITES = ["buildWhichHtml(color)", "mpRender()", "buildMatchHtml(color)", "gameJudgeHtml(turn,color,lock)", "mstPickHtml(session,card,lrn)"];
const GAME_SITES = ["buildGofishHtml", "buildSortHtml", "buildMoleHtml", "buildJeopHtml", "buildFourHtml", "buildBeatHtml", "buildSureHtml", "buildJumbleHtml", "buildKaboomHtml"];
const head = (s, sig, n) => { const i = s.indexOf("function " + sig + "{"); return i < 0 ? "" : s.slice(i, i + (n || 400)); };
IDX_SITES.forEach(sig => ok("index.html " + sig + " calls tileFitSoon in its first lines", head(src, sig).includes(CALL)));
GAME_SITES.forEach(fn => ok("games.js " + fn + " calls tileFitSoon (guarded) in its first line", head(gsrc, fn + "(color)", 120).includes(CALL)));
ok("index.html has exactly " + IDX_SITES.length + " tagged calls", src.split(CALL).length - 1 === IDX_SITES.length, src.split(CALL).length - 1);
ok("games.js has exactly " + GAME_SITES.length + " tagged calls", gsrc.split(CALL).length - 1 === GAME_SITES.length, gsrc.split(CALL).length - 1);
ok("games.js never calls tileFit unguarded", !/(^|[^"])tileFit(Soon)?\(\)/.test(gsrc.split(CALL).join("")));

console.log("── every inventoried text element carries class tf ──");
[
  ["Which one? answer", src, '<span class="which-ans tf" style='],
  ["practice panel answer", src, '<span class="mp-ans tf" style='],
  ["Match word chip (_matchAsk)", src, "const word=c=>'<span class=\"tf\" style="],
  ["Match meaning tile (_matchPairHtml)", src, "if(def) return '<span class=\"tf\" style="],
  ["Memory prompt tile", src, "isPrompt:true,html:'<span class=\"tf\" style="],
  ["Say it first → pick (SAIDPICK)", src, "h+='<span class=\"tf\" style=\"font-size:16px;font-weight:800;color:#292524;word-break:break-word;pointer-events:none\">'+(done&&c.ok?"],
  ["I said it → pick (GAMEJUDGE)", src, "h+='<span class=\"tf\" style=\"font-family:\\'Fraunces\\',serif;font-size:22px"],
  ["Pick it chip (PATPICK)", src, "return d?'<span class=\"tf\" style=\"pointer-events:none;word-break:break-word\">'+mstEsc(d)"],
  ["Go Fish card", gsrc, "'<span class=\"gf-txt tf\">'"],
  ["Go Fish pick button", gsrc, "'<button class=\"tf gf-opt'"],
  ["Sort it card", gsrc, "return '<span class=\"tf\" style=\"pointer-events:none;font-size:'"],
  ["Mole answer", gsrc, "inner='<span class=\"mole-ans tf\" style="],
  ["Jeopardy card", gsrc, "'<span class=\"jp-txt tf\">'"],
  ["Jeopardy pick button", gsrc, "'<button class=\"tf jp-opt'"],
  ["Connect Four card", gsrc, "'<span class=\"c4-txt tf\">'"],
  ["Connect Four pick button", gsrc, "'<button class=\"tf c4-opt'"],
  ["Beat my time prompt tile", gsrc, "isPrompt:true,matched:false,miss:false,html:'<span class=\"tf\" style="],
  ["Sure? card", gsrc, "'<span class=\"sure-txt tf\" style="],
  ["Sure? pick button", gsrc, "'<button class=\"tf sure-opt\""],
  ["Kaboom card", gsrc, "'<span class=\"kb-txt tf\">'"],
  ["Kaboom pick button", gsrc, "'<button class=\"tf kb-opt'"],
].forEach(([n, s, needle]) => ok(n, s.includes(needle)));
ok("Unjumble word tiles (both)", (gsrc.match(/'<button class="tf uj-tile/g) || []).length === 2);
ok("no untagged copy of a site's old class left", !/class="(gf-txt|jp-txt|c4-txt|kb-txt)">|class="(which-ans|mp-ans|mole-ans|sure-txt)" |'<button class="(gf|jp|c4|kb|sure)-opt|'<button class="uj-tile/.test(src + gsrc));

console.log("── the pure sizing loop ──");
const fnSrc = (block.match(/function tileFitSize\(base,floor,fits\)\{[\s\S]*?\n\}/) || [""])[0];
ok("tileFitSize extracted", fnSrc.length > 0);
const ctx = {}; vm.createContext(ctx); vm.runInContext(fnSrc + ";this.tileFitSize=tileFitSize;", ctx);
const tfs = ctx.tileFitSize;
// fake tile: the text needs size*k px; the tile holds `room` px
const run = (base, floor, k, room) => { const tried = []; const r = tfs(base, floor, s => { tried.push(s); return s * k <= room; }); return { r, tried }; };
let t = run(22, 13.2, 8, 400);
ok("fits at its own size → one measure, size unchanged", t.r.fit && t.r.size === 22 && t.tried.length === 1, t);
t = run(22, 13.2, 8, 150);   // needs ≤ 18.75px
ok("stops at the FIRST size that fits", t.r.fit && t.r.size === t.tried[t.tried.length - 1] && t.r.size * 8 <= 150 && t.tried.slice(0, -1).every(s => s * 8 > 150), t);
ok("steps go strictly down", t.tried.every((s, i) => i === 0 || s < t.tried[i - 1]), t.tried);
ok("a few steps, not dozens", t.tried.length <= 4, t.tried.length);
t = run(22, 13.2, 8, 50);    // never fits
ok("never fits → floor, fit:false", !t.r.fit && t.r.size === 13.2, t.r);
ok("never measures below the floor", t.tried.every(s => s >= 13.2), t.tried);
ok("the floor itself is tried last", t.tried[t.tried.length - 1] === 13.2, t.tried);
ok("from 100% to the 60% floor in ≤ 6 steps", t.tried.length <= 6, t.tried.length);
t = run(10, 30, 1, 1);
ok("a floor above the base clamps to the base (never grows the font)", t.r.size === 10 && t.tried.every(s => s <= 10), t);
ok("0.5px grain", run(31, 18.6, 10, 200).tried.slice(1, -1).every(s => s * 2 === Math.round(s * 2)));

console.log("── the helper on a fake tile (scroll sizes shrink with font-size) ──");
function fakeDoc() {
  const mk = (word, boxW, boxH, base) => {
    const box = { clientWidth: boxW, clientHeight: boxH, style: { minWidth: "", minHeight: "" }, _cls: new Set(), attrs: {},
      classList: { contains: c => box._cls.has(c), add: c => box._cls.add(c), remove: c => box._cls.delete(c) },
      getAttribute: k => (k in box.attrs ? box.attrs[k] : null), setAttribute: (k, v) => { box.attrs[k] = String(v); } };
    const el = { _writes: 0, attrs: {}, parentElement: box, closest: () => null, _base: base,
      style: { _fs: "", get fontSize() { return this._fs; }, set fontSize(v) { el._writes++; this._fs = v; } },
      getAttribute: k => (k in el.attrs ? el.attrs[k] : null), setAttribute: (k, v) => { el.attrs[k] = String(v); },
      get _px() { return parseFloat(el.style.fontSize) || base; },
      get clientWidth() { return box.clientWidth; }, get scrollWidth() { return Math.ceil(word.length * 0.6 * el._px); } };
    Object.defineProperty(box, "scrollWidth", { get: () => Math.max(box.clientWidth, el.scrollWidth) });
    Object.defineProperty(box, "scrollHeight", { get: () => boxH });
    return el;
  };
  const els = [mk("photosynthesis", 120, 120, 22), mk("cat", 120, 120, 22), mk("pneumonoultramicroscopic", 90, 104, 22)];
  return { els, document: { head: null, getElementById: () => null, querySelectorAll: () => els } };
}
const F = fakeDoc();
const c2 = { document: F.document, getComputedStyle: el => ({ fontSize: (parseFloat(el.style.fontSize) || el._base) + "px" }), Promise };
vm.createContext(c2);
vm.runInContext(block.replace(/_tfCss\(\);\ntry\{[\s\S]*$/, "") + ";this.tileFit=tileFit;", c2);
c2.tileFit(F.document);
const [ph, cat, pn] = F.els;
const phPx = parseFloat(ph.style.fontSize);
ok("photosynthesis shrinks until its width fits the tile", phPx < 22 && ph.scrollWidth <= 120 && phPx >= 22 * 0.6, phPx);
ok("…at the first fitting step of the ×0.9 ladder (22 → 19.5 → 17.5 → 15.5 → 13.5)", phPx === 13.5, phPx);
ok("cat keeps the site's own size (inline style left as it was)", cat.style.fontSize === "", cat.style.fontSize);
ok("a word too long at the floor stays at the floor, never smaller", parseFloat(pn.style.fontSize) === 13.2, pn.style.fontSize);
ok("…and its tile grows (tf-grow, min-height kept) instead of clipping", pn.parentElement._cls.has("tf-grow") && pn.parentElement.style.minHeight === "104px");
ok("every tile keeps its slot (min-width 0)", F.els.every(e => e.parentElement.style.minWidth === "0px"));
const writes = F.els.map(e => e._writes);
c2.tileFit(F.document);
ok("idempotent: a second pass at the same width measures nothing", F.els.every((e, i) => e._writes === writes[i]), F.els.map(e => e._writes));
F.els[0].parentElement.clientWidth = 200;
c2.tileFit(F.document);
ok("a width change re-fits that tile from its own size (bigger again)", parseFloat(ph.style.fontSize) > phPx || ph.style.fontSize === "", ph.style.fontSize);

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
