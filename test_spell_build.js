/*
 * 🔤 Build it — letter tiles for the kid's learning spelling words (her "start the other 2", 2026-11-02; step 3 of the
 * game-flag plan). The kid hears the word (never spelled, never shown), builds it from its letters + a few extras, Check.
 * Right first try = a Word Workout right day; wrong twice = a miss day; the word comes back once at the end of the round.
 * In 🎮 Games, and inside the practice round (MISSPLAY) for a flagged spelling card. Runs the REAL code.
 *   run:  node test_spell_build.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
let pass=0, fail=0;
function ok(n,c,x){ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":""));} }
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("markers "+a); return src.slice(i,j); };
function fnText(name){ const i=src.indexOf("function "+name+"("); if(i<0) return ""; const j=src.indexOf("\nfunction ",i+10); return src.slice(i,j<0?undefined:j); }
const seeded=seed=>{ let x=seed||7; return ()=>{ x=(x*1103515245+12345)&0x7fffffff; return (x%10000)/10000; }; };

// ── by text ──
const a=src.indexOf("// SPELLBUILD_START"), b=src.indexOf("// SPELLBUILD_END"), ww=src.indexOf("// WORDWORKOUT_END");
ok("SPELLBUILD block sits right after WORDWORKOUT_END",ww>0&&a>ww&&b>a&&src.slice(ww,a).trim()==="// WORDWORKOUT_END");
const blk=src.slice(a,b);
ok("no kid's name in the block",!/lincoln|ellis|lucy|julian|caleb|taylor|makenzie|kenzie|andrew/i.test(blk));
ok("the word is never written on screen (board / finish never print t.word)",!/E\(t\.word\)|\+t\.word\+|esc\(t\.word\)|E\(x\.word\)|\+x\.word\+/.test(blk));
ok("the word is said with the slow spelling voice, never spelled",/mastSpeak\(t\.word,\{spell:true\}\)/.test(blk)&&!/spellOut|\.split\(""\)\.join\(" "\)/.test(blk));
ok("writes: ww via the Workout's own path, match_best one key, gameLog via gameLogRound — all guarded",/_wwWriteCard\(st\.kid,it\)/.test(blk)&&/db&&!_dryRun\(\)\) db\.ref\("mastery\/"\+kid\+"_settings\/match_best"\)\.update\(\{\[key\]:st\.first\}\)/.test(blk)&&/gameLogRound\(st\)/.test(blk)&&!/\.set\(|\.remove\(/.test(blk.replace(/_wwWriteCard/g,"")));
ok("GAMES_LIST has Build it (view spell, available only with a learning word)",/\{key:"spell",\s*emoji:"\\u\{1F524\}", label:"Build it",\s*view:"spell",\s*available:k=>typeof spellPool==="function"&&spellPool\(_gamesItems\(k\)\)\.length>0, render:c=>buildSpellHtml\(c\)\}/.test(src));
ok("gamesCurrentKey knows the spell view",/if\(mastView==="spell"\) return "spell";/.test(fnText("gamesCurrentKey")));
ok("gameLogEntry names the round's own game (Which one? stays \"which\")",/game:st\.game\|\|"which"/.test(fnText("gameLogEntry"))&&/if\(t\.fail\) o\.fail=true;/.test(fnText("gameLogEntry")));
ok("GAMEKID parks and restores the Build it round",/spell:\(typeof spellState!=="undefined"\)\?spellState:null/.test(fnText("gameKidSwitch"))&&/spellState=\(p&&p\.spell\)\|\|null/.test(fnText("gameKidSwitch"))&&/spellFinish\(sp\)/.test(fnText("_gkResume")));
ok("the practice round's pool takes spelling cards (guarded, so the drill sandbox is unchanged)",/typeof spellPlayable==="function"\)\?w\.concat/.test(fnText("_mpPool")));
ok("mpTurn builds a spell turn; mpFinish writes ww beside gp",/mode:"spell",tiles:t\.tiles,word:t\.word,placed:\[\]/.test(fnText("mpTurn"))&&/upd\[k\+"\/ww"\]=it\.ww\|\|null;/.test(fnText("mpFinish")));
ok("the round's end never shows a spelling word (a 🔤 face instead)",/spellPlayable\(it\)\)\?'\\u\{1F524\}'/.test(fnText("mpRender")));

// ── a sandbox: WORDWORKOUT + SPELLBUILD + GAMELOG, a kid's cards, a recording db ──
const W=(w,extra)=>Object.assign({id:"k_"+w,subject:"AAS Words",prompt:w,status:"introduction",tier:"daily"},extra||{});
function world(items,o){
  o=o||{};
  const writes=[], said=[], dings=[], CODE=cut("// WORDWORKOUT_START","// WORDWORKOUT_END")+"\n"+cut("// SPELLBUILD_START","// SPELLBUILD_END")+"\n"+cut("// GAMELOG_START","// GAMELOG_END");
  const ctx={console,JSON,Object,Array,String,Number,Math,Set,Map,RegExp,Date,parseInt,isNaN,setTimeout:()=>0,
    document:{getElementById:()=>null,createElement:()=>({style:{}}),body:{appendChild(){}}},
    momHere:()=>true,_dryRun:()=>!!o.dry,HA_LS:{setItem(){}},gwShowToast(){},_mastRe(){},mastGetPrintNum:()=>1,bbAudioUnlock(){},
    mastSpeak:(t,op)=>said.push([t,op]),matchDing:()=>dings.push("ding"),matchBonk:()=>dings.push("bonk"),_showCelebration(){},
    mstTodayKey:()=>"20261102",mastView:"spell",masteryKid:"k",
    masteryData:{k:items||[],k_settings:o.settings||{},k_custom_items:[]},
    db:{ref:p=>({set:v=>writes.push(["set",p,v]),update:v=>writes.push(["update",p,v]),push:v=>writes.push(["push",p,v])})}};
  vm.createContext(ctx);
  vm.runInContext(CODE+"\nObject.defineProperty(this,'spellState',{get:()=>spellState,set:v=>{spellState=v;}}); Object.defineProperty(this,'wwUI',{get:()=>wwUI,set:v=>{wwUI=v;}}); this.SPELL_EXTRA=SPELL_EXTRA; this.SPELL_FILL=SPELL_FILL;",ctx);
  return {c:ctx,writes,said,dings};
}
// build the current turn's word (or a wrong string) by tapping tiles, then Check
function build(c,str){
  const st=c.spellState, t=st.turns[st.i];
  for(const ch of str){ const ti=t.tiles.findIndex(x=>!x.used&&x.ch===ch); if(ti<0) throw new Error("no tile "+ch+" for "+t.word); c.spellTapTile(ti); }
  c.spellCheck();
}
const settle=c=>{ const st=c.spellState; if(st&&st.lock) c.spellNext(st); };

console.log("── the tiles (pure) ──");
{
  const {c}=world();
  const t=c.spellTiles("red",["men","leg","mix"],seeded(3));
  const chs=t.map(x=>x.ch);
  ok("every letter of the word is a tile, plus SPELL_EXTRA extras",t.length===3+c.SPELL_EXTRA&&["r","e","d"].every(l=>chs.indexOf(l)>=0));
  ok("the extras come from the other words and are not letters of the word",chs.filter(x=>"red".indexOf(x)<0).every(x=>"menlegmix".indexOf(x)>=0)&&chs.filter(x=>"red".indexOf(x)<0).length===c.SPELL_EXTRA);
  ok("tiles start unused",t.every(x=>x.used===false));
  const t2=c.spellTiles("Frank",[],seeded(5)), chs2=t2.map(x=>x.ch);
  ok("no other words: fill letters; a capital stays a capital",chs2.indexOf("F")>=0&&t2.length===5+c.SPELL_EXTRA&&chs2.filter(x=>"Frank".indexOf(x)<0).every(x=>c.SPELL_FILL.indexOf(x)>=0));
  const t3=c.spellTiles("letter",["tree"],seeded(1));
  ok("a double letter gets two tiles",t3.filter(x=>x.ch==="t").length===2&&t3.filter(x=>x.ch==="e").length===2);
  const tt={word:"red",tiles:[{ch:"d"},{ch:"e"},{ch:"r"},{ch:"m"}],placed:[2,1,0],wrong:{},tries:0};
  ok("spellBuilt / spellRight compare the built string to the word",c.spellBuilt(tt)==="red"&&c.spellRight(tt)===true);
  tt.placed=[2,1,3]; ok("a wrong letter is wrong",c.spellRight(tt)===false);
}
console.log("── one Check (pure spellJudge) ──");
{
  const {c}=world();
  const mk=()=>({word:"red",tiles:[{ch:"d",used:true},{ch:"e",used:true},{ch:"r",used:true},{ch:"m",used:false}],placed:[2,1,0],wrong:{},tries:0,done:false,first:false,fail:false});
  let t=mk(); ok("right first try → done, first",c.spellJudge(t)==="right"&&t.done&&t.first===true);
  t=mk(); t.placed=[2,1,3]; t.tiles[0].used=false; t.tiles[3].used=true; const r1=c.spellJudge(t);
  ok("wrong once → again; the tiles come back",r1==="again"&&!t.done&&t.tries===1&&t.placed.length===0&&t.tiles.every(x=>!x.used));
  t.placed=[2,1,0]; t.tiles.forEach((x,i)=>{ x.used=i<3; }); ok("right on the second try → done, not first",c.spellJudge(t)==="right"&&t.done&&t.first===false);
  t=mk(); t.placed=[2,1,3]; t.tiles[0].used=false; t.tiles[3].used=true; c.spellJudge(t); t.placed=[0,1,2]; t.tiles.forEach((x,i)=>{ x.used=i<3; }); const r2=c.spellJudge(t);
  ok("wrong twice → fail: done, not first, flagged",r2==="fail"&&t.done&&t.first===false&&t.fail===true&&Object.keys(t.wrong).length===2);
}
console.log("── the pool: learning words only, buildable words only ──");
{
  const items=[W("red",{ww:{m:1,d:"2026-10-15"}}),W("men",{ww:{m:1,d:"2026-10-16"}}),W("leg"),W("mix",{status:"active"}),W("they",{status:"active",ww:{m:2,d:"2026-10-20",on:true,since:"2026-10-20",r:[]}}),
    W("extraordinarily"),W("Mr.",{prompt:"Mr․"}),W("a"),W("can't"),{id:"m1",subject:"Math Facts",prompt:"7×8",answer:"56",status:"introduction"},W("gone",{status:"mastered"})];
  const {c}=world(items); const P=c.spellPool(items).map(c.spellWordOf);
  ok("introduction words and Workout words are in; a known active word, a mastered one and Math are out",P.indexOf("red")>=0&&P.indexOf("men")>=0&&P.indexOf("leg")>=0&&P.indexOf("they")>=0&&P.indexOf("mix")<0&&P.indexOf("gone")<0&&P.indexOf("7×8")<0);
  ok("too long, a period, one letter stay out; an apostrophe is fine",P.indexOf("extraordinarily")<0&&P.indexOf("Mr.")<0&&P.indexOf("a")<0&&P.indexOf("can't")>=0);
  ok("most-recently-missed first",P[0]==="they"&&P[1]==="men"&&P[2]==="red");
  ok("spellPlayable (the practice round's door) takes any active or introduction spelling word that builds",c.spellPlayable(items[3])===true&&c.spellPlayable(items[9])===false&&c.spellPlayable(items[10])===false);
}
console.log("── a round in 🎮 Games: right, wrong-then-right, wrong twice, the comeback, the saves ──");
{
  const items=[W("red",{ww:{m:1,d:"2026-10-15"}}),W("men",{ww:{m:1,d:"2026-10-16"}}),W("they",{status:"active",ww:{m:2,d:"2026-10-20",on:true,since:"2026-10-20",r:[]}})];
  const {c,writes,said,dings}=world(items);
  c.spellStart(); const st=c.spellState;
  ok("a round: the 3 learning words, most-recently-missed first, the first word said with the spelling voice",st&&st.phase==="play"&&st.of===3&&st.turns.map(t=>t.word).join(",")==="they,men,red"&&said.length===1&&said[0][0]==="they"&&said[0][1].spell===true);
  ok("the deck name is the one deck; game is spell",st.deck==="AAS Words"&&st.game==="spell");
  build(c,"they");
  ok("right first try: ding, first 1, locked for the beat",dings[dings.length-1]==="ding"&&st.first===1&&st.lock===true&&st.msg==="right");
  ok("a Workout word right on the first try = a right DAY, written on the Workout's own path",items[2].ww.r.length===1&&writes.some(w=>w[0]==="set"&&w[1]==="mastery/k/2/ww"&&w[2].r.length===1));
  settle(c);
  ok("next word said",st.i===1&&said[said.length-1][0]==="men");
  build(c,"mne");
  ok("wrong once: bonk, said again, not advanced, tiles back",dings[dings.length-1]==="bonk"&&st.i===1&&st.msg==="again"&&said[said.length-1][0]==="men"&&st.turns[1].placed.length===0);
  build(c,"men");
  ok("right on the second try: counts as done, not first; comes back once at the end",st.turns[1].done&&!st.turns[1].first&&st.turns.length===4&&st.turns[3].back===true&&st.turns[3].word==="men");
  ok("a second-try right is neither a right day nor a miss day",!items[1].ww.on&&items[1].ww.m===1);
  settle(c);
  const wBefore=writes.length;
  build(c,"rde"); build(c,"der");
  ok("wrong twice: fail, moves on, comes back at the end",st.turns[2].fail===true&&st.turns[2].done&&st.msg==="fail"&&st.turns.length===5&&st.turns[4].word==="red"&&st.turns[4].back===true);
  ok("wrong twice = a miss DAY: red now has 2 miss days → Workout on (one targeted ww write)",items[0].ww.m===2&&items[0].ww.on===true&&writes.length===wBefore+1&&writes[wBefore][1]==="mastery/k/0/ww");
  settle(c);
  build(c,"men"); settle(c);
  ok("the comeback turn counts nothing extra",st.first===1&&items[1].ww.m===1);
  build(c,"red"); settle(c);
  ok("round done: 1 of 3 on the first try, best saved for the deck",st.phase==="done"&&st.first===1&&st.isPB===true&&c.masteryData.k_settings.match_best["AAS Words · spell"]===1&&writes.some(w=>w[0]==="update"&&w[1]==="mastery/k_settings/match_best"));
  const lg=writes.find(w=>w[0]==="push"&&w[1]==="mastery/gameLog/k/20261102");
  ok("the round's gameLog entry: game spell, every word with ok / n / back / fail",!!lg&&lg[2].game==="spell"&&lg[2].items.length===5&&lg[2].items[0].ok===true&&lg[2].items[1].ok===false&&lg[2].items[1].n===2&&lg[2].items[2].fail===true&&lg[2].items[3].back===true);
  ok("the comeback turns are inert for the Workout (no extra ww writes)",writes.filter(w=>w[1].endsWith("/ww")).length===2);
  const h=c.buildSpellHtml("#000");
  ok("the finish screen never prints a word",h.indexOf("they")<0&&h.indexOf("men")<0&&h.indexOf("red")<0&&h.indexOf("1 of 3 on the first try")>=0);
}
console.log("── the screen ──");
{
  const items=[W("red"),W("men"),W("leg")];
  const {c}=world(items);
  ok("before a round: the Build it button and the count",/spellStart\(\)/.test(c.buildSpellHtml("#000"))&&c.buildSpellHtml("#000").indexOf("3 words to practice")>=0);
  c.spellStart(); const st=c.spellState, t=st.turns[0];
  const h=c.buildSpellHtml("#000");
  ok("during a turn: one slot per letter, every tile, Check disabled until the row is full, the word not written",(h.match(/class="spell-slot"/g)||[]).length===t.word.length&&(h.match(/spellTapTile\(/g)||[]).length===t.tiles.length&&/spellCheck\(\)" disabled/.test(h)&&h.indexOf(">"+t.word+"<")<0);
  c.spellTapTile(t.tiles.findIndex(x=>x.ch===t.word[0]));
  const h2=c.buildSpellHtml("#000");
  ok("a placed tile shows in the row and can be taken back",/spellTapPlaced\(0\)/.test(h2)&&(h2.match(/class="spell-slot"/g)||[]).length===t.word.length-1&&/spell-used/.test(h2));
  c.spellTapPlaced(0); ok("taken back: the tile is free again",t.placed.length===0&&t.tiles.every(x=>!x.used));
  const {c:c2}=world([]); ok("no learning words: a kind note, no button",c2.buildSpellHtml("#000").indexOf("No spelling words to build")>=0&&!/spellStart\(\)/.test(c2.buildSpellHtml("#000")));
}
console.log("── dry run writes nothing ──");
{
  const items=[W("they",{status:"active",ww:{m:2,d:"2026-10-20",on:true,since:"2026-10-20",r:[]}})];
  const {c,writes}=world(items,{dry:true});
  c.spellStart(); build(c,"they"); settle(c);
  ok("ww changed in memory, best set in memory, nothing on the db",items[0].ww.r.length===1&&c.spellState.phase==="done"&&c.masteryData.k_settings.match_best["AAS Words · spell"]===1&&writes.length===0);
}

// ── the practice round (MISSPLAY) with a flagged spelling card ──
function round(o){
  o=o||{};
  const CODE=cut("// WHICHONE_START","// MISSPLAY_END")+"\n"+cut("// WORDWORKOUT_START","// WORDWORKOUT_END")+"\n"+cut("// SPELLBUILD_START","// SPELLBUILD_END");
  const LET="ABCDEFGHIJ".split("");
  const items=LET.map((p,i)=>({id:"k_"+p,subject:"Letters",prompt:p,status:"active",tier:i<3?"every_other_day":"weekly",cycle:1,next_due:40}))
    .concat([W("they",{status:"active",tier:"weekly",ww:{m:2,d:"2026-10-20",on:true,since:"2026-10-20",r:[]},gp:{on:true,since:"20261101",need:3,days:[],m:0}}),W("red",{tier:"weekly",status:"active"}),W("men",{tier:"weekly",status:"active"}),W("leg")]);
  const writes=[], said=[];
  const md={kid1:items,kid1_settings:{missPlay:{on:true}},history:{}};
  const ctx={console,Math,Object,Array,String,JSON,Number,Set,Date,RegExp,parseInt,isNaN,setTimeout:()=>0,
    masteryKid:"kid1",masteryData:md,
    _smTileVis:it=>(it&&it.subject==="Letters"?'<b>'+it.prompt+'</b>':null),
    _matchPlain:h=>String(h||"").replace(/<[^>]*>/g," ").trim(),esc:s=>String(s||""),
    mastSpeak:(t,op)=>said.push([t,op]),matchDing(){},matchBonk(){},_mastRe(){},_dryRun:()=>false,
    db:{ref:p=>({set:v=>writes.push(["set",p,v]),update:v=>writes.push(["update",p,v]),push:v=>writes.push(["push",p,v])})},
    HA_LS:{setItem(){}},bbAudioUnlock(){},renderAll(){},momHere:()=>true,mastAdminPinOk:false,gwShowToast(){},mastGetPrintNum:()=>1,
    mastSchoolDayNum:()=>5,mstTodayKey:()=>"20261102",
    document:{getElementById:()=>null,createElement:()=>({style:{},remove(){}}),body:{appendChild(){}}},cap:s=>s};
  vm.createContext(ctx);
  vm.runInContext(CODE+"\n;this.__ui=()=>mpUI;Object.defineProperty(this,'wwUI',{get:()=>wwUI,set:v=>{wwUI=v;}}); this.WHICH_MIX=WHICH_MIX;",ctx);
  return {c:ctx,items,writes,said};
}
const mpBuild=(c,str)=>{ const U=c.__ui(), t=U.cur; for(const ch of str){ const ti=t.tiles.findIndex(x=>!x.used&&x.ch===ch); if(ti<0) throw new Error("no tile "+ch); c.mpSpellTapTile(ti); } c.mpSpellCheck(); };
console.log("── the practice round: a flagged spelling word builds its word ──");
{
  const {c,items,writes,said}=round();
  const they=items.find(i=>i.id==="k_they");
  ok("a flagged spelling card is on today's list (the Day-page chip counts it)",c.mpTodayList("kid1").some(i=>i.id==="k_they"));
  ok("it still can't play Which one? (spelling stays out there)",c.whichPool(items,c.WHICH_MIX,"kid1").every(i=>i.id!=="k_they"));
  c.mpOpen("kid1"); const U=c.__ui();
  ok("the round opens on it as a spell turn, said with the spelling voice",U&&U.phase==="play"&&U.cur&&U.cur.mode==="spell"&&U.cur.word==="they"&&said[0][0]==="they"&&said[0][1].spell===true);
  ok("known words from its deck sit between (weekly spelling words)",U.q.some(e=>!e.list&&["k_red","k_men"].indexOf(e.pid)>=0));
  mpBuild(c,"thye");
  ok("wrong once: try again, same turn",U.cur.msg==="again"&&U.cur.tries===1&&U.cur.placed.length===0);
  mpBuild(c,"they");
  ok("right on the second try: logged not-ok, the card's right days start over (like a wrong tap)",U.log[0].ok===false&&U.log[0].n===2&&U.log[0].list===true&&they.gp.m===1&&they.gp.today.r===0);
  ok("the Workout notes nothing for a second-try right",they.ww.r.length===0&&!U.ww);
  c.mpNext();
  // play on until 'they' comes back (it comes back later in the round: other cards between)
  let guard=0; while(U.phase==="play"&&U.cur&&!(U.cur.pid==="k_they")&&guard++<30){ if(U.cur.mode==="spell") mpBuild(c,U.cur.word); else c.mpTap(U.cur.tiles.indexOf(U.cur.pid)); c.mpNext(); }
  ok("it comes back later in the round",U.phase==="play"&&U.cur&&U.cur.pid==="k_they"&&U.cur.mode==="spell");
  mpBuild(c,"they");
  ok("right first try: a right toward today AND a Workout right day, marked for the round's save",they.gp.today.r===1&&they.ww.r.length===1&&U.ww&&U.ww.k_they===1);
  c.mpNext();
  const R=c.mpFinish(U);
  const ix=items.indexOf(they);
  ok("the round's ONE save carries gp and ww for the card, on mastery/kid1",R.upd[ix+"/gp"]&&R.upd[ix+"/ww"]&&R.upd[ix+"/ww"].r.length===1&&writes.some(w=>w[0]==="update"&&w[1]==="mastery/kid1"&&w[2][ix+"/ww"]));
  ok("the round's log names the spell results",R.entry&&R.entry.game==="practice"&&R.entry.items.some(x=>x.id==="k_they"&&x.ok===true));
}
console.log("── the practice round: wrong twice ──");
{
  const {c,items}=round();
  const they=items.find(i=>i.id==="k_they");
  c.mpOpen("kid1"); const U=c.__ui();
  mpBuild(c,"thye"); mpBuild(c,"teyh");
  ok("fail: logged with fail, moves on, a Workout miss day",U.cur.msg==="fail"&&U.lock===true&&U.log[0].ok===false&&U.log[0].fail===true&&they.ww.m===3&&they.ww.d==="2026-11-02"&&U.ww.k_they===1);
}
console.log("── study misses: a spelling word wrong twice now joins (Build it can play it) ──");
{
  const {c,items}=round();
  const leg=items.find(i=>i.id==="k_leg"), touched=[];
  const state={passes:2,queue:[],cards:{x:{id:"k_leg",kind:"learning",first:"again",goods:2,done:true,misses:2}}};
  c.mpAfterStudy("kid1",items,state,touched);
  ok("the spelling card joins the list",leg.gp&&leg.gp.on===true&&touched.length===1);
}
console.log("── the drill sandbox without Build it: spelling still can't join (guarded) ──");
{
  const CODE=cut("// WHICHONE_START","// MISSPLAY_END");
  const ctx={console,Math,Object,Array,String,JSON,Number,Set,Date,setTimeout:()=>0,masteryKid:"kid1",
    masteryData:{kid1:[W("leg"),W("red"),W("men")],kid1_settings:{missPlay:{on:true}},history:{}},
    _smTileVis:()=>null,_matchPlain:h=>String(h||""),esc:s=>String(s||""),mastSpeak(){},matchDing(){},matchBonk(){},_mastRe(){},_dryRun:()=>false,db:null,
    HA_LS:{setItem(){}},bbAudioUnlock(){},renderAll(){},momHere:()=>true,mastAdminPinOk:false,mastSchoolDayNum:()=>5,mstTodayKey:()=>"20261102",
    document:{getElementById:()=>null,createElement:()=>({style:{}}),body:{appendChild(){}}},cap:s=>s};
  vm.createContext(ctx); vm.runInContext(CODE,ctx);
  const touched=[]; ctx.mpAfterDrill("kid1",ctx.masteryData.kid1,[{id:"k_leg"}],{k_leg:"m"},touched);
  ok("no Build it block → the pool is Which one?'s alone",touched.length===0&&ctx._mpPool("kid1",ctx.masteryData.kid1).length===0);
}

console.log("\n"+pass+" passed, "+fail+" failed");
process.exit(fail?1:0);
