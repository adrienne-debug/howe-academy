/*
 * test_fixtures/demo_week_sandbox.js — the harness behind test_demo_week.js (slice E of PLAN_living_schedule_finish_2026-11-08.md).
 * (It lives under test_fixtures so the perf-budget scanner, which reads the app's own root *.js, never counts its setTimeout/setInterval stubs.)
 *
 * Runs the WHOLE app script (the last <script> block of index.html) inside a Node vm sandbox, once per "device":
 *   · a fake DOM that swallows every paint (renderAll / renderAllSoon are patched to return at once — the harness is about
 *     the scheduler, not the screen);
 *   · one in-memory Firebase tree SHARED by every device: ref().on / once / set / update / remove / transaction / push, value
 *     listeners that fire the way the real SDK does (asynchronously, for a path and for every listener above and below it),
 *     multi-path updates that refuse an ancestor-and-child pair like the real server, and a write log that names every
 *     write (op, path, device, whole-node flag);
 *   · one virtual clock and one virtual timer queue (setTimeout / setInterval) shared by the devices, advanced by the test —
 *     so "Monday 9:40" is Monday 9:40 on every device and the relay's 2 s wait, the echo guards and the claim's 2 minutes
 *     all run on the same clock. Intervals are registered but never fire on their own: the test calls dayRollCheck /
 *     mlEveningSweep itself, as the minute tick would.
 * The app code is never edited: the two render patches are string replacements made on the copy loaded here.
 * No kid or family names: the fixture (test_fixtures/living_demo_family.json) is synthetic.
 */
"use strict";
const fs=require("fs"), path=require("path"), vm=require("vm");

// ── the clock and the timers ──────────────────────────────────────────────────────────────────────────────────────────────
function makeClock(startMs){ return {now:startMs}; }
function makeScheduler(clock){
  let seq=0; const timers=new Map(); const intervals=new Map(); const errors=[];
  const sched={
    timers,intervals,errors,
    setTimeout(fn,ms){ const id=++seq; timers.set(id,{id,at:clock.now+Math.max(0,+ms||0),fn}); return id; },
    clearTimeout(id){ timers.delete(id); },
    setInterval(fn,ms){ const id=++seq; intervals.set(id,{id,ms:+ms||0,fn}); return id; },
    clearInterval(id){ intervals.delete(id); },
    next(){ let best=null; for(const t of timers.values()){ if(!best||t.at<best.at||(t.at===best.at&&t.id<best.id)) best=t; } return best; },
    async drain(){ for(let i=0;i<6;i++) await new Promise(r=>setImmediate(r)); },
    // run every timer due up to `until` (virtual ms), in time order, draining promises between; then the clock sits at `until`
    async run(until){
      let guard=0;
      while(guard++<20000){
        const t=sched.next(); if(!t||t.at>until) break;
        timers.delete(t.id); if(t.at>clock.now) clock.now=t.at;
        try{ t.fn(); }catch(e){ errors.push({at:clock.now,err:String(e&&e.stack||e)}); }
        await sched.drain();
      }
      if(until>clock.now) clock.now=until;
      await sched.drain();
    }
  };
  return sched;
}
function makeDateClass(clock,RealDate){
  return class VDate extends RealDate{
    constructor(...a){ if(!a.length) super(clock.now); else super(...a); }
    static now(){ return clock.now; }
  };
}

// ── the fake Firebase ─────────────────────────────────────────────────────────────────────────────────────────────────────
function makeDb(initialTree,clock,sched){
  const tree={root:JSON.parse(JSON.stringify(initialTree||{}))};
  const log=[];            // every write: {op, path, dev, at, whole, keys, n}
  const debug=[];          // dbg() lines pushed to _debug: {dev, at, msg}
  const listeners=[];      // {id, path, cb, dev}
  let lid=0, pushN=0;
  const clone=v=>(v===undefined||v===null)?null:JSON.parse(JSON.stringify(v));
  const split=p=>String(p||"").replace(/^\/+|\/+$/g,"").split("/").filter(Boolean);
  const get=p=>{ let o=tree.root; for(const k of split(p)){ if(o==null||typeof o!=="object") return null; o=o[k]; } return (o===undefined)?null:o; };
  const prune=(o)=>{ if(o&&typeof o==="object"){ Object.keys(o).forEach(k=>{ prune(o[k]); if(o[k]===null||o[k]===undefined||(typeof o[k]==="object"&&!Object.keys(o[k]).length)) delete o[k]; }); } };
  const setAt=(p,v)=>{ const ks=split(p); if(!ks.length){ tree.root=clone(v)||{}; prune(tree.root); return; }
    let o=tree.root; for(let i=0;i<ks.length-1;i++){ if(o[ks[i]]==null||typeof o[ks[i]]!=="object") o[ks[i]]={}; o=o[ks[i]]; }
    if(v===null||v===undefined) delete o[ks[ks.length-1]]; else o[ks[ks.length-1]]=clone(v);
    prune(tree.root); };
  const related=(L,P)=>L===P||L===""||P===""||P.indexOf(L+"/")===0||L.indexOf(P+"/")===0;
  const snap=(p)=>({key:split(p).slice(-1)[0]||null,val:()=>clone(get(p)),exists:()=>get(p)!==null});
  const fire=(paths)=>{ const hit=new Set(); paths.forEach(P=>{ listeners.forEach(l=>{ if(related(l.path,P)) hit.add(l); }); });
    hit.forEach(l=>{ sched.setTimeout(()=>{ if(listeners.indexOf(l)>=0) l.cb(snap(l.path)); },0); }); };
  const wholeNode=p=>/^week\d+\/(tasks|checked|history|claimed)$/.test(p);
  function makeRef(p,dev){
    p=split(p).join("/");
    const r={path:p,key:split(p).slice(-1)[0]||null,
      child(c){ return makeRef(p+"/"+split(c).join("/"),dev); },
      on(ev,cb){ const l={id:++lid,path:p,cb,dev,ev}; listeners.push(l); sched.setTimeout(()=>{ if(listeners.indexOf(l)>=0) cb(p===".info/connected"?{val:()=>true,key:"connected",exists:()=>true}:snap(p)); },0); return cb; },
      off(){ for(let i=listeners.length-1;i>=0;i--) if(listeners[i].path===p&&listeners[i].dev===dev) listeners.splice(i,1); },
      once(ev,cb,err){ const pr=new Promise(res=>{ sched.setTimeout(()=>res(snap(p)),0); }); if(cb) pr.then(s=>cb(s)); return pr; },
      orderByKey(){ return r; }, limitToLast(){ return r; }, orderByChild(){ return r; }, equalTo(){ return r; }, limitToFirst(){ return r; },
      set(v){ log.push({op:"set",path:p,dev,at:clock.now,whole:wholeNode(p),n:(v&&typeof v==="object")?Object.keys(v).length:1}); setAt(p,v); fire([p]); return Promise.resolve(); },
      update(o){ o=o||{}; const keys=Object.keys(o);
        // the real server refuses a path that is an ancestor of another in the same update
        const rel=keys.map(k=>split(k).join("/")).sort();
        for(let i=0;i<rel.length-1;i++){ if(rel[i+1].indexOf(rel[i]+"/")===0) throw new Error("Firebase update refused: path "+rel[i]+" is an ancestor of "+rel[i+1]); }
        log.push({op:"update",path:p,dev,at:clock.now,whole:false,keys:keys.slice(),n:keys.length});
        const touched=[]; keys.forEach(k=>{ const full=(p?p+"/":"")+split(k).join("/"); setAt(full,o[k]); touched.push(full); }); fire(touched); return Promise.resolve(); },
      remove(){ log.push({op:"remove",path:p,dev,at:clock.now,whole:false,n:1}); setAt(p,null); fire([p]); return Promise.resolve(); },
      transaction(fn,done){ const cur=clone(get(p)); let nv; try{ nv=fn(cur); }catch(e){ if(done) done(e,false,snap(p)); return Promise.reject(e); }
        log.push({op:"tx",path:p,dev,at:clock.now,whole:false,committed:nv!==undefined,n:1});
        if(nv===undefined){ if(done) done(null,false,snap(p)); return Promise.resolve({committed:false,snapshot:snap(p)}); }
        setAt(p,nv); fire([p]); if(done) done(null,true,snap(p)); return Promise.resolve({committed:true,snapshot:snap(p)}); },
      push(v){ const key="-P"+String(++pushN).padStart(6,"0"); const cr=makeRef(p+"/"+key,dev);
        if(v!==undefined){ if(p==="_debug"){ debug.push({dev,at:clock.now,msg:v&&v.msg}); } else { log.push({op:"push",path:p,dev,at:clock.now,whole:false,n:1}); setAt(p+"/"+key,v); fire([p+"/"+key]); } }
        cr.then=(f)=>Promise.resolve(cr).then(f); return cr; }
    };
    return r;
  }
  return {
    tree,log,debug,listeners,get,snapOf:snap,clone,
    api(dev){ const api={ref:(p)=>makeRef(p==null?"":p,dev),goOnline(){},goOffline(){}}; return api; },
    // the write log since a marker, summarized
    writesSince(mark){ return log.slice(mark); },
  };
}

// ── the fake DOM ──────────────────────────────────────────────────────────────────────────────────────────────────────────
// a 2d canvas context that draws nothing (the celebration confetti, the paint of a drill card)
function make2d(canvas){ const g={canvas,fillStyle:"",strokeStyle:"",lineWidth:1,font:"",textAlign:"",globalAlpha:1};
  ["clearRect","fillRect","strokeRect","beginPath","closePath","arc","moveTo","lineTo","fill","stroke","save","restore","translate","rotate","scale","fillText","strokeText","drawImage","setTransform","resetTransform","clip","rect","ellipse","quadraticCurveTo","bezierCurveTo","putImageData","setLineDash"].forEach(k=>{ g[k]=function(){}; });
  g.measureText=()=>({width:0}); g.createLinearGradient=()=>({addColorStop(){}}); g.createRadialGradient=()=>({addColorStop(){}}); g.getImageData=()=>({data:new Uint8ClampedArray(4),width:1,height:1}); g.createImageData=()=>({data:new Uint8ClampedArray(4)});
  return g; }
function makeEl(tag,id){
  const el={tagName:String(tag||"DIV").toUpperCase(),id:id||"",className:"",innerHTML:"",textContent:"",innerText:"",value:"",checked:false,disabled:false,hidden:false,
    style:{cssText:"",display:"",setProperty(){},removeProperty(){},getPropertyValue(){ return ""; }},dataset:{},attrs:{},children:[],childNodes:[],parentNode:null,parentElement:null,firstChild:null,lastChild:null,nextSibling:null,previousSibling:null,
    offsetWidth:0,offsetHeight:0,offsetTop:0,offsetLeft:0,clientWidth:0,clientHeight:0,scrollTop:0,scrollLeft:0,scrollHeight:0,scrollWidth:0,selectionStart:0,selectionEnd:0,
    classList:{add(){},remove(){},toggle(){ return false; },contains(){ return false; },replace(){}},
    getBoundingClientRect(){ return {top:0,left:0,right:0,bottom:0,width:0,height:0,x:0,y:0}; },
    appendChild(c){ if(c) c.parentNode=el; return c; },removeChild(c){ return c; },insertBefore(c){ return c; },replaceChild(c){ return c; },replaceChildren(){},prepend(){},append(){},remove(){},
    setAttribute(k,v){ el.attrs[k]=String(v); },getAttribute(k){ return el.attrs[k]===undefined?null:el.attrs[k]; },removeAttribute(k){ delete el.attrs[k]; },hasAttribute(k){ return el.attrs[k]!==undefined; },
    addEventListener(){},removeEventListener(){},dispatchEvent(){ return true; },focus(){},blur(){},click(){},select(){},scrollIntoView(){},scrollTo(){},setSelectionRange(){},
    querySelector(){ return makeEl("div"); },querySelectorAll(){ return []; },getElementsByClassName(){ return []; },getElementsByTagName(){ return []; },closest(){ return null; },contains(){ return false; },matches(){ return false; },
    insertAdjacentHTML(){},insertAdjacentElement(){},cloneNode(){ return makeEl(tag); },getContext(){ return make2d(el); },play(){ return Promise.resolve(); },pause(){},load(){},canPlayType(){ return ""; },
    animate(){ return {cancel(){},finished:Promise.resolve()}; },requestFullscreen(){ return Promise.resolve(); },
    toDataURL(){ return ""; },getClientRects(){ return []; },showModal(){},close(){},reset(){},submit(){}};
  return el;
}
function makeDom(){
  const byId={};
  const body=makeEl("body"), head=makeEl("head"), html=makeEl("html");
  html.outerHTML="<html><head></head><body></body></html>";
  const doc={body,head,documentElement:html,hidden:false,visibilityState:"visible",readyState:"complete",lastModified:"",title:"",cookie:"",referrer:"",
    activeElement:body,fonts:{ready:Promise.resolve(),load(){ return Promise.resolve([]); }},
    getElementById(id){ if(!byId[id]) byId[id]=makeEl("div",id); return byId[id]; },
    createElement(t){ return makeEl(t); },createElementNS(ns,t){ return makeEl(t); },createTextNode(s){ return {textContent:String(s),nodeType:3}; },createDocumentFragment(){ return makeEl("fragment"); },createEvent(){ return {initEvent(){}}; },
    querySelector(){ return makeEl("div"); },querySelectorAll(){ return []; },getElementsByClassName(){ return []; },getElementsByTagName(){ return []; },
    addEventListener(){},removeEventListener(){},dispatchEvent(){ return true; },execCommand(){ return false; },hasFocus(){ return true; },elementFromPoint(){ return null; },
    exitFullscreen(){ return Promise.resolve(); },fullscreenElement:null};
  return doc;
}
function makeStorage(){ const m=new Map(); return {getItem(k){ return m.has(String(k))?m.get(String(k)):null; },setItem(k,v){ m.set(String(k),String(v)); },removeItem(k){ m.delete(String(k)); },clear(){ m.clear(); },key(i){ return Array.from(m.keys())[i]||null; },get length(){ return m.size; },_map:m}; }

// ── the app script, patched for the sandbox (string patches on the copy only) ─────────────────────────────────────────────
let _scriptCache=null;
function appScript(indexPath){
  if(_scriptCache&&_scriptCache.path===indexPath) return _scriptCache.text;
  const src=fs.readFileSync(indexPath,"utf8"); const L=src.split("\n");
  const a=L.lastIndexOf("<script>"), b=L.lastIndexOf("</script>");
  if(a<0||b<a) throw new Error("main script not found in "+indexPath);
  let text=L.slice(a+1,b).join("\n");
  const patch=(from,to,what)=>{ const i=text.indexOf(from); if(i<0) throw new Error("sandbox patch target missing: "+what); text=text.slice(0,i)+to+text.slice(i+from.length); };
  patch("function renderAll(){\n","function renderAll(){\n  if(typeof __HARNESS_NO_RENDER!==\"undefined\"&&__HARNESS_NO_RENDER) return;\n","renderAll");
  patch("function renderAllSoon(){\n","function renderAllSoon(){\n  if(typeof __HARNESS_NO_RENDER!==\"undefined\"&&__HARNESS_NO_RENDER) return;\n","renderAllSoon");
  _scriptCache={path:indexPath,text};
  return text;
}

// ── a device ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
// o = {name, dev (HA_DEV_ID), db, clock, sched, family (window.HA_FAMILY), indexPath, mom:boolean, verbose}
function bootDevice(o){
  const logs=[];
  const say=(lvl)=>(...a)=>{ const s=a.map(x=>{ try{ return typeof x==="string"?x:JSON.stringify(x); }catch(e){ return String(x); } }).join(" "); logs.push(lvl+" "+s); if(o.verbose) process.stdout.write("["+o.name+"] "+s+"\n"); };
  const RealDate=Date;
  const VDate=makeDateClass(o.clock,RealDate);
  const storage=makeStorage(), session=makeStorage();
  try{ storage.setItem("ha_dev_id",o.dev); }catch(e){}
  storage.setItem((o.family&&o.family.familyId&&o.family.familyId!=="howe"?o.family.familyId+":":"")+"ha_dev_id",o.dev);
  const dbApi=o.db.api(o.dev);
  const firebase={apps:[],initializeApp(){ firebase.apps.push({}); return firebase.apps[0]; },database:function(){ return dbApi; },auth:undefined,storage:undefined};
  class Ev{ constructor(t,i){ this.type=t; Object.assign(this,i||{}); } preventDefault(){} stopPropagation(){} }
  class Obs{ constructor(){} observe(){} unobserve(){} disconnect(){} takeRecords(){ return []; } }
  const sandbox={
    __HARNESS_NO_RENDER:true,
    document:makeDom(),navigator:{userAgent:"HarnessNode",onLine:true,language:"en-US",languages:["en-US"],platform:"Node",maxTouchPoints:0,vibrate(){ return false; },clipboard:{writeText(){ return Promise.resolve(); }},mediaDevices:undefined},
    location:{search:"",hostname:"demo.local",pathname:"/demo/",protocol:"https:",href:"https://demo.local/demo/",origin:"https://demo.local",hash:"",reload(){},assign(){},replace(){}},
    history:{replaceState(){},pushState(){},back(){},state:null},
    localStorage:storage,sessionStorage:session,
    setTimeout:o.sched.setTimeout,clearTimeout:o.sched.clearTimeout,setInterval:o.sched.setInterval,clearInterval:o.sched.clearInterval,
    requestAnimationFrame(fn){ return o.sched.setTimeout(fn,16); },cancelAnimationFrame(id){ o.sched.clearTimeout(id); },queueMicrotask:(fn)=>Promise.resolve().then(fn),
    performance:{now(){ return o.clock.now-o.clock.boot; },mark(){},measure(){},getEntriesByType(){ return []; }},
    console:{log:say("log"),warn:say("warn"),error:say("error"),info:say("info"),debug:say("debug"),group(){},groupEnd(){},table(){},time(){},timeEnd(){}},
    alert(){},confirm(){ return true; },prompt(){ return null; },
    matchMedia(){ return {matches:false,media:"",addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}}; },
    getComputedStyle(){ return {getPropertyValue(){ return ""; }}; },scrollTo(){},scroll(){},scrollBy(){},print(){},open(){ return null; },close(){},focus(){},blur(){},
    addEventListener(){},removeEventListener(){},dispatchEvent(){ return true; },
    innerWidth:1024,innerHeight:768,outerWidth:1024,outerHeight:768,devicePixelRatio:1,screen:{width:1024,height:768,availWidth:1024,availHeight:768,orientation:{type:"landscape-primary"}},
    Audio:class{ constructor(){ this.volume=1; } play(){ return Promise.resolve(); } pause(){} load(){} addEventListener(){} },
    Image:class{ constructor(){} },Event:Ev,CustomEvent:Ev,KeyboardEvent:Ev,MouseEvent:Ev,MutationObserver:Obs,ResizeObserver:Obs,IntersectionObserver:Obs,
    URL,URLSearchParams,TextEncoder,TextDecoder,Blob:class{ constructor(){} },File:class{ constructor(){} },FileReader:class{ readAsDataURL(){} readAsText(){} addEventListener(){} },
    fetch(){ return Promise.reject(new Error("no network in the sandbox")); },XMLHttpRequest:class{ open(){} send(){} setRequestHeader(){} addEventListener(){} },
    crypto:require("crypto").webcrypto,structuredClone:(v)=>JSON.parse(JSON.stringify(v)),
    firebase,Date:VDate,
    HA_FAMILY:o.family
  };
  vm.createContext(sandbox);
  sandbox.window=sandbox; sandbox.self=sandbox; sandbox.globalThis=sandbox; sandbox.top=sandbox; sandbox.parent=sandbox;
  const text=appScript(o.indexPath);
  vm.runInContext(text,sandbox,{filename:"index.html(main script)"});
  const dev={
    name:o.name,id:o.dev,ctx:sandbox,logs,
    run(expr){ return vm.runInContext(expr,sandbox); },
    get(name){ return vm.runInContext(name,sandbox); },
    set(name,val){ sandbox.__tmpVal=val; vm.runInContext(name+"=__tmpVal;",sandbox); delete sandbox.__tmpVal; },
    fn(name){ const f=vm.runInContext(name,sandbox); if(typeof f!=="function") throw new Error(name+" is not a function in "+o.name); return f; },
    momOn(){ dev.fn("haMomOn")(); },
    tasks(){ return dev.get("weekData.tasks")||[]; },
  };
  return dev;
}

module.exports={makeClock,makeScheduler,makeDb,makeDom,makeEl,bootDevice,appScript};
