/*
 * ⚖️ GAMEJUDGE — the shared "how is I said it checked" helper (her decision 2026-11-08, from the games audit: "one setting per kid,
 * not a pill per game"; gofishSaid / fourSaid / shipSaid / kaboomSaid / sureSaid are copies of jeopSaid and hook in next).
 *   · the kid's ONE setting: mastery/<kid>_settings/games/judge (pick / type / mom) + games/judgeChoices (3 / 4 / 5, default 4);
 *     nothing stored → by grade: Pre-K–2nd pick, 3rd up type, unknown pick. Mom sets it on the row above the 🎮 Games grid.
 *   · gameJudgeAct(st, turn, {kid, deck, right, names, onRight, onWrong, speakerChips?, mode?, n?, shuffle?, live?, line?})
 *     → pick chips (🔊 each), the type box, or Mom's ✓ / ✗ behind her code; gameJudgeHtml(turn, color, lock) draws it.
 *   · gameJudgeStamp(round, mode) → round.judge; gameLogEntry stamps every judged round.
 * Runs the REAL code (GAMELOG + GAMEGRID + GAMEJUDGE + SAIDPICK's _matchLures / _matchTtsOk + the study session's mstTypeAnsOk) on a
 * made-up game — no Jeopardy here (test_jeop_judge.js has that).
 *   run:  node test_game_judge_helper.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
let pass=0, fail=0;
function ok(n,c,x){ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":""));} }
const src=require("./test_src.js")(path.join(__dirname,"index.html"));
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("markers "+a); return src.slice(i,j); };
function fnIn(name){ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("no function "+name); const j=src.indexOf("\nfunction ",i+10), k=src.indexOf("\n// ",i+10); return src.slice(i,Math.min(j<0?1e9:j,k<0?1e9:k)); }
const seeded=seed=>{ let x=seed||7; return ()=>{ x=(x*1103515245+12345)&0x7fffffff; return (x%10000)/10000; }; };

function world(o){
  o=o||{};
  const writes=[], said=[], timers=[], nodes={};
  const CODE=cut("// GAMELOG_START","// GAMELOG_END")+"\n"+cut("// GAMEGRID_START","// GAMEGRID_END")+"\n"+cut("// GAMEJUDGE_START","// GAMEJUDGE_END")+"\n"+
    src.slice(src.indexOf("const MST_TYPEANS_FRAC="),src.indexOf("\n",src.indexOf("const MST_TYPEANS_FRAC=")))+"\n"+["_matchPlain","_matchLures","_matchTtsOk","mstNormMath","mstTypeAnsOk"].map(fnIn).join("\n");
  const ctx={console,JSON,Object,Array,String,Number,Set,Map,RegExp,Date,parseInt,isNaN,setTimeout:(f)=>{ timers.push(f); return timers.length; },
    Math:Object.assign(Object.create(Math),{random:seeded(o.seed||3)}),
    window:{speechSynthesis:o.noTts?null:{}},
    document:{getElementById:id=>nodes[id]||null},
    _dryRun:()=>!!o.dry,HA_LS:{setItem(){}},_mastRe(){},momHere:()=>!!o.mom,renderAll(){},cap:s=>s,
    pinOk:v=>v==="1234",dadPinOk:v=>v==="5678",ckGradeOf:k=>(o.grade===undefined?null:o.grade),
    mastSpeak:t=>said.push(t),mstTodayKey:()=>"20261108",masteryKid:"k",GAMES_LIST:[],_gamesItems:()=>[],
    masteryData:{k:[],k_settings:o.settings||{}},
    db:{ref:p=>({set:v=>writes.push(["set",p,v]),update:v=>writes.push(["update",p,v]),push:v=>writes.push(["push",p,v]),remove:()=>writes.push(["remove",p])})}};
  vm.createContext(ctx); vm.runInContext(CODE,ctx);
  return {c:ctx,writes,said,timers,nodes};
}
const NAMES=["jay","wren","crow","owl","hawk"];
function act(w,mode,extra){ const st={kid:"k"}, turn={}, got=[];
  const opts=Object.assign({kid:"k",deck:"Birds",right:"robin",names:NAMES,mode:mode,onRight:t=>got.push("R"),onWrong:(t,g)=>got.push("W:"+g)},extra||{});
  const on=w.c.gameJudgeAct(st,turn,opts); return {st,turn,got,on,h:()=>w.c.gameJudgeHtml(turn,"#123456",false)}; }

// ── by text ──
const blk=cut("// GAMEJUDGE_START","// GAMEJUDGE_END");
ok("no kid's or family's name in the block",!/lincoln|ellis|lucy|julian|caleb|taylor|makenzie|kenzie|andrew|adrienne|dewalt|burris|howe/i.test(blk));
ok("the exact signatures",/function gameJudgeAct\(st,turn,opts\)\{/.test(blk)&&/function gameJudgeHtml\(turn,color,lock\)\{/.test(blk)&&/function gameJudgeStamp\(round,mode\)\{/.test(blk)&&/function gameJudgeMode\(kid\)\{/.test(blk)&&/function gameJudgeChoices\(kid\)\{/.test(blk)&&/function gameJudgeSet\(kid,key,val\)\{/.test(blk)&&/function gameJudgeRowHtml\(kid\)\{/.test(blk));

// ── the kid's one setting ──
{ const m=g=>world({grade:g}).c.gameJudgeMode("k");
  ok("defaults by grade: unknown / Pre-K / K / 1st / 2nd → pick; 3rd / 8th → type",[undefined,-1,0,1,2].every(g=>m(g)==="pick")&&m(3)==="type"&&m(8)==="type");
  const s=(g,set)=>world({grade:g,settings:{games:set}}).c;
  ok("a stored value wins: a 1st grader on type, a 5th grader on pick, either on mom",s(1,{judge:"type"}).gameJudgeMode("k")==="type"&&s(5,{judge:"pick"}).gameJudgeMode("k")==="pick"&&s(5,{judge:"mom"}).gameJudgeMode("k")==="mom");
  ok("choices: default 4; 3 / 5 stored (number or string); a bad value → 4",s(1,{}).gameJudgeChoices("k")===4&&s(1,{judgeChoices:3}).gameJudgeChoices("k")===3&&s(1,{judgeChoices:"5"}).gameJudgeChoices("k")===5&&s(1,{judgeChoices:2}).gameJudgeChoices("k")===4&&s(1,{judgeChoices:"x"}).gameJudgeChoices("k")===4);
  ok("read defensively: no settings, games not an object, a junk judge → the grade's default",world({}).c.gameJudgeMode("nobody")==="pick"&&world({settings:{games:7}}).c.gameJudgeMode("k")==="pick"&&s(4,{judge:"loud"}).gameJudgeMode("k")==="type");
  const w=world({mom:true}); w.c.gameJudgeSet("k","judge","type"); w.c.gameJudgeSet("k","judgeChoices","3");
  ok("Mom: one targeted set each, mastery/<kid>_settings/games/judge and …/judgeChoices (a number)",JSON.stringify(w.writes)==='[["set","mastery/k_settings/games/judge","type"],["set","mastery/k_settings/games/judgeChoices",3]]');
  ok("bad keys / values write nothing",!w.c.gameJudgeSet("k","judge","yell")&&!w.c.gameJudgeSet("k","judgeChoices",6)&&!w.c.gameJudgeSet("k","mode","pick")&&!w.c.gameJudgeSet("","judge","pick")&&w.writes.length===2);
  const k=world({}); ok("not Mom: refused, nothing written",k.c.gameJudgeSet("k","judge","mom")===false&&k.writes.length===0&&k.c.gameJudgeMode("k")==="pick");
  const d=world({mom:true,dry:true}); d.c.gameJudgeSet("k","judge","mom"); ok("dry run: nothing written",d.writes.length===0);
  const r=world({mom:true,grade:4}).c.gameJudgeRowHtml("k");
  ok("Mom's row: the question, three pills (Type it ✓ by grade), 'Not set', pills live",/How is “I said it” checked for k\?/.test(r)&&/✓ Type it/.test(r)&&(r.match(/class="gj-pill/g)||[]).length===3&&/Not set/.test(r)&&!/disabled/.test(r));
  const rp=world({mom:true,settings:{games:{judge:"pick",judgeChoices:5}}}).c.gameJudgeRowHtml("k");
  ok("pick: + Choices 3 / 4 / 5 (5 ✓), no 'Not set'",(rp.match(/class="gj-pill/g)||[]).length===6&&/✓ 5</.test(rp)&&/gameJudgeSet\('k','judgeChoices',4\)/.test(rp)&&!/Not set/.test(rp));
}

// ── the helper renders each mode ──
{ const w=world({grade:1}), a=act(w,"pick");
  ok("pick: act → true, the ask on the line, the first screen is 🗣 I said it only",a.on&&/I said it/.test(a.h())&&!/said-ch/.test(a.h()));
  w.c.gameJudgeSaid(); const h=a.h();
  ok("…then 4 choice chips, each with a 🔊",(h.match(/class="said-ch"/g)||[]).length===4&&(h.match(/class="said-hear"/g)||[]).length===4&&/gameJudgePick\(0\)/.test(h)&&/gameJudgeHear\(3,event\)/.test(h));
  w.c.gameJudgeHear(2,{}); ok("🔊 says that chip only",w.said.join()===a.turn.gj.ch[2].text&&!a.turn.gj.done);
  w.c.gameJudgePick(a.turn.gj.ch.findIndex(x=>!x.ok));
  ok("a wrong pick → onWrong(turn, the text picked); the right chip ✓ green, the picked one red, no taps left",a.got.length===1&&/^W:/.test(a.got[0])&&/✓ robin/.test(a.h())&&/#dc2626/.test(a.h())&&!/onclick="gameJudgePick/.test(a.h()));
  const n=world({}), b=act(n,"pick",{speakerChips:false}); n.c.gameJudgeSaid();
  ok("speakerChips:false → chips without 🔊",/class="said-ch"/.test(b.h())&&!/said-hear/.test(b.h()));
  const q=world({noTts:true}), c=act(q,"pick"); q.c.gameJudgeSaid();
  ok("TTS dead on the device → no 🔊 either",!/said-hear/.test(c.h()));
  const n3=act(world({}),"pick",{n:3}), n5=act(world({}),"pick",{n:5}), kid=act(world({settings:{games:{judgeChoices:5}}}),"pick");
  ok("n 3 / 5 → 3 / 5 chips; no n → the kid's judgeChoices (5)",n3.turn.gj.ch.length===3&&n5.turn.gj.ch.length===5&&kid.turn.gj.ch.length===5);
  const few=act(world({}),"pick",{names:["jay","JAY ","robin"]});
  ok("one usable other name → 2 chips (fewer, never a repeat)",few.on&&few.turn.gj.ch.length===2);
  const nums=act(world({}),"pick",{right:"12",names:["3","11","13","40","2","14"],n:3});
  ok("a number deck: the nearest numbers are the others (11, 13)",nums.turn.gj.ch.map(x=>x.text).sort().join()==="11,12,13");
}
{ const w=world({}), a=act(w,"type"), h=a.h();
  ok("type: a text box + Check, no chips, no I said it",/id="gj-type-in"/.test(h)&&/gameJudgeCheck\(\)/.test(h)&&!/said-ch|I said it/.test(h));
  w.c.gameJudgeSaid(); ok("no self-report on a type card",a.got.length===0&&!a.turn.gj.done);
  w.nodes["gj-type-in"]={value:"ROBIN"}; w.c.gameJudgeCheck(); ok("'ROBIN' → onRight; '✓ robin'",a.got.join()==="R"&&/✓ robin/.test(a.h()));
  const b=act(w,"type"); w.c.gameJudgeTyped("robbin"); delete w.nodes["gj-type-in"]; w.c.gameJudgeCheck();
  ok("'robbin' → onWrong('robbin'); shows what was typed and the right one",b.got.join()==="W:robbin"&&/You typed “robbin”/.test(b.h())&&/robin<\/span>/.test(b.h()));
}
{ const w=world({}), a=act(w,"mom");
  ok("mom: '🔒 Show Mom the answer' — the answer is not on the screen",/Show Mom the answer/.test(a.h())&&a.h().indexOf("robin")<0);
  w.c.gameJudgeMom(true); ok("✓ before the gate does nothing",a.got.length===0);
  w.c.gameJudgeMomShow(); ok("→ the code box, still no answer",/id="gj-mom-pin"/.test(a.h())&&a.h().indexOf("robin")<0);
  w.c.gameJudgeCode("9999"); ok("a wrong code: nothing",!a.turn.gj.momShow);
  w.c.gameJudgeCode("1234"); ok("Mom's code → the answer + ✓ / ✗",/For Mom/.test(a.h())&&/>robin</.test(a.h())&&/gameJudgeMom\(false\)/.test(a.h())&&a.st.gjMomOk===true);
  w.c.gameJudgeMom(false); ok("✗ → onWrong; '✗ It's robin'",a.got.join()==="W:mom"&&/✗ It’s/.test(a.h()));
  const m=world({mom:true}), b=act(m,"mom"); m.c.gameJudgeMomShow(); m.c.gameJudgeMom(true);
  ok("the Mom switch on: straight to the answer, ✓ → onRight",b.got.join()==="R");
}
{ const w=world({}), a=act(w,"pick"), b=act(w,"type");
  w.c.gameJudgeSaid(); ok("only the newest act takes taps (the type card is on screen)",a.turn.gj.step==="say");
  a.h(); w.c.gameJudgeSaid(); ok("…drawing a card points the taps at it",a.turn.gj.step==="pick");
  ok("act refuses: no right answer / no st / pick with no other name",!w.c.gameJudgeAct({kid:"k"},{},{right:"",names:NAMES})&&!w.c.gameJudgeAct(null,{},{right:"x"})&&!w.c.gameJudgeAct({kid:"k"},{},{right:"x",names:["X"],mode:"pick"}));
  ok("the turn's JSON carries no callbacks / game link",JSON.stringify(a.turn).indexOf("onRight")<0&&JSON.stringify(a.turn).indexOf("_ctx")<0);
}

// ── the stamp ──
{ const w=world({}), c=w.c;
  ok("gameJudgeStamp: sets judge for pick / type / mom, ignores anything else",c.gameJudgeStamp({},"type").judge==="type"&&c.gameJudgeStamp({},"mom").judge==="mom"&&!("judge" in c.gameJudgeStamp({},"loud"))&&c.gameJudgeStamp(null,"pick")===null);
  const st={game:"fish",deck:"Birds",phase:"done",judge:"pick",turns:[{pid:"a",done:true,first:true,wrong:{}},{pid:"b",done:true,first:false,fail:true,wrong:{x:1}}]};
  const e=c.gameLogEntry(st,1000);
  ok("a judged round's log entry carries judge (any game)",e.judge==="pick"&&e.game==="fish"&&e.items.length===2);
  const e2=c.gameLogEntry(Object.assign({},st,{judge:undefined}),1000);
  ok("an unjudged round: no judge key (older rounds look the same)",!("judge" in e2));
  c.gameLogRound(Object.assign({},st,{kid:"k"}));
  const p=w.writes.find(x=>x[0]==="push");
  ok("gameLogRound pushes it with judge",p&&p[2].judge==="pick");
}
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
