/*
 * Node tests — 📆 CPSENDEARLY, PR 28 of the class platform (DESIGN_class_platform_2026-10-28.md §8.3, §6.8.8, §8.10, §8.4, §13 row 28).
 * From the research's key finding (2026-10-28): the late stations set the pace, so the 📅 Pace bar gets a "send out earlier" lever.
 *   · the block and its typeof-guarded hook lines (cppPlanned, cppChanges, cpPaceSave) + CPPACE's waiting cpSendEarlyHtml hook it fills;
 *     writes only through envcWrite / CPSEND's cpsdWrite;
 *   · the strip: the weeks to the goal, the 🏫 class meetings, a row per section (✓ sent · 📅 scheduled · ○ planned · ● moved);
 *   · THE DEMO: Teacher ▸ 📅 Pace ▸ Wildlife ◀ 1 wk ×4 ▸ "needs" and its minutes drop before Save, and nothing is written;
 *   · the levers stay between today and the goal; ↺ and moving back to the saved date undo; a sent section can't move;
 *   · Save: ONE update of plan/<key>/sendOn; with her tick, the same update schedules it (or moves the scheduled record); never without;
 *   · the planner reads a whole-class scheduled send-out as the section's arrival; a picked-students one doesn't count;
 *   · 🔒 locks/plan greys it for the teacher and Save refuses the dates; the admin can;
 *   · 💡: the biggest saving, Do it fills the what-if (no write), Not now hides it, PR 16 can take the kind over;
 *   · the rules; Howe / Lincoln: no edition → nothing drawn, read or written.
 * Uses the world from test_env_site.js; its `o.rev` line injects CPPACE, CPSEND, CPCAL and this block.          run: node test_cp_send_early.js
 */
const fs=require("fs"), path=require("path");
const {world,src,REPO}=require("./test_env_site.js");
let pass=0, fail=0;
const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  "+JSON.stringify(x).slice(0,500):"")); } };
const cut=(a,b)=>{ const i=src.indexOf(a); if(i<0) throw new Error("missing "+a); const j=src.indexOf(b,i); return src.slice(i,j+b.length); };
const PACE=cut("// CPPACE_START","// CPPACE_END"), SEND=cut("// CPSEND_START","// CPSEND_END"), CAL=cut("// CPCAL_START","// CPCAL_END"), SE=cut("// CPSENDEARLY_START","// CPSENDEARLY_END");
const PN="_cpp, cppDraft, cppDraftOf, cppInputs, cppRun, cppPlanned, cppChanges, cppSections, cppCls, cpPaceFlush, cpPaceSave, cppReset";
const XN="_cpse, cpseMon, cpseDay, cpseWeeks, cpseRange, cpseMove, cpseTo, cpseWeek, cpseBack, cpseTick, cpseDo, cpseQuiet, cpseSetDate, cpSendEarlyOn, cpSendEarlyChanged, cpSendEarlySave, cpSendEarlySuggest, cpSendEarlyHtml";
const REV=PACE+"\n"+SEND+"\n"+CAL+"\n"+SE+"\nG.pace={ "+PN+" };\nG.se={ "+XN+" };";
const FAM={familyId:"envirothon",edition:"envirothon",className:"MS Science 2026-27",roster:[]};
const LIB=require(path.join(REPO,"envirothon.js"));
const NOW=Date.UTC(2026,9,29,15,0,0);   // Thu Oct 29, 2026
const CID="ms-science-2026";
function W(o){ o=o||{}; const w=world(Object.assign({fam:FAM,envt:true,lib:LIB,rev:REV,now:NOW},o)); w.P=w.G.pace; w.X=w.G.se; return w; }
function demo(role,pre){ const w=W({search:"?demo=1&role="+(role||"teacher")}); w.envSiteDemoBoot(); if(pre) pre(w); w.renderAll(); w.envcView("pace"); settle(w); return w; }
const settle=w=>{ for(let i=0;i<10;i++){ const n=w.P.cpPaceFlush(); w.renderAll(); if(!n) break; } return w.G.content; };
const need=h=>{ const m=/The plan needs <b>(\d+) new cards a day<\/b>[^<]*?\(~(\d+) min\)/.exec(h)||/(\d+) new cards a day would also make[^<]*?\(~(\d+) min\)/.exec(h); return m?{n:+m[1],min:+m[2]}:null; };
const strip=h=>{ const i=h.indexOf("Send-out dates"); return i<0?"":h.slice(i,h.indexOf('class="cpp-res',i)>0?h.indexOf('class="cpp-res',i):undefined); };
const wild=w=>w.P.cppSections().find(s=>s.id==="wildlife");
const saved=w=>w.P.cppPlanned(w.P.cppCls(),wild(w),null);

const run=async()=>{
console.log("── the block and its hooks ──");
{ const a=src.indexOf("// CPSENDEARLY_START"), b=src.indexOf("// CPSENDEARLY_END");
  ok("one CPSENDEARLY block, with the design's sections, the research's finding and the date", a>0&&b>a&&src.indexOf("// CPSENDEARLY_START",a+1)<0&&/§8\.3/.test(SE.slice(0,400))&&/late\s+(\/\/\s+)?stations set the pace/.test(SE.slice(0,900))&&/2026-10-28/.test(SE.slice(0,600)));
  const hooks=(src.slice(0,a)+src.slice(b)).split("\n").filter(l=>/📆 CPSENDEARLY/.test(l));
  ok("its hook lines outside the block are each tagged 📆 CPSENDEARLY and typeof-guarded ("+hooks.length+")", hooks.length>0&&hooks.every(l=>/typeof cpSendEarly\w+==="function"/.test(l)), hooks.map(l=>l.trim().slice(0,90)));
  ok("…in cppPlanned (the scheduled date), cppChanges (Save knows) and cpPaceSave (the write)", ["cpSendEarlyOn(st)","cpSendEarlyChanged(d)","cpSendEarlySave(d,refused)"].every(c=>hooks.some(l=>l.indexOf(c)>=0)));
  ok("CPPACE's waiting hook cpSendEarlyHtml({d,inp,plan}) is what this block defines", /typeof cpSendEarlyHtml==="function"\) h\+=cpSendEarlyHtml\(\{d,inp,plan\}\)/.test(PACE)&&/\nfunction cpSendEarlyHtml\(ctx\)/.test(SE));
  ok("writes only through envcWrite / CPSEND's cpsdWrite (no firebase, no db.ref, no .set( / .update( of its own); no 🔀", !/firebase\.|\bdb\.ref|\.set\(|\.update\(/.test(SE)&&/envcWrite\("classes\/"\+cid,plan,"update"\)/.test(SE)&&/cpsdWrite\(o\)/.test(SE)&&SE.indexOf("\u{1F500}")<0);
  ok("the unit's words, never \"Station\" in code (§15); the lock comes from CPLOCKS' cpLockRO, part plan", !/["']Station/.test(SE.split("\n").filter(l=>!/^\s*\/\//.test(l)).join("\n"))&&/cpLockRO\("plan"\)/.test(SE)); }

console.log("── the pure parts ──");
{ const X=W().X;
  ok("the Monday of a date's week", X.cpseMon("2026-10-29")==="2026-10-26"&&X.cpseMon("2026-10-26")==="2026-10-26"&&X.cpseMon("2027-01-03")==="2026-12-28");
  ok("a day's words: Tue Jan 26 · weeks between two dates", X.cpseDay("2027-01-26")==="Tue Jan 26"&&X.cpseDay("nope")===""&&X.cpseWeeks("2026-12-29","2027-01-26")===4); }

console.log("── the strip on 📅 Pace (demo, teacher) ──");
const w=demo("teacher"), P=w.P, X=w.X;
{ const h=w.G.content, s=strip(h);
  ok("📆 Send-out dates sits on the plan bar, before the result line", s.length>0&&h.indexOf("Send-out dates")<h.indexOf('class="cpp-res'));
  ok("the strip: one column a week from this week (Oct 26) to the goal's week, 🏫 on the class meetings, 🏁 on the goal", /<th>Oct 26<\/th>/.test(s)&&/<th>Mar 22<\/th>/.test(s)&&!/<th>Mar 29<\/th>/.test(s)&&/\u{1F3EB}/u.test(s)&&/\u{1F3C1}/u.test(s)&&/title="Tue Jan 26 · Wildlife"/.test(s));
  ok("a row per section, from the unit's labels", P.cppSections().every(st=>s.indexOf('title="'+st.label.replace(/&/g,"&amp;")+'"')>=0||s.indexOf(st.label)>=0));
  ok("the demo plans each section still to go out on its class day: Wildlife Jan 26 (○ planned)", saved(w)==="2027-01-26"&&/<b>Wildlife<\/b> · Tue Jan 26 <span class="envs-muted">\(planned\)/.test(s)&&/k-plan/.test(s));
  ok("…with ◀ 1 wk / ▶ 1 wk and 🏫 to a class day", /cpseMove\('wildlife',-7\)/.test(s)&&/cpseMove\('wildlife',7\)/.test(s)&&/<option value="2026-12-01">Tue Dec 1 · Aquatics<\/option>/.test(s));
  ok("each week of a section's row is a tap that moves it there", /onclick="cpseWeek\('wildlife','2026-11-30'\)"/.test(s)); }

console.log("── THE DEMO: Wildlife ◀ 4 weeks, the minutes drop before Save ──");
{ const n0=need(w.G.content), wr=w._envs.writes.length;
  for(let i=0;i<4;i++) X.cpseMove("wildlife",-7); const h=settle(w), n1=need(h), s=strip(h);
  ok("Wildlife moves 4 weeks, to Dec 29 (a what-if on the draft)", P.cppDraft().sendOn.wildlife==="2026-12-29"&&/Tue Dec 29<\/b> <span class="envs-muted">instead of Jan 26/.test(s), P.cppDraft().sendOn);
  ok("the plan's New cards a day it needs drops, and so do its minutes a day", n0&&n1&&n1.n<n0.n&&n1.min<n0.min, [n0,n1]);
  ok("the side by side: \"Wildlife Dec 29 instead of Jan 26 → needs A → B (~M → N min)\"", new RegExp("What-if: <b>Wildlife</b> Dec 29 instead of Jan 26<br>→ needs <b>"+n0.n+" → "+n1.n+"</b> new cards a day from the class’s start \\(~"+n0.min+" → ~"+n1.min+" min a day\\)").test(s), s.slice(s.indexOf("What-if"),s.indexOf("What-if")+300));
  ok("● where it is now, ◌ where it was", /k-wi/.test(s)&&/k-old/.test(s));
  ok("Save knows: the bar's what-if names \"send-out dates\" and Save is on", /What-if: send-out dates changed/.test(h)&&/onclick="cpPaceSave\(\)">Save this plan/.test(h));
  ok("…and nothing was written", w._envs.writes.length===wr);
  ok("every student's row re-runs with it (a student's \"needs from now\" reads the what-if)", P.cppInputs(P.cppDraft()).sendOn.wildlife==="2026-12-29"); }

console.log("── the levers' limits ──");
{ for(let i=0;i<30;i++) X.cpseMove("wildlife",-7); ok("never before today", P.cppDraft().sendOn.wildlife==="2026-10-29");
  for(let i=0;i<40;i++) X.cpseMove("wildlife",7); ok("never past the goal (Area Mar 22)", P.cppDraft().sendOn.wildlife==="2027-03-22");
  X.cpseBack("wildlife"); ok("↺ puts it back (no change left)", P.cppDraft().sendOn.wildlife===undefined&&X.cpSendEarlyChanged(P.cppDraft()).length===0);
  X.cpseWeek("wildlife","2026-11-30"); ok("a tap on a week with a class meeting moves it to that class day (Tue Dec 1)", P.cppDraft().sendOn.wildlife==="2026-12-01");
  X.cpseWeek("wildlife","2027-02-01"); ok("a tap on a week without one keeps the weekday (Tue → Tue Feb 2)", P.cppDraft().sendOn.wildlife==="2027-02-02");
  X.cpseTo("wildlife","2027-01-26"); ok("moving it back to its saved date is no change", P.cppDraft().sendOn.wildlife===undefined);
  X.cpseTo("wildlife","2026-12-01"); settle(w); ok("🏫 to a class day: Dec 1", P.cppDraft().sendOn.wildlife==="2026-12-01");
  const wr=w._envs.writes.length; P.cppReset(); settle(w); ok("Undo the changes clears it too, nothing written", P.cppDraft().sendOn.wildlife===undefined&&w._envs.writes.length===wr); }

console.log("── a sent section can't move ──");
{ const w2=demo("teacher",x=>{ x._envc.release=x._envc.release||{}; x._envc.release.all=Object.assign({},x._envc.release.all,{wildlife:{openedAt:Date.UTC(2026,9,27,12),by:"t"}}); });
  w2.X.cpseMove("wildlife",-7); const s=strip(settle(w2));
  ok("Wildlife sent Oct 27: ✓ on the strip, \"sent Oct 20\", no levers, no what-if", w2.P.cppDraft().sendOn.wildlife===undefined&&/<b>Wildlife<\/b> <span class="envs-muted">· sent Oct 27/.test(s)&&!/cpseMove\('wildlife'/.test(s)&&/k-sent/.test(s)); }

console.log("── Save: the plan date only, unless she ticks ──");
{ const w3=demo("teacher"); for(let i=0;i<4;i++) w3.X.cpseMove("wildlife",-7); let s=strip(settle(w3));
  ok("a moved section with no schedule offers \"Also schedule it\", unticked", /cpseTick\('wildlife',this\.checked\)/.test(s)&&/Also schedule it: Wildlife goes out to every student on Tue Dec 29 at 7:00 AM/.test(s)&&!/<input type="checkbox" checked[^>]*cpseTick/.test(s));
  const wr=w3._envs.writes.length; w3.P.cpPaceSave(); await w3.flush(); const nw=w3._envs.writes.slice(wr);
  ok("Save: ONE update at classes/<cid>, plan/wildlife/sendOn only — no release, no scheduled record", nw.length===1&&nw[0].op==="update"&&nw[0].path==="classes/"+CID&&JSON.stringify(nw[0].val)===JSON.stringify({"plan/wildlife/sendOn":"2026-12-29"}), nw);
  settle(w3); ok("…the class now plans Wildlife on Dec 29, the draft is fresh, nothing left to save", saved(w3)==="2026-12-29"&&w3.P.cppDraft().sendOn.wildlife===undefined&&w3.P.cppChanges(w3.P.cppDraft(),w3.P.cppDraftOf(w3.P.cppCls())).length===0);
  ok("…no scheduled record exists", !Object.keys((w3._envc.release||{}).scheduled||{}).length);
  // with her tick
  w3.X.cpseTo("wildlife","2026-12-01"); w3.X.cpseTick("wildlife",true); s=strip(settle(w3));
  ok("ticked, the box shows it", /<input type="checkbox" checked[^>]*cpseTick\('wildlife'/.test(s));
  const wr2=w3._envs.writes.length; w3.P.cpPaceSave(); await w3.flush(); const n2=w3._envs.writes.slice(wr2), v=n2[0]&&n2[0].val, sk=v?Object.keys(v).filter(k=>/\/scheduled\//.test(k)):[];
  ok("ticked Save: ONE root update with the plan date AND one scheduled record", n2.length===1&&n2[0].path==="/"&&v["classes/"+CID+"/plan/wildlife/sendOn"]==="2026-12-01"&&sk.length===1, n2);
  const rec=v&&v[sk[0]];
  ok("…CPSEND's shape: {key: wildlife, level: section, to: all, on, at 07:00, by = her, ts}", rec&&rec.key==="wildlife"&&rec.level==="section"&&rec.to==="all"&&rec.on==="2026-12-01"&&rec.at==="07:00"&&rec.by===w3._envs.uid&&typeof rec.ts==="number", rec);
  settle(w3); ok("…and the strip now shows it 📅 scheduled", /k-sched/.test(strip(w3.G.content))&&/\(\u{1F4C5} scheduled\)/u.test(strip(w3.G.content))); }

console.log("── a section that already has a scheduled send-out ──");
{ const sch=x=>{ x._envc.release=x._envc.release||{}; x._envc.release.scheduled={s1:{key:"wildlife",level:"section",to:"all",on:"2027-01-12",at:"07:00",by:"t",ts:1},s2:{key:"wildlife~k2",level:"kc",to:{ramirez_maya:true},on:"2026-11-20",at:"07:00",by:"t",ts:1}}; };
  const w4=demo("teacher",sch);
  ok("the planner takes the whole-class scheduled date (Jan 12) over the plan date; a picked-students record doesn't count", saved(w4)==="2027-01-12"&&w4.P.cppInputs(w4.P.cppDraft()).sendOn.wildlife==="2027-01-12");
  w4.X.cpseMove("wildlife",-7); let s=strip(settle(w4));
  ok("moving it offers \"Also move the scheduled send-out (Jan 12) to Tue Jan 5\", and says what happens if she doesn't", /Also move the scheduled send-out \(Jan 12\) to Tue Jan 5/.test(s)&&/Left unticked, students still get it on Tue Jan 12/.test(s));
  w4.X.cpseTick("wildlife",true); const wr=w4._envs.writes.length; w4.P.cpPaceSave(); await w4.flush(); const v=(w4._envs.writes[wr]||{}).val||{};
  ok("ticked Save rewrites THAT record (same id) with the new date and her as by, beside the plan date", v["classes/"+CID+"/plan/wildlife/sendOn"]==="2027-01-05"&&v["release/"+CID+"/scheduled/s1"]&&v["release/"+CID+"/scheduled/s1"].on==="2027-01-05"&&v["release/"+CID+"/scheduled/s1"].by===w4._envs.uid&&!v["release/"+CID+"/scheduled/s2"], v);
  settle(w4); ok("…the console's copy moved too (CPSEND's demo merge)", w4._envc.release.scheduled.s1.on==="2027-01-05"); }

console.log("── 🔒 locks/plan ──");
{ const w5=demo("teacher",x=>{ x._envc.cls.locks={plan:true,byName:"Adrienne"}; }), s=strip(w5.G.content);
  ok("the teacher sees the strip greyed: \"🔒 set by Adrienne\", no week taps, the levers disabled", /\u{1F512} set by Adrienne/u.test(s)&&!/cpseWeek\(/.test(s)&&/disabled onclick="cpseMove\('wildlife',-7\)"/.test(s));
  w5.X.cpseMove("wildlife",-7); ok("a lever does nothing", w5.P.cppDraft().sendOn.wildlife===undefined);
  w5.P.cppDraft().sendOn.wildlife="2026-12-01"; const refused=[]; ok("Save refuses the dates (and says so)", w5.X.cpSendEarlySave(w5.P.cppDraft(),refused)===0&&refused.indexOf("send-out dates")>=0);
  const w6=demo("admin",x=>{ x._envc.cls.locks={plan:true}; }); w6.X.cpseMove("wildlife",-7);
  ok("the admin can still move it", w6.P.cppDraft().sendOn.wildlife==="2027-01-19"); }

console.log("── 💡 the suggestion ──");
{ const w7=demo("teacher"), sg=w7.X.cpSendEarlySuggest({d:w7.P.cppDraft(),inp:w7.P.cppInputs(w7.P.cppDraft())}), s=strip(w7.G.content);
  ok("it picks the section whose earlier send-out saves the most: Wildlife, about 4 weeks earlier", sg&&sg.kind==="sendEarly"&&sg.sec==="wildlife"&&sg.to<sg.from&&sg.weeks>=3&&sg.weeks<=5, sg);
  ok("…and it saves New cards a day and minutes", sg&&sg.need[1]<sg.need[0]&&sg.min[1]<sg.min[0]);
  ok("the strip shows it: 💡 \"Sending Wildlife out N weeks earlier … saves ~M min a day\" with Do it and Not now", sg&&s.indexOf("\u{1F4A1} "+sg.text.replace(/&/g,"&amp;"))>=0&&/>Do it<\/button>/.test(s)&&/>Not now<\/button>/.test(s), s.slice(s.indexOf("cpse-sug"),s.indexOf("cpse-sug")+300));
  const wr=w7._envs.writes.length; w7.X.cpseDo(sg.sec,sg.to); settle(w7);
  ok("Do it fills the what-if (no write); the 💡 steps aside for the side by side", w7.P.cppDraft().sendOn.wildlife===sg.to&&w7._envs.writes.length===wr&&!/cpse-sug/.test(strip(w7.G.content))&&/What-if: <b>Wildlife<\/b>/.test(strip(w7.G.content)));
  w7.P.cppReset(); settle(w7); w7.X.cpseQuiet(sg.id); settle(w7); ok("Not now hides it", !/cpse-sug/.test(strip(w7.G.content)));
  const w8=W({search:"?demo=1&role=teacher",rev:REV+"\nfunction cpSuggestOwns(k){ return k===\"sendEarly\"; }"}); w8.envSiteDemoBoot(); w8.renderAll(); w8.envcView("pace"); settle(w8);
  ok("once PR 16's list says it shows this kind (cpSuggestOwns), the strip leaves it to that list", !/cpse-sug/.test(strip(w8.G.content))&&/Send-out dates/.test(w8.G.content)); }

console.log("── the rules ──");
{ const R=JSON.parse(fs.readFileSync(path.join(REPO,"envirothon","SITE_RULES.json"),"utf8")), p=R.rules.classes.$cid.plan, v=p.$key.sendOn&&p.$key.sendOn[".validate"];
  ok("classes/$cid/plan/$key/sendOn: a YYYY-MM-DD string, under the plan rule (teacher, refused while locks/plan is on)", v&&/isString\(\)/.test(v)&&/\[0-9\]\{4\}-\[0-9\]\{2\}-\[0-9\]\{2\}/.test(v)&&/locks\/plan/.test(p[".write"]));
  ok("the rules' notes name it", /CPSENDEARLY/.test(R._about)&&/plan\/<key>\/sendOn/.test(R._about)); }

console.log("── Howe / Lincoln: nothing ──");
{ const h=W({fam:{familyId:"howe",roster:[]}}), X=h.X, d={sendOn:{wildlife:"2026-12-01"}};
  ok("no edition: no strip, no scheduled date, nothing to save", X.cpSendEarlyHtml({d,inp:{goal:"2027-03-22"}})===""&&X.cpSendEarlyOn({id:"wildlife"})===""&&X.cpSendEarlyChanged(d).length===0&&X.cpSendEarlySave(d,[])===0&&X.cpSendEarlySuggest({d,inp:{goal:"x"}})===null);
  ok("…and nothing written", !(h._envs.writes||[]).length); }

console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
};
run().catch(e=>{ console.log("CRASH",e&&e.stack); process.exit(1); });
