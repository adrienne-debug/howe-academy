// 📚 School Room ▸ Books — the curriculum-book library, READ-ONLY.
// Data is a copy of ~/Desktop/HoweCurriculum/curriculum_books.json written to
//   library/books/<id>   (records: title, level, kid, status, location, toc, planning …)
//   libraryPhotos/<id>   (150px cover data-URLs — its own node so covers only load here)
// This file never writes to Firebase. Loaded lazily by play.js the first time Books is opened.
(function(){
"use strict";
let lbBooks=null, lbPhotos={}, lbLoading=false, lbErr="", lbOpenId=null;
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
    '<div class="lb-chips">'+lbKids(b).map(k=>chip(k[1],k[2],true)).join("")+(st?chip(st[0],st[1]):"")+'</div>'+
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
.lb-toc li.hd{list-style:none;margin-left:-22px;font-weight:800;color:#0f172a;margin-top:6px}
`;

window.renderLibrary=function(root){
  if(!document.getElementById("lb-style")){const st=document.createElement("style");st.id="lb-style";st.textContent=LB_CSS;document.head.appendChild(st);}
  lbDraw(root); lbLoad(root);
};
window.lbSet=lbSet;window.lbReset=lbReset;window.lbOpen=lbOpen;window.lbClose=lbClose;
window._lbTest={lbLane,lbLocKey,lbLocText,lbMatch,lbF,setData:(b,p)=>{lbBooks=b.map(x=>Object.assign(x,{_lane:lbLane(x),_hay:lbHay(x)}));lbPhotos=p||{};}};
})();
