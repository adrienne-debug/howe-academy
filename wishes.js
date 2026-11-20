// 🎁 Kids' Corner ▸ My wish list — gift tracker slice 7 (her answer "Kids' wish lists → yes, later" + "yes" to building it,
// 2026-11-20; PLAN_gift_tracker_budget_2026-11-20.md §3.7 + §4 slice 7: "a kid adds wishes (typed or a picture). Mom sees them as
// 💭 ideas on that kid's page. The kid's list never shows what was bought."). Loaded lazily by index.html's WISHES block the first
// time a kid taps 🎁 My wish list — never at app start.
// A kid adds a wish: a few words, a picture (the camera, or a photo of a catalog page — shrunk on this device like msgShrink), or
// both — a picture alone is fine for a kid who can't read yet — and, if they like, how much they want it (⭐ · ⭐⭐ · ⭐⭐⭐). They see
// and can remove ONLY their own wishes. The app never suggests what to wish for.
// THE SECRET (§3.7): nothing here ever reads gifts/, and nothing about presents is ever written under wishes/ — so the list looks
// exactly the same whether Mom bought it, planned it or never saw it. No status of any kind is shown.
//   wishes/<kid>/<wid>      {text?, stars?:1|2|3, hasPhoto?:true, ts}     ONE set per wish
//   wishPhotos/<kid>/<wid>  dataURL                                        its own node, set first; read one at a time, on show
// This device listens to wishes/<this kid> ONLY, and only while the page is open (wishesStop when it closes). Remove = one
// multi-path remove of the wish + its photo. Every write goes through db only when !_dryRun() (?dryrun=1 stays inert).
(function(){
"use strict";
let wlData={}, wlFor=null, wlRef=null, wlCb=null, wlLoaded=false, wlDraft=null, wlAsk=null, wlMsg="", wlBusy=false;
const wlPh={};   // wid → dataURL | "loading" | "err" — the pictures read so far while this page is open
const WL_MAX=40, WL_TEXT=80;
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function dry(){return typeof _dryRun==="function"&&_dryRun();}
function live(){return typeof db!=="undefined"&&!!db&&!dry();}
function col(k){try{return (typeof KID_COLOR!=="undefined"&&KID_COLOR[k])||"#2B7A78";}catch(e){return "#2B7A78";}}
function little(k){try{return typeof kcLittle==="function"&&kcLittle(k);}catch(e){return false;}}
function toast(m){if(typeof gwShowToast==="function")gwShowToast(m);}
function tint(c){try{return typeof _kcTint==="function"?_kcTint(c,0.86):"#f8fafc";}catch(e){return "#f8fafc";}}

// ── listening: this kid's own list, only while the page is open ─────────────
function listen(k){
  if(wlFor===k)return;stop();wlFor=k;
  if(typeof db==="undefined"||!db){wlLoaded=true;return;}
  wlRef=db.ref("wishes/"+k);wlCb=s=>{if(wlFor!==k)return;wlData=s.val()||{};wlLoaded=true;paint();};
  wlRef.on("value",wlCb);
}
function stop(){
  if(wlRef){try{wlRef.off("value",wlCb);}catch(e){}}
  wlRef=null;wlCb=null;wlFor=null;wlData={};wlLoaded=false;wlDraft=null;wlAsk=null;wlMsg="";wlBusy=false;
  Object.keys(wlPh).forEach(w=>{delete wlPh[w];});
}
function list(){const o=wlData||{};return Object.keys(o).filter(id=>o[id]&&typeof o[id]==="object").map(id=>Object.assign({id},o[id])).sort((a,b)=>(b.ts||0)-(a.ts||0));}
function photo(wid){
  if(wlPh[wid]!==undefined||!wlFor)return;
  if(typeof db==="undefined"||!db){wlPh[wid]="err";return;}
  const k=wlFor;wlPh[wid]="loading";
  db.ref("wishPhotos/"+k+"/"+wid).once("value").then(s=>{if(wlFor!==k)return;wlPh[wid]=s.val()||"err";paint();}).catch(()=>{if(wlFor!==k)return;wlPh[wid]="err";paint();});
}

// ── drawing ─────────────────────────────────────────────────────────────────
function stars(n,size){n=+n||0;return n?'<span class="wl-stars" style="font-size:'+(size||18)+'px">'+"⭐".repeat(Math.min(3,n))+'</span>':"";}
function composer(k){
  const d=wlDraft,c=col(k),lit=little(k);
  const pic=d.photo?'<div class="wl-thumb big"><img src="'+esc(d.photo)+'" alt=""><button class="wl-x" onclick="wishDropPhoto()" aria-label="Take the picture off">✕</button></div>'
    :'<div class="wl-picbtns"><label class="wl-btn wl-pic" style="border-color:'+c+';color:'+c+'">📷 Take a picture<input type="file" accept="image/*" capture="environment" onchange="wishPick(this)"></label>'+
      '<label class="wl-btn wl-pic" style="border-color:'+c+';color:'+c+'">🖼 Pick a photo<input type="file" accept="image/*" onchange="wishPick(this)"></label></div>';
  const words='<label class="wl-lbl">What is it?<input id="wl-text" class="wl-in" maxlength="'+WL_TEXT+'" autocomplete="off" placeholder="Type your wish" value="'+esc(d.text||"")+'" oninput="wishSet(this.value)"></label>';
  const st='<div class="wl-lbl">How much do you want it?</div><div class="wl-starrow">'+[1,2,3].map(n=>'<button class="wl-starb'+(+d.stars===n?" on":"")+'" style="'+(+d.stars===n?"background:"+c+";border-color:"+c:"border-color:"+c+"66")+'" onclick="wishStars('+n+')">'+"⭐".repeat(n)+'</button>').join("")+'</div>';
  const can=!!(String(d.text||"").trim()||d.photo)&&!wlBusy;
  return '<div class="wl-card wl-comp" style="border-color:'+c+'">'+
    (lit?pic+words:words+pic)+st+(wlBusy?'<div class="wl-note">Getting your picture ready…</div>':'')+(wlMsg?'<div class="wl-note">'+esc(wlMsg)+'</div>':'')+
    '<div class="wl-row"><button class="wl-btn wl-go" style="background:'+c+';border-color:'+c+';opacity:'+(can?1:.45)+'" '+(can?'':'disabled ')+'onclick="wishAdd()">✓ Add to my list</button>'+
    '<button class="wl-btn" onclick="wishCancel()">Cancel</button></div></div>';
}
function row(k,w){
  const c=col(k);let pic="";
  if(w.hasPhoto){photo(w.id);const u=wlPh[w.id];
    pic='<div class="wl-thumb">'+(u&&u!=="loading"&&u!=="err"?'<img src="'+esc(u)+'" alt="">':'<span>🖼</span>')+'</div>';}
  const ask=wlAsk===w.id;
  return '<div class="wl-card wl-wish">'+pic+'<div class="wl-wt">'+(w.text?'<div class="wl-words">'+esc(w.text)+'</div>':'')+stars(w.stars,little(k)?22:18)+'</div>'+
    (ask?'<div class="wl-ask"><button class="wl-btn wl-rm" onclick="wishRemove(\''+esc(w.id)+'\')">Tap again to remove</button><button class="wl-btn" onclick="wishKeep()">Keep it</button></div>'
      :'<button class="wl-btn wl-del" style="color:'+c+'" aria-label="Remove" onclick="wishRemove(\''+esc(w.id)+'\')">✕</button>')+'</div>';
}
function inner(k){
  const c=col(k),L=list();
  let h='<div class="wl-top"><button class="wl-btn wl-back" style="border-color:'+c+';color:'+c+'" onclick="wlBack()">← Back</button>'+
    '<div><div class="wl-title">🎁 My wish list</div><div class="wl-sub">Things you wish for. Mom can see this list.</div></div></div>';
  if(!wlLoaded)return h+'<div class="wl-empty">Loading your wishes…</div>';
  if(wlDraft)h+=composer(k);
  else if(L.length>=WL_MAX)h+='<div class="wl-empty">Your list is full — take one off to add another.</div>';
  else h+='<button class="wl-btn wl-add" style="background:'+tint(c)+';border-color:'+c+';color:'+c+'" onclick="wishNew()">＋ Add a wish</button>';
  if(!L.length&&!wlDraft)h+='<div class="wl-empty">No wishes yet.</div>';
  return h+'<div class="wl-list">'+L.map(w=>row(k,w)).join("")+'</div>';
}
// A re-draw (this list's own listener, or any renderAll of the Corner) keeps the kid's typing: the box gets focus back.
function keepFocus(){
  let had=false,pos=0;try{const a=document.activeElement;if(a&&a.id==="wl-text"){had=true;pos=a.selectionStart||String(a.value||"").length;}}catch(e){}
  return ()=>{if(!had)return;setTimeout(()=>{try{const e=document.getElementById("wl-text");if(e&&document.activeElement!==e){e.focus();e.setSelectionRange(pos,pos);}}catch(x){}},0);};
}
function paint(){const el=document.getElementById("wl-root");if(!el||!wlFor)return;const back=keepFocus();el.innerHTML=inner(wlFor);back();}
function style(){
  if(document.getElementById("wl-style"))return;const s=document.createElement("style");s.id="wl-style";s.textContent=WL_CSS;document.head.appendChild(s);
}
window.wishesPageHTML=function(k){
  if(!k)return "";listen(k);style();const back=keepFocus();back();
  return '<div id="wl-root" class="wl-page'+(little(k)?" wl-little":"")+'">'+inner(k)+'</div>';
};
window.wishesStop=stop;

// ── the kid's taps ──────────────────────────────────────────────────────────
function wishNew(){if(!wlFor)return;wlDraft={text:"",stars:0,photo:""};wlMsg="";wlAsk=null;paint();}
function wishCancel(){wlDraft=null;wlMsg="";wlBusy=false;paint();}
function wishSet(v){if(!wlDraft)return;const had=!!String(wlDraft.text||"").trim();wlDraft.text=String(v||"").slice(0,WL_TEXT);if(had!==!!String(wlDraft.text).trim()&&!wlDraft.photo)paint();}   // re-draw only when Add turns on / off
function wishStars(n){if(!wlDraft)return;wlDraft.stars=+wlDraft.stars===n?0:n;paint();}
function wishDropPhoto(){if(!wlDraft)return;wlDraft.photo="";paint();}
function shrinkTo(file,max,q){
  if(typeof kitCapShrink==="function")return kitCapShrink(file,max,q);
  return new Promise((res,rej)=>{const img=new Image(),url=URL.createObjectURL(file);
    img.onload=()=>{try{const r=Math.min(1,max/Math.max(img.width,img.height)),c=document.createElement("canvas");c.width=Math.round(img.width*r);c.height=Math.round(img.height*r);c.getContext("2d").drawImage(img,0,0,c.width,c.height);URL.revokeObjectURL(url);res(c.toDataURL("image/jpeg",q));}catch(e){rej(e);}};
    img.onerror=()=>{URL.revokeObjectURL(url);rej(new Error("x"));};img.src=url;});
}
async function shrink(file){let out=await shrinkTo(file,1200,0.75);if(out.length>300000)out=await shrinkTo(file,900,0.65);return out;}   // msgShrink's way, a little smaller
async function wishPick(input){
  const d=wlDraft,f=input&&input.files&&input.files[0];try{input.value="";}catch(e){}
  if(!d||!f)return;wlBusy=true;wlMsg="";paint();
  try{const u=await shrink(f);if(wlDraft===d)d.photo=u;}catch(e){if(wlDraft===d)wlMsg="That picture didn't work — try another one.";}
  wlBusy=false;paint();
}
function wishAdd(){
  const k=wlFor,d=wlDraft;if(!k||!d||wlBusy)return;
  const text=String(d.text||"").trim().slice(0,WL_TEXT),pic=d.photo||"";
  if(!text&&!pic)return;
  if(list().length>=WL_MAX){wlMsg="Your list is full — take one off to add another.";return paint();}
  const wid="w"+Date.now().toString(36)+Math.random().toString(36).slice(2,6),rec={ts:Date.now()};
  if(text)rec.text=text;if(+d.stars>=1&&+d.stars<=3)rec.stars=+d.stars;if(pic)rec.hasPhoto=true;
  wlData[wid]=rec;if(pic)wlPh[wid]=pic;
  if(live()){if(pic)db.ref("wishPhotos/"+k+"/"+wid).set(pic);db.ref("wishes/"+k+"/"+wid).set(rec);}   // the picture first, so the wish never points at nothing
  wlDraft=null;wlMsg="";toast("🎁 On your wish list");paint();
}
// Kiosk browsers can't show confirm(), so the second tap is the yes (the kcDeleteEvent way).
function wishRemove(wid){
  const k=wlFor,w=(wlData||{})[wid];if(!k||!w)return;
  if(wlAsk!==wid){wlAsk=wid;return paint();}
  wlAsk=null;delete wlData[wid];delete wlPh[wid];
  if(live()){const up={};up["wishes/"+k+"/"+wid]=null;if(w.hasPhoto)up["wishPhotos/"+k+"/"+wid]=null;db.ref().update(up);}
  paint();
}
function wishKeep(){wlAsk=null;paint();}
Object.assign(window,{wishNew,wishCancel,wishSet,wishStars,wishDropPhoto,wishPick,wishAdd,wishRemove,wishKeep});
window._wlTest={data:()=>wlData,setData:d=>{wlData=d||{};wlLoaded=true;},for:()=>wlFor,draft:()=>wlDraft,setPhoto:u=>{if(wlDraft)wlDraft.photo=u;},photos:wlPh,inner,list,max:WL_MAX};

const WL_CSS=`
.wl-page{padding:12px 12px 80px;max-width:720px;margin:0 auto;font-family:'DM Sans',sans-serif}
.wl-top{display:flex;align-items:center;gap:12px;margin-bottom:12px}
.wl-title{font-family:'Fraunces',serif;font-size:22px;font-weight:700}
.wl-sub{font-size:13px;color:var(--muted);font-weight:600;margin-top:2px}
.wl-btn{border:2px solid #cbd5e1;background:#fff;border-radius:14px;padding:10px 14px;font-size:15px;font-weight:800;cursor:pointer;font-family:inherit;color:#0f172a}
.wl-back{flex:none}
.wl-add{display:block;width:100%;padding:18px 14px;font-size:20px;border-radius:16px;margin-bottom:12px}
.wl-card{background:#fff;border-radius:16px;box-shadow:0 4px 18px rgba(43,122,120,.12);border:2px solid transparent}
.wl-comp{padding:14px;margin-bottom:12px;display:flex;flex-direction:column;gap:10px}
.wl-lbl{display:flex;flex-direction:column;gap:6px;font-size:15px;font-weight:800;color:#334155}
.wl-in{font:inherit;font-size:18px;font-weight:600;padding:12px;border:2px solid #cbd5e1;border-radius:12px;width:100%;box-sizing:border-box;color:#0f172a}
.wl-picbtns{display:flex;gap:8px;flex-wrap:wrap}
.wl-pic{flex:1 1 140px;text-align:center;position:relative;overflow:hidden}
.wl-pic input{position:absolute;inset:0;opacity:0;cursor:pointer;font-size:0}
.wl-starrow{display:flex;gap:8px}
.wl-starb{flex:1;border:2px solid;background:#fff;border-radius:14px;padding:10px 4px;font-size:18px;cursor:pointer;font-family:inherit}
.wl-row{display:flex;gap:8px;flex-wrap:wrap}
.wl-go{flex:1;color:#fff;font-size:17px;padding:14px}
.wl-note{font-size:14px;font-weight:700;color:#475569}
.wl-list{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:10px}
.wl-wish{display:flex;align-items:center;gap:12px;padding:10px 12px}
.wl-wt{flex:1;min-width:0}
.wl-words{font-size:17px;font-weight:800;color:#0f172a;line-height:1.3;word-wrap:break-word}
.wl-stars{display:block;margin-top:3px;letter-spacing:1px}
.wl-thumb{position:relative;width:72px;height:72px;border-radius:12px;overflow:hidden;background:#f1f5f9;flex:none;display:flex;align-items:center;justify-content:center;font-size:28px}
.wl-thumb img{width:100%;height:100%;object-fit:cover;display:block}
.wl-thumb.big{width:160px;height:160px}
.wl-x{position:absolute;top:6px;right:6px;border:none;border-radius:99px;width:30px;height:30px;font-size:14px;background:rgba(15,23,42,.72);color:#fff;cursor:pointer;padding:0}
.wl-del{flex:none;width:44px;height:44px;padding:0;font-size:18px;border-color:#e2e8f0}
.wl-ask{display:flex;flex-direction:column;gap:6px;flex:none}
.wl-ask .wl-btn{padding:8px 10px;font-size:13px}
.wl-rm{background:#fef2f2;border-color:#fca5a5!important;color:#b91c1c}
.wl-empty{padding:18px 10px;text-align:center;color:var(--muted);font-size:15px;font-weight:600}
.wl-little .wl-title{font-size:26px}
.wl-little .wl-words{font-size:20px}
.wl-little .wl-thumb{width:96px;height:96px}
.wl-little .wl-btn{font-size:17px}
.wl-little .wl-add{font-size:24px;padding:22px 14px}
`;
})();
