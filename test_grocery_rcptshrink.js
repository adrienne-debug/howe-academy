/* 🧾 Receipt review: matched list items drop out of the other lines' choices (her ask 2026-10-06).  run: node test_grocery_rcptshrink.js */
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
run(`grData.stores={walmart:{name:"Walmart"}}; grData.items={a:{name:"Apples",stores:["walmart"],done:true},b:{name:"Bread",stores:["walmart"],done:true},c:{name:"Cereal",stores:["walmart"]},z:{name:"Zucchini",stores:["walmart"],done:true}};
  _grRc={imgs:[]}; grRcptLoad({store:"WALMART",date:"2026-10-06",items:[{line:"APPLES",name:"Apples",price:4.05},{line:"XYZ BRD",name:"Mystery",price:2.5},{line:"QQQ",name:"Something",price:1}]}); grRcptDraw();`);
const sels=()=>pop.innerHTML.split('<select').slice(2).map(s=>(s.match(/<option value="([^"]*)"/g)||[]).map(x=>x.slice(15,-1)));
let S=sels();
ok("line 1 matched to Apples keeps Apples in its own list", S[0].indexOf("i:a")>=0);
ok("Apples is gone from the other lines' lists", S[1].indexOf("i:a")<0&&S[2].indexOf("i:a")<0, S);
run("_grRc.rows[1].match='i:b'; grRcptDraw()"); S=sels();
ok("matching Bread to line 2 removes Bread from line 3's list too — it keeps shrinking", S[2].indexOf("i:b")<0&&S[2].indexOf("i:a")<0&&S[1].indexOf("i:b")>=0, S);
ok("…while every list still offers '➕ not on the list'", S.every(o=>o[0]==="x"));
run("_grRc.rows[1].match='x'; grRcptDraw()"); S=sels(); ok("un-matching puts Bread back in the lists", S[2].indexOf("i:b")>=0);
ok("plain A–Z (her ask: alphabetical order completely)", /<option value="i:b"[^>]*>✓ Bread<\/option><option value="i:c"[^>]*>Cereal<\/option><option value="i:z"[^>]*>✓ Zucchini<\/option>/.test(pop.innerHTML.split('<select')[4]||""), (pop.innerHTML.split('<select')[4]||"").slice(0,400));
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
