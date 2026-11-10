/* ⏱ CARDSECS — time per card (PLAN_scores_page_2026-11-03.md §6 #1–2; her ask: time per card so a rushed answer shows).
   Each game turn and each study card carries ms = card on screen → the kid's first answer, from the shared helper
   (gameCardShown / gameCardAnswered); the existing saves copy it onto the items they already write. The Scores read it:
   🎮 Games "⏱ per card" (median of the judged items, "—" when none), the 🕒 study-sitting rows and the Overall card (the real
   median when present, else the sitting's time ÷ cards as before). Old records without ms still read fine. Touches no live data.
   run: node test_card_seconds.js */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=require("./test_src.js")(path.join(__dirname,"index.html"));
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":"")); } };
const fn=name=>{ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); return src.slice(i,src.indexOf("\n}",i)+2); };
const line=name=>{ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); return src.slice(i,src.indexOf("\n",i)); };
const blk=(a,z)=>{ const i=src.indexOf(a); if(i<0) throw new Error("missing "+a); const j=src.indexOf(z,i); if(j<0) throw new Error("missing end "+z); return src.slice(i,j); };
const A=src.indexOf("// CARDSECS_START"), Z=src.indexOf("// CARDSECS_END"), block=src.slice(A,Z);
const NAMES=/lincoln|ellis|lucy|julian|howe|dewalt|burris|taylor|makenzie|andrew|caleb|adrienne/i;

console.log("── the block ──");
ok("marked once, at the end of the GAMELOG block (the game blocks' own slots stay theirs)", A>0&&Z>A&&src.split("// CARDSECS_START").length===2&&src.split("// CARDSECS_END").length===2&&src.indexOf("// CARDSECS_END\n// GAMELOG_END\n")>0&&src.indexOf("// GAMELOG_START")<A);
ok("every inline <script> still compiles", (()=>{ const re=/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g; let m,n=0; while((m=re.exec(src))){ n++; try{ new vm.Script(m[1]); }catch(e){ console.log("    script #"+n+": "+e.message); return false; } } return n>0; })());
ok("no family or kid name in the block", !NAMES.test(block));
const tagged=src.split("\n").filter(l=>l.indexOf("CARDSECS")>=0);
ok("no new write paths: the block and every ⏱ CARDSECS line hold no db.ref, firebase, set, update, remove, push, transaction or HA_LS write",
  !/db\.ref\(|firebase|\.set\(|\.update\(|\.remove\(|\.push\(|\.transaction\(|HA_LS\.setItem/.test(block)&&
  tagged.length>40&&tagged.every(l=>!/db\.ref\(|firebase|\.set\(|\.update\(|\.remove\(|\.transaction\(|HA_LS\.setItem/.test(l)&&!/\.push\((?!o\))/.test(l)), tagged.filter(l=>/db\.ref\(|\.set\(|\.update\(|\.push\((?!o\))/.test(l)));
ok("…and the saves keep exactly their old db.ref count (gameLogRound 1, gameLogEntry / gameLogMatchEntry / pktEntry 0, pktLogSitting 2)",
  (fn("gameLogRound").match(/db\.ref/g)||[]).length===1&&!/db\.ref/.test(fn("gameLogEntry")+fn("gameLogMatchEntry")+fn("pktEntry"))&&(fn("pktLogSitting").match(/db\.ref/g)||[]).length===2);
ok("no 'fastest' list anywhere in the Scores' code (medians only — no racing)", !/fastest|quickest/i.test((blk("// SCORESPAGE_START","// SCORESGAMES_END")+block+blk("// SREVIEW_START","// SREVIEW_END")).split("\n").filter(l=>!/^\s*\/\//.test(l)).join("\n")));

// the helpers in a bare context, with a clock the test moves
const H={console,Math,Object,Array,isFinite,_now:1000}; vm.createContext(H);
vm.runInContext("var Date={now:()=>_now};\n"+block,H);
const run=e=>vm.runInContext(e,H);
console.log("── the shared timing helper ──");
{ run("_now=1000; var t={pid:'a',done:false}; gameCardShown(t); _now=1500; gameCardShown(t); _now=3400; gameCardAnswered(t); _now=9000; gameCardAnswered(t);");
  ok("shown once (a re-render never restarts the clock), stopped at the FIRST answer: 2400 ms", run("t.shownAt===1000&&t.ms===2400&&t.answeredAt===3400"), run("t"));
  ok("a card never painted gets no ms (and no field at all)", run("(function(){ var u={}; gameCardAnswered(u,5000); return JSON.stringify(u); })()")==="{}");
  ok("a turn already done is not stamped shown", run("(function(){ var u={done:true}; gameCardShown(u,5); return u.shownAt===undefined; })()"));
  ok("left on screen over CARDSECS_MAX_MS → not timed, and a later answer can't time it either", run("(function(){ var u={}; gameCardShown(u,0); gameCardAnswered(u,CARDSECS_MAX_MS+1); gameCardAnswered(u,CARDSECS_MAX_MS+2); return u.ms===undefined&&u.answeredAt!=null; })()"));
  ok("null / not an object → harmless", run("gameCardShown(null)===null&&gameCardAnswered(undefined)===undefined&&gameCardShown(5)===5"));
  ok("gameCardMs: a number in range, else null (old records, bad values)", run("gameCardMs({ms:1234.4})===1234&&gameCardMs({})===null&&gameCardMs(null)===null&&gameCardMs({ms:-1})===null&&gameCardMs({ms:'800'})===null&&gameCardMs({ms:NaN})===null&&gameCardMs({ms:CARDSECS_MAX_MS+1})===null"));
  ok("gameCardMsTo copies only a real ms", run("JSON.stringify(gameCardMsTo({id:'x'},{ms:700}))")==='{"id":"x","ms":700}'&&run("JSON.stringify(gameCardMsTo({id:'x'},{}))")==='{"id":"x"}');
  ok("median: odd → the middle, even → the mean of the two middles, items without ms skipped", run("cardSecsMedian([{ms:5000},{ms:1000},{ms:3000}])")===3000&&run("cardSecsMedian([{ms:1000},{ms:2000},{id:'old'},{ms:4000},{ms:9000}])")===3000&&run("cardSecsMedian([{ms:1000},{ms:2001}])")===1501);
  ok("median of none → null (no ms anywhere, empty, not a list)", run("cardSecsMedian([{id:'a'},{id:'b',ok:true}])")===null&&run("cardSecsMedian([])")===null&&run("cardSecsMedian(null)")===null);
  ok("cardSecsTxt: 2400 → \"2.4 s\", none → \"—\"", run("cardSecsTxt(2400)")==="2.4 s"&&run("cardSecsTxt(null)")==="—");
  ok("a study state → ms by card id, a bank card by deck + name", run("JSON.stringify(cardSecsStudyMs({cards:{'r:a1':{id:'a1',ms:1200},'l:a2':{id:'a2'},'n:Words|cat':{deck:'Words',name:'cat',ms:800}}}))")==='{"id:a1":1200,"new:Words|cat":800}');
  ok("sitting i's items = the `total` items after the earlier sittings'; an entry without sits → all its items",
    run("JSON.stringify(cardSecsSitItems({items:[{id:1},{id:2},{id:3},{id:4},{id:5}],sits:[{total:2},{total:3}]},1).map(x=>x.id))")==="[3,4,5]"&&
    run("cardSecsSitItems({items:[{id:1},{id:2}]},0).length")===2&&run("cardSecsSitItems({items:{0:{id:1},1:{id:2}},sits:[{total:2}]},0).length")===2); }

console.log("── every game stamps shown + answered ──");
// [the function that paints the card, the function(s) where the first answer lands]
const SITES=[["buildWhichHtml",["whichTap"]],["buildSpellHtml",["spellJudge"]],["buildGofishHtml",["gofishSaid","gofishJudge","gofishFindTap","gofishGoFish"]],
  ["buildBingoHtml",["bingoTap"]],["buildMoleHtml",["moleTap"]],["buildJeopHtml",["jeopSaid","jeopJudge","jpJudgeSettle"]],["buildTeachHtml",["teachShow"]],
  ["buildFourHtml",["fourSaid","fourJudge"]],["buildShipHtml",["shipTap","shipSaid"]],["buildTnHtml",["tnJudge"]],["buildSureHtml",["sureSaid","sureJudge"]],
  ["buildJumbleHtml",["ujJudge"]],["buildKaboomHtml",["kaboomSaid","kaboomJudge"]],["buildHangHtml",["hmJudge"]],["buildTrainHtml",["trainJudge"]]];
SITES.forEach(([paint,ans])=>{ const body=paint==="buildTrainHtml"?fn(paint):fn(paint);
  ok(paint.replace(/^build|Html$/g,"")+": painted → gameCardShown · answered in "+ans.join(", ")+" → gameCardAnswered",
    /gameCardShown\(t\)/.test(body)&&ans.every(a=>(a==="teachShow"?line(a):fn(a)).indexOf("gameCardAnswered(t)")>=0)); });
ok("the shared judge (pick / type / Mom) stops the clock on its turn", /gameCardAnswered\(turn\)/.test(fn("_gjSettle")));
ok("the practice list: a turn set up → shown (both kinds), the first tap → answered, both log pushes carry ms",
  (fn("mpTurn").match(/gameCardShown\(U\.cur\)/g)||[]).length===2&&/gameCardAnswered\(c\)/.test(fn("mpTap"))&&/gameCardMsTo\(o,c\); U\.log\.push\(o\)/.test(fn("mpTap"))&&/gameCardMsTo\(o,c\); U\.log\.push\(o\)/.test(fn("mpSpellCheck")));
ok("the train's hook-up levels are not timed (their render returns before the stamp)", fn("buildTrainHtml").indexOf("_trainHookHtml(st,d,color)")<fn("buildTrainHtml").indexOf("gameCardShown"));
ok("the say-them-all and lay-out games carry no stamp (Brain dump, Sort it, Beat my time, Categories, Name them all, Jigsaw)",
  ["buildDumpHtml","buildSortHtml","buildBeatHtml","buildCatsHtml","buildNameallHtml","buildJigHtml"].every(f=>fn(f).indexOf("gameCardShown")<0));
ok("study: the drawn card is stamped shown, the first grade (mstAnswer) stamps answered", /gameCardShown\(card\);[^\n]*\n\s*h\+=mstCardHtml\(session,card\)/.test(src)&&/card\.first = ans;\n\s*if \(typeof gameCardAnswered === "function"\) gameCardAnswered\(card\)/.test(fn("mstAnswer")));

console.log("── a real Which one? round: tap → item ms ──");
{ const c={console,Math,Object,Array,String,JSON,isFinite,_now:0}; vm.createContext(c);
  vm.runInContext("var Date={now:()=>_now};\n"+block+"\n"+["gameLogEntry","whichTap"].map(fn).join("\n")+
    "\nvar whichState=null, masteryKid='kidA'; function matchBonk(){} function matchDing(){} function _mastRe(){} function _whichSay(){} function _whichItems(){ return []; } function whichTiles(){ return null; } function whichPool(){ return []; } function setTimeout(){}",c);
  vm.runInContext("whichState={kid:'kidA',deck:'Shapes',phase:'play',t0:0,i:0,lock:false,first:0,returned:{},turns:[{pid:'s1',tiles:['s1','s2','s3'],wrong:{},done:false,first:false},{pid:'s2',tiles:['s1','s2','s3'],wrong:{},done:false,first:false}]};"+
    "_now=500; gameCardShown(whichState.turns[0]); _now=2100; whichTap(1); _now=4000; whichTap(0);"+   // a wrong tap at 1.6 s, then right
    "whichState.lock=false; whichState.i=1; _now=5000; gameCardShown(whichState.turns[1]); _now=5800; whichTap(1);"+
    "whichState.phase='done'; var E=gameLogEntry(whichState,9000);",c);
  const E=c.E;
  ok("first card: ms = shown → the FIRST tap (the wrong one), 1600; the right tap later doesn't move it", E.items[0].ms===1600&&E.items[0].ok===false&&E.items[0].n===2, E.items);
  ok("second card: 800 ms, right on the first tap", E.items[1].ms===800&&E.items[1].ok===true);
  ok("every existing field kept: id, ok, n (+ back/fail when set)", JSON.stringify(Object.keys(E.items[0]).sort())==='["id","ms","n","ok"]');
  const old=vm.runInContext("gameLogEntry({phase:'done',deck:'D',turns:[{pid:'p1',done:true,first:true,wrong:{}}]},2000)",c);
  ok("a turn that was never timed → the item exactly as before (no ms key)", JSON.stringify(old.items)==='[{"id":"p1","ok":true,"n":1}]'); }

console.log("── Match / Memory's Pick it, the Train study sitting ──");
{ const c={console,Math,Object,Array,String,JSON,isFinite}; vm.createContext(c);
  vm.runInContext(block+"\n"+["gameLogMatchEntry","pktEntry"].map(fn).join("\n"),c);
  const e=vm.runInContext("gameLogMatchEntry({deck:'Shapes',style:'memory',endTs:1,sec:20,res:{s1:'c',s2:'m'},resMs:{s1:1300}},5)",c);
  ok("Pick it: a card picked carries ms (gate open → pick); one without stays as before", JSON.stringify(e.items)==='[{"id":"s1","ok":true,"n":1,"ms":1300},{"id":"s2","ok":false,"n":2}]', e.items);
  ok("the pick sites time it from the gate opening", /st\.resMs\|\|\(st\.resMs=\{\}\)\)\[g\.pid\]=Date\.now\(\)-g\.openedAt/.test(fn("mastMatchPick"))&&/st\.resMs\|\|\(st\.resMs=\{\}\)\)\[g\.pid\]=Date\.now\(\)-g\.openedAt/.test(fn("mastMatchSaidPick")));
  const p=vm.runInContext("pktEntry({study:{sid:'abc'},phase:'done',deck:'Letters',t0:0,turns:[{pid:'a',L:'A',done:true,first:true,ms:900},{L:'B',done:true,first:false}]},60000,3,'20261108')",c);
  ok("the Train as a study sitting: items carry ms when timed, the rest unchanged", JSON.stringify(p.items)==='[{"id":"a","name":"A","deck":"Letters","result":"c","ms":900},{"id":"train_B","name":"B","deck":"Letters","result":"m"}]', p.items); }

console.log("── a study sitting's save ──");
{ const save=fn("_mstSaveInner");
  ok("the sitting's items take each card's ms (cardSecsStudyMs over mstState), shown and graded alike", /_csMs=cardSecsStudyMs\(mstState\)/.test(save)&&(save.match(/logItems\.push\(_cs\(\{id:id,name:nm,deck:dk,result:/g)||[]).length===2);
  ok("…the same one targeted set of the day's entry as before", (save.match(/db\.ref\("mastery\/studyLog\//g)||[]).length===1);
  // the mapping closure, run on its own
  const i=save.indexOf("  let _csMs="), j=save.indexOf("\n  Object.keys(scores)",i);
  const c={console,Math,Object,Array,String,JSON,isFinite}; vm.createContext(c);
  vm.runInContext(block+"\nvar mstState={cards:{'r:a1':{id:'a1',ms:2500},'r:a2':{id:'a2'},'n:Words|cat':{deck:'Words',name:'cat',ms:700}}}; var cat={id:'kid_cat',subject:'Words',prompt:'cat'}; var mintedAll=[cat];\n"+save.slice(i,j)+
    "\nvar R=[_cs({id:'a1',result:'c'},{id:'a1'}),_cs({id:'a2',result:'m'},{id:'a2'}),_cs({id:'kid_cat',result:'shown'},cat)];",c);
  ok("a ladder card by id, a minted bank card by deck + name, an untimed one without ms", JSON.stringify(c.R)==='[{"id":"a1","result":"c","ms":2500},{"id":"a2","result":"m"},{"id":"kid_cat","result":"shown","ms":700}]', c.R);
  const S={console,Math,Object,Array,String,JSON,isFinite,_now:0}; vm.createContext(S);
  vm.runInContext("var Date={now:()=>_now};\n"+block+"\n"+fn("mstAnswer"),S);
  vm.runInContext("var st={queue:['r:a1'],passes:2,cards:{'r:a1':{key:'r:a1',kind:'review',id:'a1',goods:0,first:null,done:false}}}; _now=100; gameCardShown(st.cards['r:a1']); _now=3100; mstAnswer(st,'r:a1','again'); _now=9000; mstAnswer(st,'r:a1','good');",S);
  ok("mstAnswer: the first grade times the card (3000 ms), the regrade after Again doesn't", vm.runInContext("st.cards['r:a1'].ms===3000&&st.cards['r:a1'].done===true",S));
  vm.runInContext("var st2={queue:['r:b'],passes:2,cards:{'r:b':{key:'r:b',kind:'review',id:'b',goods:0,first:null,done:false}}}; mstAnswer(st2,'r:b','good');",S);
  ok("mstAnswer on a card never stamped shown (old saved sitting, tests) adds no field", JSON.stringify(Object.keys(vm.runInContext("st2.cards['r:b']",S)).sort())==='["done","first","goods","id","key","kind"]', vm.runInContext("st2.cards['r:b']",S)); }

console.log("── 🎮 Games: ⏱ per card ──");
{ const ctx={console}; vm.createContext(ctx);
  vm.runInContext(blk("const SC_RANK=","\n// History-shaped view")+"\n"+blk("// SCORESPAGE_START","// SCORESPAGE_END")+"\n"+blk("// SCORESGAMES_START","// SCORESGAMES_END")+"\n"+block,ctx);
  const scgStats=vm.runInContext("scgStats",ctx), scgHtml=vm.runInContext("scgHtml",ctx);
  const GL={kid1:{"20261108":{
    a:{game:"which",deck:"Shapes",at:1,secs:30,why:"free",items:[{id:"c1",ok:true,n:1,ms:1000},{id:"c2",ok:false,n:2,ms:4000},{id:"c3",ok:true,n:1,ms:2000},{id:"c2",ok:true,n:1,back:true,ms:100}]},
    b:{game:"which",deck:"Shapes",at:2,secs:20,why:"free",items:[{id:"c1",ok:true,n:1,ms:3000},{id:"c4",ok:true,n:1}]},
    c:{game:"mole",deck:"Shapes",at:3,secs:40,items:[{id:"c1",ok:true,n:1},{id:"c2",ok:true,n:1}]},
    d:{game:"gofish",deck:"Shapes",at:4,secs:40,items:[{id:"c1",ok:true,n:1,ms:50}]}}}};   // before judging
  const s=scgStats("kid1",{gameLog:GL,cards:[{id:"c1",subject:"Shapes"}],today:"20261108"});
  const G=k=>s.games.find(g=>g.key===k);
  ok("Which one?: the median of the judged items' ms over every round (1000, 4000, 2000, 3000 → 2500); a come-back card and an untimed one are left out", G("which").ms===2500, G("which"));
  ok("Whack-a-mole: rounds from before the timer → null", G("mole").ms===null);
  ok("a round before judging adds nothing to a median (its own grey row shows —)", G("gofish").ms===null&&G("gofish").pre.rounds===1);
  const h=scgHtml(s,true,[]);
  ok("the table has a ⏱ per card column: 2.5 s for Which one?, — for the rest", h.indexOf("⏱ per card</th>")>0&&/>which<\/td>(?:(?!<\/tr>).)*<td[^>]*>2\.5 s<\/td><\/tr>/.test(h)&&/>mole<\/td>(?:(?!<\/tr>).)*<td[^>]*>—<\/td><\/tr>/.test(h), h.slice(h.indexOf("<table"),h.indexOf("</table>")));
  ok("…the before-judging row's cell is — too, and every row has the same 7 cells", (h.match(/<tr class="scg-pre"(?:(?!<\/tr>).)*<\/tr>/)||[""])[0].split("<td").length===8&&(h.match(/<tr><td(?:(?!<\/tr>).)*<\/tr>/g)||[]).every(r=>r.split("<td").length===8));
  ok("\"How these are counted\" says what the figure is", /⏱ per card = the middle \(median\) time from a card showing to the first answer/.test(h));
  const FX=JSON.parse(fs.readFileSync(path.join(__dirname,"test_fixtures","scores_games_live_2026-11-08.json"),"utf8"));
  const L=scgStats("kid3",{gameLog:FX.gameLog,matchLog:FX.matchLog,settings:FX.settings.kid3,cards:FX.cards.kid3,today:"20261108"});
  ok("the live fixture (every record from before the timer): every game's ⏱ is null → \"—\"", L.games.every(g=>g.ms===null)&&scgHtml(L,true,FX.cards.kid3).indexOf(" s</td></tr>")<0); }

console.log("── 🕒 study-sitting rows + the Overall card ──");
{ const CODE=blk("// MSTALERT_START","// SREVIEW_END");
  const ctx={console,JSON,Object,Array,Math,Set,String,Date,isFinite,parseFloat,ROSTER:["kida"],masteryData:{
      kida_sessions:{mix:{name:"Mix",emoji:"M",kind:"mix",who:"solo"}},
      studyLog:{kida:{mix:{"20261104":{total:5,secs:50,sits:[{secs:20,total:2},{secs:30,total:3}],
        items:[{id:"a",result:"c"},{id:"b",result:"c"},{id:"c",result:"c",ms:1200},{id:"d",result:"m",ms:2600},{id:"e",result:"c",ms:1800}]}}}}},
    _todayStr:()=>"2026-11-04",mstTodayKey:()=>"20261104",esc:s=>String(s),cap:s=>s[0].toUpperCase()+s.slice(1),
    mstSessions:kid=>Object.entries(ctx.masteryData[kid+"_sessions"]||{}).map(([sid,r])=>Object.assign({sid,kind:"deck",who:"solo"},r))};
  vm.createContext(ctx); vm.runInContext(block+"\n"+CODE,ctx);
  const rows=vm.runInContext("srRows()",ctx);
  ok("sitting 0 (no ms on its cards) keeps time ÷ cards; sitting 1 gets its cards' median (1800)", rows.length===2&&rows[0].ms===undefined&&rows[1].ms===1800, rows);
  const h0=vm.runInContext("srRowHTML(_r[0],0,3)",Object.assign(ctx,{_r:rows})), h1=vm.runInContext("srRowHTML(_r[1],1,3)",ctx);
  ok("…the untimed row shows 10 s/card as before (20 s ÷ 2)", h0.indexOf("10 s/card</b>")>0&&h0.indexOf("⏱")<0, h0);
  ok("…the timed row shows 1.8 s/card ⏱ (red under the 3 s floor)", h1.indexOf("1.8 s/card ⏱</b>")>0&&h1.indexOf("#fef2f2")>0, h1);
  // the Overall card
  const O={console}; vm.createContext(O);
  vm.runInContext(blk("const SC_RANK=","\n// History-shaped view")+"\n"+blk("// SCORESPAGE_START","// SCORESPAGE_END")+"\n"+block,O);
  const W={from:"20261102",to:"20261108"};
  const timed={kid1:{mix:{"20261104":{total:3,secs:60,sits:[{secs:60,total:3}],items:[{id:"a",result:"c",ms:1000},{id:"b",result:"c",ms:3000},{id:"c",result:"m"}]}},
                     words:{"20261105":{total:2,secs:40,items:[{id:"d",result:"c",ms:5000},{id:"e",result:"c",ms:2500}]}}}};
  const old={kid1:{mix:{"20261104":{total:4,secs:30,sits:[{secs:10,total:2},{secs:20,total:2}],items:[{id:"a",result:"c"}]},"20261001":{total:9,secs:900}}}};
  const cs=(L)=>vm.runInContext("scpCardSecs",O)("kid1",L,W);
  ok("timed cards in the window → their median, 2.75 → 2.8 s, timed, 4 cards", JSON.stringify(cs(timed))==='{"s":2.8,"timed":true,"n":4}', cs(timed));
  ok("no ms anywhere → the sittings' time ÷ cards as before: 30 s ÷ 4 = 7.5 s (a day outside the window left out)", JSON.stringify(cs(old))==='{"s":7.5,"timed":false,"n":4}', cs(old));
  ok("no sittings → null (and no line on the card)", cs({})===null&&cs({kid1:{}})===null);
  const card=vm.runInContext("scpCardHtml",O), nums=vm.runInContext("scpKidNumbers",O);
  const r=nums("kid1",{studyLog:timed,today:"20261108"}), r0=nums("kid1",{studyLog:old,today:"20261108"}), rn=nums("kid1",{today:"20261108"});
  ok("the Overall card shows ⏱ Study, a card: 2.8 s (median, 4 timed)", r.cardSecs.s===2.8&&/⏱ Study, a card: <b>2\.8 s<\/b>[^<]*<span[^>]*>the middle time from a card showing to the first answer · 4 cards timed/.test(card(r)));
  ok("…7.5 s with \"sitting time ÷ cards\" for an old log", /⏱ Study, a card: <b>7\.5 s<\/b> <span[^>]*>sitting time ÷ cards — no card timed yet/.test(card(r0)));
  ok("…and no line at all for a kid with no sittings", rn.cardSecs===null&&card(rn).indexOf("scp-cardsecs")<0); }

console.log("\n"+pass+" passed, "+fail+" failed");
process.exit(fail?1:0);
