/*
 * 🧺 MOMBLOCKS_DAYROLL — hole 4 of AUDIT_laundry_2026-10-15: a long-open device listens to yesterday's Mom blocks.
 *
 * db.ref("momBlocks/"+mwTodayIso()).on("value",…) was bound ONCE at boot, and the kiosks outlive the day they booted on.
 * A tablet open since Tuesday kept listening to Tuesday's path, so a block Mom set on Wednesday from her phone never reached
 * it — its Mom loop laid her cards without the block. Now dayRollCheck re-binds the listener (off the old day's path, on the
 * new one) and drops the stale ha_momblocks cache. Writes: none.
 *
 * Replay: the REAL day-roll block, the REAL Mom loop (MOMLOOP) and the REAL laundry-block code (MOMSCHED_LAUNDRY, which now
 * holds momBlocksListen) run in a vm with a movable clock and a fake database that records every on()/off() per path.
 *   - boot Tuesday night → listening to momBlocks/<tuesday>, once
 *   - roll to Wednesday → the Tuesday listener is off()'d, Wednesday's is on(); the cache and local map are dropped
 *   - a Wednesday block arrives → the Mom loop lays her cards around it (Lucy's Math steps 10:00 → 10:10)
 *   - a Tuesday event (queued or stray) can no longer touch the map
 *   - no db (cloud / offline boot) → inert; a multi-day skip binds the right day; wiring + no writes
 *
 *   run:  node test_momblocks_dayroll.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":"")); } };
const fn=name=>{ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); return src.slice(i,src.indexOf("\n}",i)+2); };
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("missing "+a); return src.slice(i,j+b.length); };
const ROLL=cut('const DOW_NAMES=["sunday"','window.addEventListener("focus",dayRollCheck);');
const MOMLOOP=cut("// MOMLOOP_START","// MOMLOOP_END");
const MS=cut("// MOMSCHED_LAUNDRY_START","// MOMSCHED_LAUNDRY_END");
const MBD=cut("// MOMBLOCKS_DAYROLL_START","// MOMBLOCKS_DAYROLL_END");
const H=(h,m)=>h*60+(m||0);

// ── movable clock ────────────────────────────────────────────────────────────
const RealDate=Date; let NOW="2026-10-13T22:40:00";   // Tuesday night
function MovableDate(...a){ if(!(this instanceof MovableDate)) return new MovableDate(...a); return a.length===0?new RealDate(NOW):new RealDate(...a); }
MovableDate.now=()=>new RealDate(NOW).getTime(); MovableDate.prototype=RealDate.prototype;
const TUE="2026-10-13", WED="2026-10-14", FRI="2026-10-16";

let ID=0;
const card=(who,time,dur,mom,title)=>({id:who+"_"+(ID++),who,day:"wednesday",mom:mom||"none",time,dur:dur||20,title:title||(who+" card")});
// Lucy has two Mom cards from 10:00, Ellis one after; Lincoln works on his own. Towels are in the washer.
const m1=card("lucy","10:00 AM",20,"required","Math — Lesson 12"), m2=card("lucy","10:20 AM",20,"required","Spelling"),
      e1=card("ellis","10:40 AM",20,"required","Reading"), own=card("lincoln","10:00 AM",30,"none","Independent Reading");
const TASKS=[m1,m2,e1,own];
const wedBlock=()=>({a_washer:{iso:WED,load:"a",stage:"washer",label:"Towels",mins:10,at:"now",startMin:H(10)}});

function boot(o){
  o=o||{};
  const ls=Object.assign({},o.ls||{}), writes=[], renders=[], listeners={}, log={on:[],off:[]};
  const db=o.noDb?null:{ref:p=>({
    on:(ev,cb)=>{ (listeners[p]=listeners[p]||[]).push(cb); log.on.push(p); },
    off:(ev,cb)=>{ listeners[p]=(listeners[p]||[]).filter(f=>f!==cb); log.off.push(p+(cb?"":"#all")); },
    set:v=>writes.push(["set",p,v]), update:v=>writes.push(["update",p,v]), remove:()=>writes.push(["remove",p])
  })};
  const ctx={console,ROSTER:["lucy","ellis","lincoln"],checked:{},momMoves:{},
    getActiveTasks:()=>TASKS, morningComplete:()=>true, bbActive:()=>null, momHere:()=>true, adminPinUnlocked:true,
    cap:s=>String(s||"").charAt(0).toUpperCase()+String(s||"").slice(1), esc:s=>String(s==null?"":s).replace(/</g,"&lt;"),
    Object,Array,String,Number,parseInt,isNaN,Math,JSON,RegExp, Date:MovableDate,
    HA_LS:{getItem:k=>(k in ls)?ls[k]:null, setItem:(k,v)=>{ ls[k]=v; }, removeItem:k=>{ delete ls[k]; }},
    db, LAUNDRY_STAGES:["washer","dryer","fold"], laundryData:{a:{label:"Towels",stage:"washer",ts:0}},
    KID_NAME:{lucy:"Lucy",ellis:"Ellis",lincoln:"Lincoln"}, taskCard:t=>"", _agLunchRow:()=>null, famIsMomCard:()=>false,
    renderAll:()=>{ renders.push("all"); }, setInterval:()=>1,
    document:{hidden:false, addEventListener:()=>{}, getElementById:()=>null},
    _mlNowOverride:H(10), _mlLunchOverride:false};
  vm.createContext(ctx);
  vm.runInContext("globalThis.window=globalThis;",ctx);   // the _todayDay getter lives on window, read bare by the Mom loop
  ctx.window.addEventListener=()=>{};
  vm.runInContext(fn("toMin")+"\n"+fn("fromMin")+"\n"+fn("mwTodayIso")+"\n"+ROLL+"\n"+MOMLOOP+"\n"+fn("laundrySince")+"\n"+MS+"\nkid='mom';",ctx);
  vm.runInContext("momLoop="+JSON.stringify({cursor:0,order:["lucy","ellis","lincoln"]})+";",ctx);
  const T={ctx,ls,writes,renders,listeners,log,run:e=>vm.runInContext(e,ctx)};
  T.push=(iso,v)=>(listeners["momBlocks/"+iso]||[]).forEach(cb=>cb({val:()=>v}));   // Firebase delivers a value event on that path
  T.n=iso=>(listeners["momBlocks/"+iso]||[]).length;
  T.lay=()=>{ const laid=T.run("mlQueueLay("+JSON.stringify(TASKS)+")"); T.at=id=>laid.find(t=>t.id===id).time; return laid; };
  T.cache=()=>{ try{ return JSON.parse(ls.ha_momblocks); }catch(e){ return null; } };
  return T;
}

console.log("── boot: the listener is bound once, to today's path ──");
{ NOW="2026-10-13T22:40:00"; const T=boot();
  ok("boots tuesday with no listener yet", T.run("day")==="tuesday"&&T.n(TUE)===0);
  ok("initFb's momBlocksListen() binds momBlocks/<tuesday> and says so", T.run("momBlocksListen()")===true&&T.n(TUE)===1&&T.log.on.join()==="momBlocks/"+TUE, T.log);
  ok("calling it again the same day is a no-op (no second listener)", T.run("momBlocksListen()")===false&&T.n(TUE)===1);
  T.push(TUE,{b_dryer:{iso:TUE,load:"b",stage:"dryer",label:"Sheets",mins:15,at:"now",startMin:H(21)}});
  ok("tuesday's block arrives → local map + ha_momblocks cache stamped tuesday", T.run("Object.keys(momBlocks)").join()==="b_dryer"&&T.cache().iso===TUE, T.cache());
  ok("…and the schedule repaints", T.renders.length===1);
  ok("nothing written", T.writes.length===0);
}

console.log("── the roll: Tuesday → Wednesday on a device that never reloaded ──");
{ NOW="2026-10-13T22:40:00"; const T=boot(); T.run("momBlocksListen()");
  T.push(TUE,{b_dryer:{iso:TUE,load:"b",stage:"dryer",label:"Sheets",mins:15,at:"now",startMin:H(21)}});
  NOW="2026-10-14T00:05:00";   // five past midnight
  ok("dayRollCheck sees the roll", T.run("dayRollCheck()")===true&&T.run("day")==="wednesday");
  ok("the tuesday listener is off()'d — by its own callback, not a blanket off()", T.n(TUE)===0&&T.log.off.join()==="momBlocks/"+TUE, T.log.off);
  ok("wednesday's path is on()", T.n(WED)===1&&T.log.on.join()==="momBlocks/"+TUE+",momBlocks/"+WED, T.log.on);
  ok("yesterday's blocks are dropped from the local map and the ha_momblocks cache", T.run("Object.keys(momBlocks).length")===0&&T.cache()===null, T.ls);
  ok("a second roll check is a no-op (still one listener)", T.run("dayRollCheck()")===false&&T.n(WED)===1&&T.log.on.length===2);
  T.lay();
  ok("before her block: Lucy 10:00 / 10:20, Ellis 10:40, Lincoln 10:00", T.at(m1.id)==="10:00 AM"&&T.at(m2.id)==="10:20 AM"&&T.at(e1.id)==="10:40 AM"&&T.at(own.id)==="10:00 AM", [T.at(m1.id),T.at(m2.id),T.at(e1.id)]);
  const r0=T.renders.length;
  T.push(WED,wedBlock());   // Mom blocks 10 min from her phone on Wednesday
  ok("wednesday's block reaches this device (map + cache stamped wednesday) and repaints", T.run("momBlocks.a_washer&&momBlocks.a_washer.iso")===WED&&T.cache().iso===WED&&T.renders.length===r0+1, T.cache());
  ok("…it is an open block the Mom loop sees", T.run("momBlockOpen()").length===1&&T.run("momBlockOpen()[0].startMin")===H(10));
  T.lay();
  ok("her Mom cards step over 10:00–10:10: Lucy 10:10 / 10:30, Ellis 10:50", T.at(m1.id)==="10:10 AM"&&T.at(m2.id)==="10:30 AM"&&T.at(e1.id)==="10:50 AM", [T.at(m1.id),T.at(m2.id),T.at(e1.id)]);
  ok("the kids' own work keeps going (Lincoln still 10:00)", T.at(own.id)==="10:00 AM");
  ok("the block was laid at 10:00", T.run("_mlBlkLaid['a_washer']")===H(10));
  ok("still nothing written", T.writes.length===0);
}

console.log("── the day-1 listener is gone ──");
{ NOW="2026-10-13T22:40:00"; const T=boot(); T.run("momBlocksListen()");
  const tueCb=T.listeners["momBlocks/"+TUE][0];
  NOW="2026-10-14T00:05:00"; T.run("dayRollCheck()"); T.push(WED,wedBlock());
  T.push(TUE,{z_fold:{iso:TUE,load:"z",stage:"fold",mins:5,at:"now",startMin:H(9)}});
  ok("an event on tuesday's path has nobody listening", T.run("Object.keys(momBlocks)").join()==="a_washer");
  tueCb({val:()=>({z_fold:{iso:TUE,load:"z",stage:"fold",mins:5,at:"now",startMin:H(9)}})});   // a queued event Firebase delivers late, after off()
  ok("a late tuesday callback is ignored — wednesday's map and cache survive", T.run("Object.keys(momBlocks)").join()==="a_washer"&&T.cache().iso===WED, T.cache());
  T.lay();
  ok("…and the lay still steps over wednesday's block", T.at(m1.id)==="10:10 AM", T.at(m1.id));
}

console.log("── edges ──");
{ NOW="2026-10-13T22:40:00"; const T=boot({noDb:true});
  ok("no db (cloud / offline boot) → momBlocksListen is inert", T.run("momBlocksListen()")===false);
  NOW="2026-10-14T00:05:00";
  ok("…and the roll still happens without it (no throw)", T.run("dayRollCheck()")===true&&T.run("day")==="wednesday");
}
{ NOW="2026-10-13T22:40:00"; const T=boot(); T.run("momBlocksListen()");
  NOW="2026-10-16T07:00:00";   // a tablet left on over a long weekend hop
  T.run("dayRollCheck()");
  ok("a multi-day skip lands on the right path (tuesday off, friday on, nothing in between)", T.n(TUE)===0&&T.n(WED)===0&&T.n(FRI)===1&&T.log.on.length===2, T.log);
}
{ NOW="2026-10-14T07:00:00"; const T=boot({ls:{ha_momblocks:JSON.stringify({iso:TUE,v:{b_dryer:{iso:TUE,load:"b",stage:"dryer",mins:15,at:"now",startMin:H(21)}}})}});
  ok("a reload on wednesday ignores tuesday's cached blocks (the read-side filter, unchanged)", T.run("Object.keys(momBlocks).length")===0);
}
{ NOW="2026-10-13T22:40:00"; const T=boot(); T.run("momBlocksListen()");
  NOW="2026-10-14T00:05:00"; T.run("dayRollCheck()");
  T.push(WED,null);   // Firebase answers an empty day with null
  ok("an empty new day leaves an empty map and a wednesday-stamped cache", T.run("Object.keys(momBlocks).length")===0&&T.cache().iso===WED&&T.cache().v&&Object.keys(T.cache().v).length===0, T.cache());
}

console.log("── wiring ──");
ok("initFb binds through momBlocksListen() (the once-at-boot bind is gone)", /\n    momBlocksListen\(\);   \/\/ 🧺 MOMSCHED_LAUNDRY/.test(src)&&(src.match(/db\.ref\("momBlocks\/"\+mwTodayIso\(\)\)\.on\("value"/g)||[]).length===1&&MBD.indexOf('db.ref("momBlocks/"+mwTodayIso()).on("value",_mbCb)')>0);
ok("dayRollCheck calls momBlocksListen before it re-renders", /_dayRollSeen=now;\n  if\(wasOnToday\) day=now;\n  try\{ if\(typeof momBlocksListen==="function"\) momBlocksListen\(\); \}catch\(e\)\{\}[^\n]*\n  if\(typeof renderAll==="function"\) renderAll\(\);/.test(src));
ok("the old path is off()'d with its own callback", /db\.ref\("momBlocks\/"\+_mbIso\)\.off\("value",_mbCb\)/.test(MBD));
ok("the stale cache is dropped on the roll", /momBlocks=\{\}; try\{ HA_LS\.removeItem\('ha_momblocks'\); \}catch\(e\)\{\}/.test(MBD));
ok("the block writes nothing", !/\.(set|update|remove|push|transaction)\(/.test(MBD));
ok("the block lives inside MOMSCHED_LAUNDRY (sliced with it by the laundry tests)", MS.indexOf("// MOMBLOCKS_DAYROLL_START")>0&&MS.indexOf("// MOMBLOCKS_DAYROLL_END")>0);
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
