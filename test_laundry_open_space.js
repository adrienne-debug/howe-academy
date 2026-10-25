/*
 * ☑️🗓 LL_OPENSPACE — "Open space goes to" (her ask 2026-10-25: "i think one time has prescedence over every few weeks but would like a
 * control like the kids cycle on schedule where i can switch the order"). Room left on a day after the line's own loads goes to one-time
 * loads first by default, or every-few-weeks first if she switches it; oldest first inside each.  run: node test_laundry_open_space.js
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
const W=(c,day,n)=>c.llProject(day,n||7).map(r=>r.loads.join("+")||"-").join(" | ");
const ITEMS={lincoln:{label:"Lincoln's clothes",order:0},ellis:{label:"Ellis's clothes",order:1},lucy:{label:"Lucy's clothes",order:2},julian:{label:"Julian's clothes",order:3},momdad:{label:"Mom & Dad's clothes",order:4},towels:{label:"Towels",order:5}};
const CUR={x_cur:{label:"Curtains",emoji:"🪟",every:2,unit:"w",last:"2026-09-26",order:0}};   // due Sat 10/10 — older than the one-time load
const ONE={o_rug:{label:"Bath rug",emoji:"🧺",from:"2026-10-15",order:0}};
const line=x=>Object.assign({items:ITEMS,caps:caps([2,1,2,1,1,0,0]),homeFrom:"2026-10-01",asOf:MON,carry:[]},x);

console.log("1. Default: one-time loads first, even when the every-few-weeks item is older");
{ const c=mk({line:line({extras:CUR,once:ONE})}); ok("Monday's open spot: the bath rug (added 10/15), not the curtains (due 10/10)", c.llProject(MON,1)[0].loads.join("+")==="lincoln+o_rug", c.llProject(MON,1)[0].loads);
  ok("the order reads One-time, then Every few weeks", c.llOpenOrder().join()==="once,extras"); }

console.log("2. Switched: every few weeks first");
{ const c=mk({line:line({extras:CUR,once:ONE,openFirst:"extras"})}); ok("Monday's open spot: the curtains", c.llProject(MON,1)[0].loads.join("+")==="lincoln+x_cur", c.llProject(MON,1)[0].loads); }

console.log("3. Inside each kind the oldest goes first; both fit when there's room");
{ const two={o_new:{label:"Rug",from:"2026-10-16",order:0},o_old:{label:"Dog bed",from:"2026-10-12",order:1}};
  const c=mk({line:line({once:two,extras:CUR,caps:caps([4,1,2,1,1,0,0])})}); ok("Monday (cap 4): Lincoln, Dog bed, Rug, Curtains", c.llProject(MON,1)[0].loads.join("+")==="lincoln+o_old+o_new+x_cur", c.llProject(MON,1)[0].loads); }

console.log("4. The line's own loads still come first — open space is only what's left");
{ const c=mk({line:line({extras:CUR,once:ONE,caps:caps([1,1,2,1,1,0,0])})}); const r=c.llProject(MON,3);
  ok("cap 1 Monday: Lincoln only; Tue Ellis; Wed Lucy + Julian — nothing pushed", W(c,MON,3)==="lincoln | ellis | lucy+julian", W(c,MON,3)); }

console.log("5. Plain rotation: the chosen kind joins the line first");
{ const R=x=>line(Object.assign({mode:"rotate",next:"lincoln",caps:caps([3,1,1,1,1,0,0])},x));
  const a=mk({line:R({extras:CUR,once:ONE})}); ok("default: the rug ahead of the curtains", a.llProject(MON,1)[0].loads.join("+")==="o_rug+x_cur+lincoln", a.llProject(MON,1)[0].loads);
  const b=mk({line:R({extras:CUR,once:ONE,openFirst:"extras"})}); const lb=b.llProject(MON,1)[0].loads; ok("switched: the curtains ahead of the rug", lb.join("+")==="x_cur+o_rug+lincoln", lb); }

console.log("6. ↑ ↓ — Mom only, one targeted write");
{ const c=mk({line:line({extras:CUR,once:ONE})}); c.llOpenMove("extras",-1);
  const w=c.writes.filter(x=>x[1]==="laundryLine"); ok("writes laundryLine/openFirst = extras, nothing else", w.length===1&&JSON.stringify(w[0][2])==='{"openFirst":"extras"}', c.writes);
  ok("now every few weeks first", c.llOpenOrder().join()==="extras,once"&&c.llProject(MON,1)[0].loads.join("+")==="lincoln+x_cur");
  const n0=c.writes.length; c.llOpenMove("extras",-1); ok("↑ on the top row does nothing", c.writes.length===n0);
  c.llOpenMove("once",-1); ok("↑ on One-time puts it back first", c.llOpenOrder().join()==="once,extras"&&c.writes.length===n0+1&&c.writes[n0][2].openFirst==="once", c.writes);
  const k=mk({noMom:true,line:line({})}); k.llOpenMove("extras",-1); ok("not Mom: asks for the Mom code, writes nothing", k.gated&&!k.writes.length); }

console.log("7. The control");
{ const c=mk({line:line({})}); const h=c.llOpenHTML(true), v=c.llOpenHTML(false);
  ok("titled Open space goes to, One-time first", /Open space goes to/.test(h)&&h.indexOf("One-time loads")<h.indexOf("Every few weeks"));
  ok("Mom sees ↑ ↓; others see the order only", /llOpenMove/.test(h)&&!/llOpenMove/.test(v)&&/Open space goes to/.test(v));
  ok("sits under the caps on the laundry line card", /h\+=llOpenHTML\(mom\);[^\n]*\n  h\+=llExtrasHTML/.test(src)); }

console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
