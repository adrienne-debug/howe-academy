// Up for Grabs is per-family: GRAB_DEFAULT is Howe's own house (bunny room door, Bella's chair,
// school room glass), so only Howe falls back to it. Another family with no config/grabs gets an
// empty list and a "No jobs yet — Mom, add your first one" line, with the add button for Mom only.
// (DeWalt start, 2026-10-07.) Run: node test_grab_family.js
const fs=require("fs"); const src=fs.readFileSync(__dirname+"/index.html","utf8");
let fail=0; const ok=(c,m)=>{ if(!c){fail++;console.log("FAIL "+m);} else console.log("ok   "+m); };
const slice=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("missing "+a); return src.slice(i,j); };
const defBlock=slice("const GRAB_DEFAULT=[","\n];")+"\n];";
const famBlock=slice("// GRAB_FAMILY_START","// GRAB_FAMILY_END");
const line=n=>{ const i=src.indexOf(n); return src.slice(i,src.indexOf("\n",i)); };
const gbListSrc=line("function gbList(){"), ensureSrc=line("function _gbEnsure(){");
const htmlSrc=slice("function _grabsHTML(kid,momView){","\nfunction ");
ok(!/GRAB_DEFAULT/.test(gbListSrc)&&!/GRAB_DEFAULT/.test(ensureSrc),"gbList/_gbEnsure no longer read GRAB_DEFAULT directly");
ok(/function _gbSave\(\)\{ if\(db\) db\.ref\("config\/grabs"\)\.set\(grabs\); \}/.test(src),"_gbSave unchanged");

function env(howe,mom,grabs){
  const body=defBlock+";\n"+famBlock+"\nlet grabs="+JSON.stringify(grabs||[])+";\n"+gbListSrc+"\n"+ensureSrc+"\n"+htmlSrc+
    "\nreturn {gbList, _gbEnsure, _grabsHTML, getGrabs:()=>grabs, GRAB_DEFAULT};";
  const gbPool=(kid,mv)=>[];   // empty pool: we only exercise the empty states here
  return new Function("HA_IS_HOWE","momHere","gbPool","gbCur","gbPayout","esc","cap","ROSTER",body)
    (howe,()=>mom,gbPool,()=>({}),()=>0,s=>String(s),s=>s,[]);
}
// Howe: unchanged
{ const E=env(true,false,[]);
  ok(E.gbList().length===E.GRAB_DEFAULT.length&&E.gbList().length>0,"Howe with no list still sees her own grab chores");
  ok(E.gbList().some(g=>/bunny room/.test(g.label)),"Howe's list includes the bunny room door");
  E._gbEnsure(); ok(E.getGrabs().length===E.GRAB_DEFAULT.length,"Howe's first edit seeds GRAB_DEFAULT");
  ok(E.getGrabs()[0]!==E.GRAB_DEFAULT[0],"seeding copies rows, not the defaults themselves");
  ok(!/No jobs yet/.test(E._grabsHTML("lincoln",false)),"Howe never sees the empty-list line");
}
// Another family, nothing saved
{ const E=env(false,false,[]);
  ok(Array.isArray(E.gbList())&&E.gbList().length===0,"other family with no list gets an empty list");
  E._gbEnsure(); ok(E.getGrabs().length===0,"other family's first edit does not seed Howe's chores");
  const kid=E._grabsHTML("sam",false);
  ok(/No jobs yet — Mom, add your first one/.test(kid),"kid sees the friendly empty line");
  ok(!/gbAdd\(\)/.test(kid),"kid gets no add button");
  ok(!/bunny|Bella|school room/i.test(kid),"no Howe house content on another family's page");
  const mom=env(false,true,[])._grabsHTML("sam",true);
  ok(/No jobs yet/.test(mom)&&/onclick="gbAdd\(\)"[^>]*>\+ Add grab chore/.test(mom),"Mom gets the existing + Add grab chore button");
}
// Another family that has added its own jobs: their list, untouched
{ const own=[{emoji:"🧺",label:"Fold towels",pts:10,cad:"daily"}];
  const E=env(false,true,own);
  ok(E.gbList().length===1&&E.gbList()[0].label==="Fold towels","a family's own list is used as-is");
  ok(!/No jobs yet/.test(E._grabsHTML("sam",true)),"no empty-list line once the family has jobs");
}
// Howe-specific defaults stay gated the same way elsewhere (no regressions)
ok(/const KIT_ROT_DEFAULT=\(typeof HA_IS_HOWE!=="undefined"&&!HA_IS_HOWE\)\?\{\}:/.test(src),"meal rotation default still Howe-only");
console.log(fail?fail+" FAILED":"all passed"); process.exit(fail?1:0);
