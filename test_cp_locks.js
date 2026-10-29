/*
 * Node tests — 🔒 CPLOCKS, Adrienne's locks per class (DESIGN_class_platform_2026-10-28.md §2, §3.2, §3.3, §6.1, §6.3, §6.5, §9,
 * §13 row 15; the design from her answers 2026-10-28: "A locked area shows greyed to the teacher with '🔒 set by Adrienne', and the
 * rules refuse her write").
 *   · where the block sits, how it is hooked (every hook typeof-guarded), Howe / DeWalt inert;
 *   · cpLockParts (pure): which part a write touches;
 *   · the demo: Adrienne locks 📚 Cards ▸ the teacher's 📚 Cards is read-only (the bar, the CSS rule, her writes refused);
 *     📝 Tests the same; Brand ▸ 🏫 Class setup's look greyed with the admin's name; the plan; the units switch; unlock;
 *   · the name is the admin's own (byName), never a literal; live: teachers/<uid>/name → display name → email → "the admin";
 *   · live: a refused write never reaches the database; Adrienne's own writes always go;
 *   · the rules (envirothon/SITE_RULES.json): cards, tests, plan, brand refused while locked; locks + byName admin only.
 * Uses the world from test_env_site.js (its `o.rev` line injects this block and the screens it locks).     run: node test_cp_locks.js
 */
const fs=require("fs"), path=require("path");
const {world,src,REPO}=require("./test_env_site.js");
let pass=0, fail=0;
const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  "+JSON.stringify(x).slice(0,500):"")); } };
const cut=(a,b)=>{ const i=src.indexOf(a); if(i<0) throw new Error("missing "+a); const j=src.indexOf(b,i); return src.slice(i,j+b.length); };
const FAM={familyId:"envirothon",edition:"envirothon",className:"MS Science 2026-27",roster:[]};
const LIB=require(path.join(REPO,"envirothon.js"));
const CID="ms-science-2026";
const CPL=cut("// CPLOCKS_START","// CPLOCKS_END");
const FNS=(CPL.match(/^function (\w+)/gm)||[]).map(s=>s.slice(9));
const CPLX=CPL+"\nG.cpl={ CPL_PARTS, CPL_VIEW, _cpl, "+FNS.join(", ")+" };";
const CPT=cut("// CPTESTS_START","// CPTESTS_END")+"\nG.cpt={ _cpct, cpctModel, cpctHide, cpctListHtml };";
const PACE=cut("// CPPACE_START","// CPPACE_END"), REV=cut("// CPREVIEW_START","// CPREVIEW_END"), FIN=cut("// CPFINAL_START","// CPFINAL_END")+"\nG.fin={ cpFinalSet, cpFinalSave, cpfSections };";
function W(o){ o=o||{}; return world(Object.assign({fam:FAM,envt:true,lib:LIB,rev:REV+"\n"+FIN+"\n"+PACE+"\n"+CPT+"\n"+(o.cpl===false?"":CPLX)},o.w||{})); }
function demo(role,o){ const w=W(Object.assign({},o,{w:Object.assign({search:"?demo=1&role="+(role||"teacher")},(o&&o.w)||{})})); w.envSiteDemoBoot(); w.renderAll(); w.L=w.G.cpl; return w; }
const Wr=w=>w._envs.writes, last=w=>Wr(w)[Wr(w).length-1];
const view=(w,v)=>{ w.envcView("grid"); w.envcView(v); return w.G.content; };
const as=(w,role)=>{ w.envsDemoGo(role); return w; };
const flush=()=>new Promise(r=>setImmediate(r));
const toast=w=>{ const t=w.G.created.filter(e=>e.id==="envs-toast").pop(); return t?t.textContent:""; };

const run=async()=>{
console.log("── the block, where it sits, how it is hooked ──");
{ const a=src.indexOf("// CPLOCKS_START"), b=src.indexOf("// CPLOCKS_END"), c=src.indexOf("// CPCLASS_END");
  ok("CPLOCKS right after CPCLASS_END, once", a>0&&b>a&&src.indexOf("// CPLOCKS_START",a+1)<0&&src.slice(c,a).trim()==="// CPCLASS_END");
  ok("the block only declares (nothing runs at boot)", CPL.split("\n").every(l=>!l.trim()||/^(\/\/|function |const |let | |})/.test(l)));
  ok("the design, the row and the date are in the header", /§6\.5/.test(CPL)&&/§13 row 15/.test(CPL)&&/2026-10-28/.test(CPL));
  ok("no Howe kid name as a code literal; no 🔀", !/["'`](lincoln|ellis|lucy|julian)["'`]/i.test(CPL)&&src.indexOf("\u{1F500}")<0);
  ok("no admin name in the code but the demo's sample admin (one constant)", CPL.split("\n").filter(l=>!/^\s*\/\//.test(l)&&/Adrienne/.test(l)).length===1&&/const CPL_DEMO_ADMIN="Adrienne"/.test(CPL));
  const out=src.slice(0,a)+src.slice(b), re=new RegExp("\\b("+FNS.join("|")+")\\b"), lines=out.split("\n").filter(l=>re.test(l));
  ok("every line outside the block that names one of its functions is typeof-guarded", lines.length>0&&lines.every(l=>(l.match(new RegExp("\\b("+FNS.join("|")+")(?=\\()","g"))||[]).every(f=>new RegExp("typeof "+f+" ?[!=]== ?\"function\"").test(l))), lines.map(l=>l.trim().slice(0,90)));
  const inFn=(f,re)=>{ const i=src.indexOf(f); return i>=0&&re.test(src.slice(i,src.indexOf("\n}\n",i))); };
  ok("envsWrite asks cpLockRefuse before the demo, the dry run or the database", inFn("function envsWrite(",/typeof cpLockRefuse==="function"[^\n]*\n\s*if\(envsDemo\(\)\)/));
  ok("envConsoleHtml draws the bar right before the screen", inFn("function envConsoleHtml(",/h\+=cpLockBarHtml\(v\);[^\n]*\n\s*if\(v==="student"/));
  ok("CPCLASS's look chip + refusal and CPPACE's plan line + refusal read the admin's name", /'Set by '\+\(typeof cpLockName==="function"\?cpLockName\(\)/.test(src)&&/look is set by "\+\(typeof cpLockName/.test(src)&&/section plan is set by "\+\(typeof cpLockName/.test(src)&&/set by '\+\(typeof cpLockName==="function"\?cpLockName\(\):'Adrienne'\)\+'\.'/.test(src)); }

console.log("\n── Howe, DeWalt, Burris: no console, nothing happens ──");
["howe","dewalt","burris"].forEach(f=>{ const w=W({w:{fam:{familyId:f,roster:[]}}}), L=w.G.cpl;
  ok(f+": no bar, no refusal, nothing locked", L.cpLockBarHtml("cpcards")===""&&L.cpLockBarHtml("setup")===""&&L.cpLockRefuse("classCards/c1/d/o1",{hide:true},"set")===""&&L.cpLockSet("cards",true)===false&&w._envs.writes.length===0&&w.G.writes.length===0); });

console.log("\n── cpLockParts (pure) ──");
{ const P=W().G.cpl.cpLockParts;
  ok("classCards / teacherCards → cards; classTests → tests", JSON.stringify(P("classCards/c1/D/o3",{},"set"))==='{"cid":"c1","parts":["cards"]}'&&P("classCards/c1",{},"update").parts[0]==="cards"&&P("teacherCards/c1/D/x",{},"set").parts[0]==="cards"&&P("classTests/c1/forestry/pre",{},"update").parts[0]==="tests");
  ok("classes/<cid>/title|emoji|color → brand; units → units; plan → plan", ["title","emoji","color"].every(k=>P("classes/c1/"+k,"x","set").parts[0]==="brand")&&P("classes/c1/units/u",true,"set").parts[0]==="units"&&P("classes/c1/plan/forestry/pass",80,"set").parts[0]==="plan");
  ok("an update at classes/<cid> is read key by key", JSON.stringify(P("classes/c1",{title:"A",emoji:"🦉","plan/soils/finalAt":80,season:"x"},"update").parts)==='["brand","plan"]');
  ok("everything else touches no part", P("classes/c1",{season:"x",goal:{name:"A"}},"update")===null&&P("classes/c1/settings/study",{newPerDay:3},"update")===null&&P("students/s1/meta",{},"set")===null&&P("release/c1/all/forestry",{},"set")===null&&P("",{},"set")===null); }

console.log("\n── 📚 Cards: Adrienne locks them ▸ the teacher's 📚 Cards is read-only ──");
{ const w=demo("teacher"), L=w.L;
  let h=view(w,"cpcards");
  ok("unlocked: the teacher gets no bar", !/cpl-bar/.test(h));
  as(w,"admin"); h=view(w,"cpcards");
  ok("Adrienne: “🔓 The cards are open to the teacher” + 🔒 Lock", /cpl-bar/.test(h)&&/The cards is open|The cards are open to the teacher/.test(h)&&/onclick="cpLockSet\('cards',true\)"/.test(h));
  const n=Wr(w).length; ok("🔒 Lock writes once", L.cpLockSet("cards",true)===true&&Wr(w).length===n+1); await flush();
  const lw=last(w); ok("…ONE update of classes/<cid>/locks: {cards:true, byName:'Adrienne'}", lw.op==="update"&&lw.path==="classes/"+CID+"/locks"&&lw.val.cards===true&&lw.val.byName==="Adrienne"&&Object.keys(lw.val).length===2, lw);
  ok("…the class holds it, and cpLocked reads it", w._envc.cls.locks.cards===true&&L.cpLocked("cards")===true&&L.cpLocked("tests")===false);
  h=view(w,"cpcards"); ok("Adrienne's bar now: locked, “🔒 set by Adrienne”, 🔓 Unlock — and her own controls stay", /are locked for the teacher/.test(h)&&/set by Adrienne/.test(h)&&/cpLockSet\('cards',false\)/.test(h)&&!/cpl-ro-cards/.test(h));
  as(w,"teacher"); h=view(w,"cpcards");
  const i=h.indexOf("cpl-ro-cards"), j=h.indexOf('<div class="cpcs" id="cpcs">');
  ok("teacher: “🔒 Set by Adrienne” + what is off, right before the cards browser", i>0&&j>i&&/\u{1F512} Set by Adrienne<\/b> · The cards are locked for your class\. You see every card/u.test(h)&&h.slice(h.lastIndexOf("<div",i),j).split('<div class="envs-card').length===2, h.slice(i-60,i+300));
  ok("…no switch for her", !/cpLockSet\(/.test(h));
  const css=L.cplCssText();
  ok("the read-only rule hides ✏️ 🙈 ✕ ＋ 📋 bulk hide and ↩︎ under that bar", [".cpce-acts",".cpce-bulk",".cpce-addbtn",".cpce-plus",".cpce-x",".cpce-qa","#cpce-undo"].every(s=>css.indexOf(".cpl-ro-cards~.cpcs "+s)>=0)&&/#cpce-undo\{display:none!important\}/.test(css));
  ok("…and it is on the page", w.G.created.some(e=>e.id==="cpl-css"&&e.textContent===css));
  const M=w.ccs.cpcsIndex(), c=M.C.find(x=>!x.added), n2=Wr(w).length;
  w.cce.cpceHide(c.i); await flush();
  ok("her hide is refused: nothing written, the toast says who set it", Wr(w).length===n2&&/Set by Adrienne: the cards/.test(toast(w)), toast(w));
  let rej=""; await w.envsWrite("classCards/"+CID+"/x/o1",{hide:true},"set").catch(e=>{ rej=e.message; });
  ok("…envsWrite itself refuses a classCards write", /Set by Adrienne: the cards/.test(rej)&&Wr(w).length===n2);
  let r2=null; await w.envsWrite("classCards/another/x/o1",{hide:true},"set").then(r=>{ r2=r; });
  ok("…another class's path is left to the rules", r2&&r2.path==="classCards/another/x/o1");
  w._envc.cls.locks.byName="Dr. Rivera"; h=view(w,"cpcards");
  ok("the name is the one saved with the lock, not a literal", /Set by Dr\. Rivera/.test(h)&&!/Set by Adrienne/.test(h));
  delete w._envc.cls.locks.byName; ok("…no name saved → “the admin”", /Set by the admin/.test(view(w,"cpcards")));
  as(w,"admin"); const n3=Wr(w).length; w.cce.cpceHide(c.i); await flush();
  ok("Adrienne's own hide still goes", Wr(w).length===n3+1&&last(w).path.indexOf("classCards/"+CID+"/")===0);
  L.cpLockSet("cards",false); await flush();
  ok("🔓 Unlock: {cards:null, byName:null} (the last lock takes the name with it)", last(w).path==="classes/"+CID+"/locks"&&last(w).val.cards===null&&last(w).val.byName===null&&!w._envc.cls.locks.cards&&!("byName" in w._envc.cls.locks), last(w));
  as(w,"teacher"); ok("…the teacher's browser is hers again", !/cpl-ro-cards/.test(view(w,"cpcards"))); }

console.log("\n── 📝 Tests: the same ──");
{ const w=demo("admin"), L=w.L; let h=view(w,"cptests");
  ok("Adrienne: the 🔒 Lock switch on 📝 Tests", /onclick="cpLockSet\('tests',true\)"/.test(h));
  L.cpLockSet("tests",true); await flush(); as(w,"teacher"); h=view(w,"cptests");
  const i=h.indexOf("cpl-ro-tests"), j=h.indexOf('<div class="cpcs cpct" id="cpct">');
  ok("teacher: “🔒 Set by Adrienne · The tests are locked…” right before the tests browser", i>0&&j>i&&/The tests are locked for your class/.test(h));
  ok("the rule hides ✏️ 🙈 ✕ ＋ ↑ ↓ (the acts row), the edit box and ↩︎", [".cpce-acts",".cpce-addbtn",".cpce-plus",".cpce-x",".cpct-ed","#cpct-add","#cpct-undo"].every(s=>L.cplCssText().indexOf(".cpl-ro-tests~.cpct "+s)>=0));
  const T=w.G.cpt, M=T.cpctModel(), F=M.secs[0].forms.find(f=>!f.same), it=F.items[0], n=Wr(w).length;
  T.cpctHide(F.key+"|"+it.id); await flush();
  ok("her remove is refused, nothing written", Wr(w).length===n&&/Set by Adrienne: the tests/.test(toast(w)), toast(w));
  ok("📚 Cards stays open (one lock, one part)", !/cpl-ro-cards/.test(view(w,"cpcards"))); }

console.log("\n── 🎨 Brand: Adrienne locks the look ▸ 🏫 Class setup's color, emoji and title are greyed ──");
{ const w=demo("admin"), L=w.L; let h=view(w,"setup");
  const k=h.indexOf("Locks for the teacher");
  ok("Adrienne's 🏫 Class setup opens with “🔒 Locks for the teacher”: a switch for each of the five parts", k>0&&k<h.indexOf("The class’s look")&&L.CPL_PARTS.map(p=>p.k).join()==="brand,units,cards,tests,plan"&&L.CPL_PARTS.every(p=>h.indexOf("cpLockSet('"+p.k+"',true)")>0));
  ok("…the plan reads the class's own word", /Station plan/.test(h));
  L.cpLockSet("brand",true); await flush();
  ok("one update: {brand:true, byName}", last(w).path==="classes/"+CID+"/locks"&&last(w).val.brand===true&&last(w).val.byName==="Adrienne");
  as(w,"teacher"); h=view(w,"setup"); const look=h.slice(h.indexOf("The class’s look"),h.indexOf("The season"));
  ok("teacher: the look greyed — title, emoji, swatches, Save — with “🔒 Set by Adrienne”", /\u{1F512} Set by Adrienne/u.test(look)&&/id="cp-title"[^>]*disabled/.test(look)&&/ disabled onclick="cpSet\('emoji'/.test(look)&&/ disabled onclick="cpSet\('color'/.test(look));
  ok("…and the top of Class setup lists it: “🔒 Set by Adrienne: 🎨 the look”", /cpl-ro"[^>]*><b>\u{1F512} Set by Adrienne:<\/b> \u{1F3A8} the look\./u.test(h)&&!/cpLockSet\(/.test(h));
  const n=Wr(w).length; w.cp.cpSet("title","Nope"); ok("her look save is refused", w.cp.cpSave("look")===false&&Wr(w).length===n);
  let rej=""; await w.envsWrite("classes/"+CID,{title:"Nope",season:"x"},"update").catch(e=>{ rej=e.message; });
  ok("…and a brand key inside any update at classes/<cid> is refused too", /the look/.test(rej)&&Wr(w).length===n);
  let ok2=null; await w.envsWrite("classes/"+CID,{season:"2027-28"},"update").then(r=>{ ok2=r; });
  ok("…while her season still saves", ok2&&ok2.val.season==="2027-28");
  w._envc.cls.locks.byName="Dr. Rivera"; ok("the chip reads the saved name", /Set by Dr\. Rivera/.test(view(w,"setup"))); }

console.log("\n── 📋 The plan: Adrienne locks it ▸ the section plan greyed, its save refused; 📅 Pace says so ──");
{ const w=demo("admin"), L=w.L; let h=view(w,"pace");
  ok("Adrienne: the 🔒 Lock switch on 📅 Pace", /onclick="cpLockSet\('plan',true\)"/.test(h)&&/The station plan is open to the teacher/.test(h));
  L.cpLockSet("plan",true); await flush(); as(w,"teacher"); h=view(w,"setup");
  ok("teacher's Class setup: the bar carries the plan's read-only rule", /cpl-bar cpl-ro cpl-ro-plan/.test(h)&&/\u{1F4CB} the station plan/u.test(h));
  ok("the rule greys the section plan's boxes, Save and Cancel and the skills' “final waits” tick", ['[onchange^="cpFinal"]','[onclick^="cpFinal"]','[onchange^="cpSkill"]'].every(s=>L.cplCssText().indexOf(".cpl-ro-plan~.envs-card "+s)>=0)&&/pointer-events:none/.test(L.cplCssText()));
  const S=w.G.fin.cpfSections(), n=Wr(w).length; w.G.fin.cpFinalSet(S[0].id,"pass","70"); w.G.fin.cpFinalSave(); await flush();
  ok("the section plan's save is refused, nothing written", Wr(w).length===n&&/Set by Adrienne: the station plan/.test(toast(w))&&!/: the plan/.test(toast(w)), toast(w));
  h=view(w,"pace"); ok("📅 Pace: “🔒 Set by Adrienne · The station plan is locked…”; Core only greyed by CPPACE with the same name", /cpl-ro-plan/.test(h)&&/The station plan is locked for your class/.test(h)&&/\u{1F512} set by Adrienne\./u.test(h)); }

console.log("\n── 📦 Units: Adrienne's switch on her 📦 Units screen ──");
{ const w=demo("admin"), L=w.L; let h=view(w,"units");
  ok("📦 Units: the 🔒 Lock switch", /onclick="cpLockSet\('units',true\)"/.test(h));
  L.cpLockSet("units",true); await flush(); as(w,"teacher");
  ok("teacher's Class setup lists 📦 the units as set by Adrienne", /\u{1F4E6} the units/u.test(view(w,"setup")));
  ok("a part name the class doesn't know is refused", w.envsDemoGo("admin")===undefined&&L.cpLockSet("nope",true)===false); }

console.log("\n── the admin's own name, live ──");
{ const live=(o)=>{ const w=W({w:Object.assign({fam:FAM},o||{})}); w._envs.role="admin"; w._envs.uid="a1"; w._envc.sdb=w.firebase.database(); w._envc.cid="c1"; w._envs.cid="c1"; w._envc.cls={name:"C1",teacher:"t1"}; w._envc.teachers={}; return w; };
  let w=live(); w._envc.teachers.a1={name:"Ms. Howe"}; ok("teachers/<uid>/name first", w.G.cpl.cpLockMe()==="Ms. Howe");
  w=live({auth:{uid:"a1",email:"x@y.z",displayName:"Adrienne H."}}); ok("…else the sign-in's display name", w.G.cpl.cpLockMe()==="Adrienne H.");
  w=live(); w._envs.email="sam.lee@school.org"; ok("…else the email's first word", w.G.cpl.cpLockMe()==="Sam");
  w=live(); w._envs.email=""; ok("…else “the admin”", w.G.cpl.cpLockMe()==="the admin");
  w=live(); w._envs.email="pat@x.org"; w.G.cpl.cpLockSet("tests",true); await flush();
  ok("live: ONE update at classes/c1/locks with her name", JSON.stringify(w.G.writes)===JSON.stringify([["update","classes/c1/locks",{tests:true,byName:"Pat"}]]), w.G.writes); }

console.log("\n── live teacher: a refused write never reaches the database; dry run unchanged ──");
{ const live=dry=>{ const w=W({w:{fam:FAM,dry}}); w._envs.role="teacher"; w._envs.uid="t1"; w._envc.sdb=w.firebase.database(); w._envc.cid="c1"; w._envs.cid="c1"; w._envc.cls={name:"C1",teacher:"t1",locks:{cards:true,byName:"Pat"}}; return w; };
  const w=live(false); let rej=""; await w.envsWrite("classCards/c1/D/o1",{hide:true,name:"x",by:"t1",ts:1},"set").catch(e=>{ rej=e.message; });
  ok("locked: rejected with “🔒 Set by Pat: the cards”, nothing written", rej==="\u{1F512} Set by Pat: the cards"&&w.G.writes.length===0);
  await w.envsWrite("classTests/c1/forestry/pre",{ver:1},"update");
  ok("an unlocked part writes as before", w.G.writes.length===1&&w.G.writes[0][1]==="classTests/c1/forestry/pre");
  const d=live(true); await d.envsWrite("classTests/c1/forestry/pre",{ver:1},"update"); ok("dry run: nothing, as before", d.G.writes.length===0);
  const k=W({w:{fam:FAM}}); k._envs.role="kid"; ok("a kid's or parent's page is never asked", k.G.cpl.cpLockRefuse("classCards/c1/D/o1",{},"set")===""); }

console.log("\n── the rules (envirothon/SITE_RULES.json) ──");
{ const J=JSON.parse(fs.readFileSync(path.join(REPO,"envirothon","SITE_RULES.json"),"utf8")), R=J.rules, C=R.classes.$cid;
  const lk=(k,s)=>s.indexOf("root.child('classes/'+$cid+'/locks/"+k+"').val() != true")>=0;
  ok("classCards: the teacher's card write needs locks/cards off; the admin's never does", lk("cards",R.classCards.$cid.$deck.$card[".write"])&&/\|\| root\.child\('admins\/'\+auth\.uid\)\.val\(\) == true\)$/.test(R.classCards.$cid.$deck.$card[".write"]));
  ok("classTests: the teacher's form write needs locks/tests off", lk("tests",R.classTests.$cid.$sec.$form[".write"])&&/admins/.test(R.classTests.$cid.$sec.$form[".write"]));
  ok("classes/<cid>/plan: the teacher's write needs locks/plan off (the admin writes the whole class)", lk("plan",C.plan[".write"])&&/admins/.test(C[".write"]));
  ok("title, emoji, color: refused while locks/brand", ["title","emoji","color"].every(k=>lk("brand",C[k][".write"])));
  ok("units and locks: no teacher write at all", !C.units[".write"]&&!C.locks[".write"]&&!/teacher/.test(C[".write"]));
  ok("locks: booleans, plus byName = 1–40 characters", C.locks.$k[".validate"]==="newData.isBoolean()"&&/isString\(\)/.test(C.locks.byName[".validate"])&&/<= 40/.test(C.locks.byName[".validate"]));
  ok("the old teacherCards path honours the cards lock too", lk("cards",R.teacherCards.$cid.$deck.$card[".write"]));
  ok("_about explains CPLOCKS", /CPLOCKS/.test(J._about)&&/byName/.test(J._about));
  const setup=fs.readFileSync(path.join(REPO,"envirothon","SITE_SETUP.md"),"utf8");
  ok("SITE_SETUP.md explains the locks", /locks\/\{brand, units, cards, tests, plan\}/.test(setup)&&/byName/.test(setup)); }

console.log("\n"+pass+" passed, "+fail+" failed");
process.exit(fail?1:0);
};
run().catch(e=>{ console.log("CRASH "+(e&&e.stack||e)); process.exit(1); });
