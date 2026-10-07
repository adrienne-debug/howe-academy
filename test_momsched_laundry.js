/*
 * 🧺 Laundry on the Mom-mode schedule (her asks 2026-10-07): a "started" marker, a "done" marker that asks
 * "block out time to move / fold it?" with HER minutes · [Now] [After <next open Mom card>] [Not now], and a REAL block:
 * her Mom cards lay around it while the kids keep working. Unanswered holds nothing, and the "After …" button follows
 * the next open card if she ignores it.            run: node test_momsched_laundry.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":"")); } };
const fn=name=>{ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); return src.slice(i,src.indexOf("\n}",i)+2); };
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("missing "+a); return src.slice(i,j); };
const MOMLOOP=cut("// MOMLOOP_START","// MOMLOOP_END");
const LTIMES=src.slice(src.indexOf("// 🧺 LAUNDRYTIMES (her ask"), src.indexOf("\n}\n",src.indexOf("function laundryTimesEditorHTML("))+3);
const MS=cut("// MOMSCHED_LAUNDRY_START","// MOMSCHED_LAUNDRY_END");
const MIDNIGHT=(()=>{ const d=new Date(); d.setHours(0,0,0,0); return d.getTime(); })();
const at=m=>MIDNIGHT+m*60000;   // a time today, as a laundry ts
const H=(h,m)=>h*60+(m||0);

let ID=0;
const card=(who,time,dur,mom,title)=>({id:who+"_"+(ID++),who,day:"thursday",mom:mom||"none",time,dur:dur||20,title:title||(who+" card")});
function mk(o){
  const ls={}, writes=[], renders=[];
  const ctx={console,ROSTER:o.roster||["lucy","ellis","lincoln"],checked:o.checked||{},momMoves:{},
    getActiveTasks:()=>o.tasks, morningComplete:()=>true, bbActive:()=>null, momHere:()=>true, adminPinUnlocked:true,
    cap:s=>String(s||"").charAt(0).toUpperCase()+String(s||"").slice(1), esc:s=>String(s==null?"":s).replace(/</g,"&lt;"),
    Object,Array,String,Number,parseInt,isNaN,Math,JSON,Date,RegExp,
    HA_LS:{getItem:k=>ls[k]||null,setItem:(k,v)=>{ ls[k]=v; }}, db:null, LAUNDRY_STAGES:["washer","dryer","fold"],
    laundryData:o.laundry||{}, KID_NAME:{lucy:"Lucy",ellis:"Ellis",lincoln:"Lincoln"},
    taskCard:t=>'<div class="tc">'+t.title+'</div>', _agLunchRow:()=>null, famIsMomCard:()=>false,
    inputs:{}, renders, writes, tab:"schedule", kid:"mom", day:"thursday"};
  ctx.document={getElementById:id=>ctx.inputs[id]||null};
  ctx._mlNowOverride=o.nowMin!=null?o.nowMin:H(10); ctx._mlLunchOverride=false;
  Object.defineProperty(ctx,"_todayDay",{get:()=>"thursday"});
  vm.createContext(ctx);
  vm.runInContext(fn("toMin")+"\n"+fn("fromMin")+"\n"+fn("mwTodayIso")+"\n"+MOMLOOP+"\n"+fn("laundrySince")+"\n"+LTIMES+"\n"+MS+"\n"
    +fn("momAgendaHtml")+"\n"+fn("laundryAdvance")+"\n"+fn("laundryAdvanceLabel"),ctx);
  vm.runInContext("momLoop="+JSON.stringify({cursor:0,order:o.roster||["lucy","ellis","lincoln"]})+";",ctx);
  const T={ctx,writes,renders,run:e=>vm.runInContext(e,ctx)};
  T.lay=()=>{ const laid=T.run("mlQueueLay("+JSON.stringify(o.tasks)+")"); T.laid=laid; T.at=id=>laid.find(t=>t.id===id).time; return laid; };
  T.agenda=()=>{ T.lay(); ctx.__d=T.laid.filter(t=>t.mom==="required"||t.mom==="maybe"); return T.run("momAgendaHtml(__d)"); };
  ctx.renderAll=()=>{ renders.push("all"); };
  T.dbOn=()=>{ ctx.db={ref:p=>({set:v=>writes.push(["set",p,v]),update:v=>writes.push(["update",p,v])})}; };
  return T;
}
// Lucy has two Mom cards from 10:00, Ellis one after; Lincoln works on his own. Towels went in at 9:00 (washer 60 → done 10:00).
const m1=card("lucy","10:00 AM",20,"required","Math — Lesson 12"), m2=card("lucy","10:20 AM",20,"required","Spelling"),
      e1=card("ellis","10:40 AM",20,"required","Reading"), own=card("lincoln","10:00 AM",30,"none","Independent Reading");
const TASKS=[m1,m2,e1,own];
const towels=()=>({a:{label:"Towels",stage:"washer",ts:at(H(9))}});

console.log("── the markers ──");
{ const T=mk({tasks:TASKS,laundry:towels()}); const A=T.agenda();
  ok("🫧 started marker at 9:00 (in the washer · started)", /9:00<span class="ampm">AM<\/span><\/div><div class="mom-col"><div class="ml-laundry"[^>]*><span[^>]*>🫧 <b>Towels<\/b> — in the washer · started 9:00/.test(A), A.slice(0,600));
  ok("✅ done marker at 10:00 — when the washer finishes (✎ Times), asking to block out time to move it", /10:00<span class="ampm">AM<\/span><\/div><div class="mom-col"><div class="ml-laundry"[^>]*><span[^>]*>✅ <b>Towels<\/b> is done in the washer\. Block out time to move it to the dryer\?/.test(A));
  ok("'How long?' box — her minutes, 5 to move it the first time", /How long\? <input id="lb-min-a_washer" type="number"[^>]*value="5"/.test(A));
  ok("[Now] [After Lucy's Math] [Not now]", /laundryBlockSet\('a','washer','now'\)[^>]*>Now</.test(A)&&new RegExp("laundryBlockSet\\('a','washer','after','"+m1.id+"'\\)[^>]*>After Lucy's Math<").test(A)&&/laundryBlockSet\('a','washer','skip'\)[^>]*>Not now</.test(A));
}
console.log("── she hasn't answered: nothing is held, and 'After …' follows the next open card ──");
{ const base=mk({tasks:TASKS,laundry:{}}); base.lay(); const B={m1:base.at(m1.id),m2:base.at(m2.id),e1:base.at(e1.id),own:base.at(own.id)};
  ok("baseline: Lucy 10:00 / 10:20, Ellis 10:40, Lincoln 10:00", B.m1==="10:00 AM"&&B.m2==="10:20 AM"&&B.e1==="10:40 AM"&&B.own==="10:00 AM", B);
  const T=mk({tasks:TASKS,laundry:towels()}); T.lay();
  ok("an unanswered question moves nothing", T.at(m1.id)===B.m1&&T.at(m2.id)===B.m2&&T.at(e1.id)===B.e1);
  const T2=mk({tasks:TASKS,laundry:towels(),checked:{[m1.id]:"10:18 AM"},nowMin:H(10,18)}); const A2=T2.agenda();
  ok("she ignores it and checks off Lucy's Math → the button becomes 'After Lucy's Spelling'", /After Lucy's Spelling</.test(A2)&&!/After Lucy's Math</.test(A2));
  const T3=mk({tasks:TASKS,laundry:towels(),checked:{[m1.id]:"10:18 AM",[m2.id]:"10:37 AM"},nowMin:H(10,37)});
  ok("…and on to Ellis's Reading when Lucy's are done", /After Ellis's Reading</.test(T3.agenda()));
}
console.log("── a REAL block ──");
{ const T=mk({tasks:TASKS,laundry:towels()}); T.dbOn(); T.agenda();
  T.ctx.inputs["lb-min-a_washer"]={value:"10"}; T.run("laundryBlockSet('a','washer','now')");
  ok("Now (10 min) → one targeted write for today's block", T.writes.some(w=>w[0]==="set"&&/^momBlocks\/\d{4}-\d\d-\d\d\/a_washer$/.test(w[1])&&w[2].at==="now"&&w[2].mins===10&&w[2].startMin===H(10)), T.writes);
  ok("…and her 10 minutes are remembered for next time (settings/laundryBlockMins/move)", T.writes.some(w=>w[1]==="settings/laundryBlockMins/move"&&w[2]===10)&&T.run("laundryBlockDefault('washer')")===10);
  T.lay();
  ok("her Mom cards step over 10:00–10:10: Lucy 10:10 / 10:30, Ellis 10:50", T.at(m1.id)==="10:10 AM"&&T.at(m2.id)==="10:30 AM"&&T.at(e1.id)==="10:50 AM", [T.at(m1.id),T.at(m2.id),T.at(e1.id)]);
  ok("the kids' own work keeps going (Lincoln still 10:00)", T.at(own.id)==="10:00 AM");
  const A=T.agenda();
  ok("the block shows at 10:00 with her minutes (editable) and the → Dryer button", /🧺 Move to the dryer: <b>Towels<\/b> · <input type="number"[^>]*value="10" onchange="laundryBlockMinsEdit\('a_washer',this\.value\)"[\s\S]*?laundryAdvance\('a'\)[^>]*>→ Dryer</.test(A));
  ok("no question once she's answered", !/Block out time/.test(A));
  T.run("laundryBlockMinsEdit('a_washer','25')"); T.lay();
  ok("she changes it to 25 min → Lucy waits until 10:25", T.at(m1.id)==="10:25 AM"&&T.writes.some(w=>w[0]==="update"&&w[2].mins===25));
  T.run("laundryAdvance('a')"); T.lay();
  ok("→ Dryer ends the block (done + when, written) and her cards come back", T.ctx.laundryData.a.stage==="dryer"&&T.writes.some(w=>w[0]==="update"&&w[2].done===true&&w[2].doneMin===H(10))&&T.at(m1.id)==="10:00 AM");
  ok("…the schedule repaints, not Mom's Day", T.renders.includes("all"));
  ok("…and today's timeline keeps a ✓ Moved row", /✓ Moved to the dryer: <b>Towels<\/b>/.test(T.agenda()));
}
{ const T=mk({tasks:TASKS,laundry:towels()}); T.agenda(); T.ctx.inputs["lb-min-a_washer"]={value:"15"};
  T.run("laundryBlockSet('a','washer','after','"+m1.id+"')"); T.lay();
  ok("After Lucy's Math (15 min) → laid right behind it: Math 10:00, Mom away 10:20–10:35, Spelling 10:35, Ellis 10:55",
    T.at(m1.id)==="10:00 AM"&&T.at(m2.id)==="10:35 AM"&&T.at(e1.id)==="10:55 AM"&&T.run("_mlBlkLaid['a_washer']")===H(10,20), [T.at(m2.id),T.at(e1.id)]);
  ok("the block shows in the 10:20 row", /10:20<span class="ampm">AM<\/span><\/div><div class="mom-col"><div class="ml-laundry"[^>]*><span[^>]*>🧺 Move to the dryer/.test(T.agenda()));
}
{ const T=mk({tasks:TASKS,laundry:towels(),checked:{[m1.id]:"10:12 AM"},nowMin:H(10,12)}); T.agenda(); T.ctx.inputs["lb-min-a_washer"]={value:"15"};
  T.run("laundryBlockSet('a','washer','after','"+m1.id+"')"); T.lay();
  ok("an 'After' card that's already checked → the block starts at its check-off (10:12–10:27), Spelling 10:27", T.at(m2.id)==="10:27 AM", T.at(m2.id));
}
{ const T=mk({tasks:TASKS,laundry:towels()}); T.agenda(); T.run("laundryBlockSet('a','washer','skip')"); T.lay(); const A=T.agenda();
  ok("Not now → nothing moves, the question goes, the done marker keeps the → Dryer button", T.at(m1.id)==="10:00 AM"&&!/Block out time/.test(A)&&/✅ <b>Towels<\/b> is done in the washer<\/span><button onclick="laundryAdvance\('a'\)"/.test(A));
}
console.log("── dryer, which days ──");
{ const T=mk({tasks:TASKS,laundry:{b:{label:"Sheets",stage:"dryer",ts:at(H(9))}}}); const A=T.agenda();
  ok("dryer: 'fold it', 15 min the first time", /Block out time to fold it\?/.test(A)&&/id="lb-min-b_dryer"[^>]*value="15"/.test(A));
  ok("only on today's schedule", T.run("momSchedLaundry('friday',[])").length===0);
  T.ctx.laundryData.b.ts=at(H(23,30)); ok("a load that finishes tomorrow shows only its started marker", T.run("momSchedLaundry('thursday',[])").length===1);
}
console.log("── wiring ──");
ok("the agenda gets the laundry rows with its cards", /momSchedLaundry\(day,dayTasks\)/.test(src)&&/c\.lau\.map\(x=>x\.html\)/.test(src));
ok("the Mom chain steps over the blocks", /const Ls=lunchOf\(e\.kid\)\.concat\(fixedOf\(e\.kid\)\)\.concat\(_blkIv\);/.test(src));
ok("listens for today's blocks and her minutes", /db\.ref\("momBlocks\/"\+mwTodayIso\(\)\)\.on\("value"/.test(src)&&/db\.ref\("settings\/laundryBlockMins"\)\.on\("value"/.test(src));
ok("the laundry listener repaints the Mom-mode schedule", /else if\(tab==="schedule"&&kid==="mom"\) renderAll\(\);   \/\/ MOMSCHED_LAUNDRY/.test(src));
ok("momAgendaHtml is what the Mom-mode schedule renders", /if\(kid==="mom" && unlocked\)\{\n\s*h\+=momAgendaHtml\(tasks\);/.test(src));
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
