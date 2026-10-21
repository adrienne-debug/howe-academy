/*
 * ⚡ LL_MEMO (her report 2026-10-20: "the app is super slow on the lg stand by me and the kids old fire tablet … taps dont register right
 * away"). A lay is worked out once and reused until anything changes; the memo is browser-only (window), so these checks set a window.
 * The one thing that must never happen: a stale answer. run: node test_laundry_memo.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,300)+")":"")); } };
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("missing "+a); return src.slice(i,j); };
const LL=cut("// LAUNDRYLINE_START","// LAUNDRYLINE_END");
const iso=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
const MON="2026-10-26";
function mk(){ const writes=[], ls={};
  const ctx={console,Object,Array,String,Number,parseInt,Math,JSON,Date,window:{},
    HA_LS:{getItem:k=>ls[k]||null,setItem:(k,v)=>{ ls[k]=v; }},
    db:{ref:p=>({update:v=>writes.push(["update",p,JSON.parse(JSON.stringify(v))]),set:v=>writes.push(["set",p,v]),remove:()=>writes.push(["rm",p])})},
    _lbWrite:()=>true, momHere:()=>true, _kioskD:()=>false, laundryData:{}, calendarData:{holidays:{},vacations:{},kidOverrides:{}}, calNormDate:s=>s,
    ROSTER:["lincoln","ellis","lucy","julian"], KID_NAME:{lincoln:"Lincoln",ellis:"Ellis",lucy:"Lucy",julian:"Julian"}, cap:s=>s.charAt(0).toUpperCase()+s.slice(1),
    _hhIsoLocal:ms=>iso(new Date(ms)), esc:s=>String(s==null?"":s), hhRender:()=>{}, mwToast:()=>{}, writes};
  vm.createContext(ctx); vm.runInContext(LL,ctx);
  vm.runInContext("llToday=function(){ return '"+MON+"'; }; llNowMin=function(){ return 600; }; var _rawN=0; var _origRaw=_llProjectRaw; _llProjectRaw=function(a,b,c){ _rawN++; return _origRaw(a,b,c); };",ctx);
  vm.runInContext("laundryLine={caps:{'0':2,'1':1},asOf:'"+MON+"',homeFrom:'"+MON+"',items:{lincoln:{label:\"Lincoln's clothes\",order:0,home:0},ellis:{label:\"Ellis's clothes\",order:1,home:1}}};",ctx);
  ctx.get=e=>vm.runInContext(e,ctx); return ctx; }

console.log("1. Reuse");
{ const c=mk(); c.llProject(MON,7,false); c.llProject(MON,7,false); c.llProject(MON,7,false);
  ok("three identical asks → one real lay", c.get("_rawN")===1, c.get("_rawN"));
  c.llProject(MON,14,false); ok("a different ask (14 days) → its own lay", c.get("_rawN")===2);
}
console.log("2. Never stale");
{ const c=mk(); const a=c.llProject(MON,1,false)[0].loads.join();
  c.llHomeNext("ellis"); c.llHomeNext("ellis"); c.llHomeNext("ellis"); c.llHomeNext("ellis"); c.llHomeNext("ellis"); c.llHomeNext("ellis");   // 📅 Ellis Tue → … → Mon — llStore → reset
  const b=c.llProject(MON,1,false)[0].loads.join(); ok("a line edit (Ellis's home day → Monday) → fresh lay: Monday grows", a==="lincoln"&&b==="lincoln,ellis"&&c.llHome("ellis")===0, [a,b,c.llHome("ellis")]);
  const n0=c.get("_rawN"); c.llStart("lincoln");   // a load goes in → llStore → reset
  c.llProject(MON,1,false); ok("🫧 Start → fresh lay", c.get("_rawN")>n0);
  const n1=c.get("_rawN"); c.llMemoReset(); c.llProject(MON,1,false); ok("the laundry/ listener's reset (a load moved on another device) → fresh lay", c.get("_rawN")>n1);
}
console.log("3. The ⏫ Today button still works (llBump was shadowed by the first draft — caught by test_laundry_cover)");
{ const c=mk(); c.llBump("ellis"); ok("⏫ Ellis onto Monday: a bump write, Monday has Ellis", c.writes.some(w=>w[2]&&w[2]["bump/"+MON+"/ellis"])&&c.llProject(MON,1,false)[0].loads.indexOf("ellis")>=0, c.writes);
  ok("llBump(id) is the only llBump", (src.match(/^function llBump\(/gm)||[]).length===1&&/^function llBump\(id\)/m.test(src));
}
console.log("4. Node tests see no memo");
{ ok("without a window the memo is off (every lay fresh) — so every other test replays for real", /if\(typeof window==="undefined"\) return fn\(\);/.test(src)); }
ok("no 🔀", src.indexOf("🔀")<0);
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
