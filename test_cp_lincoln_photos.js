/*
 * Node tests — 🖼 CPLINCOLNPHOTOS, the class's photos in the family app (2026-11-17). Her words: "lets do photos added on th eclass site".
 * Plan D of PLAN_cp_lincoln_parity_2026-10-29.md: Lincoln, mirrored into his class from Howe, sees the pictures a classmate on the class
 * site sees — repo ← unit ← class — on the study card, in ID Flash, in the games (envPicsFor) and in the 🧩 skills (cpPhotos).
 *   · where the block sits, its hook lines (all typeof-guarded), TWO reads, no write
 *   · whose layer: one class for the whole family unit, or none — never another class's
 *   · the pictures: the teacher's ⭐ main first, a hidden one gone, the unit's free ones in, an unpictured item gains ID Flash; the unit
 *     record's pictures are laid again IN MEMORY (a picture Mom chose stays)
 *   · refused / empty reads, every other kid and family, the class site: the repo set, exactly as before
 *   · ID Flash credit: what he already earned stays; a class photo is one more picture toward "three different"
 *   · a photo that will not load is left out for the visit (the next one shows); the repo set and Mom's pictures are never touched
 *   · ZERO writes, with and without ?dryrun=1
 * Uses the world from test_env_site.js as Howe with the class link + the real ENVIDFLASH block and the real card hydration.
 *                                                                                                   run: node test_cp_lincoln_photos.js
 */
const fs=require("fs"), path=require("path");
const {world,src,REPO}=require("./test_env_site.js");
let pass=0, fail=0;
const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  "+JSON.stringify(x).slice(0,700):"")); } };
const cut=(a,b)=>{ const i=src.indexOf(a); if(i<0) throw new Error("missing "+a); const j=src.indexOf(b,i); return src.slice(i,j+b.length); };
function fn(name){ const i=src.indexOf("\nfunction "+name+"("); if(i<0) throw new Error("missing "+name);
  let d=0; for(let k=src.indexOf("{",i);k<src.length;k++){ if(src[k]==="{") d++; else if(src[k]==="}"){ d--; if(!d) return src.slice(i+1,k+1); } } }
const raw=fs.readFileSync(path.join(__dirname,"index.html"),"utf8"), CJS=fs.readFileSync(path.join(__dirname,"classes.js"),"utf8"), EJS=fs.readFileSync(path.join(__dirname,"env.js"),"utf8");
const LP=cut("// CPLINCOLNPHOTOS_START","// CPLINCOLNPHOTOS_END"), LK=cut("// CPLINCOLNSKILLS_START","// CPLINCOLNSKILLS_END"), LN=cut("// CPLINCOLN_START","// CPLINCOLN_END");
const PHO=cut("// CPPHOTOS_START","// CPPHOTOS_END")+"\n"+cut("// CPPHOTOUP_START","// CPPHOTOUP_END"), SKL=cut("// CPSKILL_START","// CPSKILL_END"), FLASH=cut("// ENVIDFLASH_START","// ENVIDFLASH_END");
const LIB=require(path.join(REPO,"envirothon.js"));
const PICS=JSON.parse(fs.readFileSync(path.join(REPO,"envirothon","pics","index.json"),"utf8"));
const T="🖼 CPLINCOLNPHOTOS", K="lincoln", CIDX="c1";
const AQ="Aquatic Ecology · ID", SO="Soils and Land Use · ID", FT="Forestry · Terms";
const MAY="Mayfly nymph · gills", BH="B horizon · color", FOR="Forest";
const J=x=>JSON.stringify(x);

console.log("── the block, where it sits, how it is hooked ──");
{ ok("one CPLINCOLNPHOTOS block in classes.js, right after CPLINCOLNSKILLS_END; none in index.html", CJS.indexOf("// CPLINCOLNSKILLS_END\n// CPLINCOLNPHOTOS_START")>0&&CJS.split("// CPLINCOLNPHOTOS_START").length===2&&raw.indexOf("// CPLINCOLNPHOTOS_START")<0);
  ok("its marker in index.html right after CPLINCOLNSKILLS's", raw.indexOf("// ⇢ classes.js: CPLINCOLNSKILLS\n// ⇢ classes.js: CPLINCOLNPHOTOS\n")>0);
  ok("the header has her words, the date, the plan, the reads, whose layer, and that nothing is written", /2026-11-17/.test(LP.slice(0,200))&&/lets do photos added on th eclass site/.test(LP)&&/Plan D of\n?\/\/ PLAN_cp_lincoln_parity_2026-10-29\.md/.test(LP)&&/THE READS/.test(LP)&&/WHOSE LAYER/.test(LP)&&/writes NOTHING/.test(LP));
  ok("the block only declares (nothing runs at load)", LP.split("\n").every(l=>!l.trim()||/^(\/\/|function |const | |})/.test(l)));
  const code=LP.split("\n").filter(l=>!/^\s*\/\//.test(l)).map(l=>l.replace(/   \/\/ .*$/,"")).join("\n");
  ok("it writes nothing: no set / update / remove / transaction / push, no db, no envsWrite, no storage", !/\.(set|update|remove|transaction|push)\(|\bdb\b|envsWrite\(|envcWrite\(|bankDirect\(|HA_LS|localStorage|sessionStorage/.test(code));
  ok("its only reads are TWO once(\"value\") through the mirror's app: classPhotos/<cid> and units/<unit>/photos; no listener on the database", (code.match(/\.once\(/g)||[]).length===2&&(code.match(/\.ref\(/g)||[]).length===2&&/edb\.ref\("classPhotos\/"\+cid\)\.once\("value"/.test(code)&&/edb\.ref\("units\/"\+unit\+"\/photos"\)\.once\("value"/.test(code)&&!/\.on\(/.test(code)&&!/firebase/.test(code));
  ok("no Howe kid name as a code literal; no 🔀", !/["'`](lincoln|ellis|lucy|julian)["'`]/i.test(LP)&&LP.indexOf("\u{1F500}")<0);
  const hooks=(raw+"\n"+EJS).split("\n").filter(l=>/\bcplp\w+\(/.test(l)&&!/^\s*\/\//.test(l));
  ok("ONE hook line outside classes.js (envmRelAttach), typeof-guarded and tagged "+T, hooks.length===1&&/if\(typeof cplpLoad==="function"\) cplpLoad\(kid,cid,_envm\.edb\);/.test(hooks[0])&&hooks[0].indexOf(T)>=0&&/cplpLoad\(kid,cid,_envm\.edb\)/.test(fn("envmRelAttach")), hooks.map(l=>l.trim().slice(0,90)));
  const inCls=CJS.replace(LP,"").split("\n").filter(l=>/\bcplp\w+\(/.test(l)&&!/^\s*\/\//.test(l));
  ok("inside classes.js five typeof-guarded lines ask this block: cpphClassL, cpphUnitL, cpphPicsFor, cpphRecPhoto, and cplnLoad's ready line", inCls.length===5&&inCls.every(l=>(l.match(/cplp\w+(?=\()/g)||[]).every(f=>new RegExp("typeof "+f+"===\"function\"").test(l)))&&/cplpLayer/.test(fn("cpphClassL"))&&/cplpLayer/.test(fn("cpphUnitL"))&&/cplpLayer/.test(fn("cpphPicsFor"))&&/cplpBad/.test(fn("cpphRecPhoto"))&&/cplpReady\(kid\)/.test(fn("cplnLoad")), inCls.map(l=>l.trim().slice(0,70)));
  ok("…four of them tagged "+T+" (cplnLoad's sits beside CPLINCOLNPARITY's own ready line)", inCls.filter(l=>l.indexOf(T)>=0).length===4);
  const names=(LP.match(/^(?:function|const) (\w+)/gm)||[]).map(x=>x.split(" ")[1]), rest=src.replace(LP,"");
  ok("none of its top-level names is declared anywhere else (one global scope)", names.length===11&&names.every(n=>!new RegExp("(function|const|let|var)\\s+"+n+"\\b").test(rest)), names);
  ok("the service worker leaves pictures to the browser (only the page, family-config.js and the lazy files are handled)", /if \(!isDoc\) return;/.test(fs.readFileSync(path.join(__dirname,"sw.js"),"utf8"))&&!/Content-Security-Policy/i.test(raw));
  ok("a layer photo is only ever an https Commons / Storage address or a repo file — never text a save could pick up as a picture to move", /function cpphUrlOk\(u\)\{ return CPPH_WIKI_RE\.test\(String\(u\|\|""\)\)\|\|CPPH_REPO_RE\.test/.test(src)&&/\^data:image\\\//.test(fn("picMoveScan"))); }

// ── the world: Howe with the class link + CPLINCOLN, CPLINCOLNSKILLS, CPPHOTOS, CPSKILL, this block, the REAL ENVIDFLASH block (envPicsFor,
//    envPicsApply, ID Flash) and the REAL card hydration over the real cards (envirothon.js) and the real picture index
const FAM={familyId:"howe",roster:[],envirothon:{firebase:{databaseURL:"https://howe-envirothon.example"},classId:CIDX}};
const XS="\nvar kcPlay=null;\nG.lp={ _cplp, _cpln, _cpph, cplpLayer, cplpLoad, cplpReady, cplpBad, cplpNext, cplpFlashFix, cplpRelay, cplpImgErr, cplkLoad, cplkAny, cplnLoad, cpPhotos, cpphClassL, cpphUnitL, cpphKey, cpphRepoId, envPicsFor, envPicsApply, envPicCycle, envHydrateAll, envFlashDecks, envFlashOpen, envFlashAnswer, envFlashNextCard, envFlashQuit:(typeof envFlashQuit===\"function\"?envFlashQuit:null), envFlashFluent, envFlashNext, envFlashCount, envFlashPicFor, envmRelAttach, ENV_DECKS, ENV_UNIT_ID, setPics(v){ _envPicsIdx=v; }, get flash(){ return envFlash; }, set flash(v){ envFlash=v; } };";
const XS0=XS.replace("_cplp, ","").replace("cplpLayer, cplpLoad, cplpReady, cplpBad, cplpNext, cplpFlashFix, cplpRelay, cplpImgErr, ","");
const BASE=[LN,LK,PHO,SKL,FLASH,fn("envCardsInCode"),fn("envHydrate"),fn("envHydrateAll")];
const REV=BASE.concat([LP,XS]).join("\n"), REV0=BASE.concat([XS0]).join("\n");   // REV0 = the control: the same world without this block
const WIKI="https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/", STORE="https://firebasestorage.googleapis.com/v0/b/howe-envirothon.firebasestorage.app/o/classPhotos%2Fc1%2F";
function layers(w){ const k=w.m.cpphKey, rid=w.m.cpphRepoId;
  const C={}, U={};
  C[k("Mayfly nymph")]={ t1:{url:WIKI+"Mayfly_class.jpg/600px-Mayfly_class.jpg",credit:"Ms. B · CC BY 4.0",lic:"ccby",tags:{live:true},item:"Mayfly nymph",how:"wiki",by:"t",ts:20},
    t2:{url:STORE+"mayfly%2Ft2.jpg?alt=media&token=abc",credit:"Ms. B",lic:"class",tags:{specimen:true},item:"Mayfly nymph",how:"up",by:"t",ts:10},
    _main:"t1", _hide:{[rid("envirothon/pics/aquatic_id/mayfly_nymph/2.jpg")]:true}, _ok:{t1:true} };
  C[k("B horizon")]={ b1:{url:WIKI+"B_horizon.jpg/600px-B_horizon.jpg",credit:"Ms. B · CC0",lic:"cc0",tags:{diagram:true},item:"B horizon",how:"wiki",by:"t",ts:5} };
  C[k("Forest")]={ f1:{url:WIKI+"Forest_class.jpg/600px-Forest_class.jpg",credit:"Ms. B · CC BY-SA 4.0",lic:"ccbysa",tags:{live:true},item:"Forest",how:"wiki",by:"t",ts:5} };
  U[k("Stonefly nymph")]={ u1:{url:WIKI+"Stonefly_unit.jpg/600px-Stonefly_unit.jpg",credit:"A · CC0",lic:"cc0",tags:{live:true},item:"Stonefly nymph",how:"wiki",by:"a",ts:3},
    u2:{url:WIKI+"Stonefly_notfree.jpg/600px-Stonefly_notfree.jpg",credit:"someone",lic:"unknown",tags:{live:true},item:"Stonefly nymph",how:"wiki",by:"a",ts:4} };
  return {C,U}; }
function W(o){ o=o||{};
  const w=world(Object.assign({fam:JSON.parse(JSON.stringify(o.fam||FAM)),lib:LIB,rev:o.noBlock?REV0:REV,unitStudies:{},masteryData:{},dry:!!o.dry,unitsReady:true},o.w||{}));
  const m=w.G.lp; w.m=m; m.setPics(o.pics===false?null:PICS);
  const en={}; (o.enrolled||[K]).forEach(k=>{ en[k]=true; });
  w.unitStudies[m.ENV_UNIT_ID]={id:m.ENV_UNIT_ID,starter:m.ENV_UNIT_ID,cardsInCode:true,decks:m.ENV_DECKS.map(d=>({key:d[0],mode:d[1],stage:d[2],station:d[3],kind:d[4],n:d[5]})),enrolled:en,visuals:o.visuals?JSON.parse(J(o.visuals)):undefined};
  if(!o.visuals) delete w.unitStudies[m.ENV_UNIT_ID].visuals;
  w.U=()=>w.unitStudies[m.ENV_UNIT_ID];
  w.masteryData.lincoln=[]; w.masteryData.lincoln_settings={cat_hold:{}};
  w._envm.app={name:"envirothon"};   // the mirror's named app is already up, as on a running device
  if(o.signedIn!==false) w._envm.user={uid:"u1",email:"mom@x"};
  const cls=o.cls||{lincoln:CIDX}; Object.keys(cls).forEach(k=>{ w._envm.classOf[k]=cls[k]; if(o.link!==false&&(o.linked||Object.keys(cls)).indexOf(k)>=0) m._cpln.kids[k]={cid:cls[k],sid:"howe_"+k,cls:{},plan:{},stu:{},ok:true}; });
  const L=o.layers===undefined?layers(w):o.layers;   // {C,U} | null (nothing added)
  w.E={once:[],on:[],writes:[],held:[]};
  w._envm.edb={ref:p=>({ on(ev,f,bad){ w.E.on.push(p); }, off(){},
    once(ev,f,bad){ w.E.once.push(p); const ans=()=>{ const mC=/^classPhotos\/(.+)$/.exec(p), mU=/^units\/([^/]+)\/photos$/.exec(p);
        if((mC||mU)&&o.refuse){ if(bad) bad(new Error("permission_denied")); return; }
        if(mC){ f({val:()=>(L&&(o.layersBy?o.layersBy[mC[1]]:(mC[1]===CIDX?L.C:null)))||null}); return; } if(mU){ f({val:()=>(L&&L.U)||null}); return; } f({val:()=>null}); };
      if(o.hold&&/^(classPhotos|units)\//.test(p)) w.E.held.push(ans); else ans(); },
    set(v){ w.E.writes.push(["set",p,v]); return Promise.resolve(); }, update(v){ w.E.writes.push(["update",p,v]); return Promise.resolve(); }, remove(){ w.E.writes.push(["remove",p]); return Promise.resolve(); }, transaction(){ w.E.writes.push(["transaction",p]); } })};
  w.initFb();   // db = the family's own instance (every write lands in w.G.writes)
  m.envHydrateAll();   // the real cards and, in memory, their repo pictures — as the app is before any class layer arrives
  if(o.attach!==false&&!o.noBlock) Object.keys(cls).forEach(k=>m.cplpLoad(k,cls[k],w._envm.edb));
  return w; }
const urls=a=>(a||[]).map(p=>p.url), vis=(w,deck,name)=>((w.U().visuals||{})[deck+"_"+name]||{}).imageUrl;
const REPO_MAY=PICS[MAY].map(p=>p.url), slim=a=>(a||[]).map(p=>[p.url,p.credit,p.shot]);
// an ID Flash sitting standing on this item (a sitting is 12 items drawn at random: put the item in if the draw left it out)
function flashOn(w,item){ const m=w.m, f=m.envFlashOpen(K,AQ); let i=f.cards.findIndex(c=>c.item===item);
  if(i<0){ const e=m.envFlashDecks(K).find(d=>d.key===AQ).items.find(x=>x.item===item); f.cards[0]={deck:AQ,item:e.item,key:e.key,names:e.names,pics:e.pics,st:null,at:0,pic:e.pics[0],lures:[]}; i=0; }
  f.i=i; return {f,i}; }

console.log("\n── before any layer: the repo set (what he sees today) ──");
{ const w=W({noBlock:true}), m=w.m;
  ok("the real cards are on the unit record and the repo pictures are laid in memory", w.U().decks.find(d=>d.key===AQ).cards.length===321&&vis(w,AQ,MAY)===REPO_MAY[0]);
  ok("envPicsFor gives the repo pictures, in the repo's order", J(m.envPicsFor(AQ,MAY))===J(PICS[MAY])&&REPO_MAY.length===3);
  ok("a card with no repo picture has none; a Terms card has none", m.envPicsFor(SO,BH)===null&&m.envPicsFor(FT,FOR)===null&&vis(w,SO,BH)===undefined&&vis(w,FT,FOR)===undefined); }

console.log("\n── the reads and whose layer it is ──");
{ const w=W(), m=w.m;
  ok("the world is Howe, not the class site", w.envSiteOn()===false);
  ok("two reads, once each, on the mirror's app: classPhotos/<cid> and units/<unit>/photos", J(w.E.once.filter(p=>/^(classPhotos|units)\//.test(p)))===J(["classPhotos/c1","units/nc_envirothon/photos"])&&w.G.reads.every(p=>!/^(classPhotos|units)\//.test(p)));
  ok("…asking again for the same class reads nothing more", m.cplpLoad(K,CIDX,w._envm.edb)===false&&w.E.once.filter(p=>/^(classPhotos|units)\//.test(p)).length===2);
  ok("the layer is on: his class's and the unit's records as read", !!m.cplpLayer()&&m.cplpLayer().cid===CIDX&&Object.keys(m.cpphClassL()).length===3&&Object.keys(m.cpphUnitL()).length===1);
  ok("envmRelAttach's own line asks for it (the real hook)", (()=>{ const x=W({attach:false}); const b=x.m.cplpLayer(); x.m.envmRelAttach(K); return b===null&&x.E.once.indexOf("classPhotos/c1")>=0&&x.E.once.indexOf("units/nc_envirothon/photos")>=0&&!!x.m.cplpLayer(); })());
  const off=o=>{ const x=W(o); return x.m.cplpLayer()===null&&J(x.m.envPicsFor(AQ,MAY))===J(PICS[MAY])&&x.m.envPicsFor(SO,BH)===null&&vis(x,AQ,MAY)===REPO_MAY[0]&&Object.keys(x.m.cpphClassL()).length===0; };
  ok("the class link not in (his class reads not arrived) → the repo set", off({link:false}));
  ok("signed out of the class link → the repo set", off({signedIn:false}));
  ok("a family with no class link (DeWalt, Burris) → the repo set, and nothing is read", off({fam:{familyId:"dewalt",roster:[]},attach:false})&&W({fam:{familyId:"dewalt",roster:[]},attach:false}).E.once.length===0);
  ok("a second kid in the unit who is NOT in the class → no layer for anyone (the unit record's pictures are shared)", off({enrolled:[K,"ellis"]}));
  ok("two kids in the unit in two DIFFERENT classes → no layer for anyone, never the other class's", off({enrolled:[K,"ellis"],cls:{lincoln:"c1",ellis:"c2"},layersBy:{c1:layers(W({noBlock:true})).C,c2:{}}}));
  ok("two kids in the unit in the SAME class → the layer", (()=>{ const x=W({enrolled:[K,"ellis"],cls:{lincoln:"c1",ellis:"c1"}}); return !!x.m.cplpLayer()&&urls(x.m.envPicsFor(AQ,MAY))[0]===WIKI+"Mayfly_class.jpg/600px-Mayfly_class.jpg"; })());
  { const x=W({fam:{familyId:"envirothon",edition:"envirothon",roster:[]},attach:false}); ok("the class site itself: this block says no and reads nothing (the site kid's layers are CPPHOTOS' own, unchanged)", x.envSiteOn()===true&&x.m.cplpLayer()===null&&x.m.cplpLoad(K,CIDX,x._envm.edb)===false&&x.E.once.length===0&&J(x.m.cpphClassL())==="{}"); }
  { const x=W({fam:{familyId:"envirothon",edition:"envirothon",roster:[]},attach:false}); x.m._cpph.kidC={k1:{a:{url:WIKI+"x.jpg/600px-x.jpg"}}}; x.m._cpph.kidU={u:{k2:{}}};
    ok("…and there cpphClassL / cpphUnitL still read the site kid's own slots", J(x.m.cpphClassL())===J(x.m._cpph.kidC)&&J(Object.keys(x.m.cpphUnitL()))===J(["k2"])); } }

console.log("\n── the pictures he sees with the layer on ──");
{ const w=W(), m=w.m, P=m.envPicsFor(AQ,MAY), u=urls(P);
  ok("an ID card: the teacher's ⭐ main photo first, then the repo ones, then her other photo", u[0]===WIKI+"Mayfly_class.jpg/600px-Mayfly_class.jpg"&&u.indexOf(REPO_MAY[0])===1&&u.indexOf(STORE+"mayfly%2Ft2.jpg?alt=media&token=abc")>0, u);
  ok("…the repo picture she hid for her class is gone; the other two stay", u.indexOf(REPO_MAY[1])<0&&u.indexOf(REPO_MAY[0])>0&&u.indexOf(REPO_MAY[2])>0&&u.length===4);
  ok("…each keeps its credit", P[0].credit==="Ms. B · CC BY 4.0"&&P[1].credit===PICS[MAY][0].credit);
  const S=urls(m.envPicsFor(AQ,"Stonefly nymph · tails"));
  ok("the unit's layer (Adrienne's, every class): its free photo is in, the one with no free licence is dropped", S.indexOf(WIKI+"Stonefly_unit.jpg/600px-Stonefly_unit.jpg")>=0&&S.indexOf(WIKI+"Stonefly_notfree.jpg/600px-Stonefly_notfree.jpg")<0);
  ok("an ID item with no repo picture gets the class's", J(urls(m.envPicsFor(SO,BH)))===J([WIKI+"B_horizon.jpg/600px-B_horizon.jpg"]));
  ok("a Terms card with a class photo gets it; one without stays without", J(urls(m.envPicsFor(FT,FOR)))===J([WIKI+"Forest_class.jpg/600px-Forest_class.jpg"])&&m.envPicsFor(FT,"Tar")===null);
  ok("an item the layers do not mention is the repo set, untouched", J(slim(m.envPicsFor(AQ,"Dragonfly nymph · abdomen")))===J(slim(PICS["Dragonfly nymph · abdomen"])));
  ok("the unit record's pictures were laid again IN MEMORY: the study card and the games draw the class's main photo", vis(w,AQ,MAY)===u[0]&&vis(w,SO,BH)===WIKI+"B_horizon.jpg/600px-B_horizon.jpg"&&vis(w,FT,FOR)===WIKI+"Forest_class.jpg/600px-Forest_class.jpg"&&vis(w,AQ,"Dragonfly nymph · abdomen")===PICS["Dragonfly nymph · abdomen"][0].url);
  ok("…and the page was repainted", w.G.renders>0);
  { const x=W({visuals:{[AQ+"_"+MAY]:{imageUrl:"https://example.org/moms-own.jpg",credit:"Mom"}}}); ok("a picture Mom chose for a card stays (the layer never replaces a saved one)", vis(x,AQ,MAY)==="https://example.org/moms-own.jpg"&&urls(x.m.envPicsFor(AQ,MAY))[0]===u[0]); }
  // ID Flash
  const D=m.envFlashDecks(K), aq=D.find(d=>d.key===AQ), so=D.find(d=>d.key===SO), it=aq.items.find(e=>e.item==="Mayfly nymph"), bh=so.items.find(e=>e.item==="B horizon");
  ok("ID Flash: the item's pictures are the layered ones", J(urls(it.pics))===J(u));
  ok("ID Flash: an item that had no picture now has one and joins (B horizon)", !!bh&&urls(bh.pics).length===1&&!W({noBlock:true}).m.envFlashDecks(K).find(d=>d.key===SO).items.find(e=>e.item==="B horizon"));
  // skills
  m.cplkLoad(K,CIDX,w._envm.edb);
  const CP=m.cpPhotos("Mayfly nymph");
  ok("the 🧩 skills' pool (cpPhotos): the same pictures, main first, the hidden one out", m.cplkAny()===true&&J(urls(CP))===J(u)&&CP[0].from==="class"&&CP[1].from==="repo"); }

console.log("\n── refused or empty: exactly today's pictures ──");
{ const base=W({noBlock:true}), snap=w=>J([w.m.envPicsFor(AQ,MAY),w.m.envPicsFor(SO,BH),w.m.envPicsFor(FT,FOR),w.m.envPicsFor(AQ,"Stonefly nymph · tails"),w.U().visuals,urls((w.m.envFlashDecks(K).find(d=>d.key===AQ).items.find(e=>e.item==="Mayfly nymph")||{}).pics)]), want=snap(base);
  { const x=W({refuse:true}), r0=x.G.renders; ok("both reads refused → the same pictures as without the block, byte for byte; nothing re-laid", snap(x)===want&&J(x.m.cpphClassL())==="{}"&&x.m._cplp.err===false); }
  { const x=W({layers:null}); ok("nothing added on the class site (both layers empty) → the same; no page-wide listener is set", snap(x)===want&&x.m._cplp.err===false); }
  { const x=W({pics:false}); ok("the picture index not in yet → ID cards wait for it as before (no class photo alone on an ID card)", x.m.envPicsFor(AQ,MAY)===null); }
  ok("the block missing (classes.js older / not loaded): every line that asks it is typeof-guarded → the repo set", snap(W({noBlock:true}))===want); }

console.log("\n── the layers and his class link, in either order ──");
{ const w=W({hold:true}), m=w.m;
  ok("reads asked, not answered yet → no layer, the repo set", w.E.held.length===2&&m.cplpLayer()===null&&vis(w,AQ,MAY)===REPO_MAY[0]);
  w.E.held[0](); ok("one of the two answered → still none", m.cplpLayer()===null);
  w.E.held[1](); ok("both answered → the layer, and the unit record's pictures are laid again", !!m.cplpLayer()&&vis(w,AQ,MAY)===WIKI+"Mayfly_class.jpg/600px-Mayfly_class.jpg");
  const x=W({link:false}), mx=x.m;
  ok("the photos answered BEFORE his class reads → nothing yet", mx.cplpLayer()===null&&vis(x,AQ,MAY)===REPO_MAY[0]);
  mx.cplnLoad(K,CIDX,{ref:p=>({once(ev,f){ f({val:()=>({})}); }})},"howe_lincoln");
  ok("…then his class reads arrive (cplnLoad's ready line) → laid again, no reload needed", mx._cpln.kids[K].ok===true&&!!mx.cplpLayer()&&vis(x,AQ,MAY)===WIKI+"Mayfly_class.jpg/600px-Mayfly_class.jpg"); }

console.log("\n── ID Flash credit: nothing he earned is lost ──");
{ const fast=(pic,at,mode)=>({pic,ok:true,secs:3.2,at,mode:mode||"type"});
  const mk=o=>{ const w=W(o); w.masteryData.lincoln_idflash={[AQ]:{
      "Mayfly nymph":{shows:[fast(REPO_MAY[0],1),fast(REPO_MAY[1],2),fast(REPO_MAY[2],3)],fluent:true,at:3},        // earned on the three repo pictures — one of them is now hidden
      "Stonefly nymph":{shows:[fast(PICS["Stonefly nymph · tails"][0].url,1),fast(PICS["Stonefly nymph · tails"][1].url,2)],fluent:false,at:2} }}; return w; };
  const a=mk({noBlock:true}), b=mk(), before=J(b.masteryData.lincoln_idflash);
  const cnt=w=>w.m.envFlashCount(K,w.m.envFlashDecks(K).find(d=>d.key===AQ));
  ok("an item fluent on pictures the teacher has since hidden is still fluent", cnt(a).fluent===1&&cnt(b).fluent===1);
  ok("his saved records are not touched by the layer arriving (same bytes)", J(b.masteryData.lincoln_idflash)===before&&J(a.masteryData.lincoln_idflash)===before);
  ok("the item count only changes by the items that gained their first picture", cnt(b).total===cnt(a).total&&b.m.envFlashDecks(K).find(d=>d.key===SO).items.length===a.m.envFlashDecks(K).find(d=>d.key===SO).items.length+1);
  const st=b.masteryData.lincoln_idflash[AQ]["Stonefly nymph"], card={pics:b.m.envFlashDecks(K).find(d=>d.key===AQ).items.find(e=>e.item==="Stonefly nymph").pics,st};
  const pick=b.m.envFlashPicFor(card,()=>0);
  ok("two fast rights already in: the next show is a picture he has not seen (the unit's new one counts)", st.shows.map(s=>s.pic).indexOf(pick.url)<0);
  ok("…a fast right on the class's photo makes three different pictures → fluent (the same rule as his classmates)", b.m.envFlashNext(st,fast(WIKI+"Stonefly_unit.jpg/600px-Stonefly_unit.jpg",9)).fluent===true);
  // a whole show on a class photo: the saved address is the picture he saw
  const {f,i}=flashOn(b,"Stonefly nymph"); const shown=f.cards[i].pic.url; b.m.envFlashAnswer(true,"Stonefly nymph");
  ok("a show is saved with the address of the picture he saw", f.results.length===1&&f.results[0].pic===shown&&f.results[0].item==="Stonefly nymph");
  ok("nothing was written by any of this (an ID Flash sitting saves at its end, as always)", b.G.writes.length===0&&b.E.writes.length===0); }

console.log("\n── a class photo that will not load ──");
{ const w=W(), m=w.m, MAIN=WIKI+"Mayfly_class.jpg/600px-Mayfly_class.jpg", T2=STORE+"mayfly%2Ft2.jpg?alt=media&token=abc";
  const img=(src,onload)=>{ const o={tagName:"IMG",_src:src,getAttribute(a){ return a==="src"?this._src:(a==="onload"?(onload||""):null); }}; Object.defineProperty(o,"src",{set(v){ this._src=v; o.swapped=v; },get(){ return this._src; }}); return o; };
  ok("the page-wide listener is set once a layer with photos is in", m._cplp.err===true);
  { const r=img(REPO_MAY[0]); m.cplpImgErr({target:r}); ok("a repo picture failing is none of this block's business (nothing marked, nothing swapped)", m.cplpBad(REPO_MAY[0])===false&&r.swapped===undefined&&vis(w,AQ,MAY)===MAIN); }
  { const r=img("https://example.org/moms-own.jpg"); m.cplpImgErr({target:r}); ok("…nor any other picture on the page", r.swapped===undefined&&m._cplp.n===0); }
  { m.cplpImgErr({target:{tagName:"SCRIPT",getAttribute(){ return MAIN; }}}); ok("…nor anything that is not a picture", m.cplpBad(MAIN)===false); }
  const shownImg=img(MAIN), r0=w.G.renders; m.cplpImgErr({target:shownImg});
  ok("the class's main photo fails → it is left out for the visit", m.cplpBad(MAIN)===true&&urls(m.envPicsFor(AQ,MAY)).indexOf(MAIN)<0);
  ok("…the picture on screen becomes the item's next one at once (the first repo picture)", shownImg.swapped===REPO_MAY[0]);
  ok("…the unit record's picture is laid again in memory and the page repaints", vis(w,AQ,MAY)===REPO_MAY[0]&&w.G.renders>r0);
  ok("…ID Flash and the skills no longer pick it", urls(m.envFlashDecks(K).find(d=>d.key===AQ).items.find(e=>e.item==="Mayfly nymph").pics).indexOf(MAIN)<0&&(m.cplkLoad(K,CIDX,w._envm.edb),urls(m.cpPhotos("Mayfly nymph")).indexOf(MAIN)<0));
  ok("…every other class photo is still there", urls(m.envPicsFor(AQ,MAY)).indexOf(T2)>=0&&vis(w,SO,BH)===WIKI+"B_horizon.jpg/600px-B_horizon.jpg");
  { const again=img(MAIN), r1=w.G.renders; m.cplpImgErr({target:again}); ok("the same photo failing again (a page drawn before): swapped, not re-laid twice", again.swapped===REPO_MAY[0]&&m._cplp.n===1&&w.G.renders===r1); }
  { const only=img(WIKI+"B_horizon.jpg/600px-B_horizon.jpg"); m.cplpImgErr({target:only}); ok("an item whose ONLY picture fails: left out, nothing to swap to — the card is as it was before the layer (no picture)", only.swapped===undefined&&m.envPicsFor(SO,BH)===null&&vis(w,SO,BH)===undefined); }
  // ID Flash: a show waiting for its answer on the failed picture
  const x=W(), mx=x.m, {f,i}=flashOn(x,"Mayfly nymph"); f.cards[i].pic=f.cards[i].pics.find(p=>p.url===MAIN); f.drawnAt=5; f.shownAt=null;
  mx.cplpImgErr({target:img(MAIN,"envFlashImgReady()")});
  ok("ID Flash, the show not answered yet: another picture of the same item, its clock from the start", f.cards[i].pic.url!==MAIN&&urls(f.cards[i].pics).indexOf(MAIN)<0&&f.drawnAt===null&&f.shownAt===null&&f.results.length===0);
  mx.envFlashAnswer(true,"Mayfly nymph");
  ok("…and the saved show names the picture he really saw", f.results[0].pic===f.cards[i].pic.url&&f.results[0].pic!==MAIN);
  { const y=W(), my=y.m, fo=flashOn(y,"Mayfly nymph"), g=fo.f, j=fo.i; g.cards[j].pic=g.cards[j].pics.find(p=>p.url===MAIN); my.envFlashAnswer(false,"x"); const was=J(g.results);
    my.cplpImgErr({target:img(MAIN,"envFlashImgReady()")}); ok("ID Flash, already answered: the show stands as it was saved", J(g.results)===was&&g.cards[j].pic.url===MAIN&&my.cplpBad(MAIN)===true); }
  ok("nothing was written by any of it", w.G.writes.length===0&&w.E.writes.length===0&&x.G.writes.length===0&&x.E.writes.length===0); }

console.log("\n── nothing is written, with or without ?dryrun=1 ──");
{ const w=W(), d=W({dry:true});
  ok("live: the layers in, the pictures laid again, the page repainted — ZERO writes to the family's database and to the class's", w.G.writes.length===0&&w.E.writes.length===0);
  ok("?dryrun=1: the same two reads, the same pictures, ZERO writes", d.E.once.filter(p=>/^(classPhotos|units)\//.test(p)).length===2&&urls(d.m.envPicsFor(AQ,MAY))[0]===WIKI+"Mayfly_class.jpg/600px-Mayfly_class.jpg"&&d.G.writes.length===0&&d.E.writes.length===0);
  ok("the family's unit record still has no saved picture of the layer's: memory only (the keys it wrote are the ones a reload rebuilds)", Object.keys(w.U().visuals).length>0&&w.G.writes.length===0);
  const unitWrites=(raw.match(/db\.ref\("unitStudies\/"\+[^)]*\)\.(set|update)\(|db\.ref\("unitStudies"\)\.(set|update)\(/g)||[]).length;
  ok("no code writes a whole unit record or its whole visuals map from memory: a unit is only ever CREATED whole (transaction: cur ? leave : new)", !/db\.ref\("unitStudies"\)\.(set|update)\(/.test(raw)&&(raw.match(/db\.ref\("unitStudies\/"\+\w+(?:\.\w+)?\)\.transaction\(cur=>cur\?undefined:/g)||[]).length>=2&&!/db\.ref\("unitStudies\/"\+\w+(?:\.\w+)?\)\.set\(/.test(raw.replace(/db\.ref\("unitStudies\/"\+\w+(?:\.\w+)?\+"\/[^)]*\)\.set\(/g,"")), unitWrites);
  ok("the two places that save a card's picture write only the keys Mom picked (unitPicsSave, unitEditSave's plan)", /db\.ref\("unitStudies\/"\+unitPics\.unitId\+"\/visuals"\)\.update\(\(typeof haKeys==="function"\?haKeys\(upd\):upd\)\)/.test(raw)&&/db\.ref\("unitStudies\/"\+unitEdit\.unitId\)\.update\(_pw\.up\)/.test(raw)); }

console.log("\n"+pass+" passed, "+fail+" failed");
process.exit(fail?1:0);
