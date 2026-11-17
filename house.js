// house.js — 🚪 Household by room, step 3 (DESIGN_household_rooms_2026-11-15 §9 row 3: "the engine in preview + By person +
// limits"; her "Go" 2026-11-16). The hand-out engine (§4.1–4.3), worked out and SHOWN ONLY on the Household tab, to Mom:
// the 👤 By person view, the room grid's future days and "Tomorrow would look like this". Nothing here changes a kid's list,
// Mom's strip, Dad's strip, a check-off or a star; nothing is stored but the limits (household/people) and the switch
// (household/meta/engine).
//   · Loaded lazily (HA_LAZY_FILES.house, LAZYSPLIT) the first time Mom opens 👤 By person or a room page with the preview on —
//     her standing words 2026-11-08: the LG got slow because the code grew, so new code must not weigh on every device.
//   · test_src.js puts the blocks back at their marker in index.html (`// ⇢ house.js: HOUSEENG..HOUSEPREVIEW`) for the tests.
// HOUSEENG_START — the hand-out engine, ONE pure function (DESIGN §6 "Hand-out": "one pure function (table, day, people,
// overrides) → plan, used for today's stored plan and the grid's future"). No database, no DOM, no app globals: everything it
// reads is passed in, nothing passed in is changed, the same input gives the same plan (test_house_engine.js checks all three).
//   HouseEng.day(table, iso, people, ov) → one day's plan
//     table  = {jobs:{id:row}}                    the household table (household/jobs)
//     people = {who:{school, weekend, level}}      each person's limits (minutes of HOUSE work) and their Cleaning level
//     ov     = {kids:[…], slots:[…], rotPeriod:{tag:p}, on:"<iso>", minDefault:{area:min}, lastDone:{id:iso},
//               carry:[…], skip:{id:1}, off:{who:1}}
//   HouseEng.run(table, startIso, days, people, ov) → [plans], day after day, each chore assumed done on its planned day.
// What is due (§4.1): daily · on its weekday(s) · "every N since last done" (lastDone + N; never done → N after the switch-on
// date `on`, her decision §10.2) · the 4-week cycle rows as they work today (stepCycleOk) · the start / end dates. Never handed
// out: one-time jobs and projects (the pile and Projects stay as they are), Up for Grabs rows (the grabs pool), "Free day"
// placeholders, held, retired, as needed / not scheduled, and house rows above the owner's level (hhLevelOut).
// Whose turn (§4.2, step 3 part): the owner, except a row in a rotation group: then the kid rtApplyRot gives that row's job on
// that date (same group order, same hop), on that kid's own row's timing — the job travels, the slot stays.
// Limits and order (§4.3 steps 1–5): carried first (most days late first) → daily → on-its-days → every-N (most overdue
// first); the person whose turn it is if their minutes left fit it; else the person in who-can with the most minutes left;
// else it OVERFLOWS (shown only: "would go to Up for Grabs"). Health and animal rows go to their owner, never count against a
// limit and never overflow.
// Carry (§4.1 table): an every-N chore stays due until it is done (so it is first in line, more days late, every day after); a
// daily or on-its-days chore that overflows carries to the next day first in line, and is dropped (a miss, as today) when its
// own next day arrives — so a daily never carries (tomorrow has its own) and no chore is ever on a day twice.
const HouseEng=(function(){
  const dnum=function(s){ const p=String(s).split("-").map(Number); return Math.round(Date.UTC(p[0],p[1]-1,p[2])/864e5); };
  const isoOf=function(n){ return new Date(n*864e5).toISOString().slice(0,10); };
  const dowOf=function(s){ return (new Date(s+"T12:00:00Z").getUTCDay()+6)%7; };   // Mon=0 … Sun=6, as _hhDow
  const isIso=function(s){ return /^\d{4}-\d{2}-\d{2}$/.test(String(s||"")); };
  const isHouse=function(j){ return !!j&&(j.area==="pickup"||j.area==="cleaning"); };             // hhIsHouse
  const levelOf=function(j){ const l=parseInt(j&&j.level,10); return (l>=1&&l<=3)?l:1; };         // hhLevelOf
  const levelOut=function(j,people){ const p=people[j.who]; return !isHouse(j)||levelOf(j)<=((p&&p.level)||1); };   // hhLevelOut
  const minsOf=function(j,def){ const m=parseInt(j&&j.minutes,10); return (m>0)?m:((def&&def[j&&j.area])||10); };   // hhMinutesOf
  const limitOf=function(people,who,s){ const p=people[who]; if(!p) return 0; const v=dowOf(s)>=5?p.weekend:p.school; return (typeof v==="number"&&v>=0)?v:0; };
  // hhCanOf: the owner first, then who else can, each a real person, once.
  function canOf(j,people){ const c=[], add=function(w){ if(w&&w!=="grab"&&people[w]&&c.indexOf(w)<0) c.push(w); }; add(j.who); (Array.isArray(j.can)?j.can:[]).forEach(add); return c; }
  // stepCycleOk, as it works today: cycW = the week (1..cycN) the row runs, counted in whole weeks from cycStart.
  function cycleOk(j,s){ if(!j.cycW||!j.cycStart) return true; const n=Math.max(1,parseInt(j.cycN,10)||4), a=Date.parse(j.cycStart+"T12:00:00"), b=Date.parse(s+"T12:00:00"); if(isNaN(a)||isNaN(b)) return true; const wk=Math.floor(Math.round((b-a)/864e5)/7); return (((wk%n)+n)%n)+1===parseInt(j.cycW,10); }
  function everyN(cad){ if(/^\d+d$/.test(cad)) return Math.max(1,parseInt(cad,10)); if(cad==="2w") return 14; return 0; }
  // Rows that are never handed out (see the header).
  function never(j,people){ return !j||typeof j!=="object"||j.status==="retired"||j.free||j.hold||j.cad==="once"||j.layer==="project"||j.who==="grab"||!people[j.who]; }
  // Is a row due on s, and how? cad = the cadence the list uses (a rotation slot's own); last = last-done iso; on = switch-on iso.
  // → null | {k:"daily"|"set"|"every", late:<days past its due day>, at:<due day number>}
  function dueOf(j,cad,s,last,on){
    cad=cad||"daily"; if(cad==="asneeded"||cad==="none"||cad==="once") return null;
    if(j.from&&s<j.from) return null; if(j.to&&s>j.to) return null; if(!cycleOk(j,s)) return null;
    const d=dowOf(s), n=dnum(s);
    if(cad==="daily") return {k:"daily",late:0,at:n};
    if(cad==="sat"||cad==="sun"||cad.indexOf("wk:")===0){ const days=cad==="sat"?[5]:cad==="sun"?[6]:cad.slice(3).split(",").filter(function(x){ return x!==""; }).map(Number); return days.indexOf(d)>=0?{k:"set",late:0,at:n}:null; }
    const N=everyN(cad); if(N){ const base=isIso(last)?dnum(last)+N:(isIso(on)?dnum(on)+N:null); return (base!==null&&n>=base)?{k:"every",late:n-base,at:base}:null; }
    return {k:"daily",late:0,at:n};   // cadDueOn reads an unknown cadence as due
  }
  // The rotation groups, built the way rtApplyRot builds them from the lists hhDeriveKids makes: per list (slot), each kid in
  // roster order, their rows in list order (order, then id), every row with a rot tag. A group of 2+ rotates.
  function groupsOf(jobs,people,ov){
    const kids=ov.kids||[], slots=ov.slots||[], G={};
    slots.forEach(function(slot){ kids.forEach(function(kid){
      Object.keys(jobs).filter(function(id){ const j=jobs[id]; return j&&j.who===kid&&(!j.src||j.src.kind==="routine"||j.src.kind==="new")&&j.slot===slot&&j.status!=="retired"&&levelOut(j,people)&&!j.hold; })
        .sort(function(a,b){ return ((jobs[a].order||0)-(jobs[b].order||0))||(a<b?-1:1); })
        .forEach(function(id){ const j=jobs[id]; if(j.rot){ const k=slot+"|"+j.rot; (G[k]=G[k]||{slot:slot,tag:j.rot,m:[]}).m.push({kid:kid,id:id}); } });
    }); });
    Object.keys(G).forEach(function(k){ if(G[k].m.length<2) delete G[k]; });
    return G;
  }
  function hopOf(tag,n,rp){ const key=String(tag||"").replace(/[.#$\[\]\/]/g,"_"), p=rp&&rp[key]; if(p==="weekly") return Math.floor((n+3)/7); if(/^\d+d$/.test(p||"")) return Math.floor(n/Math.max(1,parseInt(p,10))); return n; }   // _rtRotHop
  // On date s, which job each rotating row shows and on whose list: [{kid, row (the kid's own row id), pick (the job's id), cad}].
  function rotOn(jobs,s,people,ov){
    const G=groupsOf(jobs,people,ov), n=dnum(s), out=[], members={};
    Object.keys(G).forEach(function(k){ const g=G[k].m, hop=hopOf(G[k].tag,n,ov.rotPeriod);
      g.forEach(function(x){ members[x.id]=1; });
      g.forEach(function(x){ const mi=g.findIndex(function(y){ return y.kid===x.kid; }), p=g[(mi+hop)%g.length], pj=jobs[p.id], own=jobs[x.id];
        let cad=own.cad||"daily"; if(pj.free) cad="none"; else if(pj.cad==="asneeded") cad="asneeded"; else if(own.cad==="asneeded") cad="daily";
        out.push({kid:x.kid,row:x.id,pick:p.id,cad:cad}); }); });
    return {list:out,members:members};
  }
  // Who has each rotating job on s (the inverse of rtApplyRot, for the 60-day check): {jobId: kid}.
  function rotHolders(table,s,people,ov){ const r=rotOn((table&&table.jobs)||{},s,people,ov||{}), o={}; r.list.forEach(function(x){ if(o[x.pick]===undefined&&!(table.jobs[x.pick]||{}).free) o[x.pick]=x.kid; }); return o; }
  const RANK={daily:1,set:2,every:3};
  function day(table,s,people,ov){
    ov=ov||{}; const jobs=(table&&table.jobs)||{}, last=ov.lastDone||{}, skip=ov.skip||{}, off=ov.off||{}, n=dnum(s);
    const lastOf=function(id){ return last[id]!==undefined?last[id]:(jobs[id]&&jobs[id].lastDone); };
    const due={}, cands=[], routine=[];
    const consider=function(id,turn,cad){ const j=jobs[id]; if(due[id]||skip[id]||never(j,people)) return; if(isHouse(j)&&!levelOut(j,people)) return;
      const d=dueOf(j,cad,s,lastOf(id),ov.on); if(!d) return; due[id]=1;
      const c={id:id,turn:turn,mins:minsOf(j,ov.minDefault),k:d.k,late:d.late,carried:d.k==="every"&&d.late>0};
      if(isHouse(j)) cands.push(c); else routine.push(c); };
    const R=rotOn(jobs,s,people,ov);
    R.list.forEach(function(x){ if(people[x.kid]) consider(x.pick,x.kid,x.cad); });
    Object.keys(jobs).sort().forEach(function(id){ if(!R.members[id]) consider(id,jobs[id]&&jobs[id].who,jobs[id]&&jobs[id].cad); });
    // Yesterday's overflow: first in line, unless its own next day has come (then it is a miss, as on the lists today).
    const missed=[];
    (Array.isArray(ov.carry)?ov.carry:[]).forEach(function(c){ const j=jobs[c.id];
      if(due[c.id]||never(j,people)||!isHouse(j)||skip[c.id]){ missed.push({id:c.id,since:c.since,why:due[c.id]?"its next day came":"no longer handed out"}); return; }
      due[c.id]=1; cands.push({id:c.id,turn:people[c.turn]?c.turn:j.who,mins:minsOf(j,ov.minDefault),k:c.k,late:n-dnum(c.since),carried:true,since:c.since}); });
    const ord=function(id){ return (jobs[id]&&+jobs[id].order)||0; };
    cands.sort(function(a,b){ return ((b.carried?1:0)-(a.carried?1:0))||(a.carried?(b.late-a.late):0)||(RANK[a.k]-RANK[b.k])||(b.late-a.late)||(ord(a.id)-ord(b.id))||(a.id<b.id?-1:1); });
    const limit={}, left={}; Object.keys(people).forEach(function(w){ limit[w]=off[w]?0:limitOf(people,w,s); left[w]=limit[w]; });
    const plan={}, list={}, over=[], carryOut=[], put=function(id,o){ plan[id]=o; (list[o.who]=list[o.who]||[]).push(id); o.order=list[o.who].length-1; };
    routine.forEach(function(c){ if(!off[c.turn]) put(c.id,{who:c.turn,mins:c.mins,why:"routine",late:0,k:c.k,house:false}); });
    cands.forEach(function(c){
      let who=null, why=c.carried?"carried":"turn";
      if(left[c.turn]!==undefined&&left[c.turn]>=c.mins) who=c.turn;
      else { let best=-1; canOf(jobs[c.id],people).forEach(function(w){ if(w===c.turn) return; const r=left[w]; if(r!==undefined&&r>=c.mins&&r>best){ best=r; who=w; } }); if(who) why="moved"; }
      if(!who){ const can=canOf(jobs[c.id],people).filter(function(w){ return (ov.kids||[]).indexOf(w)>=0; });
        over.push({id:c.id,turn:c.turn,mins:c.mins,k:c.k,late:c.late,can:can});
        if(c.k!=="every") carryOut.push({id:c.id,turn:c.turn,k:c.k,since:c.since||s});
        return; }
      left[who]-=c.mins; const o={who:who,mins:c.mins,why:why,late:c.late,k:c.k,house:true}; if(who!==c.turn) o.from=c.turn; put(c.id,o); });
    const used={}; Object.keys(limit).forEach(function(w){ used[w]=limit[w]-left[w]; });
    return {iso:s,plan:plan,list:list,over:over,carryOut:carryOut,missed:missed,limit:limit,used:used};
  }
  function run(table,start,days,people,ov){
    ov=ov||{}; const jobs=(table&&table.jobs)||{}, last={}, out=[];
    Object.keys(jobs).forEach(function(id){ if(jobs[id]&&isIso(jobs[id].lastDone)) last[id]=jobs[id].lastDone; });
    Object.keys(ov.lastDone||{}).forEach(function(id){ last[id]=ov.lastDone[id]; });
    let carry=(ov.carry||[]).slice(), n0=dnum(start);
    for(let i=0;i<days;i++){ const s=isoOf(n0+i), p=day(table,s,people,Object.assign({},ov,{lastDone:Object.assign({},last),carry:carry}));
      Object.keys(p.plan).forEach(function(id){ last[id]=s; }); carry=p.carryOut; out.push(p); }
    return out;
  }
  return {day:day,run:run,dueOf:dueOf,rotHolders:rotHolders,canOf:canOf,dnum:dnum,isoOf:isoOf};
})();
// HOUSEENG_END
// HOUSEPEOPLE_START — 👤 each person's limits and the plan-preview switch (DESIGN §5: household/people/<who> = {school, weekend,
// fit:"mixed"|"school"}; household/meta/engine = {mode:"preview"|"off", on:"<iso>"}). Mom only; one targeted path per tap, through
// _hhWrite() so ?dryrun=1 writes nothing; nothing else in the database is touched. A limit nobody has set reads exactly what
// hhBudget gave before (HH_PEOPLE in index.html). `fit` (mixed in / school first, §4.5) is stored and shown; nothing acts on it
// until steps 4 and 7. Mode "on" (the real switch, step 4) cannot be set here. Turning the preview off keeps its `on` date, so a
// never-done every-N chore keeps the same first date if she turns it back on (§10.2: N after switch-on).
function hpWho(){ return HH_WHO.filter(function(w){ return w!=="grab"; }); }
function hpToday(){ return _hhIsoLocal(Date.now()); }
function hpIsIso(s){ return /^\d{4}-\d{2}-\d{2}$/.test(String(s||"")); }
function hpEngine(){ const e=householdData&&householdData.meta&&householdData.meta.engine; return (e&&typeof e==="object")?e:{}; }
function hpFitOf(who){ const f=hhPeopleOf(who).fit; return (f==="mixed"||f==="school")?f:(hhIsKid(who)?"school":"mixed"); }   // §4.5 defaults: the kids school first, Mom and Dad mixed in
function _hpPerson(who){ householdData.people=householdData.people||{}; householdData.people[who]=Object.assign({},householdData.people[who]); return householdData.people[who]; }
// One limit: "" clears it (back to the old number); else whole minutes 0–600.
function hpLimitSet(who,field,val){
  if(typeof momHere==="function"&&!momHere()) return null; if(hpWho().indexOf(who)<0||(field!=="school"&&field!=="weekend")) return null;
  const clear=(val===""||val===null||val===undefined); let v=null;
  if(!clear){ v=Number(val); if(!(Number.isInteger(v)&&v>=0&&v<=600)) return null; }
  const p=_hpPerson(who); if(clear) delete p[field]; else p[field]=v; householdOnValue(householdData);
  if(_hhWrite()){ const r=db.ref("household/people/"+who+"/"+field); if(clear) r.remove(); else r.set(v); }
  hhRender(); return clear?"":v;
}
function hpFitSet(who,fit){
  if(typeof momHere==="function"&&!momHere()) return null; if(hpWho().indexOf(who)<0||(fit!=="mixed"&&fit!=="school")) return null;
  _hpPerson(who).fit=fit; householdOnValue(householdData);
  if(_hhWrite()) db.ref("household/people/"+who+"/fit").set(fit);
  hhRender(); return fit;
}
// Show the plan preview (true) / stop showing it (false). Writes household/meta/engine only.
function hpEngineSet(on){
  if(typeof momHere==="function"&&!momHere()) return null; const e=hpEngine(); if(!on&&e.mode!=="preview") return null;
  const rec={mode:on?"preview":"off",on:hpIsIso(e.on)?e.on:hpToday()};
  householdData.meta=Object.assign({},householdData.meta,{engine:rec}); householdOnValue(householdData);
  if(_hhWrite()) db.ref("household/meta/engine").set(rec);
  hhRender(); return rec;
}
// The engine's inputs, from the app's own readers: each person's limits (hhBudget, which reads household/people first), their
// Cleaning level (hhLevelCurFor), the rotation order and cycles (SL_KIDS, SL_SLOTS, config/rotationPeriod) and the switch-on date.
const HP_MON="2026-11-16", HP_SAT="2026-11-21";   // hhBudget only asks which day of the week: any Monday, any Saturday
function hpPeople(){ const P={}; hpWho().forEach(function(w){ P[w]={school:hhBudget(w,HP_MON),weekend:hhBudget(w,HP_SAT),level:hhLevelCurFor(w),fit:hpFitOf(w)}; }); return P; }
function hpOv(){ return {kids:(typeof SL_KIDS!=="undefined"?SL_KIDS:ROSTER).slice(),slots:SL_SLOTS.slice(),rotPeriod:Object.assign({},(typeof rotationPeriod!=="undefined"&&rotationPeriod)||{}),on:hpIsIso(hpEngine().on)?hpEngine().on:hpToday(),minDefault:HH_MIN_DEFAULT}; }
// Today and the next 4 weeks (§4.3: "for the next 4 weeks the names respect the limits"), worked out when drawn and kept until the
// table, a limit, a level, a cycle or the date changes.
let _hpMemo=null;
function hpRun(){
  const people=hpPeople(), ov=hpOv(), t=hpToday(), table={jobs:hhJobs()}, sig=JSON.stringify([t,people,ov,table.jobs]);
  if(_hpMemo&&_hpMemo.sig===sig) return _hpMemo.run;
  const run=HouseEng.run(table,t,29,people,ov); _hpMemo={sig:sig,run:run}; return run;
}
// HOUSEPEOPLE_END
// ── end of house.js — the flag below tells index.html the whole file ran (haLazyReady) ──
if(typeof window!=="undefined") window._haLazy_house=true;
