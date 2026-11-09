/*
 * 🪶 LAZYSPLIT — the lite load (PLAN_lg_performance_2026-11-08.md Part 2, 2026-11-08). Her words 11/8: the LG StanbyME "gets
 * slow every week"; the cause is CODE SIZE. Areas most devices never open moved VERBATIM out of index.html into their own files,
 * loaded once on first need (haLazyLoad):
 *   classes.js — the class platform (every CP* block)
 * This test checks the split itself (the other tests read the joined page through test_src.js and check behaviour):
 *   · each file parses, ends with its ready flag, and is EXACTLY its header + the blocks its markers name + the flag line
 *     (so the joined page the tests read is the page the devices run, nothing extra hiding in a file)
 *   · each moved block's START/END is gone from index.html and appears once in the joined page
 *   · no top-level name is declared in both index.html and a split file (a classic script would throw on load)
 *   · every use in index.html of a name a split file declares is guarded on its line (typeof X / window.X) — before the file
 *     arrives the area is simply not there; nothing in the boot block reads one
 *   · the loader: one <script> per file however often it is asked, cache-bust only on GitHub Pages, a failed load is retried,
 *     ready = the flag or the code already in the page (the one-page Envirothon builds)
 *   · the doors (classes.js): envLoad brings it with the cards, the class link preloads / waits for it, the site / demo loads it
 *     before boot(); Howe/DeWalt/Burris boot fetches nothing
 *   · sw.js keeps an offline copy of each file; the Envirothon builds read the joined page
 *   run:  node test_lazy_split.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const testSrc = require("./test_src.js");
const P = require("./perf_budget_measure.js");
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x).slice(0, 400) + ")" : "")); } };
const DIR = __dirname;
const raw = fs.readFileSync(path.join(DIR, "index.html"), "utf8");
const joined = testSrc();
// file → its sentinel (haLazyReady's "the code is here") and the local-variable names that only LOOK like its globals
const SPLITS = {
  "classes.js": { name: "classes", sentinel: "cpSeason", locals: ["_cp"] },
};
const rawL = raw.split("\n"), cmL = P.scanJs(raw).cm.split("\n");
const mainA = rawL.lastIndexOf("<script>"), mainB = rawL.lastIndexOf("</script>");
const mainSrc = rawL.slice(mainA + 1, mainB).join("\n");
function topNames(js) {
  const out = new Set(), cm = P.scanJs(js).cm;
  for (const m of cm.matchAll(/^(?:async\s+)?function\s*\*?\s*([\w$]+)|^class\s+([\w$]+)|^(?:const|let|var)\s+([\w$]+)/gm)) out.add(m[1] || m[2] || m[3]);
  for (const m of cm.matchAll(/^(?:const|let|var)\s[^\n]*/gm)) for (const k of m[0].matchAll(/,\s*([A-Z_][A-Z0-9_]*)\s*=/g)) out.add(k[1]);
  return out;
}
const mainNames = topNames(mainSrc);

console.log("\n── the main script ──");
try { new vm.Script(mainSrc); ok("index.html's main script parses on its own (the split files not loaded)", true); } catch (e) { ok("index.html's main script parses on its own", false, e.message); }
ok("the joined page (test_src.js) has no marker left", testSrc.markers(joined).length === 0);

for (const [file, cfg] of Object.entries(SPLITS)) {
  console.log("\n── " + file + " ──");
  const fp = path.join(DIR, file);
  ok(file + " exists", fs.existsSync(fp)); if (!fs.existsSync(fp)) continue;
  const js = fs.readFileSync(fp, "utf8");
  try { new vm.Script(js); ok(file + " parses", true); } catch (e) { ok(file + " parses", false, e.message); }
  const flag = 'if(typeof window!=="undefined") window._haLazy_' + cfg.name + '=true;\n';
  ok(file + " ends with its ready flag (window._haLazy_" + cfg.name + ")", js.endsWith(flag));
  const marks = testSrc.markers(raw).filter(m => m.file === file);
  ok("index.html holds markers for " + file, marks.length > 0, marks.length);
  // the file = header + exactly the marked blocks, in marker order, + the footer
  const L = js.split("\n"), used = new Array(L.length).fill(false); let order = true, last = -1;
  for (const m of marks) {
    const s = L.findIndex(l => new RegExp("//\\s*(?:──\\s*)?" + m.first + "_START\\b").test(l));
    let e = -1; for (let i = s; s >= 0 && i < L.length; i++) if (new RegExp("//\\s*(?:──\\s*)?" + m.last + "_END\\b").test(L[i])) { e = i; break; }
    if (s < 0 || e < 0) { order = false; continue; }
    if (s <= last) order = false; last = e;
    for (let i = s; i <= e; i++) used[i] = true;
  }
  ok("every marker finds its block, in the same order as in index.html", order);
  const firstBlock = used.indexOf(true), footer = L.length - 3;   // footer: the end comment, the flag line, the final newline
  const stray = L.map((l, i) => [l, i]).filter(([l, i]) => !used[i] && i > firstBlock && i < footer).map(([l, i]) => (i + 1) + ": " + l.slice(0, 60));
  ok(file + " holds nothing outside its marked blocks except the header and the footer", stray.length === 0, stray.slice(0, 4));
  ok("the header is comment only", L.slice(0, firstBlock).every(l => /^\s*(\/\/.*)?$/.test(l)));
  const moved = [...new Set(marks.flatMap(m => { const s = L.findIndex(l => new RegExp("//\\s*(?:──\\s*)?" + m.first + "_START\\b").test(l)); let e = s; while (e < L.length && !new RegExp("//\\s*(?:──\\s*)?" + m.last + "_END\\b").test(L[e])) e++; return L.slice(s, e + 1).join("\n").match(/\/\/\s*(?:──\s*)?([A-Z][A-Z0-9_]*)_START\b/g).map(x => x.replace(/^\/\/\s*(?:──\s*)?/, "").replace(/_START$/, "")); }))];
  const left = moved.filter(n => new RegExp("//\\s*(?:──\\s*)?" + n + "_START\\b").test(raw));
  ok("the " + moved.length + " moved blocks' START lines are gone from index.html", left.length === 0, left);
  const twice = moved.filter(n => joined.split(new RegExp("//\\s*(?:──\\s*)?" + n + "_START\\b")).length !== 2);
  ok("…and each appears exactly once in the joined page", twice.length === 0, twice);
  // names
  const names = topNames(js);
  ok(file + " declares its sentinel " + cfg.sentinel + "()", new RegExp("^function " + cfg.sentinel + "\\(", "m").test(js));
  const dup = [...names].filter(n => mainNames.has(n));
  ok("no top-level name is declared both in index.html and in " + file, dup.length === 0, dup);
  const bare = [];
  for (const n of names) {
    if (cfg.locals.includes(n) || n.length < 3) continue;
    const re = new RegExp("(^|[^\\w$.])" + n.replace(/\$/g, "\\$") + "(?![\\w$])"), g = new RegExp("typeof\\s+(window\\.)?" + n.replace(/\$/g, "\\$") + "(?![\\w$])|window\\." + n.replace(/\$/g, "\\$") + "(?![\\w$])");
    for (let i = mainA + 1; i < mainB; i++) { const l = cmL[i]; if (l.indexOf(n) < 0 || !re.test(l)) continue; if (!g.test(l)) bare.push((i + 1) + " " + n); }
  }
  ok("every use in index.html of a name " + file + " declares is guarded on its line (typeof / window.)", bare.length === 0, bare.slice(0, 8));
  const bootA = rawL.findIndex(l => /^\/\/ ── INIT ── runs LAST/.test(l));
  const bootUse = []; for (let i = bootA; i < mainB; i++) for (const n of names) if (n.length > 3 && new RegExp("(^|[^\\w$.])" + n + "(?![\\w$])").test(cmL[i])) bootUse.push((i + 1) + " " + n);
  ok("the boot block reads nothing from " + file, bootA > 0 && bootUse.length === 0, bootUse);
  ok("HA_LAZY_FILES names " + file, new RegExp('HA_LAZY_FILES=\\{[^}]*\\b' + cfg.name + ':"' + file.replace(".", "\\.") + '"').test(raw));
  ok("haLazyReady knows its sentinel (the one-page builds hold the code already)", raw.indexOf('if(name==="' + cfg.name + '") return typeof ' + cfg.sentinel + '==="function";') > 0);
  // sw.js
  const sw = fs.readFileSync(path.join(DIR, "sw.js"), "utf8");
  const swRe = /const lazyM = req\.method === 'GET' && (\/[^\n]*\/)\.exec\(new URL\(req\.url\)\.pathname\);/.exec(sw);
  const swPat = swRe ? eval(swRe[1]) : null;
  ok("sw.js keeps an offline copy of " + file + " (network-first, keyed by name — the ?v= cache-bust never piles up)", !!(swPat && swPat.test("/howe-academy/" + file) && !swPat.test("/howe-academy/x" + file) && /cache\.put\(key, fresh\.clone\(\)\)/.test(sw)));
}

console.log("\n── the loader (haLazyLoad), in a tiny world ──");
const a = raw.indexOf("// LAZYSPLIT_START"), b = raw.indexOf("// LAZYSPLIT_END");
ok("LAZYSPLIT block present once, outside every moved file", a > 0 && b > a && raw.indexOf("// LAZYSPLIT_START", a + 1) < 0 && !Object.keys(SPLITS).some(f => fs.readFileSync(path.join(DIR, f), "utf8").indexOf("LAZYSPLIT_START") >= 0));
function world(host) {
  const tags = [], W = {};
  const ctx = { window: W, location: { hostname: host || "localhost" }, Promise, console, Date,
    document: { createElement: () => ({}), head: { appendChild: s => tags.push(s) } } };
  ctx.window = W; vm.createContext(ctx);
  vm.runInContext(raw.slice(a, b) + "\nthis.haLazyLoad=haLazyLoad; this.haLazyReady=haLazyReady; this.haLazyBoot=haLazyBoot;", ctx);
  return { ctx, tags, W };
}
(async () => {
  { const w = world();
    ok("not ready before the file ran", w.ctx.haLazyReady("classes") === false);
    const p1 = w.ctx.haLazyLoad("classes"), p2 = w.ctx.haLazyLoad("classes");
    ok("asked twice while loading → ONE <script>, the same promise", w.tags.length === 1 && p1 === p2 && w.tags[0].src === "classes.js");
    w.W._haLazy_classes = true; w.tags[0].onload();
    ok("its last line ran → resolves; ready", (await p1) === true && w.ctx.haLazyReady("classes") === true);
    await w.ctx.haLazyLoad("classes"); ok("ready → no second <script>", w.tags.length === 1); }
  { const w = world("adrienne-debug.github.io");
    w.ctx.haLazyLoad("classes").catch(() => {});
    ok("GitHub Pages: cache-bust ?v=… (a fresh deploy is never served a stale file)", /^classes\.js\?v=\d+$/.test(w.tags[0].src)); }
  { const w = world();
    const p = w.ctx.haLazyLoad("classes"); w.tags[0].onerror(); let failed = false; try { await p; } catch (e) { failed = true; }
    ok("a failed load rejects…", failed);
    w.ctx.haLazyLoad("classes").catch(() => {}); ok("…and the next need tries again", w.tags.length === 2); }
  { const w = world(); const p = w.ctx.haLazyLoad("classes"); w.tags[0].onload(); let failed = false; try { await p; } catch (e) { failed = true; }
    ok("loaded but its last line never ran (an error part-way) → rejects, not 'ready'", failed && w.ctx.haLazyReady("classes") === false); }
  { const w = world(); vm.runInContext("function cpSeason(){}", w.ctx);
    ok("the code already in the page (a one-page build) → ready, nothing fetched", w.ctx.haLazyReady("classes") === true && (await w.ctx.haLazyLoad("classes")) === true && w.tags.length === 0); }
  { const w = world(); vm.runInContext("function envSiteOn(){ return false; }", w.ctx); w.ctx.haLazyBoot();
    ok("haLazyBoot off the Envirothon site (Howe, DeWalt, Burris): nothing fetched", w.tags.length === 0); }

  console.log("\n── the doors (classes.js) ──");
  const fn = n => { const i = raw.indexOf("\nfunction " + n + "("); return i < 0 ? "" : raw.slice(i, raw.indexOf("\n}", i) + 2); };
  ok("envLoad loads classes.js WITH envirothon.js (Promise.all) — envHydrate's class layers are there when the cards are", /haLazyLoad\("classes"\)/.test(fn("envLoad")) && /Promise\.all\(\[/.test(fn("envLoad")));
  ok("…a failed classes.js never holds the cards back (caught → null)", /haLazyLoad\("classes"\)\.catch\(\(\)=>null\)/.test(fn("envLoad")));
  ok("envHydrateAll hydrates on the spot only when classes.js is in too", /if\(lib&&\(typeof haLazyReady!=="function"\|\|haLazyReady\("classes"\)\)\)/.test(fn("envHydrateAll")));
  ok("the class link: envmReady preloads it", /haLazyLoad\("classes"\)/.test(fn("envmReady")));
  ok("…the mirror waits for it before publishing (envSummary's class parts ride the first publish)", /!haLazyReady\("classes"\)\) return true;/.test(fn("envmWaiting")));
  ok("…envmRelAttach waits for it, and attaches the release listeners even if it never comes", /haLazyLoad\("classes"\)\.then\(go,go\)/.test(fn("envmRelAttach")));
  ok("the database edition (envsReadEdition) loads it", /haLazyLoad\("classes"\)/.test(raw.slice(raw.indexOf("function envsReadEdition"), raw.indexOf("function envsReadEdition") + 600)));
  const bi = rawL.indexOf("boot();"), hb = rawL.findIndex(l => /^haLazyBoot\(\);/.test(l));
  ok("haLazyBoot() runs in the INIT block, before boot() (after every declaration)", hb > 0 && hb < bi && hb > rawL.findIndex(l => /^\/\/ ── INIT ── runs LAST/.test(l)));
  ok("haLazyBoot loads classes.js only on the Envirothon site / demo", /envSiteOn\(\)\) haLazyBootSync\("classes"\)/.test(raw.slice(a, b)));

  console.log("\n── one-page copies (the Envirothon site build and the demo) ──");
  const md = fs.readFileSync(path.join(DIR, "envirothon", "build", "make_demo.js"), "utf8"), be = fs.readFileSync(path.join(DIR, "envirothon", "build", "build_envirothon.js"), "utf8");
  ok("make_demo.js reads the joined page (test_src.js)", /require\(path\.join\(REPO,"test_src\.js"\)\)\(SRC\)/.test(md));
  ok("build_envirothon.js reads the joined page (test_src.js)", /require\(path\.join\(REPO, "test_src\.js"\)\)\(SRC\)/.test(be));

  console.log("\n" + pass + " passed, " + fail + " failed"); process.exit(fail ? 1 : 0);
})();
