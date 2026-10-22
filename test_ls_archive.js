/*
 * LS_ARCHIVE (2026-10-22): her Mac asked for the Firebase password on reload after reload (9 sign-ins 10/21) — localStorage was FULL
 * (5,703 KB; every save threw QuotaExceededError), so neither the session nor Mom mode could be kept. The archive copy was 2,893 KB of it.
 * The archive is no longer mirrored on the device (like ha_mastery), and an old copy is removed at boot.   run: node test_ls_archive.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,300)+")":"")); } };
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("missing "+a); return src.slice(i,j); };
const LS=cut("window.HA_LS=(function(){","\n})();")+"\n})();";
function mk(fam,store){ const S=Object.assign({},store||{}); const ctx={window:{localStorage:{getItem:k=>S[k]===undefined?null:S[k],setItem:(k,v)=>{ S[k]=String(v); },removeItem:k=>{ delete S[k]; }},HA_FAMILY:fam?{familyId:fam}:null},S};
  vm.createContext(ctx); vm.runInContext(LS,ctx); ctx.LS=ctx.window.HA_LS; return ctx; }
console.log("Her Mac on 10/21: a 2.9 MB archive copy, a mastery copy, the session key");
{ const c=mk(null,{"ha_archive":"x".repeat(1000),"ha_mastery":"m","firebase:authUser:abc":"{}","week28_tasks":"[]"});
  ok("boot removes the old archive copy (and the mastery one), touches nothing else", c.S.ha_archive===undefined&&c.S.ha_mastery===undefined&&c.S["firebase:authUser:abc"]==="{}"&&c.S.week28_tasks==="[]", Object.keys(c.S));
  c.LS.setItem("ha_archive",JSON.stringify({week28:{}})); ok("the archive listener's save is a no-op now", c.S.ha_archive===undefined);
  ok("the boot fallback read gets nothing (the live listener fills it)", c.LS.getItem("ha_archive")===null);
  c.LS.setItem("ha_laundry","{}"); ok("every other key still saves", c.S.ha_laundry==="{}");
}
console.log("The DeWalt copy on the same origin (its keys carry the family prefix)");
{ const c=mk("dewalt",{"dewalt:ha_archive":"x","ha_archive":"howe's"}); ok("DeWalt's boot removes ITS copy only", c.S["dewalt:ha_archive"]===undefined&&c.S.ha_archive==="howe's"); }
ok("the list names both", /var NO_MIRROR=\{"ha_mastery":1,"ha_archive":1\};/.test(src));
ok("no 🔀", src.indexOf("🔀")<0);
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
