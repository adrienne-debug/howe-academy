/* Node tests — 🏡 Settings ▸ Family time cards collapse, collapsed by default (her ask 2026-10-04).
   run: node test_family_collapse.js [index.html] */
const fs=require("fs"),path=require("path");
const src=fs.readFileSync(process.argv[2]||path.join(__dirname,"index.html"),"utf8");
function extractFn(name){const i=src.indexOf("function "+name+"(");if(i<0)throw new Error("not found: "+name);let d=0,s=false;for(let k=src.indexOf("{",i);k<src.length;k++){const c=src[k];if(c==="{"){d++;s=true;}else if(c==="}"){d--;if(s&&d===0)return src.slice(i,k+1);}}throw new Error("unbalanced");}
let pass=0,fail=0;function ok(n,c,x){if(c){pass++;console.log("  ok  - "+n);}else{fail++;console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,300)+")":""));}}
const names=["famBlockEditorHTML","famSettingsCardHTML"];
const ctx={rulesOpen:{},ROSTER:["taylor","makenzie","andrew","caleb"],FAM_ICON:"🏡",FAM_DAYS:["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],
  defs:{fbFT:{name:"Family Time",kids:["taylor","makenzie","andrew","caleb"],days:["Mon","Tue","Wed","Thu","Fri"],at:"lunch",items:[{key:"a",name:"History",minutes:30},{key:"b",name:"Science",minutes:30}]}},
  momHere:()=>true,famDefs:()=>ctx.defs,famList:v=>Array.isArray(v)?v:(v?Object.values(v):[]),famIsAuto:b=>b.at==="auto",famMomLeads:b=>b.momLeads!==false,
  famItemKids:(b,it)=>b.kids,famPtsMax:()=>0,famPreviewHTML:()=>"<preview>",famCelebRowHTML:()=>"<celeb>",_famChip:(on,l)=>"<chip>"+l+"</chip>",
  cap:s=>s[0].toUpperCase()+s.slice(1),esc:s=>String(s),ampmTo24:()=>"13:00",currData:{}};
new Function("ctx","with(ctx){"+names.map(extractFn).join("\n")+";Object.assign(ctx,{"+names.join(",")+"});}")(ctx);
let h=ctx.famSettingsCardHTML();
ok("settings card: collapsed by default (no 'open')",/<div class="rules-card" style="">/.test(h)&&!/rules-card open/.test(h),h.slice(0,400));
ok("header taps rulesToggleCard('fam_fbFT')",/onclick="rulesToggleCard\('fam_fbFT'\)"/.test(h));
ok("header shows name + who · days · subjects",/🏡<\/span> Family Time<\/div>/.test(h)&&/Taylor, Makenzie, Andrew, Caleb · Mon–Fri · History, Science/.test(h));
ok("editor still inside the body",/rules-card-body/.test(h)&&/<celeb>/.test(h)&&/History/.test(h));
ctx.rulesOpen.fam_fbFT=true; h=ctx.famSettingsCardHTML();
ok("tapped → open",/<div class="rules-card open"/.test(h));
ctx.defs.fbFT.off=true; ctx.rulesOpen={}; h=ctx.famSettingsCardHTML();
ok("an off family time says (off) in its header",/Family Time <span[^>]*>\(off\)<\/span>/.test(h));
const sheet=ctx.famBlockEditorHTML("fbFT",ctx.defs.fbFT);
ok("Family Grid sheet (no collapsible flag) → still open, no header",/^<div class="rules-card open"/.test(sheet)&&!/rules-card-hdr/.test(sheet));
ok("a new family time opens",/const id="fb"\+Date\.now\(\)\.toString\(36\);\n  try\{ rulesOpen\["fam_"\+id\]=true; \}catch\(e\)\{\}/.test(src));
console.log("\n"+pass+" passed, "+fail+" failed");process.exit(fail?1:0);
