/*
 * 📚 STUDYEND — the daily study ends in games (step 4 of the game-flag plan; her yes 2026-11-02). After a sitting saves, the
 * Nice work! screen gains one line: the next session (named ones first, the Daily Mix last), or on the last session "🎮 Now your
 * games · N cards" (the practice round), or "Study done — no games needed today". Switch off = nothing. No writes of its own.
 *   run:  node test_missplay_study_end.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
let pass=0, fail=0;
function ok(n,c,x){ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":""));} }
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
function fnText(name){ const i=src.indexOf("function "+name+"("); if(i<0) return ""; const j=src.indexOf("\nfunction ",i+10); return src.slice(i,j<0?undefined:j); }

// ── by text ──
const rs=fnText("renderMastStudy");
const iDone=rs.indexOf("} else if(mstDone){"), iHook=rs.indexOf('if(typeof mpStudyDoneHtml==="function") h+=mpStudyDoneHtml(kid,session.sid);'), iElse=rs.indexOf("} else {",iDone);
ok("the one hook sits inside the Nice work! branch of the study screen",iDone>0&&iHook>iDone&&iHook<iElse);
ok("the hook appears once in the file",(src.match(/mpStudyDoneHtml\(kid,session\.sid\)/g)||[]).length===1);
ok("mpOpen takes where it was opened from; the round's entry carries it",/function mpOpen\(kid,from\)/.test(src)&&/from:from\|\|null\}/.test(fnText("mpOpen"))&&/if\(entry&&U\.from\) entry\.from=U\.from;/.test(fnText("mpFinish")));
ok("the Day-page chip still opens the round with no 'from'",/mpOpen\(\\''\+kid\+'\\'\)/.test(fnText("mpDayChipHtml")));
const blk=src.slice(src.indexOf("// MISSPLAY_START"),src.indexOf("// MISSPLAY_END"));
ok("STUDYEND writes nothing of its own (no db in its functions)",!/db\./.test(fnText("mpStudyDoneHtml")+fnText("mpStudyNext")+fnText("mpStudySessionDone")));
ok("no kid's name in the block",!/lincoln|ellis|lucy|julian|caleb|taylor|makenzie|kenzie|andrew/i.test(blk));

// ── the pure rule ──
{
  const ctx={}; vm.createContext(ctx); vm.runInContext(fnText("mpStudyNext"),ctx);
  const S=[{sid:"fact",name:"Fact Study",emoji:"🔢",kind:"deck"},{sid:"mix",name:"Daily Mix",emoji:"🎲",kind:"mix"},{sid:"daily",name:"Daily Study",emoji:"📚",kind:"all"},{sid:"ck",name:"Check-up",emoji:"🩺",kind:"checkup"}];
  const done=d=>x=>d.indexOf(x)>=0;
  ok("after the first named session: the next NAMED one, even though the Mix is listed before it",JSON.stringify(ctx.mpStudyNext(S,"fact",done([])))==='{"sid":"daily","name":"Daily Study","emoji":"📚"}');
  ok("after the last named session: the Daily Mix",ctx.mpStudyNext(S,"daily",done(["fact"])).sid==="mix");
  ok("a session already done today is skipped",ctx.mpStudyNext(S,"fact",done(["daily"])).sid==="mix");
  ok("after the Mix with everything done: nothing left (null)",ctx.mpStudyNext(S,"mix",done(["fact","daily"]))===null);
  ok("the check-up is never a next step",ctx.mpStudyNext(S,"mix",done(["fact","daily"]))===null&&ctx.mpStudyNext([S[3],S[0]],"fact",done([]))===null);
  ok("the session just saved is never 'next' even without a log yet",ctx.mpStudyNext([S[0]],"fact",done([]))===null);
  ok("no sessions: null",ctx.mpStudyNext([],"x",done([]))===null&&ctx.mpStudyNext(null,"x",done([]))===null);
}

// ── the line, in a sandbox with the real WHICHONE + GAMELOG + MISSPLAY blocks ──
const LET="ABCDEFGHIJ".split("");
function sandbox(o){
  o=o||{};
  const items=LET.map((p,i)=>({id:"k_"+p,subject:"Letters",prompt:p,status:"active",tier:i<3?"every_other_day":"weekly",cycle:1,next_due:40}));
  if(o.flag) o.flag.forEach(id=>{ items.find(i=>i.id===id).gp={on:true,since:"20261101",need:3,days:[],m:0}; });
  const writes=[];
  const md={kid1:items,kid1_settings:o.settings||{missPlay:{on:true}},history:{},studyLog:{kid1:o.logs||{}}};
  const piles=o.piles||{};
  const ctx={console,Math,Object,Array,String,JSON,Number,Set,Date,setTimeout:()=>0,
    masteryKid:"kid1", masteryData:md,
    _smTileVis:it=>(it&&it.subject==="Letters"?'<b>'+it.prompt+'</b>':null),
    _matchPlain:h=>String(h||"").replace(/<[^>]*>/g," ").trim(), esc:s=>String(s||""),
    mastSpeak(){}, matchDing(){}, matchBonk(){}, _mastRe(){}, _dryRun:()=>false,
    db:{ref:p=>({set:v=>writes.push(["set",p,v]),update:v=>writes.push(["update",p,v]),push:v=>writes.push(["push",p,v])})},
    HA_LS:{setItem(){}}, bbAudioUnlock(){}, renderAll(){}, momHere:()=>true, mastAdminPinOk:false,
    mastSchoolDayNum:()=>5, mstTodayKey:()=>"20261102",
    mstSessions:()=>o.sessions||[], mstLogGet:(k,sid)=>(md.studyLog[k]&&md.studyLog[k][sid]&&md.studyLog[k][sid]["20261102"])||null,
    mstPile:(k,sid)=>piles[sid]||{newNames:["x"],reviews:[],learning:[]}, mastGetPrintNum:()=>1, mstEscJs:s=>String(s).replace(/'/g,"\\'"),
    document:{getElementById:()=>null,createElement:()=>({style:{}}),body:{appendChild(){}}}, cap:s=>s };
  vm.createContext(ctx);
  vm.runInContext(src.slice(src.indexOf("// WHICHONE_START"),src.indexOf("// MISSPLAY_END"))+"\n;this.__ui=()=>mpUI;",ctx);
  return {c:ctx,writes};
}
const SESS=[{sid:"fact",name:"Fact Study",emoji:"🔢",kind:"deck"},{sid:"daily",name:"Daily Study",emoji:"📚",kind:"all"},{sid:"mix",name:"Daily Mix",emoji:"🎲",kind:"mix"},{sid:"ck",name:"Check-up",kind:"checkup"}];
const log={"20261102":{total:5}};
console.log("switch off = the screen as it was");
{ const {c}=sandbox({settings:{},sessions:SESS,flag:["k_A"]}); ok("empty string",c.mpStudyDoneHtml("kid1","fact")===""); }
console.log("the next session");
{
  const {c}=sandbox({sessions:SESS,flag:["k_A"],logs:{fact:log}});
  const h=c.mpStudyDoneHtml("kid1","fact");
  ok("after Fact Study: Next → Daily Study (not the Mix, not the games)",/mp-study-next/.test(h)&&/mstPick\('daily'\)/.test(h)&&h.indexOf("Daily Study")>=0&&!/mpOpen/.test(h));
  const {c:c2}=sandbox({sessions:SESS,flag:["k_A"],logs:{fact:log,daily:log}});
  ok("after Daily Study: Next → Daily Mix",/mstPick\('mix'\)/.test(c2.mpStudyDoneHtml("kid1","daily")));
  const {c:c3}=sandbox({sessions:SESS,flag:["k_A"],logs:{fact:log},piles:{daily:{newNames:[],reviews:[],learning:[]}}});
  ok("a session with nothing to do today counts as done: Fact Study → straight to the Mix",/mstPick\('mix'\)/.test(c3.mpStudyDoneHtml("kid1","fact")));
}
console.log("the last session: the games");
{
  const {c,writes}=sandbox({sessions:SESS,flag:["k_A","k_B"],logs:{fact:log,daily:log,mix:log}});
  const h=c.mpStudyDoneHtml("kid1","mix");
  ok("🎮 Now your games · 2 cards, opened from the study",/mp-study-games/.test(h)&&/mpOpen\('kid1','study'\)/.test(h)&&h.indexOf("2 cards")>=0&&!/mstPick/.test(h));
  ok("the line itself writes nothing",writes.length===0);
  c.mpOpen("kid1","study"); const U=c.__ui();
  ok("the round opens on the flagged cards",U&&U.phase==="play"&&U.from==="study"&&U.q.filter(e=>e.list).length===2);
  // play one list card right, then finish
  c.mpTap(U.cur.tiles.indexOf(U.cur.pid)); c.mpNext();
  const R=c.mpFinish(U);
  ok("the round's log entry says it came from the study (one field); everything else as before",R.entry&&R.entry.from==="study"&&R.entry.game==="practice"&&R.entry.items.length===1);
  const pushed=writes.find(w=>w[0]==="push"&&w[1]==="mastery/gameLog/kid1/20261102");
  ok("pushed to GAMELOG's path with the field",!!pushed&&pushed[2].from==="study");
}
console.log("the Day-page chip's round carries no 'from'");
{
  const {c}=sandbox({sessions:SESS,flag:["k_A"]});
  c.mpOpen("kid1"); const U=c.__ui(); c.mpTap(U.cur.tiles.indexOf(U.cur.pid)); c.mpNext(); const R=c.mpFinish(U);
  ok("entry has no from",R.entry&&!("from" in R.entry)&&U.from===null);
}
console.log("the last session, nothing to practice");
{
  const {c}=sandbox({sessions:SESS,logs:{fact:log,daily:log,mix:log}});
  const h=c.mpStudyDoneHtml("kid1","mix");
  ok("⭐ Study done — no games needed today",/mp-study-done/.test(h)&&h.indexOf("no games needed today")>=0&&!/mpOpen|mstPick/.test(h));
  const {c:c2}=sandbox({sessions:SESS,flag:["k_A"],logs:{fact:log,daily:log,mix:log}});
  c2.masteryData.kid1[0].gp.days=[5];   // A already earned today
  ok("a flagged card already right today is not counted",/mp-study-done/.test(c2.mpStudyDoneHtml("kid1","mix")));
}
console.log("one session only (a kid with just the Daily Study)");
{
  const {c}=sandbox({sessions:[SESS[1]],flag:["k_A"],logs:{daily:log}});
  ok("its finish is the last: the games",/mp-study-games/.test(c.mpStudyDoneHtml("kid1","daily")));
}
console.log("Kids' Corner: the check-up is never offered as next");
{
  const {c}=sandbox({sessions:[SESS[1],SESS[3]],flag:["k_A"],logs:{daily:log}});
  ok("Daily Study then check-up in the list → the games, not the check-up",/mp-study-games/.test(c.mpStudyDoneHtml("kid1","daily")));
}
console.log("a broken helper never breaks the screen");
{
  const {c}=sandbox({sessions:SESS,flag:["k_A"],logs:{}});
  c.mstPile=()=>{ throw new Error("boom"); };
  const h=c.mpStudyDoneHtml("kid1","fact");
  ok("mstPile throwing counts the session as done; a line still renders",typeof h==="string"&&h.length>0);
}

console.log("\n"+pass+" passed, "+fail+" failed");
process.exit(fail?1:0);
