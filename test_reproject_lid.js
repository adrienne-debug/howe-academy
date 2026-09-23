/*
 * 🔗 A re-laid card's title and lesson id always agree (her audit 2026-09-23).
 * Live bug: Rebuild all → reprojectSubjectWeek → _reprojectPlan matched Lincoln's Friday Singapore card by its id
 * (…_L0051 = "5B Ch.12 L4") and retitled it "L4", but the card's lid was L0052 (L5, left there by seqFillNormalize,
 * which keeps an old id when the new one is taken). Checking it would have recorded L5 and skipped L4 for good.
 *   run:  node test_reproject_lid.js
 */
const fs=require("fs"), path=require("path");
let pass=0, fail=0;
function ok(n,c,x){ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":""));} }
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
const a=src.indexOf("function _reprojectPlan("); let i=src.indexOf("{",a), d=0, j=i;
for(;j<src.length;j++){ if(src[j]==="{")d++; else if(src[j]==="}"){ d--; if(!d) break; } }
const days=src.match(/const _RP_DAYS=[^;]+;/)[0];
const toMin=s=>{ const m=/(\d+):(\d+)\s*([AP]M)/.exec(s||""); if(!m) return 0; return (+m[1]%12+(m[3]==="PM"?12:0))*60+ +m[2]; };
const fromMin=n=>{ let h=Math.floor(n/60), m=n%60, ap=h>=12?"PM":"AM"; h=h%12||12; return h+":"+String(m).padStart(2,"0")+" "+ap; };
const RP=new Function(days+"\n"+src.slice(a,j+1)+"\nreturn _reprojectPlan;")();
const base={who:"lincoln",subjectKey:"singapore_l",day:"friday",time:"11:30 AM",dur:25};
const run=(live,want,o)=>RP("lincoln","singapore_l",live,want,Object.assign({todayDay:"wednesday",nowMin:540,checked:{},claimed:{},toMin,fromMin,dayCtx:()=>({}),packAround:null,dayCap:2,doneLids:[]},o||{}));
const ID="lincoln_lincoln__singapore_l_L0051";

console.log("the live case");
let card={...base,id:ID,lid:"L0052",title:"📄 Singapore Math — 5B Ch.12 L5"};
let r=run([card],[{...base,id:ID,lid:"L0051",title:"📄 Singapore Math — 5B Ch.12 L4"}]);
let out=r.tasksAfter.find(t=>t.id===ID);
ok("the card is retitled to its id's lesson (L4)…",out.title.endsWith("L4"));
ok("…and its lesson id follows (L0051), so checking it records L4",out.lid==="L0051",out.lid);
ok("both land in ONE targeted write — no whole-node set",r.upd[ID+"/lid"]==="L0051"&&r.upd[ID+"/title"].endsWith("L4")&&!(ID in r.upd));
card={...base,id:ID,lid:"L0052",title:"📄 Singapore Math — 5B Ch.12 L4"};   // exactly how it sat in week24 after the rebuild
r=run([card],[{...base,id:ID,lid:"L0051",title:"📄 Singapore Math — 5B Ch.12 L4"}]);
ok("already-retitled card (title right, lid wrong) heals on the next re-lay",r.tasksAfter.find(t=>t.id===ID).lid==="L0051"&&r.upd[ID+"/lid"]==="L0051");

console.log("never harms a record");
card={...base,id:ID,lid:"L0052",title:"📄 Singapore Math — 5B Ch.12 L5"};
r=run([card],[{...base,id:ID,lid:"L0051",title:"📄 Singapore Math — 5B Ch.12 L4"}],{checked:{[ID]:"11:40 AM Sep 25"}});
ok("a CHECKED card keeps its lid (the done record stands)",!(ID+"/lid" in r.upd)&&r.tasksAfter.find(t=>t.id===ID).lid==="L0052");
r=run([card],[{...base,id:ID,lid:"L0051",title:"📄 Singapore Math — 5B Ch.12 L4"}],{claimed:{[ID]:1}});
ok("a CLAIMED card keeps its lid",!(ID+"/lid" in r.upd));
const other={...base,id:"lincoln_lincoln__singapore_l_L0050",lid:"L0051",day:"thursday",title:"📄 Singapore Math — 5B Ch.12 L4"};
r=run([card,other],[{...base,id:ID,lid:"L0051",title:"📄 Singapore Math — 5B Ch.12 L4"},{...other}]);
ok("never re-points onto a lesson another card already holds (no duplicate L4)",!(ID+"/lid" in r.upd));
const good={...base,id:"lincoln_lincoln__singapore_l_L0049",lid:"L0049",title:"📄 Singapore Math — 5B Ch.12 L2"};
r=run([good],[{...good}]);
ok("a card whose id and lid already agree is left alone",!Object.keys(r.upd).length,r.upd);
ok("index.html carries the guard",/const _wl=w\.lid\|\|lidOfId\(w\.id\);/.test(src));
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
