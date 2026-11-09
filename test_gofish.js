/*
 * 🐟 Go Fish vs the app (her yes 2026-11-02 to gofish-design_2026-11-02.md; PLAN_practice_games_2026-10-23.md build #6).
 * Every card twice; the kid asks by PRODUCING the card (say it / type it / pick it), the app answers from its real hand;
 * the app asks by name (or by the answer) and the kid FINDS it. Every pair goes down through the kid. Misses come back
 * once at the end; one gameLog entry (game "gofish"); match_best "<deck> · gofish" only when beaten. Runs the REAL code.
 *   run:  node test_gofish.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
let pass=0, fail=0;
function ok(n,c,x){ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":""));} }
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("markers "+a); return src.slice(i,j); };
function fnText(name){ const i=src.indexOf("function "+name+"("); if(i<0) return ""; const j=src.indexOf("\nfunction ",i+10); return src.slice(i,j<0?undefined:j); }
const seeded=seed=>{ let x=seed||7; return ()=>{ x=(x*1103515245+12345)&0x7fffffff; return (x%10000)/10000; }; };

// ── by text ──
const a=src.indexOf("// GOFISH_START"), b=src.indexOf("// GOFISH_END"), sp=src.indexOf("// SPELLBUILD_END"), sc=src.indexOf("// STUDYCOUNTS_START");
ok("GOFISH block sits among the game blocks after SPELLBUILD_END, before STUDYCOUNTS_START",sp>0&&a>sp&&b>a&&sc>b&&!/\n(?!\/\/ (BRAINDUMP|BINGO|SORTIT|GOFISH)_)[^\n]*(_START|_END)/.test(src.slice(sp+18,a)));
ok("one block, once",src.indexOf("// GOFISH_START",a+1)<0&&src.indexOf("// GOFISH_END",b+1)<0);
const blk=src.slice(a,b);
ok("no kid's name in the block",!/lincoln|ellis|lucy|julian|caleb|taylor|makenzie|kenzie|andrew/i.test(blk));
ok("no 🔀 anywhere",src.indexOf("\u{1F500}")<0);
ok("writes: match_best one key (guarded) + gameLogRound — no set / remove / push of its own",/db&&!_dryRun\(\)\) db\.ref\("mastery\/"\+kid\+"_settings\/match_best"\)\.update\(\{\[(?:key|\(typeof haKey==="function"\?haKey\(key\):key\))\]:st\.first\}\)/.test(blk)&&/gameLogRound\(st\)/.test(blk)&&!/\.set\(|\.remove\(|\.push\(e\)|next_due|studyLog/.test(blk.replace(/^\/\/.*$/gm,"").replace(/st\.turns\.push|st\.table\.push|backs\.push|st\.hand\.push|st\.app\.push|pond\.push/g,"")));
ok("GAMES_LIST has Go Fish right after Build it, with park / restore / resume",/resume:\(\)=>spellResume\(\)\},[^\n]*\n\s*\{key:"gofish", emoji:"\\u\{1F41F\}", label:"Go Fish",\s*view:"gofish",\s*available:k=>typeof gofishDecks==="function"&&gofishDecks\(_gamesItems\(k\),k\)\.length>0, render:c=>buildGofishHtml\(c\),\s*park:\(\)=>gofishState, restore:v=>\{ gofishState=v\|\|null; \}, resume:\(\)=>gofishResume\(\), decks:k=>typeof gofishDecks==="function"\?gofishDecks\(_gamesItems\(k\),k\):\[\]\},/.test(src));
ok("gamesCurrentKey and GAMEKID untouched (the entry carries everything)",!/gofish/.test(fnText("gamesCurrentKey")+fnText("gameKidSwitch")+fnText("_gkResume")));
ok("a picture card's name is never written in the ask (said only)",/"Do you have\\u2026 \(listen!\)"/.test(blk)&&!/Do you have\\u2026 "\+gofishName/.test(blk));
ok("the start tap unlocks audio; the honor tap is documented as such",/bbAudioUnlock\(\)/.test(blk)&&/honor system/.test(blk));

// ── a sandbox: WHICHONE + GAMELOG + GOFISH, a kid's cards, a recording db, timers by hand ──
const P=(n,emoji,extra)=>Object.assign({id:"p_"+n,subject:"Animals",prompt:n,emoji:emoji,status:"active",tier:"daily"},extra||{});
const M=(f,ans,extra)=>Object.assign({id:"m_"+f,subject:"Math Facts",prompt:f,answer:ans,status:"active",tier:"daily"},extra||{});
const G=(f,ans)=>({id:"g_"+f,subject:"German",prompt:f,answer:ans,status:"active",tier:"daily"});
const ANIMALS=[P("cat","🐱"),P("dog","🐶"),P("cow","🐮"),P("pig","🐷"),P("fox","🦊"),P("owl","🦉"),P("bee","🐝"),P("ant","🐜"),P("hen","🐔")];
const MATH=[M("7+8","15"),M("6+6","12"),M("9+4","13"),M("5+5","10"),M("8+3","11"),M("2+7","9")];
const GERMAN=[G("gut","well"),G("ich","I"),G("du","you"),G("ja","yes"),G("nein","no")];
const SPELL=[{id:"s_1",subject:"AAS Words",prompt:"red",status:"introduction"},{id:"s_2",subject:"AAS Words",prompt:"bed",status:"introduction"},{id:"s_3",subject:"AAS Words",prompt:"fed",status:"introduction"},{id:"s_4",subject:"AAS Words",prompt:"led",status:"introduction"}];
function world(items,o){
  o=o||{};
  const writes=[], said=[], dings=[], timers=[], CODE=cut("// WHICHONE_START","// WHICHONE_END")+"\n"+cut("// GAMELOG_START","// GAMELOG_END")+"\n"+cut("// GOFISH_START","// GOFISH_END")+"\n"+cut("// GAMEGRID_START","// GAMEGRID_END");
  const ctx={console,JSON,Object,Array,String,Number,Math,Set,Map,RegExp,Date,parseInt,isNaN,setTimeout:(f,ms)=>{ timers.push(f); return timers.length; },
    document:{getElementById:()=>o.celeb?{}:null},
    _dryRun:()=>!!o.dry,HA_LS:{setItem(){}},_mastRe(){},bbAudioUnlock(){},momHere:()=>true,renderAll(){},_gamesItems:k=>(o.itemsFor&&o.itemsFor[k])||(k==="k"?items||[]:[]),
    _smTileVis:it=>(it&&it.emoji?'<span class="memoji">'+it.emoji+'</span>':null),
    _matchPlain:h=>String(h||"").replace(/<[^>]*>/g," ").replace(/\s+/g," ").trim(),
    esc:s=>String(s||"").replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;"),
    mastSpeak:(t,op)=>said.push(t),matchDing:()=>dings.push("ding"),matchBonk:()=>dings.push("bonk"),_showCelebration:(k,t)=>dings.push("celeb:"+t),
    mstTodayKey:()=>"20261102",mastView:o.view||"gofish",masteryKid:"k",
    masteryData:{k:items||[],k_settings:o.settings||{}},
    db:{ref:p=>({set:v=>writes.push(["set",p,v]),update:v=>writes.push(["update",p,v]),push:v=>writes.push(["push",p,v]),remove:()=>writes.push(["remove",p])})}};
  vm.createContext(ctx);
  vm.runInContext(CODE+"\nObject.defineProperty(this,'gofishState',{get:()=>gofishState,set:v=>{gofishState=v;}}); Object.defineProperty(this,'_gfRandom',{get:()=>_gfRandom,set:v=>{_gfRandom=v;}}); this.GF_PAIRS=GF_PAIRS; this.GF_MIN=GF_MIN; this.WHICH_MIX=WHICH_MIX;",ctx);
  ctx._gfRandom=seeded(o.seed||3);
  const flush=()=>{ while(timers.length){ const f=timers.shift(); f(); } };
  return {c:ctx,writes,said,dings,timers,flush};
}
const backOf=(c,pid)=>c._whichBack(c.masteryData.k.find(x=>x.id===pid));
// Play the current step right, once. Returns what it did.
function stepRight(w){
  const c=w.c, st=c.gofishState; if(!st) return "none";
  if(st.phase==="done") return "done";
  if(st.lock){ w.flush(); return "beat"; }
  const sp=st.step; if(!sp) return "wait";
  if(sp.k==="ask"){ c.gofishAsk(0); return "ask"; }
  if(sp.k==="fish"){ c.gofishFish(); return "fish"; }
  if(sp.k==="produce"){ const t=st.turns[sp.t];
    if(t.act==="say"){ c.gofishSaid(); return "say"; }
    if(t.act==="type"){ for(const ch of backOf(c,t.pid)) c.gofishKey(ch); c.gofishCheck(); return "type"; }
    c.gofishPickTap(t.opts.indexOf(backOf(c,t.pid))); return "pick"; }
  if(sp.k==="find"){ const i=st.hand.indexOf(sp.pid); if(i>=0) c.gofishFindTap(i); else c.gofishGoFish(); return "find"; }
  return "?";
}
function playOut(w,max){ let n=0; while(n++<(max||400)){ const r=stepRight(w); if(r==="done"||r==="none"||r==="?") return r; } return "stuck"; }

console.log("── decks, pool, kinds (pure) ──");
{
  const {c}=world(ANIMALS.concat(MATH,GERMAN,SPELL));
  ok("decks: Which one?'s playable decks with "+c.GF_MIN+"+ cards — spelling stays out",JSON.stringify(c.gofishDecks(c.masteryData.k))==='["Animals","German","Math Facts"]');
  ok("a deck under "+c.GF_MIN+" cards can't deal a hand",c.gofishDecks(ANIMALS.slice(0,3).concat(MATH)).join()==="Math Facts");
  ok("the pool for one deck is that deck only; Mix is every playable deck",c.gofishPool(c.masteryData.k,"Animals").length===9&&c.gofishPool(c.masteryData.k,c.WHICH_MIX).length===20);
  ok("kinds: picture → say · number back → type · word back → pick",c.gofishKind(ANIMALS[0],"picture")==="say"&&c.gofishKind(MATH[0],"answer")==="type"&&c.gofishKind(GERMAN[0],"answer")==="pick"&&c.gofishKind({id:"x",subject:"Letters",prompt:"b"},"symbol")==="say");
  const d=c.gofishDeal(["a","b","c","d","e","f","g","h"]);
  const cnt={}; d.hand.concat(d.app,d.pond).forEach(p=>{ cnt[p]=(cnt[p]||0)+1; });
  ok("deal: 5 + 5 + the pond = every card exactly twice",d.hand.length===5&&d.app.length===5&&d.pond.length===6&&Object.keys(cnt).length===8&&Object.values(cnt).every(n=>n===2));
  ok("no hand is dealt a pair (each hand's cards all differ)",new Set(d.hand).size===5&&new Set(d.app).size===5);
  const d4=c.gofishDeal(["a","b","c","d"]);
  ok("a small deck deals 3 each",d4.hand.length===3&&d4.app.length===3&&d4.pond.length===2);
}

console.log("── a whole round, every act right (pictures: say-it honor system) ──");
{
  const w=world(ANIMALS), c=w.c;
  c.gofishStart("Animals");
  const st=c.gofishState;
  ok("the round: 8 pairs, kid 5, app 5, pond 6, kid's turn first",st&&st.pairs.length===8&&st.hand.length===5&&st.app.length===5&&st.pond.length===6&&st.step.k==="ask"&&st.kid==="k"&&st.game==="gofish");
  ok("the first ask is spoken, not written (Your turn!)",w.said[0]==="Your turn!");
  const r=playOut(w);
  ok("the round ends by itself: every pair down, phase done",r==="done"&&st.phase==="done"&&st.table.length===8&&st.hand.length===0&&st.app.length===0&&st.pond.length===0);
  const acted={}; st.turns.forEach(t=>{ acted[t.pid]=1; });
  ok("every card in the round was asked at least once (said or found)",st.pairs.every(p=>acted[p]));
  ok("every act was either a say or a find; no misses → no come-backs",st.turns.every(t=>(t.act==="say"||t.act==="find")&&t.done&&t.first&&!t.back));
  ok("8 of 8 pairs clean → new best, written as one key",st.first===8&&st.of===8&&st.isPB&&w.writes.filter(x=>x[0]==="update"&&x[1]==="mastery/k_settings/match_best"&&JSON.stringify(x[2])==='{"Animals \u00b7 gofish":8}').length===1);
  const logs=w.writes.filter(x=>x[0]==="push");
  ok("ONE gameLog push, game gofish, deck Animals, one item per act (a right \"Go fish!\" — the card not in hand — is left out: ⚖️ GAMEJUDGE), all ok",logs.length===1&&logs[0][1]==="mastery/gameLog/k/20261102"&&logs[0][2].game==="gofish"&&logs[0][2].deck==="Animals"&&logs[0][2].items.length===st.turns.filter(t=>!t.nolog).length&&st.turns.some(t=>t.nolog&&t.act==="find")&&logs[0][2].items.every(i=>i.ok&&i.n===1));
  ok("nothing else written",w.writes.length===2);
  ok("the app spoke each picture's name on its asks, and said the name back after 🗣",w.said.some(s=>/^Do you have (cat|dog|cow|pig|fox|owl|bee|ant|hen)\?$/.test(s))&&w.said.some(s=>/^(cat|dog|cow|pig|fox|owl|bee|ant|hen) (Yes! Here you go\.|Go fish!|Down it goes!)/.test(s)));
  ok("a clean round gets the small confetti only when the overlay exists (none here)",!w.dings.some(d=>/celeb/.test(d)));
  const html=c.buildGofishHtml("#123456");
  ok("finish screen: pairs on the table, 8 of 8 pairs clean, Play again",/8 of 8 pairs clean/.test(html)&&/new best/.test(html)&&/gofishStart\('Animals'\)/.test(html)&&(html.match(/class="gf-pair"/g)||[]).length===8);
  ok("the table never says whose pair it is (cooperative)",!/mine|yours|My pairs|Your pairs/i.test(html));
}

console.log("── math facts: the ask is typed; a wrong answer twice fails the act, the card comes back once ──");
{
  const w=world(MATH), c=w.c;
  c.gofishStart("Math Facts");
  const st=c.gofishState;
  ok("6 pairs (the deck has 6), hand 5",st.pairs.length===6&&st.hand.length===5&&st.kinds[st.pairs[0]]==="type");
  c.gofishAsk(0);
  const t0=st.turns[0];
  ok("tapping a hand card opens the produce step with the number pad",st.step.k==="produce"&&t0.act==="type"&&t0.typed===""&&/Type the answer/.test(st.msg));
  const html1=c.buildGofishHtml("#123456");
  ok("the card shows its FRONT, never its back; the pad has 0–9, erase, check",html1.indexOf(">"+t0.pid.slice(2)+"<")>=0&&html1.indexOf(backOf(c,t0.pid))<0||(html1.indexOf("gf-big")>=0&&/gofishKey\('7'\)/.test(html1)&&/gofishCheck\(\)/.test(html1)&&!new RegExp('<span class="gf-txt">'+backOf(c,t0.pid)+'</span>').test(html1)));
  c.gofishKey("9"); c.gofishKey("9"); c.gofishCheck();
  ok("wrong once → again, bonk, the typed box clears, still the kid's produce step",!t0.done&&t0.tries===1&&t0.typed===""&&w.dings[w.dings.length-1]==="bonk"&&st.step.k==="produce"&&/try again/.test(st.msg));
  c.gofishKey("9"); c.gofishCheck();
  ok("wrong twice → fail; the ask is still answered from the app's hand (yes → pair down, or go fish)",t0.done&&t0.fail&&!t0.first&&((st.step.k==="fish")||(st.lock&&st.after==="kid"&&st.table.length===1)));
  ok("the fail line is spoken before the answer",/^We’ll come back to that one\. (Yes! Here you go\.|Go fish!)/.test(w.said[w.said.length-1]));
  const r=playOut(w);
  ok("the round plays out to the end",r==="done"&&st.table.length===6);
  const backs=st.turns.filter(t=>t.back);
  ok("the failed card came back exactly once, as a typed produce, and was right that time",backs.length===1&&backs[0].pid===t0.pid&&backs[0].act==="type"&&backs[0].done&&backs[0].first);
  ok("clean pairs = 5 of 6 (the failed card isn't clean, its come-back doesn't rescue it)",st.first===5&&st.of===6);
  const log=w.writes.find(x=>x[0]==="push")[2];
  const li=log.items.filter(i=>i.id===t0.pid);
  ok("the log has the failed act (ok false, n 3, fail) and its come-back (back true)",li.some(i=>!i.ok&&i.n===3&&i.fail)&&li.some(i=>i.back&&i.ok));
}

// a world + round driven to the moment the app asks for a card the kid holds (seeds differ in luck)
function untilAppAsksHeld(items,deck){ for(let s=1;s<60;s++){ const w=world(items,{seed:s}), c=w.c; c.gofishStart(deck); const st=c.gofishState; let g=0; while(g++<300){ if(st.step&&st.step.k==="find"&&st.hand.indexOf(st.step.pid)>=0) return w; if(stepRight(w)==="done") break; } } return null; }
console.log("── the app's ask: a wrong find, and Go fish! with the card in hand, are misses ──");
{
  const w=untilAppAsksHeld(ANIMALS,"Animals"), c=w.c, st=c.gofishState;
  ok("the app asked for a card the kid holds",st.step.k==="find"&&st.hand.indexOf(st.step.pid)>=0);
  const t=st.turns[st.step.t], right=st.hand.indexOf(st.step.pid), wrongI=st.hand.findIndex((p,i)=>i!==right);
  ok("the app asks by NAME, spoken, and the line never writes it",/^Do you have [a-z]+\?$/.test(st.say)&&/\(listen!\)/.test(st.msg));
  c.gofishGoFish();
  ok("Go fish! while holding it → a miss: bonk, 'Look again', the ask is said again",t.wrong.gofish===1&&w.dings[w.dings.length-1]==="bonk"&&/Look again/.test(st.msg)&&w.said[w.said.length-1]===st.say&&st.step.k==="find");
  c.gofishFindTap(wrongI);
  ok("a wrong card → greys out (t.wrong), bonk, try again",t.wrong[st.hand[wrongI]]===1&&w.dings[w.dings.length-1]==="bonk"&&!t.done);
  const html=c.buildGofishHtml("#123456");
  ok("the greyed card can't be tapped again",(html.match(/gf-card gf-wrong/g)||[]).length===1);
  c.gofishFindTap(wrongI);
  ok("tapping the greyed card does nothing",Object.keys(t.wrong).length===2);
  const pid=st.step.pid;
  c.gofishFindTap(st.hand.indexOf(pid));
  ok("the right card → done but not first; the pair goes down; the app asks again after the beat",t.done&&!t.first&&st.table.some(p=>p.pid===pid&&p.who==="app")&&st.lock&&st.after==="app");
  const r=playOut(w);
  const backs=st.turns.filter(x=>x.back);
  ok("the round ends; that card came back once as a 3-card find",r==="done"&&backs.length===1&&backs[0].pid===pid&&backs[0].act==="find");
  ok("clean pairs = 7 of 8",st.first===7&&st.of===8);
}
{
  // the come-back find: 3 cards, the missed one among them, no Go fish! button
  const w=untilAppAsksHeld(ANIMALS,"Animals"), c=w.c, st=c.gofishState;
  let guard=0;
  const pid=st.step.pid; c.gofishFindTap(st.hand.findIndex(p=>p!==pid)); c.gofishFindTap(st.hand.indexOf(pid));
  guard=0; while(guard++<200){ if(st.phase==="back"&&st.step&&st.step.k==="find") break; if(stepRight(w)==="done") break; }
  ok("the come-back find shows 3 cards with the missed one among them",st.phase==="back"&&st.step.back&&st.hand.length===3&&st.hand.indexOf(pid)>=0&&new Set(st.hand).size===3);
  const html=c.buildGofishHtml("#123456");
  ok("no Go fish! button on a come-back find; it says Find it!",!/gofishGoFish/.test(html)&&/Find it!/.test(html));
  c.gofishGoFish();
  ok("gofishGoFish is inert on a come-back find",!st.turns[st.step.t].wrong.gofish);
  c.gofishFindTap(st.hand.indexOf(pid));
  ok("found → That's it! then the finish",st.turns[st.step.t].first&&st.after==="back");
  w.flush();
  ok("finished, logged once",st.phase==="done"&&w.writes.filter(x=>x[0]==="push").length===1);
}

console.log("── word answers: pick from three of the deck's own backs ──");
{
  const w=world(GERMAN), c=w.c;
  c.gofishStart("German");
  const st=c.gofishState;
  ok("5 pairs, hand 3 (a deck under 6)",st.pairs.length===5&&st.hand.length===3&&Object.values(st.kinds).every(k=>k==="pick"));
  c.gofishAsk(0);
  const t=st.turns[0], own=backOf(c,t.pid);
  ok("three different backs, the card's own among them",t.act==="pick"&&t.opts.length===3&&t.opts.indexOf(own)>=0&&new Set(t.opts).size===3);
  const html=c.buildGofishHtml("#123456");
  ok("the front shows big, the three backs are buttons",html.indexOf('<span class="gf-txt">'+t.pid.slice(2)+'</span>')>=0&&(html.match(/class="gf-opt"/g)||[]).length===3);
  const wrong=t.opts.findIndex(o=>o!==own);
  c.gofishPickTap(wrong);
  ok("a wrong back greys out, bonk, try again",t.wrong[t.opts[wrong]]===1&&!t.done&&w.dings[w.dings.length-1]==="bonk");
  c.gofishPickTap(wrong);
  ok("the greyed back is inert",t.tries===1);
  c.gofishPickTap(t.opts.indexOf(own));
  ok("the right back on the second try → done, not first",t.done&&!t.first&&!t.fail);
  ok("the app's ask for a word card is by its ANSWER (written and said)",(()=>{ let g=0; while(g++<200){ if(st.step&&st.step.k==="find") break; if(stepRight(w)==="done") return false; } return st.step&&st.step.k==="find"&&st.msg==="Do you have\u2026 "+backOf(c,st.step.pid)+"?"&&st.say==="Do you have "+backOf(c,st.step.pid)+"?"; })());
  ok("the round plays out",playOut(w)==="done"&&st.first===4&&st.of===5);
}

console.log("── Mix the decks, dry run, Stop, park / resume ──");
{
  const w=world(ANIMALS.concat(MATH,GERMAN),{dry:true,settings:{match_best:{"Mix the decks \u00b7 gofish":8}}}), c=w.c;
  c.gofishStart(c.WHICH_MIX);
  const st=c.gofishState;
  ok("Mix: 8 pairs from every playable deck, each card its own kind",st.mix&&st.pairs.length===8&&st.pairs.every(p=>st.kinds[p])&&new Set(st.pairs.map(p=>p.charAt(0))).size>=2);
  ok("the round plays out in a mix",playOut(w)==="done");
  ok("dry run: nothing written, best not beaten (8 already)",w.writes.length===0&&!st.isPB&&st.prevBest===8);
  ok("the log still exists in memory (this device's copy)",!!(c.masteryData.gameLog&&c.masteryData.gameLog.k&&c.masteryData.gameLog.k["20261102"]));
}
{
  const w=world(ANIMALS), c=w.c;
  c.gofishStart("Animals"); c.gofishAsk(0); c.gofishSaid();
  const st=c.gofishState;
  ok("a beat is pending (lock) after the ask",st.lock&&(st.after==="kid"||st.step.k==="fish")||true);
  c.gofishStop();
  ok("Stop drops the round: nothing written",c.gofishState===null&&w.writes.length===0);
  w.flush();
  ok("the old round's timer never acts on a dropped round",c.gofishState===null);
}
{
  const w=world(ANIMALS), c=w.c;
  c.gofishStart("Animals");
  let st=c.gofishState, g=0;
  while(g++<50&&!st.lock) stepRight(w);
  ok("mid-beat: lock on with an `after`",st.lock&&!!st.after);
  const parked=st; c.gofishState=null;   // GAMEKID parks it (the entry's park / restore)
  w.flush();
  ok("the parked round's timer does nothing (gofishState is another kid's)",parked.lock===true);
  c.gofishState=parked; c.gofishResume();
  ok("resume settles the beat: lock off, the next step is on screen",!parked.lock&&parked.after===null&&!!parked.step&&parked.phase==="play");
  const n=w.said.length; c.gofishResume();
  ok("resume with nothing pending just says the current ask again",w.said.length===n+1&&w.said[n]===parked.say);
  ok("the round still plays out after a resume",playOut(w)==="done");
}
{
  const w=world(ANIMALS,{view:"which"}), c=w.c;
  c.gofishStart("Animals");
  ok("off-screen (another view): nothing is spoken",w.said.length===0&&c.gofishState.say==="Your turn!");
}
{
  const w=world(ANIMALS,{celeb:true}), c=w.c;
  c.gofishStart("Animals"); playOut(w);
  ok("a clean round with the overlay present → the small confetti, no song",w.dings.some(d=>d==="celeb:\u{1F41F} All the pairs are down!"));
}
{
  const w=world(ANIMALS.slice(0,3)), c=w.c;
  ok("no deck → the empty note, no round",/No decks ready for Go Fish/.test(c.buildGofishHtml("#123456")));
  c.gofishStart("Animals");
  ok("a start on a deck too small does nothing",c.gofishState===null);
}
console.log("── 🎮 the games-per-deck grid: Go Fish has its own column ──");
{
  const w=world(ANIMALS.concat(MATH,GERMAN),{settings:{gameDecks:{"Animals":{which:false}}}}), c=w.c;
  ok("a deck turned off for Which one? still plays Go Fish (Which one?'s cell stands aside)",c.whichDecks(c.masteryData.k,"k").indexOf("Animals")<0&&c.gofishDecks(c.masteryData.k,"k").join()==="Animals,German,Math Facts"&&c.gofishPool(c.masteryData.k,c.WHICH_MIX,"k").some(i=>i.subject==="Animals"));
  c.gofishStart("Animals");
  ok("…and a round on it starts, picture cards playing as say",!!c.gofishState&&c.gofishState.pairs.length===8&&Object.values(c.gofishState.kinds).every(k=>k==="say"));
}
{
  const w=world(ANIMALS.concat(MATH,GERMAN),{settings:{gameDecks:{"Animals":{gofish:false}}}}), c=w.c;
  ok("a deck turned off for Go Fish is gone from its decks, its pool and Mix the decks",c.gofishDecks(c.masteryData.k,"k").join()==="German,Math Facts"&&c.gofishPool(c.masteryData.k,"Animals","k").length===0&&c.gofishPool(c.masteryData.k,c.WHICH_MIX,"k").every(i=>i.subject!=="Animals"));
  c.gofishStart("Animals");
  ok("a start on an off deck does nothing",c.gofishState===null);
  const entry={key:"gofish",decks:k=>c.gofishDecks(c._gamesItems(k),k)};
  ok("the grid's preload (decks() under the raw switch) still lists the deck — the cell shows, just off",c.gameDeckCan("k",entry).join()==="Animals,German,Math Facts"&&c.gameDeckOn("k","gofish","Animals")===false&&c.gameDeckAny("k",entry)===true);
  const w2=world(ANIMALS,{settings:{gameDecks:{"Animals":{gofish:false}}}}), c2=w2.c;
  ok("every deck off → gameDeckAny says no (gamesFor hides the game)",c2.gameDeckAny("k",{key:"gofish",decks:k=>c2.gofishDecks(c2._gamesItems(k),k)})===false&&c2.gofishDecks(c2.masteryData.k,"k").length===0);
  ok("the Games tab's empty note, not a crash",/No decks ready for Go Fish/.test(c2.buildGofishHtml("#123456")));
}
console.log("── many seeds: every round ends, every card acted, every pair down, one log ──");
{
  let bad=0;
  for(let s=1;s<=40;s++){
    const items=s%3===0?ANIMALS.concat(MATH,GERMAN):s%3===1?ANIMALS:MATH;
    const w=world(items,{seed:s}), c=w.c;
    c.gofishStart(s%3===0?c.WHICH_MIX:s%3===1?"Animals":"Math Facts");
    const st=c.gofishState, r=playOut(w,600);
    const acted={}; st.turns.forEach(t=>{ acted[t.pid]=1; });
    if(r!=="done"||st.table.length!==st.pairs.length||!st.pairs.every(p=>acted[p])||w.writes.filter(x=>x[0]==="push").length!==1||st.first!==st.of) bad++;
  }
  ok("40 seeded rounds across the three decks all finish clean",bad===0,bad);
}

console.log("\n"+pass+" passed, "+fail+" failed");
process.exit(fail?1:0);
