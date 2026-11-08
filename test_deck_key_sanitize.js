/*
 * 🔤 HAKEY — a deck / card / unit name with . # $ [ ] / is never a raw Firebase KEY (the "deck-name '.' key bug", 2026-11-08).
 *   · haKey on 30 names: safe names unchanged byte-for-byte, the rest %XX-coded, reversible, idempotent, = mastDefKey
 *   · no collisions on a fixture of real-looking names (only a name typed with a literal %2E-style code could meet a coded one)
 *   · reads: haDecodeMastery / haDecodeUnits put the names back as data arrives — the coded key first, a raw key the fallback
 *   · writes: the real write functions run against a fake database that refuses keys the way the SDK does — no throw, coded keys
 *   · every write site that keys a name goes through haKey / haKeys / haSettingsOut / haUnitOut (source scan, grandfathered list)
 *   · the heal plan on a fixture: exactly what it would write, targeted paths, idempotent; Mom only; never in dry run
 *   · no family or kid names in the block or this test
 *   run:  node test_deck_key_sanitize.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
let pass=0, fail=0;
const safe=f=>{ try{ return f(); }catch(e){ return false; } };   // a missing node is a FAIL, not a crash
function ok(n,c,x){ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":""));} }
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
const A=src.indexOf("// HAKEY_START"), B=src.indexOf("// HAKEY_END");
ok("HAKEY block present",A>0&&B>A);
const BLOCK=src.slice(A,B);
function fnSrc(name){ const a=src.indexOf("function "+name+"("); if(a<0) throw new Error("no "+name); let i=src.indexOf("{",a), d=0, j=i; for(;j<src.length;j++){ if(src[j]==="{")d++; else if(src[j]==="}"){ d--; if(!d) break; } } return src.slice(a,j+1); }

// ── a fake database that validates like the v8 SDK: . # $ [ ] in a path or key throw; / in a value's key throws ──
function fakeDb(){
  const tree={}, calls=[];
  const badPath=p=>/[.#$\[\]]/.test(p), badKey=k=>/[.#$\[\]\/]/.test(k);
  const checkVal=(v,where)=>{ if(v&&typeof v==="object") Object.keys(v).forEach(k=>{ if(badKey(k)) throw new Error("invalid key "+JSON.stringify(k)+" in "+where); checkVal(v[k],where); }); };
  const segs=p=>String(p).split("/").filter(Boolean);
  const put=(p,v)=>{ const s=segs(p); if(!s.length) return; let x=tree; for(let i=0;i<s.length-1;i++){ if(!x[s[i]]||typeof x[s[i]]!=="object") x[s[i]]={}; x=x[s[i]]; }
    if(v===null||v===undefined){ delete x[s[s.length-1]]; prune(tree,s.slice(0,-1)); } else x[s[s.length-1]]=JSON.parse(JSON.stringify(v)); };
  const prune=(t,s)=>{ for(let n=s.length;n>0;n--){ let x=t; for(let i=0;i<n-1;i++){ x=x&&x[s[i]]; } const c=x&&x[s[n-1]]; if(c&&typeof c==="object"&&!Object.keys(c).length) delete x[s[n-1]]; else break; } };   // Firebase drops an emptied node
  const ref=p=>{ if(badPath(p)) throw new Error("Firebase.child failed: invalid path "+p);
    return { set(v){ checkVal(v,p); calls.push({op:"set",path:p,v}); put(p,v); return Promise.resolve(); },
      update(o){ Object.keys(o).forEach(k=>{ if(badPath(k)) throw new Error("Firebase.update failed: invalid key "+k); checkVal(o[k],p+"/"+k); }); calls.push({op:"update",path:p,v:o}); Object.keys(o).forEach(k=>put(p+"/"+k,o[k])); return Promise.resolve(); },
      remove(){ calls.push({op:"remove",path:p}); put(p,null); return Promise.resolve(); },
      transaction(f){ const v=f(null); checkVal(v,p); calls.push({op:"transaction",path:p,v}); put(p,v); return Promise.resolve({committed:true}); } }; };
  return {ref,tree,calls};
}

const ctx={console,ROSTER:["k1","k2"],masteryData:{},unitStudies:{},masteryKid:"k1",mastRecAudio:"",mastRecErr:"",_dry:false,_mom:true,toasts:[],
  HA_LS:{setItem(){},getItem(){return null;}}};
ctx.window=ctx; vm.createContext(ctx);
vm.runInContext(BLOCK+"\n"+["mastDefKeyOk","mastDefKey","mastGetDef","mastGetDefAudio","mastGetVisual","mastSetVisual","mastAdminCatMode","mastSaveDef","mastSaveDefAudio","mastRemoveDefAudio"].map(fnSrc).join("\n")
  +"\nvar db=null; function _dryRun(){ return _dry; } function momHere(){ return _mom; } function _mastRe(){} function gwShowToast(m){ toasts.push(m); } function renderAll(){}\n"
  +"this.H={haKeyOk,haKey,haKeyName,haKeys,haKeyField,haSettingsOut,haUnitOut,haDecodeMap,haDecodeMastery,haDecodeUnits,haKeyHealPlan,haKeyHealHTML,haKeyHeal,mastDefKey,mastDefKeyOk,mastGetDef,mastGetDefAudio,mastGetVisual,mastSetVisual,mastAdminCatMode,mastSaveDef,mastSaveDefAudio,mastRemoveDefAudio,setDb:d=>{db=d;}};",ctx);
const H=ctx.H;
const oldMastDefKey=p=>{ p=String(p); return !/[.#$\[\]\/]/.test(p)?p:p.replace(/[.#$\[\]\/%]/g,c=>"%"+c.charCodeAt(0).toString(16).toUpperCase().padStart(2,"0")); };

console.log("haKey on 30 names");
const SAFE=["Sharks","Greek & Latin Roots","Spelling List 4","Shapes","100% Math","Ch 3","Ch_3","Chapter 3 — Rivers","Mrs Smith’s words","Café","¿Qué?","Sight Words: Set B","Bones (Part 2)","dinos ✨","Week 1 · pick"];
const BAD=["Ch. 3","Dr. Seuss","E.T.","U.S. History","flex/flect","1/2 & 1/4","Fractions/Decimals","St. Patrick’s","#hashtags","$ money","[draft]","a.b.c","Ch. 3/4","50% off. Now","Mr. & Mrs. Jones"];
ok("30 names in the fixture",SAFE.length+BAD.length===30);
SAFE.forEach(n=>ok("safe name unchanged: "+n,H.haKey(n)===n&&H.haKeyOk(n)));
BAD.forEach(n=>{ const k=H.haKey(n); ok("coded: "+n+" → "+k,k!==n&&H.haKeyOk(k)&&H.haKeyName(k)===n&&H.haKey(k)===k&&k===oldMastDefKey(n)); });
ok("examples",H.haKey("Ch. 3")==="Ch%2E 3"&&H.haKey("flex/flect")==="flex%2Fflect"&&H.haKey("50% off. Now")==="50%25 off%2E Now",[H.haKey("Ch. 3"),H.haKey("50% off. Now")]);
ok("mastDefKey ≡ haKey (same output as before, every name)",SAFE.concat(BAD).every(n=>H.mastDefKey(n)===H.haKey(n)&&H.mastDefKey(n)===oldMastDefKey(n)));
ok("mastDefKeyOk unchanged (rule cards still recite)",!H.mastDefKeyOk("Ch. 3")&&H.mastDefKeyOk("Ch 3"));
ok("null / number",H.haKey(null)===""&&H.haKey(3)==="3"&&H.haKey(3.5)==="3%2E5");

console.log("no collisions");
{ const FIX=SAFE.concat(BAD,["Ch.3","Ch 3.","Ch .3","Ch/3","Ch#3","Ch$3","Ch[3]","Ch]3[","flex%flect","flex.flect","E.T","ET.","U.S.","US","U/S","Dr.","Dr","Dr_"]);
  const by={}, clash=[]; new Set(FIX).forEach(n=>{ const k=H.haKey(n); if(by[k]!=null&&by[k]!==n) clash.push([by[k],n]); by[k]=n; });
  ok("every distinct name has its own key ("+new Set(FIX).size+" names)",!clash.length,clash);
  ok("and every key decodes back to its name",Object.keys(by).every(k=>H.haKeyName(k)===by[k]));
  ok("documented edge: only a name typed with a literal code can meet a coded one",H.haKey("a%2Eb")===H.haKey("a.b")); }

console.log("reads: decoded as the data arrives");
{ const v={k1_settings:{cat_modes:{"Ch%2E 3":"quiz","Sharks":"flip"},definitions:{"flex%2Fflect":"to bend","Dr%2E":"coded","Dr.":"raw local"},match_best:{"Ch%2E 3 \u{00B7} pick":12},
      paper_kid:{"Ch_ 3":"x"},cbDismiss:{"Ch_ 3":1},gameDecks:{"Ch_ 3":{a:true}},show_me:true,intro_dots:5},
    k1_visuals:{"Ch%2E 3_Dr%2E Seuss":"🐱",Sharks_Tiger:"🦈"},k1_bank_order:{"U%2ES%2E History":["a","b"]},k1_idflash:{"E%2ET%2E":{n:1}},k1:[{subject:"Ch. 3",prompt:"Dr. Seuss"}]};
  const sharks=v.k1_settings.cat_modes, keepPk=v.k1_settings.paper_kid;
  const M=H.haDecodeMastery(v), st=M.k1_settings;
  ok("cat_modes by name",st.cat_modes["Ch. 3"]==="quiz"&&st.cat_modes.Sharks==="flip"&&!("Ch%2E 3" in st.cat_modes));
  ok("definitions by name (DEFEDIT's coded key reads plainly now)",st.definitions["flex/flect"]==="to bend");
  ok("the coded key wins over a raw twin",st.definitions["Dr."]==="coded");
  ok("a raw key with no coded twin stays (the fallback)",H.haDecodeMap({"Dr.":"raw"})["Dr."]==="raw");
  ok("match_best by name",st.match_best["Ch. 3 \u{00B7} pick"]===12);
  ok("visuals and bank order by name",M.k1_visuals["Ch. 3_Dr. Seuss"]==="🐱"&&M.k1_visuals.Sharks_Tiger==="🦈"&&M.k1_bank_order["U.S. History"].length===2);
  ok("own-coding maps and _idflash untouched",st.paper_kid===keepPk&&st.cbDismiss["Ch_ 3"]===1&&st.gameDecks["Ch_ 3"].a&&M.k1_idflash["E%2ET%2E"].n===1);
  ok("a map with nothing coded keeps its identity",H.haDecodeMap(SAFE.reduce((o,n)=>(o[n]=1,o),{}))!==null&&(()=>{ const m={a:1,"100%":2}; return H.haDecodeMap(m)===m; })());
  ok("scalars and items untouched",st.show_me===true&&st.intro_dots===5&&M.k1[0].subject==="Ch. 3");
  ctx.masteryData=M; ctx.masteryKid="k1";
  ok("mastGetDef / mastGetVisual find the names",H.mastGetDef("k1","flex/flect")==="to bend"&&H.mastGetVisual("Ch. 3","Dr. Seuss")==="🐱");
  const us=H.haDecodeUnits({u1:{id:"u1",visuals:{"Sharks_Dr%2E Fin":{imageUrl:"x"}},decks:[{key:"Sharks",cards:[{name:"Dr. Fin"}]}]},u2:{id:"u2"}});
  ok("unit visuals by name",us.u1.visuals["Sharks_Dr. Fin"].imageUrl==="x"&&us.u2.id==="u2"); }

console.log("writes: the real functions against a database that refuses bad keys");
{ const D=fakeDb(); H.setDb(D); ctx.masteryData={k1_settings:{}}; ctx.masteryKid="k1"; ctx._dry=false;
  let threw=null; try{ H.mastAdminCatMode("Ch. 3","quiz"); }catch(e){ threw=e.message; }
  ok("a new 'Ch. 3' deck gets its mode (no throw)",!threw,threw);
  ok("…saved under the coded key, the name kept in memory",safe(()=>D.tree.mastery.k1_settings.cat_modes["Ch%2E 3"]==="quiz"&&ctx.masteryData.k1_settings.cat_modes["Ch. 3"]==="quiz"));
  threw=null; try{ H.mastSetVisual("Ch. 3","Dr. Seuss","🐱"); }catch(e){ threw=e.message; }
  ok("a 'Dr. Seuss' picture is written (was silently dropped)",safe(()=>!threw&&D.tree.mastery.k1_visuals["Ch%2E 3_Dr%2E Seuss"]==="🐱"),threw);
  ctx.mastRecAudio="data:audio/x"; threw=null; let r; try{ r=H.mastSaveDefAudio("k1","E.T."); }catch(e){ threw=e.message; }
  ok("a voice clip for 'E.T.' is saved (was refused)",safe(()=>!threw&&r===true&&D.tree.mastery.k1_settings.def_audio["E%2ET%2E"]==="data:audio/x"&&H.mastGetDefAudio("k1","E.T.")==="data:audio/x"),threw);
  try{ H.mastRemoveDefAudio("k1","E.T."); }catch(e){ threw=e.message; }
  ok("…and removed",safe(()=>!threw&&!("E%2ET%2E" in (D.tree.mastery.k1_settings.def_audio||{}))));
  threw=null; try{ H.mastSaveDef("flex/flect","to bend"); }catch(e){ threw=e.message; }
  ok("a slash meaning saves under its coded key, never nested",safe(()=>!threw&&D.tree.mastery.k1_settings.definitions["flex%2Fflect"]==="to bend"&&!D.tree.mastery.k1_settings.definitions.flex));
  ok("…memory keeps the name",ctx.masteryData.k1_settings.definitions["flex/flect"]==="to bend"&&!("flex%2Fflect" in ctx.masteryData.k1_settings.definitions));
  ctx.masteryData.k1_settings.definitions["flex%2Fflect"]="stale coded twin"; H.mastSaveDef("flex/flect","");
  ok("…clearing it clears the name and any coded twin in memory",!("flex/flect" in ctx.masteryData.k1_settings.definitions)&&!("flex%2Fflect" in ctx.masteryData.k1_settings.definitions));
  const o={cat_modes:{"Ch. 3":"quiz"},cat_sprint:{"U.S.":true},max_per_cat:5,definitions:{"Dr.":"x"}}, out=H.haSettingsOut(o);
  ok("haSettingsOut codes only name-keyed fields",out.cat_modes["Ch%2E 3"]==="quiz"&&out.cat_sprint["U%2ES%2E"]===true&&out.max_per_cat===5&&out.definitions["Dr%2E"]==="x"&&o.cat_modes["Ch. 3"]==="quiz");
  ok("haSettingsOut / haUnitOut return the same object when nothing needs coding",(()=>{ const a={cat_modes:{x:1}}, u={id:"u",visuals:{a_b:1}}; return H.haSettingsOut(a)===a&&H.haUnitOut(u)===u; })());
  ok("a raw name beside its coded twin still writes (coded wins)",safe(()=>{ const t=H.haSettingsOut({cat_modes:{"Ch%2E 3":"new","Ch. 3":"old"}}).cat_modes; return Object.keys(t).every(H.haKeyOk)&&Object.keys(t).length===1&&t["Ch%2E 3"]==="new"&&H.haKeys({"Ch. 3":"old","Ch%2E 3":"new"})["Ch%2E 3"]==="new"; }));
  const u={id:"sharks",visuals:{"Sharks_Dr. Fin":{imageUrl:"x"}}}, uo=H.haUnitOut(u);
  threw=null; try{ D.ref("unitStudies/sharks").transaction(()=>uo); }catch(e){ threw=e.message; }
  ok("a unit with a 'Dr. Fin' card saves (whole transaction used to throw)",safe(()=>!threw&&D.tree.unitStudies.sharks.visuals["Sharks_Dr%2E Fin"]&&u.visuals["Sharks_Dr. Fin"]),threw);
  threw=null; try{ D.ref("x").update({"k1_settings/cat_modes":H.haKeys({"Ch. 3":"a","[draft]":"b"})}); }catch(e){ threw=e.message; }
  ok("haKeys makes a whole map writable",!threw,threw);
  threw=null; try{ D.ref("x").set({"Ch. 3":1}); }catch(e){ threw=e.message; }
  ok("(the fake database does refuse a raw key, like the SDK)",!!threw); }

console.log("every keyed write goes through haKey (source scan)");
{ const MAPS="cat_[a-z_]+|definitions|def_audio|show_me_cue|match_best|_visuals|_bank_order|visuals";
  // A write whose path names a name-keyed map: db.ref("…<map>…").<set|update|remove|transaction>(…) or W("…<map>…",…)
  const lines=src.split("\n"), bad=[];
  // grandfathered — each with its reason
  const GRANDFATHER=[
    [/_settings\/definitions"\)\.update\(\{\[key\]:def\.trim\(\)\|\|null\}\)/,"mastSaveDef: key=mastDefKey(prompt) ≡ haKey"],
  ];
  lines.forEach((L,i)=>{
    const re=new RegExp('(?:db\\.ref|\\bW)\\(("(?:mastery|unitStudies)[^),]*?(?:'+MAPS+')[^),]*)[),](\\.(?:set|update|remove|transaction)\\(([^;]*))?',"g"); let m;
    while((m=re.exec(L))){
      const p=m[1], call=m[2]||"", arg=m[3]||"";
      if(GRANDFATHER.some(g=>g[0].test(L))) continue;
      // a variable segment after the map must be haKey(…)
      const after=p.replace(new RegExp('^.*?(?:'+MAPS+')'),"");
      if(/"\+(?!haKey\(|\(typeof haKey==="function"\?haKey\()/.test(after)) bad.push((i+1)+": path "+p.slice(0,90));
      // a map-level update must code its keys
      if(/^\.update\(/.test(call)&&new RegExp('(?:'+MAPS+')"$').test(p)&&!/^(\(typeof (haKeys|haSettingsOut)==="function"\?|\{\[\(typeof haKey==="function"\?haKey\(|haKeys\(|haSettingsOut\(|\{\[haKey\()/.test(arg)) bad.push((i+1)+": update "+arg.slice(0,60));
    }
    // multi-path keys built for a _settings update: upd["cat_hold/"+dk]
    const mm=L.match(/upd\["(?:cat_[a-z_]+|definitions|def_audio|match_best|show_me_cue)\/"\+(?!haKey\(|\(typeof haKey===)/); if(mm) bad.push((i+1)+": multi-path "+mm[0]);
  });
  ok("no unwrapped keyed write",!bad.length,bad.slice(0,12));
  const n=(src.match(/haKey\(|haKeys\(|haSettingsOut\(|haUnitOut\(/g)||[]).length;
  ok("haKey is used at the write sites ("+n+")",n>=60,n);
  ok("the mastery listener decodes",/masteryData=\(typeof haDecodeMastery==="function"\?haDecodeMastery\(\{\.\.\.v\}\)/.test(src));
  ok("the local copy decodes",/masteryData=\(typeof haDecodeMastery==="function"\?haDecodeMastery\(JSON\.parse\(md\)\)/.test(src));
  ok("the unitStudies listener decodes",/unitStudies=\(typeof haDecodeUnits==="function"\?haDecodeUnits\(s\.val\(\)\|\|\{\}\)/.test(src));
  ok("the Builder's save codes its unit record",/transaction\(cur=>cur\?undefined:\(typeof haUnitOut==="function"\?haUnitOut\(u\)/.test(src));
  ok("voice clips no longer refuse a front",src.indexOf("can't key a recording")<0&&src.indexOf("can\\'t key a clip")<0);
  ok("pictures no longer dropped",!/mastDefKeyOk\(key\)\) db\.ref\("mastery\/"\+kid\+"_visuals"\)/.test(src));
  ok("unit ids still slug away periods",(()=>{ const f=new Function(fnSrc("ubSlug")+"\nreturn ubSlug;")(); return f("Dr. Seuss & E.T.")==="dr_seuss_e_t"&&!/[.#$\[\]\/]/.test(f("a/b.c[d]#$")); })()); }

console.log("heal: the plan on a fixture");
{ // what an old "/" write left: nested under the first part of the name
  const M={
    k1:[{subject:"Fractions/Decimals",prompt:"1/2"},{subject:"Sharks",prompt:"Tiger"}],
    k1_custom_items:[{cat:"Ch 3/4",name:"flex/flect"},{cat:"Ch. 5/6",name:"x"}],
    k1_settings:{cat_modes:{"Fractions":{"Decimals":"quiz"},Sharks:"flip","Ch 3/4":"flash","Ch 3":{"4":"stale"}},
      definitions:{flex:{flect:"to bend"},"1":{"2":"one half"},Tiger:"big"},
      match_best:{"Fractions":{"Decimals \u{00B7} pick":9}},cat_hold:{Sharks:true}},
    k1_visuals:{"Fractions":{"Decimals_1":{"2":"½"}}},
    k1_bank_order:{"Ch 3":{"4":["flex/flect"]}},
    k2_settings:{cat_modes:{Sharks:"flip"}}
  };
  const us={u1:{id:"u1",enrolled:{k2:true},decks:[{key:"Rocks/Minerals",cards:[{name:"Quartz"}]}],visuals:{"Rocks":{"Minerals_Quartz":{imageUrl:"q"}}}}};
  const P=H.haKeyHealPlan(M,us,["k1","k2"]);
  const exp={mastery:{
    "k1_settings/cat_modes/Fractions%2FDecimals":"quiz","k1_settings/cat_modes/Fractions/Decimals":null,
    "k1_settings/cat_modes/Ch 3/4":null,
    "k1_settings/definitions/flex%2Fflect":"to bend","k1_settings/definitions/flex/flect":null,
    "k1_settings/definitions/1%2F2":"one half","k1_settings/definitions/1/2":null,
    "k1_settings/match_best/Fractions%2FDecimals \u{00B7} pick":9,"k1_settings/match_best/Fractions/Decimals \u{00B7} pick":null,
    "k1_visuals/Fractions%2FDecimals_1%2F2":"½","k1_visuals/Fractions/Decimals_1/2":null,
    "k1_bank_order/Ch 3%2F4":["flex/flect"],"k1_bank_order/Ch 3/4":null},
    "unit:u1":{"visuals/Rocks%2FMinerals_Quartz":{imageUrl:"q"},"visuals/Rocks/Minerals_Quartz":null}};
  ok("the plan writes exactly the moves",JSON.stringify(sortKeys(P.upd))===JSON.stringify(sortKeys(exp)),sortKeys(P.upd));
  ok("a name already fixed keeps its fixed value — only the nested copy goes",P.items.some(x=>x.name==="Ch 3/4"&&x.field==="cat_modes"&&x.op==="drop"));
  ok("a name with . as well never left a record (refused) — not in the plan",!P.items.some(x=>/Ch\. 5/.test(x.name)));
  ok("names a kid doesn't have are not touched",!JSON.stringify(P.upd).includes("k2_"));
  ok("every path is targeted (no whole-node write)",Object.keys(P.upd.mastery).every(k=>k.split("/").length>=2));
  // apply it to a copy of the database (coded keys as they would be stored), decode, plan again → nothing
  const D=fakeDb(); D.tree.mastery=JSON.parse(JSON.stringify(Object.assign({},M,{k1_settings:Object.assign({},M.k1_settings,{cat_modes:Object.assign({},M.k1_settings.cat_modes)})})));
  delete D.tree.mastery.k1_settings.cat_modes["Ch 3/4"]; D.tree.mastery.k1_settings.cat_modes["Ch 3%2F4"]="flash";   // the stored form of the fixed one
  D.tree.unitStudies=JSON.parse(JSON.stringify(us));
  const M0=H.haDecodeMastery(JSON.parse(JSON.stringify(D.tree.mastery))), P0=H.haKeyHealPlan(M0,H.haDecodeUnits(JSON.parse(JSON.stringify(D.tree.unitStudies))),["k1","k2"]);
  ok("the stored form plans the same",JSON.stringify(sortKeys(P0.upd))===JSON.stringify(sortKeys(exp)));
  let threw=null; try{ D.ref("mastery").update(P0.upd.mastery); D.ref("unitStudies/u1").update(P0.upd["unit:u1"]); }catch(e){ threw=e.message; }
  ok("the plan is a valid update (no bad key)",!threw,threw);
  const M1=H.haDecodeMastery(JSON.parse(JSON.stringify(D.tree.mastery))), U1=H.haDecodeUnits(JSON.parse(JSON.stringify(D.tree.unitStudies)));
  ok("after the heal the names read",safe(()=>M1.k1_settings.cat_modes["Fractions/Decimals"]==="quiz"&&M1.k1_settings.definitions["flex/flect"]==="to bend"&&M1.k1_visuals["Fractions/Decimals_1/2"]==="½"&&M1.k1_bank_order["Ch 3/4"][0]==="flex/flect"&&M1.k1_settings.cat_modes["Ch 3/4"]==="flash"&&U1.u1.visuals["Rocks/Minerals_Quartz"].imageUrl==="q"));
  ok("…the nested copies are gone",!M1.k1_settings.cat_modes.Fractions&&!M1.k1_settings.cat_modes["Ch 3"]&&!M1.k1_settings.definitions.flex&&!M1.k1_bank_order["Ch 3"]&&!U1.u1.visuals.Rocks);
  ok("…untouched data untouched",M1.k1_settings.cat_modes.Sharks==="flip"&&M1.k1_settings.definitions.Tiger==="big"&&M1.k1_settings.cat_hold.Sharks===true&&M1.k2_settings.cat_modes.Sharks==="flip");
  ok("idempotent: a second plan is empty",H.haKeyHealPlan(M1,U1,["k1","k2"]).items.length===0);

  console.log("heal: the Mom HQ row and the tap");
  ctx.masteryData=JSON.parse(JSON.stringify(M)); ctx.unitStudies=JSON.parse(JSON.stringify(us)); ctx._mom=true; ctx._dry=false;
  const h=H.haKeyHealHTML();
  ok("Mom sees the row with the names",/Fix names with periods or slashes/.test(h)&&/Fractions\/Decimals/.test(h)&&/onclick="haKeyHeal\(\)"/.test(h));
  ctx._mom=false; ok("not Mom → no row, the tap does nothing",H.haKeyHealHTML()===""&&H.haKeyHeal()===0); ctx._mom=true;
  const D2=fakeDb(); H.setDb(D2); ctx._dry=true; ctx.toasts.length=0;
  ok("dry run writes nothing",H.haKeyHeal()===0&&D2.calls.length===0&&/Dry run/.test(ctx.toasts[0]||""));
  ctx._dry=false; const n=H.haKeyHeal();
  ok("the tap: one targeted update per node",n===P.items.length&&D2.calls.length===2&&D2.calls.every(c=>c.op==="update")&&D2.calls[0].path==="mastery"&&D2.calls[1].path==="unitStudies/u1",D2.calls.map(c=>c.op+" "+c.path));
  ctx.masteryData={k1_settings:{cat_modes:{Sharks:"flip"}}}; ctx.unitStudies={};
  ok("nothing affected → no row",H.haKeyHealHTML()===""); }

console.log("no family or kid names");
{ const NAMES=/\b(lincoln|ellis|lucy|julian|adrienne|howe|kenzie|sara|dewalt|andrew)\b/i;
  ok("none in the HAKEY block",!NAMES.test(BLOCK),(BLOCK.match(NAMES)||[])[0]);
  const me=fs.readFileSync(__filename,"utf8").replace(/const NAMES=.*\n/,"");
  ok("none in this test",!NAMES.test(me),(me.match(NAMES)||[])[0]);
  ok("the 🔀 emoji is not used",BLOCK.indexOf("\u{1F500}")<0); }

function sortKeys(o){ if(!o||typeof o!=="object"||Array.isArray(o)) return o; const r={}; Object.keys(o).sort().forEach(k=>{ r[k]=sortKeys(o[k]); }); return r; }
console.log("\n"+pass+" passed, "+fail+" failed");
process.exit(fail?1:0);
