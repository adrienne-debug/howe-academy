/*
 * ✅ AFTERDRILL — ONE "After the drill" list + ONE hand-off (her ask 2026-11-08; DESIGN_after_drill_one_2026-11-08.md).
 * The list = today's 🏋️ Word Workout words ∪ today's 🎮 missed cards, each card once. Entry and exit rules stay each kind's
 * own; after Mom's drill: "Let's work out the ones we missed" → the words in the Workout → 👀 Watch it → the round. The top
 * Word Workout button and the two Day-page chips are gone; the Day page shows one "After the drill · N" line.
 * Runs the REAL WHICHONE … MISSPLAY, AFTERDRILL, WORDWORKOUT and SPELLBUILD blocks.   run:  node test_after_drill_one.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
let pass=0, fail=0;
function ok(n,c,x){ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":""));} }
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("markers "+a); return src.slice(i,j); };
function fnText(name){ const i=src.indexOf("function "+name+"("); if(i<0) return ""; const j=src.indexOf("\nfunction ",i+10); return src.slice(i,j<0?undefined:j); }

console.log("── by text: the wiring ──");
const blk=cut("// AFTERDRILL_START","// AFTERDRILL_END");
ok("the block sits right after MISSPLAY_END (the game blocks' slots after SPELLBUILD_END stay theirs)",src.indexOf("// MISSPLAY_END")<src.indexOf("// AFTERDRILL_START")&&src.indexOf("// AFTERDRILL_START")-src.indexOf("// MISSPLAY_END")<40);
ok("no kid's or family's name in the block",!/lincoln|ellis|lucy|julian|caleb|taylor|makenzie|kenzie|andrew|adrienne|howe|dewalt/i.test(blk));
ok("the block writes nothing of its own (no db, no storage)",!/db\.|HA_LS|localStorage/.test(blk));
const sv=fnText("mastSaveResults");
ok("the drill save: Scores first, then the ONE hand-off hook",(()=>{ const a=sv.indexOf('mastView="scores"; mastScoreItemId=null;'), b=sv.indexOf('if(typeof adAfterDrillSaved==="function") adAfterDrillSaved(masteryKid);'); return a>0&&b>a; })());
ok("the old DRILLEND hand-off is no longer called by the app",!/mpAfterDrillSaved\(masteryKid\)/.test(src)&&/function mpAfterDrillSaved\(kid\)/.test(src));
ok("entry hooks unchanged: the drill save still feeds both kinds before its write",/wwAfterDrill\(masteryKid,items,due,mastLogScores,touched\)/.test(sv)&&/mpAfterDrill\(masteryKid,items,due,mastLogScores,touched\)/.test(sv));
ok("entry hooks unchanged: the paper drill still feeds words only",/wwAfterDrill\(kid,items,due,scores,ap\.touched\)/.test(fnText("pdSave"))&&!/mpAfterDrill\(/.test(fnText("pdSave")));
ok("the top Word Workout button is gone",!/h\+=wwBtnHtml\(/.test(src));
ok("both Day-page chips are gone, one 'After the drill' line in their place",!/h\+=wwDayChipHtml\(/.test(src)&&!/h\+=mpDayChipHtml\(/.test(src)&&(src.match(/h\+=adDayLineHtml\(kid,day\)/g)||[]).length===1);
ok("the line sits right under the 🧠 brain work strip",(()=>{ const a=src.indexOf("h+=retrSchedStripHtml(kid,day);"), b=src.indexOf("h+=adDayLineHtml(kid,day)"); return a>0&&b>a&&b-a<200; })());
ok("the Workout's one db write is still mastery/<kid>/<ix>/ww",(()=>{ const ww=cut("// WORDWORKOUT_START","// WORDWORKOUT_END"); return (ww.match(/db\.ref\(/g)||[]).length===1&&/db\.ref\("mastery\/"\+kid\+"\/"\+ix\+"\/ww"\)/.test(ww); })());
ok("the 🔀 emoji is still absent",src.indexOf("\u{1F500}")<0);

// ── a sandbox with the real blocks ──
const LET="ABCDEFGHIJ".split("");
function sandbox(o){
  o=o||{};
  const items=LET.map((p,i)=>({id:"k_"+p,subject:"Letters",prompt:p,status:"active",tier:i<3?"every_other_day":"weekly",cycle:1,next_due:40}));
  (o.words||[]).forEach(w=>items.push(Object.assign({id:"w_"+w.p,subject:"AAS Words",prompt:w.p,answer:w.p,status:"active",tier:"weekly"},w.x||{})));
  (o.flag||[]).forEach(id=>{ items.find(i=>i.id===id).gp={on:true,since:"20261101",need:3,days:[],m:0}; });
  const writes=[], said=[], els={}, timers=[], toasts=[];
  const document={body:{appendChild(e){ els[e.id]=e; }},getElementById:id=>els[id]||null,createElement:()=>({style:{},remove(){ delete els[this.id]; }})};
  const md={kid1:items,kid1_settings:o.settings||{missPlay:{on:true}},history:{}};
  const ctx={console,Math,Object,Array,String,JSON,Number,Set,Map,RegExp,Date,parseInt,isNaN,setTimeout:(fn,ms)=>{ timers.push(fn); return timers.length; },
    masteryKid:"kid1", masteryData:md, _todayDay:"Wed",
    _smTileVis:it=>(it&&it.subject==="Letters"?'<b>'+it.prompt+'</b>':null),
    _matchPlain:h=>String(h||"").replace(/<[^>]*>/g," ").trim(), esc:s=>String(s||""), cap:s=>s.toUpperCase(),
    mastSpeak:(t,op)=>said.push(t), matchDing(){}, matchBonk(){}, _mastRe(){}, _dryRun:()=>false,
    db:{ref:p=>({set:v=>writes.push(["set",p,v]),update:v=>writes.push(["update",p,v]),push:v=>writes.push(["push",p,v])})},
    HA_LS:{setItem(){}}, bbAudioUnlock(){}, renderAll(){}, momHere:()=>true, mastAdminPinOk:false, gwShowToast:m=>toasts.push(m),
    mastSchoolDayNum:()=>5, mstTodayKey:()=>"20261102", kidOffOwnDay:o.offDay?()=>true:undefined,
    document };
  vm.createContext(ctx);
  vm.runInContext(cut("// WHICHONE_START","// MISSPLAY_END")+"\n"+cut("// AFTERDRILL_START","// AFTERDRILL_END")+"\n"+cut("// WORDWORKOUT_START","// WORDWORKOUT_END")+"\n"+cut("// SPELLBUILD_START","// SPELLBUILD_END")
    +"\n;this.__ui=()=>mpUI;this.__hand=()=>mpHand;this.__ww=()=>wwUI;this.__ad=()=>adUI;",ctx);
  return {c:ctx,items,writes,said,els,timers,toasts};
}
const hub=S=>S.els["ad-hand"]?S.els["ad-hand"].innerHTML:"";
const by=(S,id)=>S.items.find(i=>i.id===id);
const ids=L=>L.map(x=>x.kind+":"+x.id).join(",");
// one word worked right in the Workout: look → cover → copy → now from memory → typed right
function workWord(S,typed){
  const c=S.c, U=c.__ww(), it=c.wwList("kid1")[U.i], w=c.wwWord(it);
  c.wwCopyHide(); S.els["ww-copy-in"]={value:w}; c.wwCopyCheck(); c.wwCopyDone();
  S.els["ww-in"]={value:typed==null?w:typed}; c.wwCheck(); return it;
}
// the practice round, every tap right on the first try
function playRound(S){
  const c=S.c; let n=0;
  while(c.__ui()&&c.__ui().phase==="play"&&n++<60){ const U=c.__ui(); c.mpTap(U.cur.tiles.indexOf(U.cur.pid)); c.mpNext(); }
}

console.log("── entry rules, unchanged per kind (the old tests' fixtures) ──");
{
  const S=sandbox({words:[{p:"together"}]}), c=S.c, it=by(S,"w_together");
  c.wwNote(it,"miss","2026-11-02");
  ok("a word missed on one day is not in yet",!(it.ww&&it.ww.on)&&c.adList("kid1").length===0);
  c.wwNote(it,"miss","2026-11-03");
  ok("missed on a 2nd day → in the Word Workout → on the one list as a word",it.ww.on===true&&ids(c.adList("kid1"))==="word:w_together");
}
{
  const S=sandbox({words:[{p:"been"}]}), c=S.c, it=by(S,"w_been");
  c.wwNote(it,"miss",undefined,true);
  ok("a 🚩 / graded test ✗ is in right away (WWV2), on the list",it.ww.on===true&&c.adCount("kid1")===1);
}
{
  const S=sandbox(), c=S.c, touched=[];
  c.mpAfterDrill("kid1",S.items,[{id:"k_A"},{id:"k_B"},{id:"k_C"}],{k_A:"m",k_B:"~",k_C:"c"},touched);
  ok("drill ✗ and ~ (close cards join) → the games list → on the one list as cards",c.adList("kid1").map(x=>x.kind+":"+x.id).sort().join(",")==="card:k_A,card:k_B",ids(c.adList("kid1")));
  ok("…written by the drill's own save (touched), not by the list",touched.length===2&&S.writes.length===0);
}
{
  const S=sandbox({settings:{missPlay:{on:true,close:false}}}), c=S.c;
  c.mpAfterDrill("kid1",S.items,[{id:"k_A"},{id:"k_B"}],{k_A:"m",k_B:"~"},[]);
  ok("close cards off → only the ✗ joins",ids(c.adList("kid1"))==="card:k_A");
}
{
  const S=sandbox({settings:{},words:[{p:"they",x:{ww:{m:2,on:true,r:[]}}}]}), c=S.c;
  c.mpAfterDrill("kid1",S.items,[{id:"k_A"}],{k_A:"m"},[]);
  ok("games switch off → no card joins; the Word Workout word is still on the list",!by(S,"k_A").gp&&ids(c.adList("kid1"))==="word:w_they");
}
{
  const S=sandbox(), c=S.c;
  c.mpAfterStudy("kid1",S.items,{cards:{a:{id:"k_D",misses:2},b:{id:"k_E",misses:1}}},[]);
  ok("study misses (2+ in a sitting) still join; 1 doesn't",!!(by(S,"k_D").gp&&by(S,"k_D").gp.on)&&!by(S,"k_E").gp&&ids(c.adList("kid1"))==="card:k_D");
}

console.log("── the one list: today only, no duplicates ──");
{
  const S=sandbox({flag:["k_A","k_B"],words:[{p:"they",x:{ww:{m:2,on:true,r:[]}}},{p:"were",x:{ww:{m:2,on:true,r:[]}}},{p:"jump"}]}), c=S.c;
  ok("words first, then cards (the games come last)",ids(c.adList("kid1"))==="word:w_they,word:w_were,card:k_A,card:k_B",ids(c.adList("kid1")));
  by(S,"w_were").ww.r=[c.wwToday()];
  ok("a word already right today is not counted",ids(c.adList("kid1"))==="word:w_they,card:k_A,card:k_B");
  by(S,"k_B").gp.days=[5];
  ok("a card already right today is not counted",ids(c.adList("kid1"))==="word:w_they,card:k_A");
}
{
  const S=sandbox({words:[{p:"they",x:{ww:{m:2,on:true,r:[]}}},{p:"said",x:{ww:{m:2,on:true,r:[]}}}]}), c=S.c;
  by(S,"w_said").gp={on:true,since:"20261101",need:3,days:[],m:0};   // a spelling word on BOTH lists
  const L=c.adList("kid1"), n=L.filter(x=>x.id==="w_said").length;
  ok("a word that is also a games card is listed ONCE, as a card",n===1&&L.find(x=>x.id==="w_said").kind==="card",ids(L));
  ok("the count matches the list",c.adCount("kid1")===2);
  ok("no id twice in the list",new Set(L.map(x=>x.id)).size===L.length);
}

console.log("── the hand-off after the drill ──");
{
  const S=sandbox(), c=S.c;
  ok("a clean drill (nothing on either list) → no hand-off, Scores as always",c.adAfterDrillSaved("kid1")===false&&!S.els["ad-hand"]&&!S.els["mp-hand"]);
}
{
  const S=sandbox({words:[{p:"they",x:{ww:{m:2,on:true,r:[]}}}]}), c=S.c;
  by(S,"w_they").ww.r=[c.wwToday()];
  ok("a clean drill that already proved the workout word today → no hand-off",c.adAfterDrillSaved("kid1")===false&&!S.els["ad-hand"]);
}
{
  const S=sandbox({flag:["k_A"],words:[{p:"they",x:{ww:{m:2,on:true,r:[]}}},{p:"were",x:{ww:{m:2,on:true,r:[]}}}]}), c=S.c;
  ok("a drill with items → the hand-off",c.adAfterDrillSaved("kid1")===true&&!!S.els["ad-hand"]);
  const h=hub(S);
  ok("'Let's work out the ones we missed!' · the kid · 2 words · 1 card · Start · Not now",h.indexOf("work out the ones we missed")>=0&&h.indexOf("KID1")>=0&&h.indexOf("2 words to work out")>=0&&h.indexOf("1 card to play")>=0&&/adStart\(\)/.test(h)&&/adNotNow\(\)/.test(h));
  ok("the hub never shows the words themselves",h.indexOf("they")<0&&h.indexOf("were")<0);
  ok("one hand-off: DRILLEND's own screen did not open too",!S.els["mp-hand"]&&!c.__hand());
  ok("nothing written, nothing said yet",S.writes.length===0&&S.said.length===0);
  c.adNotNow();
  ok("Not now closes it; the list stays for the Day line",!S.els["ad-hand"]&&c.__ad()===null&&c.adCount("kid1")===3);
}

console.log("── one flow: the words in the Workout, then Watch it → the round ──");
{
  const S=sandbox({flag:["k_A"],words:[{p:"they",x:{ww:{m:2,on:true,r:[]}}},{p:"said",x:{ww:{m:2,on:true,r:[]}}}]}), c=S.c;
  by(S,"w_said").gp={on:true,since:"20261101",need:3,days:[],m:0};   // on both lists → a card here, not a Workout word
  c.adAfterDrillSaved("kid1"); c.adStart();
  const U=c.__ww();
  ok("Start → the hub steps aside and the Word Workout opens",!S.els["ad-hand"]&&!!S.els["ww-panel"]&&!!U);
  ok("…on the Workout's own first step, 👀 See it, copy it",U.step==="look"&&/See it, copy it/.test(S.els["ww-panel"].innerHTML));
  ok("…on this sitting's word only (the both-lists word is the games')",c.wwList("kid1")[U.i].id==="w_they"&&U.skip.w_said===1&&/Word 1 of 1 /.test(S.els["ww-panel"].innerHTML));
  const it=workWord(S);
  ok("the word's exit rule is the Workout's own: a right day, saved to mastery/<kid>/<ix>/ww",it.ww.r.indexOf(c.wwToday())>=0&&S.writes.length===1&&S.writes[0][0]==="set"&&/^mastery\/kid1\/\d+\/ww$/.test(S.writes[0][1]));
  ok("one button: All done ✓ (nothing left this sitting)",/wwFinish\(\)/.test(S.els["ww-panel"].innerHTML));
  c.wwFinish();
  ok("mid-flow there's no 'come back tomorrow' toast",S.toasts.length===0);
  ok("→ the cards: DRILLEND's 👀 Watch it, both cards (the both-lists word too)",!!c.__hand()&&c.__hand().step==="watch"&&c.__hand().list.slice().sort().join(",")==="k_A,w_said",c.__hand()&&c.__hand().list);
  c.mpWatchNext(); c.mpWatchNext();
  ok("watched them all → the round, from:'drill' (as DRILLEND)",!!c.__ui()&&c.__ui().from==="drill"&&!c.__hand());
}
{
  const S=sandbox({flag:["k_A","k_B"],words:[{p:"they",x:{ww:{m:2,on:true,r:[]}}}]}), c=S.c;
  c.adAfterDrillSaved("kid1"); c.adStart(); workWord(S); c.wwFinish();
  c.mpWatchNext(); c.mpWatchNext(); playRound(S);
  ok("the round plays to its end screen",c.__ui()&&c.__ui().phase==="done");
  const before=S.writes.length;
  const upd=S.writes.filter(w=>w[0]==="update"&&w[1]==="mastery/kid1"), push=S.writes.filter(w=>w[0]==="push");
  ok("logging unchanged: the round's ONE update on mastery/<kid> + ONE gameLog entry (game:'practice', from:'drill')",upd.length===1&&push.length===1&&/^mastery\/gameLog\/kid1\//.test(push[0][1])&&push[0][2].game==="practice"&&push[0][2].from==="drill");
  ok("the card's exit rule is the round's own: right first tap 3× → a right day",by(S,"k_A").gp.days.indexOf(5)>=0&&by(S,"k_A").gp.on===true);
  c.mpClose();
  ok("All done → the flow ends: no hub, one '⭐ All worked out' toast, nothing more written",!S.els["ad-hand"]&&c.__ad()===null&&S.toasts.length===1&&/All worked out/.test(S.toasts[0])&&S.writes.length===before);
  ok("nothing left today → the Day line hides",c.adDayLineHtml("kid1","Wed")==="");
}
{
  const S=sandbox({words:[{p:"they",x:{ww:{m:2,on:true,r:["2026-11-01","2026-11-02"]}}}]}), c=S.c;
  c.adAfterDrillSaved("kid1"); c.adStart(); const it=workWord(S);
  ok("exit rule unchanged: the 3rd right day takes the word out of the Workout",it.ww.on===false&&!!it.ww.out);
}
{
  const S=sandbox({flag:["k_A"]}), c=S.c; by(S,"k_A").gp.days=[3,4]; by(S,"k_A").gp.need=1;
  c.adAfterDrillSaved("kid1"); c.adStart();
  ok("no words → straight to Watch it",!S.els["ww-panel"]&&c.__hand()&&c.__hand().step==="watch");
  c.mpWatchNext(); playRound(S);
  ok("exit rule unchanged: the 3rd right day sends the card back to Mom's next drill",by(S,"k_A").gp.on===false&&by(S,"k_A").next_due===5);
}

console.log("── closing a part early comes back to the hand-off ──");
{
  const S=sandbox({flag:["k_A"],words:[{p:"they",x:{ww:{m:2,on:true,r:[]}}},{p:"were",x:{ww:{m:2,on:true,r:[]}}}]}), c=S.c;
  c.adAfterDrillSaved("kid1"); c.adStart(); workWord(S); c.wwClose();
  const h=hub(S);
  ok("✕ in the Workout with a word left → the hub: Keep going, 1 word, 1 card",!!S.els["ad-hand"]&&/Keep going/.test(h)&&h.indexOf("1 word to work out")>=0&&h.indexOf("1 card to play")>=0);
  c.adStart();
  ok("Keep going → the Workout on the word that's left",!!c.__ww()&&c.wwList("kid1")[c.__ww().i].id==="w_were");
  c.wwCopyHide(); S.els["ww-copy-in"]={value:"were"}; c.wwCopyCheck(); c.wwCopyDone();
  S.els["ww-in"]={value:"wre"}; c.wwCheck(); S.els["ww-in"]={value:"wer"}; c.wwCheck();
  ok("missed twice → 'try it again tomorrow' (the answer never shown)",/again tomorrow/i.test(S.els["ww-panel"].innerHTML));
  c.wwFinish();
  ok("a word worked this sitting doesn't come back in it → on to the cards",!!c.__hand()&&c.__hand().step==="watch");
  c.mpWatchNext(); const U=c.__ui(); c.mpTap(U.cur.tiles.indexOf(U.cur.pid)); c.mpClose();
  ok("✕ mid-round → the hub again with the card",!!S.els["ad-hand"]&&hub(S).indexOf("1 card to play")>=0&&hub(S).indexOf("word")<0);
  ok("…and the part-way round saved what it earned (its own update + entry)",S.writes.some(w=>w[0]==="update"&&w[1]==="mastery/kid1")&&S.writes.some(w=>w[0]==="push"));
}

console.log("── the Day page: one 'After the drill · N' line ──");
{
  const S=sandbox({flag:["k_A"],words:[{p:"they",x:{ww:{m:2,on:true,r:[]}}}]}), c=S.c;
  const h=c.adDayLineHtml("kid1","Wed");
  ok("today: '✅ After the drill · 2', opens the same hand-off",/After the drill · 2</.test(h)&&/onclick="adOpen\('kid1'\)"/.test(h));
  ok("not on another day's page",c.adDayLineHtml("kid1","Thu")==="");
  ok("not on Mom's or the all-kids view",c.adDayLineHtml("mom","Wed")===""&&c.adDayLineHtml("all","Wed")==="");
  ok("drawing it writes nothing",S.writes.length===0);
  c.adOpen("kid1");
  ok("tapping it opens the hand-off",!!S.els["ad-hand"]&&/work out the ones we missed/.test(hub(S)));
  c.adStart(); workWord(S); c.wwFinish();
  ok("from the Day line the cards open the round directly, no 'from' (as the 🎮 chip did)",!c.__hand()&&!!c.__ui()&&c.__ui().from===null);
  playRound(S); c.mpClose();
  const push=S.writes.filter(w=>w[0]==="push");
  ok("…so its gameLog entry reads as before (no from)",push.length===1&&push[0][2].game==="practice"&&!("from" in push[0][2]));
}
{ const S=sandbox({offDay:true,flag:["k_A"]}); ok("nothing on the kid's own day off",S.c.adDayLineHtml("kid1","Wed")===""); }
{ const S=sandbox(); ok("nothing when the list is empty",S.c.adDayLineHtml("kid1","Wed")===""&&S.c.adOpen("kid1")===false&&!S.els["ad-hand"]); }

console.log("\n"+pass+" passed, "+fail+" failed");
process.exit(fail?1:0);
