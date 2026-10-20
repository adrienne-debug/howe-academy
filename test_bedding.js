/*
 * 🛏 BEDDING (her plan 2026-10-19/20: "if not the blanket week then both beds sheets can fit in one load … i think if there is even one
 * blanket it will be 2 loads"; blankets every 2 weeks "unless peed on"; due = within 3 days of the sheets day). Queen sheets ride King
 * sheets (one load) unless a blanket is due for either bed — then two loads, each bed's sheets + its blanket. Blankets never take a slot.
 * run: node test_bedding.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,400)+")":"")); } };
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("missing "+a); return src.slice(i,j); };
const LL=cut("// LAUNDRYLINE_START","// LAUNDRYLINE_END");
const iso=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
function mk(o){ o=o||{}; const writes=[], ls={};
  const ctx={console,Object,Array,String,Number,parseInt,Math,JSON,Date,
    HA_LS:{getItem:k=>ls[k]||null,setItem:(k,v)=>{ ls[k]=v; }},
    db:{ref:p=>({update:v=>writes.push(["update",p,JSON.parse(JSON.stringify(v))]),set:v=>writes.push(["set",p,JSON.parse(JSON.stringify(v))]),remove:()=>writes.push(["rm",p])})},
    _lbWrite:()=>true, momHere:()=>true, _kioskD:()=>false, laundryData:{}, calendarData:{holidays:{},vacations:{},kidOverrides:{}}, calNormDate:s=>s,
    ROSTER:["lincoln","ellis","lucy","julian"], KID_NAME:{lincoln:"Lincoln",ellis:"Ellis",lucy:"Lucy",julian:"Julian"}, cap:s=>s.charAt(0).toUpperCase()+s.slice(1),
    _hhIsoLocal:ms=>iso(new Date(ms)), esc:s=>String(s==null?"":s), hhRender:()=>{}, mwToast:()=>{}, writes};
  vm.createContext(ctx); vm.runInContext(LL,ctx);
  vm.runInContext("llToday=function(){ return '"+(o.day||"2026-10-26")+"'; }; llNowMin=function(){ return 600; };",ctx);
  const line={caps:{"0":3,"1":1,"2":2,"3":1,"4":3,"5":0,"6":0},asOf:o.day||"2026-10-26",homeFrom:"2026-10-19",
    items:{lincoln:{label:"Lincoln's clothes",order:0,home:0},sheets:{label:"King sheets + pad panels",order:1,home:0,doer:"mom"},queen:{label:"Queen sheets",order:2,home:0,doer:"mom",with:"sheets",splitBlanket:true},ellis:{label:"Ellis's clothes",order:3,home:1}},
    extras:Object.assign({x_bk:{label:"King blanket",every:2,unit:"w",last:o.bk||"2026-10-19",rideWith:"sheets",order:0},x_bq:{label:"Queen blankets",every:2,unit:"w",last:o.bq||"2026-10-19",rideWith:"queen",order:1}},o.extras||{})};
  if(o.log) line.log=o.log;
  vm.runInContext("laundryLine="+JSON.stringify(line)+";",ctx); ctx.get=e=>vm.runInContext(e,ctx); return ctx; }
const day=(c,d)=>c.llProject(d,1,false)[0];

console.log("1. A sheets-only Monday (blankets washed 10/19, due 11/2)");
{ const c=mk(); const r=day(c,"2026-10-26");
  ok("Mon 10/26: ONE bedding load — the King sheets with the Queen riding — plus Lincoln", r.loads.join()==="lincoln,sheets", r.loads);
  ok("…called 'King sheets + pad panels + Queen sheets' (no blanket)", c.llLabelFull("sheets","2026-10-26")==="King sheets + pad panels + Queen sheets", c.llLabelFull("sheets","2026-10-26"));
}
console.log("2. A blanket Monday — both due → two loads, each with its blanket");
{ const c=mk({day:"2026-11-02"}); const r=day(c,"2026-11-02");
  ok("Mon 11/2: Lincoln + King sheets + Queen sheets (two bedding loads)", r.loads.join()==="lincoln,sheets,queen", r.loads);
  ok("names: 'King sheets + pad panels + King blanket' · 'Queen sheets + Queen blankets'", c.llLabelFull("sheets","2026-11-02")==="King sheets + pad panels + King blanket"&&c.llLabelFull("queen","2026-11-02")==="Queen sheets + Queen blankets", [c.llLabelFull("sheets","2026-11-02"),c.llLabelFull("queen","2026-11-02")]);
  ok("blankets never take a slot of their own", r.loads.indexOf("x_bk")<0&&r.loads.indexOf("x_bq")<0);
}
console.log("3. Only one blanket due → still two loads (her rule)");
{ const c=mk({day:"2026-11-02",bk:"2026-10-24"});   // king blanket peed on Sat 10/24 → due 11/7, more than 3 days after 11/2
  const r=day(c,"2026-11-02");
  ok("king washed 10/24 (due 11/7 — not within 3 days); queen due → two loads: King sheets alone, Queen sheets + blankets", r.loads.join()==="lincoln,sheets,queen"&&c.llLabelFull("sheets","2026-11-02")==="King sheets + pad panels"&&c.llLabelFull("queen","2026-11-02")==="Queen sheets + Queen blankets", [r.loads,c.llLabelFull("sheets","2026-11-02")]);
  const w=mk({day:"2026-11-02",bk:"2026-10-22"});   // due 11/5 = 11/2 + 3 → counts
  ok("due 11/5 (3 days after Monday) counts as that Monday's", w.llBlanketDue("x_bk","2026-11-02"));
}
console.log("4. Starting the load washes its blanket");
{ const c=mk({day:"2026-11-02"}); c.llStart("sheets");
  const set=c.writes.find(w=>w[0]==="set"), up=c.writes.find(w=>w[0]==="update")[2];
  ok("🫧 Start King: the load is 'King sheets + pad panels + King blanket'; the blanket logged with it, last = today", set[2].label==="King sheets + pad panels + King blanket"&&up["log/2026-11-02/x_bk"].with==="sheets"&&up["extras/x_bk/last"]==="2026-11-02", [set[2].label,up]);
  ok("…the split holds after the start (the queen is still its own load today)", day(c,"2026-11-02").loads.join()==="sheets,lincoln,queen"||day(c,"2026-11-02").loads.indexOf("queen")>=0, day(c,"2026-11-02").loads);
  ok("the king blanket's next is 11/16", c.llDue(c.get("laundryLine.extras.x_bk"))==="2026-11-16");
  const lid=set[1].slice(8); c.writes.length=0; c.llUnstart(lid);
  ok("un-start: out of the washer, and the blanket's date goes back to 10/19", c.get("laundryLine.extras.x_bk.last")==="2026-10-19"&&!c.get("laundryLine.log['2026-11-02'].x_bk"), c.writes);
}
console.log("5. Looking ahead");
{ const c=mk(); const R=c.llProject("2026-10-26",22,false).filter(r=>r.dow===0).map(r=>r.iso.slice(5)+":"+r.loads.filter(x=>x!=="lincoln").join("+"));
  ok("Mondays: 10/26 one load · 11/2 two · 11/9 one · 11/16 two", R.join(" ")==="10-26:sheets 11-02:sheets+queen 11-09:sheets 11-16:sheets+queen", R);
  const t=mk(); ok("Tuesday (laid from Monday) is just Ellis — no blanket loads anywhere else", t.llProject("2026-10-26",2,false)[1].loads.join()==="ellis");
}
console.log("6. ✓ Done counts the blanket too; ↶ puts it back");
{ const c=mk({day:"2026-11-02"}); c.llMarkDone("queen"); ok("✓ Done Queen on a blanket Monday: queen blankets washed today", c.get("laundryLine.extras.x_bq.last")==="2026-11-02");
  c.llUndone("queen"); ok("↶: back to 10/19", c.get("laundryLine.extras.x_bq.last")==="2026-10-19");
}
console.log("7. Her settings in the app");
{ const c=mk(); c.get("llEdId='queen'"); const h=c.llCardHTML(); ok("✎ on a load: 🔗 Wash with + 'its own load when a blanket is due'", /id="lle-split" checked/.test(h)&&/<option value="sheets" selected>/.test(h));
  c.get("llEdId='x_bk'"); ok("✎ on an every-few-weeks item: 🧺 Goes in with", /id="llxe-ride"/.test(c.llCardHTML())&&/<option value="sheets" selected>King sheets/.test(c.llCardHTML()));
}
console.log("8. Her 10/19 night: the queen's sheets went in with the king's before the split existed");
{ const c=mk({day:"2026-10-19",log:{"2026-10-19":{sheets:{at:1,by:"mom",load:"L1"},queen:{at:1,by:"mom",load:"L1",with:"sheets"}}}});
  const r=c.llProject("2026-10-19",2,true);
  ok("10/19 (a split day — blankets washed today): both loads ✓, nothing slides to Tuesday", r[0].started.indexOf("sheets")>=0&&r[0].started.indexOf("queen")>=0&&r[0].moved.indexOf("sheets")<0&&r[0].moved.indexOf("queen")<0&&r[1].loads.indexOf("queen")<0&&r[1].loads.indexOf("sheets")<0, r.map(x=>[x.loads,x.started,x.moved]));
  const f=mk({day:"2026-10-26"}).llProject("2026-10-26",22,false).filter(x=>x.dow===0); ok("each Monday's names come from its own lay (11/9 has no blanket)", f[2].lbl.sheets==="King sheets + pad panels + Queen sheets"&&f[1].lbl.sheets==="King sheets + pad panels + King blanket", f.map(x=>x.lbl));
}
ok("no 🔀", src.indexOf("🔀")<0);
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
