/*
 * 🎮 MISSPLAY — the practice list (slice 2 of DESIGN_missed_card_games_2026-10-31.md; her "Start slice 2", 2026-10-31).
 * Switch off = nothing changes. Switch on: a drill ✗ (and ~ while close cards count) joins the list, is held out of Mom's
 * drill and the sprint pool, and is practiced in a Which one?-style round from the kid's Day page: first day 3 first-tap
 * rights, later days 1, a wrong tap starts over, 3 right days → back to Mom's next drill; Mom's ✓ there = learned.
 *   run:  node test_missplay.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
let pass=0, fail=0;
function ok(n,c,x){ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":""));} }
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
const w=src.indexOf("// WHICHONE_START"), g=src.indexOf("// GAMELOG_END"), a=src.indexOf("// MISSPLAY_START"), b=src.indexOf("// MISSPLAY_END");
ok("MISSPLAY block sits right after GAMELOG",w>0&&g>w&&a>g&&b>a&&src.slice(g,a).trim()==="// GAMELOG_END");
const blk=src.slice(a,b), code=src.slice(w,b);
ok("no kid's name in the block",!/lincoln|ellis|lucy|julian|caleb|taylor|makenzie|andrew/i.test(blk));
ok("the block never uses a whole-node set",!/db\.ref\("mastery\/"\+kid\)\.set\(|db\.ref\("mastery"\)\.set\(/.test(blk));

// ── hooks, by text (each one guarded line) ──
function fnText(name){ const i=src.indexOf("function "+name+"("); if(i<0) return ""; const j=src.indexOf("\nfunction ",i+10); return src.slice(i,j<0?undefined:j); }
const sv=fnText("mastSaveResults");
const iApply=sv.indexOf("mastApplyScores("), iWW=sv.indexOf("wwAfterDrill("), iMP=sv.indexOf('typeof mpAfterDrill==="function") mpAfterDrill(masteryKid,items,due,mastLogScores,touched)'), iUpd=sv.indexOf('db.ref("mastery/"+masteryKid).update(upd)');
ok("drill save: mpAfterDrill after the ladder + Word Workout, before the one targeted update",iApply>0&&iWW>iApply&&iMP>iWW&&iUpd>iMP,[iApply,iWW,iMP,iUpd]);
ok("drill save: the update carries gp (null clears it)",/if\(it\.gp!==undefined\) upd\[ix\+"\/gp"\]=it\.gp\|\|null;/.test(sv)&&sv.indexOf('upd[ix+"/gp"]')<iUpd);
ok("drill save hook appears once in the file",(src.match(/mpAfterDrill\(masteryKid,items,due,mastLogScores,touched\)/g)||[]).length===1);
ok("mastDueItems holds list cards out",/&&!\(typeof mpHeld==="function"&&mpHeld\(kid,i\)\)\);/.test(fnText("mastDueItems")));
ok("mastSprintPool skips list cards",/if\(typeof mpHeld==="function"&&mpHeld\(kid,it\)\) return false;/.test(fnText("mastSprintPool")));
ok("the Day page shows the Practice button beside Word Workout",/h\+=wwDayChipHtml\(kid,day\);[^\n]*\n  if\(kid!=="all"&&kid!=="mom"&&typeof mpDayChipHtml==="function"\) h\+=mpDayChipHtml\(kid,day\);/.test(src));
ok("Mom HQ ⚙ Rules shows the switches",/h\+=mastAdminRulesHtml\(\);\n    if\(typeof mpSettingsHtml==="function"\) h\+=mpSettingsHtml\(kid\);/.test(src));

// ── a sandbox with the real WHICHONE + GAMELOG + MISSPLAY blocks ──
const LET="ABCDEFGHIJ".split("");
function cards(){ return LET.map((p,i)=>({id:"k_"+p,subject:"Letters",prompt:p,status:"active",tier:i<3?"every_other_day":"weekly",cycle:1,next_due:40}))
  .concat([{id:"k_w1",subject:"Words",prompt:"the",status:"active",tier:"weekly"},{id:"k_w2",subject:"Words",prompt:"and",status:"active",tier:"weekly"},{id:"k_w3",subject:"Words",prompt:"you",status:"active",tier:"weekly"}]); }
function sandbox(o){
  o=o||{};
  const L={timers:[],writes:[],spoken:[],renders:0};
  const md={kid1:cards(),kid1_settings:o.settings||{missPlay:{on:true}},history:o.history||{}};
  const ctx={console,Math,Object,Array,String,JSON,Number,Set,Date,
    setTimeout:(f,ms)=>{ L.timers.push(f); return L.timers.length; },
    masteryKid:"kid1", masteryData:md,
    _smTileVis:it=>(it&&it.subject==="Letters"?'<b>'+it.prompt+'</b>':null),   // letters are their own picture; words aren't
    _matchPlain:h=>String(h||"").replace(/<[^>]*>/g," ").trim(), esc:s=>String(s||""),
    mastSpeak:t=>L.spoken.push(t), matchDing(){}, matchBonk(){}, _mastRe(){},
    _dryRun:()=>!!o.dry,
    db:o.noDb?null:{ref:p=>({set:v=>L.writes.push([p,"set",v]),update:v=>L.writes.push([p,"update",v]),push:v=>L.writes.push([p,"push",v])})},
    HA_LS:{setItem(){}}, bbAudioUnlock(){}, renderAll(){ L.renders++; },
    momHere:()=>o.mom!==false, mastAdminPinOk:false,
    mastSchoolDayNum:()=>ctxDay.n, mstTodayKey:()=>"2026110"+ctxDay.n,
    document:{getElementById:()=>null,createElement:()=>({style:{}}),body:{appendChild(){}}},
    cap:s=>s,
  };
  const ctxDay={n:1}; ctx.__day=ctxDay;
  vm.createContext(ctx);
  vm.runInContext(code+"\n;this.__ui=()=>mpUI;",ctx);
  ctx.L=L; return ctx;
}
const card=(c,id)=>c.masteryData.kid1.find(x=>x.id===id);
const flush=c=>{ let n=0; while(c.L.timers.length&&n++<200){ c.L.timers.shift()(); } };
// play the open round: rightFirst(pid) decides whether a list card is right on the first tap
function play(c,rightFirst){
  let guard=0;
  while(c.__ui()&&c.__ui().phase==="play"&&guard++<300){
    const U=c.__ui(), cur=U.cur; if(!cur) break;
    const good=cur.tiles.indexOf(cur.pid);
    if(cur.list&&rightFirst&&!rightFirst(cur.pid)) c.mpTap(cur.tiles.findIndex(p=>p!==cur.pid));
    c.mpTap(good); flush(c);
  }
}
const drill=(c,scores)=>{ const items=c.masteryData.kid1, due=items.filter(i=>scores[i.id]), touched=[]; c.mpAfterDrill("kid1",items,due,scores,touched); return touched; };

console.log("switch off = nothing changes");
{
  const c=sandbox({settings:{}});
  const t=drill(c,{k_A:"m",k_B:"~",k_C:"c"});
  ok("no card joins, nothing touched",t.length===0&&!c.masteryData.kid1.some(i=>i.gp));
  card(c,"k_A").gp={on:true,since:"x",need:3,days:[],m:0};
  ok("a card with list state is NOT held while the switch is off",c.mpHeld("kid1",card(c,"k_A"))===false);
  ok("no Practice button",c.mpDayChipHtml("kid1","monday")==="");
  ok("mpOpen does nothing",c.mpOpen("kid1")===false&&!c.__ui());
}

console.log("joining at drill save");
{
  const c=sandbox();
  const t=drill(c,{k_A:"m",k_B:"~",k_C:"c",k_w1:"m"});
  const A=card(c,"k_A").gp, B=card(c,"k_B").gp;
  ok("✗ joins: on, need 3, no right days",A&&A.on===true&&A.need===3&&A.days.length===0&&A.m===0&&A.since==="20261101",A);
  ok("~ joins while close cards count (her answer 1)",B&&B.on===true);
  ok("✓ doesn't join",!card(c,"k_C").gp);
  ok("a card its deck can't play in the games stays in the drill",!card(c,"k_w1").gp);
  ok("joined cards are touched (the save writes them)",t.length===2&&t.indexOf(card(c,"k_A"))>=0);
  ok("held out of the drill now",c.mpHeld("kid1",card(c,"k_A"))&&!c.mpHeld("kid1",card(c,"k_C")));
  const c2=sandbox({settings:{missPlay:{on:true,close:false}}});
  drill(c2,{k_A:"m",k_B:"~"});
  ok("close cards off → ~ stays in the drill",card(c2,"k_A").gp&&!card(c2,"k_B").gp);
}

console.log("a list limit (when Mom sets one)");
{
  const c=sandbox({settings:{missPlay:{on:true,cap:2}}});
  drill(c,{k_A:"m",k_B:"m",k_C:"m"});
  ok("two on the list, the third waits (and stays in the drill)",card(c,"k_A").gp.on&&card(c,"k_B").gp.on&&card(c,"k_C").gp.wait===true&&!c.mpHeld("kid1",card(c,"k_C")));
  const t=drill(c,{k_C:"c"});
  ok("a waiting card said right in the drill leaves the line",card(c,"k_C").gp===null&&t.length===1);
  drill(c,{k_D:"m"});
  card(c,"k_A").gp={on:false,out:"x",days:[1,2,3]};
  const t2=[]; c.mpAfterDrill("kid1",c.masteryData.kid1,[],{},t2);
  ok("when a place opens the waiting card joins",card(c,"k_D").gp.on===true&&t2.indexOf(card(c,"k_D"))>=0);
}

console.log("the practice round");
{
  const H={20261020:{items:[{id:"k_B",result:"m"},{id:"k_B",result:"m"},{id:"k_A",result:"m"}]}};
  const c=sandbox({history:{kid1:H}});
  drill(c,{k_A:"m",k_B:"m"});
  const R=c.mpBuildRound("kid1",c.masteryData.kid1,1,()=>0.5);
  ok("most-missed first",R.listIds.join()==="k_B,k_A",R.listIds);
  ok("each list card is followed by a known card from its deck",R.q.length===4&&R.q[0].list&&!R.q[1].list&&R.q[2].list&&!R.q[3].list,R.q);
  const kn=R.q.filter(x=>!x.list).map(x=>card(c,x.pid));
  ok("known cards: same deck, weekly or later, not on the list",kn.every(k=>k.subject==="Letters"&&["weekly","bi_weekly","monthly"].indexOf(k.tier)>=0&&!k.gp));
  ok("the Practice button counts 2 cards",/Practice · 2 cards/.test(c.mpDayChipHtml("kid1","x")));
  ok("the round opens",c.mpOpen("kid1")===true&&c.__ui().phase==="play");
  ok("it says the first card's name",c.L.spoken.length===1&&c.L.spoken[0]==="B");
  play(c,()=>true);
  const A=card(c,"k_A").gp, B=card(c,"k_B").gp;
  ok("day 1: three first-tap rights → one right day, need drops to 1",A.days.join()==="1"&&A.need===1&&B.days.join()==="1",[A,B]);
  const listTurns=c.L.writes.length&&c.__ui().log.filter(x=>x.list).length;
  ok("each list card came 3 times (other cards between)",listTurns===6,listTurns);
  const upd=c.L.writes.find(w=>w[0]==="mastery/kid1"&&w[1]==="update");
  ok("ONE targeted update on the cards (gp only)",upd&&Object.keys(upd[2]).sort().join()==="0/gp,1/gp",upd&&Object.keys(upd[2]));
  const gl=c.L.writes.find(w=>/^mastery\/gameLog\/kid1\//.test(w[0]));
  ok("the round is logged on GAMELOG's path as practice",gl&&gl[1]==="push"&&gl[2].game==="practice"&&gl[2].items.filter(x=>x.list).length===6);
  ok("nothing left for today: the button hides",c.mpDayChipHtml("kid1","x")==="");
  c.mpClose();
  // day 2 and day 3: one right each
  c.__day.n=2; c.L.writes.length=0; c.mpOpen("kid1"); play(c,()=>true);
  ok("day 2: one right is enough",card(c,"k_A").gp.days.join()==="1,2"&&c.__ui().log.filter(x=>x.id==="k_A").length===1);
  c.mpClose();
  c.__day.n=3; c.L.writes.length=0; c.mpOpen("kid1"); play(c,()=>true);
  const A3=card(c,"k_A");
  ok("day 3: off the list, back to Mom's drill today",A3.gp.on===false&&A3.gp.out==="20261103"&&A3.next_due===3&&!c.mpHeld("kid1",A3));
  const u3=c.L.writes.find(w=>w[0]==="mastery/kid1");
  ok("the save writes next_due for a card going back",u3&&u3[2]["0/next_due"]===3&&u3[2]["0/gp"].on===false,u3&&u3[2]);
  ok("the end screen tells him",/Ready to show Mom/.test(JSON.stringify(c.__ui().out))||c.__ui().out.k_A===1);
  c.mpClose();
  // Mom's drill
  drill(c,{k_A:"c"});
  ok("Mom hears it right → learned (gp.ok), stays off the list",card(c,"k_A").gp.ok==="20261103"&&card(c,"k_A").gp.on===false);
  drill(c,{k_B:"m"});
  ok("missed again in Mom's drill → straight back on the list",card(c,"k_B").gp.on===true&&card(c,"k_B").gp.need===3);
}

console.log("a wrong tap starts over");
{
  const c=sandbox();
  drill(c,{k_A:"m"});
  c.mpOpen("kid1");
  let n=0; play(c,pid=>{ n++; return n!==2; });   // the 2nd showing is a wrong tap
  const A=card(c,"k_A").gp;
  ok("the miss is counted and the day still needs 3 fresh rights",A.m===1&&A.days.join()==="1"&&A.need===1,A);
  ok("it took 5 showings (1 right, 1 miss, then 3 fresh rights)",c.__ui().log.filter(x=>x.id==="k_A").length===5,c.__ui().log.filter(x=>x.id==="k_A"));
  const c2=sandbox();
  drill(c2,{k_A:"m"});
  c2.mpOpen("kid1"); play(c2,()=>false);
  ok("never right → at most "+6+" showings, no right day",c2.__ui().log.filter(x=>x.id==="k_A").length===6&&card(c2,"k_A").gp.days.length===0);
  const c3=sandbox(); drill(c3,{k_A:"m"});
  card(c3,"k_A").gp.days=[0]; card(c3,"k_A").gp.need=1;
  c3.mpOpen("kid1"); let k=0; play(c3,()=>(++k)>1);
  ok("a miss on a later day wipes the earlier right days",card(c3,"k_A").gp.days.join()==="1"&&card(c3,"k_A").gp.m===1,card(c3,"k_A").gp);
}

console.log("closing part-way, time limit, dry run");
{
  const c=sandbox(); drill(c,{k_A:"m",k_B:"m"});
  c.mpOpen("kid1"); const U=c.__ui(); const t=U.cur; c.mpTap(t.tiles.indexOf(t.pid)); flush(c);
  c.mpClose();
  ok("closing part-way saves what was earned",c.L.writes.some(w=>w[0]==="mastery/kid1"&&w[2]["0/gp"]||w[0]==="mastery/kid1"&&w[2]["1/gp"])&&c.__ui()===null);
  const c2=sandbox({settings:{missPlay:{on:true,secs:60}}}); drill(c2,{k_A:"m"});
  c2.mpOpen("kid1"); c2.__ui().t0=Date.now()-61000; const t2=c2.__ui().cur; c2.mpTap(t2.tiles.indexOf(t2.pid)); flush(c2);
  ok("past the time limit the round ends after the turn",c2.__ui().phase==="done"&&c2.__ui().log.length===1);
  const c3=sandbox({dry:true}); drill(c3,{k_A:"m"});
  c3.mpOpen("kid1"); play(c3,()=>true); c3.mpClose();
  ok("dry run: no database writes, the cards still change on screen",c3.L.writes.length===0&&card(c3,"k_A").gp.days.length===1);
  const c4=sandbox(); c4.mpOpen("kid1");
  ok("switch on, nothing on the list → a kind empty round, nothing written",c4.__ui().phase==="done"&&c4.L.writes.length===0);
}

console.log("the switches");
{
  const c=sandbox({settings:{}});
  ok("Mom turns it on: ONE targeted set",c.mpSet("kid1","on",true)===true&&c.L.writes.length===1&&c.L.writes[0][0]==="mastery/kid1_settings/missPlay/on"&&c.L.writes[0][2]===true);
  c.mpSet("kid1","cap",3); c.mpSet("kid1","secs",120);
  ok("cap and time saved as numbers",c.masteryData.kid1_settings.missPlay.cap===3&&c.masteryData.kid1_settings.missPlay.secs===120);
  ok("an unknown field is refused",c.mpSet("kid1","nope",1)===false);
  const html=c.mpSettingsHtml("kid1");
  ok("the card shows the switches",/Missed-card games/.test(html)&&/mpSet\('kid1','on',false\)/.test(html)&&/2 min/.test(html)&&/>3</.test(html));
  const off=sandbox({settings:{}}).mpSettingsHtml("kid1");
  ok("off: only the main switch shows",/Missed-card games go|Missed cards go to the games/.test(off)&&!/Cards on the list at once/.test(off));
  const kid=sandbox({settings:{},mom:false});
  ok("not Mom → nothing saved",kid.mpSet("kid1","on",true)===false&&kid.L.writes.length===0);
  const dry=sandbox({settings:{},dry:true});
  ok("dry run → no write, the switch still flips on screen",dry.mpSet("kid1","on",true)===true&&dry.L.writes.length===0&&dry.masteryData.kid1_settings.missPlay.on===true);
}

console.log("\n"+pass+" passed, "+fail+" failed");
process.exit(fail?1:0);
