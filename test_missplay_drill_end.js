/*
 * 🎮 DRILLEND — the drill ends in games (design slices 3 + 3b; her go 2026-11-02). Switch on: Mom's drill saves as now, "One more
 * look" is skipped, then a hand-off screen (Start / Not now) → 👀 Watch it (each card big, said, Mom's cue said too) → the practice
 * round (from:"drill"). Cues: ✎ in Mom HQ, one targeted set on the card. Switch off / nothing to practice = Scores as always.
 *   run:  node test_missplay_drill_end.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
let pass=0, fail=0;
function ok(n,c,x){ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":""));} }
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
function fnText(name){ const i=src.indexOf("function "+name+"("); if(i<0) return ""; const j=src.indexOf("\nfunction ",i+10); return src.slice(i,j<0?undefined:j); }

// ── by text ──
const sv=fnText("mastSaveResults");
ok("the drill's save lands on Scores first, then the hand-off hook (once)",(()=>{ const a=sv.indexOf('mastView="scores"; mastScoreItemId=null;'), b=sv.indexOf('mpAfterDrillSaved(masteryKid)'); return a>0&&b>a&&(src.match(/mpAfterDrillSaved\(masteryKid\)/g)||[]).length===1; })());
ok("One more look is skipped only while the games switch is on",/const slideList=\(mastLogMode&&!\(typeof mpOn==="function"&&mpOn\(masteryKid\)\)\)\?slideItems\.concat/.test(src));
ok("the cue write is one targeted set on the card's own field",/db\.ref\("mastery\/"\+kid\+"\/"\+k\+"\/cue"\)\.set\(text\|\|null\)/.test(fnText("mpSetCue")));
ok("Mom HQ lists each card with ✎ and shows its cue",/mpCueEdit\(/.test(fnText("mpSettingsHtml"))&&/i\.cue\?' <span/.test(fnText("mpSettingsHtml")));
const blk=src.slice(src.indexOf("// MISSPLAY_START"),src.indexOf("// MISSPLAY_END"));
ok("no kid's name in the block",!/lincoln|ellis|lucy|julian|caleb|taylor|makenzie|kenzie|andrew/i.test(blk));

// ── a sandbox with the real WHICHONE + GAMELOG + MISSPLAY blocks ──
const LET="ABCDEFGHIJ".split("");
function sandbox(o){
  o=o||{};
  const items=LET.map((p,i)=>({id:"k_"+p,subject:"Letters",prompt:p,status:"active",tier:i<3?"every_other_day":"weekly",cycle:1,next_due:40}));
  (o.flag||[]).forEach(id=>{ items.find(i=>i.id===id).gp={on:true,since:"20261101",need:3,days:[],m:0}; });
  if(o.cues) Object.keys(o.cues).forEach(id=>{ items.find(i=>i.id===id).cue=o.cues[id]; });
  const writes=[], said=[], els={}, timers=[];
  const document={body:{appendChild(e){ els[e.id]=e; }},getElementById:id=>els[id]||null,createElement:()=>({style:{},remove(){ delete els[this.id]; }})};
  const md={kid1:items,kid1_settings:o.settings||{missPlay:{on:true}},history:{}};
  const ctx={console,Math,Object,Array,String,JSON,Number,Set,Date,setTimeout:(fn,ms)=>{ timers.push(fn); return timers.length; },
    masteryKid:"kid1", masteryData:md,
    _smTileVis:it=>(it&&it.subject==="Letters"?'<b>'+it.prompt+'</b>':null),
    _matchPlain:h=>String(h||"").replace(/<[^>]*>/g," ").trim(), esc:s=>String(s||""), cap:s=>s.toUpperCase(),
    mastSpeak:(t,op)=>said.push(t), matchDing(){}, matchBonk(){}, _mastRe(){}, _dryRun:()=>!!o.dry,
    db:{ref:p=>({set:v=>writes.push(["set",p,v]),update:v=>writes.push(["update",p,v]),push:v=>writes.push(["push",p,v])})},
    HA_LS:{setItem(){}}, bbAudioUnlock(){}, renderAll(){}, momHere:()=>o.mom!==false, mastAdminPinOk:false,
    mastSchoolDayNum:()=>5, mstTodayKey:()=>"20261102",
    prompt:()=>o.promptAnswer===undefined?null:o.promptAnswer,
    document };
  vm.createContext(ctx);
  vm.runInContext(src.slice(src.indexOf("// WHICHONE_START"),src.indexOf("// MISSPLAY_END"))+"\n;this.__ui=()=>mpUI;this.__hand=()=>mpHand;",ctx);
  return {c:ctx,items,writes,said,els,timers};
}
const panel=els=>els["mp-hand"]?els["mp-hand"].innerHTML:"";

console.log("── switch off / nothing to practice: Scores as always ──");
{ const {c,els}=sandbox({settings:{},flag:["k_A"]}); ok("switch off → no hand-off",c.mpAfterDrillSaved("kid1")===false&&!els["mp-hand"]); }
{ const {c,els}=sandbox(); ok("nothing on the list → no hand-off",c.mpAfterDrillSaved("kid1")===false&&!els["mp-hand"]); }
{ const {c}=sandbox({flag:["k_A"]}); c.items=null; c.masteryData.kid1[0].gp.days=[5]; ok("a card already right today doesn't count",c.mpAfterDrillSaved("kid1")===false); }
console.log("── the hand-off screen ──");
{
  const {c,els,said}=sandbox({flag:["k_A","k_B"]});
  ok("switch on + 2 cards → the hand-off",c.mpAfterDrillSaved("kid1")===true&&c.__hand().step==="hand");
  const h=panel(els);
  ok("Let's have fun · the kid · 2 cards · Start · Not now",h.indexOf("have fun with the ones we missed")>=0&&h.indexOf("KID1")>=0&&h.indexOf("2 cards")>=0&&/mpHandStart\(\)/.test(h)&&/mpHandNotNow\(\)/.test(h));
  ok("nothing said yet (no tap yet, iPad voice locked)",said.length===0);
  c.mpHandNotNow();
  ok("Not now closes it, the round is not opened, the chip still counts the cards",c.__hand()===null&&!els["mp-hand"]&&!c.__ui()&&c.mpTodayList("kid1").length===2);
}
console.log("── Watch it: each card big, said, Mom's cue said after ──");
{
  const {c,els,said,timers}=sandbox({flag:["k_A","k_B"],cues:{k_A:"A is a tent with a bar"}});
  c.mpAfterDrillSaved("kid1"); c.mpHandStart();
  const H=c.__hand();
  ok("Start → watch, card 1 of 2, said",H.step==="watch"&&H.i===0&&said[0]==="A");
  let h=panel(els);
  ok("the card is shown big with its cue; Next, not Play, since one more follows",h.indexOf("<b>A</b>")>=0&&h.indexOf("A is a tent with a bar")>=0&&h.indexOf("1 of 2")>=0&&/Next/.test(h)&&!/Play!/.test(h));
  timers.forEach(fn=>fn()); ok("the cue is said after the name",said[1]==="A is a tent with a bar");
  c.mpWatchSay(); ok("🔊 says it again",said[said.length-2]==="A"||said[said.length-1]==="A");
  c.mpWatchNext();
  h=panel(els);
  ok("card 2 of 2: no cue line, the button says Play!",c.__hand().i===1&&h.indexOf("<b>B</b>")>=0&&h.indexOf("💡")<0&&/Play!/.test(h)&&said[said.length-1]==="B");
  c.mpWatchNext();
  const U=c.__ui();
  ok("after the last card the round opens, from the drill; the hand-off is gone",c.__hand()===null&&!els["mp-hand"]&&U&&U.phase==="play"&&U.from==="drill"&&U.q.filter(e=>e.list).length===2);
  c.mpTap(U.cur.tiles.indexOf(U.cur.pid)); c.mpNext(); const R=c.mpFinish(U);
  ok("the round's entry says from:\"drill\"",R.entry&&R.entry.from==="drill");
}
console.log("── a spelling card in Watch it: the word shown (teaching, not testing) and said with the spelling voice ──");
{
  const {c,els,said}=sandbox({flag:["k_A"]});
  // without the SPELLBUILD block spellPlayable is undefined → a spelling-shaped card is treated as a plain card; the branch is text-checked instead
  ok("Watch it has the spelling branch (spellWordOf, {spell:true})",/mpWatchIsSpell\(it\)\) mastSpeak\(spellWordOf\(it\),\{spell:true\}\)/.test(fnText("mpWatchSay"))&&/spellWordOf\(it\)\)\+'<\/div>'/.test(fnText("mpHandRender")));
  c.mpAfterDrillSaved("kid1"); c.mpHandStart(); ok("a plain card still says its name",said[0]==="A"&&panel(els).indexOf("<b>A</b>")>=0);
}
console.log("── cues: Mom only, one targeted set, clear with empty ──");
{
  const {c,items,writes}=sandbox({flag:["k_A"]});
  const A=items[0];
  ok("set a cue → the card and ONE targeted set on its field",c.mpSetCue("kid1",A,"  A is a tent  ")===true&&A.cue==="A is a tent"&&writes.length===1&&writes[0][1]==="mastery/kid1/0/cue"&&writes[0][2]==="A is a tent");
  ok("Mom HQ shows the cue beside the card with its ✎",(()=>{ const h=c.mpSettingsHtml("kid1"); return h.indexOf("A is a tent")>=0&&/mpCueEdit\('kid1','k_A'\)/.test(h); })());
  ok("clear with empty → field removed, null written",c.mpSetCue("kid1",A,"")===true&&A.cue===undefined&&writes[1][2]===null);
  ok("a long cue is trimmed to 120",c.mpSetCue("kid1",A,"x".repeat(200))&&A.cue.length===120);
  const {c:c2,items:i2,writes:w2}=sandbox({flag:["k_A"],mom:false});
  ok("not Mom → refused, nothing written",c2.mpSetCue("kid1",i2[0],"nope")===false&&!i2[0].cue&&w2.length===0);
  const {c:c3,items:i3,writes:w3}=sandbox({flag:["k_A"],promptAnswer:"B is bumpy"});
  ok("✎ asks and saves",c3.mpCueEdit("kid1","k_A")===true&&i3[0].cue==="B is bumpy"&&w3.length===1);
  const {c:c4,items:i4}=sandbox({flag:["k_A"]});
  ok("✎ cancelled → nothing",c4.mpCueEdit("kid1","k_A")===false&&!i4[0].cue);
  const {c:c5,items:i5,writes:w5}=sandbox({flag:["k_A"],dry:true});
  ok("dry run: in memory only",c5.mpSetCue("kid1",i5[0],"q")===true&&i5[0].cue==="q"&&w5.length===0);
}

console.log("\n"+pass+" passed, "+fail+" failed");
process.exit(fail?1:0);
