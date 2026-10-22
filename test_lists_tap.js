/*
 * ✅ LISTS_TAP (her asks 2026-10-21: "i want in kids today to match dads up to moms where she has the checkable lists button and can we
 * make on both mom and dads day all the lists clickable but do not change the look or size on any" — "each individual list you can open for
 * each kid like morning etc"). The 🌅 ☀️ 🧹 🌙 pop-up's ○/✅ is the kid's own check-off (mdKidTick) for Mom or an unlocked Dad; Dad's Day has
 * the 📋 lists pill + panel; the tick / undo / wave gates take an unlocked Dad; a wave by Dad is logged as Dad.   run: node test_lists_tap.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,300)+")":"")); } };
const fn=name=>{ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); let d=0; for(let k=src.indexOf("{",i);k<src.length;k++){ if(src[k]==="{") d++; else if(src[k]==="}"&&--d===0) return src.slice(i,k+1); } throw new Error("unbalanced "+name); };
// Lucy's Saturday: afternoon = Pickup kitchen (not done) + Shower (done at 4:10); morning = Brush teeth (done).
function mk(o){
  o=o||{}; const calls=[], html=[], ctx={console,Object,Array,String,Number,parseInt,isNaN,Math,JSON,Date,RegExp,Error,
    momHere:()=>!!o.mom, dadAwardOk:()=>!!o.dadOpen, ROSTER:["lincoln","ellis","lucy","julian"], SL_SLOTS:["morning","afternoon","chores","evening"], RT_ABBR:{afternoon:"a",chores:"c",evening:"e"},
    day:"saturday", _todayDay:"saturday", activeWk:()=>"week28", slState:{week28_saturday_lucy_astep1:{done:true,ts:"4:10 PM"},week28_saturday_lucy_mstep0:{done:true,ts:"7:30 AM"}},
    morningDueIdx:()=>[0], morningStepsFor:()=>[{label:"Brush teeth",cad:"daily"}], mStepDoneOn:(k,d,i)=>i===0,
    rtStepsFor:(sl)=>sl==="afternoon"?[{emoji:"🍽️",label:"Pickup kitchen",cad:"daily"},{emoji:"🚿",label:"Shower",cad:"daily",pts:2}]:[], cadDueOn:()=>true, rtDoneOn:(sl,k,d,i)=>sl==="afternoon"&&i===1,
    getActiveTasks:()=>[{id:"t1",who:"lucy",title:"Math",day:"saturday"}], effectiveDay:t=>t.day, checked:{}, getKidDayPoints:()=>0, getPointClaim:()=>null, bank:{}, WK:"week28",
    cap:s=>s.charAt(0).toUpperCase()+s.slice(1), esc:s=>String(s), document:{getElementById:id=>id==='content'?{}:null,body:{insertAdjacentHTML:(w,h)=>html.push(h)}},   // 'content' exists (the page repaints); no pop-up element to remove
    renderMomsPlan:()=>calls.push("render"), toggleRtStep:(sl,k,i)=>calls.push(["rt",sl,k,i]), toggleMorningStep:(k,i)=>calls.push(["mr",k,i]), calls, html};
  vm.createContext(ctx); vm.runInContext("let _rtMomTick=false;\n"+fn("boardStatPopClose")+"\n"+fn("boardStatPop")+"\n"+fn("mdKidTick")+"\n"+fn("_cuMomOk"),ctx);
  ctx.get=e=>vm.runInContext(e,ctx); ctx.pop=(slot)=>{ ctx.html.length=0; vm.runInContext("boardStatPop('lucy','"+slot+"','saturday')",ctx); return ctx.html[ctx.html.length-1]||""; }; return ctx;
}
const tapRe=(slot,i)=>new RegExp('onclick="event\\.stopPropagation\\(\\);mdKidTick\\(\''+slot+'\',\'lucy\',\'saturday\','+i+'\\);boardStatPop\\(\'lucy\',\''+slot+'\',\'saturday\'\\)"');

console.log("1. Mom's Day: the ☀️ pop-up's rows are taps");
{ const c=mk({mom:true}); const h=c.pop("afternoon");
  ok("Pickup kitchen's ○ is a tap → mdKidTick(afternoon,lucy,saturday,0) then the pop-up redraws", tapRe("afternoon",0).test(h)&&/>○</.test(h));
  ok("Shower's ✅ is a tap too (undo)", tapRe("afternoon",1).test(h)&&/>✅</.test(h));
  ok("same rows, same size: the 20px mark column, the 13px row, the ✕ close — nothing else changed", /width:20px;text-align:center;cursor:pointer/.test(h)&&/padding:6px 2px;border-bottom:1px solid #f3f4f6;font-size:13px/.test(h)&&/boardStatPopClose\(\)" style="border:none;background:#f3f4f6/.test(h)&&/\(1\/2\)/.test(h));
  ok("🌅 morning rows too", tapRe("morning",0).test(c.pop("morning")));
  ok("📅 school work stays read-only (no tap)", !/mdKidTick/.test(c.pop("tasks"))&&/Math/.test(c.pop("tasks")));
  ok("⭐ stars stays read-only", !/mdKidTick/.test(c.pop("stars")));
  ok("the tap itself: Mom's check-off runs with the day pinned, then the page repaints", c.get("mdKidTick('afternoon','lucy','saturday',0)")===true&&JSON.stringify(c.calls[0])==='["rt","afternoon","lucy",0]'&&c.calls.indexOf("render")>0, c.calls);
}
console.log("2. Dad's Day");
{ const d=mk({dadOpen:true}); const h=d.pop("afternoon");
  ok("Dad unlocked (his code entered): the rows are taps", tapRe("afternoon",0).test(h));
  ok("…and the tick goes through as the kid's own check-off", d.get("mdKidTick('afternoon','lucy','saturday',0)")===true&&d.calls.length>0);
  ok("…undo is allowed too (_cuMomOk)", d.get("_cuMomOk()")===true);
  const l=mk({}); const hl=l.pop("afternoon");
  ok("Dad locked: the pop-up opens, the rows show ○/✅, but nothing is a tap", !/mdKidTick/.test(hl)&&/>○</.test(hl)&&/Pickup kitchen/.test(hl));
  ok("…and a tick is refused", l.get("mdKidTick('afternoon','lucy','saturday',0)")===false&&l.calls.length===0&&l.get("_cuMomOk()")===false);
}
console.log("3. Wiring");
{ const KT=fn("mdCardKidsToday"), W=fn("rtWave");
  ok("KIDROWS2 2026-10-22: the 📋 lists pill and its panel are gone from the row (Mom's Day and Dad's Day alike)", !/mpKidListsToggle|mdKidListsHTML|mpKidOpen|📋 lists</.test(KT)&&!/function mdKidListsHTML\(|function mpKidListsToggle\(/.test(src));
  ok("…✕ today lives on every open pop-up row instead (kr2WaveBtnHTML → rtWave)", /\(_waveOk&&r\.i!=null&&!r\.done\)\?kr2WaveBtnHTML\(slot,kid,_d,r\.i,!!r\.wv\):''/.test(fn("boardStatPop")));
  ok("the ledger and the spot check stay Mom's Day only (not asked for)", /bank&&dadCtl===undefined&&typeof mdCardChoreLedger/.test(KT)&&/bank&&dadCtl===undefined&&typeof mdCardSpotCheck/.test(KT));
  ok("a wave: Mom or an unlocked Dad; logged as who waved", /!momHere\(\)&&!\(typeof dadAwardOk==="function"&&dadAwardOk\(\)\)\) return;/.test(W)&&/by:_by\}/.test(W)&&/waved by "\+\(_by==="dad"\?"Dad":"Mom"\)/.test(W));
  ok("mdKidTick's gate takes an unlocked Dad", /!momHere\(\)&&!\(typeof dadAwardOk==="function"&&dadAwardOk\(\)\)\) return false;/.test(fn("mdKidTick")));
  ok("no new Firebase write anywhere in this change (the pop-up block writes nothing)", !/db\.ref/.test(fn("boardStatPop")));
}
ok("no 🔀", src.indexOf("🔀")<0);
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
