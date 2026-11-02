/*
 * 🎮 MISSPLAY — study misses join the practice list (step 2 of the game-flag plan; her words 2026-11-02: "if they got it
 * wrong, say more than one time, then it also means that it needs to be reviewed in games" — even if it passed in the end).
 * The sitting's engine counts misses per card; on save, a card wrong 2+ times joins the list by the drill's own join rules
 * (playable deck, cap, already-on stays). Switch off, or "study misses go too" off = nothing. The sitting itself is untouched.
 *   run:  node test_missplay_study.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
let pass=0, fail=0;
function ok(n,c,x){ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":""));} }
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
function fnText(name){ const i=src.indexOf("function "+name+"("); if(i<0) return ""; const j=src.indexOf("\nfunction ",i+10); return src.slice(i,j<0?undefined:j); }

// ── hooks, by text ──
const sv=fnText("_mstSaveInner");
const iWW=sv.indexOf('scStudyWw(items,scores,touched)'), iMP=sv.indexOf('typeof mpAfterStudy==="function") mpAfterStudy(kid,items,mstState,touched)'), iUpd=sv.indexOf('db.ref("mastery/"+kid).update(upd)');
ok("study save: mpAfterStudy right after Word Workout, before the one targeted update",iWW>0&&iMP>iWW&&iUpd>iMP,[iWW,iMP,iUpd]);
ok("study save: the update carries gp (null clears it)",/if\(it\.gp!==undefined\) upd\[ix\+"\/gp"\]=it\.gp\|\|null;/.test(sv)&&sv.indexOf('upd[ix+"/gp"]')<iUpd);
ok("study save hook appears once in the file",(src.match(/mpAfterStudy\(kid,items,mstState,touched\)/g)||[]).length===1);
ok("mstAnswer counts misses on the card",/if \(ans !== "good"\) card\.misses = \(card\.misses \| 0\) \+ 1;/.test(fnText("mstAnswer")));
ok("mpSet accepts the study field",/\["on","cap","secs","close","study"\]/.test(fnText("mpSet")));
ok("Mom HQ shows the Study misses row only while the switch is on",(()=>{ const t=fnText("mpSettingsHtml"); const a=t.indexOf("if(c.on){"), b=t.indexOf('tg("study",c.study)'); return a>0&&b>a; })());
const blk=src.slice(src.indexOf("// MISSPLAY_START"),src.indexOf("// MISSPLAY_END"));
ok("no kid's name in the block",!/lincoln|ellis|lucy|julian|caleb|taylor|makenzie|andrew/i.test(blk));

// ── the pure engine: mstAnswer ──
{
  const ctx={}; vm.createContext(ctx);
  vm.runInContext(fnText("mstAnswer")+"\n"+fnText("mstOutcomes"),ctx);
  const st=()=>({passes:2,queue:["a","b","r"],cards:{a:{id:"c_a",kind:"learning",first:null,goods:0,done:false},b:{id:"c_b",kind:"learning",first:null,goods:0,done:false},r:{id:"c_r",kind:"review",first:null,done:false}}});
  let S=st();
  ctx.mstAnswer(S,"a","again"); ctx.mstAnswer(S,"b","good"); ctx.mstAnswer(S,"r","again");
  ctx.mstAnswer(S,"a","again"); ctx.mstAnswer(S,"b","good"); ctx.mstAnswer(S,"r","good");
  ctx.mstAnswer(S,"a","good"); ctx.mstAnswer(S,"a","good");
  ok("a learning card wrong twice then passing: misses 2, done",S.cards.a.misses===2&&S.cards.a.done===true);
  ok("a card never wrong has no misses field",S.cards.b.misses===undefined&&S.cards.b.done===true);
  ok("a review card wrong once: misses 1, done after the comeback",S.cards.r.misses===1&&S.cards.r.done===true);
  ok("first answer and goods rules unchanged",S.cards.a.first==="again"&&S.cards.b.first==="good"&&S.cards.a.goods===2);
  const O=ctx.mstOutcomes(S);
  ok("outcomes unchanged by the counter",O.scores.c_r==="m"&&O.shownIds.indexOf("c_a")>=0&&O.shownIds.indexOf("c_b")>=0);
}

// ── mpAfterStudy in a sandbox with the real WHICHONE + GAMELOG + MISSPLAY blocks ──
const LET="ABCDEFGHIJ".split("");
function cards(){ return LET.map((p,i)=>({id:"k_"+p,subject:"Letters",prompt:p,status:"active",tier:i<3?"every_other_day":"weekly",cycle:1,next_due:40}))
  .concat([{id:"k_w1",subject:"AAS Words",prompt:"the",answer:"the",status:"introduction",tier:"daily"},{id:"k_w2",subject:"AAS Words",prompt:"and",answer:"and",status:"introduction",tier:"daily"}]); }
function sandbox(o){
  o=o||{};
  const md={kid1:cards(),kid1_settings:o.settings||{missPlay:{on:true}},history:{}};
  const ctx={console,Math,Object,Array,String,JSON,Number,Set,Date,setTimeout:()=>0,
    masteryKid:"kid1", masteryData:md,
    _smTileVis:it=>(it&&it.subject==="Letters"?'<b>'+it.prompt+'</b>':null),
    _matchPlain:h=>String(h||"").replace(/<[^>]*>/g," ").trim(), esc:s=>String(s||""),
    mastSpeak(){}, matchDing(){}, matchBonk(){}, _mastRe(){}, _dryRun:()=>false, db:null,
    HA_LS:{setItem(){}}, bbAudioUnlock(){}, renderAll(){}, momHere:()=>true, mastAdminPinOk:false,
    mastSchoolDayNum:()=>5, mstTodayKey:()=>"20261102",
    document:{getElementById:()=>null,createElement:()=>({style:{}}),body:{appendChild(){}}}, cap:s=>s };
  vm.createContext(ctx);
  vm.runInContext(src.slice(src.indexOf("// WHICHONE_START"),src.indexOf("// MISSPLAY_END")),ctx);
  return ctx;
}
const card=(c,id)=>c.masteryData.kid1.find(x=>x.id===id);
const state=m=>{ const cards={}; Object.keys(m).forEach(id=>{ cards[id]={id,kind:"learning",first:m[id]?"again":"good",goods:2,done:true,misses:m[id]||undefined}; }); return {passes:2,queue:[],cards}; };
const study=(c,m)=>{ const items=c.masteryData.kid1, touched=[]; c.mpAfterStudy("kid1",items,state(m),touched); return touched; };

console.log("switch off = nothing");
{ const c=sandbox({settings:{}}); const t=study(c,{k_A:3,k_B:2}); ok("no card joins, nothing touched",t.length===0&&!c.masteryData.kid1.some(i=>i.gp)); }
console.log("'study misses go too' off = nothing");
{ const c=sandbox({settings:{missPlay:{on:true,study:false}}}); const t=study(c,{k_A:3}); ok("no card joins",t.length===0&&!card(c,"k_A").gp); }
console.log("wrong twice joins, wrong once doesn't, right never does");
{
  const c=sandbox(); const t=study(c,{k_A:2,k_B:1,k_C:0,k_D:5});
  ok("A (2) and D (5) join with the first-day rule",card(c,"k_A").gp&&card(c,"k_A").gp.on===true&&card(c,"k_A").gp.need===3&&card(c,"k_A").gp.since==="20261102"&&card(c,"k_D").gp&&card(c,"k_D").gp.on===true);
  ok("B (1) and C (0) stay off the list",!card(c,"k_B").gp&&!card(c,"k_C").gp);
  ok("only the joiners are touched",t.length===2&&t.indexOf(card(c,"k_A"))>=0&&t.indexOf(card(c,"k_D"))>=0);
  ok("the cards' ladder fields are untouched",card(c,"k_A").status==="active"&&card(c,"k_A").tier==="every_other_day"&&card(c,"k_A").next_due===40);
}
console.log("already on the list stays as it was");
{ const c=sandbox(); card(c,"k_A").gp={on:true,since:"20261030",need:1,days:["3","4"],m:1}; const t=study(c,{k_A:4});
  ok("gp unchanged, not touched",card(c,"k_A").gp.since==="20261030"&&card(c,"k_A").gp.days.length===2&&t.length===0); }
console.log("a deck the games can't play stays out");
{ const c=sandbox(); const t=study(c,{k_w1:3,k_w2:2}); ok("spelling words don't join (no game for them yet)",t.length===0&&!card(c,"k_w1").gp&&!card(c,"k_w2").gp); }
console.log("the cap: extra misses wait");
{ const c=sandbox({settings:{missPlay:{on:true,cap:1}}}); const t=study(c,{k_A:2,k_B:2});
  const on=c.masteryData.kid1.filter(i=>i.gp&&i.gp.on===true).length, wait=c.masteryData.kid1.filter(i=>i.gp&&i.gp.wait===true).length;
  ok("one on, one waiting, both touched",on===1&&wait===1&&t.length===2); }
console.log("a card not in the bank is skipped; a state card without an id is skipped");
{ const c=sandbox(); const items=c.masteryData.kid1, touched=[]; const S=state({k_A:2}); S.cards.zz={kind:"new",misses:4}; S.cards.gone={id:"k_none",misses:3};
  c.mpAfterStudy("kid1",items,S,touched); ok("only A joined",touched.length===1&&touched[0].id==="k_A"); }
console.log("the drill's join still works the same (regression)");
{ const c=sandbox(); const items=c.masteryData.kid1, touched=[]; c.mpAfterDrill("kid1",items,items.filter(i=>i.id==="k_E"),{k_E:"m"},touched); ok("E joins from the drill",card(c,"k_E").gp&&card(c,"k_E").gp.on===true&&touched.length===1); }
console.log("the setting round-trips and Mom HQ shows the row");
{ const c=sandbox(); ok("mpCfg.study defaults on",c.mpCfg("kid1").study===true);
  ok("mpSet study false",c.mpSet("kid1","study",false)===true&&c.mpCfg("kid1").study===false);
  ok("unknown field refused",c.mpSet("kid1","bogus",1)===false);
  const h=c.mpSettingsHtml("kid1"); ok("row present with its text",h.indexOf("Study misses go too")>=0&&h.indexOf("Only the drill sends cards to the games")>=0);
  c.mpSet("kid1","on",false); ok("row hidden when the switch is off",c.mpSettingsHtml("kid1").indexOf("Study misses go too")<0); }

console.log("\n"+pass+" passed, "+fail+" failed");
process.exit(fail?1:0);
