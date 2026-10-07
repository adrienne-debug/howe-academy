// CONNDIARY — 📶 the connection diary records outages; it never changes how the app connects (2026-10-06, #14 LG).
const fs=require("fs"), path=require("path"); const dir=process.argv[2]||__dirname;
const html=fs.readFileSync(path.join(dir,"index.html"),"utf8");
let pass=0,fail=0; const ok=(n,c,x)=>{ if(c){pass++;console.log("  ✓ "+n);} else {fail++;console.log("  ✗ "+n+(x!==undefined?"  → "+JSON.stringify(x):""));} };
const m=html.match(/\/\/ CONNDIARY_START[\s\S]*?\/\/ CONNDIARY_END/); ok("block present",!!m);
ok("hooked as the first thing in the .info/connected handler",/db\.ref\("\.info\/connected"\)\.on\("value",s=>\{\n      const on=s\.val\(\)===true;\n      try\{ cdOnConn\(on\); \}catch\(eCD\)\{\}/.test(html));
ok("defined after dbg()",html.indexOf("CONNDIARY_START")>html.indexOf("function dbg(msg)"));
function mk(opts){
  const store=opts.store||{}, writes=[], logs=[]; let now=opts.t0||new Date(2026,9,7,10,0,0).getTime();
  const HA_LS={getItem:k=>k in store?store[k]:null,setItem:(k,v)=>{store[k]=String(v);}};
  const sess={getItem:k=>(opts.sess||{})[k]??null};
  const RealDate=Date; function FakeDate(...a){ return a.length?new RealDate(...a):new RealDate(now); } FakeDate.now=()=>now;
  const db={ref:p=>({set:v=>writes.push([p,v])})};
  const nav={userAgent:opts.ua||"Mozilla/5.0 (Web0S; Linux/SmartTV) AppleWebKit/537.36 Chrome/108",maxTouchPoints:0};
  const doc={hidden:!!opts.hidden};
  const f=new Function("HA_LS","sessionStorage","Date","db","navigator","document","localStorage","CODE_VERSION","dbg",m[0]+"\nreturn {cdOnConn,cdLoad,cdLabel};");
  const api=f(HA_LS,sess,FakeDate,db,nav,doc,{getItem:()=>null},opts.cv||"123",x=>logs.push(x));
  return {api,store,writes,logs,tick:ms=>{now+=ms;}};
}
console.log("a normal day");
{ const t=mk({}); t.api.cdOnConn(false); t.tick(2400); t.api.cdOnConn(true);
  let d=t.api.cdLoad(); ok("the first 'false' while connecting is not an outage",d.outages===0&&d.loads===1,d);
  ok("time to first connect recorded (2.4 s)",d.firstConnSec[0]===2.4,d.firstConnSec);
  ok("summary row saved under connDiary/<day>/<device>",t.writes.length===1&&/^connDiary\/2026-10-07\/d[a-z0-9]+$/.test(t.writes[0][0]),t.writes.map(w=>w[0]));
  ok("LG labelled + long-polling transport noted",t.writes[0][1].label==="LG StanbyME"&&t.writes[0][1].transport==="longpoll",t.writes[0][1]);
  t.tick(60000); t.api.cdOnConn(false); t.tick(3000); t.api.cdOnConn(true);
  d=t.api.cdLoad(); ok("a 3-second blip is ignored",d.outages===0,d);
  t.tick(60000); t.api.cdOnConn(false); t.tick(150000); t.api.cdOnConn(true);
  d=t.api.cdLoad(); ok("a 2.5-minute outage is counted",d.outages===1&&d.longestMs===150000&&d.last[0].min===2.5&&d.last[0].at==="10:02",d);
  ok("…and logged once to _debug",t.logs.length===1&&/LG StanbyME: back online after 2\.5 min — today 1 outage, 2\.5 min, longest 2\.5 min, 1 page loads \(0 deploy\)/.test(t.logs[0]),t.logs);
  ok("repeated 'true' adds nothing",(t.api.cdOnConn(true),t.api.cdLoad().outages===1));
}
console.log("an outage that spans a reload keeps counting");
{ const t=mk({}); t.api.cdOnConn(true); t.tick(60000); t.api.cdOnConn(false); const store=t.store;
  const t2=mk({store,t0:new Date(2026,9,7,10,6,0).getTime()});   // kid reloads 5 min later; still offline
  t2.api.cdOnConn(false); t2.tick(240000); t2.api.cdOnConn(true);
  const d=t2.api.cdLoad(); ok("one outage of 9 min across the reload",d.outages===1&&Math.round(d.longestMs/60000)===9,d);
  ok("2 page loads today",d.loads===2,d.loads);
}
console.log("deploy reloads are told apart");
{ const t=mk({sess:{ha_cv_reload:"777"},cv:"777"}); const d=t.api.cdLoad(); ok("a load after a code-version reload counts as a deploy load",d.deployLoads===1&&d.loads===1,d); }
console.log("a new day starts fresh");
{ const t=mk({}); t.api.cdOnConn(true); t.tick(60000); t.api.cdOnConn(false); t.tick(30000); t.api.cdOnConn(true);
  const t2=mk({store:t.store,t0:new Date(2026,9,8,9,0,0).getTime()}); const d=t2.api.cdLoad(); ok("yesterday's numbers don't carry over",d.day==="2026-10-08"&&d.outages===0&&d.loads===1,d); }
console.log("device labels");
{ const L=mk({}).api.cdLabel; ok("iPad (desktop-mode UA + touch)",L("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",5)==="iPad"); ok("iPhone",L("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0)",5)==="iPhone"); ok("Mac",L("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",0)==="Mac"); ok("Android tablet",L("Mozilla/5.0 (Linux; Android 14; SM-X200)",5)==="Android tablet"); }
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
