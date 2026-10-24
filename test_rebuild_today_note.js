/* 🔁 CBTODAYNOTE (her pick 2026-10-24): the Build preview warns when TODAY's unchecked card for the subject is about to move.
 * Replica of Makenzie's AAS 4 on Fri 2026-10-23: today's cell "Lesson 6 · day 2 of 5" unchecked, the preview puts it on Mon 10/26.
 * run: node test_rebuild_today_note.js */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,300)+")":"")); } };
const fnIn=(s,name)=>{ const i=s.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); let d=0; for(let k=s.indexOf("{",i);k<s.length;k++){ if(s[k]==="{") d++; else if(s[k]==="}"&&--d===0) return s.slice(i,k+1); } throw new Error("unterminated "+name); };
function world(o){
  const ctx={console,Object,Array,String,Number,Date,JSON,
    currData:{lessons:{makenzie:{14:{date:"2026-10-22",aas_4:"Lesson 6 · day 1 of 5"},15:{date:"2026-10-23",aas_4:"Lesson 6 · day 2 of 5"},16:{date:"2026-10-26",aas_4:"Lesson 6 · day 3 of 5"}}},subjects:{makenzie:{aas_4:{display:"AAS 4"}}}},
    weekData:{tasks:[{id:"w3_fri_mk_aas",who:"makenzie",subjectKey:"aas_4",day:"friday"},{id:"w3_fri_mk_aas_c",who:"makenzie",subjectKey:"aas_4",day:"friday"}]},
    checked:o.checked||{}, claimed:o.claimed||{}, _todayDay:"friday", effectiveDay:t=>t.day,
    cbTodayISO:()=>"2026-10-23", esc:s=>String(s), gwParseDate:s=>new Date(s+"T12:00:00")};
  vm.createContext(ctx); vm.runInContext(fnIn(src,"cbTodayMoveNote")+"\n"+fnIn(src,"cbTodayMoveHTML"),ctx); return ctx;
}
const RES={assignments:[{date:"2026-10-26",text:"Lesson 6 · day 2 of 5"},{date:"2026-10-27",text:"Lesson 6 · day 3 of 5"}]};
{ const w=world({}); const n=w.cbTodayMoveNote("makenzie","aas_4",RES);
  ok("unchecked today + the same lesson later in the preview → a note (to Mon 10/26)", n&&n.to==="2026-10-26"&&n.text==="Lesson 6 · day 2 of 5", n);
  const h=w.cbTodayMoveHTML("makenzie","aas_4",RES);
  ok("the line names the subject, the lesson and the day, and says what to do", /Today’s AAS 4 card isn’t checked off yet/.test(h)&&/Lesson 6 · day 2 of 5/.test(h)&&/Mon, Oct 26/.test(h)&&/check it off first, then build/.test(h)&&/Mon repeats it/.test(h), h); }
ok("today's card checked → no note", world({checked:{w3_fri_mk_aas:true}}).cbTodayMoveNote("makenzie","aas_4",RES)===null);
ok("today's card sent to Mom (claimed) → no note", world({claimed:{w3_fri_mk_aas:true}}).cbTodayMoveNote("makenzie","aas_4",RES)===null);
ok("the preview keeps today's lesson on today (nothing later) → no note", world({}).cbTodayMoveNote("makenzie","aas_4",{assignments:[{date:"2026-10-23",text:"Lesson 6 · day 2 of 5"}]})===null);
ok("no lesson on today's row for this subject → no note", world({}).cbTodayMoveNote("makenzie","cle",RES)===null);
ok("an error preview → no note", world({}).cbTodayMoveNote("makenzie","aas_4",{error:"x"})===null);
ok("a carry mirror (_c) never counts as today's card", (()=>{ const w=world({checked:{w3_fri_mk_aas_c:true}}); return !!w.cbTodayMoveNote("makenzie","aas_4",RES); })());
ok("the preview card draws it right under the warnings", /r\.warnings\.forEach[^\n]*\n\s*if\(typeof cbTodayMoveHTML==="function"\) h\+=cbTodayMoveHTML\(cbKid,cbSubjKey,r\);/.test(src));
ok("display only: the block writes nothing", !/db\.ref\(/.test(src.slice(src.indexOf("// CBTODAYNOTE_START"),src.indexOf("// CBTODAYNOTE_END"))));
ok("no 🔀 anywhere in index.html", src.indexOf("🔀")<0);
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
