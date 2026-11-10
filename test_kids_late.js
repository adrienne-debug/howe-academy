/*
 * ⏰ KIDSLATE (her report 2026-11-10: "The kids' chores in the Kids' Corner is listing things that are late, which is definitely
 * what I want. But those are not being reflected in Mom and Dad's Day view and showing all those things as well.")
 * The 🧒 Kids today card (Mom's Day + Dad's Day) now puts a carried-over chore where Kids' Corner does: in the 🌅 ☀️ 🧹 🌙
 * fraction (mdSlotCounts), in the chore-name list (" · N days late"), and in the pill pop-up (boardStatPop) with the same
 * rt-late tag. Late only on the real today; waved / out-of-window steps stay off; the card writes nothing.   run: node test_kids_late.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,300)+")":"")); } };
const fn=name=>{ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); let d=0; for(let k=src.indexOf("{",i);k<src.length;k++){ if(src[k]==="{") d++; else if(src[k]==="}"&&--d===0) return src.slice(i,k+1); } throw new Error("unbalanced "+name); };
const blk=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("missing "+a); return src.slice(i,j+b.length); };
const BLOCK=blk("// KIDSLATE_START","// KIDSLATE_END");
const KT=fn("mdCardKidsToday");
// The card's chore-name loop, as written inside mdCardKidsToday (day is pinned to _kd around it there).
const CL=(()=>{ const a='const cs=rtStepsFor("chores",kid);', i=KT.indexOf(a); if(i<0) throw new Error("missing chore loop"); const j=KT.indexOf("\n",KT.indexOf("chores.push",i)); return KT.slice(i,j); })();

// Thursday (today). Chores: 0 Sweep porch — Tuesdays, missed (2 days late); 1 Make bed — daily; 2 Wipe sink — Tuesdays, missed
// but Mom waved it today; 3 Feed fish — Tuesdays, late and ticked today; 4 Fold towels — Tuesdays, but its course has ended.
function mk(o){
  o=o||{}; const html=[], seenDay=[], ctx={console,Object,Array,String,Number,parseInt,isNaN,Math,JSON,Date,RegExp,Error,
    day:o.day||"thursday", _todayDay:"thursday", activeWk:()=>"week30", slState:{}, SL_SLOTS:["morning","afternoon","chores","evening"], RT_ABBR:{afternoon:"a",chores:"c",evening:"e"},
    STEPS:[{emoji:"🧹",label:"Sweep porch",cad:"wk:2"},{label:"Make bed",cad:"daily"},{label:"Wipe sink",cad:"wk:2"},{label:"Feed fish",cad:"wk:2"},{label:"Fold towels",cad:"wk:2",ended:true}],
    LATE:{0:2,2:2,3:1,4:2,1:5},   // 1: a daily step — the real rtLateDays says 0 for it (asserted below); the stub would lie, the card must not ask past the window/day gates
    rtStepsFor:function(slot){ return slot==="chores"?ctx.STEPS:[]; },
    cadDueOn:(cad,dn)=>cad==="daily"||(cad==="wk:2"&&dn==="tuesday"),
    rtLateDays:function(slot,kid,i){ seenDay.push(ctx.day); const st=ctx.STEPS[i]; if(!st||st.cad==="daily") return 0; return ctx.LATE[i]||0; },
    rtWaved:(slot,kid,d,i)=>slot==="chores"&&d==="thursday"&&i===2,
    stepWindowOk:(st)=>!st.ended,
    rtDoneOn:(slot,kid,d,i)=>slot==="chores"&&d==="thursday"&&i===3,
    momHere:()=>true, dadAwardOk:()=>false, mdKidTick:()=>true,
    cap:s=>s.charAt(0).toUpperCase()+s.slice(1), esc:s=>String(s), document:{getElementById:()=>null,body:{insertAdjacentHTML:(w,h)=>html.push(h)}}, html, seenDay};
  vm.createContext(ctx);
  vm.runInContext(BLOCK+"\n"+fn("mdSlotCounts")+"\n"+fn("boardStatPopClose")+"\n"+fn("boardStatPop")+"\nfunction choreList(kid,_kd){ const chores=[]; const _pd=day; try{ day=_kd; "+CL+"\n } finally { day=_pd; } return chores; }",ctx);
  ctx.run=e=>vm.runInContext(e,ctx); ctx.pop=(slot,d)=>{ html.length=0; vm.runInContext("boardStatPop('kid','"+slot+"','"+d+"')",ctx); return html[html.length-1]||""; };
  return ctx;
}

console.log("1. Today (Thursday): a missed Tuesday chore is on the card, as in Kids' Corner");
{ const c=mk(); const n=c.run("mdSlotCounts('chores','kid','thursday')");
  ok("🧹 fraction counts Sweep porch (late) + Make bed + Feed fish (late, done) — not the waved one, not the ended one → 1/3", n.due===3&&n.done===1, n);
  const L=c.run("choreList('kid','thursday')");
  ok("chore list: Sweep porch rides along with ' (2 days late)' (brackets — the card joins the list with ' · ')", L.indexOf("🧹 Sweep porch (2 days late)")>=0, L);
  ok("…Make bed (due, daily) has no late suffix", L.indexOf("Make bed")>=0, L);
  ok("…a waved late chore is left off", !L.some(s=>/Wipe sink/.test(s)), L);
  ok("…a chore whose course ended never comes back as late", !L.some(s=>/Fold towels/.test(s)), L);
  const h=c.pop("chores","thursday");
  ok("pop-up: Sweep porch has the Kids' Corner tag", /Sweep porch<span class="rt-late">2 days late<\/span>/.test(h), h.slice(0,600));
  ok("…Feed fish is done, so no late tag but it counts as done (✅)", /Feed fish<\/span>/.test(h)&&!/Feed fish<span class="rt-late"/.test(h)&&/>✅</.test(h));
  ok("…the waved one stays greyed (as before) with no late tag", /Wipe sink<\/span>/.test(h)&&!/Wipe sink<span class="rt-late"/.test(h)&&/>–</.test(h));
  ok("…the ended one is not a row", !/Fold towels/.test(h));
  ok("…the header count matches the pill: (1/3)", /\(1\/3\)/.test(h), (h.match(/\(\d+\/\d+\)/)||[])[0]);
  ok("…a late row's ○ is still a tap by its step index (mdKidTick … ,0)", /mdKidTick\('chores','kid','thursday',0\)/.test(h));
  ok("1 day → '1 day late' (singular)", (()=>{ const c2=mk(); c2.LATE[0]=1; return /Sweep porch<span class="rt-late">1 day late<\/span>/.test(c2.pop("chores","thursday"))&&c2.run("choreList('kid','thursday')").indexOf("🧹 Sweep porch (1 day late)")>=0; })());
}
console.log("2. Another day's tab: due-only, never late");
{ const c=mk(); c._todayDay="thursday";
  const w=c.run("mdSlotCounts('chores','kid','wednesday')");
  ok("Wednesday tab: only Make bed counts (1 due)", w.due===1, w);
  ok("…chore list has no late ones", JSON.stringify(c.run("choreList('kid','wednesday')"))==='["Make bed"]', c.run("choreList('kid','wednesday')"));
  ok("…pop-up has no late tag and no Sweep porch", (h=>!/rt-late/.test(h)&&!/Sweep porch/.test(h))(c.pop("chores","wednesday")));
  const t=c.run("mdSlotCounts('chores','kid','tuesday')");
  ok("Tuesday tab: due steps count exactly as before (all five — the due test itself is unchanged)", t.due===5, t);
}
console.log("3. Gates");
{ const c=mk({day:"monday"}); c.seenDay.length=0; c.run("mdSlotCounts('chores','kid','thursday')");
  ok("rtLateDays is asked with the global day pinned to today, then handed back", c.seenDay.length>0&&c.seenDay.every(d=>d==="thursday")&&c.run("day")==="monday", c.seenDay);
  ok("a daily step is never late: the real rtLateDays returns 0 for 'daily'", /if\(cad==="daily"\) return 0;/.test(fn("rtLateDays")));
  ok("…and the card shows Make bed with no suffix even when asked", c.run("choreList('kid','thursday')").indexOf("Make bed")>=0);
  ok("mdLateDays: 0 off today, 0 outside the window", c.run("mdLateDays('chores','kid','wednesday',0,STEPS[0])")===0&&c.run("mdLateDays('chores','kid','thursday',4,STEPS[4])")===0&&c.run("mdLateDays('chores','kid','thursday',0,STEPS[0])")===2);
}
console.log("4. Read-only, scoped");
{ ok("the KIDSLATE block, mdSlotCounts, the card and the pop-up call no _rtLogLateMiss / _rtLogMiss", ![BLOCK,fn("mdSlotCounts"),KT,fn("boardStatPop")].some(s=>/_rtLogLateMiss\(|_rtLogMiss\(/.test(s)));
  ok("…and write nothing to Firebase", ![BLOCK,fn("mdSlotCounts"),fn("boardStatPop")].some(s=>/db\.ref|\.set\(|\.update\(/.test(s)));
  ok("the morning rows still come from morningDueIdx only", /const _mDue=morningDueIdx\(kid,day\);/.test(fn("boardStatPop")));
  ok("Kids' Corner still files the miss itself (unchanged)", /_rtLogLateMiss\(slot,kid,i,cad,st\.label,pts\);/.test(fn("rtSlotHTML")));
  ok("the old 🗂 Board's slotCounts is untouched (no KIDSLATE in it)", !/KIDSLATE|mdLateDays/.test(fn("slotCounts")));
}
ok("no 🔀", src.indexOf("🔀")<0);
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
