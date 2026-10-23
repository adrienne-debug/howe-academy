/*
 * ✅ KC_LISTS_HEADERS — Kids' Corner ▸ My Lists shows the Schedule tab's list headers (her ask 2026-10-23): "the My Lists
 * tab, I would like it to look more like the ones on the Schedule tab (not the one on Mom's page) where the category is
 * offset and has the how many and also how it collapses like it."
 *
 * What this proves:
 *   1. The header bar (slot name, n/N count, ▾/▸ arrow, rtIsOpen / toggleRtOpen state) is ONE piece of markup, drawn inside
 *      the shared mrIndividualHTML / rtSlotHTML, and BOTH the Schedule tab's kid view (renderSkylight) and My Lists
 *      (kcChoresHTML) call those same functions with nothing wrapped around them. No refactor was needed, so the Schedule
 *      tab is byte-identical: the header strings below were rendered from origin/main 3aa9493 on this fixture and must
 *      still come out exactly the same.
 *   2. My Lists renders one header per active slot with the right n/N; tapping a header calls toggleRtOpen with that slot
 *      and kid (morning: toggleMrOpen); a finished slot renders folded unless opened by hand; the fold state is the same
 *      rtOpen key on both pages; .kc-big rows are still there; the cleaning-day panel still comes first.
 *   3. The CSS under .kc-big gives the header the Schedule tab's shape (steps indented under it, a smaller box on a step
 *      than on its header, the count readable, the arrow big) and touches nothing outside .kc-big.
 *   run:  node test_kc_lists_headers.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,400)+")":"")); } };
const fn=name=>{ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); let d=0; for(let k=src.indexOf("{",i);k<src.length;k++){ if(src[k]==="{") d++; else if(src[k]==="}"&&--d===0) return src.slice(i,k+1); } throw new Error("unbalanced "+name); };
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("missing "+a); return src.slice(i,j); };
const KC=cut("// KC_LISTS_START","// KC_LISTS_END");

// ── the fixture: lucy, Thursday; morning 2 steps, afternoon 3 steps, chores 1 step, evening 2 steps ─────────────────────
function mk(o){
  o=o||{}; const calls=[];
  const steps={
    morning:[{emoji:"🦷",label:"Brush teeth",pts:0,cad:"daily"},{emoji:"🛏️",label:"Make bed",pts:5,cad:"daily"}],
    afternoon:[{emoji:"🍽️",label:"Pickup kitchen",pts:20,cad:"daily"},{emoji:"🐕",label:"Let Chloe out",pts:0,cad:"daily"},{emoji:"🚿",label:"Shower",pts:50,cad:"daily"}],
    chores:[{emoji:"🪟",label:"Clean front door windows",pts:15,cad:"daily"}],
    evening:[{emoji:"📖",label:"Read",pts:10,cad:"daily"},{emoji:"🦷",label:"Brush teeth",pts:0,cad:"daily"}]};
  const done=Object.assign({},o.done||{});   // "slot_i" -> true
  const ctx={console,Object,Array,String,Number,parseInt,isNaN,Math,JSON,Date,RegExp,Error,setTimeout:(f)=>{ calls.push(["timeout"]); },
    HA_LS:{getItem:()=>null,setItem:()=>{},removeItem:()=>{}}, window:{scrollTo:()=>{}}, calls,
    SL_SLBL:{morning:"Morning",afternoon:"Afternoon",chores:"Chores",evening:"Evening"},
    SL_STIM:{morning:"9:00 AM – 12:00 PM",afternoon:"After school work",chores:"After school",evening:"Bedtime routine"},
    KID_COLOR:{lucy:"#aa0000"}, SCHOOL_KIDS:["lincoln","ellis","lucy"], ROSTER:["lucy"],
    day:"thursday", _todayDay:"thursday", _todayStr:()=>"2026-10-22",
    rtOpen:Object.assign({},o.rtOpen||{}), mrOpen:Object.assign({},o.mrOpen||{}),
    renderSkylight:()=>calls.push(["skylight"]), renderAll:()=>calls.push(["renderAll"]),
    rtStepsFor:(slot,kid)=>steps[slot]||[], morningStepsFor:kid=>steps.morning,
    getSlot:()=>({done:false}), rtAvailable:()=>true, rtStepAvail:()=>true, rtWaved:()=>false, rtWavedRowHTML:()=>"",
    stepWindowOk:()=>true, cadDueOn:()=>true, rtLateDays:()=>0, _rtLogLateMiss:()=>{},
    rtDoneOn:(slot,kid,d,i)=>!!done[slot+"_"+i], mStepDoneOn:(kid,d,i)=>!!done["morning_"+i],
    morningDueIdx:()=>[0,1], morningComplete:()=>!!(done.morning_0&&done.morning_1),
    gateClockHeld:()=>false, gateStartMin:()=>540, fromMin:m=>m+"m",
    rtFmtHour:h=>h+":00", rtAfternoonHour:()=>16, rtEveningHour:()=>18,
    mealOf:()=>"", mealOpen:()=>false, mealHeadHTML:()=>"", routineEditable:()=>true, routineLockNote:()=>"",
    cadLabel:c=>c, stepWindowLabel:()=>"",
    activeSlots:()=>o.slots||["morning","afternoon","chores","evening"],
    hhCleanOn:()=>o.clean!==false, hhCleanPanelHTML:(who,iso,dn)=>{ calls.push(["clean",who,iso,dn]); return '<div id="clean-panel">CLEAN</div>'; },
    bankBalance:()=>42, rtSlotDone:(k,s)=>{ const idx=steps[s].map((x,i)=>i); return idx.every(i=>done[s+"_"+i]); },
    _kcTint:()=>"#eee", esc:s=>String(s==null?"":s), cap:s=>s};
  vm.createContext(ctx);
  vm.runInContext([ "rtOpenKey","rtIsOpen","toggleRtOpen","toggleMrOpen","rtSlotHTML","mrIndividualHTML","kcLittle","kcChoresHTML" ].map(fn).join("\n")+"\n"+KC, ctx);
  ctx.get=e=>vm.runInContext(e,ctx); ctx.run=e=>vm.runInContext(e,ctx); return ctx;
}
// every <div class="sl-check-row…">…</div> header (the one with a ▾/▸ third box), in order
const headers=h=>{ const out=[]; const re=/<div class="sl-check-row[^"]*"[^>]*>[\s\S]*?<\/div><\/div><div style="font-size:14px;color:var\(--muted\)">[▾▸]<\/div><\/div>/g; let m; while((m=re.exec(h))) out.push(m[0]); return out; };

console.log("One header, drawn by the shared functions, on both pages");
{
  const sky=fn("renderSkylight");
  ok("the Schedule tab's kid view calls mrIndividualHTML(kid) for morning and rtSlotHTML(slot,kid) for the rest, with nothing wrapped around them", /if\(slot==="morning"\)\{ h2\+=mrIndividualHTML\(kid\); return; \}\s*\n\s*h2\+=rtSlotHTML\(slot,kid\);/.test(sky), sky.slice(sky.indexOf("INDIVIDUAL VIEW"),sky.indexOf("INDIVIDUAL VIEW")+900));
  const kc=fn("kcChoresHTML");
  ok("My Lists (kcChoresHTML) calls the very same two functions, with nothing wrapped around them either", /if\(slot==="morning"&&typeof mrIndividualHTML==="function"\)\{ h\+=mrIndividualHTML\(k\); return; \}\s*\n\s*h\+=rtSlotHTML\(slot,k\);/.test(kc), kc);
  ok("the header lives inside rtSlotHTML: name, n/N, ▾/▸, rtIsOpen → toggleRtOpen(slot,kid,isOpen)", (()=>{ const r=fn("rtSlotHTML"); return /const isOpen=rtIsOpen\(slot,kid,allDone\);/.test(r)&&/onclick="toggleRtOpen\(\\''\+slot\+'\\',\\''\+kid\+'\\','\+\(isOpen\?'true':'false'\)\+'\)"/.test(r)&&/'\+doneCount\+'\/'\+total\+'<\/span>/.test(r)&&/\(isOpen\?"▾":"▸"\)/.test(r); })());
  ok("…and inside mrIndividualHTML: Morning, n/N, ▾/▸, mrOpen → toggleMrOpen(kid)", (()=>{ const r=fn("mrIndividualHTML"); return /const isOpen=mrOpen\[kid\]!==false;/.test(r)&&/onclick="toggleMrOpen\(\\''\+kid\+'\\'\)"/.test(r)&&/Morning <span[^>]*>'\+doneCount\+'\/'\+_dueIdx\.length\+'<\/span>/.test(r)&&/\(isOpen\?"▾":"▸"\)/.test(r); })());
  ok("the fold state is one key per slot + kid + day (rtOpenKey), read by rtIsOpen on every page", /function rtOpenKey\(slot,kid\)\{ return slot\+"_"\+kid\+"_"\+day; \}/.test(src)&&/function rtIsOpen\(slot,kid,allDone\)\{ const v=rtOpen\[rtOpenKey\(slot,kid\)\]; return \(v===true\|\|v===false\)\?v:!allDone; \}/.test(src));
  ok("a check-off resets the manual fold so a finished list folds itself (toggleRtStep); the morning list folds when done (toggleMorningStep)", /delete rtOpen\[rtOpenKey\(slot,kid\)\];/.test(fn("toggleRtStep"))&&/if\(allDone\) mrOpen\[kid\]=false;/.test(fn("toggleMorningStep")));
}

console.log("Schedule tab: byte-identical headers on the fixture (rendered from origin/main 3aa9493)");
{
  const c=mk({done:{afternoon_0:true}});
  const aft=c.rtSlotHTML("afternoon","lucy"), mor=c.mrIndividualHTML("lucy");
  const AFT_HEAD='<div class="sl-check-row" onclick="toggleRtOpen(\'afternoon\',\'lucy\',true)" style="cursor:pointer"><div class="sl-checkbox"></div><div style="flex:1"><div class="sl-slot-name">Afternoon <span style="color:var(--muted);font-weight:700">1/3</span></div><div class="sl-slot-sub">After school work</div></div><div style="font-size:14px;color:var(--muted)">▾</div></div>';
  const MOR_HEAD='<div class="sl-check-row" onclick="toggleMrOpen(\'lucy\')" style="cursor:pointer"><div class="sl-checkbox"></div><div style="flex:1"><div class="sl-slot-name">Morning <span style="color:var(--muted);font-weight:700">0/2</span></div><div class="sl-slot-sub">Finish all to unlock your schedule</div></div><div style="font-size:14px;color:var(--muted)">▾</div></div>';
  ok("rtSlotHTML('afternoon','lucy') starts with exactly the known header (1/3, open, ▾)", aft.indexOf(AFT_HEAD)===0, aft.slice(0,420));
  ok("…followed by the three step rows under <div class=\"mr-steps\">", /^<div class="mr-steps">/.test(aft.slice(AFT_HEAD.length))&&(aft.match(/<div class="mr-step( done)?"/g)||[]).length===3&&/toggleRtStep\('afternoon','lucy',2\)/.test(aft), aft);
  ok("mrIndividualHTML('lucy') starts with exactly the known header (0/2, open, ▾)", mor.indexOf(MOR_HEAD)===0, mor.slice(0,420));
  ok("…followed by the two morning step rows", /^<div class="mr-steps">/.test(mor.slice(MOR_HEAD.length))&&(mor.match(/<div class="mr-step( done)?"/g)||[]).length===2&&/toggleMorningStep\('lucy',1\)/.test(mor), mor);
  const d=mk({done:{afternoon_0:true,afternoon_1:true,afternoon_2:true}});
  const AFT_DONE='<div class="sl-check-row done" onclick="toggleRtOpen(\'afternoon\',\'lucy\',false)" style="cursor:pointer"><div class="sl-checkbox done">✓</div><div style="flex:1"><div class="sl-slot-name">Afternoon <span style="color:var(--muted);font-weight:700">3/3</span></div><div class="sl-slot-sub">✓ Afternoon done</div></div><div style="font-size:14px;color:var(--muted)">▸</div></div>';
  ok("a finished slot is exactly the known folded header (3/3, done, ▸) and nothing after it", d.rtSlotHTML("afternoon","lucy")===AFT_DONE, d.rtSlotHTML("afternoon","lucy"));
}

console.log("My Lists: a header per active slot, the right n of N");
{
  const c=mk({done:{afternoon_0:true,morning_1:true}});
  const h=c.kcChoresHTML("lucy"), hd=headers(h);
  ok("four active slots → four headers, in slot order: Morning, Afternoon, Chores, Evening", hd.length===4&&/>Morning </.test(hd[0])&&/>Afternoon </.test(hd[1])&&/>Chores </.test(hd[2])&&/>Evening </.test(hd[3]), hd.map(x=>x.slice(0,120)));
  ok("the counts: Morning 1/2 · Afternoon 1/3 · Chores 0/1 · Evening 0/2", />1\/2</.test(hd[0])&&/>1\/3</.test(hd[1])&&/>0\/1</.test(hd[2])&&/>0\/2</.test(hd[3]), hd);
  ok("each header is the Schedule tab's own markup (same class, same tap, same arrow)", hd.every(x=>/^<div class="sl-check-row[^"]*" onclick="toggle(RtOpen|MrOpen)\(/.test(x)&&/<div style="font-size:14px;color:var\(--muted\)">[▾▸]<\/div><\/div>$/.test(x)));
  ok("the afternoon header on My Lists is byte-for-byte the Schedule tab's afternoon header", hd[1]===headers(c.rtSlotHTML("afternoon","lucy"))[0]);
  ok("the morning header on My Lists is byte-for-byte the Schedule tab's morning header", hd[0]===headers(c.mrIndividualHTML("lucy"))[0]);
  const two=mk({slots:["morning","evening"]}); ok("a paused slot draws no header (follows activeSlots)", headers(two.kcChoresHTML("lucy")).length===2);
}

console.log("My Lists: tapping a header folds it — the same key the Schedule tab reads");
{
  const c=mk(); const h=c.kcChoresHTML("lucy"), hd=headers(h);
  const tap=/onclick="([^"]*)"/.exec(hd[1])[1];
  ok("the afternoon header's tap is toggleRtOpen('afternoon','lucy',true)", tap==="toggleRtOpen('afternoon','lucy',true)", tap);
  c.run(tap);
  ok("…which sets rtOpen['afternoon_lucy_thursday']=false and asks the Schedule panel to repaint", c.get("rtOpen").afternoon_lucy_thursday===false&&c.calls.some(x=>x[0]==="skylight"), c.get("rtOpen"));
  const after=headers(c.kcChoresHTML("lucy"));
  ok("My Lists now draws Afternoon folded (▸, no step rows after it) while the others stay open", /▸/.test(after[1])&&/▾/.test(after[0])&&/▾/.test(after[2])&&(c.kcChoresHTML("lucy").match(/<div class="mr-steps">/g)||[]).length===3);
  ok("…and the Schedule tab's rtSlotHTML draws it folded too — one state, both pages", /▸/.test(headers(c.rtSlotHTML("afternoon","lucy"))[0])&&!/mr-steps/.test(c.rtSlotHTML("afternoon","lucy")));
  ok("the My Lists wrapper repaints the Corner after any tap on a row (setTimeout(renderAll,30)) — toggleRtOpen's own repaint is the Schedule panel's", /onclick="if\(event\.target\.closest\('\[onclick\]'\)\) setTimeout\(renderAll,30\)"/.test(h));
  const mtap=/onclick="([^"]*)"/.exec(hd[0])[1];
  ok("the morning header's tap is toggleMrOpen('lucy')", mtap==="toggleMrOpen('lucy')", mtap);
  c.run(mtap); ok("…which folds Morning (mrOpen.lucy=false) on both pages", c.get("mrOpen").lucy===false&&/▸/.test(headers(c.kcChoresHTML("lucy"))[0])&&/▸/.test(headers(c.mrIndividualHTML("lucy"))[0]));
}

console.log("My Lists: a finished list folds itself, unless opened by hand");
{
  const c=mk({done:{afternoon_0:true,afternoon_1:true,afternoon_2:true}});
  const h=c.kcChoresHTML("lucy"), hd=headers(h);
  ok("Afternoon 3/3 → header done, ▸, no step rows under it", /sl-check-row done/.test(hd[1])&&/>3\/3</.test(hd[1])&&/▸/.test(hd[1])&&(h.match(/<div class="mr-steps">/g)||[]).length===3, hd[1]);
  const o=mk({done:{afternoon_0:true,afternoon_1:true,afternoon_2:true},rtOpen:{afternoon_lucy_thursday:true}});
  const h2=o.kcChoresHTML("lucy");
  ok("…opened by hand (rtOpen key true) it shows its rows again", /▾/.test(headers(h2)[1])&&(h2.match(/<div class="mr-steps">/g)||[]).length===4);
  const m=mk({done:{morning_0:true,morning_1:true},mrOpen:{lucy:false}});
  ok("Morning done and folded by toggleMorningStep → ▸, 2/2, no rows", (()=>{ const x=headers(m.kcChoresHTML("lucy"))[0]; return /▸/.test(x)&&/>2\/2</.test(x)&&/sl-check-row done/.test(x); })());
}

console.log("My Lists: still big, cleaning day still first");
{
  const c=mk(); const page=c.kcListsHTML("lucy"), rows=c.kcChoresHTML("lucy");
  ok("kcListsHTML wraps the rows in <div class=\"kc-big\">", /^<div class="kc-big">/.test(page)&&/<\/div>$/.test(page)&&page.indexOf(rows)>0);
  ok("the cleaning-day panel is the first thing inside the rows, before the Morning header", rows.indexOf('<div id="clean-panel">')>0&&rows.indexOf('<div id="clean-panel">')<rows.indexOf('<div class="sl-check-row')&&c.calls.some(x=>x[0]==="clean"&&x[1]==="lucy"&&x[2]==="2026-10-22"&&x[3]==="thursday"), rows.slice(0,200));
  const n=mk({clean:false}); ok("no cleaning day → no panel, Morning header first", !/clean-panel/.test(n.kcChoresHTML("lucy"))&&/^<div style="padding:12px 12px 0"[^>]*><div class="sl-check-row/.test(n.kcChoresHTML("lucy")));
  ok("the step rows are the same .mr-step rows the Schedule tab draws (the .kc-big sizing is CSS, not markup)", (rows.match(/<div class="mr-step( done)?"/g)||[]).length===8&&/toggleRtStep\('evening','lucy',1\)/.test(rows)&&/toggleMorningStep\('lucy',0\)/.test(rows));
  ok("the view still writes nothing of its own", !/db\.ref\(|\.set\(|\.update\(|\.remove\(/.test(fn("kcChoresHTML")+KC));
}

console.log("CSS: the Schedule tab's header shape, under .kc-big only");
{ const css=src.slice(0,src.indexOf("</style>"));
  ok("the KC_LISTS_HEADERS comment cites her 2026-10-23 ask", /\/\* KC_LISTS_HEADERS — her ask 2026-10-23/.test(css));
  ok("step rows sit indented under their header (margin-left 16–34px, the Schedule tab's is 34px)", /\.kc-big \.mr-steps\{margin-left:(1[6-9]|2[0-9]|3[0-4])px/.test(css));
  ok("a step's box is a size down from its header's (header 36–40px, step 28–34px) — like the Schedule tab's 24 vs 20", (()=>{ const hd=/\.kc-big \.sl-checkbox\{width:(\d+)px!important;height:\1px!important/.exec(css), st=/\.kc-big \.mr-step \.sl-checkbox\{width:(\d+)px!important;height:\1px!important/.exec(css); return hd&&st&&+hd[1]>=36&&+hd[1]<=40&&+st[1]>=28&&+st[1]<=34&&+st[1]<+hd[1]; })());
  ok("the ▾/▸ arrow (the header's third box, inline 14px) is 22–30px", /\.kc-big \.sl-check-row>div:nth-child\(3\)\{font-size:(2[2-9]|30)px!important/.test(css));
  ok("the n/N count (the only span in a header's name) reads as a pill: 14–17px, bold, its own colour", /\.kc-big \.sl-check-row \.sl-slot-name>span\{font-size:1[4-7]px;font-weight:800;color:#[0-9a-f]{6}!important;background:#[0-9a-f]{6};border-radius:999px/.test(css));
  const big=css.split("\n").filter(l=>/kc-big/.test(l));
  ok("every kc-big line is scoped under .kc-big (nothing leaks to the Schedule tab, the pop-up or Mom's Day)", big.length>0&&big.every(l=>/^\.kc-big /.test(l)||/^\/\* KC_LISTS/.test(l)), big.filter(l=>!/^\.kc-big /.test(l)));
  ok("the Schedule tab's base rules are exactly as before", /^\.sl-check-row\{display:flex;align-items:center;gap:12px;padding:11px 14px;background:var\(--bg\);border-radius:10px;margin-bottom:8px;cursor:pointer;border:1\.5px solid var\(--border\)\}$/m.test(css)&&/^\.sl-checkbox\{width:24px;height:24px;/m.test(css)&&/^\.sl-slot-name\{font-size:14px;font-weight:600\}$/m.test(css)&&/^\.mr-steps\{margin:-2px 0 8px 34px;display:flex;flex-direction:column;gap:6px\}$/m.test(css)&&/^\.mr-step\{display:flex;align-items:center;gap:10px;padding:8px 12px;/m.test(css));
  ok("the cleaning-day rows (two boxes, no name) are not caught: the arrow rule needs a third box, the pill rule a .sl-slot-name", (()=>{ const r=fn("hhCleanPanelHTML"); return /<div class="sl-check-row[^"]*"[^>]*><div class="sl-checkbox[^"]*">[^<]*<\/div>'\s*\+'<div style="flex:1;display:flex/.test(r)&&!/sl-slot-name/.test(r); })());
}
ok("no 🔀 anywhere", src.indexOf("🔀")<0);
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
