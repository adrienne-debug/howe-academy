// CDBOOTS — ⏱ boot timings per page load, recorded in the connection diary (her yes 2026-10-22, Stage 0b of the LG lite
// build). RECORD ONLY: one targeted write per load (connDiary/<day>/<device>/boots, last 10), dry-run honoured, the
// renderAll counter can never stop a repaint, nothing in the scheduler is touched. 2026-10-24 (her yes "LG measuring"): HA_BUILD
// is automatic (the deploy's Last-Modified time), each entry carries CODE_VERSION (cv) and the review engine's morning run on
// that device (re), a run after the 30-s close re-sends the same list.   run: node test_conn_diary_boots.js
const fs=require("fs"), path=require("path"); const dir=process.argv[2]||__dirname;
const html=fs.readFileSync(path.join(dir,"index.html"),"utf8");
let pass=0,fail=0; const ok=(n,c,x)=>{ if(c){pass++;console.log("  ✓ "+n);} else {fail++;console.log("  ✗ "+n+(x!==undefined?"  → "+JSON.stringify(x):""));} };
const m=html.match(/\/\/ CONNDIARY_START[\s\S]*?\/\/ CONNDIARY_END/);
const bm=html.match(/\/\/ CDBOOTS_START[\s\S]*?\/\/ CDBOOTS_END/);
console.log("where it lives");
ok("CDBOOTS block present, inside CONNDIARY",!!m&&!!bm&&m[0].indexOf("// CDBOOTS_START")>0);
ok("the block makes exactly one database write (the boots list)",bm&&(bm[0].match(/db\.ref\(/g)||[]).length===1&&/db\.ref\("connDiary\/"\+d\.day\+"\/"\+cdDevId\(\)\+"\/boots"\)\.set\(d\.boots\)/.test(bm[0]));
ok("…and honours dry-run",/!dry\) db\.ref\("connDiary/.test(bm[0])&&/_dryRun\(\)/.test(bm[0]));
ok("nothing in the block touches the scheduler",!/schedCascade|regen_lock|haClaimSchedLock|cascadeIntraWeek|runCascade|mlEveningSweep/.test(bm[0]));
ok("no device copy of the archive is looked for (LS_ARCHIVE)",!/ha_archive/.test(bm[0]));
const L=html.split("\n"), ms=L.lastIndexOf("<script>");
ok("the stopwatch is the main script's first line",/^var _cdT=\{js0:/.test(L[ms+1]),L[ms+1]);
ok("…and the setup-done stamp sits just before boot()",/^try\{ _cdT\.js1=performance\.now\(\); \}catch\(e\)\{\}/.test(L[L.indexOf("boot();")-1]));
ok("CODE_VERSION itself is unchanged",html.indexOf('const CODE_VERSION = (function(){var s=document.documentElement.outerHTML;var h=0;for(var i=0;i<s.length;i++){h=((h<<5)-h)+s.charCodeAt(i);h|=0;}return Math.abs(h);})();')>0);
console.log("HA_BUILD — automatic since 2026-10-24 (the deploy's time, from the server's Last-Modified)");
const hb=html.match(/\nconst HA_BUILD=\(function\(\)\{[\s\S]*?\n\}catch\(e\)\{ return "\?"; \} \}\)\(\);\n/);
ok("HA_BUILD is computed, right before CODE_VERSION",!!hb&&html.indexOf(hb[0])<html.indexOf("const CODE_VERSION")&&html.indexOf("const CODE_VERSION")-(html.indexOf(hb[0])+hb[0].length)<80);
ok("no hand-typed commit left (the old 851f7f7f stamp)",!/const HA_BUILD="/.test(html)&&!/UPDATE IT BY HAND/.test(html));
ok("…and it reads nothing but document.lastModified (no network, no storage)",!!hb&&!/fetch|XMLHttpRequest|localStorage|HA_LS|db\./.test(hb[0])&&/document\.lastModified/.test(hb[0]));
const stamp=(lm,nowMs)=>{ const RealDate=Date; function FD(...a){ return a.length?new RealDate(...a):new RealDate(nowMs); } FD.now=()=>nowMs;
  return new Function("document","Date",hb[0].replace("\nconst HA_BUILD=","return ").trim())({lastModified:lm},FD); };
{ const lm="10/24/2026 00:45:54", local=new Date(2026,9,24,0,45,54);
  ok("a deploy's date → UTC 'YYYY-MM-DDTHH:MM:SSZ'",stamp(lm,local.getTime()+3600000)===local.toISOString().slice(0,19)+"Z",stamp(lm,local.getTime()+3600000)); }
ok("the server sent no date (the browser says 'now') → ?",stamp("10/24/2026 09:00:01",new Date(2026,9,24,9,0,2).getTime())==="?");
ok("nothing readable → ?",stamp("",Date.now())==="?"&&stamp(undefined,Date.now())==="?"&&stamp("Saturday",Date.now())==="?");
{ let threw=false, v; try{ v=new Function("document","Date",hb[0].replace("\nconst HA_BUILD=","return ").trim())(null,Date); }catch(e){ threw=true; } ok("no document at all → ?, never a throw",!threw&&v==="?",v); }
ok("arrival stamps: this week's cards, Mastery, the archive (once each)",(html.match(/cdMark\("weekMs"\)/g)||[]).length===1&&(html.match(/cdMark\("mastMs"\)/g)||[]).length===1&&(html.match(/cdMark\("archMs"\)/g)||[]).length===1);
const tags=["no-family-retry","sw-update","signin","signout","family","family-save"];
ok("each of the app's own reloads leaves its reason",tags.every(t=>html.split('"ha_reload_why","'+t+'"').length+html.split("'ha_reload_why','"+t+"'").length-2===1),tags.filter(t=>html.indexOf(t+'"')<0&&html.indexOf(t+"'")<0));

function mk(opts){
  opts=opts||{};
  const store=opts.store||{}, writes=[]; let now=opts.t0||new Date(2026,9,22,9,0,0).getTime(), pnow=opts.p0||5000;
  const HA_LS={getItem:k=>k in store?store[k]:null,setItem:(k,v)=>{store[k]=String(v);}};
  const sv=opts.sess||{};
  const sess={getItem:k=>(k in sv)?sv[k]:null,setItem:(k,v)=>{sv[k]=String(v);},removeItem:k=>{delete sv[k];}};
  const RealDate=Date; function FakeDate(...a){ return a.length?new RealDate(...a):new RealDate(now); } FakeDate.now=()=>now;
  const db=opts.noDb?null:{ref:p=>({set:v=>writes.push([p,JSON.parse(JSON.stringify(v))])})};
  const nav={userAgent:"Mozilla/5.0 (Linux; NetCast; U) AppleWebKit/537.36 Chrome/108.0.0.0 Safari/537.36 SmartTV/10.0",maxTouchPoints:0};
  const doc={hidden:false,wasDiscarded:!!opts.discarded};
  const navEntry=opts.nav===null?null:Object.assign({type:"navigate",transferSize:1669000,requestStart:100,responseEnd:2100},opts.nav||{});
  const perf={now:()=>pnow,getEntriesByType:t=>(t==="navigation"&&navEntry)?[navEntry]:[]};
  const diag=opts.diag===undefined?(()=>({lsKB:812,write:"ok"})):opts.diag;
  const T=opts.T===undefined?{js0:4000,cv0:4100,cv1:4400,js1:5200}:opts.T;
  const f=new Function("HA_LS","sessionStorage","Date","db","navigator","document","localStorage","CODE_VERSION","dbg","performance","_haAuthDiagNow","HA_BUILD","_cdT","_dryRun","window",
    m[0]+"\nreturn {cdOnConn,cdLoad,cdMark,cdRenderStart,cdRenderEnd,cdBootsFinish,cdBootEntry,cdReviewRun,cdNow,why:()=>_cdWhy,B:()=>_cdB};");
  const api=f(HA_LS,sess,FakeDate,db,nav,doc,{getItem:()=>null},opts.cv||"123",()=>{},perf,diag,"2026-10-24T04:45:54Z",T,opts.dry?(()=>true):undefined,undefined);
  return {api,store,writes,sess:sv,tickP:ms=>{pnow+=ms;},setP:v=>{pnow=v;},tick:ms=>{now+=ms;}};
}
console.log("why the page loaded");
ok("icon launch (first load this session)",mk({}).api.why()==="launch");
ok("icon launch that bounced through ?_h= (2nd full download)",mk({sess:{ha_h_tried:"1"}}).api.why()==="launch+bounce");
ok("a reload",mk({nav:{type:"reload"},sess:{ha_cd_seen:"1"}}).api.why()==="reload");
ok("back/forward",mk({nav:{type:"back_forward"}}).api.why()==="back");
ok("a deploy reload",mk({sess:{ha_cv_reload:"777",ha_cd_seen:"1"},cv:"777",nav:{type:"navigate"}}).api.why()==="deploy");
ok("the TV threw the page away and re-loaded it",mk({discarded:true,nav:{type:"reload"}}).api.why()==="tv-discarded");
{ const t=mk({sess:{ha_reload_why:"signin",ha_cd_seen:"1"},nav:{type:"reload"}}); ok("the app's own reload says which one (signin) …",t.api.why()==="signin"); ok("… and the note is used once",!("ha_reload_why" in t.sess)); }
ok("a later page in the same session",mk({sess:{ha_cd_seen:"1"}}).api.why()==="navigate");
ok("no navigation timing at all → still a reason, never a crash",mk({nav:null}).api.why()==="launch");

console.log("what one load records");
{ const t=mk({});
  t.setP(5600); const r0=t.api.cdRenderStart(); t.setP(5900); t.api.cdRenderEnd(r0);         // the boot paint, 300 ms
  t.setP(7200); t.api.cdMark("connMs"); t.setP(7800); t.api.cdMark("weekMs"); t.setP(9100); t.api.cdMark("mastMs");
  t.setP(9300); t.api.cdMark("mastMs");                                                        // a second arrival changes nothing
  t.setP(12000); t.api.cdMark("archMs");
  for(let i=0;i<4;i++){ t.setP(13000+i*1000); const a=t.api.cdRenderStart(); t.setP(13000+i*1000+150); t.api.cdRenderEnd(a); }
  t.setP(31000); const late=t.api.cdRenderStart(); t.setP(31500); t.api.cdRenderEnd(late);    // after 30 s → not counted
  t.api.B().busyMs=2400.6; t.api.B().longestMs=880.2;
  t.setP(33000); t.api.cdBootsFinish();
  const d=t.api.cdLoad(), e=d.boots&&d.boots[0];
  ok("one entry kept in today's diary",Array.isArray(d.boots)&&d.boots.length===1,d.boots);
  ok("load time, reason, build (deploy time + CODE_VERSION)",e.at==="9:00"&&e.why==="launch"&&e.b==="2026-10-24T04:45:54Z"&&e.cv==="123",e);
  ok("no review-engine run on this load → no re field",!("re" in e),e);
  ok("download: 1,630 KB in 2,000 ms",e.kb===1630&&e.dlMs===2000,e);
  ok("parse until the script ran 1,900 ms · setup 1,200 ms · version hash 300 ms",e.jsMs===1900&&e.evalMs===1200&&e.cvMs===300,e);
  ok("first paint, first connect, cards / Mastery / archive arrival (first time only)",e.paintMs===5900&&e.connMs===7200&&e.weekMs===7800&&e.mastMs===9100&&e.archMs===12000,e);
  ok("repaints in the first 30 s: 5, 900 ms, slowest 300 ms",e.renders===5&&e.renderMs===900&&e.maxRenderMs===300,e);
  ok("busy (long tasks) 2,401 ms, longest 880 ms",e.busyMs===2401&&e.longestMs===880,e);
  ok("storage from _haAuthDiagNow: 812 KB, test write ok",e.lsKB===812&&e.lsWrite==="ok",e);
  ok("ONE write, to connDiary/<day>/<device>/boots",t.writes.length===1&&/^connDiary\/2026-10-22\/d[a-z0-9]+\/boots$/.test(t.writes[0][0])&&t.writes[0][1].length===1,t.writes.map(w=>w[0]));
  ok("every value is a plain number or string (Firebase refuses undefined)",Object.values(e).every(v=>typeof v==="number"||typeof v==="string"),e);
  t.api.cdBootsFinish(); ok("finishing twice writes nothing more",t.writes.length===1);
  const a=t.api.cdRenderStart(); t.api.cdRenderEnd(a); ok("after the entry is closed the counter stops",t.api.B().renders===5);
  t.api.cdOnConn(true);
  const row=t.writes[t.writes.length-1];
  ok("a reconnect's whole-row save keeps the boots list",/^connDiary\/2026-10-22\/d[a-z0-9]+$/.test(row[0])&&Array.isArray(row[1].boots)&&row[1].boots.length===1,row);
}
{ const t=mk({}); t.api.cdOnConn(true); ok("before any entry the row has no boots field (no undefined sent)",!("boots" in t.writes[0][1])&&t.writes.length===1,t.writes[0][1]); }
console.log("the Mac on 10/21: storage full");
{ const t=mk({diag:()=>({lsKB:5703,write:"QuotaExceededError:Setting the value of 'ha_authdiag_probe' exceeded the quota."})}); t.api.cdBootsFinish();
  const e=t.api.cdLoad().boots[0]; ok("full storage and the failing write are recorded",e.lsKB===5703&&/^QuotaExceededError/.test(e.lsWrite)&&e.lsWrite.length<=40,e); }
{ const t=mk({diag:null}); t.api.cdBootsFinish(); const e=t.api.cdLoad().boots[0]; ok("no AUTHDIAG → -1 / ?, no crash",e.lsKB===-1&&e.lsWrite==="?",e); }
{ const t=mk({diag:()=>{ throw new Error("boom"); }}); t.api.cdBootsFinish(); ok("AUTHDIAG throwing → entry still written",t.writes.length===1&&t.writes[0][1][0].lsKB===-1); }
console.log("missing pieces never break it");
{ const t=mk({T:null,nav:null}); t.api.cdBootsFinish(); const e=t.api.cdLoad().boots[0];
  ok("no stopwatch, no navigation timing → -1s",e.kb===-1&&e.dlMs===-1&&e.jsMs===-1&&e.evalMs===-1&&e.cvMs===-1&&e.paintMs===-1&&e.mastMs===-1,e); }
{ const t=mk({noDb:true}); let threw=false; try{ t.api.cdBootsFinish(); }catch(e){ threw=true; }
  ok("not signed in yet (no db) → kept on the device only",!threw&&t.api.cdLoad().boots.length===1&&t.writes.length===0); }
{ const t=mk({dry:true}); t.api.cdBootsFinish(); ok("?dryrun=1 → no write, kept on the device",t.writes.length===0&&t.api.cdLoad().boots.length===1); }
console.log("the last 10 loads");
{ let store={}, t; for(let i=0;i<12;i++){ t=mk({store}); t.tick(i*60000); t.api.cdBootsFinish(); }
  const b=t.api.cdLoad().boots; ok("12 loads → the last 10 kept and written",b.length===10&&t.writes[0][1].length===10,b.length); }
{ const t=mk({}); t.api.cdBootsFinish(); const t2=mk({store:t.store,t0:new Date(2026,9,23,8,0,0).getTime()}); t2.api.cdBootsFinish();
  ok("a new day starts a fresh list",t2.api.cdLoad().boots.length===1&&t2.writes[0][0].indexOf("connDiary/2026-10-23/")===0); }

console.log("🧠 the review engine's morning run (her worry 2026-10-24: the LG)");
{ const t=mk({}); t.setP(9000); const t0=t.api.cdNow(); t.setP(9420); t.api.cdReviewRun("ellis",t0,{changed:7,cards:93});
  t.setP(33000); t.api.cdBootsFinish(); const e=t.api.cdLoad().boots[0];
  ok("a run inside the 30 s: kid, when, how long, cards moved of review cards",Array.isArray(e.re)&&e.re.length===1&&e.re[0].k==="ellis"&&e.re[0].at===9420&&e.re[0].ms===420&&e.re[0].mv===7&&e.re[0].n===93,e.re);
  ok("…in the same one write",t.writes.length===1&&t.writes[0][1][0].re.length===1);
  ok("re items are plain numbers and strings",e.re.every(x=>Object.values(x).every(v=>typeof v==="number"||typeof v==="string")));
}
{ const t=mk({}); t.api.cdBootsFinish(); ok("closed with no run → one write, no re",t.writes.length===1&&!("re" in t.writes[0][1][0]));
  t.setP(36000); const t0=t.api.cdNow(); t.setP(36250); t.api.cdReviewRun("lincoln",t0,{changed:0,cards:41});
  const w=t.writes[t.writes.length-1], b=t.api.cdLoad().boots;
  ok("a run after the 30-s close (Mastery reaches the LG at 25–30 s) is added to this load's entry",b.length===1&&b[0].re&&b[0].re[0].k==="lincoln"&&b[0].re[0].ms===250&&b[0].re[0].mv===0,b);
  ok("…and the list goes again to the same path (connDiary/<day>/<device>/boots)",t.writes.length===2&&w[0]===t.writes[0][0]&&w[1][0].re.length===1,t.writes.map(x=>x[0]));
  t.setP(37000); t.api.cdReviewRun("lucy",t.api.cdNow(),{changed:2,cards:20});
  ok("a second kid's late run keeps the first",t.api.cdLoad().boots[0].re.map(x=>x.k).join(",")==="lincoln,lucy"&&t.writes.length===3);
}
{ let store={}; const t1=mk({store}); t1.api.cdBootsFinish(); const t=mk({store}); t.setP(9000); t.api.cdBootsFinish();
  t.setP(40000); t.api.cdReviewRun("ellis",39000,{changed:1,cards:5});
  const b=t.api.cdLoad().boots; ok("an earlier load's entry is left alone — only this load's gets the run",b.length===2&&!b[0].re&&b[1].re&&b[1].re.length===1,b); }
{ const t=mk({}); t.api.cdBootsFinish(); const t2=mk({store:t.store,t0:new Date(2026,9,23,8,0,0).getTime()});
  t.tick(24*3600000); t.api.cdReviewRun("ellis",1,{changed:1,cards:2});
  ok("open past midnight: the new day's row has no entry for this load → nothing written",t.writes.length===1); }
{ const t=mk({dry:true}); t.api.cdBootsFinish(); t.api.cdReviewRun("ellis",1,{changed:1,cards:2});
  ok("?dryrun=1 → a late run is still never sent",t.writes.length===0&&t.api.cdLoad().boots[0].re.length===1); }
{ const t=mk({}); for(let i=0;i<25;i++) t.api.cdReviewRun("k"+i,1,{changed:0,cards:0}); ok("at most 20 runs kept (a device left open for days)",t.api.B().re.length===20); }
{ const t=mk({}); let threw=false; try{ t.api.cdReviewRun("ellis",-1,null); }catch(e){ threw=true; }
  ok("no start time / no result → -1s, never a throw",!threw&&t.api.B().re[0].ms===-1&&t.api.B().re[0].mv===-1&&t.api.B().re[0].n===-1); }
{ const re=html.match(/\/\/ REVIEWENGINE_START[\s\S]*?\/\/ REVIEWENGINE_END/)[0];
  ok("REVIEWENGINE reports only from the morning run (reMorningKid), once",(re.match(/cdReviewRun\(/g)||[]).length===1&&(re.match(/cdNow\(/g)||[]).length===1&&/function reMorningKid[\s\S]*cdReviewRun\(kid,_cdRe0,res\)/.test(re));
  const src=re.match(/function reMorningKid\(kid,today\)\{[\s\S]*?\n\}\n/)[0];
  ok("the run's own lines are unchanged",src.indexOf("    const pn=mastGetPrintNum(kid), res=reApply(kid,pn,reReviewedOn(kid,pn)?pn+1:pn);\n")>0&&(src.match(/db\.ref\(/g)||[]).length===1);
  // Run the real reMorningKid with stubs: the hook gets the kid, its start time and reApply's result; a run another device won records nothing.
  const run=(committed,cdOn)=>{ const calls=[], applied=[];
    const fn=new Function("masteryData","mastSchoolDayNum","reDayBefore","_reBusy","db","mastGetPrintNum","reReviewedOn","reApply","cdNow","cdReviewRun","console",src+"\nreturn reMorningKid;");
    let p; const db={ref:()=>({transaction:f=>(p=Promise.resolve({committed:committed}))})};
    const res={changed:3,cards:40};
    const k=fn({ellis:[{}],ellis_settings:{}},(k,d)=>d==="2026-10-26"?12:11,()=>"2026-10-25",{},db,()=>12,()=>false,(k,pn,st)=>{ applied.push([k,pn,st]); return res; },
      cdOn?(()=>5000):undefined,cdOn?((k,t0,r)=>{ calls.push([k,t0,r]); }):undefined,{log:()=>{}});
    k("ellis","2026-10-26"); return p.then(()=>({calls,applied,res})); };
  global.__reChecks=Promise.all([run(true,true),run(false,true),run(true,false)]).then(([a,b,c])=>{
    ok("a run this device won: the diary gets the kid, start time and reApply's result",a.calls.length===1&&a.calls[0][0]==="ellis"&&a.calls[0][1]===5000&&a.calls[0][2]===a.res,a.calls);
    ok("…and reApply ran exactly as before (same kid, school day, start)",a.applied.length===1&&a.applied[0].join()==="ellis,12,12",a.applied);
    ok("another device won today → nothing recorded",b.calls.length===0&&b.applied.length===0);
    ok("no diary in the page (a test harness) → the run still happens",c.applied.length===1);
  });
}

console.log("the renderAll counter is never in the way");
{ const src=html.match(/function renderAll\(\)\{\n[\s\S]*?\n\}\n(?=function _renderAllInner)/)[0];
  ok("renderAll counts around its own body, in place",/^function renderAll\(\)\{\n(?:  try\{ if\(typeof renderAllSoonDrop==="function"\) renderAllSoonDrop\(\); \}catch\(e\)\{\}[^\n]*\n)?  const _cdR0=\(typeof cdRenderStart==="function"\)\?cdRenderStart\(\):-1;[^\n]*\n  try\{\n  _preserveUI\(_renderAllInner\);/.test(src)&&/\n  \} finally \{ try\{ if\(typeof cdRenderEnd==="function"\) cdRenderEnd\(_cdR0\); \}catch\(e\)\{\} \}[^\n]*\n\}\n$/.test(src));
  const run=(start,end,pre)=>new Function("cdRenderStart","cdRenderEnd","_preserveUI","_renderAllInner",src+"\nreturn renderAll;")(start,end,pre,()=>{});
  let ended=0, ran=0;
  run(()=>1,()=>{ ended++; },()=>{ ran++; })(); ok("normal repaint: body runs once, counted once",ran===1&&ended===1);
  let threw=null; ended=0; try{ run(()=>1,()=>{ ended++; },()=>{ throw new Error("paint failed"); })(); }catch(e){ threw=e.message; }
  ok("a repaint that throws still throws the same error (boot paint's try/catch sees it) and is still counted",threw==="paint failed"&&ended===1,threw);
  threw=null; try{ run(()=>1,()=>{ throw new Error("counter broke"); },()=>{ ran++; })(); }catch(e){ threw=e.message; }
  ok("a broken counter never breaks the repaint",threw===null);
  threw=null; ran=0; try{ new Function("_preserveUI","_renderAllInner",src+"\nreturn renderAll;")(()=>{ ran++; },()=>{})(); }catch(e){ threw=e.message; }
  ok("no counter defined at all (a test harness) → repaint runs",threw===null&&ran===1,threw);
}
(global.__reChecks||Promise.resolve()).catch(e=>{ fail++; console.log("  ✗ review-engine run threw  → "+e); }).then(()=>{ console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0); });
