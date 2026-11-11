/*
 * Node tests — 📷 CPPHOTOUP, the third way in ＋ Add photo: "My photo" (camera or file), uploaded to Firebase Storage on the class site's
 * project and landing in the class pool like any other photo (PR 30 of the class platform, named in the CPPHOTOS header; her words
 * 2026-11-10: "yep add the photo").
 *   · the block (after CPPHOTOTODO_END, only declares) and its 7 typeof-guarded hooks in CPPHOTOS, tagged 📷 CPPHOTOUP; the block's only
 *     Firebase calls are Storage (put, getDownloadURL, delete); the record goes through cpphCommit (envsWrite) like the other ways;
 *   · the pure parts: the Storage path (the record's own key and id), the shrink maths (longest side ≤ 1280), the size words, the file
 *     check (not an image, over 12 MB), the licence and credit defaults, how "upload", a Storage address is a usable url;
 *   · Howe and DeWalt: nothing on (no chip, no pick, no save); the site's teacher and Adrienne: the chip;
 *   · the demo: the chip, the pick, the shrink and the preview, Save → "Demo · not saved": 0 writes, 0 uploads, no network;
 *   · live (Storage stubbed): ONE put at classPhotos/<cid>/<itemKey>/<photoId>.jpg as image/jpeg, progress, the download address, then ONE
 *     record write with how "upload"; Undo removes the record and the file; a failed upload writes nothing; the bucket when the config
 *     has none; ?dryrun=1 uploads nothing;
 *   · the rules: the url validate takes this project's Storage address (both bucket names) and nothing new besides; how takes "upload";
 *     STORAGE_RULES.txt: signed-in read, JPEG < 3 MB writes, delete for Undo, nothing else.            run: node test_cp_photoup.js
 */
const fs=require("fs"), path=require("path");
const {world,src,REPO}=require("./test_env_site.js");
let pass=0, fail=0;
const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  "+JSON.stringify(x).slice(0,500):"")); } };
const FAM={familyId:"envirothon",edition:"envirothon",className:"MS Science 2026-27",roster:[]};
const LIB=require(path.join(REPO,"envirothon.js"));
const PICS=JSON.parse(fs.readFileSync(path.join(REPO,"envirothon","pics","index.json"),"utf8"));
const cut=(a,b)=>{ const i=src.indexOf(a); if(i<0) throw new Error("missing "+a); const j=src.indexOf(b,i); return src.slice(i,j+b.length); };
const PHO=cut("// CPPHOTOS_START","// CPPHOTOS_END"), UP=cut("// CPPHOTOUP_START","// CPPHOTOUP_END");
const PICSFOR=(()=>{ const i=src.indexOf("function envPicsFor(deck,name){"); return src.slice(i,src.indexOf("\n",src.indexOf("\n",i)+1)+1); })().replace("const idx=_envPicsIdx;","const idx=(G.pics||null);");
const NAMES="_cpph, cpphOn, cpphKey, cpphUrlOk, cpphRec, cpphCard, cpphAddOpen, cpphAddClose, cpphWay, cpphIn, cpphTag, cpphLic, cpphSave, cpphUndo, cpphMemGet, cpPhotos, "+
  "CPUP_SIDE, CPUP_Q, CPUP_MAX_IN, CPUP_CHECK_URL, cpupOn, cpupUrlOk, cpupPath, cpupFit, cpupKB, cpupFileWhy, cpupCredit, cpupWay, cpupPaneHtml, cpupPick, cpupBucket, cpupSave, cpupDel";
// Storage, the canvas, createImageBitmap and object URLs, stubbed and counted (nothing of a browser is needed)
const STUBS=`
const URL={ createObjectURL(b){ G.objUrls=(G.objUrls||0)+1; return "blob:x/"+G.objUrls; }, revokeObjectURL(u){ G.revoked=(G.revoked||[]).concat([u]); } };
function createImageBitmap(f,o){ G.bitmapOpts=o; if(f&&f.bad) return Promise.reject(new Error("bad")); return Promise.resolve({width:f.w||4032,height:f.h||3024,close(){ G.closed=(G.closed||0)+1; }}); }
function Image(){ G.imgEls=(G.imgEls||0)+1; }
const _ce0=document.createElement; document.createElement=t=>{ if(t!=="canvas") return _ce0(t);
  const cv={width:0,height:0,getContext(){ return {fillRect(){},drawImage(s,x,y,w,h){ G.drawn=[w,h]; },fillStyle:""}; },toBlob(cb,type,q){ G.encoded={type,q,w:cv.width,h:cv.height}; cb({size:G.blobSize||184320,type}); }}; return cv; };
const STORE={ ref(p){ G.refs=(G.refs||[]).concat([p]); return { put(b,m){ G.puts=(G.puts||[]).concat([[p,m&&m.contentType,b.size]]);
    return { on(ev,prog,err,done){ G.progEv=ev; if(G.putFail){ err(new Error("storage/unauthorized")); return; } prog({bytesTransferred:50,totalBytes:100}); G.midMsg=(_cpph.add&&_cpph.add.up)?_cpph.add.up.msg:""; prog({bytesTransferred:100,totalBytes:100}); done(); } }; },
  getDownloadURL(){ G.urls=(G.urls||0)+1; return Promise.resolve("https://firebasestorage.googleapis.com/v0/b/"+(G.bucket||"howe-envirothon.firebasestorage.app")+"/o/"+encodeURIComponent(p)+"?alt=media&token=t0k"); },
  delete(){ G.dels=(G.dels||[]).concat([p]); return Promise.resolve(); } }; } };
const _app0=firebase.app; firebase.app=function(){ const a=_app0(); a.options=G.fbOpts||{projectId:"howe-envirothon"}; a.storage=function(u){ G.bucketUrl=u; return STORE; }; return a; };
firebase.storage=function(){ G.defaultStorage=(G.defaultStorage||0)+1; return STORE; };
function envPicsIndex(){ return G.pics||null; } function envPicsLoad(){ return Promise.reject(new Error("no")); } function envPicsDeckOn(d){ return true; }
function fetch(u){ G.fetched=(G.fetched||0)+1; return Promise.reject(new Error("offline")); } function _unitPicsLookup(f,t,n){ G.looked=(G.looked||[]).concat([t]); return Promise.resolve(null); }
`;
const REV=PHO+"\n"+UP+"\n"+STUBS+PICSFOR+"\nG.cpph={ "+NAMES+" };";
function W(o){ o=o||{}; const w=world(Object.assign({fam:FAM,lib:LIB,rev:REV},o)); w.P=w.G.cpph; w.G.pics=PICS; return w; }
function demo(role){ const w=W({search:"?demo=1&role="+(role||"teacher")}); w.envSiteDemoBoot(); w.renderAll(); return w; }
const openCard=(w,c)=>{ w.envcView("cpcards"); w.ccs.cpcsTap("st",c.sec); if(c.kind==="id"){ w.ccs.cpcsTap("grp",c.sec+"|id"); w.ccs.cpcsTap("sp",c.g.key); } else w.ccs.cpcsTap("grp",c.g.key); w.ccs._cpcs.more[c.g.key]=1e6; w.ccs.cpcsTap("row",c.i); };
const idCard=w=>w.ccs.cpcsIndex().C.find(x=>x.kind==="id"&&x.item);
const JPG={type:"image/jpeg",size:3.2e6,w:4032,h:3024}, inp=f=>({files:[f]});
const ST="https://firebasestorage.googleapis.com/v0/b/howe-envirothon.firebasestorage.app/o/classPhotos%2Fms-science-2026%2Fsassafras%2Fpabc123.jpg?alt=media&token=1f2e";
const ST_OLD=ST.replace("howe-envirothon.firebasestorage.app","howe-envirothon.appspot.com");

const run=async()=>{
console.log("── the block and its hooks ──");
{ const a=src.indexOf("// CPPHOTOUP_START"), b=src.indexOf("// CPPHOTOUP_END"), t=src.indexOf("// CPPHOTOTODO_END");
  ok("one CPPHOTOUP block, right after CPPHOTOTODO_END, with her words and the date", a>0&&b>a&&src.indexOf("// CPPHOTOUP_START",a+1)<0&&src.slice(t,a).trim()==="// CPPHOTOTODO_END"&&/yep add the photo/.test(UP.slice(0,600))&&/2026-11-10/.test(UP.slice(0,600)));
  ok("the block only declares (nothing runs at boot)", UP.split("\n").every(l=>!l.trim()||/^(\/\/|function |const |let |var | |})/.test(l)));
  const hooks=(src.slice(0,a)+src.slice(b)).split("\n").filter(l=>/📷 CPPHOTOUP/.test(l)&&!/^\s*\/\//.test(l));
  ok("7 hook lines outside the block, each tagged 📷 CPPHOTOUP, inside CPPHOTOS, and typeof-guarded on every cpup function they call",
    hooks.length===7&&hooks.every(l=>PHO.indexOf(l)>=0&&(l.match(/cpup\w+(?=\()/g)||[]).every(f=>new RegExp('typeof '+f+'==="function"').test(l))), hooks.map(l=>l.trim().slice(0,90)));
  const code=UP.split("\n").filter(l=>!/^\s*\/\//.test(l)).join("\n");
  ok("the block's only Firebase calls are Storage (put, getDownloadURL, delete); no database call, no envsWrite (the record goes through cpphCommit)",
    !/firebase\.database|\.set\(|\.update\(|\.remove\(|\.once\(|envsWrite\(|\bdb\./.test(code)&&/\.put\(U\.blob,\{contentType:"image\/jpeg"\}\)/.test(code)&&/getDownloadURL\(\)/.test(code)&&/\.delete\(\)/.test(code)&&/cpphCommit\(ch,/.test(code));
  ok("the file input: one photo, image/*, the back camera on a phone", /<input type="file" accept="image\/\*" capture="environment"/.test(code)&&!/multiple/.test(code));
  ok("EXIF turn honoured: createImageBitmap(file,{imageOrientation:\"from-image\"}), else an <img>", /createImageBitmap\(f,\{imageOrientation:"from-image"\}\)/.test(code)&&/new Image\(\)/.test(code));
  ok("no Howe kid name as a code literal; no 🔀", !/["'`](lincoln|ellis|lucy|julian)["'`]/i.test(UP)&&UP.indexOf("\u{1F500}")<0); }

console.log("\n── the small pure parts ──");
{ const w=W(), P=w.P;
  ok("the Storage path is the record's own: classPhotos/<cid>/<cpphKey(item)>/<cpphNewId()>.jpg", P.cpupPath("ms-science-2026",P.cpphKey("St. John's/wort"),"pabc12")==="classPhotos/ms-science-2026/st%2E john's%2Fwort/pabc12.jpg");
  ok("the shrink: the longest side to 1280, the shape kept; a small photo never grows",
    JSON.stringify(P.cpupFit(4032,3024))==='{"w":1280,"h":960}'&&JSON.stringify(P.cpupFit(3024,4032))==='{"w":960,"h":1280}'&&JSON.stringify(P.cpupFit(800,600))==='{"w":800,"h":600}'&&
    JSON.stringify(P.cpupFit(1280,1280))==='{"w":1280,"h":1280}'&&JSON.stringify(P.cpupFit(6000,10))==='{"w":1280,"h":2}'&&P.CPUP_SIDE===1280&&P.CPUP_Q===0.82);
  ok("the size in words: about 180 KB, about 45 KB, about 1.5 MB", P.cpupKB(184320)==="about 180 KB"&&P.cpupKB(46080)==="about 45 KB"&&P.cpupKB(1.5*1024*1024)==="about 1.5 MB"&&P.cpupKB(300)==="about 1 KB");
  ok("the file check: nothing, not an image, over 12 MB → a plain message; a JPEG, PNG or HEIC up to 12 MB passes",
    /Pick a photo/.test(P.cpupFileWhy(null))&&/isn’t a photo/.test(P.cpupFileWhy({type:"application/pdf",size:10}))&&/isn’t a photo/.test(P.cpupFileWhy({type:"",size:10}))&&
    /over 12 MB/.test(P.cpupFileWhy({type:"image/jpeg",size:12*1024*1024+1}))&&P.cpupFileWhy({type:"image/png",size:12*1024*1024})===""&&P.cpupFileWhy({type:"image/heic",size:2e6})==="");
  ok("a Storage address is a usable url (both bucket names); another host or a non-class path is not",
    P.cpupUrlOk(ST)&&P.cpupUrlOk(ST_OLD)&&P.cpphUrlOk(ST)&&P.cpphUrlOk(P.CPUP_CHECK_URL)&&!P.cpupUrlOk("https://example.com/v0/b/x/o/classPhotos%2Fa.jpg")&&!P.cpupUrlOk(ST.replace("classPhotos%2F","songs%2F"))&&!P.cpupUrlOk("http"+ST.slice(5)));
  ok("the record says how \"upload\" for an upload; the other ways as before", P.cpphRec({url:ST,credit:"c",lic:"own",tags:{leaf:true},how:"upload"},"Sassafras","u",1).how==="upload"&&P.cpphRec({url:ST,how:"wiki",tags:{}},"x","u",1).how==="wiki"&&P.cpphRec({url:ST,how:"pool",tags:{}},"x","u",1).how==="pool");
  w._envs.role="teacher"; w._envc.cls={teacherName:"  Ms. Brittany "};
  ok("the credit starts as the class's teacherName for the teacher", P.cpupCredit()==="Ms. Brittany");
  w._envc.cls={}; ok("…else “my photo”", P.cpupCredit()==="my photo");
  w._envs.role="admin"; w._envc.cls={teacherName:"Ms. Brittany"}; ok("…and Adrienne's own photo is never credited to the teacher", P.cpupCredit()==="my photo"); }

console.log("\n── Howe and DeWalt: nothing on ──");
for(const f of ["howe","dewalt"]){ const w=W({fam:{familyId:f,roster:[]}}), P=w.P; w._envs.role="teacher"; w._envc.cid="c1";
  P._cpph.add={way:"up",draft:{tags:{}},up:{blob:{size:1}}};
  const r1=await P.cpupPick(inp(JPG)), r2=await P.cpupSave(0);
  ok(f+": no chip, no pick, no save, no upload, no write", P.cpupOn()===false&&r1===null&&r2===null&&!w.G.puts&&!w.G.refs&&!w.G.objUrls&&w.G.writes.length===0&&w._envs.writes.length===0); }

console.log("\n── the demo: the chip, the pick, the preview; Save writes nothing ──");
for(const role of ["teacher","admin"]){ const w=demo(role), P=w.P, c=idCard(w), k=P.cpphKey(c.item); openCard(w,c); P.cpphAddOpen(c.i);
  ok(role+": ＋ Add photo has the third chip “📷 My photo”, and no “comes with uploads” note", /📷 My photo/.test(w.G.content)&&!/Camera or file comes with uploads/.test(w.G.content)&&!/type="file"/.test(w.G.content));
  P.cpphWay("up"); const d=P._cpph.add.draft, H=w.G.content, tn=((w._envc.cls||{}).teacherName||"").trim();
  ok(role+": the way opens the picker (image/*, the camera); the licence starts “Own photo”, the credit "+(role==="teacher"&&tn?"the teacher's name":"“my photo”")+", My class only",
    /<input type="file" accept="image\/\*" capture="environment"/.test(H)&&d.lic==="own"&&d.how==="upload"&&d.scope==="class"&&d.credit===(role==="teacher"&&tn?tn:"my photo")&&/<option value="own" selected>/.test(H));
  ok(role+": "+(role==="admin"?"an own photo may go to the unit (Adrienne)":"no unit choice for the teacher"), role==="admin"?/The unit, for every class/.test(H):!/The unit, for every class/.test(H));
  const n0=w._envs.writes.length; await P.cpupPick(inp({type:"application/pdf",size:900}));
  ok(role+": a PDF is refused with a plain message", /isn’t a photo/.test(w.G.content)&&!w.G.objUrls);
  await P.cpupPick(inp(JPG)); const H2=w.G.content;
  ok(role+": a 4032 × 3024 photo is shrunk on the device to 1280 × 960 JPEG at 0.82, EXIF from the image, then previewed with its size",
    JSON.stringify(w.G.encoded)==='{"type":"image/jpeg","q":0.82,"w":1280,"h":960}'&&w.G.bitmapOpts&&w.G.bitmapOpts.imageOrientation==="from-image"&&w.G.closed===1&&/<img class="cpph-pi" src="blob:x\/1"/.test(H2)&&/about 180 KB · 1280 × 960 px/.test(H2));
  P.cpphTag("leaf"); const r=await P.cpphSave(c.i);
  ok(role+": Save → “Demo · not saved”: 0 database writes, 0 uploads, no network, the panel stays", r===null&&w._envs.writes.length===n0&&w.G.writes.length===0&&!w.G.puts&&!w.G.refs&&!w.G.fetched&&/Demo · not saved/.test(w.G.content)&&!!P._cpph.add&&!P.cpPhotos(c.item).some(p=>p.how==="upload"));
  P.cpphWay("pool"); ok(role+": back to 🗂 the pool and the other ways are as before", P._cpph.add.way==="pool"&&/🗂 The unit’s pool/.test(w.G.content)&&!/type="file"/.test(w.G.content)); }

console.log("\n── live (Storage stubbed): upload, then ONE record write ──");
const live=o=>{ o=o||{}; const w=W({dry:!!o.dry,remote:{"classPhotos/c1":{}}}); w._envs.role=o.role||"teacher"; w._envs.uid="t1"; w._envc.sdb=w.firebase.database(); w._envc.cid="c1"; w._envs.cid="c1"; w._envc.view="cpcards";
  w._envc.cls={teacherName:"Ms. Brittany"}; Object.assign(w.G,o.G||{}); const P=w.P, c=w.ccs.cpcsIndex().C.find(x=>x.kind==="id"&&x.item); P.cpphAddOpen(c.i); P.cpphWay("up"); return {w,P,c,k:P.cpphKey(c.item)}; };
{ const {w,P,c,k}=live(); await P.cpupPick(inp(JPG)); P.cpphTag("bark");
  const pid=await P.cpphSave(c.i); await w.flush(); const put=(w.G.puts||[])[0], wr=w.G.writes[0];
  ok("ONE put at classPhotos/<cid>/<itemKey>/<photoId>.jpg, as image/jpeg, the shrunk file", (w.G.puts||[]).length===1&&put[0]==="classPhotos/c1/"+k+"/"+pid+".jpg"&&put[1]==="image/jpeg"&&put[2]===184320, w.G.puts);
  ok("…the progress shown while it goes (“Uploading … 50%”), then its download address asked once", w.G.progEv==="state_changed"&&w.G.midMsg==="Uploading … 50%"&&w.G.urls===1);
  ok("…the bucket: none in the config → gs://<projectId>.firebasestorage.app", w.G.bucketUrl==="gs://howe-envirothon.firebasestorage.app"&&!w.G.defaultStorage);
  ok("then ONE database write: set classPhotos/<cid>/<itemKey>/<photoId> = {url, credit, lic, tags, item, how:\"upload\", by, ts}",
    w.G.writes.length===1&&wr[0]==="set"&&wr[1]==="classPhotos/c1/"+k+"/"+pid&&JSON.stringify(Object.keys(wr[2]).sort())===JSON.stringify(["by","credit","how","item","lic","tags","ts","url"])&&
    wr[2].how==="upload"&&wr[2].lic==="own"&&wr[2].credit==="Ms. Brittany"&&wr[2].by==="t1"&&wr[2].tags.bark===true&&P.cpupUrlOk(wr[2].url)&&wr[2].url.indexOf(encodeURIComponent(put[0]))>0, wr);
  ok("…the panel closes on the new photo; the object URL is let go", P._cpph.add===null&&P._cpph.pick===pid&&(w.G.revoked||[]).indexOf("blob:x/1")>=0);
  P._cpph.L.c1={[k]:{[pid]:wr[2]}};   // live, memory is the listener's: the record arrives before anyone can tap Undo
  P.cpphUndo(); await w.flush();
  ok("Undo: the record removed (ONE write) AND the Storage file deleted", JSON.stringify(w.G.writes[1])===JSON.stringify(["remove","classPhotos/c1/"+k+"/"+pid])&&JSON.stringify(w.G.dels)===JSON.stringify([put[0]])); }
{ const {w,P,c,k}=live({G:{fbOpts:{projectId:"howe-envirothon",storageBucket:"howe-envirothon.appspot.com"},bucket:"howe-envirothon.appspot.com"}}); await P.cpupPick(inp(JPG)); P.cpphTag("leaf"); P.cpphIn("main",true);
  const pid=await P.cpphSave(c.i); await w.flush(); const u=w.G.writes[0];
  ok("a config with storageBucket uses firebase.storage(); ⭐ ticked → still ONE multi-path update with the photo and _main", w.G.defaultStorage>=1&&!w.G.bucketUrl&&u[0]==="update"&&u[1]==="classPhotos/c1/"+k&&u[2]._main===pid&&u[2][pid].how==="upload"&&/appspot\.com/.test(u[2][pid].url)); }
{ const {w,P,c,k}=live({role:"admin"}); w._envs.uid="a1"; await P.cpupPick(inp(JPG)); P.cpphTag("leaf"); P.cpphIn("scope","unit");
  const pid=await P.cpphSave(c.i); await w.flush(); const wr=w.G.writes[0];
  ok("Adrienne, “The unit, for every class”: the file under the class path, the record at units/<unit>/photos/<itemKey>/<photoId>", w.G.puts[0][0]==="classPhotos/c1/"+k+"/"+pid+".jpg"&&wr[0]==="set"&&/^units\/[^/]+\/photos\//.test(wr[1])&&wr[1].endsWith("/"+k+"/"+pid)&&wr[2].lic==="own"&&wr[2].by==="a1"&&wr[2].credit==="my photo"); }
{ const {w,P,c}=live({G:{putFail:true}}); await P.cpupPick(inp(JPG)); P.cpphTag("leaf"); const r=await P.cpphSave(c.i); await w.flush();
  ok("a refused upload: a plain message, the panel stays, no database write, the half-file cleared", r===null&&w.G.writes.length===0&&/^Couldn’t upload: storage\/unauthorized/.test(P._cpph.add.up.msg)&&!!P._cpph.add&&P._cpph.add.up.busy===false&&(w.G.dels||[]).length===1); }
{ const {w,P,c}=live(); await P.cpupPick(inp(JPG)); const r=await P.cpphSave(c.i);
  ok("no tag ticked: the usual “Tick what it shows” and nothing uploads", r===null&&!w.G.puts&&w.G.writes.length===0); }
{ const {w,P,c}=live(); const r=await P.cpphSave(c.i); ok("no photo picked: “Take or choose a photo first”, nothing uploads", r===null&&!w.G.puts); }
{ const {w,P,c}=live({dry:true}); await P.cpupPick(inp(JPG)); P.cpphTag("leaf"); const r=await P.cpphSave(c.i); await w.flush();
  ok("?dryrun=1: “Dry run · not saved”, no upload, no write", r===null&&!w.G.puts&&w.G.writes.length===0&&/^Dry run · not saved/.test(P._cpph.add.up.msg)); }
{ const {w,P,c}=live(); P._cpph.undo.push({prev:{"classPhotos/c1/x/_main":null},label:"old"}); P.cpphUndo(); await w.flush();
  ok("an Undo that isn't an upload deletes no file", !w.G.dels); }

console.log("\n── the rules ──");
{ const R=JSON.parse(fs.readFileSync(path.join(REPO,"envirothon","SITE_RULES.json"),"utf8")).rules, C=R.classPhotos.$cid.$item.$pid, U=R.units.$unitId.photos.$item.$pid;
  const rxs=s=>s.match(/matches\(\/(.+?)\/\)/g).map(m=>new RegExp(m.slice(9,-2)));
  for(const [n,X] of [["classPhotos/$cid","C"],["units/$unitId/photos","U"]]){ const V=X==="C"?C:U, url=rxs(V.url[".validate"]), how=rxs(V.how[".validate"])[0];
    ok(n+": the url validate takes this project's Storage address (both bucket names), as the code makes it", url.some(r=>r.test(ST))&&url.some(r=>r.test(ST_OLD))&&url.some(r=>r.test("https://firebasestorage.googleapis.com/v0/b/howe-envirothon.firebasestorage.app/o/"+encodeURIComponent("classPhotos/c1/st%2E john's%2Fwort/pabc12.jpg")+"?alt=media&token=x")));
    ok(n+": …and still nothing else (another bucket, another folder, another host, a data: url)", !url.some(r=>r.test(ST.replace("howe-envirothon.firebasestorage.app","evil.firebasestorage.app")))&&!url.some(r=>r.test(ST.replace("classPhotos%2F","songs%2F")))&&!url.some(r=>r.test("https://example.com/a.jpg"))&&!url.some(r=>r.test("data:image/jpeg;base64,xx"))&&url.length===3);
    ok(n+": how takes upload (and wiki, pool), nothing else", ["wiki","pool","upload"].every(h=>how.test(h))&&!how.test("camera")); }
  const S=fs.readFileSync(path.join(REPO,"envirothon","STORAGE_RULES.txt"),"utf8"), code=S.split("\n").filter(l=>!/^\s*\/\//.test(l)).join("\n");
  ok("STORAGE_RULES.txt: rules_version 2; only classPhotos/{cid}/{item}/{file}; signed-in read", /^rules_version = '2';/.test(S)&&(code.match(/match \//g)||[]).length===2&&/match \/classPhotos\/\{cid\}\/\{item\}\/\{file\}/.test(code)&&/allow read: if request\.auth != null;/.test(code));
  ok("…create/update only signed in, under 3 MB, image/jpeg; delete signed in (Undo); never `if true`, no wildcard path",
    /allow create, update: if request\.auth != null\s*&& request\.resource\.size < 3 \* 1024 \* 1024\s*&& request\.resource\.contentType\.matches\('image\/jpeg'\);/.test(code)&&/allow delete: if request\.auth != null;/.test(code)&&!/if true|\{allPaths=\*\*\}|\*\*/.test(code));
  ok("…and says plainly that Storage cannot check the teacher role", /cannot check that the signer is that class's teacher or an admin/.test(S));
  const M=fs.readFileSync(path.join(REPO,"envirothon","SITE_SETUP.md"),"utf8");
  ok("SITE_SETUP.md §7: Storage → Get started, production mode, the database's region, the paste file, the bucket name, a test", /## 7\. Photos: Storage/.test(M)&&/Get started/.test(M)&&/production mode/.test(M)&&/us-central1/.test(M)&&/STORAGE_RULES_PASTE\.txt/.test(M)&&/howe-envirothon\.firebasestorage\.app/.test(M)&&/\*\*Test:\*\*/.test(M)); }

console.log("\n"+pass+" passed, "+fail+" failed"); if(fail) process.exit(1);
};
run().catch(e=>{ console.error(e); process.exit(1); });
