/*
 * 💥 Kaboom (her go via the hub 2026-11-03; PLAN_practice_games_2026-10-23.md Tier 2 "Kaboom: draw a stick from the jar: say the card;
 * a KABOOM stick means put them back (laughter, no loss of progress)"). Draw a stick, produce its card (say / type / pick), keep it; a
 * KABOOM stick sends the pile back into the jar as come-backs — the first-try count never drops. Misses once at the end. gameLogRound
 * (game "kaboom"); match_best "<deck> · kaboom" only when beaten; never the ladder. Runs the REAL code with timers by hand.
 *   run:  node test_kaboom.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
let pass=0, fail=0;
function ok(n,c,x){ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":""));} }
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("markers "+a); return src.slice(i,j); };
function fnText(name){ const i=src.indexOf("function "+name+"("); if(i<0) return ""; const j=src.indexOf("\nfunction ",i+10); return src.slice(i,j<0?undefined:j); }
const seeded=seed=>{ let x=seed||7; return ()=>{ x=(x*1103515245+12345)&0x7fffffff; return (x%10000)/10000; }; };

// ── by text ──
const a=src.indexOf("// KABOOM_START"), b=src.indexOf("// KABOOM_END"), sp=src.indexOf("// SPELLBUILD_END"), sc=src.indexOf("// STUDYCOUNTS_START");
ok("one KABOOM block among the game blocks: after SPELLBUILD_END, before STUDYCOUNTS_START, straight after another block's _END line",sp>0&&a>sp&&b>a&&sc>b&&/^\/\/ [A-Z_]+_END$/m.test(src.slice(sp,a).trim().split("\n").pop()||"")&&src.indexOf("// KABOOM_START",a+1)<0&&src.indexOf("// KABOOM_END",b+1)<0);
ok("the games' own position tests still hold: nothing new between SPELLBUILD_END and GOFISH_START",!/\n(?!\/\/ (BRAINDUMP|BINGO|SORTIT|GOFISH)_)[^\n]*(_START|_END)/.test(src.slice(sp+18,src.indexOf("// GOFISH_START"))));
const blk=src.slice(a,b), code=blk.replace(/^\s*\/\/.*$/gm,"");
ok("no kid's name in the block",!/lincoln|ellis|lucy|julian|caleb|taylor|makenzie|kenzie|andrew/i.test(blk));
ok("no 🔀 anywhere in index.html",src.indexOf("\u{1F500}")<0);
ok("writes: match_best one key (guarded) + gameLogRound — nothing else, no set / remove / push of its own",/db&&!_dryRun\(\)\) db\.ref\("mastery\/"\+kid\+"_settings\/match_best"\)\.update\(\{\[key\]:st\.first\}\)/.test(blk)&&/gameLogRound\(st\)/.test(blk)&&(code.match(/db\.ref\(/g)||[]).length===1&&!/\.set\(|\.remove\(|\.push\(\{|next_due|studyLog|consecutive_correct/.test(code.replace(/turns\.push|pile\.push|backs\.push|jar\.push\(\{pid:p,back:true\}\)/g,"")));
ok("GAMES_LIST: Kaboom right after Unjumble, with park / restore / resume and decks for the grid",/resume:\(\)=>jumbleResume\(\), decks:k=>typeof ujDecks==="function"\?ujDecks\(_gamesItems\(k\),k\):\[\]\},[^\n]*\n  \{key:"kaboom",\s*emoji:"\\u\{1F4A5\}", label:"Kaboom",\s*view:"kaboom",\s*available:k=>typeof kaboomDecks==="function"&&kaboomDecks\(_gamesItems\(k\),k\)\.length>0, render:c=>buildKaboomHtml\(c\),\n\s*park:\(\)=>kaboomState, restore:v=>\{ kaboomState=v\|\|null; \}, resume:\(\)=>kaboomResume\(\), decks:k=>typeof kaboomDecks==="function"\?kaboomDecks\(_gamesItems\(k\),k\):\[\]\},/.test(src));
ok("gamesCurrentKey / GAMEKID untouched (the entry does it)",!/kaboom/i.test(fnText("gamesCurrentKey"))&&!/kaboomState|kaboomResume/.test(cut("// GAMEKID_START","// GAMEKID_END")));
ok("no lives, no clock, no leaderboard, no points, no steals; the start tap unlocks audio; the honor tap is documented",!/lives|hearts|leaderboard|bankDirect|steal|setInterval/i.test(code)&&/bbAudioUnlock\(\)/.test(blk)&&/honor system/.test(blk));
ok("every timer checks its own round and sequence (a parked round never advances)",(code.match(/setTimeout\(/g)||[]).length===3&&(code.match(/kaboomState===st&&st\.lock&&st\.seq===seq/g)||[]).length===3);
ok("a missed answer is never written on screen (the come-back line only); a picture's name is said, not written",/We\\u2019ll come back to that one\./.test(code)&&/"What is it\?"/.test(code)&&!/msg=.*_whichBack/.test(code));

// ── a sandbox: WHICHONE + GAMELOG + GAMEGRID + KABOOM, a kid's cards, a recording db, timers by hand ──
const P=(n,emoji,extra)=>Object.assign({id:"p_"+n,subject:"Animals",prompt:n,emoji:emoji,status:"active",tier:"daily"},extra||{});
const M=(f,ans,extra)=>Object.assign({id:"m_"+f,subject:"Math Facts",prompt:f,answer:ans,status:"active",tier:"daily"},extra||{});
const G=(f,ans)=>({id:"g_"+f,subject:"German",prompt:f,answer:ans,status:"active",tier:"daily"});
const ANIMALS=[P("cat","🐱"),P("dog","🐶"),P("cow","🐮"),P("pig","🐷"),P("fox","🦊"),P("owl","🦉"),P("bee","🐝"),P("ant","🐜"),P("hen","🐔"),P("elk","🦌")];
const MATH=[M("7+8","15"),M("6+6","12"),M("9+4","13"),M("5+5","10"),M("8+3","11"),M("2+7","9")];
const GERMAN=[G("gut","well"),G("ich","I"),G("du","you"),G("ja","yes"),G("nein","no")];
const SPELL=[{id:"s_1",subject:"AAS Words",prompt:"red",status:"introduction"},{id:"s_2",subject:"AAS Words",prompt:"bed",status:"introduction"},{id:"s_3",subject:"AAS Words",prompt:"fed",status:"introduction"},{id:"s_4",subject:"AAS Words",prompt:"led",status:"introduction"}];
function world(items,o){
  o=o||{};
  const writes=[], said=[], dings=[], timers=[];
  const CODE=cut("// WHICHONE_START","// WHICHONE_END")+"\n"+cut("// GAMELOG_START","// GAMELOG_END")+"\n"+cut("// GAMEGRID_START","// GAMEGRID_END")+"\n"+cut("// KABOOM_START","// KABOOM_END");
  const ctx={console,JSON,Object,Array,String,Number,Math,Set,Map,RegExp,Date,parseInt,isNaN,setTimeout:(f,ms)=>{ timers.push({f,ms}); return timers.length; },
    document:{getElementById:()=>o.celeb?{}:null},
    _dryRun:()=>!!o.dry,HA_LS:{setItem(){}},_mastRe(){},bbAudioUnlock(){},momHere:()=>true,renderAll(){},
    _gamesItems:k=>(k==="k"?items||[]:[]),
    _smTileVis:it=>(it&&it.emoji?'<span class="memoji">'+it.emoji+'</span>':null),
    _matchPlain:h=>String(h||"").replace(/<[^>]*>/g," ").replace(/\s+/g," ").trim(),
    esc:s=>String(s||"").replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;"),
    mastSpeak:(t)=>said.push(t),matchDing:()=>dings.push("ding"),matchBonk:()=>dings.push("bonk"),_showCelebration:(k,t)=>dings.push("celeb:"+t),
    mstTodayKey:()=>"20261103",mastView:o.view||"kaboom",masteryKid:"k",
    masteryData:{k:items||[],k_settings:o.settings||{}},
    db:{ref:p=>({set:v=>writes.push(["set",p,v]),update:v=>writes.push(["update",p,v]),push:v=>writes.push(["push",p,v]),remove:()=>writes.push(["remove",p])})}};
  vm.createContext(ctx);
  vm.runInContext(CODE+"\nObject.defineProperty(this,'kaboomState',{get:()=>kaboomState,set:v=>{kaboomState=v;}}); Object.defineProperty(this,'_kbRandom',{get:()=>_kbRandom,set:v=>{_kbRandom=v;}}); this.KB_CARDS=KB_CARDS; this.KB_BOOMS=KB_BOOMS; this.KB_MIN=KB_MIN; this.KB_BEAT=KB_BEAT; this.KB_BEAT_BOOM=KB_BEAT_BOOM; this.WHICH_MIX=WHICH_MIX;",ctx);
  ctx._kbRandom=seeded(o.seed||3);
  const flush=()=>{ while(timers.length){ const x=timers.shift(); x.f(); } };
  return {c:ctx,writes,said,dings,timers,flush};
}
const backOf=(c,pid)=>c._whichBack(c.masteryData.k.find(x=>x.id===pid));
// answer the open card right (or wrong when bad=true), once
function answer(w,bad){
  const c=w.c, st=c.kaboomState, t=st.turns[st.open.t];
  if(t.act==="say"){ c.kaboomSaid(); return; }
  if(t.act==="type"){ const s=bad?"777":backOf(c,t.pid); for(const ch of s) c.kaboomKey(ch); c.kaboomCheck(); return; }
  const right=backOf(c,t.pid); c.kaboomPickTap(bad?t.opts.findIndex(o=>o!==right&&!t.wrong[o]):t.opts.indexOf(right));
}
// play the whole round right, drawing every stick
function playOut(w){ const c=w.c; let g=0; while(c.kaboomState.phase!=="done"&&g++<80){ const st=c.kaboomState; if(st.lock){ w.flush(); continue; } if(st.open){ answer(w); continue; } c.kaboomDraw(); } }

console.log("── the jar (pure) ──");
{ const w=world([]), c=w.c;
  let fine=true;
  for(let i=0;i<60;i++){ const pids=["a","b","c","d","e","f","g","h"], jar=c.kaboomJar(pids,2);
    if(jar.length!==10||jar[0].boom||jar.filter(s=>s.boom).length!==2) fine=false;
    const seen={}; jar.forEach(s=>{ if(s.pid) seen[s.pid]=(seen[s.pid]||0)+1; }); if(Object.keys(seen).length!==8||Object.values(seen).some(n=>n!==1)) fine=false; }
  ok("8 cards + 2 KABOOM sticks, every card once, a KABOOM never the first draw",fine);
}
console.log("── which decks ──");
{ const w=world(ANIMALS.concat(MATH,GERMAN,SPELL)), c=w.c;
  ok("Which one?'s decks with 4+ cards: pictures, number backs, word backs; spelling stays out",c.kaboomDecks(c.masteryData.k).join(",")==="Animals,German,Math Facts");
  const three=world(ANIMALS.slice(0,3)); ok("three cards → no deck, the empty note",three.c.kaboomDecks(three.c.masteryData.k).length===0&&/No decks ready for Kaboom/.test(three.c.buildKaboomHtml("#000")));
  const off=world(ANIMALS.concat(MATH),{settings:{gameDecks:{Animals:{kaboom:false}}}});
  ok("🎮 GAMEGRID: a deck Mom turned off for Kaboom is out; its own column (off for Which one? still plays)",off.c.kaboomDecks(off.c.masteryData.k).join(",")==="Math Facts"&&(()=>{ const w2=world(ANIMALS.concat(MATH),{settings:{gameDecks:{Animals:{which:false}}}}); return w2.c.kaboomDecks(w2.c.masteryData.k).length===2; })());
  ok("the grid's preload (asked raw) still lists a turned-off deck, so Mom can turn it back on",off.c.gameDeckCan("k",{key:"kaboom",decks:k=>off.c.kaboomDecks(off.c.masteryData.k,k)}).indexOf("Animals")>=0);
  off.c.kaboomStart("Animals"); ok("…and it cannot be started",off.c.kaboomState===null);
  ok("the acts: a picture is said, a number back typed, a word back picked",c.kaboomKind(ANIMALS[0],"picture")==="say"&&c.kaboomKind(MATH[0],"answer")==="type"&&c.kaboomKind(GERMAN[0],"answer")==="pick");
}
console.log("── a round: draw, say / type / pick, a KABOOM, the come-backs, the writes ──");
{ const w=world(ANIMALS.concat(MATH,GERMAN)), c=w.c;
  c.kaboomStart("Animals"); const st=c.kaboomState;
  ok("a jar of 8 card sticks + 2 KABOOM, an empty pile, nothing said yet",st&&st.phase==="play"&&st.jar.length===10&&st.of===8&&st.pile.length===0&&st.game==="kaboom"&&st.kid==="k"&&w.said.length===0);
  const h0=c.buildKaboomHtml("#000");
  ok("the screen: the jar to tap, sticks that show nothing, the empty pile",/kaboomDraw\(\)/.test(h0)&&!/cat|dog|cow|pig/.test(h0.replace(/kaboomStart\('Animals'\)/g,""))&&/your pile/.test(h0));
  // put a known order in the jar: card, card, BOOM, card, card…
  const pids=st.jar.filter(s=>s.pid).map(s=>s.pid); st.jar=[{pid:pids[0]},{pid:pids[1]},{boom:true},{pid:pids[2]},{pid:pids[3]},{pid:pids[4]},{boom:true},{pid:pids[5]},{pid:pids[6]},{pid:pids[7]}];
  c.kaboomDraw(); let t=st.turns[0];
  ok("draw → the card opens as a say act, the name NOT written, \"What is it?\" said",st.open&&t.act==="say"&&t.pid===pids[0]&&w.said.slice(-1)[0]==="What is it?"&&c.buildKaboomHtml("#000").indexOf(">"+pids[0].slice(2)+"<")<0&&/I said it/.test(c.buildKaboomHtml("#000")));
  c.kaboomDraw(); ok("the jar can't be drawn while a card is open",st.turns.length===1);
  c.kaboomSaid();
  ok("🗣 → right, the ding, the name said back, the stick in the pile, first-try 1, a beat",t.done&&t.first&&st.first===1&&st.pile.length===1&&w.dings.slice(-1)[0]==="ding"&&/^cat\. That|^dog\. That|^\w+\. That\u2019s it!$/.test(w.said.slice(-1)[0])&&st.lock);
  w.flush(); ok("after the beat: the jar again",!st.lock&&!st.open&&/Tap the jar/.test(st.msg));
  c.kaboomDraw(); c.kaboomSaid(); w.flush();
  ok("second card kept: pile 2, first 2",st.pile.length===2&&st.first===2);
  c.kaboomDraw();
  ok("KABOOM! → the bonk, the laugh line said, both sticks back in the jar as come-backs, the pile empty, first-try count KEPT",st.booms===1&&st.boomNow&&w.dings.slice(-1)[0]==="bonk"&&/^KABOOM!/.test(w.said.slice(-1)[0])&&st.pile.length===0&&st.jar.filter(s=>s.back).length===2&&st.first===2&&/KABOOM/.test(c.buildKaboomHtml("#000"))&&w.timers[0].ms===c.KB_BEAT_BOOM);
  w.flush();
  // drain: every remaining stick; count come-back turns and the second boom
  let backs=0, g=0; while(st.phase==="play"&&g++<120){ if(st.lock){ w.flush(); continue; } if(st.open){ const tt=st.turns[st.open.t]; if(tt.back) backs++; answer(w); continue; } c.kaboomDraw(); }
  ok("the returned sticks were asked again as come-backs (their rights count for nothing), the second KABOOM hit, the jar emptied",backs>=2&&st.booms===2&&st.jar.length===0&&st.first===8);
  w.flush(); g=0; while(st.phase!=="done"&&g++<120){ if(st.lock){ w.flush(); continue; } if(st.open){ answer(w); continue; } c.kaboomDraw(); }
  ok("a clean round: 8 of 8 on the first try, no end come-backs",st.phase==="done"&&st.first===8&&st.of===8&&st.backs.length===0);
  const mb=w.writes.filter(x=>x[1]==="mastery/k_settings/match_best"), gl=w.writes.filter(x=>x[0]==="push"&&x[1]==="mastery/gameLog/k/20261103");
  ok("writes: match_best ONE key, update, only this game's key; ONE gameLog push with game kaboom, the come-backs marked",mb.length===1&&mb[0][0]==="update"&&JSON.stringify(mb[0][2])==="{\"Animals · kaboom\":8}"&&gl.length===1&&gl[0][2].game==="kaboom"&&gl[0][2].items.filter(i=>!i.back).length===8&&gl[0][2].items.filter(i=>i.back).length>=2&&w.writes.length===2);
  ok("the finish: the count, the kabooms, Play again / Mix",/8 of 8 on the first try/.test(c.buildKaboomHtml("#000"))&&/2 kabooms/.test(c.buildKaboomHtml("#000"))&&/new best/.test(c.buildKaboomHtml("#000"))&&/Mix the decks/.test(c.buildKaboomHtml("#000")));
}
console.log("── type and pick, a miss, a fail that comes back at the end ──");
{ const w=world(MATH.concat(GERMAN,ANIMALS)), c=w.c;
  c.kaboomStart("Math Facts"); const st=c.kaboomState; st.jar=st.jar.filter(s=>!s.boom);   // no KABOOM this round: the come-backs alone
  c.kaboomDraw(); let t=st.turns[0];
  ok("a number back: the number pad, the front shown big and said",t.act==="type"&&/kaboomKey\('7'\)/.test(c.buildKaboomHtml("#000"))&&w.said.slice(-1)[0]===c.masteryData.k.find(x=>x.id===t.pid).prompt);
  answer(w,true);
  ok("a wrong number → the bonk, \"Almost\", one more try, the typed box cleared",!t.done&&t.tries===1&&w.dings.slice(-1)[0]==="bonk"&&/Almost/.test(st.msg)&&t.typed==="");
  answer(w);
  ok("then right → done, not first, in the pile, the count stays 0",t.done&&!t.first&&st.pile.length===1&&st.first===0);
  w.flush(); c.kaboomDraw(); t=st.turns[1]; answer(w,true); answer(w,true);
  ok("wrong twice → fail: \"We'll come back to that one\", NOT in the pile, the answer never written",t.fail&&t.done&&st.pile.length===1&&/come back to that one/.test(st.msg)&&st.msg.indexOf(backOf(c,t.pid))<0&&!/That\u2019s it/.test(st.msg));
  w.flush(); let g=0; while(st.phase==="play"&&g++<40){ if(st.lock){ w.flush(); continue; } if(st.open){ answer(w); continue; } c.kaboomDraw(); }
  ok("the jar empties → the two missed cards come back once (the end's come-backs)",st.phase==="back"&&st.backs.length+st.turns.filter(t=>t.back).length===2);
  w.flush(); ok("the first come-back opens as a come-back turn",st.open&&st.turns[st.open.t].back&&/One more time/.test(st.msg));
  g=0; while(st.phase!=="done"&&g++<40){ if(st.lock){ w.flush(); continue; } if(st.open){ answer(w); continue; } c.kaboomDraw(); }
  ok("the round ends: 4 of 6 on the first try; no confetti",st.phase==="done"&&st.first===4&&st.of===6&&!w.dings.some(x=>/celeb/.test(x)));
  const gl=w.writes.find(x=>x[0]==="push");
  ok("the log: 6 first asks (4 ok, 1 fail), 2 come-backs",gl[2].items.filter(i=>!i.back).length===6&&gl[2].items.filter(i=>!i.back&&i.ok).length===4&&gl[2].items.filter(i=>i.fail).length===1&&gl[2].items.filter(i=>i.back).length===2);
  c.kaboomStart("German"); const st2=c.kaboomState; st2.jar=st2.jar.filter(s=>!s.boom); const n2=w.said.length; c.kaboomDraw(); const t2=st2.turns[0];
  ok("a word back: three of the deck's own backs to pick from, the front shown but NOT said (silent language)",t2.act==="pick"&&t2.opts.length===3&&t2.opts.indexOf(backOf(c,t2.pid))>=0&&w.said.length===n2&&(c.buildKaboomHtml("#000").match(/kaboomPickTap\(/g)||[]).length===3);
  answer(w,true); ok("a wrong pick greys out, one more try",t2.tries===1&&Object.keys(t2.wrong).length===1&&/kb-opt kb-wrong/.test(c.buildKaboomHtml("#000")));
}
console.log("── dry run, the round's own kid, confetti, Stop, the Mix, resume ──");
{ const d=world(ANIMALS,{dry:true}); d.c.kaboomStart("Animals"); playOut(d);
  ok("?dryrun=1: nothing written (best and log stay in memory)",d.writes.length===0&&d.c.masteryData.k_settings.match_best["Animals \u00B7 kaboom"]===8&&d.c.masteryData.gameLog.k["20261103"]);
  const g2=world(ANIMALS); g2.c.kaboomStart("Animals"); g2.c.masteryKid="other"; playOut(g2);
  ok("the finish saves to the round's OWN kid, not the kid picked now",g2.writes.find(x=>x[0]==="update")[1]==="mastery/k_settings/match_best"&&g2.writes.find(x=>x[0]==="push")[1]==="mastery/gameLog/k/20261103");
  const cl=world(ANIMALS,{celeb:true}); cl.c.kaboomStart("Animals"); playOut(cl);
  ok("with the overlay, a clean round gets the small confetti (no song)",cl.dings.some(x=>x==="celeb:\u{1F4A5} You emptied the jar!"));
  const nb=world(ANIMALS,{settings:{match_best:{"Animals \u00B7 kaboom":8}}}); nb.c.kaboomStart("Animals"); playOut(nb);
  ok("a best that is not beaten writes no best (the log still goes)",nb.c.kaboomState.isPB===false&&nb.writes.length===1&&nb.writes[0][0]==="push");
  const s=world(ANIMALS.concat(MATH)); s.c.kaboomStart("Animals"); s.c.kaboomDraw(); s.c.kaboomStop();
  ok("Stop drops the round: nothing written",s.c.kaboomState===null&&s.writes.length===0);
  s.c.kaboomStart(s.c.WHICH_MIX); const m=s.c.kaboomState;
  ok("the Mix: 8 cards from both decks, both acts in the jar",m.mix===true&&m.of===8&&new Set(m.jar.filter(x=>x.pid).map(p=>p.pid.charAt(0))).size===2);
  const r=world(ANIMALS), rc=r.c; rc.kaboomStart("Animals"); rc.kaboomState.jar=rc.kaboomState.jar.filter(s=>!s.boom); rc.kaboomDraw(); rc.kaboomSaid(); const st=rc.kaboomState;
  ok("mid-beat: locked",st.lock&&st.open);
  rc.kaboomResume(); ok("resume settles the beat: the jar again, no timer needed",!st.lock&&!st.open&&/Tap the jar/.test(st.msg));
  r.flush(); ok("the old timer after a resume does nothing",!st.open&&st.turns.length===1);
  rc.kaboomDraw(); const n=r.said.length; rc.kaboomResume();
  ok("resume with a card open says the ask again",r.said.length===n+1&&st.open);
  const v=world(ANIMALS,{view:"which"}); v.c.kaboomStart("Animals"); v.c.kaboomDraw();
  ok("not on screen → no speech",v.said.length===0);
}
console.log("\n"+pass+" passed, "+fail+" failed");
process.exit(fail?1:0);
