/* 👩 MOMCHIP — Mom first in the kid row on the main Schedule (her ask 2026-11-02: "a Mom tab on the main schedule showing her
 * schedule with nothing code-gated unless the switch is on"). Switch off: her agenda as a view only, no code box. Switch on: the
 * same view with her tools. The All / kid chips keep the kids' Schedule exactly the kids' (KIDSLENS).   run: node test_mom_chip.js */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":"")); } };
const fn=name=>{ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); return src.slice(i,src.indexOf("\n}",i)+2); };
const a=src.indexOf("// MOMCHIP_START"), b=src.indexOf("// MOMCHIP_END");
ok("MOMCHIP block is marked once (around renderKidFilter)", a>0&&b>a&&src.split("// MOMCHIP_START").length===2&&src.slice(a,b).indexOf("function renderKidFilter(")>0);
const block=src.slice(a,b);
ok("every inline <script> still compiles", (()=>{ const re=/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g; let m,n=0; while((m=re.exec(src))){ n++; try{ new vm.Script(m[1]); }catch(e){ console.log("    script #"+n+": "+e.message); return false; } } return n>0; })());
ok("no family or kid name in the block", !/lincoln|ellis|lucy|julian|howe|dewalt|burris/i.test(block));

console.log("── every paint: when Mom mode is set aside ──");
const LINE=(src.match(/\n(  try\{ if\(tab==="schedule"&&!momSchedView\)\{ _momSuspend\(\); \} else _momResume\(\); \}catch\(e\)\{\}[^\n]*)\n/)||[])[1];
ok("the KIDSLENS line sets Mom mode aside under every chip on the main Schedule (SCHEDBAR: the Mom chip too) and no longer forces Mom view → All", !!LINE&&fn("_renderAllInner").indexOf(LINE)>0&&!/if\(kid==="mom"\) kid="all"/.test(fn("_renderAllInner")));
function lens(o){   // the real _momSuspend/_momResume/momHereReal/haMomOn/haMomOff + that one line, in a small world
  const L=["_momSuspend","_momResume","momHereReal","haMomOn","haMomOff"].map(fn).join("\n");
  const w=new Function("HA_LS","var _momSusp=null,momModeActive=false,momPinUnlocked=false,adminPinUnlocked=false,mastAdminPinOk=false;\n"+L
    +"\nreturn function(tab,momSchedView,kid,on){ if(on) haMomOn(); else haMomOff();\n"+LINE+"\nreturn {active:momModeActive,real:momHereReal()}; };")({setItem(){}});
  return w(o.tab,!!o.msv,o.kid,!!o.on);
}
ok("switch on, main Schedule, 👩 Mom chip → still set aside: her view alone, no tools (SCHEDBAR, her plan-2: \"it cannot do permissions\")", (()=>{ const r=lens({tab:"schedule",kid:"mom",on:true}); return r.active===false&&r.real===true; })());
ok("switch on, main Schedule, All → set aside (the kids' Schedule stays the kids')", (()=>{ const r=lens({tab:"schedule",kid:"all",on:true}); return r.active===false&&r.real===true; })());
ok("…and a kid's chip → set aside too", lens({tab:"schedule",kid:"ava",on:true}).active===false);
ok("switch off, 👩 Mom chip → her view alone, nothing on", (()=>{ const r=lens({tab:"schedule",kid:"mom",on:false}); return r.active===false&&r.real===false; })());
ok("Mom's Day ▸ Schedule (MSV) and every other tab: back on as before", lens({tab:"schedule",msv:true,kid:"ava",on:true}).active===true&&lens({tab:"moms-plan",kid:"all",on:true}).active===true);

console.log("── the kid row ──");
function row(o){
  o=o||{}; const els={"kid-filter":{innerHTML:""},"mom-pin-bar":{style:{display:"block"},innerHTML:"old"}};
  const env={ ROSTER:["ava","ben"], momSchedView:!!o.msv, momModeActive:!!o.on, kid:o.kid||"all", cap:s=>s.charAt(0).toUpperCase()+s.slice(1),
    helperChipsHTML:()=>"", bankBalance:()=>7, document:{getElementById:id=>els[id]||null}, setTimeout:()=>0 };
  const keys=Object.keys(env);
  new Function(...keys,fn("renderKidFilter")+"\nrenderKidFilter();")(...keys.map(k=>env[k]));
  return {kf:els["kid-filter"].innerHTML, pin:els["mom-pin-bar"]};
}
{ const r=row({kid:"all"}); const ix=k=>r.kf.indexOf("selKid('"+k+"')");
  ok("main Schedule, switch off: 👩 Mom first, then All, then each kid", ix("mom")>=0&&ix("mom")<ix("all")&&ix("all")<ix("ava")&&ix("ava")<ix("ben"));
  ok("…the chip reads Mom (not ✓ Mom) while the switch is off", /selKid\('mom'\)">Mom<\/button>/.test(r.kf));
  ok("…no code box under the row (display none, emptied)", r.pin.style.display==="none"&&r.pin.innerHTML===""&&r.kf.indexOf("mom-pin-input")<0);
}
{ const r=row({kid:"mom"}); ok("her view with the switch off: Mom chip lit, still no code box", /class="kid-btn active" data-kid="mom"/.test(r.kf)&&r.pin.style.display==="none"&&!/Enter Admin Code|checkMomPin/.test(r.kf+r.pin.innerHTML)); }
{ const r=row({kid:"mom",on:true}); ok("(✓ Mom only ever shows where Mom mode is really on — Mom's Day ▸ Schedule)", /class="kid-btn active" data-kid="mom" onclick="selKid\('mom'\)">✓ Mom<\/button>/.test(r.kf)); }
{ const r=row({kid:"ava"}); ok("a kid's chip: that kid lit, ⭐ star chip as before", /class="kid-btn active" data-kid="ava"/.test(r.kf)&&/star-chip[^>]*>⭐ 7</.test(r.kf)); }
{ const r=row({kid:"mom",msv:true,on:true}); ok("Mom's Day ▸ Schedule: the same row (unchanged)", /selKid\('mom'\)">✓ Mom<\/button><button class="kid-btn" data-kid="all"/.test(r.kf)); }
ok("the row is the one list everywhere (no per-page branch any more)", /\["mom","all",\.\.\.ROSTER\]\.map\(k=>\{/.test(fn("renderKidFilter"))&&!/momSchedView/.test(fn("renderKidFilter")));

console.log("── tapping 👩 Mom ──");
function tap(o){
  const log={off:0,renders:0,scroll:0};
  const api=new Function("haMomOff","renderAll","window","var momSchedView="+!!o.msv+",momModeActive="+!!o.on+",momPinUnlocked="+!!o.on+",kid='"+(o.kid||"all")+"',schedShowAdmin=true,helperView='x';\n"+fn("selKid")
    +"\nreturn {selKid,st:()=>({kid,adm:schedShowAdmin,hv:helperView})};")(()=>{ log.off++; },()=>{ log.renders++; },{scrollTo(){ log.scroll++; }});
  return {api,log};
}
{ const t=tap({}); t.api.selKid("mom");
  ok("switch off, main Schedule: Mom → her view, Admin closed, redraw, no code, no off", t.api.st().kid==="mom"&&t.api.st().adm===false&&t.log.renders===1&&t.log.off===0&&t.log.scroll===1); }
{ const t=tap({on:true,kid:"mom"}); t.api.selKid("mom"); t.api.selKid("mom");
  ok("switch on: tapping Mom again (and again) never turns the switch off (was: a second tap → off)", t.log.off===0&&t.api.st().kid==="mom"&&t.log.renders===2); }
{ const t=tap({on:true,kid:"ava"}); t.api.selKid("mom"); ok("from a kid's chip back to Mom's view", t.api.st().kid==="mom"&&t.log.off===0); }
{ const t=tap({}); t.api.selKid("ava"); ok("a kid's chip: that kid, helper list left, as before", t.api.st().kid==="ava"&&t.api.st().hv===null&&t.log.off===0); }
ok("selKid has no code door and no off at all now", !/haMomOff|checkMomPin|kitPinGate/.test(fn("selKid")));

console.log("── her agenda ──");
ok("the Mom view draws her agenda whenever the Mom chip is picked — the morning-routine gate is the kids' (was: && unlocked → the kids' blurred list)", /\n  if\(kid==="mom"\)\{\n    h\+=momAgendaHtml\(tasks\);/.test(src)&&!/if\(kid==="mom" && unlocked\)/.test(src));
ok("Mom-only extras on the schedule still need Mom mode (the switch on): the displacement summary", /if\(momModeActive&&\(kid==="mom"\|\|kid==="all"\)\) h\+=renderDisplacementSummary\(day, kid\);/.test(src));
ok("cards: Mom tools only with Mom mode (momHereCards unchanged)", /function momHereCards\(\)\{ return momHere\(\)&&!\(typeof tab!=="undefined"&&tab==="kids"\); \}/.test(src));
ok("the kids' Schedule has no Admin button at all now (SCHEDBAR)", !/msvOpenAdmin\(\)'\)\+'">Admin/.test(src)&&/const el=document\.getElementById\("sched-subtabs"\);\n  if\(el\)\{ el\.style\.display="none"; el\.innerHTML=""; \}/.test(fn("renderSchedSubtabs")));

console.log("── nothing else moved ──");
ok("the retired code door (checkMomPin) still exists and turns the switch on if anything ever calls it", /haMomOn\(\)/.test(fn("checkMomPin")));
ok("the #mom-pin-bar element is still in the page (just always hidden) — the kiosk CSS lists it", /<div id="mom-pin-bar" style="display:none;/.test(src));
ok("KIDSLENS helpers untouched", /function _momSuspend\(\)\{ if\(_momSusp\) return;/.test(src)&&/function _momResume\(\)\{ if\(!_momSusp\) return;/.test(src));
ok("no Firebase writes in the block or in selKid", !/db\.|\.ref\(/.test(block)&&!/db\.|\.ref\(/.test(fn("selKid")));
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
