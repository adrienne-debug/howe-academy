// test_cp_wave7_glue.js — the wave-7 merge (2026-10-29): PR 28 📆 "send a section out earlier" joins PR 16 💡 Suggestions. The strip hands its
// suggestion over (cpSuggestOwns("sendEarly")), the list shows it once with Do it / Not now, and its id is made safe for classes/<cid>/dismissed.
const fs=require("fs"), path=require("path"), vm=require("vm"); const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n); } };
const slice=(a,b)=>{ const i=src.indexOf("// "+a), j=src.indexOf("// "+b); return i>=0&&j>i?src.slice(i,j):""; };
const SG=slice("CPSUGGEST_START","CPSUGGEST_END"), SE=slice("CPSENDEARLY_START","CPSENDEARLY_END");
ok("both blocks are present once", SG&&SE&&src.split("// CPSUGGEST_START").length===2&&src.split("// CPSENDEARLY_START").length===2);
ok("CPSUGGEST owns the sendEarly kind (and only while its own screen is on)", /\nfunction cpSuggestOwns\(k\)\{ return k==="sendEarly"&&cpsgOn\(\); \}/.test(SG)&&src.split("function cpSuggestOwns(").length===2);
ok("the strip steps aside once the list owns it", /const own=typeof cpSuggestOwns==="function"&&cpSuggestOwns\("sendEarly"\);/.test(SE)&&/if\(!own&&!ro\)/.test(SE));
ok("cpsgList takes PR 28's suggestion through one typeof-guarded builder", /cpsgSendEarly\(ctx\)/.test(SG.slice(SG.indexOf("function cpsgList("),SG.indexOf("function cpsgList(")+300))&&/function cpsgSendEarly\(ctx\)\{ if\(typeof cpSendEarlySuggest!=="function"\) return \[\];/.test(SG));
ok("…ordered after the pace-miss one, at most one shown, with its own icon and why line", /CPSG_ORDER=\["nocore","notest","miss","sendEarly",/.test(SG)&&/sendEarly:1/.test(SG)&&/sendEarly:"\\u\{1F4C6\}"/.test(SG)&&/s\.kind==="sendEarly"/.test(SG));
ok("…locked with the plan (no Do it when Adrienne locks the plan)", /lock:cpsgLock\("plan"\)/.test(SG.slice(SG.indexOf("function cpsgSendEarly("))));
// the id: PR 28's raw id has ":" — what the list stores must pass the dismissed rule's [A-Za-z0-9_~-]
const fn=n=>{ const i=src.indexOf("\nfunction "+n+"("); return i<0?"":src.slice(i+1,src.indexOf("\n",i+1)); };
let id=""; try{ const c={}; vm.createContext(c); vm.runInContext(fn("cpsgHash")+"\n"+fn("cpsgId"),c); id=c.cpsgId("sendEarly",["wildlife","2026-12-07"]); }catch(e){ id="ERR "+e; }
ok("the stored id is safe for the dismissed rule (got "+id+")", /^[A-Za-z0-9_~-]{1,80}$/.test(id)&&/^sendEarly~wildlife~2026-12-07$/.test(id));
const rules=JSON.parse(fs.readFileSync(path.join(__dirname,"envirothon/SITE_RULES.json"),"utf8"));
ok("the rules file keeps both PRs' plan fields (sendOn from 28, state from 20)", (()=>{ const t=JSON.stringify(rules); return /"sendOn"/.test(t)&&/"state"/.test(t)&&/"dismissed"/.test(t); })());
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
