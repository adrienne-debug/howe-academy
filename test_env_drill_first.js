/* 🌿 ENVDRILLFIRST — Envirothon cards come FIRST in the Mom drill and sit outside its caps and minimums (her decision
   2026-10-27: "it would need to be priority of anything because I don't want him to get behind his teammates because
   of the guards. So maybe they are not counted in his minimums"; DESIGN_envirothon_console_2026-10-27.md 8.10).
   Replays the real mastDueItems (with the ENVDRILLFIRST block) over a fake items set: Envirothon cards first; the
   overdue softener, the per-deck cap, the learning floor and the daily learning cap count only his other subjects; the
   15-a-drill ceiling; a held deck's cards absent; a kid not enrolled → byte-identical to today's builder (the block
   cut out); the block writes nothing; the screen strip and divider. Touches no live data.   run: node test_env_drill_first.js */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,400)+")":"")); } };
const fn=name=>{ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); return src.slice(i,src.indexOf("\n}",i)+2); };
const blk=(a,z)=>{ const i=src.indexOf(a); if(i<0) throw new Error("missing "+a); return src.slice(i,src.indexOf(z,i)); };
const UNIT="nc_envirothon";
const A=src.indexOf("// ENVDRILLFIRST_START"), Z=src.indexOf("// ENVDRILLFIRST_END");
const BLOCK=src.slice(A,Z);
const builderAll=blk("const MAST_LEARN_FLOOR","\nlet mastLogMode");             // the builder + the block
const builderToday=builderAll.slice(0,builderAll.indexOf("// ENVDRILLFIRST_START"));   // the builder with the block cut out (its hooks go inert)

console.log("── the block and its hooks ──");
ok("ENVDRILLFIRST block present once, right after the builder (mastDueItems), before mastLogMode", A>0&&Z>A&&src.indexOf("// ENVDRILLFIRST_START",A+1)<0&&A>src.indexOf("function mastDueItems(")&&A<src.indexOf("\nlet mastLogMode"));
ok("the split hook sits right after the due sort, before the softener and the caps", (()=>{ const f=fn("mastDueItems"); const s=f.indexOf("due.sort("), h=f.indexOf("envDrillSplit(kid,due)"), o=f.indexOf("max_overdue_per_drill"); return s>0&&h>s&&o>h; })());
ok("both returns of the builder go through the join", (()=>{ const f=fn("mastDueItems"); return /return _envJ\(capped\.filter\(/.test(f)&&/return _envJ\(capped\);/.test(f); })());
ok("every hook is guarded by typeof (the builder runs without the block)", /typeof envDrillSplit==="function"/.test(src)&&/typeof envDrillJoin==="function"/.test(src)&&/typeof envDrillStripHtml==="function"/.test(src)&&/typeof envDrillQuizDivHtml==="function"/.test(src));
ok("the screen hooks: the strip over the slideshow card, the divider in the quiz list", src.indexOf("envDrillStripHtml(masteryKid,slideList[mastSlideIdx],slideList,_slBase)")>0&&src.indexOf("envDrillQuizDivHtml(masteryKid,qcat,Object.keys(qCats))")>0);
ok("the block writes nothing — no db, no ref/set/update/remove, no localStorage", !/\bdb\b|\.ref\(|\.set\(|\.update\(|\.remove\(|HA_LS|localStorage/.test(BLOCK));
ok("no literal deck list and no Howe kid name in the block", !/Forestry|Wildlife|Aquatic|Soils|Current Issue/.test(BLOCK.replace(/^\/\/.*$/mg,""))&&!/lincoln|ellis|lucy|julian/i.test(BLOCK));
ok("ceiling is 15", /const ENV_DRILL_MAX=15;/.test(BLOCK));

// ── a tiny world: the real builder (with or without the block) over a fake kid ──
function world(withBlock,o){
  o=o||{};
  const ctx={console}; vm.createContext(ctx);
  vm.runInContext(`
    var MAST_TIER_ORDER=["daily","every_other_day","every_third_day","weekly","bi_weekly","monthly","learned","graduated"];
    var MAST_TIER_INT={daily:1,every_other_day:2,every_third_day:3,weekly:5,bi_weekly:10,monthly:20,learned:60,graduated:null};
    var ENV_UNIT_ID=${JSON.stringify(UNIT)};
    var masteryKid="kid1", masteryData={}, unitStudies={}, SETTINGS={max_per_cat:5,cat_caps:{},max_learn_per_drill:0,max_overdue_per_drill:0};
    function mastDrillSettings(){ return SETTINGS; } function mastIsNeverDrill(){ return false; } function mastIsParked(i){ return i.status==="parked"; }
    `+fn("mastIsDue")+"\n"+fn("mastShuffleDeck")+"\n"+(withBlock?builderAll:builderToday),ctx);
  const run=e=>vm.runInContext(e,ctx);
  return {run,ctx};
}
// The family's thin unit record: 4 decks (keys as the real record has them), the kid enrolled or not.
const DECKS=["General Concepts · Terms","Forestry · Terms","Forestry · Facts","Wildlife · ID"];
function unit(enrolled){ return {id:UNIT,starter:UNIT,cardsInCode:true,decks:DECKS.map(k=>({key:k,mode:"flip",bankOnly:true})),enrolled:enrolled||{}}; }
const rev=(sub,id,nd)=>({id:sub.replace(/\W/g,"")+"_"+id,prompt:sub+" "+id,subject:sub,status:"active",tier:"bi_weekly",next_due:nd});
const learn=(sub,id,dots)=>({id:sub.replace(/\W/g,"")+"_l"+id,prompt:sub+" new "+id,subject:sub,status:"introduction",tier:"daily",tally_dots:dots||0});
const PN=200;
// His day: Envirothon reviews (some overdue), Envirothon learning cards, and his other subjects with reviews + learning cards.
function items(){
  const it=[];
  for(let k=0;k<6;k++) it.push(rev("Forestry · Terms",k,190+k));        // 6 Envirothon reviews, all overdue
  for(let k=0;k<3;k++) it.push(rev("Forestry · Facts",k,200));          // 3 due today
  for(let k=0;k<2;k++) it.push(learn("Forestry · Terms",k,2));          // 2 Envirothon learning cards
  for(let k=0;k<7;k++) it.push(rev("Math Facts",k,194+k));               // 7 Math reviews (6 overdue, 1 today)
  for(let k=0;k<4;k++) it.push(learn("Math Facts",k,4-k));
  for(let k=0;k<3;k++) it.push(rev("Vocabulary",k,200));
  for(let k=0;k<3;k++) it.push(learn("Vocabulary",k,3-k));
  for(let k=0;k<2;k++) it.push(rev("Grammar",k,210));                    // not due yet
  return it;
}
function setup(w,enrolled,extra){
  w.run(`masteryData={kid1:${JSON.stringify(extra?extra(items()):items())},kid1_settings:{}}; unitStudies={${JSON.stringify(UNIT)}:${JSON.stringify(unit(enrolled))}}; SETTINGS={max_per_cat:5,cat_caps:{},max_learn_per_drill:0,max_overdue_per_drill:0};`);
}
const isEnv=i=>DECKS.indexOf(i.subject)>=0;
const ids=d=>d.map(i=>i.id);

console.log("\n── 1. his Envirothon cards come first, in the builder's own order ──");
{ const w=world(true); setup(w,{kid1:true}); const d=w.run(`mastDueItems("kid1",${PN})`);
  const envN=d.filter(isEnv).length, firstRest=d.findIndex(i=>!isEnv(i));
  ok("every due Envirothon card rides (9 reviews + 2 learning = 11)", envN===11, envN);
  ok("they are the first 11 cards; the rest follow", firstRest===11&&d.slice(0,11).every(isEnv)&&d.slice(11).every(i=>!isEnv(i)), ids(d));
  ok("reviews before learning cards inside the Envirothon run", d.slice(0,9).every(i=>i.status==="active")&&d.slice(9,11).every(i=>i.status==="introduction"));
  ok("his other subjects are untouched: 7 Math + 3 Vocab reviews, learning cards per the cap and floor", d.filter(i=>i.subject==="Math Facts"&&i.status==="active").length===7&&d.filter(i=>i.subject==="Vocabulary"&&i.status==="active").length===3&&d.filter(i=>i.subject==="Math Facts"&&i.status==="introduction").length===2&&d.filter(i=>i.subject==="Vocabulary"&&i.status==="introduction").length===2, ids(d));
  ok("nothing not due rides (Grammar waits)", !d.some(i=>i.subject==="Grammar"));
  const sh=w.run(`mastShuffleDeck(mastDueItems("kid1",${PN}))`);
  ok("the per-deck shuffle keeps the Envirothon decks first (deck order is the order of first appearance)", sh.slice(0,11).every(isEnv)&&sh.slice(11).every(i=>!isEnv(i)));
}

console.log("\n── 2. the caps count only his other subjects ──");
{ const w=world(true); setup(w,{kid1:true}); w.run("SETTINGS.max_overdue_per_drill=3");
  const d=w.run(`mastDueItems("kid1",${PN})`);
  ok("softener 3: all 6 overdue Envirothon reviews still ride", d.filter(i=>i.subject==="Forestry · Terms"&&i.status==="active").length===6, ids(d));
  ok("…and Math gets its own 3 oldest overdue + the 1 due today (the softener never saw the Envirothon cards)", ids(d.filter(i=>i.subject==="Math Facts"&&i.status==="active")).join()==="MathFacts_0,MathFacts_1,MathFacts_2,MathFacts_6", ids(d.filter(i=>i.subject==="Math Facts")));
  // the same day with the block cut out: the Envirothon overdue cards would have taken the softener's seats from Math
  const t=world(false); setup(t,{kid1:true}); t.run("SETTINGS.max_overdue_per_drill=3");
  const d0=t.run(`mastDueItems("kid1",${PN})`);
  ok("(today's builder would give Math only its 1 due-today review — the 3 overdue seats go to the older Envirothon cards)", d0.filter(i=>i.subject==="Math Facts"&&i.status==="active").length===1, ids(d0.filter(i=>i.subject==="Math Facts")));
}
{ const w=world(true); setup(w,{kid1:true}); w.run("SETTINGS.max_learn_per_drill=4");
  const d=w.run(`mastDueItems("kid1",${PN})`);
  const lo=d.filter(i=>i.status==="introduction"&&!isEnv(i)), le=d.filter(i=>i.status==="introduction"&&isEnv(i));
  ok("daily learning cap 4: all 4 seats go to his other subjects (2 Math + 2 Vocab)", lo.length===4&&lo.filter(i=>i.subject==="Math Facts").length===2&&lo.filter(i=>i.subject==="Vocabulary").length===2, ids(lo));
  ok("…and both Envirothon learning cards ride on top of the cap", le.length===2, ids(le));
  const t=world(false); setup(t,{kid1:true}); t.run("SETTINGS.max_learn_per_drill=4");
  const l0=t.run(`mastDueItems("kid1",${PN})`).filter(i=>i.status==="introduction");
  ok("(today's builder: Envirothon takes seats and the others get fewer)", l0.length===4&&l0.some(isEnv)&&l0.filter(i=>!isEnv(i)).length<4, ids(l0));
}

console.log("\n── 3. the minimum: a day Envirothon fills still pulls his other subjects ──");
{ const w=world(true);
  // 20 Envirothon learning cards due with the daily learning cap at 3: his other decks still get their floor
  setup(w,{kid1:true},it=>it.filter(i=>!isEnv(i)).concat(Array.from({length:20},(_,k)=>learn("Wildlife · ID",k,1))));
  w.run("SETTINGS.max_learn_per_drill=3");
  const d=w.run(`mastDueItems("kid1",${PN})`);
  const lo=d.filter(i=>i.status==="introduction"&&!isEnv(i));
  ok("learning cap 3 → 3 of his OTHER subjects' learning cards ride (Envirothon never counted)", lo.length===3&&lo.every(i=>i.subject==="Math Facts"||i.subject==="Vocabulary"), ids(lo));
  ok("Envirothon rides first, up to the ceiling", d.slice(0,15).every(isEnv)&&!isEnv(d[15]), d.length);
  const t=world(false); setup(t,{kid1:true},it=>it.filter(i=>!isEnv(i)).concat(Array.from({length:20},(_,k)=>learn("Wildlife · ID",k,1)))); t.run("SETTINGS.max_learn_per_drill=3");
  const l0=t.run(`mastDueItems("kid1",${PN})`).filter(i=>i.status==="introduction"&&!isEnv(i));
  ok("(today's builder would hand one of those 3 seats to Envirothon)", l0.length<3, l0.length);
}

console.log("\n── 4. the 15-a-drill ceiling ──");
{ const w=world(true);
  setup(w,{kid1:true},it=>it.filter(i=>!isEnv(i)).concat(Array.from({length:14},(_,k)=>rev("Forestry · Facts",k,180+k)),Array.from({length:6},(_,k)=>rev("Wildlife · ID",k,200)),Array.from({length:4},(_,k)=>learn("Wildlife · ID",k,1))));
  const d=w.run(`mastDueItems("kid1",${PN})`);
  const e=d.filter(isEnv);
  ok("24 Envirothon cards due → 15 ride, all first", e.length===15&&d.slice(0,15).every(isEnv), e.length);
  ok("reviews fill the 15 before any learning card (20 reviews due → no learning card today)", e.every(i=>i.status==="active"));
  ok("the kept 15 are the first 15 reviews in the builder's order (the rest come the next drill)", ids(e).join()===ids(d.filter(isEnv)).join()&&ids(e)[0]==="ForestryFacts_0");
  ok("his other subjects are complete behind them", d.slice(15).filter(i=>i.subject==="Math Facts"&&i.status==="active").length===7);
}

console.log("\n── 5. a held deck (cat_hold) never reaches the drill ──");
{ const w=world(true); setup(w,{kid1:true}); w.run(`masteryData.kid1_settings={cat_hold:{"Forestry · Facts":true}}`);
  const d=w.run(`mastDueItems("kid1",${PN})`);
  ok("Forestry · Facts (held) is absent — not first, not anywhere", !d.some(i=>i.subject==="Forestry · Facts"), ids(d));
  ok("the other Envirothon decks still ride first (6 + 2)", d.slice(0,8).every(isEnv)&&d.filter(isEnv).length===8);
}

console.log("\n── 6. a kid not enrolled → byte-identical to today's builder ──");
for(const [label,enrolled,unitThere] of [["not enrolled",{kid2:true},true],["nobody enrolled",{},true],["no Envirothon unit in this family",{kid1:true},false]]){
  const w=world(true), t=world(false);
  for(const x of [w,t]){ setup(x,enrolled); if(!unitThere) x.run("unitStudies={}"); x.run("SETTINGS.max_learn_per_drill=4; SETTINGS.max_overdue_per_drill=3"); }
  const a=JSON.stringify(w.run(`mastDueItems("kid1",${PN})`)), b=JSON.stringify(t.run(`mastDueItems("kid1",${PN})`));
  ok(label+": the queue is byte-identical with the block and without it", a===b&&a.length>2, [a.length,b.length]);
  ok(label+": envDrillDecks is null (nothing applies)", w.run(`envDrillDecks("kid1")`)===null);
}
{ const w=world(true); setup(w,{kid1:true}); w.run(`masteryData.kid1=masteryData.kid1.filter(i=>i.subject!=="Forestry · Terms"&&i.subject!=="Forestry · Facts")`);
  const t=world(false); setup(t,{kid1:true}); t.run(`masteryData.kid1=masteryData.kid1.filter(i=>i.subject!=="Forestry · Terms"&&i.subject!=="Forestry · Facts")`);
  ok("enrolled but nothing Envirothon due today → the same queue as today's builder", JSON.stringify(w.run(`mastDueItems("kid1",${PN})`))===JSON.stringify(t.run(`mastDueItems("kid1",${PN})`)));
}

console.log("\n── 7. dry run / writes ──");
{ const w=world(true); setup(w,{kid1:true}); w.run("var db={ref(){ throw new Error('a write'); }}; function _dryRun(){ return true; }");
  let threw=false; try{ w.run(`mastDueItems("kid1",${PN}); envDrillStripHtml("kid1",masteryData.kid1[0],masteryData.kid1,99); envDrillQuizDivHtml("kid1","Math Facts",["Forestry · Terms","Math Facts"])`); }catch(e){ threw=true; }
  ok("building the drill and drawing the strip/divider touch no db, in dry run or live", !threw);
}

console.log("\n── 8. the screen: a thin strip, a thin divider, nothing else ──");
{ const w=world(true); setup(w,{kid1:true});
  const d=w.run(`mastDueItems("kid1",${PN})`);
  w.run(`var D=mastDueItems("kid1",${PN})`);
  const s0=w.run(`envDrillStripHtml("kid1",D[0],D,D.length)`), s1=w.run(`envDrillStripHtml("kid1",D[3],D,D.length)`), sR=w.run(`envDrillStripHtml("kid1",D[11],D,D.length)`);
  ok("on an Envirothon card: '🌿 Envirothon first · 1 / 11' (thin, one line)", /\u{1F33F} Envirothon first \u{00B7} 1 \/ 11/u.test(s0)&&(s0.match(/<div/g)||[]).length===1, s0);
  ok("on the 4th: '4 / 11'", /4 \/ 11/.test(s1), s1);
  ok("on one of his other cards: nothing", sR==="");
  ok("second-look tail (past base) is not counted", /1 \/ 11/.test(w.run(`envDrillStripHtml("kid1",D[0],D.concat(D.slice(0,3)),D.length)`)));
  ok("not enrolled: no strip", world(true).run(`unitStudies={}; envDrillStripHtml("kid1",{subject:"Forestry · Terms"},[],0)`)==="");
  const cats=["Forestry · Terms","Forestry · Facts","Math Facts","Vocabulary"];
  ok("quiz list: the divider sits above the first non-Envirothon deck only", /Envirothon first/.test(w.run(`envDrillQuizDivHtml("kid1","Math Facts",${JSON.stringify(cats)})`))&&w.run(`envDrillQuizDivHtml("kid1","Vocabulary",${JSON.stringify(cats)})`)===""&&w.run(`envDrillQuizDivHtml("kid1","Forestry · Facts",${JSON.stringify(cats)})`)==="");
  ok("no Envirothon deck in the quiz list → no divider", w.run(`envDrillQuizDivHtml("kid1","Math Facts",["Math Facts","Vocabulary"])`)==="");
}

console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
