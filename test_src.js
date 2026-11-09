/*
 * test_src.js — the page as ONE source again, for the tests and the Envirothon builds (LAZYSPLIT, PLAN_lg_performance_2026-11-08.md
 * Part 2, 2026-11-08). Her words 11/8: the LG "gets slow every week" — so the areas most devices never open moved out of
 * index.html into their own files, loaded on first use (classes.js = the class platform, CP*). Each moved block left ONE
 * marker line where it stood:
 *     // ⇢ classes.js: CPCLASS            (one block)
 *     // ⇢ classes.js: CPLINCOLN..CPTRIM  (a run whose ranges touch: from the first START line to the last END line)
 * testSrc() puts every block back at its marker (recursively: a moved block may itself hold a marker), so a test that
 * slices `// NAME_START` … `// NAME_END` out of the page, or runs the main script in a vm, reads the same source as before
 * the split — byte for byte (test_lazy_split.js checks the round trip). It is NOT how the app runs: the app loads the
 * files lazily (haLazyLoad in index.html); test_lazy_split.js checks that side.
 *   const src = require("./test_src.js")();           // index.html beside this file, blocks put back
 *   const src = require("./test_src.js")(otherPath);  // another copy (a family repo): the split files beside THAT file
 *   run:  node test_src.js   (self-check: every marker resolves, the joined main script parses)
 */
const fs = require("fs"), path = require("path");
const MARK = /^\/\/ ⇢ ([a-z][a-z0-9_-]*\.js): ([A-Z][A-Z0-9_]*)(?:\.\.([A-Z][A-Z0-9_]*))?$/;
const _files = {};
function fileLines(f) { if (!_files[f]) _files[f] = fs.readFileSync(f, "utf8").split("\n"); return _files[f]; }
function blockIn(f, first, last) {
  const L = fileLines(f);
  const sRe = new RegExp("//\\s*(?:──\\s*)?" + first + "_START\\b"), eRe = new RegExp("//\\s*(?:──\\s*)?" + last + "_END\\b");
  const s = L.findIndex(l => sRe.test(l));
  if (s < 0) throw new Error("test_src: " + first + "_START not found in " + path.basename(f));
  let e = -1; for (let i = s; i < L.length; i++) if (eRe.test(L[i])) { e = i; break; }
  if (e < 0) throw new Error("test_src: " + last + "_END not found in " + path.basename(f));
  return L.slice(s, e + 1);
}
function expand(lines, dir, depth) {
  if (depth > 8) throw new Error("test_src: markers nest too deep");
  const out = [];
  for (const l of lines) {
    const m = MARK.exec(l);
    if (!m) { out.push(l); continue; }
    const f = path.join(dir, m[1]);
    for (const x of expand(blockIn(f, m[2], m[3] || m[2]), dir, depth + 1)) out.push(x);
  }
  return out;
}
// The page with every moved block back in place.
function testSrc(file) {
  file = file || path.join(__dirname, "index.html");
  return expand(fs.readFileSync(file, "utf8").split("\n"), path.dirname(file), 0).join("\n");
}
// The markers a page holds: [{line, file, first, last}]
function markers(src) {
  const out = []; String(src).split("\n").forEach((l, i) => { const m = MARK.exec(l); if (m) out.push({ line: i + 1, file: m[1], first: m[2], last: m[3] || m[2] }); });
  return out;
}
module.exports = testSrc;
module.exports.testSrc = testSrc;
module.exports.markers = markers;
module.exports.MARK = MARK;

if (require.main === module) {
  let pass = 0, fail = 0;
  const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x) + ")" : "")); } };
  const raw = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
  let joined = null; try { joined = testSrc(); ok("every marker in index.html resolves to its block", true); } catch (e) { ok("every marker in index.html resolves to its block", false, e.message); }
  if (joined) {
    ok("nothing is left as a marker after joining", markers(joined).length === 0, markers(joined).slice(0, 3));
    const L = joined.split("\n"), a = L.lastIndexOf("<script>"), b = L.lastIndexOf("</script>");
    try { new Function(L.slice(a + 1, b).join("\n")); ok("the joined main script parses", true); } catch (e) { ok("the joined main script parses", false, e.message); }
    ok("joining only adds lines (a marker never stands in for nothing)", joined.length >= raw.length);
  }
  console.log("\n" + pass + " passed, " + fail + " failed"); process.exit(fail ? 1 : 0);
}
