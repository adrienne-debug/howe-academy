/*
 * EVENOUT2 (her design 2026-10-23). ⚖️ Even out now groups review cards by deck + rung, orders each group by last tested (oldest
 * first; fallback next_due − interval, then 0; ties by id) and deals it evenly over the rung's days from the start day (tomorrow if
 * the kid reviewed today, else today), remainder rotating across groups. Writes only changed next_due + settings/evened_at; a study
 * sitting saved before evened_at with no grades rebuilds.  run: node test_evenout_v2.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,300)+")":"")); } };
const a=src.indexOf("// EVENOUT2_START"), b=src.indexOf("// EVENOUT2_END");
if(a<0||b<0) { console.log("FAIL- EVENOUT2 block missing"); process.exit(1); }
const block=src.slice(a,b);
const TK=new Date().toISOString().slice(0,10).replace(/-/g,"");
const PN=100;
function mk(cards,o){ o=o||{}; const writes=[], toasts=[];
  const md={ellis:JSON.parse(JSON.stringify(cards)),history:o.history?{ellis:o.history}:undefined,studyLog:o.studyLog?{ellis:o.studyLog}:undefined};
  if(o.settings) md.ellis_settings=o.settings;
  const ctx={console,Object,Array,String,Number,Math,JSON,Date,Map,Set,Infinity,masteryData:md,masteryKid:"ellis",
    MAST_TIER_INT:{daily:1,every_other_day:2,every_third_day:3,weekly:7,bi_weekly:14,monthly:28,learned:60,graduated:null},
    mastIsParked:i=>!!(i&&i.status==="parked"), mastIsNeverDrill:i=>!!(i&&i.never), mastGetPrintNum:()=>PN,
    db:{ref:p=>({update:v=>writes.push(["update",p,v]),set:v=>writes.push(["set",p,v])})}, _dryRun:()=>!!o.dry,
    HA_LS:{setItem:()=>{},getItem:()=>null}, gwShowToast:t=>toasts.push(t), confirm:()=>true, _mastRe:()=>{}, cap:s=>s[0].toUpperCase()+s.slice(1), writes, toasts};
  vm.createContext(ctx); vm.runInContext(block,ctx); ctx.get=e=>vm.runInContext(e,ctx); return ctx; }
const card=(id,subject,tier,next_due,x)=>Object.assign({id,subject,tier,status:"active",next_due,prompt:id},x||{});
const due=(c,id)=>c.get("masteryData.ellis").find(x=>x.id===id).next_due;
const perDay=(c,f)=>{ const m={}; c.get("masteryData.ellis").filter(f||(()=>true)).forEach(x=>{ m[x.next_due]=(m[x.next_due]||0)+1; }); return m; };

console.log("1. Grouping by deck + rung, even quotas");
{ const cs=[]; for(let i=0;i<14;i++) cs.push(card("g"+String(i).padStart(2,"0"),"German","weekly",PN)); for(let i=0;i<7;i++) cs.push(card("m"+i,"Math","weekly",PN)); for(let i=0;i<4;i++) cs.push(card("e"+i,"German","every_other_day",PN));
  const c=mk(cs); c.get("mastRebalanceKid('ellis')");
  const g=perDay(c,x=>x.subject==="German"&&x.tier==="weekly"), m=perDay(c,x=>x.subject==="Math"), e=perDay(c,x=>x.tier==="every_other_day");
  ok("German weekly 14 → 2 a day over 7 days from today", Object.keys(g).length===7&&Object.values(g).every(v=>v===2)&&g[PN]===2&&g[PN+6]===2, g);
  ok("Math weekly 7 → 1 a day (its own group)", Object.keys(m).length===7&&Object.values(m).every(v=>v===1), m);
  ok("German every-other-day 4 → 2 a day over 2 days (separate rung)", e[PN]===2&&e[PN+1]===2, e);
}
console.log("2. Oldest tested first, and the fallback order");
{ const cs=[card("a","G","weekly",PN+5),card("b","G","weekly",PN+5),card("c","G","weekly",PN+5),card("d","G","weekly",PN+3),card("e","G","weekly",null),card("f","G","weekly",PN+5),card("g","G","weekly",PN+5)];
  // a tested on day 95 (drill), b on 90 (study c), c drill "shown" only (doesn't count) + study "~" (doesn't count for study)
  const history={"20990101":{printNum:95,items:[{id:"a",result:"c"},{id:"c",result:"shown"}]},"20990102":{printNum:80,items:[{id:"a",result:"m"}]}};
  const studyLog={german:{"20990103":{printNum:90,items:[{id:"b",result:"c"},{id:"c",result:"~"}]}}};
  const c=mk(cs,{history,studyLog}); const lt=c.get("evo2LastTested('ellis')");
  ok("last tested = newest printNum (drill c/m/~, study c/m); shown and study ~ ignored", lt.a===95&&lt.b===90&&lt.c===undefined, lt);
  c.get("mastRebalanceKid('ellis')");
  // fallbacks: c,f,g = 98; d = 96; e = 0 → order e(0), b(90), a(95), d(96), c(98), f(98), g(98)
  const order=["e","b","a","d","c","f","g"]; ok("never-tested e → 0 first; tested by date; fallback next_due−interval; ties by id", order.every((id,i)=>due(c,id)===PN+i), order.map(id=>due(c,id)));
}
console.log("3. Remainder rotates across groups");
{ const cs=[]; ["A","B","C"].forEach(s=>{ for(let i=0;i<9;i++) cs.push(card(s+i,s,"weekly",PN)); });   // 9 = 1 a day + 2 extra
  const c=mk(cs); c.get("mastRebalanceKid('ellis')"); const t=perDay(c);
  ok("3 groups × 2 extras land on 6 different days (not all on day one)", t[PN]===4&&t[PN+1]===4&&t[PN+2]===4&&t[PN+3]===4&&t[PN+4]===4&&t[PN+5]===4&&t[PN+6]===3, t);
  const a=perDay(c,x=>x.subject==="A"), bb=perDay(c,x=>x.subject==="B");
  ok("each group still floor+1 on its extra days: A extras days 0,1; B days 2,3", a[PN]===2&&a[PN+1]===2&&a[PN+2]===1&&bb[PN+2]===2&&bb[PN+3]===2&&bb[PN]===1, [a,bb]);
}
console.log("4. Start today vs tomorrow");
{ const cs=[card("x","G","every_other_day",PN-5),card("y","G","every_other_day",PN-5)];
  const c0=mk(cs); const r0=c0.get("mastRebalanceKid('ellis')"); ok("nothing reviewed today → starts today", r0.start===PN&&due(c0,"x")===PN&&due(c0,"y")===PN+1, r0);
  const c1=mk(cs,{history:{[TK]:{printNum:PN,items:[]}}}); const r1=c1.get("mastRebalanceKid('ellis')"); ok("a drill today → starts tomorrow", r1.start===PN+1&&due(c1,"x")===PN+1&&due(c1,"y")===PN+2, r1);
  const c2=mk(cs,{studyLog:{german:{[TK]:{printNum:PN,items:[]}}}}); ok("a study sitting saved today → starts tomorrow", c2.get("mastRebalanceKid('ellis')").start===PN+1);
}
console.log("5. Only changed next_due written; others untouched");
{ const cs=[card("k1","G","weekly",PN),card("k2","G","weekly",PN+9),card("lrn","G","daily",PN,{status:"introduction"}),card("grd","G","graduated",PN+50),card("pk","G","weekly",PN+30,{status:"parked"}),card("nd","G","weekly",PN+30,{never:true}),card("ret","G","weekly",PN+30,{status:"retired"})];
  const c=mk(cs); const r=c.get("mastRebalanceKid('ellis')");
  const up=c.writes.find(w=>w[0]==="update");
  ok("one update to mastery/ellis, next_due keys only, only the card that moved (k2 → day 1)", up&&up[1]==="mastery/ellis"&&JSON.stringify(up[2])===JSON.stringify({"1/next_due":PN+1})&&r.changed===1, c.writes);
  ok("learning, graduated, parked, never-drill, retired untouched", ["lrn","grd","pk","nd","ret"].every((id,i)=>due(c,id)===cs.find(x=>x.id===id).next_due)&&r.cards===2, r);
  ok("evened_at written on a real save, that key only", c.writes.some(w=>w[0]==="set"&&w[1]==="mastery/ellis_settings/evened_at"&&typeof w[2]==="number")&&c.writes.length===2, c.writes);
  const n=mk([card("k1","G","weekly",PN)]); n.get("mastRebalanceKid('ellis')"); ok("nothing to move → nothing written, no evened_at", n.writes.length===0);
}
console.log("6. Dry run + toasts");
{ const cs=[card("k1","G","weekly",PN+3),card("k2","G","weekly",PN+3)];
  const d=mk(cs,{dry:true}); const r=d.get("mastRebalanceKid('ellis')"); ok("?dryrun=1: nothing written (no next_due, no evened_at), sent:false", d.writes.length===0&&r.sent===false&&r.changed===2);
  const d2=mk(cs,{dry:true}); d2.get("mastRebalanceNow()"); ok("dry-run toast never claims ✓", d2.toasts[0]==="Dry run — 2 cards would move, nothing saved", d2.toasts);
  const l=mk(cs); l.get("mastRebalanceNow()"); ok("live toast", l.toasts[0]==="Evened out 2 review cards ✓ · study sittings not started yet will rebuild", l.toasts);
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
