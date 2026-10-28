/*
 * 🧺 LAUNDRY_SYNC (her report 2026-10-27: "the things in now need you for laundry are not synced up to the loads in the laundry list" ·
 * "anytime it goes to fold that should be on their list if set to them"). Replays the live 10/27 shape: Julian's clothes in the dryer since
 * Sat 10/24 (line julian, by dad), Lincoln's Bed and King + queen sheets in baskets since 10/23 (lineDay 10/18, 10/19), Mom & Dad's clothes
 * twice on the line (home Wed + home Sat — two loads a week, on purpose). Runs the real LAUNDRYLINE, LAUNDRY_NUDGE and LAUNDRY_SYNC blocks
 * plus laundryAdvance / laundryAdvanceLabel; every write is recorded, nothing touches Firebase.
 * run: node test_laundry_sync.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,500)+")":"")); } };
const fn=name=>{ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); let d=0; for(let k=src.indexOf("{",i);k<src.length;k++){ if(src[k]==="{") d++; else if(src[k]==="}"&&--d===0) return src.slice(i,k+1); } throw new Error("unbalanced "+name); };
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("missing "+a); return src.slice(i,j); };
const LL=cut("// LAUNDRYLINE_START","// LAUNDRYLINE_END"), NUDGE=cut("// LAUNDRY_NUDGE_START","// LAUNDRY_NUDGE_END"), SYNC=cut("// LAUNDRY_SYNC_START","// LAUNDRY_SYNC_END");
const iso=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
const ts=(d,h)=>new Date(d+"T"+String(h||10).padStart(2,"0")+":00").getTime();
const TUE="2026-10-27", WED="2026-10-28";
const DAYS={tuesday:TUE,wednesday:WED};
// the line as she has it (shapes of laundryLine/items 10/27): Mom & Dad's clothes twice — momdad home Wed, i_mom_dad_s_clothes home Sat
const ITEMS={lincoln:{label:"Lincoln's clothes",emoji:"👕",order:0,home:0},ellis:{label:"Ellis's clothes",emoji:"👕",order:1,home:1},lucy:{label:"Lucy's clothes",emoji:"👗",order:2,home:2},julian:{label:"Julian's clothes",emoji:"👕",order:3,home:2},
  momdad:{label:"Mom & Dad's clothes",emoji:"👫",order:4,home:2},towels:{label:"Towels",emoji:"🛁",order:5,home:4},sheets:{label:"King + queen sheets",emoji:"🛏",order:6,home:0,doer:"mom"},lbed:{label:"Lincoln's Bed",emoji:"🛏",order:7,home:0,doer:"mom"},
  i_mom_dad_s_clothes:{label:"Mom & Dad's clothes",emoji:"👫",order:8,home:5}};
// the loads still out on 10/27 (shapes of laundry/<id>): any day, line + lineDay on each
const LOADS=()=>({
  lJ:{label:"Julian's clothes",stage:"dryer",ts:ts("2026-10-24",11),line:"julian",lineDay:"2026-10-24",by:"dad"},
  lB:{label:"Lincoln's Bed",stage:"basket",ts:ts("2026-10-23",9),line:"lbed",lineDay:"2026-10-18"},
  lS:{label:"King + queen sheets",stage:"basket",ts:ts("2026-10-23",14),line:"sheets",lineDay:"2026-10-19"},
  lM:{label:"Mom & Dad's clothes",stage:"basket",ts:ts("2026-10-21",16),line:"momdad",lineDay:"2026-10-21"}});
const LOG={"2026-10-26":{lincoln:{at:ts("2026-10-26"),by:"mom",done:true}},"2026-10-18":{lbed:{at:ts("2026-10-18"),load:"lB",by:"mom"}},"2026-10-19":{sheets:{at:ts("2026-10-19"),load:"lS",by:"mom"}},"2026-10-21":{momdad:{at:ts("2026-10-21"),load:"lM",by:"mom"}},"2026-10-24":{julian:{at:ts("2026-10-24"),load:"lJ",by:"dad"}}};
function mk(o){
  o=o||{}; const writes=[], ls={}, today=o.day||TUE;
  const ctx={console,Object,Array,String,Number,parseInt,Math,JSON,Date,RegExp,
    HA_LS:{getItem:k=>ls[k]||null,setItem:(k,v)=>{ ls[k]=v; }},
    db:{ref:p=>({update:v=>writes.push(["update",p,JSON.parse(JSON.stringify(v))]),set:v=>writes.push(["set",p,JSON.parse(JSON.stringify(v))]),remove:()=>writes.push(["rm",p])})},
    _lbWrite:()=>!o.dry, _dryRun:()=>!!o.dry, momHere:()=>true, _kioskD:()=>false, laundryData:o.loads===null?{}:(o.loads||LOADS()), laundryTimes:{},
    calDateForWeekDay:d=>DAYS[d]||null, day:o.dayName||"tuesday", _todayDay:o.dayName||"tuesday", tab:"kids", renderAll:()=>{}, document:{getElementById:()=>null},
    calendarData:{holidays:{},vacations:{},kidOverrides:{}}, calNormDate:s=>s, rtStepsFor:()=>[],
    ROSTER:["lincoln","ellis","lucy","julian"], KID_NAME:{lincoln:"Lincoln",ellis:"Ellis",lucy:"Lucy",julian:"Julian"}, cap:s=>s.charAt(0).toUpperCase()+s.slice(1),
    _hhIsoLocal:ms=>iso(new Date(ms)), esc:s=>String(s==null?"":s), hhRender:()=>{}, mwToast:m=>{ ctx.toasts.push(m); }, toasts:[], writes};
  vm.createContext(ctx); vm.runInContext(LL+"\n"+NUDGE+"\n"+SYNC+"\n"+fn("laundryAdvance")+"\n"+fn("laundryAdvanceLabel")+"\n"+fn("laundrySince")+"\n"+fn("laundryT")+"\n"+fn("laundryFoldHrs")+"\nconst LAUNDRY_STAGES=['washer','dryer','fold'];",ctx);
  vm.runInContext("llToday=function(){ return '"+today+"'; }; llNowMin=function(){ return 600; };",ctx);
  const line=o.line===null?{}:Object.assign({caps:{"0":2,"1":3,"2":4,"3":1,"4":1,"5":1,"6":0},asOf:"2026-10-25",homeFrom:"2026-10-05",items:ITEMS,log:LOG},o.line||{});
  vm.runInContext("laundryLine="+JSON.stringify(line)+";",ctx);
  ctx.get=e=>vm.runInContext(e,ctx); return ctx;
}
const NOW=ts(TUE,15);

console.log("1. llOutLoads — one shared reader, every day");
{ const c=mk(); const O=c.llOutLoads();
  ok("four loads out, in the order they went in (lineDay), each with its line item, day, stage day and stage", O.map(o=>o.id).join()==="lB,lS,lM,lJ"&&O[3].line==="julian"&&O[3].day==="2026-10-24"&&O[3].stage==="dryer"&&O[1].day==="2026-10-19"&&O[1].at==="2026-10-23", O.map(o=>[o.id,o.line,o.day,o.at,o.stage]));
  ok("doer comes from the line (llWho of item + lineDay), not from by: Julian's load, started by Dad, is Julian's", O[3].who==="julian"&&O[0].who==="mom"&&O[1].who==="mom");
  const l=c.get("laundryData.lX={label:'Rags',stage:'washer',ts:"+ts("2026-10-26",9)+"}; llOutLoads().find(o=>o.id==='lX')");
  ok("a load with no line item: day from its ts, doer from by (none → '')", l.line===""&&l.day==="2026-10-26"&&l.who==="");
  ok("llOutFor finds an item's newest out load from an earlier day", c.llOutFor("sheets").id==="lS"&&c.llOutFor("julian").id==="lJ"&&c.llOutFor("ellis")===null);
  ok("…today first: a second King sheets load started today wins over last week's", c.get("laundryData.lS2={label:'King + queen sheets',stage:'washer',ts:"+NOW+",line:'sheets',lineDay:'"+TUE+"'}; llOutFor('sheets').id")==="lS2");
  ok("…lineDay ≤ iso: asked about 10/18, the 10/19 sheets load is not yet out", c.llOutFor("sheets","2026-10-18")===null&&c.llOutFor("lbed","2026-10-18").id==="lB");
}
console.log("2. The line's Today list (Mom's / Dad's My day) — Still out, and a row's stage over 🫧 Start");
{ const c=mk(); const h=c.llDadCardHTML("mom",true), r=c.llProjectNow(1)[0];
  ok("today's lay (Tue 10/27): King + queen sheets and Lincoln's Bed wait from Monday, Ellis on his day", r.loads.join()==="sheets,lbed,ellis", r.loads);
  const row=h.split("</div>").find(s=>/King \+ queen sheets/.test(s)&&/font-weight:700/.test(s))||"";
  ok("the sheets row reads '· 🧺 in the basket since Fri' — not 🫧 Start, not ✓ Done", /King \+ queen sheets.*🧺 in the basket since Fri/.test(h)&&!/llStart\('sheets'/.test(h)&&!/llMarkDone\('sheets'/.test(h), h.slice(h.indexOf("King"),h.indexOf("King")+260));
  ok("Ellis's clothes (nothing out) still offers ✓ Done and 🫧 Start", /llMarkDone\('ellis','mom'\)/.test(h)&&/llStart\('ellis','mom'\)/.test(h));
  const so=h.slice(h.indexOf("Still out"));
  ok("a 'Still out' group sits under Today", h.indexOf("Still out")>h.indexOf(">Today<"));
  ok("it lists the earlier-day loads NOW nudges — Lincoln's Bed, the sheets, Mom & Dad's, Julian's, in the order they went in — with laundryAdvance on each", so.indexOf("Lincoln's Bed")<so.indexOf("King + queen")&&so.indexOf("King + queen")<so.indexOf("Mom & Dad")&&so.indexOf("Mom & Dad")<so.indexOf("Julian's")&&/Lincoln's Bed/.test(so)&&/King \+ queen sheets/.test(so)&&/Mom & Dad's clothes/.test(so)&&/Julian's clothes/.test(so)&&["lB","lS","lM","lJ"].every(id=>new RegExp("laundryAdvance\\('"+id+"'\\)").test(so)), so);
  ok("each with the same stage words and the nudge's button: baskets say 'in the basket since' + Folded ✓, the dryer says 'in the dryer since Sat' + Folded ✓", /in the basket since Fri<\/span><\/span><button[^>]*>Folded ✓/.test(so)&&/🌀 in the dryer since Sat<\/span><\/span><button[^>]*>Folded ✓/.test(so), so);
  ok("Julian's row names Julian as the doer (👤 Julian), the sheets Mom", /Julian's clothes.*👤 Julian/.test(so)&&/King \+ queen sheets.*👤 Mom/.test(so));
  ok("a load started today never sits under Still out", (()=>{ const d=mk(); d.get("laundryData.lE={label:\"Ellis's clothes\",stage:'washer',ts:"+NOW+",line:'ellis',lineDay:'"+TUE+"'}"); const x=d.llDadCardHTML("mom",true); return !/Still out[\s\S]*Ellis's clothes/.test(x)&&/Ellis's clothes.*🫧 in the washer/.test(x); })());
  const ids=c.laundryNudgeList(NOW+6*3600e3).map(x=>x.id).sort().join(), sids=["lB","lS","lM","lJ"].filter(id=>new RegExp("laundryAdvance\\('"+id+"'\\)").test(so)).sort().join();
  ok("NOW's nudge list and Still out name the same load ids", ids===sids&&ids==="lB,lJ,lM,lS", [ids,sids]);
  c.laundryAdvance("lS"); ok("Folded ✓ on the sheets' Still out row is the very same laundryAdvance: basket → fold, one laundry/lS set", c.get("laundryData.lS.stage")==="fold"&&c.writes.filter(w=>w[0]==="set"&&w[1]==="laundry/lS").length===1, c.writes);
  c.laundryAdvance("lS"); ok("✓ Put away next: laundry/lS removed; the sheets row now offers 🫧 Start again (no load out)", !c.get("laundryData.lS")&&c.writes.some(w=>w[0]==="rm"&&w[1]==="laundry/lS")&&/llStart\('sheets','mom'\)/.test(c.llDadCardHTML("mom",true)));
  ok("llLoadStage: today's own log still wins over the fallback", (()=>{ const d=mk(); d.get("laundryLine.log['"+TUE+"']={lincoln:{at:1,load:'lL',by:'mom'}}; laundryData.lL={label:\"Lincoln's clothes\",stage:'dryer',ts:"+NOW+",line:'lincoln',lineDay:'"+TUE+"'}"); return d.llLoadStage("lincoln",TUE)==="🌀 in the dryer"; })());
}
console.log("3. Julian's row (his Day page card) — his load appears once it reaches fold, ✓ puts it away through llPutAway");
{ const c=mk();
  ok("in the dryer: not yet on Julian's card (nothing of his on Tuesday's line either)", c.llKidCardHTML("julian","tuesday")==="", c.llKidCardHTML("julian","tuesday"));
  c.get("laundryData.lJ.stage='fold'; laundryData.lJ.ts="+ts("2026-10-24",13));   // folded Saturday afternoon, never put away
  const h=c.llKidCardHTML("julian","tuesday");
  ok("folded: 🧺 Your laundry shows Julian's clothes · 🧺 folded — put away since Sat, with ✓ Put away → llPutAway('lJ')", /🧺 Your laundry/.test(h)&&/Julian's clothes.*🧺 folded — put away since Sat/.test(h)&&/llPutAway\('lJ'\)/.test(h), h);
  ok("…listed once", (h.match(/Julian's clothes/g)||[]).length===1&&(h.match(/llPutAway\('lJ'\)/g)||[]).length===1);
  ok("…the card is not greyed as all-in while his load waits", !/opacity:\.75/.test(h));
  ok("a basket load of his shows too; a washer load does not", (()=>{ c.get("laundryData.lJ.stage='basket'"); const b=/in the basket since/.test(c.llKidCardHTML("julian","tuesday")); c.get("laundryData.lJ.stage='washer'"); const w=c.llKidCardHTML("julian","tuesday"); c.get("laundryData.lJ.stage='fold'"); return b&&w===""; })());
  ok("not on Lincoln's card (not his); his Wednesday card (his home day, looked at ahead) has only the line row — no ✓ Put away there (today only)", !/Julian's clothes/.test(c.llKidCardHTML("lincoln","tuesday"))&&!/llPutAway/.test(c.llKidCardHTML("julian","wednesday"))&&!/since/.test(c.llKidCardHTML("julian","wednesday")), c.llKidCardHTML("julian","wednesday"));
  c.writes.length=0; c.llPutAway("lJ");
  ok("✓ Put away: laundry/lJ removed (one targeted remove), the away note written under its own lineDay 10/24, toast", !c.get("laundryData.lJ")&&c.writes.some(w=>w[0]==="rm"&&w[1]==="laundry/lJ")&&c.writes.some(w=>w[0]==="update"&&w[2]["log/2026-10-24/julian/away"])&&/put away/.test(c.toasts.join()), c.writes);
  ok("…and his card is empty again", c.llKidCardHTML("julian","tuesday")==="");
}
console.log("4. The Fold row (routine list) — hook and sync read the item's newest out load, any day");
{ const c=mk(); c.get("laundryData.lJ.stage='fold'");
  const st={emoji:"👕",label:"Fold + put away: Julian's clothes",pts:15,cad:"daily",laundry:"lineFold",line:"julian"};
  ok("llKidRowLineDone: not done while Saturday's load is out", c.llKidRowLineDone(st)===false);
  c.llKidRowHook("julian",st,true);
  ok("✓ on the Fold row finds Saturday's load (no lineDay === today) and puts it away", !c.get("laundryData.lJ")&&c.writes.some(w=>w[0]==="rm"&&w[1]==="laundry/lJ"), c.writes);
  const d=mk(); d.get("laundryLine.log['"+TUE+"']={julian:{at:1,load:'lJ2',by:'julian'}}; laundryData.lJ2={label:\"Julian's clothes\",stage:'fold',ts:"+NOW+",line:'julian',lineDay:'"+TUE+"'}");
  d.llKidRowHook("julian",st,true);
  ok("today's own load first: with a Tuesday load logged, ✓ puts that one away and leaves Saturday's", !d.get("laundryData.lJ2")&&d.get("laundryData.lJ"), Object.keys(d.get("laundryData")));
  ok("…the row is not done yet (Saturday's still out); once that one goes, it is", d.llKidRowLineDone(st)===false&&(d.get("delete laundryData.lJ"),d.llKidRowLineDone(st)===true));
}
console.log("5. Same-name items — 'Mom & Dad's clothes · Wed' / '· Sat', matched by id");
{ const c=mk();
  ok("llLabelTag: home mode tags each twin with its home day; a lone label gets ''", c.llLabelTag("momdad")===" · Wed"&&c.llLabelTag("i_mom_dad_s_clothes")===" · Sat"&&c.llLabelTag("towels")===""&&c.llLabelTag("lincoln")==="");
  ok("llLabelFull / llShortFull carry it; lone labels are byte-identical", c.llLabelFull("momdad")==="Mom & Dad's clothes · Wed"&&c.llShortFull("i_mom_dad_s_clothes")==="Mom & Dad · Sat"&&c.llLabelFull("towels")==="Towels"&&c.llShortFull("lincoln")==="Lincoln");
  const r=mk({line:{mode:"rotate"}}); ok("plain rotation: '· 1st' / '· 2nd' by line order", r.llLabelTag("momdad")===" · 1st"&&r.llLabelTag("i_mom_dad_s_clothes")===" · 2nd");
  const nudge=c.laundryNudgeRowHTML({id:"lM",l:c.get("laundryData.lM"),kind:"basket"});
  ok("the NOW nudge row names the twin: 'Mom & Dad's clothes · Wed has been in the basket since …'", /<b>Mom & Dad's clothes · Wed<\/b> has been in the basket since/.test(nudge), nudge);
  ok("a lone label's nudge row is as before", /<b>Julian's clothes<\/b> has been in the dryer/.test(c.laundryNudgeRowHTML({id:"lJ",l:c.get("laundryData.lJ"),kind:"dryer"})));
  ok("Still out names it '· Wed' (in the basket since Wed — 6 days back reads as the weekday)", /Mom & Dad's clothes · Wed .*🧺 in the basket since Wed/.test(c.llDadCardHTML("mom",true)), c.llDadCardHTML("mom",true).slice(c.llDadCardHTML("mom",true).indexOf("Still out")));
  // Wednesday: momdad on its home day with last week's load still in the basket; the Sat one bumped onto today
  const w=mk({day:WED,dayName:"wednesday",line:{asOf:WED,bump:{[WED]:{i_mom_dad_s_clothes:1}}}}); const r0=w.llProjectNow(1)[0], h=w.llDadCardHTML("dad",true);
  ok("Wednesday's lay holds both Mom & Dad's loads", r0.loads.indexOf("momdad")>=0&&r0.loads.indexOf("i_mom_dad_s_clothes")>=0, r0.loads);
  ok("the Wed row reads 'Mom & Dad's clothes · Wed · 🧺 in the basket since 10/21' and offers no Start", /Mom & Dad's clothes · Wed .*🧺 in the basket since 10\/21/.test(h)&&!/llStart\('momdad'/.test(h), h);
  ok("the Sat row reads 'Mom & Dad's clothes · Sat' and still offers 🫧 Start", /Mom & Dad's clothes · Sat /.test(h)&&/llStart\('i_mom_dad_s_clothes','dad'\)/.test(h), h);
  ok("the week grid names both twins", /Mom & Dad · Wed/.test(w.llWeekGridHTML(WED,false,true,"dad"))&&/Mom & Dad · Sat/.test(w.llWeekGridHTML(WED,false,true,"dad")));
  w.llStart("i_mom_dad_s_clothes","dad"); const set=w.writes.find(x=>x[0]==="set");
  ok("🫧 Start on the Sat one: the load's stored label is plain (no tag written), its line is the item id, and the toast says '· Sat'", set&&set[2].label==="Mom & Dad's clothes"&&set[2].line==="i_mom_dad_s_clothes"&&/🫧 Mom & Dad's clothes · Sat — in the washer/.test(w.toasts.join()), [set,w.toasts]);
  ok("a lone label's toast is as before", (()=>{ const z=mk(); z.llStart("ellis","mom"); return z.toasts.join()==="🫧 Ellis's clothes — in the washer"; })());
  ok("no duplicate-name refusal anywhere in the line block", !/same name|already (?:a|an) (?:load|item)|twice/i.test(LL.replace(/\/\/.*$/gm,"")));
}
console.log("6. A family with nothing out (DeWalt, Burris) renders byte-identical; dry run writes nothing");
{ const a=mk({loads:null}), h=a.llDadCardHTML("mom",true), k=a.llKidCardHTML("lucy","tuesday");
  ok("no 'Still out' group, every row offers Start as before", !/Still out/.test(h)&&/llStart\('ellis','mom'\)/.test(h)&&/llStart\('sheets','mom'\)/.test(h));
  ok("llLoadStage is '' with no log and no load; llOutLoads is []", a.llLoadStage("sheets",TUE)===""&&a.llOutLoads().length===0&&a.llStillOutHTML(TUE)==="");
  ok("a kid's card with nothing of theirs is empty", k==="", k);
  const base=mk({loads:null,line:{items:{lincoln:ITEMS.lincoln,ellis:ITEMS.ellis,towels:ITEMS.towels}}});
  const same=/^[\s\S]*$/.test(base.llDadCardHTML("dad",true))&&!/ · (Mon|Tue|Wed|Thu|Fri|Sat|Sun|1st|2nd)\b/.test(base.llDadCardHTML("dad",true)+base.llWeekGridHTML(TUE,false,true,"dad"));
  ok("no twin anywhere: no '· Wed'-style tag in the list or the grid", same);
  const d=mk({dry:true}); d.get("laundryData.lJ.stage='fold'"); d.laundryAdvance("lS"); d.llPutAway("lJ"); d.llStart("ellis","mom"); d.llKidRowHook("lincoln",{laundry:"lineFold",line:"lbed"},true);
  ok("?dryrun=1: Folded ✓, ✓ Put away, 🫧 Start and the Fold row write nothing", d.writes.length===0, d.writes);
}
console.log("7. The block and its guards");
{ ok("LAUNDRY_SYNC sits right after LAUNDRY_NUDGE_END, one START / one END", src.indexOf("// LAUNDRY_NUDGE_END\n// LAUNDRY_SYNC_START")>0&&src.split("// LAUNDRY_SYNC_START").length===2&&src.split("// LAUNDRY_SYNC_END").length===2);
  ok("every call into the block from the line is typeof-guarded", /typeof llOutFor==="function"\)\?llOutFor\(id,iso\)/.test(fn("llLoadStage"))&&/typeof llStillOutHTML==="function"/.test(fn("llDadCardHTML"))&&/typeof llKidOutLoads==="function"/.test(fn("llKidCardHTML"))&&/typeof llLabelTag==="function"/.test(fn("llLabelFull"))&&/typeof llLabelTag==="function"/.test(fn("llShortFull"))&&/typeof llLabelTag==="function"/.test(fn("laundryNudgeRowHTML"))&&/typeof llOutFor==="function"/.test(fn("llKidRowHook"))&&/typeof llOutFor==="function"/.test(fn("llKidRowLineDone")));
  ok("no new write path: the block has no db.ref / llWrite / set / remove of its own", !/db\.ref|llWrite\(|\.set\(|\.remove\(|\.update\(/.test(SYNC));
  ok("no 🔀 anywhere in index.html", src.indexOf("🔀")<0);
}
console.log("\n"+pass+" passed, "+fail+" failed"); if(fail) process.exit(1);
