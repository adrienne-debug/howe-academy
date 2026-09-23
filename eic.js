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
//         eic/<kid>/iowa/<push> (step 4: one Iowa practice set) · remove of one Iowa line (Mom)
//         eic/<kid>/counts/<book>_p<N>_r<round> (step 3: the kid's locked "how many" guess — set once, never overwritten)
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
// Slice 5 (2026-09-22, her "go to step 3" — my four defaults, unchanged): STEP 3 = THE REVIEWS, every skill mixed.
//   Pool = the review pages on the kid's ladder — the cumulative "Review: …" / "Final Review: …" pages first, book by
//   book, then the "Mini Review" pages as reserve. Opens once capitalization AND punctuation have both cleared step 2.
//   The margin counts are covered (same cover boxes), and before Mom grades, the kid taps 🔢 How many? and locks in a
//   guess of how many mistakes the page has → eic/<kid>/counts/<book>_p<N>_r<round> = {ts,said,book,page,round}.
//   GREEN on step 3 = found ≥80% AND his guess within 1 of the true count (found + missed). Every error type counts.
//   Same two-greens gate, Redo / Move on, ✍ manual marks. The log line adds said / total / countOk.
// Slice 6B (2026-09-22, her yes): STEP 4 = IOWA PRACTICE — the tap-to-answer player. Bank = eic_iowa.json beside this file
//   (160 new passages: Beginning = Ellis, Level = Lincoln; capitalization + punctuation, 40 each, 10 clean). 3 lines +
//   4 "No mistakes"; the APP grades. One clock per set (30 s a passage). Green = 80%+ timed, finished before time ran out.
//   Log: eic/<kid>/iowa/<push>. This slice: only Mom opens it (🧪 Try a set) — those are trial:true, never count, and
//   never use up his unseen passages. Slice C (next) = the gate, the schedule card and the kid's doorway.
(function(){
"use strict";
// Every book the engine knows, in ladder order (first book first). Level 1 + Level 2 added 2026-09-22 from her eBooks.
const ORDER=["editor-in-chief-beginning-1","editor-in-chief-beginning-2","editor-in-chief-level-1","editor-in-chief-level-2"];
const SHORT={"editor-in-chief-beginning-1":"Beg 1","editor-in-chief-beginning-2":"Beg 2","editor-in-chief-level-1":"Lv 1","editor-in-chief-level-2":"Lv 2"};
// 🪜 Each kid's own ladder (her call 2026-09-22): Ellis stops at Level 1 (grades 4–5); Lincoln climbs to Level 2
// (grades 6–8). A kid not listed gets the two Beginning books. Only these books ever enter that kid's skill pools.
const LADDER={ellis:ORDER.slice(0,3),lincoln:ORDER.slice(0,4)};
function eicLadder(k){ return LADDER[k]||ORDER.slice(0,2); }
function eicTagsFor(T,k){ const out={}; eicLadder(k).forEach(b=>{ if(T&&T[b]) out[b]=T[b]; }); return out; }
function bookOrder(T){ return ORDER.filter(b=>T&&T[b]); }
const FIRST=["capitalization","punctuation"];                                 // the Iowa gap — shown on top
const ALIAS={an_and_a:"a_an_and_the"};                                        // same skill, named differently per book
const GREEN=80;
const REV="review";   // step 3's key — a page with no skill has always been logged under "review"
let tags=null, logs={}, decs={}, counts={}, iowaLogs={}, kid="ellis", showAll=true, busy=false;   // every skill shows by default (her ask 2026-09-22: "get all skill in the engine")

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
  bookOrder(T).forEach(bk=>{ const sk=(T&&T[bk]&&T[bk].skills)||{};
    Object.keys(sk).sort((a,b)=>(sk[a].lesson||0)-(sk[b].lesson||0)).forEach(k=>{ const c=canon(k);
      if(!seen[c]){ seen[c]={key:c,name:sk[k].name}; out.push(seen[c]); } }); });
  const rank=s=>{ const i=FIRST.indexOf(s.key); return i<0?99:i; };
  return out.map((s,i)=>[s,i]).sort((a,b)=>(rank(a[0])-rank(b[0]))||(a[1]-b[1])).map(x=>x[0]);
}
// A skill's pool: its exercise pages, first book first. Printed page numbers.
function eicPool(T,skill){
  const out=[];
  bookOrder(T).forEach(bk=>{ const sk=(T&&T[bk]&&T[bk].skills)||{};
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
  const step=!g1.cleared?1:((sp[2].length&&!g2.cleared)?2:3);      // 3 = both cleared (capitalization + punctuation at 3 → the reviews open)
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
  if(eicIsReview(T,bk,printed)) return 3;
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
  // step 3: a green also needs his "how many" within 1 (countOk false = missed it; a Mom mark has none and stands)
  const green=e=>(+e.pct>=GREEN)&&(step!==3||e.countOk!==false);
  let run=0, two=false; sits.forEach(e=>{ run=green(e)?run+1:0; if(run>=2) two=true; });
  const moved=mine.some(d=>d.action==="moveon"), redos=mine.filter(d=>d.action==="redo");
  const since=redos.length?(redos[redos.length-1].ts||0):0;
  const sat=p=>sits.some(e=>e.book===p.book&&+e.page===p.page&&(e.ts||0)>since);
  const cleared=two||moved, next=cleared?null:(pages.find(p=>!sat(p))||null);
  return {sittings:sits.length,streak:run,cleared:cleared,moved:moved&&!two,round:redos.length+1,next:next,empty:!cleared&&!next&&pages.length>0};
}
// 🔁 STEP 3 — the reviews. Cumulative review pages first (ladder order), then the Mini Reviews as reserve.
function eicIsReview(T,bk,printed){ const B=T&&T[bk], pg=B&&(B.pages||{})["p"+printed]; return !!(pg&&pg.role==="review"); }
function eicReviewPool(T){
  const cum=[], mini=[], seen={};
  bookOrder(T).forEach(bk=>{ arr(T[bk].reviews).forEach(r=>{ const isMini=/^\s*mini/i.test((r&&r.name)||"");
    arr(r&&r.pages).map(Number).forEach(p=>{ const id=bk+"|"+p; if(!(p>0)||seen[id]) return; seen[id]=1;
      (isMini?mini:cum).push({book:bk,page:p,unit:String((r&&r.name)||""),mini:isMini}); }); }); });
  return cum.concat(mini);
}
// Unlocked once capitalization AND punctuation have both cleared step 2. Gate = the same two greens in a row.
function eicReviews(T,L,D){
  const pool=eicReviewPool(T), unlocked=FIRST.every(k=>eicProgress(T,L,D,k).step===3);
  return {pool:pool,unlocked:unlocked,gate:eicGate(L,D,REV,3,pool)};
}
// His guess vs the true count (found + missed), within 1. No guess → not ok.
function eicCountOk(said,found,missed){
  if(said==null||said===""||!isFinite(+said)) return false;
  return Math.abs((+said)-((+found||0)+(+missed||0)))<=1;
}
function eicCountKey(bk,printed,round){ return bk+"_p"+(+printed)+"_r"+(+round||1); }
function poolFor(T,skill,step){ return skill===REV?eicReviewPool(T):(eicStepPools(T,skill)[step]||[]); }
// The uploaded PDF linked to a tag book: an explicit link wins, else a careful name guess.
function eicWorkbook(list,bk){
  list=list||[]; const hit=list.find(b=>b&&b.tagsBook===bk); if(hit) return hit;
  const want={"editor-in-chief-beginning-1":/beg(?:inning)?[\s_-]*1(?!\d)/i,"editor-in-chief-beginning-2":/beg(?:inning)?[\s_-]*2(?!\d)/i,
    "editor-in-chief-level-1":/level[\s_-]*1(?!\d)/i,"editor-in-chief-level-2":/level[\s_-]*2(?!\d)/i}[bk]||/(?!)/;
  const g=list.filter(b=>b&&!b.tagsBook&&/eic|editor/i.test(b.name||"")&&want.test(b.name||""));
  return g.length===1?g[0]:null;
}

// ── data ───────────────────────────────────────────────────────────────────────────────────
function load(){
  if(typeof db==="undefined"||!db) return Promise.resolve();
  const a=tags?Promise.resolve():db.ref("library/tags").once("value").then(s=>{tags=s.val()||{};});
  const b=db.ref("eic/"+kid+"/log").once("value").then(s=>{logs=s.val()||{};});
  const c=db.ref("eic/"+kid+"/decisions").once("value").then(s=>{decs=s.val()||{};});
  const d=db.ref("eic/"+kid+"/counts").once("value").then(s=>{counts=s.val()||{};});
  const e=db.ref("eic/"+kid+"/iowa").once("value").then(s=>{iowaLogs=s.val()||{};});
  return Promise.all([a,b,c,d,e]).catch(()=>{});
}
function books(){return (typeof wbList==="function")?wbList():[];}
function TK(k){ return eicTagsFor(tags||{},k||kid); }   // the current kid's ladder only

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
  const M=mom(), T=TK(), list=books();
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
  bookOrder(T).forEach(bk=>{ const wb=eicWorkbook(list,bk); if(wb) return;
    h+='<div style="margin-bottom:10px;padding:10px 12px;border-radius:11px;background:#fffbeb;border:1px solid #fcd34d;font-size:13px"><b>'+esc((T[bk]&&T[bk].title)||bk)+'</b> has no PDF linked.';
    if(M) h+=(list.length?' <select onchange="eicLink(\''+bk+'\',this.value)" style="margin-left:6px;padding:5px;border-radius:8px;border:1px solid #cbd5e1;font-size:13px"><option value="">Link a workbook…</option>'+list.map(b=>'<option value="'+esc(b.id)+'">'+esc(b.name||b.id)+'</option>').join("")+'</select>':' Add it in Mom HQ ▸ 📕 Workbooks first.');
    else h+=' Ask Mom to add it.';
    h+='</div>'; });
  const skills=eicSkills(T), shown=showAll?skills:skills.filter(s=>FIRST.indexOf(s.key)>=0);
  let rvDone=false;   // 🔁 the Reviews card sits right after capitalization + punctuation
  shown.forEach(s=>{
    if(!rvDone&&FIRST.indexOf(s.key)<0){ rvDone=true; h+=reviewCard(T,M,list); }
    const pr=eicProgress(T,logs,decs,s.key), sp=pr.pools, g=pr.gate, cur=pr.step;
    const nextWb=g.next&&eicWorkbook(list,g.next.book);
    const nextReady=g.next&&(cur===1||M||eicCover(T,g.next.book,g.next.page).length>0);
    let status, tone="#475569";
    if(cur===3){ status="Steps 1 and 2 cleared ✓"+(FIRST.indexOf(s.key)>=0?" — on to the reviews":""); tone="#166534"; }
    else if(g.empty){ status="Step "+cur+": out of pages before two greens in a row"+(M?"":" — ask Mom"); tone="#b45309"; }
    else status=(cur===2?"Step 1 cleared ✓ · ":"")+"Step "+cur+(cur===2?" (how many?)":"")+": "+(g.streak>=1?"one green — one more to go":"two greens in a row to clear")+(g.round>1?" · round "+g.round:"");
    h+='<div style="margin-bottom:12px;padding:12px;border-radius:13px;border:1.5px solid #e2e8f0"><div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px"><div style="font-weight:800;font-size:15px;color:#0f172a;flex:1">'+esc(s.name)+'</div>'+
      ((cur<3&&g.next)?chip("▶ Next page",(nextWb&&nextReady)?"eicOpen(\'"+g.next.book+"\',"+g.next.page+")":(nextWb?"eicNotReady()":"eicNoBook()"),"background:#1d4ed8;color:#fff;border-color:#1d4ed8"+((nextWb&&nextReady)?"":";opacity:.45")):"")+'</div>';
    h+='<div style="font-size:12px;font-weight:700;color:'+tone+';margin-bottom:9px">'+esc(status)+'</div>';
    if(cur<3&&M&&!g.empty) h+='<div style="margin-bottom:9px">'+chip("\u2713 Mark step "+cur+" done","eicStepDone(\'"+s.key+"\',"+cur+")","padding:5px 10px;font-size:12px;background:#f0fdf4;border-color:#86efac;color:#166534")+'</div>';
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
        h+='<span style="display:inline-flex;gap:3px">'+chip(lbl,can?"eicOpen(\'"+p.book+"\',"+p.page+")":(wb?((step===2&&open2)?"eicNotReady()":"eicLocked()"):"eicNoBook()"),tone2+((can&&(step===1||open2))?"":";opacity:.5"))+(M&&wb&&(step===1||open2)?chip("✅","eicCheck(\'"+p.book+"\',"+p.page+")","padding:7px 8px"):"")+(M?chip("\u270D","eicManual(\'"+p.book+"\',"+p.page+")","padding:7px 8px"):"")+'</span>';
      });
      h+='</div>';
    });
    if(M) h+=decsHtml(s.key)+logsHtml(s.key);
    h+='</div>';
  });
  if(!rvDone) h+=reviewCard(T,M,list);
  if(M) h+=iowaTryCard();
  h+='<div style="text-align:center">'+chip(showAll?"Just capitalization & punctuation":"All "+skills.length+" skills","eicToggleAll()")+'</div>';
  box.innerHTML=h;
}

function rmBtn(fn){ return '<button onclick="'+fn+'" style="border:none;background:none;color:#94a3b8;cursor:pointer;font-size:12px">remove</button>'; }
// Mom's "step done" marks for one skill (or the reviews), removable.
function decsHtml(key){
  const md=Object.keys(decs).map(id=>Object.assign({id},decs[id])).filter(d=>d&&d.manual&&d.skill===key&&d.action==="moveon");
  return md.length?'<div style="margin-top:7px;font-size:12px;color:#475569">'+md.map(d=>'<div style="display:flex;gap:8px;align-items:center;padding:2px 0"><span style="flex:1">'+esc(d.date||"")+' · <b>'+(key===REV?"reviews":"step "+esc(d.step))+' marked done</b> <span style="color:#94a3b8">(by Mom)</span></span>'+rmBtn("eicDelDec('"+esc(d.id)+"')")+'</div>').join("")+'</div>':"";
}
// The newest five sittings for one skill (or the reviews), removable.
function logsHtml(key){
  const mine=Object.keys(logs).map(id=>Object.assign({id},logs[id])).filter(e=>e&&canon(e.skill||"")===key).sort((a,b)=>(b.ts||0)-(a.ts||0)).slice(0,5);
  return mine.length?'<div style="margin-top:9px;font-size:12px;color:#475569">'+mine.map(e=>'<div style="display:flex;gap:8px;align-items:center;padding:2px 0"><span style="flex:1">'+esc(e.date||"")+' · '+esc(SHORT[e.book]||e.book)+' p '+esc(e.page)+
    (e.manual&&e.found==null?(' · <b>'+(+e.pct>=GREEN?"\u2713 passed":"not yet")+'</b> <span style="color:#94a3b8">(marked by Mom)</span>'):(' · found '+esc(e.found)+' of '+esc((+e.found||0)+(+e.missed||0))+(e.extra?' · '+esc(e.extra)+' extra':'')+' · <b>'+esc(e.pct)+'%</b>'+
      (e.countOk!=null?' · said '+(e.said==null?"—":esc(e.said))+' '+(e.countOk?"\u2713":"\u2717"):'')+(e.manual?' <span style="color:#94a3b8">(entered by Mom)</span>':'')))+
    '</span>'+rmBtn("eicDelLog('"+esc(e.id)+"')")+'</div>').join("")+'</div>':"";
}
// 🔁 STEP 3's card: every review page on the ladder — cumulative first, Mini Reviews as reserve.
function reviewCard(T,M,list){
  const rv=eicReviews(T,logs,decs), g=rv.gate, pool=rv.pool; if(!pool.length) return "";
  const live=rv.unlocked&&!g.cleared;
  const nextWb=g.next&&eicWorkbook(list,g.next.book), nextReady=g.next&&(M||eicCover(T,g.next.book,g.next.page).length>0);
  let status, tone="#475569";
  if(g.cleared){ status="Reviews cleared ✓"+(g.moved?" (moved on)":""); tone="#166534"; }
  else if(!rv.unlocked) status="🔒 Opens when capitalization and punctuation have both cleared step 2";
  else if(g.empty){ status="Out of review pages before two greens in a row"+(M?"":" — ask Mom"); tone="#b45309"; }
  else status="Step 3: "+(g.streak>=1?"one green — one more to go":"two greens in a row to clear")+" · green = found 80%+ AND his “how many” within 1"+(g.round>1?" · round "+g.round:"");
  let h='<div style="margin-bottom:12px;padding:12px;border-radius:13px;border:1.5px solid '+(live?"#93c5fd":"#e2e8f0")+';background:'+(live?"#f8fbff":"#fff")+'"><div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px"><div style="font-weight:800;font-size:15px;color:#0f172a;flex:1">🔁 Reviews — every skill mixed</div>'+
    ((live&&g.next)?chip("▶ Next page",(nextWb&&nextReady)?"eicOpen(\'"+g.next.book+"\',"+g.next.page+")":(nextWb?"eicNotReady()":"eicNoBook()"),"background:#1d4ed8;color:#fff;border-color:#1d4ed8"+((nextWb&&nextReady)?"":";opacity:.45")):"")+'</div>';
  h+='<div style="font-size:12px;font-weight:700;color:'+tone+';margin-bottom:9px">'+esc(status)+'</div>';
  if(live&&M&&!g.empty) h+='<div style="margin-bottom:9px">'+chip("\u2713 Mark reviews done","eicStepDone(\'"+REV+"\',3)","padding:5px 10px;font-size:12px;background:#f0fdf4;border-color:#86efac;color:#166534")+'</div>';
  if(live&&g.empty&&M) h+='<div style="display:flex;gap:7px;flex-wrap:wrap;margin-bottom:9px">'+chip("↻ Redo these pages","eicDecide(\'"+REV+"\',3,\'redo\')","background:#fef3c7;border-color:#d97706;color:#92400e")+chip("➡ Move on anyway","eicDecide(\'"+REV+"\',3,\'moveon\')")+'</div>';
  [["REVIEW",pool.filter(p=>!p.mini)],["MINI",pool.filter(p=>p.mini)]].forEach(row=>{
    if(!row[1].length) return;
    h+='<div style="display:flex;gap:7px;flex-wrap:wrap;align-items:center;margin-bottom:6px"><span style="font-size:11px;font-weight:800;color:#64748b;min-width:52px">'+row[0]+(rv.unlocked?'':' 🔒')+'</span>';
    row[1].forEach(p=>{
      const wb=eicWorkbook(list,p.book), last=eicLast(logs,p.book,p.page);
      const ok=last&&+last.pct>=GREEN&&last.countOk!==false;
      const tone2=last?(ok?"background:#dcfce7;border-color:#16a34a;color:#166534":"background:#fef3c7;border-color:#d97706;color:#92400e"):"";
      const lbl=esc(SHORT[p.book]||p.book)+" · p "+p.page+(last?' <span style="font-weight:800">'+last.pct+'%'+(last.countOk===false?" #✗":"")+'</span>':"");
      const covered=eicCover(T,p.book,p.page).length>0, can=wb&&(M||rv.unlocked&&covered);
      h+='<span style="display:inline-flex;gap:3px" title="'+esc(p.unit)+'">'+chip(lbl,can?"eicOpen(\'"+p.book+"\',"+p.page+")":(wb?(rv.unlocked?"eicNotReady()":"eicRvLocked()"):"eicNoBook()"),tone2+((can&&rv.unlocked)?"":";opacity:.5"))+
        (M&&wb?chip("✅","eicCheck(\'"+p.book+"\',"+p.page+")","padding:7px 8px"):"")+(M?chip("\u270D","eicManual(\'"+p.book+"\',"+p.page+")","padding:7px 8px"):"")+'</span>';
    });
    h+='</div>';
  });
  if(M) h+=decsHtml(REV)+logsHtml(REV);
  return h+'</div>';
}

// ── 🧪 STEP 4 — IOWA PRACTICE ──────────────────────────────────────────────────────────────
const IOWA_LEVEL={ellis:"beginning",lincoln:"level"}, IOWA_N=10, IOWA_SECS=30;
const IOWA_NAME={capitalization:"Capitalization",punctuation:"Punctuation"};
let iowaBank=null, iowaRun=null, iowaTimed=true;
function eicIowaLevel(k){ return IOWA_LEVEL[k]||"beginning"; }
// A green: 80%+, timed, finished before the clock ran out. A Mom try-out never counts.
function eicIowaGreen(r){ return !!(r&&r.timed&&!r.timeUp&&!r.trial&&+r.pct>=GREEN); }
// One set: passages he hasn't had first (then the longest-ago), about 2–3 clean, shuffled. Try-outs don't count as "had".
function eicIowaPick(items,level,skill,L,n,rnd){
  rnd=rnd||Math.random; n=n||IOWA_N;
  const pool=arr(items).filter(it=>it&&it.bank===level&&it.skill===skill); if(!pool.length) return [];
  const last={};
  Object.keys(L||{}).map(id=>L[id]).filter(r=>r&&!r.trial&&r.skill===skill).sort((a,b)=>(a.ts||0)-(b.ts||0))
    .forEach(r=>arr(r.items).forEach(id=>{ last[id]=r.ts||1; }));
  const shuf=a=>{ a=a.slice(); for(let i=a.length-1;i>0;i--){ const j=Math.floor(rnd()*(i+1)); const t=a[i]; a[i]=a[j]; a[j]=t; } return a; };
  const order=a=>shuf(a).sort((x,y)=>(last[x.id]||0)-(last[y.id]||0));   // stable: unseen stay shuffled
  const clean=order(pool.filter(it=>+it.answer===4)), err=order(pool.filter(it=>+it.answer!==4));
  const want=Math.min(clean.length,rnd()<0.5?2:3), take=Math.min(n,pool.length);
  let set=clean.slice(0,want).concat(err.slice(0,take-want));
  if(set.length<take) set=set.concat(clean.slice(want,want+(take-set.length)));
  return shuf(set);
}
function eicIowaScore(set,answers){
  let right=0; const miss=[];
  arr(set).forEach((it,i)=>{ const a=+((answers||[])[i])||0; if(a===+it.answer) right++; else miss.push({n:i+1,it:it,said:a}); });
  const total=arr(set).length; return {right:right,total:total,pct:total?Math.round(right/total*100):0,miss:miss};
}
function loadIowa(){
  if(iowaBank) return Promise.resolve(iowaBank);
  const url=/github\.io$/.test(location.hostname)?("eic_iowa.json?v="+Date.now()):"eic_iowa.json";
  return fetch(url).then(r=>r.json()).then(d=>{ iowaBank=arr(d&&d.items); return iowaBank; })
    .catch(()=>{ toast("Couldn't load the Iowa practice passages."); return null; });
}
function clock(sec){ sec=Math.max(0,Math.ceil(sec)); return Math.floor(sec/60)+":"+String(sec%60).padStart(2,"0"); }
// Mom's try-out card in the panel (slice B): pick a skill, timed or not; the last few sets underneath.
function iowaTryCard(){
  const lv=eicIowaLevel(kid), who=esc((typeof SL_KLBL!=="undefined"&&SL_KLBL[kid])||kid);
  let h='<div style="margin-bottom:12px;padding:12px;border-radius:13px;border:1.5px dashed #a78bfa;background:#faf5ff"><div style="font-weight:800;font-size:15px;color:#0f172a;margin-bottom:3px">🧪 Iowa practice — step 4 (try it out)</div>'+
    '<div style="font-size:12px;color:#6b21a8;margin-bottom:9px">'+who+' gets the '+(lv==="level"?"Level":"Beginning")+' sets. Only you can open this for now; your tries are marked practice — they never count and don\'t use up his passages.</div>'+
    '<div style="display:flex;gap:7px;flex-wrap:wrap;align-items:center">'+chip("🧪 Capitalization","eicIowaTry(\'capitalization\')","background:#7c3aed;color:#fff;border-color:#7c3aed")+chip("🧪 Punctuation","eicIowaTry(\'punctuation\')","background:#7c3aed;color:#fff;border-color:#7c3aed")+
    chip(iowaTimed?"⏱ Timed":"Untimed","eicIowaTimed()",iowaTimed?"background:#ede9fe;border-color:#7c3aed;color:#5b21b6":"")+'</div>';
  const mine=Object.keys(iowaLogs).map(id=>Object.assign({id},iowaLogs[id])).filter(r=>r&&r.skill).sort((a,b)=>(b.ts||0)-(a.ts||0)).slice(0,5);
  if(mine.length) h+='<div style="margin-top:9px;font-size:12px;color:#475569">'+mine.map(r=>'<div style="display:flex;gap:8px;align-items:center;padding:2px 0"><span style="flex:1">'+esc(r.date||"")+' · '+esc(IOWA_NAME[r.skill]||r.skill)+' · '+esc(r.right)+' of '+esc(r.total)+' · <b>'+esc(r.pct)+'%</b> · '+(r.timed?clock(r.secs)+(r.timeUp?" ⏰":""):"untimed")+(r.trial?' <span style="color:#94a3b8">(your try)</span>':(eicIowaGreen(r)?' ✅':''))+'</span>'+rmBtn("eicIowaDel('"+esc(r.id)+"')")+'</div>').join("")+'</div>';
  return h+'</div>';
}
function iowaStart(skill,opts){
  opts=opts||{}; const trial=!!opts.trial, k=opts.kid||kid;
  if(trial&&!mom()) return; if(!IOWA_NAME[skill]) return;
  loadIowa().then(b=>{ if(!b) return;
    const set=eicIowaPick(b,eicIowaLevel(k),skill,k===kid?iowaLogs:{},IOWA_N); if(!set.length){ toast("No passages for that set yet."); return; }
    iowaRun={kid:k,skill:skill,level:eicIowaLevel(k),set:set,answers:[],i:0,start:Date.now(),limit:set.length*IOWA_SECS,timed:opts.timed!==false,trial:trial,done:false,timer:null};
    let ov=document.getElementById("eic-iowa"); if(ov) ov.remove();
    ov=document.createElement("div"); ov.id="eic-iowa";
    ov.style.cssText="position:fixed;inset:0;z-index:10070;background:#f8fafc;overflow:auto;font-family:'DM Sans',sans-serif;-webkit-user-select:none;user-select:none";
    document.body.appendChild(ov); iowaDraw();
    if(iowaRun.timed) iowaRun.timer=setInterval(iowaTick,250);
  });
}
function iowaTick(){
  const R=iowaRun; if(!R||R.done) return; const left=R.limit-(Date.now()-R.start)/1000;
  const bar=document.getElementById("eic-iowa-bar"), tx=document.getElementById("eic-iowa-clock");
  if(bar){ bar.style.width=Math.max(0,left/R.limit*100)+"%"; bar.style.background=left<=60?"#dc2626":"#7c3aed"; }
  if(tx) tx.textContent=clock(left);
  if(left<=0) iowaFinish(true);
}
function iowaTop(R,sub){
  return '<div style="position:sticky;top:0;background:#fff;border-bottom:1px solid #e2e8f0;padding:10px 14px;z-index:1"><div style="display:flex;align-items:center;gap:10px;max-width:760px;margin:0 auto">'+
    '<button onclick="eicIowaQuit()" style="padding:7px 11px;border-radius:9px;border:1.5px solid #cbd5e1;background:#fff;font-size:14px;font-weight:700;cursor:pointer">✕</button>'+
    '<div style="flex:1;font-weight:800;font-size:15px;color:#0f172a">✏️ '+esc(IOWA_NAME[R.skill])+' · Iowa practice'+(R.trial?' <span style="font-size:11px;color:#7c3aed">(try-out)</span>':'')+'</div>'+
    '<div style="font-size:13px;font-weight:700;color:#475569">'+sub+'</div>'+
    (R.timed&&!R.done?'<div id="eic-iowa-clock" style="font-size:16px;font-weight:800;color:#0f172a;min-width:48px;text-align:right">'+clock(R.limit-(Date.now()-R.start)/1000)+'</div>':'')+'</div>'+
    (R.timed&&!R.done?'<div style="max-width:760px;margin:8px auto 0;height:8px;border-radius:99px;background:#ede9fe;overflow:hidden"><div id="eic-iowa-bar" style="height:100%;width:'+Math.max(0,(R.limit-(Date.now()-R.start)/1000)/R.limit*100)+'%;background:#7c3aed;transition:width .25s linear"></div></div>':'')+'</div>';
}
function iowaDraw(){
  const R=iowaRun, box=document.getElementById("eic-iowa"); if(!R||!box||R.done) return;
  const it=R.set[R.i];
  const line=(n,txt)=>'<button onclick="eicIowaAnswer('+n+')" style="display:flex;align-items:center;gap:14px;width:100%;text-align:left;padding:16px 16px;margin-bottom:10px;border-radius:14px;border:2px solid #cbd5e1;background:#fff;cursor:pointer;font-family:\'DM Sans\',sans-serif;font-size:22px;line-height:1.35;color:#0f172a;-webkit-tap-highlight-color:transparent">'+
    '<span style="flex:none;width:36px;height:36px;border-radius:50%;background:#ede9fe;color:#5b21b6;font-weight:800;font-size:18px;display:flex;align-items:center;justify-content:center">'+n+'</span><span>'+txt+'</span></button>';
  box.innerHTML=iowaTop(R,"Passage "+(R.i+1)+" of "+R.set.length)+
    '<div style="max-width:760px;margin:0 auto;padding:18px 14px 30px"><div style="font-size:14px;color:#475569;margin-bottom:14px">Tap the line with the mistake — or <b>No mistakes</b>.</div>'+
    arr(it.lines).map((t,i)=>line(i+1,esc(t))).join("")+line(4,'<i style="color:#475569">No mistakes</i>')+'</div>';
}
function iowaAnswer(n){
  const R=iowaRun; if(!R||R.done||!(n>=1&&n<=4)) return;
  R.answers[R.i]=n; R.i++;
  if(R.i>=R.set.length) iowaFinish(false); else iowaDraw();
}
function iowaFinish(timeUp){
  const R=iowaRun; if(!R||R.done) return; R.done=true; if(R.timer){ clearInterval(R.timer); R.timer=null; }
  const el=Math.round((Date.now()-R.start)/1000), sc=eicIowaScore(R.set,R.answers), now=Date.now();
  const rec={ts:now,date:(typeof _todayStr==="function")?_todayStr():new Date(now).toISOString().slice(0,10),skill:R.skill,level:R.level,
    items:R.set.map(x=>x.id),answers:R.set.map((x,i)=>+R.answers[i]||0),right:sc.right,total:sc.total,pct:sc.pct,
    secs:R.timed?Math.min(el,R.limit):el,limit:R.limit,timed:R.timed,timeUp:!!(R.timed&&timeUp)};
  if(R.trial) rec.trial=true;
  R.rec=rec; R.score=sc; iowaResults();
  const keep=id=>{ if(R.kid===kid) iowaLogs[id]=rec; };
  if(typeof db==="undefined"||!db||dry()){ keep("local"+now); return; }
  const r=db.ref("eic/"+R.kid+"/iowa").push(); r.set(rec).then(()=>keep(r.key)).catch(()=>toast("Couldn't save that set — tell Mom."));
}
function iowaResults(){
  const R=iowaRun, box=document.getElementById("eic-iowa"); if(!R||!box) return;
  const r=R.rec, sc=R.score, green=eicIowaGreen(r);
  const badge=r.trial?'<span style="color:#7c3aed">Try-out — doesn\'t count</span>':green?'<span style="color:#16a34a">✅ Green!</span>':r.timeUp?'<span style="color:#b45309">⏰ Time ran out — finish inside the clock for a green</span>':(!r.timed?'<span style="color:#475569">Untimed — practice only</span>':'<span style="color:#b45309">Not yet — 80% is green</span>');
  let h=iowaTop(R,"Done")+'<div style="max-width:760px;margin:0 auto;padding:18px 14px 30px">'+
    '<div style="text-align:center;padding:18px;border-radius:16px;background:#fff;border:1.5px solid #e2e8f0;margin-bottom:16px"><div style="font-family:\'Fraunces\',serif;font-size:34px;font-weight:800;color:#0f172a">'+sc.right+' of '+sc.total+' · '+sc.pct+'%</div>'+
    '<div style="font-size:14px;font-weight:700;color:#475569;margin-top:4px">'+(r.timed?"Time "+clock(r.secs)+" of "+clock(r.limit):"Untimed")+'</div><div style="font-size:15px;font-weight:800;margin-top:8px">'+badge+'</div></div>';
  if(sc.miss.length){ h+='<div style="font-weight:800;font-size:15px;color:#0f172a;margin-bottom:8px">Let\'s look at the ones you missed</div>';
    sc.miss.forEach(m=>{ const it=m.it, ans=+it.answer;
      h+='<div style="padding:12px;border-radius:13px;background:#fff;border:1.5px solid #e2e8f0;margin-bottom:10px"><div style="font-size:12px;font-weight:700;color:#64748b;margin-bottom:6px">Passage '+m.n+' · you tapped '+(m.said?(m.said===4?"No mistakes":"line "+m.said):"nothing (time ran out)")+'</div>'+
        arr(it.lines).map((t,i)=>'<div style="display:flex;gap:8px;padding:5px 8px;border-radius:8px;font-size:17px;'+(i+1===ans?'background:#fef3c7;font-weight:700':'')+'"><span style="color:#94a3b8;font-weight:800">'+(i+1)+'</span><span>'+esc(t)+'</span></div>').join("")+
        '<div style="margin-top:7px;font-size:14px;color:#166534">'+(ans===4?'<b>No mistakes</b> — every line was right. ':'<b>Line '+ans+'</b> should read: <i>'+esc(it.fix&&it.fix.text)+'</i><br>')+'<span style="color:#475569">'+esc(String(it.rule||"").replace(/^Clean\.\s*/,""))+'</span></div></div>'; }); }
  else h+='<div style="text-align:center;font-size:16px;font-weight:700;color:#166534;margin-bottom:12px">Every one right! 🎉</div>';
  h+='<div style="text-align:center;margin-top:8px"><button onclick="eicIowaDone()" style="padding:13px 30px;border-radius:12px;border:none;background:#1d4ed8;color:#fff;font-size:16px;font-weight:800;cursor:pointer">Done</button></div></div>';
  box.innerHTML=h; box.scrollTop=0;
}
function iowaClose(){ const R=iowaRun; if(R&&R.timer) clearInterval(R.timer); iowaRun=null; const ov=document.getElementById("eic-iowa"); if(ov) ov.remove(); draw(); }
function iowaQuit(){ const R=iowaRun; if(R&&!R.done&&!confirm("Stop this set? It won't be saved.")) return; iowaClose(); }
function delIowa(id){
  if(!mom()||!iowaLogs[id]) return; if(!confirm("Remove this Iowa set?")) return;
  delete iowaLogs[id]; if(typeof db!=="undefined"&&db&&!dry()&&!/^local/.test(id)) db.ref("eic/"+kid+"/iowa/"+id).remove();
  draw();
}

// ── 🗓 the schedule's doorway (her ask 2026-09-22: "can we get it linked to the schedule" + "make page numbers
// out"): the Editor in Chief card opens the engine's NEXT page — first skill (capitalization, then punctuation, then
// the rest) whose current step still has a page to do. Pure, so the harness can pin it.
function eicNextSitting(T,L,D,isMom){
  const order=eicSkills(T).map(s=>s.key).sort((a,b)=>{ const ia=FIRST.indexOf(a), ib=FIRST.indexOf(b); return (ia<0?99:ia)-(ib<0?99:ib); });
  let rvTried=false;
  const tryRv=()=>{ rvTried=true; const rv=eicReviews(T,L,D), g=rv.gate;   // 🔁 step 3 comes right after capitalization + punctuation
    if(!rv.unlocked||g.cleared||!g.next||g.empty) return null;
    if(!isMom&&!eicCover(T,g.next.book,g.next.page).length) return null;
    return {skill:REV,step:3,book:g.next.book,page:g.next.page}; };
  for(const key of order){
    if(!rvTried&&FIRST.indexOf(key)<0){ const r=tryRv(); if(r) return r; }
    const pr=eicProgress(T,L,D,key), g=pr.gate, cur=pr.step;
    if(cur>=3||!g||!g.next||g.empty) continue;
    if(cur===2&&!isMom&&!eicCover(T,g.next.book,g.next.page).length) continue;   // a kid never gets a step-2 page without its covers
    return {skill:key,step:cur,book:g.next.book,page:g.next.page};
  }
  if(!rvTried){ const r=tryRv(); if(r) return r; }
  return null;
}
function openNext(k){
  if(k){ kid=k; try{ HA_LS.setItem("ha_eic_kid",kid); }catch(e){} logs={}; decs={}; counts={}; iowaLogs={}; }
  load().then(()=>{
    const n=eicNextSitting(TK(),logs,decs,mom());
    if(n&&eicWorkbook(books(),n.book)){ openPage(n.book,n.page); return; }
    panel(kid);
    toast(n?"That book's PDF isn't linked yet.":"Nothing waiting right now — every page built so far is done.");
  });
}
// ── open a page ────────────────────────────────────────────────────────────────────────────
function withBook(bk,go){
  const wb=eicWorkbook(books(),bk); if(!wb){ toast("That book's PDF isn't linked yet."); return; }
  if(typeof wbOpen!=="function") return; go(wb);
}
function openPage(bk,printed){ withBook(bk,wb=>{
  const skill=eicSkillOf(TK(),bk,printed), pool=skill?eicPool(TK(),skill):[], me=pool.find(p=>p.book===bk&&p.page===+printed);
  const rules=((me&&me.rules)||[]).map(p=>eicPdf(TK(),bk,p));
  const step=eicStepOf(TK(),bk,printed), cover=(step===2||step===3)?eicCover(TK(),bk,printed):[];
  if(step===3&&!mom()){
    if(!eicReviews(TK(),logs,decs).unlocked){ toast("The reviews open once capitalization and punctuation clear step 2."); return; }
    if(!cover.length){ toast("That page isn't ready yet — ask Mom."); return; } }
  if(step===2&&!mom()){ const pr=skill?eicProgress(TK(),logs,decs,skill):null;
    if(!pr||!pr.g1.cleared){ toast("That page is saved for step 2."); return; }
    if(!cover.length){ toast("That page isn't ready yet — ask Mom."); return; } }
  close(); wbOpen(wb.id,kid,eicPdf(TK(),bk,printed),{rules:rules,cover:cover,eic:{book:bk}});
  const gk=step===3?REV:skill;
  if(gk&&step){ const g=eicGate(logs,decs,gk,step,poolFor(TK(),gk,step)); if(g.round>1) toast("Round "+g.round+" — tap 🧽 Clear to start this page fresh."); } }); }
function checkPage(bk,printed){ if(!mom()) return; withBook(bk,wb=>{
  const kp=eicKeyPage(TK(),bk,printed);
  close(); wbOpen(wb.id,kid,eicPdf(TK(),bk,printed),{ans:kp?eicPdf(TK(),bk,kp):0,eic:{book:bk}}); }); }

// ── Mom's score: found / missed / extra for the page ON SCREEN ─────────────────────────────
function scoreOpen(){
  if(!mom()||typeof wbView==="undefined"||!wbView||!wbView.eic) return;
  const bk=wbView.eic.book, printed=eicPrinted(TK(wbView.kid),bk,wbView.page), skill=eicSkillOf(TK(wbView.kid),bk,printed);
  if(!skill&&!eicParagraphs(TK(wbView.kid),bk,printed).length){ toast("That page isn't an exercise page."); return; }
  if(eicStepOf(TK(wbView.kid),bk,printed)===2&&skill&&!eicProgress(TK(wbView.kid),logs,decs,skill).g1.cleared){ toast("Step 1 isn't cleared yet — that page is saved for step 2."); return; }
  const rvPage=eicStepOf(TK(wbView.kid),bk,printed)===3;
  let ov=document.getElementById("eic-score"); if(ov) ov.remove();
  ov=document.createElement("div"); ov.id="eic-score"; ov.className="dlg-overlay"; ov.style.display="flex"; ov.style.zIndex="10060";
  const inp=(id,ph)=>'<div style="text-align:center"><input id="'+id+'" inputmode="numeric" oninput="eicScorePreview()" placeholder="0" style="width:70px;text-align:center;font-size:22px;padding:10px;border:1.5px solid var(--border,#cbd5e1);border-radius:10px;font-family:\'DM Sans\',sans-serif"><div style="font-size:11px;font-weight:700;color:#64748b;margin-top:4px">'+ph+'</div></div>';
  ov.innerHTML='<div class="dlg-box" style="max-width:360px"><div class="dlg-title">Score — '+esc(SHORT[bk]||bk)+' p '+printed+'</div><div class="dlg-detail" style="margin-bottom:14px">'+esc((typeof SL_KLBL!=="undefined"&&SL_KLBL[wbView.kid])||wbView.kid)+'</div>'+
    '<div style="display:flex;gap:10px;justify-content:center">'+inp("eic-found","found")+inp("eic-missed","missed")+inp("eic-extra","extra marks")+'</div>'+
    (rvPage?'<div style="display:flex;gap:10px;justify-content:center;align-items:center;margin-top:12px;padding-top:10px;border-top:1px dashed #cbd5e1">'+inp("eic-said","he said — how many")+'<div id="eic-said-note" style="font-size:12px;color:#64748b;max-width:150px;line-height:1.35">Waiting for his 🔢 guess…</div></div>':'')+
    '<div id="eic-prev" style="text-align:center;margin-top:12px;font-size:15px;font-weight:800;color:#475569;min-height:22px"></div>'+
    '<div style="display:flex;gap:8px;margin-top:16px"><button onclick="eicScoreClose()" style="flex:1;padding:12px;border-radius:10px;font-weight:700;font-size:14px;cursor:pointer;border:none;background:#f3f4f6;color:#374151">Cancel</button><button onclick="eicScoreSave()" style="flex:1;padding:12px;border-radius:10px;font-weight:700;font-size:14px;cursor:pointer;border:none;background:#16a34a;color:#fff">Save</button></div></div>';
  document.body.appendChild(ov);
  if(rvPage){ const k=wbView.kid, key=eicCountKey(bk,printed,eicGate(logs,decs,REV,3,eicReviewPool(TK(k))).round);
    const fill=c=>{ const e=document.getElementById("eic-said"), n=document.getElementById("eic-said-note"); if(!e) return;
      if(c&&c.said!=null){ if(e.value==="") e.value=c.said; if(n) n.textContent="He locked in "+c.said+"."; }
      else if(n) n.textContent="He hasn't locked in a guess — type what he tells you, or leave it blank (then it can't be green)."; scorePreview(); };
    if(k===kid&&counts[key]) fill(counts[key]);
    else if(typeof db!=="undefined"&&db) db.ref("eic/"+k+"/counts/"+key).once("value").then(s=>fill(s.val())).catch(()=>fill(null)); else fill(null); }
}
function vals(){const g=id=>{const e=document.getElementById(id);const v=e&&e.value!==""?Number(e.value):0;return (isFinite(v)&&v>=0)?Math.floor(v):NaN;};
  const se=document.getElementById("eic-said"), sv=se&&se.value!==""?Number(se.value):null;
  return {found:g("eic-found"),missed:g("eic-missed"),extra:g("eic-extra"),rv:!!se,said:(sv!=null&&isFinite(sv)&&sv>=0)?Math.floor(sv):null};}
function scorePreview(){const v=vals(), p=eicPct(v.found,v.missed,v.extra), el=document.getElementById("eic-prev"); if(!el) return;
  const cOk=v.rv?eicCountOk(v.said,v.found,v.missed):true, grn=p!=null&&p>=GREEN&&cOk;
  el.textContent=(p==null)?"":p+"%"+(v.rv?"  ·  count "+(v.said==null?"—":v.said)+" vs "+((v.found||0)+(v.missed||0))+" "+(cOk?"✓":"✗"):"")+"  ·  "+(grn?"green":"not yet"); el.style.color=(p==null)?"#475569":(grn?"#16a34a":"#b45309");}
function scoreClose(){const ov=document.getElementById("eic-score"); if(ov) ov.remove();}
function scoreSave(){
  if(busy||!mom()||typeof wbView==="undefined"||!wbView||!wbView.eic) return;
  const v=vals(), pct=eicPct(v.found,v.missed,v.extra); if(pct==null){ toast("Enter how many he found and missed."); return; }
  const bk=wbView.eic.book, k=wbView.kid, printed=eicPrinted(TK(wbView.kid),bk,wbView.page), now=Date.now();
  const rec={ts:now,date:(typeof _todayStr==="function")?_todayStr():new Date(now).toISOString().slice(0,10),step:eicStepOf(TK(wbView.kid),bk,printed)||1,book:bk,page:printed,
    skill:eicSkillOf(TK(wbView.kid),bk,printed)||REV,paragraphs:eicParagraphs(TK(wbView.kid),bk,printed),found:v.found,missed:v.missed,extra:v.extra,pct:pct};
  if(rec.step===3){ rec.skill=REV; rec.total=v.found+v.missed; rec.countOk=eicCountOk(v.said,v.found,v.missed); if(v.said!=null) rec.said=v.said; }
  busy=true;
  const done=id=>{ busy=false; if(k===kid) logs[id]=rec; scoreClose(); toast("📊 Logged — "+pct+"%"+(rec.step===3?" · count "+(rec.countOk?"✓":"✗"):""));
    try{ if(typeof eicCheckCard==="function") eicCheckCard(k); }catch(e){} };   // 🗓 today's Editor in Chief card checks itself off
  if(typeof db==="undefined"||!db||dry()){ done("local"+now); return; }
  const r=db.ref("eic/"+k+"/log").push(); r.set(rec).then(()=>done(r.key)).catch(()=>{ busy=false; toast("Couldn't save that score — try again."); });
}
// 🔢 HOW MANY? (step 3). On a review page the kid guesses how many mistakes the page has BEFORE Mom grades it, and the
// guess locks: eic/<kid>/counts/<book>_p<N>_r<round> = {ts,said,book,page,round}. index.html's viewer bar asks
// eicCountBtn(wbView) for the button (kid view only); "" on any page that isn't a review.
function countCtx(v){
  if(!v||!v.eic) return null; const T=TK(v.kid), bk=v.eic.book, printed=eicPrinted(T,bk,v.page); if(!eicIsReview(T,bk,printed)) return null;
  const round=eicGate(logs,decs,REV,3,eicReviewPool(T)).round;
  return {k:v.kid,bk:bk,printed:printed,round:round,key:eicCountKey(bk,printed,round)};
}
function countBtn(v){
  try{ const c=countCtx(v); if(!c) return ""; const had=(c.k===kid)&&counts[c.key];
    return '<button onclick="eicCountOpen()" style="padding:7px 11px;border-radius:9px;border:1.5px solid '+(had?"#16a34a":"#7c3aed")+';background:'+(had?"#dcfce7":"#f5f3ff")+';color:'+(had?"#166534":"#5b21b6")+';font-size:13px;font-weight:800;cursor:pointer;font-family:\'DM Sans\',sans-serif">'+(had?"🔢 You said "+esc(had.said):"🔢 How many?")+'</button>';
  }catch(e){ return ""; }
}
function countOpen(){
  const c=countCtx(typeof wbView!=="undefined"?wbView:null); if(!c) return;
  const had=(c.k===kid)&&counts[c.key]; if(had){ toast("🔒 You said "+had.said+" — Mom will check it."); return; }
  let ov=document.getElementById("eic-count"); if(ov) ov.remove();
  ov=document.createElement("div"); ov.id="eic-count"; ov.className="dlg-overlay"; ov.style.display="flex"; ov.style.zIndex="10060";
  ov.innerHTML='<div class="dlg-box" style="max-width:340px;text-align:center"><div class="dlg-title">🔢 How many mistakes?</div>'+
    '<div class="dlg-detail" style="margin-bottom:12px">Count every mistake you found on this page — capitals, punctuation, spelling, all of them.</div>'+
    '<input id="eic-count-n" type="number" inputmode="numeric" min="0" max="99" placeholder="0" style="width:96px;text-align:center;font-size:30px;padding:10px;border:2px solid #7c3aed;border-radius:12px;font-family:\'DM Sans\',sans-serif">'+
    '<div style="font-size:12px;color:#64748b;margin-top:8px">Once you lock it in, it can\'t change.</div>'+
    '<div style="display:flex;gap:8px;margin-top:14px"><button onclick="eicCountClose()" style="flex:1;padding:12px;border-radius:10px;font-weight:700;font-size:14px;cursor:pointer;border:none;background:#f3f4f6;color:#374151">Not yet</button><button onclick="eicCountSave()" style="flex:1;padding:12px;border-radius:10px;font-weight:800;font-size:14px;cursor:pointer;border:none;background:#7c3aed;color:#fff">🔒 Lock it in</button></div></div>';
  document.body.appendChild(ov);
  try{ document.getElementById("eic-count-n").focus(); }catch(e){}
}
function countClose(){ const ov=document.getElementById("eic-count"); if(ov) ov.remove(); }
function countSave(){
  if(busy) return; const c=countCtx(typeof wbView!=="undefined"?wbView:null); if(!c) return;
  const e=document.getElementById("eic-count-n"), n=e&&e.value!==""?Number(e.value):NaN;
  if(!(isFinite(n)&&n>=0&&n<=99&&Math.floor(n)===n)){ toast("Type how many — a number."); return; }
  const rec={ts:Date.now(),said:n,book:c.bk,page:c.printed,round:c.round};
  const done=r=>{ busy=false; if(c.k===kid) counts[c.key]=r; countClose(); toast("🔒 Locked in: "+r.said); if(typeof wbBarRender==="function") wbBarRender(); };
  busy=true;
  if(typeof db==="undefined"||!db||dry()){ done(rec); return; }
  const ref=db.ref("eic/"+c.k+"/counts/"+c.key);
  ref.once("value").then(s=>{ const old=s.val(); if(old&&old.said!=null){ done(old); return; }   // already locked on another device
    return ref.set(rec).then(()=>done(rec)); }).catch(()=>{ busy=false; toast("Couldn't save that — try again."); });
}
// ✍ MANUAL MARKS (her ask 2026-09-22: "i def have been working on this loop manually and hes further ahead than
// page 1"). Mom only. A page can be marked Passed (a green, 100%) or Not yet (0%), or given a found/missed/extra score,
// on any date (default today) — same log line as a scored sitting, flagged manual. "Mark step done" = a Move-on
// decision flagged manual, allowed any time (the gate already honours Move on). All removable from the recent list.
let manTarget=null;
function eicManualTs(date){
  const now=Date.now(), today=(typeof _todayStr==="function")?_todayStr():new Date(now).toISOString().slice(0,10);
  if(!date||date===today) return now;
  const t=Date.parse(date+"T12:00:00"); return isFinite(t)?t+(now%60000):now;
}
function manualOpen(bk,printed){
  if(!mom()) return; manTarget={book:bk,page:+printed};
  let ov=document.getElementById("eic-man"); if(ov) ov.remove();
  ov=document.createElement("div"); ov.id="eic-man"; ov.className="dlg-overlay"; ov.style.display="flex"; ov.style.zIndex="10060";
  const today=(typeof _todayStr==="function")?_todayStr():new Date().toISOString().slice(0,10);
  const inp=(id,ph)=>'<div style="text-align:center"><input id="'+id+'" inputmode="numeric" placeholder="0" style="width:62px;text-align:center;font-size:18px;padding:8px;border:1.5px solid #cbd5e1;border-radius:10px;font-family:\'DM Sans\',sans-serif"><div style="font-size:11px;color:#64748b;margin-top:3px">'+ph+'</div></div>';
  const btn=(lbl,fn,st)=>'<button onclick="'+fn+'" style="flex:1;padding:11px;border-radius:10px;font-weight:800;font-size:14px;cursor:pointer;border:none;font-family:\'DM Sans\',sans-serif;'+st+'">'+lbl+'</button>';
  ov.innerHTML='<div class="dlg-box" style="max-width:360px"><div class="dlg-title">\u270D Mark '+esc(SHORT[bk]||bk)+' p '+esc(printed)+'</div>'+
    '<div class="dlg-detail" style="margin-bottom:10px">'+esc((typeof SL_KLBL!=="undefined"&&SL_KLBL[kid])||kid)+' \u00b7 done on <input id="eic-man-date" type="date" value="'+today+'" style="font-size:13px;padding:3px 6px;border:1px solid #cbd5e1;border-radius:8px"></div>'+
    '<div style="display:flex;gap:8px;margin-bottom:12px">'+btn("\u2713 Passed","eicManualSave(\'pass\')","background:#16a34a;color:#fff")+btn("Not yet","eicManualSave(\'fail\')","background:#fef3c7;color:#92400e")+'</div>'+
    '<div style="font-size:12px;color:#64748b;text-align:center;margin-bottom:6px">or enter his score</div>'+
    '<div style="display:flex;gap:8px;justify-content:center">'+inp("eic-man-found","found")+inp("eic-man-missed","missed")+inp("eic-man-extra","extra")+'</div>'+
    '<div style="display:flex;gap:8px;margin-top:14px">'+btn("Cancel","eicManualClose()","background:#f3f4f6;color:#374151")+btn("Save score","eicManualSave(\'score\')","background:#1d4ed8;color:#fff")+'</div></div>';
  document.body.appendChild(ov);
}
function manualClose(){ const ov=document.getElementById("eic-man"); if(ov) ov.remove(); manTarget=null; }
function manualSave(kind){
  if(busy||!mom()||!manTarget) return;
  const bk=manTarget.book, printed=manTarget.page, de=document.getElementById("eic-man-date");
  const date=(de&&de.value)||((typeof _todayStr==="function")?_todayStr():new Date().toISOString().slice(0,10));
  let found=null, missed=null, extra=null, pct;
  if(kind==="pass") pct=100; else if(kind==="fail") pct=0;
  else { const g=id=>{const e=document.getElementById(id);const v=e&&e.value!==""?Number(e.value):0;return (isFinite(v)&&v>=0)?Math.floor(v):NaN;};
    found=g("eic-man-found"); missed=g("eic-man-missed"); extra=g("eic-man-extra"); pct=eicPct(found,missed,extra);
    if(pct==null){ toast("Enter how many he found and missed — or tap Passed / Not yet."); return; } }
  const rec={ts:eicManualTs(date),date:date,step:eicStepOf(TK(),bk,printed)||1,book:bk,page:printed,skill:eicSkillOf(TK(),bk,printed)||REV,
    paragraphs:eicParagraphs(TK(),bk,printed),pct:pct,manual:true};
  if(found!=null){ rec.found=found; rec.missed=missed; rec.extra=extra; }
  busy=true;
  const done=id=>{ busy=false; logs[id]=rec; manualClose(); toast("\u270D Marked "+(SHORT[bk]||bk)+" p "+printed+" \u2014 "+(kind==="pass"?"passed":kind==="fail"?"not yet":pct+"%")); draw(); };
  if(typeof db==="undefined"||!db||dry()){ done("local"+rec.ts); return; }
  const r=db.ref("eic/"+kid+"/log").push(); r.set(rec).then(()=>done(r.key)).catch(()=>{ busy=false; toast("Couldn't save that — try again."); });
}
function stepDone(skill,step){
  if(busy||!mom()) return;
  if(!confirm("Mark step "+step+" done for this skill?\n\nUse this when he has already worked past it. It shows in the list under the skill — tap remove to undo.")) return;
  const now=Date.now(), rec={ts:now,date:(typeof _todayStr==="function")?_todayStr():new Date(now).toISOString().slice(0,10),skill:skill,step:step,action:"moveon",manual:true};
  busy=true;
  const done=id=>{ busy=false; decs[id]=rec; draw(); toast("\u2713 Step "+step+" marked done"); };
  if(typeof db==="undefined"||!db||dry()){ done("local"+now); return; }
  const r=db.ref("eic/"+kid+"/decisions").push(); r.set(rec).then(()=>done(r.key)).catch(()=>{ busy=false; toast("Couldn't save that — try again."); });
}
function delDec(id){
  if(!mom()||!decs[id]||!decs[id].manual) return; if(!confirm("Undo this 'step done' mark?")) return;
  delete decs[id]; if(typeof db!=="undefined"&&db&&!dry()&&!/^local/.test(id)) db.ref("eic/"+kid+"/decisions/"+id).remove();
  draw();
}
function delLog(id){
  if(!mom()||!logs[id]) return; if(!confirm("Remove this score?")) return;
  delete logs[id]; if(typeof db!=="undefined"&&db&&!dry()&&!/^local/.test(id)) db.ref("eic/"+kid+"/log/"+id).remove();
  draw();
}
function decide(skill,step,action){
  if(busy||!mom()||(action!=="redo"&&action!=="moveon")) return;
  const g=eicGate(logs,decs,skill,step,poolFor(TK(),skill,step)); if(!g.empty) return;   // only when the pool really ran out
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

window.eicPanel=panel; window.eicClose=close; window.eicOpen=openPage; window.eicCheck=checkPage; window.eicOpenNext=openNext; window.eicNextSitting=eicNextSitting;
window.eicSetKid=k=>{ kid=k; try{HA_LS.setItem("ha_eic_kid",k);}catch(e){} logs={}; decs={}; counts={}; iowaLogs={}; load().then(draw); };
window.eicToggleAll=()=>{ showAll=!showAll; draw(); }; window.eicNoBook=()=>toast("That book's PDF isn't linked yet.");
window.eicScoreOpen=scoreOpen; window.eicScorePreview=scorePreview; window.eicScoreClose=scoreClose; window.eicScoreSave=scoreSave;
window.eicDelLog=delLog; window.eicDelDec=delDec; window.eicManual=manualOpen; window.eicManualClose=manualClose; window.eicManualSave=manualSave; window.eicStepDone=stepDone; window.eicLink=link; window.eicToggleKid=toggleKid; window.eicDecide=decide;
window.eicLocked=()=>toast("That page is saved for step 2."); window.eicRvLocked=()=>toast("The reviews open once capitalization and punctuation clear step 2.");
window.eicIowaTry=sk=>iowaStart(sk,{trial:true,timed:iowaTimed}); window.eicIowaTimed=()=>{ iowaTimed=!iowaTimed; draw(); };
window.eicIowaAnswer=iowaAnswer; window.eicIowaQuit=iowaQuit; window.eicIowaDone=iowaClose; window.eicIowaDel=delIowa;
window.eicCountBtn=countBtn; window.eicCountOpen=countOpen; window.eicCountClose=countClose; window.eicCountSave=countSave; window.eicNotReady=()=>toast("That page isn't ready yet — ask Mom.");
window._eicTest={eicIowaPick,eicIowaScore,eicIowaGreen,eicIowaLevel,eicReviewPool,eicReviews,eicIsReview,eicCountOk,eicCountKey,eicLadder,eicTagsFor,eicManualTs,eicNextSitting,eicCover,eicProgress,eicStepPools,eicStepOf,eicGate,eicPct,eicSkills,eicPool,eicPdf,eicPrinted,eicKeyPage,eicParagraphs,eicSkillOf,eicLast,eicWorkbook,canon,setTags:t=>{tags=t;}};
})();
