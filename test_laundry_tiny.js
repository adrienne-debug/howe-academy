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
const fn=name=>{ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); return src.slice(i,src.indexOf("\n}",i)+2); };
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

console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
