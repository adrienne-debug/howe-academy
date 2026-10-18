/*
 * 🧺 Laundry line step 2 — add buttons everywhere (her ask 2026-10-17: "add buttons to add to like the lineup and add to the one-time
 * list … anywhere there's not add buttons so that way I can customize"; "maybe its not bad to have an option to combine loads"; one-time
 * → the next open slot). ＋ Add a load · ✎ name/emoji/🔗 wash with/✕ · ☑️ one-time loads · ✎ every-few-weeks · 🧺 → Line.
 * run: node test_laundry_line_edit.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,400)+")":"")); } };
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("missing "+a); return src.slice(i,j); };
const LL=cut("// LAUNDRYLINE_START","// LAUNDRYLINE_END");
const iso=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
const MON="2026-10-19";
function mk(o){
  o=o||{}; const writes=[], ls={}, els={};
  const ctx={console,Object,Array,String,Number,parseInt,Math,JSON,Date,
    HA_LS:{getItem:k=>ls[k]||null,setItem:(k,v)=>{ ls[k]=v; }},
    db:{ref:p=>({update:v=>writes.push(["update",p,JSON.parse(JSON.stringify(v))]),set:v=>writes.push(["set",p,JSON.parse(JSON.stringify(v))])})},
    _lbWrite:()=>true, isMom:!o.noMom, momHere:()=>ctx.isMom, _kioskD:()=>!!o.dad, kitPinGate:()=>{ ctx.gated=true; }, gated:false, confirm:()=>true,
    document:{getElementById:id=>els[id]||null}, els, laundryData:{},
    calendarData:{holidays:{},vacations:{},kidOverrides:{}}, calNormDate:s=>s,
    hhJobs:()=>({j1:{label:"Mattress protectors on the king and the queen",emoji:"🛏️",who:"mom",hold:true}}),
    ROSTER:["lincoln","ellis","lucy","julian"], KID_NAME:{lincoln:"Lincoln",ellis:"Ellis",lucy:"Lucy",julian:"Julian"}, cap:s=>s.charAt(0).toUpperCase()+s.slice(1),
    _hhIsoLocal:ms=>iso(new Date(ms)), esc:s=>String(s==null?"":s), hhRender:()=>{}, mwToast:()=>{}, writes};
  vm.createContext(ctx); vm.runInContext(LL,ctx);
  vm.runInContext("llToday=function(){ return '"+(o.day||MON)+"'; }; llNowMin=function(){ return 600; };",ctx);
  if(o.line) vm.runInContext("laundryLine="+JSON.stringify(o.line)+";",ctx);
  ctx.get=e=>vm.runInContext(e,ctx); return ctx;
}
const caps=a=>({"0":a[0],"1":a[1],"2":a[2],"3":a[3],"4":a[4],"5":a[5],"6":a[6]});
const BASE={caps:caps([2,1,2,1,3,0,0]),asOf:MON,homeFrom:MON};
const W=(c,day,n)=>c.llProject(day,n||5,false).map(r=>r.loads.join("+")||"-").join(" | ");

console.log("1. ＋ Add a load");
{ const c=mk({line:BASE}); c.llAddToggle("load"); const h=c.llCardHTML();
  ok("the form: emoji, name, 📅 day, 👤 who, Add", /id="lla-label"/.test(h)&&/id="lla-home"/.test(h)&&/id="lla-doer"/.test(h)&&/llAddLoad\(\)/.test(h));
  Object.assign(c.els,{"lla-label":{value:"Rugs"},"lla-emoji":{value:"🧶"},"lla-home":{value:"5"},"lla-doer":{value:"ellis"}}); c.llAddLoad();
  const w=c.writes[0][2]; ok("Add: the six defaults + items/i_rugs {Rugs, 🧶, Sat, Ellis, order 6}", w["items/i_rugs"]&&w["items/i_rugs"].home===5&&w["items/i_rugs"].doer==="ellis"&&w["items/i_rugs"].order===6&&w["items/lincoln"], w);
  ok("it lays on Saturdays (with a Sat cap)", mk({line:Object.assign({},c.get("laundryLine"),{caps:caps([2,1,2,1,3,1,0])})}).llProject(MON,6,false)[5].loads.join()==="i_rugs");
  c.writes.length=0; c.els["lla-label"].value="  "; c.llAddLoad(); ok("no name: nothing", c.writes.length===0);
}
console.log("2. ✎ a load: rename, 🔗 wash with, ✕ remove");
{ const c=mk({line:BASE}); c.llEdToggle("julian"); const h=c.llCardHTML();
  ok("✎ opens: name, emoji, 🔗 Wash with (its own load / the other loads), ✕ Remove", /id="lle-label" value="Julian's clothes"/.test(h)&&/🔗 Wash with/.test(h)&&/<option value="lucy">Lucy's clothes/.test(h)&&/llRemove\('julian'\)/.test(h));
  Object.assign(c.els,{"lle-label":{value:"Julian's clothes"},"lle-emoji":{value:"👕"},"lle-with":{value:"lucy"}}); c.llEdSave("julian");
  ok("🔗 Julian with Lucy: written on Julian's item (first edit writes the six)", c.writes[0][2]["items/julian"].with==="lucy", c.writes[0][2]["items/julian"]);
  ok("Wednesday is ONE load now: Lucy (+ Julian) — and the Wed cap of 2 has room", c.llProject(MON,3,false)[2].loads.join()==="lucy", c.llProject(MON,3,false)[2].loads);
  ok("names read 'Lucy's clothes + Julian's clothes' / 'Lucy + Julian' on the grid", c.llLabelFull("lucy")==="Lucy's clothes + Julian's clothes"&&/>Lucy \+ Julian</.test(c.llWeekGridHTML(MON,false,true)));
  ok("Julian's row shows 🔗 with Lucy instead of a day; no ⏫ for him", /🔗 with Lucy/.test(c.llCardHTML())&&!/llBump\('julian'\)/.test(c.llCardHTML()));
  c.writes.length=0; c.llStart("lucy"); const set=c.writes.find(w=>w[0]==="set")[2], up=c.writes.find(w=>w[0]==="update")[2];
  ok("🫧 Start Lucy's: one load 'Lucy's clothes + Julian's clothes', both logged on it", set.label==="Lucy's clothes + Julian's clothes"&&up["log/"+MON+"/lucy"]&&up["log/"+MON+"/julian"]&&up["log/"+MON+"/julian"].with==="lucy", [set,up]);
  const lid=Object.keys(c.get("laundryData"))[0]; c.writes.length=0; c.llUnlog(lid,c.get("laundryData")[lid]);
  ok("✕ in the washer: both come back out", c.writes[0][2]["log/"+MON+"/lucy"]===null&&c.writes[0][2]["log/"+MON+"/julian"]===null, c.writes[0][2]);
  c.writes.length=0; c.llRemove("lucy"); const r=c.writes[0][2];
  ok("✕ Remove Lucy's: items/lucy = null, and Julian rides alone again", r["items/lucy"]===null&&r["items/julian/with"]===null&&!c.llWith("julian"), r);
  ok("…Julian's back on his own Wednesday", c.llProject(MON,3,false)[2].loads.join()==="julian");
}
console.log("3. ☑️ One-time loads — the next open slot");
{ const c=mk({line:BASE}); c.llAddToggle("once"); ok("＋ Add opens the one-time form", /id="llo-label"/.test(c.llCardHTML()));
  Object.assign(c.els,{"llo-label":{value:"Strip + wash both boys' beds"},"llo-emoji":{value:"🛏"}}); c.llOnceAdd();
  const w=c.writes[0][2], id=Object.keys(w).find(k=>/^once\//.test(k)); ok("written: once/o_… {label, from today}", id&&w[id].label==="Strip + wash both boys' beds"&&w[id].from===MON, w);
  ok("Monday has room (cap 2, Lincoln only — no sheets here): it goes there", c.llProject(MON,1,false)[0].loads.join()===("lincoln,"+id.slice(5)), c.llProject(MON,1,false)[0].loads);
  ok("…and the list says today", /☑️ One-time loads/.test(c.llCardHTML())&&/>today</.test(c.llCardHTML()));
  ok("only once — it's not on next Monday", c.llProject(MON,8,false)[7].loads.indexOf(id.slice(5))<0);
  const full=mk({line:Object.assign({},BASE,{caps:caps([1,1,2,1,3,0,0]),once:{o_x:{label:"Mattress protectors",from:MON}}})});
  ok("every day full Mon–Thu: nobody is bumped — it waits for Friday's spare room (cap 3: towels + it)", W(full,MON)==="lincoln | ellis | lucy+julian | momdad | towels+o_x", W(full,MON));
  const none=mk({line:Object.assign({},BASE,{caps:caps([1,1,2,1,1,0,0]),once:{o_x:{label:"Mattress protectors",from:MON}}})});
  ok("no spare room anywhere: it stays on the list, 'waiting for an open slot'", none.llProject(MON,28,false).every(r=>r.loads.indexOf("o_x")<0)&&/waiting for an open slot/.test(none.llCardHTML()));
  const rot=mk({line:Object.assign({},BASE,{mode:"rotate",caps:caps([1,1,1,1,1,0,0]),once:{o_x:{label:"Mattress protectors",from:MON}}})});
  ok("plain rotation: it waits its turn in line instead", rot.llProject(MON,14,false).some(r=>r.loads.indexOf("o_x")>=0));
  const done=mk({day:"2026-10-20",line:Object.assign({},BASE,{once:{o_x:{label:"Mattress protectors",from:MON}},log:{[MON]:{o_x:{at:1,load:"q"}}}})});
  ok("washed Monday: not laid again", done.llProject("2026-10-20",7,false).every(r=>r.loads.indexOf("o_x")<0));
  done.llRoll(); ok("the next day's roll clears it from the list (once/o_x = null)", done.writes[0][2]["once/o_x"]===null, done.writes[0][2]);
  const p=mk({line:BASE}); p.llFromOnce("j1"); const pw=p.writes[0][2], pk=Object.keys(pw).find(k=>/^once\//.test(k));
  ok("🧺 → Line on the old once pile: a one-time load with its name, emoji and who", pk&&pw[pk].label==="Mattress protectors on the king and the queen"&&pw[pk].emoji==="🛏️"&&pw[pk].doer==="mom", pw);
  ok("the once-pile row has the → Line button", /llFromOnce\(\\'/.test(src)||/llFromOnce\(/.test(src));
}
console.log("4. ✎ an every-few-weeks item");
{ const c=mk({line:Object.assign({},BASE,{extras:{x_m:{label:"Shower mats",emoji:"🧺",every:2,unit:"w",last:"2026-10-17",est:true}}})});
  c.llEdToggle("x_m"); const eh=c.llCardHTML();
  ok("✎ opens: name, emoji, every N days/weeks/months, last washed (blank — the estimate isn't a wash), next due 10/31", /id="llxe-last" type="date" value=""/.test(eh)&&/id="llxe-next" type="date" value="2026-10-31"/.test(eh)&&/id="llxe-every"[^>]*value="2"/.test(eh)&&/<option value="w" selected>weeks/.test(eh)&&/<option value="d"/.test(eh), eh.match(/llxe-[a-z]+"[^>]*>/g));
  c.els["llxe-every"]={value:"2"}; c.els["llxe-unit"]={value:"w"}; c.els["llxe-next"]={value:"2026-10-31"};
  Object.assign(c.els,{"llxe-label":{value:"Bath mats"},"llxe-emoji":{value:"🛁"},"llxe-last":{value:"2026-10-10"}}); c.llXEdSave("x_m");
  const w=c.writes[0][2]; ok("save: label, emoji, the real last washed (est cleared)", w["extras/x_m/label"]==="Bath mats"&&w["extras/x_m/emoji"]==="🛁"&&w["extras/x_m/last"]==="2026-10-10"&&w["extras/x_m/est"]===null, w);
  ok("…so it's due Oct 24 (2 weeks), shown as 'washed 10/10'", c.llDue(c.get("laundryLine.extras.x_m"))==="2026-10-24"&&/washed 10\/10/.test(c.llCardHTML()));
  c.writes.length=0; c.els["llxe-last"].value="2026-12-01"; c.els["llxe-next"].value=""; c.llEdToggle("x_m"); c.llXEdSave("x_m"); ok("a date in the future is ignored", c.writes.length===0);
}
console.log("4b. Every N days, and her own next-due date");
{ const c=mk({line:Object.assign({},BASE,{extras:{x_c:{label:"School room curtains",emoji:"🪟",every:6,unit:"m",last:"2026-10-16",est:true}}})});
  c.llEdToggle("x_c"); Object.assign(c.els,{"llxe-label":{value:"School room curtains"},"llxe-emoji":{value:"🪟"},"llxe-last":{value:""},"llxe-every":{value:"10"},"llxe-unit":{value:"d"},"llxe-next":{value:"2026-10-19"}}); c.llXEdSave("x_c");
  const w=c.writes[0][2]; ok("every 10 days, next due Mon 10/19 — unit, every, next written; the estimate untouched", w["extras/x_c/unit"]==="d"&&w["extras/x_c/every"]===10&&w["extras/x_c/next"]==="2026-10-19"&&!("extras/x_c/last" in w), w);
  ok("the row: every 10 days · due 10/19", /every 10 days · <b[^>]*>due now|every 10 days · <b[^>]*>due 10\/19/.test(c.llCardHTML()));
  ok("Monday has room (cap 2, Lincoln only here): it goes Monday", c.llProject(MON,1,false)[0].loads.join()==="lincoln,x_c", c.llProject(MON,1,false)[0].loads);
  ok("…next due 10 days after the wash (Thu 10/29) — Thursday is full, so it takes Friday's open room (10/30)", c.llProject(MON,12,false).findIndex((r,i)=>i>0&&r.loads.indexOf("x_c")>=0)===11, c.llProject(MON,12,false).map(r=>r.loads.join("+")));
  c.llStart("x_c"); const up=c.writes.find(x=>x[0]==="update"&&x[2]["log/"+MON+"/x_c"])[2]; ok("washing it uses up her date (next = null), kept for ✕", up["extras/x_c/next"]===null&&up["log/"+MON+"/x_c"].prevNext==="2026-10-19", up);
  const t=mk(); ok("days / weeks / months math", t.llAddEvery(MON,{every:10,unit:"d"})==="2026-10-29"&&t.llEveryTxt(t.llEvery({every:1,unit:"d"}))==="every 1 day"&&t.llEvery({every:400,unit:"d"}).n===14);
}
console.log("4c. Open room only (her pick 2026-10-18) — a due item never bumps a weekly load");
{ const full=mk({line:Object.assign({},BASE,{caps:caps([1,1,2,1,1,0,0]),extras:{x_m:{label:"Shower mats",every:2,unit:"w",last:"2026-10-05"}}})});
  ok("due Mon 10/19 but every day is full: no weekly load moves, the mats wait", full.llProject(MON,5,false).map(r=>r.loads.join("+")).join(" | ")==="lincoln | ellis | lucy+julian | momdad | towels", full.llProject(MON,5,false).map(r=>r.loads.join("+")));
  ok("…and the list says 'due now — next open room'", /due now — next open room/.test(full.llCardHTML()));
  const sat=mk({line:Object.assign({},BASE,{caps:caps([1,1,2,1,1,1,0]),extras:{x_m:{label:"Shower mats",every:2,unit:"w",last:"2026-10-05"}}})});
  ok("give Saturday a cap of 1: the mats go Saturday", sat.llProject(MON,6,false)[5].loads.join()==="x_m", sat.llProject(MON,6,false).map(r=>r.loads.join("+")));
  const rot=mk({line:Object.assign({},BASE,{mode:"rotate",caps:caps([1,1,1,1,1,0,0]),extras:{x_m:{label:"Shower mats",every:2,unit:"w",last:"2026-10-05"}}})});
  ok("plain rotation keeps taking a slot (unchanged)", rot.llProject(MON,1,false)[0].loads.join()==="x_m");
}
console.log("4d. 👤 Mom or Dad (her ask 2026-10-18)");
{ const c=mk({line:Object.assign({},BASE,{items:{towels:{label:"Towels",emoji:"🛁",order:0,home:0}}})});
  ok("the 👤 chip goes Mom → Dad → Mom or Dad → the kids", c.llDoerChoices().join()==="mom,dad,both,lincoln,ellis,lucy,julian");
  c.llDoerNext("towels"); c.llDoerNext("towels"); ok("two taps from Mom: items/towels/doer = both, reads Mom or Dad", c.writes[1][2]["items/towels/doer"]==="both"&&/👤 Mom or Dad/.test(c.llCardHTML()), c.writes);
  ok("the Today's line button on either strip says · Mom or Dad", /Towels · Mom or Dad/.test(c.llStripHTML(""))&&/Towels · Mom or Dad/.test(c.llStripHTML("dad")));
  c.get("laundryLine.momSick={'"+MON+"':true}"); ok("🤒 Mom's sick: a Mom or Dad load asks nobody", c.llCoverAskHTML()==="");
  c.llAddToggle("load"); ok("＋ Add a load offers Mom or Dad too", /<option value="both">Mom or Dad/.test(c.llCardHTML()));
}
console.log("4e. Start a load box: 🫧 Start now or ☑️ Add to the line (her pick 2026-10-18)");
{ const c=mk({line:BASE}); c.els["laundry-label"]={value:"Couch cushions"}; c.llOnceFromBox("mom");
  const w=c.writes[0][2], k=Object.keys(w).find(x=>/^once\//.test(x));
  ok("☑️ Add to the line: the typed load becomes a one-time load, Mom's, the box cleared", k&&w[k].label==="Couch cushions"&&w[k].doer==="mom"&&w[k].from===MON&&c.els["laundry-label"].value==="", w);
  const d=mk({noMom:true,dad:true,line:BASE}); d.els["laundry-label"]={value:"Rugs"}; d.llOnceFromBox("dad"); const dw=d.writes[0]&&d.writes[0][2];
  ok("from Dad's Day: his, no PIN", !d.gated&&dw&&Object.values(dw).some(v=>v&&v.label==="Rugs"&&v.doer==="dad"), dw);
  const e=mk({line:BASE}); e.els["laundry-label"]={value:"  "}; e.llOnceFromBox("mom"); ok("nothing typed: nothing written", e.writes.length===0);
  const q=mk({line:BASE}); q.get("qlAll=function(){ return {rug:{label:'Rug',steps:[{k:'custom',n:'Soak',m:20},{k:'wash'}]}}; }; lcClean=function(st){ return st; };");
  q.els["laundry-label"]={value:"Bath mats"}; q.els["laundry-cycle"]={value:"rug"}; q.llOnceFromBox("mom"); const qw=q.writes[0][2], qk=Object.keys(qw).find(x=>/^once\//.test(x));
  ok("with 'Like: Rug' picked, the one-time load carries the Rug's steps", qk&&qw[qk].cycle&&qw[qk].cycle[0].n==="Soak", qw);
  ok("the box shows 🫧 Start now + ☑️ Add to the line once the line is set up — and stays exactly as before without one", /🫧 Start now/.test(src)&&/llOnceFromBox\(/.test(src)&&/no line set up: the box exactly as before/.test(src));
}
console.log("5. Mom only");
{ const k=mk({noMom:true,line:BASE}); const h=k.llCardHTML();
  ok("a kid's device: no ＋, no ✎", !/llAddToggle|llEdToggle/.test(h)); k.llAddToggle("load"); k.llOnceAdd("x","🧺"); ok("…and nothing written", k.gated&&k.writes.length===0); }
ok("no 🔀", src.indexOf("🔀")<0);
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
