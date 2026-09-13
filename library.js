// 📚 School Room ▸ Books — the curriculum-book library, READ-ONLY.
// Data is a copy of ~/Desktop/HoweCurriculum/curriculum_books.json written to
//   library/books/<id>   (records: title, level, kid, status, location, toc, planning …)
//   libraryPhotos/<id>   (150px cover data-URLs — its own node so covers only load here)
// Loaded lazily by play.js the first time Books is opened.
// Writes (both Mom-gated, both in their own nodes so a re-sync of library/books never clobbers them):
//   library/links/<bookId>/<kid> = {subject, at} — after Mom adds a book through the app's own Add Subject
//   library/scans/<bookId> = {lessons:[…], at, photos} — a table of contents read from photos by Claude
(function(){
"use strict";
let lbBooks=null, lbPhotos={}, lbLinks={}, lbScans={}, lbScanMsg={}, lbLoading=false, lbErr="", lbOpenId=null;
const lbF={q:"",kid:"all",lane:"all",status:"all",loc:"all",show:60};

const LB_LANES=[
  ["PHONICS","Phonics · Spelling","#EDA1A1"],["WRITING","Writing · Grammar","#508D90"],
  ["LITERATURE","Literature · Reading","#BB8EA3"],["MATH","Math","#5692B4"],
  ["THINKING","Thinking · Logic","#586369"],["SCIENCE","Science","#A3BFB3"],
  ["HISTORY","History · Geography","#936738"],["ART","Art · Music · Life","#DB9768"]];
const LB_LANE=Object.fromEntries(LB_LANES.map(l=>[l[0],l]));
// Same keyword rules as the Kallax plan (gen_curriculum_html.py _p_subject), so a book's
// lane here matches the colour dot it gets on the shelf.
function lbLane(b){
  const s=String(b.subject||"").toLowerCase(); const h=(...w)=>w.some(x=>s.includes(x));
  if(h("spelling","phonic","handwriting","penmanship"))return "PHONICS";
  if(h("grammar","writing","vocabular","language art","etymolog","editing"))return "WRITING";
  if(h("literature","novel","folktale","poetry","book lists","series","reading","comprehension","inference"))return "LITERATURE";
  if(h("math","fraction","arithmetic"))return "MATH";
  if(h("thinking","logic","riddle","reasoning","test prep","memory","puzzle","problem solving","interest-led"))return "THINKING";
  if(h("science","stem","weather","nutrition","body","senses","forces","germ","anatomy","animal","habitat"))return "SCIENCE";
  if(h("history","social stud","geograph","civic","atlas","biograph","government","explorer","cultur","religion","unit stud","community","jobs"))return "HISTORY";
  return "ART";
}
const LB_KIDS=[["lincoln","Lincoln","#2563eb"],["ellis","Ellis","#16a34a"],["lucy","Lucy","#db2777"],["julian","Julian","#ea580c"],["mom","Mom","#b5394a"]];
const LB_STATUS={"in-use":["🟢 in use","#16a34a"],"planned":["🗓 planned","#2563eb"],"shelved":["📚 shelved","#64748b"],"next-year":["⏭ next year","#7c3aed"],"done":["✅ done","#94a3b8"]};
const LB_REC={keep:"#16a34a",sell:"#d97706",donate:"#dc2626",cull:"#7f1d1d",undecided:"#7c3aed"};

function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function lbLocKey(b){const L=b.location||{};
  if(L.cart)return "cart"; const k=L.kallax||"";
  if(k==="BOX")return "box"; if(k==="TABLE")return "table"; if(k==="ONLINE")return "online"; if(k==="BASKET")return "basket";
  return k?"shelf":"none";}
function lbLocText(b){const L=b.location||{};
  if(L.cart)return "🛒 "+String(L.cart).replace(/^./,c=>c.toUpperCase())+"'s cart"+(L.tier?" · tier "+L.tier:"");
  const k=L.kallax||"";
  if(k==="BOX")return "📦 still in the box"; if(k==="TABLE")return "📥 on the table"+(L.nextCube?" → "+L.nextCube:"");
  if(k==="ONLINE")return "💻 online"; if(k==="BASKET")return "🧺 Morning Basket";
  return k?"🗄 Kallax "+k:"—";}
function lbKids(b){const s=String(b.kid||"").toLowerCase();return LB_KIDS.filter(k=>s.includes(k[0]));}
function lbHay(b){return [b.title,b.series,b.publisher,b.subject,b.level,b.kid,b.summary,b.planning,(b.toc||[]).join(" ")].join(" ").toLowerCase();}

function lbLoad(root){
  if(lbBooks||lbLoading)return; lbLoading=true;
  if(typeof db==="undefined"||!db||!db.ref){lbErr="No database connection.";lbLoading=false;lbDraw(root);return;}
  db.ref("library/books").once("value").then(s=>{
    const v=s.val()||{}; lbBooks=Object.entries(v).map(([id,b])=>Object.assign({id:id},b));
    lbBooks.forEach(b=>{b._lane=lbLane(b);b._hay=lbHay(b);});
    lbBooks.sort((a,b)=>String(a.title||"").localeCompare(String(b.title||"")));
    lbLoading=false; lbDraw(root);
    db.ref("library/links").once("value").then(l=>{lbLinks=l.val()||{};lbDraw(root);}).catch(()=>{});
    db.ref("library/scans").once("value").then(l=>{lbScans=l.val()||{};lbDraw(root);}).catch(()=>{});
    // covers second, so the list shows up before ~4 MB of thumbnails arrive
    return db.ref("libraryPhotos").once("value").then(p=>{lbPhotos=p.val()||{};lbDraw(root);});
  }).catch(e=>{lbErr="Couldn't load the library ("+(e&&e.message||e)+").";lbLoading=false;lbDraw(root);});
}

function lbMatch(b){
  if(lbF.kid!=="all"&&!String(b.kid||"").toLowerCase().includes(lbF.kid))return false;
  if(lbF.lane!=="all"&&b._lane!==lbF.lane)return false;
  if(lbF.status!=="all"&&(b.status||"")!==lbF.status)return false;
  if(lbF.loc!=="all"&&lbLocKey(b)!==lbF.loc)return false;
  if(lbF.q){const w=lbF.q.toLowerCase().split(/\s+/).filter(Boolean);if(!w.every(x=>b._hay.includes(x)))return false;}
  return true;
}
function chip(txt,col,solid){return '<span class="lb-chip" style="'+(solid?"background:"+col+";color:#fff;border-color:"+col:"color:"+col+";border-color:"+col+"55")+'">'+esc(txt)+'</span>';}
function sel(name,cur,opts){return '<select class="lb-sel" onchange="lbSet(\''+name+'\',this.value)">'+opts.map(o=>'<option value="'+esc(o[0])+'"'+(o[0]===cur?" selected":"")+'>'+esc(o[1])+'</option>').join("")+'</select>';}

function lbCard(b){
  const lane=LB_LANE[b._lane]; const st=LB_STATUS[b.status]; const ph=lbPhotos[b.id];
  return '<button class="lb-card" onclick="lbOpen(\''+esc(b.id)+'\')">'+
    '<span class="lb-bar" style="background:'+lane[2]+'"></span>'+
    '<div class="lb-cov">'+(ph?'<img loading="lazy" src="'+ph+'" alt="">':'<span>📘</span>')+'</div>'+
    '<div class="lb-body"><div class="lb-t">'+esc(b.title||b.id)+'</div>'+
    '<div class="lb-m">'+esc([b.level,b.grade?"gr "+b.grade:""].filter(Boolean).join(" · "))+'</div>'+
    '<div class="lb-chips">'+lbKids(b).map(k=>chip(k[1],k[2],true)).join("")+(st?chip(st[0],st[1]):"")+
      Object.keys(lbLinks[b.id]||{}).map(k=>chip("🔗 in "+lbKidName(k)+"'s plan","#0f766e")).join("")+'</div>'+
    '<div class="lb-loc">'+esc(lbLocText(b))+'</div></div></button>';
}

function lbDraw(root){
  root=root||document.getElementById("lib-root"); if(!root)return;
  if(lbErr){root.innerHTML='<div class="lb-empty">'+esc(lbErr)+'</div>';return;}
  if(!lbBooks){root.innerHTML='<div class="lb-empty">Loading the library…</div>';return;}
  const hits=lbBooks.filter(lbMatch);
  const cnt=k=>lbBooks.filter(b=>lbLocKey(b)===k).length;
  let h='<div class="lb-top">'+
    '<input type="search" class="lb-q" placeholder="Search '+lbBooks.length+' books — title, subject, a chapter…" value="'+esc(lbF.q)+'" oninput="lbSet(\'q\',this.value)">'+
    '<div class="lb-filters">'+
    sel("kid",lbF.kid,[["all","Everyone"]].concat(LB_KIDS.map(k=>[k[0],k[1]])))+
    sel("lane",lbF.lane,[["all","All subjects"]].concat(LB_LANES.map(l=>[l[0],l[1]])))+
    sel("status",lbF.status,[["all","Any status"]].concat(Object.entries(LB_STATUS).map(([k,v])=>[k,v[0]])))+
    sel("loc",lbF.loc,[["all","Anywhere"],["shelf","🗄 On the Kallax"],["cart","🛒 On a cart"],["box","📦 In the box ("+cnt("box")+")"],["table","📥 On the table ("+cnt("table")+")"],["basket","🧺 Morning Basket"],["online","💻 Online"]])+
    '</div><div class="lb-count">'+hits.length+' of '+lbBooks.length+' books'+
    ((lbF.q||lbF.kid!=="all"||lbF.lane!=="all"||lbF.status!=="all"||lbF.loc!=="all")?' · <a href="#" onclick="lbReset();return false">clear</a>':'')+'</div></div>';
  h+='<div class="lb-grid">'+hits.slice(0,lbF.show).map(lbCard).join("")+'</div>';
  if(hits.length>lbF.show)h+='<div style="text-align:center;margin:6px 0 22px"><button class="lb-more" onclick="lbSet(\'show\','+(lbF.show+60)+')">Show more ('+(hits.length-lbF.show)+' left)</button></div>';
  if(!hits.length)h+='<div class="lb-empty">No books match.</div>';
  const keepFocus=document.activeElement&&document.activeElement.classList.contains("lb-q");
  const pos=keepFocus?document.activeElement.selectionStart:0;
  root.innerHTML=h+'<div id="lb-sheet" onclick="if(event.target.id===\'lb-sheet\')lbClose()"><div class="lb-sh" id="lb-shbody"></div></div>';
  if(keepFocus){const q=root.querySelector(".lb-q");q.focus();try{q.setSelectionRange(pos,pos);}catch(e){}}
  if(lbOpenId)lbOpen(lbOpenId);
}

function lbOpen(id){
  const b=(lbBooks||[]).find(x=>x.id===id); if(!b)return; lbOpenId=id;
  const lane=LB_LANE[b._lane]; const st=LB_STATUS[b.status]; const ph=lbPhotos[b.id];
  const row=(k,v)=>v?'<div class="lb-row"><b>'+k+'</b><span>'+esc(v)+'</span></div>':"";
  const toc=b.toc||[];
  let h='<button class="lb-x" onclick="lbClose()">✕</button>'+
    '<div style="display:flex;gap:14px;align-items:flex-start">'+
    (ph?'<img class="lb-bigcov" src="'+ph+'" alt="">':"")+
    '<div style="min-width:0"><div style="font-size:17px;font-weight:800;line-height:1.25">'+esc(b.title||b.id)+'</div>'+
    '<div class="lb-m" style="margin-top:3px">'+esc([b.series,b.publisher].filter(Boolean).join(" · "))+'</div>'+
    '<div class="lb-chips" style="margin-top:8px">'+chip(lane[1],lane[2],true)+lbKids(b).map(k=>chip(k[1],k[2],true)).join("")+(st?chip(st[0],st[1]):"")+
      (b.recommendation?chip("rec: "+b.recommendation,LB_REC[b.recommendation]||"#64748b"):"")+(b.decision?chip("your call: "+b.decision,LB_REC[b.decision]||"#64748b",true):"")+'</div></div></div>'+
    '<div class="lb-rows">'+row("Where",lbLocText(b))+row("Level",b.level)+row("Age / grade",[b.age,b.grade?"gr "+b.grade:""].filter(Boolean).join(" · "))+
      row("Subject",b.subject)+row("Type",[b.type,b.consumable?"write-in":(b.consumable===false?"reusable":"")].filter(Boolean).join(" · "))+'</div>'+
    lbAddHtml(b)+
    (b.summary?'<div class="lb-sec"><h4>About</h4><p>'+esc(b.summary)+'</p></div>':"")+
    (b.planning?'<div class="lb-sec"><h4>Planning note</h4><p>'+esc(b.planning)+'</p></div>':"")+
    (b.why?'<div class="lb-sec"><h4>Why '+esc(b.recommendation||"")+'</h4><p>'+esc(b.why)+'</p></div>':"")+
    (b.notes?'<div class="lb-sec"><h4>Notes</h4><p>'+esc(b.notes)+'</p></div>':"")+
    '<div class="lb-sec"><h4>Table of contents <span style="font-weight:600;color:var(--muted)">('+toc.length+')</span></h4>'+
    (toc.length?'<ol class="lb-toc">'+toc.map(t=>{const hd=/^(Week|Ch(apter)?|Unit|—|Chemistry|Biology|Physics|Geology|Astronomy|Introduction|Conclusion)\b/.test(t)&&!/^Lesson/.test(t);
      return '<li'+(hd?' class="hd"':'')+'>'+esc(t)+'</li>';}).join("")+'</ol>':'<p style="color:var(--muted)">No table of contents logged yet.</p>')+'</div>';
  document.getElementById("lb-shbody").innerHTML=h;
  document.getElementById("lb-sheet").classList.add("open");
}
// ── ➕ Add to a kid's curriculum ─────────────────────────────────────────────
// Opens the app's OWN Add Subject sheet (ceOpenAdd) pre-filled from the book, so Mom checks it
// and presses Add Subject herself; ceAddSave then opens the subject with its pacing builder.
const LB_ADD_KIDS=["lincoln","ellis","lucy","julian"];
const LB_WEEKS=34;   // school weeks used for the "how often" suggestion
function lbKidName(k){const r=LB_KIDS.find(x=>x[0]===k);return r?r[1]:String(k||"");}
function lbMomOk(){return (typeof momPinUnlocked!=="undefined"&&momPinUnlocked)||window._plMomOk===true;}
// The book's table of contents → one lesson per line.
function lbLessons(b,depth){
  const sc=lbScans[b.id]; if(sc&&Array.isArray(sc.lessons)&&sc.lessons.length) return sc.lessons.map(String);
  let toc=(b.toc||[]).map(t=>String(t).replace(/\s+/g," ").trim()).filter(Boolean);
  // "Same 36 weeks … — see gwtm-purple-workbook" → use that book's list (answer keys, teacher texts)
  if(toc.length<=2&&!depth){const m=toc.join(" ").match(/\bsee ([a-z0-9][a-z0-9-]+)/);
    const o=m&&(lbBooks||[]).find(x=>x.id===m[1]); if(o)return lbLessons(o,1);}
  // Teacher's-guide chapter lines "Ch 8 Algebraic Expressions — …; Lessons 1-7 (…)" → Ch 8 · Lesson 1…7
  const out=[];
  toc.forEach(t=>{const m=t.match(/^(.*?)\s+—.*?\bLessons?\s+1\s*-\s*(\d+)/i);
    if(m&&+m[2]<=60){const ch=m[1].replace(/\s*\(p\.[^)]*\)\s*$/,"");for(let i=1;i<=+m[2];i++)out.push(ch+" · Lesson "+i);}
    else out.push(t);});
  toc=out;
  let keep;
  if(toc.some(t=>/^(Lesson|Review)\b/i.test(t))) keep=toc.filter(t=>/^(Lesson|Review)\b/i.test(t)||/ · Lesson \d+$/.test(t));
  else if(toc.some(t=>/^\d+\.\d+\s/.test(t))) keep=toc.filter(t=>/^\d+\.\d+\s/.test(t));
  else keep=toc.filter(t=>!/^(Front:|Back:|— |\(|Same |TOC )/.test(t));
  return keep.map(t=>{if(t.length>80&&t.indexOf(" — ")>0)t=t.slice(0,t.indexOf(" — "));return t.length>140?t.slice(0,137)+"…":t;});
}
function lbTpw(n){return Math.max(1,Math.min(5,Math.ceil(n/LB_WEEKS)));}
function lbAddName(b){return String(b.title||b.id).replace(/\s*\([^)]*\)/g,"").replace(/\s+/g," ").trim();}
function lbAddHtml(b){
  const L=lbLessons(b), links=lbLinks[b.id]||{}, mine=lbKids(b).map(k=>k[0]);
  const kids=LB_ADD_KIDS.slice().sort((x,y)=>(mine.includes(y)?1:0)-(mine.includes(x)?1:0));
  const hint=L.length>=3
    ?'Fills in <b>'+L.length+' lessons</b> from the table of contents · suggests <b>'+lbTpw(L.length)+'×/week</b> (≈'+Math.ceil(L.length/lbTpw(L.length))+' weeks). You check it and press <b>Add Subject</b>; then set the pacing.'
    :'No usable lesson list yet — it opens with numbered lessons you can change. You check it and press <b>Add Subject</b>.';
  const sc=lbScans[b.id], msg=lbScanMsg[b.id]||"";
  const scan='<div class="lb-scan"><label class="lb-scanbtn">📸 '+(sc?"Re-scan":"Scan")+' the table of contents'+
      '<input type="file" accept="image/*" multiple style="display:none" onchange="lbScan(\''+esc(b.id)+'\',this)"></label>'+
    '<span class="lb-scanmsg">'+(msg?esc(msg):(sc?'✓ Scanned '+new Date(sc.at).toLocaleDateString()+' · '+sc.lessons.length+' lessons — used below':
      (L.length>=3?'Optional — photos of the contents pages give a better lesson list':'Photograph the contents pages (up to 8) to build the lesson list')))+'</span></div>';
  return '<div class="lb-sec lb-add"><h4>➕ Add to a kid\'s curriculum</h4>'+scan+'<p style="font-size:12px;color:var(--muted)">'+hint+'</p>'+
    '<div class="lb-addrow">'+kids.map(k=>{const on=links[k];const col=(LB_KIDS.find(x=>x[0]===k)||[])[2]||"#111827";
      return on?'<span class="lb-addbtn done" style="border-color:'+col+';color:'+col+'">✓ '+esc(lbKidName(k))+' · '+esc(on.subject||"")+'</span>'
        :'<button class="lb-addbtn" style="background:'+(mine.includes(k)?col:"#fff")+';color:'+(mine.includes(k)?"#fff":col)+';border-color:'+col+'" onclick="lbAddTo(\''+esc(b.id)+'\',\''+k+'\')">Add to '+esc(lbKidName(k))+'</button>';}).join("")+'</div></div>';
}
function lbPin(then){
  document.getElementById("lb-shbody").innerHTML='<button class="lb-x" onclick="lbClose()">✕</button><div style="text-align:center;padding:14px 4px">'+
    '<div style="font-size:40px">👩</div><div style="font-size:13px;font-weight:700;color:#b5394a;margin:8px 0 6px">Enter Admin Code to add a subject</div>'+
    '<input id="lb-pin" type="password" inputmode="numeric" maxlength="4" placeholder="••••" autocomplete="off" style="width:100px;text-align:center;font-size:20px;letter-spacing:6px;padding:8px 10px;border:2px solid var(--border);border-radius:8px;font-family:monospace" oninput="lbPinTry(this.value)">'+
    '<div id="lb-pin-err" style="font-size:11px;color:#b5394a;margin-top:4px;min-height:14px"></div></div>';
  window._lbPinThen=then; document.getElementById("lb-sheet").classList.add("open");
  setTimeout(()=>{const i=document.getElementById("lb-pin");if(i)i.focus();},50);
}
function lbPinTry(v){
  if(v.length<4)return;
  const pin=(typeof APP_PIN!=="undefined")?APP_PIN:"0000";
  if(v===pin){window._plMomOk=true;const t=window._lbPinThen;window._lbPinThen=null;if(t)t();}
  else{const e=document.getElementById("lb-pin-err"),i=document.getElementById("lb-pin");if(e)e.textContent="Incorrect code";if(i)i.value="";}
}
function lbAddTo(id,kid){
  const b=(lbBooks||[]).find(x=>x.id===id); if(!b)return;
  if(!lbMomOk()){lbPin(()=>lbAddTo(id,kid));return;}
  if(typeof ceOpenAdd!=="function"||typeof ceRenderAddSheet!=="function"||typeof currData==="undefined"||!currData){
    alert("The curriculum is still loading — try again in a moment.");return;}
  lbWrapSave();
  const L=lbLessons(b);
  lbClose();
  ceOpenAdd(kid);                       // the app's own sheet, fresh form
  ceAddForm.name=lbAddName(b);
  ceAddForm.device="book";
  if(L.length>=3){ceAddForm.lessonSource="manual";ceAddForm.manualLessons=L.join("\n");ceAddForm.total=L.length;}
  ceAddForm.timesPerWeek=lbTpw(L.length>=3?L.length:ceAddForm.total);
  window._lbPending={bookId:id,kid:kid,form:ceAddForm};
  ceRenderAddSheet();
  if(typeof gwShowToast==="function")gwShowToast("📚 Filled in from "+lbAddName(b)+(L.length>=3?" — "+L.length+" lessons":"")+". Check it, then Add Subject.");
}
// 📸 Read a table of contents from photos (same Claude call + image shrink the Builder's
// "Scan the book" uses) → one lesson per sitting, saved to library/scans/<bookId>.
async function lbScan(id,input){
  const files=[...(input.files||[])]; input.value="";
  const b=(lbBooks||[]).find(x=>x.id===id); if(!b||!files.length)return;
  if(!lbMomOk()){lbPin(()=>{lbOpen(id);lbScanMsg[id]="Code accepted — tap Scan again.";lbOpen(id);});return;}
  const say=m=>{lbScanMsg[id]=m;if(lbOpenId===id)lbOpen(id);};
  const key=(typeof mastAIKey!=="undefined"&&mastAIKey)||(typeof haGetKey==="function"?haGetKey():"");
  if(!key){say("⚠ No AI key set — add one in Admin → Settings.");return;}
  if(typeof _cbShrinkImage!=="function"){say("⚠ Scanner not available in this build.");return;}
  try{
    say("Reading "+files.length+" photo"+(files.length!==1?"s":"")+"…");
    const imgs=await Promise.all(files.slice(0,8).map(_cbShrinkImage));
    say("Asking Claude to read the contents…");
    const content=imgs.map(d=>({type:"image",source:{type:"base64",media_type:"image/jpeg",data:d}}));
    content.push({type:"text",text:
      "These photos show the table of contents of a homeschool book: \""+String(b.title||"")+"\". "+
      "List the book's LESSONS in book order — one entry per sitting a child would do (a numbered lesson, section, chapter or review). "+
      "Skip front matter, indexes, glossaries and answer keys. If the contents list chapters that contain numbered lessons, list the lessons. "+
      "Keep each entry under 70 characters, and end it with the start page like \" (p.12)\" when a page is shown. "+
      'Return ONLY strict JSON, no commentary: {"lessons":["Lesson 1: Nouns (p.1)","Lesson 2: Adjectives (p.4)"]}'});
    const resp=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",
      headers:{"content-type":"application/json","x-api-key":key,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},
      body:JSON.stringify({model:"claude-sonnet-5",max_tokens:8000,messages:[{role:"user",content}]})});
    if(!resp.ok){const t=await resp.text();throw new Error("Claude API "+resp.status+" — "+t.slice(0,140));}
    const data=await resp.json();
    const txt=(data.content||[]).filter(x=>x&&x.type==="text").map(x=>x.text||"").join("");
    window._lbScanRaw=txt;
    const a=txt.indexOf("{"),z=txt.lastIndexOf("}");
    if(a<0||z<=a)throw new Error("Couldn't read a lesson list — try clearer photos.");
    const lessons=(JSON.parse(txt.slice(a,z+1)).lessons||[]).map(x=>String(x||"").replace(/\s+/g," ").trim().slice(0,140)).filter(Boolean);
    if(lessons.length<2)throw new Error("Found no lessons — photograph the contents pages flat and in good light.");
    const rec={lessons:lessons,at:Date.now(),photos:files.length};
    lbScans[id]=rec;
    db.ref("library/scans/"+id).set(rec);
    lbScanMsg[id]="";
    say("✓ Read "+lessons.length+" lessons — Add to a kid now uses them.");
    lbDraw();
  }catch(e){say("❌ "+(e.message||"scan failed"));console.error("[HA] library scan",e);}
}
// After the app's Add Subject saves a sheet WE opened, remember which book it came from.
function lbWrapSave(){
  if(typeof window.ceAddSave!=="function"||window.ceAddSave._lb)return;
  const orig=window.ceAddSave;
  const w=function(){
    const p=window._lbPending;
    const kid=(typeof ceAddKid!=="undefined")?ceAddKid:null, form=(typeof ceAddForm!=="undefined")?ceAddForm:null;
    const subs=()=>Object.keys(((typeof currData!=="undefined"&&currData&&currData.subjects)||{})[kid]||{});
    const before=subs();
    const r=orig.apply(this,arguments);
    if(p&&form===p.form&&kid===p.kid){
      const added=subs().filter(k=>before.indexOf(k)<0);
      if(added.length===1){
        window._lbPending=null;
        const link={subject:added[0],at:Date.now()};
        (lbLinks[p.bookId]=lbLinks[p.bookId]||{})[kid]=link;
        try{db.ref("library/links/"+p.bookId+"/"+kid).set(link);}catch(e){}
      }
    }
    return r;
  };
  w._lb=true; window.ceAddSave=w;
}
function lbClose(){lbOpenId=null;const s=document.getElementById("lb-sheet");if(s)s.classList.remove("open");}
function lbSet(k,v){lbF[k]=v;if(k!=="show")lbF.show=60;lbDraw();}
function lbReset(){Object.assign(lbF,{q:"",kid:"all",lane:"all",status:"all",loc:"all",show:60});lbDraw();}

const LB_CSS=`
#lib-root{padding-bottom:30px}
.lb-top{background:#fff;border-bottom:1px solid var(--border);padding:10px 12px;position:sticky;top:0;z-index:5}
.lb-q{width:100%;box-sizing:border-box;padding:10px 12px;border:1.5px solid var(--border);border-radius:10px;font-size:14px;font-family:'DM Sans',sans-serif}
.lb-filters{display:flex;gap:6px;margin-top:8px;overflow-x:auto}
.lb-sel{flex:1 1 0;min-width:110px;padding:7px 8px;border:1.5px solid var(--border);border-radius:9px;background:#fff;font-size:12.5px;font-family:'DM Sans',sans-serif}
.lb-count{font-size:11.5px;color:var(--muted);margin-top:7px}
.lb-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:10px;padding:12px}
.lb-card{position:relative;display:flex;gap:10px;text-align:left;background:var(--card,#fff);border:1.5px solid var(--border);border-radius:12px;padding:10px 10px 10px 14px;cursor:pointer;font:inherit;color:inherit;overflow:hidden}
.lb-card:hover{border-color:#94a3b8}
.lb-bar{position:absolute;left:0;top:0;bottom:0;width:5px}
.lb-cov{flex:0 0 62px;height:84px;border-radius:6px;background:var(--bg);display:flex;align-items:center;justify-content:center;overflow:hidden;font-size:26px}
.lb-cov img{width:100%;height:100%;object-fit:cover}
.lb-body{min-width:0;flex:1}
.lb-t{font-size:13px;font-weight:800;line-height:1.25;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.lb-m{font-size:11px;color:var(--muted);margin-top:2px}
.lb-chips{display:flex;flex-wrap:wrap;gap:4px;margin-top:5px}
.lb-chip{font-size:10px;font-weight:700;border:1px solid;border-radius:99px;padding:1px 7px;white-space:nowrap}
.lb-loc{font-size:11px;color:#475569;margin-top:5px}
.lb-more{border:1.5px solid var(--border);background:#fff;border-radius:10px;padding:8px 16px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif}
.lb-empty{padding:40px;text-align:center;color:var(--muted)}
#lb-sheet{display:none;position:fixed;inset:0;background:rgba(15,23,42,.45);z-index:300;align-items:flex-end;justify-content:center}
#lb-sheet.open{display:flex}
.lb-sh{position:relative;background:#fff;width:100%;max-width:720px;max-height:88vh;overflow:auto;border-radius:18px 18px 0 0;padding:18px 18px 28px;box-sizing:border-box}
.lb-x{position:absolute;right:12px;top:10px;border:none;background:var(--bg);border-radius:99px;width:32px;height:32px;font-size:15px;cursor:pointer}
.lb-bigcov{width:96px;border-radius:8px;flex:none;box-shadow:0 1px 4px rgba(0,0,0,.15)}
.lb-rows{margin-top:14px;border-top:1px solid var(--border)}
.lb-row{display:flex;gap:10px;padding:6px 0;border-bottom:1px solid #f1f5f9;font-size:13px}
.lb-row b{flex:0 0 90px;color:var(--muted);font-weight:700;font-size:12px}
.lb-sec h4{margin:14px 0 4px;font-size:13px}
.lb-sec p{margin:0;font-size:13px;line-height:1.5;color:#334155}
.lb-toc{margin:4px 0 0;padding-left:22px;font-size:12.5px;line-height:1.5;color:#334155}
.lb-scan{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin:6px 0 8px}
.lb-scanbtn{border:1.5px dashed #64748b;border-radius:10px;padding:7px 12px;font-size:12.5px;font-weight:800;cursor:pointer;background:#f8fafc}
.lb-scanmsg{font-size:11.5px;color:var(--muted)}
.lb-addrow{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
.lb-addbtn{border:2px solid;border-radius:10px;padding:8px 12px;font-size:13px;font-weight:800;cursor:pointer;font-family:'DM Sans',sans-serif}
.lb-addbtn.done{cursor:default;background:#f0fdfa;font-size:12px}
.lb-toc li.hd{list-style:none;margin-left:-22px;font-weight:800;color:#0f172a;margin-top:6px}
`;

window.renderLibrary=function(root){
  if(!document.getElementById("lb-style")){const st=document.createElement("style");st.id="lb-style";st.textContent=LB_CSS;document.head.appendChild(st);}
  lbDraw(root); lbLoad(root);
};
window.lbSet=lbSet;window.lbReset=lbReset;window.lbOpen=lbOpen;window.lbClose=lbClose;window.lbAddTo=lbAddTo;window.lbPinTry=lbPinTry;window.lbScan=lbScan;
window._lbTest={lbLane,lbLocKey,lbLocText,lbMatch,lbF,lbLessons,lbTpw,lbAddName,lbWrapSave,links:()=>lbLinks,scans:()=>lbScans,setScans:v=>{lbScans=v;},setData:(b,p)=>{lbBooks=b.map(x=>Object.assign(x,{_lane:lbLane(x),_hay:lbHay(x)}));lbPhotos=p||{};}};
})();
