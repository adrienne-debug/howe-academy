/*
 * 🎰 Jeopardy "Daily double" (her go 2026-11-03; plan Tier 4 "Jeopardy with wager" + Tier 3 "Sure? then flip"). A Jeopardy GAME RULE,
 * default off. On: once a square's card is open, 👍 Sure / 🤷 Not sure before the answer controls; a sure miss gets the louder line and
 * comes back FIRST; the finish adds "Sure and right N · Sure but missed M". No points. Runs the REAL code (JEOPARDY + GAMERULES + JPWAGER).
 *   run:  node test_jp_wager.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
let pass=0, fail=0;
function ok(n,c,x){ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":""));} }
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("markers "+a); return src.slice(i,j); };
function fnText(name){ const i=src.indexOf("function "+name+"("); if(i<0) return ""; const j=src.indexOf("\nfunction ",i+10); return src.slice(i,j<0?undefined:j); }
const seeded=seed=>{ let x=seed||7; return ()=>{ x=(x*1103515245+12345)&0x7fffffff; return (x%10000)/10000; }; };

// ── by text ──
const a=src.indexOf("// JPWAGER_START"), b=src.indexOf("// JPWAGER_END"), sp=src.indexOf("// SPELLBUILD_END"), sc=src.indexOf("// STUDYCOUNTS_START");
ok("one JPWAGER block among the game blocks: after SPELLBUILD_END, before STUDYCOUNTS_START, straight after another block's _END line",sp>0&&a>sp&&b>a&&sc>b&&/^\/\/ [A-Z_]+_END$/m.test(src.slice(sp,a).trim().split("\n").pop()||"")&&src.indexOf("// JPWAGER_START",a+1)<0&&src.indexOf("// JPWAGER_END",b+1)<0);
const blk=src.slice(a,b), code=blk.replace(/^\s*\/\/.*$/gm,"");
ok("no kid's name; no writes of its own (no db, no ref, no set); no points, wager money, lives or clock",!/lincoln|ellis|lucy|julian|caleb|taylor|makenzie|kenzie|andrew/i.test(blk)&&!/\bdb\b|\.ref\(|\.set\(|\.update\(|\.push\(|HA_LS|points|\bpts\b|coins|lives|setTimeout|setInterval/.test(code));
ok("the rule lives in GAME_RULES.jeop 'wager', default off, options off / on",/jeop:\[\{key:"wager",label:"Daily double[^\n]*def:"off",opts:\[/.test(cut("const GAME_RULES={","\n};"))&&/\["off","Off"/.test(cut("const GAME_RULES={","\n};"))&&/\["on","On"/.test(cut("const GAME_RULES={","\n};")));
const JP=cut("// JEOPARDY_START","// JEOPARDY_END");
ok("JEOPARDY hooks, all guarded: _jpOpen asks, _jpTurn waits, _jpAfter's lines, _jpEnd's order, the buttons, the finish line, the state slot",(JP.match(/🎰 JPWAGER/g)||[]).length===6&&/typeof jpWagerAsk==="function"\) jpWagerAsk\(st,st\.turns\.length-1\)/.test(JP)&&/st\.wager!=null\) return null/.test(JP)&&/typeof jpWagerSort==="function"\)\?jpWagerSort\(st,backs\):backs/.test(JP)&&/typeof jpWagerAskHtml==="function"\) h\+=jpWagerAskHtml\(st,color\); else/.test(JP)&&/typeof jpWagerFinishHtml==="function"\) h\+=jpWagerFinishHtml\(st\)/.test(JP)&&/say:"",wager:null\}/.test(JP));

// ── a sandbox: WHICHONE + GAMELOG + GAMEGRID + GAMERULES + JEOPARDY + JPWAGER ──
const M=(f,ans,tier)=>({id:"m_"+f,subject:"Math Facts",prompt:f,answer:ans,status:"active",tier:tier||"weekly"});
const MATH=[M("7+8","15","monthly"),M("6+6","12","bi_weekly"),M("9+4","13","weekly"),M("5+5","10","every_other_day"),M("8+3","11","daily")];
function world(items,o){
  o=o||{};
  const writes=[], said=[], dings=[], timers=[];
  const CODE=cut("// WHICHONE_START","// WHICHONE_END")+"\n"+cut("// GAMELOG_START","// GAMELOG_END")+"\n"+cut("// GAMEGRID_START","// GAMEGRID_END")+"\n"+cut("// GAMERULES_START","// GAMERULES_END")+"\n"+cut("// JEOPARDY_START","// JEOPARDY_END")+"\n"+cut("// JPWAGER_START","// JPWAGER_END");
  const ctx={console,JSON,Object,Array,String,Number,Math,Set,Map,RegExp,Date,parseInt,isNaN,setTimeout:(f,ms)=>{ timers.push(f); return timers.length; },
    document:{getElementById:()=>null,createElement:()=>({style:{},remove(){}}),body:{appendChild(){}}},
    _dryRun:()=>!!o.dry,HA_LS:{setItem(){}},_mastRe(){},bbAudioUnlock(){},momHere:()=>true,renderAll(){},cap:s=>s,
    _gamesItems:k=>(k==="k"?items||[]:[]),
    _smTileVis:()=>null,
    _matchPlain:h=>String(h||"").replace(/<[^>]*>/g," ").replace(/\s+/g," ").trim(),
    esc:s=>String(s||"").replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;"),
    mastSpeak:(t)=>said.push(t),matchDing:()=>dings.push("ding"),matchBonk:()=>dings.push("bonk"),_showCelebration(){},
    MAST_TIER_ORDER:["daily","every_other_day","every_third_day","weekly","bi_weekly","monthly","learned","graduated"],
    mstTodayKey:()=>"20261103",mastView:"jeop",masteryKid:"k",
    masteryData:{k:items||[],k_settings:o.settings||{}},
    db:{ref:p=>({set:v=>writes.push(["set",p,v]),update:v=>writes.push(["update",p,v]),push:v=>writes.push(["push",p,v]),remove:()=>writes.push(["remove",p])})}};
  vm.createContext(ctx);
  vm.runInContext(CODE+"\nObject.defineProperty(this,'jeopState',{get:()=>jeopState,set:v=>{jeopState=v;}}); Object.defineProperty(this,'jeopPickDecks',{get:()=>jeopPickDecks,set:v=>{jeopPickDecks=v;}}); Object.defineProperty(this,'_jpRandom',{get:()=>_jpRandom,set:v=>{_jpRandom=v;}});",ctx);
  ctx._jpRandom=seeded(o.seed||3);
  const flush=()=>{ while(timers.length){ const f=timers.shift(); f(); } };
  return {c:ctx,writes,said,dings,flush};
}
const backOf=(c,pid)=>c._whichBack(c.masteryData.k.find(x=>x.id===pid));
function typeAns(w,bad){ const c=w.c, st=c.jeopState, t=st.turns[st.open.t]; const s=bad?"777":backOf(c,t.pid); for(const ch of s) c.jeopKey(ch); c.jeopCheck(); }
const openCell=(w,ci)=>{ w.c.jeopPickCell(ci); return w.c.jeopState.open; };

{ const w=world(MATH), c=w.c;   // rule OFF (default): today byte for byte
  c.jeopStart(); const st=c.jeopState; openCell(w,0);
  ok("rule off (default): no confidence call — the number pad is up at once, wager slot empty",st.wager===null&&/jeopKey\(/.test(c.buildJeopHtml("#000"))&&!/Daily double/.test(c.buildJeopHtml("#000"))&&c.gameRule("k","jeop","wager")==="off");
  typeAns(w); w.flush();
  ok("…answers settle as before; the finish has no sure line",st.cells[0].done&&st.cells[0].first&&c.jpWagerFinishHtml(st)==="");
}
{ const w=world(MATH,{settings:{gameRules:{jeop:{wager:"on"}}}}), c=w.c;
  c.jeopStart(); const st=c.jeopState;
  ok("rule on: the board is unchanged until a square opens",st.wager===null&&/jp-cell/.test(c.buildJeopHtml("#000")));
  openCell(w,0);
  let h=c.buildJeopHtml("#000");
  ok("open a square: the card shows and is said, then 'Daily double — how sure are you?' with 👍 Sure / 🤷 Not sure INSTEAD of the number pad",st.wager===0&&/Daily double/.test(h)&&/jeopSure\(true\)/.test(h)&&/jeopSure\(false\)/.test(h)&&!/jeopKey\(/.test(h)&&w.said.length===1);
  typeAns(w); ok("no answer goes through before the call",!st.turns[0].done&&st.turns[0].typed===""&&st.wager===0);
  c.jeopSure(true);
  ok("👍 Sure → the turn is marked sure, the number pad appears",st.turns[0].sure===true&&st.wager===null&&/jeopKey\(/.test(c.buildJeopHtml("#000")));
  typeAns(w,true);
  ok("a sure miss gets the louder line",st.msg==="You were sure — look again!"&&w.dings.slice(-1)[0]==="bonk");
  typeAns(w,true);
  ok("sure and wrong twice: 'You were sure — we'll come back to that one first.'",/You were sure/.test(st.msg)&&/first\./.test(st.msg)&&st.turns[0].fail);
  w.flush();
  // square 2: not sure, miss twice → comes back AFTER the sure miss; square 3: sure and right; the rest right
  openCell(w,1); c.jeopSure(false); typeAns(w,true); typeAns(w,true); w.flush();
  ok("🤷 Not sure + a miss: the ordinary line",st.turns[1].sure===false&&!/You were sure/.test(st.msg));
  openCell(w,2); c.jeopSure(true); typeAns(w); w.flush();
  ok("sure and right counts as sure-and-right",st.turns[2].sure===true&&st.turns[2].first);
  let guard=0; while(st.phase==="play"&&guard++<20){ const ci=st.cells.findIndex(x=>!x.done); if(ci<0) break; openCell(w,ci); c.jeopSure(false); typeAns(w); w.flush(); }
  ok("every square done → the come-backs: the SURE miss first, then the not-sure one (first-try order otherwise)",st.phase==="back"&&st.backs&&st.backs.length===1&&st.open&&st.turns[st.open.t].pid===st.turns[0].pid&&st.backs[0].pid===st.turns[1].pid);
  ok("a come-back asks no confidence call",st.wager===null&&/jeopKey\(/.test(c.buildJeopHtml("#000")));
  guard=0; while(st.phase!=="done"&&guard++<10){ if(st.open) typeAns(w); w.flush(); }
  ok("the finish adds 'Sure and right 1 · Sure but missed 1'; first-try count unchanged (3 of 5)",st.phase==="done"&&st.first===3&&/Sure and right 1 · Sure but missed 1/.test(c.buildJeopHtml("#000")));
  const gl=w.writes.filter(x=>x[0]==="push"), mb=w.writes.filter(x=>x[1]==="mastery/k_settings/match_best");
  ok("writes exactly as Jeopardy's own: one gameLog push, one best — nothing from the wager",gl.length===1&&mb.length===1&&w.writes.length===2);
}
{ const w=world(MATH), c=w.c;
  ok("the rule shows in the games grid's pop-up for Jeopardy, Off ticked",/Daily double/.test(c.gameRulesHtml("k","jeop"))&&/✓ Off/.test(c.gameRulesHtml("k","jeop")));
  c.gameRuleSet("k","jeop","wager","on");
  ok("Mom flips it: one targeted set at mastery/<kid>_settings/gameRules/jeop/wager",w.writes.length===1&&JSON.stringify(w.writes[0])==="[\"set\",\"mastery/k_settings/gameRules/jeop/wager\",\"on\"]"&&c.jeopWagerOn({kid:"k"}));
}
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
