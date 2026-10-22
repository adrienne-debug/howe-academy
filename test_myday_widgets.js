/*
 * 🏡 MYDAY_WIDGETS (her asks 2026-10-21: "lets do the chores in first column and ongoing under then middle to do and shopping, then last column
 * the laundry line up" → "could we actually make them moveable where whoever is using the app can drag and drop and move them to different
 * spots like widgets" · "this will be for dad too right"). Five widgets, a ⋮⋮ grip each, the order saved per person at settings/myDayOrder/<who>;
 * default = her MYDAY_COLS layout.   run: node test_myday_widgets.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,300)+")":"")); } };
const fn=name=>{ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); let d=0; for(let k=src.indexOf("{",i);k<src.length;k++){ if(src[k]==="{") d++; else if(src[k]==="}"&&--d===0) return src.slice(i,k+1); } throw new Error("unbalanced "+name); };
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("missing "+a); return src.slice(i,j); };
const BLOCK=cut("// MYDAY_WIDGETS_START","// MYDAY_WIDGETS_END");
const DEF=[["chores","ongoing"],["todo","shop"],["laundry"]];
// a fake page: three columns of widgets with boxes, for the drag
function fakeGrid(cols){ const colEls=cols.map((ids,ci)=>{ const c={attrs:{"data-mdcol":String(ci)},children:[],getAttribute(k){ return this.attrs[k]; },getBoundingClientRect(){ return {left:ci*300,right:ci*300+280,top:0,bottom:600}; },
    querySelectorAll(sel){ return sel==='[data-mdw]'?this.children.filter(w=>!w.line):[]; }, insertBefore(n,b){ n.parentNode=this; this.children.splice(this.children.indexOf(b),0,n); }, appendChild(n){ n.parentNode=this; this.children.push(n); }, removeChild(n){ n.parentNode=null; this.children=this.children.filter(x=>x!==n); } };
    ids.forEach((id,wi)=>{ c.children.push({id:id,parentNode:c,style:{},getBoundingClientRect(){ return {left:ci*300,right:ci*300+280,top:wi*200,bottom:wi*200+180,height:180}; }}); }); return c; });
  const grid={querySelectorAll(sel){ return sel==='[data-mdcol]'?colEls:[]; }}; colEls.forEach(c=>{ c.parentNode=grid; }); return {grid,colEls,widget:(id)=>{ for(const c of colEls){ const w=c.children.find(x=>x.id===id); if(w) return w; } return null; }}; }
function mk(o){
  o=o||{}; const writes=[], ls={}, listeners={}, renders=[];
  const ctx={console,Object,Array,String,Number,parseInt,Math,JSON,Date,
    HA_LS:{getItem:k=>ls[k]||null,setItem:(k,v)=>{ ls[k]=v; }}, momHere:()=>!!o.mom, _kioskD:()=>!!o.dadLink, dadAwardOk:()=>!!o.dadOpen, _dryRun:()=>!!o.dry,
    db:{ref:p=>({set:v=>writes.push(["set",p,JSON.parse(JSON.stringify(v))]),remove:()=>writes.push(["rm",p])})},
    renderMomsPlan:()=>renders.push(1), document:{getElementById:id=>id==='content'?{}:null,createElement:()=>({style:{},parentNode:null,line:true}),addEventListener:(t,f)=>{ listeners[t]=f; },removeEventListener:(t)=>{ delete listeners[t]; }},
    writes, ls, listeners, renders};
  vm.createContext(ctx); vm.runInContext(BLOCK,ctx);
  if(o.saved){ ctx.get=e=>vm.runInContext(e,ctx); vm.runInContext("myDayOrderOnValue("+JSON.stringify(o.saved)+")",ctx); }
  ctx.get=e=>vm.runInContext(e,ctx); return ctx;
}

console.log("1. The saved order");
{ const c=mk({mom:true});
  ok("nothing saved → her MYDAY_COLS default: chores + ongoing | to-do + shopping | laundry", JSON.stringify(c.get("mdwCols('mom')"))===JSON.stringify(DEF)&&c.get("mdwIsDefault('mom')")===true);
  const s=mk({mom:true,saved:{mom:[["laundry"],["chores","ongoing"],["todo","shop"]]}});
  ok("Mom's saved order comes back as saved", JSON.stringify(s.get("mdwCols('mom')"))==='[["laundry"],["chores","ongoing"],["todo","shop"]]'&&s.get("mdwIsDefault('mom')")===false);
  ok("…and Dad, with nothing saved for him, still gets the default", JSON.stringify(s.get("mdwCols('dad')"))===JSON.stringify(DEF));
  const f=mk({mom:true,saved:{mom:{"0":{"0":"laundry"},"2":{"0":"todo","1":"bogus"}}}});
  ok("Firebase's object-shaped arrays, an unknown id, a missing column: normalized — unknown dropped, the pieces it forgot land in the last column", JSON.stringify(f.get("mdwCols('mom')"))==='[["laundry"],[],["todo","chores","ongoing","shop"]]', f.get("mdwCols('mom')"));
}
console.log("2. A move = one targeted write for that person");
{ const c=mk({mom:true}); const r=c.get("mdwMove('mom','laundry',0,0)");
  ok("Mom drags Laundry to the top of column 1", JSON.stringify(r)==='[["laundry","chores","ongoing"],["todo","shop"],[]]'&&c.writes.length===1&&c.writes[0][0]==="set"&&c.writes[0][1]==="settings/myDayOrder/mom"&&JSON.stringify(c.writes[0][2])===JSON.stringify(r), c.writes);
  ok("…kept on this device too", JSON.parse(c.ls.ha_myday_order).mom.length===3);
  c.get("mdwMove('mom','shop',2,0)"); ok("then Shopping into the empty column 3", JSON.stringify(c.get("mdwCols('mom')"))==='[["laundry","chores","ongoing"],["todo"],["shop"]]');
  c.get("mdwMove('mom','ongoing',0,0)"); ok("a move inside one column reorders it", JSON.stringify(c.get("mdwCols('mom')")[0])==='["ongoing","laundry","chores"]');
  c.writes.length=0; c.get("mdwReset('mom')"); ok("↺ Reset layout: her entry removed, back to the default, the page repaints", c.writes.length===1&&c.writes[0][0]==="rm"&&c.writes[0][1]==="settings/myDayOrder/mom"&&c.get("mdwIsDefault('mom')")===true&&c.renders.length===1);
  const d=mk({mom:true,dry:true}); d.get("mdwMove('mom','laundry',0,0)"); ok("?dryrun=1: the order changes on screen, nothing is written", d.writes.length===0&&!d.get("mdwIsDefault('mom')"));
}
console.log("3. Whose hands");
{ const dad=mk({dadLink:true});
  ok("Dad's link: he can arrange HIS day (settings/myDayOrder/dad)…", dad.get("mdwMove('dad','laundry',0,0)")!==null&&dad.writes[0][1]==="settings/myDayOrder/dad");
  ok("…but not Mom's", dad.get("mdwMove('mom','laundry',0,0)")===null&&dad.writes.length===1);
  ok("Dad's Day unlocked with his code counts too", mk({dadOpen:true}).get("_mdwCan('dad')")===true);
  ok("Mom can arrange both", mk({mom:true}).get("_mdwCan('dad')")===true&&mk({mom:true}).get("_mdwCan('mom')")===true);
  ok("a kid's device: nothing — no grip drawn, no save", mk({}).get("mdwGrip('todo','mom',true)")===""&&mk({}).get("mdwMove('mom','todo',0,0)")===null);
  ok("the grip: ⋮⋮, pointerdown → mdwDown(event,id,who), touch-action none so a finger drags instead of scrolling", /onpointerdown="mdwDown\(event,'todo','dad'\)"/.test(mk({dadLink:true}).get("mdwGrip('todo','dad',true)"))&&/touch-action:none/.test(mk({mom:true}).get("mdwGrip('todo','mom',true)"))&&/\u22EE\u22EE/.test(mk({mom:true}).get("mdwGrip('todo','mom',true)")));
}
console.log("4. The drag itself (pointer events on a fake page)");
{ const c=mk({mom:true}); const G=fakeGrid(DEF); const w=G.widget("laundry"); const grip={closest:()=>w,setPointerCapture:()=>{}};
  c.get("mdwDown")({target:grip,pointerId:1,preventDefault(){ this.pd=true; }},"laundry","mom");
  ok("hold the grip: the widget goes faint, the page listens for the finger", w.style.opacity===".45"&&!!c.listeners.pointermove&&!!c.listeners.pointerup);
  c.listeners.pointermove({clientX:40,clientY:30});   // over column 1, above Chores' middle
  const col0=G.colEls[0]; ok("moving over column 1's top: the landing line sits above Chores", col0.children[0].line===true&&col0.children[1].id==="chores");
  c.listeners.pointermove({clientX:40,clientY:250});   // between Chores and Ongoing (above Ongoing's middle)
  ok("…lower: the line moves between Chores and Ongoing", col0.children[1].line===true&&col0.children[0].id==="chores");
  c.listeners.pointerup({clientX:40,clientY:250});
  ok("let go: Laundry lands between Chores and Ongoing, saved for Mom, line gone, widget solid again, page repainted", JSON.stringify(c.get("mdwCols('mom')"))==='[["chores","laundry","ongoing"],["todo","shop"],[]]'&&!col0.children.some(x=>x.line)&&w.style.opacity===""&&c.renders.length===1&&!c.listeners.pointerup, c.get("mdwCols('mom')"));
  const k=mk({}); const G2=fakeGrid(DEF); const w2=G2.widget("todo"); k.get("mdwDown")({target:{closest:()=>w2},pointerId:1,preventDefault(){}},"todo","mom");
  ok("a kid's device: the hold does nothing", w2.style.opacity===undefined&&!k.listeners.pointermove);
}
console.log("5. The strip");
{ const S=fn("momDayStripHTML");
  const at=t=>{ const i=S.indexOf(t); if(i<0) throw new Error("missing in strip: "+t); return i; };
  const chips=at("MC_SLOT_ORDER.forEach"), ongoing=at("colHd('🧹','Ongoing'"), todo=at("colHd('📝','To-do'"), shop=at("colHd('🛒','Shopping'"), laundry=at("colHd('🧺','Laundry'"), lay=at("const _W=h.split('\\u0001')");
  ok("the five pieces are drawn in order — chores, ongoing, to-do, shopping, laundry — split by markers, then laid out", chips<ongoing&&ongoing<todo&&todo<shop&&shop<laundry&&laundry<lay&&(S.match(/h\+='\\u0001';/g)||[]).length===4);
  ok("every header carries its grip id; the chores' grip rides the time-of-day chips", /colHd\('🧹','Ongoing',[^\n]*,'ongoing'\)/.test(S)&&/colHd\('📝','To-do',[^\n]*,'todo'\)/.test(S)&&/colHd\('🛒','Shopping','','shop'\)/.test(S)&&/colHd\('🧺','Laundry',[^\n]*,'laundry'\)/.test(S)&&/h\+=grip\('chores'\)\+'<\/div>';/.test(S));
  ok("the layout: this person's columns (mdwCols, default MYDAY_COLS), data-mdcol / data-mdw wrappers, a dashed divider only under a column's first widget", /mdwCols\(_mw\):\[\["chores","ongoing"\],\["todo","shop"\],\["laundry"\]\]/.test(S)&&/data-mdcol="'\+ci\+'"/.test(S)&&/data-mdw="'\+id\+'"'\+\(wi\?' style="margin-top:10px;padding-top:9px;border-top:1px dashed var\(--border\)"':''\)/.test(S));
  ok("↺ Reset layout shows only to someone who may arrange it, only when it's not the default", /_mdwCan\(_mw\)&&!mdwIsDefault\(_mw\)\) h\+=[^\n]*mdwReset\(\\''\+_mw\+'\\'\)/.test(S));
  ok("the same pieces as before, once each: to-do box, Start box, grocery add, line rows, spot check, wash today, kitchen question", ["id=\"'+P.todoInp+'\"",'id="laundry-label"',"P.shop()","llParentRowHTML(r,","spMomRowHTML(spR)","wtRowHTML(who)","ktAskHTML()","llMyDayLaundryHTML(P.dad?'dad':'mom')"].every(t=>(S.split(t).length-1)===1));
  ok("the grid is unchanged (auto-fit, 232px columns)", /grid-template-columns:repeat\(auto-fit,minmax\(232px,1fr\)\);gap:12px/.test(S));
  ok("the listener: settings/myDayOrder → myDayOrderOnValue, repaint", /db\.ref\("settings\/myDayOrder"\)\.on\("value",s=>\{ if\(typeof myDayOrderOnValue==="function"\) myDayOrderOnValue\(s\.val\(\)\);/.test(src));
  ok("writes in the block: settings/myDayOrder/<who> set and remove only, behind _mdwWrite", (BLOCK.match(/db\.ref\(/g)||[]).length===2&&/_mdwWrite\(\)\) db\.ref\("settings\/myDayOrder\/"\+who\)\.set\(cols\)/.test(BLOCK)&&/_mdwWrite\(\)\) db\.ref\("settings\/myDayOrder\/"\+who\)\.remove\(\)/.test(BLOCK));
}
ok("no 🔀", src.indexOf("🔀")<0);
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
