// HQ Dad star code + Reflex Settings row are per-family (her catch 2026-10-03: Burris + Dewalt
// showed Howe's "0726" and a Reflex row). Run: node test_hq_family_scope.js
const fs=require("fs"); const src=fs.readFileSync(__dirname+"/index.html","utf8");
let fail=0; const ok=(c,m)=>{ if(!c){fail++;console.log("FAIL "+m);} else console.log("ok   "+m); };
const a=src.indexOf("const HQ_SCREENS=["), b=src.indexOf("function _hqGroup(");
const block=src.slice(a,b);
ok(!/0726/.test(block.replace(/\/\/[^\n]*/g,"")),"no hardcoded Howe star code in HQ screens");
function card(pin){
  const f=new Function("DAD_PIN","hqBaseUrl","pageOn","esc",block+";return hqLinksCard();");
  return f(pin,()=>"https://x/",()=>true,s=>String(s).replace(/</g,"&lt;"));
}
ok(card("4321").includes("Star code: 4321"),"shows the family's own Dad code");
ok(card("").includes("Star code: off"),"blank Dad code reads off");
ok(!card("4321").includes("0726"),"never shows 0726 for another code");
const r=src.indexOf('<div class="rules-label">Reflex max');
ok(r>0&&src.slice(r-60,r).includes("if(HA_IS_HOWE) h+="),"Reflex max row gated on HA_IS_HOWE");
if(fail){console.log(fail+" failed");process.exit(1);} console.log("all passed");
