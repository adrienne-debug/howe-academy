// ✏️ Conventions bank (Lincoln): the Notebook-tab card (index.html) + the notebook side (notebooks.js) + the answer-check row.
// Run: node test_conv_bank.js
const fs=require("fs");
const html=fs.readFileSync("index.html","utf8");
const block=html.slice(html.indexOf("// ── 📖 Word-of-the-day bank"),html.indexOf("// ── Unit-insert day assignment"));
const w={};(new Function("window","document",fs.readFileSync("notebooks.js","utf8")))(w,{});
const writes=[], dom={}, toasts=[];
const env=`var notebookSettings={}, tab="notebook", _mom=true, _wk=24, _len=5, nbSelectedKid="lincoln", WK="week24", DAY_DT={monday:"a",tuesday:"b",wednesday:"c",thursday:"d",friday:"e"};
var HA_LS={setItem(){}} , window={HoweNotebooks:LIB};
var document={ getElementById(id){ return DOM[id]||null; }, createElement(){ const el={style:{},remove(){ delete DOM[el.id]; },set innerHTML(v){ el._h=v; },get innerHTML(){ return el._h||""; }}; return el; }, body:{ appendChild(el){ DOM[el.id]=el; } } };
var db={ref(p){return{set(v){WR.push(["set",p,v]);},remove(){WR.push(["remove",p]);}};}};
function momHere(){return _mom;} function esc(s){return String(s||"").replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;");}
function cap(s){return s.charAt(0).toUpperCase()+s.slice(1);} function nbTargetWkNum(){return _wk;} function nbDgWeekLen(){return _len;} function renderNotebook(){} function showTab(){} function gwShowToast(m){TOASTS.push(m);}
`;
const api=(new Function("LIB","WR","DOM","TOASTS",env+block+`
return {get S(){return notebookSettings;}, set mom(v){_mom=v;}, nbCvList,nbCvCtx,nbCvSave,nbCvPlan,nbCvLeft,nbCvSetStart,nbCvOpenForm,nbCvSaveDraft,nbCvDelete,nbCvOpenPaste,nbCvAddPasted,nbCvPersistCursor,nbCvCardHTML,nbBankLowAlertHTML,nbQbList,nbChkOpen,nbChkMark,nbChkSave,nbBankSave,nbChkByType,
 draft(){return nbCvDraft;}, paste(v){nbCvPaste=v;}, msg(){return nbCvMsg;}, chk(){return nbChkState;} };`))(w.HoweNotebooks,writes,dom,toasts);
let pass=0,fail=0;const ok=(c,m)=>{c?pass++:(fail++,console.log("FAIL",m));};
const bank=JSON.parse(fs.readFileSync("lincoln_conv_bank.json","utf8"));const qs=Object.keys(bank).map(k=>bank[k]).sort((a,b)=>a.o-b.o);
const D=new Set(fs.readFileSync("/usr/share/dict/words","utf8").split("\n").map(x=>x.toLowerCase()));
ok(qs.length===125&&qs.every((q,i)=>q.o===i+1&&q.c.length===(q.type==="SP"?5:4)&&q.c[q.c.length-1]==="(No mistake)"&&"ABCDE".includes(q.ans)&&q.rule),"seed: 125 items, choices end in (No mistake) (5 for spelling, 4 for usage), rule on each");
ok(qs.filter((q,i)=>i%5===1).every(q=>q.type==="US")&&qs.filter((q,i)=>i%5!==1&&i%5!==3).every(q=>q.type==="SP"),"Tue = usage, Mon/Wed/Fri = spelling");
const sp=qs.filter(q=>q.type==="SP"&&q.ans!=="E");
ok(sp.every(q=>{const wrong=q.c["ABCD".indexOf(q.ans)];return !D.has(wrong.toLowerCase())&&q.rule.startsWith(wrong+" → ");}),"every keyed misspelling is not a real word and the rule names it");
ok(sp.every(q=>q.c.slice(0,4).every((c,i)=>"ABCD"[i]===q.ans||D.has(c.toLowerCase())||/s$|es$|ed$|ing$|er$|ly$/.test(c))),"every other spelling choice is a real word");
const us=qs.filter(q=>q.type==="US"&&q.ans!=="D"); ok(us.every(q=>!/Lincoln|Ellis|Lucy|Julian/.test(q.c["ABC".indexOf(q.ans)])),"no family name on an error line");
ok(new Set(sp.map(q=>q.rule.split(" → ")[1].split(" ")[0])).size===sp.length,"no target word repeats");
ok(qs.filter(q=>q.ans==="E"||(q.type==="US"&&q.ans==="D")).length>=15,"No mistake is live: "+qs.filter(q=>q.ans==="E"||(q.type==="US"&&q.ans==="D")).length+" items");
// card
ok(api.nbCvCtx("lincoln")===null&&/Empty — the built-in fix-the-sentence items print/.test(api.nbCvCardHTML("lincoln","Week 24")),"empty bank → null ctx, empty card text");
Object.keys(bank).forEach(id=>api.nbCvSave("lincoln","items/"+id,bank[id]));
ok(api.nbCvList("lincoln").length===125&&writes.every(x=>/^notebookSettings\/lincoln\/convBank\/items\/c\d{3}$/.test(x[1]))&&api.nbQbList("lincoln").length===0,"seed writes are per-item convBank paths; other banks untouched");
ok(/Week 24 prints: <span[^>]*>Spelling · Usage · Spelling · Spelling · Spelling/.test(api.nbCvCardHTML("lincoln","Week 24")),"card shows this week's shape");
writes.length=0;api.nbCvPersistCursor("lincoln",{convBankCursor:{week:24,day:1,adv:5,from:24}});api.nbCvPersistCursor("lincoln",{convBankCursor:{week:24,day:1,adv:5,from:24}});ok(writes.length===1&&writes[0][1]==="notebookSettings/lincoln/convBank/cursor","cursor written once");
api.mom=false;writes.length=0;ok(api.nbCvCardHTML("lincoln","x")==="","hidden without Mom");api.nbCvSetStart("lincoln",9);ok(writes.length===0,"no writes without Mom");api.mom=true;
api.nbCvSetStart("lincoln",118);ok(/Conventions bank <span[^>]*>· 3 unused items left/.test(api.nbBankLowAlertHTML()),"alert names the bank");api.nbCvSetStart("lincoln",1);
api.nbCvOpenForm("lincoln","");Object.assign(api.draft(),{type:"SP",text:"Which word is spelled wrong?",c0:"freind",c1:"answer",c2:"island",c3:"listen",c4:"(No mistake)",ans:"A",rule:"i before e"});api.nbCvSaveDraft("lincoln");
let L=api.nbCvList("lincoln");ok(L.length===126&&L[125].type==="SP"&&L[125].c[0]==="freind"&&L[125].rule==="i before e","add a spelling item");
api.nbCvOpenPaste();api.paste("US | Which line has a mistake? | Me and him | went to the pond | after lunch. | (No mistake) | A | He and I\nXX | bad | a | b | c | d | A");api.nbCvAddPasted("lincoln");
L=api.nbCvList("lincoln");ok(L.length===127&&L[126].type==="US"&&L[126].ans==="A"&&/line 2: pick a type/.test(api.msg()),"paste adds a usage item, reports the bad line: "+api.msg());
api.nbCvOpenForm("lincoln","");api.draft().text='x"><img>';const fh=api.nbCvCardHTML("lincoln","W");ok(!/<img>/.test(fh)&&["nbcv-type","nbcv-text","nbcv-c0","nbcv-ans","nbcv-rule"].every(id=>fh.indexOf('id="'+id+'"')>=0),"form escaped + ids");
// notebooks.js side
const NEW=w.HoweNotebooks,d5={Monday:"a",Tuesday:"b",Wednesday:"c",Thursday:"d",Friday:"e"};
const mk=(wk,cursor)=>({weekNum:wk,weekDates:"x",weekData:{tasks:[],dates:d5},convBank:{cursor:cursor||null,items:qs}});
const base=NEW.generate("lincoln",{weekNum:24,weekDates:"x",weekData:{tasks:[],dates:d5}});ok(/Write the corrected sentence/.test(base.student)&&base.convBankCursor===undefined,"no bank → built-in fix-the-sentence, no cursor");
let o=NEW.generate("lincoln",mk(24));
ok(/✏️ Spelling/.test(o.student)&&/✏️ Usage/.test(o.student)&&/Which word is spelled wrong\?/.test(o.student)&&/Which line has a mistake\?/.test(o.student)&&!/Write the corrected sentence/.test(o.student),"bank boxes print in the Iowa format");
ok(/<div class="c-letter">E<\/div> \(No mistake\)/.test(o.student)&&/<div class="c-letter">D<\/div> \(No mistake\)/.test(o.student),"No mistake is a choice on both types");
ok(/does every sound have its letters/.test(o.student)&&/sound like a book/.test(o.student),"self-check lines print");
ok(JSON.stringify(o.convBankCursor)===JSON.stringify({week:24,day:1,adv:5,from:24}),"cursor out");
ok(/key-label">Q3<\/div><div><span class="key-ans">\([A-E]\)<\/span> <span class="key-sub">[^<]*— ✏️ Spelling<br><span style="color:var\(--green-mid\);">[^<]*→ /.test(o.parent),"key shows the answer AND the rule");
let oB=NEW.generate("lincoln",mk(23,{week:24,day:1,adv:5,from:24}));ok(/Write the corrected sentence/.test(oB.student)&&oB.convBankCursor===undefined,"week before the start = built-in");
// answer-check sheet uses the bank
api.nbCvSave("lincoln","cursor",{week:24,day:1,adv:5,from:24});writes.length=0;api.nbChkOpen("lincoln","week24","tuesday");
ok(dom["nbchk-dlg"]&&/✏️ Usage/.test(dom["nbchk-dlg"].innerHTML)&&/Which line has a mistake\?/.test(dom["nbchk-dlg"].innerHTML)&&/Answer: <b/.test(dom["nbchk-dlg"].innerHTML),"answer sheet shows the bank's Q3 with its answer");
api.nbChkMark("q3",false);api.nbChkSave();ok(writes.length===1&&writes[0][2].q3&&writes[0][2].q3.t==="US"&&writes[0][2].q3.ok===false,"Q3 result saved with its type");
api.nbBankSave("lincoln","checks","week24/wednesday",{q3:{t:"SP",ok:false}});api.nbBankSave("lincoln","checks","week24/thursday",{q3:{t:"SP",ok:false}});api.nbBankSave("lincoln","checks","week24/friday",{q3:{t:"SP",ok:false}});
ok(api.nbChkByType("lincoln","q3").SP.streak===3&&/Spelling: 3 misses in a row/.test(api.nbCvCardHTML("lincoln","Week 24")),"spelling streak shows on the conventions card");
console.log("\n"+pass+" passed, "+fail+" failed");process.exit(fail?1:0);
