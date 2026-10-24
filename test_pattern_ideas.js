/*
 * PATIDEAS (her research plan 2026-10-23, new step #3): a "🧩 Key ideas" learning-pattern step. The front shows the
 * card ("Say what it means, then flip"); the back splits the answer into 2–4 key-idea chips; he taps the ones he really
 * said, then Check. All tapped → good; any left → the missed idea shows for a beat, then again (back of the line).
 *   run:  node test_pattern_ideas.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
let pass=0, fail=0;
function ok(n,c,x){ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":""));} }
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
const slice=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("missing "+a); return src.slice(i,j+b.length); };
const fnSrc=name=>{ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("missing fn "+name);
  let d=0, j=src.indexOf("{",i); for(;j<src.length;j++){ if(src[j]==="{") d++; else if(src[j]==="}"&&--d===0) break; } return src.slice(i,j+1); };
const engine=slice("// ── MST_ENGINE_START ──","// ── MST_ENGINE_END ──");
const ideas=slice("// PATIDEAS_START","// PATIDEAS_END");

// Cards: id → {answer, kind}. Rule / spell / picture cards are flagged so the real exclusion checks see them.
const CARDS={
  bio:{answer:"the study of living things; how they grow and change"},
  fact:{answer:"56"},
  none:{answer:""},
  rule:{answer:"Capitalize proper nouns",rule:1},
  spell:{answer:"because",spell:1},
  pic:{answer:"a flask with a narrow neck",pic:1}
};
const ctx={console,Math,Object,Array,String,Number,JSON,Set,Date,setTimeout:(f,ms)=>{ ctx._timers.push({f,ms}); },_timers:[],
  masteryData:{},masteryKid:"ellis",mstSid:"s1",mstFlipped:false,mstState:null,_redraws:0,_taps:[],
  MAST_TIER_ORDER:["daily","every_other_day","weekly","bi_weekly","monthly","graduated"],MAST_TIER_INT:{daily:1,every_other_day:2,weekly:7,bi_weekly:14,monthly:28,graduated:null},
  mastDrillSettings:()=>({ladder:["every_other_day","weekly","bi_weekly","monthly","graduated"]}),mastIsDue:()=>false,mastIsParked:()=>false,mastIsNeverDrill:()=>false,mastFullBank:()=>({}),
  mstCardDef:c=>(CARDS[c&&c.name]||{}).answer||"",
  mstIsRuleCard:c=>!!(CARDS[c&&c.name]||{}).rule,
  mstIsSpellCard:c=>!!(CARDS[c&&c.name]||{}).spell,
  mstCardPic:c=>(CARDS[c&&c.name]||{}).pic?"https://x/p.png":"",
  mstTypeAnsOn:()=>false,
  mstEsc:s=>String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"),
  ttsFlipAttrs:()=>"",mstFlipBtn:()=>"",mastGetDefAudio:()=>null,
  mstPicCardHtml:()=>"<PIC>",mstTypeAnsHtml:()=>"<TYPEANS>",
  mstSessions:()=>[{sid:"s1",name:"Science"}],
  mstLocked:()=>false,
  _mastRe:()=>{ ctx._redraws++; }
};
vm.createContext(ctx);
vm.runInContext(engine,ctx);
vm.runInContext(fnSrc("mstCardMode"),ctx);
vm.runInContext(fnSrc("mstCardHtml"),ctx);
vm.runInContext(ideas,ctx);
// the real mstTap needs the nav block; a stand-in that records the grade and answers through the real engine
vm.runInContext("function mstTap(a){ _taps.push(a); var c=mstCurrent(mstState); mstAnswer(mstState,c.key,a); mstFlipped=false; }",ctx);
const R=c=>vm.runInContext(c,ctx);
const split=a=>R("mstIdeasSplit("+JSON.stringify(a)+")");

console.log("🧩 the step is a pattern step");
ok("'ideas' is in the steps list (pushed from the block)",R("MST_PATTERN_MODES.indexOf('ideas')")!==-1);
ok("the original steps are still first, in order",JSON.stringify(R("MST_PATTERN_MODES.slice(0,3)"))==='["rec","say","type"]');
ok("mstPatternClean keeps 'ideas'",JSON.stringify(R("mstPatternClean(['rec','ideas','type'])"))==='["rec","ideas","type"]');
ok("…and still drops a step it doesn't know",JSON.stringify(R("mstPatternClean(['ideas','bogus'])"))==='["ideas"]');
ok("mstPatternMode lays 'ideas' on its day",R("mstPatternMode(['rec','ideas','type'],1,3)")==="ideas");
{ const pl=src.slice(src.indexOf("const _pl = { rec:"),src.indexOf("};",src.indexOf("const _pl = { rec:")));
  ok("the editor labels it 🧩 Key ideas",/ideas: "\\u\{1F9E9\} Key ideas"/.test(pl),pl); }
ok("the editor's tap-to-cycle walks the same steps list",/MST_PATTERN_MODES\[\(MST_PATTERN_MODES\.indexOf\(p\[i\]\) \+ 1\) % MST_PATTERN_MODES\.length\]/.test(src));

console.log("✂️ splitting an answer into key ideas");
{
  const b=split("the study of living things; how they grow and change");
  ok("biology definition → 2–3 chips",b.length>=2&&b.length<=3,b);
  ok("…the leading 'the' is trimmed",b[0]==="study of living things",b);
  ok("'56' → 1 chip",JSON.stringify(split("56"))==='["56"]');
  ok("a single word → 1 chip",split("photosynthesis").length===1);
  ok("1,000 is a number, not a list",JSON.stringify(split("1,000"))==='["1,000"]');
  const long=split("red, orange, yellow, green, blue, indigo, violet");
  ok("a long comma list is capped at 4 chips",long.length===4,long);
  ok("…nothing is lost (the rest join the 4th)",long[3]==="green, blue, indigo, violet",long);
  const andl=split("a plant, an animal, and a fungus");
  ok("commas with a final 'and' → 3 chips, articles and 'and' trimmed",JSON.stringify(andl)==='["plant","animal","fungus"]',andl);
  const orl=split("to cut or to tear");
  ok("' or ' splits when there's no comma",orl.length===2,orl);
  const tiny=split("H2O, is, water");
  ok("a fragment under 3 letters joins its neighbour",tiny.length===2&&tiny.indexOf("is")===-1,tiny);
  ok("markup is dropped",JSON.stringify(split("<b>heat</b>; light"))==='["heat","light"]');
  ok("an empty answer → no chips",split("").length===0);
  ok("the per-card list comes from one seam (mstIdeasFor) for a future keyIdeas[]",/function mstIdeasFor\(card,def\)/.test(ideas)&&/keyIdeas\[\]/.test(ideas));
  ok("no new field is read yet",!/card\.keyIdeas/.test(ideas));
}

function sitting(names,pattern){
  const learning=names.map((n,i)=>({id:"c"+i,subject:"Science",prompt:n,tally_dots:1,status:"introduction"}));
  R("mstState=mstSittingInit("+JSON.stringify({reviews:[],learning,newNames:[]})+","+JSON.stringify({pattern:pattern||["rec","ideas","ideas"],passes:3})+",{dotsNeeded:()=>3}); mstIdeas=null; _taps=[]; _timers.length=0;");
}
const card=()=>R("mstCurrent(mstState)");
const html=()=>R("mstCardHtml({name:'Science'},mstCurrent(mstState))");

console.log("🃏 the card");
{
  sitting(["bio","fact"]);
  ok("the learning card's mode is 'ideas' on its day",card().mode==="ideas");
  R("mstFlipped=false");
  const h=html();
  ok("front: the prompt and 'Say what it means, then flip'",h.indexOf("bio")!==-1&&h.indexOf("Say what it means, then flip")!==-1);
  ok("back: one chip per key idea",(h.match(/data-idea="/g)||[]).length===2,(h.match(/data-idea="/g)||[]).length);
  ok("back: the hint 'Only tap what you really said.'",h.indexOf("Only tap what you really said.")!==-1);
  ok("back: a Check button",h.indexOf("mstIdeasCheck()")!==-1);
  ok("mstIdeasOn says yes, so the ✗/✓ buttons are hidden",R("mstIdeasOn({sid:'s1'},mstCurrent(mstState))")===true);
}

console.log("✅ all tapped → good");
{
  sitting(["bio","fact"]);
  R("mstIdeasToggle(0,null); mstIdeasToggle(1,null); mstIdeasCheck()");
  ok("Check with every chip tapped grades good",JSON.stringify(R("_taps"))==='["good"]');
  ok("…right away, no beat",R("_timers.length")===0);
  ok("…the card counted one right answer",R("mstState.cards['l:c0'].goods")===1);
  ok("tapping a chip twice un-taps it",(R("mstIdeasToggle(0,null); mstIdeasToggle(0,null); mstIdeas.on.length"))===0);
}

console.log("❌ one missed → again, back of the line");
{
  sitting(["bio","fact"]);
  R("mstIdeasToggle(0,null); mstIdeasCheck()");
  ok("no grade yet — the missed idea shows first",R("_taps.length")===0&&JSON.stringify(R("mstIdeas.miss"))==="[1]");
  const h=html();
  ok("the missed chip is highlighted red",/data-idea="1"[^>]*disabled[^>]*#dc2626/.test(h));
  ok("…Check is gone during the beat",h.indexOf("mstIdeasCheck()")===-1);
  ok("…and the card can't be flipped away",h.indexOf('onclick="mstFlip()"')===-1);
  ok("a second Check during the beat does nothing",(R("mstIdeasCheck(); _taps.length"))===0);
  ok("one beat is waiting",R("_timers.length")===1&&R("_timers[0].ms")>=800);
  R("_timers[0].f()");
  ok("after the beat it grades again",JSON.stringify(R("_taps"))==='["again"]');
  ok("…and the card goes to the back of the line",R("mstState.queue[mstState.queue.length-1]")==="l:c0"&&R("mstState.cards['l:c0'].done")===false);
  sitting(["bio","fact"]);
  R("mstIdeasCheck()");
  const st=R("mstState");
  R("mstState=mstRestore(mstSerialize(mstState))");   // ← Back restores a new state object during the beat
  R("_timers[0].f()");
  ok("if ← Back moved the sitting during the beat, the late grade is dropped",R("_taps.length")===0);
}

console.log("↩️ fallbacks and other faces");
{
  sitting(["none"]);
  ok("a card with no answer falls back to 'rec'",R("mstCardMode(mstCurrent(mstState))")==="rec");
  ok("…and draws no chips",html().indexOf("data-idea=")===-1);
  ok("…and keeps its ✗/✓",R("mstIdeasOn({sid:'s1'},mstCurrent(mstState))")===false);
  sitting(["rule"]);
  ok("a rule card keeps its own face",html().indexOf("data-idea=")===-1&&html().indexOf("tap to see the rule")!==-1);
  ok("…and its ✗/✓",R("mstIdeasOn({sid:'s1'},mstCurrent(mstState))")===false);
  sitting(["spell"]);
  ok("a spell card keeps its own face",html().indexOf("data-idea=")===-1&&html().indexOf("spell it out loud")!==-1);
  ok("…and its ✗/✓",R("mstIdeasOn({sid:'s1'},mstCurrent(mstState))")===false);
  sitting(["pic"]);
  ok("a picture card keeps its own face",html()==="<PIC>");
  ok("…and its ✗/✓",R("mstIdeasOn({sid:'s1'},mstCurrent(mstState))")===false);
  sitting(["bio"],["rec","say","say"]);
  ok("a 'say' day is unchanged (no chips)",html().indexOf("data-idea=")===-1&&html().indexOf("did you say it right?")!==-1);
}

console.log("📅 the side-change rule still applies");
{
  const P=JSON.stringify(["rec","ideas","ideas"]);
  ok("day 2 (first key-ideas day) is a new side",R("mstPatternRepeatDay("+P+",1,3)")===false);
  ok("day 3 (key ideas again) is a repeat day",R("mstPatternRepeatDay("+P+",2,3)")===true);
  const learning=[1,2].map(d=>({id:"d"+d,subject:"Science",prompt:"bio",tally_dots:d,status:"introduction"}));
  R("var _s=mstSittingInit("+JSON.stringify({reviews:[],learning,newNames:[]})+",{pattern:"+P+",passes:3},{dotsNeeded:()=>3})");
  const need=k=>R("(function(){ var c=_s.cards['"+k+"']; return c.passes!=null?c.passes:_s.passes; })()");
  ok("…the new-side day needs 3 right",need("l:d1")===3);
  ok("…the repeat day needs 1",need("l:d2")===1);
}

console.log("🔌 hooks");
const at=src.indexOf("function mstCardHtml("), sayAt=src.indexOf('if(mode==="say"){',at), hookAt=src.indexOf('if(mode==="ideas"',at);
ok("mstCardHtml dispatches ideas just after the say branch",sayAt>0&&hookAt>sayAt&&src.slice(sayAt,hookAt).split("\n").length<=10);
ok("…which comes after the picture, rule, spell and typed-answer faces",[src.indexOf("mstPicCardHtml(session",at),src.indexOf("if(mstIsRuleCard(card))",at),src.indexOf("if(mstIsSpellCard(card))",at),src.indexOf("mstTypeAnsHtml(session",at)].every(i=>i>0&&i<hookAt));
ok("renderMastStudy hides ✗/✓ for an ideas card",/\} else if\(typeof mstIdeasOn==="function"&&mstIdeasOn\(session,card\)\)\{[^\n]*\n\s*\} else if\(mstFlipped\)\{/.test(fnSrc("renderMastStudy")));
ok("the block is marked",src.indexOf("// PATIDEAS_START")>0&&src.indexOf("// PATIDEAS_END")>src.indexOf("// PATIDEAS_START"));
ok("the steps array literal is untouched",src.indexOf('const MST_PATTERN_MODES = ["rec", "say", "type"];')>0);
ok("the block writes nothing to the database",!/\bdb\b|\.set\(|\.update\(|\.remove\(/.test(ideas));
ok("no 🔀 in the block",ideas.indexOf("\u{1F500}")===-1);
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
