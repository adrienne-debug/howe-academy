/*
 * MIX_FINISH + EVENOUT_HONEST (her asks 2026-10-21). The Daily Mix had no limit — every graduated card lands there and all that are due
 * show (Lincoln 10/21: ~36 of 96). Now a sitting is the oldest-due `mixFinish` reviews (default 20); saving it logs the day as done (the
 * kid's card reads mstLogGet), the view offers "Keep going (N left)" for the rest through the same save. Even out refuses in dry-run and
 * the toast tells the truth.  run: node test_mix_finish.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,300)+")":"")); } };
const fn=name=>{ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); let d=0; for(let k=src.indexOf("{",i);k<src.length;k++){ if(src[k]==="{") d++; else if(src[k]==="}"&&--d===0) return src.slice(i,k+1); } throw new Error("unbalanced "+name); };
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("missing "+a); return src.slice(i,j); };
// Lincoln's shape: 36 weekly German/SS/AAS cards due, oldest first by next_due (school-day numbers), pn = 201
const PN=201; const cards=[]; for(let i=0;i<36;i++) cards.push({id:"c"+i,subject:i%2?"German":"AAS Words",tier:"weekly",status:"active",next_due:PN-(i%9),prompt:"w"+i,answer:"a"+i,review_mode:"flash"});
cards.push({id:"lrn",subject:"German",tier:"daily",status:"introduction",prompt:"x",answer:"y",review_mode:"flash"});   // a learning card — never the Mix's
function mk(o){ o=o||{}; const writes=[], toasts=[];
  const ctx={console,Object,Array,String,Number,parseInt,Math,JSON,Date,Set,Map,Infinity,
    masteryData:{lincoln:JSON.parse(JSON.stringify(cards)),lincoln_sessions:{daily_mix:{name:"Daily Mix",kind:"mix",mixFinish:o.finish},german:{name:"German",kind:"deck",decks:["German"],mixInAt:"every_other_day",handOffAt:"bi_weekly"},ds:{name:"Daily Study",kind:"all",mixInAt:"every_other_day",handOffAt:"bi_weekly"}}},
    masteryKid:"lincoln", MAST_TIER_ORDER:["daily","every_other_day","every_third_day","weekly","bi_weekly","monthly","learned","graduated"], MAST_TIER_INT:{daily:1,every_other_day:2,every_third_day:3,weekly:7,bi_weekly:14,monthly:28,learned:60,graduated:null},
    mastDrillSettings:()=>({ladder:["every_other_day","weekly","bi_weekly","monthly","graduated"]}), mastIsParked:()=>false, mastIsNeverDrill:()=>false, mastFullBank:()=>({}), mastGetPrintNum:()=>PN,
    db:{ref:p=>({update:v=>writes.push(["update",p,v]),set:v=>writes.push(["set",p,v])})}, _dryRun:()=>!!o.dry, HA_LS:{setItem:()=>{},getItem:()=>null}, gwShowToast:t=>toasts.push(t), confirm:()=>true, _mastRe:()=>{}, cap:s=>s[0].toUpperCase()+s.slice(1), mastItemIsQuiz:()=>false,
    writes, toasts};
  vm.createContext(ctx);
  vm.runInContext(cut("const MST_SESSION_DEFAULTS =","\n};")+"\n};\n"+cut("const MST_PATTERN_MODES",";\n")+";\n"+cut("const MST_HOWTO_MAX",";\n")+";\n"+["mstPatternClean","mstHowtoClean","mstTierIdx","mstSessions","mstMixOwns","mstOwns","mstPile","mastIsDue","_mstMulberry32","_mstHashStr","_mstShuffle","evo2TodayKey","evo2LastTested","evo2ReviewedToday","evo2Plan","mastRebalanceKid","mastRebalanceNow"].map(fn).join("\n"),ctx);
  ctx.get=e=>vm.runInContext(e,ctx); return ctx; }

console.log("1. The Mix finish line");
{ const c=mk(); const p=c.get("mstPile('lincoln','daily_mix',"+PN+",null)");
  ok("36 due, finish 20 (default): the sitting is 20 cards, mixLeft says 36", p.reviews.length===20&&p.mixLeft===36&&p.mixFinish===20, [p.reviews.length,p.mixLeft,p.mixFinish]);
  ok("oldest due first: every card in the sitting is as old or older than every card left out", (()=>{ const inn=p.reviews.map(x=>x.next_due), all=c.get("masteryData.lincoln").filter(x=>x.tier==="weekly").map(x=>x.next_due).sort((a,b)=>a-b); return Math.max(...inn)<=all[20]; })(), p.reviews.map(x=>x.next_due));
  ok("the learning card is never in the Mix", !p.reviews.some(x=>x.id==="lrn"));
  const f=mk({finish:10}); ok("her setting: finish 10 → 10 cards", f.get("mstPile('lincoln','daily_mix',"+PN+",null)").reviews.length===10);
  const z=mk({finish:0}); ok("0 = the old behaviour, all 36", z.get("mstPile('lincoln','daily_mix',"+PN+",null)").reviews.length===36);
}
console.log("2. Keep going — the next batch, not the same cards");
{ const c=mk(); const first=c.get("mstPile('lincoln','daily_mix',"+PN+",null)").reviews.map(x=>x.id);
  const log={items:first.map(id=>({id:id,result:"c"}))};   // today's save logged those 20 as scored
  const next=c.get("mstPile('lincoln','daily_mix',"+PN+","+JSON.stringify(log)+")");
  ok("after the first save: the next sitting is the remaining 16, none repeated, mixLeft 16", next.reviews.length===16&&next.mixLeft===16&&!next.reviews.some(x=>first.indexOf(x.id)>=0), [next.reviews.length,next.mixLeft]);
  const done={items:cards.filter(x=>x.tier==="weekly").map(x=>({id:x.id,result:"c"}))}; ok("everything scored: nothing left (All done for today)", c.get("mstPile('lincoln','daily_mix',"+PN+","+JSON.stringify(done)+")").reviews.length===0);
}
console.log("3. The screen");
{ const S=src;
  ok("the done screen offers Keep going · N left when Mix cards remain, and says the day's Mix is done", /Keep going · '\+_mx\+' left/.test(S)&&/Today\\'s Mix is done/.test(S));
  ok("the Start button says '20 of 36 due — done at 20'", /pile\.mixFinish\+' of '\+pile\.mixLeft\+' due \\u2014 done at '\+pile\.mixFinish/.test(S));
  ok("the session editor has a Mix finish line stepper (mix sessions only), saved as mixFinish", /Mix finish line/.test(S)&&/rec\.mixFinish = Number\(mhqSessForm\.mixFinish/.test(S)&&/mixFinish: rec\.mixFinish != null \? rec\.mixFinish : MST_SESSION_DEFAULTS\.mixFinish/.test(S));
}
console.log("4. Even out tells the truth (her 117 → 68 → 177)");
{ const c=mk(); c.get("masteryData.lincoln.forEach((x,i)=>{ if(x.tier==='weekly') x.next_due="+PN+"; })");   // everything bunched on today
  const r=c.get("mastRebalanceKid('lincoln')"); ok("live: cards re-spread, ONE next_due-only update sent (+ EVENOUT2's evened_at), sent:true", r.changed>0&&r.sent===true&&c.writes.length===2&&c.writes[0][1]==="mastery/lincoln"&&Object.keys(c.writes[0][2]).every(k=>/\/next_due$/.test(k))&&c.writes[1][1]==="mastery/lincoln_settings/evened_at", [r,c.writes.length]);
  c.get("masteryData.lincoln.forEach((x,i)=>{ if(x.tier==='weekly') x.next_due="+PN+"; })"); c.get("mastRebalanceNow()"); ok("toast: Evened out N ✓", /Evened out \d+ review cards? ✓/.test(c.toasts[c.toasts.length-1]), c.toasts);
  const d=mk({dry:true}); d.get("masteryData.lincoln.forEach((x,i)=>{ if(x.tier==='weekly') x.next_due="+PN+"; })"); const rd=d.get("mastRebalanceKid('lincoln')");
  ok("?dryrun=1: nothing sent, sent:false", rd.sent===false&&d.writes.length===0);
  d.get("masteryData.lincoln.forEach((x,i)=>{ if(x.tier==='weekly') x.next_due="+PN+"; })"); d.get("mastRebalanceNow()"); ok("…and the toast says so instead of ✓", /Dry run — \d+ cards would move, nothing saved/.test(d.toasts[d.toasts.length-1]), d.toasts);
}
ok("no 🔀", src.indexOf("🔀")<0);
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
