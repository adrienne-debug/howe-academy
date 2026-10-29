#!/usr/bin/env node
// ENVSITE — write envirothon/DEMO_site.html: the readable index.html with the Envirothon edition forced on and the demo on, so Adrienne can
// double-click ONE file (file://, no network, no Firebase project) and see every part of the site on sample data.
//   node envirothon/build/make_demo.js            (from the repo root or anywhere)
// What changes against index.html (nothing else): the <script src="family-config.js"> tag becomes an inline config with edition:"envirothon"
// + demo:true (and a one-kid roster that is NOT a Howe kid); the top cache-bust redirect is removed (a file:// page must not reload itself);
// the four vendored Firebase tags point one folder up (they load when the file sits in envirothon/, and the demo never needs them anyway);
// a banner comment names the source commit. The service worker already skips file://. The demo writes nothing: every write is a toast.
// 📝 2026-10-28 (the check-in rules): the station check-ins' questions — ONLY HoweEnvirothon.tests, read from envirothon.js with node, never
// its 1.4 MB of cards — go in as one small inline <script> right after the config, so the demo can take a real check-in and final and the
// file stays self-contained. The demo's cards stay the sample deck its seed puts on the unit record.
// 📚 CPCARDSSEE 2026-10-28 (class platform PR 9): the teacher's 📚 Cards browser shows the WHOLE unit, as the mockup does, so the page also
// carries a browse-only copy of every card (window.HoweUnitsDemo.nc_envirothon — front, back, Key Concept, kind, order, source, core, item,
// info; packed into rows and unpacked on load). Only the browser reads it (cpcsLib, demo only): HoweEnvirothon keeps the questions alone,
// so the demo kid's cards are still the sample deck.
"use strict";
const fs=require("fs"), path=require("path"), cp=require("child_process");
const REPO=path.resolve(__dirname,"..",".."), SRC=path.join(REPO,"index.html"), OUT=path.join(REPO,"envirothon","DEMO_site.html");
// the forms only: {forestry:{label,emoji,pre,post}, …}
function demoTests(){ const lib=require(path.join(REPO,"envirothon.js")); if(!lib||!lib.tests) throw new Error("make_demo: envirothon.js has no tests"); return lib.tests; }
// 📚 CPCARDSSEE: every card, packed: {id, groups:[[Key Concept, concept order]], decks:[{key, kind, cards:[[order, front, back, group#, src, core, item, info, t|f|i]]}]}
function demoBrowse(){ const lib=require(path.join(REPO,"envirothon.js")); if(!lib||!lib.unit||!Array.isArray(lib.unit.decks)) throw new Error("make_demo: envirothon.js has no unit");
  const G=[], gi={}; const g=(name,c)=>{ const k=name+"\u0000"+c; if(gi[k]==null){ gi[k]=G.length; G.push([name,c]); } return gi[k]; };
  return {id:lib.unit.id||"nc_envirothon",groups:G,decks:lib.unit.decks.map(d=>({key:d.key,kind:d.kind||"",cards:(d.cards||[]).map(c=>[c.order,c.name,c.def,g(c.group||"",c.concept==null?"":c.concept),c.src||"",c.core?1:0,c.item||"",c.info||"",c.kind==="term"?"t":c.kind==="id"?"i":"f"])}))}; }
function browseScript(b){ if(!b) return ""; return "<script>\n// DEMO (make_demo.js): a browse-only copy of every card, for the teacher's 📚 Cards (CPCARDSSEE). Nothing else reads it.\n(function(){ var B="+JSON.stringify(b).replace(/</g,"\\u003c").replace(/\u2028/g,"\\u2028").replace(/\u2029/g,"\\u2029")+", K={t:\"term\",f:\"fact\",i:\"id\"};\n"+
  "  window.HoweUnitsDemo=window.HoweUnitsDemo||{}; window.HoweUnitsDemo[B.id]={unit:{id:B.id,decks:B.decks.map(function(d){ return {key:d.key,kind:d.kind,cards:d.cards.map(function(r){ var c={order:r[0],name:r[1],def:r[2],group:B.groups[r[3]][0],concept:B.groups[r[3]][1],src:r[4],core:!!r[5],kind:K[r[8]]}; if(r[6]) c.item=r[6]; if(r[7]) c.info=r[7]; return c; })}; })}};\n})();\n</script>"; }
function testsScript(tests){ return "<script>\n// DEMO (make_demo.js): the station check-ins' questions only (HoweEnvirothon.tests from envirothon.js) — no cards.\nwindow.HoweEnvirothon={ demo:true, tests:"+JSON.stringify(tests).replace(/</g,"\\u003c")+" };\n</script>"; }
// PURE: index.html → the demo page (tests passed in so the node tests build it without writing DEMO_site.html)
function buildDemo(html,commit,tests,browse){
const must=(re,label)=>{ if(!re.test(html)) throw new Error("make_demo: anchor missing — "+label); };
must(/<script src="family-config\.js"><\/script>/,"family-config tag"); must(/<script>\n\/\/ Auto cache bust[\s\S]*?\(function\(\)\{if\(location\.hostname==='localhost'[^\n]*\n<\/script>/,"cache-bust script"); must(/<script src="vendor-firebase-app-v8\.js"><\/script>/,"vendor firebase tags");
const cfg=`<script>
// DEMO config (make_demo.js): the Envirothon edition, demo on, no Firebase project. The roster entry is a placeholder; the demo's own kid comes from the sample class.
window.HA_FAMILY={ familyId:"envirothon-demo", familyName:"Envirothon Demo", edition:"envirothon", demo:true, className:"MS Science 2026-27",
  firebase:{ apiKey:"demo", authDomain:"demo.firebaseapp.com", databaseURL:"https://howe-envirothon-default-rtdb.firebaseio.com", projectId:"howe-envirothon", appId:"demo" },
  roster:[{id:"student", name:"Student", color:"#2d6a4f", badge:"#dcfce7", schoolAge:true}] };
</script>`;
html=html.replace(/<script src="family-config\.js"><\/script>/,()=>cfg+"\n"+testsScript(tests||{})+(browse?"\n"+browseScript(browse):""));   // 📚 CPCARDSSEE: + every card, browse-only
html=html.replace(/<script>\n\/\/ Auto cache bust[\s\S]*?\(function\(\)\{if\(location\.hostname==='localhost'[^\n]*\n<\/script>/,"<script>/* cache-bust redirect removed for the demo file (make_demo.js) */</script>");
html=html.replace(/<script src="(vendor-firebase-[a-z]+-v8\.js)"><\/script>/g,'<script src="../$1"></script>');
html=html.replace(/<title>Howe Academy<\/title>/,"<title>Envirothon · Howe Academy (demo)</title>");
html="<!-- DEMO of the Envirothon site · generated by envirothon/build/make_demo.js from index.html @ "+commit+" · sample data, nothing is saved · © 2026 Howe Academy -->\n"+html;
return html;
}
module.exports={buildDemo,demoTests,testsScript,demoBrowse,browseScript};
if(require.main===module){
  let commit="?"; try{ commit=cp.execSync("git rev-parse --short HEAD",{cwd:REPO,stdio:["ignore","pipe","ignore"]}).toString().trim(); }catch(e){}
  const html=buildDemo(fs.readFileSync(SRC,"utf8"),commit,demoTests(),demoBrowse());
  fs.writeFileSync(OUT,html);
  console.log("wrote "+path.relative(REPO,OUT)+" ("+html.length.toLocaleString()+" bytes, from "+commit+")");
}
