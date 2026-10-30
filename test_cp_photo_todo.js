/*
 * Node tests — 📷 CPPHOTOTODO, the teacher's "Photos to add" to-do list (DESIGN_class_platform_2026-10-28.md §6.7, §6.6, "Adrienne's
 * answers, 2026-10-29"). Her words 2026-10-29: "photos can you make todos for her so she can do it."
 *   · the block (right after CPPHOTOS_END, only declares, 3 typeof-guarded hooks tagged 📷 CPPHOTOTODO: cpcsChipsHtml, cpcsListHtml,
 *     cpphCard); every write through envsWrite; no uploads, no fetch of its own;
 *   · Howe / no edition, the kid and the parent: nothing on;
 *   · the list is worked out live from the skills' and the trim's own lookups — every row checked against the unit's skill data and the
 *     photo pool, the trim's photo-blocked rows one for one; the count, the done / total bar, the unlocking rows first;
 *   · a tap opens the item's 🖼 strip with ＋ Add photo on 🔎 Wikipedia / Commons, the search filled in, the part ticked; an item with no card
 *     gets the strip too; adding a photo (the pool or the canned lookup) takes the row off and the count down; Undo brings it back;
 *     2 photos of a tree part clear the trim's 🔒 for its cards;
 *   · Not now: classes/<cid>/dismissed/photo~<hash> (CPSUGGEST's rule), ↩ Bring back; live = exactly that path; dry run = nothing;
 *   · Adrienne sees the same list.                                                                     run: node test_cp_photo_todo.js
 * Every count comes from the data (units/nc_envirothon/unit.json, envirothon/pics/index.json), never typed in.
 */
const fs=require("fs"), path=require("path");
const {world,src,REPO}=require("./test_env_site.js");
let pass=0, fail=0;
const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  "+JSON.stringify(x).slice(0,600):"")); } };
const cut=(a,b)=>{ const i=src.indexOf(a); if(i<0) throw new Error("missing "+a); const j=src.indexOf(b,i); return src.slice(i,j+b.length); };
const PT=cut("// CPPHOTOTODO_START","// CPPHOTOTODO_END");
const BLOCKS=["CPLOCKS","CPPACE","CPCAL","CPSUGGEST","CPTRIM","CPPHOTOS","CPSKILL","CPITEMGEAR","CPITEMBIOTIC","CPITEMTRIANGLE","CPITEMLABEL","CPITEMID","CPITEMSCALE"].map(n=>cut("// "+n+"_START","// "+n+"_END")).join("\n");
const API="_cppt, cpptOn, cpptModel, cpptCards, cpptChipHtml, cpptListHtml, cpptToggle, cpptTap, cpptOpen, cpptNotNow, cpptCard, cpptCardFor, cpptHash";
const OTHER="_cpph, _cptr, _cpsk, cpphKey, cpphCard, cpphWay, cpphPoolPick, cpphPoolQ, cpphSave, cpphWiki, cpphUndo, cpphTag, cpPhotos, cpPhotoParts, cpcsIndex, cpcsListHtml, cpcsChipsHtml, cptrModel, cptrToggle, cptrPart, cpSkillList, cpuIndex";
const REV=o=>BLOCKS+"\n"+(o.pt===false?"G.p=null;":PT+"\nG.p={ "+API+" };")+
  "\nfunction envPicsIndex(){ return G.pics||null; } function envPicsLoad(){ G.picLoads=(G.picLoads||0)+1; return Promise.reject(new Error('no')); }"+
  "\nfunction fetch(u){ G.fetched=(G.fetched||0)+1; return Promise.reject(new Error('offline')); } function _unitPicsLookup(f,t,n){ G.looked=(G.looked||[]).concat([t]); return Promise.resolve(G.wiki||null); }"+
  "\nG.o={ "+OTHER+" };";
const LIB=require(path.join(REPO,"envirothon.js"));
const PICS=JSON.parse(fs.readFileSync(path.join(REPO,"envirothon","pics","index.json"),"utf8"));
const UNIT=JSON.parse(fs.readFileSync(path.join(REPO,"units","nc_envirothon","unit.json"),"utf8"));
const FAM={familyId:"envirothon",edition:"envirothon",className:"MS Science 2026-27",roster:[]};
const NOW=Date.UTC(2026,9,29,15,0,0), CID="ms-science-2026";
function W(o){ o=o||{}; const w=world(Object.assign({fam:FAM,envt:true,lib:LIB,rev:REV(o),now:NOW},o.w||{})); w.P=w.G.p; w.O=w.G.o; w.G.pics=o.noPics?null:PICS; return w; }
function demo(role,o){ const w=W(Object.assign({},o,{w:Object.assign({search:"?demo=1&role="+(role||"teacher")},(o&&o.w)||{})})); w.envSiteDemoBoot(); w.renderAll(); w.envcView("cpcards"); w.renderAll(); return w; }
function live(o){ o=o||{}; const w=W({w:{remote:{"classPhotos/c1":{}},dry:!!o.dry}}); w._envs.role=o.role||"teacher"; w._envs.uid="t1"; w._envc.sdb=w.firebase.database(); w._envc.cid="c1"; w._envs.cid="c1"; w._envc.view="cpcards"; w._envc.cls={dismissed:{}}; return w; }
const view=w=>{ w.renderAll(); return w.G.content; };
const text=h=>String(h).replace(/<[^>]+>/g," ").replace(/\s+/g," ");
const Wr=w=>w._envs.writes, last=w=>Wr(w)[Wr(w).length-1];
const fnSrc=name=>{ const i=src.indexOf("\nfunction "+name+"("); const j=src.indexOf("\n}\n",i); return src.slice(i+1,j+2); };
const chipN=w=>{ const m=/📷 (\d+) photos? to add/.exec(w.O.cpcsChipsHtml()); return m?+m[1]:null; };
const grpOf=(X,re)=>X.groups.find(g=>re.test(g.label));
const rowOf=(X,name,tag)=>X.slots.find(s=>s.name===name&&s.tag===tag);
const low=s=>String(s).trim().toLowerCase();

// EXPECTED, from the unit's skill data and the pool (not from the block): every item × picture a skill asks for that has no photo
const SKILLS=UNIT.skills||[];
function expectSkillNeeds(w){ const cp=w.O.cpPhotos, out={}, noTS=L=>L.filter(p=>!(p.tags||[]).some(t=>t==="track"||t==="skull"));
  const hidden=new Set(); (w.O.cpSkillList(undefined,undefined,{all:true})||[]).forEach(s=>{ if(s.hide) hidden.add(s.key); });
  SKILLS.forEach(sk=>{ const d=sk.data||{}; if(hidden.has(sk.key)) return;
    if(d.kind==="gear") d.items.forEach(x=>{ const it=x.item||x.name; if(!cp(it,d.tags||["gear","drawing"]).length&&!noTS(cp(it)).length) out[w.O.cpphKey(it)+"|gear"]={sk:sk.key,name:x.name}; });
    if(d.kind==="parts") d.items.forEach(x=>d.parts.forEach(p=>{ if(Array.isArray(x.parts)&&x.parts.indexOf(p.tag)<0) return; if(!cp(x.name,p.tags&&p.tags.length?p.tags:[p.tag]).length) out[w.O.cpphKey(x.name)+"|"+p.tag]={sk:sk.key,name:x.name}; }));
    if(d.kind==="tally"&&Array.isArray(d.items)) d.items.forEach(x=>{ const it=x.item||x.name; if(!cp(it,d.tags||["live","drawing","specimen"]).length&&!noTS(cp(it)).length) out[w.O.cpphKey(it)+"|live"]={sk:sk.key,name:x.name}; }); });
  return out; }
// …and every (item, part) the trim's guard holds back for want of photos: {item|part: photos still needed}
function expectTrim(w){ const X=w.O.cptrModel(), out={}; if(!X) return out;
  X.subs.forEach(s=>{ if(!s.S||!s.S.live||!s.S.photos) return; s.rows.forEach(r=>{ const g=r.g; if(!(g&&g.photo)) return; const part=s.S.photos.parts[low(w.O.cptrPart(r.c))];
    const have=(w.O.cpPhotoParts(r.item,[part])||{})[part]||0; out[w.O.cpphKey(r.item)+"|"+part]=s.S.photos.photos-have; }); });
  return out; }

const run=async()=>{
console.log("── the block, where it sits, how it is hooked ──");
{ const a=src.indexOf("// CPPHOTOTODO_START"), b=src.indexOf("// CPPHOTOTODO_END"), e=src.indexOf("// CPPHOTOS_END"), head=PT.slice(0,1400);
  ok("one CPPHOTOTODO block, IMMEDIATELY after CPPHOTOS_END", a>0&&b>a&&src.indexOf("// CPPHOTOTODO_START",a+1)<0&&src.slice(e,a).trim()==="// CPPHOTOS_END");
  ok("its header: her words and the date, §6.7, her answers of 2026-10-29", /photos can you make\s*\n?(\/\/ )?todos for her so she can do it/.test(head)&&/2026-10-29/.test(head)&&/§6\.7/.test(head)&&/Adrienne's\s*\n?(\/\/ )?answers, 2026-10-29/.test(head));
  ok("…and it says: no uploads, inert off the console, Howe and Lincoln never reach it", /NO uploads/.test(PT)&&/INERT unless/.test(PT)&&/Lincoln never reach a line of it/.test(PT));
  ok("the block only declares (nothing runs at boot)", PT.split("\n").every(l=>!l.trim()||/^(\/\/|function |const | |})/.test(l)));
  const out=src.slice(0,a)+src.slice(b), hooks=out.split("\n").filter(l=>/📷 CPPHOTOTODO/.test(l));
  ok("3 hook lines outside the block, each tagged 📷 CPPHOTOTODO and typeof-guarded on a cppt function", hooks.length===3&&hooks.every(l=>(l.match(/cppt\w+(?=\()/g)||[]).every(f=>new RegExp('typeof '+f+'==="function"').test(l))), hooks.map(l=>l.trim().slice(0,90)));
  ok("…in cpcsChipsHtml (after the ✂️ Trim chip), cpcsListHtml (before the Trim view) and cpphCard (negative index only)",
    /cptrChipHtml\(h\);[^\n]*\n  if\(typeof cpptChipHtml==="function"\) h=cpptChipHtml\(h\);/.test(fnSrc("cpcsChipsHtml"))&&
    /if\(typeof cpptListHtml==="function"\)\{ const _p=cpptListHtml\(M\); if\(_p!==undefined\) return _p; \}[^\n]*\n  if\(typeof cptrListHtml/.test(fnSrc("cpcsListHtml"))&&
    /^function cpphCard\(i\)\{ if\(i<0&&typeof cpptCard==="function"\) return cpptCard\(i\);/m.test(src));
  const names=out.split("\n").filter(l=>/\bcppt[A-Z]\w*\(/.test(l)&&!/typeof cppt/.test(l));
  ok("no cppt function is called outside the block except through a guarded hook", names.length===0, names.map(l=>l.trim().slice(0,90)));
  const code=PT.split("\n").filter(l=>!/^\s*\/\//.test(l)).join("\n");
  ok("every write goes through envsWrite (one: the Not now record); no Firebase call, no fetch, no upload of its own", (code.match(/envsWrite\(/g)||[]).length===1&&!/\.set\(|\.update\(|\.remove\(|\.ref\(|firebase\.|envcWrite|\bdb\.|fetch\(|_unitPicsLookup|type="file"|canvas|storage\(\)|FileReader/i.test(code));
  const tr=[...new Set((code.match(/\bcptr[A-Z]\w*(?=\()/g)||[]))].sort();
  ok("it reads the trim only through cptrModel / cptrPart, both typeof-guarded on the line that opens the read; it never names cpSkill* (CPSKILL's rule)", JSON.stringify(tr)==='["cptrModel","cptrPart"]'&&/if\(typeof cptrModel==="function"&&typeof cpPhotoParts==="function"&&typeof cptrPart==="function"\)\{ let X=null; try\{ X=cptrModel\(\); /.test(code)&&!/cpSkill\w+/.test(code), tr);
  ok("no Howe kid name as a code literal; no 🔀", !/["'`](lincoln|ellis|lucy|julian)["'`]/i.test(PT)&&PT.indexOf("\u{1F500}")<0); }

console.log("\n── Howe, no edition, the kid, the parent: nothing on ──");
for(const f of ["howe","dewalt"]){ const w=W({w:{fam:{familyId:f,roster:[]}}}), P=w.P;
  ok(f+": off; the chip hook hands back what it was given; no list; no model; nothing read or written", P.cpptOn()===false&&P.cpptChipHtml("X")==="X"&&P.cpptListHtml({})===undefined&&P.cpptModel()===null&&P.cpptCard(-1)===null&&w.G.writes.length===0&&w.G.reads.length===0); }
for(const role of ["kid","parent"]){ const w=W({w:{search:"?demo=1&role="+role}}); w.envSiteDemoBoot(); w.renderAll(); const P=w.P;
  ok("the site's "+role+": off (the console only), and toggling does nothing", P.cpptOn()===false&&P.cpptChipHtml("X")==="X"&&(P.cpptToggle(),P._cppt.on===false)&&P.cpptNotNow("x",true)===false&&Wr(w).length===0); }
{ const w=demo("teacher",{pt:false});
  ok("📚 Cards without the block: the chips and the list are as before (no 📷)", !/📷/.test(w.O.cpcsChipsHtml())&&!/cppt/.test(view(w))); }

console.log("\n── the list, worked out live (live teacher: no demo drawings) ──");
{ const w=live(), P=w.P, X=P.cpptModel(), E=expectSkillNeeds(w), T=expectTrim(w);
  ok("the model is ready once the cards and the photo list are in", !!X&&X.slots.length>0);
  const skillRows=X.slots.filter(s=>s.have<1&&s.want>=1&&(s.why.length||s.round||s.first)).map(s=>s.id).sort();
  ok("every item × picture a skill asks for with no photo is a row, and nothing else is (gear, ID by part / sign, the biotic sheet)", JSON.stringify(skillRows)===JSON.stringify(Object.keys(E).sort()), {model:skillRows.length,expected:Object.keys(E).length});
  const tr=Object.keys(T);
  ok("every (tree, part) the trim holds back for photos is a row asking at least that many", tr.length>0&&tr.every(k=>{ const s=X.slots.find(x=>x.id===k); return s&&s.left>=T[k]&&s.lock.some(l=>/✂️ the trim/.test(l)); }), tr.filter(k=>{ const s=X.slots.find(x=>x.id===k); return !(s&&s.left>=T[k]); }).slice(0,5));
  ok("…and no trim lock shows where the trim doesn't hold a card back", X.slots.filter(s=>s.lock.some(l=>/✂️/.test(l))).every(s=>T[s.id]>0));
  const want=X.slots.reduce((n,s)=>n+s.want,0), have=X.slots.reduce((n,s)=>n+s.have,0), todo=X.slots.reduce((n,s)=>n+s.left,0);
  ok("the count = every photo still wanted (1 per skill picture, 2 per trimmed tree part), the bar = photos in of photos wanted", X.todo===todo&&X.want===want&&X.have===have&&todo===want-have&&todo>=Object.keys(E).length);
  const skillPhotos=Object.keys(E).length, trimExtra=todo-skillPhotos;
  console.log("      (live: "+todo+" photos to add = "+skillPhotos+" the skills ask for + "+trimExtra+" more for the trim's 2 per part)");
  ok("the chip is the badge: “📷 N photos to add”", chipN(w)===todo);
  P._cppt.on=true; const html=w.O.cpcsListHtml(); P._cppt.on=false;
  ok("the list's head says the count and “X of Y photos in”, with the bar", new RegExp("📷 "+todo+" photos to add").test(text(html))&&new RegExp(have+" of "+want+" photos in").test(text(html))&&/role="progressbar"/.test(html));
  const groups=X.groups.filter(g=>g.todo.length).map(g=>g.label);
  ok("grouped by skill (a skill whose pictures are all in drops out)", groups.length>=3&&!groups.some(l=>/Biotic|Stream bugs/.test(l))&&groups.every(l=>(P.cpptModel().groups.find(g=>g.label===l)||{}).left>0), groups);
  const bucket={}; X.groups.forEach(g=>g.todo.forEach(s=>{ const k=g.label+" · "+s.tag; bucket[k]=(bucket[k]||0)+s.left; }));
  console.log("      (by group: "+X.groups.filter(g=>g.left).map(g=>g.label+" "+g.left).join(" · ")+")");
  ok("rows read “<item> · <picture>”: Clinometer · gear picture, Red Oak · twig, Raccoon · track", !!rowOf(X,"Clinometer","gear")&&rowOf(X,"Clinometer","gear").word==="gear picture"&&rowOf(X,"Red Oak","twig").word==="twig"&&(!rowOf(X,"Raccoon","track")||rowOf(X,"Raccoon","track").word==="track"));
  const twig=X.slots.filter(s=>s.tag==="twig"&&s.left>0), anyTwig=X.slots.some(s=>s.tag==="twig"&&s.have>0);
  ok("no tree has a twig photo: every twig row says it opens the twig round", !anyTwig&&twig.length>0&&twig.every(s=>s.lock.indexOf("🔓 opens the twig round")>=0));
  ok("no gear picture yet (live): every gear row says its first picture starts the “What is it?” step", X.slots.filter(s=>s.tag==="gear"&&s.left>0).every(s=>s.lock.some(l=>/What is it\?/.test(l))));
  ok("every row says why: the skill's reason, or how many the trim wants of the one it has", X.slots.filter(s=>s.left>0).every(s=>s.note||s.lock.length));
  ok("an item that has 1 photo of a part and only the trim wants a 2nd never says “skips it”", X.slots.filter(s=>s.have>=1&&s.left>0).every(s=>!/skips|asks only/.test(s.note)&&/the trim wants/.test(s.note)));
  ok("rows that unlock come first in every group (🔓 a round / a step, then ✂️ the trim, then the rest)", X.groups.every(g=>g.todo.every((s,i)=>i===0||g.todo[i-1].rank<=s.rank)));
  ok("…and the groups that hold them come first", X.groups.filter(g=>g.todo.length).every((g,i,A)=>i===0||(A[i-1].locks>0)||!g.locks));
  const hid=w.O.cpSkillList(undefined,undefined,{all:true}).find(s=>s.data&&s.data.kind==="gear");
  w.O._cpsk.L.c1={[hid.fb]:{hide:true}};
  ok("a skill hidden for the class (🏫 Class setup ▸ 🧩 Skills) asks for nothing", !P.cpptModel().groups.some(g=>g.key===hid.key&&g.todo.length));
  w.O._cpsk.L.c1={}; }

console.log("\n── the photo list must be in before anything is counted ──");
{ const w=live(); w.G.pics=null; const P=w.P;
  ok("no repo photo list yet: no count (it would show every item empty), the list says it is counting, and the list is asked for once", P.cpptModel()===null&&/📷 Photos to add/.test(P.cpptChipHtml(""))&&(P._cppt.on=true,/Counting the photos/.test(w.O.cpcsListHtml()))&&w.G.picLoads===1);
  await new Promise(r=>setImmediate(r)); P.cpptModel();
  ok("…if it can't load, it counts from the layers and says the counts may be high", P._cppt.picErr===true&&/may be high/.test(w.O.cpcsListHtml())); }

console.log("\n── the demo: Teacher ▸ 📚 Cards ▸ 📷 ▸ Clinometer ▸ add one from the pool ──");
{ const w=demo("teacher"), P=w.P;
  const n0=chipN(w); ok("the 📷 chip shows the count in 📚 Cards, first in the row", n0>0&&/^<button class="cpcs-chip cppt-chip"/.test(w.O.cpcsChipsHtml()));
  w.O._cptr.on=true; P.cpptToggle(); let h=view(w);
  ok("tap it: the list replaces the cards, ✂️ Trim steps aside, the other chips step aside", P._cppt.on&&w.O._cptr.on===false&&/class="cppt"/.test(h)&&!/cpcs-chip"[^>]*>✂️/.test(w.O.cpcsChipsHtml().replace(/cppt-chip on/,"")));
  ok("opening it wrote nothing and looked nothing up", Wr(w).length===0&&!w.G.looked&&!w.G.fetched);
  const X=P.cpptModel(), g=grpOf(X,/Forestry tools/), s=g.todo.find(x=>x.name==="Clinometer");
  ok("the demo's 4 gear drawings count as in (Biltmore stick, Increment borer …): they aren't rows", !g.todo.some(x=>x.name==="Biltmore stick"||x.name==="Increment borer")&&!!s);
  P.cpptTap("g",g.h); h=view(w); ok("open the group: its rows, Clinometer among them, each with Not now", /<b>Clinometer<\/b> · gear picture/.test(h)&&(h.match(/>Not now</g)||[]).length===g.todo.length);
  const c=P.cpptOpen(s.h); h=view(w); const A=w.O._cpph.add;
  ok("tap Clinometer: its card's 🖼 strip opens under the row, ＋ Add photo on 🔎 Wikipedia / Commons, the search filled in, “gear” ticked", c&&c.name==="Clinometer"&&c.i>=0&&A&&A.way==="wiki"&&A.q==="Clinometer"&&A.draft.tags.gear===true&&/id="cppt-r-[a-z0-9]+"[^]*id="cpph-strip"[^]*id="cpph-add"/.test(h)&&/value="Clinometer"/.test(h));
  ok("…and nothing is looked up until she taps Look up", !w.G.looked&&!w.G.fetched&&Wr(w).length===0);
  w.O.cpphWay("pool"); view(w); const j=w.O._cpph.add.list.findIndex(p=>p.tags.indexOf("gear")>=0||p.tags.indexOf("live")>=0); w.O.cpphPoolPick(j);
  const pid=w.O.cpphSave(c.i), wr=last(w); h=view(w);
  ok("add one from the pool: ONE set at classPhotos/<cid>/clinometer/<id>", !!pid&&Wr(w).length===1&&wr.op==="set"&&wr.path==="classPhotos/"+CID+"/clinometer/"+pid);
  ok("…the row disappears and the count drops by one", !/<b>Clinometer<\/b> · gear picture/.test(h)&&chipN(w)===n0-1&&P.cpptModel().todo===n0-1);
  ok("…and the gear skill now has its picture", w.O.cpPhotos("Clinometer").some(p=>p.id===pid));
  ok("…and nothing stays open where the row was", P._cppt.open===null);
  w.O.cpphUndo(); ok("↩︎ Undo: the row and the count come back", P.cpptModel().todo===n0&&!!rowOf(P.cpptModel(),"Clinometer","gear")&&rowOf(P.cpptModel(),"Clinometer","gear").left===1);
  P.cpptOpen(s.h); P.cpptOpen(s.h); ok("tap the open row again: it folds", P._cppt.open===null&&w.O._cpph.add===null); }

console.log("\n── an item with no card, a scientific name, the canned lookup, the trim's lock ──");
{ const w=demo("teacher"), P=w.P; P.cpptToggle(); const X=P.cpptModel(), g=grpOf(X,/Sampling gear/), s=g.todo.find(x=>x.name==="Kick net");
  ok("Kick net has no card in the unit", !!s&&!w.O.cpcsIndex().C.some(c=>w.O.cpphKey(c.item||c.name)==="kick net"));
  P.cpptTap("g",g.h); const c=P.cpptOpen(s.h), h=view(w);
  ok("…tap it: a stand-in (negative index) that cpphCard hands CPPHOTOS, and the same strip opens", c&&c.i<0&&w.O.cpphCard(c.i)===c&&/Add a photo to “Kick net”/.test(h)&&w.O._cpph.add.q==="Kick net");
  const n0=P.cpptModel().todo; await w.O.cpphWiki(c.i); view(w); const pid=w.O.cpphSave(c.i), wr=last(w);
  ok("🔎 the demo's canned lookup + Save: ONE set at classPhotos/<cid>/kick net/<id>, licence Not sure, gear ticked; no network", wr.op==="set"&&wr.path==="classPhotos/"+CID+"/kick net/"+pid&&wr.val.lic==="unknown"&&wr.val.tags.gear===true&&!w.G.fetched);
  ok("…the gear skill finds it, the row goes, the count drops", w.O.cpPhotos("Kick net",["gear","drawing"]).some(p=>p.id===pid)&&!P.cpptModel().slots.some(x=>x.name==="Kick net"&&x.left>0)&&P.cpptModel().todo===n0-1);
  const tp=w.O.cpSkillList().find(x=>x.data&&x.data.kind==="parts"&&x.data.parts.some(p=>p.tag==="twig")), oak=tp.data.items.find(x=>/Red Oak/.test(x.name))||tp.data.items[0];
  oak.sci="Quercus rubra"; ok("a skill item's scientific name fills the search: “Quercus rubra twig”", rowOf(P.cpptModel(),oak.name,"twig").q==="Quercus rubra twig"); delete oak.sci;
  ok("…else the item's “· scientific name” card", P.cpptCards({C:[{name:"Bluegill · scientific name",def:"Lepomis macrochirus",item:"Bluegill",kind:"id"}]}).sci.bluegill==="Lepomis macrochirus");
  ok("…else its name and the part: “Red Oak twig”", rowOf(P.cpptModel(),oak.name,"twig").q===oak.name+" twig");
  // the trim: 2 photos of a held-back part clear its cards' 🔒
  const T=expectTrim(w), k=Object.keys(T).find(x=>T[x]>=1), S=P.cpptModel().slots.find(x=>x.id===k);
  const before=w.O.cptrModel().subs.reduce((n,x)=>n+x.rows.filter(r=>r.g&&r.g.photo&&w.O.cpphKey(r.item)===S.key).length,0);
  ok("a tree part the trim holds back is a row with ✂️ (“"+S.name+" · "+S.word+"”, "+S.left+" to add)", !!S&&S.lock.some(l=>/✂️/.test(l))&&before>0);
  for(let i=0;i<S.left+1;i++){ const cc=P.cpptOpen(S.h)||P.cpptCardFor(S,w.O.cpcsIndex()); if(!w.O._cpph.add){ P._cppt.open=null; P.cpptOpen(S.h); }
    const d=w.O._cpph.add.draft; Object.assign(d,{url:"data:image/svg+xml;charset=utf-8,demo"+i,credit:"Demo "+i,lic:"own",how:"pool"}); d.tags={[S.tag]:true}; w.O.cpphSave(cc.i); P._cppt.open=null; if(!P.cpptModel().slots.find(x=>x.id===k&&x.left>0)) break; }
  w.O._cptr.ver++; const after=w.O.cptrModel().subs.reduce((n,x)=>n+x.rows.filter(r=>r.g&&r.g.photo&&w.O.cpphKey(r.item)===S.key&&low(w.O.cptrPart(r.c)).length&&x.S.photos.parts[low(w.O.cptrPart(r.c))]===S.tag).length,0);
  ok("…add its photos: the row goes and the trim no longer holds those cards back for photos", !P.cpptModel().slots.some(x=>x.id===k&&x.left>0)&&after===0); }

console.log("\n── Not now, kept for the class ──");
{ const w=demo("teacher"), P=w.P; P.cpptToggle(); const X=P.cpptModel(), s=X.groups[0].todo[0], n0=X.todo;
  P.cpptOpen(s.h); ok("Not now on a row", P.cpptNotNow(s.h,true)===true);
  const wr=last(w);
  ok("…ONE set at classes/<cid>/dismissed/photo~<hash> = {by, ts, t}", wr.op==="set"&&wr.path==="classes/"+CID+"/dismissed/photo~"+s.h&&JSON.stringify(Object.keys(wr.val))==='["by","ts","t"]'&&wr.val.t==="photo: "+s.name+" · "+s.word);
  const Y=P.cpptModel(); ok("…the row leaves the list and the count; the open strip folds; “Set aside” counts it", Y.todo===n0-s.left&&Y.aside===s.left&&!Y.groups.some(g=>g.todo.some(x=>x.h===s.h))&&P._cppt.open===null&&/Set aside \(Not now\)/.test(view(w)));
  P.cpptTap("g","aside"); ok("open Set aside: the row with ↩ Bring back", /↩ Bring back/.test(view(w))&&new RegExp(s.name).test(text(view(w))));
  P.cpptNotNow(s.h,false); ok("↩ Bring back: ONE remove of that record; the row and the count are back", last(w).op==="remove"&&last(w).path==="classes/"+CID+"/dismissed/photo~"+s.h&&P.cpptModel().todo===n0);
  const R=JSON.parse(fs.readFileSync(path.join(REPO,"envirothon","SITE_RULES.json"),"utf8")).rules, D=R.classes.$cid.dismissed;
  const rx=new RegExp(/matches\(\/(.+?)\/\)/.exec(D.$id[".validate"])[1]);
  ok("the rules' dismissed node takes it as it is (CPSUGGEST's rule: the id, by, ts, t ≤ 160) — no new path", rx.test("photo~"+s.h)&&X.slots.every(x=>rx.test("photo~"+x.h))&&!!D.$id.t&&/length <= 160/.test(D.$id.t[".validate"])); }

console.log("\n── live and dry run ──");
{ const w=live(), P=w.P; const s=P.cpptModel().groups[0].todo[0];
  ok("live: 📚 Cards' photo listeners (CPPHOTOS') and the class's skill layer; the list adds none of its own", w.G.listeners.some(l=>l.p==="classPhotos/c1")&&w.G.listeners.some(l=>l.p==="classSkills/c1")&&w.G.reads.length===0);
  P.cpptNotNow(s.h,true); await w.flush();
  ok("live Not now: exactly one Firebase set at that path, by the login", JSON.stringify(w.G.writes)===JSON.stringify([["set","classes/c1/dismissed/photo~"+s.h,{by:"t1",ts:NOW,t:"photo: "+s.name+" · "+s.word}]]));
  ok("…memory waits for the class listener (the row stays until it comes back)", P.cpptModel().todo===P.cpptModel().todo&&!w._envc.cls.dismissed["photo~"+s.h]);
  const d=live({dry:true}); d.P.cpptNotNow(d.P.cpptModel().groups[0].todo[0].h,true); await d.flush(); ok("?dryrun=1: nothing written", d.G.writes.length===0); }

console.log("\n── Adrienne sees the same list ──");
{ const t=demo("teacher"), a=demo("admin"), Xt=t.P.cpptModel(), Xa=a.P.cpptModel();
  ok("admin (demo): the 📷 chip and the same rows and count as the teacher", !!Xa&&Xa.todo===Xt.todo&&JSON.stringify(Xa.slots.map(s=>s.id+s.left))===JSON.stringify(Xt.slots.map(s=>s.id+s.left))&&chipN(a)===Xt.todo);
  const l=live({role:"admin"}); ok("admin (live): on, the same count as a live teacher", l.P.cpptOn()&&l.P.cpptModel().todo===live().P.cpptModel().todo); }

console.log("\n"+pass+" passed, "+fail+" failed"); if(fail) process.exit(1);
};
run().catch(e=>{ console.error(e); process.exit(1); });
