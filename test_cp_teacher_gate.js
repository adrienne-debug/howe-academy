// CPTEACHERGATE (2026-11-09): a teacher record (teachers/<uid> with a class) signs the teacher in when there is no logins row and
// no admin flag — + Teacher writes no logins row, and the logins rule could not take one (it wants a family and a kid).
const fs=require("fs"), assert=require("assert"), vm=require("vm");
const src=fs.readFileSync(__dirname+"/index.html","utf8");
let n=0; const ok=(c,m)=>{ assert(c,m); n++; };
const m=src.match(/\nfunction envSiteGate\(user,cont\)\{[\s\S]*?\n\}\n/); ok(m,"envSiteGate found");
const fn=m[0];
ok(/teachers\/"\+_envs\.uid/.test(fn),"the gate reads teachers/<uid>");
ok(fn.indexOf('logins/"+_envs.uid')<fn.indexOf('admins/"+_envs.uid')&&fn.indexOf('admins/"+_envs.uid')<fn.indexOf('teachers/"+_envs.uid'),"order: logins, then admins, then teachers");
ok(/\.then\(L=>L\|\|sdb\.ref\("teachers\/"/.test(fn),"the teachers read happens only when nothing else matched");
// run it against a fake firebase: {teachers row only} → teacher of its first class; {nothing} → notset; {logins row} → that row wins
function run(remote){
  const out={cards:[],applied:null,entered:0,reads:[]};
  const snap=v=>({val:()=>v});
  const ctx={ console, _envs:{}, envSiteOn:()=>true, envsDemo:()=>false,
    firebase:{database:()=>({ref:p=>({once:()=>{ out.reads.push(p); return Promise.resolve(snap(p in remote?remote[p]:null)); }})})},
    envsCard:(k,o)=>out.cards.push(k), envsApplyLogin:L=>{ out.applied=L; ctx._envs.role=L.role; }, envsLockState:()=>({locked:false}), envsEnter:()=>out.entered++ };
  vm.createContext(ctx); vm.runInContext(fn+"\nenvSiteGate({uid:'tb',email:'t@example.com'},()=>{});",ctx);
  return new Promise(r=>setTimeout(()=>r(out),20));
}
(async()=>{
  let o=await run({"teachers/tb":{name:"Brittany",classes:{"ms-science-2026":true}},"classes/ms-science-2026":{teacher:"tb"}});
  ok(o.applied&&o.applied.role==="teacher"&&o.applied.cid==="ms-science-2026"&&o.applied.name==="Brittany","teacher record alone → role teacher, cid = her class, name carried");
  ok(o.entered===1&&o.cards.length===0,"…and she enters (no card)");
  ok(o.reads.join(",")==="release/locked,logins/tb,admins/tb,teachers/tb","…after exactly logins, admins, teachers");
  o=await run({});
  ok(!o.applied&&o.entered===0&&o.cards.join()==="notset","nothing at all → the notset card, as before");
  o=await run({"teachers/tb":{name:"B"}});
  ok(!o.applied&&o.cards.join()==="notset","a teacher record with no class → notset");
  o=await run({"logins/tb":{role:"parent",familyId:"x",kid:"y",cid:"c"},"teachers/tb":{name:"B",classes:{z:true}}});
  ok(o.applied.role==="parent"&&!o.reads.includes("teachers/tb"),"a logins row still wins and teachers is never read");
  o=await run({"admins/tb":true,"teachers/tb":{name:"B",classes:{z:true}}});
  ok(o.applied.role==="admin"&&!o.reads.includes("teachers/tb"),"an admin still enters as admin, teachers never read");
  console.log("test_cp_teacher_gate: "+n+" ok");
})().catch(e=>{ console.error(e); process.exit(1); });
