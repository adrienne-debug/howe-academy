/*
 * 🧺 LAUNDRY_CYCLE part 1 — the engine (her ask 2026-10-16: "a custom wash cycle … pre wash, wash, dry, air dry, or a custom and then
 * time for each"; air dry → "remind me, then fold pile"). A load with cycle:[{k,m,n}] + step walks its own steps, on its own minutes,
 * then the fold pile → put away; nudges, the advance button, ↶ back, ✎ edit, the kid moves and Mom's / Dad's schedules follow it. A load
 * with no cycle is untouched.  run: node test_laundry_cycle.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,400)+")":"")); } };
const fn=name=>{ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); let d=0; for(let k=src.indexOf("{",i);k<src.length;k++){ if(src[k]==="{") d++; else if(src[k]==="}"&&--d===0) return src.slice(i,k+1); } throw new Error("unbalanced "+name); };
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("missing "+a); return src.slice(i,j); };
const CORE=cut("const LAUNDRY_STAGES=","// LAUNDRY_NUDGE_END");
const MORE=["_cuRe","laundryBackStage","_cuStageName","_cuCycleMin","_cuDropBlock","laundryBack","laundryKidMovePick","laundryKidMove","_leHM","_leRe","_leCycleTok","_leCycleOpts","laundryEditSheetHTML","laundryEditSave",
  "laundryBlockStep","laundryBlockDefault","momBlockKey","momBlockFor","_lbMin","_lbQ","_lbBtn","_lbQBtn","_lbNotLoadBtn","momSchedNextMom","momSchedLaundry","dadSchedLaundry","_lbBox"].map(fn).join("\n")
  +"\nconst LAUNDRY_KIDMOVE_FROM={dryer:\"washer\",fold:\"dryer\",putaway:\"fold\"};\nconst LAUNDRY_EDIT_STAGES=[\"bin\",\"prewash\",\"washer\",\"dryer\",\"fold\"];\nconst LAUNDRY_FOLDED_BTN=\"Folded ✓\";\nlet laundryEditId=null, _lbWhenOpen={}, _mlBlkLaid={}, momBlocks={}, laundryBlockMins={};";
const T0=new Date(2026,9,17,9,0).getTime();
function mk(loads,o){
  o=o||{}; const writes=[], ls={}, els={};
  const ctx={console,Object,Array,String,Number,parseInt,Math,JSON,Date,RegExp,
    HA_LS:{getItem:k=>ls[k]||null,setItem:(k,v)=>{ ls[k]=v; }},
    db:{ref:p=>({set:v=>writes.push(["set",p,JSON.parse(JSON.stringify(v))]),update:v=>writes.push(["update",p,JSON.parse(JSON.stringify(v))]),remove:()=>writes.push(["rm",p])})},
    _dryRun:()=>false, _lbWrite:()=>true, _wtWrite:()=>true, momHere:()=>true, _cuMomOk:()=>true, kitPinGate:()=>{}, confirm:()=>true,
    document:{getElementById:id=>els[id]||null}, els, laundryData:loads, laundryTimes:{}, renderMomsPlan:()=>{}, renderAll:()=>{}, mwToast:()=>{},
    laundrySince:ts=>{ const d=new Date(ts); return d.getHours()+":"+String(d.getMinutes()).padStart(2,"0"); }, esc:s=>String(s==null?"":s), cap:s=>s.charAt(0).toUpperCase()+s.slice(1),
    mwTodayIso:()=>"2026-10-17", _todayDay:"saturday", tab:"moms-plan", momBlocksOnValue:()=>{}, coSchoolEnd:()=>16*60+15, fromMin:m=>String(m), toMin:t=>null, checked:{}, KID_NAME:{}, writes};
  vm.createContext(ctx); vm.runInContext(CORE+"\n"+MORE,ctx);
  vm.runInContext("_lbNowMin=function(){ return "+(o.nowMin==null?600:o.nowMin)+"; };",ctx);
  ctx.get=e=>vm.runInContext(e,ctx); return ctx;
}
const wet=()=>({label:"💦 Towels",stage:"bin",bin:true,wet:true,ts:T0,cycle:[{k:"prewash",m:45},{k:"wash",m:50},{k:"airdry",m:300}]});
const plain=()=>({label:"Towels",stage:"washer",ts:T0});

console.log("1. The steps");
{ const c=mk({}); const S=[{k:"wash"},{k:"custom",n:"Soak",m:20},{k:"wash"},{k:"dry"},{k:"airdry"}];
  ok("stage per step: wash before another wash → prewash; soak → custom; last wash → washer; dry → dryer; air dry → airdry", [0,1,2,3,4].map(i=>c.lcStageOf(S,i)).join()==="prewash,custom,washer,dryer,airdry");
  ok("no time given: wash = the washer time (60), dry = the dryer time (60), air dry 6 hrs, custom 30", c.lcMins({k:"wash"})===60&&c.lcMins({k:"dry"})===60&&c.lcMins({k:"airdry"})===360&&c.lcMins({k:"custom"})===30&&c.lcMins({k:"custom",m:20})===20);
  ok("a custom step says its own name", c.lcStepName({k:"custom",n:"Soak"})==="Soak"&&c.lcStepName({k:"airdry"})==="Air dry");
  ok("Firebase's {0:…,1:…} for the cycle reads the same", c.lcSteps({cycle:{0:{k:"wash"},1:{k:"dry"}}}).length===2);
}
console.log("2. A wet towel load: bin → Prewash 45 → Wash 50 → Air dry 5 hrs → fold → put away");
{ const L={t:wet()}, c=mk(L);
  ok("in the bin: the button says ▶ Start: Prewash", c.laundryAdvanceLabel("bin",L.t)==="▶ Start: Prewash");
  c.laundryAdvance("t"); ok("tap: prewash, step 0, a whole-record set like any advance", L.t.stage==="prewash"&&L.t.step===0&&c.writes[0][0]==="set"&&c.writes[0][1]==="laundry/t");
  ok("its clock: done 45 min after it went in", c.laundryDoneAt(Object.assign({},L.t,{ts:T0}))===T0+45*60000);
  ok("the button: → Wash", c.laundryAdvanceLabel(L.t.stage,L.t)==="→ Wash");
  c.laundryAdvance("t"); ok("→ the wash (washer, step 1), 50 min", L.t.stage==="washer"&&L.t.step===1&&c.laundryDoneAt(Object.assign({},L.t,{ts:T0}))===T0+50*60000);
  ok("the button: → Air dry (not → Dryer)", c.laundryAdvanceLabel(L.t.stage,L.t)==="→ Air dry");
  c.laundryAdvance("t"); ok("→ air dry (stage airdry, step 2), 5 hrs; the button Folded ✓", L.t.stage==="airdry"&&L.t.step===2&&c.laundryDoneAt(Object.assign({},L.t,{ts:T0}))===T0+300*60000&&c.laundryAdvanceLabel(L.t.stage,L.t)==="Folded ✓");
  c.laundryAdvance("t"); ok("→ the fold pile (step past the end)", L.t.stage==="fold"&&L.t.step===3&&c.laundryAdvanceLabel(L.t.stage,L.t)==="✓ Put away");
  c.laundryAdvance("t"); ok("✓ put away: gone, as always", !L.t&&c.writes[c.writes.length-1][0]==="rm");
}
console.log("3. Reminders on each step's own time");
{ const L={t:Object.assign(wet(),{stage:"airdry",step:2,ts:T0})}, c=mk(L);
  ok("air dry, 4 hrs in: nothing yet", c.laundryNudgeKind(L.t,T0+240*60000)==="");
  ok("air dry, 5 hrs + 30 min: 'it should be dry; fold it' with Folded ✓", c.laundryNudgeKind(L.t,T0+331*60000)==="airdry"&&/has been air drying since .* — it should be dry; fold it/.test(c.laundryNudgeRowHTML({id:"t",l:L.t,kind:"airdry"}))&&/>Folded ✓</.test(c.laundryNudgeRowHTML({id:"t",l:L.t,kind:"airdry"})));
  const s={label:"Rug",stage:"custom",step:0,ts:T0,cycle:[{k:"custom",n:"Soak",m:20},{k:"wash"}]};
  ok("a 20-min Soak: reminds at 50 min, names the step, → Wash", c.laundryNudgeKind(s,T0+49*60000)===""&&c.laundryNudgeKind(s,T0+50*60000)==="custom"&&/Rug<\/b> — Soak since/.test(c.laundryNudgeRowHTML({id:"s",l:s,kind:"custom"}))&&/>→ Wash</.test(c.laundryNudgeRowHTML({id:"s",l:s,kind:"custom"})));
  const d={label:"Sheets",stage:"dryer",step:0,ts:T0,cycle:[{k:"dry",m:40},{k:"airdry",m:120}]};
  ok("a dry step that isn't the last: the button is → Air dry, not Folded ✓", c.laundryNudgeKind(d,T0+70*60000)==="dryer"&&/>→ Air dry</.test(c.laundryNudgeRowHTML({id:"d",l:d,kind:"dryer"})));
}
console.log("4. ↶ back, ✎ edit, the kid moves");
{ const L={t:Object.assign(wet(),{stage:"airdry",step:2,ts:T0})}, c=mk(L);
  ok("↶ from air dry: back to the wash", c.laundryBackStage(L.t)==="washer");
  c.laundryBack("t"); ok("…stage washer, step 1, one update with the step", L.t.stage==="washer"&&L.t.step===1&&c.writes.some(w=>w[0]==="update"&&w[2].step===1));
  c.laundryBack("t"); c.laundryBack("t"); ok("↶ ↶: prewash, then the bin it started in (step gone)", L.t.stage==="bin"&&L.t.step===undefined);
  ok("nowhere further back", c.laundryBackStage(L.t)===null);
  c.get("laundryEditId='t'"); const sh=c.laundryEditSheetHTML("t");
  ok("✎ Stage lists the load's own steps + the bin + the fold pile", /value="s0"[^>]*>🫧 Prewash \(1 of 3\)/.test(sh)&&/value="s2"[^>]*>🌬 Air dry \(3 of 3\)/.test(sh)&&/value="bin" selected/.test(sh)&&/value="fold"/.test(sh));
  c.els["le-stage-t"]={value:"s2"}; c.writes.length=0; c.laundryEditSave("t");
  ok("pick Air dry: stage airdry, step 2, the clock starts now", L.t.stage==="airdry"&&L.t.step===2&&c.writes[0][2].stage==="airdry"&&c.writes[0][2].step===2&&c.writes[0][2].ts>T0, c.writes);
  const K={k:{label:"Lincoln's clothes",stage:"washer",step:0,ts:T0,cycle:[{k:"wash"},{k:"airdry"}]}}, k=mk(K);
  k.laundryKidMove("lincoln","dryer"); ok("a kid's '→ dryer' step on a wash-then-air-dry load: it goes to air dry", K.k.stage==="airdry"&&K.k.step===1&&k.writes[0][2].step===1);
  ok("…and '→ fold pile' finds it in air dry", k.laundryKidMovePick("fold")==="k");
}
console.log("5. Mom's and Dad's schedules");
{ const L={t:Object.assign(wet(),{stage:"airdry",step:2,ts:(function(){ const d=new Date(); d.setHours(8,0,0,0); return d.getTime(); })()})}, c=mk(L,{nowMin:14*60});
  const h=c.momSchedLaundry("saturday",[]).map(r=>r.html).join("|");
  ok("Mom: the air-dry row and 'Air dry done. Block out time to fold it?'", /🌬 <b>💦 Towels<\/b> — Air dry \(3 of 3\)/.test(h)&&/Air dry done\. Block out time to fold it\?/.test(h), h.slice(0,600));
  const W={w:{label:"Rug",stage:"custom",step:0,ts:(function(){ const d=new Date(); d.setHours(8,0,0,0); return d.getTime(); })(),cycle:[{k:"custom",n:"Soak",m:20},{k:"wash"}]}}, w=mk(W,{nowMin:14*60});
  ok("Mom: a Soak done asks to start the wash", /Soak done\. Block out time to start wash\?/.test(w.momSchedLaundry("saturday",[]).map(r=>r.html).join("|")));
  ok("the air-dry block is a fold block (her fold minutes)", c.laundryBlockStep("airdry")==="fold");
  const D={d:Object.assign(wet(),{stage:"airdry",step:2,by:"dad",ts:Date.now()-6*3600*1000})}, d=mk(D,{nowMin:14*60});
  ok("Dad's schedule: his air-dry load shows, then '— Air dry done'", /air dry \(3 of 3\)/i.test(d.dadSchedLaundry().map(r=>r.html).join("|"))&&/Air dry done/.test(d.dadSchedLaundry().map(r=>r.html).join("|")), d.dadSchedLaundry().map(r=>r.html));
}
console.log("6. A load with no cycle is exactly as before");
{ const L={p:plain()}, c=mk(L);
  ok("→ Dryer / 60 min / laundryMeta = In the washer", c.laundryAdvanceLabel("washer",L.p)==="→ Dryer"&&c.laundryDoneAt(L.p)===T0+60*60000&&c.laundryMeta(L.p)[1]==="In the washer");
  c.laundryAdvance("p"); ok("advance: the washer asks where first (LAUNDRY_SPLIT 2026-10-22) — nothing moved yet", L.p.stage==="washer");
  c.get("laundrySplitWhereAnswer('dryer')"); ok("advance: washer → dryer, no step field", L.p.stage==="dryer"&&L.p.step===undefined);
  const B={b:{label:"💦 Towels",stage:"bin",wet:true,ts:T0}}, b=mk(B); b.laundryAdvance("b"); b.laundryAdvance("b");
  ok("an old wet load: bin → prewash → washer, as before", B.b.stage==="washer"&&B.b.step===undefined);
}
ok("no 🔀", src.indexOf("🔀")<0);
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
