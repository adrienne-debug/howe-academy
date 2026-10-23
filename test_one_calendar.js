/*
 * 🗓 ONE CALENDAR (her design 2026-10-23, doc "One Calendar"): Mom's Day ▸ Schedule ▸ Month is THE calendar.
 *   · the day sheet (Mom lens): ✎ on a holiday / vacation row and a co-op row, 🗑 on a cleaning day, the span beside a break,
 *     "＋ Add to this day" → six choices; each lands in the EXISTING form / function with the tapped day filled in
 *   · the six lists under the grid: <details> folded shut, the count in the summary, past rows under "Past · N"
 *   · the school-day line comes from the family's dated lessons (never a typed-in date); 🖨 Print on the Mom lens only
 *   · a kid lens (Kids' Corner, a kid's device) is byte-identical to before; the Admin page and its HQ row are gone
 *   · every write is a pre-existing targeted one: calendar/holidays|vacations/<id>, cleaningDays/<iso>, events/<id>,
 *     coops/<id>, kidOverrides/<kid>/<date>
 *   run:  node test_one_calendar.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm"), cp=require("child_process");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let oldSrc=null; try{ oldSrc=cp.execSync("git show origin/main:index.html",{cwd:__dirname,encoding:"utf8",maxBuffer:64*1024*1024,stdio:["ignore","pipe","ignore"]}); }catch(e){}
let pass=0, fail=0;
const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,400)+")":"")); } };
const fnIn=(s,name)=>{ const i=s.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); let d=0; for(let k=s.indexOf("{",i);k<s.length;k++){ if(s[k]==="{") d++; else if(s[k]==="}"&&--d===0) return s.slice(i,k+1); } throw new Error("unbalanced "+name); };
const fn=name=>fnIn(src,name);
const line=start=>{ const i=src.indexOf(start); if(i<0) throw new Error("missing "+start); return src.slice(i,src.indexOf("\n",i)+1); };
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("missing "+a); return src.slice(i,j+b.length); };
const TODAY="2026-10-23";
const FIX=()=>({
  holidays:{thx:{name:"Thanksgiving",start:"2026-11-23",end:"2026-11-27",pause:"school"},labor:{name:"Labor Day",start:"2026-09-07",end:"2026-09-07",pause:"all"}},
  vacations:{beach:{name:"Beach Trip",start:"2026-12-20",end:"2026-12-31",pause:"all"}},
  cleaningDays:{"2026-11-14":{at:1,by:"mom"}},
  events:{ev1:{title:"Dentist",emoji:"🦷",date:"2026-11-24",time:"2:00 PM",who:"lucy"},ev0:{title:"Old party",emoji:"🎉",date:"2026-09-01",who:"family"}},
  coops:{coop_a:{name:"Tuesday Co-op",color:"#7c3aed",kids:["lucy","ellis"],mode:"timed",start:"9:00 AM",end:"12:00 PM",dates:["2026-11-10","2026-11-24"],noMomBase:true},
         coop_b:{name:"Art Class",color:"#0ea5e9",kids:["lincoln"],mode:"fullDay",dates:["2026-09-15"]}},
  kidOverrides:{lucy:{"2026-11-30":{school:false,note:"Orthodontist"}},lincoln:{"2026-09-10":{school:true,note:""}}}
});
const LESSONS={lincoln:{"1":{date:"2026-08-17",week:"Week 1",math:"p. 1"},"2":{date:"2027-05-21",week:"Week 36",math:"p. 300"}},lucy:{"1":{date:"2026-09-01",week:"Week 3",reading:"ch 1"}}};
// the real code under test, from this index.html (or, for the byte-identical check, from origin/main)
function code(s){
  const F=n=>fnIn(s,n);
  const l=start=>{ const i=s.indexOf(start); return s.slice(i,s.indexOf("\n",i)+1); };
  const parts=[l("let calAddMode="),l("let calPrefillDate="),l("let calEditId="),l("let calOverrideKid="),l("let calPreviewMonth="),l("let calDaySel="),l("const CAL_LAYERS="),l("const CAL_OPTIN="),l("let calLayers="),
    l("const BREAK_PAUSE_LBL="),"let coopEditId=null, coopForm=null; let coopScanStatus=''; const COOP_COLORS=['#7c3aed','#0ea5e9']; let kcAddIso=null, kcConfirmDel=null; let mpSchWho='mom';",
    F("_calLayersLoad"),F("calLayerOn"),F("calLayerToggle"),F("calBreaksOn"),F("_calCoopsFor"),F("coopsOnDate"),F("_coopHasDate"),F("coopsMap"),F("calEventsOn"),F("calEvents"),F("calFmtDate"),F("calFmtRange"),F("calGenId"),F("getSchoolDays"),
    F("calDaySheetHTML"),F("calRenderMonthPreview"),F("calRenderAddForm"),F("calRenderOverrideForm"),F("calRenderEventForm"),F("breakLaundryOn"),F("calLaundryFollow"),F("calStartAdd"),F("calStartAddOverride"),F("calCancelAdd"),F("calEditHoliday"),F("calEditVacation"),F("calSave"),F("calDayClick"),F("calDayAddEvent"),F("calEditEvent"),F("calSaveEvent"),F("calSaveOverride"),
    F("coopStartAdd"),F("coopStartEdit"),F("coopCancel"),F("coopSave"),F("renderCoopForm"),F("_coop24"),F("toMin"),F("to12h"),F("hhCleanDay"),F("_hhIsoOk"),F("hhCleanDayToggle"),F("_hhWrite"),F("lmCalData"),F("kcLittle")];
  if(s.indexOf("// ONECAL_START")>=0){ const i=s.indexOf("// ONECAL_START"), j=s.indexOf("// ONECAL_END"); parts.push(s.slice(i,j)); parts.push(F("mpSchBody")); }
  return parts.join("\n");
}
const NEW=code(src), OLD=oldSrc?code(oldSrc):null;
function world(o){
  o=o||{}; const store={}, dom=o.dom||{}, writes=[], removes=[], toasts=[], relays=[];
  const ctx={console,Object,Array,String,Number,parseInt,isNaN,Math,JSON,Date,RegExp,Error,Set,Promise,setTimeout:()=>0,
    writes,removes,toasts,relays,store,dom,renders:0,
    momHere:()=>!!o.mom, wbMomEyes:()=>!!o.mom, kitEatGate:()=>!!(o.mom||o.dad), _dryRun:()=>false, mpGoto:()=>{}, momModeActive:false, adminPinUnlocked:false,
    HA_LS:{getItem:k=>(k in store?store[k]:null),setItem:(k,v)=>{ store[k]=String(v); }},
    db:{ref:p=>({set:v=>writes.push([p,JSON.parse(JSON.stringify(v))]),remove:()=>removes.push(p)})},
    renderAll:function(){ ctx.renders++; }, confirm:()=>true, alert:m=>toasts.push("alert:"+m), gwShowToast:m=>toasts.push(m), mwToast:m=>toasts.push(m),
    document:{getElementById:id=>(id in dom)?{value:dom[id],focus(){}}:null,querySelector:()=>null,querySelectorAll:()=>[]},
    ROSTER:["lincoln","ellis","lucy","julian"], SCHOOL_KIDS:["lincoln","ellis","lucy"], KID_NAME:{lincoln:"Lincoln",ellis:"Ellis",lucy:"Lucy",julian:"Julian"},
    KID_COLOR:{lincoln:"#111",ellis:"#222",lucy:"#333",julian:"#444"}, SL_KLBL:{lincoln:"Lincoln",ellis:"Ellis",lucy:"Lucy",julian:"Julian"}, SL_KCOL:{lincoln:"#111",ellis:"#222",lucy:"#333",julian:"#444"},
    esc:s=>String(s==null?"":s), cap:s=>s.charAt(0).toUpperCase()+s.slice(1), kcEmoji:()=>"🌟", calToday:()=>TODAY, _todayStr:()=>TODAY, calNormDate:d=>d,
    calendarData:o.cal||FIX(), currData:{lessons:o.lessons===undefined?LESSONS:o.lessons,weekDays:{},subjects:{}},
    _calDinnerOf:()=>null, _calDadChoresFor:()=>[], _calLessonsFor:()=>[], _calHabitsDone:()=>null, _calRoadmapFor:()=>[], _calChoresFor:()=>[], _calSlotRows:()=>({html:"",n:0}),
    cwdRelayKids:(k,w)=>{ relays.push([k.slice(),w]); return []; }, mpSchModeGet:()=>"month", mpSchWeekHTML:()=>"", calNavMonth:()=>{}, calLayerOptIn:()=>false,
  };
  vm.createContext(ctx); vm.runInContext(o.old?OLD:NEW,ctx);
  ctx.run=e=>vm.runInContext(e,ctx); ctx.run("calPreviewMonth='2026-11'");
  return ctx;
}
const L={breaks:true,coops:true,events:true,meals:false,dad:false,school:false,habits:false};
const sheet=(w,iso,who)=>w.calDaySheetHTML(iso,L,null,who||null,{});

console.log("1. The day sheet — Mom lens");
{ const w=world({mom:true}); const h=sheet(w,"2026-11-24");
  ok("the holiday row has its ✎ (calEditHoliday) and shows the span: Thanksgiving · Nov 23 – 27", /onecalS\(\);calEditHoliday\('thx'\)/.test(h)&&/Thanksgiving <span style="color:#6b7280">· Nov 23 – 27<\/span>/.test(h), h.slice(0,600));
  ok("the co-op row has its ✎ (coopStartEdit)", /onecalS\(\);coopStartEdit\('coop_a'\)/.test(h));
  ok("the event row keeps its own ✎", /calEditEvent\('ev1'\)/.test(h));
  ok("the bottom button is ＋ Add to this day (no plain Add event)", /onecalMenu\('2026-11-24'\)">＋ Add to this day</.test(h)&&!/calDayAddEvent\('2026-11-24'\)">＋ Add event/.test(h));
  w.onecalMenu("2026-11-24"); const m=sheet(w,"2026-11-24");
  ok("tap → the six choices: family event, holiday, vacation, cleaning day, co-op date, kid off / school on", ["event","holiday","vacation","cleaning","coop","override"].every(k=>new RegExp("onecalAdd\\('"+k+"','2026-11-24'").test(m))&&/Never mind/.test(m), m.slice(-900));
  const c=sheet(w,"2026-11-14"); ok("a cleaning day row gets 🗑 → hhCleanDayToggle; its own menu offers no second cleaning day", /hhCleanDayToggle\('2026-11-14'\)/.test(c)&&(w.onecalMenu("2026-11-14"),!/onecalAdd\('cleaning'/.test(sheet(w,"2026-11-14"))));
  const v=sheet(w,"2026-12-22"); ok("a vacation row: ✎ calEditVacation and 'Beach Trip · Dec 20 – 31'", /calEditVacation\('beach'\)/.test(v)&&/Beach Trip <span style="color:#6b7280">· Dec 20 – 31<\/span>/.test(v));
  ok("one-day span reads as one day", w.onecalSpanTxt("2026-09-07","2026-09-07")==="Sep 7"&&w.onecalSpanTxt("2026-11-30","2026-12-02")==="Nov 30 – Dec 2");
}
console.log("2. From the sheet into the existing forms and writes");
{ const w=world({mom:true,dom:{"cal-add-name":"Fair day","cal-add-start":"2026-11-24","cal-add-end":"2026-11-24","cal-add-pause":"school","cal-add-laundry":"on"}});
  w.onecalAdd("holiday","2026-11-24");
  const f=w.calRenderAddForm("holiday");
  ok("Holiday: calAddMode holiday, start AND end prefilled with the tapped day", w.run("calAddMode")==="holiday"&&/id="cal-add-start" value="2026-11-24"/.test(f)&&/id="cal-add-end" value="2026-11-24"/.test(f), f);
  ok("…the form draws above the grid (not inside the Holidays list)", /cal-add-start/.test(w.onecalTopFormHTML())&&!/cal-add-start/.test(w.calHolidaysSectionHTML()));
  w.calSave("holiday");
  ok("…Save writes calendar/holidays/<id> {name,start,end,pause} — the same calSave", w.writes.length===1&&/^calendar\/holidays\/fair_day_/.test(w.writes[0][0])&&w.writes[0][1].start==="2026-11-24"&&w.writes[0][1].end==="2026-11-24"&&w.writes[0][1].name==="Fair day", w.writes);
  ok("…and the form is closed; the top slot is empty", w.run("calAddMode")===null&&w.onecalTopFormHTML()==="");
  w.onecalAdd("vacation","2026-11-16"); const vf=w.calRenderAddForm("vacation");
  ok("Vacation: the same, type vacation", w.run("calAddMode")==="vacation"&&/id="cal-add-start" value="2026-11-16"/.test(vf)&&/id="cal-add-end" value="2026-11-16"/.test(vf)&&/Add Vacation/.test(vf));
  w.calCancelAdd(); ok("Cancel clears the prefill", w.run("calPrefillDate")===""&&w.run("calAddMode")===null);
}
{ const w=world({mom:true}); w.onecalAdd("event","2026-11-18");
  ok("Family event = calDayAddEvent: the event form, date prefilled, above the grid", w.run("calAddMode")==="event"&&w.run("calPrefillDate")==="2026-11-18"&&/id="cal-ev-date" value="2026-11-18"/.test(w.onecalTopFormHTML()));
}
{ const w=world({mom:true}); w.onecalAdd("cleaning","2026-11-18");
  ok("Cleaning day: one tap → hhCleanDayToggle → one set at calendar/cleaningDays/<iso>", w.writes.length===1&&w.writes[0][0]==="calendar/cleaningDays/2026-11-18"&&w.writes[0][1].by==="mom"&&w.renders>=1, w.writes);
  const k=world({mom:false}); k.onecalAdd("cleaning","2026-11-18"); ok("…not for a kid's device", k.writes.length===0);
}
{ const w=world({mom:true}); w.onecalAdd("coop","2026-11-17"); const p=sheet(w,"2026-11-17");
  ok("Co-op date: step two lists the co-ops and 'New co-op'", /Which co-op meets Nov 17, 2026\?/.test(p)&&/onecalAdd\('coop','2026-11-17','coop_a'\)/.test(p)&&/onecalAdd\('coop','2026-11-17','coop_b'\)/.test(p)&&/onecalAdd\('coop','2026-11-17','__new__'\)/.test(p), p.slice(-700));
  w.onecalAdd("coop","2026-11-17","coop_a");
  ok("…pick one → the date joins its list, sorted, saved through coopSave at calendar/coops/<id>", w.writes.length===1&&w.writes[0][0]==="calendar/coops/coop_a"&&w.writes[0][1].dates.join()==="2026-11-10,2026-11-17,2026-11-24"&&w.writes[0][1].name==="Tuesday Co-op"&&w.writes[0][1].start==="9:00 AM"&&w.writes[0][1].noMomBase===true, w.writes);
  ok("…cwdRelayKids re-lays its kids, as today; the form is closed", w.relays.length===1&&w.relays[0][0].join()==="lucy,ellis"&&w.run("coopEditId")===null&&w.run("coopForm")===null&&w.run("onecalPick")===null, w.relays);
  w.writes.length=0; w.onecalAdd("coop","2026-11-24","coop_a");
  ok("…a date it already meets: nothing written, a toast", w.writes.length===0&&/already meets/.test(w.toasts.join("|")));
  w.onecalAdd("coop","2026-11-19","__new__");
  ok("New co-op → coopStartAdd with the date pre-added, the co-op form above the grid", w.run("coopEditId")==="__new__"&&w.run("coopForm.dates.join()")==="2026-11-19"&&/Scan schedule photo/.test(w.onecalTopFormHTML())&&!/Scan schedule photo/.test(w.calCoopsSectionHTML()));
}
{ const w=world({mom:true,dom:{"cal-ov-date":"2026-11-20","cal-ov-type":"off","cal-ov-note":"Field trip"}});
  w.onecalAdd("override","2026-11-20",""); const p=sheet(w,"2026-11-20");
  ok("Kid off with the who row on Mom: a kid picker", w.run("onecalPick")&&w.run("onecalPick.kind")==="kid"&&/Which kid\?/.test(p)&&/onecalAdd\('override','2026-11-20','lucy'\)/.test(p)&&/onecalAdd\('override','2026-11-20','julian'\)/.test(p));
  w.onecalAdd("override","2026-11-20","lucy");
  ok("…pick Lucy → calStartAddOverride(lucy), date prefilled", w.run("calAddMode")==="override"&&w.run("calOverrideKid")==="lucy"&&/id="cal-ov-date" value="2026-11-20"/.test(w.onecalTopFormHTML()));
  w.calSaveOverride("lucy");
  ok("…Add writes calendar/kidOverrides/lucy/2026-11-20 {school:false,note}", w.writes.length===1&&w.writes[0][0]==="calendar/kidOverrides/lucy/2026-11-20"&&w.writes[0][1].school===false&&w.writes[0][1].note==="Field trip", w.writes);
  w.onecalMenu("2026-11-20"); const m=sheet(w,"2026-11-20","lucy");
  ok("with the who row on Lucy the choice is already hers (no picker)", /onecalAdd\('override','2026-11-20','lucy'\)/.test(m));
}
console.log("3. The lists under the grid");
{ const w=world({mom:true}); const h=w.onecalListsHTML(null);
  const sums=(h.match(/<summary class="gcal-hdr onecal-sum"[^>]*>(.*?)<\/summary>/g)||[]).map(s=>s.replace(/<[^>]+>/g,"").trim());
  ok("six sections, in her order, each with its count", sums.join(" | ")==="🎉 Family events · 2▸ | 🎉 Holidays · 2▸ | 🏖 Vacations · 1▸ | 🏫 Co-ops / Custom days · 2▸ | 🧽 Cleaning days · 1▸ | 😷 Per-kid overrides · 2▸", sums);
  ok("all folded shut by default", (h.match(/<details class="gcal-section"/g)||[]).length===6&&!/<details class="gcal-section"[^>]*\sopen/.test(h));
  const hol=w.calHolidaysSectionHTML();
  ok("Holidays: Thanksgiving in the upcoming card, Labor Day under Past · 1, each with ✎ / 🗑", /Thanksgiving/.test(hol.split("Past · 1")[0])&&/Past · 1<\/summary><div class="gcal-card">[\s\S]*Labor Day/.test(hol)&&/calEditHoliday\('thx'\)/.test(hol)&&/calDeleteHoliday\('labor'\)/.test(hol)&&/calStartAdd\('holiday'\)/.test(hol), hol);
  ok("Family events: Dentist upcoming, Old party past; the add button", /Dentist/.test(w.calEventsSectionHTML().split("Past · 1")[0])&&/Past · 1[\s\S]*Old party/.test(w.calEventsSectionHTML())&&/calStartAdd\('event'\)/.test(w.calEventsSectionHTML()));
  const co=w.calCoopsSectionHTML(); ok("Co-ops: Tuesday Co-op upcoming with the No-Mom box, Art Class (all dates past) under Past; ✎ 🗑 and + Add", /Tuesday Co-op/.test(co.split("Past · 1")[0])&&/Past · 1[\s\S]*Art Class/.test(co)&&/coopToggleNoMom\('coop_a'/.test(co)&&/coopStartEdit\('coop_a'\)/.test(co)&&/coopDelete\('coop_b'\)/.test(co)&&/coopStartAdd\(\)/.test(co));
  const cl=w.calCleaningSectionHTML(); ok("Cleaning days: the day with 🗑 hhCleanDayToggle and add-by-date", /hhCleanDayToggle\('2026-11-14'\)/.test(cl)&&/Nov 14, 2026/.test(cl)&&/hh-cd-date/.test(cl));
  const ov=w.calOverridesSectionHTML(null); ok("Per-kid overrides: every kid, Lucy's upcoming, Lincoln's past, 🗑 only (remove and re-add)", /Lucy<\/div>/.test(ov)&&/Lincoln<\/div>/.test(ov)&&/calDeleteOverride\('lucy','2026-11-30'\)/.test(ov)&&/Past · 1[\s\S]*calDeleteOverride\('lincoln','2026-09-10'\)/.test(ov)&&!/calEditOverride/.test(ov)&&/calStartAddOverride\('julian'\)/.test(ov));
  const ovl=w.calOverridesSectionHTML("lucy"); ok("…with the who row on Lucy: Lucy only, count 1", /Per-kid overrides · Lucy <span[^>]*>· 1<\/span>/.test(ovl)&&!/Lincoln/.test(ovl)&&/calStartAddOverride\('lucy'\)/.test(ovl), ovl.slice(0,300));
  w.onecalFold("holidays",true); ok("a list she unfolded stays open across re-renders", /<details class="gcal-section"[^>]*\sopen[^>]*ontoggle="onecalFold\('holidays'/.test(w.onecalListsHTML(null)));
  w.run("onecalL('holidays');calStartAdd('holiday')");
  ok("+ Add Holiday from the list: the form draws inside that list, empty dates, nothing above the grid", /id="cal-add-start" value=""/.test(w.calHolidaysSectionHTML())&&w.onecalTopFormHTML()===""&&w.run("onecalOpen.holidays")===true);
  w.calCancelAdd(); w.onecalTopFormHTML(); w.onecalAdd("holiday","2026-11-24");
  ok("…and the next add from the sheet goes back above the grid", /cal-add-start/.test(w.onecalTopFormHTML())&&!/cal-add-start/.test(w.calHolidaysSectionHTML()));
  const mp=world({mom:true}).mpSchBody();
  ok("Mom's Day ▸ Month draws: the form slot, the grid, then the six lists", /gcal-month-grid/.test(mp)&&(mp.match(/<details class="gcal-section"/g)||[]).length===6&&mp.indexOf("gcal-month-grid")<mp.indexOf('<details class="gcal-section"'));
  const mpl=world({mom:true}); mpl.run("mpSchWho='lucy'"); const mh=mpl.mpSchBody();
  ok("…who row on Lucy: her lens of the grid plus the lists, overrides hers only", /Per-kid overrides · Lucy /.test(mh)&&!/calStartAddOverride\('lincoln'\)/.test(mh));
}
console.log("4. The school-day line and 🖨 Print");
{ const w=world({mom:true}); const g=w.calRenderMonthPreview();
  const st=w.getSchoolDays("2026-08-17","2027-05-21",["Mon","Tue","Wed","Thu","Fri"],null);
  ok("the line reads '<N> school days · <M> off' for the dated lessons' span (Aug 17, 2026 – May 21, 2027)", new RegExp('>'+st.school+'</b> school days · '+st.off+' off <span[^>]*>· Aug 17, 2026 – May 21, 2027</span>').test(g), g.match(/school days[^<]*<span[^>]*>[^<]*/));
  ok("…holidays and vacations count as off (Thanksgiving 5 + Labor Day 1 + beach weekdays 9)", st.off===15&&st.school>150, st);
  ok("no dated lessons → no line", !/school days/.test(world({mom:true,lessons:{}}).calRenderMonthPreview()));
  ok("the Howe year is no longer typed into the code", src.indexOf('"2026-06-09"')<0&&src.indexOf('"2027-05-22"')<0&&src.indexOf('class="gcal-stats"')<0);
  ok("🖨 Print sits beside the layer chips on the Mom lens", /class="cal-chip" style="margin-left:auto" onclick="onecalPrint\(\)">🖨 Print<\/button><\/div>/.test(g));
  ok("Print opens a window with the grid as shown and calls print (lmCalPrint's approach)", /window\.open\("","_blank"\)/.test(fn("onecalPrint"))&&/querySelector\("\.gcal-month-grid\.lay"\)/.test(fn("onecalPrint"))&&/grid\.outerHTML/.test(fn("onecalPrint"))&&/win\.print\(\)/.test(fn("onecalPrint")));
  const d=world({mom:false,dad:true}); const dg=d.calRenderMonthPreview();
  ok("a shared / Dad screen: chips, but no Print and no school-day line", /cal-chip/.test(dg)&&!/onecalPrint/.test(dg)&&!/school days/.test(dg));
}
console.log("5. The kid lens is untouched");
{ const k=world({mom:false}); const h=sheet(k,"2026-11-24","lucy"), g=k.calRenderMonthPreview({who:"lucy"});
  ok("a kid's sheet: no pencils on breaks / co-ops, no add row, no span", !/onecal/.test(h)&&!/calEditHoliday/.test(h)&&!/coopStartEdit/.test(h)&&!/Nov 23 – 27/.test(h));
  ok("a kid's month: no Print, no school-day line, no lists", !/onecalPrint/.test(g)&&!/school days/.test(g)&&k.onecalListsHTML("lucy")===""&&k.onecalListsHTML(null)==="");
  ok("a shared screen (not Mom): the sheet keeps its plain ＋ Add event", /calDayAddEvent\('2026-11-24'\)">＋ Add event</.test(sheet(world({mom:false,dad:true}),"2026-11-24")));
  if(OLD){
    const o=world({mom:false,old:true}), n=world({mom:false});
    const same=["2026-11-24","2026-11-14","2026-12-22","2026-11-03"].every(iso=>sheet(o,iso,"lucy")===sheet(n,iso,"lucy"))&&o.calRenderMonthPreview({who:"lucy"})===n.calRenderMonthPreview({who:"lucy"});
    ok("byte-identical to origin/main in the kid lens (sheet on four days + the month)", same);
    const od=world({mom:false,dad:true,old:true}), nd=world({mom:false,dad:true});
    ok("byte-identical to origin/main on a shared screen (not Mom), sheet + month", sheet(od,"2026-11-24")===sheet(nd,"2026-11-24")&&od.calRenderMonthPreview()===nd.calRenderMonthPreview());
  } else console.log("  (skip) origin/main not available for the byte-identical check");
}
console.log("6. The Admin page retired; the hooks");
ok("renderCalendarView is gone, with its adminSubTab branch", src.indexOf("function renderCalendarView(")<0&&src.indexOf('adminSubTab==="calendar"')<0&&src.indexOf('"hq","settings","curriculum","mastery","chores","purchases"')>0);
ok("the Mom HQ row is gone", src.indexOf('_hqRow("calendar"')<0&&src.indexOf("Breaks & vacations\",\"Holidays")<0);
ok("setAdminSub('calendar') jumps to Mom's Day ▸ Schedule ▸ Month", /function setAdminSub\(s\)\{ if\(s==="calendar"&&typeof onecalGo==="function"\)\{ onecalGo\(\); return; \}/.test(src)&&/function onecalGo\(\)\{ if\(typeof mpSchMode!=="undefined"\)\{ mpSchMode="month";[^\n]*mpGoto\('cal'\); \}/.test(src));
ok("live calendar changes redraw Mom's Day ▸ Schedule (the old hook watched the Admin page)", /if\(tab==="moms-plan"&&mpSubView==="cal"\)\{const el=document\.getElementById\("content"\);if\(el\)renderAll\(\);\}/.test(src));
ok("no lmRenderCalendar / lmCalNav / lmCalJump / lmCalSetKid / lmCalDayPopup / lmCalPrint call remains; lmCalData, _lmKidOff, lmCalDayChips, _lmDayKind stay", !/lmRenderCalendar\(|lmCalNav\(|lmCalJump\(|lmCalSetKid\(|lmCalDayPopup\(|lmCalPrint\(/.test(src)&&/function lmCalData\(/.test(src)&&/function _lmKidOff\(/.test(src)&&/function lmCalDayChips\(/.test(src)&&/function _lmDayKind\(/.test(src));
ok("the section drawers exist once, in the ONECAL block; the old copies are gone", ["calHolidaysSectionHTML","calVacationsSectionHTML","calEventsSectionHTML","calCoopsSectionHTML","calCleaningSectionHTML","calOverridesSectionHTML"].every(n=>src.split("function "+n+"(").length===2&&cut("// ONECAL_START","// ONECAL_END").indexOf("function "+n+"(")>=0)&&src.indexOf("function renderCoopSection(")<0&&src.indexOf("function hhCleanDaysEditorHTML(")<0);
ok("the hooks are one line each: sheet break row, co-op row, add row; month print + line; mpSchBody form slot + lists; the two forms' prefill", [/onecalBreakSpan\(b,kidMode\)/,/onecalBreakActs\(b,kidMode\)/,/onecalCoopActs\(c,kidMode\)/,/onecalAddBtnHTML\(iso\)/,/onecalSheetPickHTML\(iso,who\)/,/h\+=onecalPrintBtnHTML\(\);/,/if\(!kidMode&&typeof onecalSchoolLineHTML==="function"\) h\+=onecalSchoolLineHTML\(\);/,/if\(typeof onecalTopFormHTML==="function"\) h\+=onecalTopFormHTML\(\);[^\n]*\n\s*h\+=calRenderMonthPreview\(kidWho\?\{who:kidWho\}:undefined\);\n\s*if\(typeof onecalListsHTML==="function"\) h\+=onecalListsHTML\(kidWho\);/,/value="'\+\(existing\?existing\.start:calPrefillDate\|\|""\)\+'"/,/id="cal-ov-date" value="'\+esc\(calPrefillDate\|\|""\)\+'"/].every(r=>r.test(src)));
ok("every write in the block goes through the existing functions (no db.ref of its own)", !/db\.ref/.test(cut("// ONECAL_START","// ONECAL_END")));
ok("kid-safe wording, no 🔀", src.indexOf("🔀")<0&&!/stupid|dumb/i.test(cut("// ONECAL_START","// ONECAL_END")));
console.log("\n"+pass+" passed, "+fail+" failed");
process.exit(fail?1:0);
