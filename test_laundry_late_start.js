/*
 * 🫧 LL_LATESTART (her report 2026-10-23, 11:16 PM: Mom & Dad's clothes and Towels went in without a tap, and after 8 PM the laundry
 * schedule only offered ✓ Done — "There isn't a start. Start would be fine."). A replay of her Friday: cap 3, Mom & Dad's + Julian waiting
 * at the front, Towels on its home day, nothing tapped all day; at 9:30 PM all three show → tomorrow. 🫧 Start on one must do exactly what
 * it does before 8 PM — the laundry/<id> load (the machines card), the log under TODAY — and the re-lay takes it off tomorrow. Before 8 PM
 * and past days draw exactly as they did.  run: node test_laundry_late_start.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,400)+")":"")); } };
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("missing "+a); return src.slice(i,j); };
const fn=name=>{ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); let d=0; for(let k=src.indexOf("{",i);k<src.length;k++){ if(src[k]==="{") d++; else if(src[k]==="}"&&--d===0) return src.slice(i,k+1); } throw new Error("unbalanced "+name); };
const BLOCK=cut("// LAUNDRYLINE_START","// LAUNDRYLINE_END");
// The block as it was before LL_LATESTART: the two hooks taken back out, so "unchanged" is checked against the real old drawing.
const OLD=BLOCK.replace("sub+(llLateStartOK(r,id)?llLateStartBtn(id,by):'')+'<button onclick=\"llMarkDone(","sub+'<button onclick=\"llMarkDone(").replace("(!st&&!wtd&&(!mv||llLateStartOK(r,id)))?","(!st&&!wtd&&!mv)?");
const iso=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
const THU="2026-10-22", FRI="2026-10-23", SAT="2026-10-24";
const ITEMS={lincoln:{label:"Lincoln's clothes",emoji:"👕",order:0},ellis:{label:"Ellis's clothes",emoji:"👕",order:1},lucy:{label:"Lucy's clothes",emoji:"👗",order:2},
  julian:{label:"Julian's clothes",emoji:"👕",order:3,doer:"both"},momdad:{label:"Mom & Dad's clothes",emoji:"👫",order:4,doer:"both"},towels:{label:"Towels",emoji:"🛁",order:5,doer:"both"}};
// Her line at 11:10 PM (read-only): carry Mom & Dad's + Julian, next Towels, as of today, home days on; Friday's cap 3, Saturday's 2; nothing logged today.
const LINE={items:ITEMS,caps:{"0":3,"1":2,"2":2,"3":2,"4":3,"5":2,"6":2},carry:["momdad","julian"],next:"towels",asOf:FRI,homeFrom:"2026-10-18",log:{[THU]:{lincoln:{at:1,load:"old1"}}}};
function mk(o){
  o=o||{}; const writes=[], ls={};
  const ctx={console,Object,Array,String,Number,parseInt,Math,JSON,Date,
    HA_LS:{getItem:k=>ls[k]||null,setItem:(k,v)=>{ ls[k]=v; }},
    db:{ref:p=>({update:v=>writes.push(["update",p,JSON.parse(JSON.stringify(v))]),set:v=>writes.push(["set",p,JSON.parse(JSON.stringify(v))]),remove:()=>writes.push(["remove",p])})},
    _lbWrite:()=>!o.dry, isMom:!o.noMom, momHere:()=>ctx.isMom, _kioskD:()=>!!o.dad, kitPinGate:()=>{ ctx.gated=true; }, gated:false,
    calendarData:{holidays:{},vacations:{},kidOverrides:{}}, calNormDate:s=>s, laundryData:{},
    HA_IS_HOWE:o.fam?false:undefined, ROSTER:o.fam?["amy","ben"]:["lincoln","ellis","lucy","julian"],
    KID_NAME:o.fam?{amy:"Amy",ben:"Ben"}:{lincoln:"Lincoln",ellis:"Ellis",lucy:"Lucy",julian:"Julian"}, cap:s=>s.charAt(0).toUpperCase()+s.slice(1),
    _hhIsoLocal:ms=>iso(new Date(ms)), esc:s=>String(s==null?"":s), hhRender:()=>{}, mwToast:()=>{}, renderMomsPlan:()=>{}, document:{getElementById:()=>null},
    laundrySince:()=>"9:31", laundryDoneTxt:()=>"", laundryTimesEditorHTML:()=>"", momTipLaundryHTML:()=>"", laundryMeta:l=>["🫧",l.stage],
    writes};
  if(o.fam) delete ctx.HA_IS_HOWE;
  vm.createContext(ctx);
  if(o.fam) vm.runInContext("var HA_IS_HOWE=false;",ctx);
  // the machines card and the real Move button (laundryAdvance / its label); the washer's and dryer's questions are answered by the pick
  vm.runInContext(src.slice(src.indexOf("const LAUNDRY_STAGES"), src.indexOf("\n", src.indexOf("const LAUNDRY_STAGE_META")))+"\nconst LAUNDRY_WET_STAGES=LAUNDRY_STAGES;\n"
    +(o.old?OLD:BLOCK)+"\n"+fn("mdCardLaundry")+"\n"+fn("laundryAdvance")+"\n"+fn("laundryAdvanceLabel")+"\n"+fn("laundryBasketLeavingDryer")
    +"\nfunction laundryBasketAsk(id){ __asked.push(['basket',id]); }\nvar __asked=[];"
    +"\nfunction laundrySplitAsk(id,l,pick){ if(l.stage==='washer'&&pick!=='dryer'){ __asked.push(['where',id]); return true; } return false; }",ctx);
  ctx.setNow=(day,min)=>vm.runInContext("llToday=function(){ return '"+day+"'; }; llNowMin=function(){ return "+min+"; };",ctx);
  ctx.setNow(o.day||FRI,o.min==null?21*60+30:o.min);
  vm.runInContext("laundryLine="+JSON.stringify(o.line||LINE)+";",ctx);
  ctx.get=e=>vm.runInContext(e,ctx); return ctx;
}
const cells=(c,today,close,mom,by)=>c.llWeekGridHTML(today,close,mom,by).split('border-radius:8px;padding:4px 1px').slice(1);   // Mon … Sun
const FRI_I=4, SAT_I=5;
const proj=(c,n)=>c.get("llProject('"+c.get("llToday()")+"',"+(n||2)+",llNowMin()>=LL_SWEEP_MIN)");

console.log("1. 9:30 PM, nothing tapped all day: today's loads slid → tomorrow, and each still has 🫧 Start (with ✓ Done)");
{ const c=mk(), r=proj(c)[0];
  ok("the replay: Friday is Mom & Dad's, Julian, Towels — all three moved", r.loads.join()==="momdad,julian,towels"&&r.moved.join()==="momdad,julian,towels", r);
  const e=cells(c,FRI,true,true), t=e[FRI_I];
  ok("today's cell (Mom): → Mom & Dad's and → Towels, each with 🫧 Start AND ✓ Done", /→ Mom &amp; Dad|→ Mom & Dad/.test(t)&&/llStart\('momdad'\)/.test(t)&&/llMarkDone\('momdad'\)/.test(t)&&/llStart\('towels'\)/.test(t)&&/llMarkDone\('towels'\)/.test(t), t);
  ok("…Start comes before Done in each cell, and the slid load still looks slid (faded, →)", t.indexOf("llStart('momdad')")<t.indexOf("llMarkDone('momdad')")&&/opacity:\.45/.test(t));
  ok("tomorrow's cell: no Start — only today's loads start", !/llStart\(/.test(e[SAT_I]), e[SAT_I]);
  ok("a kid's device (not Mom): no Start, no Done — the same rule as before 8 PM", !/llStart\(|llMarkDone\(/.test(cells(c,FRI,true,false)[FRI_I]));
  ok("Dad's link (his grid): Start is his", /llStart\('momdad','dad'\)/.test(cells(c,FRI,true,true,"dad")[FRI_I]));
  const m=c.get("llDadCardHTML('mom',true)");
  ok("Mom's 🏡 My day rows: Mom & Dad's → tomorrow with ✓ Done and 🫧 Start, as Mom", /→ tomorrow/.test(m)&&/llMarkDone\('momdad','mom'\)/.test(m)&&/llStart\('momdad','mom'\)/.test(m)&&/llStart\('towels','mom'\)/.test(m), m.slice(0,400));
  ok("Dad's 🏡 My day rows: the same, as Dad", /llStart\('towels','dad'\)/.test(mk({noMom:true,dad:true}).get("llDadCardHTML('dad',true)")));
}
console.log("2. 🫧 Start at 9:30 PM = Start before 8 PM: the load, today's log, off tomorrow");
{ const c=mk(); c.llStart("momdad");
  const lids=Object.keys(c.laundryData), lid=lids[0], l=c.laundryData[lid];
  ok("one laundry/<id> load in the washer, linked to the line, lineDay TODAY", lids.length===1&&l.stage==="washer"&&l.line==="momdad"&&l.lineDay===FRI&&l.label==="Mom & Dad's clothes", c.laundryData);
  ok("logged under TODAY'S date, as Mom", c.get("laundryLine.log['"+FRI+"'].momdad.load")===lid&&c.get("laundryLine.log['"+FRI+"'].momdad.by")==="mom");
  ok("writes: exactly laundry/<id> (set) + laundryLine log/<today>/momdad (update) — targeted, nothing else", c.writes.length===2&&c.writes[0][0]==="set"&&c.writes[0][1]==="laundry/"+lid
    &&c.writes[1][0]==="update"&&c.writes[1][1]==="laundryLine"&&Object.keys(c.writes[1][2]).join()==="log/"+FRI+"/momdad", c.writes);
  const p=proj(c);
  ok("today: Mom & Dad's is started (✓), not moved", p[0].started.indexOf("momdad")>=0&&p[0].moved.indexOf("momdad")<0, p[0]);
  ok("tomorrow: Mom & Dad's is OFF the line (what started leaves the line)", p[1].loads.indexOf("momdad")<0, p[1].loads);
  const t=cells(c,FRI,true,true)[FRI_I];
  ok("today's cell: ✓ Mom & Dad's, no Start on it; Towels still has Start", /✓<\/span> Mom/.test(t)&&!/llStart\('momdad'\)/.test(t)&&/llStart\('towels'\)/.test(t), t);
  ok("the machines card has it, with its Move button", /Mom & Dad's clothes/.test(c.get("mdCardLaundry(true,true)"))&&c.get("mdCardLaundry(true,true)").indexOf("laundryAdvance('"+lid+"')")>=0);
  ok("a second tap does nothing (already started today)", (c.llStart("momdad"),Object.keys(c.laundryData).length===1));
  c.llStart("towels"); const q=proj(c);
  ok("Towels too: both started today, tomorrow has neither", q[0].started.join()==="momdad,towels"&&q[1].loads.indexOf("momdad")<0&&q[1].loads.indexOf("towels")<0, q.map(x=>[x.started,x.loads]));
  ok("only Julian still slides to tomorrow", q[0].moved.join()==="julian"&&q[1].loads[0]==="julian", q.map(x=>x.loads));
  // the roll: Saturday morning saves where the line stands — neither started load is carried
  c.writes.length=0; c.setNow(SAT,7*60); c.get("llRoll()");
  const roll=c.writes.find(w=>w[1]==="laundryLine"&&w[2].asOf===SAT);
  ok("Saturday's roll: carry has Julian, not Mom & Dad's or Towels", roll&&roll[2].carry&&roll[2].carry.indexOf("julian")>=0&&roll[2].carry.indexOf("momdad")<0&&roll[2].carry.indexOf("towels")<0, roll);
  const sp=proj(c)[0]; ok("Saturday's lay: neither shows up again", sp.loads.indexOf("momdad")<0&&sp.loads.indexOf("towels")<0, sp.loads);
}
console.log("3. Where it is: the machines card moves a just-started load straight on — no waiting on the timers");
{ const c=mk(); c.llStart("towels"); c.llStart("momdad"); const [tw,md]=Object.keys(c.laundryData);
  ok("the advance button has no clock in it (laundryAdvance never reads the wash/dry minutes)", !/laundryT\(|\.ts\s*[<>]/.test(fn("laundryAdvance")));
  ok("the washer's button reads → Dryer", c.get("laundryAdvanceLabel('washer',laundryData['"+tw+"'])")==="→ Dryer");
  c.get("laundryAdvance('"+tw+"')"); ok("→ Dryer asks where it's going first (nothing moves yet)", c.get("__asked.length")===1&&c.laundryData[tw].stage==="washer");
  c.get("laundryAdvance('"+tw+"','dryer')"); ok("🌀 Into the dryer: Towels in the dryer, the same minute it started", c.laundryData[tw].stage==="dryer");
  c.get("laundryAdvance('"+md+"','dryer')"); c.get("laundryAdvance('"+md+"')");
  ok("Mom & Dad's: → Dryer, then Folded ✓ asks Fold now / Basket", c.laundryData[md].stage==="dryer"&&c.get("__asked.some(a=>a[0]==='basket')"));
  c.get("laundryAdvance('"+md+"','basket')"); ok("🧺 Basket: out of the dryer, waiting to be folded (its button: Folded ✓)", c.laundryData[md].stage==="basket"&&c.get("laundryAdvanceLabel('basket',laundryData['"+md+"'])")==="Folded ✓");
  ok("still linked to today's line the whole way", c.laundryData[md].line==="momdad"&&c.laundryData[md].lineDay===FRI&&proj(c)[0].started.indexOf("momdad")>=0);
}
console.log("4. Before 8 PM, past days, ✓ Done — exactly as before");
{ const html=(o,f)=>{ const c=mk(o); return f(c); };
  const views=[["7:59 PM, today's grid",{min:19*60+59},c=>c.llWeekGridHTML(FRI,false,true)],["7:59 PM, Dad's grid",{min:19*60+59},c=>c.llWeekGridHTML(FRI,false,true,"dad")],
    ["7:59 PM, My day rows",{min:19*60+59},c=>c.get("llDadCardHTML('mom',true)")],["10 AM, kid's grid",{min:600},c=>c.llWeekGridHTML(FRI,false,false)],
    ["Saturday morning: Friday (past) and Saturday",{day:SAT,min:8*60},c=>c.llWeekGridHTML(SAT,false,true)],["Saturday 9:30 PM grid, Friday past",{day:SAT,min:21*60+30},c=>cells(c,SAT,true,true)[FRI_I]],
    ["9:30 PM, a kid's grid",{},c=>c.llWeekGridHTML(FRI,true,false)]];
  views.forEach(v=>{ const a=html(v[1],v[2]), b=html(Object.assign({old:true},v[1]),v[2]); ok(v[0]+": drawn byte-for-byte as before", a===b, [a.length,b.length]); });
  ok("(the old drawing really is the old one: at 9:30 PM it had no Start on the slid loads, in the grid or My day)", !/llStart\(/.test(cells(mk({old:true}),FRI,true,true)[FRI_I])&&!/llStart\(/.test(mk({old:true}).get("llDadCardHTML('mom',true)"))&&OLD.indexOf("?llLateStartBtn(")<0&&OLD.indexOf("||llLateStartOK(")<0);
  const c=mk({min:19*60+59}), t=cells(c,FRI,false,true)[FRI_I];
  ok("7:59 PM: not moved — the usual Start + Done", proj(c)[0].moved.length===0&&/llStart\('momdad'\)/.test(t)&&/llMarkDone\('momdad'\)/.test(t)&&!/→ /.test(t));
  const s=mk({day:SAT,min:21*60+30}), past=cells(s,SAT,true,true)[FRI_I];
  ok("a past day never offers Start or Done", !/llStart\(|llMarkDone\(/.test(past), past);
  ok("llLateStartOK: a past day's row says no", s.llLateStartOK(mk().llProject(FRI,1,true)[0],"momdad")===false);
  const d=mk(); d.llMarkDone("towels");
  ok("✓ Done at 9:30 PM is unchanged: done today, no load in the machines", d.get("laundryLine.log['"+FRI+"'].towels.done")===true&&!Object.keys(d.laundryData).length);
  const wt=mk({line:Object.assign({},LINE,{cover:{[FRI]:{julian:"wait"}}})}), wr=wt.llProject(FRI,1,true)[0];
  ok("a load set to ⏸ wait a day gets no Start", wr.waited.indexOf("julian")>=0&&!wt.llLateStartOK(wr,"julian")&&!/llStart\('julian'\)/.test(cells(wt,FRI,true,true)[FRI_I]));
}
console.log("5. Any family, dry run, no new write path");
{ const F={items:{amy:{label:"Amy's clothes",emoji:"👕",order:0},towels:{label:"Towels",emoji:"🛁",order:1}},caps:{"0":1,"1":1,"2":1,"3":1,"4":1,"5":1,"6":1},mode:"rotate",next:"amy",asOf:FRI};
  const c=mk({fam:true,line:F}), t=cells(c,FRI,true,true)[FRI_I];
  ok("another family's slid load (Amy's) shows 🫧 Start too — nothing named", /→ Amy/.test(t)&&/llStart\('amy'\)/.test(t), t);
  const dr=mk({dry:true}); dr.llStart("momdad"); ok("?dryrun=1: Start writes nothing", dr.writes.length===0);
  const B=cut("// LL_LATESTART_START","// LL_LATESTART_END");
  ok("the block writes nothing of its own (Start is llStart — no .ref/.set/.update)", !/\.ref\(|\.set\(|\.update\(/.test(B));
  ok("the to-do chips and the 8 PM hour are untouched", /function llTdChip\(/.test(BLOCK)&&/LL_SWEEP_MIN=20\*60/.test(BLOCK)&&OLD!==BLOCK);
}
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
