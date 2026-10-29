// RENDERSOON — 🖼 data-triggered redraws combined, taps still instant (her yes 2026-10-24: "build the redraw-combining step
// (data-triggered redraws combined, my taps still instant)"). A Firebase listener that repaints because data ARRIVED calls
// renderAllSoon() → ONE renderAll a moment later for the whole burst; a direct renderAll() (every tap) paints at once and drops
// the waiting one; the CDBOOTS counters count real redraws only.   run: node test_render_soon.js
const fs=require("fs"), path=require("path"); const dir=process.argv[2]||__dirname;
const html=fs.readFileSync(path.join(dir,"index.html"),"utf8");
let pass=0,fail=0; const ok=(n,c,x)=>{ if(c){pass++;console.log("  ✓ "+n);} else {fail++;console.log("  ✗ "+n+(x!==undefined?"  → "+JSON.stringify(x):""));} };
const slice=(a,b)=>{ const i=html.indexOf(a), j=html.indexOf(b,i); return (i<0||j<0)?"":html.slice(i,j+b.length); };
const blk=slice("// RENDERSOON_START","// RENDERSOON_END"), cdb=slice("// CDBOOTS_START","// CDBOOTS_END");
const fnSrc=name=>{ const i=html.indexOf("\nfunction "+name+"("); if(i<0) return ""; const j=html.indexOf("\n}\n",i); return html.slice(i+1,j+2); };
const raSrc=fnSrc("renderAll");

console.log("where it lives");
ok("RENDERSOON block present, with her words and the date",!!blk&&/2026-10-24/.test(blk)&&/my taps still instant/.test(blk));
ok("…right above renderAll",!!blk&&html.indexOf("// RENDERSOON_END")<html.indexOf("\nfunction renderAll(){")&&html.indexOf("\nfunction renderAll(){")-html.indexOf("// RENDERSOON_END")<40);
ok("display only: no database, no storage, no scheduler in the block",!!blk&&!/db\.|\.ref\(|HA_LS|localStorage|schedCascade|runCascade|_dryRun/.test(blk));
ok("renderAll drops a waiting combined redraw before it paints",/^function renderAll\(\)\{\n  try\{ if\(typeof renderAllSoonDrop==="function"\) renderAllSoonDrop\(\); \}catch\(e\)\{\}/.test(raSrc),raSrc.slice(0,160));
ok("renderAll still feeds the CDBOOTS counters itself (cdRenderStart … cdRenderEnd)",/cdRenderStart\(\)/.test(raSrc)&&/cdRenderEnd\(_cdR0\)/.test(raSrc));
ok("renderAllSoon never touches the counters (only real redraws count)",!/cdRender|_cdB/.test(blk));
const msMatch=blk.match(/const RENDER_SOON_MS=(\d+);/); const MS=msMatch?+msMatch[1]:-1;
ok("one short wait, 30–150 ms",MS>=30&&MS<=150,MS);

// ── the real block + the real renderAll + the real CDBOOTS, with a fake clock and fake timers ──
function mk(opts){
  opts=opts||{};
  let pnow=1000; const timers=[]; let tid=0; const log=[];
  const st=opts.badTimer?(()=>{ throw new Error("no timers"); }):((fn,ms)=>{ const t={id:++tid,fn,ms,live:true}; timers.push(t); return t.id; });
  const ct=id=>{ timers.forEach(t=>{ if(t.id===id) t.live=false; }); };
  const perf={now:()=>pnow,getEntriesByType:()=>[]};
  const doc={getElementById:()=>null};
  const inner=()=>{ log.push("paint"); pnow+=opts.paintMs||400; if(opts.onPaint) opts.onPaint(api); };
  const f=new Function("setTimeout","clearTimeout","performance","document","window","sessionStorage","_renderAllInner","_preserveUI","hbAlertsSoon","frPanelPaint","HA_LS","dbg","CODE_VERSION",
    cdb+"\n"+blk+"\n"+raSrc+"\nreturn {renderAll,renderAllSoon,renderAllSoonDrop,B:()=>_cdB,pending:()=>_rsT};");
  const api=f(st,ct,perf,doc,undefined,undefined,inner,fn=>fn(),()=>{},undefined,{getItem:()=>null,setItem:()=>{}},()=>{},"1");
  const flush=()=>{ let n=0; for(let k=0;k<50;k++){ const t=timers.find(x=>x.live); if(!t) break; t.live=false; pnow+=t.ms; t.fn(); n++; } return n; };
  return {api,log,timers,flush,live:()=>timers.filter(t=>t.live).length,tick:ms=>{pnow+=ms;}};
}
console.log("a burst of data → one redraw");
{ const h=mk(); for(let i=0;i<40;i++) h.api.renderAllSoon();
  ok("40 listener calls paint nothing yet",h.log.length===0,h.log.length);
  ok("…and set exactly ONE timer",h.timers.length===1&&h.live()===1,h.timers.length);
  ok("…for RENDER_SOON_MS",h.timers[0]&&h.timers[0].ms===MS);
  h.flush();
  ok("when it fires: exactly one renderAll",h.log.length===1,h.log.length);
  ok("the boot diary counts 1 redraw, not 40",h.api.B().renders===1,h.api.B().renders);
  ok("…and its real time (renderMs / maxRenderMs = one 400 ms paint)",Math.round(h.api.B().renderMs)===400&&Math.round(h.api.B().maxRenderMs)===400,[h.api.B().renderMs,h.api.B().maxRenderMs]);
  h.api.renderAllSoon(); ok("the next arrival after it fired sets a new one",h.live()===1); h.flush();
  ok("…and paints once more (2 real redraws, 2 counted)",h.log.length===2&&h.api.B().renders===2,[h.log.length,h.api.B().renders]); }
console.log("a tap is instant and covers the waiting one");
{ const h=mk(); for(let i=0;i<5;i++) h.api.renderAllSoon();
  h.api.renderAll();
  ok("a direct renderAll paints at once",h.log.length===1);
  ok("…and drops the waiting combined redraw",h.live()===0&&!h.api.pending(),h.live());
  ok("no double paint afterwards",h.flush()===0&&h.log.length===1,h.log.length);
  ok("counted once",h.api.B().renders===1,h.api.B().renders); }
{ const h=mk(); h.api.renderAll(); h.api.renderAll();
  ok("two taps in a row: two instant paints, nothing waiting",h.log.length===2&&h.live()===0); }
{ let once=true; const h=mk({onPaint:a=>{ if(once){ once=false; a.renderAllSoon(); } }});
  h.api.renderAllSoon(); h.api.renderAll();
  ok("data that arrives DURING a paint still gets its own redraw (the drop happens before the paint, not after)",h.live()===1,h.live());
  h.flush(); ok("…exactly one",h.log.length===2,h.log.length); }
{ const h=mk({badTimer:true}); h.api.renderAllSoon();
  ok("no timers on this device → it simply paints (never a lost redraw)",h.log.length===1&&!h.api.pending(),h.log.length); }
{ const h=mk(); h.api.renderAllSoonDrop(); ok("dropping with nothing waiting is harmless",h.live()===0&&h.log.length===0); }
{ const h=mk(); h.tick(31000); for(let i=0;i<3;i++) h.api.renderAllSoon(); h.flush();
  ok("after the 30-s window the counters stop, the redraw still happens",h.log.length===1&&h.api.B().renders===0,[h.log.length,h.api.B().renders]); }
{ // renderAll that runs before the block's line (top-level boot code): var, so no TDZ throw
  const f=new Function("setTimeout","clearTimeout","log",raSrc.replace(/_preserveUI\(_renderAllInner\);/,"log.push('paint');")+"\nrenderAll();\n"+blk+"\nreturn true;");
  let threw=false; const lg=[]; try{ f(()=>1,()=>{},lg); }catch(e){ threw=e.message; }
  ok("a renderAll before the block has run still paints (no uninitialised-variable throw)",!threw&&lg.length===1,threw); }

// ── call sites ──
console.log("which paths combine (data arrived) and which stay instant (taps)");
function matchParen(i){ let d=0,q=null,esc=false; for(let j=i;j<html.length;j++){ const c=html[j];
    if(q){ if(esc){esc=false;continue;} if(c==="\\"){esc=true;continue;} if(c===q) q=null; continue; }
    if(c==='"'||c==="'"||c==="`"){ q=c; continue; } if(c==="/"&&html[j+1]==="/"){ j=html.indexOf("\n",j); continue; }
    if(c==="("){d++;} else if(c===")"){ d--; if(d===0) return j; } } return -1; }
const lineOf=i=>html.slice(0,i).split("\n").length;
const cbs=[]; { const re=/\.(on|once)\(\s*["'](value|child_added|child_changed|child_removed)["']\s*,/g; let m;
  while((m=re.exec(html))){ const open=m.index+m[1].length+1, close=matchParen(open); if(close<0) continue;
    const pre=html.slice(Math.max(0,m.index-160),m.index), p=(pre.match(/ref\(([^;]*?)\)(?:\.[a-zA-Z]+\([^()]*\))*\s*$/)||[,"?"])[1];
    cbs.push({line:lineOf(m.index),path:p,body:html.slice(open,close)}); } }
// the two left alone on purpose: the generator's week hand-over (inside the schedule lock) and an unused week-config read
const KEEP=[/wkHandoverTo\(wn,_existing/, /gwConfig=\{/];
const stillDirect=cbs.filter(c=>/\brenderAll\(\)/.test(c.body)&&!KEEP.some(k=>k.test(c.body)));
ok("no listener callback calls renderAll() directly any more",stillDirect.length===0,stillDirect.map(c=>c.line+" "+c.path));
const soon=cbs.filter(c=>/renderAllSoon\(\)/.test(c.body)).map(c=>c.path.replace(/\s/g,""));
const MUST=['"ha_active_wk"','"calendar"','"esa"','"plans"','"scheduleOverrides"','"together"','"mathSprints"','"reviews"','"config/momLoop"',
  '"laundry"','"kitchen/prepDone"','"kitchen/grocery"','"curriculum/done"','"curriculum"','"settings/mealWords"','"config/rules"','"mastery"',
  '"waved"','"spotChecks"','"settings/spotCheck"','"config/rewards"','"config/storeCfg"','"config/grabs"','"config/zones"','"config/zonePlan"',
  '"config/rotationPeriod"','"config/routineBonus"','"config/choreVerify"','"config/zoneBonus"','"pointRequests"','"grabClaims"','"techOff"',
  'pw+"/sl"','"curriculum/resources"','"rebuildLog"'];
ok("initFb's feeds that repainted now combine ("+MUST.length+")",MUST.every(p=>soon.includes(p)),MUST.filter(p=>!soon.includes(p)));
const WEEK=["meta","checked","claimed","sentBack","discuss","momMoves","sl","tasks","blockouts","dayStart","momHold","pending_spins","spin_results","co_manual_sat"];
const aw=fnSrc("attachWeekListeners");
ok("this week's feeds combine ("+WEEK.length+": meta, checked, claimed, … co_manual_sat)",WEEK.every(k=>{ const i=aw.indexOf('db.ref(wk+"/'+k+'")'); const j=aw.indexOf("fbWeekRefs.push",i); return i>0&&/renderAllSoon\(\)/.test(aw.slice(i,j))&&!/\brenderAll\(\)/.test(aw.slice(i,j)); }),
  WEEK.filter(k=>{ const i=aw.indexOf('db.ref(wk+"/'+k+'")'); const j=aw.indexOf("fbWeekRefs.push",i); return !(i>0&&/renderAllSoon\(\)/.test(aw.slice(i,j))); }));
const mm=fnSrc("mmAttachWeek"); ok("⏱ started + minAlerts combine",(mm.match(/renderAllSoon\(\)/g)||[]).length===2&&!/\brenderAll\(\)/.test(mm));
const mb=fnSrc("momBlocksListen"); ok("momBlocks/<today> combines",/renderAllSoon\(\)/.test(mb)&&!/\brenderAll\(\)/.test(mb));
const pk=fnSrc("peekLoad"); ok("next week's peek data, when it lands, combines",/renderAllSoon\(\)/.test(pk)&&!/\brenderAll\(\)/.test(pk));
["wsOnValue","hrOnValue","helpersOnValue","helperDaysOnValue","helperGiveOnValue","famProgOnValue"].forEach(n=>{ const s=fnSrc(n);
  ok(n+" (listener only) combines",/renderAllSoon\(\)/.test(s)&&!/\brenderAll\(\)/.test(s)); });
ok("…and nothing but its listener calls them",["wsOnValue","hrOnValue","helpersOnValue","helperDaysOnValue","helperGiveOnValue","famProgOnValue"].every(n=>(html.match(new RegExp("\\b"+n+"\\(","g"))||[]).length===2));
ok("msgOnValue: the listener asks to combine, ✓ Got it / a reply paint at once",/db\.ref\("messages"\)\.on\("value",s=>\{ msgOnValue\(s\.val\(\),true\); \}\)/.test(html)&&/msgClose\(\); msgOnValue\(msgData\);/.test(html)&&/\n  msgOnValue\(msgData\);\n\}/.test(html)&&/if\(soon\) renderAllSoon\(\); else renderAll\(\);/.test(fnSrc("msgOnValue")));
ok("pagesApply: the settings/pages listener combines, pagesToggle (a tap) paints at once",/db\.ref\("settings\/pages"\)\.on\("value",s=>\{ pagesApply\(s\.val\(\),true\); \}\)/.test(html)&&/pagesApply\(next\);/.test(fnSrc("pagesToggle"))&&/else if\(soon\) renderAllSoon\(\); else renderAll\(\);/.test(fnSrc("pagesApply")));
// every renderAllSoon() call sits in the block, a listener callback, or one of the listener helpers above
const ALLOWED_FN=["cpuWatch",   // 📦 CPUNIT (2026-10-28): a unit's catalog entry arriving (units/<id>/index listener)
  "cpceKidLoad",   // 📚 CPCARDSEDIT (2026-10-28): the class's card layer arriving (classCards/<cid>, read once at a kid's boot)
  "cpphKidRepaint",   // 🖼 CPPHOTOS (2026-10-29): the class's and the unit's photo layers arriving (read once at a kid's boot)
  "cplnLoad",   // 🌿 CPLINCOLN (2026-10-29): Lincoln's class settings, plan and override arriving (read once through his mirror)
  "attachWeekListeners","initFb","_loadPrevSl","mmAttachWeek","momBlocksListen","peekLoad","lrListen","rbLogListen","wsOnValue","hrOnValue","helpersOnValue","helperDaysOnValue","helperGiveOnValue","famProgOnValue","msgOnValue","pagesApply","envmRelease","envtFinalAttach","envsReadShared","envcSub","envClsKidLoad"];   // 🌿 ENVMIRROR / ENVSITE: listener-attach helpers whose arrivals combine; the teacher's release listener (data arrived)
const stray=[]; { let cur=null; html.split("\n").forEach((l,i)=>{ const m=l.match(/^(?:async\s+)?function\s+([\w$]+)/); if(m) cur=m[1];
  if(/renderAllSoon\(\)/.test(l)&&!/^function renderAllSoon|^\/\//.test(l)&&!/^\/\/ /.test(l.trim())&&!ALLOWED_FN.includes(cur)) stray.push((i+1)+" in "+cur); }); }
ok("renderAllSoon is used nowhere else (no tap path combines)",stray.length===0,stray);
ok("no onclick / tap handler string ever names renderAllSoon",!/on(click|change|input|submit|keyup|keydown)=[^>]*renderAllSoon/.test(html)&&!/'[^'\n]*renderAllSoon[^'\n]*'/.test(html.replace(blk,"")));
const TAPS=["showTab","kcPick","toggleSchedPeek","toggleEarlierDays","dmToggle","dmToggleAll"];
TAPS.forEach(n=>{ const s=html.slice(html.indexOf("function "+n+"("),html.indexOf("\n",html.indexOf("function "+n+"("))+1)+fnSrc(n);
  ok("tap "+n+"() still calls renderAll() directly",/\brenderAll\(\)/.test(s)&&!/renderAllSoon/.test(s)); });
{ const s=fnSrc("haAuthGate"); ok("the sign-in gate's first paint is still direct (initFb(); renderAll())",/initFb\(\); renderAll\(\);/.test(s)&&!/renderAllSoon/.test(s)); }
ok("the boot paint at INIT is still direct",/\ntry\{ renderAll\(\); \}catch\(e\)\{ console\.error\("\[HA\] boot paint failed"/.test(html));
ok("the tap paths keep their many direct calls (renderAll() still > 650 places)",(html.match(/\brenderAll\(\)/g)||[]).length>650,(html.match(/\brenderAll\(\)/g)||[]).length);

console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
