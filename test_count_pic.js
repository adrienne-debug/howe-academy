// 🦕→🚗 Per-kid counting picture (COUNT_PIC block, her ask 2026-10-02: "change the emoji to customize
// it to each kid"). Runs the real mastCountVis / mastCountVisFrames over the real COUNT_PIC helpers:
//  · unset → 🦕 exactly as before (Julian unchanged);  · a kid's count_emoji draws instead, 1–10 and teens;
//  · Mom sets it as ONE leaf (mastery/<kid>_settings/count_emoji), kids can't, unknown picks refused;
//  · every Counting draw site (drill, tile, frames, printed cards) and the intro hint use it.
// UNITS_SRC=<path> runs it against another copy of index.html.
const fs = require("fs"), path = require("path");
const src = fs.readFileSync(process.env.UNITS_SRC || path.join(__dirname, "index.html"), "utf8");
let pass = 0, fail = 0;
function ok(name, cond) { if (cond) { pass++; console.log("  ok  - " + name); } else { fail++; console.log("  FAIL- " + name); } }
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
const a = src.indexOf("// COUNT_PIC_START"), b = src.indexOf("// COUNT_PIC_END");
ok("COUNT_PIC block present", a > 0 && b > a);
const block = src.slice(a, b);
const fnNames = ["function mastCountVis(", "function mastCountVisFrames(", "function mastCountFrame("];
// the frame helper mastCountVisFrames calls, if any (declared right above it)
const helpers = fnNames.map(extract).join("\n");
const others = [...helpers.matchAll(/\b(mast[A-Za-z]+)\(/g)].map(m => m[1]).filter((n, i, arr) => arr.indexOf(n) === i && !/^mastCount(Vis|VisFrames|Emoji|Word|Tap)$/.test(n));
const extra = others.filter(n => src.indexOf("\nfunction " + n + "(") >= 0).map(n => extract("function " + n + "(")).join("\n");
function world(settings, mom) {
  const G = { writes: [] };
  const db = { ref(p) { return { set(v) { G.writes.push([p, v]); } }; } };
  const api = new Function("G", "db", "settings", "mom", `
    const masteryData=settings; let masteryKid="caleb"; const tab="units";
    function momHere(){ return mom; } function _dryRun(){ return false; } function renderUnits(){}
    const HA_LS={ setItem(){} }; const document={ getElementById:()=>null }; function mastCountTap(){}
    ${block}
    ${extra}
    ${helpers}
    return { mastCountVis, mastCountVisFrames, mastCountEmoji, mastCountWord, mastSetCountEmoji, mastPartnerVis, setKid(k){ masteryKid=k; } };`)(G, db, settings, mom !== false);
  api.G = G; return api;
}
const count = (h, e) => h.split(e).length - 1;
const DINO = "\u{1F995}", CAR = "\u{1F697}";
{ const w = world({});
  ok("unset → 🦕 (Julian unchanged): 4 dinos", count(w.mastCountVis(4, 240, true), DINO) === 4 && w.mastCountWord() === "dinosaurs");
  ok("unset → teens still dinos (13)", count(w.mastCountVis(13, 240, true), DINO) === 13); }
{ const w = world({ caleb_settings: { count_emoji: CAR }, julian_settings: {} });
  ok("Caleb's cars: 4 cars, no dinos", count(w.mastCountVis(4, 240, true), CAR) === 4 && count(w.mastCountVis(4, 240, true), DINO) === 0);
  ok("Caleb's cars: non-tap view too", count(w.mastCountVis(3, 240, false), CAR) === 3);
  ok("Caleb's cars: teen frames (17)", count(w.mastCountVis(17, 240, true), CAR) === 17 && count(w.mastCountVis(17, 240, true), DINO) === 0);
  ok("hint word follows the picture", w.mastCountWord() === "cars");
  w.setKid("julian"); ok("same device, Julian's drill → dinos", count(w.mastCountVis(4, 240, true), DINO) === 4); }
{ const s = {}; const w = world(s);
  w.mastSetCountEmoji("caleb", CAR);
  ok("Mom sets it: one leaf write", w.G.writes.length === 1 && w.G.writes[0][0] === "mastery/caleb_settings/count_emoji" && w.G.writes[0][1] === CAR && s.caleb_settings.count_emoji === CAR);
  w.mastSetCountEmoji("caleb", "\u{1F4A9}");
  ok("a pick that isn't on the list is refused", w.G.writes.length === 1 && s.caleb_settings.count_emoji === CAR); }
{ const s = {}; const w = world(s, false); w.mastSetCountEmoji("caleb", CAR);
  ok("kids can't change it", w.G.writes.length === 0 && !s.caleb_settings); }
ok("12 picks, all distinct", (() => { const m = /const MAST_COUNT_PICS=(\[[\s\S]*?\]\]);/.exec(block); const arr = eval(m[1]); return arr.length === 12 && new Set(arr.map(x => x[0])).size === 12 && arr[0][0] === DINO; })());
// ── Stage 5 partner frames ──
{ const w = world({ caleb_settings: { count_emoji: CAR } });
  const f5 = w.mastPartnerVis("3 and ? make 5", 240), f10 = w.mastPartnerVis("7 and ? make 10", 240);
  const cellsOf = h => (h.match(/border:1px dashed #b7dcc4/g) || []).length;
  ok("make 5: five-frame, 3 of Caleb's cars, 2 empty", cellsOf(f5) === 5 && count(f5, CAR) === 3);
  ok("make 10: ten-frame, 7 cars, 3 empty", cellsOf(f10) === 10 && count(f10, CAR) === 7);
  ok("other prompts get no frame", w.mastPartnerVis("3 + ? = 10") === "" && w.mastPartnerVis("1 more than 4") === "" && w.mastPartnerVis(undefined) === "");
  ok("frame never shows the answer as a number", !/>[0-9]+</.test(f10)); }
ok("drill card draws the frame for Number Sense", /if\(!bigVis&&cat==="Number Sense"&&typeof mastPartnerVis==="function"\) bigVis=mastPartnerVis\(it\.prompt,240\);/.test(src));
ok("Number Sense flips to 'the answer', not 'definition'", /\(_learnFlip\|\|cat==="Number Sense"\)\?'the answer'/.test(src) && /\(_ruleStyle\|\|_learnFlip\|\|cat==="Number Sense"\)\?_backText/.test(src));
// every Counting draw site uses it — no hard-coded 🦕 left in the counting code
const vis = extract("function mastItemVis(");
ok("drill tile (mastItemVis) uses the kid's picture", /cat==="Counting"[^\n]*mastCountEmoji\(\)\.repeat/.test(vis) && !vis.includes("\\u{1F995}"));
ok("mastCountVis / frames: no hard-coded dino", !helpers.includes("\\u{1F995}"));
const pr = extract("function mastPrintCards(");
ok("printed cards use it", /mastCountEmoji\(\)\+'<\/span>';\n\s*return '<span style="display:inline-flex/.test(pr));
ok("intro hint says 'count the <picture> out loud'", /cat==="Counting"&&typeof mastCountWord==="function"\)\?"count the "\+mastCountWord\(\)\+" out loud"/.test(src));
ok("picker on the kid's row in the unit (guarded)", /typeof mastCountEmoji==="function"&&\(u\.decks\|\|\[\]\)\.some\(d=>d&&d\.key==="Counting"\)/.test(src) && /mastSetCountEmoji\(/.test(src));
console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
