/*
 * 👆 "Which one?" — what each deck plays as (WHICH_CARDS, her report 2026-10-23, first device check: Ellis's Roots
 * said "geo" and the tiles showed "geo"; Math said "6x9" and showed "6x9" instead of the answer — "a major issue";
 * "I have to reload it every time to try a new one").
 *   symbol  — Letters / Numbers / Sight Words: hear it, tap the written form (unchanged)
 *   picture — real pictures: hear it, tap the picture (unchanged)
 *   answer  — math facts, roots, German…: the front is SHOWN (and said, not for German), the tiles are BACKS
 *   out     — spelling, phonograms, rule cards, Counting (no picture, no different back), long definitions
 * Plus 🗂 Change deck mid-round: back to the deck chips, nothing written.
 *   run:  node test_which_one_cards.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
let pass=0, fail=0;
function ok(n,c,x){ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":""));} }
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
const a=src.indexOf("// WHICHONE_START"), b=src.indexOf("// WHICHONE_END");
ok("WHICHONE block exists",a>0&&b>a);
const blk=src.slice(a,b);
ok("WHICH_CARDS rule is documented with her words",blk.indexOf("WHICH_CARDS")>=0&&blk.indexOf("can you read? Not do you actually understand it")>=0&&blk.indexOf("2026-10-23")>=0);

let n=0;
const card=(subject,prompt,answer,extra)=>Object.assign({id:"c"+(n++),subject,prompt,answer,status:"active"},extra||{});
function items(){
  n=0; const out=[];
  // answer decks
  [["6×7","42"],["7×8","56"],["8×9","72"],["6×9","54"],["2×21","42"]].forEach(([p,q])=>out.push(card("Math Facts",p,q,{type:"math facts"})));
  [["geo","earth"],["astro","star"],["aqua","water"],["photo","light"],["scope","look, watch"]].forEach(([p,q])=>out.push(card("Greek & Latin Roots",p,q,{type:"greek & latin roots"})));
  [["gut","good"],["ich","I"],["du","you"],["das Papier","paper"]].forEach(([p,q])=>out.push(card("German",p,q,{type:"german"})));
  out.push(card("German","paper","das Papier",{type:"german",dir:"prod"}));   // 🇬🇧→🇩🇪 twin stays out
  // symbol decks
  ["A","B","C","D"].forEach(p=>out.push(card("Letters",p,p,{type:"letters"})));
  ["the","of","and"].forEach(p=>out.push(card("Sight Words",p,p,{type:"sight words"})));
  // picture deck
  ["Lion","Dog","Cat","Owl"].forEach((p,i)=>out.push(card("Animals",p,p,{emoji:"E"+i})));
  // left out
  ["cat","hat","bat","sat"].forEach(p=>out.push(card("Spelling",p,p,{type:"spelling"})));
  ["spend","blend","clench"].forEach(p=>out.push(card("AAS Words",p,p,{type:"spelling_word"})));
  [["sh","/sh/ as in ship"],["ck","/k/ · back"],["ough","/ŏ-ō-ö/ · though"],["ai","/ā/ · rain"]].forEach(([p,q])=>out.push(card("Phonograms",p,q,{type:"phonograms"})));
  [["sh","/sh/ ship"],["th","/th/ thin"],["ch","/ch/ chip"]].forEach(([p,q])=>out.push(card("Sounds",p,q)));   // sound-marked backs, any deck name
  ["one","two","three","four"].forEach(p=>out.push(card("Counting",p,p,{type:"counting"})));
  [["cut","cut"],["run","r-u-n"],["sit","s-i-t"],["hop","h-o-p"]].forEach(([p,q])=>out.push(card("Word Work",p,q)));   // a spell-mode deck with backs
  [["soft c","s before e,i,y"],["ck","after short vowel"],["dge","after short vowel j"]].forEach(([p,q])=>out.push(card("Rules",p,q,{type:"spelling_rule"})));
  [["brave","not giving up, even when you feel scared"],["calm","quiet and peaceful, not upset at all"],["curious","wanting to know more about something"]].forEach(([p,q])=>out.push(card("Vocabulary",p,q)));
  return out;
}
function sandbox(o){
  o=o||{};
  const L={timers:[],spoken:[],dbWrites:[],re:0,bonks:0,dings:0};
  const settings=o.settings||{cat_modes:{"Word Work":"spell"}};
  const ctx={
    console, Math, Object, Array, String, JSON, Date,
    setTimeout:(f,ms)=>{ L.timers.push({f,ms}); return L.timers.length; },
    mastView:"which", masteryKid:"ellis",
    masteryData:{ellis:o.items||items(),ellis_settings:settings},
    // As index.html: a picture when there is one; a front of 3 letters or fewer is its own glyph unless noGlyph.
    _smTileVis:(it,noGlyph)=>{ if(!it) return null; if(it.emoji) return '<span class="memoji">'+it.emoji+'</span>';
      if(!noGlyph&&(it.prompt||"").length<=3) return '<span class="glyph">'+it.prompt+'</span>'; return null; },
    mastGetCatMode:(kid,cat)=>((ctx.masteryData[kid+"_settings"]||{}).cat_modes||{})[cat]||"flash",
    mastKnowledgeType:it=>/_rule$|_concept$/.test(it.type||"")?"procedure_fluency":"fact_association",
    _matchPlain:h=>String(h||"").replace(/<[^>]*>/g," ").replace(/\s+/g," ").trim(),
    esc:s=>String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;"),
    mastSpeak:t=>L.spoken.push(t),
    matchDing:()=>L.dings++, matchBonk:()=>L.bonks++,
    _mastRe:()=>{ L.re++; },
    _dryRun:()=>false,
    db:{ref:p=>({set:v=>L.dbWrites.push([p,"set",v]),update:v=>L.dbWrites.push([p,"update",v]),push:v=>L.dbWrites.push([p,"push",v])})},
    HA_LS:{setItem(){ L.ls=(L.ls||0)+1; }},
    bbAudioUnlock:()=>{},
    document:{getElementById:()=>null},
    _showCelebration:()=>{},
  };
  vm.createContext(ctx);
  vm.runInContext(blk+"\n;this.__st=()=>whichState;this.WHICH_MIX=WHICH_MIX;",ctx);
  ctx.L=L; return ctx;
}
const flush=c=>{ const t=c.L.timers.splice(0); t.forEach(x=>x.f()); };
const itemOf=(c,id)=>c.masteryData.ellis.find(x=>x.id===id);
const ansTiles=h=>(h.match(/class="which-ans"[^>]*>([^<]*)</g)||[]).map(s=>s.replace(/^[^>]*>/,"").replace(/<$/,"").replace(/&amp;/g,"&"));

console.log("which decks play, and how");
{
  const c=sandbox(), modes=c.whichDeckModes(c.masteryData.ellis,"ellis");
  ok("Math Facts, Roots, German → answer",modes["Math Facts"]==="answer"&&modes["Greek & Latin Roots"]==="answer"&&modes["German"]==="answer",modes);
  ok("Letters, Sight Words → symbol (unchanged)",modes["Letters"]==="symbol"&&modes["Sight Words"]==="symbol");
  ok("Animals → picture (unchanged)",modes["Animals"]==="picture");
  ["Spelling","AAS Words","Phonograms","Sounds","Counting","Word Work","Rules","Vocabulary"].forEach(d=>ok(d+" is left out",!modes[d]));
  const decks=c.whichDecks(c.masteryData.ellis);
  ok("the picker lists exactly the playable decks",JSON.stringify(decks)===JSON.stringify(["Animals","German","Greek & Latin Roots","Letters","Math Facts","Sight Words"]),decks);
  const roots=c.whichPool(c.masteryData.ellis,"Greek & Latin Roots");
  ok("every Roots card with a back plays, not only short fronts",roots.length===5,roots.map(i=>i.prompt));
  const ger=c.whichPool(c.masteryData.ellis,"German");
  ok("German production twin stays out",ger.length===4&&ger.every(i=>i.dir!=="prod"));
  const h=c.buildWhichHtml("#123");
  ok("no chip for a spelling / phonogram / counting deck",["Spelling","AAS Words","Phonograms","Counting","Word Work"].every(d=>h.indexOf("whichStart('"+d+"')")<0));
}

console.log("answer mode: the front is shown, the tiles are backs");
{
  const c=sandbox();
  c.whichStart("Math Facts");
  const st=c.__st();
  ok("every turn is answer mode",st.turns.length>0&&st.turns.every(t=>t.mode==="answer"));
  let allBacks=true, distinct=true, rightIn=true, noFront=true;
  for(let k=0;k<40;k++){
    const it=c.masteryData.ellis[k%5], pool=c.whichPool(c.masteryData.ellis,"Math Facts");
    const ids=c.whichTiles(it,pool,null,"answer");
    const backs=ids.map(id=>itemOf(c,id).answer);
    if(new Set(backs).size!==3) distinct=false;
    if(ids.indexOf(it.id)<0) rightIn=false;
    if(backs.filter(x=>x===it.answer).length!==1) distinct=false;
  }
  ok("the right card is one of the three",rightIn);
  ok("three different answers — a twin with the same back (2×21 = 42) never shows twice",distinct);
  const t=st.turns[0], it=itemOf(c,t.pid), h=c.buildWhichHtml("#123");
  const tiles=ansTiles(h);
  ok("three answer tiles",tiles.length===3,tiles);
  t.tiles.forEach((id,ix)=>{ if(tiles[ix]!==itemOf(c,id).answer) allBacks=false; });
  ok("each tile shows its card's BACK",allBacks,tiles);
  tiles.forEach(x=>{ if(["6×7","7×8","8×9","6×9","2×21"].indexOf(x)>=0) noFront=false; });
  ok("no tile shows a front",noFront,tiles);
  ok("the front is written big above the tiles",h.indexOf(">"+it.prompt+"</div>")>=0);
  ok("'Tap the answer!' prompt",h.indexOf("Tap the answer!")>=0&&h.indexOf("Tap the one you hear!")<0);
  ok("the front is said (math)",c.L.spoken.length===1&&c.L.spoken[0]===it.prompt,c.L.spoken);
  ok("🔊 again button for a spoken deck",h.indexOf("whichSayAgain()")>=0);
}
{
  const c=sandbox();
  c.whichStart("Greek & Latin Roots");
  const st=c.__st();
  let t=st.turns.find(x=>itemOf(c,x.pid).prompt==="geo");
  while(!t){ c.whichStart("Greek & Latin Roots"); t=c.__st().turns.find(x=>itemOf(c,x.pid).prompt==="geo"); }
  const s2=c.__st(); s2.i=s2.turns.indexOf(t);
  const tiles=ansTiles(c.buildWhichHtml("#123"));
  ok("geo → three meanings, earth among them, never 'geo'",tiles.indexOf("earth")>=0&&tiles.indexOf("geo")<0&&tiles.length===3,tiles);
  // A wrong tap: greys, bonks, says it again; the right tap still dings.
  const said=c.L.spoken.length, wrongIx=t.tiles.findIndex(id=>id!==t.pid);
  c.whichTap(wrongIx);
  const h=c.buildWhichHtml("#123");
  ok("wrong tile greys + bonk + front said again",t.wrong[t.tiles[wrongIx]]===1&&c.L.bonks===1&&c.L.spoken.length===said+1&&c.L.spoken[said]==="geo");
  ok("'try again' after a miss",h.indexOf("Almost \u{2014} try again!")>=0&&(h.match(/which-tile which-wrong/g)||[]).length===1);
  c.whichTap(t.tiles.indexOf(t.pid)); flush(c);
  const back=s2.turns[s2.turns.length-1];
  ok("a missed card comes back once, still in answer mode",back.back&&back.pid===t.pid&&back.mode==="answer"&&back.tiles.every(id=>itemOf(c,id).subject==="Greek & Latin Roots"));
}

console.log("German: shown, not spoken");
{
  const c=sandbox();
  c.whichStart("German");
  const st=c.__st(), h=c.buildWhichHtml("#123"), it=itemOf(c,st.turns[0].pid);
  ok("nothing said on the first card",c.L.spoken.length===0,c.L.spoken);
  ok("no 🔊 button",h.indexOf("whichSayAgain()")<0);
  ok("the German word is written",h.indexOf(">"+it.prompt+"</div>")>=0);
  ok("tiles are English meanings",ansTiles(h).every(x=>["good","I","you","paper"].indexOf(x)>=0));
  const t=st.turns[0]; c.whichTap(t.tiles.findIndex(id=>id!==t.pid));
  ok("a wrong tap bonks but stays silent",c.L.bonks===1&&c.L.spoken.length===0);
}

console.log("symbol + picture decks unchanged");
{
  const c=sandbox();
  c.whichStart("Letters");
  let h=c.buildWhichHtml("#123"), st=c.__st();
  ok("Letters: glyph tiles, no answer tiles",(h.match(/class="glyph"/g)||[]).length===3&&ansTiles(h).length===0);
  ok("Letters: the letter is said, never written above",c.L.spoken[0]===itemOf(c,st.turns[0].pid).prompt&&h.indexOf("Tap the one you hear!")>=0);
  c.whichStart("Animals");
  h=c.buildWhichHtml("#123"); st=c.__st();
  ok("Animals: picture tiles",(h.match(/class="memoji"/g)||[]).length===3&&st.turns.every(t=>t.mode==="picture"));
  ok("Animals: big 🔊 and 'Tap the one you hear!'",h.indexOf("whichSayAgain()")>=0&&h.indexOf("Tap the one you hear!")>=0);
  c.whichStart("Sight Words");
  ok("Sight Words: symbol",c.__st().turns.every(t=>t.mode==="symbol"));
}

console.log("a kid with only picture/symbol decks (Julian) sees the old words");
{
  const its=items().filter(i=>["Letters","Animals","Counting"].indexOf(i.subject)>=0);
  const c=sandbox({items:its});
  const h=c.buildWhichHtml("#123");
  ok("picker line unchanged",h.indexOf("Listen, then tap the picture you hear!")>=0);
  ok("Counting not offered",h.indexOf("whichStart('Counting')")<0);
  const c2=sandbox({items:items().filter(i=>i.subject==="Spelling"||i.subject==="Counting")});
  ok("nothing playable → the plain note",c2.buildWhichHtml("#000").indexOf("3 or more cards with a picture")>=0);
}

console.log("mix the decks: each turn keeps its own deck's mode");
{
  const c=sandbox();
  c.whichStart(c.WHICH_MIX);
  const st=c.__st(), modes=c.whichDeckModes(c.masteryData.ellis,"ellis");
  ok("each turn's mode is its deck's",st.turns.every(t=>t.mode===modes[itemOf(c,t.pid).subject]));
  ok("each turn's tiles come from its own deck",st.turns.every(t=>t.tiles.every(id=>itemOf(c,id).subject===itemOf(c,t.pid).subject)));
}

console.log("🗂 Change deck");
{
  const c=sandbox();
  c.whichStart("Math Facts");
  let h=c.buildWhichHtml("#123");
  ok("Change deck shows during a round",h.indexOf("whichChangeDeck()")>=0&&h.indexOf("Change deck")>=0);
  ok("deck chips hidden during the round",h.indexOf("whichStart('Animals')")<0);
  const st=c.__st(), t=st.turns[0];
  c.whichTap(t.tiles.indexOf(t.pid));   // a right tap leaves a pending "next" timer
  const before=JSON.stringify(c.masteryData);
  c.whichChangeDeck();
  ok("the round is dropped",c.__st()===null);
  flush(c);
  ok("the pending timer does nothing after Change deck",c.__st()===null);
  h=c.buildWhichHtml("#123");
  ok("back at the deck picker",h.indexOf("whichStart('Animals')")>=0&&h.indexOf("whichStart('Math Facts')")>=0&&h.indexOf("Pick a deck")>=0);
  ok("nothing written to Firebase",c.L.dbWrites.length===0,c.L.dbWrites);
  ok("nothing changed in memory (no best, no Scores)",JSON.stringify(c.masteryData)===before&&!c.L.ls);
  c.whichStart("Animals");
  ok("a new deck starts straight away",c.__st()&&c.__st().deck==="Animals"&&c.__st().phase==="play");
}

console.log("finish screen + writes");
{
  const c=sandbox();
  c.whichStart("Math Facts");
  const st=c.__st();
  while(st.phase==="play"){ const t=st.turns[st.i]; c.whichTap(t.tiles.indexOf(t.pid)); flush(c); }
  const h=c.buildWhichHtml("#123");
  ok("answer finish shows 'front → back'",/6×7 → 42|7×8 → 56|8×9 → 72|6×9 → 54|2×21 → 42/.test(h));
  ok("best still written to match_best '<deck> · which' only",c.L.dbWrites.length===1&&c.L.dbWrites[0][0]==="mastery/ellis_settings/match_best"&&Object.keys(c.L.dbWrites[0][2])[0]==="Math Facts \u{00B7} which");
  ok("only match_best and matchLog paths are written",(blk.match(/db\.ref\(([^)]*)\)/g)||[]).every(r=>/match_best|matchLog/.test(r)));
  ok("_smTileVis itself is untouched (no definition in the block)",blk.indexOf("function _smTileVis")<0);
  ok("no 🔀 emoji",blk.indexOf("\u{1F500}")<0&&blk.indexOf("1F500")<0);
}

console.log("\n"+pass+" passed, "+fail+" failed");
process.exit(fail?1:0);
