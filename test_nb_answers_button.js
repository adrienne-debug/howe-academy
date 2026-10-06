// NBANS (her ask 2026-10-05): the notebook answer sheet never opens on its own; a Mom-mode 📓 Answers button on a bank kid's
// Morning Notebook card opens it; the sheet loads the notebook library itself and shows that day's Daily Grams key page.
// Run: node test_nb_answers_button.js
const fs=require("fs");
const html=fs.readFileSync("index.html","utf8");
let pass=0,fail=0;const ok=(c,m)=>{c?pass++:(fail++,console.log("FAIL",m));};
const fn=name=>{ const i=html.indexOf("function "+name+"("); return html.slice(i, html.indexOf("\nfunction ", i+10)); };

console.log("No automatic sheet");
ok(!/nbChkOpen/.test(fn("momApprove")),"Approve no longer opens the sheet");
const fd=fn("finalizeDone"); ok(!/nbChkOpen\(t\.who,WK,t\.day\)/.test(html.slice(html.indexOf("function finalizeDone("), html.indexOf("function finalizeDone(")+40000)),"a Mom-mode direct check no longer opens the sheet");

console.log("The card button");
const tc=fn("taskCard");
ok(tc.indexOf("// NBANS_START")>0&&tc.indexOf("// NBANS_END")>tc.indexOf("// NBANS_START"),"marked block inside taskCard");
ok(/const nbAnsRow=\(!readOnly&&momHereCards\(\)&&typeof NB_WB_KIDS!=="undefined"&&NB_WB_KIDS\[t\.who\]&&\/Morning Notebook\/\.test\(t\.title\|\|""\)/.test(tc),"button gated on Mom mode + bank kid + Morning Notebook");
ok(/\+prRow\+nbAnsRow\+/.test(tc),"button row is in the card");
ok(/nbChkOpen\(\\''\+t\.who\+'\\',WK,\\''\+\(t\.day\|\|""\)\+'\\'\)/.test(tc),"button opens the sheet for that kid and day");

console.log("The sheet");
const block=html.slice(html.indexOf("// ── 📖 Word-of-the-day bank"),html.indexOf("// ── Unit-insert day assignment"));
const w={};(new Function("window","document",fs.readFileSync("notebooks.js","utf8")))(w,{});
const writes=[], toasts=[], dom={}, loads=[];
const env=`var notebookSettings={}, tab="notebook", _mom=true, _wk=26, _len=5, nbSelectedKid="ellis", WK="week26", DAY_DT={monday:"Oct 5",tuesday:"Oct 6",wednesday:"Oct 7",thursday:"Oct 8",friday:"Oct 9"};
var HA_LS={setItem(){}}, window={HoweNotebooks:null};
var document={ getElementById(id){ return DOM[id]||null; }, createElement(){ const el={style:{},remove(){ delete DOM[el.id]; },set innerHTML(v){ el._h=v; },get innerHTML(){ return el._h||""; }}; return el; }, body:{ appendChild(el){ DOM[el.id]=el; } } };
var fetched=[]; var db={ref(p){return{set(v){WR.push(["set",p,v]);},remove(){WR.push(["remove",p]);},once(){ fetched.push(p); return Promise.resolve({val(){ return "data:image/png;base64,KEY"+p.slice(-3); }}); }};}};
function momHere(){return _mom;} function esc(s){return String(s||"").replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;");}
function cap(s){return s.charAt(0).toUpperCase()+s.slice(1);} function nbTargetWkNum(){return _wk;} function nbDgWeekLen(){return _len;} function renderNotebook(){} function showTab(){} function gwShowToast(m){TOASTS.push(m);}
var notebookBooks={dailyGrams4:{title:"Daily Grams Grade 4",days:180,dayAns:[null,[197],[197],[197],[197],[197],[197],[197]]}}; var nbBookPageCache={};
function nbDgCfg(kid){ return kid==="ellis"?{ book:"dailyGrams4", on:true, cursor:{week:26,day:2,adv:5,from:24} }:{ book:null, on:false, cursor:null }; }
function haLoadNotebooksLib(){ LOADS.push(1); window.HoweNotebooks=LIB; return Promise.resolve(LIB); }
`;
const api=(new Function("LIB","WR","DOM","TOASTS","LOADS",env+block+`
return { nbCqSave,nbCvSave,nbQbSave,nbBankSave,nbChkOpen,nbChkMark,nbChkSave,nbChkDg,nbChkByType,nbChkFlagRows,nbChkHistory, get fetched(){return fetched;}, set lib(v){window.HoweNotebooks=v;}, state(){return nbChkState;} };`))(w.HoweNotebooks,writes,dom,toasts,loads);
const seed=(f,save)=>{ const b=JSON.parse(fs.readFileSync(f,"utf8")); Object.keys(b).forEach(id=>api[save]("ellis","items/"+id,b[id])); };
seed("ellis_cogat_bank.json","nbCqSave"); seed("ellis_conv_bank.json","nbCvSave"); seed("ellis_quant_bank.json","nbQbSave");
["nbCqSave","nbCvSave","nbQbSave"].forEach(s=>api[s]("ellis","cursor",{week:26,day:1,adv:5,from:26}));

(async()=>{
  // 1. library not loaded yet → the sheet loads it, then opens
  api.nbChkOpen("ellis","week26","tuesday");
  ok(loads.length===1&&!dom["nbchk-dlg"]&&/Loading the answers/.test(toasts.join()),"without the library: loads it first (no sheet yet)");
  await new Promise(r=>setTimeout(r,0));
  ok(!!dom["nbchk-dlg"],"…then the sheet opens");
  const hd=dom["nbchk-dlg"].innerHTML;
  ok(/Ellis’s notebook — Tuesday/.test(hd),"titled for Ellis, Tuesday");
  ok(/Daily Grams Grade 4 — Day 3/.test(hd),"Daily Grams row names Day 3 (cursor Day 2 on Monday → Tuesday = Day 3)");
  ok(/Key page 197/.test(hd),"names the key page");
  ok(api.fetched.join()==="notebookBookPages/dailyGrams4/ans/197","key page fetched on demand from the book's pages (not at boot)");
  await new Promise(r=>setTimeout(r,0));
  ok(/data:image\/png;base64,KEY197/.test(dom["nbchk-dlg"].innerHTML)&&/cursor:zoom-in/.test(dom["nbchk-dlg"].innerHTML),"…and shows it once it arrives, tap to zoom");
  ok(/Sentence Completion/.test(hd)&&/Capital letters/.test(hd)&&/Number Analogies/.test(hd),"the three Tuesday bank items are there (CogAT S · capitals · analogies)");
  ok(/Rule to remember/.test(hd)===false,"the kid's hint line is not repeated in Mom's sheet");
  // 2. mark + save includes the Daily Grams result
  api.nbChkMark("q0",false); api.nbChkMark("q1",true);
  writes.length=0; api.nbChkSave();
  ok(writes.length===1&&writes[0][1]==="notebookSettings/ellis/checks/week26/tuesday"&&writes[0][2].dg&&writes[0][2].dg.t==="DG"&&writes[0][2].dg.d===3&&writes[0][2].dg.ok===false&&writes[0][2].q1.ok===true,"one targeted write with the Daily Grams result (Day 3, wrong) + Q1 right");
  // 3. results feed the card line + Mom's Day flag
  api.nbBankSave("ellis","checks","week26/wednesday",{dg:{t:"DG",d:4,ok:false}}); api.nbBankSave("ellis","checks","week26/thursday",{dg:{t:"DG",d:5,ok:false}});
  const by=api.nbChkByType("ellis","dg"); ok(by.DG&&by.DG.n===3&&by.DG.streak===3,"Daily Grams results tracked per day: 3 misses in a row");
  ok(/Ellis · Daily Grams/.test(api.nbChkFlagRows()),"Mom's Day flags the Daily Grams streak");
  // 4. Lincoln with no banks loaded here and no Daily Grams → still his built-in conventions item, no Daily Grams row
  api.nbChkOpen("lincoln","week26","tuesday"); ok(!!dom["nbchk-dlg"]&&/Lincoln’s notebook — Tuesday/.test(dom["nbchk-dlg"].innerHTML)&&/Conventions/.test(dom["nbchk-dlg"].innerHTML)&&!/Daily Grams/.test(dom["nbchk-dlg"].innerHTML),"Lincoln: built-in conventions only, no Daily Grams row when his book is off");
  api.nbChkSave();
  // 5. Mom gate
  toasts.length=0; api.nbChkOpen("ellis","week26","monday"); api.nbChkSave();
  console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
})();
