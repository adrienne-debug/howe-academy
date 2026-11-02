/*
 * SESSPUT (her ask 2026-11-02): 🗓 Put on the schedule from a study session in Mom HQ. Two DeWalt kids' Daily Study had no school
 * card pointing at it, so it was never opened. This drives the real session list + the SESSPUT block in a VM: the button on an
 * unlinked row (Mom only), the sheet's defaults, the ONE subject write (byte-equal to what the real ceAddSave writes for a Daily
 * subject with that Study session picked), the refusals, dry run, and that the laid card opens the session (taskDeepLinkView).
 * run: node test_sess_putsched.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,400)+")":"")); } };
const fn=name=>{ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); let d=0; for(let k=src.indexOf("{",i);k<src.length;k++){ if(src[k]==="{") d++; else if(src[k]==="}"&&--d===0) return src.slice(i,k+1); } throw new Error("unclosed "+name); };
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("missing "+a); return src.slice(i,j); };
const block=cut("// SESSPUT_START","// SESSPUT_END");

const KID="kid1";
const SESS={ daily_study:{name:"Daily Study",emoji:"📚",kind:"all",who:"solo",newPerDay:3,passes:2,mixInAt:"bi_weekly",handOffAt:"monthly",maxCards:10,focusDecks:3},
  fact_study:{name:"Fact Study",emoji:"✖️",kind:"deck",decks:["Math Facts"],who:"solo",newPerDay:5,passes:2,mixInAt:"bi_weekly",handOffAt:"monthly"},
  ck:{name:"Check-up: Levels 1–4",emoji:"🩺",kind:"checkup",who:"mom",unit:"u",stage:1} };
function mk(o){
  o=o||{}; const writes=[], toasts=[];
  const ctx={console,Object,Array,String,Number,parseInt,Math,JSON,Date,Set,Map,Infinity,
    masteryData:{[KID]:[],[KID+"_sessions"]:JSON.parse(JSON.stringify(SESS))}, masteryKid:KID, mhqKid:KID,
    currData:{subjects:{[KID]:JSON.parse(JSON.stringify(o.subjects||{fact_review:{display:"Fact Review",tracking:"daily",study:"fact_study"}}))}},
    mastDrillSettings:()=>({ladder:["every_other_day","weekly","bi_weekly","monthly","graduated"]}), mastGetPrintNum:()=>218,
    renderAll:()=>{}, mhqDeckStats:()=>[], mhqEsc:s=>String(s==null?"":s), mhqArgEsc:s=>String(s), NB_ROLE_LBL:{}, nbBudgetCardHtml:()=>"",
    nbSessionToday:()=>null, mastFullBank:()=>({}), mstMixSession:()=>null, mhqSessDelete:()=>{},
    momHere:()=>o.mom!==false, _dryRun:()=>!!o.dry, gwShowToast:m=>toasts.push(m),
    db:{ref:p=>({set:v=>writes.push(["set",p,JSON.parse(JSON.stringify(v))]),update:v=>writes.push(["update",p,v]),remove:()=>writes.push(["remove",p])})},
    HA_LS:{setItem:()=>{},getItem:()=>null}, document:{getElementById:()=>null}, mhqTierLbl:t=>t, _mhqPill:(l,on,oc)=>"<button onclick=\""+oc+"\">"+l+"</button>", writes, toasts};
  vm.createContext(ctx);
  vm.runInContext(cut("const MST_SESSION_DEFAULTS =","\n};")+"\n};\n"+cut("const MST_PATTERN_MODES",";\n")+";\n"+cut("const MST_HOWTO_MAX",";\n")+";\n"+
    "let mhqSessEdit = null, mhqSessForm = null, mhqSessErr = '';\n"+block+"\n"+
    ["mstPatternClean","mstHowtoClean","mstSessions","mhqSessionRows","_mhqStepper","_mhqRenderSessForm","_mhqRenderSessions","gwGetSubjects","taskDeepLinkView"].map(fn).join("\n")+
    "\nfunction _get(e){ return eval(e); }",ctx);
  ctx.get=e=>ctx._get(e);
  return ctx;
}
// one session's row in the rendered list
const rowOf=(h,name)=>{ const i=h.indexOf(">"+name+"<"); if(i<0) return ""; const j=h.indexOf('border:1.5px solid var(--border);border-radius:12px;padding:12px',i); return h.slice(i,j<0?h.length:j); };

console.log("1. The button sits on a session no card opens yet — Mom only");
{ const c=mk(); const h=c.get("_mhqRenderSessions('"+KID+"')");
  const ds=rowOf(h,"Daily Study"), fs_=rowOf(h,"Fact Study"), ck=rowOf(h,"Check-up: Levels 1–4");
  ok("Daily Study (no card) says not on the schedule yet", ds.includes("not on the schedule yet"));
  ok("…with 🗓 Put on the schedule", ds.includes("Put on the schedule")&&ds.includes("spOpen('"+KID+"','daily_study')"));
  ok("Fact Study (a card opens it) shows on the schedule, no button", fs_.includes("on the schedule: fact_review")&&!fs_.includes("spOpen("));
  ok("a check-up with no card gets the button too", ck.includes("spOpen('"+KID+"','ck')")); }
{ const c=mk({mom:false}); const ds=rowOf(c.get("_mhqRenderSessions('"+KID+"')"),"Daily Study");
  ok("not Mom: the line, no button", ds.includes("not on the schedule yet")&&!ds.includes("spOpen(")); }
ok("the hook is in the real list (typeof-guarded)", fn("_mhqRenderSessions").includes('(typeof spRowHTML === "function") ? spRowHTML(kid, r)'));

console.log("2. The sheet's defaults");
{ const c=mk(); c.get("spOpen('"+KID+"','daily_study')"); const f=c.get("spForm");
  ok("card name = the session's name", f.name==="Daily Study", f);
  ok("10 minutes, Mon–Fri, iPad/Phone", f.minutes===10&&f.days.join(" ")==="Mon Tue Wed Thu Fri"&&f.device==="ipad/phone", f);
  ok("a session the kid does alone → Mom None", f.mom==="none");
  const h=c.get("_mhqRenderSessions('"+KID+"')");
  ok("the sheet draws inside that row", rowOf(h,"Daily Study").includes('data-sp-sheet="1"'));
  ok("the name box carries an id (input-focus rule)", /<input id="sp-name"[^>]*oninput="spSet\('name',this.value\)"/.test(h));
  ok("it says Regenerate adds it this week", h.includes("Regenerate on the schedule to add it this week"));
  ok("no write from opening", c.writes.length===0); }
{ const c=mk(); c.get("spOpen('"+KID+"','ck')"); ok("a session Mom runs (who mom) → Mom Required", c.get("spForm").mom==="required"); }
{ const c=mk({mom:false}); c.get("spOpen('"+KID+"','daily_study')"); ok("not Mom: spOpen does nothing", c.get("spForm")===null); }

console.log("3. Put it on: ONE subject set, the same record the Add Subject sheet writes");
let spRec;
{ const c=mk(); c.get("spOpen('"+KID+"','daily_study')"); c.get("spSet('name','Spelling Practice')"); c.get("spSet('day','Thu')");
  c.get("spApply()");
  const sets=c.writes.filter(w=>w[0]==="set");
  ok("two sets: the subject + curriculum/lastEdit, nothing else", c.writes.length===2&&sets[0][1]==="curriculum/subjects/"+KID+"/spelling_practice"&&sets[1][1]==="curriculum/lastEdit", c.writes.map(w=>w[1]));
  spRec=sets[0][2];
  ok("record: daily, opens daily_study, noCarry", spRec.tracking==="daily"&&spRec.study==="daily_study"&&spRec.noCarry===true, spRec);
  ok("record: 10 min, Mom none, iPad/Phone, Mon Tue Wed Fri, 4 a week", spRec.minutes===10&&spRec.mom==="none"&&spRec.device==="ipad/phone"&&spRec.days==="Mon Tue Wed Fri"&&spRec.allowedDays.join()==="Mon,Tue,Wed,Fri"&&spRec.timesPerWeek===4, spRec);
  ok("the sheet closes, the toast names Regenerate", c.get("spForm")===null&&/Regenerate adds it this week/.test(c.toasts[0]||""), c.toasts);
  const ds=rowOf(c.get("_mhqRenderSessions('"+KID+"')"),"Daily Study");
  ok("the row now reads on the schedule: spelling_practice, no button", ds.includes("on the schedule: spelling_practice")&&!ds.includes("spOpen("));
  ok("the laid card opens the session (taskDeepLinkView → study)", c.get("taskDeepLinkView({who:'"+KID+"',subjectKey:'spelling_practice'})")==="study"); }
{ // the real ceAddSave, same choices made on its sheet
  const writes=[]; const ctx={console,Object,Array,String,Number,parseInt,Math,JSON,Date,
    currData:{subjects:{[KID]:{}}}, db:{ref:p=>({set:v=>writes.push([p,JSON.parse(JSON.stringify(v))])})}, document:{getElementById:()=>null},
    ceAddKid:KID, ceAddForm:{name:"Spelling Practice",device:"ipad/phone",mom:"none",minutes:10,days:"Mon Tue Wed Fri",rules:"sequential",tracking:"daily",priority:"normal",timesPerWeek:4,study:"daily_study"},
    ceCloseSheet:()=>{}, renderAll:()=>{}, alert:()=>{}};
  vm.createContext(ctx); vm.runInContext(fn("ceAddSave")+"\nceAddSave();",ctx);
  const add=writes.find(w=>w[0]==="curriculum/subjects/"+KID+"/spelling_practice");
  ok("byte-equal to ceAddSave's record (same key order)", add&&JSON.stringify(add[1])===JSON.stringify(spRec), {add:add&&add[1],sp:spRec}); }

console.log("4. Refusals write nothing");
{ const c=mk({subjects:{spelling_practice:{display:"Spelling Practice"}}}); c.get("spOpen('"+KID+"','daily_study')"); c.get("spSet('name','Spelling Practice')"); c.get("spApply()");
  ok("a taken subject key is refused", c.writes.length===0&&/already exists/.test(c.get("spForm").msg), c.get("spForm").msg); }
{ const c=mk(); c.get("spOpen('"+KID+"','daily_study')"); ["Mon","Tue","Wed","Thu","Fri"].forEach(d=>c.get("spSet('day','"+d+"')")); c.get("spApply()");
  ok("no days → refused", c.writes.length===0&&/at least one day/.test(c.get("spForm").msg)); }
{ const c=mk(); c.get("spOpen('"+KID+"','daily_study')"); c.get("spSet('name','  ')"); c.get("spApply()");
  ok("no name → refused", c.writes.length===0&&/name/.test(c.get("spForm").msg)); }
{ const c=mk(); c.get("spOpen('"+KID+"','daily_study')"); for(let i=0;i<5;i++) c.get("spSet('minutes',-5)"); ok("minutes floor at 5", c.get("spForm").minutes===5);
  for(let i=0;i<60;i++) c.get("spSet('minutes',5)"); ok("minutes cap at 240", c.get("spForm").minutes===240); }

console.log("5. Dry run");
{ const c=mk({dry:true}); c.get("spOpen('"+KID+"','daily_study')"); ok("the sheet says nothing is written", c.get("_mhqRenderSessions('"+KID+"')").includes("dry run — nothing is written"));
  c.get("spApply()"); ok("no db write", c.writes.length===0, c.writes);
  ok("the screen still changes (in memory)", !!c.get("currData.subjects['"+KID+"'].daily_study")&&/dry run/.test(c.toasts[0]||"")); }

console.log("6. House rules");
ok("no shuffle emoji in index.html", !src.includes("\u{1F500}"));
ok("no kid's name in the block", !/\b(lincoln|ellis|lucy|julian|taylor|makenzie|kenzie|andrew|caleb)\b/i.test(block));
ok("the block writes only through db.ref(...).set, guarded by spLive", (block.match(/db\.ref\(/g)||[]).length===2&&block.includes("if(spLive()){ db.ref("));

console.log("\n"+pass+" passed, "+fail+" failed"); if(fail) process.exit(1);
