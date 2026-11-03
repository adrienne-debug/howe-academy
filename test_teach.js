/*
 * 🎓 Teach it (her word 2026-11-03: "Teach-it (moves nothing)"; PLAN_practice_games_2026-10-23.md Tier 4 "Teach it").
 * The kid teaches a card from their deck to a listener in their own words, turns the answer over to check, and the listener
 * taps ✓ got it / ↻ teach it again (comes back once). MOVES NOTHING on the ladder. gameLogRound (game "teach"); match_best
 * "<deck> · teach" only when beaten. Runs the REAL block.
 *   run:  node test_teach.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
let pass=0, fail=0;
function ok(n,c,x){ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":""));} }
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("markers "+a); return src.slice(i,j); };
function fnText(name){ const i=src.indexOf("function "+name+"("); if(i<0) return ""; const j=src.indexOf("\nfunction ",i+10); return src.slice(i,j<0?undefined:j); }
const seeded=seed=>{ let x=seed||7; return ()=>{ x=(x*1103515245+12345)&0x7fffffff; return (x%10000)/10000; }; };

// ── by text ──
const a=src.indexOf("// TEACH_START"), b=src.indexOf("// TEACH_END"), sp=src.indexOf("// SPELLBUILD_END"), sc=src.indexOf("// STUDYCOUNTS_START");
ok("one TEACH block among the game blocks: after SPELLBUILD_END, before STUDYCOUNTS_START, straight after another block's _END line",sp>0&&a>sp&&b>a&&sc>b&&/^\/\/ [A-Z_]+_END$/m.test(src.slice(sp,a).trim().split("\n").pop()||"")&&src.indexOf("// TEACH_START",a+1)<0&&src.indexOf("// TEACH_END",b+1)<0);
ok("the games' own position tests still hold: nothing new between SPELLBUILD_END and GOFISH_START",!/\n(?!\/\/ (BRAINDUMP|BINGO|SORTIT|GOFISH)_)[^\n]*(_START|_END)/.test(src.slice(sp+18,src.indexOf("// GOFISH_START"))));
const blk=src.slice(a,b), code=blk.replace(/^\s*\/\/.*$/gm,"");
ok("no kid's name in the block",!/lincoln|ellis|lucy|julian|caleb|taylor|makenzie|kenzie|andrew/i.test(blk));
ok("no 🔀 anywhere in index.html",src.indexOf("\u{1F500}")<0);
ok("writes: match_best one key (guarded) + gameLogRound — nothing else",/db&&!_dryRun\(\)\) db\.ref\("mastery\/"\+kid\+"_settings\/match_best"\)\.update\(\{\[key\]:st\.first\}\)/.test(blk)&&/gameLogRound\(st\)/.test(blk)&&(code.match(/db\.ref\(/g)||[]).length===1&&!/\.set\(|\.remove\(|\.push\(\{/.test(code.replace(/turns\.push/g,"")));
ok("MOVES NOTHING: no tier / next_due / consecutive_correct / tally / studyLog / mastApplyScores / mastSaveResults in the block, for either kid",!/\.tier\b|next_due|consecutive_correct|tally_dots|studyLog|mastApplyScores|mastSaveResults|mstLog|scStudy|bankDirect/.test(code));
ok("GAMES_LIST: Teach it right after Jeopardy, with park / restore / resume and decks for the grid",/resume:\(\)=>jeopResume\(\), decks:k=>typeof jeopDecks==="function"\?jeopDecks\(_gamesItems\(k\),k\):\[\]\},[^\n]*\n  \{key:"teach",\s*emoji:"\\u\{1F393\}", label:"Teach it",\s*view:"teach",\s*available:k=>typeof teachDecks==="function"&&teachDecks\(_gamesItems\(k\),k\)\.length>0, render:c=>buildTeachHtml\(c\),\n\s*park:\(\)=>teachState, restore:v=>\{ teachState=v\|\|null; \}, resume:\(\)=>teachResume\(\), decks:k=>typeof teachDecks==="function"\?teachDecks\(_gamesItems\(k\),k\):\[\]\},/.test(src));
ok("gamesCurrentKey / GAMEKID untouched (the entry does it)",!/teach/i.test(fnText("gamesCurrentKey"))&&!/teachState|teachResume/.test(cut("// GAMEKID_START","// GAMEKID_END")));
ok("no lives, leaderboard, clock, points; no typing or grading by the app",!/lives|hearts|leaderboard|setInterval|setTimeout|points|mstTypedOk|mstTypeAnsOk/i.test(code));

// ── a sandbox: WHICHONE (left-out / silent rules) + GAMELOG + GAMEGRID + TEACH ──
const R=(id,deck,front,back,extra)=>Object.assign({id:id,subject:deck,prompt:front,answer:back,status:"active",tier:"weekly"},extra||{});
const RULES=[R("c1","Capitalization","Kangaroos are native to Australia.","First word of a sentence."),R("c2","Capitalization","Peggy likes to be called Peg.","A person\u2019s name or nickname."),
  R("c3","Capitalization","Mom and Dad went out to dinner.","A relationship word used in place of a person\u2019s name."),R("c4","Capitalization","Disney World is in Orlando, Florida.","Names of places."),
  R("c5","Capitalization","We\u2019re going camping on Labor Day.","Holidays.",{status:"introduction"})];
const CONCEPTS=[R("k1","Science","Why do we have seasons?","The Earth's tilt.",{knowledge_type:"concept"}),R("k2","Science","What is a food chain?","Who eats whom.",{knowledge_type:"concept"}),R("k3","Science","Why is the sky blue?","Scattered blue light.",{knowledge_type:"transfer"})];
const PICS=[Object.assign(R("p1","Animals","cat",""),{emoji:"🐱"}),Object.assign(R("p2","Animals","dog",""),{emoji:"🐶"}),Object.assign(R("p3","Animals","cow",""),{emoji:"🐮"})];
const SPELL=[R("s1","AAS Words","red",""),R("s2","AAS Words","bed",""),R("s3","AAS Words","fed","")];
const TWIN=[R("g1","German","gut","well"),R("g2","German","well","gut",{dir:"prod"}),R("g3","German","ich","I"),R("g4","German","du","you")];
function world(items,o){
  o=o||{};
  const writes=[], said=[], dings=[];
  const CODE=cut("// WHICHONE_START","// WHICHONE_END")+"\n"+cut("// GAMELOG_START","// GAMELOG_END")+"\n"+cut("// GAMEGRID_START","// GAMEGRID_END")+"\n"+cut("// TEACH_START","// TEACH_END");
  const ctx={console,JSON,Object,Array,String,Number,Math,Set,Map,RegExp,Date,parseInt,isNaN,setTimeout:()=>0,
    document:{getElementById:()=>o.celeb?{}:null},
    _dryRun:()=>!!o.dry,HA_LS:{setItem(){}},_mastRe(){},bbAudioUnlock(){},momHere:()=>true,renderAll(){},
    _gamesItems:k=>(k==="k"?items||[]:[]),
    _smTileVis:it=>(it&&it.emoji?'<span class="memoji">'+it.emoji+'</span>':null),
    _matchPlain:h=>String(h||"").replace(/<[^>]*>/g," ").replace(/\s+/g," ").trim(),
    esc:s=>String(s||"").replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;"),
    mastSpeak:(t)=>said.push(t),matchDing:()=>dings.push("ding"),matchBonk:()=>dings.push("bonk"),_showCelebration:(k,t)=>dings.push("celeb:"+t),
    mastGetCatMode:(k,d)=>d==="AAS Words"?"spell":null,   // the real app marks a spelling deck by its category mode; Which one?'s rule reads it
    mstTodayKey:()=>"20261103",mastView:"teach",masteryKid:"k",
    masteryData:{k:items||[],k_settings:o.settings||{}},
    db:{ref:p=>({set:v=>writes.push(["set",p,v]),update:v=>writes.push(["update",p,v]),push:v=>writes.push(["push",p,v]),remove:()=>writes.push(["remove",p])})}};
  vm.createContext(ctx);
  vm.runInContext(CODE+"\nObject.defineProperty(this,'teachState',{get:()=>teachState,set:v=>{teachState=v;}}); Object.defineProperty(this,'_teachRandom',{get:()=>_teachRandom,set:v=>{_teachRandom=v;}}); this.TEACH_N=TEACH_N; this.WHICH_MIX=WHICH_MIX;",ctx);
  ctx._teachRandom=seeded(o.seed||3);
  return {c:ctx,writes,said,dings};
}
const snapshot=items=>JSON.stringify(items.map(i=>[i.id,i.tier,i.status,i.next_due,i.consecutive_correct,i.tally_dots]));

{ const w=world(RULES.concat(CONCEPTS,PICS,SPELL,TWIN)), c=w.c;
  const decks=c.teachDecks(c.masteryData.k);
  ok("decks: rule cards, CONCEPT cards (the never-drill 'discuss / teach' ones), picture cards and German play; spelling never",JSON.stringify(decks)==="[\"Animals\",\"Capitalization\",\"German\",\"Science\"]",decks);
  ok("the pool: introduction cards teach too; a production twin stays out",c.teachPool(c.masteryData.k,"Capitalization").length===5&&c.teachPool(c.masteryData.k,"German").length===3);
  const off=world(RULES,{settings:{gameDecks:{Capitalization:{teach:false}}}});
  ok("🎮 GAMEGRID: a deck Mom turned off for Teach it is not offered; the preload (asked raw) still lists it",off.c.teachDecks(off.c.masteryData.k).length===0&&off.c.gameDeckCan("k",{key:"teach",decks:k=>off.c.teachDecks(off.c.masteryData.k,k)}).indexOf("Capitalization")>=0);
}
{ const w=world(RULES.concat(CONCEPTS)), c=w.c, before=snapshot(c.masteryData.k);
  c.teachStart("Capitalization"); const st=c.teachState;
  ok("a round: 5 cards (the deck has 5 < 6), the first card up with its FRONT, the answer face down",st&&st.phase==="play"&&st.turns.length===5&&st.of===5&&!st.turns[0].shown&&st.game==="teach"&&st.kid==="k");
  let h=c.buildTeachHtml("#000"), it=c.masteryData.k.find(x=>x.id===st.turns[0].pid);
  ok("the screen: 'Teach it … in your own words', the front, Show the answer — the back is NOT on screen, no verdict buttons yet",/in your own words/.test(h)&&h.indexOf(c.esc(it.prompt))>0&&h.indexOf(c.esc(it.answer))<0&&/Show the answer/.test(h)&&!/They got it/.test(h));
  c.teachVerdict(true);
  ok("a verdict before the answer is turned over does nothing",!st.turns[0].done&&st.i===0);
  c.teachShow(); h=c.buildTeachHtml("#000");
  ok("Show the answer: the back appears for the teacher to check, then 'Did they get it?' with ✓ / ↻",st.turns[0].shown&&h.indexOf(c.esc(it.answer))>0&&/Did they get it\?/.test(h)&&/They got it/.test(h)&&/Teach it again/.test(h));
  c.teachVerdict(true);
  ok("✓ They got it → first-time count 1, the ding, next card",st.turns[0].done&&st.turns[0].first&&st.first===1&&w.dings.slice(-1)[0]==="ding"&&st.i===1);
  c.teachShow(); c.teachVerdict(false);
  ok("↻ Teach it again → not first, no ding, the card queued once for the end of the round",st.turns[1].done&&!st.turns[1].first&&st.first===1&&w.dings.length===1&&st.turns.length===6&&st.turns[5].back&&st.turns[5].pid===st.turns[1].pid);
  c.teachSay(); ok("🔊 says the FRONT (the teacher hears it; nothing else is read for them)",w.said.length===1&&w.said[0]===c.masteryData.k.find(x=>x.id===st.turns[2].pid).prompt);
  while(st.phase==="play"){ c.teachShow(); c.teachVerdict(true); }
  ok("the round ends after the come-back: 4 of 5 the first time; the come-back counts for nothing",st.phase==="done"&&st.first===4&&st.of===5&&st.turns.length===6);
  const mb=w.writes.filter(x=>x[1]==="mastery/k_settings/match_best"), gl=w.writes.filter(x=>x[0]==="push"&&x[1]==="mastery/gameLog/k/20261103");
  ok("writes: match_best ONE key 'Capitalization · teach' = 4; ONE gameLog push, game teach, 6 items (1 back); nothing else",mb.length===1&&JSON.stringify(mb[0][2])==="{\"Capitalization · teach\":4}"&&gl.length===1&&gl[0][2].game==="teach"&&gl[0][2].items.length===6&&gl[0][2].items.filter(i=>i.back).length===1&&w.writes.length===2);
  ok("MOVES NOTHING: every card's tier / status / next_due / streak / dots exactly as before",snapshot(c.masteryData.k)===before);
  ok("the finish: '4 of 5 got it the first time — new best', Play again, Mix the decks",/4 of 5 got it the first time/.test(c.buildTeachHtml("#000"))&&/new best/.test(c.buildTeachHtml("#000"))&&/Play again/.test(c.buildTeachHtml("#000"))&&/Mix the decks/.test(c.buildTeachHtml("#000")));
}
{ const w=world(CONCEPTS.concat(RULES),{celeb:true}), c=w.c;
  c.teachStart("Science"); const st=c.teachState;
  ok("concept cards: a 3-card round, the question as the front",st.of===3&&/Why|What/.test(c.buildTeachHtml("#000")));
  while(st.phase==="play"){ c.teachShow(); c.teachVerdict(true); }
  ok("all taught the first time → the small confetti with the overlay present",st.first===3&&w.dings.some(x=>x==="celeb:\u{1F393} You taught them all!"));
  c.teachStart("Science"); const st2=c.teachState; while(st2.phase==="play"){ c.teachShow(); c.teachVerdict(true); }
  ok("a best not beaten writes nothing more",w.writes.filter(x=>x[1]==="mastery/k_settings/match_best").length===1&&st2.isPB===false);
}
{ const w=world(PICS), c=w.c;
  c.teachStart("Animals"); const st=c.teachState, h0=c.buildTeachHtml("#000");
  ok("a picture card: the picture and its name are the card; Show the answer explains there is no separate back",/memoji/.test(h0)&&(c.teachShow(),/its picture and its name/.test(c.buildTeachHtml("#000"))));
  c.teachChangeDeck(); ok("Change deck drops the round: nothing written",c.teachState===null&&w.writes.length===0);
  const d=world(PICS,{dry:true}); d.c.teachStart("Animals"); while(d.c.teachState.phase==="play"){ d.c.teachShow(); d.c.teachVerdict(true); }
  ok("?dryrun=1: the round plays, nothing is written",d.c.teachState.phase==="done"&&d.writes.length===0);
}
{ const w=world(RULES.concat(PICS)), c=w.c;
  c.teachStart(c.WHICH_MIX); const st=c.teachState;
  ok("Mix the decks: cards from both decks in one round of 6",st.mix&&st.of===6&&new Set(st.turns.map(t=>c.masteryData.k.find(x=>x.id===t.pid).subject)).size===2);
  const parked=st; c.teachState=null; c.teachState=parked; c.teachResume();
  ok("park / restore: the round is exactly as it was left (no timers to settle)",c.teachState===parked&&parked.i===0&&parked.phase==="play");
}
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
