/*
 * 💭 Brain Dump — free recall against a deck (her "yeah" 2026-11-02; PLAN_practice_games_2026-10-23.md build #5). The kid names every
 * card they can (typed, one at a time; nothing listed or hinted), misses come back once as back → type the name, then the recap.
 * Runs the REAL block (BRAINDUMP + GAMELOG + the Study Session's normalizer + the roster level).
 *   run:  node test_braindump.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
let pass=0, fail=0;
function ok(n,c,x){ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":""));} }
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("markers "+a); return src.slice(i,j); };
function fnText(name){ const i=src.indexOf("function "+name+"("); if(i<0) return ""; const j=src.indexOf("\nfunction ",i+10); return src.slice(i,j<0?undefined:j); }

// ── by text ──
const a=src.indexOf("// BRAINDUMP_START"), b=src.indexOf("// BRAINDUMP_END"), sp=src.indexOf("// SPELLBUILD_END");
ok("BRAINDUMP block sits right after SPELLBUILD_END",sp>0&&a>sp&&b>a&&src.slice(sp,a).trim()==="// SPELLBUILD_END");
const blk=src.slice(a,b);
ok("no kid's name in the block",!/lincoln|ellis|lucy|julian|caleb|taylor|makenzie|kenzie|andrew/i.test(blk));
ok("writes: match_best one key (guarded) + gameLogRound — no set / remove / push of its own",/db&&!_dryRun\(\)\) db\.ref\("mastery\/"\+kid\+"_settings\/match_best"\)\.update\(\{\[(?:key|\(typeof haKey==="function"\?haKey\(key\):key\))\]:st\.count\}\)/.test(blk)&&/gameLogRound\(st\)/.test(blk)&&!/\.set\(|\.remove\(|\.push\(\{/.test(blk.replace(/st\.typed\.push|st\.turns\.push|out\.push|\.push\(\{pid:i\.id/g,"")));
ok("never the ladder: no tier / next_due / studyLog / mastSaveResults writes",!/next_due\s*=|\.tier\s*=[^=]|mastery\/studyLog|studyLog\/|mastSaveResults|mstSave/.test(blk));
ok("GAMES_LIST line right after Memory flip, with park / restore / resume",/\{key:"memory",[^\n]*\n\s*\{key:"dump",\s*emoji:"\\u\{1F4AD\}", label:"Brain Dump",\s*view:"dump",\s*available:k=>typeof dumpAvail==="function"&&dumpAvail\(k\), render:c=>buildDumpHtml\(c\),\s*park:\(\)=>dumpPark\(\), restore:v=>\{ dumpRestore\(v\); \}, resume:\(\)=>dumpResume\(\), decks:k=>typeof dumpDecks==="function"\?dumpDecks\(_gamesItems\(k\),k\):\[\]\}/.test(src));
ok("GAMEKID / gamesCurrentKey untouched (no dump line there)",!/dump/i.test(cut("// GAMEKID_START","// GAMEKID_END"))&&!/dump/i.test(fnText("gamesCurrentKey")));
ok("the input never autocompletes / autocorrects (no hints while typing)",/autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"/.test(blk)&&!/<datalist|list="/.test(blk));

// ── a sandbox: BRAINDUMP + GAMELOG + mstNormAns + dcLevel, a kid's cards, a recording db ──
const C=(deck,front,back,extra)=>Object.assign({id:(deck+"_"+front).replace(/\W+/g,"_"),subject:deck,prompt:front,answer:back,status:"active",tier:"weekly"},extra||{});
function world(items,o){
  o=o||{};
  const writes=[], dings=[], timers=[];
  const CODE=cut("// BRAINDUMP_START","// BRAINDUMP_END")+"\n"+cut("// GAMELOG_START","// GAMELOG_END")+"\n"+fnText("mstNormAns")+"\n"+fnText("mstTypedOk")+"\n"+fnText("dcLevel")+"\n"+fnText("mastGetDef");
  const els={};
  const ctx={console,JSON,Object,Array,String,Number,Math,Set,Map,RegExp,Date,parseInt,isNaN,isFinite,
    setTimeout:(f,ms)=>{ timers.push({f,ms}); return timers.length; },setInterval:(f,ms)=>{ ctx._iv={f,ms}; return 1; },clearInterval(){ ctx._iv=null; },
    window:{_dumpTick:null},document:{getElementById:id=>els[id]||null},els,
    _dryRun:()=>!!o.dry,HA_LS:{setItem(){}},_mastRe(){ ctx.renders=(ctx.renders||0)+1; },bbAudioUnlock(){},
    matchDing:()=>dings.push("ding"),matchBonk:()=>dings.push("bonk"),_showCelebration:(k,t)=>{ ctx.celebrated=t; },
    mstTodayKey:()=>"20261102",mastView:"dump",masteryKid:"k",MAST_MATH_ANS:{},MAST_VOCAB_DEFS:{},
    ROSTER_DEF:o.roster||[{id:"k",grade:"6"},{id:"little",grade:"PreK"},{id:"early",grade:"1"},{id:"mid",grade:"4"}],
    masteryData:{k:items||[],k_settings:o.settings||{}},
    db:{ref:p=>({set:v=>writes.push(["set",p,v]),update:v=>writes.push(["update",p,v]),push:v=>writes.push(["push",p,v])})},timers};
  vm.createContext(ctx);
  vm.runInContext(CODE+"\nObject.defineProperty(this,'dumpState',{get:()=>dumpState,set:v=>{dumpState=v;}}); this.DUMP_MIN=DUMP_MIN; this.DUMP_REASK=DUMP_REASK; this.DUMP_SECS=DUMP_SECS;",ctx);
  return {c:ctx,writes,dings,timers,els};
}
const fire=w=>{ const t=w.timers.splice(0); t.forEach(x=>x.f()); };
const type=(w,text)=>{ w.els["dump-in"]={value:text,focus(){}}; };
const ROOTS=["geo","chron","morph","bene","mal","tele","micro","scope","peri","bio","photo","graph"].map((r,i)=>C("Roots",r,["earth","time","form","good","bad","far","small","look","around","life","light","write"][i],{tier:["daily","weekly","monthly","bi_weekly"][i%4]}));
const DEUTSCH=["das Papier","der Hund","die Katze","das Haus","der Baum","die Sonne","der Wind","das Auto","die Blume","der Fisch"].map((g,i)=>C("German",g,["paper","dog","cat","house","tree","sun","wind","car","flower","fish"][i]));
const SENTENCES=Array.from({length:12},(_,i)=>C("Capitalization","Kangaroos are native to Australia number "+i+".","First word of a sentence."));
const FACTS=Array.from({length:12},(_,i)=>C("Math Facts",(i+2)+"\u00D77",String((i+2)*7)));
const SPELL=Array.from({length:12},(_,i)=>C("AAS Words","word"+i,"word"+i,{type:"spelling_word"}));
const KINGS=["William I (the Conqueror)","Henry I","Stephen","Henry II","Richard I","John","Henry III","Edward I","Edward II","Edward III"].map(k=>C("Monarchs",k,"",{}));

console.log("── which decks (pure) ──");
{
  const {c}=world(ROOTS.concat(DEUTSCH,SENTENCES,FACTS,SPELL,KINGS,[C("Roots","geo","earth again"),C("Small","x","y")]),{settings:{definitions:{"Henry I":"son of William, ruled 1100–1135","Stephen":"William's grandson, the Anarchy"}}});
  const d=c.dumpDecks(c.masteryData.k,"k");
  ok("decks with 10+ named cards and a back: Roots + German",d.join(",")==="German,Roots",d);
  ok("sentence decks are not names",d.indexOf("Capitalization")<0);
  ok("math facts are not names",d.indexOf("Math Facts")<0);
  ok("spelling stays out",d.indexOf("AAS Words")<0);
  ok("a deck whose cards have no back (only 2 definitions) does not qualify",d.indexOf("Monarchs")<0);
  ok("a duplicate front counts once",c.dumpPools(c.masteryData.k,"k").Roots.length===12);
  ok("nameable: words / short phrases yes; sentences, questions, rule examples, numbers no",c.dumpNameable("lines of latitude")&&c.dumpNameable("Norman Conquest (Battle of Hastings)")&&!c.dumpNameable("What is an inference?")&&!c.dumpNameable("boat → boats · flower → flowers")&&!c.dumpNameable("1 foot")&&!c.dumpNameable("\u00BE as decimal")&&!c.dumpNameable("6\u00D77")&&c.dumpNameable("-ology")&&c.dumpNameable("T-Shirt"));
  ok("level gate: 3rd grade and up only (never a name)",c.dumpLevelOk("k")&&c.dumpLevelOk("mid")&&!c.dumpLevelOk("little")&&!c.dumpLevelOk("early"));
  ok("dumpAvail: this kid has a deck → true; a pre-reader never",c.dumpAvail("k")===true&&c.dumpAvail("little")===false);
  const kings=KINGS.map(k=>Object.assign({},k)); const defs={}; kings.forEach(k=>{ defs[k.prompt]="a king"; });
  const w2=world(kings,{settings:{definitions:defs}});
  ok("a back from the definitions map counts",w2.c.dumpDecks(kings,"k").join(",")==="Monarchs");
}

console.log("── games per deck (GAMEGRID): Mom turned Brain Dump off for one deck ──");
{
  const {c}=world(ROOTS.concat(DEUTSCH));
  c.gameDeckOn=(kid,game,deck)=>!(game==="dump"&&deck==="German");
  ok("the raw rule still lists both (the grid's preload)",c.dumpDecks(c.masteryData.k,"k").join(",")==="German,Roots");
  ok("the kid's list leaves German out; the game stays available for Roots",c.dumpDecksOn(c.masteryData.k,"k").join(",")==="Roots"&&c.dumpAvail("k")===true);
  ok("the deck chips leave it out",c.buildDumpHtml("#1").indexOf("dumpStart(\x27German\x27)")<0&&c.buildDumpHtml("#1").indexOf("dumpStart(\x27Roots\x27)")>0);
  c.dumpStart("German");
  ok("an off deck will not start",c.dumpState===null);
  c.gameDeckOn=()=>false;
  ok("every deck off → not offered at all",c.dumpAvail("k")===false);
}

console.log("── matching (pure) ──");
{
  const {c}=world(ROOTS.concat(DEUTSCH));
  const cards=c.dumpPools(c.masteryData.k,"k").Roots, gc=c.dumpPools(c.masteryData.k,"k").German;
  const m=(t,n)=>c.dumpMatch(t,cards,n||{});
  ok("exact = hit",m("geo").how==="hit"&&m("geo").card.front==="geo");
  ok("case and punctuation don't count",m("  GEO. ").how==="hit"&&m("peri-").how==="hit");
  ok("one letter off on a 4+ letter name = close",m("cron").how==="close"&&m("cron").card.front==="chron"&&m("morp").how==="close"&&m("morf")===null);
  ok("a 3-letter name has no slack",m("gea")===null);
  ok("two off on a long name = close",c.dumpMatch("Norman Conquet (Battle of Hasting)",[{pid:"x",front:"Norman Conquest (Battle of Hastings)",back:"1066"}],{}).how==="close");
  ok("the trailing (…) may be left off",c.dumpMatch("william i",[{pid:"x",front:"William I (the Conqueror)",back:"1066"}],{}).how==="close");
  ok("German: the article may be left off → close; with it → hit; umlaut spellings ok",c.dumpMatch("Papier",gc,{}).how==="close"&&c.dumpMatch("das Papier",gc,{}).how==="hit"&&c.dumpMatch("die Bluehme",gc,{}).how==="close");
  ok("not in the deck → null",m("banana")===null);
  ok("already named → dup, and close never lands on a named card",m("geo",{Roots_geo:1}).how==="dup"&&m("gro",{Roots_geo:1})===null);
}

console.log("── a round: dump → misses come back → recap, log, best ──");
{
  const w=world(ROOTS,{settings:{match_best:{"Roots \u{00B7} dump":5}}}), c=w.c;
  c.dumpStart("Roots");
  let st=c.dumpState;
  ok("round starts: play, 12 cards, the round's own kid",st&&st.phase==="play"&&st.of===12&&st.kid==="k"&&st.game==="dump"&&st.deck==="Roots");
  ok("the clock ticks",!!c._iv&&c._iv.ms===1000);
  ok("enter: hit / close / miss / dup / blank",c.dumpEnter(st,"geo")==="hit"&&c.dumpEnter(st,"cron")==="close"&&c.dumpEnter(st,"banana")==="miss"&&c.dumpEnter(st,"GEO")==="dup"&&c.dumpEnter(st,"  ")===""&&c.dumpEnter(st,"banana")==="miss");
  ok("count = named (hit + close); a miss typed twice is kept once",st.count===2&&st.typed.length===3&&st.typed.filter(x=>x.pid==null).length===1);
  // through the UI: Add reads the box, dings on a name, nothing on an outside name
  type(w,"tele"); c.dumpAdd(); type(w,"zzz"); c.dumpAdd();
  ok("Add: a name dings, an outside name is quiet, the box clears",st.count===3&&w.dings.join(",")==="ding"&&w.els["dump-in"].value==="");
  let h=c.buildDumpHtml("#123");
  ok("while typing: no card front on screen except the ones already named; the count shows",["morph","bene","mal","micro","scope","peri","bio","photo","graph"].every(f=>h.indexOf(">"+f+"<")<0&&h.indexOf(" "+f+"<")<0)&&/3 of 12/.test(h)&&h.indexOf("\u2713 geo")>0&&h.indexOf('id="dump-in"')>0);
  ok("the back is never on screen while typing",h.indexOf("earth")<0&&h.indexOf("time")<0);
  c.dumpStop(st);
  ok("I'm done → ask phase: 9 misses, lowest ladder first, capped at DUMP_REASK",st.phase==="ask"&&st.asks.length===9&&c.DUMP_REASK===10&&st.cards.find(x=>x.pid===st.asks[0].pid).tier==="daily"&&st.cards.find(x=>x.pid===st.asks[8].pid).tier==="monthly"&&st.asks.slice(0,2).every(a=>st.cards.find(x=>x.pid===a.pid).tier==="daily"));
  ok("the dump turns: 12, named = first, missed = wrong",st.turns.length===12&&st.turns.filter(t=>t.first).length===3&&st.turns.filter(t=>!t.first&&t.wrong[1]).length===9);
  h=c.buildDumpHtml("#123");
  const cue=st.cards.find(x=>x.pid===st.asks[0].pid);
  ok("the re-ask shows the BACK as the cue, never the name",h.indexOf(cue.back)>0&&h.indexOf(">"+cue.front+"<")<0&&!new RegExp("\\b"+cue.front+"\\b").test(h.replace(/dump-\w+/g,"")));
  type(w,cue.front.toUpperCase()); c.dumpAnswer();
  ok("right: ding, locked, the name confirmed",st.asks[0].ok&&st.lock&&w.dings[w.dings.length-1]==="ding"&&/\u2705/.test(c.buildDumpHtml("#1")));
  fire(w);
  ok("then the next miss",st.ai===1&&!st.lock);
  type(w,"nope"); c.dumpAnswer();
  ok("wrong: bonk, the right name shown once, marked ✗",!st.asks[1].ok&&w.dings[w.dings.length-1]==="bonk"&&c.buildDumpHtml("#1").indexOf("It was <b>"+st.cards.find(x=>x.pid===st.asks[1].pid).front+"</b>")>0);
  fire(w);
  // answer the rest right
  while(st.phase==="ask"){ const a=st.asks[st.ai]; type(w,st.cards.find(x=>x.pid===a.pid).front); c.dumpAnswer(); fire(w); }
  ok("done after the last miss",st.phase==="done");
  ok("back turns: 9, one fail; gameLogEntry: 21 items, game dump, secs",(()=>{ const bt=st.turns.filter(t=>t.back); const e=c.gameLogEntry(st,st.t0+90000); return bt.length===9&&bt.filter(t=>t.fail).length===1&&e.game==="dump"&&e.deck==="Roots"&&e.items.length===21&&e.items.filter(i=>i.ok).length===11&&e.items.filter(i=>i.back).length===9&&e.items.filter(i=>i.fail).length===1&&e.secs===90; })());
  const pushes=w.writes.filter(x=>x[0]==="push");
  ok("ONE gameLog push to mastery/gameLog/k/20261102, nothing else pushed",pushes.length===1&&pushes[0][1]==="mastery/gameLog/k/20261102"&&pushes[0][2].game==="dump");
  ok("3 named < best 5 → no match_best write, best shown",w.writes.filter(x=>x[0]==="update").length===0&&!st.isPB&&st.prevBest===5);
  h=c.buildDumpHtml("#123");
  ok("recap: named / came back / not in this deck",/You named 3 of 12/.test(h)&&/best 5/.test(h)&&h.indexOf("\u2713 geo")>0&&/<s style="opacity:\.6">cron<\/s> chron/.test(h)&&/dump-x">\u2717 /.test(h)&&h.indexOf("banana")>0&&h.indexOf("zzz")>0&&h.indexOf("Came back")>0);
  ok("no celebration (not all named)",!c.celebrated);
}

console.log("── a shared back ──");
{
  const cards=ROOTS.concat([C("Roots","scrib","write")]);   // graph and scrib both say "write"
  const w=world(cards), c=w.c; c.dumpStart("Roots"); const st=c.dumpState;
  cards.filter(x=>x.prompt!=="graph"&&x.prompt!=="scrib").forEach(r=>{ type(w,r.prompt); c.dumpAdd(); });
  c.dumpStop(st);
  ok("both \"write\" cards come back",st.asks.length===2);
  type(w,"scrib"); c.dumpAnswer(); fire(w); type(w,"graph"); c.dumpAnswer(); fire(w);
  ok("either name is right for a shared cue (the kid can\u2019t tell them apart from the back)",st.asks.every(a=>a.ok)&&st.phase==="done");
}

console.log("── name them all: PB, confetti, no re-ask ──");
{
  const w=world(ROOTS), c=w.c; c.els["celeb-overlay"]={};
  c.dumpStart("Roots"); const st=c.dumpState;
  ROOTS.forEach(r=>{ type(w,r.prompt); c.dumpAdd(); });
  ok("every card named → the round stops itself, straight to done (nothing to re-ask)",st.phase==="done"&&st.count===12&&st.asks.length===0);
  const up=w.writes.filter(x=>x[0]==="update");
  ok("personal best written: this key only",up.length===1&&up[0][1]==="mastery/k_settings/match_best"&&JSON.stringify(up[0][2])==='{"Roots \u00b7 dump":12}'&&st.isPB);
  ok("confetti, no song (title names no card)",c.celebrated==="\u{1F4AD} You named them all!");
  ok("log: 12 items all ok, no back",(()=>{ const e=c.gameLogEntry(st); return e.items.length===12&&e.items.every(i=>i.ok&&!i.back); })());
}

console.log("── the clock ──");
{
  const w=world(ROOTS), c=w.c; c.dumpStart("Roots"); const st=c.dumpState;
  st.t0-=c.DUMP_SECS*1000+500; c._iv.f();
  ok("at 5:00 the round stops itself → ask phase",st.phase==="ask"&&c._iv===null);
  const w2=world(ROOTS), c2=w2.c; c2.dumpStart("Roots"); const s2=c2.dumpState; s2.t0-=61000; c2.els["dump-clock"]={textContent:""}; c2._iv.f();
  ok("the clock shows m:ss",c2.els["dump-clock"].textContent==="1:01"&&s2.phase==="play");
  ok("dumpClock",c2.dumpClock(0)==="0:00"&&c2.dumpClock(299999)==="4:59");
}

console.log("── dry run + no db ──");
{
  const w=world(ROOTS,{dry:true}), c=w.c; c.dumpStart("Roots"); ROOTS.forEach(r=>{ type(w,r.prompt); c.dumpAdd(); });
  ok("?dryrun=1: nothing written, state still kept",w.writes.length===0&&c.dumpState.phase==="done"&&c.masteryData.k_settings.match_best["Roots \u00b7 dump"]===12);
  ok("a round dropped mid-way (Change deck) writes nothing",(()=>{ const x=world(ROOTS); x.c.dumpStart("Roots"); type(x,"geo"); x.c.dumpAdd(); x.c.dumpChangeDeck(); return x.c.dumpState===null&&x.writes.length===0; })());
}

console.log("── GAMEKID park / restore / resume ──");
{
  const w=world(ROOTS), c=w.c; c.dumpStart("Roots"); const st=c.dumpState; type(w,"geo"); c.dumpAdd();
  const parked=c.dumpPark();
  ok("park returns the round and pauses its clock",parked===st&&!!st.pausedAt);
  c.dumpRestore(null);
  ok("restore(null): no round on screen; the other kid's view has no input",c.dumpState===null&&c.buildDumpHtml("#1").indexOf('id="dump-in"')<0);
  st.pausedAt-=20000;   // 20 s away
  c.dumpRestore(st);
  ok("restore: back, time away not counted",c.dumpState===st&&st.pausedAt===null&&st.pausedTotal>=20000&&c.dumpElapsed(st)<5000);
  c._iv=null; c.dumpResume();
  ok("resume restarts the clock",!!c._iv);
  // a Check mid-step when the kid switched: settles on resume
  c.dumpStop(st); type(w,"nope"); c.dumpAnswer(); const at=st.ai;
  const p2=c.dumpPark(); c.dumpRestore(null); c.dumpRestore(p2); c.dumpResume();
  ok("a locked re-ask settles on resume (moves on, no render)",!st.lock&&st.ai===at+1&&st.phase==="ask");
  fire(w);
  ok("the old timer never advances a settled turn",st.ai===at+1);
}

console.log("── the sub-menu sandbox (test_games_tab's world) never throws on the new entry ──");
{
  const tab=cut("// GAMESTAB_START","// GAMESTAB_END");
  const ctx={console,JSON,Object,Array,String,Math,masteryKid:"k",masteryData:{k:[]},matchPairMode:"two",matchStyle:"match",mastView:"games",mastMatchDecks:()=>[],whichDecks:()=>[],buildMatchHtml:()=>"",buildWhichHtml:()=>"",mastSetView(){},_mastRe(){},mastScoreItemId:null,mastManualScore:false,mastMatchSetStyle(){}};
  vm.createContext(ctx); vm.runInContext(tab+"\nthis.gamesFor=gamesFor;this.GAMES_LIST=GAMES_LIST;",ctx);
  ok("without the block loaded, Brain Dump is simply unavailable",ctx.gamesFor("k").every(g=>g.key!=="dump")&&ctx.GAMES_LIST.some(g=>g.key==="dump"&&typeof g.park==="function"&&typeof g.restore==="function"&&typeof g.resume==="function"));
}

console.log("\n"+pass+" passed, "+fail+" failed");
process.exit(fail?1:0);
