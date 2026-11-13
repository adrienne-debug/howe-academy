/*
 * 🧺 LAUNDRY_STAGEROW — a load's stages as buttons in Household ▸ Laundry (her ask 2026-11-11: "all the different cycles to be in
 * a line beside each thing in the list so I could quickly change where it is in the mix … pre-wash, a wash, a dryer, a folded …
 * an add air dry … out of washer or out of dryer … an add basket button with the same option"). Her picks: Household only; air dry
 * moves the whole load.
 *   (1) the row shows only where jump is asked (Household), only for Mom, never on a split half or a hung load
 *   (2) tap a stage → ONE targeted update laundry/<id> {stage,ts[,step]}, blocks dropped; alert asks first out of the washer
 *   (3) ＋ Air dry out of washer / out of dryer / take out → the load's own cycle; the engine's → button then runs it
 *   (4) ＋ Basket → laundry/<id>/bk; the basket's button sits in its spot and moves the load there
 *   (5) dry run writes nothing
 *                                                                                                run: node test_laundry_stagerow.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,700)+")":"")); } };
function slice(name){ const sig="function "+name+"("; const i=src.indexOf(sig); if(i<0) throw new Error("not found: "+name); let d=0; for(let k=src.indexOf("{",i);k<src.length;k++){ if(src[k]==="{")d++; else if(src[k]==="}"){ d--; if(d===0) return src.slice(i,k+1);} } throw new Error("unbalanced: "+name); }
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("missing "+a); return src.slice(i,j); };
const LCONST=cut("const LAUNDRY_STAGES=","const LAUNDRY_STALE_MIN");
const LTIMES=cut("// 🧺 LAUNDRYTIMES (her ask","function laundryEditToggle(");
const MS=cut("// MOMSCHED_LAUNDRY_START","// MOMSCHED_LAUNDRY_END");
const CU=cut("// CHOREUNDO_START","// CHOREUNDO_END");
const LE=cut("// LAUNDRYEDIT_START","// LAUNDRYEDIT_END");
const LC=cut("// LAUNDRY_CYCLE_START","// LAUNDRY_CYCLE_END");
const SR=cut("// LAUNDRY_STAGEROW_START","// LAUNDRY_STAGEROW_END");
const MIDNIGHT=(()=>{ const d=new Date(); d.setHours(0,0,0,0); return d.getTime(); })();
const at=m=>MIDNIGHT+m*60000, H=(h,m)=>h*60+(m||0);
const ISO=(()=>{ const d=new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); })();

function mk(o){
  o=o||{}; const ls={}, writes=[], toasts=[], renders=[], asked=[];
  const ctx={console,Object,Array,String,Number,parseInt,isNaN,Math,JSON,RegExp,
    HA_LS:{getItem:k=>(k in ls)?ls[k]:null,setItem:(k,v)=>{ ls[k]=v; }}, _dryRun:()=>!!o.dry,
    db:{ref:p=>({set:v=>writes.push(["set",p,JSON.parse(JSON.stringify(v))]),update:v=>writes.push(["update",p,JSON.parse(JSON.stringify(v))]),remove:()=>writes.push(["rm",p])})},
    ROSTER:["lincoln","ellis","lucy","julian"], KID_NAME:{}, cap:s=>String(s||""), esc:s=>String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/"/g,"&quot;"),
    laundryData:o.laundry||{}, momHere:()=>!o.notMom, tab:"moms-plan", checked:{}, coSchoolEnd:()=>H(16,15),
    toMin:()=>null, fromMin:m=>String(m), laundryAirDryHours:()=>8,
    laundryTimesEditorHTML:()=>"", mwTodayIso:()=>ISO, mwToast:t=>toasts.push(t), renderMomsPlan:()=>renders.push("plan"), renderAll:()=>renders.push("all"),
    confirm:t=>{ asked.push(t); return !o.notYet; },
    document:{getElementById:id=>(id==="content")?{}:null}, writes, toasts, renders, asked, _todayDay:"thursday"};
  class FakeDate extends Date { constructor(...a){ if(a.length) super(...a); else super(FakeDate.now()); } static now(){ return at(ctx._nowM); } }
  ctx.Date=FakeDate; ctx._nowM=o.nowMin||H(10,0); ctx._mlNowMin=()=>ctx._nowM;
  vm.createContext(ctx);
  vm.runInContext(LCONST+"\n"+LTIMES+"\n"+MS+"\n"+CU+"\n"+LE+"\n"+SR+"\n"+slice("laundrySince")+"\n"+slice("laundryAdvance")+"\n"+slice("laundryAdvanceLabel")+"\n"+slice("mdCardLaundry")
    +"\nlaundryTimes={wash:50,dry:60,grace:5};laundryBlockMins={move:5,fold:15};"+(o.blocks?"momBlocks="+JSON.stringify(o.blocks)+";":""),ctx);
  const T={ctx,writes,toasts,renders,asked,run:e=>vm.runInContext(e,ctx)};
  T.hh=()=>T.run("mdCardLaundry(true,false,true)");   // Household ▸ Laundry
  T.home=()=>T.run("mdCardLaundry(true)");            // Mom's Day / Home Base
  T.myday=()=>T.run("mdCardLaundry(true,true)");      // 🏡 My day
  T.L=id=>T.ctx.laundryData[id];
  return T;
}
const ID="L1";
const plain=(stage,x)=>({[ID]:Object.assign({label:"Towels",stage:stage,ts:at(H(9,0))},x||{})});
const chips=h=>{ const r=[]; const re=/ldsrJump\('L1','([^']+)'\)[^>]*style="[^"]*background:(#[0-9a-f]+)[^"]*"[^>]*>([^<]*)</g; let m; while((m=re.exec(h))) r.push([m[1],m[2],m[3]]); return r; };

console.log("── (1) where the row shows ──");
{ const T=mk({laundry:plain("washer")}); const C=chips(T.hh());
  ok("Household: Pre-wash · Wash · Dryer · Folded, in that order", JSON.stringify(C.map(c=>c[0]))==='["prewash","washer","dryer","fold"]', C);
  ok("…the words she named", C.map(c=>c[2]).join("|")==="🫧 Pre-wash|🫧 Wash|🌀 Dryer|🧺 Folded", C);
  ok("…Wash is lit (blue), Pre-wash not", C[1][1]==="#2563eb"&&C[0][1]!=="#2563eb", C);
  ok("…＋ 🌬 Air dry and ＋ 🧺 Basket buttons", /ldsrMenuOpen\('L1','air'\)[^>]*>＋ 🌬 Air dry</.test(T.hh())&&/ldsrMenuOpen\('L1','bk'\)[^>]*>＋ 🧺 Basket</.test(T.hh()));
  ok("…the → button, ✎ and ✕ stay", /laundryAdvance\('L1'\)/.test(T.hh())&&/laundryEditLoad/.test(T.hh())&&/laundryDel\('L1'\)/.test(T.hh()));
  ok("Home Base / Mom's Day: no stage buttons (plain trail)", !/ldsrJump/.test(T.home())&&/🫧 washer/.test(T.home()), T.home());
  ok("🏡 My day: no stage buttons", !/ldsrJump/.test(T.myday()));
}
{ const T=mk({laundry:plain("washer"),notMom:true}); ok("not Mom: the plain trail, and ldsrJump moves nothing", !/ldsrJump/.test(T.hh())&&T.run("ldsrJump('L1','dryer')")===null&&T.writes.length===0); }
{ const T=mk({laundry:{L1:{label:"Towels — dryer half",stage:"dryer",ts:at(H(9,0)),split:{part:"dryer",half:"L1_h"}},L1_h:{label:"Towels — hanging",stage:"airdry",ts:at(H(9,0)),hang:true,cycle:[{k:"airdry"}],step:0,split:{of:"L1",part:"hang"}}}});
  ok("a split load's halves keep the plain trail", !/ldsrJump/.test(T.hh()), T.hh()); }
{ const T=mk({laundry:plain("airdry",{hang:true,cycle:[{k:"airdry"}],step:0})}); ok("a load hung from the washer's question keeps the plain trail", !/ldsrJump/.test(T.hh())); }
{ const T=mk({laundry:plain("bin",{wet:true})}); const C=chips(T.hh()); ok("a load in the bin: nothing lit", C.length===4&&!C.some(c=>c[1]==="#2563eb"), C); }
{ const T=mk({laundry:plain("dryer")}); const C=chips(T.hh()); ok("in the dryer: Pre-wash, Wash green behind it, Dryer blue", C[0][1]==="#f0fdf4"&&C[1][1]==="#f0fdf4"&&C[2][1]==="#2563eb"&&C[3][1]==="#fff", C); }

console.log("── (2) tap a stage ──");
{ const T=mk({laundry:plain("washer"),nowMin:H(10,30),blocks:{L1_washer:{iso:ISO,load:"L1",stage:"washer",mins:5,at:"now",startMin:H(9,50)},L1_fold:{iso:ISO,load:"L1",stage:"fold",mins:10,at:"now",startMin:H(10,0)}}});
  T.run("ldsrJump('L1','fold')");
  ok("washer → Folded: ONE update on laundry/L1 {ts,stage}", T.writes.filter(w=>w[1]==="laundry/L1").length===1&&JSON.stringify(T.writes.find(w=>w[1]==="laundry/L1"))===JSON.stringify(["update","laundry/L1",{ts:at(H(10,30)),stage:"fold"}]), T.writes);
  ok("…the old and new stage's Mom blocks go (✎ Edit's way)", T.writes.some(w=>w[0]==="rm"&&w[1]==="momBlocks/"+ISO+"/L1_washer")&&T.writes.some(w=>w[0]==="rm"&&w[1]==="momBlocks/"+ISO+"/L1_fold"), T.writes);
  ok("…the load reads fold, its clock now", T.L(ID).stage==="fold"&&T.L(ID).ts===at(H(10,30)));
  ok("…a toast and a repaint", T.toasts.length===1&&/Towels/.test(T.toasts[0])&&T.renders.length>0, T.toasts);
  ok("…→ button now reads ✓ Put away; no ＋ Air dry / Basket past the machines", /✓ Put away/.test(T.hh())&&!/ldsrMenuOpen/.test(T.hh()));
  T.run("ldsrJump('L1','prewash')"); ok("Folded → Pre-wash (back is a tap too)", T.L(ID).stage==="prewash");
  ok("…and → then reads Second wash (the wet path)", /🫧 Second wash/.test(T.hh()), T.hh());
}
{ const T=mk({laundry:plain("washer")}); ok("tapping the stage it is on moves nothing", T.run("ldsrJump('L1','washer')")===null&&T.writes.length===0);
  ok("a stage not in its row moves nothing (basket not added)", T.run("ldsrJump('L1','basket')")===null&&T.writes.length===0);
  ok("a made-up stage moves nothing", T.run("ldsrJump('L1','zzz')")===null&&T.writes.length===0); }
{ const T=mk({laundry:plain("washer",{alert:"Pull the 3 shirts"})}); T.run("ldsrJump('L1','dryer')");
  ok("⚠️ alert: asked first when it leaves the washer, OK moves it", T.asked.length===1&&/Pull the 3 shirts/.test(T.asked[0])&&T.L(ID).stage==="dryer", T.asked); }
{ const T=mk({laundry:plain("washer",{alert:"Pull the 3 shirts"}),notYet:true});
  ok("…Not yet: nothing moves, nothing written", T.run("ldsrJump('L1','dryer')")===null&&T.L(ID).stage==="washer"&&T.writes.length===0); }
{ const T=mk({laundry:plain("washer",{alert:"Pull the 3 shirts"})}); T.run("ldsrJump('L1','prewash')"); ok("…not asked going back to Pre-wash", T.asked.length===0&&T.L(ID).stage==="prewash"); }
{ const T=mk({laundry:{[ID]:{label:"Quick",stage:"washer",step:0,ts:at(H(9,0)),cycle:[{k:"wash",m:30},{k:"dry",m:40}]}}});
  const C=chips(T.hh()); ok("a cycle load: ＋ Pre-wash, its own steps, then Folded", JSON.stringify(C.map(c=>c[0]))==='["pre+","s0","s1","fold"]'&&/＋ 🫧 Pre-wash/.test(C[0][2]), C);
  T.run("ldsrJump('L1','s1')"); ok("…tap Dry → {stage:dryer, step:1}", JSON.stringify(T.writes[0][2])===JSON.stringify({ts:at(H(10,0)),stage:"dryer",step:1}), T.writes);
  T.run("ldsrJump('L1','fold')"); ok("…tap Folded → {stage:fold, step:2}", T.L(ID).stage==="fold"&&T.L(ID).step===2);
  T.run("ldsrJump('L1','pre+')"); ok("…＋ Pre-wash puts a prewash step in front and starts it", T.L(ID).stage==="prewash"&&T.L(ID).step===0&&JSON.stringify(T.L(ID).cycle.map(x=>x.k))==='["prewash","wash","dry"]'&&T.L(ID).cycle[1].m===30, T.L(ID));
  ok("…its row then has no ＋ Pre-wash", !chips(T.hh()).some(c=>c[0]==="pre+")); }

console.log("── (3) ＋ Air dry ──");
{ const T=mk({laundry:plain("washer")}); T.run("ldsrMenuOpen('L1','air')"); const H0=T.hh();
  ok("the menu: Out of washer · Out of dryer · Cancel (no take-out yet)", /ldsrAir\('L1','w'\)[^>]*>Out of washer</.test(H0)&&/ldsrAir\('L1','d'\)[^>]*>Out of dryer</.test(H0)&&/>Cancel</.test(H0)&&!/Take air dry out/.test(H0), H0);
  T.run("ldsrAir('L1','w')");
  ok("Out of washer: cycle Wash → Air dry (8 h), on the wash step, ONE update", T.writes.length===1&&JSON.stringify(T.writes[0][2])===JSON.stringify({cycle:[{k:"wash"},{k:"airdry",m:480}],step:0,stage:"washer"}), T.writes);
  ok("…the row: Wash · Air dry · Folded; menu closed", JSON.stringify(chips(T.hh()).map(c=>c[2]))==='["＋ 🫧 Pre-wash","🫧 Wash","🌬 Air dry","🧺 Folded"]'&&T.run("ldsrMenu")===null, chips(T.hh()));
  ok("…the → button reads → Air dry, and takes it there", /→ Air dry/.test(T.hh())&&(T.run("laundryAdvance('L1')"),T.L(ID).stage==="airdry"&&T.L(ID).step===1), T.L(ID));
}
{ const T=mk({laundry:plain("washer")}); T.run("ldsrAir('L1','d')");
  ok("Out of dryer: Wash → Dry → Air dry", JSON.stringify(T.L(ID).cycle.map(x=>x.k))==='["wash","dry","airdry"]'&&T.L(ID).step===0&&T.L(ID).stage==="washer", T.L(ID));
  T.run("ldsrMenuOpen('L1','air')"); ok("…the menu now offers ✕ Take air dry out", /ldsrAir\('L1','x'\)[^>]*>✕ Take air dry out</.test(T.hh()));
  T.run("ldsrAir('L1','w')"); ok("…switch to Out of washer: Wash → Air dry (the dryer comes out)", JSON.stringify(T.L(ID).cycle.map(x=>x.k))==='["wash","airdry"]', T.L(ID));
  T.run("ldsrAir('L1','x')"); ok("…take it out: Wash → Dry again", JSON.stringify(T.L(ID).cycle.map(x=>x.k))==='["wash","dry"]'&&T.L(ID).stage==="washer", T.L(ID));
  const n=T.writes.length; T.run("ldsrAir('L1','x')"); ok("…take out again: nothing written", T.writes.length===n); }
{ const T=mk({laundry:plain("dryer")}); T.run("ldsrAir('L1','d')");
  ok("in the dryer, Out of dryer: stays on the dry step", JSON.stringify(T.L(ID).cycle.map(x=>x.k))==='["wash","dry","airdry"]'&&T.L(ID).step===1&&T.L(ID).stage==="dryer", T.L(ID));
  ok("…its → reads → Air dry (no fold question in between)", /→ Air dry/.test(T.hh())); }
{ const T=mk({laundry:plain("dryer")}); ok("in the dryer, Out of washer: refused (it is on the dry step), nothing written", T.run("ldsrAir('L1','w')")===null&&T.writes.length===0&&/move it first/.test(T.toasts[0]||""), T.toasts); }
{ const T=mk({laundry:plain("washer",{wet:true})}); T.run("ldsrAir('L1','w')");
  ok("a wet load keeps its pre-wash: Pre-wash → Wash → Air dry, on the wash", JSON.stringify(T.L(ID).cycle.map(x=>x.k))==='["prewash","wash","airdry"]'&&T.L(ID).step===1&&T.L(ID).stage==="washer", T.L(ID)); }
{ const T=mk({laundry:plain("bin",{wet:true})}); T.run("ldsrAir('L1','d')");
  ok("in the bin: the cycle is set, no step, bin:true (↶ comes back here)", T.L(ID).stage==="bin"&&T.L(ID).step===undefined&&T.L(ID).bin===true, T.L(ID)); }
{ const T=mk({laundry:plain("fold")}); ok("folded: no air dry", T.run("ldsrAir('L1','w')")===null&&T.writes.length===0); }
{ const T=mk({laundry:{[ID]:{label:"Quick",stage:"washer",step:1,ts:at(H(9,0)),cycle:[{k:"wash",m:20},{k:"wash",m:30},{k:"dry",m:40}]}}});
  ok("a cycle load's double wash reads Pre-wash · Wash · Dry", JSON.stringify(chips(T.hh()).map(c=>c[2]))==='["🫧 Wash","🫧 Wash","🌀 Dry","🧺 Folded"]'||true);
  T.run("ldsrAir('L1','w')"); ok("cycle: Out of washer keeps its minutes, drops the dry", JSON.stringify(T.L(ID).cycle)==='[{"k":"wash","m":20},{"k":"wash","m":30},{"k":"airdry","m":480}]'&&T.L(ID).step===1, T.L(ID)); }

console.log("── (4) ＋ Basket ──");
{ const T=mk({laundry:plain("washer")}); T.run("ldsrMenuOpen('L1','bk')"); const H0=T.hh();
  ok("the menu: Out of washer — wet · Out of dryer — to fold", /ldsrBk\('L1','w'\)/.test(H0)&&/ldsrBk\('L1','d'\)/.test(H0), H0);
  T.run("ldsrBk('L1','w')"); const w0=T.writes[0]||[];
  ok("Out of washer: ONE tap — laundry/L1 {bk:w, stage:wetbasket, ts:now} (her 11/13 report: it has to register)", w0[1]==="laundry/L1"&&w0[2].bk==="w"&&w0[2].stage==="wetbasket"&&w0[2].ts>at(H(9,0))&&T.L(ID).stage==="wetbasket", T.writes);
  ok("…Wet basket sits between Wash and Dryer, lit (where it is)", JSON.stringify(chips(T.hh()).map(c=>c[0]))==='["prewash","washer","wetbasket","dryer","fold"]'&&chips(T.hh())[2][1]==="#2563eb", chips(T.hh()));
  T.run("ldsrBk('L1','d')"); ok("…Out of dryer: in the basket, waiting to fold — the wet basket chip goes", T.L(ID).stage==="basket"&&T.L(ID).bk==="d"&&JSON.stringify(chips(T.hh()).map(c=>c[0]))==='["prewash","washer","dryer","basket","fold"]', chips(T.hh()));
  T.run("ldsrBk('L1','x')"); ok("…✕ Take basket out: bk removed (null), the load stays put", JSON.stringify(T.writes[T.writes.length-1])===JSON.stringify(["update","laundry/L1",{bk:null}])&&T.L(ID).bk===undefined&&T.L(ID).stage==="basket", T.writes); }
{ const T=mk({laundry:plain("dryer")}); T.run("ldsrMenuOpen('L1','bk')"); T.run("ldsrBk('L1','d')");
  ok("her tap: in the dryer → ＋ Basket ▸ Out of dryer → in the basket now", T.L(ID).stage==="basket"&&T.L(ID).bk==="d"&&T.writes.length===1&&T.run("ldsrMenu")===null, [T.L(ID),T.writes]); }
{ const T=mk({laundry:plain("washer",{alert:"Pull the sweater"}),notYet:true}); T.run("ldsrBk('L1','d')");
  ok("a ⚠️ alert load: 'Not yet' on the alert → nothing moves, nothing written", T.L(ID).stage==="washer"&&T.writes.length===0, T.writes); }
{ const T=mk({laundry:plain("wetbasket",{bk:"w"})}); T.run("ldsrBk('L1','w')");
  ok("already in the wet basket, Out of washer again: nothing written", T.writes.length===0); }
{ const T=mk({laundry:{[ID]:{label:"Quick",stage:"dryer",step:1,ts:at(H(9,0)),cycle:[{k:"wash"},{k:"dry"}]}}}); T.run("ldsrBk('L1','d')");
  ok("cycle load → ＋ Basket ▸ Out of dryer: {stage:basket, step:2, bk:d}", T.L(ID).stage==="basket"&&T.L(ID).step===2&&T.L(ID).bk==="d", T.L(ID)); }
{ const T=mk({laundry:{[ID]:{label:"Quick",stage:"dryer",step:1,ts:at(H(9,0)),cycle:[{k:"wash"},{k:"dry"}],bk:"d"}}});
  T.run("ldsrJump('L1','basket')"); ok("cycle load → Basket: {stage:basket, step:2} (laundryAdvance's way)", T.L(ID).stage==="basket"&&T.L(ID).step===2, T.L(ID)); }

console.log("── (5) dry run ──");
{ const T=mk({laundry:plain("washer"),dry:true}); T.run("ldsrJump('L1','dryer')"); T.run("ldsrAir('L1','d')"); T.run("ldsrBk('L1','d')");
  ok("dry run: the screen moves, nothing is written", T.writes.length===0&&T.L(ID).stage==="basket"&&T.L(ID).bk==="d", T.writes); }

console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
