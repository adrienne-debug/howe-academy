/* 🎮 SCORESGAMES — the Games section under each kid's Overall card (slice 2 of PLAN_scores_page_2026-11-03.md) + its three logging adds
   (GAMELOG's `why` flag, the practice list's why:"practice", MATCHLOG: every finished Match / Memory round in gameLog).
   The fixture is the live gameLog / matchLog / match_best / gameLikes read 2026-11-08 (GET only), kid ids and card-id prefixes
   anonymized (kid1…kid4), cards trimmed to id / subject / status / tier / gp. Touches no live data.
   run: node test_scores_games.js */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
const FX=JSON.parse(fs.readFileSync(path.join(__dirname,"test_fixtures","scores_games_live_2026-11-08.json"),"utf8"));
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":"")); } };
const fn=name=>{ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); return src.slice(i,src.indexOf("\n}",i)+2); };
const blk=(a,z)=>{ const i=src.indexOf(a); if(i<0) throw new Error("missing "+a); const j=src.indexOf(z,i); if(j<0) throw new Error("missing end "+z); return src.slice(i,j); };
const a=src.indexOf("// SCORESGAMES_START"), b=src.indexOf("// SCORESGAMES_END"); const block=src.slice(a,b);
const NAMES=/lincoln|ellis|lucy|julian|howe|dewalt|burris|taylor|makenzie|andrew|caleb|adrienne/i;

console.log("── the block ──");
ok("marked once, right after SCORESPAGE_END", a>0&&b>a&&src.split("// SCORESGAMES_START").length===2&&src.split("// SCORESGAMES_END").length===2&&src.indexOf("// SCORESPAGE_END\n// SCORESGAMES_START")>0);
ok("every inline <script> still compiles", (()=>{ const re=/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g; let m,n=0; while((m=re.exec(src))){ n++; try{ new vm.Script(m[1]); }catch(e){ console.log("    script #"+n+": "+e.message); return false; } } return n>0; })());
ok("no family or kid name in the block, the MATCHLOG builder or the fixture", !NAMES.test(block)&&!NAMES.test(fn("gameLogMatchEntry"))&&!NAMES.test(JSON.stringify(FX)));
ok("read-only: the block never writes (no db.ref, firebase, set, update, remove, push, transaction, HA_LS.setItem)", !/db\.ref\(|firebase|\.set\(|\.update\(|\.remove\(|\.push\(|\.transaction\(|HA_LS\.setItem/.test(block.replace(/rounds\.push\(|out\.push\(|p\.push\(|\(right\[[^\]]+\]\|\|\(right\[[^\]]+\]=\[\]\)\)\.push\(/g,"")));
ok("the page hook is ONE guarded line in renderMPScores", /h\+=rows\.map\(r=>scpCardHtml\(r\)\+\(typeof scgSectionHtml==="function"\?scgSectionHtml\(r\.kid\):""\)\)\.join\(""\);/.test(fn("renderMPScores")));

// the pure functions in a bare context (STUDYCOUNTS' graded-day merge + SCORESPAGE's helpers + this block)
const ctx={console}; vm.createContext(ctx);
vm.runInContext(blk("const SC_RANK=","\n// History-shaped view")+"\n"+blk("// SCORESPAGE_START","// SCORESPAGE_END")+"\n"+block,ctx);
const run=e=>vm.runInContext(e,ctx);
const scgStats=run("scgStats"), scgBestKey=run("scgBestKey"), scgLearned=run("scgLearned"), scgHtml=run("scgHtml");
const live=k=>scgStats(k,{gameLog:FX.gameLog,matchLog:FX.matchLog,settings:FX.settings[k],cards:FX.cards[k],today:"20261108"});
const G=(s,k)=>s.games.find(g=>g.key===k), DK=(s,d)=>s.decks.find(x=>x.deck===d);

console.log("── best keys: each game's own best ──");
const bk=k=>JSON.stringify(scgBestKey(k));
ok("a count game: \"<deck> · mole\" → mole, count", bk("Math Facts · mole")==='{"deck":"Math Facts","game":"mole","kind":"n"}');
ok("Beat my time is seconds (lower is better)", scgBestKey("Colors · beat").kind==="s");
ok("Jeopardy's money bank: \"<board> · jeop money\" → jeop, dollars; its first-try key stays a count", bk("5 decks · jeop money")==='{"deck":"5 decks","game":"jeop","kind":"$"}'&&scgBestKey("5 decks · jeop").kind==="n");
ok("Match: a bare deck, \"· same\" → match, seconds", bk("Vocabulary")==='{"deck":"Vocabulary","game":"match","kind":"s"}'&&scgBestKey("Colors · same").game==="match");
ok("Memory flip: \"· memory\", \"· memory · pick\", \"· memory · same\" → memory, seconds, the deck intact", ["Shapes · memory","Shapes · memory · pick","Shapes · memory · same"].every(k=>bk(k)==='{"deck":"Shapes","game":"memory","kind":"s"}'));

console.log("── the live fixture ──");
{ const s=live("kid3");
  ok("kid3: 20 rounds all time, 15 in the 7 days to 11/08", s.total.rounds===20&&s.total.w7===15, s.total);
  const mole=G(s,"mole");
  ok("kid3 Whack-a-mole: 3 rounds, 30 cards, 57 % first try (the PLAN's live table, 11/3)", mole.rounds===3&&mole.n===30&&mole.pct===57, mole);
  ok("…its best is the match_best count (8 · Math Facts)", mole.best.n&&mole.best.n.v===8&&mole.best.n.deck==="Math Facts"&&!mole.best.s);
  const gf=G(s,"gofish");
  ok("kid3 Go Fish: 5 rounds, right = first try ÷ answered (came-back cards left out)", gf.rounds===5&&gf.n===64&&gf.pct===Math.round(gf.ok/64*100));
  ok("👍 / 👎 from gameLikes: Bingo 1 · 0", G(s,"bingo").up===1&&G(s,"bingo").down===0);
  ok("Memory flip rounds come from matchLog (Save to Scores) and its best is seconds", G(s,"memory").rounds===3&&G(s,"memory").best.s.v===20.7);
  ok("a game with only a best (Which one?, never logged) shows 0 rounds and its best", G(s,"which").rounds===0&&G(s,"which").best.n.v===8);
  ok("a mixed round splits by the card's own deck: the 3-deck Jeopardy board → NC Frogs & Toads + Math Facts", DK(s,"NC Frogs & Toads").games.jeop.n===5&&DK(s,"Math Facts").games.jeop.n===5&&!DK(s,"3 decks"));
  ok("the practice list's round splits into its decks too (Spelling, NC Frogs & Toads)", DK(s,"Spelling").games.practice.n===15&&DK(s,"NC Frogs & Toads").games.practice.n===4);
  ok("no round carries the why flag yet → practice vs free is left out", s.why===null); }
{ const s=live("kid4");
  ok("kid4 Which one?: 6 rounds (gameLog), 48 cards, 90 % — matchLog's saved Which one? rounds on/after the first gameLog day are not counted twice", G(s,"which").rounds===6&&G(s,"which").n===48&&G(s,"which").pct===90, G(s,"which"));
  ok("kid4 Match (face-up) comes only from matchLog: 3 rounds, best 13.3 s (Colors · same)", G(s,"match").rounds===3&&G(s,"match").best.s.v===13.3); }
{ const s=live("kid2");
  ok("kid2: matchLog Which one? rounds from before gameLog began count (4), with their first/of", G(s,"which").rounds===4&&G(s,"which").n===32&&G(s,"which").ok===31);
  ok("games sort by rounds, most first", s.games.every((g,i)=>!i||s.games[i-1].rounds>=g.rounds)); }

console.log("── the math on a small family ──");
const SM={gameLog:{ava:{"20261105":{p1:{game:"mole",deck:"Mix the decks",at:1,secs:60,why:"free",items:[{id:"a1",ok:true,n:1},{id:"b1",ok:false,n:2},{id:"b1",ok:true,n:1,back:true}]},
                                   p2:{game:"practice",deck:"practice",at:2,secs:9000,why:"practice",items:[{id:"a1",ok:true,n:1,list:true}]}},
                      "20261020":{p3:{game:"which",deck:"A",at:3,secs:30,items:[{id:"a1",ok:true,n:1},{id:"a2",ok:true,n:1}]}}}},
          matchLog:{ava:[{date:"2026-10-01",deck:"A",game:"which",first:3,of:4},{date:"2026-10-20",deck:"A",game:"which",first:1,of:1},{date:"2026-10-02",deck:"A",style:"memory",pair:"two",sec:40},{date:"2026-10-03",deck:"B",style:"match",sec:25,then:"pick",first:2,of:3}]},
          settings:{match_best:{"A · which":4,"A · memory":40,"A · memory · pick":35.5,"B":25,"B · mole":3,"B · jeop money":1200},gameLikes:{mole:{1:{v:1},2:{v:-1},3:{v:1}},which:{4:{v:0}}}},
          cards:[{id:"a1",subject:"A",status:"active",tier:"weekly"},{id:"a2",subject:"A",status:"active",tier:"weekly"},{id:"b1",subject:"B",status:"active",tier:"weekly"}],today:"20261108"};
{ const s=scgStats("ava",SM);
  ok("rounds: 3 gameLog + matchLog's which on 10/01 (before which's first log day 10/20) + memory + match = 6; the 10/20 saved which is a duplicate, dropped", s.total.rounds===6&&G(s,"which").rounds===2, s.total);
  ok("7 days: the two 11/05 rounds", s.total.w7===2);
  ok("Right % per game: mole 1 of 2 (the came-back b1 is not a second try) = 50", G(s,"mole").n===2&&G(s,"mole").ok===1&&G(s,"mole").pct===50);
  ok("which: the log round 2/2 + the saved round's 3 of 4 → 5 of 6 = 83", G(s,"which").n===6&&G(s,"which").ok===5&&G(s,"which").pct===83);
  ok("a saved plain Memory round: a round, no cards, % shows —", G(s,"memory").rounds===1&&G(s,"memory").n===0&&G(s,"memory").pct===null);
  ok("a saved Pick it Match round counts its first/of (2 of 3)", G(s,"match").n===3&&G(s,"match").ok===2);
  ok("minutes: a 9000 s round was left open and is skipped (practice 0), mole 1", G(s,"practice").min===0&&G(s,"mole").min===1&&G(s,"which").min===1);
  ok("best: time takes the LOWEST across Memory's shapes (35.5 · pick beats 40)", G(s,"memory").best.s.v===35.5);
  ok("best: Match's bare-deck key 25 s; mole's count; Jeopardy's bank in dollars on a game never played", G(s,"match").best.s.v===25&&G(s,"mole").best.n.v===3&&G(s,"jeop").best.$.v===1200&&G(s,"jeop").rounds===0);
  ok("👍👎: mole 2 · 1; a v of 0 counts neither", G(s,"mole").up===2&&G(s,"mole").down===1&&G(s,"which").up===0&&G(s,"which").down===0);
  ok("per deck: the Mix-the-decks mole round splits into A (1 of 1) and B (0 of 1)", DK(s,"A").games.mole.pct===100&&DK(s,"B").games.mole.pct===0&&!DK(s,"Mix the decks"));
  ok("…deck B also carries mole's best for that deck (3)", DK(s,"B").games.mole.best.n.v===3);
  ok("practice vs free: one flagged round each way; the older unflagged rounds are 'not marked'", s.why&&s.why.practice===1&&s.why.free===1&&s.why.none===4, s.why);
  const h=scgHtml(s,true,SM.cards);
  ok("the section draws: one-line summary, practice line, a row per game, By deck, the rule under it", /<details open><summary[^>]*>🎮 Games .*2 rounds in 7 days · 6 all time · /.test(h)&&/Practice rounds 1 · free play 1 .*4 from before rounds were marked/.test(h)&&/By deck/.test(h)&&/Learned through games =/.test(h));
  ok("best cells: '35.5 s', '$1,200'", h.indexOf("35.5 s")>0&&h.indexOf("$1,200")>0);
  ok("closed on a phone: no 'open'", scgHtml(s,false,SM.cards).indexOf("<details open>")<0&&scgHtml(s,false,SM.cards).indexOf("<details><summary")>0); }
{ const s=scgStats("ava",Object.assign({},SM,{gameLog:{ava:{"20261105":{p1:{game:"mole",deck:"A",at:1,secs:60,items:[{id:"a1",ok:true,n:1}]}}}}}));
  ok("no flagged round → no practice line", s.why===null&&scgHtml(s,true,[]).indexOf("Practice rounds")<0); }

console.log("── cards learned through games ──");
{ const cards=[{id:"g1",status:"active",tier:"weekly"},{id:"g2",status:"active",tier:"weekly"},{id:"g3",status:"active",tier:"weekly"},{id:"g4",status:"active",tier:"weekly"},
               {id:"g5",status:"parked",tier:"weekly"},{id:"g6",status:"introduction",tier:"daily"},{id:"g7",status:"active",tier:"every_other_day",gp:{on:false,out:true,ok:"20261106"}},{id:"g8",status:"active",tier:"weekly"}];
  const H={ava:{"20261101":{items:[{id:"g1",result:"m"},{id:"g2",result:"m"},{id:"g3",result:"c"},{id:"g4",result:"m"},{id:"g5",result:"m"},{id:"g6",result:"m"},{id:"g8",result:"~"}]},
                "20261106":{items:[{id:"g1",result:"c"},{id:"g2",result:"c"},{id:"g3",result:"c"},{id:"g4",result:"m"},{id:"g5",result:"c"},{id:"g6",result:"c"},{id:"g8",result:"c"}]}}};
  const GL={ava:{"20261103":{p:{game:"mole",items:[{id:"g1",ok:true,n:1},{id:"g3",ok:true,n:1},{id:"g4",ok:true,n:1},{id:"g5",ok:true,n:1},{id:"g6",ok:true,n:1},{id:"g2",ok:false,n:2},{id:"g2",ok:true,n:1,back:true}]}},
                 "20261106":{p:{game:"bingo",items:[{id:"g8",ok:true,n:1}]}},"20261020":{p:{game:"which",items:[{id:"g2",ok:true,n:1}]}}}};
  const L=scgLearned("ava",cards,H,{},GL);
  ok("g1: ✗ in the drill → right first try in a game → ✓ in the drill = learned through games", L.indexOf("g1")>=0);
  ok("g2: its only in-between game answer was a came-back tap; a first-try right before the miss doesn't count", L.indexOf("g2")<0);
  ok("g3: never missed (✓ then ✓) → not", L.indexOf("g3")<0);
  ok("g4: still missed in the last drill → not", L.indexOf("g4")<0);
  ok("g5 parked, g6 still in learning → left out", L.indexOf("g5")<0&&L.indexOf("g6")<0);
  ok("g7: the practice list closed it as learned (gp.ok) → counts with no drill record", L.indexOf("g7")>=0);
  ok("g8: a ~ is a miss; a game right ON the ✓ day counts (both ends included)", L.indexOf("g8")>=0);
  ok("exactly g1, g7, g8", JSON.stringify(L.slice().sort())==='["g1","g7","g8"]', L);
  const study={ava:{s1:{"20261104":{items:[{id:"g1",name:"one",result:"c"}]}}}};
  ok("a study ✓ between the miss and the drill ✓ takes it out (the last two grades are then ✓ ✓)", scgLearned("ava",cards,H,study,GL).indexOf("g1")<0);
  const s=scgStats("ava",{gameLog:GL,cards:cards.map(c=>Object.assign({answer:"Name "+c.id},c)),history:H,today:"20261108"});
  const h=scgHtml(s,true,cards.map(c=>Object.assign({answer:"Name "+c.id},c)));
  ok("the section's line: count + the card names", /Cards learned through games: <b>3<\/b>/.test(h)&&h.indexOf("Name g1")>0&&h.indexOf("Name g7")>0); }

console.log("── no game records → byte-identical ──");
{ const empty=scgStats("ben",{gameLog:{},matchLog:{},settings:{},cards:[{id:"x",status:"active",tier:"weekly"}],today:"20261108"});
  ok("nothing → any false and \"\"", empty.any===false&&scgHtml(empty,true,[])==="");
  ok("a settings node without match_best / gameLikes, a kid with no gameLog day → \"\"", scgHtml(scgStats("ben",{gameLog:FX.gameLog,matchLog:FX.matchLog,settings:{load:{budgetMin:12}},today:"20261108"}),true,[])==="");
  ok("missing everything → no throw", scgStats("ben",undefined).any===false&&scgStats("ben",{gameLog:null,matchLog:null,settings:null}).any===false);
  // the whole page, with and without the hook, on a family with drills but no games
  const mk=withHook=>{ const c={console,window:{innerWidth:1024}}; vm.createContext(c);
    let page=blk("// SCORESPAGE_START","// SCORESPAGE_END");
    if(!withHook) page=page.replace('h+=rows.map(r=>scpCardHtml(r)+(typeof scgSectionHtml==="function"?scgSectionHtml(r.kid):"")).join("");','h+=rows.map(scpCardHtml).join("");');
    vm.runInContext(blk("const SC_RANK=","\n// History-shaped view")+"\n"+page+"\n"+(withHook?block:"")+
      "\nvar ROSTER=['ava','ben']; function momHere(){ return true; } var masteryData={history:{ava:{'20261105':{secs:120,items:[{id:'a1',result:'c'}]}}},ava:[{id:'a1',status:'active',tier:'weekly'}],ava_settings:{load:{budgetMin:12}}};"+
      "\nfunction scpToday(){ return '20261108'; } var weekData={tasks:[]}, checked={}, archive={};",c);
    const el={innerHTML:""}; c.el=el; vm.runInContext("renderMPScores(el,'')",c); return el.innerHTML; };
  const withH=mk(true), without=mk(false);
  ok("renderMPScores with the Games hook = slice 1's page, byte for byte, when no kid has a game record", withH===without&&withH.length>500&&withH.indexOf("scg-card")<0);
  // and with one record the section sits right under that kid's card
  const c2={console,window:{innerWidth:375}}; vm.createContext(c2);
  vm.runInContext(blk("const SC_RANK=","\n// History-shaped view")+"\n"+blk("// SCORESPAGE_START","// SCORESPAGE_END")+"\n"+block+
    "\nvar ROSTER=['ava','ben']; function momHere(){ return true; } var masteryData={gameLog:{ava:{'20261107':{p:{game:'mole',deck:'A',at:1,secs:60,items:[{id:'a1',ok:true,n:1}]}}}},ava:[{id:'a1',subject:'A',status:'active',tier:'weekly'}]};"+
    "\nfunction scpToday(){ return '20261108'; } var weekData={tasks:[]}, checked={}, archive={}; var el={innerHTML:''}; renderMPScores(el,'');",c2);
  const h2=c2.el.innerHTML, ia=h2.indexOf("scg-card"), cards=h2.split('class="scp-card"');
  ok("one kid with a round: one Games section, after that kid's card and before the next kid's", (h2.match(/scg-card/g)||[]).length===1&&cards.length===3&&cards[1].indexOf("scg-card")>0&&cards[2].indexOf("scg-card")<0);
  ok("on a phone (375 px) it is one closed line", h2.indexOf("<details><summary")>0&&h2.indexOf("<details open><summary")<0&&h2.indexOf("1 round in 7 days")>0); }

console.log("── the logging adds ──");
ok("GAMELOG: one guarded line adds why to every round (free unless the round says practice)", /\n  e\.why=st\.why==="practice"\?"practice":"free";/.test(fn("gameLogEntry")));
ok("the practice list's round: one line, why:\"practice\"", /\n  if\(entry\) entry\.why="practice";/.test(fn("mpFinish")));
ok("gameLogRound takes a ready entry; same guard, same path", /function gameLogRound\(st,pre\)\{/.test(src)&&/const e=pre\|\|gameLogEntry\(st\); if\(!e\) return null;/.test(fn("gameLogRound"))&&/db\.ref\("mastery\/gameLog\/"\+kid\+"\/"\+day\)\.push\(e\)/.test(fn("gameLogRound")));
ok("Match / Memory: ONE guarded line in mastMatchFinish", (fn("mastMatchFinish").match(/gameLogMatchEntry/g)||[]).length===2&&/try\{ if\(typeof gameLogRound==="function"&&typeof gameLogMatchEntry==="function"\) gameLogRound\(st,gameLogMatchEntry\(st\)\); \}catch\(e\)\{\}/.test(fn("mastMatchFinish")));
ok("no new write paths: the adds hold no db.ref of their own — the only push is GAMELOG's existing one", !/db\.ref/.test(fn("gameLogMatchEntry"))&&!/db\.ref/.test(fn("gameLogEntry"))&&(fn("gameLogRound").match(/db\.ref/g)||[]).length===1);
{ const writes=[]; const c={console,Date,Math,Object,String,Array,JSON,isFinite};
  vm.createContext(c);
  vm.runInContext(["gameLogDay","gameLogEntry","gameLogMatchEntry","gameLogRound","_matchElapsed","_matchBestKey","mastMatchFinish"].map(fn).join("\n")+
    "\nvar masteryKid='kidA', masteryData={}; var HA_LS={setItem(){}}; var _dry=false; function _dryRun(){ return _dry; } function mstTodayKey(){ return '20261108'; }"+
    "\nvar db={ref:p=>({push:v=>{ W.push(['push',p,JSON.parse(JSON.stringify(v))]); },update:v=>{ W.push(['update',p,v]); },set:v=>{ W.push(['set',p,v]); }})}; var matchState=null;",c);
  c.W=writes;
  const fin=st=>{ c.matchState=st; vm.runInContext("mastMatchFinish()",c); };
  fin({kid:"kidA",deck:"Shapes",style:"memory",pairMode:"two",then:"pick",startTs:1000,endTs:31500,pausedTotal:500,res:{s1:"c",s2:"m"},missed:["s2"],tiles:[]});
  const gl=writes.filter(w=>w[0]==="push");
  ok("a finished Memory · Pick it round: ONE push to mastery/gameLog/<kid>/<day>", gl.length===1&&gl[0][1]==="mastery/gameLog/kidA/20261108", writes);
  const e=gl[0]&&gl[0][2]||{};
  ok("…with exactly game, deck, at, items, why, secs, then", JSON.stringify(Object.keys(e).sort())==='["at","deck","game","items","secs","then","why"]'&&e.game==="memory"&&e.deck==="Shapes"&&e.why==="free"&&e.secs===30&&e.then==="pick", e);
  ok("…items = Pick it's first-try answers (c = right, else missed)", JSON.stringify(e.items)==='[{"id":"s1","ok":true,"n":1},{"id":"s2","ok":false,"n":2}]');
  ok("the match_best write is still the only other write (a new best, this key only)", writes.filter(w=>w[0]!=="push").length===1&&writes[1][1]==="mastery/kidA_settings/match_best");
  ok("the round is logged once (a second finish writes no second push)", (fin(c.matchState),writes.filter(w=>w[0]==="push").length===1));
  writes.length=0;
  fin({kid:"kidA",deck:"Colors",style:"match",pairMode:"same",then:"none",startTs:1000,endTs:11000,pausedTotal:0,res:{},missed:[],tiles:[]});
  const e2=(writes.find(w=>w[0]==="push")||[])[2]||{};
  ok("a plain face-up Match (same pairs): game match, items [], pair same, no then", e2.game==="match"&&JSON.stringify(e2.items)==="[]"&&e2.pair==="same"&&!("then" in e2)&&e2.secs===10, e2);
  writes.length=0; c._dry=true; vm.runInContext("_dry=true",c);
  fin({kid:"kidA",deck:"Dots",style:"memory",pairMode:"two",startTs:1000,endTs:5000,pausedTotal:0,res:{},missed:[],tiles:[]});
  ok("?dryrun=1 → no gameLog push (GAMELOG's guard)", !writes.some(w=>w[1].indexOf("mastery/gameLog")===0));
  ok("…the device copy is still kept for the round", Object.values(c.masteryData.gameLog.kidA["20261108"]).some(x=>x&&x.deck==="Dots"));
  const we=vm.runInContext("gameLogEntry({phase:'done',deck:'D',t0:1000,turns:[{pid:'p1',done:true,first:true,wrong:{}}]},2000)",c);
  ok("every other game's entry gains only why:\"free\"", JSON.stringify(Object.keys(we).sort())==='["at","deck","game","items","secs","why"]'&&we.why==="free");
  ok("a round that says practice keeps it", vm.runInContext("gameLogEntry({phase:'done',why:'practice',turns:[{pid:'p1',done:true,first:true,wrong:{}}]},2000).why",c)==="practice");
  ok("no deck or no finish → no Match entry", vm.runInContext("gameLogMatchEntry({deck:'',endTs:1})===null&&gameLogMatchEntry({deck:'A'})===null",c)); }

console.log("\n"+pass+" passed, "+fail+" failed");
process.exit(fail?1:0);
