/*
 * 🧺 LAUNDRY_HOLDORDER — the loads hold their places while you work (her report 2026-11-11: "when you click and change the status of
 * something, it changes the order … I have to chase the thing around to change the different settings"; her yes the same day).
 *   (1) a tapped load (its clock restarts) keeps its place on the same page — Household ▸ Laundry and Mom's Day alike
 *   (2) a new load joins at the bottom; a put-away load leaves; the rest don't move
 *   (3) another page and back → sorted fresh (Household: the loads that need you first)
 *   (4) each card on a page holds its own order; Node without window = the plain sort; nothing written
 *                                                                                                run: node test_laundry_hold_order.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,600)+")":"")); } };
function slice(name){ const sig="function "+name+"("; const i=src.indexOf(sig); if(i<0) throw new Error("not found: "+name); let d=0; for(let k=src.indexOf("{",i);k<src.length;k++){ if(src[k]==="{")d++; else if(src[k]==="}"){ d--; if(d===0) return src.slice(i,k+1);} } throw new Error("unbalanced: "+name); }
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("missing "+a); return src.slice(i,j); };
const BLOCKS=[cut("const LAUNDRY_STAGES=","const LAUNDRY_STALE_MIN"),cut("// 🧺 LAUNDRYTIMES (her ask","function laundryEditToggle("),cut("// MOMSCHED_LAUNDRY_START","// MOMSCHED_LAUNDRY_END"),
  cut("// CHOREUNDO_START","// CHOREUNDO_END"),cut("// LAUNDRYEDIT_START","// LAUNDRYEDIT_END"),cut("// LAUNDRY_STAGEROW_START","// LAUNDRY_STAGEROW_END"),cut("// LAUNDRY_NUDGE_START","// LAUNDRY_NUDGE_END"),
  cut("// LAUNDRY_NOWONE_START","// LAUNDRY_NOWONE_END"),cut("// LAUNDRY_HOLDORDER_START","// LAUNDRY_HOLDORDER_END"),slice("laundrySince"),slice("laundryAdvance"),slice("laundryAdvanceLabel"),slice("laundryDel"),slice("mdCardLaundry")].join("\n");
const NOW=Date.now(), ago=m=>NOW-m*60000;

function mk(laundry,o){
  o=o||{}; const writes=[];
  const ctx={console,Object,Array,String,Number,parseInt,isNaN,Math,JSON,RegExp,Date,HA_LS:{getItem:()=>null,setItem:()=>{}},_dryRun:()=>true,
    db:{ref:p=>({set:()=>writes.push(p),update:()=>writes.push(p),remove:()=>writes.push(p)})},
    esc:s=>String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/"/g,"&quot;"), cap:s=>s, ROSTER:[], KID_NAME:{},
    laundryData:laundry, momHere:()=>true, checked:{}, coSchoolEnd:()=>975, toMin:()=>null, fromMin:m=>String(m), confirm:()=>true,
    laundryTimesEditorHTML:()=>"", mwTodayIso:()=>"x", mwToast:()=>{}, renderMomsPlan:()=>{}, renderAll:()=>{}, ssJumpTo:()=>{},
    document:{getElementById:id=>id==="content"?{}:null,querySelector:q=>{ const m=/data-lho="([^"]+)"/.exec(q); return (m&&ctx._dom.indexOf('data-lho="'+m[1]+'"')>=0)?{}:null; }}, writes, _dom:""};
  if(!o.noWindow) ctx.window={scrollTo:()=>{}};
  vm.createContext(ctx);
  vm.runInContext("var tab='moms-plan', mpSubView='house', hhView='laundry';\n"+BLOCKS+"\nlaundryTimes={wash:60,dry:60,grace:30};laundryBlockMins={};",ctx);
  const T={ctx,writes,run:e=>vm.runInContext(e,ctx)};
  T.names=h=>{ const r=[], re=/<span style="font-size:13px;font-weight:700">([^<]*)<\/span>/g; let m; while((m=re.exec(h))) r.push(m[1]); return r; };
  T.draw=e=>{ const h=T.run(e); ctx._dom=h; return T.names(h); };   // the page is redrawn: what's on the screen now is this
  T.hh=()=>T.draw("mdCardLaundry(true,false,true)");
  T.home=()=>T.draw("mdCardLaundry(true)");
  T.away=()=>{ ctx._dom=""; };                                  // a page without the card
  return T;
}
const LOADS=()=>({ a:{label:"Towels",stage:"washer",ts:ago(30)}, b:{label:"Sheets",stage:"dryer",ts:ago(20)}, c:{label:"Lucy",stage:"washer",ts:ago(10)} });

console.log("── (1) a tapped load keeps its place ──");
{ const T=mk(LOADS()); const first=T.hh();
  ok("first draw: oldest first", first.join("|")==="Towels|Sheets|Lucy", first);
  T.run("ldsrJump('a','dryer')"); ok("Household: Towels → Dryer (its clock now) — still first", T.hh().join("|")==="Towels|Sheets|Lucy", T.hh());
  T.run("ldsrJump('a','fold')"); T.run("ldsrAir('c','d')"); T.run("ldsrBk('b','d')");
  ok("…three more taps on three loads — nothing moves", T.hh().join("|")==="Towels|Sheets|Lucy", T.hh());
  ok("…the stage really moved (Towels folded)", T.run("laundryData.a.stage")==="fold"); }
{ const T=mk(LOADS()); T.run("mpSubView='plan'"); T.home(); T.run("laundryAdvance('a','dryer')");
  ok("Mom's Day card: → Dryer on Towels — it stays first", T.home().join("|")==="Towels|Sheets|Lucy", T.home()); }

console.log("── (2) new loads / put-away loads ──");
{ const T=mk(LOADS()); T.hh(); T.run("ldsrJump('b','fold')");
  T.run("laundryData.d={label:'Swim towels',stage:'washer',ts:Date.now()-60*60000}");
  ok("a new load joins at the bottom (even an older-clocked one)", T.hh().join("|")==="Towels|Sheets|Lucy|Swim towels", T.hh());
  T.run("delete laundryData.b");
  ok("a put-away load leaves; the rest keep their places", T.hh().join("|")==="Towels|Lucy|Swim towels", T.hh()); }

console.log("── (3) another page and back → fresh ──");
{ const T=mk(LOADS()); T.hh(); T.run("ldsrJump('a','dryer')");
  T.run("mpSubView='plan'"); T.home(); T.run("mpSubView='house'");
  ok("left for Mom's Day and came back: sorted fresh (Towels' clock is newest → last)", T.hh().join("|")==="Sheets|Lucy|Towels", T.hh()); }
{ const T=mk({ a:{label:"Towels",stage:"washer",ts:ago(200)}, b:{label:"Sheets",stage:"dryer",ts:ago(20)}, c:{label:"Lucy",stage:"washer",ts:ago(10)} });
  T.run("tab='schedule'"); T.home(); T.run("tab='moms-plan'");
  ok("Household fresh: the load that needs you (Towels, 200 min in the washer) first", T.hh()[0]==="Towels", T.hh());
  T.run("ldsrJump('a','dryer')"); ok("…its light goes off — it doesn't sink while you're here", T.hh().join("|")==="Towels|Sheets|Lucy", T.hh()); }

{ const T=mk(LOADS()); T.hh(); T.run("ldsrJump('a','dryer')"); T.run("hhView='review'"); T.away(); T.run("hhView='laundry'");
  ok("Household ▸ Review and back to ▸ Laundry (the card not drawn in between): sorted fresh", T.hh().join("|")==="Sheets|Lucy|Towels", T.hh()); }
{ const T=mk(LOADS()); T.hh(); T.run("ldsrJump('a','dryer')"); T.hh(); T.run("ldsrJump('b','fold')");
  ok("redraws while you stay (a tap, a Firebase update) keep holding", T.hh().join("|")==="Towels|Sheets|Lucy", T.hh()); }

console.log("── (4) per card; Node without window; nothing written ──");
{ const T=mk(LOADS()); T.run("mpSubView='plan'"); T.home(); const hb=T.run("mdCardLaundry(true)")+T.run("mdCardLaundry(true,true)"); T.ctx._dom=hb; const by=T.names(T.run("mdCardLaundry(true,true)")); T.run("laundryAdvance('c','dryer')");
  const h1=T.run("mdCardLaundry(true)"), h2=T.run("mdCardLaundry(true,true)"); T.ctx._dom=h1+h2;
  ok("two cards on one page each hold their own order", T.names(h1).join("|")==="Towels|Sheets|Lucy"&&T.names(h2).join("|")===by.join("|"), [T.names(h1),by,T.names(h2)]); }
{ const T=mk(LOADS(),{noWindow:true}); T.hh(); T.run("ldsrJump('a','dryer')");
  ok("Node without window: the plain sort, as before (Towels → last)", T.hh().join("|")==="Sheets|Lucy|Towels", T.hh()); }
{ const T=mk(LOADS()); T.hh(); T.run("laundryHold(['a','b'],'j')"); ok("drawing / holding writes nothing", T.writes.length===0, T.writes); }

console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
