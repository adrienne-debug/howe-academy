#!/usr/bin/env node
// ENVBUILD — the Envirothon edition's stripped + minified + lightly obfuscated build of index.html.
// Design: DESIGN_envirothon_code_protection_2026-10-27.md §5 (Adrienne's ask 2026-10-27: "I do want to
// protect the code … I do need protection for my product") and DESIGN_envirothon_micro_academy_2026-10-27.md §2
// (the doors the edition closes). The readable index.html in the Howe repo is never changed by this script:
// it READS the repo's files and WRITES only into envirothon/dist/ (git-ignored).
//
//   node build_envirothon.js [--src <index.html>] [--out <dir>] [--no-obfuscate] [--no-minify] [--force-dryrun] [--quiet]
//
// What it does, in order:
//   1. read index.html, split it into head HTML / the one big <script> / tail HTML;
//   2. strip every // NAME_START … // NAME_END block named in strip_list.json (nested blocks go with their parent);
//   3. check the stripped script for references to names the strip removed (acorn): a reference at the top level of
//      the script would throw at boot, so the block that declared the name is KEPT and the strip is redone; a
//      reference inside a function is reported (it can only throw when that function runs) — the edition lock is
//      what keeps those callers unreachable;
//   4. terser: comments gone, whitespace gone, locals mangled. Top-level names are NOT mangled: this app calls its
//      globals by name from HTML it builds at runtime (onclick="…" inside template strings, ~1,400 distinct names)
//      and through window[f]; every such name is also passed as `reserved` so turning toplevel on later is a
//      one-line change that stays safe;
//   5. javascript-obfuscator on a light setting: hexadecimal identifiers, string array on, NO self-defending, NO debug
//      protection, NO control-flow flattening, NO dead-code injection, NO string rotation/encoding, console left alone
//      (the class device must stay fast and Adrienne must still be able to read a console);
//   6. reassemble the page with a build banner + copyright line, write dist/index.html, copy family-config.js, sw.js
//      and the four vendored Firebase files, and write dist/BUILD_REPORT.md (sizes, stripped vs kept, dangling refs).
//
// --force-dryrun is for verification only: it rewrites _dryRun() to return true in the BUILT page so the served copy
// can never write to a database whatever its URL says (reference_howe_safe_app_testing: never load this app without
// dryrun). Never ship a --force-dryrun build.
"use strict";
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// ── arguments ────────────────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
function argVal(flag, dflt) { const i = args.indexOf(flag); return i >= 0 && args[i + 1] ? args[i + 1] : dflt; }
const REPO = path.resolve(__dirname, "..", "..");
const SRC = path.resolve(argVal("--src", path.join(REPO, "index.html")));
const OUT = path.resolve(argVal("--out", path.join(REPO, "envirothon", "dist")));
const DO_OBF = !args.includes("--no-obfuscate");
const DO_MIN = !args.includes("--no-minify");
const FORCE_DRYRUN = args.includes("--force-dryrun");
const QUIET = args.includes("--quiet");
const log = (...a) => { if (!QUIET) console.log(...a); };

const LIST_PATH = path.join(__dirname, "strip_list.json");
const COPY_FILES = ["family-config.js", "sw.js", "vendor-firebase-app-v8.js", "vendor-firebase-database-v8.js",
  "vendor-firebase-auth-v8.js", "vendor-firebase-storage-v8.js"];
const COPYRIGHT = "© 2026 Adrienne Howe · Howe Academy · licensed to the Envirothon class · not for copying or redistribution";

// ── 1. read + split ──────────────────────────────────────────────────────────────────────────
function splitPage(html) {
  // The app is one big <script> (plus a few tiny ones in the head). Take the largest <script>…</script> pair.
  const re = /<script>\n([\s\S]*?)\n<\/script>/g; let m, best = null;
  while ((m = re.exec(html))) { if (!best || m[1].length > best.body.length) best = { start: m.index + "<script>\n".length, end: m.index + "<script>\n".length + m[1].length, body: m[1] }; }
  if (!best) throw new Error("no <script> block found in " + SRC);
  return { head: html.slice(0, best.start), script: best.body, tail: html.slice(best.end) };
}

// ── 2. markers ───────────────────────────────────────────────────────────────────────────────
// A marker is a WHOLE line: optional indent, then "// NAME_START" or "// NAME_END". A trailing "// X_START" comment on a
// code line (LIVINGDAY has those) is not a marker. A name is usable only when it has exactly one START and one END.
function scanMarkers(lines) {
  const starts = {}, ends = {};
  lines.forEach((l, i) => {
    let m = l.match(/^\s*\/\/ ([A-Z][A-Z0-9_]*)_START\b/); if (m) (starts[m[1]] = starts[m[1]] || []).push(i);
    m = l.match(/^\s*\/\/ ([A-Z][A-Z0-9_]*)_END\b/); if (m) (ends[m[1]] = ends[m[1]] || []).push(i);
  });
  const blocks = {}, ambiguous = [];
  for (const n of Object.keys(starts)) {
    const s = starts[n], e = ends[n] || [];
    if (s.length === 1 && e.length === 1 && e[0] > s[0]) blocks[n] = { name: n, start: s[0], end: e[0] };
    else ambiguous.push(n + " (START×" + s.length + ", END×" + e.length + ")");
  }
  return { blocks, ambiguous };
}

function stripBlocks(lines, blocks, names) {
  // Remove whole line ranges. Sort by start; a range inside an already-removed range is reported as "inside".
  const ranges = names.map(n => blocks[n]).filter(Boolean).sort((a, b) => a.start - b.start);
  const removed = [], inside = [];
  const cut = new Array(lines.length).fill(false);
  let lastEnd = -1, lastName = null;
  for (const r of ranges) {
    if (r.start <= lastEnd) { inside.push(r.name + " (inside " + lastName + ")"); if (r.end > lastEnd) { for (let i = lastEnd + 1; i <= r.end; i++) cut[i] = true; lastEnd = r.end; } continue; }
    for (let i = r.start; i <= r.end; i++) cut[i] = true;
    removed.push(r.name); lastEnd = r.end; lastName = r.name;
  }
  // Every other marked block that fell inside a removed range went with it — say so.
  const swept = Object.values(blocks).filter(b => !names.includes(b.name) && cut[b.start] && cut[b.end]).map(b => b.name);
  const out = []; const lineMap = [];   // lineMap[newIndex] = oldIndex
  lines.forEach((l, i) => { if (!cut[i]) { out.push(l); lineMap.push(i); } });
  return { lines: out, lineMap, removed, inside, swept, cutLines: cut.filter(Boolean).length };
}

// ── 3. dangling-reference check (acorn) ──────────────────────────────────────────────────────
function loadAcorn() {
  try { return { acorn: require("acorn"), walk: require("acorn-walk") }; }
  catch (e) { throw new Error("acorn is not installed — run `npm ci` in envirothon/build first (" + e.message + ")"); }
}
function parse(src) {
  const { acorn } = loadAcorn();
  return acorn.parse(src, { ecmaVersion: "latest", sourceType: "script", locations: true, allowReturnOutsideFunction: false, allowHashBang: true });
}
function patternNames(p, out) {
  if (!p) return out;
  switch (p.type) {
    case "Identifier": out.push(p.name); break;
    case "ObjectPattern": p.properties.forEach(pr => patternNames(pr.type === "RestElement" ? pr.argument : pr.value, out)); break;
    case "ArrayPattern": p.elements.forEach(el => patternNames(el, out)); break;
    case "RestElement": patternNames(p.argument, out); break;
    case "AssignmentPattern": patternNames(p.left, out); break;
  }
  return out;
}
// Every name declared anywhere (coarse, not per scope) → {name: [line, …]}; plus implicit globals (x = …, window.x = …).
function declaredNames(ast) {
  const { walk } = loadAcorn(); const decl = new Map();
  const add = (n, line) => { if (!decl.has(n)) decl.set(n, []); decl.get(n).push(line); };
  walk.full(ast, node => {
    if (node.type === "FunctionDeclaration" || node.type === "ClassDeclaration") { if (node.id) add(node.id.name, node.loc.start.line); }
    if (node.type === "VariableDeclarator") patternNames(node.id, []).forEach(n => add(n, node.loc.start.line));
    if (node.type === "FunctionDeclaration" || node.type === "FunctionExpression" || node.type === "ArrowFunctionExpression") {
      node.params.forEach(p => patternNames(p, []).forEach(n => add(n, node.loc.start.line))); if (node.type === "FunctionExpression" && node.id) add(node.id.name, node.loc.start.line);
    }
    if (node.type === "CatchClause" && node.param) patternNames(node.param, []).forEach(n => add(n, node.loc.start.line));
    if (node.type === "AssignmentExpression") {
      if (node.left.type === "Identifier") add(node.left.name, node.loc.start.line);
      if (node.left.type === "MemberExpression" && node.left.object.type === "Identifier" && node.left.object.name === "window") {
        if (!node.left.computed && node.left.property.type === "Identifier") add(node.left.property.name, node.loc.start.line);
        if (node.left.computed && node.left.property.type === "Literal") add(String(node.left.property.value), node.loc.start.line);
      }
    }
  });
  return decl;
}
// Every identifier READ (not a declaration, not a property name, not a label, not `typeof x`), with its enclosing function.
function referencedNames(ast, wanted, src) {
  const { walk } = loadAcorn(); const refs = [];
  const testHasTypeof = (t, name) => !!t && src.slice(t.start, t.end).includes("typeof " + name);
  walk.fullAncestor(ast, (node, _st, ancestors) => {
    if (node.type !== "Identifier" || !wanted.has(node.name)) return;
    const parent = ancestors[ancestors.length - 2]; if (!parent) return;
    if (parent.type === "MemberExpression" && parent.property === node && !parent.computed) return;
    if (parent.type === "Property" && parent.key === node && !parent.computed && !parent.shorthand) return;
    if (parent.type === "MethodDefinition" || parent.type === "PropertyDefinition") { if (parent.key === node && !parent.computed) return; }
    if ((parent.type === "LabeledStatement" || parent.type === "BreakStatement" || parent.type === "ContinueStatement") && parent.label === node) return;
    if (parent.type === "VariableDeclarator" && parent.id === node) return;
    if ((parent.type === "FunctionDeclaration" || parent.type === "FunctionExpression" || parent.type === "ClassDeclaration") && parent.id === node) return;
    if (/Function/.test(parent.type) && parent.params.includes(node)) return;
    if (parent.type === "CatchClause" && parent.param === node) return;
    if (parent.type === "UnaryExpression" && parent.operator === "typeof") return;   // typeof x never throws
    if (parent.type === "AssignmentExpression" && parent.left === node) return;       // a write creates the global
    // Guarded = cannot throw at runtime: inside a try block, or behind a `typeof name` test (if / ?: / &&).
    let guarded = false;
    for (let i = ancestors.length - 2; i >= 0; i--) {
      const a = ancestors[i], child = ancestors[i + 1];
      if (a.type === "TryStatement" && a.block === child) { guarded = true; break; }
      if ((a.type === "IfStatement" || a.type === "ConditionalExpression") && child !== a.test && testHasTypeof(a.test, node.name)) { guarded = true; break; }
      if (a.type === "LogicalExpression" && a.right === child && testHasTypeof(a.left, node.name)) { guarded = true; break; }
      if (/Function/.test(a.type)) break;
    }
    let fn = null;
    for (let i = ancestors.length - 2; i >= 0; i--) { const a = ancestors[i]; if (/Function/.test(a.type)) { fn = a; break; } }
    let fnName = "(top level)";
    if (fn) {
      fnName = (fn.id && fn.id.name) || null;
      if (!fnName) { const p = ancestors[ancestors.indexOf(fn) - 1]; fnName = (p && p.type === "VariableDeclarator" && p.id.name) || (p && p.type === "Property" && p.key && p.key.name) || (p && p.type === "AssignmentExpression" && p.left.type === "MemberExpression" && p.left.property && p.left.property.name) || "(anonymous)"; }
    }
    refs.push({ name: node.name, line: node.loc.start.line, fn: fnName, topLevel: !fn, guarded });
  });
  return refs;
}

// ── 4. reserved names ────────────────────────────────────────────────────────────────────────
// Every global the page calls BY NAME: on*="…" attributes in the HTML, on*="…" inside the script's HTML strings,
// the window[f] kiosk lookups, and what the sibling files expect.
function collectReserved(html, script, extra) {
  const names = new Set(extra);
  const add = (s) => { const m = s.match(/^\s*(?:return\s+|void\s+|!)?([A-Za-z_$][\w$]*)\s*\(/); if (m) names.add(m[1]); else { const w = s.match(/^\s*([A-Za-z_$][\w$]*)\s*[;=]/); if (w) names.add(w[1]); } };
  for (const m of html.matchAll(/\son[a-z]+="([^"]*)"/g)) add(m[1]);
  for (const m of html.matchAll(/\son[a-z]+='([^']*)'/g)) add(m[1]);
  // inside JS strings the quote may be escaped: onclick=\"foo()\" or onclick='foo()' or onclick=\'foo()\'
  for (const m of script.matchAll(/on[a-z]+=\\?["'](?:\\')?\s*((?:return\s+)?[A-Za-z_$][\w$]*)\s*\(/g)) names.add(m[1].replace(/^return\s+/, ""));
  for (const m of script.matchAll(/\[\s*((?:"[A-Za-z_$][\w$]*"\s*,?\s*)+)\]\.some\(f=>/g)) for (const q of m[1].matchAll(/"([^"]+)"/g)) names.add(q[1]);
  for (const m of script.matchAll(/window\[\s*"([A-Za-z_$][\w$]*)"\s*\]/g)) names.add(m[1]);
  return [...names].filter(n => !["if", "for", "while", "return", "function", "var", "let", "const", "new", "this", "typeof", "void", "true", "false", "null", "event"].includes(n)).sort();
}

// ── main ─────────────────────────────────────────────────────────────────────────────────────
async function main() {
  const t0 = Date.now();
  const list = JSON.parse(fs.readFileSync(LIST_PATH, "utf8"));
  const html = fs.readFileSync(SRC, "utf8");
  const sizeBefore = Buffer.byteLength(html);
  const { head, script, tail } = splitPage(html);
  const lines = script.split("\n");
  const { blocks, ambiguous } = scanMarkers(lines);
  log(`ENVBUILD — source ${SRC} (${sizeBefore.toLocaleString()} bytes, ${html.split("\n").length.toLocaleString()} lines; big script ${lines.length.toLocaleString()} lines, ${Object.keys(blocks).length} usable marker blocks, ${ambiguous.length} ambiguous)`);

  const wanted = list.strip.map(s => s.name);
  const missing = wanted.filter(n => !blocks[n]);
  if (missing.length) throw new Error("strip_list.json names blocks that are not a single START/END pair in index.html: " + missing.join(", "));
  const keepNames = new Set((list.keep || []).map(k => k.name));
  const bothSides = wanted.filter(n => keepNames.has(n));
  if (bothSides.length) throw new Error("strip_list.json lists these under both strip and keep: " + bothSides.join(", "));

  // Declarations in the ORIGINAL script, so a dangling name can be traced to the block that declared it.
  const origDecl = declaredNames(parse(script));
  const blockOfLine = (line1) => { // innermost STRIP-LISTED block containing a 1-based line
    let best = null; for (const n of wanted) { const b = blocks[n]; if (b.start + 1 <= line1 && line1 <= b.end + 1 && (!best || (b.end - b.start) < (best.end - best.start))) best = b; } return best && best.name;
  };

  // Strip, then re-strip without any block whose removal leaves a top-level reference dangling, until stable.
  let active = wanted.slice(); const keptByNeed = []; let strip, danglingInFn = [];
  for (let round = 1; ; round++) {
    strip = stripBlocks(lines, blocks, active);
    const stripped = strip.lines.join("\n");
    const ast = parse(stripped);
    const keptDecl = declaredNames(ast);
    const removedNames = new Set([...origDecl.keys()].filter(n => !keptDecl.has(n)));
    const refs = referencedNames(ast, removedNames, stripped);
    const top = refs.filter(r => r.topLevel && !r.guarded);
    danglingInFn = refs.filter(r => !(r.topLevel && !r.guarded));
    if (!top.length) { log(`strip round ${round}: ${strip.removed.length} blocks removed, ${strip.cutLines.toLocaleString()} lines; no top-level dangling reference`); break; }
    const culprits = new Set();
    for (const r of top) {
      const declLines = origDecl.get(r.name) || []; const b = declLines.map(blockOfLine).find(Boolean);
      keptByNeed.push({ block: b || "?", name: r.name, line: strip.lineMap[r.line - 1] + 1, fn: r.fn });
      if (b) culprits.add(b); else throw new Error("top-level reference to `" + r.name + "` dangles but no stripped block declares it");
    }
    log(`strip round ${round}: top-level dangling ${[...new Set(top.map(r => r.name))].join(", ")} → keeping ${[...culprits].join(", ")}`);
    active = active.filter(n => !culprits.has(n));
  }
  // Map dangling-in-function lines back to source lines and to the block that declared the name.
  const danglingReport = danglingInFn.map(r => ({ name: r.name, declaredIn: (origDecl.get(r.name) || []).map(blockOfLine).find(Boolean) || "?", usedBy: r.fn, srcLine: strip.lineMap[r.line - 1] + 1, guarded: r.guarded }));
  const byName = {}, guardedOnly = {};
  for (const d of danglingReport) {
    if (d.guarded) { (guardedOnly[d.name] = guardedOnly[d.name] || { declaredIn: d.declaredIn, callers: new Set() }).callers.add(d.usedBy); continue; }
    (byName[d.name] = byName[d.name] || { declaredIn: d.declaredIn, callers: new Set() }).callers.add(d.usedBy);
  }
  for (const n of Object.keys(guardedOnly)) if (byName[n]) delete guardedOnly[n];   // a name with one bare use is listed as bare

  let js = strip.lines.join("\n");
  if (FORCE_DRYRUN) {
    const needle = 'function _dryRun(){ try{ return /[?&]dryrun=1/.test(location.search)||HA_LS.getItem("ha_dryrun")==="1"; }catch(e){ return false; } }';
    const n = js.split(needle).length - 1; if (n !== 1) throw new Error("--force-dryrun: expected exactly one _dryRun() definition, found " + n);
    js = js.replace(needle, "function _dryRun(){ return true; }   /* ENVBUILD --force-dryrun: verification build, never ship */");
    log("--force-dryrun: _dryRun() now always returns true in this build");
  }
  const strippedBytes = Buffer.byteLength(js);

  // Reserved names.
  const reserved = collectReserved(head + tail, script, list.reservedExtra || []);
  log(`reserved names: ${reserved.length}`);

  // terser
  let minified = js, terserMs = 0;
  if (DO_MIN) {
    const t = Date.now(); const { minify } = require("terser");
    const res = await minify(js, {
      ecma: 2020, toplevel: false,
      compress: { toplevel: false, passes: 1, drop_console: false, keep_fargs: true, keep_classnames: true, keep_fnames: false, unused: true, dead_code: true, directives: true, inline: 1 },
      mangle: { toplevel: false, reserved, keep_classnames: true },
      format: { comments: false, ascii_only: false },
    });
    if (res.error) throw res.error; minified = res.code; terserMs = Date.now() - t;
    log(`terser: ${strippedBytes.toLocaleString()} → ${Buffer.byteLength(minified).toLocaleString()} bytes in ${(terserMs / 1000).toFixed(1)} s`);
  }
  // javascript-obfuscator (light)
  let obfuscated = minified, obfMs = 0;
  if (DO_OBF) {
    const t = Date.now(); const JO = require("javascript-obfuscator");
    const o = JO.obfuscate(minified, {
      compact: true, simplify: true, target: "browser", seed: list.obfuscatorSeed || 1,
      identifierNamesGenerator: "hexadecimal", renameGlobals: false, renameProperties: false, reservedNames: reserved.map(n => "^" + n.replace(/\$/g, "\\$") + "$"),
      stringArray: true, stringArrayThreshold: 0.5, stringArrayRotate: false, stringArrayShuffle: true, stringArrayEncoding: [], stringArrayIndexShift: false,
      stringArrayCallsTransform: false, stringArrayWrappersCount: 1, stringArrayWrappersChainedCalls: false, stringArrayWrappersType: "variable",
      splitStrings: false, unicodeEscapeSequence: false, transformObjectKeys: false, numbersToExpressions: false,
      controlFlowFlattening: false, deadCodeInjection: false, selfDefending: false, debugProtection: false, disableConsoleOutput: false,
      domainLock: list.domainLock || [], log: false, sourceMap: false,
      ...(list.obfuscator || {}),   // strip_list.json may override any option above (e.g. stringArrayThreshold)
    });
    obfuscated = o.getObfuscatedCode(); obfMs = Date.now() - t;
    log(`obfuscator: ${Buffer.byteLength(minified).toLocaleString()} → ${Buffer.byteLength(obfuscated).toLocaleString()} bytes in ${(obfMs / 1000).toFixed(1)} s`);
  }

  // The HTML parser ends a <script> at the first "</script" it sees, wherever it is. The source never writes one inside a
  // string (it concatenates "</scr"+"ipt>"), but terser folds that constant and the obfuscator re-emits it raw. Escape it:
  // "<\/script" is the same string to JavaScript and invisible to the HTML parser. (terser's inline_script does this too,
  // but the obfuscator runs after it.)
  obfuscated = obfuscated.replace(/<\/script/gi, "<\\/script");
  if (/<\/script/i.test(obfuscated)) throw new Error("a </script sequence survived escaping");

  // Reassemble + write.
  let commit = "unknown"; try { commit = execSync("git rev-parse --short HEAD", { cwd: REPO, stdio: ["ignore", "pipe", "ignore"] }).toString().trim(); } catch (e) {}
  const banner = `/* Howe Academy · Envirothon edition · built ${new Date().toISOString()} from ${commit}${FORCE_DRYRUN ? " · VERIFICATION BUILD (dry-run forced)" : ""} · ${COPYRIGHT} */\n`;
  const outHtml = head + banner + obfuscated + "\n" + tail;
  const closeTags = (h) => (h.match(/<\/script>/gi) || []).length;
  if (closeTags(outHtml) !== closeTags(html)) throw new Error("built page has " + closeTags(outHtml) + " </script> tags, source has " + closeTags(html));
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, "index.html"), outHtml);
  const copied = [];
  for (const f of COPY_FILES) { const p = path.join(REPO, f); if (fs.existsSync(p)) { fs.copyFileSync(p, path.join(OUT, f)); copied.push(f); } else log("  (not found, not copied: " + f + ")"); }
  const sizeAfter = Buffer.byteLength(outHtml);

  // Report.
  const kept = keptByNeed.map(k => k.block); const keptSet = [...new Set(kept)];
  const report = [];
  report.push(`# ENVBUILD report — ${new Date().toISOString()} · source commit ${commit}${FORCE_DRYRUN ? " · VERIFICATION BUILD (dry-run forced; never ship)" : ""}`);
  report.push(``, `| | bytes |`, `|---|---|`, `| index.html before | ${sizeBefore.toLocaleString()} |`, `| big script after strip | ${strippedBytes.toLocaleString()} |`,
    `| after terser | ${Buffer.byteLength(minified).toLocaleString()} |`, `| after obfuscator | ${Buffer.byteLength(obfuscated).toLocaleString()} |`, `| index.html after | ${sizeAfter.toLocaleString()} (${(100 * sizeAfter / sizeBefore).toFixed(1)}% of before) |`);
  report.push(``, `## Stripped (${strip.removed.length} listed blocks, ${strip.cutLines.toLocaleString()} lines)`, strip.removed.join(", "));
  if (strip.inside.length) report.push(``, `Listed blocks that sat inside another stripped block: ${strip.inside.join(", ")}`);
  if (strip.swept.length) report.push(``, `Unlisted blocks that went with a stripped parent: ${strip.swept.join(", ")}`);
  report.push(``, `## Kept although listed (${keptSet.length})`, keptSet.length ? keptSet.map(b => `- ${b}: ` + keptByNeed.filter(k => k.block === b).map(k => "`" + k.name + "` is read at the top level (line " + k.line + ")").join("; ")).join("\n") : "none");
  report.push(``, `## Kept on purpose (strip_list.json \`keep\`)`, (list.keep || []).map(k => `- ${k.name}: ${k.why}`).join("\n"));
  report.push(``, `## Dangling references inside functions (${Object.keys(byName).length} names)`, `A kept function still names something a stripped block declared. It only throws if that function runs; the edition lock (settings/edition) keeps these callers off the screen.`);
  for (const n of Object.keys(byName).sort()) report.push(`- \`${n}\` (declared in ${byName[n].declaredIn}) ← ${[...byName[n].callers].sort().join(", ")}`);
  report.push(``, `## Guarded references (${Object.keys(guardedOnly).length} names: every use sits in a try block or behind a \`typeof\` test, so it never throws)`);
  for (const n of Object.keys(guardedOnly).sort()) report.push(`- \`${n}\` (declared in ${guardedOnly[n].declaredIn}) ← ${[...guardedOnly[n].callers].sort().join(", ")}`);
  report.push(``, `## Ambiguous markers (never strippable: more than one START or END)`, ambiguous.join(", ") || "none");
  report.push(``, `## Reserved names (${reserved.length})`, reserved.join(" "));
  report.push(``, `## Copied`, copied.join(", "));
  fs.writeFileSync(path.join(OUT, "BUILD_REPORT.md"), report.join("\n") + "\n");

  log(``, `index.html: ${sizeBefore.toLocaleString()} → ${sizeAfter.toLocaleString()} bytes (${(100 * sizeAfter / sizeBefore).toFixed(1)}%)`);
  log(`stripped ${strip.removed.length} blocks (${strip.cutLines.toLocaleString()} lines); kept although listed: ${keptSet.length ? keptSet.join(", ") : "none"}`);
  log(`dangling in functions: ${Object.keys(byName).length} names (see ${path.join(OUT, "BUILD_REPORT.md")})`);
  log(`wrote ${OUT} (${["index.html", "BUILD_REPORT.md"].concat(copied).join(", ")}) in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
  return { sizeBefore, sizeAfter, removed: strip.removed, kept: keptSet, dangling: byName, guarded: guardedOnly, reserved, out: OUT };
}

if (require.main === module) main().catch(e => { console.error("ENVBUILD failed:", e && e.stack || e); process.exit(1); });
module.exports = { main, splitPage, scanMarkers, stripBlocks, collectReserved };
