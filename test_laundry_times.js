/* 🧺 Laundry times (her ask 2026-10-06).  run: node test_laundry_times.js */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":"")); } };
const fn=name=>{ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); return src.slice(i,src.indexOf("\n}",i)+2); };
const a=src.indexOf("// 🧺 LAUNDRYTIMES (her ask"), b=src.indexOf("function laundryTimesEditorHTML(");
const block=src.slice(a, src.indexOf("\n}\n",b)+3);
function mk(stored){
  const ls={}; if(stored) ls.ha_laundry_times=JSON.stringify(stored); const writes=[], content={};
  const ctx={console,JSON,Date,Math,parseInt,String,HA_LS:{getItem:k=>ls[k]||null,setItem:(k,v)=>{ ls[k]=v; }},db:{ref:p=>({set:v=>writes.push([p,v])})},
    momHere:()=>true,kitPinGate:()=>{},mwToast:()=>{},renderMomsPlan:()=>{},document:{getElementById:id=>id==="content"?content:(ctx.inputs&&ctx.inputs[id])||null},inputs:{}};
  vm.createContext(ctx); vm.runInContext(fn("laundrySince")+"\n"+block,ctx);
  return {run:e=>vm.runInContext(e,ctx),ctx,writes,ls};
}
console.log("── times ──");
{ const T=mk();
  ok("defaults: washer 60, dryer 60, reminder 30 (= the old 90-minute washer nudge)", T.run("laundryT('wash')")===60&&T.run("laundryT('dry')")===60&&T.run("laundryT('grace')")===30);
  const now=Date.now();
  ok("a load in the washer is done its washer-minutes after it started", T.run("laundryDoneAt({stage:'washer',ts:"+now+"})")===now+60*60000);
  ok("the fold pile has no timer", T.run("laundryDoneAt({stage:'fold',ts:"+now+"})")===0);
  ok("row text: 'done ~time' while running…", /done ~/.test(T.run("laundryDoneTxt({stage:'dryer',ts:"+now+"})")));
  ok("…'done at time' once it's past", /done at/.test(T.run("laundryDoneTxt({stage:'dryer',ts:"+(now-2*3600000)+"})")));
  T.ctx.inputs={"laundry-t-wash":{value:"45"},"laundry-t-dry":{value:"75"},"laundry-t-grace":{value:"15"}}; T.run("laundryEditOpen=true; laundryTimesSave()");
  ok("Save keeps her minutes and writes one settings node for the family", T.run("laundryT('wash')")===45&&T.run("laundryT('dry')")===75&&T.run("laundryT('grace')")===15&&T.writes.some(w=>w[0]==="settings/laundryTimes"&&w[1].wash===45&&w[1].dry===75&&w[1].grace===15));
  ok("…and closes the editor", T.run("laundryEditOpen")===false);
  T.ctx.inputs={"laundry-t-wash":{value:"0"},"laundry-t-dry":{value:"abc"},"laundry-t-grace":{value:"999"}}; T.run("laundryTimesSave()");
  ok("nonsense (0, letters, over 600) keeps the last good value", T.run("laundryT('wash')")===45&&T.run("laundryT('dry')")===75&&T.run("laundryT('grace')")===15);
  const T2=mk(); T2.run("laundryTimesOnValue({wash:50,dry:70,grace:20})"); ok("other devices pick up her times from the family's settings", T2.run("laundryT('wash')")===50&&T2.run("laundryT('dry')")===70);
  const T3=mk({wash:40}); ok("remembered on the device between loads (offline too)", T3.run("laundryT('wash')")===40&&T3.run("laundryT('dry')")===60);
  T.run("laundryEditOpen=true"); const ed=T.run("laundryTimesEditorHTML()");
  ok("the editor has washer, dryer and reminder minutes with Save", /The washer takes/.test(ed)&&/The dryer takes/.test(ed)&&/Remind me after it's done for/.test(ed)&&/laundryTimesSave\(\)/.test(ed));
}
console.log("── wiring ──");
ok("✎ Times button on the Laundry card header, editor right under it", /Laundry<span style="flex:1"><\/span><button onclick="laundryEditToggle\(\)"[^>]*>✎ Times<\/button><\/div>'\+laundryTimesEditorHTML\(\)\+\(typeof momTipLaundryHTML==="function"\?momTipLaundryHTML\(\):""\)/.test(src));
ok("each load shows when it'll be done", /' since '\+laundrySince\(l\.ts\)\+laundryDoneTxt\(l\)\+'/.test(src));
ok("Mom's Day reminder covers the washer AND the dryer, at its minutes + the reminder", /if\(!l\|\|\(l\.stage!=="washer"&&l\.stage!=="dryer"\)\) return;/.test(src)&&/if\(mins<\(l\.stage==="dryer"\?laundryT\("dry"\):laundryT\("wash"\)\)\+laundryT\("grace"\)\) return;/.test(src));
ok("the dryer reminder says fold it, with the right button", /has been in the dryer since '\+laundrySince\(l\.ts\)\+' — time to fold it/.test(src)&&/white-space:nowrap">'\+laundryAdvanceLabel\(l\.stage\)\+'<\/button><\/div>';/.test(src));
ok("listens for settings/laundryTimes", /db\.ref\("settings\/laundryTimes"\)\.on\("value"/.test(src));
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
