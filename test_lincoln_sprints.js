/* 🔤 Lincoln's phonogram review ladder (her ask 2026-10-23: "open the phonogram review ladder for lincoln too in sprints"):
 * Ellis's review ladder — the LOE-B list, one pass at the gate % moves on — opened for Lincoln; his other tracks unchanged.
 * run: node test_lincoln_sprints.js */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,300)+")":"")); } };
const fnIn=(s,name)=>{ const i=s.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); let d=0; for(let k=s.indexOf("{",i);k<s.length;k++){ if(s[k]==="{") d++; else if(s[k]==="}"&&--d===0) return s.slice(i,k+1); } throw new Error("unterminated "+name); };
const line=start=>{ const i=src.indexOf(start); if(i<0) throw new Error("missing "+start); return src.slice(i,src.indexOf("\n",i)+1); };
const block=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("missing "+a); return src.slice(i,j); };
const ctx={console,Math,String,Object,Array,JSON, masteryData:{}, retrMathfactStages:()=>[], retrEditorStages:()=>[]}; vm.createContext(ctx);
vm.runInContext(block("const SPRINT_LOE_B=","const SPRINT_LOE_ALL=")+line("const SPRINT_LOE_ALL=")+line("const SPRINT_KID_ACTIVE=")+line("const SPRINT_KID_MSG=")+"\n"+fnIn(src,"retrTracks"),ctx);
const ev=e=>vm.runInContext(e,ctx);   // consts are lexical in the vm script — read them by name
ok("Lincoln is an active sprint kid (with Lucy, Julian, Ellis)", JSON.stringify(ev("SPRINT_KID_ACTIVE"))===JSON.stringify(["lucy","julian","ellis","lincoln"]));
ok("the 'Lincoln is past phonics sprints' message is gone", !ev("SPRINT_KID_MSG").lincoln&&src.indexOf("Lincoln is past phonics sprints")<0);
const L=ev("retrTracks('lincoln')"), E=ev("retrTracks('ellis')");
ok("his first track is the Phonogram Review Ladder, phonogram source, one-pass gate", L[0]&&L[0].key==="phono"&&L[0].src==="phonogram"&&L[0].settings&&L[0].settings.gate_streak===1&&L[0].label==="Phonogram Review Ladder");
ok("…with exactly Ellis's stages (Lucy's LOE-B list)", JSON.stringify(L[0].stages)===JSON.stringify(E[0].stages)&&L[0].stages.length===ev("SPRINT_LOE_B.length"));
ok("his AAS + Spelling, Editor Rules and Monarchy tracks follow, unchanged", L.map(t=>t.key).join()==="phono,aas,editor,monarchy");
ok("Lucy's, Julian's and Ellis's tracks are untouched", ev("retrTracks('lucy')").map(t=>t.key).join()==="phono,sight,frogs"&&ev("retrTracks('julian')").map(t=>t.key).join()==="naming,snakes,phono"&&E.map(t=>t.key).join()==="phono,mathfacts,editor,tf");
ok("the Sprint page gate reads SPRINT_KID_ACTIVE, so Lincoln gets the phonogram page, not the 'complete' card", /const isActive=SPRINT_KID_ACTIVE\.includes\(masteryKid\);/.test(fnIn(src,"buildSprintHtml")));
ok("no 🔀 anywhere in index.html", src.indexOf("🔀")<0);
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
