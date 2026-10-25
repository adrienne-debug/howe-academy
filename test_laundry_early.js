/*
 * ⏩ LL_EARLY (her ask 2026-10-25: "if I end up doing a load earlier than it's on the list, I would love for it to pull it to the day that
 * I'm on, even if it passes the cap limit. And then that way everything else can lay as well"). A load washed ahead of its day rides over
 * that day's cap; bumps and wet loads still take a slot.  run: node test_laundry_early.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,400)+")":"")); } };
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("missing "+a); return src.slice(i,j); };
const LL=cut("// LAUNDRYLINE_START","// LAUNDRYLINE_END");
const iso=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
const MON="2026-10-19", TUE="2026-10-20", WED="2026-10-21";
function mk(o){
  o=o||{}; const writes=[], ls={};
  const ctx={console,Object,Array,String,Number,parseInt,Math,JSON,Date,
    HA_LS:{getItem:k=>ls[k]||null,setItem:(k,v)=>{ ls[k]=v; }},
    db:{ref:p=>({update:v=>writes.push(["update",p,JSON.parse(JSON.stringify(v))]),set:v=>writes.push(["set",p,v])})},
    _lbWrite:()=>true, isMom:!o.noMom, momHere:()=>ctx.isMom, kitPinGate:()=>{ ctx.gated=true; }, gated:false,
    calendarData:Object.assign({holidays:{},vacations:{},kidOverrides:{}},o.cal||{}), calNormDate:s=>s, laundryData:{},
    ROSTER:["lincoln","ellis","lucy","julian"], KID_NAME:{lincoln:"Lincoln",ellis:"Ellis",lucy:"Lucy",julian:"Julian"}, cap:s=>s.charAt(0).toUpperCase()+s.slice(1),
    _hhIsoLocal:ms=>iso(new Date(ms)), esc:s=>String(s==null?"":s), hhRender:()=>{}, mwToast:()=>{}, writes};
  vm.createContext(ctx); vm.runInContext(LL,ctx);
  vm.runInContext("llToday=function(){ return '"+(o.day||MON)+"'; }; llNowMin=function(){ return 600; };",ctx);
  if(o.line) vm.runInContext("laundryLine="+JSON.stringify(o.line)+";",ctx);
  ctx.get=e=>vm.runInContext(e,ctx); return ctx;
}
const caps=(a)=>({"0":a[0],"1":a[1],"2":a[2],"3":a[3],"4":a[4],"5":a[5],"6":a[6]});
const W=(c,day,n,close)=>c.llProject(day,n||7,!!close).map(r=>r.loads.join("+")||"-").join(" | ");
// cap 1 every weekday except Wed 2 (Lucy + Julian share Wednesday), weekend off
const CAPS=caps([1,1,2,1,1,0,0]);
const went=(day,ids)=>{ const o={}; ids.forEach((id,i)=>{ o[id]={at:i+1,load:"l_"+id,by:"mom"}; }); return {[day]:o}; };
const line=x=>Object.assign({caps:CAPS,homeFrom:"2026-10-01",asOf:MON,carry:[]},x);

console.log("0. The plain week (nothing went in yet)");
{ const c=mk({line:line({})}); ok("Mon Lincoln · Tue Ellis · Wed Lucy+Julian · Thu Mom & Dad · Fri Towels", W(c,MON,5)==="lincoln | ellis | lucy+julian | momdad | towels", W(c,MON,5)); }

console.log("1. ⏩ Towels washed early on Monday → over Monday's cap, nothing slides, Friday opens up");
{ const c=mk({line:line({log:went(MON,["towels"])})}); const r=c.llProject(MON,5);
  ok("Monday: Towels + Lincoln (2 loads on a cap of 1)", r[0].loads.join("+")==="towels+lincoln", r[0].loads);
  ok("Towels is marked early on Monday", r[0].early.join()==="towels", r[0].early);
  ok("Tue–Thu unchanged, Friday has no Towels", W(c,MON,5)==="towels+lincoln | ellis | lucy+julian | momdad | -", W(c,MON,5)); }

console.log("2. A load on today's list that goes in counts as before");
{ const c=mk({line:line({log:went(MON,["lincoln"])})}); const r=c.llProject(MON,2);
  ok("Monday: just Lincoln, not marked early", r[0].loads.join()==="lincoln"&&!r[0].early.length, r[0]); }

console.log("3. ⏩ further back in the line: Lucy washed while Ellis was first → over the cap, the line moves up");
{ const c=mk({line:line({carry:["ellis","lucy"]})}); ok("before: Mon Ellis, Tue Lucy (waiting first)", W(c,MON,2)==="ellis | lucy", W(c,MON,2));
  const d=mk({line:line({carry:["ellis","lucy"],log:went(MON,["lucy"])})}); const r=d.llProject(MON,3);
  ok("Monday: Lucy + Ellis; Lucy early", r[0].loads.join("+")==="lucy+ellis"&&r[0].early.join()==="lucy", r[0]);
  ok("Tuesday: Lincoln (was behind Lucy), not Lucy again", r[1].loads.join("+")==="lincoln", r[1].loads); }

console.log("4. ⏫ a bump still takes a slot (her pick 2026-10-16)");
{ const c=mk({line:line({bump:{[MON]:{towels:1}}})}); const r=c.llProject(MON,2);
  ok("Monday: Towels only, Lincoln slides to Tuesday", r[0].loads.join("+")==="towels"&&r[1].loads[0]==="lincoln", r.map(x=>x.loads));
  const d=mk({line:line({bump:{[MON]:{towels:1}},log:went(MON,["towels"])})}); const q=d.llProject(MON,2);
  ok("a bumped load that went in is not early — still one slot, Lincoln still slides", q[0].loads.join("+")==="towels"&&!q[0].early.length&&q[1].loads[0]==="lincoln", q.map(x=>[x.loads,x.early])); }

console.log("5. 💦 a wet load still takes a slot (her pick 2026-10-16)");
{ const c=mk({line:line({jump:{[MON]:{w1:{label:"Wet sheets",at:1}}}})}); const r=c.llProject(MON,2);
  ok("Monday's one slot goes to the wet load; Lincoln slides to Tuesday", !r[0].loads.length&&r[1].loads[0]==="lincoln", r.map(x=>x.loads)); }

console.log("6. 🗓 every-few-weeks items");
{ const notDue={x_cur:{label:"Curtains",emoji:"🪟",every:8,unit:"w",last:"2026-10-05",order:0}};
  const c=mk({line:line({extras:notDue,log:went(MON,["x_cur"])})}); const r=c.llProject(MON,1);
  ok("curtains washed before they're due → over the cap, Lincoln keeps Monday", r[0].loads.join("+")==="x_cur+lincoln"&&r[0].early.join()==="x_cur", r[0]);
  const due={x_cur:{label:"Curtains",emoji:"🪟",every:2,unit:"w",last:"2026-10-01",order:0}};
  const d=mk({line:line({extras:due})}); ok("due but no open room Monday: they wait", d.llProject(MON,1)[0].loads.join("+")==="lincoln", d.llProject(MON,1)[0].loads);
  const e=mk({line:line({extras:due,log:went(MON,["x_cur"])})}); const q=e.llProject(MON,1);
  ok("…and washed anyway → over the cap, Lincoln keeps Monday", q[0].loads.join("+")==="x_cur+lincoln", q[0].loads); }

console.log("7. 🌙 a past day folds the same way");
{ const c=mk({day:TUE,line:line({log:went(MON,["towels","lincoln"])})}); const r=c.llProject(TUE,4);
  ok("Tuesday on: Ellis, Lucy+Julian, Mom & Dad, Friday no Towels", W(c,TUE,4)==="ellis | lucy+julian | momdad | -", W(c,TUE,4)); }

console.log("8. The lay writes nothing");
{ const c=mk({line:line({log:went(MON,["towels"])})}); c.llProject(MON,7); ok("no writes", !c.writes.length, c.writes); }

console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
