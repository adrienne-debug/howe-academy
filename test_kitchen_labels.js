/* 🏷 KITLABELS — a family's own meal labels beside the built-in tags, and the built-ins can be taken off (Adrienne 2026-10-23).
 *   · kitchen/labels/{id} = {name, emoji?, order}: add · rename · reorder · delete (the delete confirms with the recipe count and
 *     strips the id from each recipe's tags[] with targeted writes)
 *   · a built-in ✕ writes kitchen/labels/hidden/{tag}=true and asks "Also take it off the N recipes?" — Yes strips, No leaves them;
 *     a hidden built-in is off every chip row and filter, a recipe still carrying it still drives the sides picker and Prep's batch
 *     section; ↩ Restore removes the flag
 *   · the editor toggles labels on a recipe; ＋ new label makes one and turns it on; an unknown id is never written back
 *   · the library filter and the shared picker filter AND across a built-in and a label, remembered on the device for the session
 *   · "group by label" lists each label's recipes under a heading, unlabelled last
 *   · no labels and nothing hidden → the library card, the picker and the recipe view are byte-identical to the code without the block
 *   run: node test_kitchen_labels.js */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":"")); } };
const J=v=>JSON.stringify(v);
const fn=name=>{ const a=src.indexOf("function "+name+"("); if(a<0) throw new Error("missing "+name); let i=src.indexOf("{",a), d=0, j=i; for(;j<src.length;j++){ if(src[j]==="{")d++; else if(src[j]==="}"){ d--; if(!d) break; } } return src.slice(a,j+1); };
const line=s=>{ const i=src.indexOf(s); if(i<0) throw new Error("missing "+s); return src.slice(i,src.indexOf("\n",i)+1); };
const ka=src.indexOf("// KITLABELS_START"), kb=src.indexOf("// KITLABELS_END");
ok("KITLABELS block present once", ka>0&&kb>ka&&src.indexOf("// KITLABELS_START",ka+5)<0);
ok("the boot listener hooks kitchen/labels", src.includes('if(typeof kitLabListen==="function") kitLabListen();'));
ok("every label write names its path (no whole-node set of labels or meals)", !/ref\('kitchen\/labels'\)\.set|ref\("kitchen\/labels"\)\.set|ref\('kitchen\/meals'\)\.set/.test(src.slice(ka,kb)));
// the 📚 Meal library card (and the 🏷 Labels card after it), exactly as renderKitchen builds it
const la=src.indexOf("  // ── 📚 Meal library"), lb=src.indexOf("  // ── 📅 Rotations");
ok("the library card slice is found", la>0&&lb>la);
const libCard="function libCard(sortedMids){ let h=''; "+src.slice(la,lb)+" return h; }";
const batchLine="function prepBatch(){ "+line("  const batch=Object.keys(kitMeals||{}).filter(id=>Array.isArray((kitMeals[id]||{}).tags)&&(kitMeals[id].tags.includes(\"batch\")")+" return batch; }";

// ── a tiny app: `base` = the same code with the KITLABELS block left out (every hook falls through) ──
function world(o){
  o=o||{};
  const W={writes:[],toasts:[],alerts:[],confirms:[],pins:0,renders:0,els:{content:{}},ls:Object.assign({},o.ls||{}),ss:o.ss||{},dry:!!o.dry,mom:!("mom" in o)||o.mom};
  W.answer=o.answer||(()=>true);
  const ref=p=>({set:v=>W.writes.push(["set",p,JSON.parse(JSON.stringify(v))]),update:v=>W.writes.push(["update",p,JSON.parse(JSON.stringify(v))]),remove:()=>W.writes.push(["remove",p])});
  const ctx={console,Math,JSON,Object,Array,String,Number,parseInt,parseFloat,isNaN,Date,RegExp,Set,Map,setTimeout:(f)=>{},
    db:{ref:ref},HA_LS:{getItem:k=>(k in W.ls)?W.ls[k]:null,setItem:(k,v)=>{ W.ls[k]=String(v); }},
    sessionStorage:{getItem:k=>(k in W.ss)?W.ss[k]:null,setItem:(k,v)=>{ W.ss[k]=String(v); }},
    mwToast:m=>W.toasts.push(m),alert:m=>W.alerts.push(m),confirm:m=>{ W.confirms.push(m); return W.answer(m,W.confirms.length); },
    esc:s=>String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/"/g,"&quot;"),
    momHere:()=>W.mom,_dryRun:()=>W.dry,kitPinGate:(then,why)=>{ W.pins++; W.pinWhy=why; if(W.mom) then(); },
    renderMomsPlan:()=>{ W.renders++; },kitRotRender:()=>{ W.renders++; },kitRotTypeMeta:t=>[t,"🍽","Dinner"],kitRotPickCur:()=>"",kitRotFmt:iso=>iso,
    kitRateChips:()=>"",kitFlagMark:()=>"",kitImportHTML:()=>"",kitMealsLSSave:()=>{ W.lsSaves=(W.lsSaves||0)+1; },kitPrepMins:()=>10,
    tab:"moms-plan",document:{getElementById:id=>W.els[id]||null}};
  vm.createContext(ctx);
  const run=e=>vm.runInContext(e,ctx);
  run("var kitMeals="+J(o.meals||{})+"; var kitPlan={}; var kitView=null, kitEditId=null, kitEditPrep=[], kitEditDraft=null; var kitCap={}; var kitImp={open:false}; var kitLibQ='', kitLibTag=''; const KIT_ROT_DAYS=['Mon','Tue','Wed','Thu','Fri','Sat','Sun']; var kitRotPick=null;");
  run(line("const KIT_TAGS=")+fn("kitTagLabel")+fn("kitTagToggle")+fn("kitFlagDb")+fn("_kitStash")+fn("kitSaveMeal")+fn("kitRecipeExtrasEditorHTML")+fn("kitRecipeExtrasHTML")
     +fn("kitLibMatch")+fn("kitLibTagSet")+fn("kitRotPickOpen")+fn("kitRotPickTag")+fn("kitRotPickMatch")+fn("kitRotNorm")+fn("kitRotPickHTML")+fn("kitSideLibPick")+"\n"+libCard+"\n"+batchLine);
  if(!o.base) run(src.slice(ka,kb));
  if(!o.base&&o.labels) run("kitLabApply("+J(o.labels)+")");
  W.run=run; W.ctx=ctx;
  W.lib=()=>run("libCard(Object.keys(kitMeals).sort((a,b)=>String((kitMeals[a]||{}).name||'').localeCompare(String((kitMeals[b]||{}).name||''))))");
  W.editorChips=tags=>{ const h=run("kitRecipeExtrasEditorHTML("+J({tags:tags})+")"); return h.slice(h.lastIndexOf('<div style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:6px">')); };
  W.pick=()=>{ run("kitRotPick=kitRotPick||{kind:'b',w:0,i:0,slot:'d',q:'',tag:''}"); return run("kitRotPickHTML()"); };
  W.pickIds=()=>(W.pick().match(/data-rotpick="([^"]+)"/g)||[]).map(x=>x.slice(14,-1));
  W.ids=()=>run("Object.keys(kitLabels)");
  W.upd=()=>W.writes.filter(w=>w[0]==="update").map(w=>w[2]);
  return W;
}
// eight recipes so the library shows its 🔎 + chip row (phase-4 rule), two of them tagged
const MEALS={m1:{name:"Burgers",emoji:"🍔",tags:["gf","kid"]},m2:{name:"Roasted Broccoli",emoji:"🥦",tags:["side","gf"]},m3:{name:"Tacos",tags:["gf"]},m4:{name:"Chili",tags:["batch"]},
  m5:{name:"Green Juice",tags:["juice"]},m6:{name:"Pancakes"},m7:{name:"Soup"},m8:{name:"Zucchini Bread",tags:["batch","zzz"]}};
const M=()=>JSON.parse(J(MEALS));

console.log("\n── create / rename / reorder ──");
{ const W=world({meals:M()});
  const id=W.run("kitLabAdd('Crockpot','🍲')");
  ok("a label gets an id that can never be the word hidden", /^l[0-9a-z]+$/.test(id)&&id!=="hidden", id);
  ok("…written once at kitchen/labels/{id} = {name, emoji, order:1}", J(W.writes)===J([["set","kitchen/labels/"+id,{name:"Crockpot",order:1,emoji:"🍲"}]]), W.writes);
  ok("…and on the device copy", JSON.parse(W.ls.ha_kit_labels).labels[id].name==="Crockpot");
  const id2=W.run("kitLabAdd('  Quick  ','')");
  ok("the second label takes order 2, no emoji key", J(W.writes[1])===J(["set","kitchen/labels/"+id2,{name:"Quick",order:2}]), W.writes[1]);
  ok("blank → nothing", W.run("kitLabAdd('   ','')")===null&&W.writes.length===2);
  ok("a name already there (any case) → an alert, nothing written", W.run("kitLabAdd('crockpot','')")===null&&W.alerts.length===1&&W.writes.length===2, W.alerts);
  ok("…same for a built-in still on the list", W.run("kitLabAdd('Side dish','')")===null&&W.alerts.length===2);
  ok("the choices: the six built-ins, then the family's own in order", J(W.run("kitLabChoices()").map(c=>c[1]))===J(["Gluten-free","Dairy-free","Kid-friendly","Batch / make-ahead","Juice or smoothie","Side dish","🍲 Crockpot","Quick"]));
  W.writes.length=0;
  ok("rename writes only the fields that changed", W.run("kitLabRename('"+id+"','Slow cooker','🍲')")===true&&J(W.upd())===J([{["kitchen/labels/"+id+"/name"]:"Slow cooker"}]), W.writes);
  W.writes.length=0;
  ok("dropping the emoji writes null to that field", W.run("kitLabRename('"+id+"','Slow cooker','')")===true&&J(W.upd())===J([{["kitchen/labels/"+id+"/emoji"]:null}]), W.writes);
  ok("a rename onto another label's name is refused", W.run("kitLabRename('"+id+"','QUICK','')")===false&&W.alerts.length===3);
  W.writes.length=0;
  ok("↑ on the second label swaps the two orders (one multi-path update)", W.run("kitLabMove('"+id2+"',-1)")===true&&J(W.upd())===J([{["kitchen/labels/"+id2+"/order"]:1,["kitchen/labels/"+id+"/order"]:2}]), W.writes);
  ok("…and the list follows", J(W.run("kitLabList()").map(l=>l.name))===J(["Quick","Slow cooker"]));
  W.writes.length=0;
  ok("↑ at the top does nothing", W.run("kitLabMove('"+id2+"',-1)")===false&&W.writes.length===0);
  ok("kitTagLabel knows a label's words", W.run("kitTagLabel('"+id+"')")==="Slow cooker"&&W.run("kitTagLabel('gf')")==="Gluten-free");
}

console.log("\n── delete a family label: the count in the question, the id off each recipe ──");
{ const W=world({meals:M()});
  const id=W.run("kitLabAdd('Quick','')");
  W.run("kitMeals.m1.tags.push('"+id+"'); kitMeals.m6.tags=['"+id+"']; kitLabFiltToggle('lib','"+id+"'); kitLabFiltToggle('pick','"+id+"')");
  ok("the count is right", W.run("kitLabCount('"+id+"')")===2);
  W.writes.length=0;
  ok("delete goes through", W.run("kitLabDelete('"+id+"')")===true);
  ok("the question names the 2 recipes", /Delete the label "Quick"\? It comes off the 2 recipes that have it\./.test(W.confirms[0]), W.confirms);
  ok("ONE multi-path update: the label gone, each recipe's tags rewritten (a now-empty list → null)", J(W.upd())===J([{"kitchen/meals/m1/tags":["gf","kid"],"kitchen/meals/m6/tags":null,["kitchen/labels/"+id]:null}]), W.writes);
  ok("the device copy follows", J(W.run("kitMeals.m1.tags"))===J(["gf","kid"])&&W.run("'tags' in kitMeals.m6")===false&&W.run("Object.keys(kitLabels).length")===0&&W.lsSaves===1);
  ok("the deleted id leaves both filters", W.run("kitLabFiltGet('lib').length+kitLabFiltGet('pick').length")===0);
  const W2=world({meals:M(),answer:()=>false}); const id2=W2.run("kitLabAdd('Quick','')"); W2.writes.length=0;
  ok("Cancel on the question → nothing changes", W2.run("kitLabDelete('"+id2+"')")===false&&W2.writes.length===0&&W2.run("Object.keys(kitLabels).length")===1);
  const W3=world({meals:M()}); const id3=W3.run("kitLabAdd('Lonely','')"); W3.writes.length=0; W3.run("kitLabDelete('"+id3+"')");
  ok("no recipes carry it → the question has no count, only the label path is written", W3.confirms[0]==='Delete the label "Lonely"?'&&J(W3.upd())===J([{["kitchen/labels/"+id3]:null}]), W3.confirms);
}

console.log("\n── a built-in off the list: hidden flag, chips gone, strip or keep, restore ──");
{ const W=world({meals:M()});   // Yes to both questions
  ok("hide writes the flag and strips the recipes that had it", W.run("kitLabHide('side')")===true&&J(W.upd())===J([{"kitchen/labels/hidden/side":true,"kitchen/meals/m2/tags":["gf"]}]), W.writes);
  ok("the second question carries the count", /Also take it off the 1 recipe that has it\?/.test(W.confirms[1]), W.confirms);
  ok("the chip is off the editor, the library filter and the picker", !W.editorChips([]).includes("Side dish")&&!W.lib().includes("kitLibTagSet('side')")&&!W.pick().includes("kitRotPickTag('side')"));
  ok("…and off the recipe view", !W.run("kitRecipeExtrasHTML({tags:['side','gf']})").includes("Side dish"));
  ok("the Labels card lists it under Restore", /Built-ins you took off: .*Side dish.*kitLabUi\('restore','side'\)/.test(W.lib()));
  ok("the KIT_TAGS constant is untouched", W.run("KIT_TAGS.length")===6);
  W.writes.length=0;
  ok("restore removes the flag, nothing else", W.run("kitLabRestore('side')")===true&&J(W.writes)===J([["remove","kitchen/labels/hidden/side"]])&&W.editorChips([]).includes("Side dish"));
  ok("hiding twice / restoring twice is a no-op", W.run("kitLabRestore('side')")===false&&W.run("kitLabHide('nope')")===false);
}
{ const W=world({meals:M(),answer:(m,n)=>n===1});   // Yes take it off, No leave the recipes
  W.run("kitLabHide('batch')");
  ok("No → only the hidden flag is written, the recipes keep the tag", J(W.upd())===J([{"kitchen/labels/hidden/batch":true}])&&J(W.run("kitMeals.m4.tags"))===J(["batch"]), W.writes);
  ok("Prep's 🫙 Batch & make-ahead still lists them", J(W.run("prepBatch()"))===J(["m4","m5","m8"]));
  ok("the editor hides the chip but a save keeps the id on the recipe", (()=>{ W.els["kit-name"]={value:"Chili"}; W.run("kitEditId='m4'; kitEditDraft={name:'Chili',tags:['batch']}; kitSaveMeal()"); const w=W.writes.find(x=>x[1]==="kitchen/meals/m4"); return !W.editorChips(["batch"]).includes("Batch")&&J(W.run("kitMeals.m4.tags"))===J(["batch"])&&w&&J(w[2].tags)===J(["batch"]); })());
  W.run("kitLabHide('side')");
  ok("a hidden side tag still narrows the sides picker", J(W.run("kitSideLibPick()"))===J(["m2"]));
  ok("…and Cancel on the first question hides nothing", (()=>{ const X=world({meals:M(),answer:()=>false}); return X.run("kitLabHide('gf')")===false&&X.writes.length===0&&X.editorChips([]).includes("Gluten-free"); })());
}

console.log("\n── the editor: toggle a label, ＋ new label, an unknown id never written ──");
{ const W=world({meals:M()});
  const id=W.run("kitLabAdd('Kids love it','💛')");
  ok("the family label is a chip in the editor, after the built-ins", (()=>{ const h=W.editorChips([]); return h.indexOf("Side dish")<h.indexOf("💛 Kids love it")&&h.includes("kitTagToggle('"+id+"')"); })());
  W.run("kitEditId='new'; kitEditDraft={name:'Mac and cheese',tags:['kid','zzz']}; kitTagToggle('"+id+"')");
  ok("tapping it turns it on in the draft", J(W.run("kitEditDraft.tags"))===J(["kid","zzz",id]));
  ok("…and the chip shows it on", W.editorChips(["kid",id]).includes("kitTagToggle('"+id+"')\" style=\"cursor:pointer;padding:3px 10px;border-radius:999px;font-size:11px;font-weight:700;border:1.5px solid #2B7A78;background:#2B7A78"));
  W.writes.length=0; W.els["kit-name"]={value:"Mac and cheese"}; W.run("kitSaveMeal()");
  const w=W.writes.find(x=>x[0]==="set"&&/^kitchen\/meals\//.test(x[1]));
  ok("the save writes built-in + label ids side by side and drops the unknown one", w&&J(w[2].tags)===J(["kid",id]), w);
  ok("the ＋ new label chip is there, closed", W.editorChips([]).includes("kitLabNewOpen(true)")&&!W.editorChips([]).includes("kit-lab-newname"));
  W.run("kitEditId='new'; kitEditDraft={name:'Stew',tags:[]}; kitLabNewOpen(true)");
  ok("open → an input in the chip row", W.editorChips([]).includes('id="kit-lab-newname"'));
  W.els["kit-lab-newname"]={value:" Sunday big cook "}; W.writes.length=0;
  W.run("kitLabNewGo()");
  const nid=W.run("Object.keys(kitLabels).find(k=>kitLabels[k].name==='Sunday big cook')");
  ok("Enter makes the label (written) and turns it on in the draft", !!nid&&W.writes.some(x=>x[1]==="kitchen/labels/"+nid)&&J(W.run("kitEditDraft.tags"))===J([nid])&&W.run("kitLabNew")===false, W.writes);
  ok("a recipe view shows the label's words, never a raw id", W.run("kitRecipeExtrasHTML({tags:['gf','"+id+"','zzz']})").includes("💛 Kids love it")&&!W.run("kitRecipeExtrasHTML({tags:['zzz']})").includes("zzz"));
  ok("kitLabTagsClean: known ids once each, a hidden built-in still known", (()=>{ W.run("kitLabHidden.df=true"); return J(W.run("kitLabTagsClean(['gf','gf','df','nope','"+id+"',7])"))===J(["gf","df",id]); })());
}

console.log("\n── filters combine (AND) — the library and the shared picker, remembered this session on this device ──");
{ const ss={}; const W=world({meals:M(),ss:ss});
  const id=W.run("kitLabAdd('Quick','')"); W.run("kitMeals.m1.tags.push('"+id+"'); kitMeals.m7.tags=['"+id+"']");
  W.run("kitLibTagSet('gf')");
  ok("one chip: gf recipes only", J(["m1","m2","m3","m4","m5","m6","m7","m8"].filter(k=>W.run("kitLibMatch(kitMeals."+k+")")))===J(["m1","m2","m3"]));
  W.run("kitLibTagSet('"+id+"')");
  ok("gf + Quick: only the recipe with both", J(["m1","m2","m3","m7"].filter(k=>W.run("kitLibMatch(kitMeals."+k+")")))===J(["m1"]));
  const h=W.lib();
  ok("both chips show active in the library row", h.includes("kitLibTagSet('gf')\" style=\"cursor:pointer;padding:3px 10px;border-radius:999px;font-size:11px;font-weight:700;border:1.5px solid #6B4C93;background:#6B4C93")&&h.includes("kitLibTagSet('"+id+"')\" style=\"cursor:pointer;padding:3px 10px;border-radius:999px;font-size:11px;font-weight:700;border:1.5px solid #6B4C93;background:#6B4C93"));
  ok("…and the label chip sits after the built-ins", h.indexOf("kitLibTagSet('side')")<h.indexOf("kitLibTagSet('"+id+"')"));
  ok("tapping gf again drops only gf", (()=>{ W.run("kitLibTagSet('gf')"); return J(W.run("kitLabFiltActive('lib')"))===J([id]); })());
  W.pick(); W.run("kitRotPickTag('batch')"); W.run("kitRotPickTag('"+id+"')");
  ok("the picker lists only what carries every picked label", J(W.pickIds())===J([])&&W.pick().includes("Nothing with that tag"));
  W.run("kitRotPickTag('batch')");
  ok("…drop batch → the Quick recipes, A–Z", J(W.pickIds())===J(["m1","m7"]));
  const p=W.pick();
  ok("the picker's chip row: built-ins in use, then the label; the picked one is lit", p.indexOf("kitRotPickTag('side')")<p.indexOf("kitRotPickTag('"+id+"')")&&p.includes("kitRotPickTag('"+id+"')\" style=\"cursor:pointer;padding:2px 9px;border-radius:999px;font-size:10.5px;font-weight:700;border:1.5px solid #6B4C93;background:#6B4C93"));
  ok("the picker never shows a built-in no recipe carries", !p.includes("kitRotPickTag('df')"));
  const W2=world({meals:M(),ss:ss,labels:{[id]:{name:"Quick",order:1}}});
  ok("the same device, same session (a reload) remembers both filters", J(W2.run("kitLabFiltActive('lib')"))===J([id])&&J(W2.run("kitLabFiltActive('pick')"))===J([id]));
  const W3=world({meals:M(),ss:{},labels:{[id]:{name:"Quick",order:1}}});
  ok("another device / a new session starts clean", W3.run("kitLabFiltActive('lib').length+kitLabFiltActive('pick').length")===0);
  const W4=world({meals:M(),ss:ss});   // the label is gone on this family (not loaded)
  ok("a remembered id nobody knows any more is ignored, not a stuck filter", W4.run("kitLabFiltActive('lib').length")===0&&W4.run("kitLibMatch(kitMeals.m2)")===true);
}

console.log("\n── group by label ──");
{ const W=world({meals:M()});
  ok("no labels → no switch", !W.lib().includes("Group by label"));
  const id=W.run("kitLabAdd('Quick','')"); W.run("kitMeals.m1.tags.push('"+id+"'); kitMeals.m7.tags=['"+id+"']");
  ok("a label → the switch, off", W.lib().includes('onchange="kitLabGroupToggle()"> Group by label')&&!W.lib().includes("checked"));
  W.run("kitLabGroupToggle()");
  ok("the switch is this device's (HA_LS)", W.ls.ha_kitlab_group==="1"&&W.renders===1);
  const h=W.lib(); const heads=(h.match(/letter-spacing:\.4px;color:#6b6560;margin:6px 0 4px">([^<]+)</g)||[]).map(x=>x.replace(/.*">/,"").slice(0,-1));
  ok("headings: built-ins in use, the family's label, then No label", J(heads)===J(["Gluten-free","Kid-friendly","Batch / make-ahead","Juice or smoothie","Side dish","Quick","No label"]), heads);
  const after=(s)=>h.slice(h.indexOf('">'+s+'</div>')); const rowsUnder=(s,t)=>{ const a=after(s); const b=t?a.indexOf('">'+t+'</div>'):a.length; return (a.slice(0,b).match(/data-kit-mid="([^"]+)"/g)||[]).map(x=>x.slice(14,-1)); };
  ok("a recipe sits under each of its labels", J(rowsUnder("Quick","No label"))===J(["Burgers","Soup"].map(n=>Object.keys(MEALS).find(k=>MEALS[k].name===n)))&&rowsUnder("Gluten-free","Kid-friendly").includes("m1"));
  ok("unlabelled last — Pancakes (Zucchini Bread's unknown id doesn't make a group, its batch tag does)", J(rowsUnder("No label"))===J(["m6"])&&rowsUnder("Batch / make-ahead","Juice or smoothie").includes("m8")&&!h.includes("zzz"));
  W.run("kitLabGroupToggle()");
  ok("off again → the plain A–Z list, no headings", W.ls.ha_kitlab_group==="0"&&!W.lib().includes("No label")&&(W.lib().match(/data-kit-mid=/g)||[]).length===8);
}

console.log("\n── the 🏷 Labels card, the PIN, dry-run, the live node ──");
{ const W=world({meals:M()});
  const id=W.run("kitLabAdd('Quick','⚡')"); W.renders=0;
  const h=W.lib();
  ok("built-ins with ✕ above the family's label with ↑ ↓ ✎ ✕", h.indexOf("kitLabUi('hide','gf')")<h.indexOf("kitLabUi('del','"+id+"')")&&h.includes("kitLabUi('up','"+id+"')")&&h.includes("kitLabUi('edit','"+id+"')"));
  ok("each row says how many recipes carry it", h.includes("Gluten-free <span style=\"font-size:10px;font-weight:700;color:#9ca3af\">built-in</span></span><span style=\"font-size:11px;color:#9ca3af;white-space:nowrap\">3 recipes")&&h.includes("⚡ Quick</span><span style=\"font-size:11px;color:#9ca3af;white-space:nowrap\">0 recipes"));
  W.els["kit-lab-name"]={value:"Crockpot"}; W.els["kit-lab-emoji"]={value:""};
  W.run("kitLabUi('add')");
  ok("the card's buttons go through the Mom PIN, then re-render", W.pins===1&&/Mom/.test(W.pinWhy)&&W.renders===1&&W.run("kitLabList().length")===2&&W.toasts[0]==="🏷 Crockpot added");
  W.run("kitLabUi('edit','"+id+"')");
  ok("✎ opens the inline editor on that row", W.lib().includes('id="kit-lab-ename" value="Quick"'));
  W.els["kit-lab-ename"]={value:"Fast"}; W.els["kit-lab-eemoji"]={value:"⚡"}; W.run("kitLabUi('save','"+id+"')");
  ok("Save renames and closes it", W.run("kitLabels['"+id+"'].name")==="Fast"&&!W.lib().includes("kit-lab-ename"));
  const K=world({meals:M(),mom:false}); K.run("kitLabUi('hide','gf')");
  ok("without Mom the PIN door opens and nothing happens", K.pins===1&&K.writes.length===0&&K.run("kitLabHidden.gf")===undefined);
  const D=world({meals:M(),dry:true}); D.run("kitLabAdd('Quick','')"); D.run("kitLabHide('gf')"); D.run("kitLabRestore('gf')");
  ok("?dryrun=1 → nothing reaches Firebase, the device copy still moves", D.writes.length===0&&D.run("kitLabList().length")===1);
  const L=world({meals:M(),labels:{hidden:{side:true,bogus:true},lx:{name:"Quick",order:2},ly:{name:"Crockpot",emoji:"🍲",order:1},junk:"no",empty:{name:"  "}}});
  ok("the live node: 'hidden' is never a label, only real built-ins hide, junk is skipped, order sorts", J(L.run("kitLabList()").map(l=>l.id))===J(["ly","lx"])&&L.run("kitLabHidden.side")===true&&L.run("'bogus' in kitLabHidden")===false&&L.run("Object.keys(kitLabels).length")===2);
}

console.log("\n── no labels and nothing hidden → byte-identical to the code without the block ──");
{ const A=world({meals:M(),base:true}), B=world({meals:M()});
  ok("the library card", A.lib()===B.lib().replace(/<div style="background:#fff;border-radius:12px;box-shadow:0 4px 20px rgba\(43,122,120,0\.13\);overflow:hidden"><div style="display:flex;align-items:center;gap:8px;padding:11px 14px;background:#6B4C93;color:#fff;font-weight:800;font-size:13px"><span>🏷<\/span> Labels[\s\S]*$/,""));
  ok("…(the only addition after it is the 🏷 Labels card)", B.lib().startsWith(A.lib())&&B.lib().slice(A.lib().length).includes("<span>🏷</span> Labels"));
  ok("the shared picker (nothing picked)", A.pick()===B.pick());
  ok("the shared picker (a built-in picked)", (()=>{ A.pick(); B.pick(); A.run("kitRotPickTag('gf')"); B.run("kitRotPickTag('gf')"); return A.pick()===B.pick()&&A.pickIds().length===3; })());
  ok("the library filter (a built-in picked)", (()=>{ A.run("kitLibTagSet('gf')"); B.run("kitLibTagSet('gf')"); return A.lib().slice(0,A.lib().indexOf("data-kit-mid"))===B.lib().slice(0,B.lib().indexOf("data-kit-mid"))&&A.run("kitLibMatch(kitMeals.m4)")===false&&B.run("kitLibMatch(kitMeals.m4)")===false; })());
  ok("the recipe view", A.run("kitRecipeExtrasHTML(kitMeals.m1)")===B.run("kitRecipeExtrasHTML(kitMeals.m1)"));
  ok("the editor's chips, plus only the ＋ new label chip", B.editorChips(["gf"])===A.editorChips(["gf"]).replace("</span></div>","</span>"+'<span onclick="kitLabNewOpen(true)" style="cursor:pointer;padding:3px 10px;border-radius:999px;font-size:11px;font-weight:700;border:1.5px dashed #9ca3af;color:#6b7280;background:#fff">＋ new label</span></div>'));
  ok("a save with only built-in ids writes the same tags as before", (()=>{ [A,B].forEach(X=>{ X.els["kit-name"]={value:"Burgers"}; X.run("kitEditId='m1'; kitEditDraft={name:'Burgers',tags:['gf','kid']}; kitSaveMeal()"); }); return J(A.writes[A.writes.length-1])===J(B.writes[B.writes.length-1]); })());
}

console.log("\n"+pass+" passed, "+fail+" failed");
process.exit(fail?1:0);
