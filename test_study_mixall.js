// MST_MIXALL: a study session with Order = shuffle mixes the WHOLE sitting — new cards land among learning and
// review cards instead of last, in bank order (her ask 2026-10-04, Andrew's facts: a fact family's four new cards
// came back to back). Order only: same cards, same counts, same per-card state.
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
ok("MST_MIXALL block present", src.indexOf("// MST_MIXALL_START") > 0 && src.indexOf("// MST_MIXALL_END") > src.indexOf("// MST_MIXALL_START"));
const code = ["function _mstHashStr(", "function _mstMulberry32(", "function _mstShuffle(", "function mstSittingInit("].map(extract).join("\n");
const init = new Function(`const MST_SESSION_DEFAULTS={passes:2}; function mstPatternClean(){ return null; } function mstPatternMode(){ return null; }
  ${code}; return mstSittingInit;`)();
const mk = (p, n) => Array.from({ length: n }, (_, i) => ({ id: p + i, subject: "Math Facts", prompt: p + i }));
const pile = { reviews: mk("r", 6), learning: mk("l", 4), newNames: ["1+8", "8+1", "9-1", "9-8"].map(n => ({ deck: "Math Facts", name: n })) };
const bank = init(pile, { order: "bank", passes: 2 }, { day: "Mon Oct 05 2026" });
ok("bank order unchanged: reviews → learning → new (new last, in order)", bank.queue.slice(-4).join() === "n:Math Facts|1+8,n:Math Facts|8+1,n:Math Facts|9-1,n:Math Facts|9-8" && bank.queue[0] === "r:r0");
const a = init(pile, { order: "shuffle", passes: 2 }, { day: "Mon Oct 05 2026" });
ok("shuffle: same cards, same counts", a.queue.slice().sort().join() === bank.queue.slice().sort().join() && JSON.stringify(a.counts) === JSON.stringify(bank.counts) && a.passes === 2);
const newIdx = a.queue.map((k, i) => k.startsWith("n:") ? i : -1).filter(i => i >= 0);
ok("shuffle: new cards are mixed in, not the last four", JSON.stringify(newIdx) !== JSON.stringify([10, 11, 12, 13]));
let together = 0; for (let d = 1; d <= 28; d++) { const q = init(pile, { order: "shuffle" }, { day: "day" + d }).queue; const ix = q.map((k, i) => k.startsWith("n:") ? i : -1).filter(i => i >= 0); if (ix[3] - ix[0] === 3) together++; }
ok("over 4 weeks the family's four new cards almost never sit back to back (" + together + "/28)", together <= 2);
ok("same day → same order (a resumed sitting matches)", init(pile, { order: "shuffle" }, { day: "Mon Oct 05 2026" }).queue.join() === a.queue.join());
ok("next day → a different order", init(pile, { order: "shuffle" }, { day: "Tue Oct 06 2026" }).queue.join() !== a.queue.join());
ok("card records untouched (kind/name per key)", a.queue.every(k => a.cards[k] && a.cards[k].key === k && a.cards[k].goods === 0 && a.cards[k].done === false));
ok("a one-card sitting is left alone", init({ reviews: [], learning: [], newNames: [{ deck: "D", name: "x" }] }, { order: "shuffle" }, {}).queue.join() === "n:D|x");
console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
