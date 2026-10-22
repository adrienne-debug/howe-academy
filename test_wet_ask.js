/*
 * 💦 WET_ASK (her plan 2026-10-19: "did you have to do comforter? … we know that we've already done it 2 days ago … if the king size was
 * done 2 days before its actual time, then it could get pushed back"; her picks: sheets skip only within 3 days). After 💦 Sheets (king):
 * what got wet? — sheets (a dated credit: that bed's Monday skipped within 3 days; the queen that rode it goes alone), blanket / pillows /
 * shams (washed today, their schedules restart).  run: node test_wet_ask.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,400)+")":"")); } };
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("missing "+a); return src.slice(i,j); };
const LL=cut("// LAUNDRYLINE_START","// LAUNDRYLINE_END");
const iso=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
function mk(day){ const writes=[], ls={}, els={};
  const ctx={console,Object,Array,String,Number,parseInt,Math,JSON,Date,
    HA_LS:{getItem:k=>ls[k]||null,setItem:(k,v)=>{ ls[k]=v; }}, document:{getElementById:id=>els[id]||null}, els,
    db:{ref:p=>({update:v=>writes.push(["update",p,JSON.parse(JSON.stringify(v))]),set:v=>writes.push(["set",p,v]),remove:()=>writes.push(["rm",p])})},
    _lbWrite:()=>true, momHere:()=>true, _kioskD:()=>false, laundryData:{}, calendarData:{holidays:{},vacations:{},kidOverrides:{}}, calNormDate:s=>s,
    ROSTER:["lincoln","ellis","lucy","julian"], KID_NAME:{lincoln:"Lincoln",ellis:"Ellis",lucy:"Lucy",julian:"Julian"}, cap:s=>s.charAt(0).toUpperCase()+s.slice(1),
    _hhIsoLocal:ms=>iso(new Date(ms)), esc:s=>String(s==null?"":s), hhRender:()=>{}, mwToast:()=>{}, writes};
  vm.createContext(ctx); vm.runInContext(LL,ctx);
  vm.runInContext("llToday=function(){ return '"+day+"'; }; llNowMin=function(){ return 600; };",ctx);
  const line={caps:{"0":3,"1":1,"2":2,"3":1,"4":3,"5":1,"6":0},asOf:day,homeFrom:"2026-10-19",
    items:{sheets:{label:"King sheets + pad panels",order:1,home:0},queen_sheets:{label:"Queen sheets",order:2,home:0,with:"sheets",splitBlanket:true}},
    extras:{x_king_blanket:{label:"King blanket",every:2,unit:"w",last:"2026-10-19",rideWith:"sheets"},x_queen_blankets:{label:"Queen blankets",every:2,unit:"w",last:"2026-10-19",rideWith:"queen_sheets"},
      x_king_pillows:{label:"King pillows",every:4,unit:"m",last:"2026-08-01",est:true},x_king_shams:{label:"King shams",every:4,unit:"w",last:"2026-10-22"},x_queen_shams:{label:"Queen shams",every:4,unit:"w",last:"2026-10-19",est:true}}};
  vm.runInContext("laundryLine="+JSON.stringify(line)+";",ctx); ctx.get=e=>vm.runInContext(e,ctx); return ctx; }
const tick=(c,ids)=>ids.forEach(k=>{ c.els["lwa-"+k]={checked:true}; });

console.log("1. Which bed, and its items");
{ const c=mk("2026-10-24");
  ok("💦 'Sheets (king)' → the King sheets load; 'Sheets (queen)' → Queen sheets", c.llBedHostFor({label:"Sheets (king)"})==="sheets"&&c.llBedHostFor({label:"Sheets (queen)"})==="queen_sheets");
  ok("the king's items: its blanket, pillows, shams (not the queen's)", c.llBedExtras("sheets").join()==="x_king_blanket,x_king_pillows,x_king_shams", c.llBedExtras("sheets"));
  c.llWetOpen("sheets","wt1"); const h=c.llWetAskHTML("mom");
  ok("Sat 10/24: '💦 King bed — what got wet?' — sheets ticked, 'its Mon wash will be skipped'; shams 'washed 2 days ago'", /💦 King bed — what got wet\?/.test(h)&&/id="lwa-sheets" checked/.test(h)&&/its Mon wash will be skipped/.test(h)&&/King shams<\/span><span[^>]*>washed 2 days ago/.test(h), h);
}
console.log("2. Sat 10/24 — sheets + blanket got wet");
{ const c=mk("2026-10-24"); c.llWetOpen("sheets","wt1"); tick(c,["sheets","x_king_blanket"]); c.els["lwa-x_king_pillows"]={checked:false}; c.llWetSave("mom");
  const u=c.writes[0][2]; ok("written: the king sheets as an accident wash today (on the wet load), the blanket washed today", u["log/2026-10-24/sheets"].early===true&&u["log/2026-10-24/sheets"].load==="wt1"&&u["extras/x_king_blanket/last"]==="2026-10-24"&&!("extras/x_king_pillows/last" in u), u);
  const R=c.llProject("2026-10-24",10,false), mon=R[2], mon2=R[9];
  ok("Mon 10/26 (2 days later): no King sheets — the Queen sheets go on their own", mon.iso==="2026-10-26"&&mon.loads.indexOf("sheets")<0&&mon.loads.indexOf("queen_sheets")>=0, mon.loads);
  ok("Mon 11/2: the king's back; the king blanket isn't due (washed 10/24 → 11/7) but the queen's is → two loads, king just sheets", mon2.loads.join()==="sheets,queen_sheets"&&mon2.lbl.sheets==="King sheets + pad panels"&&mon2.lbl.queen_sheets==="Queen sheets + Queen blankets", [mon2.loads,mon2.lbl]);
  ok("the question is gone after Save", c.llWetAskHTML("mom")==="");
}
console.log("3. An accident earlier in the week — Monday still happens");
{ const c=mk("2026-10-21"); c.llWetOpen("sheets","wt2"); tick(c,["sheets"]); c.llWetSave("mom");
  const R=c.llProject("2026-10-21",6,false); ok("Wed 10/21 (5 days before): Mon 10/26 still has the King sheets (+ queen riding)", R[5].iso==="2026-10-26"&&R[5].loads.indexOf("sheets")>=0&&R[5].lbl.sheets==="King sheets + pad panels + Queen sheets", [R[5].loads,R[5].lbl]);
}
console.log("4. Skip, and nothing ticked");
{ const c=mk("2026-10-24"); c.llWetOpen("sheets","wt1"); c.llWetSkip(); ok("Skip: no writes, the question closes", c.writes.length===0&&c.llWetAskHTML("mom")==="");
  const n=mk("2026-10-24"); n.llWetOpen("sheets","wt1"); n.els["lwa-sheets"]={checked:false}; n.llWetSave("mom"); ok("Save with nothing ticked: nothing written", n.writes.length===0);
}
console.log("5. Wiring");
ok("a 💦 quick button opens its bed's question", /const bh=llBedHostFor\(q\); if\(bh\) llWetOpen\(bh,lid\);/.test(src));
ok("it shows on Mom's / Dad's My day and Dad's card", /const top=llWetAskHTML\(by\)/.test(src)&&/llWetAskHTML\(by\)\+llBedAskHTML\(\)\+llCoverAskHTML\(\)/.test(src));   // LL_MYDAY: the card is drawn as either parent now
console.log("6. 🛏 The Monday question (step 2)");
{ const c=mk("2026-11-09"); c.get("laundryLine.extras.x_king_shams.last='2026-10-12'; laundryLine.extras.x_king_pillows.last='2026-11-07'; delete laundryLine.extras.x_king_pillows.est;");
  c.llStart("sheets"); const h=c.llBedAskHTML();
  ok("🫧 Start King sheets on Mon 11/9 → '🛏 King bed — washing anything else today?': shams due now (highlighted), pillows washed 2 days ago; no blanket row", /🛏 King bed — washing anything else today\?/.test(h)&&/King shams<\/span><span[^>]*><b[^>]*>due now — do it today\?/.test(h)&&/King pillows<\/span><span[^>]*>washed 2 days ago/.test(h)&&!/lba-x_king_blanket/.test(h), h);
  c.els["lba-x_king_shams"]={checked:true}; c.writes.length=0; c.llBedAskSave();
  ok("Save with shams ticked: King shams washed today (only that)", JSON.stringify(c.writes[0][2])==='{"extras/x_king_shams/last":"2026-11-09"}', c.writes);
  ok("…and the question closes", c.llBedAskHTML()==="");
  const q=mk("2026-11-09"); q.llStart("sheets"); q.llBedAskSkip(); ok("Just the sheets: nothing written beyond the load", !q.writes.some(w=>w[2]&&Object.keys(w[2]).some(k=>/^extras\/x_king_(shams|pillows)/.test(k))));
}
ok("no 🔀", src.indexOf("🔀")<0);
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
