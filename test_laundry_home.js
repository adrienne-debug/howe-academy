/*
 * 📅 HOME DAYS (her ask 2026-10-17: "on a good week, Lincoln is typically on Monday. So if everything is caught up, then Lincoln would
 * revert to Monday. Ellis Tuesday"; her pick: a caught-up day gets ONLY its home-day loads). Each load joins the line on its home day
 * behind anything waiting (unless it went in this past week — a bump); caps fill from the front.  run: node test_laundry_home.js
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
const HER=caps([1,1,1,1,1,0,0]), ROOMY=caps([2,2,2,2,2,0,0]);
const W=(c,day,n,close)=>c.llProject(day,n||7,!!close).map(r=>r.loads.join("+")||"-").join(" | ");

console.log("1. The home days");
{ const c=mk({line:{caps:ROOMY,asOf:MON,homeFrom:MON}});
  ok("defaults from her little schedule: Lincoln Mon, Ellis Tue, Lucy + Julian Wed, ours Thu, towels Fri", ["lincoln","ellis","lucy","julian","momdad","towels"].map(c.llHome).join()==="0,1,2,2,3,4");
  ok("home days is the default mode", c.llMode()==="home");
  ok("a caught-up week (Wed cap 2): every load on its own day", W(c,MON)==="lincoln | ellis | lucy+julian | momdad | towels | - | -", W(c,MON));
  const r=mk({line:{caps:caps([3,3,3,3,3,3,0]),asOf:MON}});
  ok("room for 3 a day: still only the home-day loads (her pick — nothing pulled forward)", W(r,MON)==="lincoln | ellis | lucy+julian | momdad | towels | - | -", W(r,MON));
  ok("…and the next week the same", W(r,MON,14).split(" | ").slice(7).join(" | ")==="lincoln | ellis | lucy+julian | momdad | towels | - | -");
}
console.log("2. Her caps today (1 a day, Mon–Fri): Lucy and Julian share Wednesday");
{ const c=mk({line:{caps:HER,asOf:MON,homeFrom:MON}});
  ok("Wed takes Lucy; Julian waits → Thu, and Mom & Dad's → Fri, towels → next Mon", W(c,MON,8)==="lincoln | ellis | lucy | julian | momdad | - | - | towels", W(c,MON,8));
  const s=mk({line:{caps:HER,asOf:MON,items:{julian:{label:"Julian's clothes",order:3,home:3},lincoln:{label:"Lincoln's clothes",order:0},ellis:{label:"Ellis's clothes",order:1},lucy:{label:"Lucy's clothes",order:2},momdad:{label:"Mom & Dad's clothes",order:4,home:4},towels:{label:"Towels",order:5,home:5}}}});
  ok("give each its own day (Julian Thu, ours Fri, towels Sat with a Sat cap) → caught up", W(mk({line:Object.assign({},s.get("laundryLine"),{caps:caps([1,1,1,1,1,1,0])})}),MON)==="lincoln | ellis | lucy | julian | momdad | towels | -");
}
console.log("3. A missed day: it waits at the front, the caps fill, then back on its day");
{ const c=mk({day:TUE,line:{caps:ROOMY,asOf:MON,homeFrom:MON}});
  ok("Monday nothing went in → Tue: Lincoln (waiting) + Ellis; Wed back to Lucy + Julian", W(c,TUE,4)==="lincoln+ellis | lucy+julian | momdad | towels", W(c,TUE,4));
  const h=mk({day:TUE,line:{caps:HER,asOf:MON,homeFrom:MON}});
  ok("with cap 1: Lincoln Tue, Ellis Wed, Lucy Thu… everything one day late until a cap goes up", W(h,TUE,3)==="lincoln | ellis | lucy", W(h,TUE,3));
  const r=mk({day:"2026-10-22",line:{caps:ROOMY,asOf:MON,homeFrom:MON}}); r.llRoll();
  ok("the saved roll on Thursday after a dead Mon–Wed: carry Lincoln, Ellis, Lucy, Julian", JSON.stringify(r.writes[0][2].carry)==='["lincoln","ellis","lucy","julian"]', r.writes[0]);
  ok("…Thu: Lincoln + Ellis, Fri: Lucy + Julian, next Mon: Mom & Dad + towels, then Lincoln's own Monday", W(r,"2026-10-22",5)==="lincoln+ellis | lucy+julian | - | - | momdad+towels", W(r,"2026-10-22",5));
}
console.log("4. ⏫ A bump counts as her week");
{ const c=mk({line:{caps:ROOMY,asOf:MON,homeFrom:MON,bump:{[MON]:{lucy:1}}}});
  ok("Lucy bumped onto Monday: Mon Lucy + Lincoln; Wednesday is Julian alone (no second Lucy)", W(c,MON,3)==="lucy+lincoln | ellis | julian", W(c,MON,3));
  ok("…and next Wednesday Lucy is back on her day", W(c,MON,10).split(" | ")[9]==="lucy+julian", W(c,MON,10));
  const l=mk({line:{caps:ROOMY,asOf:MON,homeFrom:MON,log:{"2026-10-12":{lincoln:{at:1}}}}});
  ok("washed a week ago Monday: due again this Monday", W(l,MON,1)==="lincoln");
}
console.log("4b. A late wash pays off the missed turn — it never cancels next week (her real 10/15–10/16)");
{ const c=mk({day:"2026-10-17",line:{caps:ROOMY,asOf:"2026-10-15",homeFrom:"2026-10-15",log:{"2026-10-16":{momdad:{at:1}}}}});
  ok("ours missed Thu 10/15, washed Fri 10/16 while waiting → still due Thu 10/22", c.llProject("2026-10-17",6,false)[5].loads.indexOf("momdad")>=0, W(c,"2026-10-17",6));
  const e=mk({day:"2026-10-20",line:{caps:ROOMY,asOf:"2026-10-19",homeFrom:"2026-10-19",log:{"2026-10-19":{momdad:{at:1}}}}}); e.llRoll();
  ok("washed EARLY (Mon, not waiting): the saved roll keeps a credit, and Thursday is skipped", JSON.stringify(e.writes[0][2].credit)==='{"momdad":true}'&&W(e,"2026-10-20",3).split(" | ")[2].indexOf("momdad")<0, [e.writes[0][2],W(e,"2026-10-20",3)]);
  ok("…the Thursday after, ours is back", W(e,"2026-10-20",10).split(" | ")[9].indexOf("momdad")>=0, W(e,"2026-10-20",10));
}
console.log("4c. Starting home days clean (her real 10/17 line: a rotation carry of Lincoln, Ellis, Lucy, Julian)");
{ const old={caps:caps([2,1,2,1,3,0,0]),asOf:"2026-10-17",carry:["lincoln","ellis","lucy","julian"],next:"towels"};
  const c=mk({day:"2026-10-19",line:old});
  ok("no homeFrom yet: the old carry is ignored — Mon Lincoln, Tue Ellis, Wed Lucy + Julian (nobody twice)", W(c,"2026-10-19",3)==="lincoln | ellis | lucy+julian", W(c,"2026-10-19",3));
  c.llRoll(); const w=c.writes[0][2]; ok("the first roll saves homeFrom = today with a clean carry", w.homeFrom==="2026-10-19"&&w.carry===null&&w.asOf==="2026-10-19", w);
  ok("…and from then on the line reads the same", W(c,"2026-10-19",3)==="lincoln | ellis | lucy+julian");
  const r=mk({line:Object.assign({},old,{mode:"rotate"}),day:"2026-10-19"}); ok("plain rotation keeps its carry as before", W(r,"2026-10-19",1)==="lincoln+ellis");
}
console.log("5. Breaks and jump-ins");
{ const c=mk({line:{caps:ROOMY,asOf:MON,homeFrom:MON},cal:{holidays:{h:{name:"Teacher day",start:WED,end:WED,pause:"all"}}}});
  ok("Wed paused: Lucy + Julian wait → Thu (cap 2), ours slides to Fri with the towels", W(c,MON,5)==="lincoln | ellis | - | lucy+julian | momdad+towels", W(c,MON,5));
  const j=mk({line:{caps:ROOMY,asOf:MON,homeFrom:MON,jump:{[WED]:{w1:{label:"Towels",at:1}}}}});
  ok("a jump-in Wednesday takes a slot: Lucy goes, Julian waits a day", W(j,MON,4)==="lincoln | ellis | lucy | julian+momdad", W(j,MON,4));
}
console.log("6. Mom's controls");
{ const c=mk({line:{caps:ROOMY,asOf:MON,homeFrom:MON}}); const h=c.llCardHTML();
  ok("each load has a 📅 day chip; no Up next in home mode; the switch is there", /llHomeNext\('lincoln'\)"[^>]*>📅 Mon/.test(h)&&/llHomeNext\('julian'\)"[^>]*>📅 Wed/.test(h)&&!/llSetNext\(/.test(h)&&/llModeSet\('home'\)/.test(h)&&/llModeSet\('rotate'\)/.test(h)&&/Each load has a home day/.test(h));
  c.llHomeNext("julian"); const w=c.writes[0][2];
  ok("📅 tap on Julian: Wed → Thu, written as items/julian/home = 3 (first edit writes the items)", w["items/julian"]&&w["items/julian"].home===3&&c.llHome("julian")===3, w);
  c.writes.length=0; c.llModeSet("rotate"); const m=c.writes[0][2];
  ok("🔁 Plain rotation: mode + a fresh start today (carry cleared, asOf)", m.mode==="rotate"&&m.carry===undefined||m.mode==="rotate"&&"asOf" in m, m);
  ok("in rotation the old behaviour is back (Up next shows)", c.llMode()==="rotate"&&/llSetNext\(/.test(c.llCardHTML()));
  const r=mk({line:{caps:caps([3,3,3,3,3,0,0]),asOf:MON,mode:"rotate"}}); ok("…a cap-3 Monday is Lincoln, Ellis, Lucy again", W(r,MON,1)==="lincoln+ellis+lucy");
  const k=mk({noMom:true,line:{caps:ROOMY,asOf:MON,homeFrom:MON}}); k.llHomeNext("lincoln"); ok("a kid's device: PIN, nothing written, no chips", k.gated&&k.writes.length===0&&!/llHomeNext/.test(k.llCardHTML()));
}
ok("no 🔀", src.indexOf("🔀")<0);
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
