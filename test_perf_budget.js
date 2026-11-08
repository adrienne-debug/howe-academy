/*
 * PERF_BUDGET — the performance guardrail every branch runs (PLAN_lg_performance_2026-11-08.md, Part 1).
 * Her words 2026-11-08: "all of this needs to be checked every time we do edits … there always needs to be a plan that
 * doesn't affect performance"; phones must not lose battery or data. The LG StanbyME got slower every week because the
 * CODE grew (index.html 6.09 MB on 10/24 → 8.80 MB on 11/4; first paint 5.8 → 7.2 s) — this test makes growth a choice.
 *
 * It compares the tree with perf_budget.json (committed; it says the date and commit it was measured on) and FAILS when:
 *   1. index.html is more than slackBytes (60 KB) bigger than the baseline. Gzip size is printed, never failing.
 *   2. more Firebase listeners are registered at boot. METHOD: the bodies of `function initFb` and
 *      `function attachWeekListeners` are found by brace-matching on a copy of the code with comments, strings and
 *      regexes blanked (so a brace in a string can't end a body early); inside them every `.on("value" | "child_*"`
 *      call site counts once — whether it is `db.ref("x").on(` or `r3.on(` on a ref made a line above. A site inside a
 *      loop or an `if` still counts once (it is a source count, not a runtime count); `.once(` is not a listener.
 *      Commented-out code is not counted.
 *   3. a setInterval with a period under 60 s (or a period that isn't a plain number, or no period) appears that is not
 *      in the baseline list, in index.html or any of the app's own *.js (vendor-*, test_* excluded). Each grandfathered
 *      one is listed in perf_budget.json with its purpose. An interval is matched by a key: file | what it is assigned to
 *      | its first 40 code characters | the period text — line numbers move, keys don't. Rewording the start of an
 *      existing interval's callback changes its key: re-measure (below) and keep its purpose.
 *   4. more distinct localStorage keys are written at boot. METHOD (an approximation): inside the same two boot
 *      functions, every `HA_LS.setItem(`, `localStorage.setItem(` and `sv(` (the app's setItem wrapper) call's first
 *      argument is turned into a pattern — string pieces kept, anything else `*` (`wk+"_tasks"` → `*_tasks`,
 *      `"ha_kit_plan"` → `ha_kit_plan`). The count of distinct patterns is pinned. Writes made later (on a tap) don't count.
 *   5. never failing: comment vs code lines, and the 15 biggest `NAME_START … NAME_END` blocks, so the hub sees what grew.
 *
 * To accept growth ON PURPOSE (a conscious act, recorded in git):
 *     node perf_budget_measure.js --reason "<one line: why the page had to grow>"
 * which rewrites perf_budget.json from the current tree and appends a history line — then commit it with the change.
 * (Editing the numbers in perf_budget.json by hand with a history line is the same thing.)
 *
 *   run:  node test_perf_budget.js
 */
const fs = require("fs");
const path = require("path");
const P = require(path.join(__dirname, "perf_budget_measure.js"));

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log("  ok  - " + name); }
  else { fail++; console.log("  FAIL- " + name + (extra !== undefined ? "  (" + JSON.stringify(extra) + ")" : "")); }
}
const kb = b => (b / 1024).toFixed(1) + " KB";
const HOW = '    accept it on purpose: node perf_budget_measure.js --reason "<one line: why>"  — then commit perf_budget.json';

// The comparison, as a function so the self-checks below can prove it fails when it should.
function compare(now, base) {
  const out = [];   // { what, detail[] }
  const grow = now.indexHtml.bytes - base.indexHtml.bytes, slack = base.indexHtml.slackBytes || P.INDEX_SLACK_BYTES;
  if (grow > slack) out.push({ what: "index.html grew " + kb(grow) + " over the baseline (budget +" + kb(slack) + ")",
    detail: ["now " + kb(now.indexHtml.bytes) + ", baseline " + kb(base.indexHtml.bytes) + " (" + base.measuredOn + ", " + base.commit + ")"] });
  if (now.bootListeners.count > base.bootListeners.count) {
    const d = Object.entries(now.bootListeners.byFunction).map(([k, v]) => k + ": " + (v ? v.listeners : "missing") +
      " (baseline " + (base.bootListeners.byFunction || {})[k] + ")");
    out.push({ what: "boot listeners grew " + base.bootListeners.count + " → " + now.bootListeners.count +
      " (a page's data should attach when the page opens, not at boot)", detail: d });
  }
  const left = {}; for (const iv of base.shortIntervals) left[iv.key] = (left[iv.key] || 0) + 1;
  const added = [];
  for (const iv of now.shortIntervals) { if (left[iv.key]) left[iv.key]--; else added.push(iv); }
  if (added.length) out.push({ what: added.length + " new setInterval under 60 s (battery — wakes the phone)",
    detail: added.map(iv => iv.file + ":" + iv.line + "  period " + (iv.periodMs === null ? "not a plain number" : iv.periodMs + " ms") + "  key " + JSON.stringify(iv.key)) });
  if (now.bootStorageKeys.count > base.bootStorageKeys.count) {
    const had = new Set(base.bootStorageKeys.patterns), fresh = now.bootStorageKeys.patterns.filter(p => !had.has(p));
    out.push({ what: "localStorage keys written at boot grew " + base.bootStorageKeys.count + " → " + now.bootStorageKeys.count,
      detail: fresh.map(p => JSON.stringify(p) + " at index.html line " + ((now.bootStorageKeys.sites || {})[p] || []).join(", ")) });
  }
  return out;
}

// ── self-checks: the scanner reads code, not comments or strings ───────────────────────────────────────────────────
console.log("scanner self-checks");
{
  const s = 'a(1); // setInterval(x,5)\n/* db.ref("q").on("value",f) */ const t="setInterval(y,5)"; const r=/[)}]/g; b(2);';
  const { cm, bare } = P.scanJs(s);
  ok("same length as the source", cm.length === s.length && bare.length === s.length);
  ok("comments blanked in cm", cm.indexOf("setInterval(x") < 0 && cm.indexOf('on("value"') < 0);
  ok("strings kept in cm, blanked in bare", cm.indexOf("setInterval(y") > 0 && bare.indexOf("setInterval(y") < 0);
  ok("a regex's brackets don't unbalance bare", (bare.match(/[()]/g) || []).length % 2 === 0 && bare.indexOf("}") < 0);
  const t = P.scanJs("const h=`a${ x ? `in${y}` : '}' }b`; z(1);");
  ok("template ${ } code kept, template text blanked", /\$\{ x \? `/.test(t.bare) && t.bare.indexOf("z(1)") > 0);
  ok("keyPattern: concat / literal / template / variable", P.keyPattern('wk+"_tasks"') === "*_tasks" &&
    P.keyPattern("'ha_kit_plan'") === "ha_kit_plan" && P.keyPattern("`ha_${k}_x`") === "ha_*_x" && P.keyPattern("k") === "*");
  ok("evalPeriod: literals and arithmetic, null for names", P.evalPeriod("5*60*1000") === 300000 &&
    P.evalPeriod(" 250 ") === 250 && P.evalPeriod("MS") === null && P.evalPeriod("1e3") === 1000);
  const h = P.scriptOnly('<p>don\'t</p><script>var a=1;</script><script src="x.js"></script>');
  ok("index.html: only inline <script> bodies are read", h.blocks === 1 && h.text.indexOf("var a=1;") > 0 && h.text.indexOf("don") < 0);
}

// ── the real tree vs the baseline ───────────────────────────────────────────────────────────────────────────────────
const basePath = path.join(__dirname, "perf_budget.json");
ok("perf_budget.json exists", fs.existsSync(basePath));
const base = JSON.parse(fs.readFileSync(basePath, "utf8"));
const now = P.measure(__dirname);

console.log("\nmeasured vs baseline (" + base.measuredOn + ", commit " + base.commit + ")");
ok("both boot functions found (initFb, attachWeekListeners)", P.BOOT_FUNCS.every(n => now.bootListeners.byFunction[n]),
  Object.keys(now.bootListeners.byFunction).filter(n => !now.bootListeners.byFunction[n]));
ok("found inline <script> blocks in index.html", now.indexHtml.scriptBlocks >= 1);
ok("every grandfathered interval has a purpose", base.shortIntervals.every(iv => iv.purpose && !/^NEW /.test(iv.purpose)),
  base.shortIntervals.filter(iv => !iv.purpose || /^NEW /.test(iv.purpose)).map(iv => iv.file + ":" + iv.line));

const grow = now.indexHtml.bytes - base.indexHtml.bytes, slack = base.indexHtml.slackBytes || P.INDEX_SLACK_BYTES;
console.log("  index.html   " + kb(now.indexHtml.bytes) + "  (" + (grow >= 0 ? "+" : "") + kb(grow) + " vs baseline; " +
  kb(Math.max(0, slack - grow)) + " of the +" + kb(slack) + " budget left)");
console.log("  gzip         " + kb(now.indexHtml.gzipBytes) + "  (baseline " + kb(base.indexHtml.gzipBytes) + ") — informational");
console.log("  boot listeners " + now.bootListeners.count + " (baseline " + base.bootListeners.count + "): " +
  P.BOOT_FUNCS.map(n => n + " " + (now.bootListeners.byFunction[n] || {}).listeners).join(", "));
console.log("  setIntervals under 60 s: " + now.shortIntervals.length + " (baseline " + base.shortIntervals.length + ")");
console.log("  localStorage key patterns written at boot: " + now.bootStorageKeys.count + " (baseline " + base.bootStorageKeys.count + ")");
for (const [f, v] of Object.entries(now.lazyFiles)) {
  const b = (base.lazyFiles || {})[f];
  console.log("  lazy " + f.padEnd(17) + kb(v.bytes).padStart(10) + (b ? "  (" + (v.bytes - b.bytes >= 0 ? "+" : "") + kb(v.bytes - b.bytes) + ")" : "  (new)") + " — informational");
}

const problems = compare(now, base);
for (const p of problems) {
  ok(p.what, false);
  for (const d of p.detail) console.log("      " + d);
  console.log(HOW);
}
if (!problems.length) ok("within budget: size, boot listeners, short intervals, boot localStorage keys", true);
{
  const left = {}; for (const iv of now.shortIntervals) left[iv.key] = (left[iv.key] || 0) + 1;
  const gone = base.shortIntervals.filter(iv => { if (left[iv.key]) { left[iv.key]--; return false; } return true; });
  if (gone.length) console.log("  note: " + gone.length + " grandfathered interval(s) no longer found (removed or reworded) — " +
    gone.map(iv => iv.file + ":" + iv.line).join(", ") + "; re-measure to tidy the list");
}

// ── the comparison fails when it should (synthetic growth on a copy of today's numbers) ───────────────────────────────
console.log("\ncomparison self-checks");
{
  const clone = o => JSON.parse(JSON.stringify(o));
  const fake = clone(now), b0 = clone(base);
  b0.indexHtml.bytes = now.indexHtml.bytes; b0.bootListeners.count = now.bootListeners.count;
  b0.shortIntervals = clone(now.shortIntervals); b0.bootStorageKeys = clone(now.bootStorageKeys);
  ok("the same numbers pass", compare(fake, b0).length === 0);
  fake.indexHtml.bytes += slack; ok("+60 KB exactly still passes", compare(fake, b0).length === 0);
  fake.indexHtml.bytes += 1; ok("+60 KB + 1 byte fails", /index\.html grew/.test((compare(fake, b0)[0] || {}).what));
  const f2 = clone(now); f2.bootListeners.count++; ok("one more boot listener fails", /boot listeners grew/.test((compare(f2, b0)[0] || {}).what));
  const f3 = clone(now); f3.shortIntervals.push({ file: "index.html", line: 1, periodMs: 1000, key: "index.html||newTick|1000" });
  ok("a new 1 s setInterval fails", /new setInterval/.test((compare(f3, b0)[0] || {}).what));
  const f4 = clone(now); f4.shortIntervals.push(clone(now.shortIntervals[0]));
  ok("a second copy of a grandfathered interval fails", now.shortIntervals.length > 0 && compare(f4, b0).length === 1);
  const f5 = clone(now); f5.bootStorageKeys.patterns.push("ha_new"); f5.bootStorageKeys.count++;
  ok("one more boot localStorage key fails and names it", /"ha_new"/.test(((compare(f5, b0)[0] || {}).detail || []).join(" ")));
}

// ── informational: what the file is made of ──────────────────────────────────────────────────────────────────────────
const c = now.info.comments;
console.log("\ninformational (never fails)");
console.log("  index.html lines: code " + c.codeLines + ", comment-only " + c.commentLines + ", HTML/CSS " + c.htmlCssLines +
  ", blank " + c.blankLines + "; comment text ≈ " + kb(c.commentChars) + " of the file");
console.log("  biggest NAME_START … NAME_END blocks (nested blocks count inside their parent too):");
for (const b of now.info.biggestBlocks) console.log("    " + kb(b.bytes).padStart(9) + "  " + b.name + "  (line " + b.line + ")");

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
