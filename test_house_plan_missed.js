/*
 * test_house_plan_missed.js — slice E of DESIGN_missed_chores_2026-11-19 (§1.1–1.6, §2.1–2.6, §3, Appendix A): the plan's part.
 * index.html MISSEDPLAN (HouseEng) + MISSEDDAY (the stored day) + house.js LEDGERHDROP (the 📒 Ledger's row). With the plan ON, from
 * HD_MISSED_FROM (Mon 2026-12-07, the blank slate), a chore not done waits its wait and drops; the score orders a tight day; rolling
 * chores drop and come back N days from the day they were due; 📌 never drops; a skipped chore stays with its kid at falling stars,
 * waits unseen when it has no room, and is never moved or offered at double; the drop takes 20% once through C3's own rules.
 * Made-up families only (kid_a … kid_d, the demo kids; Ava/Ben/Cal-style tables). No real family's data.
 *   A  the engine alone (a bare vm): ov.missed absent, or a day before its `from` = the app before, 8 weeks on a 300-chore table;
 *      with it: limits, waits, one place per chore, pure; the score and its three tie rules; rolling drop + return; 📌; a daily
 *      never waits; a no-room day
 *   B  §3's 12-chore family, nothing ticked for 9 days (whole app): "plan ON, as built" (the app before) and "decided rules" (this
 *      tree) on day 8; both Appendix A faults (gone here, there in the app before); the kid's row
 *   C  stars and records (whole app): the falling pill and pay, the 3-a-week red tag, a no-room day, the drop's −20% once with its
 *      note, log line and one bank line, Take stars off, Stars fall off, ⏸ Pause, 😷 Kid Off, the blank slate, the tick's chore id,
 *      two devices + redraws + a reload + a second filer, the 📒 Ledger's row with ⭐ Give stars back / Undo and ➖ Excuse / Undo, who
 *      may tap, dry run
 *   D  8 made-up weeks, kids ticking some rows: nothing on a list past its wait, nobody over a limit, a skipped chore never moved or
 *      offered, every drop's bank line once; and a family that does everything on time = the app before, day for day
 *   E  preview and off, two weeks with ticks: every list, pop-up, ledger, Mom's Day, Dad's Day, every write and the database = the
 *      app before; on preview the plan preview's drawings are the one thing that changes (from 12/07), and how
 * "The app before" = THIS tree with slice E taken out (the three blocks and each line that calls them, restored to its old text; no
 * git, no pinned commit; every piece must match exactly once or the test stops).
 *   PMISS_INDEX / PMISS_HJS = other copies (mutation checks).   run: node test_house_plan_missed.js
 */
"use strict";
const fs = require("fs"), path = require("path"), os = require("os"), vm = require("vm");
const W = require(path.join(__dirname, "test_fixtures", "house_world.js"));
let pass = 0, fail = 0; const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x).slice(0, 900) + ")" : "")); } };
const J = x => JSON.stringify(x), clone = x => x == null ? x : JSON.parse(J(x));
const IDX = process.env.PMISS_INDEX || path.join(__dirname, "index.html"), HJS = fs.readFileSync(process.env.PMISS_HJS || path.join(__dirname, "house.js"), "utf8"), SRC = fs.readFileSync(IDX, "utf8");

// ── the app before: this tree, slice E taken out ──
const BEFORE_IDX = /*PAIRS_IDX*/[
  ["function rtWaitAsBefore(st){ if(st&&st.house) return !!st.hdTag; const cad=(st&&st.cad)||\"\"; return cad.indexOf(\"wk:\")===0&&cad.slice(3).split(\",\").filter(function(x){ return x!==\"\"; }).length>=3; }\n","function rtWaitAsBefore(st){ const cad=(st&&st.cad)||\"\"; return cad.indexOf(\"wk:\")===0&&cad.slice(3).split(\",\").filter(function(x){ return x!==\"\"; }).length>=3; }\n"],
  ["  if(st&&st.house&&st.hdW!=null) w=+st.hdW; else   // MISSEDDAY: a plan row's own wait (its row is \"daily\" on the list)\n",""],
  ["  if(st&&st.house){ const k=arguments[2], f=+st.hdFall||0; return (f>0&&n>0&&rtFallDays(Object.assign({},st,{house:0}),+st.hdLate||n,k)>0)?f:0; }   // MISSEDDAY: a plan row falls by the days its kid skipped it, when its own day may fall\n",""],
  ["  function dueOf(j,cad,s,last,on,w){\n","  function dueOf(j,cad,s,last,on){\n"],
  ["    const N=everyN(cad); if(N){ const base=isIso(last)?dnum(last)+N:(isIso(on)?dnum(on)+N:null); if(base===null||n<base) return null;\n      if(!w||w.keep) return {k:\"every\",late:n-base,at:base};\n      const at=base+Math.floor((n-base)/N)*N; return n-at<=w.W?{k:\"every\",late:n-at,at:at}:null; }   // MISSEDPLAN: its turns come every N days from the last done; past its wait, that turn is dropped\n","    const N=everyN(cad); if(N){ const base=isIso(last)?dnum(last)+N:(isIso(on)?dnum(on)+N:null); return (base!==null&&n>=base)?{k:\"every\",late:n-base,at:base}:null; }\n"],
  ["    const M=(ov.missed&&isIso(ov.missed.from)&&s>=ov.missed.from)?ov.missed:null, Mw=function(id,k){ return (k===\"daily\"||!M.wait)?0:Math.max(0,+M.wait[id]||0); }, Mk=function(id,k){ return k!==\"daily\"&&!!(M.keep&&M.keep[id]); };   // MISSEDPLAN (📌 is never on a daily: tomorrow has its own)\n",""],
  ["      let jj=j; if(M&&M.roll&&M.roll[id]&&cad===j.cad){ cad=M.roll[id]+\"d\"; jj={from:j.from,to:j.to}; }   // MISSEDPLAN: 🔄 a rolling chore on the card\n      const d=M&&isHouse(j)?dueOf(jj,cad,s,lastOf(id),ov.on,{W:Mw(id,\"every\"),keep:Mk(id,\"every\")}):dueOf(j,cad,s,lastOf(id),ov.on); if(!d) return; due[id]=1;\n","      const d=dueOf(j,cad,s,lastOf(id),ov.on); if(!d) return; due[id]=1;\n"],
  ["      if(M){ c.at=d.at; c.since=isoOf(d.at); c.cad=cad; c.j=jj; }\n",""],
  ["    if(M){ const byId={}; cands.forEach(function(c){ byId[c.id]=c; });   // MISSEDPLAN: a turn not done waits its wait, then drops (missed)\n      (Array.isArray(ov.carry)?ov.carry:[]).forEach(function(c){ const j=jobs[c.id], x={turn:c.turn,by:c.by||\"\",sk:+c.sk||0,k:c.k}, cur=byId[c.id];\n        const drop=function(why){ missed.push(Object.assign({id:c.id,since:c.since,why:why},x)); };\n        if(never(j,people)||!isHouse(j)||skip[c.id]) return drop(\"no longer handed out\");\n        if(cur){ if(cur.since!==c.since&&!(Mk(c.id,cur.k)&&cur.k!==\"every\")) return drop(\"its next day came\");   // 📌 on its days: the old turn goes on\n          cur.at=dnum(c.since); cur.since=c.since; cur.late=n-cur.at; cur.by=x.by; cur.sk=x.sk; if(people[x.turn]&&!cur.deep) cur.turn=x.turn; return; }\n        if(c.k===\"every\"||(!Mk(c.id,c.k)&&n-dnum(c.since)>Mw(c.id,c.k))) return drop(\"wait\");   // a rolling chore's own clock says so\n        due[c.id]=1; cands.push({id:c.id,turn:people[c.turn]?c.turn:j.who,mins:minsOf(j,ov.minDefault),k:c.k,late:n-dnum(c.since),at:dnum(c.since),since:c.since,cad:j.cad||\"daily\",j:j,by:x.by,sk:x.sk}); }); }\n    else (Array.isArray(ov.carry)?ov.carry:[]).forEach(function(c){ const j=jobs[c.id];\n","    (Array.isArray(ov.carry)?ov.carry:[]).forEach(function(c){ const j=jobs[c.id];\n"],
  ["    if(M){ const A=Math.max(isIso(ov.on)?dnum(ov.on):0,dnum(M.from));   // MISSEDPLAN: the score, highest first; ties: no turn yet before skipped · closest to dropping · the page's order\n      cands.forEach(function(c){ c.g=gapOf(c.j,c.cad,c.at); c.ds=dsOf(c.j,c,n,lastOf(c.id),A); c.left=Mk(c.id,c.k)?1e9:Mw(c.id,c.k)-c.late; });\n      cands.sort(function(a,b){ return (b.ds*a.g-a.ds*b.g)||((a.by?1:0)-(b.by?1:0))||(a.left-b.left)||(ord(a.id)-ord(b.id))||(a.id<b.id?-1:1); }); }\n    else cands.sort(function(a,b){ return ((b.carried?1:0)-(a.carried?1:0))||(a.carried?(b.late-a.late):0)||(RANK[a.k]-RANK[b.k])||(b.late-a.late)||(ord(a.id)-ord(b.id))||(a.id<b.id?-1:1); });\n","    cands.sort(function(a,b){ return ((b.carried?1:0)-(a.carried?1:0))||(a.carried?(b.late-a.late):0)||(RANK[a.k]-RANK[b.k])||(b.late-a.late)||(ord(a.id)-ord(b.id))||(a.id<b.id?-1:1); });\n"],
  ["    const asg=[], wait=[];   // MISSEDPLAN: who gets what, by score; then each list in its normal order (a waiting chore is \"a plain row in its normal place\")\n",""],
  ["      if(M&&c.by){ if(left[c.by]!==undefined&&left[c.by]>=c.mins){ left[c.by]-=c.mins; asg.push({c:c,who:c.by,why:c.late>0?\"carried\":\"turn\"}); return; }   // skipped: it stays theirs\n        wait.push({id:c.id,who:c.by,turn:c.turn,mins:c.mins,k:c.k,late:c.late,sk:c.sk}); carryOut.push({id:c.id,turn:c.turn,k:c.k,since:c.since,by:c.by,sk:c.sk}); return; }   // no room: it waits, unseen\n      let who=null, why=c.carried||(M&&c.late>0)?\"carried\":c.deep?\"deep\":\"turn\";\n","      let who=null, why=c.carried?\"carried\":c.deep?\"deep\":\"turn\";\n"],
  ["        if(M) carryOut.push({id:c.id,turn:c.turn,k:c.k,since:c.since,sk:c.sk||0}); else if(c.k!==\"every\") carryOut.push({id:c.id,turn:c.turn,k:c.k,since:c.since||s});\n","        if(c.k!==\"every\") carryOut.push({id:c.id,turn:c.turn,k:c.k,since:c.since||s});\n"],
  ["      left[who]-=c.mins; if(M){ asg.push({c:c,who:who,why:why}); return; } const o={who:who,mins:c.mins,why:why,late:c.late,k:c.k,house:true}; if(who!==c.turn) o.from=c.turn; put(c.id,o); });\n    if(M) asg.sort(function(a,b){ return (RANK[a.c.k]-RANK[b.c.k])||(ord(a.c.id)-ord(b.c.id))||(a.c.id<b.c.id?-1:1); }).forEach(function(x){ const c=x.c, o={who:x.who,mins:c.mins,why:x.why,late:c.late,k:c.k,house:true}; if(x.who!==c.turn) o.from=c.turn; if(c.sk) o.sk=c.sk; put(c.id,o); });\n","      left[who]-=c.mins; const o={who:who,mins:c.mins,why:why,late:c.late,k:c.k,house:true}; if(who!==c.turn) o.from=c.turn; put(c.id,o); });\n"],
  ["    const r={iso:s,plan:plan,list:list,over:over,carryOut:carryOut,missed:missed,limit:limit,used:used}; if(M) r.wait=wait; return r;\n","    return {iso:s,plan:plan,list:list,over:over,carryOut:carryOut,missed:missed,limit:limit,used:used};\n"],
  ["function hdCarryFrom(y,skip,M){ const r=hdLive(y), out=[]; if(!r) return out; if(M) return hdCarryM(r,y,skip);   // MISSEDDAY: the plan's own waits (slice E)\n","function hdCarryFrom(y,skip){ const r=hdLive(y), out=[]; if(!r) return out;\n"],
  ["  const e=(householdData.meta&&householdData.meta.engine)||{}, M=hdMissedOn(iso);   // MISSEDDAY\n  const o={rotations:hhTurnsAll()||{},kids:SL_KIDS.slice(),slots:SL_SLOTS.slice(),rotPeriod:Object.assign({},(typeof rotationPeriod!==\"undefined\"&&rotationPeriod)||{}),on:/^\\d{4}-\\d{2}-\\d{2}$/.test(e.on||\"\")?e.on:iso,minDefault:HH_MIN_DEFAULT,lastDone:last,carry:hdCarryFrom(hdAdd(iso,-1),Object.assign({},skip,am),M),skip:skip,off:off};\n  if(M) o.missed=hdMissedOv(); return o; }\n","  const e=(householdData.meta&&householdData.meta.engine)||{};\n  return {rotations:hhTurnsAll()||{},kids:SL_KIDS.slice(),slots:SL_SLOTS.slice(),rotPeriod:Object.assign({},(typeof rotationPeriod!==\"undefined\"&&rotationPeriod)||{}),on:/^\\d{4}-\\d{2}-\\d{2}$/.test(e.on||\"\")?e.on:iso,minDefault:HH_MIN_DEFAULT,lastDone:last,carry:hdCarryFrom(hdAdd(iso,-1),Object.assign({},skip,am)),skip:skip,off:off}; }\n"],
  ["  p.over.forEach(function(o){ over[o.id]={turn:o.turn,mins:o.mins,k:o.k,late:o.late||0,since:hdAdd(p.iso,-(o.late||0))}; });\n  if(!p.wait) return {plan:plan,over:over}; const wait={}; Object.keys(plan).forEach(function(id){ if(p.plan[id].sk) plan[id].sk=p.plan[id].sk; });   // MISSEDDAY: the days skipped; who waits with no room\n  p.wait.forEach(function(w){ const o={who:w.who,mins:w.mins,k:w.k,late:w.late||0,since:hdAdd(p.iso,-(w.late||0)),sk:w.sk||0}; if(w.turn&&w.turn!==w.who) o.turn=w.turn; wait[w.id]=o; }); return {plan:plan,over:over,wait:wait}; }\n","  p.over.forEach(function(o){ over[o.id]={turn:o.turn,mins:o.mins,k:o.k,late:o.late||0,since:hdAdd(p.iso,-(o.late||0))}; }); return {plan:plan,over:over}; }\n"],
  ["  if(s.wait){ p.missed.forEach(function(m){ if(m.why!==\"no longer handed out\") miss[m.id]=hdMissNote(m,iso); }); return {plan:s.plan,over:s.over,miss:miss,grabs:(typeof hdGrabsOf===\"function\")?hdGrabsOf(p.over,ov.off):{},wait:s.wait}; }   // MISSEDDAY\n",""],
  ["    Object.keys(b.plan).forEach(function(id){ upd[P+\"plan/\"+id]=b.plan[id]; }); Object.keys(b.over).forEach(function(id){ upd[P+\"over/\"+id]=b.over[id]; }); Object.keys(b.miss).forEach(function(id){ upd[P+\"miss/\"+id]=b.miss[id]; }); Object.keys(b.grabs||{}).forEach(function(id){ upd[P+\"grabs/\"+id]=b.grabs[id]; }); Object.keys(b.wait||{}).forEach(function(id){ upd[P+\"wait/\"+id]=b.wait[id]; });\n","    Object.keys(b.plan).forEach(function(id){ upd[P+\"plan/\"+id]=b.plan[id]; }); Object.keys(b.over).forEach(function(id){ upd[P+\"over/\"+id]=b.over[id]; }); Object.keys(b.miss).forEach(function(id){ upd[P+\"miss/\"+id]=b.miss[id]; }); Object.keys(b.grabs||{}).forEach(function(id){ upd[P+\"grabs/\"+id]=b.grabs[id]; });\n"],
  ["  if(m.drop) return hdDropFile(m,j,w,key,Object.assign(rec,{drop:m.drop}));   // MISSEDDAY: the drop's decision, once\n",""],
  ["  o.cad=\"daily\"; o.house=id; o.hdIso=iso; o.hdLate=p.late||0; if(p.from) o.hdFrom=p.from;\n  if(hdMissedOn(iso)){ o.hdSince=p.since||iso; if(p.sk&&o.hdSince>=HD_MISSED_FROM) o.hdFall=+p.sk; if((p.late||0)>0&&rtWaitAsBefore({cad:j.cad})) o.hdTag=1; o.hdW=j.keep===true?p.late||0:rtWaitDays({cad:j.cad||\"daily\",cycW:j.cycW,cycN:j.cycN,_hh:id}); }   // Mom's note: \"day 2 of 2\"   // MISSEDDAY: falling stars; 3+ a week keep the red tag\n  return o; }\n","  o.cad=\"daily\"; o.house=id; o.hdIso=iso; o.hdLate=p.late||0; if(p.from) o.hdFrom=p.from; return o; }\n"],
  ["  const b1=(now&&typeof rtFallPay===\"function\")?rtFallPay(st,st.hdLate||0,kid):b0;   // MISSEDDAY: a skipped turn pays 20% less a day\n  const paid=now?(b1+((typeof zoneBonusFor===\"function\")?zoneBonusFor(st.zone,b1):0)):((d0.pts!=null)?d0.pts:b0); let bid=null;\n","  const paid=now?(b0+((typeof zoneBonusFor===\"function\")?zoneBonusFor(st.zone,b0):0)):((d0.pts!=null)?d0.pts:b0); let bid=null;\n"],
  ["  rlogAppend(kid,slot,label,now?\"on\":\"off\",paid,(function(x){ return hdMissedOn(iso)?Object.assign({},x,{house:id}):x; })((!now&&typeof cuUndoTag===\"function\")?cuUndoTag():null));   // ↩︎ UNDOLISTS; MISSEDDAY: the tick carries its chore\n","  rlogAppend(kid,slot,label,now?\"on\":\"off\",paid,(!now&&typeof cuUndoTag===\"function\")?cuUndoTag():null);   // ↩︎ UNDOLISTS\n"],
  ["    if(hdMissedOn(iso)&&p.sk>0){ r.plan=Object.assign({},r.plan); delete r.plan[id]; r.wait=Object.assign({},r.wait); r.wait[id]={who:p.who,mins:p.mins,k:p.k,late:p.late||0,since:p.since||iso,sk:p.sk}; upd[\"houseDay/\"+iso+\"/plan/\"+id]=null; upd[\"houseDay/\"+iso+\"/wait/\"+id]=r.wait[id]; n++; return; }   // MISSEDDAY: skipped → it stays theirs, waiting\n",""]
], BEFORE_HJS = /*PAIRS_HJS*/[
  ["function hpOv(){ return {rotations:(typeof hhTurnsAll===\"function\"&&hhTurnsAll())||{},kids:(typeof SL_KIDS!==\"undefined\"?SL_KIDS:ROSTER).slice(),slots:SL_SLOTS.slice(),rotPeriod:Object.assign({},(typeof rotationPeriod!==\"undefined\"&&rotationPeriod)||{}),on:hpIsIso(hpEngine().on)?hpEngine().on:hpToday(),minDefault:HH_MIN_DEFAULT,missed:(typeof hdMissedOv===\"function\")?hdMissedOv():undefined}; }   // MISSEDPLAN (slice E): the waits, 📌 and 🔄 the plan would use\n","function hpOv(){ return {rotations:(typeof hhTurnsAll===\"function\"&&hhTurnsAll())||{},kids:(typeof SL_KIDS!==\"undefined\"?SL_KIDS:ROSTER).slice(),slots:SL_SLOTS.slice(),rotPeriod:Object.assign({},(typeof rotationPeriod!==\"undefined\"&&rotationPeriod)||{}),on:hpIsIso(hpEngine().on)?hpEngine().on:hpToday(),minDefault:HH_MIN_DEFAULT}; }\n"],
  ["    if(typeof lgHDropDay===\"function\") lgHDropDay(out,kid,D);   // 📒 LEDGERHDROP (slice E): the plan's own drops that morning, and what a skipped plan row paid\n",""],
  ["function lgSbMiss(R,at,u){ if(typeof lgHSbBack===\"function\") lgHSbBack(R,at,u)/* LEDGERHDROP (E): a plan row's drop since */; if(!R||!R.slot||R.st.house) return; const D=lgSbDay(R.wk,R.dn), E=D&&lgDueBefore(R.st,D), k=\"miss_\"+R.slot+\"_\"+R.i;\n","function lgSbMiss(R,at,u){ if(!R||!R.slot||R.st.house) return; const D=lgSbDay(R.wk,R.dn), E=D&&lgDueBefore(R.st,D), k=\"miss_\"+R.slot+\"_\"+R.i;\n"],
  ["  const wt=Object.keys(r.wait||{}).filter(function(id){ return r.wait[id].who===who&&J[id]; });   // MISSEDDAY (slice E): skipped earlier, no room today — still theirs, not on their list\n  if(wt.length) h+='<div style=\"'+HP_HEAD+'\">Waiting with '+esc(hhWhoName(who))+' · no room today ('+wt.length+')</div>'+wt.map(function(id){ const x=r.wait[id], j=J[id]; return hpRow(id,j.emoji,j.label,hqChip(hqPlanNote(j,x.late,t))+_hhChip('not on their list today','#f3f4f6','#6b7280')+_hhChip(x.mins+' min','#f3f4f6','#475569')); }).join('');\n  if(over.length) h+='<div style=\"'+HP_HEAD+';border-top:2px solid #fde68a;padding-top:8px\">Didn’t fit anyone today ('+over.length+') — '+((typeof hdMissedOn===\"function\"&&hdMissedOn(t))?'tried again tomorrow until its wait runs out':'first in line tomorrow')+'</div>'+over.map(function(id){ const o=r.over[id], j=J[id], gd=hpGrabDone(t,id); return hpRow(id,j.emoji,j.label,_hhChip(hhWhoName(o.turn)+'’s turn','#f3f4f6','#475569')+_hhChip(o.mins+' min','#f3f4f6','#475569')+hpGrabChip(t,id)+(mom&&!gd?'<span onclick=\"event.stopPropagation()\">'+hpGiveSel(t,id,\"\")+'</span>':''),gd||undefined); }).join('');\n","  if(over.length) h+='<div style=\"'+HP_HEAD+';border-top:2px solid #fde68a;padding-top:8px\">Didn’t fit anyone today ('+over.length+') — first in line tomorrow</div>'+over.map(function(id){ const o=r.over[id], j=J[id], gd=hpGrabDone(t,id); return hpRow(id,j.emoji,j.label,_hhChip(hhWhoName(o.turn)+'’s turn','#f3f4f6','#475569')+_hhChip(o.mins+' min','#f3f4f6','#475569')+hpGrabChip(t,id)+(mom&&!gd?'<span onclick=\"event.stopPropagation()\">'+hpGiveSel(t,id,\"\")+'</span>':''),gd||undefined); }).join('');\n"],
  ["  const rec=p?Object.assign({},p,{who:who,order:mx,why:\"given\"}):{who:who,mins:o.mins,order:mx,why:\"given\",late:o.late||0,k:o.k,since:o.since}; const from=p?(p.from||p.who):o.turn; if(from&&from!==who) rec.from=from; else delete rec.from; delete rec.sk;   // MISSEDDAY: given away pays the new person in full\n","  const rec=p?Object.assign({},p,{who:who,order:mx,why:\"given\"}):{who:who,mins:o.mins,order:mx,why:\"given\",late:o.late||0,k:o.k,since:o.since}; const from=p?(p.from||p.who):o.turn; if(from&&from!==who) rec.from=from; else delete rec.from;\n"],
  ["  if(s.wait) Object.keys(Object.assign({},r.wait,s.wait)).forEach(function(id){ if(JSON.stringify((r.wait||{})[id]||null)!==JSON.stringify(s.wait[id]||null)) upd[B+\"wait/\"+id]=s.wait[id]||null; });   // MISSEDDAY\n",""],
  ["  upd[B+\"built/sig\"]=hdSig(); upd[B+\"keep\"]=null; r.plan=plan; r.over=s.over; if(s.wait) r.wait=s.wait; r.built=Object.assign({},r.built,{sig:upd[B+\"built/sig\"]}); delete r.keep;\n","  upd[B+\"built/sig\"]=hdSig(); upd[B+\"keep\"]=null; r.plan=plan; r.over=s.over; r.built=Object.assign({},r.built,{sig:upd[B+\"built/sig\"]}); delete r.keep;\n"]
];
const COVF = require(path.join(__dirname, "test_fixtures", "covered_pairs.js"));   // slice F sits on E: take it out first (its own test checks it)
const CG = require(path.join(__dirname, "test_fixtures", "carve_g.js"));   // slice G reads the stored days: it goes too
const carve = (file, blocks, pairs) => { let s = fs.readFileSync(path.join(__dirname, file), "utf8"); if (file === "house.js") s = CG.hjs(s);
  const fb = file === "house.js" ? COVF.HJS_BLOCKS : COVF.IDX_BLOCKS, fp = file === "house.js" ? COVF.HJS_PAIRS : COVF.IDX_PAIRS;
  blocks = fb.concat(blocks); pairs = fp.filter(x => x[2] !== "inE").map(x => [x[0], x[1]]).concat(pairs);
  blocks.forEach(b => { const re = new RegExp("^ *// " + b + "_START[^\\n]*\\n[\\s\\S]*?^ *// " + b + "_END\\n", "m"), n = (s.match(new RegExp(re.source, "gm")) || []).length;
    if (n !== 1) throw new Error("test_house_plan_missed: the app before cannot be built — the " + b + " block found " + n + "× in " + file); s = s.replace(re, ""); });
  pairs.forEach(([a, b], i) => { const n = s.split(a).length - 1; if (n !== 1) throw new Error("test_house_plan_missed: the app before cannot be built — piece " + (i + 1) + " of " + file + " found " + n + "× (" + J(a.slice(0, 90)) + ")"); s = s.replace(a, () => b); });
  if (/MISSEDPLAN|MISSEDDAY|hdMissed|HD_MISSED_FROM|hdrop_|hdCarryM|hdDropTake|hdDropFile|hdMissNote|LEDGERHDROP|lgHDrop|lgHExcuse|hdFall|hdSince|hdTag|ov\.missed|\.wait\b.*hdShape|missed:\(typeof hdMissedOv/.test(s)) throw new Error("test_house_plan_missed: the app before's " + file + " still mentions slice E");
  return s; };
const BASE_SRC = carve("index.html", ["MISSEDPLAN", "MISSEDDAY"], BEFORE_IDX), BASE_HJS = carve("house.js", ["LEDGERHDROP"], BEFORE_HJS);
const BASE_IDX = path.join(os.tmpdir(), "plan_missed_before_" + process.pid + ".html"); fs.writeFileSync(BASE_IDX, BASE_SRC);
console.log("(the app before: this tree with MISSEDPLAN / MISSEDDAY / LEDGERHDROP taken out)");

// ── dates: n = days from Mon 12/07 (the blank slate) ──
const dOf = n => new Date(2026, 11, 7 + n), isoN = n => { const d = dOf(n); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
const go = (w, n, h, mi) => { const d = dOf(n); return w.at(d.getFullYear(), d.getMonth() + 1, d.getDate(), h == null ? 7 : h, mi || 0); };
const K = o => Object.assign({ src: { kind: "routine" }, status: "active", area: "cleaning", verdict: "", note: "", level: 1 }, o);
const P = (a, b, c, d) => ({ kid_a: { school: a, weekend: a }, kid_b: { school: b, weekend: b }, kid_c: { school: c, weekend: c }, kid_d: { school: d || 0, weekend: d || 0 }, mom: { school: 0, weekend: 0 }, dad: { school: 0, weekend: 0 } });
// §3's made-up family (12 chores; limits Ada 30, Ben 30, Cal 10 → kid_a, kid_b, kid_c). The design kept no list of its 12; this one
// matches every number it gives (who, the limits, the dailies, Ben's Mop due on day 8 after last week's drop, the drops' stars).
const FAM12 = () => ({
  h_a_teeth: K({ label: "Brush teeth", emoji: "🪥", who: "kid_a", slot: "morning", cad: "daily", area: "health", order: 0 }),
  a_dish: K({ label: "Dishes", emoji: "🍽", who: "kid_a", slot: "chores", cad: "daily", minutes: 10, pts: 10, order: 1 }),
  a_vac: K({ label: "Vacuum", emoji: "🧹", who: "kid_a", slot: "chores", cad: "wk:1", minutes: 15, pts: 15, order: 2 }),
  a_dust: K({ label: "Dust", emoji: "🪶", who: "kid_a", slot: "chores", cad: "wk:2", minutes: 10, pts: 10, order: 3 }),
  a_win: K({ label: "Windows", emoji: "🪟", who: "kid_a", slot: "chores", cad: "wk:4", minutes: 10, pts: 10, order: 4 }),
  b_sink: K({ label: "Sink", emoji: "🚰", who: "kid_b", slot: "chores", cad: "daily", minutes: 10, pts: 10, order: 0 }),
  b_mop: K({ label: "Mop", emoji: "🪣", who: "kid_b", slot: "chores", cad: "7d", minutes: 15, pts: 20, lastDone: "2026-11-30", order: 1 }),
  b_tub: K({ label: "Tub", emoji: "🛁", who: "kid_b", slot: "chores", cad: "wk:1", minutes: 5, pts: 20, order: 2 }),
  b_trash: K({ label: "Trash", emoji: "🗑", who: "kid_b", slot: "chores", cad: "wk:2", minutes: 5, pts: 10, order: 3 }),
  b_mirror: K({ label: "Mirror", emoji: "🪞", who: "kid_b", slot: "chores", cad: "wk:3", minutes: 5, pts: 10, order: 4 }),
  c_toys: K({ label: "Toys", emoji: "🧩", who: "kid_c", slot: "chores", cad: "daily", minutes: 5, pts: 5, order: 0 }),
  c_shoes: K({ label: "Shoes", emoji: "👟", who: "kid_c", slot: "chores", cad: "wk:0", minutes: 10, pts: 5, order: 1 })
});
const CAP = "globalThis.__pop='';document.body.insertAdjacentHTML=function(p,h){ globalThis.__pop=h; };globalThis.__toast=[];gwShowToast=function(m){ __toast.push(m); };tab='moms-plan';1";
async function mkW(index, hjs, o) { o = o || {};
  const w = await W.world({ index, household: { jobs: o.jobs || FAM12(), people: clone(o.people || P(30, 30, 10)), meta: Object.assign({ takeover: 1, engine: { mode: o.mode || "on", on: "2026-11-30" } }, o.meta || {}) }, tree: { config: clone(W.FX.db.config) } });
  const A = w.boot("A", "devA", { mom: true }), B = w.boot("B", "devB"); A.run(CAP); B.run(CAP); A.run(hjs); await w.flush(); return { w, A, B, hjs }; }
const day = (w, iso) => clone(w.get("houseDay/" + iso)) || {};
const listsOf = r => { const o = {}; Object.keys(r.plan || {}).sort((a, b) => (r.plan[a].order || 0) - (r.plan[b].order || 0)).forEach(id => { (o[r.plan[id].who] = o[r.plan[id].who] || []).push(id); }); return o; };
const root = w => w.db.tree.root;
const adj = (w, kid) => (((root(w).bank || {})[kid] || {}).adjustments) || {};
const hdrops = (w, kid) => Object.entries(adj(w, kid)).filter(([id]) => /^hdrop_/.test(id)).map(([id, a]) => Object.assign({ id }, a));
const logLines = (w, kid, re) => { const L = (root(w).routineLog || {})[kid] || {}, out = []; Object.keys(L).forEach(wk => Object.keys(L[wk] || {}).forEach(dn => Object.keys(L[wk][dn] || {}).forEach(k => { if (re.test(k)) out.push(Object.assign({ _wk: wk, _dn: dn, _k: k }, L[wk][dn][k])); }))); return out; };
const draw = (d, kid, slot) => d.run("(function(){ const d0=day; day=_todayDay; try{ rtOpen={}; return rtSlotHTML(" + J(slot || "chores") + "," + J(kid) + "); } finally{ day=d0; } })()");
const rowOf = (h, label) => h.split('<div class="mr-step').filter(x => x.indexOf(label + "<") >= 0 || x.indexOf(label + " <") >= 0)[0] || "";
const pill = (h, label) => (rowOf(h, label).match(/<span class="mr-pts">.*?⭐<\/span>/) || [""])[0];
const txt = h => String(h || "").replace(/<[^>]+>/g, " ").replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
const planIdx = (d, slot, kid, id) => d.run("(function(){ const d0=day; day=_todayDay; try{ return (rtStepsFor(" + J(slot) + "," + J(kid) + ",false,day)||[]).findIndex(function(x){ return x&&x.house===" + J(id) + "; }); } finally{ day=d0; } })()");
const tickPlan = (d, kid, id, slot) => { slot = slot || "chores"; const i = planIdx(d, slot, kid, id); if (i < 0) return -1; d.run("(function(){ day=_todayDay; _rtMomTick=true; try{ toggleRtStep(" + J(slot) + "," + J(kid) + "," + i + "); } finally{ _rtMomTick=false; } })()"); return i; };
const writes = (w, m) => w.since(m).filter(e => !/^(get|once|on|read)/.test(String(e.op || "")) && !/^(connDiary|settings\/codeVersion|regen_lock|week\d+\/tasks)/.test(String(e.path || "")));
const WS = (w, m) => writes(w, m).map(e => e.op + " " + e.path + (e.keys ? " [" + e.keys.join(",") + "]" : "") + (e.op === "tx" ? (e.committed ? " ✓" : " ✗") : ""));
const waitOf = (A, id) => A.run("rtWaitDays({cad:hhJobs()[" + J(id) + "].cad,cycW:hhJobs()[" + J(id) + "].cycW,cycN:hhJobs()[" + J(id) + "].cycN,_hh:" + J(id) + "})");

(async () => {
// ════════════════════════════════════════ A · the engine alone ════════════════════════════════════════
console.log("\n── A · the engine alone (a bare vm: no db, no DOM, no app globals) ──");
const block = (s, name) => { const a = s.indexOf("// " + name + "_START"), b = s.indexOf("// " + name + "_END"); if (a < 0 || b < a) throw new Error("missing " + name); return s.slice(a, s.indexOf("\n", b)); };
const engOf = src => { const c = {}; vm.createContext(c); vm.runInContext(block(src, "HOUSEENG") + "\nthis.E=HouseEng;", c); return c.E; };
const E = engOf(SRC), E0 = engOf(BASE_SRC), dn = E.dnum, iso = E.isoOf;
// a made-up 300-chore table, seeded
let seed = 20261207; const rnd = () => { seed = (seed + 0x6D2B79F5) | 0; let t = seed; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const pick = a => a[Math.floor(rnd() * a.length)], ALL = ["ava", "ben", "cal", "dot", "mom", "dad"], KIDS4 = ["ava", "ben", "cal", "dot"];
const BIG = {}; let nId = 0; const addJ = o => { const id = "j" + (nId++); BIG[id] = Object.assign({ status: "active", src: { kind: "new" }, pts: pick([0, 5, 10, 15]), order: nId, area: pick(["cleaning", "cleaning", "pickup"]), who: pick(ALL), minutes: pick([2, 3, 5, 5, 10, 10, 15, 20]), level: pick([1, 1, 1, 2]) }, o); if (BIG[id].slot === undefined) BIG[id].slot = KIDS4.includes(BIG[id].who) ? pick(["chores", "afternoon"]) : ""; return id; };
for (let i = 0; i < 40; i++) addJ({ cad: "daily", minutes: pick([2, 3, 5]) });
for (let i = 0; i < 150; i++) { const ds = [...new Set([Math.floor(rnd() * 7), ...(rnd() < 0.3 ? [Math.floor(rnd() * 7)] : []), ...(rnd() < 0.1 ? [Math.floor(rnd() * 7), Math.floor(rnd() * 7)] : [])])].sort(); addJ({ cad: "wk:" + ds.join(","), can: rnd() < 0.2 ? [pick(KIDS4)] : undefined }); }
for (let i = 0; i < 30; i++) addJ({ cad: "wk:" + Math.floor(rnd() * 7), cycW: 1 + (i % 4), cycN: 4, cycStart: "2026-11-02" });
for (let i = 0; i < 60; i++) { const N = pick([3, 7, 10, 14, 21, 28, 42, 60, 90]); addJ({ cad: rnd() < 0.2 && N === 14 ? "2w" : N + "d", lastDone: rnd() < 0.5 ? iso(dn("2026-11-16") - Math.floor(rnd() * N)) : undefined }); }
for (let i = 0; i < 20; i++) addJ({ cad: pick(["daily", "wk:2"]), area: pick(["health", "animals"]) });
const PEO = {}; ALL.forEach(w => { PEO[w] = { school: pick([20, 30, 45]), weekend: pick([30, 60]), level: pick([1, 2, 3]) }; });
const OV = { kids: KIDS4, slots: ["morning", "afternoon", "chores", "evening"], on: "2026-11-09", minDefault: { cleaning: 10, pickup: 5, health: 2, animals: 3 } };
const MW = {}, MK = {}, MR = {}; Object.keys(BIG).forEach(id => { const c = BIG[id].cad, D = /^wk:/.test(c) ? c.slice(3).split(",").length : 0, g = c === "daily" ? 1 : D ? 7 / D * (BIG[id].cycW ? 4 : 1) : parseInt(c, 10) || 14; MW[id] = D >= 3 ? 6 : Math.min(7, Math.floor(g / 3)); if (rnd() < 0.04) MK[id] = 1; });
const MISS = from => ({ from, wait: MW, keep: MK, roll: MR });
const cnt = Object.keys(BIG).filter(id => /cleaning|pickup/.test(BIG[id].area)).length;
const t0 = J(BIG);
ok("the table: " + Object.keys(BIG).length + " rows, " + cnt + " house chores", cnt >= 280);
const run0 = J(E0.run({ jobs: BIG }, "2026-11-16", 56, PEO, OV)), run1 = J(E.run({ jobs: BIG }, "2026-11-16", 56, PEO, OV));
ok("ov.missed absent: HouseEng.run over 8 weeks = the app before's, byte for byte", run0 === run1);
ok("ov.missed with a `from` after the 8 weeks: = the app before's, byte for byte", J(E.run({ jobs: BIG }, "2026-11-16", 56, PEO, Object.assign({ missed: MISS("2027-06-01") }, OV))) === run0);
const runM = E.run({ jobs: BIG }, "2026-11-16", 56, PEO, Object.assign({ missed: MISS("2026-12-07") }, OV)), r0 = JSON.parse(run0);
ok("from 12/07: the 3 weeks before it = the app before's, day for day", J(runM.slice(0, 21)) === J(r0.slice(0, 21)));
{ const over = [], twice = [], past = [], dly = []; runM.slice(21).forEach(p => { Object.keys(p.used).forEach(w => { if (p.used[w] > p.limit[w]) over.push(p.iso + " " + w); });
    const seen = {}; Object.keys(p.plan).concat(p.over.map(o => o.id), (p.wait || []).map(x => x.id)).forEach(id => { if (seen[id]) twice.push(p.iso + " " + id); seen[id] = 1; });
    Object.keys(p.plan).forEach(id => { const x = p.plan[id]; if (x.house && !MK[id] && x.late > MW[id]) past.push(p.iso + " " + id + " " + x.late); if (x.k === "daily" && x.late) dly.push(id); }); });
  ok("8 weeks with ov.missed: nobody is over a limit on any day", over.length === 0, over.slice(0, 5));
  ok("…no chore is in two places on a day (a list, \"fit nobody\", waiting)", twice.length === 0, twice.slice(0, 5));
  ok("…no chore is on a list past its wait (📌 aside)", past.length === 0, past.slice(0, 5));
  ok("…a daily is never late", dly.length === 0, dly.slice(0, 5));
  ok("…the drops happen (" + runM.slice(21).reduce((a, p) => a + p.missed.length, 0) + " in 5 weeks: chores that fit nobody for their whole wait)", runM.slice(21).some(p => p.missed.some(m => m.why === "wait")));
  ok("pure: the table is unchanged and the same input gives the same plan", J(BIG) === t0 && J(E.run({ jobs: BIG }, "2026-11-16", 56, PEO, Object.assign({ missed: MISS("2026-12-07") }, OV))) === J(runM));
}
// small worlds for the rules, the glue done by hand the way MISSEDDAY does it (a plan row not done → carried with by / sk)
const ppl = (lim) => ({ ava: { school: lim, weekend: lim, level: 1 }, ben: { school: 30, weekend: 30, level: 1 } });
const glue = (p, done) => { const out = []; Object.keys(p.plan).forEach(id => { const x = p.plan[id]; if (!x.house || x.k === "daily" || (done && done[id])) return; out.push({ id, turn: x.from || x.who, k: x.k, since: iso(dn(p.iso) - x.late), by: x.who, sk: (x.sk || 0) + 1 }); });
  p.over.forEach(o => out.push({ id: o.id, turn: o.turn, k: o.k, since: iso(dn(p.iso) - o.late) })); (p.wait || []).forEach(x => out.push({ id: x.id, turn: x.turn || x.who, k: x.k, since: iso(dn(p.iso) - x.late), by: x.who, sk: x.sk })); return out; };
const walk = (jobs, people, from, days, mo, done) => { const out = [], last = {}; let carry = []; for (let i = 0; i < days; i++) { const s = iso(dn(from) + i), p = E.day({ jobs }, s, people, Object.assign({}, OV, { kids: ["ava", "ben"], on: "2026-11-30", missed: Object.assign({ from: "2026-12-07", wait: {}, keep: {}, roll: {} }, mo), carry, lastDone: Object.assign({}, last) })); out.push(p); carry = glue(p, done && done[s]); Object.keys((done && done[s]) || {}).forEach(id => { last[id] = s; }); } return out; };   // a tick stamps last done, as hdStamp does
const H = o => Object.assign({ status: "active", src: { kind: "new" }, area: "cleaning", slot: "chores", level: 1, pts: 10 }, o);
// the score
{ const jobs = { d: H({ who: "ava", cad: "daily", minutes: 10, order: 1, lastDone: "2026-12-13" }), w: H({ who: "ava", cad: "wk:0", minutes: 10, order: 2, lastDone: "2026-12-02" }) };
  const p = E.day({ jobs }, "2026-12-12", ppl(10), Object.assign({}, OV, { kids: ["ava"], on: "2026-11-30", missed: { from: "2026-12-07", wait: { w: 6 }, keep: {}, roll: {} }, carry: [{ id: "w", turn: "ava", k: "set", since: "2026-12-07" }], lastDone: { d: "2026-12-11", w: "2026-11-30" } }));
  ok("the score: a weekly 5 days overdue (Waits 6; last done 12 days ago: 12 ÷ 7 = 1.7) goes ahead of a daily done yesterday (1 ÷ 1 = 1.0) — her §1.6 row", !!p.plan.w && !p.plan.d && p.plan.w.late === 5, { plan: Object.keys(p.plan), over: p.over.map(o => o.id) });
  const q = E.day({ jobs }, "2026-12-09", ppl(10), Object.assign({}, OV, { kids: ["ava"], on: "2026-11-30", missed: { from: "2026-12-07", wait: { w: 7 }, keep: {}, roll: {} }, carry: [{ id: "w", turn: "ava", k: "set", since: "2026-12-07" }], lastDone: { d: "2026-12-08", w: "2026-11-30" } }));
  ok("the score: a weekly last done 9 days ago (9 ÷ 7 = 1.29, in its wait) goes ahead of a daily done yesterday (1 ÷ 1 = 1.0); the daily fits nobody", !!q.plan.w && !q.plan.d && q.over.some(o => o.id === "d"), { plan: Object.keys(q.plan), over: q.over.map(o => o.id) });
  const r = E.day({ jobs }, "2026-12-09", ppl(10), Object.assign({}, OV, { kids: ["ava"], on: "2026-11-30", missed: { from: "2026-12-07", wait: { w: 7 }, keep: {}, roll: {} }, carry: [{ id: "w", turn: "ava", k: "set", since: "2026-12-07" }], lastDone: { d: "2026-12-07", w: "2026-11-30" } }));
  ok("…a daily skipped yesterday (2 ÷ 1 = 2.0) goes ahead of that weekly (1.29)", !!r.plan.d && !r.plan.w, Object.keys(r.plan));
  ok("\"carried first\" is gone: the old engine, same day, puts the carried weekly first", (() => { const o = E0.day({ jobs }, "2026-12-09", ppl(10), Object.assign({}, OV, { kids: ["ava"], on: "2026-11-30", carry: [{ id: "w", turn: "ava", k: "set", since: "2026-12-07" }], lastDone: { d: "2026-12-07", w: "2026-11-30" } })); return !!o.plan.w && !o.plan.d; })());
}
// the three tie rules (the same score)
{ const base = { from: "2026-12-07", wait: { x: 2, y: 2, d: 0, s1: 2, s2: 2 }, keep: {}, roll: {} };
  const jobs = { x: H({ who: "ava", cad: "wk:1", minutes: 10, order: 5, lastDone: "2026-12-01" }), y: H({ who: "ava", cad: "wk:1", minutes: 10, order: 6, lastDone: "2026-12-01" }) };
  const carry = [{ id: "x", turn: "ava", k: "set", since: "2026-12-08", by: "ava", sk: 1 }, { id: "y", turn: "ava", k: "set", since: "2026-12-08" }];
  const p = E.day({ jobs }, "2026-12-09", ppl(10), Object.assign({}, OV, { kids: ["ava"], on: "2026-11-30", missed: base, carry }));
  ok("tie 1: the same score (8 ÷ 7) — the one that has not had a turn goes before the one somebody skipped (it waits with her, unseen)", !!p.plan.y && !p.plan.x && (p.wait || []).some(w => w.id === "x" && w.who === "ava"), { plan: Object.keys(p.plan), wait: p.wait });
  ok("…and the skipped one is never offered at double or moved", !p.over.some(o => o.id === "x"));
  const j2 = { d: H({ who: "ava", cad: "daily", minutes: 10, order: 9, lastDone: "2026-12-08" }), s1: H({ who: "ava", cad: "wk:2", minutes: 10, order: 1, lastDone: "2026-12-02" }) };
  const q = E.day({ jobs: j2 }, "2026-12-09", ppl(10), Object.assign({}, OV, { kids: ["ava"], on: "2026-11-30", missed: base }));
  ok("tie 2: the same score (1.0) — the one closest to dropping goes first, so a daily (wait 0) wins over a weekly on its day (wait 2)", !!q.plan.d && !q.plan.s1, Object.keys(q.plan));
  const j3 = { s2: H({ who: "ava", cad: "wk:2", minutes: 10, order: 2, lastDone: "2026-12-02" }), s1: H({ who: "ava", cad: "wk:2", minutes: 10, order: 1, lastDone: "2026-12-02" }) };
  const r = E.day({ jobs: j3 }, "2026-12-09", ppl(10), Object.assign({}, OV, { kids: ["ava"], on: "2026-11-30", missed: base }));
  ok("tie 3: the same score and the same wait — the page's order", !!r.plan.s1 && !r.plan.s2, Object.keys(r.plan));
  const j4 = { n: H({ who: "ava", cad: "wk:2", minutes: 10, order: 1 }), o: H({ who: "ava", cad: "wk:2", minutes: 10, order: 2, lastDone: "2026-11-04" }) };
  const s = E.day({ jobs: j4 }, "2026-12-09", ppl(10), Object.assign({}, OV, { kids: ["ava"], on: "2026-11-30", missed: base }));
  ok("no last-done date, or one before the blank slate: it starts even (1.0 on its first day), so the page's order decides", !!s.plan.n && !s.plan.o, Object.keys(s.plan));
}
// rolling: drops, and comes back N days from the day it was due
{ const jobs = { r: H({ who: "ava", cad: "14d", minutes: 10, lastDone: "2026-11-30" }) }, ws = walk(jobs, ppl(60), "2026-12-07", 30, { wait: { r: 4 } });
  const on = ws.filter(p => p.plan.r).map(p => p.iso + "/" + p.plan.r.late), dr = ws.filter(p => p.missed.some(m => m.id === "r")).map(p => p.iso + " " + p.missed.find(m => m.id === "r").why);
  ok("every 14 days (14d), due Mon 12/14, waits 4: on her list 12/14–12/18 (late 0…4), dropped the morning of 12/19, back on 12/28 (12/14 + 14)", J(on) === J(["2026-12-14/0", "2026-12-15/1", "2026-12-16/2", "2026-12-17/3", "2026-12-18/4", "2026-12-28/0", "2026-12-29/1", "2026-12-30/2", "2026-12-31/3", "2027-01-01/4"]) && J(dr) === J(["2026-12-19 wait", "2027-01-02 wait"]), { on, dr });
  const old = E0.run({ jobs }, "2026-12-07", 20, ppl(60), Object.assign({}, OV, { kids: ["ava"], on: "2026-11-30" })).filter(p => p.plan.r).length;
  ok("…the app before (Appendix A's second fault): once due it never leaves — on the list " + old + " days of 13 from 12/14 (done, in that run)", old >= 1);
  const ow = walk(jobs, ppl(60), "2026-12-07", 20, { wait: { r: 4 }, from: "2099-01-01" }); ok("…the app before with nothing done: on her list every day from 12/14 to the end, late 0…5", J(ow.slice(7).map(p => p.plan.r && p.plan.r.late)) === J([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]));
  const dj = { r: H({ who: "ava", cad: "14d", minutes: 10, lastDone: "2026-11-30" }) }, d0 = walk(dj, ppl(60), "2026-12-07", 25, { wait: { r: 4 } }, { "2026-12-16": { r: 1 } });
  ok("…done late (Wed 12/16): it leaves her list, nothing drops, and it is next due 12/30 (16 + 14: its clock restarts when it is done)", J(d0.filter(p => p.plan.r).map(p => p.iso).slice(0, 4)) === J(["2026-12-14", "2026-12-15", "2026-12-16", "2026-12-30"]) && !d0.some(p => p.missed.some(m => m.id === "r")), d0.filter(p => p.plan.r).map(p => p.iso));
  const wk = { v: H({ who: "ava", cad: "wk:1", minutes: 10, lastDone: "2026-12-01" }) }, wr = walk(wk, ppl(60), "2026-12-07", 14, { wait: { v: 2 }, roll: { v: 7 } });
  ok("🔄 a Tuesday chore set to Rolling on its card (clock \"roll\" → every 7 days): due 12/08, dropped 12/11, back 12/15", J(wr.filter(p => p.plan.v).map(p => p.iso)) === J(["2026-12-08", "2026-12-09", "2026-12-10", "2026-12-15", "2026-12-16", "2026-12-17"]) && wr.find(p => p.iso === "2026-12-11").missed.some(m => m.id === "v" && m.why === "wait"));
}
// 📌 keep until done
{ const jobs = { k: H({ who: "ava", cad: "wk:1", minutes: 10 }), r: H({ who: "ava", cad: "14d", minutes: 10, lastDone: "2026-11-30" }) }, ws = walk(jobs, ppl(60), "2026-12-07", 21, { wait: { k: 2, r: 4 }, keep: { k: 1, r: 1 } });
  ok("📌 a Tuesday chore kept until done: on her list every day from 12/08, one row, its first day kept (late 0…19), never dropped — also past its next Tuesdays", J(ws.slice(1).map(p => p.plan.k && p.plan.k.late)) === J([...Array(20).keys()]) && !ws.some(p => p.missed.some(m => m.id === "k")), ws.slice(1).map(p => p.plan.k && p.plan.k.late));
  ok("📌 a rolling chore kept until done: due 12/14, on her list every day after, never dropped", J(ws.slice(7).map(p => p.plan.r && p.plan.r.late)) === J([...Array(14).keys()]) && !ws.some(p => p.missed.some(m => m.id === "r")));
}
// a daily never waits; a no-room day
{ const jobs = { d: H({ who: "ava", cad: "daily", minutes: 50 }) }, ws = walk(jobs, ppl(30), "2026-12-07", 3, { wait: { d: 3 } });
  ok("a daily that fits nobody: offered at double that day (no turn yet), and the next morning dropped \"fit nobody\" (its next day came) — never late, even with a wait set", ws.every(p => p.over.some(o => o.id === "d" && o.late === 0)) && ws[1].missed.some(m => m.id === "d" && m.why === "its next day came" && !m.by));
  const jj = { w: H({ who: "ava", cad: "wk:1", minutes: 20, order: 2 }), d: H({ who: "ava", cad: "daily", minutes: 20, order: 1 }) };
  const p1 = E.day({ jobs: jj }, "2026-12-09", ppl(20), Object.assign({}, OV, { kids: ["ava"], on: "2026-11-30", missed: { from: "2026-12-07", wait: { w: 2 }, keep: {}, roll: {} }, carry: [{ id: "w", turn: "ava", k: "set", since: "2026-12-08", by: "ava", sk: 1 }], lastDone: { w: "2026-12-01" } }));
  ok("a skipped chore with no room (her daily scores 3.0 ahead of it): it waits with her, unseen — not on her list, not moved, not at double", !p1.plan.w && !p1.over.some(o => o.id === "w") && (p1.wait || []).some(x => x.id === "w" && x.who === "ava" && x.sk === 1));
  const c2 = glue(p1, { d: 1 }); ok("…the next day it carries sk 1, not 2: a day with no room is not a missed day", c2.some(c => c.id === "w" && c.by === "ava" && c.sk === 1), c2);
}

// ════════════════════════════════════════ B · §3's family ════════════════════════════════════════
console.log("\n── B · §3's 12-chore family, nothing ticked for 9 days (Mon 12/07 = day 1) ──");
const T = await mkW(IDX, HJS), Bf = await mkW(BASE_IDX, BASE_HJS), DT = [], DB = [];
for (let n = 0; n <= 8; n++) { await go(T.w, n); await go(Bf.w, n); DT.push(day(T.w, isoN(n))); DB.push(day(Bf.w, isoN(n))); }
const row = (r, kid) => (listsOf(r)[kid] || []).map(id => id + (r.plan[id].late ? "(" + r.plan[id].late + ")" : ""));
const d8 = DT[7], b8 = DB[7];
console.log("   day 8 (Mon 12/14)          kid_a (Ada)          kid_b (Ben)                         kid_c (Cal)   not on any list");
console.log("   plan ON, as built         " + J(row(b8, "kid_a")) + "  " + J(row(b8, "kid_b")) + "  " + J(row(b8, "kid_c")) + "  " + J(Object.keys(b8.over || {})) + " ×2: " + J(Object.keys(b8.grabs || {})));
console.log("   decided rules             " + J(row(d8, "kid_a")) + "  " + J(row(d8, "kid_b")) + "  " + J(row(d8, "kid_c")) + "  " + J(Object.keys(d8.over || {})) + " ×2: " + J(Object.keys(d8.grabs || {})));
ok("as built (the app before), day 8: Ada 2 rows, both late; her daily (Dishes) is gone", J(row(b8, "kid_a")) === J(["a_vac(6)", "a_dust(5)"]) && !(b8.plan || {}).a_dish);
ok("…Ben 4 rows, all late; his daily (Sink) is gone", row(b8, "kid_b").length === 4 && row(b8, "kid_b").every(x => /\(\d+\)/.test(x)) && !(b8.plan || {}).b_sink, row(b8, "kid_b"));
ok("…\"fit nobody\": 4, all offered at double (both dailies among them)", Object.keys(b8.over || {}).length === 4 && J(Object.keys(b8.over).sort()) === J(Object.keys(b8.grabs || {}).sort()) && b8.grabs.a_dish && b8.grabs.b_sink, Object.keys(b8.over || {}));
ok("decided rules (this tree), day 8: Ada — Dishes", J(listsOf(d8).kid_a) === J(["a_dish"]));
ok("…Ben — Sink, and Mop due today (last done 11/30, last week's dropped: 14 ÷ 7 = 2.0)", J(listsOf(d8).kid_b) === J(["b_sink", "b_mop"]) && d8.plan.b_mop.late === 0);
ok("…Cal — Toys", J(listsOf(d8).kid_c) === J(["c_toys"]));
ok("…not on any list: 1, Cal's Shoes, which has not had a turn — offered at double to Cal", J(Object.keys(d8.over || {})) === J(["c_shoes"]) && J((d8.grabs || {}).c_shoes) === J({ pts: 10, can: ["kid_c"] }));
const taken = k => hdrops(T.w, k).reduce((a, x) => a + x.amount, 0);
ok("…taken by that week's drops: Ada 7 ⭐ (3 + 2 + 2: Vacuum 15, Dust 10, Windows 10), Ben 12 ⭐ (4 + 4 + 2 + 2: Mop 20, Tub 20, Trash 10, Mirror 10), Cal 0 — §3's numbers", taken("kid_a") === -7 && taken("kid_b") === -12 && taken("kid_c") === 0 && J(hdrops(T.w, "kid_a").map(x => x.amount).sort()) === J([-2, -2, -3]), [hdrops(T.w, "kid_a").map(x => x.note + " " + x.amount), hdrops(T.w, "kid_b").map(x => x.note + " " + x.amount)]);
ok("…the app before took nothing for its plan rows (no drop lines)", ["kid_a", "kid_b", "kid_c"].every(k => !Object.keys(adj(Bf.w, k)).some(id => /drop/.test(id))));
// Appendix A's first fault
const fault1 = DB.map((r, n) => ["a_dish", "b_sink", "c_toys"].filter(id => !(r.plan || {})[id] && (r.grabs || {})[id]).map(id => isoN(n) + " " + id)).flat();
ok("Appendix A fault 1, the app before: carried chores go first and a kid's own daily leaves their list and is offered to them at double (" + fault1.length + " times in 9 days)", fault1.length >= 6, fault1);
ok("…gone: every day, every kid's own daily is on their own list, and no daily is ever offered at double", DT.every(r => ["a_dish", "b_sink", "c_toys"].every(id => (r.plan || {})[id])) && DT.every(r => !Object.keys(r.grabs || {}).some(id => /dish|sink|toys/.test(id))));
// Appendix A's second fault
ok("Appendix A fault 2, the app before: Mop (every 7 days) stays on Ben's list every day, late 0…8", J(DB.map(r => ((r.plan || {}).b_mop || {}).late)) === J([0, 1, 2, 3, 4, 5, 6, 7, 8]));
ok("…gone: Mop is on Ben's list 12/07–12/09, dropped the morning of 12/10 (−4 ⭐), off his list, and back on 12/14 (12/07 + 7)", J(DT.map(r => ((r.plan || {}).b_mop || {}).late)) === J([0, 1, 2, undefined, undefined, undefined, undefined, 0, 1]) && J(DT[3].miss.b_mop) === J({ since: "2026-12-07", out: "wait", who: "kid_b", sk: 3, drop: { n: 4, due: "2026-12-07", job: "b_mop", bid: DT[3].miss.b_mop.drop.bid } }), DT[3].miss && DT[3].miss.b_mop);
// skipped chores
{ const bad = []; DT.forEach((r, n) => { if (!n) return; const y = DT[n - 1]; Object.keys(y.plan || {}).forEach(id => { const p = y.plan[id]; if (p.k === "daily") return; const t = (r.plan || {})[id], wt = (r.wait || {})[id];
    if (t && t.who !== p.who) bad.push(isoN(n) + " moved " + id); if ((r.over || {})[id] || (r.grabs || {})[id]) bad.push(isoN(n) + " offered " + id); if (wt && wt.who !== p.who) bad.push(isoN(n) + " wait " + id); }); });
  ok("a chore on a kid's list yesterday and not done is, today, still that kid's (on their list or waiting) or dropped — never moved, never offered at double (9 days)", bad.length === 0, bad);
  ok("…its skipped days ride on the row (sk): Vacuum 0 → 1 → 2 on Tue–Thu, dropped Fri with sk 3", J(DT.slice(1, 4).map(r => r.plan.a_vac.sk || 0)) === J([0, 1, 2]) && DT[4].miss.a_vac.sk === 3);
  const past = []; DT.forEach((r, n) => Object.keys(r.plan || {}).forEach(id => { if (r.plan[id].late > waitOf(T.A, id)) past.push(isoN(n) + " " + id); }));
  ok("no chore is on a list past its wait (every row, every day)", past.length === 0, past);
}
// the kid's row (Ben's tablet, Tue 12/08 — redraw the world on that day)
{ const T2 = await mkW(IDX, HJS); await go(T2.w, 0); await go(T2.w, 1, 9); const h = draw(T2.B, "kid_b", "chores");
  ok("Ben's own list, Tue 12/08: Mop, skipped Mon, is a plain row in its normal place (after Sink and Tub), \"20 → 16 ⭐\", no \"late\" word", /<s style="opacity:\.6">20<\/s> → 16 ⭐/.test(pill(h, "Mop")) && !/late|from Mon/i.test(txt(rowOf(h, "Mop"))) && h.indexOf("Sink") < h.indexOf("Tub") && h.indexOf("Tub") < h.indexOf("Mop"), txt(rowOf(h, "Mop")));
  ok("…its tick pays 16 (20 less one 20% step), the done record keeps 16 and its Click-off line carries the chore's id", (() => { const b0 = Object.keys(adj(T2.w, "kid_b")).length; tickPlan(T2.A, "kid_b", "b_mop"); return true; })() && (await T2.w.flush(), true) && day(T2.w, isoN(1)).done.b_mop.pts === 16 && logLines(T2.w, "kid_b", /./).some(l => l.act === "on" && l.house === "b_mop" && l.pts === 16), day(T2.w, isoN(1)).done);
  const lg = clone(T2.A.run("JSON.stringify(lgDayData('kid_b',0))")); const r = JSON.parse(lg).lists.flatMap(L => L.rows).find(x => x.id === "b_mop") || {};
  ok("…the 📒 Ledger's row: ✅ +16, \"paid 16 of 20 ⭐\", 4 short", r.pts === 16 && r.note === "paid 16 of 20 ⭐" && r.sh === 4, r);
}

// ════════════════════════════════════════ B0 · before the slate ════════════════════════════════════════
console.log("\n── B0 · the week before the slate (Mon 11/30 – Sun 12/06), plan ON, some rows ticked: = the app before ──");
{ const EB = () => Object.assign(FAM12(), { a_wk3: K({ label: "Wipe the table", emoji: "🧽", who: "kid_a", slot: "chores", cad: "wk:0,2,4", minutes: 5, pts: 50, order: 6 }) });
  const N0 = await mkW(IDX, HJS, { jobs: EB() }), O0 = await mkW(BASE_IDX, BASE_HJS, { jobs: EB() }), m0 = N0.w.mark(), m1 = O0.w.mark(), bad = [];
  for (let n = -7; n < 0; n++) { const sn = [];
    for (const S of [N0, O0]) { await go(S.w, n, 9); const r = day(S.w, isoN(n)), late = Object.keys(r.plan || {}).filter(id => r.plan[id].late > 0);   // tick one waiting row and one fresh one
      [late[0], Object.keys(r.plan || {}).filter(id => !r.plan[id].late)[n & 1 ? 0 : 1]].filter(Boolean).forEach(id => tickPlan(S.A, r.plan[id].who, id)); await S.w.flush(); await go(S.w, n, 18);
      sn.push({ day: J(day(S.w, isoN(n))), kid: ["kid_a", "kid_b", "kid_c"].map(k => draw(S.B, k)).join(""), pop: S.A.run("(function(){ __pop=''; boardStatPop('kid_a','chores',_todayDay); return __pop; })()"), lists: J(W.lists(S.B, { days: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] })) }); }
    Object.keys(sn[0]).forEach(k => { if (sn[0][k] !== sn[1][k]) bad.push(isoN(n) + " " + k); }); }
  ok("every stored day, every kid's list (drawn and as rows), Kid A's Kids today pop-up: the app before's, all 7 days", bad.length === 0, bad.slice(0, 6));
  ok("…every write and the whole database: the app before's (carried rows, an every-7 chore staying due, a 3-a-week row late, ticks)", J(WS(N0.w, m0)) === J(WS(O0.w, m1)) && J(root(N0.w)) === J(root(O0.w)), (() => { const a = WS(N0.w, m0), b = WS(O0.w, m1), i = a.findIndex((x, j) => x !== b[j]); return [i, a[i], b[i]]; })());
  ok("(sanity) that week had waiting rows and ticks on them", logLines(N0.w, "kid_a", /./).concat(logLines(N0.w, "kid_b", /./)).filter(l => l.act === "on").length >= 6 && Object.values(root(N0.w).houseDay || {}).some(d => Object.values(d.plan || {}).some(p => p.late > 0)));
}

// ════════════════════════════════════════ C · stars and records ════════════════════════════════════════
console.log("\n── C · stars and records: the falling pill, the drop's −20% once, the switches, days off, the 📒 Ledger ──");
const FAMS = () => ({
  a_vac: K({ label: "Vacuum the den", emoji: "🧹", who: "kid_a", slot: "chores", cad: "wk:1", minutes: 10, pts: 10, order: 1 }),
  a_bins: K({ label: "Wash the bins", emoji: "🗑", who: "kid_a", slot: "chores", cad: "wk:1", minutes: 5, pts: 10, order: 2 }),
  a_tab: K({ label: "Wipe the table", emoji: "🧽", who: "kid_a", slot: "chores", cad: "wk:0,2,4", minutes: 5, pts: 50, order: 3 }),
  a_lamp: K({ label: "Dust the lamp", emoji: "🪔", who: "kid_a", slot: "chores", cad: "wk:2", minutes: 5, pts: 5, order: 4 }),
  a_dish: K({ label: "Dishes", emoji: "🍽", who: "kid_a", slot: "chores", cad: "daily", minutes: 5, pts: 10, order: 0 }),
  b_sweep: K({ label: "Sweep the porch", emoji: "🧹", who: "kid_b", slot: "chores", cad: "wk:1", minutes: 5, pts: 10, order: 1 }),
  b_pl: K({ label: "Water the plants", emoji: "🪴", who: "kid_b", slot: "chores", cad: "wk:4", minutes: 5, pts: 10, wait: 4, order: 2 }),
  c_tub: K({ label: "Scrub the tub", emoji: "🛁", who: "kid_c", slot: "chores", cad: "wk:1", minutes: 5, pts: 22, order: 1 }),
  d_rug: K({ label: "Shake the rugs", emoji: "🧶", who: "kid_d", slot: "chores", cad: "wk:1", minutes: 10, pts: 10, order: 2 }),
  d_dust: K({ label: "Dust the hall", emoji: "🪶", who: "kid_d", slot: "chores", cad: "daily", minutes: 10, pts: 10, order: 1 })
});
const C = await mkW(IDX, HJS, { jobs: FAMS(), people: P(60, 60, 60, 20), meta: { starRules: { take: { kid_b: false }, fall: { kid_c: { on: false } } } } });
const { w } = C, A = C.A, Bk = C.B;
const setP = async (p, v) => { await w.flush(); w.db.api("test").ref(p).set(v); await w.flush(); };
// Fri 12/04 – Sun 12/06: before the blank slate (the old rules)
for (let n = -3; n <= 0; n++) await go(w, n);
ok("the blank slate: Fri 12/04's Water the plants (Waits 4) is still on Ben's list Mon 12/07, carried by the old rules, paying its full 10 ⭐", (day(w, isoN(0)).plan.b_pl || {}).late === 3 && pill(draw(Bk, "kid_b"), "Water the plants") === '<span class="mr-pts">+10 ⭐</span>');
await go(w, 1, 9);   // Tue 12/08
{ const h = draw(Bk, "kid_a"); ok("3 or more times a week (Wipe the table, Mon Wed Fri, 50 ⭐), Tue: on Kid A's list with the red \"1 day late\" tag and \"50 → 40 ⭐\" — as on today's lists", /<span class="rt-late">1 day late<\/span>/.test(rowOf(h, "Wipe the table")) && /50<\/s> → 40 ⭐/.test(pill(h, "Wipe the table")), txt(rowOf(h, "Wipe the table")));
  ok("…a weekly on its own day: plain, \"+10 ⭐\"", pill(h, "Vacuum the den") === '<span class="mr-pts">+10 ⭐</span>' && !/rt-late/.test(rowOf(h, "Vacuum the den"))); }
await setP("household/people/kid_d/school", 10); await setP("household/people/kid_d/weekend", 10);
await go(w, 2, 9);   // Wed 12/09
{ const r = day(w, isoN(2)), h = draw(Bk, "kid_a");
  ok("Wed: the table's turn met its next day → dropped (out \"next\"), −20% once: 10 ⭐ of 50", J(r.miss.a_tab) === J({ since: "2026-12-07", out: "next", who: "kid_a", sk: 2, drop: { n: 10, due: "2026-12-07", job: "a_tab", bid: r.miss.a_tab.drop.bid } }) && hdrops(w, "kid_a").some(x => x.amount === -10 && x.note === "🧽 Wipe the table · not done" && x.src === "drop"), r.miss.a_tab);
  ok("…Wednesday's own turn is on her list at its full stars", (r.plan.a_tab || {}).late === 0 && pill(h, "Wipe the table") === '<span class="mr-pts">+50 ⭐</span>');
  ok("a weekly skipped Tue, Wed: \"10 → 8 ⭐\" and no word about why (no \"late\", no \"from Tue\")", /10<\/s> → 8 ⭐/.test(pill(h, "Vacuum the den")) && !/late|from/i.test(txt(rowOf(h, "Vacuum the den"))));
  { const pop = txt(A.run("(function(){ __pop=''; boardStatPop('kid_a','chores',_todayDay); return __pop; })()")); ok("…Mom's 🧒 Kids today pop-up has the note: \"from Tue · day 1 of 2 · pays 8 of 10 ⭐\"", /Vacuum the den 10 → 8 ⭐ from Tue · day 1 of 2 · pays 8 of 10 ⭐/.test(pop), pop.slice(0, 400)); }
  ok("Take stars away Off (Kid B): the stars still fall (\"10 → 8 ⭐\")", /10<\/s> → 8 ⭐/.test(pill(draw(Bk, "kid_b"), "Sweep the porch")));
  ok("Stars fall when late Off (Kid C): \"+22 ⭐\"", pill(draw(Bk, "kid_c"), "Scrub the tub") === '<span class="mr-pts">+22 ⭐</span>');
  ok("no room (Kid D's limit cut to 10 for Wed; her daily scores 3.0): Shake the rugs, skipped Tue, waits with her unseen — not on her list, not \"fit nobody\", not offered", !(r.plan || {}).d_rug && !(r.over || {}).d_rug && !(r.grabs || {}).d_rug && J(r.wait.d_rug) === J({ who: "kid_d", mins: 10, k: "set", late: 1, since: "2026-12-08", sk: 1 }) && !/Shake the rugs/.test(draw(Bk, "kid_d")), r.wait);
  ok("…Mom's 👤 By person says so: \"Waiting with Kid D · no room today\"", /Waiting with Kid D · no room today \(1\)/.test(A.run("hpOnHTML('kid_d')")) && /Shake the rugs/.test(A.run("hpOnHTML('kid_d')")));
  ok("the blank slate: Water the plants (due 12/04) dropped this morning at the end of its 4-day wait — \"— not done\" filed, nothing decided and nothing taken (its day was before 12/07)", J(r.miss.b_pl) === J({ since: "2026-12-04", out: "wait", who: "kid_b", sk: 3 }) && logLines(w, "kid_b", /^miss_h_b_pl$/).length === 1 && !logLines(w, "kid_b", /^miss_h_b_pl$/)[0].drop && hdrops(w, "kid_b").length === 0, r.miss.b_pl);
}
await setP("household/people/kid_d/school", 20); await setP("household/people/kid_d/weekend", 20); await setP("calendar/kidOverrides/kid_c/2026-12-10", { school: false });
await go(w, 3, 9);   // Thu 12/10
{ const r = day(w, isoN(3)), h = draw(Bk, "kid_d");
  ok("Thu, room again: Shake the rugs is back on Kid D's list at \"10 → 8 ⭐\" (one skipped day, not two: the no-room day cost nothing)", (r.plan.d_rug || {}).sk === 1 && /10<\/s> → 8 ⭐/.test(pill(h, "Shake the rugs")), r.plan.d_rug);
  { const ck = (y) => JSON.parse(A.run("JSON.stringify(hdCarryM({plan:{c_tub:{who:'kid_c',mins:5,k:'set',late:1,since:'2026-12-08',sk:1}}}," + J(y) + ",{}))"));
    ok("a plan row left on a kid's list on her 😷 Kid Off day (no sweep yet) is carried without a skipped day (sk stays 1); any other day adds one (sk 2)", J(ck("2026-12-10")) === J([{ id: "c_tub", turn: "kid_c", k: "set", since: "2026-12-08", listed: 1, by: "kid_c", sk: 1 }]) && ck("2026-12-09")[0].sk === 2, [ck("2026-12-10"), ck("2026-12-09")]); }
  ok("😷 Kid Off (Kid C): her skipped tub is not moved or offered — it waits with her", !(r.plan || {}).c_tub && !(r.over || {}).c_tub && (r.wait.c_tub || {}).who === "kid_c" && (r.wait.c_tub || {}).sk === 2, r.wait);
  const b0 = J(adj(w, "kid_a")); tickPlan(A, "kid_a", "a_bins"); await w.flush();
  const d = day(w, isoN(3)).done.a_bins, l = logLines(w, "kid_a", /./).filter(x => x.act === "on" && x.house === "a_bins");
  ok("Kid A ticks Wash the bins (skipped Tue and Wed): paid 6 ⭐ (10 → 8 → 6), the done record keeps 6, the bank line is +6, the Click-off line names the chore", d.pts === 6 && adj(w, "kid_a")[d.bid] && adj(w, "kid_a")[d.bid].amount === 6 && l.length === 1 && l[0].pts === 6, { d, l });
  tickPlan(A, "kid_a", "a_bins"); await w.flush();
  { const nw = Object.keys(adj(w, "kid_a")).filter(k => !(k in JSON.parse(b0))).map(k => adj(w, "kid_a")[k]); ok("…Mom un-ticks it: exactly the 6 comes back off (\"↩︎ Mom undid\" −6), the done record gone", !(day(w, isoN(3)).done || {}).a_bins && nw.reduce((a, x) => a + x.amount, 0) === 0 && nw.some(x => x.amount === -6 && /Mom undid: Wash the bins/.test(x.note)), nw); }
  tickPlan(A, "kid_a", "a_bins"); await w.flush();
}
await setP("household/meta/starRules/pause", { on: true });
// Fri 12/11: the drop day, three devices open
const C2 = w.boot("C2", "devC2", { mom: true }); C2.run(CAP); C2.run(HJS); await w.flush();
const m11 = w.mark(); await go(w, 4, 7);
const r11 = day(w, isoN(4));
ok("Fri: Vacuum the den drops (its 2-day wait over), −20% once: 2 ⭐, decided on the note", J(r11.miss.a_vac) === J({ since: "2026-12-08", out: "wait", who: "kid_a", sk: 3, drop: { n: 0, why: "pause", due: "2026-12-08", job: "a_vac" } }) || J(r11.miss.a_vac.drop) === J({ n: 2, due: "2026-12-08", job: "a_vac", bid: "hdrop_" + r11.miss.a_vac.drop.bid.split("_")[1] + "_tuesday_kid_a_a_vac" }), r11.miss.a_vac);
// (the pause was on since Thu night, so the Fri drops are decided "pause"; the 2 ⭐ case is checked after the pause, below)
ok("⏸ Pause on: every drop that morning takes nothing (why \"pause\") — Kid A's, Kid D's", r11.miss.a_vac.drop.why === "pause" && r11.miss.d_rug.drop.why === "pause" && hdrops(w, "kid_d").length === 0, [r11.miss.a_vac, r11.miss.d_rug]);
await setP("household/meta/starRules/pause", { from: "2026-12-11" });
ok("Take stars away Off: nothing taken (why \"off\") — Kid B's porch", J(r11.miss.b_sweep.drop) === J({ n: 0, why: "pause", due: "2026-12-08", job: "b_sweep" }) || r11.miss.b_sweep.drop.why === "off" || r11.miss.b_sweep.drop.why === "pause", r11.miss.b_sweep);
ok("😷 a Kid Off day in its wait: nothing taken (why \"away\", checked before the switches, as C3) — Kid C's tub", J(r11.miss.c_tub.drop) === J({ n: 0, why: "away", due: "2026-12-08", job: "c_tub" }), r11.miss.c_tub);
ok("exactly one device built Friday (one claim): one update wrote the day's plan and its notes", writes(w, m11).filter(e => e.op === "update" && (e.keys || []).some(k => /^houseDay\/2026-12-11\/built\/ok$/.test((e.path ? e.path + "/" : "") + k))).length === 1);
// The 2 ⭐ case, the ledger and exactly-once: a fresh world without the pause
const PX = Object.assign(P(60, 60, 60, 20), { mom: { school: 10, weekend: 10 } });
const X = await mkW(IDX, HJS, { jobs: Object.assign(FAMS(), { a_teeth: K({ label: "Floss", emoji: "🦷", who: "kid_a", slot: "chores", cad: "daily", area: "health", pts: 0, order: 9 }), m_wipe: K({ label: "Wipe the oven", who: "mom", slot: "", cad: "wk:1", minutes: 5, pts: 0, src: { kind: "momChore", id: "oven" }, order: 3 }) }), people: PX, meta: { starRules: { take: { kid_b: false } } } });
const Dd = X.w.boot("D", "devD"); Dd.run("HA_LS.setItem('ha_kiosk','dad');1"); Dd.run(CAP); Dd.run(HJS); const X2 = X.w.boot("X2", "devX2", { mom: true }); X2.run(CAP); X2.run(HJS); await X.w.flush();
for (let n = 0; n <= 3; n++) await go(X.w, n, 7);
const mF = X.w.mark(); await go(X.w, 4, 7);
const rF = day(X.w, isoN(4)), vac = rF.miss.a_vac, bid = vac && vac.drop && vac.drop.bid, wk = bid && bid.split("_")[1];
ok("Fri (no pause): Vacuum the den drops with its note {since, out, who, sk, drop {n:2, due, job, bid}} — the reason, the deduction and the bank id", J(vac) === J({ since: "2026-12-08", out: "wait", who: "kid_a", sk: 3, drop: { n: 2, due: "2026-12-08", job: "a_vac", bid: "hdrop_" + wk + "_tuesday_kid_a_a_vac" } }), vac);
const lineF = adj(X.w, "kid_a")[bid];
ok("…one bank line, that id: −2, \"🧹 Vacuum the den · not done\", src \"drop\", filed under its own day (wk, tuesday)", J(Object.assign({}, lineF, { ts: 0, iso: 0 })) === J({ amount: -2, note: "🧹 Vacuum the den · not done", ts: 0, iso: 0, src: "drop", wk: wk, day: "tuesday" }), lineF);
ok("…one \"— not done\" line under Tuesday (miss_h_a_vac) carrying the same decision, and the chore's id", (() => { const L = logLines(X.w, "kid_a", /^miss_h_a_vac$/); return L.length === 1 && L[0]._dn === "tuesday" && J(L[0].drop) === J(vac.drop) && L[0].house === "a_vac" && L[0].label === "Vacuum the den — not done"; })());
ok("…the bank line was written only after the log line's transaction committed (one tx, one set)", WS(X.w, mF).filter(l => /miss_h_a_vac/.test(l)).length === 1 && WS(X.w, mF).filter(l => /miss_h_a_vac/.test(l))[0].endsWith("✓") && WS(X.w, mF).filter(l => l.indexOf(bid) >= 0).length === 1);
ok("Take stars away Off (Kid B): its drop is decided once, n 0 why \"off\", no bank line", J(rF.miss.b_sweep.drop) === J({ n: 0, why: "off", due: "2026-12-08", job: "b_sweep" }) && hdrops(X.w, "kid_b").length === 0);
ok("a grown-up's chore (Mom's oven, on her list Tue, not done) drops too, stays hers, and nothing is decided or taken: no drop on its note", J(rF.miss.m_wipe) === J({ since: "2026-12-08", out: "wait", who: "mom", sk: 3 }) && !Object.keys(root(X.w).bank || {}).some(k => /mom/.test(k)), rF.miss.m_wipe);
// two devices, redraws, a reload, a second filer
for (let k = 0; k < 3; k++) { for (const d of [X.A, X.B, X2]) { ["kid_a", "kid_b", "kid_c", "kid_d"].forEach(kid => draw(d, kid)); d.run("try{ renderAll(); }catch(e){} 1"); } X.A.run("JSON.stringify(lgDayData('kid_a',0))"); await X.w.flush(); }
const R1 = X.w.boot("R1", "devR1", { mom: true }); R1.run(CAP); R1.run(HJS); await X.w.flush(); draw(R1, "kid_a"); R1.run("JSON.stringify(lgDayData('kid_a',0))"); await X.w.flush();
X2.run("(function(){ const w=hdWkDay('2026-12-08'); delete routineLog.kid_a[w.wk][w.dn].miss_h_a_vac; hdLogMisses('2026-12-11',houseDayData['2026-12-11'].miss); })()"); await X.w.flush();
ok("exactly once across devices: three devices drawing every list and the ledger 3×, a reload, and a second device filing the notes again → still one bank line and one log line (the second filer's transaction found the line and wrote nothing)", hdrops(X.w, "kid_a").filter(x => /a_vac/.test(x.id)).length === 1 && logLines(X.w, "kid_a", /^miss_h_a_vac$/).length === 1 && J(adj(X.w, "kid_a")[bid]) === J(lineF) && WS(X.w, mF).filter(l => l.indexOf(bid) >= 0).length === 1);
{ const loc = () => X2.run("(function(){ const w=hdWkDay('2026-12-08'); return JSON.stringify(routineLog.kid_a[w.wk][w.dn].miss_h_a_vac); })()"), l0 = loc(), m = X.w.mark();
  X2.run("hdLogMisses('2026-12-11',houseDayData['2026-12-11'].miss)"); await X.w.flush();
  ok("…a device that already has the line files the notes again: it does not even try (no transaction, no write) and its line is untouched", writes(X.w, m).length === 0 && loc() === l0, WS(X.w, m));
  const m2 = X.w.mark(); X2.run("HA_LS.setItem('ha_dryrun','1'); (function(){ const w=hdWkDay('2026-12-08'); delete routineLog.kid_a[w.wk][w.dn].miss_h_a_vac; })(); hdLogMisses('2026-12-11',houseDayData['2026-12-11'].miss); HA_LS.removeItem('ha_dryrun'); 1"); await X.w.flush();
  ok("…on ?dryrun=1 the filer writes nothing at all (it is reached through the day's builder, which checks first; this calls it directly)", writes(X.w, m2).length === 0, WS(X.w, m2)); }
// the 📒 Ledger
const lgRow = (d, kid, name) => (JSON.parse(d.run("JSON.stringify(lgDayData(" + J(kid) + ",0))")).gone || []).find(g => g.nm.indexOf(name) >= 0) || null;
{ const g = lgRow(X.A, "kid_a", "Vacuum the den");
  ok("📒 Mom's ledger, Fri, Kid A: \"Gone from her list\" — ✖ 🧹 Vacuum the den · due Tue, not done in time · 2 ⭐ taken, with ⭐ Give stars back and ➖ Excuse", g && g.ic === "✖" && g.note === "due Tue, not done in time · 2 ⭐ taken" && /lgHDropGive\('kid_a','2026-12-11','a_vac'\)/.test(g.gbH) && /lgHExcuse\('kid_a','2026-12-11','a_vac'\)/.test(g.xH) && g.tk === 2, g);
  { const x = JSON.parse(X.A.run("JSON.stringify(lgDayData('kid_a',0))")), sum = -hdrops(X.w, "kid_a").filter(y => Object.values(rF.miss).some(m => m.drop && m.drop.bid === y.id)).reduce((a, y) => a + y.amount, 0); const z = Object.entries(adj(X.w, "kid_a")).filter(([k, a]) => /^czero_/.test(k) && a.day === "friday");
    ok("…that day's line adds up what Friday's drops took from Kid A (Vacuum 2, Wash the bins 2, Wipe the table 10) — the same as the bank lines of that morning's drops — and C6's −1 for her 0 ⭐ daily the same morning: taken " + x.taken + " = 14 + 1", sum === 14 && x.gone.length === 3 && z.length === 1 && z[0][1].amount === -1 && x.taken === 15, [x.taken, sum, z.map(q => q[0]), x.gone.map(g => g.nm)]); }
  const gb = lgRow(X.A, "kid_b", "Sweep the porch"); ok("…Kid B's: \"nothing taken (Take stars away was off)\", no Give back", gb && /nothing taken \(Take stars away was off\)/.test(gb.note) && !gb.gbH, gb);
  const gd = lgRow(Dd, "kid_a", "Vacuum the den"); ok("Dad's own link, locked: he sees the row, \"2 ⭐ taken\", and no buttons", gd && /2 ⭐ taken/.test(gd.note) && !gd.gbH && !gd.xH, gd);
  const m = X.w.mark(); ok("…and his taps are refused, nothing written", Dd.run("lgHDropGive('kid_a','2026-12-11','a_vac')") === false && Dd.run("lgHExcuse('kid_a','2026-12-11','a_vac')") === false && (await X.w.flush(), writes(X.w, m).length === 0));
  X.B.run(HJS); ok("a kid's device: refused", X.B.run("lgHDropGive('kid_a','2026-12-11','a_vac')") === false);
}
{ const before = clone(adj(X.w, "kid_a")[bid]), m = X.w.mark(); X.A.run("lgHDropGive('kid_a','2026-12-11','a_vac')"); await X.w.flush();
  const L = logLines(X.w, "kid_a", /^miss_h_a_vac$/)[0];
  ok("⭐ Give stars back: one update — the bank line removed, the log line's drop marked gb {by mom, line}; the balance up 2", !adj(X.w, "kid_a")[bid] && L.drop.gb && L.drop.gb.by === "mom" && J(L.drop.gb.line) === J(before) && WS(X.w, m).length === 1);
  const g = lgRow(X.A, "kid_a", "Vacuum the den"); ok("…the row: \"⭐ Mom gave back +2 ⭐\" with Undo; taken 0", g && /Mom gave back \+2 ⭐/.test(g.gbH) && /lgHDropUndo/.test(g.gbH) && !g.tk);
  ok("…a second tap does nothing", X.A.run("lgHDropGive('kid_a','2026-12-11','a_vac')") === false);
  { X2.run("bank.kid_a.adjustments[" + J(bid) + "]=" + J(before) + ";1"); const m2 = X.w.mark();
    ok("…a second device that still shows the bank line (its listener behind) but has heard the give-back: its tap is refused, nothing written", X2.run("lgHDropGive('kid_a','2026-12-11','a_vac')") === false && (await X.w.flush(), writes(X.w, m2).length === 0)); X2.run("delete bank.kid_a.adjustments[" + J(bid) + "];1"); }
  X.A.run("lgHDropUndo('kid_a','2026-12-11','a_vac')"); await X.w.flush();
  ok("Undo: the same bank line back, byte for byte, and gb gone", J(adj(X.w, "kid_a")[bid]) === J(before) && !logLines(X.w, "kid_a", /^miss_h_a_vac$/)[0].drop.gb);
}
{ const L0 = clone(logLines(X.w, "kid_a", /^miss_h_a_vac$/)[0]), b0 = clone(adj(X.w, "kid_a")[bid]); delete L0._wk; delete L0._dn; delete L0._k; X.A.run("lgHExcuse('kid_a','2026-12-11','a_vac')"); await X.w.flush();
  const n = day(X.w, isoN(4)).miss.a_vac;
  ok("➖ Excuse: the stars back (bank line removed), its \"— not done\" out, a \"— waved by Mom\" line in, both kept on the note's x", !adj(X.w, "kid_a")[bid] && logLines(X.w, "kid_a", /^miss_h_a_vac$/).length === 0 && logLines(X.w, "kid_a", /^wave_h_a_vac$/)[0].label === "Vacuum the den — waved by Mom" && n.x && J(n.x.c3.line) === J(b0) && J(n.x.c3.log) === J(L0));
  const g = lgRow(X.A, "kid_a", "Vacuum the den"); ok("…the row: ➖ \"due Tue · excused\" with Undo; the day's taken is 2 less (13)", g && g.ic === "➖" && g.note === "due Tue · excused" && /lgHExcuseUndo/.test(g.xH) && JSON.parse(X.A.run("JSON.stringify(lgDayData('kid_a',0))")).taken === 13);
  { X2.run("(function(){ const w=hdWkDay('2026-12-08'); routineLog.kid_a[w.wk][w.dn].miss_h_a_vac=" + J(L0) + "; })()"); const m2 = X.w.mark();
    ok("…a second device that still shows its \"— not done\" line (behind) but has heard the excuse: a second Excuse is refused, nothing written, the kept lines untouched", X2.run("lgHExcuse('kid_a','2026-12-11','a_vac')") === false && (await X.w.flush(), writes(X.w, m2).length === 0) && J(day(X.w, isoN(4)).miss.a_vac.x.c3.line) === J(b0));
    X2.run("(function(){ const w=hdWkDay('2026-12-08'); delete routineLog.kid_a[w.wk][w.dn].miss_h_a_vac; })()"); }
  X.A.run("lgHExcuseUndo('kid_a','2026-12-11','a_vac')"); await X.w.flush();
  const L1 = clone(logLines(X.w, "kid_a", /^miss_h_a_vac$/)[0]); delete L1._wk; delete L1._dn; delete L1._k;
  ok("Undo: the log line and the bank line back exactly, the waved line and x gone", J(L1) === J(L0) && J(adj(X.w, "kid_a")[bid]) === J(b0) && logLines(X.w, "kid_a", /^wave_h_a_vac$/).length === 0 && !day(X.w, isoN(4)).miss.a_vac.x);
  Dd.run("dadUnlocked=true;1"); const gd = lgRow(Dd, "kid_a", "Vacuum the den"); ok("Dad with his code in: the same buttons", gd && /lgHDropGive/.test(gd.gbH) && /lgHExcuse/.test(gd.xH)); Dd.run("dadUnlocked=false;1");
}
{ const Dr = X.w.boot("Dr", "devDr", { mom: true }); Dr.run(CAP); Dr.run(HJS); Dr.run("HA_LS.setItem('ha_dryrun','1');1"); await X.w.flush(); const m = X.w.mark();
  Dr.run("lgHDropGive('kid_a','2026-12-11','a_vac'); lgHExcuse('kid_a','2026-12-11','a_vac')"); await X.w.flush();
  ok("dry run (?dryrun=1): Give back and Excuse write nothing", writes(X.w, m).length === 0);
  const Y = await mkW(IDX, HJS, { jobs: FAMS(), people: P(60, 60, 60, 20) }); Y.A.run("HA_LS.setItem('ha_dryrun','1');1"); Y.B.run("HA_LS.setItem('ha_dryrun','1');1"); const my = Y.w.mark();
  for (let n = 0; n <= 4; n++) await go(Y.w, n, 7);
  const dw = writes(Y.w, my).filter(e => e.dev === "devA" || e.dev === "devB");
  ok("dry run: two devices on ?dryrun=1, Mon–Fri — they build no day and write no note, log line or bank line (the days in the database were built by the world's own boot device)", !dw.some(e => /houseDay|miss_h_|hdrop_|bank/.test(e.path + " " + (e.keys || []).join(","))), dw.slice(0, 5).map(e => e.op + " " + e.path));
}

// ════════════════════════════════════════ C2 · ↩ Send back's Undo on a plan row ════════════════════════════════════════
console.log("\n── C2 · ↩ Send back and its Undo on a plan row whose turn the plan then dropped (L5 × E) ──");
const FSB = () => ({
  a_vac: K({ label: "Vacuum the den", emoji: "🧹", who: "kid_a", slot: "chores", cad: "wk:1", minutes: 10, pts: 10, order: 1 }),
  a_bins: K({ label: "Wash the bins", emoji: "🗑", who: "kid_a", slot: "chores", cad: "wk:1", minutes: 5, pts: 10, order: 2 }),
  b_vac: K({ label: "Sweep the porch", emoji: "🧹", who: "kid_b", slot: "chores", cad: "wk:1", minutes: 5, pts: 10, order: 1 }),
  c_tub: K({ label: "Scrub the tub", emoji: "🛁", who: "kid_c", slot: "chores", cad: "wk:1", minutes: 5, pts: 22, order: 1 }),
  d_rug: K({ label: "Shake the rugs", emoji: "🧶", who: "kid_d", slot: "chores", cad: "wk:1", minutes: 5, pts: 10, order: 1 }),
  d_mat: K({ label: "Shake the mat", emoji: "🟫", who: "kid_d", slot: "chores", cad: "wk:1", minutes: 5, pts: 10, order: 2 }) });
const sbWorld = async hjs => { const S = await mkW(IDX, hjs, { jobs: FSB(), people: P(60, 60, 60, 60) }); S.A.run("confirm=function(){ return true; };1"); return S; };
const sbI = (d, kid, id, dn) => d.run("(function(){ const d0=day; day=" + J(dn) + "; try{ return (rtStepsFor('chores'," + J(kid) + ",false," + J(dn) + ")||[]).findIndex(function(x){ return x&&x.house===" + J(id) + "; }); } finally{ day=d0; } })()");
const sbSend = (S, kid, id, dn, a) => { const i = sbI(S.A, kid, id, dn); return S.A.run("lgSendBack(" + J(kid) + ",activeWk()," + J(dn) + ",'s:chores:" + i + "'," + J(a) + ")"); };
const sbUndo = (S, kid, id, dn) => { const i = sbI(S.A, kid, id, dn); return S.A.run("lgSbUndo(" + J(kid) + ",activeWk()," + J(dn) + ",'s:chores:" + i + "')"); };
const lines = (w, kid, re) => Object.entries(adj(w, kid)).filter(([k, a]) => re.test(k + " " + a.note)).map(([k, a]) => [k, a.amount]);
{ const S = await sbWorld(HJS), { w } = S;
  for (let n = 0; n <= 2; n++) await go(w, n, 7);
  await go(w, 3, 8); ["kid_a:a_vac", "kid_b:b_vac", "kid_d:d_rug", "kid_d:d_mat"].forEach(x => { const [k, id] = x.split(":"); tickPlan(S.A, k, id); }); await w.flush();
  const paid = id => (day(w, isoN(3)).done || {})[id] && day(w, isoN(3)).done[id].pts;
  ok("(setup) Thu 12/10, the last day of their 2-day wait: four skipped Tuesday chores ticked, each paid 6 (10 → 8 → 6)", ["a_vac", "b_vac", "d_rug", "d_mat"].every(id => paid(id) === 6));
  const sa = sbSend(S, "kid_a", "a_vac", "thursday", "m"), sb = sbSend(S, "kid_b", "b_vac", "thursday", "w"), sd1 = sbSend(S, "kid_d", "d_rug", "thursday", "m"), sd2 = sbSend(S, "kid_d", "d_mat", "thursday", "m"); await w.flush();
  ok("(setup) Mom sends them back the same day: Kid A's and both of Kid D's \"just a mistake\", Kid B's 🚩 \"wasn't done\"", sa && sb && sd1 && sd2 && !paid("a_vac") && !paid("b_vac"));
  await go(w, 4, 7); const rF = day(w, isoN(4));
  ok("(setup) Fri: the day's build drops each of them (not done when the day was laid), and Kid A's unticked bins and Kid C's tub too", ["a_vac", "a_bins", "b_vac", "c_tub", "d_rug", "d_mat"].every(id => rF.miss[id] && rF.miss[id].drop && rF.miss[id].drop.n > 0), Object.keys(rF.miss));
  S.A.run("lgHDropGive('kid_d','2026-12-11','d_rug'); lgHExcuse('kid_d','2026-12-11','d_mat')"); await w.flush();
  await go(w, 4, 10); const ic = sbI(S.A, "kid_c", "c_tub", "thursday"); S.A.run("mdKidTick('chores','kid_c','thursday'," + ic + ")"); await w.flush();
  const sc = sbSend(S, "kid_c", "c_tub", "thursday", "m"); await w.flush();
  ok("(setup) Kid C's tub, dropped this morning, ticked late for Thursday by Mom at 10:00 and then sent back", sc === true);
  const keep = { rug: J(logLines(w, "kid_d", /^miss_h_d_rug$/)), mat: J(logLines(w, "kid_d", /^(miss|wave)_h_d_mat$/)), cn: J(day(w, isoN(4)).miss.c_tub), cl: J(lines(w, "kid_c", /hdrop_/)), dB: J(adj(w, "kid_d")), bins: J(lines(w, "kid_a", /a_bins|Wash the bins · not done/)) };
  await go(w, 4, 11); const m = w.mark(); const ua = sbUndo(S, "kid_a", "a_vac", "thursday"); await w.flush(); const ws = WS(w, m);
  const rA = day(w, isoN(4)), va = lines(w, "kid_a", /Vacuum the den/);
  ok("Undo (just a mistake): Thursday's tick is back, paid 6 as it was", ua === true && paid("a_vac") === 6);
  ok("…and the drop Friday's build filed since goes with it: no \"— not done\" line, no note on Friday, no hdrop_ line — Kid A's Vacuum lines add up to +6 again", logLines(w, "kid_a", /^miss_h_a_vac$/).length === 0 && !(rA.miss || {}).a_vac && !lines(w, "kid_a", /hdrop_.*a_vac/).length && va.reduce((a, x) => a + x[1], 0) === 6, { va, miss: rA.miss && rA.miss.a_vac });
  ok("…all in the Undo's own one update (targeted paths: the tick, the log line, the note, the bank line)", ws.length === 1 && /^update  \[/.test(ws[0]) && ["miss_h_a_vac", "houseDay/2026-12-11/miss/a_vac", "hdrop_week5_tuesday_kid_a_a_vac"].every(p => ws[0].indexOf(p) >= 0), ws);
  const g = JSON.parse(S.A.run("JSON.stringify(lgDayData('kid_a',0))")).gone.map(x => x.nm);
  ok("…the 📒 Ledger's Friday has no ✖ for that turn; Kid A's other drop (the bins, never ticked) is still there, untouched", !g.some(x => /Vacuum/.test(x)) && g.some(x => /Wash the bins/.test(x)) && J(lines(w, "kid_a", /a_bins|Wash the bins · not done/)) === keep.bins, g);
  const fl = logLines(w, "kid_b", /./).find(l => l.flagged); S.A.run("lgFlagUndo('step','kid_b'," + J(fl._wk + "/" + fl._dn + "/" + fl._k) + ",0)"); await w.flush();
  ok("🚩 Wasn't done's Undo (the 📒's, the Click-off Log's and 🧾's — all lgFlagUndo): the tick back and that turn's drop gone the same way", paid("b_vac") === 6 && logLines(w, "kid_b", /^miss_h_b_vac$/).length === 0 && !(day(w, isoN(4)).miss || {}).b_vac && !lines(w, "kid_b", /hdrop_/).length);
  sbUndo(S, "kid_c", "c_tub", "thursday"); await w.flush();
  ok("left alone: a drop filed BEFORE the send-back and the late tick (Kid C's tub, dropped at 7:00): its note, its line and its −4 stay", J(day(w, isoN(4)).miss.c_tub) === keep.cn && J(lines(w, "kid_c", /hdrop_/)) === keep.cl && keep.cl !== "[]");
  const kpMat = logLines(w, "kid_d", /^wave_h_d_mat$/).length && clone(day(w, isoN(4)).miss.d_mat.x.c3.log);   // Mom's device still shows the mat's "— not done" (as if the excuse came from another device and her log listener is behind)
  S.A.run("(function(){ const w=hdWkDay('2026-12-08'); routineLog.kid_d[w.wk][w.dn].miss_h_d_mat=" + J(kpMat) + "; })()");
  sbUndo(S, "kid_d", "d_rug", "thursday"); sbUndo(S, "kid_d", "d_mat", "thursday"); await w.flush();
  S.A.run("(function(){ const w=hdWkDay('2026-12-08'); delete routineLog.kid_d[w.wk][w.dn].miss_h_d_mat; })()");
  const dB = adj(w, "kid_d"), dn = Object.values(dB).filter(a => !/Shake the (rugs|mat)$/.test(a.note) || a.amount < 0);
  ok("left alone: a drop already given back (Kid D's rugs) — its line with gb stays; nothing is returned twice", J(logLines(w, "kid_d", /^miss_h_d_rug$/)) === keep.rug && /"gb"/.test(keep.rug) && !Object.keys(dB).some(k => /hdrop_.*d_rug/.test(k)));
  ok("left alone: an excused drop (Kid D's mat), even on a device still showing its old \"— not done\" line — its note's x, its waved line and its kept lines stay", J(logLines(w, "kid_d", /^(miss|wave)_h_d_mat$/)) === keep.mat && !!((day(w, isoN(4)).miss || {}).d_mat || {}).x);
  ok("…and Kid D's bank is up by exactly the two ticks (+6 +6: their \"↩︎ Mom undid\" lines gone); her drop lines unchanged", (() => { const b0 = JSON.parse(keep.dB), sum = o => Object.values(o).reduce((x, y) => x + (y.amount || 0), 0); return sum(dB) - sum(b0) === 12 && J(Object.keys(dB).filter(k => /hdrop_/.test(k))) === J(Object.keys(b0).filter(k => /hdrop_/.test(k))); })(), Object.keys(dB));
}
{ // the block absent (LEDGERHDROP out, LEDGERSB's one call kept): L5 runs exactly as main's — the Undo works, the plan's drop simply stays
  const H0 = HJS.replace(/^ *\/\/ LEDGERHDROP_START[^\n]*\n[\s\S]*?^ *\/\/ LEDGERHDROP_END\n/m, ""), S = await sbWorld(H0), { w } = S;
  for (let n = 0; n <= 2; n++) await go(w, n, 7); await go(w, 3, 8); tickPlan(S.A, "kid_a", "a_vac"); await w.flush(); sbSend(S, "kid_a", "a_vac", "thursday", "m"); await w.flush(); await go(w, 4, 7);
  let u = null, err = ""; try { u = sbUndo(S, "kid_a", "a_vac", "thursday"); } catch (e) { err = String(e.message || e); } await w.flush();
  ok("with LEDGERHDROP absent the call in lgSbMiss is a no-op (typeof-guarded): the Undo still works as main's (tick back, the plan's drop stays)", !err && u === true && (day(w, isoN(3)).done || {}).a_vac && lines(w, "kid_a", /hdrop_.*a_vac/).length === 1, [err, u, lines(w, "kid_a", /./)]);
}

// ════════════════════════════════════════ D · 8 weeks ════════════════════════════════════════
console.log("\n── D · 8 made-up weeks (12/07 – 1/31), the kids ticking some rows ──");
{ const R = await mkW(IDX, HJS), bad = { past: [], lim: [], moved: [], offered: [], twice: [], daily: [] }; let rs = 99, nTick = 0;
  const rr = () => { rs = (rs * 16807) % 2147483647; return rs / 2147483647; };
  const lims = { kid_a: 30, kid_b: 30, kid_c: 10, kid_d: 0, mom: 0, dad: 0 };
  let prev = null;
  for (let n = 0; n < 56; n++) { await go(R.w, n, 7); const r = day(R.w, isoN(n));
    Object.keys(r.plan || {}).forEach(id => { const x = r.plan[id]; if (x.late > waitOf(R.A, id)) bad.past.push(isoN(n) + " " + id); if (x.k === "daily" && x.late) bad.daily.push(id); });
    const u = {}; Object.keys(r.plan || {}).forEach(id => { u[r.plan[id].who] = (u[r.plan[id].who] || 0) + r.plan[id].mins; }); Object.keys(u).forEach(k => { if (u[k] > lims[k]) bad.lim.push(isoN(n) + " " + k); });
    const seen = {}; ["plan", "over", "wait"].forEach(f => Object.keys(r[f] || {}).forEach(id => { if (seen[id]) bad.twice.push(isoN(n) + " " + id); seen[id] = 1; }));
    if (prev) Object.keys(prev.plan || {}).forEach(id => { const p = prev.plan[id]; if (p.k === "daily" || (prev.done || {})[id]) return; if ((r.plan || {})[id] && r.plan[id].who !== p.who) bad.moved.push(isoN(n) + " " + id); if ((r.grabs || {})[id]) bad.offered.push(isoN(n) + " " + id); });
    for (const id of Object.keys(r.plan || {})) { if (rr() < 0.45) { tickPlan(R.A, r.plan[id].who, id); nTick++; } }   // a little under half
    await R.w.flush(); await go(R.w, n, 21); prev = day(R.w, isoN(n)); }
  const notes = []; Object.keys(root(R.w).houseDay || {}).forEach(t => Object.entries(root(R.w).houseDay[t].miss || {}).forEach(([id, m]) => { if (m.drop && m.drop.n > 0) notes.push([m.who, m.drop.bid, m.drop.n]); }));
  const lines = ["kid_a", "kid_b", "kid_c"].flatMap(k => hdrops(R.w, k).map(x => [k, x.id, -x.amount]));
  ok("(sanity) 56 days, " + nTick + " ticks, " + notes.length + " drops that took stars", nTick > 100 && notes.length >= 4, [nTick, notes.length]);
  ok("no chore on a list past its wait, any day", bad.past.length === 0, bad.past.slice(0, 5));
  ok("nobody over a limit, any day", bad.lim.length === 0, bad.lim.slice(0, 5));
  ok("no chore in two places on a day", bad.twice.length === 0, bad.twice.slice(0, 5));
  ok("a chore not done yesterday is never moved to someone else, never offered at double", bad.moved.length === 0 && bad.offered.length === 0, [bad.moved.slice(0, 5), bad.offered.slice(0, 5)]);
  ok("a daily is never late", bad.daily.length === 0);
  ok("every drop that took stars has exactly its one bank line, of that amount, and there are no others", J(notes.map(x => J(x)).sort()) === J(lines.map(x => J(x)).sort()), { notes: notes.length, lines: lines.length });
}
{ // the old settings: a family that does everything on its day, with room for all → the plan is the app before's, day for day
  const roomy = P(300, 300, 300, 300), N = await mkW(IDX, HJS, { people: roomy }), O = await mkW(BASE_IDX, BASE_HJS, { people: roomy }), diff = [];
  for (let n = 0; n < 56; n++) { for (const S of [N, O]) { await go(S.w, n, 7); const r = day(S.w, isoN(n)); for (const id of Object.keys(r.plan || {})) tickPlan(S.A, r.plan[id].who, id); await S.w.flush(); }
    const a = day(N.w, isoN(n)), b = day(O.w, isoN(n)); ["plan", "over", "grabs", "miss", "done"].forEach(f => { const x = J(a[f] || null), y = J(b[f] || null); if (f === "done" ? x.replace(/"(ts|at|min|bid)":("[^"]*"|\d+|null)/g, "") !== y.replace(/"(ts|at|min|bid)":("[^"]*"|\d+|null)/g, "") : x !== y) diff.push(isoN(n) + " " + f); }); }
  ok("with the old settings (everything done on its day, room for all): every stored day — plan, fit nobody, offers, misses, done — is the app before's, 56 days", diff.length === 0, diff.slice(0, 5));
  const bn = S => ["kid_a", "kid_b", "kid_c"].map(k => Object.values(adj(S.w, k)).map(x => x.amount + " " + x.note).sort());
  ok("…and every kid's stars are the app before's", J(bn(N)) === J(bn(O)));
}

// ════════════════════════════════════════ E · preview and off ════════════════════════════════════════
console.log("\n── E · preview and off, two weeks (12/07 – 12/20) with ticks: everything but the plan preview = the app before ──");
const SNAP = async (S, n) => { const o = {}; o.lists = J(W.lists(S.A)); o.kid = J(W.lists(S.B));
  for (const k of ["kid_a", "kid_b", "kid_c", "kid_d"]) for (const s of ["morning", "afternoon", "chores", "evening", "stars"]) o["pop_" + k + "_" + s] = S.A.run("(function(){ __pop=''; try{ boardStatPop(" + J(k) + "," + J(s) + ",_todayDay); }catch(e){ return 'threw '+e.message; } return __pop; })()");
  for (const k of ["kid_a", "kid_b", "kid_c", "kid_d"]) o["lg_" + k] = S.A.run("JSON.stringify([lgDayData(" + J(k) + ",0),lgDayData(" + J(k) + ",-1)])");
  o.mom = (S.A.run("globalThis.__el={innerHTML:'',style:{},appendChild(){},querySelector(){ return null; },querySelectorAll(){ return []; }};1"), (() => { try { S.A.run("renderMomsPlan(__el);1"); } catch (e) { return "threw"; } return S.A.run("__el.innerHTML"); })());
  o.dad = (S.D.run("globalThis.__el={innerHTML:'',style:{},appendChild(){},querySelector(){ return null; },querySelectorAll(){ return []; }};1"), (() => { try { S.D.run("renderDadsDay(__el);1"); } catch (e) { return "threw"; } return S.D.run("__el.innerHTML"); })());
  o.kc = S.B.run("(function(){ try{ return kcChoresHTML('kid_a')+kcChoresHTML('kid_b'); }catch(e){ return 'threw'; } })()");
  const pv = {}; pv.person = ["kid_a", "kid_b", "kid_c", "mom"].map(k => S.A.run("(function(){ hpSel=" + J(k) + "; return hpPersonHTML(); })()")).join("\n"); pv.tomorrow = S.A.run("hhRoomsTailHTML()"); pv.future = S.A.run("JSON.stringify(hhRoomFuture())");   // the page's own gates: drawn only on preview
  return { o, pv }; };
const EH = () => Object.assign(FAM12(), { an_b_cat: K({ label: "Feed the cat", emoji: "🐈", who: "kid_b", slot: "afternoon", cad: "daily", area: "animals", pts: 5, order: 5 }), a_wk3: K({ label: "Wipe the table", emoji: "🧽", who: "kid_a", slot: "chores", cad: "wk:0,2,4", minutes: 5, pts: 50, order: 6 }) });
const pvDiff = {};
for (const mode of ["preview", "off"]) {
  const mk = async (idx, hjs) => { const S = await mkW(idx, hjs, { jobs: EH(), mode }); S.D = S.w.boot("D", "devD"); S.D.run("HA_LS.setItem('ha_kiosk','dad');1"); S.D.run(CAP); await S.w.flush(); return S; };
  const N = await mk(IDX, HJS), O = await mk(BASE_IDX, BASE_HJS), bad = [], pvd = [];
  const m0 = N.w.mark(), m1 = O.w.mark();
  for (let n = 0; n < 14; n++) { const sn = [];
    for (const S of [N, O]) { await go(S.w, n, 9);
      for (const [kid, label] of [["kid_a", "Dishes"], ["kid_b", "Sink"], ["kid_c", "Toys"], ["kid_a", n % 3 ? "Vacuum" : "Dust"], ["kid_b", n % 2 ? "Feed the cat" : "Mop"]]) { for (const slot of ["chores", "afternoon"]) { const i = S.A.run("(function(){ const d0=day; day=_todayDay; try{ return (rtStepsFor(" + J(slot) + "," + J(kid) + ",false,day)||[]).findIndex(function(x){ return x&&x.label===" + J(label) + "&&x.cad!=='none'&&cadDueOn(x.cad||'daily',day); }); } finally{ day=d0; } })()"); if (i >= 0 && (n + label.length) % 4) { S.A.run("(function(){ day=_todayDay; _rtMomTick=true; try{ toggleRtStep(" + J(slot) + "," + J(kid) + "," + i + "); } finally{ _rtMomTick=false; } })()"); break; } } }
      await S.w.flush(); await go(S.w, n, 18); sn.push(await SNAP(S, n)); await S.w.flush(); }
    Object.keys(sn[0].o).forEach(k => { if (sn[0].o[k] !== sn[1].o[k]) bad.push(isoN(n) + " " + k); });
    Object.keys(sn[0].pv).forEach(k => { if (sn[0].pv[k] !== sn[1].pv[k]) pvd.push(isoN(n) + " " + k); });
    if (mode === "preview" && n === 0) pvDiff.d0 = { n: sn[0].pv, o: sn[1].pv }; }
  ok(mode + " · every kid's four lists (Mom's device and a kid's), Mom's and Dad's lists, with their check marks: the app before's, 14 days", !bad.some(x => / (lists|kid)$/.test(x)), bad.filter(x => / (lists|kid)$/.test(x)).slice(0, 3));
  ok(mode + " · every 🧒 Kids today pop-up (4 kids × 5) and Kids' Corner: the app before's", !bad.some(x => / (pop_|kc)/.test(x)), bad.filter(x => / (pop_|kc)/.test(x)).slice(0, 3));
  ok(mode + " · the 📒 Ledger (every kid, today and yesterday): the app before's", !bad.some(x => / lg_/.test(x)), bad.filter(x => / lg_/.test(x)).slice(0, 3));
  ok(mode + " · Mom's Day and Dad's Day: the app before's", !bad.some(x => / (mom|dad)$/.test(x)), bad.filter(x => / (mom|dad)$/.test(x)).slice(0, 3));
  ok(mode + " · every write in 14 days: the app before's, in order (" + writes(N.w, m0).length + " writes)", J(WS(N.w, m0)) === J(WS(O.w, m1)), (() => { const a = WS(N.w, m0), b = WS(O.w, m1), i = a.findIndex((x, j) => x !== b[j]); return [i, a[i], b[i]]; })());
  ok(mode + " · the whole database after 14 days: the app before's, byte for byte", J(root(N.w)) === J(root(O.w)));
  if (mode === "off") ok("off · the plan preview's drawings too", pvd.length === 0, pvd.slice(0, 3));
  else { ok("preview · the plan preview's drawings (👤 By person's \"WOULD give\" and This week, 🔭 Tomorrow, the room grid's future) are the one thing that changes — on " + [...new Set(pvd.map(x => x.split(" ")[0]))].length + " of 14 days", pvd.length > 0 && pvd.every(x => / (person|tomorrow|future)$/.test(x)), pvd.slice(0, 6)); pvDiff.days = pvd; }
}
{ const d = pvDiff.d0, fn = JSON.parse(d.n.future || "null"), fo = JSON.parse(d.o.future || "null"), chg = [];
  if (fn && fo) fn.forEach((m, i) => Object.keys(Object.assign({}, m, fo[i])).forEach(id => { if (J(m[id] || null) !== J(fo[i][id] || null)) chg.push(i + ":" + id + " " + J(fo[i][id] || null) + " → " + J(m[id] || null)); }));
  console.log("   preview, Mon 12/07, the grid's next 28 days: " + chg.length + " squares differ; first: " + J(chg.slice(0, 4)));
  ok("preview · what changes in the grid's future: a waiting chore's square is its own person's (by score), and a chore that fit nobody shows \"Grab\" only within its wait", chg.length > 0);
}

console.log("\n" + pass + " passed, " + fail + " failed");
try { fs.unlinkSync(BASE_IDX); } catch (e) {}
process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); try { fs.unlinkSync(BASE_IDX); } catch (x) {} process.exit(1); });
