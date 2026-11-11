/*
 * 📖 MISSPLAY_MEANING — the practice round's "meaning" turn (her yes 2026-11-11, after her report the same day: "he only had
 * one game card at the end, even though he had eight missed"). A missed card whose back is longer than WHICH_BACK_MAX used to
 * stay out of the games (Which one?'s tile rule); now the round shows and says its back and the kid taps its front from three
 * (two lures from the same deck, never a card with the same back). Everything else is the round's own. The 🎮 Games tab's
 * Which one? is untouched.
 *   run:  node test_missplay_meaning.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
let pass=0, fail=0;
function ok(n,c,x){ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":""));} }
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
const fnText=name=>{ const i=src.indexOf("function "+name+"("); if(i<0) return ""; const j=src.indexOf("\nfunction ",i+10); return src.slice(i,j<0?undefined:j); };
const constLine=name=>{ const i=src.indexOf("const "+name+"="); return src.slice(i,src.indexOf("\n",i)); };

// ── the block, its place, its hooks ──
const a=src.indexOf("// MISSPLAY_MEANING_START"), b=src.indexOf("// MISSPLAY_MEANING_END"), mA=src.indexOf("// MISSPLAY_START"), mB=src.indexOf("// MISSPLAY_END");
ok("block sits inside MISSPLAY, right before the practice round",a>mA&&b>a&&mB>b&&src.slice(b,b+80).indexOf("// ── the practice round ──")>0);
const blk=src.slice(a,b);
ok("her words + the date",/2026-11-11/.test(blk)&&/only had\s*\/\/\s*one game card at the end, even though he had eight missed/.test(blk));
ok("no kid's name in the block",!/lincoln|ellis|lucy|julian|caleb|taylor|makenzie|andrew/i.test(blk));
ok("the block writes nothing (no db, no storage)",!/db\.ref|\.update\(|HA_LS|localStorage/.test(blk));
ok("_mpPool takes the meaning cards, guarded",/\(typeof mpMeanPool==="function"\)\?p\.concat\(mpMeanPool\(kid,items,p\)\):p/.test(fnText("_mpPool")));
ok("mpTurn: the meaning turn comes after Build it and before the deck modes; can't build → skipped",(()=>{ const t=fnText("mpTurn"), s=t.indexOf('mode:"spell"'), m=t.indexOf("mpMeanTurn(U,it,!!e.list)"), w=t.indexOf("whichTiles("); return s>0&&m>s&&w>m&&/if\(mt\)\{ U\.cur=mt; return true; \} if\(mt===false\)\{ U\.i\+\+; continue; \}/.test(t); })());
ok("mpSay says the back on a meaning turn",/if\(U\.cur\.mode==="meaning"\)\{ if\(typeof mpMeanSay==="function"\) mpMeanSay\(U\.cur\); return; \}/.test(fnText("mpSay")));
ok("mpRender: the meaning head and tiles, each one guarded line",/if\(c\.mode==="meaning"&&typeof mpMeanHeadHtml==="function"\) h\+=mpMeanHeadHtml\(c,color,wrongNow\);/.test(fnText("mpRender"))&&/if\(c\.mode==="meaning"&&typeof mpMeanTileHtml==="function"\) h\+=mpMeanTileHtml\(t,ti,cls\);/.test(fnText("mpRender")));
ok("the meaning tiles are text tiles (class tf → TILEFIT)",/class="mp-ans tf"/.test(fnText("mpMeanTileHtml")));
ok("the tap is the round's own (mpTap unchanged: wrong greys out, first tap counts)",fnText("mpTap").indexOf("mean")<0&&/if\(c\.list\) mpNote\(U,c\.pid,first\);/.test(fnText("mpTap")));

// ── the 🎮 Games tab's Which one? is untouched ──
ok("Which one?'s deck filter, pool, tiles and back rule never read the meaning turn",["whichDeckModes","whichPool","whichTiles","_whichBack","whichStart","whichDecks"].every(f=>fnText(f)&&fnText(f).indexOf("mpMean")<0&&fnText(f).indexOf("_mpPool")<0));
ok("Which one?'s tile limits are as they were",/const WHICH_BACK_MAX=24, WHICH_FRONT_MAX=40;/.test(src));

// ── a sandbox: the real WHICHONE … MISSPLAY_END + the real tile / plain / type helpers ──
const procBlk=(()=>{ const i=src.indexOf("const MAST_PROCEDURE_FLUENCY_TYPES=new Set(["); return src.slice(i,src.indexOf("]);",i)+3); })();
const core=src.slice(src.indexOf("// WHICHONE_START"),mB);
const helpers=[constLine("MAST_ANIMAL_EMOJI"),constLine("WW_DECKS"),constLine("SPELL_WORD_MAX"),procBlk,constLine("MAST_KNOWLEDGE_TYPES"),
  fnText("_smTileVis"),fnText("_matchPlain"),fnText("mastKnowledgeType"),fnText("mastGetCatMode"),fnText("wwIsSpell"),
  "function spellWordOf(it){ return String((it&&(it.answer||it.prompt))||''); }",fnText("spellPlayable"),
  fnText("gameDeckOn").replace(/if\(typeof cpmcDeckOff[^\n]*?return false;/,""),fnText("gdKey"),"function _gdMD(){ return masteryData; } var _gdRaw=false;"].join("\n");
function sandbox(md,o){
  o=o||{};
  const L={writes:[],spoken:[]};
  const ctx={console,Math,Object,Array,String,JSON,Number,Set,Date,RegExp,setTimeout:()=>0,masteryKid:Object.keys(md)[0],masteryData:md,
    mastSchoolDayNum:()=>200, gameLogDay:()=>"20261111", HA_LS:{setItem(){}}, _dryRun:()=>false,
    db:{ref:p=>({set:v=>L.writes.push([p,"set",v]),update:v=>L.writes.push([p,"update",v]),push:v=>L.writes.push([p,"push",v]),remove:()=>L.writes.push([p,"remove"])})},
    mastSpeak:t=>L.spoken.push(t), matchDing(){}, matchBonk(){}, bbAudioUnlock(){},
    mastLiveVisual:it=>it.imageUrl?{img:it.imageUrl}:(it.emoji?{emoji:it.emoji}:null),
    mastShapeVis:()=>"[shape]", mastColorBorder:()=>"#000", MAST_COLOR_MAP:{}, MAST_DEFAULT_CAT_MODES:{}};
  vm.createContext(ctx);
  let code=helpers+"\n"+core;
  if(o.noMeaning) code=code.slice(0,code.indexOf("// MISSPLAY_MEANING_START"))+code.slice(code.indexOf("// MISSPLAY_MEANING_END"));
  vm.runInContext(code+"\n;this.__ui=()=>mpUI;",ctx);
  ctx.L=L; return ctx;
}
// anonymized copies of the two live decks' shapes (2026-11-11): a 4th grader's definition / rule decks, a Pre-K's picture decks
let n=0; const C=(subject,prompt,answer,x)=>Object.assign({id:"c"+(++n),subject,type:subject.toLowerCase(),prompt,answer,status:"active",tier:"weekly",cycle:1,next_due:300},x||{});
function bigKid(){ n=0; return [
  C("Geography","contour lines","lines on a map that connect points of equal elevation",{tier:"every_other_day"}),
  C("Geography","irrigation","bringing water to crops through pipes, ditches, or canals",{tier:"every_other_day"}),
  C("Geography","atmosphere","the layer of gases that surrounds the earth"), C("Geography","lines of latitude","imaginary lines that run east-west around the globe"),
  C("Grammar","preposition","a word that shows position or direction",{tier:"every_other_day"}),
  C("Grammar","noun","a person, place, thing, or idea"), C("Grammar","verb","a word that shows action or state of being"),
  C("Vocabulary","climate","the temperature, precipitation, wind, and other weather conditions of a place measured over a long period of time, usually thirty years or more",{tier:"every_other_day"}),
  C("Vocabulary","abundant","existing in large quantities; more than enough"), C("Vocabulary","boundary","a line or limit that marks the edge of an area"),
  C("Punctuation","March 3<b class=mast-hl>,</b> 1865","Comma — to separate the day of the month from the year",{tier:"every_other_day"}),
  C("Punctuation","Will you wait for me<b class=mast-hl>?</b>","Question mark — after a question"), C("Punctuation","Roger lives in Ohio<b class=mast-hl>.</b>","Period — to end a sentence."),
  C("Capitalization","<u>Kangaroos</u> are native to Australia.","First word of a sentence.",{tier:"every_other_day"}),
  C("Capitalization","<u>The</u> dog ran home.","First word of a sentence."), C("Capitalization","<u>Bees</u> make honey.","First word of a sentence."),
  C("Capitalization","Peggy likes to be called <u>Peg</u>.","A person’s name or nickname."), C("Capitalization","<u>Mom</u> and Dad went out to dinner.","A relationship word used in place of a name"),
  C("Mathematical Reasoning","Parallelogram","a quadrilateral with two pairs of parallel sides",{tier:"every_other_day"}),
  C("Mathematical Reasoning","Trapezoid","a quadrilateral with exactly one pair of parallel sides"), C("Mathematical Reasoning","Parallel Lines","lines that run side by side and never meet"),
  C("State Capitals","Indiana","Indianapolis",{tier:"every_other_day"}), C("State Capitals","Ohio","Columbus"), C("State Capitals","Iowa","Des Moines"), C("State Capitals","Idaho","Boise"),
]; }
const MISSED=["contour lines","irrigation","preposition","climate","March 3<b class=mast-hl>,</b> 1865","<u>Kangaroos</u> are native to Australia.","Parallelogram","Indiana"];
function preK(){ n=100; return [
  C("Letters","N",""),C("Letters","M",""),C("Letters","S",""),C("Letters","T",""),
  C("Animals","Tiger",""),C("Animals","Lion",""),C("Animals","Giraffe",""),C("Animals","Elephant",""),
  C("Shapes","Heptagon",""),C("Shapes","Octagon",""),C("Shapes","Decagon",""),C("Shapes","Hexagon","Hexagon"),
  C("Dinosaurs","Parasaurolophus","",{imageUrl:"x1.png"}),C("Dinosaurs","Stegosaurus","",{imageUrl:"x2.png"}),C("Dinosaurs","Triceratops","",{imageUrl:"x3.png"}),
]; }
const PREK_MISSED=["N","Tiger","Heptagon","Octagon","Decagon","Hexagon","Parasaurolophus"];
function drill(ctx,kid,prompts){
  const items=ctx.masteryData[kid], due=items.map(i=>({id:i.id})), sc={};
  items.forEach(i=>{ sc[i.id]=prompts.indexOf(i.prompt)>=0?"m":"c"; });
  const touched=[]; ctx.mpAfterDrill(kid,items,due,sc,touched); return touched;
}
const byP=(items,p)=>items.find(i=>i.prompt===p);

// ── the 4th grader's eight ──
{ const c=sandbox({k4:bigKid(),k4_settings:{missPlay:{on:true}}}), items=c.masteryData.k4;
  const touched=drill(c,"k4",MISSED);
  ok("all 8 misses join the list (was 1)",MISSED.every(p=>{ const g=byP(items,p).gp; return g&&g.on===true; })&&touched.length===8,MISSED.map(p=>!!byP(items,p).gp));
  ok("7 play the meaning turn, the capital plays Which one? as before",MISSED.filter(p=>c.mpMeanCard("k4",byP(items,p))).length===7&&!c.mpMeanCard("k4",byP(items,"Indiana")));
  ok("today's list (the After-the-drill count) = 8",c.mpTodayList("k4",200).length===8);
  const old=sandbox({k4:bigKid(),k4_settings:{missPlay:{on:true}}},{noMeaning:true}); drill(old,"k4",MISSED);
  ok("without the block: 1 (today's behaviour, the live 11/11 drill)",old.mpTodayList("k4",200).map(i=>i.prompt).join()==="Indiana");
  // tiles: the card + two lures from its deck, a different front, never the same back
  const kang=byP(items,"<u>Kangaroos</u> are native to Australia.");
  let okT=true, sameBack=false;
  for(let r=0;r<40;r++){ let s=r+1; const rnd=()=>{ s=(s*9301+49297)%233280; return s/233280; };
    const t=c.mpMeanTiles("k4",kang,items,rnd); if(!t||t.length!==3||t.indexOf(kang.id)<0||new Set(t).size!==3) okT=false;
    (t||[]).forEach(id=>{ const x=items.find(i=>i.id===id); if(x.subject!=="Capitalization") okT=false; if(id!==kang.id&&x.answer==="First word of a sentence.") sameBack=true; }); }
  ok("tiles = the card + 2 lures from its own deck",okT);
  ok("a lure never shares the card's back (two sentences can both be 'First word of a sentence.')",!sameBack);
  // the round: open it, play every turn right on the first tap
  c.mpOpen("k4","drill"); const U=c.__ui();
  ok("the round opens on the list cards",U&&U.phase==="play"&&U.q.filter(e=>e.list).length===8);
  let meanSeen=0, guard=0, spokeBack=true;
  while(U.phase==="play"&&U.cur&&guard++<400){
    const cur=U.cur;
    if(cur.mode==="meaning"){ meanSeen++; const last=c.L.spoken[c.L.spoken.length-1]; if(last!==cur.back) spokeBack=false; }
    c.mpTap(cur.tiles.indexOf(cur.pid)); c.mpNext();
  }
  ok("meaning turns were played, each one says the card's back first",meanSeen>=7&&spokeBack,meanSeen);
  ok("3 first-tap rights → each list card is done for today (the round's own rule)",MISSED.every(p=>c.mpLeftToday(byP(items,p),200)===0));
  const paths=c.L.writes.map(w=>w[0]+" "+w[1]);
  ok("writes: the round's one mastery update + its one game-log push, nothing else",paths.length===2&&paths[0]==="mastery/k4 update"&&paths[1]==="mastery/gameLog/k4/20261111 push",paths);
  const entry=c.L.writes[1][2];
  ok("the game-log entry is the round's own (game practice, from drill, list marks)",entry.game==="practice"&&entry.from==="drill"&&entry.items.some(x=>x.list&&x.id===kang.id&&x.ok===true));
  ok("the mastery update carries only gp",Object.keys(c.L.writes[0][2]).every(k=>/\/gp$/.test(k)));
}
// a wrong tap on a meaning turn: greys out, says it again, then right → not first-tap (the existing rule)
{ const c=sandbox({k4:bigKid(),k4_settings:{missPlay:{on:true}}}), items=c.masteryData.k4;
  drill(c,"k4",["irrigation"]);
  c.mpOpen("k4","drill"); const U=c.__ui(), cur=U.cur;
  ok("the one list card opens as a meaning turn",cur&&cur.mode==="meaning"&&cur.pid===byP(items,"irrigation").id);
  const said=c.L.spoken.length, wrong=cur.tiles.findIndex(id=>id!==cur.pid);
  c.mpTap(wrong);
  ok("wrong tap: greyed, said again, nothing logged",cur.wrong[cur.tiles[wrong]]===1&&c.L.spoken.length===said+1&&U.log.length===0);
  c.mpTap(cur.tiles.indexOf(cur.pid));
  const g=byP(items,"irrigation").gp;
  ok("then right: logged ok:false n:2, the right days start over (m+1)",U.log[0].ok===false&&U.log[0].n===2&&g.m===1&&g.today.r===0);
}
// ── the Pre-K's seven: unchanged ──
{ const c=sandbox({p1:preK(),p1_settings:{missPlay:{on:true}}}), o=sandbox({p1:preK(),p1_settings:{missPlay:{on:true}}},{noMeaning:true});
  drill(c,"p1",PREK_MISSED); drill(o,"p1",PREK_MISSED);
  const ids=x=>x.mpTodayList("p1",200).map(i=>i.id).sort().join();
  ok("Pre-K: 7 join, the same 7 as before",c.mpTodayList("p1",200).length===7&&ids(c)===ids(o));
  ok("Pre-K: the pool is exactly as before (no meaning cards)",c._mpPool("p1",c.masteryData.p1).map(i=>i.id).join()===o._mpPool("p1",o.masteryData.p1).map(i=>i.id).join());
  c.mpOpen("p1","drill"); const U=c.__ui(); let modes={}, g=0;
  while(U.phase==="play"&&U.cur&&g++<200){ modes[U.cur.mode]=1; c.mpTap(U.cur.tiles.indexOf(U.cur.pid)); c.mpNext(); }
  ok("Pre-K: the round plays symbol / picture turns only",!modes.meaning&&(modes.symbol||modes.picture),Object.keys(modes));
}
// ── a long-answer card whose deck lacks 2 lures: skipped, as before ──
{ n=500; const items=[C("Science","photosynthesis","how plants make food from sunlight, water and air"),C("Science","erosion","the wearing away of land by water, wind or ice"),
    C("Science","<u>A</u> very long sentence about the weather that goes past one line.","First word of a sentence.")];   // 3rd: front too long for a tile
  const c=sandbox({k5:items,k5_settings:{missPlay:{on:true}}}); drill(c,"k5",["photosynthesis"]);
  const it=byP(items,"photosynthesis");
  ok("only 1 lure (a front over WHICH_FRONT_MAX can't be a tile) → it can't play, it stays in the drill",!it.gp&&c.mpMeanTiles("k5",it,items)===null&&c.mpMeanPool("k5",items,[]).length===0);
  const U={kid:"k5",modes:{},pool:[]};
  ok("mpMeanTurn says 'can't build' (false) so the round skips it",c.mpMeanTurn(U,it,true)===false);
  // the same deck with every other card sharing its back → no fair lure
  n=520; const same=[C("Caps","<u>Ann</u> ran.","First word of a sentence."),C("Caps","<u>We</u> sat.","First word of a sentence."),C("Caps","<u>Go</u> now.","First word of a sentence.")];
  const c2=sandbox({k6:same,k6_settings:{missPlay:{on:true}}});
  ok("a deck where every card has the same back → no meaning turn (never two right answers)",c2.mpMeanPool("k6",same,[]).length===0);
}
// ── still left out: spelling, phonograms, procedure cards; Mom's grid column ──
{ n=600; const items=[
    C("Spelling","necessary","n-e-c-e-s-s-a-r-y — one collar, two sleeves"),C("Spelling","separate","s-e-p-a-r-a-t-e — there's a rat in it"),C("Spelling","because","b-e-c-a-u-s-e — big elephants can always"),
    C("Phonograms","ough","/ō/ /oo/ /ŭf/ /ŏf/ /ou/ /ô/ — six sounds"),C("Phonograms","ea","/ē/ /ĕ/ /ā/ — three sounds of ea"),C("Phonograms","ch","/ch/ /k/ /sh/ — three sounds of ch"),
    C("Rules","i before e","i before e except after c or when sounding like a",{type:"spelling_rule"}),C("Rules","drop the e","drop the silent e before adding a vowel suffix",{type:"spelling_rule"}),C("Rules","double it","double the last consonant after one short vowel",{type:"spelling_rule"}),
    C("Geography","contour lines","lines on a map that connect points of equal elevation"),C("Geography","irrigation","bringing water to crops through pipes, ditches, or canals"),C("Geography","atmosphere","the layer of gases that surrounds the earth")];
  const c=sandbox({k7:items,k7_settings:{missPlay:{on:true},gameDecks:{}}});
  const pool=c.mpMeanPool("k7",items,[]).map(i=>i.subject);
  ok("spelling, phonogram and procedure cards stay out; definitions play",pool.length===3&&pool.every(s=>s==="Geography"),pool);
  c.masteryData.k7_settings.gameDecks={Geography:{which:false}};
  ok("Mom's 🎮 grid: Which one? off for a deck → its cards don't play the meaning turn either",c.mpMeanPool("k7",items,[]).length===0);
}
// ── a picture deck's card keeps its picture turn even with a long back ──
{ n=700; const items=[C("Birds","Robin","a songbird with a red breast that is often seen on lawns in spring",{emoji:"🐦"}),C("Birds","Owl","",{emoji:"🦉"}),C("Birds","Duck","",{emoji:"🦆"}),C("Birds","Eagle","a large bird of prey with a hooked beak and broad wings",{emoji:"🦅"})];
  const c=sandbox({k8:items,k8_settings:{missPlay:{on:true}}});
  const modes=c.whichDeckModes(items,"k8");
  ok("picture deck card with a long back → the picture turn, not meaning",modes.Birds==="picture"&&c.mpMeanTurn({kid:"k8",modes,pool:[]},items[0],true)===null);
}
// ── the Games tab's Which one? pool is unchanged ──
{ const c=sandbox({k4:bigKid(),k4_settings:{missPlay:{on:true}}}), o=sandbox({k4:bigKid(),k4_settings:{missPlay:{on:true}}},{noMeaning:true});
  const p=x=>x.whichPool(x.masteryData.k4,x.WHICH_MIX,"k4").map(i=>i.id).join();
  ok("Which one? (Games tab) pool and deck modes: identical with and without the block",p(c)===p(o)&&JSON.stringify(c.whichDeckModes(c.masteryData.k4,"k4"))===JSON.stringify(o.whichDeckModes(o.masteryData.k4,"k4")));
  ok("…and it still has no definition card in it",!c.whichPool(c.masteryData.k4,c.WHICH_MIX,"k4").some(i=>i.prompt==="irrigation"));
}
// ── the tile face keeps Mom's underline / bold, escapes the rest ──
{ const c=sandbox({k4:bigKid()});
  ok("tile face: <u>/<b> kept bare, attributes dropped, other tags gone, text escaped",
    c.mpMeanFaceHtml("<u>Kangaroos</u> are")==="<u>Kangaroos</u> are"&&c.mpMeanFaceHtml("March 3<b class=mast-hl>,</b> 1865")==="March 3<b>,</b> 1865"&&c.mpMeanFaceHtml("<script>x</script>a&b")===" x a&amp;b");
  const h=c.mpMeanHeadHtml({back:"the <layer> of gases"},"#7c3aed",false);
  ok("the head shows the back escaped, with 🔊 and a kid-plain line",h.indexOf("the &lt;layer&gt; of gases")>0&&h.indexOf("mpSay()")>0&&h.indexOf("Which one is it? Tap it!")>0);
}
console.log("\n"+pass+" passed, "+fail+" failed");
process.exit(fail?1:0);
