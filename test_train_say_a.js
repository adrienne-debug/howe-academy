// ABCTRAIN_SAY_A — her report 2026-11-11: the train said "I" for the letter A (the voice read "ay" as "aye").
const fs=require("fs"), path=require("path");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n+(x!==undefined?"  "+JSON.stringify(x):""));} };
const m=/const TRAIN_LETTER_NAMES=(\{[^}]*\});/.exec(src); ok("letter-name map found", !!m);
const N=new Function("return "+m[1])();
ok("A is no longer spelled 'ay'", N.A!=="ay" && N.A!=="aye");
ok("A is spelled 'ey'", N.A==="ey");
ok("I is still 'eye'", N.I==="eye");
ok("26 letters named", Object.keys(N).length===26);
const fn=/function trainSpoken\(text\)\{[^\n]*\}/.exec(src)[0]; const T=new Function("TRAIN_LETTER_NAMES",fn+" return trainSpoken;")(N);
ok("trainSpoken('A') → ey", T("A")==="ey");
ok("other letters unchanged", T("J, K, L. What comes next?")==="jay, kay, el. What comes next?");
ok("the tag names the report", src.indexOf("ABCTRAIN_SAY_A")>0);
console.log(pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
