// 👪 FAMSET collision (2026-10-04): the Family Time block editor (10/3) also declared `function famSet`,
// and the later declaration won — Settings ▸ Family kid color/emoji/name/school-age edits were silently dropped.
// Loads EVERY top-level declaration in source order (as the browser hoists them), not just the roster section.
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
const main=[...src.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]).reduce((a,b)=>b.length>a.length?b:a);
let pass=0, fail=0; const ok=(n,c)=>{ c?pass++:fail++; console.log((c?"  ok  - ":"  FAIL- ")+n); };
const grab=re=>{ const out=[]; let m; re=new RegExp(re.source,"gm"); while((m=re.exec(main))){ let d=0,j=main.indexOf("{",m.index);
  for(;j<main.length;j++){ if(main[j]==="{")d++; else if(main[j]==="}"&&--d===0) break; } out.push(main.slice(m.index,j+1)); } return out; };
const one=n=>{ const f=grab(new RegExp("^function "+n+"\\(")); if(f.length!==1) throw new Error(n+" declared "+f.length+"x"); return f[0]; };
ok("exactly one top-level `function famSet(` in the app", grab(/^function famSet\(/).length===1);
ok("exactly one top-level `function famBlkSet(` in the app", grab(/^function famBlkSet\(/).length===1);
const code=["let familyEdit=null;",...["familyEditInit","famTint","famSlug","famSet","famAdd","famSave","famDefs","famWrite","famBlkSet"].map(one),
  "this.__fe=()=>familyEdit;"].join("\n");
const writes=[];
const ctx={ ROSTER_DEF:[{id:"lincoln",name:"Lincoln",color:"#2563eb",schoolAge:true}], ROSTER:["lincoln"],
  rulesData:{familyBlocks:{fbabc:{name:"Family Time"}}}, momHere:()=>true, _dryRun:()=>false, renderAll:()=>{}, famSheetId:null,
  db:{ref:p=>({set:v=>{writes.push([p,v]);return {then:f=>({catch:()=>{}})};}})}, HA_LS:{setItem:()=>{}},
  document:{getElementById:()=>null}, location:{reload:()=>{}}, alert:m=>writes.push(["ALERT",m]) };
vm.createContext(ctx); vm.runInContext(code,ctx);
ctx.famSet(0,"color","#ff0000"); ctx.famSet(0,"name","Linc"); ctx.famSet(0,"emoji","🦊");
ok("kid editor edits are kept (familyEdit)", ctx.__fe()&&ctx.__fe()[0].name==="Linc"&&ctx.__fe()[0].color==="#ff0000");
ok("kid editor edits wrote nothing to Family Time blocks", !writes.some(w=>/familyBlocks/.test(w[0])));
ctx.famSave(); const sv=writes.find(w=>w[0]==="settings/family");
ok("Save Family saves the new name/color/emoji", sv&&sv[1][0].name==="Linc"&&sv[1][0].color==="#ff0000"&&sv[1][0].emoji==="🦊");
ctx.famBlkSet("fbabc","name","Lunch & History");
ok("Family Time block rename still writes its targeted path", writes.some(w=>w[0]==="config/rules/familyBlocks/fbabc/name"&&w[1]==="Lunch & History"));
ok("no Family Time markup still calls famSet(", !/famSet\(\\''\+J\(id\)|famSet\('"\+J\(id\)/.test(main));
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
