/*
 * 🧺 LAUNDRYLINE step 5 — who runs each load (her "go on with step 5" 2026-10-16: "if a kid is sick … another person can do it. Or if
 * mom clicks sick … the kids could do it"; her pick: "I pick each time"). 👤 doer per load, 😷 Kid off / 🤒 Mom's sick today → "who's
 * doing it?" (a person or ⏸ Wait a day — the next load fills the slot, the waiting one is first tomorrow), Mom or Dad's link answers.
 * run: node test_laundry_cover.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,400)+")":"")); } };
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("missing "+a); return src.slice(i,j); };
const BLOCK=cut("// LAUNDRYLINE_START","// LAUNDRYLINE_END");
const iso=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
const MON="2026-10-19";
function mk(o){
  o=o||{}; const writes=[], toasts=[], ls={};
  const ctx={console,Object,Array,String,Number,parseInt,Math,JSON,Date,
    HA_LS:{getItem:k=>ls[k]||null,setItem:(k,v)=>{ ls[k]=v; }},
    db:{ref:p=>({update:v=>writes.push(["update",p,JSON.parse(JSON.stringify(v))]),set:v=>writes.push(["set",p,JSON.parse(JSON.stringify(v))])})},
    _lbWrite:()=>!o.dry, isMom:!o.noMom, momHere:()=>ctx.isMom, _kioskD:()=>!!o.dad, kitPinGate:()=>{ ctx.gated=true; }, gated:false,
    calendarData:Object.assign({holidays:{},vacations:{},kidOverrides:{}},o.cal||{}), calNormDate:s=>s, laundryData:{},
    ROSTER:["lincoln","ellis","lucy","julian"], KID_NAME:{lincoln:"Lincoln",ellis:"Ellis",lucy:"Lucy",julian:"Julian"}, cap:s=>s.charAt(0).toUpperCase()+s.slice(1),
    _hhIsoLocal:ms=>iso(new Date(ms)), esc:s=>String(s==null?"":s), hhRender:()=>{}, mwToast:t=>toasts.push(t), writes, toasts};
  vm.createContext(ctx); vm.runInContext(BLOCK,ctx);
  vm.runInContext("llToday=function(){ return '"+(o.day||MON)+"'; }; llNowMin=function(){ return "+(o.min==null?600:o.min)+"; };",ctx);
  if(o.line) vm.runInContext("laundryLine="+JSON.stringify(o.line)+";",ctx);
  ctx.get=e=>vm.runInContext(e,ctx); return ctx;
}
const caps=n=>({"0":n,"1":n,"2":n,"3":n,"4":n,"5":n,"6":0});
const L=(c,day,n,close)=>c.llProject(day,n||1,!!close).map(r=>r.loads.join(","));
const off=kid=>({kidOverrides:{[kid]:{[MON]:{school:false,note:"Day off"}}}});

console.log("1. Who usually runs it");
{ const c=mk({line:{caps:caps(2),asOf:MON,extras:{x_m:{label:"Shower mats",every:8,unit:"w",last:MON}}}});
  ok("a kid's clothes → that kid; Mom & Dad's, Towels, the every-few-weeks → Mom", c.llDoer("lincoln")==="lincoln"&&c.llDoer("julian")==="julian"&&c.llDoer("momdad")==="mom"&&c.llDoer("towels")==="mom"&&c.llDoer("x_m")==="mom");
  c.llDoerNext("julian"); const w=c.writes[0][2];
  ok("👤 tap on Julian's: round to Mom — the first edit writes the items, Julian's with doer mom", w["items/julian"]&&w["items/julian"].doer==="mom"&&c.llDoer("julian")==="mom", w);
  c.writes.length=0; c.llDoerNext("julian"); ok("again: Dad — items/julian/doer only", JSON.stringify(c.writes[0][2])==='{"items/julian/doer":"dad"}', c.writes);
  c.writes.length=0; c.llDoerNext("x_m"); ok("the mats: extras/x_m/doer = dad", JSON.stringify(c.writes[0][2])==='{"extras/x_m/doer":"dad"}', c.writes);
  ok("the chip is on the card", /llDoerNext\('lincoln'\)"[^>]*>👤 Lincoln/.test(c.llCardHTML()));
}
console.log("2. 😷 Lincoln is off today (cap 2: Lincoln, Ellis)");
{ const c=mk({line:{caps:caps(2),asOf:MON},cal:off("lincoln")});
  ok("Lincoln's load needs someone; Ellis's doesn't", c.llWho("lincoln",MON).need===true&&!c.llWho("ellis",MON).need);
  const a=c.llCoverAskHTML(); ok("the question: Lincoln's off today — who's doing Lincoln's clothes? Mom, Dad, Ellis, Lucy, Julian, ⏸ — not Lincoln", /😷 Lincoln's off today — who's doing Lincoln's clothes\?/.test(a)&&["mom","dad","ellis","lucy","julian","wait"].every(w=>a.indexOf("llCover('lincoln','"+w+"')")>=0)&&a.indexOf("'lincoln','lincoln'")<0, a);
  ok("the grid says ❓ who?", /❓ who\?/.test(c.llWeekGridHTML(MON,false,true)));
  c.llCover("lincoln","ellis");
  ok("pick Ellis: one write cover/<today>/lincoln = ellis; asked no more", c.writes.length===1&&c.writes[0][2]["cover/"+MON+"/lincoln"]==="ellis"&&c.llCoverAskHTML()==="", c.writes);
  ok("the grid: 👤 Ellis under Lincoln's; the chip under Start a load says · Ellis", /👤 Ellis/.test(c.llWeekGridHTML(MON,false,true))&&/Lincoln's clothes · Ellis/.test(c.llStripHTML("")));
  ok("the toast", /👤 Ellis is doing Lincoln's clothes today/.test(c.toasts[0]));
  ok("the lay doesn't change — same loads, someone else runs one", L(c,MON)[0]==="lincoln,ellis");
}
console.log("3. ⏸ Wait a day");
{ const c=mk({line:{caps:caps(2),asOf:MON},cal:off("lincoln")}); c.llCover("lincoln","wait");
  const r=c.llProject(MON,2,false);
  ok("Monday: Lincoln waits; Ellis and Lucy fill the two slots", r[0].waited.join()==="lincoln"&&r[0].loads.filter(id=>id!=="lincoln").join()==="ellis,lucy", r[0]);
  ok("Tuesday: Lincoln first, then Julian", r[1].loads.join()==="lincoln,julian", r[1].loads);
  const e=c.llProject(MON,2,true); ok("8 PM with nothing done: Lincoln, Ellis tomorrow — the order holds", e[1].loads.join()==="lincoln,ellis", e[1].loads);
  ok("the grid: ⏸ waits, no Start on it; the chips skip it", /⏸ waits/.test(c.llWeekGridHTML(MON,false,true))&&!/llStart\('lincoln'\)/.test(c.llWeekGridHTML(MON,false,true))&&!/llStart\('lincoln'/.test(c.llStripHTML("")));
  c.writes.length=0; c.llCoverClear("lincoln"); ok("undo the pick: cover null, asked again", c.writes[0][2]["cover/"+MON+"/lincoln"]===null&&/who's doing Lincoln's/.test(c.llCoverAskHTML()));
}
console.log("4. 🤒 Mom's sick today");
{ const c=mk({line:{caps:caps(2),asOf:MON,next:"momdad"}}); c.llMomSick();
  ok("one write momSick/<today> = true", c.writes.length===1&&c.writes[0][2]["momSick/"+MON]===true, c.writes);
  const a=c.llCoverAskHTML(); ok("Mom & Dad's and Towels ask; no Mom button", /🤒 Mom's sick — who's doing Mom & Dad's clothes\?/.test(a)&&/who's doing Towels\?/.test(a)&&a.indexOf("'mom')")<0&&a.indexOf("llCover('towels','lincoln')")>=0, a);
  ok("the button shows it's on", /Mom's sick today ✓/.test(c.llMomSickBtn()));
  c.writes.length=0; c.llMomSick(); ok("tap again: off (null)", c.writes[0][2]["momSick/"+MON]===null&&c.llCoverAskHTML()==="");
}
console.log("5. Who can answer");
{ const d=mk({noMom:true,dad:true,line:{caps:caps(2),asOf:MON},cal:off("lincoln")});
  d.llCover("lincoln","dad"); ok("Dad's link: picks (Mom may be the sick one)", !d.gated&&d.writes.length===1&&d.writes[0][2]["cover/"+MON+"/lincoln"]==="dad");
  d.writes.length=0; d.llMomSick(); ok("Dad's link: 🤒 Mom's sick", !d.gated&&d.writes.length===1);
  d.writes.length=0; d.llDoerNext("lincoln"); ok("Dad's link: the usual doer is Mom's setting (PIN)", d.gated&&d.writes.length===0);
  const k=mk({noMom:true,line:{caps:caps(2),asOf:MON},cal:off("lincoln")}); k.llCover("lincoln","ellis");
  ok("a kid's device: PIN, nothing written, no question on the card", k.gated&&k.writes.length===0&&!/who's doing/.test(k.llCardHTML()));
  const h=mk({line:{caps:caps(2),asOf:MON},cal:{holidays:{x:{name:"Fall break",start:MON,end:MON,pause:"school"}}}});
  ok("a holiday is not a kid off: nobody's asked", h.llCoverAskHTML()==="");
}
console.log("6. On Mom's and Dad's My day");
{ const c=mk({line:{caps:caps(2),asOf:MON},cal:off("lincoln")}); const s=c.llStripHTML("dad");
  ok("the strip has 🤒 and the question", /llMomSick\(\)/.test(s)&&/who's doing Lincoln's clothes/.test(s));
  ok("not set up: nothing at all", mk({cal:off("lincoln")}).llStripHTML("")==="");
}
ok("no 🔀", src.indexOf("🔀")<0);
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
