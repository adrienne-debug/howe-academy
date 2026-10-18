/*
 * 🧺 LAUNDRYLINE step 4 — every-few-weeks items (her ask 2026-10-16: "add in things like the curtains … a setting where we can say
 * those need to be washed every eight weeks or every six months"). Each has every N weeks/months + last washed; come due → joins the
 * line behind what's waiting and takes a slot; starting it is washing it; 🪟 Add the curtains spreads her seven rooms across the six
 * months.  run: node test_laundry_extras.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,400)+")":"")); } };
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("missing "+a); return src.slice(i,j); };
const BLOCK=cut("// LAUNDRYLINE_START","// LAUNDRYLINE_END");
const iso=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
const MON="2026-10-19", TUE="2026-10-20";
function mk(o){
  o=o||{}; const writes=[], toasts=[], ls={}, els={};
  const ctx={LL_DEFAULT_MODE:"rotate",   // these replay the plain rotation; 📅 home days: test_laundry_home.js
    console,Object,Array,String,Number,parseInt,Math,JSON,Date,
    HA_LS:{getItem:k=>ls[k]||null,setItem:(k,v)=>{ ls[k]=v; }},
    db:{ref:p=>({update:v=>writes.push(["update",p,JSON.parse(JSON.stringify(v))]),set:v=>writes.push(["set",p,JSON.parse(JSON.stringify(v))])})},
    _lbWrite:()=>!o.dry, isMom:!o.noMom, momHere:()=>ctx.isMom, kitPinGate:()=>{ ctx.gated=true; }, gated:false, confirm:()=>true,
    document:{getElementById:id=>els[id]||null}, els,
    calendarData:{holidays:{},vacations:{}}, calNormDate:s=>s, laundryData:{},
    KID_NAME:{lincoln:"Lincoln",ellis:"Ellis",lucy:"Lucy",julian:"Julian"}, cap:s=>s.charAt(0).toUpperCase()+s.slice(1),
    _hhIsoLocal:ms=>iso(new Date(ms)), esc:s=>String(s==null?"":s), hhRender:()=>{}, mwToast:t=>toasts.push(t), writes, toasts};
  vm.createContext(ctx); vm.runInContext(BLOCK,ctx);
  vm.runInContext("llToday=function(){ return '"+(o.day||MON)+"'; }; llNowMin=function(){ return "+(o.min==null?600:o.min)+"; };",ctx);
  if(o.line) vm.runInContext("laundryLine="+JSON.stringify(o.line)+";",ctx);
  ctx.get=e=>vm.runInContext(e,ctx); return ctx;
}
const caps=n=>({"0":n,"1":n,"2":n,"3":n,"4":n,"5":n,"6":0});
const L=(c,day,n,close)=>c.llProject(day,n||1,!!close).map(r=>r.loads.join(","));
const mats=(last,every,unit)=>({label:"Shower mats",emoji:"🧺",every:every||8,unit:unit||"w",last:last,order:0});

console.log("1. The interval");
{ const c=mk();
  ok("every 8 weeks from Oct 19 → Dec 14", c.llAddEvery(MON,{every:8,unit:"w"})==="2026-12-14");
  ok("every 6 months from Aug 31 → Feb 28 (the month is shorter)", c.llAddEvery("2026-08-31",{every:6,unit:"m"})==="2027-02-28");
  ok("no setting: 8 weeks; a silly number falls back", c.llEvery({}).n===8&&c.llEvery({every:99,unit:"m"}).n===6);
}
console.log("2. Come due → joins the line, takes a slot");
{ const c=mk({line:{caps:caps(2),asOf:MON,extras:{x_mats:mats("2026-08-24")}}});
  ok("mats due Monday (8 weeks after Aug 24): Monday is mats + Lincoln, Ellis slides", L(c,MON)[0]==="x_mats,lincoln", L(c,MON));
  ok("the rest of the week rolls on: Tue Ellis, Lucy · Wed Julian, Mom & Dad", L(c,MON,3).join("|")==="x_mats,lincoln|ellis,lucy|julian,momdad", L(c,MON,3));
  const w=mk({line:{caps:caps(2),asOf:MON,carry:["ellis"],next:"lucy",extras:{x_mats:mats("2026-08-24")}}});
  ok("loads already waiting go first: Ellis (waiting), then the mats", L(w,MON)[0]==="ellis,x_mats", L(w,MON));
  const n=mk({line:{caps:caps(2),asOf:MON,extras:{x_mats:mats("2026-09-21")}}});
  ok("not due yet (Nov 16): not on the line this week", L(n,MON,6).join("|").indexOf("x_mats")<0&&n.llProject(MON,29)[28].loads.indexOf("x_mats")>=0, n.llProject(MON,29)[28].loads);
  const e=mk({line:{caps:caps(1),asOf:MON,extras:{x_t:{label:"Throw blanket",every:1,unit:"w",last:"2026-10-12"}}}});
  ok("every week: laid this Monday and again next Monday", e.llProject(MON,8).map(r=>r.loads.join()).filter((x,i)=>x==="x_t").length===2&&e.llProject(MON,8)[7].loads.join()==="x_t", e.llProject(MON,8).map(r=>r.loads));
}
console.log("3. Washing it");
{ const c=mk({line:{caps:caps(2),asOf:MON,extras:{x_mats:mats("2026-08-24")}}}); c.llStart("x_mats");
  const up=c.writes.find(w=>w[0]==="update")[2];
  ok("🫧 Start: log + extras/x_mats/last = today (prevLast kept)", up["extras/x_mats/last"]===MON&&up["log/"+MON+"/x_mats"].prevLast==="2026-08-24", up);
  ok("next due Dec 14; the week ahead has no mats", c.llDue(c.get("laundryLine.extras.x_mats"))==="2026-12-14"&&L(c,TUE,6).join("|").indexOf("x_mats")<0);
  const set=c.writes.find(w=>w[0]==="set"); const lid=set[1].slice(8); c.writes.length=0; c.llUnlog(lid,c.get("laundryData")[lid]);
  ok("✕ in the washer: log out, last back to Aug 24", c.writes[0][2]["extras/x_mats/last"]==="2026-08-24"&&c.writes[0][2]["log/"+MON+"/x_mats"]===null&&L(c,MON)[0]==="x_mats,lincoln", c.writes);
  const m=mk({line:{caps:caps(2),asOf:MON,extras:{x_mats:mats("2026-08-24")}}});
  ok("not started by 8 PM: the mats stay at the front", L(m,MON,2,true)[1]==="x_mats,lincoln", L(m,MON,2,true));
  const r=mk({day:"2026-10-21",line:{caps:caps(2),asOf:MON,extras:{x_mats:mats("2026-08-24")}}}); r.llRoll();
  ok("the saved roll carries the waiting mats", JSON.stringify(r.writes[0][2].carry)==='["x_mats","lincoln"]', r.writes[0]);
  ok("…and reads them back", L(r,"2026-10-21")[0]==="x_mats,lincoln", L(r,"2026-10-21"));
}
console.log("4. 🪟 Add the curtains");
{ const c=mk({line:{caps:caps(2),asOf:MON}}); c.llXCurtains(); const u=c.writes[0][2], ks=Object.keys(u).filter(k=>/^extras\//.test(k));
  ok("one write: seven curtains, every 6 months", ks.length===7&&ks.every(k=>u[k].every===6&&u[k].unit==="m"&&u[k].emoji==="🪟"), ks);
  ok("her rooms", ["School room","Kitchen","Living room","Littles' room","Big boys' room","Hallway","Master bedroom"].every(r=>ks.some(k=>u[k].label===r+" curtains")));
  const dues=ks.map(k=>c.llDue(u[k])).sort(), gaps=dues.slice(1).map((d,i)=>(new Date(d)-new Date(dues[i]))/864e5);
  ok("spread out: due dates at least 3 weeks apart", gaps.every(g=>g>=21), dues);
  ok("the spread dates are marked estimated: the card says 'first due', never a made-up 'washed'", ks.every(k=>u[k].est===true)&&/first due/.test(c.llCardHTML())&&!/curtains<div[^>]*>every 6 months · washed/.test(c.llCardHTML()));
  c.writes.length=0; c.llStart("x_curtains_kitchen"); const su=c.writes.find(w=>w[0]==="update")[2];
  ok("washing one makes it real: last = today, est cleared", su["extras/x_curtains_kitchen/last"]===MON&&su["extras/x_curtains_kitchen/est"]===null&&!c.get("laundryLine.extras.x_curtains_kitchen.est"), su);
  c.writes.length=0; c.llXCurtains(); ok("second tap: nothing", c.writes.length===0);
  ok("the button hides once they're all in", !/llXCurtains\(\)/.test(c.llCardHTML()));
}
console.log("5. Add, edit, remove");
{ const c=mk({line:{caps:caps(2),asOf:MON}});
  Object.assign(c.els,{"llx-label":{value:"Dog beds"},"llx-every":{value:"3"},"llx-unit":{value:"w"},"llx-last":{value:"2026-10-01"}}); c.llXAdd();
  const u=c.writes[0][2]; ok("Add: extras/x_dog_beds {Dog beds, every 3 weeks, last Oct 1}", u["extras/x_dog_beds"]&&u["extras/x_dog_beds"].every===3&&u["extras/x_dog_beds"].last==="2026-10-01", u);
  c.writes.length=0; c.llXEvery("x_dog_beds",1); ok("+ : extras/x_dog_beds/every = 4 only", JSON.stringify(c.writes[0][2])==='{"extras/x_dog_beds/every":4}', c.writes);
  c.writes.length=0; c.llXUnit("x_dog_beds"); ok("→ mos: unit m + every 4", JSON.stringify(c.writes[0][2])==='{"extras/x_dog_beds/unit":"m","extras/x_dog_beds/every":4}', c.writes);
  c.writes.length=0; c.llXDel("x_dog_beds"); ok("✕: extras/x_dog_beds = null", JSON.stringify(c.writes[0][2])==='{"extras/x_dog_beds":null}', c.writes);
  Object.assign(c.els,{"llx-label":{value:"  "}}); c.writes.length=0; c.llXAdd(); ok("no name: nothing", c.writes.length===0);
  ok("no write anywhere is a whole-node set", c.writes.every(w=>w[0]!=="set"));
}
console.log("6. The card");
{ const c=mk({line:{caps:caps(2),asOf:MON,extras:{x_mats:mats("2026-08-24")}}}); const h=c.llCardHTML();
  ok("🗓 Every few weeks: mats every 8 weeks · washed 8/24 · due now, with − + → mos ✕", /🗓 Every few weeks/.test(h)&&/every 8 weeks · washed 8\/24 · <b[^>]*>due now/.test(h)&&/llXEvery\('x_mats',1\)/.test(h)&&/llXDel\('x_mats'\)/.test(h));
  ok("today's grid cell: the mats with 🫧 Start", /llStart\('x_mats'\)/.test(c.llWeekGridHTML(MON,false,true)));
  const k=mk({noMom:true,line:{caps:caps(2),asOf:MON,extras:{x_mats:mats("2026-08-24")}}}); const kh=k.llCardHTML();
  ok("a kid's device: the list, no buttons", /Shower mats/.test(kh)&&!/llX\w+\(/.test(kh));
  k.llXCurtains(); ok("…and no edits from it", k.gated&&k.writes.length===0);
}
ok("no 🔀", src.indexOf("🔀")<0);
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
