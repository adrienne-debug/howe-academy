/*
 * Node tests — ✏️ CPCARDSEDIT, the class's card layer (DESIGN_class_platform_2026-10-28.md §6.1, §6.2, §6.5, §9, §12, §13 row 10; her
 * words 2026-10-28: the teacher "can see and change everything, but only for her class" · "super easy for her to see and edit").
 *   · where the block sits and how it is hooked (every hook one typeof-guarded line tagged 📚 CPCARDSEDIT; the chips array not edited);
 *   · Howe / DeWalt / Burris and LINCOLN (a Howe kid with Envirothon cards): every hook hands back the very object it was given, even with
 *     a full layer in memory; the real mastGetDef / mastCustomDef / mastBankEligible / envDrillSplit are byte-identical with the block;
 *   · 📚 Cards: no 🃏 Teacher cards chip; ✏️ Edit back / Use the unit's back; 🙈 Hide / ↩ Show again; bulk hide per folder (asked once, ONE
 *     multi-path update); ＋ on every folder header and ＋ Add a card here open the QUICK ADD pre-set to that place (T / F / I, the
 *     subcategory) — it saves, BLANKS, puts the cursor back, says "✓ Added …" with Undo and stays open; 📋 paste a list (the parser, the
 *     preview with ticks and the lines it couldn't read, ONE write); ✕ on every row (one tap hides, Undo, ↩); Undo (the same
 *     targeted write in reverse); ✎ / 🙈 / ＋ counts and chips; search finds her back. Counts come from the data, never typed in;
 *   · every write goes through envsWrite: the demo writes nothing; live = exactly the card's path; dry run = nothing;
 *   · the kid (demo, then live boot): the hidden card leaves the bank, the sitting, the drill, the games, ID Flash and the final's core
 *     total; the edited back shows; her added card joins the bank and the deck; read once, never written;
 *   · the rules: classCards/$cid — teacher of that class + admin, per card; the shapes the code writes pass them.
 * Uses the world from test_env_site.js (CCE = this block).                                             run: node test_cp_cards_edit.js
 */
const fs=require("fs"), path=require("path");
const {world,src,CCE,REPO}=require("./test_env_site.js");
let pass=0, fail=0;
const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  "+JSON.stringify(x).slice(0,500):"")); } };
const FAM={familyId:"envirothon",edition:"envirothon",className:"MS Science 2026-27",roster:[]};
const LIB=require(path.join(REPO,"envirothon.js"));
const CID="ms-science-2026", FT="Forestry · Terms";
function demo(role,o){ const w=world(Object.assign({fam:FAM,search:"?demo=1&role="+(role||"teacher"),lib:LIB},o||{})); w.envSiteDemoBoot(); w.renderAll(); return w; }
function open(w){ w.envcView("cpcards"); return w.G.content; }
const W=w=>w._envs.writes, last=w=>W(w)[W(w).length-1];
const card=(w,deck,name)=>w.ccs.cpcsIndex().C.find(c=>c.deck===deck&&c.name===name);
const libCard=(deck,name)=>LIB.unit.decks.find(d=>d.key===deck).cards.find(c=>c.name===name);
const list=w=>{ const M=w.ccs.cpcsIndex(); return w.ccs.cpcsListHtml(M); };
// open a card where it sits: its section, its folder (every row drawn, past the 20-row page), the card
const openCard=(w,c)=>{ w.ccs.cpcsTap("st",c.sec); if(c.kind==="id"){ w.ccs.cpcsTap("grp",c.sec+"|id"); w.ccs.cpcsTap("sp",c.g.key); } else w.ccs.cpcsTap("grp",c.g.key); w.ccs._cpcs.more[c.g.key]=1e6; w.ccs.cpcsTap("row",c.i); };
// the real engine readers from index.html, in a sandbox; hooks = the block's functions (or {} = no block at all)
const cut=(a,b)=>{ const i=src.indexOf(a); if(i<0) throw new Error("missing "+a); const j=src.indexOf(b,i); return src.slice(i,j+b.length); };
const ENG=[cut("function mastGetDef(kid,prompt,deck){","\n}\n"),cut("function mastCustomDef(kid,cat,name){","\n}\n"),cut("function mastBankEligible(kid,cat){","\n}\n"),cut("function mastFullBank(kidArg){","\n}\n"),cut("function envDrillSplit(kid,due){","\n}\n")].join("\n");
function engine(h,md,decks){ return new Function("H","masteryData","DECKS",'const cpceDef=H.cpceDef, cpceBank=H.cpceBank, cpceItems=H.cpceItems; let masteryKid="k"; const MAST_BANK_MAP={}, MAST_MATH_ANS={}, MAST_VOCAB_DEFS={};\n'+
  'function mastDefKeyOk(k){ return !/[.#$\\[\\]\\/]/.test(String(k)); } function mastDefKey(k){ return encodeURIComponent(String(k)).replace(/\\./g,"%2E"); } function envDrillDecks(){ return new Set(DECKS); }\n'+ENG+'\nreturn {mastGetDef,mastCustomDef,mastBankEligible,mastFullBank,envDrillSplit};')(h||{},md,decks||[]); }
const hooksOf=w=>({cpceDef:w.cce.cpceDef,cpceBank:w.cce.cpceBank,cpceItems:w.cce.cpceItems});
const FIX=()=>({k:[{id:"a",subject:FT,prompt:"Crown",status:"active",tier:"weekly"},{id:"b",subject:FT,prompt:"Cambium",status:"introduction",tier:"daily"},{id:"c",subject:"German",prompt:"Hund",status:"active"}],
  k_custom_items:[{cat:FT,name:"Cambium"},{cat:FT,name:"Crown"},{cat:FT,name:"Silviculture"},{cat:"German",name:"Hund",def:"dog"}],k_settings:{definitions:{Crown:"The branches, twigs, and leaves of a tree together.",Hund:"dog"}}});
// a full layer for the class: Crown hidden, Silviculture's back edited, Coppice added
const LAYER=()=>({[FT]:{o74:{name:"Crown",hide:true,by:"t1",ts:1},o201:{name:"Silviculture",def:"Growing a forest on purpose.",by:"t1",ts:2},a1:{name:"Coppice",def:"Cutting to the stump so shoots regrow.",core:true,add:true,group:"Forest Management",by:"t1",ts:3}}});

const run=async()=>{
console.log("── the block, where it sits, how it is hooked ──");
{ const a=src.indexOf("// CPCARDSEDIT_START"), b=src.indexOf("// CPCARDSEDIT_END");
  ok("one CPCARDSEDIT block, right after CPCARDSSEE_END", a>0&&b>a&&src.indexOf("// CPCARDSEDIT_START",a+1)<0&&src.slice(src.indexOf("// CPCARDSSEE_END"),a).trim()==="// CPCARDSSEE_END");
  ok("her words and the date in the header", /2026-10-28/.test(CCE.slice(0,600))&&/only for her class/.test(CCE.slice(0,600)));
  ok("the block only declares (nothing runs at boot)", CCE.split("\n").every(l=>!l.trim()||/^(\/\/|function |const |let |var | |})/.test(l)));
  const hooks=src.split("\n").filter(l=>/📚 CPCARDSEDIT/.test(l)&&(src.indexOf(l)<a||src.indexOf(l)>b));
  const want=["cpceChips","cpceIndex","cpcePass","cpceCounts","cpceCntHtml","cpceChipsHtml","cpceRowCls","cpceBackHtml","cpceActsHtml","cpceFolderHtml","cpceUndoHtml","cpceKidLoad","cpceBank","cpceDef","cpceItems","cpceHidItem","cpceFlash","cpceCoreFix","cpceHydrate"];
  ok("every hook line outside the block is typeof-guarded on a cpce function", hooks.length>=want.length&&hooks.every(l=>/typeof cpce\w+ ?=== ?"function"/.test(l)), hooks.filter(l=>!/typeof cpce\w+ ?=== ?"function"/.test(l)));
  ok("…and every hook named in the design is wired: chip, index, filters, counts, row, back, buttons, folder, undo, boot, bank, back ×2, pile, drill, games ×2, ID Flash, core total, hydrate", want.every(f=>hooks.some(l=>l.indexOf(f)>=0))&&hooks.filter(l=>/cpceDef\(/.test(l)).length===2&&hooks.filter(l=>/cpceItems\(/.test(l)).length===2&&hooks.filter(l=>/cpceHidItem\(/.test(l)).length===2);
  const at=(fn,re)=>{ const i=src.indexOf(fn), j=src.indexOf("\n}",i); return i>0&&re.test(src.slice(i,j)); };
  ok("the hooks sit in the right functions: mstPile, envDrillSplit, _matchEligible, envFlashDecks, envtCoreCount, envHydrate, mastBankEligible, mastGetDef, mastCustomDef, envClsKidLoad",
    at("function mstPile(kid, sid, pn, todayLog) {",/items = items\.filter\(Boolean\);\n  if \(typeof cpceItems === "function"\) items = cpceItems\(kid, items\);/)&&at("function envDrillSplit(kid,due){",/cpceItems\(kid,env\)/)&&at("function _matchEligible(it){",/cpceHidItem\(masteryKid,it\)/)&&
    at("function envFlashDecks(kid){",/cpceFlash\(kid,out\)/)&&at("function envtCoreCount(kid,station){",/cpceCoreFix\(kid,keys,cardsOf,ok,out\)/)&&at("function envHydrate(u,lib){",/cpceHydrate\(u\)/)&&at("function mastBankEligible(kid,cat){",/envtWaitsForCheckin\(kid,cat\)\) return \[\];[^\n]*\n  if\(typeof cpceBank/)&&
    at("function mastGetDef(kid,prompt,deck){",/^function mastGetDef\(kid,prompt,deck\)\{\n  \{ const _cc=\(typeof cpceDef/)&&at("function mastCustomDef(kid,cat,name){",/^function mastCustomDef\(kid,cat,name\)\{\n  \{ const _cc=/)&&at("function envClsKidLoad(sdb,cid){",/^function envClsKidLoad\(sdb,cid\)\{\n  if\(typeof cpceKidLoad/));
  { const i=src.indexOf("function mstPile(kid, sid, pn, todayLog) {"), P=src.slice(i,src.indexOf("\n}\n",i)), h=P.indexOf("cpceItems(kid, items)");
    ok("in mstPile the hidden cards leave `items` BEFORE anything picks from it — so CPREVIEW's sitting reviews (mstOwns → reviewIn \"sitting\") and its Reviews-a-sitting cap (cpReviewCapPile, reviewLeft) never see them", h>0&&h<P.indexOf("mstOwns(session, item, ladder)")&&h<P.indexOf("mstMixOwns(")&&(P.indexOf("cpReviewCapPile")<0||h<P.indexOf("cpReviewCapPile"))&&/items\.filter\(item =>\s*\n?\s*mstOwns/.test(P.slice(h))); }
  const lit=src.slice(src.indexOf("function envConsoleHtml(){"),src.indexOf("function envConsoleHtml(){")+3000).split("\n").find(l=>/const chips=\[\["grid"/.test(l));
  ok("the console's chips array literal is not edited (the old chip comes out from the hook)", !!lit&&lit.indexOf("cpce")<0&&lit.indexOf('["cards","\\u{1F0CF} Teacher cards"]')>0);
  const code=CCE.split("\n").filter(l=>!/^\s*\/\//.test(l)).join("\n");
  ok("every write in the block goes through envsWrite; its only Firebase call is the kid's ONE once-read of classCards/<cid>", !/\.set\(|\.update\(|\.remove\(|\bdb\.|envcWrite|envcMulti|\.push\(\{op/.test(code)&&(code.match(/\.ref\(/g)||[]).length===1&&/sdb\.ref\("classCards\/"\+cid\)\.once\("value"/.test(code)&&/envsWrite\(/.test(code));
  ok("no Howe kid name as a code literal; no 🔀; no ↶ in a string (her ↩︎ rule)", !/["'`](lincoln|ellis|lucy|julian)["'`]/i.test(CCE)&&CCE.indexOf("\u{1F500}")<0&&!/'[^'\n]*↶[^'\n]*'|"[^"\n]*↶[^"\n]*"/.test(code)); }

console.log("\n── Howe, DeWalt, Burris and Lincoln: inert, byte-identical ──");
for(const f of ["howe","dewalt","burris"]){ const w=world({fam:{familyId:f,roster:[]},lib:LIB}), c=w.cce;
  c._cpce.kid=LAYER(); c._cpce.L.c1=LAYER(); w._envs.kid="lincoln"; w._envs.role="kid"; w._envc.cid="c1";   // a full layer sitting in memory must still change nothing
  const items=FIX().k, all=["Cambium","Crown","Silviculture"], chips=[["grid","a"],["cards","b"]], out=[{key:"Forestry · ID",items:[{item:"Loblolly Pine"}]}], cnt={learned:3,total:9};
  const u={decks:[{key:FT,cards:[{name:"Silviculture",def:"x",order:201}]}]}, uj=JSON.stringify(u);
  ok(f+": every hook hands back the very object it was given (pile/drill items, bank, flash, core total, chips), the back is null, hydrate does nothing", c.cpceKidOn("lincoln")===false&&c.cpceItems("lincoln",items)===items&&c.cpceBank("lincoln",FT,all)===all&&all.length===3&&c.cpceFlash("lincoln",out)===out&&out[0].items.length===1&&
    c.cpceCoreFix("lincoln",new Set([FT]),()=>[{name:"Crown",core:true}],{},cnt)===cnt&&cnt.total===9&&cnt.learned===3&&c.cpceDef("lincoln","Silviculture",FT)===null&&c.cpceDef("lincoln","Silviculture")===null&&c.cpceHidItem("lincoln",items[0])===false&&c.cpceHydrate(u)===false&&JSON.stringify(u)===uj&&c.cpceChips(chips)===chips&&chips.length===2);
  ok(f+": no console either (no page parts, no start, no write), and the boot load reads nothing", c.cpceOn()===false&&c.cpceStart()===false&&c.cpceUndoHtml()===""&&c.cpceChipsHtml()===""&&c.cpceActsHtml({i:0})===""&&c.cpceRowCls({})===""&&c.cpceKidLoad(w.firebase.database(),"c1")===false&&(c.cpceHide(0),c.cpceUndo(),true)&&w.G.reads.length===0&&w.G.listeners.length===0&&w.G.writes.length===0&&w._envs.writes.length===0); }
{ const h=world({fam:{familyId:"howe",roster:[]},lib:LIB}); h.cce._cpce.kid=LAYER(); h._envs.kid="lincoln"; h._envs.role="kid";
  const snap=E=>{ const due=[{subject:FT,prompt:"Crown",status:"active"},{subject:FT,prompt:"Cambium",status:"introduction"},{subject:"German",prompt:"Hund"}];
    return JSON.stringify([E.mastGetDef("k","Silviculture",FT),E.mastGetDef("k","Crown",FT),E.mastGetDef("k","Hund","German"),E.mastCustomDef("k",FT,"Silviculture"),E.mastCustomDef("k","German","Hund"),E.mastBankEligible("k",FT),E.mastBankEligible("k","German"),E.mastFullBank("k"),E.envDrillSplit("k",due),due]); };
  const none=snap(engine({},FIX(),[FT])), howe=snap(engine(hooksOf(h),FIX(),[FT]));
  ok("Lincoln (a Howe kid with Envirothon cards, a full class layer in memory): the real mastGetDef / mastCustomDef / mastBankEligible / envDrillSplit give byte-for-byte what they give with no block at all", none===howe&&/Crown/.test(none)&&/Silviculture/.test(none), [none.slice(0,200),howe.slice(0,200)]);
  const k=h.masteryData; k.lincoln=FIX().k; const before=JSON.stringify(k);
  ok("…and nothing of his is touched: his items, his bank and his records stay as they were", h.cce.cpceItems("lincoln",k.lincoln)===k.lincoln&&JSON.stringify(k)===before); }

console.log("\n── 📚 Cards: the old chip is gone, the editor is here ──");
{ const w=demo("teacher"), a=demo("admin");
  const chipRow=x=>(x.match(/<div class="envs-chips">([\s\S]*?)<\/div>/)||["",""])[1];
  ok("teacher and Adrienne: no 🃏 Teacher cards chip any more; 📚 Cards is there", !/Teacher cards/.test(chipRow(w.G.content))&&/📚 Cards/.test(chipRow(w.G.content))&&!/Teacher cards/.test(chipRow(a.G.content))&&/📚 Cards/.test(chipRow(a.G.content)));
  const h=open(w);
  ok("the search row has ↩︎ Undo (greyed until there is something to undo)", /id="cpce-undo"[^>]*disabled/.test(h)&&/>↩︎<\/button>/.test(h));
  ok("a clean class: no ✎ / 🙈 / ＋ chips, no counts", !/✎ Edited|🙈 Hidden|＋ Added/.test(w.ccs.cpcsChipsHtml())&&!/🙈 |✎ |＋ /.test(list(w)));
  const c=card(w,FT,"Crown"), L=libCard(FT,"Crown"); openCard(w,c);
  const d=list(w);
  ok("an opened card: ✏️ Edit back and 🙈 Hide for my class", /cpceEditOpen\(\d+\)">✏️ Edit back/.test(d)&&/cpceHide\(\d+\)">🙈 Hide for my class/.test(d));
  ok("an open Key Concept: ＋ Add a card here at its end, and its bulk hide on top (counted from the data)", (()=>{ const g=c.g.cards, non=g.filter(x=>!x.core).length; return /cpceQaOpen\('[^']+','end'\)">＋ Add a card here/.test(d)&&new RegExp("Hide all "+g.length.toLocaleString("en-US")+"<").test(d)&&(non&&non<g.length?new RegExp("Hide the "+non.toLocaleString("en-US")+" non-core").test(d):true); })()); }

console.log("\n── 🙈 Hide / ↩ Show again ──");
{ const w=demo("teacher"); open(w); const c=card(w,FT,"Crown"), L=libCard(FT,"Crown");
  openCard(w,c); w.cce.cpceHide(c.i);
  const x=last(w);
  ok("Hide: ONE set of classCards/<cid>/<deck>/o<order> = {name, hide, by, ts} — the front rides along so a kid's app needs no card file", W(w).length===1&&x.op==="set"&&x.path==="classCards/"+CID+"/"+FT+"/o"+L.order&&x.val.name==="Crown"&&x.val.hide===true&&x.val.by==="uid_teacher_demo"&&typeof x.val.ts==="number"&&Object.keys(x.val).length===4, x);
  ok("…the demo writes nothing to Firebase (the 'would write' toast only)", w.G.writes.length===0&&/demo: would set classCards/.test((w.G.created.find(e=>e.id==="envs-toast")||{}).textContent||""));
  const d=list(w), M=w.ccs.cpcsIndex(), sec=M.secs.find(s=>s.id==="forestry");
  ok("the row stays, greyed and struck through; it offers ↩ Show again and says what hiding does", new RegExp('class="cpcs-row open cpce-hid" id="cpcs-r-'+c.i+'"').test(d)&&/cpceShow\(\d+\)">↩ Show again/.test(d)&&/won’t get it, and it doesn’t count toward the final/.test(d)&&!/cpceEditOpen/.test(d));
  ok("🙈 1 on the Key Concept's header and the station's; the 🙈 Hidden chip appears", /🙈 1<\/span>/.test(d)&&/🙈 Hidden/.test(w.ccs.cpcsChipsHtml())&&w.ccs.cpcsCounts(sec.cards).hid===1);
  ok("the 🙈 Hidden chip narrows the list to her hidden cards", (w.ccs.cpcsTap("f","hidden"),w.ccs.cpcsIndex().C.filter(x=>w.ccs.cpcsPass(x,w.ccs.cpcsIndex())).length===1));
  w.ccs.cpcsTap("f","hidden");
  ok("a note with Undo shows", (()=>{ const n=w.G.created.find(e=>e.id==="cpce-note"); return n&&/Hidden for your class/.test(n.innerHTML)&&/cpceUndo\(\)/.test(n.innerHTML); })());
  w.cce.cpceShow(c.i);
  ok("↩ Show again: ONE remove of the same path (nothing of hers is left on that card)", last(w).op==="remove"&&last(w).path==="classCards/"+CID+"/"+FT+"/o"+L.order&&!w.cce.cpceSt(c).hid&&!/cpce-hid/.test(list(w))); }

console.log("\n── ✏️ Edit back · Use the unit's back ──");
{ const w=demo("teacher"); open(w); const c=card(w,FT,"Silviculture"), L=libCard(FT,"Silviculture");
  openCard(w,c); w.cce.cpceEditOpen(c.i);
  let d=list(w);
  ok("Edit opens a box with the back in it, Save and Cancel; the front can't be edited", /<textarea id="cpce-def"[^>]*>/.test(d)&&d.indexOf(L.def.slice(0,30).replace(/&/g,"&amp;"))>0&&/cpceEditSave\(\d+\)">Save/.test(d)&&/cpceEditCancel\(\)">Cancel/.test(d)&&/The front stays as it is/.test(d)&&!/id="cpce-front"/.test(d));
  w.el("cpce-def","   "); w.cce.cpceEditSave(c.i); ok("an empty back is refused: nothing written", W(w).length===0);
  w.el("cpce-def",L.def); w.cce.cpceEditSave(c.i); ok("saving the unit's own back unchanged writes nothing (there is nothing of hers to remove)", W(w).length===0&&!w.cce.cpceSt(c).ed);
  w.cce.cpceEditOpen(c.i); w.el("cpce-def","  Growing a forest on purpose.  "); w.cce.cpceEditSave(c.i);
  const x=last(w);
  ok("Save: ONE set of …/o<order> = {name, def, by, ts}, trimmed", x.op==="set"&&x.path==="classCards/"+CID+"/"+FT+"/o"+L.order&&x.val.def==="Growing a forest on purpose."&&x.val.name==="Silviculture"&&!("hide" in x.val), x);
  d=list(w);
  ok("the card shows her back with the unit's under it, struck; ✎ on the row and the header; the ✎ Edited chip", /Growing a forest on purpose\./.test(d)&&/Unit’s back: <s>/.test(d)&&/cpce-ed/.test(d)&&/✎ 1<\/span>/.test(d)&&/✎ Edited/.test(w.ccs.cpcsChipsHtml()));
  ok("search finds her back", (w.ccs._cpcs.q="on purpose",w.ccs.cpcsIndex().C.filter(x=>w.ccs.cpcsPass(x,w.ccs.cpcsIndex())).some(x=>x.i===c.i)));
  w.ccs._cpcs.q="";
  w.cce.cpceHide(c.i);
  ok("hiding an edited card keeps her back on the record (one set: name, hide, def)", last(w).op==="set"&&last(w).val.hide===true&&last(w).val.def==="Growing a forest on purpose.");
  w.cce.cpceShow(c.i); w.cce.cpceEditOpen(c.i); d=list(w);
  ok("an edited card's box offers Use the unit's back", /cpceUseUnit\(\d+\)">Use the unit’s back/.test(d));
  w.cce.cpceUseUnit(c.i);
  ok("Use the unit's back: ONE remove of that path; the unit's back shows again", last(w).op==="remove"&&last(w).path==="classCards/"+CID+"/"+FT+"/o"+L.order&&!w.cce.cpceSt(c).ed&&!/Unit’s back:/.test(list(w))); }

console.log("\n── Undo: the same targeted write in reverse, again and again ──");
{ const w=demo("teacher"); open(w); const a=card(w,FT,"Crown"), b=card(w,FT,"Silviculture"), p="classCards/"+CID+"/"+FT+"/";
  w.cce.cpceHide(a.i); w.cce.cpceEditOpen(b.i); w.el("cpce-def","Mine."); w.cce.cpceEditSave(b.i); w.cce.cpceHide(b.i);
  ok("three changes, three writes; ↩︎ Undo is live", W(w).length===3&&w.cce._cpce.undo.length===3&&/id="cpce-undo"(?![^>]*disabled)/.test(w.cce.cpceUndoHtml()));
  w.cce.cpceUndo(); let x=last(w);
  ok("Undo 1: Silviculture back to {name, def} (no hide), re-stamped with her uid for the rules", x.op==="set"&&x.path===p+"o"+b.o&&x.val.def==="Mine."&&!x.val.hide&&x.val.by==="uid_teacher_demo"&&w.cce.cpceSt(b).ed&&!w.cce.cpceSt(b).hid);
  w.cce.cpceUndo(); x=last(w); ok("Undo 2: Silviculture's record removed (it had none)", x.op==="remove"&&x.path===p+"o"+b.o&&!w.cce.cpceSt(b).ed);
  w.cce.cpceUndo(); x=last(w); ok("Undo 3: Crown shown again", x.op==="remove"&&x.path===p+"o"+a.o&&!w.cce.cpceSt(a).hid);
  const n=W(w).length; w.cce.cpceUndo(); ok("nothing left to undo: no write; ↩︎ greyed", W(w).length===n&&/disabled/.test(w.cce.cpceUndoHtml()));
  ok("an undo is not itself undoable (the stack only shrinks)", w.cce._cpce.undo.length===0); }

console.log("\n── bulk hide per folder: asked once, ONE multi-path update, undoable ──");
{ const w=demo("teacher"); open(w); const M=w.ccs.cpcsIndex(), sec=M.secs.find(s=>s.id==="forestry");
  const g=sec.groups.find(x=>{ const n=x.cards.filter(c=>!c.core).length; return n>1&&n<x.cards.length; }), non=g.cards.filter(c=>!c.core);
  w.ccs.cpcsTap("st","forestry"); w.ccs.cpcsTap("grp",g.key);
  w.cce.cpceBulk(g.key,"noncore"); let d=list(w);
  ok("🙈 Hide the N non-core asks first, inline (N from the data), and writes nothing yet", new RegExp("Hide "+non.length.toLocaleString("en-US")+" cards for your class\\?").test(d)&&/Yes, hide them/.test(d)&&W(w).length===0);
  w.cce.cpceBulk(g.key,"noncore",true); const x=last(w);
  ok("Yes: ONE update of classCards/<cid> naming each non-core card of the folder, every one {name, hide, by, ts}", W(w).length===1&&x.op==="update"&&x.path==="classCards/"+CID&&Object.keys(x.val).length===non.length&&non.every(c=>{ const r=x.val[c.deck+"/o"+c.o]; return r&&r.hide===true&&r.name===c.name&&r.by==="uid_teacher_demo"; }), [Object.keys(x.val).length,non.length]);
  d=list(w);
  ok("the folder now counts 🙈 N and offers ↩ Show all N again; Hide the non-core is gone", new RegExp("🙈 "+non.length.toLocaleString("en-US")+"</span>").test(d)&&new RegExp("Show all "+non.length.toLocaleString("en-US")+" again").test(d)&&!/Hide the [\d,]+ non-core/.test(d));
  w.cce.cpceUndo(); const u=last(w);
  ok("Undo: ONE update of the same paths, every one null (removed)", u.op==="update"&&u.path==="classCards/"+CID&&Object.keys(u.val).length===non.length&&Object.values(u.val).every(v=>v===null)&&!g.cards.some(c=>w.cce.cpceSt(c).hid));
  w.cce.cpceBulk(g.key,"all",true); const all=last(w);
  ok("🙈 Hide all N: one update with every card of the folder", all.op==="update"&&Object.keys(all.val).length===g.cards.length);
  w.cce.cpceBulk(g.key,"show",true); const sh=last(w);
  ok("↩ Show all N again: one update, every record removed", sh.op==="update"&&Object.keys(sh.val).length===g.cards.length&&Object.values(sh.val).every(v=>v===null)); }

console.log("\n── ＋ quick add: stays open, blanks, says it's done (her words 2026-10-28) ──");
{ const w=demo("teacher"); open(w); const M=w.ccs.cpcsIndex(), sec=M.secs.find(s=>s.id==="forestry"), D=w.cce.cpceDecks("forestry"), g=sec.groups.find(x=>x.cards.some(c=>c.deck===D.term));
  let focused=""; const fe=w.el("cpce-af",""), be=w.el("cpce-ab",""), ce=w.el("cpce-ac"); fe.focus=()=>{ focused="af"; }; be.focus=()=>{ focused="ab"; };
  w.cce.cpceQaOpen(g.key); let d=list(w);
  ok("＋ on a Key Concept opens the quick add on top of that folder (it opens the folder), pre-set: T, that Key Concept, the section's Terms deck", w.cce._cpce.qa.kind==="term"&&w.cce._cpce.qa.sub===g.label&&w.ccs._cpcs.os==="forestry"&&w.ccs._cpcs.og===g.key&&/id="cpce-qa"/.test(d)&&d.indexOf('id="cpce-qa"')<d.indexOf('class="cpcs-row')&&new RegExp("Goes into "+D.term.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")).test(d)&&focused==="af");
  ok("…T / F / I for the decks the section has, the Key Concept dropdown listing that deck's others, front, back, ⭐ Core, ＋ Add, 📋 Paste a list", /<b>T<\/b> Terms/.test(d)&&/<b>F<\/b> Facts/.test(d)&&/<b>I<\/b> ID/.test(d)&&/<select id="cpce-qs"/.test(d)&&(d.match(/<option /g)||[]).length===sec.groups.filter(x=>x.cards.some(c=>c.deck===D.term)).length&&new RegExp('<option value="'+g.label+'" selected').test(d)&&/id="cpce-af"/.test(d)&&/id="cpce-ab"/.test(d)&&/⭐ Core for my class/.test(d)&&/cpceQaAdd\(\)">＋ Add/.test(d)&&/Paste a list/.test(d));
  const add=(f,b)=>{ fe.value=f; be.value=b; return w.cce.cpceQaAdd(); };
  add("Bad.name","x"); add("a/b","x"); add("crown","x"); add("","x"); add("Coppice","");
  ok("refused, nothing written: a front with . or /, one already in the deck (any case), an empty front, an empty back", W(w).length===0);
  ce.checked=true; focused=""; add("Coppice","Cutting a tree to the stump so new shoots grow.");
  const x=last(w), k=x&&x.path.split("/").pop();
  ok("＋ Add: ONE set of classCards/<cid>/<Terms deck>/a… = {name, def, core, add, group, by, ts}", W(w).length===1&&x.op==="set"&&x.path==="classCards/"+CID+"/"+D.term+"/"+k&&/^a[0-9a-z]+$/.test(k)&&x.val.name==="Coppice"&&x.val.core===true&&x.val.add===true&&x.val.group===g.label&&x.val.by==="uid_teacher_demo"&&!("item" in x.val), x);
  const note=()=>(w.G.created.find(e=>e.id==="cpce-note")||{}).innerHTML||"";
  ok("…the fields BLANK OUT, the cursor goes back to the front, the panel stays open", fe.value===""&&be.value===""&&w.cce._cpce.qa&&w.cce._cpce.qa.f===""&&w.cce._cpce.qa.b===""&&focused==="af"&&/id="cpce-qa"/.test(list(w)));
  ok("…the note at the bottom: ✓ Added “Coppice” to <deck>, with Undo", note().indexOf("✓ Added “Coppice” to "+D.term)>=0&&/cpceUndo\(\)/.test(note()), note());
  ok("…⭐ Core stays ticked for the next one", w.cce._cpce.qa.core===true&&/id="cpce-ac" checked/.test(list(w)));
  const N=w.ccs.cpcsIndex(), nc=N.C.find(c=>c.added&&c.name==="Coppice");
  ok("…it joins the folder at its end (index +1), ⭐, ＋ on the row and the header", nc&&N.C.length===M.C.length+1&&nc.g===N.secs.find(s=>s.id==="forestry").groups.find(y=>y.label===g.label)&&nc.g.cards[nc.g.cards.length-1]===nc&&nc.core&&/cpce-add/.test((w.ccs._cpcs.more[nc.g.key]=1e6,list(w)))&&/＋ 1<\/span>/.test(list(w)));
  add("Our class term one","A back she typed."); add("Our class term two","Another back she typed.");
  ok("…and more and more: each its own set, the panel still open", W(w).length===3&&W(w).every(z=>z.op==="set"&&z.val.add===true)&&/id="cpce-qa"/.test(list(w)));
  w.cce.cpceUndo(); ok("Undo on the note takes the last one back (its record removed)", last(w).op==="remove"&&!w.ccs.cpcsIndex().C.some(c=>c.name==="Our class term two"));
  // Enter: in the front → the back; in the back → Add (Shift+Enter is a new line)
  let pd=0; const ev=(k,sh)=>({key:k,shiftKey:!!sh,preventDefault(){ pd++; }});
  fe.value="Our class term three"; be.value=""; focused=""; ok("Enter in the front moves to the back, adds nothing", w.cce.cpceQaKey(ev("Enter"),"f")===false&&focused==="ab"&&pd===1&&W(w).length===4);
  be.value="A third back."; ok("Shift+Enter in the back is a new line (no add)", w.cce.cpceQaKey(ev("Enter",true),"b")===true&&W(w).length===4);
  w.cce.cpceQaKey(ev("Enter"),"b"); ok("Enter in the back adds it, then blanks", last(w).val&&last(w).val.name==="Our class term three"&&fe.value===""&&be.value==="");
  ok("a letter key does nothing special", w.cce.cpceQaKey(ev("a"),"f")===true);
  w.cce.cpceQaKind("fact"); d=list(w);
  ok("tap F: the section's Facts deck, its Key Concepts, the same subcategory kept when it has facts", w.cce._cpce.qa.kind==="fact"&&new RegExp("Goes into "+D.fact.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")).test(d)&&/<b>F<\/b> Facts/.test(d));
  fe.value="Which tree is NC's state tree?"; be.value="Longleaf pine"; w.cce.cpceQaAdd(); ok("…a fact goes into the Facts deck", last(w).path.indexOf("classCards/"+CID+"/"+D.fact+"/a")===0&&last(w).val.group===w.cce._cpce.qa.sub);
  w.cce.cpceQaOpen(g.key); ok("＋ again on the same folder closes the panel", w.cce._cpce.qa===null&&!/id="cpce-qa"/.test(list(w))); }

console.log("\n── ＋ on every header: station, ID, item — the place pre-set ──");
{ const w=demo("teacher"); open(w); const M=w.ccs.cpcsIndex();
  w.ccs.cpcsTap("st","forestry"); w.ccs.cpcsTap("grp","forestry|id"); const d0=list(w);
  ok("a ＋ on every folder header drawn: the stations, the open station's Key Concepts and ID folder, its items", (d0.match(/class="cpce-plus/g)||[]).length===M.secs.length+M.secs.find(s=>s.id==="forestry").groups.length+1+M.secs.find(s=>s.id==="forestry").items.length&&/cpceQaOpen\('forestry'\)/.test(d0)&&/cpceQaOpen\('forestry\|id'\)/.test(d0));
  ok("no ＋ while searching (the list is flat)", (w.ccs._cpcs.q="pine",!/cpce-plus/.test(list(w))));
  w.ccs._cpcs.q="";
  const gen=M.secs.find(s=>s.id==="general"), GD=w.cce.cpceDecks("general");
  w.cce.cpceQaOpen("general"); let d=list(w), Q=w.cce._cpce.qa;
  ok("＋ on a station (General): opens it; T / F only (no ID deck there); its first Key Concept with terms", Q.sec==="general"&&Q.kind==="term"&&w.ccs._cpcs.os==="general"&&w.ccs._cpcs.og===null&&/<b>T<\/b> Terms/.test(d)&&/<b>F<\/b> Facts/.test(d)&&!/<b>I<\/b> ID/.test(d)&&Q.sub===gen.groups.find(x=>x.cards.some(c=>c.deck===GD.term)).label&&!GD.id);
  const fo=M.secs.find(s=>s.id==="forestry"), it=fo.items[2];
  w.cce.cpceQaOpen(it.key); d=list(w); Q=w.cce._cpce.qa;
  ok("＋ on an item: I picked, that item in the dropdown (all the section's items listed), its folders opened", Q.kind==="id"&&Q.sub===it.label&&w.ccs._cpcs.og==="forestry|id"&&w.ccs._cpcs.osp===it.key&&(d.match(/<option /g)||[]).length===fo.items.length&&new RegExp("after “"+it.label).test(d));
  const fe=w.el("cpce-af","nest"), be=w.el("cpce-ab","A stick platform."); w.cce.cpceQaAdd(); const y=last(w);
  ok("…its card goes into the section's ID deck as “<item> · nest”, with item (no group)", y.op==="set"&&y.path.indexOf("classCards/"+CID+"/"+w.cce.cpceDecks("forestry").id+"/a")===0&&y.val.name===it.label+" · nest"&&y.val.item===it.label&&!("group" in y.val), y);
  w.cce.cpceQaOpen("forestry|id"); Q=w.cce._cpce.qa; ok("＋ on the ID folder: I, the first item", Q.kind==="id"&&Q.sub===fo.items[0].label);
  w.cce.cpceQaSub(fo.items[5].label); ok("picking another item from the dropdown", w.cce._cpce.qa.sub===fo.items[5].label);
  const g=fo.groups[0]; w.cce.cpceQaOpen(g.key,"end"); d=list(w);
  ok("＋ Add a card here at a folder's end opens the same quick add THERE (after the rows)", w.cce._cpce.qa.where==="end"&&d.indexOf('id="cpce-qa"')>d.lastIndexOf('class="cpcs-row'));
  ok("typing survives a repaint (a tap elsewhere redraws the list)", (w.cce.cpceQaIn("f","Half-typed"),/value="Half-typed"/.test(list(w))));
  w.envcView("grid"); ok("moving to another chip closes the quick add", w.cce._cpce.qa===null); }

console.log("\n── ✕ on every row: one tap hides it, Undo, ↩ brings it back ──");
{ const w=demo("teacher"); open(w); const c=card(w,FT,"Crown"), L=libCard(FT,"Crown");
  w.ccs.cpcsTap("st","forestry"); w.ccs.cpcsTap("grp",c.g.key); w.ccs._cpcs.more[c.g.key]=1e6; let d=list(w);
  const rows=(d.match(/class="cpcs-row/g)||[]).length;
  ok("every row has ✕ without opening the card (a 44 px button beside the row, not inside it)", rows>20&&(d.match(/class="cpce-x"/g)||[]).length===rows&&new RegExp('</button><button class="cpce-x" onclick="cpceHide\\('+c.i+'\\)"').test(d)&&!/<button class="cpcs-rb"[^>]*>[^]*?<button class="cpce-x"[^]*?<\/span><\/button>/.test(d.slice(0,d.indexOf('cpce-x'))));
  ok("…search results have it too", (w.ccs._cpcs.q="Crown",/class="cpce-x"/.test(list(w))));
  w.ccs._cpcs.q="";
  w.cce.cpceHide(c.i); d=list(w);
  ok("✕: ONE set …/o<order> {name, hide, by, ts}; the card did not open", last(w).op==="set"&&last(w).path==="classCards/"+CID+"/"+FT+"/o"+L.order&&last(w).val.hide===true&&w.ccs._cpcs.or===null);
  ok("…the row greyed with ↩ in place of ✕; the note says so with Undo; the 🙈 Hidden chip lists it", new RegExp('cpce-hid" id="cpcs-r-'+c.i+'"').test(d)&&new RegExp('class="cpce-x back" onclick="cpceShow\\('+c.i+'\\)"[^>]*>↩<').test(d)&&/Hidden for your class/.test((w.G.created.find(e=>e.id==="cpce-note")||{}).innerHTML)&&(w.ccs.cpcsTap("f","hidden"),w.ccs.cpcsIndex().C.filter(x=>w.ccs.cpcsPass(x,w.ccs.cpcsIndex())).map(x=>x.i).join()===String(c.i)));
  w.ccs.cpcsTap("f","hidden"); w.ccs._cpcs.more[c.g.key]=1e6;
  w.cce.cpceUndo(); ok("Undo: the record removed, ✕ is back", last(w).op==="remove"&&!w.cce.cpceSt(c).hid&&new RegExp('class="cpce-x" onclick="cpceHide\\('+c.i+'\\)"').test(list(w)));
  w.cce.cpceHide(c.i); w.cce.cpceShow(c.i); ok("✕ then ↩: hidden, then shown again (remove)", last(w).op==="remove"&&!w.cce.cpceSt(c).hid);
  const h=world({fam:{familyId:"howe",roster:[]}}); ok("Howe: no ✕, no ＋", h.cce.cpceRowX(c)===""&&h.cce.cpceFoldX(1,"forestry",true)===null); }

console.log("\n── 📋 paste a list: the parser (pure) ──");
{ const P=world({fam:FAM}).cce.cpcePasteParse;
  const r=P("Biosphere — All the parts of the Earth where life exists\nCanopy: The upper layer of a forest\nHumus\tDark organic matter in soil\n\n• Riffle – A shallow, fast stretch of a stream\n2. Snag - A standing dead tree\nno separator here\n — no front\nOnly a front:\r\nRatio: 2:1 mix");
  ok("Term — definition · Term: definition · Term<Tab>definition · bullets and numbers dropped · en dash and spaced hyphen", JSON.stringify(r.rows.map(x=>[x.n,x.front,x.back]))===JSON.stringify([[1,"Biosphere","All the parts of the Earth where life exists"],[2,"Canopy","The upper layer of a forest"],[3,"Humus","Dark organic matter in soil"],[5,"Riffle","A shallow, fast stretch of a stream"],[6,"Snag","A standing dead tree"],[10,"Ratio","2:1 mix"]]), r.rows);
  ok("…blank lines skipped; the lines it couldn't read listed with their line numbers (no separator, no front, no back)", JSON.stringify(r.bad.map(x=>x.n))==="[7,8,9]"&&r.bad[0].line==="no separator here", r.bad);
  ok("the first separator wins (a dash before a colon keeps the colon in the back); a hyphen inside a word doesn't split", (()=>{ const a=P("pH — 7: neutral\nMid-story tree: one under the canopy").rows; return a[0].front==="pH"&&a[0].back==="7: neutral"&&a[1].front==="Mid-story tree"&&a[1].back==="one under the canopy"; })());
  ok("nothing pasted: nothing", JSON.stringify(P(""))==='{"rows":[],"bad":[]}'&&JSON.stringify(P(null))==='{"rows":[],"bad":[]}'); }

console.log("\n── 📋 paste a list: preview, ticks, ONE write ──");
{ const w=demo("teacher"); open(w); const D=w.cce.cpceDecks("general"), gen=w.ccs.cpcsIndex().secs.find(s=>s.id==="general"), g=gen.groups.find(x=>x.cards.some(c=>c.deck===D.term));
  const have=gen.cards.find(c=>c.deck===D.term).name;
  w.cce.cpceQaOpen(g.key); w.cce.cpceQaPaste(true); let d=list(w);
  ok("📋 Paste a list swaps the fields for one big box with the formats it reads, Preview and One at a time", /id="cpce-pt"/.test(d)&&!/id="cpce-af"/.test(d)&&/Term — definition · Term: definition · or a tab between/.test(d)&&/cpceQaPreview\(\)">Preview/.test(d)&&/One at a time/.test(d));
  const pt=w.el("cpce-pt","Ecotone — Where two ecosystems meet\nBiome: A large area with its own climate and life\n"+have.toUpperCase()+" — already there\nBad.front — x\nnothing to split\nEcotone: twice in the list"); w.cce.cpceQaPreview(); d=list(w);
  const P=w.cce._cpce.qa.prev;
  ok("Preview: a tick per line it read; a front already in the deck, a bad front or a repeat shown unticked with why; the line it couldn't read listed", P.rows.length===5&&P.rows.filter(r=>r.on).length===2&&/already in this deck/.test(P.rows[2].why)&&/can’t contain/.test(P.rows[3].why)&&/already in this deck/.test(P.rows[4].why)&&P.bad.length===1&&/Line 5: “nothing to split”/.test(d)&&/cpceQaAddList\(\)">＋ Add 2 ticked/.test(d)&&(d.match(/type="checkbox" disabled/g)||[]).length===3, P.rows.map(r=>r.why));
  w.cce.cpceQaTick(1,false); ok("untick one: Add 1 ticked; a refused line can't be ticked", /＋ Add 1 ticked/.test(list(w))&&(w.cce.cpceQaTick(2,true),!w.cce._cpce.qa.prev.rows[2].on));
  w.cce.cpceQaTick(1,true); ok("nothing written yet", W(w).length===0);
  w.el("cpce-ac").checked=true; w.cce.cpceQaAddList(); const x=last(w);
  ok("＋ Add 2 ticked: ONE multi-path update of classCards/<cid>, each {name, def, core, add, group = the picked Key Concept} in the Terms deck", W(w).length===1&&x.op==="update"&&x.path==="classCards/"+CID&&Object.keys(x.val).length===2&&Object.keys(x.val).every(k=>k.indexOf(D.term+"/a")===0)&&Object.values(x.val).map(v=>v.name).join()==="Ecotone,Biome"&&Object.values(x.val).every(v=>v.add===true&&v.core===true&&v.group===g.label&&v.by==="uid_teacher_demo"), x);
  ok("…the box blanks, the preview goes, the panel stays open; the note: ✓ Added 2 cards to <deck>", pt.value===""&&w.cce._cpce.qa.text===""&&w.cce._cpce.qa.prev===null&&/id="cpce-pt"/.test(list(w))&&((w.G.created.find(e=>e.id==="cpce-note")||{}).innerHTML||"").indexOf("✓ Added 2 cards to "+D.term)>=0);
  ok("…both join the folder", ["Ecotone","Biome"].every(n=>w.ccs.cpcsIndex().C.some(c=>c.added&&c.name===n&&c.g.label===g.label)));
  w.cce.cpceUndo(); const u=last(w); ok("Undo: ONE update removing both", u.op==="update"&&Object.keys(u.val).length===2&&Object.values(u.val).every(v=>v===null)&&!w.ccs.cpcsIndex().C.some(c=>c.added));
  w.el("cpce-pt","Ecotone — Where two ecosystems meet"); w.cce.cpceQaPreview(); w.cce.cpceQaAddList(); ok("a list of one: one set", last(w).op==="set"&&last(w).val.name==="Ecotone");
  const n=W(w).length; w.el("cpce-pt",""); w.cce.cpceQaPreview(); w.cce.cpceQaAddList(); ok("an empty list: nothing written", W(w).length===n);
  // ID: the item goes in front of each line
  const fo=w.ccs.cpcsIndex().secs.find(s=>s.id==="forestry"), it=fo.items[0]; w.cce.cpceQaOpen(it.key); w.cce.cpceQaPaste(true);
  w.el("cpce-pt","nest — A stick platform\nsong: Two notes"); w.cce.cpceQaPreview(); w.cce.cpceQaAddList(); const y=last(w);
  ok("pasted into an item: “<item> · front”, item set, into the ID deck, one update", y.op==="update"&&Object.values(y.val).map(v=>v.name).join()===it.label+" · nest,"+it.label+" · song"&&Object.values(y.val).every(v=>v.item===it.label)&&Object.keys(y.val).every(k=>k.indexOf(w.cce.cpceDecks("forestry").id+"/")===0)); }

console.log("\n── live (not the demo): exactly the card's path; dry run writes nothing ──");
{ const live=dry=>{ const w=world({fam:FAM,dry,remote:{"classCards/c1":LAYER()}}); w._envs.role="teacher"; w._envs.uid="t1"; w._envc.sdb=w.firebase.database(); w._envc.cid="c1"; w._envs.cid="c1"; w._envc.view="cpcards"; return w; };
  const w=live(false); w.cce.cpceChips([]);
  ok("opening 📚 Cards listens to classCards/<cid> (one listener), and the layer arrives", w.G.listeners.filter(l=>l.p==="classCards/c1").length===1&&w.cce.cpceLayer("c1")[FT].o74.hide===true);
  w.cce.cpceChips([]); ok("…once, however often the console paints", w.G.listeners.filter(l=>l.p==="classCards/c1").length===1);
  await w.cce.cpceCommit({[FT+"/o67"]:{name:"Cambium",hide:true,by:"t1",ts:5}},"x"); await w.cce.cpceCommit({[FT+"/o74"]:null},"x"); await w.cce.cpceCommit({[FT+"/o1"]:{name:"Forest",hide:true,by:"t1",ts:5},[FT+"/o2"]:{name:"Tar",hide:true,by:"t1",ts:5}},"x");
  ok("one card = set / remove at classCards/<cid>/<deck>/<key>; several = ONE update at classCards/<cid>; nothing else", JSON.stringify(w.G.writes.map(x=>[x[0],x[1]]))===JSON.stringify([["set","classCards/c1/"+FT+"/o67"],["remove","classCards/c1/"+FT+"/o74"],["update","classCards/c1"]])&&Object.keys(w.G.writes[2][2]).join()===FT+"/o1,"+FT+"/o2", w.G.writes);
  ok("live, memory waits for the listener (no local mutation)", !w.cce.cpceLayer("c1")[FT].o67);
  const bad=w.G.writes.length; await w.cce.cpceCommit({"a.b/o1":null},"x"); ok("a deck key Firebase can't hold is refused, nothing written", w.G.writes.length===bad);
  const d=live(true); await d.cce.cpceCommit({[FT+"/o67"]:{name:"Cambium",hide:true,by:"t1",ts:5}},"x"); ok("?dryrun=1: nothing written", d.G.writes.length===0);
  const t=live(false); t.envcPickClass("c2"); t.cce.cpceChips([]); ok("switching class: the old listener goes, classCards/c2 is listened to", t.G.listeners.some(l=>l.p==="classCards/c2")); }

console.log("\n── the kid (demo): hidden leaves, the new back shows, her card arrives ──");
{ const w=demo("teacher",{envt:true}); open(w); const crown=card(w,FT,"Crown"), sil=card(w,FT,"Silviculture"), cam=card(w,FT,"Cambium"), snag=libCard(FT,"Snag");
  w.envsDemoGo("kid"); const K=w._envs.kid, md=w.masteryData, items=md[K], bank=md[K+"_custom_items"].filter(x=>x.cat===FT).map(x=>x.name);
  ok("before any change: the kid's hooks hand back the very same objects", w.cce.cpceKidOn(K)===true&&w.cce.cpceItems(K,items)===items&&w.cce.cpceBank(K,FT,bank)===bank&&w.cce.cpceDef(K,"Silviculture",FT)===null);
  const core0=w.envt.envtCoreCount(K,"forestry");
  w.envsDemoGo("teacher"); open(w); w.cce.cpceHide(crown.i); w.cce.cpceEditOpen(sil.i); w.el("cpce-def","Growing a forest on purpose."); w.cce.cpceEditSave(sil.i);
  const g=crown.g; w.cce.cpceQaOpen(g.key); w.el("cpce-af","Coppice"); w.el("cpce-ab","Cutting to the stump."); w.el("cpce-ac").checked=true; w.cce.cpceQaAdd();
  w.envsDemoGo("kid");
  const it2=w.cce.cpceItems(K,items), b2=w.cce.cpceBank(K,FT,bank);
  ok("Kid ▸ 🌿: the hidden card leaves the pile (mstPile's items) and Mom's drill; nothing else goes", items.some(i=>i.prompt==="Crown")&&!it2.some(i=>i.prompt==="Crown")&&it2.length===items.length-items.filter(i=>i.subject===FT&&i.prompt==="Crown").length);
  ok("…the bank: Crown gone, her Coppice at the end of the deck", bank.indexOf("Crown")>=0&&b2.indexOf("Crown")<0&&b2[b2.length-1]==="Coppice"&&b2.length===bank.length);
  ok("…the new back shows (with the deck, and without it), every other back as before", w.cce.cpceDef(K,"Silviculture",FT)==="Growing a forest on purpose."&&w.cce.cpceDef(K,"Silviculture")==="Growing a forest on purpose."&&w.cce.cpceDef(K,"Cambium",FT)===null&&w.cce.cpceDef(K,"Coppice",FT)==="Cutting to the stump.");
  ok("…the games skip it (cpceHidItem), and the kid's own item is never touched", w.cce.cpceHidItem(K,items.find(i=>i.prompt==="Crown"))===true&&w.cce.cpceHidItem(K,items.find(i=>i.prompt==="Cambium"))===false&&items.some(i=>i.prompt==="Crown"));
  const core1=w.envt.envtCoreCount(K,"forestry"), wasCrown=(w.unitStudies.nc_envirothon.decks.find(d=>d.key===FT).cards.find(c=>c.name==="Crown")||{}).core===true;
  ok("…the final's core total: Crown (core) leaves it, her core Coppice joins it — the total is the same, the learned count follows", wasCrown&&core1.total===core0.total&&core1.learned<=core0.learned, [core0,core1]);
  w.envsDemoGo("teacher"); open(w); w.cce.cpceHide(cam.i); w.envsDemoGo("kid");
  const core2=w.envt.envtCoreCount(K,"forestry"); ok("hide one more core card: the total drops by one", core2.total===core1.total-1, [core1,core2]);
  ok("a teacher login never gets the kid's hooks (live)", (()=>{ const t=world({fam:FAM}); t._envs.role="teacher"; t._envs.kid="maya"; t.cce._cpce.kid=LAYER(); const a=["Crown"]; return t.cce.cpceKidOn("maya")===false&&t.cce.cpceBank("maya",FT,a)===a; })());
  ok("nothing was written to Firebase in all of it", w.G.writes.length===0); }

console.log("\n── the kid's boot (live): read once, applied in memory, never written ──");
{ const remote={"classCards/c1":LAYER(),"classes/c1/settings":{},"students/fam_k/settings":{}};
  const w=world({fam:FAM,remote,lib:LIB}); w._envs.role="kid"; w._envs.kid="k"; w._envs.sid="fam_k"; w._envs.cid="c1";
  const a=["Cambium","Crown"]; ok("before the read: nothing applies", w.cce.cpceBank("k",FT,a)===a&&w.cce.cpceDef("k","Silviculture",FT)===null);
  w.envsReadShared();
  ok("ONE once of classCards/<cid> at boot, no listener on it", w.G.reads.filter(p=>p==="classCards/c1").length===1&&!w.G.listeners.some(l=>/^classCards/.test(l.p)));
  ok("…then the layer applies: Crown out of the bank, Coppice in, Silviculture's back", JSON.stringify(w.cce.cpceBank("k",FT,a))==='["Cambium","Coppice"]'&&w.cce.cpceDef("k","Silviculture",FT)==="Growing a forest on purpose.");
  w.cce.cpceKidLoad(w.firebase.database(),"c1"); ok("a second load reads nothing more; no write", w.G.reads.filter(p=>p==="classCards/c1").length===1&&w.G.writes.length===0);
  const p=world({fam:FAM,remote}); p._envs.role="parent"; p._envs.kid="k"; p._envs.sid="fam_k"; p._envs.cid="c1"; p.envsReadShared();
  ok("a parent's login reads it too (their child's counts follow the class)", p.cce.cpceKidOn("k")&&p.cce.cpceDef("k","Silviculture",FT)==="Growing a forest on purpose.");
  const e=world({fam:FAM,remote:{"classCards/c1":null}}); e._envs.role="kid"; e._envs.kid="k"; e._envs.sid="fam_k"; e._envs.cid="c1"; e.envsReadShared(); const z=["x"];
  ok("a class with no layer: every hook hands back what it was given", e.cce.cpceBank("k",FT,z)===z&&e.cce.cpceDef("k","x",FT)===null);
  const E=engine(hooksOf(w),FIX(),[FT]), due=[{subject:FT,prompt:"Crown",status:"active"},{subject:FT,prompt:"Cambium",status:"introduction"}], env=E.envDrillSplit("k",due);
  ok("the real engine on the site's kid: mastGetDef and mastCustomDef give her back; mastBankEligible drops Crown and adds Coppice; Mom's drill (envDrillSplit) skips Crown",
    E.mastGetDef("k","Silviculture",FT)==="Growing a forest on purpose."&&E.mastCustomDef("k",FT,"Silviculture")==="Growing a forest on purpose."&&E.mastGetDef("k","Hund","German")==="dog"&&JSON.stringify(E.mastBankEligible("k",FT))==='["Cambium","Silviculture","Coppice"]'&&env.map(i=>i.prompt).join()==="Cambium", [E.mastBankEligible("k",FT),env]);
  const t=world({fam:FAM,remote}); t._envs.role="teacher"; ok("a teacher's boot never reads it this way", t.cce.cpceKidLoad(t.firebase.database(),"c1")===false&&t.G.reads.length===0); }

console.log("\n── the kid's records in memory: hydrate, ID Flash, the core total ──");
{ const w=world({fam:FAM}); w._envs.role="kid"; w._envs.kid="k"; w.cce._cpce.kid=LAYER(); w.cce._cpce.ver++;
  const libDeck=LIB.unit.decks.find(d=>d.key===FT), u={decks:[{key:FT,stage:1,station:"forestry",cards:libDeck.cards.slice()}]}, silLib=libDeck.cards.find(c=>c.name==="Silviculture"), before=JSON.stringify(silLib);
  ok("envHydrate's hook: her back on the record as a NEW card object (the card file's own object untouched), her card at the end with the next order", w.cce.cpceHydrate(u)===true&&u.decks[0].cards.find(c=>c.name==="Silviculture").def==="Growing a forest on purpose."&&JSON.stringify(silLib)===before&&(()=>{ const l=u.decks[0].cards[u.decks[0].cards.length-1]; return l.name==="Coppice"&&l.order===Math.max(...libDeck.cards.map(c=>c.order))+1&&l.core===true&&l.classAdd===true; })());
  const n=u.decks[0].cards.length; w.cce.cpceHydrate(u); ok("…run again on the same record: no second copy", u.decks[0].cards.length===n);
  const ID="Forestry · ID", idDeck=LIB.unit.decks.find(d=>d.key===ID), sp=(idDeck.cards[0].item||idDeck.cards[0].name.split(" · ")[0]), mine=idDeck.cards.filter(c=>(c.item||c.name.split(" · ")[0])===sp);
  const unit={decks:[{key:ID,cards:idDeck.cards}]}, mk=()=>[{unit,key:ID,items:[{item:sp},{item:"Other"}]}];
  w.cce._cpce.kid={[ID]:{o1:{name:mine[0].name,hide:true,by:"t",ts:1}}}; w.cce._cpce.ver++;
  ok("ID Flash: one of an item's cards hidden → the item stays", mine.length>1&&w.cce.cpceFlash("k",mk())[0].items.length===2);
  w.cce._cpce.kid={[ID]:Object.fromEntries(mine.map((c,i)=>["o"+c.order,{name:c.name,hide:true,by:"t",ts:i}]))}; w.cce._cpce.ver++;
  ok("…every card of the item hidden → the item drops out; a deck with none left drops out", w.cce.cpceFlash("k",mk())[0].items.length===1&&w.cce.cpceFlash("k",[{unit,key:ID,items:[{item:sp}]}]).length===0);
  w.cce._cpce.kid={[FT]:{o9:{hide:true,by:"t",ts:1}}}; w.cce._cpce.ver++; w.unitStudies.u1={decks:[{key:FT,cards:[{name:"By order",order:9}]}]};
  ok("a record without its front is matched by o<order> on the family's unit record", w.cce.cpceBank("k",FT,["By order","Kept"]).join()==="Kept");
  const out={learned:2,total:3}, ok2={[FT]:new Set(["A"])}; w.cce._cpce.kid={[FT]:{o1:{name:"A",hide:true,by:"t",ts:1},o2:{name:"B",hide:true,by:"t",ts:2}}}; w.cce._cpce.ver++;
  w.cce.cpceCoreFix("k",new Set([FT]),()=>[{name:"A",core:true},{name:"B",core:false},{name:"C",core:true}],ok2,out);
  ok("the core total: a hidden learned core card leaves both counts; a hidden non-core card changes nothing", out.total===2&&out.learned===1, out); }

console.log("\n── the rules: classCards/$cid ──");
{ const R=JSON.parse(fs.readFileSync(path.join(REPO,"envirothon","SITE_RULES.json"),"utf8")).rules, C=R.classCards&&R.classCards.$cid, card=C&&C.$deck&&C.$deck.$card;
  ok("classCards/$cid: read by the class's teacher, Adrienne, and the class's own logins (kid and parent)", !!C&&/classes\/'\+\$cid\+'\/teacher'\)\.val\(\) == auth\.uid/.test(C[".read"])&&/admins\/'\+auth\.uid/.test(C[".read"])&&/logins\/'\+auth\.uid\+'\/cid'\)\.val\(\) == \$cid/.test(C[".read"]));
  ok("written per card (…/$deck/$card), by the teacher of THAT class or Adrienne — never a whole-class write, never a kid or parent", !!card&&!C[".write"]&&!C.$deck[".write"]&&/classes\/'\+\$cid\+'\/teacher'\)\.val\(\) == auth\.uid/.test(card[".write"])&&/admins\//.test(card[".write"])&&!/logins/.test(card[".write"]));
  ok("the shape: name, by (= her uid), ts; a hide, a back or an added card; an added card has a back, core true/false and a Firebase-safe front; nothing else", /hasChildren\(\['name','by','ts'\]\)/.test(card[".validate"])&&/child\('by'\)\.val\(\) == auth\.uid/.test(card[".validate"])&&/core'\)\.isBoolean\(\)/.test(card[".validate"])&&/matches\(\/\[\.#\$\\\[\\\]\\\/\]\/\)/.test(card[".validate"])&&card.$other[".validate"]===false&&card.def[".validate"].indexOf("<= 400")>0);
  // every record the code writes fits the children the rules allow
  const w=demo("teacher"); open(w); const c=card2(w), allowed=Object.keys(card).filter(k=>k[0]!=="."&&k[0]!=="$");
  w.cce.cpceHide(c.i); w.cce.cpceEditOpen(c.i); w.el("cpce-def","Mine."); w.cce.cpceEditSave(c.i);
  const g=c.g; w.cce.cpceQaOpen(g.key); w.el("cpce-af","Coppice"); w.el("cpce-ab","Stump."); w.cce.cpceQaAdd();
  const recs=W(w).filter(x=>x.op==="set").map(x=>x.val);
  ok("every record the code writes uses only the children the rules allow, with by and ts", recs.length===3&&recs.every(r=>Object.keys(r).every(k=>allowed.indexOf(k)>=0)&&r.by&&typeof r.ts==="number"&&r.name), recs);
  ok("the old teacherCards/$cid rules stay for now (nothing writes there from 📚 Cards)", !!R.teacherCards&&!W(w).some(x=>/teacherCards/.test(x.path))); }

console.log("\n"+pass+" passed, "+fail+" failed");
if(fail) process.exit(1);
};
function card2(w){ return card(w,FT,"Crown"); }
run().catch(e=>{ console.log("CRASH",e&&e.stack); process.exit(1); });
