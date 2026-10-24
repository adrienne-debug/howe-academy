/*
 * GAMEKID (her words 2026-10-23): "Match, Memory, Which one? and the Sprint deck keep their round per kid, pause when I
 * switch away, resume when I switch back, and save to the right kid." Live incident 2026-10-23: switching Ellis → Lucy
 * left Ellis's Match tiles on Lucy's screen; Which one? showed empty tiles; a finish after the switch would have saved
 * to Lucy. Slices the real Match / Which one? / GAMEKID code + mastSetKid out of index.html.
 *   run:  node test_games_per_kid.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
let pass=0, fail=0;
function ok(n,c,x){ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,300)+")":""));} }
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("missing "+a+" / "+b); return src.slice(i,j); };
const line=a=>{ const i=src.indexOf(a); if(i<0) throw new Error("missing "+a); return src.slice(i,src.indexOf("\n",i)); };
ok("GAMEKID block exists",src.indexOf("// GAMEKID_START")>0&&src.indexOf("// GAMEKID_END")>src.indexOf("// GAMEKID_START"));
const CODE=[
  cut("let matchState=null;","// ── ✍️ Finger tracing"),                 // Match + Memory flip (MATCH_THEN) + finish
  cut("// \"Save to Scores\" — logging is EXPLICIT","// GAMEKID_END"),   // Match save, WHICHONE, GAMEKID
  cut("function buildMatchHtml(color){","function mastRecStart("),
  line("function mastSetKid(k,noRender){"),
  line("function mastSetView(v){"),
].join("\n");

const ELLIS=()=>["6×3:18","6×4:24","6×5:30","6×6:36","6×7:42","6×8:48"].map((s,i)=>({id:"e"+i,subject:"Math Facts",prompt:s.split(":")[0],answer:s.split(":")[1],status:"active"}))
  .concat(["robot","truck","jet","car"].map((p,i)=>({id:"t"+i,subject:"Transformers",prompt:p,emoji:"T"+i,status:"active"})));
const LUCY=()=>["cat","dog","cow","pig","hen","owl","fox","bee"].map((p,i)=>({id:"l"+i,subject:"Animals",prompt:p,emoji:"L"+i,status:"active"}))
  .concat(["sun","moon","star","tree"].map((p,i)=>({id:"w"+i,subject:"Sight Words",prompt:p,answer:p+"!",status:"active"})));

function sandbox(o){
  o=o||{};
  const T={now:100000};
  const L={timers:[],intervals:0,spoken:[],dbWrites:[],celebrated:[],re:0,cancels:0};
  class FakeDate extends Date{ constructor(...a){ if(a.length) super(...a); else super(T.now); } static now(){ return T.now; } }
  const ctx={
    console, Math, Object, Array, String, JSON, parseFloat, isNaN, Date:FakeDate,
    setTimeout:(f,ms)=>{ L.timers.push({f,ms}); return L.timers.length; },
    setInterval:()=>{ L.intervals++; return 1; }, clearInterval:()=>{},
    speechSynthesis:{cancel:()=>{ L.cancels++; }},
    mastView:o.view||"match", masteryKid:"ellis",
    masteryData:{ellis:ELLIS(),lucy:LUCY(),ellis_settings:{match_then:"none"},lucy_settings:{match_then:"none"}},
    _smTileVis:it=>(it&&it.emoji?'<span class="memoji">'+it.emoji+'</span>':null),
    mastGetDef:()=>null,
    esc:s=>String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;"),
    mastSpeak:t=>L.spoken.push(t),
    mastDrillSettings:()=>({match_speak:false}),
    _mastRe:()=>{ L.re++; },
    _dryRun:()=>!!o.dry,
    db:{ref:p=>({set:v=>L.dbWrites.push([p,"set",v]),update:v=>L.dbWrites.push([p,"update",v]),push:v=>L.dbWrites.push([p,"push",v])})},
    HA_LS:{setItem(){}},
    document:{getElementById:id=>id==="celeb-overlay"?{}:null},
    _showCelebration:(k,t)=>L.celebrated.push([k,t]),
    alert:()=>{}, MAST_BANK_MAP:{}, mastAddCat:"",
    sprintDeck:"__all__", sprintDeckScope:null,
  };
  ctx.window=ctx;
  vm.createContext(ctx);
  vm.runInContext(CODE+"\n;this.__m=()=>matchState;this.__w=()=>whichState;this.__style=()=>matchStyle;",ctx);
  ctx.L=L; ctx.T=T; return ctx;
}
const flush=c=>{ const t=c.L.timers.splice(0); t.forEach(x=>x.f()); };
// Tap every remaining pair on the current Match board (face-up or memory; then:"none").
function solve(c){
  const st=c.__m();
  const pids=[...new Set(st.tiles.filter(t=>!t.matched).map(t=>t.pid))];
  pids.forEach(pid=>{ const ix=[]; st.tiles.forEach((t,i)=>{ if(t.pid===pid&&!t.matched) ix.push(i); }); c.mastMatchTap(ix[0]); c.mastMatchTap(ix[1]); });
}
const keysOf=o=>Object.keys(o||{});
const writesUnder=(c,kid)=>c.L.dbWrites.filter(w=>w[0].indexOf("/"+kid)>=0||w[0].indexOf(kid+"_")>=0);

console.log("Match (face-up): Ellis's round is kept, paused, resumed, saved to Ellis");
{
  const c=sandbox();
  c.mastMatchStart("Math Facts");
  const st=c.__m();
  ok("the round carries its own kid",st.kid==="ellis");
  const first=st.tiles.findIndex(t=>!t.matched);
  c.mastMatchTap(first);                       // clock starts at T=100000
  c.T.now=103000;
  c.mastSetKid("lucy");
  ok("switching away pauses Ellis's clock (like ⏸)",st.pausedAt===103000);
  ok("switching away stops the voice",c.L.cancels>=1);
  ok("Lucy has no round — her picker, not Ellis's tiles",c.__m()===null);
  const html=c.buildMatchHtml("#000");
  ok("Lucy's screen: her decks, no Ellis tile",html.indexOf("Pick a deck")>=0&&html.indexOf("6×7")<0&&html.indexOf("Math Facts")<0&&html.indexOf("Animals")>=0);
  c.T.now=163000;                              // a minute on Lucy
  c.mastSetKid("ellis");
  ok("back to Ellis: the same round object",c.__m()===st&&st.sel===first);
  ok("it stays paused until a tap",!!st.pausedAt);
  ok("Ellis's board shows again (paused screen)",c.buildMatchHtml("#000").indexOf("Paused")>=0);
  c.T.now=164000; c.mastMatchPause();          // ▶ Resume
  ok("the minute on Lucy didn't count",c._matchElapsed(st)===3000,c._matchElapsed(st));
  c.T.now=166000; solve(c);
  ok("round finished: 5.0 s of real play",st.endTs&&st.sec===5,st.sec);
  ok("best time written under Ellis only",c.L.dbWrites.length===1&&c.L.dbWrites[0][0]==="mastery/ellis_settings/match_best"&&c.L.dbWrites[0][2]["Math Facts"]===5,c.L.dbWrites);
  ok("local best is Ellis's, Lucy untouched",c.masteryData.ellis_settings.match_best["Math Facts"]===5&&!c.masteryData.lucy_settings.match_best);
  c.mastMatchLogResult();
  ok("Save to Scores pushes to matchLog/ellis",c.L.dbWrites[1][0]==="mastery/matchLog/ellis"&&c.L.dbWrites[1][1]==="push"&&c.masteryData.matchLog.ellis.length===1&&!c.masteryData.matchLog.lucy);
}

console.log("A round finished after the kid changed (no render in between) still saves to its own kid");
{
  const c=sandbox();
  c.mastMatchStart("Math Facts");
  c.masteryKid="lucy";                        // e.g. a schedule link set the kid; the old board is still on screen
  solve(c);
  c.mastMatchLogResult();
  ok("nothing written under Lucy",writesUnder(c,"lucy").length===0,c.L.dbWrites);
  ok("best + log under Ellis",c.L.dbWrites.map(w=>w[0]).join(",")==="mastery/ellis_settings/match_best,mastery/matchLog/ellis",c.L.dbWrites);
  ok("Lucy's local data untouched",!c.masteryData.lucy_settings.match_best&&!(c.masteryData.matchLog||{}).lucy);
}

console.log("Memory flip: per kid, Style / Pairs follow the kid, saves to the right kid");
{
  const c=sandbox();
  c.mastMatchSetStyle("memory");
  c.mastMatchStart("Math Facts");
  const st=c.__m();
  c.mastMatchTap(0);
  c.mastSetKid("lucy");
  ok("Lucy starts with no round",c.__m()===null);
  c.mastMatchSetStyle("match");                // Lucy plays face-up — nulls only HER round
  c.mastMatchStart("Sight Words");
  const lst=c.__m();
  ok("Lucy's round is hers",lst.kid==="lucy"&&lst.style==="match");
  c.mastSetKid("ellis");
  ok("Ellis's memory round comes back, style toggle back to Memory flip",c.__m()===st&&c.__style()==="memory");
  c.mastMatchPause(); solve(c);
  ok("Ellis's memory best key under Ellis",c.L.dbWrites.length===1&&c.L.dbWrites[0][0]==="mastery/ellis_settings/match_best"&&keysOf(c.L.dbWrites[0][2])[0]==="Math Facts · memory",c.L.dbWrites);
  c.mastSetKid("lucy");
  ok("Lucy's face-up round is still hers",c.__m()===lst&&c.__style()==="match");
  solve(c);
  ok("Lucy's best under Lucy",c.L.dbWrites[1][0]==="mastery/lucy_settings/match_best"&&keysOf(c.L.dbWrites[1][2])[0]==="Sight Words");
  flush(c);                                    // memory linger timers — harmless
  ok("no write ever crossed kids",c.L.dbWrites.every(w=>(w[0].indexOf("ellis")>=0)!==(w[0].indexOf("lucy")>=0)));
}

console.log("Memory flip ▸ Pick it: a picked chip mid-switch settles on return; stale timers can't touch the round");
{
  const c=sandbox();
  c.masteryData.ellis_settings.match_then="pick";
  c.mastMatchSetStyle("memory");
  c.mastMatchStart("Math Facts");
  const st=c.__m();
  const ix=st.tiles.findIndex(t=>t.isPrompt);
  c.mastMatchTap(ix);
  ok("first flip opens the Pick-it gate",st.gate&&st.gate.kind==="pick");
  const gOld=st.gate, right=gOld.chips.findIndex(x=>x.ok);
  c.T.now=101000; c.mastMatchPick(right);       // close timer is pending
  c.mastSetKid("lucy");
  ok("an open gate isn't double-paused",!st.pausedAt);
  flush(c);                                     // the pending close fires while parked
  ok("…and does nothing to the parked round",st.gate===gOld);
  c.T.now=161000;
  c.mastSetKid("ellis");
  ok("back on Ellis the answered gate is closed",st.gate===null&&st.res[gOld.pid]==="c");
  ok("the gate's time (opened at the first flip, incl. time away) stays off the clock",st.pausedTotal===61000,st.pausedTotal);
  // A second pick with its close timer, then a switch away+back before it fires, then a NEW gate.
  const pair=st.tiles.findIndex((t,i)=>i!==ix&&t.pid===st.tiles[ix].pid);
  c.mastMatchTap(pair);                          // completes the pair
  const nx=st.tiles.findIndex(t=>!t.matched&&t.isPrompt);
  c.mastMatchTap(nx);
  const g2=st.gate; c.mastMatchPick(g2.chips.findIndex(x=>!x.ok));   // a miss — close pending (1400 ms)
  const stale=c.L.timers.splice(0);
  c.mastSetKid("lucy"); c.mastSetKid("ellis");   // settles g2 on return
  ok("missed card recorded, gate settled",st.gate===null&&st.missed.indexOf(g2.pid)>=0);
  const nx2=st.tiles.findIndex(t=>!t.matched&&t.pid===st.tiles[nx].pid&&!t.up);
  c.mastMatchTap(nx2);                           // pair it
  const nx3=st.tiles.findIndex(t=>!t.matched&&!t.up&&!st.asked[t.pid]);
  c.mastMatchTap(nx3);
  const g3=st.gate;
  stale.forEach(x=>x.f());
  ok("a stale close timer never closes the next gate",st.gate===g3&&!!g3);
}

console.log("Firebase-shaped card lists (an object, not an array) still work for the round's own kid");
{
  const c=sandbox();
  const asObj=a=>{ const o={}; a.forEach((x,i)=>o["k"+i]=x); return o; };
  c.masteryData.ellis=asObj(ELLIS()); c.masteryData.ellis_settings.match_then="pick";
  c.mastMatchSetStyle("memory");
  c.mastMatchStart("Math Facts");
  const st=c.__m();
  let threw=null; try{ c.mastMatchTap(st.tiles.findIndex(t=>t.isPrompt)); }catch(e){ threw=e.message; }
  ok("Pick-it gate builds its chips from an object-shaped deck",!threw&&st.gate&&st.gate.kind==="pick"&&st.gate.chips.length===3,threw||st.gate);
  ok("the card lookup finds it",!!(st.gate&&c._matchItem(st.gate.pid)));
}

console.log("Which one?: per kid, resume settles the pending turn, saves to its own kid");
{
  const c=sandbox({view:"which"});
  c.masteryKid="lucy";
  c.whichStart("Animals");
  const st=c.__w();
  ok("Lucy's round carries her kid",st.kid==="lucy"&&st.phase==="play");
  const t0=st.turns[0];
  c.whichTap(t0.tiles.indexOf(t0.pid));          // right — the advance timer is pending
  ok("right tap locks for the grow beat",st.lock&&st.i===0);
  c.mastSetKid("ellis");
  ok("Ellis gets his own Which one? picker (no round)",c.__w()===null);
  const eh=c.buildWhichHtml("#000");
  ok("Ellis's picker lists his picture decks, not Lucy's",eh.indexOf("Transformers")>=0&&eh.indexOf("Animals")<0);
  flush(c);
  ok("the pending advance does nothing while parked",st.i===0&&st.lock);
  c.L.spoken.length=0;
  c.mastSetKid("lucy");
  ok("back on Lucy: same round, the turn moved on, unlocked",c.__w()===st&&st.i===1&&!st.lock&&st.grow===null);
  ok("the next card is said again on return",c.L.spoken.length===1&&c.L.spoken[0]===c.masteryData.lucy.find(x=>x.id===st.turns[1].pid).prompt,c.L.spoken);
  flush(c);
  ok("no double advance",st.i===1);
  // Stale-timer guard: a right tap, switch away and back before the timer fires, then another right tap.
  const t1=st.turns[1]; c.whichTap(t1.tiles.indexOf(t1.pid));
  const stale=c.L.timers.splice(0);
  c.mastSetKid("ellis"); c.mastSetKid("lucy");
  ok("settled on return",st.i===2&&!st.lock);
  const t2=st.turns[2]; c.whichTap(t2.tiles.indexOf(t2.pid));
  stale.forEach(x=>x.f());
  ok("the stale timer can't advance the new turn early",st.i===2&&st.lock);
  flush(c);
  ok("the fresh timer advances it",st.i===3);
  // Finish on Ellis's screen state (kid changed without render) → still Lucy's.
  c.masteryKid="ellis";
  while(st.phase==="play"){ const t=st.turns[st.i]; c.whichTap(t.tiles.indexOf(t.pid)); flush(c); }
  ok("Which one? best under Lucy only",c.L.dbWrites.length===1&&c.L.dbWrites[0][0]==="mastery/lucy_settings/match_best"&&keysOf(c.L.dbWrites[0][2])[0]==="Animals · which",c.L.dbWrites);
  c.whichLogResult();
  ok("Save to Scores → matchLog/lucy",c.L.dbWrites[1][0]==="mastery/matchLog/lucy"&&c.masteryData.matchLog.lucy[0].game==="which"&&!c.masteryData.matchLog.ellis);
  ok("celebration named Lucy",c.L.celebrated.every(x=>x[0]==="lucy"));
}

console.log("Which one?: a round that ends on the settled turn finishes on return");
{
  const c=sandbox({view:"which"});
  c.masteryKid="lucy"; c.whichStart("Animals");
  const st=c.__w();
  while(st.i<st.turns.length-1){ const t=st.turns[st.i]; c.whichTap(t.tiles.indexOf(t.pid)); flush(c); }
  const t=st.turns[st.i]; c.whichTap(t.tiles.indexOf(t.pid));   // the last tap; advance pending
  c.mastSetKid("ellis"); flush(c);
  ok("not finished while parked",st.phase==="play"&&c.L.dbWrites.length===0);
  c.mastSetKid("lucy");
  ok("finished on return, written under Lucy",st.phase==="done"&&c.L.dbWrites.length===1&&c.L.dbWrites[0][0]==="mastery/lucy_settings/match_best",c.L.dbWrites);
}

console.log("Sprint ▸ From drill items: the deck choice is per kid");
{
  const c=sandbox({view:"sprint"});
  c.mastSetKid("ellis");                       // first sight — nothing to park
  c.sprintDeck="Math Facts";
  c.mastSetKid("lucy");
  ok("Lucy starts on All decks",c.sprintDeck==="__all__"&&c.sprintDeckScope===null);
  c.sprintDeck="Combined"; c.sprintDeckScope=["Sight Words","Spelling"];
  c.mastSetKid("ellis");
  ok("Ellis gets Math Facts back",c.sprintDeck==="Math Facts"&&c.sprintDeckScope===null);
  c.mastSetKid("lucy");
  ok("Lucy gets her combined scope back",c.sprintDeck==="Combined"&&JSON.stringify(c.sprintDeckScope)==='["Sight Words","Spelling"]');
  c.sprintDeckScope=null; c.sprintDeck="Phonograms";   // not one of Lucy's decks (data changed)
  c.mastSetKid("ellis"); c.mastSetKid("lucy");
  ok("a deck the kid no longer has falls back to All decks",c.sprintDeck==="__all__");
  c.sprintDeck="Combined"; c.sprintDeckScope=["Nope","Gone"];
  c.mastSetKid("ellis"); c.mastSetKid("lucy");
  ok("a scope with none of the kid's decks falls back to All decks",c.sprintDeck==="__all__"&&c.sprintDeckScope===null);
}

console.log("Same kid, view tabs, dry-run");
{
  const c=sandbox();
  c.mastMatchStart("Math Facts"); const st=c.__m(); c.mastMatchTap(0);
  c.mastSetKid("ellis");
  ok("re-picking the same kid changes nothing (no pause)",c.__m()===st&&!st.pausedAt);
  c.mastSetView("which"); c.mastSetView("match");
  ok("switching view tabs keeps the round",c.__m()===st&&c.mastView==="match");
}
{
  // ?dryrun=1 in the app: db.ref() comes back with set/update/push turned into no-ops (the DRY-RUN patch at
  // startup) — Match writes go through that; Which one? also checks _dryRun() itself. Model both.
  const c=sandbox({dry:true});
  const rec=c.db.ref; c.db={ref:p=>{ const r=rec(p); return Object.assign(r,{set:()=>{},update:()=>{},push:()=>{}}); }};
  c.mastMatchStart("Math Facts"); solve(c); c.mastMatchLogResult();
  c.masteryKid="lucy"; c.mastSetKid("lucy"); c.mastView="which";
  c.whichStart("Animals"); const st=c.__w();
  while(st.phase==="play"){ const t=st.turns[st.i]; c.whichTap(t.tiles.indexOf(t.pid)); flush(c); }
  c.whichLogResult();
  ok("?dryrun=1: nothing reaches Firebase",c.L.dbWrites.length===0,c.L.dbWrites);
  ok("…the screen still shows the result (local only)",c.masteryData.ellis_settings.match_best["Math Facts"]!=null&&c.masteryData.matchLog.ellis.length===1&&c.masteryData.matchLog.lucy.length===1);
}

console.log("Hooks: every way the kid changes goes through gameKidSwitch");
{
  ok("mastSetKid parks before the kid changes",/function mastSetKid\(k,noRender\)\{[^\n]*gameKidSwitch\(k\); masteryKid=k;/.test(src));
  const ro=src.slice(src.indexOf("function retrOpenSprint(kid){"),src.indexOf("function retrOpenSprint(kid){")+200);
  ok("retrOpenSprint parks BEFORE this kid's plan sets the Sprint deck",ro.indexOf("gameKidSwitch(kid)")>0&&ro.indexOf("gameKidSwitch(kid)")<ro.indexOf("masteryKid=kid"));
  const ri=src.slice(src.indexOf("function _renderMasteryInner(el){"),src.indexOf("function _renderMasteryInner(el){")+600);
  ok("the Mastery render catches any other path",ri.indexOf("gameKidSwitch(masteryKid)")>ri.indexOf("masteryKid=kids[0]"));
  const blk=cut("// GAMEKID_START","// GAMEKID_END");
  ok("GAMEKID writes nothing (no db, no localStorage)",!/db\.|HA_LS|localStorage/.test(blk));
}

console.log("\n"+pass+" passed, "+fail+" failed");
process.exit(fail?1:0);
