/*
 * Node tests — 🧠 CPDRILLTEACHER, PR 14 of the class platform (DESIGN_class_platform_2026-10-28.md §7(b), §9, §12, §13 row 14,
 * §14 Q13/Q14). The pick (Q13, 2026-10-28): due today, most-missed first. Her yes to Q14 (2026-10-28, PR L3 later): "I would definitely
 * love for the teacher grade drills for Lincoln to be sent to me so I can keep an eye on where he's at."
 *   · Where the block sits and how it hooks (typeof-guarded lines, no shared array literal edited).
 *   · The pick: up to 5 of the unit's cards due today, the most-missed first; students/<sid>/drillPick through envsWrite, only on a change.
 *   · The console's 🧠 Drill: pick a student, front first, turn it over (the unit's back), ✓ / ✗, Save = ONE write of
 *     drills/<cid>/<sid>/<key> = {at, by, name, items:[{deck, name, r}]} (who, when, card, grade: what L3 needs), Next student →.
 *   · The kid's app applies each drill ONCE: claimed in mastery/<kid>_teacherDrills (a transaction), graded through cpdrApply =
 *     mastApplyScores, the same targeted fields Mom's drill writes; no history record; a second device can't apply it again.
 *   · THE REPLAY: the kid studies for days, the teacher drills twice while the kid's app is closed, the app opens: both apply, oldest
 *     first, exactly once, and every card ends exactly where a Mom-drill grade with the same marks would book it.
 *   · The demo: Teacher ▸ 🧠 Drill ▸ Maya ▸ grade 3 ▸ Kid view: those cards booked forward.
 *   · Howe: no edition → every hook says no, nothing read or written, Lincoln's records untouched.
 * Uses the world from test_env_site.js through its `o.rev` line.                                    run: node test_cp_drill_teacher.js
 */
const fs=require("fs"), path=require("path");
const {world,src,REPO}=require("./test_env_site.js");
let pass=0, fail=0;
const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  "+JSON.stringify(x).slice(0,500):"")); } };
const FAM={familyId:"envirothon",edition:"envirothon",className:"MS Science 2026-27",roster:[]};
const LIB=require(path.join(REPO,"envirothon.js"));
const cut=(a,b)=>{ const i=src.indexOf(a); if(i<0) throw new Error("missing "+a); const j=src.indexOf(b,i); return src.slice(i,j+b.length); };
function fn(name){ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name);
  let d=0; for(let k=src.indexOf("{",i);k<src.length;k++){ if(src[k]==="{") d++; else if(src[k]==="}"){ d--; if(!d) return src.slice(i,k+1); } } }
const constLine=n=>{ const m=src.match(new RegExp("const "+n+"=[^\\n]*;")); if(!m) throw new Error("missing const "+n); return m[0]; };
const REV=cut("// CPREVIEW_START","// CPREVIEW_END"), PDR=cut("// CPDRILLPARENT_START","// CPDRILLPARENT_END"), TDR=cut("// CPDRILLTEACHER_START","// CPDRILLTEACHER_END");
// the REAL study engine and the REAL ladder scoring, sliced from index.html (the same set test_cp_drill_parent.js uses)
const ENG=[constLine("MAST_TIER_INT"),constLine("MAST_LEARN_FLOOR"),"const MAST_BANK_MAP={};",
  ...["mastFullBank","mastBankEligible","mastDrillSettings","mastIntroDotsFor","mastIntroMaxFor","mastIsParked","mastStampNextDue","mastIsDue","mastApplyScores","mastDueItems","mastCustomDef"].map(fn),
  cut("// ENVDRILLFIRST_START","// ENVDRILLFIRST_END"),
  "function mastIsNeverDrill(){ return false; } function mastDynamicShouldAdd(){ return false; } function mastDynamicShouldPrune(){ return false; } function mastDynamicEligible(){ return false; } function mastDynamicMark(){} function mastDynamicClear(){} let mastDynamicCapNotice=false;",
  "function mastGetPrintNum(){ return G.pn!=null?G.pn:400; } function mastPrintLogAppend(){}",
  cut("// ── MST_ENGINE_START ──","// ── MST_ENGINE_END ──"),
  `let _tdN=0;
  function _tdStudy(kid,sid,pn){
    const pile=mstPile(kid,sid,pn,null), _mk=masteryKid; masteryKid=kid;
    let items=masteryData[kid]; if(!Array.isArray(items)) items=masteryData[kid]=Object.values(items||{});
    const scores={}; pile.reviews.forEach(i=>{ scores[i.id]="c"; }); pile.learning.forEach(i=>{ scores[i.id]="shown"; });
    pile.newNames.forEach(n=>{ const it={id:kid.slice(0,3)+"_n"+(++_tdN),subject:n.deck,type:n.deck.toLowerCase(),prompt:n.name,tier:"daily",review_mode:"flash",status:"introduction",drop_count:0,consecutive_correct:0,cycle:1,tally_dots:0}; items.push(it); scores[it.id]="shown"; });
    mastApplyScores(items,Object.keys(scores).map(id=>({id})),scores,pn,mastDrillSettings(),{prevShown:new Set(),autoPull:false,chain:false});
    masteryKid=_mk; return pile.reviews.length;
  }
  G.eng={ mstSessions, mstPile, mastDrillSettings, mastIsDue, mastApplyScores, study:_tdStudy, setKid(k){ masteryKid=k; }, setReady(v){ _haMastReady=v; } };`].join("\n");
const TDX=TDR+"\nG.tdr={ _cpdt, CPDT_MAX, cpdtOn, cpdtPick, cpdtPickSend, cpdtListen, cpdtPending, cpdtPlan, cpdtApplyOne, cpdtCatchUp, cpdtKidHtml, cpdtChips, cpdtTeacher, cpdtPickOf, cpdtBack, cpdtStart, cpdtFlip, cpdtGradeCard, cpdtPrev, cpdtList, cpdtSave, cpdtNextSid, cpdtNext, cpdtHtml, cpdtStudentHtml };";
function W(o){ o=o||{}; const w=world(Object.assign({fam:FAM,cpcore:true,envt:true,lib:{demo:true,tests:LIB.tests},rev:REV+"\n"+PDR+"\n"+(o.tdr===false?"":TDX)+"\n"+ENG},o.w||{})); w.E=w.G.eng; w.T=w.G.tdr||null; return w; }
function demo(role,o){ const w=W(Object.assign({},o,{w:Object.assign({search:"?demo=1&role="+(role||"kid")},(o&&o.w)||{})})); w.envSiteDemoBoot(); w.renderAll(); return w; }
const K="maya", STU="ramirez_maya", CID="ms-science-2026", P0=400, DAY=86400000, J=x=>JSON.stringify(x);
const items=(w,k)=>w.masteryData[k||K];
const FT="Forestry · Terms", ST="Soils and Land Use · Terms";
const live=(role,o)=>{ const w=W(o); w._envs.role=role; w._envs.kid="k"; w._envs.sid="fam_k"; w._envs.familyId="fam"; w._envs.uid="uid_k"; w._envs.cid="cls1"; w._envs.dbUrl="https://x-fam.firebaseio.com";
  w.masteryData.k_sessions={envirothon:{name:"Envirothon",kind:"deck",decks:[FT,ST],newPerDay:0}};
  const c=(id,deck,prompt,tier,extra)=>Object.assign({id,subject:deck,prompt,answer:"back of "+prompt,status:"active",tier,cycle:1,consecutive_correct:0,drop_count:0,next_due:0},extra||{});
  w.masteryData.k=[c("a",FT,"Cambium","weekly"),c("b",FT,"Snag","bi_weekly",{drop_count:2}),c("c",ST,"Loam","monthly",{consecutive_correct:2}),c("d",ST,"Humus","weekly"),c("e",FT,"Crown","every_other_day"),
    c("f",ST,"Silt","weekly",{next_due:P0+3}),c("g",FT,"Xylem","weekly",{status:"introduction"}),c("h",ST,"Clay","monthly")];
  w.G.pn=P0; w.initFb(); return w; };
const tdWrites=w=>w.G.writes.filter(x=>/_teacherDrills\//.test(x[1])), mWrites=(w,k)=>w.G.writes.filter(x=>x[1]==="mastery/"+(k||"k"));

const run=async()=>{
console.log("── where it sits, how it is hooked ──");
{ const a=src.indexOf("// CPDRILLTEACHER_START"), b=src.indexOf("// CPDRILLTEACHER_END"), e=src.indexOf("// CPDRILLPARENT_END");
  ok("CPDRILLTEACHER exactly once, after CPDRILLPARENT_END", a>0&&b>a&&src.indexOf("// CPDRILLTEACHER_START",a+1)<0&&e>0&&e<a);
  ok("the header names the design sections, PR 14, Q13's pick, her Q14 words and the date", /§7\(b\)/.test(TDR)&&/§13 row 14/.test(TDR)&&/PR 14/.test(TDR)&&/due today, most-missed first/.test(TDR)&&/I would definitely\s*(\/\/\s*)?love for the\s*(\/\/\s*)?teacher grade drills for\s*(\/\/\s*)?Lincoln/.test(TDR)&&/2026-10-28/.test(TDR));
  ok("the block only declares", TDR.split("\n").every(l=>!l.trim()||/^(\/\/|function |const | |})/.test(l)));
  const code=TDR.replace(/^\/\/.*$/mg,"").replace(/\/\/ [^\n]*/g,"");
  ok("no Howe kid name as a code literal", !/["'`](lincoln|ellis|lucy|julian)["'`]/i.test(code));
  ok("the database is touched only by: the drills listener + its class read (cpdtListen), the claim (cpdtApplyOne), the teacher's name (cpdtConStart); every shared write goes through envsWrite / envcWrite", (code.match(/\.ref\(/g)||[]).length===4&&/sdb\.ref\("drills\/"\+cid\+"\/"\+sid\)\.on\("value"/.test(fn("cpdtListen"))&&/db\.ref\("mastery\/"\+kid\+"_teacherDrills\/"\+id\)/.test(fn("cpdtApplyOne"))&&/ref\("teachers\/"\+_envs\.uid\+"\/name"\)\.once/.test(fn("cpdtConStart"))&&/envsWrite\("students\/"\+_envs\.sid\+"\/drillPick"/.test(fn("cpdtPickSend"))&&/envcWrite\("drills\/"\+_envc\.cid\+"\/"\+d\.sid\+"\/"\+key,rec,"set"\)/.test(fn("cpdtSave")));
  ok("no history write, no envMirrorOn, no renderAllSoon in the block", !/mastery\/history/.test(code)&&!/envMirrorOn/.test(code)&&!/renderAllSoon/.test(code));
  const out=src.slice(0,a)+src.slice(b), hooks=out.split("\n").filter(l=>/🧠 CPDRILLTEACHER/.test(l));
  ok("every tagged line outside the block is typeof-guarded", hooks.length>0&&hooks.every(l=>/typeof cpdt\w+ ?=== ?"function"/.test(l)), hooks.map(l=>l.trim().slice(0,80)));
  ok("the hooks: console chip + view, student page, envsReadShared listener, the kid's study page, the sitting's pick refresh", ["cpdtChips(chips)","cpdtHtml()","cpdtStudentHtml(sid)","cpdtListen(sdb,re)","cpdtKidHtml(kid)","cpdtPickSend(kid)"].every(f=>hooks.some(l=>l.indexOf(f)>=0)));
  const con=fn("envConsoleHtml");
  ok("the chip comes from the block's own function (the shared chips literal is not edited)", !/\["tdrill"/.test(con)&&/if\(typeof cpdtChips==="function"\) cpdtChips\(chips\);/.test(con));
  ok("envsReadShared: the drills listener right after CPDRILLPARENT's", /cpdrListen\(sdb,re\);[^\n]*\n  if\(typeof cpdtListen==="function"\) cpdtListen\(sdb,re\);/.test(fn("envsReadShared")));
  ok("ENVMIRROR's publish line is untouched (drillPick is its own write)", src.indexOf('ref("students/"+sid).update({summary:s,meta:meta})')>0); }

console.log("\n── the rules: drills/<cid>/<sid>/<key> and students/<sid>/drillPick ──");
{ const R=JSON.parse(fs.readFileSync(path.join(REPO,"envirothon","SITE_RULES.json"),"utf8")).rules, D=R.drills&&R.drills.$cid, k=D&&D.$sid&&D.$sid.$key, P=R.students.$sid.drillPick;
  ok("drills/$cid: the class's teacher and Adrienne read the class; a family reads its own student (familyId prefix)", D&&/classes\/'\+\$cid\+'\/teacher'\)\.val\(\) == auth\.uid/.test(D[".read"])&&/admins/.test(D[".read"])&&/\$sid\.beginsWith\(root\.child\('logins\/'\+auth\.uid\+'\/familyId'\)/.test(D.$sid[".read"]));
  ok("…written once (never over an existing drill) by the class's teacher or Adrienne, only for a student of that class; Adrienne may remove one", /!data\.exists\(\) && \(root\.child\('classes\/'\+\$cid\+'\/teacher'\)/.test(k[".write"])&&/students\/'\+\$sid\+'\/class'\)\.val\(\) == \$cid/.test(k[".write"])&&/admins\/'\+auth\.uid\)\.val\(\) == true && !newData\.exists\(\)/.test(k[".write"]));
  ok("…the shape: at a number, by = the writer, items of {deck, name, r: c|m} (at most 5), an optional short name, nothing else", /hasChildren\(\['at','by','items'\]\)/.test(k[".validate"])&&/by'\)\.val\(\) == auth\.uid/.test(k[".validate"])&&/\^\[0-4\]\$/.test(k.items.$i[".validate"])&&/'c' \|\| newData\.val\(\) == 'm'/.test(k.items.$i.r[".validate"])&&k.items.$i.$other[".validate"]===false&&k.$other[".validate"]===false&&/length <= 60/.test(k.name[".validate"]));
  ok("students/$sid/drillPick: the family login (or Adrienne) writes up to 5 {deck, name}", P&&/\$sid\.beginsWith/.test(P[".write"])&&!/teacher/.test(P[".write"])&&/\^\[0-4\]\$/.test(P.$i[".validate"])&&P.$i.$other[".validate"]===false); }

console.log("\n── the pick: due today, most-missed first ──");
{ const w=live("kid"), p=w.T.cpdtPick("k",P0);
  ok("only active cards of the unit that are due today: not the learning card (g), not the card booked for later (f)", p.length===5&&!p.some(x=>x.name==="Xylem"||x.name==="Silt"), p);
  ok("at most "+w.T.CPDT_MAX+" (6 are due)", w.T.CPDT_MAX===5&&p.length===5);
  ok("the most-missed first (Snag: 2 drops)", p[0].name==="Snag"&&p[0].deck===FT, p);
  w.unitStudies.nc_envirothon={id:"nc_envirothon",decks:[{key:FT},{key:ST}]};   // the summary's unit (its weak list)
  w.masteryData.studyLog={k:{envirothon:{"20261027":{items:[{id:"c",name:"Loam",deck:ST,result:"m"},{id:"c",name:"Loam",deck:ST,result:"m"}]}}}};
  const p2=w.T.cpdtPick("k",P0); ok("a card missed twice in the sittings (the summary's weak list) jumps ahead of it", J(p2.slice(0,2).map(x=>x.name))===J(["Loam","Snag"]), p2);
  ok("fronts only: each pick is {deck, name}", p2.every(x=>J(Object.keys(x))===J(["deck","name"])));
  w.masteryData.k_settings={cat_hold:{[ST]:true}}; ok("a held deck gives nothing", !w.T.cpdtPick("k",P0).some(x=>x.deck===ST));
  w._envs.role="teacher"; ok("a teacher login works out no pick of its own", w.T.cpdtPick("k",P0).length===0); }
{ const w=live("kid"); w.E.setReady(true);
  ok("the pick goes to students/fam_k/drillPick through envsWrite (the shared instance)", w.T.cpdtPickSend("k")===true&&w.G.writes.some(x=>x[0]==="set"&&x[1]==="students/fam_k/drillPick"&&x[2].length===5));
  const n=w.G.writes.length; ok("…not again while it hasn't changed", w.T.cpdtPickSend("k")===false&&w.G.writes.length===n);
  w.masteryData.k.find(i=>i.id==="b").next_due=P0+9; ok("…again once it changes", w.T.cpdtPickSend("k")===true&&!w.G.writes[w.G.writes.length-1][2].some(x=>x.name==="Snag"));
  w.E.setReady(false); w.masteryData.k.find(i=>i.id==="b").next_due=0; ok("…never before the student's records are in", w.T.cpdtPickSend("k")===false); }
{ const w=live("kid",{w:{dry:true}}); w.E.setReady(true); ok("?dryrun=1: no pick written", w.T.cpdtPickSend("k")===false&&w.G.writes.length===0); }

console.log("\n── the demo: Teacher ▸ 🧠 Drill ▸ Maya ▸ grade 3 ▸ Kid view ──");
{ const w=demo("teacher"); w.G.pn=P0;
  ok("Teacher ▸ the 🧠 Drill chip, right after 📋 Class", /📋 Class<\/button><button class="" onclick="envcView\('tdrill'\)">🧠 Drill<\/button>/.test(w.G.content));
  w.envcView("tdrill"); const L=w.G.content;
  ok("🧠 Drill: the student list, Maya with her cards, how it works", /🧠 Drill in class/.test(L)&&/most-missed first/.test(L)&&/onclick="cpdtStart\('ramirez_maya'\)"/.test(L)&&/Maya R\.<\/span><span[^>]*>\d card/.test(L));
  const pick=w.T.cpdtPickOf(STU);
  ok("Maya's cards = what Maya's own app picks today (due, most-missed first), 3 to 5", pick.length>=3&&pick.length<=5&&J(pick)===J(w.T.cpdtPick(K)), pick);
  ok("Tap Maya → card 1, the front, 'Turn it over', ✗ / ✓; the back hidden", w.T.cpdtStart(STU)===true&&w._envc.view==="tdrill"&&new RegExp("1 of "+pick.length+" · ").test(w.G.content)&&w.G.content.indexOf(">"+pick[0].name+"<")>0&&/>Turn it over</.test(w.G.content)&&/cpdtGradeCard\('m'\)">✗ Missed/.test(w.G.content)&&/cpdtGradeCard\('c'\)">✓ Right/.test(w.G.content));
  const back=w.T.cpdtBack(pick[0].deck,pick[0].name);
  ok("Turn it over → the unit's back", back.length>5&&w.G.content.indexOf(w.envsEsc?"":"")>=0&&(w.T.cpdtFlip(),w.G.content.indexOf(back.replace(/’/g,"’"))>0), back);
  const before=JSON.parse(J(items(w))), n0=w._envs.writes.length;
  w.T.cpdtGradeCard("c"); w.T.cpdtGradeCard("m"); w.T.cpdtGradeCard("c");
  ok("grade 3 → 'Save the 3 graded' (she can stop there); nothing written yet", /Save the 3 graded/.test(w.G.content)&&w._envs.writes.length===n0);
  await w.T.cpdtSave(); await w.flush();
  const wr=w._envs.writes.slice(n0), rec=wr[0]&&wr[0].val;
  ok("Save → ONE 'would write': set drills/ms-science-2026/ramirez_maya/<key>; nothing real", wr.length===1&&wr[0].op==="set"&&new RegExp("^drills/"+CID+"/"+STU+"/d[0-9a-z]+$").test(wr[0].path)&&w.G.writes.length===0, wr);
  ok("…the record is complete for L3: who (by + name), when (at), which card (deck + name) and the grade (r)", rec&&rec.by==="uid_teacher_demo"&&rec.name==="Ms. Brittany"&&rec.at===w.G.now&&rec.items.length===3&&J(rec.items.map(x=>x.r))===J(["c","m","c"])&&rec.items.every((x,k)=>x.deck===pick[k].deck&&x.name===pick[k].name&&J(Object.keys(x))===J(["deck","name","r"])), rec);
  ok("…the teacher wrote nothing to Maya's records", J(items(w))===J(before));
  ok("Saved view: '2 ✓ · 1 ✗', Next student → Nora B. (the next on the roster with cards), ← All students", /Saved for Maya R\./.test(w.G.content)&&/2 ✓ · 1 ✗/.test(w.G.content)&&/Next student → Nora B\./.test(w.G.content)&&/← All students/.test(w.G.content));
  ok("Next student → Nora's cards (her weak fronts in the demo)", w.T.cpdtNext()===true&&w.T._cpdt.drill.sid==="bennett_nora"&&/🧠 Nora B\./.test(w.G.content));
  w.T.cpdtList(); ok("the list marks Maya drilled", /✓ drilled · 2 ✓ 1 ✗/.test(w.G.content));
  // the reference: Mom's drill grading the same three cards with the same marks, on the same day
  const ref=JSON.parse(J(before)), ids=rec.items.map(x=>before.find(i=>i.subject===x.deck&&i.prompt===x.name).id), sc={}; ids.forEach((id,k)=>{ sc[id]=rec.items[k].r; });
  w.E.setKid(K); w.E.mastApplyScores(ref,ids.map(id=>({id})),sc,P0,w.E.mastDrillSettings(),{prevShown:new Set(),autoPull:false,chain:false});
  const n1=w._envs.writes.length; w.envsDemoGo("kid"); const KH=w.G.content, wk=w._envs.writes.slice(n1);
  ok("Kid view: Maya's app applies the drill: every card ends exactly as Mom's drill would book it", J(items(w))===J(ref));
  ok("…'would write's: the targeted update of mastery/maya + mastery/maya_teacherDrills/<key> = {at, n:3}; no history", wk.some(x=>x.op==="update"&&x.path==="mastery/"+K)&&wk.some(x=>x.op==="set"&&x.path==="mastery/"+K+"_teacherDrills/"+wr[0].path.split("/").pop()&&J(x.val)===J({at:w.G.now,n:3}))&&!wk.some(x=>/history/.test(x.path)), wk.map(x=>x.op+" "+x.path));
  ok("…the study page shows it first: '👩‍🏫 Ms. Brittany drilled you in class · today', 2 ✓ · 1 ✗, each card's new level", /👩‍🏫 Ms\. Brittany drilled you in class · today/.test(KH)&&/2 ✓ · 1 ✗\. Each card moved on your ladder/.test(KH)&&rec.items.every(x=>KH.indexOf("<b>"+x.name+"</b> → ")>0)&&KH.indexOf("drilled you in class")<KH.indexOf("fake-study"));
  const ups=wk.filter(x=>x.path==="mastery/"+K)[0].val, idx=[...new Set(Object.keys(ups).map(k=>k.split("/")[0]))];
  ok("…the update touches only the three graded cards", idx.length===3&&idx.every(ix=>ids.indexOf(items(w)[+ix].id)>=0));
  const mov=ids.map(id=>items(w).find(i=>i.id===id)); ok("…booked forward: the ✓ cards wait at least a full interval, the ✗ card dropped a rung", mov[0].next_due>P0&&mov[2].next_due>P0&&before.find(i=>i.id===ids[1]).tier!==mov[1].tier, mov.map(i=>i.id+":"+i.tier+":"+i.next_due));
  const n2=w._envs.writes.length, snap=J(items(w)); w.renderAll(); w.envsDemoGo("parent"); w.envsDemoGo("kid");
  ok("applied once: repaints and coming back to Kid view change nothing more", w._envs.writes.length===n2&&J(items(w))===snap);
  w.envsDemoGo("teacher"); ok("back in the console, Maya's pick no longer holds the drilled ✓ cards", !w.T.cpdtPickOf(STU).some(x=>x.name===rec.items[0].name||x.name===rec.items[2].name)); }
{ const w=demo("teacher"); w.envcView("student",STU);
  ok("the student page: '🧠 Drill Maya R. · N cards' starts the same drill", /onclick="cpdtStart\('ramirez_maya'\)">🧠 Drill Maya R\. · \d cards</.test(w.G.content)&&w.T.cpdtStart(STU)&&w.T._cpdt.drill.sid===STU);
  ok("Save with nothing graded: refused", (w.T.cpdtSave(),w._envs.writes.length===0));
  w.T.cpdtList(); ok("✕ Leave: back to the list, nothing written", /🧠 Drill in class/.test(w.G.content)&&w._envs.writes.length===0);
  w.envsDemoGo("parent"); ok("the parent page shows no console drill", !/cpdtStart/.test(w.G.content)&&w.T.cpdtHtml()===""&&w.T.cpdtChips([["grid","x"]]).length===1); }

console.log("\n── live: the listener, the claim, once ──");
const drill=(at,items,by)=>({at,by:by||"uid_t",name:"Ms. Brittany",items});
{ const w=live("kid",{w:{remote:{"drills/cls1/fam_k":{d1:drill(5,[{deck:FT,name:"Cambium",r:"c"},{deck:FT,name:"Snag",r:"m"},{deck:ST,name:"Gone card",r:"c"}])}}}});
  w.E.setReady(false); w.envsReadShared();
  ok("a kid login: envsReadShared adds ONE listener on drills/cls1/fam_k", w.G.listeners.filter(l=>l.p==="drills/cls1/fam_k").length===1&&w.T._cpdt.armed==="fam_k");
  ok("…records not in yet: nothing applied, a retry waits", tdWrites(w).length===0&&w.T._cpdt.timer);
  w.E.setReady(true); w.tick(); await w.flush();
  const t=tdWrites(w), m=mWrites(w);
  ok("records in → the claim: a transaction on mastery/k_teacherDrills/d1 = {at, n:2} (the card she no longer has is skipped)", t.length===1&&t[0][0]==="transaction"&&t[0][1]==="mastery/k_teacherDrills/d1"&&J(t[0][2])===J({at:w.G.now,n:2}), t);
  ok("…then ONE targeted update of mastery/k: cards a and b only", m.length===1&&m[0][0]==="update"&&J([...new Set(Object.keys(m[0][2]).map(k=>k.split("/")[0]))].sort())===J(["0","1"]), m);
  ok("…Cambium ✓ kept weekly and booked forward; Snag ✗ dropped from every 2 weeks", w.masteryData.k[0].tier==="weekly"&&w.masteryData.k[0].next_due>P0&&w.masteryData.k[1].tier!=="bi_weekly");
  ok("…no history, nothing else in the family's records", !w.G.writes.some(x=>/history/.test(x[1]))&&w.G.writes.filter(x=>/^mastery\//.test(x[1])).length===2);
  ok("…and a fresh drillPick (the drilled cards are no longer due)", w.G.writes.filter(x=>x[1]==="students/fam_k/drillPick").pop()[2].every(x=>x.name!=="Cambium"&&x.name!=="Snag"));
  const n=w.G.writes.length; w.G.listeners.find(l=>l.p==="drills/cls1/fam_k").fn({val:()=>w.G.remote["drills/cls1/fam_k"]}); await w.flush(); w.T.cpdtKidHtml("k"); await w.flush();
  ok("the same drill again (a listener call, a repaint): nothing", w.G.writes.length===n);
  w.envsReadShared(); ok("a second envsReadShared adds no second listener", w.G.listeners.filter(l=>l.p==="drills/cls1/fam_k").length===1); }
{ const w=live("parent",{w:{remote:{"drills/cls1/fam_k":{d1:drill(5,[{deck:FT,name:"Cambium",r:"c"}])}}}}); w.E.setReady(true);
  const d=w.firebase.database(), orig=d.ref; d.ref=p=>{ const r=orig(p); if(/_teacherDrills\//.test(p)) r.transaction=f=>{ const v=f({at:1,n:1}); w.G.writes.push(["transaction",p,v]); return Promise.resolve({committed:false}); }; return r; };
  const b=J(w.masteryData.k); w.envsReadShared(); await w.flush();
  ok("another device already applied it (the claim finds a record): this one grades nothing", tdWrites(w).length===1&&tdWrites(w)[0][2]===undefined&&mWrites(w).length===0&&J(w.masteryData.k)===b); }
{ const w=live("kid",{w:{dry:true,remote:{"drills/cls1/fam_k":{d1:drill(5,[{deck:FT,name:"Cambium",r:"c"}])}}}}); w.E.setReady(true); w.envsReadShared(); await w.flush();
  ok("?dryrun=1: applied in memory only, nothing written anywhere", w.G.writes.length===0&&w._envs.writes.length===0&&w.masteryData.k[0].next_due>P0&&w.masteryData.k_teacherDrills.d1.n===1); }
["teacher","admin"].forEach(role=>{ const w=live(role); w.envsReadShared();
  ok("a "+role+" login: no drills listener, nothing applied", w.T.cpdtListen(w.firebase.database(),()=>{})===false&&!w.G.listeners.some(l=>/^drills\//.test(l.p))&&w.T.cpdtKidHtml("k")===""); });
{ const w=live("kid",{w:{remote:{"students/fam_k/class":"cls9"}}}); w._envs.cid=""; w.envsReadShared();
  ok("no class id yet: the listener reads students/<sid>/class first", w.G.reads.indexOf("students/fam_k/class")>=0&&w.G.listeners.some(l=>l.p==="drills/cls9/fam_k")); }

console.log("\n── THE REPLAY: two drills while the app is closed, then it opens ──");
{ const w=live("kid"), d1={}, d2={};
  // the kid studies for 6 days in the 🌿 sitting (the real engine); the teacher drills on day 2 and day 4, the kid's app closed both times
  const pick={}; for(let d=0;d<6;d++){ w.G.pn=P0+d; w.G.now=Date.UTC(2026,9,28,15)+d*DAY; if(d===2) pick.a=w.T.cpdtPick("k"); if(d===4) pick.b=w.T.cpdtPick("k"); w.E.study("k","envirothon",P0+d); }   // the pick goes out when the app opens, before that day's sitting
  ok("(the setup) the kid's app picked cards on day 2 and day 4", (pick.a||[]).length>0&&(pick.b||[]).length>0, pick);
  const recA=drill(Date.UTC(2026,9,30,15),pick.a.map((x,k)=>({deck:x.deck,name:x.name,r:k%3===1?"m":"c"}))), recB=drill(Date.UTC(2026,10,1,15),pick.b.map((x,k)=>({deck:x.deck,name:x.name,r:k===0?"m":"c"})));
  w.G.remote["drills/cls1/fam_k"]={dB:recB,dA:recA};   // keys out of order on purpose: the app goes by `at`
  // day 6: the app opens. The reference: Mom's drill grading the same marks on the same day, A then B
  w.G.pn=P0+6; w.G.now=Date.UTC(2026,10,3,15); const ref=JSON.parse(J(w.masteryData.k));
  [recA,recB].forEach(r=>{ const ids=[], sc={}; r.items.forEach(x=>{ const it=ref.find(i=>i.status==="active"&&i.subject===x.deck&&i.prompt===x.name); if(it&&!sc[it.id]){ ids.push(it.id); sc[it.id]=x.r; } });
    w.E.setKid("k"); w.E.mastApplyScores(ref,ids.map(id=>({id})),sc,P0+6,w.E.mastDrillSettings(),{prevShown:new Set(),autoPull:false,chain:false}); });
  w.E.setReady(true); w.envsReadShared(); await w.flush();
  const t=tdWrites(w);
  ok("both drills applied, the older first (by `at`, not by key)", t.length===2&&t[0][1]==="mastery/k_teacherDrills/dA"&&t[1][1]==="mastery/k_teacherDrills/dB", t.map(x=>x[1]));
  ok("every card ends exactly where Mom's drill with the same marks would book it", J(w.masteryData.k)===J(ref));
  ok("each drill's update is targeted (its own cards only)", mWrites(w).length===2&&mWrites(w).every((m,k)=>Object.keys(m[2]).every(f=>[recA,recB][k].items.some(x=>x.name===w.masteryData.k[+f.split("/")[0]].prompt))));
  // the app closes and opens again on day 7 (a new listener, the claims now in its records): nothing applies twice
  const snap=J(w.masteryData.k), n=w.G.writes.length; w.T._cpdt.armed=""; w.G.pn=P0+7; w.envsReadShared(); await w.flush(); w.T.cpdtKidHtml("k");
  ok("the next open: the claims are in the records → nothing applies twice", J(w.masteryData.k)===snap&&tdWrites(w).length===2&&mWrites(w).length===2&&w.G.writes.length-n<=1);
  ok("the kid's page shows the newer drill", /drilled you in class/.test(w.T.cpdtKidHtml("k"))&&recB.items.every(x=>w.T.cpdtKidHtml("k").indexOf("<b>"+x.name+"</b>")>0));
  ok("no history record was written for either drill", !w.G.writes.some(x=>/history/.test(x[1]))); }

console.log("\n── Howe: Lincoln is not touched ──");
{ const w=W({w:{fam:{familyId:"howe",roster:[]}}}); w._envs.kid="lincoln"; w._envs.role="kid"; w._envs.sid="howe_lincoln"; w._envs.cid="ms-science-2026";
  w.masteryData.lincoln=[{id:"L1",subject:FT,prompt:"Cambium",status:"active",tier:"weekly",cycle:1,next_due:0}]; const b=J(w.masteryData.lincoln), chips=[["grid","x"]];
  w.T._cpdt.drills.howe_lincoln={x:drill(1,[{deck:FT,name:"Cambium",r:"m"}])};   // even a drill record for him in memory
  ok("the site is off; every hook says no", !w.envSiteOn()&&w.T.cpdtOn("lincoln")===false&&J(w.T.cpdtPick("lincoln",P0))==="[]"&&w.T.cpdtPickSend("lincoln")===false&&w.T.cpdtListen(w.firebase.database(),()=>{})===false&&w.T.cpdtCatchUp("lincoln")===false&&w.T.cpdtKidHtml("lincoln")===""&&w.T.cpdtChips(chips)===chips&&chips.length===1&&w.T.cpdtHtml()===""&&w.T.cpdtStudentHtml("howe_lincoln")===""&&w.T.cpdtStart("howe_lincoln")===false);
  ok("his cards are byte-for-byte the same; nothing read, listened to or written", J(w.masteryData.lincoln)===b&&!("lincoln_teacherDrills" in w.masteryData)&&w.G.writes.length===0&&w.G.reads.length===0&&w.G.listeners.length===0&&w._envs.writes.length===0); }

console.log("\n── the demo page (make_demo.js) carries it ──");
{ const {buildDemo}=require(path.join(REPO,"envirothon","build","make_demo.js")), h=buildDemo(src,"test",LIB.tests);
  ok("the built demo holds the block and its hooks", h.indexOf("// CPDRILLTEACHER_START")>0&&h.indexOf("function cpdtHtml(")>0&&(h.match(/🧠 CPDRILLTEACHER/g)||[]).length>=6); }

console.log("\n"+pass+" passed, "+fail+" failed");
process.exit(fail?1:0);
};
run().catch(e=>{ console.log("  FAIL- threw "+(e&&e.stack||e)); process.exit(1); });
