// SLTARGET — a routine tap writes only the check-mark keys it changed, never the whole <week>/sl map.
// Replays the live 10/15 loss: Ellis + Julian ticked at 8:01 PM on their devices, Lincoln ticked at 8:10 PM on a
// device whose copy didn't have their ticks yet — the old whole-map set() erased them (stars stayed paid).
const fs=require("fs"); const src=fs.readFileSync(__dirname+"/index.html","utf8");
let pass=0, fail=0; const ok=(c,m)=>{ if(c){pass++;} else {fail++; console.log("FAIL",m);} };
const blk=src.slice(src.indexOf("// SLTARGET_START"),src.indexOf("// SLTARGET_END"));
ok(blk.length>200,"SLTARGET block present");

// fake server + db
function mkServer(init){ return {data:JSON.parse(JSON.stringify(init||{})),sets:0,updates:0}; }
function mkDb(srv){ return {ref:function(path){ return {
  set:function(v){ srv.sets++; srv.data=JSON.parse(JSON.stringify(v)); return Promise.resolve(); },
  update:function(u){ srv.updates++; Object.keys(u).forEach(k=>{ if(u[k]===null) delete srv.data[k]; else srv.data[k]=u[k]; }); return Promise.resolve(); } }; } }; }
function device(srv,copy){
  const ctx={slState:JSON.parse(JSON.stringify(copy)),db:mkDb(srv),saved:{},noted:[],dry:false};
  const f=new Function("ctx",`let slState=ctx.slState; const db=ctx.db; const sv=(k,v)=>{ctx.saved[k]=1}; const _dryRun=()=>ctx.dry;
    const obNoteSl=(wk,p,prev)=>{ ctx.noted.push(Object.keys(prev)); };
    ${blk}
    return { tap:(mut)=>{ const b=slBefore(); mut(slState); return slSaveChanged("week27",b); }, state:()=>slState };`);
  return Object.assign(ctx,f(ctx));
}
const W="week27_thursday_";
const base={}; base[W+"ellis_mstep0"]={done:true,ts:"09:47 AM Oct 15"}; base[W+"lincoln_mstep0"]={done:true,ts:"10:11 AM Oct 15"};
const srv=mkServer(base);
const lincoln=device(srv,base);              // Lincoln's device loaded early — never hears the 8:01 ticks
const ellis=device(srv,base);
ellis.tap(s=>{ s[W+"ellis_estep0"]={done:true,ts:"08:01 PM Oct 15",pts:25,bid:"b1"}; s[W+"ellis_evening"]={done:true,ts:"08:02 PM Oct 15",bonusBid:"b2",bonusPts:20}; });
const julian=device(srv,base);
julian.tap(s=>{ s[W+"julian_astep0"]={done:true,ts:"08:01 PM Oct 15",pts:10,bid:"b3"}; });
lincoln.tap(s=>{ s[W+"lincoln_estep0"]={done:true,ts:"08:10 PM Oct 15"}; s[W+"lincoln_evening"]={done:true,ts:"08:10 PM Oct 15"}; });
ok(srv.data[W+"ellis_estep0"]&&srv.data[W+"ellis_estep0"].done,"Ellis's Evening ✓ survives Lincoln's later tap");
ok(srv.data[W+"ellis_evening"]&&srv.data[W+"ellis_evening"].bonusBid==="b2","Ellis's list-bonus record survives");
ok(srv.data[W+"julian_astep0"]&&srv.data[W+"julian_astep0"].done,"Julian's Afternoon ✓ survives Lincoln's later tap");
ok(srv.data[W+"lincoln_estep0"]&&srv.data[W+"lincoln_evening"],"Lincoln's own ticks land");
ok(srv.sets===0&&srv.updates===3,"three targeted updates, no whole-map set (sets="+srv.sets+")");
ok(JSON.stringify(lincoln.noted[0].sort())===JSON.stringify([W+"lincoln_estep0",W+"lincoln_evening"].sort()),"outbox notes exactly the changed keys (incl. list record)");

// a stale device holding an old ✓ does NOT write it back
const srv2=mkServer({[W+"lucy_astep0"]:{done:false,ts:""}});
const stale=device(srv2,{[W+"lucy_astep0"]:{done:true,ts:"06:06 PM Oct 15"}});
stale.tap(s=>{ s[W+"lucy_mstep0"]={done:true,ts:"x"}; });
ok(srv2.data[W+"lucy_astep0"].done===false,"stale device's old ✓ is not resurrected");

// un-tick writes the new value; undefined fields are stripped (Firebase refuses undefined)
const srv3=mkServer({[W+"ellis_cstep1"]:{done:true,ts:"t",pts:20,bid:"x"}});
const d3=device(srv3,srv3.data);
d3.tap(s=>{ s[W+"ellis_cstep1"]={done:false,ts:"",pts:null,bid:undefined}; });
ok(srv3.data[W+"ellis_cstep1"].done===false&&!("bid" in srv3.data[W+"ellis_cstep1"]),"un-tick saved, undefined stripped");
// removed key → null
d3.tap(s=>{ delete s[W+"ellis_cstep1"]; });
ok(!(W+"ellis_cstep1" in srv3.data),"a removed key is removed on the server");
// nothing changed → no write; dry-run → no write but local save happens
const before=srv3.updates; d3.tap(()=>{}); ok(srv3.updates===before,"no change → no write");
d3.dry=true; d3.tap(s=>{ s.k={done:true}; }); ok(srv3.updates===before&&d3.saved["week27_sl"],"?dryrun=1 writes nothing, local save still happens");
// the three tap paths use it; no whole-map set left in them
["function toggleMorningStep(","function toggleRtStep(","function toggleSlot("].forEach(fn=>{
  const i=src.indexOf(fn), body=src.slice(i,src.indexOf("\n}\n",i));
  ok(i>=0&&/slBefore\(\)/.test(body)&&/slSaveChanged\(wk,_slB\)/.test(body),fn+" uses SLTARGET");
  ok(!/"\/sl"\)\.set\(/.test(body),fn+" has no whole-map set");
  const firstWrite=body.search(/slState\[[^\]]+\]\s*=[^=]/); ok(firstWrite>0&&body.indexOf("_slB=slBefore()")<firstWrite,fn+" snapshots before changing anything");
});
console.log(pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
