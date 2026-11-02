// ⭐ GR_STAPLEQTY (2026-11-01): staple rows on the Shopping List get − N +. The amount lives on the staple
// (kitchen/staples/{id}/qty, absent = 1), shows as ×N, scales the cart estimate, and 🏁 Trip done puts that many away.
const fs=require("fs"); const src=fs.readFileSync(process.argv[2]||(__dirname+"/index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c)=>{ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n);} };
const fn=name=>{ const a=src.indexOf("function "+name+"("); if(a<0) throw new Error("missing "+name); let i=src.indexOf("{",a), d=0, j=i; for(;j<src.length;j++){ if(src[j]==="{")d++; else if(src[j]==="}"){ d--; if(!d) break; } } return src.slice(a,j+1); };

ok("GR_STAPLEQTY block present once", src.split("// GR_STAPLEQTY_START").length===2&&src.split("// GR_STAPLEQTY_END").length===2);

// ── the rows: grVirtualRows → grGroups → grRowHTML, with real kitOrderList ──
const mk=(opts)=>{
  const env={writes:[],repaints:0,ls:{},mom:opts.mom!==false,pin:0};
  const kitStaples=opts.staples;
  const body="const KIT_CATS=[['breakfast','🥞 Breakfast'],['other','🧻 Other']];"
    +fn("kitOrderList")+fn("grVirtualRows")+fn("grGroups")+fn("grRowHTML")+fn("grVStepperHTML")+fn("grVStep")+fn("grQtyGate")
    +";return {grVirtualRows,grGroups,grRowHTML,grVStepperHTML,grVStep};";
  const F=new Function("kitStaples","kitUsuals","grData","grBig","grQs","grQsSel","grFromDad","GR_SECS","grSecFor","grQtyTxt","grSrcTxt","grIsUnsorted","grStores","grActiveStores","grHomeFor","grShowsAt","esc","grStoreColor","grStoreName","grTagsHTML","grQsChipsHTML","grPriceLineHTML","grPaidMathHTML","grStepperHTML","grPaidBoxHTML","HA_LS","db","grRepaint","momHere","dadAwardOk","kitPinGate","SHOP_LIST_NAME",body);
  const L=F(kitStaples,opts.usuals||{},{items:opts.items||{},vchk:opts.vchk||{},home:{}},!!opts.big,false,{},!!opts.dad,[["dairy","🥛"],["meat","🥩"]],()=>"dairy",it=>it&&it.qty>1?"×"+it.qty:"",()=>"",()=>false,()=>({}),()=>[],()=>[],()=>true,s=>String(s||""),()=>"#000",s=>s,()=>"",()=>"",()=>"",()=>"",()=>"<item-step>",()=>"",
    {setItem:(k,v)=>{env.ls[k]=v;}},{ref:p=>({set:v=>env.writes.push(["set",p,v]),remove:()=>env.writes.push(["remove",p])})},()=>env.repaints++,()=>env.mom,()=>false,(then)=>{env.pin++;},"Shopping List");
  L.env=env; L.staples=kitStaples; return L;
};

let L=mk({staples:{s1:{name:"milk (regular)",state:"out",qty:2},s2:{name:"eggs",state:"low"},s3:{name:"almond milk",state:"have"}}});
const vr=L.grVirtualRows();
ok("out/low staples make rows, have does not", vr.length===2&&vr.every(r=>r.virt==="staple"));
ok("a staple with qty 2 carries qty 2", vr.find(r=>r.sid==="s1").qty===2);
ok("a staple with no qty carries none (= 1)", vr.find(r=>r.sid==="s2").qty===undefined);
const g=L.grGroups("all"), rows=g.dairy;
const milk=rows.find(r=>r.name==="milk (regular)"), eggs=rows.find(r=>r.name==="eggs");
ok("grGroups shows ×2 on the milk row", milk.q==="×2");
ok("grGroups passes which staple the row is (vst)", milk.vst==="s1"&&eggs.vst==="s2");
const hm=L.grRowHTML(milk,true), he=L.grRowHTML(eggs,true);
ok("milk row draws − 2 +", hm.includes(">2</span>")&&hm.includes("grVStep('s1',-1)")&&hm.includes("grVStep('s1',1)"));
ok("eggs row draws − 1 + with − greyed", he.includes(">1</span>")&&/disabled style="[^"]*opacity:\.35/.test(he));
ok("staple rows still have no ✕ and no ✎-item stepper", !hm.includes("✕</button>")&&!hm.includes("<item-step>"));
ok("the circle is still there", hm.includes('aria-label="Put in the cart"'));
// in the cart → no stepper, the ×2 stays visible
L=mk({staples:{s1:{name:"milk (regular)",state:"out",qty:2}},vchk:{st_s1:true}});
const gd=L.grGroups("all").dairy[0]; const hd=L.grRowHTML(gd,true);
ok("ticked staple row: no stepper, ×2 shown", !hd.includes("grVStep(")&&hd.includes("×2"));
// a 🔁 usual row keeps its old look (no stepper)
L=mk({staples:{},usuals:{u1:{name:"bananas",cat:"breakfast",qty:3}}});
const gu=L.grGroups("all").dairy[0]; const hu=L.grRowHTML(gu,true);
ok("usual row unchanged: ×3 text, no stepper", gu.vst===""&&!hu.includes("grVStep(")&&hu.includes("×3"));
// store mode keeps the stepper (big buttons), like typed items
L=mk({staples:{s1:{name:"milk (regular)",state:"out"}},big:true});
ok("🏃 store mode draws the big stepper", L.grRowHTML(L.grGroups("all").dairy[0],false).includes("width:42px")&&L.grRowHTML(L.grGroups("all").dairy[0],false).includes("grVStep('s1',1)"));

// ── the tap ──
L=mk({staples:{s1:{name:"milk (regular)",state:"out"}}});
L.grVStep("s1",1);
ok("+ : 1 → 2 on the staple", L.staples.s1.qty===2);
ok("+ : written to kitchen/staples/s1/qty", L.env.writes.some(w=>w[0]==="set"&&w[1]==="kitchen/staples/s1/qty"&&w[2]===2));
ok("+ : saved to the device + repainted", !!L.env.ls.ha_kit_staples&&L.env.repaints===1);
L.grVStep("s1",1); ok("+ again : 3", L.staples.s1.qty===3);
L.grVStep("s1",-1); L.grVStep("s1",-1);
ok("− back to 1 drops the field (absent = 1)", L.staples.s1.qty===undefined);
ok("− to 1 removes kitchen/staples/s1/qty", L.env.writes.some(w=>w[0]==="remove"&&w[1]==="kitchen/staples/s1/qty"));
L.grVStep("s1",-1); ok("− below 1 stays 1", L.staples.s1.qty===undefined);
ok("state untouched by the stepper", L.staples.s1.state==="out");
L=mk({staples:{s1:{name:"milk (regular)",state:"out"}},mom:false});
L.grVStep("s1",1);
ok("not Mom/Dad → the amount gate asks, nothing changes", L.env.pin===1&&L.staples.s1.qty===undefined);
L=mk({staples:{s1:{name:"milk (regular)",state:"out"}},mom:false,dad:true});
L.grVStep("s1",1);
ok("Dad's list (grFromDad) may step too", L.staples.s1.qty===2);

// ── what reads the amount downstream (unchanged code, pinned so a later edit can't silently drop it) ──
const done=fn("grDoneRun");
ok("🏁 Trip done puts away the staple row's qty", done.includes("bought(r.name,r.qty,r.sec"));
ok("staple state → have at Trip done still there", done.includes('kitStaples[r.sid].state="have"'));
ok("cart estimate reads ×N off the row", fn("grEstMult").includes("/^×(\\d+)/")&&fn("grPaidMult").includes("/^×(\\d+)/"));
ok("staple cycling saves the whole staple (qty rides along)", fn("kitStapleCycle").includes("db.ref('kitchen/staples/'+id).set(s)"));

console.log("\n"+pass+" passed, "+fail+" failed"); if(fail) process.exit(1);
