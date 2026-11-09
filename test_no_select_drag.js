/*
 * 🚫🔵 A drag or a stroke never selects the page (her report 2026-11-08, tablet: "when you try to click and drag stuff, the
 * background turns blue and everything on that page kind of gets selected" — the 🧩 Picture Puzzle, and the Pre-K tablet notebook).
 * NOSEL_CSS: .ha-nosel (no selection / callout / image drag; inputs inside stay selectable) + body.ha-dragging (page-wide, while a
 * finger drags or draws). NOSELDRAG: haDragStart(ev) preventDefaults a drag start unless it landed on a control, and turns
 * body.ha-dragging on; a lift anywhere turns it off. Surfaces: Picture Puzzle, ABC Train, Sort it, Match & Play, the tablet
 * notebook, the workbook viewer. Runs the REAL code in a vm with a fake page.
 *   run:  node test_no_select_drag.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
let pass=0, fail=0;
function ok(n,c,x){ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":""));} }
const src=require("./test_src.js")(path.join(__dirname,"index.html"));
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("markers "+a); return src.slice(i,j); };
function fnText(name){ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("no fn "+name); const j=src.indexOf("\nfunction ",i+10); return src.slice(i,j<0?undefined:j); }
const NOSEL=cut("// NOSELDRAG_START","// NOSELDRAG_END");

// a fake page: body.classList, document-level listeners, elements with listeners + classes
function fakeEl(tag,attrs,parent){ const L={}, cls=new Set(); return {tagName:tag||"DIV",nodeType:1,parentElement:parent||null,attrs:attrs||{},L,cls,style:{},isContentEditable:!!(attrs&&attrs.contenteditable),
  hasAttribute(n){ return Object.prototype.hasOwnProperty.call(this.attrs,n); },getAttribute(n){ return this.attrs[n]; },
  classList:{add:x=>cls.add(x),remove:x=>cls.delete(x),toggle:(x,on)=>on?cls.add(x):cls.delete(x),contains:x=>cls.has(x)},
  addEventListener(n,f){ L[n]=f; },removeEventListener(n){ delete L[n]; },setPointerCapture(){},releasePointerCapture(){},
  getBoundingClientRect:()=>({left:0,top:0,width:60,height:60})}; }
function page(){ const body=fakeEl("BODY"), docL={}, winL={};
  const document={body,addEventListener(n,f,cap){ (docL[n]=docL[n]||[]).push(f); },getElementById:()=>null,querySelectorAll:()=>[],elementFromPoint:()=>null};
  return {body,docL,winL,document,window:{addEventListener(n,f){ (winL[n]=winL[n]||[]).push(f); },innerHeight:800,scrollY:0,scrollBy(){}},fire:(n,e)=>(docL[n]||[]).forEach(f=>f(e||{}))}; }
function fakeEv(target,current,extra){ const e=Object.assign({clientX:10,clientY:10,pointerId:1,button:0,cancelable:true,target:target,currentTarget:current,prevented:0},extra||{}); e.preventDefault=()=>{ e.prevented++; }; return e; }
function sandbox(code,extra){ const p=page(); const ctx=Object.assign({console,JSON,Object,Array,String,Number,Math,Set,Map,RegExp,Date,parseInt,isNaN,Promise,setTimeout:()=>0,setInterval:()=>1,clearInterval(){},document:p.document,window:p.window},extra||{});
  vm.createContext(ctx); vm.runInContext(NOSEL+"\n"+code,ctx); return {c:ctx,p}; }
const dragging=p=>p.body.cls.has("ha-dragging");

console.log("── the CSS ──");
{ const css=cut("/* NOSEL_CSS","body.ha-dragging,body.ha-dragging *{");
  const rule=(css.match(/\.ha-nosel\{([^}]*)\}/)||[])[1]||"";
  ok("one .ha-nosel class with the four declarations",(src.match(/\n\.ha-nosel\{/g)||[]).length===1&&/user-select:none;/.test(rule)&&/-webkit-user-select:none/.test(rule)&&/-webkit-touch-callout:none/.test(rule)&&/-webkit-user-drag:none/.test(rule),rule);
  ok(".ha-nosel carries no touch-action (scroll containers keep scrolling)",!/touch-action/.test(rule));
  ok("inputs / textareas / selects / contenteditable inside stay selectable",/\.ha-nosel input,\.ha-nosel textarea,\.ha-nosel select,\.ha-nosel \[contenteditable="true"\]\{user-select:text;-webkit-user-select:text;-webkit-touch-callout:default\}/.test(src));
  ok("pictures and links inside never start an image drag",/\.ha-nosel img,\.ha-nosel a\{-webkit-user-drag:none\}/.test(src));
  ok("body.ha-dragging turns selection off page-wide",/body\.ha-dragging,body\.ha-dragging \*\{user-select:none!important;-webkit-user-select:none!important;-webkit-touch-callout:none!important\}/.test(src));
  const ci=src.indexOf("\n.ha-nosel{");
  ok("the CSS sits in the page's own <style> (not inside a script string)",ci>0&&src.lastIndexOf("<style",ci)>src.lastIndexOf("</style>",ci)&&src.lastIndexOf("<style",ci)>src.lastIndexOf("<script",ci)-1&&src.indexOf("</style>",ci)<src.indexOf("// NOSELDRAG_START"));
  ok("no 🔀 anywhere in index.html",src.indexOf("\u{1F500}")<0);
}

console.log("── the helper (NOSELDRAG) ──");
{ const {c,p}=sandbox("");
  const surf=fakeEl("DIV"), ev=fakeEv(surf,surf);
  ok("a drag start on the surface: preventDefault + body.ha-dragging on",c.haDragStart(ev)===true&&ev.prevented===1&&dragging(p));
  p.fire("pointerup",{type:"pointerup"});
  ok("a lift anywhere turns it off (document capture listener)",!dragging(p));
  c.haDragStart(fakeEv(surf,surf)); p.fire("pointercancel",{type:"pointercancel"});
  ok("…and a cancel",!dragging(p));
  c.haDragStart(fakeEv(surf,surf)); (p.winL.blur||[]).forEach(f=>f()); ok("…and the window losing focus",!dragging(p));
  for(const [tag,attrs] of [["BUTTON",{}],["A",{}],["INPUT",{}],["TEXTAREA",{}],["SELECT",{}],["LABEL",{}],["SPAN",{onclick:"x()"}],["DIV",{contenteditable:true}]]){
    const inner=fakeEl(tag,attrs,surf), e=fakeEv(inner,surf);
    ok("a press on a "+tag+(attrs.onclick?"[onclick]":attrs.contenteditable?"[contenteditable]":"")+" inside keeps its tap / typing (no preventDefault, no body class)",c.haDragStart(e)===false&&e.prevented===0&&!dragging(p));
  }
  const deep=fakeEl("SPAN",{},fakeEl("SPAN",{},surf)), e2=fakeEv(deep,surf);
  ok("a press on plain text inside the surface IS a drag start",c.haDragStart(e2)===true&&e2.prevented===1); c.haDragOff();
  const nc=fakeEv(surf,surf,{cancelable:false}); c.haDragStart(nc); ok("an uncancelable event is left alone (no console warning)",nc.prevented===0); c.haDragOff();
  ok("no document: nothing throws",(()=>{ try{ const x=vm.createContext({}); vm.runInContext(NOSEL+"\nhaDragOn(); haDragOff(); haDragStart({currentTarget:null,target:null,preventDefault(){}});",x); return true; }catch(e){ return false; } })());
}

console.log("── 🧩 Picture Puzzle ──");
{ const {c,p}=sandbox("var jigState=null, _jigDragging=false, tapped=[], dropped=[]; function jigTapPiece(i){ tapped.push(i); } function jigDrop(i,x,y){ dropped.push(i); }\n"+fnText("jigDown")+"\nthis.set=v=>{ jigState=v; }; this.got=()=>({tapped,dropped,_jigDragging});");
  c.set({phase:"play"});
  const pc=fakeEl("DIV"), e=fakeEv(pc,pc);
  c.jigDown(e,0);
  ok("a piece press: preventDefault (no selection / image drag) + body.ha-dragging",e.prevented===1&&dragging(p));
  pc.L.pointermove({clientX:60,clientY:60}); ok("…dragging keeps it on",dragging(p)&&c.got()._jigDragging===true);
  pc.L.pointerup({type:"pointerup",clientX:60,clientY:60});
  ok("…let go: the class comes off and the drop still lands",!dragging(p)&&c.got().dropped.length===1);
  const pc2=fakeEl("DIV"), e2=fakeEv(pc2,pc2); c.jigDown(e2,1); pc2.L.pointerup({type:"pointerup",clientX:11,clientY:10});
  ok("a tap is still a tap (picks the piece), class off after",c.got().tapped.join()==="1"&&!dragging(p));
  const pc3=fakeEl("DIV"), e3=fakeEv(pc3,pc3); c.jigDown(e3,2); pc3.L.pointercancel({type:"pointercancel"}); ok("a cancel ends it",!dragging(p));
  c.set({phase:"show"}); const e4=fakeEv(pc,pc); c.jigDown(e4,0); ok("not playing: nothing (no preventDefault)",e4.prevented===0&&!dragging(p));
}
// the screen carries the class: the real builder in a world
let _id=0;
function jigWorld(items){ const ctx={console,JSON,Object,Array,String,Number,Math,Set,Map,RegExp,Date,parseInt,isNaN,isFinite,Promise,encodeURIComponent,setTimeout:()=>0,
    _dryRun:()=>true,HA_LS:{setItem(){}},_mastRe(){},momHere:()=>true,renderAll(){},cap:s=>s,_gamesItems:k=>(k==="k"?items:[]),mastGetVisual:()=>null,mastSpeak(){},matchDing(){},matchBonk(){},
    mstTodayKey:()=>"20261108",mastView:"jigsaw",masteryKid:"k",masteryData:{k:items,k_settings:{},gameLog:{}},db:null};
  vm.createContext(ctx);
  vm.runInContext(cut("// GAMELOG_START","// GAMELOG_END")+"\n"+cut("// GAMEGRID_START","// GAMEGRID_END")+"\n"+cut("// GAMERULES_START","// GAMERULES_END")+"\n"+cut("// UNITPIC_START","// UNITPIC_END")+"\n"+cut("// JIGSAW_START","// JIGSAW_END")+"\nthis.st=()=>jigState;",ctx);
  return ctx; }
const firstDiv=h=>(h.replace(/^<style>[\s\S]*?<\/style>/,"").match(/^<div[^>]*>/)||[""])[0];
{ const items=["cat","dog","cow","pig"].map(w=>({id:"c"+(++_id),subject:"Pets",prompt:w,status:"active",tier:"daily",imageUrl:"https://pics.example/"+w+".jpg"}));
  const c=jigWorld(items);
  const h0=c.buildJigHtml("#333"); ok("the puzzle's start screen: its whole screen wrapper is .ha-nosel",/^<div class="ha-nosel"/.test(firstDiv(h0)),firstDiv(h0));
  c.jigStart(); const h=c.buildJigHtml("#333");
  const w=h.indexOf('<div class="ha-nosel"'), board=h.indexOf('class="jig-board"'), fr=h.indexOf('id="jig-frame"'), tp=h.indexOf('class="jig-pc jig-tp');
  ok("playing: the board, the frame and every tray piece sit inside the .ha-nosel wrapper",c.st()&&c.st().phase==="play"&&w>=0&&board>w&&fr>w&&tp>w&&/^<div class="ha-nosel"/.test(firstDiv(h)));
  ok("the pieces still take the finger (touch-action:none on the piece only)",/\.jig-tp\{[^}]*touch-action:none/.test(h)&&!/\.jig-board\{[^}]*touch-action/.test(h)&&!/\.jig-tray\{[^}]*touch-action/.test(h));
  ok("no 'no pictures' screen lost the class either",/^<div class="ha-nosel"/.test(firstDiv(jigWorld([]).buildJigHtml("#333"))));
}

console.log("── 🚂 ABC Train ──");
{ const {c,p}=sandbox("var trainState=null, picked=[], dropped=[]; function trainSlotNear(){ return -1; } function _trainSlotRects(){ return []; } function _trainHookHover(){} function trainHookPick(i){ picked.push(i); } function trainDrop(i,k){ dropped.push([i,k]); }\n"+fnText("trainHookDown")+"\nthis.set=v=>{ trainState=v; }; this.got=()=>({picked,dropped});");
  c.set({phase:"play",lock:false});
  const car=fakeEl("DIV"), e=fakeEv(car,car); c.trainHookDown(e,0);
  ok("a tray car press (levels 3–5): preventDefault + body.ha-dragging",e.prevented===1&&dragging(p));
  car.L.pointermove({clientX:80,clientY:90}); car.L.pointerup({type:"pointerup",clientX:80,clientY:90});
  ok("…let go: off, and the drop is judged",!dragging(p)&&c.got().dropped.length===1);
  const car2=fakeEl("DIV"), e2=fakeEv(car2,car2); c.trainHookDown(e2,1); car2.L.pointerup({type:"pointerup",clientX:10,clientY:11});
  ok("a tap still picks the car",c.got().picked.join()==="1"&&!dragging(p));
  c.set({phase:"play",lock:true}); const e3=fakeEv(car,car); c.trainHookDown(e3,0); ok("locked (the clack): nothing",e3.prevented===0&&!dragging(p));
}
{ // the screens: the real builder, a Letters deck
  const UNITPIC=cut("// UNITPIC_START","// UNITPIC_END");
  const items="ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map(L=>({id:"L"+L,subject:"Letters",prompt:L,answer:L,status:"active"}));
  const mk=lvl=>{ const ctx={console,JSON,Object,Array,String,Number,Math,Set,Map,RegExp,Date,parseInt,isNaN,Promise,setTimeout:()=>0,_dryRun:()=>true,HA_LS:{setItem(){}},_mastRe(){},bbAudioUnlock(){},momHere:()=>true,renderAll(){},cap:s=>s,
      _gamesItems:k=>(k==="k"?items:[]),mastGetVisual:()=>null,mastItemVis:it=>'<span>'+it.prompt+'</span>',mastSpeak(){},matchDing(){},matchBonk(){},mstTodayKey:()=>"20261108",mastView:"train",masteryKid:"k",bbAlarmCtx:null,
      masteryData:{k:items,k_settings:{gameRules:{train:{level:String(lvl)}}},gameLog:{}},db:null};
    vm.createContext(ctx);
    vm.runInContext(UNITPIC+"\n"+cut("// GAMELOG_START","// GAMELOG_END")+"\n"+cut("// GAMEGRID_START","// GAMEGRID_END")+"\n"+cut("// GAMERULES_START","// GAMERULES_END")+"\n"+cut("// TRAIN_START","// TRAIN_END"),ctx);
    return ctx; };
  const c3=mk(3); ok("start screen wrapper is .ha-nosel",/^<div class="ha-nosel"/.test(firstDiv(c3.buildTrainHtml("#333"))));
  c3.trainStart(); const h3=c3.buildTrainHtml("#333"), w3=h3.indexOf('<div class="ha-nosel"');
  ok("level 3: the track, its slots and the tray cars sit inside the .ha-nosel wrapper",w3>=0&&h3.indexOf('id="trn-track"')>w3&&h3.indexOf('class="trn-tray')>w3&&h3.indexOf('class="trn-tcar')>w3&&/^<div class="ha-nosel"/.test(firstDiv(h3)));
  ok("the track still scrolls (no touch-action on .trn-track / .trn-tray)",!/\.trn-track\{[^}]*touch-action/.test(h3)&&!/\.trn-tray\{[^}]*touch-action/.test(h3)&&/\.trn-tcar\{touch-action:none/.test(h3));
  const c1=mk(1); c1.trainStart(); const h1=c1.buildTrainHtml("#333");
  ok("levels 1–2: the choice cars sit inside the .ha-nosel wrapper",/^<div class="ha-nosel"/.test(firstDiv(h1))&&h1.indexOf('class="trn-choice')>h1.indexOf('class="ha-nosel"'));
}

console.log("── 🧺 Sort it ──");
{ const {c,p}=sandbox("var sortState=null, picked=[], dropped=[]; function sortPick(i){ picked.push(i); } function _sortHover(){} function _sortBinAt(){ return 0; } function sortDrop(i,b){ dropped.push([i,b]); } function _mastRe(){}\n"+fnText("sortDown")+"\nthis.set=v=>{ sortState=v; }; this.got=()=>({picked,dropped});");
  c.set({phase:"play"});
  const card=fakeEl("DIV"), e=fakeEv(card,card); c.sortDown(e,0);
  ok("a card press: preventDefault + body.ha-dragging",e.prevented===1&&dragging(p));
  card.L.pointermove({clientX:80,clientY:80}); card.L.pointerup({type:"pointerup",clientX:80,clientY:80});
  ok("…let go: off, and it drops in the bin",!dragging(p)&&c.got().dropped.length===1);
  const card2=fakeEl("DIV"); c.sortDown(fakeEv(card2,card2),1); card2.L.pointerup({type:"pointerup",clientX:11,clientY:10});
  ok("a tap still picks the card",c.got().picked.join()==="1"&&!dragging(p));
  ok("the board's wrapper is .ha-nosel",/let h=SORT_CSS\+'<div class="ha-nosel" style="padding:4px 14px 24px;max-width:720px;margin:0 auto">';/.test(fnText("buildSortHtml")));
}

console.log("── 🎯 Match & Play ──");
{ const ctx={mastMatchDecks:()=>[],console}; vm.createContext(ctx); vm.runInContext(fnText("buildMatchHtml"),ctx);
  ok("the Match screen's wrapper is .ha-nosel (taps only — no drag code to change)",/^<div class="ha-nosel" style="padding:4px 14px 20px">/.test(ctx.buildMatchHtml("#333")));
}

// the overlays: nbtShow / wbOpen build #nbt-view / #wb-view and append it — stop right after and look at it
function overlay(fn,stubs,call){ let el=null; const STOP={stop:1};
  const mkEl=()=>({style:{},id:"",className:"",innerHTML:"",remove(){}});
  const document={getElementById:id=>{ if(el) throw STOP; return null; },createElement:()=>mkEl(),body:{appendChild:x=>{ el=x; }}};
  const ctx=Object.assign({console,JSON,Object,Array,String,Number,Math,parseInt,isNaN,document,HA_LS:{getItem:()=>null},alert(){}},stubs); vm.createContext(ctx); vm.runInContext(fnText(fn),ctx);
  try{ call(ctx); }catch(e){ if(e!==STOP) throw e; } return el; }

console.log("── 📓 tablet notebook ──");
{ const ov=overlay("nbtShow",{NBT_DAYS:["monday"],nbtTodayDay:()=>"monday",nbtView:null},c=>c.nbtShow("k","week1","<p>x</p>",null,{}));
  ok("the notebook overlay (#nbt-view: bar, page, ink) is .ha-nosel",!!ov&&ov.id==="nbt-view"&&ov.className==="ha-nosel"&&/id="nbt-ink"/.test(ov.innerHTML)&&/id="nbt-bar"/.test(ov.innerHTML));
  ok("the page still scrolls (touch-action stays on the canvas only)",/id="nbt-stage" style="flex:1;overflow:auto/.test(ov.innerHTML)&&!/id="nbt-stage"[^>]*touch-action/.test(ov.innerHTML)&&/<canvas id="nbt-ink" style="[^"]*touch-action:none/.test(ov.innerHTML));
  // the pointer plumbing on a fake page
  const blk=cut("// NBTABLET_START","// NBTABLET_END"), iife=blk.slice(blk.indexOf("(function nbtBindOnce(){"),blk.indexOf("function nbtPt("));
  const {c,p}=sandbox("var nbtView=null, painted=0, marked=0; function nbtBarRender(){} function nbtAcHit(v,q){ return v.hitAll?{arm:0,l:'a'}:null; } function nbtAcPick(){} function nbtFitCanvas(){ return true; } function nbtPaint(){ painted++; } function nbtMarkDirty(){ marked++; } function nbtEraseAt(){} function nbtFitAll(){} function momHere(){ return false; } var WB_PEN='#000', WB_MOMPEN='#f00';\n"+fnText("nbtPt")+"\n"+iife+"\nthis.set=v=>{ nbtView=v; };");
  const cv=fakeEl("CANVAS"); cv.width=100; cv.height=100; cv.getBoundingClientRect=()=>({left:0,top:0,width:100,height:100});
  p.document.getElementById=id=>id==="nbt-ink"?cv:null;
  c.set({strokes:[],tool:"pen",penOnly:false,sawPen:false});
  const e=fakeEv(cv,p.document,{pointerType:"touch"}); p.fire("pointerdown",e);
  ok("a stroke starts: preventDefault + body.ha-dragging",e.prevented===1&&dragging(p));
  p.fire("pointermove",fakeEv(cv,p.document,{clientX:20,clientY:20})); p.fire("pointerup",{type:"pointerup"});
  ok("…the pen lifts: the class comes off",!dragging(p));
  c.set({strokes:[],tool:"pen",penOnly:true,sawPen:true});
  const f=fakeEv(cv,p.document,{pointerType:"touch"}); p.fire("pointerdown",f);
  ok("pencil-only: a finger is left alone so the page scrolls (no preventDefault, no body class)",f.prevented===0&&!dragging(p));
  const other=fakeEl("BUTTON"), b=fakeEv(other,p.document,{pointerType:"touch"}); c.set({strokes:[],tool:"pen",penOnly:false}); p.fire("pointerdown",b);
  ok("a press on the bar's buttons is not touched",b.prevented===0&&!dragging(p));
  c.set({strokes:[],tool:"pen",penOnly:false,hitAll:true}); const t=fakeEv(cv,p.document,{pointerType:"touch"}); p.fire("pointerdown",t);
  ok("a tap on an answer circle: no selection either (class on, off at lift)",t.prevented===1&&dragging(p)); p.fire("pointerup",{type:"pointerup",clientX:10,clientY:10}); ok("…off",!dragging(p));
}

console.log("── 📘 workbook viewer ──");
{ const ov=overlay("wbOpen",{wbBook:()=>({pages:3,imgs:{}}),wbMomEyes:()=>false,wbAssignClean:()=>null,wbView:null,wbBarRender(){},wbLoadPage(){}},c=>c.wbOpen("b","k",1,{}));
  ok("the workbook overlay (#wb-view) is .ha-nosel",!!ov&&ov.id==="wb-view"&&ov.className==="ha-nosel"&&/<canvas id="wb-ink"/.test(ov.innerHTML));
  ok("the page still scrolls (#wb-stage carries no touch-action)",/id="wb-stage" style="flex:1;overflow:auto/.test(ov.innerHTML)&&!/id="wb-stage"[^>]*touch-action/.test(ov.innerHTML));
  const iife=src.slice(src.indexOf("(function wbBindOnce(){"),src.indexOf("function wbPt("));
  const {c,p}=sandbox("var wbView=null; function wbBarRender(){} function wbFit(){ return true; } function wbPaint(){} function wbMarkDirty(){} function wbEraseAt(){} function momHere(){ return false; } var WB_PEN='#000', WB_MOMPEN='#f00';\n"+fnText("wbPt")+"\n"+iife+"\nthis.set=v=>{ wbView=v; };");
  const cv=fakeEl("CANVAS"); cv.width=100; cv.height=100; cv.getBoundingClientRect=()=>({left:0,top:0,width:100,height:100});
  p.document.getElementById=id=>id==="wb-ink"?cv:null;
  c.set({strokes:[],tool:"pen",penOnly:false,sawPen:false});
  const e=fakeEv(cv,p.document,{pointerType:"pen"}); p.fire("pointerdown",e);
  ok("a stroke starts: preventDefault + body.ha-dragging",e.prevented===1&&dragging(p));
  p.fire("pointerup",{type:"pointerup"}); ok("…lifts: off",!dragging(p));
  const f=fakeEv(cv,p.document,{pointerType:"touch"}); c.set({strokes:[],tool:"pen",penOnly:true,sawPen:true}); p.fire("pointerdown",f);
  ok("pencil-only: a finger scrolls (untouched)",f.prevented===0&&!dragging(p));
}

console.log("── nothing else changed ──");
{ // every use of the class / helpers sits on a listed surface — every other screen's markup is byte-identical to before
  const allowed=["NOSEL_CSS","NOSELDRAG","buildJigHtml","jigDown","buildTrainHtml","trainHookDown","buildSortHtml","sortDown","buildMatchHtml","nbtShow","nbtBindOnce","wbOpen","wbBindOnce"];
  const owner=i=>{ const css=src.indexOf("/* NOSEL_CSS"); if(css>=0&&i>=css&&i<src.indexOf("</style>",css)) return "NOSEL_CSS";
    const a=src.indexOf("// NOSELDRAG_START"), b=src.indexOf("// NOSELDRAG_END"); if(i>=a&&i<b) return "NOSELDRAG";
    const fs_=src.lastIndexOf("\nfunction ",i), iife=src.lastIndexOf("\n(function ",i), at=Math.max(fs_,iife), m=/\n\(?function ([A-Za-z_$][\w$]*)/.exec(src.slice(at,at+80)); return m?m[1]:"?"; };
  const re=/ha-nosel|ha-dragging|haDrag(?:Start|On|Off|Control)/g; let m, bad=[]; const seen=new Set();
  while((m=re.exec(src))){ const o=owner(m.index); seen.add(o); if(allowed.indexOf(o)<0) bad.push(o+"@"+m.index); }
  ok("ha-nosel / ha-dragging / haDrag* appear only on the listed surfaces",!bad.length,bad.slice(0,5));
  ok("…and on every one of them",allowed.every(x=>seen.has(x)),allowed.filter(x=>!seen.has(x)));
  // two unrelated screens render without the class
  const ctx={console,mastMatchDecks:()=>[]}; vm.createContext(ctx);
  vm.runInContext("var masteryKid='k', masteryData={k:[]}; var whichState=null; function _whichItems(){ return []; } function whichDeckModes(){ return {}; } "+fnText("buildWhichHtml"),ctx);
  let wh=""; try{ wh=ctx.buildWhichHtml("#333"); }catch(e){ wh="(threw) "+e.message; }
  ok("🔍 Which one? (unrelated) renders exactly as before: its plain wrapper, no .ha-nosel",!/ha-nosel/.test(wh)&&/<\/style><div style="padding:4px 14px 24px;max-width:720px;margin:0 auto"><div class="mast-none">No decks ready for Which one\? yet/.test(wh),wh.slice(-200));
  ok("the Spell builder and Memory sources are untouched",!/ha-nosel|haDrag/.test(fnText("buildSpellHtml")));
  ok("the existing grips (Mom's sections, drag-to-move) are untouched",!/haDrag|ha-nosel/.test(fnText("ssDown")+fnText("mdwDown"))&&/\.ss-grip\{[^}]*touch-action:none;user-select:none;-webkit-user-select:none/.test(src));
}

console.log("\n"+pass+" passed, "+fail+" failed");
process.exit(fail?1:0);
