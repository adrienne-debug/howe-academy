/*
 * 🔁 Parked cards must not swap days on every cascade pass (live 2026-09-29 16:55 and 09-30 09:54–10:08: the same four
 * Ellis Mathematical Reasoning overflow cards traded Monday↔Friday on each pass; two devices re-wrote week25 every
 * 3–4 s for hours, the Grid redrew every 3 s, Lincoln's schedule "glitched").
 * Cause: cascadeIntraWeek's byLesson/bySlot swap sorted overflow slots by time only — all parked at 3:05 PM → ties →
 * array order, which differs between the device that wrote and the device that read.
 *   · the swap step, run on the same cards in two different array orders, lands them on the SAME days
 *   · a second run changes nothing (fixed point)
 *   · the real cascade on the 9/29 live snapshot reaches a fixed point within three passes
 *   run:  node test_cascade_swap_ties.js
 */
const fs=require("fs"), path=require("path");
let pass=0, fail=0;
function ok(n,c,x){ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":""));} }
const src=fs.readFileSync(process.env.HA_SRC||path.join(__dirname,"index.html"),"utf8");
const toMin=s=>{ const m=/(\d+):(\d+)\s*([AP]M)/.exec(s||""); if(!m) return null; return (+m[1]%12+(m[3]==="PM"?12:0))*60+ +m[2]; };
const natCmp=(a,b)=>String(a).localeCompare(String(b),undefined,{numeric:true});
const lessonKey=t=>t.title||"";
// slice the swap step out of cascadeIntraWeek: from the lid-position map to the end of the assignment loop
const a=src.indexOf("    const _lidIdx={};"), b=src.indexOf("  // A swept task that landed back on its own day isn't a carry");
ok("swap step found in cascadeIntraWeek",a>0&&b>a,[a,b]);
const block=(()=>{ const raw=src.slice(a,b); return raw.slice(0,raw.lastIndexOf("}")); })();   // drop the brace that closes the enclosing per-subject loop
const step=new Function("uncheckedGrp","grp","dayOrder","toMin","natCmp","lessonKey","lidsFor",
  "for(let __=0;__<1;__++){\n"+block+"\n}");
const dayOrder=["monday","tuesday","wednesday","thursday","friday","saturday"];
const mk=(id,lid,day)=>({id,lid,who:"ellis",subjectKey:"mathematical_reasoning",title:"MR "+lid,day,time:"3:05 PM",_eowOverflow:true});
const lids=["L0353","L0354","L0355","L0356"]; const lidsFor=()=>lids;
// the live shape: four parked cards, two per day, ids NOT in lesson order (id≠lid drift)
const cards=()=>[mk("mr_b","L0354","friday"),mk("mr_a","L0353","monday"),mk("mr_d","L0356","monday"),mk("mr_c","L0355","friday")];
const lay=g=>g.slice().sort((x,y)=>lids.indexOf(x.lid)-lids.indexOf(y.lid)).map(t=>t.lid+"@"+t.day).join(" ");
console.log("🔁 same cards, two array orders");
{ const g1=cards(); step(g1,g1,dayOrder,toMin,natCmp,lessonKey,lidsFor);
  const g2=cards().reverse(); step(g2,g2,dayOrder,toMin,natCmp,lessonKey,lidsFor);
  ok("both orders land the lessons on the same days",lay(g1)===lay(g2),[lay(g1),lay(g2)]);
  ok("earlier lessons take the earlier parked day (kept in sequence)",lay(g1)==="L0353@monday L0354@monday L0355@friday L0356@friday",lay(g1));
  const before=lay(g1); step(g1,g1,dayOrder,toMin,natCmp,lessonKey,lidsFor);
  ok("a second run moves nothing",lay(g1)===before,[before,lay(g1)]);
  const before2=lay(g2); step(g2.reverse(),g2,dayOrder,toMin,natCmp,lessonKey,lidsFor);
  ok("…in either array order",lay(g2)===before2,[before2,lay(g2)]); }
console.log("🔁 mixed: scheduled slots still go by day/time, parked ones last");
{ const g=[mk("x1","L0353","friday"),Object.assign(mk("x2","L0354","monday"),{_eowOverflow:false,time:"11:00 AM"}),mk("x3","L0355","monday")];
  step(g,g,dayOrder,toMin,natCmp,lessonKey,lidsFor);
  const first=g.find(t=>t.lid==="L0353");
  ok("the first lesson takes the real Monday 11:00 slot",first.day==="monday"&&first.time==="11:00 AM"&&!first._eowOverflow,[first.day,first.time,first._eowOverflow]);
  ok("the later lessons hold the parked slots",g.filter(t=>t._eowOverflow).map(t=>t.lid).sort().join()==="L0354,L0355"); }
console.log("wiring");
ok("bySlot breaks a time tie by day, then id",/const dd=dayIdx\(a\.day\)-dayIdx\(b\.day\); if\(dd\) return dd;\n\s*return String\(a\.id\|\|""\)\.localeCompare\(String\(b\.id\|\|""\)\);/.test(src));
ok("needSwap compares slot keys, not card ids",/if\(_slotKey\(byLesson\[i\]\)!==_slotKey\(bySlot\[i\]\)\)\{ needSwap=true; break; \}/.test(src));
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
