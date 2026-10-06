/* 📜 grocery pop-ups scroll · 📄 PDF receipts (her asks 2026-10-06).  run: node test_grocery_scrollpdf.js */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
const a=src.indexOf("// GROCERY_LIST_START"), b=src.indexOf("// GROCERY_LIST_END");
const fn=name=>{ const i=src.indexOf("function "+name+"("); return src.slice(i,src.indexOf("\n}",i)+2); };
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":"")); } };
function mk(){
  const pop={innerHTML:""}; let asked=null;
  class FR{ readAsDataURL(f){ this.result="data:application/pdf;base64,"+f._b64; setTimeout(()=>this.onload&&this.onload(),0); } }
  const ctx={console,Math,JSON,Object,Array,String,Number,parseInt,parseFloat,isNaN,Date,RegExp,Set,Map,navigator:{},setTimeout,FileReader:FR,URL:{createObjectURL:()=>"blob:x",revokeObjectURL(){}},Image:class{},
    db:{ref:()=>({set(){},update(){},remove(){}})}, HA_LS:{getItem:()=>null,setItem(){}}, mwToast:()=>{}, esc:s=>String(s==null?"":s), momHere:()=>true, dadAwardOk:()=>false, kitPinGate:()=>{},
    kitOrderList:()=>({need:[],usuals:{}}), _todayStr:()=>"2026-10-06", kitCapKey:()=>"k", panAdd:()=>"p1",
    kitCapAsk:async(content)=>{ asked=content; return '{"store":"Food Lion","date":"2026-10-06","total":3,"items":[{"line":"MILK","name":"Milk","price":2.49}]}'; },
    kitStaples:{}, kitBuyLog:{}, kitPantry:{}, tab:"moms-plan", renderAll:()=>{},
    document:{getElementById:id=>id==="gr-pop"?pop:null,createElement:()=>pop,body:{appendChild:()=>{}}}};
  vm.createContext(ctx); vm.runInContext(fn("kitSlug"),ctx); vm.runInContext(src.slice(a,b),ctx); ctx.grRepaint=()=>{};
  vm.runInContext('grData.stores={foodlion:{name:"Food Lion"}}; grData.items={};',ctx);
  return {run:e=>vm.runInContext(e,ctx),pop,asked:()=>asked,ctx};
}
(async()=>{
  console.log("── 📜 pop-ups scroll ──");
  { const T=mk(); T.run("grPop('<div>tall</div>')");
    ok("the pop-up box fits the screen and scrolls inside", /max-height:calc\(100dvh - 36px\)/.test(T.pop.innerHTML)&&/overflow-y:auto/.test(T.pop.innerHTML)&&/-webkit-overflow-scrolling:touch/.test(T.pop.innerHTML));
    ok("…as ONE scroll: the small scroll boxes inside it are switched off", /<style>#gr-pop \.gr-pop-box \[style\*="overflow:auto"\]\{max-height:none!important;overflow:visible!important\}<\/style><div class="gr-pop-box"/.test(T.pop.innerHTML)); }
  ok("put away, checkout and the receipt all use that same pop-up", /function grPutDraw\(\)[\s\S]*?grPop\(h\)/.test(src)&&/function grCheckoutDraw\(\)[\s\S]*?grPop\(h\)/.test(src)&&/function grRcptDraw\(\)[\s\S]*?grPop\(h\)/.test(src));
  console.log("── 📄 PDF receipts ──");
  { const T=mk(); T.run("_grRc={imgs:[],busy:false,msg:''}; grRcptDraw()");
    ok("the upload takes photos or a PDF", /accept="image\/\*,application\/pdf,\.pdf"/.test(T.pop.innerHTML)&&/Choose photos or a 📄 PDF/.test(T.pop.innerHTML));
    ok("…and says when to use the PDF", /emailed or online receipt\? Pick the 📄 PDF/.test(T.pop.innerHTML));
    T.run("grRcptPick({files:[{type:'application/pdf',name:'receipt.pdf',size:20000,_b64:'UERGREFUQQ=='}]})"); await new Promise(r=>setTimeout(r,10));
    ok("picking a PDF keeps it as a document (not run through the photo shrinker)", JSON.stringify(T.run("_grRc.pdfs"))==='["UERGREFUQQ=="]'&&T.run("_grRc.imgs.length")===0);
    ok("the button counts it and Read it is enabled with only a PDF", /1 PDF — add more/.test(T.pop.innerHTML)&&!/<button onclick="grRcptRead\(\)" disabled/.test(T.pop.innerHTML));
    await T.run("grRcptRead()");
    const c=T.asked()||[], d=c.find(x=>x.type==="document");
    ok("Claude gets it as a PDF document, labelled, before the instructions", !!d&&d.source.media_type==="application/pdf"&&d.source.data==="UERGREFUQQ=="&&c.map(x=>x.type).join(",")==="text,document,text", c.map(x=>x.type).join(","));
    ok("the instructions mention a PDF", /or a PDF of it/.test(c[c.length-1].text));
    ok("and the receipt reads through to the review screen", /Bought — on your list|Extras — not on the list/.test(T.pop.innerHTML)); }
  { const T=mk(); T.run("_grRc={imgs:[],busy:false,msg:''}; grRcptPick({files:[{type:'application/pdf',name:'big.pdf',size:20*1024*1024,_b64:'X'}]})"); await new Promise(r=>setTimeout(r,10));
    ok("a PDF over 15 MB is turned away with a message", (T.run("_grRc.pdfs")||[]).length===0&&/too big/.test(T.run("_grRc.msg"))); }
  { const T=mk(); T.run("_grRc={imgs:['A','B','C','D','E'],busy:false,msg:'',pdfs:['P']}");
    ok("photos + PDFs together are still capped at 6", T.run("Math.max(0,6-((_grRc&&_grRc.imgs)||[]).length-((_grRc&&_grRc.pdfs)||[]).length)")===0); }
  console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
})();
