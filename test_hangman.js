/*
 * 🎈 Hangman from definitions (her go via the hub 2026-11-03; PLAN_practice_games_2026-10-23.md Tier 3 "Hangman / Crossword from
 * definitions"). The card's BACK is the cue, the kid taps letters to find the FRONT; six balloons, one pops per wrong letter; after three
 * misses the word may be HEARD (never shown); a word not found is never written out and comes back once at the end. gameLogRound
 * (game "hang"); match_best "<deck> · hang" only when beaten; never the ladder. Runs the REAL code with timers by hand.
 *   run:  node test_hangman.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
let pass=0, fail=0;
function ok(n,c,x){ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":""));} }
const src=require("./test_src.js")(path.join(__dirname,"index.html"));
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("markers "+a); return src.slice(i,j); };
function fnText(name){ const i=src.indexOf("function "+name+"("); if(i<0) return ""; const j=src.indexOf("\nfunction ",i+10); return src.slice(i,j<0?undefined:j); }
const seeded=seed=>{ let x=seed||7; return ()=>{ x=(x*1103515245+12345)&0x7fffffff; return (x%10000)/10000; }; };

// ── by text ──
const a=src.indexOf("// HANGMAN_START"), b=src.indexOf("// HANGMAN_END"), sp=src.indexOf("// SPELLBUILD_END"), sc=src.indexOf("// STUDYCOUNTS_START");
ok("one HANGMAN block among the game blocks: after SPELLBUILD_END, before STUDYCOUNTS_START, straight after another block's _END line",sp>0&&a>sp&&b>a&&sc>b&&/^\/\/ [A-Z_]+_END$/m.test(src.slice(sp,a).trim().split("\n").pop()||"")&&src.indexOf("// HANGMAN_START",a+1)<0&&src.indexOf("// HANGMAN_END",b+1)<0);
ok("the games' own position tests still hold: nothing new between SPELLBUILD_END and GOFISH_START",!/\n(?!\/\/ (BRAINDUMP|BINGO|SORTIT|GOFISH)_)[^\n]*(_START|_END)/.test(src.slice(sp+18,src.indexOf("// GOFISH_START"))));
const blk=src.slice(a,b), code=blk.replace(/^\s*\/\/.*$/gm,"");
ok("no kid's name in the block",!/lincoln|ellis|lucy|julian|caleb|taylor|makenzie|kenzie|andrew/i.test(blk));
ok("no 🔀 anywhere in index.html",src.indexOf("\u{1F500}")<0);
ok("writes: match_best one key (guarded) + gameLogRound — nothing else, no set / remove / push of its own",/db&&!_dryRun\(\)\) db\.ref\("mastery\/"\+kid\+"_settings\/match_best"\)\.update\(\{\[(?:key|\(typeof haKey==="function"\?haKey\(key\):key\))\]:st\.first\}\)/.test(blk)&&/gameLogRound\(st\)/.test(blk)&&(code.match(/db\.ref\(/g)||[]).length===1&&!/\.set\(|\.remove\(|\.push\(\{|next_due|studyLog|consecutive_correct/.test(code.replace(/turns\.push|out\.push|\.push\(\{pid:i\.id|\.push\(\{ch:/g,"")));
ok("GAMES_LIST: Hangman right after Kaboom, with park / restore / resume and decks for the grid",/resume:\(\)=>kaboomResume\(\), decks:k=>typeof kaboomDecks==="function"\?kaboomDecks\(_gamesItems\(k\),k\):\[\]\},[^\n]*\n  \{key:"hang",\s*emoji:"\\u\{1F388\}", label:"Hangman",\s*view:"hang",\s*available:k=>typeof hangAvail==="function"&&hangAvail\(k\), render:c=>buildHangHtml\(c\),\n\s*park:\(\)=>hangState, restore:v=>\{ hangState=v\|\|null; \}, resume:\(\)=>hangResume\(\), decks:k=>typeof hangDecks==="function"\?hangDecks\(_gamesItems\(k\),k\):\[\]\},/.test(src));
ok("gamesCurrentKey / GAMEKID untouched (the entry does it)",!/hang/i.test(fnText("gamesCurrentKey"))&&!/hangState|hangResume/.test(cut("// GAMEKID_START","// GAMEKID_END")));
ok("no lives beyond the balloons, no clock, no leaderboard, no points; the start tap unlocks audio",!/lives|hearts|leaderboard|bankDirect|setInterval/i.test(code)&&/bbAudioUnlock\(\)/.test(blk));
ok("the one timer checks its own round and sequence (a parked round never advances)",(code.match(/setTimeout\(/g)||[]).length===1&&/hangState===st&&st\.lock&&st\.seq===seq/.test(code));
ok("the word is never written out: no t.word in the screen, the finish lists no words; the fail line is the come-back line",!/esc\(t\.word\)|\+t\.word\+|esc\(x\.word\)/.test(fnText("buildHangHtml"))&&/We\\u2019ll come back to that one/.test(code)&&/mastSpeak\(t\.word\)/.test(fnText("hangHear")));

// ── a sandbox: WHICHONE (left-out / silent rules) + GAMELOG + GAMEGRID + HANGMAN + dcLevel + mastGetDef, a kid's cards, a recording db, timers by hand ──
const C=(deck,front,back,extra)=>Object.assign({id:(deck+"_"+front).replace(/\W+/g,"_"),subject:deck,prompt:front,answer:back,status:"active",tier:"weekly"},extra||{});
const ROOTS=[["geo","earth"],["chron","time"],["morph","form"],["bene","good"],["mal","bad"],["tele","far"],["micro","small"],["photo","light"]].map(x=>C("Roots",x[0],x[1]));
const VOCAB=[["abundant","existing in large quantities; plentiful"],["accumulate","to gather or collect over time"],["barren","empty and bare, unable to support growth"],["solar system","the sun and everything that goes around it"],["T-shirt","a shirt with short sleeves"]].map(x=>C("Vocabulary",x[0],x[1]));
const DEUTSCH=[["das Papier","paper"],["der Hund","dog"],["die Katze","cat"],["das Haus","house"],["die Stra\u00DFe","street"],["sch\u00F6n","pretty"]].map(x=>C("German",x[0],x[1]));
const SAME=["solar system","erosion","weathering","orbit"].map(w=>C("Science",w,w));
const MATH=[["6\u00D77","42"],["8\u00D77","56"],["9\u00D79","81"],["4\u00D77","28"]].map(x=>C("Math Facts",x[0],x[1]));
const SPELL=["ready","heavy","bread","steady"].map(w=>C("Spelling",w,"",{type:"spelling_word"}));
const GIVE=[["erosion","the erosion of soil by water"],["crust","the crust is the top layer"],["mantle","mantle: below the crust"],["core","the hot core"]].map(x=>C("Earth",x[0],x[1]));
function world(items,o){
  o=o||{};
  const writes=[], said=[], dings=[], timers=[];
  const CODE=cut("// WHICHONE_START","// WHICHONE_END")+"\n"+cut("// GAMELOG_START","// GAMELOG_END")+"\n"+cut("// GAMEGRID_START","// GAMEGRID_END")+"\n"+cut("// HANGMAN_START","// HANGMAN_END")+"\n"+fnText("dcLevel")+"\n"+fnText("mastGetDef");
  const ctx={console,JSON,Object,Array,String,Number,Math,Set,Map,RegExp,Date,parseInt,isNaN,isFinite,setTimeout:(f,ms)=>{ timers.push({f,ms}); return timers.length; },
    document:{getElementById:()=>o.celeb?{}:null},
    _dryRun:()=>!!o.dry,HA_LS:{setItem(){}},_mastRe(){},bbAudioUnlock(){},momHere:()=>true,renderAll(){},
    _gamesItems:k=>(k==="k"?items||[]:[]),
    _matchPlain:h=>String(h||"").replace(/<[^>]*>/g," ").replace(/\s+/g," ").trim(),
    esc:s=>String(s||"").replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;"),
    mastSpeak:(t)=>said.push(t),matchDing:()=>dings.push("ding"),matchBonk:()=>dings.push("bonk"),_showCelebration:(k,t)=>dings.push("celeb:"+t),
    mastKnowledgeType:it=>(it&&/math/i.test(it.subject||""))?"procedure_fluency":"fact_association",MAST_MATH_ANS:{},MAST_VOCAB_DEFS:{},
    ROSTER_DEF:o.roster||[{id:"k",grade:"4"},{id:"little",grade:"PreK"},{id:"early",grade:"1"},{id:"up",grade:"6"}],
    mstTodayKey:()=>"20261103",mastView:o.view||"hang",masteryKid:"k",
    masteryData:{k:items||[],k_settings:o.settings||{}},
    db:{ref:p=>({set:v=>writes.push(["set",p,v]),update:v=>writes.push(["update",p,v]),push:v=>writes.push(["push",p,v]),remove:()=>writes.push(["remove",p])})}};
  vm.createContext(ctx);
  vm.runInContext(CODE+"\nObject.defineProperty(this,'hangState',{get:()=>hangState,set:v=>{hangState=v;}}); Object.defineProperty(this,'_hmRandom',{get:()=>_hmRandom,set:v=>{_hmRandom=v;}}); this.HM_MIN=HM_MIN; this.HM_ROUND=HM_ROUND; this.HM_MISSES=HM_MISSES; this.HM_HINT=HM_HINT; this.HM_CLEAN=HM_CLEAN; this.HM_BEAT=HM_BEAT; this.HM_BEAT_FAIL=HM_BEAT_FAIL; this.WHICH_MIX=WHICH_MIX;",ctx);
  ctx._hmRandom=seeded(o.seed||3);
  const flush=()=>{ while(timers.length){ const x=timers.shift(); x.f(); } };
  return {c:ctx,writes,said,dings,timers,flush};
}
// guess the current word's letters (right) — or n wrong letters first
function solve(w){ const c=w.c, st=c.hangState, t=st.turns[st.i]; const keys=[]; t.letters.forEach(l=>{ if(l.key&&keys.indexOf(l.key)<0) keys.push(l.key); }); keys.forEach(k=>{ if(!t.done) c.hangGuess(k); }); }
function missN(w,n){ const c=w.c, st=c.hangState, t=st.turns[st.i]; let done=0; for(const k of "zqxjkvwybfgpm"){ if(done>=n) break; if(!t.letters.some(l=>l.key===k)&&!t.guessed[k]){ c.hangGuess(k); done++; } } }

console.log("── what is a word, what is a cue (pure) ──");
{ const w=world([]), c=w.c;
  ok("letters fold accents; a plain word → its letters",c.hmFold("\u00E9")==="e"&&c.hmFold("\u00C4")==="a"&&c.hmFold("1")===""&&c.hmLetters("geo").map(l=>l.key).join("")==="geo");
  ok("a two-word term and a hyphen keep their marks (shown, never guessed)",c.hmLetters("solar system").filter(l=>!l.key).length===1&&c.hmLetters("T-shirt").filter(l=>!l.key)[0].ch==="-"&&c.hmLetters("solar system").filter(l=>l.key).length===11);
  ok("an umlaut word plays (sch\u00F6n → s c h o n); \u00DF does not",c.hmLetters("sch\u00F6n").map(l=>l.key).join("")==="schon"&&c.hmLetters("die Stra\u00DFe")===null);
  ok("too short, too long, a number, four words, one repeated letter → no",c.hmLetters("go")===null&&c.hmLetters("abcdefghijklmno")===null&&c.hmLetters("6\u00D77")===null&&c.hmLetters("one two three four")===null&&c.hmLetters("aaa")===null);
  ok("a cue is the back; a back that is the front or contains it is no cue",c.hmCue("k",ROOTS[0])==="earth"&&c.hmCue("k",SAME[0])===""&&c.hmCue("k",GIVE[0])===""&&c.hmCue("k",GIVE[1])==="");
  const d=world([C("Kings","Stephen","")],{settings:{definitions:{Stephen:"the Anarchy"}}}); ok("a cue from the definitions map counts",d.c.hmCue("k",d.c.masteryData.k[0])==="the Anarchy");
}
console.log("── which decks ──");
{ const w=world(ROOTS.concat(VOCAB,DEUTSCH,SAME,MATH,SPELL,GIVE)), c=w.c;
  const p=c.hangPools(c.masteryData.k,"k");
  ok("decks with 4+ words and cues: Roots 8, Vocabulary 5, German 5 (\u00DF left out)",Object.keys(p).join(",")==="German,Roots,Vocabulary"&&p.Roots.length===8&&p.Vocabulary.length===5&&p.German.length===5,Object.keys(p));
  ok("a deck whose backs are the fronts, a procedure deck, spelling, and cues that give the word away → out",!p.Science&&!p["Math Facts"]&&!p.Spelling&&!p.Earth);
  ok("the level gate: middle / upper only — never a pre-reader or a 1st grader",c.hangAvail("k")===true&&c.hangLevelOk("up")&&!c.hangLevelOk("little")&&!c.hangLevelOk("early"));
  const three=world(ROOTS.slice(0,3)); ok("three words → no deck, the empty note",three.c.hangDecks(three.c.masteryData.k,"k").length===0&&/No decks ready for Hangman/.test(three.c.buildHangHtml("#000")));
  const off=world(ROOTS.concat(VOCAB),{settings:{gameDecks:{Roots:{hang:false}}}});
  ok("🎮 GAMEGRID: a deck Mom turned off for Hangman is out; its own column (off for Which one? still plays)",off.c.hangDecks(off.c.masteryData.k,"k").join(",")==="Vocabulary"&&(()=>{ const w2=world(ROOTS.concat(VOCAB),{settings:{gameDecks:{Roots:{which:false}}}}); return w2.c.hangDecks(w2.c.masteryData.k,"k").length===2; })());
  ok("the grid's preload (asked raw) still lists a turned-off deck, so Mom can turn it back on",off.c.gameDeckCan("k",{key:"hang",decks:k=>off.c.hangDecks(off.c.masteryData.k,k)}).indexOf("Roots")>=0);
  off.c.hangStart("Roots"); ok("…and it cannot be started",off.c.hangState===null);
}
console.log("── a round: hits, misses, a solve, a fail that comes back, the hint, the writes ──");
{ const w=world(ROOTS.concat(VOCAB)), c=w.c;
  c.hangStart("Roots"); const st=c.hangState;
  ok("a round of 6 words, nothing said",st&&st.phase==="play"&&st.turns.length===6&&st.of===6&&st.game==="hang"&&st.kid==="k"&&w.said.length===0);
  let t=st.turns[0];
  const h0=c.buildHangHtml("#000");
  ok("the screen: the cue, one blank per letter, six balloons, 26 keys, no word written, no Hear it yet",h0.indexOf(c.esc(t.cue))>=0&&(h0.match(/class="hm-box"/g)||[]).length===t.letters.filter(l=>l.key).length&&(h0.match(/\u{1F388}/gu)||[]).length>=6&&(h0.match(/hangGuess\(/g)||[]).length===26&&h0.indexOf(">"+t.word+"<")<0&&!/hangHear/.test(h0));
  const k0=t.letters[0].key; c.hangGuess(k0);
  ok("a right letter → the ding, the box fills, the key turns green, no beat",t.guessed[k0]&&w.dings.slice(-1)[0]==="ding"&&!st.lock&&/hm-box hm-on/.test(c.buildHangHtml("#000"))&&/hm-key hm-good/.test(c.buildHangHtml("#000")));
  c.hangGuess(k0); ok("the same letter again does nothing",t.misses===0&&w.dings.length===1);
  missN(w,1);
  ok("a wrong letter → the bonk, a balloon pops, the key greys",t.misses===1&&w.dings.slice(-1)[0]==="bonk"&&/hm-pop/.test(c.buildHangHtml("#000"))&&/hm-key hm-used/.test(c.buildHangHtml("#000"))&&/Pop!/.test(c.buildHangHtml("#000")));
  c.hangHear(); ok("Hear it does nothing before HM_HINT misses",w.said.length===0);
  missN(w,2); const n=w.said.length;
  ok("after three misses the 🔊 Hear it shows; tapping it SAYS the word (never writes it)",/hangHear\(\)/.test(c.buildHangHtml("#000"))&&(c.hangHear(),w.said.length===n+1&&w.said[n]===t.word&&t.hint)&&c.buildHangHtml("#000").indexOf(">"+t.word+"<")<0);
  solve(w);
  ok("every letter found after 3 misses + Hear it → solved and FOUND (counted in words found), but not a first try (⚖️ HMCLEAN); the ding, the word said, a beat",t.done&&t.found&&!t.first&&!t.fail&&st.first===1&&w.dings.slice(-1)[0]==="ding"&&w.said.slice(-1)[0]===t.word&&st.lock&&/That\u2019s it!/.test(c.buildHangHtml("#000")));
  w.flush(); ok("after the beat: the next word",st.i===1&&!st.lock);
  t=st.turns[1]; missN(w,6);
  ok("six misses → fail: \"We'll come back to that one\", the word never written, the card queued for the end",t.fail&&t.done&&!t.first&&st.first===1&&/come back to that one/.test(c.buildHangHtml("#000"))&&c.buildHangHtml("#000").indexOf(">"+t.word+"<")<0&&st.turns.length===7&&st.turns[6].back&&st.turns[6].pid===t.pid&&w.timers[0].ms===c.HM_BEAT_FAIL);
  w.flush();
  let g=0; while(st.phase==="play"&&st.i<6&&g++<10){ solve(w); w.flush(); }
  ok("the come-back is asked last, with fresh balloons and the same cue",st.i===6&&st.turns[6].back&&st.turns[6].misses===0&&/ONE MORE TIME/.test(c.buildHangHtml("#000"))&&st.turns[6].cue===t.cue);
  solve(w); w.flush();
  ok("the round ends: 5 of 6 found (the come-back counts for nothing)",st.phase==="done"&&st.first===5&&st.of===6);
  const mb=w.writes.filter(x=>x[1]==="mastery/k_settings/match_best"), gl=w.writes.filter(x=>x[0]==="push"&&x[1]==="mastery/gameLog/k/20261103");
  ok("writes: match_best ONE key, update, only this game's key; ONE gameLog push with game hang, every word, n = wrong letters + 1",mb.length===1&&mb[0][0]==="update"&&JSON.stringify(mb[0][2])==="{\"Roots · hang\":5}"&&gl.length===1&&gl[0][2].game==="hang"&&gl[0][2].items.length===7&&gl[0][2].items.filter(i=>i.ok).length===5&&!gl[0][2].items[0].ok&&!gl[0][2].items[0].fail&&gl[0][2].items.filter(i=>i.fail).length===1&&gl[0][2].items[0].n===4&&gl[0][2].items.filter(i=>i.back).length===1&&w.writes.length===2);
  ok("the finish shows the count against the kid's own best, no word written; no confetti on a round with a miss",/5 of 6 words found/.test(c.buildHangHtml("#000"))&&/new best/.test(c.buildHangHtml("#000"))&&!w.dings.some(x=>/celeb/.test(x))&&st.turns.every(x=>c.buildHangHtml("#000").indexOf(">"+x.word+"<")<0));
  c.hangStart("Roots"); const st2=c.hangState; g=0; while(st2.phase==="play"&&g++<20){ solve(w); w.flush(); }
  ok("a clean round: 6 of 6, a new best written",st2.first===6&&w.writes.filter(x=>x[1]==="mastery/k_settings/match_best").length===2);
  c.hangStart("Roots"); const st3=c.hangState; g=0; while(st3.phase==="play"&&g++<20){ solve(w); w.flush(); }
  ok("a best that is not beaten writes nothing more",w.writes.filter(x=>x[1]==="mastery/k_settings/match_best").length===2&&st3.isPB===false);
}
console.log("── ⚖️ HMCLEAN: first = a clean solve only (no Hear it, at most 1 wrong letter) ──");
{ const w=world(ROOTS), c=w.c;
  ok("hmClean (pure): 0 or 1 miss without the hint → clean; 2 misses, or any Hear it → not",c.hmClean({misses:0,hint:false})&&c.hmClean({misses:1,hint:false})&&!c.hmClean({misses:2,hint:false})&&!c.hmClean({misses:0,hint:true})&&!c.hmClean({misses:3,hint:true})&&c.HM_CLEAN===1);
  c.hangStart("Roots"); const st=c.hangState;
  let t=st.turns[0]; solve(w);
  ok("no misses → found and a first try",t.found&&t.first&&st.first===1); w.flush();
  t=st.turns[1]; missN(w,1); solve(w);
  ok("one wrong letter → still a first try (the clean-solve allowance)",t.misses===1&&t.found&&t.first&&st.first===2); w.flush();
  t=st.turns[2]; missN(w,2); solve(w);
  ok("two wrong letters → found (counts in words found, \"That\u2019s it!\", no come-back) but NOT a first try",t.misses===2&&t.found&&!t.first&&!t.fail&&st.first===3&&/That\u2019s it!/.test(c.buildHangHtml("#000"))&&st.turns.length===6); w.flush();
  t=st.turns[3]; missN(w,3); c.hangHear(); solve(w);
  ok("Hear it used → found but NOT a first try",t.hint&&t.found&&!t.first&&st.first===4); w.flush();
  t=st.turns[4]; c.hangHear(); solve(w);
  ok("a Hear it tap before HM_HINT misses does nothing, so the solve stays clean",!t.hint&&t.first); w.flush();
  t=st.turns[5]; missN(w,6);
  ok("six misses still fail and come back once (unchanged)",t.fail&&!t.found&&!t.first&&st.turns.length===7&&st.turns[6].back); w.flush();
  solve(w); w.flush();
  const gl=w.writes.filter(x=>x[0]==="push")[0][2], items=gl.items.filter(i=>!i.back);
  ok("the log: ok only for the clean solves (3 of 6), the two messy solves ok:false without fail, the failed word fail; n = wrong letters + 1",st.phase==="done"&&JSON.stringify(items.map(i=>i.ok))==="[true,true,false,false,true,false]"&&!items[2].fail&&!items[3].fail&&items[5].fail&&items[2].n===3&&items[3].n===4);
  ok("the finish still counts every found word: 5 of 6 words found",/5 of 6 words found/.test(c.buildHangHtml("#000"))&&st.first===5);
}
console.log("── a two-word term, a silent language, dry run, the round's own kid, confetti, the Mix, resume ──");
{ const w=world(VOCAB.concat(ROOTS)), c=w.c; c.hangStart("Vocabulary"); const st=c.hangState;
  const ti=st.turns.findIndex(x=>x.word==="solar system"); st.i=ti; const t=st.turns[ti];
  ok("\"solar system\": a gap between the words, 11 letters to find",(c.buildHangHtml("#000").match(/hm-box hm-gap/g)||[]).length===1&&t.letters.filter(l=>l.key).length===11);
  solve(w); ok("…solved by its letters alone",t.done&&t.first);
  const d=world(DEUTSCH), dc=d.c; dc.hangStart("German"); solve(d);
  ok("a silent language: solved, the ding, nothing said; no Hear it even after misses",dc.hangState.turns[0].first&&d.said.length===0&&(()=>{ d.flush(); missN(d,3); return !/hangHear/.test(dc.buildHangHtml("#000"))&&(dc.hangHear(),d.said.length===0); })());
  const dr=world(ROOTS,{dry:true}); dr.c.hangStart("Roots"); let g=0; while(dr.c.hangState.phase==="play"&&g++<20){ solve(dr); dr.flush(); }
  ok("?dryrun=1: nothing written (best and log stay in memory)",dr.writes.length===0&&dr.c.masteryData.k_settings.match_best["Roots \u00B7 hang"]===6&&dr.c.masteryData.gameLog.k["20261103"]);
  const g2=world(ROOTS); g2.c.hangStart("Roots"); g2.c.masteryKid="other"; g=0; while(g2.c.hangState.phase==="play"&&g++<20){ solve(g2); g2.flush(); }
  ok("the finish saves to the round's OWN kid, not the kid picked now",g2.writes.find(x=>x[0]==="update")[1]==="mastery/k_settings/match_best"&&g2.writes.find(x=>x[0]==="push")[1]==="mastery/gameLog/k/20261103");
  const cl=world(ROOTS,{celeb:true}); cl.c.hangStart("Roots"); g=0; while(cl.c.hangState.phase==="play"&&g++<20){ solve(cl); cl.flush(); }
  ok("with the overlay, a clean round gets the small confetti (no song)",cl.dings.some(x=>x==="celeb:\u{1F388} You found every word!"));
  const m=world(ROOTS.concat(VOCAB)); m.c.hangStart(m.c.WHICH_MIX);
  ok("the Mix: HM_ROUND words from both decks",m.c.hangState.mix===true&&m.c.hangState.turns.length===m.c.HM_ROUND);
  m.c.hangChangeDeck(); ok("Change deck drops the round: nothing written",m.c.hangState===null&&m.writes.length===0);
  const one=world(ROOTS); one.c.hangStart(one.c.WHICH_MIX); ok("one deck → no Mix round",one.c.hangState===null);
  const r=world(ROOTS), rc=r.c; rc.hangStart("Roots"); solve(r); const rs=rc.hangState;
  ok("mid-beat: locked",rs.lock&&rs.i===0);
  rc.hangResume(); ok("resume settles the beat: the next word",!rs.lock&&rs.i===1);
  const i1=rs.i; r.flush(); ok("the old timer after a resume does nothing",rs.i===i1);
  const v=world(ROOTS,{view:"which"}); v.c.hangStart("Roots"); solve(v);
  ok("not on screen → no speech",v.said.length===0);
}
console.log("\n"+pass+" passed, "+fail+" failed");
process.exit(fail?1:0);
