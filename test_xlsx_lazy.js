// 📊 XLSXLAZY (her yes 2026-10-18: "load only when Upload Curriculum or Download Template is used"). The SheetJS
// spreadsheet library was a blocking <script> at the top of the page — every device downloaded it and waited for it
// before drawing, for two Mom-only tools. Checks: no startup script for it; haNeedXlsx() fetches the same file once,
// shares the wait, retries after a failure or a timeout; Upload Curriculum and Download Template go through it; with
// the library unavailable the upload says so and writes nothing; the upload's reading/saving code is unchanged.
// Run: node test_xlsx_lazy.js
const fs = require("fs"), path = require("path");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
let pass = 0, fail = 0;
function ok(name, cond, d) { if (cond) { pass++; console.log("  ok  - " + name); } else { fail++; console.log("  FAIL- " + name + (d ? "  → " + d : "")); } }
const cut = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error("missing " + a); return src.slice(i, j); };
const fnSrc = name => cut("function " + name + "(", "\n}\n") + "\n}\n";

ok("no <script src> for the spreadsheet library at startup", !/<script[^>]+src="[^"]*xlsx[^"]*"/i.test(src));
ok("XLSXLAZY block present once", src.indexOf("// XLSXLAZY_START") > 0 && src.indexOf("// XLSXLAZY_START", src.indexOf("// XLSXLAZY_START") + 1) < 0);
ok("same file, same version as before", /const XLSX_SRC="https:\/\/cdn\.sheetjs\.com\/xlsx-0\.20\.3\/package\/dist\/xlsx\.full\.min\.js";/.test(src));
const up = fnSrc("uploadCurriculum"), tpl = fnSrc("downloadCurrTemplate");
ok("Upload Curriculum reads the file only after the library is in", /haNeedXlsx\(\)\.then\(\(\)=>\{ msg\.textContent="Parsing curriculum\.\.\."; reader\.readAsArrayBuffer\(f\); \}\)/.test(up) && (up.match(/readAsArrayBuffer/g) || []).length === 1);
ok("…its reading and saving are unchanged (XLSX.read, the one curriculum write)", /XLSX\.read\(new Uint8Array\(e\.target\.result\),\{type:"array",cellDates:true\}\)/.test(up) && /db\.ref\("curriculum"\)\.set\(curriculum\)/.test(up));
ok("Download Template fetches the library first, then runs as before", /haNeedXlsx\(\)\.then\(\(\)=>downloadCurrTemplate\(\)\)/.test(tpl) && /XLSX\.writeFile\(wb,"howe_curriculum_template\.xlsx"\)/.test(tpl));

// ── the loader, run ──
const BLOCK = cut("// XLSXLAZY_START", "// XLSXLAZY_END");
function load() {
  const G = { scripts: [] };
  const document = { createElement: () => ({}), head: { appendChild: s => G.scripts.push(s) } };
  const fn = new Function("G", "document", "win", `
    ${BLOCK}
    return { haNeedXlsx, get src(){ return XLSX_SRC; } };`.replace(/typeof XLSX/g, "typeof win.XLSX").replace(/XLSX&&XLSX\.utils/g, "win.XLSX&&win.XLSX.utils").replace(/fin\(true,XLSX\)/g, "fin(true,win.XLSX)").replace(/Promise\.resolve\(XLSX\)/g, "Promise.resolve(win.XLSX)"));
  const win = {}; const api = fn(G, document, win); api.G = G; api.win = win; return api;
}
(async () => {
  let a = load();
  const p1 = a.haNeedXlsx(), p2 = a.haNeedXlsx();
  ok("first need adds ONE script, for the same file", a.G.scripts.length === 1 && a.G.scripts[0].src === a.src && a.G.scripts[0].async === true);
  ok("a second tap while it loads shares the same wait", p1 === p2);
  a.win.XLSX = { utils: {} }; a.G.scripts[0].onload();
  ok("loaded → resolves with the library", (await p1) === a.win.XLSX);
  const p3 = a.haNeedXlsx();
  ok("already loaded → no new script", a.G.scripts.length === 1 && (await p3) === a.win.XLSX);

  a = load();
  const f1 = a.haNeedXlsx(); a.G.scripts[0].onerror();
  let err = null; try { await f1; } catch (e) { err = e; }
  ok("can't load → rejects", !!err);
  a.haNeedXlsx();
  ok("…and the next tap tries again", a.G.scripts.length === 2);

  a = load();
  const f2 = a.haNeedXlsx(); a.G.scripts[0].onload();   // loaded but the library isn't there
  err = null; try { await f2; } catch (e) { err = e; }
  ok("file arrived but no library inside → rejects", !!err);

  // Upload with the library unavailable: says so, reads nothing, writes nothing
  {
    const H = { read: 0, writes: 0 };
    const f = new Function("H", `
      const msgEl={textContent:"",innerHTML:""};
      const document={getElementById:id=>id==="admin-msg"?msgEl:(id==="xlsx-input"?{files:[{name:"c.xlsx"}]}:null)};
      function momHere(){ return true; } const db={ ref(){ return { set(){ H.writes++; return Promise.resolve(); } }; } };
      function FileReader(){ this.readAsArrayBuffer=function(){ H.read++; }; }
      const XLSX_FAIL_MSG="Couldn't load the spreadsheet tools — check the internet and try again.";
      function haNeedXlsx(){ return Promise.reject(new Error("offline")); }
      let currData=null;
      ${up}
      uploadCurriculum(); return msgEl;`);
    const msgEl = f(H); await new Promise(r => setTimeout(r, 5));
    ok("library unavailable → upload says so", /Couldn't load the spreadsheet tools/.test(msgEl.textContent));
    ok("…and reads nothing, writes nothing", H.read === 0 && H.writes === 0);
  }

  ok("🔀 not used", src.indexOf("🔀") < 0);
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
