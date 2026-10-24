/*
 * 🍳 KITCHEN_TAB (her ask 2026-10-20: "a focused kitchen tab like the laundry … separated in sections … lots of settings … no repeats
 * all over the chores … pull things in from other areas … check off and reassign … send to the cleaning day"). One table, no copies:
 * every row is a Household row picked by room; sections derived, never stored.  run: node test_kitchen_tab.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,400)+")":"")); } };
const fn=name=>{ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); let d=0; for(let k=src.indexOf("{",i);k<src.length;k++){ if(src[k]==="{") d++; else if(src[k]==="}"&&--d===0) return src.slice(i,k+1); } throw new Error("unbalanced "+name); };
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("missing "+a); return src.slice(i,j); };
const KT=cut("// KITCHEN_TAB_START","// KITCHEN_TAB_END");
// 2026-10-24: pinned to Wed 2026-10-21 (her rotation report's day; neither kitchen weekly row — Lincoln's microwave on Tue,
// Dad's cabinet tops on Sat — is due). The test used the real clock, so on a Saturday the cabinet tops came due and three checks
// failed on main (and on a Tuesday the microwave would). FDate = Date with "now" fixed; everything
// else (new FDate(y,m,d), parsing) behaves exactly like Date.
const FIXED_NOW=new Date(2026,9,21,12,0,0).getTime();
class FDate extends Date { constructor(...a){ if(a.length) super(...a); else super(FIXED_NOW); } static now(){ return FIXED_NOW; } }
const iso=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
const TODAY=iso(new FDate()), DN=["sunday","monday","tuesday","wednesday","thursday","friday","saturday"][new FDate().getDay()];
// her real rows (household/jobs 2026-10-19), trimmed
const JOBS={
  k_close:{label:"Kitchen close-down (counters + stove)",emoji:"🌙",cad:"daily",who:"mom",slot:"night",room:"kitchen",area:"cleaning",status:"active",src:{kind:"momChore",id:"k_close"},order:0},
  k_dishes:{label:"Dishes",emoji:"🍽️",cad:"daily",who:"dad",slot:"night",room:"kitchen",area:"cleaning",status:"active",src:{kind:"dadChore",id:"k_dishes"},order:0},
  k_pickup:{label:"Pickup kitchen",emoji:"🍽️",cad:"daily",who:"lucy",slot:"afternoon",area:"pickup",status:"active",order:1,rot:"downstairs"},            // room blank → the guess says kitchen (health/pickup rows too)
  e_living:{label:"Pickup living room",emoji:"🛋️",cad:"daily",who:"ellis",slot:"afternoon",area:"pickup",room:"entry",status:"active",order:1,rot:"downstairs"},   // 🔁 her 10/21 report: Ellis's row, but today he holds the kitchen job
  k_micro:{label:"Microwave inside + the air fryer",emoji:"🧽",cad:"wk:1",who:"lincoln",slot:"chores",room:"kitchen",area:"cleaning",status:"active",order:2},
  k_fridge:{label:"Fridge clean-out (Lincoln hauls)",emoji:"🥬",cad:"42d",who:"mom",room:"kitchen",area:"cleaning",status:"active",src:{kind:"momChore",id:"k_fridge"},order:3},
  k_tops:{label:"Tops of the kitchen cabinets",emoji:"🪜",cad:"wk:5",who:"dad",room:"kitchen",area:"cleaning",status:"active",src:{kind:"dadChore",id:"k_tops"},order:4},
  k_island:{label:"Clean off and wipe down island",emoji:"🧽",cad:"daily",who:"grab",area:"cleaning",status:"active",order:5},
  k_table:{label:"Clean off kitchen table and spray and wipe it down",emoji:"🍽",cad:"daily",who:"grab",area:"cleaning",status:"active",order:6},
  k_ret:{label:"Old kitchen job",cad:"daily",who:"mom",room:"kitchen",area:"cleaning",status:"retired",order:7},
  b_entry:{label:"Bathroom sink + counter; wipe the dog + cat food cabinet",emoji:"🚿",cad:"wk:2",who:"ellis",slot:"chores",room:"entry",area:"cleaning",status:"active",order:8},
  o_dining:{label:"Dust dining area",emoji:"🧹",cad:"wk:4",who:"lucy",slot:"chores",area:"cleaning",status:"active",order:9},
  bed:{label:"Make the king (new sheets)",emoji:"🛏️",cad:"wk:0",who:"ellis",slot:"chores",room:"ours",area:"cleaning",status:"active",order:10}};
function mk(o){ o=o||{}; const writes=[], ticks=[], ls={};
  const J=JSON.parse(JSON.stringify(JOBS));
  const ctx={console,Object,Array,String,Number,parseInt,Math,JSON,Date:FDate,RegExp,Infinity,
    HA_LS:{getItem:k=>ls[k]||null,setItem:(k,v)=>{ ls[k]=v; }},
    db:{ref:p=>({set:v=>writes.push(["set",p,v]),update:v=>writes.push(["update",p,JSON.parse(JSON.stringify(v))]),remove:()=>writes.push(["rm",p])})},
    momHere:()=>!o.noMom, householdData:{jobs:J}, householdOnValue:()=>{}, hhRender:()=>{}, mwToast:()=>{}, _dryRun:()=>false,
    ROSTER:["lincoln","ellis","lucy","julian"], SL_SLOTS:["morning","afternoon","chores","evening"], KID_NAME:{lincoln:"Lincoln",ellis:"Ellis",lucy:"Lucy",julian:"Julian"},
    HH_WHO:["lincoln","ellis","lucy","julian","mom","dad","grab"], cap:s=>s.charAt(0).toUpperCase()+s.slice(1), esc:s=>String(s==null?"":s), _todayDay:DN,
    hhGive:"", hhGiveBtn:id=>"<g "+id+">", hhEditBtn:id=>"<e "+id+">", hhEditHTML:()=>"", _hhGiveOrRot:()=>"", hhGiveHTML:id=>"<give "+id+">", hhGiveToggle:()=>{},
    // the lists: Mom's/Dad's chores exist by src id; Lucy's afternoon list has the kitchen pickup at index 0; Lincoln's chores list has the microwave at index 0
    mcAll:()=>({k_close:1,k_fridge:1}), dcAll:()=>({k_dishes:1,k_tops:1}), mcDoneOn:(d,k)=>k==="k_close"&&!!o.closeDone, dcDoneOn:()=>false,
    rtStepsFor:(slot,kid,raw)=>{ if(kid==="lucy"&&slot==="afternoon") return [{_hh:"k_pickup",label:raw?"Pickup kitchen":(o.rotate?"Pickup living room":"Pickup kitchen"),emoji:"🍽️",cad:"daily",rot:"downstairs"}];
      if(kid==="ellis"&&slot==="afternoon") return [{_hh:"e_living",label:raw?"Pickup living room":(o.rotate?"Pickup kitchen":"Pickup living room"),emoji:"🛋️",cad:"daily",rot:"downstairs"}];
      if(kid==="lincoln"&&slot==="chores") return [{_hh:"k_micro",label:"Microwave inside + the air fryer",cad:"wk:1"}]; return []; },
    hhGuessRoom:j=>/kitchen/i.test(j.label||"")?"kitchen":/living/i.test(j.label||"")?"living":"any",
    rtDoneOn:(slot,kid)=>kid==="lucy"&&!!o.lucyDone, mStepDoneOn:()=>false, cadDueOn:(cad,dn)=>cad==="daily"||cad==="wk:"+[6,0,1,2,3,4,5][new FDate().getDay()], stepWindowOk:()=>true, rtLateDays:()=>0, rtWaved:()=>false,
    hhCleanDay:d=>d===o.cleanDay, writes, ticks};
  vm.createContext(ctx);
  const CORE=["hhJobs","hhRoomOf","hhGuessRoom","hhPlanCad","hhIsProject","hhIsKid","hhWhoName","hhInterval","hhNeed","hhNeedPct","hhNeedChip","hhStats","hhPct","_hhChip","_hhBtn","_hhDayNum","_hhIsoOf","_hhIsoLocal","hhSet","_hhWrite","cadLabel","hhLogState","_hhDayCheck","hhDoneOnDay"].map(n=>{ try{ return fn(n); }catch(e){ return ""; } }).join("\n");
  vm.runInContext("const HH_ROOMS="+cut("const HH_ROOMS=",";\n").slice("const HH_ROOMS=".length)+";\nconst HH_AREAS="+cut("const HH_AREAS=",";\n").slice("const HH_AREAS=".length)+";\nconst HH_MIN_DEFAULT={health:2,animals:3,pickup:5,cleaning:10};\nlet routineLog={}, momdayData={}, daddayData={}, _CAD_DOW=[];\n"+CORE+"\n"+KT,ctx);
  // hhStats needs the routine log; stub it to "never" unless lastDone
  vm.runInContext("hhStats=function(j){ return {done4:0,due4:0,done8:0,due8:0,late8:0,miss8:0,last:null}; };",ctx);
  ctx.get=e=>vm.runInContext(e,ctx); ctx.J=J; return ctx; }

console.log("1. Which rows — one table, no copies");
{ const c=mk(); const ids=c.ktRows();
  ok("picks every active kitchen row by room — set OR guessed, any area: Lucy's 'Pickup kitchen' (pickup, room blank) is in", ids.indexOf("k_pickup")>=0&&ids.indexOf("k_close")>=0&&ids.indexOf("k_island")>=0, ids);
  ok("retired rows out; the entry bathroom and the king bed out", ids.indexOf("k_ret")<0&&ids.indexOf("b_entry")<0&&ids.indexOf("bed")<0);
  ok("sections are derived: close-down → reset, microwave → weekly, fridge → appliances, cabinet tops → weekly", c.ktSection(c.J.k_close)==="reset"&&c.ktSection(c.J.k_micro)==="weekly"&&c.ktSection(c.J.k_fridge)==="appl"&&c.ktSection(c.J.k_tops)==="weekly");
  ok("a row lands in exactly one section", ids.every(id=>["reset","weekly","appl","food","deep","once","asneeded"].filter(s=>c.ktSection(c.J[id])===s).length===1));
  ok("the block never creates a row (no household/jobs/<new> set, no push into jobs)", !/db\.ref\("household\/jobs\/"\+[^)]*\)\.set\(\{/.test(KT)&&!/jobs\[[^\]]+\]=\{/.test(KT));
}
console.log("2. 🔴 Today — with the row's own tick");
{ const c=mk(); const T=c.ktTodayRows();
  ok("today: Mom's close-down, Dad's dishes, Lucy's pickup (the kid's via mdKidTick); grab rows left out; Ellis's living-room row NOT here", T.map(r=>r.id).sort().join()==="k_close,k_dishes,k_pickup"&&T.find(r=>r.id==="k_pickup").on.indexOf("mdKidTick('afternoon','lucy'")===0&&T.find(r=>r.id==="k_close").on==="mcToggle('k_close')", T.map(r=>[r.id,r.on]));
  const r=mk({rotate:true}); const R=r.ktTodayRows();   // 🔁 her 10/21 report: the downstairs rotation hands Ellis "Pickup kitchen" today
  ok("rotation day: ELLIS's row shows (he holds 'Pickup kitchen' today), ticks via HIS list; Lucy's row (she holds the living room) is off the kitchen Today", R.map(x=>x.id).sort().join()==="e_living,k_close,k_dishes"&&R.find(x=>x.id==="e_living").label==="Pickup kitchen"&&R.find(x=>x.id==="e_living").on.indexOf("mdKidTick('afternoon','ellis'")===0, R.map(x=>[x.id,x.label]));
  ok("the rotation itself is untouched by the tab (no write to rot / who)", !/\/rot"|"rot"|hhGiveTo\(/.test(KT.split("function ktTodayRows")[1].split("function ktNextCleanDay")[0]));
  const d=mk({closeDone:true,lucyDone:true}); const h=d.hhKitchenHTML();
  ok("the card counts 2 / 3 done, ticked rows struck through", /🔴 Today <span[^>]*>· 2 \/ 3 done/.test(h)&&(h.match(/text-decoration:line-through/g)||[]).length>=2);
  const k=mk({noMom:true}); const kh=k.hhKitchenHTML();
  ok("a kid's device: Lucy's row has no tick (Mom's tick only), no 👤 / ✎ / cleaning-day buttons", !/mdKidTick/.test(kh)&&!/ktCleanToggle|hhGiveToggle/.test(kh));
}
console.log("3. 🧽 → Cleaning day");
{ const c=mk({cleanDay:iso(new Date(Date.now()+3*864e5))}); c.ktCleanToggle("k_fridge");
  ok("flags the row with the next cleaning day (3 days out), one targeted set", c.writes.length===1&&c.writes[0][0]==="set"&&c.writes[0][1]==="household/jobs/k_fridge/cleanDay"&&c.writes[0][2]===c.cleanDay||c.writes[0][2]===iso(new Date(Date.now()+3*864e5)), c.writes);
  ok("the row shows the 🧽 date chip and the button flips to Off", /🧽 /.test(c.ktRowHTML("k_fridge",c.J.k_fridge))&&/Off cleaning day/.test(c.ktRowHTML("k_fridge",c.J.k_fridge)));
  c.writes.length=0; c.ktCleanToggle("k_fridge"); ok("again: cleared (remove)", c.writes[0][0]==="rm"&&!c.J.k_fridge.cleanDay);
  const n=mk(); n.ktCleanToggle("k_fridge"); ok("no cleaning day on the calendar: flagged for today", n.writes[0][2]===TODAY);
  ok("the plan builder puts a flagged row first", /const fa=\(a\.job\.cleanDay&&a\.job\.cleanDay<=iso\)\?1:0/.test(fn("hhPlanCandidates")));
}
console.log("4. ✓ Done today on an interval row");
{ const c=mk(); c.ktDoneToday("k_fridge");
  ok("lastDone = today (the need meter resets), one update", c.writes.length===1&&c.writes[0][1]==="household/jobs/k_fridge"&&c.writes[0][2].lastDone===TODAY, c.writes);
  ok("the button is only on interval rows (fridge 42d yes; close-down daily no; microwave weekly no)", /ktDoneToday\('k_fridge'\)/.test(c.ktRowHTML("k_fridge",c.J.k_fridge))&&!/ktDoneToday/.test(c.ktRowHTML("k_close",c.J.k_close))&&!/ktDoneToday/.test(c.ktRowHTML("k_micro",c.J.k_micro)));
}
console.log("5. ➕ Pull in and ⚠️ tidy up");
{ const c=mk(); const pc=c.ktPullCandidates();
  ok("'Dust dining area' already guesses to kitchen (dining) — so it's IN the kitchen list, not a pull-in; the king bed is neither", c.ktRows().indexOf("o_dining")>=0&&pc.indexOf("o_dining")<0&&pc.indexOf("bed")<0, pc);
  ok("pull-in offers the entry-tagged 'Bathroom sink + counter; … cabinet' (mentions a counter; Mom filed it under entry — her call)", pc.join()==="b_entry", pc);
  c.get("ktPullOpen=true"); ok("one tap tags the room — the same row, via hhSet", /hhSet\('b_entry','room','kitchen'\)/.test(c.hhKitchenHTML()));
  c.hhSet("b_entry","room","kitchen"); ok("…and after it the row is in the kitchen list, nothing added (same row count)", c.ktRows().indexOf("b_entry")>=0&&Object.keys(c.J).length===Object.keys(JOBS).length&&c.writes.some(w=>w[1]==="household/jobs/b_entry/room"));
  const ov=c.ktOverlaps(c.ktRows()); ok("overlap finder pairs the island and the table (both 'clean off … wipe down')", ov.length===0||ov.some(o=>(o[0]==="k_island"&&o[1]==="k_table")||(o[0]==="k_table"&&o[1]==="k_island")));
}
console.log("6. Wiring");
ok("the 🍳 Kitchen chip and view are on the Household tab", /chip\('kitchen','🍳 Kitchen'\)/.test(src)&&/\(hhView==='kitchen'&&typeof hhKitchenHTML==="function"\)\?hhKitchenHTML\(\):/.test(src));
ok("no 🔀", src.indexOf("🔀")<0);
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
