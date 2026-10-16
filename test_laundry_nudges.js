/* 🧺 LAUNDRY_NUDGE — the 🔴 NOW laundry nudges + Home Base badge (laundry audit 2026-10-15, hole 3).
 * A 💦 load in its prewash nudges like the washer; a fold pile nudges after N hours (settings/laundryTimes/foldHrs,
 * default 3). Each button is laundryAdvance.   run: node test_laundry_nudges.js */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":"")); } };
const fn=name=>{ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); return src.slice(i,src.indexOf("\n}",i)+2); };
const slice=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("missing "+a); return src.slice(i,j+b.length); };
const times=src.slice(src.indexOf("// 🧺 LAUNDRYTIMES (her ask"), src.indexOf("\n}\n",src.indexOf("function laundryTimesEditorHTML("))+3);
const nudge=slice("// LAUNDRY_NUDGE_START","// LAUNDRY_NUDGE_END");

function mk(stored){
  const ls={}; if(stored) ls.ha_laundry_times=JSON.stringify(stored); const writes=[], advanced=[];
  const ctx={console,JSON,Date,Math,parseInt,String,Object,laundryData:{},
    HA_LS:{getItem:k=>ls[k]||null,setItem:(k,v)=>{ ls[k]=v; }},db:{ref:p=>({set:v=>writes.push([p,v])})},
    esc:s=>String(s).replace(/</g,"&lt;"),momHere:()=>true,kitPinGate:()=>{},mwToast:()=>{},renderMomsPlan:()=>{},
    document:{getElementById:id=>(ctx.inputs&&ctx.inputs[id])||null},inputs:{},
    laundryAdvance:id=>advanced.push(id)};
  vm.createContext(ctx);
  vm.runInContext(fn("laundrySince")+"\n"+fn("laundryAdvanceLabel")+"\n"+times+"\n"+nudge+"\n"+fn("hbAlertItems"),ctx);
  return {run:e=>vm.runInContext(e,ctx),ctx,writes,advanced};
}
const T0=new Date(2026,9,15,9,0,0).getTime(), MIN=60000;   // Thursday 9:00 AM
const kinds=(T,now,only)=>T.run("laundryNudgeList("+now+(only?","+JSON.stringify(only):"")+").map(x=>x.id+':'+x.kind).join(',')");
const badge=T=>T.run("hbAlertItems().filter(x=>/^remind:wash_/.test(x.key)).map(x=>x.key).join(',')");

console.log("── (a) a prewash joins the washer nudge ──");
{ const T=mk();   // defaults: wash 60, grace 30
  T.ctx.laundryData={p:{label:"💦 Sheets (king) · 7:40 AM",stage:"prewash",ts:T0,wet:true,by:"mom"}};
  ok("8:29 in (89 min): no nudge yet", kinds(T,T0+89*MIN)==="");
  ok("90 min (wash 60 + grace 30): 🫧 washer nudge", kinds(T,T0+90*MIN)==="p:washer");
  const row=T.run("laundryNudgeRowHTML(laundryNudgeList("+(T0+90*MIN)+")[0])");
  ok("says it's in the washer since 9:00 — move it before it sours", /🫧 <b>💦 Sheets \(king\) · 7:40 AM<\/b> has been in the washer since 9:00 AM — move it before it sours/.test(row), row);
  ok("its button is the existing next step (🫧 Second wash) through laundryAdvance", /onclick="laundryAdvance\('p'\)"/.test(row)&&/>🫧 Second wash<\/button>/.test(row), row);
  T.run("laundryTimesOnValue({wash:50,grace:5})");
  ok("follows her laundry times: wash 50 + grace 5 → nudges at 55 min, not 54", kinds(T,T0+54*MIN)===""&&kinds(T,T0+55*MIN)==="p:washer");
  ok("Home Base badge counts the prewash", badge(T)==="remind:wash_p_prewash_"+T0);
}
console.log("── washer and dryer unchanged ──");
{ const T=mk();
  T.ctx.laundryData={w:{label:"Towels",stage:"washer",ts:T0},d:{label:"Darks",stage:"dryer",ts:T0}};
  ok("89 min: neither", kinds(T,T0+89*MIN)==="");
  ok("90 min: both (washer + dryer)", kinds(T,T0+90*MIN)==="w:washer,d:dryer");
  const rows=T.run("laundryNudgeList("+(T0+90*MIN)+").map(laundryNudgeRowHTML).join('')");
  ok("washer row: move it before it sours [→ Dryer]", /Towels<\/b> has been in the washer since 9:00 AM — move it before it sours/.test(rows)&&/laundryAdvance\('w'\)"[^>]*>→ Dryer</.test(rows), rows);
  ok("dryer row: time to fold it [→ Fold]", /Darks<\/b> has been in the dryer since 9:00 AM — time to fold it/.test(rows)&&/laundryAdvance\('d'\)"[^>]*>→ Fold</.test(rows), rows);
}
console.log("── (b) the fold pile gets its own nudge ──");
{ const T=mk();
  const F=new Date(2026,9,15,11,15,0).getTime();
  T.ctx.laundryData={f:{label:"Taylor started laundry",stage:"fold",ts:F,by:"taylor"}};
  ok("default is 3 hours", T.run("laundryFoldHrs()")===3);
  ok("2:14 PM (2 h 59): no nudge", kinds(T,F+179*MIN)==="");
  ok("2:15 PM (3 h): 🧺 fold nudge", kinds(T,F+180*MIN)==="f:fold");
  const row=T.run("laundryNudgeRowHTML(laundryNudgeList("+(F+180*MIN)+")[0])");
  ok("'🧺 <load> has been in the fold pile since 11:15 AM — put it away'", /🧺 <b>Taylor started laundry<\/b> has been in the fold pile since 11:15 AM — put it away/.test(row), row);
  ok("[✓ Put away] calls laundryAdvance (the existing put-away path)", /onclick="laundryAdvance\('f'\)"[^>]*>✓ Put away<\/button>/.test(row), row);
  T.run("laundryAdvance('f')"); ok("…tapping it reaches laundryAdvance with the load's id", T.advanced[0]==="f");
  ok("Home Base badge counts the fold pile", badge(T)==="remind:wash_f_fold_"+F);
  T.run("laundryTimesOnValue({wash:50,dry:60,grace:5,foldHrs:5})");
  ok("her setting (5 h): no nudge at 4 h 59, nudge at 5 h", kinds(T,F+299*MIN)===""&&kinds(T,F+300*MIN)==="f:fold");
  T.run("laundryTimesOnValue({foldHrs:0})"); ok("0 / nonsense falls back to 3", T.run("laundryFoldHrs()")===3);
  T.run("laundryTimesOnValue({foldHrs:99})"); ok("over 72 falls back to 3", T.run("laundryFoldHrs()")===3);
}
console.log("── badge counts ──");
{ const T=mk();
  const old=Date.now()-6*3600000, fresh=Date.now()-10*MIN;
  T.ctx.laundryData={a:{label:"A",stage:"washer",ts:old},b:{label:"B",stage:"prewash",ts:old},c:{label:"C",stage:"dryer",ts:old},d:{label:"D",stage:"fold",ts:old},e:{label:"E",stage:"fold",ts:fresh},f:{label:"F",stage:"washer",ts:fresh}};
  const b=badge(T).split(",");
  ok("one badge key per nudging load (washer, prewash, dryer, fold) — fresh ones don't count", b.length===4&&["a_washer","b_prewash","c_dryer","d_fold"].every((k,i)=>b[i]==="remind:wash_"+k+"_"+old), b);
  ok("the badge and 🔴 NOW use the same list", /laundryNudgeList\(Date\.now\(\)\)\.forEach\(x=>add\("remind","wash_"\+x\.id\+"_"\+x\.l\.stage\+"_"\+\(x\.l\.ts\|\|0\)\)\)/.test(src)&&/laundryNudgeList\(Date\.now\(\)\)\.forEach\(x=>\{ nowN\+\+; h\+=laundryNudgeRowHTML\(x\); \}\)/.test(src));
}
console.log("── the setting ──");
{ const T=mk();
  T.run("laundryEditOpen=true"); const ed=T.run("laundryTimesEditorHTML()");
  ok("Times editor has 'Remind me to put away a fold pile after [3] hrs'", /Remind me to put away a fold pile after/.test(ed)&&/id="laundry-t-foldhrs"[^>]*max="72" value="3"[^>]*> hrs<\/label>/.test(ed), ed);
  ok("the minute rows still read min", /id="laundry-t-wash"[^>]*max="600" value="60"[^>]*> min<\/label>/.test(ed));
  T.ctx.inputs={"laundry-t-wash":{value:"50"},"laundry-t-dry":{value:"60"},"laundry-t-grace":{value:"5"},"laundry-t-foldhrs":{value:"4"}};
  T.run("laundryTimesSave()");
  const w=T.writes.filter(x=>x[0]==="settings/laundryTimes");
  ok("Save writes settings/laundryTimes with foldHrs beside wash/dry/grace — the only write", T.writes.length===1&&w.length===1&&w[0][1].foldHrs===4&&w[0][1].wash===50&&w[0][1].grace===5, T.writes);
  T.ctx.inputs["laundry-t-foldhrs"]={value:"abc"}; T.run("laundryTimesSave()");
  ok("nonsense keeps the last good hours", T.run("laundryFoldHrs()")===4);
}
console.log("── no new write paths ──");
ok("the nudge block writes nothing (no db, no set/update/remove)", !/db\.|\.set\(|\.update\(|\.remove\(/.test(nudge));
ok("renderMomsDay's old washer||dryer-only filter is gone", !/l\.stage!=="washer"&&l\.stage!=="dryer"\)\) return;/.test(src));

console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
