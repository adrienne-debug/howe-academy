/*
 * Node tests — 🚩 CPFLAG, "Flag it for the teacher" (DESIGN_class_platform_2026-10-28.md "Adrienne's asks, 2026-10-30 (from Brittany)" part 2;
 * her words 2026-10-30: "on the questions, or basically on anything, if there could be a flag and note that either the parents or the kids
 * could, and that would send it, that particular card, to the teacher").
 *   · where the block sits and how it is hooked (one typeof-guarded line each, tagged 🚩 CPFLAG);
 *   · NO 🚩 on a check-in or final question that isn't finished — only on the results screen;
 *   · the demo walk: Kid ▸ 🌿 card ▸ 🚩 ▸ 🖼 Bad or missing picture + note ▸ Send ▸ Teacher ▸ 🚩 Flags (1) ▸ Fix it opens that card ▸
 *     ✓ Fixed ▸ Parent page shows it fixed; one flag per item until answered; Reply; Reopen; the teacher's name;
 *   · the question, skill, picture and parent-drill flags; Fix it on a question opens it in 📝 Tests; Adrienne sees every class;
 *   · Howe / DeWalt / Burris: inert. Live: the family's one query, the console's listener. The rules (flags, classes/<cid>/teacherName).
 *                                                                                                                  run: node test_cp_flag.js
 */
const fs=require("fs"), path=require("path");
const {world,src,REPO}=require("./test_env_site.js");
let pass=0, fail=0;
const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  "+JSON.stringify(x).slice(0,600):"")); } };
const FAM={familyId:"envirothon",edition:"envirothon",className:"MS Science 2026-27",roster:[]};
const LIB=require(path.join(REPO,"envirothon.js"));
const cut=(a,b)=>{ const i=src.indexOf(a); if(i<0) throw new Error("missing "+a); const j=src.indexOf(b,i); return src.slice(i,j+b.length); };
function fn(name){ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name);
  let d=0; for(let k=src.indexOf("{",i);k<src.length;k++){ if(src[k]==="{") d++; else if(src[k]==="}"){ d--; if(!d) return src.slice(i,k+1); } } }
const FL=cut("// CPFLAG_START","// CPFLAG_END"), CPT=cut("// CPTESTS_START","// CPTESTS_END");
const API="_cpfl, CPFL_REASONS, cpflKidOn, cpflConOn, cpflTeacher, cpflMap, cpflKeyOf, cpflMine, cpflOpenFor, cpflCardKey, cpflCardIt, cpflQIt, cpflSkillIt, cpflPhotoIt, cpflBtnHtml, cpflTap, cpflReason, cpflNote, cpflCancel, cpflRec, cpflSend, cpFlagCardHtml, cpFlagDrillHtml, cpFlagTestHtml, cpflTestFold, cpFlagSkillHtml, cpFlagPhotoHtml, cpFlagParentHtml, cpflFold, cpflKidLoad, cpflConStart, cpflList, cpflOpenN, cpflChips, cpflWhere, cpflHtml, cpflTab, cpflSet, cpflRepOpen, cpflRepIn, cpflReply, cpflNameOpen, cpflNameIn, cpflNameSave, cpflFix";
const REV=CPT+"\n"+FL+"\nG.fl={ "+API+", get envtState(){ return envtState; }, set envtState(v){ envtState=v; }, envtHtml, get cpcs(){ return _cpcs; }, get cpct(){ return _cpct; }, cpcsIndex, cpcsListHtml, cpctListHtml };";
function W(o){ o=o||{}; const w=world(Object.assign({fam:FAM,envt:true,lib:LIB,rev:REV},o)); w.F=w.G.fl; return w; }
function demo(role,o){ const w=W(Object.assign({search:"?demo=1&role="+(role||"kid")},o||{})); w.envSiteDemoBoot(); w.renderAll(); return w; }
const CID="ms-science-2026", SID="ramirez_maya";
const text=h=>String(h).replace(/<[^>]*>/g,"");
const hashOf=h=>{ const m=/cpflTap\('(h[a-z0-9]+)'\)/.exec(h); return m&&m[1]; };
const flagW=w=>w._envs.writes.filter(x=>/^flags\//.test(x.path));
const DECK="Forestry · Terms", CARD=LIB.unit.decks.find(d=>d.key===DECK).cards[2];

const run=async()=>{
console.log("── the block, where it sits, how it is hooked ──");
{ const a=src.indexOf("// CPFLAG_START"), b=src.indexOf("// CPFLAG_END"), e=src.indexOf("// CPCARDSEDIT_END");
  ok("CPFLAG exactly once, right after CPCARDSEDIT_END", a>0&&b>a&&src.indexOf("// CPFLAG_START",a+1)<0&&src.slice(e,a).trim()==="// CPCARDSEDIT_END");
  ok("the header carries her words and the date", /basically on anything, if there could be a flag and note/.test(FL)&&/2026-10-30/.test(FL)&&/LINCOLN \/ ADRIENNE FROM HOWE/.test(FL));
  ok("the block only declares (nothing runs at boot)", FL.split("\n").every(l=>!l.trim()||/^(\/\/|function |const | |\})/.test(l)));
  const code=FL.replace(/^\/\/.*$/mg,"");
  ok("writes only through envsWrite (the flag, the teacher's update, her name) — no db.ref, no firebase", (code.match(/envsWrite\(/g)||[]).length===3&&!/firebase\.|\bdb\.ref|\.set\(|\.update\(|\.remove\(/.test(code));
  ok("one read for a family (the by query) and the console's own envcSub listeners", (code.match(/\.on\("value"/g)||[]).length===1&&/orderByChild\("by"\)\.equalTo\(_envs\.sid\)/.test(code)&&/envcSub\("cpflAll","flags"/.test(code)&&/envcSub\("cpfl:"\+cid,"flags\/"\+cid/.test(code)&&!/\.once\(/.test(code));
  ok("no Howe kid name, no teacher's name as a literal", !/["'`](lincoln|ellis|lucy|julian)["'`]/i.test(code)&&!/Brittany/.test(code));
  const hooks=src.split("\n").filter(l=>/🚩 CPFLAG/.test(l)&&!/^\/\//.test(l.trim()));
  ok("exactly 9 hook lines, each typeof-guarded and tagged", hooks.length===9&&hooks.every(l=>{ const f=(l.match(/\b(cpFlag\w+|cpfl\w+)(?=\()/g)||[]); return f.length&&f.every(n=>new RegExp('typeof '+n+'==="function"').test(l)); }), hooks.map(l=>l.trim().slice(0,80)));
  ok("…the 🌿 sitting (after ← Back / Forward →), the parent's drill, the results screen, skills, ID Flash, the parent page, the console's chip + view, the kid's load",
    /h\+=mstNavBtns\(\);[^\n]*\n      if\(typeof cpFlagCardHtml==="function"\) h\+=cpFlagCardHtml\(session,card\);/.test(fn("renderMastStudy"))&&/cpFlagDrillHtml\(kid,it,back\)/.test(fn("cpdrDrillHtml"))&&/cpFlagTestHtml\(S\)/.test(fn("envtHtml"))&&/cpFlagSkillHtml\(r\)/.test(fn("cpSkillSittingHtml"))&&/cpFlagPhotoHtml\(c\)/.test(fn("envFlashSittingHtml"))&&/cpFlagParentHtml\(kid\)/.test(fn("envsParentHtml"))&&/cpflChips\(chips\)/.test(fn("envConsoleHtml"))&&/v==="cpflags"&&typeof cpflHtml==="function"\) h\+=cpflHtml\(\)/.test(fn("envConsoleHtml"))&&/cpflKidLoad\(sdb,cid\)/.test(fn("envClsKidLoad")));
  const E=fn("envtHtml"), d=E.indexOf("if(S.done){"), hk=E.indexOf("cpFlagTestHtml"), ret=E.indexOf("return h+'</div>'; }",d), q=E.indexOf("const it=S.form.items[S.i]");
  ok("envtHtml: the hook sits inside the results branch, before its return — every question screen returns without reaching it", d>0&&hk>d&&hk<ret&&ret<q);
  ok("ID Flash: the hook sits in the answered branch (f.ans), not on the timed picture", (()=>{ const F=fn("envFlashSittingHtml"), a1=F.indexOf("if(f.ans){"), h1=F.indexOf("cpFlagPhotoHtml"), e1=F.indexOf("} else if(f.mode===\"type\")"); return a1>0&&h1>a1&&h1<e1; })());
  ok("no 🔀 in index.html", src.indexOf("\u{1F500}")<0); }

console.log("\n── Howe, DeWalt, Burris: inert ──");
for(const f of ["howe","dewalt","burris"]){ const w=W({fam:{familyId:f,roster:[]}}), F=w.F, chips=[["grid","x"],["roster","y"]], before=JSON.stringify(chips);
  const S={kid:"lincoln",station:"forestry",which:"pre",form:{items:[{n:1,q:"q?",choices:["a","b"],ans:0}]},answers:[0],i:0,done:{right:1,n:1,pass:true}};
  ok(f+": every hook target draws nothing and the chips come back untouched", F.cpFlagCardHtml({sid:"envirothon"},{deck:DECK,name:"Cambium"})===""&&F.cpFlagDrillHtml("lincoln",{prompt:"Cambium",subject:DECK},"b")===""&&F.cpFlagTestHtml(S)===""&&F.cpFlagSkillHtml({sk:{key:"x"},prob:{},checked:{ok:true}})===""&&F.cpFlagPhotoHtml({deck:"d",item:"i",pic:{url:"u"}})===""&&F.cpFlagParentHtml("lincoln")===""&&F.cpflChips(chips)===chips&&JSON.stringify(chips)===before&&F.cpflHtml()===""&&F.cpflKidLoad({ref(){ throw new Error("read"); }},"c1")===false&&F.cpflConStart()===false);
  ok(f+": …and nothing read, listened to or written", w.G.reads.length===0&&w.G.listeners.length===0&&w.G.writes.length===0&&w._envs.writes.length===0); }

console.log("\n── a check-in or final: no 🚩 until it is finished ──");
{ const w=demo("kid"), F=w.F, items=LIB.tests.forestry.pre.items.slice(0,3);
  F.envtState={kid:"maya",station:"forestry",which:"pre",form:{form:"F",items},i:0,answers:items.map(()=>null),started:Date.now(),done:null};
  const q0=F.envtHtml(); F.envtState.answers[0]=1; const q1=F.envtHtml(); F.envtState.i=2; F.envtState.answers=[1,0,null]; const q2=F.envtHtml();
  ok("an unanswered question: no 🚩, no flag button, no form", !/🚩|cpfl/.test(q0)&&/Next/.test(q0));
  ok("an answered question before Finish: still none (it can't signal answers)", !/🚩|cpfl/.test(q1)&&!/🚩|cpfl/.test(q2));
  ok("cpFlagTestHtml itself says no while the test is running", F.cpFlagTestHtml(F.envtState)==="");
  F.envtState.answers=[1,0,2]; F.envtState.done={right:2,n:3,pass:false,grad:false,saved:false}; const r0=F.envtHtml();
  ok("the results screen: '▸ 🚩 Something wrong with a question?' (folded) after the score", /▸ 🚩 Something wrong with a question\?/.test(text(r0))&&r0.indexOf("of 3")<r0.indexOf("Something wrong"));
  F.cpflTestFold(); const r1=F.envtHtml();
  ok("…opened: each question with its own 🚩 Flag it, no right answers marked", (r1.match(/🚩 Flag it/g)||[]).length===3&&/Q1\. /.test(text(r1))&&!/✓/.test(text(r1).replace(/✓ Sent[^]*$/,"")));
  const h=hashOf(r1); F.cpflTap(h); const r2=F.envtHtml();
  ok("…a tap opens the form with that question's choices A) … and the four reasons", /A\) /.test(text(r2))&&F.CPFL_REASONS.every(r=>text(r2).indexOf(r[1])>=0)&&/Send/.test(r2));
  F.cpflReason(h,"wrong"); F.cpflNote("Two answers look right"); await F.cpflSend(h);
  const fw=flagW(w), v=(fw[0]||{}).val||{};
  ok("Send → ONE 'would set' of flags/<cid>/<id>: what question, ref {sec, form, q, n}, the question + choices as text", fw.length===1&&fw[0].op==="set"&&new RegExp("^flags/"+CID+"/f[a-z0-9]{6,24}$").test(fw[0].path)&&v.what==="question"&&v.ref.sec==="forestry"&&v.ref.form==="pre"&&v.ref.q==="pre-"+items[0].n&&v.ref.n===items[0].n&&/^Q1\. /.test(v.text)&&/\nA\) /.test(v.text)&&v.reason==="wrong"&&v.note==="Two answers look right", v);
  ok("…'✓ Sent to Ms. Brittany, thanks!' (the class's teacher record, not a literal)", /✓ Sent to Ms\. Brittany, thanks!/.test(text(F.envtHtml()))); }

console.log("\n── the demo walk: Kid ▸ 🌿 card ▸ 🚩 ▸ Teacher ▸ Fix it ▸ ✓ Fixed ▸ Parent ──");
{ const w=demo("kid"), F=w.F, ses={sid:"envirothon",name:"Envirothon"}, card={deck:DECK,name:CARD.name};
  const h0=F.cpFlagCardHtml(ses,card), h=hashOf(h0);
  ok("under the 🌿 card: '🚩 Flag it' (aria: Flag this card for the teacher)", /🚩 Flag it/.test(h0)&&/aria-label="Flag this card for the teacher"/.test(h0)&&!!h);
  F.cpflTap(h); const f1=F.cpFlagCardHtml(ses,card);
  ok("tap → the form: 'Tell Ms. Brittany about this card', four reasons, a note box of 300, Send off until a reason, Cancel", /Tell Ms\. Brittany about this card/.test(text(f1))&&(f1.match(/cpflReason\(/g)||[]).length===4&&/maxlength="300"/.test(f1)&&/cpflSend\('h[a-z0-9]+'\)" disabled/.test(f1)&&/Cancel/.test(f1));
  ok("…Send does nothing without a reason", (await F.cpflSend(h))===false&&flagW(w).length===0);
  F.cpflReason(h,"pic"); F.cpflNote("x".repeat(400)); ok("…the note keeps at most 300 characters", F._cpfl.note.length===300);
  F.cpflNote("The picture shows a different tree"); await F.cpflSend(h);
  const fw=flagW(w), v=(fw[0]||{}).val||{};
  ok("Send → ONE 'would set': {what, ref, text, reason, by, role, at, status, note} — nothing else", fw.length===1&&JSON.stringify(Object.keys(v).sort())===JSON.stringify(["at","by","note","reason","ref","role","status","text","what"])&&v.what==="card"&&v.by===SID&&v.role==="kid"&&v.status==="open"&&v.reason==="pic"&&typeof v.at==="number", v);
  ok("…ref = the deck, the card's key (o<order>) and its front; text = Front / Back", v.ref.deck===DECK&&v.ref.card==="o"+CARD.order&&v.ref.name===CARD.name&&/^Front: /.test(v.text), v.ref);
  ok("…nothing really written (the demo)", w.G.writes.length===0);
  const s1=F.cpFlagCardHtml(ses,card); ok("…'✓ Sent to Ms. Brittany, thanks!'", /✓ Sent to Ms\. Brittany, thanks!/.test(text(s1)));
  F.cpFlagCardHtml(ses,{deck:DECK,name:"Something else"}); F.cpflTap(hashOf(F.cpFlagCardHtml(ses,{deck:DECK,name:"Something else"}))); F.cpflCancel();
  const s2=F.cpFlagCardHtml(ses,card);
  ok("back on the same card: '🚩 Flagged'; a tap reads 'You flagged this on …' — no second form", /🚩 Flagged/.test(s2)&&(()=>{ F.cpflTap(hashOf(s2)); const t=text(F.cpFlagCardHtml(ses,card)); return /You flagged this on \w{3} \w{3} \d+\. Ms\. Brittany hasn’t answered yet\./.test(t)&&!/Send/.test(t); })());
  F._cpfl.open=F.cpflKeyOf("card",v.ref); F._cpfl.reason="wrong"; ok("…and a second Send for it is refused", (await F.cpflSend(hashOf(s2)))===false&&flagW(w).length===1);

  w.envsDemoGo("teacher"); w.renderAll();
  ok("Teacher: the console's chip reads '🚩 Flags (1)', before 👥 Roster", /🚩 Flags \(1\)/.test(w.G.content)&&w.G.content.indexOf("🚩 Flags (1)")<w.G.content.indexOf("👥 Roster"));
  w.envcView("cpflags"); const t0=w.G.content, tt=text(t0);
  ok("🚩 Flags: Open · 1, the card, its deck and front, the text, '🖼 Bad or missing picture', the note, 'Maya R.' and when", /Open · 1/.test(tt)&&/Done · 0/.test(tt)&&/🃏 Card/.test(tt)&&tt.indexOf(DECK+" · "+CARD.name)>=0&&/🖼 Bad or missing picture/.test(tt)&&/“The picture shows a different tree”/.test(tt)&&/Maya R\. · \w{3} \w{3} \d+ \d+:\d\d [AP]M/.test(tt), tt.slice(0,700));
  ok("…buttons: 🔧 Fix it, ✓ Fixed, Not a problem, 💬 Reply; and the name line 'Families see “Sent to Ms. Brittany, thanks!”'", /🔧 Fix it/.test(tt)&&/✓ Fixed/.test(tt)&&/Not a problem/.test(tt)&&/💬 Reply/.test(tt)&&/Families see “Sent to Ms\. Brittany, thanks!”/.test(tt));
  const L=F.cpflList(), r=L[0]; F.cpflFix(r.cid,r.id);
  const C=F.cpcs, M=F.cpcsIndex(), c=M&&M.C[C.or];
  ok("Fix it → 📚 Cards with that very card open (section, Key Concept, the card)", w._envc.view==="cpcards"&&!!c&&c.name===CARD.name&&c.deck===DECK&&C.os===c.sec&&C.og===c.g.key, c&&c.name);
  ok("…its row is drawn open in the list", new RegExp('id="cpcs-r-'+C.or+'"').test(F.cpcsListHtml())&&/cpcs-row open/.test(F.cpcsListHtml()));
  w.envcView("cpflags"); await F.cpflSet(r.cid,r.id,"fixed");
  const u=flagW(w).slice(-1)[0];
  ok("✓ Fixed → ONE 'would update' of flags/<cid>/<id> = {status fixed, doneBy, doneAt}", u.op==="update"&&u.path==="flags/"+CID+"/"+r.id&&u.val.status==="fixed"&&u.val.doneBy==="uid_teacher_demo"&&typeof u.val.doneAt==="number"&&Object.keys(u.val).length===3, u);
  ok("…Open · 0, the chip loses its count; Done · 1 lists it '✅ Fixed' with ↩ Reopen", /Open · 0/.test(text(w.G.content))&&/>🚩 Flags</.test(w.G.content)&&(F.cpflTab("done"),/✅ Fixed/.test(text(w.G.content))&&/↩ Reopen/.test(w.G.content)));
  F.cpflRepOpen(r.cid,r.id); ok("💬 Reply opens a 300-character box", /id="cpfl-rep" maxlength="300"/.test(w.G.content));
  F.cpflRepIn("Thanks! I swapped the picture."); await F.cpflReply(r.cid,r.id); const ru=flagW(w).slice(-1)[0];
  ok("…Send reply → ONE update {reply, rBy, rAt}", ru.op==="update"&&ru.val.reply==="Thanks! I swapped the picture."&&ru.val.rBy==="uid_teacher_demo"&&typeof ru.val.rAt==="number");

  w.envsDemoGo("parent"); const p0=text(w.G.content);
  ok("Parent page: '▸ 🚩 Things you flagged · 1' (folded)", /▸ 🚩 Things you flagged · 1/.test(p0)&&!/✅ Fixed/.test(p0), p0.slice(-600));
  F.cpflFold(); const p1=text(w.G.content);
  ok("…opened: the card, '✅ Fixed', the reason and note, and Ms. Brittany's reply", /🃏 Card/.test(p1)&&/✅ Fixed/.test(p1)&&/🖼 Bad or missing picture · “The picture shows a different tree”/.test(p1)&&/Ms\. Brittany: Thanks! I swapped the picture\./.test(p1));
  w.envsDemoGo("kid"); const k1=F.cpFlagCardHtml(ses,card);
  ok("answered → the kid can flag that card again (🚩 Flag it, not Flagged)", /🚩 Flag it/.test(k1)&&!/Flagged/.test(k1)); }

{ const w=demo("teacher"), F=w.F, other=LIB.unit.decks.find(d=>d.key===DECK).cards[0];
  F._cpfl.demo={[CID]:{fk1k2k3k4:{what:"card",ref:{deck:DECK,card:"o"+other.order,name:CARD.name},text:"Front: "+CARD.name,reason:"wrong",by:SID,role:"kid",at:Date.now(),status:"open"}}};
  w.envcView("cpflags"); F.cpflFix(CID,"fk1k2k3k4"); const C=F.cpcs, c=F.cpcsIndex().C[C.or];
  ok("Fix it opens the card by its FRONT, even when the key it carried points at another card (the demo's sample deck numbers cards its own way)", !!c&&c.name===CARD.name&&other.name!==CARD.name, c&&c.name); }

console.log("\n── the other places: the parent's drill, a skill, ID Flash ──");
{ const w=demo("parent"), F=w.F; const d=F.cpFlagDrillHtml("maya",{prompt:CARD.name,subject:DECK},"the back"), h=hashOf(d);
  F.cpflTap(h); F.cpflReason(h,"typo"); await F.cpflSend(h); const v=flagW(w)[0].val;
  ok("the parent's 🧠 drill card: a flag with role parent and the back the parent read", /🚩 Flag it/.test(d)&&v.role==="parent"&&v.what==="card"&&/Back: the back/.test(v.text)&&!("note" in v)); }
{ const w=demo("kid"), F=w.F, r={sk:{key:"gear.tools",label:"Gear",type:"none"},prob:{item:{name:"Clinometer"},photo:{url:"envirothon/pics/x.jpg"},steps:[{label:"What is it?",choices:["Clinometer","Increment borer"]}]},n:2,stage:"solo"};
  ok("a skill problem: nothing before Check", F.cpFlagSkillHtml(r)==="");
  r.checked={ok:false,step:0}; const s=F.cpFlagSkillHtml(r), h=hashOf(s); F.cpflTap(h); F.cpflReason(h,"pic"); await F.cpflSend(h); const v=flagW(w)[0].val;
  ok("…once checked: ref {skill, item, pic}, the step and its choices as text", /🚩 Flag it/.test(s)&&v.what==="skill"&&v.ref.skill==="gear.tools"&&v.ref.item==="Clinometer"&&v.ref.pic==="envirothon/pics/x.jpg"&&/What is it\?: Clinometer \/ Increment borer/.test(v.text), v);
  ok("…a worked example (👀 shown) has it too", /🚩 Flag it/.test(F.cpFlagSkillHtml({sk:{key:"k"},prob:{steps:[]},stage:"shown"}))); }
{ const w=demo("kid"), F=w.F, c={deck:"Forestry · ID",item:"Loblolly Pine",pic:{url:"envirothon/pics/forestry/loblolly/1.jpg",credit:"CC BY J. Doe",id:"r~forestry~loblolly~1"}};
  const s=F.cpFlagPhotoHtml(c), h=hashOf(s); F.cpflTap(h); F.cpflReason(h,"pic"); await F.cpflSend(h); const v=flagW(w)[0].val;
  ok("an ID Flash picture: what photo, ref {photo, item, deck, pic}", /🚩 Flag it/.test(s)&&v.what==="photo"&&v.ref.photo==="r~forestry~loblolly~1"&&v.ref.item==="Loblolly Pine"&&v.ref.pic===c.pic.url&&/Picture: CC BY J\. Doe/.test(v.text));
  w.envsDemoGo("teacher"); const r=F.cpflList().find(x=>x.what==="photo"); F.cpflFix(r.cid,r.id); const C=F.cpcs, M=F.cpcsIndex(), k=M.C[C.or];
  ok("…Fix it opens a card of that item in 📚 Cards (its 🖼 strip is in the open card)", w._envc.view==="cpcards"&&!!k&&String(k.item).toLowerCase()==="loblolly pine", k&&k.name); }

console.log("\n── a question: Fix it opens it in 📝 Tests ──");
{ const w=demo("kid"), F=w.F, items=LIB.tests.forestry.pre.items.slice(0,2);
  F.envtState={kid:"maya",station:"forestry",which:"pre",form:{items},i:1,answers:[0,1],started:Date.now(),done:{right:1,n:2,pass:false}};
  F._cpfl.testOpen=true; const h=hashOf(F.cpFlagTestHtml(F.envtState).split("Q2.")[1]); F.cpflTap(h); F.cpflReason(h,"typo"); await F.cpflSend(h); F.envtState=null;
  w.envsDemoGo("teacher"); w.renderAll(); const r=F.cpflList()[0]; w.envcView("cpflags");
  ok("the teacher reads it as 'Forestry check-in · Q<n>'", /📝 Question/.test(text(w.G.content))&&new RegExp("check-in · Q"+items[1].n).test(text(w.G.content)), text(w.G.content).slice(0,500));
  F.cpflFix(r.cid,r.id); const T=F.cpct;
  ok("Fix it → 📝 Tests with the station, the check-in and that question open", w._envc.view==="cptests"&&T.os==="forestry"&&T.og==="forestry|pre"&&T.or==="forestry|pre|pre-"+items[1].n&&/cpct-row open/.test(F.cpctListHtml()), [T.os,T.og,T.or]); }

console.log("\n── the teacher's name, Adrienne's every class ──");
{ const w=demo("teacher"), F=w.F; w.envcView("cpflags"); F.cpflNameOpen(); ok("✏️ Change opens the name box, filled with her record's name", /id="cpfl-name" maxlength="40" value="Ms\. Brittany"/.test(w.G.content));
  F.cpflNameIn("Mrs. B"); await F.cpflNameSave(); const nw=w._envs.writes.slice(-1)[0];
  ok("Save → ONE 'would set' classes/<cid>/teacherName", nw.op==="set"&&nw.path==="classes/"+CID+"/teacherName"&&nw.val==="Mrs. B");
  w.envsDemoGo("kid"); ok("…the kid's form now says 'Tell Mrs. B'", (()=>{ const ses={sid:"envirothon"}, cd={deck:DECK,name:"Cambium"}; F.cpflTap(hashOf(F.cpFlagCardHtml(ses,cd))); return /Tell Mrs\. B about this card/.test(text(F.cpFlagCardHtml(ses,cd))); })()); }
{ const w=demo("admin"), F=w.F; F._cpfl.demo={[CID]:{fa1b2c3d4:{what:"card",ref:{deck:DECK,name:"Cambium"},text:"Front: Cambium",reason:"typo",by:SID,role:"kid",at:Date.now()-1000,status:"open"}},"other-class":{fz9y8x7w6:{what:"card",ref:{deck:DECK,name:"Bark"},text:"Front: Bark",reason:"wrong",by:"x_y",role:"parent",at:Date.now(),status:"open"}}};
  w._envc.classes["other-class"]={name:"Eco Club"}; w.renderAll(); w.envcView("cpflags"); const t=text(w.G.content);
  ok("Adrienne: every class's flags, each with its class name; a teacher sees only her class", /🚩 Flags · every class/.test(t)&&/Open · 2/.test(t)&&/Eco Club/.test(t)&&/MS Science 2026-27/.test(t)&&/🚩 Flags \(2\)/.test(w.G.content));
  const v=demo("teacher"); v.F._cpfl.demo=F._cpfl.demo; v.renderAll(); ok("…the teacher's chip counts her class only", /🚩 Flags \(1\)/.test(v.G.content)); }

console.log("\n── live: the family's one query, the console's listener, dry run ──");
{ const w=W({}), F=w.F; w._envs.role="kid"; w._envs.kid="maya"; w._envs.sid=SID; w._envs.cid=CID; const Q=[];
  const sdb={ref(p){ return {orderByChild(k){ return {equalTo(v){ return {on(ev,fn){ Q.push([p,k,v,ev]); fn({val:()=>({fq1w2e3r4:{what:"card",ref:{deck:DECK,name:"Cambium"},text:"t",reason:"wrong",by:SID,role:"kid",at:1,status:"open"}})}); }}; }}; }}; }};
  ok("a kid's boot: ONE listener on flags/<cid> ordered by 'by' = this sid", F.cpflKidLoad(sdb,CID)===true&&Q.length===1&&Q[0][0]==="flags/"+CID&&Q[0][1]==="by"&&Q[0][2]===SID&&F.cpflKidLoad(sdb,CID)===false&&Q.length===1);
  ok("…its flags are what 'You flagged this' reads", F.cpflMine().length===1&&!!F.cpflOpenFor("card|"+DECK+"|Cambium"));
  ok("…a database with no queries: nothing read at all (the whole node would be refused)", F.cpflKidLoad({ref(){ return {}; }},"other")===false); }
{ const w=W({}), F=w.F; w._envs.role="teacher"; w._envs.uid="u_t"; w._envc.sdb=w.firebase.database(); w._envc.cid=CID; F.cpflConStart();
  ok("the teacher's console: a listener on flags/<her class>", w.G.listeners.some(l=>l.p==="flags/"+CID)&&!w.G.listeners.some(l=>l.p==="flags"));
  const a=W({}); a._envs.role="admin"; a._envs.uid="u_a"; a._envc.sdb=a.firebase.database(); a.F.cpflConStart(); ok("Adrienne's: one listener on flags (every class)", a.G.listeners.some(l=>l.p==="flags")); }
{ const w=W({search:"?dryrun=1"}), F=w.F; w.G.dry=true; w._envs.role="kid"; w._envs.kid="maya"; w._envs.sid=SID; w._envs.cid=CID;
  const s=F.cpFlagCardHtml({sid:"envirothon"},{deck:DECK,name:"Cambium"}), h=hashOf(s); F.cpflTap(h); F.cpflReason(h,"other"); await F.cpflSend(h);
  ok("?dryrun=1: a flag sends nowhere", w.G.writes.length===0); }

console.log("\n── the rules ──");
{ const R=JSON.parse(fs.readFileSync(path.join(REPO,"envirothon/SITE_RULES.json"),"utf8")), N=R.rules.flags, C=N&&N.$cid, X=C&&C.$fid;
  ok("flags: admin reads it all; the class's teacher (or admin) reads the class; a family only with orderByChild('by') == its own sid; indexed on by", /admins/.test(N[".read"])&&/classes\/'\+\$cid\+'\/teacher'\)\.val\(\) == auth\.uid/.test(C[".read"])&&/query\.orderByChild == 'by' && query\.equalTo == root\.child\('logins\/'\+auth\.uid\+'\/familyId'\)\.val\(\)\+'_'\+root\.child\('logins\/'\+auth\.uid\+'\/kid'\)\.val\(\)/.test(C[".read"])&&JSON.stringify(C[".indexOn"])==='["by"]');
  const cw=X[".write"];
  ok("a flag is CREATED once, by the student's own family (by == familyId_kid, role == the login's), for a student in that class, status open, no reply", /!data\.exists\(\) && newData\.exists\(\)/.test(cw)&&/newData\.child\('by'\)\.val\(\) == root\.child\('logins\/'\+auth\.uid\+'\/familyId'\)/.test(cw)&&/newData\.child\('role'\)\.val\(\) == root\.child\('logins\/'\+auth\.uid\+'\/role'\)\.val\(\)/.test(cw)&&/students\/'\+newData\.child\('by'\)\.val\(\)\+'\/class'\)\.val\(\) == \$cid/.test(cw)&&/newData\.child\('status'\)\.val\(\) == 'open'/.test(cw)&&/!newData\.child\('reply'\)\.exists\(\)/.test(cw));
  ok("…its shape: the eight fields, the four kinds, the four reasons, a 300-character note, 600 of text, nothing else", /hasChildren\(\['what','ref','text','reason','by','role','at','status'\]\)/.test(X[".validate"])&&/card\|question\|skill\|photo/.test(X.what[".validate"])&&/wrong\|pic\|typo\|other/.test(X.reason[".validate"])&&/<= 300/.test(X.note[".validate"])&&/<= 600/.test(X.text[".validate"])&&X.$other[".validate"]===false&&X.ref.$other[".validate"]===false&&/kid\|parent/.test(X.role[".validate"]));
  ok("only the class's teacher or admin may change status / reply (and doneBy / rBy are the writer); the family has no write on an existing flag", ["status","doneBy","doneAt","reply","rBy","rAt"].every(k=>/data\.parent\(\)\.exists\(\)/.test(X[k][".write"])&&/classes\/'\+\$cid\+'\/teacher'/.test(X[k][".write"])&&/admins/.test(X[k][".write"]))&&/open\|fixed\|no/.test(X.status[".validate"])&&/== auth\.uid/.test(X.doneBy[".validate"])&&/== auth\.uid/.test(X.rBy[".validate"]));
  const tn=R.rules.classes.$cid.teacherName; ok("classes/<cid>/teacherName: the class's teacher writes 1–40 characters", tn&&/classes\/'\+\$cid\+'\/teacher'\)\.val\(\) == auth\.uid/.test(tn[".write"])&&/<= 40/.test(tn[".validate"]));
  ok("the _about line describes flags and teacherName", /CPFLAG/.test(R._about)&&/teacherName/.test(R._about)); }

console.log("\n"+pass+" passed, "+fail+" failed");
process.exit(fail?1:0);
};
run().catch(e=>{ console.log("  FAIL- threw "+(e&&e.stack||e)); process.exit(1); });
