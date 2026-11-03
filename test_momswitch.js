/* 🔓 MOMSWITCH — the one Mom switch beside Live (her ask 2026-11-02): on = code once, everything Mom-only open on this
 * device; off = everything relocks, code needed to turn it on again; leaving Mom's Day no longer turns Mom mode off; the
 * Notebook / Units tabs' own 🔒 Mom buttons are retired.   run: node test_momswitch.js */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":"")); } };
const fn=name=>{ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); return src.slice(i,src.indexOf("\n}",i)+2); };
const a=src.indexOf("// MOMSWITCH_START"), b=src.indexOf("// MOMSWITCH_END");
ok("MOMSWITCH block is marked once", a>0&&b>a&&src.split("// MOMSWITCH_START").length===2);
const block=src.slice(a,b);
ok("the block compiles on its own", (()=>{ try{ new vm.Script(block); return true; }catch(e){ return false; } })());
ok("every inline <script> still compiles", (()=>{ const re=/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g; let m,n=0; while((m=re.exec(src))){ n++; try{ new vm.Script(m[1]); }catch(e){ console.log("    script #"+n+": "+e.message); return false; } } return n>0; })());

console.log("── the header ──");
ok("the switch sits in #fb-status beside Live, hidden until the first paint", /<span id="fb-lbl">Offline<\/span><span class="bfp" id="bfp-hdr"><\/span><button id="mom-switch" onclick="momSwitchTap\(\)" style="display:none">/.test(src));
ok("it looks like a switch: a track with a knob, and a label", /<span class="ms-track"><span class="ms-knob"><\/span><\/span><span id="mom-switch-lbl">Mom<\/span>/.test(src));
ok("CSS: off grey, on teal (knob slides)", /#mom-switch\.on\{border-color:#2B7A78/.test(src)&&/#mom-switch\.on \.ms-knob\{left:14px\}/.test(src));
ok("painted on every render (before the day-card early return)", (()=>{ const r=fn("_renderAllInner"); const p=r.indexOf("momSwitchPaint()"), d=r.indexOf("if(typeof dcOn===\"function\"&&dcOn())"); return p>0&&d>p; })());
ok("no family or kid name in the block", !/lincoln|ellis|lucy|julian|howe|dewalt|burris/i.test(block));

console.log("── paint ──");
function world(o){
  o=o||{};
  const btn={style:{display:"x"},cls:new Set(),classList:{toggle(c,on){ if(on) btn.cls.add(c); else btn.cls.delete(c); }},title:""};
  const lbl={textContent:""}; const log={off:0,renders:0,gate:null};
  const env={ momHereReal:()=>!!o.on, document:{getElementById:id=>id==="mom-switch"?btn:(id==="mom-switch-lbl"?lbl:null)},
    _kiosk:()=>!!o.play,_kioskR:()=>!!o.general,_kioskK:()=>!!o.corner,_kioskD:()=>!!o.dad,
    haMomOff:()=>{ log.off++; o.on=false; }, renderAll:()=>log.renders++, kitPinGate:(then,why)=>{ log.gate={then,why}; } };
  const keys=Object.keys(env);
  const api=new Function(...keys,"var schedShowAdmin=true;\n"+block+"\nreturn {momSwitchOn,momSwitchPaint,momSwitchTap,adm:()=>schedShowAdmin};")(...keys.map(k=>env[k]));
  return {api,btn,lbl,log};
}
{ const w=world(); w.api.momSwitchPaint(); ok("off: shown, grey, label 'Mom'", w.btn.style.display===""&&!w.btn.cls.has("on")&&w.lbl.textContent==="Mom"); }
{ const w=world({on:true}); w.api.momSwitchPaint(); ok("on: lit, label 'Mom on'", w.btn.cls.has("on")&&w.lbl.textContent==="Mom on"&&/tap to lock/.test(w.btn.title)); }
ok("hidden on every kiosk link (Play, General, Corner, Dad)", ["play","general","corner","dad"].every(k=>{ const w=world({[k]:true,on:true}); w.api.momSwitchPaint(); return w.btn.style.display==="none"; }));
ok("reads the device's REAL state (momHereReal), so it stays lit on the kids' Schedule where Mom mode is set aside", /function momSwitchOn\(\)\{ return \(typeof momHereReal==="function"\)\?momHereReal\(\):false; \}/.test(block));

console.log("── tap ──");
{ const w=world({on:true}); w.api.momSwitchTap();
  ok("on → tap → off: haMomOff, Admin closed, screen redrawn, no code asked", w.log.off===1&&w.api.adm()===false&&w.log.renders===1&&!w.log.gate); }
{ const w=world(); w.api.momSwitchTap();
  ok("off → tap → the code door (kitPinGate: pinOk → haMomOn), nothing turns on without it", !!w.log.gate&&w.log.off===0&&w.log.renders===0&&/code once/.test(w.log.gate.why));
  w.log.gate.then(); ok("…right code → screen redraws", w.log.renders===1); }
ok("the code door it reuses turns Mom mode on and takes Mom's code (not Dad's) on a plain door", /if\(pinOk\(v\)\|\|dadOk\)\{ haMomOn\(\);/.test(src)&&/const dadOk=!!window\._kitPinDad/.test(src));

console.log("── what the switch replaces ──");
ok("leaving Mom's Day no longer turns Mom mode off (showTab has no haMomOff, no momDayIn relock)", !/haMomOff/.test(fn("showTab"))&&!/momDayIn=false/.test(fn("showTab")));
ok("Mom's Day's door opens whenever the switch is on (no per-visit re-ask)", /^function momGateOpen\(\)\{\n  if\(typeof momHere==="function"&&momHere\(\)\) return true;/.test(fn("momGateOpen")));
ok("…its text says so", /Enter the code once \\u2014 the Mom switch at the top stays on until you turn it off\./.test(src));
ok("Mom's Day ▸ Schedule reads the switch", /if\(!momHere\(\)\)\{ mpSubView="cal"; showTab\("moms-plan"\); return; \}/.test(fn("msvEnter")));
ok("Notebook / Units tabs draw no 🔒 Mom button or PIN box of their own", /function _nbMomLockHtml\(\)\{ nbPinOpen=false; return ""; \}/.test(src)&&/function _unitMomLockHtml\(\)\{ unitPinOpen=false; return ""; \}/.test(src)&&!/nb-pin-inp|unit-pin-inp|nbPinToggle|unitPinToggle/.test(src));
ok("every other code door still turns the switch on (haMomOn) — unchanged", ["checkMomPin","checkAdminPin","kitPinCheck","mastAdminCheckPin","pnwCheckPin","momGateTry"].every(n=>/haMomOn\(\)/.test(fn(n))));
ok("Kids' Corner cards stay the kid's even with the switch on (momHereCards unchanged)", /function momHereCards\(\)\{ return momHere\(\)&&!\(typeof tab!=="undefined"&&tab==="kids"\); \}/.test(src));
ok("the kids' Schedule still sets Mom mode aside (KIDSLENS; SCHEDBAR: under the Mom chip too)", /if\(tab==="schedule"&&!momSchedView\)\{ _momSuspend\(\); \} else _momResume\(\);/.test(src));
ok("remembered per device, never synced: haMomOn/haMomOff still write ha_mom_on and nothing writes it to Firebase", /HA_LS\.setItem\('ha_mom_on','1'\)/.test(fn("haMomOn"))&&/HA_LS\.setItem\('ha_mom_on','0'\)/.test(fn("haMomOff"))&&!/ref\([^)]*ha_mom_on/.test(src));

console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
