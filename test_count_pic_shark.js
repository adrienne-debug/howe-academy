// COUNTPIC_SHARK — her ask 2026-11-10: "could we add sharks to the mojis to count". The per-kid counting picture
// (MAST_COUNT_PICS, COUNT_PIC block) gains 🦈 sharks; the list stays unique and every entry is [emoji, plural word].
const fs=require("fs"), path=require("path");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n+(x!==undefined?"  "+JSON.stringify(x):""));} };
const a=src.indexOf("// COUNT_PIC_START"), b=src.indexOf("const MAST_COUNT_PICS=",a), e=src.indexOf("];",b)+2;
ok("COUNT_PIC block and list found", a>0&&b>a&&e>b);
const PICS=new Function(src.slice(b,e)+" return MAST_COUNT_PICS;")();
ok("🦈 sharks is a choice", PICS.some(p=>p[0]==="\u{1F988}"&&p[1]==="sharks"));
ok("🦕 dinosaurs is still first (Julian's default)", PICS[0][0]==="\u{1F995}");
ok("no duplicate pictures", new Set(PICS.map(p=>p[0])).size===PICS.length);
ok("every entry is [emoji, word]", PICS.every(p=>Array.isArray(p)&&p.length===2&&typeof p[1]==="string"&&p[1].length>2));
ok("the picker guard still checks the list", /MAST_COUNT_PICS\.some\(x=>x\[0\]===e\)/.test(src));
ok("the tag names the ask", src.indexOf("COUNTPIC_SHARK")>0);
console.log(pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
