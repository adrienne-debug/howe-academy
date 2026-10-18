/*
 * 🌀 Custom wash cycles part 3 (her plan 2026-10-17, "go on"): a cycle per laundry-line load (and every-few-weeks item) — 🫧 Start runs
 * its steps; none = Normal — and the Start a load box's pick ("Like: <quick button>").  run: node test_laundry_cycle_line.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,400)+")":"")); } };
const fn=name=>{ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); let d=0; for(let k=src.indexOf("{",i);k<src.length;k++){ if(src[k]==="{") d++; else if(src[k]==="}"&&--d===0) return src.slice(i,k+1); } throw new Error("unbalanced "+name); };
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("missing "+a); return src.slice(i,j); };
const LC=cut("const LC_KINDS=","// LAUNDRY_CYCLE_END"), LL=cut("// LAUNDRYLINE_START","// LAUNDRYLINE_END");
const iso=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
const MON="2026-10-19";
function mk(o){
  o=o||{}; const writes=[], ls={}, els={};
  const ctx={console,Object,Array,String,Number,parseInt,Math,JSON,Date,
    HA_LS:{getItem:k=>ls[k]||null,setItem:(k,v)=>{ ls[k]=v; }},
    db:{ref:p=>({set:v=>writes.push(["set",p,JSON.parse(JSON.stringify(v))]),update:v=>writes.push(["update",p,JSON.parse(JSON.stringify(v))])})},
    _lbWrite:()=>true, isMom:!o.noMom, momHere:()=>ctx.isMom, kitPinGate:()=>{ ctx.gated=true; }, gated:false,
    document:{getElementById:id=>els[id]||null}, els, renderMomsPlan:()=>{},
    calendarData:{holidays:{},vacations:{},kidOverrides:{}}, calNormDate:s=>s, laundryData:{}, laundryT:k=>({wash:60,dry:60,grace:30})[k],
    ROSTER:["lincoln","ellis","lucy","julian"], KID_NAME:{lincoln:"Lincoln",ellis:"Ellis",lucy:"Lucy",julian:"Julian"}, cap:s=>s.charAt(0).toUpperCase()+s.slice(1),
    _hhIsoLocal:ms=>iso(new Date(ms)), esc:s=>String(s==null?"":s), hhRender:()=>{}, mwToast:()=>{},
    qlIds:()=>o.ql?Object.keys(o.ql):[], qlAll:()=>o.ql||{}, writes};
  vm.createContext(ctx); vm.runInContext(LC+"\n"+LL+"\n"+fn("laundryCyclePickHTML")+"\n"+fn("laundryAdd"),ctx);
  vm.runInContext("llToday=function(){ return '"+MON+"'; }; llNowMin=function(){ return 600; };",ctx);
  if(o.line) vm.runInContext("laundryLine="+JSON.stringify(o.line)+";",ctx);
  ctx.get=e=>vm.runInContext(e,ctx); return ctx;
}
const caps={"0":2,"1":2,"2":2,"3":2,"4":2,"5":2,"6":0};

console.log("1. Setting Lucy's clothes to Wash → Air dry");
{ const c=mk({line:{caps:caps,asOf:MON}});
  ok("the chip says Normal at first", /llCyOpen\('lucy'\)"[^>]*>🌀 Normal/.test(c.llCardHTML()));
  c.llCyOpen("lucy"); ok("🌀 opens a draft: Wash → Dry; the editor is under her row", /Lucy's clothes — its steps/.test(c.llCardHTML())&&/＋ Step/.test(c.llCardHTML()));
  c.llCyStepSet(1,"k","airdry"); c.llCyStepSet(1,"m","240"); c.llCySave();
  const w=c.writes[0][2];
  ok("Save: the first edit writes the six items, Lucy's with cycle Wash → Air dry 240", w["items/lucy"]&&JSON.stringify(w["items/lucy"].cycle)==='[{"k":"wash"},{"k":"airdry","m":240}]', w);
  ok("the chip now says Wash → Air dry", /🌀 Wash → Air dry/.test(c.llCardHTML()));
  c.writes.length=0; c.llCyOpen("lucy"); c.llCyNormal(); ok("Normal: items/lucy/cycle = null only", JSON.stringify(c.writes[0][2])==='{"items/lucy/cycle":null}');
}
console.log("2. 🫧 Start runs its steps");
{ const c=mk({line:{caps:caps,asOf:MON,items:{lincoln:{label:"Lincoln's clothes",order:0,cycle:[{k:"wash",m:50},{k:"airdry",m:300}]},ellis:{label:"Ellis's clothes",order:1}}}});
  c.llStart("lincoln"); const L=c.writes.find(w=>w[0]==="set")[2];
  ok("Lincoln's load: its cycle, step 0, in the washer", JSON.stringify(L.cycle)==='[{"k":"wash","m":50},{"k":"airdry","m":300}]'&&L.step===0&&L.stage==="washer"&&L.line==="lincoln", L);
  c.writes.length=0; c.llStart("ellis"); const E=c.writes.find(w=>w[0]==="set")[2]; ok("Ellis (Normal): a plain washer load, no cycle", E.stage==="washer"&&!E.cycle&&E.step===undefined, E);
  const lid=Object.keys(c.get("laundryData")).find(k=>c.get("laundryData")[k].line==="lincoln"), l=c.get("laundryData")[lid];
  c.writes.length=0; c.llUnlog(lid,l); ok("✕ on its first step: back in line", c.writes.length===1&&c.writes[0][2]["log/"+MON+"/lincoln"]===null);
  const m=mk({line:{caps:caps,asOf:MON,log:{[MON]:{lincoln:{at:1,load:"x"}}}}}); m.llUnlog("x",{line:"lincoln",lineDay:MON,stage:"airdry",step:1,cycle:[{k:"wash"},{k:"airdry"}]});
  ok("✕ once it's on to air dry: the line keeps it", m.writes.length===0);
}
console.log("3. An every-few-weeks item");
{ const c=mk({line:{caps:caps,asOf:MON,extras:{x_c:{label:"Kitchen curtains",every:6,unit:"m",last:"2026-01-01"}}}});
  c.llCyOpen("x_c"); c.llCyDraft=null; c.get("llCyDraft=[{k:'wash',m:30},{k:'airdry',m:180}]"); c.llCySave();
  ok("curtains: extras/x_c/cycle only", JSON.stringify(c.writes[0][2])==='{"extras/x_c/cycle":[{"k":"wash","m":30},{"k":"airdry","m":180}]}', c.writes);
  c.writes.length=0; c.llStart("x_c"); const L=c.writes.find(w=>w[0]==="set")[2]; ok("…and starting them runs Wash 30 → Air dry 180", L.cycle.length===2&&L.stage==="washer"&&L.step===0);
}
console.log("4. Start a load: Normal or Like a quick button");
{ const q={towels:{label:"Towels",steps:[{k:"prewash"},{k:"wash"},{k:"dry"}]},rug:{label:"Rug",steps:[{k:"custom",n:"Soak",m:20},{k:"wash"}]}};
  const c=mk({ql:q}); const h=c.laundryCyclePickHTML();
  ok("the pick: 🌀 Normal, Like: Towels, Like: Rug", /🌀 Normal/.test(h)&&/value="towels">Like: Towels/.test(h)&&/value="rug">Like: Rug/.test(h));
  ok("no quick buttons: no pick", mk().laundryCyclePickHTML()==="");
  Object.assign(c.els,{"laundry-label":{value:"Bath mats"},"laundry-cycle":{value:"rug"}}); c.laundryAdd();
  const L=c.writes[0][2]; ok("'Bath mats' Like: Rug → Soak 20 → Wash, straight in (custom, step 0)", L.label==="Bath mats"&&L.stage==="custom"&&L.step===0&&L.cycle[0].n==="Soak", L);
  c.writes.length=0; c.els["laundry-cycle"].value=""; c.laundryAdd(); ok("Normal: a plain washer load", c.writes[0][2].stage==="washer"&&!c.writes[0][2].cycle);
  ok("the pick sits in Mom's / Dad's Start a load box", /laundryCyclePickHTML\(\):''\)   \/\/ 🌀 Normal, or like a quick button/.test(src));
}
console.log("5. Mom only");
{ const k=mk({noMom:true,line:{caps:caps,asOf:MON}}); k.llCyOpen("lucy"); ok("a kid's device: PIN, no editor", k.gated&&!/its steps/.test(k.llCardHTML())&&!/llCyOpen/.test(k.llCardHTML())); }
ok("no 🔀", src.indexOf("🔀")<0);
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
