/*
 * PERF_BUDGET — the measuring half of the performance guardrail (her words 2026-11-08: "all of this needs to be
 * checked every time we do edits … there always needs to be a plan that doesn't affect performance").
 * Why: the LG StanbyME in the school room got slower every week — the 11/4 measure showed CODE SIZE (6.09 MB on 10/24
 * → 8.80 MB, first paint 5.8 → 7.2 s), not data. Phones must not lose battery or data. Plan: PLAN_lg_performance_2026-11-08.md, Part 1.
 *
 * Two jobs:
 *   1. `require("./perf_budget_measure.js").measure(dir)` — reads index.html + the app's own *.js beside it and returns
 *      the numbers; test_perf_budget.js compares them with perf_budget.json.
 *   2. `node perf_budget_measure.js --reason "why the page had to grow"` — REWRITES perf_budget.json from the current
 *      tree (what a session runs when it must grow the page). It keeps every grandfathered interval's purpose, marks new
 *      ones with your reason, and appends one history line { date, commit, reason } — a conscious act, recorded in git.
 *      `node perf_budget_measure.js` with no --reason only prints the numbers; it never writes.
 *
 * How the source is read (so a word in a comment or a string never counts):
 *   index.html is HTML; only its inline <script>…</script> bodies are JS. Everything outside them is blanked to spaces
 *   (newlines kept, so offsets and line numbers stay true). A small JS scanner then walks the code once and makes two
 *   same-length copies: `cm` (comments blanked, strings kept) and `bare` (comments AND the insides of strings, template
 *   text and regex literals blanked; `${…}` code inside templates kept). Braces/parens are matched on `bare`; key names
 *   and periods are read from `cm`. The regex-vs-divide guess is the usual one (a `/` after an operator, `(`, `,`, `{`,
 *   `}`, `;` or a keyword like `return` starts a regex).
 * No dependencies; Node only.
 */
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const BOOT_FUNCS = ["attachWeekListeners", "initFb"];
const SHORT_MS = 60000;                       // a setInterval under 60 s wakes a phone often — battery
const INDEX_SLACK_BYTES = 60 * 1024;          // index.html may grow this much over the baseline before the test fails
const LS_WRITERS = /(?:\b(?:window\.)?localStorage|\bHA_LS)\.setItem\s*\(|(?<![\w$.])sv\s*\(/g;

// The app's own lazy / helper scripts (vendor Firebase, tests and this file are not the app's code).
function appJsFiles(dir) {
  return fs.readdirSync(dir).filter(f => /\.js$/.test(f) && !/^test_/.test(f) && !/^vendor-/.test(f) &&
    f !== "perf_budget_measure.js").sort();
}

// ── scanner ─────────────────────────────────────────────────────────────────────────────────────────────────────────
const REGEX_AFTER = new Set("(,=:[!&|?{};+-*%<>~^".split(""));
const REGEX_WORDS = new Set(["return", "typeof", "case", "do", "else", "in", "of", "new", "delete", "void", "throw",
  "instanceof", "yield", "await"]);
function scanJs(src) {
  const n = src.length, cm = src.split(""), bare = src.split("");
  const blank = (arr, a, b) => { for (let k = a; k < b; k++) if (arr[k] !== "\n") arr[k] = " "; };
  let i = 0, prevSig = "", prevWord = "";
  const stack = [];                             // template nesting: each entry = brace depth inside its ${ }
  while (i < n) {
    const c = src[i], d = src[i + 1];
    if (c === "/" && d === "/") { let e = src.indexOf("\n", i); if (e < 0) e = n; blank(cm, i, e); blank(bare, i, e); i = e; continue; }
    if (c === "/" && d === "*") { let e = src.indexOf("*/", i + 2); e = e < 0 ? n : e + 2; blank(cm, i, e); blank(bare, i, e); i = e; continue; }
    if (c === '"' || c === "'") {
      let j = i + 1; while (j < n && src[j] !== c && src[j] !== "\n") { if (src[j] === "\\") j++; j++; }
      blank(bare, i + 1, j); i = j + 1; prevSig = c; prevWord = ""; continue;
    }
    if (c === "`" || (c === "}" && stack.length && stack[stack.length - 1] === 0)) {
      if (c === "}") stack.pop();               // back inside the template text after a ${ … }
      let j = i + 1;
      while (j < n && src[j] !== "`" && !(src[j] === "$" && src[j + 1] === "{")) { if (src[j] === "\\") j++; j++; }
      blank(bare, i + 1, j);
      if (src[j] === "$") { stack.push(0); i = j + 2; prevSig = "{"; }
      else { i = j + 1; prevSig = "`"; }
      prevWord = ""; continue;
    }
    if (c === "/" && (!prevSig || REGEX_AFTER.has(prevSig) || REGEX_WORDS.has(prevWord))) {
      let j = i + 1, cls = false;
      while (j < n && src[j] !== "\n") { const ch = src[j]; if (ch === "\\") { j += 2; continue; }
        if (ch === "[") cls = true; else if (ch === "]") cls = false; else if (ch === "/" && !cls) break; j++; }
      blank(bare, i + 1, j); i = j + 1; while (i < n && /[a-z]/i.test(src[i])) i++; prevSig = "/"; prevWord = ""; continue;
    }
    if (c === "{" && stack.length) stack[stack.length - 1]++;
    if (c === "}" && stack.length) stack[stack.length - 1]--;
    if (/[\w$]/.test(c)) { let j = i; while (j < n && /[\w$]/.test(src[j])) j++; prevWord = src.slice(i, j); prevSig = "a"; i = j; continue; }
    if (!/\s/.test(c)) { prevSig = c; prevWord = ""; }
    i++;
  }
  return { cm: cm.join(""), bare: bare.join("") };
}

// index.html → same-length text where only inline <script> bodies remain.
function scriptOnly(html) {
  const out = html.replace(/[^\n]/g, " ").split("");
  const re = /<script(\s[^>]*)?>([\s\S]*?)<\/script>/gi;
  let m, blocks = 0;
  while ((m = re.exec(html))) {
    if (m[1] && /\bsrc\s*=/.test(m[1])) continue;
    const a = m.index + m[0].indexOf(">") + 1, b = a + m[2].length;
    for (let k = a; k < b; k++) out[k] = html[k];
    blocks++;
  }
  return { text: out.join(""), blocks };
}

const lineOf = (src, off) => { let l = 1; for (let k = src.indexOf("\n"); k >= 0 && k < off; k = src.indexOf("\n", k + 1)) l++; return l; };
function matchClose(bare, open) {             // bare[open] is ( [ or {; returns index of its partner
  const pairs = { "(": ")", "[": "]", "{": "}" }, st = [];
  for (let k = open; k < bare.length; k++) {
    const ch = bare[k];
    if (pairs[ch]) st.push(pairs[ch]);
    else if (ch === ")" || ch === "]" || ch === "}") { if (st.pop() !== ch) return -1; if (!st.length) return k; }
  }
  return -1;
}
function topLevelArgs(bare, open, close) {    // [ [a,b], … ] offsets of each top-level argument
  const args = []; let depth = 0, start = open + 1;
  for (let k = open + 1; k < close; k++) {
    const ch = bare[k];
    if ("([{".includes(ch)) depth++; else if (")]}".includes(ch)) depth--;
    else if (ch === "," && depth === 0) { args.push([start, k]); start = k + 1; }
  }
  args.push([start, close]);
  return args.filter(([a, b]) => bare.slice(a, b).trim() !== "" || args.length === 1);
}
// "wk+\"_tasks\"" → "*_tasks"; "`ha_${x}`" → "ha_*"; "k" → "*"
function keyPattern(cmExpr) {
  let out = "", k = 0; const s = cmExpr.trim();
  while (k < s.length) {
    const ch = s[k];
    if (ch === '"' || ch === "'") { let j = k + 1; while (j < s.length && s[j] !== ch) { if (s[j] === "\\") j++; j++; } out += s.slice(k + 1, j); k = j + 1; continue; }
    if (ch === "`") { let j = k + 1; while (j < s.length && s[j] !== "`") { if (s[j] === "$" && s[j + 1] === "{") { const e = s.indexOf("}", j); out += "*"; j = e + 1; continue; } if (s[j] === "\\") j++; out += s[j]; j++; } k = j + 1; continue; }
    if (ch === "+" || /\s/.test(ch)) { k++; continue; }
    let j = k, depth = 0;                     // a non-literal piece: skip to the next top-level +
    while (j < s.length && !(depth === 0 && s[j] === "+")) { if ("([{".includes(s[j])) depth++; else if (")]}".includes(s[j])) depth--; j++; }
    if (!out.endsWith("*")) out += "*"; k = j;
  }
  return out || "*";
}
function evalPeriod(expr) {
  const e = expr.trim();
  if (!/^[\d\s.*+\-/()eE_]+$/.test(e)) return null;
  try { const v = Function("return (" + e.replace(/_/g, "") + ")")(); return typeof v === "number" && isFinite(v) ? v : null; } catch (x) { return null; }
}

// ── one file ────────────────────────────────────────────────────────────────────────────────────────────────────────
function readFile(dir, f) {
  const raw = fs.readFileSync(path.join(dir, f), "utf8");
  const js = f === "index.html" ? scriptOnly(raw).text : raw;
  return Object.assign({ file: f, raw, js }, scanJs(js));
}

function shortIntervals(F) {
  const out = [], re = /(?<![\w$])setInterval\s*\(/g; let m;
  while ((m = re.exec(F.bare))) {
    const open = m.index + m[0].length - 1, close = matchClose(F.bare, open);
    if (close < 0) continue;
    const args = topLevelArgs(F.bare, open, close);
    const periodExpr = args.length > 1 ? F.cm.slice(args[args.length - 1][0], args[args.length - 1][1]).trim() : "";
    const period = args.length > 1 ? evalPeriod(periodExpr) : 0;
    if (period !== null && period >= SHORT_MS) continue;
    const before = F.cm.slice(Math.max(0, m.index - 80), m.index), lhs = (before.match(/([\w$.\[\]"']+)\s*=\s*$/) || [, ""])[1];
    const head = F.cm.slice(args[0][0], args[0][1]).replace(/\s+/g, "").slice(0, 40);
    out.push({ file: F.file, key: F.file + "|" + lhs + "|" + head + "|" + (periodExpr || "none"), periodMs: period,
      line: lineOf(F.raw, m.index) });
  }
  return out;
}

function bootScan(F) {
  const funcs = {}, keys = new Set(), keySites = {};
  for (const name of BOOT_FUNCS) {
    const m = new RegExp("\\bfunction\\s+" + name + "\\s*\\(").exec(F.bare);
    if (!m) { funcs[name] = null; continue; }
    const open = F.bare.indexOf("{", F.bare.indexOf(")", m.index)), close = matchClose(F.bare, open);
    const cmBody = F.cm.slice(open, close);
    const on = cmBody.match(/\.on\(\s*["'`](?:value|child_added|child_changed|child_removed|child_moved)["'`]/g) || [];
    funcs[name] = { listeners: on.length, startLine: lineOf(F.raw, m.index), endLine: lineOf(F.raw, close) };
    const bareBody = F.bare.slice(open, close); let w; LS_WRITERS.lastIndex = 0;
    while ((w = LS_WRITERS.exec(bareBody))) {
      const o = open + w.index + w[0].length - 1, c = matchClose(F.bare, o); if (c < 0) continue;
      const a = topLevelArgs(F.bare, o, c)[0], pat = keyPattern(F.cm.slice(a[0], a[1]));
      keys.add(pat); (keySites[pat] = keySites[pat] || []).push(lineOf(F.raw, a[0]));
    }
  }
  return { funcs, keys: [...keys].sort(), keySites };
}

function commentStats(F) {
  let code = 0, comment = 0, blank = 0, other = 0;
  const raw = F.raw.split("\n"), js = F.js.split("\n"), cm = F.cm.split("\n");
  for (let k = 0; k < raw.length; k++) {
    if (!raw[k].trim()) blank++;
    else if (!js[k].trim()) other++;           // HTML/CSS outside <script>
    else if (cm[k].trim()) code++;
    else comment++;
  }
  let commentChars = 0; for (let k = 0; k < F.raw.length; k++) if (F.cm[k] !== F.js[k]) commentChars++;
  return { codeLines: code, commentLines: comment, blankLines: blank, htmlCssLines: other, commentChars };
}

// Biggest `NAME_START … NAME_END` blocks (bytes from the START marker to the END marker; nested blocks count in both).
function biggestBlocks(raw, top) {
  const out = [], re = /(?:\/\/|\/\*|<!--)\s*([A-Z][A-Z0-9_]*?)_START\b/g, seen = new Set(); let m;
  while ((m = re.exec(raw))) {
    const name = m[1]; if (seen.has(name)) continue;
    const er = new RegExp("\\b" + name + "_END\\b", "g"); er.lastIndex = m.index;
    const em = er.exec(raw); if (!em) continue; const e = em.index;
    seen.add(name);
    out.push({ name, bytes: Buffer.byteLength(raw.slice(m.index, e)), line: lineOf(raw, m.index) });
  }
  return out.sort((a, b) => b.bytes - a.bytes).slice(0, top || 15);
}

function measure(dir) {
  dir = dir || __dirname;
  const idxBuf = fs.readFileSync(path.join(dir, "index.html"));
  const index = readFile(dir, "index.html");
  const boot = bootScan(index);
  const lazy = {}, intervals = shortIntervals(index);
  for (const f of appJsFiles(dir)) {
    const buf = fs.readFileSync(path.join(dir, f));
    lazy[f] = { bytes: buf.length, gzipBytes: zlib.gzipSync(buf).length };
    intervals.push(...shortIntervals(readFile(dir, f)));
  }
  return {
    indexHtml: { bytes: idxBuf.length, gzipBytes: zlib.gzipSync(idxBuf).length, scriptBlocks: scriptOnly(index.raw).blocks },
    lazyFiles: lazy,
    bootListeners: { count: BOOT_FUNCS.reduce((s, n) => s + (boot.funcs[n] ? boot.funcs[n].listeners : 0), 0), byFunction: boot.funcs },
    shortIntervals: intervals,
    bootStorageKeys: { count: boot.keys.length, patterns: boot.keys, sites: boot.keySites },
    info: { comments: commentStats(index), biggestBlocks: biggestBlocks(index.raw, 15) },
  };
}

// ── CLI: rewrite the baseline ───────────────────────────────────────────────────────────────────────────────────────
if (require.main === module) {
  const argv = process.argv.slice(2), ri = argv.indexOf("--reason"), reason = ri >= 0 ? (argv[ri + 1] || "").trim() : "";
  const now = measure(__dirname), file = path.join(__dirname, "perf_budget.json");
  const old = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : null;
  const kb = b => (b / 1024).toFixed(1) + " KB";
  console.log("index.html " + kb(now.indexHtml.bytes) + " (gzip " + kb(now.indexHtml.gzipBytes) + ")" +
    (old ? "  baseline " + kb(old.indexHtml.bytes) : ""));
  console.log("boot listeners " + now.bootListeners.count + (old ? "  baseline " + old.bootListeners.count : ""));
  console.log("short setIntervals " + now.shortIntervals.length + (old ? "  baseline " + old.shortIntervals.length : ""));
  console.log("boot localStorage key patterns " + now.bootStorageKeys.count + (old ? "  baseline " + old.bootStorageKeys.count : ""));
  if (!reason) { console.log("\n(not written — run with --reason \"why the page had to grow\" to rewrite perf_budget.json)"); process.exit(0); }
  let commit = "?"; try { commit = require("child_process").execSync("git rev-parse --short HEAD", { cwd: __dirname, stdio: ["ignore", "pipe", "ignore"] }).toString().trim(); } catch (e) {}
  const date = new Date().toISOString().slice(0, 10);
  const purposes = {};                         // carry each grandfathered interval's purpose over by its key
  for (const iv of (old && old.shortIntervals) || []) (purposes[iv.key] = purposes[iv.key] || []).push(iv.purpose);
  const intervals = now.shortIntervals.map(iv => {
    const p = purposes[iv.key] && purposes[iv.key].length ? purposes[iv.key].shift() : "NEW " + date + ": " + reason;
    return { file: iv.file, line: iv.line, periodMs: iv.periodMs, purpose: p, key: iv.key };
  });
  const out = {
    _readme: "Baseline for test_perf_budget.js (PLAN_lg_performance_2026-11-08.md, Part 1). To accept growth on purpose run " +
      "`node perf_budget_measure.js --reason \"<one line: why>\"` — it rewrites these numbers and adds a history line. " +
      "Line numbers are where each interval was when measured; the key is what matches.",
    measuredOn: date, commit,
    indexHtml: { bytes: now.indexHtml.bytes, gzipBytes: now.indexHtml.gzipBytes, slackBytes: INDEX_SLACK_BYTES },
    lazyFiles: now.lazyFiles,
    bootListeners: { count: now.bootListeners.count, byFunction: Object.fromEntries(Object.entries(now.bootListeners.byFunction).map(([k, v]) => [k, v && v.listeners])) },
    shortIntervals: intervals,
    bootStorageKeys: { count: now.bootStorageKeys.count, patterns: now.bootStorageKeys.patterns },
    history: ((old && old.history) || []).concat([{ date, commit, indexBytes: now.indexHtml.bytes, reason }]),
  };
  fs.writeFileSync(file, JSON.stringify(out, null, 2) + "\n");
  console.log("\nwrote perf_budget.json (" + date + ", " + commit + "): " + reason);
  if (intervals.some(iv => /^NEW /.test(iv.purpose))) console.log("→ open perf_budget.json and replace each \"NEW …\" interval purpose with what it does.");
}

module.exports = { measure, scanJs, scriptOnly, keyPattern, evalPeriod, SHORT_MS, INDEX_SLACK_BYTES, BOOT_FUNCS };
