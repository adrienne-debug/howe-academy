/*
 * 🧺 LAUNDRYEDIT + the dryer block's "Folded ✓" + Dad's loads on Mom's schedule (AUDIT_laundry_2026-10-15 holes 7, 12, 2, 8).
 *   (1) ✎ Edit a load (her yes 2026-10-15: "would I also be able to edit loads"): Mom only. Name · Stage · Started at · Whose ·
 *       Wet. Save = ONE targeted update on laundry/<id>; a stage change removes that load's Mom blocks (old + new stage) the way
 *       ↶ laundryBack does. Dry run writes nothing.
 *   (2) The dryer block's button (and the NOW nudge's) reads "Folded ✓" — tapped when folding is done. Text only.
 *   (3) A by:"dad" load on Mom's schedule is information only: the started marker and the "done in the …" row, no question,
 *       no button. Mom's Day Laundry card keeps its buttons.
 * Nothing changes on a kid's page: every piece here is Mom's Day's Laundry card or the Mom-mode schedule.
 *                                                                                                run: node test_laundry_edit.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,600)+")":"")); } };
function slice(name){ const sig="function "+name+"("; const i=src.indexOf(sig); if(i<0) throw new Error("not found: "+name); let d=0; for(let k=src.indexOf("{",i);k<src.length;k++){ if(src[k]==="{")d++; else if(src[k]==="}"){ d--; if(d===0) return src.slice(i,k+1);} } throw new Error("unbalanced: "+name); }
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("missing "+a); return src.slice(i,j); };
const LCONST=cut("const LAUNDRY_STAGES=","const LAUNDRY_STALE_MIN");
const LTIMES=cut("// 🧺 LAUNDRYTIMES (her ask","function laundryEditToggle(");
const MS=cut("// MOMSCHED_LAUNDRY_START","// MOMSCHED_LAUNDRY_END");
const CU=cut("// CHOREUNDO_START","// CHOREUNDO_END");
const LE=cut("// LAUNDRYEDIT_START","// LAUNDRYEDIT_END");
const MIDNIGHT=(()=>{ const d=new Date(); d.setHours(0,0,0,0); return d.getTime(); })();
const at=m=>MIDNIGHT+m*60000, H=(h,m)=>h*60+(m||0);
const ISO=(()=>{ const d=new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); })();

function mk(o){
  o=o||{}; const ls={}, writes=[], toasts=[], renders=[], inputs={};
  const ctx={console,Object,Array,String,Number,parseInt,isNaN,Math,JSON,RegExp,
    HA_LS:{getItem:k=>(k in ls)?ls[k]:null,setItem:(k,v)=>{ ls[k]=v; }}, _dryRun:()=>!!o.dry,
    db:{ref:p=>({set:v=>writes.push(["set",p,JSON.parse(JSON.stringify(v))]),update:v=>writes.push(["update",p,JSON.parse(JSON.stringify(v))]),remove:()=>writes.push(["rm",p])})},
    ROSTER:["lincoln","ellis","lucy","julian"], KID_NAME:{lincoln:"Lincoln",ellis:"Ellis",lucy:"Lucy",julian:"Julian"},
    cap:s=>String(s||"").charAt(0).toUpperCase()+String(s||"").slice(1), esc:s=>String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/"/g,"&quot;"),
    laundryData:o.laundry||{}, momHere:()=>!o.notMom, tab:o.tab||"moms-plan", checked:{}, coSchoolEnd:()=>H(16,15),
    toMin:t=>{ const m=/^(\d{1,2}):(\d{2})\s*(AM|PM)$/.exec(t||""); if(!m) return null; let h=+m[1]%12; if(m[3]==="PM") h+=12; return h*60+(+m[2]); },
    fromMin:m=>{ const h=Math.floor(m/60), mm=m%60; return ((h%12)||12)+":"+String(mm).padStart(2,"0")+" "+(h<12?"AM":"PM"); },
    laundryTimesEditorHTML:()=>"", mwTodayIso:()=>ISO, mwToast:t=>toasts.push(t), renderMomsPlan:()=>renders.push("plan"), renderAll:()=>renders.push("all"),
    document:{getElementById:id=>(id==="content")?{}:(inputs[id]||null)}, writes, toasts, renders, inputs, _todayDay:"thursday"};
  class FakeDate extends Date { constructor(...a){ if(a.length) super(...a); else super(FakeDate.now()); } static now(){ return at(ctx._nowM); } }
  ctx.Date=FakeDate; ctx._nowM=o.nowMin||H(10,0); ctx._mlNowMin=()=>ctx._nowM;
  vm.createContext(ctx);
  vm.runInContext(LCONST+"\n"+LTIMES+"\n"+MS+"\n"+CU+"\n"+LE+"\n"+slice("laundrySince")+"\n"+slice("laundryAdvance")+"\n"+slice("laundryAdvanceLabel")+"\n"+slice("laundryDel")+"\n"+slice("mdCardLaundry")
    +"\nlaundryTimes={wash:50,dry:60,grace:5};laundryBlockMins={move:5,fold:15};"+(o.blocks?"momBlocks="+JSON.stringify(o.blocks)+";":""),ctx);
  const T={ctx,writes,toasts,renders,inputs,run:e=>vm.runInContext(e,ctx)};
  T.card=()=>T.run("mdCardLaundry(true)");
  T.sched=()=>T.run("momSchedLaundry('thursday',[]).map(function(r){return r.html;}).join('\\n')");
  // fill the open sheet's fields the way she would (only the ones given; the rest stay as drawn)
  T.fill=(id,f)=>{ const k=String(id).replace(/[^A-Za-z0-9_-]/g,"_"), H0=T.card();
    const val=n=>{ const m=new RegExp('id="le-'+n+'-'+k+'"[^>]*value="([^"]*)"').exec(H0); return m?m[1]:""; };
    const sel=n=>{ const i=H0.indexOf('id="le-'+n+'-'+k+'"'); const seg=H0.slice(i,H0.indexOf('</select>',i)); const m=/<option value="([^"]*)" selected>/.exec(seg); return m?m[1]:""; };
    const wet=new RegExp('id="le-wet-'+k+'"[^>]*checked').test(H0);
    inputs['le-name-'+k]={value:("name" in f)?f.name:val("name")}; inputs['le-stage-'+k]={value:("stage" in f)?f.stage:sel("stage")};
    inputs['le-ts-'+k]={value:("ts" in f)?f.ts:val("ts")}; inputs['le-by-'+k]={value:("by" in f)?f.by:sel("by")}; inputs['le-wet-'+k]={checked:("wet" in f)?f.wet:wet}; };
  return T;
}
const LID="lk_week7_thursday_lucy_mstep8";
const LUCY=()=>({[LID]:{label:"Lucy started laundry",stage:"washer",ts:at(H(9,39)),by:"lucy"}});

console.log("── (1) ✎ on the Laundry card is Mom's; the sheet ──");
{ const T=mk({laundry:LUCY()});
  ok("Mom: the load row carries ✎ (laundryEditLoad)", new RegExp("laundryEditLoad\\('"+LID+"'\\)[^>]*>✎<").test(T.card()), T.card());
  ok("…the sheet is closed until she taps it", !/laundry-edit/.test(T.card()));
  T.run("laundryEditLoad('"+LID+"')"); const C=T.card();
  ok("✎ opens the sheet under that load (and repaints Mom's Day)", /class="laundry-edit"/.test(C)&&T.renders.includes("plan"));
  ok("Name field holds the load's name", new RegExp('id="le-name-'+LID+'"[^>]*value="Lucy started laundry"').test(C), C);
  ok("Stage: bin · prewash · washer · dryer · fold pile, washer selected", /value="bin"/.test(C)&&/value="prewash"/.test(C)&&/value="washer" selected/.test(C)&&/value="dryer"/.test(C)&&/value="fold">🧺 Fold pile/.test(C), C);
  ok("Started at = 09:39 (a time field)", new RegExp('id="le-ts-'+LID+'" type="time" value="09:39"').test(C), C);
  ok("Whose: Mom · Dad · Lincoln · Ellis · Lucy · Julian, Lucy selected", /value="mom">Mom/.test(C)&&/value="dad">Dad/.test(C)&&/value="lincoln">Lincoln/.test(C)&&/value="julian">Julian/.test(C)&&/value="lucy" selected>Lucy/.test(C), C);
  ok("💦 Wet checkbox, off for a dry load", new RegExp('id="le-wet-'+LID+'" type="checkbox">').test(C), C);
  ok("Save and Cancel", new RegExp("laundryEditSave\\('"+LID+"'\\)[^>]*>Save<").test(C)&&/>Cancel</.test(C));
  T.run("laundryEditLoad('"+LID+"')"); ok("tapping ✎ again (or Cancel) closes it", !/laundry-edit/.test(T.card()));
}
{ const T=mk({laundry:LUCY(),notMom:true}); T.run("laundryEditLoad('"+LID+"')");
  ok("not Mom: no ✎, the sheet never opens", !/laundryEditLoad/.test(T.card())&&!/laundry-edit/.test(T.card())&&T.run("laundryEditId")===null);
  T.inputs["le-name-"+LID]={value:"X"}; ok("not Mom: laundryEditSave writes nothing", T.run("laundryEditSave('"+LID+"')")===null&&T.writes.length===0);
}

console.log("── each field saves — one targeted update on laundry/<id> ──");
{ const T=mk({laundry:LUCY(),nowMin:H(10,0)}); T.run("laundryEditLoad('"+LID+"')");
  T.fill(LID,{name:"Towels"}); T.run("laundryEditSave('"+LID+"')");
  ok("Name → Towels: update laundry/<id> {label} only", T.writes.length===1&&T.writes[0][0]==="update"&&T.writes[0][1]==="laundry/"+LID&&JSON.stringify(T.writes[0][2])==='{"label":"Towels"}'&&T.ctx.laundryData[LID].label==="Towels", T.writes);
  ok("…the sheet closes, a toast says so", T.run("laundryEditId")===null&&T.toasts.some(t=>/Towels updated/.test(t)));
}
{ // hole 7: Lucy's batch check-off at 9:39; the load really went in at 9:05
  const T=mk({laundry:LUCY(),nowMin:H(10,0)}); T.run("laundryEditLoad('"+LID+"')");
  T.fill(LID,{ts:"09:05"}); T.run("laundryEditSave('"+LID+"')");
  ok("Started at 09:05 → update {ts: today 9:05} only; stage, by kept", T.writes.length===1&&JSON.stringify(T.writes[0][2])===JSON.stringify({ts:at(H(9,5))})&&T.ctx.laundryData[LID].stage==="washer"&&T.ctx.laundryData[LID].by==="lucy", T.writes);
  const S=T.sched();
  ok("…the schedule's ✅ question now lands at 9:55 (9:05 + wash 50), not 10:29", /✅ <b>Lucy started laundry<\/b> is done in the washer\. Block out time/.test(S)&&/started 9:05 AM/.test(S), S);
}
{ // hole 12: the quick wash went quiet early — set started-at back so done = now
  const T=mk({laundry:LUCY(),nowMin:H(10,0)});
  ok("before: ⏳ done ~10:29, no question", /⏳ <b>Lucy started laundry<\/b> — done ~10:29 AM/.test(T.sched())&&!/Block out time/.test(T.sched()), T.sched());
  T.run("laundryEditLoad('"+LID+"')"); T.fill(LID,{ts:"09:10"}); T.run("laundryEditSave('"+LID+"')");
  ok("done early: Started at 09:10 → the question is there at 10:00", /Block out time to move it to the dryer\?/.test(T.sched()), T.sched());
}
{ const T=mk({laundry:LUCY(),nowMin:H(10,0)}); T.run("laundryEditLoad('"+LID+"')");
  T.fill(LID,{ts:"10:30"}); ok("Started at later than now: refused, nothing written", T.run("laundryEditSave('"+LID+"')")===null&&T.writes.length===0&&T.ctx.laundryData[LID].ts===at(H(9,39)));
}
{ const T=mk({laundry:LUCY()}); T.run("laundryEditLoad('"+LID+"')");
  T.fill(LID,{by:"dad"}); T.run("laundryEditSave('"+LID+"')");
  ok("Whose → Dad: update {by:\"dad\"}", T.writes.length===1&&JSON.stringify(T.writes[0][2])==='{"by":"dad"}'&&T.ctx.laundryData[LID].by==="dad", T.writes);
  T.writes.length=0; T.run("laundryEditLoad('"+LID+"')"); T.fill(LID,{by:"mom"}); T.run("laundryEditSave('"+LID+"')");
  ok("Whose → Mom: update {by:null} (Firebase drops the field; a Mom load has no by)", T.writes.length===1&&JSON.stringify(T.writes[0][2])==='{"by":null}'&&!("by" in T.ctx.laundryData[LID]), T.writes);
  T.writes.length=0; T.run("laundryEditLoad('"+LID+"')"); T.fill(LID,{by:"ellis"}); T.run("laundryEditSave('"+LID+"')");
  ok("Whose → Ellis: update {by:\"ellis\"}", JSON.stringify(T.writes[0][2])==='{"by":"ellis"}');
}
{ const T=mk({laundry:LUCY()}); T.run("laundryEditLoad('"+LID+"')");
  T.fill(LID,{wet:true}); T.run("laundryEditSave('"+LID+"')");
  ok("Wet on: update {wet:true}", T.writes.length===1&&JSON.stringify(T.writes[0][2])==='{"wet":true}'&&T.ctx.laundryData[LID].wet===true, T.writes);
  T.run("laundryEditLoad('"+LID+"')");
  ok("…the sheet shows it checked; the card's trail is the wet one (prewash)", new RegExp('id="le-wet-'+LID+'" type="checkbox" checked').test(T.card())&&/🫧 prewash/.test(T.card()));
  T.writes.length=0; T.fill(LID,{wet:false}); T.run("laundryEditSave('"+LID+"')");
  ok("Wet off: update {wet:null}", JSON.stringify(T.writes[0][2])==='{"wet":null}'&&!("wet" in T.ctx.laundryData[LID]), T.writes);
}
{ const T=mk({laundry:LUCY()}); T.run("laundryEditLoad('"+LID+"')"); T.fill(LID,{});
  T.run("laundryEditSave('"+LID+"')"); ok("Save with nothing changed: no write, the sheet closes", T.writes.length===0&&T.run("laundryEditId")===null);
}
{ const T=mk({laundry:LUCY()}); T.run("laundryEditLoad('"+LID+"')"); T.fill(LID,{name:"   "});
  T.run("laundryEditSave('"+LID+"')"); ok("an emptied Name keeps the old name", T.writes.length===0&&T.ctx.laundryData[LID].label==="Lucy started laundry");
}
{ const T=mk({laundry:LUCY(),dry:true}); T.run("laundryEditLoad('"+LID+"')"); T.fill(LID,{name:"Towels",stage:"dryer"});
  T.run("laundryEditSave('"+LID+"')"); ok("?dryrun=1: the sheet changes this screen, writes nothing", T.writes.length===0&&T.ctx.laundryData[LID].label==="Towels");
}

console.log("── a stage change drops that load's Mom blocks (no stale question) ──");
{ const kW=LID+"_washer", kD=LID+"_dryer";
  const blocks={[kW]:{iso:ISO,load:LID,stage:"washer",label:"Lucy started laundry",mins:5,at:"now",startMin:H(10,30)},
    [kD]:{iso:ISO,load:LID,stage:"dryer",label:"Lucy started laundry",mins:15,at:"skip",startMin:H(9,0)},
    other_washer:{iso:ISO,load:"other",stage:"washer",label:"Towels",mins:5,at:"now",startMin:H(10,0)}};
  const T=mk({laundry:Object.assign(LUCY(),{other:{label:"Towels",stage:"washer",ts:at(H(9,0))}}),blocks,nowMin:H(10,40)});
  T.ctx.laundryData[LID].ts=at(H(9,30));
  ok("before: her 'move it' block holds 10:30", T.run("momBlockOpen()").some(b=>b.key===kW));
  T.run("laundryEditLoad('"+LID+"')"); T.fill(LID,{stage:"dryer"}); T.run("laundryEditSave('"+LID+"')");
  const up=T.writes.filter(w=>w[1]==="laundry/"+LID);
  ok("ONE update on laundry/<id>: {stage:dryer, ts:now} (clock untouched → the dryer starts now)", up.length===1&&up[0][0]==="update"&&JSON.stringify(up[0][2])===JSON.stringify({stage:"dryer",ts:at(H(10,40))}), T.writes);
  ok("momBlocks/<iso>/<load>_washer and _dryer removed (targeted)", T.writes.some(w=>w[0]==="rm"&&w[1]==="momBlocks/"+ISO+"/"+kW)&&T.writes.some(w=>w[0]==="rm"&&w[1]==="momBlocks/"+ISO+"/"+kD), T.writes);
  ok("…nothing else written; the other load's block untouched", T.writes.length===3&&T.run("!!momBlocks.other_washer"), T.writes);
  ok("the block no longer holds her time", !T.run("momBlockOpen()").some(b=>b.key===kW));
  T.ctx._nowM=H(11,45); const S=T.sched();
  ok("the dryer asks fresh (no old 'skip' answer kept): '✅ done in the dryer. Block out time to fold it?'", /done in the dryer\. Block out time to fold it\?/.test(S), S);
}
{ const kW=LID+"_washer";
  const T=mk({laundry:LUCY(),blocks:{[kW]:{iso:ISO,load:LID,stage:"washer",mins:5,at:"now",startMin:H(10,30)}},nowMin:H(10,40)});
  T.run("laundryEditLoad('"+LID+"')"); T.fill(LID,{name:"Towels"}); T.run("laundryEditSave('"+LID+"')");
  ok("no stage change → the blocks stay", T.run("!!momBlocks['"+kW+"']")&&!T.writes.some(w=>w[0]==="rm"));
}
{ const T=mk({laundry:LUCY(),nowMin:H(11,0)}); T.run("laundryEditLoad('"+LID+"')"); T.fill(LID,{stage:"fold",ts:"10:50"}); T.run("laundryEditSave('"+LID+"')");
  ok("stage + Started at together: {stage:fold, ts:10:50}", JSON.stringify(T.writes.filter(w=>w[1]==="laundry/"+LID)[0][2])===JSON.stringify({stage:"fold",ts:at(H(10,50))}), T.writes);
}

console.log("── (2) hole 2: the dryer block's button reads Folded ✓ (text only) ──");
{ const kD=LID+"_dryer";
  const T=mk({laundry:{[LID]:{label:"Lucy started laundry",stage:"dryer",ts:at(H(9,0)),by:"lucy"}},blocks:{[kD]:{iso:ISO,load:LID,stage:"dryer",label:"Lucy started laundry",mins:15,at:"now",startMin:H(10,5)}},nowMin:H(10,10)});
  const S=T.sched();
  ok("the dryer block: '🧺 Fold: Lucy started laundry · [15] min' [Folded ✓]", /🧺 Fold: <b>Lucy started laundry<\/b>/.test(S)&&new RegExp("laundryAdvance\\('"+LID+"'\\)[^>]*>Folded ✓</button>").test(S)&&!/→ Fold/.test(S), S);
  ok("no default-minutes change: fold 15, move 5, put away 10", T.run("laundryBlockDefault('dryer')")===15&&T.run("laundryBlockDefault('washer')")===5&&T.run("laundryBlockDefault('fold')")===10);
  T.ctx._nowM=H(10,22); T.run("laundryAdvance('"+LID+"')");
  ok("Folded ✓ is the same tap: the block ends at 10:22, the load goes to the fold pile", T.run("momBlocks['"+kD+"'].done")===true&&T.run("momBlocks['"+kD+"'].doneMin")===H(10,22)&&T.ctx.laundryData[LID].stage==="fold");
  ok("'✓ Folded: Lucy started laundry' kept at 10:22", /✓ Folded: <b>Lucy started laundry<\/b>/.test(T.sched()));
}
{ const T=mk({laundry:{a:{label:"Towels",stage:"washer",ts:at(H(9,0))},b:{label:"Sheets",stage:"fold",ts:at(H(9,0))}},
    blocks:{a_washer:{iso:ISO,load:"a",stage:"washer",mins:5,at:"now",startMin:H(10,0)},b_fold:{iso:ISO,load:"b",stage:"fold",mins:10,at:"now",startMin:H(10,0)}},nowMin:H(10,5)});
  const S=T.sched();
  ok("the other blocks keep their buttons: → Dryer, ✓ Put away", /laundryAdvance\('a'\)[^>]*>→ Dryer</.test(S)&&/laundryAdvance\('b'\)[^>]*>✓ Put away</.test(S), S);
}
{ const T=mk({laundry:{d:{label:"Towels",stage:"dryer",ts:at(H(9,0))}}});
  ok("Mom's Day Laundry card keeps → Fold (only the block and the nudge changed)", /laundryAdvance\('d'\)[^>]*>→ Fold</.test(T.card()));
}
ok("the NOW nudge's dryer button reads Folded ✓ (and the washer's stays → Dryer) — in laundryNudgeRowHTML (PR 61 merged)", /\(x\.kind==="dryer"&&typeof LAUNDRY_FOLDED_BTN!=="undefined"\)\?LAUNDRY_FOLDED_BTN:laundryAdvanceLabel\(l\.stage\)/.test(src));
ok("LAUNDRY_FOLDED_BTN = 'Folded ✓'", /const LAUNDRY_FOLDED_BTN="Folded ✓";/.test(src));

console.log("── (3) hole 8: Dad's load on Mom's schedule is information only ──");
{ const T=mk({laundry:{dl:{label:"Towels",stage:"washer",ts:at(H(9,0)),by:"dad"}},nowMin:H(9,20)});
  let S=T.sched();
  ok("in the washer: the 🫧 started marker and ⏳ done ~9:50 (as before)", /🫧 <b>Towels<\/b> — in the washer · started 9:00 AM/.test(S)&&/⏳ <b>Towels<\/b> — done ~9:50 AM/.test(S), S);
  T.ctx._nowM=H(10,0); S=T.sched();
  ok("done: '✅ Towels is done in the washer · Dad's' — no question", /✅ <b>Towels<\/b> is done in the washer · Dad's/.test(S)&&!/Block out time/.test(S), S);
  ok("…no How long, no Now / After / Not now, no button at all", !/lb-min-/.test(S)&&!/<button/.test(S)&&!/laundryBlockSet|laundryWhenToggle|laundryAdvance/.test(S), S);
  ok("…and it holds none of her time", T.run("momBlockOpen()").length===0);
  T.ctx.laundryData.dl.stage="dryer"; T.ctx.laundryData.dl.ts=at(H(10,0)); T.ctx._nowM=H(11,5); S=T.sched();
  ok("the dryer: '✅ Towels is done in the dryer · Dad's', no button", /done in the dryer · Dad's/.test(S)&&!/<button/.test(S), S);
  T.ctx.laundryData.dl.stage="fold"; T.ctx.laundryData.dl.ts=at(H(11,0)); S=T.sched();
  ok("the fold pile: '🧺 Towels is in the fold pile · Dad's', no button", /🧺 <b>Towels<\/b> is in the fold pile · Dad's/.test(S)&&!/<button/.test(S), S);
  ok("Mom's Day Laundry card keeps its buttons for Dad's load (✓ Put away, ↶, ✎, ✕)", /laundryAdvance\('dl'\)[^>]*>✓ Put away</.test(T.card())&&/laundryBack\('dl'\)/.test(T.card())&&/laundryEditLoad\('dl'\)/.test(T.card())&&/laundryDel\('dl'\)/.test(T.card()), T.card());
}
{ const T=mk({laundry:{ml:{label:"Sheets",stage:"washer",ts:at(H(9,0))},kl:{label:"Lucy started laundry",stage:"washer",ts:at(H(9,0)),by:"lucy"}},nowMin:H(10,0)});
  const S=T.sched();
  ok("Mom's own load and a kid's load still ask (Block out time? · Now)", (S.match(/Block out time to move it to the dryer\?/g)||[]).length===2&&/laundryBlockSet\('ml','washer','now'\)/.test(S)&&/laundryBlockSet\('kl','washer','now'\)/.test(S), S);
}
{ const T=mk({laundry:{dl:{label:"Towels",stage:"washer",ts:at(H(9,0)),by:"dad"}},blocks:{dl_washer:{iso:ISO,load:"dl",stage:"washer",label:"Towels",mins:5,at:"now",startMin:H(10,0)}},nowMin:H(10,2)});
  const S=T.sched();
  ok("a block she already picked for Dad's load is still drawn (it holds her time, so it is never hidden)", /🧺 Move to the dryer: <b>Towels<\/b>/.test(S)&&/laundryAdvance\('dl'\)/.test(S), S);
}
{ const T=mk({laundry:{dl:{label:"Towels",stage:"washer",ts:at(H(9,0))}},nowMin:H(10,0)}); T.run("laundryEditLoad('dl')"); T.fill("dl",{by:"dad"}); T.run("laundryEditSave('dl')");
  ok("✎ Whose → Dad turns the question into information on her schedule", /done in the washer · Dad's/.test(T.sched())&&!/Block out time/.test(T.sched()), T.sched());
}

console.log("── laundry edit writes stay on laundry/<id> and momBlocks/<iso>/<key> ──");
ok("LAUNDRYEDIT writes only through _lbWrite()", (LE.match(/db\.ref\(/g)||[]).length===1&&/if\(_lbWrite\(\)\) db\.ref\('laundry\/'\+id\)\.update\(up\)/.test(LE));
ok("LAUNDRYEDIT never set()s a whole node", !/\.set\(/.test(LE));

console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
