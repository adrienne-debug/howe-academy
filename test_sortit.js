/*
 * 🧺 Sort it — one game, two faces (her "sure let's try", 2026-11-02; PLAN_practice_games_2026-10-23.md Tier 1 "Sort it" /
 * Tier 3 "Group Sort", build order #3). Little ones sort built-in pictures into their decks; readers sort cards into the
 * rule / answer their backs share. Tap the card then the bin, or drag. A miss shakes back and comes back once at the end.
 * Logs through gameLogRound (game:"sort"); best "<deck> · sort"; never the ladder. Runs the REAL code.
 *   run:  node test_sortit.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
let pass=0, fail=0;
function ok(n,c,x){ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":""));} }
const src=require("./test_src.js")(path.join(__dirname,"index.html"));
const UNITPIC = src.slice(src.indexOf("// UNITPIC_START"), src.indexOf("// UNITPIC_END"));   // the one card-picture helper (mastLiveVisual) the drawers call
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("markers "+a); return src.slice(i,j); };
function fnText(name){ const i=src.indexOf("function "+name+"("); if(i<0) return ""; const j=src.indexOf("\nfunction ",i+10); return src.slice(i,j<0?undefined:j); }
const line=re=>{ const m=src.match(re); return m?m[0]:""; };
const seeded=seed=>{ let x=seed||7; return ()=>{ x=(x*1103515245+12345)&0x7fffffff; return (x%10000)/10000; }; };

// ── by text ──
const a=src.indexOf("// SORTIT_START"), b=src.indexOf("// SORTIT_END"), sp=src.indexOf("// SPELLBUILD_END");
ok("one SORTIT block, after SPELLBUILD_END (the games' shared anchor) and before the Games tab",sp>0&&a>sp&&b>a&&src.indexOf("// SORTIT_START",a+1)<0&&b<src.indexOf("// GAMESTAB_START")&&/^\/\/ [A-Z_]+_END$/m.test(src.slice(sp,a).trim().split("\n").pop()||"// SPELLBUILD_END"));
const blk=src.slice(a,b), code=blk.replace(/^\s*\/\/.*$/gm,"");   // code = the block without its comment lines
ok("no kid's name in the block",!/lincoln|ellis|lucy|julian|caleb|taylor|makenzie|kenzie|andrew/i.test(blk));
ok("no 🔀 anywhere in index.html",src.indexOf("\u{1F500}")<0);
ok("GAMES_LIST: Sort it right after Which one?, with park / restore / resume on its entry",/\{key:"which",[^\n]*\n  \{key:"sort",\s*emoji:"\\u\{1F9FA\}", label:"Sort it",\s*view:"sort",\s*available:k=>typeof sortDecks==="function"&&Object\.keys\(sortDecks\(_gamesItems\(k\),k\)\)\.length>0, render:c=>buildSortHtml\(c\),\n\s*park:\(\)=>sortState, restore:v=>\{ sortState=v\|\|null; \}, resume:\(\)=>sortResume\(\), decks:k=>typeof sortDeckList==="function"\?sortDeckList\(_gamesItems\(k\),k\):\[\]\}/.test(src));
ok("gamesCurrentKey / GAMEKID untouched (the entry does it)",!/sort/i.test(fnText("gamesCurrentKey"))&&!/sortState|sortResume/.test(cut("// GAMEKID_START","// GAMEKID_END")));
ok("writes: match_best one key (guarded) + gameLogRound — nothing else, no set / remove / push",/db&&!_dryRun\(\)\) db\.ref\("mastery\/"\+kid\+"_settings\/match_best"\)\.update\(\{\[(?:key|\(typeof haKey==="function"\?haKey\(key\):key\))\]:st\.first\}\)/.test(blk)&&/gameLogRound\(st\)/.test(blk)&&(blk.match(/db\.ref\(/g)||[]).length===1&&!/\.set\(|\.remove\(|\.push\(\{/.test(code.replace(/ids\.push|turns\.push|tray\.push|classList\.remove/g,"")));
ok("the voice says a card's NAME or a bin's name — never which bin a card belongs in",/mastSpeak\(_sortPlain\(it\.prompt\)\)/.test(fnText("_sortSayCard"))&&!/\.bin\b/.test(fnText("_sortSayCard")+fnText("_sortSayBin")));
ok("no ladder contact: no next_due / tier / studyLog / consecutive_correct in the block",!/next_due|\.tier\b|studyLog|consecutive_correct|mstLog|scStudy/.test(code));
ok("no clock, no lives, no leaderboard",!/setInterval|lives|hearts|leaderboard|timer/i.test(code));
ok("drag: a card is pointer-driven (tap = pick, drop = the bin under the pointer), bins carry data-sortbin",/onpointerdown="sortDown\(event,/.test(blk)&&/data-sortbin/.test(blk)&&/elementFromPoint/.test(blk)&&/touch-action:none/.test(blk));

// ── a sandbox: WHICHONE (left-out / silent rules) + GAMELOG + SORTIT, a kid's cards, a recording db ──
const HELPERS=line(/const MAST_ANIMAL_EMOJI=.*\n/)+line(/const MAST_COLOR_MAP=.*\n/)+fnText("mastColorBorder")+"\n"+fnText("_matchPlain")+"\n"+fnText("_smTileVis")+"\n"+fnText("esc")+"\n";
const CODE=HELPERS+cut("// WHICHONE_START","// WHICHONE_END")+"\n"+cut("// GAMELOG_START","// GAMELOG_END")+"\n"+cut("// SORTIT_START","// SORTIT_END");
function world(items,o){
  o=o||{};
  const writes=[], said=[], dings=[], celeb=[];
  const ctx={console,JSON,Object,Array,String,Number,Math,Set,Map,RegExp,Date,parseInt,isNaN,setTimeout:()=>0,
    document:{getElementById:id=>id==="celeb-overlay"&&o.overlay?{}:null,elementFromPoint:()=>null,querySelectorAll:()=>[]},
    momHere:()=>true,_dryRun:()=>!!o.dry,HA_LS:{setItem(){}},_mastRe(){},bbAudioUnlock(){},
    mastSpeak:(t,op)=>said.push(t),matchDing:()=>dings.push("ding"),matchBonk:()=>dings.push("bonk"),_showCelebration:(k,t)=>celeb.push([k,t]),
    mastGetVisual:()=>null,mastShapeVis:n=>"<svg>"+n+"</svg>",mastGetCatMode:()=>null,mastKnowledgeType:()=>"",
    mstTodayKey:()=>"20261102",mastView:"sort",masteryKid:"k",
    masteryData:{k:items||[],k_settings:o.settings||{}},
    db:{ref:p=>({set:v=>writes.push(["set",p,v]),update:v=>writes.push(["update",p,v]),push:v=>writes.push(["push",p,v])})}};
  vm.createContext(ctx);
  vm.runInContext(UNITPIC + "\n" + CODE+"\nObject.defineProperty(this,'sortState',{get:()=>sortState,set:v=>{sortState=v;}}); this.SORT_PIC=SORT_PIC; this.SORT_BOARD=SORT_BOARD;",ctx);
  return {c:ctx,writes,said,dings,celeb};
}
// cards
const C=(id,subject,prompt,answer,extra)=>Object.assign({id:id,subject:subject,prompt:prompt,answer:answer,status:"active"},extra||{});
const rule=(n,back,k)=>{ const out=[]; for(let i=0;i<n;i++) out.push(C(k+i,"Articles","Sentence "+k+i+" with <u>"+k+"</u>.",back)); return out; };
const ARTICLES=[].concat(rule(3,"Use a before a consonant sound.","a"),rule(3,"Use an before a vowel sound.","an"),rule(3,"Use the for a particular thing.","the"));
const PICS=[C("l","Animals","Lion","Lion"),C("d","Animals","Dog","Dog"),C("c","Animals","Cat","Cat"),C("f","Animals","Fox","Fox"),
  C("r","Colors","Red","Red"),C("b","Colors","Blue","Blue"),C("g","Colors","Green","Green"),
  C("ci","Shapes","Circle","Circle"),C("sq","Shapes","Square","Square"),C("tr","Shapes","Triangle","Triangle")];
const MATH=[C("m1","Math Facts","1+4","5"),C("m2","Math Facts","2+3","5"),C("m3","Math Facts","4+1","5"),C("m4","Math Facts","3+2","5"),
  C("m5","Math Facts","1+3","4"),C("m6","Math Facts","2+2","4"),C("m7","Math Facts","3+1","4"),
  C("m8","Math Facts","3+3","6"),C("m9","Math Facts","2+4","6"),C("m10","Math Facts","5+1","6"),C("m11","Math Facts","1+6","7"),C("m12","Math Facts","6+1","7"),C("m13","Math Facts","9+0","9")];

console.log("── sortDecks: where a bin comes from (pure) ──");
{
  const {c}=world();
  const d=c.sortDecks(ARTICLES,"k");
  ok("a rule deck whose backs repeat → one deck, three bins of three",d.Articles&&d.Articles.kind==="back"&&d.Articles.bins.length===3&&d.Articles.bins.every(b=>b.ids.length===3));
  ok("a bin is labelled with the back itself",d.Articles.bins.some(b=>b.label==="Use an before a vowel sound."));
  const d2=c.sortDecks(PICS,"k");
  ok("built-in pictures from two or more decks → the 🖼 Pictures deck, one bin per deck",d2[c.SORT_PIC]&&d2[c.SORT_PIC].kind==="pic"&&d2[c.SORT_PIC].bins.map(b=>b.label).sort().join()==="Animals,Colors,Shapes");
  ok("a picture deck's cards are never also a back-bin (the back is the front)",Object.keys(d2).length===1);
  ok("one bin only → not a deck",Object.keys(c.sortDecks(rule(6,"Only rule","x"),"k")).length===0);
  ok("two bins of two (4 cards) → not enough on the board",Object.keys(c.sortDecks([].concat(rule(2,"R1","a"),rule(2,"R2","b")),"k")).length===0);
  ok("three bins of two (6 cards) → plays (her 2-per-bin bar)",!!c.sortDecks([].concat(rule(2,"R1","a"),rule(2,"R2","b"),rule(2,"R3","c")),"k").Articles);
  ok("a bin of one is dropped, the rest still play",(()=>{ const d=c.sortDecks([].concat(rule(3,"R1","a"),rule(3,"R2","b"),rule(1,"R3","c")),"k"); return d.Articles&&d.Articles.bins.length===2; })());
  ok("a picture deck with only two pictures is not a bin",(()=>{ const d=c.sortDecks(PICS.filter(x=>x.id!=="g"),"k"); return d[c.SORT_PIC]&&d[c.SORT_PIC].bins.length===2&&!d[c.SORT_PIC].bins.some(b=>b.label==="Colors"); })());
  ok("one picture deck alone → no Pictures deck",Object.keys(c.sortDecks(PICS.filter(x=>x.subject==="Animals"),"k")).length===0);
  const photos=[C("p1","Frogs","Cricket Frog","",{imageUrl:"x.jpg"}),C("p2","Frogs","Spring Peeper","",{imageUrl:"y.jpg"}),C("p3","Frogs","Gray Treefrog","",{imageUrl:"z.jpg"})];
  ok("a photo deck is never a picture bin (sorting by 'which deck is the photo from' isn't learning)",Object.keys(c.sortDecks(PICS.concat(photos),"k")).length===1&&!c.sortDecks(PICS.concat(photos),"k")[c.SORT_PIC].bins.some(b=>b.label==="Frogs"));
  ok("math facts sort by their answer: bins 4 / 5 / 6 / 7 (9 alone is dropped)",(()=>{ const d=c.sortDecks(MATH,"k"); return d["Math Facts"]&&d["Math Facts"].bins.map(b=>b.label).sort().join()==="4,5,6,7"; })());
  const spell=[].concat(rule(3,"R1","a"),rule(3,"R2","b")).map(x=>Object.assign({},x,{subject:"Spelling"}));
  ok("spelling stays out (Which one?'s rule — the app never shows a spelling the child must produce)",Object.keys(c.sortDecks(spell,"k")).length===0);
  ok("suspended / parked cards and production twins are out",(()=>{ const d=c.sortDecks(ARTICLES.map((x,i)=>Object.assign({},x,i<3?{status:"parked"}:i<6?{dir:"prod"}:{})),"k"); return Object.keys(d).length===0; })());
  ok("a back that is just the front, or a sound mark, is not a bin",Object.keys(c.sortDecks([].concat(rule(3,"x","x").map(x=>({...x,answer:x.prompt})),rule(3,"/ă/","y")),"k")).length===0);
  ok("one card per name",(()=>{ const d=c.sortDecks(ARTICLES.concat(ARTICLES.map(x=>({...x,id:x.id+"dup"}))),"k"); return d.Articles.bins.every(b=>b.ids.length===3); })());
  ok("sortDeckList names the REAL decks for the grid: a Pictures bin is its own deck, never \"Pictures\"",c.sortDeckList(PICS.concat(ARTICLES),"k").join()==="Animals,Articles,Colors,Shapes");
  ok("sortDeckNames puts Pictures first",c.sortDeckNames({"Zed":1,[c.SORT_PIC]:1,"Articles":1}).join()===c.SORT_PIC+",Articles,Zed");
}
console.log("── 🎮 GAMEGRID: Mom's per-deck pick ──");
{
  const off={}; const {c}=world(PICS.concat(ARTICLES),{settings:{gameDecks:{Articles:{sort:false},Colors:{sort:false}}}});
  vm.runInContext("function gameDeckOn(kid,game,deck){ const s=masteryData[kid+'_settings'], G=s&&s.gameDecks, g=G&&G[deck]; if(!g||g[game]==null) return true; return g[game]!==false; } var _gdRaw=false;",c);
  const d=c.sortDecks(c.masteryData.k,"k");
  ok("a rule deck Mom turned off for Sort it is gone",!d.Articles);
  ok("a picture deck turned off is no longer a bin; Pictures stays while two bins remain",d[c.SORT_PIC]&&d[c.SORT_PIC].bins.map(b=>b.label).join()==="Animals,Shapes");
  ok("the grid's own preload (_gdRaw) sees the raw rule",(c._gdRaw=true,Object.keys(c.sortDecks(c.masteryData.k,"k")).length===2&&c.sortDecks(c.masteryData.k,"k")[c.SORT_PIC].bins.length===3));
  c._gdRaw=false;
  ok("an off switch for another game changes nothing here",(c.masteryData.k_settings.gameDecks={Articles:{which:false}},!!c.sortDecks(c.masteryData.k,"k").Articles));
  ok("without the grid (no gameDeckOn) everything plays",(()=>{ const w=world(ARTICLES); return !!w.c.sortDecks(ARTICLES,"k").Articles; })());
}
console.log("── sortRound: the board (pure) ──");
{
  const {c}=world();
  const r=c.sortRound(c.SORT_PIC,c.sortDecks(PICS,"k"),seeded(3));
  ok("Pictures: 3 bins × 3 pictures = 9 cards, every card's bin is its deck",r.kind==="pic"&&r.bins.length===3&&r.turns.length===9&&r.turns.every(t=>PICS.find(p=>p.id===t.pid).subject===t.bin));
  ok("bins start empty, sorted by label; turns are shuffled",r.bins.every(b=>b.ids.length===0)&&r.bins.map(b=>b.label).join()==="Animals,Colors,Shapes"&&r.turns.map(t=>t.bin).join()!=="Animals,Animals,Animals,Colors,Colors,Colors,Shapes,Shapes,Shapes");
  const r2=c.sortRound("Articles",c.sortDecks(ARTICLES,"k"),seeded(5));
  ok("a rule deck: all nine cards, three bins",r2.kind==="back"&&r2.turns.length===9&&r2.bins.length===3);
  const r3=c.sortRound("Math Facts",c.sortDecks(MATH,"k"),seeded(9));
  ok("four bins at most, SORT_BOARD cards at most, split evenly (ceil 12/4 = 3 per bin)",r3.bins.length===4&&r3.turns.length<=c.SORT_BOARD&&r3.bins.every(b=>r3.turns.filter(t=>t.bin===b.key).length<=3));
  ok("a deck not ready → null",c.sortRound("Nope",{},seeded(1))===null);
  const big=[]; for(let g=0;g<2;g++) for(let i=0;i<10;i++) big.push(C("b"+g+i,"Big","card "+g+i,"Rule "+g));
  const r4=c.sortRound("Big",c.sortDecks(big,"k"),seeded(2));
  ok("two bins of ten → 6 + 6 = 12 on the board",r4.turns.length===12&&r4.bins.every(b=>r4.turns.filter(t=>t.bin===b.key).length===6));
}
console.log("── sortJudge: one drop (pure) ──");
{
  const {c}=world();
  const mk=()=>({bins:[{key:"a",label:"A",ids:[]},{key:"b",label:"B",ids:[]}],turns:[{pid:"1",bin:"a",done:false,first:false,wrong:{},back:false},{pid:"2",bin:"b",done:false,first:false,wrong:{},back:false}],phase:"play",first:0,of:2,returned:{}});
  let st=mk();
  ok("wrong bin → 'wrong', the card stays in the tray, the miss is remembered",c.sortJudge(st,0,1)==="wrong"&&!st.turns[0].done&&st.turns[0].wrong.b===1&&st.bins[1].ids.length===0);
  ok("right bin after a miss → placed, not first",c.sortJudge(st,0,0)==="right"&&st.turns[0].done&&st.turns[0].first===false&&st.bins[0].ids.join()==="1"&&st.first===0);
  ok("right first try → first, counted",c.sortJudge(st,1,1)==="right"&&st.turns[1].first===true&&st.first===1);
  ok("the tray empties → the missed card comes back once (a 'back' turn), round still on",st.phase==="play"&&st.turns.length===3&&st.turns[2].back===true&&st.turns[2].pid==="1"&&st.returned["1"]===1);
  ok("the back turn missed again does NOT return a second time; the round ends",c.sortJudge(st,2,1)==="wrong"&&c.sortJudge(st,2,0)==="right"&&st.phase==="done"&&st.turns.length===3);
  ok("a back turn right never adds to the first-try count",st.first===1);
  st=mk(); c.sortJudge(st,0,0); c.sortJudge(st,1,1);
  ok("a clean round ends with nothing coming back",st.phase==="done"&&st.turns.length===2&&st.first===2);
  ok("a placed card can't be dropped again",c.sortJudge(st,0,1)===null);
}
console.log("── a whole round in the app (sortStart / sortPick / sortBinTap / sortDrop) ──");
{
  const {c,writes,said,dings,celeb}=world(PICS,{overlay:true});
  c.sortStart(c.SORT_PIC);
  const st=c.sortState;
  ok("start: a round for this kid, game 'sort', 9 cards, bins named aloud for a pre-reader",st&&st.kid==="k"&&st.game==="sort"&&st.deck===c.SORT_PIC&&st.of===9&&said[0]==="Animals, Colors, Shapes");
  ok("a bin tapped with nothing picked says its name",(c.sortBinTap(0),said[said.length-1]==="Animals"));
  const ti=st.turns.findIndex(t=>t.bin==="Colors"), it=PICS.find(p=>p.id===st.turns[ti].pid);
  c.sortPick(ti);
  ok("tap a card: picked, its name said (never its bin)",st.sel===ti&&said[said.length-1]===it.prompt&&said.indexOf("Colors",1)<0);
  const wrongBi=st.bins.findIndex(b=>b.key!=="Colors"), rightBi=st.bins.findIndex(b=>b.key==="Colors");
  c.sortBinTap(wrongBi);
  ok("wrong bin: bonk, the card shakes back into the tray, picked no more, its name said again",dings[dings.length-1]==="bonk"&&st.shake===ti&&st.sel===null&&!st.turns[ti].done&&said[said.length-1]===it.prompt);
  const html=c.buildSortHtml("#333");
  ok("the board says 'Not that bin' and never which bin it was",/Not that bin/.test(html)&&!/belongs in Colors/.test(html));
  c.sortPick(ti); c.sortBinTap(rightBi);
  ok("right bin: ding, placed, the bin lights",dings[dings.length-1]==="ding"&&st.turns[ti].done&&st.bins[rightBi].ids.indexOf(it.id)>=0&&st.lit===rightBi);
  // place the rest right, by drop
  st.turns.forEach((t,i)=>{ if(!t.done) c.sortDrop(i,st.bins.findIndex(b=>b.key===t.bin)); });
  ok("the tray empties → the missed card is back for one more sort, nothing written yet",st.phase==="play"&&st.turns.length===10&&st.turns[9].back===true&&writes.length===0);
  ok("the board tells them these come back",/come back for one more sort/.test(c.buildSortHtml("#333")));
  c.sortDrop(9,rightBi);
  ok("round over: 8 of 9 on the first try",st.phase==="done"&&st.first===8&&st.of===9);
  const log=writes.find(w=>w[0]==="push"&&/gameLog\/k\/20261102/.test(w[1]));
  ok("one gameLog push, game 'sort', the deck, every card with first / taps / back",!!log&&log[2].game==="sort"&&log[2].deck===c.SORT_PIC&&log[2].items.length===10&&log[2].items.filter(x=>!x.ok).length===1&&log[2].items.some(x=>x.back&&x.id===it.id)&&log[2].items.find(x=>x.id===it.id&&!x.back).n===2);
  const best=writes.find(w=>w[0]==="update"&&/k_settings\/match_best/.test(w[1]));
  ok("best: one key '<deck> · sort', this key only",!!best&&Object.keys(best[2]).join()===c.SORT_PIC+" \u{00B7} sort"&&best[2][c.SORT_PIC+" \u{00B7} sort"]===8&&st.isPB);
  ok("no other write at all",writes.length===2);
  ok("not a clean round → no confetti",celeb.length===0);
  const fin=c.buildSortHtml("#333");
  ok("the finish shows the bins as sorted, the count, Play again",/All sorted!/.test(fin)&&/8 of 9 on the first try/.test(fin)&&/new best!/.test(fin)&&/Play again/.test(fin));
}
console.log("── a clean round: confetti; best only when beaten; dry run writes nothing ──");
{
  const {c,writes,celeb}=world(ARTICLES,{overlay:true,settings:{match_best:{"Articles \u{00B7} sort":9}}});
  c.sortStart("Articles"); const st=c.sortState;
  st.turns.forEach((t,i)=>{ c.sortDrop(i,st.bins.findIndex(b=>b.key===t.bin)); });
  ok("every card first try → done, 9 of 9, confetti (noSong), for the round's own kid",st.phase==="done"&&st.first===9&&celeb.length===1&&celeb[0][0]==="k"&&/sorted them all/.test(celeb[0][1]));
  ok("best 9 already → no match_best write; only the gameLog push",writes.length===1&&writes[0][0]==="push"&&!st.isPB&&st.prevBest===9);
  const w2=world(ARTICLES,{dry:true}); w2.c.sortStart("Articles"); const s2=w2.c.sortState;
  s2.turns.forEach((t,i)=>{ w2.c.sortDrop(i,s2.bins.findIndex(b=>b.key===t.bin)); });
  ok("?dryrun=1 → the round plays, nothing is written",s2.phase==="done"&&w2.writes.length===0);
}
console.log("── the round belongs to its kid (GAMEKID); Change deck drops it; resume puts a picked card down ──");
{
  const {c,writes}=world(MATH);
  c.sortStart("Math Facts"); const st=c.sortState; c.sortPick(0);
  c.masteryKid="other"; c.masteryData.other=[];
  c.sortResume(); ok("resume: the picked card is put down",st.sel===null);
  st.turns.forEach((t,i)=>{ c.sortDrop(i,st.bins.findIndex(b=>b.key===t.bin)); });
  ok("finish after a kid switch still saves to the round's own kid",st.phase==="done"&&writes.every(w=>/\/k\/|\/k_settings\//.test(w[1])));
  const w2=world(MATH); w2.c.sortStart("Math Facts"); w2.c.sortDrop(0,0); w2.c.sortChangeDeck();
  ok("Change deck mid-round: dropped, nothing written",w2.c.sortState===null&&w2.writes.length===0);
  ok("a round can't start on a deck the kid doesn't have",(w2.c.sortStart("Nope"),w2.c.sortState===null));
}
console.log("── what the kid sees ──");
{
  const {c}=world([]);
  ok("no sortable deck → the plain 'not yet' line, no chips",/No decks ready for Sort it yet/.test(c.buildSortHtml("#333")));
  const w=world(PICS.concat(ARTICLES));
  const h=w.c.buildSortHtml("#333");
  ok("deck chips: Pictures first, then the rule deck; the how-to line",h.indexOf("\u{1F5BC} Pictures")<h.indexOf("Articles")&&/tap the card, then tap the bin/.test(h));
  w.c.sortStart("Articles"); const h2=w.c.buildSortHtml("#333"); const st=w.c.sortState;
  ok("the tray shows every undone card with its front's markup kept; the bins carry their rule and data-sortbin",(h2.match(/class="sort-card/g)||[]).length===9&&/<u>a<\/u>/.test(h2)&&(h2.match(/data-sortbin="/g)||[]).length===3&&/Use an before a vowel sound\./.test(h2));
  w.c.sortDrop(0,st.bins.findIndex(b=>b.key===st.turns[0].bin));
  const h3=w.c.buildSortHtml("#333");
  ok("a placed card leaves the tray and shows as a chip in its bin",(h3.match(/class="sort-card/g)||[]).length===8&&/sort-chip/.test(h3));
  ok("GAMES_LIST availability is cheap and true only with a sortable deck",(()=>{ const avail=src.match(/\{key:"sort",[^\n]*available:(k=>.*?\.length>0)/)[1]; const f=w.c.sortDecks; const g=new Function("sortDecks","_gamesItems","return "+avail)(f,k=>w.c.masteryData[k]||[]); return g("k")===true&&g("nobody")===false; })());
}

console.log("\n"+pass+" passed, "+fail+" failed");
process.exit(fail?1:0);
