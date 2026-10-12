/*
 * 🧺 LAUNDRY_NOTYET (her report 2026-10-12, DeWalt): the Mom schedule asked "done in the washer — block out time?" the moment a
 * load went IN, drawn at its future done time. Sarah's "Mine" went in at 10:15 (wash 50 → 11:05); at 10:16 the row already said
 * done, she tapped Now, and the 5-min block landed at 10:16 — before the washer finished. Now: until the cycle is really over the
 * row only says "⏳ done ~11:05"; the ✅ question (How long · Now · After · Not now) appears once that time has passed.
 *                                                                                              run: node test_laundry_notyet.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,400)+")":"")); } };
const fn=name=>{ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); return src.slice(i,src.indexOf("\n}",i)+2); };
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("missing "+a); return src.slice(i,j); };
const MOMLOOP=cut("// MOMLOOP_START","// MOMLOOP_END");
const LTIMES=src.slice(src.indexOf("// 🧺 LAUNDRYTIMES (her ask"), src.indexOf("\n}\n",src.indexOf("function laundryTimesEditorHTML("))+3);
const MS=cut("// MOMSCHED_LAUNDRY_START","// MOMSCHED_LAUNDRY_END");
const MIDNIGHT=(()=>{ const d=new Date(); d.setHours(0,0,0,0); return d.getTime(); })();
const at=m=>MIDNIGHT+m*60000, H=(h,m)=>h*60+(m||0);
let ID=0; const card=(who,time,dur,mom,title)=>({id:who+"_"+(ID++),who,day:"thursday",mom:mom||"none",time,dur:dur||20,title:title||(who+" card")});
function mk(o){
  const ls={}, writes=[];
  const ctx={console,ROSTER:["lucy","ellis"],checked:{},momMoves:{},getActiveTasks:()=>o.tasks,morningComplete:()=>true,bbActive:()=>null,momHere:()=>true,adminPinUnlocked:true,
    cap:s=>String(s||"").charAt(0).toUpperCase()+String(s||"").slice(1), esc:s=>String(s==null?"":s).replace(/</g,"&lt;"),
    Object,Array,String,Number,parseInt,isNaN,Math,JSON,Date,RegExp,HA_LS:{getItem:k=>ls[k]||null,setItem:(k,v)=>{ ls[k]=v; }},db:null,
    laundryData:o.laundry||{},KID_NAME:{lucy:"Lucy",ellis:"Ellis"},taskCard:t=>'<div class="tc">'+t.title+'</div>',_agLunchRow:()=>null,famIsMomCard:()=>false,
    inputs:{},writes,tab:"schedule",kid:"mom",day:"thursday",renderAll:()=>{}};
  ctx.document={getElementById:id=>ctx.inputs[id]||null};
  ctx._mlNowOverride=o.nowMin; ctx._mlLunchOverride=false;
  Object.defineProperty(ctx,"_todayDay",{get:()=>"thursday"});
  vm.createContext(ctx);
  vm.runInContext(fn("toMin")+"\n"+fn("fromMin")+"\n"+fn("mwTodayIso")+"\n"+MOMLOOP+"\n"+fn("laundrySince")+"\n"+LTIMES+"\n"+MS+"\n"+fn("momAgendaHtml")+"\n"+fn("laundryAdvance")+"\n"+fn("laundryAdvanceLabel"),ctx);
  vm.runInContext("momLoop="+JSON.stringify({cursor:0,order:["lucy","ellis"]})+";",ctx);
  if(o.times) vm.runInContext("laundryTimes="+JSON.stringify(o.times)+";",ctx);
  const T={ctx,run:e=>vm.runInContext(e,ctx)};
  T.agenda=()=>{ const laid=T.run("mlQueueLay("+JSON.stringify(o.tasks)+")"); ctx.__d=laid.filter(t=>t.mom==="required"||t.mom==="maybe"); return T.run("momAgendaHtml(__d)"); };
  return T;
}
const m1=card("lucy","10:00 AM",20,"required","Math — Lesson 12"), TASKS=[m1];
// Sarah's morning, DeWalt times: wash 50, dry 60, grace 5. "Mine" went into the washer at 10:15 → done 11:05.
const DW={wash:50,dry:60,grace:5};
const mine=()=>({a:{label:"Mine",stage:"washer",ts:at(H(10,15))}});
console.log("── 10:16, one minute after the load went in ──");
{ const T=mk({tasks:TASKS,laundry:mine(),times:DW,nowMin:H(10,16)}); const A=T.agenda();
  ok("🫧 started marker at 10:15", /10:15<span class="ampm">AM<\/span><\/div><div class="mom-col"><div class="ml-laundry"[^>]*><span[^>]*>🫧 <b>Mine<\/b> — in the washer · started 10:15/.test(A), A);
  ok("⏳ waiting row at 11:05: 'Mine — done ~11:05'", /11:05<span class="ampm">AM<\/span><\/div><div class="mom-col"><div class="ml-laundry"[^>]*><span[^>]*>⏳ <b>Mine<\/b> — done ~11:05 AM<\/span>/.test(A), A);
  ok("no '✅ done' and no 'Block out time' question yet", !/is done in the washer/.test(A)&&!/Block out time/.test(A));
  ok("no Now / After / Not now buttons and no How long box yet", !/laundryBlockSet\('a','washer','now'\)/.test(A)&&!/lb-min-a_washer/.test(A)&&!/laundryWhenToggle/.test(A));
  ok("a Now tap can't land a block before the load is done (no button to tap) — momBlocks stays empty", T.run("Object.keys(momBlocks).length")===0);
}
console.log("── 11:05, the minute the washer finishes ──");
{ const T=mk({tasks:TASKS,laundry:mine(),times:DW,nowMin:H(11,5)}); const A=T.agenda();
  ok("✅ 'Mine is done in the washer. Block out time to move it to the dryer?' at 11:05", /11:05<span class="ampm">AM<\/span><\/div><div class="mom-col"><div class="ml-laundry"[^>]*><span[^>]*>✅ <b>Mine<\/b> is done in the washer\. Block out time to move it to the dryer\?/.test(A), A);
  ok("How long (5) · Now · After Lucy's Math · Not now are back", /lb-min-a_washer[^>]*value="5"/.test(A)&&/laundryBlockSet\('a','washer','now'\)/.test(A)&&/After Lucy's Math/.test(A)&&/laundryWhenToggle\('a_washer'\)/.test(A));
  ok("no ⏳ waiting row once it is done", !/⏳ <b>Mine<\/b>/.test(A));
}
console.log("── 11:20, she taps Now ──");
{ const T=mk({tasks:TASKS,laundry:mine(),times:DW,nowMin:H(11,20)}); T.agenda(); T.run("laundryBlockSet('a','washer','now')"); const A=T.agenda();
  ok("block stored at 11:20 (her tap), at:'now', 5 min", T.run("momBlocks.a_washer.startMin")===H(11,20)&&T.run("momBlocks.a_washer.at")==="now"&&T.run("momBlocks.a_washer.mins")===5, T.run("JSON.stringify(momBlocks)"));
  ok("🧺 'Move to the dryer: Mine' row drawn at 11:20, not 10:15", /11:20<span class="ampm">AM<\/span><\/div><div class="mom-col"><div class="ml-laundry"[^>]*><span[^>]*>🧺 Move to the dryer: <b>Mine<\/b>/.test(A)&&!/10:15<span class="ampm">AM<\/span><\/div><div class="mom-col"><div class="ml-laundry"[^>]*><span[^>]*>🧺/.test(A), A);
}
console.log("── the dryer works the same ──");
{ const T=mk({tasks:TASKS,laundry:{k:{label:"Kids",stage:"dryer",ts:at(H(10,16))}},times:DW,nowMin:H(10,30)}); const A=T.agenda();
  ok("10:30: '⏳ Kids — done ~11:16', no 'fold it' question", /⏳ <b>Kids<\/b> — done ~11:16 AM/.test(A)&&!/fold it/.test(A)&&!/is done in the dryer/.test(A), A);
  const T2=mk({tasks:TASKS,laundry:{k:{label:"Kids",stage:"dryer",ts:at(H(10,16))}},times:DW,nowMin:H(11,30)}); const A2=T2.agenda();
  ok("11:30: '✅ Kids is done in the dryer. Block out time to fold it?' with How long 15", /✅ <b>Kids<\/b> is done in the dryer\. Block out time to fold it\?/.test(A2)&&/lb-min-k_dryer[^>]*value="15"/.test(A2), A2);
}
console.log("── an answered block is unchanged, whatever the clock says ──");
{ const T=mk({tasks:TASKS,laundry:mine(),times:DW,nowMin:H(11,20)}); T.agenda(); T.run("laundryBlockSet('a','washer','now')");
  T.run("_mlNowOverride="+H(11,21)); const A=T.agenda();
  ok("answered: ✅ done row + the 🧺 block row, no ⏳, no question", /✅ <b>Mine<\/b> is done in the washer<\/span>/.test(A)&&/🧺 Move to the dryer: <b>Mine<\/b>/.test(A)&&!/⏳/.test(A)&&!/Block out time/.test(A), A);
}
console.log("── the old behaviour for an unknown done time is untouched ──");
{ const T=mk({tasks:TASKS,laundry:{f:{label:"Folded",stage:"fold",ts:at(H(9))}},times:DW,nowMin:H(10)}); const A=T.agenda();
  ok("a folded load draws nothing on the schedule", !/Folded/.test(A), A); }
console.log(pass+" passed, "+fail+" failed"); if(fail) process.exit(1);
