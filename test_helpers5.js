// test_helpers5.js — 🙋 slice 3: the week build plans around a REGULAR helper (Grandma Wed 9:30–12).
// Runs the REAL packDay + packAround from index.html. With no helper on any item the packer must be byte-for-byte
// what it was (fuzzed against the pre-helper packer when HA_BASE points at an older index.html).
// Usage: node test_helpers5.js [index.html]   (optional env HA_BASE=<pre-change index.html> for the fuzz control)
const fs=require("fs"), vm=require("vm"), path=require("path");
const file=process.argv[2]||process.env.HA_INDEX||path.join(__dirname,"index.html");
const src=fs.readFileSync(file,"utf8");
let pass=0, fail=0;
function ok(c,m,x){ if(c) pass++; else { fail++; console.log("FAIL:",m,x!==undefined?JSON.stringify(x):""); } }
function extractFn(s,name){
  const i=s.indexOf("function "+name+"("); if(i<0) throw new Error("not found: "+name);
  let depth=0, started=false;
  for(let k=s.indexOf("{",i);k<s.length;k++){ const c=s[k]; if(c==="{"){depth++;started=true;} else if(c==="}"){depth--; if(started&&depth===0) return s.slice(i,k+1);} }
  throw new Error("unbalanced "+name);
}
const toMin=t=>{ const m=String(t||"").match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i); if(!m) return NaN; let h=+m[1]; const ap=(m[3]||"").toUpperCase(); if(ap==="PM"&&h!==12)h+=12; if(ap==="AM"&&h===12)h=0; return h*60+ +m[2]; };
const fromMin=v=>{ let h=Math.floor(v/60), m=v%60; const ap=h>=12?"PM":"AM"; let hh=h%12; if(hh===0)hh=12; return hh+":"+String(m).padStart(2,"0")+" "+ap; };
function packer(s){
  const ctx={toMin,fromMin,taskDevice:t=>t.device||"paper",gwDeviceCaps:()=>({screen:2,computer:1,ipadLucy:1}),console,Math,Object,Array,JSON,String,Set};
  vm.createContext(ctx); vm.runInContext(extractFn(s,"packDay")+"\n"+extractFn(s,"packAround"),ctx); return ctx;
}
const P=packer(src);
const DAY={start:9*60,end:16*60,lunchStart:13*60,lunchEnd:14*60};
const it=(id,who,dur,mom,extra)=>Object.assign({id,who,durMin:dur,momRequired:!!mom,lane:null},extra||{});
const G={id:"g",s:9*60+30,e:12*60};

// 1. Grandma's cards land in her window, alongside Mom
{
  const items=[it("a_nb","andrew",20,false),it("k_nb","makenzie",20,false),
    it("a_ph","andrew",25,true,{helper:G}),it("k_ap","makenzie",30,true),
    it("a_sp","andrew",20,true,{helper:G}),it("k_aas","makenzie",20,true,{helper:G}),it("a_ar","andrew",30,true)];
  const r=P.packDay(items,DAY);
  const at=id=>r.byId[id];
  ok(at("a_ph")===9*60+30,"Andrew's phonics starts when Grandma arrives (9:30)",fromMin(at("a_ph")));
  ok(at("k_ap")===9*60+20,"Mom takes Makenzie's Apologia at 9:20 — not waiting behind phonics",fromMin(at("k_ap")));
  ok(at("a_sp")===9*60+55,"Andrew's spelling test follows phonics with Grandma",fromMin(at("a_sp")));
  ok(at("k_aas")===10*60+15,"Makenzie's AAS test with Grandma after Andrew's (one at a time, and after Mom's Apologia)",fromMin(at("k_aas")));
  ok(at("a_ar")===10*60+15,"Andrew's Arithmetic with Mom waits for HIM (with Grandma till 10:15), not for Grandma's clock",fromMin(at("a_ar")));
  // nothing overlaps for a kid
  const kidIv={}; items.forEach(x=>{ (kidIv[x.who]=kidIv[x.who]||[]).push([at(x.id),at(x.id)+x.durMin]); });
  let clash=false; Object.values(kidIv).forEach(a=>{ a.sort((p,q)=>p[0]-q[0]); for(let i=1;i<a.length;i++) if(a[i][0]<a[i-1][1]) clash=true; });
  ok(!clash,"no kid is double-booked");
  // Grandma never double-booked
  const gIv=["a_ph","a_sp","k_aas"].map(id=>[at(id),at(id)+items.find(x=>x.id===id).durMin]).sort((p,q)=>p[0]-q[0]);
  ok(gIv.every((v,i)=>i===0||v[0]>=gIv[i-1][1]),"Grandma does one at a time");
  ok(gIv.every(v=>v[0]>=G.s&&v[1]<=G.e),"all inside 9:30–12");
}
// 2. Same day, no helper → everything on Mom (the control)
{
  const items=[it("a_nb","andrew",20,false),it("k_nb","makenzie",20,false),
    it("a_ph","andrew",25,true),it("k_ap","makenzie",30,true),it("a_sp","andrew",20,true),it("k_aas","makenzie",20,true),it("a_ar","andrew",30,true)];
  const r=P.packDay(items,DAY);
  ok(r.byId.a_ph===9*60+20&&r.byId.k_ap===9*60+45,"control: without her, Mom does phonics then Apologia serially");
}
// 3. Window too short → falls back to Mom
{
  const short={id:"g",s:9*60+30,e:9*60+40};
  const r=P.packDay([it("a_ph","andrew",25,true,{helper:short}),it("k_ap","makenzie",30,true)],DAY);
  ok(r.byId.a_ph===9*60&&r.byId.k_ap===9*60+25,"doesn't fit her window → Mom's, exactly as before",[fromMin(r.byId.a_ph),fromMin(r.byId.k_ap)]);
}
// 4. Card would run past her leaving → Mom's
{
  const r=P.packDay([it("a_long","andrew",200,false),it("a_ph","andrew",25,true,{helper:G})],DAY);
  ok(r.byId.a_ph===9*60+200,"kid busy past her window → falls back to Mom path",fromMin(r.byId.a_ph));
}
// 5. A device card ignores the helper
{
  const r=P.packDay([it("k_ap","makenzie",30,true),it("a_ipad","andrew",20,true,{helper:G,lane:"computer"})],DAY);
  ok(r.byId.a_ipad===9*60+30,"computer card stays on Mom's path",fromMin(r.byId.a_ipad));
}
// 6. Lunch is stepped over inside her window
{
  const W={id:"g",s:12*60+50,e:14*60+40};
  const r=P.packDay([it("a_x","andrew",230,false),it("a_ph","andrew",25,true,{helper:W})],DAY);
  ok(r.byId.a_ph===14*60,"her card steps over lunch",fromMin(r.byId.a_ph));
}
// 7. packAround: helperFor feeds item.helper; no helperFor = no change
{
  const T=()=>[{id:"a_ph",who:"andrew",dur:25,mom:"required",device:"paper",subjectKey:"phonics"},{id:"k_ap",who:"makenzie",dur:30,mom:"required",device:"paper",subjectKey:"ap"}];
  const t1=T(); P.packAround([],t1,Object.assign({},DAY,{helperFor:t=>t.subjectKey==="phonics"?G:null}));
  ok(t1[0].time==="9:30 AM"&&t1[1].time==="9:00 AM","packAround: helperFor puts phonics with Grandma",[t1[0].time,t1[1].time]);
  const t2=T(); P.packAround([],t2,DAY);
  ok(t2[0].time==="9:00 AM"&&t2[1].time==="9:25 AM","packAround: no helperFor → as before");
  const t3=T(); t3[0].mom="none"; let asked=0; P.packAround([],t3,Object.assign({},DAY,{helperFor:t=>{asked++; return G;}}));
  ok(asked===1,"helperFor is only asked about Mom-required cards");
}
// 8. Fuzz: no helper anywhere → identical to the pre-change packer
const basePath=process.env.HA_BASE;
if(basePath&&fs.existsSync(basePath)){
  const B=packer(fs.readFileSync(basePath,"utf8"));
  let seed=7; const rnd=()=>{ seed=(seed*1103515245+12345)&0x7fffffff; return seed/0x7fffffff; };
  const kids=["a","b","c","d"], lanes=[null,"computer","screen","ipadLucy","paper"];
  let same=0, N=300;
  for(let n=0;n<N;n++){
    const items=[]; const m=3+Math.floor(rnd()*14);
    for(let i=0;i<m;i++) items.push({id:"x"+i,who:kids[Math.floor(rnd()*4)],durMin:10+Math.floor(rnd()*40),momRequired:rnd()<0.45,lane:lanes[Math.floor(rnd()*5)]});
    const ctx={start:9*60,end:16*60,lunchStart:13*60,lunchEnd:14*60,sitterStart:rnd()<0.2?10*60:0,sitterEnd:rnd()<0.2?12*60:0,allowOvertime:rnd()<0.3};
    const a=JSON.stringify(P.packDay(JSON.parse(JSON.stringify(items)),ctx)), b=JSON.stringify(B.packDay(JSON.parse(JSON.stringify(items)),ctx));
    if(a===b) same++;
  }
  ok(same===N,"fuzz: "+N+" random days with no helper pack identically to the old packer",same);
}
// 9. helperPlanWin
{
  const a=src.indexOf("// ── HELPERS_START"), b=src.indexOf("// ── HELPERS_END");
  const mk=(page)=>{ const c={console,toMin,pageOn:k=>k==="helpers"?page!==false:true,Object,Array,String,JSON};
    vm.createContext(c); vm.runInContext(src.slice(a,b)+"\nthis.__set=h=>{helpersData=h;};",c); return c; };
  const gm={name:"Grandma",pick:false,createdAt:1,days:{wednesday:{start:"9:30 AM",end:"12:00 PM"}},help:{andrew:{phonics:true}}};
  let c=mk(); c.__set({g:gm});
  const w=c.helperPlanWin("wednesday","andrew","phonics");
  ok(w&&w.id==="g"&&w.s===570&&w.e===720,"Wednesday + approved → her window",w);
  ok(c.helperPlanWin("thursday","andrew","phonics")===null,"not her day → none");
  ok(c.helperPlanWin("wednesday","andrew","math")===null,"not approved → none");
  c.__set({d:Object.assign({},gm,{pick:true})}); ok(c.helperPlanWin("wednesday","andrew","phonics")===null,"a pick-mode helper (Dad) isn't planned ahead");
  c.__set({x:Object.assign({},gm,{days:{wednesday:{start:"12:00 PM",end:"9:30 AM"}}})}); ok(c.helperPlanWin("wednesday","andrew","phonics")===null,"backwards hours → none");
  c=mk(false); c.__set({g:gm}); ok(c.helperPlanWin("wednesday","andrew","phonics")===null,"page off → none");
}
// 11. the Audit Checklist (real auditSchedule)
{
  const a=src.indexOf("// ── HELPERS_START"), b=src.indexOf("// ── HELPERS_END");
  const c={console,toMin,cap:x=>x,fbArr:x=>x,DAY_DT:{},DAY_LBL:{wednesday:"Wednesday"},rulesData:{},smapIsKidOff:()=>false,
    taskSubject:t=>t.subjectKey,gwDeviceCaps:()=>({computer:1,screen:2}),taskDevice:t=>t.device||"paper",pageOn:()=>true,Object,Array,String,JSON,Set,Math,Date};
  vm.createContext(c); vm.runInContext(src.slice(a,b)+"\n"+extractFn(src,"auditSchedule")+"\nthis.__set=h=>{helpersData=h;};",c);
  const gm={name:"Grandma",pick:false,createdAt:1,days:{wednesday:{start:"9:30 AM",end:"12:00 PM"}},help:{andrew:{phonics:true,spelling:true}}};
  const T=[{id:"1",who:"andrew",day:"wednesday",time:"9:30 AM",dur:25,mom:"required",subjectKey:"phonics"},
           {id:"2",who:"makenzie",day:"wednesday",time:"9:30 AM",dur:30,mom:"required",subjectKey:"apologia"}];
  c.__set({});
  ok(c.auditSchedule(T,{}).some(x=>/two Mom-Required at once/.test(x)),"control: no helper → audit flags the overlap");
  c.__set({g:gm});
  ok(!c.auditSchedule(T,{}).some(x=>/two Mom-Required|Grandma/.test(x)),"Grandma's card overlapping Mom's → no false warning",c.auditSchedule(T,{}));
  const T2=T.concat([{id:"3",who:"makenzie",day:"wednesday",time:"9:40 AM",dur:20,mom:"required",subjectKey:"spelling"}]);
  gm.help.makenzie={spelling:true};
  ok(c.auditSchedule(T2,{}).some(x=>/two of Grandma's cards at once/.test(x)),"two of Grandma's own overlapping still flags");
  const T3=[{id:"1",who:"andrew",day:"wednesday",time:"1:30 PM",dur:25,mom:"required",subjectKey:"phonics"},{id:"2",who:"makenzie",day:"wednesday",time:"1:30 PM",dur:30,mom:"required",subjectKey:"apologia"}];
  ok(c.auditSchedule(T3,{}).some(x=>/two Mom-Required at once/.test(x)),"outside her window it's Mom's again → still flags");
}
// 10. wiring
ok(src.includes('helperFor:(typeof helperPlanWin==="function")?function(it){ const mm=meta[it.id]; return mm?helperPlanWin(dayName,mm.kid,mm.key):null; }:null'),"generator passes helperFor");
console.log(pass+" passed, "+fail+" failed");
process.exit(fail?1:0);
