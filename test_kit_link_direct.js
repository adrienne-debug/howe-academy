// 🔗 KITLINKDIRECT (her report 2026-10-27: the link read still ran out at 90 s on healthykitchen.com; "make it where it will do it").
//   · a WordPress recipe page is read by the browser itself: /wp-json/wp/v2/posts?slug=… then /wp-json/wp/v2/wprm_recipe/<id>
//   · a WP Recipe Maker card → the capture record straight away (no Claude call, no key); fixture = the real healthykitchen recipe
//   · a WordPress post with another card → its text goes to Claude like 📋 Pasted text (no page fetch)
//   · not WordPress / wp-json off / a stub → Claude's reader exactly as before (web_fetch, 90 s clock)
//   · every wp-json call has its own 15 s clock and never throws; no database writes
//   run:  node test_kit_link_direct.js
const fs=require("fs"); const src=fs.readFileSync(__dirname+"/index.html","utf8");
const FX=JSON.parse(fs.readFileSync(__dirname+"/test_fixtures/wprm_healthykitchen_17935.json","utf8"));
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,300)+")":""));} };
const fn=name=>{ let a=src.indexOf("function "+name+"("); if(a<0) throw new Error("no "+name); if(src.slice(a-6,a)==="async ") a-=6; let i=src.indexOf("{",a), d=0, j=i; for(;j<src.length;j++){ if(src[j]==="{")d++; else if(src[j]==="}"){ d--; if(!d) break; } } return src.slice(a,j+1); };
const URLX="https://healthykitchen.com/pumpkin-pie-chia-pudding-high-protein-gluten-free/?fbclid=IwY2xjawVNA0ZleHRuA2FlbQIxMABwZG9mBWJyaWQRMTRoQ2Y2SHowZk5xWmQ2T0pzcnRjBmFwcF9pZBAyMjIwMzkxNzg4MjAwODkyAAEeAw6GxPvkP1aUzu7_fPoaZbNgYZhQkyY3bcQpbW6bxSexaczwIgrghx6evxg_aem_ytPUCdlkusDbGosF70ENBg";

console.log("\n# block");
const a=src.indexOf("// KITLINKDIRECT_START"), z=src.indexOf("// KITLINKDIRECT_END");
ok("KITLINKDIRECT block present, before kitCapRunLink", a>0&&z>a&&src.indexOf("async function kitCapRunLink(")>z);
const block=src.slice(a,z), run=fn("kitCapRunLink");
ok("no database writes", !/db\.ref|firebase\./.test(block+run));
ok("kitCapRunLink: direct first, then the text path, then Claude's reader with its clock", /const d=await kitLinkDirect\(u\)/.test(run)&&run.indexOf("kitLinkDirect(u)")<run.indexOf("web_fetch_20260209")&&(run.match(/timeoutMs:KIT_CAP_LINK_MS/g)||[]).length===2);
const C=new Function("fetch","setTimeout","clearTimeout","AbortController", block+"; return {kitWpOrigin,kitWpSlug,kitHtmlText,kitWprmRecord,kitFetchJson,kitLinkDirect,KIT_WP_MS};");

console.log("\n# url pieces + text");
{
  const K=C(null,setTimeout,clearTimeout,AbortController);
  ok("origin + slug from her pasted address (fbclid and all)", K.kitWpOrigin(URLX)==="https://healthykitchen.com"&&K.kitWpSlug(URLX)==="pumpkin-pie-chia-pudding-high-protein-gluten-free");
  ok("no trailing slash / encoded slug / junk", K.kitWpSlug("https://a.test/recipes/best-soup")==="best-soup"&&K.kitWpSlug("https://a.test/caf%C3%A9-rolls/")==="café-rolls"&&K.kitWpSlug("not a url")===""&&K.kitWpOrigin("ftp://a.test/x")===""&&K.kitWpSlug("https://a.test/")==="");
  const t=K.kitHtmlText('<h2>Notes</h2><p>Stir&nbsp;well &amp; chill.<br>Serve <b>cold</b> &#8211; it&#8217;s best &#8230;</p><script>x()</script><style>p{}</style><ul><li>one</li><li>two</li></ul>');
  ok("html → text: tags gone, entities decoded, lines kept", t==="Notes\nStir well & chill.\nServe cold – it's best …\none\ntwo", t);
}

console.log("\n# WP Recipe Maker card → the record (real healthykitchen data)");
{
  const K=C(null,setTimeout,clearTimeout,AbortController);
  const r=K.kitWprmRecord(FX.recipe);
  ok("name + yield", r&&r.name==="Pumpkin Pie Chia Pudding"&&r.yield==="1 serving", r&&[r.name,r.yield]);
  ok("15 ingredient lines: 3 group headers + 12 ingredients, amounts as written", r.ingredients.length===15&&r.ingredients[0]==="Pumpkin Chia Pudding:"&&r.ingredients[1]==="2 1/2 tablespoons chia seeds"&&r.ingredients[9]==="Vanilla Yogurt Layer:"&&r.ingredients[13]==="For Topping:", r.ingredients);
  ok("a note rides in parentheses; a unit-only amount and a bare name read naturally", r.ingredients[4]==="1 serving Vanilla Whey Protein Powder (I recommend Promix!)"&&r.ingredients[8]==="Pinch of sea salt"&&r.ingredients[14]==="Sprinkle of pumpkin pie spice or cinnamon", [r.ingredients[4],r.ingredients[8],r.ingredients[14]]);
  ok("6 steps, in order, plain text", r.steps.length===6&&/^Add the chia seeds and hot water/.test(r.steps[0])&&r.steps[5]==="Add an extra sprinkle of pumpkin spice and enjoy!");
  ok("tags and prep left empty for Mom (nothing invented)", Array.isArray(r.tags)&&r.tags.length===0&&Array.isArray(r.prep)&&r.prep.length===0);
  ok("servings with a unit / plural / html in a step / grouped steps", (()=>{ const x=K.kitWprmRecord({name:"Soup",servings:"4",servings_unit:"bowls",ingredients_flat:[{type:"ingredient",amount:"1",unit:"",name:"onion"}],instructions_flat:[{type:"group",name:"Prep"},{type:"instruction",text:"Dice the <strong>onion</strong>&nbsp;finely."}]}); const y=K.kitWprmRecord({name:"Cake",servings:"8",ingredients_flat:[{type:"ingredient",amount:"2",unit:"cups",name:"flour"}],instructions_flat:[]}); return x.yield==="4 bowls"&&x.steps.join("|")==="Prep:|Dice the onion finely."&&y.yield==="8 servings"&&y.steps.length===0; })());
  ok("no recipe → null (nothing to fill)", K.kitWprmRecord(null)===null&&K.kitWprmRecord({})===null&&K.kitWprmRecord({name:"x",ingredients_flat:[],instructions_flat:[]})===null);
}

console.log("\n# kitLinkDirect: the three outcomes, with stubbed fetch");
const resp=(json,ct,okk)=>({ok:okk!==false,headers:{get:h=>h==="content-type"?(ct===undefined?"application/json; charset=UTF-8":ct):null},json:async()=>json});
const postWith=(html)=>[{id:17934,title:{rendered:"Pumpkin Pie Chia Pudding (High Protein &amp; Gluten-Free)"},content:{rendered:html}}];
(async()=>{
  {
    const calls=[]; const K=C(async(u,o)=>{ calls.push(u); if(/wp\/v2\/posts\?slug=pumpkin-pie-chia-pudding-high-protein-gluten-free&_fields=id,title,content$/.test(u)) return resp(postWith('<p>Intro</p>'+FX.post.content_snippet+'<p>…</p>')); if(/wp\/v2\/wprm_recipe\/17935$/.test(u)) return resp({id:17935,recipe:FX.recipe}); return resp(null,"text/html",false); },setTimeout,clearTimeout,AbortController);
    const d=await K.kitLinkDirect(URLX);
    ok("WordPress + WP Recipe Maker → the record from the card, two wp-json calls on the site's origin", d&&d.how==="card"&&d.rec.name==="Pumpkin Pie Chia Pudding"&&d.rec.ingredients.length===15&&calls.length===2&&calls.every(u=>u.startsWith("https://healthykitchen.com/wp-json/")), calls);
  }
  {
    const long='<div class="tasty-recipes"><h2>Granola</h2><ul><li>4 cups oats</li><li>1/2 cup honey</li></ul><ol><li>Mix everything.</li><li>Bake at 325 for 25 minutes, stirring once.</li></ol></div>'+'<p>'+"A long story about the recipe. ".repeat(12)+'</p>';
    const K=C(async(u)=>/posts\?slug=/.test(u)?resp(postWith(long)):resp(null,"text/html",false),setTimeout,clearTimeout,AbortController);
    const d=await K.kitLinkDirect("https://blog.test/granola/");
    ok("WordPress, another recipe card → the post's text, title first, for the paste path", d&&d.how==="post"&&/^Pumpkin Pie Chia Pudding \(High Protein & Gluten-Free\)\n\n/.test(d.text)&&/4 cups oats/.test(d.text)&&!/<li>/.test(d.text), d&&d.text.slice(0,120));
  }
  {
    const K1=C(async()=>resp([]),setTimeout,clearTimeout,AbortController);
    const K2=C(async()=>resp("<html>","text/html"),setTimeout,clearTimeout,AbortController);
    const K3=C(async()=>{ throw new TypeError("Failed to fetch"); },setTimeout,clearTimeout,AbortController);
    const K4=C(async()=>resp(postWith("<p>short</p>")),setTimeout,clearTimeout,AbortController);
    const K5=C(async()=>resp(null,undefined,false),setTimeout,clearTimeout,AbortController);
    const r=[await K1.kitLinkDirect("https://a.test/x/"),await K2.kitLinkDirect("https://a.test/x/"),await K3.kitLinkDirect("https://a.test/x/"),await K4.kitLinkDirect("https://a.test/x/"),await K5.kitLinkDirect("https://a.test/x/"),await K1.kitLinkDirect("https://a.test/")];
    ok("no post / html back / CORS refused / stub post / 404 / no slug → null, never a throw", r.every(x=>x===null), r);
  }
  {
    const timers=[]; let cleared=0; let aborted=false;
    const K=C((u,o)=>new Promise((res,rej)=>{ o.signal.addEventListener("abort",()=>{ aborted=true; const e=new Error("aborted"); e.name="AbortError"; rej(e); }); }),(f,ms)=>{ timers.push({f,ms}); return 1; },()=>{ cleared++; },AbortController);
    const p=K.kitFetchJson("https://a.test/wp-json/x",K.KIT_WP_MS);
    ok("a wp-json call arms a 15 s clock", timers.length===1&&timers[0].ms===15000);
    timers[0].f(); const v=await p;
    ok("a hanging site → aborted, null, clock cleared (the link then goes to Claude's reader)", aborted&&v===null&&cleared===1);
  }
  await runTests();
})().catch(e=>{ ok("no exception", false, String(e)); done(); });

async function runTests(){
  console.log("\n# kitCapRunLink: which path, what message");
  const mk=(direct)=>{
    const st={applied:[],asked:[],renders:0,kitCap:{mode:"link",busy:false,msg:"",photos:[],url:""},kitEditDraft:{}};
    const ctx={kitCap:st.kitCap,kitEditDraft:st.kitEditDraft,KIT_CAP_PROMPT:"PROMPT",KIT_CAP_LINK_MS:90000,
      document:{getElementById:id=>id==='kit-cap-url'?{value:URLX}:id==='content'?{}:null},
      _kitStash:()=>{}, renderMomsPlan:()=>{ st.renders++; }, kitLinkDirect:async()=>direct,
      kitCapAsk:async(content,tools,opt)=>{ st.asked.push({content,tools,opt}); return {name:"From Claude",ingredients:["x"],steps:["y"],yield:"",tags:[],prep:[]}; },
      kitCapApply:r=>{ st.applied.push(r); st.kitCap.msg="✓ Filled in — check every box, then Save. Nothing is saved until you do."; }};
    st.go=()=>new Function(...Object.keys(ctx), run+"; return kitCapRunLink;")(...Object.keys(ctx).map(k=>ctx[k]))();
    return st;
  };
  {
    const K=C(null,setTimeout,clearTimeout,AbortController); const rec=K.kitWprmRecord(FX.recipe);
    const st=mk({rec:rec,how:"card"}); await st.go();
    ok("card: filled from the record, Claude never asked, no key needed, the message says where it came from", st.applied.length===1&&st.applied[0]===rec&&st.asked.length===0&&/recipe card/.test(st.kitCap.msg)&&/check every box, then Save/.test(st.kitCap.msg), st.kitCap.msg);
    ok("card: her link kept on the draft, door closed, hold cleared, busy off", st.kitEditDraft.url===URLX&&st.kitCap.mode===null&&st.kitCap.url===""&&st.kitCap.busy===false);
  }
  {
    const st=mk({text:"Granola\n\n4 cups oats…",how:"post"}); await st.go();
    ok("post text: one Claude ask with no tools, MATERIAL = the post, the 90 s clock; record applied", st.asked.length===1&&st.asked[0].tools===null&&/^PROMPT\n\nMATERIAL:\nGranola/.test(st.asked[0].content[0].text)&&st.asked[0].opt.timeoutMs===90000&&st.applied.length===1&&st.applied[0].name==="From Claude");
  }
  {
    const st=mk(null); await st.go();
    ok("not WordPress: Claude's reader as before — web_fetch, her address in the text, the 90 s clock", st.asked.length===1&&st.asked[0].tools&&st.asked[0].tools[0].type==="web_fetch_20260209"&&st.asked[0].content[0].text.indexOf(URLX)>0&&st.asked[0].opt.timeoutMs===90000&&st.applied.length===1);
  }
  done();
}
function done(){ console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0); }
