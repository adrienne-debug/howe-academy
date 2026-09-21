// ✏️ Editor in Chief — the SKILL ENGINE, slice 2 (2026-09-20). Her design: the SKILL is the unit, not the
// book. Rule sheet on the left, that skill's exercise pages on the right — first book first — and Mom
// grades against the answer key and logs found / missed / extra. Lazy-loaded by eicPanelOpen() in
// index.html (like esa.js / library.js). Nothing here touches schedules, weeks or curriculum.
//
// Reads : library/tags/<bookKey>   = {skills, reviews, pages{pN}, paragraphs{nN:{title,page,keyPage}}, pdfPageOffset}
//         workbooks/<id>           = the uploaded PDF (page images); workbooks/<id>/tagsBook links it to a tag book
//         eic/<kid>/log            = graded sittings
// Writes: ONE exact path each —  eic/<kid>/log/<push> (a sitting) · remove of one log line ·
//         workbooks/<id>/tagsBook (link a PDF) · mastery/<kid>_settings/eic (show the ✏️ button on that kid's Mastery page)
// Firebase never stores [] or null: a rule page reads back with NO `paragraphs`, a review page with NO `skill`.
// Slice 3 (2026-09-20): the TWO-GREENS GATE for step 1. A skill's pool is dealt every other page —
//   odd → STEP 1 (learn, count shown) · even → STEP 2 (count hidden; its view is a later slice, so those pages stay locked).
//   Where he is gets WORKED OUT from the log each time — there is no stored "current step" to drift.
//   Two ≥80% sittings in a row clear the step. Pool empty first → Mom picks Redo / Move on (eic/<kid>/decisions/<push>).
// Slice 4 (2026-09-20): STEP 2 — same skill, but the margin's error COUNTS are covered (numbers only; the names of the
//   marks stay). Covers = library/tags/<book>/pages/pN/cover = [[x0,y0,x1,y1]…] as fractions of the page image, one box per
//   circled digit (the Beginning 2 photos tilt, so a strip can't do it). Step 2 opens once step 1 is cleared, and has the
//   same two-greens gate. A step-2 page with no cover data never opens for a kid. The viewer hides ◀ ▶ from a kid on an
//   EIC page (index.html) — the answer key is in the same PDF.
// NOT here yet (later slices): the reviews step, Iowa cards.
(function(){
"use strict";
const BOOKS=["editor-in-chief-beginning-1","editor-in-chief-beginning-2"];   // pool order = first book first
const SHORT={"editor-in-chief-beginning-1":"Beg 1","editor-in-chief-beginning-2":"Beg 2"};
const FIRST=["capitalization","punctuation"];                                 // the Iowa gap — shown on top
const ALIAS={an_and_a:"a_an_and_the"};                                        // same skill, named differently per book
const GREEN=80;
let tags=null, logs={}, decs={}, kid="ellis", showAll=false, busy=false;

function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function dry(){return typeof _dryRun==="function"&&_dryRun();}
function mom(){try{return typeof wbMomEyes==="function"&&wbMomEyes();}catch(e){return false;}}
function toast(s){if(typeof gwShowToast==="function")gwShowToast(s);}
function canon(k){return ALIAS[k]||k;}
function arr(x){return Array.isArray(x)?x.filter(v=>v!=null):(x&&typeof x==="object"?Object.values(x):[]);}

// ── pure helpers (exported on window._eicTest) ─────────────────────────────────────────────
// Score = (found − extra) ÷ total. An extra mark is a real error: on the Iowa, picking a clean line is wrong.
function eicPct(found,missed,extra){
  found=+found||0; missed=+missed||0; extra=+extra||0;
  const total=found+missed; if(!(total>0)||found<0||missed<0||extra<0) return null;
  return Math.max(0,Math.round((found-extra)/total*100));
}
// Every skill across both books, the two Iowa-gap skills first, then book order.
function eicSkills(T){
  const seen={}, out=[];
  BOOKS.forEach(bk=>{ const sk=(T&&T[bk]&&T[bk].skills)||{};
    Object.keys(sk).sort((a,b)=>(sk[a].lesson||0)-(sk[b].lesson||0)).forEach(k=>{ const c=canon(k);
      if(!seen[c]){ seen[c]={key:c,name:sk[k].name}; out.push(seen[c]); } }); });
  const rank=s=>{ const i=FIRST.indexOf(s.key); return i<0?99:i; };
  return out.map((s,i)=>[s,i]).sort((a,b)=>(rank(a[0])-rank(b[0]))||(a[1]-b[1])).map(x=>x[0]);
}
// A skill's pool: its exercise pages, first book first. Printed page numbers.
function eicPool(T,skill){
  const out=[];
  BOOKS.forEach(bk=>{ const sk=(T&&T[bk]&&T[bk].skills)||{};
    Object.keys(sk).forEach(k=>{ if(canon(k)!==skill) return;
      arr(sk[k].exercisePages).forEach(p=>out.push({book:bk,page:+p,rules:arr(sk[k].rulePages).map(Number)})); }); });
  return out;
}
function eicOffset(T,bk){return parseInt(T&&T[bk]&&T[bk].pdfPageOffset,10)||0;}
function eicPdf(T,bk,printed){return (+printed)+eicOffset(T,bk);}
function eicPrinted(T,bk,pdf){return (+pdf)-eicOffset(T,bk);}
// Where a page's answers START in the key (printed). The key's own ◀ ▶ arrows reach the rest.
function eicKeyPage(T,bk,printed){
  const B=T&&T[bk]; if(!B) return null; const pg=(B.pages||{})["p"+printed]; if(!pg) return null;
  let best=null; arr(pg.paragraphs).forEach(n=>{ const q=(B.paragraphs||{})["n"+n]; const kp=q&&parseInt(q.keyPage,10); if(kp&&(best==null||kp<best)) best=kp; });
  return best;
}
function eicParagraphs(T,bk,printed){const B=T&&T[bk];const pg=B&&(B.pages||{})["p"+printed];return pg?arr(pg.paragraphs).map(Number):[];}
function eicSkillOf(T,bk,printed){const B=T&&T[bk];const pg=B&&(B.pages||{})["p"+printed];return pg&&pg.skill?canon(pg.skill):null;}
// Step 2's cover boxes for a page: [[x0,y0,x1,y1]…] in 0..1, or [] when none are stored.
function eicCover(T,bk,printed){
  const B=T&&T[bk], pg=B&&(B.pages||{})["p"+printed];
  return arr(pg&&pg.cover).map(arr).filter(c=>c.length===4&&c.every(n=>typeof n==="number"&&n>=0&&n<=1)&&c[2]>c[0]&&c[3]>c[1]);
}
// Both steps of a skill at once. Step 2 is locked until step 1 is cleared.
function eicProgress(T,L,D,skill){
  const sp=eicStepPools(T,skill), g1=eicGate(L,D,skill,1,sp[1]), g2=eicGate(L,D,skill,2,sp[2]);
  const step=!g1.cleared?1:((sp[2].length&&!g2.cleared)?2:3);      // 3 = both cleared → the reviews step (later slice)
  return {pools:sp,g1:g1,g2:g2,step:step,gate:step===1?g1:g2};
}
// The newest logged sitting for one page.
function eicLast(L,bk,printed){
  let best=null; Object.keys(L||{}).forEach(id=>{ const e=L[id]; if(e&&e.book===bk&&+e.page===+printed&&(!best||(e.ts||0)>(best.ts||0))) best=Object.assign({id},e); });
  return best;
}
// Her call 9/20: deal the pool every other page — odd → step 1, even → step 2. Every page stays fresh,
// both steps sample both books, and the first book still leads each step.
function eicStepPools(T,skill){
  const pool=eicPool(T,skill), out={1:[],2:[]};
  pool.forEach((p,i)=>out[(i%2)?2:1].push(p));
  return out;
}
function eicStepOf(T,bk,printed){
  const sk=eicSkillOf(T,bk,printed); if(!sk) return null; const sp=eicStepPools(T,sk);
  if(sp[1].some(p=>p.book===bk&&p.page===+printed)) return 1;
  if(sp[2].some(p=>p.book===bk&&p.page===+printed)) return 2;
  return null;
}
// The gate for one step of one skill, worked out from the log (L) and Mom's decisions (D). Nothing stored.
//   streak  = greens in a row at the END of this step's sittings (a green from before a Redo still counts)
//   cleared = two greens in a row happened at any point, or Mom said Move on
//   round   = 1 + Redos; a page is "sat" once it has a sitting in the current round
//   next    = first page of the step not sat this round;  empty = none left and not cleared → Mom decides
function eicGate(L,D,skill,step,pages){
  const inPool=e=>pages.some(p=>p.book===e.book&&p.page===+e.page);
  const sits=Object.keys(L||{}).map(id=>L[id]).filter(e=>e&&inPool(e)&&(+e.step||1)===step).sort((a,b)=>(a.ts||0)-(b.ts||0));
  const mine=Object.keys(D||{}).map(id=>D[id]).filter(d=>d&&d.skill===skill&&(+d.step||1)===step).sort((a,b)=>(a.ts||0)-(b.ts||0));
  let run=0, two=false; sits.forEach(e=>{ run=(+e.pct>=GREEN)?run+1:0; if(run>=2) two=true; });
  const moved=mine.some(d=>d.action==="moveon"), redos=mine.filter(d=>d.action==="redo");
  const since=redos.length?(redos[redos.length-1].ts||0):0;
  const sat=p=>sits.some(e=>e.book===p.book&&+e.page===p.page&&(e.ts||0)>since);
  const cleared=two||moved, next=cleared?null:(pages.find(p=>!sat(p))||null);
  return {sittings:sits.length,streak:run,cleared:cleared,moved:moved&&!two,round:redos.length+1,next:next,empty:!cleared&&!next&&pages.length>0};
}
// The uploaded PDF linked to a tag book: an explicit link wins, else a careful name guess.
function eicWorkbook(list,bk){
  list=list||[]; const hit=list.find(b=>b&&b.tagsBook===bk); if(hit) return hit;
  const want=bk==="editor-in-chief-beginning-1"?/beg(?:inning)?[\s_-]*1(?!\d)/i:/beg(?:inning)?[\s_-]*2(?!\d)/i;
  const g=list.filter(b=>b&&!b.tagsBook&&/eic|editor/i.test(b.name||"")&&want.test(b.name||""));
  return g.length===1?g[0]:null;
}

// ── data ───────────────────────────────────────────────────────────────────────────────────
function load(){
  if(typeof db==="undefined"||!db) return Promise.resolve();
  const a=tags?Promise.resolve():db.ref("library/tags").once("value").then(s=>{tags=s.val()||{};});
  const b=db.ref("eic/"+kid+"/log").once("value").then(s=>{logs=s.val()||{};});
  const c=db.ref("eic/"+kid+"/decisions").once("value").then(s=>{decs=s.val()||{};});
  return Promise.all([a,b,c]).catch(()=>{});
}
function books(){return (typeof wbList==="function")?wbList():[];}

// ── the panel ──────────────────────────────────────────────────────────────────────────────
function panel(k){
  if(k) kid=k; else { try{ kid=HA_LS.getItem("ha_eic_kid")||kid; }catch(e){} }
  try{ HA_LS.setItem("ha_eic_kid",kid); }catch(e){}
  let ov=document.getElementById("eic-panel"); if(ov) ov.remove();
  ov=document.createElement("div"); ov.id="eic-panel";
  ov.style.cssText="position:fixed;inset:0;z-index:10040;background:rgba(15,23,42,.45);display:flex;align-items:flex-start;justify-content:center;overflow:auto;padding:14px";
  ov.innerHTML='<div id="eic-box" style="background:#fff;border-radius:16px;max-width:760px;width:100%;padding:16px 16px 22px;font-family:\'DM Sans\',sans-serif;box-shadow:0 10px 40px rgba(0,0,0,.25)"><div style="padding:30px;text-align:center;color:#64748b">Loading…</div></div>';
  ov.addEventListener("click",e=>{ if(e.target===ov) close(); });
  document.body.appendChild(ov);
  load().then(draw);
}
function close(){const ov=document.getElementById("eic-panel"); if(ov) ov.remove();}
function chip(lbl,fn,st){return '<button onclick="'+fn+'" style="padding:7px 11px;border-radius:10px;border:1.5px solid #cbd5e1;background:#fff;font-size:13px;font-weight:700;cursor:pointer;font-family:\'DM Sans\',sans-serif;'+(st||"")+'">'+lbl+'</button>';}
function draw(){
  const box=document.getElementById("eic-box"); if(!box) return;
  const M=mom(), T=tags||{}, list=books();
  let h='<div style="display:flex;align-items:center;gap:10px;margin-bottom:4px"><div style="font-family:\'Fraunces\',serif;font-size:20px;font-weight:800;color:#0f172a;flex:1">✏️ Editor in Chief</div>'+chip("✕","eicClose()")+'</div>';
  h+='<div style="font-size:12px;color:#64748b;margin-bottom:10px">One skill at a time. Rules on the left, the page on the right — first book first.</div>';
  if(M){
    const roster=(typeof ROSTER!=="undefined"&&ROSTER)||[kid];
    h+='<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px">'+roster.map(k=>chip(esc((typeof SL_KLBL!=="undefined"&&SL_KLBL[k])||k),"eicSetKid(\'"+k+"\')",k===kid?"background:#1d4ed8;color:#fff;border-color:#1d4ed8":"")).join("")+'</div>';
    const on=!!(((typeof masteryData!=="undefined"&&masteryData)||{})[kid+"_settings"]||{}).eic;
    h+='<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;padding:9px 11px;border-radius:11px;background:#f8fafc;border:1px solid #e2e8f0;font-size:13px"><span style="flex:1">Show the ✏️ button on <b>'+esc((typeof SL_KLBL!=="undefined"&&SL_KLBL[kid])||kid)+'</b>\'s Mastery page</span>'+chip(on?"✓ On":"Off","eicToggleKid()",on?"background:#dcfce7;border-color:#16a34a;color:#166534":"")+'</div>';
  }
  if(!Object.keys(T).length){ box.innerHTML=h+'<div style="padding:24px;text-align:center;color:#64748b">The page tags aren\'t loaded yet.</div>'; return; }
  // which PDFs are linked
  BOOKS.forEach(bk=>{ const wb=eicWorkbook(list,bk); if(wb) return;
    h+='<div style="margin-bottom:10px;padding:10px 12px;border-radius:11px;background:#fffbeb;border:1px solid #fcd34d;font-size:13px"><b>'+esc((T[bk]&&T[bk].title)||bk)+'</b> has no PDF linked.';
    if(M) h+=(list.length?' <select onchange="eicLink(\''+bk+'\',this.value)" style="margin-left:6px;padding:5px;border-radius:8px;border:1px solid #cbd5e1;font-size:13px"><option value="">Link a workbook…</option>'+list.map(b=>'<option value="'+esc(b.id)+'">'+esc(b.name||b.id)+'</option>').join("")+'</select>':' Add it in Mom HQ ▸ 📕 Workbooks first.');
    else h+=' Ask Mom to add it.';
    h+='</div>'; });
  const skills=eicSkills(T), shown=showAll?skills:skills.filter(s=>FIRST.indexOf(s.key)>=0);
  shown.forEach(s=>{
    const pr=eicProgress(T,logs,decs,s.key), sp=pr.pools, g=pr.gate, cur=pr.step;
    const nextWb=g.next&&eicWorkbook(list,g.next.book);
    const nextReady=g.next&&(cur===1||M||eicCover(T,g.next.book,g.next.page).length>0);
    let status, tone="#475569";
    if(cur===3){ status="Steps 1 and 2 cleared ✓ — ready for the reviews step"; tone="#166534"; }
    else if(g.empty){ status="Step "+cur+": out of pages before two greens in a row"+(M?"":" — ask Mom"); tone="#b45309"; }
    else status=(cur===2?"Step 1 cleared ✓ · ":"")+"Step "+cur+(cur===2?" (how many?)":"")+": "+(g.streak>=1?"one green — one more to go":"two greens in a row to clear")+(g.round>1?" · round "+g.round:"");
    h+='<div style="margin-bottom:12px;padding:12px;border-radius:13px;border:1.5px solid #e2e8f0"><div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px"><div style="font-weight:800;font-size:15px;color:#0f172a;flex:1">'+esc(s.name)+'</div>'+
      ((cur<3&&g.next)?chip("▶ Next page",(nextWb&&nextReady)?"eicOpen(\'"+g.next.book+"\',"+g.next.page+")":(nextWb?"eicNotReady()":"eicNoBook()"),"background:#1d4ed8;color:#fff;border-color:#1d4ed8"+((nextWb&&nextReady)?"":";opacity:.45")):"")+'</div>';
    h+='<div style="font-size:12px;font-weight:700;color:'+tone+';margin-bottom:9px">'+esc(status)+'</div>';
    if(cur<3&&g.empty&&M) h+='<div style="display:flex;gap:7px;flex-wrap:wrap;margin-bottom:9px">'+chip("↻ Redo these pages","eicDecide(\'"+s.key+"\',"+cur+",\'redo\')","background:#fef3c7;border-color:#d97706;color:#92400e")+chip("➡ Move on anyway","eicDecide(\'"+s.key+"\',"+cur+",\'moveon\')")+'</div>';
    [1,2].forEach(step=>{
      if(!sp[step].length) return;
      const open2=pr.g1.cleared;   // step 2 stays locked until step 1 is cleared
      h+='<div style="display:flex;gap:7px;flex-wrap:wrap;align-items:center;margin-bottom:6px"><span style="font-size:11px;font-weight:800;color:#64748b;min-width:52px">STEP '+step+((step===2&&!open2)?' 🔒':'')+'</span>';
      sp[step].forEach(p=>{
        const wb=eicWorkbook(list,p.book), last=eicLast(logs,p.book,p.page);
        const tone2=last?(last.pct>=GREEN?"background:#dcfce7;border-color:#16a34a;color:#166534":"background:#fef3c7;border-color:#d97706;color:#92400e"):"";
        const lbl=esc(SHORT[p.book]||p.book)+" · p "+p.page+(last?' <span style="font-weight:800">'+last.pct+'%</span>':"");
        // step 2 pages stay fresh until step 1 is cleared, and never open for a kid without their covers
        const covered=step===1||eicCover(T,p.book,p.page).length>0;
        const can=wb&&(M||(step===1||open2)&&covered);
        h+='<span style="display:inline-flex;gap:3px">'+chip(lbl,can?"eicOpen(\'"+p.book+"\',"+p.page+")":(wb?((step===2&&open2)?"eicNotReady()":"eicLocked()"):"eicNoBook()"),tone2+((can&&(step===1||open2))?"":";opacity:.5"))+(M&&wb&&(step===1||open2)?chip("✅","eicCheck(\'"+p.book+"\',"+p.page+")","padding:7px 8px"):"")+'</span>';
      });
      h+='</div>';
    });
    if(M){ const mine=Object.keys(logs).map(id=>Object.assign({id},logs[id])).filter(e=>e&&canon(e.skill||"")===s.key).sort((a,b)=>(b.ts||0)-(a.ts||0)).slice(0,5);
      if(mine.length) h+='<div style="margin-top:9px;font-size:12px;color:#475569">'+mine.map(e=>'<div style="display:flex;gap:8px;align-items:center;padding:2px 0"><span style="flex:1">'+esc(e.date||"")+' · '+esc(SHORT[e.book]||e.book)+' p '+esc(e.page)+' · found '+esc(e.found)+' of '+esc((+e.found||0)+(+e.missed||0))+(e.extra?' · '+esc(e.extra)+' extra':'')+' · <b>'+esc(e.pct)+'%</b></span><button onclick="eicDelLog(\''+esc(e.id)+'\')" style="border:none;background:none;color:#94a3b8;cursor:pointer;font-size:12px">remove</button></div>').join("")+'</div>'; }
    h+='</div>';
  });
  h+='<div style="text-align:center">'+chip(showAll?"Just capitalization & punctuation":"All "+skills.length+" skills","eicToggleAll()")+'</div>';
  box.innerHTML=h;
}

// ── open a page ────────────────────────────────────────────────────────────────────────────
function withBook(bk,go){
  const wb=eicWorkbook(books(),bk); if(!wb){ toast("That book's PDF isn't linked yet."); return; }
  if(typeof wbOpen!=="function") return; go(wb);
}
function openPage(bk,printed){ withBook(bk,wb=>{
  const skill=eicSkillOf(tags,bk,printed), pool=skill?eicPool(tags,skill):[], me=pool.find(p=>p.book===bk&&p.page===+printed);
  const rules=((me&&me.rules)||[]).map(p=>eicPdf(tags,bk,p));
  const step=eicStepOf(tags,bk,printed), cover=step===2?eicCover(tags,bk,printed):[];
  if(step===2&&!mom()){ const pr=skill?eicProgress(tags,logs,decs,skill):null;
    if(!pr||!pr.g1.cleared){ toast("That page is saved for step 2."); return; }
    if(!cover.length){ toast("That page isn't ready yet — ask Mom."); return; } }
  close(); wbOpen(wb.id,kid,eicPdf(tags,bk,printed),{rules:rules,cover:cover,eic:{book:bk}});
  if(skill&&step){ const g=eicGate(logs,decs,skill,step,eicStepPools(tags,skill)[step]); if(g.round>1) toast("Round "+g.round+" — tap 🧽 Clear to start this page fresh."); } }); }
function checkPage(bk,printed){ if(!mom()) return; withBook(bk,wb=>{
  const kp=eicKeyPage(tags,bk,printed);
  close(); wbOpen(wb.id,kid,eicPdf(tags,bk,printed),{ans:kp?eicPdf(tags,bk,kp):0,eic:{book:bk}}); }); }

// ── Mom's score: found / missed / extra for the page ON SCREEN ─────────────────────────────
function scoreOpen(){
  if(!mom()||typeof wbView==="undefined"||!wbView||!wbView.eic) return;
  const bk=wbView.eic.book, printed=eicPrinted(tags,bk,wbView.page), skill=eicSkillOf(tags,bk,printed);
  if(!skill&&!eicParagraphs(tags,bk,printed).length){ toast("That page isn't an exercise page."); return; }
  if(eicStepOf(tags,bk,printed)===2&&skill&&!eicProgress(tags,logs,decs,skill).g1.cleared){ toast("Step 1 isn't cleared yet — that page is saved for step 2."); return; }
  let ov=document.getElementById("eic-score"); if(ov) ov.remove();
  ov=document.createElement("div"); ov.id="eic-score"; ov.className="dlg-overlay"; ov.style.display="flex"; ov.style.zIndex="10060";
  const inp=(id,ph)=>'<div style="text-align:center"><input id="'+id+'" inputmode="numeric" oninput="eicScorePreview()" placeholder="0" style="width:70px;text-align:center;font-size:22px;padding:10px;border:1.5px solid var(--border,#cbd5e1);border-radius:10px;font-family:\'DM Sans\',sans-serif"><div style="font-size:11px;font-weight:700;color:#64748b;margin-top:4px">'+ph+'</div></div>';
  ov.innerHTML='<div class="dlg-box" style="max-width:360px"><div class="dlg-title">Score — '+esc(SHORT[bk]||bk)+' p '+printed+'</div><div class="dlg-detail" style="margin-bottom:14px">'+esc((typeof SL_KLBL!=="undefined"&&SL_KLBL[wbView.kid])||wbView.kid)+'</div>'+
    '<div style="display:flex;gap:10px;justify-content:center">'+inp("eic-found","found")+inp("eic-missed","missed")+inp("eic-extra","extra marks")+'</div>'+
    '<div id="eic-prev" style="text-align:center;margin-top:12px;font-size:15px;font-weight:800;color:#475569;min-height:22px"></div>'+
    '<div style="display:flex;gap:8px;margin-top:16px"><button onclick="eicScoreClose()" style="flex:1;padding:12px;border-radius:10px;font-weight:700;font-size:14px;cursor:pointer;border:none;background:#f3f4f6;color:#374151">Cancel</button><button onclick="eicScoreSave()" style="flex:1;padding:12px;border-radius:10px;font-weight:700;font-size:14px;cursor:pointer;border:none;background:#16a34a;color:#fff">Save</button></div></div>';
  document.body.appendChild(ov);
}
function vals(){const g=id=>{const e=document.getElementById(id);const v=e&&e.value!==""?Number(e.value):0;return (isFinite(v)&&v>=0)?Math.floor(v):NaN;};return {found:g("eic-found"),missed:g("eic-missed"),extra:g("eic-extra")};}
function scorePreview(){const v=vals(), p=eicPct(v.found,v.missed,v.extra), el=document.getElementById("eic-prev"); if(!el) return;
  el.textContent=(p==null)?"":p+"%  ·  "+(p>=GREEN?"green":"not yet"); el.style.color=(p==null)?"#475569":(p>=GREEN?"#16a34a":"#b45309");}
function scoreClose(){const ov=document.getElementById("eic-score"); if(ov) ov.remove();}
function scoreSave(){
  if(busy||!mom()||typeof wbView==="undefined"||!wbView||!wbView.eic) return;
  const v=vals(), pct=eicPct(v.found,v.missed,v.extra); if(pct==null){ toast("Enter how many he found and missed."); return; }
  const bk=wbView.eic.book, k=wbView.kid, printed=eicPrinted(tags,bk,wbView.page), now=Date.now();
  const rec={ts:now,date:(typeof _todayStr==="function")?_todayStr():new Date(now).toISOString().slice(0,10),step:eicStepOf(tags,bk,printed)||1,book:bk,page:printed,
    skill:eicSkillOf(tags,bk,printed)||"review",paragraphs:eicParagraphs(tags,bk,printed),found:v.found,missed:v.missed,extra:v.extra,pct:pct};
  busy=true;
  const done=id=>{ busy=false; if(k===kid) logs[id]=rec; scoreClose(); toast("📊 Logged — "+pct+"%"); };
  if(typeof db==="undefined"||!db||dry()){ done("local"+now); return; }
  const r=db.ref("eic/"+k+"/log").push(); r.set(rec).then(()=>done(r.key)).catch(()=>{ busy=false; toast("Couldn't save that score — try again."); });
}
function delLog(id){
  if(!mom()||!logs[id]) return; if(!confirm("Remove this score?")) return;
  delete logs[id]; if(typeof db!=="undefined"&&db&&!dry()&&!/^local/.test(id)) db.ref("eic/"+kid+"/log/"+id).remove();
  draw();
}
function decide(skill,step,action){
  if(busy||!mom()||(action!=="redo"&&action!=="moveon")) return;
  const g=eicGate(logs,decs,skill,step,eicStepPools(tags,skill)[step]||[]); if(!g.empty) return;   // only when the pool really ran out
  if(!confirm(action==="redo"?"Redo this step's pages?\n\nHis old writing stays on the pages — he taps 🧽 Clear, or you reprint them.":"Move him on without two greens in a row?")) return;
  const now=Date.now(), rec={ts:now,date:(typeof _todayStr==="function")?_todayStr():new Date(now).toISOString().slice(0,10),skill:skill,step:step,action:action};
  const done=id=>{ busy=false; decs[id]=rec; draw(); };
  busy=true;
  if(typeof db==="undefined"||!db||dry()){ done("local"+now); return; }
  const r=db.ref("eic/"+kid+"/decisions").push(); r.set(rec).then(()=>done(r.key)).catch(()=>{ busy=false; toast("Couldn't save that — try again."); });
}
function link(bk,id){ if(!mom()||!id) return;
  if(typeof wbBooks!=="undefined"&&wbBooks[id]) wbBooks[id].tagsBook=bk;
  if(typeof db!=="undefined"&&db&&!dry()) db.ref("workbooks/"+id+"/tagsBook").set(bk);
  draw(); }
function toggleKid(){ if(!mom()) return;
  const key=kid+"_settings", md=(typeof masteryData!=="undefined"&&masteryData)||null; const on=!((md&&md[key]||{}).eic);
  if(md){ md[key]=md[key]||{}; if(on) md[key].eic=true; else delete md[key].eic; }
  if(typeof db!=="undefined"&&db&&!dry()){ const r=db.ref("mastery/"+key+"/eic"); if(on) r.set(true); else r.remove(); }
  draw(); }

window.eicPanel=panel; window.eicClose=close; window.eicOpen=openPage; window.eicCheck=checkPage;
window.eicSetKid=k=>{ kid=k; try{HA_LS.setItem("ha_eic_kid",k);}catch(e){} logs={}; decs={}; load().then(draw); };
window.eicToggleAll=()=>{ showAll=!showAll; draw(); }; window.eicNoBook=()=>toast("That book's PDF isn't linked yet.");
window.eicScoreOpen=scoreOpen; window.eicScorePreview=scorePreview; window.eicScoreClose=scoreClose; window.eicScoreSave=scoreSave;
window.eicDelLog=delLog; window.eicLink=link; window.eicToggleKid=toggleKid; window.eicDecide=decide;
window.eicLocked=()=>toast("That page is saved for step 2."); window.eicNotReady=()=>toast("That page isn't ready yet — ask Mom.");
window._eicTest={eicCover,eicProgress,eicStepPools,eicStepOf,eicGate,eicPct,eicSkills,eicPool,eicPdf,eicPrinted,eicKeyPage,eicParagraphs,eicSkillOf,eicLast,eicWorkbook,canon,setTags:t=>{tags=t;}};
})();
