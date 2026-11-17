/*
 * HOUSEENG — Household by room, step 3 (DESIGN_household_rooms_2026-11-15 §4.1–4.3, §9 row 3): the hand-out engine in house.js,
 * one pure function (table, day, people, overrides) → plan. Replays 8 weeks on a made-up family with a table of realistic size
 * (about 190 house chores across daily / on-its-days / 4-week cycle / every 7–180 days, health and animal rows, three rotation
 * groups, who-can rows, levels 1–3) and proves: no due chore is lost or handed out twice; nobody is over their limit on any day;
 * health and animal rows are always on their owner's list; rotation gives the same person on the same date as the real
 * rtApplyRot (sliced from index.html) for 60 days; the order rule when a day is tight; overflow and carry; a never-done every-N
 * chore first comes due N days after switch-on; held one-time jobs, projects, retired and above-level rows are never handed out;
 * the function is pure. Made-up family only (Ava, Ben, Cal, Dot; Mom, Dad).
 *   run: node test_house_engine.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,500)+")":"")); } };
const HJS=fs.readFileSync(path.join(__dirname,"house.js"),"utf8"), SRC=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
const block=(s,name)=>{ const a=s.indexOf("// "+name+"_START"), b=s.indexOf("// "+name+"_END"); if(a<0||b<a) throw new Error("missing "+name); return s.slice(a,s.indexOf("\n",b)); };
const fnOf=s=>name=>{ const i=s.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); let d=0; for(let k=s.indexOf("{",i);k<s.length;k++){ if(s[k]==="{") d++; else if(s[k]==="}"&&--d===0) return s.slice(i,k+1); } throw new Error("unbalanced "+name); };
const fn=fnOf(SRC), lineOf=st=>{ const i=SRC.indexOf(st); if(i<0) throw new Error("missing "+st); return SRC.slice(i,SRC.indexOf("\n",i)); };
const ENG=block(SRC,"HOUSEENG");   // step 4 moved the engine into index.html, unchanged (any device builds the day)
// The engine runs in a bare world: no window, no db, no document, no app globals.
const bare={}; vm.createContext(bare); vm.runInContext(ENG+"\nthis.HouseEng=HouseEng;",bare); const E=bare.HouseEng;
const dnum=E.dnum, isoOf=E.isoOf, dowOf=s=>(new Date(s+"T12:00:00Z").getUTCDay()+6)%7;
const clone=o=>JSON.parse(JSON.stringify(o));

// ── the made-up table ──────────────────────────────────────────────────────────────────────────────────────────────────
let seed=20261116; const rnd=()=>{ seed=(seed+0x6D2B79F5)|0; let t=seed; t=Math.imul(t^t>>>15,t|1); t^=t+Math.imul(t^t>>>7,t|61); return ((t^t>>>14)>>>0)/4294967296; };
const pick=a=>a[Math.floor(rnd()*a.length)];
const KIDS=["ava","ben","cal","dot"], ALL=KIDS.concat(["mom","dad"]), SLOTS=["morning","afternoon","chores","evening"];
const START="2026-11-16", S0=dnum(START), ON=START;   // a Monday; the switch went on that day
const MIN_DEF={health:2,animals:3,pickup:5,cleaning:10};
const J={}; let nId=0;
const add=(o)=>{ const id=o.id||("j"+(nId++)); delete o.id; J[id]=Object.assign({status:"active",src:{kind:"new"},pts:5,order:nId},o); if(!ALL.includes(J[id].who)&&J[id].who!=="grab") throw new Error(id); if(J[id].slot===undefined) J[id].slot=KIDS.includes(J[id].who)?pick(["chores","afternoon"]):""; return id; };
const house=(o)=>add(Object.assign({area:pick(["cleaning","cleaning","pickup"]),who:pick(ALL),minutes:pick([2,3,5,5,5,10,10,15,20]),level:pick([1,1,1,2,3])},o));
for(let i=0;i<27;i++) house({label:"Daily chore "+i,cad:"daily",minutes:pick([2,3,5])});
for(let i=0;i<71;i++){ const ds=[...new Set([Math.floor(rnd()*7),...(rnd()<0.25?[Math.floor(rnd()*7)]:[])])].sort(); house({label:"Weekday chore "+i,cad:rnd()<0.08?pick(["sat","sun"]):"wk:"+ds.join(",")}); }
for(let i=0;i<21;i++) house({label:"Cycle chore "+i,cad:"wk:"+Math.floor(rnd()*7),cycW:1+(i%4),cycN:4,cycStart:isoOf(S0-7*(i%3)),minutes:pick([10,15,20,30])});
const NS=[7,10,14,14,21,28,28,30,42,45,60,60,90,90,120,180];
for(let i=0;i<27;i++){ const N=NS[i%NS.length]; const o={label:"Every "+N+" chore "+i,cad:(N===14&&i%2?"2w":N+"d"),minutes:pick([10,15,20,30])}; if(i%3===0) o.lastDone=isoOf(S0-Math.floor(rnd()*N*1.5)); house(o); }
for(let i=0;i<8;i++) house({label:"As needed "+i,cad:pick(["asneeded","none"])});
const PILE=[]; for(let i=0;i<30;i++) PILE.push(house({label:"One-time job "+i,cad:"once",hold:true}));   // the one-time pile (held)
// grown-ups' and kids' rows with who-can filled in (a few, as on the real table), and one long chore nobody has room for
["j3","j10","j31","j44","j60","j99","j110","j120","j125"].forEach((id,i)=>{ if(J[id]) J[id].can=[J[id].who].concat(i%2?["mom","dad"]:["ava","ben"]).filter((w,k,a)=>a.indexOf(w)===k); });
const LONG=house({id:"long_attic",label:"Sort the attic",cad:"wk:0",minutes:200,who:"mom",level:1,area:"cleaning"});
// health + animal rows (never count against a limit)
for(let i=0;i<40;i++) add({label:"Health "+i,area:"health",who:pick(ALL),cad:rnd()<0.8?"daily":"wk:"+Math.floor(rnd()*7),minutes:2,slot:undefined});
for(let i=0;i<30;i++) add({label:"Animals "+i,area:"animals",who:pick(ALL),cad:rnd()<0.7?"daily":"3d",minutes:3,slot:undefined});
// never handed out
const NEVER=[
  add({id:"once_shelf",label:"Fix the shelf",area:"cleaning",who:"ben",cad:"once",hold:true}),
  add({id:"once_gutter",label:"Clear the gutter",area:"cleaning",who:"dad",cad:"once",hold:true}),
  add({id:"once_sent",label:"Wash the van",area:"cleaning",who:"ava",cad:"once"}),
  add({id:"proj_deck",label:"Stain the deck",area:"cleaning",who:"dad",cad:"daily",layer:"project"}),
  add({id:"proj_closet",label:"Closet makeover",area:"cleaning",who:"mom",cad:"wk:2",layer:"project"}),
  add({id:"ret_a",label:"Old daily",area:"cleaning",who:"ava",cad:"daily",status:"retired",verdict:"retire"}),
  add({id:"ret_b",label:"Old weekly",area:"pickup",who:"cal",cad:"wk:3",status:"retired"}),
  add({id:"lvl3_cal",label:"Deep scrub tub",area:"cleaning",who:"cal",cad:"daily",level:3}),
  add({id:"lvl2_dot",label:"Wipe baseboards",area:"cleaning",who:"dot",cad:"wk:1",level:2}),
  add({id:"held_daily",label:"Held daily",area:"cleaning",who:"ben",cad:"daily",hold:true}),
  add({id:"grab_dust",label:"Dust the shelves",area:"cleaning",who:"grab",cad:"daily",src:{kind:"grab",i:0}}),
];
// three rotation groups (8 rows, two of them "Free day" placeholders)
const ROT=[
  add({id:"r_trash_a",label:"Take out the trash",area:"pickup",who:"ava",slot:"chores",cad:"daily",rot:"trash",order:-3,minutes:5}),
  add({id:"r_trash_b",label:"Recycling to the curb",area:"pickup",who:"ben",slot:"chores",cad:"daily",rot:"trash",order:-3,minutes:5}),
  add({id:"r_trash_c",label:"Free day",area:"pickup",who:"cal",slot:"chores",cad:"daily",rot:"trash",free:true,order:-3}),
  add({id:"r_water_b",label:"Fill the turtle water",area:"animals",who:"ben",slot:"morning",cad:"daily",rot:"water",order:-2,minutes:3}),
  add({id:"r_water_d",label:"Free day",area:"animals",who:"dot",slot:"morning",cad:"daily",rot:"water",free:true,order:-2}),
  add({id:"r_pick_a",label:"Pickup the den",area:"pickup",who:"ava",slot:"afternoon",cad:"daily",rot:"pickup",order:-1,minutes:5}),
  add({id:"r_pick_b",label:"Pickup the porch",area:"pickup",who:"ben",slot:"afternoon",cad:"wk:0,1,2,3,4",rot:"pickup",order:-1,minutes:5}),
  add({id:"r_pick_c",label:"Pickup the playroom",area:"pickup",who:"cal",slot:"afternoon",cad:"daily",rot:"pickup",order:-1,minutes:5,level:1}),
];
const ROTP={trash:"daily",water:"weekly",pickup:"2d"};
const TABLE={jobs:J};
const LEVEL={ava:3,ben:2,cal:1,dot:1,mom:2,dad:1};
const PEOPLE={ava:{school:30,weekend:60,level:3},ben:{school:25,weekend:50,level:2},cal:{school:15,weekend:30,level:1},dot:{school:8,weekend:15,level:1},mom:{school:20,weekend:40,level:2},dad:{school:15,weekend:120,level:1}};
const OV={kids:KIDS,slots:SLOTS,rotPeriod:ROTP,on:ON,minDefault:MIN_DEF};
const H=Object.keys(J).filter(id=>["pickup","cleaning"].includes(J[id].area)&&J[id].status!=="retired"&&J[id].cad!=="once"&&J[id].layer!=="project"&&J[id].who!=="grab");
const HALL=Object.keys(J).filter(id=>["pickup","cleaning"].includes(J[id].area)&&J[id].status!=="retired"&&J[id].who!=="grab");
console.log("\n── the made-up table ──");
const kinds={daily:0,set:0,cycle:0,every:0,other:0}; H.forEach(id=>{ const c=J[id].cad; if(J[id].cycW) kinds.cycle++; else if(c==="daily") kinds.daily++; else if(/^wk:|^sat$|^sun$/.test(c)) kinds.set++; else if(/^\d+d$|^2w$/.test(c)) kinds.every++; else kinds.other++; });
kinds.once=HALL.length-H.length;
ok("about 190 house chores ("+HALL.length+": "+JSON.stringify(kinds)+") plus "+Object.keys(J).filter(id=>["health","animals"].includes(J[id].area)).length+" health / animal rows", HALL.length>=180&&HALL.length<=210&&kinds.every>=27&&kinds.cycle===21&&kinds.daily>=27);
ok("every-N chores span 7 to 180 days", Math.min(...H.filter(id=>/^\d+d$/.test(J[id].cad)).map(id=>parseInt(J[id].cad)))===7&&Math.max(...H.filter(id=>/^\d+d$/.test(J[id].cad)).map(id=>parseInt(J[id].cad)))===180);

// ── purity ────────────────────────────────────────────────────────────────────────────────────────────────────────────────
console.log("\n── pure ──");
const before=JSON.stringify([TABLE,PEOPLE,OV]);
const RUN=E.run(TABLE,START,56,PEOPLE,OV), RUN2=E.run(TABLE,START,56,PEOPLE,OV);
ok("same input → same 8-week plan", JSON.stringify(RUN)===JSON.stringify(RUN2));
ok("input not mutated (table, people, overrides)", JSON.stringify([TABLE,PEOPLE,OV])===before);
{ const frozen=clone([TABLE,PEOPLE,OV]); const deep=o=>{ Object.freeze(o); Object.values(o).forEach(v=>{ if(v&&typeof v==="object") deep(v); }); return o; }; deep(frozen);
  let threw=null; try{ vm.runInContext('"use strict";0',bare); bare.F=frozen; vm.runInContext('"use strict"; this.R=HouseEng.run(F[0],"'+START+'",56,F[1],F[2]);',bare); }catch(e){ threw=e.message; }
  ok("runs on deep-frozen input (nothing written into it)", !threw&&JSON.stringify(bare.R)===JSON.stringify(RUN),threw); }
const D1=E.day(TABLE,START,PEOPLE,OV); ok("day() alone = the run's first day", JSON.stringify(D1)===JSON.stringify(RUN[0]));
{ const code=ENG.replace(/\/\/[^\n]*/g,""); const g=["householdData","hhJobs","db","document","window","localStorage","HA_LS","momHere","ROSTER","SL_KIDS","SL_SLOTS","routineCfg2","rotationPeriod","Date.now","new Date()","Math.random"].filter(n=>new RegExp("(^|[^\\w$.])"+n.replace(/[.()]/g,"\\$&")+"(?![\\w$])").test(code));
  ok("the engine reads no app global, clock or random (everything is passed in)", g.length===0,g); }

// ── 8 weeks: nothing lost, nothing twice, nobody over ──────────────────────────────────────────────────────────────────────
console.log("\n── 8 weeks on the made-up table ──");
const isH=id=>["pickup","cleaning"].includes(J[id].area);
let twice=[], overLim=[], badRow=[], usedOff=[], lostDS=[], carryBad=[], routineBad=[], everyBad=[], neverOut=[];
const rotMembers=new Set(ROT);
RUN.forEach((p,i)=>{
  const seen={}; Object.keys(p.plan).concat(p.over.map(o=>o.id)).forEach(id=>{ seen[id]=(seen[id]||0)+1; if(seen[id]>1) twice.push(p.iso+" "+id); });
  Object.keys(p.limit).forEach(w=>{ const m=Object.keys(p.plan).filter(id=>p.plan[id].who===w&&p.plan[id].house).reduce((a,id)=>a+p.plan[id].mins,0); if(m>p.limit[w]) overLim.push(p.iso+" "+w+" "+m+">"+p.limit[w]); if(m!==p.used[w]) usedOff.push(p.iso+" "+w); });
  Object.keys(p.plan).concat(p.over.map(o=>o.id)).forEach(id=>{ if(NEVER.includes(id)||PILE.includes(id)) neverOut.push(p.iso+" "+id); });
  // independent due check for every daily and on-its-days row that does not rotate: due → on the plan or in the overflow
  H.filter(id=>!rotMembers.has(id)).forEach(id=>{ const j=J[id]; if(j.level>LEVEL[j.who]||j.hold) return; const c=j.cad, d=dowOf(p.iso);
    let due=c==="daily"||(c==="sat"&&d===5)||(c==="sun"&&d===6)||(/^wk:/.test(c)&&c.slice(3).split(",").map(Number).includes(d));
    if(due&&j.cycW){ const wk=Math.floor((dnum(p.iso)-dnum(j.cycStart))/7); due=(((wk%4)+4)%4)+1===j.cycW; }
    if(due&&!seen[id]) lostDS.push(p.iso+" "+id); });
  // health / animal rows: on their owner's (or rotation holder's) list, never in the overflow, never counted
  Object.keys(J).filter(id=>!isH(id)&&!rotMembers.has(id)&&J[id].status!=="retired").forEach(id=>{ const j=J[id], d=dowOf(p.iso);
    const due=j.cad==="daily"||(/^wk:/.test(j.cad)&&j.cad.slice(3).split(",").map(Number).includes(d))||(j.cad==="3d"&&(dnum(p.iso)-dnum(ON))%3===0&&dnum(p.iso)>dnum(ON));
    if(due&&!(p.plan[id]&&p.plan[id].who===j.who&&!p.plan[id].house)) routineBad.push(p.iso+" "+id); });
  if(p.over.some(o=>!isH(o.id))) routineBad.push(p.iso+" overflowed a routine row");
  // carry: a daily / on-its-days overflow is on the next day (first in line), or dropped because its own next day came
  const nx=RUN[i+1]; if(nx) p.over.forEach(o=>{ if(o.k==="every"){ if(!(nx.plan[o.id]||nx.over.some(x=>x.id===o.id))) carryBad.push(p.iso+" every "+o.id); return; }
    const inNx=nx.plan[o.id]&&nx.plan[o.id].why!=="turn"&&nx.plan[o.id].late>=1||nx.over.some(x=>x.id===o.id&&x.late>=1), mi=nx.missed.find(m=>m.id===o.id);
    if(!(inNx||(mi&&mi.why==="its next day came"&&(nx.plan[o.id]||nx.over.some(x=>x.id===o.id))))) carryBad.push(p.iso+" "+o.k+" "+o.id); });
});
ok("no chore is on a day twice (plan + overflow, 56 days)", twice.length===0,twice.slice(0,5));
ok("nobody is over their limit on any day", overLim.length===0,overLim.slice(0,5));
ok("the minutes it reports are the minutes it laid", usedOff.length===0,usedOff.slice(0,5));
ok("every due daily / on-its-days / 4-week-cycle chore is placed or overflows that day (none lost)", lostDS.length===0,lostDS.slice(0,5));
ok("health and animal rows are always on their owner's list, never overflow, never count", routineBad.length===0,routineBad.slice(0,5));
ok("every overflow is carried, still due, or a miss because its own next day came", carryBad.length===0,carryBad.slice(0,5));
ok("held one-time jobs, sent one-time jobs, projects, retired, above-level, held and Up for Grabs rows are never handed out", neverOut.length===0,neverOut.slice(0,5));
const nOver=RUN.reduce((a,p)=>a+p.over.length,0), nMoved=RUN.reduce((a,p)=>a+Object.values(p.plan).filter(x=>x.why==="moved").length,0);
ok("the made-up week is tight enough to test the rules (overflow "+nOver+", moved to someone who can "+nMoved+")", nOver>10&&nMoved>3);
ok("the 200-minute chore nobody has room for overflows every Monday and is never placed", RUN.filter(p=>dowOf(p.iso)===0).every(p=>p.over.some(o=>o.id===LONG))&&RUN.every(p=>!p.plan[LONG]));
// every-N: placed on day d → next due exactly d+N; a never-done one first comes due N after switch-on
RUN.forEach((p,i)=>Object.keys(p.plan).forEach(id=>{ const c=J[id].cad, N=/^\d+d$/.test(c)?parseInt(c):c==="2w"?14:0; if(!N||rotMembers.has(id)) return;
  const nxt=RUN.findIndex((q,k)=>k>i&&(q.plan[id]||q.over.some(o=>o.id===id))); const want=i+N; if(want<RUN.length&&nxt!==want) everyBad.push(id+" done "+p.iso+" next "+(nxt<0?"-":RUN[nxt].iso)); }));
ok("an every-N chore done on its planned day comes due again exactly N days later", everyBad.length===0,everyBad.slice(0,5));
{ const bad=[]; H.filter(id=>/^\d+d$|^2w$/.test(J[id].cad)&&!J[id].lastDone&&J[id].level<=LEVEL[J[id].who]).forEach(id=>{ const N=J[id].cad==="2w"?14:parseInt(J[id].cad); const first=RUN.findIndex(p=>p.plan[id]||p.over.some(o=>o.id===id)); if(N<56?first!==N:first!==-1) bad.push(id+" N="+N+" first="+first); });
  ok("a never-done every-N chore first comes due N days after switch-on (none on the first morning)", bad.length===0,bad.slice(0,5)); }
{ const id=H.find(x=>J[x].lastDone&&/^\d+d$/.test(J[x].cad)&&J[x].level<=LEVEL[J[x].who]), N=parseInt(J[id].cad), want=Math.max(0,dnum(J[id].lastDone)+N-S0); const first=RUN.findIndex(p=>p.plan[id]||p.over.some(o=>o.id===id));
  ok("one done before comes due at last done + N ("+id+")", first===want,{first,want}); }
ok("a weekend day uses the weekend limit", RUN[5].limit.dot===15&&RUN[0].limit.dot===8&&RUN[6].limit.dad===120);

// ── rotation = rtApplyRot, 60 days ─────────────────────────────────────────────────────────────────────────────────────────
console.log("\n── rotation against the real rtApplyRot (index.html) ──");
{
  const parts=["hhJobs","hhLevelOf","hhLevelCur","hhLevelOwn","hhLevelCurFor","hhLevelOut","_hhIsKidJob","hhKidJobIds","_hhPickStep","hhStepOf","hhDeriveKids","_rotKey","rtRotPeriod","_rtRotHop","rtApplyRot"].map(fn).join("\n");
  const ctx={ROSTER:KIDS,SL_KIDS:KIDS,SL_SLOTS:SLOTS,RT_DEFAULT:{},Object,Array,String,parseInt,Math,JSON,householdData:{jobs:clone(J),levels:{cleaning:{current:1},ava:{current:3},ben:{current:2},mom:{current:2}}},rotationPeriod:clone(ROTP),dayN:0};
  vm.createContext(ctx); vm.runInContext(lineOf("const HH_STEP_KEYS=")+"\n"+parts+"\nfunction _rtRotDayNum(){ return dayN; }\nvar routineCfg2=hhDeriveKids(); this.rtApplyRot=rtApplyRot; this.rc=function(){ return routineCfg2; };",ctx);
  const byLabel={}; Object.keys(J).forEach(id=>{ if(!J[id].free) byLabel[J[id].label]=id; });
  let bad=[], days=0, checks=0;
  for(let i=0;i<60;i++){ const s=isoOf(S0+i); ctx.dayN=dnum(s); const real={};
    SLOTS.forEach(slot=>KIDS.forEach(kid=>{ const steps=(ctx.rc()[slot]||{})[kid]; if(!steps) return; ctx.rtApplyRot(slot,kid,steps).forEach(st=>{ if(st&&st.rot&&!st.free&&st.cad!=="none") real[byLabel[st.label]]=kid; }); }));
    const mine=E.rotHolders(TABLE,s,PEOPLE,OV); days++;
    Object.keys(Object.assign({},real,mine)).forEach(id=>{ checks++; if(real[id]!==mine[id]) bad.push(s+" "+id+" real="+real[id]+" engine="+mine[id]); }); }
  ok("same person, same job, same date as rtApplyRot for 60 days ("+checks+" job-days, daily / weekly / every-2-days groups, free days)", bad.length===0&&checks>100,bad.slice(0,6));
  const placed=[]; RUN.forEach(p=>{ const h=E.rotHolders(TABLE,p.iso,PEOPLE,OV); Object.keys(h).forEach(id=>{ const x=p.plan[id]; if(x&&x.why==="turn"&&x.who!==h[id]) placed.push(p.iso+" "+id); if(x&&x.why==="moved"&&x.from!==h[id]) placed.push(p.iso+" moved-from "+id); }); });
  ok("on the plan, a rotating job is given to the kid whose turn it is (or moved off them, never off someone else)", placed.length===0,placed.slice(0,5));
  const free=RUN.some(p=>Object.keys(p.plan).some(id=>J[id].free)); ok("a Free day pick hands out nothing", !free);
  const wb=RUN.filter(p=>dowOf(p.iso)>=5).every(p=>{ const h=E.rotHolders(TABLE,p.iso,PEOPLE,OV); return !(p.plan.r_pick_a&&p.plan.r_pick_a.why==="turn")||h.r_pick_a!=="ben"; });
  ok("a rotating job follows the holder's own row's days (the porch row is weekdays only)", wb);
}

// ── the order rule and carry, on small tight days ──────────────────────────────────────────────────────────────────────────
console.log("\n── a tight day ──");
{
  const P={ava:{school:25,weekend:25,level:1},mom:{school:0,weekend:0,level:1}}, O={kids:["ava"],slots:SLOTS,on:"2026-10-01",minDefault:MIN_DEF};
  const T={jobs:{
    a_daily:{label:"d",area:"cleaning",who:"ava",cad:"daily",minutes:5,slot:"chores"},
    b_set:{label:"s",area:"cleaning",who:"ava",cad:"wk:0",minutes:10,slot:"chores"},
    c_every:{label:"e",area:"cleaning",who:"ava",cad:"7d",minutes:10,lastDone:"2026-11-09",slot:"chores"},
    d_every2:{label:"e2",area:"cleaning",who:"ava",cad:"14d",minutes:10,lastDone:"2026-11-01",slot:"chores"},
    e_carry:{label:"c",area:"pickup",who:"ava",cad:"wk:5",minutes:10,slot:"chores"},
    f_health:{label:"h",area:"health",who:"ava",cad:"daily",minutes:2,slot:"morning"}}};
  const d=E.day(T,"2026-11-16",P,Object.assign({},O,{carry:[{id:"e_carry",turn:"ava",k:"set",since:"2026-11-14"}]}));
  const L=d.list.ava||[];
  ok("carried first (most days late first), then daily, then on-its-day, then every-N most overdue first", JSON.stringify(L.filter(id=>T.jobs[id].area!=="health"))===JSON.stringify(["e_carry","d_every2","a_daily"]),{L,over:d.over});
  ok("…an every-N past its day counts as carried (first in line, 'N days late')", d.plan.d_every2.why==="carried"&&d.plan.d_every2.late===1&&d.plan.e_carry.late===2);
  ok("…the rest overflow, in that order (on-its-day before every-N)", JSON.stringify(d.over.map(o=>o.id))===JSON.stringify(["b_set","c_every"]),d.over);
  ok("health row placed, not counted: 25 of 25 used", d.plan.f_health&&d.used.ava===25&&d.limit.ava===25);
  ok("overflow says who could take it from Up for Grabs (the kids who can)", d.over[0].can.join()==="ava");
  // next day: the on-its-day overflow carries first in line; the every-N is still due, one more day late
  const n=E.day(T,"2026-11-17",P,Object.assign({},O,{carry:d.carryOut,lastDone:{d_every2:"2026-11-16",e_carry:"2026-11-16",a_daily:"2026-11-16"}}));
  ok("next day: the on-its-day overflow is first in line, 1 day late", (n.list.ava||[]).filter(id=>id!=="f_health")[0]==="b_set"&&n.plan.b_set.why==="carried"&&n.plan.b_set.late===1,n.list);
  ok("…the every-N overflow is still due, now 1 day late (so carried, behind the older carry), not carried twice", n.plan.c_every&&n.plan.c_every.late===1&&n.plan.c_every.why==="carried"&&(n.list.ava||[]).indexOf("c_every")===(n.list.ava||[]).indexOf("b_set")+1);
  ok("…carryOut never holds an every-N chore (it stays due on its own)", d.carryOut.length===1&&d.carryOut[0].id==="b_set");
  // a daily overflow is dropped when its next day comes (a miss), never on a day twice
  const P2={ava:{school:3,weekend:3,level:1}}, T2={jobs:{a_daily:T.jobs.a_daily}};
  const x=E.day(T2,"2026-11-16",P2,O), y=E.day(T2,"2026-11-17",P2,Object.assign({},O,{carry:x.carryOut}));
  ok("a daily overflow: next day it is a miss (its next day came) and today's one stands once", x.over.length===1&&y.missed.length===1&&y.missed[0].why==="its next day came"&&y.over.length===1&&y.over[0].late===0);
  // who-can: the turn person full → the person who can with the most minutes left
  const P3={ava:{school:5,weekend:5,level:1},ben:{school:20,weekend:20,level:1},cal:{school:30,weekend:30,level:1}};
  const T3={jobs:{a:{label:"a",area:"cleaning",who:"ava",cad:"daily",minutes:5,slot:"chores"},b:{label:"b",area:"cleaning",who:"ava",cad:"daily",minutes:10,slot:"chores",can:["ben","cal"]},c:{label:"c",area:"cleaning",who:"ava",cad:"daily",minutes:10,slot:"chores"}}};
  const z=E.day(T3,"2026-11-16",P3,{kids:["ava","ben","cal"],slots:SLOTS,minDefault:MIN_DEF});
  ok("turn person full → moved to who-can with the most minutes left; nobody who can → overflow", z.plan.a.who==="ava"&&z.plan.b.who==="cal"&&z.plan.b.why==="moved"&&z.plan.b.from==="ava"&&z.over.map(o=>o.id).join()==="c",z);
  const off=E.day(T3,"2026-11-16",P3,{kids:["ava","ben","cal"],slots:SLOTS,minDefault:MIN_DEF,off:{cal:1},skip:{a:1}});
  ok("overrides: a person off has no minutes, a ✕ skip is not due", off.limit.cal===0&&!off.plan.a&&off.plan.b.who==="ben");
}

console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
