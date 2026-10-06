/* ✏️ Fix a misread price on the receipt review (her yes 2026-10-06).  run: node test_grocery_rcptfix.js */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
const a=src.indexOf("// GROCERY_LIST_START"), b=src.indexOf("// GROCERY_LIST_END");
const fn=name=>{ const i=src.indexOf("function "+name+"("); return src.slice(i,src.indexOf("\n}",i)+2); };
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":"")); } };
const pop={innerHTML:""};
const ctx={console,Math,JSON,Object,Array,String,Number,parseInt,parseFloat,isNaN,Date,RegExp,Set,Map,navigator:{},setTimeout:()=>0,
  db:{ref:()=>({set(){},update(){},remove(){}})}, HA_LS:{getItem:()=>null,setItem(){}}, mwToast:()=>{}, esc:s=>String(s==null?"":s), momHere:()=>true, dadAwardOk:()=>false, kitPinGate:()=>{},
  kitOrderList:()=>({need:[],usuals:{}}), _todayStr:()=>"2026-10-06", panAdd:()=>"p1", kitStaples:{}, kitBuyLog:{}, kitPantry:{}, tab:"moms-plan", renderAll:()=>{},
  document:{getElementById:id=>id==="gr-pop"?pop:null,createElement:()=>pop,body:{appendChild:()=>{}}}};
vm.createContext(ctx); vm.runInContext(fn("kitSlug"),ctx); vm.runInContext(src.slice(a,b),ctx); ctx.grRepaint=()=>{};
const run=e=>vm.runInContext(e,ctx);
run(`grData.stores={walmart:{name:"Walmart"}}; grData.items={ap:{name:"Apples",qty:3,unit:"lb",stores:["walmart"],done:true,sec:"produce"}};
  _grRc={imgs:[]}; grRcptLoad({store:"WALMART",date:"2026-10-06",total:4.05,items:[{line:"APPLES 3.00 LB @ 1.35",name:"Apples",price:1.35,regular:null,sale:false},{line:"OREO",name:"Oreos",price:3.48,regular:3.98,sale:true}]}); grRcptDraw();`);
ok("each receipt price is a box she can type in", (pop.innerHTML.match(/aria-label="Price on the receipt"/g)||[]).length===2&&/value="1\.35"/.test(pop.innerHTML));
ok("the review says how", /A price that doesn't match the paper\? Tap it and type what the receipt says/.test(pop.innerHTML));
run("grRcptPrice(0,'4.05')");
ok("typing the paper's 4.05 replaces Claude's misread 1.35", run("_grRc.rows[0].price")===4.05&&run("_grRc.rows[0].fixed")===true&&/value="4\.05"/.test(pop.innerHTML));
run("grRcptPrice(1,'3.98')"); ok("fixing a sale line up to its regular price drops the 'sale'", run("_grRc.rows[1].sale")===false&&run("_grRc.rows[1].reg")===null);
run("grRcptPrice(0,'abc')"); ok("nonsense keeps the last price", run("_grRc.rows[0].price")===4.05);
run("grRcptSave()"); ok("Save records HER fixed price", run("grPriceHist('Apples','walmart')").some(r=>r.p===4.05&&r.src==="receipt"));
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
