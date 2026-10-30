/*
 * Node tests — 🎯 CPCALOPTIONS: the teacher sets checkpoints, each family picks its study days from options that meet them (her Q33 answer,
 * 2026-10-29: "i think brittany says how many they need to have learned by a certain point and show options of how that would look and let
 * the families decide"; DESIGN_class_platform_2026-10-28.md §8.10, §13 row 22, "Adrienne's answers, 2026-10-29").
 *   · the block (right after CPCAL_END) and its typeof-guarded hooks; writes only through envcWrite / envsWrite;
 *   · the pure parts: checkpoints from classes/<cid>/checkpoints, the next one, their targeted update;
 *   · 🎯 Checkpoints on 📅 Pace: add / ✕ / Save (ONE update, a path per date) / Undo; a past date or a bad number refused; 🔒 locks/plan greys it;
 *   · THE DEMO: Teacher sets 800 by Jan 15 ▸ Parent (Maya) ▸ 📅 Our study days shows the options (the real planner, from where Maya is) ▸ pick
 *     Mon–Thu (ONE set, CPCAL's record + npd) ▸ Teacher ▸ 📅 Pace: Maya on Mon–Thu, ✓ 800 by Jan 15, on pace; the parent's on-pace card and the
 *     kid's 🌿 sitting use the family's New cards a day;
 *   · the teacher's own number wins; Adrienne's 🔒 New cards a day: no npd written or used; the switch ON by default, off = read-only;
 *   · custom days tapped on CPCAL's chips become an option; the teacher's student page; the kid's / parent's lock listener;
 *   · the rules; Howe / Lincoln: no edition → nothing drawn, read or written.
 * Uses the world from test_env_site.js; its `o.rev` line injects CPPACE, CPSEND, CPCAL and this block.          run: node test_cp_cal_options.js
 */
const fs=require("fs"), path=require("path");
const {world,src,REPO}=require("./test_env_site.js");
let pass=0, fail=0;
const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  "+JSON.stringify(x).slice(0,500):"")); } };
const cut=(a,b)=>{ const i=src.indexOf(a); if(i<0) throw new Error("missing "+a); const j=src.indexOf(b,i); return src.slice(i,j+b.length); };
const PACE=cut("// CPPACE_START","// CPPACE_END"), SEND=cut("// CPSEND_START","// CPSEND_END"), CAL=cut("// CPCAL_START","// CPCAL_END"), OPT=cut("// CPCALOPTIONS_START","// CPCALOPTIONS_END");
const PN="_cpp, cpPacePlan, cpNeedPerDay, cppInputs, cppDraft, cppRow, cpPaceFlush, cpPaceHtml, cpPaceParentHtml";
const CN="_cpcal, cpCalTap, cpCalSave, cpCalUndo, cpCalListen, cpCalParentHtml, cpCalStudentHtml";
const ON="CPCO_OPTS, _cpco, cpCalCheckpoints, cpCalNextCheckpoint, cpCalCpUpdate, cpCalOptNpd, cpCalOptLayers, cpCalOptListen, cpCalOptions, cpCalOptPick, cpCalOptHtml, cpCalOptRowHtml, cpCalCpIn, cpCalCpAdd, cpCalCpDel, cpCalCpUndo, cpCalCpSave, cpCalOptPaceHtml";
const REV=PACE+"\n"+SEND+"\n"+CAL+"\n"+OPT+"\nG.pace={ "+PN+" };\nG.cal={ "+CN+" };\nG.opt={ "+ON+" };";
const FAM={familyId:"envirothon",edition:"envirothon",className:"MS Science 2026-27",roster:[]};
const LIB=require(path.join(REPO,"envirothon.js"));
const NOW=Date.UTC(2026,9,29,15,0,0);   // Thu Oct 29, 2026
const CID="ms-science-2026", SID="ramirez_maya";
function W(o){ o=o||{}; const w=world(Object.assign({fam:FAM,envt:true,lib:LIB,rev:REV,now:NOW},o)); w.P=w.G.pace; w.C=w.G.cal; w.O=w.G.opt; return w; }
function demo(role){ const w=W({search:"?demo=1&role="+(role||"teacher")}); w.envSiteDemoBoot(); w.renderAll(); return w; }
const settle=w=>{ for(let i=0;i<20;i++){ const n=w.P.cpPaceFlush(); w.renderAll(); if(!n) break; } return w.G.content; };
const txt=h=>h.replace(/<[^>]+>/g," ").replace(/\s+/g," ");
const opts=h=>{ const out={}; const re=/<button class="cpco-o[^"]*"[^>]*>([\s\S]*?)<\/button>/g; let m; while((m=re.exec(h))){ const t=txt(m[1]).trim(), d=/<span class="d">([^<]*)/.exec(m[1]); if(d) out[d[1].trim()]={t,on:/class="cpco-o on/.test(m[0]),dis:/ disabled/.test(m[0].slice(0,m[0].indexOf(">")))}; } return out; };
const toasted=(w,re)=>w.G.created.some(e=>e&&e.id==="envs-toast"&&re.test(e.textContent||""));
const nOf=o=>{ const m=/(\d+) new a day/.exec((o&&o.t)||""); return m?+m[1]:null; };
async function addCp(w,on,n,unit){ w.O.cpCalCpIn("unit",unit||"n"); w.O.cpCalCpIn("on",on); w.O.cpCalCpIn("n",String(n)); const a=w.O.cpCalCpAdd(); const s=w.O.cpCalCpSave(); await w.flush(); return a&&s; }

const run=async()=>{
console.log("── the block and its hooks ──");
{ const a=src.indexOf("// CPCALOPTIONS_START"), b=src.indexOf("// CPCALOPTIONS_END");
  ok("one CPCALOPTIONS block, right after CPCAL_END, with her words, the date and Q33", a>0&&b>a&&src.indexOf("// CPCALOPTIONS_START",a+1)<0&&src.slice(src.indexOf("// CPCAL_END"),a).trim()==="// CPCAL_END"&&/brittany says how many they need to have learned by a certain point/.test(OPT.slice(0,600))&&/2026-10-29/.test(OPT.slice(0,400))&&/Q33/.test(OPT.slice(0,400)));
  const decl=l=>!l.trim()||/^(\/\/|function |const |let |var | |})/.test(l);
  ok("the block only declares (nothing runs at boot)", OPT.split("\n").every(decl));
  const hooks=(src.slice(0,a)+src.slice(b)).split("\n").filter(l=>/🎯 CPCALOPTIONS/.test(l)&&/cpCalOpt/.test(l));
  ok("its hook lines outside the block are each tagged 🎯 CPCALOPTIONS and typeof-guarded on a cpCalOpt function ("+hooks.length+")", hooks.length===9&&hooks.every(l=>(l.match(/cpCalOpt\w+(?=\()/g)||[]).every(f=>new RegExp('typeof '+f+'==="function"').test(l))), hooks.map(l=>l.trim().slice(0,90)));
  ok("…CPCAL's listener, student page and parent card; CPPACE's cppRow (twice), student table, 📅 Pace, parent card; ENVCLASSSET's overlay", ["cpCalOptListen(sdb,re)","cpCalOptHtml(sid,\"teacher\")","cpCalOptHtml(_envs.sid,\"parent\",kid)","cpCalOptNpd(s.sid)","cpCalOptNin(s.sid,nin,opt)","cpCalOptRowHtml(r)","cpCalOptPaceHtml(ctx)","cpCalOptLayers(_envs.sid,cppLayersFor(_envs.sid))","cpCalOptLayers(_envs.sid,L)"].every(f=>hooks.some(l=>l.indexOf(f)>=0)));
  const ov=src.slice(src.indexOf("function envClassOverlay("),src.indexOf("\n}\n",src.indexOf("function envClassOverlay(")));
  ok("the overlay's line is the study part only, after Lincoln's own line (his 🌿 record never reaches it)", /if\(part==="study"&&typeof cpCalOptLayers==="function"\) L=cpCalOptLayers\(_envs\.sid,L\);/.test(ov)&&ov.indexOf("cplnOverlay(")<ov.indexOf("cpCalOptLayers("));
  ok("the default switch in CPCAL: familyDays !== false three times, === true nowhere", (CAL.match(/familyDays!==false/g)||[]).length===3&&!/familyDays===true/.test(CAL));
  ok("writes only through envcWrite / envsWrite (CPCAL's cpcalWrite); no firebase, no db.ref, no .set( / .update( of its own; no 🔀", !/firebase\.|\bdb\.ref|\.set\(|\.update\(/.test(OPT)&&/envcWrite\("classes\/"\+_envc\.cid,upd,"update"\)/.test(OPT)&&/cpcalWrite\("students\/"\+sid\+"\/calendar",rec,"set"\)/.test(OPT)&&OPT.indexOf("\u{1F500}")<0);
  ok("no Howe kid name as a code literal", !/["'`](lincoln|ellis|lucy|julian)["'`]/i.test(OPT)); }

console.log("── the pure parts ──");
{ const O=W().O, cls={checkpoints:{"2027-01-15":{n:800},"2026-12-01":{pct:30},"2027-02-01":{n:0},"soon":{n:5},"2027-03-01":{pct:150},"2027-02-15":{n:"900"}}};
  const L=O.cpCalCheckpoints(cls);
  ok("checkpoints: {n} or {pct} by date; a bad date, 0 or a % over 100 drops", JSON.stringify(L)===JSON.stringify([{date:"2026-12-01",pct:30},{date:"2027-01-15",n:800},{date:"2027-02-15",n:900}]), L);
  ok("…none saved, or a list instead of an object → none", O.cpCalCheckpoints({}).length===0&&O.cpCalCheckpoints({checkpoints:[{n:5}]}).length===0&&O.cpCalCheckpoints(null).length===0);
  ok("the next one is the first AFTER today (today's is past)", O.cpCalNextCheckpoint(cls,"2026-10-29").date==="2026-12-01"&&O.cpCalNextCheckpoint(cls,"2026-12-01").date==="2027-01-15"&&O.cpCalNextCheckpoint(cls,"2027-03-01")===null);
  ok("the update is targeted: a path per changed date, null for one taken out, nothing when nothing changed", JSON.stringify(O.cpCalCpUpdate(L,L))==="{}"&&JSON.stringify(O.cpCalCpUpdate(L,[L[0],{date:"2027-01-15",n:850},{date:"2027-02-20",pct:60}]))===JSON.stringify({"checkpoints/2027-01-15":{n:850},"checkpoints/2027-02-20":{pct:60},"checkpoints/2027-02-15":null}));
  ok("the four options: Mon–Fri, Mon–Thu, Mon/Wed/Fri, Every day", JSON.stringify(O.CPCO_OPTS)===JSON.stringify([["12345","Mon–Fri"],["1234","Mon–Thu"],["135","Mon/Wed/Fri"],["0123456","Every day"]])); }

console.log("── 🎯 Checkpoints on 📅 Pace ──");
{ const w=demo("teacher"), O=w.O; w.envcView("pace"); let h=settle(w);
  ok("📅 Pace has the 🎯 Checkpoints card: none yet, a date, a number, core cards / %, + Checkpoint, Save greyed", /\u{1F3AF} Checkpoints<\/div>/u.test(h)&&/None yet — the options then only aim at the goal\./.test(h)&&/onchange="cpCalCpIn\('on',this\.value\)"/.test(h)&&/<option value="pct">% of the core cards<\/option>/.test(h)&&/<button class="envs-btn" onclick="cpCalCpSave\(\)" disabled>Save the checkpoints<\/button>/.test(h));
  const W0=w._envs.writes.length;
  O.cpCalCpIn("on","2026-10-20"); O.cpCalCpIn("n","800"); ok("a past date is refused", O.cpCalCpAdd()===false&&toasted(w,/after today/));
  O.cpCalCpIn("on","2027-01-15"); O.cpCalCpIn("unit","pct"); O.cpCalCpIn("n","120"); ok("…a % over 100 is refused", O.cpCalCpAdd()===false&&toasted(w,/1–100/));
  O.cpCalCpIn("unit","n"); O.cpCalCpIn("n","800"); ok("800 core cards by Jan 15: added to the draft, nothing written yet", O.cpCalCpAdd()===true&&w._envs.writes.length===W0&&/Fri Jan 15<\/b><span style="flex:1;min-width:110px">800 core cards learned/.test(settle(w))&&/1 change to the checkpoints, not saved yet\./.test(w.G.content));
  O.cpCalCpIn("on","2027-01-15"); O.cpCalCpIn("n","900"); ok("…a second one on the same day is refused", O.cpCalCpAdd()===false);
  O.cpCalCpSave(); await w.flush(); const wr=w._envs.writes.slice(W0);
  ok("Save: ONE update at classes/<cid> {checkpoints/2027-01-15: {n: 800}}", wr.length===1&&wr[0].op==="update"&&wr[0].path==="classes/"+CID&&JSON.stringify(wr[0].val)==='{"checkpoints/2027-01-15":{"n":800}}'&&JSON.stringify(w._envc.cls.checkpoints)==='{"2027-01-15":{"n":800}}', wr);
  O.cpCalCpDel("2027-01-15"); ok("✕ then Undo: back as saved, nothing written", O.cpCalCpUpdate(O.cpCalCheckpoints(w._envc.cls),O._cpco.draft).hasOwnProperty("checkpoints/2027-01-15")&&(O.cpCalCpUndo(),O._cpco.draft===null)&&w._envs.writes.length===W0+1);
  w._envc.cls.locks={plan:true}; h=settle(w); const W1=w._envs.writes.length;
  ok("🔒 locks/plan: the inputs and ✕ grey, \"set by\", add / ✕ / save do nothing", /onclick="cpCalCpDel\('2027-01-15'\)"/.test(h)&&/cpcal-x" disabled onclick="cpCalCpDel/.test(h)&&/🔒 set by/u.test(txt(h))&&(O.cpCalCpIn("on","2027-02-01"),O.cpCalCpIn("n","900"),O.cpCalCpAdd())===false&&(O.cpCalCpDel("2027-01-15"),O._cpco.draft===null)&&O.cpCalCpSave()===false&&w._envs.writes.length===W1);
  ok("…and the server refuses it too (rules: locks/plan != true)", /locks\/plan'\)\.val\(\) != true/.test(JSON.parse(fs.readFileSync(path.join(REPO,"envirothon","SITE_RULES.json"),"utf8")).rules.classes.$cid.checkpoints[".write"])); }

console.log("── the demo: 800 by Jan 15 ▸ Parent (Maya) ▸ the options ▸ Mon–Thu ▸ Teacher ▸ 📅 Pace ──");
{ const w=demo("teacher"), O=w.O, P=w.P; w.envcView("pace"); settle(w);
  ok("Teacher ▸ 📅 Pace ▸ 🎯 Checkpoints: 800 by Jan 15 ▸ Save", await addCp(w,"2027-01-15",800)&&w._envc.cls.checkpoints["2027-01-15"].n===800);
  w.envsDemoGo("parent"); let h=settle(w); const card=h.slice(h.indexOf("Our study days"));
  ok("Parent ▸ 📅 Our study days: \"Next checkpoint: 800 core cards learned by Fri Jan 15 · then 95% of the core cards by Area Mar 22\"", /Next checkpoint: <b>800 core cards learned by Fri Jan 15<\/b> · then <b>95% of the core cards by Area Mar 22<\/b>/.test(card));
  const o=opts(card), f=o["Mon–Fri"], t=o["Mon–Thu"], m=o["Mon/Wed/Fri"], e=o["Every day"];
  console.log("       Maya from today: Mon–Fri "+nOf(f)+" · Mon–Thu "+nOf(t)+" · Every day "+nOf(e)+" · Mon/Wed/Fri: "+(m&&m.t));
  ok("the four options, each with new cards a day, minutes, and \"Area ✓\" (those days make the goal too)", f&&t&&m&&e&&/^Mon–Fri \d+ new a day · ~\d+ min · Area ✓$/.test(f.t)&&/^Mon–Thu \d+ new a day · ~\d+ min · Area ✓$/.test(t.t)&&/^Every day \d+ new a day · ~\d+ min · Area ✓$/.test(e.t)&&/Each option meets the checkpoint, worked out from where your child is today/.test(card), Object.keys(o).map(k=>o[k].t));
  ok("…fewer days need more a day: Every day < Mon–Fri < Mon–Thu", nOf(e)<nOf(f)&&nOf(f)<nOf(t));
  ok("…Mon/Wed/Fri can't make it: marked ✗ with what it would reach instead, and can't be picked", m&&/can’t make 800 by Jan 15 · reaches about [\d,]+ even at 50 a day ✗$/.test(m.t)&&m.dis, m);
  ok("…no option is picked yet: \"Until you pick, your child follows the class’s days.\"; CPCAL's own chips still below (\"Or tap your own days\")", !Object.keys(o).some(k=>o[k].on)&&/Until you pick, your child follows the class’s days\./.test(card)&&/Or tap your own days/.test(card)&&(card.match(/onclick="cpCalTap\('ramirez_maya',\d\)"/g)||[]).length===7);
  // the numbers ARE the planner's, from Maya's own state
  const nin=O.cpCalOptions(SID,{sync:true}).nin, fin=Object.assign({},nin,{calendar:{days:"own",wd:"1234",off:w.P.cppInputs(w.P.cppDraft()).calendar.off}});
  const tot=w.P.cpPacePlan(Object.assign({},fin,{days:[]})).total, nf=w.P.cpNeedPerDay(fin).n, nc=w.P.cpNeedPerDay(Object.assign({},fin,{goal:"2027-01-15",end:"2027-01-15",target:800/tot})).n;
  ok("Mon–Thu's number is the real planner's: the larger of what 800 by Jan 15 ("+nc+") and 95% by Area ("+nf+") need from Maya's state", nOf(t)===Math.max(nc,nf)&&nin.from&&Object.keys(nin.from).length>0&&nin.start==="2026-10-29", [nOf(t),nc,nf]);
  const W0=w._envs.writes.length, N=nOf(t); await O.cpCalOptPick(SID,"1234"); await w.flush(); const wr=w._envs.writes.slice(W0);
  ok("pick Mon–Thu: ONE set at students/ramirez_maya/calendar = {days 1234, by uid_p_maya, role parent, at, npd "+N+"}", wr.length===1&&wr[0].op==="set"&&wr[0].path==="students/"+SID+"/calendar"&&wr[0].val.days==="1234"&&wr[0].val.by==="uid_p_maya"&&wr[0].val.role==="parent"&&typeof wr[0].val.at==="number"&&wr[0].val.npd===N&&Object.keys(wr[0].val).length===5, wr);
  h=settle(w); const c2=h.slice(h.indexOf("Our study days")), o2=opts(c2);
  ok("…the card marks it \"✓ your pick\" and says \"Your days: Mon–Thu at "+N+" new a day — ✓ on track for 800 by Jan 15\"", o2["Mon–Thu"].on&&/✓ your pick$/.test(o2["Mon–Thu"].t)&&new RegExp("Your days: Mon–Thu at "+N+" new a day — ✓ on track for 800 by Jan 15").test(txt(c2))&&/<b>Mon–Thu<\/b> <span class="envs-muted">· set by the family/.test(c2));
  ok("…the parent's on-pace card: \""+"Maya gets "+N+" a day\"", new RegExp("Maya gets "+N+" a day\\.").test(h));
  w.envsDemoGo("kid"); const rec=w.envClassOverlay("study","maya",{name:"Envirothon",newPerDay:5,decks:[]});
  ok("Kid: the 🌿 sitting hands out the family's "+N+" new cards a day (envClassOverlay, in memory)", rec&&rec.newPerDay===N, rec&&rec.newPerDay);
  w.envsDemoGo("teacher"); w.envcView("pace"); h=settle(w); const row=h.slice(h.indexOf(">Maya R.</a>"),h.indexOf("</tr>",h.indexOf(">Maya R.</a>")));
  ok("Teacher ▸ 📅 Pace: under Maya \"📅 Mon–Thu · "+N+" a day (their pick) · ✓ 800 by Jan 15\"", new RegExp("📅 Mon–Thu · "+N+" a day \\(their pick\\) · ✓ 800 by Jan 15").test(txt(row).replace(/\\u\{1F4C5\}/g,"📅")), txt(row));
  const r=w.P.cppRow(Object.assign({sid:SID},w._envc.students[SID]),w.P.cppDraft(),w.P.cpPacePlan(w.P.cppInputs(w.P.cppDraft())),{sync:true});
  ok("…her row counts "+N+" a day on her Mon–Thu, and she is on track (not behind): "+(r.verdict&&r.verdict.t), r.npd===N&&r.verdict&&r.verdict.k!=="behind"&&r.need&&r.need.n!=null&&N>=r.need.n, [r.npd,r.verdict,r.need&&r.need.n]);
  ok("…another student: class days at the class's number, ✓ / ✗ against the checkpoint", /📅 class days · \d+ a day · [✓✗] 800 by Jan 15/.test(txt(h).replace(/\\u\{1F4C5\}/g,"📅")));
  w.envcView("student",SID); h=w.G.content; const sp=h.slice(h.indexOf("Study days for Maya R."));
  ok("Teacher ▸ Maya's page: the same options, \"✓ their pick\" on Mon–Thu, \"Their days: Mon–Thu at "+N+" new a day — ✓ on track\"", opts(sp)["Mon–Thu"]&&opts(sp)["Mon–Thu"].on&&/✓ their pick$/.test(opts(sp)["Mon–Thu"].t)&&new RegExp("Their days: Mon–Thu at "+N+" new a day — ✓ on track for 800 by Jan 15").test(txt(sp))&&/Options for Maya that meet the checkpoint, from where Maya is today/.test(txt(sp)));
  const W1=w._envs.writes.length; await O.cpCalOptPick(SID,"12345"); await w.flush(); const tw=w._envs.writes.slice(W1);
  ok("…the teacher can change it: picking Mon–Fri writes ONE set with role teacher and Mon–Fri's own number", tw.length===1&&tw[0].val.days==="12345"&&tw[0].val.role==="teacher"&&tw[0].val.npd===nOf(f), tw); }

console.log("── the teacher's own number wins; Adrienne's 🔒 New cards a day ──");
{ const w=demo("teacher"), O=w.O; w.envcView("pace"); settle(w); await addCp(w,"2027-01-15",800);
  w._envc.students[SID].calendar={days:"1234",by:"uid_p_maya",role:"parent",at:1,npd:26};
  w._envc.students[SID].settings={study:{newPerDay:12}};
  ok("the teacher's own 12 a day wins over the family's 26 (Pace, the layers)", O.cpCalOptNpd(SID)===26&&w.P.cppRow(Object.assign({sid:SID},w._envc.students[SID]),w.P.cppDraft(),null,{sync:true}).npd===12&&JSON.stringify(O.cpCalOptLayers(SID,[{a:1},{study:{newPerDay:12}}]))===JSON.stringify([{a:1},{study:{newPerDay:26}},{study:{newPerDay:12}}]));
  w.envcView("student",SID); settle(w); let h=w.G.content;
  ok("…her page: \"The teacher set 12 new cards a day\", each option at 12 a day (✓ or ✗ with what it reaches)", /The teacher set 12 new cards a day for this student, so each option shows whether 12 a day makes it\./.test(h)&&/12 a day · can’t make/.test(txt(h)));
  delete w._envc.students[SID].settings; w._envcs.locks={newPerDay:true};
  ok("🔒 New cards a day: the family's number is not used (Pace's row = the class's)", O.cpCalOptNpd(SID)===null&&w.P.cppRow(Object.assign({sid:SID},w._envc.students[SID]),w.P.cppDraft(),null,{sync:true}).npd===w.P.cppDraft().npd&&O.cpCalOptLayers(SID,[{},{}]).length===2);
  h=settle(w); const o=O.cpCalOptions(SID,{sync:true});
  ok("…the options show the class's number, 🔒; an option that makes it saves the days with NO npd", /New cards a day is set for the class \(\d+\) 🔒/u.test(txt(h))&&o.fixed&&o.fixed.why==="lock"&&o.rows.every(r=>r.n===o.fixed.n));
  const okRow=o.rows.find(r=>r.ok===true);
  if(okRow){ const W0=w._envs.writes.length; await O.cpCalOptPick(SID,okRow.wd); await w.flush(); ok("…picked: no npd in the record", w._envs.writes.length===W0+1&&!("npd" in w._envs.writes[W0].val)); }
  else { const W0=w._envs.writes.length; ok("…every option is ✗ at the class's number, so none can be picked (nothing written)", (await O.cpCalOptPick(SID,"0123456"))===false&&w._envs.writes.length===W0); } }

console.log("── the switch: ON by default; off = read-only; the parent PIN ──");
{ const w=demo("parent"), O=w.O; delete w._envc.cls.familyDays; let h=settle(w);
  ok("no switch saved: the parent's options are live (Q33 answered)", /onclick="cpCalOptPick\('ramirez_maya','12345'\)"/.test(h)&&!opts(h)["Mon–Fri"].dis);
  w._envc.cls.familyDays=false; h=settle(w); const W0=w._envs.writes.length;
  ok("turned off: the options show greyed under \"Maya’s teacher sets the study days.\", a pick writes nothing", Object.values(opts(h)).every(x=>x.dis)&&/Maya’s teacher sets the study days\./.test(h)&&(await O.cpCalOptPick(SID,"12345"))===false&&w._envs.writes.length===W0);
  const p=W({search:"?demo=1&role=parent",rev:REV+"\nfunction cpdrLocked(){ return G.pinLocked===true; }"}); p.G.pinLocked=true; p.envSiteDemoBoot(); h=settle(p);
  ok("the parent PIN locked: the options grey too, a pick writes nothing", Object.values(opts(h)).every(x=>x.dis)&&(await p.O.cpCalOptPick(SID,"12345"))===false&&p._envs.writes.length===0); }

console.log("── custom days tapped on CPCAL's chips become an option ──");
{ const w=demo("parent"), O=w.O, C=w.C; settle(w); C.cpCalTap(SID,5); C.cpCalTap(SID,2); C.cpCalTap(SID,6); let h=settle(w);
  const o=opts(h), k=Object.keys(o).find(x=>/^Mon, Wed, Thu, Sat/.test(x));
  ok("tap Fri, Tue off and Sat on → \"Mon, Wed, Thu, Sat (tapped below)\" with its own number", k&&/\(tapped below\)/.test(o[k].t)&&nOf(o[k])>0, Object.keys(o));
  const W0=w._envs.writes.length; await O.cpCalOptPick(SID,"1346"); await w.flush(); const wr=w._envs.writes.slice(W0);
  ok("…picking it saves those days and that number in one set; the draft clears", wr.length===1&&wr[0].val.days==="1346"&&wr[0].val.npd===nOf(o[k])&&C._cpcal.draft[SID]===undefined);
  h=settle(w); ok("…then it shows as \"Mon, Wed, Thu, Sat … ✓ your pick\"", Object.keys(opts(h)).some(x=>/^Mon, Wed, Thu, Sat/.test(x)&&opts(h)[x].on));
  await C.cpCalSave(SID); C.cpCalTap(SID,5); await C.cpCalSave(SID); await w.flush();
  ok("CPCAL's own \"Save these days\" still saves days only (no npd) — the family's number then follows the class's", !("npd" in w._envs.writes[w._envs.writes.length-1].val)&&O.cpCalOptNpd(SID)===null); }

console.log("── no checkpoint: the options aim at the goal alone ──");
{ const w=demo("parent"); const h=settle(w);
  ok("\"Goal: 95% of the core cards by Area Mar 22\"; each option meets it", /🎯 Goal: <b>95% of the core cards by Area Mar 22<\/b>/u.test(h)&&/Each option meets the goal,/.test(h)&&Object.keys(opts(h)).length===4); }

console.log("── a goal those days can't make: the checkpoint is the bar, the option says where it leads ──");
{ const w=demo("teacher"), O=w.O; w.envcView("pace"); settle(w); await addCp(w,"2027-01-15",800); w._envc.cls.goal={name:"Area",pct:100};
  w.envsDemoGo("parent"); const h=settle(w), o=opts(h), t=o["Mon–Thu"], ro=O.cpCalOptions(SID,{sync:true}).rows.find(r=>r.wd==="1234");
  ok("100% of core by Area can't be made: Mon–Thu still meets 800 by Jan 15 at its checkpoint number, \"Area ~N%\"", t&&/^Mon–Thu \d+ new a day · ~\d+ min · Area ~\d+%$/.test(t.t)&&!t.dis&&ro.nf===null&&ro.n===ro.nc&&ro.finPct<100, t&&t.t);
  const W0=w._envs.writes.length; await O.cpCalOptPick(SID,"1234"); await w.flush();
  ok("…pickable: ONE set with that number; \"Your days: … ✓ on track for 800 by Jan 15\"", w._envs.writes.length===W0+1&&w._envs.writes[W0].val.npd===ro.nc&&/Your days: Mon–Thu at \d+ new a day — ✓ on track for 800 by Jan 15/.test(txt(settle(w))));
  w._envc.cls.checkpoints={}; const h2=settle(w);
  ok("…with no checkpoint, a goal no option can make leaves every option ✗ (nothing to aim at but the goal)", Object.values(opts(h2)).every(x=>x.dis&&/can’t make Area Mar 22/.test(x.t))); }

console.log("── the kid's / parent's app: the lock listener and the family's record ──");
{ const w=W({remote:{["students/"+SID+"/calendar"]:{days:"1234",by:"uid_p",role:"parent",at:1,npd:22},"settings/locks/newPerDay":null}}), C=w.C, O=w.O;
  w._envs.role="kid"; w._envs.sid=SID; w._envs.kid="maya";
  ok("CPCAL's listener arms ONE more: settings/locks/newPerDay", C.cpCalListen(w.firebase.database(),()=>{})===true&&w.G.listeners.filter(l=>l.p==="settings/locks/newPerDay").length===1&&O.cpCalOptListen(w.firebase.database(),()=>{})===false);
  ok("…the family's 22 a day from the live record; the layers put it between the class's and the student's", O.cpCalOptNpd(SID)===22&&JSON.stringify(O.cpCalOptLayers(SID,[{c:1},{s:1}]))===JSON.stringify([{c:1},{study:{newPerDay:22}},{s:1}]));
  w.G.listeners.find(l=>l.p==="settings/locks/newPerDay").fn({val:()=>true});
  ok("…Adrienne locks New cards a day → the family's number is dropped", O.cpCalOptNpd(SID)===null&&O.cpCalOptLayers(SID,[{c:1},{s:1}]).length===2);
  ok("nothing written", w.G.writes.length===0); }

console.log("── the rules ──");
{ const R=JSON.parse(fs.readFileSync(path.join(REPO,"envirothon","SITE_RULES.json"),"utf8")).rules, c=R.classes.$cid, st=R.students.$sid;
  ok("classes/<cid>/checkpoints: the teacher writes unless locks/plan; <date>: {n 1–20000} or {pct 1–100}, nothing else", /classes\/'\+\$cid\+'\/teacher'\)\.val\(\) == auth\.uid/.test(c.checkpoints[".write"])&&/\[0-9\]\{4\}-/.test(c.checkpoints.$date[".validate"])&&/hasChildren\(\['n'\]\) \|\| newData\.hasChildren\(\['pct'\]\)/.test(c.checkpoints.$date[".validate"])&&/<= 20000/.test(c.checkpoints.$date.n[".validate"])&&/<= 100/.test(c.checkpoints.$date.pct[".validate"])&&c.checkpoints.$date.$other[".validate"]===false);
  ok("students/<sid>/calendar: npd is a number 1–50, refused while Adrienne locks New cards a day; anything else still refused", /isNumber\(\) && newData\.val\(\) >= 1 && newData\.val\(\) <= 50/.test(st.calendar.npd[".validate"])&&/settings\/locks\/newPerDay'\)\.val\(\) != true/.test(st.calendar.npd[".validate"])&&st.calendar.$other[".validate"]===false);
  ok("…the parent writes it unless the class turned familyDays off (on by default)", /familyDays'\)\.val\(\) != false/.test(st.calendar[".write"])&&!/familyDays'\)\.val\(\) == true/.test(st.calendar[".write"])); }

console.log("── Howe / Lincoln: the hooks say no ──");
{ const w=world({fam:{familyId:"howe",roster:["lincoln"]},rev:REV}), O=w.G.opt;
  ok("no edition: no options, no checkpoints card, no row line, no family number, the layers untouched", O.cpCalOptions("howe_lincoln")===null&&O.cpCalOptHtml("howe_lincoln","parent","lincoln")===""&&O.cpCalOptPaceHtml({})===""&&O.cpCalOptRowHtml({sid:"howe_lincoln",npd:5})===""&&O.cpCalOptNpd("howe_lincoln")===null&&(L=>O.cpCalOptLayers("howe_lincoln",L)===L)([{},{}]));
  ok("…no listener, no pick, no add, no save", O.cpCalOptListen(w.firebase.database(),()=>{})===false&&O.cpCalCpAdd()===false&&O.cpCalCpSave()===false);
  await O.cpCalOptPick("howe_lincoln","1234"); await w.flush();
  const rec={name:"Envirothon",newPerDay:5}; ok("…Lincoln's 🌿 record comes back as the very same object", w.envClassOverlay("study","lincoln",rec)===rec);
  ok("nothing read, listened to or written", w.G.reads.length===0&&w.G.listeners.length===0&&w.G.writes.length===0); }

console.log("\n"+pass+" passed, "+fail+" failed");
process.exit(fail?1:0);
};
run().catch(e=>{ console.log("  FAIL- threw "+(e&&e.stack||e)); process.exit(1); });
