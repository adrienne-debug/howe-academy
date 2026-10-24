/*
 * EVENOUT2 (her design 2026-10-23), switched to the review engine's rules 2026-10-24 (REVIEWENGINE). ⚖️ Even out groups review cards
 * by deck + rung, orders each group by last tested (oldest first; fallback next_due − interval, then 0; ties by id) and deals from the
 * start day (tomorrow if the kid reviewed on today's school day, else today) up to an even share a day — ceil(1.25 × cards ÷ interval)
 * — and never places a card before it has rested its rung's full time. Writes only changed next_due + settings/evened_at; a study
 * sitting saved before evened_at with no grades rebuilds.  run: node test_evenout_v2.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,300)+")":"")); } };
const slice=(s,e)=>{ const a=src.indexOf(s), b=src.indexOf(e); if(a<0||b<0) { console.log("FAIL- "+s+" block missing"); process.exit(1); } return src.slice(a,b); };
const block=slice("// EVENOUT2_START","// EVENOUT2_END")+slice("// REVIEWENGINE_START","// REVIEWENGINE_END");
const TK=new Date().toISOString().slice(0,10).replace(/-/g,"");
const PN=100;
function mk(cards,o){ o=o||{}; const writes=[], toasts=[];
  const md={ellis:JSON.parse(JSON.stringify(cards)),history:o.history?{ellis:o.history}:undefined,studyLog:o.studyLog?{ellis:o.studyLog}:undefined};
  if(o.settings) md.ellis_settings=o.settings;
  const ctx={console,Object,Array,String,Number,Math,JSON,Date,Map,Set,Infinity,masteryData:md,masteryKid:"ellis",
    MAST_TIER_INT:{daily:1,every_other_day:2,every_third_day:3,weekly:5,bi_weekly:10,monthly:20,learned:60,graduated:null},
    mastIsParked:i=>!!(i&&i.status==="parked"), mastIsNeverDrill:i=>!!(i&&i.never), mastGetPrintNum:()=>PN,
    db:{ref:p=>({update:v=>writes.push(["update",p,v]),set:v=>writes.push(["set",p,v])})}, _dryRun:()=>!!o.dry,
    HA_LS:{setItem:()=>{},getItem:()=>null}, gwShowToast:t=>toasts.push(t), confirm:()=>true, _mastRe:()=>{}, cap:s=>s[0].toUpperCase()+s.slice(1), writes, toasts};
  vm.createContext(ctx); vm.runInContext(block,ctx); ctx.get=e=>vm.runInContext(e,ctx); return ctx; }
const card=(id,subject,tier,next_due,x)=>Object.assign({id,subject,tier,status:"active",next_due,prompt:id},x||{});
const due=(c,id)=>c.get("masteryData.ellis").find(x=>x.id===id).next_due;
const perDay=(c,f)=>{ const m={}; c.get("masteryData.ellis").filter(f||(()=>true)).forEach(x=>{ m[x.next_due]=(m[x.next_due]||0)+1; }); return m; };

console.log("1. Grouping by deck + rung, an even share a day (+25%)");
{ const cs=[]; for(let i=0;i<14;i++) cs.push(card("g"+String(i).padStart(2,"0"),"German","weekly",PN)); for(let i=0;i<7;i++) cs.push(card("m"+i,"Math","weekly",PN)); for(let i=0;i<4;i++) cs.push(card("e"+i,"German","every_other_day",PN));
  const c=mk(cs); c.get("mastRebalanceKid('ellis')");
  const g=perDay(c,x=>x.subject==="German"&&x.tier==="weekly"), m=perDay(c,x=>x.subject==="Math"), e=perDay(c,x=>x.tier==="every_other_day");
  ok("German weekly 14, all rested → ceil(1.25×14÷5) = 4 a day: 4,4,4,2 from today", JSON.stringify(g)===JSON.stringify({[PN]:4,[PN+1]:4,[PN+2]:4,[PN+3]:2}), g);
  ok("Math weekly 7 → its own group, 2 a day: 2,2,2,1", JSON.stringify(m)===JSON.stringify({[PN]:2,[PN+1]:2,[PN+2]:2,[PN+3]:1}), m);
  ok("German every-other-day 4 → its own rung, 3 then 1", e[PN]===3&&e[PN+1]===1, e);
}
console.log("2. Oldest tested first, the fallback order, and the rest gate");
{ const cs=[card("a","G","weekly",PN+5),card("b","G","weekly",PN+5),card("c","G","weekly",PN+5),card("d","G","weekly",PN+3),card("e","G","weekly",null),card("f","G","weekly",PN+5),card("g","G","weekly",PN+5)];
  // a tested on day 95 (drill), b on 90 (study c), c drill "shown" only (doesn't count) + study "~" (doesn't count for study)
  const history={"20990101":{printNum:95,items:[{id:"a",result:"c"},{id:"c",result:"shown"}]},"20990102":{printNum:80,items:[{id:"a",result:"m"}]}};
  const studyLog={german:{"20990103":{printNum:90,items:[{id:"b",result:"c"},{id:"c",result:"~"}]}}};
  const c=mk(cs,{history,studyLog}); const lt=c.get("evo2LastTested('ellis')");
  ok("last tested = newest printNum (drill c/m/~, study c/m); shown and study ~ ignored", lt.a===95&&lt.b===90&&lt.c===undefined, lt);
  c.get("mastRebalanceKid('ellis')");
  // last tested: e 0 · b 90 · a 95 · d 98 (fallback 103−5) · c,f,g 100 (105−5). Share ceil(1.25×7÷5) = 2.
  // day 100: e, b · day 101: a · d rests until 103 · day 105: c, f · day 106: g
  const want={e:PN,b:PN,a:PN+1,d:PN+3,c:PN+5,f:PN+5,g:PN+6};
  ok("never-tested e first; by last tested; fallback next_due−interval; ties by id; nobody before its rest", Object.keys(want).every(id=>due(c,id)===want[id]), Object.keys(want).map(id=>id+":"+due(c,id)));
}
console.log("3. It can never pull a card early (Lucy, no pile-up)");
{ const cs=[]; for(let i=0;i<5;i++) cs.push(card("w"+i,"Spelling","weekly",PN+4+i));
  const history={"20990105":{printNum:PN-1,items:cs.map(x=>({id:x.id,result:"c"}))}};   // all tested yesterday → rested on PN+4
  const c=mk(cs,{history}); const r=c.get("mastRebalanceKid('ellis')");
  ok("tested yesterday: nothing before PN+4 (the old Even out put 2 of them on today)", c.get("masteryData.ellis").every(x=>x.next_due>=PN+4), c.get("masteryData.ellis").map(x=>x.next_due));
  ok("…dealt 2 a day from the day they're rested", JSON.stringify(perDay(c))===JSON.stringify({[PN+4]:2,[PN+5]:2,[PN+6]:1}), [perDay(c),r.changed]);
}
console.log("4. Start today vs tomorrow — read from the school-day number, not the UTC date key");
{ const cs=[card("x","G","every_other_day",PN-5),card("y","G","every_other_day",PN-5),card("z","G","every_other_day",PN-5)];
  const c0=mk(cs); const r0=c0.get("mastRebalanceKid('ellis')"); ok("nothing reviewed today → starts today (share 2: x,y today, z tomorrow)", r0.start===PN&&due(c0,"x")===PN&&due(c0,"y")===PN&&due(c0,"z")===PN+1, r0);
  const c1=mk(cs,{history:{"20990109":{printNum:PN,items:[]}}}); const r1=c1.get("mastRebalanceKid('ellis')"); ok("a drill on today's school day → starts tomorrow", r1.start===PN+1&&due(c1,"x")===PN+1&&due(c1,"z")===PN+2, r1);
  const c2=mk(cs,{studyLog:{german:{"20990109":{printNum:PN,items:[]}}}}); ok("a study sitting saved today → starts tomorrow", c2.get("mastRebalanceKid('ellis')").start===PN+1);
  const c3=mk(cs,{history:{[TK]:{printNum:PN-1,items:[]}}}); ok("a log under today's UTC key but yesterday's school day (after 8 PM) → still today", c3.get("mastRebalanceKid('ellis')").start===PN);
}
console.log("5. Only changed next_due written; others untouched");
{ const cs=[card("k1","G","weekly",PN),card("k2","G","weekly",PN+9),card("lrn","G","daily",PN,{status:"introduction"}),card("grd","G","graduated",PN+50),card("pk","G","weekly",PN+30,{status:"parked"}),card("nd","G","weekly",PN+30,{never:true}),card("ret","G","weekly",PN+30,{status:"retired"})];
  const history={"20990110":{printNum:PN-3,items:[{id:"k2",result:"c"}]}};   // k2 tested day 97 → rested on 102
  const c=mk(cs,{history}); const r=c.get("mastRebalanceKid('ellis')");
  const up=c.writes.find(w=>w[0]==="update");
  ok("one update to mastery/ellis, next_due keys only, only the card that moved (k2 → day 102)", up&&up[1]==="mastery/ellis"&&JSON.stringify(up[2])===JSON.stringify({"1/next_due":PN+2})&&r.changed===1, c.writes);
  ok("learning, graduated, parked, never-drill, retired untouched", ["lrn","grd","pk","nd","ret"].every(id=>due(c,id)===cs.find(x=>x.id===id).next_due)&&r.cards===2, r);
  ok("evened_at written on a real save, that key only", c.writes.some(w=>w[0]==="set"&&w[1]==="mastery/ellis_settings/evened_at"&&typeof w[2]==="number")&&c.writes.length===2, c.writes);
  const n=mk([card("k1","G","weekly",PN)]); n.get("mastRebalanceKid('ellis')"); ok("nothing to move → nothing written, no evened_at", n.writes.length===0);
}
console.log("6. Dry run + toasts");
{ const cs=[card("k1","G","weekly",PN+9),card("k2","G","weekly",PN+9)]; const history={"20990111":{printNum:PN-10,items:[{id:"k1",result:"c"},{id:"k2",result:"c"}]}};
  const d=mk(cs,{dry:true,history}); const r=d.get("mastRebalanceKid('ellis')"); ok("?dryrun=1: nothing written (no next_due, no evened_at), sent:false", d.writes.length===0&&r.sent===false&&r.changed===2, r);
  const d2=mk(cs,{dry:true,history}); d2.get("mastRebalanceNow()"); ok("dry-run toast never claims ✓", d2.toasts[0]==="Dry run — 2 cards would move, nothing saved", d2.toasts);
  const l=mk(cs,{history}); l.get("mastRebalanceNow()"); ok("live toast", l.toasts[0]==="Evened out 2 review cards ✓ · study sittings not started yet will rebuild", l.toasts);
  ok("the confirm says no card comes before its rest", /no card comes before it has rested its full time/.test(block));
}
console.log("7. Saved study sittings");
{ const ev=5000; const c=mk([],{settings:{evened_at:ev}});
  const stale=(o)=>c.get("evo2SittingStale('ellis',"+JSON.stringify(o)+")");
  const fresh={startTs:4000,hist:[],state:{cards:{a:{goods:0,first:null},b:{goods:0,first:null}}}};
  ok("untouched sitting started before evened_at → discarded", stale(fresh)===true);
  ok("graded (hist) → kept", stale(Object.assign({},fresh,{hist:[{k:"a"}]}))===false);
  ok("graded (a card's first set) → kept", stale(Object.assign({},fresh,{state:{cards:{a:{goods:0,first:"c"}}}}))===false);
  ok("graded (goods > 0) → kept", stale(Object.assign({},fresh,{state:{cards:{a:{goods:1,first:null}}}}))===false);
  ok("started after evened_at → kept", stale(Object.assign({},fresh,{startTs:6000}))===false);
  ok("no evened_at ever → kept", mk([]).get("evo2SittingStale('ellis',"+JSON.stringify(fresh)+")")===false);
  const r=src.slice(src.indexOf("function mstRestoreSitting("),src.indexOf("function mstClearPersist("));
  ok("mstRestoreSitting clears a stale sitting and returns false before restoring", /evo2SittingStale\(masteryKid,obj\)\)\{ mstClearPersist\(sid\); return false; \}[^\n]*\n\s*mstState=mstRestore/.test(r));
}
ok("no 🔀", src.indexOf("🔀")<0);
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
