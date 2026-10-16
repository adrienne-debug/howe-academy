/* 🧺 LAUNDRY_NUDGE — the 🔴 NOW laundry nudges + Home Base badge (laundry audit 2026-10-15, hole 3).
 * A 💦 load in its prewash nudges like the washer; a fold pile nudges after N hours (settings/laundryTimes/foldHrs,
 * default 3). Hole 9: a load in the 💦 wash-today bin nudges from ts + 14 h on Mom's AND Dad's Day.
 * Each button is laundryAdvance.   run: node test_laundry_nudges.js */
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
  vm.runInContext("function _lbWrite(){ return typeof db!==\"undefined\"&&!!db; }   /* PR 60 stand-in: writes when the harness has a db */\nconst LAUNDRY_FOLDED_BTN=\"Folded ✓\";   /* PR 62 */\n"+fn("laundrySince")+"\n"+fn("laundryAdvanceLabel")+"\n"+times+"\n"+nudge+"\n"+fn("hbAlertItems"),ctx);
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
  ok("dryer row: time to fold it [Folded ✓] (LAUNDRY_FOLDED, PR 62 merged)", /Darks<\/b> has been in the dryer since 9:00 AM — time to fold it/.test(rows)&&/laundryAdvance\('d'\)"[^>]*>Folded ✓</.test(rows), rows);
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
  ok("the badge and 🔴 NOW use the same list", /laundryNudgeList\(Date\.now\(\)\)\.forEach\(x=>add\("remind","wash_"\+x\.id\+"_"\+x\.l\.stage\+"_"\+\(x\.l\.ts\|\|0\)[,)]/.test(src)&&/laundryNudgeList\(Date\.now\(\)\)\.forEach\(x=>\{ nowN\+\+; h\+=laundryNudgeRowHTML\(x\); \}\)/.test(src));
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
console.log("── hole 9: the 💦 wash-today bin nags from ts + 14 h ──");
{ const T=mk();
  const B=new Date(2026,9,14,19,40,0).getTime();   // Wed 7:40 PM: 💦 Wet or soiled → bin
  T.ctx.laundryData={s:{label:"💦 Sheets (king) · 7:40 AM",stage:"bin",ts:B,by:"mom",wet:true}};
  ok("the same evening and overnight: no nudge (13 h 59 = Thu 9:39 AM)", kinds(T,B+60*MIN)===""&&kinds(T,B+839*MIN)==="");
  ok("Thu 9:40 AM (14 h): 💦 bin nudge", kinds(T,B+840*MIN)==="s:bin");
  ok("two days later it still nags", kinds(T,B+48*60*MIN)==="s:bin");
  const row=T.run("laundryNudgeRowHTML(laundryNudgeList("+(B+840*MIN)+")[0])");
  ok("'💦 <load> is still in the wash-today bin — start the prewash?' (no doubled 💦)", /💦 <b>Sheets \(king\) · 7:40 AM<\/b> is still in the wash-today bin — start the prewash\?/.test(row)&&!/💦 <b>💦/.test(row), row);
  ok("[🫧 Start prewash] calls laundryAdvance (bin → prewash, the existing path)", /onclick="laundryAdvance\('s'\)"[^>]*>🫧 Start prewash<\/button>/.test(row), row);
  ok("Mom's Day 🔴 NOW and the badge take it (same list)", T.run("laundryNudgeList("+(B+840*MIN)+").length")===1&&badge(T)==="remind:wash_s_bin_"+B);
  // Dad's Day: the bin one only
  T.ctx.laundryData.f={label:"Towels",stage:"fold",ts:B};
  T.ctx.laundryData.w={label:"Darks",stage:"washer",ts:B};
  ok("Mom's list at Thu 9:40 has bin + fold + washer", kinds(T,B+840*MIN)==="s:bin,f:fold,w:washer");
  const dad=T.run("laundryBinNowHTML("+(B+840*MIN)+")");
  ok("Dad's Day box: 🔴 LAUNDRY NOW with the bin row only", /🔴 LAUNDRY NOW/.test(dad)&&/still in the wash-today bin/.test(dad)&&!/fold pile|before it sours/.test(dad), dad);
  ok("…and its button is laundryAdvance too", /onclick="laundryAdvance\('s'\)"/.test(dad));
  ok("Dad's Day box is empty before 14 h", T.run("laundryBinNowHTML("+(B+839*MIN)+")")==="");
  T.ctx.laundryData.s.stage="prewash"; T.ctx.laundryData.s.ts=B+840*MIN;
  ok("once the prewash starts the bin nudge is gone (and the washer clock takes over)", T.run("laundryBinNowHTML("+(B+841*MIN)+")")===""&&!/s:bin/.test(kinds(T,B+841*MIN)));
}
ok("renderDadsDay draws the bin box near the top, beside 🔴 KITCHEN NOW", /function renderDadsDay\(el\)\{[\s\S]*?🔴 KITCHEN NOW[\s\S]*?try\{ h\+=laundryBinNowHTML\(\); \}catch\(e\)\{\}[\s\S]*?try\{ h\+=helperDadCardHTML\(\); \}/.test(src));
console.log("── no new write paths ──");
ok("the nudge block writes nothing (no db, no set/update/remove)", !/db\.|\.set\(|\.update\(|\.remove\(/.test(nudge));
ok("renderMomsDay's old washer||dryer-only filter is gone", !/l\.stage!=="washer"&&l\.stage!=="dryer"\)\) return;/.test(src));

console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
