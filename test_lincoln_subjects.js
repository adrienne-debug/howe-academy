// ☑ Lincoln's daily page — "Today's subjects": one check box per task, in clock order, coloured by the
// schedule's Mom level (none → on my own · maybe → may need Mom · required → Mom with me).
// Run: node test_lincoln_subjects.js
const fs=require("fs");const w={};(new Function("window","document",fs.readFileSync("notebooks.js","utf8")))(w,{});
let pass=0,fail=0;const ok=(c,m)=>{c?pass++:(fail++,console.log("FAIL",m));};
const T=(title,time,mom,day)=>({who:"lincoln",day:day||"monday",title:title,time:time,mom:mom});
const tasks=[T("📖 Closing Notebook — Closing Notebook","3:10 PM","none"),T("📄 Math Sprints — Math Sprints","2:00 PM","required"),T("📖 Morning Notebook — Morning Notebook","10:00 AM","none"),
  T("📄 Singapore Math — 5B Ch.11 L10","10:50 AM","maybe"),T("💻 German Flash Cards — German Flash Cards","10:05 AM"),T("🏃 Sprint","2:55 PM","required"),
  T("📄 Ellis thing — x","9:00 AM","required","monday")].map((t,i)=>i===6?Object.assign(t,{who:"ellis"}):t).concat([T("📖 Tuesday only — y","9:00 AM","required","tuesday")]);
const out=w.HoweNotebooks.generate("lincoln",{weekNum:23,weekDates:"x",weekData:{tasks:tasks,dates:{monday:"Sep 21",tuesday:"Sep 22"}}}).student;
const pages=out.split('<div class="page').filter(p=>/Today's subjects/.test(p));
ok(pages.length===2,"two daily pages");
const mon=pages[0], rows=(mon.match(/<div class="subj-row [^"]*">[\s\S]*?<\/div>/g)||[]);
ok(rows.length===6,"one row per Lincoln Monday task (6), got "+rows.length);
ok(rows.every(r=>/<span class="subj-box"><\/span>/.test(r)),"every row has a check box");
const names=rows.map(r=>(r.match(/subj-name">([^<]*)/)||[])[1]);
ok(names.join("|")==="Morning Notebook|💻 German Flash Cards|Singapore Math|Math Sprints|Sprint|Closing Notebook","clock order: "+names.join("|"));
const cls=rows.map(r=>(r.match(/subj-row (subj-\w+)/)||[])[1]);
ok(cls.join(",")==="subj-own,subj-own,subj-maybe,subj-req,subj-req,subj-own","colour follows t.mom (missing mom = on my own): "+cls.join(","));
ok(/subj-maybe">[\s\S]*?MOM\?<\/span>/.test(rows[2])&&/>MOM<\/span>/.test(rows[3])&&!/subj-tag/.test(rows[0]),"MOM? / MOM tags for grey printouts");
ok(/class="subj-key"/.test(mon)&&/On my own/.test(mon)&&/May need Mom/.test(mon)&&/Mom with me/.test(mon),"colour key prints");
const listOf=pg=>(pg.match(/<div class="subj-list[\s\S]*?<div class="subj-key">/)||[""])[0];   // the skill self-check table below lists the whole WEEK by design
ok(!/Ellis thing/.test(out)&&!/Tuesday only/.test(listOf(mon))&&/Tuesday only/.test(listOf(pages[1])),"only his tasks, only that day");
ok(!/class="pill /.test(mon),"old pills are gone from the daily page");
// doubled subjects → one box, first position, strongest Mom level
const dup=w.HoweNotebooks.generate("lincoln",{weekNum:23,weekDates:"x",weekData:{tasks:[T("📖 Ind Reading — a","10:00 AM","none"),T("📄 Singapore Math — L1","10:30 AM","maybe"),T("📖 Ind Reading — b","11:00 AM","required"),T("📄 Singapore Math — L2","1:00 PM","none"),T("📖 ind reading — c","2:00 PM","maybe")],dates:{monday:"Sep 21"}}}).student;
const dl=listOf(dup), dn=(dl.match(/subj-name">([^<]*)/g)||[]).map(x=>x.slice(11)), dc=(dl.match(/subj-row (subj-\w+)/g)||[]).map(x=>x.slice(9));
ok(dn.join("|")==="Ind Reading|Singapore Math"&&dc.join(",")==="subj-req,subj-maybe","doubled subjects share one box: "+dn.join("|")+" / "+dc.join(","));
const empty=w.HoweNotebooks.generate("lincoln",{weekNum:23,weekDates:"x",weekData:{tasks:[],dates:{monday:"Sep 21"}}}).student;
ok(!/class="subj-key"/.test(empty.split("<body")[1]||""),"no key on a day with no subjects");
console.log("\n"+pass+" passed, "+fail+" failed");process.exit(fail?1:0);
