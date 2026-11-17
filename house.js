// house.js — 🚪 Household by room, step 3 (DESIGN_household_rooms_2026-11-15 §9 row 3: "the engine in preview + By person +
// limits"; her "Go" 2026-11-16). The hand-out engine (§4.1–4.3), worked out and SHOWN ONLY on the Household tab, to Mom:
// the 👤 By person view, the room grid's future days and "Tomorrow would look like this". Nothing here changes a kid's list,
// Mom's strip, Dad's strip, a check-off or a star; nothing is stored but the limits (household/people) and the switch
// (household/meta/engine).
//   · Loaded lazily (HA_LAZY_FILES.house, LAZYSPLIT) the first time Mom opens 👤 By person or a room page with the preview on —
//     her standing words 2026-11-08: the LG got slow because the code grew, so new code must not weigh on every device.
//   · test_src.js puts the blocks back at their marker in index.html (`// ⇢ house.js: HOUSEENG..HOUSEPREVIEW`) for the tests.
//   · 🪶 HOUSESLIM (her "Yes, slim down" 2026-11-17, before step 4): the Household page's own code moved here unchanged from
//     index.html — HH_ROTATE, HH_PROJECTS' view (HH_PROJSWEEP, HH_PROJVIEW), HH_ONCEPILE's view (HH_ONCEVIEW), HH_EDITOR,
//     HH_ROOMPAGE and HH_CARD — each with its marker left where it stood. So the file now loads the first time the Household page
//     opens: renderHousehold is the door (HOUSESLIM in index.html). HOUSEENG reads none of it (step 4 moves HOUSEENG to the page).
// HH_PROJVIEW_START — 🧰 the Projects view and its taps (moved from HH_PROJECTS by HOUSESLIM 2026-11-17, unchanged): drawn only on the Household page. hhIsOnce, hhIsProject and hhProjLog stay in index.html (the cleaning-day plan and its check-off use them).
function hhProjLogFromForm(id){ const g=function(k){ const e=(typeof document!=="undefined"&&document.getElementById)?document.getElementById("hp-"+k+"-"+id):null; return e?String(e.value||""):""; }; return hhProjLog(id,g("min")||20,g("by"),g("note")); }
function hhProjWork(j){ const w=(j&&j.work)||{}; const keys=Object.keys(w).sort(); let min=0; keys.forEach(function(k){ min+=parseInt(w[k].min,10)||0; }); return {min:min,n:keys.length,last:keys.length?w[keys[keys.length-1]].iso:null,first:keys.length?w[keys[0]].iso:null,list:keys.map(function(k){ return Object.assign({ts:k},w[k]); })}; }
function hhProjStepAdd(id,el){
  if(typeof momHere==="function"&&!momHere()) return null; const j=hhJobs()[id]; const label=String((el&&el.value)||"").trim().slice(0,120); if(!j||!label) return null;
  const sid="s"+Date.now().toString(36)+Math.random().toString(36).slice(2,5), rec={label:label,done:"",order:Object.keys(j.steps||{}).length};
  j.steps=Object.assign({},j.steps); j.steps[sid]=rec; householdOnValue(householdData); if(_hhWrite()) db.ref("household/jobs/"+id+"/steps/"+sid).set(rec); if(el) el.value=""; hhRender(); return sid;
}
function hhProjStep(id,sid){
  if(typeof momHere==="function"&&!momHere()) return null; const j=hhJobs()[id]; const st=j&&j.steps&&j.steps[sid]; if(!st) return null;
  const v=st.done?"":_hhIsoLocal(Date.now()); st.done=v; householdOnValue(householdData); if(_hhWrite()) db.ref("household/jobs/"+id+"/steps/"+sid+"/done").set(v); hhRender(); return v;
}
function hhProjSteps(j){ const S=(j&&j.steps)||{}; return Object.keys(S).sort(function(a,b){ return ((S[a].order||0)-(S[b].order||0))||(a<b?-1:1); }).map(function(k){ return Object.assign({id:k},S[k]); }); }
function hhProjDone(id,on){
  if(typeof momHere==="function"&&!momHere()) return null; const j=hhJobs()[id]; if(!j) return null; const upd={}, P="household/jobs/"+id+"/";
  if(on){ upd[P+"status"]="retired"; upd[P+"done"]=_hhIsoLocal(Date.now()); j.status="retired"; j.done=upd[P+"done"]; } else { upd[P+"status"]="active"; upd[P+"done"]=null; upd[P+"verdict"]=""; j.status="active"; delete j.done; j.verdict=""; }
  householdOnValue(householdData); if(_hhWrite()) db.ref().update(upd); hhRender(); return !!on;
}
function hhProjStatus(j){ if(j.status==="retired"&&j.done) return {k:"done",txt:"Done "+j.done.slice(5)}; const W=hhProjWork(j); if(W.n) return {k:"going",txt:"In progress since "+W.first.slice(5)+" · "+W.min+" min in "+W.n+" session"+(W.n===1?"":"s")+" · last "+W.last.slice(5)}; return {k:"new",txt:"Not started"}; }
let hhProjOpen="";   // the project whose log and plan are unfolded
function hhProjToggle(id){ hhProjOpen=(hhProjOpen===id)?"":id; hhRender(); }
function hhProjectsHTML(){
  const jobs=hhJobs(), mom=(typeof momHere==="function")?momHere():false;
  const ids=Object.keys(jobs).filter(function(id){ return hhIsProject(jobs[id]); });   // HH_ONCEPILE: once-jobs have their own tab
  let h='<div style="font-size:11px;color:var(--muted);margin-bottom:8px">Projects are the bigger things with a room and a target; a once-job is due until it is checked one time. '+(mom?'Add either with + Add a chore and the Kind row.':'')+'</div>';
  if(!ids.length) return h+'<div style="background:#fff;border-radius:12px;box-shadow:0 2px 10px rgba(43,122,120,0.10);padding:10px 12px;font-size:12px;color:var(--muted)">No projects or once-jobs yet.</div>';
  const order=["mom","dad"].concat(HH_WHO.filter(w=>w!=="mom"&&w!=="dad"&&w!=="grab"),["grab"]);   // HHROSTER: the family's own kids
  const sorted=ids.sort(function(a,b){ const A=jobs[a],B=jobs[b]; return (A.status==="retired")-(B.status==="retired")||(order.indexOf(A.who)-order.indexOf(B.who))||((A.target||"9999")<(B.target||"9999")?-1:1); });
  sorted.forEach(function(id){ const j=jobs[id], S=hhProjStatus(j), W=hhProjWork(j), steps=hhProjSteps(j), nd=steps.filter(function(x){ return x.done; }).length, next=steps.find(function(x){ return !x.done; }), open=hhProjOpen===id, done=j.status==="retired";
    const col=S.k==="done"?'#94a3b8':S.k==="going"?'#2B7A78':'#b45309';
    h+='<div style="background:#fff;border-radius:12px;box-shadow:0 2px 10px rgba(43,122,120,0.10);margin-bottom:10px;overflow:hidden;border-left:4px solid '+col+(done?';opacity:.65':'')+'">';
    h+='<div onclick="hhProjToggle(\''+id+'\')" style="padding:10px 12px;cursor:pointer"><div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap"><span style="font-size:14px;font-weight:800;'+(done?'text-decoration:line-through':'')+'">'+'🧰 '+esc(j.emoji?j.emoji+' ':'')+esc(j.label)+'</span>'
      +_hhChip(esc(hhWhoName(j.who)),'#f3f4f6','#475569')+_hhChip('🚪 '+esc(hhRoomName(hhRoomOf(j))),'#f3f4f6','#475569')+(j.target?_hhChip('🎯 '+esc(j.target.slice(5)),(j.target<_hhIsoLocal(Date.now())&&!done)?'#fee2e2':'#eff6ff',(j.target<_hhIsoLocal(Date.now())&&!done)?'#991b1b':'#1d4ed8'):'')+(j.expect?_hhChip('~'+j.expect+' min','#f3f4f6','#475569'):'')+'<span style="flex:1"></span><span style="font-size:12px;color:var(--muted)">'+(open?'▾':'▸')+'</span></div>'
      +'<div style="font-size:11.5px;font-weight:700;color:'+col+';margin-top:4px">'+esc(S.txt)+(steps.length?' · '+nd+' of '+steps.length+' steps':'')+(next?' · next: '+esc(next.label):'')+'</div></div>';
    if(open&&mom){
      h+='<div style="padding:0 12px 12px">';
        h+='<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-bottom:8px"><label style="font-size:11px;font-weight:800;color:#6b6560">🎯 Target <input type="date" value="'+esc(j.target||'')+'" onchange="hhProjSet(\''+id+'\',\'target\',this.value)" style="padding:5px 7px;border:1.5px solid #e5e7eb;border-radius:8px;font-size:12px;font-family:\'DM Sans\',sans-serif"></label>'
          +'<label style="font-size:11px;font-weight:800;color:#6b6560">⏱ Expect <input type="number" min="0" max="6000" value="'+esc(j.expect||'')+'" placeholder="min" onchange="hhProjSet(\''+id+'\',\'expect\',this.value)" style="width:64px;padding:5px 7px;border:1.5px solid #e5e7eb;border-radius:8px;font-size:12px;font-family:\'DM Sans\',sans-serif"></label></div>';
        h+='<div style="font-size:10.5px;font-weight:800;text-transform:uppercase;letter-spacing:.4px;color:#6b6560;margin:6px 0 4px">📝 Plan</div><textarea onchange="hhProjSet(\''+id+'\',\'plan\',this.value)" placeholder="What to buy, the order, measurements…" style="width:100%;box-sizing:border-box;min-height:64px;padding:7px 9px;border:1.5px solid #e5e7eb;border-radius:8px;font-size:12.5px;font-family:\'DM Sans\',sans-serif">'+esc(j.plan||'')+'</textarea>';
        h+='<div style="font-size:10.5px;font-weight:800;text-transform:uppercase;letter-spacing:.4px;color:#6b6560;margin:8px 0 4px">☑️ Steps · '+nd+' of '+steps.length+'</div>';
        steps.forEach(function(x){ h+='<div class="sl-check-row'+(x.done?' done':'')+'" onclick="hhProjStep(\''+id+'\',\''+x.id+'\')" style="padding:5px 0"><div class="sl-checkbox'+(x.done?' done':'')+'">'+(x.done?'✓':'')+'</div><div style="flex:1;font-size:12.5px;font-weight:700;'+(x.done?'text-decoration:line-through;color:#6b6560':'')+'">'+esc(x.label)+(x.done?' <span style="font-weight:600;font-size:10.5px;color:#94a3b8">'+esc(x.done.slice(5))+'</span>':'')+'</div></div>'; });
        h+='<div style="display:flex;gap:6px;margin-top:4px"><input type="text" id="hp-step-'+id+'" placeholder="Add a step…" onkeydown="if(event.key===\'Enter\') hhProjStepAdd(\''+id+'\',this)" style="flex:1;padding:6px 8px;border:1.5px solid #e5e7eb;border-radius:8px;font-size:12px;font-family:\'DM Sans\',sans-serif">'+_hhBtn("hhProjStepAdd('"+id+"',document.getElementById('hp-step-"+id+"'))",'+ Step',false,'#2B7A78')+'</div>';
        h+='<div style="font-size:10.5px;font-weight:800;text-transform:uppercase;letter-spacing:.4px;color:#6b6560;margin:10px 0 4px">⏱ Work log · '+W.min+' min in '+W.n+' session'+(W.n===1?'':'s')+'</div>';
        W.list.slice().reverse().forEach(function(x){ h+='<div style="font-size:12px;padding:3px 0;border-bottom:1px solid #f3f4f6"><b>'+esc(x.iso.slice(5))+'</b> · '+x.min+' min · '+esc(hhWhoName(x.by))+(x.note?' — '+esc(x.note):'')+'</div>'; });
        h+='<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px;align-items:center"><input type="number" id="hp-min-'+id+'" value="20" min="1" max="600" style="width:58px;padding:6px 8px;border:1.5px solid #e5e7eb;border-radius:8px;font-size:12px;font-family:\'DM Sans\',sans-serif"><span style="font-size:11px;color:var(--muted)">min</span>'
          +'<select id="hp-by-'+id+'" style="padding:6px;border:1.5px solid #e5e7eb;border-radius:8px;font-size:12px;font-family:\'DM Sans\',sans-serif">'+HH_WHO.filter(function(w){ return w!=="grab"; }).map(function(w){ return '<option value="'+w+'"'+(w===j.who?' selected':'')+'>'+esc(hhWhoName(w))+'</option>'; }).join('')+'</select>'
          +'<input type="text" id="hp-note-'+id+'" placeholder="What got done" style="flex:1;min-width:120px;padding:6px 8px;border:1.5px solid #e5e7eb;border-radius:8px;font-size:12px;font-family:\'DM Sans\',sans-serif">'+_hhBtn("hhProjLogFromForm('"+id+"')",'➕ Worked on it',true,'#2B7A78')+'</div>';
      h+='<div style="display:flex;gap:6px;margin-top:10px;justify-content:flex-end">'+(done?_hhBtn("hhProjDone('"+id+"',false)",'↩ Reopen',false,'#64748b'):_hhBtn("hhProjDone('"+id+"',true)",'✓ Done',true,'#16a34a'))+'</div></div>';
    }
    h+='</div>'; });
  return h;
}
// HH_PROJVIEW_END
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
// HOUSEPERSON_START — 👤 By person (DESIGN §3.4; §12 asks it to show 🌅 Send to next morning carries). One chip per person; for the
// picked one: Today (their health and animal rows as they are on their lists NOW, anything 🌅 carried to their morning, and the house
// chores the preview plan WOULD give them, minutes against the limit), the next seven days as bars with what moved off them, their
// Settings, and their Habits. Every chore opens the step 2 chore card (hcOpen). Read-only on every list; the only writes are the
// Settings controls, each calling an existing setter (hhLevelSetFor, rtBonusSet) or HOUSEPEOPLE's.
let hpSel="";
function hpPick(w){ hpSel=w; hhRender(); }
const HP_CARD='background:#fff;border-radius:12px;box-shadow:0 2px 10px rgba(43,122,120,0.10);margin-bottom:10px;overflow:hidden';
const HP_HEAD='padding:6px 12px 2px;font-size:10.5px;font-weight:800;text-transform:uppercase;letter-spacing:.4px;color:#6b6560';
function hpDay(iso){ return ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"][_hhDow(iso)]+" "+(+iso.slice(5,7))+"/"+(+iso.slice(8)); }
function hpRow(id,emoji,label,extra,done){ const J=hhJobs(), tap=id&&J[id]&&(typeof momHere!=="function"||momHere()); return '<div'+(tap?' onclick="hcOpen(\''+id+'\')"':'')+' style="display:flex;align-items:center;gap:7px;padding:5px 12px;border-top:1px solid #f3f4f6;font-size:12.5px;font-weight:600'+(tap?';cursor:pointer':'')+(done?';color:#6b6560;text-decoration:line-through':'')+'"><span>'+(done===undefined?'':done?'✅':'☐')+'</span><span>'+(emoji||'')+'</span><span style="flex:1">'+esc(label)+'</span>'+(extra||'')+'</div>'; }
function hpBar(used,lim){ const pct=lim>0?Math.min(100,Math.round(100*used/lim)):(used>0?100:0); return '<div style="flex:1;height:8px;border-radius:4px;background:#eef2f0;overflow:hidden"><div style="height:8px;width:'+pct+'%;background:'+(used>lim?'#dc2626':pct>=90?'#d97706':'#2B7A78')+'"></div></div>'; }
// The routine rows (health, animals) on this person's lists today, from the lists themselves (hhTodayHTML's way).
function hpRoutineNow(who){
  const J=hhJobs(), dn=(typeof _todayDay!=="undefined")?_todayDay:"monday", iso=(typeof _todayStr==="function")?_todayStr():hpToday(), out=[];
  const areaOf=function(id,label,slot,rot){ const j=id&&J[id]; return (j&&j.area)||hhGuessArea(label,slot,rot); };
  const byLabel=function(w,label){ return Object.keys(J).find(function(id){ return J[id].who===w&&J[id].label===label; })||""; };
  if(hhIsKid(who)){ SL_SLOTS.forEach(function(slot){ (rtStepsFor(slot,who,false,dn)||[]).forEach(function(st,i){ if(!st) return; if(typeof stepWindowOk==="function"&&!stepWindowOk(st,dn)) return; if(!cadDueOn(st.cad||"daily",dn)) return;
      const id=st._hh||byLabel(who,st.label), a=areaOf(id,st.label,slot,st.rot); if(a!=="health"&&a!=="animals") return;
      const done=(slot==="morning")?((typeof mStepDoneOn==="function")?mStepDoneOn(who,dn,i):false):((typeof rtDoneOn==="function")?rtDoneOn(slot,who,dn,i):false);
      out.push({id:id,emoji:st.emoji,label:st.label,done:done,slot:slot}); }); }); return out; }
  const list=(who==="mom")?((typeof mcAll==="function")?mcAll():{}):((typeof dcAll==="function")?dcAll():{}), doneOn=(who==="mom")?((typeof mcDoneOn==="function")?mcDoneOn:null):((typeof dcDoneOn==="function")?dcDoneOn:null);
  Object.keys(list).forEach(function(k){ const c=list[k]; if(!c||!cadDueOn(c.cad||"daily",dn)) return; const id=Object.keys(J).find(function(x){ return J[x].who===who&&((J[x].src&&J[x].src.id)||x)===k; })||"", a=areaOf(id,c.label,c.slot,null);
    if(a==="health"||a==="animals") out.push({id:id,emoji:"",label:c.label,done:doneOn?doneOn(iso,k):false,slot:c.slot||""}); });
  return out;
}
// Where this person's turns went on one planned day: "→ Ben", "→ Grabs".
function hpMovedOff(p,who){ const out=[]; Object.keys(p.plan).forEach(function(id){ const x=p.plan[id]; if(x.from===who) out.push({id:id,to:x.who}); }); p.over.forEach(function(o){ if(o.turn===who) out.push({id:o.id,to:"grab",can:o.can}); }); return out; }
function hpMovedTxt(m){ return m.to==="grab"?'→ Grabs':'→ '+esc(hhWhoName(m.to)); }
function hpPreviewSwitchHTML(){
  const mom=(typeof momHere!=="function")||momHere(), on=hhEngineMode()==="preview";
  if(on) return '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;background:#ecfeff;border:1.5px solid #a5f3fc;border-radius:10px;padding:7px 10px;margin-bottom:10px;font-size:11.5px;color:#155e75"><b>🔭 Plan preview</b><span style="flex:1">What the new hand-out WOULD do with your limits — shown only here, to you. Nobody’s list changes.</span>'+(mom?_hhBtn("hhEngineTap(false)",'Stop showing it',false,'#64748b'):'')+'</div>';
  return '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;background:#f8fafc;border:1.5px dashed #cbd5e1;border-radius:10px;padding:7px 10px;margin-bottom:10px;font-size:11.5px;color:#475569"><span style="flex:1">The plan preview works out who would do each house chore — today, this week and the next 4 weeks — from the limits below. It is shown only on this page; nothing changes on anyone’s list.</span>'+(mom?_hhBtn("hhEngineTap(true)",'🔭 Show the plan preview',true,'#0e7490'):'')+'</div>';
}
function hpSettingsHTML(who){
  const mom=(typeof momHere!=="function")||momHere(), P=hhPeopleOf(who), fit=hpFitOf(who), inp='width:62px;padding:4px 6px;border:1.5px solid #e5e7eb;border-radius:8px;font-size:12.5px';
  const lim=function(f,label,ex){ const own=hhPeopleLim(who,f==="weekend"), cur=hhBudget(who,f==="weekend"?HP_SAT:HP_MON);
    return '<div style="display:flex;align-items:center;gap:8px;padding:5px 12px;border-top:1px solid #f3f4f6;font-size:12.5px"><span style="flex:1">'+label+' <span style="font-size:11px;color:var(--muted)">'+ex+'</span></span>'
      +(mom?'<input type="number" min="0" max="600" value="'+(own===null?'':own)+'" placeholder="'+cur+'" onchange="hpLimitSet(\''+who+'\',\''+f+'\',this.value)" style="'+inp+'">':'<b>'+cur+'</b>')+' min'+(own===null?' <span style="font-size:10.5px;color:var(--muted)">(as before)</span>':'')+'</div>'; };
  let h='<div style="'+HP_CARD+'"><div style="padding:9px 12px;font-size:14px;font-weight:800">⚙ Settings</div>';
  h+=lim("school","School-day limit","house chores, Mon–Fri")+lim("weekend","Weekend limit","Sat and Sun");
  h+='<div style="padding:6px 12px;border-top:1px solid #f3f4f6;font-size:12.5px"><div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap"><span style="flex:1">Chores and school</span>'+[["mixed","Mixed in"],["school","School first"]].map(function(x){ return mom?_hhBtn("hpFitSet('"+who+"','"+x[0]+"')",x[1],fit===x[0]):_hhChip(x[1],fit===x[0]?'#2B7A78':'#f3f4f6',fit===x[0]?'#fff':'#475569'); }).join('')+'</div>'
    +'<div style="font-size:10.5px;color:var(--muted);margin-top:3px">Saved for later: nothing uses this yet. It starts to matter when the plan is switched on for real (mixed in = chores fill open time; school first = chores after school).</div></div>';
  const own=hhLevelOwn(who); h+='<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;padding:6px 12px;border-top:1px solid #f3f4f6;font-size:12.5px"><span style="flex:1">🪜 Cleaning level <span style="font-size:11px;color:var(--muted)">now '+hhLevelCurFor(who)+'</span></span>'
    +[[0,"Family"],[1,"1"],[2,"2"],[3,"3"]].map(function(x){ return mom?_hhBtn("hhLevelSetFor('"+who+"',"+x[0]+")",x[1],own===x[0]):''; }).join('')+'</div>';
  if(hhIsKid(who)&&typeof rtBonusFor==="function"){
    h+='<div style="'+HP_HEAD+';border-top:1px solid #f3f4f6;padding-top:7px">⭐ Bonuses</div>';
    SL_SLOTS.concat(["day"]).forEach(function(sl){ const v=rtBonusFor(sl,who);
      h+='<div style="display:flex;align-items:center;gap:8px;padding:4px 12px;font-size:12.5px"><span style="flex:1">'+(sl==="day"?'🏆 Whole-day bonus':'🏁 Whole-list bonus · '+esc((typeof SL_SLBL!=="undefined"&&SL_SLBL[sl])||sl))+'</span>'+(mom?'<input type="number" min="0" value="'+v+'" onchange="hpBonusSet(\''+sl+'\',\''+who+'\',this.value)" style="'+inp+'">':'<b>'+v+'</b>')+' ⭐</div>'; });
  }
  h+='<div style="padding:6px 12px 9px;font-size:10.5px;color:var(--muted);border-top:1px solid #f3f4f6">To change the order of '+esc(hhWhoName(who))+'’s rows, use ⭐ Chores &amp; Stars ▸ Lists for now.</div>';
  return h+'</div>';
}
// The whole-list / whole-day bonus through its own setter (rtBonusSet, Chores & Stars). That setter writes whenever the database is
// there, so from here it is called only when writes are on — ?dryrun=1 stays inert.
function hpBonusSet(slot,kid,v){ if(typeof momHere==="function"&&!momHere()) return; if(!_hhWrite()||typeof rtBonusSet!=="function") return; rtBonusSet(slot,kid,v); }
function hpPersonHTML(){
  const W=hpWho(); if(W.indexOf(hpSel)<0) hpSel=W[0]; const who=hpSel, J=hhJobs(), today=hpToday(), on=hhEngineMode()==="preview";
  let h='<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px">'+W.map(function(w){ const sel=w===who, col=hhRmCol(w); return '<button onclick="hpPick(\''+w+'\')" style="padding:6px 11px;border-radius:20px;border:1.5px solid '+(sel?col:'#cbd5e1')+';background:'+(sel?col:'#fff')+';color:'+(sel?'#fff':'#334155')+';font-size:12px;font-weight:800;cursor:pointer;font-family:\'DM Sans\',sans-serif">'+esc(hhWhoName(w))+'</button>'; }).join('')+'</div>';
  h+=hpPreviewSwitchHTML();
  const run=on?hpRun():null, d0=run&&run[0];
  // Today
  h+='<div style="'+HP_CARD+'"><div style="padding:9px 12px;border-left:4px solid '+hhRmCol(who)+';font-size:14px;font-weight:800">📅 Today · '+esc(hhWhoName(who))+(d0?' <span style="font-size:11.5px;font-weight:700;color:var(--muted)">house '+d0.used[who]+' of '+d0.limit[who]+' min</span>':'')+'</div>';
  const R=hpRoutineNow(who); h+='<div style="'+HP_HEAD+'">🧼 Health and 🐾 animals — on their lists now</div>'+(R.length?R.map(function(r){ return hpRow(r.id,r.emoji,r.label,'',!!r.done); }).join(''):'<div style="padding:3px 12px 6px;font-size:12px;color:var(--muted)">Nothing due today.</div>');
  if(hhIsKid(who)&&typeof amList==="function"){ const C=amList(who).filter(function(c){ return !c.done&&c.dueIso<=today; });
    if(C.length) h+='<div style="'+HP_HEAD+'">🌅 Sent to the morning list</div>'+C.map(function(c){ return hpRow("",c.emoji,c.label,_hhChip('from '+hpDay(c.fromIso),'#fef3c7','#92400e')); }).join(''); }
  if(d0){ const mine=(d0.list[who]||[]).filter(function(id){ return d0.plan[id].house; }), mv=hpMovedOff(d0,who);
    h+='<div style="'+HP_HEAD+'">🔭 House chores the plan WOULD give today — preview</div><div style="display:flex;gap:8px;align-items:center;padding:2px 12px 4px;font-size:11px;color:var(--muted)">'+hpBar(d0.used[who],d0.limit[who])+'<span>'+d0.used[who]+' / '+d0.limit[who]+' min</span></div>';
    h+=mine.length?mine.map(function(id){ const x=d0.plan[id], j=J[id]||{}; return hpRow(id,j.emoji,j.label,(x.late>0?_hhChip(x.late+' day'+(x.late===1?'':'s')+' late','#fee2e2','#991b1b'):'')+(x.from?_hhChip('from '+hhWhoName(x.from),'#e0f2fe','#075985'):'')+_hhChip(x.mins+' min','#f3f4f6','#475569')); }).join(''):'<div style="padding:3px 12px 6px;font-size:12px;color:var(--muted)">No house chores for them today.</div>';
    if(mv.length) h+='<div style="'+HP_HEAD+'">Moved off them today</div>'+mv.map(function(m){ const j=J[m.id]||{}; return hpRow(m.id,j.emoji,j.label,_hhChip(hpMovedTxt(m)+(m.to==="grab"?(m.can.length?' · for '+m.can.map(hhWhoName).join(', '):' · no kid can'):''),m.to==="grab"?'#fef3c7':'#e0f2fe',m.to==="grab"?'#92400e':'#075985')); }).join('');
  }
  h+='<div style="height:6px"></div></div>';
  // The next seven days
  if(run){ h+='<div style="'+HP_CARD+'"><div style="padding:9px 12px;font-size:14px;font-weight:800">📆 This week <span style="font-size:11px;font-weight:600;color:var(--muted)">today and the 6 days after · house minutes vs limit · preview</span></div>';
    run.slice(0,7).forEach(function(p){ const mv=hpMovedOff(p,who), cnt={}; mv.forEach(function(m){ cnt[m.to]=(cnt[m.to]||0)+1; });
      h+='<div style="display:flex;align-items:center;gap:8px;padding:5px 12px;border-top:1px solid #f3f4f6;font-size:12px"><span style="width:62px;font-weight:800;color:'+(p.iso===today?'#2B7A78':'#475569')+'">'+hpDay(p.iso)+'</span>'+hpBar(p.used[who],p.limit[who])+'<span style="width:58px;text-align:right;font-weight:700">'+p.used[who]+' / '+p.limit[who]+'</span></div>'
        +(mv.length?'<div style="padding:0 12px 5px 82px;font-size:11px;color:#475569">'+Object.keys(cnt).map(function(t){ return hpMovedTxt({to:t})+(cnt[t]>1?' ×'+cnt[t]:''); }).join(' · ')+'</div>':''); });
    h+='</div>'; }
  h+=hpSettingsHTML(who);
  h+='<div style="font-size:14px;font-weight:800;margin:4px 2px 6px">📈 Habits</div>'+hhHabitsHTML(who);
  return h;
}
// HOUSEPERSON_END
// HOUSEPREVIEW_START — the room pages with the preview on (DESIGN §3.2 "future days are the plan"; §4.3 "for the next 4 weeks the
// names respect the limits"): the grid's next 28 days, one square per chore = who the plan WOULD give it to (dashed, in their colour;
// "2d" = carried 2 days late; "Grab" = it would overflow to Up for Grabs), and "Tomorrow would look like this": each person's list
// for tomorrow, minutes against the limit, and where every overflow would go. Shown only while household/meta/engine is "preview".
// Worked out when drawn (hpRun, memoised); nothing is stored and nothing is sent to the grabs pool.
function hpFuture(){ return hpRun().map(function(p){ const m={}; Object.keys(p.plan).forEach(function(id){ const x=p.plan[id]; m[id]={who:x.who,done:false,fut:true,late:x.late,from:x.from||""}; }); p.over.forEach(function(o){ m[o.id]={who:o.turn,done:false,fut:true,over:true,late:o.late}; }); return m; }); }
function hpSqHTML(c,full){
  if(c.over) return '<span title="Nobody who can has room: would go to Up for Grabs" style="font-size:10.5px;font-weight:800;white-space:nowrap;color:#b45309">'+(full?'→ Grabs':'Grab')+'</span>';
  const col=hhRmCol(c.who); return '<span title="Plan preview" style="font-size:10.5px;font-weight:800;white-space:nowrap;color:'+col+';border-bottom:1.5px dashed '+col+'">'+esc(full?hhWhoName(c.who):hhRmShort(c.who))+(c.late>0?' <span style="color:#dc2626">'+c.late+'d</span>':'')+'</span>';
}
function hpGridNoteHTML(){ return ' Days after today are the 🔭 plan preview: who the plan WOULD give each chore, within everyone’s limits (dashed; “2d” = 2 days late; “Grab” = nobody who can has room, so it would go to Up for Grabs). Nothing is on anyone’s list.'; }
function hpTomorrowHTML(){
  const run=hpRun(), p=run[1], J=hhJobs(), mom=(typeof momHere!=="function")||momHere(); if(!p) return '';
  let h='<div style="'+HP_CARD+';margin-top:10px"><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding:9px 12px;background:#ecfeff"><span style="font-size:14px;font-weight:800;flex:1">🔭 Tomorrow would look like this · '+hpDay(p.iso)+'</span>'+(mom?_hhBtn("hhEngineTap(false)",'Stop showing the preview',false,'#64748b'):'')+'</div>'
    +'<div style="padding:4px 12px 2px;font-size:11px;color:var(--muted)">A preview of the new hand-out with today’s limits. Nobody’s list changes; nothing goes to Up for Grabs.</div>';
  hpWho().forEach(function(w){ const ids=(p.list[w]||[]).filter(function(id){ return p.plan[id].house; });
    h+='<div style="display:flex;gap:8px;align-items:center;padding:7px 12px 2px;border-top:1px solid #eef2f0;font-size:12.5px"><span style="width:62px;font-weight:800;color:'+hhRmCol(w)+'">'+esc(hhWhoName(w))+'</span>'+hpBar(p.used[w],p.limit[w])+'<span style="width:62px;text-align:right;font-size:11px;font-weight:700">'+p.used[w]+' / '+p.limit[w]+' min</span></div>';
    h+=ids.length?ids.map(function(id){ const x=p.plan[id], j=J[id]||{}; return hpRow(id,j.emoji,j.label,(x.late>0?_hhChip(x.late+'d late','#fee2e2','#991b1b'):'')+(x.from?_hhChip('from '+hhWhoName(x.from),'#e0f2fe','#075985'):'')+_hhChip(x.mins+' min','#f3f4f6','#475569')); }).join(''):'<div style="padding:0 12px 4px 82px;font-size:11px;color:var(--muted)">No house chores.</div>'; });
  h+='<div style="'+HP_HEAD+';border-top:2px solid #fde68a;padding-top:8px">Would go to Up for Grabs ('+p.over.length+')</div>';
  h+=p.over.length?p.over.map(function(o){ const j=J[o.id]||{}; return hpRow(o.id,j.emoji,j.label,_hhChip(hhWhoName(o.turn)+'’s turn','#f3f4f6','#475569')+_hhChip(o.can.length?'for: '+o.can.map(hhWhoName).join(', '):'no kid can','#fef3c7','#92400e')+_hhChip(o.mins+' min','#f3f4f6','#475569')); }).join(''):'<div style="padding:0 12px 6px;font-size:12px;color:var(--muted)">Nothing — everything fits.</div>';
  return h+'<div style="height:6px"></div></div>';
}
// HOUSEPREVIEW_END
// ── end of house.js — the flag below tells index.html the whole file ran (haLazyReady) ──
if(typeof window!=="undefined") window._haLazy_house=true;
