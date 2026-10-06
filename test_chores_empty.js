/* ✅ No chores = chores done (her report 2026-10-06, Taylor).  run: node test_chores_empty.js */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":"")); } };
const fn=name=>{ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); return src.slice(i,src.indexOf("\n}",i)+2); };
const one=name=>{ const i=src.indexOf("function "+name+"("); return src.slice(i,src.indexOf("\n",i)); };
const ctx={}; vm.createContext(ctx);
vm.runInContext(`var day="tuesday"; var slState={}; function activeWk(){ return "week1"; }
  var STEPS={chores:{taylor:[{label:"Table",due:false}],andrew:[{label:"Sweep",due:true}],caleb:[]},afternoon:{taylor:[{label:"Tidy",due:true}],andrew:[{label:"Tidy",due:true}],caleb:[]}};
  function rtStepsFor(slot,kid){ return (STEPS[slot]||{})[kid]||[]; } function rtDueOrLate(slot,kid,d,i,st){ return !!st.due; }
  function getSlot(){ return {done:false}; }
  `+fn("rtSlotDone")+"\n"+one("choresGateDone"),ctx);
const run=e=>vm.runInContext(e,ctx);
ok("Taylor: her one chore isn't due today → chores count as done", run("rtSlotDone('taylor','chores','tuesday')")===true);
ok("Andrew: a chore is due and not ticked → not done", run("rtSlotDone('andrew','chores','tuesday')")===false);
run("slState['week1_tuesday_andrew_chores']={done:true}"); ok("…ticked → done (as before)", run("rtSlotDone('andrew','chores','tuesday')")===true);
ok("a kid with no chore list at all → done", run("rtSlotDone('caleb','chores','tuesday')")===true);
ok("Taylor's afternoon list is due → the gate waits for it", run("choresGateDone('taylor','tuesday')")===false);
run("slState['week1_tuesday_taylor_afternoon']={done:true}"); ok("…afternoon ticked + no chores due → the claim gate opens", run("choresGateDone('taylor','tuesday')")===true);
ok("the points card, the claim gate and the 'left to do' note all use it", /const choresDone=rtSlotDone\(kid,"chores",day\);/.test(src)&&/function choresGateDone\(kid,d\)\{ return !!\(rtSlotDone\(kid,"afternoon",d\) && rtSlotDone\(kid,"chores",d\)\); \}/.test(src)&&/if\(!rtSlotDone\(k,"chores",dn\)\) leftBits\.push\("Chores"\);/.test(src));
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
