/*
 * 🧺 LAUNDRY_FOLD (her report 2026-10-15, DeWalt, Taylor): "Laundry put itself back in the schedule for the washer and dryer
 * correctly, but then it completely disappeared for fold and put away in her schedule yesterday."
 *
 * Replay of the real day, from the DeWalt database (read-only): Wed 2026-10-14, routineLog/taylor/week2/wednesday — Taylor
 * checked "Start a load of laundry" (morning step 8) at 9:01 AM → KIDLAUNDRY wrote laundry/lk_week2_wednesday_taylor_mstep8
 * {label:"Taylor started laundry", stage:"washer", by:"taylor"}. settings/laundryTimes {wash:50, dry:60, grace:5},
 * settings/laundryBlockMins {move:5, fold:15}. momBlocks/2026-10-14 is empty — Sarah never blocked time; she moved the load along
 * from Mom's Day (→ Dryer, → Fold, ✓ Put away). momSchedLaundry skipped stage "fold", so the moment the load reached the fold
 * pile it had no row, no question, no block, and ✓ Put away was never on her schedule at all.
 *
 * The fix: the fold pile is a row the minute it lands (it has no machine clock) — "🧺 <load> is in the fold pile. Block out time
 * to put it away?" with How long · Now · After · Not now, a real block (step "putaway", 10 min the first time, remembered) her Mom
 * cards step over, ✓ Put away on the block, and "✓ Put away: <load>" kept where it ended. Washer / dryer / prewash: unchanged.
 *                                                                                                run: node test_laundry_fold.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,500)+")":"")); } };
const fn=name=>{ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); return src.slice(i,src.indexOf("\n}",i)+2); };
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("missing "+a); return src.slice(i,j); };
const MOMLOOP=cut("// MOMLOOP_START","// MOMLOOP_END");
const LTIMES=src.slice(src.indexOf("// 🧺 LAUNDRYTIMES (her ask"), src.indexOf("\n}\n",src.indexOf("function laundryTimesEditorHTML("))+3);
const MS=cut("// MOMSCHED_LAUNDRY_START","// MOMSCHED_LAUNDRY_END");
const KL=cut("// KIDLAUNDRY_START","// KIDLAUNDRY_END");
const MIDNIGHT=(()=>{ const d=new Date(); d.setHours(0,0,0,0); return d.getTime(); })();
const at=m=>MIDNIGHT+m*60000, H=(h,m)=>h*60+(m||0);
const ISO=(()=>{ const d=new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); })();

// ── the real shapes ──
const SK="week2_wednesday_taylor_mstep8", LID="lk_"+SK, STEP={cad:"wk:0,2,4",emoji:"🫧",label:"Start a load of laundry",pts:10};
const DW_TIMES={wash:50,dry:60,grace:5}, DW_BLOCK={move:5,fold:15};
let ID=0; const card=(who,time,dur,mom,title)=>({id:who+"_"+(ID++),who,day:"wednesday",mom:mom||"none",time,dur:dur||20,title:title||(who+" card")});

function mk(o){
  const ls={}, writes=[], renders=[];
  const ctx={console,ROSTER:["andrew","makenzie","taylor","caleb"],checked:{},momMoves:{},getActiveTasks:()=>o.tasks,morningComplete:()=>true,bbActive:()=>null,
    momHere:()=>true,adminPinUnlocked:true,cap:s=>String(s||"").charAt(0).toUpperCase()+String(s||"").slice(1),esc:s=>String(s==null?"":s).replace(/</g,"&lt;"),
    Object,Array,String,Number,parseInt,isNaN,Math,JSON,RegExp,HA_LS:{getItem:k=>ls[k]||null,setItem:(k,v)=>{ ls[k]=v; }},
    LAUNDRY_STAGES:["washer","dryer","fold"],laundryData:o.laundry||{},KID_NAME:{andrew:"Andrew",makenzie:"Makenzie",taylor:"Taylor",caleb:"Caleb"},
    taskCard:t=>'<div class="tc">'+t.title+'</div>',_agLunchRow:()=>null,famIsMomCard:()=>false,coSchoolEnd:()=>H(16,15),
    inputs:{},writes,renders,tab:"schedule",kid:"mom",day:"wednesday",_dryRun:()=>!!o.dry};
  // the replay clock: Date.now() is "now" on the schedule, so a tap's ts / startMin / doneMin all read the same minute
  class FakeDate extends Date { constructor(...a){ if(a.length) super(...a); else super(FakeDate.now()); } static now(){ return at(ctx._mlNowOverride); } }
  ctx.Date=FakeDate;
  ctx.document={getElementById:id=>ctx.inputs[id]||null};
  ctx._mlNowOverride=o.nowMin; ctx._mlLunchOverride=false;
  Object.defineProperty(ctx,"_todayDay",{get:()=>"wednesday"});
  ctx.renderAll=()=>{ renders.push("all"); };
  ctx.db={ref:p=>({set:v=>writes.push(["set",p,JSON.parse(JSON.stringify(v))]),update:v=>writes.push(["update",p,JSON.parse(JSON.stringify(v))]),remove:()=>writes.push(["rm",p])})};
  vm.createContext(ctx);
  vm.runInContext(fn("toMin")+"\n"+fn("fromMin")+"\n"+fn("mwTodayIso")+"\n"+MOMLOOP+"\n"+fn("laundrySince")+"\n"+LTIMES+"\n"+MS+"\n"+KL+"\n"
    +fn("momAgendaHtml")+"\n"+fn("laundryAdvance")+"\n"+fn("laundryAdvanceLabel"),ctx);
  vm.runInContext("momLoop="+JSON.stringify({cursor:0,order:["andrew","makenzie","taylor","caleb"]})+";laundryTimes="+JSON.stringify(DW_TIMES)+";laundryBlockMins="+JSON.stringify(o.block||DW_BLOCK)+";",ctx);
  const T={ctx,writes,renders,run:e=>vm.runInContext(e,ctx)};
  T.now=m=>{ ctx._mlNowOverride=m; };
  T.lay=()=>{ const laid=T.run("mlQueueLay("+JSON.stringify(o.tasks)+")"); T.laid=laid; T.at=id=>laid.find(t=>t.id===id).time; return laid; };
  T.agenda=()=>{ T.lay(); ctx.__d=T.laid.filter(t=>t.mom==="required"||t.mom==="maybe"); return T.run("momAgendaHtml(__d)"); };
  T.rowAt=(hhmm,re)=>new RegExp(hhmm.replace(/ /,'<span class="ampm">')+'</span></div><div class="mom-col">(?:<div class="ml-laundry"[^>]*>(?:(?!</div></div>).)*?</div>)*?<div class="ml-laundry"[^>]*><span[^>]*>'+re).test(T.A);
  return T;
}
const BOX_AT=(A,hhmm)=>{ const i=A.indexOf(hhmm.replace(/ /,'<span class="ampm">')+'</span>'); return i<0?"":A.slice(i,A.indexOf('<div class="mom-agenda-row">',i+1)<0?A.length:A.indexOf('<div class="mom-agenda-row">',i+1)); };

// Sarah's Mom cards that morning (shapes only): Andrew's Arithmetic needs Mom at 11:20, Makenzie's IEW at 11:40.
const a1=card("andrew","11:20 AM",20,"required","Arithmetic 2 — Lesson 41"), k1=card("makenzie","11:40 AM",20,"required","IEW Fables"), own=card("caleb","11:20 AM",20,"none","Reading");
const TASKS=[a1,k1,own];

console.log("── 9:01 AM Wed 10/14: Taylor checks 'Start a load of laundry' (KIDLAUNDRY, the real step and key) ──");
const T=mk({tasks:TASKS,laundry:{},nowMin:H(9,1)});
T.run("laundryKidHook('taylor',"+JSON.stringify(STEP)+",'"+SK+"',true)");
ok("laundry/"+LID+" = {Taylor started laundry, washer, by taylor} at 9:01", T.ctx.laundryData[LID]&&T.ctx.laundryData[LID].label==="Taylor started laundry"&&T.ctx.laundryData[LID].stage==="washer"&&T.ctx.laundryData[LID].by==="taylor"&&T.ctx.laundryData[LID].ts===at(H(9,1))
  &&T.writes.some(w=>w[0]==="set"&&w[1]==="laundry/"+LID), T.writes);

console.log("── the washer and the dryer, as she saw them ('put itself back correctly') ──");
T.now(H(9,2)); T.A=T.agenda();
ok("9:02 — 🫧 marker at 9:01, ⏳ done ~9:51 (wash 50)", T.rowAt("9:01 AM","🫧 <b>Taylor started laundry</b> — in the washer · started 9:01 AM")&&T.rowAt("9:51 AM","⏳ <b>Taylor started laundry</b> — done ~9:51 AM"), T.A);
T.now(H(9,55)); T.A=T.agenda();
ok("9:55 — ✅ done in the washer. Block out time to move it to the dryer? (How long 5)", T.rowAt("9:51 AM","✅ <b>Taylor started laundry</b> is done in the washer\\. Block out time to move it to the dryer\\?")&&/lb-min-lk_week2_wednesday_taylor_mstep8_washer[^>]*value="5"/.test(T.A), T.A);
T.now(H(10,5)); T.run("laundryAdvance('"+LID+"')");   // she taps → Dryer on Mom's Day (no block — momBlocks/2026-10-14 was empty)
ok("10:05 — → Dryer from Mom's Day: stage dryer, ts 10:05, laundry/<id> set, nothing in momBlocks", T.ctx.laundryData[LID].stage==="dryer"&&T.ctx.laundryData[LID].ts===at(H(10,5))&&T.run("Object.keys(momBlocks).length")===0);
T.now(H(10,6)); T.A=T.agenda();
ok("10:06 — 🌀 in the dryer · started 10:05, ⏳ done ~11:05 (dry 60); the washer rows are gone", T.rowAt("10:05 AM","🌀 <b>Taylor started laundry</b> — in the dryer · started 10:05 AM")&&T.rowAt("11:05 AM","⏳ <b>Taylor started laundry</b> — done ~11:05 AM")&&!/in the washer/.test(T.A), T.A);
T.now(H(11,10)); T.A=T.agenda();
ok("11:10 — ✅ done in the dryer. Block out time to fold it? (How long 15)", T.rowAt("11:05 AM","✅ <b>Taylor started laundry</b> is done in the dryer\\. Block out time to fold it\\?")&&/lb-min-lk_week2_wednesday_taylor_mstep8_dryer[^>]*value="15"/.test(T.A), T.A);

console.log("── 11:15 she taps → Fold on Mom's Day: the load is in the fold pile — this is where it vanished ──");
T.now(H(11,15)); T.run("laundryAdvance('"+LID+"')");
ok("stage fold, ts 11:15 (her tap)", T.ctx.laundryData[LID].stage==="fold"&&T.ctx.laundryData[LID].ts===at(H(11,15)));
T.now(H(11,16)); T.A=T.agenda();
ok("the load is still on her schedule (the bug: nothing mentioned it)", /Taylor started laundry/.test(T.A), T.A);
ok("one row at 11:15: '🧺 Taylor started laundry is in the fold pile. Block out time to put it away?'", T.rowAt("11:15 AM","🧺 <b>Taylor started laundry</b> is in the fold pile\\. Block out time to put it away\\?"), BOX_AT(T.A,"11:15 AM"));
ok("How long? 10 min the first time · Now · After Andrew's Arithmetic 2 · Not now (asks when)", /lb-min-lk_week2_wednesday_taylor_mstep8_fold[^>]*value="10"/.test(T.A)
  &&/laundryBlockSet\('lk_week2_wednesday_taylor_mstep8','fold','now'\)[^>]*>Now</.test(T.A)
  &&new RegExp("laundryBlockSet\\('lk_week2_wednesday_taylor_mstep8','fold','after','"+a1.id+"'\\)[^>]*>After Andrew's Arithmetic 2<").test(T.A)
  &&/laundryWhenToggle\('lk_week2_wednesday_taylor_mstep8_fold'\)[^>]*>Not now</.test(T.A), BOX_AT(T.A,"11:15 AM"));
ok("no ⏳ wait (the pile has no clock), no leftover dryer rows, no 🫧/🌀 marker for the pile", !/⏳/.test(T.A)&&!/in the dryer/.test(T.A)&&!/🌀 <b>Taylor/.test(T.A)&&!/🫧 <b>Taylor/.test(T.A), T.A);
ok("unanswered holds nothing: Andrew 11:20, Makenzie 11:40, Caleb 11:20", T.at(a1.id)==="11:20 AM"&&T.at(k1.id)==="11:40 AM"&&T.at(own.id)==="11:20 AM", [T.at(a1.id),T.at(k1.id),T.at(own.id)]);

console.log("── 11:20 she taps Now: a real put-away block her Mom cards step over ──");
T.now(H(11,20)); T.writes.length=0; T.run("laundryBlockSet('"+LID+"','fold','now')"); T.A=T.agenda();
ok("momBlocks/<today>/lk_…_fold {at:now, stage:fold, mins:10, startMin:11:20, load, label} — one targeted set", T.writes.filter(w=>w[0]==="set"&&w[1]==="momBlocks/"+ISO+"/"+LID+"_fold").length===1
  &&(w=>w&&w[2].at==="now"&&w[2].stage==="fold"&&w[2].mins===10&&w[2].startMin===H(11,20)&&w[2].load===LID&&w[2].label==="Taylor started laundry")(T.writes.find(w=>w[1]==="momBlocks/"+ISO+"/"+LID+"_fold")), T.writes);
ok("her minutes remembered under settings/laundryBlockMins/putaway (move and fold untouched)", T.writes.some(w=>w[0]==="set"&&w[1]==="settings/laundryBlockMins/putaway"&&w[2]===10)&&T.run("laundryBlockDefault('washer')")===5&&T.run("laundryBlockDefault('dryer')")===15&&T.run("laundryBlockDefault('fold')")===10);
ok("only those two paths were written", T.writes.every(w=>w[1]==="momBlocks/"+ISO+"/"+LID+"_fold"||w[1]==="settings/laundryBlockMins/putaway"), T.writes.map(w=>w[1]));
ok("momBlockOpen() holds it: 11:20–11:30", (b=>b.length===1&&b[0].at==="now"&&b[0].startMin===H(11,20)&&b[0].mins===10)(T.run("momBlockOpen()")), T.run("momBlockOpen()"));
ok("Andrew's Arithmetic steps over it → 11:30, Makenzie follows Mom's chain → 11:50; Caleb's own work stays 11:20", T.at(a1.id)==="11:30 AM"&&T.at(k1.id)==="11:50 AM"&&T.at(own.id)==="11:20 AM", [T.at(a1.id),T.at(k1.id),T.at(own.id)]);
ok("the block row at 11:20: '🧺 Put away: Taylor started laundry · [10] min' with the ✓ Put away button", T.rowAt("11:20 AM","🧺 Put away: <b>Taylor started laundry</b> · <input type=\"number\"[^>]*value=\"10\" onchange=\"laundryBlockMinsEdit\\('lk_week2_wednesday_taylor_mstep8_fold',this\\.value\\)\"")
  &&new RegExp("laundryAdvance\\('"+LID+"'\\)[^>]*>✓ Put away<").test(BOX_AT(T.A,"11:20 AM")), BOX_AT(T.A,"11:20 AM"));
ok("the pile row stays at 11:15 as a marker, the question is gone", T.rowAt("11:15 AM","🧺 <b>Taylor started laundry</b> is in the fold pile</span>")&&!/Block out time/.test(T.A), T.A);
ok("the schedule repainted", T.renders.includes("all"));

console.log("── 11:25 ✓ Put away ──");
T.now(H(11,25)); T.writes.length=0; T.run("laundryAdvance('"+LID+"')"); T.A=T.agenda();
ok("laundry/<id> removed; the block marked done at 11:25 (update); nothing else written", T.writes.some(w=>w[0]==="rm"&&w[1]==="laundry/"+LID)
  &&T.writes.some(w=>w[0]==="update"&&w[1]==="momBlocks/"+ISO+"/"+LID+"_fold"&&w[2].done===true&&w[2].doneMin===H(11,25))&&T.writes.length===2, T.writes);
ok("the load is gone from laundryData and from momBlockOpen()", !T.ctx.laundryData[LID]&&T.run("momBlockOpen()").length===0);
ok("'✓ Put away: Taylor started laundry' kept on the timeline at 11:25", T.rowAt("11:25 AM","✓ Put away: <b>Taylor started laundry</b>"), T.A);
ok("no live row, no question, no block left for the load", !/is in the fold pile/.test(T.A)&&!/Block out time/.test(T.A)&&!/🧺 Put away:/.test(T.A), T.A);
ok("Andrew's Arithmetic is free again — laid from now (11:25), no block ahead of it", T.at(a1.id)==="11:25 AM", T.at(a1.id));

console.log("── Not now → When? → a time, Don't schedule it, After ──");
{ const T2=mk({tasks:TASKS,laundry:{[LID]:{label:"Taylor started laundry",stage:"fold",ts:at(H(11,15)),by:"taylor"}},nowMin:H(11,16)}); T2.A=T2.agenda();
  T2.run("laundryWhenToggle('"+LID+"_fold')"); T2.A=T2.agenda();
  ok("Not now opens When? (In 30 min · In 1 hr · After school · a time · Don't schedule it)", /⏰ When\?/.test(T2.A)&&/'later',null,706\)[^>]*>In 30 min</.test(T2.A)&&/After school \(4:15 PM\)/.test(T2.A)&&/'skip'\)"[^>]*>Don't schedule it</.test(T2.A), T2.A);
  T2.run("laundryBlockSet('"+LID+"','fold','later',null,"+H(11,46)+")"); T2.A=T2.agenda();
  ok("In 30 min → ⏰ 🧺 Put away at 11:46, a real block; the load stays in the pile", T2.rowAt("11:46 AM","⏰ 🧺 Put away: <b>Taylor started laundry</b>")&&T2.run("momBlockOpen()").some(b=>b.at==="later"&&b.startMin===H(11,46))&&T2.ctx.laundryData[LID].stage==="fold", T2.A);
  ok("Makenzie's 11:40 steps over 11:46–11:56 → 11:56; Andrew untouched", T2.at(k1.id)==="11:56 AM"&&T2.at(a1.id)==="11:20 AM", [T2.at(a1.id),T2.at(k1.id)]);
}
{ const T3=mk({tasks:TASKS,laundry:{[LID]:{label:"Taylor started laundry",stage:"fold",ts:at(H(11,15)),by:"taylor"}},nowMin:H(11,16)}); T3.agenda();
  T3.run("laundryBlockSet('"+LID+"','fold','skip')"); T3.A=T3.agenda();
  ok("Don't schedule it: the pile row keeps ✓ Put away, no block, nothing held", T3.rowAt("11:15 AM","🧺 <b>Taylor started laundry</b> is in the fold pile</span><button onclick=\"laundryAdvance\\('"+LID+"'\\)\"[^>]*>✓ Put away<")&&T3.run("momBlockOpen()").length===0&&T3.at(a1.id)==="11:20 AM", T3.A);
  T3.now(H(11,30)); T3.run("laundryAdvance('"+LID+"')"); T3.A=T3.agenda();
  ok("✓ Put away after a skip: the load is gone and nothing is drawn (a skipped block leaves no ✓ row — as the washer/dryer do)", !T3.ctx.laundryData[LID]&&!/Taylor started laundry/.test(T3.A), T3.A);
}
{ const T4=mk({tasks:TASKS,laundry:{[LID]:{label:"Taylor started laundry",stage:"fold",ts:at(H(11,15)),by:"taylor"}},nowMin:H(11,16)}); T4.agenda();
  T4.run("laundryBlockSet('"+LID+"','fold','after','"+a1.id+"')"); T4.A=T4.agenda();
  ok("After Andrew's Arithmetic: laid behind it — Andrew 11:20, put away 11:40–11:50, Makenzie 11:50", T4.at(a1.id)==="11:20 AM"&&T4.run("_mlBlkLaid['"+LID+"_fold']")===H(11,40)&&T4.at(k1.id)==="11:50 AM", [T4.at(a1.id),T4.at(k1.id),T4.run("_mlBlkLaid['"+LID+"_fold']")]);
  ok("…and the block row sits in the 11:40 row", T4.rowAt("11:40 AM","🧺 Put away: <b>Taylor started laundry</b>"), T4.A);
}

console.log("── edges ──");
{ const T5=mk({tasks:TASKS,laundry:{old:{label:"Towels",stage:"fold",ts:at(H(9))-24*60*60000}},nowMin:H(10)}); T5.A=T5.agenda();
  ok("a pile from yesterday shows at now (10:00), still asking", T5.rowAt("10:00 AM","🧺 <b>Towels</b> is in the fold pile\\. Block out time to put it away\\?"), T5.A); }
{ const T6=mk({tasks:TASKS,laundry:{[LID]:{label:"Taylor started laundry",stage:"fold",ts:at(H(11,15)),by:"taylor"}},nowMin:H(11,16),dry:true}); T6.agenda();
  T6.run("laundryBlockSet('"+LID+"','fold','now')");
  ok("?dryrun=1: the block lives locally, nothing is written", T6.run("momBlockOpen()").length===1&&T6.writes.length===0, T6.writes); }
{ const T7=mk({tasks:TASKS,laundry:{[LID]:{label:"Taylor started laundry",stage:"fold",ts:at(H(11,15)),by:"taylor"}},nowMin:H(11,16),block:{move:5,fold:15,putaway:20}}); T7.A=T7.agenda();
  ok("a remembered put-away time (20) is the How long default next time", /lb-min-lk_week2_wednesday_taylor_mstep8_fold[^>]*value="20"/.test(T7.A), T7.A); }
{ const T8=mk({tasks:TASKS,laundry:{[LID]:{label:"Taylor started laundry",stage:"fold",ts:at(H(11,15)),by:"taylor"}},nowMin:H(11,16)});
  ok("only today's schedule", T8.run("momSchedLaundry('thursday',[])").length===0); }
{ const T9=mk({tasks:TASKS,laundry:{b:{label:"💦 Sheets (king)",stage:"bin",ts:at(H(7,40)),wet:true}},nowMin:H(10)}); T9.A=T9.agenda();
  ok("the wash-today bin still draws nothing (no clock, not in the machines)", !/Sheets/.test(T9.A), T9.A); }

console.log("── the code ──");
ok("laundryBlockStep: washer→move, dryer→fold, fold→putaway", /function laundryBlockStep\(stage\)\{ return stage==="dryer"\?"fold":stage==="fold"\?"putaway":"move"; \}/.test(src));
ok("laundryBlockDefault: 5 / 15 / 10", /\(k==="fold"\?15:k==="putaway"\?10:5\)/.test(src));
ok("the MOMSCHED_LAUNDRY loop takes stage fold and names the fix", /l\.stage!=="prewash"&&l\.stage!=="fold"\)\) return;/.test(MS)&&/LAUNDRY_FOLD \(her report 2026-10-15/.test(MS));
ok("the finished row says ✓ Put away for a fold block", /b\.stage==="fold"\?'Put away: ':b\.stage==="dryer"\?'Folded: '/.test(MS));
ok("laundryAdvance is untouched (→ Fold still ends the dryer block; ✓ Put away still removes the load)", /laundryBlockDone\(id,l\.stage\)/.test(fn("laundryAdvance"))&&/delete laundryData\[id\]; \/\/ put away — load complete/.test(fn("laundryAdvance")));
ok("Mom's Day card, the NOW nudge and Dad's schedule are not changed by this fix", /function mdCardLaundry\(noAdd\)\{   \/\/ 🧺 LAUNDRYADD/.test(src)&&/function laundryNudgeKind\(l,now\)\{/.test(src)&&/function dadSchedLaundry\(\)\{/.test(src));

console.log(pass+" passed, "+fail+" failed"); if(fail) process.exit(1);
