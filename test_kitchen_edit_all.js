/* 🍳 KT_EDITALL + KT_PULLDISMISS + HHDELETE + KT_ASKLABEL (her asks 2026-10-25):
 *  · every Kitchen row (Today, sections, same-job-twice) has ✎ Edit and 🚫 Retire (asks first; the existing verdict write)
 *  · Pull in from other rooms: ✕ Dismiss per row, "Dismiss the rest", a "Dismissed · N" fold with ↩ Suggest again
 *  · Household ▸ Review: 🗑 Delete for good (one targeted null, after a confirm; a rotating row must be retired first)
 *  · the kitchen-question chip row says what it is.   run: node test_kitchen_edit_all.js */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,300)+")":"")); } };
const fnIn=name=>{ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); let d=0; for(let k=src.indexOf("{",i);k<src.length;k++){ if(src[k]==="{") d++; else if(src[k]==="}"&&--d===0) return src.slice(i,k+1); } throw new Error("unterminated "+name); };
function mk(o){ o=o||{}; const writes=[], toasts=[], confirms=[];
  const jobs={
    k_close:{label:"Kitchen close-down (counters + stove)",who:"mom",room:"kitchen",status:"active",src:{kind:"momChore",id:"k_close"}},
    l_fridge:{label:"Wipe the fridge handles",who:"lincoln",room:"entry",status:"active",src:{kind:"new"}},
    l_dish:{label:"Unload the dishwasher",who:"ellis",room:"any",status:"active",src:{kind:"routine"}},
    lu_pick:{label:"Pickup kitchen",who:"lucy",room:"kitchen",status:"active",rot:"downstairs",src:{kind:"routine"}},
    old:{label:"Old kitchen job",who:"mom",room:"kitchen",status:"retired",src:{kind:"momChore"}}};
  const ctx={console,Object,Array,String,JSON,writes,toasts,confirms,
    householdData:{jobs:jobs,meta:{takeover:o.takeoverOff?0:1}}, householdOnValue:()=>{}, hhRender:()=>{}, hhEditId:null,
    momHere:()=>o.mom!==false, _hhWrite:()=>true, mwToast:m=>toasts.push(m), confirm:m=>{ confirms.push(m); return o.say!==false; },
    db:{ref:p=>({set:v=>writes.push(["set",p,v]),update:v=>writes.push(["update",p||"",JSON.parse(JSON.stringify(v))])})},
    hhWhoName:w=>({mom:"Mom",lincoln:"Lincoln",ellis:"Ellis",lucy:"Lucy"})[w]||w, hhRoomOf:j=>j.room||"any", hhTakeoverOn:()=>!o.takeoverOff,
    hhEditBtn:id=>"<edit "+id+">", _hhBtn:(on,t)=>"<b onclick=\""+on+"\">"+t+"</b>",
    hhSet:(id,f,v)=>{ jobs[id][f]=v; if(f==="verdict"){ jobs[id].status=(v==="retire")?"retired":"active"; writes.push(["set","household/jobs/"+id+"/verdict",v]); } }};
  vm.createContext(ctx);
  vm.runInContext("let ktPullDisOpen=false;\nfunction hhJobs(){ return householdData.jobs; }\n"+["ktRetire","ktActsHTML","ktPullDismiss","ktPullDismissRest","ktPullUndismiss","ktPullDismissed","ktPullCandidates","hhDeleteForGood"].map(fnIn).join("\n"),ctx);
  ctx.J=jobs; return ctx; }
console.log("── ✎ + 🚫 on a kitchen row ──");
{ const c=mk(); const h=c.ktActsHTML("k_close");
  ok("the row's buttons: ✎ Edit and 🚫 Retire", /<edit k_close>/.test(h)&&/ktRetire\('k_close'\)">🚫 Retire/.test(h));
  ok("not in Mom mode → no buttons", mk({mom:false}).ktActsHTML("k_close")==="");
  c.ktRetire("k_close");
  ok("Retire asks first, naming the row and owner, and says where it goes", /Retire "Kitchen close-down \(counters \+ stove\)" \(Mom\)\?/.test(c.confirms[0])&&/Household ▸ 📋 Review/.test(c.confirms[0]));
  ok("…then the existing verdict write retires it", c.J.k_close.status==="retired"&&c.writes.some(w=>w[1]==="household/jobs/k_close/verdict"&&w[2]==="retire"));
  const n=mk({say:false}); n.ktRetire("k_close"); ok("saying no changes nothing", n.J.k_close.status==="active"&&n.writes.length===0); }
console.log("── Pull in: ✕ Dismiss ──");
{ const c=mk(); c.ktPullCandidates=c.ktPullCandidates;   // the real filter needs the kitchen-word regex: both candidates say kitchen-ish words
  const before=c.ktPullCandidates();
  ok("before: the fridge-handles row and the dishwasher row are suggested", before.indexOf("l_fridge")>=0&&before.indexOf("l_dish")>=0, before);
  c.ktPullDismiss("l_fridge");
  ok("✕ Dismiss writes ONE leaf: household/jobs/l_fridge/ktNoPull = true", c.writes.length===1&&c.writes[0][0]==="update"&&JSON.stringify(c.writes[0][2])==='{"household/jobs/l_fridge/ktNoPull":true}', c.writes);
  ok("…and it never comes back into Pull in; it stays in its own room", c.ktPullCandidates().indexOf("l_fridge")<0&&c.J.l_fridge.room==="entry");
  ok("it shows in the Dismissed fold", JSON.stringify(c.ktPullDismissed())==='["l_fridge"]');
  c.ktPullDismissRest();
  ok("Dismiss the rest asks first, then dismisses every remaining one in one update", /Dismiss the 1 left in Pull in\?/.test(c.confirms[0])&&c.ktPullCandidates().length===0&&c.writes[1][2]["household/jobs/l_dish/ktNoPull"]===true);
  c.ktPullUndismiss("l_fridge");
  ok("↩ Suggest again removes the leaf and it's back in Pull in", c.writes.some(w=>w[0]==="set"&&w[1]==="household/jobs/l_fridge/ktNoPull"&&w[2]===null)&&c.ktPullCandidates().indexOf("l_fridge")>=0); }
console.log("── Review: 🗑 Delete for good ──");
{ const c=mk(); c.hhDeleteForGood("old");
  ok("asks first, names the row, says it can't come back", /Delete "Old kitchen job" \(Mom\) for good\?/.test(c.confirms[0])&&/can't be brought back/.test(c.confirms[0]));
  ok("one targeted null at household/jobs/old, and it's gone", c.writes.length===1&&JSON.stringify(c.writes[0][2])==='{"household/jobs/old":null}'&&!c.J.old);
  const a=mk(); a.hhDeleteForGood("k_close"); ok("an active row can be deleted for good too", !a.J.k_close&&a.writes[0][2]["household/jobs/k_close"]===null);
  const r=mk(); r.hhDeleteForGood("lu_pick"); ok("a rotating row that's still active is refused: retire it first", !!r.J.lu_pick&&r.writes.length===0&&/Retire it first/.test(r.toasts[0]));
  const t=mk({takeoverOff:true}); t.hhDeleteForGood("k_close"); ok("takeover off: the confirm warns it is still on your Mom chores", /still on your Mom chores/.test(t.confirms[0]));
  const n=mk({say:false}); n.hhDeleteForGood("old"); ok("saying no deletes nothing", !!n.J.old&&n.writes.length===0);
  ok("not in Mom mode → nothing", (()=>{ const m=mk({mom:false}); m.hhDeleteForGood("old"); return !!m.J.old&&m.writes.length===0; })()); }
console.log("── wiring ──");
const KT=src.slice(src.indexOf("// KITCHEN_TAB_START"),src.indexOf("// KITCHEN_TAB_END"));
ok("🔴 Today rows get ✎ + 🚫 and the editor opens under the row", /'👤','','#475569'\)\+ktActsHTML\(r\.id\)/.test(KT)&&/hhEditHTML\(r\.id\)\?'<div style="padding:0 12px 8px">'\+hhEditHTML\(r\.id\)/.test(KT));
ok("section rows get 🚫 Retire beside ✎ Edit", /hhEditBtn\(id\):''\)\+_hhBtn\("ktRetire\('"\+id\+"'\)",'🚫 Retire'/.test(KT));
ok("same-job-twice rows get ✎ + 🚫 on both", /first:<\/span>'\+ktActsHTML\(o\[0\]\)/.test(KT)&&/second:<\/span>'\+ktActsHTML\(o\[1\]\)/.test(KT));
ok("Pull in rows get ✕ Dismiss, the list ends in ✕ Dismiss the rest, and a Dismissed fold follows", /ktPullDismiss\('"\+id\+"'\)",'✕ Dismiss'/.test(KT)&&/ktPullDismissRest\(\)",'✕ Dismiss the rest'/.test(KT)&&/Dismissed · '\+ds\.length/.test(KT)&&/↩ Suggest again/.test(KT));
ok("Review rows get 🗑 Delete for good (Mom only)", /hhDeleteForGood\('"\+id\+"'\)",'🗑 Delete for good'/.test(fnIn("hhRowHTML")));
ok("the kitchen-question chips say what they are", /🍳 Ask about the every-few-weeks kitchen jobs on:/.test(src)&&/when you tick your 🌙 Kitchen close-down/.test(src));
ok("no 🔀 anywhere in index.html", src.indexOf("🔀")<0);
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
