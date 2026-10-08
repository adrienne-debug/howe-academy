#!/usr/bin/env node
/* 🕰 School-day clock — one-time slot SHIFT PLAN (READ-ONLY: never talks to Firebase, never writes it).
   Run on DEPLOY DAY (steps in CLOCK_DEPLOY_RUNBOOK.md), after the full mastery/ backup and a fresh fetch,
   so the numbers reflect every drill logged since. Prints the per-kid shift and every card's old → new
   slot, and writes plan files whose bodies are TARGETED "<key>/next_due" paths (never a whole-node set).

   Why a shift: booked slots (next_due) are in the OLD units — the family-wide print counter (~40s).
   The new clock reads each kid's school-day number (~190s). Without the shift every booked card would be
   instantly overdue. Shift per kid = new clock today − old print number today; adding the same amount
   to every card keeps each card's distance to its slot exactly as it was ("due in 3" stays "due in 3").

   Usage:  node scripts/clock_shift_plan.js <dir-with-fetched-json> [YYYY-MM-DD] [kid,kid,...]
     <dir> must hold: printLog.json  calendar.json  plans.json  mastery_<kid>.json (one per kid)
     date defaults to today (local); kids default to lincoln,ellis,lucy,julian
   Output: <dir>/shift_plan_<kid>.json   ({"<key>/next_due": newValue, ...} for mastery/<kid>)
           <dir>/shift_plan_summary.txt  (the full list Adrienne reviews)
*/
const fs=require("fs"), path=require("path"), vm=require("vm");
const dir=process.argv[2]; if(!dir){ console.error("usage: node scripts/clock_shift_plan.js <dir> [YYYY-MM-DD] [kids]"); process.exit(2); }
const pad=n=>String(n).padStart(2,"0"), now=new Date();
const today=process.argv[3]||(now.getFullYear()+"-"+pad(now.getMonth()+1)+"-"+pad(now.getDate()));
const kids=(process.argv[4]||"lincoln,ellis,lucy,julian").split(",");
const rd=f=>JSON.parse(fs.readFileSync(path.join(dir,f),"utf8"));
const src=fs.readFileSync(path.join(__dirname,"..","index.html"),"utf8");
const fn=name=>{ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); return src.slice(i,src.indexOf("\n}",i)+2); };
const blk=(a,z)=>{ const i=src.indexOf(a); if(i<0) throw new Error("missing "+a+" — run from the clock branch"); return src.slice(i,src.indexOf(z,i)); };
const cal=rd("calendar.json")||{}, plans=rd("plans.json")||{};
const ctx={calendarData:{holidays:cal.holidays||{},vacations:cal.vacations||{},kidOverrides:cal.kidOverrides||{}},paceData:{plans},masteryKid:kids[0]};
vm.createContext(ctx);
vm.runInContext(fn("calToday")+"\n"+fn("getSchoolDays")+"\n"+blk("const MAST_CLOCK_EPOCH","\n// ── Ladder slot scheduling"),ctx);
// OLD clock exactly as the live code computes it: today's printLog entry, else max+1 (shared by every kid)
let pl=rd("printLog.json")||[]; if(!Array.isArray(pl)) pl=Object.values(pl); pl=pl.filter(Boolean);
const ex=pl.find(e=>e.date===today), oldPn=ex?ex.num:pl.reduce((m,e)=>Math.max(m,e.num||0),0)+1;
const lines=[`School-day clock shift plan for ${today}  (old family-wide print # today = ${oldPn}${ex?" — a drill was already logged today":""})`,""];
kids.forEach(kid=>{
  const raw=rd("mastery_"+kid+".json")||{};
  const entries=Array.isArray(raw)?raw.map((v,i)=>[String(i),v]):Object.entries(raw);
  const newPn=vm.runInContext(`mastSchoolDayNum(${JSON.stringify(kid)},${JSON.stringify(today)})`,ctx);
  const shift=newPn-oldPn, body={}, rows=[];
  entries.forEach(([key,it])=>{ if(!it||it.next_due==null) return;
    const nv=it.next_due+shift; body[key+"/next_due"]=nv;
    rows.push({key,id:it.id,prompt:String(it.prompt||"").slice(0,32),tier:it.tier,old:it.next_due,nw:nv,inOld:it.next_due-oldPn}); });
  fs.writeFileSync(path.join(dir,"shift_plan_"+kid+".json"),JSON.stringify(body));
  const dueNow=rows.filter(r=>r.inOld<=0).length;
  lines.push(`== ${kid}: clock today ${newPn} · shift +${shift} · ${rows.length} cards · due now ${dueNow} (stays due now)`);
  if(rows.length){ const o=rows.map(r=>r.old); lines.push(`   slots ${Math.min(...o)}..${Math.max(...o)} → ${Math.min(...o)+shift}..${Math.max(...o)+shift}`); }
  rows.sort((a,b)=>a.old-b.old||String(a.id).localeCompare(String(b.id))).forEach(r=>
    lines.push(`   ${String(r.old).padStart(4)} → ${String(r.nw).padStart(4)}  (${r.inOld<=0?"due now":"in "+r.inOld}) ${String(r.tier).padEnd(15)} ${r.prompt}  [${r.id} @ mastery/${kid}/${r.key}/next_due]`));
  lines.push("");
});
fs.writeFileSync(path.join(dir,"shift_plan_summary.txt"),lines.join("\n"));
console.log(lines.filter(l=>l.startsWith("==")||l.startsWith("   slots")||l.startsWith("School")).join("\n"));
console.log("\nfull list: "+path.join(dir,"shift_plan_summary.txt"));
