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
function hhRotOpen(id){ const j=hhJobs()[id]; if(!j||!hhIsKid(j.who)) return; if(typeof _hhRotDone==="function"&&_hhRotDone(j.rot)) return; /* HOUSETURNS_UI: switched → the card */ hhRot={id:id,kids:{},period:j.rot?hhRotPeriodOf(j.rot):"daily"}; hhRot.kids[j.who]=true; if(j.rot){ const G=hhRotGroups()[j.slot+"|"+j.rot]; if(G) G.members.forEach(function(m){ hhRot.kids[m.kid]=true; }); } hhGive=""; hhRender(); }
function hhRotClose(){ hhRot={id:"",kids:{},period:"daily"}; hhRender(); }
function hhRotKid(kid){ const j=hhJobs()[hhRot.id]; if(!j||kid===j.who) return; hhRot.kids[kid]=!hhRot.kids[kid]; hhRender(); }
function hhRotPeriod(p){ if(HH_ROT_PERIODS.some(function(x){ return x[0]===p; })) hhRot.period=p; hhRender(); }
function _hhRotPeriodWrite(upd,tag,p){ const key=(typeof _rotKey==="function")?_rotKey(tag):tag; upd["config/rotationPeriod/"+key]=p; if(typeof rotationPeriod!=="undefined"&&rotationPeriod) rotationPeriod[key]=p; }   // the cycle lives where the old editor keeps it
function _hhRotCommit(upd,msg){ householdOnValue(householdData); if(Object.keys(upd).length&&_hhWrite()) db.ref().update(upd); if(msg&&typeof mwToast==="function") try{ mwToast(msg); }catch(e){} if(typeof renderAll==="function") renderAll(); else hhRender(); return upd; }
// Start (or re-shape) a rotation from the open panel: this row + a placeholder for each other picked kid.
function hhRotSave(){
  if(typeof momHere==="function"&&!momHere()) return null;
  const jobs=hhJobs(), id=hhRot.id, j=jobs[id]; if(!j||!hhIsKid(j.who)||SL_SLOTS.indexOf(j.slot)<0) return null; if(typeof _hhRotDone==="function"&&_hhRotDone(j.rot)) return null;
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
  const jobs=hhJobs(), j=jobs[id]; if(!j||!hhIsKid(j.who)||j.rot===tag) return null; if(typeof _hhRotDone==="function"&&(_hhRotDone(tag)||_hhRotDone(j.rot))) return null;
  const G=hhRotGroups()[j.slot+"|"+tag]; if(!G) return null; const mine=G.members.find(function(m){ return m.kid===j.who; });
  if(mine&&!mine.free){ if(typeof mwToast==="function") try{ mwToast(hhWhoName(j.who)+" already has a job in that rotation"); }catch(e){} return null; }
  const upd={}, P="household/jobs/"; upd[P+id+"/rot"]=tag; j.rot=tag;
  if(mine){ upd[P+mine.id+"/status"]="retired"; upd[P+mine.id+"/verdict"]="retire"; mine.job.status="retired"; mine.job.verdict="retire"; }
  hhRot={id:"",kids:{},period:"daily"}; hhGive="";
  return _hhRotCommit(upd,"🔁 Joined");
}
function hhRotLeave(id){
  if(typeof momHere==="function"&&!momHere()) return null;
  const j=hhJobs()[id]; if(!j||!j.rot) return null; if(typeof _hhRotDone==="function"&&_hhRotDone(j.rot)) return null; const upd={}, P="household/jobs/"+id+"/";
  if(j.free){ upd[P+"status"]="retired"; upd[P+"verdict"]="retire"; j.status="retired"; j.verdict="retire"; } else { upd[P+"rot"]=null; delete j.rot; }
  return _hhRotCommit(upd,j.free?"Turn removed":"Now "+hhWhoName(j.who)+"’s own chore");
}
function hhRotAddKid(slot,tag,kid){
  if(typeof momHere==="function"&&!momHere()) return null;
  const G=hhRotGroups()[slot+"|"+tag]; if(!G||!hhIsKid(kid)||G.members.some(function(m){ return m.kid===kid; })) return null; if(typeof _hhRotDone==="function"&&_hhRotDone(tag)) return null;
  const base=G.members.find(function(m){ return !m.free; })||G.members[0]; const nid=_hhRotNewId(), row=_hhRotFree(base.job,kid,tag); const upd={}; upd["household/jobs/"+nid]=row; hhJobs()[nid]=row;
  return _hhRotCommit(upd,hhWhoName(kid)+" takes turns too");
}
function hhRotCycle(tag,p){ if(typeof momHere==="function"&&!momHere()) return null; if(typeof _hhRotDone==="function"&&_hhRotDone(tag)) return null; if(!HH_ROT_PERIODS.some(function(x){ return x[0]===p; })) return null; const upd={}; _hhRotPeriodWrite(upd,tag,p); return _hhRotCommit(upd,""); }
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
    const sw=(typeof htRotViewHTML==="function")?htRotViewHTML(g):""; if(sw){ h+=sw; return; }   // HOUSETURNS_UI: switched to the new turns — shown, not edited here
    h+='<div style="background:#fff;border-radius:12px;box-shadow:0 2px 10px rgba(43,122,120,0.10);margin-bottom:10px;overflow:hidden"><div style="padding:9px 12px;display:flex;align-items:center;gap:6px;flex-wrap:wrap"><span style="font-size:13px;font-weight:800">🔁 '+esc(hhRotName(g))+'</span>'+_hhChip(esc((typeof SL_SLBL!=="undefined"&&SL_SLBL[g.slot])||g.slot),'#f3f4f6','#475569')+(g.members.length<2?_hhChip('needs one more kid to rotate','#fee2e2','#991b1b'):'')+(gated?_hhChip('waits for the level','#fef3c7','#92400e'):'')+'</div>';
    g.members.forEach(function(m){ const held=hhRotLabelOn(m.job,today), isFree=held==="Free day";
      h+='<div style="padding:6px 12px;border-top:1px solid #eef2f0;display:flex;align-items:center;gap:6px;flex-wrap:wrap;font-size:12.5px"><span style="font-weight:800;min-width:60px">'+esc(hhWhoName(m.kid))+'</span><span style="color:var(--muted)">today:</span><span style="font-weight:700;'+(isFree?'color:#94a3b8':'')+'">'+esc(held)+'</span><span style="flex:1"></span>'+_hhChip(m.free?'placeholder turn':'own job: '+esc(m.job.label),m.free?'#f3f4f6':'#eff6ff',m.free?'#64748b':'#1d4ed8')+_hhBtn("hhRotLeave('"+m.id+"')",'Leave',false,'#64748b')+'</div>'; });
    const outside=kids.filter(function(kd){ return !g.members.some(function(m){ return m.kid===kd; }); });
    h+='<div style="padding:7px 12px;border-top:1px solid #eef2f0;display:flex;gap:4px;flex-wrap:wrap;align-items:center"><span style="font-size:10.5px;font-weight:800;color:#6b6560">Cycle:</span>'+HH_ROT_PERIODS.map(function(p){ return _hhBtn("hhRotCycle('"+g.tag+"','"+p[0]+"')",esc(p[1]),per===p[0],'#2B7A78'); }).join('')+(outside.length?'<span style="flex:1"></span><span style="font-size:10.5px;font-weight:800;color:#6b6560">Add:</span>'+outside.map(function(kd){ return _hhBtn("hhRotAddKid('"+g.slot+"','"+g.tag+"','"+kd+"')",'+ '+esc(hhWhoName(kd)),false,'#6B4C93'); }).join(''):'')+(typeof htConvBtn==="function"?htConvBtn(g):'')+'</div></div>'; });
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
  const row=function(id,extra){ const j=jobs[id]; return '<div style="padding:7px 12px;border-top:1px solid #eef2f0"><div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;font-size:13px;font-weight:700"><span'+hoTap(id,mom)+'>'+(j.emoji||'☑️')+'</span><span'+hoTap(id,mom,'flex:1;min-width:120px;'+(j.status==="retired"?'text-decoration:line-through;color:#6b6560':''))+'>'+esc(j.label)+'</span>'+_hhChip(esc(hhWhoName(j.who)),'#f3f4f6','#475569')+_hhChip('⏱ '+hhMinutesOf(j)+' min','#f3f4f6','#475569')+(j.pts?_hhChip(j.pts+' ⭐','#fef3c7','#92400e'):'')+'</div>'+(extra||'')+'</div>'; };
  const section=function(title,sub,list,extraFn){ h+='<div style="background:#fff;border-radius:12px;box-shadow:0 2px 10px rgba(43,122,120,0.10);margin-bottom:10px;overflow:hidden"><div style="padding:9px 12px;font-size:13px;font-weight:800">'+title+' <span style="font-weight:600;color:var(--muted);font-size:11px">'+sub+'</span></div>';
    if(!list.length) h+='<div style="padding:0 12px 8px;font-size:12px;color:var(--muted)">Nothing here.</div>'; let room=null; byRoom(list).forEach(function(id){ const rm=hhRoomOf(jobs[id]); if(rm!==room){ room=rm; h+='<div style="padding:6px 12px 0;font-size:10.5px;font-weight:800;text-transform:uppercase;letter-spacing:.4px;color:#6b6560">🚪 '+esc(hhRoomName(rm))+'</div>'; } h+=row(id,mom?extraFn(id):''); }); h+='</div>'; };
  section('☑️ The pile',held.length+' waiting · '+held.reduce(function(a,id){ return a+hhMinutesOf(jobs[id]); },0)+' min',held,function(id){ return '<div style="margin-top:5px">'+_hhOnceSendBtns(id,jobs[id])+'</div>'; });
  section('📋 On a list',out.length+' sent, not yet done',out,function(id){ return '<div style="margin-top:5px;display:flex;gap:6px;align-items:center"><span style="font-size:11px;color:var(--muted)">on '+esc(hhWhoName(jobs[id].who))+'’s list</span>'+_hhBtn("hhOnceHold('"+id+"')",'⏸ Back to the pile',false,'#64748b')+'</div>'; });
  if(done.length) section('✓ Done',done.length,done,function(id){ return '<div style="font-size:11px;color:#94a3b8;margin-top:3px">done '+esc((jobs[id].done||'').slice(5))+'</div>'; });
  return h;
}
// ONCETAP_START — a one-time job's row opens its chore card (DESIGN_household_rooms_2026-11-15 §14; her rule 2026-11-18: "whenever
// there is a [chore], it to be clickable and editable, and that edit reflects everywhere that it is"; her "all go" 2026-11-18, piece 1).
// The emoji and the name on a row of a room's 📝 To do and 🏠 Whole house's (rtdRowHTML), 👤 By person's 📝 To do (htdPersonHTML) and
// the ☑️ pile under ⋯ More (hhOnceHTML) open hcOpen(id), as a 🔴 Now row does. Only those two spans carry the tap, so ✓, Send to…,
// ⏸ Back to the pile and Give to <Name> (beside them, never inside) still do only their own thing. Mom only: not Mom, the span is
// exactly as before. A tap writes nothing; an edit on the card is the card's own write, and every one of these rows reads that row.
function hoTap(id,mom,css){ return mom?' onclick="hcOpen(\''+id+'\')" style="cursor:pointer'+(css?';'+css:'')+'"':(css?' style="'+css+'"':''); }
// ONCETAP_END
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
  const _dw=(typeof rtDailyOn==="function")?rtDailyOn(j)+"|"+j.slot:"";   // CHOREDAILY (C5): was it a daily on this list?
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
  if(_dw&&field!=="from"&&rtDailyJoin(j)&&_dw!=="true|"+j.slot){ upd[P+"from"]=rtDailyJoin(j); j.from=upd[P+"from"]; }   // CHOREDAILY (C5): turned daily or moved to another list: it starts today
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
// HOUSEFAST_START — one draw of a Rooms page (🏠 Whole house, a room) works each shared thing out ONCE (hub brief 2026-11-19: Whole
// house took ~170 ms on a real-size table because 🔴 Now, 📅 Schedule, 📊 How often and the "most behind first" list each walked every
// chore again — rnRows for every room twice, hhRoomChores 31 times, hhStats 3 times a chore). hhRoomsPageHTML opens the memo (hfDraw)
// for the length of that one call and drops it when the call returns or throws; nothing is kept between draws, so a tick, an edit or
// a new to-do is always read fresh on the next draw. Outside a draw every helper calls straight through, exactly as before. Drawing
// writes nothing, so nothing these read can change inside one draw. Kept: the chores by room, each room's 🔴 Now rows, each chore's
// stats and need. Callers get their own arrays (a copy), so one card can never change what the next one reads. Same page, faster.
let _hfD=null;
function hfDraw(fn){ if(_hfD) return fn(); _hfD={}; try{ return fn(); }finally{ _hfD=null; } }
function hfMemo(k,f){ return Object.prototype.hasOwnProperty.call(_hfD,k)?_hfD[k]:(_hfD[k]=f()); }
// One chore's 8 weeks (hhStats) and its need (hhNeed), by its id in the table (j = that row).
function hfStats(id,j){ if(!_hfD||id===undefined) return hhStats(j); return hfMemo("st|"+id,function(){ return hhStats(j); }); }
function hfNeed(id,j){ if(!_hfD||id===undefined) return hhNeed(j); return hfMemo("nd|"+id,function(){ return _hfNeedOf(id,j); }); }
// The need meter's own arithmetic (hhNeed in index.html, line for line) from this draw's stats, so a chore's 8 weeks are walked once,
// not twice. test_house_fast.js checks it equals hhNeed on every chore, and fails if hhNeed's text changes (then change this too).
function _hfNeedOf(id,j){
  const iv=hhInterval(j); if(!iv) return null; const st=hfStats(id,j); const today=_hhDayNum(_hhIsoLocal(Date.now()));
  let last=st.last; if(j.lastDone&&/^\d{4}-\d{2}-\d{2}$/.test(j.lastDone)&&(!last||j.lastDone>last)) last=j.lastDone;
  if(!last) return {pct:Infinity,days:null,interval:iv,last:null,never:true,label:"never in 8 wk"};
  const days=today-_hhDayNum(last), pct=Math.round(100*days/iv);
  return {pct:pct,days:days,interval:iv,last:last,never:false,label:pct+"% · "+days+" d / "+iv};
}
// HOUSEFAST_END
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
function hhRoomChores(){ if(!_hfD) return _hhRoomChores(); const M=hfMemo("rooms",_hhRoomChores), out={}; Object.keys(M).forEach(function(k){ out[k]=M[k].slice(); }); return out; }   // HOUSEFAST
function _hhRoomChores(){ const J=hhJobs(), out={__none:[]}; hhRoomList().forEach(function(r){ out[r[0]]=[]; });
  Object.keys(J).forEach(function(id){ const j=J[id]; if(!j||j.status==="retired"||j.free) return; out[hhRoomOn(j)||"__none"].push(id); }); return out; }
function hhRoomStats(ids){ const J=hhJobs(), t=_hhDayNum(_hhIsoLocal(Date.now())); let due=0, ok=0, late=0, mins=0;
  ids.forEach(function(id){ const j=J[id], st=hfStats(id,j); due+=st.due8; ok+=st.done8-st.late8; mins+=hhMinutesOf(j)*hhTimesAWeek(j);
    if(hhLaneOf(j)!=="once"&&!j.hold){ const n=hfNeed(id,j); if(n&&(n.never?!(j.from&&t-_hhDayNum(j.from)<=n.interval):n.pct>100)) late++; } });   // late = past its interval (the need meter)
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
  const hx=(typeof hdOn==="function"&&hdOn()&&typeof houseDayData!=="undefined"&&houseDayData[iso]&&houseDayData[iso].done)?houseDayData[iso].done[id]:null; if(hx&&hx.grab) return {who:hx.who,done:true};   // 🙌 HOUSEOVER: done as a ×2 grab
  let who=(cd&&cd.sent&&cd.plan&&cd.plan[id]&&cd.plan[id].who)||j.who, done=false, rot=false;
  const tw=(!(cd&&cd.sent&&cd.plan&&cd.plan[id])&&typeof htHolder==="function")?htHolder(id,iso):"";   // HOUSETURNS_UI: a switched rotation → whose turn it is that day
  if(tw){ who=tw; rot=true; const st=S.state[who+"|"+j.slot+"|"+_hhNorm(j.label)+"|"+iso]; done=!!(st&&st.act==="on"); }
  if(!rot&&!(cd&&cd.sent&&cd.plan&&cd.plan[id])&&j.rot&&j.src&&j.src.kind==="routine"&&hhIsKid(j.who)){ const k=j.src.slot+"|"+j.rot, g=rc[k]||(rc[k]=hhRotGroup(j.src.slot,j.rot)), mi=g.findIndex(function(x){ return x.kid===j.who; });
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
  let h='<div style="background:#fff;border-radius:12px;box-shadow:0 2px 10px rgba(43,122,120,0.10);overflow:hidden"><div style="padding:9px 12px;font-size:14px;font-weight:800">🏠 Whole house <span style="font-size:11px;font-weight:600;color:var(--muted)">'+(typeof hqDone==="function"?'most behind first · the bar is on time over 8 weeks · % done also counts the ones done late':'most behind first · on time over 8 weeks · late = past its usual gap now')+'</span></div>';
  hhHouseOrder(byRoom).forEach(function(x){ const s=x.s, none=x.id==="__none", r=none?null:hhRoomList().find(function(y){ return y[0]===x.id; }), col=s.pct===null?'#cbd5e1':s.pct>=80?'#16a34a':s.pct>=50?'#d97706':'#dc2626';
    h+='<div onclick="hhRmGo(\''+x.id+'\')" style="display:flex;align-items:center;gap:8px;padding:8px 12px;border-top:1px solid #eef2f0;cursor:pointer;font-size:12.5px"><span>'+(none?'❔':hhRoomEmoji(x.id))+'</span><span style="flex:0 0 38%;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+esc(none?'No room':r[1])+'</span>'
      +'<div style="flex:1;height:8px;border-radius:4px;background:#eef2f0;overflow:hidden"><div style="height:8px;width:'+(s.pct||0)+'%;background:'+col+'"></div></div><span style="width:34px;text-align:right;font-size:11px;font-weight:800">'+(s.pct===null?'–':s.pct+'%')+'</span>'
      +(typeof hqDoneChip==="function"?hqDoneChip(byRoom[x.id]||[]):(s.late?_hhChip(s.late+' late','#fee2e2','#991b1b'):''))+_hhChip(s.mins+' min/wk','#f3f4f6','#475569')+'</div>'; });
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
function hhRoomsPageHTML(){ if(!_hfD) return hfDraw(hhRoomsPageHTML);   // HOUSEFAST: one draw, one memo
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
  if(!hhRmSel) h+=(typeof htNowHTML==="function"&&typeof htdHTML==="function")?htNowHTML()+htdHTML():'';   // HOUSETODO: 🔴 Now · 📝 To do, every room
  if(!hhRmSel) return h+(typeof hwCardHTML==="function"?hwCardHTML():'')+(typeof hoCardHTML==="function"?hoCardHTML():'')+hhRmHouseHTML(byRoom)+(typeof hhRoomsTailHTML==="function"?hhRoomsTailHTML():'');   // HOUSEWEEK: 📅 the week, set to Everything
  const none=hhRmSel==="__none", r=none?null:L.find(function(x){ return x[0]===hhRmSel; }), ids=byRoom[hhRmSel]||[], s=hhRoomStats(ids);
  h+='<div style="display:flex;align-items:baseline;gap:8px;flex-wrap:wrap;margin:4px 2px 8px"><span style="font-size:16px;font-weight:800">'+(none?'❔ No room':hhRoomEmoji(r[0])+' '+esc(r[1]))+'</span><span style="font-size:12px;color:var(--muted);font-weight:700">'+s.n+' chore'+(s.n===1?'':'s')+' · '+s.mins+' min a week'+(typeof hqHeadTail==="function"?hqHeadTail(ids,s):' · on time '+(s.pct===null?'–':s.pct+'%'))+'</span></div>';   // HOUSEQUIET: % done
  if(none) h+='<div style="font-size:11px;color:var(--muted);margin:-4px 2px 8px">These chores are filed under a room that is no longer on your list. Open ✎ Edit to give each one a room.</div>';
  if(!none&&typeof rnNowHTML==="function"&&typeof rtdHTML==="function") h+=rnNowHTML(hhRmSel)+rtdHTML(hhRmSel);   // ROOMNOW · ROOMTODO: 🔴 Now and 📝 To do, a single room only
  if(mom&&typeof hcRoomToolsHTML==="function") h+=hcRoomToolsHTML(hhRmSel,ids);   // HH_CARD: 🔍 Checks · ⚙ Rules
  if(!ids.length) return h+'<div style="background:#fff;border-radius:12px;box-shadow:0 2px 10px rgba(43,122,120,0.10);padding:10px 12px;font-size:12px;color:var(--muted)">No chores in this room yet. Give a chore this room in its ✎ Edit.</div>';
  return h+(typeof hwRoomHTML==="function"?hwRoomHTML(hhRmSel,ids):hhRoomGridHTML(hhRmSel,ids))+((!none&&typeof hoCardHTML==="function")?hoCardHTML():'')+(typeof hhRoomsTailHTML==="function"?hhRoomsTailHTML():'');   // HOUSEWEEK: 📅 the week, then the big grid folded
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
function hcAddSave(){ const id=(hhAdd.who==="grab"&&typeof hgAddSave==="function")?hgAddSave():hhAddSave(); if(id){ hcId=""; hhRender(); } return id; }
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
    case "pts": if(add?!(kid||j.who==="grab"):!(kid||j.who==="grab")) return ""; return add?'<input type="number" class="ce-sheet-input" id="hh-add-pts" value="'+esc(j.pts)+'" placeholder="⭐" min="0" onchange="hhAddField(\'pts\',this)" style="flex:none;width:64px">':_hcIn("hhEditField("+q+",'pts',this)",j.pts||0,"number","64px",' min="0" max="500" title="stars"');
    case "room": { const cur=add?j.room:hhRoomOf(j); return t?sel(rooms,cur,"room"):chips(rooms,cur,"room"); }
    case "area": { const o=Object.keys(HH_AREAS).map(function(k){ return [k,HH_AREAS[k][0]+" "+HH_AREAS[k][1]]; }); return add?chips([["","Guess ("+HH_AREAS[hhGuessArea(j.label,j.slot,"")][1]+")"]].concat(o),j.area,"area"):chips(o,j.area||"cleaning","area"); }
    case "level": { if(add) return chips([[0,"Now (Level "+hhLevelCurFor(j.who)+")"],[1,"Level 1"],[2,"Level 2"],[3,"Level 3"]],j.level,"level"); const o=[[1,"Level 1"],[2,"Level 2"],[3,"Level 3"]]; return t?sel(o,hhLevelOf(j),"level"):chips(o,hhLevelOf(j),"level"); }
    case "slot": { const o=hcSlots(j); if(!o.length) return ""; const cur=j.slot||""; return t?sel(o,cur,"slot"):chips(o,cur,"slot"); }
    case "when": { const gb=j.who==="grab"&&(typeof hgOn==="function"&&hgOn()), gbOk=function(x){ return !gb||["daily","days","wk","2w"].indexOf(x[0])>=0; };   // HOUSEGRABS_UI: only what the kids' Up for Grabs understands
      if(add){ const md=hhAdd.kind!=="chore"?hhAdd.kind:(/^wk:/.test(j.cad||"")?"days":(HC_ADDWHEN.some(function(x){ return x[0]===j.cad; })?j.cad:"daily"));
        if(gb) return HC_ADDWHEN.filter(gbOk).map(function(x){ return _hcChip(md===x[0],x[1],"hhAddCadMode('"+x[0]+"')"); }).join('');
        return HC_ADDWHEN.map(function(x){ return _hcChip(md===x[0],x[1],(hhAdd.kind!=="chore"?"hhAddSet('kind','chore');":"")+"hhAddCadMode('"+x[0]+"')"); }).join('')+_hcChip(md==="once","One time","hhAddSet('kind','once')")+_hcChip(md==="project","🧰 Project","hhAddSet('kind','project')"); }
      const md=hhEditCadMode(j.cad), o=HC_MODES.filter(function(x){ return gbOk(x)||x[0]===md; }).map(function(x){ return [x[0],x[0]==="nd"&&md==="nd"?"Every "+parseInt(j.cad,10)+" days":x[1]]; });
      if(j.cad==="none") o.unshift(["none","Not scheduled"]);
      return t?_hcSel("hhEditCadMode_set("+q+",this.value)",o,j.cad==="none"?"none":md):o.map(function(x){ return x[0]==="none"?_hcChip(true,x[1],"",t):_hcChip(md===x[0],x[1],"hhEditCadMode_set("+q+",'"+x[0]+"')",t); }).join(''); }
    case "days": { if(add){ if(hhAdd.kind!=="chore"||!/^wk:/.test(j.cad||"")) return ""; const d=cadChipDays(j.cad); return CAD_DAYL.map(function(n,i){ return _hcChip(d.indexOf(i)>=0,n,"hhAddDay("+i+")"); }).join(''); }
      if(hhEditCadMode(j.cad)!=="wk") return ""; const d=hhEditDays(j.cad); return CAD_DAYL.map(function(n,i){ return _hcChip(d.indexOf(i)>=0,t?n.charAt(0):n,"hhEditDay("+q+","+i+")",t); }).join(''); }
    case "every": return (add||hhEditCadMode(j.cad)!=="nd")?"":'Every '+_hcIn("hhEditSet("+q+",'cad',this.value+'d')",parseInt(j.cad,10)||3,"number","60px",' min="1" max="99"')+' days';
    case "from": return (add||(j.who==="grab"&&(typeof hgOn==="function"&&hgOn())))?"":_hcIn("hhEditField("+q+",'from',this)",j.from,"date");
    case "to": case "time": case "cycle": case "meal": case "laundry": {
      if(add||!kid) return ""; const L=hcAt(id), ro=function(v){ return v?'<span style="font-size:12px;font-weight:700">'+esc(v)+'</span> ':''; };
      if(f==="meal"){ const ms=Object.keys(MEAL_SLOT).filter(function(m){ return MEAL_SLOT[m]===j.slot; }); if(!ms.length) return ""; if(!L) return ro(j.meal?"After "+mealCfg()[j.meal]:"");
        return ms.map(function(m){ const on=j.meal===m; return _hcChip(on,MEAL_EMOJI[m]+" After "+esc(mealCfg()[m]),"hcList("+q+",'meal','"+(on?"":m)+"')"); }).join(''); }
      if(f==="laundry"){ if(!((typeof j.laundry==="string"&&j.laundry)||j.laundry===true||j.laundry===false||(typeof laundryLooseWord==="function"&&laundryLooseWord(j.label)))) return ""; const on=typeof laundryStarts==="function"&&laundryStarts(j), cur=(typeof j.laundry==="string"&&LAUNDRY_KIDMOVE_FROM[j.laundry])?j.laundry:"";
        if(!L) return ro(on?"🧺 starts a load":cur?"🧺 "+cur:""); return _hcChip(on,"🧺 Starts a load","hcList("+q+",'laundry',"+(on?"false":"true")+")")+" "+_lkmSelectHTML(cur,"hcList("+q+",'laundry',this.value)"); }
      if(f==="cycle"){ const cw=parseInt(j.cycW,10)||0; if(!L) return ro(cw?"week "+cw+" of "+(j.cycN||4):"");
        return [0,1,2,3,4].map(function(w){ return _hcChip(w===cw,w?"Wk "+w:"Every week","hcList("+q+",'cycW',"+w+")"); }).join('')+(cw?' <span style="font-size:11px;color:var(--muted)">week 1 starts</span> '+_hcIn("hcList("+q+",'cycStart',this.value)",j.cycStart,"date"):''); }
      if(!L) return ro(j[f]); return _hcIn("hcList("+q+",'"+f+"',this.value)",j[f],f==="to"?"date":"text",f==="time"?"110px":"",f==="time"?' placeholder="e.g. 6 AM"':''); }
    case "who": if(add) return chips(HH_WHO.filter(function(w){ return w!=="grab"||(typeof hgOn==="function"&&hgOn()); }).map(function(w){ return [w,hhWhoName(w)]; }),j.who,"who");
      return '<span style="font-size:13px;font-weight:800;margin-right:6px">'+esc(hhWhoName(j.who))+'</span>'+(j.who!=="grab"?hhGiveBtn(id):'');
    case "can": { if(j.who==="grab") return (typeof hgCanCtl==="function")?hgCanCtl(id,t):""; /* HOUSEGRABS_UI: who can grab it */ const c=add?[j.who].concat(Object.keys(j.can||{}).filter(function(w){ return j.can[w]; })):hhCanOf(j);
      return HH_WHO.filter(function(w){ return w!=="grab"; }).map(function(w){ const own=w===j.who; return _hcChip(c.indexOf(w)>=0,t?hcIni(w):esc(hhWhoName(w))+(own?" (usually)":""),own?"":(add?"hhAddCan('"+w+"')":"hhCanToggle("+q+",'"+w+"')"),t).replace('<button','<button title="'+esc(hhWhoName(w))+'"'); }).join(''); }
    case "minutes": { if(add) return ""; const m=hhMinutesOf(j); if(!t) return _hcIn("hhEditField("+q+",'minutes',this)",m,"number","70px",' min="1" max="240"')+' min';
      const st=[2,3,5,10,15,20,30,45,60]; if(st.indexOf(m)<0) st.push(m); return sel(st.sort(function(a,b){ return a-b; }).map(function(x){ return [x,x+" min"]; }),m,"minutes"); }
    case "note": return add?"":'<input class="ce-sheet-input" value="'+esc(j.note||'')+'" placeholder="Note" onchange="hhNote('+q+',this)">';
    case "turns": case "deep": return (!add&&typeof htCtl==="function")?htCtl(id,f,t):"";   // HOUSETURNS_UI
    case "clock": case "wait": case "cover": case "keep": return (!add&&typeof cdrCtl==="function")?cdrCtl(id,f,t):"";   // CARDRULES (slice D)
  }
  return "";
}
function hcCardHTML(){
  const _ht=(typeof htSheetHTML==="function")?htSheetHTML():""; if(_ht) return _ht;   // HOUSETURNS_UI: the switch screen, while it is open
  const _hg=(typeof hgSheetHTML==="function")?hgSheetHTML():""; if(_hg) return _hg;   // HOUSEGRABS_UI: the Up for Grabs switch screen
  if(!hcId||!hcMom()) return ""; const add=hcId==="__add", id=add?"":hcId, J=hhJobs(), j=add?hhAdd:J[id]; if(!j){ hcId=""; return ""; }
  const kid=hhIsKid(j.who), tk=typeof hhTakeoverOn==="function"&&hhTakeoverOn();
  const sec=function(n,l){ return '<div style="margin-top:16px;padding-top:8px;border-top:1px solid var(--border);font-size:12px;font-weight:800;color:#2B7A78">'+n+' · '+l+'</div>'; };
  const lbl=function(l,x){ return x?'<div class="ce-sheet-lbl" style="margin:10px 0 4px">'+l+'</div><div style="display:flex;gap:4px;flex-wrap:wrap;align-items:center">'+x+'</div>':''; };
  let h='<div class="ce-sheet open" onclick="if(event.target===this)hcClose()"><div class="ce-sheet-box hc-box" onscroll="hcScr=this.scrollTop">';
  h+='<div style="display:flex;align-items:center;gap:8px"><div class="ce-sheet-title" style="flex:1;margin-bottom:0">'+(add?'＋ Add a chore':esc((j.emoji||'☐')+' '+j.label))+'</div>'+(!add&&j.status==="retired"?_hhChip('Retired','#f3f4f6','#64748b'):'')+'<button onclick="hcClose()" style="border:1px solid var(--border);background:#fff;border-radius:8px;width:30px;height:30px;font-size:15px;cursor:pointer;color:var(--muted)">✕</button></div>';
  h+=sec(1,'Basics')+'<div style="display:flex;gap:6px;margin-top:8px">'+hcCtl(id,"emoji")+hcCtl(id,"label")+hcCtl(id,"pts")+'</div>'+hcCtl(id,"emojis");
  h+=lbl('Room',hcCtl(id,"room"))+lbl(add?'Area — this decides the gate':'Area',hcCtl(id,"area"))+lbl('Level',hcCtl(id,"level"))+((!add&&typeof hgLvNote==="function")?hgLvNote(id):'');   // HOUSEGRABLV_UI
  h+=sec(2,'When')+lbl('How often',hcCtl(id,"when"))+lbl('Days',hcCtl(id,"days"))+lbl('',hcCtl(id,"every"));
  if(add&&hhAdd.kind!=="chore") h+='<div style="font-size:11px;color:var(--muted);margin-top:6px">'+(hhAdd.kind==="once"?'Due every day until it is checked one time, then it leaves the list. It waits in ☑️ Once until you send it.':'Never due on its own. Lives on 🧰 Projects with a target, a plan, steps and a work log.')+'</div>';
  h+=lbl('Week of 4',hcCtl(id,"cycle"))+lbl('Starts',hcCtl(id,"from"))+lbl('Ends',hcCtl(id,"to"))+lbl('Time of day',hcCtl(id,"slot"))+lbl('Clock time',hcCtl(id,"time"))+lbl('After a meal',hcCtl(id,"meal"))+lbl('Laundry',hcCtl(id,"laundry"));
  if(!add&&kid&&!hcAt(id)) h+='<div style="font-size:11px;color:var(--muted);margin-top:6px">'+(tk?'End date, clock time, meal and week of 4 change while the chore is on '+esc(hhWhoName(j.who))+'’s list.':'End date, clock time, meal and week of 4 are set on Chores &amp; Stars ▸ Lists until Take over.')+'</div>';
  if(!add&&typeof cdrCardHTML==="function") h+=cdrCardHTML(id);   // CARDRULES (slice D): if it is missed
  h+=sec(3,'Who')+lbl(add?'Usually':'Usually (the owner)',hcCtl(id,"who"))+(add?'':_hhGiveOrRot(id))+lbl(j.who==="grab"?'Who can grab it':'Who else can do it',hcCtl(id,"can"));
  if(typeof hgWhoHTML==="function") h+=hgWhoHTML(id);   // HOUSEGRABS_UI: the switch, or the kids see it · ↩ Undo
  if(!add&&j.rot&&!(typeof htOf==="function"&&htOf(id))){ const g=hhRotGroup(j.slot,j.rot).map(function(x){ return hhWhoName(x.kid); }), per=(HH_ROT_PERIODS.find(function(p){ return p[0]===hhRotPeriodOf(j.rot); })||[0,"daily"])[1];
    h+='<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-top:8px;font-size:12px">🔁 Takes turns'+(g.length>1?' with '+esc(g.filter(function(n){ return n!==hhWhoName(j.who); }).join(', ')):'')+' · '+esc(String(per).toLowerCase())+'<span style="flex:1"></span>'+(typeof htConvBtnId==="function"?htConvBtnId(id):'')+_hhBtn("hcId='';hhGo('rot')",'🔁 Rotations',false,'#c2410c')+'</div>'; }
  if(!add&&typeof htWhoHTML==="function") h+=htWhoHTML(id);   // HOUSETURNS_UI: takes turns · the grown-up turn
  if(!add) h+=sec(4,'How long')+lbl('Minutes',hcCtl(id,"minutes"));
  if(!add){ const st=hhStats(j); let last=st.last, by=j.who==="grab"?"":j.who; if(j.lastDone&&/^\d{4}-\d{2}-\d{2}$/.test(j.lastDone)&&(!last||j.lastDone>last)){ last=j.lastDone; by=j.lastBy||""; }
    h+=sec(5,'History')+'<div style="font-size:12.5px;font-weight:700;margin-top:8px">'+(last?'Last done '+(+last.slice(5,7))+'/'+(+last.slice(8))+(by?' by '+esc(hhWhoName(by)):''):'Not done in the last 8 weeks')+'</div>'
      +'<div style="display:flex;gap:5px;flex-wrap:wrap;margin-top:6px">'+_hhChip('on time 4 wk '+st.done4+'/'+st.due4+' ('+hhPct(st.done4,st.due4)+')','#f3f4f6','#1f2937')+_hhChip('8 wk '+st.done8+'/'+st.due8+' ('+hhPct(st.done8,st.due8)+')','#f3f4f6','#1f2937')+_hhChip('late '+st.late8,st.late8?'#fef3c7':'#f3f4f6',st.late8?'#92400e':'#64748b')+(st.miss8?_hhChip('missed '+st.miss8,'#fee2e2','#991b1b'):'')+hhNeedChip(j)+'</div>'+(typeof hoHistHTML==="function"?hoHistHTML(id):'')+(typeof ltCardHTML==="function"?ltCardHTML(id):'')+lbl('Note',hcCtl(id,"note")); }   // HOWOFTEN: this chore's line · 📒 LASTTURNS (L7): its last turns, a jump to the ledger
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
  if(typeof hgChecks==="function") hgChecks(ids).forEach(function(c){ out.push(c); });   // HOUSEGRABS_UI
  if(typeof ktOverlaps==="function") ktOverlaps(ids).forEach(function(o){ line("twice",'Might be the same chore twice: '+J[o[1]].label,o[0]); line("twice",'Might be the same chore twice: '+J[o[0]].label,o[1]); });
  if(rid!=="__none") ids.forEach(function(id){ if(!J[id].room) line("guess",'No room saved — here by a guess from the words',id); });
  ids.forEach(function(id){ const j=J[id]; if(!hhLevelOut(j)&&!(j.who==="grab"&&typeof hgOn==="function"&&hgOn())) line("level",'Level '+hhLevelOf(j)+' — above '+hhWhoName(j.who)+'’s Level '+hhLevelCurFor(j.who)+', not on a list yet',id); });
  return out; }
function hcRulesHTML(rid,ids){ const J=hhJobs(), th='padding:4px 6px;font-size:10px;font-weight:800;color:#475569;text-align:left;white-space:nowrap;border-bottom:1px solid #e5e7eb';
  const rows=ids.slice().sort(function(a,b){ return (HH_LANES.findIndex(function(L){ return L[0]===hhLaneOf(J[a]); })-HH_LANES.findIndex(function(L){ return L[0]===hhLaneOf(J[b]); }))||((J[a].order||0)-(J[b].order||0))||String(J[a].label).localeCompare(String(J[b].label)); });
  let h='<div style="background:#fff;border-radius:12px;box-shadow:0 2px 10px rgba(43,122,120,0.10);overflow:auto;margin-bottom:10px"><table style="border-collapse:collapse;min-width:100%;font-size:11px"><tr>'+['Chore','How often','If missed','Minutes','Who can','Turns','Time of day','Level','Room'].map(function(x){ return '<th style="'+th+'">'+x+'</th>'; }).join('')+'</tr>';
  rows.forEach(function(id,n){ const j=J[id], td='<td style="padding:4px 6px;border-bottom:1px solid #f1f5f4;vertical-align:top">', up=n&&J[rows[n-1]].who!=="grab"&&j.who!=="grab";
    h+='<tr>'+td+'<span onclick="hcOpen(\''+id+'\')" style="cursor:pointer;font-weight:800;white-space:nowrap">'+esc((j.emoji||'☐')+' '+j.label)+'</span><div style="font-size:10px;color:var(--muted)">'+esc(hhWhoName(j.who))+'</div></td>'
      +td+hcCtl(id,"when",1)+'<div style="margin-top:2px">'+hcCtl(id,"days",1)+'</div></td>'+td+(typeof cdrCell==="function"?cdrCell(id):'')+'</td>'+td+hcCtl(id,"minutes",1)+'</td>'
      +td+'<span style="white-space:nowrap">'+hcCtl(id,"can",1)+(up?' '+_hcChip(false,'↑ same',"hcCanSame('"+id+"','"+rows[n-1]+"')",1).replace('<button','<button title="Same people as the row above"'):'')+'</span></td>'
      +td+hcCtl(id,"turns",1)+'<div style="margin-top:2px">'+hcCtl(id,"deep",1)+'</div></td>'
      +td+hcCtl(id,"slot",1)+'</td>'+td+hcCtl(id,"level",1)+'</td>'+td+hcCtl(id,"room",1)+'</td></tr>'; });
  return h+'</table>'+(typeof cdrRulesNote==="function"?cdrRulesNote():'')+'</div>'; }   // CARDRULES: what acts now, what waits for the plan
function hcRoomToolsHTML(rid,ids){ const C=hcChecks(rid,ids), ro=!!hcRm[rid+"|rules"], co=!!hcRm[rid+"|checks"]; if(!C.length&&!ids.length) return "";
  let h='<div style="display:flex;gap:6px;flex-wrap:wrap;margin:-2px 2px 8px">'+(C.length?_hhBtn("hcFold('"+rid+"|checks')",'🔍 Checks ('+C.length+') '+(co?'▾':'▸'),co,'#b45309'):'')+(ids.length?_hhBtn("hcFold('"+rid+"|rules')",'⚙ Rules '+(ro?'▾':'▸'),ro,'#475569'):'')+'</div>';
  if(co&&C.length){ const J=hhJobs(); h+='<div style="background:#fff;border-radius:12px;box-shadow:0 2px 10px rgba(43,122,120,0.10);margin-bottom:10px;overflow:hidden">'+C.map(function(c){ const j=c.id?J[c.id]:null;
      return '<div onclick="'+(c.id?"hcOpen('"+c.id+"')":c.rules?"hcRulesOn('"+rid+"')":"hcAdd('"+rid+"')")+'" style="display:flex;gap:8px;align-items:center;padding:7px 12px;border-top:1px solid #eef2f0;cursor:pointer;font-size:12px"><span style="font-weight:800;white-space:nowrap">'+(j?esc((j.emoji||'☐')+' '+j.label):c.rules?'👥 Who can':'🚪 This room')+'</span><span style="flex:1;color:#92400e">'+esc(c.txt)+'</span><span style="color:var(--muted)">'+(j||c.rules?'›':'＋')+'</span></div>'; }).join('')+'</div>'; }
  if(ro&&ids.length) h+=hcRulesHTML(rid,ids);
  return h; }
// HH_CARD_END
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
  if(typeof momHere==="function"&&!momHere()) return null; const e=hpEngine(); if(!on&&e.mode!=="preview") return null; if(e.mode==="on") return null;   // the real switch is HOUSESWITCH's
  const rec={mode:on?"preview":"off",on:hpIsIso(e.on)?e.on:hpToday()};
  householdData.meta=Object.assign({},householdData.meta,{engine:rec}); householdOnValue(householdData);
  if(_hhWrite()) db.ref("household/meta/engine").set(rec);
  hhRender(); return rec;
}
// The engine's inputs, from the app's own readers: each person's limits (hhBudget, which reads household/people first), their
// Cleaning level (hhLevelCurFor), the rotation order and cycles (SL_KIDS, SL_SLOTS, config/rotationPeriod) and the switch-on date.
const HP_MON="2026-11-16", HP_SAT="2026-11-21";   // hhBudget only asks which day of the week: any Monday, any Saturday
function hpPeople(){ const P={}; hpWho().forEach(function(w){ P[w]={school:hhBudget(w,HP_MON),weekend:hhBudget(w,HP_SAT),level:hhLevelCurFor(w),fit:hpFitOf(w)}; }); return P; }
function hpOv(){ return {rotations:(typeof hhTurnsAll==="function"&&hhTurnsAll())||{},kids:(typeof SL_KIDS!=="undefined"?SL_KIDS:ROSTER).slice(),slots:SL_SLOTS.slice(),rotPeriod:Object.assign({},(typeof rotationPeriod!=="undefined"&&rotationPeriod)||{}),on:hpIsIso(hpEngine().on)?hpEngine().on:hpToday(),minDefault:HH_MIN_DEFAULT}; }
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
// HOUSEGRABLV_UI: a ×2 offer (plan ON, HOUSEOVER) reaches only the kids ticked AND up to the chore's level, so Mom's lines name just them.
function hgX2For(id,can,pre,none){ const j=hhJobs()[id], c=(can||[]).filter(function(k){ return typeof gbLvFor!=="function"||gbLvFor(j,k); });
  return c.length?pre+c.map(hhWhoName).join(', '):(can&&can.length)?'no kid up to Level '+hhLevelOf(j)+' yet':none; }
function hpMovedTxt(m){ return m.to==="grab"?'→ Grabs':'→ '+esc(hhWhoName(m.to)); }
function hpPreviewSwitchHTML(){
  const mom=(typeof momHere!=="function")||momHere(), on=hhEngineMode()==="preview";
  if(on) return '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;background:#ecfeff;border:1.5px solid #a5f3fc;border-radius:10px;padding:7px 10px;margin-bottom:10px;font-size:11.5px;color:#155e75"><b>🔭 Plan preview</b><span style="flex:1">What the new hand-out WOULD do with your limits — shown only here, to you. Nobody’s list changes.</span>'+(mom?_hhBtn("hhEngineTap(false)",'Stop showing it',false,'#64748b'):'')+'</div>';
  return '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;background:#f8fafc;border:1.5px dashed #cbd5e1;border-radius:10px;padding:7px 10px;margin-bottom:10px;font-size:11.5px;color:#475569"><span style="flex:1">The plan preview works out who would do each house chore — today, this week and the next 4 weeks — from the limits below. It is shown only on this page; nothing changes on anyone’s list.</span>'+(mom?_hhBtn("hhEngineTap(true)",'🔭 Show the plan preview',true,'#0e7490'):'')+'</div>';
}
// HOUSEMIXSET_START (step 7 slice 2): Mom's "Mixed in" is on only once she taps it (her answer 2026-11-20 "When I tap Mixed in"); until then it
// reads "not on yet" and her chores wait at the end of school, as before. School first turns it off. The write is hpFitSet's, unchanged.
function hpMixHTML(mom){ const f=hhPeopleOf("mom").fit;
  return '<div style="padding:6px 12px;border-top:1px solid #f3f4f6;font-size:12.5px"><div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap"><span style="flex:1">Chores and school'+(f?'':' '+_hhChip('Mixed in: not on yet','#fef3c7','#92400e'))+'</span>'
    +[["mixed","Mixed in"],["school","School first"]].map(function(x){ return mom?_hhBtn("hpFitSet('mom','"+x[0]+"')",x[1],f===x[0]):_hhChip(x[1],f===x[0]?'#2B7A78':'#f3f4f6',f===x[0]?'#fff':'#475569'); }).join('')+'</div>'
    +'<div style="font-size:10.5px;color:var(--muted);margin-top:3px">'+(f==="mixed"?'On: each house chore you haven’t answered shows on your schedule in the first gap long enough. No lesson moves for it. School first turns it off.':'Your house chores wait at the end of school on your schedule, as now. Tap Mixed in and each one you haven’t answered finds the first gap in your school day that is long enough.')+'</div></div>'; }
// HOUSEMIXSET_END
function hpSettingsHTML(who){
  const mom=(typeof momHere!=="function")||momHere(), P=hhPeopleOf(who), fit=hpFitOf(who), inp='width:62px;padding:4px 6px;border:1.5px solid #e5e7eb;border-radius:8px;font-size:12.5px';
  const lim=function(f,label,ex){ const own=hhPeopleLim(who,f==="weekend"), cur=hhBudget(who,f==="weekend"?HP_SAT:HP_MON);
    return '<div style="display:flex;align-items:center;gap:8px;padding:5px 12px;border-top:1px solid #f3f4f6;font-size:12.5px"><span style="flex:1">'+label+' <span style="font-size:11px;color:var(--muted)">'+ex+'</span></span>'
      +(mom?'<input type="number" min="0" max="600" value="'+(own===null?'':own)+'" placeholder="'+cur+'" onchange="hpLimitSet(\''+who+'\',\''+f+'\',this.value)" style="'+inp+'">':'<b>'+cur+'</b>')+' min'+(own===null?' <span style="font-size:10.5px;color:var(--muted)">(as before)</span>':'')+'</div>'; };
  let h='<div style="'+HP_CARD+'"><div style="padding:9px 12px;font-size:14px;font-weight:800">⚙ Settings</div>';
  h+=lim("school","School-day limit","house chores, Mon–Fri")+lim("weekend","Weekend limit","Sat and Sun");
  if(who==="mom"&&typeof hpMixHTML==="function") h+=hpMixHTML(mom); else   // 🏡 HOUSEMIX: hers is the step-7 switch
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
  h+=(hhEngineMode()==='on')?'':hpPreviewSwitchHTML();   // the preview switch hides while the plan is on (HOUSESWITCH)
  h+=(typeof hpOnHTML==='function')?hpOnHTML(who):'';   // 🚪 HOUSESWITCH: the real switch, and today's stored plan while it is on
  const run=on?hpRun():null, d0=run&&run[0];
  // Today
  h+='<div style="'+HP_CARD+'"><div style="padding:9px 12px;border-left:4px solid '+hhRmCol(who)+';font-size:14px;font-weight:800">📅 Today · '+esc(hhWhoName(who))+(d0?' <span style="font-size:11.5px;font-weight:700;color:var(--muted)">house '+d0.used[who]+' of '+d0.limit[who]+' min</span>':'')+'</div>';
  if(hhIsKid(who)&&typeof lsFourHTML==='function') h+=lsFourHTML(who,'padding:2px 12px 4px');   // 🔥 LISTSTREAK (P2): the four streaks, as in the Kids today pop-up
  const R=hpRoutineNow(who); h+='<div style="'+HP_HEAD+'">🧼 Health and 🐾 animals — on their lists now</div>'+(R.length?R.map(function(r){ return hpRow(r.id,r.emoji,r.label,'',!!r.done); }).join(''):'<div style="padding:3px 12px 6px;font-size:12px;color:var(--muted)">Nothing due today.</div>');
  if(hhIsKid(who)&&typeof amList==="function"){ const C=amList(who).filter(function(c){ return !c.done&&c.dueIso<=today; });
    if(C.length) h+='<div style="'+HP_HEAD+'">🌅 Sent to the morning list</div>'+C.map(function(c){ return hpRow("",c.emoji,c.label,_hhChip('from '+hpDay(c.fromIso)+((typeof amPay==="function"&&amPay(who,c,today)!==c.pts)?' · '+c.pts+' → '+amPay(who,c,today)+' ⭐':''),'#fef3c7','#92400e')); }).join(''); }   // CHOREAMWHY (C4): an ignored one shows what it pays
  h+=(typeof hqPersonWaitHTML==="function")?hqPersonWaitHTML(who):'';   // HOUSEQUIET: still on their list from an earlier day, with Mom's note
  if(d0){ const mine=(d0.list[who]||[]).filter(function(id){ return d0.plan[id].house; }), mv=hpMovedOff(d0,who);
    h+='<div style="'+HP_HEAD+'">🔭 House chores the plan WOULD give today — preview</div><div style="display:flex;gap:8px;align-items:center;padding:2px 12px 4px;font-size:11px;color:var(--muted)">'+hpBar(d0.used[who],d0.limit[who])+'<span>'+d0.used[who]+' / '+d0.limit[who]+' min</span></div>';
    h+=mine.length?mine.map(function(id){ const x=d0.plan[id], j=J[id]||{}; return hpRow(id,j.emoji,j.label,(x.why==="deep"?_hhChip('✨ grown-up turn','#ede9fe','#5b21b6'):'')+(typeof hqPlanNote==="function"?hqChip(hqPlanNote(j,x.late,today)):(x.late>0?_hhChip(x.late+' day'+(x.late===1?'':'s')+' late','#fee2e2','#991b1b'):''))+(x.from?_hhChip('from '+hhWhoName(x.from),'#e0f2fe','#075985'):'')+_hhChip(x.mins+' min','#f3f4f6','#475569')); }).join(''):'<div style="padding:3px 12px 6px;font-size:12px;color:var(--muted)">No house chores for them today.</div>';
    if(mv.length) h+='<div style="'+HP_HEAD+'">Moved off them today</div>'+mv.map(function(m){ const j=J[m.id]||{}; return hpRow(m.id,j.emoji,j.label,_hhChip(hpMovedTxt(m)+(m.to==="grab"?' · '+hgX2For(m.id,m.can,'for ','no kid can'):''),m.to==="grab"?'#fef3c7':'#e0f2fe',m.to==="grab"?'#92400e':'#075985')); }).join('');
  }
  h+='<div style="height:6px"></div></div>';
  h+=(typeof htdPersonHTML==="function")?htdPersonHTML(who):'';   // HOUSETODO: 📝 their one-time jobs, under Today
  // The next seven days
  if(run){ h+='<div style="'+HP_CARD+'"><div style="padding:9px 12px;font-size:14px;font-weight:800">📆 This week <span style="font-size:11px;font-weight:600;color:var(--muted)">today and the 6 days after · house minutes vs limit · preview</span></div>';
    run.slice(0,7).forEach(function(p){ const mv=hpMovedOff(p,who), cnt={}; mv.forEach(function(m){ cnt[m.to]=(cnt[m.to]||0)+1; });
      h+='<div style="display:flex;align-items:center;gap:8px;padding:5px 12px;border-top:1px solid #f3f4f6;font-size:12px"><span style="width:62px;font-weight:800;color:'+(p.iso===today?'#2B7A78':'#475569')+'">'+hpDay(p.iso)+'</span>'+hpBar(p.used[who],p.limit[who])+'<span style="width:58px;text-align:right;font-weight:700">'+p.used[who]+' / '+p.limit[who]+'</span></div>'
        +(mv.length?'<div style="padding:0 12px 5px 82px;font-size:11px;color:#475569">'+Object.keys(cnt).map(function(t){ return hpMovedTxt({to:t})+(cnt[t]>1?' ×'+cnt[t]:''); }).join(' · ')+'</div>':''); });
    h+='</div>'; }
  h+=(typeof hwCardHTML==="function")?hwCardHTML():'';   // HOUSEWEEK: 📅 the week, set to this person
  h+=(typeof hoCardHTML==="function")?hoCardHTML():'';   // HOWOFTEN: 📊 how often, set to this person
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
function hpFuture(){ return hpRun().map(function(p){ const m={}; Object.keys(p.plan).forEach(function(id){ const x=p.plan[id]; m[id]={who:x.who,done:false,fut:true,late:x.late,from:x.from||""}; if(x.why==="deep") m[id].deep=1; }); p.over.forEach(function(o){ m[o.id]={who:o.turn,done:false,fut:true,over:true,late:o.late}; }); return m; }); }
function hpSqHTML(c,full){
  if(c.over) return '<span title="Nobody who can has room: would go to Up for Grabs" style="font-size:10.5px;font-weight:800;white-space:nowrap;color:#b45309">'+(full?'→ Grabs':'Grab')+'</span>';
  const col=hhRmCol(c.who); return '<span title="Plan preview" style="font-size:10.5px;font-weight:800;white-space:nowrap;color:'+col+';border-bottom:1.5px dashed '+col+'">'+esc(full?hhWhoName(c.who):hhRmShort(c.who))+(c.deep?' ✨':'')+(c.late>0?' <span style="color:#dc2626">'+c.late+'d</span>':'')+'</span>';
}
function hpGridNoteHTML(){ return ' Days after today are the 🔭 plan preview: who the plan WOULD give each chore, within everyone’s limits (dashed; “2d” = 2 days late; “Grab” = nobody who can has room, so it would go to Up for Grabs). Nothing is on anyone’s list.'; }
function hpTomorrowHTML(){
  const run=hpRun(), p=run[1], J=hhJobs(), mom=(typeof momHere!=="function")||momHere(); if(!p) return '';
  let h='<div style="'+HP_CARD+';margin-top:10px"><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding:9px 12px;background:#ecfeff"><span style="font-size:14px;font-weight:800;flex:1">🔭 Tomorrow would look like this · '+hpDay(p.iso)+'</span>'+(mom?_hhBtn("hhEngineTap(false)",'Stop showing the preview',false,'#64748b'):'')+'</div>'
    +'<div style="padding:4px 12px 2px;font-size:11px;color:var(--muted)">A preview of the new hand-out with today’s limits. Nobody’s list changes; nothing goes to Up for Grabs.</div>';
  hpWho().forEach(function(w){ const ids=(p.list[w]||[]).filter(function(id){ return p.plan[id].house; });
    h+='<div style="display:flex;gap:8px;align-items:center;padding:7px 12px 2px;border-top:1px solid #eef2f0;font-size:12.5px"><span style="width:62px;font-weight:800;color:'+hhRmCol(w)+'">'+esc(hhWhoName(w))+'</span>'+hpBar(p.used[w],p.limit[w])+'<span style="width:62px;text-align:right;font-size:11px;font-weight:700">'+p.used[w]+' / '+p.limit[w]+' min</span></div>';
    h+=ids.length?ids.map(function(id){ const x=p.plan[id], j=J[id]||{}; return hpRow(id,j.emoji,j.label,(x.why==="deep"?_hhChip('✨ grown-up turn','#ede9fe','#5b21b6'):'')+(x.late>0?_hhChip(x.late+'d late','#fee2e2','#991b1b'):'')+(x.from?_hhChip('from '+hhWhoName(x.from),'#e0f2fe','#075985'):'')+_hhChip(x.mins+' min','#f3f4f6','#475569')); }).join(''):'<div style="padding:0 12px 4px 82px;font-size:11px;color:var(--muted)">No house chores.</div>'; });
  h+='<div style="'+HP_HEAD+';border-top:2px solid #fde68a;padding-top:8px">Would go to Up for Grabs ('+p.over.length+')</div>';
  h+=p.over.length?p.over.map(function(o){ const j=J[o.id]||{}; return hpRow(o.id,j.emoji,j.label,_hhChip(hhWhoName(o.turn)+'’s turn','#f3f4f6','#475569')+_hhChip(hgX2For(o.id,o.can,'at double for: ','no kid can'),'#fef3c7','#92400e')+_hhChip(o.mins+' min','#f3f4f6','#475569')); }).join(''):'<div style="padding:0 12px 6px;font-size:12px;color:var(--muted)">Nothing — everything fits.</div>';
  return h+'<div style="height:6px"></div></div>';
}
// HOUSEPREVIEW_END
// ROOMNOW_START — 🔴 Now at the top of a room page (DESIGN_now_todo_schedule_2026-11-17 §2, slice A; her words 2026-11-17: "I like
// with the laundry system how I have the laundry active area and the laundry to do, and then it also has the laundry schedule … if
// those could be incorporated into all the rooms", and "Yes, build A"). What is live in this room today: every chore in it that is
// on someone's list today — who (in their colour), the time of day, done or not; late ones first with the red late badge; done ones
// folded into one quiet line. With the plan switched on and today's plan stored (hdLive), a chore the plan hands out reads the stored
// day (plan · done · skip · over, and → Give to… on what fit nobody, Mom only); every other chore in the room — and every chore with
// the plan off, on preview, or not stored yet — reads the room grid's own today square (hhRmCell), so this card and the grid's today
// row never disagree. Late off the plan = the grid's own "past its usual gap" (hhRoomStats). Room clear → the next chore due here,
// from the run the page already works out (hpRun, 29 days). DISPLAY ONLY: no check-off and no write; a ✅ is a mark, not a button.
const RN_DAY=["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
function rnSlot(j,who){ const s=(j&&j.slot)||""; if(hhIsKid(who)) return SL_SLBL[SL_SLOTS.indexOf(s)>=0?s:"chores"]||"";
  const m=HH_MC_SLOTS.find(function(x){ return x[0]===s; }); return m?m[1]:(SL_SLBL[s]||""); }
// Days past its usual gap (hhRoomStats' own test): 0 = not late, -1 = late and never done in 8 weeks.
function rnLate(j,t,id){ if(hhLaneOf(j)==="once"||j.hold) return 0; const n=hfNeed(id,j); if(!n) return 0;
  if(n.never) return (j.from&&t-_hhDayNum(j.from)<=n.interval)?0:-1; return n.pct>100?Math.max(1,n.days-n.interval):0; }
function rnRows(rid){ if(!_hfD) return _rnRows(rid); const R=hfMemo("rn|"+rid,function(){ return _rnRows(rid); }); return {iso:R.iso,plan:R.plan,rows:R.rows.slice(),over:R.over.slice()}; }   // HOUSEFAST
function _rnRows(rid){
  const J=hhJobs(), t0=_hhIsoLocal(Date.now()), t=_hhDayNum(t0), r=(typeof hdLive==="function")?hdLive(t0):null, S=hhLogState(), rc={}, rows=[], over=[];
  const here=function(id){ return !!J[id]&&hhRoomOn(J[id])===rid; };
  if(r){ Object.keys(r.plan||{}).filter(here).forEach(function(id){ const x=r.plan[id]; rows.push({id:id,who:x.who,done:hdDone(t0,id),late:x.late||0,skip:!!(r.skip&&r.skip[id])}); });
    Object.keys(r.over||{}).filter(here).forEach(function(id){ const d=(typeof hdDoneRec==="function")?hdDoneRec(t0,id):null; if(d&&d.grab){ rows.push({id:id,who:d.who,done:true,late:0,grab:1}); return; } over.push({id:id,turn:r.over[id].turn,mins:r.over[id].mins}); }); }   // 🙌 HOUSEOVER
  (hhRoomChores()[rid]||[]).forEach(function(id){ const j=J[id]; if(r&&hdManaged(j)) return;   // the plan's own: only as the stored day has it
    const c=hhRmCell(id,t0,t0,S,rc); if(c) rows.push({id:id,who:c.who,done:!!c.done,late:c.done?0:rnLate(j,t,id)}); });
  const L=function(x){ return x.late<0?1e4:x.late; };
  rows.sort(function(a,b){ return (L(b)-L(a))||(SL_SLOTS.indexOf(J[a.id].slot)-SL_SLOTS.indexOf(J[b.id].slot))||String(J[a.id].label).localeCompare(String(J[b.id].label))||(a.id<b.id?-1:1); });
  return {iso:t0,plan:!!r,rows:rows,over:over};
}
// The next chore due in this room after today, from the engine's run: {iso, id, who, n (days from today)} or null.
function rnNext(rid){ let run=null; try{ run=hpRun(); }catch(e){ return null; } const J=hhJobs();
  for(let i=1;i<(run||[]).length;i++){ const p=run[i], ids=Object.keys(p.plan||{}).filter(function(id){ return J[id]&&hhRoomOn(J[id])===rid; }).sort(function(a,b){ return ((p.plan[a].order||0)-(p.plan[b].order||0))||(a<b?-1:1); });
    if(ids.length) return {iso:p.iso,id:ids[0],who:p.plan[ids[0]].who,n:i}; }
  return null; }
function rnNowHTML(rid){
  const J=hhJobs(), mom=(typeof momHere!=="function")||momHere(), R=rnRows(rid), open=R.rows.filter(function(x){ return !x.done; }), done=R.rows.filter(function(x){ return x.done; });
  const who=function(w){ return '<span style="font-size:11px;font-weight:800;white-space:nowrap;color:'+hhRmCol(w)+'">'+esc(hhWhoName(w))+'</span>'; };
  let h='<div style="'+HP_CARD+'"><div style="padding:9px 12px;font-size:14px;font-weight:800">🔴 Now <span style="font-size:11px;font-weight:600;color:var(--muted)">'+(R.plan?'today’s plan':'today, from the lists')+'</span></div>';
  h+=open.map(function(x){ const j=J[x.id], sl=rnSlot(j,x.who);
    return hpRow(x.id,j.emoji,j.label,(typeof hqRowNote==="function"?hqChip(hqRowNote(x,j,R)):(x.late?_hhChip(x.late<0?'late':x.late+' day'+(x.late===1?'':'s')+' late','#fee2e2','#991b1b'):''))+(x.skip?_hhChip('skipped','#f3f4f6','#6b7280'):'')+who(x.who)+(sl?_hhChip(esc(sl),'#f3f4f6','#475569'):''),false); }).join('');
  const wt=(typeof hqRoomWaitHTML==="function")?hqRoomWaitHTML(rid,R):''; h+=wt;   // HOUSEQUIET: still on a kid's list from an earlier day
  if(R.over.length) h+='<div style="'+HP_HEAD+';border-top:2px solid #fde68a;padding-top:8px">Didn’t fit anyone today ('+R.over.length+')</div>'+R.over.map(function(o){ const j=J[o.id];
    return hpRow(o.id,j.emoji,j.label,_hhChip(esc(hhWhoName(o.turn))+'’s turn','#f3f4f6','#475569')+_hhChip(o.mins+' min','#f3f4f6','#475569')+hpGrabChip(R.iso,o.id)+(mom?'<span onclick="event.stopPropagation()">'+hpGiveSel(R.iso,o.id,"")+'</span>':'')); }).join('');
  if(!open.length&&!R.over.length&&!wt){ const n=rnNext(rid), j=n&&J[n.id];
    h+='<div style="padding:6px 12px 8px;border-top:1px solid #f3f4f6;font-size:12.5px;font-weight:700;color:#166534">Nothing left in '+esc(hhRoomEmoji(rid)+' '+hhRoomName(rid))+' today.'+(j?' <span style="font-weight:600;color:#475569">Next: '+esc(j.label)+', '+RN_DAY[_hhDow(n.iso)]+(n.n>6?' '+(+n.iso.slice(5,7))+'/'+(+n.iso.slice(8)):'')+' ('+esc(hhWhoName(n.who))+').</span>':'')+'</div>'; }
  if(done.length) h+='<div style="padding:5px 12px 7px;border-top:1px solid #f3f4f6;font-size:11.5px;color:#6b6560">✅ '+done.length+' done: '+done.map(function(x){ return esc(J[x.id].label)+' ('+esc(hhWhoName(x.who))+(x.grab?', ×2 grab':'')+')'; }).join(', ')+'</div>';
  return h+'</div>';
}
// ROOMNOW_END
// HOUSEQUIET_START — quiet Household pages and Mom's notes (DESIGN_missed_chores_2026-11-19 §4 and §8 row B; the hub's brief
// 2026-11-23). On her table 72 of 79 open chores on the rooms' 🔴 Now were red "late": the page's own test (rnLate: more days since
// last done than the usual gap) called a daily not done yesterday late, and a chore nobody ticks late for ever. Her words 11/19: "kids
// see nothing but mom view sees the notes"; "i def want to keep the ones 3 or more times a week like they are now where it shows how
// late it is". This block changes what the pages DRAW, never what they rank: rnLate, hhRoomStats, hhHouseOrder, the order of 🔴 Now's
// rows and rooms, the 🧽 cleaning day's picks (hhPlanCandidates) and "most behind first" (hhNeedPct) are untouched.
//   · a row due today: no red. A daily says nothing (not done yesterday = simply due today); a chore with no tick in the 8 weeks of
//     history says "no tick in 8 weeks" (Mom's, Dad's and Up for Grabs rows: the record is missing, not the chore); one past its
//     usual gap says "last done 9 days ago". Grey.
//   · a chore still on a kid's list from an earlier day (the lists' own count, mdLateDays, CHOREWAIT's wait) is shown on 🔴 Now,
//     👤 By person ▸ Today and 📅 Schedule with the Kids today pop-up's own words (boardStatPop): "from Tue · day 2 of 2 · pays 6 of
//     10 ⭐" (rtWaitNote, rtFallPay). 3 or more weekdays: the red "1 day late" (rtWaitAsBefore), as she chose.
//   · the plan's own carried rows (today's stored plan, the preview's days): "from Tue · day 2"; red only for 3 or more weekdays.
//   · room headers and 🏠 Whole house: "% done" in place of the red late count (done on its day or later ÷ times due, the 8 weeks
//     before today); a chore above the Cleaning level is left out of it and the room says so: "not on a list yet".
// The grey notes are for Mom (and Dad's own link), as in the pop-up. Every caller asks typeof first, so without this block the
// pages are exactly as before (test_house_quiet.js's baseline). Reads only; writes nothing.
function hqEyes(){ return (typeof momHere!=="function"||momHere())||(typeof _kioskD==="function"&&_kioskD()); }
function hq3(st){ return typeof rtWaitAsBefore==="function"&&rtWaitAsBefore(st); }
function hqRed(n){ return {red:1,txt:n+" day"+(n>1?"s":"")+" late",s:n+"d"}; }
// Today's rows on a kid's Afternoon / Chores / Evening list from an earlier day: {id: {id, who, slot, n, st}} (st = the list's row).
function hqWaits(){ return _hfD?hfMemo("hqw",_hqWaits):_hqWaits(); }
function _hqWaits(){ const J=hhJobs(), out={}, raw={}, disp={}; let dn="";
  try{ dn=_todayDay; }catch(e){ return out; } if(!dn||typeof mdLateDays!=="function"||typeof rtIsMulti!=="function"||typeof rtWaitNote!=="function") return out;
  const live=(typeof hdLive==="function")?hdLive(hpToday()):null;
  Object.keys(J).forEach(function(id){ const j=J[id], k=j&&j.who, sl=j&&j.slot;
    if(!j||j.status==="retired"||j.free||!hhIsKid(k)||!rtIsMulti(sl)||!hhLevelOut(j)||(live&&typeof hdManaged==="function"&&hdManaged(j))) return;
    const key=sl+"|"+k; if(!raw[key]){ raw[key]=rtStepsFor(sl,k,true)||[]; disp[key]=rtStepsFor(sl,k,false,dn)||[]; }
    const i=raw[key].findIndex(function(st){ return st&&st._hh===id; }), st=i<0?null:disp[key][i];
    if(!st||st.cad==="none"||(typeof rtWaved==="function"&&rtWaved(sl,k,dn,i))) return;
    const n=mdLateDays(sl,k,dn,i,st); if(n>0) out[id]={id:id,who:k,slot:sl,n:n,st:st}; });
  return out; }
// One room's waiting rows not already among its 🔴 Now rows ("__none" = no room), most days first.
function hqWaitRows(rid,R){ if(rid==="") return []; const J=hhJobs(), W=hqWaits(), have={}; ((R&&R.rows)||[]).forEach(function(x){ have[x.id]=1; });
  return Object.keys(W).filter(function(id){ return !have[id]&&J[id]&&(hhRoomOn(J[id])||"__none")===rid; }).map(function(id){ return W[id]; })
    .sort(function(a,b){ return (b.n-a.n)||String(J[a.id].label).localeCompare(String(J[b.id].label))||(a.id<b.id?-1:1); }); }
// The notes, {red, txt, s (the short form)} or null.
function hqWaitNote(w){ const st=w.st, n=w.n; if(hq3(st)) return hqRed(n);
  const p=(st&&st.pts)||0, f=(typeof rtFallPay==="function")?rtFallPay(st,n,w.who):p;
  return {txt:rtWaitNote(n,st)+(f!==p?" · pays "+f+" of "+p+" ⭐":""),s:n+"d"}; }
function hqPlanNote(j,n,iso){ if(!(n>0)) return null; if(hq3(j)) return hqRed(n); return {txt:"from "+RN_DAY[_hhDow(_hhIsoOf(_hhDayNum(iso)-n))].slice(0,3)+" · day "+n,s:n+"d"}; }
function hqRowNote(x,j,R){ if(!x||x.done||!j) return null;
  if(R&&R.plan&&typeof hdManaged==="function"&&hdManaged(j)) return hqPlanNote(j,x.late,R.iso);   // the plan's own row: its own count
  if(!x.late||hhLaneOf(j)==="daily") return null;
  if(x.late<0) return {txt:"no tick in 8 weeks"};
  const n=hfNeed(x.id,j); return n&&!n.never?{txt:"last done "+n.days+" days ago"}:null; }
// Drawn: "chip" (🔴 Now, By person) or "sq" (📅 Schedule: the short form in a day box, the whole note in the open day).
function hqChip(o,sq,short){ if(!o||(short&&!o.s)) return ''; const t=esc(short?o.s:o.txt);
  if(o.red) return sq?' <span style="font-size:10px;font-weight:800;color:#dc2626">'+t+'</span>':_hhChip(t,'#fee2e2','#991b1b');
  if(!hqEyes()) return '';
  return sq?' <span style="font-size:10px;font-weight:700;color:#6b7280">'+t+'</span>':'<span style="font-size:10.5px;font-weight:700;color:#6b7280;white-space:nowrap">'+t+'</span>'; }
function hqWho(w){ return '<span style="font-size:11px;font-weight:800;white-space:nowrap;color:'+hhRmCol(w)+'">'+esc(hhWhoName(w))+'</span>'; }
function hqWaitHTML(L,title){ if(!L.length) return ''; const J=hhJobs();
  return '<div style="'+HP_HEAD+';border-top:1px solid #eef2f0;padding-top:7px">'+title+' ('+L.length+')</div>'+L.map(function(w){ const j=J[w.id], sl=rnSlot(j,w.who);
    return hpRow(w.id,j.emoji,j.label,hqChip(hqWaitNote(w))+hqWho(w.who)+(sl?_hhChip(esc(sl),'#f3f4f6','#475569'):''),false); }).join(''); }
// 🔴 Now on a room page: the rows still on a kid's list from an earlier day.
function hqRoomWaitHTML(rid,R){ return hqWaitHTML(hqWaitRows(rid,R),'Still on their list from an earlier day'); }
// 👤 By person ▸ Today: theirs.
function hqPersonWaitHTML(who){ const J=hhJobs(), W=hqWaits(), L=Object.keys(W).filter(function(id){ return W[id].who===who&&J[id]; }).map(function(id){ return W[id]; })
    .sort(function(a,b){ return (b.n-a.n)||String(J[a.id].label).localeCompare(String(J[b.id].label))||(a.id<b.id?-1:1); });
  return hqWaitHTML(L,'⏳ Still on '+esc(hhWhoName(who))+'’s list from an earlier day'); }
// 🏠 Whole house ▸ 🔴 Now, one room's line: {wait, wred, red} beside "N left" — wait = rows still on a kid's list from an earlier day,
// red = rows with the red tag (open or waiting), wred = the waiting ones among them (drawn once, as "late", not also as "waiting").
function hqNowCounts(rid,R,open){ const W=hqWaitRows(rid,R), J=hhJobs(); let red=0, wred=0;
  open.forEach(function(x){ const o=hqRowNote(x,J[x.id],R); if(o&&o.red) red++; }); W.forEach(function(w){ const o=hqWaitNote(w); if(o&&o.red){ red++; wred++; } });
  return {wait:W.length,wred:wred,red:red}; }
function hqNowTail(x){ const q=x.wait-(x.wred||0); return (q?'<span style="font-size:11px;font-weight:700;color:#6b7280">'+q+' waiting</span>':'')+(x.red?_hhChip(x.red+' late','#fee2e2','#991b1b'):''); }
// 📅 Schedule: one square with its note. c.hq = the note worked out with today's rows (hwToday); else the plan's count on that day.
function hqSq(c,mode,full,id,iso){ const o=c.hq!==undefined?c.hq:(c.late>0&&!c.over?hqPlanNote(hhJobs()[id]||{},c.late,iso):null);
  if(c.over||(c.fut&&mode==="preview")) return hpSqHTML(Object.assign({},c,{late:0}),full)+hqChip(o,true,!full);
  return _hhRmSq({who:c.who,done:c.done},full)+hqChip(o,true,!full); }
// The note rides on the cell as a hidden (non-enumerable) field, so a cell reads exactly as before to anything that lists its fields.
function hqSchedToday(out,f,rows){ const J=hhJobs(), inS={}, put=function(c,o){ Object.defineProperty(c,"hq",{value:o,configurable:true}); return c; };   /* a chore in two rows (the plan's no room and the lists'): the last wins, as its cell does */ hwIds(f).forEach(function(id){ inS[id]=1; });
  rows.forEach(function(r){ if(out[r.x.id]&&!out[r.x.id].over) put(out[r.x.id],hqRowNote(r.x,J[r.x.id],r.R)); });
  const W=hqWaits(); Object.keys(W).forEach(function(id){ if(!inS[id]||out[id]||!J[id]) return; out[id]=put({who:W[id].who,done:false,late:0},hqWaitNote(W[id])); });
  return out; }
// "% done" for a room's chores: times done (on its day or later, before its next day) ÷ times due, the 8 weeks before today
// (hhStats, the same record as "on time"). One-time jobs, held ones and chores above the Cleaning level (on nobody's list) are left out.
function hqAbove(j){ return !hhLevelOut(j)&&!(j.who==="grab"&&typeof hgOn==="function"&&hgOn()); }   // 🔍 Checks' own test
function hqDone(ids){ const J=hhJobs(); let due=0, done=0, up=0;
  ids.forEach(function(id){ const j=J[id]; if(!j||hhLaneOf(j)==="once"||j.hold) return; if(hqAbove(j)){ up++; return; } const st=hfStats(id,j); due+=st.due8; done+=st.done8; });
  return {pct:due?Math.round(100*done/due):null,up:up}; }
function hqDoneChip(ids){ const d=hqDone(ids); return d.pct===null?'':_hhChip(d.pct+'% done','#f3f4f6','#1f2937'); }
function hqHeadTail(ids,s){ const d=hqDone(ids); return (d.pct===null?'':' · '+d.pct+'% done')+' · on time '+(s.pct===null?'–':s.pct+'%')+(d.up?' · '+d.up+' above the Cleaning level, not on a list yet':''); }
// HOUSEQUIET_END
// ROOMTODO_START — 📝 To do on a room page (DESIGN_now_todo_schedule_2026-11-17 §2, slice A; her "Yes, build A" 2026-11-17 with the
// hub's picks: "laundry to do" = the 📝 checklist; a room's To do is that room's part of the ☑️ One-time pile, with a quick ＋ To-do and
// a ✓ "I did it myself"). Rows: this room's one-time chores (hhIsOnce, the room it shows under on this page), not retired. Waiting
// ones: the note, "from Tue" (the laundry to-do's wording, llTdListRow: the weekday, plus the date once it is more than 6 days old)
// and the pile's own Send to… (hhOnceSend); sent ones, quietly: "on Ben's list" and ⏸ Back to the pile (hhOnceHold). ＋ To-do saves
// through the ONE add save (hhAddSave, ＋ Add chore ▸ One time) with this room, Mom's, anyone can do it — and puts the Add form's own
// draft back as it was. ✓ (Mom, a waiting row) ends it the way a finished one-time chore ends — status "retired" + done <today>, no
// stars to anyone — and keeps what it changed in doneSelf {on, was}, so the row stays ticked until the day ends and a second tap puts
// the record back exactly. Only household/jobs/<id>/{status,done,doneSelf}, one update, through _hhWrite() (?dryrun=1 writes nothing).
// The full ☑️ pile under ⋯ More is unchanged.
let rtdOpen={};
function rtdTicked(j,t){ return !!(j&&j.status==="retired"&&j.doneSelf&&j.doneSelf.on===t); }
function rtdIds(rid){ const J=hhJobs(), t=_hhIsoLocal(Date.now()), grp=function(j){ return (j.hold||j.status==="retired")?0:1; };
  return Object.keys(J).filter(function(id){ const j=J[id]; return hhIsOnce(j)&&hhRoomOn(j)===rid&&(j.status!=="retired"||rtdTicked(j,t)); })
    .sort(function(a,b){ const A=J[a], B=J[b]; return (grp(A)-grp(B))||String(A.from||"").localeCompare(String(B.from||""))||((A.ts||0)-(B.ts||0))||(a<b?-1:1); }); }
function rtdFrom(iso,t){ if(!hpIsIso(iso)||iso>=t) return ''; const n=_hhDayNum(t)-_hhDayNum(iso); return ' · <span style="color:#b45309">from '+["Mon","Tue","Wed","Thu","Fri","Sat","Sun"][_hhDow(iso)]+(n>6?' '+(+iso.slice(5,7))+'/'+(+iso.slice(8)):'')+'</span>'; }
function rtdToggleForm(rid){ if(typeof momHere==="function"&&!momHere()) return; rtdOpen[rid]=!rtdOpen[rid]; hhRender(); }
function rtdHTML(rid){
  const J=hhJobs(), mom=(typeof momHere!=="function")||momHere(), t=_hhIsoLocal(Date.now()), ids=rtdIds(rid), inp='padding:5px 7px;border:1.5px solid #e5e7eb;border-radius:8px;font-size:12.5px;font-family:\'DM Sans\',sans-serif;box-sizing:border-box';
  let h='<div style="'+HP_CARD+'"><div style="display:flex;gap:8px;align-items:center;padding:9px 12px"><span style="font-size:14px;font-weight:800;flex:1">📝 To do <span style="font-size:11px;font-weight:600;color:var(--muted)">one-time jobs for this room</span></span>'+(mom?_hhBtn("rtdToggleForm('"+rid+"')",rtdOpen[rid]?'Cancel':'＋ To-do',false,'#7c3aed'):'')+'</div>';
  if(mom&&rtdOpen[rid]) h+='<div style="display:flex;gap:5px;align-items:center;padding:0 12px 8px"><input id="rtd-emoji" placeholder="📝" style="'+inp+';width:44px;text-align:center"><input id="rtd-label" placeholder="What needs doing?" style="'+inp+';flex:1;min-width:120px">'+_hhBtn("rtdSave('"+rid+"')",'Save',true,'#7c3aed')+'</div>';
  if(!ids.length) return h+'<div style="padding:0 12px 9px;font-size:12px;color:var(--muted)">Nothing waiting here.</div></div>';
  ids.forEach(function(id){ h+=rtdRowHTML(id,J[id],mom,t); });
  return h+'<div style="height:4px"></div></div>';
}
// One row of the card (HOUSETODO draws the same rows on 🏠 Whole house): a sent one quietly, a waiting or ticked-today one with ✓ and Send to….
function rtdRowHTML(id,j,mom,t){ const tick=rtdTicked(j,t), wait=tick||hhOnceHeld(j);
  if(!wait) return '<div style="display:flex;align-items:center;gap:7px;padding:5px 12px;border-top:1px solid #f3f4f6;font-size:12px;color:#6b6560"><span'+hoTap(id,mom)+'>'+(j.emoji||'☑️')+'</span><span'+hoTap(id,mom,'flex:1')+'>'+esc(j.label)+' · on '+esc(hhWhoName(j.who))+'’s list</span>'+(mom?_hhBtn("hhOnceHold('"+id+"')",'⏸ Back to the pile',false,'#64748b'):'')+'</div>';
  return '<div style="padding:5px 12px;border-top:1px solid #f3f4f6'+(tick?';opacity:.6':'')+'"><div style="display:flex;align-items:center;gap:7px;font-size:12.5px">'
      +(mom?'<button onclick="rtdTick(\''+id+'\')" title="'+(tick?'Not done after all':'I did it myself')+'" style="flex:none;width:22px;height:22px;border-radius:6px;border:1.5px solid #7c3aed;background:'+(tick?'#7c3aed':'#fff')+';color:#fff;font-size:12px;font-weight:800;cursor:pointer;padding:0">'+(tick?'✓':'')+'</button>':'')
      +'<span'+hoTap(id,mom)+'>'+(j.emoji||'☑️')+'</span><span'+hoTap(id,mom,'flex:1;font-weight:700'+(tick?';text-decoration:line-through':''))+'>'+esc(j.label)+'<span style="font-weight:400;color:#6b6560">'+(tick?' · done today':rtdFrom(j.from,t))+'</span></span></div>'
      +(mom&&!tick?'<div style="margin:4px 0 2px 29px">'+_hhOnceSendBtns(id,j)+'</div>':'')+'</div>'; }
// ＋ To-do: the Add form's draft set to a one-time job in this room for Mom, anyone can do it; hhAddSave makes and writes the record.
function rtdSave(rid,label,emoji){
  if(typeof momHere==="function"&&!momHere()) return null; if(!hhRoomList().some(function(r){ return r[0]===rid; })) return null;
  const el=function(id){ return (typeof document!=="undefined"&&document.getElementById)?document.getElementById(id):null; }, val=function(id){ const e=el(id); return (e&&e.value!==undefined)?String(e.value||""):""; };
  if(label===undefined) label=val("rtd-label"); if(emoji===undefined) emoji=val("rtd-emoji");
  if(!String(label||"").trim()){ hpTell("Write the to-do first"); return null; }
  if(el("hh-add-label")){ hpTell("Close the chore card first"); return null; }   // hhAddSave reads the open card's fields before its draft
  const keep=JSON.parse(JSON.stringify(hhAdd)), keepOpen=hhAddOpen, can={}; hpWho().forEach(function(w){ if(w!=="mom") can[w]=true; });
  Object.assign(hhAdd,{label:String(label),emoji:String(emoji||""),pts:"",who:"mom",slot:"",kind:"once",room:rid,level:0,area:"",can:can});
  let id=null; try{ id=hhAddSave(); } finally { Object.keys(hhAdd).forEach(function(k){ delete hhAdd[k]; }); Object.assign(hhAdd,keep); hhAddOpen=keepOpen; }
  if(id){ rtdOpen[rid]=false; hhRender(); } return id;
}
// ✓ I did it myself / tap again: not done after all (today only). Returns the update it wrote.
function rtdTick(id){
  if(typeof momHere==="function"&&!momHere()) return null; const j=hhJobs()[id], t=_hhIsoLocal(Date.now()); if(!j||!hhIsOnce(j)) return null;
  const P="household/jobs/"+id+"/", upd={};
  if(rtdTicked(j,t)){ const was=j.doneSelf.was||{}; ["status","done"].forEach(function(k){ const v=(was[k]===undefined)?null:was[k]; upd[P+k]=v; if(v===null) delete j[k]; else j[k]=v; }); upd[P+"doneSelf"]=null; delete j.doneSelf; }
  else { if(j.status==="retired"||!hhOnceHeld(j)) return null; const was={}; ["status","done"].forEach(function(k){ if(j[k]!==undefined) was[k]=j[k]; });
    j.status="retired"; j.done=t; j.doneSelf={on:t,was:was}; upd[P+"status"]="retired"; upd[P+"done"]=t; upd[P+"doneSelf"]=j.doneSelf; }
  householdOnValue(householdData); if(_hhWrite()) db.ref().update(upd);
  if(typeof renderAll==="function") renderAll(); else hhRender(); return upd;
}
// ROOMTODO_END
// HOUSEWEEK_START — 📅 Schedule: ONE week card with a filter, on every room page, 🏠 Whole house and 👤 By person
// (DESIGN_now_todo_schedule_2026-11-17 §2 "Schedule", §3 and §5 row B; her "Yes, start B" 2026-11-17, with her picks: one schedule
// drawn by one piece of code, each page opens it set to itself; keep the room's big grid, folded shut under the week, decide later).
// Chips Everything · 🧺 Laundry · 🚪 Room ▾ · 👤 Person ▾ and ‹ week › (Mon–Sun, today outlined). A day box: laundry loads first
// (Everything), then each chore that is not daily on its own short line (who in their colour, ✓ when done), then the dailies folded
// into one line ("6 daily · 5 ✓"); a tap on the day opens everything on it under the week, a tap on a chore opens its card (hcOpen),
// a tap on a load opens 🧺 Laundry (hhGo). Where each day reads from, so it agrees with the page: past days = the room grid's own
// squares (hhRmCell: the Click-off Log, the cleaning days); today = 🔴 Now's rows (rnRows: today's stored plan when the plan is ON and
// stored, else the lists); after today = the plan's run (hpRun, memoised, 29 days; dashed while it is a preview) — with the plan off
// nothing is worked out ahead (the grid draws no days ahead then either) and the engine is not run. 🧺 Laundry = the laundry code's
// own week (llWeekGridHTML, its read-only form: no 🫧 Start / ✓ Done here) with its own ‹ ›. A VIEW: the filter, the week, the open
// day and the grid's fold are plain variables; nothing here writes, on a draw or on any tap.
let hwKey="", hwF=null, hwWk=0, hwDay="", hwGrid={};
const HW_BACK=8, HW_RUN=29, HW_BOX=6, HW_MON=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
// The page's own setting: a room page → that room; 👤 By person → that person; 🏠 Whole house → Everything; 🧺 Laundry → Laundry (slice C).
function hwHome(){ if(hhView==="laundry") return {key:"l",f:{k:"laundry"}}; if(hhView==="person") return {key:"p|"+hpSel,f:{k:"who",id:hpSel}};
  if(hhView==="rooms"&&hhRmSel&&hhRmSel!=="__none") return {key:"r|"+hhRmSel,f:{k:"room",id:hhRmSel}}; return {key:"h|"+hhView+"|"+hhRmSel,f:{k:"all"}}; }
// Another room, person or page → back to that page's own setting, this week, no day open.
function hwFilter(){ const p=hwHome(); if(p.key!==hwKey||!hwF){ hwKey=p.key; hwF=p.f; hwWk=0; hwDay=""; } return hwF; }
function hwPick(k,id){ hwFilter(); if(k==="room"&&!hhRoomList().some(function(r){ return r[0]===id; })) return; if(k==="who"&&hpWho().indexOf(id)<0) return;
  if(k!=="all"&&k!=="laundry"&&k!=="room"&&k!=="who") return; hwF=(k==="all"||k==="laundry")?{k:k}:{k:k,id:id}; hwDay=""; hhRender(); }
// Back 8 weeks (the grid's longest look back, the history's 8 weeks); forward to the week of the plan's last day (29 days); plan off → this week.
function hwBounds(){ return [-HW_BACK,hhEngineMode()==="off"?0:Math.floor((_hhDow(hpToday())+HW_RUN-1)/7)]; }
function hwWeek(d){ hwFilter(); const b=hwBounds(); hwWk=Math.max(b[0],Math.min(b[1],hwWk+d)); hwDay=""; hhRender(); }
function hwDayTap(iso){ hwDay=(hwDay===iso)?"":String(iso); hhRender(); }
function hwGridToggle(rid){ hwGrid[rid]=!hwGrid[rid]; hhRender(); }
function hwToLaundry(){ hwKey=""; if(typeof hhGo==="function") hhGo("laundry"); }   // the page's own 🧺 Laundry chip
function hwIds(f){ const B=hhRoomChores(); if(f.k==="room") return (B[f.id]||[]).slice(); return Object.keys(B).reduce(function(a,r){ return a.concat(B[r]); },[]); }
function hwWho(m,f){ if(f.k!=="who") return m; const out={}; Object.keys(m).forEach(function(id){ if(m[id].who===f.id&&!m[id].over) out[id]=m[id]; }); return out; }
// Today = the 🔴 Now card's rows, room by room ("" and "__none" = the chores in no room: the plan's and the lists').
function hwToday(f){ const out={}, rows=[]; (f.k==="room"?[f.id]:hhRoomList().map(function(r){ return r[0]; }).concat(["__none",""])).forEach(function(rid){ const R=rnRows(rid);
    R.rows.forEach(function(x){ out[x.id]={who:x.who,done:!!x.done,late:x.late||0,skip:!!x.skip}; rows.push({x:x,R:R}); }); R.over.forEach(function(o){ out[o.id]={who:o.turn,done:false,over:true}; }); });
  return hwWho((typeof hqSchedToday==="function")?hqSchedToday(out,f,rows):out,f); }   // HOUSEQUIET: the notes, and the rows still on a kid's list
// One day's squares for this filter, {id: {who, done, fut, over, late, skip}}; null = not worked out (plan off, or past its reach).
function hwCells(iso,f,X){
  if(iso<X.t){ const out={}; X.ids.forEach(function(id){ const c=hhRmCell(id,iso,X.t,X.S,X.rc); if(c) out[id]={who:c.who,done:!!c.done}; }); return hwWho(out,f); }
  if(iso===X.t) return X.td||(X.td=hwToday(f));
  const p=X.run&&X.run[_hhDayNum(iso)-_hhDayNum(X.t)]; if(!p) return null; const inS={}, out={}; X.ids.forEach(function(id){ inS[id]=1; });
  Object.keys(p.plan).forEach(function(id){ if(!inS[id]) return; const x=p.plan[id]; out[id]={who:x.who,done:false,fut:true,late:x.late||0,from:x.from||""}; if(x.why==="deep") out[id].deep=1; });
  p.over.forEach(function(o){ if(inS[o.id]) out[o.id]={who:o.turn,done:false,fut:true,over:true,late:o.late||0}; }); return hwWho(out,f); }
// The laundry line's loads on a day (Everything): what really went in on a past day (llLog), else the line's lay (llProject) — the
// laundry schedule's own two sources, read the way llWeekGridHTML reads them.
function hwLL(t,wk){ try{ if(typeof llWeekGridHTML!=="function"||typeof laundryLine==="undefined") return null; const by={};
  if(wk>=0) llProject(t,7*(wk+1)-llDow(t),llNowMin()>=LL_SWEEP_MIN).forEach(function(r){ by[r.iso]=r; }); return {it:llAll(),by:by}; }catch(e){ return null; } }
function hwLoads(iso,X){ const L=X.ll; if(!L) return []; let out=[]; try{
  const one=function(id,mark,r){ return L.it[id]?{emoji:L.it[id].emoji||'🧺',name:(r&&r.sh&&r.sh[id])||llShortFull(id),mark:mark}:null; };
  out=llJumps(iso).map(function(j){ return {emoji:'💦',name:String(j.label).replace(/^💦\s*/,"").replace(/\s·.*$/,""),mark:""}; });
  if(iso<X.t) return out.concat(llLog(iso).map(function(id){ return one(id,"done"); }).filter(Boolean));
  const r=L.by[iso]; if(r) out=out.concat(r.loads.map(function(id){ return one(id,r.started.indexOf(id)>=0?"done":(r.moved.indexOf(id)>=0||r.waited.indexOf(id)>=0)?"moved":"",r); }).filter(Boolean));
  }catch(e){} return out; }
const HW_LANE={weekly:1,few:2,season:3,once:4,daily:5};
function hwOrder(J,cells){ return Object.keys(cells).filter(function(id){ return J[id]; }).sort(function(a,b){ return (HW_LANE[hhLaneOf(J[a])]-HW_LANE[hhLaneOf(J[b])])||((J[a].order||0)-(J[b].order||0))||String(J[a].label).localeCompare(String(J[b].label))||(a<b?-1:1); }); }
// Who, as the room grid draws a square: pale = not done; ✓ done; dashed = the preview; "Grab" = it would fit nobody.
function hwSq(c,mode,full,id,iso){ if(typeof hqSq==="function") return hqSq(c,mode,full,id,iso); if(c.over||(c.fut&&mode==="preview")) return hpSqHTML(c,full); return _hhRmSq({who:c.who,done:c.done},full)+(c.late?' <span style="font-size:10px;font-weight:800;color:#dc2626">'+(c.late<0?'late':c.late+'d')+'</span>':''); }
function hwWeekLbl(mon,sun){ const m=function(iso){ return HW_MON[+iso.slice(5,7)-1]; }; return m(mon)+' '+(+mon.slice(8))+' – '+(m(sun)===m(mon)?'':m(sun)+' ')+(+sun.slice(8)); }
// The week's seven days for a filter: [{iso, cells, loads}]. The engine only when a day after today is shown and the plan is not off.
function hwWeekData(f,wk){ const t=hpToday(), mode=hhEngineMode(), mon=_hhIsoOf(_hhDayNum(t)-_hhDow(t)+7*wk), days=[0,1,2,3,4,5,6].map(function(d){ return _hhIsoOf(_hhDayNum(mon)+d); });
  const X={t:t,S:hhLogState(),rc:{},ids:hwIds(f),run:(mode!=="off"&&days[6]>t)?(function(){ try{ return hpRun(); }catch(e){ return null; } })():null,ll:f.k==="all"?hwLL(t,wk):null};
  return days.map(function(iso){ return {iso:iso,cells:hwCells(iso,f,X),loads:hwLoads(iso,X)}; }); }
// The chips: Everything · 🧺 Laundry · 🚪 Room ▾ · 👤 Person ▾ (the picked one filled teal). fn = another card's setter (📊 How
// often: hoPick, and no 🧺 Laundry chip); without it, exactly the Schedule card's chips.
function hwChips(f,fn){ const P=fn||"hwPick";
  const pill=function(on,txt,click){ return '<button onclick="'+click+'" style="padding:5px 10px;border-radius:20px;border:1.5px solid '+(on?'#2B7A78':'#cbd5e1')+';background:'+(on?'#2B7A78':'#fff')+';color:'+(on?'#fff':'#334155')+';font-size:11.5px;font-weight:800;cursor:pointer;font-family:\'DM Sans\',sans-serif;white-space:nowrap">'+txt+'</button>'; };
  const pick=function(k,on,lbl,opts){ return '<select onchange="'+P+'(\''+k+'\',this.value)" style="padding:5px 8px;border-radius:20px;border:1.5px solid '+(on?'#2B7A78':'#cbd5e1')+';background:'+(on?'#2B7A78':'#fff')+';color:'+(on?'#fff':'#334155')+';font-size:11.5px;font-weight:800;cursor:pointer;font-family:\'DM Sans\',sans-serif;max-width:46vw"><option value="">'+lbl+'</option>'+opts.map(function(o){ return '<option value="'+esc(o[0])+'"'+(on&&f.id===o[0]?' selected':'')+'>'+esc(o[1])+'</option>'; }).join('')+'</select>'; };
  return pill(f.k==="all",'Everything',P+"('all')")+(fn?'':pill(f.k==="laundry",'🧺 Laundry',"hwPick('laundry')"))
    +pick("room",f.k==="room",'🚪 Room ▾',hhRoomList().map(function(r){ return [r[0],hhRoomEmoji(r[0])+' '+r[1]]; }))+pick("who",f.k==="who",'👤 Person ▾',hpWho().map(function(w){ return [w,hhWhoName(w)]; })); }
function hwCardHTML(){
  const f=hwFilter(), mode=hhEngineMode(), mom=hcMom(), J=hhJobs(), t=hpToday(), b=hwBounds(); hwWk=Math.max(b[0],Math.min(b[1],hwWk));
  const mon=_hhIsoOf(_hhDayNum(t)-_hhDow(t)+7*hwWk), days=[0,1,2,3,4,5,6].map(function(d){ return _hhIsoOf(_hhDayNum(mon)+d); }), lau=f.k==="laundry";
  const nb=function(d,txt,dis){ return '<button onclick="hwWeek('+d+')"'+(dis?' disabled':'')+' style="padding:1px 9px;border-radius:7px;border:1px solid #cbd5e1;background:#fff;font-size:13px;font-weight:800;cursor:pointer;'+(dis?'opacity:.3':'')+'">'+txt+'</button>'; };
  let h='<div style="'+HP_CARD+'"><div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;padding:9px 12px 4px"><span style="font-size:14px;font-weight:800;flex:1">📅 Schedule</span>'
    +(lau?'':nb(-1,'‹',hwWk<=b[0])+'<span style="font-size:11.5px;font-weight:800;white-space:nowrap">'+hwWeekLbl(days[0],days[6])+'</span>'+nb(1,'›',hwWk>=b[1]))+'</div>';
  h+='<div style="display:flex;gap:5px;flex-wrap:wrap;padding:2px 12px 8px">'+hwChips(f)+'</div>';
  if(lau){ let g=''; try{ g=llWeekGridHTML(llToday(),llNowMin()>=LL_SWEEP_MIN,false); }catch(e){ g=''; }
    return h+'<div style="padding:0 12px 10px">'+(g||'<div style="font-size:12px;color:var(--muted)">The laundry schedule is not loaded on this page yet. Open 🧺 Laundry.</div>')+'</div></div>'; }
  const D=hwWeekData(f,hwWk);
  h+='<div style="display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:3px;padding:0 8px">';
  D.forEach(function(d,i){ const iso=d.iso, now=iso===t, past=iso<t, ids=d.cells?hwOrder(J,d.cells):[], dly=ids.filter(function(id){ return hhLaneOf(J[id])==="daily"; }), rest=ids.filter(function(id){ return hhLaneOf(J[id])!=="daily"; });
    const lines=d.loads.map(function(l){ return '<div onclick="event.stopPropagation();hwToLaundry()" title="Open 🧺 Laundry" style="font-size:10px;line-height:1.25;padding:1px 2px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:pointer'+(l.mark==="moved"?';opacity:.45':'')+'">'+esc(l.emoji)+' '+(l.mark==="moved"?'→ ':'')+esc(l.name)+(l.mark==="done"?' <span style="color:#16a34a">✓</span>':'')+'</div>'; })
      .concat(rest.map(function(id){ const j=J[id]; return '<div'+(mom?' onclick="event.stopPropagation();hcOpen(\''+id+'\')"':'')+' title="'+esc(j.label)+'" style="display:flex;gap:2px;align-items:baseline;font-size:10px;line-height:1.25;padding:1px 2px;min-width:0'+(mom?';cursor:pointer':'')+'"><span>'+esc(j.emoji||'☐')+'</span><span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:600">'+esc(j.label)+'</span>'+hwSq(d.cells[id],mode,false,id,iso)+'</div>'; }));
    const nd=dly.filter(function(id){ return d.cells[id].done; }).length;
    h+='<div onclick="hwDayTap(\''+iso+'\')" style="border:1.5px solid '+(hwDay===iso?'#0e7490':now?'#2B7A78':'#eef2f0')+';border-radius:8px;padding:4px 2px;min-height:64px;min-width:0;cursor:pointer;background:'+(past?'#f8fafc':now?'#f0fdfa':'#fff')+'">'
      +'<div style="text-align:center;font-size:10px;color:'+(now?'#2B7A78':'#6b6560')+';font-weight:'+(now?'800':'600')+'">'+(now?'Today':["Mon","Tue","Wed","Thu","Fri","Sat","Sun"][i])+'<div style="font-weight:400">'+(+iso.slice(5,7))+'/'+(+iso.slice(8))+'</div></div>'
      +lines.slice(0,HW_BOX).join('')+(lines.length>HW_BOX?'<div style="font-size:10px;color:var(--muted);padding:1px 2px">+'+(lines.length-HW_BOX)+' more</div>':'')
      +(dly.length?'<div style="font-size:10px;font-weight:800;padding:2px 2px 0;color:'+(nd===dly.length&&iso<=t?'#16a34a':'#475569')+'">'+dly.length+' daily'+(nd===dly.length&&iso<=t?' ✓':nd?' · '+nd+' ✓':'')+'</div>':'')
      +(!d.cells?'<div style="text-align:center;font-size:10px;color:#9ca3af;padding-top:4px">'+(mode==="off"?'—':'past the plan')+'</div>':(!lines.length&&!dly.length)?'<div style="text-align:center;font-size:10px;color:#9ca3af;padding-top:4px">—</div>':'')+'</div>'; });
  h+='</div>';
  const fut=days[6]>t, far=D.filter(function(d){ return !d.cells; }), td=days[0]<=t&&days[6]>=t;
  h+='<div style="padding:6px 12px 8px;font-size:11px;color:var(--muted)">'+(days[0]<t?'Past days are the record: ✓ = done; pale = theirs that day and not checked. ':'')+(td?'Today is '+((typeof hdLive==="function"&&hdLive(t))?'today’s plan':'from the lists as they are now')+'. ':'')
    +(fut?(mode==="off"?'The plan is off, so days after today are not worked out.':mode==="preview"?'Days after today are the 🔭 plan preview (dashed): who the plan WOULD give each chore. Nobody’s list changes.':'Days after today are the plan as it would lay them now; each day’s own plan is made that morning.')
      +(mode!=="off"&&far.length?' The plan looks 4 weeks ahead, so days after '+hpDay(_hhIsoOf(_hhDayNum(t)+HW_RUN-1))+' are not worked out yet.':''):'')+'</div>';
  if(hwDay&&days.indexOf(hwDay)>=0) h+=hwDayHTML(D[days.indexOf(hwDay)],mode,t);
  return h+'</div>';
}
// The open day: every load and every chore on it, dailies too.
function hwDayHTML(d,mode,t){ const J=hhJobs(), ids=d.cells?hwOrder(J,d.cells):[];
  let h='<div style="border-top:1.5px solid #e6f4f3"><div style="'+HP_HEAD+';padding-top:8px">'+(d.iso===t?'Today · ':'')+esc(hpDay(d.iso))+' · everything on it</div>';
  h+=d.loads.map(function(l){ return '<div onclick="hwToLaundry()" style="display:flex;align-items:center;gap:7px;padding:5px 12px;border-top:1px solid #f3f4f6;font-size:12.5px;font-weight:600;cursor:pointer'+(l.mark==="moved"?';color:#6b6560':'')+'"><span>'+(l.mark==="done"?'✅':'')+'</span><span>'+esc(l.emoji)+'</span><span style="flex:1">'+esc(l.name)+(l.mark==="moved"?' · moved on':'')+'</span>'+_hhChip('🧺 Laundry','#f3f4f6','#475569')+'</div>'; }).join('');
  h+=ids.map(function(id){ const c=d.cells[id], j=J[id];
    return hpRow(id,j.emoji,j.label,(c.skip?_hhChip('skipped','#f3f4f6','#6b7280'):'')+hwSq(c,mode,true,id,d.iso),d.iso<=t?!!c.done:undefined); }).join('');
  if(!d.cells) h+='<div style="padding:3px 12px 8px;font-size:12px;color:var(--muted)">'+(mode==="off"?'The plan is off, so who does what on this day is not worked out.':'This day is past the plan’s 4 weeks: not worked out yet.')+'</div>';
  else if(!ids.length&&!d.loads.length) h+='<div style="padding:3px 12px 8px;font-size:12px;color:var(--muted)">Nothing on this day.</div>';
  return h+'<div style="height:6px"></div></div>'; }
// A room page: the week, then the room's big grid folded shut behind one line (open while a chore of this room is in ✎ Edit there).
// Shut = still drawn, hidden (display:none), so the page holds the very grid it holds today and slice A's checks still find it.
function hwRoomHTML(rid,ids){ const open=!!hwGrid[rid]||(!!hhEditId&&ids.indexOf(hhEditId)>=0);
  return hwCardHTML()+'<div onclick="hwGridToggle(\''+rid+'\')" style="background:#fff;border-radius:12px;box-shadow:0 2px 10px rgba(43,122,120,0.10);padding:8px 12px;margin-bottom:'+(open?'6px':'10px')+';font-size:12.5px;font-weight:800;color:#475569;cursor:pointer">'+(open?'▾ The big grid <span style="font-weight:600;color:var(--muted)">· tap to fold it</span>':'▸ The big grid <span style="font-weight:600;color:var(--muted)">· every chore, day by day · tap to open</span>')+'</div><div'+(open?'':' style="display:none"')+'>'+hhRoomGridHTML(rid,ids)+'</div>'; }
// HOUSEWEEK_END
// HOUSEWEEK_LAUNDRY_START — 📅 slice C: the same chips on the Laundry page's own schedule (DESIGN_now_todo_schedule_2026-11-17 §3, §5 row
// C; her "Yes, start C" 2026-11-17 — "the schedule could also be merged to show all the things or just the laundry"; her rule: the Laundry
// page loses and changes nothing). The Laundry page is one of the card's homes and opens on 🧺 Laundry, which IS today's card: what
// llWeekCardHTML draws (📅 The laundry schedule, Mom's 🫧 Start / ✓ Done / ↩︎, its own ‹ › 0–8 weeks), with only the row of chips put in
// under its title. Everything, a room or a person = slice B's card (hwCardHTML: 📅 Schedule, its own ‹ ›, no laundry buttons); a tap on a
// load there puts this card back on 🧺 Laundry (hwToLaundry → hhGo('laundry') → this page's home). A VIEW: nothing is written on a draw
// or a tap. index.html's hhLaundryHTML calls this only when house.js is here; without it the card is exactly today's.
function hwLaundryCardHTML(){ try{ if(hwFilter().k!=="laundry") return hwCardHTML(); }catch(e){}
  const c=llWeekCardHTML(), i=c.indexOf('</span></div>')+13; let r='';
  try{ r='<div style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:8px">'+hwChips(hwF)+'</div>'; }catch(e){ r=''; }
  return (i<13||!r)?c:c.slice(0,i)+r+c.slice(i); }
// HOUSEWEEK_LAUNDRY_END
// HOWOFTEN_START — 📊 How often: her record of how often each chore really gets done (DESIGN_missed_chores_2026-11-19 §7 and §10 row
// A; her words 2026-11-19: "There needs to be a record of like how often things are being completed for the mom. But I mean, the idea
// isn't to have every single thing completed"; her "Yes, start it" 2026-11-19). ONE card with the 📅 Schedule card's chips (Everything ·
// 🚪 Room ▾ · 👤 Person ▾, no 🧺 Laundry): on 🏠 Whole house (Everything), a room page (that room) and 👤 By person (that person), plus
// this chore's line in the chore card's History. Least done first; 8 rows, then "Show all".
// Worked out from the room grid's own squares (hhRmCell: the Click-off Log's ticks, Mom's and Dad's day stamps, the cleaning days), so
// it cannot disagree with the grid about a past day — NEVER from the log's "— not done" lines (§2: 82 of 112 sit on chores that were
// done). For each time a chore was due (its days in its cad; the grid's own rule: daily / weekdays / Sat / Sun):
//   ● the grid shows it done that day · ◐ done on a later day before its next day (the lists' late rule, live then) · ○ not done by its
//   next day (dropped) · – not counted: the grid shows nothing that day (Mom waved it, before its start date, after its end), or the
//   kid was off (😷 Kid Off) and did not do it. A time still inside its wait and not done yet is not marked.
// Weekly and twice-a-week chores: a mark per time, the last 8 weeks. 3+ times a week: a count, the last 28 days. No record yet: every-N
// and every-2-weeks chores and the 4-week cycle (the grid shows only their ✓), above the level, as needed, and Mom's, Dad's and Up for
// Grabs chores with no tick in the time it looks back. A chore that is not a kid's own (Mom, Dad, Up for Grabs) is NEVER counted as
// dropped (hub's call 2026-11-19 on her real table: they rarely tick, so un-ticked days are not a record): with ticks it says only
// "checked off N times", stays out of the line and sorts after the kids' counted rows. The filter's line, last 4 weeks, in two parts:
// "Daily chores 72% of days" (3+ times a week: days done of days due) · "Weekly chores 12 of 17 · 5 dropped" (once or twice a week;
// dropped = the ○ marks only — never a daily chore's un-ticked days). A VIEW: the filter and "show all" are plain variables; nothing
// here writes, on a draw or on any tap.
let hoKey="", hoF=null, hoAll=false;
const HO_WK=56, HO_DAYS=28, HO_FOLD=8, HO_MARK={on:["●","#16a34a"],late:["◐","#d97706"],drop:["○","#64748b"],skip:["–","#cbd5e1"]};
// The page's own setting (the Schedule card's homes, without 🧺 Laundry); another room, person or page → back to it, folded.
function hoHome(){ if(hhView==="person") return {key:"p|"+hpSel,f:{k:"who",id:hpSel}};
  if(hhView==="rooms"&&hhRmSel&&hhRmSel!=="__none") return {key:"r|"+hhRmSel,f:{k:"room",id:hhRmSel}}; return {key:"h|"+hhView+"|"+hhRmSel,f:{k:"all"}}; }
function hoFilter(){ const p=hoHome(); if(p.key!==hoKey||!hoF){ hoKey=p.key; hoF=p.f; hoAll=false; } return hoF; }
function hoPick(k,id){ hoFilter(); if(k==="room"&&!hhRoomList().some(function(r){ return r[0]===id; })) return; if(k==="who"&&hpWho().indexOf(id)<0) return;
  if(k!=="all"&&k!=="room"&&k!=="who") return; hoF=(k==="all")?{k:k}:{k:k,id:id}; hoAll=false; hhRender(); }
function hoMore(){ hoFilter(); hoAll=!hoAll; hhRender(); }
// One draw's shared reads: today, the log state, the grid's rotation cache, and each chore's squares as they are asked for.
function hoX(){ const t=hpToday(); return {today:t,t:_hhDayNum(t),S:hhLogState(),rc:{},sq:{}}; }
function hoCell(id,n,X){ const m=X.sq[id]||(X.sq[id]={}); if(m[n]===undefined) m[n]=hhRmCell(id,_hhIsoOf(n),X.today,X.S,X.rc)||0; return m[n]; }
function hoDays(cad){ return cad==="daily"?[0,1,2,3,4,5,6]:cad==="sat"?[5]:cad==="sun"?[6]:/^wk:/.test(cad)?cad.slice(3).split(",").filter(function(x){ return x!==""; }).map(Number):[]; }
// One chore's record: {form:"marks"|"count"|"none", why, daily, marks:[{n, m:"on"|"late"|"drop"|"skip", who, q (days late), by}]}; null = a one-time job (📝 To do).
function hoRec(id,X){
  const j=hhJobs()[id]; if(!j||hhLaneOf(j)==="once") return null; const cad=j.cad||"daily", none=function(w){ return {form:"none",why:w,marks:[]}; };
  if(cad==="asneeded"||cad==="none") return none("as needed");
  if(!/^(daily|wk:|sat$|sun$)/.test(cad)) return none(String(cadLabel(cad)).toLowerCase());
  if(j.cycW) return none("4-week cycle"); if(!hhLevelOut(j)) return none("above the level");
  const ds=hoDays(cad); if(!ds.length) return none("no days set");
  const cnt=ds.length>=3, due=function(n){ return ds.indexOf((n+3)%7)>=0; }, marks=[];   // day 0 (1970-01-01) was a Thursday: (n+3)%7 = Mon 0 … Sun 6
  for(let n=X.t-(cnt?HO_DAYS:HO_WK);n<X.t;n++){ if(!due(n)) continue; let nx=n+1; while(!due(nx)) nx++;
    const c=hoCell(id,n,X); if(!c){ marks.push({n:n,m:"skip",who:j.who}); continue; }
    if(c.done){ marks.push({n:n,m:"on",who:c.who,by:c.who}); continue; }
    let q=0, by=""; for(let k=n+1;k<nx&&k<=X.t;k++){ const d=hoCell(id,k,X); if(d&&d.done){ q=k-n; by=d.who; break; } }
    if(q) marks.push({n:n,m:"late",who:c.who,q:q,by:by});
    else if(hhIsKid(c.who)&&typeof hdKidOff==="function"&&hdKidOff(c.who,_hhIsoOf(n))) marks.push({n:n,m:"skip",who:c.who,off:1});
    else if(nx<=X.t){ const mk={n:n,m:"drop",who:c.who}, dk=(typeof hoDrop==="function")?hoDrop(X,id,n):null; if(dk) mk.dk=dk; marks.push(mk); } }   // LEDGERDROP: what the drop took   // else: still inside its wait, not done yet → no mark
  if(!hhIsKid(j.who)){ const d=marks.filter(function(x){ return x.m==="on"||x.m==="late"; }); if(!d.length) return none("no check-offs");
    return {form:"ticks",wk:cnt?4:8,marks:d}; }   // a grown-up's or a grab's: the times checked off, never a dropped one
  return {form:cnt?"count":"marks",daily:cad==="daily",marks:marks};
}
// The record seen through a filter: a person keeps only the times that were theirs (who had it that day).
function hoSee(r,f){ if(!r||f.k!=="who"||r.form==="none") return r; return {form:r.form,daily:r.daily,wk:r.wk,marks:r.marks.filter(function(x){ return x.who===f.id; })}; }
function hoSum(ms){ const s={on:0,late:0,drop:0,skip:0}; ms.forEach(function(x){ s[x.m]++; }); s.done=s.on+s.late; s.n=s.done+s.drop; return s; }
function hoText(r){ if(r.form==="none") return 'no record yet · '+esc(r.why); const s=hoSum(r.marks);
  if(r.form==="ticks") return s.done?'checked off '+s.done+' time'+(s.done===1?'':'s')+' · last '+r.wk+' weeks':'no record yet · no check-offs';
  if(!s.n) return 'no record yet · '+(s.skip?s.skip+' not counted':'nothing due yet');
  return s.done+' of the last '+s.n+(r.form==="count"?(r.daily?' days':' times'):'')+(s.late?' · '+s.late+' late':'')+(r.form==="marks"&&s.drop?' · '+s.drop+' dropped':'')+(s.skip?' · '+s.skip+' not counted':''); }
function hoMarksHTML(r){ if(r.form!=="marks") return ''; return '<span style="font-size:12px;letter-spacing:1px;white-space:nowrap">'+r.marks.map(function(x){ const M=HO_MARK[x.m], iso=_hhIsoOf(x.n);
    const tip=hpDay(iso)+' · '+(x.m==="on"?'done that day':x.m==="late"?'done '+x.q+' day'+(x.q===1?'':'s')+' late':x.m==="drop"?'not done by its next day'+(x.dk?' · '+x.dk.n+' ⭐ '+(x.dk.gb?'given back':'taken'):''):x.off?'off that day':'not counted')+(x.by?' by '+hhWhoName(x.by):'');
    return '<span title="'+esc(tip)+'" style="color:'+M[1]+'">'+M[0]+(x.dk?'<span style="font-size:10px;letter-spacing:0;color:'+(x.dk.gb?'#64748b':'#b91c1c')+'"> '+(x.dk.gb?'given back':'−'+x.dk.n)+'</span>':'')+'</span>'; }).join('')+'</span>'; }   // LEDGERDROP: "○ −2" / "○ given back"
// The rows for a filter, least done first (no record yet last), and the filter's line.
function hoRows(f,X){ const J=hhJobs(), out=[];
  hwIds(f.k==="who"?{k:"all"}:f).forEach(function(id){ const r0=hoRec(id,X); if(!r0) return; const r=hoSee(r0,f);
    if(f.k==="who"&&!(r.marks.length||J[id].who===f.id)) return; const s=hoSum(r.marks); out.push({id:id,r:r,s:s,rate:(r.form==="none"||!s.n)?2:r.form==="ticks"?1.5:s.done/s.n}); });   // grown-ups' ticks after the kids' counted rows
  return out.sort(function(a,b){ return (a.rate-b.rate)||(b.s.drop-a.s.drop)||String(J[a.id].label).localeCompare(String(J[b.id].label))||(a.id<b.id?-1:1); }); }
// The filter's line, last 28 days: dl = the chores done 3+ times a week (days done of days due), wk = once or twice a week (times, ○ = dropped).
function hoLine(rows,X){ const D=[], W=[]; let nr=0, nt=0; rows.forEach(function(x){ if(x.rate===2){ nr++; return; } if(x.r.form==="ticks"){ nt++; return; }
    x.r.marks.forEach(function(m){ if(m.n>=X.t-HO_DAYS) (x.r.form==="count"?D:W).push(m); }); });
  const d=hoSum(D), w=hoSum(W); return {dl:d.n?{pct:Math.round(100*d.done/d.n),done:d.done,n:d.n}:null,wk:w.n?{done:w.done,n:w.n,drop:w.drop}:null,none:nr,ticks:nt}; }
function hoLineTxt(L){ const p=[]; if(L.dl) p.push('Daily chores '+L.dl.pct+'% of days'); if(L.wk) p.push('Weekly chores '+L.wk.done+' of '+L.wk.n+(L.wk.drop?' · '+L.wk.drop+' dropped':''));
  return p.length?'last 4 weeks · '+p.join(' · '):'<span style="color:#94a3b8">no record yet</span>'; }
function hoRowHTML(x,mom){ const j=hhJobs()[x.id], tap=mom?' onclick="hcOpen(\''+x.id+'\')"':'';
  return '<div'+tap+' style="display:flex;align-items:center;gap:7px;flex-wrap:wrap;padding:5px 12px;border-top:1px solid #f3f4f6;font-size:12.5px'+(mom?';cursor:pointer':'')+'"><span>'+esc(j.emoji||'☐')+'</span>'
    +'<span style="flex:1;min-width:120px;font-weight:700">'+esc(j.label)+' <span style="font-size:11px;font-weight:600;color:var(--muted)"><span style="color:'+hhRmCol(j.who)+'">'+esc(hhWhoName(j.who))+'</span> · '+esc(cadLabel(hhPlanCad(j)))+'</span></span>'
    +hoMarksHTML(x.r)+'<span style="font-size:11px;font-weight:700;color:'+(x.rate===2?'#94a3b8':'#475569')+';white-space:nowrap">'+hoText(x.r)+'</span></div>'; }
function hoCardHTML(){
  const f=hoFilter(), mom=hcMom(), X=hoX(), rows=hoRows(f,X), L=hoLine(rows,X), show=hoAll?rows:rows.slice(0,HO_FOLD);
  const name=f.k==="room"?hhRoomEmoji(f.id)+' '+hhRoomName(f.id):f.k==="who"?'👤 '+hhWhoName(f.id):'🏠 Whole house';
  let h='<div style="'+HP_CARD+'"><div style="padding:9px 12px 4px"><span style="font-size:14px;font-weight:800">📊 How often</span> <span style="font-size:11px;font-weight:600;color:var(--muted)">least done first · the last 8 weeks of check-offs</span></div>';
  h+='<div style="display:flex;gap:5px;flex-wrap:wrap;padding:2px 12px 8px">'+hwChips(f,"hoPick")+'</div>';
  h+='<div style="padding:6px 12px;border-top:1px solid #eef2f0;font-size:12.5px;font-weight:800">'+esc(name)+' · '+hoLineTxt(L)+'</div>';
  h+=rows.length?show.map(function(x){ return hoRowHTML(x,mom); }).join(''):'<div style="padding:3px 12px 8px;font-size:12px;color:var(--muted)">No chores here.</div>';
  if(rows.length>HO_FOLD) h+='<div onclick="hoMore()" style="padding:6px 12px;border-top:1px solid #f3f4f6;font-size:12px;font-weight:800;color:#2B7A78;cursor:pointer">'+(hoAll?'Show fewer':'Show all '+rows.length)+'</div>';
  h+='<div style="padding:6px 12px 8px;font-size:11px;color:var(--muted)">● done on its day · ◐ done late, before its next day · ○ not done by its next day · – not counted (you waved it, the kid was off, or it had not started). Looks back 8 weeks (3 or more times a week: 4 weeks), from the check-offs — not from the “not done” lines. '
    +'The top line is the last 4 weeks: daily chores (3 or more times a week) as the share of their days done'+(L.dl?' ('+L.dl.done+' of '+L.dl.n+')':'')+'; weekly chores (once or twice a week) as times done of times due, dropped = not done by its next day. Late counts as done. '
    +'Mom’s, Dad’s and Up for Grabs chores are never counted as dropped: they show how often they were checked off and stay out of the top line'+(L.ticks?' ('+L.ticks+' here)':'')+'. Left out too: what was not counted'+(L.none?', the '+L.none+' with no record yet':'')+' and any chore still inside its wait. A renamed chore starts fresh: the log knows a chore by its name.</div>';
  return h+'</div>';
}
// The chore card ▸ History: this chore's own line (the card's row, unfiltered) and the last time the grid shows it done, by whom.
function hoHistHTML(id){ const j=hhJobs()[id]; if(!j) return ''; const X=hoX(), r=hoRec(id,X); let last=null;
  for(let n=X.t;n>=X.t-HO_WK;n--){ const c=hoCell(id,n,X); if(c&&c.done){ last={iso:_hhIsoOf(n),by:c.who}; break; } }
  if(j.lastDone&&/^\d{4}-\d{2}-\d{2}$/.test(j.lastDone)&&(!last||j.lastDone>last.iso)) last={iso:j.lastDone,by:j.lastBy||""};
  return '<div style="display:flex;gap:7px;align-items:center;flex-wrap:wrap;margin-top:8px;font-size:12px;font-weight:700">📊 '+(r?hoMarksHTML(r)+'<span style="color:#475569">'+hoText(r)+'</span>':'<span style="color:#475569">a one-time job</span>')+'</div>'
    +'<div style="font-size:12px;font-weight:700;margin-top:4px">'+(last?'Last checked off '+(+last.iso.slice(5,7))+'/'+(+last.iso.slice(8))+(last.by?' by '+esc(hhWhoName(last.by)):''):'Not checked off in the last 8 weeks')+'</div>'; }
// HOWOFTEN_END
// LASTTURNS_START — 📒 Last turns on the chore card, and the 📒 Ledger on that one chore (DESIGN_chore_ledger_2026-11-21 §5 "Quick jumps,
// never second copies": "the card's '📒 Last turns: ✅ ✅ ✅ ✖ ›' → the ledger on that chore"; §8 "Each links to the other"; §9 row L7;
// the hub's brief 2026-11-24). The ledger's chore name opens the card (hcGo); this line on the card's History opens the ledger. A JUMP:
// it writes nothing (no database, no bank, no log line, no local flag) and adds no button — the rows in the pop-up carry the ledger's
// own buttons, drawn by the ledger.
// The marks are the ledger's own, read with the ledger's own readers, so the line and the rows it opens can never disagree:
// one mark per TURN (a day the chore was due on its kid's list, lgDue) = the icon of that day's ledger row (lgRow: ✅ done · ⏸ waiting
// for your ✓ · ➖ excused · 🌅 sent to the next morning · ○ not done yet), and for a past ✖ what became of it by the ledger's wait rule
// (lgFate): ticked later → ✅ (⏸ while held), still on the list today → ⏳, gone or never carried → ✖. The last LT_N (6), newest last.
// How far back: what the ledger can reach on this device — this week, and last week once the lists' own read of it has landed
// (lgDay / lgMap). Nothing older is kept on a device and nothing new is read. The design's "last 4 weeks" would need two more weekly
// reads (the report says what it would take); 📊 How often (8 weeks, from the room grid's squares) stays the long view.
// Which chores: a kid's own chore on its kid's list (rows from the household table: Take over on, hcGoOk — the same rule as the
// ledger's names opening the card), with at least one turn in reach. No line for a grown-up's chore, Up for Grabs, a chore that takes
// turns (🔁 rot or HOUSETURNS: its row on a kid's list can carry another kid's job), a chore with no turn in reach (brand-new, every
// 4 weeks, on nobody's list). Mom only, as the card is; nothing on Dad's link or a kid's device.
// The pop-up: the ledger's third view, lgWeek===null (false = a day, true = This week). Every ordinary way in sets lgWeek true or false
// (lgShow from 🧒 Kids today, the Today · Yesterday · This week chips), so the ledger's own opening is byte for byte as before.
let ltSel="";   // the chore the pop-up shows (memory only)
const LT_N=6;
function ltStepOk(st,id){ return !!st&&!st.rot&&(st.house||st._hh)===id; }
function ltOk(id){ const j=hhJobs()[id]; return !!j&&typeof momHere==="function"&&momHere()&&typeof hcGoOk==="function"&&hcGoOk(id)&&hhIsKid(j.who)&&SL_KIDS.indexOf(j.who)>=0&&!j.rot&&!(typeof htOf==="function"&&htOf(id)); }
function ltFirst(){ return -(lgNow()+8); }   // last week's first day: the oldest the ledger reaches
function ltSteps(slot,kid,D){ return D.prev?lgPrevSteps(slot,kid,D):(rtStepsFor(slot,kid,false,D.dn)||[]); }
// Every turn in reach, oldest first: [{D, m}] — the global `day` pinned to the day read, as lgDayData does
function ltTurns(id){ const j=hhJobs()[id], kid=j&&j.who, out=[]; if(!kid) return out;
  for(let k=ltFirst();k<=0;k++){ const D=lgDay(k); if(!D||!lgMap(D)) continue; const pd=day, pw=_prevSlWk; day=D.dn;
    try{ if(typeof _prevWkKey==="function") _prevSlWk=_prevWkKey();
      ((typeof activeSlots==="function")?activeSlots():SL_SLOTS).forEach(function(slot){ ltSteps(slot,kid,D).forEach(function(st,i){
        if(!ltStepOk(st,id)||(D.prev&&st.house)||!lgDue(st,D)) return; const r=lgRow(slot,kid,D,i,st); if(!r) return; let m=r.ic;
        if(m==="✖"){ const f=lgFate(slot,kid,i,st,D); if(f&&f.wait) m="⏳"; else if(f&&f.done){ const x=lgRec(slot,kid,f.done,i); m=(x&&!x.am&&lgHeld(kid,x.bid))?"⏸":"✅"; } }
        out.push({D:D,m:m}); }); });
    } finally { day=pd; _prevSlWk=pw; } }
  return out; }
// The card's line (HH_CARD ▸ History, under 📊), or "" — Mom only, a kid's own chore with a turn in reach
function ltCardHTML(id){ if(!ltOk(id)) return ""; const T=ltTurns(id).slice(-LT_N); if(!T.length) return "";
  return '<div onclick="ltGo(\''+id+'\')" title="Open the 📒 Ledger on this chore" style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-top:6px;font-size:12px;font-weight:700;cursor:pointer">📒 Last turns: '
    +T.map(function(t){ return '<span title="'+esc(lgDate(t.D.iso))+'">'+t.m+'</span>'; }).join(' ')+' <span style="color:#2B7A78;font-weight:800">›</span></div>'; }
// The tap: the card closes, the ledger opens on the chore's kid, showing that chore (no line, no jump)
function ltGo(id){ if(!ltOk(id)||!ltTurns(id).length) return; const kid=hhJobs()[id].who; if(typeof hcClose==="function") hcClose(); lgKid=kid; lgOff=0; lgWeek=null; ltSel=id; lgDraw(); }
// "Show everything ›": the ordinary ledger on that kid, today
function ltAll(){ ltSel=""; lgOff=0; lgWeek=false; lgDraw(); }
// The pop-up's top (the dimmed screen, 📒 Ledger, ⚙, ✕, the ⚙ panel / ⏸ banner) is the ledger's OWN, never a copy: lgHTML drawn once
// as a day view on a day it cannot reach (cheap: "not on this device") and cut where the kid chips start.
const LT_CHIPS='<div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:8px">';
function ltTop(){ const pw=lgWeek, po=lgOff; let o=""; lgWeek=false; lgOff=lgMin(); try{ o=lgHTML(); } finally{ lgWeek=pw; lgOff=po; } const c=o.indexOf(LT_CHIPS); return c>0?o.slice(0,c):""; }
// The pop-up in the chore view (lgHTML's first line), or "" (the ordinary ledger)
function ltHTML(){ if(lgWeek!==null||!ltSel) return ""; const j=hhJobs()[ltSel], kid=lgKid; if(!j||!ltOk(ltSel)||kid!==j.who) return "";
  const id=ltSel, a=lgDay(ltFirst()), last=!!(a&&lgMap(a)), from=last?a:lgDay(-(lgNow()+1)), days=[];
  for(let k=ltFirst();k<=0;k++){ const x=lgDayData(kid,k); if(!x.lists) continue; const rows=[];
    x.lists.forEach(function(L){ L.rows.forEach(function(r){ if(r.id===id) rows.push(r); }); });
    const g=x.gone.filter(function(r){ return r.id===id; }); if(rows.length||g.length) days.push({x:x,rows:rows,g:g}); }
  let h=ltTop()
    +'<div style="display:flex;flex-wrap:wrap;align-items:baseline;gap:4px 10px;margin-bottom:2px"><b style="flex:1;font-size:14px">'+esc((j.emoji?j.emoji+' ':'')+(j.label||'Chore'))+' · <span style="color:'+(SL_KCOL[kid]||'#666')+'">'+esc(lgName(kid))+'</span></b>'
    +'<span onclick="ltAll()" style="cursor:pointer;font-size:12.5px;font-weight:800;color:#2B7A78;white-space:nowrap">Show everything ›</span></div>'
    +'<div style="font-size:12px;color:#6b7280;margin-bottom:2px">'+(last?'This week and last week, from '+esc(lgDate(from.iso))+'. Older days are not kept on this device.':'This week, from '+esc(from?lgDate(from.iso):'Sunday')+'. '+LG_NOTYET)+'</div>';
  h+=days.length?days.map(function(d){ const x=d.x;
      return '<div style="margin-top:12px;padding:5px 8px;background:#f8fafc;border-radius:8px;font-size:12.5px"><b>'+(x.D.k===0?'Today':lgDate(x.D.iso))+'</b></div>'+d.rows.map(lgRowHTML).join('')
        +(d.g.length?'<div style="margin-top:6px;font-size:12px;font-weight:800;color:#374151">Gone from '+esc(lgName(kid))+'\'s list '+(x.D.k===0?'this morning':'that morning')+'</div>'+d.g.map(lgRowHTML).join(''):''); }).join('')
    :lgFar('No turns of this chore on '+esc(lgName(kid))+'\'s lists in that time.');
  return h+'</div></div>'; }
// LASTTURNS_END
// CARDRULES_START — the chore card's four settings for a missed chore (DESIGN_missed_chores_2026-11-19 §1.1–1.5, §7, §8 row D; her
// words 11/19: "customizeable also have a fixed day option versus move 7 days after last done option then if fixed and done within how
// may days is the next skipped"). On the card (section 2 · When, "If it is missed") and as pills in a room's ⚙ Rules: ONE control per
// setting, drawn by hcCtl in both places, ONE setter (cdrSet). Each saves only its own field on the chore's own row, and clearing it
// removes the field, so a chore with none of them is exactly as before:
//   clock "roll"  🔄 Rolling: every N days after last done (a chore on ONE weekday; none = 📅 Fixed day). Plan ON only (slice E).
//   wait  0 · 1–6 · "next"  Waits: none · days · until its next day (none = Auto, a third of its gap, at most 7). Acts NOW on a kid's
//         fixed-day chore on today's lists (index.html CARDWAIT → rtWaitDays), as the design's §7 says; plan ON only for the rest.
//   cover 0 · 1–6  Skip the next one if done within N days before its day (none = Auto, the Auto wait's size). Fixed day only. Plan ON.
//   keep  true    📌 Keep until done: never dropped. Plan ON only.
// A chore 3 or more days a week keeps the old late rule by her choice (rtWaitAsBefore): no Waits pill, the card says "As now".
// Mom only (as the card). Writes household/jobs/<id>/<field> only when db && !_dryRun(). Nothing at boot, no listener, no timer.
const CDR_F=["clock","wait","cover","keep"], CDR_PLAN="Starts working when the plan is switched on.";
const CDR_DAYW=["Mondays","Tuesdays","Wednesdays","Thursdays","Fridays","Saturdays","Sundays"];
function cdrDays(n,zero){ return n===0?zero:(n+(n===1?" day":" days")); }
// What applies to this chore: null (daily, as needed, one time, a project, Up for Grabs, not scheduled) · {fixed, days, gap, asBefore,
// roll, auto, cauto} · {every:N, gap:N, auto}. auto = rtWaitDays on the chore's days alone (no table id, so never its own setting);
// cauto = Skip's Auto, "the same size as the Auto wait" (§1.4): a third of the gap, at most 7 (3+ a week: never).
function cdrInfo(j){ if(!j||j.who==="grab"||(typeof hhIsProject==="function"&&hhIsProject(j))) return null; const cad=j.cad||"daily";
  if(/^wk:|^sat$|^sun$/.test(cad)){ const d=hhEditDays(cad); if(!d.length) return null; const c="wk:"+d.join(","), cyc=j.cycW?Math.max(1,parseInt(j.cycN,10)||4):1;
    return {fixed:true,days:d,gap:Math.round(7/d.length*cyc),asBefore:d.length>=3,roll:j.clock==="roll"&&d.length===1,auto:cdrAuto({cad:c,cycW:j.cycW,cycN:j.cycN},7/d.length*cyc),cauto:Math.min(7,Math.floor(7/d.length*cyc/3))}; }
  const N=cad==="2w"?14:(/^\d+d$/.test(cad)?parseInt(cad,10):0); return N?{every:N,gap:N,auto:cdrAuto({cad:cad},N)}:null; }
// Auto from the ONE wait function (CHOREWAIT rtWaitDays); a page slice without it (a test) gets its rule: a third of the gap, at most 7.
function cdrAuto(st,gap){ return typeof rtWaitDays==="function"?rtWaitDays(st):Math.min(7,Math.floor(gap/3)); }
function cdrOk(I,f){ return !!I&&(f==="keep"||(f==="clock"&&I.fixed&&I.days.length===1)||(f==="wait"&&!I.asBefore)||(f==="cover"&&I.fixed&&!I.roll)); }
// A tap's value → what is stored (null = the field removed, undefined = refused).
function cdrVal(f,v){ if(v===null||v===undefined||v===""||v==="auto") return null;
  if(f==="clock") return v==="roll"?"roll":v==="fixed"?null:undefined;
  if(f==="keep") return (v===true||v==="true"||v===1)?true:(v===false||v==="false"||v===0)?null:undefined;
  if(f==="wait"&&v==="next") return "next";
  const n=Number(v); return (n%1===0&&n>=0&&n<=6)?n:undefined; }
// The one setter (card chips, ⚙ Rules pills and selects): Mom only, the chore's own field only, nothing written when nothing changes.
function cdrSet(id,f,v){ if(!hcMom()||CDR_F.indexOf(f)<0) return false; const j=hhJobs()[id]; if(!j) return false; v=cdrVal(f,v); if(v===undefined) return false;
  if(v!==null&&!cdrOk(cdrInfo(j),f)) return false; if((j[f]===undefined?null:j[f])===v) return v;
  if(v===null) delete j[f]; else j[f]=v;
  householdOnValue(householdData); if(_hhWrite()) db.ref("household/jobs/"+id+"/"+f).set(v); hhRender(); return v; }
// Does the Waits act on today's lists now? A kid's own fixed-day chore on a list from this table (Take over), not an after-a-meal row.
function cdrNow(j,I){ return !!I&&I.fixed&&!I.asBefore&&hhIsKid(j.who)&&!j.meal&&typeof hhTakeoverOn==="function"&&hhTakeoverOn(); }
function cdrWords(d){ const w=d.map(function(x){ return CDR_DAYW[x]; }); return w.length<2?w.join(""):w.slice(0,-1).join(", ")+" and "+w[w.length-1]; }
// The control, f in CDR_F; t = the ⚙ Rules table's compact form of the same control (same setter).
function cdrCtl(id,f,t){ const j=hhJobs()[id], I=cdrInfo(j); if(!I) return ""; const q="'"+id+"'", txt=function(x){ return '<span style="font-size:'+(t?'10.5':'12')+'px;font-weight:700">'+x+'</span>'; };
  const C=function(on,x,v){ return _hcChip(on,x,"cdrSet("+q+",'"+f+"',"+v+")",t); };
  const pick=function(opts,cur){ cur=cur===undefined?"":cur; return t?_hcSel("cdrSet("+q+",'"+f+"',this.value)",opts.map(function(o){ return [String(o[0]),o[1]]; }),String(cur)):opts.map(function(o){ return C(String(o[0])===String(cur),esc(o[1]),typeof o[0]==="number"?o[0]:"'"+o[0]+"'"); }).join(''); };
  const N=[1,2,3,4,5,6].map(function(n){ return [n,cdrDays(n)]; });
  if(f==="clock"){ if(I.every) return txt(t?'🔄 Rolling':'🔄 Rolling: every '+I.every+' days after last done');
    const cy=j.cycW?' (week '+(parseInt(j.cycW,10)||1)+' of '+(parseInt(j.cycN,10)||4)+')':'';
    if(I.days.length!==1) return t?'':txt('📅 Fixed days: '+cdrWords(I.days)+cy);
    return C(!I.roll,t?'📅 Fixed':'📅 Fixed day: '+cdrWords(I.days)+cy,"'fixed'")+C(I.roll,t?'🔄 Rolling':'🔄 Rolling: every '+I.gap+' days after last done',"'roll'"); }
  if(f==="wait"){ if(I.asBefore) return txt(t?'As now':'As now: on the list until its next day, with the red “late” tag');
    return (t?'<span style="font-size:10px;color:var(--muted)">Waits </span>':'')+pick([["","Auto: "+cdrDays(I.auto,"none")],[0,"None"]].concat(N).concat([["next","Until its next day"]]),j.wait); }
  if(f==="cover"){ if(!I.fixed||I.roll) return ""; return (t?'<span style="font-size:10px;color:var(--muted)">Skip </span>':'')+pick([["","Auto: "+cdrDays(I.cauto,"never")],[0,"Never"]].concat(N),j.cover); }
  if(f==="keep") return C(!!j.keep,t?'📌':'📌 Keep until done',j.keep?"false":"true").replace('<button','<button title="Keep until done"');
  return ""; }
// The card's notes: what acts now and what waits for the plan, in her words.
function cdrNote(id,f){ const j=hhJobs()[id], I=cdrInfo(j); if(!I) return "";
  if(f==="clock") return (I.fixed&&I.days.length===1)?'Rolling '+CDR_PLAN.charAt(0).toLowerCase()+CDR_PLAN.slice(1)+' Until then it comes on '+cdrWords(I.days)+'.':I.every?'How often sets this.':'';
  if(f==="cover") return (I.fixed&&!I.roll)?'Done this many days before its day, the next one is skipped. '+CDR_PLAN:'';
  if(f==="keep") return 'Never dropped: it stays on the list every day until it is done. '+CDR_PLAN;
  if(f!=="wait"||I.asBefore) return "";
  if(!cdrNow(j,I)) return 'How long a missed one stays on the list before it is dropped. '+CDR_PLAN;
  const w=j.wait==="next"?6:(typeof j.wait==="number"?j.wait:I.auto); let x='Acts on today’s lists now: a missed one stays on the list this long, then it is dropped until its next day.';
  // a wait never runs past its next day (rtWaitCut): say so when the pick is longer than a turn's gap allows
  // (a week-of-4 chore: its cycle week ends on Sunday night, as Mom's note rtWaitNote says)
  const most=I.days.map(function(d,k){ const nx=I.days[(k+1)%I.days.length], m=((nx-d+7)%7||7)-1; return j.cycW?Math.min(m,6-d):m; });
  if(typeof j.wait==="number"&&w>Math.min.apply(null,most)) x+=(j.cycW?' Its cycle week ends first':' Its next day comes first')+', so it waits at most '+I.days.map(function(d,k){ return cdrDays(most[k],"none")+' after '+CAD_DAYL[d]; }).join(', ')+'.';
  if((j.pts||0)>0&&Math.min(w,Math.max.apply(null,most))>=5) x+=' By day 5 of the wait it pays 0 ⭐.';
  return x; }
function cdrCardHTML(id){ const I=cdrInfo(hhJobs()[id]); if(!I) return "";
  const row=function(l,f){ const x=hcCtl(id,f), n=cdrNote(id,f); return x?'<div class="ce-sheet-lbl" style="margin:10px 0 4px">'+l+'</div><div style="display:flex;gap:4px;flex-wrap:wrap;align-items:center">'+x+'</div>'+(n?'<div style="font-size:11px;color:var(--muted);margin-top:4px">'+n+'</div>':''):''; };
  return '<div style="margin-top:14px;font-size:12px;font-weight:800;color:#475569">If it is missed</div>'+row('Clock','clock')+row('Waits','wait')+row('Skip the next one if done within … days before its day','cover')+row('Keep until done','keep'); }
// The ⚙ Rules table's "If missed" cell (hcRulesHTML): the same four controls, compact, and its footnote.
function cdrCell(id){ return CDR_F.map(function(f){ return hcCtl(id,f,1); }).filter(function(x){ return x; }).map(function(x){ return '<div style="margin-top:2px;white-space:nowrap">'+x+'</div>'; }).join(''); }
function cdrRulesNote(){ return '<div style="font-size:10.5px;color:var(--muted);padding:6px 8px">If missed: Waits acts now on the kids’ fixed-day chores. 🔄 Rolling, Skip and 📌 start working when the plan is switched on.</div>'; }
// CARDRULES_END
// HOUSETODO_START — 🔴 Now and 📝 To do on 🏠 Whole house, and 📝 To do on 👤 By person (DESIGN_now_todo_schedule_2026-11-17 §7,
// slice E; her rule 2026-11-17 "Yes, every area" — every Household page gets 🔴 Now · 📝 To do · 📅 Schedule — and her go, "c is
// merged so go to next"). Built only from what the room pages already draw, so the pages never disagree:
//   · 🔴 Now (Whole house): today across the house in a few lines, from each room's own 🔴 Now rows (rnRows: today's stored plan when
//     the plan is ON and stored, else the lists). One line per room with something open today — "5 left · 2 late · 3 done", most late
//     first, a tap opens that room (hhRmGo) — one quiet line for the rooms that are clear, and with the plan ON what fit nobody, with
//     the room card's own → Give to… (hdGive, Mom only). The "most behind first" list under it is 8 weeks of on-time and "past its
//     usual gap" for every chore, due today or not; this card is only today's. Nothing else on it writes.
//   · 📝 To do (Whole house): every room's 📝 To do together, the same rows drawn by the same code (rtdIds, rtdRowHTML: "from Tue",
//     Send to…, ✓ I did it myself, sent ones quietly with ⏸ Back to the pile), rooms in the page's order, ❔ No room last. A room
//     with more than 4 folds to its first 4 and "+N more" (a plain variable; nothing saved). ＋ To-do asks which room and saves through
//     the room card's own rtdSave (so the one saver, hhAddSave). No "No room" choice: hhAddSave files a job with no room under the
//     room its words suggest, so it would never show as No room.
//   · 📝 To do (By person, under 📅 Today): the one-time jobs on this person's list now (⏸ Back to the pile), then the waiting ones
//     they can do — hhCanOf: the job's owner and everyone ticked on it, the same test for Mom and Dad as for a kid — each with one
//     "Give to <Name>" (hhOnceSend). No ✓ here (it means Mom did it herself: the room and Whole house cards have it) and no ＋ To-do
//     (a to-do needs a room).
// Writes: only the room card's (rtdSave → hhAddSave, rtdTick, hhOnceSend, hhOnceHold, hdGive), Mom only, through _hhWrite() so
// ?dryrun=1 writes nothing. Drawing writes nothing. Not Mom: the same rows, no buttons.
let htdOpen=false, htdMore={};
const HT_FOLD=4, HT_PFOLD=6;
// Today's rows for one line: a room, or "__none" = the chores in no room (the lists' "__none" and the plan's "", as the week card does).
function htRows(rid){ if(rid!=="__none") return rnRows(rid); const a=rnRows("__none"), b=rnRows(""); return {iso:a.iso,plan:a.plan||b.plan,rows:a.rows.concat(b.rows),over:a.over.concat(b.over)}; }
function htNowData(){ let iso=hpToday(), plan=false, over=[];
  const rooms=hhRoomList().map(function(r){ return r[0]; }).concat(["__none"]).map(function(rid,i){ const R=htRows(rid), open=R.rows.filter(function(x){ return !x.done; });
    iso=R.iso; plan=plan||R.plan; R.over.forEach(function(o){ over.push(Object.assign({rid:rid},o)); });
    return Object.assign({rid:rid,i:i,left:open.length,late:open.filter(function(x){ return x.late; }).length,done:R.rows.length-open.length,over:R.over.length},(typeof hqNowCounts==="function")?hqNowCounts(rid,R,open):{}); });   // HOUSEQUIET: + wait, red
  return {iso:iso,plan:plan,rooms:rooms,over:over}; }
function htRoomLabel(rid){ return (!rid||rid==="__none")?'❔ No room':hhRoomEmoji(rid)+' '+hhRoomName(rid); }
function htNowHTML(){
  const D=htNowData(), J=hhJobs(), mom=(typeof momHere!=="function")||momHere();
  const open=D.rooms.filter(function(x){ return x.left||x.over||x.wait; }).sort(function(a,b){ return (b.late-a.late)||(b.left-a.left)||(a.i-b.i); }), clear=D.rooms.filter(function(x){ return !x.left&&!x.over&&!x.wait&&x.done; }), quiet=D.rooms.filter(function(x){ return !x.left&&!x.over&&!x.wait&&!x.done&&x.rid!=="__none"; }).length;
  let h='<div style="'+HP_CARD+'"><div style="padding:9px 12px;font-size:14px;font-weight:800">🔴 Now <span style="font-size:11px;font-weight:600;color:var(--muted)">'+(D.plan?'today’s plan':'today, from the lists')+' · every room · tap one to open it</span></div>';
  h+=open.map(function(x){ return '<div onclick="hhRmGo(\''+x.rid+'\')" style="display:flex;align-items:center;gap:7px;padding:6px 12px;border-top:1px solid #f3f4f6;font-size:12.5px;cursor:pointer"><span style="flex:1;font-weight:700">'+esc(htRoomLabel(x.rid))+'</span>'
    +(x.left?'<span style="font-weight:800">'+x.left+' left</span>':'')+(typeof hqNowTail==="function"?hqNowTail(x):(x.late?_hhChip(x.late+' late','#fee2e2','#991b1b'):''))+(x.over?_hhChip(x.over+' didn’t fit','#fef3c7','#92400e'):'')+(x.done?'<span style="font-size:11px;color:#6b6560">'+x.done+' done</span>':'')+'<span style="color:#94a3b8">›</span></div>'; }).join('');
  if(!open.length) h+='<div style="padding:6px 12px 2px;border-top:1px solid #f3f4f6;font-size:12.5px;font-weight:700;color:#166534">'+(clear.length?'Nothing left anywhere today.':'Nothing on anyone’s list in a room today.')+'</div>';
  if(clear.length||quiet) h+='<div style="padding:5px 12px 7px;border-top:1px solid #f3f4f6;font-size:11.5px;color:#6b6560">'+(clear.length?'✅ Clear today: '+clear.map(function(x){ return esc(htRoomLabel(x.rid))+' ('+x.done+' done)'; }).join(' · '):'')+(quiet?(clear.length?' · ':'')+quiet+' room'+(quiet===1?'':'s')+' with nothing today':'')+'</div>';
  if(D.over.length) h+='<div style="'+HP_HEAD+';border-top:2px solid #fde68a;padding-top:8px">Didn’t fit anyone today ('+D.over.length+')</div>'+D.over.map(function(o){ const j=J[o.id];
    return hpRow(o.id,j.emoji,j.label,_hhChip(esc(htRoomLabel(o.rid)),'#f3f4f6','#475569')+_hhChip(esc(hhWhoName(o.turn))+'’s turn','#f3f4f6','#475569')+_hhChip(o.mins+' min','#f3f4f6','#475569')+hpGrabChip(D.iso,o.id)+(mom?'<span onclick="event.stopPropagation()">'+hpGiveSel(D.iso,o.id,"")+'</span>':'')); }).join('');
  return h+'</div>';
}
function htdToggleForm(){ if(typeof momHere==="function"&&!momHere()) return; htdOpen=!htdOpen; hhRender(); }
function htdFold(k){ htdMore[k]=!htdMore[k]; hhRender(); }
// Every room's To do: [{rid, ids}] in the page's room order, "" (No room) last; rooms with nothing left out.
function htdGroups(){ return hhRoomList().map(function(r){ return r[0]; }).concat([""]).map(function(rid){ return {rid:rid,ids:rtdIds(rid)}; }).filter(function(g){ return g.ids.length; }); }
function _htdFoldHTML(k,n,cap){ return n<=cap?'':'<div onclick="htdFold(\''+k+'\')" style="padding:4px 12px 6px;font-size:11.5px;font-weight:800;color:#7c3aed;cursor:pointer">'+(htdMore[k]?'Show fewer':'+'+(n-cap)+' more')+'</div>'; }
function htdHTML(){
  const J=hhJobs(), mom=(typeof momHere!=="function")||momHere(), t=_hhIsoLocal(Date.now()), G=htdGroups(), inp='padding:5px 7px;border:1.5px solid #e5e7eb;border-radius:8px;font-size:12.5px;font-family:\'DM Sans\',sans-serif;box-sizing:border-box';
  const all=G.reduce(function(a,g){ return a.concat(g.ids); },[]), live=all.filter(function(id){ return J[id].status!=="retired"; }), wait=live.filter(function(id){ return hhOnceHeld(J[id]); }).length;
  let h='<div style="'+HP_CARD+'"><div style="display:flex;gap:8px;align-items:center;padding:9px 12px"><span style="font-size:14px;font-weight:800;flex:1">📝 To do <span style="font-size:11px;font-weight:600;color:var(--muted)">one-time jobs, every room'+(live.length?' · '+wait+' waiting'+(live.length>wait?' · '+(live.length-wait)+' sent':''):'')+'</span></span>'+(mom?_hhBtn("htdToggleForm()",htdOpen?'Cancel':'＋ To-do',false,'#7c3aed'):'')+'</div>';
  if(mom&&htdOpen) h+='<div style="display:flex;gap:5px;align-items:center;flex-wrap:wrap;padding:0 12px 8px"><input id="htd-emoji" placeholder="📝" style="'+inp+';width:44px;text-align:center"><input id="htd-label" placeholder="What needs doing?" style="'+inp+';flex:1;min-width:120px"><select id="htd-room" style="'+inp+'"><option value="">Which room?</option>'
    +hhRoomList().map(function(r){ return '<option value="'+esc(r[0])+'">'+esc(hhRoomEmoji(r[0])+' '+r[1])+'</option>'; }).join('')+'</select>'+_hhBtn("htdSave()",'Save',true,'#7c3aed')+'</div>';
  if(!G.length) return h+'<div style="padding:0 12px 9px;font-size:12px;color:var(--muted)">Nothing waiting in any room.</div></div>';
  G.forEach(function(g){ const k=g.rid||"__none", ids=(g.ids.length>HT_FOLD&&!htdMore[k])?g.ids.slice(0,HT_FOLD):g.ids;
    h+='<div onclick="hhRmGo(\''+k+'\')" style="'+HP_HEAD+';border-top:1px solid #eef2f0;padding-top:7px;cursor:pointer">'+esc(htRoomLabel(g.rid))+' · '+g.ids.length+'</div>'+ids.map(function(id){ return rtdRowHTML(id,J[id],mom,t); }).join('')+_htdFoldHTML(k,g.ids.length,HT_FOLD); });
  return h+'<div style="height:4px"></div></div>';
}
// ＋ To-do on Whole house: the room card's own save for the room she picks.
function htdSave(rid,label,emoji){
  if(typeof momHere==="function"&&!momHere()) return null;
  const val=function(id){ const e=(typeof document!=="undefined"&&document.getElementById)?document.getElementById(id):null; return (e&&e.value!==undefined)?String(e.value||""):""; };
  if(rid===undefined) rid=val("htd-room"); if(label===undefined) label=val("htd-label"); if(emoji===undefined) emoji=val("htd-emoji");
  if(!String(label||"").trim()){ hpTell("Write the to-do first"); return null; }
  if(!hhRoomList().some(function(r){ return r[0]===rid; })){ hpTell("Pick a room first"); return null; }
  const id=rtdSave(rid,label,emoji); if(id){ htdOpen=false; hhRender(); } return id;
}
// 👤 By person: {sent: on their list now, can: waiting, they can do it}, oldest first.
function htdPersonIds(who){ const J=hhJobs(), ord=function(a,b){ return String(J[a].from||"").localeCompare(String(J[b].from||""))||((J[a].ts||0)-(J[b].ts||0))||(a<b?-1:1); };
  const live=Object.keys(J).filter(function(id){ return hhIsOnce(J[id])&&J[id].status!=="retired"; });
  return {sent:live.filter(function(id){ return !hhOnceHeld(J[id])&&J[id].who===who; }).sort(ord),can:live.filter(function(id){ return hhOnceHeld(J[id])&&hhCanOf(J[id]).indexOf(who)>=0; }).sort(ord)}; }
function htdPersonHTML(who){
  const J=hhJobs(), mom=(typeof momHere!=="function")||momHere(), t=_hhIsoLocal(Date.now()), P=htdPersonIds(who), nm=esc(hhWhoName(who)), k="p|"+who;
  const row=function(id,quiet,btn){ const j=J[id]; return '<div style="display:flex;align-items:center;gap:7px;padding:5px 12px;border-top:1px solid #f3f4f6;font-size:'+(quiet?'12px;color:#6b6560':'12.5px')+'"><span'+hoTap(id,mom)+'>'+(j.emoji||'☑️')+'</span><span'+hoTap(id,mom,'flex:1'+(quiet?'':';font-weight:700'))+'>'+esc(j.label)
    +'<span style="font-weight:400;color:#6b6560"> · '+esc(htRoomLabel(hhRoomOn(j)))+'</span>'+(quiet?'':'<span style="font-weight:400;color:#6b6560">'+rtdFrom(j.from,t)+'</span>')+'</span>'+(mom?btn:'')+'</div>'; };
  let h='<div style="'+HP_CARD+'"><div style="padding:9px 12px;font-size:14px;font-weight:800">📝 To do <span style="font-size:11px;font-weight:600;color:var(--muted)">one-time jobs for '+nm+'</span></div>';
  if(!P.sent.length&&!P.can.length) return h+'<div style="padding:0 12px 9px;font-size:12px;color:var(--muted)">Nothing on '+nm+'’s list, and nothing waiting that '+nm+' can do.</div></div>';
  if(P.sent.length) h+='<div style="'+HP_HEAD+'">On '+nm+'’s list now ('+P.sent.length+')</div>'+P.sent.map(function(id){ return row(id,true,_hhBtn("hhOnceHold('"+id+"')",'⏸ Back to the pile',false,'#64748b')); }).join('');
  if(P.can.length){ const ids=(P.can.length>HT_PFOLD&&!htdMore[k])?P.can.slice(0,HT_PFOLD):P.can;
    h+='<div style="'+HP_HEAD+(P.sent.length?';border-top:1px solid #eef2f0;padding-top:7px':'')+'">Waiting — '+nm+' can do ('+P.can.length+')</div>'+ids.map(function(id){ return row(id,false,_hhBtn("hhOnceSend('"+id+"','"+who+"')",'Give to '+nm,false,'#2B7A78')); }).join('')+_htdFoldHTML(k,P.can.length,HT_PFOLD); }
  return h+'<div style="height:4px"></div></div>';
}
// HOUSETODO_END
// HOUSETURNS_UI_START — 🔁 turns and the grown-up turn on the chore card and in a room's ⚙ Rules table, and the screen that switches
// an old rotation over (Household by room, step 5 of DESIGN_household_rooms_2026-11-15 §3.3 "Who", §3.2 Rules "takes turns · grown-up
// every Nth", §4.2, §5; her "Yes, start step 5" 2026-11-18). Mom only. Every card or Rules tap writes ONE path through _hhWrite() (so
// ?dryrun=1 writes nothing): a change to a wheel is household/rotations/<key>/v/<tomorrow> — it takes hold at the next day start, so a
// kid's list never changes under them — and the grown-up turn is household/jobs/<id>/deepEvery. Switching an old rotation over is her
// tap on a screen that first shows who is in the wheel, that no chore row changes, which "Free day" rows are no longer needed and the
// next 14 days the old way and the new way side by side (they must match, or it will not switch); then ONE multi-path update of the
// wheel and its record — no chore row is written (her rule: the kids' checklists never silently change; ticking who-can could move a
// chore when the plan is on, so the screen only suggests it). The old rows stay where they are as the wheel's seats (HOUSETURNS in
// index.html), so no check mark moves. ↩ Undo removes the wheel again while it is still as switched. Nothing runs on load or a draw.
let htSheet=null;   // the open switch screen: {id} = a row of the old rotation
function htMom(){ return typeof momHere!=="function"||momHere(); }
function htTk(){ return typeof hhTakeoverOn==="function"&&hhTakeoverOn(); }
function htAll(){ const R=householdData&&householdData.rotations; return (R&&typeof R==="object")?R:{}; }
function htTmr(){ return _hhIsoOf(_hhDayNum(hpToday())+1); }
function htEveryN(cad){ return /^\d+d$/.test(cad||"")||cad==="2w"; }
function htToast(m){ if(typeof mwToast==="function") try{ mwToast(m); }catch(e){} }
function htPeople(V){ return HouseEng.listOf(V&&V.people); }
function htCopy(V){ const o={people:htPeople(V),period:(V&&V.period)||"daily"}, ch={}; Object.keys((V&&V.chores)||{}).forEach(function(id){ ch[id]=parseInt(V.chores[id],10); }); if(Object.keys(ch).length) o.chores=ch; return o; }
// A wheel's newest version (today's, or tomorrow's change) and the wheel a chore is in from now on.
function htLast(key){ const v=(htAll()[key]||{}).v||{}, ks=Object.keys(v).filter(function(k){ return hpIsIso(k)&&v[k]&&typeof v[k]==="object"; }).sort(); return ks.length?{iso:ks[ks.length-1],V:v[ks[ks.length-1]]}:null; }
function htOf(id){ const R=htAll(); let out=null; Object.keys(R).sort().some(function(k){ const L=htLast(k); if(L&&L.V.chores&&L.V.chores[id]!==undefined){ out={key:k,V:L.V,iso:L.iso,conv:(R[k]&&R[k].conv)||null}; return true; } return false; }); return out; }
function htConvKey(tag){ const R=htAll(); return Object.keys(R).sort().find(function(k){ const c=R[k]&&R[k].conv; return !!(c&&tag&&c.rot===tag); })||""; }
function _hhRotDone(tag){ return !!htConvKey(tag); }   // HH_ROTATE leaves a switched rotation alone
// A house chore that can take turns on the card: not an old rotation row, not Up for Grabs, a one-time job or a project.
function htCan(j){ return !!j&&j.who!=="grab"&&hhIsHouse(j)&&!j.rot&&!j.free&&j.cad!=="once"&&j.layer!=="project"&&j.status!=="retired"; }
// ── the wheel: one path, from tomorrow ──
function htPut(key,V,msg){
  if(!htMom()||!htTk()) return null; const t=htTmr(), W=htCopy(V);
  householdData.rotations=Object.assign({},householdData.rotations); const node=householdData.rotations[key]=Object.assign({},householdData.rotations[key]); node.v=Object.assign({},node.v); node.v[t]=W;
  householdOnValue(householdData); if(_hhWrite()) db.ref("household/rotations/"+key+"/v/"+t).set(W); if(msg) htToast(msg); hhRender(); return W; }
function htFreeSeat(V){ const n=htPeople(V).length, used={}; Object.keys(V.chores||{}).forEach(function(id){ used[V.chores[id]]=1; }); for(let i=0;i<n;i++) if(!used[i]) return i; return -1; }
// Takes turns ON: a wheel of the kids ticked on the card (who-can order = the order it goes round); tomorrow it is the owner's turn.
function htOn(id){ const j=hhJobs()[id]; if(!htMom()||!htTk()||!htCan(j)||htOf(id)) return null;
  const L=htLast("t_"+id); if(L&&L.V.chores&&Object.keys(L.V.chores).length&&!(htAll()["t_"+id]||{}).conv) return htJoin(id,"t_"+id);   // its own wheel still turns other chores: back into it
  const P=hhCanOf(j).filter(hhIsKid); if(P.length<2){ htToast("Tick at least two kids under “Who else can do it” first"); return null; }
  const t=htTmr(), step=htEveryN(j.cad)?(+j.doneN||0):HouseEng.hop("daily",_hhDayNum(t)), at=Math.max(0,P.indexOf(j.who)), ch={}; ch[id]=(((at-step)%P.length)+P.length)%P.length;
  return htPut("t_"+id,{people:P,period:"daily",chores:ch},"Turns start tomorrow"); }
function htOff(id){ const w=htOf(id); if(!htMom()||!htTk()||!w||w.conv) return null; const V=htCopy(w.V); delete V.chores[id]; if(!Object.keys(V.chores).length) delete V.chores; return htPut(w.key,V,"Turns stop tomorrow"); }
function htJoin(id,key){ const j=hhJobs()[id], L=htLast(key); if(!htMom()||!htTk()||!htCan(j)||htOf(id)||!L||(htAll()[key]||{}).conv) return null;
  const V=htCopy(L.V), s=htFreeSeat(V); if(s<0){ htToast("Everyone in that turn already has a chore — add someone to it first"); return null; } V.chores=V.chores||{}; V.chores[id]=s; return htPut(key,V,"Turns together from tomorrow"); }
function htMove(key,i,dir){ const L=htLast(key); if(!L) return null; const V=htCopy(L.V), k=i+dir; if(i<0||k<0||k>=V.people.length) return null; const x=V.people[i]; V.people[i]=V.people[k]; V.people[k]=x; return htPut(key,V,"New order from tomorrow"); }
function htOut(key,who){ const L=htLast(key); if(!L) return null; const V=htCopy(L.V), r=V.people.indexOf(who), ch=V.chores||{}, ids=Object.keys(ch); if(r<0) return null;
  if(ids.length>V.people.length-1||V.people.length<2){ htToast("Each chore needs someone — add another person first"); return null; }
  V.people.splice(r,1); const lost=ids.filter(function(id){ if(ch[id]===r) return true; if(ch[id]>r) ch[id]--; return false; }); lost.forEach(function(id){ delete ch[id]; ch[id]=htFreeSeat(V); });
  return htPut(key,V,hhWhoName(who)+" is out of the turn from tomorrow"); }
// Who can come in: a switched rotation — a kid with a row of it on that list (their seat); a wheel made here — a kid ticked under
// "Who else can do it" on one of its chores.
function htInOk(key,V){ const c=(htAll()[key]||{}).conv, P=htPeople(V), J=hhJobs(), out=[];
  if(c){ (typeof SL_KIDS!=="undefined"?SL_KIDS:ROSTER).forEach(function(k){ if(P.indexOf(k)<0&&(((typeof routineCfg2!=="undefined"&&routineCfg2[c.slot])||{})[k]||[]).some(function(st){ return st&&st.rot===c.rot; })) out.push(k); }); return out; }
  Object.keys(V.chores||{}).forEach(function(id){ if(J[id]) hhCanOf(J[id]).forEach(function(w){ if(hhIsKid(w)&&P.indexOf(w)<0&&out.indexOf(w)<0) out.push(w); }); }); return out; }
function htIn(key,who){ const L=htLast(key); if(!L||htInOk(key,L.V).indexOf(who)<0) return null; const V=htCopy(L.V); V.people.push(who); return htPut(key,V,hhWhoName(who)+" joins the turn from tomorrow"); }
function htCycle(key,p){ const L=htLast(key); if(!L||!HH_ROT_PERIODS.some(function(x){ return x[0]===p; })) return null; const V=htCopy(L.V); if(V.period===p) return null; V.period=p; return htPut(key,V,"New cycle from tomorrow"); }
// The grown-up turn: after N kid check-offs, the next time goes to Mom or Dad (whoever is ticked; both → they alternate). One path.
function htDeep(id,n){ if(!htMom()) return null; const j=hhJobs()[id]; if(!j||!hhIsHouse(j)||j.who==="grab") return null; n=parseInt(n,10); const v=(n>=1&&n<=20)?n:null; if((parseInt(j.deepEvery,10)||null)===v) return null;
  if(v) j.deepEvery=v; else delete j.deepEvery; householdOnValue(householdData); if(_hhWrite()) db.ref("household/jobs/"+id+"/deepEvery").set(v); hhRender(); return v===null?"":v; }
// ── switching an old rotation over ──
// The rotation as rtApplyRot sees it today: each kid's rows of it on that list, in roster order.
function htGroup(slot,tag){ const out=[]; (typeof SL_KIDS!=="undefined"?SL_KIDS:ROSTER).forEach(function(k){ (((typeof routineCfg2!=="undefined"&&routineCfg2[slot])||{})[k]||[]).forEach(function(st){ if(st&&st.rot===tag) out.push({kid:k,id:st._hh||"",free:!!st.free}); }); }); return out; }
// What the switch would do, worked out (nothing written): the wheel, who is in it but not ticked under who-can (a suggestion only), the
// Free day rows no longer needed,
// and the next 14 days the old way and the new way by the engine's rotHolders (the lists' own formula: test_house_turns_convert.js).
function htPlan(id){
  const J=hhJobs(), j0=J[id]; if(!j0||!j0.rot) return null; const slot=j0.slot, tag=j0.rot, M=htGroup(slot,tag), key=(typeof _rotKey==="function")?_rotKey(tag):tag, from=htTmr(), why=[];
  if(!htTk()) why.push("🏡 Take over is off, so the kids’ lists come from Chores & Stars, not from this table.");
  if(htConvKey(tag)) why.push("It has already been switched."); else if(htAll()[key]) why.push("A turn with this name is already saved.");
  if(M.length<2) why.push("Fewer than two kids have a row of it on their list today.");
  if(M.some(function(m){ return !m.id||!J[m.id]; })) why.push("A row of it is not in the household table.");
  if(M.some(function(m,i){ return M.findIndex(function(x){ return x.kid===m.kid; })!==i; })) why.push("One kid has two rows of it on the same list.");
  if(Object.keys(J).some(function(x){ const y=J[x]; return y&&y.rot===tag&&y.status!=="retired"&&y.slot!==slot; })) why.push("The same rotation is on two different lists.");
  const W=M.length?[M[0]].concat(M.slice(1).reverse()):[], people=W.map(function(m){ return m.kid; }), chores={}; W.forEach(function(m,i){ if(!m.free&&m.id) chores[m.id]=i; });   // the order a chore travels (rtApplyRot hands it to the kid before)
  if(!Object.keys(chores).length) why.push("It has no chore in it, only “Free day” rows.");
  const V={people:people,period:(typeof rtRotPeriod==="function")?rtRotPeriod(tag):"daily",chores:chores}, can={};
  Object.keys(chores).forEach(function(c){ const cur=hhCanOf(J[c]), add=people.filter(function(k){ return cur.indexOf(k)<0; }); if(add.length) can[c]=add; });
  const P=hpPeople(), ov0=hpOv(), R1=Object.assign({},ov0.rotations), days=[]; R1[key]={v:{},conv:{rot:tag,slot:slot}}; R1[key].v[from]=V; const ov1=Object.assign({},ov0,{rotations:R1});
  for(let d=0;d<14;d++){ const iso=_hhIsoOf(_hhDayNum(from)+d), a=HouseEng.rotHolders({jobs:J},iso,P,ov0), b=HouseEng.rotHolders({jobs:J},iso,P,ov1), o={}, n={};
    Object.keys(chores).forEach(function(c){ o[c]=a[c]||""; n[c]=b[c]||""; }); days.push({iso:iso,old:o,neu:n,same:JSON.stringify(o)===JSON.stringify(n)}); }
  if(!why.length&&!days.every(function(x){ return x.same; })) why.push("The new way would not give the same kid the same chore every day, so it will not switch.");
  return {ok:!why.length,why:why,slot:slot,tag:tag,key:key,from:from,V:V,can:can,frees:M.filter(function(m){ return m.free; }),people:people,days:days}; }
function htOpen(id){ if(!htMom()) return; htSheet={id:id}; hhRender(); }
function htClose(){ htSheet=null; hhRender(); }
// ✨ Switch: ONE multi-path update — the wheel from tomorrow and its record. No chore row, Free day row or list row is written.
function htConvert(id){
  if(!htMom()) return null; const p=htPlan(id); if(!p) return null; if(!p.ok){ htToast(p.why[0]); return null; }
  const upd={}, R="household/rotations/"+p.key+"/", cv={at:Date.now(),from:p.from,rot:p.tag,slot:p.slot,by:"mom",v:p.V};
  upd[R+"v/"+p.from]=p.V; upd[R+"conv"]=cv; householdData.rotations=Object.assign({},householdData.rotations); householdData.rotations[p.key]={v:{},conv:cv}; householdData.rotations[p.key].v[p.from]=p.V;
  htSheet=null; householdOnValue(householdData); if(_hhWrite()) db.ref().update(upd); htToast("Switched — it starts tomorrow. Nothing changes on anyone’s list."); hhRender(); return upd; }
// ↩ Undo: only while the wheel is still exactly what the switch wrote (then the old rotation's own reading is the same on every day).
function htUndoWhy(key){ const n=htAll()[key], c=n&&n.conv; if(!c) return "Nothing to undo."; const v=n.v||{}, first=JSON.stringify(htCopy(c.v));
  if(!c.v||!v[c.from]||Object.keys(v).some(function(k){ return v[k]&&JSON.stringify(htCopy(v[k]))!==first; })) return "The turn was changed after the switch, so it cannot simply go back.";
  return ""; }
function htUndo(key){
  if(!htMom()||!htTk()) return null; const why=htUndoWhy(key); if(why){ htToast(why); return null; }
  if(typeof confirm==="function"&&!confirm("Put this rotation back the old way?\n\nThe chores go back to swapping between the kids’ rows. Nothing on anyone’s list changes.")) return null;
  const n=htAll()[key], upd={}; Object.keys(n.v||{}).forEach(function(k){ upd["household/rotations/"+key+"/v/"+k]=null; }); upd["household/rotations/"+key+"/conv"]=null;
  householdData.rotations=Object.assign({},householdData.rotations); delete householdData.rotations[key];
  householdOnValue(householdData); if(_hhWrite()) db.ref().update(upd); htToast("Back the old way."); hhRender(); return upd; }
// ── whose turn, worked out for the card and the room grid (nothing stored) ──
let _htH=null;
function htHold(iso){ const J=hhJobs(), R=htAll(); if(!_htH||_htH.J!==J||_htH.R!==R||Date.now()-_htH.t>5000) _htH={J:J,R:R,t:Date.now(),m:{}}; return _htH.m[iso]||(_htH.m[iso]=HouseEng.rotHolders({jobs:J},iso,hpPeople(),hpOv())); }
// A switched rotation's chore on a day its wheel holds: the kid whose turn it is ("" = not switched that day → the old reading).
function htHolder(id,iso){ const j=hhJobs()[id]; if(!j||!j.rot||typeof rtTurnsConv!=="function") return ""; const key=rtTurnsConv(j.rot); if(!key||!HouseEng.verOf(htAll()[key],iso)) return ""; return htHold(iso)[id]||""; }
function htNext(id,w){ const out=[], t=hpToday(), node=htAll()[w.key], j=hhJobs()[id]||{};
  for(let d=0;d<7;d++){ const iso=_hhIsoOf(_hhDayNum(t)+d); let who="";
    if(w.conv) who=htHold(iso)[id]||"";
    else { const V=HouseEng.verOf(node,iso); if(V&&V.chores&&V.chores[id]!==undefined) who=htEveryN(j.cad)?(d?"":HouseEng.cardTurn(V,id,+j.doneN||0)):HouseEng.cardTurn(V,id,HouseEng.hop(V.period,_hhDayNum(iso))); else who=d?"":j.who; }
    out.push({iso:iso,who:who}); }
  return out; }
// ── on the card and in ⚙ Rules (hcCtl's "turns" and "deep": the same control in both places) ──
function htCtl(id,f,t){
  const j=hhJobs()[id]; if(!j||j.who==="grab") return "";
  if(f==="deep"){ if(!hhIsHouse(j)) return ""; const cur=parseInt(j.deepEvery,10)||0, o=[0,1,2,3,4,5,6,8,10]; if(cur&&o.indexOf(cur)<0) o.push(cur);
    if(t) return _hcSel("htDeep('"+id+"',this.value)",o.map(function(n){ return [n,n?"Grown-up after "+n:"Grown-up off"]; }),cur);
    return o.map(function(n){ return _hcChip(n===cur,n?"after "+n:"Off","htDeep('"+id+"',"+n+")"); }).join('')+(cur?' <span style="font-size:11px;color:var(--muted)">kid turns</span>':''); }
  if(f!=="turns") return ""; const w=htOf(id);
  if(j.rot&&!w) return t?_hcChip(false,'🔁 old way',"hcOpen('"+id+"')",1):"";
  if(w&&w.conv) return t?_hcChip(true,'🔁 '+htPeople(w.V).length+' kids',"hcOpen('"+id+"')",1):_hcChip(true,'On','',t)+(htMom()&&!htUndoWhy(w.key)?' '+_hhBtn("htUndo('"+w.key+"')",'↩ Undo the switch',false,'#64748b'):'');
  if(!htCan(j)) return "";
  return _hcChip(!w,'Off',w?"htOff('"+id+"')":"",t)+_hcChip(!!w,'On',w?"":"htOn('"+id+"')",t); }
function htMini(on,txt,tip){ return '<button onclick="'+on+'" title="'+tip+'" style="border:none;background:none;cursor:pointer;font-size:11px;padding:0 2px;color:#475569">'+txt+'</button>'; }
function htWhoHTML(id){
  const j=hhJobs()[id]; if(!j||j.who==="grab"||j.status==="retired") return ""; const w=htOf(id), mom=htMom()&&htTk(), J=hhJobs();
  const lbl=function(l,x){ return x?'<div class="ce-sheet-lbl" style="margin:10px 0 4px">'+l+'</div><div style="display:flex;gap:4px;flex-wrap:wrap;align-items:center">'+x+'</div>':''; };
  const note=function(x){ return '<div style="font-size:11px;color:var(--muted);margin-top:4px">'+x+'</div>'; };
  let h='';
  if(w){ const P=htPeople(w.V), add=htInOk(w.key,w.V), per=HH_ROT_PERIODS.some(function(x){ return x[0]===w.V.period; })?HH_ROT_PERIODS:HH_ROT_PERIODS.concat([[w.V.period,"Every "+parseInt(w.V.period,10)+" days"]]);
    h+=lbl('Takes turns',htCtl(id,"turns"));
    h+=lbl('In the turn, in order',P.map(function(p,i){ return '<span style="display:inline-flex;gap:1px;align-items:center;border:1.5px solid '+hhRmCol(p)+';border-radius:8px;padding:2px 5px;font-size:11.5px;font-weight:800;color:'+hhRmCol(p)+'">'+(i+1)+'. '+esc(hhWhoName(p))+(mom?(i?htMini("htMove('"+w.key+"',"+i+",-1)","◀","Earlier"):"")+(i<P.length-1?htMini("htMove('"+w.key+"',"+i+",1)","▶","Later"):"")+htMini("htOut('"+w.key+"','"+p+"')","✕","Take out of the turn"):"")+'</span>'; }).join(' ')+(mom?add.map(function(k){ return _hcChip(false,'＋ '+esc(hhWhoName(k)),"htIn('"+w.key+"','"+k+"')"); }).join(''):''));
    h+=lbl('Changes',htEveryN(j.cad)?'<span style="font-size:12px">each time it is done</span>':per.map(function(x){ return _hcChip(w.V.period===x[0],esc(x[1]),mom&&w.V.period!==x[0]?"htCycle('"+w.key+"','"+x[0]+"')":""); }).join(''));
    const others=Object.keys(w.V.chores||{}).filter(function(x){ return x!==id&&J[x]; }), free=P.length-Object.keys(w.V.chores||{}).length;
    h+=lbl('Turns together with',(others.length?others.map(function(x){ return _hcChip(false,esc((J[x].emoji?J[x].emoji+" ":"")+J[x].label),"hcOpen('"+x+"')"); }).join(''):'<span style="font-size:12px">nothing else</span>')+(free>0?' <span style="font-size:11px;color:var(--muted)">· '+free+' free turn'+(free===1?'':'s')+' a day</span>':''));
    h+=lbl('Whose turn',htNext(id,w).filter(function(x){ return x.who; }).map(function(x,i){ return '<span style="font-size:11.5px;font-weight:800;color:'+hhRmCol(x.who)+'">'+(i?hpDay(x.iso).split(" ")[0]:'Today')+' '+esc(hhWhoName(x.who))+'</span>'; }).join(' · ')||'<span style="font-size:12px;color:var(--muted)">—</span>');
    if(w.iso>hpToday()) h+=note('Changes start '+hpDay(w.iso)+'. Today’s lists stay as they are.');
    const unt=P.filter(function(k){ return hhCanOf(j).indexOf(k)<0; }); if(unt.length) h+=note('Not ticked under “Who else can do it”: '+unt.map(hhWhoName).map(esc).join(', ')+' — tick them if they may cover for each other when the plan is on.');
    h+=note(w.conv?'Switched from the old rotation. Each kid keeps their own row on their list, and it shows the chore that is theirs that day — so no check mark moves.':(hhEngineMode()==="on"?'The day’s plan gives it to whoever’s turn it is.':'Shown here and in the 🔭 preview. The kids’ lists follow when the plan is switched on (👤 By person).'));
    if(!htTk()) h+=note('Changes need 🏡 Take over on.'); }
  else if(htCan(j)){ h+=lbl('Takes turns',htCtl(id,"turns"));
    const R=htAll(), o=Object.keys(R).sort().filter(function(k){ const L=htLast(k); return !R[k].conv&&L&&L.V.chores&&Object.keys(L.V.chores).length&&htFreeSeat(htCopy(L.V))>=0; });
    if(o.length&&mom) h+=lbl('…or together with',o.map(function(k){ const L=htLast(k); return _hcChip(false,'＋ '+Object.keys(L.V.chores).filter(function(x){ return J[x]; }).map(function(x){ return esc(J[x].label); }).join(' · '),"htJoin('"+id+"','"+k+"')"); }).join(''));
    if(!hhCanOf(j).filter(hhIsKid).length) h+=note('Tick the kids under “Who else can do it” first.'); }
  if(hhIsHouse(j)){ h+=lbl('Grown-up turn',htCtl(id,"deep")); const N=parseInt(j.deepEvery,10)||0;
    if(N){ const G=hhCanOf(j).filter(function(w2){ return !hhIsKid(w2); });
      h+=note('After '+N+' kid check-off'+(N===1?'':'s')+' the next time goes to '+(G.length>1?G.map(hhWhoName).join(' and ')+' (in turn)':G.length?hhWhoName(G[0]):'a grown-up')+'. So far: '+(+j.kidRun||0)+' of '+N+'.'+(hhEngineMode()==="on"?'':' It moves the chore only when the plan is on; until then the 🔭 preview shows where it would fall.'));
      if(!G.length) h+=note('<b style="color:#b45309">Tick Mom or Dad under “Who else can do it” — no grown-up can do it yet.</b>'); } }
  return h; }
// The card's line for an old rotation row: the switch button (beside 🔁 Rotations).
function htConvBtnId(id){ return htMom()?_hhBtn("htOpen('"+id+"')",'✨ Switch to the new turns',false,'#7c3aed'):''; }
// ── the old 🔁 Rotations page: a switched rotation is shown, not edited; an old one gets the switch button ──
function htRotViewHTML(g){ const key=htConvKey(g.tag); if(!key) return ""; const n=htAll()[key], L=htLast(key), P=L?htPeople(L.V):[], J=hhJobs();
  return '<div style="background:#fff;border-radius:12px;box-shadow:0 2px 10px rgba(43,122,120,0.10);margin-bottom:10px;overflow:hidden"><div style="padding:9px 12px;display:flex;align-items:center;gap:6px;flex-wrap:wrap"><span style="font-size:13px;font-weight:800">🔁 '+esc(hhRotName(g))+'</span>'+_hhChip(esc((typeof SL_SLBL!=="undefined"&&SL_SLBL[g.slot])||g.slot),'#f3f4f6','#475569')+_hhChip('✨ on the chore card','#ede9fe','#5b21b6')+'</div>'
    +'<div style="padding:6px 12px 9px;border-top:1px solid #eef2f0;font-size:12px">'+esc(P.map(hhWhoName).join(' → '))+' <span style="color:var(--muted)">· switched to the new turns '+(n.conv&&n.conv.from?'from '+hpDay(n.conv.from):'')+'. Who is in it, the order and the cycle are on each chore’s card now.</span><div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:6px">'
    +Object.keys((L&&L.V.chores)||{}).filter(function(x){ return J[x]; }).map(function(x){ return _hhBtn("hcOpen('"+x+"')",esc((J[x].emoji?J[x].emoji+" ":"")+J[x].label),false,'#2B7A78'); }).join('')+'</div></div></div>'; }
function htConvBtn(g){ if(htConvKey(g.tag)||!htMom()) return ""; const m=g.members.find(function(x){ return !x.free; }); return m?'<span style="flex:1"></span>'+htConvBtnId(m.id):""; }
// ── the switch screen (drawn by hcCardHTML in place of the card while it is open) ──
function htSheetHTML(){
  if(!htSheet||!htMom()) return ""; const p=htPlan(htSheet.id); if(!p){ htSheet=null; return ""; } const J=hhJobs(), ids=Object.keys(p.V.chores), nm=function(w){ return esc(hhWhoName(w)); };
  const per=(HH_ROT_PERIODS.find(function(x){ return x[0]===p.V.period; })||[0,"Every "+parseInt(p.V.period,10)+" days"])[1], list=(typeof SL_SLBL!=="undefined"&&SL_SLBL[p.slot])||p.slot;
  const sec=function(l){ return '<div style="margin-top:14px;padding-top:8px;border-top:1px solid var(--border);font-size:12px;font-weight:800;color:#2B7A78">'+l+'</div>'; }, li=function(x){ return '<div style="font-size:12.5px;margin-top:5px">'+x+'</div>'; };
  let h='<div class="ce-sheet open" onclick="if(event.target===this)htClose()"><div class="ce-sheet-box hc-box">';
  h+='<div style="display:flex;align-items:center;gap:8px"><div class="ce-sheet-title" style="flex:1;margin-bottom:0">✨ Switch to the new turns</div><button onclick="htClose()" style="border:1px solid var(--border);background:#fff;border-radius:8px;width:30px;height:30px;font-size:15px;cursor:pointer;color:var(--muted)">✕</button></div>';
  h+='<div style="font-size:12px;color:var(--muted);margin-top:6px">Now each kid has a row on their '+esc(list)+' list and the chores swap between those rows. After the switch the same chores go round a wheel you change on each chore’s card: who is in it, the order, how often it changes, and a grown-up turn.</div>';
  h+=sec('Who takes turns')+li('<b>'+p.people.map(nm).join(' → ')+'</b> · changes '+esc(String(per).charAt(0).toLowerCase()+String(per).slice(1)));
  h+=sec('The chores')+li(ids.map(function(c){ return '<b>'+esc((J[c].emoji?J[c].emoji+" ":"")+J[c].label)+'</b>'; }).join(' · ')+(p.people.length>ids.length?' <span style="color:var(--muted)">· '+(p.people.length-ids.length)+' free turn'+(p.people.length-ids.length===1?'':'s')+' a day</span>':''));
  h+=sec('What changes in the table')+li('No chore row changes. One new record: the wheel above.');
  if(p.frees.length) h+=li('😌 The “Free day” row'+(p.frees.length>1?'s':'')+' of '+p.frees.map(function(m){ return nm(m.kid); }).join(' and ')+': not needed any more (a wheel can have more people than chores). '+(p.frees.length>1?'They stay':'It stays')+' out of sight on '+(p.frees.length>1?'those lists':'that list')+', so no check mark moves.');
  h+=li('Every row stays where it is on every list.');
  if(Object.keys(p.can).length) h+=li('<span style="color:var(--muted)">Later, if you want, tick the kids in the turn under “Who else can do it” on each chore, so that when the plan is on and someone is out of minutes another kid in the turn can take it. Not ticked: '+Object.keys(p.can).map(function(c){ return esc(J[c].label)+' — '+p.can[c].map(nm).join(', '); }).join(' · ')+'.</span>');
  h+=sec('The next 14 days — today’s way and the new way')+'<div style="overflow:auto;margin-top:6px"><table style="border-collapse:collapse;font-size:11px;min-width:100%"><tr><th style="text-align:left;padding:3px 5px;border-bottom:1px solid #e5e7eb">Day</th>'+ids.map(function(c){ return '<th style="text-align:left;padding:3px 5px;border-bottom:1px solid #e5e7eb">'+esc(J[c].emoji||'☐')+' '+esc(J[c].label)+'</th>'; }).join('')+'<th style="padding:3px 5px;border-bottom:1px solid #e5e7eb"></th></tr>';
  p.days.forEach(function(d){ h+='<tr><td style="padding:3px 5px;font-weight:800;white-space:nowrap">'+hpDay(d.iso)+'</td>'+ids.map(function(c){ const a=d.old[c], b=d.neu[c]; return '<td style="padding:3px 5px;white-space:nowrap">'+(a===b?(a?'<span style="color:'+hhRmCol(a)+';font-weight:800">'+nm(a)+'</span>':'—'):'<span style="color:#b91c1c;font-weight:800">'+(a?nm(a):'—')+' → '+(b?nm(b):'—')+'</span>')+'</td>'; }).join('')+'<td style="padding:3px 5px">'+(d.same?'✓':'✗')+'</td></tr>'; });
  h+='</table></div>'+li(p.days.every(function(d){ return d.same; })?'✓ The same kid has the same chore on every one of those days.':'<b style="color:#b91c1c">Not the same every day.</b>');
  h+=sec('When it starts')+li('Tomorrow, '+hpDay(p.from)+'. Today’s lists stay exactly as they are, and every check mark already made stays on its own chore.');
  if(!p.ok) h+='<div style="margin-top:10px;padding:8px 10px;background:#fef2f2;border-radius:9px;font-size:12px;color:#991b1b;font-weight:700">It can’t switch yet: '+p.why.map(esc).join(' ')+'</div>';
  h+='<div style="display:flex;gap:6px;justify-content:flex-end;margin-top:14px">'+_hhBtn("htClose()",'Cancel',false,'#94a3b8')+(p.ok?_hhBtn("htConvert('"+htSheet.id+"')",'✨ Switch',true,'#7c3aed'):'')+'</div>';
  return h+'</div></div>'; }
// HOUSETURNS_UI_END
// HOUSEGRABS_UI_START — 🙌 Up for Grabs kept in the chore table (Household by room, step 6a of DESIGN_household_rooms_2026-11-15 §2.3
// problem 7, §4.7, §13; her "Yes, start 6a" 2026-11-18). Mom only. ✨ The switch is her tap on a screen that first shows, side by side,
// the kids' Up for Grabs now and after (every chore, its stars with any zone bonus, its days, its order, and each kid's own list today)
// and every difference between the kids' pool and the table's Up for Grabs rows, each with a choice; the choices it starts on keep every
// kid's list exactly as it is. Then ONE multi-path update under household/: each carried row's claim key (grabKey = its old number, so
// this week's grabs stay on their chore), the fields she chose, new rows for chores only the kids had, rows only the table had retired
// (or kept), and the record household/meta/grabs {on, by, src, n, sig, was, made} that ↩ Undo reads to put every one of those paths
// back. No grab, no config/grabs, no star and no list is written. 👥 Who can grab it: the kids as chips on the card and in ⚙ Rules, ONE
// path per tap (household/jobs/<id>/can); every kid ticked = nothing stored (everyone, as before); the last kid cannot be unticked (to
// stop offering a chore, Retire it). Everything goes through _hhWrite(), so ?dryrun=1 writes nothing. Nothing runs on load or a draw.
let hgSheet=null;   // the open switch screen: {ch:{<choice key>:<pick>}}
const HG_F=["label","emoji","pts","cad","zone","laundry"], HG_FN={label:"name",emoji:"emoji",pts:"stars",cad:"days",zone:"zone",laundry:"laundry link"};
function hgMom(){ return typeof momHere!=="function"||momHere(); }
function hgOn(){ return typeof gbSwOn==="function"&&gbSwOn(); }
function hgTk(){ return typeof hhTakeoverOn==="function"&&hhTakeoverOn(); }
function hgRec(){ const m=householdData&&householdData.meta&&householdData.meta.grabs; return (m&&m.on)?m:null; }
function hgToast(m){ if(typeof mwToast==="function") try{ mwToast(m); }catch(e){} }
function hgV(x,f){ const v=x?x[f]:null; return f==="pts"?(parseInt(v,10)||0):f==="cad"?(v||"daily"):f==="laundry"?(typeof v==="string"?v:""):(v==null?"":String(v)); }
function hgDays(cad){ cad=cad||"daily"; if(cad==="daily") return "every day"; const m=/^wk:(.+)$/.exec(cad); if(m) return m[1].split(",").map(function(d){ return ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"][+d]||""; }).join(" ");
  return cad==="2w"?"every 2 weeks":"once a week"; }
function hgSrc(){ return (Array.isArray(grabs)&&grabs.length)?"config":(typeof gbDefault==="function"&&gbDefault().length)?"default":"none"; }
function hgSig(){ return JSON.stringify(gbRows().map(function(r){ return [r.i].concat(HG_F.map(function(f){ return hgV(r.g,f); })); })); }   // what the kids' pool is made of
// Paths under household/ applied to a household object (the screen's "after" on a copy; the switch and Undo on the real one).
function hgApply(H,upd){ Object.keys(upd).forEach(function(k){ const p=k.split("/").slice(1); let o=H; for(let i=0;i<p.length-1;i++){ if(!o[p[i]]||typeof o[p[i]]!=="object") o[p[i]]={}; o=o[p[i]]; }
  if(upd[k]===null) delete o[p[p.length-1]]; else o[p[p.length-1]]=JSON.parse(JSON.stringify(upd[k])); }); return H; }
function hgSim(upd,fn){ const H=householdData; householdData=hgApply(JSON.parse(JSON.stringify(H||{})),upd); try{ return fn(); } finally{ householdData=H; } }
// What the kids see, read through the real pool code: the whole list in order, and each kid's own Up for Grabs today.
function hgView(){ return {list:gbRows().map(function(r){ const st=gbCur(r.i)||{}; return {i:r.i,id:r.id||"",e:r.g.emoji||"🎁",l:r.g.label||"",pay:gbPayout(r.i),pts:r.g.pts||0,cad:r.g.cad||"daily",lau:hgV(r.g,"laundry"),by:st.by||"",done:!!st.done}; }),
  kid:ROSTER.map(function(k){ return {k:k,pool:gbPool(k,false).map(function(x){ return (x.g.label||"")+" +"+gbPayout(x.i); }),html:_grabsHTML(k,false)}; })}; }
function hgPlan(ch){
  ch=ch||{}; const J=hhJobs(), now=Date.now(), used={}, made={}, was={}, upd={}, diffs=[], why=[];
  const pool=(typeof gbList==="function"?gbList():[]).map(function(g,p){ return {g:g||{},p:p,id:""}; }), gids=Object.keys(J).filter(function(id){ return J[id]&&J[id].who==="grab"; }).sort();
  pool.forEach(function(x){ const id="gb_"+hhSlug(x.g.label); if(J[id]&&J[id].who==="grab"&&!used[id]){ used[id]=1; x.id=id; } });   // the same chore: Bring in named it gb_<its name>
  pool.forEach(function(x){ if(x.id) return; const id=gids.find(function(k){ const s=J[k].src; return !used[k]&&s&&s.kind==="grab"&&s.i===x.p; }); if(id){ used[id]=1; x.id=id; } });   // …or renamed in the table since
  const put=function(id,f,v){ const j=J[id]; was[id]=was[id]||{}; if(!(f in was[id])) was[id][f]=(j&&j[f]!==undefined)?j[f]:null; upd["household/jobs/"+id+"/"+f]=v; };
  const pick=function(k,d){ return ch[k]||d; };
  pool.forEach(function(x){ const g=x.g;
    if(x.id){ const j=J[x.id], ret=j.status==="retired", fs=HG_F.filter(function(f){ return hgV(g,f)!==hgV(j,f); });
      if(ret) diffs.push({k:"k"+x.p,kind:"retired",x:x,d:"keep"}); x.keep=!ret||pick("k"+x.p,"keep")==="keep";
      fs.forEach(function(f){ diffs.push({k:"f"+x.p+"_"+f,kind:"field",f:f,x:x,d:"kids",a:hgV(g,f),b:hgV(j,f)}); });
      if(!x.keep) return; x.row=x.id;
      if(j.grabKey!==x.p) put(x.id,"grabKey",x.p);
      if(ret){ put(x.id,"status","active"); put(x.id,"verdict","keep"); }
      fs.forEach(function(f){ if(pick("f"+x.p+"_"+f,"kids")==="kids"){ const v=hgV(g,f); put(x.id,f,f==="pts"?v:(v===""?null:v)); } });
    } else { diffs.push({k:"a"+x.p,kind:"pool",x:x,d:"add"}); x.keep=pick("a"+x.p,"add")==="add"; if(!x.keep) return;
      let id="gb_"+hhSlug(g.label), n=2; while(J[id]||made[id]) id="gb_"+hhSlug(g.label)+"_"+(n++);
      const area=hhGuessArea(g.label), row={label:g.label||"",emoji:g.emoji||"",pts:g.pts||0,cad:g.cad||"daily"};   // the row 📥 Bring in makes for a grab
      if(g.zone) row.zone=g.zone; if(typeof g.laundry==="string"&&g.laundry) row.laundry=g.laundry;
      Object.assign(row,{who:"grab",src:{kind:"grab",i:x.p},source:"Up for Grabs",area:area,floor:(area==="cleaning"||area==="pickup")?hhGuessFloor(g.label,g.zone):"",status:"active",verdict:"",note:"",order:x.p,ts:now,grabKey:x.p});
      made[id]=1; x.row=id; upd["household/jobs/"+id]=row; } });
  const extra=[]; gids.forEach(function(id){ if(used[id]||J[id].status==="retired") return; diffs.push({k:"t"+id,kind:"table",id:id,d:"out"});
    if(pick("t"+id,"out")==="out"){ put(id,"status","retired"); put(id,"verdict","retire"); } else extra.push(id); });
  const asDef=diffs.every(function(d){ return pick(d.k,d.d)===d.d; });
  const now0=hgView(), probe=Object.assign({},upd,{"household/meta/grabs":{on:now}}), aft=hgSim(probe,hgView), sig=hgSim(probe,hgSig);
  const W={}; Object.keys(was).forEach(function(id){ W[id]=JSON.stringify(was[id]); });
  const rec={on:now,by:"mom",src:hgSrc(),n:aft.list.length,sig:sig}; if(Object.keys(W).length) rec.was=W; if(Object.keys(made).length) rec.made=made;
  upd["household/meta/grabs"]=rec;
  const same=ROSTER.map(function(k,n){ return now0.kid[n].html===aft.kid[n].html; });
  if(!hgMom()) why.push("Only Mom can switch it.");
  if(!hgTk()) why.push("Turn on 🏡 Take over first (the kids’ lists must come from the table).");
  if(hgRec()) why.push("Up for Grabs already comes from the table.");
  if(asDef&&same.some(function(v){ return !v; })) why.push("A kid’s Up for Grabs would not stay the same, so it will not switch.");
  return {ok:!why.length,why:why,upd:upd,rec:rec,pool:pool,extra:extra,diffs:diffs,asDef:asDef,now:now0,aft:aft,same:same,
    n:{key:Object.keys(upd).filter(function(k){ return /\/grabKey$/.test(k); }).length,made:Object.keys(made).length,ret:diffs.filter(function(d){ return (d.kind==="table"&&pick(d.k,d.d)==="out"); }).length,
      chg:diffs.filter(function(d){ return d.kind==="field"&&pick(d.k,d.d)==="kids"&&d.x.keep; }).length}}; }
function hgOpen(){ if(!hgMom()) return; hgSheet={ch:{}}; hhRender(); }
function hgClose(){ hgSheet=null; hhRender(); }
function hgPick(k,v){ if(!hgSheet) return; hgSheet.ch[k]=v; hhRender(); }
// 🙌 Switch: ONE multi-path update of exactly what the screen showed.
function hgSwitch(){
  if(!hgMom()) return null; const p=hgPlan(hgSheet&&hgSheet.ch); if(!p.ok){ hgToast(p.why[0]); return null; }
  hgSheet=null; hgApply(householdData,p.upd); householdOnValue(householdData); if(_hhWrite()) db.ref().update(p.upd);
  hgToast("Switched. The kids’ Up for Grabs comes from these chores now."); if(typeof renderAll==="function") renderAll(); else hhRender(); return p.upd; }
// ↩ Undo: only while the kids' Up for Grabs is exactly what the switch made (then every grab is where it was, under the same key).
function hgUndoWhy(){ const r=hgRec(); if(!r) return "Nothing to undo."; if(!hgTk()) return "Turn on 🏡 Take over first.";
  const J=hhJobs(); if(hgSig()!==r.sig||Object.keys(r.made||{}).some(function(id){ return !J[id]; })) return "Up for Grabs was changed after the switch (a chore added, edited or retired), so it cannot simply go back.";
  return ""; }
function hgUndo(){
  if(!hgMom()) return null; const why=hgUndoWhy(); if(why){ hgToast(why); return null; }
  if(typeof confirm==="function"&&!confirm("Put Up for Grabs back the old way?\n\nThe kids see the old list again, with every grab where it is. The chore rows go back to how they were before the switch.")) return null;
  const r=hgRec(), upd={}; Object.keys(r.was||{}).forEach(function(id){ let o={}; try{ o=JSON.parse(r.was[id])||{}; }catch(e){} Object.keys(o).forEach(function(f){ upd["household/jobs/"+id+"/"+f]=o[f]; }); });
  Object.keys(r.made||{}).forEach(function(id){ upd["household/jobs/"+id]=null; }); upd["household/meta/grabs"]=null;
  hgApply(householdData,upd); householdOnValue(householdData); if(_hhWrite()) db.ref().update(upd); hgToast("Back the old way."); if(typeof renderAll==="function") renderAll(); else hhRender(); return upd; }
// 👥 Who can grab it — one path per tap. Every kid ticked = nothing stored ("everyone", as before).
function hgCan(id,kid){
  if(!hgMom()||!hgOn()) return null; const j=hhJobs()[id]; if(!j||j.who!=="grab"||ROSTER.indexOf(kid)<0) return null;
  let c=gbCanKids(j); c=(c.indexOf(kid)>=0)?c.filter(function(w){ return w!==kid; }):c.concat([kid]); c=ROSTER.filter(function(w){ return c.indexOf(w)>=0; });
  if(!c.length){ hgToast("At least one kid stays ticked. To stop offering it, 🚫 Retire it."); return null; }
  const v=(c.length===ROSTER.length)?null:c; if(v) j.can=v; else delete j.can; householdOnValue(householdData); if(_hhWrite()) db.ref("household/jobs/"+id+"/can").set(v); hhRender(); return v||"everyone"; }
function hgAddKids(){ const o=hhAdd.can||{}, c=ROSTER.filter(function(w){ return o[w]; }); return c.length?c:ROSTER.slice(); }
function hgAddCan(w){ if(typeof _hhAddGrab==="function") _hhAddGrab(); if(ROSTER.indexOf(w)<0) return; let c=hgAddKids(); c=(c.indexOf(w)>=0)?c.filter(function(x){ return x!==w; }):c.concat([w]);
  if(!c.length){ hgToast("At least one kid stays ticked."); return; } const o={}; if(c.length<ROSTER.length) c.forEach(function(x){ o[x]=true; }); hhAdd.can=o; hhRender(); }
function hgCanCtl(id,t){ const add=!id, j=add?hhAdd:hhJobs()[id]; if(!j||j.who!=="grab"||!hgOn()) return ""; const on=add?hgAddKids():gbCanKids(j);
  return ROSTER.map(function(w){ return _hcChip(on.indexOf(w)>=0,t?hcIni(w):esc(hhWhoName(w)),add?"hgAddCan('"+w+"')":"hgCan('"+id+"','"+w+"')",t).replace('<button','<button title="'+esc(hhWhoName(w))+'"'); }).join('')
    +((!t&&on.length===ROSTER.length)?' <span style="font-size:11px;color:var(--muted)">everyone'+((add||Array.isArray(j.can)&&j.can.length)?'':' (nobody chosen yet)')+'</span>':''); }
// ＋ Add chore with "Up for Grabs" (switched only): one row, one targeted write.
function hgAddSave(){
  if(!hgMom()||!hgOn()) return null; if(typeof _hhAddGrab==="function") _hhAddGrab();
  const label=String(hhAdd.label||"").trim().slice(0,80), emoji=String(hhAdd.emoji||"").trim().slice(0,4); if(!label){ hgToast("Give it a name first"); return null; }
  const cad=(hhAdd.cad==="daily"||hhAdd.cad==="2w"||/^wk:[0-6](,[0-6])*$/.test(hhAdd.cad||""))?hhAdd.cad:"daily", pts=Math.max(0,Math.min(500,parseInt(hhAdd.pts,10)||0));
  const room=hhRoomList().some(function(r){ return r[0]===hhAdd.room; })?hhAdd.room:"any", area=HH_AREAS[hhAdd.area]?hhAdd.area:hhGuessArea(label,"",""), now=Date.now(), id="hh"+now.toString(36)+Math.random().toString(36).slice(2,6);
  const job={label:label,cad:cad,slot:"",pts:pts,who:"grab",src:{kind:"grab"},source:"Household tab",area:area,floor:(area==="cleaning"||area==="pickup")?(_hhRoomFloor(room)||hhGuessFloor(label,"")):"",room:room,level:(hhAdd.level>=1&&hhAdd.level<=3)?hhAdd.level:1,status:"active",verdict:"",note:"",order:_hhNextOrder("grab",""),ts:now};
  if(emoji) job.emoji=emoji; const c=hgAddKids(); if(c.length<ROSTER.length) job.can=c;
  householdData.jobs=householdData.jobs||{}; householdData.jobs[id]=job; householdOnValue(householdData); if(_hhWrite()) db.ref("household/jobs/"+id).set(job);
  hgToast("Added to Up for Grabs"); hhAdd.label=""; hhAdd.emoji=""; hhAdd.pts=""; hhAdd.area=""; hhAdd.can={}; hhAdd.kind="chore"; hhAddOpen=false; if(typeof renderAll==="function") renderAll(); else hhRender(); return id; }
// 🔍 Checks (design §13): a switched Up for Grabs chore that no kid can see.
// HOUSEGRABLV_UI (design §13, 2026-11-18): a ticked kid sees a cleaning or pickup grab only at its Cleaning level (gbLvFor). Nobody ticked
// → the line above; somebody ticked but none up to its level yet → its own line (never both).
function hgChecks(ids){ if(!hgOn()) return []; const J=hhJobs(), out=[]; ids.forEach(function(id){ const j=J[id]; if(!j||j.who!=="grab"||j.status==="retired") return; const c=gbCanKids(j);
  if(!c.length) out.push({k:"grab0",txt:"Up for Grabs, and nobody is ticked — no kid sees it",id:id});
  else if(!c.some(function(k){ return gbLvFor(j,k); })) out.push({k:"grabLv",txt:"Up for Grabs at Level "+hhLevelOf(j)+", and no kid ticked is up to Level "+hhLevelOf(j)+" yet — no kid sees it",id:id}); }); return out; }
function hgLvNote(id){ const j=hhJobs()[id]; if(!j||j.who!=="grab"||!hgOn()) return ""; const L=hhLevelOf(j), see=gbCanKids(j).filter(function(k){ return gbLvFor(j,k); });
  const t=!(j.area==="cleaning"||j.area==="pickup")?"In Up for Grabs the level holds back no health or animal chore: every kid ticked under “Who can grab it” sees it."
    :"In Up for Grabs a kid sees this chore once their own Cleaning level is "+L+(L<3?" or higher":"")+". "+(see.length?"Sees it now: "+see.map(hhWhoName).join(", ")+".":"No kid ticked under “Who can grab it” is up to Level "+L+" yet, so no kid sees it.");
  return '<div style="width:100%;font-size:11.5px;color:#7c2d12;margin-top:4px">🪜 '+esc(t)+'</div>'; }
// The card, 3 · Who: before the switch the way in; after it, since when and ↩ Undo.
function hgWhoHTML(id){ const j=hhJobs()[id]; if(!j||j.who!=="grab"||!hgMom()) return "";
  const box=function(x){ return '<div style="margin-top:8px;padding:8px 10px;border-radius:9px;background:#fff7ed;font-size:12px;color:#7c2d12">'+x+'</div>'; };
  if(!hgOn()){ const src=hgSrc(), n=(typeof gbList==="function")?gbList().length:0, what=src==="config"?'the list saved in the Star Store ('+n+')':src==="default"?'the built-in list ('+n+')':'empty';
    return box('🙌 The kids don’t see these rows. Their Up for Grabs is '+what+', so changing this chore here changes nothing they see.'+(hgRec()?' <b>Switched, but 🏡 Take over is off</b>, so they see the old list.':'')
      +'<div style="margin-top:6px">'+(hgRec()?'':hgTk()?_hhBtn("hgOpen()",'🙌 Switch Up for Grabs to the table…',false,'#A0622D'):'<span style="color:var(--muted)">Turn on 🏡 Take over first to switch Up for Grabs to the table.</span>')+'</div>'); }
  const r=hgRec(), why=hgUndoWhy(), d=new Date(r.on), on=(d.getMonth()+1)+'/'+d.getDate();
  return box(j.status==="retired"?'🙌 Retired, so it is not in Up for Grabs. ↩ Bring back puts it there again.':'🙌 The kids see this chore in Up for Grabs. What you change here is what they see.')
    +'<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-top:6px;font-size:11px;color:var(--muted)">Up for Grabs comes from the table since '+on+'.<span style="flex:1"></span>'+(why?esc(why):_hhBtn("hgUndo()",'↩ Undo the switch',false,'#64748b'))+'</div>'; }
// ── the switch screen (drawn by hcCardHTML in place of the card while it is open) ──
function hgSheetHTML(){
  if(!hgSheet||!hgMom()) return ""; const p=hgPlan(hgSheet.ch), J=hhJobs(), ch=hgSheet.ch;
  const sec=function(l){ return '<div style="margin-top:14px;padding-top:8px;border-top:1px solid var(--border);font-size:12px;font-weight:800;color:#A0622D">'+l+'</div>'; }, li=function(x){ return '<div style="font-size:12.5px;margin-top:5px">'+x+'</div>'; };
  const nm=function(g){ return '<b>'+esc((g.emoji||'🎁')+' '+(g.label||''))+'</b>'; }, zn=function(z){ const o=(typeof zoneList==="function"?zoneList():[]).find(function(x){ return x.id===z; }); return z?esc(o?(o.emoji||'')+' '+o.name:z):'none'; };
  const fv=function(f,v){ return f==="pts"?v+' ⭐':f==="cad"?esc(hgDays(v)):f==="zone"?zn(v):f==="laundry"?(v?'🧺 '+esc(v):'none'):('“'+esc(v)+'”'); };
  const chips=function(k,d,opts){ const cur=ch[k]||d; return '<div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:4px">'+opts.map(function(o){ return _hcChip(cur===o[0],o[1],"hgPick('"+k+"','"+o[0]+"')"); }).join('')+'</div>'; };
  const claim=function(x){ const s=(typeof gbCur==="function")?gbCur(x.p):null; return s&&s.by?' <span style="color:#b45309">('+esc(hhWhoName(s.by))+(s.done?' did it this week':' is holding it for later')+' — leaving it out '+(s.done?'drops it from the list':'lets it go')+')</span>':''; };
  const kn=function(k){ return esc(hhWhoName(k)); };
  let h='<div class="ce-sheet open" onclick="if(event.target===this)hgClose()"><div class="ce-sheet-box hc-box">';
  h+='<div style="display:flex;align-items:center;gap:8px"><div class="ce-sheet-title" style="flex:1;margin-bottom:0">🙌 Switch Up for Grabs to the table</div><button onclick="hgClose()" style="border:1px solid var(--border);background:#fff;border-radius:8px;width:30px;height:30px;font-size:15px;cursor:pointer;color:var(--muted)">✕</button></div>';
  const src=hgSrc(), gN=Object.keys(J).filter(function(id){ return J[id].who==="grab"&&J[id].status!=="retired"; }).length;
  h+='<div style="font-size:12px;color:var(--muted);margin-top:6px">Now the kids’ Up for Grabs is '+(src==="config"?'the list saved in the Star Store':src==="default"?'the built-in list':'empty')+' ('+p.pool.length+' chore'+(p.pool.length===1?'':'s')+'). The table’s '+gN+' Up for Grabs row'+(gN===1?'':'s')+' are a copy: changing one changes nothing the kids see. After the switch the kids read the table: what you change on a chore’s card is what they see, and you choose who can grab each one.</div>';
  h+=sec('What is different ('+p.diffs.length+')');
  if(!p.diffs.length) h+=li('Nothing — the table already matches the kids’ list.');
  p.diffs.forEach(function(d){
    if(d.kind==="field") h+=li(nm(d.x.g)+' — '+HG_FN[d.f]+': the kids '+(d.f==="label"?'see ':'have ')+fv(d.f,d.a)+', the table '+(d.f==="label"?'says ':'has ')+fv(d.f,d.b)+(d.x.keep?'':' <span style="color:var(--muted)">(left out below)</span>')+chips(d.k,d.d,[["kids","Keep the kids’ "+HG_FN[d.f]],["table","Use the table’s"]]));
    else if(d.kind==="retired") h+=li(nm(d.x.g)+' is retired in the table, but the kids still see it.'+claim(d.x)+chips(d.k,d.d,[["keep","Keep it for the kids"],["out","Leave it out"]]));
    else if(d.kind==="pool") h+=li(nm(d.x.g)+' is only in the kids’ list.'+claim(d.x)+chips(d.k,d.d,[["add","Add it to the table"],["out","Leave it out"]]));
    else h+=li(nm(J[d.id])+' is only in the table — the kids have never seen it.'+chips(d.k,d.d,[["out","Leave it out (retire it)"],["add","Add it to Up for Grabs"]])); });
  const row=function(v){ return v?esc(v.e+' '+v.l)+' <span style="color:#A0622D;font-weight:800">+'+v.pay+' ⭐</span>'+(v.pay!==v.pts?' <span style="font-size:10.5px">zone +'+(v.pay-v.pts)+'</span>':'')+' <span style="color:var(--muted)">· '+esc(hgDays(v.cad))+(v.lau?' · 🧺':'')+'</span>'+(v.by?' <span style="font-size:10.5px;color:#b45309">'+(v.done?'✓ '+kn(v.by)+' did it':'🔒 '+kn(v.by)+' has it')+'</span>':''):'<span style="color:var(--muted)">—</span>'; };
  const key=function(v){ return v?[v.e,v.l,v.pay,v.cad,v.lau,v.by,v.done].join("|"):""; };
  const A={}; p.aft.list.forEach(function(v){ A[String(v.i)]=v; }); const B={}; p.now.list.forEach(function(v){ B[String(v.i)]=v; });
  const keys=p.now.list.map(function(v){ return String(v.i); }).concat(p.aft.list.map(function(v){ return String(v.i); }).filter(function(k){ return !B[k]; }));
  h+=sec('The kids’ Up for Grabs — now and after')+'<div style="overflow:auto;margin-top:6px"><table style="border-collapse:collapse;font-size:11px;min-width:100%"><tr><th style="text-align:left;padding:3px 5px;border-bottom:1px solid #e5e7eb">#</th><th style="text-align:left;padding:3px 5px;border-bottom:1px solid #e5e7eb">Now</th><th style="text-align:left;padding:3px 5px;border-bottom:1px solid #e5e7eb">After</th><th style="border-bottom:1px solid #e5e7eb"></th></tr>';
  keys.forEach(function(k,n){ const a=B[k], b=A[k], s=key(a)===key(b); h+='<tr><td style="padding:3px 5px;color:var(--muted)">'+(n+1)+'</td><td style="padding:3px 5px">'+row(a)+'</td><td style="padding:3px 5px'+(s?'':';background:#fef2f2')+'">'+(s?'<span style="color:var(--muted)">the same</span>':row(b))+'</td><td style="padding:3px 5px">'+(s?'✓':'≠')+'</td></tr>'; });
  const bad=keys.filter(function(k){ return key(B[k])!==key(A[k]); }).length;
  h+='</table></div>'+li(bad?'<b style="color:#b91c1c">'+bad+' line'+(bad===1?'':'s')+' change'+(bad===1?'s':'')+'</b>, as chosen above.':'✓ Every chore, its stars, its days and its order stay the same.');
  h+=sec('Each kid today')+ROSTER.map(function(k,n){ const a=p.now.kid[n], b=p.aft.kid[n]; return li('<b>'+kn(k)+'</b>: now '+a.pool.length+' · after '+b.pool.length+' — '+(p.same[n]?'✓ exactly the same screen':'<span style="color:#b91c1c;font-weight:700">different'+(function(){ const plus=b.pool.filter(function(x){ return a.pool.indexOf(x)<0; }), minus=a.pool.filter(function(x){ return b.pool.indexOf(x)<0; }); return (plus.length?': gains '+esc(plus.join(', ')):'')+(minus.length?(plus.length?'; ':': ')+'loses '+esc(minus.join(', ')):''); })()+'</span>')); }).join('');
  h+=sec('What changes in the table')+li(p.n.key+' row'+(p.n.key===1?' gets':'s get')+' a lasting claim number, so a grab can never move to another chore'+(p.n.chg?' · '+p.n.chg+' change'+(p.n.chg===1?'':'s')+' to the kids’ version':'')+(p.n.made?' · '+p.n.made+' new row'+(p.n.made===1?'':'s'):'')+(p.n.ret?' · '+p.n.ret+' retired':'')+' · one record for ↩ Undo.')
    +li('<span style="color:var(--muted)">Nothing else: no grab, no star, no list and not the old Up for Grabs list is written. The Star Store and Chores &amp; Stars stop editing Up for Grabs and point here.</span>');
  h+=sec('When it starts')+li('Right away, on every device as soon as it hears of it. A grab already pulled or done this week stays with the same kid, done, in its cooldown and in the Click-off Log. A screen that has not heard yet keeps the old list, and its taps land on the same chores.');
  if(!p.ok) h+='<div style="margin-top:10px;padding:8px 10px;background:#fef2f2;border-radius:9px;font-size:12px;color:#991b1b;font-weight:700">It can’t switch: '+p.why.map(esc).join(' ')+'</div>';
  h+='<div style="display:flex;gap:6px;justify-content:flex-end;margin-top:14px">'+_hhBtn("hgClose()",'Cancel',false,'#94a3b8')+(p.ok?_hhBtn("hgSwitch()",'🙌 Switch',true,'#A0622D'):'')+'</div>';
  return h+'</div></div>'; }
// HOUSEGRABS_UI_END
// LEDGERVIEW_START — 📒 the Ledger, look only (DESIGN_chore_ledger_2026-11-21 §2 and §8, slice L1; her "go" 2026-11-21). Her words
// 11/21: "a good ledger for mom to really look at the deductions and everything that was daily … a whole like command ledger of
// everything that the kids did … really intuitive and easy for a new mom to come in and understand it"; "moms day as a button to a pop
// up"; "Dad gets it too"; "i dont want to mess up something that is working". ledgerOpen (index.html, LEDGER) opens it from the 📒 on
// 🧒 Kids today, Mom mode or Dad's own link. One kid, one day (or This week): every row that was on that kid's lists, in plain words,
// the stars added up on top. It WRITES NOTHING — no database, no bank, no log line. The one thing kept is on this device:
// HA_LS "ha_ledger_hello" = "1" once the first-minute card's ✕ is tapped.
// Every row is read with the lists' own readers, so it says what the kid's list and the bank say: rtStepsFor (the rows of that day),
// cadDueOn + stepWindowOk (due that day), the check-off's own stored pts / ts / bid (what it paid, when; never worked out again), the
// bank line's held (⏸ Mom checks before pay), rtWaved (➖ ✕ today), amGet / amCarry (🌅), mdLateDays → rtLateDays + rtWaitNote +
// rtFallPay (⏳ on today), rtWaitDays + cadDueOn (the day a missed turn left the list: the wait rule walked day by day, CHOREWAIT),
// the list record's bonusPts (🏁 🏆). The global `day` is pinned to the day being read, as boardStatPop and mdLateDays do.
// How far back: this week (its Sunday to today) from slState, and last week's seven days from prevSlState once the lists' own read
// (_loadPrevSl) has brought it. Nothing older is kept on a device, and the ledger reads nothing new: an older day says so.
let lgKid="", lgOff=0, lgWeek=false;   // the pop-up's place (memory only): kid, days from today, This week
const LG_HELLO="ha_ledger_hello";
const LG_WD=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
function lgNow(){ return _rtPos(DAYS_ALL.indexOf(_todayDay)); }   // today's place in its week: Sunday −1, Monday 0 … Saturday 5
function lgMin(){ return -(lgNow()+9); }   // one day before last week's Sunday: the "not on this device" day
// k days from today (0 today, −1 yesterday …) → that day of this week or last week, or null
function lgDay(k){ const p=lgNow()+k; if(k>0||p<-8) return null; const prev=p<-1, wk=prev?_prevWkKey():activeWk(); if(!wk) return null;
  const dn=DAYS_ALL[_rtIdx(prev?p+7:p)]; return {k:k,dn:dn,iso:amIso(dn,prev),wk:wk,prev:prev}; }
// the check-offs of that day's week: this week's, or last week's once the lists' read has it (else null: not on this device yet)
function lgMap(D){ return D.prev?((typeof prevSlState!=="undefined"&&prevSlState&&_prevSlWk===D.wk)?prevSlState:null):slState; }
function lgRec(slot,kid,D,i){ if(!D.prev&&typeof hdSlRec==="function") return hdSlRec(slot,kid,D.dn,i); const m=lgMap(D); return (m&&m[D.wk+"_"+D.dn+"_"+kid+"_"+(slot==="morning"?"m":RT_ABBR[slot])+"step"+i])||null; }
function lgWaved(slot,kid,D,i){ if(!D.prev) return rtWaved(slot,kid,D.dn,i); const w=wavedData&&wavedData[D.wk]; return !!(w&&w[D.dn]&&w[D.dn][kid]&&w[D.dn][kid][rtWaveKey(slot,i)]); }
function lgWin(st,iso){ return !st||!iso||((!st.from||iso>=st.from)&&(!st.to||iso<=st.to)&&(!st.cycW||typeof stepCycleOk!=="function"||stepCycleOk(st,iso))); }
// due that day: the lists' cadDueOn + window; last week's every-N-days rows count from that week's own dates
function lgDue(st,D){ const cad=(st&&st.cad)||"daily";
  if(!D.prev) return stepWindowOk(st,D.dn)&&cadDueOn(cad,D.dn);
  if(!lgWin(st,D.iso)) return false;
  if(/^\d+d$/.test(cad)||cad==="2w"){ const n=cadDateNum(D.dn); return n==null||(n-7)%(cad==="2w"?14:parseInt(cad,10))===0; }
  return cadDueOn(cad,D.dn); }
// Last week's rows: the lists' own rows, but the laundry line's Start / Fold rows laid for THAT week's date (llRtSteps lays them by this
// week's dates) — the same three lines as _llRtStepsRaw, given the date. The plan's appended rows are left out (this week only).
function lgPrevSteps(slot,kid,D){ const s=rtStepsFor(slot,kid,false,D.dn)||[], c=s.findIndex(function(st){ return st&&st.line; }), out=c<0?s.slice():s.slice(0,c);
  if(typeof llDrivesKid!=="function"||!llDrivesKid(kid)) return out; const A=llAll();
  if(slot==="morning"||slot==="afternoon") llKidDayLoads(kid,D.iso).forEach(function(id){ if(A[id]&&llWhen(id)===slot) out.push({emoji:A[id].emoji||"🧺",label:"Start your laundry: "+llLabelFull(id),pts:llKidPts(kid,"start"),cad:"daily",laundry:true,line:id}); });
  if(slot==="afternoon") llKidFoldLoads(kid,D.iso).forEach(function(id){ if(A[id]) out.push(llFoldRow(kid,id,D.iso)); });
  return out; }
function lgHeld(kid,bid){ const a=bid&&bank[kid]&&bank[kid].adjustments&&bank[kid].adjustments[bid]; return !!(a&&a.held); }
// a held line Mom turned down (✗ on ⏸ Claims: bankHeldReject removes the line, the tick stays): the check-off names a line the bank no longer has
function lgUnpaid(kid,bid){ return !!(bid&&bank[kid]&&bank[kid].adjustments&&!bank[kid].adjustments[bid]); }
function lgWd(iso){ const d=new Date(iso+"T12:00:00"); return LG_WD[d.getDay()]||""; }
function lgName(kid){ return cap(kid); }
// A turn due on day D and not done that day: what became of it, by the lists' wait rule walked day by day (rtLateDays / rtWaitCut):
// {done:T} ticked on day T in its wait · {gone:T} off the list on day T (its wait ran out, its next day came, or its dates ended) ·
// {wait:1} still on the list today · null: never waits (daily, meal, as-needed, the plan's own rows, ✕ / 🌅) or a day not on the device
function lgFate(slot,kid,i,st,D,to){ const cad=(st&&st.cad)||"daily"; if(!lgCarried(slot)||!/^wk:/.test(cad)||st.meal||st.house) return null;
  if(typeof amCovers==="function"&&amCovers(kid,slot,i,D.iso)) return null;
  const W=rtWaitDays(st); to=(to==null)?0:to;
  for(let k=D.k+1;k<=to;k++){ const T=lgDay(k); if(!T||!lgMap(T)) return null;
    if(lgDue(st,T)||k-D.k>W||!lgWin(st,T.iso)) return {gone:T};
    const r=lgRec(slot,kid,T,i); if(r&&r.done) return {done:T}; }
  return to===0?{wait:1}:null; }
// the most recent day before D on which this row was due (a late tick's own day)
// Does this list carry a missed row? Only the lists rtSlotHTML draws (Afternoon, Chores, Evening: rtIsMulti, RT_ABBR) keep a missed
// turn on in its wait (CHOREWAIT). The Morning list (mrIndividualHTML, every screen) lists only what is due that day (morningDueIdx) and
// pays its stars in full (toggleMorningStep): a Morning row not done on its day was simply not done — never ⏳, never gone, never late
// (hub's check 11/21: a Mon/Wed/Fri Morning row read "⏳ 1 day late · pays 12 of 15" on Tuesday; rtLateDays answers for any slot).
function lgCarried(slot){ return typeof rtIsMulti==="function"&&rtIsMulti(slot); }
function lgDueBefore(st,D){ for(let j=1;j<=7;j++){ const E=lgDay(D.k-j); if(!E) return null; if(lgDue(st,E)) return E; } return null; }
// One row of a kid's list on day D → {ic, nm, note, pts (paid that day), sh (fell short), held, ts, c: 1 done · 0 not done · undefined a line}
function lgRow(slot,kid,D,i,st){
  const rec=lgRec(slot,kid,D,i), dn=!!(rec&&rec.done), due=lgDue(st,D), full=st.pts||0, cad=st.cad||"daily", who=lgName(kid);
  const r={nm:(st.emoji?st.emoji+" ":"")+(st.label||"Chore"),id:st.house||st._hh||""};
  if(lgWaved(slot,kid,D,i)) return Object.assign(r,{ic:"➖",note:"excused (✕ today)"});
  if(dn&&rec.am) return Object.assign(r,{ic:"✅",note:"🌅 done the next morning ("+lgWd(rec.am)+") · its stars are on that day",c:1});
  if(dn){ const p=rec.pts||0; r.ts=rec.ts||""; r.c=1;
    if(lgHeld(kid,rec.bid)) return Object.assign(r,{ic:"⏸",note:"waiting for your ✓ · "+p+" ⭐",held:p});
    if(lgUnpaid(kid,rec.bid)) return Object.assign(r,{ic:"✅",note:"not paid (your ✗ on its stars)"});
    r.ic="✅"; r.pts=p;
    if(due){ if(p<full&&typeof rtDailyRow==="function"&&rtDailyRow(st)){ r.sh=full-p; r.note="paid "+p+" of "+full+" ⭐"; } return r; }   // CHOREDAILY (C5): a daily after 2+ missed days
    if(!/^wk:/.test(cad)||!lgCarried(slot)){ if(cad==="asneeded") r.note="as needed"; return r; }
    const E=lgDueBefore(st,D), n=E?D.k-E.k:0; r.sh=Math.max(0,full-p);
    r.note=(p<full?"paid "+p+" of "+full+" ⭐":"done late")+(E?" · due "+lgWd(E.iso):"")+((E&&rtWaitAsBefore(st))?" · "+n+" day"+(n>1?"s":"")+" late":"");
    if(typeof lgGbRow==="function") lgGbRow(r,slot,kid,D,i,st,E,p,full);   // ⭐ LEDGERGB (L2): the row's give-back button, or what was given back
    return r; }
  if(due){
    if(typeof amGet==="function"&&amGet(kid,slot,i,D.iso)) return Object.assign(r,{ic:"🌅",note:"sent to "+(D.k===0?"tomorrow":"the next")+" morning"+(typeof lgAmzSent==="function"?lgAmzSent(kid,slot,i,D):"")});   // LEDGERAMZ
    r.c=0; r.want=full;
    if(D.k===0){ const dl=(typeof rtDailyNote==="function")?rtDailyNote(slot,kid,i,st):""; return Object.assign(r,{ic:"○",note:"not done yet"+(dl?" · "+dl:"")}); }   // CHOREDAILY (C5)
    const f=lgFate(slot,kid,i,st,D);
    return Object.assign(r,{ic:"✖",note:"not done"+(!f?"":f.done?" · done "+lgWd(f.done.iso)+", late (see that day)":f.gone?" · gone from "+who+"'s list "+lgWd(f.gone.iso):" · still on "+who+"'s list today")}); }
  if(D.k===0&&lgCarried(slot)){ const n=(typeof mdLateDays==="function")?mdLateDays(slot,kid,D.dn,i,st):0;
    if(n>0){ const pay=rtFallPay(st,n,kid);   // ⚙ LEDGERRULES: that kid's switch
      return Object.assign(r,{ic:"⏳",c:0,note:(rtWaitAsBefore(st)?n+" day"+(n>1?"s":"")+" late":"still on "+who+"'s list "+rtWaitNote(n,st).split(" · ")[0])+(pay<full?" · pays "+pay+" of "+full+" ⭐ today":"")}); } }
  return null;
}
// a bonus record (🏁 list / 🏆 day) → its row, or null
function lgBonus(kid,rec,ic,nm){ if(!rec||!rec.bonusBid||!rec.bonusPts) return null; const h=lgHeld(kid,rec.bonusBid);
  return h?{ic:"⏸",nm:ic+" "+nm,note:"waiting for your ✓ · "+rec.bonusPts+" ⭐",held:rec.bonusPts}:{ic:"✅",nm:ic+" "+nm,pts:rec.bonusPts,ts:rec.ts||""}; }
const LG_LIST={morning:"🌅 Morning",afternoon:"☀️ Afternoon",chores:"🧹 Chores",evening:"🌙 Evening"};
// One kid, one day → {D, lists:[{slot,title,rows,done,tot}], gone:[rows], earned, short, open, held} · {none:1} · {notYet:D}
function lgDayData(kid,k){
  const D=lgDay(k); if(!D) return {none:1}; if(!lgMap(D)) return {notYet:D};
  const out={D:D,lists:[],gone:[],earned:0,short:0,open:0,held:0}, m=lgMap(D), pd=day, pw=_prevSlWk; day=D.dn;
  try{ if(typeof _prevWkKey==="function") _prevSlWk=_prevWkKey();   // the lists' read of last week is theirs to make: the ledger never starts one (rtLateDays then says nothing, as before the read lands)
    ((typeof activeSlots==="function")?activeSlots():SL_SLOTS).forEach(function(slot){
      const rows=[], steps=D.prev?lgPrevSteps(slot,kid,D):(rtStepsFor(slot,kid,false,D.dn)||[]);
      if(slot==="morning") ((typeof amList==="function")?amList(kid):[]).filter(function(it){ return it.dueIso<=D.iso&&!(it.done&&it.done.iso&&it.done.iso<D.iso); }).forEach(function(it){   // 🌅 the carries on that morning's list (amFor's own rule)
        const r={nm:"🌅 "+(it.emoji?it.emoji+" ":"")+(it.label||"Chore"),note:"from "+amFromLbl(it)+" "+(SL_SLBL[it.slot]||it.slot)}, x=it.done;
        if(x&&x.iso===D.iso){ r.c=1; r.ts=x.ts||""; if(x.src==="list"){ r.ic="✅"; r.note+=" · ticked on its own list"; } else if(lgHeld(kid,x.bid)){ r.ic="⏸"; r.held=x.pts||0; r.note+=" · waiting for your ✓"; } else { r.ic="✅"; r.pts=x.pts||0; } }
        else { r.c=0; r.ic=D.k===0?"○":"✖"; r.note+=D.k===0?" · not done yet":" · not done"; }
        if(typeof lgAmzRow==="function") lgAmzRow(r,kid,D,it);   // LEDGERAMZ (C4)
        rows.push(r); });
      if(slot==="morning"&&typeof lgAmzLost==="function") lgAmzLost(rows,kid,D);   // LEDGERAMZ
      steps.forEach(function(st,i){ if(!st||(D.prev&&st.house)) return; let r=lgRow(slot,kid,D,i,st); if(typeof lgXRow==="function") r=lgXRow(r,slot,kid,D,i,st);   // ➖ LEDGERX (L3): Excuse / Undo on the row
        if(!r) return;
        if(D.prev&&st.rot) r.nm="🔄 a job that takes turns";   // last week's turn is not worked out again here (rtApplyRot reads this week's dates)
        rows.push(r); });
      const b=lgBonus(kid,m[D.wk+"_"+D.dn+"_"+kid+"_"+slot],"🏁","List complete bonus"); if(b) rows.push(b);
      if(rows.length) out.lists.push({slot:slot,title:LG_LIST[slot]||slot,rows:rows,done:rows.filter(function(r){ return r.c===1; }).length,tot:rows.filter(function(r){ return r.c===0||r.c===1; }).length});
      // gone from the list that day: the turn due on its last day before this one left the list today
      const g0=out.gone.length;   // LEDGERDROP
      if(lgCarried(slot)) steps.forEach(function(st,i){ if(!st||st.house||!/^wk:/.test(st.cad||"")) return; const E=lgDueBefore(st,D); if(!E||!lgMap(E)) return;
        const er=lgRec(slot,kid,E,i); if((er&&er.done)||(lgWaved(slot,kid,E,i)&&!(typeof lgXHere==="function"&&lgXHere(kid,D,slot,i,E)))) return;   // ➖ LEDGERX: excused here just now → kept in its spot
        const f=lgFate(slot,kid,i,st,E,D.k); if(f&&f.gone&&f.gone.k===D.k){ const g={ic:"✖",nm:(st.emoji?st.emoji+" ":"")+(st.label||"Chore"),id:st.house||st._hh||"",note:"due "+lgWd(E.iso)+", not done in time"}; if(typeof lgXGone==="function") lgXGone(g,slot,kid,D,E,i,st); out.gone.push(g); } });
      if(typeof lgDropGones==="function") lgDropGones(out.gone,g0,slot,kid,D,steps);   // 📒 LEDGERDROP (C3): what each drop took
    });
    const db2=lgBonus(kid,m[D.wk+"_"+D.dn+"_"+kid+"_day"],"🏆","Whole day complete"); if(db2) out.lists.push({slot:"day",title:"🏆 Whole day",rows:[db2],done:0,tot:0});
  } finally { day=pd; _prevSlWk=pw; }
  out.lists.forEach(function(L){ L.rows.forEach(function(r){ out.earned+=(r.pts||0)+(r.gb||0); out.short+=r.sh||0; out.held+=r.held||0; if(r.c===0) out.open++; }); });
  out.taken=0; out.gone.forEach(function(r){ out.taken+=r.tk||0; });   // LEDGERDROP: what came off the bank
  out.lists.forEach(function(L){ L.rows.forEach(function(r){ out.taken+=r.atk||0; }); });   // LEDGERAMZ (C4): a 🌅 row's cost after 0
  return out;
}
// ── drawing ──
function lgHelloOpen(){ try{ return HA_LS.getItem(LG_HELLO)!=="1"; }catch(e){ return true; } }
function lgHelloClose(){ try{ HA_LS.setItem(LG_HELLO,"1"); }catch(e){} lgDraw(); }
function lgDate(iso,long){ const d=new Date(iso+"T12:00:00"); return isNaN(d.getTime())?"":d.toLocaleDateString("en-US",long?{weekday:"long"}:{weekday:"short",month:"short",day:"numeric"}); }
function lgStar(n){ return n+" ⭐"; }
function lgSum(x,today){ return "earned "+lgStar(x.earned)+(x.short?" · fell short "+lgStar(x.short):"")+(x.taken?" · taken "+lgStar(x.taken):"")+(x.open?" · "+x.open+" not done"+(today?" yet":""):"")+(x.held?" · ⏸ "+lgStar(x.held)+" waiting for your ✓":""); }
function lgRowHTML(r){
  const nm=(r.id&&typeof hcGoOk==="function"&&hcGoOk(r.id))?'<span onclick="lgClose();hcGo(\''+r.id+'\')" style="cursor:pointer;text-decoration:underline dotted #94a3b8">'+esc(r.nm)+'</span>':esc(r.nm);
  return '<div style="display:flex;flex-wrap:wrap;align-items:baseline;gap:2px 8px;padding:5px 2px;border-bottom:1px solid #f3f4f6;font-size:13px'+(r.c===0||r.ic==="➖"?';color:#6b7280':'')+'">'
    +'<span style="width:18px;text-align:center;flex-shrink:0">'+r.ic+'</span><span style="flex:1 1 180px;min-width:0">'+nm+(r.note?' <span style="font-size:11.5px;color:#6b7280">'+esc(r.note)+'</span>':'')+'</span>'
    +(r.pts?'<span style="font-weight:800;color:#b45309;white-space:nowrap">+'+lgStar(r.pts)+'</span>':(r.c===0&&r.want?'<span style="color:#9ca3af;white-space:nowrap">'+lgStar(r.want)+'</span>':''))
    +(r.ts?'<span style="font-size:10.5px;color:#9ca3af;white-space:nowrap">'+esc(String(r.ts).replace(/\s+[A-Z][a-z]{2} \d{1,2}$/,""))+'</span>':'')+(r.xH||'')+(r.gbH||'')+'</div>'; }   // the time: the stamp's date is the day on screen
function lgListsHTML(x,kid){
  let h='';
  x.lists.forEach(function(L){ h+='<div style="margin-top:9px;font-size:12.5px;font-weight:800;color:#374151">'+L.title+(L.tot?' <span style="font-weight:700;color:#9ca3af">'+L.done+' of '+L.tot+'</span>':'')+'</div>'+L.rows.map(lgRowHTML).join(''); });
  if(x.gone.length) h+='<div style="margin-top:9px;font-size:12.5px;font-weight:800;color:#374151">Gone from '+esc(lgName(kid))+'\'s list '+(x.D.k===0?'this morning':'that morning')+'</div>'+x.gone.map(lgRowHTML).join('');
  return h||'<div style="font-size:13px;color:#6b7280;padding:12px 2px">Nothing was on '+esc(lgName(kid))+'\'s lists this day.</div>'; }
function lgFar(why){ return '<div style="font-size:13px;color:#6b7280;padding:12px 2px">'+why+'</div>'; }
const LG_FAR="Only this week and last week are on this device.", LG_NOTYET="Last week's check-offs are not on this device yet. Open a kid's list and come back.";
function lgDayHTML(kid,k){
  const x=lgDayData(kid,k); if(x.none) return lgFar(LG_FAR); if(x.notYet) return lgFar(LG_NOTYET);
  const lbl=k===0?"Today":k===-1?"Yesterday":lgDate(x.D.iso,true);
  return '<div style="font-size:13.5px;padding:6px 2px 2px"><b>'+lbl+':</b> '+lgSum(x,k===0)+'</div>'+lgListsHTML(x,kid); }
// This week = Sunday … today (or last week's Sunday … Saturday): every day's rows under its date, the week's totals on top
function lgWeekHTML(kid){
  const t=lgNow(), last=lgDay(lgOff)&&lgDay(lgOff).prev, a=last?-(t+8):-(t+1), b=last?-(t+2):0, days=[], tot={earned:0,short:0,open:0,held:0,taken:0};
  for(let k=a;k<=b;k++){ const x=lgDayData(kid,k); if(x.notYet) return lgFar(LG_NOTYET); if(x.none) continue; days.push(x); ["earned","short","open","held","taken"].forEach(function(f){ tot[f]+=x[f]||0; }); }
  return '<div style="font-size:13.5px;padding:6px 2px 2px"><b>'+(last?'Last week':'This week')+':</b> '+lgSum(tot,!last)+'</div>'
    +days.map(function(x){ return '<div style="margin-top:12px;padding:5px 8px;background:#f8fafc;border-radius:8px;font-size:12.5px"><b>'+(x.D.k===0?'Today':lgDate(x.D.iso))+'</b> <span style="color:#6b7280">'+lgSum(x,x.D.k===0)+'</span></div>'+lgListsHTML(x,kid); }).join(''); }
function lgHTML(){
  const _lt=(typeof ltHTML==="function")?ltHTML():""; if(_lt) return _lt;   // 📒 LASTTURNS (L7): the ledger on one chore (lgWeek===null)
  const kid=lgKid, D=lgDay(lgOff), chip=function(on,lab,js){ return '<span onclick="'+js+'" style="cursor:pointer;font-size:12px;font-weight:'+(on?'800':'600')+';padding:3px 10px;border-radius:12px;border:1.5px solid '+(on?'#2B7A78':'var(--border)')+';background:'+(on?'#e6f4f3':'#fff')+';color:'+(on?'#2B7A78':'#6b7280')+'">'+lab+'</span>'; };
  const arrow=function(lab,to,off){ return '<button '+(off?'disabled ':'onclick="lgGo(\'\','+to+')" ')+'style="border:1.5px solid var(--border);background:#fff;border-radius:8px;padding:2px 10px;font-size:14px;font-weight:800;cursor:'+(off?'default;opacity:.35':'pointer')+'">'+lab+'</button>'; };
  const lo=lgMin(), t=lgNow(), last=!!(D&&D.prev), when=lgWeek?((D&&D.prev)?'Last week':'This week'):(D?lgDate(D.iso):'Earlier');
  let h='<div id="lg-pop" onclick="lgClose()" style="position:fixed;inset:0;background:rgba(15,23,42,0.45);z-index:9000;display:flex;align-items:center;justify-content:center;padding:12px">'
    +'<div onclick="event.stopPropagation()" style="background:#fff;border-radius:16px;max-width:560px;width:100%;max-height:88vh;overflow:auto;padding:14px 14px 16px;box-shadow:0 20px 50px rgba(0,0,0,0.3)">'
    +'<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px"><div style="font-family:\'Fraunces\',serif;font-weight:700;font-size:17px;flex:1">📒 Ledger</div>'+(typeof lgRulesBtn==="function"?lgRulesBtn():'')+'<button onclick="lgClose()" style="border:none;background:#f3f4f6;border-radius:8px;padding:4px 10px;font-size:13px;cursor:pointer">✕</button></div>'+(typeof lgRulesTop==="function"?lgRulesTop():'')   // ⚙ LEDGERRULES: the panel, the ⏸ banner
    +'<div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:8px">'+SL_KIDS.map(function(k){ const on=k===kid, col=SL_KCOL[k]||"#666"; return '<span onclick="lgGo(\''+k+'\')" style="cursor:pointer;font-size:13px;font-weight:800;padding:4px 12px;border-radius:14px;border:2px solid '+col+';background:'+(on?col:'#fff')+';color:'+(on?'#fff':col)+'">'+esc(cap(k))+'</span>'; }).join('')+'</div>'
    +'<div style="display:flex;flex-wrap:wrap;align-items:center;gap:6px 10px;margin-bottom:4px"><span style="display:inline-flex;align-items:center;gap:6px">'+(lgWeek?arrow('‹',-(t+2),last):arrow('‹',lgOff-1,lgOff<=lo))+'<b style="font-size:13px;min-width:92px;text-align:center">'+when+'</b>'+(lgWeek?arrow('›',0,!last):arrow('›',lgOff+1,lgOff>=0))+'</span>'
    +'<span style="display:inline-flex;gap:5px">'+chip(!lgWeek&&lgOff===0,'Today',"lgGo('',0,0)")+chip(!lgWeek&&lgOff===-1,'Yesterday',"lgGo('',-1,0)")+chip(lgWeek,'This week',"lgGo('',"+(lgWeek?lgOff:0)+",1)")+'</span></div>';
  if(lgHelloOpen()) h+='<div style="position:relative;margin:8px 0 4px;padding:10px 34px 10px 12px;background:#fffbeb;border:1.5px solid #fde68a;border-radius:12px;font-size:12.5px;line-height:1.5;color:#44403c">'
    +'<button onclick="lgHelloClose()" title="Close for good" style="position:absolute;top:6px;right:6px;border:none;background:none;font-size:14px;cursor:pointer;color:#78716c">✕</button>'
    +'<b>📒 This is everything on '+esc(cap(kid))+'\'s lists '+(lgWeek?'this week':lgOff===0?'today':'that day')+'.</b><br>✅ done · ○ not done yet · ⏳ still on the list from an earlier day (it pays a little less each day) · ✖ gone from the list (not done in time).<br>'
    +'The line on top adds up the stars.'+((typeof hcGoMom==="function"&&hcGoMom())?' To change how a chore works, tap its name.':'')+(typeof lgRulesHello==="function"?lgRulesHello():'')+'</div>';
  h+=lgWeek?lgWeekHTML(kid):lgDayHTML(kid,lgOff);
  if(typeof lgDadTip==="function") h+=lgDadTip();   // DADGATE: a locked Dad's one line
  return h+'</div></div>'; }
function lgDraw(){ lgClose(); document.body.insertAdjacentHTML("beforeend",lgHTML()); }
function lgClose(){ const o=document.getElementById("lg-pop"); if(o) o.remove(); }
// Open: on today, on the kid looked at last (the first kid the first time). Mom mode or Dad's own link only.
function lgShow(){ if(!((typeof momHere==="function"&&momHere())||(typeof _kioskD==="function"&&_kioskD()))) return; if(SL_KIDS.indexOf(lgKid)<0) lgKid=SL_KIDS[0]; lgOff=0; lgWeek=false; lgDraw(); }
function lgGo(kid,k,w){ if(kid&&SL_KIDS.indexOf(kid)>=0) lgKid=kid; if(k!=null) lgOff=Math.max(lgMin(),Math.min(0,k)); if(w!=null) lgWeek=!!w; lgDraw(); }
// LEDGERVIEW_END
// LEDGERGB_START — ⭐ Give stars back on a 📒 Ledger row (DESIGN_chore_ledger_2026-11-21 §3, slice L2; her "go" 2026-11-21). Her words
// 11/21: "adjust if there was mistakes and say like, no, let's don't take that away for this one". A row whose tick paid less than the
// chore's stars because it was late (CHOREFALL: "paid 6 of 10 ⭐ · due Tue") gets one button. One tap pays the missing stars as ONE plus
// line in that kid's Star Bank ("⭐ Mom gave back: 🧹 Vacuum the den", +4). The row still reads as late; only the stars change. The same
// spot then says what was given and offers Undo, which removes that line. Mom mode or Dad's own link only (the pop-up's own gate).
// The line has a FIXED name, lgb_<the tick's check-off key> (bank/<kid>/adjustments/lgb_<wk>_<day>_<kid>_<a|c|e>step<i>): one per kid,
// chore and day, so a second tap or a second device writes the same line, never a second one, and an un-tick on a list finds it
// (toggleRtStep, LEDGERGB line in index.html: the un-tick removes it with the tick's own pay). Written only when db && !_dryRun().
// Only a ticked row the falling-stars rule paid less: a list that carries (never Morning), a weekday chore done after its day, its due
// day on or after RT_FALL_FROM, stars above 0, paid below them, not a plan row, not held or turned down (lgRow returns those earlier).
function lgGbId(wk,dn,kid,slot,i){ return "lgb_"+wk+"_"+dn+"_"+kid+"_"+RT_ABBR[slot]+"step"+i; }
function lgGbLine(kid,id){ return (bank[kid]&&bank[kid].adjustments&&bank[kid].adjustments[id])||null; }
// DADGATE (her answer 2026-11-24: "Yes, ask for code"): Dad's own link gives stars back and undoes it only with his code in (dadAwardOk),
// the same gate as ➖ Excuse and ⚙ Star rules. Kept as its own copy: each block's test takes the others out. Locked, he sees the
// rows and every "given back" note, no button, and one line at the foot of the pop-up says how to get them (lgDadTip).
function lgGbOk(){ return (typeof momHere==="function"&&momHere())||(typeof _kioskD==="function"&&_kioskD()&&typeof dadAwardOk==="function"&&dadAwardOk()); }
function lgDadTip(){ return (typeof momHere==="function"&&momHere())||!(typeof _kioskD==="function"&&_kioskD())||(typeof dadAwardOk==="function"&&dadAwardOk())?'':'<div style="margin-top:10px;font-size:12px;color:#6b7280">🔒 Put your code in under Star controls to give stars back or excuse a chore.</div>'; }
function lgGbRow(r,slot,kid,D,i,st,E,p,full){
  if(!(r.sh>0)||!(p<full)||!E||!(E.iso>=RT_FALL_FROM)||st.house||!RT_ABBR[slot]) return;
  const id=lgGbId(D.wk,D.dn,kid,slot,i), a=lgGbLine(kid,id), js="('"+kid+"','"+D.wk+"','"+D.dn+"','"+slot+"',"+i+")", ok=lgGbOk();
  r.gbI=i; r.gbId=id; r.gbAmt=r.sh;
  const bs='border:1.5px solid #f59e0b;background:#fffbeb;color:#92400e;border-radius:8px;padding:2px 9px;font-size:11.5px;font-weight:800;cursor:pointer;white-space:nowrap';
  if(a){ r.gb=a.amount||0; r.sh=Math.max(0,r.sh-r.gb);
    r.gbH='<span style="display:inline-flex;align-items:center;gap:6px;white-space:nowrap"><span style="font-size:11.5px;font-weight:800;color:#b45309">⭐ '+(a.by==="dad"?"Dad":"Mom")+' gave back +'+lgStar(r.gb)+'</span>'+(ok?'<button onclick="lgGiveUndo'+js+'" style="border:1.5px solid var(--border);background:#fff;color:#374151;border-radius:8px;padding:2px 9px;font-size:11.5px;font-weight:700;cursor:pointer">Undo</button>':'')+'</span>'; }
  else if(ok) r.gbH='<button onclick="lgGive'+js+'" title="Pay the '+r.sh+' ⭐ this late tick did not pay. It still counts as late." style="'+bs+'">⭐ Give stars back</button>'; }
// The ledger's own row for that tick, read again now (never trusted from the drawing): {r} or null
function lgGbFind(kid,wk,dn,slot,i){
  for(let k=0;k>=lgMin();k--){ const D=lgDay(k); if(!D||D.wk!==wk||D.dn!==dn) continue; const x=lgDayData(kid,k); if(!x.lists) return null;
    for(const L of x.lists){ if(L.slot!==slot) continue; for(const r of L.rows) if(r.gbI===i) return r; }
    return null; }
  return null; }
function lgGbDone(){ if(typeof renderAll==="function"){ try{ renderAll(); }catch(e){} } if(document.getElementById("lg-pop")) lgDraw(); }
function lgGive(kid,wk,dn,slot,i){
  if(!lgGbOk()) return false;
  const r=lgGbFind(kid,wk,dn,slot,i);
  if(!r||!r.gbId||lgGbLine(kid,r.gbId)||!(r.gbAmt>0)){ lgGbDone(); return false; }   // already given (this device or another), or no longer short
  const by=(typeof momHere==="function"&&momHere())?"mom":"dad";
  const rec={amount:r.gbAmt,note:"⭐ "+(by==="dad"?"Dad":"Mom")+" gave back: "+r.nm,ts:nowTs(),iso:new Date().toISOString(),src:"earn",wk:wk,day:dn,by:by};
  bank[kid]=bank[kid]||{}; bank[kid].adjustments=bank[kid].adjustments||{}; bank[kid].adjustments[r.gbId]=rec;
  if(db&&!_dryRun()) obSet("bank/"+kid+"/adjustments/"+r.gbId,rec,null);
  lgGbDone(); return true; }
function lgGiveUndo(kid,wk,dn,slot,i){
  if(!lgGbOk()||!RT_ABBR[slot]) return false;
  const id=lgGbId(wk,dn,kid,slot,i), a=lgGbLine(kid,id); if(!a){ lgGbDone(); return false; }
  delete bank[kid].adjustments[id];
  if(db&&!_dryRun()) obRemove("bank/"+kid+"/adjustments/"+id,a);
  lgGbDone(); return true; }
// LEDGERGB_END
// LEDGERX_START — ➖ Excuse on a 📒 Ledger row, and its Undo (DESIGN_chore_ledger_2026-11-21 §3, slice L3; her "go" 2026-11-22). Her
// words 11/21: "no, let's don't take that away for this one"; her rule: "merge in things and not repeat things" — so Excuse writes the
// SAME record ✕ today writes (rtWave: waved/<wk>/<day>/<kid>/<slot>step<i> + the Click-off Log's "— waved by Mom" line; a plan row:
// hdSkipToggle, houseDay/<iso>/skip/<id> + lastSkip + the same log line), on the chore's OWN day (the day it was due), never the day of
// the tap. Then the lists' own rules do the rest: a waved due day is not late (rtLateDays → 0), so it no longer waits or falls, files no
// "— not done", and 📊 How often shows it "not counted". ✕ today in the Kids today pop-ups is untouched. Nothing is taken from a bank
// for a chore that was not done (C2: "Nothing is ever taken from a bank here"), so there is nothing to give back yet (the take-away is
// a later slice). Undo = the same rtWave tap again, which removes the record; the row reads as it did.
// On: a row not done on its day (○ today, ✖ an earlier day, whatever became of it after), ⏳ still on the list from an earlier day,
// ✖ gone from the list. Not on: a done, held, 🌅 or already excused row, a turn done late (that is the done row's ⭐ Give stars
// back), last week's 🔄 rows (their turn is not worked out for last week). Undo on every ➖ excused row (✕ today's too: one record).
// Who: Mom, or Dad with his code in (dadAwardOk) — the ✕ today gate, because rtWave and hdSkipToggle refuse anyone else.
// A ⏳ or gone row's record is on an earlier day, so after the tap that row would leave the day on screen; lgXJ keeps it in its spot
// as "➖ excused · due Wed" with Undo on this device until the page reloads (its home is then its own day). Memory only.
const lgXJ={};
function lgXOk(){ const m=typeof momHere==="function"&&momHere(); return m||(typeof _kioskD==="function"&&_kioskD()&&typeof dadAwardOk==="function"&&dadAwardOk()); }   // the pop-up's gate (Mom or Dad's link) and ✕ today's (Mom or Dad unlocked)
function lgXDone(){ if(typeof renderAll==="function"){ try{ renderAll(); }catch(e){} } if(document.getElementById("lg-pop")) lgDraw(); }
function lgXBtn(fn,args,lab,tip){ return '<button onclick="'+fn+'('+args+')"'+(tip?' title="'+tip+'"':'')+' style="border:1.5px solid '+(lab==="Undo"?'var(--border)':'#d1d5db')+';background:#fff;color:'+(lab==="Undo"?'#374151':'#6b7280')+';border-radius:8px;padding:2px 9px;font-size:11.5px;font-weight:'+(lab==="Undo"?700:800)+';cursor:pointer;white-space:nowrap">'+lab+'</button>'; }
function lgXArgs(kid,E,slot,i,here,g){ return "'"+kid+"','"+E.wk+"','"+E.dn+"','"+slot+"',"+i+(here?",'"+here+"'"+(g?",1":""):""); }
function lgXEx(kid,E,slot,i,here,g){ return lgXOk()?lgXBtn("lgExcuse",lgXArgs(kid,E,slot,i,here,g),"➖ Excuse","Not the kid's fault: the same as ✕ today on "+lgWd(E.iso)+". It costs nothing and is not a miss."):''; }
function lgXUn(kid,E,slot,i){ return lgXOk()?lgXBtn("lgExcuseUndo",lgXArgs(kid,E,slot,i),"Undo",""):''; }
// The row as the lists had it on its own day E (the steps of that day, last week's laid for that week), the global day pinned.
function lgXStep(slot,kid,E,i){ const pd=day; day=E.dn; try{ return (E.prev?lgPrevSteps(slot,kid,E):(rtStepsFor(slot,kid,false,E.dn)||[]))[i]||null; } finally{ day=pd; } }
// Can turn i, due on E, be excused? Due that day, not done, not ✕ / 🌅 already, not done late, not a row last week cannot name.
function lgXCan(slot,kid,E,i,st){ if(!st||!E||!lgMap(E)||(E.prev&&(st.rot||st.house))) return false; const pd=day; day=E.dn;
  try{ if(!lgDue(st,E)||lgWaved(slot,kid,E,i)) return false; const r=lgRec(slot,kid,E,i); if(r&&r.done) return false;
    if(typeof amGet==="function"&&amGet(kid,slot,i,E.iso)) return false; const f=E.k<0?lgFate(slot,kid,i,st,E):null; return !(f&&f.done); } finally{ day=pd; } }
// The hook on a list row: Excuse on a not-done row (its own day, or the day a ⏳ row was due), Undo on an excused one.
function lgXRow(r,slot,kid,D,i,st){
  if(!r){ const E=lgXHere(kid,D,slot,i); return E?{ic:"➖",nm:(st.emoji?st.emoji+" ":"")+(st.label||"Chore"),id:st.house||st._hh||"",note:"excused · due "+lgWd(E.iso),xH:lgXUn(kid,E,slot,i)}:r; }
  if(r.ic==="➖"){ r.xH=lgXUn(kid,D,slot,i); return r; }
  if(r.c!==0) return r;
  if(r.ic==="⏳"){ const E=lgDueBefore(st,D), n=(typeof mdLateDays==="function")?mdLateDays(slot,kid,D.dn,i,st):0; if(E&&n>0&&E.k===D.k-n&&lgXCan(slot,kid,E,i,lgXStep(slot,kid,E,i))) r.xH=lgXEx(kid,E,slot,i,D.iso); return r; }
  if(lgXCan(slot,kid,D,i,st)) r.xH=lgXEx(kid,D,slot,i,""); return r; }
// The hook on a "Gone from the list" row (the turn due on E): Excuse, or — excused here just now — "➖ excused" with Undo.
function lgXGone(g,slot,kid,D,E,i,st){
  if(lgWaved(slot,kid,E,i)){ g.ic="➖"; g.note="due "+lgWd(E.iso)+" · excused"; g.xH=lgXUn(kid,E,slot,i); return; }
  if(lgXCan(slot,kid,E,i,lgXStep(slot,kid,E,i))) g.xH=lgXEx(kid,E,slot,i,D.iso,1); }
// This device excused turn i from day D's ⏳ row (no E) or gone row (E: the turn's day) and it is still excused: its day, else null
function lgXHere(kid,D,slot,i,E){ const v=lgXJ[kid+"|"+D.iso+"|"+slot+"|"+i]; if(!v||!v.g!==!E) return null; const T=lgXDay(v.wk,v.dn); if(!T||(E&&(E.wk!==T.wk||E.dn!==T.dn))||!lgWaved(slot,kid,T,i)) return null; return T; }
function lgXDay(wk,dn){ for(let k=0;k>=lgMin();k--){ const D=lgDay(k); if(D&&D.wk===wk&&D.dn===dn) return D; } return null; }
function lgXArgOk(kid,slot,i){ return SL_KIDS.indexOf(kid)>=0&&SL_SLOTS.indexOf(slot)>=0&&i===(i|0)&&i>=0; }
// LEDGERXLOG_START — her answer 2026-11-22 to the L3 report's question 1 ("fix"): a turn that already left the list has its "— not done"
// line in the Click-off Log (_rtLogLateMiss → _rtLogMiss: routineLog/<kid>/<wk>/<due day>/miss_<slot>_<i>, filed the morning it left).
// Excuse takes that line out, so the log does not show both "— not done" and "— waved by Mom" for one turn; Undo puts it back through
// _rtLogMiss itself (the same key, words, list, act and stars; only its time is the Undo's), when the turn is one that left the list by
// today (lgFate: gone) — so it comes back the same on another device or after a reload. Nothing else reads the line for stars; while
// the turn is excused no device files it again (_rtLogLateMiss skips a waved due day). The ✕ record is untouched. Plan rows (st.house,
// their own miss_h_ lines) are not in this. Writes only when db && !_dryRun().
function lgXMissOff(kid,E,slot,i){ const L=((routineLog[kid]||{})[E.wk]||{})[E.dn], k="miss_"+slot+"_"+i; if(!L||!L[k]) return; delete L[k];
  if(typeof db!=="undefined"&&db&&!_dryRun()) db.ref("routineLog/"+kid+"/"+E.wk+"/"+E.dn+"/"+k).remove(); }
function lgXMissOn(kid,E,slot,i,st){ const pd=day; let f=null; day=E.dn; try{ f=lgFate(slot,kid,i,st,E); } finally{ day=pd; }
  if(f&&f.gone&&typeof _rtLogMiss==="function") _rtLogMiss(kid,slot,i,E.dn,st.label,st.pts||0,E.wk); }
// LEDGERXLOG_END
// The tap. The turn is read again now (never trusted from the drawing); the write is rtWave's, the ✕ today record, on its own day.
function lgExcuse(kid,wk,dn,slot,i,here,g){
  if(!lgXOk()||!lgXArgOk(kid,slot,i)) return false; const E=lgXDay(wk,dn), st=E&&lgXStep(slot,kid,E,i);
  if(!lgXCan(slot,kid,E,i,st)){ lgXDone(); return false; }   // done, excused already (this device or another), or not a row that can be
  rtWave(slot,kid,E.dn,i,E.wk,st); const on=lgWaved(slot,kid,E,i);
  if(on&&!st.house&&typeof lgDropOff==="function") lgDropOff(kid,E,slot,i);   // LEDGERDROP: anything the drop took goes back, kept for Undo
  if(on&&!st.house) lgXMissOff(kid,E,slot,i);   // LEDGERXLOG: its "— not done" line out
  if(on&&here&&here!==E.iso) lgXJ[kid+"|"+here+"|"+slot+"|"+i]={wk:E.wk,dn:E.dn,g:g?1:0};
  lgXDone(); return on; }
function lgExcuseUndo(kid,wk,dn,slot,i){
  if(!lgXOk()||!lgXArgOk(kid,slot,i)) return false; const E=lgXDay(wk,dn), st=E&&lgXStep(slot,kid,E,i);
  if(!E||!st||!lgMap(E)||!lgWaved(slot,kid,E,i)){ lgXDone(); return false; }
  if(!st.house&&typeof lgDropKept==="function"){ const kp=lgDropKept(kid,E,slot,i); if(kp) lgDropOn(kid,E,slot,i,kp); }   // LEDGERDROP: what Excuse kept goes back exactly, BEFORE the ✕ record goes (no device files it afresh in between, and the filing below then finds the line there)
  rtWave(slot,kid,E.dn,i,E.wk,st); const off=!lgWaved(slot,kid,E,i);
  if(off&&!st.house) lgXMissOn(kid,E,slot,i,st);   // LEDGERXLOG: and back
  if(off) Object.keys(lgXJ).forEach(function(k){ const v=lgXJ[k]; if(v.wk===E.wk&&v.dn===E.dn&&k.split("|")[0]===kid&&k.split("|").slice(2).join("|")===slot+"|"+i) delete lgXJ[k]; });
  lgXDone(); return off; }
// LEDGERX_END
// LEDGERRULES_START — ⚙ the star rules in the 📒 Ledger pop-up (DESIGN_chore_ledger_2026-11-21 §4, slice L4; her "Yes, start it"
// 2026-11-23). Her words: "have a setting for each kid where, okay, we're not actually doing deductions from them right now"; "Stars fall
// when late" = "Yes, per kid"; "⏸ Pause for everyone" = "Yes, one switch"; the star rules live here and nowhere else; the panel is Mom's
// (and, since DADCTL below, Dad's with his code in; a locked Dad's link gets no ⚙, only the ⏸ banner). index.html STARRULES reads them on every device, kid tablets too
// (household/ is already listened to at boot): starFallFrom → rtFallDays; starTakeOk → the 🔎 Spot check's extra stars, the Click-off
// Log's ⚠️ −100 and 🧾 Today's check-offs' −100 (each refuses and says why). "A flip never reaches back":
//   Stars fall when late OFF → fall/<kid> = {on:false}: from now a late chore pays its full stars for that kid (rows already waiting too).
//   …ON again → fall/<kid> = {from:<today>}: only turns due from today fall.
//   Take stars away OFF → take/<kid> = false: those three take nothing from that kid. ON → take/<kid> removed (as before).
//   ⏸ Pause ON → pause = {on:true}: nothing falls and nothing is taken for anyone; a banner on the ledger. OFF → pause = {from:<today>}.
// A turn falls only if due on or after the latest of RT_FALL_FROM, the kid's {from} and the pause's {from}. What was paid stays: a tick
// stores what it paid (toggleRtStep) and the ledger's ✅ rows and ⭐ Give stars back read that stored amount, never today's switches.
// The two settings that stay where they are ("Leave them until I say") are lines here, not switches: the penalty (settings/spotCheck/
// penalty, the Spot check card's ⚙) and Mom checks before pay (config/choreVerify, Chores & Stars ▸ Points); each "›" goes there.
// One small path per tap under household/meta/starRules, through db only when db && !_dryRun(), Mom only (momHere).
// DADCTL (her words 2026-11-23: "dad will need to be able to deduct and check off etc too"): Dad on his own link WITH his code in
// (_kioskD() && dadAwardOk(), the ➖ Excuse / ✕ today gate) gets the same ⚙ and the same switches, the same one write per tap; a fall or
// pause object he writes carries by:"dad" (take/<kid> stays a bare false, the shape every device reads). Locked Dad, a kid: as before.
// The two "›" lines stay Mom's (their homes are Mom's pages): for Dad they are plain text.
let lgRulesOpen=false;
function lgRulesMom(){ return typeof momHere==="function"&&momHere(); }
function lgRulesOk(){ return lgRulesMom()||(typeof _kioskD==="function"&&_kioskD()&&typeof dadAwardOk==="function"&&dadAwardOk()); }
function lgRBy(v){ if(!lgRulesMom()) v.by="dad"; return v; }
function lgRToday(){ const t=new Date(); return t.getFullYear()+"-"+String(t.getMonth()+1).padStart(2,"0")+"-"+String(t.getDate()).padStart(2,"0"); }
function lgRFallOn(kid){ return ((starRules().fall||{})[kid]||{}).on!==false; }
function lgRTakeOn(kid){ return (starRules().take||{})[kid]!==false; }
function lgRPaused(){ return !!(starRules().pause||{}).on; }
// one small path: this device at once (dryrun too, so the screen answers), the database when it may
function lgRWrite(rel,v){
  if(!householdData.meta) householdData.meta={}; const R=householdData.meta.starRules=householdData.meta.starRules||{}, p=rel.split("/");
  const o=p.length>1?(R[p[0]]=R[p[0]]||{}):R, k=p[p.length-1]; if(v==null) delete o[k]; else o[k]=v;
  if(typeof db!=="undefined"&&db&&!_dryRun()){ const r=db.ref("household/meta/starRules/"+rel); if(v==null) r.remove(); else r.set(v); }
  if(typeof renderAll==="function"){ try{ renderAll(); }catch(e){} } if(document.getElementById("lg-pop")) lgDraw(); return true; }
function lgRKid(kid){ return SL_KIDS.indexOf(kid)>=0; }
function lgRuleFall(kid){ if(!lgRulesOk()||!lgRKid(kid)) return false; return lgRWrite("fall/"+kid,lgRBy(lgRFallOn(kid)?{on:false}:{from:lgRToday()})); }
function lgRuleTake(kid){ if(!lgRulesOk()||!lgRKid(kid)) return false; return lgRWrite("take/"+kid,lgRTakeOn(kid)?false:lgRBy({from:lgRToday()})); }   // LEDGERDROP (C3): On again starts clean — a turn due before today costs nothing (an object, so Dad's carries by:"dad")
function lgRulePause(){ if(!lgRulesOk()) return false; return lgRWrite("pause",lgRBy(lgRPaused()?{from:lgRToday()}:{on:true})); }
function lgRulesToggle(){ if(!lgRulesOk()) return; lgRulesOpen=!lgRulesOpen; lgDraw(); }
// ── drawing ──
function lgRSw(on,js,lab){ return '<button onclick="'+js+'" role="switch" aria-checked="'+on+'" aria-label="'+esc(lab)+'" style="display:inline-flex;align-items:center;gap:6px;border:none;background:none;padding:2px 0;cursor:pointer;font-size:12px;font-weight:800;color:'+(on?'#166534':'#6b7280')+'">'
  +'<span style="width:34px;height:20px;border-radius:10px;background:'+(on?'#16a34a':'#cbd5e1')+';position:relative;flex-shrink:0"><span style="position:absolute;top:2px;left:'+(on?16:2)+'px;width:16px;height:16px;border-radius:50%;background:#fff"></span></span>'+(on?'On':'Off')+'</button>'; }
function lgRLine(t,where,js){ const m=lgRulesMom(); return '<div'+(m?' onclick="'+js+'" style="cursor:pointer;padding:4px 0"':' style="padding:4px 0"')+'><b>'+esc(t)+(m?' ›':'')+'</b><span style="display:block;color:#6b7280;font-size:11px">'+esc(where)+'</span></div>'; }
function lgRulesHTML(){
  const P=lgRPaused(), pen=(typeof spPenalty==="function")?spPenalty():{on:false}, cv=((typeof ROSTER!=="undefined"&&ROSTER)||SL_KIDS).filter(function(k){ return typeof choreVerifyOn==="function"&&choreVerifyOn(k); }).map(lgName);
  const sub='color:#6b7280;font-size:11.5px', sep='border-top:1px solid #e2e8f0;padding:7px 0';
  let h='<div id="lg-rules" style="margin:0 0 10px;padding:10px 12px;background:#f8fafc;border:1.5px solid #cbd5e1;border-radius:12px;font-size:12.5px;color:#1f2937">'
    +'<div style="display:flex;align-items:center;gap:8px"><b style="font-size:14px;flex:1">⚙ Star rules</b><button onclick="lgRulesToggle()" style="border:1.5px solid var(--border);background:#fff;border-radius:8px;padding:2px 10px;font-size:12px;font-weight:700;cursor:pointer">Done</button></div>'
    +'<div style="'+sub+';margin:2px 0 8px">A change counts from now on. Stars already paid or taken stay as they are.</div>'
    +'<div style="display:flex;align-items:center;gap:6px 10px;flex-wrap:wrap;'+sep+'"><span style="flex:1 1 200px"><b>⏸ Pause for everyone</b><span style="display:block;'+sub+'">On: no stars fall and none are taken, for every kid.</span></span>'+lgRSw(P,"lgRulePause()","Pause for everyone")+'</div>'
    +'<div style="'+sep+(P?';opacity:.55':'')+'">';
  SL_KIDS.forEach(function(k){ h+='<div style="display:flex;flex-wrap:wrap;align-items:center;gap:4px 16px;padding:4px 0"><b style="flex:0 0 72px;color:'+(SL_KCOL[k]||'#111827')+'">'+esc(lgName(k))+'</b>'
    +'<span style="display:inline-flex;align-items:center;gap:6px">Stars fall when late '+lgRSw(lgRFallOn(k),"lgRuleFall('"+k+"')","Stars fall when late for "+lgName(k))+'</span>'
    +'<span style="display:inline-flex;align-items:center;gap:6px">Take stars away '+lgRSw(lgRTakeOn(k),"lgRuleTake('"+k+"')","Take stars away for "+lgName(k))+'</span></div>'; });
  if(P) h+='<div style="font-size:11.5px;font-weight:700;color:#92400e;padding-top:2px">Paused: these count again when you turn ⏸ off.</div>';
  h+='<div style="'+sub+';margin-top:4px"><b>Stars fall when late:</b> a chore done after its day pays a little less each day. Off: it pays its full stars.<br>'
    +'<b>Take stars away:</b> the 🔎 Spot check\'s extra stars, and the −100 on the Click-off Log and on 🧾 Today\'s check-offs. Off: they take nothing from that kid.</div></div>'
    +'<div style="'+sep+'">'+lgRLine("Penalty: "+(pen.on?pen.pts+" ⭐":"off"),"Changed on the 🔎 Spot check card's ⚙ (its ✗ Not done). The −100 on the Click-off Log and 🧾 is always 100.","lgRulesGoSpot()")
    +lgRLine("Mom checks before pay: "+(cv.length?"on for "+cv.join(", "):"off"),"Changed in Chores & Stars ▸ Points.","lgRulesGoPoints()")+'</div>';
  return h+'</div>'; }
// the pop-up's hooks (LEDGERVIEW): the ⚙ in the header, the panel and the ⏸ banner above the kids, one sentence on the first-minute card
function lgRulesBtn(){ return lgRulesOk()?'<button onclick="lgRulesToggle()" title="To change the star rules, tap ⚙" aria-label="Star rules" style="border:none;background:'+(lgRulesOpen?'#e2e8f0':'#f3f4f6')+';border-radius:8px;padding:4px 10px;font-size:13px;cursor:pointer">⚙</button>':''; }
function lgRulesTop(){ const ok=lgRulesOk(); return (ok&&lgRulesOpen?lgRulesHTML():'')+(lgRPaused()?'<div style="margin:0 0 8px;padding:8px 12px;background:#fef3c7;border:1.5px solid #fcd34d;border-radius:10px;font-size:12.5px;font-weight:700;color:#92400e">⏸ Star rules are paused for everyone: no stars fall and none are taken.'+(ok&&!lgRulesOpen?' Tap ⚙ to change.':'')+'</div>':''); }
function lgRulesHello(){ return lgRulesOk()?' To change the star rules, tap ⚙.':''; }
// each "›" goes to where that setting is changed today
function lgRulesGoSpot(){ if(!lgRulesMom()) return false; lgClose(); lgRulesOpen=false; spSetOpen=true; if(typeof _cuRe==="function") _cuRe(); if(typeof _spScroll==="function") _spScroll(); return true; }
function lgRulesGoPoints(){ if(!lgRulesMom()) return false; lgClose(); lgRulesOpen=false; cpTab="points"; if(cpSlot==="grabs") cpSlot="chores"; setAdminSub("chores"); return true; }
// LEDGERRULES_END
// LEDGERDROP_START — what a dropped turn took, on its 📒 Ledger row (missed-chores design §2.4 and §4, slice C3; ledger design §2 and §3;
// the hub's brief 2026-11-23). index.html CHOREDROP files the drop's decision on its "— not done" line (routineLog/<kid>/<wk>/<due day>/
// miss_<slot>_<i>, .drop = {n, bid, due, job} or {n:0, why}) and writes the one bank line. Here, Mom or Dad (the ledger's gate):
//   the "Gone from her list" row: "✖ Vacuum the den · due Tue, not done in time · 2 ⭐ taken" with ⭐ Give stars back (Mom, or Dad's link: the same gate as the late tick's), and
//   "taken 2 ⭐" in that day's line on top. Give stars back = ONE multi-path update: the bank line removed + drop.gb = {by, ts, line: the
//   removed line} on the log line, so no device ever takes it again (the line is never filed twice) and Undo puts back that exact line.
//   ➖ Excuse on that row also gives back what was taken: before its "— not done" line goes, that line and the bank line
//   are kept on the ✕ record (waved/<wk>/<day>/<kid>/<slot>step<i>/c3) and the bank line removed; its Undo puts both back exactly,
//   before the ✕ record is removed. "↩ Put back" is left out (ledger design §3). Writes only when db && !_dryRun().
//   📊 How often: a ○ whose drop took stars reads "○ −2", or "○ given back" (hoDrop, from the same lines).
function lgDropOk(){ return (typeof momHere==="function"&&momHere())||(typeof _kioskD==="function"&&_kioskD()&&typeof dadAwardOk==="function"&&dadAwardOk()); }   // Mom, or Dad on his own link WITH his code in (➖ Excuse's gate) — her answer 2026-11-24 "Yes, ask for code": a kid holding a locked Dad device sees the row, not the buttons
function lgDropLine(kid,id){ return (id&&bank[kid]&&bank[kid].adjustments&&bank[kid].adjustments[id])||null; }
function lgDropDone(){ if(typeof renderAll==="function"){ try{ renderAll(); }catch(e){} } if(document.getElementById("lg-pop")) lgDraw(); }
function lgDropDay(wk,dn){ for(let k=0;k>=lgMin();k--){ const D=lgDay(k); if(D&&D.wk===wk&&D.dn===dn) return D; } return null; }
function lgDropArg(kid,slot,i){ return SL_KIDS.indexOf(kid)>=0&&!!RT_ABBR[slot]&&i===(i|0)&&i>=0; }
function lgDropKey(slot,i){ return "miss_"+slot+"_"+i; }
function lgDropLog(kid,E,slot,i){ return (((routineLog[kid]||{})[E.wk]||{})[E.dn]||{})[lgDropKey(slot,i)]||null; }
function lgDropOf(kid,E,slot,i){ const L=lgDropLog(kid,E,slot,i), t=L&&L.drop; return t?{t:t,line:t.bid?lgDropLine(kid,t.bid):null}:null; }
function lgDropPath(kid,E,slot,i){ return "routineLog/"+kid+"/"+E.wk+"/"+E.dn+"/"+lgDropKey(slot,i); }
function lgDropUp(u){ if(typeof db!=="undefined"&&db&&!_dryRun()) db.ref().update(u); }
// the gone rows this list added (from g0), matched to their steps in the order lgDayData walked them
function lgDropGones(G,g0,slot,kid,D,steps){ let q=g0; steps.forEach(function(st,i){ if(q>=G.length||!st||st.house||!/^wk:/.test(st.cad||"")||G[q].nm!==(st.emoji?st.emoji+" ":"")+(st.label||"Chore")) return; const E=lgDueBefore(st,D); if(E) lgDropGone(G[q],slot,kid,E,i); q++; }); }
function lgDropGone(g,slot,kid,E,i){
  const x=g.ic==="✖"?lgDropOf(kid,E,slot,i):null; if(!x) return; const t=x.t, ok=lgDropOk(), js="('"+kid+"','"+E.wk+"','"+E.dn+"','"+slot+"',"+i+")";
  if(!t.n){ if(t.why!=="zero") g.note+=" · nothing taken ("+(t.why==="away"?"a day off in its wait":t.why==="pause"?"⏸ paused":"Take stars away was off")+")"; return; }
  g.note+=" · "+lgStar(t.n)+" taken";
  if(t.gb){ g.gbH='<span style="display:inline-flex;align-items:center;gap:6px;white-space:nowrap"><span style="font-size:11.5px;font-weight:800;color:#b45309">⭐ '+(t.gb.by==="dad"?"Dad":"Mom")+' gave back +'+lgStar(t.n)+'</span>'+(ok?'<button onclick="lgDropUndo'+js+'" style="border:1.5px solid var(--border);background:#fff;color:#374151;border-radius:8px;padding:2px 9px;font-size:11.5px;font-weight:700;cursor:pointer">Undo</button>':'')+'</span>'; return; }
  if(!x.line){ g.note+=", not in the Star Bank now"; return; }
  g.tk=t.n; if(ok) g.gbH='<button onclick="lgDropGive'+js+'" title="Put back the '+t.n+' ⭐ this drop took. It still counts as not done." style="border:1.5px solid #f59e0b;background:#fffbeb;color:#92400e;border-radius:8px;padding:2px 9px;font-size:11.5px;font-weight:800;cursor:pointer;white-space:nowrap">⭐ Give stars back</button>'; }
// The taps: the turn is read again now (never trusted from the drawing).
function lgDropGive(kid,wk,dn,slot,i){
  if(!lgDropOk()||!lgDropArg(kid,slot,i)) return false; const E=lgDropDay(wk,dn), x=E&&lgDropOf(kid,E,slot,i);
  if(!x||!(x.t.n>0)||x.t.gb||!x.line){ lgDropDone(); return false; }   // nothing taken, given back already (here or on another device), or not in the bank
  const gb={by:(typeof momHere==="function"&&momHere())?"mom":"dad",ts:nowTs(),at:Date.now(),line:x.line}, u={};
  x.t.gb=gb; delete bank[kid].adjustments[x.t.bid];
  u[lgDropPath(kid,E,slot,i)+"/drop/gb"]=gb; u["bank/"+kid+"/adjustments/"+x.t.bid]=null; lgDropUp(u);
  lgDropDone(); return true; }
function lgDropUndo(kid,wk,dn,slot,i){
  if(!lgDropOk()||!lgDropArg(kid,slot,i)) return false; const E=lgDropDay(wk,dn), x=E&&lgDropOf(kid,E,slot,i), gb=x&&x.t.gb;
  if(!gb||!gb.line||x.line){ lgDropDone(); return false; }
  const u={}; delete x.t.gb; bank[kid]=bank[kid]||{}; bank[kid].adjustments=bank[kid].adjustments||{}; bank[kid].adjustments[x.t.bid]=gb.line;
  u[lgDropPath(kid,E,slot,i)+"/drop/gb"]=null; u["bank/"+kid+"/adjustments/"+x.t.bid]=gb.line; lgDropUp(u);
  lgDropDone(); return true; }
// ➖ Excuse : keep the drop's line and its bank line on the ✕ record and give the stars back; Undo: both back exactly.
function lgDropOff(kid,E,slot,i){ const L=lgDropLog(kid,E,slot,i); if(!L||!L.drop) return;
  const t=L.drop, ln=t.bid?lgDropLine(kid,t.bid):null, kp={log:JSON.parse(JSON.stringify(L))}, k=rtWaveKey(slot,i), w=(((wavedData[E.wk]||{})[E.dn]||{})[kid]||{})[k], u={};
  if(ln) kp.line=ln; if(w) w.c3=kp; if(ln) delete bank[kid].adjustments[t.bid];
  u["waved/"+E.wk+"/"+E.dn+"/"+kid+"/"+k+"/c3"]=kp; if(ln) u["bank/"+kid+"/adjustments/"+t.bid]=null; lgDropUp(u); }
function lgDropKept(kid,E,slot,i){ const w=(((wavedData[E.wk]||{})[E.dn]||{})[kid]||{})[rtWaveKey(slot,i)]; return (w&&w.c3&&w.c3.log)?w.c3:null; }
function lgDropOn(kid,E,slot,i,kp){ const k=lgDropKey(slot,i), bid=kp.log.drop&&kp.log.drop.bid, u={};
  routineLog[kid]=routineLog[kid]||{}; routineLog[kid][E.wk]=routineLog[kid][E.wk]||{}; routineLog[kid][E.wk][E.dn]=routineLog[kid][E.wk][E.dn]||{}; routineLog[kid][E.wk][E.dn][k]=kp.log;
  if(kp.line&&bid){ bank[kid]=bank[kid]||{}; bank[kid].adjustments=bank[kid].adjustments||{}; bank[kid].adjustments[bid]=kp.line; u["bank/"+kid+"/adjustments/"+bid]=kp.line; }
  u[lgDropPath(kid,E,slot,i)]=kp.log; lgDropUp(u); }
// 📊 How often : the drop of chore id due on day number n → {n, gb} when it took stars, from the drops' own lines
function hoDrop(X,id,n){ if(!X.dr){ X.dr={}; Object.keys(routineLog||{}).forEach(function(k){ const L=routineLog[k]||{}; Object.keys(L).forEach(function(w){ Object.keys(L[w]||{}).forEach(function(d){ const D=L[w][d]||{};
    Object.keys(D).forEach(function(q){ const t=D[q]&&D[q].drop; if(t&&t.n>0&&t.due&&t.job) X.dr[t.job+"|"+t.due]={n:t.n,gb:!!t.gb}; }); }); }); }); }
  return X.dr[id+"|"+_hhIsoOf(n)]||null; }
// LEDGERDROP_END
// LEDGERAMZ_START — a 🌅 row sent as "they ignored it" (missed-chores design §2.5, slice C4; ledger design §2–§3), on its 📒 Ledger rows.
// index.html CHOREAMWHY files each day it costs after 0 on its own line (routineLog/<kid>/<wk>/<day>/amz_<carry id>, .amz = {n, bid,
// id, day} or {n:0, why}) and writes that day's one bank line. Here, on the carry's row of that morning: "· 2 ⭐ taken this morning"
// with ⭐ Give stars back (ONE update: the bank line removed + amz.gb = {by, ts, at, line}; Undo puts that exact line back) and ➖ Excuse
// (not their fault after all: every line of that carry on this device given back with gb.x, and its why = "notfault", in ONE update;
// its Undo puts every line and "ignored" back). The gate is LEDGERDROP's (Mom, or Dad's link with his code). A line whose carry was
// taken off the list keeps a row of its own. Writes only when db && !_dryRun() (lgDropUp).
function lgAmzBtn(fn,args,lab,tip){ const u=lab==="Undo"; return '<button onclick="'+fn+'('+args+')"'+(tip?' title="'+tip+'"':'')+' style="border:1.5px solid '+(u?'var(--border)':'#d1d5db')+';background:#fff;color:'+(u?'#374151':'#6b7280')+';border-radius:8px;padding:2px 9px;font-size:11.5px;font-weight:'+(u?700:800)+';cursor:pointer;white-space:nowrap">'+lab+'</button>'; }   // the ledger's own button look
function lgAmzLog(kid,wk,dn,id){ return (((routineLog[kid]||{})[wk]||{})[dn]||{})["amz_"+id]||null; }
function lgAmzSent(kid,slot,i,D){ const c=amGet(kid,slot,i,D.iso); if(!c||!amWhyIg(c)) return ""; const f=amPay(kid,c,amIso(_todayDay)); return " · 🙈 they ignored it"+(!c.done&&f<(c.pts||0)?" · pays "+f+" of "+c.pts+" ⭐ today":""); }
function lgAmzRow(g,kid,D,it){
  if(g.c===0&&amWhyIg(it)){ const f=amPay(kid,it,D.iso); g.note+=" · 🙈 ignored"+(f<(it.pts||0)?" · pays "+f+" of "+it.pts+" ⭐":""); }
  const L=lgAmzLog(kid,D.wk,D.dn,it.id); if(L&&L.amz) lgAmzTk(g,kid,D,it.id,L.amz,1); }
function lgAmzTk(g,kid,D,id,t,x){ const ok=lgDropOk(), js="('"+kid+"','"+D.wk+"','"+D.dn+"','"+id+"')", tw=D.k===0?"this morning":"that morning";
  if(!t.n){ g.note+=" · nothing taken "+tw+" ("+(t.why==="away"?"a day off":t.why==="pause"?"⏸ paused":"Take stars away was off")+")"; return; }
  g.note+=" · "+lgStar(t.n)+" taken "+tw;
  if(t.gb){ g.gbH='<span style="display:inline-flex;align-items:center;gap:6px;white-space:nowrap"><span style="font-size:11.5px;font-weight:800;color:#b45309">'+(t.gb.x?'➖ excused · ':'')+'⭐ '+(t.gb.by==="dad"?"Dad":"Mom")+' gave back +'+lgStar(t.n)+'</span>'+(ok?lgAmzBtn(t.gb.x?"lgAmzExUndo":"lgAmzUndo",js.slice(1,-1),"Undo",""):'')+'</span>'; return; }
  if(!lgDropLine(kid,t.bid)){ g.note+=", not in the Star Bank now"; return; }
  g.atk=t.n; if(ok) g.gbH=(x?lgAmzBtn("lgAmzExcuse","'"+kid+"','"+id+"'","➖ Excuse","Not their fault after all: every star this took goes back, and it pays full stars from now on"):'')+' <button onclick="lgAmzGive'+js+'" style="border:1.5px solid #f59e0b;background:#fffbeb;color:#92400e;border-radius:8px;padding:2px 9px;font-size:11.5px;font-weight:800;cursor:pointer;white-space:nowrap">⭐ Give stars back</button>'; }
// the lines of a carry no longer on the list (✕ take off) that day: a row each
function lgAmzLost(rows,kid,D){ const L=((routineLog[kid]||{})[D.wk]||{})[D.dn]||{}, m=(amCarry||{})[kid]||{};
  Object.keys(L).forEach(function(k){ const x=L[k], t=x&&x.amz; if(!t||!/^amz_/.test(k)||m[t.id]) return; const q={ic:"✖",nm:"🌅 "+String(x.label||"").replace(/ — not done$/,""),note:"taken off the list"}; lgAmzTk(q,kid,D,t.id,t,0); rows.push(q); }); }
function lgAmzP(kid,wk,dn,id){ return "routineLog/"+kid+"/"+wk+"/"+dn+"/amz_"+id+"/amz/gb"; }
function lgAmzGive(kid,wk,dn,id){ const L=lgDropOk()&&lgAmzLog(kid,wk,dn,id), t=L&&L.amz, ln=t&&lgDropLine(kid,t.bid);
  if(!ln||!(t.n>0)||t.gb){ lgDropDone(); return false; } const u={}; t.gb={by:momHere()?"mom":"dad",ts:nowTs(),at:Date.now(),line:ln}; delete bank[kid].adjustments[t.bid];
  u[lgAmzP(kid,wk,dn,id)]=t.gb; u["bank/"+kid+"/adjustments/"+t.bid]=null; lgDropUp(u); lgDropDone(); return true; }
function lgAmzUndo(kid,wk,dn,id){ const L=lgDropOk()&&lgAmzLog(kid,wk,dn,id), t=L&&L.amz, gb=t&&t.gb;
  if(!gb||gb.x||!gb.line||lgDropLine(kid,t.bid)){ lgDropDone(); return false; } const u={}; delete t.gb; bank[kid]=bank[kid]||{}; bank[kid].adjustments=bank[kid].adjustments||{}; bank[kid].adjustments[t.bid]=gb.line;
  u[lgAmzP(kid,wk,dn,id)]=null; u["bank/"+kid+"/adjustments/"+t.bid]=gb.line; lgDropUp(u); lgDropDone(); return true; }
// every line of carry id on this device (this week and last): [wk, dn, amz]
function lgAmzAll(kid,id){ const out=[], R=routineLog[kid]||{}; [activeWk(),_prevWkKey()].forEach(function(wk){ Object.keys(R[wk]||{}).forEach(function(dn){ const L=lgAmzLog(kid,wk,dn,id); if(L&&L.amz) out.push([wk,dn,L.amz]); }); }); return out; }
function lgAmzExcuse(kid,id){ const c=lgDropOk()&&amCarry[kid]&&amCarry[kid][id]; if(!c||!amWhyIg(c)){ lgDropDone(); return false; } const u={}, by=momHere()?"mom":"dad";
  lgAmzAll(kid,id).forEach(function(a){ const t=a[2], ln=t.n>0&&!t.gb&&lgDropLine(kid,t.bid); if(!ln) return; t.gb={by:by,ts:nowTs(),at:Date.now(),line:ln,x:1}; delete bank[kid].adjustments[t.bid]; u[lgAmzP(kid,a[0],a[1],id)]=t.gb; u["bank/"+kid+"/adjustments/"+t.bid]=null; });
  c.why="notfault"; u["amCarry/"+kid+"/"+id+"/why"]="notfault"; lgDropUp(u); amOnValue(Object.assign({},amCarry)); lgDropDone(); return true; }
function lgAmzExUndo(kid,wk,dn,id){ const c=lgDropOk()&&amCarry[kid]&&amCarry[kid][id]; if(!c||c.why!=="notfault"){ lgDropDone(); return false; } const u={};
  lgAmzAll(kid,id).forEach(function(a){ const t=a[2], gb=t.gb; if(!gb||!gb.x||!gb.line||lgDropLine(kid,t.bid)) return; delete t.gb; bank[kid]=bank[kid]||{}; bank[kid].adjustments=bank[kid].adjustments||{}; bank[kid].adjustments[t.bid]=gb.line; u[lgAmzP(kid,a[0],a[1],id)]=null; u["bank/"+kid+"/adjustments/"+t.bid]=gb.line; });
  if(!Object.keys(u).length){ lgDropDone(); return false; } c.why="ignored"; u["amCarry/"+kid+"/"+id+"/why"]="ignored"; lgDropUp(u); amOnValue(Object.assign({},amCarry)); lgDropDone(); return true; }
// LEDGERAMZ_END
// HOUSESWITCH_START — 🚪 the real switch and today's stored plan on 👤 By person (Household by room, step 4; DESIGN §4.3 doors, §5 last
// bullet, her yes 2026-11-17). Mom only. ON first PROVES a houseDay save works (houseDay/<today>/hello) and only then writes
// household/meta/engine = {mode:"on", on:<today>} together with each house chore's last-done date filled once from the 8 weeks of
// history the app already has (hhStats), in ONE update. A refused save leaves the switch as it was and says so in plain words.
// OFF writes {mode:"off"} — every list goes back to the old path at once (HOUSEDAY's owner-row marks keep anything done under the
// plan done there). While on: today's plan for the picked person with ✓ marks, → Give to…, ✕ Skip, what fit nobody, 🔁 Re-lay today,
// and the "Re-lay today too / Keep today, start tomorrow" question after a card, limit or list edit. Every write is HOUSEDAY's or one
// targeted path here, through _hhWrite() (inert under ?dryrun=1).
function hpTell(msg){ if(typeof mwToast==="function") try{ mwToast(msg); return; }catch(e){} if(typeof alert==="function") alert(msg); }
function hpLastFill(){ const J=hhJobs(), out={}; Object.keys(J).forEach(function(id){ const j=J[id]; if(!(typeof hdManaged==="function"&&hdManaged(j))||hpIsIso(j.lastDone)) return; let last=null; try{ last=hhStats(j).last; }catch(e){} if(hpIsIso(last)) out[id]=last; }); return out; }
function hpSwitchOn(){
  if(typeof momHere==="function"&&!momHere()) return null; const e=hpEngine(); if(e.mode==="on") return null;
  if(!(typeof hhTakeoverOn==="function"&&hhTakeoverOn())){ hpTell("The plan needs 🏡 Take over on first (the lists have to come from the household table)."); return null; }
  if(typeof rlHistReady==="function"&&!rlHistReady()){ hpTell("The chore history is still loading — try again in a moment."); return null; }
  if(typeof confirm==="function"&&!confirm("Switch the plan ON?\n\nFrom now on the house chores on everyone's lists — the kids', yours and Dad's — come from one plan made each morning, within each person's limit. Health and animal chores stay exactly as they are.\n\nKids set to “school first” see their house chores on the Chores list once school work is done (or at the afternoon hour).\n\nYou can switch it off again here; nothing done is lost or paid twice.")) return null;
  if(!_hhWrite()){ hpTell("Dry run — nothing was switched on."); return null; }
  const t=hpToday(), fill=hpLastFill();
  return db.ref("houseDay/"+t+"/hello").set({at:Date.now(),by:"mom"}).then(function(){
    const rec={mode:"on",on:t}, upd={"household/meta/engine":rec}; Object.keys(fill).forEach(function(id){ upd["household/jobs/"+id+"/lastDone"]=fill[id]; hhJobs()[id].lastDone=fill[id]; });
    householdData.meta=Object.assign({},householdData.meta,{engine:rec}); householdOnValue(householdData);
    return db.ref().update(upd).then(function(){ hpTell("✅ The plan is on. Today's plan is being made now."); hhRender(); return rec; });
  },function(err){ hpTell("The plan was NOT switched on: the database refused to save it. The database rules need one new line that allows “houseDay” (the same as household). Nothing changed. ("+String((err&&err.code)||err)+")"); return null; });
}
function hpSwitchOff(){
  if(typeof momHere==="function"&&!momHere()) return null; const e=hpEngine(); if(e.mode!=="on") return null;
  if(typeof confirm==="function"&&!confirm("Switch the plan OFF?\n\nEveryone's lists go back to their own house chores, as before. Chores already done today stay done.")) return null;
  const rec={mode:"off",on:hpIsIso(e.on)?e.on:hpToday()}; householdData.meta=Object.assign({},householdData.meta,{engine:rec}); householdOnValue(householdData);
  if(_hhWrite()) db.ref("household/meta/engine").set(rec); hhRender(); return rec;
}
function hpGiveSel(t,id,cur){ const can=HouseEng.canOf(hhJobs()[id]||{},hdPeople()); return '<select onchange="hdGive(\''+t+'\',\''+id+'\',this.value);hhRender()" style="padding:2px 4px;border:1.5px solid #e5e7eb;border-radius:7px;font-size:11px;font-family:\'DM Sans\',sans-serif"><option value="">→ Give to…</option>'+can.filter(function(w){ return w!==cur; }).map(function(w){ return '<option value="'+w+'">'+esc(hhWhoName(w))+'</option>'; }).join('')+'</select>'; }
function hpOnHTML(who){
  const mom=(typeof momHere!=="function")||momHere(), mode=hhEngineMode(), t=hpToday();
  if(mode!=="on") return mom?'<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;background:#f0fdf4;border:1.5px dashed #86efac;border-radius:10px;padding:7px 10px;margin-bottom:10px;font-size:11.5px;color:#166534"><span style="flex:1">When you are ready, the plan can run everyone’s house chores for real: one plan each morning, within the limits below.</span>'+_hhBtn("hpSwitchOn()",'🚪 Switch the plan on',true,'#16a34a')+'</div>':'';
  const r=(typeof hdLive==="function")?hdLive(t):null, J=hhJobs(), bad=(typeof _hdBad!=="undefined"&&_hdBad&&_hdBad.iso===t)?_hdBad:null;
  let h='<div style="'+HP_CARD+'"><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding:9px 12px;background:#f0fdf4"><span style="font-size:14px;font-weight:800;flex:1;color:#166534">✅ The plan is on · '+esc(hhWhoName(who))+' today</span>'+(mom&&r?_hhBtn("hdRelay('"+t+"');hhRender()",'🔁 Re-lay today',false,'#2B7A78'):'')+(mom?_hhBtn("hpSwitchOff()",'Switch it off',false,'#64748b'):'')+'</div>';
  if(bad) h+='<div style="padding:7px 12px;background:#fef2f2;color:#991b1b;font-size:12px;font-weight:700">Today’s plan could not be saved (the database said “'+esc(bad.why)+'”), so today’s lists are the old ones. The database rules need a line that allows “houseDay”.</div>';
  if(!r) return h+'<div style="padding:8px 12px 10px;font-size:12px;color:var(--muted)">'+(bad?'':'Today’s plan is being made — the lists show the old chores until it is ready.')+'</div></div>';
  if(mom&&typeof hdAsking==="function"&&hdAsking(t)) h+='<div style="padding:8px 12px;border-top:1px solid #eef2f0;background:#fffbeb"><div style="font-size:12px;font-weight:800;margin-bottom:5px">A chore, a limit or a list changed since today was laid.</div><div style="display:flex;gap:6px;flex-wrap:wrap">'+_hhBtn("hdRelay('"+t+"');hhRender()",'Re-lay today too',true,'#2563eb')+_hhBtn("hdKeep('"+t+"');hhRender()",'Keep today, start tomorrow',false,'#475569')+'</div></div>';
  const ids=Object.keys(r.plan||{}).filter(function(id){ return r.plan[id].who===who&&J[id]; }).sort(function(a,b){ return (r.plan[a].order||0)-(r.plan[b].order||0); });
  const used=ids.reduce(function(a,id){ return a+(r.plan[id].mins||0); },0), lim=(typeof hdLimitOn==="function")?hdLimitOn(who,t):0;
  h+='<div style="display:flex;gap:8px;align-items:center;padding:6px 12px 4px;font-size:11px;color:var(--muted)">'+hpBar(used,lim)+'<span>'+used+' / '+lim+' min</span></div>';
  h+=ids.length?ids.map(function(id){ const x=r.plan[id], j=J[id], sk=!!(r.skip&&r.skip[id]), dn=hdDone(t,id);
    return hpRow(id,j.emoji,j.label,(x.why==="deep"?_hhChip('✨ grown-up turn','#ede9fe','#5b21b6'):'')+(typeof hqPlanNote==="function"?hqChip(hqPlanNote(j,x.late,t)):(x.late>0?_hhChip(x.late+' day'+(x.late===1?'':'s')+' late','#fee2e2','#991b1b'):''))+(x.from?_hhChip('from '+hhWhoName(x.from),'#e0f2fe','#075985'):'')+(sk?_hhChip('skipped','#f3f4f6','#6b7280'):'')+_hhChip(x.mins+' min','#f3f4f6','#475569')
      +(mom&&!dn?'<span onclick="event.stopPropagation()" style="display:flex;gap:4px">'+hpGiveSel(t,id,who)+_hhBtn("hdSkipToggle('"+t+"','"+id+"','"+who+"');hhRender()",sk?'Put back':'✕ Skip',false,'#94a3b8')+'</span>':''),dn); }).join(''):'<div style="padding:3px 12px 6px;font-size:12px;color:var(--muted)">No house chores for them today.</div>';
  const over=Object.keys(r.over||{}).filter(function(id){ return J[id]; });
  if(over.length) h+='<div style="'+HP_HEAD+';border-top:2px solid #fde68a;padding-top:8px">Didn’t fit anyone today ('+over.length+') — first in line tomorrow</div>'+over.map(function(id){ const o=r.over[id], j=J[id], gd=hpGrabDone(t,id); return hpRow(id,j.emoji,j.label,_hhChip(hhWhoName(o.turn)+'’s turn','#f3f4f6','#475569')+_hhChip(o.mins+' min','#f3f4f6','#475569')+hpGrabChip(t,id)+(mom&&!gd?'<span onclick="event.stopPropagation()">'+hpGiveSel(t,id,"")+'</span>':''),gd||undefined); }).join('');
  return h+'<div style="height:6px"></div></div>';
}
// The doors only Mom taps here (DESIGN §4.3), on HOUSEDAY's stored day (index.html).
// → Give to… a chore on today's plan (or one that fit nobody) — only to someone ticked on its card. One plan path (+ the over path).
function hdGive(iso,id,who){ if(!hdMom()) return null; const r=hdLive(iso), j=hhJobs()[id]; if(!r||!j||hdDone(iso,id)) return null;
  if(HouseEng.canOf(j,hdPeople()).indexOf(who)<0) return null; const p=(r.plan||{})[id], o=(r.over||{})[id]; if(!p&&!o) return null;
  const mx=Object.keys(r.plan||{}).filter(function(x){ return r.plan[x].who===who; }).reduce(function(a,x){ return Math.max(a,(r.plan[x].order||0)+1); },0);
  const rec=p?Object.assign({},p,{who:who,order:mx,why:"given"}):{who:who,mins:o.mins,order:mx,why:"given",late:o.late||0,k:o.k,since:o.since}; const from=p?(p.from||p.who):o.turn; if(from&&from!==who) rec.from=from; else delete rec.from;
  const go=function(){ const r=hdLive(iso); if(!r) return; r.plan=Object.assign({},r.plan); r.plan[id]=rec; const upd={}; upd["houseDay/"+iso+"/plan/"+id]=rec; if(o){ r.over=Object.assign({},r.over); delete r.over[id]; upd["houseDay/"+iso+"/over/"+id]=null; }
  _hdM={}; try{ hhMaterialize(); }catch(e){} if(_hdWrite()) db.ref().update(upd); if(typeof renderAll==="function") renderAll(); };
  if(o&&r.grabs&&r.grabs[id]&&typeof hdGrabTakeBack==="function"){ if(r.grabs[id].done) return null; hdGrabTakeBack(iso,id,go); return rec; }   // 🙌 HOUSEOVER: out of Up for Grabs first
  go(); return rec; }
// 🔁 Re-lay today (Mom; also "Re-lay today too"): everything not done is handed out again from the same rules; done chores stay where
// they are and their minutes still count. Writes only the plan / over paths that change, plus built/sig.
function hdRelay(iso){ if(!hdMom()) return null; const r=hdLive(iso); if(!r) return null; const P=hdPeople(), done={}, upd={}, B="houseDay/"+iso+"/";
  Object.keys(r.plan||{}).forEach(function(id){ if(hdDone(iso,id)) done[id]=r.plan[id]; });
  const G=r.grabs||{}, kept={}; Object.keys(r.over||{}).forEach(function(id){ const g=G[id]; if(g&&(g.by||g.done||hdDone(iso,id))) kept[id]=1; });   // 🙌 HOUSEOVER
  const ov=hdOv(iso,Object.assign({},done,kept)), u={}; Object.keys(done).forEach(function(id){ u[done[id].who]=(u[done[id].who]||0)+(done[id].mins||0); });
  Object.keys(P).forEach(function(w){ P[w]=Object.assign({},P[w],{school:Math.max(0,P[w].school-(u[w]||0)),weekend:Math.max(0,P[w].weekend-(u[w]||0))}); });
  const p=HouseEng.day({jobs:hhJobs()},iso,P,ov), s=hdShape(p), plan=Object.assign({},done), base={}; Object.keys(kept).forEach(function(id){ s.over[id]=r.over[id]; }); Object.keys(done).forEach(function(id){ base[done[id].who]=Math.max(base[done[id].who]||0,(done[id].order||0)+1); });
  Object.keys(s.plan).forEach(function(id){ const x=s.plan[id]; x.order=(x.order||0)+(base[x.who]||0); plan[id]=x; });
  const want=(typeof hdGrabsOf==="function")?hdGrabsOf(p.over.filter(function(o){ return !kept[o.id]; }),ov.off):{}, back={}, put=[];   // 🙌 an offer taken back: its plan / over paths wait for it
  Object.keys(G).forEach(function(id){ if(kept[id]) return; if(!want[id]) back[id]={plan:plan[id]||null,over:s.over[id]||null}; else if(G[id].pts!==want[id].pts||JSON.stringify(HouseEng.listOf(G[id].can))!==JSON.stringify(want[id].can)) put.push(id); });
  Object.keys(want).forEach(function(id){ if(!G[id]) put.push(id); });
  Object.keys(Object.assign({},r.plan,plan)).forEach(function(id){ if(!back[id]&&JSON.stringify((r.plan||{})[id]||null)!==JSON.stringify(plan[id]||null)) upd[B+"plan/"+id]=plan[id]||null; });
  Object.keys(Object.assign({},r.over,s.over)).forEach(function(id){ if(!back[id]&&JSON.stringify((r.over||{})[id]||null)!==JSON.stringify(s.over[id]||null)) upd[B+"over/"+id]=s.over[id]||null; });
  Object.keys(back).forEach(function(id){ delete plan[id]; s.over[id]=r.over[id]; });
  upd[B+"built/sig"]=hdSig(); upd[B+"keep"]=null; r.plan=plan; r.over=s.over; r.built=Object.assign({},r.built,{sig:upd[B+"built/sig"]}); delete r.keep;
  _hdM={}; try{ hhMaterialize(); }catch(e){} if(_hdWrite()) db.ref().update(upd);
  put.forEach(function(id){ hdGrabPut(iso,id,want[id]); });
  Object.keys(back).forEach(function(id){ hdGrabTakeBack(iso,id,function(){ const r2=hdLive(iso), w=back[id], u2={}; if(!r2) return; r2.plan=Object.assign({},r2.plan); r2.over=Object.assign({},r2.over); if(w.plan){ r2.plan[id]=w.plan; u2[B+"plan/"+id]=w.plan; } if(!w.over){ delete r2.over[id]; u2[B+"over/"+id]=null; }
    _hdM={}; try{ hhMaterialize(); }catch(e){} if(_hdWrite()) db.ref().update(u2); if(typeof renderAll==="function") renderAll(); }); });
  if(typeof renderAll==="function") renderAll(); return upd; }
// 🙌 HOUSEOVER (step 6b): what became of a chore that fit nobody — in Up for Grabs at double for whom, who grabbed it, who did it.
function hpGrabDone(iso,id){ const d=(typeof hdDoneRec==="function")?hdDoneRec(iso,id):null; return !!(d&&d.grab); }
function hpGrabChip(iso,id){ const r=(typeof hdLive==="function")?hdLive(iso):null, g=r&&r.grabs&&r.grabs[id], d=(typeof hdDoneRec==="function")?hdDoneRec(iso,id):null; if(!g||typeof g!=="object") return '';
  if(d&&d.grab) return _hhChip('✓ '+esc(hhWhoName(d.who))+' did it · ×2 · +'+(d.pts||0)+' ⭐','#dcfce7','#166534');
  if(g.by) return _hhChip('🔖 '+esc(hhWhoName(g.by))+' grabbed it · ×2','#fef3c7','#92400e');
  return _hhChip('🙌 Up for Grabs ×2 · +'+hdGrabPay(id,g)+' ⭐ · '+esc(hgX2For(id,HouseEng.listOf(g.can),'for ','')),'#fef3c7','#92400e'); }
// A chore card, a limit or a list changed after today was laid → Mom is asked once: "Re-lay today too / Keep today, start tomorrow".
function hdAsking(iso){ const r=hdLive(iso); if(!r||!hdMom()) return false; const s=hdSig(); return !!(r.built&&r.built.sig&&r.built.sig!==s&&r.keep!==s); }
function hdKeep(iso){ if(!hdMom()) return; const r=hdLive(iso); if(!r) return; r.keep=hdSig(); if(_hdWrite()) db.ref("houseDay/"+iso+"/keep").set(r.keep); if(typeof renderAll==="function") renderAll(); }
// HOUSESWITCH_END
// ── end of house.js — the flag below tells index.html the whole file ran (haLazyReady) ──
if(typeof window!=="undefined") window._haLazy_house=true;
