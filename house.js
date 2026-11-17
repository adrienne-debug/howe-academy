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
// HH_ROTATE_START — 🔁 rotations on the Household tab (her "go" 2026-10-11, after "the rotation [isn't there]"). The rotation
// itself is the old one, untouched: steps in the same slot sharing a rot tag, one per kid, take turns (rtApplyRot); a kid's
// free:true step is a placeholder turn; config/rotationPeriod/<tag> is the cycle. This block only makes and edits those rows
// from the tab. Start = the row gets the tag + a "Free day" placeholder row for each other kid (same slot, area and level, so
// the gate treats the group as one) + the cycle. Join = another kid's own row takes the tag and their placeholder retires.
// Leave = a placeholder retires, a real job drops its tag and stays that kid's own. Give to… on a member row hands that
// kid's turn to another kid (their placeholder, if any, retires). Mom's and Dad's rows do not rotate.
let hhRot={id:"",kids:{},period:"daily"};   // the open Rotate panel: the row, the kids picked, the cycle
const HH_ROT_PERIODS=[["daily","Daily"],["weekly","Weekly (flips Mon)"],["2d","Every 2 days"],["3d","Every 3 days"]];
function hhRotPeriodOf(tag){ return (typeof rtRotPeriod==="function")?rtRotPeriod(tag):"daily"; }
function hhRotGroups(){
  const jobs=hhJobs(), g={}; const kids=(typeof SL_KIDS!=="undefined")?SL_KIDS:ROSTER;
  Object.keys(jobs).forEach(function(id){ const j=jobs[id]; if(!j.rot||j.status==="retired"||!hhIsKid(j.who)||SL_SLOTS.indexOf(j.slot)<0) return; const key=j.slot+"|"+j.rot; (g[key]=g[key]||{slot:j.slot,tag:j.rot,members:[]}).members.push({kid:j.who,id:id,job:j,free:!!j.free}); });
  Object.keys(g).forEach(function(k){ g[k].members.sort(function(a,b){ return kids.indexOf(a.kid)-kids.indexOf(b.kid); }); });
  return g;
}
function hhRotMember(slot,tag,kid){ const G=hhRotGroups()[slot+"|"+tag]; return G?G.members.find(function(m){ return m.kid===kid; })||null:null; }
function hhRotName(G){ const names=G.members.filter(function(m){ return !m.free; }).map(function(m){ return (m.job.emoji?m.job.emoji+" ":"")+m.job.label; }); return names.length?names.join(" · "):"🔁 "+G.tag; }
function _hhRotFree(j,kid,tag){ return {emoji:"😌",label:"Free day",pts:0,cad:"daily",rot:tag,free:true,slot:j.slot,who:kid,src:{kind:"new"},source:"Household tab",area:j.area||"pickup",floor:j.floor||"",room:j.room||"any",level:hhLevelOf(j),status:"active",verdict:"",note:"",order:_hhNextOrder(kid,j.slot),ts:Date.now()}; }
function _hhRotNewId(){ return "hh"+Date.now().toString(36)+Math.random().toString(36).slice(2,6); }
function hhRotOpen(id){ const j=hhJobs()[id]; if(!j||!hhIsKid(j.who)) return; hhRot={id:id,kids:{},period:j.rot?hhRotPeriodOf(j.rot):"daily"}; hhRot.kids[j.who]=true; if(j.rot){ const G=hhRotGroups()[j.slot+"|"+j.rot]; if(G) G.members.forEach(function(m){ hhRot.kids[m.kid]=true; }); } hhGive=""; hhRender(); }
function hhRotClose(){ hhRot={id:"",kids:{},period:"daily"}; hhRender(); }
function hhRotKid(kid){ const j=hhJobs()[hhRot.id]; if(!j||kid===j.who) return; hhRot.kids[kid]=!hhRot.kids[kid]; hhRender(); }
function hhRotPeriod(p){ if(HH_ROT_PERIODS.some(function(x){ return x[0]===p; })) hhRot.period=p; hhRender(); }
function _hhRotPeriodWrite(upd,tag,p){ const key=(typeof _rotKey==="function")?_rotKey(tag):tag; upd["config/rotationPeriod/"+key]=p; if(typeof rotationPeriod!=="undefined"&&rotationPeriod) rotationPeriod[key]=p; }   // the cycle lives where the old editor keeps it
function _hhRotCommit(upd,msg){ householdOnValue(householdData); if(Object.keys(upd).length&&_hhWrite()) db.ref().update(upd); if(msg&&typeof mwToast==="function") try{ mwToast(msg); }catch(e){} if(typeof renderAll==="function") renderAll(); else hhRender(); return upd; }
// Start (or re-shape) a rotation from the open panel: this row + a placeholder for each other picked kid.
function hhRotSave(){
  if(typeof momHere==="function"&&!momHere()) return null;
  const jobs=hhJobs(), id=hhRot.id, j=jobs[id]; if(!j||!hhIsKid(j.who)||SL_SLOTS.indexOf(j.slot)<0) return null;
  const kids=Object.keys(hhRot.kids).filter(function(k){ return hhRot.kids[k]&&hhIsKid(k); }); if(kids.length<2){ if(typeof mwToast==="function") try{ mwToast("Pick at least one more kid"); }catch(e){} return null; }
  let tag=j.rot; if(!tag){ const base="rot_"+j.slot+"_"+hhSlug(j.label).slice(0,24); tag=base; let n=2; const taken={}; Object.keys(jobs).forEach(function(k){ if(jobs[k].rot) taken[jobs[k].rot]=1; }); while(taken[tag]) tag=base+"_"+(n++); }
  const upd={}, P="household/jobs/";
  if(j.rot!==tag){ upd[P+id+"/rot"]=tag; j.rot=tag; }
  const G=hhRotGroups()[j.slot+"|"+tag]||{members:[]};
  kids.forEach(function(kid){ if(kid===j.who||G.members.some(function(m){ return m.kid===kid; })) return; const nid=_hhRotNewId(), row=_hhRotFree(j,kid,tag); upd[P+nid]=row; jobs[nid]=row; });
  G.members.forEach(function(m){ if(kids.indexOf(m.kid)>=0) return; if(m.free){ upd[P+m.id+"/status"]="retired"; upd[P+m.id+"/verdict"]="retire"; m.job.status="retired"; m.job.verdict="retire"; } else { upd[P+m.id+"/rot"]=null; delete m.job.rot; } });   // un-picked: out of the group
  _hhRotPeriodWrite(upd,tag,hhRot.period);
  hhRot={id:"",kids:{},period:"daily"};
  return _hhRotCommit(upd,"🔁 "+kids.map(hhWhoName).join(" → ")+" take turns");
}
// Another kid's own row joins a rotation already in that slot (their placeholder turn, if any, retires).
function hhRotJoin(id,tag){
  if(typeof momHere==="function"&&!momHere()) return null;
  const jobs=hhJobs(), j=jobs[id]; if(!j||!hhIsKid(j.who)||j.rot===tag) return null;
  const G=hhRotGroups()[j.slot+"|"+tag]; if(!G) return null; const mine=G.members.find(function(m){ return m.kid===j.who; });
  if(mine&&!mine.free){ if(typeof mwToast==="function") try{ mwToast(hhWhoName(j.who)+" already has a job in that rotation"); }catch(e){} return null; }
  const upd={}, P="household/jobs/"; upd[P+id+"/rot"]=tag; j.rot=tag;
  if(mine){ upd[P+mine.id+"/status"]="retired"; upd[P+mine.id+"/verdict"]="retire"; mine.job.status="retired"; mine.job.verdict="retire"; }
  hhRot={id:"",kids:{},period:"daily"}; hhGive="";
  return _hhRotCommit(upd,"🔁 Joined");
}
function hhRotLeave(id){
  if(typeof momHere==="function"&&!momHere()) return null;
  const j=hhJobs()[id]; if(!j||!j.rot) return null; const upd={}, P="household/jobs/"+id+"/";
  if(j.free){ upd[P+"status"]="retired"; upd[P+"verdict"]="retire"; j.status="retired"; j.verdict="retire"; } else { upd[P+"rot"]=null; delete j.rot; }
  return _hhRotCommit(upd,j.free?"Turn removed":"Now "+hhWhoName(j.who)+"’s own chore");
}
function hhRotAddKid(slot,tag,kid){
  if(typeof momHere==="function"&&!momHere()) return null;
  const G=hhRotGroups()[slot+"|"+tag]; if(!G||!hhIsKid(kid)||G.members.some(function(m){ return m.kid===kid; })) return null;
  const base=G.members.find(function(m){ return !m.free; })||G.members[0]; const nid=_hhRotNewId(), row=_hhRotFree(base.job,kid,tag); const upd={}; upd["household/jobs/"+nid]=row; hhJobs()[nid]=row;
  return _hhRotCommit(upd,hhWhoName(kid)+" takes turns too");
}
function hhRotCycle(tag,p){ if(typeof momHere==="function"&&!momHere()) return null; if(!HH_ROT_PERIODS.some(function(x){ return x[0]===p; })) return null; const upd={}; _hhRotPeriodWrite(upd,tag,p); return _hhRotCommit(upd,""); }
// ── on screen ──
function hhRotPanelHTML(id){
  if(hhRot.id!==id) return ""; const j=hhJobs()[id]||{}; const kids=(typeof SL_KIDS!=="undefined")?SL_KIDS:ROSTER;
  const chip=function(on,txt,onclick,fixed){ return '<button onclick="'+(fixed?'':onclick)+'" style="padding:4px 9px;border-radius:8px;border:1.5px solid '+(on?'#2B7A78':'#e5e7eb')+';background:'+(on?'#2B7A78':'#fff')+';color:'+(on?'#fff':'#334155')+';font-size:11px;font-weight:800;cursor:'+(fixed?'default':'pointer')+';font-family:\'DM Sans\',sans-serif">'+txt+'</button>'; };
  let h='<div style="margin-top:6px;padding:8px 10px;background:#fff7ed;border-radius:9px;border:1.5px solid #fed7aa">';
  h+='<div style="font-size:11px;font-weight:800;color:#9a3412">🔁 Take turns with</div><div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:4px">'+kids.map(function(k){ return chip(!!hhRot.kids[k],esc(hhWhoName(k))+(k===j.who?' (has it now)':''),"hhRotKid('"+k+"')",k===j.who); }).join('')+'</div>';
  h+='<div style="font-size:11px;font-weight:800;color:#9a3412;margin-top:8px">Cycle</div><div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:4px">'+HH_ROT_PERIODS.map(function(p){ return chip(hhRot.period===p[0],esc(p[1]),"hhRotPeriod('"+p[0]+"')"); }).join('')+'</div>';
  const others=Object.keys(hhRotGroups()).map(function(k){ return hhRotGroups()[k]; }).filter(function(G){ return G.slot===j.slot&&G.tag!==j.rot&&!G.members.some(function(m){ return m.kid===j.who&&!m.free; }); });
  if(others.length){ h+='<div style="font-size:11px;font-weight:800;color:#9a3412;margin-top:8px">Or join a rotation already in this slot</div><div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:4px">'+others.map(function(G){ return chip(false,'➕ '+esc(hhRotName(G))+' ('+G.members.map(function(m){ return hhWhoName(m.kid); }).join(" → ")+')',"hhRotJoin('"+id+"','"+G.tag+"')"); }).join('')+'</div>'; }
  h+='<div style="font-size:11px;color:var(--muted);margin-top:8px">The job travels whole — words, emoji, stars. The other kids get a “Free day” turn until a job of theirs joins.</div>';
  h+='<div style="display:flex;gap:6px;margin-top:8px;justify-content:flex-end">'+_hhBtn("hhRotClose()",'Cancel',false,'#94a3b8')+_hhBtn("hhRotSave()",'Save',true,'#2B7A78')+'</div></div>';
  return h;
}
function hhRotationsHTML(){
  const G=hhRotGroups(), keys=Object.keys(G); const kids=(typeof SL_KIDS!=="undefined")?SL_KIDS:ROSTER; const today=_hhIsoLocal(Date.now());
  let h='<div style="font-size:11px;color:var(--muted);margin-bottom:8px">Each rotation: the kids in turn order, what each one holds today, and the cycle. Start one from any kid’s row: → Give to… then 🔁 Rotate.</div>';
  if(!keys.length) return h+'<div style="background:#fff;border-radius:12px;box-shadow:0 2px 10px rgba(43,122,120,0.10);padding:10px 12px;font-size:12px;color:var(--muted)">No rotations yet.</div>';
  keys.sort().forEach(function(k){ const g=G[k], per=hhRotPeriodOf(g.tag), gated=g.members.some(function(m){ return !hhLevelOut(m.job); });
    h+='<div style="background:#fff;border-radius:12px;box-shadow:0 2px 10px rgba(43,122,120,0.10);margin-bottom:10px;overflow:hidden"><div style="padding:9px 12px;display:flex;align-items:center;gap:6px;flex-wrap:wrap"><span style="font-size:13px;font-weight:800">🔁 '+esc(hhRotName(g))+'</span>'+_hhChip(esc((typeof SL_SLBL!=="undefined"&&SL_SLBL[g.slot])||g.slot),'#f3f4f6','#475569')+(g.members.length<2?_hhChip('needs one more kid to rotate','#fee2e2','#991b1b'):'')+(gated?_hhChip('waits for the level','#fef3c7','#92400e'):'')+'</div>';
    g.members.forEach(function(m){ const held=hhRotLabelOn(m.job,today), isFree=held==="Free day";
      h+='<div style="padding:6px 12px;border-top:1px solid #eef2f0;display:flex;align-items:center;gap:6px;flex-wrap:wrap;font-size:12.5px"><span style="font-weight:800;min-width:60px">'+esc(hhWhoName(m.kid))+'</span><span style="color:var(--muted)">today:</span><span style="font-weight:700;'+(isFree?'color:#94a3b8':'')+'">'+esc(held)+'</span><span style="flex:1"></span>'+_hhChip(m.free?'placeholder turn':'own job: '+esc(m.job.label),m.free?'#f3f4f6':'#eff6ff',m.free?'#64748b':'#1d4ed8')+_hhBtn("hhRotLeave('"+m.id+"')",'Leave',false,'#64748b')+'</div>'; });
    const outside=kids.filter(function(kd){ return !g.members.some(function(m){ return m.kid===kd; }); });
    h+='<div style="padding:7px 12px;border-top:1px solid #eef2f0;display:flex;gap:4px;flex-wrap:wrap;align-items:center"><span style="font-size:10.5px;font-weight:800;color:#6b6560">Cycle:</span>'+HH_ROT_PERIODS.map(function(p){ return _hhBtn("hhRotCycle('"+g.tag+"','"+p[0]+"')",esc(p[1]),per===p[0],'#2B7A78'); }).join('')+(outside.length?'<span style="flex:1"></span><span style="font-size:10.5px;font-weight:800;color:#6b6560">Add:</span>'+outside.map(function(kd){ return _hhBtn("hhRotAddKid('"+g.slot+"','"+g.tag+"','"+kd+"')",'+ '+esc(hhWhoName(kd)),false,'#6B4C93'); }).join(''):'')+'</div></div>'; });
  return h;
}
// HH_ROTATE_END
// HH_PROJSWEEP_START — ☑️ the once-job sweep and the project setters (moved from HH_PROJECTS by HOUSESLIM 2026-11-17, unchanged): only renderHousehold runs the sweep, and only the Projects view's taps call hhProjSet.
function hhOnceSweep(){
  if(typeof momHere==="function"&&!momHere()) return [];
  if(typeof rlHistFull==="function"&&!rlHistFull()) return [];   // RLWIN: never retire from partial history
  const jobs=hhJobs(), upd={}, out=[];
  Object.keys(jobs).forEach(function(id){ const j=jobs[id]; if(!hhIsOnce(j)||j.status==="retired") return; let st=null; try{ st=hhStats(j); }catch(e){} if(!st||!st.last) return;
    upd["household/jobs/"+id+"/status"]="retired"; upd["household/jobs/"+id+"/done"]=st.last; j.status="retired"; j.done=st.last; out.push(id); });
  if(out.length){ householdOnValue(householdData); if(_hhWrite()) db.ref().update(upd); }
  return out;
}
function hhProjSet(id,field,val){
  if(typeof momHere==="function"&&!momHere()) return null; const j=hhJobs()[id]; if(!j||["target","plan","expect"].indexOf(field)<0) return null;
  if(field==="target"){ val=String(val||""); if(val&&!/^\d{4}-\d{2}-\d{2}$/.test(val)) return null; }
  if(field==="plan") val=String(val||"").slice(0,2000);
  if(field==="expect"){ val=parseInt(val,10); if(!(val>=0&&val<=6000)) return null; }
  j[field]=val; householdOnValue(householdData); if(_hhWrite()) db.ref("household/jobs/"+id+"/"+field).set(val===""?null:val); hhRender(); return val;
}
// HH_PROJSWEEP_END
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
// HH_ONCEVIEW_START — ☑️ the Once pile view and its taps (moved from HH_ONCEPILE by HOUSESLIM 2026-11-17, unchanged): drawn only on the Household page. hhOnceHeld stays in index.html (the cleaning-day plan reads it).
function hhOnceSend(id,who){
  if(typeof momHere==="function"&&!momHere()) return null; const j=hhJobs()[id]; if(!j||!hhIsOnce(j)||j.status==="retired") return null;
  who=who||j.who; if(hhCanOf(j).indexOf(who)<0) return null;
  if(who!==j.who){ if(hhGiveTo(id,who)===null) return null; }   // its own targeted update (who, slot, src, order, from)
  j.hold=false; if(!j.from) j.from=_hhIsoLocal(Date.now()); householdOnValue(householdData);
  if(_hhWrite()) db.ref().update({["household/jobs/"+id+"/hold"]:null,["household/jobs/"+id+"/from"]:j.from});
  if(typeof mwToast==="function") try{ mwToast("☑️ On "+hhWhoName(who)+"’s list until it’s done"); }catch(e){}
  if(typeof renderAll==="function") renderAll(); return who;
}
function hhOnceHold(id){
  if(typeof momHere==="function"&&!momHere()) return null; const j=hhJobs()[id]; if(!j||!hhIsOnce(j)||j.status==="retired") return null;
  j.hold=true; householdOnValue(householdData); if(_hhWrite()) db.ref("household/jobs/"+id+"/hold").set(true);
  if(typeof renderAll==="function") renderAll(); return true;
}
function hhOnceRows(){ const jobs=hhJobs(); return Object.keys(jobs).filter(function(id){ return hhIsOnce(jobs[id]); }); }
function _hhOnceSendBtns(id,j){ const can=hhCanOf(j); return '<div style="display:flex;gap:4px;flex-wrap:wrap;align-items:center"><span style="font-size:10.5px;font-weight:800;color:#6b6560">Send to</span>'+can.map(function(w){ return _hhBtn("hhOnceSend('"+id+"','"+w+"')",esc(hhWhoName(w)),w===j.who,'#2B7A78'); }).join('')+'</div>'; }
function hhOnceHTML(){
  const jobs=hhJobs(), mom=(typeof momHere==="function")?momHere():false, ids=hhOnceRows(), rooms=hhRoomList().map(function(r){ return r[0]; });
  let h='<div style="font-size:11px;color:var(--muted);margin-bottom:8px">A once-job waits here, off every list, until you send it to someone. It stays on their list until they check it once, then it retires with the date.'+(mom?' Add one with + Add a chore and Kind = Once.':'')+'</div>';
  if(!ids.length) return h+'<div style="background:#fff;border-radius:12px;box-shadow:0 2px 10px rgba(43,122,120,0.10);padding:10px 12px;font-size:12px;color:var(--muted)">The pile is empty.</div>';
  const held=ids.filter(function(id){ return hhOnceHeld(jobs[id])&&jobs[id].status!=="retired"; }), out=ids.filter(function(id){ return !jobs[id].hold&&jobs[id].status!=="retired"; }), done=ids.filter(function(id){ return jobs[id].status==="retired"; });
  const byRoom=function(list){ return list.sort(function(a,b){ return (rooms.indexOf(hhRoomOf(jobs[a]))-rooms.indexOf(hhRoomOf(jobs[b])))||(HH_WHO.indexOf(jobs[a].who)-HH_WHO.indexOf(jobs[b].who))||(a<b?-1:1); }); };
  const row=function(id,extra){ const j=jobs[id]; return '<div style="padding:7px 12px;border-top:1px solid #eef2f0"><div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;font-size:13px;font-weight:700"><span>'+(j.emoji||'☑️')+'</span><span style="flex:1;min-width:120px;'+(j.status==="retired"?'text-decoration:line-through;color:#6b6560':'')+'">'+esc(j.label)+'</span>'+_hhChip(esc(hhWhoName(j.who)),'#f3f4f6','#475569')+_hhChip('⏱ '+hhMinutesOf(j)+' min','#f3f4f6','#475569')+(j.pts?_hhChip(j.pts+' ⭐','#fef3c7','#92400e'):'')+'</div>'+(extra||'')+'</div>'; };
  const section=function(title,sub,list,extraFn){ h+='<div style="background:#fff;border-radius:12px;box-shadow:0 2px 10px rgba(43,122,120,0.10);margin-bottom:10px;overflow:hidden"><div style="padding:9px 12px;font-size:13px;font-weight:800">'+title+' <span style="font-weight:600;color:var(--muted);font-size:11px">'+sub+'</span></div>';
    if(!list.length) h+='<div style="padding:0 12px 8px;font-size:12px;color:var(--muted)">Nothing here.</div>'; let room=null; byRoom(list).forEach(function(id){ const rm=hhRoomOf(jobs[id]); if(rm!==room){ room=rm; h+='<div style="padding:6px 12px 0;font-size:10.5px;font-weight:800;text-transform:uppercase;letter-spacing:.4px;color:#6b6560">🚪 '+esc(hhRoomName(rm))+'</div>'; } h+=row(id,mom?extraFn(id):''); }); h+='</div>'; };
  section('☑️ The pile',held.length+' waiting · '+held.reduce(function(a,id){ return a+hhMinutesOf(jobs[id]); },0)+' min',held,function(id){ return '<div style="margin-top:5px">'+_hhOnceSendBtns(id,jobs[id])+'</div>'; });
  section('📋 On a list',out.length+' sent, not yet done',out,function(id){ return '<div style="margin-top:5px;display:flex;gap:6px;align-items:center"><span style="font-size:11px;color:var(--muted)">on '+esc(hhWhoName(jobs[id].who))+'’s list</span>'+_hhBtn("hhOnceHold('"+id+"')",'⏸ Back to the pile',false,'#64748b')+'</div>'; });
  if(done.length) section('✓ Done',done.length,done,function(id){ return '<div style="font-size:11px;color:#94a3b8;margin-top:3px">done '+esc((jobs[id].done||'').slice(5))+'</div>'; });
  return h;
}
// HH_ONCEVIEW_END
// HH_EDITOR_START — ✎ Edit on every row, and the Area / Room views by person (her 2026-10-11: "in area could we make subsections
// for each person and then make all the things editable to all the options like days of week"). The editor sits under the row,
// the size of the pickers: words · emoji · stars · time of day · days (daily, any weekdays, every N days, every 2/4/6 weeks, as
// needed, once) · minutes · room · level · area · who can · start date · Give to… · Retire. One targeted write per change
// (a kid's time-of-day change also moves the row to the END of the new list, so no one else's check-off index shifts; a row
// moved onto weekdays starts today, LATE_FROM). The lists re-derive at once under Take over.
let hhEditId="";
function hhEditToggle(id){ hhEditId=(hhEditId===id)?"":id; if(hhEditId){ hhPick=""; hhGive=""; } hhRender(); }
const HH_EDIT_CADS=[["daily","Daily"],["wk","Weekdays"],["nd","Every N days"],["2w","Every 2 weeks"],["28d","Every 4 weeks"],["42d","Every 6 weeks"],["asneeded","As needed"],["once","Once"]];
function hhEditCadMode(cad){ cad=cad||"daily"; if(/^wk:|^sat$|^sun$/.test(cad)) return "wk"; if(cad==="2w"||cad==="28d"||cad==="42d"||cad==="daily"||cad==="asneeded"||cad==="once"||cad==="none") return cad; if(/^\d+d$/.test(cad)) return "nd"; return "daily"; }
function hhEditDays(cad){ if(cad==="sat") return [5]; if(cad==="sun") return [6]; if(!/^wk:/.test(cad||"")) return []; return cad.slice(3).split(",").filter(function(x){ return x!==""; }).map(Number).filter(function(n){ return n>=0&&n<=6; }); }
function hhEditSet(id,field,val){
  if(typeof momHere==="function"&&!momHere()) return null; const jobs=hhJobs(), j=jobs[id]; if(!j) return null; const upd={}, P="household/jobs/"+id+"/", kid=hhIsKid(j.who);
  if(["minutes","room","level","area","can","verdict"].indexOf(field)>=0){ hhSet(id,field,val); return val; }
  if(field==="label"){ val=String(val||"").trim().slice(0,80); if(!val) return null; }
  else if(field==="emoji"){ val=String(val||"").trim().slice(0,4); }
  else if(field==="pts"){ if(!(kid||j.who==="grab")) return null; val=Math.max(0,Math.min(500,parseInt(val,10)||0)); }
  else if(field==="slot"){ if(kid){ if(SL_SLOTS.indexOf(val)<0) return null; if(val!==j.slot){ upd[P+"order"]=_hhNextOrder(j.who,val,id); j.order=upd[P+"order"]; } } else { if(!HH_MC_SLOTS.some(function(c){ return c[0]===val; })) return null; } }
  else if(field==="cad"){ val=String(val||""); if(!(val==="daily"||val==="2w"||val==="28d"||val==="42d"||val==="asneeded"||val==="once"||val==="none"||/^wk:[0-6](,[0-6])*$/.test(val)||/^[1-9]\d?d$/.test(val))) return null;
    if(/^wk:|^once$/.test(val)&&!/^wk:|^once$/.test(j.cad||"")&&!j.from){ upd[P+"from"]=_hhIsoLocal(Date.now()); j.from=upd[P+"from"]; }   // LATE_FROM: begins today
    if(val!=="once"&&j.hold){ upd[P+"hold"]=null; delete j.hold; } }
  else if(field==="from"){ val=String(val||""); if(val&&!/^\d{4}-\d{2}-\d{2}$/.test(val)) return null; }
  else return null;
  if(val===""){ upd[P+field]=null; delete j[field]; } else { upd[P+field]=val; j[field]=val; }
  householdOnValue(householdData); if(_hhWrite()) db.ref().update(upd); hhRender(); return val;
}
function hhEditCadMode_set(id,mode){ const j=hhJobs()[id]; if(!j) return null; const cad=j.cad||"daily"; if(mode==="wk"){ const d=hhEditDays(cad); return hhEditSet(id,"cad","wk:"+(d.length?d:[(new Date().getDay()+6)%7]).join(",")); } if(mode==="nd"){ return hhEditSet(id,"cad",/^\d+d$/.test(cad)?cad:"3d"); } return hhEditSet(id,"cad",mode); }
function hhEditDay(id,dow){ const j=hhJobs()[id]; if(!j) return null; let d=hhEditDays(j.cad||""); dow=parseInt(dow,10); if(d.indexOf(dow)>=0){ if(d.length===1) return null; d=d.filter(function(x){ return x!==dow; }); } else d.push(dow); d.sort(function(a,b){ return a-b; }); return hhEditSet(id,"cad","wk:"+d.join(",")); }
function hhEditField(id,field,el){ return hhEditSet(id,field,(el&&el.value!==undefined)?el.value:el); }
function hhEditBtn(id){ return (typeof momHere==="function"&&!momHere())?"":_hhBtn("hcOpen('"+id+"')",'✎ Edit',typeof hcId!=="undefined"&&hcId===id,'#2B7A78'); }   // HH_CARD: ✎ Edit opens the chore card
function hhEditHTML(id){
  if(hhEditId!==id) return ""; const j=hhJobs()[id]; if(!j) return ""; const kid=hhIsKid(j.who), cad=j.cad||"daily", mode=hhEditCadMode(cad), days=hhEditDays(cad);
  const chip=function(on,txt,onclick,color){ color=color||'#2B7A78'; return '<button onclick="'+onclick+'" style="padding:4px 9px;border-radius:8px;border:1.5px solid '+(on?color:'#e5e7eb')+';background:'+(on?color:'#fff')+';color:'+(on?'#fff':'#334155')+';font-size:11px;font-weight:800;cursor:pointer;font-family:\'DM Sans\',sans-serif">'+txt+'</button>'; };
  const lab=function(t){ return '<div style="font-size:10.5px;font-weight:800;text-transform:uppercase;letter-spacing:.4px;color:#6b6560;margin-top:8px">'+t+'</div>'; };
  const inp='style="padding:6px 8px;border:1.5px solid #e5e7eb;border-radius:8px;font-size:13px;font-family:\'DM Sans\',sans-serif;box-sizing:border-box"';
  let h='<div style="margin-top:6px;padding:8px 10px;background:#f8fafc;border-radius:9px">';
  h+='<div style="display:flex;gap:3px;flex-wrap:wrap;margin-bottom:6px">'+HH_EMOJI.map(function(e){ const on=e===j.emoji; return '<button onclick="hhEditSet(\''+id+'\',\'emoji\',\''+e+'\')" style="width:30px;height:28px;border-radius:7px;border:1.5px solid '+(on?'#2B7A78':'#e5e7eb')+';background:'+(on?'#e6f4f3':'#fff')+';font-size:16px;padding:0;cursor:pointer">'+e+'</button>'; }).join('')+'</div>';
  h+='<div style="display:flex;gap:6px"><input type="text" value="'+esc(j.emoji||'')+'" placeholder="🧽" onchange="hhEditField(\''+id+'\',\'emoji\',this)" '+inp+' style="width:48px"><input type="text" value="'+esc(j.label||'')+'" onchange="hhEditField(\''+id+'\',\'label\',this)" '+inp+' style="flex:1">'+((kid||j.who==="grab")?'<input type="number" value="'+esc(j.pts||0)+'" min="0" max="500" onchange="hhEditField(\''+id+'\',\'pts\',this)" '+inp+' style="width:62px" title="stars">':'')+'</div>';
  if(j.who!=="grab"){ h+=lab('Time of day')+'<div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:4px">'+(kid?SL_SLOTS.map(function(sl){ return chip(j.slot===sl,esc((typeof SL_SLBL!=="undefined"&&SL_SLBL[sl])||sl),"hhEditSet('"+id+"','slot','"+sl+"')"); }):HH_MC_SLOTS.map(function(c){ return chip((j.slot||"")===c[0],esc(c[1]),"hhEditSet('"+id+"','slot','"+c[0]+"')"); })).join('')+'</div>'; }
  h+=lab('Days')+'<div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:4px">'+HH_EDIT_CADS.map(function(c){ return chip(mode===c[0],esc(c[1]),"hhEditCadMode_set('"+id+"','"+c[0]+"')"); }).join('')+'</div>';
  if(mode==="wk") h+='<div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:4px">'+["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(function(d,i){ return chip(days.indexOf(i)>=0,d,"hhEditDay('"+id+"',"+i+")",'#0e7490'); }).join('')+'</div>';
  if(mode==="nd") h+='<div style="font-size:12px;color:var(--muted);margin-top:4px">Every <input type="number" min="1" max="99" value="'+(parseInt(cad,10)||3)+'" onchange="hhEditSet(\''+id+'\',\'cad\',this.value+\'d\')" '+inp+' style="width:54px"> days</div>';
  h+='<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:8px;align-items:flex-end"><label style="font-size:10.5px;font-weight:800;text-transform:uppercase;letter-spacing:.4px;color:#6b6560">Minutes<br><input type="number" min="1" max="240" value="'+esc(hhMinutesOf(j))+'" onchange="hhEditField(\''+id+'\',\'minutes\',this)" '+inp+' style="width:70px"></label><label style="font-size:10.5px;font-weight:800;text-transform:uppercase;letter-spacing:.4px;color:#6b6560">Starts<br><input type="date" value="'+esc(j.from||'')+'" onchange="hhEditField(\''+id+'\',\'from\',this)" '+inp+'></label></div>';
  h+=lab('Room')+'<div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:4px">'+hhRoomList().map(function(r){ return chip(hhRoomOf(j)===r[0],(r[2]==="up"?"⬆️ ":r[2]==="down"?"⬇️ ":"")+esc(r[1]),"hhEditSet('"+id+"','room','"+r[0]+"')"); }).join('')+'</div>';
  h+=lab('Level')+'<div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:4px">'+[1,2,3].map(function(L){ return chip(hhLevelOf(j)===L,"Level "+L,"hhEditSet('"+id+"','level',"+L+")"); }).join('')+'</div>';
  h+=lab('Area')+'<div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:4px">'+Object.keys(HH_AREAS).map(function(k){ return chip((j.area||"cleaning")===k,HH_AREAS[k][0]+" "+HH_AREAS[k][1],"hhEditSet('"+id+"','area','"+k+"')"); }).join('')+'</div>';
  if(j.who!=="grab"){ const can=hhCanOf(j); h+=lab('Who can do it')+'<div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:4px">'+HH_WHO.filter(function(w){ return w!=="grab"; }).map(function(w){ const own=w===j.who; return chip(can.indexOf(w)>=0,esc(hhWhoName(w))+(own?' (owner)':''),own?'':"hhCanToggle('"+id+"','"+w+"')"); }).join('')+'</div>'; }
  h+='<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px;align-items:center">'+(j.who!=="grab"&&typeof hhGiveBtn==="function"?hhGiveBtn(id):'')+'<span style="flex:1"></span>'+(j.status==="retired"?_hhBtn("hhSet('"+id+"','verdict','keep')",'↩ Bring back',false,'#2B7A78'):_hhBtn("hhSet('"+id+"','verdict','retire')",'🚫 Retire',false,'#64748b'))+_hhBtn("hhEditToggle('"+id+"')",'Done',true,'#2B7A78')+'</div></div>';
  return h;
}
// HH_EDITOR_END
// HH_ROOMPAGE_START — 🗺 Rooms on the Household tab (Household by room, step 1 of DESIGN_household_rooms_2026-11-15; her direction
// 2026-11-11: "ONE grid, chores across, dates down", rooms across the top, Downstairs and Upstairs fold). READ-ONLY on every chore and
// list: a room's chores across in lanes (Daily · Weekly · Every few weeks · Seasonal · One-time, from each chore's own timing), dates
// down: the past days from the history the Household tab already loaded (rlHistReady — the whole routineLog, momday, the cleaning
// days) and today from the lists as they stand now. A square = who did it (✓) or who has it, in their colour. No future, no late
// badge, no lines yet (those need the engine, step 3). A tap opens the existing ✎ Edit. 🏠 Whole house = every room, most behind
// first. 🚪 Edit rooms (Mom) writes only household/rooms/* and household/floors/* (HH_ROOMDATA). Works only while the view is open.
let hhRmSel="", hhRmFold={}, hhRmLane={}, hhRmEditing=false, hhRmLong=false;   // room id ("" = 🏠 Whole house, "__none" = No room) · open groups · open lanes · Edit rooms · 8 weeks
const HH_LANES=[["daily","Daily"],["weekly","Weekly"],["few","Every few weeks"],["season","Seasonal"],["once","One-time"]];
function hhRmGo(id){ hhRmSel=id; hhRmEditing=false; hhEditId=""; hhRender(); }
function hhRmFoldToggle(g,open){ hhRmFold[g]=!open; hhRender(); }
function hhRmLaneToggle(k){ hhRmLane[k]=!hhRmLane[k]; hhRender(); }
function hhRmEditToggle(){ if(typeof momHere==="function"&&!momHere()) return; hhRmEditing=!hhRmEditing; hhRender(); }
function hhRmLongToggle(){ hhRmLong=!hhRmLong; hhRender(); }
// The lane, from the chore's own timing (planCad first, like the need meter): once-jobs and projects → One-time; as needed (no set
// date) → Seasonal; else by how often: every day → Daily, up to a week → Weekly, under 60 days → Every few weeks, longer → Seasonal.
function hhLaneOf(j){ const cad=hhPlanCad(j); if(hhIsProject(j)||cad==="once") return "once"; if(cad==="asneeded"||cad==="none") return "season"; const iv=hhInterval(j)||7; return iv<=1?"daily":iv<=7?"weekly":iv<60?"few":"season"; }
function hhTimesAWeek(j){ const cad=hhPlanCad(j); if(hhLaneOf(j)==="once"||cad==="asneeded"||cad==="none") return 0;
  let n=/^wk:/.test(cad)?(cad.slice(3).split(",").filter(function(x){ return x!==""; }).length||1):(cad==="sat"||cad==="sun")?1:(cad==="daily")?7:7/(hhInterval(j)||7);
  if(j.cycW) n=n/Math.max(1,parseInt(j.cycN,10)||4); return n; }   // 🗓 4-week cycle: one week in N
// The room a chore shows under here: its stored room if that room still exists, else (no stored room) the guess; "" = No room.
function hhRoomOn(j){ const L=hhRoomList(), has=function(r){ return L.some(function(x){ return x[0]===r; }); }; if(j&&j.room&&!has(j.room)) return ""; const r=hhRoomOf(j); return has(r)?r:""; }
function hhRoomChores(){ const J=hhJobs(), out={__none:[]}; hhRoomList().forEach(function(r){ out[r[0]]=[]; });
  Object.keys(J).forEach(function(id){ const j=J[id]; if(!j||j.status==="retired"||j.free) return; out[hhRoomOn(j)||"__none"].push(id); }); return out; }
function hhRoomStats(ids){ const J=hhJobs(), t=_hhDayNum(_hhIsoLocal(Date.now())); let due=0, ok=0, late=0, mins=0;
  ids.forEach(function(id){ const j=J[id], st=hhStats(j); due+=st.due8; ok+=st.done8-st.late8; mins+=hhMinutesOf(j)*hhTimesAWeek(j);
    if(hhLaneOf(j)!=="once"&&!j.hold){ const n=hhNeed(j); if(n&&(n.never?!(j.from&&t-_hhDayNum(j.from)<=n.interval):n.pct>100)) late++; } });   // late = past its interval (the need meter)
  return {n:ids.length,pct:due?Math.round(100*ok/due):null,late:late,mins:Math.round(mins)}; }
// 🏠 Whole house order: most late first, then lowest on time, then the room list's order.
function hhHouseOrder(byRoom){ const L=hhRoomList().map(function(r){ return r[0]; }).concat(byRoom.__none.length?["__none"]:[]);
  return L.map(function(id,i){ return {id:id,i:i,s:hhRoomStats(byRoom[id]||[])}; }).sort(function(a,b){ return (b.s.late-a.s.late)||((a.s.pct===null?101:a.s.pct)-(b.s.pct===null?101:b.s.pct))||(a.i-b.i); }); }
function hhRmCol(w){ return (typeof KID_COLOR!=="undefined"&&KID_COLOR[w])||(w==="mom"?"#6B4C93":w==="dad"?"#2C5F8A":"#A0622D"); }
function hhRmShort(w){ return w==="mom"?"Mom":w==="dad"?"Dad":w==="grab"?"Grab":String(hhWhoName(w)).slice(0,2); }
// One square: {who, done} or null (not due, not done). A cleaning-day plan names who had it and who did it; a rotation row is
// done by the kid whose turn it was (the inverse of hhRotLabelOn); "has it" asks what the lists ask (cad, dates, cycle, held,
// level), not the Week grid's moved day. On past days an every-N chore shows only its ✓: its past due dates are not trustworthy
// today (DESIGN §2.3 #1, the engine's job in step 3).
function hhRmCell(id,iso,today,S,rc){
  const j=hhJobs()[id], cd=householdData&&householdData.cleanday&&householdData.cleanday[iso], dn=_HH_DN[new Date(iso+"T12:00:00Z").getUTCDay()];
  if(cd&&cd.done&&cd.done[id]) return {who:cd.done[id].who||j.who,done:true};
  let who=(cd&&cd.sent&&cd.plan&&cd.plan[id]&&cd.plan[id].who)||j.who, done=false, rot=false;
  if(!(cd&&cd.sent&&cd.plan&&cd.plan[id])&&j.rot&&j.src&&j.src.kind==="routine"&&hhIsKid(j.who)){ const k=j.src.slot+"|"+j.rot, g=rc[k]||(rc[k]=hhRotGroup(j.src.slot,j.rot)), mi=g.findIndex(function(x){ return x.kid===j.who; });
    if(mi>=0&&g.length>1){ const hop=(typeof _rtRotHop==="function")?_rtRotHop(j.rot,_hhDayNum(iso)):_hhDayNum(iso); who=g[(((mi-hop)%g.length)+g.length)%g.length].kid; rot=true;
      const st=S.state[who+"|"+j.slot+"|"+_hhNorm(g[mi].label)+"|"+iso]; done=!!(st&&st.act==="on"); } }
  if(!rot) done=(who===j.who)?hhDoneOnDay(j,iso,S):false;
  if(done) return {who:who,done:true};
  if(cd&&cd.sent&&cd.plan&&cd.plan[id]) return {who:who,done:false};
  if(hhLaneOf(j)==="once"||j.hold||!hhLevelOut(j)||(typeof stepCycleOk==="function"&&!stepCycleOk(j,iso))) return null;
  const cad=j.cad||"daily"; let due;
  if(iso===today) due=cad!=="asneeded"&&cad!=="none"&&cadDueOn(cad,dn)&&!(j.from&&iso<j.from)&&!(j.to&&iso>j.to);
  else due=/^(daily|wk:|sat$|sun$)/.test(cad)&&!!_hhDayCheck(j,_hhDayNum(iso),S);
  return due?{who:who,done:false}:null;
}
function _hhRmSq(c,full){ if(!c) return ''; if(c.fut&&typeof hpSqHTML==="function") return hpSqHTML(c,full);   /* HH_PEOPLE: a planned day */ return '<span style="font-size:10.5px;font-weight:800;white-space:nowrap;color:'+hhRmCol(c.who)+(c.done?'':';opacity:.45')+'">'+esc(full?hhWhoName(c.who):hhRmShort(c.who))+(c.done?' ✓':'')+'</span>'; }
function hhRoomGridHTML(rid,ids){
  const J=hhJobs(), mom=(typeof momHere!=="function")||momHere(), today=_hhIsoLocal(Date.now()), t=_hhDayNum(today), S=hhLogState(), rc={}, DL=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const lanes=HH_LANES.map(function(L){ return {k:L[0],name:L[1],ids:ids.filter(function(id){ return hhLaneOf(J[id])===L[0]; }).sort(function(a,b){ return ((J[a].order||0)-(J[b].order||0))||String(J[a].label).localeCompare(String(J[b].label)); })}; }).filter(function(L){ return L.ids.length; });
  const open=function(L){ return !!hhRmLane[rid+"|"+L.k]; }, anyOpen=lanes.some(open), th='padding:5px 6px;font-size:10.5px;font-weight:800;color:#475569;border-bottom:1px solid #e5e7eb;text-align:left;cursor:pointer;white-space:nowrap';
  let h='<div style="background:#fff;border-radius:12px;box-shadow:0 2px 10px rgba(43,122,120,0.10);overflow:auto"><table style="border-collapse:collapse;min-width:100%;font-size:11px"><tr><th style="'+th+';cursor:default"></th>';
  lanes.forEach(function(L){ h+='<th onclick="hhRmLaneToggle(\''+rid+'|'+L.k+'\')"'+(open(L)?' colspan="'+L.ids.length+'"':'')+' style="'+th+';background:#f8fafc;border-left:1px solid #e5e7eb">'+esc(L.name)+' · '+L.ids.length+' '+(open(L)?'▾':'▸')+'</th>'; });
  h+='</tr>';
  if(anyOpen){ h+='<tr><th style="'+th+';cursor:default"></th>'; lanes.forEach(function(L){ if(!open(L)){ h+='<th style="'+th+';border-left:1px solid #e5e7eb;cursor:default"></th>'; return; }
      L.ids.forEach(function(id,i){ const j=J[id]; h+='<th'+(mom?' onclick="hcOpen(\''+id+'\')"':'')+' style="'+th+';font-weight:700;max-width:110px;overflow:hidden;text-overflow:ellipsis'+(i?'':';border-left:1px solid #e5e7eb')+(hhEditId===id?';background:#e6f4f3':'')+'" title="'+esc(j.label)+'">'+esc((j.emoji||'☐')+' '+j.label)+'</th>'; }); }); h+='</tr>'; }
  const fut=(typeof hhRoomFuture==="function")?hhRoomFuture():null;   // HH_PEOPLE: the plan preview's next 4 weeks (house.js), or null
  for(let n=t-(hhRmLong?56:14);n<=t+(fut?fut.length-1:0);n++){ const iso=_hhIsoOf(n), now=iso===today, cell=function(id){ return n>t?(fut[n-t][id]||null):hhRmCell(id,iso,today,S,rc); };
    h+='<tr style="'+(now?'background:#e6f4f3':n>t?'background:#fbfdff':'')+'"><td style="padding:4px 6px;font-weight:800;white-space:nowrap;border-bottom:1px solid #f1f5f4;color:'+(now?'#2B7A78':'#6b6560')+'">'+DL[_hhDow(iso)]+' '+(+iso.slice(5,7))+'/'+(+iso.slice(8))+'</td>';
    lanes.forEach(function(L){
      if(!open(L)){ const sq=L.ids.map(function(id){ return cell(id); }).filter(Boolean); h+='<td onclick="hhRmLaneToggle(\''+rid+'|'+L.k+'\')" style="padding:4px 6px;border-bottom:1px solid #f1f5f4;border-left:1px solid #e5e7eb;cursor:pointer">'+sq.slice(0,6).map(function(c){ return _hhRmSq(c,false); }).join(' ')+(sq.length>6?' <span style="font-size:10px;color:var(--muted)">+'+(sq.length-6)+'</span>':'')+'</td>'; return; }
      L.ids.forEach(function(id,i){ h+='<td'+(mom?' onclick="hcOpen(\''+id+'\')"':'')+' style="padding:4px 6px;border-bottom:1px solid #f1f5f4;'+(i?'':'border-left:1px solid #e5e7eb;')+(mom?'cursor:pointer':'')+'">'+_hhRmSq(cell(id),true)+'</td>'; }); });
    h+='</tr>'; }
  h+='</table></div><div style="display:flex;gap:6px;align-items:center;margin-top:6px"><span style="font-size:11px;color:var(--muted);flex:1">Past days are the record: ✓ = done that day; pale = it was theirs that day and not checked (every-few-weeks chores show only their ✓ for now). Today is from the lists as they are now.'+((fut&&typeof hpGridNoteHTML==="function")?hpGridNoteHTML():'')+'</span>'+_hhBtn("hhRmLongToggle()",hhRmLong?'Show 2 weeks':'Show 8 weeks',false,'#64748b')+'</div>';
  if(hhEditId&&ids.indexOf(hhEditId)>=0&&J[hhEditId]){ const j=J[hhEditId]; h+='<div style="background:#fff;border-radius:12px;box-shadow:0 2px 10px rgba(43,122,120,0.10);margin-top:10px;padding:9px 12px"><div style="font-size:13px;font-weight:800">'+esc((j.emoji||'☐')+' '+j.label)+' <span style="font-weight:600;color:var(--muted);font-size:11px">'+esc(hhWhoName(j.who))+' · '+esc(cadLabel(hhPlanCad(j)))+'</span></div>'+(typeof _hhGiveOrRot==="function"?_hhGiveOrRot(hhEditId):'')+hhEditHTML(hhEditId)+'</div>'; }   // HH_EDITOR: the one that exists
  return h;
}
function hhRmHouseHTML(byRoom){
  let h='<div style="background:#fff;border-radius:12px;box-shadow:0 2px 10px rgba(43,122,120,0.10);overflow:hidden"><div style="padding:9px 12px;font-size:14px;font-weight:800">🏠 Whole house <span style="font-size:11px;font-weight:600;color:var(--muted)">most behind first · on time over 8 weeks · late = past its usual gap now</span></div>';
  hhHouseOrder(byRoom).forEach(function(x){ const s=x.s, none=x.id==="__none", r=none?null:hhRoomList().find(function(y){ return y[0]===x.id; }), col=s.pct===null?'#cbd5e1':s.pct>=80?'#16a34a':s.pct>=50?'#d97706':'#dc2626';
    h+='<div onclick="hhRmGo(\''+x.id+'\')" style="display:flex;align-items:center;gap:8px;padding:8px 12px;border-top:1px solid #eef2f0;cursor:pointer;font-size:12.5px"><span>'+(none?'❔':hhRoomEmoji(x.id))+'</span><span style="flex:0 0 38%;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+esc(none?'No room':r[1])+'</span>'
      +'<div style="flex:1;height:8px;border-radius:4px;background:#eef2f0;overflow:hidden"><div style="height:8px;width:'+(s.pct||0)+'%;background:'+col+'"></div></div><span style="width:34px;text-align:right;font-size:11px;font-weight:800">'+(s.pct===null?'–':s.pct+'%')+'</span>'
      +(s.late?_hhChip(s.late+' late','#fee2e2','#991b1b'):'')+_hhChip(s.mins+' min/wk','#f3f4f6','#475569')+'</div>'; });
  return h+'</div>';
}
function hhRmEditHTML(){
  if(typeof momHere==="function"&&!momHere()) return '';
  const G=hhRoomGroups(), L=hhRoomList(), gids=G.map(function(g){ return g[0]; }), inp='padding:5px 7px;border:1.5px solid #e5e7eb;border-radius:8px;font-size:12.5px;font-family:\'DM Sans\',sans-serif;box-sizing:border-box';
  const sel=function(cur,on,idAttr){ return '<select'+(idAttr?' id="'+idAttr+'"':'')+(on?' onchange="'+on+'"':'')+' style="'+inp+'">'+G.map(function(g){ return '<option value="'+esc(g[0])+'"'+(g[0]===cur?' selected':'')+'>'+esc(g[1])+'</option>'; }).join('')+'<option value=""'+(gids.indexOf(cur)<0?' selected':'')+'>No group</option></select>'; };
  const room=function(r){ return '<div style="display:flex;gap:5px;align-items:center;flex-wrap:wrap;padding:5px 12px 5px 22px;border-top:1px solid #f3f4f6"><input value="'+esc(hhRoomEmoji(r[0]))+'" onchange="hhRoomSet(\''+r[0]+'\',\'emoji\',this.value)" style="'+inp+';width:44px;text-align:center"><input value="'+esc(r[1])+'" onchange="hhRoomSet(\''+r[0]+'\',\'name\',this.value)" style="'+inp+';flex:1;min-width:120px">'
    +sel(r[2],"hhRoomSet('"+r[0]+"','floor',this.value)")+_hhBtn("hhRoomStep('"+r[0]+"',-1)",'▲',false,'#64748b')+_hhBtn("hhRoomStep('"+r[0]+"',1)",'▼',false,'#64748b')+_hhBtn("hhRoomRemove('"+r[0]+"')",'🗑',false,'#b91c1c')+'</div>'; };
  let h='<div style="background:#fff;border-radius:12px;box-shadow:0 2px 10px rgba(43,122,120,0.10);overflow:hidden;margin-bottom:10px"><div style="padding:9px 12px"><div style="font-size:14px;font-weight:800">🚪 Edit rooms</div><div style="font-size:11px;color:var(--muted);margin-top:2px">Your family’s rooms and the groups they fold into. Removing a room never touches a chore: its chores show under No room until you move them in ✎ Edit.'+(hhRoomsStored()?'':' The first change copies today’s list in, same rooms, so nothing moves.')+'</div></div>';
  G.forEach(function(g){ h+='<div style="display:flex;gap:5px;align-items:center;padding:7px 12px;border-top:2px solid #e6f4f3"><span>'+hhGroupEmoji(g[0])+'</span><input value="'+esc(g[1])+'" onchange="hhGroupSet(\''+g[0]+'\',\'name\',this.value)" style="'+inp+';flex:1;font-weight:800">'+_hhBtn("hhGroupStep('"+g[0]+"',-1)",'▲',false,'#64748b')+_hhBtn("hhGroupStep('"+g[0]+"',1)",'▼',false,'#64748b')+_hhBtn("hhGroupRemove('"+g[0]+"')",'🗑',false,'#b91c1c')+'</div>';
    L.filter(function(r){ return r[2]===g[0]; }).forEach(function(r){ h+=room(r); }); });
  const loose=L.filter(function(r){ return gids.indexOf(r[2])<0; }); if(loose.length){ h+='<div style="padding:7px 12px;border-top:2px solid #e6f4f3;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.4px;color:#6b6560">No group</div>'; loose.forEach(function(r){ h+=room(r); }); }
  h+='<div style="display:flex;gap:5px;align-items:center;flex-wrap:wrap;padding:9px 12px;border-top:2px solid #e6f4f3"><input id="hh-rm-new" placeholder="New room" style="'+inp+';flex:1;min-width:120px">'+sel(gids[0]||"","","hh-rm-newg")+_hhBtn("hhRoomAdd(document.getElementById('hh-rm-new').value,document.getElementById('hh-rm-newg').value)",'+ Add room',true)+'</div>'
    +'<div style="display:flex;gap:5px;align-items:center;flex-wrap:wrap;padding:0 12px 10px"><input id="hh-rm-newgrp" placeholder="Another group (Outside, Garage…)" style="'+inp+';flex:1;min-width:120px">'+_hhBtn("hhGroupAdd(document.getElementById('hh-rm-newgrp').value)",'+ Add group',false)+'</div>';
  return h+'</div>';
}
function hhRoomsPageHTML(){
  const J=hhJobs(); if(!Object.keys(J).length) return '<div style="background:#fff;border-radius:12px;box-shadow:0 2px 10px rgba(43,122,120,0.10);padding:10px 12px;font-size:12px;color:var(--muted)">Bring in every chore on 📋 Review first.</div>';
  const mom=(typeof momHere!=="function")||momHere(), G=hhRoomGroups(), L=hhRoomList(), gids=G.map(function(g){ return g[0]; }), byRoom=hhRoomChores();
  if(hhRmSel&&hhRmSel!=="__none"&&!L.some(function(r){ return r[0]===hhRmSel; })) hhRmSel="";
  if(hhRmSel==="__none"&&!byRoom.__none.length) hhRmSel="";
  const pill=function(on,txt,click,color){ color=color||'#2B7A78'; return '<button onclick="'+click+'" style="padding:6px 11px;border-radius:20px;border:1.5px solid '+(on?color:'#cbd5e1')+';background:'+(on?color:'#fff')+';color:'+(on?'#fff':'#334155')+';font-size:12px;font-weight:800;cursor:pointer;font-family:\'DM Sans\',sans-serif;white-space:nowrap">'+txt+'</button>'; };
  const chip=function(r){ return pill(hhRmSel===r[0],hhRoomEmoji(r[0])+' '+esc(r[1])+' <span style="opacity:.7;font-weight:600">'+byRoom[r[0]].length+'</span>',"hhRmGo('"+r[0]+"')",'#0e7490'); };
  const isOpen=function(g,i){ return hhRmFold[g]===undefined?i===0:!!hhRmFold[g]; };
  let h='<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-bottom:6px">';
  G.forEach(function(g,i){ const o=isOpen(g[0],i); h+=pill(o,hhGroupEmoji(g[0])+' '+esc(g[1])+' '+(o?'▾':'▸'),"hhRmFoldToggle('"+g[0]+"',"+o+")",'#475569'); });
  L.filter(function(r){ return gids.indexOf(r[2])<0; }).forEach(function(r){ h+=chip(r); });   // rooms in no group sit in the top row
  if(byRoom.__none.length) h+=pill(hhRmSel==="__none",'❔ No room <span style="opacity:.7;font-weight:600">'+byRoom.__none.length+'</span>',"hhRmGo('__none')",'#b45309');
  h+=pill(!hhRmSel&&!hhRmEditing,'🏠 Whole house',"hhRmGo('')")+(mom?pill(hhRmEditing,'🚪 Edit rooms',"hhRmEditToggle()",'#6B4C93'):'')+'</div>';
  G.forEach(function(g,i){ if(!isOpen(g[0],i)) return; const rs=L.filter(function(r){ return r[2]===g[0]; }); h+='<div style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:6px;padding-left:6px">'+(rs.length?rs.map(chip).join(''):'<span style="font-size:11px;color:var(--muted)">No rooms in '+esc(g[1])+' yet.</span>')+'</div>'; });
  if(hhRmEditing&&mom) return h+hhRmEditHTML();
  if(!hhRmSel) return h+hhRmHouseHTML(byRoom)+(typeof hhRoomsTailHTML==="function"?hhRoomsTailHTML():'');
  const none=hhRmSel==="__none", r=none?null:L.find(function(x){ return x[0]===hhRmSel; }), ids=byRoom[hhRmSel]||[], s=hhRoomStats(ids);
  h+='<div style="display:flex;align-items:baseline;gap:8px;flex-wrap:wrap;margin:4px 2px 8px"><span style="font-size:16px;font-weight:800">'+(none?'❔ No room':hhRoomEmoji(r[0])+' '+esc(r[1]))+'</span><span style="font-size:12px;color:var(--muted);font-weight:700">'+s.n+' chore'+(s.n===1?'':'s')+' · '+s.mins+' min a week · on time '+(s.pct===null?'–':s.pct+'%')+'</span></div>';
  if(none) h+='<div style="font-size:11px;color:var(--muted);margin:-4px 2px 8px">These chores are filed under a room that is no longer on your list. Open ✎ Edit to give each one a room.</div>';
  if(mom&&typeof hcRoomToolsHTML==="function") h+=hcRoomToolsHTML(hhRmSel,ids);   // HH_CARD: 🔍 Checks · ⚙ Rules
  if(!ids.length) return h+'<div style="background:#fff;border-radius:12px;box-shadow:0 2px 10px rgba(43,122,120,0.10);padding:10px 12px;font-size:12px;color:var(--muted)">No chores in this room yet. Give a chore this room in its ✎ Edit.</div>';
  return h+hhRoomGridHTML(hhRmSel,ids)+(typeof hhRoomsTailHTML==="function"?hhRoomsTailHTML():'');
}
// HH_ROOMPAGE_END
// HH_CARD_START — the chore card, the room ⚙ Rules table and 🔍 Checks (Household by room, step 2 of DESIGN_household_rooms_2026-11-15
// §3.3 / §3.2 / §9; her picture 2026-11-11: the chore card is "like a subject card"). ONE editor for a chore: a 🗺 Rooms column title
// or square, ✎ Edit on every Household view and ＋ Add a chore (an empty card = the Add form's own draft, hhAdd) all open it. It opens
// like the subject card (a .ce-sheet over the page), drawn by renderHousehold only while open. Existing fields only, and every
// control calls the setter its old control calls, so a tap writes exactly what that control writes today: hhEditSet /
// hhEditCadMode_set / hhEditDay / hhCanToggle / hhSet / hhNote (✎ Edit, the Review pickers), hhGiveTo (Give to…), ktCleanToggle
// (→ cleaning day), hhDeleteForGood, the Add form's hhAdd* + hhAddSave, and for a kid's list-only fields (end date, clock time,
// after a meal, week of 4, the 🧺 tag) the Chores & Stars setters on the row's own list position (rtCad* / rtCfgSet, the same
// calls cpSetMeal and cpSetLaundry make) — under Take over only, when the lists come from this table. hcCtl draws each field once;
// the card and the room's ⚙ Rules table both call it. 🔍 Checks only reads. Mom only; nothing at boot, no listener, no timer.
let hcId="", hcScr=0, hcRm={};   // open card ("__add" = the Add draft) · its scroll · "<room>|rules" / "<room>|checks" unfolded
function hcMom(){ return typeof momHere!=="function"||momHere(); }
function hcOpen(id){ if(!hcMom()||!hhJobs()[id]) return; hcId=id; hcScr=0; hhGive=""; hhPick=""; hhRender(); }
function hcAdd(room){ if(!hcMom()) return; if(room&&hhRoomList().some(function(r){ return r[0]===room; })) hhAdd.room=room; hcId="__add"; hcScr=0; hhGive=""; hhRender(); }
function hcClose(){ hcId=""; hhGive=""; hhRender(); }
function hcAddSave(){ const id=hhAddSave(); if(id){ hcId=""; hhRender(); } return id; }
function hcKeep(el){ if(hcId&&el&&el.querySelector){ const b=el.querySelector(".hc-box"); if(b) b.scrollTop=hcScr; } }
function hcFold(k){ hcRm[k]=!hcRm[k]; hhRender(); }
function hcRulesOn(rid){ hcRm[rid+"|rules"]=true; hhRender(); }
// A kid's row where it stands on its list (Take over on): the slot / kid / position the Chores & Stars setters take.
function hcAt(id){ const j=hhJobs()[id]; if(!j||!hhIsKid(j.who)||!(typeof hhTakeoverOn==="function"&&hhTakeoverOn())) return null; let i=-1; (rtStepsFor(j.slot,j.who,true)||[]).forEach(function(st,k){ if(i<0&&st&&st._hh===id) i=k; }); return i<0?null:{s:j.slot,k:j.who,i:i}; }
function hcList(id,f,v){ if(!hcMom()) return null; const L=hcAt(id); if(!L) return null;
  if(f==="time") rtCadTime(L.s,L.k,L.i,v);
  else if(f==="to") rtCadWindow(L.s,L.k,L.i,"to",v);
  else if(f==="cycW") rtCadCycle(L.s,L.k,L.i,v);
  else if(f==="cycStart") rtCadCycleStart(L.s,L.k,L.i,v);
  else if(f==="meal"){ if(v) rtCfgSet(L.s,L.k,L.i,"since",routineDateISO(_todayDay)||""); rtCfgSet(L.s,L.k,L.i,"meal",v||""); }   // = cpSetMeal
  else if(f==="laundry") rtCfgSet(L.s,L.k,L.i,"laundry",(typeof v==="string")?(LAUNDRY_KIDMOVE_FROM[v]?v:null):!!v);              // = cpSetLaundry
  else return null; hhRender(); return true; }
// "Same as the row above" on the ⚙ Rules who-can pill: this chore's can only, through the setter 👥 Can do uses.
function hcCanSame(id,above){ const a=hhJobs()[above]; if(!a||!hhJobs()[id]) return; hhSet(id,"can",hhCanOf(a)); }
const HC_MODES=[["daily","Daily"],["wk","On these days"],["nd","Every N days"],["2w","Every 2 weeks"],["28d","Every 4 weeks"],["42d","Every 6 weeks"],["asneeded","As needed"],["once","One time"]];
const HC_ADDWHEN=HH_ADD_MODES.map(function(x){ return x[0]==="days"?[x[0],"On these days"]:x; });   // the Add form's own modes
function hcIni(w){ const n=hhWhoName(w), a=n.charAt(0).toUpperCase(); return HH_WHO.some(function(x){ return x!==w&&x!=="grab"&&hhWhoName(x).charAt(0).toUpperCase()===a; })?n.slice(0,2):a; }
function _hcChip(on,txt,click,t){ return '<button class="ce-chip'+(on?' sel':'')+'"'+(click?' onclick="'+click+'"':'')+' style="padding:'+(t?'1px 6px;font-size:10.5px':'4px 10px;font-size:11.5px')+(click?'':';cursor:default')+'">'+txt+'</button>'; }
function _hcSel(on,opts,cur){ return '<select onchange="'+on+'" style="padding:2px 3px;border:1px solid var(--border);border-radius:7px;font-size:11px;font-family:\'DM Sans\',sans-serif;max-width:130px">'+opts.map(function(o){ return '<option value="'+esc(o[0])+'"'+(String(o[0])===String(cur)?' selected':'')+'>'+esc(o[1])+'</option>'; }).join('')+'</select>'; }
function _hcIn(on,val,typ,w,extra){ return '<input type="'+(typ||'text')+'" class="ce-sheet-input" value="'+esc(val==null?'':val)+'" onchange="'+on+'" style="flex:none;width:'+(w||'auto')+';padding:5px 8px"'+(extra||'')+'>'; }
function hcSlots(j){ return j.who==="grab"?[]:hhIsKid(j.who)?SL_SLOTS.map(function(sl){ return [sl,(typeof SL_SLBL!=="undefined"&&SL_SLBL[sl])||sl]; }):HH_MC_SLOTS; }
// ONE control per field. id "" = the Add draft (hhAdd, the Add form's setters); t = the ⚙ Rules table's compact form of the same
// control (same setter). Returns "" where a field does not apply to this chore, as on ✎ Edit.
function hcCtl(id,f,t){
  const add=!id, j=add?hhAdd:hhJobs()[id]; if(!j) return ""; const q="'"+id+"'", kid=hhIsKid(j.who);
  const E=function(fl,v){ return add?"hhAddSet('"+fl+"',"+v+")":"hhEditSet("+q+",'"+fl+"',"+v+")"; };
  const chips=function(opts,cur,fl){ return opts.map(function(o){ const v=typeof o[0]==="number"?o[0]:"'"+o[0]+"'"; return _hcChip(String(o[0])===String(cur),esc(o[1]),E(fl,v),t); }).join(''); };
  const sel=function(opts,cur,fl){ return _hcSel(add?"hhAddSet('"+fl+"',this.value)":"hhEditSet("+q+",'"+fl+"',this.value)",opts,cur); };
  const rooms=hhRoomList().map(function(r){ return [r[0],(r[2]==="up"?"⬆️ ":r[2]==="down"?"⬇️ ":"")+r[1]]; });
  switch(f){
    case "label": return add?'<input class="ce-sheet-input" id="hh-add-label" value="'+esc(j.label)+'" placeholder="What is the chore?" onchange="hhAddField(\'label\',this)">':'<input class="ce-sheet-input" value="'+esc(j.label||'')+'" onchange="hhEditField('+q+',\'label\',this)">';
    case "emoji": return '<input class="ce-sheet-input"'+(add?' id="hh-add-emoji" onchange="hhAddField(\'emoji\',this)"':' onchange="hhEditField('+q+',\'emoji\',this)"')+' value="'+esc(j.emoji||'')+'" placeholder="🧽" style="flex:none;width:48px;text-align:center">';
    case "emojis": return '<div style="display:flex;gap:3px;flex-wrap:wrap;margin-top:6px">'+HH_EMOJI.map(function(e){ return '<button onclick="'+E("emoji","'"+e+"'")+'" style="width:30px;height:28px;border-radius:7px;border:1.5px solid '+(e===j.emoji?'#2B7A78':'#e5e7eb')+';background:'+(e===j.emoji?'#e6f4f3':'#fff')+';font-size:16px;padding:0;cursor:pointer">'+e+'</button>'; }).join('')+'</div>';
    case "pts": if(add?!kid:!(kid||j.who==="grab")) return ""; return add?'<input type="number" class="ce-sheet-input" id="hh-add-pts" value="'+esc(j.pts)+'" placeholder="⭐" min="0" onchange="hhAddField(\'pts\',this)" style="flex:none;width:64px">':_hcIn("hhEditField("+q+",'pts',this)",j.pts||0,"number","64px",' min="0" max="500" title="stars"');
    case "room": { const cur=add?j.room:hhRoomOf(j); return t?sel(rooms,cur,"room"):chips(rooms,cur,"room"); }
    case "area": { const o=Object.keys(HH_AREAS).map(function(k){ return [k,HH_AREAS[k][0]+" "+HH_AREAS[k][1]]; }); return add?chips([["","Guess ("+HH_AREAS[hhGuessArea(j.label,j.slot,"")][1]+")"]].concat(o),j.area,"area"):chips(o,j.area||"cleaning","area"); }
    case "level": { if(add) return chips([[0,"Now (Level "+hhLevelCurFor(j.who)+")"],[1,"Level 1"],[2,"Level 2"],[3,"Level 3"]],j.level,"level"); const o=[[1,"Level 1"],[2,"Level 2"],[3,"Level 3"]]; return t?sel(o,hhLevelOf(j),"level"):chips(o,hhLevelOf(j),"level"); }
    case "slot": { const o=hcSlots(j); if(!o.length) return ""; const cur=j.slot||""; return t?sel(o,cur,"slot"):chips(o,cur,"slot"); }
    case "when": {
      if(add){ const md=hhAdd.kind!=="chore"?hhAdd.kind:(/^wk:/.test(j.cad||"")?"days":(HC_ADDWHEN.some(function(x){ return x[0]===j.cad; })?j.cad:"daily"));
        return HC_ADDWHEN.map(function(x){ return _hcChip(md===x[0],x[1],(hhAdd.kind!=="chore"?"hhAddSet('kind','chore');":"")+"hhAddCadMode('"+x[0]+"')"); }).join('')+_hcChip(md==="once","One time","hhAddSet('kind','once')")+_hcChip(md==="project","🧰 Project","hhAddSet('kind','project')"); }
      const md=hhEditCadMode(j.cad), o=HC_MODES.map(function(x){ return [x[0],x[0]==="nd"&&md==="nd"?"Every "+parseInt(j.cad,10)+" days":x[1]]; });
      if(j.cad==="none") o.unshift(["none","Not scheduled"]);
      return t?_hcSel("hhEditCadMode_set("+q+",this.value)",o,j.cad==="none"?"none":md):o.map(function(x){ return x[0]==="none"?_hcChip(true,x[1],"",t):_hcChip(md===x[0],x[1],"hhEditCadMode_set("+q+",'"+x[0]+"')",t); }).join(''); }
    case "days": { if(add){ if(hhAdd.kind!=="chore"||!/^wk:/.test(j.cad||"")) return ""; const d=cadChipDays(j.cad); return CAD_DAYL.map(function(n,i){ return _hcChip(d.indexOf(i)>=0,n,"hhAddDay("+i+")"); }).join(''); }
      if(hhEditCadMode(j.cad)!=="wk") return ""; const d=hhEditDays(j.cad); return CAD_DAYL.map(function(n,i){ return _hcChip(d.indexOf(i)>=0,t?n.charAt(0):n,"hhEditDay("+q+","+i+")",t); }).join(''); }
    case "every": return (add||hhEditCadMode(j.cad)!=="nd")?"":'Every '+_hcIn("hhEditSet("+q+",'cad',this.value+'d')",parseInt(j.cad,10)||3,"number","60px",' min="1" max="99"')+' days';
    case "from": return add?"":_hcIn("hhEditField("+q+",'from',this)",j.from,"date");
    case "to": case "time": case "cycle": case "meal": case "laundry": {
      if(add||!kid) return ""; const L=hcAt(id), ro=function(v){ return v?'<span style="font-size:12px;font-weight:700">'+esc(v)+'</span> ':''; };
      if(f==="meal"){ const ms=Object.keys(MEAL_SLOT).filter(function(m){ return MEAL_SLOT[m]===j.slot; }); if(!ms.length) return ""; if(!L) return ro(j.meal?"After "+mealCfg()[j.meal]:"");
        return ms.map(function(m){ const on=j.meal===m; return _hcChip(on,MEAL_EMOJI[m]+" After "+esc(mealCfg()[m]),"hcList("+q+",'meal','"+(on?"":m)+"')"); }).join(''); }
      if(f==="laundry"){ if(!((typeof j.laundry==="string"&&j.laundry)||j.laundry===true||j.laundry===false||(typeof laundryLooseWord==="function"&&laundryLooseWord(j.label)))) return ""; const on=typeof laundryStarts==="function"&&laundryStarts(j), cur=(typeof j.laundry==="string"&&LAUNDRY_KIDMOVE_FROM[j.laundry])?j.laundry:"";
        if(!L) return ro(on?"🧺 starts a load":cur?"🧺 "+cur:""); return _hcChip(on,"🧺 Starts a load","hcList("+q+",'laundry',"+(on?"false":"true")+")")+" "+_lkmSelectHTML(cur,"hcList("+q+",'laundry',this.value)"); }
      if(f==="cycle"){ const cw=parseInt(j.cycW,10)||0; if(!L) return ro(cw?"week "+cw+" of "+(j.cycN||4):"");
        return [0,1,2,3,4].map(function(w){ return _hcChip(w===cw,w?"Wk "+w:"Every week","hcList("+q+",'cycW',"+w+")"); }).join('')+(cw?' <span style="font-size:11px;color:var(--muted)">week 1 starts</span> '+_hcIn("hcList("+q+",'cycStart',this.value)",j.cycStart,"date"):''); }
      if(!L) return ro(j[f]); return _hcIn("hcList("+q+",'"+f+"',this.value)",j[f],f==="to"?"date":"text",f==="time"?"110px":"",f==="time"?' placeholder="e.g. 6 AM"':''); }
    case "who": if(add) return chips(HH_WHO.filter(function(w){ return w!=="grab"; }).map(function(w){ return [w,hhWhoName(w)]; }),j.who,"who");
      return '<span style="font-size:13px;font-weight:800;margin-right:6px">'+esc(hhWhoName(j.who))+'</span>'+(j.who!=="grab"?hhGiveBtn(id):'');
    case "can": { if(j.who==="grab") return ""; const c=add?[j.who].concat(Object.keys(j.can||{}).filter(function(w){ return j.can[w]; })):hhCanOf(j);
      return HH_WHO.filter(function(w){ return w!=="grab"; }).map(function(w){ const own=w===j.who; return _hcChip(c.indexOf(w)>=0,t?hcIni(w):esc(hhWhoName(w))+(own?" (usually)":""),own?"":(add?"hhAddCan('"+w+"')":"hhCanToggle("+q+",'"+w+"')"),t).replace('<button','<button title="'+esc(hhWhoName(w))+'"'); }).join(''); }
    case "minutes": { if(add) return ""; const m=hhMinutesOf(j); if(!t) return _hcIn("hhEditField("+q+",'minutes',this)",m,"number","70px",' min="1" max="240"')+' min';
      const st=[2,3,5,10,15,20,30,45,60]; if(st.indexOf(m)<0) st.push(m); return sel(st.sort(function(a,b){ return a-b; }).map(function(x){ return [x,x+" min"]; }),m,"minutes"); }
    case "note": return add?"":'<input class="ce-sheet-input" value="'+esc(j.note||'')+'" placeholder="Note" onchange="hhNote('+q+',this)">';
  }
  return "";
}
function hcCardHTML(){
  if(!hcId||!hcMom()) return ""; const add=hcId==="__add", id=add?"":hcId, J=hhJobs(), j=add?hhAdd:J[id]; if(!j){ hcId=""; return ""; }
  const kid=hhIsKid(j.who), tk=typeof hhTakeoverOn==="function"&&hhTakeoverOn();
  const sec=function(n,l){ return '<div style="margin-top:16px;padding-top:8px;border-top:1px solid var(--border);font-size:12px;font-weight:800;color:#2B7A78">'+n+' · '+l+'</div>'; };
  const lbl=function(l,x){ return x?'<div class="ce-sheet-lbl" style="margin:10px 0 4px">'+l+'</div><div style="display:flex;gap:4px;flex-wrap:wrap;align-items:center">'+x+'</div>':''; };
  let h='<div class="ce-sheet open" onclick="if(event.target===this)hcClose()"><div class="ce-sheet-box hc-box" onscroll="hcScr=this.scrollTop">';
  h+='<div style="display:flex;align-items:center;gap:8px"><div class="ce-sheet-title" style="flex:1;margin-bottom:0">'+(add?'＋ Add a chore':esc((j.emoji||'☐')+' '+j.label))+'</div>'+(!add&&j.status==="retired"?_hhChip('Retired','#f3f4f6','#64748b'):'')+'<button onclick="hcClose()" style="border:1px solid var(--border);background:#fff;border-radius:8px;width:30px;height:30px;font-size:15px;cursor:pointer;color:var(--muted)">✕</button></div>';
  h+=sec(1,'Basics')+'<div style="display:flex;gap:6px;margin-top:8px">'+hcCtl(id,"emoji")+hcCtl(id,"label")+hcCtl(id,"pts")+'</div>'+hcCtl(id,"emojis");
  h+=lbl('Room',hcCtl(id,"room"))+lbl(add?'Area — this decides the gate':'Area',hcCtl(id,"area"))+lbl('Level',hcCtl(id,"level"));
  h+=sec(2,'When')+lbl('How often',hcCtl(id,"when"))+lbl('Days',hcCtl(id,"days"))+lbl('',hcCtl(id,"every"));
  if(add&&hhAdd.kind!=="chore") h+='<div style="font-size:11px;color:var(--muted);margin-top:6px">'+(hhAdd.kind==="once"?'Due every day until it is checked one time, then it leaves the list. It waits in ☑️ Once until you send it.':'Never due on its own. Lives on 🧰 Projects with a target, a plan, steps and a work log.')+'</div>';
  h+=lbl('Week of 4',hcCtl(id,"cycle"))+lbl('Starts',hcCtl(id,"from"))+lbl('Ends',hcCtl(id,"to"))+lbl('Time of day',hcCtl(id,"slot"))+lbl('Clock time',hcCtl(id,"time"))+lbl('After a meal',hcCtl(id,"meal"))+lbl('Laundry',hcCtl(id,"laundry"));
  if(!add&&kid&&!hcAt(id)) h+='<div style="font-size:11px;color:var(--muted);margin-top:6px">'+(tk?'End date, clock time, meal and week of 4 change while the chore is on '+esc(hhWhoName(j.who))+'’s list.':'End date, clock time, meal and week of 4 are set on Chores &amp; Stars ▸ Lists until Take over.')+'</div>';
  h+=sec(3,'Who')+lbl(add?'Usually':'Usually (the owner)',hcCtl(id,"who"))+(add?'':_hhGiveOrRot(id))+lbl('Who else can do it',hcCtl(id,"can"));
  if(!add&&j.rot){ const g=hhRotGroup(j.slot,j.rot).map(function(x){ return hhWhoName(x.kid); }), per=(HH_ROT_PERIODS.find(function(p){ return p[0]===hhRotPeriodOf(j.rot); })||[0,"daily"])[1];
    h+='<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-top:8px;font-size:12px">🔁 Takes turns'+(g.length>1?' with '+esc(g.filter(function(n){ return n!==hhWhoName(j.who); }).join(', ')):'')+' · '+esc(String(per).toLowerCase())+'<span style="flex:1"></span>'+_hhBtn("hcId='';hhGo('rot')",'🔁 Rotations',false,'#c2410c')+'</div>'; }
  if(!add) h+=sec(4,'How long')+lbl('Minutes',hcCtl(id,"minutes"));
  if(!add){ const st=hhStats(j); let last=st.last, by=j.who==="grab"?"":j.who; if(j.lastDone&&/^\d{4}-\d{2}-\d{2}$/.test(j.lastDone)&&(!last||j.lastDone>last)){ last=j.lastDone; by=j.lastBy||""; }
    h+=sec(5,'History')+'<div style="font-size:12.5px;font-weight:700;margin-top:8px">'+(last?'Last done '+(+last.slice(5,7))+'/'+(+last.slice(8))+(by?' by '+esc(hhWhoName(by)):''):'Not done in the last 8 weeks')+'</div>'
      +'<div style="display:flex;gap:5px;flex-wrap:wrap;margin-top:6px">'+_hhChip('on time 4 wk '+st.done4+'/'+st.due4+' ('+hhPct(st.done4,st.due4)+')','#f3f4f6','#1f2937')+_hhChip('8 wk '+st.done8+'/'+st.due8+' ('+hhPct(st.done8,st.due8)+')','#f3f4f6','#1f2937')+_hhChip('late '+st.late8,st.late8?'#fef3c7':'#f3f4f6',st.late8?'#92400e':'#64748b')+(st.miss8?_hhChip('missed '+st.miss8,'#fee2e2','#991b1b'):'')+hhNeedChip(j)+'</div>'+lbl('Note',hcCtl(id,"note")); }
  h+=sec(add?4:6,add?'Save':'Actions')+'<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px">';
  if(add) h+='<span style="flex:1;font-size:11px;color:var(--muted)">One row in the table; on the list right away under Take over.</span>'+_hhBtn("hcClose()",'Cancel',false,'#94a3b8')+_hhBtn("hcAddSave()",'Save',true,'#2B7A78');
  else if(j.status==="retired") h+=_hhBtn("hhSet('"+id+"','verdict','keep')",'↩ Bring back',false,'#2B7A78')+_hhBtn("hhDeleteForGood('"+id+"')",'🗑 Delete for good',false,'#b91c1c');
  else h+=(j.who!=="grab"?hhGiveBtn(id):'')+_hhBtn("ktCleanToggle('"+id+"')",j.cleanDay?'🧽 Off the cleaning day ('+esc(j.cleanDay.slice(5))+')':'🧽 Send to the next cleaning day',!!j.cleanDay,'#16a34a')+_hhBtn("hhSet('"+id+"','verdict','retire')",'🚫 Retire',false,'#64748b');
  return h+'</div></div></div>';
}
// 🔍 Checks: what this room's chores say, each line opening the card. Read only. (Checks that need the engine — limits, turns — are step 3.)
function hcChecks(rid,ids){ const J=hhJobs(), out=[], line=function(k,txt,id){ out.push({k:k,txt:txt,id:id}); };
  if(rid!=="__none"&&rid!=="any"&&!ids.some(function(id){ return /^(wk:|sat|sun)/.test(hhPlanCad(J[id])); })) line("weekly","No weekly chore owns this room","");
  const one=ids.filter(function(id){ const j=J[id]; return j.who!=="grab"&&hhCanOf(j).length<2; }).length;
  if(one) out.push({k:"one",txt:one+(one===1?' chore':' chores')+' only one person can do — fill in who-can in ⚙ Rules',id:"",rules:1});
  if(typeof ktOverlaps==="function") ktOverlaps(ids).forEach(function(o){ line("twice",'Might be the same chore twice: '+J[o[1]].label,o[0]); line("twice",'Might be the same chore twice: '+J[o[0]].label,o[1]); });
  if(rid!=="__none") ids.forEach(function(id){ if(!J[id].room) line("guess",'No room saved — here by a guess from the words',id); });
  ids.forEach(function(id){ const j=J[id]; if(!hhLevelOut(j)) line("level",'Level '+hhLevelOf(j)+' — above '+hhWhoName(j.who)+'’s Level '+hhLevelCurFor(j.who)+', not on a list yet',id); });
  return out; }
function hcRulesHTML(rid,ids){ const J=hhJobs(), th='padding:4px 6px;font-size:10px;font-weight:800;color:#475569;text-align:left;white-space:nowrap;border-bottom:1px solid #e5e7eb';
  const rows=ids.slice().sort(function(a,b){ return (HH_LANES.findIndex(function(L){ return L[0]===hhLaneOf(J[a]); })-HH_LANES.findIndex(function(L){ return L[0]===hhLaneOf(J[b]); }))||((J[a].order||0)-(J[b].order||0))||String(J[a].label).localeCompare(String(J[b].label)); });
  let h='<div style="background:#fff;border-radius:12px;box-shadow:0 2px 10px rgba(43,122,120,0.10);overflow:auto;margin-bottom:10px"><table style="border-collapse:collapse;min-width:100%;font-size:11px"><tr>'+['Chore','How often','Minutes','Who can','Time of day','Level','Room'].map(function(x){ return '<th style="'+th+'">'+x+'</th>'; }).join('')+'</tr>';
  rows.forEach(function(id,n){ const j=J[id], td='<td style="padding:4px 6px;border-bottom:1px solid #f1f5f4;vertical-align:top">', up=n&&J[rows[n-1]].who!=="grab"&&j.who!=="grab";
    h+='<tr>'+td+'<span onclick="hcOpen(\''+id+'\')" style="cursor:pointer;font-weight:800;white-space:nowrap">'+esc((j.emoji||'☐')+' '+j.label)+'</span><div style="font-size:10px;color:var(--muted)">'+esc(hhWhoName(j.who))+'</div></td>'
      +td+hcCtl(id,"when",1)+'<div style="margin-top:2px">'+hcCtl(id,"days",1)+'</div></td>'+td+hcCtl(id,"minutes",1)+'</td>'
      +td+'<span style="white-space:nowrap">'+hcCtl(id,"can",1)+(up?' '+_hcChip(false,'↑ same',"hcCanSame('"+id+"','"+rows[n-1]+"')",1).replace('<button','<button title="Same people as the row above"'):'')+'</span></td>'
      +td+hcCtl(id,"slot",1)+'</td>'+td+hcCtl(id,"level",1)+'</td>'+td+hcCtl(id,"room",1)+'</td></tr>'; });
  return h+'</table></div>'; }
function hcRoomToolsHTML(rid,ids){ const C=hcChecks(rid,ids), ro=!!hcRm[rid+"|rules"], co=!!hcRm[rid+"|checks"]; if(!C.length&&!ids.length) return "";
  let h='<div style="display:flex;gap:6px;flex-wrap:wrap;margin:-2px 2px 8px">'+(C.length?_hhBtn("hcFold('"+rid+"|checks')",'🔍 Checks ('+C.length+') '+(co?'▾':'▸'),co,'#b45309'):'')+(ids.length?_hhBtn("hcFold('"+rid+"|rules')",'⚙ Rules '+(ro?'▾':'▸'),ro,'#475569'):'')+'</div>';
  if(co&&C.length){ const J=hhJobs(); h+='<div style="background:#fff;border-radius:12px;box-shadow:0 2px 10px rgba(43,122,120,0.10);margin-bottom:10px;overflow:hidden">'+C.map(function(c){ const j=c.id?J[c.id]:null;
      return '<div onclick="'+(c.id?"hcOpen('"+c.id+"')":c.rules?"hcRulesOn('"+rid+"')":"hcAdd('"+rid+"')")+'" style="display:flex;gap:8px;align-items:center;padding:7px 12px;border-top:1px solid #eef2f0;cursor:pointer;font-size:12px"><span style="font-weight:800;white-space:nowrap">'+(j?esc((j.emoji||'☐')+' '+j.label):c.rules?'👥 Who can':'🚪 This room')+'</span><span style="flex:1;color:#92400e">'+esc(c.txt)+'</span><span style="color:var(--muted)">'+(j||c.rules?'›':'＋')+'</span></div>'; }).join('')+'</div>'; }
  if(ro&&ids.length) h+=hcRulesHTML(rid,ids);
  return h; }
// HH_CARD_END
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
