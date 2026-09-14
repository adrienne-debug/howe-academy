// 📚 School Room ▸ Books — the curriculum-book library. THE DATABASE IS THE SOURCE OF TRUTH
// (Stage A, 2026-09-13): Mom edits records here from any device; ~/Desktop/HoweCurriculum/
// curriculum_books.json is now only a dated export (⬇ Export).
//   library/books/<id>     (records: title, level, kid, status, location, toc, planning …)
//   libraryPhotos/<id>     (150px cover data-URLs — its own node so covers only load here)
//   library/photos/<id>    ({cover?, toc:[…], extra:[…]} 700px photos — fetched per book when its sheet opens)
//   library/log/<push>     ({id, keys, at} — one line per Mom edit, so "why is this here" has an answer)
//   library/meta           ({count, covers, updated})
// Loaded lazily by play.js the first time Books is opened.
// Other writes (Mom-gated, own nodes so nothing here can clobber them):
//   library/links/<bookId>/<kid> = {subject, at} — after Mom adds a book through the app's own Add Subject
//   library/scans/<bookId> = {lessons:[…], at, photos} — a table of contents read from photos by Claude
// Every write is a targeted set/update of one record or one field — never a whole-node set.
(function(){
"use strict";
let lbBooks=null, lbPhotos={}, lbLinks={}, lbScans={}, lbScanMsg={}, lbLoading=false, lbErr="", lbOpenId=null;
let lbEdit=null;            // {id, form} while a record is being edited in the sheet
let lbNew=null;             // {form, cover} while ➕ New book is open
let lbFull={};              // library/photos/<id> once fetched (undefined = not asked, null = none)
let lbView=null;            // {id, src} — a photo opened big inside the sheet
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
    '</div><div class="lb-count" style="display:flex;align-items:center;gap:10px;flex-wrap:wrap"><span>'+hits.length+' of '+lbBooks.length+' books'+
    ((lbF.q||lbF.kid!=="all"||lbF.lane!=="all"||lbF.status!=="all"||lbF.loc!=="all")?' · <a href="#" onclick="lbReset();return false">clear</a>':'')+'</span>'+
    '<span style="flex:1"></span><button class="lb-tool" onclick="lbNewStart()">➕ New book</button><button class="lb-tool" onclick="lbExport()">⬇ Export</button></div></div>';
  h+='<div class="lb-grid">'+hits.slice(0,lbF.show).map(lbCard).join("")+'</div>';
  if(hits.length>lbF.show)h+='<div style="text-align:center;margin:6px 0 22px"><button class="lb-more" onclick="lbSet(\'show\','+(lbF.show+60)+')">Show more ('+(hits.length-lbF.show)+' left)</button></div>';
  if(!hits.length)h+='<div class="lb-empty">No books match.</div>';
  const keepFocus=document.activeElement&&document.activeElement.classList.contains("lb-q");
  const pos=keepFocus?document.activeElement.selectionStart:0;
  root.innerHTML=h+'<div id="lb-sheet" onclick="if(event.target.id===\'lb-sheet\')lbClose()"><div class="lb-sh" id="lb-shbody"></div></div>';
  if(keepFocus){const q=root.querySelector(".lb-q");q.focus();try{q.setSelectionRange(pos,pos);}catch(e){}}
  if(lbNew)lbNewDraw(); else if(lbOpenId)lbOpen(lbOpenId);
}

function lbOpen(id){
  const b=(lbBooks||[]).find(x=>x.id===id); if(!b)return; lbOpenId=id;
  if(lbEdit&&lbEdit.id===id){lbEditDraw(b);return;}
  if(lbView&&lbView.id===id){lbViewDraw(b);return;}
  const lane=LB_LANE[b._lane]; const st=LB_STATUS[b.status]; const ph=lbPhotos[b.id];
  const row=(k,v)=>v?'<div class="lb-row"><b>'+k+'</b><span>'+esc(v)+'</span></div>':"";
  const toc=b.toc||[];
  let h='<button class="lb-x" onclick="lbClose()">✕</button>'+
    '<div style="display:flex;gap:14px;align-items:flex-start">'+
    (ph?'<img class="lb-bigcov" src="'+ph+'" alt="">':"")+
    '<div style="min-width:0"><div style="font-size:17px;font-weight:800;line-height:1.25">'+esc(b.title||b.id)+'</div>'+
    '<div class="lb-m" style="margin-top:3px">'+esc([b.series,b.publisher].filter(Boolean).join(" · "))+'</div>'+
    '<div class="lb-chips" style="margin-top:8px">'+chip(lane[1],lane[2],true)+lbKids(b).map(k=>chip(k[1],k[2],true)).join("")+(st?chip(st[0],st[1]):"")+
      (b.recommendation?chip("rec: "+b.recommendation,LB_REC[b.recommendation]||"#64748b"):"")+(b.decision?chip("your call: "+b.decision,LB_REC[b.decision]||"#64748b",true):"")+'</div>'+
    '<div style="margin-top:8px"><button class="lb-tool" onclick="lbEditStart(\''+esc(b.id)+'\')">✏️ Edit</button></div></div></div>'+
    '<div class="lb-rows">'+row("Where",lbLocText(b))+row("Level",b.level)+row("Age / grade",[b.age,b.grade?"gr "+b.grade:""].filter(Boolean).join(" · "))+
      row("Subject",b.subject)+row("Type",[b.type,b.consumable?"write-in":(b.consumable===false?"reusable":"")].filter(Boolean).join(" · "))+
      row("Files",b.files)+'</div>'+
    lbLinksHtml(b)+
    lbAddHtml(b)+
    (b.summary?'<div class="lb-sec"><h4>About</h4><p>'+esc(b.summary)+'</p></div>':"")+
    (b.planning?'<div class="lb-sec"><h4>Planning note</h4><p>'+esc(b.planning)+'</p></div>':"")+
    (b.why?'<div class="lb-sec"><h4>Why '+esc(b.recommendation||"")+'</h4><p>'+esc(b.why)+'</p></div>':"")+
    (b.notes?'<div class="lb-sec"><h4>Notes</h4><p>'+esc(b.notes)+'</p></div>':"")+
    '<div class="lb-sec"><h4>Table of contents <span style="font-weight:600;color:var(--muted)">('+toc.length+')</span></h4>'+
    (toc.length?'<ol class="lb-toc">'+toc.map(t=>{const hd=/^(Week|Ch(apter)?|Unit|—|Chemistry|Biology|Physics|Geology|Astronomy|Introduction|Conclusion)\b/.test(t)&&!/^Lesson/.test(t);
      return '<li'+(hd?' class="hd"':'')+'>'+esc(t)+'</li>';}).join("")+'</ol>':'<p style="color:var(--muted)">No table of contents logged yet.</p>')+'</div>'+
    lbPhotosHtml(b);
  document.getElementById("lb-shbody").innerHTML=h;
  document.getElementById("lb-sheet").classList.add("open");
  lbPhotosLoad(id);
}
function lbLinksHtml(b){
  const L=Array.isArray(b.links)?b.links.filter(l=>l&&l.url):[]; if(!L.length)return "";
  return '<div class="lb-chips" style="margin-top:8px">'+L.map(l=>'<a class="lb-chip" style="color:#0f766e;border-color:#0f766e55;text-decoration:none" href="'+esc(l.url)+'" target="_blank" rel="noopener">🔗 '+esc(l.label||l.url)+'</a>').join("")+'</div>';
}
// ── 📷 Photos (700px, per book, fetched when the sheet opens) ──────────────────
function lbPhotosLoad(id){
  if(lbFull[id]!==undefined||typeof db==="undefined"||!db||!db.ref)return;
  lbFull[id]=null;
  db.ref("library/photos/"+id).once("value").then(s=>{lbFull[id]=s.val()||null;if(lbOpenId===id&&!lbEdit)lbOpen(id);}).catch(()=>{});
}
function lbPhotoList(id){const f=lbFull[id]||{};const out=[];
  if(f.cover)out.push({kind:"cover",i:0,src:f.cover});
  (f.toc||[]).forEach((s,i)=>out.push({kind:"toc",i,src:s}));
  (f.extra||[]).forEach((s,i)=>out.push({kind:"extra",i,src:s}));
  return out;}
function lbPhotosHtml(b){
  const P=lbPhotoList(b.id), pend=lbFull[b.id]===null&&!P.length;
  return '<div class="lb-sec"><h4>Photos <span style="font-weight:600;color:var(--muted)">('+P.length+')</span></h4>'+
    (P.length?'<div class="lb-strip">'+P.map((p,n)=>'<button class="lb-ph" onclick="lbPhotoView(\''+esc(b.id)+'\','+n+')" title="'+p.kind+'"><img src="'+p.src+'" alt=""><span>'+(p.kind==="cover"?"cover":p.kind==="toc"?"contents":"extra")+'</span></button>').join("")+'</div>'
      :'<p style="color:var(--muted)">'+(pend?"No photos in the app for this book yet.":"Loading…")+'</p>')+
    '<div class="lb-scan"><label class="lb-scanbtn">📷 Add photo<input type="file" accept="image/*" multiple style="display:none" onchange="lbPhotoAdd(\''+esc(b.id)+'\',this)"></label>'+
    '<select class="lb-sel" id="lb-phkind" style="flex:0 0 auto;min-width:0"><option value="toc">contents page</option><option value="extra">other page</option><option value="cover">cover</option></select></div></div>';
}
function lbPhotoView(id,n){const P=lbPhotoList(id);if(!P[n])return;lbView={id,n};lbOpen(id);}
function lbViewDraw(b){
  const P=lbPhotoList(b.id), n=lbView.n, p=P[n];
  document.getElementById("lb-shbody").innerHTML='<button class="lb-x" onclick="lbClose()">✕</button>'+
    '<div style="display:flex;gap:8px;align-items:center;margin-bottom:8px"><button class="lb-tool" onclick="lbViewBack()">‹ Back</button><b style="font-size:13px">'+esc(b.title||b.id)+'</b><span style="font-size:12px;color:var(--muted)">'+(n+1)+' of '+P.length+' · '+p.kind+'</span>'+
    '<span style="flex:1"></span>'+(n>0?'<button class="lb-tool" onclick="lbPhotoView(\''+esc(b.id)+'\','+(n-1)+')">‹</button>':'')+(n<P.length-1?'<button class="lb-tool" onclick="lbPhotoView(\''+esc(b.id)+'\','+(n+1)+')">›</button>':'')+'</div>'+
    '<img src="'+p.src+'" style="width:100%;border-radius:10px" alt="">';
  document.getElementById("lb-sheet").classList.add("open");
}
function lbViewBack(){const id=lbView&&lbView.id;lbView=null;if(id)lbOpen(id);}
// shrink a chosen file to a data-URL whose longest side is `max` px (cover thumbs 150, photos 700)
function lbThumb(file,max){
  return new Promise((resolve,reject)=>{
    const img=new Image();
    img.onload=()=>{const sc=Math.min(1,max/Math.max(img.width,img.height));
      const c=document.createElement("canvas");c.width=Math.round(img.width*sc);c.height=Math.round(img.height*sc);
      c.getContext("2d").drawImage(img,0,0,c.width,c.height);
      resolve(c.toDataURL("image/jpeg",0.72));URL.revokeObjectURL(img.src);};
    img.onerror=()=>reject(new Error("Couldn't read "+file.name));
    img.src=URL.createObjectURL(file);
  });
}
async function lbPhotoAdd(id,input){
  const files=[...(input.files||[])]; input.value="";
  const b=(lbBooks||[]).find(x=>x.id===id); if(!b||!files.length)return;
  if(!lbMomOk()){lbPin(()=>lbOpen(id));return;}
  const sel=document.getElementById("lb-phkind"); const kind=sel?sel.value:"toc";
  try{
    const big=await Promise.all(files.slice(0,8).map(f=>lbThumb(f,700)));
    const f=Object.assign({},lbFull[id]||{});
    if(kind==="cover"){
      const small=await lbThumb(files[0],150);
      f.cover=big[0]; lbFull[id]=f; lbPhotos[id]=small;
      await db.ref("library/photos/"+id+"/cover").set(big[0]);
      await db.ref("libraryPhotos/"+id).set(small);
      lbLog(id,["photos.cover"]);
    }else{
      const arr=(f[kind]||[]).concat(big); f[kind]=arr; lbFull[id]=f;
      await db.ref("library/photos/"+id+"/"+kind).set(arr);
      lbLog(id,["photos."+kind]);
    }
    if(typeof gwShowToast==="function")gwShowToast("📷 "+big.length+" photo"+(big.length!==1?"s":"")+" saved");
    lbDraw();
  }catch(e){alert("Photo didn't save: "+(e.message||e));}
}
function lbLog(id,keys){try{db.ref("library/log").push({id:id,keys:keys,at:Date.now()});}catch(e){}}
// ── ✏️ Edit a record (Mom) — one targeted update of only the fields she changed ─────────
const LB_TYPES=["curriculum","reader","teacher-guide","answer-key","manipulative-book","online-course"];
const LB_LOCS=[["shelf","🗄 Kallax cube"],["cart","🛒 A kid's cart"],["BOX","📦 Still in the box"],["TABLE","📥 On the table"],["BASKET","🧺 Morning Basket"],["ONLINE","💻 Online / eBook"],["none","— nowhere yet"]];
function lbLocForm(b){const L=b.location||{};
  if(L.cart)return {mode:"cart",cart:String(L.cart),tier:L.tier==null?"":String(L.tier),cube:"",next:""};
  const k=L.kallax||""; if(["BOX","TABLE","BASKET","ONLINE"].includes(k))return {mode:k,cart:"",tier:"",cube:"",next:L.nextCube||""};
  return {mode:k?"shelf":"none",cart:"",tier:"",cube:k,next:""};}
function lbLocFrom(f){
  if(f.mode==="cart")return {cart:f.cart||"lincoln",tier:f.tier?+f.tier||f.tier:null,kallax:null};
  if(f.mode==="shelf")return {cart:null,tier:null,kallax:String(f.cube||"").trim().toUpperCase()||null};
  if(f.mode==="none")return {cart:null,tier:null,kallax:null};
  const o={cart:null,tier:null,kallax:f.mode}; if(f.mode==="TABLE"&&f.next)o.nextCube=String(f.next).trim().toUpperCase(); return o;}
function lbFormFrom(b){
  return {title:b.title||"",series:b.series||"",publisher:b.publisher||"",level:b.level||"",grade:b.grade||"",age:b.age||"",subject:b.subject||"",kid:b.kid||"",
    status:b.status||"shelved",type:b.type||"curriculum",consumable:b.consumable===false?"no":(b.consumable?"yes":""),
    recommendation:b.recommendation||"",decision:b.decision||"",summary:b.summary||"",planning:b.planning||"",why:b.why||"",notes:b.notes||"",
    toc:(b.toc||[]).join("\n"),links:(Array.isArray(b.links)?b.links:[]).map(l=>(l.label||"")+" | "+(l.url||"")).join("\n"),files:b.files||"",access:b.access||"",
    loc:lbLocForm(b)};
}
// form → record fields (strings trimmed; blanks become null so an emptied field is deleted, not kept)
function lbRecordFrom(f){
  const s=k=>{const v=String(f[k]==null?"":f[k]).trim();return v||null;};
  const r={title:s("title"),series:s("series"),publisher:s("publisher"),level:s("level"),grade:s("grade"),age:s("age"),subject:s("subject"),kid:s("kid"),
    status:s("status")||"shelved",type:s("type")||"curriculum",consumable:f.consumable==="yes"?true:(f.consumable==="no"?false:null),
    recommendation:s("recommendation"),decision:s("decision"),summary:s("summary"),planning:s("planning"),why:s("why"),notes:s("notes"),files:s("files"),access:s("access"),
    toc:String(f.toc||"").split("\n").map(t=>t.replace(/\s+/g," ").trim()).filter(Boolean),
    links:String(f.links||"").split("\n").map(l=>{const p=l.split("|");const url=(p.length>1?p.slice(1).join("|"):p[0]).trim();const label=p.length>1?p[0].trim():"";return url?{label:label||url,url}:null;}).filter(Boolean),
    location:lbLocFrom(f.loc||{mode:"none"})};
  if(!r.toc.length)r.toc=null; if(!r.links.length)r.links=null;
  return r;
}
function lbSame(a,b){return JSON.stringify(a===undefined?null:a)===JSON.stringify(b===undefined?null:b);}
// the patch = only keys whose value differs from the stored record
function lbPatch(b,rec){const p={};Object.keys(rec).forEach(k=>{const cur=b[k]===undefined?null:b[k];if(!lbSame(cur,rec[k]))p[k]=rec[k];});return p;}
function lbEditStart(id){
  const b=(lbBooks||[]).find(x=>x.id===id); if(!b)return;
  if(!lbMomOk()){lbPin(()=>lbEditStart(id));return;}
  lbEdit={id:id,form:lbFormFrom(b)}; lbView=null; lbOpen(id);
}
function lbEditSet(k,v){if(!lbEdit)return;if(k.startsWith("loc."))lbEdit.form.loc[k.slice(4)]=v;else lbEdit.form[k]=v;if(k==="loc.mode")lbOpen(lbEdit.id);}
function lbEditCancel(){const id=lbEdit&&lbEdit.id;lbEdit=null;if(id)lbOpen(id);}
function lbFormHtml(f,setFn){
  const inp=(k,label,ph,wide)=>'<label class="lb-f'+(wide?" wide":"")+'"><span>'+label+'</span><input value="'+esc(f[k])+'" placeholder="'+esc(ph||"")+'" oninput="'+setFn+'(\''+k+'\',this.value)"></label>';
  const ta=(k,label,rows)=>'<label class="lb-f wide"><span>'+label+'</span><textarea rows="'+(rows||3)+'" oninput="'+setFn+'(\''+k+'\',this.value)">'+esc(f[k])+'</textarea></label>';
  const se=(k,label,opts)=>'<label class="lb-f"><span>'+label+'</span><select onchange="'+setFn+'(\''+k+'\',this.value)">'+opts.map(o=>'<option value="'+esc(o[0])+'"'+(o[0]===f[k]?" selected":"")+'>'+esc(o[1])+'</option>').join("")+'</select></label>';
  const L=f.loc;
  let loc='<label class="lb-f"><span>Where</span><select onchange="'+setFn+'(\'loc.mode\',this.value)">'+LB_LOCS.map(o=>'<option value="'+o[0]+'"'+(o[0]===L.mode?" selected":"")+'>'+o[1]+'</option>').join("")+'</select></label>';
  if(L.mode==="shelf")loc+='<label class="lb-f"><span>Cube</span><input value="'+esc(L.cube)+'" placeholder="D5" oninput="'+setFn+'(\'loc.cube\',this.value)"></label>';
  if(L.mode==="cart")loc+='<label class="lb-f"><span>Whose cart</span><select onchange="'+setFn+'(\'loc.cart\',this.value)">'+LB_ADD_KIDS.map(k=>'<option value="'+k+'"'+(k===L.cart?" selected":"")+'>'+lbKidName(k)+'</option>').join("")+'</select></label>'+
    '<label class="lb-f"><span>Tier</span><input value="'+esc(L.tier)+'" placeholder="2" oninput="'+setFn+'(\'loc.tier\',this.value)"></label>';
  if(L.mode==="TABLE")loc+='<label class="lb-f"><span>Going to cube</span><input value="'+esc(L.next)+'" placeholder="B4" oninput="'+setFn+'(\'loc.next\',this.value)"></label>';
  return '<div class="lb-form">'+
    inp("title","Title","",true)+inp("series","Series")+inp("publisher","Publisher")+inp("level","Level","3B")+inp("grade","Grade","4")+inp("age","Age","9-10")+
    inp("subject","Subject","Math (spine)")+inp("kid","Kid(s)","ellis, lucy (2027)")+
    se("status","Status",Object.entries(LB_STATUS).map(([k,v])=>[k,v[0]]))+se("type","Type",LB_TYPES.map(t=>[t,t]))+
    se("consumable","Write-in?",[["","—"],["yes","write-in (consumable)"],["no","reusable"]])+
    loc+
    se("recommendation","Claude's rec",[["",""]].concat(Object.keys(LB_REC).map(k=>[k,k])))+se("decision","Your call",[["",""]].concat(Object.keys(LB_REC).map(k=>[k,k])))+
    ta("toc","Table of contents — one line each",6)+ta("summary","About",2)+ta("planning","Planning note",3)+ta("why","Why",2)+ta("notes","Notes",3)+
    ta("links","Links — label | url, one per line",2)+inp("files","Files","folder / file name on the Mac",true)+inp("access","Access","login owner, expiry (never the password)",true)+
    '</div>';
}
function lbEditDraw(b){
  const f=lbEdit.form;
  document.getElementById("lb-shbody").innerHTML='<button class="lb-x" onclick="lbEditCancel()">✕</button>'+
    '<div style="font-size:15px;font-weight:800;margin-bottom:8px">✏️ Edit · '+esc(b.title||b.id)+'</div>'+
    lbFormHtml(f,"lbEditSet")+
    '<div class="lb-addrow" style="margin-top:12px"><button class="lb-addbtn" style="background:#111827;color:#fff;border-color:#111827" onclick="lbEditSave()">Save</button>'+
    '<button class="lb-addbtn" style="border-color:var(--border);color:#334155" onclick="lbEditCancel()">Cancel</button>'+
    '<span style="font-size:11.5px;color:var(--muted);align-self:center">Only the fields you changed are written.</span></div>';
  document.getElementById("lb-sheet").classList.add("open");
}
function lbEditSave(){
  if(!lbEdit)return; const b=(lbBooks||[]).find(x=>x.id===lbEdit.id); if(!b)return;
  if(!lbMomOk()){lbPin(()=>lbEditSave());return;}
  const rec=lbRecordFrom(lbEdit.form); if(!rec.title){alert("A title is needed.");return;}
  const patch=lbPatch(b,rec); const keys=Object.keys(patch);
  if(!keys.length){lbEditCancel();return;}
  Object.keys(patch).forEach(k=>{if(patch[k]===null)delete b[k];else b[k]=patch[k];});
  b._lane=lbLane(b); b._hay=lbHay(b);
  lbBooks.sort((a,c)=>String(a.title||"").localeCompare(String(c.title||"")));
  const id=lbEdit.id; lbEdit=null;
  try{db.ref("library/books/"+id).update(patch);}catch(e){alert("Save failed: "+(e.message||e));}
  lbLog(id,keys);
  try{db.ref("library/meta").update({updated:new Date().toISOString().slice(0,10)});}catch(e){}
  if(typeof gwShowToast==="function")gwShowToast("✓ Saved "+keys.length+" field"+(keys.length!==1?"s":""));
  lbDraw();
}
// ── ➕ New book (Mom) — one new record, its cover, and the count ─────────────────────────
function lbSlug(t){return String(t||"").toLowerCase().replace(/&/g," and ").replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,60)||"book";}
function lbNewId(title){let base=lbSlug(title),id=base,n=2;const has=x=>(lbBooks||[]).some(b=>b.id===x);while(has(id))id=base+"-"+(n++);return id;}
function lbNewStart(){
  if(!lbBooks)return;
  if(!lbMomOk()){lbPin(()=>lbNewStart());return;}
  lbNew={form:lbFormFrom({status:"planned",type:"curriculum",consumable:true,location:{kallax:"BOX"}}),cover:null,coverBig:null};
  lbOpenId=null; lbEdit=null; lbView=null; lbNewDraw();
}
function lbNewSet(k,v){if(!lbNew)return;if(k.startsWith("loc."))lbNew.form.loc[k.slice(4)]=v;else lbNew.form[k]=v;if(k==="loc.mode")lbNewDraw();}
function lbNewCancel(){lbNew=null;lbClose();}
async function lbNewCover(input){const f=(input.files||[])[0];input.value="";if(!f||!lbNew)return;
  try{lbNew.cover=await lbThumb(f,150);lbNew.coverBig=await lbThumb(f,700);}catch(e){alert(e.message||e);}lbNewDraw();}
function lbNewDraw(){
  if(!lbNew)return; const f=lbNew.form;
  document.getElementById("lb-shbody").innerHTML='<button class="lb-x" onclick="lbNewCancel()">✕</button>'+
    '<div style="font-size:15px;font-weight:800;margin-bottom:8px">➕ New book</div>'+
    '<div class="lb-scan">'+(lbNew.cover?'<img src="'+lbNew.cover+'" style="height:84px;border-radius:6px">':'')+
    '<label class="lb-scanbtn">📷 '+(lbNew.cover?"Change cover":"Cover photo")+'<input type="file" accept="image/*" style="display:none" onchange="lbNewCover(this)"></label>'+
    '<span class="lb-scanmsg">Contents photos come after — 📸 Scan on the book\'s page builds the lesson list.</span></div>'+
    lbFormHtml(f,"lbNewSet")+
    '<div class="lb-addrow" style="margin-top:12px"><button class="lb-addbtn" style="background:#111827;color:#fff;border-color:#111827" onclick="lbNewSave()">Add book</button>'+
    '<button class="lb-addbtn" style="border-color:var(--border);color:#334155" onclick="lbNewCancel()">Cancel</button></div>';
  document.getElementById("lb-sheet").classList.add("open");
}
function lbNewSave(){
  if(!lbNew)return;
  if(!lbMomOk()){lbPin(()=>lbNewSave());return;}
  const rec=lbRecordFrom(lbNew.form); if(!rec.title){alert("A title is needed.");return;}
  Object.keys(rec).forEach(k=>{if(rec[k]===null)delete rec[k];});
  const id=lbNewId(rec.title); rec.added=new Date().toISOString().slice(0,10);
  const b=Object.assign({id:id},rec); b._lane=lbLane(b); b._hay=lbHay(b);
  lbBooks.push(b); lbBooks.sort((a,c)=>String(a.title||"").localeCompare(String(c.title||"")));
  const cover=lbNew.cover, big=lbNew.coverBig; lbNew=null;
  try{
    db.ref("library/books/"+id).set(rec);
    if(cover){lbPhotos[id]=cover;db.ref("libraryPhotos/"+id).set(cover);}
    if(big){lbFull[id]={cover:big};db.ref("library/photos/"+id+"/cover").set(big);}
    db.ref("library/meta").update({count:lbBooks.length,covers:Object.keys(lbPhotos).length,updated:new Date().toISOString().slice(0,10)});
  }catch(e){alert("Save failed: "+(e.message||e));}
  lbLog(id,["new"]);
  if(typeof gwShowToast==="function")gwShowToast("📚 Added "+rec.title);
  lbF.q=rec.title; lbF.show=60; lbOpenId=id; lbDraw();
}
// ── ⬇ Export — the whole library as the JSON the Mac used to own (a dated backup) ───────────
function lbExportData(){
  const books=(lbBooks||[]).map(b=>{const o={};Object.keys(b).forEach(k=>{if(k[0]!=="_")o[k]=b[k];});return o;});
  return {_readme:"Howe curriculum-book library — exported from the app. The app (library/books) is the source of truth; this file is a dated backup.",
    version:2,updated:new Date().toISOString().slice(0,10),count:books.length,books:books,links:lbLinks||{},scans:lbScans||{}};
}
function lbExport(){
  if(!lbBooks)return;
  const txt=JSON.stringify(lbExportData(),null,1), name="curriculum_books_export_"+new Date().toISOString().slice(0,10)+".json";
  try{const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([txt],{type:"application/json"}));a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},2000);
    if(typeof gwShowToast==="function")gwShowToast("⬇ "+name);}
  catch(e){alert("Export failed: "+(e.message||e));}
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
function lbClose(){lbOpenId=null;lbEdit=null;lbView=null;lbNew=null;const s=document.getElementById("lb-sheet");if(s)s.classList.remove("open");}
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
.lb-tool{border:1.5px solid var(--border);background:#fff;border-radius:9px;padding:5px 10px;font-size:12px;font-weight:800;cursor:pointer;font-family:'DM Sans',sans-serif;color:#0f172a}
.lb-form{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px 10px;margin-top:6px}
.lb-f{display:flex;flex-direction:column;gap:3px;font-size:11px;font-weight:700;color:var(--muted)}
.lb-f.wide{grid-column:1/-1}
.lb-f input,.lb-f select,.lb-f textarea{font:inherit;font-size:13px;font-weight:500;color:#0f172a;padding:7px 9px;border:1.5px solid var(--border);border-radius:9px;background:#fff;font-family:'DM Sans',sans-serif;width:100%;box-sizing:border-box}
.lb-f textarea{resize:vertical;line-height:1.4}
.lb-strip{display:flex;gap:8px;overflow-x:auto;padding:4px 0 6px}
.lb-ph{flex:none;border:1.5px solid var(--border);border-radius:8px;background:#fff;padding:3px;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:2px;font:inherit;font-size:10px;color:var(--muted)}
.lb-ph img{height:84px;width:auto;border-radius:5px;display:block}
`;

window.renderLibrary=function(root){
  if(!document.getElementById("lb-style")){const st=document.createElement("style");st.id="lb-style";st.textContent=LB_CSS;document.head.appendChild(st);}
  lbDraw(root); lbLoad(root);
};
window.lbSet=lbSet;window.lbReset=lbReset;window.lbOpen=lbOpen;window.lbClose=lbClose;window.lbAddTo=lbAddTo;window.lbPinTry=lbPinTry;window.lbScan=lbScan;
window.lbEditStart=lbEditStart;window.lbEditSet=lbEditSet;window.lbEditSave=lbEditSave;window.lbEditCancel=lbEditCancel;
window.lbNewStart=lbNewStart;window.lbNewSet=lbNewSet;window.lbNewSave=lbNewSave;window.lbNewCancel=lbNewCancel;window.lbNewCover=lbNewCover;
window.lbExport=lbExport;window.lbPhotoAdd=lbPhotoAdd;window.lbPhotoView=lbPhotoView;window.lbViewBack=lbViewBack;
window._lbTest={lbLane,lbLocKey,lbLocText,lbMatch,lbF,lbLessons,lbTpw,lbAddName,lbWrapSave,links:()=>lbLinks,scans:()=>lbScans,setScans:v=>{lbScans=v;},setData:(b,p)=>{lbBooks=b.map(x=>Object.assign(x,{_lane:lbLane(x),_hay:lbHay(x)}));lbPhotos=p||{};},
  lbFormFrom,lbRecordFrom,lbPatch,lbLocForm,lbLocFrom,lbSlug,lbNewId,lbExportData,lbPhotoList,books:()=>lbBooks,edit:()=>lbEdit,setEdit:v=>{lbEdit=v;},newState:()=>lbNew,setNew:v=>{lbNew=v;},setFull:(id,v)=>{lbFull[id]=v;}};
})();
