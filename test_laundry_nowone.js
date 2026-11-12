/*
 * 🧺 LAUNDRY_NOWONE — one laundry row in 🔴 Now (her ask 2026-11-11: "instead of listing everything where it gets super busy, just put
 * laundry steps are needed, like a little laundry alert … if you click it, it takes you to the laundry section where it shows what is
 * needed"). Her picks: all three families · Dad's 🔴 LAUNDRY NOW box too · a red light so it isn't easily ignored.
 *   (1) the row: red light, "🧺 Laundry needs you · N steps", the loads' names, Open › — nothing when nothing needs a step
 *   (2) Mom's 🔴 Now draws it from laundryNudgeList (the same loads, the same clocks); Open › → Household ▸ Laundry
 *   (3) Dad's box: bin loads only, as before, the same one row; Open › → his 🏡 My day
 *   (4) Household ▸ Laundry: the loads that need a step first, a red light each; the 🧺 Laundry chip's light
 *   (5) not changed: Mom's schedule laundry (MOMSCHED_LAUNDRY), the Home Base badge list (hbAlertItems); nothing is written
 *                                                                                                run: node test_laundry_nowone.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm"), cp=require("child_process");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,700)+")":"")); } };
function slice(name){ const sig="function "+name+"("; const i=src.indexOf(sig); if(i<0) throw new Error("not found: "+name); let d=0; for(let k=src.indexOf("{",i);k<src.length;k++){ if(src[k]==="{")d++; else if(src[k]==="}"){ d--; if(d===0) return src.slice(i,k+1);} } throw new Error("unbalanced: "+name); }
const cut=(a,b,s)=>{ s=s||src; const i=s.indexOf(a), j=s.indexOf(b,i); if(i<0||j<0) throw new Error("missing "+a); return s.slice(i,j); };
const LCONST=cut("const LAUNDRY_STAGES=","const LAUNDRY_STALE_MIN");
const LTIMES=cut("// 🧺 LAUNDRYTIMES (her ask","function laundryEditToggle(");
const NUDGE=cut("// LAUNDRY_NUDGE_START","// LAUNDRY_NUDGE_END");
const ONE=cut("// LAUNDRY_NOWONE_START","// LAUNDRY_NOWONE_END");
const MS=cut("// MOMSCHED_LAUNDRY_START","// MOMSCHED_LAUNDRY_END");
const CU=cut("// CHOREUNDO_START","// CHOREUNDO_END");
const LE=cut("// LAUNDRYEDIT_START","// LAUNDRYEDIT_END");
const SR=cut("// LAUNDRY_STAGEROW_START","// LAUNDRY_STAGEROW_END");
const NOW=Date.now(), ago=m=>NOW-m*60000;

function mk(laundry){
  const writes=[], renders=[], jumps=[];
  const ctx={console,Object,Array,String,Number,parseInt,isNaN,Math,JSON,RegExp,Date,
    HA_LS:{getItem:()=>null,setItem:()=>{}}, _dryRun:()=>false,
    db:{ref:p=>({set:v=>writes.push(["set",p]),update:v=>writes.push(["update",p]),remove:()=>writes.push(["rm",p])})},
    esc:s=>String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/"/g,"&quot;"), cap:s=>s, ROSTER:[], KID_NAME:{},
    laundryData:laundry, momHere:()=>true, tab:"moms-plan", mpSubView:null, hhView:"review", checked:{}, coSchoolEnd:()=>975, toMin:()=>null, fromMin:m=>String(m),
    laundryTimesEditorHTML:()=>"", mwTodayIso:()=>"x", mwToast:()=>{}, renderMomsPlan:()=>renders.push("plan"), ssJumpTo:id=>jumps.push(id),
    window:{scrollTo:()=>{}}, document:{getElementById:id=>id==="content"?{}:null}, writes, renders, jumps};
  vm.createContext(ctx);
  vm.runInContext("var mpSubView=null, hhView='review';\n"+LCONST+"\n"+LTIMES+"\n"+MS+"\n"+CU+"\n"+LE+"\n"+SR+"\n"+NUDGE+"\n"+ONE+"\n"+slice("laundrySince")+"\n"+slice("laundryAdvanceLabel")+"\n"+slice("mdCardLaundry")
    +"\nlaundryTimes={wash:60,dry:60,grace:30};laundryBlockMins={};",ctx);
  return {ctx,writes,renders,jumps,run:e=>vm.runInContext(e,ctx)};
}
const LOADS=()=>({
  a:{label:"Towels",stage:"washer",ts:ago(120)},            // 2 h in the washer → needs a step
  b:{label:"Lincoln's clothes",stage:"dryer",ts:ago(20)},   // still running
  c:{label:"Sheets",stage:"fold",ts:ago(5*60)},             // folded 5 h → put away
  d:{label:"💦 Swim towels",stage:"bin",ts:ago(20*60)}      // 20 h in the wash-today bin
});

console.log("── (1) the one row ──");
{ const T=mk(LOADS()); const L=T.run("laundryNudgeList(Date.now())"); const H=T.run("laundryNowOneHTML(laundryNudgeList(Date.now()),'laundryNowOpen()')");
  ok("three loads need a step (washer, fold, bin) — the dryer load does not", L.length===3&&!L.some(x=>x.id==="b"), L.map(x=>x.id));
  ok("ONE row: 🧺 Laundry needs you · 3 steps", (H.match(/class="laundry-nowone"/g)||[]).length===1&&/🧺 Laundry needs you · 3 steps/.test(H), H);
  ok("…a red light", /class="laundry-light"/.test(H)&&/background:#dc2626/.test(H));
  ok("…the loads' names, no per-load sentences", /Towels · Sheets · Swim towels/.test(H)&&!/before it sours|put it away|wash-today bin/.test(H), H);
  ok("…Open › and the whole row run laundryNowOpen()", /onclick="laundryNowOpen\(\)"/.test(H)&&/event\.stopPropagation\(\);laundryNowOpen\(\)"[^>]*>Open ›</.test(H), H);
  ok("1 step reads 'step'", /· 1 step</.test(T.run("laundryNowOneHTML(laundryNudgeList(Date.now(),['bin']),'x()')")));
  ok("nothing needs a step → nothing drawn", T.run("laundryNowOneHTML([],'x()')")===""&&mk({b:LOADS().b}).run("laundryNowOneHTML(laundryNudgeList(Date.now()),'x()')")==="");
}

console.log("── (2) Mom's 🔴 Now ──");
{ const line=src.split("\n").find(l=>/const _ln=laundryNudgeList\(Date\.now\(\)\)/.test(l))||"";
  ok("🔴 Now draws laundryNowOneHTML from laundryNudgeList, counting each load in nowN", /nowN\+=_ln\.length; h\+=\(typeof laundryNowOneHTML==="function"\)\?laundryNowOneHTML\(_ln,"laundryNowOpen\(\)"\)/.test(line), line);
  ok("the old row-per-load loop is gone from 🔴 Now", !/laundryNudgeList\(Date\.now\(\)\)\.forEach\(x=>\{ nowN\+\+; h\+=laundryNudgeRowHTML\(x\); \}\)/.test(src));
  const T=mk(LOADS()); T.run("laundryNowOpen()");
  ok("Open › → Household ▸ Laundry (mpSubView house, hhView laundry), repainted", T.run("mpSubView")==="house"&&T.run("hhView")==="laundry"&&T.renders.length===1);
}

console.log("── (3) Dad's 🔴 LAUNDRY NOW ──");
{ const T=mk(LOADS()); const H=T.run("laundryBinNowHTML()");
  ok("his box keeps its heading and shows ONE row", /🔴 LAUNDRY NOW/.test(H)&&(H.match(/class="laundry-nowone"/g)||[]).length===1, H);
  ok("…bin loads only, as before (1 step: Swim towels)", /· 1 step</.test(H)&&/Swim towels/.test(H)&&!/Towels ·|Sheets/.test(H), H);
  ok("…Open › → his 🏡 My day", /laundryNowDadOpen\(\)/.test(H)&&(T.run("laundryNowDadOpen()"),T.jumps[0]==="myday"), T.jumps);
  ok("no bin load → no box", mk({a:LOADS().a}).run("laundryBinNowHTML()")===""); }

console.log("── (4) Household ▸ Laundry ──");
{ const T=mk(LOADS()); const H=T.run("mdCardLaundry(true,false,true)");
  const pos=n=>H.indexOf(">"+n), lin=H.indexOf("Lincoln's clothes</span>");
  ok("the loads that need a step come before the one still running", pos("Towels</span>")<lin&&pos("Sheets</span>")<lin&&pos("💦 Swim towels</span>")<lin, [pos("Towels</span>"),pos("Sheets</span>"),pos("💦 Swim towels</span>"),lin]);
  const rows=H.split('<div style="display:flex;align-items:center;gap:8px;padding:7px 10px;background:#f8fafc').slice(1), lr=rows.find(r=>r.includes("Lincoln's clothes</span>"))||"";
  ok("a red light on each of the three, none on Lincoln's", (H.match(/class="laundry-light"/g)||[]).length===3&&rows.length===4&&!/laundry-light/.test(lr), [(H.match(/class="laundry-light"/g)||[]).length,rows.length]);
  ok("…right before its name", /class="laundry-light"[^>]*><\/span><span style="font-size:13px;font-weight:700">Towels</.test(H));
  const M=T.run("mdCardLaundry(true)");
  ok("Home Base / Mom's Day card: no lights, order unchanged (oldest first)", !/laundry-light/.test(M)&&M.indexOf("Swim towels")<M.indexOf(">Towels<"), M.indexOf("Swim towels")+" "+M.indexOf(">Towels<"));
  ok("the 🧺 Laundry chip gets a 🔴 when a step is waiting", src.indexOf("chip('laundry','🧺 Laundry'+((typeof laundryNowCount===\"function\"&&laundryNowCount())?' 🔴':''))")>0);
  ok("laundryNowCount = laundryNudgeList's length", T.run("laundryNowCount()")===3&&mk({b:LOADS().b}).run("laundryNowCount()")===0); }

console.log("── (5) not changed; nothing written ──");
{ const T=mk(LOADS()); T.run("laundryNowOneHTML(laundryNudgeList(Date.now()),'x()');laundryBinNowHTML();mdCardLaundry(true,false,true);laundryNowOpen();laundryNowDadOpen();laundryNowCount()");
  ok("no Firebase write from any of it", T.writes.length===0, T.writes);
  let base=""; try{ base=cp.execSync("git show origin/main:index.html",{cwd:__dirname,encoding:"utf8",maxBuffer:1<<28}); }catch(e){}
  if(base){ ok("Mom's schedule laundry (MOMSCHED_LAUNDRY) is byte-for-byte main's", cut("// MOMSCHED_LAUNDRY_START","// MOMSCHED_LAUNDRY_END",base)===MS);
    ok("the Home Base badge list (hbAlertItems) is byte-for-byte main's", slice("hbAlertItems")===(()=>{ const i=base.indexOf("function hbAlertItems("); let d=0; for(let k=base.indexOf("{",i);k<base.length;k++){ if(base[k]==="{")d++; else if(base[k]==="}"){ d--; if(d===0) return base.slice(i,k+1);} } })());
    ok("laundryNudgeList / laundryNudgeKind (which loads, which clocks) are main's", slice("laundryNudgeList")===cut("function laundryNudgeList(","function laundryNudgeRowHTML(",base).trim()&&base.includes(slice("laundryNudgeKind"))); }
  else console.log("  (skip — no origin/main to compare)");
}

console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
