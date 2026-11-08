/*
 * 📋 Name all N (her go via the hub 2026-11-03; PLAN_practice_games_2026-10-23.md Tier 4 "Name all N (Sporcle)"). A small list — a whole
 * small deck, or the cards of a deck that share one answer — N blank slots, a countdown, typed names fill the slots; time up / all named /
 * I'm done → the finish reveals the rest in grey. gameLogRound (game "nameall"); match_best "<list> · nameall" only when beaten; never the
 * ladder. Runs the REAL block (NAMEALL + BRAINDUMP's matcher + GAMELOG + GAMEGRID + the Study Session's normalizer + the roster level).
 *   run:  node test_nameall.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
let pass=0, fail=0;
function ok(n,c,x){ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":""));} }
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("markers "+a); return src.slice(i,j); };
function fnText(name){ const i=src.indexOf("function "+name+"("); if(i<0) return ""; const j=src.indexOf("\nfunction ",i+10); return src.slice(i,j<0?undefined:j); }

// ── by text ──
const a=src.indexOf("// NAMEALL_START"), b=src.indexOf("// NAMEALL_END"), sp=src.indexOf("// SPELLBUILD_END"), sc=src.indexOf("// STUDYCOUNTS_START");
ok("one NAMEALL block among the game blocks: after SPELLBUILD_END, before STUDYCOUNTS_START, straight after another block's _END line",sp>0&&a>sp&&b>a&&sc>b&&/^\/\/ [A-Z_]+_END$/m.test(src.slice(sp,a).trim().split("\n").pop()||"")&&src.indexOf("// NAMEALL_START",a+1)<0&&src.indexOf("// NAMEALL_END",b+1)<0);
ok("the games' own position tests still hold: nothing new between SPELLBUILD_END and GOFISH_START",!/\n(?!\/\/ (BRAINDUMP|BINGO|SORTIT|GOFISH)_)[^\n]*(_START|_END)/.test(src.slice(sp+18,src.indexOf("// GOFISH_START"))));
const blk=src.slice(a,b), code=blk.replace(/^\s*\/\/.*$/gm,"");
ok("no kid's name in the block",!/lincoln|ellis|lucy|julian|caleb|taylor|makenzie|kenzie|andrew/i.test(blk));
ok("no 🔀 anywhere in index.html",src.indexOf("\u{1F500}")<0);
ok("writes: match_best one key (guarded) + gameLogRound — nothing else, no set / remove / push of its own",/db&&!_dryRun\(\)\) db\.ref\("mastery\/"\+kid\+"_settings\/match_best"\)\.update\(\{\[(?:key|\(typeof haKey==="function"\?haKey\(key\):key\))\]:st\.count\}\)/.test(blk)&&/gameLogRound\(st\)/.test(blk)&&(code.match(/db\.ref\(/g)||[]).length===1&&!/\.set\(|\.remove\(|\.push\(\{|next_due|studyLog|consecutive_correct/.test(code.replace(/typed\.push|out\.push|cards\.push|\.push\(\{pid:i\.id/g,"")));
ok("GAMES_LIST: Name all right after Hangman, with park / restore / resume and decks for the grid",/resume:\(\)=>hangResume\(\), decks:k=>typeof hangDecks==="function"\?hangDecks\(_gamesItems\(k\),k\):\[\]\},[^\n]*\n  \{key:"nameall",\s*emoji:"\\u\{1F3C1\}", label:"Name all",\s*view:"nameall",\s*available:k=>typeof nameallAvail==="function"&&nameallAvail\(k\), render:c=>buildNameallHtml\(c\),\n\s*park:\(\)=>nameallPark\(\), restore:v=>\{ nameallRestore\(v\); \}, resume:\(\)=>nameallResume\(\), decks:k=>typeof nameallDecks==="function"\?nameallDecks\(_gamesItems\(k\),k\):\[\]\},/.test(src));
ok("gamesCurrentKey / GAMEKID untouched (the entry does it)",!/nameall/i.test(fnText("gamesCurrentKey"))&&!/nameallState|nameallResume/.test(cut("// GAMEKID_START","// GAMEKID_END")));
ok("the input never autocompletes / autocorrects (no hints while typing); no lives, no leaderboard, no points",/autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"/.test(blk)&&!/<datalist|list="/.test(blk)&&!/lives|hearts|leaderboard|bankDirect/i.test(code));
ok("the best key swaps Firebase's illegal characters (a category's back may carry a period)",/replace\(\/\[\.#\$\\\/\\\[\\\]\]\/g,"_"\)/.test(fnText("nameallBestKey")));
ok("the matcher is Brain Dump's (one normalizer across the two games)",/dumpMatch\(raw,st\.cards,st\.named\)/.test(code)&&/dumpNameable\(front\)/.test(code));

// ── a sandbox ──
const C=(deck,front,back,extra)=>Object.assign({id:(deck+"_"+front).replace(/\W+/g,"_"),subject:deck,prompt:front,answer:back,status:"active",tier:"weekly"},extra||{});
const GEO=["United Kingdom","France","Germany","Italy","Spain","Portugal","Greece"].map(n=>C("World Geography",n,n));
const ROOTS=[["geo","earth"],["chron","time"],["graph","write"],["scrib","write"],["script","write"],["bene","good"],["mal","bad"],["tele","far"],["micro","small"],["photo","light"],["bio","life"],["morph","form"],["phon","sound"],["hydro","water"],["aqua","water"],["therm","heat"],["dict","say"]].map(x=>C("Roots",x[0],x[1]));
const PUNCT=[["Abraham Lincoln was born in Kentucky.","Period \u2014 to end a sentence."],["We left early.","Period \u2014 to end a sentence."],["It rained.","Period \u2014 to end a sentence."]].map(x=>C("Punctuation",x[0],x[1]));
const FACTS=Array.from({length:6},(_,i)=>C("Math Facts",(i+2)+"\u00D77",String((i+2)*7)));
const SPELL=["ready","heavy","bread","steady","meadow","thread"].map(w=>C("AAS Words",w,w,{type:"spelling_word"}));
const LONG=["a","b","c","d","e"].map(n=>C("Long",n+"-word","a very long shared answer that goes on and on past forty letters"));
const DOTS=["cat","dog","cow","pig"].map(n=>C("Animals",n,"a pet. yes."));
function world(items,o){
  o=o||{};
  const writes=[], dings=[], timers=[], els={}; let iv=null;
  const CODE=cut("// WHICHONE_START","// WHICHONE_END")+"\n"+cut("// BRAINDUMP_START","// BRAINDUMP_END")+"\n"+cut("// GAMELOG_START","// GAMELOG_END")+"\n"+cut("// GAMEGRID_START","// GAMEGRID_END")+"\n"+cut("// NAMEALL_START","// NAMEALL_END")+"\n"+fnText("mstNormAns")+"\n"+fnText("mstTypedOk")+"\n"+fnText("dcLevel")+"\n"+fnText("mastGetDef");
  const ctx={console,JSON,Object,Array,String,Number,Math,Set,Map,RegExp,parseInt,isNaN,isFinite,clock:1000000,
    Date:{now:()=>ctx.clock},
    setTimeout:(f,ms)=>{ timers.push({f,ms}); return timers.length; },setInterval:(f,ms)=>{ iv={f,ms}; ctx._iv=iv; return 1; },clearInterval(){ iv=null; ctx._iv=null; },
    window:{_naTick:null,_dumpTick:null},document:{getElementById:id=>els[id]||null},els,
    _dryRun:()=>!!o.dry,HA_LS:{setItem(){}},_mastRe(){ ctx.renders=(ctx.renders||0)+1; },bbAudioUnlock(){},momHere:()=>true,renderAll(){},
    _gamesItems:k=>(k==="k"?items||[]:[]),
    _matchPlain:h=>String(h||"").replace(/<[^>]*>/g," ").replace(/\s+/g," ").trim(),
    _smTileVis:()=>null,esc:s=>String(s||"").replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;"),
    mastSpeak(){},matchDing:()=>dings.push("ding"),matchBonk:()=>dings.push("bonk"),_showCelebration:(k,t)=>{ ctx.celebrated=t; },
    mastKnowledgeType:it=>(it&&/math/i.test(it.subject||""))?"procedure_fluency":"fact_association",MAST_MATH_ANS:{},MAST_VOCAB_DEFS:{},
    ROSTER_DEF:o.roster||[{id:"k",grade:"6"},{id:"little",grade:"PreK"},{id:"early",grade:"1"},{id:"mid",grade:"4"}],
    mstTodayKey:()=>"20261103",mastView:o.view||"nameall",masteryKid:"k",
    masteryData:{k:items||[],k_settings:o.settings||{}},
    db:{ref:p=>({set:v=>writes.push(["set",p,v]),update:v=>writes.push(["update",p,v]),push:v=>writes.push(["push",p,v])})},timers};
  vm.createContext(ctx);
  vm.runInContext(CODE+"\nObject.defineProperty(this,'nameallState',{get:()=>nameallState,set:v=>{nameallState=v;}}); this.NA_MIN=NA_MIN; this.NA_MAX=NA_MAX; this.NA_PER=NA_PER; this.NA_SECS_MIN=NA_SECS_MIN;",ctx);
  const tick=()=>{ if(ctx._iv) ctx._iv.f(); };
  return {c:ctx,writes,dings,timers,els,tick};
}
const type=(w,text)=>{ w.els["na-in"]={value:text,focus(){}}; w.c.nameallAdd(); };

console.log("── which lists (pure) ──");
{ const w=world(GEO.concat(ROOTS,PUNCT,FACTS,SPELL,LONG,DOTS)), c=w.c;
  const L=c.nameallLists(c.masteryData.k,"k"), keys=L.map(l=>l.key);
  ok("a small deck (5–15 named cards) is a list; a 17-card deck is not (Brain Dump's size) — but its categories are",keys.indexOf("World Geography")>=0&&keys.indexOf("Roots")<0&&keys.indexOf("Roots \u00B7 write")>=0&&keys.indexOf("Roots \u00B7 water")<0,keys);
  ok("a category needs 3 cards sharing one back; its title names the deck and the back",L.find(l=>l.key==="Roots \u00B7 write").cards.length===3&&L.find(l=>l.key==="Roots \u00B7 write").title==="Name all 3 Roots cards that mean \u201Cwrite\u201D"&&L.find(l=>l.key==="Roots \u00B7 write").deck==="Roots");
  ok("sentences, math facts, spelling stay out; a 40+-letter back is no category (the 5-card deck itself still lists); a 4-card deck with a short shared back → the category only",keys.indexOf("Punctuation")<0&&keys.indexOf("Math Facts")<0&&keys.indexOf("AAS Words")<0&&keys.indexOf("Long")>=0&&!keys.some(k=>/^Long \u00B7/.test(k))&&keys.indexOf("Animals")<0&&keys.indexOf("Animals \u00B7 a pet. yes.")>=0,keys);
  ok("a whole deck and its categories: a category that IS a listed whole deck is not listed twice",!keys.some(k=>/^World Geography \u00B7/.test(k)));
  ok("the real decks for the grid",c.nameallDecks(c.masteryData.k,"k").join(",")==="Animals,Long,Roots,World Geography");
  ok("level gate: 3rd grade and up only (never a name)",c.nameallAvail("k")===true&&c.nameallLevelOk("mid")&&!c.nameallLevelOk("little")&&!c.nameallLevelOk("early"));
  ok("the clock: 12 s a card, never under a minute",c.nameallSecs(7)===84&&c.nameallSecs(3)===60&&c.nameallSecs(15)===180);
  const off=world(GEO.concat(ROOTS),{settings:{gameDecks:{Roots:{nameall:false}}}});
  ok("🎮 GAMEGRID: a deck Mom turned off takes its categories with it; its own column (off for Brain Dump still plays)",off.c.nameallLists(off.c.masteryData.k,"k").map(l=>l.key).join(",")==="World Geography"&&(()=>{ const w2=world(GEO.concat(ROOTS),{settings:{gameDecks:{Roots:{dump:false}}}}); return w2.c.nameallDecks(w2.c.masteryData.k,"k").length===2; })());
  ok("the grid's preload (asked raw) still lists a turned-off deck, so Mom can turn it back on",off.c.gameDeckCan("k",{key:"nameall",decks:k=>off.c.nameallDecks(off.c.masteryData.k,k)}).indexOf("Roots")>=0);
  off.c.nameallStart("Roots \u00B7 write"); ok("…and its list cannot be started",off.c.nameallState===null);
  const none=world(GEO.slice(0,4)); ok("nothing ready → the empty note",/No lists ready for Name all/.test(none.c.buildNameallHtml("#000")));
}
console.log("── a round: slots fill, close / dup / miss, I'm done, the reveal, the writes ──");
{ const w=world(GEO.concat(ROOTS)), c=w.c;
  c.nameallStart("World Geography"); const st=c.nameallState;
  ok("a round: 7 slots, 84 s, the clock running, nothing named",st&&st.phase==="play"&&st.of===7&&st.secs===84&&c._iv&&st.count===0&&st.game==="nameall");
  const h0=c.buildNameallHtml("#000");
  ok("the screen: the title, 7 empty slots, the countdown, the box — no names anywhere",/Name all 7 World Geography cards/.test(h0)&&(h0.match(/class="na-slot"/g)||[]).length===7&&/1:24/.test(h0)&&/id="na-in"/.test(h0)&&!/France|Spain|Greece/.test(h0.replace(/nameallStart\('World Geography'\)/g,"")));
  type(w,"France");
  ok("a hit → the ding, its slot fills with the card's own spelling, 1 of 7",st.count===1&&st.named[GEO[1].id].how==="hit"&&w.dings.slice(-1)[0]==="ding"&&/na-slot na-on"[^>]*>France</.test(c.buildNameallHtml("#000"))&&/1 of 7/.test(c.buildNameallHtml("#000")));
  type(w,"germny");
  ok("a letter off → close, counts, the slot shows the right spelling",st.count===2&&st.named[GEO[2].id].how==="close"&&/na-on"[^>]*>Germany</.test(c.buildNameallHtml("#000")));
  type(w,"france"); ok("the same name again → dup, nothing changes",st.count===2&&st.typed.length===2);
  type(w,"Belgium");
  ok("a name not on the list → the bonk, kept as \"not on this list\", count unchanged",st.count===2&&w.dings.slice(-1)[0]==="bonk"&&st.typed.filter(x=>x.pid==null).length===1);
  type(w,""); ok("a blank entry does nothing",st.typed.length===3);
  c.nameallStop();
  ok("I'm done → the round is over, the clock cleared: 2 of 7, a turn per card (named = ok, missed = wrong)",st.phase==="done"&&st.count===2&&!c._iv&&st.turns.length===7&&st.turns.filter(t=>t.first).length===2&&st.turns.filter(t=>!t.first&&t.wrong[1]).length===5);
  const mb=w.writes.filter(x=>x[1]==="mastery/k_settings/match_best"), gl=w.writes.filter(x=>x[0]==="push"&&x[1]==="mastery/gameLog/k/20261103");
  ok("writes: match_best ONE key, update; ONE gameLog push with game nameall and every card",mb.length===1&&mb[0][0]==="update"&&JSON.stringify(mb[0][2])==="{\"World Geography · nameall\":2}"&&gl.length===1&&gl[0][2].game==="nameall"&&gl[0][2].items.length===7&&gl[0][2].items.filter(i=>i.ok).length===2&&w.writes.length===2);
  const hf=c.buildNameallHtml("#000");
  ok("the finish: named 2 of 7, the two in green, the other five revealed in grey, the stray name listed",/You named 2 of 7/.test(hf)&&(hf.match(/na-slot na-on/g)||[]).length===2&&(hf.match(/na-slot na-miss/g)||[]).length===5&&/na-miss">Greece</.test(hf)&&/Not on this list: Belgium/.test(hf)&&/new best/.test(hf));
  ok("no confetti on a round with misses",!c.celebrated);
  c.nameallStart("World Geography"); const st2=c.nameallState; GEO.forEach(g=>{ if(st2.phase==="play") type(w,g.prompt); });
  ok("every slot named → the round stops itself: 7 of 7, a new best",st2.phase==="done"&&st2.count===7&&w.writes.filter(x=>x[1]==="mastery/k_settings/match_best").length===2);
  c.nameallStart("World Geography"); const st3=c.nameallState; GEO.forEach(g=>{ if(st3.phase==="play") type(w,g.prompt); });
  ok("a best that is not beaten writes nothing more",st3.isPB===false&&w.writes.filter(x=>x[1]==="mastery/k_settings/match_best").length===2);
  c.nameallStart("Roots \u00B7 write"); const st4=c.nameallState;
  ok("a category list: 3 slots, a minute on the clock, the title says what they mean",st4.of===3&&st4.secs===60&&/that mean \u201Cwrite\u201D/.test(c.buildNameallHtml("#000")));
  type(w,"graph"); type(w,"scrib"); type(w,"script");
  ok("…named all three → done; its best key carries the category",st4.phase==="done"&&st4.count===3&&c.masteryData.k_settings.match_best["Roots \u00B7 write \u00B7 nameall"]===3);
}
console.log("── the clock, park / restore (time away is not play time), dry run, the round's own kid, confetti, a period in a category's back ──");
{ const w=world(GEO), c=w.c;
  c.nameallStart("World Geography"); const st=c.nameallState;
  w.els["na-clock"]={textContent:"",style:{}}; c.clock+=30000; w.tick();
  ok("a tick updates the countdown in place (84 − 30 = 54 s left)",w.els["na-clock"].textContent==="0:54"&&st.phase==="play");
  c.nameallPark(); c.clock+=120000; c.nameallRestore(st);
  ok("parked for two minutes: not play time — still 54 s left after the restore",st.pausedAt===null&&st.pausedTotal===120000&&c.nameallLeft(st)===54000);
  w.tick(); ok("the tick after a park is a fresh interval (resume starts it), the clock reads 0:54",(c.nameallResume(),w.tick(),w.els["na-clock"].textContent==="0:54"));
  c.clock+=55000; w.tick();
  ok("time up → the round stops itself: 0 of 7, the log written",st.phase==="done"&&st.count===0&&w.writes.filter(x=>x[0]==="push").length===1&&w.writes.filter(x=>x[0]==="update").length===0);
  const d=world(GEO,{dry:true}); d.c.nameallStart("World Geography"); GEO.forEach(g=>{ if(d.c.nameallState.phase==="play") type(d,g.prompt); });
  ok("?dryrun=1: nothing written (best and log stay in memory)",d.writes.length===0&&d.c.masteryData.k_settings.match_best["World Geography \u00B7 nameall"]===7&&d.c.masteryData.gameLog.k["20261103"]);
  const g2=world(GEO); g2.c.nameallStart("World Geography"); g2.c.masteryKid="other"; type(g2,"Spain"); g2.c.nameallStop();
  ok("the finish saves to the round's OWN kid, not the kid picked now",g2.writes.find(x=>x[0]==="update")[1]==="mastery/k_settings/match_best"&&g2.writes.find(x=>x[0]==="push")[1]==="mastery/gameLog/k/20261103");
  const cl=world(GEO); cl.c.document.getElementById=id=>id==="celeb-overlay"?{}:(cl.els[id]||null); cl.c.nameallStart("World Geography"); GEO.forEach(g=>{ if(cl.c.nameallState.phase==="play") type(cl,g.prompt); });
  ok("with the overlay, naming them all gets the small confetti (no song)",cl.c.celebrated==="\u{1F4CB} You named them all!");
  const p=world(DOTS.concat(GEO)); p.c.nameallStart("Animals \u00B7 a pet. yes."); type(p,"cat"); p.c.nameallStop();
  ok("a category whose back carries periods: the best key has none (Firebase would refuse it)",p.writes.find(x=>x[0]==="update")&&Object.keys(p.writes.find(x=>x[0]==="update")[2])[0]==="Animals \u00B7 a pet_ yes_ \u00B7 nameall");
  const s=world(GEO); s.c.nameallStart("World Geography"); type(s,"Italy"); s.c.nameallChangeList();
  ok("Change list drops the round: nothing written",s.c.nameallState===null&&s.writes.length===0);
}
console.log("\n"+pass+" passed, "+fail+" failed");
process.exit(fail?1:0);
