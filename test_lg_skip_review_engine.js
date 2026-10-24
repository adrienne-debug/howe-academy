/*
 * 📺 LGSKIP_RE (her yes 2026-10-24: "I'm scared that this is just going to make the LG completely useless"). The LG StanbyME —
 * the connection diary's own label (cdLabel: webOS / SmartTV / NetCast user agent) — never does the morning review re-deal and
 * never stamps leveled_on, so the next device opened does it (the transaction is first-device-wins). Mom's ⚖️ Even out button
 * still works on the LG.   run: node test_lg_skip_review_engine.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,300)+")":"")); } };
const slice=(s,e)=>{ const a=src.indexOf(s), b=src.indexOf(e); if(a<0||b<0) throw new Error("missing "+s); return src.slice(a,b); };
const fn=name=>{ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); let d=0; for(let k=src.indexOf("{",i);k<src.length;k++){ if(src[k]==="{") d++; else if(src[k]==="}"&&--d===0) return src.slice(i,k+1); } throw new Error("unbalanced "+name); };
const RE=slice("// REVIEWENGINE_START","// REVIEWENGINE_END"), EVO=slice("// EVENOUT2_START","// EVENOUT2_END");
const TIER_LINE=src.match(/const MAST_TIER_INT=\{[^\n]*\};/)[0];
const CODE=TIER_LINE+"\n"+fn("cdLabel")+"\n"+EVO+RE+fn("mastStampNextDue");

const UA={
  lg:"Mozilla/5.0 (Web0S; Linux/SmartTV) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36 WebAppManager NetCast",
  webos:"Mozilla/5.0 (Linux; webOS/23) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36",
  mac:"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  ipad:"Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  fire:"Mozilla/5.0 (Linux; Android 11; KFTRWI) AppleWebKit/537.36 (KHTML, like Gecko) Silk/120.0 Chrome/120.0.0.0 Safari/537.36"
};
// Sandbox with a fake Firebase: `server` is the shared database, so two sandboxes on one server are two devices.
function mk(o){ o=o||{}; const server=o.server||{writes:[],data:{}}; const toasts=[];
  const ref=p=>({
    update:v=>{ server.writes.push(["update",p,v]); return Promise.resolve(); },
    set:v=>{ server.writes.push(["set",p,v]); server.data[p]=v; return Promise.resolve(); },
    transaction:f=>{ const cur=server.data[p]; const nv=f(cur===undefined?null:cur); if(nv===undefined) return Promise.resolve({committed:false}); server.data[p]=nv; server.writes.push(["transaction",p,nv]); return Promise.resolve({committed:true}); }});
  const ctx={console:{log:()=>{},warn:()=>{}},Object,Array,String,Number,Math,JSON,Date,Map,Set,Infinity,Promise,
    navigator:{userAgent:o.ua,maxTouchPoints:o.touch||0},
    masteryData:o.md(), masteryKid:"ellis", ROSTER:["ellis"],
    mastIsParked:i=>!!(i&&i.status==="parked"), mastIsNeverDrill:()=>false,
    mastGetPrintNum:()=>100, mastSchoolDayNum:(kid,ds)=>ds==="2026-10-26"?100:99,
    calToday:()=>"2026-10-26", db:{ref}, _dryRun:()=>false, _haMastReady:true,
    HA_LS:{setItem:()=>{},getItem:()=>null}, gwShowToast:t=>toasts.push(t), confirm:()=>true, _mastRe:()=>{}, cap:s=>s[0].toUpperCase()+s.slice(1), toasts, server};
  vm.createContext(ctx); vm.runInContext(CODE,ctx); ctx.get=e=>vm.runInContext(e,ctx); return ctx; }
// Ellis: 10 weekly cards all due today, tested 5+ school days ago → the even share (ceil(1.25×10/5)=3/day) moves most of them.
const md=()=>({ ellis:Array.from({length:10},(_,i)=>({id:"w"+i,subject:"Spelling",tier:"weekly",status:"active",next_due:100,prompt:"w"+i})),
  ellis_settings:{}, history:{ellis:{"2026-10-12":{printNum:90,items:Array.from({length:10},(_,i)=>({id:"w"+i,result:"c"}))}}}, studyLog:{} });
const loadAll=c=>{ c.get("reLoaded('mastery')"); c.get("reLoaded('calendar')"); c.get("reLoaded('pace')"); };
const flush=()=>new Promise(r=>setImmediate(r));

(async()=>{
console.log("1. The marker and where it sits");
{ const body=fn("reMorningAll");
  ok("LGSKIP_RE comment with her words and the date", /\/\/ LGSKIP_RE — her yes 2026-10-24 \("I'm scared that this is just going to make the LG completely useless"\)/.test(body));
  ok("the skip is the first check in reMorningAll (before any transaction can start)", body.indexOf("LG StanbyME")<body.indexOf("_reLoaded.mastery")&&body.indexOf("LG StanbyME")<body.indexOf("reMorningKid"));
  ok("it reuses the connection diary's device label (no new user-agent sniff)", /cdLabel\(navigator\.userAgent,navigator\.maxTouchPoints\)==="LG StanbyME"/.test(body));
  ok("reMorningKid is only reached through reMorningAll", (src.match(/reMorningKid\(/g)||[]).length===2);
  ok("Even out (mastRebalanceKid) does not go through reMorningAll", !/reMorningAll/.test(fn("mastRebalanceKid"))&&!/reMorningAll/.test(fn("mastRebalanceNow"))&&!/LG StanbyME/.test(fn("reApply")));
}
console.log("2. cdLabel names the LG narrowly");
{ const c=mk({ua:UA.mac,md});
  ok("the LG's user agent (Web0S / SmartTV / NetCast) → LG StanbyME", c.get("cdLabel")(UA.lg,0)==="LG StanbyME");
  ok("a webOS user agent → LG StanbyME", c.get("cdLabel")(UA.webos,0)==="LG StanbyME");
  ok("Mac / iPad / Fire tablet are not the LG", c.get("cdLabel")(UA.mac,0)==="Mac"&&c.get("cdLabel")(UA.ipad,5)==="iPad"&&c.get("cdLabel")(UA.fire,5)==="Android tablet");
}
console.log("3. On the LG: no transaction, no write");
{ const c=mk({ua:UA.lg,md}); loadAll(c); await flush();
  ok("no Firebase write of any kind", c.server.writes.length===0, c.server.writes);
  ok("leveled_on is not stamped (locally or on the server)", !c.masteryData.ellis_settings.leveled_on&&c.server.data["mastery/ellis_settings/leveled_on"]===undefined);
  ok("no card's next_due changed", c.masteryData.ellis.every(it=>it.next_due===100));
  c.get("reMorningAll()"); await flush();
  ok("a second call (dayRollCheck past midnight) still does nothing", c.server.writes.length===0);
}
console.log("4. A normal device levels as before");
for(const [name,ua,touch] of [["Mac",UA.mac,0],["iPad",UA.ipad,5],["Fire tablet",UA.fire,5]]){
  const c=mk({ua,touch,md}); loadAll(c); await flush();
  const tx=c.server.writes.filter(w=>w[0]==="transaction");
  ok(name+": one leveled_on transaction for today", tx.length===1&&tx[0][1]==="mastery/ellis_settings/leveled_on"&&tx[0][2]==="2026-10-26", c.server.writes);
  ok(name+": cards move (one multi-path update on mastery/ellis)", c.server.writes.some(w=>w[0]==="update"&&w[1]==="mastery/ellis"&&Object.keys(w[2]).length>0));
}
console.log("5. LG first, then another device: the other device still levels");
{ const server={writes:[],data:{}};
  const lg=mk({ua:UA.lg,md,server}); loadAll(lg); await flush();
  ok("the LG opened first and wrote nothing", server.writes.length===0);
  const ipad=mk({ua:UA.ipad,touch:5,md,server}); loadAll(ipad); await flush();
  ok("the iPad wins the transaction", server.data["mastery/ellis_settings/leveled_on"]==="2026-10-26");
  ok("the iPad moves the cards", server.writes.some(w=>w[0]==="update"&&w[1]==="mastery/ellis"));
  const mac=mk({ua:UA.mac,md,server}); loadAll(mac); await flush();
  ok("a third device doesn't level again (first device wins)", server.writes.filter(w=>w[0]==="update"&&w[1]==="mastery/ellis").length===1);
}
console.log("6. Even out still works on the LG (Mom's explicit button)");
{ const c=mk({ua:UA.lg,md}); c.get("mastRebalanceNow()");
  ok("cards move through reApply", c.server.writes.some(w=>w[0]==="update"&&w[1]==="mastery/ellis"&&Object.keys(w[2]).length>0), c.server.writes);
  ok("evened_at is stamped", c.server.writes.some(w=>w[0]==="set"&&w[1]==="mastery/ellis_settings/evened_at"));
  ok("no leveled_on transaction from the button", !c.server.writes.some(w=>w[0]==="transaction"));
  ok("Mom sees the 'Evened out' toast", c.toasts.some(t=>/^Evened out \d+ review card/.test(t)), c.toasts);
}
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
})();
