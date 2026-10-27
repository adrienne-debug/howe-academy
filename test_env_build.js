// test_env_build.js — ENVBUILD: the Envirothon edition's stripped + minified + obfuscated build (2026-10-27).
// Checks, with no framework: strip_list.json parses and every name it lists is exactly one // NAME_START … // NAME_END
// pair in index.html; the reserved-name scan finds the names the page calls by string; and, when envirothon/build has its
// node_modules (`npm ci` there), the build runs into a temp folder, the output exists, every reserved name the source
// declares survives in it, no marker comment survives, the size dropped, and the dist/node_modules folders are git-ignored.
// The build never touches index.html or any database: it reads the repo and writes only to the --out folder.
"use strict";
const fs = require("fs"), path = require("path"), os = require("os"), cp = require("child_process");
const REPO = __dirname;
const BUILD_DIR = path.join(REPO, "envirothon", "build");
const src = fs.readFileSync(path.join(REPO, "index.html"), "utf8");
let pass = 0, fail = 0;
function ok(cond, msg) { if (cond) { pass++; } else { fail++; console.log("  ✗ " + msg); } }

// 1. the list
const list = JSON.parse(fs.readFileSync(path.join(BUILD_DIR, "strip_list.json"), "utf8"));
ok(Array.isArray(list.strip) && list.strip.length > 50, "strip_list.json has a strip list of real size (" + (list.strip || []).length + ")");
ok(Array.isArray(list.keep) && list.keep.length > 0, "strip_list.json has a keep list");
const stripNames = list.strip.map(s => s.name), keepNames = list.keep.map(k => k.name);
ok(new Set(stripNames).size === stripNames.length, "no duplicate strip names");
ok(!stripNames.some(n => keepNames.includes(n)), "no name is both stripped and kept");
for (const s of list.strip) ok(s.why && s.door, "strip entry " + s.name + " says its door and why");

// 2. every listed marker is exactly one START/END pair, whole-line, START before END
const lines = src.split("\n");
const count = (re) => lines.filter(l => re.test(l)).length;
const lineOf = (re) => lines.findIndex(l => re.test(l));
for (const n of stripNames.concat(keepNames)) {
  const sRe = new RegExp("^\\s*// " + n + "_START\\b"), eRe = new RegExp("^\\s*// " + n + "_END\\b");
  const sN = count(sRe), eN = count(eRe);
  ok(sN === 1 && eN === 1, n + ": exactly one START and one END line (" + sN + "/" + eN + ")");
  if (sN === 1 && eN === 1) ok(lineOf(sRe) < lineOf(eRe), n + ": START comes before END");
}
// the ambiguous ones (several STARTs) must never be listed
for (const amb of ["LIVINGDAY", "ADD", "DIGEST", "LAUNDRY", "FIXEDCLASS_DOOR"]) ok(!stripNames.includes(amb), amb + " (ambiguous marker) is not in the strip list");

// 3. the build module's own pieces
const B = require(path.join(BUILD_DIR, "build_envirothon.js"));
const parts = B.splitPage(src);
ok(parts.script.includes("function initFb()") && parts.script.includes("function renderAll()"), "the big script was found (initFb + renderAll inside)");
ok(parts.head.includes("<script src=\"family-config.js\"></script>"), "the head keeps the family-config.js tag");
const scan = B.scanMarkers(parts.script.split("\n"));
ok(Object.keys(scan.blocks).length > 250, "scanMarkers finds the marker blocks (" + Object.keys(scan.blocks).length + ")");
ok(scan.ambiguous.length >= 1 && scan.ambiguous.every(a => !stripNames.includes(a.split(" ")[0])), "scanMarkers' ambiguous names (" + scan.ambiguous.join("; ") + ") are not in the strip list");
// a trailing "// LIVINGDAY_START" comment on a code line is an annotation, not a marker: only whole-line markers count
ok(lines.filter(l => /\/\/ LIVINGDAY_START/.test(l)).length > 1 && count(/^\s*\/\/ LIVINGDAY_START\b/) === 0 && !scan.blocks.LIVINGDAY, "only whole-line markers count (LIVINGDAY's five STARTs are all trailing annotations, so it is no block)");
for (const n of stripNames) ok(!!scan.blocks[n], "scanMarkers has " + n);
const reserved = B.collectReserved(parts.head + parts.tail, parts.script, list.reservedExtra || []);
ok(reserved.length > 1000, "reserved names: " + reserved.length + " (> 1000)");
for (const n of ["_kiosk", "_kioskR", "_kioskD", "_kioskK", "HA_FAMILY", "HoweNotebooks", "toggleAdmin", "showTab", "mastSetView", "unitEnroll"]) ok(reserved.includes(n), "reserved includes " + n);
ok(reserved.every(n => /^[A-Za-z_$][\w$]*$/.test(n)), "every reserved name is a plain identifier");

// 4. git-ignore
const ignored = (p) => { try { cp.execSync("git check-ignore -q " + JSON.stringify(p), { cwd: REPO, stdio: "ignore" }); return true; } catch (e) { return false; } };
ok(ignored("envirothon/dist/index.html"), "envirothon/dist/ is git-ignored");
ok(ignored("envirothon/build/node_modules/terser/package.json"), "envirothon/build/node_modules/ is git-ignored");

// 5. the build itself (only when its tools are installed — `npm ci` in envirothon/build)
const installed = fs.existsSync(path.join(BUILD_DIR, "node_modules", "terser")) && fs.existsSync(path.join(BUILD_DIR, "node_modules", "javascript-obfuscator")) && fs.existsSync(path.join(BUILD_DIR, "node_modules", "acorn"));
if (!installed) {
  console.log("  (build run skipped: envirothon/build/node_modules is not installed — run `npm ci` there to cover it)");
} else {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), "envbuild-test-"));
  const srcBytes = Buffer.byteLength(src);
  let res = cp.spawnSync(process.execPath, ["--max-old-space-size=8192", path.join(BUILD_DIR, "build_envirothon.js"), "--out", out, "--quiet"], { cwd: BUILD_DIR, encoding: "utf8" });
  ok(res.status === 0, "build exits 0" + (res.status !== 0 ? ":\n" + res.stderr : ""));
  const outFile = path.join(out, "index.html");
  ok(fs.existsSync(outFile), "dist/index.html exists");
  if (fs.existsSync(outFile)) {
    const built = fs.readFileSync(outFile, "utf8"); const builtBytes = Buffer.byteLength(built);
    ok(builtBytes < srcBytes * 0.9, "size dropped: " + srcBytes + " → " + builtBytes);
    ok(!built.includes("VERIFICATION BUILD"), "a normal build is not a --force-dryrun build");
    ok(built.includes("© 2026 Adrienne Howe"), "the copyright line is in the page");
    ok((built.match(/<\/script>/g) || []).length === (src.match(/<\/script>/g) || []).length, "same number of </script> tags as the source");
    const bp = B.splitPage(built);
    ok(!/\/\/ [A-Z][A-Z0-9_]*_START\b/.test(bp.script), "no // NAME_START marker survives in the built script");
    ok(!bp.script.includes("her report 2026-"), "no dated comment survives in the built script");
    // every reserved name the source declares as a top-level function must still be there by name (the page calls it by string)
    // (names declared inside a stripped block are gone with it, so look only at the text the strip leaves)
    const keptText = B.stripBlocks(parts.script.split("\n"), scan.blocks, stripNames).lines.join("\n");
    const declared = reserved.filter(n => new RegExp("(^|\\n)function " + n.replace(/\$/g, "\\$") + "\\(").test(keptText));
    const missing = declared.filter(n => !new RegExp("function " + n.replace(/\$/g, "\\$") + "\\(").test(bp.script));
    ok(declared.length > 500, "reserved names declared as top-level functions in the source: " + declared.length);
    ok(missing.length === 0, "every such name survives in the build" + (missing.length ? " — missing: " + missing.slice(0, 10).join(", ") : ""));
    // what the strip must have removed, and what it must not
    ok(!bp.script.includes("function renderGrocery("), "renderGrocery (GROCERY_LIST) is gone");
    ok(!bp.script.includes("function kitRotRun(") && !bp.script.includes("function cbMaterialize("), "KITROT2 / CBGEN functions are gone");
    ok(bp.script.includes("function starterUnitAdd(") && bp.script.includes("function haAuthGate(") && bp.script.includes("function initFb("), "starterUnitAdd, haAuthGate and initFb stay");
    ok(bp.script.includes("function _dryRun(") && bp.script.includes("dryrun=1"), "the ?dryrun=1 switch is still in the build");
    for (const f of ["family-config.js", "sw.js", "vendor-firebase-app-v8.js", "vendor-firebase-database-v8.js", "vendor-firebase-auth-v8.js", "vendor-firebase-storage-v8.js", "BUILD_REPORT.md"]) ok(fs.existsSync(path.join(out, f)), "dist has " + f);
    const rep = fs.readFileSync(path.join(out, "BUILD_REPORT.md"), "utf8");
    ok(/## Stripped \(\d+ listed blocks/.test(rep) && rep.includes("## Kept although listed"), "BUILD_REPORT.md lists stripped and kept");
  }
  // index.html untouched by the build
  ok(fs.readFileSync(path.join(REPO, "index.html"), "utf8") === src, "index.html is byte-for-byte unchanged after the build");
  try { fs.rmSync(out, { recursive: true, force: true }); } catch (e) {}
}

console.log(`test_env_build: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
