/* 🧾 long receipts: a cut-off answer says so, the JSON pull takes the first complete {…}, a bad answer is kept (2026-10-07).
   run: node test_grocery_rcptlong.js */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
const a=src.indexOf("// GROCERY_LIST_START"), b=src.indexOf("// GROCERY_LIST_END");
const fn=name=>{ const i=src.indexOf("function "+name+"("); return src.slice(i,src.indexOf("\n}",i)+2); };
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":"")); } };
const GOOD='{"store":"Food Lion","date":"2026-10-06","total":3,"items":[{"line":"MILK","name":"Milk","price":2.49,"list":"Milk"}]}';
function mk(answer){
  const pop={innerHTML:""}, ls={}; let opt=null;
  const ctx={console,Math,JSON,Object,Array,String,Number,parseInt,parseFloat,isNaN,Date,RegExp,Set,Map,navigator:{},setTimeout,Image:class{},
    db:{ref:()=>({set(){},update(){},remove(){}})}, HA_LS:{getItem:k=>ls[k]==null?null:ls[k],setItem:(k,v)=>{ ls[k]=String(v); }}, mwToast:()=>{}, esc:s=>String(s==null?"":s), momHere:()=>true, dadAwardOk:()=>false, kitPinGate:()=>{},
    kitOrderList:()=>({need:[],usuals:{}}), _todayStr:()=>"2026-10-06", kitCapKey:()=>"k", panAdd:()=>"p1",
    kitCapAsk:async(content,tools,o)=>{ opt=o; return answer; },
    kitStaples:{}, kitBuyLog:{}, kitPantry:{}, tab:"moms-plan", renderAll:()=>{},
    document:{getElementById:id=>id==="gr-pop"?pop:null,createElement:()=>pop,body:{appendChild:()=>{}}}};
  vm.createContext(ctx); vm.runInContext(fn("kitSlug"),ctx); vm.runInContext(src.slice(a,b),ctx); ctx.grRepaint=()=>{};
  vm.runInContext('grData.stores={foodlion:{name:"Food Lion"}}; grData.items={};',ctx);
  return {run:e=>vm.runInContext(e,ctx),pop,ls,opt:()=>opt};
}
async function read(answer){ const T=mk(answer); T.run("_grRc={imgs:[],pdfs:['UERG'],busy:false,msg:''}"); await T.run("grRcptRead()"); return T; }
(async()=>{
  console.log("── the block is marked ──");
  ok("GR_RCPTLONG_START/END wrap the helpers", src.indexOf("// GR_RCPTLONG_START")>0&&src.indexOf("// GR_RCPTLONG_END")>src.indexOf("// GR_RCPTLONG_START"));
  console.log("── first complete {…} ──");
  { const T=mk(GOOD), J=s=>T.run("grRcptJson("+JSON.stringify(s)+")");
    ok("plain object comes back whole", J(GOOD)===GOOD);
    ok("prose before and after is dropped", J("Here you go:\n```json\n"+GOOD+"\n```\nHope that helps {smile}")===GOOD);
    ok("a second object later is NOT swallowed (the old greedy pull took both)", J(GOOD+"\n\nNote: {\"x\":1}")===GOOD);
    ok("braces and quotes inside strings don't count", J('{"line":"BRK {2} \\"BIG\\" }","price":1}')==='{"line":"BRK {2} \\"BIG\\" }","price":1}');
    ok("a cut-off answer (never closes) gives null", J('{"store":"Food Lion","items":[{"line":"MILK","price":2.49},{"line":"EGG')===null);
    ok("no object at all gives null", J("Sorry, I can't read that.")===null&&J("")===null&&T.run("grRcptJson(null)")===null); }
  console.log("── reading ──");
  { const T=await read({text:GOOD,stop:"end_turn"});
    ok("asks for a bigger answer (16000) and the stop reason", T.opt().maxTokens===16000&&T.opt().raw===true&&T.opt().withStop===true, T.opt());
    ok("a good receipt reads through to the review screen", /Bought — on your list|Extras — not on the list/.test(T.pop.innerHTML));
    ok("nothing saved as a bad answer", T.ls.gr_rcpt_last_bad==null); }
  { const T=await read({text:'{"store":"Food Lion","items":[{"line":"MILK","price":2.49},{"line":"EG',stop:"max_tokens"});
    ok("a cut-off answer says so plainly", T.run("_grRc.msg")==="That receipt came back incomplete — try again, or read it in two parts", T.run("_grRc.msg"));
    ok("…no JSON parse error shown", !/JSON|Expected/.test(T.run("_grRc.msg"))&&!/JSON Parse|Expected '\]'/.test(T.pop.innerHTML));
    ok("…and the answer is kept to look at", /"EG/.test(JSON.parse(T.ls.gr_rcpt_last_bad).text)); }
  { const T=await read({text:'{"store":"Food Lion","items":[{"line":"MILK" "price":2.49}]}',stop:"end_turn"});
    ok("an answer that won't parse shows a plain message", T.run("_grRc.msg")==="Claude's answer for that receipt didn't come out readable — try again", T.run("_grRc.msg"));
    const bad=JSON.parse(T.ls.gr_rcpt_last_bad);
    ok("…and saves the raw answer under gr_rcpt_last_bad", /"MILK" "price"/.test(bad.text)&&typeof bad.at==="string"); }
  { const T=mk({text:"nope",stop:"end_turn"}); T.run("_grRc={imgs:[],pdfs:['UERG'],busy:false,msg:''}"); await T.run("grRcptRead()");
    const first=T.ls.gr_rcpt_last_bad; T.run("_grRc={imgs:[],pdfs:['UERG'],busy:false,msg:''}"); await T.run("grRcptRead()");
    ok("no receipt at all keeps the old message", T.run("_grRc.msg")==="Claude didn't send back a receipt — try a clearer photo");
    ok("only the last bad answer is kept (one key, overwritten)", Object.keys(T.ls).filter(k=>/gr_rcpt/.test(k)).length===1&&!!first); }
  { const T=await read(GOOD);
    ok("a plain-string answer still reads (older callers / tests)", /Bought — on your list|Extras — not on the list/.test(T.pop.innerHTML)); }
  console.log("── kitCapAsk ──");
  { const body=fn("kitCapAsk");
    ok("raw + withStop returns {text, stop} from stop_reason", /opt\.raw&&opt\.withStop\) return \{text:txt,stop:\(data&&data\.stop_reason\)\|\|null\}/.test(body));
    ok("plain raw callers still get a string", /return \(opt&&opt\.raw\)\?txt:kitCapParse\(txt\);/.test(body)); }
  console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
})();
