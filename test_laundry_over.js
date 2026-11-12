/*
 * ➕ LL_OVER — ⏫ Today, extra: over the cap, nothing moves (her ask 2026-11-11, "yes on the additional add").
 *   (1) an extra sits on today with no slot: today's planned loads stay, nothing slides, the line is untouched until it goes in
 *   (2) started → exactly a load washed ahead of its day (LL_EARLY): a missed turn paid, or its next home day covered
 *   (3) not started → gone at 8 PM / the next day, the line as if never tapped
 *   (4) ⏫ Instead is the old ⏫ Today, byte for byte
 *   (5) the toggle: write, undo, refusals, Mom only; ⏫ Today's question on the line card; the ➕ mark on the week grid
 *   (6) a backed-up week replayed: every started extra takes one load off the waiting pile, nothing else moves
 *                                                                                                run: node test_laundry_over.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,500)+")":"")); } };
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("missing "+a); return src.slice(i,j); };
const LL=cut("// LAUNDRYLINE_START","// LAUNDRYLINE_END");
const iso=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
const MON="2026-10-19", TUE="2026-10-20", WED="2026-10-21", FRI="2026-10-23";
function mk(o){
  o=o||{}; const writes=[], ls={}, toasts=[];
  const ctx={console,Object,Array,String,Number,parseInt,Math,JSON,Date,
    HA_LS:{getItem:k=>ls[k]||null,setItem:(k,v)=>{ ls[k]=v; }},
    db:{ref:p=>({update:v=>writes.push(["update",p,JSON.parse(JSON.stringify(v))]),set:v=>writes.push(["set",p,v])})},
    _lbWrite:()=>true, isMom:!o.noMom, momHere:()=>ctx.isMom, kitPinGate:()=>{ ctx.gated=true; }, gated:false,
    calendarData:Object.assign({holidays:{},vacations:{},kidOverrides:{}},o.cal||{}), calNormDate:s=>s, laundryData:{},
    ROSTER:["lincoln","ellis","lucy","julian"], KID_NAME:{lincoln:"Lincoln",ellis:"Ellis",lucy:"Lucy",julian:"Julian"}, cap:s=>s.charAt(0).toUpperCase()+s.slice(1),
    _hhIsoLocal:ms=>iso(new Date(ms)), esc:s=>String(s==null?"":s), hhRender:()=>{}, mwToast:t=>toasts.push(t), writes, toasts};
  vm.createContext(ctx); vm.runInContext(LL,ctx);
  vm.runInContext("llToday=function(){ return '"+(o.day||MON)+"'; }; llNowMin=function(){ return "+(o.nowMin||600)+"; };",ctx);
  if(o.line) vm.runInContext("laundryLine="+JSON.stringify(o.line)+";",ctx);
  ctx.get=e=>vm.runInContext(e,ctx); return ctx;
}
const caps=a=>({"0":a[0],"1":a[1],"2":a[2],"3":a[3],"4":a[4],"5":a[5],"6":a[6]});
const W=(c,day,n,close)=>c.llProject(day,n||7,!!close).map(r=>r.loads.join("+")||"-").join(" | ");
const CAPS=caps([1,1,2,1,1,0,0]);   // cap 1 a weekday, Wed 2 (Lucy + Julian), weekend off
const went=(day,ids)=>{ const o={}; ids.forEach((id,i)=>{ o[id]={at:i+1,load:"l_"+id,by:"mom"}; }); return {[day]:o}; };
const line=x=>Object.assign({caps:CAPS,homeFrom:"2026-10-01",asOf:MON,carry:[]},x);
const over=(day,ids)=>{ const o={}; ids.forEach((id,i)=>{ o[id]=i+1; }); return {[day]:o}; };

console.log("── (1) an extra sits on today, no slot ──");
{ const base=mk({line:line({})}); ok("the plain week: Mon Lincoln · Tue Ellis · Wed Lucy+Julian · Thu Mom & Dad · Fri Towels", W(base,MON,5)==="lincoln | ellis | lucy+julian | momdad | towels", W(base,MON,5));
  const c=mk({line:line({over:over(MON,["towels"])})}); const r=c.llProject(MON,5);
  ok("➕ Towels on Monday: Lincoln + Towels (2 on a cap of 1) — Lincoln keeps his day", r[0].loads.join("+")==="lincoln+towels", r[0].loads);
  ok("…marked over, not bumped", r[0].over.join()==="towels"&&!r[0].bumped.length, [r[0].over,r[0].bumped]);
  ok("…Tue–Fri unchanged (Towels still on Friday until it goes in)", W(c,MON,5)==="lincoln+towels | ellis | lucy+julian | momdad | towels", W(c,MON,5)); }
{ const base=mk({line:line({carry:["ellis","lucy"]})}), c=mk({line:line({carry:["ellis","lucy"],over:over(MON,["lucy"])})});
  ok("behind: ➕ Lucy while Ellis is first — Monday Ellis + Lucy, Tue–Fri as they were", c.llProject(MON,1)[0].loads.join("+")==="ellis+lucy"&&W(c,MON,5).split(" | ").slice(1).join("|")===W(base,MON,5).split(" | ").slice(1).join("|"), [W(base,MON,5),W(c,MON,5)]); }

console.log("── (2) started = washed ahead of its day (LL_EARLY) ──");
{ const e=mk({line:line({log:went(MON,["towels"])})}), c=mk({line:line({log:went(MON,["towels"]),over:over(MON,["towels"])})});
  ok("➕ Towels started Monday: the whole week = an early wash (Friday's Towels covered)", W(c,MON,5)===W(e,MON,5)&&W(c,MON,5)==="towels+lincoln | ellis | lucy+julian | momdad | -", [W(c,MON,5),W(e,MON,5)]);
  ok("…Towels is early (over the cap)", c.llProject(MON,1)[0].early.join()==="towels"); }
{ const e=mk({line:line({carry:["ellis","lucy"],log:went(MON,["lucy"])})}), c=mk({line:line({carry:["ellis","lucy"],log:went(MON,["lucy"]),over:over(MON,["lucy"])})});
  ok("➕ Lucy (waiting) started Monday: her missed turn paid — the week = the early wash", W(c,MON,5)===W(e,MON,5)&&c.llProject(MON,1)[0].loads.join("+")==="lucy+ellis", [W(c,MON,5),W(e,MON,5)]); }

console.log("── (3) not started → gone, the line as if never tapped ──");
{ const n=mk({line:line({})}), c=mk({line:line({over:over(MON,["towels"])})});
  ok("after 8 PM Monday: Towels off today", c.llProject(MON,1,true)[0].loads.indexOf("towels")<0&&!c.llProject(MON,1,true)[0].over.length, c.llProject(MON,1,true)[0]);
  const t=mk({day:TUE,line:line({over:over(MON,["towels"])})}), tn=mk({day:TUE,line:line({})});
  ok("Tuesday on: exactly as with no extra ever", W(t,TUE,4)===W(tn,TUE,4), [W(t,TUE,4),W(tn,TUE,4)]);
  ok("…and the roll saves the same line (carry / next / credit)", JSON.stringify(t.llStateAt(TUE).state())===JSON.stringify(tn.llStateAt(TUE).state()), [t.llStateAt(TUE).state(),tn.llStateAt(TUE).state()]); }
{ const c=mk({line:line({carry:["ellis","lucy"],over:over(MON,["lucy"])}),day:TUE}), n=mk({line:line({carry:["ellis","lucy"]}),day:TUE});
  ok("behind + not started: the waiting pile is untouched", JSON.stringify(c.llStateAt(TUE).state())===JSON.stringify(n.llStateAt(TUE).state()), [c.llStateAt(TUE).state(),n.llStateAt(TUE).state()]); }

console.log("── (4) ⏫ Instead = the old ⏫ Today ──");
{ const c=mk({line:line({bump:{[MON]:{towels:1}}})}); const r=c.llProject(MON,2);
  ok("bump Towels: Towels takes Monday's slot, Lincoln slides to Tuesday (unchanged)", r[0].loads.join("+")==="towels"&&r[1].loads[0]==="lincoln"&&!r[0].over.length, r.map(x=>x.loads)); }

console.log("── (5) the toggle, the question, the grid ──");
{ const c=mk({line:line({})}); c.llOverToggle("towels");
  ok("➕ writes laundryLine over/<today>/towels = tap time, one targeted update", c.writes.length===1&&c.writes[0][1]==="laundryLine"&&typeof c.writes[0][2]["over/"+MON+"/towels"]==="number"&&Object.keys(c.writes[0][2]).every(k=>k==="over/"+MON+"/towels"||/^items\/|^asOf$/.test(k)), c.writes);
  ok("…toast: extra today, nothing moves", /➕ Towels — extra today, nothing moves/.test(c.toasts[0]||""), c.toasts);
  ok("…the line card now offers ↩ Unbump on Towels (llOverToggle)", /llOverToggle\('towels'\)"[^>]*>↩ Unbump/.test(c.llCardHTML(true)));
  c.llOverToggle("towels"); ok("↩ Unbump: over/<today>/towels = null; off today", c.writes[1][2]["over/"+MON+"/towels"]===null&&c.llProject(MON,1)[0].loads.join()==="lincoln", c.writes[1]); }
{ const c=mk({line:line({})}); c.llOverToggle("lincoln"); ok("already on today (Lincoln): nothing written", c.writes.length===0); }
{ const c=mk({line:line({bump:{[MON]:{towels:1}}})}); c.llOverToggle("towels"); ok("already bumped: nothing written", c.writes.length===0); }
{ const c=mk({line:line({over:over(MON,["towels"])})}); c.llBump("towels"); ok("an extra can't also be bumped", c.writes.length===0); }
{ const c=mk({line:line({over:over(MON,["towels"]),log:went(MON,["towels"])})}); c.llOverToggle("towels"); ok("went in: the extra stands (no undo write)", c.writes.length===0); }
{ const c=mk({line:line({}),noMom:true}); c.llOverToggle("towels"); ok("not Mom: the code gate, nothing written", c.gated&&c.writes.length===0); }
{ const c=mk({line:line({})}); let H=c.llCardHTML(true);
  ok("⏫ Today on a load not on today opens the question (llBumpAskOpen)", /llBumpAskOpen\('towels'\)"[^>]*>⏫ Today/.test(H)&&!/llBumpAskOpen\('lincoln'\)/.test(H));
  c.llBumpAskOpen("towels"); H=c.llCardHTML(true);
  ok("the question: ⏫ Instead — Lincoln moves to tomorrow · ➕ Extra · Cancel", /class="ll-bumpask"/.test(H)&&/⏫ Instead — Lincoln moves to tomorrow/.test(H)&&/llOverToggle\('towels'\)[^>]*>➕ Extra — over the cap, nothing moves/.test(H)&&/>Cancel</.test(H), H.slice(H.indexOf("ll-bumpask"),H.indexOf("ll-bumpask")+900));
  ok("…asking writes nothing and leaves no bump behind", c.writes.length===0&&!(c.get("laundryLine").bump), c.get("laundryLine").bump);
  ok("…Instead runs the old llBump", /llBumpAsk=null;llBump\('towels'\)/.test(H)); }
{ const c=mk({line:line({caps:caps([2,1,2,1,1,0,0])})}); c.llBumpAskOpen("towels");
  ok("room under the cap: Instead says nothing moves", /⏫ Instead — takes a slot, nothing moves/.test(c.llCardHTML(true))); }
{ const c=mk({line:line({over:over(MON,["towels"])})}); const G=c.llWeekGridHTML(MON,false,true);
  ok("week grid: ➕ Towels on today, with 🫧Start", /➕ Towels/.test(G)&&/llStart\('towels'\)/.test(G), G.slice(0,200)); }

console.log("── (6) a backed-up week, replayed ──");
// Two loads behind (Ellis, Lucy). Each weekday the day's planned loads go in; on the "extras" run Mom also ➕ adds one waiting load a
// day and starts it. Friday night: the extras run should be caught up by exactly the loads she added, and the planned loads untouched.
const DAYS=["2026-10-19","2026-10-20","2026-10-21","2026-10-22","2026-10-23"];
function replay(extra){ let log={}, ov={}; const planned=[];
  DAYS.forEach(function(d,k){ const add=extra[k]; if(add){ ov[d]={[add]:1}; }
    const c=mk({day:d,line:line({carry:["ellis","lucy"],log:JSON.parse(JSON.stringify(log)),over:JSON.parse(JSON.stringify(ov))})}), r=c.llProject(d,1)[0];
    const plan=r.loads.filter(id=>r.over.indexOf(id)<0); planned.push(plan.join("+"));
    const g={}; plan.concat(add?[add]:[]).forEach((id,i)=>{ g[id]={at:i+1,load:"l_"+id+d,by:"mom"}; }); log[d]=g; });
  const f=mk({day:"2026-10-24",line:line({carry:["ellis","lucy"],log:log,over:ov})}); return {planned:planned,state:f.llStateAt("2026-10-24").state(),week:W(f,"2026-10-24",2)}; }
{ const none=replay([]), ext=replay(["lucy",null,null,null,null]);
  ok("no extras: still 2 behind on Saturday", none.state.carry.length===2, none);
  ok("➕ Lucy on Monday: one load less behind on Saturday (Towels only, not Mom & Dad + Towels)", ext.state.carry.length===none.state.carry.length-1&&ext.state.carry.join()==="towels", [ext.state,none.state]);
  ok("…Monday's planned load still went in; the planned list only shrank where Lucy was already paid", ext.planned[0]===none.planned[0], [ext.planned,none.planned]);
  const two=replay(["lucy","ellis",null,null,null]);
  ok("two extras (Mon Lucy, Tue Ellis): caught up by Saturday, and no load washed twice for one turn", two.state.carry.length===0&&JSON.stringify(two.planned).split("ellis").length<=JSON.stringify(none.planned).split("ellis").length, [two.planned,none.planned,two.state]); }
{ const c=mk({line:line({over:over(MON,["towels"])})}); c.llProject(MON,7); c.llCardHTML(true); c.llWeekGridHTML(MON,false,true); ok("laying, the card and the grid write nothing", c.writes.length===0, c.writes); }

console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
