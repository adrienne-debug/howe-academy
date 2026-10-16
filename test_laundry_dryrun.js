/* 🧺 Laundry taps honor ?dryrun=1 (AUDIT_laundry_2026-10-15 hole 5): laundryAdd, laundryAdvance, laundryDel,
 * laundryKidHook and laundryTimesSave write through _lbWrite() (db && !_dryRun()). Dry run: no write, local state
 * still moves so the screen behaves. Live: the same path and shape as before.   run: node test_laundry_dryrun.js */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":"")); } };
function fn(name){ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); let d=0; for(let k=src.indexOf("{",i);k<src.length;k++){ if(src[k]==="{") d++; else if(src[k]==="}"&&--d===0) return src.slice(i,k+1); } }
const FIVE=["laundryAdd","laundryAdvance","laundryDel","laundryKidHook","laundryTimesSave"];
const stages=src.slice(src.indexOf("const LAUNDRY_STAGES"), src.indexOf("\n", src.indexOf("const LAUNDRY_STAGES")));
const code=[stages,"function _cuDropBlock(){ return null; }   /* PR 59: laundryDel drops the load's block — stand-in, not under test here */",fn("_dryRun"),fn("_lbWrite"),fn("laundryT"),fn("laundryFoldHrs"),fn("laundryStartGuess"),fn("laundryStarts"),fn("laundryKidId")].concat(FIVE.map(fn)).join("\n");

function mk(dry){
  const writes=[], ls={}, inputs={};
  const ctx={console,JSON,Date,Math,parseInt,String,
    location:{search:dry?"?dryrun=1":""},
    HA_LS:{getItem:k=>(k in ls?ls[k]:null),setItem:(k,v)=>{ ls[k]=v; }},
    db:{ref:p=>({set:v=>writes.push(["set",p,JSON.parse(JSON.stringify(v))]),remove:()=>writes.push(["remove",p])})},
    laundryData:{}, laundryTimes:{}, laundryEditOpen:true,
    KID_NAME:{taylor:"Taylor"}, cap:s=>s, day:"monday", _todayDay:"monday",
    confirm:()=>true, mwToast:()=>{}, renderMomsPlan:()=>{}, laundryBlockDone:()=>{}, laundryAwayRemember:()=>{},
    document:{getElementById:id=>id==="content"?{}:(inputs[id]||null)}, inputs};
  vm.createContext(ctx); vm.runInContext(code,ctx);
  return {ctx,writes,ls,inputs,run:e=>vm.runInContext(e,ctx)};
}
// One scenario, run live and dry: every one of the five, every write site (Advance has three, KidHook two).
function scenario(T){
  const log=[]; const step=(name,f)=>{ const n=T.writes.length; f(); log.push([name,T.writes.slice(n)]); };
  T.inputs["laundry-label"]={value:"Towels"};
  step("laundryAdd", ()=>T.run("laundryAdd()"));
  const id=Object.keys(T.ctx.laundryData)[0];
  step("laundryAdvance washer→dryer", ()=>T.run("laundryAdvance('"+id+"')"));
  step("laundryAdvance dryer→fold", ()=>T.run("laundryAdvance('"+id+"')"));
  step("laundryAdvance put away", ()=>T.run("laundryAdvance('"+id+"')"));
  T.ctx.laundryData.wt1={label:"Sheets",stage:"bin",ts:1};
  step("laundryAdvance bin→prewash", ()=>T.run("laundryAdvance('wt1')"));
  step("laundryDel", ()=>T.run("laundryDel('wt1')"));
  step("laundryKidHook check", ()=>T.run("laundryKidHook('taylor',{label:'Start a load of laundry'},'week1_monday_taylor_mstep9',true)"));
  step("laundryKidHook uncheck", ()=>T.run("laundryKidHook('taylor',{label:'Start a load of laundry'},'week1_monday_taylor_mstep9',false)"));
  T.inputs["laundry-t-wash"]={value:"45"}; T.inputs["laundry-t-dry"]={value:"75"}; T.inputs["laundry-t-grace"]={value:"15"};
  step("laundryTimesSave", ()=>T.run("laundryTimesSave()"));
  return {log,id};
}
const L=mk(false), D=mk(true);
const live=scenario(L), dry=scenario(D);

console.log("── live: same paths, same shapes ──");
const lw=Object.fromEntries(live.log), id=live.id;
ok("laundryAdd sets laundry/<id> {label,stage:washer,ts}", lw["laundryAdd"].length===1&&lw["laundryAdd"][0][0]==="set"&&lw["laundryAdd"][0][1]==="laundry/"+id&&lw["laundryAdd"][0][2].label==="Towels"&&lw["laundryAdd"][0][2].stage==="washer", lw["laundryAdd"]);
ok("laundryAdvance → Dryer sets laundry/<id> stage dryer", lw["laundryAdvance washer→dryer"].length===1&&lw["laundryAdvance washer→dryer"][0][1]==="laundry/"+id&&lw["laundryAdvance washer→dryer"][0][2].stage==="dryer");
ok("laundryAdvance → Fold sets laundry/<id> stage fold", lw["laundryAdvance dryer→fold"].length===1&&lw["laundryAdvance dryer→fold"][0][2].stage==="fold");
ok("laundryAdvance ✓ Put away removes laundry/<id>", JSON.stringify(lw["laundryAdvance put away"])===JSON.stringify([["remove","laundry/"+id]]));
ok("laundryAdvance 💦 bin → prewash sets laundry/wt1", lw["laundryAdvance bin→prewash"].length===1&&lw["laundryAdvance bin→prewash"][0][1]==="laundry/wt1"&&lw["laundryAdvance bin→prewash"][0][2].stage==="prewash");
ok("laundryDel removes laundry/wt1", JSON.stringify(lw["laundryDel"])===JSON.stringify([["remove","laundry/wt1"]]));
ok("laundryKidHook check sets laundry/lk_<step>", lw["laundryKidHook check"].length===1&&lw["laundryKidHook check"][0][1]==="laundry/lk_week1_monday_taylor_mstep9"&&lw["laundryKidHook check"][0][2].by==="taylor");
ok("laundryKidHook uncheck removes laundry/lk_<step>", JSON.stringify(lw["laundryKidHook uncheck"])===JSON.stringify([["remove","laundry/lk_week1_monday_taylor_mstep9"]]));
ok("laundryTimesSave sets settings/laundryTimes {wash,dry,grace}", JSON.stringify(lw["laundryTimesSave"])===JSON.stringify([["set","settings/laundryTimes",{wash:45,dry:75,grace:15,foldHrs:3}]]));   // foldHrs: PR 61 (default 3, no input in this harness)

console.log("── ?dryrun=1: nothing written, the screen still moves ──");
dry.log.forEach(([name,w])=>ok(name+" writes nothing in dry run", w.length===0, w));
ok("dry run: no write at all across the whole scenario", D.writes.length===0, D.writes);
ok("dry run: the load still walked washer → dryer → fold → put away on the screen (gone from local state)", !(dry.id in D.ctx.laundryData));
ok("dry run: deleted load gone locally too", !("wt1" in D.ctx.laundryData));
ok("dry run: local laundry cache still saved on the device", typeof D.ls.ha_laundry==="string");
ok("dry run: her times still apply on this device", D.run("laundryT('wash')")===45&&D.run("laundryT('grace')")===15&&/"wash":45/.test(D.ls.ha_laundry_times||""));
{ const T=mk(true); T.inputs["laundry-label"]={value:"Darks"}; T.run("laundryAdd()"); const k=Object.keys(T.ctx.laundryData)[0];
  ok("dry run: Start a load still shows the load", k&&T.ctx.laundryData[k].stage==="washer"&&T.writes.length===0);
  T.run("laundryAdvance('"+k+"')"); ok("dry run: → Dryer still moves it on screen", T.ctx.laundryData[k].stage==="dryer"&&T.writes.length===0);
  T.run("laundryKidHook('taylor',{label:'Start a load of laundry'},'s1',true)"); ok("dry run: a kid's laundry step still shows on the card", !!T.ctx.laundryData.lk_s1&&T.writes.length===0); }
{ const T=mk(false); T.ctx.db=null; T.inputs["laundry-label"]={value:"x"}; let threw=false; try{ T.run("laundryAdd()"); T.run("laundryTimesSave()"); }catch(e){ threw=true; }
  ok("no db (offline): still no throw, nothing written", !threw&&T.writes.length===0); }

console.log("── source: none of the five writes on db alone ──");
FIVE.forEach(n=>{ const b=fn(n); ok(n+": every db write is behind _lbWrite()", !/typeof db!=='undefined'&&db\)/.test(b)&&(b.match(/db\.ref\(/g)||[]).length===(b.match(/if\(_lbWrite\(\)\) db\.ref\(/g)||[]).length&&/_lbWrite\(\)/.test(b)); });

console.log("\n"+pass+" passed, "+fail+" failed");
process.exit(fail?1:0);
