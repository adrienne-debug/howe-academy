/*
 * 🚦 Boot runs LAST (live 2026-09-28 → 09-30: Lincoln's schedule blank / stuck on the last kid, Grid empty).
 * The boot block's first paint draws the CACHED week; taskCard reads Math Sprints state and the Grid reads the
 * retrieval tables. When the block sat mid-file those `let`/`const`s were still uninitialised (TDZ) → ReferenceError
 * out of renderAll → the whole script aborted → every later paint of his list threw and the DOM kept whatever it
 * showed last. Only Lincoln has Math Sprints cards, so only his views broke.
 *   · every top-level declaration precedes the boot paint
 *   · the boot block is the last thing in the main script
 *   · the first paint is wrapped so an error can never abort the boot again
 *   · the main script still parses
 *   run:  node test_boot_order.js
 */
const fs=require("fs"), path=require("path");
let pass=0, fail=0;
function ok(n,c,x){ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":""));} }
const src=fs.readFileSync(process.env.HA_SRC||path.join(__dirname,"index.html"),"utf8");
const L=src.split("\n");
const a=L.lastIndexOf("<script>"), b=L.lastIndexOf("</script>");
ok("main script found",a>0&&b>a,[a,b]);
const bootIdx=L.findIndex(l=>/^try\{ renderAll\(\); \}catch\(e\)\{/.test(l));
ok("the boot paint is wrapped in try/catch (a first-paint error must not abort the script)",bootIdx>0,bootIdx);
const bootStart=L.findIndex((l,i)=>i>a&&/^boot\(\);$/.test(l));
ok("boot() is called exactly once at top level",bootStart>0&&L.filter(l=>/^boot\(\);$/.test(l)).length===1);
const late=[]; for(let i=bootIdx;i<b;i++){ if(/^(let|const|var|class|function|async function) /.test(L[i])) late.push((i+1)+": "+L[i].slice(0,50)); }
ok("nothing is declared after the boot paint — every let/const/class exists before the first render",late.length===0,late.slice(0,5));
const between=[]; for(let i=bootStart;i<b;i++){ if(!/^(boot\(\);|if\(|paintBuildFp|fxClassRestore|initFb\(\);|try\{ renderAll|setInterval\(bbWatch|document\.addEventListener\("pointerdown",bbAudioUnlock|\/\/|\s|$)/.test(L[i])) between.push((i+1)+": "+L[i].slice(0,60)); }
ok("the boot block is the LAST thing in the script (only its own lines follow boot())",between.length===0,between.slice(0,5));
ok("initFb runs before the first paint",L.findIndex((l,i)=>i>bootStart&&/^initFb\(\);/.test(l))<bootIdx);
// the two known offenders are now above the paint
const decl=name=>L.findIndex(l=>l.startsWith("let "+name)||l.startsWith("const "+name)||l.indexOf(", "+name+"=")>0&&/^let /.test(l));
ok("`let mathSprints` is declared before the boot paint",decl("mathSprints")>0&&decl("mathSprints")<bootIdx,decl("mathSprints"));
ok("`const RETR_WEEK_DEFAULT` is declared before the boot paint",decl("RETR_WEEK_DEFAULT")>0&&decl("RETR_WEEK_DEFAULT")<bootIdx,decl("RETR_WEEK_DEFAULT"));
try{ new Function(L.slice(a+1,b).join("\n")); ok("the main script parses",true); }catch(e){ ok("the main script parses",false,e.message); }
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
