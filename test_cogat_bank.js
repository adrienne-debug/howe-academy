// 🧠 CogAT verbal bank (Lincoln): the Notebook-tab card (index.html) + the notebook side (notebooks.js).
// Card code runs against a fake db that records writes — every write must be a targeted cogatBank path.
// Run: node test_cogat_bank.js
const fs=require("fs");
const html=fs.readFileSync("index.html","utf8");
const block=html.slice(html.indexOf("// ── 📖 Word-of-the-day bank"),html.indexOf("// ── Unit-insert day assignment"));
const w={};(new Function("window","document",fs.readFileSync("notebooks.js","utf8")))(w,{});
const writes=[];
const env=`var notebookSettings={}, tab="notebook", _mom=true, _wk=23, _len=5, nbSelectedKid="lincoln";
var HA_LS={setItem(){}} , window={HoweNotebooks:LIB}, document={getElementById(){return null;}};
var db={ref(p){return{set(v){WR.push(["set",p,v]);},remove(){WR.push(["remove",p]);}};}};
function momHere(){return _mom;} function esc(s){return String(s||"").replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;");}
function cap(s){return s.charAt(0).toUpperCase()+s.slice(1);} function nbTargetWkNum(){return _wk;} function nbDgWeekLen(){return _len;} function renderNotebook(){} function showTab(){}
`;
const api=(new Function("LIB","WR",env+block+`
return {get S(){return notebookSettings;}, set mom(v){_mom=v;}, set wk(v){_wk=v;},
 nbCqList,nbCqCtx,nbCqSave,nbCqPlan,nbCqLeft,nbCqSetStart,nbCqOpenForm,nbCqSaveDraft,nbCqDelete,nbCqOpenPaste,nbCqAddPasted,nbCqPersistCursor,nbCqCardHTML,nbBankLowAlertHTML,nbWbSave,nbWbList,
 draft(){ return nbCqDraft; }, paste(v){ nbCqPaste=v; }, msg(){return nbCqMsg;} };`))(w.HoweNotebooks,writes);
let pass=0,fail=0;const ok=(c,m)=>{c?pass++:(fail++,console.log("FAIL",m));};
const bank=JSON.parse(fs.readFileSync("lincoln_cogat_bank.json","utf8"));
// the seed file itself
const qs=Object.keys(bank).map(k=>bank[k]).sort((a,b)=>a.o-b.o);
ok(qs.length===125&&qs.every((q,i)=>q.o===i+1&&q.c.length===5&&new Set(q.c).size===5&&"ABCDE".includes(q.ans)&&q.type===["A","S","C"][i%3]),"seed: 125 well-formed questions, types rotate A·S·C");
ok(qs.every(q=>q.type==="C"?q.text.split(" · ").length===3:/___/.test(q.text)),"seed: A/S have a blank, C has three words");
// empty
ok(api.nbCqCtx("lincoln")===null&&api.nbBankLowAlertHTML()==="","empty bank → null ctx, no alert");
ok(/Empty — the built-in analogies print/.test(api.nbCqCardHTML("lincoln","Week 23")),"empty card text");
Object.keys(bank).forEach(id=>api.nbCqSave("lincoln","items/"+id,bank[id]));
ok(api.nbCqList("lincoln").length===125&&writes.every(x=>/^notebookSettings\/lincoln\/cogatBank\/items\/q\d{3}$/.test(x[1])),"seed writes are per-question cogatBank paths");
ok(api.nbWbList("lincoln").length===0,"word bank untouched");
let card=api.nbCqCardHTML("lincoln","Week 23");
ok(/Week 23 prints: <span[^>]*>Analogy · Sentence · Belongs with · Analogy · Sentence/.test(card)&&/120 unused questions after this week \(about 24 weeks\)/.test(card),"card shows this week + what is left");
writes.length=0;api.nbCqPersistCursor("lincoln",{cogatBankCursor:{week:23,day:1,adv:5}});api.nbCqPersistCursor("lincoln",{cogatBankCursor:{week:23,day:1,adv:5}});api.nbCqPersistCursor("ellis",{cogatBankCursor:{week:23,day:1,adv:5}});
ok(writes.length===1&&writes[0][1]==="notebookSettings/lincoln/cogatBank/cursor","cursor written once, targeted, Lincoln only");
api.mom=false;writes.length=0;ok(api.nbCqCardHTML("lincoln","x")==="","hidden without Mom");api.nbCqSetStart("lincoln",9);api.nbCqOpenForm("lincoln","");api.nbCqDelete("lincoln","q001");api.nbCqDelete("lincoln","q001");ok(writes.length===0&&api.draft()===null&&api.nbCqList("lincoln").length===125,"no writes without Mom");api.mom=true;
api.nbCqSetStart("lincoln",118);ok(api.nbCqLeft("lincoln")===3&&/CogAT Verbal bank <span[^>]*>· 3 unused questions left/.test(api.nbBankLowAlertHTML())&&!/Word of the Day/.test(api.nbBankLowAlertHTML()),"alert names the CogAT bank only");
api.nbCqSetStart("lincoln",11);
// add: validation then save
writes.length=0;api.nbCqOpenForm("lincoln","");Object.assign(api.draft(),{type:"A",text:"GLOVE is to HAND as SOCK is to ___",c0:"shoe",c1:"foot",c2:"leg",ans:"B"});api.nbCqSaveDraft("lincoln");
ok(/at least 4/.test(api.msg())&&writes.length===0,"needs 4 choices");
Object.assign(api.draft(),{c3:"toe",ans:"E"});api.nbCqSaveDraft("lincoln");ok(/letter of one of the choices/.test(api.msg())&&writes.length===0,"answer must point at a real choice");
api.draft().ans="b";api.nbCqSaveDraft("lincoln");const L=api.nbCqList("lincoln");ok(L.length===126&&L[125].o===126&&L[125].ans==="B"&&L[125].c.length===4&&writes.length===1&&/cogatBank\/items\/w[a-z0-9]+$/.test(writes[0][1]),"added at the end, one targeted write");
api.nbCqOpenForm("lincoln","q002");ok(api.draft().c4==="novice"&&api.draft().ans==="E","edit form loads choices");api.draft().text="Because the ice was too ___, nobody skated.";api.nbCqSaveDraft("lincoln");ok(api.S.lincoln.cogatBank.items.q002.o===2&&/nobody skated/.test(api.S.lincoln.cogatBank.items.q002.text),"edit keeps its place");
api.nbCqDelete("lincoln","q003");ok(api.nbCqList("lincoln").length===126,"first tap arms");api.nbCqDelete("lincoln","q003");ok(api.nbCqList("lincoln").length===125&&api.S.lincoln.cogatBank.cursor.day===10,"delete before the start pulls the start back");
api.nbCqOpenPaste();api.paste("A | UP is to DOWN as IN is to ___ | out | on | at | by | to | A\nS | no blank here | a | b | c | d | A\nbelongs | red · blue · green | tall | yellow | loud | soft | fast | b\nX | bad type | a | b | c | d | A");api.nbCqAddPasted("lincoln");
const L2=api.nbCqList("lincoln");ok(L2.length===128&&L2[126].ans==="A"&&L2[127].type==="C"&&L2[127].ans==="B"&&/line 4: pick a type/.test(api.msg()),"paste adds good lines, reports bad ones: "+api.msg());
api.nbCqOpenForm("lincoln","");api.draft().text='x"><img>';const fh=api.nbCqCardHTML("lincoln","W");ok(!/<img>/.test(fh)&&["nbcq-type","nbcq-text","nbcq-c0","nbcq-c4","nbcq-ans"].every(id=>fh.indexOf('id="'+id+'"')>=0),"form escaped + every input has an id");
// ── notebooks.js side ──
const NEW=w.HoweNotebooks, d5={Monday:"Sep 21",Tuesday:"Sep 22",Wednesday:"Sep 23",Thursday:"Sep 24",Friday:"Sep 25"}, d4={Monday:"a",Tuesday:"b",Wednesday:"c",Thursday:"d"};
const mk=(wk,dates,cb)=>({weekNum:wk,weekDates:"x",weekData:{tasks:[],dates:dates},cogatBank:cb});
const gen=c=>NEW.generate("lincoln",c);
const base=gen(mk(23,d5));ok(/SKELETON is to BONES/.test(base.student)&&base.cogatBankCursor===undefined,"no bank → built-in analogies, no cursor");
ok(gen(mk(23,d5,{items:[]})).student===base.student,"empty bank = built-in");
let o=gen(mk(23,d5,{cursor:null,items:qs}));
ok(/SCULPTOR is to STATUE/.test(o.student)&&/CogAT · Sentence Completion/.test(o.student)&&/CogAT · Verbal Classification/.test(o.student)&&/Which word belongs with these\?<\/span><br>gigantic · massive · immense/.test(o.student)&&!/SKELETON is to BONES/.test(o.student),"bank questions print with their type tags");
ok((o.student.match(/grid-template-columns:1fr 1fr 1fr/g)||[]).length===5&&/<div class="c-letter">E<\/div> theater/.test(o.student),"five choices, three across");
ok(JSON.stringify(o.cogatBankCursor)===JSON.stringify({week:23,day:1,adv:5}),"cursor out");
ok(/\(B\)<\/span> <span class="key-sub">dance — 🐍 CogAT · Verbal Analogy/.test(o.parent)&&/\(D\)<\/span> <span class="key-sub">colossal/.test(o.parent),"answer key in the companion");
let o2=gen(mk(24,d4,{cursor:o.cogatBankCursor,items:qs}));ok(/copious · abundant · bountiful/.test(o2.student)&&/meager · scanty · sparse/.test(o2.student)&&!/SHORTAGE is to SURPLUS/.test(o2.student),"4-day week uses 4");
let o3=gen(mk(25,d5,{cursor:o2.cogatBankCursor,items:qs}));ok(/SHORTAGE is to SURPLUS/.test(o3.student),"next week picks up with no skip");
let o4=gen(mk(30,d5,{cursor:{week:30,day:124,adv:5},items:qs}));ok(/FINGERPRINT is to DISTINCTIVE/.test(o4.student)&&/SCULPTOR is to STATUE/.test(o4.student),"wraps to the top");
let o5=gen(mk(23,d5,{items:[{type:"zzz",text:"A <b> & c ___",c:{a:"one",b:"two",c:"three",d:"four"},ans:"b"}]}));
ok(/A &lt;b> &amp; c ___/.test(o5.student)&&/\(B\)<\/span> <span class="key-sub">two/.test(o5.parent),"odd input is escaped, object choices + lower-case answer tolerated");
console.log("\n"+pass+" passed, "+fail+" failed");process.exit(fail?1:0);
