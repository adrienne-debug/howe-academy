/*
 * ✅ SLOT_TICKED (her report 2026-10-12, DeWalt Taylor): her Monday kitchen chore was ticked, Afternoon was done, every school card
 * checked — and Claim spins still said "Finish … Chores first". The list's stored done flag is written only by the tick that
 * completes the list; hers was ticked on a device whose code still called the Tue–Thu kitchen chores late (fixed in LATE_CYCLE),
 * so the flag stayed false. rtSlotDone's fallback then asked only "is nothing due?" — never "is every due item ticked?".
 *                                                                                               run: node test_slot_ticked.js
 */
const fs=require("fs"), vm=require("vm");
const src=fs.readFileSync(__dirname+"/index.html","utf8");
function slice(name){ const sig="function "+name+"("; const i=src.indexOf(sig); if(i<0) throw new Error("not found: "+name);
  let d=0; for(let k=src.indexOf("{",i);k<src.length;k++){ if(src[k]==="{")d++; else if(src[k]==="}"){ d--; if(d===0) return src.slice(i,k+1);} } throw new Error("unbalanced: "+name); }
const CODE=["rtDoneOn","rtSlotDone","choresGateDone","cadDueOn"].map(slice).join("\n");
let pass=0, fail=0; function ok(c,m){ if(c){pass++;console.log("  ok  - "+m);} else {fail++;console.log("  FAIL- "+m);} }
// Taylor's real Monday list: 0–2 living (off-cycle), 3 Mon kitchen, 4–6 Tue/Wed/Thu kitchen (not due Monday), 7–14 bath + bedrooms (off)
const STEPS=[ {label:"Dust TV stand",cad:"wk:0"},{label:"Wipe down door",cad:"wk:2"},{label:"Sweep porch",cad:"wk:3"},
  {label:"Organize pantry",cad:"wk:0"},{label:"Clean microwave",cad:"wk:1"},{label:"Organize pantry",cad:"wk:2"},{label:"Organize pantry",cad:"wk:3"} ];
// what rtDueOrLate says on the fixed code for Monday of kitchen week: only step 3 is due; nothing is late
const DUE_MON={3:true};
function run(o){
  const ctx={ DAYS_ALL:["monday","tuesday","wednesday","thursday","friday","saturday","sunday"], RT_ABBR:{afternoon:"a",chores:"c",evening:"e"},
    day:"monday", _todayDay:"monday", activeWk:()=>"week2", slState:o.sl||{}, rtStepsFor:(slot)=>slot==="chores"?STEPS:(o.aft||[]),
    rtDueOrLate:(slot,kid,d,i)=>slot==="chores"?!!(o.due||DUE_MON)[i]:!!(o.aftDue||{})[i], out:null };
  vm.createContext(ctx); vm.runInContext(CODE+"\nout={chores:rtSlotDone('taylor','chores','monday'),gate:choresGateDone('taylor','monday')};",ctx); return ctx.out;
}
const AFT_DONE={week2_monday_taylor_afternoon:{done:true,ts:"03:20 PM Oct 12"}};
console.log("Taylor, Mon Oct 12 — pantry ticked at 4:22 PM, list flag never flipped (old code on that device):");
let r=run({sl:Object.assign({week2_monday_taylor_chores:{done:false,ts:""},week2_monday_taylor_cstep3:{done:true,pts:15,ts:"04:22 PM Oct 12"}},AFT_DONE)});
ok(r.chores===true,"chores list counts as done — every due item is ticked");
ok(r.gate===true,"afternoon + chores gate opens → Claim spins can show");
console.log("Nothing ticked yet:");
r=run({sl:Object.assign({week2_monday_taylor_chores:{done:false,ts:""}},AFT_DONE)});
ok(r.chores===false,"pantry due and unticked → not done");
ok(r.gate===false,"gate stays closed");
console.log("The stored flag still wins when it is set:");
r=run({sl:Object.assign({week2_monday_taylor_chores:{done:true,ts:"x"}},AFT_DONE)});
ok(r.chores===true,"flag true → done");
console.log("CHORESEMPTY (her rule 2026-10-06) unchanged — nothing due today:");
r=run({due:{},sl:AFT_DONE});
ok(r.chores===true,"no due chores → done without a tick");
console.log("A late item (due or late) that is unticked still blocks:");
r=run({due:{3:true,5:true},sl:Object.assign({week2_monday_taylor_cstep3:{done:true}},AFT_DONE)});
ok(r.chores===false,"an unticked late item keeps the list open");
r=run({due:{3:true,5:true},sl:Object.assign({week2_monday_taylor_cstep3:{done:true},week2_monday_taylor_cstep5:{done:true}},AFT_DONE)});
ok(r.chores===true,"…and ticking it closes the list");
console.log("Afternoon list follows the same rule:");
r=run({aft:[{label:"Pick up",cad:"daily"}],aftDue:{0:true},sl:{week2_monday_taylor_chores:{done:true},week2_monday_taylor_astep0:{done:true}}});
ok(r.gate===true,"afternoon item ticked but flag unset → gate still opens");
console.log(pass+" passed, "+fail+" failed"); if(fail) process.exit(1);
