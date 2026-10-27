// 🔗 KITLINKHOLD (her report 2026-10-27: "the fill in from on meals i did a link and its taking forever or isnt working period").
//   · the pasted address is held in kitCap.url (oninput) and the box is drawn from it → a repaint of Mom's plan can't empty it
//   · "Read the recipe" reads the box, or the held address when the box is gone
//   · the link read runs under a 90 s clock: past it → KIT_CAP_SLOW_MSG, busy off, button back; in time → clock cleared
//   · 📋 Pasted text / 📸 Photos / GR_RCPTLONG callers pass no timeoutMs → no AbortController, no signal (unchanged)
//   · no database writes anywhere in the touched functions
//   run:  node test_kit_link_hold.js
const fs=require("fs"); const src=fs.readFileSync(__dirname+"/index.html","utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":""));} };
const fn=name=>{ let a=src.indexOf("function "+name+"("); if(a<0) throw new Error("no "+name); if(src.slice(a-6,a)==="async ") a-=6; let i=src.indexOf("{",a), d=0, j=i; for(;j<src.length;j++){ if(src[j]==="{")d++; else if(src[j]==="}"){ d--; if(!d) break; } } return src.slice(a,j+1); };

console.log("\n# block + state");
const a=src.indexOf("// KITLINKHOLD_START"), z=src.indexOf("// KITLINKHOLD_END");
ok("KITLINKHOLD block present", a>0&&z>a);
ok("90 s constant + plain message", /const KIT_CAP_LINK_MS=90000;/.test(src)&&/const KIT_CAP_SLOW_MSG="That took more than 90 seconds/.test(src));
ok("kitCap carries url", /let kitCap=\{mode:null,busy:false,msg:"",photos:\[\],url:""\};/.test(src));
const capHtml=fn("kitCaptureHTML"), ask=fn("kitCapAsk"), run=fn("kitCapRunLink"), text=fn("kitCapRunText");
ok("no database writes in the touched functions", !/db\.ref|firebase\./.test(capHtml+ask+run));
ok("the link box is drawn from kitCap.url and writes back on input", /id="kit-cap-url" type="url" value="'\+esc\(kitCap\.url\|\|""\)\+'" oninput="kitCap\.url=this\.value"/.test(capHtml));
ok("only the link read asks for the clock", /\{timeoutMs:KIT_CAP_LINK_MS\}\)/.test(run)&&!/timeoutMs/.test(text)&&(src.match(/timeoutMs:KIT_CAP_LINK_MS/g)||[]).length===1);

console.log("\n# the box survives a repaint");
{
  const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const mk=new Function("kitCap","esc","kitCapKey","kitCapTrayHTML", capHtml+"; return kitCaptureHTML;");
  const kitCap={mode:"link",busy:false,msg:"",photos:[],url:'https://x.test/r?a=1&b="2"'};
  const h=mk(kitCap,esc,()=>"sk-key",()=>"")();
  ok("the pasted address is in the rebuilt box, escaped", /value="https:\/\/x\.test\/r\?a=1&amp;b=&quot;2&quot;"/.test(h), h.match(/<input id="kit-cap-url"[^>]*>/)&&h.match(/<input id="kit-cap-url"[^>]*>/)[0]);
  kitCap.url=""; ok("an empty hold draws an empty box", /id="kit-cap-url" type="url" value=""/.test(mk(kitCap,esc,()=>"sk-key",()=>"")()));
  kitCap.busy=true; ok("busy → the button is disabled and says Reading the page", /onclick="kitCapRunLink\(\)" disabled[^>]*>⏳ Reading the page…/.test(mk(kitCap,esc,()=>"sk-key",()=>"")()));
}

console.log("\n# Read the recipe: box or held address, 90 s clock, cleared on success");
{
  const calls=[]; let asked=null, stashed=0, renders=0;
  const ctx={kitCap:{mode:"link",busy:false,msg:"",photos:[],url:""},kitEditDraft:{},KIT_CAP_PROMPT:"P",KIT_CAP_LINK_MS:90000,
    document:{getElementById:id=>(id==='kit-cap-url'?ctx._box:id==='content'?{}:null)},_box:null,
    _kitStash:()=>{ stashed++; }, renderMomsPlan:()=>{ renders++; },
    kitCapAsk:async(content,tools,opt)=>{ asked={content,tools,opt}; return ctx._reply(); }, kitCapApply:r=>{ calls.push(r); }};
  const mk=new Function(...Object.keys(ctx), run+"; return kitCapRunLink;");
  const go=()=>mk(...Object.keys(ctx).map(k=>ctx[k]))();
  (async()=>{
    ctx._box={value:"  https://site.test/pie  "}; ctx._reply=async()=>({name:"Pie"});
    await go();
    ok("the box wins when it is there; the clock is passed", asked&&asked.opt&&asked.opt.timeoutMs===90000&&/https:\/\/site\.test\/pie/.test(asked.content[0].text)&&asked.tools[0].type==="web_fetch_20260209", asked&&asked.opt);
    ok("success: draft url set, mode closed, hold cleared, busy off", ctx.kitEditDraft.url==="https://site.test/pie"&&ctx.kitCap.mode===null&&ctx.kitCap.url===""&&ctx.kitCap.busy===false&&calls.length===1);
    asked=null; ctx._box=null; ctx.kitCap.url="https://held.test/soup"; ctx.kitCap.mode="link";
    await go();
    ok("no box (a repaint ate it) → the held address is read", asked&&/https:\/\/held\.test\/soup/.test(asked.content[0].text)&&ctx.kitEditDraft.url==="https://held.test/soup");
    asked=null; ctx._box=null; ctx.kitCap.url="not a link"; const r0=renders;
    await go();
    ok("a bad address → the old message, no ask, repaint", asked===null&&ctx.kitCap.msg==="Paste the whole address, starting with https://"&&renders>r0);
    asked=null; ctx._box={value:"https://slow.test/x"}; ctx._reply=async()=>{ throw new Error("That took more than 90 seconds — …"); };
    await go();
    ok("the clock's error lands in the message, busy off, address kept for a retry", /more than 90 seconds/.test(ctx.kitCap.msg)&&ctx.kitCap.busy===false&&ctx.kitCap.url==="https://slow.test/x");
    await askTests();
  })().catch(e=>{ ok("no exception", false, String(e)); done(); });
}

async function askTests(){
  console.log("\n# kitCapAsk: the clock");
  const timers=[]; let cleared=0;
  const mkAsk=(fetchImpl,hasAbort)=>{
    const ctx={kitCapKey:()=>"sk-key",fetch:fetchImpl,kitCapParse:t=>({parsed:t}),KIT_CAP_SLOW_MSG:"That took more than 90 seconds — …",
      setTimeout:(f,ms)=>{ timers.push({f,ms}); return timers.length; }, clearTimeout:()=>{ cleared++; },
      AbortController:hasAbort?AbortController:undefined};
    return new Function(...Object.keys(ctx), ask+"; return kitCapAsk;")(...Object.keys(ctx).map(k=>ctx[k]));
  };
  const okResp=txt=>({ok:true,json:async()=>({stop_reason:"end_turn",content:[{type:"text",text:txt}]})});
  {
    let gotSignal="unset"; const askF=mkAsk(async(u,o)=>{ gotSignal=o.signal; return okResp('{"a":1}'); },true);
    const r=await askF([{type:"text",text:"hi"}],null,{timeoutMs:90000});
    ok("with timeoutMs: a 90 s timer is set, the fetch carries its signal, the answer parses", timers.length===1&&timers[0].ms===90000&&gotSignal instanceof AbortSignal&&r.parsed==='{"a":1}');
    ok("in time → the timer is cleared", cleared===1);
  }
  {
    timers.length=0; cleared=0; let gotSignal="unset"; const askF=mkAsk(async(u,o)=>{ gotSignal=o.signal; return okResp("x"); },true);
    await askF([{type:"text",text:"hi"}],null,null);
    const r2=await askF([{type:"text",text:"hi"}],null,{raw:true,maxTokens:12000});
    ok("no timeoutMs (paste / photos / receipts) → no timer, no signal, raw text as before", timers.length===0&&gotSignal===undefined&&r2==="x");
  }
  {
    timers.length=0; cleared=0;
    const askF=mkAsk((u,o)=>new Promise((res,rej)=>{ o.signal.addEventListener("abort",()=>{ const e=new Error("aborted"); e.name="AbortError"; rej(e); }); }),true);
    const p=askF([{type:"text",text:"hi"}],[{type:"web_fetch_20260209",name:"web_fetch"}],{timeoutMs:90000});
    ok("the timer is armed while the fetch hangs", timers.length===1);
    timers[0].f();   // 90 s pass
    let msg=null; try{ await p; }catch(e){ msg=e.message; }
    ok("the clock runs out → the plain 90 s message, timer cleared", msg==="That took more than 90 seconds — …"&&cleared===1, msg);
  }
  {
    timers.length=0; cleared=0;
    const askF=mkAsk(async()=>({ok:false,status:529,text:async()=>"overloaded"}),true);
    let msg=null; try{ await askF([{type:"text",text:"hi"}],null,{timeoutMs:90000}); }catch(e){ msg=e.message; }
    ok("a real API error still reads as the API error, not the clock; timer cleared", /^Claude 529/.test(msg)&&cleared===1, msg);
  }
  {
    timers.length=0; const askF=mkAsk(async(u,o)=>okResp("y"),false);
    const r=await askF([{type:"text",text:"hi"}],null,{timeoutMs:90000,raw:true});
    ok("a browser without AbortController: no timer, the read still works", timers.length===0&&r==="y");
  }
  done();
}
function done(){ console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0); }
