// ✅ Notebook answer check (Mom marks the day's three test-prep answers right/wrong after approving the Morning Notebook).
// Fake DOM + fake db: the sheet must show the SAME items the notebook printed, save one targeted record, and the
// cards must turn the records into per-type results with a 3-miss flag.  Run: node test_notebook_check.js
const fs=require("fs");
const html=fs.readFileSync("index.html","utf8");
const block=html.slice(html.indexOf("// ── 📖 Word-of-the-day bank"),html.indexOf("// ── Unit-insert day assignment"));
const w={};(new Function("window","document",fs.readFileSync("notebooks.js","utf8")))(w,{});
const writes=[], toasts=[]; const dom={}; 
const env=`var notebookSettings={}, tab="notebook", _mom=true, _wk=24, _len=5, nbSelectedKid="lincoln", WK="week24", DAY_DT={monday:"Sep 28",tuesday:"Sep 29",wednesday:"Sep 30",thursday:"Oct 1",friday:"Oct 2"};
var HA_LS={setItem(){}} , window={HoweNotebooks:LIB};
var document={ getElementById(id){ return DOM[id]||null; }, createElement(){ const el={style:{},remove(){ delete DOM[el.id]; },set innerHTML(v){ el._h=v; },get innerHTML(){ return el._h||""; }}; return el; }, body:{ appendChild(el){ DOM[el.id]=el; } } };
var db={ref(p){return{set(v){WR.push(["set",p,v]);},remove(){WR.push(["remove",p]);}};}};
function momHere(){return _mom;} function esc(s){return String(s||"").replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;");}
function cap(s){return s.charAt(0).toUpperCase()+s.slice(1);} function nbTargetWkNum(){return _wk;} function nbDgWeekLen(){return _len;} function renderNotebook(){} function showTab(){} function gwShowToast(m){TOASTS.push(m);}
`;
const api=(new Function("LIB","WR","DOM","TOASTS",env+block+`
return {get S(){return notebookSettings;}, set mom(v){_mom=v;}, nbCqSave,nbQbSave,nbChkOpen,nbChkMark,nbChkSave,nbChkClose,nbChkItems,nbChkHistory,nbChkByType,nbChkLineHTML,nbChkFlagRows,nbBankLowAlertHTML,nbCqCardHTML,nbQbCardHTML,nbBankSave, state(){return nbChkState;} };`))(w.HoweNotebooks,writes,dom,toasts);
let pass=0,fail=0;const ok=(c,m)=>{c?pass++:(fail++,console.log("FAIL",m));};
const srt=f=>{const b=JSON.parse(fs.readFileSync(f,"utf8"));Object.keys(b).forEach(id=>api[f.includes("cogat")?"nbCqSave":"nbQbSave"]("lincoln","items/"+id,b[id]));return Object.values(b).sort((a,b)=>a.o-b.o);};
const cq=srt("lincoln_cogat_bank.json"), qb=srt("lincoln_quant_bank.json");
api.nbCqSave("lincoln","cursor",{week:24,day:1,adv:5,from:24}); api.nbQbSave("lincoln","cursor",{week:24,day:1,adv:5,from:24});
// the sheet shows what the notebook printed
const d5={monday:"Sep 28",tuesday:"Sep 29",wednesday:"Sep 30",thursday:"Oct 1",friday:"Oct 2"};
const list=a=>a; const nb=w.HoweNotebooks.generate("lincoln",{weekNum:24,weekDates:"x",weekData:{tasks:[],dates:d5},cogatBank:{cursor:{week:24,day:1,adv:5,from:24},items:cq},quantBank:{cursor:{week:24,day:1,adv:5,from:24},items:qb}});
const it=api.nbChkItems("lincoln","week24","wednesday");
ok(it&&it.q1&&it.q1.text.indexOf(cq[2].text)>=0&&it.q1.type==="C"&&it.q1.ans===cq[2].ans,"Wednesday Q1 = bank item 3");
ok(it.q2&&it.q2.qtype==="NP"&&it.q2.ans===qb[2].ans&&/Number Puzzles/.test(it.q2.tag),"Wednesday Q2 = bank puzzle 3, with rule: "+(it.q2.rule||"").slice(0,30));
ok(it.q3&&it.q3.corrected&&nb.parent.indexOf(it.q3.corrected)>=0,"Wednesday Q3 = the built-in conventions item the companion printed");
ok(api.nbChkItems("lincoln","week24","sunday")===null,"not a school day → nothing");
// open / mark / save
writes.length=0; api.nbChkOpen("lincoln","week24","wednesday"); ok(!!dom["nbchk-dlg"]&&/Lincoln’s notebook — Wednesday/.test(dom["nbchk-dlg"].innerHTML)&&/Answer: <b[^>]*>\(/.test(dom["nbchk-dlg"].innerHTML)&&/Fix: <b/.test(dom["nbchk-dlg"].innerHTML),"sheet opens with answers for all three");
ok(/Check: put your answer back in/.test(dom["nbchk-dlg"].innerHTML)===false,"self-check line is not repeated in Mom's sheet");
api.nbChkMark("q1",true); api.nbChkMark("q2",false); api.nbChkMark("q2",false); api.nbChkMark("q2",false);   // third tap toggles back on
ok(api.state().q1.ok===true&&api.state().q2.ok===false&&api.state().q3.ok===null,"marks toggle; q3 left blank");
api.nbChkSave();
ok(writes.length===1&&writes[0][1]==="notebookSettings/lincoln/checks/week24/wednesday"&&writes[0][2].q1.ok===true&&writes[0][2].q1.t==="C"&&writes[0][2].q2.t==="NP"&&!writes[0][2].q3,"one targeted write with types; blank row omitted");
ok(!dom["nbchk-dlg"]&&/Saved Wednesday/.test(toasts.join()),"sheet closes with a toast");
// nothing marked → nothing written
writes.length=0; api.nbChkOpen("lincoln","week24","monday"); api.nbChkSave(); ok(writes.length===0,"skip/empty save writes nothing");
// Mom gate
api.mom=false; api.nbChkOpen("lincoln","week24","monday"); ok(!dom["nbchk-dlg"],"no sheet without Mom"); api.mom=true;
// history → per-type results and the 3-miss flag
api.nbBankSave("lincoln","checks","week23/friday",{q2:{t:"NP",ok:false}});
api.nbBankSave("lincoln","checks","week24/monday",{q1:{t:"A",ok:false},q2:{t:"NS",ok:true}});
api.nbBankSave("lincoln","checks","week24/tuesday",{q2:{t:"NP",ok:false}});
api.nbBankSave("lincoln","checks","week24/thursday",{q2:{t:"NP",ok:false}});
const h=api.nbChkHistory("lincoln"); ok(h.map(r=>r.wk+r.day[0]).join(",")==="23f,24m,24t,24w,24t","history in date order: "+h.map(r=>r.wk+r.day[0]).join(","));
const by=api.nbChkByType("lincoln","q2"); ok(by.NP.n===4&&by.NP.streak===4&&by.NS.streak===0&&by.NS.recent.join()==="true","per-type counts and streak: NP 4 misses in a row (Wednesday’s save counts)");
ok(/Puzzles/.test(api.nbChkLineHTML("lincoln","q2",{NP:"Puzzles",NS:"Series"},"#000"))&&/4 misses in a row/.test(api.nbChkLineHTML("lincoln","q2",{NP:"Puzzles"},"#000")),"card line shows dots + the flag");
ok(/Puzzles/.test(api.nbQbCardHTML("lincoln","Week 24"))&&/✗/.test(api.nbQbCardHTML("lincoln","Week 24")),"the bank card carries the results line");
ok(/Lincoln · Puzzles.*4 misses in a row/.test(api.nbBankLowAlertHTML())&&/Notebook heads-up/.test(api.nbBankLowAlertHTML()),"Mom's Day flags the streak");
console.log("\n"+pass+" passed, "+fail+" failed");process.exit(fail?1:0);
