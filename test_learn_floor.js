/* ⭐ LEARNFLOOR — reviews can't crowd every learning card out of a drill (her yes 2026-10-19).  run: node test_learn_floor.js
   Live 10/19: Lucy back after 8 missed school days had 5–11 reviews due in every category; the per-category
   cap (5) left no room, so not one learning card showed (man, that, van, think, wish waited) — only old
   reviews. Now each category keeps up to 2 learning seats, never above its own cap; reviews are never cut.
   Fixture shaped like her real 10/19 drill; touches no live data. */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":"")); } };
const fn=name=>{ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); return src.slice(i,src.indexOf("\n}",i)+2); };
const blk=(a,z)=>{ const i=src.indexOf(a); if(i<0) throw new Error("missing "+a); return src.slice(i,src.indexOf(z,i)); };
const ctx={}; vm.createContext(ctx);
vm.runInContext(`
  var MAST_TIER_ORDER=["daily","every_other_day","every_third_day","weekly","bi_weekly","monthly","learned","graduated"];
  var MAST_TIER_INT={daily:1,every_other_day:2,every_third_day:3,weekly:5,bi_weekly:10,monthly:20,learned:60,graduated:null};
  var masteryKid="lucy", masteryData={}, SETTINGS={max_per_cat:5,cat_caps:{},max_learn_per_drill:0,max_overdue_per_drill:0};
  function mastDrillSettings(){ return SETTINGS; } function mastIsNeverDrill(){ return false; } function mastIsParked(i){ return i.status==="parked"; }
  `+fn("mastIsDue")+"\n"+blk("const MAST_LEARN_FLOOR","\nlet mastLogMode"),ctx);
const run=e=>vm.runInContext(e,ctx);
// Lucy 10/19 (day 200): reviews due per category + the learning cards waiting
const REV={"Spelling":11,"Vocabulary":7,"Science":6,"NC Frogs & Toads":5,"Sight Words":5,"Math Facts":5,"Logic of English":1};
const LEARN={"Spelling":["man","that","van","think","wish","ran"],"Vocabulary":["proud","shy","wise"],"Science":["warm","plant","seed"],
  "NC Frogs & Toads":["Pine Woods Treefrog","Barking Treefrog","Squirrel Treefrog","Mountain Chorus Frog"],"Sight Words":["he","was","for"],"Math Facts":["3+2","3+3","3+4"]};
const items=[];
Object.entries(REV).forEach(([c,n])=>{ for(let k=0;k<n;k++) items.push({id:c+"_r"+k,prompt:c+" review "+k,subject:c,status:"active",tier:"bi_weekly",next_due:190+k}); });
Object.entries(LEARN).forEach(([c,ws])=>ws.forEach((w,k)=>items.push({id:c+"_l"+k,prompt:w,subject:c,status:"introduction",tier:"daily",tally_dots:5-k})));
run("masteryData.lucy="+JSON.stringify(items));
const due=()=>run(`mastDueItems("lucy",200)`);
const learnIn=(d,c)=>d.filter(i=>i.subject===c&&i.status==="introduction").map(i=>i.prompt);
let d=due();
ok("every review due still rides — none cut (40)", d.filter(i=>i.status!=="introduction").length===40, d.filter(i=>i.status!=="introduction").length);
ok("Spelling: man + that show even with 11 reviews due", JSON.stringify(learnIn(d,"Spelling"))===JSON.stringify(["man","that"]), learnIn(d,"Spelling"));
ok("every category with learning cards waiting shows 2 of them", Object.keys(LEARN).every(c=>learnIn(d,c).length===2), Object.keys(LEARN).map(c=>c+":"+learnIn(d,c).length));
ok("Lucy's 10/19 drill would be 52 cards (40 reviews + 12 learning), not 40 reviews only", d.length===52, d.length);
// a light day: room under the cap still fills normally (floor is a floor, not a ceiling)
run(`masteryData.lucy=masteryData.lucy.filter(i=>!(i.subject==="Math Facts"&&i.status==="active"&&i.next_due>=191))`);
d=due();
ok("1 Math review due → learning fills the rest of the cap as before (3 of 3 waiting)", learnIn(d,"Math Facts").length===3, learnIn(d,"Math Facts"));
// Mom's own category cap is respected
run(`SETTINGS.cat_caps={"Spelling":1,"Vocabulary":0}`); d=due();
ok("a category Mom capped at 1 shows at most 1 learning card", learnIn(d,"Spelling").length===1, learnIn(d,"Spelling"));
ok("a category Mom capped at 0 shows none", learnIn(d,"Vocabulary").length===0, learnIn(d,"Vocabulary"));
run(`SETTINGS.cat_caps={}`);
// the daily learning cap (max_learn_per_drill) still has the last word
run(`SETTINGS.max_learn_per_drill=4`); d=due();
ok("Max Learning Cards / Drill still caps the total", d.filter(i=>i.status==="introduction").length===4, d.filter(i=>i.status==="introduction").length);
run(`SETTINGS.max_learn_per_drill=0`);
ok("floor is 2", /const MAST_LEARN_FLOOR=2;/.test(src));
ok("marked block present", src.includes("// LEARNFLOOR_START")&&src.includes("// LEARNFLOOR_END"));
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
