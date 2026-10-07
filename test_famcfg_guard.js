// FAMCFG_GUARD — a family's site never boots as the Howe family when family-config.js fails to load (2026-10-06).
const fs=require("fs"), path=require("path");
const dir=process.argv[2]||__dirname;
const html=fs.readFileSync(path.join(dir,"index.html"),"utf8"), sw=fs.readFileSync(path.join(dir,"sw.js"),"utf8");
let pass=0,fail=0; const ok=(n,c,x)=>{ if(c){pass++;console.log("  ✓ "+n);} else {fail++;console.log("  ✗ "+n+(x!==undefined?"  → "+JSON.stringify(x):""));} };
const m=html.match(/\/\/ FAMCFG_GUARD_START[\s\S]*?\/\/ FAMCFG_GUARD_END/); ok("guard block present",!!m);
const guardSrc=m[0];
function run(pathname,fam){
  const appended=[], listeners={}, intervals=[];
  const doc={ getElementById:id=>appended.find(e=>e.id===id)||null, createElement:()=>({style:{},id:"",innerHTML:""}),
    body:{appendChild:e=>appended.push(e)}, documentElement:{appendChild:e=>appended.push(e)}, addEventListener:()=>{} };
  const win={ HA_FAMILY:fam, location:{pathname, reload(){ win._reloads=(win._reloads||0)+1; }}, addEventListener:(e,f)=>{listeners[e]=f;} };
  new Function("window","document","location","navigator","setInterval",guardSrc)(win,doc,win.location,{onLine:true},(f,ms)=>intervals.push(ms));
  return {win,appended,listeners,intervals};
}
console.log("family sites without their config");
for(const p of ["/howe-academy-dewalt/","/howe-academy-dewalt/index.html","/howe-academy-burris/","/index.html","/"]){
  const r=run(p,undefined);
  ok(p+" → blocked (HA_NO_FAMILY + Loading screen)",r.win.HA_NO_FAMILY===true&&r.appended.length===1&&/Loading your family/.test(r.appended[0].innerHTML));
  ok(p+" → retries when back online and every 20 s",typeof r.listeners.online==="function"&&r.intervals[0]===20000);
}
console.log("Howe's own site keeps the built-in defaults");
for(const p of ["/howe-academy","/howe-academy/","/howe-academy/index.html"]){ const r=run(p,undefined); ok(p+" → not blocked",!r.win.HA_NO_FAMILY&&r.appended.length===0); }
console.log("config loaded → nothing changes");
for(const p of ["/howe-academy-dewalt/","/howe-academy/"]){ const r=run(p,{familyId:"x"}); ok(p+" with config → not blocked",!r.win.HA_NO_FAMILY&&r.appended.length===0); }
console.log("no boot without a family");
ok("guard runs right after the family-config.js tag",/<script src="family-config\.js"><\/script>\n<script>\n\/\/ FAMCFG_GUARD_START/.test(html));
ok("guard runs before FB_CFG picks a database",html.indexOf("FAMCFG_GUARD_START")<html.indexOf("const FB_CFG"));
ok("initFb never connects without a family (right after the sign-in line)",/function initFb\(\) \{\n  if\(!_haAuthOk\)\{ haAuthGate\(\); return; \}[^\n]*\n  if\(window\.HA_NO_FAMILY\) return;/.test(html));
ok("haAuthGate never runs without a family",/function haAuthGate\(\)\{\n  if\(window\.HA_NO_FAMILY\) return;/.test(html));
console.log("service worker keeps an offline copy of family-config.js");
(async()=>{
  function mkSW(netOk){
    const store={}; let handler=null; const responded=[];
    const caches={ open:async()=>({ put:(k,v)=>{store[k]=v;}, match:async k=>store[k] }), keys:async()=>[], delete:async()=>{} };
    const self={ addEventListener:(t,f)=>{ if(t==="fetch") handler=f; }, skipWaiting(){}, clients:{claim:async()=>{}} };
    const fetchFn=async()=>{ if(!sw.netOk) throw new Error("offline"); return {ok:true,body:"CFG",clone(){return {ok:true,body:"CFG(copy)"};}}; };
    const sw={netOk};
    new Function("self","caches","fetch","URL","Response",fs.readFileSync(path.join(dir,"sw.js"),"utf8"))(self,caches,fetchFn,URL,{error:()=>"ERR"});
    const go=async(url,extra)=>{ let p=null; handler({request:Object.assign({url,method:"GET",mode:"no-cors",destination:"script"},extra||{}),respondWith:x=>{p=x;}}); return p?await p:"(browser)"; };
    return {sw,store,go};
  }
  const s=mkSW(true);
  const r1=await s.go("https://x.github.io/howe-academy-dewalt/family-config.js");
  ok("online: config comes fresh from the network",r1&&r1.body==="CFG",r1);
  ok("online: an offline copy is kept",!!s.store["ha-family-config-fallback"]);
  s.sw.netOk=false;
  const r2=await s.go("https://x.github.io/howe-academy-dewalt/family-config.js?v=1");
  ok("offline: the kept copy is served",r2&&r2.body==="CFG(copy)",r2);
  const r3=await s.go("https://x.github.io/howe-academy-dewalt/notebooks.js");
  ok("other scripts still pass straight through (no caching)",r3==="(browser)",r3);
  const s2=mkSW(false);
  const r4=await s2.go("https://x.github.io/howe-academy-dewalt/family-config.js");
  ok("offline with no copy yet: a network error (→ the Loading screen), never a Howe config",r4==="ERR",r4);
  console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
})();
