/* 👩 Universal Mom mode (her rules 2026-10-05/06).  run: node test_unimom.js */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":"")); } };
const fn=name=>{ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); return src.slice(i,src.indexOf("\n}",i)+2); };
const line=re=>{ const m=src.match(re); return m?m[0]:""; };
console.log("── one switch ──");
ok("haMomOn / haMomOff defined once", src.split("function haMomOn(").length===2&&src.split("function haMomOff(").length===2);
const strip=src.replace(/function haMomOn\(\)\{[^\n]*\n/,"").replace(/function haMomOff\(\)\{[^\n]*\n/,"").replace(/try\{ if\(HA_LS\.getItem\('ha_mom_on'\)==="1"\)\{[^\n]*\n/,"");
ok("no door sets a flag on its own any more (adminPinUnlocked / momModeActive / momPinUnlocked / mastAdminPinOk = true)", !/(adminPinUnlocked|momModeActive|momPinUnlocked|mastAdminPinOk)\s*=\s*true/.test(strip), (strip.match(/(adminPinUnlocked|momModeActive|momPinUnlocked|mastAdminPinOk)\s*=\s*true[^;]*/g)||[]));
ok("no off sets flags one by one (only haMomOff clears them)", !/(momModeActive|momPinUnlocked)\s*=\s*false/.test(strip.replace(/let (momModeActive|momPinUnlocked)=false;/g,"").replace("if(!momModeActive) momPinUnlocked=false;","")), (strip.replace(/let (momModeActive|momPinUnlocked)=false;/g,"").replace("if(!momModeActive) momPinUnlocked=false;","").match(/(momModeActive|momPinUnlocked)\s*=\s*false[^;]*/g)||[]));
ok("every single-flag door now reads momHere()", !/if\(!adminPinUnlocked\)\{/.test(src)&&(src.match(/if\(!momHere\(\)\)\{/g)||[]).length>=6);
ok("the Mastery Database door opens in Mom mode", /if\(!mastAdminPinOk&&!momHere\(\)\)\{/.test(src));
console.log("── on, off, remembered on this device ──");
function boot(stored){
  const ls={}; if(stored!==undefined) ls.ha_mom_on=stored;
  const ctx={setTimeout:()=>0,HA_LS:{getItem:k=>ls[k]===undefined?null:ls[k],setItem:(k,v)=>{ ls[k]=String(v); }},renderAll:()=>{},pinOk:v=>v==="0329",document:{getElementById:()=>null}};
  vm.createContext(ctx);
  const decl=["let momPinUnlocked=false;","let momModeActive=false;","let mastAdminPinOk=false;"].join("\n");
  const a=src.indexOf("let adminPinUnlocked=false;"), b=src.indexOf("\n",src.indexOf("try{ if(HA_LS.getItem('ha_mom_on')",a))+1;
  vm.runInContext(decl+"\n"+src.slice(a,b)+"\n"+fn("momHere")+"\n"+fn("checkAdminPin")+"\n"+fn("nbPinLock").replace(/nbPinOpen=false;/,"")+"\nvar flags=()=>({momModeActive,momPinUnlocked,adminPinUnlocked,mastAdminPinOk,here:momHere()});",ctx);
  return {ctx,ls,flags:()=>vm.runInContext("flags()",ctx),run:e=>vm.runInContext(e,ctx)};
}
{ const B=boot(); ok("fresh device: Mom mode off", JSON.stringify(B.flags())==='{"momModeActive":false,"momPinUnlocked":false,"adminPinUnlocked":false,"mastAdminPinOk":false,"here":false}');
  B.run("checkAdminPin('0329','x')"); const f=B.flags();
  ok("the Admin code turns on ALL of Mom mode (button lit, Mom view, Admin, Mastery)", f.momModeActive&&f.momPinUnlocked&&f.adminPinUnlocked&&f.mastAdminPinOk&&f.here, f);
  ok("…and it's remembered on this device", B.ls.ha_mom_on==="1");
  const B2=boot(B.ls.ha_mom_on); ok("a reload on the same device comes back in Mom mode", B2.flags().momModeActive&&B2.flags().adminPinUnlocked&&B2.flags().here);
  B2.run("nbPinLock()"); ok("a 🔒 lock turns everything off", JSON.stringify(B2.flags())==='{"momModeActive":false,"momPinUnlocked":false,"adminPinUnlocked":false,"mastAdminPinOk":false,"here":false}');
  ok("…and the device forgets it", B2.ls.ha_mom_on==="0"&&!boot(B2.ls.ha_mom_on).flags().here);
  const B3=boot(); B3.run("checkAdminPin('1111','x')"); ok("a wrong code changes nothing", !B3.flags().here&&B3.ls.ha_mom_on===undefined);
}
console.log("── every door ──");
ok("Mom button code → haMomOn (and lands on Mom's agenda)", /function checkMomPin[\s\S]{0,260}haMomOn\(\);[\s\S]{0,40}kid = "mom"/.test(src));
ok("Admin code → haMomOn", /function checkAdminPin[\s\S]{0,160}haMomOn\(\)/.test(src));
ok("kitchen/grocery/helper prompts (kitPinGate) → haMomOn", /if\(pinOk\(v\)\)\{ haMomOn\(\); const t=window\._kitPinThen;/.test(src));
ok("Mastery Database code → haMomOn", /if\(pinOk\(val\)\)\{ haMomOn\(\); _mastRe\(\); \}/.test(src));
ok("Blockout code → haMomOn", /if\(pinOk\(this\.value\)\)\{haMomOn\(\);closeBoDialog\(\);/.test(src));
ok("Plan next week code → haMomOn", /function pnwCheckPin[\s\S]{0,120}haMomOn\(\)/.test(src));
ok("tapping Mom off on the Schedule → haMomOff, and the screen redraws", /haMomOff\(\); kid="all"; schedShowAdmin=false; renderAll\(\);/.test(src));
ok("Notebook 🔒 and Units 🔒 → haMomOff", /function nbPinLock\(\)\{ haMomOff\(\);/.test(src)&&/haMomOff\(\); unitPinOpen=false;/.test(src));
ok("the check-up's kid-screen door still re-locks after the sitting", /function ckRelock\(\)\{[^\n]*haMomOff\(\)/.test(src));
ok("Notebook and Units unlock through the Admin code door (checkAdminPin)", /checkAdminPin/.test(fn("nbPinToggle")||"")||/checkAdminPin\(/.test(src.slice(src.indexOf("// ── Notebook-tab Mom lock"),src.indexOf("// ── Notebook-tab Mom lock")+1500)));
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
