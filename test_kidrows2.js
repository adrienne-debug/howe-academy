/*
 * 🧒 KIDROWS2 (her asks 2026-10-22, for herself and Sara):
 *   (1) ✕ today on EVERY item in a kid row's 🌅 ☀️ 🧹 🌙 pop-up — the same rtWave the 📋 lists panel used (waved/<wk>/<day>/<kid>/
 *       <slot>step<i> + its routineLog line, targeted, a second tap undoes); the 📋 lists pill + panel are gone.
 *   (2) The 📅 school pill (the row's own school schedule) is gone; the tasks data and Mom's Day ▸ Schedule are untouched.
 *   (3) Kids' Corner: the "Not <name>?" button becomes the OTHER kids as buttons in their colours; a tap is kcPick (the picker's own
 *       tap); the "Who's here?" picker still draws with no kid chosen; a one-kid roster draws no buttons.
 *                                                                                                  run: node test_kidrows2.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,400)+")":"")); } };
const fn=name=>{ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); let d=0; for(let k=src.indexOf("{",i);k<src.length;k++){ if(src[k]==="{") d++; else if(src[k]==="}"&&--d===0) return src.slice(i,k+1); } throw new Error("unbalanced "+name); };
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("missing "+a); return src.slice(i,j+b.length); };
const BLOCK=cut("// KIDROWS2_START","// KIDROWS2_END"), WAVE=cut("// WAVE_START","// WAVE_END");

console.log("0. The block");
ok("marked, right after the Mom's Day kid-rows block", src.indexOf("// KIDROWS2_START")>src.indexOf("// KIDBAR_END")&&src.indexOf("// KIDROWS2_START")-src.indexOf("// KIDBAR_END")<40);
ok("it writes nothing of its own (no db.ref / set / update / remove / push)", !/db\.ref\(|\.(set|update|remove|push)\(/.test(BLOCK));
ok("no 🔀", src.indexOf("🔀")<0);

// ── (1) the pop-up: Lucy's Saturday — morning Brush teeth (done); afternoon Pickup kitchen (open) + Shower (done) + Sweep (waved) ──
function popWorld(o){
  o=o||{}; const writes=[], calls=[], html=[], ls={};
  const steps={morning:{lucy:[{label:"Brush teeth",cad:"daily"},{label:"Vitamins",cad:"daily"}]},
    afternoon:{lucy:[{emoji:"🍽️",label:"Pickup kitchen",cad:"daily",pts:20},{emoji:"🚿",label:"Shower",cad:"daily",pts:2},{emoji:"🧹",label:"Sweep",cad:"daily",pts:5}]},chores:{lucy:[]},evening:{lucy:[]}};
  const ctx={console,Object,Array,String,Number,parseInt,isNaN,Math,JSON,Date,RegExp,Error,
    momHere:()=>!!o.mom, dadAwardOk:()=>!!o.dadOpen, ROSTER:["lincoln","ellis","lucy","julian"], SL_SLOTS:["morning","afternoon","chores","evening"], RT_ABBR:{afternoon:"a",chores:"c",evening:"e"},
    day:"saturday", _todayDay:"saturday", activeWk:()=>"week28", WK:"week28", slState:{week28_saturday_lucy_astep1:{done:true,ts:"4:10 PM"},week28_saturday_lucy_mstep0:{done:true,ts:"7:30 AM"}},
    morningStepsFor:k=>steps.morning[k]||[], mStepDoneOn:(k,d,i)=>i===0, rtStepsFor:(sl,k)=>steps[sl][k]||[], cadDueOn:()=>true, rtDoneOn:(sl,k,d,i)=>sl==="afternoon"&&i===1, stepWindowOk:()=>true,
    getActiveTasks:()=>[], effectiveDay:t=>t.day, checked:{}, getKidDayPoints:()=>0, getPointClaim:()=>null, bank:{}, routineLog:{}, nowTs:()=>"2:10 PM Oct 24",
    HA_LS:{getItem:k=>(k in ls)?ls[k]:null,setItem:(k,v)=>{ ls[k]=v; }}, db:{ref:p=>({set:v=>writes.push(["set",p,JSON.parse(JSON.stringify(v))]),remove:()=>writes.push(["rm",p])})},
    cap:s=>s.charAt(0).toUpperCase()+s.slice(1), esc:s=>String(s), tab:"moms-plan",
    document:{getElementById:id=>id==="content"?{}:null,body:{insertAdjacentHTML:(w,h)=>html.push(h)}},
    renderMomsPlan:()=>calls.push("render"), renderAll:()=>calls.push("renderAll"), toggleRtStep:(sl,k,i)=>calls.push(["rt",sl,k,i]), toggleMorningStep:(k,i)=>calls.push(["mr",k,i]), writes, calls, html};
  vm.createContext(ctx);
  // the real WAVE block (rtWave / rtWaved / morningDueIdx's partner), the real pop-up, the real kid tick, the new block
  vm.runInContext(WAVE+"\n"+fn("morningDueIdx")+"\n"+fn("rtDueOrLate")+"\n"+fn("rtLateDays")+"\n"+fn("boardStatPopClose")+"\n"+fn("boardStatPop")+"\n"+fn("mdKidTick")+"\n"+BLOCK,ctx);
  ctx.get=e=>vm.runInContext(e,ctx);
  ctx.pop=slot=>{ html.length=0; vm.runInContext("boardStatPop('lucy','"+slot+"','saturday')",ctx); return html[html.length-1]||""; };
  ctx.rowOf=(h,label)=>{ const rows=h.split('<div style="display:flex;align-items:center;gap:8px;padding:6px 2px;border-bottom:1px solid #f3f4f6;font-size:13px').slice(1); return rows.find(r=>r.indexOf(label)>=0)||""; };
  return ctx;
}
const waveRe=(slot,i)=>new RegExp('onclick="event\\.stopPropagation\\(\\);rtWave\\(\''+slot+'\',\'lucy\',\'saturday\','+i+'\\);boardStatPop\\(\'lucy\',\''+slot+'\',\'saturday\'\\)"[^>]*>✕ today<');

console.log("1. ✕ today on each item in the pop-up (Mom)");
{ const c=popWorld({mom:true}); const h=c.pop("afternoon");
  ok("Pickup kitchen (open): its own ✕ today → rtWave(afternoon, lucy, saturday, 0), then the pop-up redraws", waveRe("afternoon",0).test(c.rowOf(h,"Pickup kitchen")));
  ok("Sweep (open): its own ✕ today with ITS index (2)", waveRe("afternoon",2).test(c.rowOf(h,"Sweep")));
  ok("Shower (done): ✅ tap kept, no ✕ today", /✅/.test(c.rowOf(h,"Shower"))&&!/rtWave/.test(c.rowOf(h,"Shower")));
  ok("the ○ tick on an open row still works as before (mdKidTick)", /mdKidTick\('afternoon','lucy','saturday',0\);boardStatPop\('lucy','afternoon','saturday'\)"[^>]*>○</.test(c.rowOf(h,"Pickup kitchen")));
  ok("header count unchanged: 1/3", /\(1\/3\)/.test(h));
  const m=c.pop("morning");
  ok("🌅 morning rows too: Vitamins (open) gets ✕ today with index 1; Brush teeth (done) does not", waveRe("morning",1).test(c.rowOf(m,"Vitamins"))&&!/rtWave/.test(c.rowOf(m,"Brush teeth")));
  ok("📅 school work and ⭐ stars pop-ups carry no ✕ today", !/rtWave/.test(c.pop("tasks"))&&!/rtWave/.test(c.pop("stars")));
}
console.log("2. The tap: the shared writer, that item's key — and undo");
{ const c=popWorld({mom:true});
  vm.runInContext("rtWave('afternoon','lucy','saturday',2)",c);
  ok("two targeted writes, keyed by the item: waved/week28/saturday/lucy/afternoonstep2 + its routineLog line (0 ⭐, act wave, by mom)", c.writes.length===2&&c.writes[0][0]==="set"&&c.writes[0][1]==="waved/week28/saturday/lucy/afternoonstep2"&&c.writes[0][2].by==="mom"&&c.writes[1][1]==="routineLog/lucy/week28/saturday/wave_afternoonstep2"&&c.writes[1][2].act==="wave"&&c.writes[1][2].pts===0, c.writes);
  ok("the page repaints", c.calls.indexOf("render")>=0);
  const h=c.pop("afternoon"); const r=c.rowOf(h,"Sweep");
  ok("the waved row stays on the list: greyed, struck through, – mark, no tick", /opacity:\.55/.test(r)&&/line-through/.test(r)&&/>–</.test(r)&&!/mdKidTick/.test(r));
  ok("…with undo in place of ✕ today (same rtWave, same key)", /rtWave\('afternoon','lucy','saturday',2\);boardStatPop\('lucy','afternoon','saturday'\)"[^>]*>undo</.test(r));
  ok("the count leaves a waved item out, like the pill does: 1/2", /\(1\/2\)/.test(h));
  ok("the other rows are untouched (Pickup kitchen still ✕ today, Shower still ✅)", waveRe("afternoon",0).test(c.rowOf(h,"Pickup kitchen"))&&/✅/.test(c.rowOf(h,"Shower")));
  c.writes.length=0; vm.runInContext("rtWave('afternoon','lucy','saturday',2)",c);
  ok("undo: the same two paths removed; the row is open again", c.writes.length===2&&c.writes.every(w=>w[0]==="rm")&&c.writes[0][1]==="waved/week28/saturday/lucy/afternoonstep2"&&waveRe("afternoon",2).test(c.rowOf(c.pop("afternoon"),"Sweep")), c.writes);
  vm.runInContext("rtWave('morning','lucy','saturday',1)",c); const m=c.pop("morning");
  ok("a waved morning step stays on the 🌅 pop-up greyed with undo (it leaves the due list, so it used to vanish)", /line-through/.test(c.rowOf(m,"Vitamins"))&&/>undo</.test(c.rowOf(m,"Vitamins"))&&/\(1\/1\)/.test(m));
}
console.log("3. Who may: Mom, an unlocked Dad; a locked Dad sees no ✕");
{ const d=popWorld({dadOpen:true}); ok("Dad unlocked: ✕ today on the open rows", waveRe("afternoon",0).test(d.pop("afternoon")));
  const l=popWorld({}); const h=l.pop("afternoon");
  ok("locked: rows draw, no ✕ today, no tick", /Pickup kitchen/.test(h)&&!/rtWave/.test(h)&&!/mdKidTick/.test(h));
  vm.runInContext("rtWave('afternoon','lucy','saturday',0)",l); ok("…and rtWave itself refuses (nothing written)", l.writes.length===0);
}
console.log("4. The list-level section is gone");
{ const KT=fn("mdCardKidsToday");
  ok("no 📋 lists pill, no panel call in the kid rows", !/mpKidListsToggle|mdKidListsHTML|mpKidOpen|📋 lists</.test(KT));
  ok("the panel's code left with it (mdKidListsHTML, mpKidListsToggle, mpKidOpen)", !/function mdKidListsHTML\(|function mpKidListsToggle\(|let mpKidOpen=/.test(src));
  ok("rtWave / rtWaved / the kid's greyed row are untouched (the kids' lists and the 8 PM sweep still read the same record)", /function rtWave\(slot,kid,d,i\)\{/.test(WAVE)&&/function rtWaved\(/.test(WAVE)&&/function rtWavedRowHTML\(/.test(WAVE)&&/db\.ref\("waved\/"\+wk\+"\/"\+d\+"\/"\+kid\+"\/"\+key\)\.set\(rec\)/.test(WAVE));
}

// ── (2) the 📅 school pill ──
console.log("5. The school-schedule section is gone from the kid rows");
{ const KT=fn("mdCardKidsToday");
  ok("no 📅 pill, no _boardTaskCounts read, no 'tasks' pop-up opened from the row", !/seg\("📅"/.test(KT)&&!/_boardTaskCounts\(/.test(KT)&&!/'tasks'|"tasks"/.test(KT.replace(/\/\/[^\n]*/g,"")));
  ok("the other pills stay: 🌅 ☀️ 🧹 🌙 and the ⭐ / tech switch", /seg\("🌅"/.test(KT)&&/seg\("☀️"/.test(KT)&&/seg\("🧹"/.test(KT)&&/seg\("🌙"/.test(KT)&&/techToggle\(/.test(KT)&&/mpBankAsk\(/.test(KT));
  ok("the data and the Schedule view are untouched: _boardTaskCounts, the tasks pop-up branch (the Board uses it) and Mom's Day ▸ Schedule (momSchedView) still exist", /function _boardTaskCounts\(/.test(src)&&/slot==="tasks"\)\{ title="📅 School work"/.test(fn("boardStatPop"))&&/var momSchedView=false/.test(src)&&/if\(momSchedView\|\|tab!=="moms-plan"\)\{ showTab\("moms-plan"\)/.test(fn("mpGoto")));
  ok("both callers still hand in isSchoolDay (the signature is unchanged)", /mdCardKidsToday\(today,isSchoolDay,true\)/.test(src)&&/mdCardKidsToday\(today,true,true,_dadAward\)/.test(src));
}

// ── (3) Kids' Corner ──
function kcWorld(o){
  o=o||{}; const calls=[], ls={};
  const ctx={console,Object,Array,String,Number,parseInt,isNaN,Math,JSON,Date,RegExp,Error,
    ROSTER:o.roster||["taylor","makenzie","andrew","caleb"], KID_NAME:{taylor:"Taylor",makenzie:"Kenzie",andrew:"Andrew",caleb:"Caleb"}, KID_COLOR:{taylor:"#e11d48",makenzie:"#2563eb",andrew:"#16a34a",caleb:"#d97706"},
    HA_LS:{getItem:k=>(k in ls)?ls[k]:null,setItem:(k,v)=>{ ls[k]=String(v); }}, window:{scrollTo:()=>{}},
    kcKid:o.kcKid===undefined?"taylor":o.kcKid, calDaySel:1, kcAddIso:"x", kcConfirmDel:"y", kcView:"bank",
    kcCalToggleHTML:()=>"TOGGLE", kcModeBodyHTML:()=>"BODY", kcCalGet:()=>"today", kcEmoji:()=>"🦄", _kcTint:()=>"#eee", kcLittle:()=>false,
    cap:s=>s.charAt(0).toUpperCase()+s.slice(1), esc:s=>String(s), renderAll:()=>calls.push("render"), calls, ls};
  vm.createContext(ctx);
  vm.runInContext("let kcStudyKid=null;\n"+fn("_kcLoadKid")+"\n"+fn("kcPick")+"\n"+fn("renderKidsCorner")+"\n"+BLOCK,ctx);
  ctx.get=e=>vm.runInContext(e,ctx); ctx.draw=()=>{ const el={innerHTML:""}; vm.runInContext("renderKidsCorner",ctx)(el); return el.innerHTML; }; return ctx;
}
console.log("6. Kids' Corner: the other kids as buttons, one tap switches");
{ const c=kcWorld(); const h=c.draw();
  const btns=h.match(/<button onclick="kcPick\('\w+'\)"[^>]*>[^<]*<\/button>/g)||[];
  ok("Taylor's Corner shows the OTHER three as buttons, roster order, not herself", btns.length===3&&/kcPick\('makenzie'\)/.test(btns[0])&&/kcPick\('andrew'\)/.test(btns[1])&&/kcPick\('caleb'\)/.test(btns[2])&&!/kcPick\('taylor'\)/.test(h), btns);
  ok("each in that kid's colour with their name", /background:#2563eb;[^>]*>Kenzie</.test(btns[0])&&/background:#16a34a;[^>]*>Andrew</.test(btns[1])&&/background:#d97706;[^>]*>Caleb</.test(btns[2]));
  ok("on the right of the header (after the name, inside the header strip)", h.indexOf("kc-others")>h.indexOf("Taylor’s Corner")&&h.indexOf("kc-others")<h.indexOf("TOGGLE"));
  ok("the 'Not Taylor?' line is gone", !/Not Taylor\?/.test(h)&&!/kcPick\(''\)/.test(h));
  vm.runInContext("kcPick('andrew')",c);
  ok("a tap sets kcKid, remembers it on the device, resets the day/add/confirm state and re-renders — exactly the picker's own tap", c.get("kcKid")==="andrew"&&c.ls.ha_kc_kid==="andrew"&&c.get("calDaySel")===null&&c.get("kcAddIso")===null&&c.get("kcView")==="cal"&&c.calls.indexOf("render")>=0);
  const h2=c.draw(); ok("…and Andrew's Corner now offers Taylor, Kenzie, Caleb", /kcPick\('taylor'\)/.test(h2)&&/kcPick\('makenzie'\)/.test(h2)&&/kcPick\('caleb'\)/.test(h2)&&!/kcPick\('andrew'\)/.test(h2));
  ok("a name is escaped through esc", /esc\(KID_NAME\[o\]\|\|cap\(o\)\)/.test(BLOCK));
}
{ const p=kcWorld({kcKid:""}); const h=p.draw();
  ok("no kid chosen on the device → the 'Who's here?' picker still draws, every kid a tile", /Who’s here\?/.test(h)&&(h.match(/class="kc-tile"/g)||[]).length===4&&!/kc-others/.test(h));
  ok("kcPick('') still clears the kid (the picker's own path is untouched)", (()=>{ const c=kcWorld(); vm.runInContext("kcPick('')",c); return c.get("kcKid")===""; })());
}
{ const one=kcWorld({roster:["taylor"]}); const h=one.draw();
  ok("one kid in the roster → no buttons at all", !/kc-others/.test(h)&&!/kcPick\(/.test(h));
}
ok("Kids' Corner guards the helper (a family copy without the block still draws)", /\(typeof kcOtherKidsHTML==="function"\)\?kcOtherKidsHTML\(k\):''/.test(fn("renderKidsCorner")));

console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
