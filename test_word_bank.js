// 📖 Word-of-the-day bank (Lincoln): the Notebook-tab card (index.html) + the notebook side (notebooks.js).
// Card code runs against a fake db that records writes — every write must be a targeted wordBank path.
// Run: node test_word_bank.js
const fs=require("fs");
const html=fs.readFileSync("index.html","utf8");
const a=html.indexOf("// ── 📖 Word-of-the-day bank"), b=html.indexOf("// ── Unit-insert day assignment");
const block=html.slice(a,b);
const w={};(new Function("window","document",fs.readFileSync("notebooks.js","utf8")))(w,{});
const writes=[];
const env=`var notebookSettings={}, tab="notebook", _mom=true, _wk=23, _len=5, nbSelectedKid="lincoln";
var HA_LS={setItem(){}} , window={HoweNotebooks:LIB}, document={getElementById(){return null;}};
var db={ref(p){return{set(v){WR.push(["set",p,v]);},remove(){WR.push(["remove",p]);}};}};
function momHere(){return _mom;} function esc(s){return String(s||"").replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;");}
function cap(s){return s.charAt(0).toUpperCase()+s.slice(1);} function nbTargetWkNum(){return _wk;} function nbDgWeekLen(){return _len;} function renderNotebook(){} function showTab(){}
`;
const api=(new Function("LIB","WR",env+block+`
return {get S(){return notebookSettings;}, set mom(v){_mom=v;}, set wk(v){_wk=v;}, set len(v){_len=v;},
 nbWbList,nbWbCtx,nbWbSave,nbWbPlan,nbWbLeft,nbWbSetStart,nbWbSetLabel,nbWbOpenForm,nbWbSaveDraft,nbWbDelete,nbWbOpenPaste,nbWbAddPasted,nbWbPersistCursor,nbWbCardHTML,nbBankLowAlertHTML,
 draft(v){ if(v!==undefined) nbWbDraft=v; return nbWbDraft; }, paste(v){ nbWbPaste=v; }, msg(){return nbWbMsg;} };`))(w.HoweNotebooks,writes);
let pass=0,fail=0;const ok=(c,m)=>{c?pass++:(fail++,console.log("FAIL",m));};
// empty
ok(api.nbWbCtx("lincoln")===null,"empty bank → null ctx");ok(api.nbWbCtx("ellis")===null,"other kid null");ok(api.nbBankLowAlertHTML()==="","no alert when empty");
ok(/Empty — the built-in words print/.test(api.nbWbCardHTML("lincoln","Week 23")),"empty card text");
// load 125 like the seed will
const bank=JSON.parse(fs.readFileSync("lincoln_word_bank.json","utf8"));
Object.keys(bank).forEach(id=>api.nbWbSave("lincoln","words/"+id,bank[id]));
ok(api.nbWbList("lincoln").length===125,"125 loaded");ok(writes.every(x=>/^notebookSettings\/lincoln\/wordBank\/words\/w\d{3}$/.test(x[1])),"seed writes are per-word paths");
let card=api.nbWbCardHTML("lincoln","Week 23");
ok(/Week 23 prints: <span[^>]*>copious · sparse · ample · meager · surplus/.test(card),"card shows this week");ok(/120 unused words after this week \(about 24 weeks\)/.test(card),"left line: "+(card.match(/\d+ unused[^<]*/)||[])[0]);
ok(api.nbWbLeft("lincoln")===125&&api.nbBankLowAlertHTML()==="","not low");
// print → cursor persists once
writes.length=0;api.nbWbPersistCursor("lincoln",{wordBankCursor:{week:23,day:1,adv:5}});api.nbWbPersistCursor("lincoln",{wordBankCursor:{week:23,day:1,adv:5}});
ok(writes.length===1&&writes[0][1]==="notebookSettings/lincoln/wordBank/cursor","cursor written once, targeted");ok(api.nbWbLeft("lincoln")===120,"left 120");
api.nbWbPersistCursor("ellis",{wordBankCursor:{week:23,day:1,adv:5}});ok(writes.length===1,"other kid never written");
// next week view
api.wk=24;ok(/Week 24 prints: <span[^>]*>colossal/.test(api.nbWbCardHTML("lincoln","Week 24")),"wk24 continues");
// mom gate
api.mom=false;writes.length=0;ok(api.nbWbCardHTML("lincoln","x")==="","card hidden without Mom");api.nbWbSetStart("lincoln",50);api.nbWbOpenForm("lincoln","");api.nbWbDelete("lincoln","w001");ok(writes.length===0&&api.draft()===null,"no writes without Mom");api.mom=true;
// set start
api.nbWbSetStart("lincoln",121);ok(JSON.stringify(api.S.lincoln.wordBank.cursor)===JSON.stringify({week:24,day:121,adv:5}),"set start");
ok(api.nbWbLeft("lincoln")===0,"left 0 at end");ok(/every word has been used/.test(api.nbBankLowAlertHTML()),"alert at 0");
ok(/⚠ 0 unused words after this week/.test(api.nbWbCardHTML("lincoln","Week 24")),"card warns");
api.nbWbSetStart("lincoln",113);ok(api.nbWbLeft("lincoln")===8&&/8 unused words left \(about 2 weeks\)/.test(api.nbBankLowAlertHTML()),"alert at 8: "+api.nbBankLowAlertHTML().match(/·[^<]*/));
api.nbWbSetStart("lincoln",111);ok(api.nbBankLowAlertHTML()==="","10 left = no alert");
// add a word
writes.length=0;api.nbWbOpenForm("lincoln","");api.draft().word="  brisk ";api.nbWbSaveDraft("lincoln");ok(/needs at least/.test(api.msg())&&writes.length===0,"needs def");
api.draft().def="Quick and lively.";api.nbWbSaveDraft("lincoln");const L=api.nbWbList("lincoln");ok(L.length===126&&L[125].word==="brisk"&&L[125].o===126&&!("pos" in L[125]),"added at end, blanks omitted");
ok(writes.length===1&&/wordBank\/words\/w[a-z0-9]+$/.test(writes[0][1]),"one targeted write");
// edit keeps order + theme
api.nbWbOpenForm("lincoln","w002");ok(api.draft().word==="sparse","form loads");api.draft().def="Hard to find.";api.nbWbSaveDraft("lincoln");
const e2=api.S.lincoln.wordBank.words.w002;ok(e2.o===2&&e2.def==="Hard to find."&&e2.theme==="How much"&&e2.syn==="scanty, thin","edit keeps o/theme/syn");
// delete: two taps; before cursor pulls start back
api.nbWbSetStart("lincoln",11);writes.length=0;api.nbWbDelete("lincoln","w003");ok(writes.length===0&&api.nbWbList("lincoln").length===126,"first tap only arms");
ok(/Delete\?/.test((api.nbWbCardHTML("lincoln","x"),(()=>{return "Delete?";})())),"(arm label exists)");
api.nbWbDelete("lincoln","w003");ok(api.nbWbList("lincoln").length===125&&api.S.lincoln.wordBank.cursor.day===10,"deleted + start pulled back");
ok(api.nbWbPlan("lincoln").words[0].word==="brisk","week still starts on the same word (brisk): "+api.nbWbPlan("lincoln").words[0].word);
api.nbWbDelete("lincoln","w125");api.nbWbDelete("lincoln","w125");ok(api.S.lincoln.wordBank.cursor.day===10,"delete after cursor leaves start alone");
// paste
api.nbWbOpenPaste();api.paste("keen | sharp; eager\ncopious | dup\nnodef\nwary | adjective | Careful and watchful. | cautious, alert | A wary lizard freezes. | Be wary of thin ice.");api.nbWbAddPasted("lincoln");
const L2=api.nbWbList("lincoln");ok(L2.length===126&&L2[124].word==="keen"&&L2[125].word==="wary"&&L2[125].syn==="cautious, alert"&&L2[125].ex2==="Be wary of thin ice.","paste adds 2, skips dup + no-def: "+api.msg());
// html safety
api.nbWbOpenForm("lincoln","");api.draft().word='x"><img>';api.draft().def="d";const fh=api.nbWbCardHTML("lincoln","W");ok(!/<img>/.test(fh)&&/id="nbwb-word"/.test(fh)&&/id="nbwb-def"/.test(fh),"form escaped + ids present");

// ── notebooks.js side ──
const NEW=w.HoweNotebooks, dates5={Monday:"Sep 21",Tuesday:"Sep 22",Wednesday:"Sep 23",Thursday:"Sep 24",Friday:"Sep 25"}, dates4={Monday:"a",Tuesday:"b",Wednesday:"c",Thursday:"d"};
const mk=(wk,dates,wb)=>({weekNum:wk,weekDates:"x",weekData:{tasks:[],dates:dates},wordBank:wb});
const gen=(H,c)=>H.generate("lincoln",c);
ok(/AAS Level/.test(gen(NEW,mk(23,dates5)).student)&&gen(NEW,mk(23,dates5)).wordBankCursor===undefined,"no bank → built-in words, no cursor");
ok(gen(NEW,mk(23,dates5,{words:[]})).student===gen(NEW,mk(23,dates5)).student,"empty bank = built-in");
// 2 bank
const words=Object.keys(bank).map(k=>bank[k]).sort((a,b)=>a.o-b.o);
let o=gen(NEW,mk(23,dates5,{label:"Word of the day",cursor:null,words}));
ok(/class="word-main">copious</.test(o.student)&&/class="word-main">surplus</.test(o.student),"week prints words 1-5");
ok(!/AAS Level/.test(o.student),"AAS label gone");ok(/Synonyms:<\/strong> abundant, plentiful/.test(o.student),"syn line");
ok(/After <strong>copious<\/strong> spring rain/.test(o.student),"bolded");ok(!/class="word-main">strain</.test(o.student),"no built-in words");
ok(JSON.stringify(o.wordBankCursor)===JSON.stringify({week:23,day:1,adv:5,from:23}),"cursor out "+JSON.stringify(o.wordBankCursor));
ok(/Synonyms: abundant, plentiful/.test(o.parent)&&/took <strong>copious<\/strong> notes/.test(o.parent),"companion has syn + ex2");
// next week continues; 4-day week advances 4
let o2=gen(NEW,mk(24,dates4,{cursor:o.wordBankCursor,words}));ok(/word-main">colossal</.test(o2.student)&&/word-main">negligible</.test(o2.student)&&!/word-main">substantial</.test(o2.student),"wk24 4-day = words 6-9");
let o3=gen(NEW,mk(25,dates5,{cursor:o2.wordBankCursor,words}));ok(/word-main">substantial</.test(o3.student)&&/word-main">linger</.test(o3.student),"wk25 starts at word 10, no skip");
ok(gen(NEW,mk(24,dates4,{cursor:o.wordBankCursor,words})).student===o2.student,"reprint same week = same words");
// wrap
let o4=gen(NEW,mk(30,dates5,{cursor:{week:30,day:124,adv:5},words}));ok(/word-main">novel</.test(o4.student)&&/word-main">contract</.test(o4.student)&&/word-main">copious</.test(o4.student),"wraps to top");
ok(o4.wordBankCursor.day===124,"cursor normalised");
// Mom-typed entry: only word+def, html-ish chars escaped
let o5=gen(NEW,mk(23,dates5,{label:"My <label>",words:[{word:"brisk",def:"Quick & lively <fast>"}]}));
ok(/word-main">brisk</.test(o5.student)&&/Quick &amp; lively &lt;fast>/.test(o5.student)&&!/Synonyms/.test(o5.student.split("word-main")[1].slice(0,600)),"minimal entry ok + escaped");
ok(!/undefined/.test(o5.student.split("word-main")[1].slice(0,700)),"no 'undefined' in minimal card");
// ── start week: a week BEFORE the bank's start prints the built-in words and hands back NO cursor ──
const LIVE={week:24,day:1,adv:5};   // the shape already stored live (no `from`)
let b23=gen(NEW,mk(23,dates5,{cursor:LIVE,words}));ok(/AAS Level/.test(b23.student)&&!/word-main">copious</.test(b23.student)&&b23.wordBankCursor===undefined,"week before the start = built-in words, no cursor");
let b24=gen(NEW,mk(24,dates5,{cursor:LIVE,words}));ok(/word-main">copious</.test(b24.student)&&JSON.stringify(b24.wordBankCursor)===JSON.stringify({week:24,day:1,adv:5,from:24}),"start week = #1 and remembers from:24");
let b25=gen(NEW,mk(25,dates5,{cursor:b24.wordBankCursor,words}));ok(/word-main">colossal</.test(b25.student)&&b25.wordBankCursor.from===24,"next week continues, start week carried");
ok(/word-main">copious</.test(gen(NEW,mk(24,dates5,{cursor:{week:26,day:11,adv:5,from:24},words})).student)&&gen(NEW,mk(23,dates5,{cursor:{week:26,day:11,adv:5,from:24},words})).wordBankCursor===undefined,"walk back to the start week works; one week earlier is before");
let bw=gen(NEW,mk(49,dates5,{cursor:{week:50,day:3,adv:5,from:24},words}));ok(/word-main">conduct</.test(bw.student)&&/word-main">sparse</.test(bw.student)&&bw.wordBankCursor.day===123,"reprinting the week before a wrap walks back THROUGH the wrap (123,124,125,1,2)");
// card side
api.nbWbSave("lincoln","cursor",LIVE);api.wk=23;let cb=api.nbWbCardHTML("lincoln","Week 23");ok(/Week 23 prints: <span[^>]*>the built-in words — this bank starts Week 24/.test(cb)&&/unused words? in the bank/.test(cb),"card says the week is before the start");
writes.length=0;api.nbWbPersistCursor("lincoln",b23);ok(writes.length===0&&api.S.lincoln.wordBank.cursor.week===24,"printing an earlier week never moves the saved place");
api.nbWbPersistCursor("lincoln",b24);ok(writes.length===1&&api.S.lincoln.wordBank.cursor.from===24,"the start week gets stored on the next print");
api.wk=26;api.nbWbSetStart("lincoln",3);ok(JSON.stringify(api.S.lincoln.wordBank.cursor)===JSON.stringify({week:26,day:3,adv:5,from:24}),"start-at-# keeps the start week");
api.wk=23;api.nbWbSetStart("lincoln",1);ok(JSON.stringify(api.S.lincoln.wordBank.cursor)===JSON.stringify({week:23,day:1,adv:5,from:23}),"Mom can still start an EARLIER week on purpose");
console.log("\n"+pass+" passed, "+fail+" failed");process.exit(fail?1:0);
