/*
 * 🧺 LAUNDRY_TINY (audit_laundry 2026-10-15, holes 10 and 11).
 *  Hole 10: laundryDel removed laundry/<id> but left momBlocks/<iso>/<load>_<stage> behind → it now removes that block too.
 *  Hole 11: a kid-started load (by:<kid>) that was never a load redrew "done in the washer. Block out time?" every day with
 *           no way off the schedule → "✕ not a load" on the schedule's ✅ row (kid loads, Mom mode only) → laundryDel.
 *                                                                                                run: node test_laundry_tiny.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,500)+")":"")); } };
const fn=name=>{ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name);
  const line=src.slice(i,src.indexOf("\n",i)); let d=0; for(const ch of line){ if(ch==="{") d++; else if(ch==="}") d--; }
  if(d===0&&/\}\s*(\/\/.*)?$/.test(line)) return line;   // a one-line function ends on its own line (after MOMBLOCKS_DAYROLL a `let` follows _lbWrite / momBlocksOnValue — never over-read into it)
  return src.slice(i,src.indexOf("\n}",i)+2); };
const ISO=(()=>{ const d=new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); })();

function mkDel(o){
  const writes=[], renders=[], ls={};
  const ctx={console,Object,JSON,String,HA_LS:{getItem:k=>ls[k]||null,setItem:(k,v)=>{ ls[k]=v; }},writes,renders,
    laundryData:o.laundry,momBlocks:o.blocks,confirm:()=>true,tab:o.tab||"momsplan",renderAll:()=>renders.push("all"),renderMomsPlan:()=>renders.push("plan"),
    document:{getElementById:()=>({})},_dryRun:()=>!!o.dry};
  ctx.db={ref:p=>({set:v=>writes.push(["set",p]),update:v=>writes.push(["update",p]),remove:()=>writes.push(["rm",p])})};
  vm.createContext(ctx);
  vm.runInContext(fn("mwTodayIso")+"\n"+fn("_lbWrite")+"\n"+fn("momBlockKey")+"\n"+fn("momBlocksOnValue")+"\n"+fn("_cuDropBlock")+"\n"+fn("laundryDel"),ctx);
  return {ctx,writes,renders,run:e=>vm.runInContext(e,ctx)};
}

console.log("── hole 10: ✕ on a load takes its open block with it ──");
{
  const K="L1_washer", T=mkDel({laundry:{L1:{label:"Mine",stage:"washer",ts:1},L2:{label:"Other",stage:"washer",ts:1}},
    blocks:{[K]:{iso:ISO,load:"L1",stage:"washer",at:"now",mins:5},L2_washer:{iso:ISO,load:"L2",stage:"washer",at:"now",mins:5}}});
  T.run("laundryDel('L1')");
  ok("laundry/L1 removed", T.writes.some(w=>w[0]==="rm"&&w[1]==="laundry/L1"), T.writes);
  ok("momBlocks/<iso>/L1_washer removed (targeted)", T.writes.some(w=>w[0]==="rm"&&w[1]==="momBlocks/"+ISO+"/"+K), T.writes);
  ok("exactly those two writes", T.writes.length===2, T.writes);
  ok("local state: load and its block gone, the other load's block kept", !T.run("laundryData.L1")&&!T.run("momBlocks.L1_washer")&&!!T.run("momBlocks.L2_washer")&&!!T.run("laundryData.L2"));
}
{
  const T=mkDel({laundry:{L1:{label:"Mine",stage:"dryer",ts:1}},blocks:{}}); T.run("laundryDel('L1')");
  ok("a load with no block: only laundry/L1 removed", T.writes.length===1&&T.writes[0][1]==="laundry/L1", T.writes);
}
{
  const T=mkDel({laundry:{L1:{label:"Mine",stage:"washer",ts:1}},blocks:{L1_washer:{iso:ISO,mins:5}},dry:true}); T.run("laundryDel('L1')");
  ok("?dryrun=1: the block remove is inert (no momBlocks write)", !T.writes.some(w=>/^momBlocks/.test(w[1])), T.writes);
}

console.log("\n── hole 11: '✕ not a load' on the schedule's ✅ row, kid loads only, Mom mode only ──");
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("missing "+a); return src.slice(i,j); };
const MIDNIGHT=(()=>{ const d=new Date(); d.setHours(0,0,0,0); return d.getTime(); })();
function mkSched(o){
  const writes=[], renders=[], ls={};
  const ctx={console,Object,Array,String,Number,parseInt,isNaN,Math,JSON,RegExp,HA_LS:{getItem:k=>ls[k]||null,setItem:(k,v)=>{ ls[k]=v; }},writes,renders,
    esc:s=>String(s==null?"":s).replace(/</g,"&lt;"),cap:s=>String(s||""),KID_NAME:{},LAUNDRY_STAGES:["washer","dryer","fold"],
    laundryData:o.laundry,momHere:()=>o.mom!==false,checked:{},confirm:()=>true,tab:"schedule",renderAll:()=>renders.push("all"),
    document:{getElementById:()=>({})},_dryRun:()=>false,laundryTimes:{wash:50,dry:60,grace:5},laundryBlockMins:{}};
  class FD extends Date { constructor(...a){ if(a.length) super(...a); else super(FD.now()); } static now(){ return MIDNIGHT+o.nowMin*60000; } }
  ctx.Date=FD; Object.defineProperty(ctx,"_todayDay",{get:()=>"wednesday"});
  ctx.db={ref:p=>({set:()=>writes.push(["set",p]),update:()=>writes.push(["update",p]),remove:()=>writes.push(["rm",p])})};
  vm.createContext(ctx);
  vm.runInContext(fn("toMin")+"\n"+fn("fromMin")+"\n"+fn("mwTodayIso")+"\n"+fn("laundrySince")+"\n"+fn("_lbWrite")+"\n"+fn("_cuDropBlock")+"\n"+fn("laundryDel")+"\n"+fn("laundryAdvanceLabel")+"\n"
    +cut("// 🧺 LAUNDRYTIMES (her ask","function laundryTimesEditorHTML(")+"\n"+cut("// MOMSCHED_LAUNDRY_START","// MOMSCHED_LAUNDRY_END")+"\n"+cut("// KIDLAUNDRY_START","// KIDLAUNDRY_END"),ctx);
  return {ctx,writes,renders,html:()=>vm.runInContext("momSchedLaundry('wednesday',[]).map(r=>r.html).join('')",ctx),run:e=>vm.runInContext(e,ctx)};
}
const NOT="laundryDel\\('([^']+)'\\)[^>]*>✕ not a load<";
const kid=()=>({KL:{label:"Taylor started laundry",stage:"washer",ts:MIDNIGHT+9*3600000,by:"taylor"}});
const mom=()=>({ML:{label:"Sheets",stage:"washer",ts:MIDNIGHT+9*3600000}});
{
  const T=mkSched({laundry:kid(),nowMin:12*60}), h=T.html();
  ok("kid load, Mom mode: the ✅ question row carries '✕ not a load' → laundryDel('KL')", /Block out time to move it to the dryer/.test(h)&&new RegExp(NOT).exec(h)&&new RegExp(NOT).exec(h)[1]==="KL", h);
  T.run("laundryDel('KL')");
  ok("tapping it runs laundryDel: laundry/KL removed, schedule repainted, nothing else written", T.writes.length===1&&T.writes[0][0]==="rm"&&T.writes[0][1]==="laundry/KL"&&T.renders.includes("all"), [T.writes,T.renders]);
  ok("…and the row is gone", !/Taylor started laundry/.test(T.html()));
}
{
  const h=mkSched({laundry:kid(),nowMin:12*60,mom:false}).html();
  ok("kid load, NOT Mom mode: the ✅ row draws but without ✕ not a load", /Block out time/.test(h)&&!/not a load/.test(h), h);
}
{
  const h=mkSched({laundry:mom(),nowMin:12*60}).html();
  ok("a Mom-started load (no by:): ✅ row draws without ✕ not a load", /Block out time/.test(h)&&!/not a load/.test(h), h);
}
{
  const T=mkSched({laundry:kid(),nowMin:12*60}); 
  T.run("momBlocks['KL_washer']={iso:mwTodayIso(),load:'KL',stage:'washer',label:'Taylor started laundry',at:'skip',mins:5}");
  ok("answered 'Don't schedule it' (skip) row also has the ✕", new RegExp(NOT).test(T.html()));
  T.run("momBlocks['KL_washer'].at='now'; momBlocks['KL_washer'].startMin=720");
  ok("answered Now: the ✅ marker row has the ✕ too", new RegExp(NOT).test(T.html()));
}

console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
