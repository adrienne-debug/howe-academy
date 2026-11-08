/*
 * 🚂 PKTRAIN — a Pre-K kid's study card opens the ABC Train (hub ask 2026-11-08; her words 11/8: "the ABC order thing and the train
 * thing would be like a pre-K kindergarten study session, because they can't or won't do typical study sessions").
 * Pre-K kid + a study session whose decks are letters decks → every study door (they all land on renderMastStudy) draws the Train at
 * the kid's level; the round logs as a game (unchanged) AND as that kid's study sitting: one studyLog entry for today in the sitting's
 * shape, merged the sitting's way, on the sitting's path. A school kid, a Pre-K kid's other decks, a check-up and Mom's switch off are
 * the flip cards, untouched. Dry run writes nothing. The card's link reads "🚂 ABC Train — study".
 * Runs the REAL code (GAMELOG + GAMEGRID + GAMERULES + TRAIN + PKTRAIN + renderMastStudy) with timers by hand.
 *   run:  node test_prek_study_train.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
let pass=0, fail=0;
function ok(n,c,x){ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":""));} }
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("markers "+a); return src.slice(i,j); };
function fnText(name){ const i=src.indexOf("function "+name+"("); if(i<0) return ""; const j=src.indexOf("\nfunction ",i+10); return src.slice(i,j<0?undefined:j); }
const seeded=seed=>{ let x=seed||7; return ()=>{ x=(x*1103515245+12345)&0x7fffffff; return (x%10000)/10000; }; };
const ABC="ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

// The family's own words (read from family-config.js, so this test names nobody)
const fam=fs.readFileSync(path.join(__dirname,"family-config.js"),"utf8");
const famWords=[];
fam.replace(/\b(?:id|name|familyId|sitterName):\s*"([^"]+)"/g,(m,w)=>{ w.split(/\s+/).forEach(x=>{ if(x.length>2&&!/^academy$/i.test(x)) famWords.push(x.toLowerCase()); }); return m; });

// ── by text ──
const a=src.indexOf("// PKTRAIN_START"), b=src.indexOf("// PKTRAIN_END");
ok("one PKTRAIN block, straight after TRAIN_END",a>0&&b>a&&src.indexOf("// PKTRAIN_START",a+1)<0&&src.slice(src.indexOf("// TRAIN_END"),a).trim()==="// TRAIN_END");
const blk=src.slice(a,b), code=blk.replace(/^\s*\/\/.*$/gm,"");
ok("the family's words were found to check against",famWords.length>=4,famWords);
ok("no kid's or family's name in the block",!famWords.some(w=>new RegExp("\\b"+w+"\\b","i").test(blk)),famWords.filter(w=>new RegExp("\\b"+w+"\\b","i").test(blk)));
ok("no kid's or family's name in this test",!famWords.some(w=>new RegExp("\\b"+w+"\\b","i").test(fs.readFileSync(__filename,"utf8"))));
ok("Pre-K is the family's own flag (isPreK), never a kid id",/isPreK\(kid\)/.test(code));
ok("writes: only the sitting's studyLog path (a set) and the send-back redo (an update), each behind db && !_dryRun()",
  (code.match(/db\.ref\(/g)||[]).length===2&&/db\.ref\("mastery\/studyLog\/"\+kid\+"\/"\+sid\+"\/"\+day\)\.set\(entry\)/.test(code)&&/db\.ref\("mastery\/studyBack\/"\+kid\+"\/"\+sid\)\.update\(rd\)/.test(code)&&/db&&!\(typeof _dryRun==="function"&&_dryRun\(\)\)/.test(code));
ok("no card moves: no tier, next_due, minting, printLog, points",!/next_due|\.tier\s*=|mastApplyScores|mastMintFromBank|printLog|bankDirect/.test(code));
ok("renderMastStudy: one guarded line draws the Train when no flip sitting of that session is running",
  /if\(!\(mstState&&mstSid===session\.sid\)&&typeof pktStudyHtml==="function"\)\{ const _pk=pktStudyHtml\(kid,session\); if\(_pk\) return h\+_pk; \}/.test(fnText("renderMastStudy")));
ok("trainFinish: one guarded line logs the study round; the game log line is unchanged",
  /gameLogRound\(st\); \}catch\(e\)\{\}[^\n]*\n  if\(st\.study&&typeof pktLogSitting==="function"\)\{ try\{ pktLogSitting\(st\); \}catch\(e\)\{\} \}/.test(fnText("trainFinish")));
ok("taskCard: the 📂 link's words come from pktCardLabel, else the old label",/pktCardLabel\(t\.who,_dlSub\.study\)/.test(fnText("taskCard"))&&/\(_pkLbl\|\|taskDeepLinkLabel\(_dlv\)\)/.test(fnText("taskCard")));
ok("the doors are untouched: retrSchedGo / mastLinkRoute / kcStudyOpen / kcPlayOpen don't know the Train",
  !/pkt|train/i.test(fnText("retrSchedGo")+fnText("mastLinkRoute")+fnText("kcStudyOpen")+fnText("kcPlayOpen")));
ok("…and every study door lands on renderMastStudy (Study tab, Kids' Corner, Dad's Day)",
  /renderMastStudy\(\{noCheckup:true\}\)/.test(fnText("kcPlayBodyHTML"))&&/renderMastStudy\(/.test(cut("// KC_MASTERY_START","// KC_MASTERY_END"))&&/mastView==="study"/.test(src));
// the sitting's own entry keys, read from _mstSaveInner
const keysOf=s=>{ const m=s.match(/let entry=\{([^\n]*?)\};/); return m?m[1].replace(/\[[^\]]*\]/g,"[]").split(",").map(x=>x.split(":")[0].trim()).filter(Boolean):[]; };
const SIT_KEYS=keysOf(fnText("_mstSaveInner"));
ok("read the sitting's entry keys from _mstSaveInner",SIT_KEYS.join()==="date,printNum,total,correct,miss,shown,secs,items,sits,before",SIT_KEYS);

// ── a sandbox ──
const Lc=(ch,deck,extra)=>Object.assign({id:"L_"+ch,subject:deck||"Abc",prompt:ch,status:"active",tier:"daily"},extra||{});
const LETTERS=ABC.slice(0,10).map(ch=>Lc(ch));   // A–J have cards; K… are cars without one
const NUMS=["1","2","3","4","5","6"].map(n=>({id:"N_"+n,subject:"Num",prompt:n,status:"active",tier:"daily"}));
const SESS=[{sid:"s1",name:"Letters",emoji:"🔤",kind:"deck",decks:["Abc"]},{sid:"s2",name:"Counting",emoji:"🔢",kind:"deck",decks:["Num"]},
  {sid:"s3",name:"Both",emoji:"📚",kind:"deck",decks:["Abc","Num"]},{sid:"s4",name:"Check",emoji:"🩺",kind:"checkup",decks:["Abc"]}];
function world(o){
  o=o||{};
  const writes=[], timers=[]; let now=0, clock=1762600000000;
  class FakeDate extends Date{ static now(){ return clock+=1000; } }
  const CODE=cut("// GAMELOG_START","// GAMELOG_END")+"\n"+cut("// GAMEGRID_START","// GAMEGRID_END")+"\n"+cut("// GAMERULES_START","// GAMERULES_END")+"\n"+cut("// TRAIN_START","// TRAIN_END")+"\n"+cut("// PKTRAIN_START","// PKTRAIN_END")+"\n"+fnText("renderMastStudy");
  const items=o.items||LETTERS.concat(NUMS);
  const md={k:items,k_settings:o.settings||{},gameLog:{},studyLog:o.studyLog||{},studyBack:o.studyBack||{}};
  const ctx={console,JSON,Object,Array,String,Number,Math,Set,Map,RegExp,Date:FakeDate,parseInt,isNaN,Promise,
    setTimeout:(f,ms)=>{ timers.push({at:now+(ms||0),f:f,id:timers.length+1}); return timers.length; },
    _dryRun:()=>!!o.dry,HA_LS:{setItem(){ ctx._ls=(ctx._ls||0)+1; }},_mastRe(){},bbAudioUnlock(){},momHere:()=>true,renderAll(){},cap:s=>s,
    isPreK:k=>k==="k"&&o.prek!==false,KID_COLOR:{k:"#c45e1a"},
    _gamesItems:k=>(k==="k"?items:[]),mastGetVisual:()=>null,mastItemVis:it=>it.prompt,
    mastSpeak(){},matchDing(){},matchBonk(){},mstTodayKey:()=>"20261108",mastGetPrintNum:()=>41,
    mstLogGet:(kid,sid)=>(((md.studyLog||{})[kid]||{})[sid]||{})["20261108"]||null,
    mstBeforeMerge:(p,n)=>{ const x=Array.isArray(p)?p.slice():Object.values(p||{}); (n||[]).forEach(v=>x.push(v)); return x; },
    mstSessions:k=>(k==="k"?SESS:[]),mstEsc:s=>String(s==null?"":s),mstEscJs:s=>String(s),mstNavReset(){},
    mstPile:()=>({reviews:[{}],learning:[],newNames:["x"]}),mstHasPersisted:()=>false,
    mstProgress:()=>({done:1,total:3,remaining:2,againCount:0}),mstCurrent:()=>null,mstNavBtn:()=>"",mstSaveErr:null,
    mpStudyDoneHtml:(k,sid)=>'<div class="next-step">next after '+sid+'</div>',
    mstKid:"k",mstSid:o.sid||"s1",mstState:o.running?{run:1}:null,mstFlipped:false,mstDone:null,mstStartTs:null,mstTyped:"",mstChecked:null,
    mastView:"study",masteryKid:"k",bbAlarmCtx:null,masteryData:md,
    _gdCanEdit:()=>true,
    db:{ref:p=>({set:v=>writes.push(["set",p,v]),update:v=>writes.push(["update",p,v]),push:v=>writes.push(["push",p,v]),remove:()=>writes.push(["remove",p])})}};
  vm.createContext(ctx);
  vm.runInContext(CODE+"\nObject.defineProperty(this,'trainState',{get:()=>trainState,set:v=>{trainState=v;}}); Object.defineProperty(this,'_trainRandom',{get:()=>_trainRandom,set:v=>{_trainRandom=v;}});"+
    " this.TRAIN_ROLL_MS=TRAIN_ROLL_MS; this.TRAIN_STEPS=TRAIN_STEPS; this.GAME_RULES=GAME_RULES;",ctx);
  ctx._trainRandom=seeded(o.seed||5);
  const tick=t=>{ for(;;){ const due=timers.filter(x=>x.at<=t).sort((x,y)=>x.at-y.at||x.id-y.id)[0]; if(!due) break; timers.splice(timers.indexOf(due),1); now=due.at; due.f(); } now=t; };
  const flushAll=()=>{ let g=0; while(timers.length&&g++<500){ tick(Math.min.apply(null,timers.map(x=>x.at))); } };
  return {c:ctx,md,writes,tick,flushAll,now:()=>now};
}
function playRound(w,missFirst){
  const c=w.c, st=c.trainState;
  for(let g=0;g<20&&st.phase==="play";g++){
    const t=st.turns[st.i];
    if(missFirst&&g===0) c.trainTap(t.choices.findIndex(x=>x!==t.L));
    c.trainTap(t.choices.indexOf(t.L)); w.tick(w.now()+c.TRAIN_ROLL_MS);
  }
  return st;
}
const studySets=w=>w.writes.filter(x=>/^mastery\/studyLog\//.test(x[1]));
const flipStart=h=>/mstStart\(\)/.test(h)&&!/trainStart/.test(h);

// ── Pre-K kid + letters deck → the Train, logged as the sitting ──
{
  const w=world(), c=w.c;
  ok("pktSession: the letters session → its Train (the session's deck)",(()=>{ const p=c.pktSession("k","s1"); return p&&p.sid==="s1"&&p.deck==="Abc"&&Object.keys(p.cards).length===10; })());
  const h=c.renderMastStudy();
  ok("the study page draws the Train with a Start for THIS session, no flip-card Start",/ABC Train/.test(h)&&/trainStart\('s1'\)/.test(h)&&!/mstStart\(\)/.test(h),h.slice(0,200));
  ok("…at the kid's current level",/Level 1 /.test(h));
  ok("the card's link reads \"🚂 ABC Train — study\"; nothing logged yet = no line",c.pktCardLabel("k","s1")==="\u{1F682} ABC Train — study"&&c.pktCardLine("k","s1")==="");
  c.trainStart("s1");
  ok("the round knows its study session",c.trainState&&c.trainState.study&&c.trainState.study.sid==="s1"&&c.trainState.deck==="Abc");
  ok("the study page shows the round in play",/Which car comes next\?/.test(c.renderMastStudy()));
  const st=playRound(w,true);
  ok("the round finished",st.phase==="done");
  const S=studySets(w);
  ok("ONE studyLog write, on the sitting's path for this kid + session + today",S.length===1&&S[0][0]==="set"&&S[0][1]==="mastery/studyLog/k/s1/20261108",S.map(x=>x[1]));
  const e=S[0]&&S[0][2];
  ok("the entry has exactly the sitting's keys",e&&Object.keys(e).join()===SIT_KEYS.join(),e&&Object.keys(e));
  ok("total = cars asked, correct = right on the first tap, miss = the rest, shown 0",e.total===c.TRAIN_STEPS&&e.correct===c.TRAIN_STEPS-1&&e.miss===1&&e.shown===0,e);
  ok("date + printNum as a sitting writes them; secs counted; one sit",e.date==="20261108"&&e.printNum===41&&e.secs>=1&&e.sits.length===1&&e.sits[0].total===e.total&&Array.isArray(e.before)&&!e.before.length);
  ok("items: the letters asked, {id,name,deck,result}; a letter with a card carries its id",e.items.length===c.TRAIN_STEPS&&e.items.every(x=>Object.keys(x).join()==="id,name,deck,result"&&x.deck==="Abc"&&/^[A-Z]$/.test(x.name)&&(x.result==="c"||x.result==="m"))&&e.items.every(x=>x.id===(ABC.indexOf(x.name)<10?"L_"+x.name:"train_"+x.name)),e.items);
  ok("items: the missed letter is the 'm'",e.items.filter(x=>x.result==="m").length===1&&e.items[0].result==="m");
  ok("the round still logs as a game, exactly as before (one push, game:\"train\")",(()=>{ const g=w.writes.filter(x=>/^mastery\/gameLog\//.test(x[1])); return g.length===1&&g[0][0]==="push"&&g[0][1]==="mastery/gameLog/k/20261108"&&g[0][2].game==="train"&&g[0][2].level===1&&g[0][2].clean===false; })());
  ok("no other writes (no card, no printLog, no points)",w.writes.length===2,w.writes.map(x=>x[1]));
  ok("this device has today's entry (the card + Mom's views read it at once)",w.md.studyLog.k.s1["20261108"]===e||JSON.stringify(w.md.studyLog.k.s1["20261108"])===JSON.stringify(e));
  ok("the card is checked off the sitting's way: \"✓ done today\"",c.pktCardLine("k","s1")==="✓ done today");
  ok("logging twice for one round is impossible",c.pktLogSitting(st)===null&&studySets(w).length===1);
  w.flushAll();
  const h2=c.renderMastStudy();
  ok("after the song: Done today line, Play again for this session, and the next step (📚 STUDYEND)",/Done today: 4 cars/.test(h2)&&/trainStart\('s1'\)/.test(h2)&&/Play again/.test(h2)&&/next after s1/.test(h2));
  c.trainStart("s1"); playRound(w,false);
  const S2=studySets(w), e2=S2[1]&&S2[1][2];
  ok("Play again merges into today's entry the sitting's way (counts summed, items + sits joined)",S2.length===2&&e2.total===8&&e2.correct===7&&e2.miss===1&&e2.items.length===8&&e2.sits.length===2,e2);
}
// 🚂 TRAIN levels 3–5 (hook up) through the study card: the same sitting, the tray's cars are the cars asked
{ const slot=(st,L)=>ABC.indexOf(L)-st.start;
  const hook=(w,missL)=>{ const c=w.c, st=c.trainState; for(let g=0;g<40&&st.phase==="play";g++){ const ti=st.turns.findIndex(t=>!t.done); if(ti<0) break; const t=st.turns[ti];
      if(missL&&g===0){ const wk=st.turns.map((x,k)=>k).find(k=>ABC[st.start+k]!==t.L); c.trainDrop(ti,wk); }
      c.trainDrop(ti,slot(st,t.L)); if(st.lock) w.tick(w.now()+c.TRAIN_ROLL_MS); } return st; };
  [["3",5],["4",10],["5",26]].forEach(([lv,n])=>{
    const w=world({settings:{gameRules:{train:{level:lv}}}}), c=w.c;
    ok("level "+lv+" pinned: the study page shows the Train at level "+lv+" with this session's Start",/Level \d/.test(c.renderMastStudy())&&new RegExp("Level "+lv+" ").test(c.renderMastStudy())&&/trainStart\('s1'\)/.test(c.renderMastStudy()));
    c.trainStart("s1"); const st=c.trainState;
    ok("level "+lv+" study round: a hook-up tray of "+n+" cars, tied to the session",st.study&&st.study.sid==="s1"&&st.level===Number(lv)&&st.turns.length===n&&/Drag each car to its spot/.test(c.renderMastStudy()));
    hook(w,true);
    const S=studySets(w), e=S[0]&&S[0][2], g=w.writes.filter(x=>/^mastery\/gameLog\//.test(x[1]));
    ok("level "+lv+": ONE sitting — total "+n+" cars, the wrong-slot car is the one miss; the game log says level "+lv,st.phase==="done"&&S.length===1&&e.total===n&&e.correct===n-1&&e.miss===1&&e.items.length===n&&g.length===1&&g[0][2].level===Number(lv)&&g[0][2].clean===false,e&&{total:e.total,correct:e.correct,miss:e.miss});
  });
}
// a flip sitting already logged today: the Train merges into it
{
  const prev={date:"20261108",printNum:41,total:5,correct:4,miss:1,shown:2,secs:60,items:[{id:"x",name:"x",deck:"Abc",result:"c"}],sits:[{secs:60,total:5}],before:[{id:"x"}]};
  const w=world({studyLog:{k:{s1:{"20261108":prev}}}}), c=w.c;
  c.trainStart("s1"); playRound(w,false);
  const e=studySets(w)[0][2];
  ok("an earlier sitting today: summed onto it, shown kept, its before kept",e.total===9&&e.correct===8&&e.miss===1&&e.shown===2&&e.items.length===5&&e.sits.length===2&&e.before.length===1);
}
// Mom's ↩ send-back: the round is the redo
{
  const w=world({studyBack:{k:{s1:{ts:5}}}}), c=w.c;
  c.trainStart("s1"); playRound(w,false);
  const u=w.writes.filter(x=>x[1]==="mastery/studyBack/k/s1");
  ok("after a send-back the round stamps the redo (one update), as a sitting does",u.length===1&&u[0][0]==="update"&&u[0][2].redoneTs>0&&u[0][2].redoTotal===4);
}
// ── untouched cases ──
{
  const w=world({prek:false}), c=w.c, h=c.renderMastStudy();
  ok("school kid: no Train — the flip-card Start",c.pktSession("k","s1")===null&&flipStart(h)&&c.pktCardLabel("k","s1")===null,h.slice(0,200));
}
{
  const w=world({sid:"s2"}), c=w.c, h=c.renderMastStudy();
  ok("Pre-K kid, a numbers deck: the flip cards",c.pktSession("k","s2")===null&&flipStart(h)&&c.pktCardLabel("k","s2")===null);
  ok("Pre-K kid, a session mixing letters and another deck: the flip cards",c.pktSession("k","s3")===null);
  ok("Pre-K kid, a check-up on the letters deck: never the Train",c.pktSession("k","s4")===null);
}
{
  const w=world({settings:{gameRules:{train:{study:"off"}}}}), c=w.c, h=c.renderMastStudy();
  ok("Mom's switch off: the flip cards, the old label",c.pktSession("k","s1")===null&&flipStart(h)&&c.pktCardLabel("k","s1")===null);
  ok("…and a Start tapped on a Train page drawn before the switch went off logs no study",(()=>{ c.trainStart("s1"); const st=c.trainState; playRound(w,false); return !st.study&&studySets(w).length===0; })());
}
{
  const w=world({running:true}), c=w.c, h=c.renderMastStudy();
  ok("a flip sitting of that session already running keeps running (no Train over it)",!/trainStart/.test(h)&&/No cards left/.test(h));
}
{
  const w=world(), c=w.c;
  c.mstSid="s2"; const h=c.renderMastStudy();
  ok("the Pre-K kid's other session on the same page: the flip cards",flipStart(h));
  c.trainStart(); playRound(w,false);
  ok("a 🎮 Games-tab Train round (no session) logs the game only — never a study sitting",!c.trainState.study&&studySets(w).length===0&&w.writes.filter(x=>/gameLog/.test(x[1])).length===1);
  c.mstSid="s1";
  ok("…and the study page doesn't show that games round — its own Start",/Let’s go!/.test(c.renderMastStudy())&&/trainStart\('s1'\)/.test(c.renderMastStudy()));
}
// ── dry run ──
{
  const w=world({dry:true}), c=w.c;
  c.trainStart("s1"); playRound(w,true); w.flushAll();
  ok("dry run: a whole study round writes nothing",w.writes.length===0,w.writes);
}
// ── the switch in the Train's rules pop-up ──
{
  const w=world(), c=w.c;
  const r=c.GAME_RULES.train.find(x=>x.key==="study");
  ok("GAME_RULES.train \"study\": on / off, default on",r&&r.def==="on"&&r.opts.map(o=>o[0]).join()==="on,off");
  ok("the pop-up lists it for a Pre-K kid",/Study card opens the Train\?/.test(c.gameRulesHtml("k","train"))&&/Which level\?/.test(c.gameRulesHtml("k","train")));
  ok("Mom's tap: one targeted set of that rule only",c.gameRuleSet("k","train","study","off")===true&&w.writes.length===1&&w.writes[0][0]==="set"&&w.writes[0][1]==="mastery/k_settings/gameRules/train/study"&&w.writes[0][2]==="off");
  ok("…and the study card is the flip cards again",c.pktSession("k","s1")===null);
}
{
  const w=world({prek:false}), c=w.c;
  ok("a school kid's pop-up doesn't list it (level only)",!/Study card opens the Train/.test(c.gameRulesHtml("k","train"))&&/Which level\?/.test(c.gameRulesHtml("k","train")));
}

console.log("\n"+pass+" passed, "+fail+" failed");
process.exit(fail?1:0);
