/*
 * Node tests — ⭐ CPPOINTS, the class site's points scheme (Adrienne's approved scheme, 2026-11-10, for Brittany's class).
 *   · where the block sits and how it is hooked (typeof-guarded lines tagged ⭐ CPPOINTS); its only writes: the day's ledger by TRANSACTION
 *     (mastery/<kid>_envstars/<YYYYMMDD>) and bankDirect; Lincoln's memo only in HA_LS;
 *   · the day math: Day done 3 · Part 1 (never with Day done; a later clear tops up +2) · Extra 1 per 5 cards past the pile, 3 a day ·
 *     game rounds 2 at 90 %+, 1 at 70–89 %, 0 below, judged rounds on the Envirothon decks only, 4 a day;
 *   · the ledger: a second sitting, a reload or another device's record never pays twice; dry run nothing; demo moves _envs.bankDemo;
 *   · the kid's own taps only: a kid login, or a parent login in kid view (CPKIDMODE) — never the parent's page, never the teacher;
 *   · the summary's day record {due, done, cleared, extra, games, stars} + summary.stars (Lincoln: what the scheme would give, starsInfo,
 *     and his mirror's payload only GAINS fields); the console's week line; 🏅 Team picks' study input (and its fallback).
 * Uses the world from test_env_site.js.    run: node test_cp_points.js
 */
const {world,src,SITE}=require("./test_env_site.js");
let pass=0, fail=0;
const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  "+JSON.stringify(x).slice(0,600):"")); } };
const cut=(a,b)=>{ const i=src.indexOf(a); if(i<0) throw new Error("missing "+a); const j=src.indexOf(b,i); return src.slice(i,j+b.length); };
const PTS=cut("// CPPOINTS_START","// CPPOINTS_END");
const PF=(PTS.match(/^function (\w+)/gm)||[]).map(s=>s.slice(9));
const ASSIGN=src.slice(src.indexOf("function cpAheadAssignOf(o){"),src.indexOf("function cpahByDay("));   // CPAHEAD's pure assignment test
const FAM={familyId:"ramirez",edition:"envirothon",className:"MS Science 2026-27",roster:[]};
const DECK="forestry_trees", OTHER="spelling_words";
// a stand-in study engine: today's log and pile come from G (the real ones are the app's mstLogGet / mstPile)
const ENGINE='function mstLogGet(kid,sid){ return G.log||null; } function mstPile(kid,sid,pn,log){ return G.pile||{reviews:[],learning:[],newNames:[]}; } function mastGetPrintNum(){ return 1; } const GAMES_LIST=[{key:"match",label:"Match"},{key:"gofish",label:"Go Fish"}];';
function W(o){ o=o||{}; const rev=[PTS,o.engine===false?"":ENGINE,o.assign?ASSIGN:"","G.pts={ CPPTS, _cpPts, "+PF.join(", ")+", envSummary, get masteryData(){ return masteryData; } };"].join("\n");
  const w=world(Object.assign({fam:FAM,rev,unitStudies:{nc_envirothon:{id:"nc_envirothon",decks:[{key:DECK,station:"forestry"},{key:"soils_basics",station:"soils"}]}},masteryData:o.M||{}},o.w||{}));
  w.P=w.G.pts; return w; }
const log=n=>({items:Array.from({length:n},(_,i)=>({id:"c"+i,name:"card "+i,deck:DECK,result:i%3?"c":"shown"}))});
const kidLive=w=>{ w._envs.role="kid"; w._envs.kid="maya"; w.initFb(); return w; };
const paid=w=>(w.G.bankWrites||[]).map(b=>b[1]+"|"+b[2]);

const run=async()=>{
console.log("── the block, where it sits, how it is hooked ──");
{ const a=src.indexOf("// CPPOINTS_START"), b=src.indexOf("// CPPOINTS_END");
  ok("one CPPOINTS block, right after CPTEAMPICK_END", a>0&&b>a&&src.indexOf("// CPPOINTS_START",a+1)<0&&src.slice(src.indexOf("// CPTEAMPICK_END"),a).trim()==="// CPTEAMPICK_END");
  ok("the header names the scheme, the date and the ledger path", /2026-11-10/.test(PTS.slice(0,600))&&/mastery\/<kid>_envstars\/<YYYYMMDD>/.test(PTS)&&/INFORMATIONAL/.test(PTS));
  ok("the block only declares (nothing runs at load)", PTS.split("\n").every(l=>!l.trim()||/^(\/\/|function |const | |})/.test(l)));
  const out=(src.slice(0,a)+src.slice(b)).replace(/\/\/ CPMYCLASS_START[\s\S]*?\/\/ CPMYCLASS_END\n/,""), hooks=out.split("\n").filter(l=>/\bcpPts[A-Z]\w*\(/.test(l));   // 🏫 CPMYCLASS reads CPPOINTS' week line for his 🌿 tile: a reader, not a hook
  ok("six hook lines outside the block, each typeof-guarded and tagged ⭐ CPPOINTS", hooks.length===6&&hooks.every(l=>/typeof cpPts\w+==="function"/.test(l)&&/⭐ CPPOINTS/.test(l)), hooks.map(l=>l.trim().slice(0,80)));
  const fn=(name)=>{ const i=src.indexOf("function "+name+"("); return src.slice(i,src.indexOf("\n}",i)); };
  ok("…envSiteSittingDone hands the sitting over (no flat ENVS_STARS write left in it)", /cpPtsSitting\(kid,done\)/.test(fn("envSiteSittingDone"))&&!/bankDirect|bankDemo\+=/.test(fn("envSiteSittingDone")));
  ok("…envSummary: right after CPWEEK's line, before the return", /cpWeekSum\(kid,out,M,u\);[^\n]*\n  if\(typeof cpPtsSum==="function"\) cpPtsSum\(kid,out,M,u,ctx\);[^\n]*\n  return out;/.test(src));
  ok("…gameLogRound: after the round is logged", /db\.ref\("mastery\/gameLog\/"\+kid\+"\/"\+day\)\.push\(e\);[^\n]*\n  }\n  if\(typeof cpPtsGame==="function"\) cpPtsGame\(kid,e\);/.test(src));
  ok("…the console's student page, 🏅 Team picks' study input and its text", /cpPtsStudentHtml\(sid\)/.test(fn("envcStudentHtml"))&&/cpPtsStudy\(s,CPTP_WEEKS\)/.test(src)&&/cpPtsStudyTxt\(s\)/.test(src));
  const code=PTS.split("\n").filter(l=>!/^\s*\/\//.test(l)).join("\n");
  ok("its only database write is ONE transaction on mastery/<kid>_envstars/<day>; no other ref, no set / update / remove / push / listener", (code.match(/\.ref\(/g)||[]).length===1&&(code.match(/\.transaction\(/g)||[]).length===1&&/db\.ref\("mastery\/"\+kid\+"_envstars\/"\+day\)\.transaction/.test(code)&&!/\)\.(set|update|remove|push|on|once)\(|envsWrite\(|envcWrite\(|firebase/.test(code));
  const names=(PTS.match(/^(?:function|const) (\w+)/gm)||[]).map(x=>x.split(" ")[1]), rest=src.slice(0,a)+src.slice(b);
  ok("none of its top-level names is declared anywhere else in index.html (one script: a clash stops the whole app)", names.length>20&&names.every(n=>!new RegExp("(function|const|let|var)\\s+"+n.replace(/\$/g,"\\$")+"\\b").test(rest)), names.filter(n=>new RegExp("(function|const|let|var)\\s+"+n+"\\b").test(rest)));
  ok("no Howe kid name as a code literal; no 🔀", !/["'`](lincoln|ellis|lucy|julian)["'`]/i.test(PTS)&&PTS.indexOf("\u{1F500}")<0);
  ok("ENVSITE's header no longer promises a flat count per sitting", !/ENVS_STARS stars per finished sitting/.test(SITE)); }

console.log("\n── the day math (pure) ──");
{ const P=W().P;
  let r=P.cpPtsStudyStep(null,{cards:12,left:0,cleared:true});
  ok("the pile cleared on the first sitting → 🌿 Day done 3, base = the cards studied", r.pay.length===1&&r.pay[0].pts===3&&r.pay[0].note==="🌿 Day done"&&r.rec.done&&!r.rec.partial&&r.rec.base===12&&r.rec.stars===3&&r.rec.due===12);
  ok("…the same day again (a second sitting, a reload) → nothing", P.cpPtsStudyStep(r.rec,{cards:12,left:0,cleared:true}).pay.length===0);
  let p=P.cpPtsStudyStep(null,{cards:6,left:9,cleared:false});
  ok("a sitting with the pile not cleared → 🌿 Part of the day 1; due = done + still waiting", p.pay.length===1&&p.pay[0].pts===1&&p.pay[0].note==="🌿 Part of the day"&&p.rec.partial&&!p.rec.done&&p.rec.due===15&&p.rec.cards===6);
  const p2=P.cpPtsStudyStep(p.rec,{cards:9,left:6,cleared:false});
  ok("…a second part sitting → nothing (Part is once a day)", p2.pay.length===0&&p2.rec.stars===1&&p2.rec.due===15);
  const p3=P.cpPtsStudyStep(p2.rec,{cards:15,left:0,cleared:true});
  ok("…then cleared → a top-up of +2 (3 in all, never Part + Day done)", p3.pay.length===1&&p3.pay[0].pts===2&&/^🌿 Day done/.test(p3.pay[0].note)&&p3.rec.stars===3&&p3.rec.done&&p3.rec.base===15);
  let x=P.cpPtsStudyStep(r.rec,{cards:16,left:0,cleared:true});
  ok("extra: 4 cards past the pile → nothing yet", x.pay.length===0&&x.rec.extra===0);
  x=P.cpPtsStudyStep(x.rec,{cards:22,left:0,cleared:true});
  ok("…10 past → 🌿 Extra · 10 cards, 2 stars", x.pay.length===1&&x.pay[0].pts===2&&x.pay[0].note==="🌿 Extra · 10 cards"&&x.rec.extra===2&&x.rec.stars===5);
  x=P.cpPtsStudyStep(x.rec,{cards:40,left:0,cleared:true});
  ok("…28 past → only the 3rd (3 a day at most)", x.pay.length===1&&x.pay[0].pts===1&&x.rec.extra===3&&x.rec.stars===6);
  ok("…60 past → nothing more", P.cpPtsStudyStep(x.rec,{cards:72,left:0,cleared:true}).pay.length===0);
  const big=P.cpPtsStudyStep(null,{cards:30,left:0,cleared:true});
  ok("cleared in one go: Extra only counts past the pile (base = the cards at the clear)", big.pay.length===1&&big.rec.extra===0);
  ok("a day with no card in the 🌿 session earns nothing", P.cpPtsStudyStep(null,{cards:0,left:5,cleared:false}).pay.length===0);
  ok("game stars: 10/10 2 · 9/10 2 · 8/10 1 · 7/10 1 · 6/10 0 · 89 of 100 → 1 · nothing answered 0", P.cpPtsGameStars(10,10)===2&&P.cpPtsGameStars(9,10)===2&&P.cpPtsGameStars(8,10)===1&&P.cpPtsGameStars(7,10)===1&&P.cpPtsGameStars(6,10)===0&&P.cpPtsGameStars(89,100)===1&&P.cpPtsGameStars(0,0)===0);
  const isD={[DECK]:1}, subj={c1:DECK,c2:DECK,s1:OTHER};
  const R=(o)=>Object.assign({game:"match",deck:DECK,at:1,items:[{id:"c1",ok:true},{id:"c2",ok:true}]},o);
  ok("judged only: Match (the app checks it) counts; Go Fish without its judge stamp → nothing; with it → counts", !!P.cpPtsRoundOf(R(),isD,subj)&&P.cpPtsRoundOf(R({game:"gofish"}),isD,subj)===null&&!!P.cpPtsRoundOf(R({game:"gofish",judge:"pick"}),isD,subj));
  ok("…Teach it, a study round and a Pictures sort never count", P.cpPtsRoundOf(R({game:"teach"}),isD,subj)===null&&P.cpPtsRoundOf(R({study:"x"}),isD,subj)===null&&P.cpPtsRoundOf(R({cat:true}),isD,subj)===null);
  ok("…the Envirothon decks only (a mixed round counts when every card is one); a came-back turn is not counted; nothing answered → null", P.cpPtsRoundOf(R({deck:OTHER,items:[{id:"s1",ok:true}]}),isD,subj)===null&&!!P.cpPtsRoundOf(R({deck:"🎲 Mix"}),isD,subj)&&P.cpPtsRoundOf(R({deck:"🎲 Mix",items:[{id:"c1",ok:true},{id:"s1",ok:true}]}),isD,subj)===null&&P.cpPtsRoundOf(R({items:[{id:"c1",ok:true},{id:"c2",ok:false,back:true}]}),isD,subj).total===1&&P.cpPtsRoundOf(R({items:[]}),isD,subj)===null);
  let g=P.cpPtsGameStep(null,{key:"1",game:"match",right:9,total:10},"Match");
  ok("a round at 90 % → 🎮 Match · 9 of 10, 2 stars, the round noted by its time", g.pay.length===1&&g.pay[0].pts===2&&g.pay[0].note==="🎮 Match · 9 of 10"&&g.rec.games===2&&g.rec.rounds["1"]===2);
  ok("…the same round again → nothing", P.cpPtsGameStep(g.rec,{key:"1",game:"match",right:9,total:10},"Match").pay.length===0);
  g=P.cpPtsGameStep(g.rec,{key:"2",game:"match",right:8,total:10},"Match"); g=P.cpPtsGameStep(g.rec,{key:"3",game:"match",right:10,total:10},"Match");
  ok("…4 a day from games at most (2 + 1 + only 1 of the next 2)", g.rec.games===4&&g.pay[0].pts===1&&g.rec.stars===4&&P.cpPtsGameStep(g.rec,{key:"4",game:"match",right:10,total:10}).pay.length===0);
  ok("a round below 70 % → nothing", P.cpPtsGameStep(null,{key:"9",right:6,total:10}).pay.length===0);
  ok("what the scheme would give (Lincoln): cleared 3 + extra 1 per 5 past (3 max) + games (4 max); part day 1; nothing studied 0", P.cpPtsWould({cards:22,cleared:true,base:12},[{right:9,total:10},{right:10,total:10},{right:7,total:10}])===3+2+4&&P.cpPtsWould({cards:5,cleared:false},[])===1&&P.cpPtsWould(null,[{right:7,total:10}])===1); }

console.log("\n── the award: the ledger by transaction, the kid's own taps only ──");
{ const w=kidLive(W()); w.G.log=log(12); w.G.pile={reviews:[],learning:[],newNames:[]};
  const day=w.P.cpPtxDay();
  ok("live: a sitting that clears the pile → a transaction on mastery/maya_envstars/<today> …", w.envSiteSittingDone("maya",{total:12})===true&&w.G.writes.some(z=>z[0]==="transaction"&&z[1]==="mastery/maya_envstars/"+day));
  ok("…and nothing banked before it commits", !w.G.bankWrites);
  await w.flush();
  ok("…then 3 stars through bankDirect, 🌿 Day done; the ledger in memory says so", paid(w).join()==="3|🌿 Day done"&&w.P.masteryData.maya_envstars[day].done===true&&w.P.masteryData.maya_envstars[day].stars===3);
  const rec=w.G.writes.find(z=>z[0]==="transaction")[2];
  ok("the ledger record: {done, partial, extra, games, stars, due, cards, base, at}", rec.done===true&&rec.partial===false&&rec.extra===0&&rec.games===0&&rec.stars===3&&rec.due===12&&rec.cards===12&&rec.base===12&&typeof rec.at==="number");
  w.envSiteSittingDone("maya",{total:12}); await w.flush();
  ok("a second sitting with nothing new → the transaction aborts, nothing paid", paid(w).length===1&&w.G.writes.filter(z=>z[0]==="transaction").slice(-1)[0][2]===undefined);
  w.G.log=log(23); w.envSiteSittingDone("maya",{total:11}); await w.flush();
  ok("🚀 Keep going: 11 cards past the pile → 🌿 Extra · 11 cards, 2 stars", paid(w)[1]==="2|🌿 Extra · 11 cards");
  const re=kidLive(W({M:{maya_envstars:{[day]:{done:true,partial:false,extra:2,games:0,stars:5,cards:23,base:12,due:12}}}})); re.G.log=log(23);
  re.envSiteSittingDone("maya",{total:3}); await re.flush();
  ok("a reload (or another device's record arriving first): the ledger already paid → nothing", !re.G.bankWrites);
  const dr=kidLive(W()); dr.G.dry=true; dr.G.log=log(5);
  ok("dry run → nothing written, nothing paid", dr.envSiteSittingDone("maya",{total:5})===false&&!dr.G.writes.length&&!dr.G.bankWrites);
  const pa=kidLive(W()); pa._envs.role="parent"; pa.G.log=log(5);
  ok("a parent login on the parent's own page → nothing", pa.envSiteSittingDone("maya",{total:5})===false&&!pa.G.writes.some(z=>z[0]==="transaction"));
  pa._envs.kidMode="maya"; pa.envSiteSittingDone("maya",{total:5}); await pa.flush();
  ok("…the same login in Maya's kid view (CPKIDMODE) → her stars (her pile is clear: Day done 3)", paid(pa).join()==="3|🌿 Day done");
  const t=kidLive(W()); t._envs.role="teacher"; t.G.log=log(5);
  ok("the teacher → nothing", t.envSiteSittingDone("maya",{total:5})===false&&!t.G.bankWrites);
  const nk=kidLive(W({engine:false}));
  nk.envSiteSittingDone("maya",{total:5}); await nk.flush();
  ok("no study engine to ask → a part day, never a guess at Day done", paid(nk).join()==="1|🌿 Part of the day"); }

console.log("\n── CPAHEAD's assignment decides 'cleared' (a class review cap: the capped sitting is the day) ──");
{ const w=kidLive(W({assign:true})); w.G.log={items:Array.from({length:10},(_,i)=>({id:"r"+i,name:"r"+i,deck:DECK,result:"c"}))}; w.G.pile={reviews:[],learning:[],newNames:[],reviewCap:10,reviewLeft:25};
  ok("10 reviews done of a cap of 10 (25 due) → cleared", w.P.cpPtsToday("maya").cleared===true);
  w.G.pile={reviews:[{id:"r1"}],learning:[],newNames:[]};
  const a=w.P.cpPtsToday("maya"); ok("a review still due → not cleared, 1 left", a.cleared===false&&a.left===1&&a.cards===10);
  w.G.log=null; ok("nothing studied today → 0 cards", w.P.cpPtsToday("maya").cards===0); }

console.log("\n── games: the round's hook ──");
{ const w=kidLive(W({M:{maya:[{id:"c1",subject:DECK},{id:"c2",subject:DECK}]}})); const R=(at,ok2,o)=>Object.assign({game:"match",deck:DECK,at,items:Array.from({length:10},(_,i)=>({id:"c"+(i%2+1),ok:i<ok2}))},o||{});
  ok("a judged Match round at 9 of 10 → a transaction, then 🎮 Match · 9 of 10 (2)", w.P.cpPtsGame("maya",R(101,9))===true); await w.flush();
  ok("…banked", paid(w).join()==="2|🎮 Match · 9 of 10");
  w.P.cpPtsGame("maya",R(101,9)); await w.flush();
  ok("the same round handed in again → nothing", paid(w).length===1);
  ok("Go Fish without the judge stamp → nothing at all (no transaction)", w.P.cpPtsGame("maya",R(102,10,{game:"gofish"}))===false);
  w.P.cpPtsGame("maya",R(103,10,{game:"gofish",judge:"pick"})); await w.flush();
  ok("…with the stamp → 🎮 Go Fish · 10 of 10 (2)", paid(w)[1]==="2|🎮 Go Fish · 10 of 10");
  w.P.cpPtsGame("maya",R(104,10)); await w.flush();
  ok("a 3rd good round → nothing (4 a day from games)", paid(w).length===2);
  const p=kidLive(W()); p._envs.role="parent";
  ok("the parent's own page → nothing", p.P.cpPtsGame("maya",R(1,10))===false);
  const h=W({w:{fam:{familyId:"howe",roster:[]}}}); h._envs.kid="maya"; h._envs.role="kid";
  ok("no class site (Howe, DeWalt, Burris, Lincoln) → false at once", h.P.cpPtsGame("maya",R(1,10))===false&&h.P.cpPtsSitting("maya",{total:5})===false&&!h.G.writes.length); }

console.log("\n── demo: the same math, in memory ──");
{ const d=W({w:{search:"?demo=1&role=kid"}}); d.envSiteDemoBoot(); d.G.log=log(12); d.G.pile={reviews:[],learning:[],newNames:[]};
  const b=d._envs.bankDemo, k=d._envs.kid;
  ok("a cleared sitting → bankDemo +3, no bankDirect, no database", d.envSiteSittingDone(k,{total:12})===true&&d._envs.bankDemo===b+3&&!d.G.bankWrites&&!d.G.writes.some(z=>z[0]==="transaction"));
  ok("…again → nothing; 10 extra → +2", d.envSiteSittingDone(k,{total:12})===false&&(()=>{ d.G.log=log(22); d.envSiteSittingDone(k,{total:10}); return d._envs.bankDemo===b+5; })()); }

console.log("\n── the summary's day record ──");
{ const day="20261110", y="20261109";
  const M={maya:[{id:"c1",subject:DECK,prompt:"a",tier:"daily",status:"active"}],
    studyLog:{maya:{envirothon:{[day]:{items:[{deck:DECK,name:"a",result:"c"},{deck:DECK,name:"b",result:"m"},{deck:DECK,name:"c",result:"shown"}],secs:60},[y]:{items:[{deck:DECK,name:"a",result:"c"}],secs:30}}}},
    gameLog:{maya:{[day]:{p1:{game:"match",deck:DECK,at:5,items:[{id:"c1",ok:true},{id:"c1",ok:true},{id:"c1",ok:false}]},local_5:{game:"match",deck:DECK,at:5,items:[{id:"c1",ok:true},{id:"c1",ok:true},{id:"c1",ok:false}]},p2:{game:"gofish",deck:DECK,at:6,items:[{id:"c1",ok:true}]}}}},
    maya_envstars:{[day]:{done:true,partial:true,extra:1,games:1,stars:5,cards:17,base:12,due:12},"20261001":{stars:4}}};
  const u={decks:[{key:DECK,station:"forestry"}]}, now=Date.UTC(2026,10,10,18,0,0);
  const w=W(), s=w.P.envSummary("maya",{M,u,now,ptsSite:true}), D=s.days[day];
  ok("the class site: days.<today> keeps its n and gains {due, done, cleared, extra, games, stars} from the ledger", D.n===3&&D.due===12&&D.done===17&&D.cleared===true&&D.extra===5&&D.stars===5, D);
  ok("…games: the judged rounds only, a round's local copy counted once (Go Fish unstamped left out)", D.games.rounds===1&&D.games.right===2&&D.games.total===3);
  ok("…a study day with no ledger record: games only, stars 0, no study fields", s.days[y].stars===0&&!("cleared" in s.days[y])&&s.days[y].games.rounds===0);
  ok("summary.stars = every star the ledger holds (all season, not just 30 days)", s.stars===9&&!s.starsInfo);
  const L=w.P.envSummary("maya",{M,u,now,ptsSite:false,ptsStudy:{[day]:{cards:17,done:true,base:12,due:12}}});
  ok("Lincoln's mirror: the same study fields from his memo; stars = what the scheme WOULD give (3 + 1 extra; the 2-of-3 round earns 0), starsInfo", L.days[day].cleared===true&&L.days[day].extra===5&&L.days[day].stars===4&&L.stars===4&&L.starsInfo===true&&L.days[y].stars===0);
  const plain=world({fam:{familyId:"howe",roster:[]},rev:"G.es=envSummary;"}).G.es("maya",{M,u,now});
  const strip=o=>{ const c=JSON.parse(JSON.stringify(o)); delete c.stars; delete c.starsInfo; Object.keys(c.days).forEach(k=>{ ["due","done","cleared","extra","games","stars"].forEach(f=>{ delete c.days[k][f]; }); }); return c; };
  ok("his mirror's payload only GAINS fields: without them it is the summary as before, byte for byte", JSON.stringify(strip(L))===JSON.stringify(plain)&&!("stars" in plain)&&!("due" in plain.days[day]));
  const memoW=W({w:{fam:{familyId:"howe",roster:[]}}}); memoW.G.log=log(12); memoW.G.pile={reviews:[{id:"r"}],learning:[],newNames:[]};
  const m1=memoW.P.cpPtsMemo("maya"), dk=memoW.P.cpPtxDay(), key=Object.keys(memoW.HA_LS.s).find(k=>/^ha_cppts_/.test(k));
  ok("Lincoln's memo: today worked out live (12 done, 1 still due), kept in HA_LS on that device only", m1[dk].cards===12&&m1[dk].done===false&&m1[dk].due===13&&!!key&&!memoW.G.writes.length);
  memoW.G.pile={reviews:[],learning:[],newNames:[]}; memoW.G.log=log(20); const m2=memoW.P.cpPtsMemo("maya");
  ok("…cleared later that day: done, base = the cards at the clear", m2[dk].done===true&&m2[dk].base===20&&m2[dk].due===20); }

console.log("\n── the console: ⭐ This week ──");
{ const P=W().P;
  ok("the line: ⭐ 14 · days done 4 of 5 · extra 12 cards · games 3 rounds, 85%", P.cpPtsWeekLine({stars:14,done:4,extra:12,rounds:3,right:17,total:20},5)==="⭐ 14 · days done 4 of 5 · extra 12 cards · games 3 rounds, 85%");
  ok("…no plan known → 'days done 4'; one of each → singular; no rounds → 'no games'", P.cpPtsWeekLine({stars:3,done:1,extra:1,rounds:1,right:9,total:10},null)==="⭐ 3 · days done 1 · extra 1 card · games 1 round, 90%"&&P.cpPtsWeekLine({},0)==="⭐ 0 · days done 0 of 0 · extra 0 cards · no games");
  const days={"20261109":{n:12,stars:5,cleared:true,extra:7,games:{rounds:1,right:9,total:10}},"20261110":{n:4,stars:1,cleared:false,extra:0,games:{rounds:2,right:8,total:10}},"20261108":{n:9,stars:3,cleared:true,extra:0}};
  const w=P.cpPtsWeekOf(days,["2026-11-09","2026-11-10","2026-11-11","2026-11-12","2026-11-13","2026-11-14","2026-11-15"]);
  ok("the week's counts: Mon–Sun only (Sunday the 8th is last week)", w.stars===6&&w.done===1&&w.extra===7&&w.rounds===3&&w.right===17&&w.total===20&&P.cpPtsWeekLine(w,2)==="⭐ 6 · days done 1 of 2 · extra 7 cards · games 3 rounds, 85%");
  const c=W({w:{search:"?demo=1&role=teacher",now:Date.UTC(2026,10,10,15,0,0)}}); c.envSiteDemoBoot(); const sid=Object.keys(c._envc.students)[0];
  c._envc.students[sid].summary=Object.assign({},c._envc.students[sid].summary,{days:{"20261109":{n:12,stars:5,cleared:true,extra:7,games:{rounds:1,right:9,total:10}}},stars:31});
  const h=c.P.cpPtsStudentHtml(sid);
  ok("the student page card: ⭐ This week and the line (the demo reads its own sample day as it is)", /⭐ This week/.test(h)&&/⭐ 5 · days done 1/.test(h)&&/extra 7 cards · games 1 round, 90%/.test(h)&&/All season: ⭐ 31/.test(h), h.slice(0,400));
  c.envcView("student",sid); ok("…painted on the console's student page", /⭐ This week/.test(c.G.content));
  c._envc.students[sid].summary.starsInfo=true; ok("Lincoln's card says his stars are counted here, not banked", /counted here, not banked/.test(c.P.cpPtsStudentHtml(sid)));
  const k=W({w:{search:"?demo=1&role=kid"}}); k.envSiteDemoBoot(); ok("not the console → nothing", k.P.cpPtsStudentHtml("x")===""||!/This week/.test(k.G.content)); }

console.log("\n── 🏅 Team picks' study input ──");
{ const NOW=Date.UTC(2026,10,11,15,0,0);   // Wed Nov 11: last week = Nov 2–8, the week before = Oct 26 – Nov 1
  const P=W({w:{now:NOW}}).P;
  const D={}; ["20261102","20261103","20261104","20261105"].forEach(k=>{ D[k]={n:10,cleared:true,extra:k==="20261102"?10:0}; }); D["20261106"]={n:3,cleared:false,extra:0}; D["20261110"]={n:9,cleared:true,extra:30};
  const r=P.cpPtsStudy({sid:"a_b",summary:{days:D}},12);
  ok("days done ÷ planned days (Mon–Fri without a calendar) over the finished weeks the fields cover, + 1 per 5 extra cards", r&&r.src==="points"&&r.planned===5&&r.done===4&&r.extra===10&&r.pct===82&&r.weeks===1, r);
  ok("…this week's days are left out (finished weeks only, as CPWEEK's completion)", r.extra===10);
  ok("…the text: 82% (4 of 5 days · +10 extra)", P.cpPtsStudyTxt(r)==="82% (4 of 5 days · +10 extra)");
  ok("no points fields yet → null (Team picks keeps CPWEEK's completion)", P.cpPtsStudy({sid:"x",summary:{days:{"20261103":{n:5}}}},12)===null&&P.cpPtsStudy({sid:"x"},12)===null);
  const cap=P.cpPtsStudy({sid:"a_b",summary:{days:Object.assign({},D,{"20261103":{n:40,cleared:true,extra:200}})}},12);
  ok("never above 100", cap.pct===100);
  const tp=src.slice(src.indexOf("function cptpStudyOf(s){"),src.indexOf("\n",src.indexOf("function cptpStudyOf(s){")+40)+200);
  ok("cptpStudyOf asks CPPOINTS first and falls back to cpWeekStudy", /cpPtsStudy\(s,CPTP_WEEKS\); if\(p\) return p;/.test(tp)&&/cpWeekStudy\(s,CPTP_WEEKS\)/.test(tp)); }

console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
};
run().catch(e=>{ console.error(e); process.exit(1); });
