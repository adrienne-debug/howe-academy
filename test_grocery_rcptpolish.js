/* 🧾 Receipt polish (her picks 2026-10-06): extras wording · 🧻 Household · the long not-on-receipt list folds · long receipts in
 * overlapping photos · do the lines add up.  run: node test_grocery_rcptpolish.js */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
const a=src.indexOf("// GROCERY_LIST_START"), b=src.indexOf("// GROCERY_LIST_END");
const fn=name=>{ const i=src.indexOf("function "+name+"("); return src.slice(i,src.indexOf("\n}",i)+2); };
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":"")); } };
const pz=src.match(/const PAN_ZONES=\[[^\n]*\];/)[0], gp=src.match(/const GR_PLACES=\[[^\n]*\];/)[0];
ok("🧻 Household is a place in the house inventory (never goes old)", /\["household","🧻 Household",3650\]/.test(pz));
ok("…and a put-away choice", /\["household","🧻 Household"\]/.test(gp));
ok("photos: up to 6 in all (PDFs count toward the 6 too)", /slice\(0,Math\.max\(0,6-\(\(_grRc&&_grRc\.imgs\)\|\|\[\]\)\.length/.test(src));
ok("the prompt reads several photos as ONE receipt and lists overlapping lines once", /ONE receipt, in order from the top to the bottom/.test(src)&&/List each overlapping line ONCE/.test(src));
function mk(){
  const pantry=[], pop={innerHTML:""}; let asked=null;
  const ctx={console,Math,JSON,Object,Array,String,Number,parseInt,parseFloat,isNaN,Date,RegExp,Set,Map,navigator:{},setTimeout:()=>0,
    db:{ref:()=>({set(){},update(){},remove(){}})}, HA_LS:{getItem:()=>null,setItem(){}}, mwToast:()=>{}, esc:s=>String(s==null?"":s), momHere:()=>true, dadAwardOk:()=>false, kitPinGate:()=>{},
    kitOrderList:()=>({need:[],usuals:{}}), _todayStr:()=>"2026-10-06", kitCapKey:()=>"k", panAdd:(n,z,q,m)=>{ pantry.push([n,z,q,m]); return "p"+pantry.length; },
    kitCapAsk:async(content)=>{ asked=content; return '{"store":"Food Lion","date":"2026-10-06","total":10,"items":[{"line":"MILK","name":"Milk","price":2.49}]}'; },
    kitStaples:{}, kitBuyLog:{}, kitPantry:{}, tab:"moms-plan", renderAll:()=>{},
    document:{getElementById:id=>id==="gr-pop"?pop:null,createElement:()=>pop,body:{appendChild:()=>{}}}};
  vm.createContext(ctx); vm.runInContext(fn("kitSlug"),ctx); vm.runInContext(src.slice(a,b),ctx); ctx.grRepaint=()=>{};
  vm.runInContext(`grData.stores={foodlion:{name:"Food Lion"}}; grData.items={};
    ["Corn","Rice","Eggs","Beans","Bread"].forEach((n,i)=>{ grData.items["c"+i]={name:n,sec:"pantry",stores:["foodlion"],done:true}; });`,ctx);
  return {run:e=>vm.runInContext(e,ctx),pantry,pop,asked:()=>asked};
}
const RC={store:"FOOD LION",date:"2026-10-06",total:20,items:[{line:"BOUNTY",name:"Paper towels",price:8.99},{line:"BALLOONS",name:"Balloons",price:4.99}]};
{ const T=mk(); T.run("_grRc={imgs:[]}; grRcptLoad("+JSON.stringify(RC)+"); grRcptDraw()"); const h=T.pop.innerHTML;
  ok("extras say to pick where each goes (old 'pantry still gets them' wording gone)", /Pick where each one goes — or 🚫 Not for the house/.test(h)&&!/Prices \+ the pantry still get them/.test(h));
  ok("extras offer 🧻 Household", (h.match(/🧻 Household/g)||[]).length>=2);
  ok("paper towels (a household item) default to 🧻 Household", T.run("grRcptXDefault({name:'Paper towels'})")==="household");
  ok("a long not-on-receipt list folds to one line (5 checked off, all counted as bought)", /5 checked off, but not on this receipt<\/b> — all counted as bought ✓/.test(h)&&/>Review</.test(h)&&!/Didn't get it/.test(h));
  T.run("grRcptNo('i:c0','back'); grRcptDraw()"); ok("…the line keeps count of what's going back", /4 counted as bought, 1 going back on the list/.test(T.pop.innerHTML));
  T.run("_grRc.noOpen=true; grRcptDraw()"); ok("Review opens the full list with its buttons", /Checked off, but not on this receipt \(5\)/.test(T.pop.innerHTML)&&/Didn't get it/.test(T.pop.innerHTML));
  ok("the lines-vs-total check shows (13.98 of 20 — well under: a line may be missing or it's tax)", /Lines add up to <b>\$13\.98<\/b> · receipt total <b>\$20\.00<\/b> — well under the total/.test(T.pop.innerHTML));
  T.run("grRcptSave()"); ok("saving puts paper towels in 🧻 Household; balloons (Other) still default to the pantry", T.pantry.some(p=>p[0]==="Paper towels"&&p[1]==="household")&&T.pantry.some(p=>p[0]==="Balloons"&&p[1]==="pantry"));
}
{ const T=mk(); T.run("_grRc={imgs:[]}; grRcptLoad("+JSON.stringify({store:"FOOD LION",total:5,items:[{line:"A",name:"Paper towels",price:8.99}]})+"); grRcptDraw()");
  ok("more than the total → 'a line may have been read twice'", /more than the total: a line may have been read twice/.test(T.pop.innerHTML)); }
(async()=>{
  const T=mk(); T.run("_grRc={imgs:['AAA','BBB','CCC'],busy:false,msg:''}"); await T.run("grRcptRead()");
  const c=T.asked()||[]; const texts=c.filter(x=>x.type==="text").map(x=>x.text), kinds=c.map(x=>x.type).join(",");
  ok("each photo is labelled in order before it (top … bottom)", kinds==="text,image,text,image,text,image,text"&&texts[0]==="Photo 1 of 3 (top of the receipt)"&&texts[1]==="Photo 2 of 3"&&texts[2]==="Photo 3 of 3 (bottom of the receipt)", kinds);
  const T1=mk(); T1.run("_grRc={imgs:['AAA'],busy:false,msg:''}"); await T1.run("grRcptRead()");
  ok("a single photo has no label", (T1.asked()||[]).map(x=>x.type).join(",")==="image,text");
  console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
})();
