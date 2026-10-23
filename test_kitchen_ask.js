/*
 * 🍳 KITCHEN_ASK (her ask 2026-10-20: the weekly kitchen question, modeled exactly on the bedding one). On the kitchen day, when Mom ticks
 * her "Kitchen close-down" row: "Kitchen this week — anything else today?" — every interval kitchen row, due ones highlighted, the rest
 * "done N days ago"; Save writes lastDone/lastBy per ticked row.
 * Link (b): the dish-towels laundry extra (documented in the PR, never written) rides the Friday Towels load.   run: node test_kitchen_ask.js
 *
 * Replay: the real hhNeed / hhStats / _hhDayCheck / cadDueOn / mcToggle run against a fixed Monday (2026-10-19, 8 PM) and Mom's tick log.
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,500)+")":"")); } };
const fn=name=>{ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); let d=0; for(let k=src.indexOf("{",i);k<src.length;k++){ if(src[k]==="{") d++; else if(src[k]==="}"&&--d===0) return src.slice(i,k+1); } throw new Error("unbalanced "+name); };
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("missing "+a); return src.slice(i,j); };
const KT=cut("// KITCHEN_TAB_START","// KITCHEN_TAB_END");
const KA=cut("// KITCHEN_ASK_START","// KITCHEN_ASK_END");
const LL=cut("// LAUNDRYLINE_START","// LAUNDRYLINE_END");
const iso=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
const MON="2026-10-19", TUE="2026-10-20";   // 10/19/2026 is a Monday

const JOBS=()=>({
  k_close:{label:"Kitchen close-down (counters + stove)",emoji:"🌙",cad:"daily",who:"mom",slot:"night",room:"kitchen",area:"cleaning",status:"active",src:{kind:"momChore",id:"mc_kclose"},order:0},
  k_purge:{label:"Fridge purge — toss expired + leftovers",emoji:"🥬",cad:"wk:4",who:"mom",room:"kitchen",area:"cleaning",status:"active",src:{kind:"momChore",id:"mc_purge"},order:1},
  k_fridge:{label:"Fridge clean-out (Lincoln hauls)",emoji:"🧊",cad:"42d",who:"mom",room:"kitchen",area:"cleaning",status:"active",lastDone:"2026-09-01",src:{kind:"momChore",id:"mc_fridge"},order:2},   // 48 days → due
  k_oven:{label:"Deep clean the oven",emoji:"🔥",cad:"28d",who:"mom",room:"kitchen",area:"cleaning",status:"active",lastDone:"2026-10-13",src:{kind:"momChore",id:"mc_oven"},order:3},   // 6 days → fine
  k_filter:{label:"Hood filter + coffee descale",cad:"2w",who:"mom",room:"kitchen",area:"cleaning",status:"active",src:{kind:"momChore",id:"mc_filter"},order:4},   // never done → due
  k_sponge:{label:"Sanitize the sponges",cad:"7d",who:"mom",room:"kitchen",area:"cleaning",status:"active",lastDone:"2026-10-18",src:{kind:"momChore",id:"mc_sponge"},order:5},   // yesterday
  k_dishes:{label:"Dishes",cad:"daily",who:"dad",room:"kitchen",area:"cleaning",status:"active",order:6},
  k_micro:{label:"Microwave inside + the air fryer",cad:"wk:1",who:"lincoln",slot:"chores",room:"kitchen",area:"cleaning",status:"active",order:7},
  k_once:{label:"Re-line the pantry shelves",cad:"once",who:"mom",room:"kitchen",area:"cleaning",status:"active",order:8},
  k_old:{label:"Old kitchen deep clean",cad:"28d",who:"mom",room:"kitchen",area:"cleaning",status:"retired",order:9},
  b_deep:{label:"Bathroom deep clean",cad:"28d",who:"mom",room:"entry",area:"cleaning",status:"active",order:10}});
const CORE_FNS=["hhJobs","hhRoomOf","hhGuessRoom","hhPlanCad","hhIsProject","hhIsKid","hhWhoName","hhInterval","hhNeed","hhNeedPct","hhNeedChip","hhStats","hhPct","_hhChip","_hhBtn","_hhDayNum","_hhIsoOf","_hhIsoLocal","_hhDow","_hhNorm","_hhCount","hhSet","_hhWrite","cadLabel","hhLogState","hhWindow","_hhDayCheck","hhRotLabelOn","cadDowIdx","cadDateNum","cadDueOn","householdOnValue","mcDoneOn"];
function mk(o){ o=o||{}; const writes=[], ls=o.ls||{}, boxes={}, toasts=[], NOW=new Date(o.at||(MON+"T20:00:00")).getTime();
  class FD extends Date{ constructor(...a){ if(a.length) super(...a); else super(NOW); } static now(){ return NOW; } }
  const J=Object.assign(JOBS(),o.jobs||{});
  const ctx={console,Object,Array,String,Number,parseInt,Math,JSON,RegExp,Infinity,Date:FD,
    HA_LS:{getItem:k=>ls[k]||null,setItem:(k,v)=>{ ls[k]=v; }},
    db:{ref:p=>({set:v=>writes.push(["set",p,v]),update:v=>writes.push(["update",p,JSON.parse(JSON.stringify(v))]),remove:()=>writes.push(["rm",p])})},
    momHere:()=>!o.noMom, householdData:{jobs:J,meta:o.meta||{}}, hhMaterialize:()=>{}, hhRender:()=>{}, mwToast:m=>toasts.push(m), _dryRun:()=>!!o.dry,
    esc:s=>String(s==null?"":s), hhGiveBtn:()=>"",
    ROSTER:["lincoln","ellis","lucy","julian"], SL_SLOTS:["morning","afternoon","chores","evening"], KID_NAME:{lincoln:"Lincoln",ellis:"Ellis",lucy:"Lucy",julian:"Julian"},
    HH_WHO:["lincoln","ellis","lucy","julian","mom","dad","grab"], cap:s=>s.charAt(0).toUpperCase()+s.slice(1),
    // the question's checkboxes: ticked by id (the page draws input[data-kta=<id>])
    document:{querySelectorAll:sel=>{ const m=/data-kta="([^"]+)"/.exec(sel); return (m&&boxes[m[1]])?[{checked:true}]:[]; }, getElementById:()=>null},
    mcAll:()=>({mc_kclose:1,mc_purge:1,mc_fridge:1,mc_oven:1,mc_filter:1,mc_sponge:1}), _todayStr:()=>iso(new FD(NOW)),
    writes, toasts, boxes};
  vm.createContext(ctx);
  const tail=["_CAD_DOW","HH_ROOMS","HH_AREAS"].map(n=>"const "+n+"="+cut("const "+n+"=",";\n").slice(("const "+n+"=").length)+";").join("\n");
  vm.runInContext(tail+"\nconst _HH_DN="+cut("const _HH_DN=",";\n").slice("const _HH_DN=".length)+";\nconst HH_MIN_DEFAULT={health:2,animals:3,pickup:5,cleaning:10};\nlet routineLog={}, momdayData={}, daddayData={}, _hhLogCache=null, DAY_DT=undefined;\n"
    +CORE_FNS.map(fn).join("\n")+"\n"+fn("mcToggle")+"\n"+KT+"\n"+KA, ctx);
  ctx.get=e=>vm.runInContext(e,ctx); ctx.J=J; return ctx; }
const HOUSEHOLD=c=>c.writes.filter(w=>/^household\//.test(w[1]));
const rowOf=(h,label)=>{ const m=new RegExp('<label[^>]*>(?:(?!</label>).)*'+label.replace(/[()+]/g,"\\$&")+'(?:(?!</label>).)*</label>').exec(h); return m?m[0]:""; };

console.log("1. The close-down ticked on the kitchen day (Monday, default) opens the question");
{ const c=mk();
  ok("nothing asked before the tick", c.ktAskHTML()==="");
  c.mcToggle("mc_kclose");
  ok("ticking her close-down (Mon) holds the question on this device for today", !!c.get("ktAskQ")&&c.get("ktAskQ").day===MON, c.get("ktAskQ"));
  const h=c.ktAskHTML();
  ok("title: '🍳 Kitchen this week — anything else today?'", h.indexOf("🍳 Kitchen this week — anything else today?")>=0);
  ok("lists exactly the interval rows: clean-out, oven, hood filter, sponges", ["Fridge clean-out","Deep clean the oven","Hood filter","Sanitize the sponges"].every(l=>h.indexOf(l)>=0)&&(h.match(/data-kta=/g)||[]).length===4, (h.match(/data-kta="[^"]+"/g)));
  ok("…and not the daily / weekly / purge / once / retired / other-room rows", ["Dishes","Microwave","Fridge purge","Re-line","Old kitchen","Bathroom deep","Kitchen close-down"].every(l=>h.indexOf(l)<0));
  ok("clean-out (48 days of 42): 'due now — do it today?' and highlighted", /due now — do it today\?/.test(rowOf(h,"Fridge clean-out"))&&/background:#fffbeb/.test(rowOf(h,"Fridge clean-out")));
  ok("hood filter (never done): 'due now — do it today?'", /due now — do it today\?/.test(rowOf(h,"Hood filter")));
  ok("oven (last 10/13): 'done 6 days ago', not highlighted", /done 6 days ago/.test(rowOf(h,"Deep clean the oven"))&&!/fffbeb/.test(rowOf(h,"Deep clean the oven")));
  ok("sponges (last 10/18): 'done yesterday'", /done yesterday/.test(rowOf(h,"Sanitize the sponges")));
  ok("the due ones come first, the recent ones after", h.indexOf("Fridge clean-out")<h.indexOf("Deep clean the oven")&&h.indexOf("Hood filter")<h.indexOf("Deep clean the oven"));
  ok("both buttons: Save and 'Just the close-down'", />Save</.test(h)&&/>Just the close-down</.test(h)&&/ktAskSave\(\)/.test(h)&&/ktAskSkip\(\)/.test(h));
  ok("asking writes nothing to Firebase household/ (only her normal momday tick)", HOUSEHOLD(c).length===0&&c.writes.length===1&&/^momday\//.test(c.writes[0][1]), c.writes);
}

console.log("2. Only the close-down row, only when ticked on, only on the kitchen day");
{ const a=mk(); a.mcToggle("mc_purge"); ok("ticking another of her chores asks nothing", a.get("ktAskQ")===null);
  const b=mk(); b.mcToggle("mc_kclose"); b.get("ktAskQ=null"); b.mcToggle("mc_kclose"); ok("unticking the close-down (a second tap) asks nothing", b.get("ktAskQ")===null);
  const t=mk({at:TUE+"T20:00:00"}); t.mcToggle("mc_kclose"); ok("Tuesday with the default (Monday): no question", t.get("ktAskQ")===null);
  const n=mk({jobs:{k_fridge:null,k_oven:null,k_filter:null,k_sponge:null}}); delete n.J.k_fridge; delete n.J.k_oven; delete n.J.k_filter; delete n.J.k_sponge; n.mcToggle("mc_kclose"); ok("no interval rows → no question", n.get("ktAskQ")===null);
  const r=mk({jobs:{k_close:{label:"Kitchen close-down (counters + stove)",cad:"daily",who:"mom",room:"kitchen",area:"cleaning",status:"retired",src:{kind:"momChore",id:"mc_kclose"}}}}); r.mcToggle("mc_kclose"); ok("a retired close-down row doesn't ask", r.get("ktAskQ")===null);
}

console.log("3. Save writes lastDone / lastBy for exactly the ticked rows");
{ const c=mk(); c.mcToggle("mc_kclose"); c.writes.length=0; c.ktAskHTML(); c.boxes.k_oven=true; c.ktAskSave();
  ok("one ticked → one write: household/jobs/k_oven update {lastDone: today, lastBy: mom} — the write ✓ Done today makes", c.writes.length===1&&c.writes[0][0]==="update"&&c.writes[0][1]==="household/jobs/k_oven"&&JSON.stringify(c.writes[0][2])===JSON.stringify({lastDone:MON,lastBy:"mom"}), c.writes);
  ok("in memory too: the oven reads done today", c.J.k_oven.lastDone===MON&&c.hhNeed(c.J.k_oven).days===0);
  ok("the question is gone and stays gone", c.get("ktAskQ")===null&&c.ktAskHTML()==="");
  ok("toast says what was done", /Done today: .*oven/.test(c.toasts[c.toasts.length-1]), c.toasts);
  const two=mk(); two.mcToggle("mc_kclose"); two.writes.length=0; two.boxes.k_fridge=true; two.boxes.k_filter=true; two.ktAskSave();
  ok("two ticked → two targeted writes, one per row, nothing else", two.writes.length===2&&two.writes.every(w=>/^household\/jobs\/k_(fridge|filter)$/.test(w[1])&&w[2].lastDone===MON&&w[2].lastBy==="mom"), two.writes);
  ok("a ticked row that wasn't offered (a daily one) is never written", (()=>{ const d=mk(); d.mcToggle("mc_kclose"); d.writes.length=0; d.boxes.k_dishes=true; d.boxes.k_purge=true; d.ktAskSave(); return d.writes.length===0; })());
  const none=mk(); none.mcToggle("mc_kclose"); none.writes.length=0; none.ktAskSave();
  ok("Save with nothing ticked: no writes, the question closes ('Just the close-down')", none.writes.length===0&&none.get("ktAskQ")===null&&/Just the close-down/.test(none.toasts[none.toasts.length-1]));
  const sk=mk(); sk.mcToggle("mc_kclose"); sk.writes.length=0; sk.boxes.k_oven=true; sk.ktAskSkip();
  ok("'Just the close-down' (skip) writes nothing even with a box ticked", sk.writes.length===0&&sk.get("ktAskQ")===null&&sk.J.k_oven.lastDone==="2026-10-13");
}

console.log("4. Held per device until answered, like the bedding question");
{ const ls={}; const a=mk({ls}); a.mcToggle("mc_kclose");
  const b=mk({ls}); ok("a reload on the same device still has the question (HA_LS ha_kt_ask)", b.get("ktAskQ")&&b.get("ktAskQ").day===MON&&b.ktAskHTML().indexOf("anything else today")>=0, ls);
  b.ktAskSkip(); const c=mk({ls}); ok("answered once → gone after a reload", c.get("ktAskQ")===null&&c.ktAskHTML()==="");
  const d=mk({ls:{ha_kt_ask:JSON.stringify({day:"2026-10-12"})}}); ok("a question left over from another day never shows", d.ktAskHTML()==="");
  const other=mk(); ok("another device (empty HA_LS) has no question", other.ktAskHTML()==="");
}

console.log("5. The kitchen day is a setting: household/meta/kitchenAskDow (Mon=0, default Mon)");
{ const c=mk(); ok("default: Monday (0)", c.ktAskDow()===0);
  ok("the chip row on the Kitchen tab: Mon–Sun, Monday lit", (()=>{ const h=c.ktAskSettingHTML(); return ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].every(d=>h.indexOf(">"+d+"<")>=0)&&/ktAskDowSet\(0\)/.test(h)&&/ktAskDowSet\(6\)/.test(h)&&/background:#ea580c[^>]*>Mon</.test(h); })(), c.ktAskSettingHTML());
  c.ktAskDowSet(1);
  ok("tapping Tue: ONE targeted write household/meta/kitchenAskDow = 1", c.writes.length===1&&c.writes[0][0]==="set"&&c.writes[0][1]==="household/meta/kitchenAskDow"&&c.writes[0][2]===1, c.writes);
  ok("…and it reads back 1, Tuesday lit", c.ktAskDow()===1&&/background:#ea580c[^>]*>Tue</.test(c.ktAskSettingHTML()));
  c.mcToggle("mc_kclose"); ok("Monday's tick no longer asks once the day is Tuesday", c.get("ktAskQ")===null);
  const t=mk({at:TUE+"T20:00:00",meta:{kitchenAskDow:1}}); t.mcToggle("mc_kclose"); ok("Tuesday's tick asks when the day is Tuesday", t.get("ktAskQ")&&t.get("ktAskQ").day===TUE);
  const bad=mk(); bad.ktAskDowSet(7); bad.ktAskDowSet(-1); bad.ktAskDowSet("x"); ok("out-of-range / junk taps write nothing", bad.writes.length===0&&bad.ktAskDow()===0);
  ok("a junk stored value falls back to Monday", mk({meta:{kitchenAskDow:9}}).ktAskDow()===0&&mk({meta:{kitchenAskDow:"x"}}).ktAskDow()===0);
  ok("Sunday (6) is a valid day", mk({meta:{kitchenAskDow:6},at:"2026-10-25T20:00:00"}).get("(function(){ return _hhDow(_hhIsoLocal(Date.now()))===ktAskDow(); })()"));
}

console.log("6. A kid's device (not Mom) sees nothing and can change nothing");
{ const ls={}; mk({ls}).mcToggle("mc_kclose");   // the question is held in this device's storage…
  const k=mk({ls,noMom:true});
  ok("…but a device that isn't in Mom mode draws nothing", k.get("ktAskQ")!==null&&k.ktAskHTML()==="");
  ok("no chip row for a kid", k.ktAskSettingHTML()==="");
  k.ktAskDowSet(3); ok("a kid can't change the day", k.writes.length===0&&k.ktAskDow()===0);
  k.boxes.k_oven=true; k.ktAskSave(); ok("a kid's Save writes nothing and changes nothing", HOUSEHOLD(k).length===0&&k.J.k_oven.lastDone==="2026-10-13");
  const t=mk({noMom:true}); t.mcToggle("mc_kclose"); ok("a close-down tick on a non-Mom device doesn't open it", t.get("ktAskQ")===null);
}

console.log("7. ?dryrun=1 stays inert");
{ const c=mk({dry:true}); c.mcToggle("mc_kclose"); c.writes.length=0; c.boxes.k_oven=true; c.ktAskSave(); c.ktAskDowSet(2);
  ok("no household/ writes at all in dry-run (Save and the day chip)", HOUSEHOLD(c).length===0, c.writes);
}

console.log("8. The block's writes are exactly the two allowed paths, each guarded");
{ const refs=KA.match(/db\.ref\([^)]*\)\.\w+\(/g)||[];
  ok("only household/jobs/<id>.update and household/meta/kitchenAskDow.set", refs.length===2&&refs.some(r=>/household\/jobs\/"\+id\)\.update/.test(r))&&refs.some(r=>/household\/meta\/kitchenAskDow"\)\.set/.test(r)), refs);
  ok("every write is behind _hhWrite()", (KA.match(/if\(_hhWrite\(\)\) db\.ref\(/g)||[]).length===2);
  ok("never a whole-node set of jobs / meta / tasks / checked / mastery", !/db\.ref\("household\/(jobs|meta)?"?\)\.set|ref\("(tasks|checked|mastery)/.test(KA));
  ok("Mom-only: the question, the day chips, Save and the tick all check momHere()", /function _ktAskMom\(\)\{ return typeof momHere==="function"&&momHere\(\); \}/.test(KA)&&(KA.match(/_ktAskMom\(\)/g)||[]).length>=6);
  ok("the block doesn't use the 🔀 emoji", !/🔀/.test(KA)&&!/🔀/.test(src));
}

console.log("9. Wiring: shown in the bedding question's three places; the owned blocks are untouched");
{ ok("Mom's + Dad's 🏡 My day strip: ktAskHTML() beside the laundry (its caller, outside LAUNDRYLINE; LL_MYDAY 2026-10-21 put the line there)", /llMyDayLaundryHTML\(P\.dad\?'dad':'mom'\)[^\n]*\n\s*\+\(\(typeof ktAskHTML==="function"\)\?ktAskHTML\(\):""\)/.test(src));
  ok("Dad's Day: ktAskHTML() still drawn after his bills (its caller, outside LAUNDRYLINE); the line card itself moved up into his My day (LL_MYDAY)", /mdCardBills\(iso\)\+'<\/div>'; \}catch\(e\)\{\}\n(\s*h\+=_ss\([^\n]*\n)?\s*try\{ if\(typeof ktAskHTML==="function"\)\{ const _ka=ktAskHTML\(\); if\(_ka\) h\+=/.test(src)   /* STICKYSTACK (2026-10-22): each of his cards sits in its own 10px 12px box, a section marker between */&&!/h\+=llDadCardHTML\(\)/.test(src));
  ok("Kitchen tab: the chip row sits above the tab's body in renderHousehold; hhKitchenHTML's call is as it was", /\(hhView==='kitchen'&&typeof ktAskSettingHTML==="function"\)\?ktAskSettingHTML\(\):''\)\+body/.test(src)&&/\(hhView==='kitchen'&&typeof hhKitchenHTML==="function"\)\?hhKitchenHTML\(\):hhReviewHTML\(\);/.test(src));
  ok("mcToggle itself is not edited (test_dads_day_my_day guards it byte-for-byte); the block wraps it", fn("mcToggle").indexOf("ktAsk")<0&&/const _ktAskMc=mcToggle; mcToggle=function\(id\)/.test(KA));
  ok("KITCHEN_TAB, LAUNDRYLINE (incl. WET_ASK / BED_ASK) mention nothing of KITCHEN_ASK — not edited", !/ktAsk|KITCHEN_ASK/.test(KT)&&!/ktAsk|KITCHEN_ASK/.test(LL));
  ok("the new block sits right after KITCHEN_TAB_END", src.indexOf("// KITCHEN_TAB_END\n// KITCHEN_ASK_START")>0);
}

console.log("10. Link (b): the dish-towels extra rides the Friday Towels load (documented in the PR, never written by this feature)");
{ const OBJ={label:"Dish + hand towels",emoji:"🧺",every:1,unit:"w",last:"2026-10-16",order:6,rideWith:"towels"};   // = laundryLine/extras/x_dish_towels
  const ls={}, ctx={console,Object,Array,String,Number,parseInt,Math,JSON,Date,
    HA_LS:{getItem:k=>ls[k]||null,setItem:(k,v)=>{ ls[k]=v; }}, document:{getElementById:()=>null}, db:{ref:()=>({update(){},set(){},remove(){}})},
    _lbWrite:()=>true, momHere:()=>true, _kioskD:()=>false, laundryData:{}, calendarData:{holidays:{},vacations:{},kidOverrides:{}}, calNormDate:s=>s,
    ROSTER:["lincoln","ellis","lucy","julian"], KID_NAME:{lincoln:"Lincoln",ellis:"Ellis",lucy:"Lucy",julian:"Julian"}, cap:s=>s.charAt(0).toUpperCase()+s.slice(1),
    _hhIsoLocal:ms=>iso(new Date(ms)), esc:s=>String(s==null?"":s), hhRender:()=>{}, mwToast:()=>{}};
  vm.createContext(ctx); vm.runInContext(LL,ctx); vm.runInContext("llToday=function(){ return '2026-10-21'; }; llNowMin=function(){ return 600; };",ctx);
  const line={caps:{"0":3,"1":1,"2":2,"3":1,"4":3,"5":1,"6":0},asOf:"2026-10-21",homeFrom:"2026-10-19",
    items:{lincoln:{label:"Lincoln's clothes",order:0,home:0},towels:{label:"Towels",order:1,home:4}},
    extras:{x_dish_towels:OBJ}};
  vm.runInContext("laundryLine="+JSON.stringify(line)+";",ctx);
  const R=vm.runInContext("llProject('2026-10-21',16,false)",ctx), fri=R.filter(d=>d.iso==="2026-10-23"||d.iso==="2026-10-30"), other=R.filter(d=>d.loads.indexOf("towels")<0);
  ok("Fri 10/23 and Fri 10/30 (every week): the Towels load is 'Towels + Dish + hand towels'", fri.length===2&&fri.every(d=>d.loads.indexOf("towels")>=0&&d.lbl.towels==="Towels + Dish + hand towels"), fri.map(d=>[d.iso,d.loads,d.lbl]));
  ok("it never takes a slot of its own (no x_dish_towels load on any day)", R.every(d=>d.loads.indexOf("x_dish_towels")<0));
  ok("the other days carry no dish towels", other.every(d=>JSON.stringify(d.lbl).indexOf("Dish")<0));
}

console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
