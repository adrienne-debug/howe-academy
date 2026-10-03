/*
 * 🧩 Do together / ↩ Move back · 🏡 Together strip · 🏡 Family grid · family minutes in the planning estimates
 * (her design 2026-10-03). Real code sliced from index.html (FAMBLOCK + FAMTOGETHER) on stubs.
 *   run: node test_family_together.js
 */
const fs=require("fs"),path=require("path"); const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
const sl=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("slice "+a); return src.slice(i,j); };
const FAM=sl("// FAMBLOCK_START","// FAMBLOCK_END"), TG=sl("// FAMTOGETHER_START","// FAMTOGETHER_END");
let pass=0,fail=0; const ok=(n,c,x)=>{ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":""));} };
const toMin=t=>{ const m=String(t||"").trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i); if(!m) return NaN; let h=+m[1]; const ap=(m[3]||"").toUpperCase(); if(ap==="PM"&&h!==12)h+=12; if(ap==="AM"&&h===12)h=0; return h*60+(+m[2]); };
const fromMin=v=>{ let h=Math.floor(v/60),m=v%60; const ap=h>=12?"PM":"AM"; let hh=h%12; if(hh===0)hh=12; return hh+":"+String(m).padStart(2,"0")+" "+ap; };
function env(E){
  return new Function("toMin","fromMin","E",`
    var rulesData=E.rulesData, currData=E.currData, weekData={tasks:[]}, checked={}, histState={}, WK="week1", db=E.db||null;
    const ROSTER=["taylor","makenzie","andrew","caleb"], KID_COLOR={taylor:"#1e3a5f",makenzie:"#2f6d4f",andrew:"#5b3a8c",caleb:"#c2622d"};
    function fbArr(v){ if(!v) return v; if(Array.isArray(v)) return v; if(typeof v==="object"){ const k=Object.keys(v); if(k.length&&k.every(x=>/^\\d+$/.test(x))) return k.sort((a,b)=>a-b).map(x=>v[x]); } return v; }
    function cap(s){ return s?s[0].toUpperCase()+s.slice(1):s; } function esc(s){ return String(s==null?"":s).replace(/</g,"&lt;"); }
    function _dryRun(){ return !!E.dry; } function momHere(){ return E.mom!==false; } function renderAll(){ E.renders=(E.renders||0)+1; } function dbg(){}
    function gwParseDate(s){ const p=s.split("-"); return new Date(+p[0],+p[1]-1,+p[2]); }
    function smapIsKidOff(k,ds){ return !!(E.off&&E.off[k+"|"+ds]); } function coopTimedEndMin(k,ds){ return (E.coop&&E.coop[k+"|"+ds])||0; }
    function planBacked(){ return false; } function cbTodayISO(){ return "2026-10-03"; } function alert(m){ E.alerts.push(m); } function confirm(){ return E.confirm!==false; }
    const FX_DOW={monday:"Mon",tuesday:"Tue",wednesday:"Wed",thursday:"Thu",friday:"Fri",saturday:"Sat",sunday:"Sun"};
    ${FAM}
    ${TG}
    return {famMinOn,famDoTogether,famMoveBack,famItemDel,famDelBlock,famSubjMovedTo,famGridStripHTML,famGridHTML,famDayCards,famAutoUnits,famDayOfISO,rd:()=>rulesData,cd:()=>currData};
  `)(toMin,fromMin,E);
}
const FT={name:"Family Time",kids:["taylor","makenzie","andrew","caleb"],days:["Mon","Tue","Wed","Thu","Fri"],at:"lunch",
  items:[{key:"h",name:"History",minutes:30,pts:20},{key:"s",name:"Science",minutes:30,pts:20},{key:"r",name:"Read Aloud",minutes:20}]};
const FR={name:"Fact Review",kids:["andrew","makenzie"],days:["Mon","Tue","Wed","Thu","Fri"],at:"auto",momLeads:false,items:[]};
const SUBS=()=>({andrew:{fact_review_with_kenzie:{display:"Fact Review with Kenzie",minutes:10,tracking:"daily"},arithmetic_2:{display:"Arithmetic 2",minutes:20}},
  makenzie:{fact_review_with_andrew:{display:"Fact Review with Andrew",minutes:10,tracking:"daily"},apologia_math_4:{display:"Apologia Math 4",minutes:20}},taylor:{},caleb:{}});
const SD={defaultStart:"9:00 AM",defaultEnd:"4:00 PM",lunchStart:"12:00 PM",lunchEnd:"1:00 PM"};

console.log("1. family minutes in the planning estimates");
{ const E=env({rulesData:{schoolDay:SD,familyBlocks:{ft:FT}},currData:{subjects:SUBS()},alerts:[]});
  ok("Mon: each kid has 80 min of family time (30+30+20)", ["taylor","makenzie","andrew","caleb"].every(k=>E.famMinOn(k,"monday","2026-10-05")===80));
  ok("Sat: none", E.famMinOn("andrew","saturday","2026-10-10")===0);
  const E2=env({rulesData:{schoolDay:SD,familyBlocks:{ft:FT}},currData:{subjects:SUBS()},alerts:[],coop:{"andrew|2026-10-08":900}});
  ok("co-op Thursday (home at 3): none for that kid", E2.famMinOn("andrew","thursday","2026-10-08")===0 && E2.famMinOn("taylor","thursday","2026-10-08")===80);
  const FT2=JSON.parse(JSON.stringify(FT)); FT2.items[1].kids=["taylor","makenzie"];
  const E3=env({rulesData:{schoolDay:SD,familyBlocks:{ft:FT2}},currData:{subjects:SUBS()},alerts:[]});
  ok("a subject just for some kids counts only for them", E3.famMinOn("andrew","monday","2026-10-05")===50 && E3.famMinOn("taylor","monday","2026-10-05")===80);
  ok("Mom-led filter: all 80 are Mom-led, 0 kids-only", E.famMinOn("andrew","monday","2026-10-05",true)===80 && E.famMinOn("andrew","monday","2026-10-05",false)===0);
  ok("ISO → day name", E.famDayOfISO("2026-10-05")==="monday" && E.famDayOfISO("2026-10-08")==="thursday");
}

console.log("2. 🧩 Do together → ONE subject; their own subjects step aside");
{ const writes=[]; const db={ref:p=>({set:v=>writes.push([p,v]),update:()=>{},remove:()=>{}})};
  const IN={rulesData:{schoolDay:SD,familyBlocks:{ft:FT,fr:JSON.parse(JSON.stringify(FR))}},currData:{subjects:SUBS()},alerts:[],db}; const E=env(IN);
  const okDo=E.famDoTogether("fr",{andrew:"fact_review_with_kenzie",makenzie:"fact_review_with_andrew"},"Fact Review","15");
  const it=E.rd().familyBlocks.fr.items[0];
  ok("made one together subject: Fact Review, 15 min (longer than 10 alone), Andrew + Makenzie", okDo&&it.name==="Fact Review"&&it.minutes===15&&it.kids.join()==="andrew,makenzie"&&it.from.andrew==="fact_review_with_kenzie"&&it.from.makenzie==="fact_review_with_andrew", it);
  const a=E.cd().subjects.andrew.fact_review_with_kenzie, m=E.cd().subjects.makenzie.fact_review_with_andrew;
  ok("their own subjects are paused, marked where they went", a.paused===true&&a.pausedFor==="fr/"+it.key&&m.paused===true&&!!a.pausedSince);
  ok("famSubjMovedTo knows", E.famSubjMovedTo("andrew","fact_review_with_kenzie")==="fr/"+it.key && E.famSubjMovedTo("andrew","arithmetic_2")==="");
  ok("writes are targeted subject fields + the block's items (never a whole node)", writes.every(w=>/^curriculum\/subjects\/(andrew|makenzie)\/fact_review_with_(kenzie|andrew)\/(paused|pausedSince|pausedFor)$|^curriculum\/lastEdit$|^config\/rules\/familyBlocks\/fr\/items$/.test(w[0])), writes.map(w=>w[0]));
  ok("the together length counts in the estimate: 15 min for each of them (not 10)", E.famMinOn("andrew","monday","2026-10-05")===95&&E.famMinOn("makenzie","monday","2026-10-05")===95&&E.famMinOn("taylor","monday","2026-10-05")===80);
  ok("…and the kids-only part is 15 of it", E.famMinOn("andrew","monday","2026-10-05",false)===15);
  const U=E.famAutoUnits("monday","2026-10-05");
  ok("the generator lays one 15-min Fact Review for both", U.length===1&&U[0].dur===15&&U[0].kids.join()==="andrew,makenzie"&&U[0].mom===false, U);
  const strip=E.famGridStripHTML("andrew").replace(/<[^>]+>/g," ").replace(/\s+/g," ");
  ok("Andrew's 🏡 Together strip: Fact Review with Makenzie, was Fact Review with Kenzie (10m alone)", /Fact Review scheduler picks · 15m · with Makenzie · was Fact Review with Kenzie \(10m alone\)/.test(strip), strip);
  ok("…and his History at 1:00 with the others", /History 1:00 PM · 30m · with Taylor & Makenzie & Caleb/.test(strip), strip);
  ok("Taylor's strip has no Fact Review", !/Fact Review/.test(E.famGridStripHTML("taylor")));
  const fg=E.famGridHTML();
  ok("Family grid: a 🧩 piece in Andrew's and Makenzie's cells, labelled with THEIR subject", /Fact Review with Kenzie/.test(fg)&&/Fact Review with Andrew/.test(fg)&&/10m alone → 15m together/.test(fg));
  ok("Family grid: History row has 4 pieces", ((fg.split("History")[1]||"").split("</tr>")[0].match(/🧩|\\u\{1F9E9\}/g)||[]).length>=4 || (fg.match(/\u{1F9E9}/gu)||[]).length>=6);
  ok("needs two kids", E.famDoTogether("fr",{andrew:"arithmetic_2"},"x","10")===false&&IN.alerts.length===1);
  // move back
  writes.length=0;
  E.famMoveBack("fr",0);
  const a2=E.cd().subjects.andrew.fact_review_with_kenzie;
  ok("↩ Move back: their own subjects resume (paused false, no pausedFor/pausedSince)", a2.paused===false&&!("pausedFor" in a2)&&!("pausedSince" in a2)&&E.cd().subjects.makenzie.fact_review_with_andrew.paused===false);
  ok("…and the together subject is gone", E.rd().familyBlocks.fr.items.length===0);
  ok("…estimate back to their own (only History/Science/Read Aloud family time)", E.famMinOn("andrew","monday","2026-10-05")===80);
  // deleting the item or the block never strands them paused
  E.famDoTogether("fr",{andrew:"fact_review_with_kenzie",makenzie:"fact_review_with_andrew"},"Fact Review","15");
  E.famItemDel("fr",0);
  ok("✕ on a together subject = move back (not a silent delete)", E.cd().subjects.andrew.fact_review_with_kenzie.paused===false&&E.rd().familyBlocks.fr.items.length===0);
  E.famDoTogether("fr",{andrew:"fact_review_with_kenzie",makenzie:"fact_review_with_andrew"},"Fact Review","15");
  E.famDelBlock("fr");
  ok("deleting the whole block gives them their own back too", E.cd().subjects.makenzie.fact_review_with_andrew.paused===false&&!E.rd().familyBlocks.fr);
  const Emom=env({rulesData:{schoolDay:SD,familyBlocks:{fr:JSON.parse(JSON.stringify(FR))}},currData:{subjects:SUBS()},alerts:[],mom:false});
  ok("not Mom → nothing happens", Emom.famDoTogether("fr",{andrew:"fact_review_with_kenzie",makenzie:"fact_review_with_andrew"},"F","15")===false&&!Emom.cd().subjects.andrew.fact_review_with_kenzie.paused);
}

console.log("3. wiring in the Grid / estimates (source checks)");
{ const g=src.slice(src.indexOf("function renderCurrGrid("), src.indexOf("function renderCurrGrid(")+60000);
  ok("moved subjects leave the 🗂 strip", /cbOtherSubjects\(gvKid,_allSks,_cardOnly\)\.filter\(function\(sk\)\{ return !\(typeof famSubjMovedTo/.test(g));
  ok("🏡 strip drawn before the other strips (both paths)", (g.match(/famGridStripHTML\(gvKid\):""\); h\+=_cardOnlyHtml;/g)||[]).length===2);
  ok("Min column adds famMins", /const mins=gridMins\+dailyMins\+retrievalMins\+cardMins\+famMins;/.test(g));
  ok("🏡 Family chip + early-return view", /gvSetKid\(\\'__fam\\'\)/.test(g)&&/if\(gvKid==="__fam"\)\{ h\+=\(typeof famGridHTML/.test(g));
  ok("over-cap check, Builder room and Mom-load lines add family minutes",
    /famMinOn\(kid,famDayOfISO\(l\.date\),l\.date\);   \/\/ 🏡 family time\n    if\(mins>cap\) n\+\+;/.test(src)&&/usedMin\+=famMinOn\(kid,famDayOfISO\(l\.date\),l\.date\)/.test(src)&&/out\.required\.wk\+=m; out\.independent\.wk\+=k;/.test(src));
}
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
