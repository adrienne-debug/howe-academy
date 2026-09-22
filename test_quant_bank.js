// 🔢 Number-reasoning bank (Lincoln): the Notebook-tab card (index.html) + the notebook side (notebooks.js).
// Card code runs against a fake db that records writes — every write must be a targeted quantBank path.
// Run: node test_quant_bank.js
const fs=require("fs");
const html=fs.readFileSync("index.html","utf8");
const block=html.slice(html.indexOf("// ── 📖 Word-of-the-day bank"),html.indexOf("// ── Unit-insert day assignment"));
const w={};(new Function("window","document",fs.readFileSync("notebooks.js","utf8")))(w,{});
const writes=[];
const env=`var notebookSettings={}, tab="notebook", _mom=true, _wk=24, _len=5, nbSelectedKid="lincoln";
var HA_LS={setItem(){}} , window={HoweNotebooks:LIB}, document={getElementById(){return null;}};
var db={ref(p){return{set(v){WR.push(["set",p,v]);},remove(){WR.push(["remove",p]);}};}};
function momHere(){return _mom;} function esc(s){return String(s||"").replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;");}
function cap(s){return s.charAt(0).toUpperCase()+s.slice(1);} function nbTargetWkNum(){return _wk;} function nbDgWeekLen(){return _len;} function renderNotebook(){} function showTab(){}
`;
const api=(new Function("LIB","WR",env+block+`
return {get S(){return notebookSettings;}, set mom(v){_mom=v;}, set wk(v){_wk=v;},
 nbQbList,nbQbCtx,nbQbSave,nbQbPlan,nbQbLeft,nbQbSetStart,nbQbOpenForm,nbQbSaveDraft,nbQbDelete,nbQbOpenPaste,nbQbAddPasted,nbQbPersistCursor,nbQbCardHTML,nbBankLowAlertHTML,nbWbList,nbCqList,
 draft(){ return nbQbDraft; }, paste(v){ nbQbPaste=v; }, msg(){return nbQbMsg;} };`))(w.HoweNotebooks,writes);
let pass=0,fail=0;const ok=(c,m)=>{c?pass++:(fail++,console.log("FAIL",m));};
const bank=JSON.parse(fs.readFileSync("lincoln_quant_bank.json","utf8"));const qs=Object.keys(bank).map(k=>bank[k]).sort((a,b)=>a.o-b.o);
const cnt={};qs.forEach(q=>cnt[q.type]=(cnt[q.type]||0)+1);
ok(qs.length===125&&JSON.stringify(cnt)===JSON.stringify({NS:25,NA:25,NP:25,ET:21,BK:9,CO:20})&&qs.every((q,i)=>q.o===i+1),"seed: 125 items, expected mix: "+JSON.stringify(cnt));
ok(qs.every(q=>q.type==="BK"?(!q.c&&/pages \d+–\d+/.test(q.text)):(q.c.length===5&&new Set(q.c).size===5&&"ABCDE".includes(q.ans)&&q.rule)),"seed: choices/answers/rules well-formed, book days have pages");
ok(qs.filter(q=>q.type==="BK").length===9&&qs.slice(0,45).filter((q,i)=>i%5===4).every(q=>q.type==="BK"),"book days are the 5th slot of weeks 1–9");
ok(api.nbQbCtx("lincoln")===null&&api.nbBankLowAlertHTML()==="","empty bank → null ctx, no alert");
ok(/Empty — the built-in math questions print/.test(api.nbQbCardHTML("lincoln","Week 24")),"empty card text");
Object.keys(bank).forEach(id=>api.nbQbSave("lincoln","items/"+id,bank[id]));
ok(api.nbQbList("lincoln").length===125&&writes.every(x=>/^notebookSettings\/lincoln\/quantBank\/items\/n\d{3}$/.test(x[1])),"seed writes are per-item quantBank paths");
ok(api.nbWbList("lincoln").length===0&&api.nbCqList("lincoln").length===0,"other banks untouched");
let card=api.nbQbCardHTML("lincoln","Week 24");
ok(/Week 24 prints: <span[^>]*>Series · Analogies · Puzzles · Elapsed time · 📘 Book day/.test(card)&&/120 unused items after this week/.test(card),"card shows this week + what is left");
writes.length=0;api.nbQbPersistCursor("lincoln",{quantBankCursor:{week:24,day:1,adv:5,from:24}});api.nbQbPersistCursor("lincoln",{quantBankCursor:{week:24,day:1,adv:5,from:24}});
ok(writes.length===1&&writes[0][1]==="notebookSettings/lincoln/quantBank/cursor","cursor written once, targeted");
api.mom=false;writes.length=0;ok(api.nbQbCardHTML("lincoln","x")==="","hidden without Mom");api.nbQbSetStart("lincoln",9);api.nbQbDelete("lincoln","n001");api.nbQbDelete("lincoln","n001");ok(writes.length===0&&api.nbQbList("lincoln").length===125,"no writes without Mom");api.mom=true;
api.nbQbSetStart("lincoln",118);ok(/Number Reasoning bank <span[^>]*>· 3 unused items left/.test(api.nbBankLowAlertHTML()),"alert names the bank");api.nbQbSetStart("lincoln",1);
// add: a book day needs no choices; a question needs 4+
writes.length=0;api.nbQbOpenForm("lincoln","");Object.assign(api.draft(),{type:"BK",text:"Practice Test 2 · Number Series · pages 88–90"});api.nbQbSaveDraft("lincoln");
let L=api.nbQbList("lincoln");ok(L.length===126&&L[125].type==="BK"&&!L[125].c&&writes.length===1,"book day saved without choices");
api.nbQbOpenForm("lincoln","");Object.assign(api.draft(),{type:"NS",text:"2  4  8  ?",c0:"10",c1:"12",ans:"B"});api.nbQbSaveDraft("lincoln");ok(/at least 4/.test(api.msg()),"question needs 4 choices");
Object.assign(api.draft(),{c2:"14",c3:"16",rule:"double"});api.nbQbSaveDraft("lincoln");L=api.nbQbList("lincoln");ok(L.length===127&&L[126].rule==="double"&&L[126].ans==="B","question saved with rule");
api.nbQbOpenPaste();api.paste("NA | [2 → 5]  [4 → 9]  [6 → ?] | 11 | 12 | 13 | 14 | 15 | C | ×2 then +1\nBK | Practice Test 2 · Paper Folding · pages 75–79 | timed\nNS | no answer letter | 1 | 2 | 3 | 4 | 5\nzz | bad | 1 | 2 | 3 | 4 | A");api.nbQbAddPasted("lincoln");
L=api.nbQbList("lincoln");ok(L.length===129&&L[127].rule==="×2 then +1"&&L[128].type==="BK"&&L[128].rule==="timed"&&/line 3: missing the answer letter/.test(api.msg())&&/line 4: pick a type/.test(api.msg()),"paste: good lines added, bad lines reported: "+api.msg());
api.nbQbOpenForm("lincoln","");api.draft().text='x"><img>';const fh=api.nbQbCardHTML("lincoln","W");ok(!/<img>/.test(fh)&&["nbqb-type","nbqb-text","nbqb-c0","nbqb-ans","nbqb-rule"].every(id=>fh.indexOf('id="'+id+'"')>=0),"form escaped + every input has an id");
// ── notebooks.js side ──
const NEW=w.HoweNotebooks, d5={Monday:"a",Tuesday:"b",Wednesday:"c",Thursday:"d",Friday:"e"};
const mk=(wk,cursor)=>({weekNum:wk,weekDates:"x",weekData:{tasks:[],dates:d5},quantBank:{cursor:cursor||null,items:qs}});
const base=NEW.generate("lincoln",{weekNum:24,weekDates:"x",weekData:{tasks:[],dates:d5}});ok(/Iowa · /.test(base.student)&&base.quantBankCursor===undefined,"no bank → built-in Iowa questions, no cursor");
let o=NEW.generate("lincoln",mk(24));
ok(/🔢 Number Series/.test(o.student)&&/🔢 Number Analogies/.test(o.student)&&/🔢 Number Puzzles/.test(o.student)&&/🕐 Elapsed Time/.test(o.student)&&/📘 CogAT Book Day/.test(o.student)&&!/Iowa · /.test(o.student),"the five slots print with bank tags");
ok(/Check: does your rule work for <b>every<\/b> number/.test(o.student)&&/<b>both<\/b> pairs/.test(o.student)&&/<b>both sides<\/b> match/.test(o.student),"self-check lines print");
ok(/Figure Classification · pages 21–27/.test(o.student)&&/class="subj-box"/.test(o.student.split("📘 CogAT Book Day")[1].slice(0,400)),"book day prints as an assignment with a check box");
ok(JSON.stringify(o.quantBankCursor)===JSON.stringify({week:24,day:1,adv:5,from:24}),"cursor out");
const key=o.parent;ok(/key-label">Q2<\/div><div><span class="key-ans">\([A-E]\)<\/span> <span class="key-sub">[^<]*— 🔢 Number Series<br><span style="color:var\(--green-mid\);">add \d+ each time/.test(key),"key shows the answer AND the rule");
ok(/key-ans">📘<\/span> <span class="key-sub">Practice Test 1 · Figure Classification/.test(key),"key shows the book assignment");
let o2=NEW.generate("lincoln",mk(30,{week:30,day:113,adv:5,from:24}));ok(/Number Puzzles/.test(o2.student)&&/<div class="unk">\?<\/div>|<span class="unk">\?<\/span>/.test(o2.student),"puzzle prints its ? in a box");
let oB=NEW.generate("lincoln",mk(23,{week:24,day:1,adv:5,from:24}));ok(/Iowa · /.test(oB.student)&&oB.quantBankCursor===undefined,"week before the start = built-in, no cursor");
let oe=NEW.generate("lincoln",{weekNum:24,weekDates:"x",weekData:{tasks:[],dates:d5},quantBank:{items:[{type:"NP",text:"? + <b> = 9 / ◆ = 3",c:["5","6","7","8"],ans:"b",rule:"<x>"}]}});
ok(/<span class="unk">\?<\/span> \+ &lt;b> = 9/.test(oe.student)&&/\(B\)/.test(oe.parent)&&/&lt;x>/.test(oe.parent),"odd input escaped, 4 choices + lower-case answer tolerated");
console.log("\n"+pass+" passed, "+fail+" failed");process.exit(fail?1:0);
