/*
 * 🧠 REVIEWENGINE (her design 2026-10-24, PLAN_review_engine_2026-10-24.md). Every school morning, once per kid, review cards are
 * levelled per deck + rung: a card never comes before last tested + its rung's school days (rest gate); each day takes up to
 * ceil(1.25 × cards ÷ interval) rested cards, oldest tested first; the rest roll forward. Weekly = 5 school days, bi-weekly 10,
 * monthly 20. Once a day across devices (transaction on <kid>_settings/leveled_on = the LOCAL date); never in ?dryrun=1; the
 * ⚖️ Even out button uses the same planner; the new-card budget reads the whole ladder.   run: node test_review_engine.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,300)+")":"")); } };
const slice=(s,e)=>{ const a=src.indexOf(s), b=src.indexOf(e); if(a<0||b<0) throw new Error("missing "+s); return src.slice(a,b); };
const fn=name=>{ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); let d=0; for(let k=src.indexOf("{",i);k<src.length;k++){ if(src[k]==="{") d++; else if(src[k]==="}"&&--d===0) return src.slice(i,k+1); } throw new Error("unbalanced "+name); };
const RE=slice("// REVIEWENGINE_START","// REVIEWENGINE_END"), EVO=slice("// EVENOUT2_START","// EVENOUT2_END");
const TIER_LINE=src.match(/const MAST_TIER_INT=\{[^\n]*\};/)[0];
const CODE=TIER_LINE+"\n"+EVO+RE+fn("mastStampNextDue");

// A sandbox with a fake Firebase: `server` is the shared database, so two sandboxes on one server are two devices.
function mk(o){ o=o||{}; const server=o.server||{writes:[],data:{}}; const toasts=[];
  const md=o.md||{};
  const ref=p=>({
    update:v=>{ server.writes.push(["update",p,v]); return Promise.resolve(); },
    set:v=>{ server.writes.push(["set",p,v]); server.data[p]=v; return Promise.resolve(); },
    transaction:f=>{ const cur=server.data[p]; const nv=f(cur===undefined?null:cur); if(nv===undefined) return Promise.resolve({committed:false}); server.data[p]=nv; server.writes.push(["transaction",p,nv]); return Promise.resolve({committed:true}); }});
  const ctx={console:{log:()=>{},warn:()=>{}},Object,Array,String,Number,Math,JSON,Date,Map,Set,Infinity,Promise,
    masteryData:md, masteryKid:"ellis", ROSTER:o.roster||["ellis"],
    mastIsParked:i=>!!(i&&i.status==="parked"), mastIsNeverDrill:i=>!!(i&&i.never),
    mastGetPrintNum:()=>o.pn, mastSchoolDayNum:(kid,ds)=>(o.school||((k,d)=>d===o.today?o.pn:o.pn-1))(kid,ds),
    calToday:()=>o.today, db:o.noDb?null:{ref}, _dryRun:()=>!!o.dry, _haMastReady:o.mastReady!==false,
    HA_LS:{setItem:()=>{},getItem:()=>null}, gwShowToast:t=>toasts.push(t), confirm:()=>true, _mastRe:()=>{}, cap:s=>s[0].toUpperCase()+s.slice(1), toasts, server};
  vm.createContext(ctx); vm.runInContext(CODE,ctx); ctx.get=e=>vm.runInContext(e,ctx); return ctx; }
const card=(id,subject,tier,next_due,x)=>Object.assign({id,subject,tier,status:"active",next_due,prompt:id},x||{});
const tested=(day,ids)=>({printNum:day,items:ids.map(id=>({id,result:"c"}))});
const INT={every_other_day:2,every_third_day:3,weekly:5,bi_weekly:10,monthly:20};
const flush=()=>new Promise(r=>setImmediate(r));

(async()=>{
console.log("1. The new rung numbers (her words 2026-10-24: weekly 5 school days, bi-weekly 10, monthly 20)");
{ const c=mk({pn:100}); const T=c.get("MAST_TIER_INT");
  ok("weekly 5 · bi-weekly 10 · monthly 20", T.weekly===5&&T.bi_weekly===10&&T.monthly===20, T);
  ok("every other day 2 · every 3rd day 3 · daily 1 · learned 60 · graduated none — unchanged", T.every_other_day===2&&T.every_third_day===3&&T.daily===1&&T.learned===60&&T.graduated===null, T);
  // booking when answered (mastStampNextDue): a full rest, then at most min(interval/2, 7) later
  const span=tier=>{ let lo=1e9,hi=-1; for(let k=0;k<40;k++){ const items=[]; for(let j=0;j<k;j++) items.push({id:"o"+j,tier,next_due:100+j*3}); const it={id:"x",tier}; items.push(it); c.get("mastStampNextDue")(it,items,tier,100); lo=Math.min(lo,it.next_due); hi=Math.max(hi,it.next_due); } return [lo-100,hi-100]; };
  const w=span("weekly"), b=span("bi_weekly"), m=span("monthly");
  ok("booking a weekly card: 5–7 school days out (grace +2)", w[0]===5&&w[1]<=7, w);
  ok("bi-weekly: 10–15 (grace +5)", b[0]===10&&b[1]<=15, b);
  ok("monthly: 20–27 (grace capped at +7)", m[0]===20&&m[1]<=27, m);
  ok("the grace formula is kept: min(floor(iv/2),7)", /const cap=Math\.min\(Math\.floor\(iv\/2\),7\);/.test(fn("mastStampNextDue")));
  ok("the ladder settings list says school days", /weekly:"5 school days",bi_weekly:"10 school days",monthly:"20 school days"/.test(src));
}

console.log("2. Rest gate, even share per deck + rung, oldest first");
{ // German weekly: 20 cards tested on days 90..99 (2 a day); Math weekly 6 cards tested day 99; German EOD 4 tested day 99
  const H={}, cs=[]; for(let i=0;i<20;i++){ const d=90+Math.floor(i/2); cs.push(card("g"+String(i).padStart(2,"0"),"German","weekly",130)); (H["k"+d]=H["k"+d]||tested(d,[])).items.push({id:"g"+String(i).padStart(2,"0"),result:"c"}); }
  for(let i=0;i<6;i++) cs.push(card("m"+i,"Math","weekly",130)); for(let i=0;i<4;i++) cs.push(card("e"+i,"German","every_other_day",130));
  H.k99.items.push(...["m0","m1","m2","m3","m4","m5","e0","e1","e2","e3"].map(id=>({id,result:"m"})));
  const c=mk({pn:100,md:{ellis:cs,history:{ellis:H}}});
  const P=c.get("rePlan('ellis',masteryData.ellis,100,100)");
  const sh={}; P.shares.forEach(s=>{ sh[s.deck+"/"+s.tier]=s.share; });
  ok("share = ceil(1.25 × cards ÷ interval), per deck AND rung: German weekly 5, Math weekly 2, German EOD 3", sh["German/weekly"]===5&&sh["Math/weekly"]===2&&sh["German/every_other_day"]===3, sh);
  const day={}; P.plan.forEach(x=>{ day[x.it.id]=x.day; });
  const lt=c.get("evo2LastTested('ellis')");
  ok("rest gate: no card placed before last tested + its rung's days", P.plan.every(x=>x.day>=lt[x.it.id]+INT[x.it.tier]), P.plan.filter(x=>x.day<lt[x.it.id]+INT[x.it.tier]).map(x=>x.it.id));
  const g=cs.filter(x=>x.subject==="German"&&x.tier==="weekly").map(x=>x.id).sort();
  ok("oldest tested first: German weekly days never go backwards in test order", g.every((id,i)=>i===0||day[id]>=day[g[i-1]]), g.map(id=>day[id]));
  const per={}; P.plan.filter(x=>x.it.subject==="German"&&x.it.tier==="weekly").forEach(x=>{ per[x.day]=(per[x.day]||0)+1; });
  ok("German weekly: tested 90–99 → 12 rested today; the share of 5 a day, the later ones as they rest: 5,5,5,3,2", JSON.stringify(per)===JSON.stringify({100:5,101:5,102:5,103:3,104:2}), per);
  ok("Math weekly tested on 99 → nothing until 104, then 2, 2, 2", day.m0===104&&day.m1===104&&day.m2===105&&day.m5===106, ["m0","m1","m2","m3","m4","m5"].map(id=>day[id]));
  ok("German EOD tested on 99 → 101: 3, then 102: 1", day.e0===101&&day.e1===101&&day.e2===101&&day.e3===102, ["e0","e1","e2","e3"].map(id=>day[id]));
}
console.log("3. A backlog drains at +25%, nobody forced");
{ const cs=[], H={k60:tested(60,[])}; for(let i=0;i<50;i++){ const id="w"+String(i).padStart(2,"0"); cs.push(card(id,"Spelling","weekly",70)); H.k60.items.push({id,result:"c"}); }
  const c=mk({pn:100,md:{ellis:cs,history:{ellis:H}}}); const P=c.get("rePlan('ellis',masteryData.ellis,100,100)");
  const per={}; P.plan.forEach(x=>{ per[x.day]=(per[x.day]||0)+1; });
  ok("50 overdue weekly cards: 13 a day (10 + 25%) → gone in 4 days, not 50 on one day", JSON.stringify(per)===JSON.stringify({100:13,101:13,102:13,103:11}), per);
  ok("…and they're placed oldest-first by id when tied", P.plan[0].it.id==="w00"&&P.plan[49].it.id==="w49");
  // grace gives priority, not force: 8 old cards + 8 just-rested ones, share 4 → the old ones go first, the rest wait (no day over the share)
  const cs2=[], H2={k80:tested(80,[]),k95:tested(95,[])}; for(let i=0;i<8;i++){ cs2.push(card("old"+i,"S","weekly",85)); H2.k80.items.push({id:"old"+i,result:"c"}); cs2.push(card("new"+i,"S","weekly",100)); H2.k95.items.push({id:"new"+i,result:"c"}); }
  const P2=mk({pn:100,md:{ellis:cs2,history:{ellis:H2}}}).get("rePlan('ellis',masteryData.ellis,100,100)");
  const d2={}; P2.plan.forEach(x=>{ d2[x.it.id]=x.day; }); const per2={}; P2.plan.forEach(x=>{ per2[x.day]=(per2[x.day]||0)+1; });
  ok("16 cards, share 4: the 8 long-waiting go on days 100–101, the 8 just-rested after — never more than 4 a day", Object.values(per2).every(n=>n<=4)&&[0,1,2,3,4,5,6,7].every(i=>d2["old"+i]<=101&&d2["new"+i]>=102), per2);
}
console.log("4. Random decks: the gate and the share always hold");
{ let viol=0, over=0, lost=0; let seed=7; const rnd=()=>{ seed=(seed*16807)%2147483647; return seed/2147483647; };
  for(let run=0;run<200;run++){
    const pn=150+Math.floor(rnd()*20), cs=[], H={}, tiers=Object.keys(INT);
    const n=1+Math.floor(rnd()*80);
    for(let i=0;i<n;i++){ const tier=tiers[Math.floor(rnd()*tiers.length)], deck="D"+Math.floor(rnd()*3), id="c"+i;
      const r=rnd(); let nd=pn-15+Math.floor(rnd()*40);
      if(r<0.7){ const d=pn-30+Math.floor(rnd()*30); (H["k"+d]=H["k"+d]||tested(d,[])).items.push({id,result:rnd()<.8?"c":"m"}); }
      else if(r<0.8) nd=null;
      cs.push(card(id,deck,tier,nd)); }
    const c=mk({pn,md:{ellis:cs,history:{ellis:H}}}); const P=c.get("rePlan('ellis',masteryData.ellis,"+pn+","+pn+")"), lt=c.get("evo2LastTested('ellis')");
    const q={}; P.shares.forEach(s=>{ q[s.deck+"/"+s.tier]=s.share; }); const cnt={};
    P.plan.forEach(x=>{ const it=x.it, iv=INT[it.tier], l=lt[it.id]!=null?lt[it.id]:(typeof it.next_due==="number"?it.next_due-iv:0);
      if(x.day<l+iv||x.day<pn) viol++; const k=it.subject+"/"+it.tier+"/"+x.day; cnt[k]=(cnt[k]||0)+1; if(cnt[k]>q[it.subject+"/"+it.tier]) over++; });
    if(P.plan.length!==n) lost++;
  }
  ok("200 random decks: no card ever before its rest or before today", viol===0, viol);
  ok("…no deck+rung ever over its share on a day", over===0, over);
  ok("…every scheduled card gets a day", lost===0, lost);
}
console.log("5. The morning run: once per kid per LOCAL school day, across devices");
{ const base=()=>({ellis:[card("a","G","weekly",120),card("b","G","weekly",120)],history:{ellis:{k90:tested(90,["a","b"])}}});
  const server={writes:[],data:{}};
  const A=mk({pn:100,today:"2026-10-26",md:base(),server}), B=mk({pn:100,today:"2026-10-26",md:base(),server});
  A.get("reLoaded('mastery')"); A.get("reLoaded('calendar')"); await flush();
  ok("waits until mastery, calendar AND pace have arrived from Firebase", server.writes.length===0, server.writes);
  A.get("reLoaded('pace')"); B.get("reLoaded('mastery');reLoaded('calendar');reLoaded('pace')"); await flush(); await flush();
  const tx=server.writes.filter(w=>w[0]==="transaction"), up=server.writes.filter(w=>w[0]==="update");
  ok("two devices opening together: one wins leveled_on, one levels", tx.length===1&&up.length===1&&server.data["mastery/ellis_settings/leveled_on"]==="2026-10-26", server.writes);
  ok("the write is next_due only, one multi-path update on mastery/ellis (tested 90, rested since 95; share ceil(1.25×2÷5) = 1: a today, b tomorrow)", up[0]&&up[0][1]==="mastery/ellis"&&JSON.stringify(up[0][2])===JSON.stringify({"0/next_due":100,"1/next_due":101}), up);
  ok("…plus evened_at, so untouched study sittings saved earlier rebuild", server.writes.some(w=>w[0]==="set"&&w[1]==="mastery/ellis_settings/evened_at"));
  const n=server.writes.length; A.get("reMorningAll()"); B.get("reMorningAll()"); await flush();
  ok("later in the day (listener fires again): nothing more", server.writes.length===n, server.writes.slice(n));
  const C=mk({pn:100,today:"2026-10-26",md:Object.assign(base(),{ellis_settings:{leveled_on:"2026-10-26"}}),server:{writes:[],data:{}}});
  C.get("reLoaded('mastery');reLoaded('calendar');reLoaded('pace')"); await flush();
  ok("a device that already sees today's leveled_on doesn't even try", C.server.writes.length===0);
  const D=mk({pn:101,today:"2026-10-27",md:Object.assign(base(),{ellis_settings:{leveled_on:"2026-10-26"}})});
  D.get("reLoaded('mastery');reLoaded('calendar');reLoaded('pace')"); await flush();
  ok("the next school day levels again", D.server.data["mastery/ellis_settings/leveled_on"]==="2026-10-27");
  const W=mk({pn:100,today:"2026-10-31",school:()=>100,md:base()});   // Saturday: the school-day number didn't move
  W.get("reLoaded('mastery');reLoaded('calendar');reLoaded('pace')"); await flush();
  ok("a weekend / holiday / day off (school-day number didn't move): no leveling, no leveled_on", W.server.writes.length===0, W.server.writes);
  ok("leveled_on is the family's local date (calToday), never the UTC key", /leveled_on"\)\.transaction\(cur=>cur===today\?undefined:today\)/.test(RE)&&/const today=calToday\(\);/.test(RE)&&RE.indexOf("toISOString")<0);
  const R=mk({pn:100,today:"2026-10-26",md:{ellis:[card("a","G","weekly",120)],history:{ellis:{k90:tested(90,["a"]),k100:tested(100,[])}}}});
  R.get("reLoaded('mastery');reLoaded('calendar');reLoaded('pace')"); await flush();
  ok("already reviewed on today's school day → starts tomorrow", JSON.stringify(R.server.writes.find(w=>w[0]==="update")[2])===JSON.stringify({"0/next_due":101}), R.server.writes);
  const E=mk({pn:100,today:"2026-10-26",md:{ellis:[card("a","G","weekly",100)],history:{ellis:{k90:tested(90,["a"])}}}});
  E.get("reLoaded('mastery');reLoaded('calendar');reLoaded('pace')"); await flush();
  ok("nothing moves → only leveled_on is written", E.server.writes.length===1&&E.server.writes[0][0]==="transaction", E.server.writes);
}
console.log("6. Dry run and not-ready devices write nothing");
{ const md=()=>({ellis:[card("a","G","weekly",120),card("b","G","weekly",120)],history:{ellis:{k90:tested(90,["a","b"])}}});
  const d=mk({pn:100,today:"2026-10-26",dry:true,md:md()}); d.get("reLoaded('mastery');reLoaded('calendar');reLoaded('pace')"); await flush();
  ok("?dryrun=1: the morning run never runs — no leveled_on, no next_due, cards untouched", d.server.writes.length===0&&d.get("masteryData.ellis[0].next_due")===120, d.server.writes);
  const g=mk({pn:100,today:"2026-10-26",mastReady:false,md:md()}); g.get("reLoaded('mastery');reLoaded('calendar');reLoaded('pace')"); await flush();
  ok("before Firebase's mastery data is in (MASTGATE): nothing", g.server.writes.length===0);
  const e=mk({pn:100,md:md(),dry:true}); const r=e.get("mastRebalanceKid('ellis')");
  ok("⚖️ Even out in ?dryrun=1: sent:false, nothing written", r.sent===false&&r.changed===2&&e.server.writes.length===0, r);
}
console.log("7. ⚖️ Even out = the same rules");
{ const md=()=>({ellis:[card("p","G","weekly",100),card("q","G","weekly",100),card("r","G","weekly",100),card("s","G","weekly",104)],history:{ellis:{k96:tested(96,["p","q","r"]),k99:tested(99,["s"])}}});
  const a=mk({pn:100,md:md()}); a.get("mastRebalanceKid('ellis')");
  const b=mk({pn:100,md:md()}); b.get("reApply('ellis',100,100)");
  ok("mastRebalanceKid gives exactly the engine's dates", JSON.stringify(a.get("masteryData.ellis.map(x=>x.next_due)"))===JSON.stringify(b.get("masteryData.ellis.map(x=>x.next_due)")), a.get("masteryData.ellis.map(x=>x.next_due)"));
  ok("…and never pulls a card early: tested 96 → not before 101; s tested 99 → not before 104", a.get("masteryData.ellis.every(x=>x.next_due>=(x.id==='s'?104:101))"), a.get("masteryData.ellis.map(x=>x.next_due)"));
  ok("wired: mastRebalanceKid calls reApply (no second dealer left)", /function mastRebalanceKid\(kid\)\{\s*const pn=mastGetPrintNum\(kid\);\s*return reApply\(kid,pn,reReviewedOn\(kid,pn\)\?pn\+1:pn\);\s*\}/.test(EVO)&&EVO.indexOf("Math.floor(n/iv)")<0);
}
console.log("8. A replay: 12 school weeks, drilling 2 of 5 days, real engine + real booking");
{ // 120 cards across 3 decks and 4 rungs; on drill days every due card is answered (90% right → climbs, a miss → back to every
  // other day) and re-booked by the real mastStampNextDue. Same dice with and without the morning leveling.
  const replay=level=>{
    const lad=["every_other_day","weekly","bi_weekly","monthly"]; let seed=11; const rnd=()=>{ seed=(seed*16807)%2147483647; return seed/2147483647; };
    const cs=[], H={}; for(let i=0;i<120;i++){ const tier=lad[i%4], id="c"+String(i).padStart(3,"0"), d=80+Math.floor(rnd()*20); cs.push(card(id,"D"+(i%3),tier,null)); (H["h"+d]=H["h"+d]||tested(d,[])).items.push({id,result:"c"}); }
    const c=mk({pn:100,md:{ellis:cs,history:{ellis:H}}}); const stamp=c.get("mastStampNextDue"), items=c.get("masteryData.ellis");
    c.get("rePlan('ellis',masteryData.ellis,100,100)").plan.forEach(x=>{ x.it.next_due=x.day; });   // both start from one levelled day
    let early=0, n=0; const piles=[];
    for(let d=100;d<160;d++){
      if(level) c.get("rePlan('ellis',masteryData.ellis,"+d+","+d+")").plan.forEach(x=>{ x.it.next_due=x.day; });
      const drill=rnd()<0.4, dice=items.map(()=>rnd()); if(!drill) continue;
      const lt=c.get("evo2LastTested('ellis')"), due=items.filter(x=>x.tier!=="graduated"&&x.next_due<=d), log=tested(d,[]);
      due.forEach(x=>{ n++; if(d<lt[x.id]+INT[x.tier]) early++; const right=dice[items.indexOf(x)]<0.9; log.items.push({id:x.id,result:right?"c":"m"});
        const k=lad.indexOf(x.tier); x.tier=right?(k===3?"graduated":lad[k+1]):"every_other_day"; if(x.tier!=="graduated") stamp(x,items,x.tier,d); else delete x.next_due; });
      c.get("masteryData.history.ellis")["h"+d]=log; piles.push(due.length);
    }
    return {early,n,piles,max:Math.max(...piles),avg:n/piles.length};
  };
  const L=replay(true), B=replay(false);
  ok("levelled: 0 reviews before their rest ("+L.n+" reviews over "+L.piles.length+" drills)", L.early===0&&L.n>0, [L.early,L.n]);
  ok("levelled biggest drill "+L.max+" ≤ booking alone "+B.max+" (avg "+L.avg.toFixed(1)+" vs "+B.avg.toFixed(1)+")", L.max<=B.max, [L.piles,B.piles]);
  ok("about the same total work (within 15%): "+L.n+" vs "+B.n, Math.abs(L.n-B.n)<=0.15*B.n, [L.n,B.n]);
}
console.log("9. Wiring + the budget");
{ ok("the mastery listener starts it", /reLoaded\("mastery"\)/.test(src.slice(src.indexOf('db.ref("mastery").on("value"'),src.indexOf('db.ref("config/anthropic_key")'))));
  ok("the calendar and pace listeners report in", /db\.ref\("calendar"\)\.on\("value"[\s\S]{0,900}reLoaded\("calendar"\)/.test(src)&&/db\.ref\("pace"\)\.on\("value"[\s\S]{0,400}reLoaded\("pace"\)/.test(src));
  ok("dayRollCheck re-runs it for a device left open past midnight", /reMorningAll\(\)/.test(fn("dayRollCheck")));
  const nb=fn("nbLoad"); ok("the new-card budget reads the whole ladder (1 ÷ interval per card), not today's due", /n\+=1\/iv/.test(nb)&&nb.indexOf("mastIsDue")<0);
  ok("60 / 90 thresholds kept", /const NB_LOAD_MID=60, NB_LOAD_HIGH=90/.test(src));
  ok("retrieval re-check days (RETR_DEFAULTS) untouched — a separate sprint system", /recheck_ladder:\[7,14,28\]/.test(src.slice(src.indexOf("RETR_DEFAULTS"),src.indexOf("RETR_DEFAULTS")+3000)));
  ok("no 🔀", src.indexOf("🔀")<0);
}
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
})();
